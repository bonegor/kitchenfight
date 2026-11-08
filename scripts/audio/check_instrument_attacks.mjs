#!/usr/bin/env node
/**
 * Attack timing and note-on checks of every zone of every sample set, through the REAL sampler
 * (src/audio/sampled.ts; MP3s decoded with ffmpeg and installed like the music worker does).
 * Each zone is played at its own root (its own layer / round robin) at 48 kHz, dry, and measured
 * relative to the sample's onset (`pre`, the sample the mixer puts on the beat), on what a centred
 * note plays: the mono sum of the output channels (mono sets with `width` sum two takes):
 *
 *   att10   time from the beat to where the RMS over the preceding 5 ms (the ear's temporal integration)
 *           first comes within 10 dB of its maximum over the first 0.5 s. This is what "the note
 *           sounds on the beat" means — a low-threshold detector (-30 dB) is fooled by pick / hammer /
 *           handling noise that recordings carry tens of ms before the real attack.
 *   sus6    sustained instruments: time from the beat to -6 dB of the early-sustain level
 *           (median 10 ms RMS over 0.3..1.0 s): how soon a short note speaks.
 *   head    first output sample relative to the note's RMS over its first 300 ms (dB): a sample that
 *           starts mid-sound without a fade-in steps up from silence (a click).
 *   hfOn    energy above 6 kHz in the first 2 ms vs. 50..150 ms later (dB): a note-on HF burst.
 *           Graded only for sustained (bowed / blown / sung) zones, where a burst is a click.
 *
 *   attShort  notes that start on their own onset when gated short (Sample.preAt: strStab, whose
 *           spread attack keeps rising, and the sustained instruments, whose slow attack does), 40 / 60 /
 *           100 ms notes as the mixer plays them (gate, then the release; a sustained note's gate counts from
 *           its gate anchor Sample.ga): strStab's att10; for a sustained note, how far Sample.preAt is from the
 *           short-note rule re-implemented on the gated note itself (shortRule below: an independent check of
 *           the runtime's tables) — and, reported (attShortPlain), the plain whole-note rule on the gated note,
 *           which jumps across plateaus.
 *   onset   sustained instruments: the perceptual onset (scripts/audio/instrument_dsp.py
 *           perceptual_onset, as sampled.ts perceptualOnset implements it): att10 measured over max(5 ms,
 *           one period), at most 15 ms after the -15 dB point (a slow climb), or — for a note whose envelope
 *           dwells below -10 dB after a real attack (where att10 lands on the crescendo) — 7.5 ms after that
 *           attack crosses -15 dB, blended in by how slow the climb and how steep the attack is. `dw` = that
 *           blend (0 = the first rule). att10 is reported beside it.
 *
 * Every playable note (sustained sets, --no-notes to skip): each zone played at every pitch of its key range
 * (layer, round robin and the partner take as a song plays them), measured on what plays:
 *   onset   the perceptual onset relative to the beat the runtime put it on (a single take keeps its
 *           zone's beat mapped through the playback ratio; two takes summed are placed on their sum's
 *           onset within 25 ms) — reported, and over 30 ms flagged;
 *   t15     an independent onset: where the envelope (max(5 ms, one period), lag-matched to the 5 ms
 *           window) first comes within 15 dB of its maximum over the same stretch of the recording as at
 *           the root (0.5 s / the playback ratio), relative to the beat. Neighbouring pitches of one zone
 *           (and one partner take) play the same attack a little faster or slower: their t15 must agree
 *           within 5 ms (a beat that jumps between semitones is a defect).
 *
 * Sustained instruments as the songs play them (every sustained id: tone-filtered voicings and two takes summed
 * too), every playable note gated at 0.1 / 0.2 / 0.4 / 0.8 s and mixed as render.ts mixes it (Sample.preAt, the
 * gate from Sample.ga, the release), measured on what a centred note plays as the verification harness does:
 * t20 / t15 / t10 / t6 = where the trailing mean square over max(5 ms, one period) first comes within 20 / 15 /
 * 10 / 6 dB of its maximum over the note's first 0.5 s after the beat, re the beat:
 *   one zone      neighbouring semitones of one zone and partner: every crossing moved the same way by more than
 *                 8 ms is a placement jump;
 *   other zones   neighbouring semitones from different zones (or partner takes): the part of their -15 / -10 dB
 *                 disagreement a placement could remove — max(|d15|, |d10|) - |d15 - d10| / 2 (the rest is the
 *                 recordings' attack shapes; > 8 ms counted) — or |d15| where a note creeps from -15 to -10 dB
 *                 over more than 30 ms (a plateau under -10 dB: its -10 dB crossing is not where it is heard);
 *                 and every crossing (t20 / t15 / t10 / t6) moved the same way (a placement shift whatever the
 *                 shapes), at the same limit;
 *   gated scan    Sample.preAt of every note (full articulation) for gates 40..495 ms in 5 ms steps: the onset
 *                 of notes 5 ms apart in length (a note 5 ms longer at most 5 ms later in the sample: it never
 *                 ends earlier), across 0.5 s, monotone in the gate, never later in the sample than a whole
 *                 note's, a 1 s note on the whole note's beat;
 *   two takes     the sustained sets that sum two takes (width), from debugTakes: what plays (their coherent sum)
 *                 against their power sum (the takes' envelopes added, no interference): its largest deficit over
 *                 the attack (the beat to 50 ms after it, or to the power sum's -3 dB point if sooner), and how
 *                 much later it crosses -10 dB (both climbing from -15 to -10 dB within 30 ms) and -6 dB (the
 *                 power sum climbing from -10 to -6 dB within 40 ms) than the power sum;
 *   pad chords    organ, choir, choirO, strings, accChord: triads (m, m+4, m+7), (m, m+3, m+7) and (m, m+7, m+12)
 *                 from those notes, spread of the tones' -15 dB crossings and of the -10 dB crossings of the tones
 *                 that do not creep (median / p90 / max).
 * The songs as render.ts schedules them (compileSong events, every sampled sustained voice, each note mixed as
 * render.ts mixes it):
 *   chords        notes of one channel starting within 12 ms: the spread of the tones' -15 dB crossings (every
 *                 tone), -10 dB crossings (tones that climb there from -15 dB within 50 ms) and -6 dB crossings
 *                 (within 80 ms; not graded for the organ, whose bass pipes speak 50 ms after its treble ones);
 *   entries       sustained notes whose pre-roll starts before t = 0 (render.ts fades them in from the buffer
 *                 start): energy above 6 kHz in their first 2 ms re 50..150 ms later.
 *
 * Limits: plucked / struck zones (decay / oneshot sets with a transient attack) |att10| <= 5 ms;
 * section articulations (strStab, pizz, orchHit: spread attack, beat on the perceptual onset)
 * -10..+10 ms, attShort |.| <= 5 ms; sustained zones at their roots |onset| <= 8 ms (single takes: the
 * bank's beat, build_instruments.sustain_beat, read back through the runtime) or 33 ms (two takes
 * summed: the 25 ms the runtime corrects their beat by at most, plus those 8 ms; not graded where a take
 * dwells — its attack, not the sum's -10 dB point, is where it is heard), attShort |.| <= 3 ms (LIM_SHORT),
 * sus6 <= 160 ms (bowed strings / chorus) or 90 ms (the rest), head <= -30 dB, hfOn <= +6 dB; every playable
 * note of a single take |onset| <= 30 ms and neighbouring t15 within 5 ms (two takes summed: reported). At song
 * lengths (LIM below): one-zone jumps 8 ms; other zones 16 ms (22 where a note creeps), single takes and two
 * takes summed alike; gated scan steps 5 ms per 5 ms, 0.495 -> 0.5 s 5 ms; two takes: attack deficit 8 dB, -10 /
 * -6 dB at most 15 / 20 ms after the power sum; pad chords at -15 dB 10 / 20 / 30 ms, at -10 dB 6 / 20 / 30 ms;
 * the songs' chords at -15 / -10 / -6 dB p90 22 / 25 / 32 ms (channels with 5 chords or more), max 25 / 35 / 40
 * ms (the dry accordion's chords can be kept together at one level only — its low reeds climb from -15 to -6 dB
 * in 45-75 ms, its high ones in 15 — and are balanced across them: SampledSpec.balance); first-bar entries HF
 * <= 0 dB.
 *
 *   node scripts/audio/check_instrument_attacks.mjs [--only set,set] [--json FILE] [--verbose]
 * Exit code 1 when a zone is over a limit.
 */
