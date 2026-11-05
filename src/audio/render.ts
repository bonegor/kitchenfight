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

export interface RenderOut {
  sr: number;
  left: Float32Array;
  right: Float32Array;
  length: number;
  loop: boolean;
  /** loop window in samples (when loop) */
  loopStart: number;
  loopEnd: number;
  stats: {
    ms: number;
    maxSliceMs: number;
    events: number;
    peak: number;
    samplesSynth: number;
    warnings: string[];
    clipped: number;
  };
}

export interface RenderOpts {
  slicer?: Slicer;
  /** allocate output channels (e.g. AudioBuffer.getChannelData) */
  alloc?: (length: number) => [Float32Array, Float32Array];
  /** only render these channels (dev) */
  solo?: string[];
  /** skip master gain/clip (dev measurement) */
  raw?: boolean;
}

/** seconds of material repeated after the loop end */
export const LOOP_PAD = 4;

// ---------------------------------------------------------------------------------------------
// Sample cache: plucked/percussive samples are global (LRU by bytes), sustained ones per render.
// ---------------------------------------------------------------------------------------------

const globalCache = new Map<string, Sample>();
let globalBytes = 0;
const GLOBAL_LIMIT = 48 * 1024 * 1024;

function sampleBytes(s: Sample): number {
  return (s.l.length + (s.r ? s.r.length : 0)) * 4;
}

function getSample(inst: InstDef, sr: number, midi: number, vr: number, lenSec: number, local: Map<string, Sample>): { s: Sample; made: boolean } {
  const key = `${inst.id}|${midi}|${vr}|${lenSec}|${sr}`;
  if (inst.kind === 'sustain') {
    let s = local.get(key);
    if (s) return { s, made: false };
    s = inst.make(sr, midi, vr, lenSec);
    local.set(key, s);
    return { s, made: true };
  }
  let s = globalCache.get(key);
  if (s) {
    // refresh LRU position
    globalCache.delete(key);
    globalCache.set(key, s);
    return { s, made: false };
  }
  s = inst.make(sr, midi, vr, lenSec);
  globalCache.set(key, s);
  globalBytes += sampleBytes(s);
  while (globalBytes > GLOBAL_LIMIT && globalCache.size > 1) {
    const first = globalCache.keys().next().value as string;
    const old = globalCache.get(first);
    globalCache.delete(first);
    if (old) globalBytes -= sampleBytes(old);
  }
  return { s, made: true };
}

const velAmp = (v: number): number => Math.pow(clamp(v, 0, 1.6), 1.6);

interface MixEv {
  st: number; // start sample (may be negative)
  gate: number; // samples
  inst: InstDef;
  midi: number;
  vr: number;
  lenSec: number;
  /** constant-power gains for mono samples */
  gl: number;
  gr: number;
  /** balance gains for stereo samples */
  bl: number;
  br: number;
  /** reverb send gain */
  gs: number;
  /** release: samples to mix after the gate, per-sample decay factor */
  relN: number;
  relK: number;
}

