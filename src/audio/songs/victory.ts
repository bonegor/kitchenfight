/**
 * VICTORY — Verdi, *Aida* (1871), Act II: the Triumphal March, the famous "Aida trumpets" theme.
 * A♭ major (Verdi's key for the first trumpet statement; the reference lead sheet is in G),
 * 4/4, ♩ = 154 (an alla-breve march: the oom-pah moves in half notes).
 *
 * Form (26 bars, 40.5 s): march (12) = timpani roll + suspended-cymbal swell and the trumpet
 * pickup, then the whole 12-bar trumpet theme once (a b a b') — trumpets in unison over the band
 * (tuba/pizz oom, string after-beats, snare), horns join at b, violins double the tune an octave up
 * and the bass drum / piatti join at a' (the brass section steps back there); castanets wink in
 * the trumpets' rests → fin (1) = tutti A♭ with crash, then the cheeky band tag: accordion and
 * glockenspiel echo the trumpets' triplet, castanets rattle, V7–I button → vamp (1, played once)
 * = the band settles into its oom-pah (the accordion's left hand joins the guitar's pah), the
 * castanets call and the accordion picks up → tail (12, loop) = the band's victory lap under the
 * results screen: the theme again, softly, traded between the accordion and the mandolin over an
 * upright-bass / guitar oom-pah and a tambourine brush:
 *   bars 1–3   a   accordion
 *   bars 4–6   b   mandolin (the accordion's bellows hold two soft voices under it)
 *   bars 7–9   a'  mandolin tremolo, the clarinet's counter-melody below, its run hands over to
 *   bars 10–11 b'  accordion, the mandolin's second voice below (seconda voce)
 *   bar 12     the landing on A♭, then a turnaround (A♭ F7 B♭m7 E♭7): the clarinet's fill on
 *              beats 2–3, the castanets' rattle on beat 3, the accordion's pickup with their "tak"
 *              on beat 4, back to a
 *   (pizzicato doubles the bass an octave up in the second pass, bars 7–12)
 * In the loop the tune rests for two beats only (the turnaround's beats 2–3, where the clarinet
 * fills). Levels: loop body (tail) -16.4 LUFS, march + tag -15.1 LUFS (the fanfare sits above the
 * bed).
 * Melody verified against wf_aida_march.abc bars 1–12, every statement (see docs/music/victory.md).
 */
import { drums, hits, mel, type Ev, type Part, type SongDef } from '../sequencer';

/** chord track of the reference lead sheet (bars 1–12), transposed G → A♭ */
const CH_MARCH =
  'Ab:16 | Ab:12 Eb7:4 | Ab:16 | Eb7:8 Ab:8 | Eb7:8 Ab:4 Eb:4 | Ab:4 Eb:4 Cm:4 Fm:4 | Bb7:8 Eb7sus4:4 Eb:4 | ' +
  'Ab:12 Eb7:4 | Ab:16 | Eb7:8 Ab:8 | Eb7:8 Ab:4 Eb:4 | Ab:4 Eb:4 Cm:4 Eb7:4';

/** a: "A♭ — B♭-E♭-B♭ | C C C C-D♭-A♭ | C. B♭ A♭" (reference bars 2–4 / 8–10) */
const THEME_A = `
  Ab4:12 Bb4:4/3 Eb4 Bb4 | C5:4 C5 C5 C5:4/3 Db5 Ab4 | C5:6 Bb4:2 Ab4:4 r:4 |`;
/** b: half cadence on E♭ (reference bars 5–7) */
const THEME_B = `
  Bb4:2 C5 C5:3 Bb4:1 Ab4:2 r:2 Bb4:3 C5:1 | C5:4 Bb4:3 C5:1 C5:4 Ab4:3 Bb4:1 | Bb4:4 F4:4/3 F4 F4 F4:4 G4:4 |`;
/** b': full cadence (reference bars 11–12; the final A♭ is the first note of 'fin') */
const THEME_B2 = `
  Bb4:2 C5 C5:3 Bb4:1 Ab4:2 r:2 Bb4:3 C5:1 | C5:4 Bb4:3 C5:1 C5:4 Bb4:4/3 C5 Bb4 |`;
