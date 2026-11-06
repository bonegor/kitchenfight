/**
 * FINAL BOSS — "Dies irae", from Giuseppe Verdi's Messa da Requiem (1874; public domain).
 * G minor, 4/4, ♩ = 84 (Verdi: Allegro agitato ♩ = 80), 8 steps per beat (a step is a 32nd note:
 * Verdi's runs and the G–F♯ swirl are written in 32nds).
 *
 * Verdi's material (pitches checked against the MIDI-derived reference lotro_diesirae.abc, see
 * docs/music/finalboss.md):
 *   H  the hammer blows: tutti G-minor chords on every beat, the bass drum THWACKING the off-beats;
 *   R  the rushing descending G-minor runs, the diminished-seventh plunge, F → D/F♯ → G;
 *   C  the chorus "Dies irae, dies illa / solvet saeclum in favilla" (the chromatic descent
 *      G F♯ F E E♭ D C, then triplets) over the violins' swirling G–F♯;
 *   S  the three-octave unison scale with turns that throws us back into the hammer blows;
 *   T  "teste David cum Sibylla": the chorus sighs F–E off the beat, in D minor, ending on A major.
 * Arrangement: the break is the cartoon part — the same Dies-irae motif sneaks by on fat bassoons
 * and tuba, then skeleton xylophone + piccolo over an oom-pah, before the choir murmurs it again.
 *
 * Form: intro(1, doom) | A(5) A2(5, heavier, pan clangs) B(4, teste David) brk(6, comic break)
 *       bld(2, D7 build) → loop to A.  Loop 22 bars = 62.9 s.
 */
import { comp, cresc, hits, mel, type SongDef } from '../sequencer';

/** n copies of a token string */
const rep = (s: string, n: number): string => Array.from({ length: n }, () => s).join(' ');
/** two pitches alternating in 32nds, n pairs */
const swirl = (a: string, b: string, n: number): string => rep(`${a}:1 ${b}:1`, n);
/** timpani roll: one stroke per 32nd, velocity ramp v0 → v1 */
const roll = (start: number, n: number, note: string, v0: number, v1: number): Array<[number, string, number]> =>
  Array.from({ length: n }, (_, i): [number, string, number] => [start + i, note, v0 + ((v1 - v0) * i) / Math.max(1, n - 1)]);
/** shift a hit list by whole bars */
const at = (bar: number, list: Array<[number, number | string, number?, number?]>): Array<[number, number | string, number?, number?]> =>
  list.map(([s, m, v, d]) => [s + bar * 32, m, v, d]);

// ---------------------------------------------------------------------------------------------
// A — Verdi bars 1-5 (and 6-10)
// ---------------------------------------------------------------------------------------------

/** H: the hammer blows (16th-note chords on the beats) */
const HAM_VLN = rep('G3+D4+Bb4+D5:2 r:6', 4);
const HAM_TRP = rep('D5+G5:2 r:6', 4);
const HAM_BRS = rep('G3+Bb3+D4+G4:2 r:6', 4);
const HAM_CB = rep('G1+G2:2 r:6', 4);
const HAM_TUBA = rep('G1:2 r:6', 4);

/** R: two descending G-minor runs, the C♯°7 plunge, then G♯-A … D (violin I line) */
const RUN = 'G5:1 F5 Eb5 D5 C5 Bb4 A4 G4 G5 F5 Eb5 D5 C5 Bb4 A4 G4 Bb5 G5 E5 C#5:4 G#4:1 A4:3 B4:1 {C#5}D5:4';
const R_BRS = 'G3+Bb3+D4+G4:2 r:6 G3+Bb3+Eb4+G4:2 r:6 G3+Bb3+C#4+E4:2 r:6 A3+C4+F4+A4:3 r:1 F#3+A3+D4+F#4:3 r:1';
const R_TRP = 'G4+G5:2 r:6 G4+G5:2 r:6 G4+G5:2 r:6 A4+A5:3 r:1 F#4+F#5:3 r:1';
const R_CB = 'G1:4 r:4 Eb2:4 r:4 E2:4 r:4 F2:4 F#2:4';
const R_VC = 'G2:2 Bb2:2 D3:2 G3:2 Eb2:2 G2:2 Bb2:2 Eb3:2 E2:2 G2:2 Bb2:2 C#3:2 F2:2 G2:2 F#2:2 G2:2';

