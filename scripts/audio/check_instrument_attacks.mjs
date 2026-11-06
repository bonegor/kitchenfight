#!/usr/bin/env node
/**
 * Attack timing and note-on checks of every zone of every sample set, through the REAL sampler
 * (src/audio/sampled.ts; MP3s decoded with ffmpeg and installed like the music worker does).
 * Each zone is played at its own root (its own layer / round robin) at 48 kHz, dry, and measured
 * relative to the sample's onset (`pre`, the sample the mixer puts on the beat):
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
 * Limits: plucked / struck zones (decay / oneshot sets with a transient attack) |att10| <= 5 ms;
 * section articulations (strStab, pizz, orchHit: spread attack, beat on the perceptual onset)
 * -10..+10 ms; sustained zones sus6 <= 160 ms (bowed strings / chorus) or 90 ms (the rest);
 * head <= -30 dB; sustained hfOn <= +6 dB.
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
const SR = 48000;

// attack model per set (mirrors scripts/audio/build_instruments.py: 'perceptual' sets put the beat on
// the -12 dB point of a spread attack; sustained sets are graded on how soon they speak)
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

const rows = [];
const fails = [];
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
    // the zone itself: mono sets with `width` play a second take on the right channel, mixed by a
    // rotation (L = c a + s b, R = c b + s a) — recover a = (c L - s R) / (c^2 - s^2)
    const x = new Float32Array(s.l.length);
    if (s.r && spec.width !== undefined && set.ch === 1) {
      const th = Math.asin(Math.min(1, Math.max(0, spec.width))) / 2;
      const c = Math.cos(th);
      const sn = Math.sin(th);
      for (let i = 0; i < x.length; i++) x[i] = (c * s.l[i] - sn * s.r[i]) / (c * c - sn * sn);
    } else for (let i = 0; i < x.length; i++) x[i] = s.r ? 0.5 * (s.l[i] + s.r[i]) : s.l[i];
    const pre = s.pre ?? 0;
    const n1 = Math.round(0.001 * SR);
    // trailing 5 ms RMS: first point within 10 dB of its maximum (first 0.5 s after the beat)
    const W5 = Math.round(0.005 * SR);
    const cs = new Float64Array(x.length + 1);
    for (let i = 0; i < x.length; i++) cs[i + 1] = cs[i] + x[i] * x[i];
    const r5 = (t) => Math.sqrt((cs[t] - cs[Math.max(0, t - W5)]) / W5);
    const tEnd = Math.min(x.length, pre + Math.round(0.5 * SR));
    let pk = 0;
    for (let t = 1; t <= tEnd; t++) pk = Math.max(pk, r5(t));
    const thr = pk * Math.pow(10, -10 / 20);
    let i10 = 1;
    while (i10 < tEnd && r5(i10) < thr) i10++;
    const att10 = +(((i10 - pre) / SR) * 1000).toFixed(1);
    // early-sustain level and time to -6 dB of it
    let sus6 = null;
    if (sustain) {
      const f10 = frames(x, pre, Math.round(0.01 * SR), 100).map((v) => v);
      const body = f10.slice(30, 100).filter((v) => v > 0).sort((a, b) => a - b);
      const ref = body.length ? body[body.length >> 1] : pk;
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
    const row = { set: set.name, id: spec.id, zi, p: +z.p.toFixed(2), l: z.l, r: z.r, preMs: +((pre / SR) * 1000).toFixed(1), att10, sus6, head: +head.toFixed(1), hfOn: +hfOn.toFixed(1) };
    rows.push(row);
    const why = [];
    if (sustain) {
      const lim = SLOW_SUSTAIN.has(set.name) ? 160 : 90;
      if (sus6 > lim) why.push(`speaks late: -6 dB of the sustain after ${sus6} ms (limit ${lim})`);
      if (hfOn > 6) why.push(`note-on HF burst +${hfOn.toFixed(1)} dB`);
    } else if (PERCEPTUAL.has(set.name)) {
      if (att10 < -10 || att10 > 10) why.push(`attack ${att10} ms from the beat (limit -10..+10)`);
    } else if (!SWELL(set.name, z) && Math.abs(att10) > 5) why.push(`attack ${att10} ms from the beat (limit 5)`);
    if (head > -30) why.push(`first sample ${head.toFixed(1)} dB re the note (step from silence)`);
    if (why.length) fails.push(`${set.name} zone ${zi} (p=${z.p.toFixed(2)} L${z.l} R${z.r}): ${why.join('; ')}`);
  }
}
const sets = [...new Set(rows.map((r) => r.set))];
console.log('set           zones  att10 ms (min/med/max)   sus6 ms (med/max)   head dB max   hfOn dB max');
for (const s of sets) {
  const rs = rows.filter((r) => r.set === s);
  const a = rs.map((r) => r.att10).sort((x, y) => x - y);
  const su = rs.filter((r) => r.sus6 !== null).map((r) => r.sus6).sort((x, y) => x - y);
  const med = (v) => v[v.length >> 1];
  console.log(
    `${s.padEnd(13)} ${String(rs.length).padStart(5)}  ${String(a[0]).padStart(5)} ${String(med(a)).padStart(5)} ${String(a[a.length - 1]).padStart(5)}        ` +
      `${su.length ? String(med(su)).padStart(5) + ' ' + String(su[su.length - 1]).padStart(5) : '    -     -'}          ` +
      `${Math.max(...rs.map((r) => r.head)).toFixed(1).padStart(6)}       ${Math.max(...rs.map((r) => r.hfOn)).toFixed(1).padStart(6)}`,
  );
  if (VERBOSE) for (const r of rs) console.log('   ', JSON.stringify(r));
}
console.log(`\nverdict: ${fails.length ? fails.length + ' zones over limits' : 'all zones within limits'}`);
for (const f of fails) console.log('  -', f);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ rows, fails }, null, 1));
process.exitCode = fails.length ? 1 : 0;
