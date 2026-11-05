/**
 * Instrument synthesizers for the music renderer.
 *
 * Each instrument renders one cached *sample* per (pitch, variant): plucked/struck instruments
 * render their natural decay, sustained ones render attack + a sustain region; the mixer applies
 * the note length (release fade at note-off). All synthesis is deterministic.
 */
import {
  addPartials,
  Biquad,
  buildTable,
  centsToRatio,
  clamp,
  fadeEdges,
  hashStr,
  ksString,
  maxHarmonics,
  mtof,
  Rng,
  schroederPhases,
  Svf,
  TABLE_SIZE,
  TAU,
  trimTail,
} from './dsp';

const SINE_N = 4096;
const SINE = (() => {
  const t = new Float32Array(SINE_N);
  for (let i = 0; i < SINE_N; i++) t[i] = Math.sin((TAU * i) / SINE_N);
  return t;
})();

export interface Sample {
  l: Float32Array;
  r: Float32Array | null;
}

export interface InstDef {
  id: string;
  kind: 'pluck' | 'sustain' | 'perc';
  /** number of alternating variants (round-robin) */
  variants: number;
  /** release time constant (s) applied at note-off; ignored when ring */
  release: number;
  /** let the sample ring past note-off */
  ring?: boolean;
  /** default sustain sample length (s) for sustain instruments */
  sustainLen?: number;
  /** default gate (fraction of the written duration) */
  gate?: number;
  make(sr: number, midi: number, variant: number, lenSec: number): Sample;
}

// ---------------------------------------------------------------------------------------------
// Wavetable helpers
// ---------------------------------------------------------------------------------------------

type Timbre = (k: number, f: number, f0: number) => number;
const tableCache = new Map<string, Float32Array>();

function table(id: string, timbre: Timbre, sr: number, f0: number, limitHz = 16000, ph: 'zero' | 'schroeder' = 'schroeder'): Float32Array {
  const key = `${id}|${f0.toFixed(3)}|${sr}|${limitHz}`;
  let t = tableCache.get(key);
  if (t) return t;
  const H = Math.min(maxHarmonics(sr, f0, limitHz), TABLE_SIZE / 2 - 2);
  const amps = new Float64Array(H + 1);
  for (let k = 1; k <= H; k++) amps[k] = timbre(k, k * f0, f0);
  t = buildTable(amps, ph === 'schroeder' ? schroederPhases(H) : undefined);
  tableCache.set(key, t);
  return t;
}

/** log-gaussian bump centred at fc (Hz) with width w (octaves) */
const bump = (f: number, fc: number, w: number): number => {
  const x = Math.log2(f / fc) / w;
  return Math.exp(-0.5 * x * x);
};
const rolloff = (f: number, fc: number, order = 4): number => 1 / (1 + Math.pow(f / fc, order));
const lorentz = (f: number, fc: number, bw: number): number => {
  const x = (f - fc) / (bw * 0.5);
  return 1 / (1 + x * x);
};

interface OscOpts {
  detune?: number; // cents
  vibRate?: number; // Hz
  vibDepth?: number; // cents
  vibDelay?: number; // s
  vibRamp?: number; // s
  vibPhase?: number;
  phase?: number; // 0..1
  pitch?: (t: number) => number; // extra ratio over time
  drift?: number; // cents of slow wander
  driftRate?: number;
}

/** Render a wavetable oscillator × env into out (and out2) with gains g1/g2. */
function osc(
  out: Float32Array,
  out2: Float32Array | null,
  g1: number,
  g2: number,
  tbl: Float32Array,
  sr: number,
  f0: number,
  env: Float32Array,
  o: OscOpts = {},
): void {
  oscMulti(out, out2, tbl, sr, f0, env, [{ ...o, gl: g1, gr: g2 }]);
}

interface Voice extends OscOpts {
  gl: number;
  gr: number;
}

/** Several detuned voices reading one table, summed per sample (one output write per channel). */
function oscMulti(outL: Float32Array, outR: Float32Array | null, tbl: Float32Array, sr: number, f0: number, env: Float32Array, voices: Voice[]): void {
  const N = TABLE_SIZE;
  const mask = N - 1;
  const nv = voices.length;
  const ph = new Float64Array(nv);
  const inc = new Float64Array(nv);
  const gl = new Float64Array(nv);
  const gr = new Float64Array(nv);
  const det = new Float64Array(nv);
  const vd = new Float64Array(nv);
  const vdel = new Float64Array(nv);
  const vramp = new Float64Array(nv);
  const vrate = new Float64Array(nv);
  const vph = new Float64Array(nv);
  const dr = new Float64Array(nv);
  const drr = new Float64Array(nv);
  const pitchFns: Array<((t: number) => number) | undefined> = [];
  for (let k = 0; k < nv; k++) {
    const o = voices[k];
    ph[k] = (o.phase ?? 0) * N;
    gl[k] = o.gl;
    gr[k] = o.gr;
    det[k] = centsToRatio(o.detune ?? 0);
    vd[k] = (o.vibDepth ?? 0) * 0.000578;
    vdel[k] = o.vibDelay ?? 0;
    vramp[k] = Math.max(1e-3, o.vibRamp ?? 0.2);
    vrate[k] = TAU * (o.vibRate ?? 5);
    vph[k] = o.vibPhase ?? 0;
    dr[k] = (o.drift ?? 0) * 0.000578;
    drr[k] = TAU * (o.driftRate ?? 0.4);
    pitchFns.push(o.pitch);
  }
  const anyPitch = pitchFns.some((f) => !!f);
  const k0 = (f0 * N) / sr;
  const len = Math.min(outL.length, env.length);
  for (let b = 0; b < len; b += 32) {
    const be = Math.min(len, b + 32);
    const t = b / sr;
    for (let k = 0; k < nv; k++) {
      let ratio = det[k];
      if (vd[k] > 0 && t > vdel[k]) {
        const amt = Math.min(1, (t - vdel[k]) / vramp[k]);
        ratio *= 1 + vd[k] * amt * Math.sin(vrate[k] * t + vph[k]);
      }
      if (dr[k] > 0) ratio *= 1 + dr[k] * (0.6 * Math.sin(drr[k] * t + vph[k] * 1.7) + 0.4 * Math.sin(drr[k] * 2.31 * t + vph[k]));
      if (anyPitch) {
        const fn = pitchFns[k];
        if (fn) ratio *= fn(t);
      }
      inc[k] = k0 * ratio;
    }
    if (outR && nv === 3) {
      // unrolled hot path (musette accordion, pads)
      let p0 = ph[0];
      let p1 = ph[1];
      let p2 = ph[2];
      const i0c = inc[0];
      const i1c = inc[1];
      const i2c = inc[2];
      const l0 = gl[0];
      const l1 = gl[1];
      const l2 = gl[2];
      const r0 = gr[0];
      const r1 = gr[1];
      const r2 = gr[2];
      for (let i = b; i < be; i++) {
        let ip = p0 | 0;
        let j = ip & mask;
        let a = tbl[j];
        const v0 = a + (tbl[j + 1] - a) * (p0 - ip);
        ip = p1 | 0;
        j = ip & mask;
        a = tbl[j];
        const v1 = a + (tbl[j + 1] - a) * (p1 - ip);
        ip = p2 | 0;
        j = ip & mask;
        a = tbl[j];
        const v2 = a + (tbl[j + 1] - a) * (p2 - ip);
        const e = env[i];
        outL[i] += (v0 * l0 + v1 * l1 + v2 * l2) * e;
        outR[i] += (v0 * r0 + v1 * r1 + v2 * r2) * e;
        p0 += i0c;
        if (p0 >= N) p0 -= N;
        p1 += i1c;
        if (p1 >= N) p1 -= N;
        p2 += i2c;
        if (p2 >= N) p2 -= N;
      }
      ph[0] = p0;
      ph[1] = p1;
      ph[2] = p2;
    } else if (outR && nv === 4) {
      // unrolled hot path (strings, choir)
      let p0 = ph[0];
      let p1 = ph[1];
      let p2 = ph[2];
      let p3 = ph[3];
      const i0c = inc[0];
      const i1c = inc[1];
      const i2c = inc[2];
      const i3c = inc[3];
      const l0 = gl[0];
      const l1 = gl[1];
      const l2 = gl[2];
      const l3 = gl[3];
      const r0 = gr[0];
      const r1 = gr[1];
      const r2 = gr[2];
      const r3 = gr[3];
      for (let i = b; i < be; i++) {
        let ip = p0 | 0;
        let j = ip & mask;
        let a = tbl[j];
        const v0 = a + (tbl[j + 1] - a) * (p0 - ip);
        ip = p1 | 0;
        j = ip & mask;
        a = tbl[j];
        const v1 = a + (tbl[j + 1] - a) * (p1 - ip);
        ip = p2 | 0;
        j = ip & mask;
        a = tbl[j];
        const v2 = a + (tbl[j + 1] - a) * (p2 - ip);
        ip = p3 | 0;
        j = ip & mask;
        a = tbl[j];
        const v3 = a + (tbl[j + 1] - a) * (p3 - ip);
        const e = env[i];
        outL[i] += (v0 * l0 + v1 * l1 + v2 * l2 + v3 * l3) * e;
        outR[i] += (v0 * r0 + v1 * r1 + v2 * r2 + v3 * r3) * e;
        p0 += i0c;
        if (p0 >= N) p0 -= N;
        p1 += i1c;
        if (p1 >= N) p1 -= N;
        p2 += i2c;
        if (p2 >= N) p2 -= N;
        p3 += i3c;
        if (p3 >= N) p3 -= N;
      }
      ph[0] = p0;
      ph[1] = p1;
      ph[2] = p2;
      ph[3] = p3;
    } else if (outR) {
      for (let i = b; i < be; i++) {
        let sl = 0;
        let sr2 = 0;
        for (let k = 0; k < nv; k++) {
          const p = ph[k];
          const ip = p | 0;
          const i0 = ip & mask;
          const a = tbl[i0];
          const v = a + (tbl[i0 + 1] - a) * (p - ip);
          sl += v * gl[k];
          sr2 += v * gr[k];
          const np = p + inc[k];
          ph[k] = np >= N ? np - N : np;
        }
        const e = env[i];
        outL[i] += sl * e;
        outR[i] += sr2 * e;
      }
    } else {
      for (let i = b; i < be; i++) {
        let sl = 0;
        for (let k = 0; k < nv; k++) {
          const p = ph[k];
          const ip = p | 0;
          const i0 = ip & mask;
          const a = tbl[i0];
          sl += (a + (tbl[i0 + 1] - a) * (p - ip)) * gl[k];
          const np = p + inc[k];
          ph[k] = np >= N ? np - N : np;
        }
        outL[i] += sl * env[i];
      }
    }
  }
}

