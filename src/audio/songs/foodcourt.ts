/**
 * FOODCOURT (stage 4, La Food Court) — "Torna a Surriento" (Ernesto De Curtis, 1902), turned
 * into soulless shopping-mall MUZAK that keeps getting corrupted.
 *
 * A PA chime, then a cheesy D-major lounge jazz waltz (vibes, FM e-piano, synth pad, bossa synth
 * bass, ride + shaker) plays the song's major strains. When the tune turns to D minor the mall
 * rots: detuned warble lead, minor/chromatic reharmonisation (B♭maj7 tape warp, DmM7, lament
 * bass, German sixth), staccato bassoon creeping, orchestra hits, dark pad, ratchet / toy-whistle
 * glitches — and the real orchestra pushes through the synthetic band, the robot arps heckling it.
 * A PA chime snaps everything back to fake-cheerful muzak, and the second round escalates to a
 * full Neapolitan tutti.
 * D major / D minor, 3/4, ♩ = 162 (54 bars/min), light swing. Reference: av_surriento.abc
 * (strain A = bars 1-8, B = 9-16, C = 17-24, D = refrain 25-32); see docs/music/foodcourt.md.
 * Form: intro(4: chime + vamp) | B(8 muzak) C(8 muzak → corrupt) A(8 sinister) A1(8 the cellos
 *       push in) D(8 refrain, orchestra breaks through) chime(2) B2(8 muzak relapse) C2(8 corrupt)
 *       A2(8 street-band orchestra) D2(8 tutti) chime2(2, rising) → loop to B.
 */
import { arp, bass, comp, cresc, drums, hits, mel, pad, type SongDef } from '../sequencer';

// ---------------------------------------------------------------------------------------------
// The tune (av_surriento.abc), one step = an eighth
// ---------------------------------------------------------------------------------------------

/** strain A, D minor (ref bars 1-8): "Vide 'o mare quant'è bello, spira tantu sentimento…" */
const A_MEL = `
  D4:1 E4 F4 G4 A4 F4 | A4:2 A4:4 | G4:1 A4 Bb4 G4 Bb4 G4 | D5:2 D5:4 |
  D5:1 E5 F5 E5 D5 E5 | A4:2 A4:4 | G4:1 A4 G4 F4 E4 F4 | D4:4 r:2 |`;
/** strain B, D major (ref bars 9-16): "Guarda, gua', chistu ciardino…" */
const B_MEL = `
  D5:1 C#5 A4 B4 C#5 A4 | B4:2 B4:4 | C#5:1 B4 A4 B4 C#5 A4 | B4:2 B4:4 |
  F#4:1 G4 A4 F#4 E4 D4 | G4:2 G4:4 | A4:1 B4 C#5 B4 A4 C#5 | F#4:4 r:2 |`;
/** strain C (ref bars 17-24): "E tu dice: 'I' parto, addio!'…" — phrase 1 (ref 17-20) in D major… */
const C_MEL_1 = `D5:1 C#5 A4 B4 C#5 A4 | B4:2 B4:4 | E5:1 D5 C#5 D5 E5 C#5 |`;
/** …its last note, the D of ref bar 20 (played from step 18, on the B♭ chord where the tape warps;
 *  same octave as the rest of the phrase)… */
const C_MEL_1_END = `D5:2 D5:4 |`;
/** …phrase 2 (ref 21-24) falls back to D minor, an octave lower (played from step 24) */
const C_MEL_2 = `D5:1 E5 F5 E5 D5 E5 | A4:2 A4:4 | G4:1 A4 G4 F4 E4 F4 | D4:4 r:2 |`;
/** strain D, the refrain (ref bars 25-32): "Ma nun me lassà, nun darme stu turmiento!… */
const D_MEL_1 = `D5:1 E5 C#5:3 B4:1 | D5:6 | r:1 C#5 D5 E5 C#5 B4 | A4:2 A4:4 |`;
/** …Torna a Surriento, famme campà!" (from step 24) */
const D_MEL_2 = `G4:2 Bb4 D5 | F5:3 E5:1 D5:2 | r:1 E5 C#5:3 D5:1 | D5:4 r:2 |`;
const D_MEL = D_MEL_1 + D_MEL_2;

