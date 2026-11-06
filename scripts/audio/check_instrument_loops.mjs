#!/usr/bin/env node
/**
 * Loop-quality renders for the sampled instruments: every looped zone (sustain loops and decaying
 * loops) is played at its own root for 8 s through the REAL sampler (src/audio/sampled.ts, MP3s
 * decoded with ffmpeg and installed like the music worker does), dry, at 48 kHz.
 *
 *   node scripts/audio/check_instrument_loops.mjs [--out DIR] [--sec 8] [--only set,set]
 *
 * Writes DIR/<set>.i16 (16-bit mono renders, concatenated) + DIR/<set>.json (per zone: offset in
 * the file, length, playback ratio, onset (pre) and the output positions of the loop seams). The
 * analysis is scripts/audio/analyze_instrument_loops.py.
 */
import fs from 'fs';
import path from 'path';
import { installBank, loadAudio } from './render-song.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const OUT = path.resolve(opt('--out', 'audio-verify/loops'));
const SEC = +opt('--sec', '8');
const ONLY = opt('--only', '');
const SR = 48000;
fs.mkdirSync(OUT, { recursive: true });

const A = await loadAudio();
installBank(A);
const bySet = new Map();
for (const spec of A.SAMPLED_SPECS) if (!bySet.has(spec.set)) bySet.set(spec.set, spec);
let total = 0;
for (const set of A.SAMPLE_SETS) {
  if (ONLY && !ONLY.split(',').includes(set.name)) continue;
  const spec = bySet.get(set.name);
  if (!spec) continue;
  const inst = A.INSTRUMENTS[spec.id];
  const zones = [];
  const chunks = [];
  let at = 0;
  set.zones.forEach((z, zi) => {
    if (z.ls === undefined || z.le === undefined || z.le - z.ls <= 16) return;
    // pick exactly this zone: its own pitch, layer and articulation (round robin)
    const vr = spec.rr === 'set' || spec.rr === 'art' ? (spec.art ? spec.art.findIndex((a) => a[0] === z.r) : z.r) : 0;
    const midi = spec.unpitched ? 60 : z.p;
    const ch = A.debugChoice(spec.id, midi, Math.max(0, vr), z.l);
    if (!ch || ch.zone.o !== z.o) return;
    const s = inst.make(SR, midi, Math.max(0, vr), SEC, z.l);
    const mono = new Float32Array(s.l.length);
    for (let i = 0; i < mono.length; i++) mono[i] = s.r ? 0.5 * (s.l[i] + s.r[i]) : s.l[i];
    const inc = set.sr / SR;
    const seams = [];
    for (let k = 0; k < 400; k++) {
      const pos = (z.le + k * (z.le - z.ls)) / inc;
      if (pos >= mono.length - 16) break;
      seams.push(pos);
    }
    zones.push({ zi, p: z.p, l: z.l, r: z.r, at, n: mono.length, pre: s.pre ?? 0, inc, ls: z.ls, le: z.le, dec: z.dec ?? 0, seams, loopOut: (z.le - z.ls) / inc });
    chunks.push(mono);
    at += mono.length;
  });
  if (!zones.length) continue;
  // 16-bit PCM (a full-scale int16 is plenty for these dry single-zone renders, and the files stay
  // small: every looped zone x 8 s)
  const all = new Int16Array(at);
  let o = 0;
  for (const c of chunks) {
    for (let i = 0; i < c.length; i++) all[o + i] = Math.max(-32768, Math.min(32767, Math.round(c[i] * 32767)));
    o += c.length;
  }
  fs.writeFileSync(path.join(OUT, set.name + '.i16'), Buffer.from(all.buffer));
  fs.writeFileSync(path.join(OUT, set.name + '.json'), JSON.stringify({ set: set.name, id: spec.id, sr: SR, setSr: set.sr, zones }));
  total += zones.length;
  console.log(`${set.name.padEnd(12)} ${String(zones.length).padStart(3)} looped zones`);
}
console.log(`total ${total} looped zones -> ${OUT}`);
