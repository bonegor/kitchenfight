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
 *      rate; a slow swell entered late fades in; band-limit with a zero-phase 63-tap FIR if the
 *      shift up would alias)
 *   2. resample with a 16-tap Kaiser-windowed sinc (4096-phase table) to the output rate/pitch
 *   3. zone gain (even loudness) × instrument gain, optional tone filter, attack ramp
 * The returned Sample carries `pre` (output samples before the onset) so the mixer can start
 * the note early and the attack lands on the beat: the zone's beat (the build puts it on the
 * perceptual onset), mapped through the playback ratio — for two takes summed (`width`, aligned on
 * their beats) the perceptual onset of their sum, for a tone-filtered voicing moved by what its
 * filters move the attack — and for a short note its own on the same rule (`preAt`, continuous in
 * the note's length).
 */
import { Biquad, clamp } from './dsp';
import { MAX_PRE_SEC, type InstDef, type Sample } from './instruments';

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
  /** fade-in from the zone start (samples, raised cosine): a slow swell entered late — sustained
   *  zones keep at most 80 ms of a quiet build-up before the beat (the build's SUS_MAX_PRE; a louder one
   *  keeps the recording's start) */
  fi?: number;
  /** gate anchor (sustained zones whose beat `pre` is not their attack model's beat): a note's gate
   *  counts from here — the point the songs' note lengths and the loudness calibration were made
   *  against — while `pre`, its perceptual onset, is what goes on the beat (default `pre`) */
  ga?: number;
  /** dwell weight (sustained zones): how far the beat moved onto the real attack of an envelope that
   *  dwells below -10 dB (the build's perceptual_onset `w`, 0..1; default 0) — two takes summed with such a
   *  take keep their aligned beats (renderZone) */
  dw?: number;
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
  /** the variants a note without an explicit variant cycles through (InstDef.rrCycle; default: all
   *  variants, but only variant 0 for 'art' sets — rolls / shakes / fast takes are asked for) */
  rrCycle?: number[];
  /** 'set' sets: variant → round robin (take) index, when variants carry semantics beyond the
   *  takes (the timpani: variant 1 = the soft stroke on the second take) */
  takes?: number[];
  /** velocity thresholds between layers, ascending (layer = number of thresholds <= v) */
  layers?: number[];
  /** ignore the requested pitch (unpitched percussion) */
  unpitched?: boolean;
  /** gain trim (dB) — calibrated against the synth instrument so song mixes keep their balance */
  gainDb?: number;
  /** tone shaping */
  lp?: number;
  hp?: number;
  /** extra fade-in (s) on top of the recorded attack */
  attack?: number;
  /** a new note on the same channel + pitch stops the previous one (plucked strings) */
  choke?: boolean;
  /** natural length cap (s) for ringing samples (a longer recording gets a long fade-out, not a cut) */
  maxLen?: number;
  /** variant → articulation (round robin index in the set) for 'art' sets, e.g. tambourine */
  art?: number[][];
  /** per-variant gain (dB, indexed by variant): keeps the synth's variant semantics where the
   *  recordings are loudness-normalised (tambourine accents / shakes, the soft timpani stroke) */
  vg?: number[];
  /** stereo width for mono sets: target L/R correlation of a centred note (ensembles: the right
   *  channel plays another take / neighbouring recording, so sections sound like sections) */
  width?: number;
  /** width sets with spread (section) attacks: the beat goes where the SUM of the two takes — what
   *  is heard — reaches -10 dB of its peak (5 ms RMS), not where each take alone does: two spread
   *  attacks of different shapes sum to an attack whose -10 dB point can sit 13 ms off either one */
  sumOnset?: boolean;
  /** sustained instruments with a slow recorded attack: notes whose gate is at most this many
   *  seconds play the short articulation (the recording entered in its sustain, at the loop start,
   *  with a fast fade-in — the way SSO builds its solo staccatos from the sustains) */
  short?: number;
}

const S = (id: string, set: string, kind: SampledSpec['kind'], release: number, o: Partial<SampledSpec> = {}): SampledSpec => ({ id, set, kind, release, ...o });

/**
 * Ids keep the synth names (aliases in the brief's long names too). Gains (gainDb) are measured
 * by scripts/audio/calibrate_instruments.mjs (synth vs sampled loudness at equal velocity).
 */
