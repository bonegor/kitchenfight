/**
 * TITLE — "Funiculì, Funiculà" (Luigi Denza, 1880; public domain). The game's main theme.
 *
 * F major, 6/8, ♩. = 124 (3 steps per beat, one step = an eighth). Melody transcribed from
 * bb_funiculi.abc voice 1 (E♭ songbook print "A Merry Life"), transposed up a whole tone; harmony
 * from the chord symbols of wf_funiculi.abc / the session book (F / C7 verse, Am-E7 / C-G7 middle,
 * C7 pedal → F | A7/E | Dm | A7/C# | Dm | B♭ | F/C | C7 | F refrain) and the printed bass line of
 * bb_funiculi.abc V:2 (the chromatic F–E–D–C♯–D under "funiculì, funiculà").
 *
 * Form (bars):  intro 3 | verse 18 (ref 2–18 + fill) | refrain 16 (ref 38–53, full band)
 *               | middle 18 (ref 20–37: A minor → C major, mandolin lead) | refrain2 16 (bigger)
 *               → loop to the verse. The verse pickup (ref bar 1) sits in the last bar of the intro
 *               and of refrain2; the middle-section pickup (ref bar 19) in the last bar of refrain.
 * docs/music/title.md documents the reference, the compare.py proofs and the measurements.
 */
import { arp, comp, cresc, drums, harm, hits, mel, pad, withVel, type Part, type SongDef } from '../sequencer';

/** Tambourine hit map (variants: 0/1 hit, 2/3 shake, 4/5 accent, 6/7 roll); also used by other tracks. */
export const TAMB = {
  X: { v: 0.95, vr: [4, 5] },
  x: { v: 0.62, vr: [0, 1] },
  s: { v: 0.55, vr: [2, 3] },
  R: { v: 0.7, vr: [6, 7] },
};
const CAST = { X: { v: 0.95 }, x: { v: 0.62 } };
const KICK = { X: { v: 0.9 }, x: { v: 0.6 } };

const rep = (tok: string, n: number): string => Array(n).fill(tok).join(' ');

/** n evenly spaced hits from step s over len steps, velocity a → b (timpani / snare rolls) */
const roll = (s: number, len: number, n: number, note: string, a: number, b: number): Array<[number, string, number]> =>
  Array.from({ length: n }, (_, i): [number, string, number] => [s + (i * len) / n, note, a + ((b - a) * i) / Math.max(1, n - 1)]);

// ---------------------------------------------------------------------------------------------
// Melody (bb_funiculi.abc V:1, + 2 semitones)
// ---------------------------------------------------------------------------------------------

/** verse pickup (ref bar 1): last bar of the intro and of refrain2 */
const VERSE_PICKUP = 'r:5 C5:1 |';
/** verse, ref bars 2–10 ("Aieressera, oje Nanninè … tu saie addò? Tu saie addò?") */
const VERSE_A = `
  F5:6 | _:2 F5:1 E5:2 E5:1 | C5:2 C5:1 D5:2 D5:1 | A4:3 A4:3 | _:2 A4:1 G4:2 F4:1 |
  F4:6 | _:1 r:1 A4:1 G4:2 F4:1 | F4:6 | _:2 r:3 C5:1 |`;
/** ref bars 11–18, plus the fill bar into the refrain (the last note's tie, as in ref bar 19) */
const VERSE_B = `
  F5:6 | _:2 F5:1 E5:2 E5:1 | C5:2 C5:1 D5:2 D5:1 | A4:3 A4:3 | _:2 A4:1 G4:2 F4:1 |
  F4:6 | _:1 r:1 A4:1 G4:2 F4:1 | F4:6 | _:2 r:4 |`;
/** the accordion's second phrase: the same notes with an upper grace and a mordent */
const VERSE_B_ORN = `
  {G5}F5:6 | _:2 F5:1 E5:2 E5:1 | C5:2 C5:1 D5:2 D5:1 | A4*:3 A4:3 | _:2 A4:1 G4:2 F4:1 |
  F4:6 | _:1 r:1 A4:1 G4:2 F4:1 | F4:6 | _:2 r:4 |`;

