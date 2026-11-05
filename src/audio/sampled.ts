/**
 * Sampled instruments: recorded sample sets (src/audio/assets/inst, built by
 * scripts/audio/build_instruments.py) played back as InstDefs for the song renderer.
 *
 * Worker- and Node-safe: no asset imports here. The main thread decodes the MP3 sprites
 * (samplebank.ts) and hands the PCM over; installSampleBank() aligns each sprite on its marker
 * impulse (MP3 decoder delay differs between browsers), stores it as Int16 and registers one
 * InstDef per id in SAMPLED_SPECS, replacing the synthesized version of that id.
 *
 * Playback of one (pitch, variant, layer) sample:
 *   zone = velocity layer → round robin → key range (octave fold beyond the playable range)
 *   1. unroll the zone at its own rate (loop wrap; decaying loops keep decaying at the measured
 *      rate; band-limit with a 6th-order low-pass if the shift up would alias)
 *   2. resample with an 8-tap Kaiser-windowed sinc (4096-phase table) to the output rate/pitch
 *   3. zone gain (even loudness) × instrument gain, optional tone filter, attack ramp
 * The returned Sample carries `pre` (output samples before the onset) so the mixer can start
 * the note early and the attack lands on the beat.
 */
import { Biquad, clamp } from './dsp';
import type { InstDef, Sample } from './instruments';

// ---------------------------------------------------------------------------------------------
// Data types (the generated manifest uses SampleSetDef)
// ---------------------------------------------------------------------------------------------

export interface ZoneDef {
  /** measured sounding pitch (fractional MIDI) */
  p: number;
  /** key range (inclusive) */
  lo: number;
  hi: number;
  /** velocity layer (0 = softest) */
  l: number;
  /** round robin / articulation */
  r: number;
  /** offset / length in the sprite (samples at the set rate) */
  o: number;
  n: number;
  /** onset position inside the zone */
  pre: number;
  /** linear gain to the common loudness */
  g: number;
  /** loop inside the zone */
  ls?: number;
  le?: number;
  /** decay after the loop start (dB/s, negative), decaying loops */
  dec?: number;
}

export interface SampleSetDef {
  name: string;
  file: string;
  sr: number;
  ch: number;
  /** alignment impulse position and the window to search it in */
  marker: number;
  win: number;
  zones: ZoneDef[];
}

/** Decoded PCM of one set (channel data exactly as the decoder returned it). */
export interface SetPcm {
  name: string;
  sr: number;
  data: Float32Array[];
}

export interface BankData {
  sets: SampleSetDef[];
  pcm: SetPcm[];
}

export interface BankReport {
  ok: boolean;
  sets: number;
  instruments: string[];
  /** per set: detected decoder shift (samples) */
  shifts: Record<string, number>;
  /** resident PCM bytes (Int16) */
  bytes: number;
  warnings: string[];
}

// ---------------------------------------------------------------------------------------------
// Instrument specs (id → sample set + playback behaviour)
// ---------------------------------------------------------------------------------------------

export interface SampledSpec {
  id: string;
  set: string;
  kind: 'pluck' | 'sustain' | 'perc';
  /** release time constant (s) at note-off */
  release: number;
  ring?: boolean;
  gate?: number;
  /** round robins (render.ts cycles variants); 'neighbor' = borrow the next zone when the set has none */
  variants?: number;
  rr?: 'set' | 'neighbor' | 'art';
  /** velocity thresholds between layers, ascending (layer = number of thresholds <= v) */
  layers?: number[];
  /** ignore the requested pitch (unpitched percussion) */
  unpitched?: boolean;
  /** semitones a zone may be shifted beyond the outermost zones before folding by octaves */
  up?: number;
  down?: number;
  /** gain trim (dB) — calibrated against the synth instrument so song mixes keep their balance */
  gainDb?: number;
  /** tone shaping */
  lp?: number;
  hp?: number;
  /** extra fade-in (s) on top of the recorded attack */
  attack?: number;
  /** natural length cap (s) for ringing samples */
  maxLen?: number;
  /** variant → articulation (round robin index in the set) for 'art' sets, e.g. tambourine */
  art?: number[][];
}