export const SAMPLED_SPECS: SampledSpec[] = [
  // accordion family (one recorded instrument, three voicings): the lead plays the musette (two reeds
  // beating), the dry and chord voicings its lower reed alone ('accdry', derived by the build)
  S('accordion', 'accordion', 'sustain', 0.06, { gate: 0.92, width: 0.65, gainDb: 6.7 }),
  // (mono: a second recording on the right channel would beat against the first)
  S('accordionDry', 'accdry', 'sustain', 0.05, { gate: 0.92, lp: 4200, gainDb: 5.4 }),
  S('accChord', 'accdry', 'sustain', 0.035, { gate: 0.92, lp: 5200, hp: 160, gainDb: 6.7 }),
  // plucked
  S('mandolin', 'mandolin', 'pluck', 0.05, { gate: 1, choke: true, variants: 2, rr: 'neighbor', layers: [0.5], gainDb: 2.7 }),
  S('guitar', 'guitar', 'pluck', 0.12, { gate: 1, choke: true, variants: 2, rr: 'neighbor', layers: [0.7], gainDb: 3.4 }),
  S('steelGuitar', 'steelguitar', 'pluck', 0.12, { gate: 1, choke: true, variants: 2, rr: 'neighbor', gainDb: 5 }),
  S('piano', 'piano', 'pluck', 0.25, { gate: 1, layers: [0.72], gainDb: 0.6 }),
  S('harpsi', 'harpsichord', 'pluck', 0.05, { gate: 1, choke: true, variants: 2, rr: 'neighbor', gainDb: 2.2 }),
  S('harp', 'harp', 'pluck', 0.3, { gate: 1, choke: true, variants: 2, rr: 'neighbor', gainDb: 2.7 }),
  // strings
  S('violin', 'violin', 'sustain', 0.14, { gate: 0.96, short: 0.3, gainDb: 6.3 }),
  S('strings', 'strings', 'sustain', 0.3, { gate: 0.97, width: 0.65, short: 0.3, gainDb: 6 }),
  S('strStab', 'strstab', 'pluck', 0.06, { gate: 0.6, variants: 2, rr: 'set', width: 0.65, sumOnset: true, gainDb: 6.1 }),
  S('pizz', 'pizz', 'pluck', 0.08, { gate: 1, choke: true, variants: 2, rr: 'set', gainDb: 1.5 }),
  S('ubass', 'ubass', 'pluck', 0.08, { gate: 0.9, choke: true, variants: 2, rr: 'neighbor', gainDb: 1.2 }),
  S('cello', 'cello', 'sustain', 0.16, { gate: 0.96, short: 0.3, gainDb: 4.8 }),
  S('contrabass', 'contrabass', 'sustain', 0.18, { gate: 0.95, short: 0.3, gainDb: 4.9 }),
  // brass
  S('brass', 'brass', 'sustain', 0.09, { gate: 0.92, width: 0.88, gainDb: 2.7 }),
  S('brassSoft', 'horns', 'sustain', 0.14, { gate: 0.92, width: 0.88, gainDb: 6 }),
  S('tuba', 'tuba', 'sustain', 0.07, { gate: 0.85, gainDb: 5.6 }),
  S('trumpet', 'trumpet', 'sustain', 0.09, { gate: 0.92, gainDb: 4.8 }),
  S('trombone', 'trombone', 'sustain', 0.1, { gate: 0.92, gainDb: 4.4 }),
  S('horn', 'horn', 'sustain', 0.12, { gate: 0.92, gainDb: 4.8 }),
  // woodwinds
  S('flute', 'flute', 'sustain', 0.08, { gate: 0.9, short: 0.2, gainDb: 6.3 }),
  S('piccolo', 'piccolo', 'sustain', 0.07, { gate: 0.9, gainDb: 4.8 }),
  S('clarinet', 'clarinet', 'sustain', 0.08, { gate: 0.9, gainDb: 4.6 }),
  S('oboe', 'oboe', 'sustain', 0.08, { gate: 0.9, gainDb: 4.4 }),
  S('bassoon', 'bassoon', 'sustain', 0.08, { gate: 0.9, gainDb: 4.4 }),
  // voices / organ
  S('choir', 'choir', 'sustain', 0.4, { gate: 0.98, width: 0.65, short: 0.3, gainDb: 4.6 }),
  S('choirO', 'choir', 'sustain', 0.4, { gate: 0.98, lp: 1400, width: 0.65, short: 0.3, gainDb: 5.4 }),
  S('organ', 'organ', 'sustain', 0.08, { gate: 0.95, width: 0.85, gainDb: 3.9 }),
  // mallets / bells
  S('glock', 'glock', 'pluck', 0.4, { ring: true, maxLen: 2.2, gainDb: 3.1 }),
  S('xylophone', 'xylophone', 'pluck', 0.1, { ring: true, gainDb: 6.2 }),
  S('vibes', 'vibes', 'pluck', 0.3, { gate: 1, gainDb: 2.4 }),
  S('celesta', 'celesta', 'pluck', 0.3, { gate: 1, layers: [0.7], gainDb: 5 }),
  S('bell', 'chimes', 'pluck', 1, { ring: true, maxLen: 4, gainDb: -2.5 }),
  // timpani: variant 0 = stroke (take 1), 1 = the synth's soft stroke (take 2, -4.5 dB), 2 = take 2 at
  // full level — notes without a variant alternate the two takes at the same level
  S('timp', 'timpani', 'pluck', 0.6, { ring: true, maxLen: 3.2, variants: 3, rr: 'set', takes: [0, 1, 1], rrCycle: [0, 2], layers: [0.55], vg: [0, -4.5, 0], gainDb: 2.8 }),
  // percussion (unpitched; variants keep the synth semantics)
  S('tamb', 'tamb', 'perc', 0.03, { ring: true, unpitched: true, variants: 8, rr: 'art', rrCycle: [0, 1], vg: [0, 0, -3.5, -3.5, 2, 2, -2, -2], gainDb: -8.7 }),
  S('snare', 'snare', 'perc', 0.05, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.45, 0.65, 0.85], gainDb: 4.8 }),
  S('crash', 'crash', 'perc', 0.5, { ring: true, unpitched: true, maxLen: 3, variants: 2, rr: 'set', layers: [0.75], width: 0.3, gainDb: 4 }),
  S('kick', 'kick', 'perc', 0.05, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.5, 0.85], gainDb: 9.6 }),
  S('triangle', 'triangle', 'perc', 0.3, { ring: true, unpitched: true, maxLen: 2.5, variants: 2, rr: 'set', layers: [0.7], gainDb: 0 }),
  S('shaker', 'shaker', 'perc', 0.02, { ring: true, unpitched: true, variants: 4, rr: 'art', art: [[0], [1], [2], [3]], rrCycle: [0, 1, 2, 3], gainDb: 0 }),
  S('pan', 'panclang', 'perc', 0.1, { ring: true, unpitched: true, maxLen: 1.6, variants: 2, rr: 'set', layers: [0.8], gainDb: -0.9 }),
  S('anvil', 'anvil', 'perc', 0.1, { ring: true, unpitched: true, maxLen: 2, variants: 2, rr: 'set', layers: [0.45, 0.8], gainDb: 0.1 }),
  S('castanets', 'castanets', 'perc', 0.02, { ring: true, unpitched: true, variants: 4, rr: 'set', gainDb: 0.2 }),
  S('slapstick', 'slapstick', 'perc', 0.03, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.6], gainDb: 0.2 }),
  S('woodblock', 'woodblock', 'perc', 0.03, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.6], gainDb: 5.2 }),
  S('vibraslap', 'vibraslap', 'perc', 0.1, { ring: true, unpitched: true, variants: 2, rr: 'set', gainDb: 1.8 }),
  S('flexatone', 'flexatone', 'perc', 0.1, { ring: true, unpitched: true, variants: 4, rr: 'art', rrCycle: [0, 1], gainDb: 4.5 }),
  S('cymbal', 'cymbal', 'perc', 0.6, { unpitched: true, variants: 2, rr: 'art', layers: [0.7], gainDb: 5.1 }),
  S('bassDrum', 'bassdrum', 'perc', 0.4, { unpitched: true, variants: 2, rr: 'art', layers: [0.5, 0.85], gainDb: 0.4 }),
  S('tamtam', 'tamtam', 'perc', 1.2, { ring: true, unpitched: true, maxLen: 6, variants: 2, rr: 'set', width: 0.4, gainDb: 4.4 }),
  S('claves', 'claves', 'perc', 0.02, { ring: true, unpitched: true, variants: 2, rr: 'set', layers: [0.7], gainDb: 3.9 }),
  S('ratchet', 'ratchet', 'perc', 0.1, { ring: true, unpitched: true, variants: 3, rr: 'art', gainDb: 2.6 }),
  S('toyWhistle', 'toywhistle', 'perc', 0.1, { ring: true, unpitched: true, variants: 4, rr: 'art', gainDb: 2.1 }),
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
    // decoded at another rate (decode-context fallback): back to the set's own rate, so the resident
    // bank keeps its native size (a 44.1 / 48 kHz copy of the 24 / 32 kHz sets is 40-50 % larger)
    // and every manifest position stays exact
    let data = pcm.data;
    if (pcm.sr !== def.sr) {
      pendingWarnings.push(`set ${def.name}: decoded at ${pcm.sr} Hz, resampled to its ${def.sr} Hz`);
      data = pcm.data.map((c) => resampleChannel(c, pcm.sr, def.sr));
    }
    const mk = findMarker(data[0], def);
    if (!mk.ok) pendingWarnings.push(`set ${def.name}: alignment marker not found, assuming no decoder delay`);
    pendingShifts[def.name] = mk.shift;
    let peak = 1;
    for (const c of data) for (let i = 0; i < c.length; i++) if (Math.abs(c[i]) > peak) peak = Math.abs(c[i]);
    const k = peak / 32767;
    const inv = 1 / k;
    const chs: Int16Array[] = [];
    for (let c = 0; c < def.ch; c++) {
      const src = data[Math.min(c, data.length - 1)];
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
    // material before ls (equal in the source after the build's loop crossfade, so this only
    // removes codec noise)
    for (const z of def.zones) if (z.ls !== undefined && z.le !== undefined) for (const c of chs) seamFix(c, z.o + z.ls, z.o + z.le);
    bank.set(def.name, { def, sr: def.sr, ch: chs, k });
    return true;
  } catch (e) {
    pendingWarnings.push(`set ${def.name}: ${String(e)}`);
    return false;
  }
}

const registered = new Set<string>();

/** InstDefs (plus the brief's long-name aliases) for every spec whose set is in the bank and
 *  that was not registered yet; `all` re-creates every one. */
function pendingDefs(all: boolean): { defs: InstDef[]; ids: string[] } {
  const defs: InstDef[] = [];
  const ids: string[] = [];
  for (const spec of SAMPLED_SPECS) {
    const set = bank.get(spec.set);
    if (!set || !set.def.zones.length || (!all && registered.has(spec.id))) continue;
    const d = makeSampledInst(spec, set);
    defs.push(d);
    ids.push(spec.id);
    registered.add(spec.id);
    for (const [alias, id] of Object.entries(INSTRUMENT_ALIASES)) if (id === spec.id) defs.push({ ...d, id: alias });
  }
  return { defs, ids };
}

/** Register the instruments whose sets have arrived since the last call (incremental install:
 *  a track can render as soon as its own sets are in). Returns the newly registered ids. */
export function registerArrivedSets(register: (defs: InstDef[]) => void): string[] {
  const { defs, ids } = pendingDefs(false);
  if (defs.length) {
    try {
      register(defs);
    } catch (e) {
      pendingWarnings.push('register failed: ' + String(e));
    }
  }
  return ids;
}

