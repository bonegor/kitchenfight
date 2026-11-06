/**
 * TRATTORIA (stage 2, "La Trattoria": a candle-lit dining room at night) — the Brindisi
 * "Libiamo ne' lieti calici" from Verdi's La Traviata (1853, public domain), played as a festive,
 * slightly tipsy toast at the table.
 *
 * B♭ major (Verdi's key), 3/8, ♩. = 69: a one-in-a-bar fast waltz. 1 step = a triplet sixteenth,
 * so a bar is 9 steps, an eighth 3; the verse turns sit on that grid exactly as the reference
 * performance plays them, the chorus turns are straight sixteenths (1.5 steps).
 *
 * Alfredo (the accordion) sings the verse. Violetta (violin + mandolin, the Neapolitan pair)
 * answers with the chorus "Ah! godiamo", which Verdi sets to the same tune in E♭ (IV); the whole
 * table sings "Ah! libiam"; after a tipsy break the two sing the verse as a duet, and the grand
 * chorus leads back to the top. Upright bass "oom", guitar / pizzicato / accordion left-hand
 * "pa-pa", clarinet answers in the chalumeau, horns, triangle (and glockenspiel) glass clinks,
 * tambourine, timpani and suspended cymbal in the grand chorus.
 *
 * Form (bars): intro(4) V1(20, accordion) G(21, "Ah! godiamo" in E♭, violin + mandolin)
 *              C1(18, chorus tutti) brk(4, a tipsy clarinet) duet(20) C2(18, grand chorus) → V1.
 * Melodies are proven against the references with scripts/music/compare.py: docs/music/trattoria.md.
 */
import { arp, comp, drums, hits, mel, type Part, type SongDef } from '../sequencer';

// ---------------------------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------------------------

/**
 * Verse "Libiamo, libiamo ne' lieti calici… e la fuggevol ora s'inebrii a voluttà": LOTRO
 * lotro_brindisi.abc X:24 bars 3–17, a fourth up (F → B♭). That performance's rubato cadenza
 * (its bars 18–21 = bars 16–19 here) is written in strict time with the turn figure the same
 * performer plays in strict time in the chorus (LOTRO bars 70–71): turn on the third, turn on the
 * second, tonic. 19 bars; the pickup ("Li-") is the last eighth of the bar before.
 */
const VERSE = `
  D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  F5:9 | _:3 Eb5:3 D5:3 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  C5:6 Bb4:3 | F4:3 r:3 F4:3 |
  D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  G5:9 | _:3 F5:3 Eb5:3 | D5:2 r:1 Eb5:1 D5:1 C#5:1 D5:2 Eb5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  Bb4:3 r:6 |`;

/** Violetta's verse (top voice of the duet): the same tune with slides into the long notes. */
const VERSE_VLN = `
  {C5}D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  {E5}F5:9 | _:3 Eb5:3 D5:3 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  C5:6 Bb4:3 | F4:3 r:3 F4:3 |
  {C5}D5:9 | _:3 F4:2 r:1 D5:2 r:1 | D5:2 r:1 F4:2 r:1 D5:2 r:1 | D5:2 Eb5:1 D5:1 C5:2 Eb5:3 |
  {F#5}G5:9 | _:3 F5:3 Eb5:3 | D5:2 r:1 Eb5:1 D5:1 C#5:1 D5:2 Eb5:1 | C5:2 r:1 D5:1 C5:1 B4:1 C5:2 D5:1 |
  Bb4:3 r:6 |`;

/** Alfredo's second voice for the duet: thirds below the tune, sixths where thirds would clash. */
const VERSE_DUET = `
  Bb4:9 | _:3 D4:2 r:1 Bb4:2 r:1 | Bb4:2 r:1 D4:2 r:1 Bb4:2 r:1 | Bb4:2 C5:1 Bb4:1 A4:2 C5:3 |
  D5:9 | _:3 C5:3 Bb4:3 | A4:2 r:1 Bb4:1 A4:1 G#4:1 A4:2 Bb4:1 | A4:2 r:1 Bb4:1 A4:1 G#4:1 A4:2 Bb4:1 |
  F4:6 D4:3 | D4:3 r:3 D4:3 |
  Bb4:9 | _:3 D4:2 r:1 Bb4:2 r:1 | Bb4:2 r:1 D4:2 r:1 Bb4:2 r:1 | Bb4:2 C5:1 Bb4:1 A4:2 C5:3 |
  Bb4:9 | _:6 G4:3 | Bb4:2 r:1 C5:1 Bb4:1 A4:1 Bb4:2 C5:1 | A4:2 r:1 Bb4:1 A4:1 G#4:1 A4:2 Bb4:1 |
  D4:3 r:6 |`;

