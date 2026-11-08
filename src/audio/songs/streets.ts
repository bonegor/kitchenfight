/**
 * STREETS (stage 3, I Vicoli di Napoli, sunset → night) — "La Danza".
 * Rossini's Tarantella napoletana "La Danza" (Soirées musicales No. 8, 1835) as a frantic
 * street-band chase; the traditional Tarantella Napoletana is the dark night section.
 * 6/8, ♩. = 144. Verse A minor, "salterà" C major, Neapolitan bridge A minor, refrain A major,
 * night section D minor. Melodies proven against the references with scripts/music/compare.py
 * (docs/music/streets.md).
 * Form: intro(4) A(16, verse) B(16, "salterà") B2(8, Neapolitan bridge) C(16, A-major refrain)
 *       N(16, Tarantella Napoletana, night) A2(16, verse tutti) C2(16, refrain tutti) → loop to A.
 */
import { arp, comp, cresc, drums, hits, mel, pad, type SongDef } from '../sequencer';

// La Danza, bb_ladanza1.abc voice 1, at sounding pitch (the reference spells it against an
// E-major signature: C## = D, B# = C, F## = G, E# = F). One step = one eighth.

/** verse "Già la luna è in mezzo al mare, mamma mia, si salterà" (ref bars 49-56 / 57-64) */
const VERSE_1 = `
  r:2 E5:3 D5:1 | C5:1 D5 C5' B4 C5 B4' | A4:1 B4 A4' G4 A4 G4' | F4:2 F5:1 F4:2 F4:1 |
  E4:3 E5:2 D5:1 | C5:1 D5 C5' B4 C5 B4' | A4:1 B4 A4' B4 C5 B4' | E4:2 E5:1 E4 F#4 G#4' |`;
const VERSE_2 = `
  A4:2 r:1 E5:2 D5:1 | C5:1 D5 C5' B4 C5 B4' | A4:1 B4 A4' G4 A4 G4' | F4:2 F5:1 F4:2 F4:1 |
  E4:3 E5:2 D5:1 | C5:1 D5 C5' B4 C5 B4' | A4:1 B4 A4' B4 C5 B4' | E4:2 E5:1 E4 F#4 G#4' |`;
const VERSE = VERSE_1 + VERSE_2;
const VERSE_HALF = 'Am:3 E7:3 | Am:3 A7:3 | F:3 F/A:3 | C:3 E7/B:3 | Am:3 Em/G:3 | Dm7/F:3 Dm6:3 | E7:6';
const VERSE_CH = `Am:6 | ${VERSE_HALF} | Am:6 | ${VERSE_HALF}`;
const VERSE_BASS_HALF =
  'A2:2 r:1 E2:2 r:1 | A2:2 r:1 G2:2 r:1 | F2:2 r:1 A2:2 r:1 | C3:2 r:1 B2:2 r:1 | A2:2 r:1 G2:2 r:1 | F2:2 r:1 D2:2 r:1 | E2:2 r:1 G#2:2 r:1 |';
const VERSE_BASS = `A2:2 r:1 E2:2 r:1 | ${VERSE_BASS_HALF} A2:2 r:1 E2:2 r:1 | ${VERSE_BASS_HALF}`;
/** clarinet thirds / sixths under the verse (each note checked against the chord) */
const VERSE_HARM_HALF = `
  A4:1 B4 A4' G#4 A4 G#4' | C4:1 D4 C4' E4 C#4 E4' | A3:2 A4:1 A3:2 r:1 |
  C4:3 G#4:2 B4:1 | A4:1 B4 A4' G4 A4 G4' | F4:1 G4 F4' D4 E4 D4' | B3:2 G#4:1 B3 D4 E4' |`;
const VERSE_HARM = `r:3 G#4:2 B4:1 | ${VERSE_HARM_HALF} C4:2 r:1 C5:2 B4:1 | ${VERSE_HARM_HALF}`;
/** A2 phrase stabs (Dm, C, Am, C), voiced at or under the tune's downbeat note (D4 of the night
 *  tune, E4, A4, E4) */
