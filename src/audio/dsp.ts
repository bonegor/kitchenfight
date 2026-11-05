/**
 * DSP primitives shared by the music renderer, sfx and voice synths.
 * Everything here works on plain Float32Arrays (no Web Audio), so it can run before the
 * AudioContext exists and renders deterministically (seeded PRNG).
 */

export const TAU = Math.PI * 2;

export const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
export const dbToGain = (db: number): number => Math.pow(10, db / 20);
export const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
export const centsToRatio = (c: number): number => Math.pow(2, c / 1200);

/** mulberry32 PRNG — fast, deterministic. */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = (seed >>> 0) || 0x9e3779b9;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** -1..1 */
  bi(): number {
    return this.next() * 2 - 1;
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
}

/** FNV-1a string hash (32-bit). */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------------------------
// Cooperative time slicing (keeps the main thread responsive during long renders)
// ---------------------------------------------------------------------------------------------

let yieldChannel: MessageChannel | null = null;
const yieldQueue: Array<() => void> = [];

/** Yield to the event loop (MessageChannel: not throttled like timers in hidden tabs). */
export function yieldToLoop(): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!yieldChannel) {
        yieldChannel = new MessageChannel();
        yieldChannel.port1.onmessage = () => {
          const fn = yieldQueue.shift();
          if (fn) fn();
        };
      }
      yieldQueue.push(resolve);
      yieldChannel.port2.postMessage(0);
    } catch {
      setTimeout(resolve, 0);
    }
  });
}