/** constant-power pan gains for p in -1..1 */
const panGains = (p: number): [number, number] => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

/** Attack/decay/sustain envelope array; smooth (raised-cosine) attack; fade at the very end. */
function envADS(sr: number, len: number, att: number, dec: number, sus: number, peak = 1, attCurve = 1): Float32Array {
  const e = new Float32Array(len);
  const na = Math.min(len, Math.max(1, Math.round(att * sr)));
  // raised cosine via phasor recurrence: y = 0.5 - 0.5 cos(pi x)
  const d = Math.PI / na;
  const cd = Math.cos(d);
  const sd = Math.sin(d);
  let c = 1;
  let sn = 0;
  for (let i = 0; i < na; i++) {
    const y = 0.5 - 0.5 * c;
    e[i] = peak * (attCurve === 1 ? y : attCurve === 2 ? y * y : y * Math.sqrt(y));
    const nc = c * cd - sn * sd;
    sn = sn * cd + c * sd;
    c = nc;
  }
  const kd = dec > 0 ? Math.exp(-1 / (dec * sr)) : 0;
  let diff = peak - sus;
  for (let i = na; i < len; i++) {
    diff *= kd;
    if (diff < 1e-9 && diff > -1e-9) diff = 0;
    e[i] = sus + diff;
  }
  const nf = Math.min(len, Math.round(0.012 * sr));
  for (let i = 0; i < nf; i++) e[len - 1 - i] *= i / nf;
  return e;
}

function normalize(s: Sample, target: number): Sample {
  let p = 1e-9;
  for (let i = 0; i < s.l.length; i++) p = Math.max(p, Math.abs(s.l[i]));
  if (s.r) for (let i = 0; i < s.r.length; i++) p = Math.max(p, Math.abs(s.r[i]));
  const g = target / p;
  for (let i = 0; i < s.l.length; i++) s.l[i] *= g;
  if (s.r) for (let i = 0; i < s.r.length; i++) s.r[i] *= g;
  return s;
}

/** Normalise by RMS over [0, win] seconds instead of peak (good for sustained tones). */
function normalizeRms(s: Sample, sr: number, target: number, win = 0.5): Sample {
  const n = Math.min(s.l.length, Math.round(win * sr));
  let acc = 0;
  for (let i = 0; i < n; i++) acc += s.l[i] * s.l[i] + (s.r ? s.r[i] * s.r[i] : s.l[i] * s.l[i]);
  const rms = Math.sqrt(acc / (2 * n)) + 1e-9;
  const g = target / rms;
  for (let i = 0; i < s.l.length; i++) s.l[i] *= g;
  if (s.r) for (let i = 0; i < s.r.length; i++) s.r[i] *= g;
  return s;
}

function eq(buf: Float32Array, filters: Biquad[]): void {
  for (const f of filters) f.run(buf);
}

/** requested length (s) capped at the natural length; 0 = natural */
const want = (natural: number, lenSec: number): number => (lenSec > 0 ? Math.min(natural, Math.max(0.15, lenSec)) : natural);

const seedOf = (id: string, midi: number, v: number): number => hashStr(id) ^ Math.imul(midi + 1, 2654435761) ^ Math.imul(v + 7, 40503);

// ---------------------------------------------------------------------------------------------
// Timbres
// ---------------------------------------------------------------------------------------------

/** free-reed accordion: saw/pulse mix, presence formants, gentle top roll-off */
const reedTimbre = (bright: number): Timbre => (k, f) =>
  (0.62 / Math.pow(k, 0.8) + (0.38 * Math.abs(Math.sin(Math.PI * k * 0.31))) / k) *
  (1 + 1.1 * bump(f, 1300, 0.55) + 0.9 * bump(f, 3000, 0.4) + 0.35 * bump(f, 5500, 0.3)) *
  rolloff(f, 6500 * bright, 2.5) *
  (f < 200 ? f / 200 : 1);

const stringTimbre: Timbre = (k, f) =>
  (1 / k) * (0.55 + 0.8 * bump(f, 450, 0.5) + 0.6 * bump(f, 1100, 0.45) + 1.0 * bump(f, 2800, 0.45)) * rolloff(f, 6500, 4) * (f < 180 ? (f / 180) ** 2 : 1);

const tubaTimbre = (fc: number): Timbre => (k, f) =>
  (1 / Math.pow(k, 0.55)) * (0.55 + 1.1 * bump(f, 190, 0.8) + 0.45 * bump(f, 1000, 0.5)) * (f > 260 && f < 600 ? 0.6 : 1) * rolloff(f, fc, 4);

const sawTimbre: Timbre = (k) => 1 / k;
const squareTimbre: Timbre = (k) => (k % 2 ? 1 / k : 0);

const organTimbre: Timbre = (k) => {
  const bars: Record<number, number> = { 1: 1, 2: 0.7, 3: 0.45, 4: 0.4, 6: 0.22, 8: 0.18, 10: 0.06, 12: 0.05 };
  return bars[k] ?? 0;
};

/** Choir "aah"/"ooh" vowel tables (formants per voice range). */
function vowelTimbre(vowel: 'a' | 'o', male: boolean): Timbre {
  // [freq, bandwidth, linear amplitude]
  const F: Array<[number, number, number]> =
    vowel === 'a'
      ? male
        ? [[650, 90, 1], [1080, 100, 0.5], [2650, 140, 0.35], [2900, 140, 0.3], [3250, 160, 0.08]]
        : [[800, 90, 1], [1150, 100, 0.6], [2850, 140, 0.12], [3600, 150, 0.06], [4950, 180, 0.01]]
      : male
        ? [[400, 80, 1], [800, 90, 0.35], [2600, 140, 0.08], [2800, 140, 0.07], [3000, 160, 0.03]]
        : [[450, 80, 1], [830, 90, 0.3], [2830, 140, 0.05], [3500, 150, 0.03], [4950, 180, 0.01]];
  return (k, f) => {
    let g = 0.025;
    for (const [fc, bw, a] of F) g += a * lorentz(f, fc, bw * 1.6);
    return (g / Math.pow(k, 0.6)) * (f < 120 ? f / 120 : 1);
  };
}