/** the whole first statement: accented pickup bar + a b a b' (reference bars 1–12) */
const THEME = 'r:12 Eb4!:4 |' + THEME_A + THEME_B + THEME_A + THEME_B2;
/** phrase dynamics, velocity per bar of THEME: a forte, b a shade lighter, a' b' forte again */
const DYN = [0.9, 0.9, 0.9, 0.9, 0.85, 0.84, 0.84, 0.9, 0.9, 0.9, 0.9, 0.92];
/** THEME with the bar's velocity × k (bars 1–7) and × k2 (bars 8–12, a' b') in every note */
const shaped = (k: number, k2 = k): string =>
  THEME.split('|')
    .filter((b) => b.trim())
    .map((b, i) =>
      b
        .trim()
        .split(/\s+/)
        .map((t) => (t.startsWith('r') ? t : `${t}@${(DYN[i] * (i >= 7 ? k2 : k)).toFixed(3)}`))
        .join(' '),
    )
    .join(' | ') + ' |';

/** after-beats (beats 2 and 4; a chord per beat where the harmony moves every beat). Under a
 *  melody C over E♭7 the after-beat leaves out the 7th (D♭ against C), E♭7sus4 → E♭ resolves */
const P_A = 'r:4 Ab3+C4+Eb4:2 r:6';
const AB = {
  b2: `${P_A} G3+Db4+Eb4:2 r:2 |`,
  b3: `${P_A} Ab3+C4+Eb4:2 r:2 |`,
  b4: 'r:4 G3+Bb3+Eb4:2 r:6 Ab3+C4+Eb4:2 r:2 |',
  b5: 'r:4 G3+Bb3+Eb4:2 r:6 G3+Bb3+Eb4:2 r:2 |',
  b6: 'Ab3+C4+Eb4:2 r:2 G3+Bb3+Eb4:2 r:2 G3+C4+Eb4:2 r:2 Ab3+C4+F4:2 r:2 |',
  b7: 'r:4 Ab3+Bb3+D4:2 r:2 Ab3+Bb3+Eb4:2 r:2 G3+Bb3+Eb4:2 r:2 |',
  b12: 'Ab3+C4+Eb4:2 r:2 G3+Bb3+Eb4:2 r:2 G3+C4+Eb4:2 r:2 G3+Db4+Eb4:2 r:2 |',
};
const AFTER = ['r:16 |', AB.b2, AB.b3, AB.b4, AB.b5, AB.b6, AB.b7, AB.b2, AB.b3, AB.b4, AB.b5, AB.b12].join(' ');

/** horn section, bars 5–12: three voices with tied common tones (bar 7: B♭7 → E♭7sus4 → E♭).
 *  The low E♭3 pedal is re-tongued where the players breathe: bar 7 beat 3, bars 8, 10, 11, 12 */
const HRN_LO = 'Eb3:16 | _:12 F3:4 | _:8 Eb3:8 | Eb3:16 | _:16 | Eb3:16 | Eb3:16 | Eb3:16 |';
const HRN_MID = 'G3:8 Ab3:4 G3:4 | Ab3:4 G3:8 Ab3:4 | _:12 G3:4 | Ab3:12 G3:4 | Ab3:16 | G3:8 Ab3:8 | G3:8 Ab3:4 G3:4 | Ab3:4 G3:12 |';
const HRN_TOP = 'Bb3:8 C4:4 Bb3:4 | C4:4 Bb3:4 C4:8 | D4:8 Db4:4 Bb3:4 | C4:12 Db4:4 | C4:16 | Bb3:8 C4:8 | Bb3:8 C4:4 Bb3:4 | C4:4 Bb3:4 C4:4 Db4:4 |';

/** oom (beats 1 and 3; every beat where the harmony moves every beat) — tuba, F1–E♭2 */
const OOM = [
  'r:16',
  'Ab1:4 r:4 Eb2:4 r:4',
  'Ab1:4 r:4 C2:4 r:4', // walks A♭–C–E♭ into the E♭7 bar
  'Eb2:4 r:4 Ab1:4 r:4',
  'Eb2:4 r:4 Ab1:4 Eb2:4', // beat 4 follows the chord change (E♭)
  'Ab1:4 G1 C2 F1',
  'Bb1:4 r:4 Eb2:8',
  'Ab1:4 r:4 Eb2:4 r:4',
  'Ab1:4 r:4 C2:4 r:4',
  'Eb2:4 r:4 Ab1:4 r:4',
  'Eb2:4 r:4 Ab1:4 Eb2:4',
  'Ab1:4 G1 C2 Eb2',
].join(' | ');