/** refrain "Jammo, jammo… funiculì, funiculà", ref bars 38–52 (melody = top of the printed thirds) */
const REFRAIN_MEL = `
  E5:3 D5:1 r:2 | E5:3 D5:1 r:2 | F5:2 E5:1 D5:2 F5:1 | E5:5 r:1 |
  E5:3 D5:1 r:2 | E5:3 D5:1 r:2 | F5:2 E5:1 D5:2 F5:1 | C5:1 r:1 A4:1 A4:2 A4:1 |
  A4:2 A4:1 A4:2 A4:1 | A4:2 A4:1 A4:2 A4:1 | A4:2 A4:1 A4:2 A4:1 | F5:6 |
  G5:2 F5:1 D5:2 F5:1 | C5:1 r:1 A4:1 A4:2 Bb4:1 | C5:2 Bb4:1 A4:2 G4:1 |`;
/** ref bar 53 */
const REFRAIN_END = 'F4:2 r:4 |';
/** the accordion plays the printed thirds (bb_funiculi.abc V:1 lower voice), ref bars 38–52 */
const REFRAIN_ACC = `
  C5+E5:3 Bb4+D5:1 r:2 | C5+E5:3 Bb4+D5:1 r:2 | D5+F5:2 C5+E5:1 Bb4+D5:2 D5+F5:1 | C5+E5:5 r:1 |
  C5+E5:3 Bb4+D5:1 r:2 | C5+E5:3 Bb4+D5:1 r:2 | D5+F5:2 C5+E5:1 Bb4+D5:2 D5+F5:1 | A4+C5:1 r:1 F4+A4:1 F4+A4:2 F4+A4:1 |
  G4+A4:2 G4+A4:1 G4+A4:2 G4+A4:1 | F4+A4:2 F4+A4:1 F4+A4:2 F4+A4:1 | A4:2 A4:1 A4:2 A4:1 | D5+F5:6 |
  E5+G5:2 D5+F5:1 Bb4+D5:2 D5+F5:1 | A4+C5:1 r:1 F4+A4:1 F4+A4:2 G4+Bb4:1 | A4+C5:2 G4+Bb4:1 F4+A4:2 E4+G4:1 |`;
/** refrain2: the same thirds, ornamented (grace notes, accents, a re-struck "jà") */
const REFRAIN_ACC2 = `
  {D5}C5+E5!:3 Bb4+D5:1 r:2 | {D5}C5+E5!:3 Bb4+D5:1 r:2 | D5+F5:2 C5+E5:1 Bb4+D5:2 D5+F5:1 | C5+E5:3 C5+E5!:2 r:1 |
  {D5}C5+E5!:3 Bb4+D5:1 r:2 | {D5}C5+E5!:3 Bb4+D5:1 r:2 | D5+F5:2 C5+E5:1 Bb4+D5:2 D5+F5:1 | A4+C5!:1 r:1 F4+A4:1 F4+A4:2 F4+A4:1 |
  G4+A4!:2 G4+A4:1 G4+A4:2 G4+A4:1 | F4+A4!:2 F4+A4:1 F4+A4:2 F4+A4:1 | A4!:2 A4:1 A4:2 A4:1 | {E5}D5+F5!:6 |
  {F5}E5+G5!:2 D5+F5:1 Bb4+D5:2 D5+F5:1 | A4+C5!:1 r:1 F4+A4:1 F4+A4:2 G4+Bb4:1 | A4+C5:2 G4+Bb4:1 F4+A4:2 E4+G4:1 |`;

/** middle-section pickup (ref bar 19: the tied end of the previous note, then "Addò") */
const MIDDLE_PICKUP = 'F4:2 r:3 A4:1 |';
/** middle section, ref bars 20–37 ("Addò lu fuoco coce…" A minor; "E nun te corre appriesso…" C major) */
const MIDDLE_A = `
  A4:6 | _:2 A4:1 B4:2 B4:1 | A4:2 A4:1 B4:2 B4:1 | A4:3 A4:3 | _:2 E4:1 E4:2 E4:1 |
  E4:6 | _:1 r:1 E4:1 E4:2 E4:1 | E4:6 | _:2 r:3 C5:1 |`;
