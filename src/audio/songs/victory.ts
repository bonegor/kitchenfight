/**
 * VICTORY — "Brindisi della Vittoria": triumphant Italian fanfare / brindisi waltz (plays once).
 * D major, 3/4, ♩ = 132, ~13 s. Brass fanfare → accordion + mandolin waltz tune → big final
 * chord with timpani roll, cymbal, glockenspiel sparkle, and a cheeky two-stab "button".
 */
import { bass, comp, hits, mel, pad, type SongDef } from '../sequencer';

const CH = 'D:6 | D:6 | A7:6 | A7:6 | D:6 | G:6 | D/A:3 A7:3 | D:6 | A7:3 D:3';
const TUNE = `
  D5:1 D5 D5 F#5:1 A5:2 | D6:4 C#6:1 B5:1 | A5:3 G5:1 E5:2 | C#5:2 E5:2 A5:2 |
  F#5:3 G5:1 A5:2 | B5:3 A5:1 G5:2 | F#5:2 A5:1 E5:2 G5:1 | D5:6 | r:6 |`;

export const victory: SongDef = {
  id: 'victory',
  bpm: 132,
  stepsPerBeat: 2,
  barSteps: 6,
  scale: 'D major',
  gainDb: -2.7,
  humanize: 0.003,
  tail: 2.6,
  reverb: { rt60: 1.8, size: 1.2, damp: 0.5, predelay: 0.02, er: 0.35, hp: 260, lp: 7500, wet: 1.5 },
  channels: {
    brass: { inst: 'brass', gain: -3, pan: 0.1, send: 0.25 },
    acc: { inst: 'accordion', gain: -3, pan: -0.1, send: 0.2 },
    mand: { inst: 'mandolin', gain: -4, pan: -0.35, send: 0.22 },
    str: { inst: 'strings', gain: -11, pan: 0, send: 0.3, hum: 0 },
    stab: { inst: 'strStab', gain: -9, pan: 0.3, send: 0.2, hum: 0 },
    gtr: { inst: 'guitar', gain: -9, pan: 0.35, send: 0.15 },
    tuba: { inst: 'tuba', gain: -5, pan: 0, send: 0.05, hum: 0 },
    timp: { inst: 'timp', gain: -5, pan: 0, send: 0.2, hum: 0 },
    crash: { inst: 'crash', gain: -12, pan: -0.2, send: 0.25, hum: 0 },
    glock: { inst: 'glock', gain: -12, pan: 0.4, send: 0.3, hum: 0 },
    tri: { inst: 'triangle', gain: -16, pan: 0.45, send: 0.3, hum: 0 },
    tamb: { inst: 'tamb', gain: -8, pan: 0.28, send: 0.1, hum: 0.5 },
  },
  sections: {
    main: {
      bars: 9,
      chords: CH,
      parts: [
        mel('brass', 'D5:1 D5 D5 F#5:1 A5:2 | D6:6 | r:6 | r:6 | r:6 | r:6 | r:6 | D5:6 | r:1 A4:1 r:1 D5:1 r:2 |', { vel: 0.95 }),
        mel('acc', TUNE, { vel: 0.85 }),
        mel('mand', TUNE, { vel: 0.7, oct: 1, tremMin: 2 }),
        mel('glock', 'r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | D6:1 F#6 A6 D7:3 | r:6 |', { vel: 0.7 }),
        pad('str', { lo: 'F#4', hi: 'D5', vel: 0.55, n: 3, to: 8 }),
        comp('stab', 'r:6 | r:6 | r:2 c:2 c:2 | r:2 c:2 c:2 | r:2 c:2 c:2 | r:2 c:2 c:2 | r:2 c:2 c:2 | C:6 | r:1 C:1 r:1 C:1 r:2', { lo: 'F#4', hi: 'D5', vel: 0.6 }),
        comp('gtr', 'r:2 c:2 c:2', { lo: 'D3', hi: 'D4', vel: 0.6, strum: 0.012, from: 2, to: 7 }),
        bass('tuba', '1:2 r:4', { lo: 'D1', hi: 'D2', vel: 0.85, from: 2, to: 7 }),
        hits('tuba', [[42, 'D2', 0.9, 6], [49, 'A1', 0.9, 1], [51, 'D2', 1.0, 2]]),
        hits('timp', [
          [0, 'D2', 0.9],
          [6, 'A2', 0.95],
          ...Array.from({ length: 10 }, (_, i): [number, string, number] => [36 + i * 0.5, 'A2', 0.3 + i * 0.06]),
          [42, 'D2', 1.0],
          [49, 'A2', 0.9],
          [51, 'D2', 1.0],
        ]),
        hits('crash', [[6, 60, 0.8], [42, 60, 0.9]]),
        hits('tri', [[12, 60, 0.6], [24, 60, 0.6], [42, 60, 0.8]]),
        hits('tamb', [[12, 60, 0.6], [18, 60, 0.6], [24, 60, 0.6], [30, 60, 0.6], [36, 60, 0.7], [42, 60, 0.9]], 4),
      ],
    },
  },
  form: ['main'],
  loopFrom: null,
};