/** timpani roll: strokes every 2/3 step (≈ 15 per second at ♩ = 154), crescendo */
const roll = (at: number, steps: number, note: string, v0: number, v1: number): Array<[number, string, number]> => {
  const n = Math.round(steps * 1.5);
  return Array.from({ length: n }, (_, i): [number, string, number] => [at + (i * 2) / 3, note, v0 + ((v1 - v0) * i) / Math.max(1, n - 1)]);
};
/** snare velocities: the set's layers switch at 0.45 / 0.65 / 0.85, and only the upper two have
 *  the snares' crack (the soft layers are almost all drum body), so after-beats and triplets play
 *  at ≥ 0.65 */
const SN = 0.7;
/** triplet doubling the trumpets' triplet pickups (all three strokes in the same layer) */
const TRIP = (at: number, v: number): Array<[number, number, number]> => [
  [at, 60, v],
  [at + 4 / 3, 60, v * 0.93],
  [at + 8 / 3, 60, v * 1.05],
];
const bar = (n: number): number => (n - 1) * 16; // step of bar n (1-based) inside a section

// ---------------------------------------------------------------------------------------------
// The victory lap: a one-bar vamp after the tag (played once, = reference bar 1: the band vamps,
// the accordion picks up), then the loop, 12 bars = reference bars 2–12 + the landing /
// turnaround bar, which carries the next pass's pickup on its beat 4.
// ---------------------------------------------------------------------------------------------

/** chord track of the loop: the reference's chords of bars 2–12, then the turnaround
 *  I – V7/ii – ii7 – V7 that walks back into a */
const CH_TAIL = `${CH_MARCH.slice(CH_MARCH.indexOf('|') + 1)} | Ab:4 F7:4 Bbm7:4 Eb7:4`;

/** the accordion's tune: a (and the pickups into it) a shade stronger than b', which has the
 *  mandolin's second voice and the pizzicato under it, so the loop's phrases rise by only about
 *  1 LU from a to b' */
const ACC_A = 0.65;
const ACC_B2 = 0.64;

/** mandolin seconda voce for b': a sixth under the tune where the band's chord has that note
 *  (E♭7: D♭/E♭ under B♭/C; A♭: C under A♭, E♭ under C; Cm: E♭ under C), a fifth (E♭ under B♭)
 *  where the chord is a plain E♭ triad (bar 10 beat 4, bar 11 beat 2), so it adds no 7th the
 *  band does not play; the final E♭7's 7th D♭ resolves to C under the landing */
const B2_SIXTHS = `
  Db4:2 Eb4 Eb4:3 Db4:1 C4:2 r:2 Eb4:3 Eb4:1 | Eb4:4 Eb4:3 Eb4:1 Eb4:4 Db4:4/3 Eb4 Db4 |`;

/** clarinet counter-melody under the mandolin's a' (chalumeau, below the tune): it moves where
 *  the tune holds (E♭–F–E♭–D♭ under the long A♭, D♭ → C into bar 8), slows to half notes under
 *  the repeated C's, and its run E♭–F–G–A♭ in the tune's rest hands over to the accordion's B♭ */
const CLAR_COUNTER = `
  Eb4:4 F4:4 Eb4:4 Db4:4 | C4:8 Eb4:8 | G3:8 C4:4 Eb4:1 F4:1 G4:1 Ab4:1 |`;
/** turnaround fill (bar 12, beats 2–3): F7 – B♭m7 chord tones rising, A3 C4 | D♭4 F4, and the
 *  accordion's pickup E♭4 on beat 4 continues the line a step down (the A♮ of F7 is the
 *  turnaround's chromatic touch) */
const CLAR_FILL = 'r:4 A3:2 C4:2 Db4:2 F4:2 r:4 |';