export async function renderSong(song: SongDef, sr: number, opts: RenderOpts = {}): Promise<RenderOut> {
  const t0 = performance.now();
  const slicer = opts.slicer ?? new Slicer(8);
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
  const loopEndS = Math.round(comp.loopEnd * sr);
  const loopLenS = loopEndS - loopStartS;
  const P = Math.round(LOOP_PAD * sr);
  const length = loop ? loopEndS + P : Math.round((comp.end + (song.tail ?? 2.5)) * sr);

  // round-robin variants per channel
  const rr = new Map<string, number>();
  for (const e of comp.events) {
    if (e.vr >= 0) continue;
    const inst = chInst(e.ch);
    const n = inst?.variants ?? 1;
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
    const gate = Math.max(1, Math.round(e.d * sr));
    let lenSec = 0;
    if (inst.kind === 'sustain') {
      const need = e.d + inst.release * 6 + 0.05;
      const base = inst.sustainLen ?? 2.5;
      lenSec = need <= base ? base : Math.ceil(need * 2) / 2;
    }
    const amp = velAmp(e.v) * dbToGain(chDef.gain);
    const pan = clamp((chDef.pan ?? 0) + e.pan, -1, 1);
    const a = ((pan + 1) * Math.PI) / 4;
    mixEvs.push({
      st,
      gate,
      inst,
      midi: e.m,
      vr: e.vr,
      lenSec,
      gl: amp * Math.cos(a) * Math.SQRT2,
      gr: amp * Math.sin(a) * Math.SQRT2,
      bl: amp * (pan > 0 ? 1 - pan : 1),
      br: amp * (pan < 0 ? 1 + pan : 1),
      gs: amp * (chDef.send ?? 0.15),
      relN: Math.round(inst.release * 6 * sr),
      relK: Math.exp(-1 / (Math.max(0.001, inst.release) * sr)),
    });
  };
  for (const e of comp.events) pushEv(e, 0);
  if (loop) {
    const lim = comp.loopStart + LOOP_PAD + 0.001;
    for (const e of comp.events) if (e.fi >= (song.loopFrom as number) && e.t < lim) pushEv(e, loopLenS);
    // sanity: nothing from before the loop may still sound at loopStart + P
    for (const e of comp.events) {
      if (e.fi >= (song.loopFrom as number)) continue;
      const inst = chInst(e.ch);
      if (!inst) continue;
      const endT = inst.ring ? e.t + 3.5 : e.t + e.d + inst.release * 6;
      if (endT > comp.loopStart + LOOP_PAD) warnings.push(`event in intro rings past the loop seam (ch ${e.ch} t=${e.t.toFixed(2)})`);
    }
  }
  mixEvs.sort((a, b) => a.st - b.st);

  // output buffers
  const [L, R] = opts.alloc ? opts.alloc(length) : [new Float32Array(length), new Float32Array(length)];
  const send = new Float32Array(length);

  // synthesize + mix
  const local = new Map<string, Sample>();
  let made = 0;
  for (let k = 0; k < mixEvs.length; k++) {
    const ev = mixEvs[k];
    const { s, made: m } = getSample(ev.inst, sr, ev.midi, ev.vr, ev.lenSec, local);
    if (m) made++;
    mixInto(L, R, send, s, ev);
    if ((k & 7) === 0 && slicer.due()) await slicer.yield();
  }
  local.clear();

  // reverb
  await applyReverb(send, L, R, sr, song.reverb, slicer);

  // master: gain, DC high-pass, soft clip, peak
  let peak = 0;
  let clipped = 0;
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
      events: mixEvs.length,
      peak,
      samplesSynth: made,
      warnings,
      clipped,
    },
  };
}

function mixInto(L: Float32Array, R: Float32Array, S: Float32Array, s: Sample, ev: MixEv): void {
  const len = L.length;
  const sl = s.l;
  const sr2 = s.r;
  const slen = sl.length;
  const ring = !!ev.inst.ring;
  const gateEnd = ring ? slen : Math.min(slen, ev.gate);
  const total = ring ? slen : Math.min(slen, ev.gate + ev.relN);
  const i0 = ev.st < 0 ? -ev.st : 0;
  const iEnd = Math.min(total, len - ev.st);
  if (iEnd <= i0) return;
  const st = ev.st;
  const a = Math.max(i0, Math.min(gateEnd, iEnd));
  const k = ev.relK;
  if (sr2) {
    const gL = ev.bl;
    const gR = ev.br;
    const gs = ev.gs * 0.5;
    for (let i = i0; i < a; i++) {
      const vl = sl[i];
      const vr = sr2[i];
      const j = st + i;
      L[j] += vl * gL;
      R[j] += vr * gR;
      S[j] += (vl + vr) * gs;
    }
    let env = 1;
    for (let i = a; i < iEnd; i++) {
      env *= k;
      const e = iEnd - i < 64 ? (env * (iEnd - i)) / 64 : env;
      const j = st + i;
      const vl = sl[i] * e;
      const vr = sr2[i] * e;
      L[j] += vl * gL;
      R[j] += vr * gR;
      S[j] += (vl + vr) * gs;
    }
    return;
  }
  const gl = ev.gl;
  const gr = ev.gr;
  const gs = ev.gs;
  for (let i = i0; i < a; i++) {
    const v = sl[i];
    const j = st + i;
    L[j] += v * gl;
    R[j] += v * gr;
    S[j] += v * gs;
  }
  let env = 1;
  for (let i = a; i < iEnd; i++) {
    env *= k;
    const v = sl[i] * (iEnd - i < 64 ? (env * (iEnd - i)) / 64 : env);
    const j = st + i;
    L[j] += v * gl;
    R[j] += v * gr;
    S[j] += v * gs;
  }
}