const MIDDLE_B = `
  C5:6 | _:2 C5:1 D5:2 D5:1 | C5:2 C5:1 D5:2 D5:1 | C5:3 C5:3 | _:2 G4:1 G4:2 G4:1 |
  G4:6 | _:1 r:1 G4:1 G4:2 G4:1 | G4:6 | _:2 r:4 |`;

// ---------------------------------------------------------------------------------------------
// Harmony and bass lines
// ---------------------------------------------------------------------------------------------

const INTRO_CH = 'C7:6 | C7:6 | F:3 C7:3';
const VERSE_CH =
  'F:6 | F:3 C7:3 | F:3 Bb:3 | F:6 | F:3 C7:3 | F:6 | F:3 C7:3 | F:6 | F:3 C7:3 | ' +
  'F:6 | F:3 C7:3 | F:3 Bb:3 | F:6 | F:3 C7:3 | F:6 | F:3 C7:3 | F:6 | F:3 C7:3';
const REFRAIN_BODY_CH =
  'C7:6 | C7:6 | Bb/C:2 C7:1 Bb/C:3 | C7:6 | C7:6 | C7:6 | Bb/C:2 C7:1 Bb/C:3 | F:6 | A7/E:6 | Dm:6 | A7/C#:6 | Dm:6 | C7/Bb:2 Bb:4 | F/C:5 C7:1 | C7:3 F/C:2 C7:1';
const MIDDLE_CH =
  'Am:6 | Am:3 E7:3 | Am:3 E7:3 | Am:6 | Am:3 E7:3 | Am:6 | Am:3 E7/G#:3 | Am:6 | Am:3 Am/G:3 | ' +
  'C:6 | C:3 G7:3 | C:3 G7:3 | C:6 | C:3 G7:3 | C:6 | C:3 G7/B:3 | C:6 | C:3 C7:3';

/** bass lines written out, so chord changes, inversions and walks are exact */
const VERSE_BASS = `
  F2:2 r:1 C2:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 Bb1:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 C2:2 r:1 |
  F2:2 r:1 A2:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 C2:2 E2:1 |
  F2:2 r:1 C2:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 Bb1:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 C2:2 r:1 |
  F2:2 r:1 A2:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 C2:2 r:1 | F2:2 r:1 E2:1 D2:1 Db2:1 |`;
/** refrain bass = bb_funiculi.abc V:2 (stop-time C pedal, then F–E–D–C♯–D, B♭, C, C7, F) */
const REFRAIN_BASS = `
  C2:3 C2:1 r:2 | C2:3 C2:1 r:2 | C2:2 C2:1 C2:2 C2:1 | C2:5 r:1 |
  C2:3 C2:1 r:2 | C2:3 C2:1 r:2 | C2:2 C2:1 C2:2 C2:1 | F2:1 r:1 F2:1 F2:2 F2:1 |
  E2:2 r:1 E2:2 r:1 | D2:2 r:1 D2:2 r:1 | C#2:2 r:1 C#2:2 r:1 | D2:6 |
  Bb1:2 r:1 F2:2 r:1 | C2:2 r:1 C2:2 r:1 | C2:2 r:1 C2:2 r:1 | F2:2 r:4 |`;
const MIDDLE_BASS = `
  A1:2 r:1 E2:2 r:1 | A1:2 r:1 E2:2 r:1 | A1:2 r:1 E2:2 r:1 | A1:2 r:1 C2:2 r:1 | A1:2 r:1 E2:2 r:1 |
  A1:2 r:1 E2:2 r:1 | A1:2 r:1 G#1:2 r:1 | A1:2 r:1 E2:2 r:1 | A1:2 r:1 G1:2 r:1 |
  C2:2 r:1 G1:2 r:1 | C2:2 r:1 G1:2 r:1 | C2:2 r:1 G1:2 r:1 | C2:2 r:1 E2:2 r:1 | C2:2 r:1 G1:2 r:1 |
  C2:2 r:1 G1:2 r:1 | C2:2 r:1 B1:2 r:1 | C2:2 r:1 G1:2 r:1 | C2:2 r:4 |`;