// ---------------------------------------------------------------------------------------------
// Sustained (wavetable) instruments
// ---------------------------------------------------------------------------------------------

function accordion(id: string, bright: number, reeds: number[], spread: number, attack: number): InstDef {
  return {
    id,
    kind: 'sustain',
    variants: 1,
    release: 0.045,
    sustainLen: 2.2,
    gate: 0.92,
    make(sr, midi, _v, lenSec) {
      const f0 = mtof(midi);
      const len = Math.round(lenSec * sr);
      const tbl = table(`reed${bright}`, reedTimbre(bright), sr, f0, 12000);
      const env = envADS(sr, len, attack, 0.25, 0.9, 1, 1.4);
      const l = new Float32Array(len);
      const r = new Float32Array(len);
      const rng = new Rng(seedOf(id, midi, 0));
      const voices: Voice[] = reeds.map((c, i) => {
        const p = reeds.length === 1 ? 0 : (i / (reeds.length - 1)) * 2 - 1; // -1..1
        const [gl, gr] = panGains(p * spread);
        return { gl, gr, detune: c, phase: rng.next(), drift: 1.5, driftRate: 0.3 + 0.2 * i, vibPhase: rng.next() * 6 };
      });
      oscMulti(l, r, tbl, sr, f0, env, voices);
      return normalizeRms({ l, r }, sr, 0.18);
    },
  };
}

function stringsInst(id: string, attack: number, stab: boolean): InstDef {
  return {
    id,
    kind: 'sustain',
    variants: 1,
    release: stab ? 0.09 : 0.28,
    sustainLen: stab ? 1.2 : 3.2,
    gate: stab ? 0.6 : 0.97,
    make(sr, midi, _v, lenSec) {
      const f0 = mtof(midi);
      const len = Math.round(lenSec * sr);
      const tbl = table('strings', stringTimbre, sr, f0, 12000);
      const env = stab ? envADS(sr, len, 0.012, 0.18, 0.45, 1, 1) : envADS(sr, len, attack, 0.6, 0.92, 1, 1.2);
      const l = new Float32Array(len);
      const r = new Float32Array(len);
      const rng = new Rng(seedOf(id, midi, 0));
      const dets = [-9, -3.5, 3.5, 9];
      const rates = [4.9, 5.35, 5.8, 6.2];
      oscMulti(l, r, tbl, sr, f0, env, dets.map((c, i) => {
        const [gl, gr] = panGains(((i / 3) * 2 - 1) * 0.75);
        return {
          gl,
          gr,
          detune: c,
          phase: rng.next(),
          vibRate: rates[i],
          vibDepth: stab ? 4 : 11,
          vibDelay: 0.18,
          vibRamp: 0.4,
          vibPhase: rng.next() * TAU,
          drift: 2,
          driftRate: 0.25 + 0.1 * i,
        };
      }));
      return normalizeRms({ l, r }, sr, 0.17, stab ? 0.15 : 0.6);
    },
  };
}

/** expressive solo violin-ish lead (single voice + slight chorus) */
const violin: InstDef = {
  id: 'violin',
  kind: 'sustain',
  variants: 1,
  release: 0.12,
  sustainLen: 2.6,
  gate: 0.96,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(lenSec * sr);
    const tbl = table('violin', (k, f) => stringTimbre(k, f, f0) * (1 + 0.6 * bump(f, 3400, 0.35)), sr, f0, 13000);
    const env = envADS(sr, len, 0.06, 0.4, 0.88, 1, 1.3);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    osc(l, r, 0.75, 0.6, tbl, sr, f0, env, { vibRate: 5.7, vibDepth: 22, vibDelay: 0.16, vibRamp: 0.35, pitch: (t) => centsToRatio(-25 * Math.exp(-t / 0.03)) });
    osc(l, r, 0.35, 0.5, tbl, sr, f0, env, { detune: 6, phase: 0.37, vibRate: 5.3, vibDepth: 16, vibDelay: 0.2, vibRamp: 0.4 });
    return normalizeRms({ l, r }, sr, 0.18);
  },
};

function choir(id: string, vowel: 'a' | 'o'): InstDef {
  return {
    id,
    kind: 'sustain',
    variants: 1,
    release: 0.38,
    sustainLen: 3.6,
    gate: 0.98,
    make(sr, midi, _v, lenSec) {
      const f0 = mtof(midi);
      const len = Math.round(lenSec * sr);
      const male = midi < 60;
      const tbl = table(`choir${vowel}${male ? 'm' : 'f'}`, vowelTimbre(vowel, male), sr, f0, 9000);
      const env = envADS(sr, len, 0.32, 0.8, 0.9, 1, 1.5);
      const l = new Float32Array(len);
      const r = new Float32Array(len);
      const rng = new Rng(seedOf(id, midi, 0));
      const dets = [-11, -4, 3, 10];
      oscMulti(l, r, tbl, sr, f0, env, dets.map((c, i) => {
        const [gl, gr] = panGains(((i / 3) * 2 - 1) * 0.8);
        return {
          gl,
          gr,
          detune: c,
          phase: rng.next(),
          vibRate: 4.8 + 0.35 * i,
          vibDepth: 14 + 3 * (i % 2),
          vibDelay: 0.1,
          vibRamp: 0.5,
          vibPhase: rng.next() * TAU,
          drift: 5,
          driftRate: 0.3 + 0.13 * i,
        };
      }));
      // breath: band-limited noise around F2 for air (onset only — cheap)
      const nr = new Rng(seedOf(id, midi, 3));
      const bp = new Svf(sr, vowel === 'a' ? 1200 : 800, 2.5);
      const nb = Math.min(len, Math.round(0.45 * sr));
      for (let i = 0; i < nb; i++) {
        bp.lp(nr.bi());
        const v = bp.bp * env[i] * 0.03 * (1 - i / nb);
        l[i] += v;
        r[i] += v;
      }
      return normalizeRms({ l, r }, sr, 0.16, 1.0);
    },
  };
}

const organ: InstDef = {
  id: 'organ',
  kind: 'sustain',
  variants: 1,
  release: 0.07,
  sustainLen: 2.5,
  gate: 0.95,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(lenSec * sr);
    const tbl = table('organ', organTimbre, sr, f0, 14000);
    const env = envADS(sr, len, 0.01, 0.1, 0.95, 1, 1);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    osc(l, r, 0.8, 0.45, tbl, sr, f0, env, { detune: -3, phase: 0.1 });
    osc(l, r, 0.45, 0.8, tbl, sr, f0, env, { detune: 3, phase: 0.6, vibRate: 6.6, vibDepth: 3 });
    // key click
    const nr = new Rng(seedOf('organ', midi, 1));
    const n = Math.round(0.004 * sr);
    for (let i = 0; i < n; i++) {
      const v = nr.bi() * 0.08 * (1 - i / n);
      l[i] += v;
      r[i] += v;
    }
    return normalizeRms({ l, r }, sr, 0.15);
  },
};

