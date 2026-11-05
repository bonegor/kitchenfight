/**
 * TITLE — "Tarantella della Tradizione" (main theme)
 * A minor, 6/8, ♩. = 140. Musette accordion lead, mandolin tremolo, tamburello, oom-pah tuba.
 * Form: intro(4) A(16) A'(16) B(16, C major) bridge(8, call & response) A''(16) → loop to A.
 */
import { bass, comp, cresc, drums, harm, hits, mel, pad, arp, type SongDef } from '../sequencer';

export const TAMB = {
  X: { v: 0.95, vr: [4, 5] },
  x: { v: 0.62, vr: [0, 1] },
  s: { v: 0.55, vr: [2, 3] },
  R: { v: 0.7, vr: [6, 7] },
};

/** The hook: "LA – mi re do si | do si la MI –" (antecedent, 8 bars) */
export const THEME_1 = `
  A4:2 E5:1 D5 C5 B4 | C5:1 B4 A4 E5:3 | B4:2 E5:1 D5 C5 B4 | D5:1 C5 B4 G#4:3 |
  A4:2 E5:1 D5 C5 B4 | C5:1 B4 A4 A5:3 | F5:1 D5 Bb4 G#4:2 B4:1 | A4:3 A4:1 B4 C#5 |`;
/** consequent (circle of fifths, Neapolitan cadence) — last bar supplied by caller */
export const THEME_2 = `
  D5:2 A5:1 G5 F5 E5 | F5:1 E5 D5 B4:3 | C5:2 G5:1 F5 E5 D5 | E5:1 D5 C5 A4:3 |
  D5:2 F5:1 E5 D5 C5 | B4:1 C5 D5 E5:3 | F5:2 D5:1 B4 C5 D5 |`;
/** ornamented accordion version (graces, mordents) */
const THEME_1_ORN = `
  {B4}A4:2 E5:1 D5 C5 B4 | C5:1 B4 A4 {F5}E5:3 | B4:2 E5:1 D5 C5 B4 | D5:1 C5 B4 G#4*:3 |
  {B4}A4:2 E5:1 D5 C5 B4 | C5:1 B4 A4 {B5}A5:3 | F5:1 D5 Bb4 G#4:2 B4:1 | A4*:3 A4:1 B4 C#5 |`;
const THEME_2_ORN = `
  D5:2 A5:1 G5 F5 E5 | F5:1 E5 D5 {C5}B4:3 | C5:2 G5:1 F5 E5 D5 | E5:1 D5 C5 {B4}A4:3 |
  D5:2 F5:1 E5 D5 C5 | B4:1 C5 D5 E5*:3 | F5:2 D5:1 B4 C5 D5 |`;

export const END_LOOP = 'C5:2 B4:1 A4:2 E4:1 |';
const END_TO_B = 'C5:2 B4:1 A4:1 B4:1 D5:1 |';

export const CHORDS_A =
  'Am:6 | Am:6 | E7:6 | E7:6 | Am:6 | Am:3 A7:3 | Bb/D:3 E7:3 | Am:3 A7:3 | Dm:6 | G7:6 | C:6 | F:6 | Dm:6 | E7:6 | Bb/D:3 E7:3 | Am:6';

const B_MEL = `
  E5:2 F5:1 G5:2 E5:1 | C6:3 G5:3 | D5:2 E5:1 F5:2 D5:1 | B5:3 G5:3 |
  F5:2 G5:1 A5:2 F5:1 | E5:2 D5:1 C5:2 B4:1 | C5:2 E5:1 G5:2 E5:1 | C6:6 |
  A5:2 G5:1 F5:2 A5:1 | C6:3 A5:3 | G5:2 F5:1 E5:2 G5:1 | A5:2 G5:1 E5:2 C#5:1 |
  D5:2 E5:1 F5:2 A5:1 | G5:2 F5:1 D5:2 B4:1 | C5:3 E5:3 | D5:3 B4:2 G#4:1 |`;
const CHORDS_B = 'C:6 | C:6 | G7:6 | G7:6 | G7:6 | G7:6 | C:6 | C:6 | F:6 | F:6 | C:6 | A7:6 | Dm:6 | G7:6 | C:6 | E7:6';

