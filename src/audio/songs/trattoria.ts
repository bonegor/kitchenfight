/**
 * TRATTORIA (stage 2, night in the dining room) — "Serenata a Mezzanotte".
 * Romantic-but-energetic Neapolitan mandolin song. E minor → G major, 12/8, ♩. = 112.
 * Mandolin tremolo lead, violin counter-melody, nylon guitar arpeggios, upright bass, strings.
 * Form: intro(2) A(8) A2(8) B(8, G major) B2(8) C(8, bridge) A3(8) → loop to A.
 */
import { arp, bass, comp, cresc, drums, harm, hits, mel, pad, type SongDef } from '../sequencer';
import { TAMB } from './title';

const A_MEL = `
  E5:5 F#5:1 G5:3 B5:3 | C6:5 B5:1 A5:3 F#5:3 | G5:3 F#5:2 E5:1 B4:6 | E5:3 G5:2 E5:1 D#5:6 |
  E5:5 F#5:1 G#5:3 B5:3 | C6:5 B5:1 A5:3 E5:3 | F5:3 A5:2 C6:1 B5:3 A5:2 D#5:1 | E5:9 B4:3 |`;
const A_CH = 'Em:12 | Am:6 B7:6 | Em:12 | C:6 B7:6 | Em:6 E7:6 | Am:12 | F/A:6 B7:6 | Em:12';

const B_MEL = `
  D5:3 G5:3 B5:5 A5:1 | A5:3 F#5:3 D5:6 | B4:3 D5:3 G5:5 F#5:1 | E5:6 Eb5:6 |
  D5:3 G5:3 B5:5 C6:1 | B5:3 G#5:3 E5:6 | A5:3 C6:3 F#5:3 A5:3 | G5:9 D5:3 |`;
const B_CH = 'G:12 | D7:12 | G:12 | C:6 Cm:6 | G/D:12 | E7:12 | Am:6 D7:6 | G:12';

const C_MEL = `
  E5:3 A5:3 C6:3 B5:2 A5:1 | G5:6 E5:6 | F5:3 A5:3 C6:3 A5:2 F5:1 | D#5:6 F#5:6 |
  C6:3 B5:2 A5:1 E5:6 | G5:3 F#5:2 E5:1 B4:6 | A5:3 F#5:2 C5:1 B4:3 D#5:3 | F#5:6 A5:3 D#5:3 |`;
const C_CH = 'Am:12 | Em:12 | F:12 | B7:12 | Am:12 | Em/G:12 | F#m7b5:6 B7:6 | B7:12';

const GTR = '0:1 1 2 3 2 1 0 1 2 3 2 1';
const BASS = '1:3 r:3 5:3 r:3';
const SHAKE = '..s..x..s..x';