/** shopping-mall PA chime (dotted quarters across the 3/4 bar: ding-dong-ding-dong), falling
 *  before the muzak relapse, rising at the loop seam */
const CHIME = 'A5:3 F#5 | D5:3 A4 |';
const CHIME_UP = 'A4:3 D5 | F#5:3 A5 |';

// ---------------------------------------------------------------------------------------------
// Harmony. Muzak: the reference chords with lounge colours (6ths, 7ths, 9ths) — D6 rather than
// Dmaj7 wherever the tune sits on D. Corrupted: minor / chromatic.
// The comping voices 3 notes and drops the fifth first, so a maj7 or mM7 symbol would put the
// root a semitone above the seventh (C#-D, A-B♭). Those chords are therefore spelled as their
// upper structures over the bass the synth bass / bassoon already play: Dmaj7 = F#m/D (F# A C#),
// B♭maj7 = Dm/B♭ (D F A), DmM7 = Faug/D (F A C#), and the lament's DmM7/C# = Dm/C# (D F A).
// ---------------------------------------------------------------------------------------------

/** strain B (ref: D | Em | A7 | D | D | Em | A7 | D). Last bar: Dmaj7, then the A9 turnaround
 *  on 2&, together with the comping's push and the bossa bass's second note */
const B_CH = 'D6:6 | Em7:6 | A9:6 | D6:6 | D6:6 | Em7:6 | A9:6 | F#m/D:3 A9:3';
/** strain B, relapse: vi–ii–V in the second phrase */
const B2_CH = 'D6:6 | Em7:6 | A9:6 | D6:6 | Bm7:6 | Em7:6 | A9:6 | F#m/D:3 A9:3';
/** strain C (ref: D | Em | A7 | Bb | Gm | Dm | A7 | Dm); rots from the B♭maj7 on */
const C_CH = 'D6:6 | Em7:6 | A9:6 | Dm/Bb:6 | Gm:6 | Faug/D:6 | A7b9:6 | Dm:4 A7b9:2';
/** strain A, sinister (ref: Dm | Dm | Gm | Dm | Bb | Dm | A7 | Dm): lament bass D C# B♭ A,
 *  B♭7 = German sixth → Dm/A → A7 */
const A_CH = 'Dm:6 | Dm/C#:6 | Gm6/Bb:6 | Dm/A:6 | Bb7:6 | Dm/A:6 | A7b9:6 | Dm:4 A7:2';
/** strain A, the orchestra's straight harmony (ref chords; B♭ → Gm as in wf_surriento) */
const A2_CH = 'Dm:6 | Dm:6 | Gm:6 | Dm:6 | Bb:4 Gm:2 | Dm/A:6 | A7:6 | Dm:4 A7:2';
/** refrain (ref: D | Em | A7 | D | Gm | Dm | A7 | Dm) */
const D_CH = 'D:6 | Em7:6 | A7:6 | D:6 | Gm:6 | Dm/A:6 | A7:6 | Dm:6';
/** the chime's chord changes with its last note (A4 / A5 on 2&) */
const CHIME_CH = 'D6:6 | D6:3 A9:3';

// ---------------------------------------------------------------------------------------------
// Bass lines and accompaniment figures
// ---------------------------------------------------------------------------------------------

/** bossa-waltz synth bass: root and fifth in dotted quarters (two against three), approach notes
 *  at the phrase ends; the last bar moves to A on 2& with the turnaround chord */