/** Register every sampled instrument whose set arrived; final report of the bank. */
export function finishSampleBank(register: (defs: InstDef[]) => void): BankReport {
  registerArrivedSets(register);
  const instruments = SAMPLED_SPECS.filter((s) => registered.has(s.id)).map((s) => s.id);
  const rep: BankReport = { ok: instruments.length > 0, sets: bank.size, instruments, shifts: pendingShifts, bytes: sampleBankBytes(), warnings: pendingWarnings };
  pendingWarnings = [];
  pendingShifts = {};
  return rep;
}

/** Sets stored so far (names). */
export function bankSetNames(): string[] {
  return [...bank.keys()];
}

/** Sample sets an instrument id plays (empty for synthesized-only ids). */
export function setsOfInstrument(id: string): string[] {
  const real = INSTRUMENT_ALIASES[id] ?? id;
  return SAMPLED_SPECS.filter((s) => s.id === real).map((s) => s.set);
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
  // up to 512 samples: MP3 coding noise differs on the two sides of the seam (pre-echo spreads up
  // to a granule), the build made the material before le equal to the material before ls
  const n = Math.min(512, Math.floor(L / 4), ls);
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
// Resampling kernel: 16-tap Kaiser-windowed sinc (β 7, cutoff 0.95 × source Nyquist),
// 4096 phases (nearest phase: ≤ 1/8192 sample timing error)
// ---------------------------------------------------------------------------------------------

const TAPS = 16;
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
  const beta = 7;
  const cutoff = 0.95; // of the source Nyquist
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

/** A whole decoded channel from rate `from` to rate `to` (same kernel; the decoded sprites of the
 *  24 / 32 kHz MP3s hold nothing above their own Nyquist, so no extra low-pass is needed). */
function resampleChannel(x: Float32Array, from: number, to: number): Float32Array {
  const inc = from / to;
  const n = Math.max(1, Math.floor((x.length - 1) / inc) + 1);
  const padded = new Float32Array(x.length + TAPS);
  padded.set(x, HALF - 1);
  const out = new Float32Array(n);
  resampleInto(padded, out, inc, 1);
  return out;
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
        src[base + 7] * K[kp + 7] +
        src[base + 8] * K[kp + 8] +
        src[base + 9] * K[kp + 9] +
        src[base + 10] * K[kp + 10] +
        src[base + 11] * K[kp + 11] +
        src[base + 12] * K[kp + 12] +
        src[base + 13] * K[kp + 13] +
        src[base + 14] * K[kp + 14] +
        src[base + 15] * K[kp + 15];
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
  /** extra detune (cents) and gain for alternate takes / variant semantics */
  cents: number;
  gain: number;
  /** octaves the requested pitch was folded by (0 = played at pitch) */
  fold: number;
}

/** zones of the velocity layer nearest to `layer` */
function nearestLayer(pool: ZoneDef[], layer: number): ZoneDef[] {
  let lay = pool[0].l;
  for (const z of pool) if (Math.abs(z.l - layer) < Math.abs(lay - layer) || (Math.abs(z.l - layer) === Math.abs(lay - layer) && z.l < lay)) lay = z.l;
  return pool.filter((z) => z.l === lay);
}

/** furthest a borrowed neighbouring recording may be from the target pitch (semitones) */
const NEIGHBOR_MAX = 3.5;
/** micro-variation of a repeated take when no other recording exists (cents, linear gain) */
const MICRO_CENTS = 3;
const MICRO_GAIN = Math.pow(10, -0.4 / 20);

function chooseZone(spec: SampledSpec, set: StoredSet, midiIn: number, variant: number, layer: number): Choice | null {
  const zones = set.def.zones;
  if (!zones.length) return null;
  let pool: ZoneDef[];
  let micro = false;
  if (spec.rr === 'art') {
    // articulations (roll vs hit, shake vs accent): the articulation decides first, the velocity
    // layer only within it (a roll recorded at one dynamic stays a roll at every velocity)
    const alts = spec.art ? spec.art[variant % spec.art.length] : [variant];
    pool = zones.filter((z) => alts.includes(z.r));
    if (!pool.length) pool = zones.filter((z) => z.r === 0);
    if (!pool.length) pool = zones;
    pool = nearestLayer(pool, layer);
  } else {
    // round robins: the velocity layer decides first, the take within it; a layer without the
    // requested take repeats its first take with a micro-variation (never sample-identical)
    pool = nearestLayer(zones, layer);
    const want = spec.rr === 'set' ? (spec.takes ? spec.takes[variant % spec.takes.length] ?? 0 : variant) : 0;
    const rr = pool.filter((z) => z.r === want);
    if (rr.length) pool = rr;
    else {
      const r0 = pool.filter((z) => z.r === 0);
      if (r0.length) pool = r0;
      micro = want % 2 === 1;
    }
  }
  const vgDb = spec.vg ? spec.vg[variant % spec.vg.length] ?? 0 : 0;
  const vg = vgDb ? Math.pow(10, vgDb / 20) : 1;
  if (spec.unpitched) {
    const z = pool[0];
    return { zone: z, midi: z.p, cents: micro ? MICRO_CENTS : 0, gain: vg * (micro ? MICRO_GAIN : 1), fold: 0 };
  }
  // fold into the playable range by octaves (the build extends the outermost zones' key ranges
  // by a fourth: no note is shifted further than that from its recording)
  let lo = Infinity;
  let hi = -Infinity;
  for (const z of pool) {
    lo = Math.min(lo, z.lo);
    hi = Math.max(hi, z.hi);
  }
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
  let gain = vg;
  if (spec.rr === 'neighbor' && variant % 2 === 1) {
    // alternate take: borrow the nearest other recording (<= NEIGHBOR_MAX semitones away)
    const alt = neighborZone(pool, zone, m, NEIGHBOR_MAX);
    if (alt) zone = alt;
    else micro = true;
  }
  if (micro) {
    cents += MICRO_CENTS;
    gain *= MICRO_GAIN;
  }
  return { zone, midi: m, cents, gain, fold: Math.round((m - midiIn) / 12) };
}

/** nearest zone to pitch m other than `not` within maxD semitones (same pool), or null */
function neighborZone(pool: ZoneDef[], not: ZoneDef, m: number, maxD: number): ZoneDef | null {
  let alt: ZoneDef | null = null;
  let altD = Infinity;
  for (const z of pool) {
    if (z === not || z.o === not.o) continue;
    const d = Math.abs(m - z.p);
    if (d <= maxD && d < altD) {
      altD = d;
      alt = z;
    }
  }
  return alt;
}

/**
 * The recording the right channel plays for `width` instruments: another take of the same
 * velocity layer (two-take sets), else the nearest other recording within 4 semitones, else null
 * (the same zone, detuned a few cents).
 */
function partnerZone(spec: SampledSpec, set: StoredSet, c: Choice, layer: number): ZoneDef | null {
  const zones = set.def.zones;
  const sameLayer = zones.filter((z) => z.l === c.zone.l);
  if (spec.rr === 'set') {
    const other = sameLayer.filter((z) => z.r !== c.zone.r);
    const alt = neighborZone(other, c.zone, c.midi, 1.5);
    if (alt) return alt;
  }
  const pool = sameLayer.filter((z) => z.r === c.zone.r && c.midi >= z.lo - 4 && c.midi <= z.hi + 4);
  void layer;
  return neighborZone(pool, c.zone, c.midi, 4);
}

// ---------------------------------------------------------------------------------------------
// Rendering one sample
// ---------------------------------------------------------------------------------------------

/** Unroll n samples of a zone at the set rate from zone position `from` (0 = its start): copies,
 *  wraps the loop, applies the loop decay. */
function unroll(set: StoredSet, z: ZoneDef, c: number, n: number, from = 0): Float32Array {
  const src = set.ch[Math.min(c, set.ch.length - 1)];
  const out = new Float32Array(n);
  const k = set.k;
  const o = z.o + from;
  const looped = z.ls !== undefined && z.le !== undefined && z.le - z.ls > 16;
  if (!looped) {
    const m = Math.min(n, z.n - from, src.length - o);
    for (let i = 0; i < m; i++) out[i] = src[o + i] * k;
    return out;
  }
  // positions below relative to the read start (from <= ls)
  const ls = (z.ls as number) - from;
  const le = (z.le as number) - from;
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

/**
 * Zero-phase anti-alias low-pass for large upward shifts: 63-tap Kaiser-windowed sinc (β 8,
 * stopband ≈ -80 dB). `fc` is the cutoff as a fraction of the sample rate (0..0.5).
 */
const FIR_N = 63;
const firCache = new Map<number, Float32Array>();
function firLowpassInPlace(x: Float32Array, fc: number): void {
  const key = Math.round(fc * 1e5);
  let h = firCache.get(key);
  if (!h) {
    h = new Float32Array(FIR_N);
    const M = (FIR_N - 1) / 2;
    const i0b = bessel0(8);
    let sum = 0;
    for (let k = 0; k < FIR_N; k++) {
      const x0 = k - M;
      const sinc = x0 === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * x0) / (Math.PI * x0);
      const r = x0 / M;
      const v = sinc * (bessel0(8 * Math.sqrt(Math.max(0, 1 - r * r))) / i0b);
      h[k] = v;
      sum += v;
    }
    for (let k = 0; k < FIR_N; k++) h[k] /= sum;
    firCache.set(key, h);
  }
  const n = x.length;
  const M = (FIR_N - 1) / 2;
  const src = x.slice();
  for (let i = 0; i < n; i++) {
    let acc = 0;
    const k0 = Math.max(0, M - i);
    const k1 = Math.min(FIR_N, n - i + M);
    for (let k = k0; k < k1; k++) acc += h[k] * src[i + k - M];
    x[i] = acc;
  }
}

function makeSampledInst(spec: SampledSpec, set: StoredSet): InstDef {
  const gain = Math.pow(10, (spec.gainDb ?? 0) / 20);
  const thresholds = spec.layers ?? [];
  const def: InstDef & { layerOf(v: number): number } = {
    id: spec.id,
    kind: spec.kind,
    variants: spec.variants ?? 1,
    rrCycle: spec.rrCycle ?? (spec.rr === 'art' ? [0] : undefined),
    release: spec.release,
    ring: spec.ring,
    gate: spec.gate,
    choke: spec.choke,
    shortArt: spec.kind === 'sustain' && spec.short ? spec.short : undefined,
    layerOf(v: number): number {
      let l = 0;
      for (const t of thresholds) if (v >= t) l++;
      return l;
    },
    noteInfo(midi: number, layer: number): { fold: number; shift: number } | null {
      if (spec.unpitched) return null;
      const c = chooseZone(spec, set, midi, 0, layer);
      return c ? { fold: c.fold, shift: c.midi - c.zone.p } : null;
    },
    make(sr: number, midi: number, variant: number, lenSec: number, layer = 0, art = 0): Sample {
      try {
        return renderZone(spec, set, sr, midi, variant, lenSec, layer, gain, art === 1 && !!spec.short);
      } catch {
        return { l: new Float32Array(Math.max(1, Math.round(0.05 * sr))), r: null };
      }
    },
  };
  return def;
}

interface Rendered {
  chans: Float32Array[];
  /** output samples before the onset */
  pre: number;
  /** output sample the gate counts from (ZoneDef.ga) */
  ga: number;
  /** output sample where the primary take's zone starts (two takes summed) */
  take0?: number;
  /** the ringing recording was longer than maxLen (gets a long fade instead of a cut) */
  truncated: boolean;
}

/** Resample one zone to the output rate/pitch: unroll (loop/decay), band-limit, sinc-resample.
 *  short: the short articulation (sustained zones): enter at the loop start with a fast fade-in. */
function renderOne(spec: SampledSpec, set: StoredSet, z: ZoneDef, midi: number, cents: number, sr: number, lenSec: number, g: number, short = false): Rendered {
  const shift = (spec.unpitched ? 0 : midi - z.p) + cents / 100;
  const pitchRatio = Math.pow(2, shift / 12);
  const inc = (pitchRatio * set.sr) / sr; // source samples per output sample
  const looped = z.ls !== undefined && z.le !== undefined && z.le - z.ls > 16;
  if (short && looped) return renderShort(set, z, midi, pitchRatio, inc, sr, lenSec, g);
  const preOut = Math.round(z.pre / inc);
  // output length: requested (plus the pre-roll), or the natural ring capped by maxLen
  const natural = naturalSec(z, set.sr) / pitchRatio;
  let sec = lenSec > 0 ? lenSec : natural;
  let truncated = false;
  if (spec.maxLen && sec > spec.maxLen) {
    sec = spec.maxLen;
    truncated = natural > spec.maxLen;
  }
  if (lenSec <= 0 && z.ls === undefined) sec = Math.min(sec, natural);
  const nOut = Math.max(16, preOut + Math.round(sec * sr));
  const nSrc = Math.ceil(nOut * inc) + TAPS + 2;
  const chans: Float32Array[] = [];
  for (let c = 0; c < set.ch.length; c++) {
    const tmp = unroll(set, z, c, nSrc);
    // a slow swell entered late (sustained pre-roll cap): its kept build-up fades in
    if (z.fi) for (let i = 0; i < z.fi && i < tmp.length; i++) tmp[i] *= 0.5 - 0.5 * Math.cos((Math.PI * (i + 0.5)) / z.fi);
    // shifting up so far that source content would land above the output Nyquist: band-limit first
    if (inc > 0.98) firLowpassInPlace(tmp, 0.46 / inc);
    // margin of HALF-1 zeros before the data so tap 0 can reach index -3
    const padded = new Float32Array(tmp.length + TAPS);
    padded.set(tmp, HALF - 1);
    const out = new Float32Array(nOut);
    resampleInto(padded, out, inc, g);
    chans.push(out);
  }
  return { chans, pre: preOut, ga: z.ga !== undefined ? Math.round(z.ga / inc) : preOut, truncated };
}

/** The short articulation of a sustained zone: the recording entered at its loop start — the steady
 *  sustain the zone was normalised on, so a short note sits at the level of a long note's sustain —
 *  with a raised-cosine fade-in of max(10 ms, one period) <= 25 ms; the beat sits 30 % into the fade
 *  (where it reaches about -10 dB). */
function renderShort(set: StoredSet, z: ZoneDef, midi: number, pitchRatio: number, inc: number, sr: number, lenSec: number, g: number): Rendered {
  const from = z.ls as number;
  const fadeSec = Math.min(0.025, Math.max(0.01, 1 / (440 * Math.pow(2, (midi - 69) / 12))));
  const nFade = Math.max(8, Math.round(fadeSec * set.sr * pitchRatio)); // source samples
  const preOut = Math.round((0.3 * nFade) / inc);
  const nOut = Math.max(16, preOut + Math.round(Math.max(lenSec, 0.1) * sr));
  const nSrc = Math.ceil(nOut * inc) + TAPS + 2;
  const chans: Float32Array[] = [];
  for (let c = 0; c < set.ch.length; c++) {
    const tmp = unroll(set, z, c, nSrc, from);
    for (let i = 0; i < nFade && i < tmp.length; i++) tmp[i] *= 0.5 - 0.5 * Math.cos((Math.PI * (i + 0.5)) / nFade);
    if (inc > 0.98) firLowpassInPlace(tmp, 0.46 / inc);
    const padded = new Float32Array(tmp.length + TAPS);
    padded.set(tmp, HALF - 1);
    const out = new Float32Array(nOut);
    resampleInto(padded, out, inc, g);
    chans.push(out);
  }
  return { chans, pre: preOut, ga: preOut, truncated: false };
}

/**
 * Where two takes summed for `width` start (output samples) and the beat and gate anchor of their sum: aligned on
 * their beats — each take's perceptual onset (one ensemble attack: two takes of one note started 15 ms apart are
 * a flam) — the sum's gate anchor the mean of the takes' (a note keeps the length the songs were written against;
 * sustained notes keep the loudness they were balanced with, takesLoudness).
 */
function alignTakes(a: Rendered, b: Rendered): { offA: number; offB: number; pre: number; ga: number } {
  const pre = Math.max(a.pre, b.pre);
  const offA = pre - a.pre;
  const offB = pre - b.pre;
  return { offA, offB, pre, ga: Math.round((offA + a.ga + offB + b.ga) / 2) };
}

/**
 * Mono sets with `width`: the left channel plays the chosen recording, the right one another take
 * or the neighbouring recording at the same pitch (aligned by alignTakes); rotated to the target
 * correlation and normalised to the power of one channel (a centred note keeps its loudness).
 */
function widen(a: Rendered, b: Rendered, width: number): Rendered {
  const al = alignTakes(a, b);
  const n = Math.max(a.chans[0].length + al.offA, b.chans[0].length + al.offB);
  const xl = new Float32Array(n);
  const xr = new Float32Array(n);
  xl.set(a.chans[0], al.offA);
  xr.set(b.chans[0], al.offB);
  const th = Math.asin(clamp(width, 0, 1)) / 2;
  const c = Math.cos(th);
  const s = Math.sin(th);
  // keep the power of the primary take: correlated takes (the detuned fallback) sum louder
  let pl = 0;
  let pr = 0;
  let plr = 0;
  for (let i = 0; i < n; i += 4) {
    pl += xl[i] * xl[i];
    pr += xr[i] * xr[i];
    plr += xl[i] * xr[i];
  }
  const kr = pr > 0 ? Math.sqrt(pl / pr) : 0; // right take scaled to the left one's power
  const rho = pl > 0 && pr > 0 ? plr / Math.sqrt(pl * pr) : 0;
  const norm = 1 / Math.sqrt(Math.max(1e-6, c * c + s * s + 2 * c * s * rho));
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const cl = c * norm;
  const sl = s * norm;
  for (let i = 0; i < n; i++) {
    const l = xl[i];
    const r = xr[i] * kr;
    L[i] = cl * l + sl * r;
    R[i] = cl * r + sl * l;
  }
  return { chans: [L, R], pre: al.pre, ga: al.ga, take0: al.offA, truncated: a.truncated || b.truncated };
}

/** furthest the loudness of two takes summed is corrected (dB) */
const TAKES_GAIN_MAX = 6;

/**
 * Two takes summed for a sustained `width` set (widen(): aligned on their beats): the loudness the songs were
 * balanced with is that of the takes aligned on their gate anchors — two coherent recordings sum louder or softer
 * by up to ~3 dB with their relative offset (the attack's partial cancellation or reinforcement), note by note.
 * Returns gate (output samples) → the gain that gives a note gated there (then released, time constant
 * `release`) the energy it has with the takes aligned on their anchors, both counted from their gate anchors:
 * one gain per note, so the envelope — the attack where the takes now start together — is kept. Memoised.
 */
function takesLoudness(a: Rendered, b: Rendered, w: Rendered, width: number, release: number, sr: number): (gate: number) => number {
  const th = Math.asin(clamp(width, 0, 1)) / 2;
  const c = Math.cos(th);
  const s = Math.sin(th);
  // the pair as widen() plays it: its stereo power
  const n = w.chans[0].length;
  const pn = new Float64Array(n);
  for (let i = 0; i < n; i++) pn[i] = w.chans[0][i] * w.chans[0][i] + w.chans[1][i] * w.chans[1][i];
  // the pair aligned on the takes' gate anchors, normalised as widen() normalises it
  const A0 = Math.max(a.ga, b.ga);
  const oA = A0 - a.ga;
  const oB = A0 - b.ga;
  const m = Math.max(a.chans[0].length + oA, b.chans[0].length + oB);
  const xl = new Float32Array(m);
  const xr = new Float32Array(m);
  xl.set(a.chans[0], oA);
  xr.set(b.chans[0], oB);
  let pl = 0;
  let pr = 0;
  let plr = 0;
  for (let i = 0; i < m; i += 4) {
    pl += xl[i] * xl[i];
    pr += xr[i] * xr[i];
    plr += xl[i] * xr[i];
  }
  const kr = pr > 0 ? Math.sqrt(pl / pr) : 0;
  const rho = pl > 0 && pr > 0 ? plr / Math.sqrt(pl * pr) : 0;
  const nn = 1 / Math.max(1e-6, c * c + s * s + 2 * c * s * rho);
  const pa = new Float64Array(m);
  for (let i = 0; i < m; i++) {
    const l = xl[i];
    const r = xr[i] * kr;
    pa[i] = nn * ((c * c + s * s) * (l * l + r * r) + 4 * c * s * l * r);
  }
  // energy of a note cut at `cut`: everything before it, then the release decay (power factor k2 per sample)
  const k2 = Math.exp(-2 / (Math.max(0.001, release) * sr));
  const energy = (p: Float64Array): ((cut: number) => number) => {
    const N = p.length;
    const head = new Float64Array(N + 1);
    for (let i = 0; i < N; i++) head[i + 1] = head[i] + p[i];
    const tail = new Float64Array(N + 1);
    for (let i = N - 1; i >= 0; i--) tail[i] = k2 * (p[i] + tail[i + 1]);
    return (cut: number): number => {
      const j = Math.max(0, Math.min(N, cut));
      return head[j] + tail[j];
    };
  };
  const en = energy(pn);
  const ea = energy(pa);
  const gmax = Math.pow(10, TAKES_GAIN_MAX / 20);
  const memo = new Map<number, number>();
  return (gate: number): number => {
    const g0 = Math.max(1, Math.round(gate));
    let g = memo.get(g0);
    if (g === undefined) {
      const e1 = en(w.ga + g0);
      const e0 = ea(A0 + g0);
      g = e1 > 0 && e0 > 0 ? Math.min(gmax, Math.max(1 / gmax, Math.sqrt(e0 / e1))) : 1;
      memo.set(g0, g);
    }
    return g;
  };
}

/** furthest the summed takes' onset may move the beat from the takes' own (s): spread attacks (strStab) */
const SUM_ONSET_MAX = 0.025;
/** furthest a short note's own onset may sit from the whole note's (s): a take whose bow noise
 *  builds up for 30-40 ms before its main rise sounds, cut short, mostly that build-up */
const SHORT_ONSET_MAX = 0.045;
/** release tail the mixer plays after the gate, in time constants (render.ts TAIL_TAU) */
const MIX_TAIL_TAU = 3.6;

/**
 * Onset (sample index) of what a centred note plays — the mono sum of the channels — as the mixer
 * plays it: full level up to `cut` (the gate end; Infinity = the whole sample), then the release
 * decay (factor k per sample) for `tail` samples. The onset is the first point where the RMS over
 * the preceding 5 ms comes within 10 dB of its maximum over the note (at most 0.5 s after `pre`):
 * the perceptual onset of a spread attack (strStab), measured on what is heard.
 */
function heardOnset(chans: Float32Array[], sr: number, pre: number, cut = Infinity, k = 1, tail = 0): number {
  const n = Math.min(chans[0].length, pre + Math.round(0.5 * sr), cut + tail);
  const W = Math.max(1, Math.round(0.005 * sr));
  const cs = new Float64Array(n + 1);
  const inv = 1 / chans.length;
  let env = 1;
  for (let i = 0; i < n; i++) {
    if (i >= cut) env *= k;
    let v = 0;
    for (const c of chans) v += c[i];
    v *= inv * env;
    cs[i + 1] = cs[i] + v * v;
  }
  // trailing window [t - W, t): the onset is the first t where it reaches the threshold
  let pk = 0;
  for (let t = 1; t <= n; t++) pk = Math.max(pk, cs[t] - cs[Math.max(0, t - W)]);
  if (pk <= 0) return pre;
  const thr = pk * 0.1; // power: -10 dB
  let t = 1;
  while (t < n && cs[t] - cs[Math.max(0, t - W)] < thr) t++;
  return t;
}

// Perceptual onset of a sustained note: the same criterion as the bank build (scripts/audio/instrument_dsp.py
// perceptual_onset, build_instruments.sustain_beat), here for what a note plays where that differs from the bank's
// single take — two takes summed for `width`, a voicing's tone filters, a short note — and for the checks.
const ONSET_DB = -10;
const ONSET_LOOK = 0.5;
/** a beat never sits lower than this (dB re the note's maximum) on a climb */
const FLOOR_DB = -15;
/** the beat at most this long (s) after the -15 dB point (a slow climb, a creep below -10 dB) */
const RISE_MAX = 0.015;
/** dB per ms: an envelope that climbs its last X dB below the threshold slower than this dwells */
const DWELL_SLOPE = 0.1;
const DWELL_X = [1.5, 2, 3, 4, 5, 6, 8, 10];
const DWELL_BLEND0 = 0.75;
const DWELL_BLEND1 = 1.5;
/** a real attack onto a plateau: looked for from where the envelope first gets within this of its maximum
 *  (dB), it climbed ATTACK_RISE0..1 dB over the ATTACK_WIN (s) before its climb stalls (less than
 *  ATTACK_SETTLE dB over the next ATTACK_WIN); it crosses -15 dB — or, stalling lower, ATTACK_TOP below where
 *  it stalls — ATTACK_LEAD (s) before the beat */
const ATTACK_FROM = -20;
const ATTACK_WIN = 0.015;
const ATTACK_SETTLE = 3;
const ATTACK_RISE0 = 6;
const ATTACK_RISE1 = 10;
const ATTACK_TOP = 1.5;
const ATTACK_LEAD = RISE_MAX / 2;

/**
 * Power envelope for the perceptual onset of what a centred note plays (the mono sum of `chans`, first
 * `n` samples): e[t - 1] = mean square over max(5 ms, one pitch period) centred where a trailing 5 ms
 * window ending at t is centred (the attack suite's att10 window), silence outside. A window of at
 * least one period reads the envelope of a low note rather than its waveform.
 */
export function onsetPower(chans: Float32Array[], sr: number, n: number, period: number): Float64Array {
  const w5 = Math.max(1, Math.round(0.005 * sr));
  const w = Math.max(w5, Math.round(period));
  const cs = new Float64Array(n + 1);
  const inv = 1 / chans.length;
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const c of chans) if (i < c.length) v += c[i];
    v *= inv;
    cs[i + 1] = cs[i] + v * v;
  }
  const e = new Float64Array(n);
  const off = (w5 + w) >> 1;
  for (let t = 1; t <= n; t++) {
    const a = Math.min(n, Math.max(0, t - off));
    const b = Math.min(n, Math.max(0, t - off + w));
    e[t - 1] = (cs[b] - cs[a]) / w;
  }
  return e;
}