const OOM = '1:2 r:1 5:2 r:1 | 1:2 r:1 5:2 r:1 | 1:2 r:1 5:2 r:1 | 1:2 r:1 5:2 a:1';
const PAH = 'r:2 c:1 r:2 c:1';
const PAPA = 'r:1 c:1 c:1 r:1 c:1 c:1';

export const title: SongDef = {
  id: 'title',
  bpm: 140,
  stepsPerBeat: 3,
  barSteps: 6,
  scale: 'A harmonic minor',
  gainDb: -2.6,
  humanize: 0.004,
  reverb: { rt60: 1.5, size: 1.0, damp: 0.5, predelay: 0.018, er: 0.3, hp: 260, lp: 7000, wet: 1.55 },
  channels: {
    acc: { inst: 'accordion', gain: -2, pan: 0.06, send: 0.17 },
    accH: { inst: 'accordionDry', gain: -11, pan: -0.28, send: 0.2 },
    mand: { inst: 'mandolin', gain: -1.5, pan: -0.34, send: 0.2 },
    gtr: { inst: 'guitar', gain: -11, pan: 0.38, send: 0.14, hum: 0.6 },
    accC: { inst: 'accChord', gain: -11, pan: -0.12, send: 0.1, hum: 0.5 },
    tuba: { inst: 'tuba', gain: -5, pan: 0, send: 0.04, hum: 0.5 },
    pizz: { inst: 'pizz', gain: -13, pan: -0.45, send: 0.14 },
    tamb: { inst: 'tamb', gain: -5, pan: 0.28, send: 0.1, hum: 0.7 },
    glock: { inst: 'glock', gain: -17, pan: 0.42, send: 0.25 },
    str: { inst: 'strings', gain: -15, pan: 0, send: 0.3, hum: 0 },
    timp: { inst: 'timp', gain: -6, pan: 0.05, send: 0.2, hum: 0 },
    crash: { inst: 'crash', gain: -17, pan: 0.25, send: 0.2, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: 'Am:6 | Am:6 | E7:6 | E7:6',
      parts: [
        cresc(mel('mand', 'E5~:6 | _:6 | D5~:6 | B4~:3 r:3 |', { vel: 0.7 }), 0.55, 1.0),
        mel('acc', 'r:6 | r:6 | r:6 | r:3 E4:1 F4 G#4 |', { vel: 0.8 }),
        bass('tuba', '1:2 r:1 5:2 r:1', { lo: 'E1', hi: 'E2', vel: 0.65, from: 1 }),
        comp('accC', PAH, { lo: 'E4', hi: 'D5', vel: 0.55, from: 1 }),
        drums('tamb', 's..s..|s.ss.s|XsxXsx|XsxR..', TAMB),
      ],
    },
    A: {
      bars: 16,
      chords: CHORDS_A,
      parts: [
        mel('acc', THEME_1 + THEME_2 + END_LOOP, { vel: 0.82 }),
        bass('tuba', OOM, { lo: 'E1', hi: 'E2', vel: 0.75 }),
        comp('accC', PAH, { lo: 'E4', hi: 'D5', vel: 0.6 }),
        drums('tamb', 'XsxXsx', TAMB),
      ],
    },
    A2: {
      bars: 16,
      chords: CHORDS_A,
      parts: [
        mel('acc', THEME_1_ORN + THEME_2_ORN + END_TO_B, { vel: 0.85 }),
        harm('mand', THEME_1 + THEME_2 + END_TO_B, { vel: 0.6, oct: 1, tremMin: 2 }),
        bass('tuba', OOM, { lo: 'E1', hi: 'E2', vel: 0.78 }),
        comp('accC', PAH, { lo: 'E4', hi: 'D5', vel: 0.6 }),
        comp('gtr', PAH, { lo: 'G3', hi: 'E4', vel: 0.65, strum: 0.012 }),
        drums('tamb', 'XsxXsx|XsxXsx|XsxXsx|XsxRxx', TAMB),
      ],
    },
    B: {
      bars: 16,
      chords: CHORDS_B,
      parts: [
        mel('mand', B_MEL, { vel: 0.78, tremMin: 2 }),
        harm('accH', B_MEL, { vel: 0.6, plain: true }),
        mel('glock', B_MEL, { vel: 0.5, oct: 1, minDur: 3 }),
        arp('gtr', '0:1 1 2 3 2 1', { lo: 'C3', hi: 'G4', vel: 0.55, n: 3 }),
        bass('tuba', '1:3 5:3', { lo: 'E1', hi: 'E2', vel: 0.7 }),
        pad('str', { lo: 'G4', hi: 'E5', vel: 0.45, n: 3 }),
        drums('tamb', 'x.sx.s', TAMB, { vel: 0.85 }),
        hits('crash', [[0, 60, 0.5]]),
      ],
    },
    bridge: {
      bars: 8,
      chords: 'Am:6 | E7:6 | Am:6 | E7:6 | Dm:6 | Am:6 | Bb/D:6 | E7:6',
      parts: [
        mel('acc', 'A4:2 E5:1 D5 C5 B4 | r:6 | C5:2 A5:1 G5 F5 E5 | r:6 | F5:2 E5:1 D5:2 A5:1 | E5:2 D5:1 C5:2 E5:1 | D5:2 F5:1 Bb5:3 | B4:3 E4:1 F4 G#4 |', { vel: 0.88 }),
        mel('mand', 'r:6 | B4:1 C5 D5 E5:3 | r:6 | D5:1 E5 F5 G#5:3 | F5:2 E5:1 D5:2 A5:1 | E5:2 D5:1 C5:2 E5:1 | D5:2 F5:1 Bb5:3 | G#5:3 E5:1 F5 G#5 |', { vel: 0.75, tremMin: 2 }),
        bass('tuba', '1:2 r:1 5:2 r:1', { lo: 'E1', hi: 'E2', vel: 0.75, to: 6 }),
        bass('tuba', '1:6', { lo: 'D1', hi: 'D2', vel: 0.8, from: 6, to: 7 }),
        bass('tuba', '1:1 r:5', { lo: 'E1', hi: 'E2', vel: 0.95, from: 7, to: 8 }),
        comp('accC', PAH, { lo: 'E4', hi: 'D5', vel: 0.6, to: 6 }),
        cresc(pad('str', { lo: 'F4', hi: 'D5', vel: 0.55, n: 3, from: 3 }), 0.4, 1.1),
        drums('tamb', 'X..X..|X..X..|XsxXsx|XsxXsx|XsxXsx|XxxXxx|R..R..|X..R..', TAMB),
        hits('timp', [
          [0, 'A2', 0.8],
          [12, 'A2', 0.8],
          [24, 'D2', 0.85],
          ...Array.from({ length: 12 }, (_, i): [number, string, number] => [36 + i * 0.5, 'D2', 0.35 + i * 0.045]),
          [42, 'E2', 1.0],
        ]),
      ],
    },
    A3: {
      bars: 16,
      chords: CHORDS_A,
      parts: [
        mel('acc', THEME_1 + THEME_2 + END_LOOP, { vel: 0.95 }),
        mel('mand', THEME_1 + THEME_2 + END_LOOP, { vel: 0.68, oct: 1, tremMin: 2 }),
        harm('accH', THEME_1 + THEME_2 + END_LOOP, { vel: 0.55, plain: true }),
        mel('glock', THEME_1 + THEME_2 + END_LOOP, { vel: 0.45, oct: 1, minDur: 3 }),
        bass('tuba', OOM, { lo: 'E1', hi: 'E2', vel: 0.85 }),
        bass('pizz', '1:1 r:2 5:1 r:2', { lo: 'A2', hi: 'A3', vel: 0.6 }),
        comp('accC', PAPA, { lo: 'E4', hi: 'D5', vel: 0.55 }),
        comp('gtr', PAPA, { lo: 'G3', hi: 'E4', vel: 0.6, strum: 0.01 }),
        pad('str', { lo: 'A4', hi: 'F5', vel: 0.4, n: 3 }),
        drums('tamb', 'XxxXxx|XsxXsx|XxxXxx|XsxRxx', TAMB),
        hits('crash', [[0, 60, 0.6]]),
      ],
    },
  },
  form: ['intro', 'A', 'A2', 'B', 'bridge', 'A3'],
  loopFrom: 1,
};