const SB_B = `D2:3 A2 | E2:3 B2 | A2:3 E2 | D2:3 A2:2 C#2:1 | D2:3 A2 | E2:3 B2 | A2:3 E2 | D2:3 A1:2 C#2:1 |`;
const SB_B2 = `D2:3 A2 | E2:3 B2 | A2:3 E2 | D2:3 A2:2 F#2:1 | B1:3 F#2 | E2:3 B2 | A2:3 E2 | D2:3 A1:2 C#2:1 |`;
/** strain C: A7♭9 gets root and third (the tune's F is the ♭13: no fifth E under it) */
const SB_C = `D2:3 A2 | E2:3 B2 | A2:3 E2 | Bb1:3 F2 | G2:3 D2 | D2:3 A2 | A1:3 C#2 | D2:4 A1:2 |`;
/** refrain bars 1-4 (the muzak band still plays under the violins) */
const SB_D = `D2:3 A2 | E2:3 B2 | A2:3 E2 | D2:3 A2 |`;
/** street-band tuba "oom" on 1 (root, fifth on repeated chords, pickups on beat 3) */
const TUBA_A2 = `D2:2 r:4 | A1:2 r:4 | G1:2 r:4 | D2:2 r:4 | Bb1:2 r:2 G1:2 | A1:2 r:4 | A1:2 r:2 C#2:2 | D2:2 r:2 A1:2 |`;
const TUBA_D_1 = `D2:2 r:4 | E2:2 r:4 | A1:2 r:4 | D2:2 r:2 A1:2 |`;
const TUBA_D_2 = `G1:2 r:4 | A1:2 r:4 | A1:2 r:2 C#2:2 | D2:2 r:4 |`;

/** jazz-waltz comping: beats 2 and 3, then "2&" anticipation held over beat 3 */
const EP_WALTZ = 'r:2 c:2 c:2 | r:2 c:1 c:3';
/** vibes comping (B2/C2): long chord on 1, then 2-3 */
const VIB_COMP = 'c:3 r:3 | r:2 c:4';
/** vibes, last bar of B2: beat 2, then the 2& push into the A9 turnaround */
const VIB_PUSH = 'r:2 c:1 c:3';
/** strings / pizzicato "pa-pa" on 2 and 3 */
const PAPA = 'r:2 c:2 c:2';
/** robot heckle: a burst of sixteenths in the gap after the tune's held note is re-struck */
const ROBO_GAP = 'r:3 0:0.5 1 2 3 2 1';
/** the robots' last, shorter heckle on beat 3 (after the horn's passing E in A2 bar 6) */
const ROBO_LAST = 'r:4 0:0.5 1 2 3';
/** comping ranges: 3-note voicings under the tune (fifth dropped first; the 9th chords also lose
 *  their root) */
const COMP = { lo: 'E3', hi: 'G4', n: 3 };
const PADR = { lo: 'A3', hi: 'A4', n: 3 };
/** B2: the steel guitar plays the tune at pitch (D4-D5), so its comping and pad sit below D4 */
const COMP_B2 = { lo: 'C3', hi: 'D4', n: 3 };
const PAD_B2 = { lo: 'D3', hi: 'D4', n: 3 };
const DARK = { lo: 'F3', hi: 'D4', n: 3 };
const PAPAR = { lo: 'E3', hi: 'E4', n: 3 };

/** creeping staccato bassoon, strain A (follows the lament bass of A_CH) */
const BSN_A = `
  D3':2 F3' A3' | C#3' F3' A3' | Bb2' D3' G3' | A2' D3' F3' |
  Bb2' D3' Ab3' | A2' D3' F3' | A2' C#3' G3' | D3' D2' A2' |`;
/** A1: bassoon "oom" on beat 1 (the lament bass) under pizzicato "pa-pa" */
const BSN_OOM = `D3':2 r:4 | C#3':2 r:4 | Bb2':2 r:4 | A2':2 r:4 | Bb2':2 r:4 | A2':2 r:4 | A2':2 r:4 | D3':2 r:2 A2':2 |`;
/** horn counter-line for the orchestral strain A (moves while the tune holds) */
const HRN_A2 = `
  A3:6 | F4:2 E4 D4 | D4:6 | F4:2 G4 A4 | Bb3:6 | F4:2 E4 D4 | E4:3 C#4:3 | D4:2 F4 A4 |`;
/** refrain counter-lines: horns (bars 1-4 / 5-8) and trombone (B♭-A-G-F tetrachord) */
const HRN_D_1 = 'F#4:6 | G4:2 F#4 E4 | G4:6 | F#4:4 r:2 |';
const HRN_D_2 = 'D4:6 | D4:6 | C#4:6 | D4:4 r:2 |';
const TBN_D_2 = 'Bb3:6 | A3:6 | G3:6 | F3:4 r:2 |';

