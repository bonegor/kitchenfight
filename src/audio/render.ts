/**
 * Song renderer: compiles a SongDef into timed events, synthesizes each unique instrument
 * sample once, mixes, adds the FDN reverb and masters — all in cooperative time slices.
 *
 * Seamless looping: the buffer holds [intro][loop body][the body repeated for P more seconds]
 * (as many copies as that takes: a loop may be shorter than P). Playback loops over
 * [loopStart + P, loopEnd + P): at both window edges all release/reverb tails of *different*
 * material have decayed, and the material itself is sample-identical, so the seam is exact (no
 * click, no reverb gap).
 */
import { Biquad, clamp, dbToGain, Slicer } from './dsp';
import { INSTRUMENTS, MAX_PRE_SEC, type InstDef, type Sample } from './instruments';
import { applyReverb } from './reverb';
import { compileSong, type SongDef, type TimedEv } from './sequencer';

export interface RenderStats {
  ms: number;
  maxSliceMs: number;
  maxPhase: string;
  synthMs: number;
  mixMs: number;
  revMs: number;
  events: number;
  peak: number;
  samplesSynth: number;
  warnings: string[];
  clipped: number;
  prof: Record<string, { synth: number; n: number; mixed: number }>;
}

export interface RenderOut {
  sr: number;
  left: Float32Array;
  right: Float32Array;
  length: number;
  loop: boolean;
  /** loop window in samples (when loop) */
  loopStart: number;
  loopEnd: number;
  stats: RenderStats;
}

export interface RenderOpts {
  slicer?: Slicer;
  /** allocate output channels (e.g. AudioBuffer.getChannelData) */
  alloc?: (length: number) => [Float32Array, Float32Array];
  /** only render these channels (dev) */
  solo?: string[];
  /** skip master gain/clip (dev measurement) */
  raw?: boolean;
  /** progress 0..1 */
  onProgress?: (p: number) => void;
}

/** seconds of material repeated after the loop end: every ring / release tail must have ended
 *  this long after its note for the seam to be exact (the longest instrument, the sampled tam-tam,
 *  rings 6 s); a longer tail is faded out before the seam (and reported) */
export const LOOP_PAD = 6;
/** a tail cut at the loop seam fades out over this long */
const CAP_FADE_SEC = 0.5;
/** release tails are mixed for this many time constants (≈ -31 dB, then a short fade) */
const TAIL_TAU = 3.6;
/** a choked note fades out over this many seconds, ending at the next note's onset (the
 *  plectrum touching the string damps it just before re-exciting it) */
const CHOKE_SEC = 0.004;
let CHOKE_FADE = 192;
let CAP_FADE = 24000;
/** a note whose pre-roll starts before t = 0 (a first-bar note) fades in from the buffer start: over
 *  CLIP_FADE_MIN_SEC (linear) — and a sustained note, whose clipped pre-roll is a build-up, over as much
 *  of it as was clipped (raised cosine, at most CLIP_FADE_MAX_SEC), but never past its onset: a fade
 *  that reached into the attack would make the note late */
const CLIP_FADE_MIN_SEC = 0.002;
const CLIP_FADE_MAX_SEC = 0.01;
let CLIP_FADE_MIN = 96;
let CLIP_FADE_MAX = 480;

// ---------------------------------------------------------------------------------------------
// Sample cache: plucked/percussive samples are global (LRU by bytes), sustained ones per render.
// ---------------------------------------------------------------------------------------------

const globalCache = new Map<string, Sample>();
const naturalKeys = new Set<string>();
let globalBytes = 0;
const GLOBAL_LIMIT = 40 * 1024 * 1024;

const sampleBytes = (s: Sample): number => (s.l.length + (s.r ? s.r.length : 0)) * 4;

function cachePut(key: string, s: Sample, natural: boolean): void {
  const old = globalCache.get(key);
  if (old) {
    globalBytes -= sampleBytes(old);
    globalCache.delete(key);
  }
  globalCache.set(key, s);
  if (natural) naturalKeys.add(key);
  else naturalKeys.delete(key);
  globalBytes += sampleBytes(s);
  while (globalBytes > GLOBAL_LIMIT && globalCache.size > 1) {
    const first = globalCache.keys().next().value as string;
    const o = globalCache.get(first);
    globalCache.delete(first);
    naturalKeys.delete(first);
    if (o) globalBytes -= sampleBytes(o);
  }
}