/**
 * Chorus "Ah! godiamo, la tazza e il cantico… ne scopra il nuovo dì": bb_libiamo.abc soprano,
 * bars 10–30 (the verse tune in E♭), an octave up (B♭4–C6, the register of the LOTRO
 * performance, bars 121–141). "Ah!" on the dominant B♭, the pickup "go-" in the bar after it.
 * Staccato eighths (dots in the reference) are 2 + 1 steps, as in the verse.
 */
const GODIAMO = `
  r:3 Bb5:6 | _:6 Bb4:3 | G5:9 | _:3 Bb4:2 r:1 G5:2 r:1 | G5:2 r:1 Bb4:2 r:1 G5:2 r:1 | G5:3 F#5:3 G5:3 |
  Bb5:9 | _:3 Ab5:3 G5:3 | F5:2 r:1 F5:1.5 E5:1.5 F5:1.5 G5:1.5 | F5:2 r:1 F5:1.5 E5:1.5 F5:1.5 G5:1.5 |
  F5:6 Eb5:3 | Bb4:3 r:3 Bb4:3 | G5:9 | _:3 Bb4:2 r:1 G5:2 r:1 | G5:2 r:1 Bb4:2 r:1 G5:2 r:1 | G5:3 F#5:3 G5:3 |
  C6!:9 | _:3 Bb5:3 Ab5:3 | G5:2 r:1 G5:1.5 F#5:1.5 G5:1.5 Ab5:1.5 | F5:2 r:1 F5:1.5 E5:1.5 F5:1.5 G5:1.5 |
  Eb5:6 r:3 |`;
/** the violin's copy: slides into "Ah!" and the long notes */
const GODIAMO_VLN = GODIAMO.replace('r:3 Bb5:6', 'r:3 {A5}Bb5:6')
  .replace(/\| G5:9 \|/g, '| {F#5}G5:9 |')
  .replace('Bb5:9 |', '{A5}Bb5:9 |')
  .replace('C6!:9', '{B5}C6!:9');

/** Chorus "Ah! libiam, amor fra' calici più caldi baci avrà": bb_libiamo.abc soprano, bars 1–9. */
const CHORUS = `
  r:3 D5:6 | _:3 F5:3 Eb5:3 | D5:3 D5:1.5 C#5:1.5 D5:1.5 Eb5:1.5 | C5:3 C5:1.5 B4:1.5 C5:1.5 D5:1.5 |
  Bb4:3 D5:6 | _:3 F5:3 Eb5:3 | D5:3 D5:1.5 C#5:1.5 D5:1.5 Eb5:1.5 | C5:3 C5:1.5 B4:1.5 C5:1.5 D5:1.5 |
  Bb4:6 r:3 |`;
/** the same chorus ending on the pickup into the verse (the loop seam) */
const CHORUS_TO_VERSE = CHORUS.replace(/Bb4:6 r:3 \|\s*$/, 'Bb4:6 F4:3 |');
/** alto line of the same arrangement (bars 1–9): sixths under the tune */
const CHORUS_ALTO = `
  r:3 Bb4:6 | _:3 Ab4:3 G4:3 | F4:3 F4:1.5 E4:1.5 F4:1.5 G4:1.5 | Eb4:3 Eb4:1.5 D4:1.5 Eb4:1.5 F4:1.5 |
  D4:3 Bb4:6 | _:3 Ab4:3 G4:3 | F4:3 F4:1.5 E4:1.5 F4:1.5 G4:1.5 | Eb4:3 Eb4:1.5 D4:1.5 Eb4:1.5 F4:1.5 |
  D4:6 r:3 |`;
/**
 * The horns: the tune an octave down on "Ah! libiam", then under the turns a sustained chord tone
 * that no neighbour note rubs against (B♭3 under the cadential 6/4, the leading tone A3 under V7,
 * resolving to B♭3), with a breath before each "Ah!".
 */
const CHORUS_HORN = `
  r:3 D4:6 | _:3 F4:3 Eb4:3 | Bb3:9 | A3:8 r:1 | Bb3:3 D4:6 | _:3 F4:3 Eb4:3 | Bb3:9 | A3:8 r:1 | Bb3:6 r:3 |`;