const S = (id: string, set: string, kind: SampledSpec['kind'], release: number, o: Partial<SampledSpec> = {}): SampledSpec => ({ id, set, kind, release, ...o });

/**
 * Ids keep the synth names (aliases in the brief's long names too). Gains (gainDb) are measured
 * by scripts/audio/calibrate_instruments.mjs (synth vs sampled loudness at equal velocity).
 */
export const SAMPLED_SPECS: SampledSpec[] = [
  // accordion family (one recorded instrument, three voicings)
  S('accordion', 'accordion', 'sustain', 0.06, { gate: 0.92, up: 9, gainDb: 6.4 }),
  S('accordionDry', 'accordion', 'sustain', 0.05, { gate: 0.92, up: 9, lp: 4200, gainDb: 6.6 }),
  S('accChord', 'accordion', 'sustain', 0.035, { gate: 0.92, up: 9, lp: 5200, hp: 160, gainDb: 6.4 }),
  // plucked
  S('mandolin', 'mandolin', 'pluck', 0.05, { gate: 1, variants: 2, rr: 'neighbor', layers: [0.62], gainDb: 0.7 }),
  S('guitar', 'guitar', 'pluck', 0.12, { gate: 1, variants: 2, rr: 'neighbor', layers: [0.7], gainDb: 3.4 }),
  S('steelGuitar', 'steelguitar', 'pluck', 0.12, { gate: 1, variants: 2, rr: 'neighbor', gainDb: 5 }),
  S('piano', 'piano', 'pluck', 0.25, { gate: 1, layers: [0.72], gainDb: 4.4 }),
  S('harpsi', 'harpsichord', 'pluck', 0.05, { gate: 1, variants: 2, rr: 'neighbor', gainDb: 1.1 }),
  S('harp', 'harp', 'pluck', 0.3, { gate: 1, variants: 2, rr: 'neighbor', gainDb: 5.2 }),
  // strings
  S('violin', 'violin', 'sustain', 0.14, { gate: 0.96, gainDb: 7.5 }),
  S('strings', 'strings', 'sustain', 0.3, { gate: 0.97, gainDb: 7.4 }),
  S('strStab', 'strstab', 'pluck', 0.06, { gate: 0.6, variants: 2, rr: 'set', gainDb: 1.4 }),
  S('pizz', 'pizz', 'pluck', 0.08, { gate: 1, variants: 2, rr: 'set', gainDb: 0.1 }),
  S('ubass', 'ubass', 'pluck', 0.08, { gate: 0.9, variants: 2, rr: 'neighbor', gainDb: 1.3 }),
  S('cello', 'cello', 'sustain', 0.16, { gate: 0.96, gainDb: 4.1 }),
  S('contrabass', 'contrabass', 'sustain', 0.18, { gate: 0.95, gainDb: 5.7 }),
  // brass
  S('brass', 'brass', 'sustain', 0.09, { gate: 0.92, gainDb: 5.3 }),
  S('brassSoft', 'horns', 'sustain', 0.14, { gate: 0.92, gainDb: 6.5 }),
  S('tuba', 'tuba', 'sustain', 0.07, { gate: 0.85, gainDb: 3.5 }),
  S('trumpet', 'trumpet', 'sustain', 0.09, { gate: 0.92, gainDb: 4.2 }),
  S('trombone', 'trombone', 'sustain', 0.1, { gate: 0.92, gainDb: 4.8 }),
  S('horn', 'horn', 'sustain', 0.12, { gate: 0.92, gainDb: 4.8 }),
  // woodwinds
  S('flute', 'flute', 'sustain', 0.08, { gate: 0.9, gainDb: 6.1 }),
  S('piccolo', 'piccolo', 'sustain', 0.07, { gate: 0.9, gainDb: 4.6 }),
  S('clarinet', 'clarinet', 'sustain', 0.08, { gate: 0.9, gainDb: 4.2 }),
  S('oboe', 'oboe', 'sustain', 0.08, { gate: 0.9, gainDb: 4.6 }),
  S('bassoon', 'bassoon', 'sustain', 0.08, { gate: 0.9, gainDb: 5.2 }),
  // voices / organ
  S('choir', 'choir', 'sustain', 0.4, { gate: 0.98, gainDb: 5.6 }),
  S('choirO', 'choir', 'sustain', 0.4, { gate: 0.98, lp: 1400, gainDb: 7.1 }),
  S('organ', 'organ', 'sustain', 0.08, { gate: 0.95, gainDb: 4.7 }),
  // mallets / bells
  S('glock', 'glock', 'pluck', 0.4, { ring: true, maxLen: 2.2, gainDb: 3.5 }),
  S('xylophone', 'xylophone', 'pluck', 0.1, { ring: true, gainDb: 8.1 }),
  S('vibes', 'vibes', 'pluck', 0.3, { gate: 1, gainDb: 4.4 }),
  S('celesta', 'celesta', 'pluck', 0.3, { gate: 1, layers: [0.7], gainDb: 5 }),
  S('bell', 'chimes', 'pluck', 1, { ring: true, maxLen: 4, gainDb: -0.3 }),
  S('timp', 'timpani', 'pluck', 0.6, { ring: true, maxLen: 3.2, variants: 2, rr: 'set', layers: [0.55], gainDb: 3.8 }),
  // percussion (unpitched; variants keep the synth semantics)
  S('tamb', 'tamb', 'perc', 0.03, { ring: true, unpitched: true, variants: 8, rr: 'art', gainDb: -6 }),
  S('snare', 'snare', 'perc', 0.05, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.45, 0.65, 0.85], gainDb: 4.4 }),
  S('crash', 'crash', 'perc', 0.5, { ring: true, unpitched: true, maxLen: 3, variants: 2, rr: 'set', layers: [0.75], gainDb: 3.3 }),
  S('kick', 'kick', 'perc', 0.05, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.5, 0.85], gainDb: 9.6 }),
  S('triangle', 'triangle', 'perc', 0.3, { ring: true, unpitched: true, maxLen: 2.5, variants: 2, rr: 'set', layers: [0.7], gainDb: -1.7 }),
  S('shaker', 'shaker', 'perc', 0.02, { ring: true, unpitched: true, variants: 2, rr: 'art', art: [[0, 2], [1, 3]], gainDb: 2.5 }),
  S('pan', 'panclang', 'perc', 0.1, { ring: true, unpitched: true, maxLen: 1.6, variants: 2, rr: 'set', layers: [0.8], gainDb: -0.3 }),
  S('anvil', 'anvil', 'perc', 0.1, { ring: true, unpitched: true, maxLen: 2, variants: 2, rr: 'set', layers: [0.45, 0.8], gainDb: 0.1 }),
  S('castanets', 'castanets', 'perc', 0.02, { ring: true, unpitched: true, variants: 4, rr: 'set', gainDb: 5.4 }),
  S('slapstick', 'slapstick', 'perc', 0.03, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.6], gainDb: 5.3 }),
  S('woodblock', 'woodblock', 'perc', 0.03, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.6], gainDb: 5.2 }),
  S('vibraslap', 'vibraslap', 'perc', 0.1, { ring: true, unpitched: true, variants: 2, rr: 'set', gainDb: 1.8 }),
  S('flexatone', 'flexatone', 'perc', 0.1, { ring: true, unpitched: true, variants: 4, rr: 'art', gainDb: 4.5 }),
  S('cymbal', 'cymbal', 'perc', 0.6, { unpitched: true, variants: 2, rr: 'art', layers: [0.7], gainDb: 4.1 }),
  S('bassDrum', 'bassdrum', 'perc', 0.4, { unpitched: true, variants: 2, rr: 'art', layers: [0.5, 0.85], gainDb: -0.4 }),
  S('tamtam', 'tamtam', 'perc', 1.2, { ring: true, unpitched: true, maxLen: 6, variants: 2, rr: 'set', gainDb: 3.9 }),
  S('claves', 'claves', 'perc', 0.02, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.7], gainDb: 6.3 }),
  S('ratchet', 'ratchet', 'perc', 0.1, { ring: true, unpitched: true, variants: 3, rr: 'art', gainDb: 3.9 }),
  S('toyWhistle', 'toywhistle', 'perc', 0.1, { ring: true, unpitched: true, variants: 4, rr: 'art', gainDb: 0.9 }),
  S('orchHit', 'orchhit', 'pluck', 0.2, { ring: true, gainDb: 5.4 }),
];