/** Drop all cached instrument samples (e.g. on memory pressure). */
export function clearSampleCache(): void {
  globalCache.clear();
  naturalKeys.clear();
  globalBytes = 0;
}

const velAmp = (v: number): number => Math.pow(clamp(v, 0, 1.6), 1.6);

interface MixEv {
  st: number; // start sample (may be negative)
  gate: number; // samples
  inst: InstDef;
  key: string;
  /** channel|pitch (choke groups) */
  voice: string;
  /** output sample where a later note on the same string stops this one (choke), or Infinity */
  chokeAt: number;
  /** output sample by which this note must have ended (loop seam), or Infinity */
  capAt: number;
  /** song time (warnings) */
  t: number;
  ch: string;
  /** constant-power gains for mono samples */
  gl: number;
  gr: number;
  /** balance gains for stereo samples */
  bl: number;
  br: number;
  /** reverb send gain (half-rate send) */
  gs: number;
  /** release: samples to mix after the gate, per-sample decay factor */
  relN: number;
  relK: number;
}

export async function renderSong(song: SongDef, sr: number, opts: RenderOpts = {}): Promise<RenderOut> {
  const t0 = performance.now();
  const slicer = opts.slicer ?? new Slicer(8);
  slicer.phase = 'compile';
  const chInst = (ch: string): InstDef | undefined => {
    const c = song.channels[ch];
    return c ? INSTRUMENTS[c.inst] : undefined;
  };
  const comp = compileSong(song, {
    gate: (ch) => chInst(ch)?.gate ?? 0.9,
    plucked: (ch) => {
      const k = chInst(ch)?.kind;
      return k === 'pluck' || k === 'perc';
    },
  });
  const warnings = comp.warnings.slice();
  const loop = song.loopFrom !== null;
  const loopStartS = Math.round(comp.loopStart * sr);
  // even loop length keeps the half-rate reverb send phase-identical across the seam
  const loopLenS = 2 * Math.round(((comp.loopEnd - comp.loopStart) * sr) / 2);
  const loopEndS = loopStartS + loopLenS;
  const P = Math.round(LOOP_PAD * sr);
  const length = loop ? loopEndS + P : Math.round((comp.end + (song.tail ?? 2.5)) * sr);

  // round-robin variants per channel (a note without a variant cycles through the instrument's
  // rrCycle: takes, never articulations such as rolls or the soft timpani stroke)
  const rr = new Map<string, number>();
  for (const e of comp.events) {
    if (e.vr >= 0) continue;
    const inst = chInst(e.ch);
    const n = inst?.variants ?? 1;
    const cyc = inst?.rrCycle && inst.rrCycle.length ? inst.rrCycle : null;
    const c = rr.get(e.ch) ?? 0;
    e.vr = cyc ? cyc[c % cyc.length] : c % n;
    rr.set(e.ch, c + 1);
  }

  // build mix events (+ seam copies)
  const mixEvs: MixEv[] = [];
  const maxPre = Math.round(MAX_PRE_SEC * sr);
  const lf = loop ? (song.loopFrom as number) : 0;
  const pushEv = (e: TimedEv, shift: number) => {
    if (opts.solo && !opts.solo.includes(e.ch)) return;
    const chDef = song.channels[e.ch];
    const inst = chInst(e.ch);
    if (!chDef || !inst) {
      warnings.push(`no instrument for channel ${e.ch}`);
      return;
    }
    const st = Math.round(e.t * sr) + shift;
    // a note just past the end still starts its pre-roll inside the buffer (seam copies)
    if (st >= length + maxPre) return;
    const amp = velAmp(e.v) * dbToGain(chDef.gain);
    const pan = clamp((chDef.pan ?? 0) + e.pan, -1, 1);
    const a = ((pan + 1) * Math.PI) / 4;
    const vr = Math.max(0, e.vr) % Math.max(1, inst.variants);
    // short notes of slow-attack sampled instruments play their short articulation
    const art = inst.shortArt !== undefined && e.d <= inst.shortArt ? 1 : 0;
    let layer = 0;
    try {
      layer = inst.layerOf ? inst.layerOf(e.v) | 0 : 0;
    } catch {
      layer = 0;
    }
    mixEvs.push({
      st,
      gate: Math.max(1, Math.round(e.d * sr)),
      inst,
      key: `${inst.id}|${e.m}|${vr}|${layer}|${sr}|${art}`,
      voice: `${e.ch}|${e.m}`,
      chokeAt: Infinity,
      // loop songs: intro notes must be silent by loopStart + P, loop-body notes by the buffer end
      // (= the wrap point); seam copies end with the buffer like the originals they copy
      capAt: !loop || shift !== 0 ? Infinity : e.fi < lf ? loopStartS + P : length,
      t: e.t,
      ch: e.ch,
      gl: amp * Math.cos(a) * Math.SQRT2,
      gr: amp * Math.sin(a) * Math.SQRT2,
      bl: amp * (pan > 0 ? 1 - pan : 1),
      br: amp * (pan < 0 ? 1 + pan : 1),
      gs: amp * (chDef.send ?? 0.15) * 0.5,
      relN: Math.round(inst.release * TAIL_TAU * sr),
      relK: Math.exp(-1 / (Math.max(0.001, inst.release) * sr)),
    });
  };
  for (const e of comp.events) pushEv(e, 0);
  if (loop && loopLenS > 0) {
    // the loop body repeated after its end up to the buffer end (plus the notes whose pre-roll
    // starts before it): the window [loopStart + P, loopEnd + P) then holds exactly one period of
    // the endlessly repeated loop. A loop shorter than P + MAX_PRE_SEC needs several copies
    // (pushEv drops the notes that start beyond the buffer)
    const reps = Math.ceil((P + maxPre + 1) / loopLenS);
    for (let k = 1; k <= reps; k++) for (const e of comp.events) if (e.fi >= lf) pushEv(e, k * loopLenS);
  }
  mixEvs.sort((a, b) => a.st - b.st);
  // arranger notes: notes folded by octaves into a sampled instrument's recorded range, or played
  // further than a fourth (+ half a semitone of recording tuning) from their nearest recording
  {
    interface RangeRec { inst: string; up: Set<number>; down: Set<number>; shift: Set<number>; maxShift: number }
    const byCh = new Map<string, RangeRec>();
    const seen = new Set<string>();
    for (const ev of mixEvs) {
      if (!ev.inst.noteInfo) continue;
      const [, mS, , lS] = ev.key.split('|');
      const k = ev.ch + '|' + mS + '|' + lS;
      if (seen.has(k)) continue;
      seen.add(k);
      let info: { fold: number; shift: number } | null = null;
      try {
        info = ev.inst.noteInfo(+mS, +lS);
      } catch {
        info = null;
      }
      if (!info) continue;
      let rec = byCh.get(ev.ch);
      if (!rec) byCh.set(ev.ch, (rec = { inst: ev.inst.id, up: new Set(), down: new Set(), shift: new Set(), maxShift: 0 }));
      if (info.fold > 0) rec.up.add(+mS);
      else if (info.fold < 0) rec.down.add(+mS);
      else if (Math.abs(info.shift) > 5.5) {
        rec.shift.add(+mS);
        if (Math.abs(info.shift) > Math.abs(rec.maxShift)) rec.maxShift = info.shift;
      }
    }
    const list = (xs: Set<number>) => [...xs].sort((a, b) => a - b).join(',');
    for (const [ch, r] of byCh) {
      if (r.down.size) warnings.push(`range: ch ${ch} (${r.inst}): notes ${list(r.down)} are above the recorded range and play an octave lower`);
      if (r.up.size) warnings.push(`range: ch ${ch} (${r.inst}): notes ${list(r.up)} are below the recorded range and play an octave higher`);
      if (r.shift.size) warnings.push(`range: ch ${ch} (${r.inst}): notes ${list(r.shift)} are pitch-shifted by up to ${r.maxShift > 0 ? '+' : ''}${r.maxShift.toFixed(1)} semitones from the nearest recording`);
    }
  }
  // choke: a plucked string re-struck on the same channel/pitch stops the previous note (its
  // fade ends at the new onset)
  CHOKE_FADE = Math.max(16, Math.round(CHOKE_SEC * sr));
  CAP_FADE = Math.round(CAP_FADE_SEC * sr);
  CLIP_FADE_MIN = Math.max(1, Math.round(CLIP_FADE_MIN_SEC * sr));
  CLIP_FADE_MAX = Math.max(CLIP_FADE_MIN, Math.round(CLIP_FADE_MAX_SEC * sr));
  const lastOn = new Map<string, MixEv>();
  for (const ev of mixEvs) {
    if (!ev.inst.choke) continue;
    const prev = lastOn.get(ev.voice);
    if (prev && ev.st > prev.st + CHOKE_FADE) prev.chokeAt = ev.st - CHOKE_FADE;
    lastOn.set(ev.voice, ev);
  }

  // needed sample length per unique sample (seconds; 0 = natural length)
  const need = new Map<string, number>();
  const keyInst = new Map<string, InstDef>();
  for (const ev of mixEvs) {
    keyInst.set(ev.key, ev.inst);
    if (ev.inst.ring) {
      need.set(ev.key, 0);
      continue;
    }
    const n = (ev.gate + ev.relN) / sr + 0.03;
    const cur = need.get(ev.key);
    if (cur === 0) continue;
    if (cur === undefined || n > cur) need.set(ev.key, n);
  }

  // output buffers (+ half-rate reverb send)
  slicer.phase = 'alloc';
  const [L, R] = opts.alloc ? opts.alloc(length) : [new Float32Array(length), new Float32Array(length)];
  const send = new Float32Array((length >> 1) + 2);

  // synthesize unique samples (yield between samples), then mix. Every sample this render needs is
  // held in `local` until the mix is done: the global cache is only for reuse across renders, and its
  // LRU limit may evict a sample made earlier in this same render (a long render of many stereo
  // samples) before the mix reaches it.
  slicer.phase = 'synth';
  const prog = opts.onProgress ?? (() => {});
  prog(0.02);
  let synthDone = 0;
  const synthTotal = need.size;
  const tSynth = performance.now();
  const local = new Map<string, Sample>();
  const prof: RenderStats['prof'] = {};
  let made = 0;
  for (const [key, n] of need) {
    const [id, midiS, vrS, layerS, , artS] = key.split('|');
    const inst = keyInst.get(key) ?? INSTRUMENTS[id];
    const lenSec = n === 0 ? 0 : Math.max(0.5, Math.ceil(n * 4) / 4);
    const tt = performance.now();
    if (inst.kind === 'sustain') {
      local.set(key, safeMake(inst, sr, +midiS, +vrS, Math.max(lenSec, 0.5), +layerS, warnings, +artS));
      track(prof, id, performance.now() - tt);
      made++;
    } else {
      const have = globalCache.get(key);
      const ok = !!have && (naturalKeys.has(key) || (n !== 0 && (have.l.length - (have.pre ?? 0)) / sr >= lenSec - 0.001));
      if (have && ok) {
        globalCache.delete(key);
        globalCache.set(key, have);
        local.set(key, have);
      } else {
        const smp = safeMake(inst, sr, +midiS, +vrS, lenSec, +layerS, warnings, +artS);
        const pre = smp.pre ?? 0;
        cachePut(key, smp, n === 0 || (smp.l.length - pre) / sr < lenSec - 0.01);
        local.set(key, smp);
        track(prof, id, performance.now() - tt);
        made++;
      }
    }
    synthDone++;
    if ((synthDone & 7) === 0) prog(0.02 + 0.43 * (synthDone / Math.max(1, synthTotal)));
    if (slicer.due()) await slicer.yield();
  }
  const synthMs = performance.now() - tSynth;

  slicer.phase = 'mix';
  const tMix = performance.now();
  for (let k = 0; k < mixEvs.length; k++) {
    const ev = mixEvs[k];
    const s = local.get(ev.key);
    if (!s) {
      warnings.push(`missing sample ${ev.key}`);
      continue;
    }
    const pr = (prof[ev.inst.id] = prof[ev.inst.id] ?? { synth: 0, n: 0, mixed: 0 });
    pr.mixed += ev.inst.ring ? s.l.length : Math.min(s.l.length, ev.gate + ev.relN);
    if (mixInto(L, R, send, s, ev)) warnings.push(`ring/release tail faded at the loop seam (ch ${ev.ch} t=${ev.t.toFixed(2)}, ${ev.inst.id})`);
    if ((k & 255) === 0) prog(0.45 + 0.3 * (k / mixEvs.length));
    if ((k & 7) === 0 && slicer.due()) await slicer.yield();
  }
  const mixMs = performance.now() - tMix;
  local.clear();

  // reverb
  slicer.phase = 'reverb';
  prog(0.75);
  const tRev = performance.now();
  await applyReverb(send, L, R, sr, song.reverb, slicer);
  const revMs = performance.now() - tRev;

  // master: gain, DC high-pass, soft clip (memoryless → seam-safe), peak
  let peak = 0;
  let clipped = 0;
  slicer.phase = 'master';
  prog(0.93);
  if (!opts.raw) {
    const g = dbToGain(song.gainDb);
    const hpL = Biquad.hp(sr, 22, 0.6);
    const hpR = Biquad.hp(sr, 22, 0.6);
    const T = 0.62;
    const C = 0.89; // -1 dBFS ceiling
    const K = C - T;
    const BLK = 16384;
    for (let s0 = 0; s0 < length; s0 += BLK) {
      const e0 = Math.min(length, s0 + BLK);
      for (let i = s0; i < e0; i++) {
        let l = hpL.process(L[i] * g);
        let r = hpR.process(R[i] * g);
        const al = l < 0 ? -l : l;
        const ar = r < 0 ? -r : r;
        if (al > T) {
          l = (l < 0 ? -1 : 1) * (T + K * Math.tanh((al - T) / K));
          clipped++;
        }
        if (ar > T) {
          r = (r < 0 ? -1 : 1) * (T + K * Math.tanh((ar - T) / K));
          clipped++;
        }
        L[i] = l;
        R[i] = r;
        const m = al > ar ? al : ar;
        if (m > peak) peak = m;
      }
      if (slicer.due()) await slicer.yield();
    }
    if (!loop) {
      const nf = Math.min(length, Math.round(0.08 * sr));
      for (let i = 0; i < nf; i++) {
        const f = i / nf;
        L[length - 1 - i] *= f;
        R[length - 1 - i] *= f;
      }
    }
  }
  prog(1);
  return {
    sr,
    left: L,
    right: R,
    length,
    loop,
    loopStart: loop ? loopStartS + P : 0,
    loopEnd: loop ? loopEndS + P : length,
    stats: {
      ms: performance.now() - t0,
      maxSliceMs: slicer.maxSlice,
      maxPhase: slicer.maxPhase,
      synthMs,
      mixMs,
      revMs,
      events: mixEvs.length,
      peak,
      samplesSynth: made,
      warnings,
      clipped,
      prof,
    },
  };
}

