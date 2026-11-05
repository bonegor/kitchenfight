/**
 * MENU — "Valzer della Trattoria": cosy trattoria waltz.
 * G major, 3/4, ♩ = 92. Mandolin (tremolo) melody, nylon guitar arpeggios, soft accordion pad,
 * upright bass; a musette accordion takes the E-minor middle section.
 * Form: intro(2) A(16) B(8, E minor) A2(8, mandolin + accordion in thirds) → loop to A.
 */
import { arp, bass, comp, harm, mel, pad, type SongDef } from '../sequencer';

const A_MEL_1 = `
  D5:4 B4:2 | E5:4 B4:2 | C5:2 E5:2 A5:2 | G5:4 F#5:2 |
  D5:4 B4:2 | G#4:2 B4:2 E5:2 | A5:4 G5:2 | F#5:2 E5:2 C5:2 |`;
const A_MEL_2 = `
  B4:4 D5:2 | G5:4 F5:2 | E5:4 C5:2 | Eb5:4 C5:2 |
  D5:4 B4:2 | E5:2 D5:2 B4:2 | C5:2 A4:2 F#4:2 | G4:2 B4:2 C5:2 |`;
const A_CH_1 = 'G:6 | Em:6 | Am7:6 | D7:6 | G:6 | E7:6 | Am:6 | D7:6';
const A_CH_2 = 'G:6 | G7:6 | C:6 | Cm:6 | G/D:6 | E7:6 | Am7:4 D7:2 | G:6';

const B_MEL = `
  E5:4 F#5:1 G5:1 | A5:4 G5:1 F#5:1 | F#5:2 E5:2 D5:2 | D5:4 B4:2 |
  C5:4 D5:1 E5:1 | A5:4 D#5:2 | E5:4 B4:2 | C5:2 B4:2 A4:2 |`;
const B_CH = 'Em:6 | Am:6 | D7:6 | G:6 | C:6 | F#m7b5:4 B7:2 | Em:6 | D7:6';

const GTR_ARP = '0:2 1:1 2:1 3:1 2:1';
const BASS = '1:2 r:4 | 5-:2 r:4';

export const menu: SongDef = {
  id: 'menu',
  bpm: 92,
  stepsPerBeat: 2,
  barSteps: 6,
  scale: 'G major',
  gainDb: 0,
  humanize: 0.006,
  reverb: { rt60: 1.7, size: 1.1, damp: 0.45, predelay: 0.022, er: 0.3, hp: 240, lp: 6500, wet: 0.9 },
  channels: {
    mand: { inst: 'mandolin', gain: -1, pan: -0.12, send: 0.22 },
    acc: { inst: 'accordion', gain: -4, pan: 0.1, send: 0.2 },
    accH: { inst: 'accordionDry', gain: -10, pan: 0.32, send: 0.2 },
    pad: { inst: 'accordionDry', gain: -19, pan: -0.3, send: 0.25, hum: 0 },
    gtr: { inst: 'guitar', gain: -7, pan: 0.3, send: 0.18 },
    bass: { inst: 'ubass', gain: -4, pan: 0, send: 0.06 },
    whistle: { inst: 'whistle', gain: -15, pan: -0.35, send: 0.3 },
  },
  sections: {
    intro: {
      bars: 2,
      chords: 'G:6 | D7:6',
      parts: [arp('gtr', GTR_ARP, { lo: 'G3', hi: 'G4', vel: 0.7, n: 4 }), bass('bass', BASS, { lo: 'D2', hi: 'D3', vel: 0.75 }), mel('mand', 'r:6 | r:2 B4:2 C5:2 |', { vel: 0.7 })],
    },
    A: {
      bars: 16,
      chords: `${A_CH_1} | ${A_CH_2}`,
      parts: [
        mel('mand', A_MEL_1 + A_MEL_2, { vel: 0.8, tremMin: 4 }),
        arp('gtr', GTR_ARP, { lo: 'G3', hi: 'G4', vel: 0.68, n: 4 }),
        bass('bass', BASS, { lo: 'D2', hi: 'D3', vel: 0.78 }),
        pad('pad', { lo: 'D4', hi: 'B4', vel: 0.5, n: 3 }),
      ],
    },
    B: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('acc', B_MEL, { vel: 0.78 }),
        comp('gtr', 'r:2 c:2 c:2', { lo: 'G3', hi: 'E4', vel: 0.6, strum: 0.014 }),
        bass('bass', BASS, { lo: 'D2', hi: 'D3', vel: 0.78 }),
        mel('mand', 'r:6 | r:6 | r:6 | r:2 G5:2 A5:2 | r:6 | r:6 | r:6 | r:2 D5:2 E5:2 |', { vel: 0.55 }),
      ],
    },
    A2: {
      bars: 8,
      chords: A_CH_2,
      parts: [
        mel('mand', A_MEL_2, { vel: 0.82, tremMin: 4 }),
        harm('accH', A_MEL_2, { vel: 0.62 }),
        mel('whistle', A_MEL_2, { vel: 0.6, oct: 1, minDur: 4 }),
        arp('gtr', GTR_ARP, { lo: 'G3', hi: 'G4', vel: 0.68, n: 4 }),
        bass('bass', BASS, { lo: 'D2', hi: 'D3', vel: 0.78 }),
        pad('pad', { lo: 'D4', hi: 'B4', vel: 0.45, n: 3 }),
      ],
    },
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};
