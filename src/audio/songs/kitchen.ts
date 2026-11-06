/**
 * KITCHEN (stage 1, La Cucina) — "Coro di zingari", the Anvil Chorus from Verdi's Il Trovatore
 * (1853; public domain): "Vedi! le fosche notturne spoglie … Chi del gitano i giorni abbella?"
 * The gag: Verdi's anvils are the kitchen's pots and pans. The anvil and the frying pan (panClang)
 * hammer where the smiths hammer; the woodblock and the slapstick answer in the rests.
 * C major (Verdi's key; "Vedi" in the dominant, G), 4/4, ♩ = 128. Melodies transcribed from and
 * verified against "The One Hundred and One Best Songs" (1919, a tone lower, in B-flat); harmony
 * after Antoni Kątski's Grande fantaisie sur Le Trouvère op. 157 (see docs/music/kitchen.md).
 *
 * Form (bars): intro(4) the smiths alone | V(10) "Vedi! le fosche", clarinet then accordion over
 * guitar + upright bass; bar 10 = the hammer bar ("All'opra! Dàgli, martella!") | T1(8) the anvil
 * theme, accordion + clarinet over Kątski's tonic pedal, anvil on the strong beats | C1(7) the
 * close, mandolin + clarinet, woodblock in the rests | brk(4) the theme's rhythm on the pots and
 * pans alone | T2(8) tutti: trumpet, horns an octave below, Kątski's chromatic bass, anvil + pan on
 * every beat | C2(8) tutti close + turnaround → loop to V.
 */
import { comp, drums, hits, mel, type HitMap, type Part, type SongDef } from '../sequencer';

// ---------------------------------------------------------------------------------------------
// Melodies (one step = a sixteenth; a 4/4 bar = 16 steps). Concert pitch, a tone above the
// reference (col_101best.abc X:9 is in B-flat): the theme in C major, "Vedi" in G major.
// ---------------------------------------------------------------------------------------------

/** n bars of rest */
const R = (n: number): string => 'r:16 | '.repeat(n);

/** "Vedi! le fosche notturne spoglie" (ref bars 2-6, again 6-10): pickup on beat 3, ends on beat 1. */
const VEDI =
  'r:8 G4:4 D4:2 B3:2 | A4:4 F#4:2 D4:2 B4:4 G4:2 D4:2 | C5:4 A4:2 F#4:2 D5:4 B4:2 G4:2 | E5:4 C5:2 A4:2 F#4:4 G4:4 | A4:4 r:12 | ';
/** "Chi del gitano i giorni abbella?" twice (ref bars 12-19). */
const THEME =
  'E5:8 E5:6 E5:2 | E5:6 D5:2 C5:6 A4:2 | G4:6 B4:2 D5:6 F5:2 | E5:8 C5:4 r:4 | ' +
  'E5:8 E5:6 E5:2 | E5:6 D5:2 C5:6 A4:2 | G4:6 B4:2 D5:6 F5:2 | E5:4 C5:4 E5:4 r:4 | ';
/** The close (ref bars 20-26). */
const CLOSE =
  'C5:4 r:4 D5:4 r:4 | B4:4 C5:4 A4:4 B4:4 | E4:8 r:3 G#4:1 A4:3 B4:1 | C5:4 C5:4 r:3 B4:1 C5:3 D5:1 | ' +
  'E5:4 E5:4 r:3 D5:1 E5:3 F5:1 | G5:12 F5:4 | E5:12 r:4 | ';
/** Horns an octave below the trumpet in T2. In bars 2 and 6 they take the resolution D at once: the
 *  trumpet's E is an appoggiatura over Dm, and an E4 would rub a semitone against the F4 of the stab. */
const THEME_HN =
  'E4:8 E4:6 E4:2 | D4:8 C4:6 A3:2 | G3:6 B3:2 D4:6 F4:2 | E4:8 C4:4 r:4 | ' +
  'E4:8 E4:6 E4:2 | D4:8 C4:6 A3:2 | G3:6 B3:2 D4:6 F4:2 | E4:4 C4:4 E4:4 r:4 | ';
/** Xylophone an octave above the close's three rising pickups (C2 bars 3-5). */
const XYLO_PICKUPS = R(2) + 'r:11 G#5:1 A5:3 B5:1 | r:11 B5:1 C6:3 D6:1 | r:11 D6:1 E6:3 F6:1 | ' + R(3);

// ---------------------------------------------------------------------------------------------
// Harmony and bass lines
// ---------------------------------------------------------------------------------------------