/** Section brass synth with filter "blat". */
function brass(id: string, bright: number): InstDef {
  return {
    id,
    kind: 'sustain',
    variants: 1,
    release: 0.09,
    sustainLen: 2.4,
    gate: 0.92,
    make(sr, midi, _v, lenSec) {
      const f0 = mtof(midi);
      const len = Math.round(lenSec * sr);
      const tbl = table('saw', sawTimbre, sr, f0, 14000);
      const env = envADS(sr, len, 0.03, 0.3, 0.85, 1, 1);
      const raw = new Float32Array(len);
      const raw2 = new Float32Array(len);
      osc(raw, raw2, 0.8, 0.45, tbl, sr, f0, env, { detune: -6, phase: 0.2, vibRate: 5.4, vibDepth: 9, vibDelay: 0.3, vibRamp: 0.4 });
      osc(raw, raw2, 0.45, 0.8, tbl, sr, f0, env, { detune: 6, phase: 0.7, vibRate: 5.0, vibDepth: 9, vibDelay: 0.3, vibRamp: 0.4 });
      osc(raw, raw2, 0.55, 0.55, tbl, sr, f0, env, { detune: 0, phase: 0.45, pitch: (t) => centsToRatio(-30 * Math.exp(-t / 0.025)) });
      const kt = Math.pow(f0 / 220, 0.35);
      const fl = new Svf(sr, 500, 0.8);
      const fr = new Svf(sr, 500, 0.8);
      for (let b = 0; b < len; b += 16) {
        const t = b / sr;
        const c = (t < 0.05 ? 450 + (3500 * bright - 450) * (t / 0.05) : 3500 * bright * (0.58 + 0.42 * Math.exp(-(t - 0.05) / 0.25))) * kt;
        fl.set(c, 0.85);
        fr.set(c, 0.85);
        const be = Math.min(len, b + 16);
        for (let i = b; i < be; i++) {
          raw[i] = fl.lp(raw[i]);
          raw2[i] = fr.lp(raw2[i]);
        }
      }
      return normalizeRms({ l: raw, r: raw2 }, sr, 0.17);
    },
  };
}

const tuba: InstDef = {
  id: 'tuba',
  kind: 'sustain',
  variants: 1,
  release: 0.05,
  sustainLen: 1.6,
  gate: 0.85,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(lenSec * sr);
    const soft = table('tubaS', tubaTimbre(950), sr, f0, 6000);
    const hard = table('tubaH', tubaTimbre(2100), sr, f0, 8000);
    const envS = envADS(sr, len, 0.018, 0.25, 0.8, 1, 1);
    const envH = new Float32Array(Math.min(len, Math.round(0.25 * sr)));
    for (let i = 0; i < envH.length; i++) envH[i] = envS[i] * 0.8 * Math.exp(-i / (0.045 * sr));
    const l = new Float32Array(len);
    const scoop = (t: number) => centsToRatio(-40 * Math.exp(-t / 0.028));
    osc(l, null, 1, 0, soft, sr, f0, envS, { pitch: scoop });
    osc(l, null, 1, 0, hard, sr, f0, envH, { pitch: scoop });
    eq(l, [Biquad.hp(sr, 32, 0.7)]);
    return normalizeRms({ l, r: null }, sr, 0.2, 0.3);
  },
};

function flute(id: string, breathy: number): InstDef {
  return {
    id,
    kind: 'sustain',
    variants: 1,
    release: 0.07,
    sustainLen: 2.4,
    gate: 0.9,
    make(sr, midi, _v, lenSec) {
      const f0 = mtof(midi);
      const len = Math.round(lenSec * sr);
      const tbl = table('flute', (k) => [0, 1, 0.22, 0.09, 0.035, 0.012][k] ?? 0, sr, f0, 15000, 'zero');
      const env = envADS(sr, len, 0.045, 0.3, 0.9, 1, 1.2);
      const l = new Float32Array(len);
      osc(l, null, 1, 0, tbl, sr, f0, env, { vibRate: 5.6, vibDepth: 14, vibDelay: 0.14, vibRamp: 0.3, pitch: (t) => centsToRatio(-18 * Math.exp(-t / 0.04)) });
      const nr = new Rng(seedOf(id, midi, 2));
      const bp = new Svf(sr, f0, 10);
      const hp = new Svf(sr, 3500, 0.7);
      for (let i = 0; i < len; i++) {
        const n = nr.bi();
        bp.lp(n);
        hp.lp(n);
        const chiff = Math.exp(-i / (0.03 * sr));
        l[i] += bp.bp * env[i] * 0.09 * breathy + hp.hp * (0.02 + 0.12 * chiff) * breathy * env[i];
      }
      return normalizeRms({ l, r: null }, sr, 0.2);
    },
  };
}

/** Italo synth lead (detuned saws + square, gentle filter) */
const synthLead: InstDef = {
  id: 'synthLead',
  kind: 'sustain',
  variants: 1,
  release: 0.1,
  sustainLen: 2.2,
  gate: 0.9,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(lenSec * sr);
    const saw = table('saw', sawTimbre, sr, f0, 14000);
    const sq = table('square', squareTimbre, sr, f0, 14000);
    const env = envADS(sr, len, 0.006, 0.25, 0.75, 1, 1);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    const v = { vibRate: 5.5, vibDepth: 10, vibDelay: 0.25, vibRamp: 0.3 };
    osc(l, r, 0.85, 0.35, saw, sr, f0, env, { ...v, detune: -8, phase: 0.1 });
    osc(l, r, 0.35, 0.85, saw, sr, f0, env, { ...v, detune: 8, phase: 0.6 });
    osc(l, r, 0.4, 0.4, sq, sr, f0, env, { ...v, phase: 0.3 });
    const fl = new Svf(sr, 3600, 1.1);
    const fr = new Svf(sr, 3600, 1.1);
    for (let i = 0; i < len; i++) {
      l[i] = fl.lp(l[i]);
      r[i] = fr.lp(r[i]);
    }
    return normalizeRms({ l, r }, sr, 0.16);
  },
};

function synthPad(id: string, cutoff: number, wobble: number): InstDef {
  return {
    id,
    kind: 'sustain',
    variants: 1,
    release: 0.38,
    sustainLen: 3.8,
    gate: 0.98,
    make(sr, midi, _v, lenSec) {
      const f0 = mtof(midi);
      const len = Math.round(lenSec * sr);
      const tbl = table(`pad${cutoff}`, (k, f) => (1 / k) * rolloff(f, cutoff, 3), sr, f0, 12000);
      const env = envADS(sr, len, 0.35, 1.0, 0.85, 1, 1.5);
      const l = new Float32Array(len);
      const r = new Float32Array(len);
      const rng = new Rng(seedOf(id, midi, 0));
      oscMulti(l, r, tbl, sr, f0, env, [-11, 1, 12].map((c, i) => {
        const [gl, gr] = panGains((i - 1) * 0.85);
        return { gl, gr, detune: c, phase: rng.next(), drift: 3 + wobble, driftRate: 0.2 + 0.11 * i, vibPhase: rng.next() * 6 };
      }));
      return normalizeRms({ l, r }, sr, 0.15, 1.0);
    },
  };
}

/** "corrupted muzak" lead: tape-warbled triangle/sine */
const warble: InstDef = {
  id: 'warble',
  kind: 'sustain',
  variants: 1,
  release: 0.12,
  sustainLen: 2.4,
  gate: 0.9,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(lenSec * sr);
    const tbl = table('warble2', (k, f) => (k === 1 ? 1 : (k % 2 ? 0.55 : 0.3) / Math.pow(k, 1.05)) * rolloff(f, 5200, 3) * (1 + 0.8 * bump(f, 2400, 0.5)), sr, f0, 12000);
    const env = envADS(sr, len, 0.02, 0.4, 0.8, 1, 1);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    const w = (t: number) => centsToRatio(22 * Math.sin(TAU * 0.85 * t + 1) + 7 * Math.sin(TAU * 6.3 * t));
    osc(l, r, 0.8, 0.5, tbl, sr, f0, env, { pitch: w });
    osc(l, r, 0.5, 0.8, tbl, sr, f0, env, { pitch: (t) => w(t + 0.37) * centsToRatio(-17), phase: 0.25 });
    return normalizeRms({ l, r }, sr, 0.17);
  },
};

// ---------------------------------------------------------------------------------------------
// Plucked strings (Karplus–Strong)
// ---------------------------------------------------------------------------------------------