// ---------------------------------------------------------------------------------------------
// Harmony and accompaniment
// ---------------------------------------------------------------------------------------------

/**
 * Verse: the reference accompaniment's tonic (bars 1–6, 9–14), V7 under the turns, IV under the
 * high G, cadential 6/4. Two passing chords take the edge off the tune's upbeat E♭ (it would rub
 * against the D of a tonic "pa"): V7 on the last eighth of bars 4 and 14, a neighbour IV6/4 in bar 6.
 */
const VERSE_CH =
  'Bb:9 | Bb:9 | Bb:9 | Bb:6 F7:3 | Bb:9 | Bb:3 Eb/Bb:3 Bb:3 | F7:9 | F7:9 | Bb:9 | Bb:9 | ' +
  'Bb:9 | Bb:9 | Bb:9 | Bb:6 F7:3 | Eb:9 | Eb:9 | Bb/F:9 | F7:9 | Bb:9 | F7:9';
/** upright bass "oom" (one per bar) with inversions and leading-tone approaches */
const VERSE_BASS = `
  Bb2:6 r:3 | F2:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | D3:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | C3:3 r:3 A2:3 |
  Bb2:6 r:3 | F2:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | Bb2:6 r:3 | F2:6 r:3 | Eb2:6 r:3 | G2:6 r:3 |
  F2:6 r:3 | F2:3 r:3 A2:3 | Bb2:6 r:3 | F2:6 r:3 |`;

/**
 * "Ah! godiamo" in E♭: the verse's harmony a fourth up. "Ah!" on V7 (B♭7, reached from the
 * verse's closing F7 = V7/V), V7 under the turns, IV (A♭, via a passing E♭7) under the high C,
 * cadential 6/4, and a V7 of B♭ on the last eighth that turns back home for "Ah! libiam".
 */
const G_CH =
  'Bb7:9 | Bb7:9 | Eb:9 | Eb:9 | Eb:9 | Eb:9 | Eb:9 | Eb:3 Ab/Eb:3 Eb:3 | Bb7:9 | Bb7:9 | Eb:9 | ' +
  'Eb:9 | Eb:9 | Eb:9 | Eb:9 | Eb:6 Eb7/Db:3 | Ab/C:9 | Ab:9 | Eb/Bb:9 | Bb7:9 | Eb:6 F7:3';
/** E♭ root and the low B♭ fifth (the bass's A string), leading tones into the cadences */
const G_BASS = `
  Bb2:6 r:3 | F2:3 r:3 D2:3 | Eb2:6 r:3 | Bb1:6 r:3 | Eb2:6 r:3 | Bb1:6 r:3 | G2:6 r:3 | Eb2:6 r:3 |
  Bb1:6 r:3 | F2:3 r:3 D2:3 | Eb2:6 r:3 | Bb1:6 r:3 | Eb2:6 r:3 | Bb1:6 r:3 | Eb2:6 r:3 | Bb1:3 r:3 Db2:3 |
  C2:6 r:3 | Ab1:6 r:3 | Bb1:6 r:3 | Bb1:3 r:3 D2:3 | Eb2:3 r:3 F2:3 |`;

/**
 * Chorus, twice: I | I – V7/IV (bass A♭) – IV6 | I6/4 | V7 | I … The bass of the cadence is the
 * one the reference performance plays (LOTRO theorbo, bars 68–72: B♭ | A♭ D E♭ | F | F | B♭):
 * root-position V7 → I. (bb_libiamo's "bass" voice is only its alto an octave down.)
 */
const CHORUS_CH9 = 'Bb:9 | Bb:3 Bb7/Ab:3 Eb/G:3 | Bb/F:9 | F7:9 | Bb:9 | Bb:3 Bb7/Ab:3 Eb/G:3 | Bb/F:9 | F7:9 | Bb:6 F7:3';
const CHORUS_CH = CHORUS_CH9 + ' | ' + CHORUS_CH9;
/** chorus bass: the descent B♭–A♭–G into F (6/4 and V7), then the root B♭ on "vrà" */
const CHORUS_BASS9 = `
  Bb2:6 r:3 | Bb2:3 Ab2:3 G2:3 | F2:6 r:3 | F2:6 r:3 | Bb2:6 r:3 | Bb2:3 Ab2:3 G2:3 | F2:6 r:3 | F2:6 r:3 | Bb2:3 r:3 F2:3 |`;