/** "Vedi" in G: I | V I | V7 I | ii V7/3 I | V I … half cadence, then G7 (the hammer bar) to C. */
const V_CH = 'G:16 | D:8 G:8 | D7:8 G:8 | Am:8 D7/F#:4 G:4 | D:8 G:8 | D:8 G:8 | D7:8 G:8 | Am:8 D7/F#:4 G:4 | D:8 D7:8 | G7:16';
/** Theme over the tonic pedal (Kątski's first statement, bars 37-44). */
const T1_CH = 'C:16 | C:16 | G7/C:16 | C:16 | C:16 | C:16 | G7/C:16 | C:16';
/** Theme over Kątski's chromatic bass C C# D F# G (bars 60-63). */
const T2_CH = 'C:8 C#dim7:8 | Dm:8 D7/F#:8 | G7:16 | C:16 | C:8 C#dim7:8 | Dm:8 D7/F#:8 | G7:16 | C:16';
/** Close: circle of fifths A D G C F B E (Kątski bars 45-47), then Am, C, I6/4 V7 I. */
const C_CH = 'Am:8 Dm:8 | G:4 C:4 F:4 Bdim:4 | E7:16 | Am:16 | C:16 | C/G:12 G7:4 | C:16';

/** "oom" on beats 1 and 3, one bar per argument: oom('C2 G1', …) */
const oom = (...bars: string[]): string => bars.map((b) => b.split(' ').map((n) => `${n}:4 r:4`).join(' ')).join(' | ') + ' | ';

/** Upright bass under "Vedi": a rising line F# G A B into the ii–V7–I of each phrase. */
const V_BASS =
  oom('G2 D2', 'F#2 G2', 'A2 B2') + 'A2:4 r:4 F#2:4 G2:4 | ' + oom('D2 G2', 'F#2 G2', 'A2 B2') + 'A2:4 r:4 F#2:4 G2:4 | ' + oom('D2 A1') + R(1);
const T1_BASS = oom('C2 G1', 'C2 G1', 'C2 G1', 'C2 G1', 'C2 G1', 'C2 G1', 'C2 G1', 'C2 G1');
const T2_BASS = oom('C2 C#2', 'D2 F#2', 'G2 B1', 'C2 G1', 'C2 C#2', 'D2 F#2', 'G2 B1', 'C2 G1');
/** Close, bars 1-6: walking quarters down the circle of fifths, then oom-pah. */
const C_BASS_6 = 'A1:4 G1:4 F1:4 D2:4 | G1:4 C2:4 F1:4 B1:4 | ' + oom('E2 B1', 'A1 E2', 'C2 G1', 'G1 G1');

const PAH = 'r:4 c:4 r:4 c:4';
type PahOpts = { lo: string; hi: string; vel: number; to?: number };
/** "pah" on 2 and 4, except beat 4 of the close's bar 3: the melody's passing A over E7 goes alone. */
const pahClose = (ch: string, o: PahOpts): Part[] => [
  comp(ch, PAH, { ...o, n: 3, to: 2 }),
  comp(ch, 'r:4 c:4 r:8', { ...o, n: 3, from: 2, to: 3 }),
  comp(ch, PAH, { ...o, n: 3, from: 3 }),
];
/** T2 stabs: in bars 2 and 6 the beat-2 stab waits for the "and", where the trumpet's E5 resolves. */
const pahT2 = (ch: string, o: PahOpts): Part[] => [
  comp(ch, PAH, { ...o, n: 3, to: 1 }),
  comp(ch, 'r:6 c:2 r:4 c:4', { ...o, n: 3, from: 1, to: 2 }),
  comp(ch, PAH, { ...o, n: 3, from: 2, to: 5 }),
  comp(ch, 'r:6 c:2 r:4 c:4', { ...o, n: 3, from: 5, to: 6 }),
  comp(ch, PAH, { ...o, n: 3, from: 6 }),
];

// ---------------------------------------------------------------------------------------------
// Percussion: the smiths (anvil, frying pan), the kitchen (woodblock, slapstick, castanets), the band
// ---------------------------------------------------------------------------------------------