/** Long names from the Audio 2.0 brief → registry ids (both resolve to the same instrument). */
export const INSTRUMENT_ALIASES: Record<string, string> = {
  harpsichord: 'harpsi',
  uprightBass: 'ubass',
  tubularBell: 'bell',
  timpani: 'timp',
  panClang: 'pan',
  triangleInst: 'triangle',
};

// ---------------------------------------------------------------------------------------------
// Bank storage + alignment
// ---------------------------------------------------------------------------------------------

interface StoredSet {
  def: SampleSetDef;
  sr: number;
  /** Int16 PCM per channel, already shifted so zone offsets are exact */
  ch: Int16Array[];
  /** int16 → float scale */
  k: number;
}

const bank = new Map<string, StoredSet>();

/** Find the alignment impulse: strongest sample in [0, win). Returns the shift (or 0 + warning). */
export function findMarker(data: Float32Array, def: SampleSetDef): { shift: number; ok: boolean } {
  const n = Math.min(data.length, def.win);
  let best = 0;
  let at = -1;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.abs(data[i]);
    sum += a * a;
    if (a > best) {
      best = a;
      at = i;
    }
  }
  const rms = Math.sqrt(sum / Math.max(1, n));
  const ok = at >= 0 && best > 0.25 && best > 20 * rms;
  return { shift: ok ? at - def.marker : 0, ok };
}

