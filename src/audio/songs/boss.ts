/**
 * BOSS (mini-bosses at 5:00 and 10:00) — "Galoppo finale": the galop from the finale of Rossini's
 * William Tell Overture (Guillaume Tell, 1829; public domain) as a cartoon cavalry chase, a
 * symphony orchestra with an Italian street band inside it. E major (Rossini's key), 2/4, ♩ = 152.
 * Melody transcribed from and verified against Köhler's Violin Repository (1885) "William Tell —
 * Rondo" (see docs/music/boss.md for the reference, the compare.py proofs and the measurements).
 *
 * Form (bars): intro(3) drum roll on the dominant (rides the game's 0.6 s fade-in) + brass call |
 * A(8) galop theme: trumpet, galloping strings, tuba oom, snare, timpani | A2(8) theme again as a
 * street band: accordion + clarinet (8vb), guitar off-beats, tambourine | B(8) second strain (C#m):
 * staccato strings, horns, pizzicato, triangle | B2(8) second strain + xylophone + accordion (8vb),
 * brass off-beats | brk(8) Rossini crescendo on B7: woodblock hooves, horn call, xylophone answer,
 * trumpet call, tutti stabs + whip, rolls | C(15) theme + scale runs, tutti | coda(4) Rossini's
 * rising tonic arpeggio → loop to A.
 * Loop body 59 bars = 46.6 s (bars 4-62), total 48.9 s.
 */
import { comp, drums, hits, mel, pad, type HitMap, type Part, type SongDef } from '../sequencer';

// ---------------------------------------------------------------------------------------------
// Melody (one step = a sixteenth; a 2/4 bar = 8 steps). Every pickup (B4 B4 / G#5 G#5) sits in
// the last eighth of the section before.
// ---------------------------------------------------------------------------------------------

/** Galop theme, Köhler bars 1-6 (pickup = bar 0). */
const THEME_1_6 =
  'B4:2 B4:1 B4 B4:2 B4:1 B4 | E5:2 F#5 G#5 B4:1 B4 | B4:2 B4:1 B4 E5:2 G#5:1 G#5 | F#5:2 D#5 B4 B4:1 B4 | ' +
  'B4:2 B4:1 B4 B4:2 B4:1 B4 | E5:2 F#5 G#5 E5:1 G#5 | ';
/** Bars 1-8 (bar 8 without the next pickup). */
const THEME = THEME_1_6 + 'B5:5 A5:1 G#5 F#5 | E5:2 G#5 E5 r:2 |';
/** Second strain, bars 10-16 (bar 14 = bar 10: the reference drops a sixteenth there). */
const STRAIN_1_7 =
  'G#5:2 G#5:1 G#5 G#5:2 G#5:1 G#5 | G#5:2 C#6 G#5 C#6 | G#5:2 C#6 G#5 F#5 | E5:2 D#5 C#5 G#5:1 G#5 | ' +
  'G#5:2 G#5:1 G#5 G#5:2 G#5:1 G#5 | G#5:2 C#6 G#5 C#6 | G#5:2 C#6 B5 A#5 | ';
/** ... bar 17 with the pickup to the repeat / without it. */
const STRAIN_REP = STRAIN_1_7 + 'B5:2 A#5 B5 G#5:1 G#5 |';
const STRAIN_END = STRAIN_1_7 + 'B5:2 A#5 B5 r:2 |';
/** The scale runs of the third part (bars 26-30 / 31-34; bars 28 + 29 are one 2/4 bar). */
const RUNS =
  'E4:1 F#4 G#4 A4 G#4 A4 B4 C#5 | B4 C#5 D#5 E5 D#5 E5 F#5 G#5 | A5 G#5 A5 G#5 A5 G#5 A5 G#5 | A5 G#5 A5 F#5 D#5 B4 A4 F#4 | ';
