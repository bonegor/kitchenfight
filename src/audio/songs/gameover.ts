/**
 * GAME OVER — "Ridi, Pagliaccio": Leoncavallo's sob from *Pagliacci* (1892, public domain), played
 * by a lone street accordion over soft strings and pizzicato, then deflated by a sad trombone
 * ("wah – wah – wah – waaah" + flexatone wobble) and a final timpani + slapstick "BONK".
 * One-shot, 13.8 s. E minor (the original key), 2/4, ♩ = 76 with rubato on top of the written
 * rhythm. The melody (section `ridi`) is bars 26–29 of bb_pagliacci1.abc, verified with
 * scripts/music/compare.py (100 % pitch / 100 % rhythm; bars 30–33, "Ridi del duol…", are left
 * out on purpose). See docs/music/gameover.md.
 */
import { hits, mel, type Ev, type Part, type SongDef } from '../sequencer';

// ---------------------------------------------------------------------------------------------
// Expressive timing helpers (the written rhythm on the grid stays Leoncavallo's)
// ---------------------------------------------------------------------------------------------

/**
 * Rubato: delay every event of a part by W(step) seconds (piecewise linear through `pts`,
 * [step, seconds], W ≥ 0, constant after the last point) and move its end the same way (via the
 * gate), as a conductor following the singer. A note sounds W(end) − W(start) longer than written:
 * W rising across a note is a tenuto, W falling across a note moves on. Only the performance timing
 * moves: the written positions and durations on the grid (what export-song lists and compare.py
 * checks) stay Leoncavallo's. `gate` = the part's legato gate before the warp (1 = to the next note).
 */
const rubato =
  (p: Part, pts: Array<[number, number]>, gate = 1): Part =>
  (ctx) => {
    const W = (s: number): number => {
      if (s <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) {
        const [s1, w1] = pts[i];
        if (s <= s1) {
          const [s0, w0] = pts[i - 1];
          return w0 + ((w1 - w0) * (s - s0)) / (s1 - s0);
        }
      }
      return pts[pts.length - 1][1];
    };
    return p(ctx).map((e): Ev => {
      const w0 = W(e.s);
      if (e.grace) return { ...e, offSec: (e.offSec ?? 0) + w0 };
      // compileSong: sounding end = grid start + written length × gate (the delay is taken off
      // the length), so the end's own delay goes into the gate
      return { ...e, offSec: (e.offSec ?? 0) + w0, gate: (e.gate ?? gate) + W(e.s + e.d) / (e.d * ctx.stepSec) };
    });
  };

/**
 * Fermata: lengthen the note(s) starting at `step` by `extra` steps (they ring into the next
 * section). Apply it INSIDE rubato(), so the warp reads the held note's real end.
 */
const fermata =
  (p: Part, step: number, extra: number): Part =>
  (ctx) =>
    p(ctx).map((e) => (!e.grace && Math.abs(e.s - step) < 1e-6 ? { ...e, d: e.d + extra } : e));

// ---------------------------------------------------------------------------------------------
// Score (12 steps per beat: 16th = 3, triplet eighth = 4, eighth = 6, quarter = 12, 2/4 bar = 24)
// ---------------------------------------------------------------------------------------------

/**
 * "Ridi, Pagliaccio, sul tuo amore infranto!" — bb_pagliacci1.abc bars 26–29, written octave
 * (the tenor sings it an octave lower). Graces = the sob: a falling sigh into the F#5 after the
 * catch-breath rest (bar 3) and a scoop up to the high A5 (bar 4).
 */
const RIDI = `
  G5:12@0.92 F#5:9@0.8 E5:3@0.74 | G5:12@0.86 F#5:12@0.78 |
  r:4 {A5}F#5:4@0.8 G5:4@0.84 A5:4@0.9 G5:6@0.86 F#5:2@0.8 | {G5}A5:12@1.02 G5:12@0.92 |`;

/**
 * Rubato of the `ridi` section, [step, delay in seconds]. "RI-di, Pa-GLIAC-cio": a 100 ms tenuto
 * on each accented downbeat G5, partly won back on "di, Pa-" and "-cio"; the sob holds the breath
 * before "sul"; the singer leans into "in-FRAN-to" (the F#5 and the high A5 longer). The delay
 * then stays (the fermata on "-to" is added in steps on top); the coda after the breath is on
 * the grid again.
 */
const RUB: Array<[number, number]> = [
  [0, 0], // "Ri-" G5 on the beat
  [12, 0.1], // … held 100 ms longer
  [21, 0.08], // "-di" moves on
  [24, 0.07], // "Pa-"
  [36, 0.17], // "-gliac-" G5 held 100 ms longer
  [48, 0.13], // "-cio" moves on into the rest
  [52, 0.17], // the catch-breath before "sul" (the sob)
  [64, 0.19], // "sul tuo a-"
  [70, 0.24], // "mo-" leans
  [72, 0.3], // "re in-" stretched
  [84, 0.39], // "FRAN-" A5 held 90 ms longer, then the fermata on "-to"
];
/** the fermata on "-to" (G5): extra steps (G5 = 21 steps × gate 0.93 ≈ 1.29 s) */
const HOLD = 9;
/** the strings and cello hold the last chord until the accordion lets go */
const HOLD_CHORD = 8;