/** Instrument sample, never throwing (a broken instrument renders silence + a warning). */
function safeMake(inst: InstDef, sr: number, midi: number, vr: number, lenSec: number, layer: number, warnings: string[], art = 0): Sample {
  try {
    const s = art ? inst.make(sr, midi, vr, lenSec, layer, art) : inst.make(sr, midi, vr, lenSec, layer);
    if (s && s.l && s.l.length) return s;
    warnings.push(`empty sample ${inst.id} ${midi}`);
  } catch (e) {
    warnings.push(`instrument ${inst.id} failed: ${String(e)}`);
  }
  return { l: new Float32Array(Math.max(1, Math.round(0.01 * sr))), r: null };
}

function track(prof: RenderStats['prof'], id: string, ms: number): void {
  const p = (prof[id] = prof[id] ?? { synth: 0, n: 0, mixed: 0 });
  p.synth += ms;
  p.n++;
}

/** Onset position of a note gated after `gate` samples (Sample.preAt; the whole note's `pre` when
 *  that fails). */
function preOfGate(s: Sample, gate: number): number {
  const pre = s.pre ?? 0;
  try {
    const p = s.preAt ? s.preAt(gate) : pre;
    return Number.isFinite(p) && p >= 0 ? Math.round(p) : pre;
  } catch {
    return pre;
  }
}