const R3 = 'r:6 | r:6 | r:6 |';
const A2_BRASS = `D3+F3+A3+D4:1 r:5 | ${R3} C3+G3+C4+E4:1 r:5 | ${R3} A3+C4+E4+A4:1 r:5 | ${R3} C3+G3+C4+E4:1 r:5 | ${R3}`;

/** "salterà": the repeated-note continuation (ref bars 73-88) */
const SALT_HALF = `
  C5:2 C5:1 C5:2 C5:1 | C5:2 C5:1 C5:2 C5:1 | E5:2 E5:1 E5:1 D5 C5' |
  G5:3 D5:2 D5:1 | D5:2 D5:1 D5:2 D5:1 | F5:2 F5:1 F5:2 F5:1 | G4:2 G4:1 G4:1 A4 B4' |`;
const SALT = `A4:2 r:1 C5:2 C5:1 | ${SALT_HALF} C5:3 C5:2 C5:1 | ${SALT_HALF}`;
const SALT_CLAR = `r:6 | r:6 | r:6 | r:6 | ${SALT_HALF.split('|').slice(3).join('|')} r:6 | r:6 | r:6 | r:6 | ${SALT_HALF.split('|').slice(3).join('|')}`;
const SALT_CH =
  'Am:3 C:3 | C:6 | Am7:6 | D7:6 | G:6 | Gm:6 | Dm:6 | G7:6 | C:6 | C:6 | Am7:6 | D7:6 | G:6 | Gm:6 | Dm:6 | G7:6';
const SALT_BASS = `
  A2:2 r:1 C3:2 r:1 | C2:2 r:1 C3:2 r:1 | A1:2 r:1 A2:2 r:1 | D2:2 r:1 D3:2 r:1 |
  G1:2 r:1 G2:2 r:1 | G1:2 r:1 G2:2 r:1 | D2:2 r:1 D3:2 r:1 | G2:2 r:1 B1:2 r:1 |
  C2:2 r:1 C3:2 r:1 | C2:2 r:1 C3:2 r:1 | A1:2 r:1 A2:2 r:1 | D2:2 r:1 D3:2 r:1 |
  G1:2 r:1 G2:2 r:1 | G1:2 r:1 G2:2 r:1 | D2:2 r:1 D3:2 r:1 | G2:2 r:1 B2:2 r:1 |`;
/** mandolin off-beat double stops ("pa-pa") for one bar, one dyad per half bar */
const chops = (a: string, b = a): string => `r:1 ${a}:1 ${a}:1 r:1 ${b}:1 ${b}:1 |`;
/** "salterà" chops, written out so they stay under the tune (B3–B4; the tune is G4–G5 here):
 *  Am|C C4E4|E4G4 · C E4G4 · Am7 E4G4 · D7 F#4A4 · G G4B4 · Gm G4Bb4 · Dm F4A4 · G7 B3F4 (→ C C4E4) */
const SALT_TAIL = [chops('F#4+A4'), chops('G4+B4'), chops('G4+Bb4'), chops('F4+A4'), chops('B3+F4')].join(' ');
const SALT_MAND = [
  chops('C4+E4', 'E4+G4'), chops('E4+G4'), chops('E4+G4'), SALT_TAIL,
  chops('C4+E4'), chops('E4+G4'), chops('E4+G4'), SALT_TAIL,
].join(' ');

/** Neapolitan bridge (ref bars 89-96): B♭ (♭II) → E7 → A */
const NEAP = `
  C5:2 r:1 Bb4:2 Bb4:1 | F5:3 Bb4:2 Bb4:1 | F5:3 A4:1 Bb4 A4 | G#4:1 B4 D5' F5 E5 D5' |
  C5:1 B4 A4' Bb4:2 Bb4:1 | F5:3 Bb4:2 Bb4:1 | F5:3 A4:1 Bb4 A4' | G#4:1 F5 E5' D5 C5 B4' |`;
