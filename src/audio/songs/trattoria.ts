/**
 * TRATTORIA (stage 2, "La Trattoria": a candle-lit dining room at night) — the Brindisi
 * "Libiamo ne' lieti calici" from Verdi's La Traviata (1853, public domain), played as a festive,
 * slightly tipsy toast at the table.
 *
 * B♭ major (Verdi's key), 3/8, ♩. = 69: a one-in-a-bar fast waltz. 1 step = a triplet sixteenth,
 * so a bar is 9 steps, an eighth 3; the verse turns sit on that grid exactly as the reference
 * performance plays them, the chorus turns are straight sixteenths (1.5 steps).
 *
 * Accordion (Alfredo) and violin (Violetta) trade the verse, then sing it together; the chorus
 * "Ah! libiam" is the whole band. Upright bass "oom", guitar / pizzicato / accordion left-hand
 * "pa-pa", clarinet answers in the chalumeau, triangle (and glockenspiel) glass clinks, tambourine.
 *
 * Form (bars): intro(4) V1(20, accordion solo) V2(20, violin solo) C1(18, chorus tutti)
 *              brk(4, the band stops, a tipsy clarinet) V3(20, duet) C2(18, grand chorus) → loop to V1.
 * Melodies are proven against the references with scripts/music/compare.py: docs/music/trattoria.md.
 */
import { comp, drums, hits, mel, type Part, type SongDef } from '../sequencer';

// ---------------------------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------------------------

/**
 * Verse "Libiamo, libiamo ne' lieti calici… e la fuggevol ora s'inebrii a voluttà": LOTRO
 * lotro_brindisi.abc X:24 bars 3–21, a fourth up (F → B♭). That performance's rubato cadenza
 * (its bars 18–21 = bars 16–19 here) is written in strict time as the clean cadence the chorus
 * uses: turn on the third, turn on the second, tonic. 19 bars; the pickup ("Li-") is the last
 * eighth of the bar before.
 */
const VERSE = `
  D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  F5:9 | _:3 Eb5:3 D5:3 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  C5:6 Bb4:3 | F4:3 r:3 F4:3 |
  D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  G5:9 | _:3 F5:3 Eb5:3 | D5:2 r:1 Eb5:1 D5:1 C#5:1 D5:2 Eb5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  Bb4:3 r:6 |`;

/** Violetta's verse (V2, and the top voice of the duet): the same tune with slides into the long notes. */
const VERSE_VLN = `
  {C5}D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  {E5}F5:9 | _:3 Eb5:3 D5:3 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  C5:6 Bb4:3 | F4:3 r:3 F4:3 |
  {C5}D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  {F#5}G5:9 | _:3 F5:3 Eb5:3 | D5:2 r:1 Eb5:1 D5:1 C#5:1 D5:2 Eb5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  Bb4:3 r:6 |`;

/** Alfredo's second voice for the duet (V3): thirds below the tune, sixths where thirds would clash. */
const VERSE_DUET = `
  Bb4:9 | _:3 D4:2 r:1 Bb4:2 r:1 | Bb4:2 r:1 D4:2 r:1 Bb4:2 r:1 | Bb4:2 C5:1 Bb4:1 A4:2 C5:3 |
  D5:9 | _:3 C5:3 Bb4:3 | A4:2 r:1 Bb4:1 A4:1 G#4:1 A4:2 Bb4:1 | A4:2 r:1 Bb4:1 A4:1 G#4:1 A4:2 Bb4:1 |
  F4:6 D4:3 | D4:3 r:3 D4:3 |
  Bb4:9 | _:3 D4:2 r:1 Bb4:2 r:1 | Bb4:2 r:1 D4:2 r:1 Bb4:2 r:1 | Bb4:2 C5:1 Bb4:1 A4:2 C5:3 |
  Bb4:9 | _:6 G4:3 | Bb4:2 r:1 C5:1 Bb4:1 A4:1 Bb4:2 C5:1 | A4:2 r:1 Bb4:1 A4:1 G#4:1 A4:2 Bb4:1 |
  D4:3 r:6 |`;