const CHORUS_BASS = CHORUS_BASS9 + CHORUS_BASS9;

/** "pa-pa" on the second and third eighths (the second "pa" a little lighter: OOM-pa-pa) */
const PAPA = 'r:3 c:3 c:3';
const WALTZ = { 6: 0.86 };
/** the guitar's "pa-pa" broken into sixteenths in "Ah! godiamo": low – middle – top – middle */
const ROLL = 'r:3 0:1.5 1:1.5 2:1.5 1:1.5';

const TAMB = {
  X: { v: 0.95, vr: [4, 5] },
  x: { v: 0.62, vr: [0, 1] },
  s: { v: 0.5, vr: [2, 3] },
  R: { v: 0.7, vr: [6, 7] },
};
/** tambourine on the triplet grid (one char per step) and on sixteenths (stepDiv 2/3) */
const TAMB_LIGHT = 'x..s..s..';
const TAMB_MID = 'X..s..x..';
const TAMB_16 = 'X s x s x s';

/** glass clinks: [bar (0-based), eighth (0..2), velocity, double?] → triangle hits */
const clinks = (ch: string, list: Array<[number, number, number, boolean?]>): Part =>
  hits(
    ch,
    list.flatMap(([bar, e, v, dbl]): Array<[number, number, number]> => {
      const s = bar * 9 + e * 3;
      return dbl ? [[s, 60, v], [s + 1, 60, v * 0.8]] : [[s, 60, v]];
    }),
  );

/** clarinet in "Ah! godiamo": the 3rd of the "Ah!" chord, answers under the long notes, a run home */
const CLAR_G = `
  r:3 D4:6 | _:6 r:3 | r:3 Eb4:3 G4:3 | Bb4:3 r:6 | r:9 | r:9 |
  r:3 G4:3 Bb4:3 | Eb5:3 r:6 | r:9 | r:9 | r:9 |
  r:9 | r:3 Bb4:3 G4:3 | Eb4:3 r:6 | r:9 | r:9 |
  r:3 Ab4:3 C5:3 | Eb5:3 r:6 | r:9 | r:9 | r:3 G4:1.5 A4:1.5 Bb4:1.5 C5:1.5 |`;
/** a soft horn pad in "Ah! godiamo": chord tones clear of the tune's neighbour notes */
const HORN_G = `
  r:3 Ab3:6 | _:6 r:3 | G3:9 | _:6 r:3 | r:9 | r:9 |
  Eb4:9 | _:6 r:3 | D4:9 | _:8 r:1 | Eb4:6 r:3 |
  r:9 | Bb3:9 | _:6 r:3 | r:9 | r:9 |
  C4:9 | _:6 r:3 | Bb3:9 | D4:8 r:1 | Eb4:6 r:3 |`;
/** duet: sixteenth arpeggios under the long notes, then the run into the grand chorus */
const CLAR_DUET = `
  r:9 | r:9 | r:9 | r:9 |
  r:3 F3:1.5 Bb3:1.5 D4:1.5 F4:1.5 | Bb4:3 r:6 | r:9 | r:9 | r:9 | r:9 |
  r:9 | r:9 | r:9 | r:9 |
  r:3 G3:1.5 Bb3:1.5 Eb4:1.5 G4:1.5 | Bb4:3 r:6 | r:9 | r:9 |
  r:3 D4:1.5 F4:1.5 Bb4:1.5 D5:1.5 | C5:1.5 A4:1.5 F4:1.5 Eb4:1.5 C4:1.5 A3:1.5 |`;

/**
 * The solo-violin sample speaks slowly (a bow attack of 100 ms and more before half level), so a
 * turn's triplet sixteenths (97 ms) or sixteenths (145 ms) would only smear into the note before,
 * and even its eighths start late. The violin therefore bows the notes of two steps or more (with
 * their slides, the only place the grace notes are played): the long notes at full voice (gate
 * 0.9: the bow lifts just before the next note), the eighths as a soft détaché shadow (velocity ×
 * `eighth`, gate 0.75, so their tail has died before the turn that follows) under the instrument
 * that articulates them.
 */
const bowed =
  (p: Part, eighth = 0.6): Part =>
  (ctx) =>
    p(ctx)
      .filter((e) => e.grace || e.d >= 2)
      .map((e) => (e.grace ? e : e.d < 4 ? { ...e, gate: 0.75, v: e.v * eighth } : { ...e, gate: 0.9 }));
