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
 * perceptual onset), mapped through the playback ratio — for two takes summed (`width`) the
 * perceptual onset of their sum — and for a short note its own (`preAt`).
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
   *  zones keep at most 80 ms of their build-up before the beat (the build's SUS_MAX_PRE) */
  fi?: number;
  /** gate anchor (sustained zones whose beat `pre` is not their attack model's beat): a note's gate
   *  counts from here — the point the songs' note lengths and the loudness calibration were made
   *  against — while `pre`, its perceptual onset, is what goes on the beat (default `pre`) */
  ga?: number;
  /** dwell weight (sustained zones): how far the beat moved from the -10 dB point onto the attack of
   *  an envelope that dwells below it (the build's perceptual_onset `w`, 0..1; default 0) */
  dw?: number;
  /** crescendo roll: swell length (samples from the beat to the peak the roll holds, its loop start) and
   *  depth (dB at the beat re that peak). A roll note is made for its length (InstDef.swellOf): a note
   *  shorter than the swell is entered that much before the peak that its gate ends on it, a longer one
   *  plays the whole swell under a gain ramp, so it grows at depth / its length (renderOne). Either way
   *  the roll is at its loudest when its gate ends, on the downbeat it swells into */
  sw?: number;
  sd?: number;
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
  // (gate 1: a roll, variant 1, swells into its written end, the downbeat — its peak is there, not 10 %
  // of the note earlier with the release under way)
  S('cymbal', 'cymbal', 'perc', 0.6, { gate: 1, unpitched: true, variants: 2, rr: 'art', layers: [0.7], gainDb: 5.1 }),
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
  // (only a set with a crescendo roll makes samples per note length)
  const swells = set.def.zones.some(isSwell);
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
    swellOf(midi: number, variant: number, layer: number): boolean {
      if (!swells) return false;
      const c = chooseZone(spec, set, midi, variant, layer);
      return !!c && isSwell(c.zone);
    },
    make(sr: number, midi: number, variant: number, lenSec: number, layer = 0, art = 0, gateSec = 0): Sample {
      try {
        return renderZone(spec, set, sr, midi, variant, lenSec, layer, gain, art === 1 && !!spec.short, gateSec);
      } catch {
        return { l: new Float32Array(Math.max(1, Math.round(0.05 * sr))), r: null };
      }
    },
  };
  return def;
}

/** a crescendo roll zone (ZoneDef.sw / sd): looped on its peak, the swell before it */
const isSwell = (z: ZoneDef): boolean =>
  z.sw !== undefined && z.sw > 0 && z.sd !== undefined && z.sd < 0 && z.ls !== undefined && z.le !== undefined && z.le - z.ls > 16 && z.sw <= z.ls;

/** fade-in of a roll note entered mid-swell (s): the zone's own entry fade (the build's Cand.fade_in) */
const SWELL_FADE = 0.03;

/**
 * A crescendo roll made for a note gated after `gSrc` zone samples (renderOne): where to enter the zone
 * and the gain ramp to play it under. A note shorter than the swell enters it sw - gSrc after its start
 * (so its gate ends on the peak; the zone's pre-roll and a SWELL_FADE fade-in in front of its beat, as at
 * the zone's own start); a longer note plays the whole swell, slowed by a gain ramp (dB, by zone sample
 * after the beat t: sd·t·(1/sw - 1/gSrc) up to the peak, then sd·(1 - t/gSrc) up to the gate end) so it
 * grows evenly at sd / its length and reaches the peak as its gate ends.
 */
