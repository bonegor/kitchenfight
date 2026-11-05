/**
 * FOODCOURT (stage 4, the crimes' lair) — "Muzak Maledetta".
 * Starts as cheesy elevator muzak (B♭ major: FM e-piano, vibes, bossa bass) playing the main
 * theme's hook… then the loop corrupts it: B♭ minor, tape-warbled detuned lead, bit-crushed
 * robot arps, a tritone (E major) chord, glitch stutters and tape-stop runs. 4/4, 128 bpm.
 * Form: intro(4, muzak — not looped) A(8) B(8) C(8, half-time dread) A2(8) D(8, muzak relapse
 *       → collapse) B2(8) → loop to A.
 */
import { arp, bass, comp, cresc, drums, hits, mel, pad, type SongDef } from '../sequencer';

const MUZAK_CH = 'Bb:16 | Gm7:16 | Cm7:16 | F7:16';
const MUZAK_MEL = `
  Bb4:4 F5:2 Eb5:2 D5:2 C5:2 D5:4 | D5:2 C5:2 Bb4:2 G5:6 r:4 | C5:4 G5:2 F5:2 Eb5:2 D5:2 Eb5:4 | F5:2 Eb5:2 C5:2 A4:4 r:6 |`;

const A_CH = 'Bbm:16 | Gb:16 | Ebm:16 | F7:16 | Bbm:16 | Gb:16 | Ebm:8 E:8 | F7:16';
const A_MEL = `
  Bb4:4 F5:2 Eb5:2 Db5:2 C5:2 Db5:4 | Db5:2 C5:2 Bb4:2 Gb5:6 r:4 | Eb5:4 Bb5:2 Ab5:2 Gb5:2 F5:2 Gb5:4 | A4:2 C5:2 Eb5:2 E5:6 r:4 |
  Bb4:4 F5:2 Eb5:2 Db5:2 C5:2 Db5:4 | Db5:2 C5:2 Bb4:2 Bb5:6 r:4 | Gb5:2 Eb5:2 Bb4:2 Gb4:2 G#4:4 B4:4 | A4:12 r:4 |`;

const B_CH = 'Ebm:16 | Bbm:16 | Gb:16 | F7:16 | Ebm:16 | Bbm:16 | Cb:16 | F7:16';
const B_MEL = `
  Gb5:4 F5:2 Eb5:2 Bb4:8 | Db5:4 C5:2 Bb4:2 F4:8 | Gb4:2 Bb4:2 Db5:2 F5:2 Gb5:4 F5:4 | Eb5:4 C5:4 A4:8 |
  Gb5:4 F5:2 Eb5:2 Bb5:8 | Ab5:4 F5:2 Db5:2 F5:8 | Gb5:4 Eb5:4 Cb5:8 | C5:4 Eb5:4 A4:4 F4:4 |`;

const C_CH = 'Bbm:32 | Gb:32 | Ebm:32 | F7:32';
const C_MEL = `
  Bb4:8 F5:4 Eb5:4 | Db5:8 C5:8 | Db5:8 Bb4:4 C5:4 | Gb5:16 |
  Eb5:8 Bb5:4 Ab5:4 | Gb5:8 F5:8 | E5:8 F5:4 A4:4 | Bb5:0.5 A5 Ab5 G5 Gb5 F5 E5 Eb5 D5 Db5 C5 B4 Bb4 A4 Ab4 G4 F4:8 |`;

const D_CH = 'Bb:16 | Gm7:16 | Cm7:16 | F7:16 | Bbm:16 | Gb:16 | E:16 | F7:16';
const D_MEL_1 = MUZAK_MEL;
const D_MEL_2 = `
  Bb4:1 Bb4 Bb4 Bb4 F5:2 Eb5:2 Db5:1 Db5 Db5 Db5 C5:4 | Bb4:2 Db5:2 Gb5:2 Bb5:2 Bb5:0.5 A5 Ab5 G5 Gb5 F5 E5 Eb5 Db5:4 |
  E5:2 G#5:2 B5:2 E6:2 B5:2 G#5:2 E5:4 | A4:2 C5:2 Eb5:2 F5:2 A5:0.5 Ab5 G5 Gb5 F5 E5 Eb5 D5 Db5:2 C5:2 |`;