const PAPA = "r:1 c:1 c':1 r:1 c:1 c':1";
const PAH = "r:2 c':1 r:2 c':1";
/** bars whose melody anticipates the next downbeat on the last eighth ("and so DO | I") leave
 *  that eighth to the melody: no off-beat C7 chord under it */
const PAPA_ANT = "r:1 c:1 c':1 r:1 c:1 r:1";
const PAH_ANT = "r:2 c':1 r:3";
const VERSE_GTR = [PAPA, PAPA, PAPA, PAPA, PAPA_ANT, PAPA, PAPA_ANT, PAPA, PAPA, PAPA, PAPA, PAPA, PAPA, PAPA_ANT, PAPA, PAPA_ANT, PAPA, PAPA].join(' | ');
const VERSE_MANDC = [PAH, PAH, PAH, PAH, PAH_ANT, PAH, PAH_ANT, PAH, PAH].join(' | ');
const VERSE_ACCC = [PAPA, PAPA, PAPA, PAPA, PAPA_ANT, PAPA, PAPA_ANT, PAPA].join(' | ');
/** refrain comping: stop-time hits on "JAM-mo", oom-pa-pa elsewhere, a button at the end */
const STOP = 'C:3 c:1 r:2';
const REFRAIN_COMP = [STOP, STOP, PAPA, PAPA, STOP, STOP, PAPA, PAPA, PAPA, PAPA, PAPA, 'C:3 c:1 c:1 c:1', PAPA, PAPA, PAPA, 'C:2 r:4'].join(' | ');
const TBN_PUNCH = [STOP, STOP, 'r:6', 'r:6', STOP, STOP, 'r:6', 'C:1 r:5', 'C:2 r:4', 'C:2 r:4', 'C:2 r:4', 'C:3 r:3', 'C:2 r:4', 'C:1 r:5', 'C:2 r:4', 'C:2 r:4'].join(' | ');

// ---------------------------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------------------------

const SHAKE = Array.from({ length: 12 }, (_, i) => `E4+Bb4+C5:0.5@${(0.38 + i * 0.05).toFixed(2)}`).join(' ');