/** accordion bellows under the mandolin's b: two soft voices with tied common tones */
const ACC_PAD_HI = 'Eb4:16 | Eb4:12 F4:4 | D4:8 Eb4:8 |';
const ACC_PAD_LO = 'Bb3:8 C4:4 Bb3:4 | C4:4 Bb3:4 C4:8 | Ab3:12 G3:4 |';

/** the vamp's pah: guitar and the accordion's chord buttons on 2 and 4 */
const VAMP_PAH = `${P_A} Ab3+C4+Eb4:2 r:2 |`;
/** guitar pah (beats 2 and 4) on the march's after-beat voicings; bar 12 strums every beat with
 *  chromatic voice leading A♭ → F7 (A♮) → B♭m7 → E♭7 → back to a's A♭ */
const GTR = [
  AB.b2, AB.b3, AB.b4, AB.b5, AB.b6, AB.b7, AB.b2, AB.b3, AB.b4, AB.b5, AB.b12,
  'Ab3+C4+Eb4:2 r:2 A3+C4+Eb4:2 r:2 Ab3+Db4+F4:2 r:2 G3+Db4+Eb4:2 r:2 |',
].join(' ');

/** upright bass "oom" (beats 1 and 3), the march's bass line (reference bars 2–12); the landing
 *  bar walks A♭ – F – B♭ – E♭ back to a's A♭ */
const UBASS = [...OOM.split('|').slice(1).map((b) => b.trim()), 'Ab1:4 F1 Bb1 Eb2'].join(' | ');

/** tambourine brush: light taps on 2 and 4 (the set's "hit" articulations, variants 0/1, which
 *  peak 40–60 ms after the onset; its shakes peak 80–160 ms late and drag the after-beat). It
 *  leaves beat 4 to the castanets where they play (the vamp, bars 3 and 12) */
const TAMB = { x: { v: 0.5, vr: [0, 1] } };
const TAMB_2_4 = '....x.......x...';
const TAMB_2 = '....x...........';
const TAMB_TAIL = [TAMB_2_4, TAMB_2_4, TAMB_2, ...Array(8).fill(TAMB_2_4), TAMB_2].join('|');

/** the castanets' call into a (the vamp and the turnaround, from step `at` = the bar's start): a
 *  rattle on beat 3, where the tune rests (in the turnaround under the clarinet's fill, which
 *  leaves the band's top octave free), and the "tak" with the accordion's pickup on beat 4, the
 *  way the trumpets accent theirs */
const CAST_CALL = (at: number): Array<[number, number, number]> => [
  [at + 8, 60, 0.5],
  [at + 9, 60, 0.56],
  [at + 10, 60, 0.62],
  [at + 11, 60, 0.68],
  [at + 12, 60, 0.8],
];

/** strum a chord part: the notes of each chord start `sec` apart, low → high */
const strum =
  (p: Part, sec: number): Part =>
  (ctx) => {
    const evs = p(ctx);
    const chords = new Map<number, Ev[]>();
    for (const e of evs) chords.set(e.s, [...(chords.get(e.s) ?? []), e]);
    for (const g of chords.values()) g.sort((x, y) => x.m - y.m).forEach((e, i) => (e.offSec = (e.offSec ?? 0) + i * sec));
    return evs;
  };

