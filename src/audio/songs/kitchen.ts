/**
 * KITCHEN (stage 1, La Cucina) — "Tarantella in Cucina": frantic driving tarantella in D minor.
 * The main theme's hook ("LA – mi re do si") becomes a hammered "re re LA sol fa mi" figure.
 * 6/8, ♩. = 148. Frying pans clang on the downbeats.
 * Form: intro(4) A(16) B(16, call & response) A2(16) C(8, rising build) E(16, F-major relief)
 *       D(16, breakdown → rebuild) A3(16, full) turn(8, dominant pedal) → loop to A.
 */
import { arp, bass, comp, cresc, drums, harm, hits, mel, pad, type SongDef } from '../sequencer';
import { TAMB } from './title';

const THEME = `
  D5:1 D5 A5 G5 F5 E5 | F5:1 E5 D5 A5 A5 A5 | E5:1 E5 A5 G5 F5 E5 | G5:1 F5 E5 C#5 C#5 C#5 |
  D5:1 D5 A5 G5 F5 E5 | F5:1 E5 D5 D6 C6 A5 | Bb5:1 G5 Eb5 C#5 E5 A5 | D5:1 F5 A5 D6:2 r:1 |
  G5:1 G5 D6 C6 Bb5 A5 | Bb5:1 A5 G5 E5 E5 E5 | F5:1 F5 C6 Bb5 A5 G5 | Bb5:1 A5 G5 D5 D5 D5 |
  G5:1 Bb5 A5 G5 F5 E5 | C#5:1 E5 A5 C#6:2 r:1 | Bb5:1 G5 Eb5 C#5 E5 G5 | F5:1 E5 C#5 D5:2 r:1 |`;
const THEME_CH =
  'Dm:6 | Dm:6 | A7:6 | A7:6 | Dm:6 | Dm:3 D7:3 | Eb/G:3 A7:3 | Dm:6 | Gm:6 | C7:6 | F:6 | Bb:6 | Gm:6 | A7:6 | Eb/G:3 A7:3 | Dm:6';

const B_CH = 'Dm:6 | Dm:6 | C:6 | C:6 | Bb:6 | Bb:6 | A7:6 | A7:6 | Dm:6 | Dm:6 | Gm:6 | Gm:6 | Eb/G:6 | Eb/G:6 | A7:6 | A7:6';
const B_CALL = `
  D6:2 A5:1 F5:2 D5:1 | E5:1 F5 G5 A5:3 | r:6 | r:6 | D5:2 Bb4:1 F4:2 Bb4:1 | C5:1 D5 E5 F5:3 | r:6 | r:6 |
  F5:2 D5:1 A4:2 D5:1 | F5:1 G5 A5 D6:3 | r:6 | r:6 | Eb5:2 Bb4:1 G4:2 Bb4:1 | Eb5:1 F5 G5 Bb5:3 | A5:1 G5 F5 E5 D5 C#5 | E5:3 A4:3 |`;
const B_RESP = `
  r:6 | r:6 | E5:2 C5:1 G4:2 C5:1 | D5:1 E5 F5 G5:3 | r:6 | r:6 | C#5:2 E5:1 A5:2 G5:1 | F5:1 E5 D5 C#5:3 |
  r:6 | r:6 | D5:2 Bb4:1 G4:2 Bb4:1 | D5:1 E5 F5 G5:3 | r:6 | r:6 | A5:1 G5 F5 E5 D5 C#5 | E5:3 A4:3 |`;

const C_CH = 'Gm:6 | A7:6 | Bb:6 | C:6 | Dm:6 | Eb:6 | A7:6 | A7:6';
const C_MEL = `
  G4:1 G4 D5 C5 Bb4 A4 | A4:1 A4 E5 D5 C#5 A4 | Bb4:1 Bb4 F5 Eb5 D5 C5 | C5:1 C5 G5 F5 E5 C5 |
  D5:1 D5 A5 G5 F5 E5 | Eb5:1 Eb5 Bb5 G5 F5 Eb5 | E5:1 F5 G5 A5 Bb5 C#6 | E6:3 r:3 |`;

