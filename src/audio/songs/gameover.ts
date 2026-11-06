/**
 * GAME OVER — "Ridi, Pagliaccio": Leoncavallo's sob from *Pagliacci* (1892, public domain), played
 * by a lone street accordion over soft strings and pizzicato, then deflated by a sad trombone
 * ("wah – wah – wah – waaah" + flexatone wobble) and a final timpani + slapstick "BONK".
 * One-shot, 13.5 s. E minor (the original key), 2/4, ♩ = 76 with rubato on top of the written
 * rhythm. The melody (section `ridi`) is bars 26–29 of bb_pagliacci1.abc, verified with
 * scripts/music/compare.py (100 % pitch / 100 % rhythm). See docs/music/gameover.md.
 */
import { hits, mel, type Ev, type Part, type SongDef } from '../sequencer';

// ---------------------------------------------------------------------------------------------
// Expressive timing helpers (the written rhythm on the grid stays Leoncavallo's)
// ---------------------------------------------------------------------------------------------

/**
 * Rubato: delay every event of a part by W(step) seconds (piecewise linear through `pts`,
 * [step, seconds]) and move its end the same way (via the gate), as a conductor following the
 * singer. Only the performance timing moves: the written positions and durations on the grid
 * (what export-song lists and compare.py checks) stay Leoncavallo's. `gate` = the part's legato
 * gate before the warp (1 = to the next note).
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

/** Fermata: lengthen the note(s) starting at `step` by `extra` steps (may ring into the next section). */
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

/** Rubato through the climax: the sob delays "sul", the singer leans into "in-FRAN-to", then the fermata. */
const RUB: Array<[number, number]> = [
  [0, 0],
  [48, 0],
  [52, 0.04],
  [60, 0.05],
  [70, 0.11],
  [72, 0.17],
  [84, 0.26],
  [96, 0],
];

export const gameover: SongDef = {
  id: 'gameover',
  bpm: 76,
  stepsPerBeat: 12,
  barSteps: 24,
  scale: 'E harmonic minor',
  gainDb: -3.6,
  humanize: 0.004,
  tail: 0.9,
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
    // "Ah!" (bar 25): the cry on F#5 (scooped, after the game's 0.3 s fade-in) over the
    // orchestra's falling B7 arpeggio
    ah: {
      bars: 1,
      chords: 'B7:24',
      parts: [
        mel('acc', 'r:6 {D#5,E5}F#5:18@0.84 |'),
        mel('str', 'B3+D#4+A4:24 |', { vel: 0.42 }),
        mel('vc', 'A3:6@0.8 F#3:6@0.72 D#3:6@0.72 B2:6@0.76 |', { gate: 0.8 }),
        mel('cb', 'A2:6@0.8 F#2:6@0.72 D#2:6@0.72 B1:6@0.76 |', { gate: 0.8 }),
      ],
    },
    // "Ridi, Pagliaccio, sul tuo amore infranto!" (bars 26–29)
    ridi: {
      bars: 4,
      chords: 'Am7:12 Am6:12 | Am7:12 Am6:12 | Am6/C:24 | Em/B:24',
      parts: [
        fermata(rubato(mel('acc', RIDI), RUB, 0.93), 84, 6),
        rubato(fermata(mel('str', 'E4+A4+C5:24@0.38 | _:24 | F#4+A4+C5:24@0.44 | E4+B4:24@0.5 |'), 72, 6), RUB),
        rubato(fermata(mel('vc', 'A2:24@0.42 | _:24 | C3:24@0.46 | B2:24@0.5 |'), 72, 6), RUB),
        rubato(mel('db', 'A1:12@0.72 r:12 | A1:12@0.66 r:12 | C2:12@0.72 r:12 | B1:12@0.8 r:12 |'), RUB),
        rubato(mel('pz', 'r:12 A3+C4+E4:12@0.5 | r:12 A3+C4+E4:12@0.46 | r:12 A3+C4+F#4:12@0.52 | r:12 B3+E4+G4:12@0.56 |'), RUB),
      ],
    },
    // the deflation: wah – wah – wah – waaah (+ flexatone wobble) … BONK (timpani + slapstick)
    wah: {
      bars: 3,
      chords: 'Em:24 | Em:24 | Em:24',
      parts: [
        // triplet-quarter "wahs" (8 steps), the long "waaah" on E3
        mel('tbn', 'r:12 G3:8@0.9 F#3:4@0.88 | _:4 F3:8@0.88 E3:12@0.84 | _:12 r:12 |', { gate: 0.9 }),
        hits('flex', [[36, 60, 0.8, 24]], 2),
        hits('timp', [[60, 'E2', 1.05, 12]]),
        hits('slap', [[60, 60, 1.0, 6]], 0),
        hits('db', [[60, 'E1', 0.95, 12]]),
        hits('pz', [[60, 'E2', 0.85, 12], [60, 'B2', 0.8, 12], [60, 'E3', 0.75, 12]]),
      ],
    },
  },
  form: ['ah', 'ridi', 'wah'],
  loopFrom: null,
};