const mandolin: InstDef = {
  id: 'mandolin',
  kind: 'pluck',
  variants: 2,
  release: 0.035,
  gate: 1,
  make(sr, midi, v, lenSec) {
    const f = mtof(midi);
    const len = Math.round(want(1.5, lenSec) * sr);
    const out = new Float32Array(len);
    const t60 = clamp(1.3 * Math.pow(440 / f, 0.55), 0.35, 2.4);
    const seed = seedOf('mandolin', midi, v);
    const up = v === 1;
    ksString(out, 0, sr, f * centsToRatio(-1.4), { t60, damp: up ? 0.16 : 0.1, exciteHz: up ? 4200 : 6500, pick: 0.13, seed });
    ksString(out, Math.round((up ? 0.0025 : 0.0042) * sr), sr, f * centsToRatio(1.6), { t60: t60 * 0.94, damp: up ? 0.17 : 0.11, exciteHz: up ? 4000 : 6000, pick: 0.15, seed: seed + 1, amp: 0.85 });
    // pick click
    const nr = new Rng(seed + 2);
    const hp = Biquad.hp(sr, 2500, 0.7);
    const nc = Math.round(0.002 * sr);
    for (let i = 0; i < nc; i++) out[i] += hp.process(nr.bi()) * 0.25 * (1 - i / nc);
    eq(out, [Biquad.hp(sr, 170, 0.7), Biquad.peak(sr, 420, 1.4, 3), Biquad.peak(sr, 1150, 1.2, 2), Biquad.peak(sr, 3000, 1.0, 3), Biquad.highShelf(sr, 8500, -4)]);
    fadeEdges(out, 0, Math.round(0.05 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, up ? 0.42 : 0.5);
  },
};

const guitar: InstDef = {
  id: 'guitar',
  kind: 'pluck',
  variants: 2,
  release: 0.12,
  gate: 1,
  make(sr, midi, v, lenSec) {
    const f = mtof(midi);
    const len = Math.round(want(2.6, lenSec) * sr);
    const out = new Float32Array(len);
    const t60 = clamp(3.2 * Math.pow(196 / f, 0.45), 0.9, 4.5);
    ksString(out, 0, sr, f, { t60, damp: 0.3 + 0.04 * v, exciteHz: v ? 2000 : 2600, pick: 0.17 + 0.03 * v, seed: seedOf('guitar', midi, v) });
    eq(out, [Biquad.hp(sr, 70, 0.7), Biquad.peak(sr, 105, 1.3, 3), Biquad.peak(sr, 230, 1.4, 1.5), Biquad.peak(sr, 2400, 1.0, 2.5), Biquad.lp(sr, 7500, 0.7)]);
    fadeEdges(out, 0, Math.round(0.08 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, 0.5);
  },
};

const harpsichord: InstDef = {
  id: 'harpsi',
  kind: 'pluck',
  variants: 1,
  release: 0.05,
  gate: 1,
  make(sr, midi, _v, lenSec) {
    const f = mtof(midi);
    const len = Math.round(want(2.4, lenSec) * sr);
    const out = new Float32Array(len);
    const t60 = clamp(2.6 * Math.pow(262 / f, 0.5), 0.6, 5);
    const seed = seedOf('harpsi', midi, 0);
    ksString(out, 0, sr, f, { t60, damp: 0.05, exciteHz: 11000, pick: 0.07, seed });
    if (f * 2 < sr * 0.2) ksString(out, Math.round(0.0015 * sr), sr, f * 2.001, { t60: t60 * 0.7, damp: 0.06, exciteHz: 11000, pick: 0.1, seed: seed + 9, amp: 0.4 });
    eq(out, [Biquad.hp(sr, 140, 0.7), Biquad.peak(sr, 1900, 1.0, 2), Biquad.highShelf(sr, 6000, 1.5)]);
    fadeEdges(out, 0, Math.round(0.05 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, 0.45);
  },
};

const pizz: InstDef = {
  id: 'pizz',
  kind: 'pluck',
  variants: 2,
  release: 0.06,
  gate: 1,
  make(sr, midi, v, lenSec) {
    const f = mtof(midi);
    const len = Math.round(want(1.1, lenSec) * sr);
    const out = new Float32Array(len);
    const t60 = clamp(0.75 * Math.pow(330 / f, 0.3), 0.25, 1.1);
    const seed = seedOf('pizz', midi, v);
    ksString(out, 0, sr, f * centsToRatio(-4), { t60, damp: 0.38, exciteHz: 2600, pick: 0.23, seed });
    ksString(out, Math.round(0.007 * sr), sr, f * centsToRatio(5), { t60, damp: 0.4, exciteHz: 2300, pick: 0.2, seed: seed + 5, amp: 0.8 });
    eq(out, [Biquad.hp(sr, 140, 0.7), Biquad.peak(sr, 290, 1.2, 3), Biquad.peak(sr, 2800, 1.2, 3), Biquad.lp(sr, 6500, 0.7)]);
    fadeEdges(out, 0, Math.round(0.05 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, 0.5);
  },
};

const uprightBass: InstDef = {
  id: 'ubass',
  kind: 'pluck',
  variants: 2,
  release: 0.07,
  gate: 0.9,
  make(sr, midi, v, lenSec) {
    const f = mtof(midi);
    const len = Math.round(want(1.8, lenSec) * sr);
    const out = new Float32Array(len);
    ksString(out, 0, sr, f, { t60: 1.7, damp: 0.42, exciteHz: 850 + 150 * v, pick: 0.21, seed: seedOf('ubass', midi, v) });
    // body thump at the fundamental
    for (let i = 0; i < Math.round(0.25 * sr); i++) out[i] += Math.sin((TAU * f * i) / sr) * 0.55 * Math.exp(-i / (0.06 * sr));
    eq(out, [Biquad.hp(sr, 33, 0.7), Biquad.peak(sr, 85, 1.0, 2), Biquad.lp(sr, 2300, 0.7), Biquad.peak(sr, 700, 1.5, 2)]);
    fadeEdges(out, 0, Math.round(0.06 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, 0.55);
  },
};

// ---------------------------------------------------------------------------------------------
// Synth plucks
// ---------------------------------------------------------------------------------------------

const synthBass: InstDef = {
  id: 'synthBass',
  kind: 'pluck',
  variants: 1,
  release: 0.025,
  gate: 0.8,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(want(0.9, lenSec) * sr);
    const saw = table('saw', sawTimbre, sr, f0, 12000);
    const sq = table('square', squareTimbre, sr, f0, 12000);
    const env = envADS(sr, len, 0.003, 0.18, 0.7, 1, 1);
    const raw = new Float32Array(len);
    osc(raw, null, 0.75, 0, saw, sr, f0, env, { phase: 0 });
    osc(raw, null, 0.45, 0, sq, sr, f0, env, { phase: 0.5, detune: 4 });
    const flt = new Svf(sr, 2000, 1.6);
    const kt = Math.pow(f0 / 65, 0.5);
    for (let b = 0; b < len; b += 16) {
      const t = b / sr;
      flt.set((280 + 2300 * Math.exp(-t / 0.085)) * kt, 1.6);
      const be = Math.min(len, b + 16);
      for (let i = b; i < be; i++) raw[i] = flt.lp(raw[i]);
    }
    eq(raw, [Biquad.hp(sr, 30, 0.7)]);
    return normalize({ l: raw, r: null }, 0.55);
  },
};

/** bright Italo-disco pluck (saw + square, fast filter decay) */
const synthPluck: InstDef = {
  id: 'synthPluck',
  kind: 'pluck',
  variants: 1,
  release: 0.04,
  gate: 0.8,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(want(0.7, lenSec) * sr);
    const saw = table('saw', sawTimbre, sr, f0, 14000);
    const env = envADS(sr, len, 0.002, 0.16, 0.25, 1, 1);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    oscMulti(l, r, saw, sr, f0, env, [
      { gl: 0.9, gr: 0.3, detune: -7, phase: 0.1 },
      { gl: 0.3, gr: 0.9, detune: 7, phase: 0.6 },
    ]);
    const fl = new Svf(sr, 3000, 1.3);
    const fr = new Svf(sr, 3000, 1.3);
    for (let b = 0; b < len; b += 16) {
      const c = 700 + 5200 * Math.exp(-(b / sr) / 0.07);
      fl.set(c, 1.3);
      fr.set(c, 1.3);
      const be = Math.min(len, b + 16);
      for (let i = b; i < be; i++) {
        l[i] = fl.lp(l[i]);
        r[i] = fr.lp(r[i]);
      }
    }
    return normalize({ l, r }, 0.4);
  },
};

/** FM electric piano (DX-style tine), stereo auto-pan */
const epiano: InstDef = {
  id: 'epiano',
  kind: 'pluck',
  variants: 1,
  release: 0.18,
  gate: 1,
  make(sr, midi, _v, lenSec) {
    const f = mtof(midi);
    const len = Math.round(want(2.6, lenSec) * sr);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    const S = SINE;
    const N = SINE_N;
    const mask = N - 1;
    const sin = (x: number): number => {
      // x in cycles
      const p = (x - Math.floor(x)) * N;
      const i = p | 0;
      const a = S[i & mask];
      return a + (S[(i + 1) & mask] - a) * (p - i);
    };
    let pc = 0;
    let pt = 0;
    const fc = f / sr;
    const ft = (f * 14) / sr;
    const t60 = clamp(3.0 * Math.pow(262 / f, 0.4), 0.8, 5);
    const kIdx = Math.exp(-1 / (0.35 * sr));
    const kTine = Math.exp(-1 / (0.012 * sr));
    const kAmp = Math.exp(-6.9 / (t60 * sr));
    let idxE = 1.9;
    let tineE = 0.9;
    let amp = 1;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const tine = tineE > 1e-4 ? sin(pt) * tineE : 0;
      const v = sin(pc + ((0.35 + idxE) * sin(pc) + tine) / TAU) * amp * (i < 96 ? i / 96 : 1);
      pc += fc;
      pt += ft;
      if (pc > 1) pc -= 1;
      if (pt > 1) pt -= 1;
      idxE *= kIdx;
      tineE *= kTine;
      amp *= kAmp;
      const pan = 0.3 * sin(3.2 * t);
      l[i] = v * (1 - pan);
      r[i] = v * (1 + pan);
    }
    fadeEdges(l, 0, Math.round(0.05 * sr));
    fadeEdges(r, 0, Math.round(0.05 * sr));
    return normalize({ l, r }, 0.42);
  },
};

/** robotic bit-crushed square arp */
const roboArp: InstDef = {
  id: 'roboArp',
  kind: 'pluck',
  variants: 1,
  release: 0.02,
  gate: 0.7,
  make(sr, midi, _v, lenSec) {
    const f0 = mtof(midi);
    const len = Math.round(want(0.4, lenSec) * sr);
    const sq = table('square', squareTimbre, sr, f0, 9000);
    const env = envADS(sr, len, 0.002, 0.07, 0.25, 1, 1);
    const raw = new Float32Array(len);
    osc(raw, null, 1, 0, sq, sr, f0, env, { phase: 0 });
    // bit-crush + sample-hold (lo-fi "robot")
    const hold = 3;
    let held = 0;
    for (let i = 0; i < len; i++) {
      if (i % hold === 0) held = Math.round(raw[i] * 10) / 10;
      raw[i] = raw[i] * 0.6 + held * 0.4;
    }
    eq(raw, [Biquad.hp(sr, 200, 0.7), Biquad.lp(sr, 7000, 0.7)]);
    return normalize({ l: raw, r: null }, 0.4);
  },
};

// ---------------------------------------------------------------------------------------------
// Mallets / bells / timpani (modal)
// ---------------------------------------------------------------------------------------------

const glock: InstDef = {
  id: 'glock',
  kind: 'pluck',
  variants: 1,
  release: 0.4,
  ring: true,
  make(sr, midi) {
    const f = mtof(midi);
    const len = Math.round(2.2 * sr);
    const out = new Float32Array(len);
    const t1 = clamp(2.0 * Math.pow(880 / f, 0.3), 0.8, 3);
    addPartials(out, 0, sr, [
      { f, amp: 1, t60: t1 },
      { f: f * 2.76, amp: 0.38, t60: t1 * 0.35 },
      { f: f * 5.4, amp: 0.2, t60: t1 * 0.15 },
      { f: f * 8.93, amp: 0.08, t60: t1 * 0.07 },
    ]);
    const nr = new Rng(seedOf('glock', midi, 0));
    const hp = Biquad.hp(sr, 3000, 0.7);
    const n = Math.round(0.003 * sr);
    for (let i = 0; i < n; i++) out[i] += hp.process(nr.bi()) * 0.3 * (1 - i / n);
    eq(out, [Biquad.hp(sr, 300, 0.7)]);
    fadeEdges(out, Math.round(0.0005 * sr), Math.round(0.08 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, 0.45);
  },
};

const vibes: InstDef = {
  id: 'vibes',
  kind: 'pluck',
  variants: 1,
  release: 0.25,
  gate: 1,
  make(sr, midi, _v, lenSec) {
    const f = mtof(midi);
    const len = Math.round(want(2.8, lenSec) * sr);
    const l = new Float32Array(len);
    addPartials(l, 0, sr, [
      { f, amp: 1, t60: 3.2 },
      { f: f * 4.0, amp: 0.22, t60: 0.9 },
      { f: f * 10.0, amp: 0.05, t60: 0.25 },
    ]);
    const r = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const am = 1 - 0.32 * (0.5 + 0.5 * Math.sin(TAU * 5.2 * t));
      const pan = 0.18 * Math.sin(TAU * 5.2 * t + 1.2);
      const v = l[i] * am * Math.min(1, t / 0.0015);
      l[i] = v * (1 - pan);
      r[i] = v * (1 + pan);
    }
    fadeEdges(l, 0, Math.round(0.06 * sr));
    fadeEdges(r, 0, Math.round(0.06 * sr));
    return normalize({ l, r }, 0.42);
  },
};

const tubularBell: InstDef = {
  id: 'bell',
  kind: 'pluck',
  variants: 1,
  release: 1,
  ring: true,
  make(sr, midi) {
    const f = mtof(midi);
    const len = Math.round(4 * sr);
    const out = new Float32Array(len);
    addPartials(out, 0, sr, [
      { f: f * 0.5, amp: 0.35, t60: 4 },
      { f, amp: 0.8, t60: 3.2 },
      { f: f * 1.19, amp: 0.45, t60: 2.6 },
      { f: f * 1.5, amp: 0.35, t60: 2.2 },
      { f: f * 2.0, amp: 0.6, t60: 2.0 },
      { f: f * 2.52, amp: 0.25, t60: 1.2 },
      { f: f * 3.01, amp: 0.2, t60: 0.9 },
      { f: f * 4.1, amp: 0.1, t60: 0.5 },
    ]);
    eq(out, [Biquad.hp(sr, 90, 0.7)]);
    fadeEdges(out, Math.round(0.001 * sr), Math.round(0.2 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, 0.45);
  },
};

const timpani: InstDef = {
  id: 'timp',
  kind: 'pluck',
  variants: 2,
  release: 0.6,
  ring: true,
  make(sr, midi, v) {
    const f = mtof(midi);
    const len = Math.round(3.2 * sr);
    const out = new Float32Array(len);
    const soft = v === 1;
    addPartials(out, 0, sr, [
      { f, amp: 1, t60: 2.6 },
      { f: f * 1.504, amp: soft ? 0.35 : 0.55, t60: 1.5 },
      { f: f * 1.742, amp: 0.2, t60: 1.0 },
      { f: f * 2.0, amp: soft ? 0.18 : 0.3, t60: 1.1 },
      { f: f * 2.245, amp: 0.12, t60: 0.7 },
      { f: f * 2.494, amp: 0.1, t60: 0.6 },
      { f: f * 0.6, amp: 0.5, t60: 0.18 },
    ]);
    const nr = new Rng(seedOf('timp', midi, v));
    const lp = new Svf(sr, soft ? 500 : 900, 0.7);
    const n = Math.round(0.03 * sr);
    for (let i = 0; i < n; i++) out[i] += lp.lp(nr.bi()) * (soft ? 0.5 : 1.0) * Math.exp(-i / (0.006 * sr));
    eq(out, [Biquad.hp(sr, 35, 0.7)]);
    fadeEdges(out, Math.round(0.0008 * sr), Math.round(0.2 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, soft ? 0.3 : 0.55);
  },
};

// ---------------------------------------------------------------------------------------------
// Percussion (midi pitch ignored unless noted; variants = different hits/takes)
// ---------------------------------------------------------------------------------------------

/** Jingle bank shared by tambourine variants. */
function jingles(out: Float32Array, sr: number, rng: Rng, start: number, amp: number, spreadSec: number, nBursts: number, decay: number): void {
  const len = out.length;
  const exc = new Float32Array(len);
  for (let b = 0; b < nBursts; b++) {
    const t0 = start + Math.round(Math.pow(rng.next(), 1.6) * spreadSec * sr);
    const a = amp * (0.35 + 0.65 * rng.next()) * (b === 0 ? 1.4 : 1);
    const bl = Math.round((0.0015 + 0.002 * rng.next()) * sr);
    for (let i = 0; i < bl && t0 + i < len; i++) exc[t0 + i] += rng.bi() * a * (1 - i / bl);
  }
  const freqs = [5100, 6650, 7900, 9300, 10900, 12600];
  for (let k = 0; k < freqs.length; k++) {
    const f = freqs[k] * (0.94 + 0.12 * rng.next());
    const bp = Biquad.bp(sr, f, 9 + 8 * rng.next());
    const g = 1 / (1 + 0.15 * k);
    for (let i = start; i < len; i++) out[i] += bp.process(exc[i]) * g;
  }
  // overall decay shaping
  const kd = Math.exp(-1 / (decay * sr));
  let e = 1;
  for (let i = start; i < len; i++) {
    out[i] *= e;
    e *= kd;
  }
}

const tamb: InstDef = {
  id: 'tamb',
  kind: 'perc',
  variants: 8, // 0,1 hit; 2,3 shake; 4,5 accent; 6,7 roll
  release: 0.03,
  ring: true,
  make(sr, _midi, v) {
    const kind = v >> 1;
    const rng = new Rng(9001 + v * 7919);
    const dur = kind === 3 ? 0.45 : kind === 2 ? 0.42 : 0.3;
    const len = Math.round(dur * sr);
    const out = new Float32Array(len);
    if (kind === 0 || kind === 2) {
      // skin
      const f = 250 + rng.next() * 25;
      const amp = kind === 2 ? 0.32 : 0.2;
      for (let i = 0; i < Math.round(0.08 * sr); i++) {
        const t = i / sr;
        out[i] += Math.sin(TAU * f * t * (1 + 0.3 * Math.exp(-t / 0.008))) * amp * Math.exp(-t / 0.018);
      }
      const bp = Biquad.bp(sr, 1800, 1.0);
      for (let i = 0; i < Math.round(0.02 * sr); i++) out[i] += bp.process(rng.bi()) * amp * 1.5 * Math.exp(-i / (0.004 * sr));
    }
    if (kind === 3) {
      // roll: many bursts, AM'd
      jingles(out, sr, rng, 0, 0.7, 0.38, 26, 0.5);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        out[i] *= (0.7 + 0.3 * Math.sin(TAU * 24 * t)) * Math.min(1, t / 0.08) * (t > 0.36 ? Math.max(0, 1 - (t - 0.36) / 0.09) : 1);
      }
    } else {
      jingles(out, sr, rng, 0, kind === 1 ? 0.55 : 1, kind === 1 ? 0.035 : 0.022, kind === 1 ? 7 : 6, kind === 2 ? 0.16 : kind === 1 ? 0.09 : 0.11);
    }
    eq(out, [Biquad.hp(sr, 180, 0.7), Biquad.highShelf(sr, 7000, 2)]);
    fadeEdges(out, 0, Math.round(0.02 * sr));
    return normalize({ l: out, r: null }, kind === 1 ? 0.3 : kind === 2 ? 0.6 : kind === 3 ? 0.35 : 0.5);
  },
};

const kick: InstDef = {
  id: 'kick',
  kind: 'perc',
  variants: 1,
  release: 0.05,
  ring: true,
  make(sr) {
    const len = Math.round(0.45 * sr);
    const out = new Float32Array(len);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const f = 49 + 115 * Math.exp(-t / 0.03) + 45 * Math.exp(-t / 0.004); // settles on G1
      ph += (TAU * f) / sr;
      out[i] = Math.sin(ph) * Math.exp(-t / 0.12) * (t < 0.002 ? t / 0.002 : 1);
    }
    const nr = new Rng(77);
    const hp = Biquad.hp(sr, 3000, 0.7);
    for (let i = 0; i < Math.round(0.004 * sr); i++) out[i] += hp.process(nr.bi()) * 0.25 * (1 - i / (0.004 * sr));
    // gentle saturation for punch
    for (let i = 0; i < len; i++) out[i] = Math.tanh(out[i] * 1.6) / Math.tanh(1.6);
    fadeEdges(out, 0, Math.round(0.03 * sr));
    return normalize({ l: out, r: null }, 0.75);
  },
};

const clap: InstDef = {
  id: 'clap',
  kind: 'perc',
  variants: 2,
  release: 0.05,
  ring: true,
  make(sr, _m, v) {
    const len = Math.round(0.4 * sr);
    const out = new Float32Array(len);
    const rng = new Rng(4242 + v * 31);
    const bursts = [0, 0.009 + 0.002 * v, 0.019, 0.028];
    for (let b = 0; b < bursts.length; b++) {
      const s = Math.round(bursts[b] * sr);
      const last = b === bursts.length - 1;
      const dec = last ? 0.11 : 0.0045;
      for (let i = s; i < len; i++) {
        const t = (i - s) / sr;
        out[i] += rng.bi() * Math.exp(-t / dec) * (last ? 0.8 : 1);
      }
    }
    eq(out, [Biquad.bp(sr, 1150, 1.1), Biquad.peak(sr, 2600, 1.5, 4), Biquad.hp(sr, 400, 0.7)]);
    fadeEdges(out, 0, Math.round(0.03 * sr));
    return normalize({ l: out, r: null }, 0.6);
  },
};

function hat(id: string, decay: number, len: number): InstDef {
  return {
    id,
    kind: 'perc',
    variants: 2,
    release: 0.02,
    ring: true,
    make(sr, _m, v) {
      const n = Math.round(len * sr);
      const out = new Float32Array(n);
      const rng = new Rng(555 + v * 17 + Math.round(decay * 1000));
      // metallic square cluster + noise
      const fs = [317, 431, 522, 607, 769, 913];
      const ph = fs.map(() => rng.next());
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        let m = 0;
        for (let k = 0; k < fs.length; k++) m += (((fs[k] * 9.7 * t + ph[k]) % 1) < 0.5 ? 1 : -1);
        out[i] = (m * 0.12 + rng.bi() * 0.8) * Math.exp(-t / decay) * Math.min(1, t / 0.0007);
      }
      eq(out, [Biquad.hp(sr, 7000, 0.8), Biquad.hp(sr, 6000, 0.6), Biquad.peak(sr, 10500, 1, 3)]);
      fadeEdges(out, 0, Math.round(0.01 * sr));
      return normalize({ l: out, r: null }, 0.4);
    },
  };
}

const snare: InstDef = {
  id: 'snare',
  kind: 'perc',
  variants: 2,
  release: 0.05,
  ring: true,
  make(sr, _m, v) {
    const len = Math.round(0.35 * sr);
    const out = new Float32Array(len);
    const rng = new Rng(808 + v);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const tone = (Math.sin(TAU * 185 * t) * 0.6 + Math.sin(TAU * 330 * t) * 0.35) * Math.exp(-t / 0.05);
      out[i] = tone + rng.bi() * 0.55 * Math.exp(-t / (0.09 + 0.02 * v));
    }
    eq(out, [Biquad.hp(sr, 120, 0.7), Biquad.peak(sr, 4500, 0.8, 4)]);
    fadeEdges(out, 0, Math.round(0.03 * sr));
    return normalize({ l: out, r: null }, 0.55);
  },
};

