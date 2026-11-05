#!/usr/bin/env node
/**
 * Loudness calibration of the sampled instruments against the synthesized ones they replace,
 * so the songs (mixed against the synth levels) keep their balance.
 *
 * For every id in SAMPLED_SPECS: render reference notes (v = 0.8) across the pitch range the
 * songs use (or the instrument's range for new ids) with the synth InstDef and with the sampled
 * InstDef, measure K-weighted loudness of the note body, and print the gain (dB) that makes the
 * sampled one as loud as the synth one. New ids (no song usage) are matched to the median synth
 * loudness of the existing family; for those the gain is capped so that no zone peaks above
 * 0 dBFS for a single note at velocity 1.0 and unity channel gain (short clicks have a large
 * crest factor). Paste the result into SAMPLED_SPECS[].gainDb in sampled.ts
 * (or run with --write to update the file in place).
 *
 * Usage: node scripts/audio/calibrate_instruments.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { installBank, loadAudio } from './render-song.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WRITE = process.argv.includes('--write');
const SR = 48000;

// pitch range the current songs use per instrument (scripts measured with the sequencer)
const USED = {
  accChord: [64, 86], accordion: [58, 88], accordionDry: [59, 86], bell: [53, 60], brass: [59, 89], brassSoft: [58, 69],
  choir: [66, 93], choirO: [65, 87], flute: [69, 86], glock: [69, 98], guitar: [49, 76], harpsi: [62, 72],
  mandolin: [57, 100], organ: [55, 80], pizz: [45, 79], strStab: [52, 92], strings: [64, 89], timp: [34, 51],
  tuba: [24, 41], ubass: [33, 52], vibes: [65, 94], violin: [59, 84],
  // unpitched percussion the songs use (pitch ignored)
  tamb: [60, 60], snare: [60, 60], crash: [60, 60], kick: [60, 60], triangle: [60, 60], shaker: [60, 60], pan: [60, 60],
};

function kWeight(x, sr) {
  // BS.1770 K-weighting (high shelf + RLB high-pass), as in instrument_dsp.py
  const shelf = (() => {
    const fc = 1681.97, G = 4.0, Q = 0.7071752;
    const A = Math.pow(10, G / 40), w0 = (2 * Math.PI * fc) / sr, al = Math.sin(w0) / (2 * Q), cw = Math.cos(w0);
    const b = [A * ((A + 1) + (A - 1) * cw + 2 * Math.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - 2 * Math.sqrt(A) * al)];
    const a = [(A + 1) - (A - 1) * cw + 2 * Math.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - 2 * Math.sqrt(A) * al];
    return [b.map((v) => v / a[0]), a.map((v) => v / a[0])];
  })();
  const hp = (() => {
    const fc = 38.135, Q = 0.500327, w0 = (2 * Math.PI * fc) / sr, al = Math.sin(w0) / (2 * Q), cw = Math.cos(w0);
    const b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2];
    const a = [1 + al, -2 * cw, 1 - al];
    return [b.map((v) => v / a[0]), a.map((v) => v / a[0])];
  })();
  const run = (inp, [b, a]) => {
    const out = new Float64Array(inp.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < inp.length; i++) {
      const x0 = inp[i];
      const y0 = b[0] * x0 + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
      out[i] = y0;
      x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    }
    return out;
  };
  return run(run(x, shelf), hp);
}

function noteLoudness(inst, m, sustain) {
  const s = inst.make(SR, m, 0, 1.2, inst.layerOf ? inst.layerOf(0.8) : 0);
  const pre = s.pre ?? 0;
  const perc = inst.kind === 'perc';
  const a = pre + Math.round((sustain ? 0.25 : 0) * SR);
  const b = Math.min(s.l.length, pre + Math.round((sustain ? 1.0 : perc ? 0.15 : 0.35) * SR));
  if (b - a < 100) return -120;
  let p = 0;
  for (const ch of s.r ? [s.l, s.r] : [s.l]) {
    const k = kWeight(ch, SR);
    let acc = 0;
    for (let i = a; i < b; i++) acc += k[i] * k[i];
    p += acc / (b - a);
  }
  if (!s.r) p *= 2; // mono plays on both channels (constant-power pan at centre ≈ equal power)
  return 10 * Math.log10(p / 2 + 1e-14);
}

const A = await loadAudio();
const synth = { ...A.INSTRUMENTS };
installBank(A);
const rows = [];
for (const spec of A.SAMPLED_SPECS) {
  const s = synth[spec.id];
  const smp = A.INSTRUMENTS[spec.id];
  if (!smp || smp === s) continue;
  const set = A.SAMPLE_SETS.find((x) => x.name === spec.set);
  const roots = set.zones.map((z) => z.p);
  let lo = USED[spec.id]?.[0] ?? Math.round(Math.min(...roots));
  let hi = USED[spec.id]?.[1] ?? Math.round(Math.max(...roots));
  const pitches = spec.unpitched ? [60] : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(lo + (hi - lo) * f));
  const sustain = smp.kind === 'sustain';
  const mean = (xs) => 10 * Math.log10(xs.reduce((a, v) => a + Math.pow(10, v / 10), 0) / xs.length);
  // the sampled instrument without its current trim
  const trim = spec.gainDb ?? 0;
  const lSmp = mean(pitches.map((m) => noteLoudness(smp, m, sustain))) - trim;
  const lSyn = s ? mean(pitches.map((m) => noteLoudness(s, m, s.kind === 'sustain'))) : null;
  // loudest sample peak over every zone at v = 1.0 (without the current trim)
  let peak = 0;
  for (const z of set.zones) {
    const vr = spec.rr === 'set' || spec.rr === 'art' ? z.r : 0;
    let sm;
    try {
      sm = smp.make(SR, spec.unpitched ? 60 : Math.round(z.p), vr, 1.0, z.l);
    } catch {
      continue;
    }
    for (const ch of sm.r ? [sm.l, sm.r] : [sm.l]) for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
  }
  const peakRawDb = 20 * Math.log10(peak + 1e-12) - trim;
  rows.push({ id: spec.id, used: !!USED[spec.id], lSyn, lSmp, kind: smp.kind, peakRawDb });
}
const med = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const mPitched = med(rows.filter((r) => r.used && r.lSyn !== null && r.kind !== 'perc').map((r) => r.lSyn));
const mPerc = med(rows.filter((r) => r.used && r.lSyn !== null && r.kind === 'perc').map((r) => r.lSyn));
console.log(`median synth loudness the songs use: pitched ${mPitched.toFixed(1)} LU, percussion ${mPerc.toFixed(1)} LU (K-weighted dB)`);
console.log('id            synth LU  sampled LU   gainDb  peak@v1');
const gains = {};
for (const r of rows) {
  const ref = r.used && r.lSyn !== null ? r.lSyn : r.kind === 'perc' ? mPerc : mPitched;
  let g = Math.max(-24, Math.min(24, ref - r.lSmp));
  // new ids: sane default level (peak cap); ids the songs use: loudness parity with the synth they
  // were mixed against (transient peaks are handled by the songs' channel gains + master soft clip)
  const capped = !r.used && r.peakRawDb + g > 0;
  if (capped) g = -r.peakRawDb;
  gains[r.id] = Math.round(g * 10) / 10;
  console.log(`${r.id.padEnd(13)} ${r.lSyn === null ? '    -   ' : r.lSyn.toFixed(1).padStart(8)}  ${r.lSmp.toFixed(1).padStart(9)}  ${gains[r.id].toFixed(1).padStart(7)}  ${(r.peakRawDb + gains[r.id]).toFixed(1).padStart(6)} dBFS${r.used ? '' : '  (new id: median)'}${capped ? '  (peak-capped)' : ''}`);
}
if (WRITE) {
  const file = path.join(ROOT, 'src', 'audio', 'sampled.ts');
  let src = fs.readFileSync(file, 'utf8');
  for (const [id, g] of Object.entries(gains)) {
    const re = new RegExp(`(S\\('${id}', '[^']+', '[a-z]+', [0-9.]+, \\{[^}]*?gainDb: )(-?[0-9.]+)`);
    src = src.replace(re, (_m, a) => `${a}${g}`);
  }
  fs.writeFileSync(file, src);
  console.log('updated', file);
}