import fs from 'fs';
import { installBank, loadAudio } from './render-song.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const ONLY = opt('--only', '');
const JSON_OUT = opt('--json', '');
const VERBOSE = args.includes('--verbose');
const NO_NOTES = args.includes('--no-notes');
const SR = 48000;

// attack model per set (mirrors scripts/audio/build_instruments.py: 'perceptual' sets put the beat on the
// -10 dB point of a spread attack; sustained sets on the perceptual onset of what plays, also graded on how
// soon they speak)
const PERCEPTUAL = new Set(['strstab', 'pizz', 'orchhit']);
// swelling articulations (rolls, tam-tam bloom, flexatone, whistles, shakers): the beat is the start
// of the swell (built at -20 dB), their peak comes later by nature — reported, not graded on att10
const SWELL = (set, z) =>
  ['tamtam', 'flexatone', 'ratchet', 'toywhistle', 'vibraslap', 'shaker'].includes(set) ||
  (set === 'tamb' && z.r >= 6) ||
  ((set === 'cymbal' || set === 'bassdrum') && z.r === 1);
const SLOW_SUSTAIN = new Set(['strings', 'violin', 'cello', 'contrabass', 'choir', 'horns']);
/** sustained short notes: Sample.preAt within this (ms) of the short-note rule applied to the gated note itself */
const LIM_SHORT = 3;

const A = await loadAudio();
installBank(A);
const bySet = new Map();
for (const spec of A.SAMPLED_SPECS) if (!bySet.has(spec.set) && !spec.lp && !spec.hp) bySet.set(spec.set, spec);
// a set only tone-filtered voicings play (the dry accordion): graded through the first of them
for (const spec of A.SAMPLED_SPECS) if (!bySet.has(spec.set)) bySet.set(spec.set, spec);