/**
 * The perceptual onset (sample index: the end of the trailing 5 ms window that reaches it) on the power
 * envelope `e` (onsetPower), from a first guess `pre`: the first point within 10 dB of the maximum over the
 * next 0.5 s (the attack suite's att10 = 0; `top` = a fixed end of the window for the maximum instead, so the
 * result does not depend on how long the sample is), at most RISE_MAX after the -15 dB point — or, for a note
 * that dwells below -10 dB after a real attack (its last X dB, X = 1.5..10, climbed slower than DWELL_SLOPE;
 * the climb out of the build-up rose ATTACK_RISE dB within ATTACK_WIN before it stalled), that attack:
 * ATTACK_LEAD after its -15 dB point (or its top, for an attack that stalls lower), blended in over the dwell
 * ratios DWELL_BLEND0..1 and the rises ATTACK_RISE0..1 (instrument_dsp.perceptual_onset documents the
 * criterion). `w`: how far the beat moved onto the attack (the bank's ZoneDef.dw).
 */
export function perceptualOnset(e: Float64Array, sr: number, pre: number, top = 0): { p: number; p10: number; p15: number; dwell: number; w: number } {
  const N = e.length;
  if (N < 2) return { p: pre, p10: pre, p15: pre, dwell: 0, w: 0 };
  const look = Math.round(ONSET_LOOK * sr);
  const firstGe = (thr: number, end: number): number => {
    for (let i = 0; i < end; i++) if (e[i] >= thr) return i + 1;
    return end;
  };
  const maxTo = (end: number): number => {
    let m = 0;
    for (let i = 0; i < end; i++) if (e[i] > m) m = e[i];
    return m;
  };
  let p = Math.max(1, Math.min(Math.round(pre), N));
  // (a fixed window: one maximum, one threshold crossing)
  const fixedM = top > 0 ? maxTo(Math.min(N, top)) : 0;
  let M = 0;
  for (let it = 0; it < 32; it++) {
    const n = top > 0 ? Math.min(N, top) : Math.min(N, p + look);
    M = top > 0 ? fixedM : maxTo(n);
    if (M <= 0) return { p: pre, p10: pre, p15: pre, dwell: 0, w: 0 };
    const q = firstGe(M * Math.pow(10, ONSET_DB / 10), n);
    if (q === p || top > 0) {
      p = q;
      break;
    }
    p = q;
  }
  M = top > 0 ? fixedM : maxTo(Math.min(N, p + look));
  const k = Math.round(ATTACK_WIN * sr);
  const nd = Math.min(N, p + k);
  const dB = new Float64Array(nd);
  for (let i = 0; i < nd; i++) dB[i] = 10 * Math.log10(e[i] / M + 1e-20);
  const firstDb = (thr: number): number => {
    for (let i = 0; i < p; i++) if (dB[i] >= thr) return i + 1;
    return p;
  };
  const p15 = Math.min(p, firstDb(FLOOR_DB));
  const base = Math.min(p, p15 + Math.round(RISE_MAX * sr));
  let ratio = 0;
  for (const X of DWELL_X) {
    const tx = firstDb(ONSET_DB - X);
    if (tx < p) ratio = Math.max(ratio, (p - tx) / (((X / DWELL_SLOPE) * sr) / 1000));
  }
  const w = Math.min(1, Math.max(0, (ratio - DWELL_BLEND0) / (DWELL_BLEND1 - DWELL_BLEND0)));
  const out = { p: base, p10: p, p15, dwell: ratio, w: 0 };
  if (w <= 0) return out;
  // the attack: from where the envelope first gets within 20 dB of its maximum, the first point after which
  // it climbs less than ATTACK_SETTLE dB over ATTACK_WIN; how much it climbed over the ATTACK_WIN before it
  const i0 = firstDb(ATTACK_FROM) - 1;
  if (i0 >= p - 1) return out;
  let i1 = p - 1;
  for (let i = i0; i < p; i++)
    if (dB[Math.min(i + k, nd - 1)] - dB[i] < ATTACK_SETTLE) {
      i1 = i;
      break;
    }
  const at = dB[i1];
  const rise = at - dB[Math.max(0, i1 - k)];
  const a = at < ONSET_DB ? Math.min(1, Math.max(0, (rise - ATTACK_RISE0) / (ATTACK_RISE1 - ATTACK_RISE0))) : 0;
  const q = Math.min(base, firstDb(Math.min(FLOOR_DB, at - ATTACK_TOP)) + Math.round(ATTACK_LEAD * sr));
  if (w * a <= 0 || q >= base) return out;
  out.w = w * a;
  out.p = Math.round(base - w * a * (base - q));
  return out;
}

