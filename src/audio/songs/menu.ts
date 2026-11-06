/**
 * MENU — "'O sole mio" (music Eduardo di Capua, words Giovanni Capurro, Naples 1898; copyright
 * status in docs/music/menu.md): a sunset serenade for the menus (character select, stage select,
 * shop, encyclopedia).
 * G major. One bar = one 4/4 bar of the reference, counted in 2 (𝅗𝅥 = 80, i.e. the reference's
 * ♩ = 160; 1 bar = 1.5 s); one step = a quarter note of the reference. The melody is verified
 * against jc_solemio_201318418.abc X:1 (docs/music/menu.md).
 *
 * Form (reference bars in brackets); the whole form loops (73.5 s):
 *   intro    1 bar           harp D7 arpeggio, bass: the opening, and on every later pass the
 *                            turnaround from the refrain's final G back into the verse
 *   verse   16 bars [1-16]   "Che bella cosa": mandolin tremolo, nylon guitar arpeggios, upright
 *                            bass; soft accordion chords from bar 9; harp glissando into the refrain
 *   chorus  16 bars [17-32]  "'O sole mio": mandolin, guitar, light strings pad, harp
 *   chorus2 16 bars [17-30, coda 35-36]  the refrain again, varied: violin lead, mandolin second
 *                            voice, harp arpeggios, accordion after-beats; ends on the coda's high
 *                            cadence while the bass walks down to the intro's D7
 */
import { arp, comp, hits, mel, pad, type Ev, type Part, type SongDef } from '../sequencer';
import { noteToMidi } from '../theory';

// ---------------------------------------------------------------------------------------------
// Melody (one step = a quarter note of the reference)
// ---------------------------------------------------------------------------------------------

/** verse, reference bars 1-16 (@ = phrasing: lean on the top D, relax into the cadence) */
const VERSE = `
  r:1 D5:1 C5 B4 | A4:2 G4 | G4:1 A4 B4 G4 | F#4:2 E4 |
  r:1 F#4 G4 A4 | F#4:1 E4 E4:2 | _:1 F#4 G4 A4 | E4:1 D4 D4:2 |
  r:1 D5 C5 B4 | A4:2 G4 | G4:1 A4 B4 G4 | {G4}F#4:2 E4 |
  r:1 C5 B4 A4 | D5:1@0.88 B4 A4 G4 | A4:3 B4:1@0.75 | A4:2@0.75 {B4,A4}G4:2@0.72 |`;

/** refrain, reference bars 17-32 (@ = phrasing: the held "Ma n'a-tu" and the C-minor bars a
 *  little warmer, the closing cadence softer). The repeated half notes are two syllables ("mi-o"
 *  in bars 22 and 28, "so-le" in bar 26): the tremolo lifts for a sixteenth and re-strikes, as a
 *  mandolinist plays a repeated note (`~` keeps the shortened first note in tremolo) */
const REFRAIN = `
  r:1 G5:1@0.95 G5 F#5 | F#5:1 D5 D5:2 | r:1 F#5 F#5 E5 | {E5}C5:4 |
  r:1 F#5 F#5 E5 | {E5}C5~:1.75 r:0.25 C5:2 | r:1 A4 B4 C5 | D5:4 |
  r:3 D5:1 | Eb5~:1.75@0.95 r:0.25 Eb5:2 | r:1 C5 G5:1.5@0.95 Eb5:0.5 | D5~:1.75 r:0.25 D5:2 |
  r:1 B4 A4 G4@0.84 | D5:4 | r:1 B4 {A4,B4}A4:1.5 F#4:0.5 | G4:4@0.82 |`;

/** the refrain on the violin: bar 18 as in X:2 and the 1999 edition (a grace into a held D), and
 *  the coda's high cadence (reference bars 35-36) in place of bars 31-32 */
const REFRAIN_VLN = `
  r:1 G5:1 G5 F#5 | {F#5}D5:2 D5 | r:1 F#5 F#5 E5 | {E5}C5:4 |
  r:1 F#5 F#5 E5 | {E5}C5:2 C5 | r:1 A4 B4 C5 | D5:4 |
  r:3 D5:1 | Eb5:2 Eb5 | r:1 C5 G5:1.5 Eb5:0.5 | D5:2 D5 |
  r:1 B4 A4 G4 | D5:4 | r:1 D5 B5:1.5 A5:0.5 | G5:4 |`;