const KICK = 'k.......k.......';
const KICK4 = 'k...k...k...k...';
const HATS = '..h...h...h...h.';
const HAT16 = 'hhhhhhhhhhhhhhhh';
const SHAK = 's.s.s.s.s.s.s.s.';
const D = { k: { v: 0.9 }, h: { v: 0.45, vr: [0, 1] }, s: { v: 0.42, vr: [0, 1] }, c: { v: 0.75, vr: [0, 1] } };
const ROBO = '0:1 2 1 3 0 2 1 3 0 2 1 3 0 2 1 3';
const PULSE = 'r:2 1:2 r:2 1:2 r:2 1:2 r:2 1:2';

export const foodcourt: SongDef = {
  id: 'foodcourt',
  bpm: 128,
  stepsPerBeat: 4,
  barSteps: 16,
  scale: 'Bb harmonic minor',
  gainDb: 1.4,
  humanize: 0.002,
  reverb: { rt60: 1.9, size: 1.3, damp: 0.6, predelay: 0.03, er: 0.45, hp: 320, lp: 7500, wet: 1.5 },
  channels: {
    ep: { inst: 'epiano', gain: -8, pan: -0.1, send: 0.25, hum: 0.3 },
    vibes: { inst: 'vibes', gain: -7, pan: 0.2, send: 0.3 },
    warble: { inst: 'warble', gain: -4, pan: 0.05, send: 0.25 },
    lead: { inst: 'synthLead', gain: -12, pan: -0.25, send: 0.25 },
    robo: { inst: 'roboArp', gain: -10, pan: 0.35, send: 0.2, hum: 0 },
    pad: { inst: 'darkPad', gain: -18, pan: 0, send: 0.35, hum: 0 },
    choir: { inst: 'choirO', gain: -17, pan: 0, send: 0.4, hum: 0 },
    sbass: { inst: 'synthBass', gain: -11, pan: 0, send: 0.0, hum: 0 },
    ubass: { inst: 'ubass', gain: -6, pan: 0, send: 0.05 },
    kick: { inst: 'kick', gain: -13, pan: 0, send: 0.0, hum: 0 },
    hat: { inst: 'hatC', gain: -13, pan: -0.3, send: 0.05, hum: 0 },
    shak: { inst: 'shaker', gain: -16, pan: 0.35, send: 0.08, hum: 0.5 },
    clap: { inst: 'clap', gain: -14, pan: 0.1, send: 0.3, hum: 0 },
    glock: { inst: 'glock', gain: -18, pan: 0.4, send: 0.3 },
    riser: { inst: 'riser', gain: -14, pan: 0, send: 0.25, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: MUZAK_CH,
      parts: [
        mel('vibes', MUZAK_MEL, { vel: 0.75 }),
        comp('ep', 'c:3 r:3 c:2 r:3 c:3 r:2', { lo: 'F4', hi: 'D5', vel: 0.55, n: 4 }),
        bass('ubass', '1:3 r:3 5:2 1:3 r:3 5:2', { lo: 'Bb1', hi: 'Bb2', vel: 0.7 }),
        drums('shak', SHAK, D),
      ],
    },
    A: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('warble', A_MEL, { vel: 0.85 }),
        arp('robo', ROBO, { lo: 'Bb4', hi: 'Bb5', vel: 0.65, n: 4 }),
        pad('pad', { lo: 'F4', hi: 'Db5', vel: 0.55, n: 3 }),
        bass('sbass', PULSE, { lo: 'Bb1', hi: 'Bb2', vel: 0.8 }),
        drums('kick', KICK4, D),
        drums('hat', HATS, D),
        drums('shak', SHAK, D),
        drums('clap', '....c.......c...', D),
      ],
    },
    B: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('vibes', B_MEL, { vel: 0.8 }),
        mel('lead', B_MEL, { vel: 0.45 }),
        comp('ep', 'c:2 r:1 c:1 r:2 c:2 c:1 c:1 r:2 c:1 r:1 c:1 r:1', { lo: 'Gb4', hi: 'Eb5', vel: 0.55, n: 3 }),
        pad('choir', { lo: 'Gb4', hi: 'Eb5', vel: 0.5, n: 3 }),
        bass('sbass', PULSE, { lo: 'Bb1', hi: 'Bb2', vel: 0.8 }),
        drums('kick', KICK4, D),
        drums('hat', HAT16, D, { vel: 0.8 }),
        drums('clap', '....c.......c...', D),
      ],
    },
    C: {
      bars: 8,
      chords: C_CH,
      parts: [
        mel('warble', C_MEL, { vel: 0.85 }),
        mel('lead', C_MEL, { vel: 0.45, minDur: 8 }),
        pad('pad', { lo: 'F4', hi: 'Db5', vel: 0.6, n: 3 }),
        pad('choir', { lo: 'F4', hi: 'Db5', vel: 0.45, n: 3 }),
        bass('sbass', '1:4 r:12', { lo: 'Bb1', hi: 'Bb2', vel: 0.85 }),
        drums('kick', KICK, D),
        drums('hat', '....h.......h.hh', D),
        cresc(arp('robo', ROBO, { lo: 'Bb4', hi: 'Bb5', vel: 0.6, n: 4, from: 4 }), 0.3, 1.0),
        hits('riser', [[96, 60, 0.85]]),
      ],
    },
    A2: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('warble', A_MEL, { vel: 0.9 }),
        mel('lead', A_MEL, { vel: 0.55, oct: 1, minDur: 4 }),
        arp('robo', ROBO, { lo: 'Bb4', hi: 'Bb5', vel: 0.7, n: 4 }),
        comp('ep', 'r:2 c:1 r:1 r:2 c:1 r:1 r:2 c:1 r:1 r:2 c:1 c:1', { lo: 'F4', hi: 'Db5', vel: 0.5, n: 3 }),
        pad('pad', { lo: 'F4', hi: 'Db5', vel: 0.55, n: 3 }),
        bass('sbass', PULSE, { lo: 'Bb1', hi: 'Bb2', vel: 0.85 }),
        drums('kick', KICK4, D),
        drums('hat', HAT16, D, { vel: 0.85 }),
        drums('clap', '....c.......c...', D),
        mel('glock', A_MEL, { vel: 0.4, oct: 1, minDur: 6 }),
      ],
    },
    D: {
      bars: 8,
      chords: D_CH,
      parts: [
        mel('vibes', D_MEL_1, { vel: 0.78 }),
        mel('warble', D_MEL_1, { vel: 0.4 }),
        mel('warble', D_MEL_2, { vel: 0.88, at: 64 }),
        comp('ep', 'c:3 r:3 c:2 r:3 c:3 r:2', { lo: 'F4', hi: 'D5', vel: 0.5, n: 4, to: 4 }),
        bass('ubass', '1:3 r:3 5:2 1:3 r:3 5:2', { lo: 'Bb1', hi: 'Bb2', vel: 0.7, to: 4 }),
        drums('shak', SHAK, D, { to: 4 }),
        arp('robo', ROBO, { lo: 'Bb4', hi: 'Bb5', vel: 0.7, n: 4, from: 4 }),
        pad('pad', { lo: 'F4', hi: 'Db5', vel: 0.6, n: 3, from: 4 }),
        bass('sbass', PULSE, { lo: 'Bb1', hi: 'Bb2', vel: 0.85, from: 4 }),
        drums('kick', KICK4, D, { from: 4 }),
        drums('hat', HAT16, D, { from: 4, vel: 0.85 }),
        hits('riser', [[96, 60, 0.8]]),
      ],
    },
    B2: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('warble', B_MEL, { vel: 0.85 }),
        mel('vibes', B_MEL, { vel: 0.6, oct: 1, minDur: 8 }),
        arp('robo', ROBO, { lo: 'Bb4', hi: 'Bb5', vel: 0.65, n: 4 }),
        pad('choir', { lo: 'Gb4', hi: 'Eb5', vel: 0.5, n: 3 }),
        pad('pad', { lo: 'F4', hi: 'Db5', vel: 0.5, n: 3 }),
        bass('sbass', PULSE, { lo: 'Bb1', hi: 'Bb2', vel: 0.85 }),
        drums('kick', KICK4, D),
        drums('hat', HAT16, D, { vel: 0.85 }),
        drums('clap', '....c.......c...', D),
      ],
    },
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D', 'B2'],
  loopFrom: 1,
};