/** the refrain parts shared by refrain (first statement) and refrain2 (bigger) */
function refrainParts(big: boolean): Part[] {
  const lead = mel('acc', (big ? REFRAIN_ACC2 : REFRAIN_ACC) + (big ? 'F4:2 r:3 C5:1 |' : REFRAIN_END), { vel: 0.86 });
  // the band under the accordion: one velocity scale per refrain keeps the loudness arc moderate
  return [lead, ...bandParts(big).map((p) => withVel(p, big ? 0.86 : 0.9))];
}
function bandParts(big: boolean): Part[] {
  return [
    mel('accLo', REFRAIN_MEL + REFRAIN_END, { vel: 0.7, oct: -1 }),
    mel('mand', REFRAIN_MEL + (big ? REFRAIN_END : MIDDLE_PICKUP), { vel: big ? 0.74 : 0.7, tremMin: 3 }),
    mel('bass', REFRAIN_BASS, { vel: 0.85 }),
    comp('gtr', REFRAIN_COMP, { lo: 'G3', hi: 'E4', n: 3, vel: 0.55, strum: 0.01 }),
    comp('accC', REFRAIN_COMP, { lo: 'E3', hi: 'E4', n: 3, vel: 0.5 }),
    // clarinet: echoes "jam-mo" in the stop-time gaps, an arpeggio under the held "jà", a rising
    // chromatic inner line under "funiculì, funiculà" (against the falling bass)
    mel(
      'clar',
      `r:4 C5:1 Bb4:1 | r:4 C5:1 Bb4:1 | r:6 | r:2 C4:0.5 E4 G4 Bb4 C5:2 |
       r:4 C5:1 Bb4:1 | r:4 C5:1 Bb4:1 | r:6 | r:6 |
       C#4:6 | D4:6 | E4:6 | F4:6 | r:6 | r:6 | r:6 | r:6 |`,
      { vel: 0.72 },
    ),
    // brass punches: trombones under the "JAM-mo" stops and on "lì / là", trumpet on the accents
    comp('tbn', TBN_PUNCH, { lo: 'D3', hi: 'D4', n: 3, vel: 0.62, gate: 0.8 }),
    mel('tpt', `${rep('r:6 |', 7)} C5!':1 r:5 | A4!':2 r:4 | A4!':2 r:4 | A4!':2 r:4 | F5!:3 r:3 | G5!':2 r:4 | C5!':1 r:5 | C5!':2 r:4 | F4!':2 r:4 |`, { vel: 0.6 }),
    mel('glock', REFRAIN_MEL + REFRAIN_END, { vel: 0.5, oct: 1, minDur: 3 }),
    drums('tamb', 'X..x..|X..x..|XsxXsx|XsxRsx|X..x..|X..x..|XsxXsx|XsxXsx|XsxXsx|XsxXsx|XsxXsx|XsxXsx|XsxXsx|XsxXsx|XsxRxx|X.....', TAMB),
    drums(
      'cast',
      '........xxX.|........xxX.|X.....x.x...|X.....x.xxX.|........xxX.|........xxX.|X.....x.x...|X.....x.x...|' +
        'X.....x.x...|X.....x.x...|X.....x.x...|X...........|X.....x.x...|X.....x.x...|X.....xxxxX.|X...........',
      CAST,
      { stepDiv: 2 },
    ),
    drums('kick', 'X..x..|X..x..|X.....|X.....|X..x..|X..x..|X.....|X.....|X.....|X.....|X.....|X.....|X.....|X.....|X.....|X.....', KICK, { vel: big ? 0.95 : 0.8 }),
    hits('crash', big ? [[0, 60, 0.8], [66, 60, 0.75], [90, 60, 0.6]] : [[0, 60, 0.7], [66, 60, 0.65]]),
  ];
}