const NEAP_CH =
  'C:3 Bb/D:3 | Bb/F:3 Bb/D:3 | Bb/F:3 Bb/D:3 | E7:3 E7/G#:3 | Am:3 Bb/D:3 | Bb/F:3 Bb/D:3 | Bb/F:3 Bb/D:3 | E7:3 E7/G#:3';
const NEAP_BASS = `
  C3:2 r:1 D3:2 r:1 | F2:2 r:1 D2:2 r:1 | F2:2 r:1 D2:2 r:1 | E2:2 r:1 G#2:2 r:1 |
  A2:2 r:1 D2:2 r:1 | F2:2 r:1 D2:2 r:1 | F2:2 r:1 D2:2 r:1 | E2:2 r:1 G#2:2 r:1 |`;
/** brass on every beat of the bridge (accented beat 1), voiced under the tune: top G4/F4/E4
 *  where the tune's low notes are G#4–B♭4 (C G3C4E4G4 · B♭ F3B♭3D4F4 · E7 G#3B3D4E4 · Am E3A3C4E4) */
const BR = { C: 'G3+C4+E4+G4', Bb: 'F3+Bb3+D4+F4', E7: 'G#3+B3+D4+E4', Am: 'E3+A3+C4+E4' };
const stab2 = (a: string, b = a): string => `${a}:2@0.84 r:1 ${b}:2 r:1 |`;
const NEAP_BRASS = [
  stab2(BR.C, BR.Bb), stab2(BR.Bb), stab2(BR.Bb), stab2(BR.E7),
  stab2(BR.Am, BR.Bb), stab2(BR.Bb), stab2(BR.Bb), stab2(BR.E7),
].join(' ');

/** A-major refrain (ref bars 110-125) */
const REFRAIN = `
  A5':2 A4':1 A4':2 A4':1 | E5:6 | _:1 D5' C#5' D5 F#5 E5' | E5:3 C#5:1 r:2 |
  E5:1/4 A5':7/4 A4':1 A4':2 A4':1 | E5:6 | _:1 F#5' E5' D#5 C5 G#4' | C#5:3 E5:3 |
  A5':2 A4':1 A4':2 A4':1 | E5:6 | _:1 D5' C#5' D5 F#5 E5' | E5:3 C#5:1 r:2 |
  E5:1/4 A5':7/4 A4':1 A4':2 A4':1 | E5:6 | _:1 D5' C#5' B4' D5' C#5' | A4:2 r:4 |`;
/** clarinet thirds / sixths under the refrain */
const REF_HARM_A = "C#5':2 C#4':1 C#4':2 C#4':1 | C#5:6 | G#4:1 B4' A4' B4 D5 G#4' | C#5:3 A4:1 r:2 |";
const REF_HARM = `
  ${REF_HARM_A} r:1/4 C#5':7/4 C#4':1 C#4':2 C#4':1 | C#5:6 | _:1 D#5' C#5' C5 G#4 C4' | E4:3 G#4:3 |
  ${REF_HARM_A} r:1/4 C#5':7/4 C#4':1 C#4':2 C#4':1 | C#5:6 | G#4:1 B4' A4' G#4' B4' A4' | C#4:2 r:4 |`;
const REF_CH =
  'A:6 | A:6 | E7/A:6 | A:6 | A:6 | F#7:3 A7/G:3 | C#m/G#:3 G#7:3 | C#m:3 E7:3 | A:6 | A:6 | E7/A:6 | A:6 | A:6 | A:6 | E:3 E7:3 | A:6';
const REF_BASS_15 = `
  A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 |
  A2:2 r:1 E2:2 r:1 | F#2:2 r:1 G2:2 r:1 | G#2:2 r:1 G#2:2 r:1 | C#3:2 r:1 E2:2 r:1 |
  A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 |
  A2:2 r:1 E2:2 r:1 | A2:2 r:1 C#3:2 r:1 | E2:2 r:1 G#2:2 r:1 |`;