/** Chorus "Ah! libiam, amor fra' calici più caldi baci avrà": bb_libiamo.abc soprano, bars 1–9. */
const CHORUS = `
  r:3 D5:6 | _:3 F5:3 Eb5:3 | D5:3 D5:1.5 C#5:1.5 D5:1.5 Eb5:1.5 | C5:3 C5:1.5 B4:1.5 C5:1.5 D5:1.5 |
  Bb4:3 D5:6 | _:3 F5:3 Eb5:3 | D5:3 D5:1.5 C#5:1.5 D5:1.5 Eb5:1.5 | C5:3 C5:1.5 B4:1.5 C5:1.5 D5:1.5 |
  Bb4:6 r:3 |`;
/** the same chorus ending on the pickup into the verse (the loop seam) */
const CHORUS_TO_VERSE = CHORUS.replace(/Bb4:6 r:3 \|\s*$/, 'Bb4:6 F4:3 |');
/** alto line of the same arrangement (bars 1–9): sixths under the tune */
const CHORUS_ALTO = `
  r:3 Bb4:6 | _:3 Ab4:3 G4:3 | F4:3 F4:1.5 E4:1.5 F4:1.5 G4:1.5 | Eb4:3 Eb4:1.5 D4:1.5 Eb4:1.5 F4:1.5 |
  D4:3 Bb4:6 | _:3 Ab4:3 G4:3 | F4:3 F4:1.5 E4:1.5 F4:1.5 G4:1.5 | Eb4:3 Eb4:1.5 D4:1.5 Eb4:1.5 F4:1.5 |
  D4:6 r:3 |`;
/** the horns: the tune's long notes an octave down (tenor of the arrangement, turns left out) */
const CHORUS_HORN = `
  r:3 D4:6 | _:3 F4:3 Eb4:3 | D4:9 | C4:8 r:1 | Bb3:3 D4:6 | _:3 F4:3 Eb4:3 | D4:9 | C4:8 r:1 | Bb3:6 r:3 |`;

// ---------------------------------------------------------------------------------------------
// Harmony and accompaniment
// ---------------------------------------------------------------------------------------------

/**
 * Verse: the reference accompaniment's tonic (bars 1–6, 9–14), V7 under the turns, IV under the
 * high G, cadential 6/4. Two passing chords take the edge off the tune's upbeat E♭ (it would rub
 * against the D of a tonic "pa"): V7 on the last eighth of bars 4 and 14, a neighbour IV6/4 in bar 6.
 */
const VERSE_CH =
  'Bb:9 | Bb:9 | Bb:9 | Bb:6 F7:3 | Bb:9 | Bb:3 Eb/Bb:3 Bb:3 | F7:9 | F7:9 | Bb:9 | Bb:9 | ' +
  'Bb:9 | Bb:9 | Bb:9 | Bb:6 F7:3 | Eb:9 | Eb:9 | Bb/F:9 | F7:9 | Bb:9 | F7:9';
/** Chorus: the SATB arrangement's harmony (V7/IV → IV, cadential 6/4, V4/2 → I6), twice */
const CHORUS_CH9 = 'Bb:9 | Bb:3 Bb7/Ab:3 Eb/G:3 | Bb/F:9 | F7/Eb:9 | Bb/D:3 Bb:6 | Bb:3 Bb7/Ab:3 Eb/G:3 | Bb/F:9 | F7/Eb:9 | Bb/D:6 F7:3';
const CHORUS_CH = CHORUS_CH9 + ' | ' + CHORUS_CH9;

/** upright bass "oom" (one per bar) with inversions and leading-tone approaches */
const VERSE_BASS = `
  Bb2:6 r:3 | F2:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | D3:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | C3:3 r:3 A2:3 |
  Bb2:6 r:3 | F2:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | Eb2:6 r:3 | G2:6 r:3 |
  F2:6 r:3 | F2:3 r:3 A2:3 | Bb2:6 r:3 | F2:6 r:3 |`;