const crash: InstDef = {
  id: 'crash',
  kind: 'perc',
  variants: 1,
  release: 0.5,
  ring: true,
  make(sr) {
    const len = Math.round(2.4 * sr);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    const rng = new Rng(31337);
    const kd = Math.exp(-1 / (0.55 * sr));
    let e = 1;
    for (let i = 0; i < len; i++) {
      const a = e * Math.min(1, i / (0.002 * sr));
      l[i] = rng.bi() * 0.8 * a;
      r[i] = rng.bi() * 0.8 * a;
      e *= kd;
    }
    const metal = [377, 553, 707, 921, 1187, 1433, 1801].map((f, k) => ({ f: f * 5.3, amp: 0.05, t60: 1.6, phase: k }));
    addPartials(l, 0, sr, metal);
    addPartials(r, 0, sr, metal.map((p) => ({ ...p, phase: (p.phase ?? 0) + 1.3 })));
    const fl = [Biquad.hp(sr, 3500, 0.7), Biquad.peak(sr, 8000, 0.8, 3), Biquad.highShelf(sr, 12000, -3)];
    const fr = [Biquad.hp(sr, 3500, 0.7), Biquad.peak(sr, 8000, 0.8, 3), Biquad.highShelf(sr, 12000, -3)];
    eq(l, fl);
    eq(r, fr);
    fadeEdges(l, 0, Math.round(0.3 * sr));
    fadeEdges(r, 0, Math.round(0.3 * sr));
    return normalize({ l, r }, 0.4);
  },
};