const REF_BASS = `${REF_BASS_15} A2:2 r:1 E2:2 r:1 |`;
const REF_BASS_STOP = `${REF_BASS_15} A2:2 r:4 |`;
/** the refrain's staccato "A" calls, for the xylophone; in bars 5 and 13 it waits for the
 *  tune's on-beat grace E (like the clarinet), so its A lands with the mandolin's and accordion's */
const CALL = "A5':2 A4':1 A4':2 A4':1 | r:6 | r:6 | r:6 |";
const CALL_GRACE = "r:1/4 A5':7/4 A4':1 A4':2 A4':1 | r:6 | r:6 | r:6 |";
const REF_CALLS = CALL + CALL_GRACE + CALL + CALL_GRACE;

// Tarantella Napoletana, jc_tarantellanap_201233905.abc X:16, strain B (bars 9-17), moved down a
// fifth from A minor to D minor for the night section.
const TN_B = `
  F4:1 E4 F4 G4 F4 E4 | F4:1 E4 F4 G4 F4 E4 | F4:1 E4 D4 C#4 D4 E4 | D4:2 r:1 D4:2 E4:1 |
  F4:1 E4 F4 G4 F4 G4 | A4:1 G4 A4 Bb4 A4 G4 | F4:1 E4 D4 C#4 D4 E4 |`;
const NIGHT = `r:3 D4:2 E4:1 | ${TN_B} D4:2 r:1 D4:2 E4:1 | ${TN_B}`;
const R7 = 'r:6 | r:6 | r:6 | r:6 | r:6 | r:6 | r:6 |';
const NIGHT_HALF = 'Dm:3 Gm:3 | Dm:3 Gm:3 | Dm:3 A7:3 | Dm:6 | Dm:3 Gm:3 | Dm:3 Gm:3 | Dm:3 A7:3';
// bar 1: the refrain's A major becomes A7, and the strain's pickup sits over the tonic (as in the
// reference, where the pickup follows the strain-A cadence on the tonic)
const NIGHT_CH = `A7:3 Dm:3 | ${NIGHT_HALF} | Dm:6 | ${NIGHT_HALF}`;
const NIGHT_BASS_HALF =
  'D2:2 r:1 G1:2 r:1 | D2:2 r:1 G1:2 r:1 | D2:2 r:1 A1:2 r:1 | D2:2 r:1 A1:2 r:1 | D2:2 r:1 G1:2 r:1 | D2:2 r:1 G1:2 r:1 | D2:2 r:1 A1:2 r:1 |';
const NIGHT_BASS = `A1:2 r:1 D2:2 r:1 | ${NIGHT_BASS_HALF} D2:2 r:1 A1:2 r:1 | ${NIGHT_BASS_HALF}`;

const PAPA = 'r:1 c:1 c:1 r:1 c:1 c:1';
const STRUM = 'C:3 c:3';
/** tambourine: VCSL hits / shakes / accents / rolls (variant semantics of the instrument) */
const TB = {
  X: { v: 0.95, vr: [4, 5] },
  x: { v: 0.62, vr: [0, 1] },
  s: { v: 0.55, vr: [2, 3] },
  R: { v: 0.7, vr: [6, 7] },
};
const CS = { C: { v: 0.95 }, c: { v: 0.62 }, q: { v: 0.4 } };
const KK = { K: { v: 0.85 }, k: { v: 0.55 } };

