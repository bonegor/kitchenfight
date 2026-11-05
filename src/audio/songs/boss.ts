/**
 * BOSS (mini-bosses) — "Dramma all'Opera": operatic drama in G minor, 4/4, 140 bpm.
 * Timpani, string ostinato, synth-brass theme, choir "aah", harpsichord, organ, tolling bell.
 * Easter egg: section C gallops on Rossini's "William Tell" figure (1829, public domain), in minor.
 * Form: intro(4) A(8) B(8) C(8, gallop) A2(8) turn(4) → loop to A.
 */
import { arp, bass, comp, cresc, drums, hits, mel, pad, type SongDef } from '../sequencer';

const A_CH = 'Gm:16 | Eb:16 | Cm:16 | D7:16 | Gm:16 | Ab:16 | D7:16 | D7:16';
const THEME = `
  G4:6 Bb4:2 D5:8 | Eb5:6 D5:2 Bb4:8 | C5:4 Eb5:4 G5:6 F5:2 | F#5:6 A5:2 D5:8 |
  G5:6 F5:2 D5:4 Bb4:4 | C5:6 Eb5:2 Ab5:8 | A5:4 F#5:4 D5:4 C5:4 | Bb4:4 A4:4 F#4:4 D4:4 |`;

const B_CH = 'Cm:16 | Gm:16 | Ab:16 | Eb:16 | Cm:16 | Gm/D:16 | Ab:16 | D7:16';
const B_MEL = `
  Eb5:8 D5:4 C5:4 | D5:8 Bb4:8 | C5:8 Eb5:4 Ab5:4 | G5:16 |
  G5:8 F5:4 Eb5:4 | D5:8 Bb4:8 | C5:4 Eb5:4 Ab5:8 | F#5:8 A5:8 |`;

const C_CH = 'Gm:16 | D7:16 | Cm:16 | Gm:16 | Eb:16 | Cm:16 | D7:16 | D7:16';
const GALLOP = `
  D5:1 D5 D5:2 D5:1 D5 D5:2 D5:1 D5 G5:2 A5:2 Bb5:2 | D5:1 D5 D5:2 D5:1 D5 D5:2 D5:1 D5 A5:2 F#5:2 D5:2 |
  G5:1 G5 G5:2 G5:1 G5 G5:2 G5:1 G5 C6:2 D6:2 Eb6:2 | D6:1 D6 D6:2 Bb5:1 Bb5 Bb5:2 G5:1 G5 D5:2 Bb4:2 G4:2 |
  Bb4:1 Bb4 Bb4:2 Eb5:1 Eb5 Eb5:2 G5:1 G5 Bb5:2 G5:2 Eb5:2 | C5:1 C5 C5:2 Eb5:1 Eb5 Eb5:2 G5:1 G5 C6:2 G5:2 Eb5:2 |
  D5:1 D5 D5:2 F#5:1 F#5 F#5:2 A5:1 A5 D6:2 C6:2 A5:2 | F#5:1 F#5 F#5:2 A5:1 A5 A5:2 D6:4 r:4 |`;

const TURN_CH = 'D7:16 | D7:16 | D7:16 | D7:16';
const TURN_MEL = `D5:1 D5 D5:2 D5:1 D5 D5:2 D5:1 D5 F#5:2 A5:2 D6:2 | C6:4 A5:4 F#5:4 D5:4 | D5:1 D5 D5:2 D5:1 D5 D5:2 D5:1 D5 F#5:2 A5:2 C6:2 | D6:8 r:8 |`;

const OSTI = '0:1 2 1 2 0 2 1 2 0 2 1 2 0 2 1 2';
const GALLOP_SN = 'x.x.xx.xx.x.xx.x';
const D = { x: { v: 0.6, vr: [0, 1] }, X: { v: 0.9, vr: [0, 1] }, r: { v: 0.35, vr: [0, 1] } };