/** mandolin second voice under the violin: sixths, then thirds; the 7ths resolve down */
const SECONDA = `
  r:1 B4:1 B4 A4 | B4:4 | r:1 A4:1 A4 G4 | A4:4 |
  r:1 A4:1 A4 G4 | A4:4 | r:1 F#4:1 G4 A4 | B4:4 |
  r:3 B4:1 | C5:4 | r:1 Eb4:1 Eb5:1.5 C5:0.5 | B4:4 |
  r:1 G4:1 F#4 E4 | F#4:4 | r:1 F#4:1 D5:1.5 C5:0.5 | B4:4 |`;

// ---------------------------------------------------------------------------------------------
// Harmony (the reference's chord symbols; G7 added on the way to C minor) and bass lines
// ---------------------------------------------------------------------------------------------

const V_CH = 'G:4 | G:4 | G:4 | Am:4 | Am:4 | D7:4 | D7:4 | G:4 | G:4 | G:4 | G:4 | Am:4 | Am:4 | G:4 | D7:4 | G:4';
const R_CH = 'G:4 | G:4 | G:4 | Am:4 | Am:4 | Am:4 | D7:4 | G:4 | G:2 G7:2 | Cm:4 | Cm:4 | G:4 | G:4 | D7:4 | D7:4 | G:4';

/** upright bass in two (root / fifth, inversions G/B, Cm/Eb, D7/F#; approach notes) */
const V_BASS = `
  G2:2 D2 | G2:2 D2 | G2:2 B2 | A2:2 E2 |
  A2:2 C3 | D3:2 A2 | F#2:2 A2 | G2:2 D2:1 F#2 |
  G2:2 D2 | G2:2 D2 | G2:2 B2 | A2:2 E2 |
  A2:2 E2 | B2:2 G2 | D2:2 F#2 | G2:2 D2 |`;
/** refrain: the C-minor bars resolve to a root-position G on "mi-o" (ref 28); the bass leaves
 *  E♭ by a leap while the tune steps E♭–D, so the outer voices move in no parallel octaves */
const R_BASS = `
  G2:2 D2 | G2:2 D2 | G2:2 B2 | A2:2 E2 |
  A2:2 E2 | A2:2 C3 | D3:2 A2 | G2:2 D2 |
  G2:2 B2 | C3:2 G2 | C3:2 Eb3 | G2:2 D3 |
  B2:2 G2 | D2:2 F#2 | A2:2 D2 | G2:2 D2 |`;
/** second refrain: approach notes into ref 25, and the last bar walks down G–F♯–E to the D of
 *  the intro, which turns the loop round into the verse */
const R_BASS2 = `
  G2:2 D2 | G2:2 D2 | G2:2 B2 | A2:2 E2 |
  A2:2 E2 | A2:2 C3 | D3:2 A2 | G2:2 D2:1 F#2 |
  G2:2 B2 | C3:2 G2 | C3:2 Eb3 | G2:2 D3 |
  B2:2 G2 | D2:2 F#2 | A2:2 D2 | G2:2 F#2:1 E2 |`;

const bassV = mel('bass', V_BASS, { vel: 0.72 });
const bassR = mel('bass', R_BASS, { vel: 0.75 });
const bassR2 = mel('bass', R_BASS2, { vel: 0.75 });

// ---------------------------------------------------------------------------------------------
// Helpers: plucked notes that ring like a held chord shape, harp glissando and rolled chords
// ---------------------------------------------------------------------------------------------

/** let each note ring until the next chord change (at most maxSteps), like a fingerpicked chord;
 *  with `bass`, a string is damped where the bass moves above it, so the bass stays the lowest
 *  sounding note */