export const title: SongDef = {
  id: 'title',
  bpm: 124,
  stepsPerBeat: 3,
  barSteps: 6,
  scale: 'F major',
  gainDb: -1.5,
  humanize: 0.004,
  reverb: { rt60: 1.35, size: 0.95, damp: 0.5, predelay: 0.016, er: 0.32, hp: 260, lp: 7200, wet: 1.4 },
  channels: {
    acc: { inst: 'accordion', gain: -4, pan: 0.04, send: 0.16 },
    accLo: { inst: 'accordionDry', gain: -7, pan: -0.18, send: 0.14 },
    accC: { inst: 'accChord', gain: -10, pan: -0.14, send: 0.1, hum: 0.5 },
    mand: { inst: 'mandolin', gain: 0.5, pan: -0.32, send: 0.2 },
    mandC: { inst: 'mandolin', gain: -5, pan: 0.36, send: 0.14, hum: 0.6 },
    gtr: { inst: 'guitar', gain: -8.5, pan: 0.3, send: 0.12, hum: 0.6 },
    clar: { inst: 'clarinet', gain: -7, pan: 0.22, send: 0.2 },
    bsn: { inst: 'bassoon', gain: -6, pan: 0.18, send: 0.16 },
    xylo: { inst: 'xylophone', gain: -12, pan: 0.3, send: 0.2, hum: 0 },
    tpt: { inst: 'trumpet', gain: -6, pan: 0.16, send: 0.18 },
    tbn: { inst: 'trombone', gain: -8.5, pan: -0.2, send: 0.16, hum: 0.5 },
    bass: { inst: 'uprightBass', gain: -4, pan: 0, send: 0.05, hum: 0.5 },
    tuba: { inst: 'tuba', gain: -7, pan: 0.05, send: 0.05, hum: 0.5 },
    pizz: { inst: 'pizz', gain: -6, pan: -0.4, send: 0.14, hum: 0.5 },
    str: { inst: 'strings', gain: -14, pan: 0, send: 0.3, hum: 0 },
    glock: { inst: 'glock', gain: -7, pan: 0.4, send: 0.25 },
    tamb: { inst: 'tamb', gain: -3.5, pan: 0.28, send: 0.1, hum: 0.7 },
    cast: { inst: 'castanets', gain: -9, pan: -0.36, send: 0.1, hum: 0.6 },
    kick: { inst: 'kick', gain: -12, pan: 0, send: 0.08, hum: 0 },
    snare: { inst: 'snare', gain: -16, pan: 0.1, send: 0.12, hum: 0 },
    crash: { inst: 'crash', gain: -13, pan: 0.25, send: 0.2, hum: 0 },
    cym: { inst: 'cymbal', gain: -11, pan: -0.2, send: 0.25, hum: 0 },
    timp: { inst: 'timpani', gain: -12, pan: 0.05, send: 0.2, hum: 0 },
  },
  sections: {
    intro: {
      bars: 3,
      chords: INTRO_CH,
      parts: [
        // accordion flourish: bellows shake on C7, a run up the arpeggio, then the verse pickup
        mel('acc', `${SHAKE} | C4:0.5 E4 G4 Bb4 C5 E5 G5*:3 | ${VERSE_PICKUP}`, { vel: 0.9 }),
        hits('timp', [...roll(0, 6, 12, 'C2', 0.3, 0.75), [6, 'C2', 0.85], [12, 'F2', 0.95]]),
        hits('cym', [[0, 60, 0.5, 12]], 1),
        drums('tamb', 'R..R..|X.xxXx|X.....', TAMB),
        drums('cast', '............|X.....x.xxxx|X...........', CAST, { stepDiv: 2 }),
        hits('crash', [[12, 60, 0.8]]),
        hits('kick', [[12, 60, 0.9]]),
        comp('tbn', 'r:6 | r:6 | C:2 r:4', { lo: 'C3', hi: 'C4', n: 3, vel: 0.8 }),
        comp('tpt', 'r:6 | r:6 | C:2 r:4', { lo: 'F4', hi: 'C5', n: 2, vel: 0.7 }),
        comp('accC', 'r:6 | r:6 | C:2 r:2 c:1 c:1', { lo: 'E3', hi: 'E4', n: 3, vel: 0.6 }),
        comp('gtr', "r:6 | r:6 | C:2 r:2 c':1 c':1", { lo: 'G3', hi: 'E4', n: 3, vel: 0.6, strum: 0.012 }),
        mel('bass', 'r:6 | r:6 | F2:2 r:1 C2:2 r:1 |', { vel: 0.9 }),
      ],
    },
    verse: {
      bars: 18,
      chords: VERSE_CH,
      parts: [
        mel('acc', VERSE_A + VERSE_B_ORN, { vel: 0.9 }),
        mel('bass', VERSE_BASS, { vel: 0.85 }),
        comp('gtr', VERSE_GTR, { lo: 'A3', hi: 'F4', n: 3, vel: 0.55, strum: 0.01 }),
        comp('mandC', VERSE_MANDC, { lo: 'C4', hi: 'A4', n: 2, vel: 0.5, to: 9 }),
        // second phrase: accordion chords, clarinet in thirds, mandolin shimmer on the long notes
        comp('accC', VERSE_ACCC, { lo: 'E3', hi: 'E4', n: 3, vel: 0.45, from: 9, to: 17 }),
        harm('clar', rep('r:6 |', 9) + VERSE_B, { vel: 0.5, plain: true }),
        mel('mand', rep('r:6 |', 9) + VERSE_B, { vel: 0.5, oct: 1, minDur: 3, tremMin: 3 }),
        drums('tamb', 'x..s..|x..s.s|x..s..|x..s.s|x..s..|x..s.s|x..s..|x.sxss|x..s..|XsxXsx', TAMB, { to: 10 }),
        drums('tamb', `${rep('XsxXsx|', 7)}R..R..`, TAMB, { from: 10 }),
        drums(
          'cast',
          `${rep('............|', 6)}....x.x...x.|X...........|............|` +
            `${rep('............|', 4)}....x.x...x.|X...........|....x.x...x.|X...........|xxxxxxxxxxX.`,
          CAST,
          { stepDiv: 2 },
        ),
        // fill into the refrain: snare and timpani rolls, a suspended-cymbal swell
        hits('snare', roll(102, 6, 24, 'C4', 0.22, 0.85)),
        hits('timp', roll(102, 6, 12, 'C2', 0.3, 0.7)),
        hits('cym', [[102, 60, 0.5, 6]], 1),
      ],
    },
    refrain: {
      bars: 16,
      chords: REFRAIN_BODY_CH + ' | F:6',
      parts: refrainParts(false),
    },
    middle: {
      bars: 18,
      chords: MIDDLE_CH,
      parts: [
        mel('mand', MIDDLE_A + MIDDLE_B, { vel: 0.9, tremMin: 3 }),
        mel('bass', MIDDLE_BASS, { vel: 0.8 }),
        arp('gtr', '0:1 1 2 3 2 1', { lo: 'A2', hi: 'E4', n: 3, vel: 0.55 }),
        comp('pizz', PAH, { lo: 'E3', hi: 'C4', n: 3, vel: 0.5, to: 9 }),
        // answers in the held notes: a sneaky staccato bassoon in A minor, the clarinet in C major;
        // the accordion joins in thirds for the C-major half
        mel('bsn', `${rep('r:6 |', 5)} r:3 E4':1 C4' A3' | r:6 | r:3 E4':1 D4' C4' | B3':2 A3':1 r:3 | ${rep('r:6 |', 9)}`, { vel: 0.7 }),
        mel('clar', `${rep('r:6 |', 14)} r:3 E5:1 D5 C5 | r:6 | r:3 G5:1 E5 C5 | D5:1 C5:1 r:4 |`, { vel: 0.6 }),
        harm('accLo', rep('r:6 |', 9) + MIDDLE_B, { vel: 0.42 }),
        comp('accC', PAPA, { lo: 'E3', hi: 'C4', n: 3, vel: 0.42, from: 9, to: 17 }),
        cresc(pad('str', { lo: 'G3', hi: 'E4', n: 3, vel: 0.5, from: 9 }), 0.4, 1.2),
        drums('cast', 'X.....x.x.x.|X.....x.xxX.', CAST, { stepDiv: 2, to: 9, vel: 0.85 }),
        drums('cast', 'X.....x.x.x.|X.....x.xxX.', CAST, { stepDiv: 2, from: 9, to: 17 }),
        drums('tamb', 's..s..|s..s.s', TAMB, { to: 9, vel: 0.8 }),
        drums('tamb', 'x.sx.s|xsxXsx', TAMB, { from: 9, to: 17 }),
        // build into refrain2
        hits('snare', roll(102, 6, 24, 'C4', 0.25, 0.95)),
        hits('timp', roll(102, 6, 12, 'C2', 0.3, 0.75)),
        hits('cym', [[102, 60, 0.55, 6]], 1),
        comp('tbn', 'r:3 C:3', { lo: 'E3', hi: 'C4', n: 3, vel: 0.45, from: 17 }),
        // cartoon xylophone run up into the big refrain
        mel('xylo', `${rep('r:6 |', 17)} r:3 C5:0.25 D5 E5 F5 G5 A5 Bb5 C6 D6 E6 F6 G6 |`, { vel: 0.6 }),
      ],
    },
    refrain2: {
      bars: 16,
      chords: REFRAIN_BODY_CH + ' | F:3 C7:3',
      parts: [
        ...refrainParts(true),
        mel('tuba', REFRAIN_BASS, { vel: 0.72 }),
        // the trumpet joins the "Jammo, jammo" call
        mel('tpt', `E5:3 D5:1 r:2 | E5:3 D5:1 r:2 | F5:2 E5:1 D5:2 F5:1 | E5:5 r:1 | E5:3 D5:1 r:2 | E5:3 D5:1 r:2 | F5:2 E5:1 D5:2 F5:1 | ${rep('r:6 |', 9)}`, { vel: 0.55 }),
        pad('str', { lo: 'A3', hi: 'F4', n: 3, vel: 0.5, to: 15 }),
      ],
    },
  },
  form: ['intro', 'verse', 'refrain', 'middle', 'refrain2'],
  loopFrom: 1,
};