const frames = (x, at, n, len) => {
  // RMS of 1 ms frames [at + k*n, at + (k+1)*n)
  const out = [];
  for (let k = 0; k < len; k++) {
    const a = at + k * n;
    let s = 0;
    let c = 0;
    for (let i = a; i < a + n; i++) {
      if (i < 0 || i >= x.length) continue;
      s += x[i] * x[i];
      c++;
    }
    out.push(c ? Math.sqrt(s / c) : 0);
  }
  return out;
};
const db = (v) => 20 * Math.log10(v + 1e-12);
function hpEnergy(x, a, b, fc = 6000) {
  // 2nd-order Butterworth high-pass (bilinear), energy per sample over [a, b)
  const w = Math.tan((Math.PI * fc) / SR);
  const k = Math.SQRT2 * w;
  const n = 1 + k + w * w;
  const b0 = 1 / n;
  const b1 = -2 / n;
  const b2 = 1 / n;
  const a1 = (2 * (w * w - 1)) / n;
  const a2 = (1 - k + w * w) / n;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, e = 0, c = 0;
  const s0 = Math.max(0, a - Math.round(0.004 * SR)); // settle on silence / the pre-roll
  for (let i = s0; i < Math.min(b, x.length); i++) {
    const x0 = x[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    if (i >= a) {
      e += y0 * y0;
      c++;
    }
  }
  return c ? e / c : 0;
}

// perceptual onset of a rendered note (mono `x`, beat `pre`, played at MIDI `pm`): sampled.ts
// perceptualOnset on onsetPower (max(5 ms, one period)); `top` fixes the window of the maximum
const periodOf = (pm) => SR / (440 * Math.pow(2, (pm - 69) / 12));
const perceptual = (x, pre, pm, top = 0, balanced = false) => A.perceptualOnset(A.onsetPower([x], SR, x.length, periodOf(pm)), SR, pre, top, balanced);
// a note as the mixer plays it gated: full level up to `cut`, then the release decay
const gated = (x, cut, release) => {
  const k = Math.exp(-1 / (Math.max(0.001, release) * SR));
  const n = Math.min(x.length, cut + Math.round(3.6 * release * SR));
  const y = new Float32Array(n);
  let env = 1;
  for (let i = 0; i < n; i++) {
    if (i >= cut) env *= k;
    y[i] = x[i] * env;
  }
  return y;
};
const ms = (v) => +((v / SR) * 1000).toFixed(1);
const mono = (s) => {
  const x = new Float32Array(s.l.length);
  for (let i = 0; i < x.length; i++) x[i] = s.r ? 0.5 * (s.l[i] + s.r[i]) : s.l[i];
  return x;
};

// The short-note rule of sustained notes (sampled.ts sustainedOnsets) re-implemented on each note as the mixer plays it
// gated — an independent check of the runtime's tables: the gated note's envelope (onsetPower, max(5 ms, one period))
// and its peak within the whole note's window (its first 0.5 s after the beat), the mean first crossings of the 4 dB
// around -10 dB and of the 4 dB around -15 dB (+ RISE_MAX) — for `balance` voicings of -15..-10 dB (+ RISE_MAX / 2) —
// re that peak, blended into the whole note's beat over the last 1 dB under the whole note's peak; then, on a 1 ms grid
// of gates, at most 1 ms later in the sample per ms of gate (a longer note never ends earlier)
const RISE = Math.round(0.015 * SR);
const bandMeanEnv = (e, n, a, b) => {
  let acc = 0;
  let rm = -Infinity;
  for (let i = 0; i < n && rm < b; i++) {
    const d = 10 * Math.log10(e[i] + 1e-300);
    if (d > rm) {
      acc += (Math.max(a, Math.min(b, d)) - Math.max(a, Math.min(b, rm))) * (i + 1);
      rm = d;
    }
  }
  return acc / (b - a);
};
function shortRule(xs, pre, ga, release, pm, balanced, gates) {
  const per = periodOf(pm);
  const nwin = Math.min(xs.length, pre + Math.round(0.5 * SR));
  const ex = A.onsetPower([xs], SR, nwin, per);
  let ML = 0;
  for (let i = 0; i < nwin; i++) ML = Math.max(ML, ex[i]);
  const mlDb = 10 * Math.log10(ML);
  const at = (g) => {
    const y = gated(xs, ga + g, release);
    const n = Math.min(y.length, nwin);
    const ey = A.onsetPower([y], SR, n, per);
    let M = 0;
    for (let i = 0; i < n; i++) M = Math.max(M, ey[i]);
    const gDb = 10 * Math.log10(M + 1e-300);
    if (gDb >= mlDb - 1e-4) return pre;
    const u = Math.min(1, mlDb - gDb);
    const s10 = bandMeanEnv(ey, n, gDb - 12, gDb - 8);
    const s15 = balanced ? bandMeanEnv(ey, n, gDb - 15, gDb - 10) + RISE / 2 : bandMeanEnv(ey, n, gDb - 17, gDb - 13) + RISE;
    return Math.max(0, Math.min(pre, pre - u * Math.max(0, pre - Math.min(s10, s15))));
  };
  const G1 = Math.round(0.001 * SR);
  const out = [];
  let P = at(1);
  let k = 0;
  for (const g of gates) {
    while ((k + 1) * G1 <= g) {
      k++;
      P = Math.min(at(k * G1), P + G1);
    }
    out.push(P);
  }
  return out;
}

const rows = [];
const fails = [];
const noteRows = [];
for (const set of A.SAMPLE_SETS) {
  if (ONLY && !ONLY.split(',').includes(set.name)) continue;
  const spec = bySet.get(set.name);
  if (!spec) continue;
  const inst = A.INSTRUMENTS[spec.id];
  const sustain = inst.kind === 'sustain';
  for (const [zi, z] of set.zones.entries()) {
    const vr = spec.rr === 'set' || spec.rr === 'art' ? (spec.art ? spec.art.findIndex((a) => a.includes(z.r)) : z.r) : 0;
    const midi = spec.unpitched ? 60 : z.p;
    const ch = A.debugChoice(spec.id, midi, Math.max(0, vr), z.l);
    if (!ch || ch.zone.o !== z.o) continue;
    const s = inst.make(SR, midi, Math.max(0, vr), sustain ? 1.6 : 0.8, z.l);
    // what a centred note plays: the mono sum of the channels (mono sets with `width` play a second
    // take on the right channel: the beat must be on the onset of the two takes together)
    const x = new Float32Array(s.l.length);
    for (let i = 0; i < x.length; i++) x[i] = s.r ? 0.5 * (s.l[i] + s.r[i]) : s.l[i];
    const pre = s.pre ?? 0;
    const n1 = Math.round(0.001 * SR);
    // trailing 5 ms RMS: first point within 10 dB of its maximum (first 0.5 s after the beat);
    // `cut`: the note as the mixer plays a short note (full level up to cut, then the release)
    const W5 = Math.round(0.005 * SR);
    const onset10 = (p, cut = Infinity) => {
      const k = Math.exp(-1 / (Math.max(0.001, inst.release) * SR));
      const n = Math.min(x.length, cut === Infinity ? x.length : cut + Math.round(3.6 * inst.release * SR));
      const cs = new Float64Array(n + 1);
      let env = 1;
      for (let i = 0; i < n; i++) {
        if (i >= cut) env *= k;
        cs[i + 1] = cs[i] + (x[i] * env) ** 2;
      }
      const r5 = (t) => Math.sqrt((cs[t] - cs[Math.max(0, t - W5)]) / W5);
      const tEnd = Math.min(n, p + Math.round(0.5 * SR));
      let pk = 0;
      for (let t = 1; t <= tEnd; t++) pk = Math.max(pk, r5(t));
      const thr = pk * Math.pow(10, -10 / 20);
      let i10 = 1;
      while (i10 < tEnd && r5(i10) < thr) i10++;
      return +(((i10 - p) / SR) * 1000).toFixed(1);
    };
    const att10 = onset10(pre);
    // sustained: the perceptual onset; two takes summed (mono sets with `width`) are measured as rendered
    // at 0.5 s — what the runtime places their beat by (widen() matches the takes over the whole
    // rendering, so a longer one sums them in other proportions: their loudness, as it always has)
    const width = sustain && spec.width !== undefined && set.ch === 1;
    const s05 = width ? inst.make(SR, midi, Math.max(0, vr), 0.5, z.l) : s;
    const x05 = width ? mono(s05) : x;
    const per = sustain ? perceptual(x05, s05.pre ?? 0, ch.midi + ch.cents / 100, 0, !!spec.balance) : null;
    const onset = per ? ms(per.p - (s05.pre ?? 0)) : null;
    const dwSum = width ? Math.max(z.dw ?? 0, ch.partner ? ch.partner.dw ?? 0 : z.dw ?? 0) : 0;
    // short notes that start on their own onset (Sample.preAt), as played (a sustained note's gate counts from its
    // gate anchor): strStab's att10; a sustained note's Sample.preAt against the short-note rule re-implemented on the
    // gated note (shortRule), and — reported — the plain whole-note rule on it (it jumps across plateaus)
    const SHORT_G = [0.04, 0.06, 0.1].map((g) => Math.round(g * SR));
    const sx = width ? s05 : s;
    const xs = width ? x05 : x;
    let attShortPlain = null;
    let attShort = null;
    if (s.preAt && !inst.ring) {
      if (!sustain) attShort = SHORT_G.map((G) => onset10(s.preAt(G), s.preAt(G) + G));
      else {
        const rule = shortRule(xs, sx.pre ?? 0, sx.ga ?? sx.pre ?? 0, inst.release, ch.midi + ch.cents / 100, !!spec.balance, SHORT_G);
        attShort = SHORT_G.map((G, i) => ms(sx.preAt(G) - rule[i]));
        attShortPlain = SHORT_G.map((G) => {
          const p = sx.preAt(G);
          const y = gated(xs, (sx.ga ?? p) + G, inst.release);
          return ms(perceptual(y, p, ch.midi + ch.cents / 100, y.length, !!spec.balance).p - p);
        });
      }
    }
    // early-sustain level and time to -6 dB of it
    let sus6 = null;
    if (sustain) {
      const f10 = frames(x, pre, Math.round(0.01 * SR), 100).map((v) => v);
      const body = f10.slice(30, 100).filter((v) => v > 0).sort((a, b) => a - b);
      const ref = body.length ? body[body.length >> 1] : Math.max(...f10);
      const fr1 = frames(x, pre, n1, 1000);
      const k6 = fr1.findIndex((v) => v >= ref * Math.pow(10, -6 / 20));
      sus6 = k6 < 0 ? 999 : k6;
    }
    let r300 = 0;
    for (let i = pre; i < Math.min(x.length, pre + Math.round(0.3 * SR)); i++) r300 += x[i] * x[i];
    r300 = Math.sqrt(r300 / Math.round(0.3 * SR));
    const head = db(Math.abs(x[0]) / (r300 + 1e-12));
    // note-on HF burst (from the first sample of the zone: what the mixer starts with)
    const eOn = hpEnergy(x, 0, Math.round(0.002 * SR));
    const eRef = hpEnergy(x, pre + Math.round(0.05 * SR), pre + Math.round(0.15 * SR));
    const hfOn = 10 * Math.log10((eOn + 1e-20) / (eRef + 1e-20));
    const row = { set: set.name, id: spec.id, zi, p: +z.p.toFixed(2), l: z.l, r: z.r, preMs: +((pre / SR) * 1000).toFixed(1), att10, onset, dw: per ? +per.w.toFixed(2) : null, width, dwSum, attShort, attShortPlain, sus6, head: +head.toFixed(1), hfOn: +hfOn.toFixed(1) };
    rows.push(row);
    const why = [];
    if (sustain) {
      const lim = SLOW_SUSTAIN.has(set.name) ? 160 : 90;
      // (two takes whose beats sit on the attack of a dwell keep them: their sum's -10 dB point is not
      // where they are heard — graded where they mostly do not)
      const olim = width ? 33 : 8;
      if (Math.abs(onset) > olim && dwSum < 0.5) why.push(`perceptual onset ${onset} ms from the beat (limit ${olim})`);
      // short notes: Sample.preAt on the short-note rule as the gated note plays it
      if (attShort && attShort.some((a) => Math.abs(a) > LIM_SHORT)) why.push(`short notes (40/60/100 ms): Sample.preAt ${attShort.join('/')} ms off the short-note rule on the gated note (limit ${LIM_SHORT})`);
      if (sus6 > lim) why.push(`speaks late: -6 dB of the sustain after ${sus6} ms (limit ${lim})`);
      if (hfOn > 6) why.push(`note-on HF burst +${hfOn.toFixed(1)} dB`);
    } else if (PERCEPTUAL.has(set.name)) {
      if (att10 < -10 || att10 > 10) why.push(`attack ${att10} ms from the beat (limit -10..+10)`);
    } else if (!SWELL(set.name, z) && Math.abs(att10) > 5) why.push(`attack ${att10} ms from the beat (limit 5)`);
    if (!sustain && attShort && attShort.some((a) => Math.abs(a) > 5)) why.push(`short notes (40/60/100 ms) attack ${attShort.join('/')} ms from the beat (limit 5)`);
    if (head > -30) why.push(`first sample ${head.toFixed(1)} dB re the note (step from silence)`);
    if (why.length) fails.push(`${set.name} zone ${zi} (p=${z.p.toFixed(2)} L${z.l} R${z.r}): ${why.join('; ')}`);
    // every playable note of a sustained zone: the perceptual onset and the independent t15
    if (!sustain || NO_NOTES || spec.unpitched) continue;
    const notes = [];
    for (let m = z.lo; m <= z.hi; m++) {
      const c = A.debugChoice(spec.id, m, Math.max(0, vr), z.l);
      if (!c || c.zone.o !== z.o) continue;
      const sn = inst.make(SR, m, Math.max(0, vr), width ? 0.5 : 1.6, z.l);
      const xn = mono(sn);
      const pn = sn.pre ?? 0;
      const pm = c.midi + c.cents / 100;
      const e = A.onsetPower([xn], SR, xn.length, periodOf(pm));
      const on = A.perceptualOnset(e, SR, pn, 0, !!spec.balance);
      const ratio = Math.pow(2, (pm - z.p) / 12);
      const top = Math.min(e.length, pn + Math.round((0.5 * SR) / ratio));
      let mx = 0;
      for (let i = 0; i < top; i++) mx = Math.max(mx, e[i]);
      // the -15 dB point, robust to a plateau at any one level: the median of the first crossings of
      // -20, -19, .., -11 dB
      const cross = [];
      for (let d = -20; d <= -11; d++) {
        let t = 0;
        while (t < top && e[t] < mx * Math.pow(10, d / 10)) t++;
        cross.push(t + 1);
      }
      cross.sort((u, v) => u - v);
      const t15 = 0.5 * (cross[4] + cross[5]);
      notes.push({ m, partner: c.partner ? c.partner.o : -1, onset: ms(on.p - pn), dw: +on.w.toFixed(2), t15: ms(t15 - pn), preMs: ms(pn) });
    }
    // (graded for single takes: two takes summed are placed on their sum's onset, which varies with the
    // partner's attack and their interference — reported)
    const nf = [];
    if (!width) for (const n of notes) if (Math.abs(n.onset) > 30) nf.push(`m${n.m} onset ${n.onset} ms`);
    let maxJump = 0;
    for (let i = 1; i < notes.length; i++) {
      const a = notes[i - 1];
      const b = notes[i];
      if (b.m !== a.m + 1 || b.partner !== a.partner) continue;
      const j = Math.abs(b.t15 - a.t15);
      maxJump = Math.max(maxJump, j);
      if (j > 5 && !width) nf.push(`t15 m${a.m}->m${b.m} ${a.t15}->${b.t15} ms`);
    }
    noteRows.push({ set: set.name, id: spec.id, zi, p: +z.p.toFixed(2), notes, maxJump: +maxJump.toFixed(1) });
    if (nf.length) fails.push(`${set.name} zone ${zi} (p=${z.p.toFixed(2)}) playable notes: ${nf.join('; ')}`);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Sustained instruments as the songs play them: every sustained id (tone-filtered voicings and two takes summed
// included), every playable note at song lengths, mixed as render.ts mixes it (Sample.preAt(gate), the gate from
// Sample.ga, the release, the end fade), measured on what a centred note plays like the verification harness does:
// a trailing mean square over max(5 ms, one period), first within 20 / 15 / 10 / 6 dB of its maximum over the
// note's first 0.5 s after the beat (t20 / t15 / t10 / t6, ms re the beat)
// ---------------------------------------------------------------------------------------------------------------
const GATES = [0.1, 0.2, 0.4, 0.8];
const TAIL_TAU = 3.6;
/** a note creeps from -15 to -10 dB slower than this (ms): a plateau just under -10 dB, a dwell after an attack —
 *  its -10 dB crossing is not where it is heard, only its -15 dB one is compared */
const CREEP_MS = 30;
const LIM = {
  // neighbouring semitones of one zone (and partner take): a placement jump — every crossing moved the same way
  sameJump: 8,
  // neighbouring semitones from different zones (or partner takes): the part of their -15 / -10 dB disagreement a
  // placement could remove (max(|d15|, |d10|) - |d15 - d10| / 2; the rest is the recordings' attack shapes), or,
  // where a note creeps, |d15| — single takes / two takes summed (their interference varies with the partner)
  crossSingle: 16,
  crossSingleCreep: 22,
  crossSum: 16,
  crossSumCreep: 22,
  // gated scan: the onset index of notes 5 ms apart in length (ms), and across 0.5 s
  gateStep: 5.05,
  gateEdge: 5.05,
  // two takes summed: the coherent sum's attack under the power sum (dB), its -10 / -6 dB points after the power sum's (ms)
  takesDef: 8,
  takes10: 15,
  takes6: 20,
  // pad chords (spread of the chord tones' crossings, ms): median / p90 / max at -15 dB, at -10 dB (tones that do
  // not creep)
  chord15: [10, 20, 30],
  chord10: [6, 20, 30],
  // the songs' chords: spread at -15 / -10 / -6 dB, p90 / max (ms) — chord tones of different rise times can be kept
  // together at one level only: the dry accordion's low reeds climb from -15 to -6 dB in 45-75 ms, its high ones in 15
  songChord: { 15: [22, 25], 10: [25, 35], 6: [32, 40] },
  // first-bar entries: HF in the first 2 ms re the sustain (dB)
  entryHf: 0,
};
const PADS = ['organ', 'choir', 'choirO', 'strings', 'accChord'];
const mixedNote = (s, inst, gate) => {
  // render.ts mixInto for a centred note (dry, no choke / cap / clip fade)
  const relN = Math.round(inst.release * TAIL_TAU * SR);
  const k = Math.exp(-1 / (Math.max(0.001, inst.release) * SR));
  const pre = s.preAt ? s.preAt(gate) : s.pre ?? 0;
  const anchor = s.ga !== undefined ? Math.max(0, s.ga) : pre;
  const relStart = Math.min(s.l.length, anchor + gate);
  const total = Math.min(s.l.length, anchor + gate + relN);
  const fadeN = Math.max(1, Math.min(64, total));
  const y = new Float32Array(total);
  const ev = new Float32Array(total);
  let env = 1;
  for (let i = 0; i < total; i++) {
    if (i >= relStart) env *= k;
    const e = total - i < fadeN ? (env * (total - i)) / fadeN : env;
    ev[i] = e;
    y[i] = (s.r ? 0.5 * (s.l[i] + s.r[i]) : s.l[i]) * e;
  }
  return { y, pre, env: ev };
};
// Two takes summed (debugTakes parts A + B = the mid), mixed with the note's gain envelope `ev`: the envelope of what plays
// — their coherent sum — against their power sum (each take's own envelope added: no interference), trailing mean
// square over max(5 ms, one period), each re its own maximum over the note's first 0.5 s after the beat: the largest
// deficit of the sum over the attack — from its beat to 50 ms after it, or to where the power sum first comes within
// 3 dB of its maximum if sooner (where the power sum is within 25 dB of its maximum; dB) — and both sums' -15 / -10 /
// -6 dB crossings (ms re the beat)
const takesAttack = (pa, pb, ev, pre, midi) => {
  const n = ev.length;
  const W = Math.max(Math.round(0.005 * SR), Math.round(periodOf(midi)));
  const cc = new Float64Array(n + 1);
  const cp = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = pa[i] * ev[i];
    const b = pb[i] * ev[i];
    cc[i + 1] = cc[i] + (a + b) * (a + b);
    cp[i + 1] = cp[i] + a * a + b * b;
  }
  const at = (c, t) => (c[t] - c[Math.max(0, t - W)]) / W;
  const top = Math.min(n + 1, pre + Math.round(0.5 * SR));
  let Mc = 0;
  let Mp = 0;
  for (let t = 1; t < top; t++) {
    Mc = Math.max(Mc, at(cc, t));
    Mp = Math.max(Mp, at(cp, t));
  }
  const r = { def: 0, defAt: null };
  // (the attack: up to where the power sum first comes within 3 dB of its maximum — later dips are the takes beating)
  let end = Math.min(top, pre + Math.round(0.05 * SR));
  for (let t = 1; t < end; t++)
    if (at(cp, t) >= Mp * Math.pow(10, -0.3)) {
      end = Math.max(t, Math.min(end, pre + 1));
      break;
    }
  for (let t = Math.max(1, pre); t < end; t += 24) {
    if (at(cp, t) < Mp * Math.pow(10, -2.5)) continue;
    const x = 10 * Math.log10(at(cp, t) / Mp) - 10 * Math.log10(Math.max(at(cc, t), Mc * 1e-9) / Mc);
    if (x > r.def) {
      r.def = +x.toFixed(1);
      r.defAt = ms(t - pre);
    }
  }
  for (const [nm, c, M] of [['c', cc, Mc], ['p', cp, Mp]])
    for (const d of [15, 10, 6]) {
      let x = -1;
      for (let t = 1; t < top && M > 0; t++)
        if (at(c, t) >= M * Math.pow(10, -d / 10)) {
          x = t;
          break;
        }
      r[nm + d] = x < 0 ? null : ms(x - pre);
    }
  return r;
};
const crossingsOf = (y, pre, midi) => {
  const W = Math.max(Math.round(0.005 * SR), Math.round(periodOf(midi)));
  const cs = new Float64Array(y.length + 1);
  for (let i = 0; i < y.length; i++) cs[i + 1] = cs[i] + y[i] * y[i];
  const env = (t) => (cs[t] - cs[Math.max(0, t - W)]) / W;
  const top = Math.min(y.length + 1, pre + Math.round(0.5 * SR));
  let M = 0;
  for (let t = 1; t < top; t++) M = Math.max(M, env(t));
  const r = {};
  for (const d of [20, 15, 10, 6]) {
    let c = -1;
    for (let t = 1; t < top && M > 0; t++)
      if (env(t) >= M * Math.pow(10, -d / 10)) {
        c = t;
        break;
      }
    r['t' + d] = c < 0 ? null : ms(c - pre);
  }
  return r;
};
const songRows = [];
const gateRows = [];
const takesRows = [];
for (const spec of A.SAMPLED_SPECS) {
  if (spec.kind !== 'sustain' || (ONLY && !ONLY.split(',').includes(spec.set)) || NO_NOTES) continue;
  const inst = A.INSTRUMENTS[spec.id];
  const set = A.SAMPLE_SETS.find((x) => x.name === spec.set);
  if (!set) continue;
  const lo = Math.min(...set.zones.map((z) => z.lo));
  const hi = Math.max(...set.zones.map((z) => z.hi));
  const relN = Math.round(inst.release * TAIL_TAU * SR);
  for (let m = lo; m <= hi; m++) {
    const c = A.debugChoice(spec.id, m, 0, 0);
    if (!c) continue;
    const key = `${c.zone.o}+${c.partner ? c.partner.o : -1}`;
    for (const g of GATES) {
      const art = inst.shortArt !== undefined && g <= inst.shortArt ? 1 : 0;
      const gate = Math.round(g * SR);
      const lenSec = Math.max(0.5, Math.ceil(((gate + relN) / SR + 0.03) * 4) / 4);
      const width = spec.width !== undefined && set.ch === 1;
      // two takes summed: the parts of the mid each take plays (sampled.ts debugTakes: A + B = the mid)
      const dt = width && A.debugTakes ? A.debugTakes(spec.id, SR, m, 0, lenSec, 0, art) : null;
      const sm = dt ? dt.sample : art ? inst.make(SR, m, 0, lenSec, 0, 1) : inst.make(SR, m, 0, lenSec, 0);
      const { y, pre, env } = mixedNote(sm, inst, gate);
      songRows.push({ id: spec.id, m, g, key, width, ...crossingsOf(y, pre, c.midi + c.cents / 100) });
      if (dt) takesRows.push({ id: spec.id, m, g, key, ...takesAttack(dt.A, dt.B, env, pre, c.midi + c.cents / 100) });
    }
    // gated scan: the onset index (Sample.preAt) of the full articulation for gates 40..495 ms in 5 ms steps (from
    // above the short articulation's limit), across 0.5 s and at 1 s (the whole note's beat)
    const sf = inst.make(SR, m, 0, 1.25, 0);
    if (!sf.preAt) continue;
    const g0 = inst.shortArt !== undefined ? Math.ceil((inst.shortArt + 0.0001) * 200) / 200 : 0.04;
    let prev = null;
    let step = 0;
    let stepAt = 0;
    let down = 0;
    for (let g = g0; g < 0.4999; g += 0.005) {
      const p = sf.preAt(Math.round(g * SR));
      if (prev !== null) {
        if (Math.abs(p - prev) > step) {
          step = Math.abs(p - prev);
          stepAt = g;
        }
        down = Math.max(down, prev - p);
      }
      prev = p;
    }
    const edge = Math.abs(sf.preAt(Math.round(0.5 * SR)) - sf.preAt(Math.round(0.495 * SR)));
    gateRows.push({ id: spec.id, m, step: ms(step), stepAt: +stepAt.toFixed(3), edge: ms(edge), down: ms(down), whole: ms(Math.abs(sf.preAt(Math.round(1.0 * SR)) - (sf.pre ?? 0))), over: ms(Math.max(0, Math.max(...[0.05, 0.1, 0.2, 0.3, 0.4].map((g) => sf.preAt(Math.round(g * SR)))) - (sf.pre ?? 0))) });
  }
}
const songFails = [];
const crossSummary = [];
const byIdGate = new Map();
for (const r of songRows) (byIdGate.get(`${r.id}|${r.g}`) ?? byIdGate.set(`${r.id}|${r.g}`, []).get(`${r.id}|${r.g}`)).push(r);
const perId = new Map();
for (const [k, rs] of byIdGate) {
  const [id] = k.split('|');
  const st = perId.get(id) ?? perId.set(id, { same: 0, sameMax: 0, cross: 0, crossMax: 0, over8: 0, pairs: 0, all4Max: 0 }).get(id);
  rs.sort((a, b) => a.m - b.m);
  for (let i = 1; i < rs.length; i++) {
    const a = rs[i - 1];
    const b = rs[i];
    if (b.m !== a.m + 1 || [a, b].some((r) => r.t20 === null || r.t15 === null || r.t10 === null || r.t6 === null)) continue;
    const d = ['t20', 't15', 't10', 't6'].map((x) => b[x] - a[x]);
    if (a.key === b.key) {
      const jump = d.every((x) => x > 0) || d.every((x) => x < 0) ? Math.min(...d.map(Math.abs)) : 0;
      st.sameMax = Math.max(st.sameMax, jump);
      if (jump > LIM.sameJump) {
        st.same++;
        songFails.push(`${a.id} ${a.g} s m${a.m}->m${b.m} (one zone): every crossing moved ${jump.toFixed(1)} ms or more the same way (t20/t15/t10/t6 ${a.t20}/${a.t15}/${a.t10}/${a.t6} -> ${b.t20}/${b.t15}/${b.t10}/${b.t6})`);
      }
      continue;
    }
    st.pairs++;
    const creep = a.t10 - a.t15 > CREEP_MS || b.t10 - b.t15 > CREEP_MS;
    const [d15, d10] = [d[1], d[2]];
    const x = creep ? Math.abs(d15) : Math.max(Math.abs(d15), Math.abs(d10)) - Math.abs(d15 - d10) / 2;
    const lim = a.width ? (creep ? LIM.crossSumCreep : LIM.crossSum) : creep ? LIM.crossSingleCreep : LIM.crossSingle;
    st.crossMax = Math.max(st.crossMax, x);
    if (x > 8) st.over8++;
    if (x > lim) {
      st.cross++;
      songFails.push(`${a.id} ${a.g} s m${a.m}->m${b.m} (zones ${a.key} -> ${b.key}): ${creep ? '|d15|' : 'placement'} ${x.toFixed(1)} ms (limit ${lim}; t15/t10 ${a.t15}/${a.t10} -> ${b.t15}/${b.t10})`);
    }
    // every crossing (t20 / t15 / t10 / t6) moved the same way: a placement shift whatever the attack shapes (the same
    // limit)
    const all4 = d.every((v) => v > 0) || d.every((v) => v < 0) ? Math.min(...d.map(Math.abs)) : 0;
    st.all4Max = Math.max(st.all4Max, all4);
    if (all4 > lim) {
      st.cross++;
      songFails.push(`${a.id} ${a.g} s m${a.m}->m${b.m} (zones ${a.key} -> ${b.key}): every crossing moved ${all4.toFixed(1)} ms or more the same way (limit ${lim}; t20/t15/t10/t6 ${a.t20}/${a.t15}/${a.t10}/${a.t6} -> ${b.t20}/${b.t15}/${b.t10}/${b.t6})`);
    }
  }
}
const q = (v, f) => {
  const s2 = v.filter((x) => Number.isFinite(x)).sort((u, w) => u - w);
  return s2.length ? s2[Math.min(s2.length - 1, Math.round(f * (s2.length - 1)))] : 0;
};
// pad chords from the same notes: triads (m, m+4, m+7), (m, m+3, m+7) and fifth + octave (m, m+7, m+12) at each gate
const chordRows = [];
for (const id of PADS) {
  const s15 = [];
  const s10 = [];
  for (const g of GATES) {
    const rs = byIdGate.get(`${id}|${g}`);
    if (!rs) continue;
    const at = new Map(rs.map((r) => [r.m, r]));
    for (const r of rs)
      for (const iv of [[0, 4, 7], [0, 3, 7], [0, 7, 12]]) {
        const tones = iv.map((d) => at.get(r.m + d));
        if (tones.some((t) => !t || t.t15 === null || t.t10 === null)) continue;
        const a15 = tones.map((t) => t.t15);
        s15.push(Math.max(...a15) - Math.min(...a15));
        const a10 = tones.filter((t) => t.t10 - t.t15 <= CREEP_MS).map((t) => t.t10);
        if (a10.length >= 2) s10.push(Math.max(...a10) - Math.min(...a10));
      }
  }
  if (!s15.length) continue;
  const row = { id, chords: s15.length, s15: [q(s15, 0.5), q(s15, 0.9), q(s15, 1)], s10: [q(s10, 0.5), q(s10, 0.9), q(s10, 1)], n10: s10.length };
  chordRows.push(row);
  if (row.s15.some((v, i) => v > LIM.chord15[i])) songFails.push(`${id} chords: spread at -15 dB median / p90 / max ${row.s15.map((v) => v.toFixed(1)).join(' / ')} ms (limit ${LIM.chord15.join(' / ')})`);
  if (row.s10.some((v, i) => v > LIM.chord10[i])) songFails.push(`${id} chords: spread at -10 dB median / p90 / max ${row.s10.map((v) => v.toFixed(1)).join(' / ')} ms (limit ${LIM.chord10.join(' / ')})`);
}
// two takes summed, at song lengths: the attack of what plays against the takes' power sum
const takesSummary = new Map();
for (const r of takesRows) {
  const t = takesSummary.get(r.id) ?? takesSummary.set(r.id, { n: 0, def: 0, d10: 0, d6: 0, over: 0 }).get(r.id);
  t.n++;
  // how much later the sum crosses -10 / -6 dB than the power sum: where both climb from -15 to -10 dB within CREEP_MS
  // (and, for -6 dB, the power sum from -10 to -6 dB within 40 ms: a plateau or swell there has no attack point)
  const climbs = [r.c15, r.c10, r.p15, r.p10].every((v) => v !== null) && r.c10 - r.c15 <= CREEP_MS && r.p10 - r.p15 <= CREEP_MS;
  const d10 = climbs ? r.c10 - r.p10 : 0;
  const d6 = climbs && r.p6 !== null && r.p6 - r.p10 <= 40 ? (r.c6 === null ? 999 : r.c6 - r.p6) : 0;
  t.def = Math.max(t.def, r.def);
  t.d10 = Math.max(t.d10, d10);
  t.d6 = Math.max(t.d6, d6);
  const why = [];
  if (r.def > LIM.takesDef) why.push(`the sum stalls ${r.def} dB under the takes' power sum ${r.defAt} ms after the beat (limit ${LIM.takesDef})`);
  if (d10 > LIM.takes10) why.push(`-10 dB at ${r.c10} ms, the power sum's at ${r.p10} (limit ${LIM.takes10} later)`);
  if (d6 > LIM.takes6) why.push(`-6 dB at ${r.c6} ms, the power sum's at ${r.p6} (limit ${LIM.takes6} later)`);
  if (why.length) {
    t.over++;
    songFails.push(`${r.id} ${r.g} s m${r.m} (two takes ${r.key}): ${why.join('; ')}`);
  }
}
for (const r of gateRows) {
  const why = [];
  if (r.step > LIM.gateStep) why.push(`onset moves ${r.step} ms between gates 5 ms apart (at ${r.stepAt} s; limit ${LIM.gateStep})`);
  if (r.edge > LIM.gateEdge) why.push(`onset moves ${r.edge} ms from 0.495 to 0.5 s (limit ${LIM.gateEdge})`);
  if (r.down > 0.05) why.push(`onset moves back ${r.down} ms as the gate grows (not monotone)`);
  if (r.whole > 0.05) why.push(`a 1 s note is ${r.whole} ms off the whole note's beat`);
  if (r.over > 0.05) why.push(`a short note starts ${r.over} ms later in the sample than a whole note`);
  if (why.length) songFails.push(`${r.id} m${r.m} gated: ${why.join('; ')}`);
}
// ---------------------------------------------------------------------------------------------------------------
// The songs' own chords and first-bar entries (compileSong events as render.ts schedules them; every sustained voice):
//   chords   notes of one channel starting within 12 ms, each mixed as render.ts mixes it: the spread of their -15 dB
//            crossings (every tone), of their -10 dB crossings (tones that climb from -15 to -10 dB within CHORD_CREEP_MS:
//            a creep over a plateau has no -10 dB attack point) and of their -6 dB crossings (tones that climb from -15
//            to -6 dB within CHORD_BODY_MS: a slow swell has none either) — per channel median / p90 / max
//   entries  sustained notes whose pre-roll starts before t = 0, mixed with render.ts's clip fade: energy above 6 kHz in
//            their first 2 ms re 50..150 ms later (a click)
// ---------------------------------------------------------------------------------------------------------------
const CHORD_CREEP_MS = 50;
const CHORD_BODY_MS = 80;
const SLOW_SPEECH = new Set(['organ']);
const chordFails = [];
const songChordRows = [];
const entryRows = [];
if (!NO_NOTES && !ONLY) {
  for (const [songId, song] of Object.entries(A.SONGS)) {
    const chInst = (ch) => (song.channels[ch] ? A.INSTRUMENTS[song.channels[ch].inst] : undefined);
    const comp = A.compileSong(song, { gate: (ch) => chInst(ch)?.gate ?? 0.9, plucked: (ch) => ['pluck', 'perc'].includes(chInst(ch)?.kind) });
    const rr = new Map();
    for (const e of comp.events) {
      if (e.vr >= 0) continue;
      const inst = chInst(e.ch);
      const cyc = inst?.rrCycle && inst.rrCycle.length ? inst.rrCycle : null;
      const c = rr.get(e.ch) ?? 0;
      e.vr = cyc ? cyc[c % cyc.length] : c % (inst?.variants ?? 1);
      rr.set(e.ch, c + 1);
    }
    const evs = [];
    const sampled = new Set(A.SAMPLED_SPECS.map((x) => x.id));
    for (const e of comp.events) {
      const inst = chInst(e.ch);
      if (!inst || inst.kind !== 'sustain' || !sampled.has(inst.id)) continue;
      const vr = Math.max(0, e.vr) % Math.max(1, inst.variants);
      const art = inst.shortArt !== undefined && e.d <= inst.shortArt ? 1 : 0;
      const layer = inst.layerOf ? inst.layerOf(e.v) | 0 : 0;
      evs.push({ e, inst, vr, art, layer, gate: Math.max(1, Math.round(e.d * SR)), st: Math.round(e.t * SR), key: `${inst.id}|${e.m}|${vr}|${layer}|${art}` });
    }
    const need = new Map();
    for (const ev of evs) need.set(ev.key, Math.max(need.get(ev.key) ?? 0, (ev.gate + Math.round(ev.inst.release * TAIL_TAU * SR)) / SR + 0.03));
    const cache = new Map();
    const sampleOf = (ev) => {
      let smp = cache.get(ev.key);
      if (!smp) {
        const lenSec = Math.max(0.5, Math.ceil(need.get(ev.key) * 4) / 4);
        smp = ev.art ? ev.inst.make(SR, ev.e.m, ev.vr, lenSec, ev.layer, 1) : ev.inst.make(SR, ev.e.m, ev.vr, lenSec, ev.layer);
        cache.set(ev.key, smp);
      }
      return smp;
    };
    const pitchOf = (ev) => {
      const c = A.debugChoice(ev.inst.id, ev.e.m, ev.vr, ev.layer);
      return c ? c.midi + c.cents / 100 : ev.e.m;
    };
    // chords
    const byCh = new Map();
    for (const ev of evs) (byCh.get(ev.e.ch) ?? byCh.set(ev.e.ch, []).get(ev.e.ch)).push(ev);
    for (const [ch, list] of byCh) {
      list.sort((a, b) => a.e.t - b.e.t);
      const chords = [];
      let cur = [list[0]];
      for (let k = 1; k < list.length; k++) {
        if (list[k].e.t - cur[0].e.t < 0.012) cur.push(list[k]);
        else {
          if (cur.length > 1) chords.push(cur);
          cur = [list[k]];
        }
      }
      if (cur.length > 1) chords.push(cur);
      if (!chords.length) continue;
      const sp = { 15: [], 10: [], 6: [] };
      for (const c of chords) {
        const tones = c.map((ev) => {
          const { y, pre } = mixedNote(sampleOf(ev), ev.inst, ev.gate);
          return crossingsOf(y, pre, pitchOf(ev));
        });
        const spread = (v) => (v.length > 1 ? Math.max(...v) - Math.min(...v) : null);
        const t15 = tones.filter((t) => t.t15 !== null);
        const climb = t15.filter((t) => t.t10 !== null && t.t10 - t.t15 <= CHORD_CREEP_MS);
        const body = t15.filter((t) => t.t6 !== null && t.t6 - t.t15 <= CHORD_BODY_MS);
        const a = spread(t15.map((t) => t.t15));
        const b = spread(climb.map((t) => t.t10));
        const d = spread(body.map((t) => t.t6));
        if (a !== null) sp[15].push(a);
        if (b !== null) sp[10].push(b);
        if (d !== null) sp[6].push(d);
      }
      const row = { song: songId, ch, id: list[0].inst.id, chords: chords.length };
      for (const lv of [15, 10, 6]) {
        row['s' + lv] = sp[lv].length ? [q(sp[lv], 0.5), q(sp[lv], 0.9), q(sp[lv], 1)] : null;
        row['n' + lv] = sp[lv].length;
      }
      songChordRows.push(row);
      for (const lv of [15, 10, 6]) {
        const v = row['s' + lv];
        const lim = LIM.songChord[lv];
        // (the organ's bass pipes speak 50 ms after its treble ones: its -6 dB spread is the instrument's, reported)
        if (lv === 6 && SLOW_SPEECH.has(row.id)) continue;
        // (a p90 over fewer than 5 chords is their maximum: graded as that)
        if (v && ((row['n' + lv] >= 5 && v[1] > lim[0]) || v[2] > lim[1])) chordFails.push(`${songId} ${ch} (${row.id}) chords: spread at -${lv} dB median / p90 / max ${v.map((x) => x.toFixed(1)).join(' / ')} ms (limit p90 / max ${lim.join(' / ')})`);
      }
    }
    // first-bar entries (render.ts mixInto's clip fade: raised cosine over the lost build-up, 2..10 ms, ending at most
    // 5 ms after the onset)
    for (const ev of evs) {
      const smp = sampleOf(ev);
      const { y, pre } = mixedNote(smp, ev.inst, ev.gate);
      const i0 = pre - ev.st;
      if (!(i0 > 0)) continue;
      const cmin = Math.round(0.002 * SR);
      const nIn = Math.min(y.length - i0, Math.max(cmin, Math.min(i0, Math.round(0.01 * SR), Math.max(ev.st, Math.round(0.005 * SR)))));
      const z = new Float32Array(y.length);
      for (let i = i0; i < y.length; i++) z[i] = y[i] * (i - i0 < nIn ? 0.5 - 0.5 * Math.cos((Math.PI * (i - i0 + 0.5)) / nIn) : 1);
      const hf = 10 * Math.log10((hpEnergy(z, i0, i0 + Math.round(0.002 * SR)) + 1e-20) / (hpEnergy(z, i0 + Math.round(0.05 * SR), i0 + Math.round(0.15 * SR)) + 1e-20));
      entryRows.push({ song: songId, ch: ev.e.ch, id: ev.inst.id, m: ev.e.m, t: +(ev.e.t * 1000).toFixed(1), clipped: ms(i0), hf: +hf.toFixed(1) });
      if (hf > LIM.entryHf) chordFails.push(`${songId} ${ev.e.ch} (${ev.inst.id}) m${ev.e.m} at t = ${(ev.e.t * 1000).toFixed(1)} ms: its first 2 ms (pre-roll ${ms(i0)} ms cut) carry +${hf.toFixed(1)} dB of HF re its sustain (limit ${LIM.entryHf})`);
    }
  }
  console.log(`\nthe songs' chords (sustained notes of one channel starting within 12 ms, mixed as render.ts mixes them): spread of the tones' crossings (ms); -10 / -6 dB over the tones that climb from -15 dB to there within ${CHORD_CREEP_MS} / ${CHORD_BODY_MS} ms`);
  console.log('song       ch      id            chords   -15 dB med/p90/max      -10 dB med/p90/max      -6 dB med/p90/max');
  const f3 = (v) => (v ? v.map((x) => x.toFixed(1)).join(' / ') : '-').padStart(20);
  for (const r of songChordRows) console.log(`${r.song.padEnd(10)} ${r.ch.padEnd(7)} ${r.id.padEnd(13)} ${String(r.chords).padStart(6)}  ${f3(r.s15)}    ${f3(r.s10)}    ${f3(r.s6)}`);
  const hfs = entryRows.map((r) => r.hf);
  console.log(`first-bar sustained entries: ${entryRows.length}, HF in their first 2 ms re the sustain max ${hfs.length ? Math.max(...hfs).toFixed(1) : '-'} dB (limit ${LIM.entryHf})`);
}
for (const f of chordFails) songFails.push(f);
if (songRows.length) {
  console.log(`\nsustained notes at song lengths (${GATES.join(' / ')} s, mixed as render.ts mixes them): neighbouring semitones`);
  console.log('id            one zone: jumps (max)   other zone / take: pairs  over limit  over 8 ms  max  all crossings  gated scan: step max  0.5 s edge max    pad chords: spread -15 dB med/p90/max   -10 dB med/p90/max');
  for (const [id, st] of perId) {
    const gr = gateRows.filter((r) => r.id === id);
    const ch = chordRows.find((r) => r.id === id);
    console.log(
      `${id.padEnd(13)} ${String(st.same).padStart(5)} (${st.sameMax.toFixed(1).padStart(5)})          ${String(st.pairs).padStart(5)}  ${String(st.cross).padStart(9)}  ${String(st.over8).padStart(9)}  ${st.crossMax.toFixed(1).padStart(5)}  ${st.all4Max.toFixed(1).padStart(13)}` +
        `              ${(gr.length ? Math.max(...gr.map((r) => r.step)) : 0).toFixed(1).padStart(6)}  ${(gr.length ? Math.max(...gr.map((r) => r.edge)) : 0).toFixed(1).padStart(14)}` +
        (ch ? `              ${ch.s15.map((v) => v.toFixed(1)).join(' / ').padStart(18)}   ${ch.s10.map((v) => v.toFixed(1)).join(' / ').padStart(18)}` : ''),
    );
  }
}
if (takesSummary.size) {
  console.log(`\ntwo takes summed at song lengths (${GATES.join(' / ')} s): what plays (their coherent sum) against their power sum`);
  console.log('id            notes  attack deficit max (dB)  -10 dB after the power sum max (ms)  -6 dB max (ms)  over limits');
  for (const [id, t] of takesSummary) console.log(`${id.padEnd(13)} ${String(t.n).padStart(5)}  ${t.def.toFixed(1).padStart(22)}  ${t.d10.toFixed(1).padStart(35)}  ${t.d6.toFixed(1).padStart(14)}  ${String(t.over).padStart(11)}`);
}
for (const f of songFails) fails.push(f);
const sets = [...new Set(rows.map((r) => r.set))];
console.log('set           zones  att10 ms (min/med/max)   onset ms (min/med/max) dwell   sus6 ms (med/max)   head dB max   hfOn dB max   notes: |onset| max  t15 jump max');
for (const s of sets) {
  const rs = rows.filter((r) => r.set === s);
  const a = rs.map((r) => r.att10).sort((x, y) => x - y);
  const o = rs.filter((r) => r.onset !== null).map((r) => r.onset).sort((x, y) => x - y);
  const su = rs.filter((r) => r.sus6 !== null).map((r) => r.sus6).sort((x, y) => x - y);
  const nr = noteRows.filter((r) => r.set === s);
  const med = (v) => v[v.length >> 1];
  const f = (v, w = 5) => String(v).padStart(w);
  console.log(
    `${s.padEnd(13)} ${f(rs.length)}  ${f(a[0])} ${f(med(a))} ${f(a[a.length - 1])}        ` +
      `${o.length ? `${f(o[0])} ${f(med(o))} ${f(o[o.length - 1])}  ${f(rs.filter((r) => r.dw > 0).length, 3)}` : '    -     -     -    -'}    ` +
      `${su.length ? f(med(su)) + ' ' + f(su[su.length - 1]) : '    -     -'}          ` +
      `${Math.max(...rs.map((r) => r.head)).toFixed(1).padStart(6)}       ${Math.max(...rs.map((r) => r.hfOn)).toFixed(1).padStart(6)}` +
      (nr.length ? `        ${f(Math.max(...nr.flatMap((r) => r.notes.map((n) => Math.abs(n.onset)))).toFixed(1), 6)}     ${f(Math.max(...nr.map((r) => r.maxJump)).toFixed(1), 6)}` : ''),
  );
  if (VERBOSE) for (const r of rs) console.log('   ', JSON.stringify(r));
  if (VERBOSE) for (const r of nr) console.log('    notes', r.zi, r.notes.map((n) => `${n.m}:${n.onset}/${n.t15}${n.partner >= 0 ? '+' : ''}`).join(' '));
}
console.log(`\nverdict: ${fails.length ? fails.length + ' zones over limits' : 'all zones within limits'}`);
for (const f of fails) console.log('  -', f);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ rows, notes: noteRows, songNotes: songRows, takes: takesRows, gated: gateRows, chords: chordRows, fails }, null, 1));
process.exitCode = fails.length ? 1 : 0;