const ringOn =
  (p: Part, maxSteps: number, bass?: Part): Part =>
  (ctx) => {
    const changes = ctx.chords.map((c) => c.s + c.d);
    const bs = bass ? bass(ctx) : [];
    return p(ctx).map((e) => {
      const next = changes.find((x) => x > e.s + 1e-9) ?? ctx.steps;
      let end = Math.max(e.s + e.d, Math.min(next, e.s + maxSteps));
      for (const b of bs) if (b.s > e.s + 1e-9 && b.s < end - 1e-9 && b.m > e.m) end = b.s;
      return { ...e, d: end - e.s };
    });
  };

/** arp() on fixed chord shapes: `shapes` gives each chord symbol's notes, low → high; pattern
 *  digits index the shape and wrap up an octave (for a 3-note shape, 3 = its lowest note an
 *  octave up); durations are sticky, 'r' rests */
const shapeArp =
  (ch: string, pattern: string, shapes: Record<string, string>, vel: number): Part =>
  (ctx) => {
    const toks = pattern.trim().split(/\s+/);
    const out: Ev[] = [];
    let d = 1;
    for (let t = 0, i = 0; t < ctx.steps - 1e-9; t += d, i++) {
      const [sym, ds] = toks[i % toks.length].split(':');
      if (ds) d = parseFloat(ds);
      if (sym === 'r') continue;
      const chord = ctx.chordAt(t).sym;
      const shape = shapes[chord]?.split(' ').map(noteToMidi);
      if (!shape) {
        ctx.warn(`${ch}: no shape for ${chord}`);
        continue;
      }
      const k = parseInt(sym, 10);
      out.push({ s: t, d, m: shape[k % shape.length] + 12 * Math.floor(k / shape.length), v: vel, ch });
    }
    return out;
  };

/** pitch classes of a harp pedal setting, from note names ('G A B D E' = G pentatonic) */
const pedals = (names: string): number[] => names.split(' ').map((n) => noteToMidi(n + '4') % 12);
/** harp glissando with the pedals set to `pcs`, from → to over `dur` steps starting at step `at`,
 *  velocity v0 → v1; every string rings on for `ringSteps` */
const gliss =
  (ch: string, pcs: number[], at: number, from: string, to: string, dur: number, v0: number, v1: number, ringSteps = 3): Part =>
  () => {
    const a = noteToMidi(from);
    const b = noteToMidi(to);
    const dir = b >= a ? 1 : -1;
    const notes: number[] = [];
    for (let m = a; dir > 0 ? m <= b : m >= b; m += dir) if (pcs.includes(((m % 12) + 12) % 12)) notes.push(m);
    const dt = dur / notes.length;
    return notes.map((m, i) => ({ s: at + i * dt, d: ringSteps, m, v: v0 + ((v1 - v0) * i) / Math.max(1, notes.length - 1), ch }));
  };
/** glissandi over the G chord: pentatonic pedal setting (no F#/C rubbing against the held G/B) */
const G_PENTA = pedals('G A B D E');

/** rolled chord: notes one after another every `dt` steps, all held until step `until` */
const roll = (ch: string, at: number, notes: string[], dt: number, until: number, v: number): Part =>
  hits(
    ch,
    notes.map((n, i): [number, string, number, number] => [at + i * dt, n, v * (0.85 + (0.15 * i) / notes.length), until - (at + i * dt)]),
  );

// ---------------------------------------------------------------------------------------------
// Accompaniment patterns (4 steps per bar; the bass plays the two beats)
// ---------------------------------------------------------------------------------------------

/** nylon guitar: chord tones in eighths between the bass notes (with its own low note in the
 *  refrain, voiced from D3 up so it never sits under the bass: D7 = D3 F♯3 C4, the 5th-fret grip) */
const GTR_V = 'r:0.5 1 2 3 r 1 2 3';
const GTR_C = '0:0.5 1 2 3 r 1 2 3';
/** harp: one sweep up and back per bar */
const HARP_C = '0:0.5 1 2 3 4 3 2 1';
/** harp hand shapes in the second refrain (low → high): D7 in root position with its fifth, so no
 *  C–D second rubs in the bass register and nothing sits under the bass's D3 */