/**
 * Violetta's line on the Neapolitan pair. The violin sings the long notes (see bowed); the
 * mandolin plucks every note: tremolo (velocity `trem`) under the violin's long notes, and the
 * eighths and the turns' quick notes (which only it plays) at lead level (velocity `lead`). One
 * instrument clearly leads each note: two at the same pitch and level would beat and cancel.
 */
const duo = (tune: string, o: { vln: number; trem: number; lead: number; vlnTune?: string; oct?: number }): Part[] => {
  const oct = o.oct ?? 0;
  const m = mel('mand', tune, { vel: o.trem, oct, tremMin: 6, plain: true });
  return [
    bowed(mel('vln', o.vlnTune ?? tune, { vel: o.vln, oct })),
    (ctx) => m(ctx).map((e) => (e.d < 6 ? { ...e, v: o.lead } : e)),
  ];
};

/** pickup "Li-" on the last eighth of a section's final bar */
const pickup = (ch: string, bars: number, note = 'F4', vel = 0.8): Part => mel(ch, `r:6 ${note}:3 |`, { at: (bars - 1) * 9, vel });

// ---------------------------------------------------------------------------------------------
// Song
// ---------------------------------------------------------------------------------------------

export const trattoria: SongDef = {
  id: 'trattoria',
  bpm: 69,
  stepsPerBeat: 9,
  barSteps: 9,
  scale: 'Bb major',
  gainDb: -0.1,
  humanize: 0.005,
  reverb: { rt60: 1.4, size: 0.95, damp: 0.5, predelay: 0.016, er: 0.34, hp: 260, lp: 7600, wet: 1.4 },
  channels: {
    acc: { inst: 'accordion', gain: -4.2, pan: -0.12, send: 0.18 },
    vln: { inst: 'violin', gain: -2.9, pan: 0.18, send: 0.24 },
    accH: { inst: 'accordion', gain: -9.4, pan: -0.24, send: 0.2 },
    clar: { inst: 'clarinet', gain: -7.7, pan: -0.32, send: 0.22 },
    accC: { inst: 'accChord', gain: -13.3, pan: -0.2, send: 0.12, hum: 0.5 },
    gtr: { inst: 'guitar', gain: -9, pan: 0.36, send: 0.14, hum: 0.6 },
    pizz: { inst: 'pizz', gain: -11.6, pan: -0.38, send: 0.16, hum: 0.6 },
    bass: { inst: 'uprightBass', gain: -3, pan: 0, send: 0.06, hum: 0.5 },
    horn: { inst: 'horn', gain: -10, pan: -0.05, send: 0.3, hum: 0.3 },
    flute: { inst: 'flute', gain: -15.6, pan: 0.25, send: 0.26 },
    mand: { inst: 'mandolin', gain: -5, pan: 0.08, send: 0.2 },
    tri: { inst: 'triangleInst', gain: -10.1, pan: 0.42, send: 0.25, hum: 0.4 },
    glock: { inst: 'glock', gain: -11.6, pan: 0.45, send: 0.3, hum: 0.3 },
    tamb: { inst: 'tamb', gain: -3.1, pan: 0.3, send: 0.1, hum: 0.6 },
    timp: { inst: 'timpani', gain: -8.9, pan: 0.05, send: 0.2, hum: 0 },
    cym: { inst: 'cymbal', gain: -2.2, pan: 0.2, send: 0.25, hum: 0 },
  },
  sections: {
    intro: {
      bars: 4,
      chords: 'Bb:9 | Bb:9 | F7:9 | F7:9',
      parts: [
        mel('bass', 'Bb2:6 r:3 | D3:6 r:3 | F2:6 r:3 | C3:3 r:3 A2:3 |', { vel: 0.85 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'D3', hi: 'F4', n: 3, vel: 0.7, strum: 0.012, gate: 0.55 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'Eb4', n: 2, vel: 0.6, from: 2 }),
        comp('accC', PAPA, { accent: WALTZ, lo: 'F3', hi: 'F4', n: 3, vel: 0.6, gate: 0.6 }),
        clinks('tri', [[0, 1, 0.8], [0, 2, 0.7]]),
        mel('clar', 'r:9 | r:3 D4:1.5 F4:1.5 Bb4:1.5 D5:1.5 | F5:3 Eb5:1.5 D5:1.5 C5:3 | A4:3 r:6 |', { vel: 0.9 }),
        drums('tamb', TAMB_LIGHT, TAMB, { vel: 0.9, from: 2 }),
        pickup('acc', 4, 'F4', 0.78),
      ],
    },
    // Alfredo: the accordion's right hand sings, a guitar strums the pa-pa
    V1: {
      bars: 20,
      chords: VERSE_CH,
      parts: [
        mel('acc', VERSE + 'r:9 |', { vel: 0.84 }),
        mel('bass', VERSE_BASS, { vel: 0.8 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'D3', hi: 'F4', n: 3, vel: 0.6, strum: 0.012, gate: 0.55 }),
        drums('tamb', TAMB_LIGHT, TAMB, { vel: 1 }),
        clinks('tri', [[0, 1, 0.75], [4, 1, 0.7], [10, 1, 0.75], [14, 1, 0.8, true]]),
        // V7 of the new key's dominant: the clarinet climbs the F7 into Violetta's "Ah!"
        mel('clar', 'r:3 F3:1.5 A3:1.5 C4:1.5 Eb4:1.5 |', { at: 19 * 9, vel: 0.72 }),
      ],
    },
    // Violetta: "Ah! godiamo" in E♭ on violin + mandolin, guitar sixteenths, horn pad, clarinet answers
    G: {
      bars: 21,
      chords: G_CH,
      parts: [
        ...duo(GODIAMO, { vln: 0.82, trem: 0.45, lead: 0.9, vlnTune: GODIAMO_VLN }),
        mel('clar', CLAR_G, { vel: 0.64 }),
        mel('horn', HORN_G, { vel: 0.45 }),
        mel('bass', G_BASS, { vel: 0.8 }),
        arp('gtr', ROLL, { accent: { 6: 0.9 }, lo: 'F3', hi: 'Eb4', n: 3, vel: 0.55 }),
        drums('tamb', TAMB_MID, TAMB, { vel: 0.75, from: 2 }),
        clinks('tri', [[0, 1, 0.8, true], [6, 1, 0.7], [12, 1, 0.75], [16, 1, 0.8, true]]),
      ],
    },
    // "Ah! libiam": the whole table joins in
    C1: {
      bars: 18,
      chords: CHORUS_CH,
      parts: [
        mel('acc', CHORUS + CHORUS, { vel: 0.86 }),
        bowed(mel('vln', CHORUS + CHORUS, { vel: 0.72 })),
        mel('clar', CHORUS_ALTO + CHORUS_ALTO, { vel: 0.66 }),
        mel('horn', CHORUS_HORN + CHORUS_HORN, { vel: 0.55 }),
        mel('bass', CHORUS_BASS, { vel: 0.85 }),
        comp('accC', PAPA, { accent: WALTZ, lo: 'F3', hi: 'F4', n: 3, vel: 0.62, gate: 0.6 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'C3', hi: 'C4', n: 3, vel: 0.62, strum: 0.012, gate: 0.55 }),
        drums('tamb', TAMB_16, TAMB, { stepDiv: 2 / 3 }),
        clinks('tri', [[0, 1, 0.85, true], [9, 1, 0.85, true], [8, 2, 0.7], [17, 2, 0.7]]),
        hits('glock', [[3, 'Bb6', 0.5], [4, 'D7', 0.4], [84, 'Bb6', 0.5], [85, 'D7', 0.4]]),
      ],
    },
    // the band stops for a toast; the clarinet hums the turn, it sags a semitone, hic!
    brk: {
      bars: 4,
      chords: 'Bb:9 | Bb:9 | Bb:9 | F7:9',
      parts: [
        hits('bass', [[0, 'Bb2', 0.9, 3], [9, 'Bb2', 0.55, 3], [18, 'Bb2', 0.5, 3], [27, 'F2', 0.8, 6]]),
        comp('accC', 'C:3 r:6', { lo: 'F3', hi: 'F4', n: 3, vel: 0.7, gate: 0.5, to: 1 }),
        comp('pizz', 'c:3 r:6', { lo: 'F3', hi: 'D4', n: 3, vel: 0.75, to: 1 }),
        comp('gtr', 'c:3 r:6', { lo: 'D3', hi: 'F4', n: 3, vel: 0.7, strum: 0.01, to: 1 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'Eb4', n: 2, vel: 0.6, from: 3 }),
        drums('tamb', 'X........|s..s..s..|s..s..s..|x..s..s..', TAMB),
        clinks('tri', [[0, 1, 0.85], [0, 2, 0.8, true]]),
        mel('clar', 'r:9 | D5:2 r:1 Eb5:1 D5:1 C#5:1 D5:2 Eb5:1 | C#5:2 r:1 D5:1 C#5:1 C5:1 C#5:2 D5:1 | {C5}A5:3 r:6 |', { vel: 0.85 }),
        // the duet's pickup, voiced like the duo's eighths (mandolin leads, violin shadows)
        pickup('vln', 4, 'F4', 0.5),
        pickup('mand', 4, 'F4', 0.9),
      ],
    },
    // the duet: Violetta on top (violin + mandolin), Alfredo a third below (accordion)
    duet: {
      bars: 20,
      chords: VERSE_CH,
      parts: [
        ...duo(VERSE + 'r:9 |', { vln: 0.85, trem: 0.45, lead: 0.9, vlnTune: VERSE_VLN + 'r:9 |' }),
        mel('accH', VERSE_DUET + 'r:9 |', { vel: 0.7 }),
        mel('clar', CLAR_DUET, { vel: 0.64 }),
        mel('bass', VERSE_BASS, { vel: 0.82 }),
        comp('pizz', PAPA, { accent: WALTZ, lo: 'F3', hi: 'Eb4', n: 2, vel: 0.64 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'D3', hi: 'F4', n: 3, vel: 0.55, strum: 0.012, gate: 0.55 }),
        drums('tamb', TAMB_MID, TAMB, { vel: 0.85 }),
        clinks('tri', [[0, 1, 0.8], [4, 1, 0.75], [10, 1, 0.8], [14, 1, 0.85, true]]),
        // suspended-cymbal roll over the last two bars into the grand chorus (the recorded roll
        // only opens up after about a second)
        hits('cym', [[162, 60, 0.62, 18]], 1),
      ],
    },
    // grand chorus: violin, flute and mandolin an octave up, timpani, cymbal on "Ah!"
    C2: {
      bars: 18,
      chords: CHORUS_CH,
      parts: [
        mel('acc', CHORUS + CHORUS_TO_VERSE, { vel: 0.84 }),
        ...duo(CHORUS + CHORUS, { vln: 0.72, trem: 0.42, lead: 0.72, oct: 1 }),
        mel('flute', CHORUS + CHORUS, { vel: 0.5, oct: 1 }),
        mel('clar', CHORUS_ALTO + CHORUS_ALTO, { vel: 0.7 }),
        mel('horn', CHORUS_HORN + CHORUS_HORN, { vel: 0.6 }),
        mel('bass', CHORUS_BASS, { vel: 0.82 }),
        comp('accC', PAPA, { accent: WALTZ, lo: 'F3', hi: 'F4', n: 3, vel: 0.66, gate: 0.6 }),
        comp('gtr', PAPA, { accent: WALTZ, lo: 'C3', hi: 'C4', n: 3, vel: 0.62, strum: 0.012, gate: 0.55 }),
        // pizzicato voiced below the clarinet's alto line (its lowest neighbour note is D4)
        comp('pizz', PAPA, { accent: WALTZ, lo: 'D3', hi: 'C4', n: 2, vel: 0.6 }),
        drums('tamb', TAMB_16, TAMB, { stepDiv: 2 / 3, vel: 0.95 }),
        hits('timp', [[0, 'Bb2', 0.8], [18, 'F2', 0.7], [36, 'Bb2', 0.75], [54, 'F2', 0.7], [81, 'Bb2', 0.8], [99, 'F2', 0.7], [117, 'Bb2', 0.75], [135, 'F2', 0.7], [153, 'Bb2', 0.85]]),
        // the bright (loud-layer) hit on "Ah!"
        hits('cym', [[3, 60, 0.8]], 0),
        clinks('tri', [[0, 1, 0.9, true], [9, 1, 0.9, true], [8, 2, 0.75], [16, 1, 0.8]]),
        hits('glock', [[3, 'Bb6', 0.55], [4, 'D7', 0.45], [84, 'Bb6', 0.55], [85, 'D7', 0.45]]),
      ],
    },
  },
  form: ['intro', 'V1', 'G', 'C1', 'brk', 'duet', 'C2'],
  loopFrom: 1,
};
