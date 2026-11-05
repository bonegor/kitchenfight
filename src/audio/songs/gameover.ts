/**
 * GAME OVER — "Lamento con Wah-Wah": sad-comic accordion lament (A minor) that collapses into a
 * muted-brass "wah-wah-wah-waaah" (plays once, ~9 s). 4/4, ♩ = 104.
 */
import { bass, comp, hits, mel, type SongDef } from '../sequencer';

export const gameover: SongDef = {
  id: 'gameover',
  bpm: 104,
  stepsPerBeat: 2,
  barSteps: 8,
  scale: 'A harmonic minor',
  gainDb: -0.6,
  humanize: 0.006,
  tail: 2.4,
  reverb: { rt60: 1.5, size: 1.0, damp: 0.45, predelay: 0.02, er: 0.3, hp: 250, lp: 6500, wet: 1.4 },
  channels: {
    acc: { inst: 'accordion', gain: -3, pan: 0, send: 0.22 },
    accC: { inst: 'accChord', gain: -12, pan: -0.2, send: 0.2, hum: 0.5 },
    bass: { inst: 'ubass', gain: -6, pan: 0, send: 0.06 },
    wah: { inst: 'wah', gain: -2, pan: 0.1, send: 0.2, hum: 0 },
    tuba: { inst: 'tuba', gain: -8, pan: 0, send: 0.05, hum: 0 },
  },
  sections: {
    main: {
      bars: 3,
      chords: 'Am:8 | Dm:4 E7:4 | E7:8',
      parts: [
        mel('acc', '{F5}E5:3 D5:1 C5:2 B4:2 | A4:3 F4:1 {F4}E4:4 | r:8 |', { vel: 0.8 }),
        comp('accC', 'r:2 c:2 r:2 c:2 | r:2 c:2 r:2 c:2', { lo: 'E4', hi: 'C5', vel: 0.55, to: 2 }),
        bass('bass', '1:4 5:4 | 1:4 1:4', { lo: 'E2', hi: 'E3', vel: 0.7, to: 2 }),
        hits('wah', [[16, 'B3', 0.85, 1.5], [17.5, 'Bb3', 0.85, 1.5], [19, 'A3', 0.85, 1.5]], 0),
        hits('wah', [[20.5, 'Ab3', 0.95, 7]], 1),
        hits('tuba', [[20.5, 'Ab1', 0.6, 3]]),
      ],
    },
  },
  form: ['main'],
  loopFrom: null,
};