/** Bar 25: bar 7 of the theme turned into a falling B7 arpeggio. */
const THEME_7_RUN = 'B5:2 A5:1 F#5 D#5 B4 A4 F#4 | ';
/** Third part, bars 19-34 (15 bars; pickup = bar 18). */
const THIRD = THEME_1_6 + THEME_7_RUN + RUNS + RUNS;
/** Coda arpeggio, bars 35-38; the last eighth is left to the trumpet's pickup into the loop. */
const CODA = 'E4:2 B3:1 B3 E4:2 B3:1 B3 | G#4:2 E4:1 E4 B4:2 G#4:1 G#4 | E5:2 B4:1 B4 E5:2 B4:1 B4 | G#5:2 E5:1 E5 B5:2 r:2 |';
/** Articulation: tongued, detached brass for the galop (the sustain samples default to 0.92) and reeds. */
const DET = 0.8;
const REED = 0.85;
/** Rests for n bars. */
const rest = (n: number): string => Array(n).fill('r:8 |').join(' ') + ' ';

// ---------------------------------------------------------------------------------------------
// Harmony and accompaniment
// ---------------------------------------------------------------------------------------------

const A_CH = 'E:8 | E:8 | E:8 | B:8 | E:8 | E:8 | B7:8 | E:8';
const B_CH = 'C#m:8 | C#m:8 | C#m:4 G#7:4 | C#m:8 | C#m:8 | C#m:8 | C#m:4 F#7:4 | B:8';
const BRK_CH = 'B7:8 | B7:8 | B7:8 | B7:8 | B7:8 | B7:8 | B7:8 | B7:8';
const C_CH = 'E:8 | E:8 | E:8 | B:8 | E:8 | E:8 | B7:8 | E:8 | B:8 | B7:8 | B7:8 | E:8 | B:8 | B7:8 | B7:8';
const CODA_CH = 'E:8 | E:8 | E:8 | E:6 B7:2';

/** Tuba "oom" on both beats (the chords play the "pah"): oom('E2 B1', ...) = one bar each. */
const oom = (...bars: string[]): string =>
  bars.map((b) => b.split(' ').map((n) => `${n}:2 r:2`).join(' ')).join(' | ') + ' |';
const A_BASS = oom('E2 B1', 'E2 B1', 'E2 B1', 'B1 F#2', 'E2 B1', 'E2 B1', 'B1 F#2', 'E2 B1');
const B_BASS = oom('C#2 G#1', 'C#2 G#1', 'C#2 G#1', 'C#2 G#1', 'C#2 G#1', 'C#2 G#1', 'C#2 F#1', 'B1 D#2');
const C_BASS = oom('E2 B1', 'E2 B1', 'E2 B1', 'B1 F#2', 'E2 B1', 'E2 B1', 'B1 F#2', 'E2 B1', 'B1 F#2', 'B1 F#2', 'B1 F#2', 'E2 B1', 'B1 F#2', 'B1 F#2', 'B1 F#2');

/** Galloping strings: "DUM da-da DUM da-da" on the chord. */
const GALLOP = 'C:2 c:1 c:1 C:2 c:1 c:1';
/** Off-beat "pah". */
const PAH = 'r:2 c:2 r:2 c:2';
/** Second strain: no "pah" under the passing D# of bar 4 (E-D#-C#), which would clash with C#m. */
const PAH_B = 'r:2 c:2 r:2 c:2 | r:2 c:2 r:2 c:2 | r:2 c:2 r:2 c:2 | r:6 c:2 | r:2 c:2 r:2 c:2 | r:2 c:2 r:2 c:2 | r:2 c:2 r:2 c:2 | r:2 c:2 r:2 c:2';
/**
 * Horn chords under the second strain (B_CH), voiced by hand for three horns (top / middle /
 * bottom) instead of pad(), for two bars where the tune's non-chord tones need room:
 * bar 4 (E5-D#5-C#5 over C#m): the top horn rests on beat 1 and enters with E4 on beat 2, so no
 * E4 (and in B2 no C#4-D#4-E4 cluster with the accordion's 8vb line) sounds under the passing D#;
 * bar 7 (B5 → A#5 over F#7): the horns have their own 4-3, F#7sus4 (F#3 B3 E4) under the B5
 * appoggiatura and F#7 (F#3 A#3 E4) with the A#5, instead of A#3 against B5.
 * Common tones are tied across the chord changes (G#3 through bars 1-4); the horns breathe and
 * re-articulate at the half-strain (bar 5).
 */
