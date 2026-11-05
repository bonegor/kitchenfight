/**
 * Tiny music DSL.
 *
 * Time is measured in *steps* (the song's grid unit, e.g. an eighth note in 6/8).
 *
 * Melody strings — whitespace-separated tokens, `|` = bar line (validated):
 *   A4        note (C4 = middle C)        C#5:2   duration in steps (sticky)
 *   A4+C5+E5  chord                       r:3     rest
 *   _:2       tie / extend previous note  {G5}F5  grace note(s) before the beat: {A5,G5}F5
 *   modifiers after the pitch: ! accent, ? soft, ' staccato, ~ tremolo (plucked) / long vibrato,
 *   * mordent (main-upper-main), @0.7 explicit velocity
 *
 * Chord strings: 'Am:6 | E7:6 | Bb/D:3 E7:3'  (durations sticky, slash = bass note)
 *
 * Accompaniment patterns (repeat every cycle over the section, read the chord at each hit):
 *   bass(): degrees 1 3 5 7 8 (octave) 5- (fifth below) b (slash bass) a (approach to next root)
 *   comp(): c (voiced chord) C (accented chord) r (rest)
 *   arp():  0..5 = chord tone index (low→high, wraps up an octave)
 *   drums(): one char per step, mapped to hits; '.' = rest
 */
import { type Chord, noteToMidi, parseChord, placeInRange, scalePcs, upperNeighbour, voiceChord } from './theory';
import type { ReverbOpts } from './reverb';
import { hashStr, Rng } from './dsp';

export interface Ev {
  s: number; // start, steps (relative to section)
  d: number; // duration, steps
  m: number; // midi
  v: number; // velocity 0..~1.3
  ch: string; // channel id
  vr?: number; // explicit sample variant
  trem?: boolean; // tremolo (re-plucked)
  gate?: number; // gate fraction override
  pan?: number; // pan offset
  grace?: boolean; // grace note: duration given in seconds via graceSec
  graceSec?: number;
  offSec?: number; // time offset in seconds (strums, graces)
}

export interface SectionCtx {
  name: string;
  bars: number;
  barSteps: number;
  steps: number;
  stepSec: number;
  chords: Array<{ s: number; d: number; c: Chord }>;
  chordAt(step: number): Chord;
  nextChordAfter(step: number): Chord;
  scale: number[];
  warn(msg: string): void;
}

export type Part = (ctx: SectionCtx) => Ev[];

export interface SectionDef {
  bars: number;
  chords?: string;
  parts: Part[];
}

export interface ChannelDef {
  inst: string;
  gain: number; // dB
  pan?: number;
  send?: number; // reverb send 0..1
  hum?: number; // humanize scale (default 1)
}

export interface SongDef {
  id: string;
  bpm: number;
  stepsPerBeat: number;
  barSteps: number;
  swing?: number;
  scale: string;
  channels: Record<string, ChannelDef>;
  sections: Record<string, SectionDef>;
  form: string[];
  /** index into form where the loop starts; null = one-shot */
  loopFrom: number | null;
  reverb: ReverbOpts;
  /** master gain in dB (calibrated for consistent loudness) */
  gainDb: number;
  /** timing humanize in seconds (default 0.004) */
  humanize?: number;
  /** one-shot tail in seconds (default 2.5) */
  tail?: number;
  /** pre-roll silence (s) before the first note (one-shots) */
}

// ---------------------------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------------------------

function parseDur(s: string): number {
  if (s.includes('/')) {
    const [a, b] = s.split('/');
    return parseFloat(a) / parseFloat(b);
  }
  return parseFloat(s);
}