let pendingWarnings: string[] = [];
let pendingShifts: Record<string, number> = {};

/**
 * Align one decoded sprite on its marker, convert it to Int16 and keep it (worker / Node).
 * Sets can arrive one by one (keeps the main thread's decoded memory small).
 */
export function addSampleSet(def: SampleSetDef, pcm: SetPcm): boolean {
  try {
    if (!pcm || !pcm.data.length || !pcm.data[0].length) {
      pendingWarnings.push(`set ${def.name}: no PCM`);
      return false;
    }
    if (pcm.sr !== def.sr) pendingWarnings.push(`set ${def.name}: decoded at ${pcm.sr} Hz (expected ${def.sr})`);
    // decoded at another rate (decode-context fallback): positions scale with the rate
    const rateK = pcm.sr / def.sr;
    const scaled: SampleSetDef =
      rateK === 1
        ? def
        : {
            ...def,
            sr: pcm.sr,
            marker: Math.round(def.marker * rateK),
            win: Math.round(def.win * rateK),
            zones: def.zones.map((z) => ({
              ...z,
              o: Math.round(z.o * rateK),
              n: Math.round(z.n * rateK),
              pre: Math.round(z.pre * rateK),
              ls: z.ls === undefined ? undefined : Math.round(z.ls * rateK),
              le: z.le === undefined ? undefined : Math.round(z.le * rateK),
            })),
          };
    const mk = findMarker(pcm.data[0], scaled);
    if (!mk.ok) pendingWarnings.push(`set ${def.name}: alignment marker not found, assuming no decoder delay`);
    pendingShifts[def.name] = mk.shift;
    let peak = 1;
    for (const c of pcm.data) for (let i = 0; i < c.length; i++) if (Math.abs(c[i]) > peak) peak = Math.abs(c[i]);
    const k = peak / 32767;
    const inv = 1 / k;
    const chs: Int16Array[] = [];
    for (let c = 0; c < scaled.ch; c++) {
      const src = pcm.data[Math.min(c, pcm.data.length - 1)];
      const len = Math.max(0, src.length - mk.shift);
      const out = new Int16Array(len);
      for (let i = 0; i < len; i++) {
        const j = i + mk.shift;
        const v = j >= 0 && j < src.length ? src[j] * inv : 0;
        out[i] = v > 32767 ? 32767 : v < -32768 ? -32768 : Math.round(v);
      }
      chs.push(out);
    }
    // smooth MP3 coding error at loop seams: crossfade the material before le into the
    // material before ls (sample-identical in the source, so this only removes codec noise)
    for (const z of scaled.zones) if (z.ls !== undefined && z.le !== undefined) for (const c of chs) seamFix(c, z.o + z.ls, z.o + z.le);
    bank.set(def.name, { def: scaled, sr: scaled.sr, ch: chs, k });
    return true;
  } catch (e) {
    pendingWarnings.push(`set ${def.name}: ${String(e)}`);
    return false;
  }
}

