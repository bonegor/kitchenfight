/**
 * Sound-effect designs. Each effect is synthesized once per variant into a buffer (at unlock,
 * in the background) and then played with a BufferSource — cheap enough for dozens per second.
 * Per-id rate limits / voice caps keep combat from turning into mush.
 */
import type { SfxId } from './audio';
import { addPartials, Biquad, centsToRatio, clamp, ksString, mtof, type Partial, Rng, Svf, TAU } from './dsp';

export interface SfxRender {
  l: Float32Array;
  r: Float32Array | null;
}

export interface SfxDef {
  /** length in seconds */
  len: number;
  /** output gain in dB (after peak normalisation to -1 dBFS) */
  gain: number;
  variants?: number;
  maxVoices?: number;
  /** minimum seconds between triggers */
  minGap?: number;
  /** random playback-rate variation (±fraction) */
  pitchVar?: number;
  /** random volume variation (±fraction) */
  volVar?: number;
  stereo?: boolean;
  /** if true, a new trigger past maxVoices is dropped instead of stealing the oldest */
  drop?: boolean;
  /** rare, important cue: still plays when the global voice cap is reached */
  priority?: boolean;
  gen(g: Gen): void;
}

/** Synthesis context for one sfx render (mono or stereo). */
export class Gen {
  readonly l: Float32Array;
  readonly r: Float32Array | null;
  constructor(
    readonly sr: number,
    len: number,
    stereo: boolean,
    readonly rng: Rng,
    readonly variant: number,
  ) {
    const n = Math.max(16, Math.round(len * sr));
    this.l = new Float32Array(n);
    this.r = stereo ? new Float32Array(n) : null;
  }
  get n(): number {
    return this.l.length;
  }
  /** add v at sample i with pan (-1..1) */
  private put(i: number, v: number, pan: number): void {
    if (this.r) {
      this.l[i] += v * (pan > 0 ? 1 - pan : 1);
      this.r[i] += v * (pan < 0 ? 1 + pan : 1);
    } else this.l[i] += v;
  }

  /**
   * Oscillator with per-sample frequency/amplitude functions (t is local time from t0).
   * wave: sine | tri | saw | square (band-limited with polyBLEP) | pulse
   */
  tone(t0: number, dur: number, f: (t: number) => number, a: (t: number) => number, wave: 'sine' | 'tri' | 'saw' | 'square' = 'sine', pan = 0, phase0 = 0): void {
    const sr = this.sr;
    const s0 = Math.max(0, Math.round(t0 * sr));
    const s1 = Math.min(this.n, Math.round((t0 + dur) * sr));
    let ph = phase0;
    let tri = 0;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      const fr = f(t);
      const dt = fr / sr;
      let v: number;
      if (wave === 'sine') v = Math.sin(TAU * ph);
      else {
        // polyBLEP saw / square
        let saw = 2 * ph - 1;
        saw -= polyBlep(ph, dt);
        if (wave === 'saw') v = saw;
        else {
          let sq = ph < 0.5 ? 1 : -1;
          sq += polyBlep(ph, dt);
          sq -= polyBlep((ph + 0.5) % 1, dt);
          if (wave === 'square') v = sq;
          else {
            tri = tri + 4 * dt * sq; // leaky integrated square → triangle
            tri *= 0.999;
            v = tri;
          }
        }
      }
      this.put(i, v * a(t), pan);
      ph += dt;
      if (ph >= 1) ph -= 1;
    }
  }

  /** Filtered noise; filter cutoff may vary with time (updated every 16 samples). */
  noise(t0: number, dur: number, a: (t: number) => number, type: 'lp' | 'bp' | 'hp' | 'none' = 'none', fc: (t: number) => number = () => 1000, q = 0.7, pan = 0): void {
    const sr = this.sr;
    const s0 = Math.max(0, Math.round(t0 * sr));
    const s1 = Math.min(this.n, Math.round((t0 + dur) * sr));
    const svf = new Svf(sr, fc(0), q);
    const rng = this.rng;
    for (let b = s0; b < s1; b += 16) {
      const be = Math.min(s1, b + 16);
      if (type !== 'none') svf.set(fc((b - s0) / sr), q);
      for (let i = b; i < be; i++) {
        const x = rng.bi();
        let v = x;
        if (type !== 'none') {
          const lp = svf.lp(x);
          v = type === 'lp' ? lp : type === 'bp' ? svf.bp : svf.hp;
        }
        this.put(i, v * a((i - s0) / sr), pan);
      }
    }
  }

  /** Sparse random clicks (crackle / droplets / debris). */
  crackle(t0: number, dur: number, density: (t: number) => number, amp: number, hpHz = 2500, pan = 0): void {
    const sr = this.sr;
    const s0 = Math.max(0, Math.round(t0 * sr));
    const s1 = Math.min(this.n, Math.round((t0 + dur) * sr));
    const hp = Biquad.hp(sr, hpHz, 0.7);
    const rng = this.rng;
    let clickLeft = 0;
    let clickAmp = 0;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / sr;
      if (clickLeft <= 0 && rng.next() < density(t) / sr) {
        clickLeft = Math.round((0.0006 + rng.next() * 0.002) * sr);
        clickAmp = amp * (0.3 + 0.7 * rng.next());
      }
      let x = 0;
      if (clickLeft > 0) {
        x = rng.bi() * clickAmp;
        clickLeft--;
      }
      this.put(i, hp.process(x), pan);
    }
  }

  /** Karplus–Strong pluck (mandolin-ish double course). */
  pluck(t0: number, midi: number, amp: number, t60 = 0.8, bright = 6000, pan = 0): void {
    const s0 = Math.round(t0 * this.sr);
    if (s0 >= this.n) return;
    const tmp = new Float32Array(this.n - s0);
    const f = mtof(midi);
    const seed = this.rng.int(1 << 30);
    ksString(tmp, 0, this.sr, f * centsToRatio(-1.5), { t60, damp: 0.12, exciteHz: bright, pick: 0.13, seed, amp });
    ksString(tmp, Math.round(0.003 * this.sr), this.sr, f * centsToRatio(1.5), { t60, damp: 0.13, exciteHz: bright, pick: 0.15, seed: seed + 1, amp: amp * 0.8 });
    const hp = Biquad.hp(this.sr, 200, 0.7);
    for (let i = 0; i < tmp.length; i++) this.put(s0 + i, hp.process(tmp[i]) * 0.5, pan);
  }

  /** Modal bell / metal ping. */
  bell(t0: number, parts: Partial[], amp = 1, pan = 0): void {
    const s0 = Math.round(t0 * this.sr);
    if (s0 >= this.n) return;
    const tmp = new Float32Array(this.n - s0);
    addPartials(tmp, 0, this.sr, parts.map((p) => ({ ...p, amp: p.amp * amp })));
    for (let i = 0; i < tmp.length; i++) this.put(s0 + i, tmp[i], pan);
  }

  /** Formant "voice" growl/oof: pulse source through vowel formants. */
  formant(t0: number, dur: number, f0: (t: number) => number, a: (t: number) => number, formants: (t: number) => [number, number, number], jitter = 0, drive = 0, pan = 0): void {
    const sr = this.sr;
    const s0 = Math.max(0, Math.round(t0 * sr));
    const s1 = Math.min(this.n, Math.round((t0 + dur) * sr));
    const f1 = new Svf(sr, 700, 6);
    const f2 = new Svf(sr, 1200, 8);
    const f3 = new Svf(sr, 2600, 10);
    let ph = 0;
    let jit = 1;
    for (let b = s0; b < s1; b += 16) {
      const t = (b - s0) / sr;
      const [a1, a2, a3] = formants(t);
      f1.set(a1, 5);
      f2.set(a2, 7);
      f3.set(a3, 9);
      const be = Math.min(s1, b + 16);
      for (let i = b; i < be; i++) {
        const tt = (i - s0) / sr;
        const fr = f0(tt) * jit;
        ph += fr / sr;
        if (ph >= 1) {
          ph -= 1;
          if (jitter) jit = 1 + this.rng.bi() * jitter;
        }
        // glottal-ish pulse: sharp closing phase
        const src = ph < 0.6 ? Math.sin((Math.PI * ph) / 0.6) ** 2 : 0;
        const x = src - 0.35;
        f1.lp(x);
        f2.lp(x);
        f3.lp(x);
        let v = f1.bp * 1.0 + f2.bp * 0.6 + f3.bp * 0.25;
        if (drive) v = Math.tanh(v * (1 + drive)) / Math.tanh(1 + drive);
        this.put(i, v * a(tt), pan);
      }
    }
  }

  /** Post-process: biquad over the whole output. */
  filter(bq: () => Biquad): void {
    bq().run(this.l);
    if (this.r) bq().run(this.r);
  }
}