/** a short sustained note's onset blends into the whole note's beat over the last this many dB below the whole
 *  note's peak */
const SHORT_BLEND_DB = 1;
/** half width (dB) of the level bands a short note's onset is the mean crossing time of */
const SHORT_BAND_DB = 2;

/** First crossings of the levels of an onset envelope (its first `n` samples): where its running maximum rises —
 *  sample indices as perceptualOnset counts them (the end of the window), with their level (dB) */
interface Crossings {
  idx: number[];
  db: number[];
  /** the envelope's maximum (dB) */
  top: number;
}

function crossingsOf(e: Float64Array, n: number): Crossings {
  const idx: number[] = [];
  const db: number[] = [];
  let m = 0;
  for (let i = 0; i < n; i++)
    if (e[i] > m) {
      m = e[i];
      idx.push(i + 1);
      db.push(10 * Math.log10(m));
    }
  return { idx, db, top: m > 0 ? 10 * Math.log10(m) : -Infinity };
}

/** The mean first-crossing index over the levels [a, b] (dB): a band, not a level, so it slides over a plateau as
 *  the band moves instead of jumping across it (continuous in a and b) */
function bandMean(c: Crossings, a: number, b: number): number {
  let lo = 0;
  let hi = c.db.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (c.db[mid] <= a) lo = mid + 1;
    else hi = mid;
  }
  let acc = 0;
  let prev = lo > 0 ? c.db[lo - 1] : -Infinity;
  for (let j = lo; j < c.db.length && prev < b; j++) {
    const x0 = Math.max(prev, a);
    const x1 = Math.min(c.db[j], b);
    if (x1 > x0) acc += c.idx[j] * (x1 - x0);
    prev = c.db[j];
  }
  return acc / (b - a);
}