/** Register one InstDef per spec whose set arrived (plus the brief's long-name aliases). */
export function finishSampleBank(register: (defs: InstDef[]) => void): BankReport {
  const defs: InstDef[] = [];
  const instruments: string[] = [];
  for (const spec of SAMPLED_SPECS) {
    const set = bank.get(spec.set);
    if (!set || !set.def.zones.length) continue;
    defs.push(makeSampledInst(spec, set));
    instruments.push(spec.id);
  }
  for (const [alias, id] of Object.entries(INSTRUMENT_ALIASES)) {
    const d = defs.find((x) => x.id === id);
    if (d) defs.push({ ...d, id: alias });
  }
  try {
    register(defs);
  } catch (e) {
    pendingWarnings.push('register failed: ' + String(e));
  }
  const rep: BankReport = { ok: defs.length > 0, sets: bank.size, instruments, shifts: pendingShifts, bytes: sampleBankBytes(), warnings: pendingWarnings };
  pendingWarnings = [];
  pendingShifts = {};
  return rep;
}

/** Align, convert and store every set, then register the sampled instruments. */
export function installSampleBank(data: BankData, register: (defs: InstDef[]) => void): BankReport {
  const byName = new Map(data.pcm.map((p) => [p.name, p]));
  for (const def of data.sets) {
    const p = byName.get(def.name);
    if (p) addSampleSet(def, p);
    else pendingWarnings.push(`set ${def.name}: no PCM`);
  }
  return finishSampleBank(register);
}

function seamFix(c: Int16Array, ls: number, le: number): void {
  const L = le - ls;
  const n = Math.min(64, Math.floor(L / 4), ls);
  if (n < 4 || le > c.length) return;
  for (let i = 0; i < n; i++) {
    const w = (i + 1) / (n + 1);
    const a = le - n + i;
    c[a] = Math.round(c[a] * (1 - w) + c[a - L] * w);
  }
}

export function sampleBankBytes(): number {
  let b = 0;
  for (const s of bank.values()) for (const c of s.ch) b += c.byteLength;
  return b;
}

// ---------------------------------------------------------------------------------------------
// Resampling kernel: 8-tap Kaiser-windowed sinc, 4096 phases (nearest phase)
// ---------------------------------------------------------------------------------------------

const TAPS = 8;
const HALF = TAPS / 2;
const PHASES = 4096;
let KERNEL: Float32Array | null = null;

function bessel0(x: number): number {
  let sum = 1;
  let t = 1;
  for (let k = 1; k < 30; k++) {
    t *= (x / (2 * k)) * (x / (2 * k));
    sum += t;
    if (t < 1e-12 * sum) break;
  }
  return sum;
}