/** chorus bass: the SATB bass, a stepwise descent B♭–A♭–G–F–E♭–D */
const CHORUS_BASS9 = `
  Bb2:6 r:3 | Bb2:3 Ab2:3 G2:3 | F2:6 r:3 | Eb2:6 r:3 | D2:6 r:3 | Bb2:3 Ab2:3 G2:3 | F2:6 r:3 | Eb2:6 r:3 | D2:3 r:3 F2:3 |`;
const CHORUS_BASS = CHORUS_BASS9 + CHORUS_BASS9;

/** "pa-pa" on the second and third eighths (the second "pa" a little lighter: OOM-pa-pa) */
const PAPA = 'r:3 c:3 c:3';
const WALTZ = { 6: 0.86 };

const TAMB = {
  X: { v: 0.95, vr: [4, 5] },
  x: { v: 0.62, vr: [0, 1] },
  s: { v: 0.5, vr: [2, 3] },
  R: { v: 0.7, vr: [6, 7] },
};
/** tambourine on the triplet grid (one char per step) and on sixteenths (stepDiv 2/3) */
const TAMB_LIGHT = 'x..s..s..';
const TAMB_MID = 'X..s..x..';
const TAMB_16 = 'X s x s x s';

/** glass clinks: [bar (0-based), eighth (0..2), velocity, double?] → triangle hits */
const clinks = (ch: string, list: Array<[number, number, number, boolean?]>): Part =>
  hits(
    ch,
    list.flatMap(([bar, e, v, dbl]): Array<[number, number, number]> => {
      const s = bar * 9 + e * 3;
      return dbl ? [[s, 60, v], [s + 1, 60, v * 0.8]] : [[s, 60, v]];
    }),
  );

/** clarinet answers under Violetta's long notes, then a run into the chorus */
const CLAR_V2 = `
  r:3 Bb3:3 D4:3 | F4:3 r:6 | r:9 | r:9 |
  r:3 D4:3 F4:3 | Bb4:3 r:6 | r:9 | r:9 | r:9 | r:9 |
  r:3 F4:3 D4:3 | Bb3:3 r:6 | r:9 | r:9 |
  r:3 Eb4:3 G4:3 | Bb4:3 r:6 | r:9 | r:9 |
  r:3 F4:1 G4:1 A4:1 Bb4:1 C5:1 D5:1 | Eb5:2 r:1 C5:2 r:1 A4:3 |`;
/** duet: sixteenth arpeggios under the long notes, then the run into the grand chorus */
const CLAR_V3 = `
  r:9 | r:9 | r:9 | r:9 |
  r:3 F3:1.5 Bb3:1.5 D4:1.5 F4:1.5 | Bb4:3 r:6 | r:9 | r:9 | r:9 | r:9 |
  r:9 | r:9 | r:9 | r:9 |
  r:3 G3:1.5 Bb3:1.5 Eb4:1.5 G4:1.5 | Bb4:3 r:6 | r:9 | r:9 |
  r:3 D4:1.5 F4:1.5 Bb4:1.5 D5:1.5 | C5:1.5 A4:1.5 F4:1.5 Eb4:1.5 C4:1.5 A3:1.5 |`;

/** only the notes of a part whose written length is in [lo, hi] steps (grace notes go with the long ones) */
const durRange =
  (p: Part, lo: number, hi = Infinity): Part =>
  (ctx) =>
    p(ctx).filter((e) => (e.grace ? lo > 0 : e.d >= lo && e.d <= hi));
/**
 * The solo violin sample speaks slowly (half level only after ~90 ms), so in the turns each
 * short note would drown in the tail of the note before: eighths get a shorter gate, the
 * (triplet) sixteenths a firmer bow and a shorter gate (they outgrow the decaying tail). Where the
 * violin leads, the sections also add a mandolin in unison: its pluck marks every note of the
 * turns, and it plays tremolo on the long notes.
 */
