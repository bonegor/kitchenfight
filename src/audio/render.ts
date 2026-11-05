/**
 * Song renderer: compiles a SongDef into timed events, synthesizes each unique instrument
 * sample once, mixes, adds the FDN reverb and masters — all in cooperative time slices.
 *
 * Seamless looping: the buffer holds [intro][loop body][first P seconds of the body again].
 * Playback loops over [loopStart + P, loopEnd + P): at both window edges all release/reverb
 * tails of *different* material have decayed, and the material itself is sample-identical, so
 * the seam is exact (no click, no reverb gap).
 */
import { Biquad, clamp, dbToGain, Slicer } from './dsp';
import { INSTRUMENTS, type InstDef, type Sample } from './instruments';
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

/** seconds of material repeated after the loop end */
export const LOOP_PAD = 4;
/** release tails are mixed for this many time constants (≈ -31 dB, then a short fade) */
const TAIL_TAU = 3.6;

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

  // round-robin variants per channel
  const rr = new Map<string, number>();
  for (const e of comp.events) {
    if (e.vr >= 0) continue;
    const n = chInst(e.ch)?.variants ?? 1;
    const c = rr.get(e.ch) ?? 0;
    e.vr = c % n;
    rr.set(e.ch, c + 1);
  }

  // build mix events (+ seam copies)
  const mixEvs: MixEv[] = [];
  const pushEv = (e: TimedEv, shift: number) => {
    if (opts.solo && !opts.solo.includes(e.ch)) return;
    const chDef = song.channels[e.ch];
    const inst = chInst(e.ch);
    if (!chDef || !inst) {
      warnings.push(`no instrument for channel ${e.ch}`);
      return;
    }
    const st = Math.round(e.t * sr) + shift;
    if (st >= length) return;
    const amp = velAmp(e.v) * dbToGain(chDef.gain);
    const pan = clamp((chDef.pan ?? 0) + e.pan, -1, 1);
    const a = ((pan + 1) * Math.PI) / 4;
    const vr = Math.max(0, e.vr) % Math.max(1, inst.variants);
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
      key: `${inst.id}|${e.m}|${vr}|${layer}|${sr}`,
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
  if (loop) {
    const lf = song.loopFrom as number;
    const lim = comp.loopStart + LOOP_PAD + 0.001;
    for (const e of comp.events) if (e.fi >= lf && e.t < lim) pushEv(e, loopLenS);
    // sanity: nothing from before the loop may still sound at loopStart + P
    for (const e of comp.events) {
      if (e.fi >= lf) continue;
      const inst = chInst(e.ch);
      if (!inst) continue;
      const endT = inst.ring ? e.t + 3.5 : e.t + e.d + inst.release * TAIL_TAU;
      if (endT > comp.loopStart + LOOP_PAD) warnings.push(`event before the loop rings past the seam (ch ${e.ch} t=${e.t.toFixed(2)})`);
    }
  }
  mixEvs.sort((a, b) => a.st - b.st);

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

  // synthesize unique samples (yield between samples), then mix
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
    const [id, midiS, vrS, layerS] = key.split('|');
    const inst = keyInst.get(key) ?? INSTRUMENTS[id];
    const lenSec = n === 0 ? 0 : Math.max(0.5, Math.ceil(n * 4) / 4);
    const tt = performance.now();
    if (inst.kind === 'sustain') {
      local.set(key, safeMake(inst, sr, +midiS, +vrS, Math.max(lenSec, 0.5), +layerS, warnings));
      track(prof, id, performance.now() - tt);
      made++;
    } else {
      const have = globalCache.get(key);
      const ok = !!have && (naturalKeys.has(key) || (n !== 0 && (have.l.length - (have.pre ?? 0)) / sr >= lenSec - 0.001));
      if (have && ok) {
        globalCache.delete(key);
        globalCache.set(key, have);
      } else {
        const smp = safeMake(inst, sr, +midiS, +vrS, lenSec, +layerS, warnings);
        const pre = smp.pre ?? 0;
        cachePut(key, smp, n === 0 || (smp.l.length - pre) / sr < lenSec - 0.01);
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
    const s = ev.inst.kind === 'sustain' ? local.get(ev.key) : globalCache.get(ev.key);
    if (!s) {
      warnings.push(`missing sample ${ev.key}`);
      continue;
    }
    const pr = (prof[ev.inst.id] = prof[ev.inst.id] ?? { synth: 0, n: 0, mixed: 0 });
    pr.mixed += ev.inst.ring ? s.l.length : Math.min(s.l.length, ev.gate + ev.relN);
    mixInto(L, R, send, s, ev);
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
function safeMake(inst: InstDef, sr: number, midi: number, vr: number, lenSec: number, layer: number, warnings: string[]): Sample {
  try {
    const s = inst.make(sr, midi, vr, lenSec, layer);
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

function mixInto(L: Float32Array, R: Float32Array, S: Float32Array, s: Sample, ev: MixEv): void {
  const len = L.length;
  const sl = s.l;
  const sr2 = s.r;
  const slen = sl.length;
  const ring = !!ev.inst.ring;
  // recorded samples start `pre` samples before their onset: start early so the onset is on time
  const pre = s.pre ?? 0;
  const st = ev.st - pre;
  const gateEnd = ring ? slen : Math.min(slen, pre + ev.gate);
  const total = ring ? slen : Math.min(slen, pre + ev.gate + ev.relN);
  const i0 = st < 0 ? -st : 0;
  const iEnd = Math.min(total, len - st);
  if (iEnd <= i0) return;
  const a = Math.max(i0, Math.min(gateEnd, iEnd));
  const k = ev.relK;
  const gs = ev.gs;
  if (sr2) {
    const gL = ev.bl;
    const gR = ev.br;
    const gs2 = gs * 0.5;
    for (let i = i0; i < a; i++) {
      const vl = sl[i];
      const vr = sr2[i];
      const j = st + i;
      L[j] += vl * gL;
      R[j] += vr * gR;
      S[j >> 1] += (vl + vr) * gs2;
    }
    let env = 1;
    for (let i = a; i < iEnd; i++) {
      env *= k;
      const e = total - i < 64 ? (env * (total - i)) / 64 : env;
      const j = st + i;
      const vl = sl[i] * e;
      const vr = sr2[i] * e;
      L[j] += vl * gL;
      R[j] += vr * gR;
      S[j >> 1] += (vl + vr) * gs2;
    }
    return;
  }
  const gl = ev.gl;
  const gr = ev.gr;
  if (gs === 0) {
    for (let i = i0; i < a; i++) {
      const v = sl[i];
      const j = st + i;
      L[j] += v * gl;
      R[j] += v * gr;
    }
  } else {
    for (let i = i0; i < a; i++) {
      const v = sl[i];
      const j = st + i;
      L[j] += v * gl;
      R[j] += v * gr;
      S[j >> 1] += v * gs;
    }
  }
  let env = 1;
  for (let i = a; i < iEnd; i++) {
    env *= k;
    const v = sl[i] * (total - i < 64 ? (env * (total - i)) / 64 : env);
    const j = st + i;
    L[j] += v * gl;
    R[j] += v * gr;
    S[j >> 1] += v * gs;
  }
}