// ---------------------------------------------------------------------------------------------
// Drums (one char = one eighth)
// ---------------------------------------------------------------------------------------------

const HAT = { X: { v: 0.62, vr: [0, 1] }, x: { v: 0.48, vr: [0, 1] }, y: { v: 0.32, vr: [0, 1] } };
const RIDE = 'X.xyx.'; // jazz-waltz ride: 1, 2, 2&, 3
const TICK = 'x.x.x.'; // the mall clock
const OPEN = { o: { v: 0.5, vr: [0, 1] } };
const SHAKE = { S: { v: 0.55, vr: [0, 1] }, s: { v: 0.36, vr: [0, 1] } };
const SHK = 'Ssssss';
const KICK = { K: { v: 0.62 }, k: { v: 0.42 } };
const CLV = { c: { v: 0.5, vr: [0, 1] } };
/** tamburello of the street band: 0,1 hit; 2,3 shake; 4,5 accent; 6,7 roll */
const TAMB = { X: { v: 0.9, vr: [4, 5] }, x: { v: 0.6, vr: [0, 1] }, s: { v: 0.5, vr: [2, 3] }, R: { v: 0.7, vr: [6, 7] } };
const TAMB_WALTZ = 'X.xsx.|X.xsx.|X.xsx.|X.xsR.';
/** a snare roll crescendo over beat 3 of the last bar (sixteenths) */
const ROLL = (vel: number): Array<[number, string, number]> => Array.from({ length: 8 }, (_, i): [number, string, number] => [44 + i * 0.5, 'C4', vel + i * 0.07]);
/** timpani (D2-A2 drum pair): six eighths crescendo on the dominant A2 through the last bar */
const TIMP_A_ROLL = (vel: number, inc: number): Array<[number, string, number]> => Array.from({ length: 6 }, (_, i): [number, string, number] => [42 + i, 'A2', vel + i * inc]);