function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

// --------------------------------------------------------------------------------------------
// Envelope shorthands
// --------------------------------------------------------------------------------------------

/** attack (linear) then exponential decay with time constant d */
const ad =
  (a: number, d: number, peak = 1) =>
  (t: number): number =>
    t < a ? (peak * t) / Math.max(1e-6, a) : peak * Math.exp(-(t - a) / d);
/** exponential glide from f0 to f1 with time constant tau */
const glide =
  (f0: number, f1: number, tau: number) =>
  (t: number): number =>
    f1 + (f0 - f1) * Math.exp(-t / tau);
/** linear interpolation through [t, v] points */
const lin =
  (...pts: Array<[number, number]>) =>
  (t: number): number => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (t <= pts[i][0]) {
        const [t0, v0] = pts[i - 1];
        const [t1, v1] = pts[i];
        return v0 + ((v1 - v0) * (t - t0)) / Math.max(1e-9, t1 - t0);
      }
    }
    return pts[pts.length - 1][1];
  };
const expSweep =
  (f0: number, f1: number, dur: number) =>
  (t: number): number =>
    f0 * Math.pow(f1 / f0, clamp(t / dur, 0, 1));

const note = (n: number): number => mtof(n);
/** glockenspiel-like ping */
const glockParts = (f: number, t60 = 1.2): Partial[] => [
  { f, amp: 1, t60 },
  { f: f * 2.76, amp: 0.35, t60: t60 * 0.35 },
  { f: f * 5.4, amp: 0.15, t60: t60 * 0.15 },
];
const handbell = (f: number, t60 = 1.3): Partial[] => [
  { f, amp: 1, t60 },
  { f: f * 2.0, amp: 0.55, t60: t60 * 0.7 },
  { f: f * 2.92, amp: 0.45, t60: t60 * 0.5 },
  { f: f * 4.16, amp: 0.22, t60: t60 * 0.35 },
  { f: f * 5.43, amp: 0.12, t60: t60 * 0.25 },
];

// --------------------------------------------------------------------------------------------
// The library
// --------------------------------------------------------------------------------------------

