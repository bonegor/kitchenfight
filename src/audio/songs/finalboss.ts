/**
 * FINAL BOSS — "La Tradizione Furiosa": the main theme turned epic and furious.
 * A minor, 6/8, ♩. = 156. Brass + accordion carry the hook, choir "aah", timpani, string stabs,
 * organ, tolling bell; the theme modulates up a minor third (C minor) for the second statement.
 * Form: intro(8) A(16) B(16, C minor) C(16, brass/choir call & response) A2(16, climax)
 *       D(8, stomp breakdown) turn(8, dominant fury) → loop to A.
 */
import { arp, bass, comp, cresc, drums, hits, mel, pad, transposeChords, type SongDef } from '../sequencer';
import { CHORDS_A, TAMB, THEME_1, THEME_2 } from './title';

const END_A_TO_B = ' C5:2 B4:1 A4:2 G4:1 |';
const END_B = ' C5:2 B4:1 A4:3 |'; // transposed with the theme (→ E♭ D C)
const END_LOOP = ' C5:2 B4:1 A4:2 E4:1 |';
const CHORDS_B = transposeChords(CHORDS_A, 3);

const C_CH = 'Dm:6 | E7:6 | Am:6 | F:6 | Dm:6 | E7:6 | Bb:6 | E7:6 | Dm:6 | E7:6 | Am:6 | F:6 | Bb/D:6 | Bb/D:6 | E7:6 | E7:6';
const C_BRASS = `
  D5:2 F5:1 A5:2 D6:1 | B5:2 G#5:1 E5:3 | r:6 | r:6 | F5:2 A5:1 D6:3 | D6:2 B5:1 G#5:3 | r:6 | r:6 |
  D5:2 F5:1 A5:2 D6:1 | B5:2 G#5:1 E5:3 | A5:2 C6:1 E6:3 | C6:2 A5:1 F5:3 | F5:2 Bb5:1 D6:3 | F6:3 D6:3 | B5:2 G#5:1 E5:2 D5:1 | B4:2 G#4:1 E4:3 |`;
const C_CHOIR = `
  r:6 | r:6 | A5:6 | C6:3 A5:3 | r:6 | r:6 | D6:3 Bb5:3 | G#5:3 B5:3 |
  F5:6 | E5:6 | E5:6 | F5:6 | F5:6 | F5:6 | E5:6 | E5:6 |`;

const TURN_CH = 'E7:6 | E7:6 | E7:6 | E7:6 | E7:6 | E7:6 | E7:6 | E7:6';
const TURN_RUN = `
  E5:1 F5 G#5 A5 B5 C6 | D6:1 C6 B5 A5 G#5 F5 | E5:1 F5 G#5 A5 B5 C6 | D6:1 E6 D6 C6 B5 G#5 |
  E5:1 F5 E5 D5 C5 B4 | C5:1 D5 C5 B4 A4 G#4 | A4:1 B4 C5 D5 E5 F5 | B5:2 G#5:1 E4:1 F4 G#4 |`;

const OOM = '1:2 r:1 5:2 r:1';
const PAPA = 'r:1 c:1 c:1 r:1 c:1 c:1';
const TREM = '0:1 1 2 0 1 2';

const roll = (start: number, n: number, note: string, v0: number, v1: number, step = 0.5): Array<[number, string, number]> =>
  Array.from({ length: n }, (_, i): [number, string, number] => [start + i * step, note, v0 + ((v1 - v0) * i) / Math.max(1, n - 1)]);