const violinLine = (ch: string, str: string, vel: number, oct = 0): Part[] => [
  durRange(mel(ch, str, { vel, oct }), 4),
  durRange(mel(ch, str, { vel: vel * 1.05, gate: 0.72, oct }), 2, 3),
  durRange(mel(ch, str, { vel: vel * 1.4, gate: 0.85, oct }), 0.5, 1.5),
];

/** pickup "Li-" on the last eighth of a section's final bar */
const pickup = (ch: string, bars: number, note = 'F4', vel = 0.8): Part => mel(ch, `r:6 ${note}:3 |`, { at: (bars - 1) * 9, vel });

// ---------------------------------------------------------------------------------------------
// Song
// ---------------------------------------------------------------------------------------------

export const trattoria: SongDef = {
  id: 'trattoria',
  bpm: 69,
  stepsPerBeat: 9,
  barSteps: 9,
  scale: 'Bb major',
  gainDb: -0.1,
  humanize: 0.005,
  reverb: { rt60: 1.4, size: 0.95, damp: 0.5, predelay: 0.016, er: 0.34, hp: 260, lp: 7600, wet: 1.4 },
  channels: {
    acc: { inst: 'accordion', gain: -3, pan: -0.12, send: 0.18 },
    vln: { inst: 'violin', gain: -1.5, pan: 0.18, send: 0.24 },
    accH: { inst: 'accordion', gain: -8, pan: -0.24, send: 0.2 },
    clar: { inst: 'clarinet', gain: -7, pan: -0.32, send: 0.22 },
    accC: { inst: 'accChord', gain: -11, pan: -0.2, send: 0.12, hum: 0.5 },
    gtr: { inst: 'guitar', gain: -9, pan: 0.36, send: 0.14, hum: 0.6 },
    pizz: { inst: 'pizz', gain: -11, pan: -0.38, send: 0.16, hum: 0.6 },
    bass: { inst: 'uprightBass', gain: -3, pan: 0, send: 0.06, hum: 0.5 },
    horn: { inst: 'horn', gain: -10, pan: -0.05, send: 0.3, hum: 0.3 },
    flute: { inst: 'flute', gain: -13, pan: 0.25, send: 0.26 },
    mand: { inst: 'mandolin', gain: -9, pan: -0.28, send: 0.2 },
    tri: { inst: 'triangleInst', gain: -9, pan: 0.42, send: 0.25, hum: 0.4 },
    glock: { inst: 'glock', gain: -12, pan: 0.45, send: 0.3, hum: 0.3 },
    tamb: { inst: 'tamb', gain: -2, pan: 0.3, send: 0.1, hum: 0.6 },
    timp: { inst: 'timpani', gain: -10, pan: 0.05, send: 0.2, hum: 0 },
    cym: { inst: 'cymbal', gain: -16, pan: 0.2, send: 0.25, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: 'Bb:9 | Bb:9 | F7:9 | F7:9',
      parts: [
        mel('bass', 'Bb2:6 r:3 | D3:6 r:3 | F2:6 r:3 | C3:3 r:3 A2:3 |', { vel: 0.85 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'D3', hi: 'F4', n: 3, vel: 0.7, strum: 0.012, gate: 0.55 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'D4', n: 2, vel: 0.6, from: 2 }),
        comp('accC', PAPA, { accent: WALTZ, lo: 'F3', hi: 'F4', n: 3, vel: 0.6, gate: 0.6 }),
        clinks('tri', [[0, 1, 0.8], [0, 2, 0.7]]),
        mel('clar', 'r:9 | r:3 D4:1.5 F4:1.5 Bb4:1.5 D5:1.5 | F5:3 Eb5:1.5 D5:1.5 C5:3 | A4:3 r:6 |', { vel: 0.9 }),
        drums('tamb', TAMB_LIGHT, TAMB, { vel: 0.9, from: 2 }),
        pickup('acc', 4, 'F4', 0.78),
      ],
    },
    // Alfredo: the accordion's right hand sings, a guitar strums the pa-pa
    V1: {
      bars: 20,
      chords: VERSE_CH,
      parts: [
        mel('acc', VERSE + 'r:9 |', { vel: 0.84 }),
        mel('bass', VERSE_BASS, { vel: 0.8 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'D3', hi: 'F4', n: 3, vel: 0.6, strum: 0.012, gate: 0.55 }),
        drums('tamb', TAMB_LIGHT, TAMB, { vel: 1 }),
        clinks('tri', [[0, 1, 0.75], [4, 1, 0.7], [10, 1, 0.75], [14, 1, 0.8, true]]),
        pickup('vln', 20, 'F4', 0.8),
        pickup('mand', 20, 'F4', 0.6),
      ],
    },
    // Violetta: the violin takes the tune, pizzicato pa-pa, clarinet answers
    V2: {
      bars: 20,
      chords: VERSE_CH,
      parts: [
        ...violinLine('vln', VERSE_VLN + 'r:9 |', 0.82),
        mel('mand', VERSE + 'r:9 |', { vel: 0.6, tremMin: 6 }),
        mel('clar', CLAR_V2, { vel: 0.66 }),
        mel('bass', VERSE_BASS, { vel: 0.8 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'D4', n: 2, vel: 0.66 }),
        comp('gtr', 'c:3 r:6', { lo: 'D3', hi: 'F4', n: 3, vel: 0.5, strum: 0.018, gate: 0.9 }),
        drums('tamb', TAMB_MID, TAMB, { vel: 0.75 }),
        clinks('tri', [[0, 1, 0.75], [4, 1, 0.7], [10, 1, 0.75], [14, 1, 0.8, true]]),
      ],
    },
    // "Ah! libiam": the whole table joins in
    C1: {
      bars: 18,
      chords: CHORUS_CH,
      parts: [
        mel('acc', CHORUS + CHORUS, { vel: 0.86 }),
        ...violinLine('vln', CHORUS + CHORUS, 0.7),
        mel('clar', CHORUS_ALTO + CHORUS_ALTO, { vel: 0.66 }),
        mel('horn', CHORUS_HORN + CHORUS_HORN, { vel: 0.55 }),
        mel('bass', CHORUS_BASS, { vel: 0.85 }),
        comp('accC', PAPA, { accent: WALTZ, lo: 'F3', hi: 'F4', n: 3, vel: 0.62, gate: 0.6 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'C3', hi: 'C4', n: 3, vel: 0.62, strum: 0.012, gate: 0.55 }),
        drums('tamb', TAMB_16, TAMB, { stepDiv: 2 / 3 }),
        clinks('tri', [[0, 1, 0.85, true], [9, 1, 0.85, true], [8, 2, 0.7], [17, 2, 0.7]]),
        hits('glock', [[3, 'Bb6', 0.5], [4, 'D7', 0.4], [84, 'Bb6', 0.5], [85, 'D7', 0.4]]),
      ],
    },
    // the band stops for a toast; the clarinet hums the turn, it sags a semitone, hic!
    brk: {
      bars: 4,
      chords: 'Bb:9 | Bb:9 | Bb:9 | F7:9',
      parts: [
        hits('bass', [[0, 'Bb2', 0.9, 3], [9, 'Bb2', 0.55, 3], [18, 'Bb2', 0.5, 3], [27, 'F2', 0.8, 6]]),
        comp('accC', 'C:3 r:6', { lo: 'F3', hi: 'F4', n: 3, vel: 0.7, gate: 0.5, to: 1 }),
        comp('pizz', 'c:3 r:6', { lo: 'F3', hi: 'D4', n: 3, vel: 0.75, to: 1 }),
        comp('gtr', 'c:3 r:6', { lo: 'D3', hi: 'F4', n: 3, vel: 0.7, strum: 0.01, to: 1 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'D4', n: 2, vel: 0.6, from: 3 }),
        drums('tamb', 'X........|s..s..s..|s..s..s..|x..s..s..', TAMB),
        clinks('tri', [[0, 1, 0.85], [0, 2, 0.8, true]]),
        mel('clar', 'r:9 | D5:2 r:1 Eb5:1 D5:1 C#5:1 D5:2 Eb5:1 | C#5:2 r:1 D5:1 C#5:1 C5:1 C#5:2 D5:1 | {C5}A5:3 r:6 |', { vel: 0.85 }),
        pickup('vln', 4, 'F4', 0.82),
        pickup('mand', 4, 'F4', 0.58),
      ],
    },
    // the duet: Violetta on top, Alfredo a third below
    V3: {
      bars: 20,
      chords: VERSE_CH,
      parts: [
        ...violinLine('vln', VERSE_VLN + 'r:9 |', 0.85),
        mel('mand', VERSE + 'r:9 |', { vel: 0.58, tremMin: 6 }),
        mel('accH', VERSE_DUET + 'r:9 |', { vel: 0.7 }),
        mel('clar', CLAR_V3, { vel: 0.64 }),
        mel('bass', VERSE_BASS, { vel: 0.82 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'D4', n: 2, vel: 0.64 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'D3', hi: 'F4', n: 3, vel: 0.55, strum: 0.012, gate: 0.55 }),
        drums('tamb', TAMB_MID, TAMB, { vel: 0.85 }),
        clinks('tri', [[0, 1, 0.8], [4, 1, 0.75], [10, 1, 0.8], [14, 1, 0.85, true]]),
        hits('cym', [[171, 60, 0.6, 9]], 1),
      ],
    },
    // grand chorus: flute an octave up, mandolin tremolo, timpani
    C2: {
      bars: 18,
      chords: CHORUS_CH,
      parts: [
        mel('acc', CHORUS + CHORUS_TO_VERSE, { vel: 0.84 }),
        ...violinLine('vln', CHORUS + CHORUS, 0.72, 1),
        mel('flute', CHORUS + CHORUS, { vel: 0.5, oct: 1 }),
        mel('mand', CHORUS + CHORUS, { vel: 0.66, oct: 1, tremMin: 6 }),
        mel('clar', CHORUS_ALTO + CHORUS_ALTO, { vel: 0.7 }),
        mel('horn', CHORUS_HORN + CHORUS_HORN, { vel: 0.6 }),
        mel('bass', CHORUS_BASS, { vel: 0.82 }),
        comp('accC', PAPA, { accent: WALTZ, lo: 'F3', hi: 'F4', n: 3, vel: 0.66, gate: 0.6 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'C3', hi: 'C4', n: 3, vel: 0.62, strum: 0.012, gate: 0.55 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'D4', n: 2, vel: 0.6 }),
        drums('tamb', TAMB_16, TAMB, { stepDiv: 2 / 3, vel: 0.95 }),
        hits('timp', [[0, 'Bb2', 0.8], [18, 'F2', 0.7], [36, 'Bb2', 0.75], [54, 'F2', 0.7], [81, 'Bb2', 0.8], [99, 'F2', 0.7], [117, 'Bb2', 0.75], [135, 'F2', 0.7], [153, 'Bb2', 0.85]]),
        hits('cym', [[3, 60, 0.6]], 0),
        clinks('tri', [[0, 1, 0.9, true], [9, 1, 0.9, true], [8, 2, 0.75], [16, 1, 0.8]]),
        hits('glock', [[3, 'Bb6', 0.55], [4, 'D7', 0.45], [84, 'Bb6', 0.55], [85, 'D7', 0.45]]),
      ],
    },
  },
  form: ['intro', 'V1', 'V2', 'C1', 'brk', 'V3', 'C2'],
  loopFrom: 1,
};