const HARP_SHAPES: Record<string, string> = { G: 'B2 D3 G3', G7: 'B2 F3 G3', Am: 'A2 C3 E3', Cm: 'C3 Eb3 G3', D7: 'D3 F#3 A3 C4' };
/** accordion after-beats */
const ACC_PA = "r:1 c':1 r:1 c':1";

export const menu: SongDef = {
  id: 'menu',
  bpm: 80,
  stepsPerBeat: 2,
  barSteps: 4,
  scale: 'G major',
  gainDb: 1.3,
  humanize: 0.007,
  reverb: { rt60: 1.9, size: 1.15, damp: 0.45, predelay: 0.024, er: 0.3, hp: 240, lp: 6500, wet: 1.6 },
  channels: {
    mand: { inst: 'mandolin', gain: 0, pan: -0.1, send: 0.22, hum: 0.6 },
    vln: { inst: 'violin', gain: -4, pan: 0.08, send: 0.28 },
    mandH: { inst: 'mandolin', gain: -6, pan: -0.3, send: 0.24 },
    gtr: { inst: 'guitar', gain: -8, pan: 0.3, send: 0.18 },
    harp: { inst: 'harp', gain: -8, pan: -0.32, send: 0.3 },
    bass: { inst: 'uprightBass', gain: -4.5, pan: 0.02, send: 0.06 },
    acc: { inst: 'accordionDry', gain: -15, pan: -0.22, send: 0.25, hum: 0 },
    accC: { inst: 'accChord', gain: -10, pan: 0.22, send: 0.16, hum: 0.5 },
    str: { inst: 'strings', gain: -15, pan: 0, send: 0.32, hum: 0 },
  },
  sections: {
    intro: {
      bars: 1,
      chords: 'D7:4',
      parts: [roll('harp', 0, ['D3', 'F#3', 'A3', 'C4', 'D4', 'F#4', 'A4', 'C5'], 0.5, 4, 0.75), mel('bass', 'D2:2 r:1 F#2:1 |', { vel: 0.7 })],
    },
    verse: {
      bars: 16,
      chords: V_CH,
      parts: [
        mel('mand', VERSE, { vel: 0.8, tremMin: 2 }),
        ringOn(arp('gtr', GTR_V, { lo: 'B2', hi: 'A3', n: 3, vel: 0.55 }), 2, bassV),
        bassV,
        pad('acc', { lo: 'D3', hi: 'C4', n: 3, vel: 0.45, from: 8, to: 15 }),
        gliss('harp', G_PENTA, 15 * 4 + 2, 'D3', 'D5', 2, 0.35, 0.65),
      ],
    },
    chorus: {
      bars: 16,
      chords: R_CH,
      parts: [
        mel('mand', REFRAIN, { vel: 0.9, tremMin: 2 }),
        ringOn(arp('gtr', GTR_C, { lo: 'D3', hi: 'D4', n: 3, vel: 0.55 }), 2, bassR),
        bassR,
        pad('str', { lo: 'A3', hi: 'G4', n: 3, vel: 0.4 }),
        roll('harp', 0, ['G3', 'D4', 'G4', 'B4'], 0.125, 4, 0.6),
        roll('harp', 8 * 4 + 1, ['G3', 'B3', 'D4', 'F4'], 0.5, 8 * 4 + 4, 0.5),
        gliss('harp', G_PENTA, 15 * 4 + 2, 'G3', 'G5', 2, 0.35, 0.65),
      ],
    },
    chorus2: {
      bars: 16,
      chords: R_CH,
      parts: [
        mel('vln', REFRAIN_VLN, { vel: 0.85 }),
        mel('mandH', SECONDA, { vel: 0.62, tremMin: 2 }),
        ringOn(shapeArp('harp', HARP_C, HARP_SHAPES, 0.55), 4, bassR2),
        comp('accC', ACC_PA, { lo: 'F#3', hi: 'E4', n: 3, vel: 0.5 }),
        bassR2,
        pad('str', { lo: 'A3', hi: 'G4', n: 3, vel: 0.3 }),
      ],
    },
  },
  form: ['intro', 'verse', 'chorus', 'chorus2'],
  loopFrom: 0,
};