/**
 * Short notes of sustained instruments (Sample.preAt; `anchor`: their gate counts from Sample.ga): a note
 * gated while its attack still rises peaks lower, so it is heard earlier in the sample than a whole note —
 * on the same criterion, relative to its own peak. `e`: the power envelope of what the note plays (ungated);
 * a gate g (output samples) cuts it at anchor + g, then the release decays it (time constant `release`):
 *   M(g)    the gated note's peak: the maximum of e up to the cut, then of e times the release decay, within
 *           the whole note's window (its first 0.5 s after `pre`)
 *   s(g)    the mean time at which e first reaches the levels of a 4 dB band around -10 dB re M(g) — and at
 *           most RISE_MAX after the same band around -15 dB (the whole note's rule; bandMean)
 *   preAt   pre - u * max(0, pre - s), u = (dB the gated peak is under the whole note's) / SHORT_BLEND_DB,
 *           at most 1 — `pre` itself from the gate whose note reaches the whole note's peak on
 * Continuous and non-decreasing in the gate, never later than `pre` (a short note does not start later in the
 * sample than a long one); it does not depend on how long the sample is rendered. Memoised per gate.
 */
function sustainedOnsets(e: Float64Array, sr: number, pre: number, anchor: number, release: number): (gate: number) => number {
  const n = Math.min(e.length, pre + Math.round(ONSET_LOOK * sr));
  // running maximum (the gated peak up to the cut), and the first crossings of e's levels
  const pm = new Float64Array(n);
  let m = 0;
  for (let i = 0; i < n; i++) pm[i] = m = Math.max(m, e[i]);
  const ML = m;
  if (!(ML > 0) || n < 2) return () => pre;
  const cr = crossingsOf(e, n);
  const band = (a: number, b: number): number => bandMean(cr, a, b);
  const rel = Math.max(0.001, release);
  const k2 = Math.exp(-2 / (rel * sr));
  const tail = Math.round(MIX_TAIL_TAU * rel * sr);
  const rise = Math.round(RISE_MAX * sr);
  const mlDb = 10 * Math.log10(ML);
  const memo = new Map<number, number>();
  return (gate: number): number => {
    const g = Math.max(1, Math.round(gate));
    let p = memo.get(g);
    if (p !== undefined) return p;
    const cut = Math.max(0, anchor + g);
    let mg = ML;
    if (cut < n) {
      mg = cut > 0 ? pm[cut - 1] : 0;
      let f = 1;
      for (let t = cut, end = Math.min(n, cut + tail); t < end; t++) {
        const v = e[t] * f;
        if (v > mg) mg = v;
        f *= k2;
      }
    }
    if (!(mg > 0) || mg >= ML) p = pre;
    else {
      const gDb = 10 * Math.log10(mg);
      const u = Math.min(1, (mlDb - gDb) / SHORT_BLEND_DB);
      const s10 = band(gDb + ONSET_DB - SHORT_BAND_DB, gDb + ONSET_DB + SHORT_BAND_DB);
      const s15 = band(gDb + FLOOR_DB - SHORT_BAND_DB, gDb + FLOOR_DB + SHORT_BAND_DB) + rise;
      p = Math.max(0, Math.min(pre, Math.round(pre - u * Math.max(0, pre - Math.min(s10, s15)))));
    }
    memo.set(g, p);
    return p;
  };
}