/** anvil: A hard (top layer), a medium, q soft */
const ANV: HitMap = { A: { v: 1.0 }, a: { v: 0.65 }, q: { v: 0.38 } };
const PANS: HitMap = { P: { v: 0.95 }, p: { v: 0.6 } };
const WOOD: HitMap = { W: { v: 0.85 }, w: { v: 0.5 } };
/** tambourine articulations: X accent, x hit, s shake, R roll */
const TAMB: HitMap = { X: { v: 0.95, vr: [4, 5] }, x: { v: 0.62, vr: [0, 1] }, s: { v: 0.55, vr: [2, 3] }, R: { v: 0.7, vr: [6, 7] } };
const CAST: HitMap = { C: { v: 0.9 }, c: { v: 0.6 } };
/** bass drum: variant 0 = hit (variant 1 is the roll) */
const BD: HitMap = { B: { v: 0.95, vr: 0 }, b: { v: 0.6, vr: 0 } };

/** Timpani roll in 32nds from step `at` over `steps` steps, velocity v0 → v1. */
const roll = (at: number, steps: number, note: string, v0: number, v1: number): Array<[number, string, number, number]> =>
  Array.from({ length: steps * 2 }, (_, i): [number, string, number, number] => [at + i / 2, note, v0 + ((v1 - v0) * i) / Math.max(1, steps * 2 - 1), 0.5]);
/** Hammer strokes with a soft grace stroke a 64th before (the "k-TING" of a smith's flam): [step, velocity]. */
const flam = (list: Array<[number, number]>): Array<[number, number, number]> =>
  list.flatMap(([s, v]): Array<[number, number, number]> => [
    [s - 0.25, 60, v * 0.45],
    [s, 60, v],
  ]);