const HORNS_B = [
  'E4:8 | _:8 | _:4 F#4:4 | r:4 E4:4 | E4:8 | _:8 | _:8 | D#4:8 |',
  'C#4:8 | _:8 | _:4 B#3:4 | C#4:8 | C#4:8 | _:8 | _:4 B3:2 A#3:2 | B3:8 |',
  'G#3:8 | _:8 | _:8 | _:8 | G#3:8 | _:8 | _:4 F#3:4 | _:8 |',
];
const hornsB = (vel: number): Part[] => HORNS_B.map((v) => mel('hns', v, { vel, gate: 1 }));

// ---------------------------------------------------------------------------------------------
// Percussion
// ---------------------------------------------------------------------------------------------

/** Snare: X accent, x stroke, o ghost; digits 1-9 = a crescendo roll (32nds with stepDiv 2). */
const SN: HitMap = {
  X: { v: 0.8, vr: [0, 1] },
  x: { v: 0.55, vr: [0, 1] },
  o: { v: 0.33, vr: [0, 1] },
  ...Object.fromEntries('123456789'.split('').map((c, i) => [c, { v: 0.2 + i * 0.075, vr: [0, 1] }])),
};
/** Galop snare, one bar. */
const SN_GAL = 'x.oox.oo';
/** Tambourine: h hit, a accent. */
const TB: HitMap = { h: { v: 0.65, vr: [0, 1] }, a: { v: 0.9, vr: [4, 5] } };
const TAMB = 'a.h...h.|..h...h.|..h...h.|..h...h.|a.h...h.|..h...h.|..h...h.|..h.h.h.';

/** Timpani on E2 / B2 (tonic / dominant drums) for the E-major sections. */
const TIMP_A = 'E2:4 r:4 | ' + rest(2) + 'B2:2 B2:1 B2 B2:2 r:2 | E2:4 r:4 | r:8 | B2:2 B2:1 B2 B2:2 B2:1 B2 | E2:2 r:2 B2:2 r:2 |';
const TIMP_B = 'G#2:4 r:4 | r:8 | r:4 G#2:4 | C#3:4 r:4 | G#2:4 r:4 | r:8 | r:4 F#2:4 | B2:2 B2:1 B2 B2:2 r:2 |';

/** Timpani roll from step `at` over `steps` steps, `per` strokes per step (2 = 32nds, 1.5 = 16th
 *  triplets), velocity v0 → v1 (the timpani's two recorded variants alternate like the sticks). */
const roll = (at: number, steps: number, note: string, v0: number, v1: number, per = 2): Array<[number, string, number, number]> => {
  const n = Math.round(steps * per);
  return Array.from({ length: n }, (_, i): [number, string, number, number] => [at + i / per, note, v0 + ((v1 - v0) * i) / Math.max(1, n - 1), 1 / per]);
};