/** Loudness gain of a note gated after `gate` samples (Sample.gainAt; 1 when that fails). */
function gainOfGate(s: Sample, gate: number): number {
  try {
    const g = s.gainAt ? s.gainAt(gate) : 1;
    return Number.isFinite(g) && g > 0 ? g : 1;
  } catch {
    return 1;
  }
}

/** Mix one note; returns true when its tail had to be faded at ev.capAt (loop seam). */
function mixInto(L: Float32Array, R: Float32Array, S: Float32Array, s: Sample, ev: MixEv): boolean {
  const len = L.length;
  const sl = s.l;
  const sr2 = s.r;
  const slen = sl.length;
  const ring = !!ev.inst.ring;
  // recorded samples start `pre` samples before their onset: start early so the onset is on time
  // (short notes of spread attacks: the onset of the note as gated, see Sample.preAt)
  const pre = s.preAt && !ring ? preOfGate(s, ev.gate) : s.pre ?? 0;
  const st = ev.st - pre;
  // indices relative to the sample start: release starts at the gate end — `gate` samples after the
  // onset, or for a sustained recording after its gate anchor (Sample.ga: the note keeps the sounding
  // length the songs were written against, placed so its perceptual onset is on the beat); the end
  // fade is 64 samples after a release, CHOKE_FADE when the next note on the string cuts it short,
  // and CAP_FADE when the note would ring past the loop seam
  const anchor = s.ga !== undefined && Number.isFinite(s.ga) ? Math.max(0, s.ga) : pre;
  const relStart = ring ? slen : Math.min(slen, anchor + ev.gate);
  let total = ring ? slen : Math.min(slen, anchor + ev.gate + ev.relN);
  let fadeN = 64;
  let capped = false;
  const choke = ev.chokeAt === Infinity ? Infinity : ev.chokeAt - st + CHOKE_FADE;
  if (choke < total) {
    total = choke;
    fadeN = CHOKE_FADE;
  }
  const cap = ev.capAt === Infinity ? Infinity : ev.capAt - st;
  if (cap < total) {
    total = Math.max(0, cap);
    fadeN = Math.max(64, Math.min(CAP_FADE, total >> 1));
    capped = true;
  }
  fadeN = Math.max(1, Math.min(fadeN, total));
  const i0 = st < 0 ? -st : 0;
  const iEnd = Math.min(total, len - st);
  if (iEnd <= i0) return capped;
  // plain copy up to the release / end fade, then release decay × end fade
  const a = Math.max(i0, Math.min(relStart, total - fadeN, iEnd));
  const k = ev.relK;
  // two takes summed: the note at the loudness the songs were balanced with (Sample.gainAt)
  const lg = s.gainAt ? gainOfGate(s, ev.gate) : 1;
  const gs = ev.gs * lg;
  // a note clipped at the start of the buffer (pre-roll before t = 0) fades in: plucked / struck notes
  // over CLIP_FADE_MIN (their transient is right at the onset); sustained notes over the build-up they
  // lost, up to CLIP_FADE_MAX but ending by their onset (ev.st), raised cosine
  const sus = ev.inst.kind === 'sustain';
  const nIn = i0 <= 0 ? 0 : Math.min(a - i0, sus ? Math.max(CLIP_FADE_MIN, Math.min(i0, CLIP_FADE_MAX, ev.st)) : CLIP_FADE_MIN);
  const fin = sus ? (i: number): number => 0.5 - 0.5 * Math.cos((Math.PI * (i - i0 + 0.5)) / nIn) : (i: number): number => (i - i0) / nIn;
  if (sr2) {
    const gL = ev.bl * lg;
    const gR = ev.br * lg;
    const gs2 = gs * 0.5;
    for (let i = i0; i < a; i++) {
      const f = i - i0 < nIn ? fin(i) : 1;
      const vl = sl[i] * f;
      const vr = sr2[i] * f;
      const j = st + i;
      L[j] += vl * gL;
      R[j] += vr * gR;
      S[j >> 1] += (vl + vr) * gs2;
    }
    let env = 1;
    for (let i = a; i < iEnd; i++) {
      if (i >= relStart) env *= k;
      const e = total - i < fadeN ? (env * (total - i)) / fadeN : env;
      const j = st + i;
      const vl = sl[i] * e;
      const vr = sr2[i] * e;
      L[j] += vl * gL;
      R[j] += vr * gR;
      S[j >> 1] += (vl + vr) * gs2;
    }
    return capped;
  }
  const gl = ev.gl * lg;
  const gr = ev.gr * lg;
  if (nIn > 0) {
    for (let i = i0; i < i0 + nIn; i++) {
      const v = sl[i] * fin(i);
      const j = st + i;
      L[j] += v * gl;
      R[j] += v * gr;
      S[j >> 1] += v * gs;
    }
  }
  if (gs === 0) {
    for (let i = i0 + nIn; i < a; i++) {
      const v = sl[i];
      const j = st + i;
      L[j] += v * gl;
      R[j] += v * gr;
    }
  } else {
    for (let i = i0 + nIn; i < a; i++) {
      const v = sl[i];
      const j = st + i;
      L[j] += v * gl;
      R[j] += v * gr;
      S[j >> 1] += v * gs;
    }
  }
  let env = 1;
  for (let i = a; i < iEnd; i++) {
    if (i >= relStart) env *= k;
    const v = sl[i] * (total - i < fadeN ? (env * (total - i)) / fadeN : env);
    const j = st + i;
    L[j] += v * gl;
    R[j] += v * gr;
    S[j >> 1] += v * gs;
  }
  return capped;
}