export const kitchen: SongDef = {
  id: 'kitchen',
  bpm: 128,
  stepsPerBeat: 4,
  barSteps: 16,
  scale: 'C major',
  gainDb: -0.5,
  humanize: 0.004,
  reverb: { rt60: 1.2, size: 0.85, damp: 0.5, predelay: 0.015, er: 0.35, hp: 280, lp: 7000, wet: 1.3 },
  channels: {
    clar: { inst: 'clarinet', gain: -3, pan: -0.15, send: 0.18 },
    acc: { inst: 'accordion', gain: -4, pan: 0.1, send: 0.15 },
    mand: { inst: 'mandolin', gain: -1.5, pan: -0.3, send: 0.18 },
    tpt: { inst: 'trumpet', gain: -1.3, pan: 0.05, send: 0.18 },
    hn: { inst: 'horn', gain: -9, pan: -0.25, send: 0.25 },
    brs: { inst: 'brass', gain: -12, pan: 0.2, send: 0.2, hum: 0.5 },
    xylo: { inst: 'xylophone', gain: -14, pan: 0.35, send: 0.2, hum: 0.5 },
    tuba: { inst: 'tuba', gain: -6, pan: 0, send: 0.05, hum: 0.4 },
    ubass: { inst: 'uprightBass', gain: -4, pan: 0.05, send: 0.08, hum: 0.5 },
    gtr: { inst: 'guitar', gain: -10, pan: 0.35, send: 0.14, hum: 0.6 },
    accC: { inst: 'accChord', gain: -12, pan: -0.25, send: 0.12, hum: 0.5 },
    pizz: { inst: 'pizz', gain: -10, pan: 0.3, send: 0.15, hum: 0.5 },
    anv: { inst: 'anvil', gain: -7, pan: -0.25, send: 0.2, hum: 0.4 },
    anv2: { inst: 'anvil', gain: -8, pan: 0.45, send: 0.2, hum: 0.4 },
    pans: { inst: 'panClang', gain: -7, pan: 0.3, send: 0.2, hum: 0.4 },
    wood: { inst: 'woodblock', gain: -12, pan: 0.4, send: 0.15, hum: 0.4 },
    slap: { inst: 'slapstick', gain: -8, pan: -0.1, send: 0.2, hum: 0 },
    tamb: { inst: 'tamb', gain: -7, pan: 0.25, send: 0.1, hum: 0.5 },
    cast: { inst: 'castanets', gain: -11, pan: -0.4, send: 0.15, hum: 0.3 },
    bd: { inst: 'bassDrum', gain: -12, pan: 0, send: 0.15, hum: 0 },
    timp: { inst: 'timpani', gain: -9, pan: 0.05, send: 0.2, hum: 0 },
    crash: { inst: 'crash', gain: -16, pan: 0.2, send: 0.25, hum: 0 },
    cym: { inst: 'cymbal', gain: -18, pan: -0.2, send: 0.25, hum: 0 },
  },
  sections: {
    // The kitchen wakes up: two smiths, the anvil and the frying pan, alone.
    intro: {
      bars: 4,
      chords: 'C:16 | C:16 | C:16 | C:16',
      parts: [
        drums('anv', 'A.......a.......|A.......a.......|A.......A.......|A...A...A.......', ANV),
        drums('pans', '................|....p.......p...|....P.......P...|..p...p...p.....', PANS),
        drums('wood', '................|................|..w...w...w...w.|................', WOOD),
        hits('slap', [[60, 60, 0.85]]),
      ],
    },
    // "Vedi! le fosche notturne spoglie" (G major): clarinet, then the accordion takes phrase 2.
    // Bar 10 is the hammer bar ("All'opra! Dàgli, martella!"): flammed anvil, pans, timpani roll on G.
    V: {
      bars: 10,
      chords: V_CH,
      parts: [
        mel('clar', VEDI + R(5), { vel: 0.72 }),
        mel('acc', R(4) + VEDI + R(1), { vel: 0.72 }),
        mel('ubass', V_BASS, { vel: 0.75 }),
        comp('gtr', PAH, { lo: 'D3', hi: 'E4', n: 3, strum: 0.012, vel: 0.55, to: 9 }),
        drums('tamb', 'x.s.x.s.x.s.x.s.', TAMB, { vel: 0.6, to: 9 }),
        hits('anv', flam([[144, 0.75], [148, 0.82], [152, 0.9], [156, 1.0]])),
        drums('pans', '..p...p...p...p.', PANS, { from: 9 }),
        hits('timp', roll(144, 16, 'G2', 0.2, 0.7)),
      ],
    },
    // The anvil theme: accordion lead + clarinet, tuba over the tonic pedal, anvil on beats 1 and 3,
    // the slapstick in the rest at each cadence.
    T1: {
      bars: 8,
      chords: T1_CH,
      parts: [
        mel('acc', THEME, { vel: 0.88 }),
        mel('clar', THEME, { vel: 0.62 }),
        mel('tuba', T1_BASS, { vel: 0.8 }),
        comp('accC', PAH, { lo: 'B3', hi: 'G4', n: 3, vel: 0.6 }),
        drums('anv', 'A.......a.......', ANV, { vel: 0.85 }),
        drums('tamb', 'x.s.X.s.x.s.X.s.', TAMB, { vel: 0.75 }),
        drums('bd', 'b...............', BD),
        hits('slap', [[60, 60, 0.75], [124, 60, 0.85]]),
        hits('timp', [[0, 'C2', 0.8], [32, 'G2', 0.65], [64, 'C2', 0.75], [96, 'G2', 0.65]]),
      ],
    },
    // The close: mandolin (tremolo on the long notes) + clarinet; the woodblock answers in the rests.
    C1: {
      bars: 7,
      chords: C_CH,
      parts: [
        mel('mand', CLOSE, { vel: 0.96, tremMin: 6 }),
        mel('clar', CLOSE, { vel: 0.6 }),
        mel('tuba', C_BASS_6 + 'C2:4 r:12 | ', { vel: 0.8 }),
        ...pahClose('pizz', { lo: 'C4', hi: 'C5', vel: 0.65 }),
        drums('anv', 'a.......a.......', ANV, { vel: 0.8, to: 6 }),
        hits('wood', [[4, 60, 0.7], [12, 60, 0.7], [40, 60, 0.6], [56, 60, 0.6], [72, 60, 0.65]]),
        drums('tamb', 'x.s.X.s.x.s.X.s.', TAMB, { vel: 0.7 }),
        hits('timp', [[32, 'E2', 0.7], [48, 'A2', 0.6], ...roll(88, 8, 'G2', 0.3, 0.8), [96, 'C2', 0.9]]),
        hits('slap', [[108, 60, 0.9]]),
      ],
    },
    // Break: the theme's rhythm (bars 12-15) on the pots and pans alone, high notes on the anvil,
    // low notes on the pan; a second smith keeps the 8ths, the timpani are the big kettles.
    brk: {
      bars: 4,
      chords: 'C:16 | C:16 | G7:16 | C:16',
      parts: [
        hits('anv', [[0, 60, 1.2], [8, 60, 0.85], [14, 60, 0.85], [16, 60, 1.2], [22, 60, 0.85], [40, 60, 1.2], [46, 60, 0.85], [48, 60, 1.2]]),
        hits('pans', [[24, 60, 1.2], [30, 60, 0.8], [32, 60, 1.2], [38, 60, 0.8], [56, 60, 1.2]]),
        hits('slap', [[60, 60, 0.95]]),
        drums('anv2', 'q.q.q.q.q.q.q.q.|q.q.q.q.q.q.q.q.|q.q.q.q.q.q.q.q.|q.q.q.q.q.......', ANV),
        hits('timp', [[0, 'C2', 0.7], [16, 'C2', 0.6], [32, 'G2', 0.7], [48, 'C2', 0.65]]),
        drums('wood', '..w...w...w...w.', WOOD, { vel: 1.2 }),
        drums('bd', 'B.......B.......', BD),
        drums('tamb', 'x.s.X.s.x.s.X.s.|x.s.X.s.x.s.X.s.|x.s.X.s.x.s.X.s.|x.s.X.s.R.......', TAMB, { vel: 1.1 }),
        drums('cast', '................|................|..c...c...c.c.c.|..c.c.cc........', CAST),
        hits('cym', [[52, 60, 0.75, 12]], 1),
      ],
    },
    // Tutti: trumpet lead (accordion under it), horns an octave below, chromatic bass, brass stabs,
    // anvil on 1 and 3 and the pan on 2 and 4 (two smiths), crash at each statement.
    T2: {
      bars: 8,
      chords: T2_CH,
      parts: [
        mel('tpt', THEME, { vel: 0.9 }),
        mel('acc', THEME, { vel: 0.7 }),
        mel('hn', THEME_HN, { vel: 0.8 }),
        mel('tuba', T2_BASS, { vel: 0.9 }),
        ...pahT2('brs', { lo: 'G3', hi: 'G4', vel: 0.7 }),
        drums('anv', 'A.......A.......', ANV),
        drums('pans', '....P.......P...', PANS),
        drums('tamb', 'X.s.x.s.X.s.x.s.', TAMB, { vel: 0.85 }),
        drums('bd', 'B.......b.......', BD),
        hits('crash', [[0, 60, 0.9], [64, 60, 0.75]]),
        hits('timp', [[0, 'C2', 0.9], [32, 'G2', 0.8], [48, 'C2', 0.85], [64, 'C2', 0.85], [96, 'G2', 0.8], [112, 'C2', 0.85]]),
        hits('slap', [[60, 60, 0.85], [124, 60, 0.9]]),
      ],
    },
    // Tutti close (+ mandolin tremolo and xylophone pickups), then the turnaround C – G/B – Am – D7
    // (horns, tuba walking down) back to "Vedi" in G.
    C2: {
      bars: 8,
      chords: C_CH + ' | C:4 G/B:4 Am:4 D7:4',
      parts: [
        mel('tpt', CLOSE + R(1), { vel: 0.95 }),
        mel('acc', CLOSE + R(1), { vel: 0.7 }),
        mel('mand', CLOSE + R(1), { vel: 0.72, tremMin: 6 }),
        mel('hn', CLOSE + R(1), { vel: 0.8, oct: -1 }),
        mel('xylo', XYLO_PICKUPS, { vel: 0.7 }),
        mel('tuba', C_BASS_6 + oom('C2 G1') + 'C2:4 B1:4 A1:4 D2:4 | ', { vel: 0.9 }),
        ...pahClose('brs', { lo: 'G3', hi: 'G4', vel: 0.7, to: 7 }),
        comp('hn', 'c:4 c:4 c:4 c:4', { lo: 'G3', hi: 'G4', n: 3, vel: 0.55, from: 7 }),
        drums('anv', 'A.......A.......', ANV, { to: 7 }),
        drums('anv', 'a...a...a...a...', ANV, { from: 7, vel: 0.9 }),
        drums('pans', '....P.......P...', PANS, { to: 7 }),
        drums('pans', '..p...p...p.....', PANS, { from: 7 }),
        hits('wood', [[4, 60, 0.75], [12, 60, 0.75], [40, 60, 0.65], [56, 60, 0.65], [72, 60, 0.7]]),
        drums('tamb', 'X.s.x.s.X.s.x.s.', TAMB, { vel: 0.85, to: 7 }),
        drums('bd', 'B.......b.......', BD, { to: 7 }),
        hits('crash', [[0, 60, 0.85], [96, 60, 0.9]]),
        hits('timp', [[32, 'E2', 0.8], [48, 'A2', 0.7], [64, 'C2', 0.75], ...roll(80, 16, 'G2', 0.3, 0.9), [96, 'C2', 1.0]]),
        hits('slap', [[124, 60, 0.9]]),
      ],
    },
  },
  form: ['intro', 'V', 'T1', 'C1', 'brk', 'T2', 'C2'],
  loopFrom: 1,
};
