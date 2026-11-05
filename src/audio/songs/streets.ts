/**
 * STREETS (stage 3, I Vicoli di Napoli, sunset → night) — "Vespa al Tramonto".
 * Italo-disco meets Napoli: four-on-the-floor, octave-bouncing synth bass, claps, open hats,
 * mandolin + musette-accordion hooks, a Neapolitan (bII = Db) cadence in the B section.
 * C minor, 4/4, 120 bpm. Form: intro(4) A(8) B(8) A2(8) C(8, breakdown) B2(8) A3(8) → loop to A.
 */
import { arp, bass, comp, cresc, drums, harm, hits, mel, pad, type SongDef } from '../sequencer';

const A_CH = 'Cm:16 | Ab:16 | Eb:16 | Bb:16 | Cm:16 | Ab:16 | Eb:16 | Bb:16';
const HOOK = `
  Eb5:4 D5:2 C5:2 G5:8 | Ab5:4 G5:2 F5:2 Eb5:8 | G5:4 F5:2 Eb5:2 Bb5:6 G5:2 | F5:6 D5:2 Bb4:8 |
  Eb5:4 D5:2 C5:2 G5:8 | C6:4 Bb5:2 Ab5:2 Eb5:8 | G5:4 Ab5:2 G5:2 F5:4 Eb5:4 | D5:6 Eb5:2 F5:8 |`;

const B_CH = 'Fm:16 | Db:16 | G7:16 | Cm:16 | Fm:16 | Db:16 | G7:16 | Cm:16';
const B_MEL = `
  C5:2 F5:2 Ab5:2 C6:2 Bb5:4 Ab5:4 | Ab5:4 F5:2 Db5:2 F5:8 | G5:2 F5:2 D5:2 B4:2 D5:4 F5:4 | Eb5:8 r:8 |
  C5:2 F5:2 Ab5:2 C6:2 Db6:4 C6:4 | Bb5:4 Ab5:2 F5:2 Db5:8 | B4:2 D5:2 F5:2 Ab5:2 G5:4 F5:4 | Eb5:4 D5:2 B4:2 C5:8 |`;

const C_CH = 'Ab:16 | Fm:16 | Db:16 | G7:16 | Ab:16 | Fm:16 | Db:16 | G7:16';
const C_MEL = `
  C5:8 Eb5:4 Ab5:4 | F5:8 C5:8 | Db5:8 F5:4 Ab5:4 | G5:8 D5:8 |
  C6:8 Bb5:4 Ab5:4 | Ab5:8 F5:8 | F5:4 Ab5:4 Db6:8 | B5:8 D6:8 |`;

const KICK = 'k...k...k...k...';
const CLAP = '....c.......c...';
const HATO = '..o...o...o...o.';
const HATC = 'h.h.h.h.h.h.h.h.';
const SHAK = 'ssssssssssssssss';
const OCT = '1:2 8:2 1:2 8:2 1:2 8:2 1:2 8:2';
const ARP = '0:1 1 2 3 2 1 0 1 2 3 2 1 0 2 1 3';
const D = {
  k: { v: 0.95 },
  c: { v: 0.85, vr: [0, 1] },
  o: { v: 0.6, vr: [0, 1] },
  h: { v: 0.45, vr: [0, 1] },
  s: { v: 0.4, vr: [0, 1] },
  x: { v: 0.62, vr: [0, 1] },
  X: { v: 0.9, vr: [4, 5] },
};