/**
 * Short notes of spread attacks (strStab, two takes summed): a note gated while its attack is still rising
 * peaks lower, so its own onset sits earlier in the sample than the whole note's. Returns gate (output
 * samples) → onset index (memoised; within [lo, hi]: SHORT_ONSET_MAX around `pre`): the note is cut `gate`
 * samples after the onset it starts on — the fixed point p = onset(the note cut at p + gate), on the 5 ms RMS
 * -10 dB point.
 */
function shortOnsets(chans: Float32Array[], sr: number, pre: number, release: number): (gate: number) => number {
  const lo = pre - Math.round(SHORT_ONSET_MAX * sr);
  const hi = pre + Math.round(SHORT_ONSET_MAX * sr);
  const rel = Math.max(0.001, release);
  const k = Math.exp(-1 / (rel * sr));
  const tail = Math.round(MIX_TAIL_TAU * rel * sr);
  const whole = Math.round(0.5 * sr);
  const memo = new Map<number, number>();
  return (gate: number): number => {
    const g = Math.max(1, Math.round(gate));
    if (!(g < whole)) return pre;
    let p = memo.get(g);
    if (p === undefined) {
      p = pre;
      for (let it = 0; it < 12; it++) {
        const q = Math.max(lo, Math.min(hi, heardOnset(chans, sr, p, p + g, k, tail)));
        if (q === p) break;
        p = q;
      }
      memo.set(g, p);
    }
    return p;
  };
}

/** A low-passed voicing (spec.lp) loses its notes' fundamentals near and above the cutoff: the gain
 *  that keeps its loudness even across the range (1 / |H(f0)| of the 2-pole low-pass, <= +6 dB). */
function lpCompensation(lp: number | undefined, midi: number): number {
  if (!lp) return 1;
  const r = (440 * Math.pow(2, (midi - 69) / 12)) / lp;
  return Math.min(2, Math.sqrt(1 + r * r * r * r));
}

/** furthest a voicing's tone filters may move a sustained note's beat (s) */
const FILTER_ONSET_MAX = 0.035;

/** Where the whole-note rule puts the beat on an envelope's crossings, smoothed over level bands (as a short note's
 *  onset is, sustainedOnsets): the mean crossing of the 4 dB around -10 dB re its maximum, at most RISE_MAX after
 *  that of the 4 dB around -15 dB — continuous in the envelope, so a plateau near either level cannot flip it */
function bandOnset(c: Crossings, sr: number): number {
  const t = c.top;
  return Math.min(bandMean(c, t + ONSET_DB - SHORT_BAND_DB, t + ONSET_DB + SHORT_BAND_DB), bandMean(c, t + FLOOR_DB - SHORT_BAND_DB, t + FLOOR_DB + SHORT_BAND_DB) + Math.round(RISE_MAX * sr));
}

/**
 * The takes of a sustained note as it plays them, for measuring its onset: the primary take alone, or two takes
 * summed for `width` aligned as widen() aligns them, the second matched to the first's power over the pre-roll
 * and the first 0.5 s after their beat — a fixed window every rendering of the note holds, so its onset does not
 * depend on the rendered length (widen() matches them over the whole rendering, as it always has: the
 * loudness). Returns that window only.
 */
function measuredTakes(a: Rendered, b: Rendered | null, sr: number): Float32Array[] {
  if (!b) {
    const n = Math.min(a.chans[0].length, a.pre + Math.round(ONSET_LOOK * sr));
    if (a.chans.length === 1) return [a.chans[0].slice(0, n)];
    const x = new Float32Array(n);
    const inv = 1 / a.chans.length;
    for (const c of a.chans) for (let i = 0; i < n; i++) x[i] += c[i] * inv;
    return [x];
  }
  const al = alignTakes(a, b);
  const n = al.pre + Math.round(ONSET_LOOK * sr);
  const xa = new Float32Array(n);
  const xb = new Float32Array(n);
  xa.set(a.chans[0].subarray(0, Math.max(0, Math.min(a.chans[0].length, n - al.offA))), al.offA);
  xb.set(b.chans[0].subarray(0, Math.max(0, Math.min(b.chans[0].length, n - al.offB))), al.offB);
  let pa = 0;
  let pb = 0;
  for (let i = 0; i < n; i += 4) {
    pa += xa[i] * xa[i];
    pb += xb[i] * xb[i];
  }
  const kb = pb > 0 ? Math.sqrt(pa / pb) : 0;
  for (let i = 0; i < n; i++) xb[i] *= kb;
  return [xa, xb];
}