const timpRoll = (start: number, steps: number, note: string, v0 = 0.3, v1 = 0.9): Array<[number, string, number]> =>
  Array.from({ length: steps }, (_, i): [number, string, number] => [start + i, note, v0 + ((v1 - v0) * i) / Math.max(1, steps - 1)]);

export const boss: SongDef = {
  id: 'boss',
  bpm: 140,
  stepsPerBeat: 4,
  barSteps: 16,
  scale: 'G harmonic minor',
  gainDb: -1.4,
  humanize: 0.003,
  reverb: { rt60: 2.1, size: 1.35, damp: 0.5, predelay: 0.03, er: 0.4, hp: 300, lp: 6500, wet: 1.45 },
  channels: {
    brass: { inst: 'brass', gain: -3, pan: 0.05, send: 0.25 },
    brassL: { inst: 'brassSoft', gain: -9, pan: -0.3, send: 0.25 },
    choir: { inst: 'choir', gain: -6, pan: 0, send: 0.35, hum: 0 },
    choirP: { inst: 'choir', gain: -13, pan: 0, send: 0.35, hum: 0 },
    organ: { inst: 'organ', gain: -14, pan: -0.15, send: 0.3, hum: 0 },
    stab: { inst: 'strStab', gain: -10, pan: 0.3, send: 0.2, hum: 0 },
    str: { inst: 'strings', gain: -12, pan: -0.1, send: 0.3, hum: 0 },
    harpsi: { inst: 'harpsi', gain: -10, pan: -0.35, send: 0.2, hum: 0.3 },
    pizz: { inst: 'pizz', gain: -10, pan: 0.4, send: 0.15, hum: 0.3 },
    tuba: { inst: 'tuba', gain: -6, pan: 0, send: 0.05, hum: 0.3 },
    timp: { inst: 'timp', gain: -4, pan: 0, send: 0.2, hum: 0 },
    snare: { inst: 'snare', gain: -14, pan: 0.15, send: 0.15, hum: 0.3 },
    crash: { inst: 'crash', gain: -14, pan: -0.2, send: 0.25, hum: 0 },
    bell: { inst: 'bell', gain: -11, pan: 0.25, send: 0.35, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: 'Gm:16 | Gm:16 | Gm:16 | D7:16',
      parts: [
        cresc(pad('organ', { lo: 'G3', hi: 'D5', vel: 0.7, n: 4 }), 0.5, 1.0),
        cresc(pad('choirP', { lo: 'G4', hi: 'D5', vel: 0.7, n: 3 }), 0.4, 1.0),
        hits('bell', [[0, 'G3', 0.9], [16, 'G3', 0.8], [32, 'G3', 0.85]]),
        hits('timp', [[0, 'G2', 0.9], ...timpRoll(32, 28, 'D2', 0.25, 0.8), [60, 'D2', 1.0]]),
        mel('brass', 'r:16 | r:16 | r:16 | r:8 D4:2 D4:2 D4:1 D4 G4:2 |', { vel: 0.9, free: false }),
      ],
    },
    A: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('brass', THEME, { vel: 0.9 }),
        arp('stab', OSTI, { lo: 'G4', hi: 'G5', vel: 0.6, n: 3 }),
        bass('tuba', '1:4 r:4 5:4 r:4', { lo: 'D1', hi: 'D2', vel: 0.8 }),
        hits('timp', [[0, 'G2', 0.9], [8, 'D2', 0.7], [16, 'Eb2', 0.8], [32, 'C2', 0.8], [48, 'D2', 0.85], [64, 'G2', 0.9], [80, 'Ab2', 0.8], [96, 'D2', 0.9], ...timpRoll(112, 16, 'D2', 0.3, 0.9)]),
        drums('snare', '................|................|................|............rrrr', D),
        pad('str', { lo: 'Bb4', hi: 'G5', vel: 0.45, n: 3 }),
        hits('crash', [[0, 60, 0.7]]),
      ],
    },
    B: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('choir', B_MEL, { vel: 0.85 }),
        mel('brassL', B_MEL, { vel: 0.6, oct: -1 }),
        arp('harpsi', OSTI, { lo: 'C4', hi: 'C5', vel: 0.75, n: 3 }),
        pad('organ', { lo: 'G3', hi: 'Eb4', vel: 0.5, n: 3 }),
        bass('tuba', '1:8 5:8', { lo: 'C1', hi: 'C2', vel: 0.75 }),
        hits('timp', [[0, 'C2', 0.8], [16, 'G2', 0.75], [32, 'Ab2', 0.8], [48, 'Eb2', 0.75], [64, 'C2', 0.8], [80, 'D2', 0.75], [96, 'Ab2', 0.8], [112, 'D2', 0.9]]),
        hits('bell', [[0, 'C4', 0.6], [64, 'C4', 0.6]]),
      ],
    },
    C: {
      bars: 8,
      chords: C_CH,
      parts: [
        mel('brass', GALLOP, { vel: 0.85 }),
        mel('stab', GALLOP, { vel: 0.5, oct: -1 }),
        drums('snare', GALLOP_SN, D),
        bass('tuba', '1:2 r:2 1:2 r:2 5:2 r:2 5:2 r:2', { lo: 'D1', hi: 'D2', vel: 0.8 }),
        comp('pizz', 'C:2 r:2 c:2 r:2 c:2 r:2 c:2 r:2', { lo: 'G3', hi: 'D4', vel: 0.6 }),
        hits('timp', [[0, 'G2', 0.9], [16, 'D2', 0.85], [32, 'C2', 0.85], [48, 'G2', 0.85], [64, 'Eb2', 0.85], [80, 'C2', 0.85], ...timpRoll(96, 32, 'D2', 0.3, 0.95)]),
        hits('crash', [[0, 60, 0.6], [64, 60, 0.6]]),
      ],
    },
    A2: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('brass', THEME, { vel: 0.95 }),
        mel('choir', THEME, { vel: 0.7, oct: 1, minDur: 4 }),
        arp('stab', OSTI, { lo: 'G4', hi: 'G5', vel: 0.65, n: 3 }),
        arp('harpsi', OSTI, { lo: 'D4', hi: 'D5', vel: 0.6, n: 3 }),
        pad('organ', { lo: 'G3', hi: 'D4', vel: 0.45, n: 3 }),
        bass('tuba', '1:4 r:4 5:4 r:4', { lo: 'D1', hi: 'D2', vel: 0.85 }),
        hits('timp', [[0, 'G2', 1.0], [8, 'D2', 0.75], [16, 'Eb2', 0.85], [24, 'Bb1', 0.7], [32, 'C2', 0.85], [48, 'D2', 0.9], [64, 'G2', 0.95], [80, 'Ab2', 0.85], [96, 'D2', 0.95], ...timpRoll(112, 16, 'D2', 0.3, 0.95)]),
        drums('snare', 'X...............|................|................|............rrrr', D),
        hits('crash', [[0, 60, 0.75]]),
      ],
    },
    turn: {
      bars: 4,
      chords: TURN_CH,
      parts: [
        mel('brass', TURN_MEL, { vel: 0.9 }),
        cresc(pad('choirP', { lo: 'F#4', hi: 'D5', vel: 0.7, n: 3 }), 0.5, 1.1),
        cresc(arp('stab', OSTI, { lo: 'F#4', hi: 'F#5', vel: 0.6, n: 3 }), 0.7, 1.15),
        bass('tuba', '1:4 r:4 1:4 r:4', { lo: 'D1', hi: 'D2', vel: 0.85 }),
        drums('snare', GALLOP_SN + '|' + GALLOP_SN + '|' + GALLOP_SN + '|rrrrrrrrrrrrrrrr', D),
        hits('timp', [[0, 'D2', 0.9], [16, 'D2', 0.85], [32, 'D2', 0.9], ...timpRoll(48, 16, 'D2', 0.35, 1.0)]),
      ],
    },
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'turn'],
  loopFrom: 1,
};