export const streets: SongDef = {
  id: 'streets',
  bpm: 120,
  stepsPerBeat: 4,
  barSteps: 16,
  scale: 'C harmonic minor',
  gainDb: -1.0,
  humanize: 0.002,
  reverb: { rt60: 1.3, size: 0.95, damp: 0.5, predelay: 0.025, er: 0.4, hp: 320, lp: 7000, wet: 1.3 },
  channels: {
    kick: { inst: 'kick', gain: -11, pan: 0, send: 0.0, hum: 0 },
    clap: { inst: 'clap', gain: -10, pan: 0.05, send: 0.25, hum: 0 },
    hatO: { inst: 'hatO', gain: -15, pan: 0.3, send: 0.08, hum: 0 },
    hatC: { inst: 'hatC', gain: -17, pan: -0.25, send: 0.05, hum: 0 },
    shak: { inst: 'shaker', gain: -20, pan: 0.4, send: 0.05, hum: 0.5 },
    tamb: { inst: 'tamb', gain: -12, pan: -0.35, send: 0.1, hum: 0.5 },
    sbass: { inst: 'synthBass', gain: -8, pan: 0, send: 0.0, hum: 0 },
    pad: { inst: 'synthPad', gain: -16, pan: 0, send: 0.3, hum: 0 },
    arp: { inst: 'synthPluck', gain: -12, pan: 0.2, send: 0.25, hum: 0 },
    lead: { inst: 'synthLead', gain: -8, pan: -0.15, send: 0.25 },
    mand: { inst: 'mandolin', gain: -1, pan: -0.2, send: 0.2 },
    acc: { inst: 'accordion', gain: -3, pan: 0.15, send: 0.2 },
    accH: { inst: 'accordionDry', gain: -11, pan: 0.35, send: 0.2 },
    stab: { inst: 'strStab', gain: -13, pan: 0.25, send: 0.25, hum: 0 },
    glock: { inst: 'glock', gain: -18, pan: 0.4, send: 0.3 },
    choir: { inst: 'choir', gain: -18, pan: 0, send: 0.35, hum: 0 },
    crash: { inst: 'crash', gain: -18, pan: -0.2, send: 0.2, hum: 0 },
    riser: { inst: 'riser', gain: -14, pan: 0, send: 0.25, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: 'Cm:16 | Ab:16 | Eb:16 | Bb:16',
      parts: [
        drums('kick', KICK, D),
        drums('hatC', HATC, D, { from: 2 }),
        drums('clap', CLAP, D, { from: 2 }),
        cresc(bass('sbass', OCT, { lo: 'C2', hi: 'C3', vel: 0.8 }), 0.6, 1.0),
        cresc(pad('pad', { lo: 'G4', hi: 'Eb5', vel: 0.5, n: 3 }), 0.3, 0.8),
        hits('riser', [[32, 60, 0.7]]),
      ],
    },
    A: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('mand', HOOK, { vel: 0.85, tremMin: 6 }),
        drums('kick', KICK, D),
        drums('clap', CLAP, D),
        drums('hatO', HATO, D),
        drums('hatC', HATC, D),
        bass('sbass', OCT, { lo: 'C2', hi: 'C3', vel: 0.85 }),
        pad('pad', { lo: 'G4', hi: 'Eb5', vel: 0.55, n: 3 }),
        arp('arp', ARP, { lo: 'C5', hi: 'C6', vel: 0.55, n: 3 }),
        hits('crash', [[0, 60, 0.6]]),
      ],
    },
    B: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('acc', B_MEL, { vel: 0.85 }),
        drums('kick', KICK, D),
        drums('clap', CLAP, D),
        drums('hatO', HATO, D),
        drums('shak', SHAK, D),
        drums('tamb', '....x.......X...', D),
        bass('sbass', OCT, { lo: 'C2', hi: 'C3', vel: 0.85 }),
        pad('pad', { lo: 'Ab4', hi: 'F5', vel: 0.55, n: 3 }),
        comp('stab', 'r:2 c:2 r:2 c:2 r:2 c:2 r:2 c:2', { lo: 'F4', hi: 'Db5', vel: 0.5 }),
      ],
    },
    A2: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('mand', HOOK, { vel: 0.85, tremMin: 6 }),
        mel('lead', HOOK, { vel: 0.55, oct: -1 }),
        harm('accH', HOOK, { vel: 0.55, plain: true }),
        drums('kick', KICK, D),
        drums('clap', CLAP, D),
        drums('hatO', HATO, D),
        drums('hatC', HATC, D),
        drums('tamb', '....x.......X...', D),
        bass('sbass', OCT, { lo: 'C2', hi: 'C3', vel: 0.88 }),
        pad('pad', { lo: 'G4', hi: 'Eb5', vel: 0.55, n: 3 }),
        arp('arp', ARP, { lo: 'C5', hi: 'C6', vel: 0.6, n: 3 }),
        mel('glock', HOOK, { vel: 0.4, oct: 1, minDur: 8 }),
      ],
    },
    C: {
      bars: 8,
      chords: C_CH,
      parts: [
        mel('acc', C_MEL, { vel: 0.75 }),
        pad('choir', { lo: 'Ab4', hi: 'F5', vel: 0.55, n: 3 }),
        pad('pad', { lo: 'C4', hi: 'Ab4', vel: 0.5, n: 3 }),
        bass('sbass', '1:4 r:4 1:4 r:4', { lo: 'C2', hi: 'C3', vel: 0.7, to: 4 }),
        cresc(bass('sbass', OCT, { lo: 'C2', hi: 'C3', vel: 0.8, from: 4 }), 0.7, 1.0),
        drums('hatC', HATC, D, { to: 4 }),
        drums('kick', KICK, D, { from: 4 }),
        drums('clap', '....c.......c...|....c.......c...|....c.......c...|....c...c.c.cccc', D, { from: 4 }),
        cresc(arp('arp', ARP, { lo: 'C5', hi: 'C6', vel: 0.6, n: 3, from: 4 }), 0.3, 1.0),
        hits('riser', [[96, 60, 0.85]]),
      ],
    },
    B2: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('acc', B_MEL, { vel: 0.9 }),
        mel('mand', B_MEL, { vel: 0.7, oct: 1, tremMin: 8 }),
        drums('kick', KICK, D),
        drums('clap', CLAP, D),
        drums('hatO', HATO, D),
        drums('hatC', HATC, D),
        drums('tamb', '....x.......X...', D),
        bass('sbass', OCT, { lo: 'C2', hi: 'C3', vel: 0.88 }),
        pad('pad', { lo: 'Ab4', hi: 'F5', vel: 0.55, n: 3 }),
        comp('stab', 'r:2 c:2 r:2 c:2 r:2 c:2 r:2 c:2', { lo: 'F4', hi: 'Db5', vel: 0.55 }),
        arp('arp', ARP, { lo: 'C5', hi: 'C6', vel: 0.5, n: 3 }),
        hits('crash', [[0, 60, 0.6]]),
      ],
    },
    A3: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('mand', HOOK, { vel: 0.9, tremMin: 6 }),
        mel('acc', HOOK, { vel: 0.6, oct: -1 }),
        mel('lead', HOOK, { vel: 0.5, minDur: 4 }),
        drums('kick', KICK, D),
        drums('clap', CLAP, D),
        drums('hatO', HATO, D),
        drums('hatC', HATC, D),
        drums('shak', SHAK, D),
        drums('tamb', '....x.......X...', D),
        bass('sbass', OCT, { lo: 'C2', hi: 'C3', vel: 0.9 }),
        pad('pad', { lo: 'G4', hi: 'Eb5', vel: 0.55, n: 3 }),
        arp('arp', ARP, { lo: 'C5', hi: 'C6', vel: 0.6, n: 3 }),
        comp('stab', 'r:2 c:2 r:2 c:2 r:2 c:2 r:2 c:2', { lo: 'G4', hi: 'Eb5', vel: 0.5 }),
        hits('crash', [[0, 60, 0.6]]),
      ],
    },
  },
  form: ['intro', 'A', 'B', 'A2', 'C', 'B2', 'A3'],
  loopFrom: 1,
};