function swellEntry(z: ZoneDef, gSrc: number): { from: number; ramp: ((t: number) => number) | null; until: number } {
  const sw = z.sw as number;
  const sd = z.sd as number;
  if (!(gSrc > 0)) return { from: 0, ramp: null, until: 0 };
  if (gSrc < sw) return { from: Math.round(sw - gSrc), ramp: null, until: 0 };
  const k1 = sd * (1 / sw - 1 / gSrc);
  return { from: 0, ramp: (t: number) => (t <= 0 ? 0 : t <= sw ? k1 * t : t < gSrc ? sd * (1 - t / gSrc) : 0), until: z.pre + Math.ceil(gSrc) };
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
 *  short: the short articulation (sustained zones): enter at the loop start with a fast fade-in.
 *  gateSec: a crescendo roll (ZoneDef.sw) made for a note of that gate: entered / ramped so its gate
 *  ends on the roll's peak (swellEntry; 0 = the whole zone as built). */
function renderOne(spec: SampledSpec, set: StoredSet, z: ZoneDef, midi: number, cents: number, sr: number, lenSec: number, g: number, short = false, gateSec = 0): Rendered {
  const shift = (spec.unpitched ? 0 : midi - z.p) + cents / 100;
  const pitchRatio = Math.pow(2, shift / 12);
  const inc = (pitchRatio * set.sr) / sr; // source samples per output sample
  const looped = z.ls !== undefined && z.le !== undefined && z.le - z.ls > 16;
  if (short && looped) return renderShort(set, z, midi, pitchRatio, inc, sr, lenSec, g);
  // (the gate in zone samples: output samples × inc)
  const se = gateSec > 0 && isSwell(z) ? swellEntry(z, gateSec * sr * inc) : null;
  const from = se ? se.from : 0;
  const nFin = from > 0 ? Math.max(8, Math.round(SWELL_FADE * set.sr * pitchRatio)) : 0;
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
    const tmp = unroll(set, z, c, nSrc, from);
    // a slow swell entered late (sustained pre-roll cap): its kept build-up fades in
    if (z.fi && !from) for (let i = 0; i < z.fi && i < tmp.length; i++) tmp[i] *= 0.5 - 0.5 * Math.cos((Math.PI * (i + 0.5)) / z.fi);
    // a roll note entered mid-swell: fades in like the zone's own start (its beat z.pre into the read)
    for (let i = 0; i < nFin && i < tmp.length; i++) tmp[i] *= 0.5 - 0.5 * Math.cos((Math.PI * (i + 0.5)) / nFin);
    // a roll note longer than the swell: grows at the slower rate its length gives
    if (se && se.ramp) for (let i = z.pre + 1; i < se.until && i < tmp.length; i++) tmp[i] *= Math.pow(10, se.ramp(i - z.pre) / 20);
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

/** furthest apart two summed takes' beats may be (s): further, the second is moved towards the first */
const TAKES_ALIGN_MAX = 0.015;

/**
 * Where two takes summed for `width` start (output samples) and the beat and gate anchor of their sum.
 * They are aligned on their gate anchors (Rendered.ga), as the songs' balance was set with (two
 * coherent takes realigned by a few ms sum louder or softer), unless their beats — their perceptual
 * onsets — would then be more than TAKES_ALIGN_MAX apart: the second take is moved that close (an
 * ensemble attack, not two). The sum's beat and gate anchor are the means of the takes'.
 */
function alignTakes(a: Rendered, b: Rendered, sr: number): { offA: number; offB: number; pre: number; ga: number } {
  const lim = Math.round(TAKES_ALIGN_MAX * sr);
  const da = a.pre - a.ga;
  const db = b.pre - b.ga;
  // b's anchor goes `sh` after a's
  const sh = da - db > lim ? da - db - lim : db - da > lim ? da - db + lim : 0;
  const A0 = Math.max(a.ga, b.ga - sh);
  return { offA: A0 - a.ga, offB: A0 + sh - b.ga, pre: A0 + Math.round((da + sh + db) / 2), ga: A0 + Math.round(sh / 2) };
}

/**
 * Mono sets with `width`: the left channel plays the chosen recording, the right one another take
 * or the neighbouring recording at the same pitch (aligned by alignTakes); rotated to the target
 * correlation and normalised to the power of one channel (a centred note keeps its loudness). The
 * sum's beat is the mean of the takes' (renderZone then places it on the sum's onset).
 */
function widen(a: Rendered, b: Rendered, width: number, sr: number): Rendered {
  const al = alignTakes(a, b, sr);
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

/** furthest the summed takes' onset may move the beat from the takes' own (s) */
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
 * the perceptual onset the build places each take's beat on, measured on what is heard.
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

// Perceptual onset of a sustained note: the same criterion as the bank build
// (scripts/audio/instrument_dsp.py perceptual_onset, build_instruments.sustain_beat), here for what a
// note of a `width` set plays — two takes summed, whose attacks can partly cancel or smear.
const ONSET_DB = -10;
const ONSET_LOOK = 0.5;
/** dB per ms: an envelope that climbs its last X dB below the threshold slower than this dwells */
const DWELL_SLOPE = 0.1;
const DWELL_X = [1.5, 2, 3, 4, 5, 6, 8, 10];
const DWELL_BLEND0 = 0.75;
const DWELL_BLEND1 = 1.5;
const DWELL_PLATEAU = 0.1;

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
 * The perceptual onset (sample index: the end of the trailing 5 ms window that reaches it) on the
 * power envelope `e` (onsetPower), from a first guess `pre`: the first point within 10 dB of the
 * maximum over the next 0.5 s (the attack suite's att10 = 0; `top` = a fixed end of the window for the
 * maximum instead, so the result does not depend on how long the sample is) — or, for a note that dwells
 * below that threshold (its last X dB, X = 1.5..10, climbed slower than DWELL_SLOPE: an attack onto a
 * plateau, then a slow crescendo), its attack: the -10 dB point relative to that plateau, blended in over
 * the dwell ratios DWELL_BLEND0..1 (instrument_dsp.perceptual_onset documents the criterion).
 */
export function perceptualOnset(e: Float64Array, sr: number, pre: number, top = 0): { p: number; p10: number; dwell: number; w: number } {
  const N = e.length;
  if (N < 2) return { p: pre, p10: pre, dwell: 0, w: 0 };
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
    if (M <= 0) return { p: pre, p10: pre, dwell: 0, w: 0 };
    const q = firstGe(M * Math.pow(10, ONSET_DB / 10), n);
    if (q === p || top > 0) {
      p = q;
      break;
    }
    p = q;
  }
  M = top > 0 ? fixedM : maxTo(Math.min(N, p + look));
  const dB = new Float64Array(p);
  for (let i = 0; i < p; i++) dB[i] = 10 * Math.log10(e[i] / M + 1e-20);
  let ratio = 0;
  let td = 0;
  for (const X of DWELL_X) {
    let tx = p;
    for (let i = 0; i < p; i++)
      if (dB[i] >= ONSET_DB - X) {
        tx = i + 1;
        break;
      }
    if (tx < p) {
      const r = (p - tx) / (((X / DWELL_SLOPE) * sr) / 1000);
      if (r > ratio) {
        ratio = r;
        td = tx;
      }
    }
  }
  const w = Math.min(1, Math.max(0, (ratio - DWELL_BLEND0) / (DWELL_BLEND1 - DWELL_BLEND0)));
  if (w <= 0) return { p, p10: p, dwell: ratio, w: 0 };
  const hi = Math.min(p, td + Math.round(DWELL_PLATEAU * sr));
  const lv: number[] = [];
  for (let i = td - 1; i < Math.max(td, hi); i++) lv.push(dB[i]);
  lv.sort((x, y) => x - y);
  // the median as numpy takes it (mean of the two middle values of an even count)
  const lp = lv.length % 2 ? lv[lv.length >> 1] : 0.5 * (lv[lv.length / 2 - 1] + lv[lv.length / 2]);
  let q = p;
  for (let i = 0; i < p; i++)
    if (dB[i] >= lp + ONSET_DB) {
      q = i + 1;
      break;
    }
  return { p: Math.round(p - w * (p - q)), p10: p, dwell: ratio, w };
}

/** perceptualOnset of a note as the mixer plays it when gated short: `x` (its mono sum) at full level
 *  up to `cut`, then the release decay (factor k per sample), first n samples */
function gatedOnset(x: Float32Array, sr: number, pre: number, cut: number, k: number, n: number, period: number): number {
  const y = x.slice(0, n);
  let env = 1;
  for (let i = Math.max(0, cut); i < n; i++) {
    env *= k;
    y[i] *= env;
  }
  return perceptualOnset(onsetPower([y], sr, n, period), sr, pre, n).p;
}

/**
 * Short notes of spread / slow attacks: a note gated while its attack is still rising peaks lower,
 * so its own onset sits earlier in the sample than the whole note's. Returns gate (output samples) →
 * onset index (memoised; within [lo, hi]: SHORT_ONSET_MAX around `pre` by default).
 * sumOnset sets: the note is cut `gate` samples after the onset it starts on — the fixed point
 * p = onset(the note cut at p + gate), on the 5 ms RMS -10 dB point. Sustained notes (`anchor`: their
 * gate counts from Sample.ga): the note cut at anchor + gate is what plays, measured with
 * perceptualOnset (`period`: its envelope window).
 */
function shortOnsets(chans: Float32Array[], sr: number, pre: number, release: number, lo = pre - Math.round(SHORT_ONSET_MAX * sr), hi = pre + Math.round(SHORT_ONSET_MAX * sr), period = 0, anchor = -1): (gate: number) => number {
  const rel = Math.max(0.001, release);
  const k = Math.exp(-1 / (rel * sr));
  const tail = Math.round(MIX_TAIL_TAU * rel * sr);
  const whole = Math.round(0.5 * sr);
  const memo = new Map<number, number>();
  // sustained (anchor): the note's mono sum, shared by every gate
  let x: Float32Array | null = null;
  return (gate: number): number => {
    const g = Math.max(1, Math.round(gate));
    if (!(g < whole)) return pre;
    let p = memo.get(g);
    if (p === undefined) {
      if (anchor >= 0) {
        if (!x) {
          const len = Math.min(chans[0].length, Math.max(pre, anchor + whole) + whole + tail);
          x = new Float32Array(len);
          const inv = 1 / chans.length;
          for (const c of chans) for (let i = 0; i < len; i++) x[i] += c[i] * inv;
        }
        const cut = anchor + g;
        const n = Math.min(x.length, cut + tail, Math.max(pre, cut) + whole);
        p = Math.max(lo, Math.min(hi, gatedOnset(x, sr, pre, cut, k, n, period)));
      } else {
        p = pre;
        for (let it = 0; it < 12; it++) {
          const q = Math.max(lo, Math.min(hi, heardOnset(chans, sr, p, p + g, k, tail)));
          if (q === p) break;
          p = q;
        }
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

/**
 * Two takes as a centred note plays them, for measuring its beat: aligned as widen() aligns them and
 * summed, the second matched to the first's power over the pre-roll and the first 0.5 s after their
 * beat — a fixed window every rendering of the note holds, so the beat does not depend on the
 * rendered length (widen() matches them over the whole rendering, as it always has: the loudness).
 * Returns that window only.
 */
function sumForOnset(a: Rendered, b: Rendered, sr: number): Float32Array {
  const al = alignTakes(a, b, sr);
  // (every rendering holds each take up to its beat + 0.5 s)
  const n = Math.min(al.offA + a.pre, al.offB + b.pre) + Math.round(ONSET_LOOK * sr);
  const xa = new Float32Array(n);
  const xb = new Float32Array(n);
  xa.set(a.chans[0].subarray(0, Math.max(0, n - al.offA)), al.offA);
  xb.set(b.chans[0].subarray(0, Math.max(0, n - al.offB)), al.offB);
  let pa = 0;
  let pb = 0;
  for (let i = 0; i < n; i += 4) {
    pa += xa[i] * xa[i];
    pb += xb[i] * xb[i];
  }
  const kb = pb > 0 ? Math.sqrt(pa / pb) : 0;
  for (let i = 0; i < n; i++) xa[i] += kb * xb[i];
  return xa;
}

function renderZone(spec: SampledSpec, set: StoredSet, sr: number, midi: number, variant: number, lenSec: number, layer: number, gain: number, short = false, gateSec = 0): Sample {
  const ch = chooseZone(spec, set, midi, variant, layer);
  if (!ch) return { l: new Float32Array(1), r: null };
  const z = ch.zone;
  gain *= lpCompensation(spec.lp, ch.midi);
  let r = renderOne(spec, set, z, ch.midi, ch.cents, sr, lenSec, z.g * gain * ch.gain, short, gateSec);
  // spread attacks (strStab) summed from two takes: the beat on the onset of their sum
  let summed = false;
  // sustained notes of `width` sets: the takes' dwell weight and what the beat is measured on — their
  // centred sum with the second take matched to the first over a fixed window (sumForOnset: the played
  // sample matches them over its whole length, as it always has, for its loudness; the beat must not
  // depend on how long the note is rendered)
  let an: Float32Array[] | null = null;
  let takesDwell = 0;
  if (spec.width !== undefined && set.ch.length === 1) {
    const pz = partnerZone(spec, set, ch, layer);
    const b = pz
      ? renderOne(spec, set, pz, ch.midi, ch.cents, sr, lenSec, pz.g * gain * ch.gain, short)
      : renderOne(spec, set, z, ch.midi, ch.cents + 6, sr, lenSec, z.g * gain * ch.gain, short);
    if (spec.kind === 'sustain' && !short && !spec.sumOnset) {
      takesDwell = Math.max(z.dw ?? 0, (pz ?? z).dw ?? 0);
      an = [sumForOnset(r, b, sr)];
    }
    r = widen(r, b, spec.width, sr);
    if (spec.sumOnset) {
      // the beat on the onset of the takes' sum (what is heard), at most SUM_ONSET_MAX from theirs
      const lim = Math.round(SUM_ONSET_MAX * sr);
      r.pre = Math.max(r.pre - lim, Math.min(r.pre + lim, heardOnset(r.chans, sr, r.pre)));
      summed = true;
    }
  }
  const outs = r.chans;
  const shaped = an ? [...outs, ...an] : outs;
  // the pre-roll before the attack starts from silence: fade in its first <= 1.5 ms (only ever the
  // pre-roll, never the attack), so MP3 pre-echo of an attack right after the zone start cannot step in
  const nPre = Math.min(r.pre, Math.round(0.0015 * sr));
  for (const o of shaped) for (let i = 0; i < nPre && i < o.length; i++) o[i] *= (i + 0.5) / nPre;
  // tone shaping
  if (spec.lp) for (const o of shaped) Biquad.lp(sr, spec.lp, 0.7071).run(o);
  if (spec.hp) for (const o of shaped) Biquad.hp(sr, spec.hp, 0.7071).run(o);
  // A single take keeps the bank's beat (its perceptual onset, mapped through the playback ratio: a
  // note shifted from its recording plays the same attack faster or slower). Two takes summed (aligned
  // by widen(): their beat is the mean of the takes') are heard together and can interfere in the
  // attack (a partial cancellation, two reeds beating): the beat goes on the perceptual onset of what a
  // centred note plays — their sum, after the tone filters — within SUM_ONSET_MAX and the pre-roll a
  // Sample may carry. Takes whose beats sit on the attack of a dwell keep them (by that weight, ZoneDef
  // dw): bow attacks onto plateaus sum to an envelope whose -10 dB point is not where they are heard.
  const maxPre = Math.round(MAX_PRE_SEC * sr);
  const period = spec.unpitched ? 0 : sr / (440 * Math.pow(2, (ch.midi + ch.cents / 100 - 69) / 12));
  let preOut = r.pre;
  if (an && takesDwell < 1) {
    const lim = Math.round(SUM_ONSET_MAX * sr);
    const x = an[0];
    const on = perceptualOnset(onsetPower(an, sr, x.length, period), sr, r.pre, x.length).p;
    const move = Math.round((1 - takesDwell) * Math.max(-lim, Math.min(lim, on - r.pre)));
    preOut = Math.max(0, Math.min(Math.max(r.pre, maxPre), r.pre + move));
  }
  // optional extra attack ramp (after the onset) and a click-free end; a ringing recording cut at
  // maxLen fades out over its last 0.3 s (a 6 ms cut of a bell still at -20 dB is a click)
  const nA = spec.attack ? Math.round(spec.attack * sr) : 0;
  for (const o of outs) {
    for (let i = 0; i < nA && preOut + i < o.length; i++) o[preOut + i] *= i / nA;
    const nf = r.truncated ? Math.min(o.length >> 2, Math.round(0.3 * sr)) : Math.min(o.length >> 2, Math.round(0.006 * sr));
    if (r.truncated) for (let i = 0; i < nf; i++) o[o.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / nf);
    else for (let i = 0; i < nf; i++) o[o.length - 1 - i] *= i / nf;
  }
  // short notes of summed spread attacks: their own onsets (read from the finished channels); short
  // notes of sustained instruments the same (on what the beat is measured on), anywhere in their
  // pre-roll (a slow attack cut short is all build-up: its own onset can be where it emerges), never
  // later than the whole note's
  // (sustained notes keep the gate anchor of their audio wherever their beat is placed)
  const ga = spec.kind === 'sustain' ? Math.max(0, r.ga) : undefined;
  const preAt = summed && !spec.ring ? shortOnsets(outs, sr, preOut, spec.release) : ga !== undefined ? shortOnsets(an ?? outs, sr, preOut, spec.release, 0, preOut, period, ga) : undefined;
  return { l: outs[0], r: outs.length > 1 ? outs[1] : null, pre: preOut, preAt, ga, take0: r.take0 ?? 0 };
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