/** C: the chorus motif "Di-es i-rae, di-es il-la / sol-vet sae-clum in fa-vil-la" → G */
const MOTIF_1 = 'G5:8 F#5:4 F5:4 E5:4 Eb5:4 D5:4 C5:4';
const MOTIF_2 = 'D5:8/3 C5 Bb4 C5 D5 Eb5 D5 C5 Bb4 C5:7 D5:1';
const MOTIF = `${MOTIF_1} | ${MOTIF_2} |`;
/** the violins' swirl, two bars */
const SWIRL = `${swirl('G5', 'F#5', 16)} | ${swirl('G5', 'F#5', 16)} |`;
const C_CB = 'G1:32 | G1:8 C2:8 G1:8 C2:7 D2:1 |';
const C_VC = `${rep('G2?:4', 8)} | G2?:4 G2?:4 C3?:4 C3?:4 G2?:4 G2?:4 C3?:4 C3?:3 D3:1 |`;

/** S: the unison scale with turns, G5 → G2 */
const SCALE = 'G5:1 F5 Eb5 D5 C#5 D5 C5 Bb4 A4 Bb4 A4 G4 F#4 G4 F4 Eb4 D4 Eb4 D4 C4 Bb3 C4 Bb3 A3 G3 F3 Eb3 D3 C3 Bb2 A2 G2';
const S_VLA = 'G4:1 F4 Eb4 D4 C#4 D4 C4 Bb3 A3 Bb3 A3 G3 F#3 G3 F3 Eb3 r:16';
const S_CB = 'G1:2 r:14 D3:1 Eb3 D3 C3 Bb2 C3 Bb2 A2 G2 F2 Eb2 D2 C2 Bb1 A1 G1';

const A_CH = 'Gm:32 | Gm:8 Eb/G:8 C#dim7/E:8 F:4 D/F#:4 | Gm:32 | Gm:8 Cm:8 Gm:8 Cm:7 D:1 | Gm:32';

/** strings in A: the hammer, runs and scale loud, the swirl under the chorus a little softer */
const VLN_A = `r:32 | ${RUN} | r:32 | r:32 | ${SCALE} |`;
const VLN_H = `${HAM_VLN} | r:32 | r:32 | r:32 | r:32 |`;
const VLA_A = `r:32 | ${RUN} | r:32 | r:32 | ${S_VLA} |`; // played an octave lower
const SWIRL_A = `r:32 | r:32 | ${SWIRL} r:32 |`;
/** trombones join the end of the unison scale */
const TBN_S = 'r:32 | r:32 | r:32 | r:32 | r:16 D4:1 Eb4 D4 C4 Bb3 C4 Bb3 A3 G3 F3 Eb3 D3 C3 Bb2 A2 G2 |';
const CHOIR_A = `r:32 | r:32 | ${MOTIF} G5:4 r:28 |`;
const BRS_A = `${HAM_BRS} | ${R_BRS} | r:32 | r:32 | G3+Bb3+D4+G4:2 r:30 |`;
const TRP_A = `${HAM_TRP} | ${R_TRP} | r:32 | r:32 | D5+G5:2 r:30 |`;
const CB_A = `${HAM_CB} | ${R_CB} | ${C_CB} ${S_CB} |`;
const VC_A = `r:32 | ${R_VC} | ${C_VC} r:32 |`;
const TUBA_A = `${HAM_TUBA} | G1:2 r:30 | r:32 | r:32 | G1:2 r:30 |`;