export const SFX: Record<SfxId, SfxDef> = {
  // ---------------------------------------------------------------- UI
  ui_hover: {
    len: 0.04,
    gain: -21,
    maxVoices: 2,
    minGap: 0.035,
    pitchVar: 0.03,
    gen(g) {
      g.tone(0, 0.035, glide(2500, 2200, 0.01), ad(0.001, 0.007), 'sine');
      g.noise(0, 0.004, ad(0.0003, 0.0015, 0.25), 'hp', () => 5000);
    },
  },
  ui_click: {
    len: 0.09,
    gain: -12,
    maxVoices: 2,
    minGap: 0.03,
    pitchVar: 0.03,
    gen(g) {
      g.tone(0, 0.08, glide(900, 620, 0.02), ad(0.001, 0.022), 'sine');
      g.noise(0, 0.02, ad(0.0005, 0.004, 0.6), 'bp', () => 2100, 1.8);
    },
  },
  ui_back: {
    len: 0.16,
    gain: -14,
    maxVoices: 2,
    minGap: 0.05,
    gen(g) {
      g.tone(0, 0.06, () => note(84), ad(0.002, 0.025), 'tri');
      g.tone(0.055, 0.1, glide(note(79), note(77), 0.06), ad(0.002, 0.04), 'tri');
    },
  },
  ui_confirm: {
    priority: true,
    len: 0.5,
    gain: -9,
    maxVoices: 2,
    minGap: 0.06,
    gen(g) {
      g.pluck(0, 79, 0.8, 0.6, 7000, -0.1);
      g.pluck(0.065, 86, 0.9, 0.7, 7000, 0.1);
      g.bell(0.065, glockParts(note(98), 0.5), 0.12);
    },
  },
  ui_buy: {
    priority: true,
    len: 0.75,
    gain: -8,
    maxVoices: 2,
    minGap: 0.08,
    gen(g) {
      // "cha": drawer rattle + chunk
      g.noise(0, 0.07, (t) => ad(0.002, 0.03)(t) * (0.6 + 0.4 * Math.sin(TAU * 140 * t)), 'bp', () => 3200, 1.2);
      g.tone(0, 0.06, glide(210, 95, 0.02), ad(0.001, 0.03, 0.8), 'sine');
      // "ching": two bright bell strikes
      g.bell(0.085, handbell(2350, 0.6), 0.55, -0.15);
      g.bell(0.13, handbell(3140, 0.5), 0.45, 0.15);
      g.crackle(0.09, 0.25, (t) => 900 * Math.exp(-t / 0.08), 0.25, 5000);
    },
  },
  ui_error: {
    priority: true,
    len: 0.26,
    gain: -15,
    maxVoices: 1,
    minGap: 0.15,
    gen(g) {
      const env = (t: number) => (t < 0.09 ? Math.min(1, t / 0.008) * (1 - Math.max(0, t - 0.07) / 0.02) : t > 0.13 && t < 0.24 ? Math.min(1, (t - 0.13) / 0.008) * (1 - Math.max(0, t - 0.22) / 0.02) : 0);
      g.tone(0, 0.25, () => 150, env, 'square');
      g.tone(0, 0.25, () => 157, (t) => env(t) * 0.8, 'square');
      g.filter(() => Biquad.lp(g.sr, 1100, 0.7));
    },
  },
  ui_unlock: {
    priority: true,
    len: 1.2,
    gain: -8,
    maxVoices: 1,
    minGap: 0.3,
    stereo: true,
    gen(g) {
      [84, 88, 91, 96, 100].forEach((m, i) => g.bell(i * 0.07, glockParts(note(m), 0.9), 0.7, -0.4 + i * 0.2));
      g.noise(0.05, 1.0, (t) => 0.18 * Math.exp(-t / 0.35) * (0.5 + 0.5 * Math.sin(TAU * 23 * t)), 'hp', () => 8000, 0.7);
      [72, 76, 79].forEach((m) => g.tone(0, 1.1, () => note(m), (t) => 0.12 * Math.min(1, t / 0.15) * Math.exp(-t / 0.5), 'sine'));
    },
  },
  ui_tick: {
    len: 0.03,
    gain: -20,
    maxVoices: 3,
    minGap: 0.025,
    pitchVar: 0.04,
    gen(g) {
      g.tone(0, 0.025, () => 3300, ad(0.0005, 0.005), 'sine');
      g.noise(0, 0.003, ad(0.0002, 0.001, 0.4), 'hp', () => 4000);
    },
  },

  // ---------------------------------------------------------------- progression
  levelup: {
    priority: true,
    len: 1.4,
    gain: -5,
    maxVoices: 1,
    minGap: 0.25,
    stereo: true,
    gen(g) {
      const arp = [72, 76, 79, 84, 88, 91];
      arp.forEach((m, i) => {
        g.pluck(i * 0.055, m, 0.9, 0.7, 7000, -0.3 + i * 0.12);
        g.bell(i * 0.055, glockParts(note(m + 12), 0.6), 0.25, 0.3 - i * 0.1);
      });
      // final chord with tremolo
      for (let k = 0; k < 7; k++) {
        const t = 0.36 + k * 0.07;
        [84, 88, 91].forEach((m, j) => g.pluck(t + j * 0.006, m, k === 0 ? 0.9 : 0.55, 0.5, 6500, -0.3 + j * 0.3));
      }
      g.bell(0.36, glockParts(note(96), 1.2), 0.5);
      g.noise(0, 0.38, (t) => 0.25 * (t / 0.38) ** 2, 'bp', expSweep(500, 6000, 0.38), 1.5);
    },
  },
  chest_drop: {
    priority: true,
    len: 0.7,
    gain: -7,
    maxVoices: 2,
    minGap: 0.1,
    gen(g) {
      g.tone(0, 0.3, glide(110, 52, 0.05), ad(0.002, 0.11), 'sine');
      g.noise(0, 0.08, ad(0.001, 0.025, 0.8), 'lp', () => 380, 0.8);
      g.crackle(0.005, 0.12, (t) => 900 * Math.exp(-t / 0.05), 0.7, 1800);
      g.noise(0, 0.05, ad(0.001, 0.012, 0.35), 'bp', () => 1100, 1.2);
      g.bell(0.13, glockParts(note(100), 0.5), 0.25);
      g.bell(0.21, glockParts(note(95), 0.6), 0.2);
    },
  },
  chest_open: {
    priority: true,
    len: 1.7,
    gain: -6,
    maxVoices: 1,
    minGap: 0.5,
    stereo: true,
    gen(g) {
      // drum roll (crescendo)
      for (let k = 0; k < 26; k++) {
        const t = k * 0.03;
        const amp = 0.25 + 0.75 * (k / 25) ** 1.5;
        g.noise(t, 0.04, ad(0.001, 0.012, amp), 'bp', () => 3800, 0.6, k % 2 ? 0.2 : -0.2);
        g.tone(t, 0.03, glide(260, 180, 0.01), ad(0.001, 0.01, amp * 0.5), 'sine');
      }
      // reveal: cymbal + bright chord + sparkle
      g.noise(0.8, 0.85, ad(0.002, 0.3, 0.6), 'hp', () => 3500, 0.7, -0.2);
      g.noise(0.8, 0.85, ad(0.002, 0.3, 0.6), 'hp', () => 3700, 0.7, 0.2);
      [60, 64, 67, 72].forEach((m, i) => g.tone(0.8, 0.9, () => note(m), (t) => 0.22 * Math.min(1, t / 0.01) * Math.exp(-t / 0.35), 'saw', -0.3 + i * 0.2));
      g.filter(() => Biquad.lp(g.sr, 7000, 0.7));
      g.bell(0.8, glockParts(note(96), 1.0), 0.5, 0.2);
      g.bell(0.88, glockParts(note(100), 1.0), 0.4, -0.2);
    },
  },
  chest_reward: {
    priority: true,
    len: 1.1,
    gain: -8,
    maxVoices: 2,
    minGap: 0.12,
    stereo: true,
    gen(g) {
      [91, 88, 84, 91, 96].forEach((m, i) => g.bell(i * 0.075, glockParts(note(m), 0.9), 0.6, -0.4 + i * 0.2));
      g.noise(0, 1.0, (t) => 0.15 * Math.exp(-t / 0.3) * (0.5 + 0.5 * Math.sin(TAU * 31 * t)), 'hp', () => 7500, 0.7);
    },
  },
  evolution: {
    priority: true,
    len: 2.6,
    gain: -4,
    maxVoices: 1,
    minGap: 1,
    stereo: true,
    gen(g) {
      // riser
      g.noise(0, 1.4, (t) => 0.35 * (t / 1.4) ** 2, 'bp', expSweep(300, 5000, 1.4), 2, -0.2);
      g.noise(0, 1.4, (t) => 0.35 * (t / 1.4) ** 2, 'bp', expSweep(330, 5200, 1.4), 2, 0.2);
      // choir swell (C add9)
      const chord = [48, 55, 64, 74];
      chord.forEach((m, i) =>
        g.formant(
          0,
          2.5,
          (t) => note(m) * (1 + 0.006 * Math.sin(TAU * (4.8 + i * 0.3) * t)),
          (t) => 0.32 * Math.min(1, (t / 1.3) ** 1.5) * (t > 1.9 ? Math.max(0, 1 - (t - 1.9) / 0.6) : 1),
          () => (m < 60 ? [700, 1100, 2600] : [800, 1150, 2900]),
          0.004,
          0,
          -0.45 + i * 0.3,
        ),
      );
      // bell hit + sparkle
      g.bell(1.35, handbell(note(84), 1.6), 0.6, 0);
      g.bell(1.35, glockParts(note(96), 1.2), 0.45, 0.3);
      g.noise(1.35, 1.2, (t) => 0.2 * Math.exp(-t / 0.4) * (0.5 + 0.5 * Math.sin(TAU * 27 * t)), 'hp', () => 8000, 0.7);
    },
  },
  new_weapon: {
    priority: true,
    len: 0.9,
    gain: -7,
    maxVoices: 1,
    minGap: 0.3,
    gen(g) {
      const stab = (t0: number, m: number, d: number) =>
        [0, 12].forEach((o) => g.tone(t0, d + 0.2, () => note(m + o), (t) => (o ? 0.3 : 0.5) * Math.min(1, t / 0.012) * (t < d ? 1 : Math.exp(-(t - d) / 0.06)), 'saw'));
      stab(0, 67, 0.07);
      stab(0.09, 72, 0.07);
      stab(0.18, 76, 0.45);
      g.filter(() => Biquad.lp(g.sr, 3500, 0.9));
      g.bell(0.18, glockParts(note(100), 0.8), 0.35);
    },
  },

  // ---------------------------------------------------------------- pickups
  pickup_xp: {
    len: 0.08,
    gain: -13,
    maxVoices: 4,
    minGap: 0.022,
    pitchVar: 0.015,
    gen(g) {
      g.tone(0, 0.075, glide(1250, 1780, 0.018), ad(0.0015, 0.024), 'sine');
      g.tone(0, 0.075, glide(2500, 3560, 0.018), ad(0.0015, 0.012, 0.18), 'sine');
    },
  },
  pickup_coin: {
    len: 0.45,
    gain: -12,
    maxVoices: 4,
    minGap: 0.03,
    pitchVar: 0.02,
    gen(g) {
      const ting = (f: number): Partial[] => [
        { f, amp: 1, t60: 0.35 },
        { f: f * 2.31, amp: 0.45, t60: 0.2 },
        { f: f * 3.9, amp: 0.2, t60: 0.1 },
      ];
      g.bell(0, ting(2093), 0.7);
      g.bell(0.045, ting(2794), 0.8);
    },
  },
  pickup_heal: {
    priority: true,
    len: 0.7,
    gain: -10,
    maxVoices: 2,
    minGap: 0.1,
    gen(g) {
      [72, 76, 79].forEach((m, i) =>
        g.tone(0, 0.65, (t) => note(m) * Math.pow(2, (5 / 12) * Math.min(1, t / 0.35)), (t) => 0.3 * Math.min(1, t / 0.04) * Math.exp(-t / 0.22) * (1 + 0.15 * Math.sin(TAU * 7 * t + i)), 'tri'),
      );
      g.bell(0.3, glockParts(note(96), 0.6), 0.25);
    },
  },
  pickup_bell: {
    priority: true,
    len: 1.6,
    gain: -6,
    maxVoices: 1,
    minGap: 0.6,
    gen(g) {
      [0, 0.17, 0.34].forEach((t, i) => {
        g.bell(t, handbell(1320 * [1, 1.004, 0.997][i], 1.2), i === 2 ? 0.9 : 0.75);
        g.noise(t, 0.006, ad(0.0003, 0.0015, 0.5), 'hp', () => 3000);
      });
    },
  },
  pickup_spumante: {
    priority: true,
    len: 1.5,
    gain: -6,
    maxVoices: 1,
    minGap: 0.4,
    stereo: true,
    gen(g) {
      // cork pop
      g.tone(0, 0.05, glide(560, 170, 0.012), ad(0.0008, 0.015), 'sine');
      g.noise(0, 0.012, ad(0.0003, 0.003, 0.8), 'bp', () => 1600, 1.5);
      // fizz
      g.crackle(0.03, 1.4, (t) => 2500 * Math.exp(-t / 0.5), 0.35, 4000, -0.3);
      g.crackle(0.03, 1.4, (t) => 2500 * Math.exp(-t / 0.5), 0.35, 4000, 0.3);
      g.noise(0.02, 1.4, (t) => 0.12 * Math.min(1, t / 0.05) * Math.exp(-t / 0.45), 'hp', () => 6500, 0.7);
    },
  },
  pickup_gelato: {
    priority: true,
    len: 1.1,
    gain: -8,
    maxVoices: 1,
    minGap: 0.4,
    stereo: true,
    gen(g) {
      [3100, 4650, 6900, 8230].forEach((f, i) => g.tone(0, 1.0, () => f, (t) => 0.12 * Math.min(1, t / 0.05) * Math.exp(-t / (0.5 - i * 0.08)), 'sine', -0.4 + i * 0.27));
      [100, 95, 91, 88].forEach((m, i) => g.bell(i * 0.06, [{ f: note(m), amp: 1, t60: 0.6 }, { f: note(m) * 3.1, amp: 0.3, t60: 0.2 }], 0.45, 0.4 - i * 0.25));
      g.noise(0, 0.6, (t) => 0.2 * Math.exp(-t / 0.18), 'hp', expSweep(9000, 4500, 0.5), 0.8);
    },
  },

  // ---------------------------------------------------------------- player
  player_hurt: {
    priority: true,
    len: 0.2,
    gain: -11,
    variants: 3,
    maxVoices: 2,
    minGap: 0.11,
    pitchVar: 0.05,
    gen(g) {
      const v = g.variant;
      g.tone(0, 0.12, glide(230 + v * 12, 120, 0.03), ad(0.002, 0.035, 0.7), 'sine');
      g.noise(0, 0.04, ad(0.001, 0.012, 0.6), 'bp', () => 900, 1.0);
      g.formant(0.005, 0.16, glide(160 - v * 8, 118, 0.08), (t) => 0.9 * Math.min(1, t / 0.01) * Math.exp(-t / 0.055), () => [500, 850, 2450], 0.01);
    },
  },
  player_death: {
    priority: true,
    len: 1.5,
    gain: -6,
    maxVoices: 1,
    minGap: 0.5,
    gen(g) {
      g.tone(0, 0.95, (t) => expSweep(1400, 210, 0.9)(t) * (1 + 0.02 * Math.sin(TAU * 7 * t)), (t) => 0.5 * Math.min(1, t / 0.03) * (t > 0.85 ? Math.max(0, 1 - (t - 0.85) / 0.1) : 1), 'sine');
      g.tone(0, 0.95, (t) => 2 * expSweep(1400, 210, 0.9)(t), (t) => 0.08 * Math.min(1, t / 0.03) * (t > 0.85 ? 0 : 1), 'sine');
      // bonk
      g.tone(0.95, 0.3, glide(240, 65, 0.04), ad(0.001, 0.08), 'sine');
      g.noise(0.95, 0.05, ad(0.0005, 0.01, 0.6), 'bp', () => 1600, 2);
    },
  },
  player_revive: {
    priority: true,
    len: 1.4,
    gain: -6,
    maxVoices: 1,
    minGap: 0.5,
    stereo: true,
    gen(g) {
      g.tone(0, 0.8, (t) => expSweep(300, 1500, 0.75)(t) * (1 + 0.015 * Math.sin(TAU * 6 * t)), (t) => 0.35 * Math.min(1, t / 0.1) * (t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.1) : 1), 'sine');
      [60, 64, 67, 72].forEach((m, i) => g.formant(0.55, 0.8, () => note(m), (t) => 0.3 * Math.min(1, t / 0.12) * Math.exp(-t / 0.35), () => [800, 1150, 2900], 0.004, 0, -0.3 + i * 0.2));
      g.bell(0.75, handbell(note(84), 1.0), 0.5);
      g.noise(0.6, 0.8, (t) => 0.15 * Math.exp(-t / 0.3) * (0.5 + 0.5 * Math.sin(TAU * 25 * t)), 'hp', () => 7500, 0.7);
    },
  },
  low_hp: {
    priority: true,
    len: 0.5,
    gain: -6,
    maxVoices: 1,
    minGap: 0.35,
    gen(g) {
      [
        [0, 1],
        [0.21, 0.78],
      ].forEach(([t, a]) => {
        g.tone(t, 0.16, glide(95, 55, 0.04), ad(0.004, 0.05, a), 'sine');
        g.tone(t, 0.1, glide(190, 120, 0.03), ad(0.003, 0.03, 1.1 * a), 'sine');
        g.noise(t, 0.05, ad(0.002, 0.012, 0.9 * a), 'bp', () => 420, 1.2);
      });
    },
  },

  // ---------------------------------------------------------------- enemies
  hit: {
    len: 0.09,
    gain: -12,
    variants: 4,
    maxVoices: 4,
    minGap: 0.03,
    pitchVar: 0.08,
    volVar: 0.15,
    gen(g) {
      const v = g.variant;
      const f0 = 380 + v * 30;
      g.tone(0, 0.07, glide(f0, 165, 0.012), ad(0.0008, 0.02, 0.75), 'sine');
      g.noise(0, 0.045, ad(0.0005, 0.011, 0.95), 'bp', glide(1700 + v * 150, 800, 0.015), 1.3);
      g.tone(0.003, 0.05, (t) => glide(760 - v * 40, 360, 0.02)(t) * (1 + 0.3 * Math.sin(TAU * 70 * t)), ad(0.002, 0.014, 0.4), 'sine');
    },
  },
  hit_crit: {
    len: 0.3,
    gain: -11,
    variants: 2,
    maxVoices: 3,
    minGap: 0.05,
    pitchVar: 0.05,
    gen(g) {
      g.tone(0, 0.08, glide(300, 120, 0.014), ad(0.0008, 0.026), 'sine');
      g.noise(0, 0.04, ad(0.0005, 0.009, 0.7), 'bp', glide(1800, 800, 0.015), 1.1);
      const f = 2900 + g.variant * 260;
      g.bell(0.003, [
        { f, amp: 0.5, t60: 0.18 },
        { f: f * 1.48, amp: 0.35, t60: 0.13 },
        { f: f * 2.1, amp: 0.2, t60: 0.09 },
      ]);
      g.noise(0, 0.05, ad(0.0005, 0.012, 0.3), 'hp', () => 7000);
    },
  },
  enemy_death: {
    len: 0.28,
    gain: -10,
    variants: 4,
    maxVoices: 4,
    minGap: 0.035,
    pitchVar: 0.08,
    volVar: 0.1,
    gen(g) {
      const v = g.variant;
      g.noise(0, 0.12, ad(0.001, 0.03, 0.9), 'lp', glide(3200 - v * 200, 450, 0.03), 0.9);
      g.tone(0, 0.11, glide(420 - v * 20, 120, 0.03), ad(0.001, 0.03, 0.7), 'sine');
      for (let k = 0; k < 4; k++) {
        const t = 0.03 + g.rng.next() * 0.13;
        g.tone(t, 0.02, glide(1500 + g.rng.next() * 1600, 900, 0.006), ad(0.0005, 0.005, 0.18), 'sine');
      }
    },
  },
  enemy_death_big: {
    len: 0.65,
    gain: -7,
    variants: 2,
    maxVoices: 2,
    minGap: 0.08,
    pitchVar: 0.05,
    gen(g) {
      g.tone(0, 0.3, glide(85, 40, 0.06), ad(0.002, 0.1), 'sine');
      g.noise(0, 0.35, ad(0.001, 0.08, 0.9), 'lp', glide(2400, 220, 0.08), 0.9);
      g.tone(0.01, 0.25, glide(200 - g.variant * 20, 60, 0.06), ad(0.002, 0.07, 0.6), 'sine');
      g.noise(0, 0.22, ad(0.001, 0.05, 1.1), 'bp', glide(1500, 700, 0.04), 1.1);
      for (let k = 0; k < 7; k++) {
        const t = 0.04 + g.rng.next() * 0.3;
        g.tone(t, 0.025, glide(1200 + g.rng.next() * 1800, 700, 0.008), ad(0.0005, 0.006, 0.15), 'sine');
      }
    },
  },
  enemy_shoot: {
    len: 0.2,
    gain: -15,
    variants: 2,
    maxVoices: 3,
    minGap: 0.05,
    pitchVar: 0.08,
    gen(g) {
      g.noise(0, 0.17, (t) => ad(0.008, 0.05, 0.9)(t) * (0.7 + 0.3 * Math.sin(TAU * (42 + g.variant * 6) * t)), 'bp', expSweep(500, 2300, 0.11), 3);
      g.noise(0, 0.02, ad(0.0005, 0.005, 0.4), 'lp', () => 900);
    },
  },
  enemy_dash: {
    len: 0.32,
    gain: -12,
    maxVoices: 2,
    minGap: 0.08,
    pitchVar: 0.06,
    gen(g) {
      [0, 0.035].forEach((t) => {
        g.noise(t, 0.006, ad(0.0003, 0.0015, 0.8), 'hp', () => 5000);
        g.bell(t, [
          { f: 4200, amp: 0.25, t60: 0.06 },
          { f: 6300, amp: 0.12, t60: 0.04 },
        ]);
      });
      g.noise(0.04, 0.27, (t) => 0.5 * Math.sin(Math.PI * Math.min(1, t / 0.26)) ** 2, 'bp', lin([0, 700], [0.12, 3500], [0.26, 1200]), 1.4);
    },
  },
  enemy_split: {
    len: 0.24,
    gain: -12,
    maxVoices: 2,
    minGap: 0.06,
    pitchVar: 0.06,
    gen(g) {
      g.tone(0, 0.16, (t) => expSweep(330, 540, 0.12)(t) * (1 + 0.1 * Math.sin(TAU * 38 * t)), ad(0.003, 0.05, 0.6), 'sine', -0.3);
      g.tone(0, 0.16, (t) => expSweep(330, 200, 0.12)(t) * (1 + 0.1 * Math.sin(TAU * 33 * t)), ad(0.003, 0.05, 0.6), 'sine', 0.3);
      g.noise(0, 0.06, ad(0.001, 0.015, 0.4), 'lp', glide(2500, 500, 0.02), 0.8);
    },
  },
  elite_spawn: {
    priority: true,
    len: 1.3,
    gain: -6,
    maxVoices: 1,
    minGap: 0.6,
    stereo: true,
    gen(g) {
      [40, 41, 46].forEach((m, i) => g.tone(0, 1.25, () => note(m) * (1 + 0.004 * Math.sin(TAU * (3 + i) * 0.5)), (t) => 0.35 * Math.min(1, t / 0.18) * Math.exp(-Math.max(0, t - 0.4) / 0.35), 'saw', -0.4 + i * 0.4));
      g.filter(() => Biquad.lp(g.sr, 900, 1.2));
      g.noise(0, 0.42, (t) => 0.3 * (t / 0.42) ** 3, 'hp', () => 4000, 0.7, 0);
      g.tone(0.4, 0.6, glide(70, 34, 0.1), ad(0.003, 0.2, 0.9), 'sine');
    },
  },
  prop_break: {
    len: 0.38,
    gain: -10,
    variants: 3,
    maxVoices: 3,
    minGap: 0.05,
    pitchVar: 0.07,
    gen(g) {
      g.tone(0, 0.09, glide(170, 85, 0.025), ad(0.001, 0.03, 0.6), 'sine');
      for (let k = 0; k < 12 + g.variant * 2; k++) {
        const t = g.rng.next() ** 1.5 * 0.16;
        const f = 800 + g.rng.next() * 1800;
        g.noise(t, 0.012, ad(0.0005, 0.003 + g.rng.next() * 0.004, 0.9 + g.rng.next() * 0.6), 'bp', () => f, 2.5);
      }
      g.noise(0.01, 0.3, ad(0.01, 0.08, 0.3), 'lp', () => 1100, 0.7);
    },
  },

  // ---------------------------------------------------------------- bosses
  boss_warning: {
    priority: true,
    len: 2.1,
    gain: -6,
    maxVoices: 1,
    minGap: 1.5,
    stereo: true,
    gen(g) {
      const hi = 932;
      const lo = 698;
      const seg = 0.42;
      const f = (t: number) => {
        const k = Math.floor(t / seg);
        const target = k % 2 ? lo : hi;
        const prev = k % 2 ? hi : lo;
        const x = t - k * seg;
        return (k === 0 ? target : prev + (target - prev) * Math.min(1, x / 0.012)) * (1 + 0.004 * Math.sin(TAU * 6 * t));
      };
      const env = (t: number) => Math.min(1, t / 0.02) * (t > 1.68 ? Math.max(0, 1 - (t - 1.68) / 0.12) : 1);
      g.tone(0, 1.85, f, (t) => 0.32 * env(t), 'square', -0.15);
      g.tone(0, 1.85, (t) => f(t) * 1.003, (t) => 0.22 * env(t), 'saw', 0.15);
      g.filter(() => Biquad.lp(g.sr, 2800, 0.8));
      g.tone(0, 2.05, () => 55, (t) => 0.45 * Math.min(1, t / 0.6) * (t > 1.8 ? Math.max(0, 1 - (t - 1.8) / 0.25) : 1), 'saw', 0);
      g.filter(() => Biquad.hp(g.sr, 40, 0.7));
    },
  },
  boss_roar: {
    priority: true,
    len: 1.4,
    gain: -5,
    maxVoices: 1,
    minGap: 0.6,
    gen(g) {
      g.formant(
        0,
        1.35,
        (t) => 78 * (1 + 0.06 * Math.sin(TAU * 5 * t)) * (t < 0.15 ? 0.8 + (1.33 * t) : 1),
        (t) => Math.min(1, t / 0.08) * (t > 1.0 ? Math.max(0, 1 - (t - 1.0) / 0.35) : 1) * (0.8 + 0.2 * Math.sin(TAU * 31 * t)),
        (t) => [lin([0, 720], [1.3, 450])(t), lin([0, 1150], [1.3, 780])(t), 2500],
        0.05,
        2.5,
      );
      g.noise(0, 1.3, (t) => 0.18 * Math.min(1, t / 0.1) * Math.exp(-t / 0.6), 'bp', () => 850, 1.2);
    },
  },
  boss_slam: {
    priority: true,
    len: 1.0,
    gain: -4,
    maxVoices: 2,
    minGap: 0.15,
    gen(g) {
      g.tone(0, 0.7, glide(115, 36, 0.07), ad(0.001, 0.25), 'sine');
      g.noise(0, 0.6, ad(0.001, 0.12, 0.9), 'lp', glide(2600, 260, 0.12), 0.8);
      g.crackle(0.02, 0.5, (t) => 700 * Math.exp(-t / 0.15), 0.8, 1200);
      g.noise(0, 0.3, ad(0.001, 0.06, 0.6), 'bp', glide(1400, 500, 0.08), 1.0);
      g.tone(0, 0.2, glide(60, 45, 0.1), ad(0.001, 0.08, 0.5), 'square');
      g.filter(() => Biquad.lp(g.sr, 5000, 0.7));
    },
  },
  boss_shoot: {
    len: 0.38,
    gain: -9,
    maxVoices: 2,
    minGap: 0.08,
    pitchVar: 0.06,
    gen(g) {
      g.noise(0, 0.32, (t) => ad(0.01, 0.09, 0.9)(t) * (0.75 + 0.25 * Math.sin(TAU * 36 * t)), 'bp', expSweep(300, 1600, 0.2), 2.5);
      g.tone(0, 0.16, glide(150, 70, 0.04), ad(0.002, 0.05, 0.7), 'sine');
      g.noise(0.01, 0.25, (t) => ad(0.01, 0.06, 0.7)(t) * (0.7 + 0.3 * Math.sin(TAU * 40 * t)), 'bp', expSweep(800, 2500, 0.15), 2.5);
    },
  },
  boss_death: {
    priority: true,
    len: 3.0,
    gain: -3,
    maxVoices: 1,
    minGap: 1.5,
    stereo: true,
    gen(g) {
      // explosion
      g.tone(0, 0.9, glide(75, 28, 0.15), ad(0.002, 0.35), 'sine');
      g.noise(0, 1.6, ad(0.002, 0.45, 0.9), 'lp', expSweep(6000, 160, 1.4), 0.8, -0.25);
      g.noise(0, 1.6, ad(0.002, 0.45, 0.9), 'lp', expSweep(5500, 150, 1.4), 0.8, 0.25);
      g.crackle(0.05, 1.4, (t) => 900 * Math.exp(-t / 0.4), 0.4, 1500, -0.3);
      g.crackle(0.05, 1.4, (t) => 900 * Math.exp(-t / 0.4), 0.4, 1500, 0.3);
      // triumphant sting (C major)
      const t0 = 0.55;
      [48, 55, 60, 64, 67, 72].forEach((m, i) =>
        g.tone(t0, 2.3, () => note(m), (t) => 0.13 * Math.min(1, t / 0.03) * Math.exp(-t / 0.9), 'saw', -0.5 + i * 0.2),
      );
      for (let k = 0; k < 12; k++) g.pluck(t0 + k * 0.07, 84 + (k % 3 === 2 ? 4 : 0), k ? 0.4 : 0.8, 0.3, 6000, 0.3);
      g.bell(t0, glockParts(note(96), 1.4), 0.4, -0.3);
      g.bell(t0 + 0.12, glockParts(note(100), 1.4), 0.35, 0);
      g.bell(t0 + 0.24, glockParts(note(103), 1.4), 0.3, 0.3);
      g.filter(() => Biquad.lp(g.sr, 9000, 0.7));
    },
  },

  // ---------------------------------------------------------------- weapons
  w_mattarello: {
    len: 0.3,
    gain: -13,
    maxVoices: 3,
    minGap: 0.06,
    pitchVar: 0.06,
    gen(g) {
      g.noise(0, 0.28, (t) => 0.8 * Math.sin(Math.PI * Math.min(1, t / 0.27)) ** 2, 'bp', lin([0, 260], [0.13, 950], [0.27, 380]), 1.6);
      g.tone(0, 0.26, () => 120, (t) => 0.22 * Math.sin(Math.PI * Math.min(1, t / 0.25)) ** 2, 'sine');
    },
  },
  w_ciabatta: {
    len: 0.3,
    gain: -13,
    maxVoices: 3,
    minGap: 0.06,
    pitchVar: 0.07,
    gen(g) {
      g.noise(0, 0.26, (t) => 0.6 * Math.sin(Math.PI * Math.min(1, t / 0.25)) ** 2, 'bp', lin([0, 700], [0.12, 1700], [0.25, 900]), 1.4);
      [0.05, 0.11].forEach((t) => g.noise(t, 0.03, ad(0.0008, 0.007, 0.8), 'lp', () => 900, 0.9));
    },
  },
  w_coltelli: {
    len: 0.3,
    gain: -17,
    maxVoices: 3,
    minGap: 0.04,
    pitchVar: 0.06,
    gen(g) {
      g.noise(0, 0.09, (t) => 0.45 * Math.sin(Math.PI * Math.min(1, t / 0.085)), 'hp', () => 3000, 0.8);
      g.bell(0.02, [
        { f: 3400, amp: 0.35, t60: 0.22 },
        { f: 3430, amp: 0.3, t60: 0.2 },
        { f: 5100, amp: 0.2, t60: 0.15 },
        { f: 6800, amp: 0.12, t60: 0.1 },
      ]);
    },
  },
  w_olive: {
    len: 0.09,
    gain: -17,
    maxVoices: 3,
    minGap: 0.03,
    pitchVar: 0.08,
    gen(g) {
      g.tone(0, 0.07, glide(950, 420, 0.012), ad(0.0008, 0.018), 'sine');
      g.noise(0, 0.004, ad(0.0002, 0.001, 0.4), 'bp', () => 2500, 1.5);
    },
  },
  w_forchette: {
    len: 0.55,
    gain: -17,
    maxVoices: 2,
    minGap: 0.1,
    pitchVar: 0.05,
    gen(g) {
      g.tone(0, 0.5, () => 2350, (t) => 0.5 * Math.min(1, t / 0.004) * Math.exp(-t / 0.16) * (1 + 0.2 * Math.sin(TAU * 9 * t)), 'sine');
      g.tone(0, 0.2, () => 2350 * 6.1, (t) => 0.12 * Math.exp(-t / 0.03), 'sine');
      g.noise(0, 0.12, (t) => 0.2 * Math.sin(Math.PI * Math.min(1, t / 0.12)), 'bp', () => 2600, 1.2);
    },
  },
  w_pizza: {
    len: 0.28,
    gain: -13,
    maxVoices: 3,
    minGap: 0.06,
    pitchVar: 0.07,
    gen(g) {
      g.noise(0, 0.25, (t) => 0.7 * Math.min(1, t / 0.02) * Math.exp(-t / 0.07), 'lp', glide(900, 380, 0.08), 0.8);
      g.tone(0, 0.2, glide(175, 105, 0.05), (t) => 0.5 * Math.min(1, t / 0.015) * Math.exp(-t / 0.06), 'sine');
      g.noise(0, 0.18, (t) => 0.55 * Math.min(1, t / 0.012) * Math.exp(-t / 0.05), 'bp', glide(900, 500, 0.06), 1.0);
    },
  },
  w_rotella: {
    len: 0.38,
    gain: -16,
    maxVoices: 2,
    minGap: 0.08,
    pitchVar: 0.05,
    gen(g) {
      const fc = expSweep(1600, 2300, 0.35);
      let mph = 0;
      g.tone(
        0,
        0.36,
        (t) => {
          mph += (fc(t) * 1.4) / g.sr;
          return fc(t) * (1 + 0.25 * Math.sin(TAU * mph));
        },
        (t) => 0.4 * Math.min(1, t / 0.02) * Math.exp(-t / 0.18) * (0.6 + 0.4 * Math.sin(TAU * 32 * t)),
        'sine',
      );
      g.noise(0, 0.3, (t) => 0.12 * Math.exp(-t / 0.1) * (0.5 + 0.5 * Math.sin(TAU * 32 * t)), 'hp', () => 5000);
    },
  },
  w_peperoncino: {
    len: 0.58,
    gain: -12,
    maxVoices: 2,
    minGap: 0.08,
    pitchVar: 0.06,
    gen(g) {
      g.noise(0, 0.35, (t) => 0.7 * Math.min(1, t / 0.06) * Math.exp(-Math.max(0, t - 0.06) / 0.1), 'bp', expSweep(400, 2500, 0.25), 1.3);
      g.crackle(0.08, 0.48, (t) => 450 * Math.exp(-t / 0.2), 0.45, 3000);
      g.noise(0.05, 0.5, (t) => 0.1 * Math.exp(-t / 0.15), 'hp', () => 5000);
    },
  },
  w_moka: {
    len: 0.8,
    gain: -9,
    maxVoices: 2,
    minGap: 0.1,
    pitchVar: 0.04,
    gen(g) {
      g.noise(0, 0.32, (t) => 0.35 * (t / 0.32) ** 1.5, 'hp', expSweep(3000, 6000, 0.32), 0.9);
      g.tone(0.05, 0.27, expSweep(2600, 3400, 0.27), (t) => 0.08 * (t / 0.27), 'sine');
      g.tone(0.32, 0.45, glide(95, 38, 0.06), ad(0.001, 0.15), 'sine');
      g.noise(0.32, 0.4, ad(0.001, 0.09, 0.8), 'lp', glide(2200, 300, 0.08), 0.8);
      g.noise(0.33, 0.25, ad(0.003, 0.06, 0.35), 'bp', () => 1100, 1.5);
    },
  },
  w_spaghetti: {
    len: 0.26,
    gain: -13,
    maxVoices: 3,
    minGap: 0.05,
    pitchVar: 0.07,
    gen(g) {
      g.noise(0, 0.07, (t) => 0.4 * Math.sin(Math.PI * Math.min(1, t / 0.065)), 'bp', expSweep(900, 2400, 0.06), 1.5);
      g.noise(0.068, 0.006, ad(0.0002, 0.0012, 1), 'hp', () => 2000);
      g.noise(0.068, 0.05, ad(0.0005, 0.01, 0.6), 'bp', () => 3200, 3);
    },
  },
  w_vesuvio: {
    len: 0.95,
    gain: -8,
    maxVoices: 2,
    minGap: 0.1,
    pitchVar: 0.05,
    gen(g) {
      g.noise(0, 0.32, (t) => 0.5 * (t / 0.32) ** 2, 'lp', () => 150, 0.9);
      g.tone(0.3, 0.6, glide(105, 38, 0.06), ad(0.001, 0.2), 'sine');
      g.noise(0.3, 0.55, ad(0.001, 0.12, 0.85), 'lp', glide(1600, 220, 0.1), 0.8);
      g.crackle(0.32, 0.5, (t) => 400 * Math.exp(-t / 0.15), 0.4, 1200);
    },
  },
  w_forma: {
    len: 1.15,
    gain: -11,
    maxVoices: 1,
    minGap: 0.3,
    pitchVar: 0.05,
    gen(g) {
      const roll = (t: number) => 0.6 + 0.25 * Math.sin(TAU * 6.3 * t) + 0.15 * Math.sin(TAU * 9.7 * t + 1);
      g.noise(0, 1.1, (t) => 0.8 * Math.min(1, t / 0.08) * (t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.3) : 1) * roll(t), 'lp', () => 190, 0.9);
      g.noise(0, 1.1, (t) => 0.55 * Math.min(1, t / 0.08) * (t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.3) : 1) * roll(t + 0.05), 'bp', () => 420, 1.1);
      g.crackle(0, 1.0, (t) => 160 * (t < 0.85 ? 1 : 0), 0.35, 900);
      g.tone(0, 1.1, (t) => 55 * (1 + 0.04 * Math.sin(TAU * 6.3 * t)), (t) => 0.35 * Math.min(1, t / 0.08) * (t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.3) : 1), 'sine');
    },
  },
  w_basilico: {
    len: 0.42,
    gain: -17,
    maxVoices: 2,
    minGap: 0.06,
    pitchVar: 0.06,
    gen(g) {
      g.noise(0, 0.3, (t) => 0.35 * Math.sin(Math.PI * Math.min(1, t / 0.3)) * (0.5 + 0.5 * Math.sin(TAU * 22 * t)), 'bp', () => 2200, 2);
      g.tone(0.02, 0.38, () => 1760, ad(0.004, 0.12, 0.22), 'sine');
      g.tone(0.02, 0.38, () => 2637, ad(0.004, 0.08, 0.12), 'sine');
    },
  },
  w_forno: {
    len: 0.62,
    gain: -15,
    maxVoices: 1,
    minGap: 0.25,
    pitchVar: 0.05,
    gen(g) {
      g.noise(0, 0.6, (t) => 0.7 * Math.min(1, t / 0.06) * (t > 0.4 ? Math.max(0, 1 - (t - 0.4) / 0.2) : 1) * (0.75 + 0.25 * Math.sin(TAU * 11 * t)), 'lp', () => 520, 0.8);
      g.noise(0, 0.6, (t) => 0.45 * Math.min(1, t / 0.06) * (t > 0.4 ? Math.max(0, 1 - (t - 0.4) / 0.2) : 1) * (0.7 + 0.3 * Math.sin(TAU * 7 * t + 1)), 'bp', () => 850, 1.0);
      g.tone(0, 0.6, () => 72, (t) => 0.3 * Math.min(1, t / 0.06) * (t > 0.4 ? Math.max(0, 1 - (t - 0.4) / 0.2) : 1), 'sine');
      g.crackle(0.05, 0.5, () => 120, 0.25, 3000);
    },
  },
  explosion: {
    len: 0.95,
    gain: -7,
    variants: 2,
    maxVoices: 3,
    minGap: 0.06,
    pitchVar: 0.07,
    gen(g) {
      g.tone(0, 0.5, glide(95, 34, 0.07), ad(0.001, 0.16), 'sine');
      g.noise(0, 0.8, ad(0.001, 0.15, 0.95), 'lp', expSweep(5200 - g.variant * 600, 240, 0.6), 0.8);
      g.noise(0, 0.4, ad(0.001, 0.08, 0.5), 'bp', glide(1200, 450, 0.1), 1.0);
      g.crackle(0.02, 0.6, (t) => 900 * Math.exp(-t / 0.15), 0.6, 1500);
    },
  },
  burn: {
    len: 0.13,
    gain: -21,
    maxVoices: 2,
    minGap: 0.06,
    pitchVar: 0.1,
    gen(g) {
      g.crackle(0, 0.12, () => 260, 0.8, 3500);
      g.noise(0, 0.1, (t) => 0.15 * Math.exp(-t / 0.04), 'hp', () => 5500);
    },
  },
  freeze: {
    len: 0.55,
    gain: -10,
    maxVoices: 2,
    minGap: 0.08,
    pitchVar: 0.05,
    gen(g) {
      g.noise(0, 0.003, ad(0.0002, 0.0008, 1), 'hp', () => 3000);
      g.noise(0, 0.04, (t) => 0.6 * Math.exp(-t / 0.01) * (0.4 + 0.6 * (g.rng.next() > 0.5 ? 1 : 0)), 'bp', () => 3100, 1.2);
      g.bell(0.002, [
        { f: 2700, amp: 0.3, t60: 0.45 },
        { f: 4130, amp: 0.25, t60: 0.38 },
        { f: 5890, amp: 0.18, t60: 0.3 },
        { f: 7420, amp: 0.12, t60: 0.22 },
      ]);
    },
  },
};