function kernel(): Float32Array {
  if (KERNEL) return KERNEL;
  const k = new Float32Array((PHASES + 1) * TAPS);
  const beta = 6.0;
  const cutoff = 0.94; // of the source Nyquist
  const i0b = bessel0(beta);
  for (let p = 0; p <= PHASES; p++) {
    const frac = p / PHASES;
    let sum = 0;
    for (let t = 0; t < TAPS; t++) {
      // tap t sits at x = (t - HALF + 1) - frac relative to the interpolation point
      const x = t - HALF + 1 - frac;
      const sinc = x === 0 ? 1 : Math.sin(Math.PI * cutoff * x) / (Math.PI * cutoff * x);
      const r = x / HALF;
      const w = Math.abs(r) >= 1 ? 0 : bessel0(beta * Math.sqrt(1 - r * r)) / i0b;
      const v = cutoff * sinc * w;
      k[p * TAPS + t] = v;
      sum += v;
    }
    for (let t = 0; t < TAPS; t++) k[p * TAPS + t] /= sum; // unity DC gain per phase
  }
  KERNEL = k;
  return k;
}

/** out[i] = src(pos0 + i·inc) with sinc interpolation; src must hold HALF samples of margin. */
function resampleInto(src: Float32Array, out: Float32Array, inc: number, gain: number): void {
  const K = kernel();
  const n = out.length;
  const slen = src.length;
  let pos = HALF - 1; // src index of tap 0 for position 0 is pos - (HALF - 1)
  for (let i = 0; i < n; i++) {
    const ip = Math.floor(pos);
    const frac = pos - ip;
    const base = ip - (HALF - 1);
    const kp = ((frac * PHASES + 0.5) | 0) * TAPS;
    let acc = 0;
    if (base >= 0 && base + TAPS <= slen) {
      acc =
        src[base] * K[kp] +
        src[base + 1] * K[kp + 1] +
        src[base + 2] * K[kp + 2] +
        src[base + 3] * K[kp + 3] +
        src[base + 4] * K[kp + 4] +
        src[base + 5] * K[kp + 5] +
        src[base + 6] * K[kp + 6] +
        src[base + 7] * K[kp + 7];
    } else {
      for (let t = 0; t < TAPS; t++) {
        const j = base + t;
        if (j >= 0 && j < slen) acc += src[j] * K[kp + t];
      }
    }
    out[i] = acc * gain;
    pos += inc;
  }
}

// ---------------------------------------------------------------------------------------------
// Zone choice
// ---------------------------------------------------------------------------------------------

interface Choice {
  zone: ZoneDef;
  /** target pitch after octave folding */
  midi: number;
  /** extra detune (cents) and gain for synthetic round robins */
  cents: number;
  gain: number;
}