const TIMP_A: Array<[number, string, number]> = [
  [0, 'G2', 1.0], [8, 'G2', 0.92], [16, 'G2', 0.95], [24, 'G2', 1.0],
  [32, 'G2', 0.95], [60, 'D2', 0.9],
  [64, 'G2', 0.85], [80, 'G2', 0.7],
  [96, 'G2', 0.8], [112, 'G2', 0.7], [127, 'D2', 0.75],
  [128, 'G2', 0.9], ...roll(144, 16, 'D2', 0.3, 0.9),
];
/** the THWACKS: every off-beat of the hammer bar, beat 1 + off-beats of the run bar */
const BD_A: Array<[number, number, number]> = [
  [4, 60, 1.15], [12, 60, 1.1], [20, 60, 1.1], [28, 60, 1.15],
  [32, 60, 0.95], [36, 60, 1.1], [44, 60, 1.05], [52, 60, 1.05], [60, 60, 1.1],
  [64, 60, 0.9], [96, 60, 0.75], [128, 60, 0.9],
];

// ---------------------------------------------------------------------------------------------
// B — Verdi bars 11-14: "teste David cum Sibylla" (D minor → A major)
// ---------------------------------------------------------------------------------------------

const T1_CH = 'Dm:12 Am/C:4 Dm:12 Am/C:4';
const T2_CH = 'Dm:4 Am/C:4 Gm/D:4 Em7b5:4 A:16';
/** chorus: the sighs F-E off the beat, then "cum Si-byl-la" */
const T1_CHOIR = 'r:4 F5:6 r:2 E5:4 r:4 F5:6 r:2 E5:4';
const T2_CHOIR = 'r:8 D5:4 E5:4 E5:12 A5:4';
/** violins: rising 32nds to the accented high A, falling arpeggio; the B♭-A shake, A major */
const T1_VLN = rep('A4:1 D5:1 F5:1 G5:1 A5:4 r:1 F5:1 D5:1 A4:1 E5+A5:4', 2);
const T2_VLN = `${rep('Bb5:1 A5:1', 4)} Bb5:4 G5:4 A5:12 E5+A5:4`;
const T1_BRS = rep('r:4 D4+F4+A4:2 r:6 C4+E4+A4:2 r:2', 2);
const T2_BRS = 'D4+F4+A4:2 r:2 C4+E4+A4:2 r:2 D4+G4+Bb4:2 r:2 E4+G4+Bb4+D5:2 r:2 C#4+E4+A4:12 C#4+E4+A4+E5:4';
const T1_CB = 'D2:12 C2:4 D2:12 C2:4';
const T2_CB = 'D2:4 C2:4 D2:4 E2:4 A1:12 A1:4';
const T1_VC = rep('D3:4 A3:1 F3:1 D3:1 A2:1 D3:1 F3:1 A3:1 D4:1 C3:4', 2);
const T2_VC = 'D3:4 C3:4 D3:4 E3:4 A2:2 B2:1 C#3:1 D3:1 E3:1 F#3:1 G#3:1 A3:1 B3:1 C#4:1 D4:1 E4:4';

const B_CH = `${T1_CH} | ${T2_CH} | ${T1_CH} | ${T2_CH}`;
const TIMP_T: Array<[number, string, number]> = [
  [4, 'D2', 0.85], [12, 'A1', 0.75], [20, 'D2', 0.85], [28, 'A1', 0.8],
  [32, 'D2', 0.85], ...roll(48, 12, 'A1', 0.35, 0.85), [60, 'A2', 1.0],
];
const BD_T: Array<[number, number, number]> = [[4, 60, 0.95], [12, 60, 0.9], [20, 60, 0.95], [28, 60, 0.9], [36, 60, 0.9], [44, 60, 0.9], [60, 60, 1.2]];

