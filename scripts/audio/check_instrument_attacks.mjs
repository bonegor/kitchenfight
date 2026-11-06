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
 *           spread attack keeps rising, and the sustained instruments, whose slow attack does): the
 *           onset of 40 / 60 / 100 ms notes as the mixer plays them (gate, then the release; a sustained
 *           note's gate counts from its gate anchor Sample.ga) — att10 for strStab, the perceptual
 *           onset below for sustained notes.
 *   onset   sustained instruments: the perceptual onset (scripts/audio/instrument_dsp.py
 *           perceptual_onset, as sampled.ts perceptualOnset implements it): att10 measured over max(5 ms,
 *           one period), or — for a note whose envelope dwells below that threshold (an attack onto a
 *           plateau, then a slow crescendo, where att10 lands on the crescendo or wherever a 1 dB
 *           fluctuation touches it) — the attack, blended in by how slow the climb is. `dw` = that blend
 *           (0 = att10 itself). att10 is reported beside it.
 *
 * Every playable note (sustained sets, --notes to skip): each zone played at every pitch of its key range
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
 * Limits: plucked / struck zones (decay / oneshot sets with a transient attack) |att10| <= 5 ms;
 * section articulations (strStab, pizz, orchHit: spread attack, beat on the perceptual onset)
 * -10..+10 ms, attShort |.| <= 5 ms; sustained zones at their roots |onset| <= 8 ms (single takes: the
 * bank's beat, build_instruments.sustain_beat, read back through the runtime) or 33 ms (two takes
 * summed: the 25 ms the runtime corrects their beat by at most, plus those 8 ms; not graded where a take
 * dwells — its attack, not the sum's -10 dB point, is where it is heard), attShort |.| <= 5 ms (25 ms
 * summed), sus6 <= 160 ms (bowed strings / chorus) or 90 ms (the rest), head <= -30 dB, hfOn <= +6 dB;
 * every playable note of a single take |onset| <= 30 ms and neighbouring t15 within 5 ms (two takes
 * summed: reported).
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
const perceptual = (x, pre, pm, top = 0) => A.perceptualOnset(A.onsetPower([x], SR, x.length, periodOf(pm)), SR, pre, top);
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
    const per = sustain ? perceptual(x05, s05.pre ?? 0, ch.midi + ch.cents / 100) : null;
    const onset = per ? ms(per.p - (s05.pre ?? 0)) : null;
    const dwSum = width ? Math.max(z.dw ?? 0, ch.partner ? ch.partner.dw ?? 0 : z.dw ?? 0) : 0;
    // spread attacks whose short notes start on their own onset (Sample.preAt): short notes as played
    // (a sustained note's gate counts from its gate anchor; its onset is the perceptual one)
    const attShort = s.preAt && !inst.ring
      ? [0.04, 0.06, 0.1].map((g) => {
          const G = Math.round(g * SR);
          const p = s.preAt(G);
          if (!sustain) return onset10(p, p + G);
          const y = gated(width ? x05 : x, (s.ga ?? p) + G, inst.release);
          return ms(perceptual(y, p, ch.midi + ch.cents / 100, y.length).p - p);
        })
      : null;
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
    const row = { set: set.name, id: spec.id, zi, p: +z.p.toFixed(2), l: z.l, r: z.r, preMs: +((pre / SR) * 1000).toFixed(1), att10, onset, dw: per ? +per.w.toFixed(2) : null, width, dwSum, attShort, sus6, head: +head.toFixed(1), hfOn: +hfOn.toFixed(1) };
    rows.push(row);
    const why = [];
    if (sustain) {
      const lim = SLOW_SUSTAIN.has(set.name) ? 160 : 90;
      // (two takes whose beats sit on the attack of a dwell keep them: their sum's -10 dB point is not
      // where they are heard — graded where they mostly do not)
      const olim = width ? 33 : 8;
      if (Math.abs(onset) > olim && dwSum < 0.5) why.push(`perceptual onset ${onset} ms from the beat (limit ${olim})`);
      // short notes: on their own onset; one later than the whole note's beat stays there (Sample.preAt
      // never places a short note later than a long one)
      const pre0 = s.pre ?? 0;
      const bad = attShort ? attShort.filter((a, i) => (width ? Math.abs(a) > 25 && dwSum < 0.5 : Math.abs(a) > 5) && !(a > 0 && s.preAt(Math.round([0.04, 0.06, 0.1][i] * SR)) >= pre0)) : [];
      if (bad.length) why.push(`short notes (40/60/100 ms) onset ${attShort.join('/')} ms from their beat (limit ${width ? 25 : 5})`);
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
      const on = A.perceptualOnset(e, SR, pn);
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
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ rows, notes: noteRows, fails }, null, 1));
process.exitCode = fails.length ? 1 : 0;