const E_CH = 'F:6 | C7:6 | F:6 | Bb:6 | F:6 | C7:6 | F:6 | C7:6 | Bb:6 | F:6 | C7:6 | F:6 | Bb:6 | F/C:6 | C7:6 | A7:6';
const E_MEL = `
  A5:2 G5:1 F5:2 C5:1 | E5:2 F5:1 G5:3 | A5:2 Bb5:1 C6:2 A5:1 | D6:3 Bb5:3 |
  C6:2 A5:1 F5:2 A5:1 | G5:2 E5:1 C5:2 E5:1 | F5:2 A5:1 C6:2 A5:1 | G5:6 |
  F5:2 D5:1 Bb4:2 D5:1 | C5:2 F5:1 A5:3 | G5:2 E5:1 C5:2 Bb4:1 | A4:3 C5:3 |
  D5:2 F5:1 Bb5:2 A5:1 | A5:2 G5:1 F5:2 C5:1 | E5:2 G5:1 Bb5:2 G5:1 | E5:3 C#5:3 |`;

const D_CH = 'Dm:6 | Dm:6 | Dm:6 | Dm:6 | Bb:6 | Bb:6 | A7:6 | A7:6 | Dm:6 | Dm:6 | Dm:6 | Dm:6 | Bb:6 | Gm:6 | A7:6 | A7:6';
const D_CALL = `
  D5:1 D5 A5:1 r:3 | r:6 | D5:1 D5 A5:1 r:3 | r:6 | D5:1 D5 F5:1 r:3 | r:6 | C#5:1 C#5 E5:1 r:3 | r:6 |
  D5:1 D5 A5 G5 F5 E5 | F5:1 E5 D5 A5:3 | D5:1 D5 A5 G5 F5 E5 | F5:1 E5 D5 A5:3 | Bb5:1 A5 G5 F5 E5 D5 | G5:1 F5 E5 D5 C5 Bb4 | A4:1 C#5 E5 G5 A5 C#6 | E6:3 r:3 |`;
const D_RESP = `
  r:6 | r:3 G5:1 F5 E5 | r:6 | r:3 G5:1 F5 E5 | r:6 | r:3 F5:1 E5 D5 | r:6 | r:3 E5:1 D5 C#5 |`;

const TURN_CH = 'A7:6 | A7:6 | A7:6 | A7:6 | A7:6 | A7:6 | A7:6 | A7:6';
const TURN_MEL = `
  E5:1 F5 E5 D5 C#5 D5 | E5:1 F5 E5 D5 C#5 D5 | E5:1 F5 G5 A5 Bb5 A5 | G5:1 F5 E5 D5 C#5 A4 |
  E5:1 F5 E5 D5 C#5 D5 | E5:1 F5 E5 D5 C#5 D5 | E5:1 F5 G5 A5 Bb5 C#6 | E6:2 C#6:1 A5:2 r:1 |`;

const OOM = '1:2 r:1 5:2 r:1 | 1:2 r:1 5:2 r:1 | 1:2 r:1 5:2 r:1 | 1:2 r:1 5:2 a:1';
const PAH = 'r:2 c:1 r:2 c:1';
const PAPA = 'r:1 c:1 c:1 r:1 c:1 c:1';
const OSTI = '0:1 1 2 3 2 1';
const PANS = { P: { v: 0.8, vr: 0 }, p: { v: 0.6, vr: 1 } };