export class Slicer {
  private t0 = now();
  /** Longest uninterrupted slice observed (ms) — for diagnostics. */
  maxSlice = 0;
  /** current phase label and the label of the longest slice (diagnostics) */
  phase = '';
  maxPhase = '';
  constructor(public budgetMs = 8) {}
  due(): boolean {
    return now() - this.t0 > this.budgetMs;
  }
  async yield(): Promise<void> {
    const d = now() - this.t0;
    if (d > this.maxSlice) {
      this.maxSlice = d;
      this.maxPhase = this.phase;
    }
    await yieldToLoop();
    this.t0 = now();
  }
  /** Yield only if the budget is used up. */
  async tick(): Promise<void> {
    if (this.due()) await this.yield();
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

// ---------------------------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------------------------

/** RBJ-cookbook biquad, transposed direct form II. */
export class Biquad {
  b0 = 1;
  b1 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  z1 = 0;
  z2 = 0;

  private setCoefs(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number): this {
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
    return this;
  }
  static lp(sr: number, f: number, q = 0.7071): Biquad {
    return new Biquad().lp(sr, f, q);
  }
  static hp(sr: number, f: number, q = 0.7071): Biquad {
    return new Biquad().hp(sr, f, q);
  }
  static bp(sr: number, f: number, q = 1): Biquad {
    return new Biquad().bp(sr, f, q);
  }
  static peak(sr: number, f: number, q: number, db: number): Biquad {
    return new Biquad().peak(sr, f, q, db);
  }
  static lowShelf(sr: number, f: number, db: number, s = 1): Biquad {
    return new Biquad().shelf(sr, f, db, s, false);
  }
  static highShelf(sr: number, f: number, db: number, s = 1): Biquad {
    return new Biquad().shelf(sr, f, db, s, true);
  }
  lp(sr: number, f: number, q = 0.7071): this {
    const w = (TAU * Math.min(f, sr * 0.49)) / sr;
    const c = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    return this.setCoefs((1 - c) / 2, 1 - c, (1 - c) / 2, 1 + al, -2 * c, 1 - al);
  }
  hp(sr: number, f: number, q = 0.7071): this {
    const w = (TAU * Math.min(f, sr * 0.49)) / sr;
    const c = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    return this.setCoefs((1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al);
  }
  /** constant 0 dB peak gain band-pass */
  bp(sr: number, f: number, q = 1): this {
    const w = (TAU * Math.min(f, sr * 0.49)) / sr;
    const c = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    return this.setCoefs(al, 0, -al, 1 + al, -2 * c, 1 - al);
  }
  peak(sr: number, f: number, q: number, db: number): this {
    const A = Math.pow(10, db / 40);
    const w = (TAU * Math.min(f, sr * 0.49)) / sr;
    const c = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    return this.setCoefs(1 + al * A, -2 * c, 1 - al * A, 1 + al / A, -2 * c, 1 - al / A);
  }
  shelf(sr: number, f: number, db: number, s: number, high: boolean): this {
    const A = Math.pow(10, db / 40);
    const w = (TAU * Math.min(f, sr * 0.49)) / sr;
    const c = Math.cos(w);
    const sn = Math.sin(w);
    const al = (sn / 2) * Math.sqrt((A + 1 / A) * (1 / s - 1) + 2);
    const sq = 2 * Math.sqrt(A) * al;
    if (high) {
      return this.setCoefs(
        A * (A + 1 + (A - 1) * c + sq),
        -2 * A * (A - 1 + (A + 1) * c),
        A * (A + 1 + (A - 1) * c - sq),
        A + 1 - (A - 1) * c + sq,
        2 * (A - 1 - (A + 1) * c),
        A + 1 - (A - 1) * c - sq,
      );
    }
    return this.setCoefs(
      A * (A + 1 - (A - 1) * c + sq),
      2 * A * (A - 1 - (A + 1) * c),
      A * (A + 1 - (A - 1) * c - sq),
      A + 1 + (A - 1) * c + sq,
      -2 * (A - 1 + (A + 1) * c),
      A + 1 + (A - 1) * c - sq,
    );
  }
  reset(): this {
    this.z1 = this.z2 = 0;
    return this;
  }
  process(x: number): number {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
  /** In-place over buf[start, end). */
  run(buf: Float32Array, start = 0, end = buf.length): void {
    const { b0, b1, b2, a1, a2 } = this;
    let z1 = this.z1;
    let z2 = this.z2;
    for (let i = start; i < end; i++) {
      const x = buf[i];
      const y = b0 * x + z1;
      z1 = b1 * x - a1 * y + z2;
      z2 = b2 * x - a2 * y;
      buf[i] = y;
    }
    // flush denormals
    this.z1 = Math.abs(z1) < 1e-25 ? 0 : z1;
    this.z2 = Math.abs(z2) < 1e-25 ? 0 : z2;
  }
}

/** Topology-preserving-transform state variable filter (stable under fast modulation). */
export class Svf {
  private ic1 = 0;
  private ic2 = 0;
  private a1 = 0;
  private a2 = 0;
  private a3 = 0;
  private k = 1;
  private sr: number;
  constructor(sr: number, f = 1000, q = 0.7071) {
    this.sr = sr;
    this.set(f, q);
  }
  set(f: number, q: number): void {
    const g = Math.tan((Math.PI * clamp(f, 10, this.sr * 0.45)) / this.sr);
    this.k = 1 / q;
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
  }
  /** returns low-pass; band-pass in .bp, high-pass in .hp */
  bp = 0;
  hp = 0;
  lp(x: number): number {
    const v3 = x - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.bp = v1;
    this.hp = x - this.k * v1 - v2;
    return v2;
  }
}

/** One-pole low-pass coefficient for cutoff f. */
export const onePoleCoef = (sr: number, f: number): number => 1 - Math.exp((-TAU * f) / sr);

// ---------------------------------------------------------------------------------------------
// FFT + band-limited wavetables
// ---------------------------------------------------------------------------------------------

export const TABLE_BITS = 11;
export const TABLE_SIZE = 1 << TABLE_BITS; // 2048

/** In-place iterative radix-2 complex FFT (inverse when inv). */
export function fft(re: Float64Array, im: Float64Array, inv: boolean): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i];
      re[i] = re[j];
      re[j] = t;
      t = im[i];
      im[i] = im[j];
      im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inv ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const ar = re[i + k + half] * cr - im[i + k + half] * ci;
        const ai = re[i + k + half] * ci + im[i + k + half] * cr;
        re[i + k + half] = re[i + k] - ar;
        im[i + k + half] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/**
 * Build a single-cycle wavetable (TABLE_SIZE + 1 samples, last = first for interpolation)
 * from harmonic amplitudes amps[k] (k >= 1) and optional phases. Normalised to peak 1.
 */
export function buildTable(amps: ArrayLike<number>, phases?: ArrayLike<number>): Float32Array {
  const n = TABLE_SIZE;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const H = Math.min(amps.length - 1, n / 2 - 1);
  for (let k = 1; k <= H; k++) {
    const a = amps[k];
    if (!a) continue;
    const ph = phases ? phases[k] : 0;
    // sin(kx + ph) = Im(e^{i(kx+ph)}): bin k gets (a/2)(sin ph - i cos ph)·…  use inverse FFT trick
    re[k] = (a / 2) * Math.sin(ph);
    im[k] = (-a / 2) * Math.cos(ph);
    re[n - k] = re[k];
    im[n - k] = -im[k];
  }
  fft(re, im, true);
  const out = new Float32Array(n + 1);
  let peak = 1e-9;
  for (let i = 0; i < n; i++) {
    const v = re[i];
    out[i] = v;
    if (Math.abs(v) > peak) peak = Math.abs(v);
  }
  const g = 1 / peak;
  for (let i = 0; i < n; i++) out[i] *= g;
  out[n] = out[0];
  return out;
}

/** Number of harmonics allowed below `limit` Hz (and Nyquist) for fundamental f. */
export function maxHarmonics(sr: number, f: number, limit = 20000): number {
  return Math.max(1, Math.floor(Math.min(sr * 0.45, limit) / f));
}

/** Schroeder-style low-crest phases. */
export function schroederPhases(H: number): Float64Array {
  const p = new Float64Array(H + 1);
  for (let k = 1; k <= H; k++) p[k] = (Math.PI * k * k) / H;
  return p;
}

/**
 * Wavetable oscillator rendering helper: adds table(phase) * gain into out over [start, end).
 * freqFn is evaluated once per block of 32 samples (vibrato / glides); returns final phase.
 */
export function renderTableOsc(
  table: Float32Array,
  out: Float32Array,
  start: number,
  end: number,
  sr: number,
  phase0: number,
  freqAt: (t: number) => number,
  gainAt: (t: number) => number,
): number {
  const N = TABLE_SIZE;
  const mask = N - 1;
  let ph = phase0 * N;
  for (let b = start; b < end; b += 32) {
    const be = Math.min(end, b + 32);
    const t = b / sr;
    const inc = (freqAt(t) * N) / sr;
    const g0 = gainAt(t);
    const g1 = gainAt(be / sr);
    const dg = (g1 - g0) / (be - b);
    let g = g0;
    for (let i = b; i < be; i++) {
      const ip = ph | 0;
      const fr = ph - ip;
      const i0 = ip & mask;
      const a = table[i0];
      out[i] += (a + (table[i0 + 1] - a) * fr) * g;
      ph += inc;
      if (ph >= N) ph -= N;
      g += dg;
    }
  }
  return ph / N;
}

// ---------------------------------------------------------------------------------------------
// Karplus–Strong plucked string
// ---------------------------------------------------------------------------------------------

export interface KsOpts {
  /** T60 of the fundamental, seconds */
  t60: number;
  /** loss-filter weight 0.02 (bright, long highs) .. 0.5 (dull) */
  damp: number;
  /** excitation low-pass cutoff in Hz */
  exciteHz: number;
  /** pluck position 0..0.5 (fraction of the string length) */
  pick: number;
  seed: number;
  /** excitation amplitude */
  amp?: number;
  /** pitch-dependent stretch: 0 = none (inharmonicity via allpass dispersion not modelled) */
}

/** Adds a KS string into out[offset..). Returns nothing. */
export function ksString(out: Float32Array, offset: number, sr: number, freq: number, o: KsOpts): void {
  const len = out.length - offset;
  if (len <= 0) return;
  const S = clamp(o.damp, 0.01, 0.5);
  const N = sr / freq;
  let L = Math.floor(N - S - 0.1);
  if (L < 2) L = 2;
  const d = N - S - L; // fractional allpass delay in (0.1, 1.1)
  const C = (1 - d) / (1 + d);
  const w0 = (TAU * freq) / sr;
  const hMag = Math.sqrt((1 - S) * (1 - S) + S * S + 2 * S * (1 - S) * Math.cos(w0));
  let g = Math.pow(10, -3 / (freq * o.t60)) / hMag;
  if (g > 0.99995) g = 0.99995;
  // excitation
  const rng = new Rng(o.seed);
  const buf = new Float32Array(L);
  const a = onePoleCoef(sr, o.exciteHz);
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < L; i++) {
    lp += a * (rng.bi() - lp);
    lp2 += a * (lp - lp2);
    buf[i] = lp2;
  }
  // pick-position comb
  const P = Math.max(1, Math.round(o.pick * L));
  const tmp = Float32Array.from(buf);
  for (let i = 0; i < L; i++) buf[i] = tmp[i] - (i >= P ? tmp[i - P] : 0);
  // remove DC, normalise
  let mean = 0;
  for (let i = 0; i < L; i++) mean += buf[i];
  mean /= L;
  let pk = 1e-9;
  for (let i = 0; i < L; i++) {
    buf[i] -= mean;
    if (Math.abs(buf[i]) > pk) pk = Math.abs(buf[i]);
  }
  const amp = (o.amp ?? 1) / pk;
  for (let i = 0; i < L; i++) buf[i] *= amp;
  let idx = 0;
  let xp = 0;
  let x1 = 0;
  let y1 = 0;
  const s1 = 1 - S;
  for (let n = 0; n < len; n++) {
    const x = buf[idx];
    const lf = g * (s1 * x + S * xp);
    xp = x;
    const y = C * (lf - y1) + x1;
    x1 = lf;
    y1 = y;
    buf[idx] = y;
    out[offset + n] += x;
    if (++idx === L) idx = 0;
  }
}

// ---------------------------------------------------------------------------------------------
// Modal synthesis (decaying sinusoids via recursive resonators)
// ---------------------------------------------------------------------------------------------

export interface Partial {
  f: number;
  amp: number;
  t60: number;
  phase?: number;
}

export function addPartials(out: Float32Array, offset: number, sr: number, parts: Partial[], end = out.length): void {
  for (const p of parts) {
    if (p.f >= sr * 0.48 || p.amp === 0) continue;
    const w = (TAU * p.f) / sr;
    const r = Math.exp(-6.907755 / (p.t60 * sr));
    const c1 = 2 * r * Math.cos(w);
    const c2 = r * r;
    const ph = p.phase ?? 0;
    let y1 = p.amp * Math.sin(ph); // y[n-1] (n = offset)
    let y2 = (p.amp * Math.sin(ph - w)) / r; // y[n-2]
    // write y[n] starting from n = offset: y[offset] = y1 by construction, iterate
    // run until amplitude below -100 dB
    const maxN = Math.min(end - offset, Math.ceil((p.t60 * sr * 100) / 60));
    for (let n = 0; n < maxN; n++) {
      out[offset + n] += y1;
      const y = c1 * y1 - c2 * y2;
      y2 = y1;
      y1 = y;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Misc buffer helpers
// ---------------------------------------------------------------------------------------------

export function peakOf(buf: Float32Array, start = 0, end = buf.length): number {
  let p = 0;
  for (let i = start; i < end; i++) {
    const v = buf[i] < 0 ? -buf[i] : buf[i];
    if (v > p) p = v;
  }
  return p;
}

export function scale(buf: Float32Array, g: number): void {
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
}

/** Linear fade-in over n samples at start, fade-out over m samples at end. */
export function fadeEdges(buf: Float32Array, nIn: number, nOut: number): void {
  const L = buf.length;
  nIn = Math.min(nIn, L);
  nOut = Math.min(nOut, L);
  for (let i = 0; i < nIn; i++) buf[i] *= i / nIn;
  for (let i = 0; i < nOut; i++) buf[L - 1 - i] *= i / nOut;
}

/** Trim trailing near-silence (keeps at least minLen). */
export function trimTail(buf: Float32Array, thresh = 1e-4, minLen = 64): Float32Array {
  let e = buf.length;
  while (e > minLen && Math.abs(buf[e - 1]) < thresh) e--;
  if (e === buf.length) return buf;
  const out = buf.slice(0, Math.min(buf.length, e + 32));
  fadeEdges(out, 0, 32);
  return out;
}

/** White noise buffer (seeded). */
export function noise(len: number, seed: number): Float32Array {
  const r = new Rng(seed);
  const b = new Float32Array(len);
  for (let i = 0; i < len; i++) b[i] = r.bi();
  return b;
}

/** Exponential envelope helper: value at t for attack a (lin), decay to 0 with t60. */
export function expDecay(t: number, t60: number): number {
  return Math.exp((-6.907755 * t) / t60);
}