function chooseZone(spec: SampledSpec, set: StoredSet, midiIn: number, variant: number, layer: number): Choice | null {
  const zones = set.def.zones;
  if (!zones.length) return null;
  // available layers / articulations
  let art = 0;
  if (spec.rr === 'art') {
    const a = spec.art ? spec.art[variant % spec.art.length] : [variant];
    art = a[0];
  } else if (spec.rr === 'set') art = variant;
  const layers = [...new Set(zones.map((z) => z.l))].sort((a, b) => a - b);
  const lay = layers.reduce((best, l) => (Math.abs(l - layer) < Math.abs(best - layer) ? l : best), layers[0]);
  let pool = zones.filter((z) => z.l === lay && z.r === art);
  if (!pool.length) pool = zones.filter((z) => z.l === lay && z.r === 0);
  if (!pool.length) pool = zones.filter((z) => z.l === lay);
  if (!pool.length) pool = zones;
  if (spec.unpitched) {
    const z = spec.art && spec.rr === 'art' ? pool[(variant >> 0) % pool.length] : pool[0];
    return { zone: z, midi: z.p, cents: 0, gain: 1 };
  }
  // fold into the playable range by octaves (the outermost zones already extend by a fourth)
  let lo = Infinity;
  let hi = -Infinity;
  for (const z of pool) {
    lo = Math.min(lo, z.lo);
    hi = Math.max(hi, z.hi);
  }
  const up = spec.up ?? 0;
  const down = spec.down ?? 0;
  lo -= Math.max(0, down - 5);
  hi += Math.max(0, up - 5);
  let m = midiIn;
  while (m < lo) m += 12;
  while (m > hi) m -= 12;
  if (m < lo) m = lo; // range narrower than an octave
  // nearest zone (prefer the one whose key range contains m; ties → shift down)
  let zone = pool[0];
  let bestD = Infinity;
  for (const z of pool) {
    const inRange = m >= z.lo && m <= z.hi;
    const d = Math.abs(m - z.p) + (inRange ? 0 : 50) + (z.p < m ? 0.01 : 0);
    if (d < bestD) {
      bestD = d;
      zone = z;
    }
  }
  let cents = 0;
  let gain = 1;
  if (spec.rr === 'neighbor' && variant % 2 === 1) {
    // borrow the adjacent zone (≤ 2 semitones away) for a natural-sounding alternate take
    let alt: ZoneDef | null = null;
    let altD = Infinity;
    for (const z of pool) {
      if (z === zone) continue;
      const d = Math.abs(m - z.p);
      if (d <= 2.05 && d < altD) {
        altD = d;
        alt = z;
      }
    }
    if (alt) zone = alt;
    cents = 3;
    gain = 0.93;
  }
  return { zone, midi: m, cents, gain };
}

// ---------------------------------------------------------------------------------------------
// Rendering one sample
// ---------------------------------------------------------------------------------------------

/** Unroll [0, n) of a zone at the set rate: copies, wraps the loop, applies the loop decay. */
function unroll(set: StoredSet, z: ZoneDef, c: number, n: number): Float32Array {
  const src = set.ch[Math.min(c, set.ch.length - 1)];
  const out = new Float32Array(n);
  const k = set.k;
  const o = z.o;
  const looped = z.ls !== undefined && z.le !== undefined && z.le - z.ls > 16;
  if (!looped) {
    const m = Math.min(n, z.n, src.length - o);
    for (let i = 0; i < m; i++) out[i] = src[o + i] * k;
    return out;
  }
  const ls = z.ls as number;
  const le = z.le as number;
  const L = le - ls;
  const head = Math.min(n, le);
  for (let i = 0; i < head; i++) out[i] = src[o + i] * k;
  // decaying loop: per-sample factor (dB/s at the set rate)
  const dk = z.dec ? Math.pow(10, z.dec / 20 / set.sr) : 1;
  if (dk !== 1) {
    let g = 1;
    for (let i = ls; i < head; i++) {
      out[i] *= g;
      g *= dk;
    }
    let p = ls;
    for (let i = head; i < n; i++) {
      out[i] = src[o + p] * k * g;
      g *= dk;
      if (++p >= le) p = ls;
      if (g < 1e-4) break; // -80 dB: silence
    }
  } else {
    let p = ls;
    for (let i = head; i < n; i++) {
      out[i] = src[o + p] * k;
      if (++p >= le) p = ls;
    }
    void L;
  }
  return out;
}

/** natural length of a zone in seconds at its own rate (decaying loops: until -60 dB) */
function naturalSec(z: ZoneDef, sr: number): number {
  if (z.ls !== undefined && z.le !== undefined && z.dec) return z.ls / sr + 60 / -z.dec;
  if (z.ls !== undefined && z.le !== undefined) return z.n / sr + 2;
  return z.n / sr;
}

function lowpassInPlace(x: Float32Array, sr: number, fc: number): void {
  // 6th-order Butterworth (three biquads), run forward only (phase shift is fine for tone)
  const qs = [0.5176, 0.7071, 1.9319];
  for (const q of qs) Biquad.lp(sr, fc, q).run(x);
}