export const kitchen: SongDef = {
  id: 'kitchen',
  bpm: 148,
  stepsPerBeat: 3,
  barSteps: 6,
  scale: 'D harmonic minor',
  gainDb: -2.1,
  humanize: 0.003,
  reverb: { rt60: 1.1, size: 0.8, damp: 0.55, predelay: 0.012, er: 0.35, hp: 300, lp: 7500, wet: 1.3 },
  channels: {
    acc: { inst: 'accordion', gain: -2, pan: 0.05, send: 0.15 },
    accH: { inst: 'accordionDry', gain: -11, pan: -0.3, send: 0.18 },
    mand: { inst: 'mandolin', gain: -1.5, pan: -0.32, send: 0.18 },
    mandS: { inst: 'mandolin', gain: -10, pan: 0.38, send: 0.12, hum: 0.6 },
    flute: { inst: 'flute', gain: -4, pan: 0.15, send: 0.22 },
    pizz: { inst: 'pizz', gain: -9, pan: -0.42, send: 0.12, hum: 0.5 },
    stab: { inst: 'strStab', gain: -12, pan: 0.3, send: 0.15, hum: 0.3 },
    str: { inst: 'strings', gain: -16, pan: 0, send: 0.28, hum: 0 },
    accC: { inst: 'accChord', gain: -12, pan: -0.1, send: 0.1, hum: 0.5 },
    tuba: { inst: 'tuba', gain: -5, pan: 0, send: 0.03, hum: 0.4 },
    tamb: { inst: 'tamb', gain: -5, pan: 0.28, send: 0.1, hum: 0.6 },
    pan: { inst: 'pan', gain: -15, pan: 0.45, send: 0.15, hum: 0.5 },
    timp: { inst: 'timp', gain: -7, pan: 0, send: 0.18, hum: 0 },
    glock: { inst: 'glock', gain: -17, pan: 0.4, send: 0.25 },
    riser: { inst: 'riser', gain: -15, pan: 0, send: 0.2, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: 'Dm:6 | Dm:6 | A7:6 | A7:6',
      parts: [
        cresc(arp('pizz', OSTI, { lo: 'D4', hi: 'D5', vel: 0.8, n: 3 }), 0.6, 1.0),
        bass('tuba', '1:2 r:1 5:2 r:1', { lo: 'D1', hi: 'D2', vel: 0.7, from: 2 }),
        drums('tamb', 's..s..|s.ss.s|XsxXsx|XsxR..', TAMB),
        drums('pan', 'P.....|......|P.....|p..p..', PANS),
      ],
    },
    A: {
      bars: 16,
      chords: THEME_CH,
      parts: [
        mel('acc', THEME, { vel: 0.85 }),
        bass('tuba', OOM, { lo: 'D1', hi: 'D2', vel: 0.8 }),
        comp('accC', PAH, { lo: 'A4', hi: 'F5', vel: 0.6 }),
        arp('pizz', OSTI, { lo: 'D4', hi: 'D5', vel: 0.55, n: 3 }),
        drums('tamb', 'XsxXsx', TAMB),
        drums('pan', 'P.....|......|p.....|......', PANS),
      ],
    },
    B: {
      bars: 16,
      chords: B_CH,
      parts: [
        mel('mand', B_CALL, { vel: 0.85, tremMin: 3 }),
        mel('acc', B_RESP, { vel: 0.85 }),
        bass('tuba', OOM, { lo: 'D1', hi: 'D2', vel: 0.78 }),
        comp('stab', 'C:1 r:2 c:1 r:2', { lo: 'F4', hi: 'D5', vel: 0.6 }),
        drums('tamb', 'X.xX.x|XsxXsx', TAMB),
        drums('pan', 'P.....|p.....', PANS),
      ],
    },
    A2: {
      bars: 16,
      chords: THEME_CH,
      parts: [
        mel('mand', THEME, { vel: 0.85, tremMin: 2 }),
        harm('accH', THEME, { vel: 0.62, plain: true }),
        bass('tuba', OOM, { lo: 'D1', hi: 'D2', vel: 0.82 }),
        comp('stab', PAH, { lo: 'A4', hi: 'F5', vel: 0.6 }),
        arp('pizz', OSTI, { lo: 'D4', hi: 'D5', vel: 0.5, n: 3 }),
        drums('tamb', 'XxxXxx|XsxXsx', TAMB),
        drums('pan', 'P.....|......|p.....|......', PANS),
        hits('timp', [[0, 'D2', 0.8], [24, 'D2', 0.7], [48, 'G2', 0.75], [72, 'G2', 0.7]]),
      ],
    },
    C: {
      bars: 8,
      chords: C_CH,
      parts: [
        cresc(mel('acc', C_MEL, { vel: 0.8 }), 0.75, 1.1),
        cresc(mel('mand', C_MEL, { vel: 0.7, oct: 1 }), 0.7, 1.05),
        cresc(bass('tuba', '1:2 r:1 1:2 r:1', { lo: 'D1', hi: 'Eb2', vel: 0.8 }), 0.8, 1.1),
        cresc(comp('stab', PAPA, { lo: 'G4', hi: 'Eb5', vel: 0.55 }), 0.7, 1.2),
        drums('tamb', 'XsxXsx|XxxXxx|XsxXsx|XxxXxx|XxxXxx|XxxXxx|RxxRxx|R..R..', TAMB),
        hits('timp', [
          [0, 'G2', 0.7],
          [6, 'A2', 0.72],
          [12, 'Bb2', 0.75],
          [18, 'C3', 0.78],
          [24, 'D3', 0.8],
          [30, 'Eb3', 0.85],
          ...Array.from({ length: 12 }, (_, i): [number, string, number] => [36 + i * 0.5, 'A2', 0.3 + i * 0.05]),
          [42, 'A2', 1.0],
        ]),
        hits('riser', [[36, 60, 0.9]]),
      ],
    },
    E: {
      bars: 16,
      chords: E_CH,
      parts: [
        mel('flute', E_MEL, { vel: 0.8 }),
        mel('glock', E_MEL, { vel: 0.45, minDur: 3 }),
        comp('mandS', PAPA, { lo: 'F4', hi: 'D5', vel: 0.55, strum: 0.008 }),
        bass('tuba', OOM, { lo: 'C1', hi: 'C2', vel: 0.75 }),
        pad('str', { lo: 'A4', hi: 'F5', vel: 0.4, n: 3 }),
        drums('tamb', 'x.sx.s|XsxXsx', TAMB),
      ],
    },
    D: {
      bars: 16,
      chords: D_CH,
      parts: [
        mel('acc', D_CALL, { vel: 0.88 }),
        mel('mand', D_RESP, { vel: 0.8 }),
        bass('tuba', '1:1 r:5', { lo: 'D1', hi: 'D2', vel: 0.85, to: 8 }),
        bass('tuba', OOM, { lo: 'D1', hi: 'D2', vel: 0.85, from: 8 }),
        comp('accC', PAH, { lo: 'A4', hi: 'F5', vel: 0.6, from: 8 }),
        cresc(arp('pizz', OSTI, { lo: 'D4', hi: 'D5', vel: 0.6, n: 3, from: 8 }), 0.5, 1.1),
        drums('tamb', 'X..X..|X..x..|X..X..|X..x..|X..X..|X..x..|X..X..|X.xR..|XsxXsx|XsxXsx|XsxXsx|XsxXsx|XxxXxx|XxxXxx|RxxRxx|R..R..', TAMB),
        drums('pan', 'P..p..|......|P..p..|......|P..p..|......|P..p..|......', PANS, { to: 8 }),
        hits('timp', [...Array.from({ length: 12 }, (_, i): [number, string, number] => [84 + i * 0.5, 'A2', 0.3 + i * 0.05]), [90, 'A2', 1.0]]),
        hits('riser', [[84, 60, 0.9]]),
      ],
    },
    A3: {
      bars: 16,
      chords: THEME_CH,
      parts: [
        mel('acc', THEME, { vel: 0.95 }),
        mel('mand', THEME, { vel: 0.8, tremMin: 2 }),
        harm('accH', THEME, { vel: 0.55, plain: true }),
        mel('glock', THEME, { vel: 0.45, minDur: 2 }),
        bass('tuba', OOM, { lo: 'D1', hi: 'D2', vel: 0.88 }),
        comp('accC', PAPA, { lo: 'A4', hi: 'F5', vel: 0.55 }),
        comp('stab', 'C:1 r:5', { lo: 'D4', hi: 'D5', vel: 0.7 }),
        pad('str', { lo: 'A4', hi: 'F5', vel: 0.4, n: 3 }),
        drums('tamb', 'XxxXxx|XsxXsx|XxxXxx|XsxRxx', TAMB),
        drums('pan', 'P.....|p.....', PANS),
        hits('timp', [[0, 'D2', 0.9], [48, 'G2', 0.85], [78, 'A2', 0.85], [84, 'A2', 0.85]]),
      ],
    },
    turn: {
      bars: 8,
      chords: TURN_CH,
      parts: [
        mel('acc', TURN_MEL, { vel: 0.85 }),
        cresc(mel('mand', TURN_MEL, { vel: 0.6, oct: -1 }), 0.6, 1.1),
        bass('tuba', '1:2 r:1 1:2 r:1', { lo: 'A1', hi: 'A2', vel: 0.8 }),
        cresc(comp('stab', PAPA, { lo: 'G4', hi: 'E5', vel: 0.5 }), 0.6, 1.2),
        drums('tamb', 'XsxXsx|XsxXsx|XxxXxx|XxxXxx|XxxXxx|XxxXxx|RxxRxx|R..R..', TAMB),
        hits('timp', [[0, 'A2', 0.8], [12, 'A2', 0.8], [24, 'A2', 0.85], ...Array.from({ length: 12 }, (_, i): [number, string, number] => [36 + i * 0.5, 'A2', 0.3 + i * 0.05]), [42, 'A2', 1.0]]),
        hits('riser', [[36, 60, 0.85]]),
      ],
    },
  },
  form: ['intro', 'A', 'B', 'A2', 'C', 'E', 'D', 'A3', 'turn'],
  loopFrom: 1,
};