const MEL_TOK =
  /^(\{[^}]*\})?((?:[A-Ga-g][#b]*-?\d)(?:\+[A-Ga-g][#b]*-?\d)*|r|_)([!?'~*]*)(?::([\d./]+))?(?:@([\d.]+))?$/;

export interface MelOpts {
  vel?: number;
  oct?: number;
  tr?: number;
  gate?: number;
  /** start offset in steps */
  at?: number;
  /** pan offset */
  pan?: number;
  /** velocity applied to graces (fraction of main) */
  graceVel?: number;
  /** skip bar validation */
  free?: boolean;
  /** notes at least this long (steps) get tremolo */
  tremMin?: number;
  /** keep only notes at least this long (steps) */
  minDur?: number;
  /** drop grace notes / mordents */
  plain?: boolean;
}

/** Parse a melody string into events (relative steps). */
export function parseMelody(ch: string, str: string, ctx: SectionCtx, o: MelOpts = {}): Ev[] {
  const out: Ev[] = [];
  let t = o.at ?? 0;
  let dur = 1;
  let barStart = t;
  let last: Ev[] = [];
  const vel = o.vel ?? 0.8;
  const shift = (o.oct ?? 0) * 12 + (o.tr ?? 0);
  const graceSec = 0.048;
  for (const tok of str.replace(/\|/g, ' | ').split(/\s+/)) {
    if (!tok) continue;
    if (tok === '|') {
      if (!o.free && Math.abs(t - barStart - ctx.barSteps) > 1e-6) ctx.warn(`${ch}: bar has ${t - barStart} steps (expected ${ctx.barSteps}) near "${str.slice(0, 40)}…" at step ${t}`);
      barStart = t;
      continue;
    }
    const m = MEL_TOK.exec(tok);
    if (!m) {
      ctx.warn(`${ch}: bad token "${tok}"`);
      continue;
    }
    const [, graces, body, mods, durS, velS] = m;
    if (durS) dur = parseDur(durS);
    if (body === 'r') {
      last = [];
      t += dur;
      continue;
    }
    if (body === '_') {
      for (const e of last) e.d += dur;
      t += dur;
      continue;
    }
    let v = velS ? parseFloat(velS) : vel;
    if (mods.includes('!')) v *= 1.25;
    if (mods.includes('?')) v *= 0.7;
    const gate = mods.includes("'") ? 0.45 : o.gate;
    const trem = mods.includes('~');
    const notes = body.split('+').map((n) => noteToMidi(n) + shift);
    const plain = !!(o.plain || o.minDur);
    if (graces && !plain) {
      const gs = graces
        .slice(1, -1)
        .split(',')
        .filter(Boolean)
        .map((n) => noteToMidi(n.trim()) + shift);
      gs.forEach((gm, i) => {
        out.push({ s: t, d: 0, m: gm, v: v * (o.graceVel ?? 0.75), ch, grace: true, graceSec, offSec: -graceSec * (gs.length - i), pan: o.pan });
      });
    }
    last = [];
    if (mods.includes('*') && !plain) {
      const mainM = notes[0];
      const up = upperNeighbour(mainM, ctx.scale);
      out.push({ s: t, d: 0, m: mainM, v, ch, grace: true, graceSec: graceSec * 0.8, pan: o.pan });
      out.push({ s: t, d: 0, m: up, v: v * 0.85, ch, grace: true, graceSec: graceSec * 0.8, offSec: graceSec * 0.8, pan: o.pan });
      const e: Ev = { s: t, d: dur, m: mainM, v, ch, gate, trem, offSec: graceSec * 1.6, pan: o.pan };
      out.push(e);
      last.push(e);
    } else {
      for (const nm of notes) {
        const e: Ev = { s: t, d: dur, m: nm, v, ch, gate, trem, pan: o.pan };
        out.push(e);
        last.push(e);
      }
    }
    t += dur;
  }
  if (!o.free && Math.abs(t - barStart) > 1e-6 && Math.abs(t - barStart - ctx.barSteps) > 1e-6)
    ctx.warn(`${ch}: trailing bar has ${t - barStart} steps (expected ${ctx.barSteps})`);
  let res = out;
  if (o.minDur) res = res.filter((e) => e.d >= (o.minDur as number));
  if (o.tremMin) for (const e of res) if (!e.grace && e.d >= o.tremMin) e.trem = true;
  return res;
}

export function parseChords(str: string): Array<{ s: number; d: number; c: Chord }> {
  const out: Array<{ s: number; d: number; c: Chord }> = [];
  let t = 0;
  let dur = 1;
  for (const tok of str.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [sym, ds] = tok.split(':');
    if (ds) dur = parseDur(ds);
    out.push({ s: t, d: dur, c: parseChord(sym) });
    t += dur;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Part constructors
// ---------------------------------------------------------------------------------------------

/** Melody part. */
export const mel =
  (ch: string, str: string, o: MelOpts = {}): Part =>
  (ctx) =>
    parseMelody(ch, str, ctx, o);

export interface PatOpts {
  vel?: number;
  lo?: number | string;
  hi?: number | string;
  /** strum spread in seconds (low→high) */
  strum?: number;
  gate?: number;
  /** only from/to bar (inclusive start, exclusive end) */
  from?: number;
  to?: number;
  /** voices for comp */
  n?: number;
  pan?: number;
  /** accent velocity multiplier per step-in-bar (e.g. downbeats) */
  accent?: Record<number, number>;
  vr?: number;
}

const toMidi = (x: number | string | undefined, def: number): number => (x === undefined ? def : typeof x === 'number' ? x : noteToMidi(x));

interface PatTok {
  sym: string;
  d: number;
  mods: string;
}
function parsePattern(str: string): { toks: PatTok[]; len: number } {
  const toks: PatTok[] = [];
  let dur = 1;
  let len = 0;
  for (const tok of str.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const m = /^([^:!?']+)([!?']*)(?::([\d./]+))?$/.exec(tok);
    if (!m) continue;
    if (m[3]) dur = parseDur(m[3]);
    toks.push({ sym: m[1], d: dur, mods: m[2] });
    len += dur;
  }
  return { toks, len };
}

function patRange(ctx: SectionCtx, o: PatOpts): [number, number] {
  const from = (o.from ?? 0) * ctx.barSteps;
  const to = Math.min(ctx.steps, (o.to ?? ctx.bars) * ctx.barSteps);
  return [from, to];
}

/** Walk a repeating pattern over the section, calling fn for each non-rest token. */
function walk(ctx: SectionCtx, str: string, o: PatOpts, fn: (tok: PatTok, s: number, chord: Chord, v: number) => void): void {
  const { toks, len } = parsePattern(str);
  if (!len) return;
  const [from, to] = patRange(ctx, o);
  let t = from;
  let i = 0;
  const vel = o.vel ?? 0.75;
  while (t < to - 1e-9) {
    const tok = toks[i % toks.length];
    if (tok.sym !== 'r' && tok.sym !== '.') {
      let v = vel;
      if (tok.mods.includes('!')) v *= 1.25;
      if (tok.mods.includes('?')) v *= 0.7;
      const inBar = Math.round((t % ctx.barSteps) * 1000) / 1000;
      if (o.accent && o.accent[inBar] !== undefined) v *= o.accent[inBar];
      fn(tok, t, ctx.chordAt(t), v);
    }
    t += tok.d;
    i++;
  }
}

/** Bass line from chord degrees. */
export const bass =
  (ch: string, pattern: string, o: PatOpts = {}): Part =>
  (ctx) => {
    const lo = toMidi(o.lo, 36);
    const hi = toMidi(o.hi, 52);
    const out: Ev[] = [];
    let prevRoot: number | undefined;
    walk(ctx, pattern, o, (tok, s, c, v) => {
      const root = placeInRange(c.bass, lo, hi - 7 >= lo ? hi - 5 : hi, prevRoot);
      prevRoot = root;
      let m: number;
      const third = c.ivs.includes(3) ? 3 : 4;
      const sev = c.ivs.includes(10) ? 10 : c.ivs.includes(11) ? 11 : 10;
      switch (tok.sym) {
        case '1':
        case 'b':
          m = root;
          break;
        case '3':
          m = root + third;
          break;
        case '5':
          m = root + 7 <= hi ? root + 7 : root - 5;
          break;
        case '5-':
          m = root - 5 >= lo - 5 ? root - 5 : root + 7;
          break;
        case '7':
          m = root + sev;
          break;
        case '8':
          m = root + 12;
          break;
        case 'a': {
          // chromatic approach to the next chord's bass from below
          const nx = ctx.nextChordAfter(s);
          const target = placeInRange(nx.bass, lo, hi, root);
          m = target - 1;
          break;
        }
        default:
          try {
            m = noteToMidi(tok.sym);
          } catch {
            ctx.warn(`bass: bad symbol ${tok.sym}`);
            return;
          }
      }
      out.push({ s, d: tok.d, m, v, ch, gate: tok.mods.includes("'") ? 0.45 : o.gate, vr: o.vr });
    });
    return out;
  };

/** Chord comping (stabs/strums) with voice leading. */
export const comp =
  (ch: string, pattern: string, o: PatOpts = {}): Part =>
  (ctx) => {
    const lo = toMidi(o.lo, 55);
    const hi = toMidi(o.hi, 72);
    const out: Ev[] = [];
    let prev: number[] | null = null;
    let prevSym = '';
    let voicing: number[] = [];
    walk(ctx, pattern, o, (tok, s, c, v) => {
      if (c.sym !== prevSym) {
        voicing = voiceChord(c, lo, hi, prev, o.n);
        prev = voicing;
        prevSym = c.sym;
      }
      const vv = tok.sym === 'C' ? v * 1.2 : v;
      voicing.forEach((m, i) => {
        out.push({ s, d: tok.d, m, v: vv * (i === 0 ? 0.92 : 1), ch, offSec: (o.strum ?? 0) * i, gate: tok.mods.includes("'") ? 0.45 : o.gate, pan: o.pan, vr: o.vr });
      });
    });
    return out;
  };

/** Arpeggio through the voiced chord. */
export const arp =
  (ch: string, pattern: string, o: PatOpts = {}): Part =>
  (ctx) => {
    const lo = toMidi(o.lo, 52);
    const hi = toMidi(o.hi, 72);
    const out: Ev[] = [];
    let prev: number[] | null = null;
    let prevSym = '';
    let voicing: number[] = [];
    walk(ctx, pattern, o, (tok, s, c, v) => {
      if (c.sym !== prevSym) {
        voicing = voiceChord(c, lo, hi, prev, o.n ?? 3);
        prev = voicing;
        prevSym = c.sym;
      }
      const idx = parseInt(tok.sym, 10);
      if (Number.isNaN(idx)) return;
      const vs = voicing.slice().sort((a, b) => a - b);
      const m = vs[idx % vs.length] + 12 * Math.floor(idx / vs.length);
      out.push({ s, d: tok.d, m, v, ch, gate: tok.mods.includes("'") ? 0.45 : o.gate, pan: o.pan, vr: o.vr });
    });
    return out;
  };

/** Sustained chords following the chord track (re-voiced with voice leading). */
export const pad =
  (ch: string, o: PatOpts & { every?: number } = {}): Part =>
  (ctx) => {
    const lo = toMidi(o.lo, 55);
    const hi = toMidi(o.hi, 76);
    const out: Ev[] = [];
    let prev: number[] | null = null;
    const [from, to] = patRange(ctx, o);
    for (const span of ctx.chords) {
      const s0 = Math.max(span.s, from);
      const s1 = Math.min(span.s + span.d, to);
      if (s1 <= s0) continue;
      const voicing = voiceChord(span.c, lo, hi, prev, o.n);
      prev = voicing;
      const every = o.every ?? s1 - s0;
      for (let s = s0; s < s1 - 1e-9; s += every) {
        const d = Math.min(every, s1 - s);
        for (const m of voicing) out.push({ s, d, m, v: o.vel ?? 0.6, ch, gate: o.gate ?? 1, pan: o.pan, vr: o.vr });
      }
    }
    return out;
  };

export interface HitMap {
  [ch: string]: { v?: number; vr?: number | number[]; m?: number | string; d?: number };
}

/** Drum pattern: one char per step (spaces and '|' ignored), repeated over the section. */
export const drums =
  (ch: string, pattern: string, map: HitMap, o: { from?: number; to?: number; vel?: number; stepDiv?: number } = {}): Part =>
  (ctx) => {
    const chars = pattern.replace(/[\s|]/g, '');
    if (!chars.length) return [];
    const div = o.stepDiv ?? 1; // chars per step
    const from = (o.from ?? 0) * ctx.barSteps;
    const to = Math.min(ctx.steps, (o.to ?? ctx.bars) * ctx.barSteps);
    const out: Ev[] = [];
    const total = Math.round((to - from) * div);
    const rr: Record<string, number> = {};
    for (let i = 0; i < total; i++) {
      const c = chars[i % chars.length];
      const h = map[c];
      if (!h) continue;
      const m = h.m === undefined ? 60 : typeof h.m === 'number' ? h.m : noteToMidi(h.m);
      let vr: number | undefined;
      if (Array.isArray(h.vr)) {
        const k = rr[c] ?? 0;
        vr = h.vr[k % h.vr.length];
        rr[c] = k + 1;
      } else vr = h.vr;
      out.push({ s: from + i / div, d: h.d ?? 1 / div, m, v: (h.v ?? 0.8) * (o.vel ?? 1), ch, vr });
    }
    return out;
  };

/** Explicit hits: [step, midi|note, vel?, dur?] */
export const hits =
  (ch: string, list: Array<[number, number | string, number?, number?]>, vr?: number): Part =>
  () =>
    list.map(([s, m, v, d]) => ({ s, d: d ?? 1, m: typeof m === 'number' ? m : noteToMidi(m), v: v ?? 0.8, ch, vr }));

/**
 * Harmony voice for a melody string: chord tones move to the next chord tone a third below
 * (or a sixth below when the nearest is a fourth), passing tones move a diatonic third down.
 */
export const harm =
  (ch: string, str: string, o: MelOpts & { sixth?: boolean } = {}): Part =>
  (ctx) =>
    parseMelody(ch, str, ctx, o).map((e) => ({ ...e, m: harmNote(e.m, ctx.chordAt(e.s), ctx.scale, !!o.sixth) }));

const pcm = (x: number): number => ((x % 12) + 12) % 12;
export function harmNote(m: number, c: Chord, scale: number[], sixth: boolean): number {
  const pcs = c.pcs;
  if (pcs.includes(pcm(m))) {
    if (!sixth) for (let d = 3; d <= 4; d++) if (pcs.includes(pcm(m - d))) return m - d;
    for (let d = 8; d <= 9; d++) if (pcs.includes(pcm(m - d))) return m - d;
    for (let d = 3; d <= 9; d++) if (pcs.includes(pcm(m - d))) return m - d;
  }
  const set = new Set<number>(scale.filter((p) => !pcs.some((q) => Math.abs(q - p) === 1 && !scale.includes(q))));
  for (const p of pcs) set.add(p);
  let x = m;
  let count = 0;
  const steps = sixth ? 5 : 2;
  while (count < steps && x > m - 12) {
    x--;
    if (set.has(pcm(x))) count++;
  }
  return x;
}

/** Transform helpers */
export const withVel =
  (p: Part, k: number): Part =>
  (ctx) =>
    p(ctx).map((e) => ({ ...e, v: e.v * k }));
export const onCh =
  (p: Part, ch: string): Part =>
  (ctx) =>
    p(ctx).map((e) => ({ ...e, ch }));
export const transpose =
  (p: Part, semis: number): Part =>
  (ctx) =>
    p(ctx).map((e) => ({ ...e, m: e.m + semis }));
/** Crescendo across the section (velocity scaled from a to b). */
export const cresc =
  (p: Part, a: number, b: number): Part =>
  (ctx) =>
    p(ctx).map((e) => ({ ...e, v: e.v * (a + (b - a) * (e.s / ctx.steps)) }));

// ---------------------------------------------------------------------------------------------
// Song compiler
// ---------------------------------------------------------------------------------------------

export interface TimedEv {
  t: number; // seconds
  d: number; // seconds (gate)
  m: number;
  v: number;
  ch: string;
  vr: number; // -1 = round robin
  pan: number;
  /** index into the song form this event came from */
  fi: number;
}

export interface CompiledSong {
  events: TimedEv[];
  /** seconds */
  loopStart: number;
  loopEnd: number;
  end: number;
  warnings: string[];
  stepSec: number;
}

export function makeCtx(song: SongDef, name: string, warnings: string[]): SectionCtx {
  const sec = song.sections[name];
  const steps = sec.bars * song.barSteps;
  const chords = sec.chords ? parseChords(sec.chords) : [{ s: 0, d: steps, c: parseChord('C') }];
  const total = chords.reduce((a, c) => a + c.d, 0);
  if (sec.chords && Math.abs(total - steps) > 1e-6) warnings.push(`[${song.id}/${name}] chords span ${total} steps, section has ${steps}`);
  const chordAt = (s: number): Chord => {
    for (let i = chords.length - 1; i >= 0; i--) if (s + 1e-9 >= chords[i].s) return chords[i].c;
    return chords[0].c;
  };
  const nextChordAfter = (s: number): Chord => {
    const cur = chordAt(s);
    for (const c of chords) if (c.s > s + 1e-9 && c.c !== cur) return c.c;
    return chords[0].c;
  };
  return {
    name,
    bars: sec.bars,
    barSteps: song.barSteps,
    steps,
    stepSec: 60 / (song.bpm * song.stepsPerBeat),
    chords,
    chordAt,
    nextChordAfter,
    scale: scalePcs(song.scale),
    warn: (msg) => warnings.push(`[${song.id}/${name}] ${msg}`),
  };
}

export function compileSong(song: SongDef, inst: { gate(ch: string): number; plucked(ch: string): boolean }): CompiledSong {
  const warnings: string[] = [];
  const stepSec = 60 / (song.bpm * song.stepsPerBeat);
  const sw = song.swing ?? 0;
  const stepToSec = (s: number): number => {
    if (!sw) return s * stepSec;
    const pair = Math.floor(s / 2);
    const p = s - pair * 2;
    const w = p < 1 ? p * (1 + sw) : 1 + sw + (p - 1) * (1 - sw);
    return (pair * 2 + w) * stepSec;
  };
  const hum = song.humanize ?? 0.004;
  const events: TimedEv[] = [];
  const secCache = new Map<string, Ev[]>();
  let pos = 0;
  let loopStart = 0;
  song.form.forEach((name, fi) => {
    const sec = song.sections[name];
    if (!sec) {
      warnings.push(`[${song.id}] unknown section ${name}`);
      return;
    }
    if (song.loopFrom === fi) loopStart = stepToSec(pos);
    let evs = secCache.get(name);
    if (!evs) {
      const ctx = makeCtx(song, name, warnings);
      evs = [];
      for (const p of sec.parts) evs.push(...p(ctx));
      secCache.set(name, evs);
    }
    const rng = new Rng(hashStr(song.id + '/' + name));
    for (const e of evs) {
      const chDef = song.channels[e.ch];
      if (!chDef) {
        warnings.push(`[${song.id}/${name}] unknown channel ${e.ch}`);
        continue;
      }
      const h = hum * (chDef.hum ?? 1);
      const jitter = rng.bi() * h;
      const vj = 1 + rng.bi() * 0.05 * (chDef.hum ?? 1);
      const start = stepToSec(pos + e.s);
      if (e.grace) {
        events.push({ t: start + (e.offSec ?? 0) + jitter, d: e.graceSec ?? 0.05, m: e.m, v: e.v * vj, ch: e.ch, vr: e.vr ?? -1, pan: e.pan ?? 0, fi });
        continue;
      }
      const endT = stepToSec(pos + e.s + e.d);
      const gate = e.gate ?? inst.gate(e.ch);
      const off = e.offSec ?? 0;
      const durSec = Math.max(0.02, (endT - start) * gate - Math.max(0, off));
      if (e.trem && inst.plucked(e.ch)) {
        // tremolo picking at ~13.5 Hz locked to the grid
        const per = Math.max(1, Math.round(13.5 * stepSec));
        const n = Math.max(1, Math.round((e.d * per)));
        for (let k = 0; k < n; k++) {
          const ts = stepToSec(pos + e.s + k / per);
          const te = stepToSec(pos + e.s + (k + 1) / per);
          const last = k === n - 1;
          events.push({
            t: ts + off + jitter * 0.5 + (k % 2 ? 0.004 : 0),
            d: last ? Math.max(0.03, durSec - (ts - start)) : te - ts,
            m: e.m,
            v: e.v * vj * (k % 2 ? 0.78 : 0.95) * (0.97 + 0.06 * rng.next()),
            ch: e.ch,
            vr: k % 2,
            pan: e.pan ?? 0,
            fi,
          });
        }
        continue;
      }
      events.push({ t: start + off + jitter, d: durSec, m: e.m, v: e.v * vj, ch: e.ch, vr: e.vr ?? -1, pan: e.pan ?? 0, fi });
    }
    pos += sec.bars * song.barSteps;
  });
  const end = stepToSec(pos);
  events.sort((a, b) => a.t - b.t);
  return { events, loopStart, loopEnd: end, end, warnings, stepSec };
}