const shaker: InstDef = {
  id: 'shaker',
  kind: 'perc',
  variants: 2,
  release: 0.02,
  ring: true,
  make(sr, _m, v) {
    const len = Math.round(0.12 * sr);
    const out = new Float32Array(len);
    const rng = new Rng(1212 + v);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const e = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) / 0.03);
      out[i] = rng.bi() * e;
    }
    eq(out, [Biquad.hp(sr, 5500, 0.7), Biquad.peak(sr, 9000, 1, 3)]);
    fadeEdges(out, 0, Math.round(0.01 * sr));
    return normalize({ l: out, r: null }, 0.35);
  },
};

const triangleInst: InstDef = {
  id: 'triangle',
  kind: 'perc',
  variants: 1,
  release: 0.3,
  ring: true,
  make(sr) {
    const len = Math.round(2.0 * sr);
    const out = new Float32Array(len);
    const f = 1550;
    addPartials(out, 0, sr, [
      { f, amp: 0.5, t60: 1.8 },
      { f: f * 2.71, amp: 0.4, t60: 1.5 },
      { f: f * 4.33, amp: 0.35, t60: 1.2 },
      { f: f * 5.95, amp: 0.3, t60: 1.0 },
      { f: f * 7.6, amp: 0.2, t60: 0.8 },
    ]);
    fadeEdges(out, Math.round(0.0005 * sr), Math.round(0.2 * sr));
    return normalize({ l: out, r: null }, 0.3);
  },
};