export const streets: SongDef = {
  id: 'streets',
  bpm: 144,
  stepsPerBeat: 3,
  barSteps: 6,
  scale: 'A harmonic minor',
  gainDb: -2.3,
  humanize: 0.003,
  reverb: { rt60: 1.2, size: 0.85, damp: 0.55, predelay: 0.014, er: 0.35, hp: 300, lp: 7200, wet: 1.3 },
  channels: {
    mand: { inst: 'mandolin', gain: -1.7, pan: -0.3, send: 0.18 },
    acc: { inst: 'accordion', gain: -2.4, pan: 0.08, send: 0.16 },
    clar: { inst: 'clarinet', gain: -7.7, pan: 0.26, send: 0.2 },
    clarN: { inst: 'clarinet', gain: -1.6, pan: 0.04, send: 0.22 },
    cello: { inst: 'cello', gain: -9.6, pan: -0.18, send: 0.2 },
    accC: { inst: 'accChord', gain: -12.7, pan: -0.12, send: 0.1, hum: 0.5 },
    gtr: { inst: 'guitar', gain: -9, pan: 0.38, send: 0.12, hum: 0.6 },
    bass: { inst: 'uprightBass', gain: -5, pan: 0, send: 0.05, hum: 0.4 },
    tuba: { inst: 'tuba', gain: -12.1, pan: 0, send: 0.04, hum: 0.4 },
    brass: { inst: 'brass', gain: -13.2, pan: 0.12, send: 0.2, hum: 0.3 },
    xylo: { inst: 'xylophone', gain: -7, pan: 0.42, send: 0.18 },
    str: { inst: 'strings', gain: -7.7, pan: 0, send: 0.3, hum: 0 },
    tamb: { inst: 'tamb', gain: -5.3, pan: 0.3, send: 0.1, hum: 0.6 },
    cast: { inst: 'castanets', gain: -6, pan: -0.34, send: 0.1, hum: 0.6 },
    kick: { inst: 'kick', gain: -16, pan: 0, send: 0.05, hum: 0 },
    crash: { inst: 'crash', gain: -6.5, pan: 0.2, send: 0.25, hum: 0 },
    cym: { inst: 'cymbal', gain: -1.2, pan: -0.2, send: 0.25, hum: 0 },
    timp: { inst: 'timpani', gain: -6.8, pan: 0.05, send: 0.2, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: 'Am:6 | Am:6 | Am:6 | E7:6',
      parts: [
        drums('cast', 'C.cC.c|C.cC.c|CccCcc|CccCqq', CS),
        drums('tamb', '......|s..s..|X.xX.x|R.....', TB),
        mel('bass', 'A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 | A2:2 r:1 E2:2 r:1 | E2:2 r:1 G#2:2 r:1 |', { vel: 0.8 }),
        comp('gtr', STRUM, { lo: 'E3', hi: 'E4', vel: 0.6, strum: 0.012, from: 1 }),
        comp('accC', PAPA, { lo: 'G3', hi: 'G4', vel: 0.55, n: 3, gate: 0.6, from: 2 }),
        comp('brass', 'C:2 r:4 | r:6 | r:6 | C:2 r:4', { lo: 'G#3', hi: 'E5', vel: 0.75, n: 4 }),
        hits('timp', [[0, 'A2', 0.85], [18, 'E2', 0.85], [21, 'E2', 0.6]]),
        hits('crash', [[0, 60, 0.6]]),
      ],
    },
    A: {
      bars: 16,
      chords: VERSE_CH,
      parts: [
        mel('mand', VERSE, { vel: 0.9, tremMin: 3 }),
        mel('acc', VERSE_2, { vel: 0.7, at: 48 }),
        mel('bass', VERSE_BASS, { vel: 0.8 }),
        comp('accC', PAPA, { lo: 'G3', hi: 'G4', vel: 0.5, n: 3, gate: 0.6 }),
        comp('gtr', STRUM, { lo: 'E3', hi: 'E4', vel: 0.55, strum: 0.012 }),
        drums('tamb', 'X.xX.x', TB, { vel: 0.8 }),
        drums('cast', '.cc.cc', CS, { vel: 0.75 }),
      ],
    },
    B: {
      bars: 16,
      chords: SALT_CH,
      parts: [
        mel('acc', SALT, { vel: 0.9 }),
        mel('clar', SALT_CLAR, { vel: 0.7, oct: -1 }),
        mel('bass', SALT_BASS, { vel: 0.8 }),
        // vel 0.45 keeps every chop on the mandolin's soft layer (threshold 0.5, ±5 % jitter)
        mel('mand', SALT_MAND, { vel: 0.45 }),
        comp('gtr', STRUM, { lo: 'E3', hi: 'E4', vel: 0.55, strum: 0.012 }),
        comp('brass', 'C:1 r:5', { lo: 'F3', hi: 'D5', vel: 0.7, n: 4, from: 3, to: 8 }),
        comp('brass', 'C:1 r:5', { lo: 'F3', hi: 'D5', vel: 0.7, n: 4, from: 11, to: 16 }),
        drums('tamb', 'XsxXsx', TB, { vel: 0.85 }),
        drums('cast', 'C.cC.c', CS),
      ],
    },
    B2: {
      bars: 8,
      chords: NEAP_CH,
      parts: [
        mel('acc', NEAP, { vel: 0.92 }),
        mel('clar', NEAP, { vel: 0.75 }),
        mel('bass', NEAP_BASS, { vel: 0.85 }),
        mel('brass', NEAP_BRASS, { vel: 0.7 }),
        comp('accC', PAPA, { lo: 'G3', hi: 'G4', vel: 0.5, n: 3, gate: 0.6 }),
        drums('tamb', 'X..X..|X..X..|X..X..|XxxR..', TB),
        drums('cast', 'CccCcc', CS, { vel: 0.85 }),
        drums('kick', 'K.....|K.....|K.....|K..K..', KK),
        hits('timp', [
          [18, 'E2', 0.8],
          [21, 'G#2', 0.7],
          ...Array.from({ length: 12 }, (_, i): [number, string, number] => [42 + i * 0.5, 'E2', 0.3 + i * 0.05]),
        ]),
        // suspended-cymbal roll into C (variant 1 = the roll, at any velocity)
        hits('cym', [[42, 60, 0.68, 6]], 1),
      ],
    },
    C: {
      bars: 16,
      chords: REF_CH,
      parts: [
        mel('mand', REFRAIN, { vel: 0.9, tremMin: 3 }),
        mel('acc', REFRAIN, { vel: 0.82 }),
        mel('clar', REF_HARM, { vel: 0.58 }),
        mel('bass', REF_BASS_STOP, { vel: 0.85 }),
        comp('accC', PAPA, { lo: 'G3', hi: 'G4', vel: 0.55, n: 3, gate: 0.6, to: 15 }),
        comp('gtr', STRUM, { lo: 'E3', hi: 'E4', vel: 0.6, strum: 0.012, to: 15 }),
        comp('gtr', 'C:1 r:5', { lo: 'E3', hi: 'E4', vel: 0.7, strum: 0.01, gate: 0.5, from: 15 }),
        comp('brass', 'C:1 r:5 | r:6 | r:6 | r:6', { lo: 'A3', hi: 'E5', vel: 0.75, n: 4 }),
        comp('brass', 'C:1 r:5', { lo: 'A3', hi: 'E5', vel: 0.85, n: 4, from: 15 }),
        drums('tamb', 'XxxXxx', TB, { vel: 0.9, to: 15 }),
        drums('cast', 'CccCcc', CS, { vel: 0.85, to: 15 }),
        drums('kick', 'K..k..', KK, { to: 15 }),
        drums('tamb', 'X.....', TB, { from: 15 }),
        drums('cast', 'C.....', CS, { from: 15 }),
        drums('kick', 'K.....', KK, { from: 15 }),
        hits('crash', [[0, 60, 0.75]]),
      ],
    },
    N: {
      bars: 16,
      chords: NIGHT_CH,
      parts: [
        mel('clarN', NIGHT, { vel: 0.85 }),
        mel('cello', `r:3 D4:2 E4:1 | ${TN_B} D4:2 r:4 | ${R7}`, { vel: 0.6, oct: -1 }),
        mel('mand', `r:6 | ${R7} r:3 D4:2 E4:1 | ${TN_B}`, { vel: 0.7, oct: 1, tremMin: 2 }),
        mel('bass', NIGHT_BASS, { vel: 0.8 }),
        // voiced in C#3–C#4 (Dm D3F3A3, Gm D3G3B♭3, A7 C#3G3A3): the octave note of the figure is
        // at most D4 / C#4, at or under the clarinet (C#4–B♭4)
        arp('gtr', '0:1 1 2 3 2 1', { lo: 'C#3', hi: 'C#4', vel: 0.6, n: 3 }),
        // low strings under the clarinet (Dm F3A3D4, Gm G3B♭3D4, A7 G3A3C#4), swelling into A2
        cresc(pad('str', { lo: 'D3', hi: 'D4', vel: 0.4, n: 3, from: 8 }), 0.35, 1.15),
        drums('cast', 'c..c..|c..c.c', CS, { vel: 0.9 }),
        drums('tamb', 's..s..', TB, { vel: 0.8, to: 8 }),
        drums('tamb', 'X.sX.s', TB, { vel: 0.75, from: 8 }),
        hits('timp', [[0, 'A2', 0.7], [3, 'A2', 0.5], [6, 'D2', 0.6], [48, 'D2', 0.6]]),
      ],
    },
    A2: {
      bars: 16,
      chords: `Dm:3 E7:3 | ${VERSE_HALF} | Am:6 | ${VERSE_HALF}`,
      parts: [
        mel('clarN', 'D4:2 r:4 |', { vel: 0.85 }),
        mel('acc', VERSE, { vel: 0.92 }),
        mel('mand', VERSE, { vel: 0.7, tremMin: 3 }),
        mel('clar', VERSE_HARM, { vel: 0.62 }),
        mel('bass', `D2:2 r:1 E2:2 r:1 | ${VERSE_BASS_HALF} A2:2 r:1 E2:2 r:1 | ${VERSE_BASS_HALF}`, { vel: 0.85 }),
        comp('accC', PAPA, { lo: 'G3', hi: 'G4', vel: 0.55, n: 3, gate: 0.6 }),
        comp('gtr', STRUM, { lo: 'E3', hi: 'E4', vel: 0.6, strum: 0.012 }),
        mel('brass', A2_BRASS, { vel: 0.84 }),
        drums('tamb', 'XsxXsx', TB, { vel: 0.9 }),
        drums('cast', 'CccCcc', CS, { vel: 0.8 }),
        drums('kick', 'K..k..', KK),
        hits('crash', [[0, 60, 0.7]]),
        hits('timp', Array.from({ length: 12 }, (_, i): [number, string, number] => [90 + i * 0.5, 'E2', 0.3 + i * 0.05])),
        // the roll into C2 is louder: the tutti's tambourine and castanets fill its band
        hits('cym', [[90, 60, 0.9, 6]], 1),
      ],
    },
    C2: {
      bars: 16,
      chords: REF_CH,
      parts: [
        mel('acc', REFRAIN, { vel: 0.92 }),
        mel('mand', REFRAIN, { vel: 0.72, oct: 1, tremMin: 3 }),
        mel('clar', REF_HARM, { vel: 0.62 }),
        mel('xylo', REF_CALLS, { vel: 0.6, oct: 1 }),
        mel('bass', REF_BASS, { vel: 0.88 }),
        mel('tuba', REF_BASS, { vel: 0.7, oct: -1 }),
        comp('accC', PAPA, { lo: 'G3', hi: 'G4', vel: 0.55, n: 3, gate: 0.6 }),
        comp('gtr', STRUM, { lo: 'E3', hi: 'E4', vel: 0.62, strum: 0.012 }),
        comp('brass', 'C:1 r:5 | r:6 | r:6 | r:6', { lo: 'A3', hi: 'E5', vel: 0.8, n: 4 }),
        drums('tamb', 'XxxXxx', TB, { vel: 0.95, to: 15 }),
        drums('tamb', 'XxxR..', TB, { vel: 0.95, from: 15 }),
        drums('cast', 'CccCcc', CS, { vel: 0.9 }),
        drums('kick', 'K..k..', KK),
        hits('crash', [[0, 60, 0.8]]),
      ],
    },
  },
  form: ['intro', 'A', 'B', 'B2', 'C', 'N', 'A2', 'C2'],
  loopFrom: 1,
};