export const boss: SongDef = {
  id: 'boss',
  bpm: 152,
  stepsPerBeat: 4,
  barSteps: 8,
  scale: 'E major',
  gainDb: -0.3,
  humanize: 0.003,
  reverb: { rt60: 1.5, size: 1.15, damp: 0.5, predelay: 0.02, er: 0.35, hp: 300, lp: 7000, wet: 1.25 },
  channels: {
    tpt: { inst: 'trumpet', gain: -4.9, pan: 0.08, send: 0.18 },
    acc: { inst: 'accordion', gain: -5.2, pan: -0.12, send: 0.15 },
    gtr: { inst: 'guitar', gain: -11, pan: -0.3, send: 0.15, hum: 0.5 },
    melS: { inst: 'strStab', gain: -3.7, pan: -0.15, send: 0.2, hum: 0.4 },
    xylo: { inst: 'xylophone', gain: -12, pan: 0.3, send: 0.2, hum: 0.5 },
    str: { inst: 'strStab', gain: -13, pan: 0.2, send: 0.2, hum: 0.4 },
    pizz: { inst: 'pizz', gain: -11.3, pan: 0.3, send: 0.2, hum: 0.5 },
    clar: { inst: 'clarinet', gain: -6.4, pan: 0.2, send: 0.2 },
    hn: { inst: 'horn', gain: -8, pan: -0.3, send: 0.25 },
    hns: { inst: 'brassSoft', gain: -11.9, pan: -0.35, send: 0.3, hum: 0 },
    brs: { inst: 'brass', gain: -6, pan: 0.15, send: 0.2 },
    tuba: { inst: 'tuba', gain: -9.3, pan: 0, send: 0.05, hum: 0.3 },
    timp: { inst: 'timpani', gain: -8, pan: 0, send: 0.2, hum: 0 },
    sn: { inst: 'snare', gain: -8, pan: 0.12, send: 0.12, hum: 0 },
    bd: { inst: 'bassDrum', gain: -8, pan: 0, send: 0.15, hum: 0 },
    crash: { inst: 'crash', gain: -10.8, pan: -0.15, send: 0.25, hum: 0 },
    cym: { inst: 'cymbal', gain: -4.2, pan: 0.2, send: 0.25, hum: 0 },
    hit: { inst: 'orchHit', gain: -13.6, pan: 0, send: 0.25, hum: 0 },
    tamb: { inst: 'tamb', gain: -0.9, pan: -0.4, send: 0.1, hum: 0 },
    tri: { inst: 'triangleInst', gain: -2.9, pan: 0.45, send: 0.2, hum: 0 },
    wood: { inst: 'woodblock', gain: -10, pan: -0.35, send: 0.15, hum: 0 },
    whip: { inst: 'slapstick', gain: -10, pan: 0.25, send: 0.2, hum: 0 },
  },
  sections: {
    // Bar 1: the game fades this track in over 0.6 s (main.ts, boss spawn), so the music opens
    // with a crescendo roll on the dominant (timpani B, snare, suspended cymbal) that grows
    // through the fade. Bars 2-3: the brass call on the coda's arpeggio (Köhler bars 35-36) enters
    // at full level on the bar-2 downbeat (crash + bass drum); its last two sixteenths give way to
    // the trumpet's pickup into the theme.
    intro: {
      bars: 3,
      chords: 'B7:8 | E:8 | E:6 B7:2',
      parts: [
        hits('timp', roll(0, 8, 'B2', 0.25, 0.8, 1.5)), // 16th triplets against the snare's 32nds
        hits('cym', [[0, 60, 0.4, 8]], 1),
        mel('brs', rest(1) + 'E4:2 B3:1 B3 E4:2 B3:1 B3 | G#4:2 E4:1 E4 B4:2 r:2 |', { vel: 0.85, gate: DET }),
        mel('hn', rest(1) + 'E3:2 B2:1 B2 E3:2 B2:1 B2 | G#3:2 E3:1 E3 B3:2 r:2 |', { vel: 0.8, gate: DET }),
        mel('tpt', rest(2) + 'r:6 B4:1 B4 |', { vel: 0.85, gate: DET }),
        mel('timp', rest(1) + 'E2!:2 B2:1 B2 E2:2 B2:1 B2 | E2:2 E2:1 E2 B2:2 r:2 |', { vel: 0.6 }),
        mel('tuba', 'r:8 | ' + oom('E2 B1', 'E2 B1'), { vel: 0.75, gate: 0.7 }),
        drums('sn', '1122334455667788|X...o.o.x...o.o.|3344556677889999', SN, { stepDiv: 2 }),
        hits('crash', [[8, 60, 0.7]]),
        hits('bd', [[8, 60, 0.8]]),
      ],
    },
    A: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('tpt', THEME, { vel: 0.9, gate: DET }),
        mel('acc', 'r:6 B4:1 B4 |', { at: 56, vel: 0.85, gate: REED }), // the accordion enters with the pickup to A2
        comp('str', GALLOP, { lo: 'F#3', hi: 'F#4', n: 3, vel: 0.5 }),
        mel('tuba', A_BASS, { vel: 0.8, gate: 0.7 }),
        mel('timp', TIMP_A, { vel: 0.7 }),
        drums('sn', 'X.oox.oo|' + SN_GAL.repeat(3) + 'X.oox.oo|' + SN_GAL.repeat(2) + 'x.oox.xx', SN),
        hits('crash', [[0, 60, 0.75]]),
        hits('bd', [[0, 60, 0.8], [32, 60, 0.6]]),
      ],
    },
    A2: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('acc', THEME, { vel: 0.95, gate: REED }),
        mel('clar', THEME, { vel: 0.7, oct: -1, gate: REED }),
        mel('melS', 'r:6 G#5:1 G#5 |', { at: 56, vel: 0.85 }), // the strings' pickup to the second strain
        comp('gtr', PAH, { lo: 'D#3', hi: 'B3', n: 3, vel: 0.65, strum: 0.01 }), // street-band guitar on the off-beats
        mel('tuba', A_BASS, { vel: 0.8, gate: 0.7 }),
        mel('timp', TIMP_A, { vel: 0.7 }),
        drums('tamb', TAMB, TB),
        drums('sn', 'X.oox.oo|' + SN_GAL.repeat(3) + 'X.oox.oo|' + SN_GAL.repeat(2) + 'x.oox.xx', SN),
        hits('crash', [[0, 60, 0.7]]),
        hits('bd', [[0, 60, 0.8], [32, 60, 0.6]]),
      ],
    },
    B: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('melS', STRAIN_REP, { vel: 0.85 }),
        ...hornsB(0.5),
        comp('pizz', PAH_B, { lo: 'G#3', hi: 'G#4', n: 3, vel: 0.55 }),
        mel('tuba', B_BASS, { vel: 0.7, gate: 0.7 }),
        mel('timp', TIMP_B, { vel: 0.6 }),
        drums('sn', 'x...x.oo|'.repeat(7) + 'x.oox.xx', SN),
        hits('tri', [[0, 60, 0.5], [16, 60, 0.4], [32, 60, 0.5], [48, 60, 0.4]]),
      ],
    },
    B2: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('melS', STRAIN_END, { vel: 0.95 }),
        mel('xylo', STRAIN_END, { vel: 0.7 }),
        mel('acc', STRAIN_END, { vel: 0.6, oct: -1, gate: REED }),
        ...hornsB(0.5),
        comp('brs', PAH_B, { lo: 'F#3', hi: 'F#4', n: 3, vel: 0.4 }),
        mel('tuba', B_BASS, { vel: 0.75, gate: 0.7 }),
        mel('timp', TIMP_B, { vel: 0.7 }),
        drums('tamb', TAMB, TB),
        drums('sn', 'X.oox.oo|' + SN_GAL.repeat(3) + 'X.oox.oo|' + SN_GAL.repeat(2) + 'x.oox.xx', SN),
        hits('crash', [[0, 60, 0.7]]),
        hits('bd', [[0, 60, 0.75], [32, 60, 0.55]]),
      ],
    },
    // Rossini crescendo on the dominant: call (horns) / answer (xylophone + pizzicato) / call
    // (trumpets) / tutti hits, the snare and timpani rolling into the trumpet's pickup.
    brk: {
      bars: 8,
      chords: BRK_CH,
      parts: [
        mel('hn', 'B3:2 B3:1 B3 D#4:2 D#4:1 D#4 | F#4:2 F#4:1 F#4 A4:2 r:2 | ' + rest(2) + 'B3:2 B3:1 B3 D#4:2 D#4:1 D#4 | F#4:2 F#4:1 F#4 A4:2 r:2 | ' + rest(2), { vel: 0.95, gate: DET }),
        pad('hns', { lo: 'F#3', hi: 'F#4', n: 3, vel: 0.4, to: 6 }), // soft B7 under the calls
        mel('xylo', rest(2) + 'A5:1 G#5 A5 G#5 A5 G#5 A5 G#5 | A5 G#5 A5 F#5 D#5 B4 A4 F#4 | ' + rest(4), { vel: 0.7 }),
        mel('pizz', rest(2) + 'A4:1 G#4 A4 G#4 A4 G#4 A4 G#4 | A4 G#4 A4 F#4 D#4 B3 A3 F#3 | ' + rest(4), { vel: 0.6 }),
        mel('brs', rest(4) + 'B4:2 B4:1 B4 D#5:2 D#5:1 D#5 | F#5:2 F#5:1 F#5 A5:2 r:2 | ' + rest(2), { vel: 0.8, gate: DET }),
        comp('str', 'C:2 c:1 c:1 C:2 c:1 c:1 | c:2 r:6', { from: 6, lo: 'F#3', hi: 'F#4', n: 3, vel: 0.7 }),
        comp('brs', 'C:2 c:1 c:1 C:2 c:1 c:1 | c:2 r:6', { from: 6, lo: 'A3', hi: 'A4', n: 3, vel: 0.45 }),
        mel('tpt', rest(7) + 'r:6 B4:1 B4 |', { vel: 0.9, gate: DET }),
        mel('acc', rest(7) + 'r:6 B4:1 B4 |', { vel: 0.9, gate: REED }),
        mel('tuba', 'B1:2 r:6 | B1:2 r:6 | B1:2 r:6 | B1:2 r:6 | B1:2 r:2 B1:2 r:2 | B1:2 r:2 B1:2 r:2 | B1:2 B1:1 B1 B1:2 B1:1 B1 | B1:2 r:6 |', { vel: 0.7, gate: 0.7 }),
        hits('timp', [
          ...[0, 1, 2, 3, 4, 5].flatMap((b): Array<[number, string, number]> => [[b * 8, 'B2', 0.45 + b * 0.05], [b * 8 + 4, 'B2', 0.36 + b * 0.05]]),
          [48, 'B2', 0.85], [50, 'B2', 0.55], [51, 'B2', 0.55], [52, 'B2', 0.75], [54, 'B2', 0.55], [55, 'B2', 0.55],
          [56, 'B2', 0.85], ...roll(60, 4, 'B2', 0.4, 0.9),
        ]),
        drums('sn', 'x...o.o.x...o.o.|x...o.o.x...o.o.|X...x.x.X...x.x.|X.......23456789', SN, { stepDiv: 2, from: 4 }),
        hits('hit', [[0, 'B3', 0.75], [48, 'B3', 0.7], [56, 'B3', 0.9]]),
        hits('bd', [[0, 60, 0.7], [48, 60, 0.75], [52, 60, 0.65], [56, 60, 0.9]]),
        hits('cym', [[58, 60, 0.7, 6]], 1),
        // the cavalry approaching: woodblock hooves under the calls, whip cracks on the stabs
        drums('wood', 'x.oox.oo|'.repeat(6), { x: { v: 0.5, vr: [0, 1] }, o: { v: 0.36, vr: [0, 1] } }, { to: 6 }),
        hits('whip', [[0, 60, 0.85], [56, 60, 0.9]]),
      ],
    },
    C: {
      bars: 15,
      chords: C_CH,
      parts: [
        mel('acc', THIRD, { vel: 0.85, gate: REED }),
        mel('tpt', THEME_1_6 + THEME_7_RUN + rest(8), { vel: 0.85, gate: DET }),
        mel('hn', THEME_1_6 + THEME_7_RUN + rest(8), { vel: 0.5, oct: -1, gate: DET }),
        mel('melS', rest(7) + RUNS + RUNS, { vel: 0.66 }),
        mel('xylo', rest(7) + RUNS + RUNS, { vel: 0.6, oct: 1 }),
        comp('str', GALLOP, { to: 7, lo: 'F#3', hi: 'F#4', n: 3, vel: 0.55 }),
        comp('str', PAH, { from: 7, lo: 'F#3', hi: 'F#4', n: 3, vel: 0.6 }),
        comp('brs', PAH, { from: 7, lo: 'G#3', hi: 'F#4', n: 3, vel: 0.45 }),
        pad('hns', { from: 7, lo: 'F#3', hi: 'F#4', n: 3, vel: 0.5 }),
        mel('tuba', C_BASS, { vel: 0.85, gate: 0.7 }),
        mel('timp', 'E2:4 r:4 | ' + rest(2) + 'B2:2 B2:1 B2 B2:2 r:2 | E2:4 r:4 | r:8 | B2:2 B2:1 B2 B2:2 B2:1 B2 | E2:4 r:4 | B2:4 r:4 | B2:2 B2:1 B2 B2:2 B2:1 B2 | B2:2 r:6 | E2:4 r:4 | B2:4 r:4 | B2:2 B2:1 B2 B2:2 B2:1 B2 | B2:2 r:6 |', { vel: 0.75 }),
        drums('sn', 'X.oox.oo|' + SN_GAL.repeat(6) + 'X.oox.oo|' + SN_GAL.repeat(6) + 'X.xxX.xx', SN),
        hits('crash', [[0, 60, 0.8], [56, 60, 0.7], [88, 60, 0.7]]),
        hits('hit', [[0, 'E4', 0.7]]),
        hits('bd', [[0, 60, 0.85], [32, 60, 0.6], ...Array.from({ length: 8 }, (_, i): [number, number, number] => [56 + i * 8, 60, i % 4 === 0 ? 0.8 : 0.6])]),
        hits('cym', [[104, 60, 0.75, 16]], 1),
      ],
    },
    coda: {
      bars: 4,
      chords: CODA_CH,
      parts: [
        mel('acc', CODA, { vel: 0.85, gate: REED }),
        mel('brs', CODA, { vel: 0.65, gate: DET }),
        mel('melS', CODA, { vel: 0.65 }),
        mel('hn', CODA, { vel: 0.7, oct: -1, gate: DET }),
        mel('tpt', rest(3) + 'r:6 B4:1 B4 |', { vel: 0.9, gate: DET }),
        mel('tuba', oom('E2 B1', 'E2 B1', 'E2 B1', 'E2 B1'), { vel: 0.85, gate: 0.7 }),
        mel('timp', 'E2:2 B2:1 B2 E2:2 B2:1 B2 | E2:2 B2:1 B2 E2:2 B2:1 B2 | E2:2 B2:1 B2 E2:2 B2:1 B2 | E2:2 B2:1 B2 B2:2 r:2 |', { vel: 0.62 }),
        drums('sn', 'X.oox.oo|x.oox.oo|x.oox.oo|x.xx1234', SN),
        hits('crash', [[0, 60, 0.85]]),
        hits('hit', [[0, 'E4', 0.8]]),
        hits('bd', [[0, 60, 0.9], [16, 60, 0.7]]),
        hits('cym', [[16, 60, 0.62, 16]], 1),
      ],
    },
  },
  form: ['intro', 'A', 'A2', 'B', 'B2', 'brk', 'C', 'coda'],
  loopFrom: 1,
};