/** low "riser"/whoosh noise sweep — midi ignored, length from lenSec on demand isn't supported: fixed 2 s */
const riser: InstDef = {
  id: 'riser',
  kind: 'perc',
  variants: 1,
  release: 0.1,
  ring: true,
  make(sr) {
    const len = Math.round(2.0 * sr);
    const l = new Float32Array(len);
    const r = new Float32Array(len);
    const rng = new Rng(2024);
    const fl = new Svf(sr, 300, 2);
    const fr = new Svf(sr, 300, 2);
    for (let b = 0; b < len; b += 32) {
      const x = b / len;
      fl.set(300 + 7000 * x * x, 2.2);
      fr.set(320 + 7200 * x * x, 2.2);
      const be = Math.min(len, b + 32);
      for (let i = b; i < be; i++) {
        const e = Math.pow(i / len, 2.2) * (i > len - 600 ? (len - i) / 600 : 1);
        fl.lp(rng.bi());
        fr.lp(rng.bi());
        l[i] = fl.bp * e;
        r[i] = fr.bp * e;
      }
    }
    return normalize({ l, r }, 0.35);
  },
};

/** kitchen frying-pan / pot clang (two pans) */
const panClang: InstDef = {
  id: 'pan',
  kind: 'perc',
  variants: 2,
  release: 0.1,
  ring: true,
  make(sr, _m, v) {
    const len = Math.round(1.0 * sr);
    const out = new Float32Array(len);
    const f0 = v ? 512 : 418;
    const ratios = [1, 1.58, 2.31, 3.17, 4.12, 5.6, 7.3];
    addPartials(
      out,
      0,
      sr,
      ratios.map((r, i) => ({ f: f0 * r, amp: [1, 0.75, 0.55, 0.4, 0.28, 0.18, 0.1][i], t60: [0.85, 0.7, 0.5, 0.36, 0.26, 0.18, 0.12][i], phase: i })),
    );
    const nr = new Rng(77 + v);
    const bp = Biquad.bp(sr, 3000, 0.8);
    for (let i = 0; i < Math.round(0.006 * sr); i++) out[i] += bp.process(nr.bi()) * 1.2 * (1 - i / (0.006 * sr));
    eq(out, [Biquad.hp(sr, 300, 0.7)]);
    fadeEdges(out, Math.round(0.0005 * sr), Math.round(0.15 * sr));
    return normalize({ l: trimTail(out, 2e-4), r: null }, 0.5);
  },
};

/** muted "wah-wah" brass (v0: short wah, v1: long sad wobbling wah) */
const wah: InstDef = {
  id: 'wah',
  kind: 'pluck',
  variants: 2,
  release: 0.12,
  gate: 0.95,
  make(sr, midi, v) {
    const f0 = mtof(midi);
    const long = v === 1;
    const len = Math.round((long ? 3.2 : 1.4) * sr);
    const tbl = table('wahsaw', (k, f) => (1 / Math.pow(k, 0.7)) * rolloff(f, 3500, 3), sr, f0 * 1.1, 12000);
    const env = envADS(sr, len, 0.03, 0.6, long ? 0.85 : 0.7, 1, 1);
    if (!long) for (let i = Math.round(0.9 * sr); i < len; i++) env[i] *= Math.max(0, 1 - (i - 0.9 * sr) / (0.5 * sr));
    const raw = new Float32Array(len);
    osc(raw, null, 1, 0, tbl, sr, f0, env, {
      pitch: long
        ? (t) => centsToRatio(-60 * Math.min(1, t / 2.6) + (35 + 25 * Math.min(1, t / 2)) * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.5))
        : (t) => centsToRatio(-20 * Math.exp(-t / 0.05)),
    });
    const flt = new Svf(sr, 400, 3);
    for (let b = 0; b < len; b += 16) {
      const t = b / sr;
      let c: number;
      if (long) c = 450 + 1300 * (0.5 - 0.5 * Math.cos(TAU * 2.6 * t)) * Math.exp(-t / 2.5);
      else c = 350 + 1500 * Math.sin(Math.PI * Math.min(1, t / 0.45));
      flt.set(c, 3.2);
      const be = Math.min(len, b + 16);
      for (let i = b; i < be; i++) raw[i] = flt.lp(raw[i]);
    }
    eq(raw, [Biquad.hp(sr, 90, 0.7)]);
    return normalizeRms({ l: raw, r: null }, sr, 0.2, 0.4);
  },
};

export const INSTRUMENTS: Record<string, InstDef> = {};
for (const d of [
  accordion('accordion', 1, [-13, 0, 14], 0.7, 0.03),
  accordion('accordionDry', 0.9, [0, 6], 0.4, 0.025),
  accordion('accChord', 0.62, [0, 9], 0.3, 0.012),
  stringsInst('strings', 0.14, false),
  stringsInst('strStab', 0.01, true),
  violin,
  choir('choir', 'a'),
  choir('choirO', 'o'),
  organ,
  brass('brass', 1),
  brass('brassSoft', 0.6),
  tuba,
  flute('flute', 1),
  flute('whistle', 0.5),
  synthLead,
  synthPad('synthPad', 2200, 0),
  synthPad('darkPad', 1100, 10),
  warble,
  mandolin,
  guitar,
  harpsichord,
  pizz,
  uprightBass,
  synthBass,
  synthPluck,
  epiano,
  roboArp,
  glock,
  vibes,
  tubularBell,
  timpani,
  tamb,
  kick,
  clap,
  hat('hatC', 0.03, 0.12),
  hat('hatO', 0.22, 0.5),
  snare,
  crash,
  shaker,
  triangleInst,
  riser,
  panClang,
  wah,
]) {
  INSTRUMENTS[d.id] = d;
}