function renderZone(spec: SampledSpec, set: StoredSet, sr: number, midi: number, variant: number, lenSec: number, layer: number, gain: number, short = false): Sample {
  const ch = chooseZone(spec, set, midi, variant, layer);
  if (!ch) return { l: new Float32Array(1), r: null };
  const z = ch.zone;
  gain *= lpCompensation(spec.lp, ch.midi);
  let r = renderOne(spec, set, z, ch.midi, ch.cents, sr, lenSec, z.g * gain * ch.gain, short);
  const sustain = spec.kind === 'sustain';
  // spread attacks (strStab) summed from two takes: the beat on the onset of their sum
  let summed = false;
  // sustained notes: the takes as the note plays them (two for `width` sets, aligned on their beats) — what its
  // onset is measured on: its short notes' (Sample.preAt), the beat of two takes summed and of a tone-filtered
  // voicing; `takesDw`: how far the takes' beats sit on the attack of a dwell (ZoneDef.dw, their mean)
  let meas: Float32Array[] | null = null;
  let takesDw = 0;
  let gainAt: ((gate: number) => number) | undefined;
  if (spec.width !== undefined && set.ch.length === 1) {
    const pz = partnerZone(spec, set, ch, layer);
    const b = pz
      ? renderOne(spec, set, pz, ch.midi, ch.cents, sr, lenSec, pz.g * gain * ch.gain, short)
      : renderOne(spec, set, z, ch.midi, ch.cents + 6, sr, lenSec, z.g * gain * ch.gain, short);
    if (sustain && !spec.sumOnset) {
      meas = measuredTakes(r, b, sr);
      takesDw = ((z.dw ?? 0) + ((pz ?? z).dw ?? 0)) / 2;
    }
    const primary = r;
    r = widen(r, b, spec.width);
    if (sustain && !spec.sumOnset) gainAt = takesLoudness(primary, b, r, spec.width, spec.release, sr);
    if (spec.sumOnset) {
      // the beat on the onset of the takes' sum (what is heard), at most SUM_ONSET_MAX from theirs
      const lim = Math.round(SUM_ONSET_MAX * sr);
      r.pre = Math.max(r.pre - lim, Math.min(r.pre + lim, heardOnset(r.chans, sr, r.pre)));
      summed = true;
    }
  } else if (sustain) meas = measuredTakes(r, null, sr);
  const outs = r.chans;
  // the pre-roll before the attack starts from silence: fade in its first <= 1.5 ms (only ever the
  // pre-roll, never the attack), so MP3 pre-echo of an attack right after the zone start cannot step in
  const nPre = Math.min(r.pre, Math.round(0.0015 * sr));
  const shaped = meas ? [...outs, ...meas] : outs;
  for (const o of shaped) for (let i = 0; i < nPre && i < o.length; i++) o[i] *= (i + 0.5) / nPre;
  // A sustained note's beat: the bank's (its perceptual onset, mapped through the playback ratio: a note shifted
  // from its recording plays the same attack faster or slower); two takes summed are aligned on theirs.
  // - A tone-filtered voicing (accChord's high-pass takes the fundamental out of its low notes' attack) is heard
  //   where its filtered attack is: the beat moves by what the filters move the whole-note rule's point on the
  //   note's envelope (bandOnset: smoothed over level bands, so a plateau cannot flip it; the same window before
  //   and after them), at most FILTER_ONSET_MAX.
  // - Two takes summed are heard together and interfere in the attack (a partial cancellation, two reeds
  //   beating): the beat goes on the perceptual onset of what a centred note plays — their sum, after the tone
  //   filters — within SUM_ONSET_MAX and the pre-roll a Sample may carry; less, by their mean dwell weight, for
  //   takes whose beats sit on the attack of a dwell: a sum with such a take is heard where that attack is, not
  //   where its level crossings fall (they swing by tens of ms with the takes' interference and plateau levels).
  const period = spec.unpitched ? 0 : sr / (440 * Math.pow(2, (ch.midi + ch.cents / 100 - 69) / 12));
  const maxPre = Math.round(MAX_PRE_SEC * sr);
  let e: Float64Array | null = null;
  let preOut = r.pre;
  if (meas) {
    const n = meas[0].length;
    e = onsetPower(meas, sr, n, period);
    if (spec.lp || spec.hp) {
      const c0 = crossingsOf(e, n);
      for (const o of meas) {
        if (spec.lp) Biquad.lp(sr, spec.lp, 0.7071).run(o);
        if (spec.hp) Biquad.hp(sr, spec.hp, 0.7071).run(o);
      }
      e = onsetPower(meas, sr, n, period);
      const c1 = crossingsOf(e, n);
      const shift = bandOnset(c1, sr) - bandOnset(c0, sr);
      const lim = Math.round(FILTER_ONSET_MAX * sr);
      if (Number.isFinite(shift)) preOut = Math.max(0, Math.min(Math.max(r.pre, maxPre), r.pre + Math.round(Math.max(-lim, Math.min(lim, shift)))));
    }
    if (meas.length > 1 && takesDw < 1) {
      const lim = Math.round(SUM_ONSET_MAX * sr);
      const move = Math.round((1 - takesDw) * Math.max(-lim, Math.min(lim, perceptualOnset(e, sr, preOut, n).p - preOut)));
      preOut = Math.max(0, Math.min(Math.max(preOut, maxPre), preOut + move));
    }
  }
  // tone shaping
  if (spec.lp) for (const o of outs) Biquad.lp(sr, spec.lp, 0.7071).run(o);
  if (spec.hp) for (const o of outs) Biquad.hp(sr, spec.hp, 0.7071).run(o);
  // optional extra attack ramp (after the onset) and a click-free end; a ringing recording cut at
  // maxLen fades out over its last 0.3 s (a 6 ms cut of a bell still at -20 dB is a click)
  const nA = spec.attack ? Math.round(spec.attack * sr) : 0;
  for (const o of outs) {
    for (let i = 0; i < nA && preOut + i < o.length; i++) o[preOut + i] *= i / nA;
    const nf = r.truncated ? Math.min(o.length >> 2, Math.round(0.3 * sr)) : Math.min(o.length >> 2, Math.round(0.006 * sr));
    if (r.truncated) for (let i = 0; i < nf; i++) o[o.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / nf);
    else for (let i = 0; i < nf; i++) o[o.length - 1 - i] *= i / nf;
  }
  // short notes of summed spread attacks: their own onsets (read from the finished channels); short notes of
  // sustained instruments on the same criterion as a whole note, relative to their own peak (sustainedOnsets)
  // (sustained notes keep the gate anchor of their audio wherever their beat is placed)
  const ga = sustain ? Math.max(0, r.ga) : undefined;
  const preAt = summed && !spec.ring ? shortOnsets(outs, sr, preOut, spec.release) : e && ga !== undefined ? sustainedOnsets(e, sr, preOut, ga, spec.release) : undefined;
  return { l: outs[0], r: outs.length > 1 ? outs[1] : null, pre: preOut, preAt, ga, take0: r.take0 ?? 0, gainAt };
}

/** test hook: the zone a note would use (measurement scripts) */
export function debugChoice(
  id: string,
  midi: number,
  variant: number,
  layer: number,
): { set: string; zone: ZoneDef; midi: number; cents: number; gain: number; fold: number; partner: ZoneDef | null } | null {
  const real = INSTRUMENT_ALIASES[id] ?? id;
  const spec = SAMPLED_SPECS.find((s) => s.id === real);
  if (!spec) return null;
  const set = bank.get(spec.set);
  if (!set) return null;
  const c = chooseZone(spec, set, midi, variant, layer);
  if (!c) return null;
  const partner = spec.width !== undefined && set.ch.length === 1 ? partnerZone(spec, set, c, layer) : null;
  return { set: spec.set, zone: c.zone, midi: c.midi, cents: c.cents, gain: c.gain, fold: c.fold, partner };
}

export const SAMPLED_IDS = (): string[] => SAMPLED_SPECS.map((s) => s.id);
void clamp;