export const trattoria: SongDef = {
  id: 'trattoria',
  bpm: 112,
  stepsPerBeat: 3,
  barSteps: 12,
  scale: 'E harmonic minor',
  gainDb: -0.6,
  humanize: 0.006,
  reverb: { rt60: 1.6, size: 1.05, damp: 0.45, predelay: 0.02, er: 0.3, hp: 260, lp: 6500, wet: 1.5 },
  channels: {
    mand: { inst: 'mandolin', gain: -1, pan: -0.22, send: 0.22 },
    mandH: { inst: 'mandolin', gain: -7, pan: 0.3, send: 0.22 },
    vln: { inst: 'violin', gain: -4, pan: 0.25, send: 0.28 },
    vlnH: { inst: 'violin', gain: -10, pan: 0.32, send: 0.3 },
    acc: { inst: 'accordion', gain: -3, pan: 0.05, send: 0.2 },
    accP: { inst: 'accordionDry', gain: -18, pan: -0.25, send: 0.25, hum: 0 },
    gtr: { inst: 'guitar', gain: -7, pan: 0.35, send: 0.18 },
    bass: { inst: 'ubass', gain: -4, pan: 0, send: 0.06 },
    str: { inst: 'strings', gain: -14, pan: 0, send: 0.3, hum: 0 },
    stab: { inst: 'strStab', gain: -12, pan: -0.3, send: 0.2, hum: 0.3 },
    tamb: { inst: 'tamb', gain: -11, pan: 0.3, send: 0.12, hum: 0.6 },
    glock: { inst: 'glock', gain: -18, pan: 0.4, send: 0.3 },
    timp: { inst: 'timp', gain: -8, pan: 0, send: 0.2, hum: 0 },
  },
  sections: {
    intro: {
      bars: 2,
      chords: 'Em:12 | B7:12',
      parts: [
        arp('gtr', GTR, { lo: 'E3', hi: 'E4', vel: 0.72, n: 4 }),
        bass('bass', BASS, { lo: 'E2', hi: 'E3', vel: 0.75 }),
        mel('mand', 'r:12 | F#5~:6 D#5~:3 B4:3 |', { vel: 0.7 }),
      ],
    },
    A: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('mand', A_MEL, { vel: 0.85, tremMin: 3 }),
        arp('gtr', GTR, { lo: 'E3', hi: 'E4', vel: 0.68, n: 4 }),
        bass('bass', BASS, { lo: 'E2', hi: 'E3', vel: 0.78 }),
        pad('str', { lo: 'G4', hi: 'E5', vel: 0.35, n: 3 }),
        drums('tamb', SHAKE, TAMB, { vel: 0.8 }),
      ],
    },
    A2: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('mand', A_MEL, { vel: 0.85, tremMin: 3 }),
        harm('vln', A_MEL, { vel: 0.62, sixth: true, plain: true }),
        arp('gtr', GTR, { lo: 'E3', hi: 'E4', vel: 0.68, n: 4 }),
        bass('bass', BASS, { lo: 'E2', hi: 'E3', vel: 0.8 }),
        pad('accP', { lo: 'G4', hi: 'D5', vel: 0.5, n: 3 }),
        drums('tamb', SHAKE, TAMB, { vel: 0.9 }),
      ],
    },
    B: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('vln', B_MEL, { vel: 0.85 }),
        harm('mandH', B_MEL, { vel: 0.7, tremMin: 3, plain: true }),
        arp('gtr', GTR, { lo: 'D3', hi: 'D4', vel: 0.68, n: 4 }),
        bass('bass', BASS, { lo: 'D2', hi: 'D3', vel: 0.8 }),
        pad('str', { lo: 'G4', hi: 'E5', vel: 0.38, n: 3 }),
        drums('tamb', SHAKE, TAMB, { vel: 0.9 }),
        mel('glock', B_MEL, { vel: 0.4, minDur: 5 }),
      ],
    },
    B2: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('mand', B_MEL, { vel: 0.88, tremMin: 3 }),
        mel('vlnH', B_MEL, { vel: 0.7, plain: true }),
        harm('accP', B_MEL, { vel: 0.55, plain: true }),
        comp('gtr', 'c:3 r:3 c:3 c:3', { lo: 'D3', hi: 'D4', vel: 0.6, strum: 0.014 }),
        bass('bass', '1:3 r:2 5:1 1:3 5:3', { lo: 'D2', hi: 'D3', vel: 0.82 }),
        pad('str', { lo: 'G4', hi: 'E5', vel: 0.42, n: 3 }),
        drums('tamb', 'X.sx.sX.sx.s', TAMB, { vel: 0.9 }),
      ],
    },
    C: {
      bars: 8,
      chords: C_CH,
      parts: [
        mel('acc', C_MEL, { vel: 0.88 }),
        cresc(comp('stab', 'C:1 r:2 c:1 r:2 c:1 r:2 c:1 r:2', { lo: 'E4', hi: 'C5', vel: 0.55 }), 0.7, 1.2),
        bass('bass', BASS, { lo: 'E2', hi: 'E3', vel: 0.85 }),
        pad('str', { lo: 'A4', hi: 'F5', vel: 0.45, n: 3 }),
        drums('tamb', 'X.sx.sX.sx.s|X.sx.sX.sx.s|X.sx.sX.sx.s|X.sx.sR..R..', TAMB),
        hits('timp', [[0, 'A2', 0.7], [24, 'F2', 0.7], [36, 'B2', 0.8], [48, 'A2', 0.7], ...Array.from({ length: 12 }, (_, i): [number, string, number] => [84 + i, 'B2', 0.3 + i * 0.05])]),
      ],
    },
    A3: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('mand', A_MEL, { vel: 0.9, tremMin: 3 }),
        mel('vlnH', A_MEL, { vel: 0.7, oct: -1, plain: true }),
        mel('glock', A_MEL, { vel: 0.42, minDur: 5 }),
        arp('gtr', GTR, { lo: 'E3', hi: 'E4', vel: 0.7, n: 4 }),
        bass('bass', BASS, { lo: 'E2', hi: 'E3', vel: 0.82 }),
        pad('str', { lo: 'G4', hi: 'E5', vel: 0.45, n: 3 }),
        drums('tamb', 'X.sx.sX.sx.s', TAMB),
      ],
    },
  },
  form: ['intro', 'A', 'A2', 'B', 'B2', 'C', 'A3'],
  loopFrom: 1,
};