export const victory: SongDef = {
  id: 'victory',
  bpm: 154,
  stepsPerBeat: 4,
  barSteps: 16,
  scale: 'Ab major',
  gainDb: -1.2,
  humanize: 0.003,
  reverb: { rt60: 1.9, size: 1.25, damp: 0.5, predelay: 0.022, er: 0.35, hp: 240, lp: 7500, wet: 1.45 },
  channels: {
    tpt: { inst: 'trumpet', gain: -0.9, pan: 0.08, send: 0.2 },
    tptS: { inst: 'brass', gain: -5.9, pan: -0.12, send: 0.22 },
    hrn: { inst: 'brassSoft', gain: -8.5, pan: -0.32, send: 0.3, hum: 0.6 },
    str: { inst: 'strings', gain: -9.2, pan: -0.22, send: 0.28, hum: 0.5 },
    stab: { inst: 'strStab', gain: -9.2, pan: 0.26, send: 0.16, hum: 0.5 },
    vlnM: { inst: 'strStab', gain: -8.1, pan: -0.24, send: 0.24, hum: 0.5 },
    tuba: { inst: 'tuba', gain: -7.3, pan: 0, send: 0.06, hum: 0.4 },
    pizz: { inst: 'pizz', gain: -7.1, pan: 0.32, send: 0.12, hum: 0.4 },
    timp: { inst: 'timpani', gain: -5.4, pan: -0.06, send: 0.2, hum: 0.3 },
    snare: { inst: 'snare', gain: -7.4, pan: 0.16, send: 0.14, hum: 0.4 },
    bd: { inst: 'bassDrum', gain: -8, pan: 0, send: 0.2, hum: 0 },
    crash: { inst: 'crash', gain: -11.5, pan: -0.2, send: 0.25, hum: 0 },
    // the recorded roll is dark (its energy sits at 250 Hz–1 kHz), so it needs this much gain
    cym: { inst: 'cymbal', gain: 7.2, pan: 0.25, send: 0.25, hum: 0 },
    glock: { inst: 'glock', gain: -8.4, pan: 0.4, send: 0.3, hum: 0 },
    acc: { inst: 'accordion', gain: -6.9, pan: -0.1, send: 0.18 },
    cast: { inst: 'castanets', gain: -9.3, pan: 0.36, send: 0.12, hum: 0.5 },
    // the victory lap only (vamp + tail)
    accR: { inst: 'accordion', gain: 1, pan: -0.12, send: 0.2, hum: 0.6 },
    mand: { inst: 'mandolin', gain: 1.5, pan: 0.14, send: 0.2, hum: 0.6 },
    clar: { inst: 'clarinet', gain: -4.4, pan: -0.3, send: 0.24, hum: 0.5 },
    accC: { inst: 'accChord', gain: -5.2, pan: -0.2, send: 0.16, hum: 0.5 },
    gtr: { inst: 'guitar', gain: -5.15, pan: 0.3, send: 0.14, hum: 0.6 },
    ubass: { inst: 'uprightBass', gain: -2.65, pan: 0.06, send: 0.08, hum: 0.5 },
    pizzT: { inst: 'pizz', gain: 0.7, pan: -0.3, send: 0.12, hum: 0.5 },
    tamb: { inst: 'tamb', gain: 4.8, pan: 0.32, send: 0.1, hum: 0.6 },
  },
  sections: {
    // pickup bar (roll) + the whole 12-bar trumpet theme: reference bars 1–12
    march: {
      bars: 12,
      chords: CH_MARCH,
      parts: [
        mel('tpt', shaped(1), {}),
        // the brass section in unison; it steps back in a' b', where the violins double the tune
        mel('tptS', shaped(0.8, 0.62), {}),
        // horns: three legato voices from b on (E♭ inner pedal; the 7th only where it resolves)
        mel('hrn', HRN_LO, { vel: 0.5, at: bar(5) }),
        mel('hrn', HRN_MID, { vel: 0.5, at: bar(5) }),
        mel('hrn', HRN_TOP, { vel: 0.5, at: bar(5) }),
        // violins double the tune an octave up for a' b' (sustain + marcato layer: the sustain
        // samples swell in slowly, the marcato layer articulates the triplets and dotted figures)
        mel('str', THEME_A + THEME_B2, { vel: 0.86, oct: 1, at: bar(8) }),
        mel('vlnM', THEME_A + THEME_B2, { vel: 0.84, oct: 1, at: bar(8) }),
        mel('stab', AFTER, { vel: 0.62 }),
        mel('tuba', OOM, { vel: 0.82 }),
        mel('pizz', OOM, { vel: 0.7, oct: 1 }),
        // percussion
        hits('timp', [
          ...roll(0, 15, 'Eb2', 0.22, 0.62),
          [bar(2), 'Ab2', 0.86],
          [bar(4), 'Eb2', 0.6],
          [bar(5), 'Eb2', 0.7],
          [bar(6), 'Ab2', 0.62],
          ...roll(bar(7) + 8, 8, 'Eb2', 0.3, 0.6),
          [bar(8), 'Ab2', 0.9],
          [bar(8) + 8, 'Eb2', 0.66],
          [bar(9), 'Ab2', 0.78],
          [bar(9) + 8, 'Eb2', 0.66],
          [bar(10), 'Eb2', 0.78],
          [bar(10) + 8, 'Ab2', 0.7],
          [bar(11), 'Eb2', 0.78],
          [bar(11) + 8, 'Ab2', 0.7],
          [bar(12), 'Ab2', 0.8],
          ...roll(bar(12) + 8, 8, 'Eb2', 0.35, 0.75),
        ]),
        // the band's wink: castanets answer in the trumpets' rest (bars 4 and 10, beat 4)
        hits('cast', [4, 10].flatMap((b): Array<[number, number, number]> => [
          [bar(b) + 12, 60, 0.5],
          [bar(b) + 13, 60, 0.4],
          [bar(b) + 14, 60, 0.62],
        ])),
        // suspended-cymbal swells into the crashes: ONE roll note each (variant 1 = the recorded
        // roll, which builds up by itself over about a second; velocity < 0.7 keeps the roll
        // layer, above it the sampler plays the cymbal's hit). The cadence swell starts on beat 2
        // so the roll has time to grow.
        hits('cym', [[2, 60, 0.42, 14], [bar(7) + 8, 60, 0.66, 8], [bar(12) + 4, 60, 0.6, 12]], 1),
        hits('crash', [
          [bar(2), 60, 0.82, 8],
          [bar(8), 60, 0.95, 8],
          [bar(9), 60, 0.42, 4],
          [bar(10), 60, 0.42, 4],
          [bar(11), 60, 0.45, 4],
        ]),
        hits('bd', [
          [bar(2), 60, 0.9, 8],
          [bar(5), 60, 0.6, 4],
          [bar(8), 60, 0.9, 8],
          ...[9, 10, 11].flatMap((b): Array<[number, number, number, number]> => [
            [bar(b), 60, 0.62, 4],
            [bar(b) + 8, 60, 0.5, 4],
          ]),
          [bar(12), 60, 0.62, 4],
        ], 0),
        hits('snare', [
          // after-beats, with the trumpets' triplet pickups doubled
          ...[2, 3, 4, 5, 6, 8, 9, 10, 11, 12].map((b): [number, number, number] => [bar(b) + 4, 60, SN]),
          ...[5, 6, 11].map((b): [number, number, number] => [bar(b) + 12, 60, SN]),
          ...TRIP(bar(2) + 12, SN),
          ...TRIP(bar(3) + 12, SN),
          ...TRIP(bar(7) + 4, SN),
          [bar(7) + 8, 60, SN],
          ...TRIP(bar(8) + 12, SN * 1.05),
          ...TRIP(bar(9) + 12, SN * 1.05),
          // 16th build into the final chord (0.6 → 0.88: the crack opens up on the way)
          ...Array.from({ length: 8 }, (_, i): [number, number, number] => [bar(12) + 8 + i, 60, 0.6 + i * 0.04]),
        ]),
      ],
    },
    // the theme's final A♭ (tutti, crash), then the cheeky band tag: accordion, glock, castanets
    fin: {
      bars: 1,
      chords: 'Ab:12 Eb7:2 Ab:2',
      parts: [
        mel('tpt', 'Ab4:6@0.92 r:10', {}),
        mel('tptS', 'Ab4+C5+Eb5:6 r:10', { vel: 0.55 }),
        mel('hrn', 'Eb3+Ab3+C4:6 r:10', { vel: 0.6 }),
        mel('str', 'Ab3+Eb4+C5+Ab5:6 r:10', { vel: 0.58 }),
        mel('stab', 'Ab3+C4+Eb4:2@0.5 r:10 G3+Db4+Eb4:2@0.62 Ab3+C4+Eb4:2@0.72', {}),
        mel('tuba', 'Ab1:6 r:10', { vel: 0.82 }),
        mel('pizz', 'Ab2:2 r:10 Eb2:2 Ab2:2', { vel: 0.75 }),
        // the accordion answers the trumpets' triplet (with the castanets), then a V7–I button
        // (D♭-G → C-A♭); the glockenspiel rings the button's top line an octave up ("ti-ting"),
        // after the tutti has cleared and clear of the castanets' triplet
        mel('acc', 'r:8 Bb5:4/3 Eb5 Bb5 Db5+G5:2 C5+Ab5!:2', { vel: 0.82 }),
        mel('glock', 'r:12 G6:2 Ab6:2', { vel: 0.7 }),
        hits('cast', [
          [5, 60, 0.35],
          [6, 60, 0.45],
          [7, 60, 0.55],
          [8, 60, 0.75],
          [8 + 4 / 3, 60, 0.6],
          [8 + 8 / 3, 60, 0.65],
          [12, 60, 0.7],
          [14, 60, 0.95],
        ]),
        hits('timp', [[0, 'Ab2', 0.82], [14, 'Ab2', 0.55]]),
        hits('bd', [[0, 60, 0.92, 8], [14, 60, 0.42, 2]], 0),
        hits('crash', [[0, 60, 0.9, 8]]),
      ],
    },
    // after the tag, once: the band settles into its oom-pah and the accordion picks up
    // (reference bar 1: three beats without the tune, the pickup on beat 4)
    vamp: {
      bars: 1,
      chords: 'Ab:16',
      parts: [
        mel('accR', 'r:12 Eb4:4 |', { vel: ACC_A }),
        // the accordion's left hand joins the guitar's pah
        mel('accC', VAMP_PAH, { vel: 0.55 }),
        mel('ubass', 'Ab1:4 r:4 Eb2:4 r:4 |', { vel: 0.78 }),
        strum(mel('gtr', VAMP_PAH, { vel: 0.55 }), 0.012),
        drums('tamb', TAMB_2, TAMB),
        // the castanets' call into a (the tag's button has just had its own "tak")
        hits('cast', CAST_CALL(0)),
      ],
    },
    // loop: the victory lap under the results screen. The tune again, softly (reference bars
    // 2–12 + the landing), traded between the accordion and the mandolin over a light oom-pah;
    // the turnaround bar carries the pickup back into a
    tail: {
      bars: 12,
      chords: CH_TAIL,
      parts: [
        // the tune: accordion = a (bars 1–3) and b' + landing (bars 10–12), then the pickup into
        // the next pass on bar 12's beat 4
        mel('accR', THEME_A, { vel: ACC_A }),
        mel('accR', `${THEME_B2} Ab4:4 r:8 Eb4:4@${ACC_A} |`, { vel: ACC_B2, at: bar(10) }),
        // mandolin = b (bars 4–6) and a' with tremolo on the long notes (bars 7–9), then the
        // seconda voce under the accordion's b' (velocity < 0.5: the softer of its two layers)
        mel('mand', THEME_B, { vel: 0.74, at: bar(4) }),
        mel('mand', THEME_A, { vel: 0.77, at: bar(7), tremMin: 6 }),
        mel('mand', B2_SIXTHS + ' C4:4 r:12 |', { vel: 0.47, at: bar(10) }),
        // second pass: the clarinet's counter-melody under a', and the turnaround fill
        mel('clar', CLAR_COUNTER, { vel: 0.72, at: bar(7) }),
        mel('clar', CLAR_FILL, { vel: 0.95, at: bar(12) }),
        // the accordion's bellows hold two soft voices under the mandolin's b
        mel('accC', ACC_PAD_HI, { vel: 0.45, at: bar(4) }),
        mel('accC', ACC_PAD_LO, { vel: 0.45, at: bar(4) }),
        // oom-pah: upright bass + guitar after-beats (strummed), tambourine brush
        mel('ubass', UBASS, { vel: 0.78 }),
        // second pass: string pizzicato doubles the oom an octave up (a little lift for a' b')
        mel('pizzT', UBASS.split('|').slice(6).join('|'), { vel: 0.55, oct: 1, at: bar(7) }),
        strum(mel('gtr', GTR, { vel: 0.55 }), 0.012),
        drums('tamb', TAMB_TAIL, TAMB),
        // castanets: the wink in the tune's rest (bar 3, as in the march), and the call into a in
        // the turnaround, as in the vamp
        hits('cast', [
          [bar(3) + 12, 60, 0.62],
          [bar(3) + 13, 60, 0.52],
          [bar(3) + 14, 60, 0.76],
          ...CAST_CALL(bar(12)),
        ]),
      ],
    },
  },
  form: ['march', 'fin', 'vamp', 'tail'],
  loopFrom: 3,
};