export const foodcourt: SongDef = {
  id: 'foodcourt',
  bpm: 162,
  stepsPerBeat: 2,
  barSteps: 6,
  swing: 0.08,
  scale: 'D major',
  gainDb: -1.1,
  humanize: 0.004,
  reverb: { rt60: 1.9, size: 1.25, damp: 0.55, predelay: 0.026, er: 0.4, hp: 300, lp: 7200, wet: 1.4 },
  channels: {
    // the muzak band
    vib: { inst: 'vibes', gain: 0, pan: 0.05, send: 0.3, hum: 0.2 },
    vibC: { inst: 'vibes', gain: -0.9, pan: 0.3, send: 0.32, hum: 0.3 },
    chm: { inst: 'vibes', gain: -0.9, pan: -0.1, send: 0.4, hum: 0 },
    cel: { inst: 'celesta', gain: -10, pan: 0.32, send: 0.35, hum: 0 },
    sgtr: { inst: 'steelGuitar', gain: -3, pan: -0.12, send: 0.25, hum: 0.4 },
    ep: { inst: 'epiano', gain: -9, pan: -0.22, send: 0.25, hum: 0.3 },
    epL: { inst: 'epiano', gain: -4, pan: -0.05, send: 0.28, hum: 0.2 },
    spad: { inst: 'synthPad', gain: -17, pan: 0, send: 0.4, hum: 0 },
    sb: { inst: 'synthBass', gain: -5, pan: 0, send: 0.03, hum: 0 },
    robo: { inst: 'roboArp', gain: -5, pan: 0.38, send: 0.15, hum: 0 },
    hat: { inst: 'hatC', gain: -5, pan: 0.25, send: 0.05, hum: 0.3 },
    hatO: { inst: 'hatO', gain: -10, pan: 0.3, send: 0.1, hum: 0 },
    shk: { inst: 'shaker', gain: -6.7, pan: -0.3, send: 0.08, hum: 0.5 },
    clv: { inst: 'claves', gain: -10, pan: -0.35, send: 0.15, hum: 0.3 },
    kick: { inst: 'kick', gain: -10, pan: 0, send: 0.05, hum: 0 },
    // the corruption
    warb: { inst: 'warble', gain: -3, pan: 0.02, send: 0.3, hum: 0.2 },
    dpad: { inst: 'darkPad', gain: -15, pan: 0, send: 0.35, hum: 0 },
    bsn: { inst: 'bassoon', gain: -5, pan: -0.18, send: 0.15 },
    hit: { inst: 'orchHit', gain: -10.6, pan: 0, send: 0.3, hum: 0 },
    ratch: { inst: 'ratchet', gain: -15, pan: 0.42, send: 0.2, hum: 0 },
    whis: { inst: 'toyWhistle', gain: -13, pan: -0.42, send: 0.25, hum: 0 },
    // the real orchestra
    vln: { inst: 'violin', gain: -4.4, pan: 0.15, send: 0.28 },
    vc: { inst: 'cello', gain: -3, pan: -0.15, send: 0.26 },
    tpt: { inst: 'trumpet', gain: -5, pan: -0.08, send: 0.22 },
    mand: { inst: 'mandolin', gain: -8.2, pan: -0.32, send: 0.2 },
    hrn: { inst: 'horn', gain: -9, pan: -0.25, send: 0.3 },
    tbn: { inst: 'trombone', gain: -8.4, pan: 0.22, send: 0.2 },
    tuba: { inst: 'tuba', gain: -7.1, pan: 0, send: 0.06, hum: 0.5 },
    pizz: { inst: 'pizz', gain: -9.9, pan: 0.32, send: 0.15, hum: 0.5 },
    stab: { inst: 'strStab', gain: -12.5, pan: 0.28, send: 0.18, hum: 0.3 },
    str: { inst: 'strings', gain: -15.6, pan: 0, send: 0.3, hum: 0 },
    timp: { inst: 'timpani', gain: -8, pan: 0, send: 0.2, hum: 0 },
    cym: { inst: 'cymbal', gain: -11.4, pan: 0.3, send: 0.25, hum: 0 },
    snare: { inst: 'snare', gain: -5, pan: -0.1, send: 0.12, hum: 0.3 },
    tamb: { inst: 'tamb', gain: -3.2, pan: 0.36, send: 0.12, hum: 0.6 },
  },
  sections: {
    // PA chime, then the muzak vamp starts (not looped)
    intro: {
      bars: 4,
      chords: 'D6:6 | D6:6 | D6:6 | Em7:3 A9:3',
      parts: [
        mel('chm', `${CHIME} r:6 | r:6 |`, { vel: 0.72 }),
        mel('cel', `${CHIME} r:6 | r:6 |`, { vel: 0.5, oct: 1 }),
        mel('vib', 'r:6 | r:6 | r:6 | r:3 A5:1 B5 C#6 |', { vel: 0.72 }),
        pad('spad', { ...PADR, vel: 0.42, from: 2 }),
        comp('ep', EP_WALTZ, { ...COMP, vel: 0.5, from: 2 }),
        mel('sb', 'r:6 | r:6 | D2:3 A2 | E2:3 A1:2 C#2:1 |', { vel: 0.75 }),
        drums('hat', RIDE, HAT, { from: 2 }),
        drums('shk', SHK, SHAKE, { from: 2 }),
        drums('kick', 'k.....', KICK, { from: 2 }),
      ],
    },
    // MUZAK #1: vibes play strain B (D major)
    B: {
      bars: 8,
      chords: B_CH,
      parts: [
        mel('vib', B_MEL, { vel: 0.82, oct: 1 }),
        comp('ep', EP_WALTZ, { ...COMP, vel: 0.5 }),
        pad('spad', { ...PADR, vel: 0.42 }),
        mel('sb', SB_B, { vel: 0.78 }),
        drums('hat', RIDE, HAT),
        drums('shk', SHK, SHAKE),
        drums('kick', 'K.....|k.....', KICK),
        drums('clv', '......|....c.', CLV),
      ],
    },
    // MUZAK → CORRUPTION: strain C; at the B♭ chord the tape warps (the phrase's last note turns
    // into the warble), and D minor takes over an octave lower
    C: {
      bars: 8,
      chords: C_CH,
      parts: [
        mel('vib', C_MEL_1, { vel: 0.82, oct: 1 }),
        mel('warb', C_MEL_1_END, { vel: 0.85, oct: 1, at: 18 }),
        mel('warb', C_MEL_2, { vel: 0.85, at: 24 }),
        comp('ep', EP_WALTZ, { ...COMP, vel: 0.5, to: 4 }),
        pad('spad', { ...PADR, vel: 0.42, to: 3 }),
        cresc(pad('dpad', { ...DARK, vel: 0.55, from: 3 }), 0.5, 1),
        mel('sb', SB_C, { vel: 0.78 }),
        drums('hat', RIDE, HAT, { to: 3 }),
        drums('hat', TICK, HAT, { from: 3 }),
        drums('shk', SHK, SHAKE, { to: 3 }),
        drums('kick', 'K.....|k.....', KICK),
        hits('ratch', [[18, 60, 0.75]], 2),
        hits('whis', [[46, 60, 0.7]], 3),
      ],
    },
    // SINISTER: strain A in D minor — warble lead, creeping bassoon, orchestra hits
    A: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('warb', A_MEL, { vel: 0.92 }),
        mel('bsn', BSN_A, { vel: 0.8 }),
        pad('dpad', { ...DARK, vel: 0.5 }),
        cresc(pad('str', { lo: 'D3', hi: 'D4', n: 2, vel: 0.5, from: 4 }), 0.3, 1),
        // the hit sample is an octave-stacked unison: on A7♭9 it takes the leading tone C♯ (an A
        // stack would rub against the pads' ♭9 B♭3)
        hits('hit', [[0, 'D4', 0.75], [12, 'G3', 0.7], [24, 'Bb3', 0.75], [36, 'C#4', 0.8]]),
        hits('timp', [[0, 'D2', 0.6], [24, 'Bb2', 0.55], [36, 'A2', 0.55], [42, 'D2', 0.6]]),
        drums('kick', 'K.....|k.....', KICK),
        drums('hat', TICK, HAT),
        hits('whis', [[22, 60, 0.55]], 0),
        hits('ratch', [[46, 60, 0.6]], 1),
      ],
    },
    // THE ORCHESTRA PUSHES IN: the cellos take strain A, pizzicato + bassoon waltz; the robots
    // heckle in the held notes (bars 2, 4, 6)
    A1: {
      bars: 8,
      chords: A_CH,
      parts: [
        mel('vc', A_MEL, { vel: 0.9 }),
        mel('bsn', BSN_OOM, { vel: 0.8 }),
        comp('pizz', PAPA, { ...PAPAR, vel: 0.62 }),
        pad('dpad', { lo: 'D3', hi: 'D4', n: 2, vel: 0.45 }),
        arp('robo', ROBO_GAP, { lo: 'D5', hi: 'D6', vel: 0.5, n: 3, from: 1, to: 2 }),
        arp('robo', ROBO_GAP, { lo: 'D5', hi: 'D6', vel: 0.5, n: 3, from: 3, to: 4 }),
        arp('robo', ROBO_GAP, { lo: 'D5', hi: 'D6', vel: 0.56, n: 3, from: 5, to: 6 }),
        cresc(pad('str', { ...PADR, vel: 0.6, from: 6 }), 0.4, 1),
        hits('hit', [[0, 'D4', 0.8], [24, 'Bb3', 0.8]]),
        hits('timp', [[0, 'D2', 0.65], [24, 'Bb2', 0.6], ...TIMP_A_ROLL(0.4, 0.08)]),
        hits('snare', ROLL(0.36)),
        drums('kick', 'K.....|k.....', KICK),
        drums('hat', TICK, HAT),
        hits('whis', [[34, 60, 0.6]], 1),
      ],
    },
    // REFRAIN: the violins break through the muzak band, then the orchestra takes over (Gm → Dm)
    D: {
      bars: 8,
      chords: D_CH,
      parts: [
        mel('vln', D_MEL, { vel: 0.92 }),
        comp('ep', EP_WALTZ, { ...COMP, vel: 0.45, to: 4 }),
        mel('sb', SB_D, { vel: 0.75 }),
        drums('hat', RIDE, HAT, { to: 4 }),
        pad('str', { lo: 'E3', hi: 'E4', n: 3, vel: 0.45, to: 4 }),
        mel('tpt', D_MEL_2, { vel: 0.72, at: 24 }),
        mel('hrn', HRN_D_2, { vel: 0.62, at: 24 }),
        mel('tbn', TBN_D_2, { vel: 0.7, at: 24 }),
        mel('tuba', TUBA_D_2, { vel: 0.8, at: 24 }),
        comp('stab', PAPA, { ...PAPAR, vel: 0.7, from: 4 }),
        drums('tamb', TAMB_WALTZ, TAMB, { from: 4, vel: 0.85 }),
        hits('hit', [[24, 'G3', 0.85], [36, 'A3', 0.85]]),
        hits('timp', [[24, 'G2', 0.75], [30, 'A2', 0.6], [36, 'A2', 0.7], [42, 'D2', 0.8]]),
        hits('cym', [[24, 60, 0.8, 12]], 0),
        drums('kick', 'K.....', KICK),
        hits('ratch', [[46, 60, 0.7]], 1),
      ],
    },
    // PA chime (falling): snap back to the muzak
    chime: {
      bars: 2,
      chords: CHIME_CH,
      parts: [
        mel('chm', CHIME, { vel: 0.72 }),
        mel('cel', CHIME, { vel: 0.5, oct: 1 }),
        pad('spad', { ...PADR, vel: 0.38, from: 1 }),
        mel('sb', 'r:6 | r:2 A1:2 A1:1 C#2:1 |', { vel: 0.7 }),
        drums('hat', TICK, HAT, { vel: 0.7 }),
      ],
    },
    // the rising PA chime closes the loop
    chime2: {
      bars: 2,
      chords: CHIME_CH,
      parts: [
        mel('chm', CHIME_UP, { vel: 0.72 }),
        mel('cel', CHIME_UP, { vel: 0.5, oct: 1 }),
        pad('spad', { ...PADR, vel: 0.38, from: 1 }),
        mel('sb', 'r:6 | r:2 A1:2 A1:1 C#2:1 |', { vel: 0.7 }),
        drums('hat', TICK, HAT, { vel: 0.7 }),
      ],
    },
    // MUZAK RELAPSE: steel guitar lead at pitch (its sweet spot), celesta sparkle two octaves
    // up, low vibes comping
    B2: {
      bars: 8,
      chords: B2_CH,
      parts: [
        mel('sgtr', B_MEL, { vel: 0.88 }),
        mel('cel', B_MEL, { vel: 0.5, oct: 2, minDur: 4 }),
        comp('vibC', VIB_COMP, { ...COMP_B2, vel: 0.46, to: 7 }),
        comp('vibC', VIB_PUSH, { ...COMP_B2, vel: 0.46, from: 7 }),
        pad('spad', { ...PAD_B2, vel: 0.42 }),
        mel('sb', SB_B2, { vel: 0.78 }),
        drums('hat', RIDE, HAT),
        drums('hatO', '......|.....o', OPEN),
        drums('shk', SHK, SHAKE),
        drums('kick', 'K.....|k.....', KICK),
        drums('clv', '..c...|c...c.', CLV),
        hits('whis', [[46, 60, 0.6]], 2),
      ],
    },
    // CORRUPTION #2: e-piano lead; on the B♭ an orchestra hit, the phrase's last note warps into
    // the warble, and staccato bassoon two octaves below creeps along with the minor phrase
    C2: {
      bars: 8,
      chords: C_CH,
      parts: [
        mel('epL', C_MEL_1, { vel: 0.85, oct: 1 }),
        mel('warb', C_MEL_1_END, { vel: 0.85, oct: 1, at: 18 }),
        mel('warb', C_MEL_2, { vel: 0.85, at: 24 }),
        mel('bsn', C_MEL_1_END + C_MEL_2, { vel: 0.66, at: 18, oct: -2, gate: 0.45 }),
        comp('vibC', VIB_COMP, { ...COMP, vel: 0.42, to: 4 }),
        pad('spad', { ...PADR, vel: 0.42, to: 3 }),
        pad('dpad', { ...DARK, vel: 0.55, from: 3 }),
        mel('sb', SB_C, { vel: 0.8 }),
        // the warp hit doubles the tune's D (a B♭ stack would rub against the maj7 A3 of the pad)
        hits('hit', [[18, 'D4', 0.8]]),
        drums('hat', RIDE, HAT, { to: 3 }),
        drums('hat', TICK, HAT, { from: 3 }),
        drums('shk', SHK, SHAKE, { to: 3 }),
        drums('kick', 'K.....|k.....', KICK),
        hits('ratch', [[30, 60, 0.7]], 0),
        hits('timp', TIMP_A_ROLL(0.4, 0.07)),
        hits('snare', ROLL(0.36)),
      ],
    },
    // THE ORCHESTRA WINS: strain A as a Neapolitan street-band waltz; the robots' last heckles
    // in the held notes of bars 4 and 6 (the second one shorter, on beat 3)
    A2: {
      bars: 8,
      chords: A2_CH,
      parts: [
        mel('vln', A_MEL, { vel: 0.95, oct: 1 }),
        mel('tpt', A_MEL, { vel: 0.72 }),
        mel('hrn', HRN_A2, { vel: 0.62 }),
        mel('tuba', TUBA_A2, { vel: 0.82 }),
        comp('stab', PAPA, { ...PAPAR, vel: 0.7 }),
        drums('tamb', TAMB_WALTZ, TAMB),
        arp('robo', ROBO_GAP, { lo: 'D5', hi: 'D6', vel: 0.62, n: 3, from: 3, to: 4 }),
        arp('robo', ROBO_LAST, { lo: 'D5', hi: 'D6', vel: 0.62, n: 3, from: 5, to: 6 }),
        hits('timp', [[0, 'D2', 0.75], [18, 'D2', 0.6], [30, 'A2', 0.65], [36, 'A2', 0.7], [42, 'D2', 0.75]]),
        hits('cym', [[0, 60, 0.75, 12]], 0),
        hits('snare', ROLL(0.4)),
        drums('kick', 'K.....', KICK),
      ],
    },
    // TUTTI: the refrain with everyone — violins, mandolin, trumpet, horns, and the muzak band
    D2: {
      bars: 8,
      chords: D_CH,
      parts: [
        mel('vln', D_MEL, { vel: 0.92, oct: 1 }),
        mel('mand', D_MEL, { vel: 0.74, oct: 1, tremMin: 2 }),
        mel('tpt', D_MEL, { vel: 0.68 }),
        mel('hrn', HRN_D_1 + HRN_D_2, { vel: 0.6 }),
        mel('tbn', TBN_D_2, { vel: 0.72, at: 24 }),
        mel('tuba', TUBA_D_1 + TUBA_D_2, { vel: 0.7 }),
        comp('stab', PAPA, { ...PAPAR, vel: 0.62 }),
        drums('tamb', TAMB_WALTZ, TAMB),
        bass('sb', '1:2 r:4', { lo: 'D2', hi: 'D3', vel: 0.55 }),
        drums('hat', RIDE, HAT),
        drums('hatO', '......|.....o', OPEN),
        hits('hit', [[24, 'G3', 0.82], [36, 'A3', 0.82], [42, 'D4', 0.85]]),
        hits('timp', [[0, 'D2', 0.75], [24, 'G2', 0.8], [30, 'A2', 0.65], [36, 'A2', 0.75], [42, 'D2', 0.85]]),
        hits('cym', [[0, 60, 0.75, 12], [24, 60, 0.85, 12]], 0),
        drums('kick', 'K.....', KICK),
        hits('ratch', [[44, 60, 0.75]], 0),
        hits('whis', [[45, 60, 0.75]], 3),
      ],
    },
  },
  form: ['intro', 'B', 'C', 'A', 'A1', 'D', 'chime', 'B2', 'C2', 'A2', 'D2', 'chime2'],
  loopFrom: 1,
};