function makeSampledInst(spec: SampledSpec, set: StoredSet): InstDef {
  const gain = Math.pow(10, (spec.gainDb ?? 0) / 20);
  const thresholds = spec.layers ?? [];
  const def: InstDef & { layerOf(v: number): number } = {
    id: spec.id,
    kind: spec.kind,
    variants: spec.variants ?? 1,
    release: spec.release,
    ring: spec.ring,
    gate: spec.gate,
    layerOf(v: number): number {
      let l = 0;
      for (const t of thresholds) if (v >= t) l++;
      return l;
    },
    make(sr: number, midi: number, variant: number, lenSec: number, layer = 0): Sample {
      try {
        return renderZone(spec, set, sr, midi, variant, lenSec, layer, gain);
      } catch {
        return { l: new Float32Array(Math.max(1, Math.round(0.05 * sr))), r: null };
      }
    },
  };
  return def;
}

function renderZone(spec: SampledSpec, set: StoredSet, sr: number, midi: number, variant: number, lenSec: number, layer: number, gain: number): Sample {
  const ch = chooseZone(spec, set, midi, variant, layer);
  if (!ch) return { l: new Float32Array(1), r: null };
  const z = ch.zone;
  const shift = spec.unpitched ? 0 : ch.midi - z.p + ch.cents / 100;
  const pitchRatio = Math.pow(2, shift / 12);
  const inc = (pitchRatio * set.sr) / sr; // source samples per output sample
  const preOut = Math.round(z.pre / inc);
  // output length: requested (plus the pre-roll), or the natural ring capped by maxLen
  const natural = naturalSec(z, set.sr) / pitchRatio;
  let sec = lenSec > 0 ? lenSec : natural;
  if (spec.maxLen) sec = Math.min(sec, spec.maxLen);
  if (lenSec <= 0 && z.ls === undefined) sec = Math.min(sec, natural);
  const nOut = Math.max(16, preOut + Math.round(sec * sr));
  const nSrc = Math.ceil(nOut * inc) + TAPS + 2;
  const chans = set.ch.length;
  const outs: Float32Array[] = [];
  const g = z.g * gain * ch.gain;
  for (let c = 0; c < chans; c++) {
    const tmp = unroll(set, z, c, nSrc);
    if (inc > 1.0) lowpassInPlace(tmp, set.sr, Math.min(0.45 * set.sr, (0.45 * set.sr) / inc));
    // margin of HALF-1 zeros before the data so tap 0 can reach index -3
    const padded = new Float32Array(tmp.length + TAPS);
    padded.set(tmp, HALF - 1);
    const out = new Float32Array(nOut);
    resampleInto(padded, out, inc, g);
    outs.push(out);
  }
  // tone shaping
  if (spec.lp) for (const o of outs) Biquad.lp(sr, spec.lp, 0.7071).run(o);
  if (spec.hp) for (const o of outs) Biquad.hp(sr, spec.hp, 0.7071).run(o);
  // optional extra attack ramp (after the onset) and a click-free end
  const nA = spec.attack ? Math.round(spec.attack * sr) : 0;
  for (const o of outs) {
    for (let i = 0; i < nA && preOut + i < o.length; i++) o[preOut + i] *= i / nA;
    const nf = Math.min(o.length >> 2, Math.round(0.006 * sr));
    for (let i = 0; i < nf; i++) o[o.length - 1 - i] *= i / nf;
  }
  return { l: outs[0], r: outs.length > 1 ? outs[1] : null, pre: preOut };
}

/** test hook: the zone a note would use (measurement scripts) */
export function debugChoice(id: string, midi: number, variant: number, layer: number): { set: string; zone: ZoneDef; midi: number } | null {
  const spec = SAMPLED_SPECS.find((s) => s.id === id);
  if (!spec) return null;
  const set = bank.get(spec.set);
  if (!set) return null;
  const c = chooseZone(spec, set, midi, variant, layer);
  return c ? { set: spec.set, zone: c.zone, midi: c.midi } : null;
}

export const SAMPLED_IDS = (): string[] => SAMPLED_SPECS.map((s) => s.id);
void clamp;