/** Render one sfx variant (peak-normalised to -1 dBFS, then gain applied). */
export function renderSfx(id: SfxId, sr: number, variant: number): SfxRender {
  const def = SFX[id];
  const rng = new Rng(0x5eed ^ (variant * 7919) ^ (id.length * 104729) ^ id.charCodeAt(id.length - 1));
  const g = new Gen(sr, def.len, !!def.stereo, rng, variant);
  def.gen(g);
  // remove DC / sub-rumble below 25 Hz, normalise, fade the tail
  const hpL = Biquad.hp(sr, 25, 0.6);
  hpL.run(g.l);
  if (g.r) Biquad.hp(sr, 25, 0.6).run(g.r);
  let pk = 1e-9;
  for (let i = 0; i < g.n; i++) {
    pk = Math.max(pk, Math.abs(g.l[i]));
    if (g.r) pk = Math.max(pk, Math.abs(g.r[i]));
  }
  const gain = (0.89 / pk) * Math.pow(10, def.gain / 20);
  const nf = Math.min(g.n, Math.round(0.006 * sr));
  for (let i = 0; i < g.n; i++) {
    const f = i >= g.n - nf ? (g.n - 1 - i) / nf : 1;
    g.l[i] *= gain * f;
    if (g.r) g.r[i] *= gain * f;
  }
  return { l: g.l, r: g.r };
}

export const SFX_IDS = Object.keys(SFX) as SfxId[];