export const finalboss: SongDef = {
  id: 'finalboss',
  bpm: 156,
  stepsPerBeat: 3,
  barSteps: 6,
  scale: 'A harmonic minor',
  gainDb: 0,
  humanize: 0.003,
  reverb: { rt60: 2.0, size: 1.3, damp: 0.5, predelay: 0.025, er: 0.4, hp: 300, lp: 7000, wet: 0.9 },
  channels: {
    brass: { inst: 'brass', gain: -3, pan: 0.08, send: 0.25 },
    acc: { inst: 'accordion', gain: -5, pan: -0.12, send: 0.2 },
    mand: { inst: 'mandolin', gain: -5, pan: -0.38, send: 0.2 },
    choir: { inst: 'choir', gain: -6, pan: 0, send: 0.35, hum: 0 },
    choirP: { inst: 'choir', gain: -12, pan: 0, send: 0.35, hum: 0 },
    organ: { inst: 'organ', gain: -15, pan: -0.2, send: 0.3, hum: 0 },
    stab: { inst: 'strStab', gain: -9, pan: 0.32, send: 0.2, hum: 0.2 },
    str: { inst: 'strings', gain: -12, pan: 0, send: 0.3, hum: 0 },
    pizz: { inst: 'pizz', gain: -11, pan: -0.4, send: 0.12, hum: 0.3 },
    tuba: { inst: 'tuba', gain: -5, pan: 0, send: 0.04, hum: 0.3 },
    timp: { inst: 'timp', gain: -4, pan: 0, send: 0.2, hum: 0 },
    tamb: { inst: 'tamb', gain: -7, pan: 0.28, send: 0.1, hum: 0.5 },
    crash: { inst: 'crash', gain: -14, pan: -0.2, send: 0.25, hum: 0 },
    bell: { inst: 'bell', gain: -11, pan: 0.25, send: 0.35, hum: 0 },
    riser: { inst: 'riser', gain: -14, pan: 0, send: 0.25, hum: 0 },
  },
  sections: {
    intro: {
      bars: 8,
      chords: 'Am:6 | Am:6 | Am:6 | Am:6 | F:6 | Dm:6 | E7:6 | E7:6',
      parts: [
        cresc(pad('choirP', { lo: 'A4', hi: 'E5', vel: 0.75, n: 3 }), 0.4, 1.0),
        cresc(pad('organ', { lo: 'A3', hi: 'E4', vel: 0.7, n: 3, to: 6 }), 0.5, 1.0),
        hits('bell', [[0, 'A3', 0.9], [12, 'A3', 0.8], [24, 'F3', 0.8]]),
        mel('brass', 'A4:6 | E5:6 | D5:3 C5:3 | B4:6 | C5:6 | D5:6 | E5:6 | r:3 E4:1 F4 G#4 |', { vel: 0.85 }),
        hits('timp', [[0, 'A2', 0.9], [12, 'A2', 0.8], [24, 'F2', 0.85], [30, 'D2', 0.85], ...roll(36, 20, 'E2', 0.3, 0.95), [46, 'E2', 1.0]]),
        drums('tamb', '......|......|......|......|s.ss.s|XsxXsx|XsxXsx|XsxR..', TAMB),
      ],
    },
    A: {
      bars: 16,
      chords: CHORDS_A,
      parts: [
        mel('brass', THEME_1 + THEME_2 + END_A_TO_B, { vel: 0.9 }),
        mel('acc', THEME_1 + THEME_2 + END_A_TO_B, { vel: 0.85 }),
        pad('choirP', { lo: 'A4', hi: 'F5', vel: 0.6, n: 3 }),
        bass('tuba', OOM, { lo: 'E1', hi: 'E2', vel: 0.88 }),
        comp('stab', PAPA, { lo: 'A4', hi: 'F5', vel: 0.62 }),
        bass('pizz', '1:1 r:2 5:1 r:2', { lo: 'A2', hi: 'A3', vel: 0.65 }),
        drums('tamb', 'XxxXxx', TAMB),
        hits('timp', [[0, 'A2', 0.95], [12, 'E2', 0.85], [24, 'A2', 0.9], [36, 'D2', 0.85], [48, 'D2', 0.9], [60, 'C2', 0.85], [72, 'D2', 0.9], [78, 'E2', 0.9], [84, 'D2', 0.85], [90, 'E2', 0.95]]),
        hits('crash', [[0, 60, 0.75]]),
      ],
    },
    B: {
      bars: 16,
      chords: CHORDS_B,
      parts: [
        mel('choir', THEME_1 + THEME_2 + END_B, { vel: 0.9, tr: 3 }),
        mel('brass', THEME_1 + THEME_2 + END_B, { vel: 0.75, tr: 3, oct: -1 }),
        mel('mand', THEME_1 + THEME_2 + END_B, { vel: 0.7, tr: 3, tremMin: 2 }),
        pad('organ', { lo: 'C4', hi: 'G4', vel: 0.5, n: 3 }),
        bass('tuba', OOM, { lo: 'F1', hi: 'F2', vel: 0.88 }),
        comp('stab', PAPA, { lo: 'C5', hi: 'Ab5', vel: 0.6 }),
        drums('tamb', 'XxxXxx|XsxXsx', TAMB),
        hits('timp', [[0, 'C2', 0.95], [24, 'C2', 0.9], [48, 'F2', 0.9], [72, 'F2', 0.9], [84, 'G2', 0.95], [90, 'G2', 0.95]]),
        hits('crash', [[0, 60, 0.7]]),
      ],
    },
    C: {
      bars: 16,
      chords: C_CH,
      parts: [
        mel('brass', C_BRASS, { vel: 0.92 }),
        mel('choir', C_CHOIR, { vel: 0.85 }),
        bass('tuba', '1:1 r:2 1:1 r:2', { lo: 'E1', hi: 'E2', vel: 0.85 }),
        comp('stab', 'C:1 r:2 C:1 r:2', { lo: 'D4', hi: 'D5', vel: 0.65 }),
        cresc(arp('str', TREM, { lo: 'E4', hi: 'E5', vel: 0.5, n: 3, from: 8 }), 0.6, 1.1),
        drums('tamb', 'X..X..|X..X..|XsxXsx|XsxXsx|X..X..|X..X..|XsxXsx|XxxRxx|XxxXxx|XxxXxx|XxxXxx|XxxXxx|XxxXxx|XxxXxx|RxxRxx|R..R..', TAMB),
        hits('timp', [[0, 'D2', 0.9], [6, 'E2', 0.9], [12, 'A2', 0.85], [18, 'F2', 0.85], [24, 'D2', 0.9], [30, 'E2', 0.9], [36, 'Bb1', 0.9], [42, 'E2', 0.9], [48, 'D2', 0.95], [54, 'E2', 0.95], ...roll(84, 24, 'E2', 0.3, 1.0)]),
        hits('riser', [[84, 60, 0.85]]),
      ],
    },
    A2: {
      bars: 16,
      chords: CHORDS_A,
      parts: [
        mel('brass', THEME_1 + THEME_2 + ' C5:2 B4:1 A4:3 |', { vel: 0.98 }),
        mel('choir', THEME_1 + THEME_2 + ' C5:2 B4:1 A4:3 |', { vel: 0.8, oct: 1, minDur: 2 }),
        mel('acc', THEME_1 + THEME_2 + ' C5:2 B4:1 A4:3 |', { vel: 0.9 }),
        mel('mand', THEME_1 + THEME_2 + ' C5:2 B4:1 A4:3 |', { vel: 0.7, oct: 1, tremMin: 2 }),
        pad('organ', { lo: 'A3', hi: 'E4', vel: 0.45, n: 3 }),
        bass('tuba', OOM, { lo: 'E1', hi: 'E2', vel: 0.92 }),
        comp('stab', PAPA, { lo: 'A4', hi: 'F5', vel: 0.65 }),
        bass('pizz', '1:1 r:2 5:1 r:2', { lo: 'A2', hi: 'A3', vel: 0.7 }),
        drums('tamb', 'XxxXxx', TAMB),
        hits('timp', [[0, 'A2', 1.0], [12, 'E2', 0.9], [24, 'A2', 0.95], [36, 'D2', 0.9], [48, 'D2', 0.95], [60, 'C2', 0.9], [72, 'D2', 0.95], [78, 'E2', 0.95], [84, 'D2', 0.9], [90, 'A2', 1.0]]),
        hits('crash', [[0, 60, 0.8], [48, 60, 0.6]]),
        hits('bell', [[0, 'A3', 0.7], [90, 'A3', 0.8]]),
      ],
    },
    D: {
      bars: 8,
      chords: 'Am:6 | Am:6 | Am:6 | Am:6 | Dm:6 | Dm:6 | E7:6 | E7:6',
      parts: [
        bass('tuba', '1:1 r:2 1:1 r:2', { lo: 'E1', hi: 'E2', vel: 0.9 }),
        drums('tamb', 'X..X..|X..Xx.|X..X..|X..Xxx|X..X..|X..Xx.|X..X..|XxxRxx', TAMB),
        hits('timp', [[0, 'A2', 0.95], [3, 'A2', 0.85], [12, 'A2', 0.95], [15, 'A2', 0.85], [24, 'D2', 0.95], [27, 'D2', 0.85], [36, 'E2', 1.0], [39, 'E2', 0.9]]),
        mel('choir', 'A4:3 r:3 | A4:3 r:3 | C5:3 r:3 | B4:3 r:3 | D5:3 r:3 | F5:3 r:3 | E5:6 | E5:6 |', { vel: 0.85 }),
        comp('stab', 'C:1 r:5', { lo: 'A4', hi: 'F5', vel: 0.7 }),
      ],
    },
    turn: {
      bars: 8,
      chords: TURN_CH,
      parts: [
        mel('acc', TURN_RUN, { vel: 0.85 }),
        mel('stab', TURN_RUN, { vel: 0.55, oct: -1 }),
        cresc(pad('choirP', { lo: 'G#4', hi: 'E5', vel: 0.75, n: 3 }), 0.5, 1.1),
        bass('tuba', '1:2 r:1 1:2 r:1', { lo: 'E1', hi: 'E2', vel: 0.85 }),
        drums('tamb', 'XxxXxx|XxxXxx|XxxXxx|XxxXxx|XxxXxx|XxxXxx|RxxRxx|R..R..', TAMB),
        hits('timp', [[0, 'E2', 0.9], [12, 'E2', 0.85], [24, 'E2', 0.9], ...roll(36, 20, 'E2', 0.3, 1.0)]),
        hits('riser', [[34, 60, 0.9]]),
      ],
    },
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D', 'turn'],
  loopFrom: 1,
};