export const gameover: SongDef = {
  id: 'gameover',
  bpm: 76,
  stepsPerBeat: 12,
  barSteps: 24,
  scale: 'E harmonic minor',
  gainDb: -3.8,
  humanize: 0.004,
  tail: 1.16,
  reverb: { rt60: 1.9, size: 1.25, damp: 0.5, predelay: 0.024, er: 0.32, hp: 220, lp: 7000, wet: 1.5 },
  channels: {
    acc: { inst: 'accordion', gain: 0, pan: 0.05, send: 0.26, hum: 0.5 },
    str: { inst: 'strings', gain: -6, pan: -0.15, send: 0.32, hum: 0 },
    vc: { inst: 'cello', gain: -3, pan: -0.25, send: 0.22, hum: 0.5 },
    cb: { inst: 'contrabass', gain: -4, pan: 0.15, send: 0.18, hum: 0.5 },
    pz: { inst: 'pizz', gain: -3, pan: 0.25, send: 0.25, hum: 0.6 },
    db: { inst: 'uprightBass', gain: -1, pan: 0, send: 0.12, hum: 0.4 },
    tbn: { inst: 'trombone', gain: 2, pan: 0.1, send: 0.22, hum: 0 },
    flex: { inst: 'flexatone', gain: -3, pan: 0.35, send: 0.25, hum: 0 },
    timp: { inst: 'timpani', gain: 0, pan: 0, send: 0.25, hum: 0 },
    slap: { inst: 'slapstick', gain: 0, pan: -0.15, send: 0.2, hum: 0 },
  },
  sections: {
    // "Ah!" (bar 25): the cry on F#5 (scooped) over the orchestra's accented, falling B7
    // arpeggio. The strings' chord swells in under the game's 0.3 s fade-in; the cry and the
    // four strokes come after it: Leoncavallo's four eighths are compressed into the bar's last
    // three eighths (dotted sixteenths, 0.30 s apart). Detached strokes (gate 0.6): the bowed
    // cellos + basses are the body; the upright bass plucks the lower octave with them and gives
    // each accent its attack (the recorded bowed notes swell for 150-250 ms). Its velocities even
    // out the sample zones (F#2 and D#2 are quieter), so the four plucks peak alike.
    ah: {
      bars: 1,
      chords: 'B7:24',
      parts: [
        mel('acc', 'r:6 {D#5,E5}F#5:18@0.84 |'),
        mel('str', 'B3+D#4+A4:24 |', { vel: 0.42 }),
        mel('vc', 'r:6 A3:4.5@0.8 F#3:4.5@0.68 D#3:4.5@0.7 B2:4.5@0.68 |', { gate: 0.6 }),
        mel('cb', 'r:6 A2:4.5@0.8 F#2:4.5@0.68 D#2:4.5@0.7 B1:4.5@0.68 |', { gate: 0.6 }),
        mel('db', 'r:6 A2:4.5@0.62 F#2:4.5@0.78 D#2:4.5@0.72 B1:4.5@0.7 |', { gate: 0.6 }),
      ],
    },
    // "Ridi, Pagliaccio, sul tuo amore infranto!" (bars 26–29), rubato + fermata
    ridi: {
      bars: 4,
      chords: 'Am7:12 Am6:12 | Am7:12 Am6:12 | Am6/C:24 | Em/B:24',
      parts: [
        rubato(fermata(mel('acc', RIDI), 84, HOLD), RUB, 0.93),
        rubato(fermata(mel('str', 'E4+A4+C5:24@0.38 | _:24 | F#4+A4+C5:24@0.44 | E4+B4:24@0.5 |'), 72, HOLD_CHORD), RUB),
        rubato(fermata(mel('vc', 'A2:24@0.42 | _:24 | C3:24@0.46 | B2:24@0.5 |'), 72, HOLD_CHORD), RUB),
        rubato(mel('db', 'A1:12@0.72 r:12 | A1:12@0.66 r:12 | C2:12@0.72 r:12 | B1:12@0.8 r:12 |'), RUB),
        rubato(mel('pz', 'r:12 A3+C4+E4:12@0.5 | r:12 A3+C4+E4:12@0.46 | r:12 A3+C4+F#4:12@0.52 | r:12 B3+E4+G4:12@0.56 |'), RUB),
      ],
    },
    // the deflation, after a breath: wah – wah – wah – waaah (+ flexatone wobble) … BONK
    // (timpani + slapstick + upright bass and pizzicato on E)
    wah: {
      bars: 3,
      chords: 'Em:24 | Em:24 | Em:24',
      parts: [
        // triplet-quarter "wahs" (8 steps) from step 18, the long "waaah" on E3 (22 steps)
        mel('tbn', 'r:18 G3:6@0.9 | _:2 F#3:8@0.88 F3:8@0.88 E3:6@0.84 | _:16 r:8 |', { gate: 0.9 }),
        hits('flex', [[42, 60, 0.8, 22]], 2),
        hits('timp', [[64, 'E2', 1.05, 12]]),
        hits('slap', [[64, 60, 1.0, 6]], 0),
        hits('db', [[64, 'E1', 0.95, 12]]),
        hits('pz', [[64, 'E2', 0.85, 12], [64, 'B2', 0.8, 12], [64, 'E3', 0.75, 12]]),
      ],
    },
  },
  form: ['ah', 'ridi', 'wah'],
  loopFrom: null,
};