// ---------------------------------------------------------------------------------------------
// brk — the comic break: the motif on bassoons + tuba, then xylophone + piccolo, then the choir
// ---------------------------------------------------------------------------------------------

const MOTIF_CH = 'Gm:32 | Gm:8 Cm:8 Gm:8 Cm:7 D:1';
const BRK_CH = `${MOTIF_CH} | ${MOTIF_CH} | ${MOTIF_CH}`;
/** oom-pah bass under the motif (tuba), following G | G C G C-D */
const OOM = 'G1:4 r:4 D2:4 r:4 G1:4 r:4 D2:4 r:4 | G1:4 r:4 C2:4 r:4 G1:4 r:4 C2:4 r:3 D2:1 |';

// ---------------------------------------------------------------------------------------------
// bld — the dominant build back into the hammer blows
// ---------------------------------------------------------------------------------------------

const BLD_UP = 'D3:1 Eb3 F#3 G3 A3 Bb3 C4 D4 D4 Eb4 F#4 G4 A4 Bb4 C5 D5 D5 Eb5 F#5 G5 A5 Bb5 C6 D6 D6:2 r:6';

export const finalboss: SongDef = {
  id: 'finalboss',
  bpm: 84,
  stepsPerBeat: 8,
  barSteps: 32,
  scale: 'G harmonic minor',
  gainDb: -6.8,
  humanize: 0.003,
  reverb: { rt60: 2.2, size: 1.4, damp: 0.5, predelay: 0.028, er: 0.42, hp: 280, lp: 7000, wet: 1.35 },
  channels: {
    // strings
    vln: { inst: 'strStab', gain: 6, pan: -0.28, send: 0.22, hum: 0.25 },
    vla: { inst: 'strStab', gain: 1, pan: 0.12, send: 0.22, hum: 0.25 },
    strS: { inst: 'strings', gain: -9, pan: -0.1, send: 0.3, hum: 0 },
    vc: { inst: 'cello', gain: -4, pan: 0.25, send: 0.2, hum: 0.25 },
    cb: { inst: 'contrabass', gain: -2, pan: 0.32, send: 0.15, hum: 0.2 },
    pizz: { inst: 'pizz', gain: -1, pan: -0.32, send: 0.15, hum: 0.3 },
    // brass
    brass: { inst: 'brass', gain: -9, pan: 0.14, send: 0.25, hum: 0.2 },
    trp: { inst: 'trumpet', gain: -9, pan: 0.22, send: 0.25, hum: 0.2 },
    tbn: { inst: 'trombone', gain: -6, pan: 0.3, send: 0.25, hum: 0.2 },
    horn: { inst: 'brassSoft', gain: -8, pan: -0.3, send: 0.3, hum: 0 },
    tuba: { inst: 'tuba', gain: -4, pan: 0.1, send: 0.1, hum: 0.2 },
    // voices and organ
    choir: { inst: 'choir', gain: -3.5, pan: 0, send: 0.35, hum: 0 },
    choirO: { inst: 'choirO', gain: -5, pan: 0, send: 0.4, hum: 0 },
    organ: { inst: 'organ', gain: -10, pan: 0, send: 0.35, hum: 0 },
    // the cartoon section
    bsn: { inst: 'bassoon', gain: 2, pan: -0.18, send: 0.2, hum: 0.2 },
    picc: { inst: 'piccolo', gain: -5, pan: -0.2, send: 0.25, hum: 0.2 },
    xylo: { inst: 'xylophone', gain: -1, pan: 0.3, send: 0.2, hum: 0.2 },
    // percussion
    timp: { inst: 'timpani', gain: -4, pan: 0, send: 0.2, hum: 0 },
    bd: { inst: 'bassDrum', gain: 3, pan: 0.05, send: 0.22, hum: 0 },
    bdR: { inst: 'bassDrum', gain: 5, pan: 0.05, send: 0.22, hum: 0 },
    crash: { inst: 'crash', gain: -7, pan: -0.15, send: 0.3, hum: 0 },
    cym: { inst: 'cymbal', gain: 2, pan: 0.2, send: 0.3, hum: 0 },
    tam: { inst: 'tamtam', gain: -5, pan: 0, send: 0.35, hum: 0 },
    pan: { inst: 'panClang', gain: -7, pan: 0.38, send: 0.2, hum: 0 },
    wb: { inst: 'woodblock', gain: -5, pan: 0.42, send: 0.15, hum: 0.3 },
    slap: { inst: 'slapstick', gain: -2, pan: -0.38, send: 0.2, hum: 0 },
  },
  sections: {
    intro: {
      bars: 1,
      chords: 'Gm:32',
      parts: [
        hits('tam', [[0, 60, 0.9]]),
        mel('organ', 'G1+D2+G2:32', { vel: 0.8 }),
        mel('choirO', 'G3+D4+G4:32', { vel: 0.7 }),
        hits('timp', [[0, 'G2', 0.9], ...roll(8, 24, 'D2', 0.25, 0.95)]),
        hits('cym', [[8, 60, 0.3, 8], [16, 60, 0.45, 8], [24, 60, 0.62, 8]], 1),
        hits('bd', [[0, 60, 0.9]]),
      ],
    },
    A: {
      bars: 5,
      chords: A_CH,
      parts: [
        mel('vln', VLN_A, { vel: 1.0 }),
        mel('vln', VLN_H, { vel: 0.64 }),
        mel('vla', VLA_A, { vel: 0.8, oct: -1 }),
        mel('vln', SWIRL_A, { vel: 0.66 }),
        mel('vla', SWIRL_A, { vel: 0.58, oct: -1 }),
        mel('tbn', TBN_S, { vel: 0.8 }),
        mel('choir', CHOIR_A, { vel: 0.95 }),
        mel('choir', CHOIR_A, { vel: 0.8, oct: -1 }),
        mel('brass', BRS_A, { vel: 1.0 }),
        mel('trp', TRP_A, { vel: 0.95 }),
        mel('cb', CB_A, { vel: 0.9 }),
        mel('vc', VC_A, { vel: 0.8 }),
        mel('tuba', TUBA_A, { vel: 0.95 }),
        hits('timp', TIMP_A),
        hits('bd', BD_A),
        hits('bdR', [[144, 60, 0.3, 8], [152, 60, 0.45, 8]], 1),
        hits('crash', [[0, 60, 0.95], [64, 60, 0.7]]),
        hits('cym', [[144, 60, 0.35, 4], [148, 60, 0.45, 4], [152, 60, 0.55, 4], [156, 60, 0.66, 4]], 1),
      ],
    },
    A2: {
      bars: 5,
      chords: A_CH,
      parts: [
        mel('vln', VLN_A, { vel: 1.05 }),
        mel('vln', VLN_H, { vel: 0.7 }),
        mel('vla', VLA_A, { vel: 0.86, oct: -1 }),
        mel('vln', SWIRL_A, { vel: 0.7 }),
        mel('vla', SWIRL_A, { vel: 0.62, oct: -1 }),
        mel('tbn', TBN_S, { vel: 0.9 }),
        mel('picc', `r:32 | ${RUN} | r:32 | r:32 | r:32 |`, { vel: 0.7, oct: 1 }),
        mel('choir', CHOIR_A, { vel: 1.0 }),
        mel('choir', CHOIR_A, { vel: 0.85, oct: -1 }),
        mel('tbn', `r:32 | r:32 | ${MOTIF} r:32 |`, { vel: 0.85, oct: -2 }),
        mel('horn', 'r:32 | r:32 | G3+D4:32 | G3+D4:8 G3+C4+Eb4:8 G3+D4:8 G3+C4+Eb4:7 F#3+D4:1 | r:32 |', { vel: 0.75 }),
        mel('organ', 'r:32 | r:32 | G1+G2:32 | G1+G2:32 | r:32 |', { vel: 0.75 }),
        mel('brass', BRS_A, { vel: 1.05 }),
        mel('trp', TRP_A, { vel: 1.0 }),
        mel('cb', CB_A, { vel: 0.95 }),
        mel('vc', VC_A, { vel: 0.85 }),
        mel('tuba', TUBA_A, { vel: 1.0 }),
        hits('timp', TIMP_A.map(([s, m, v]): [number, string, number] => [s, m, Math.min(1.05, v * 1.04)])),
        hits('bd', BD_A),
        hits('pan', [[4, 60, 0.85], [12, 60, 0.75], [20, 60, 0.8], [28, 60, 0.9]]),
        hits('bdR', [[144, 60, 0.3, 8], [152, 60, 0.45, 8]], 1),
        hits('tam', [[0, 60, 0.8]]),
        hits('crash', [[0, 60, 1.0], [64, 60, 0.8], [128, 60, 0.7]]),
        hits('cym', [[144, 60, 0.35, 4], [148, 60, 0.45, 4], [152, 60, 0.55, 4], [156, 60, 0.66, 4]], 1),
      ],
    },
    B: {
      bars: 4,
      chords: B_CH,
      parts: [
        mel('choir', `${T1_CHOIR} | ${T2_CHOIR} | ${T1_CHOIR} | ${T2_CHOIR} |`, { vel: 1.08 }),
        mel('choir', `${T1_CHOIR} | ${T2_CHOIR} | ${T1_CHOIR} | ${T2_CHOIR} |`, { vel: 0.92, oct: -1 }),
        mel('vln', `${T1_VLN} | ${T2_VLN} | ${T1_VLN} | ${T2_VLN} |`, { vel: 0.66 }),
        mel('strS', 'r:32 | r:16 A4+C#5+E5:12 r:4 | r:32 | r:16 A4+C#5+E5:12 r:4 |', { vel: 0.7 }),
        mel('brass', `${T1_BRS} | ${T2_BRS} | ${T1_BRS} | ${T2_BRS} |`, { vel: 0.85 }),
        mel('cb', `${T1_CB} | ${T2_CB} | ${T1_CB} | ${T2_CB} |`, { vel: 0.75 }),
        mel('vc', `${T1_VC} | ${T2_VC} | ${T1_VC} | ${T2_VC} |`, { vel: 0.62 }),
        mel('organ', 'D2+A2:32 | D2+A2:16 A1+E2:16 | D2+A2:32 | D2+A2:16 A1+E2:16 |', { vel: 0.5 }),
        hits('timp', [...TIMP_T, ...at(2, TIMP_T)]),
        hits('bd', [...BD_T, ...at(2, BD_T)]),
        hits('crash', [[60, 60, 0.9], [124, 60, 1.0]]),
        hits('tam', [[124, 60, 0.75]]),
      ],
    },
    brk: {
      bars: 6,
      chords: BRK_CH,
      parts: [
        // 1-2: fat bassoons (octaves) sneak the motif in, tuba oom, pizzicato pah
        mel('bsn', `${MOTIF} r:32 | r:32 | r:32 | r:32 |`, { vel: 0.85, oct: -2, gate: 0.55 }),
        mel('bsn', `${MOTIF} r:32 | r:32 | r:32 | r:32 |`, { vel: 0.7, oct: -3, gate: 0.55 }),
        mel('tuba', `${OOM} ${OOM} r:32 | r:32 |`, { vel: 1.0, gate: 0.6 }),
        comp('pizz', 'r:4 c:4', { lo: 'D4', hi: 'D5', n: 3, vel: 0.62, to: 4 }),
        // 3-4: skeleton xylophone + piccolo
        mel('xylo', `r:32 | r:32 | ${MOTIF} r:32 | r:32 |`, { vel: 0.85 }),
        mel('picc', `r:32 | r:32 | ${MOTIF} r:32 | r:32 |`, { vel: 0.6, oct: 1, gate: 0.6 }),
        hits('timp', [0, 1, 2, 3].flatMap((b) => at(b, [[0, 'G2', 0.55], [16, 'D2', 0.45]]))),
        hits('wb', [0, 1, 2, 3].flatMap((b) => at(b, [[12, 60, 0.5], [28, 60, 0.45]]))),
        hits('slap', [[63, 60, 0.75], [127, 60, 0.8]]),
        hits('bd', [[0, 60, 0.6], [64, 60, 0.6]]),
        // 5-6: the storm gathers: the choir murmurs the motif over the swirl
        cresc(mel('choirO', `r:32 | r:32 | r:32 | r:32 | ${MOTIF}`, { vel: 0.9 }), 0.55, 1.0),
        cresc(mel('horn', `r:32 | r:32 | r:32 | r:32 | ${MOTIF}`, { vel: 0.7, oct: -1 }), 0.6, 1.0),
        cresc(mel('vln', `r:32 | r:32 | r:32 | r:32 | ${SWIRL}`, { vel: 0.75 }), 0.45, 1.0),
        mel('cb', 'r:32 | r:32 | r:32 | r:32 | G1:32 | G1:8 C2:8 G1:8 C2:7 D2:1 |', { vel: 0.75 }),
        hits('timp', [[128, 'G2', 0.6], ...roll(160, 31, 'D2', 0.25, 0.75)]),
        hits('cym', [[176, 60, 0.3, 8], [184, 60, 0.45, 8]], 1),
      ],
    },
    bld: {
      bars: 2,
      chords: 'D7:32 | D7:32',
      parts: [
        cresc(mel('vln', `${BLD_UP} | ${rep('C5+F#5:2', 14)} r:4 |`, { vel: 0.95 }), 0.75, 0.88),
        cresc(mel('vla', `${BLD_UP} | ${rep('D4+A4:2', 14)} r:4 |`, { vel: 0.85, oct: -1 }), 0.75, 0.88),
        cresc(mel('brass', `r:8 D4+F#4+A4+C5:2 r:14 D4+F#4+A4+C5:2 r:6 | ${rep('D4+F#4+A4+C5:2 r:2', 7)} r:4 |`, { vel: 0.95 }), 0.45, 0.8),
        cresc(mel('choir', `${rep('D4+A4+C5+F#5:8', 4)} | ${rep('D4+A4+C5+F#5:8', 3)} D4+A4+C5+F#5:4 r:4 |`, { vel: 0.95 }), 0.35, 0.75),
        cresc(mel('horn', `${rep('D3+A3+C4+F#4:16', 2)} | D3+A3+C4+F#4:16 D3+A3+C4+F#4:12 r:4 |`, { vel: 0.85 }), 0.5, 0.9),
        mel('organ', 'D2+A2:32 | D2+A2+C3:28 r:4 |', { vel: 0.7 }),
        mel('cb', `${rep('D2:4', 8)} | ${rep('D2:2', 14)} r:4 |`, { vel: 0.85 }),
        mel('tuba', 'D2:2 r:22 D2:2 r:6 | D2:2 r:30 |', { vel: 0.9 }),
        hits('timp', [[0, 'D2', 0.9], [24, 'D2', 0.85], ...roll(32, 32, 'D2', 0.35, 1.0)]),
        hits('bd', [[0, 60, 0.9], [24, 60, 0.95]]),
        hits('bdR', [[32, 60, 0.25, 8], [40, 60, 0.32, 8], [48, 60, 0.4, 8], [56, 60, 0.48, 8]], 1),
        hits('cym', [[32, 60, 0.3, 8], [40, 60, 0.42, 8], [48, 60, 0.54, 8], [56, 60, 0.66, 8]], 1),
      ],
    },
  },
  form: ['intro', 'A', 'A2', 'B', 'brk', 'bld'],
  loopFrom: 1,
};
