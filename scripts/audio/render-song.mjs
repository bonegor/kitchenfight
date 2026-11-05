#!/usr/bin/env node
/**
 * Offline renderer for KITCHEN FIGHT music through the REAL src/audio code (bundled with esbuild
 * from node_modules), with the recorded instrument samples registered exactly like the music
 * worker does (MP3 sprites decoded with ffmpeg → installSampleBank → INSTRUMENTS).
 *
 * Usage (from the repository root):
 *   node scripts/audio/render-song.mjs <songId|all> [options]      render songs to WAV
 *   node scripts/audio/render-song.mjs --pattern <instId|all|sampled> [options]
 *                                       render a test pattern per instrument: every zone root and
 *                                       the notes between zones (full playable range plus one
 *                                       fold beyond), each velocity layer and round robin,
 *                                       dry (no reverb, no master); writes <id>.wav + <id>.json
 *                                       (note list with exact start samples for the analysis)
 * Options:
 *   --out DIR         output directory (default: ./audio-out)
 *   --sr N            render sample rate (default 48000)
 *   --synth           do not install the samples (synthesized instruments, for A/B)
 *   --keep-delay      decode the MP3s WITHOUT trimming the encoder delay (simulates decoders that
 *                     ignore the LAME header; the marker alignment must still place every zone)
 *   --json            print one JSON line per rendered file (stats) instead of text
 *   --solo a,b        render only these song channels
 * Exit code 1 when a song renders with warnings or non-finite samples.
 */
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));

// ------------------------------------------------------------------------------- arguments
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const flag = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
};
const OUT = path.resolve(opt('--out', 'audio-out'));
const SR = +opt('--sr', '48000');
const SOLO = opt('--solo', '');
const PATTERN = opt('--pattern', '');
const SYNTH = flag('--synth');
const KEEP_DELAY = flag('--keep-delay');
const JSON_OUT = flag('--json');
const target = args[0] ?? (PATTERN ? '' : 'all');
fs.mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------------------- bundle src/audio
export async function loadAudio() {
  const esbuild = require('esbuild');
  const src = (p) => JSON.stringify(path.join(ROOT, 'src', 'audio', p));
  const entry = [
    `export { SONGS } from ${src('songs/index.ts')};`,
    `export { renderSong, clearSampleCache } from ${src('render.ts')};`,
    `export { INSTRUMENTS } from ${src('instruments.ts')};`,
    `export { installSampleBank, SAMPLED_SPECS, INSTRUMENT_ALIASES, debugChoice } from ${src('sampled.ts')};`,
    `export { SAMPLE_SETS } from ${src('assets/inst/manifest.ts')};`,
    `export { Slicer } from ${src('dsp.ts')};`,
  ].join('\n');
  const res = await esbuild.build({
    stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    target: 'node18',
    logLevel: 'error',
  });
  const tmp = path.join(os.tmpdir(), `kf-audio-${process.pid}-${Date.now()}.mjs`);
  fs.writeFileSync(tmp, res.outputFiles[0].text);
  try {
    return await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

// ------------------------------------------------------------------------------- sample bank
export function decodeMp3(file, channels, keepDelay = false) {
  const a = ['-v', 'error'];
  if (keepDelay) a.push('-flags2', '+skip_manual');
  a.push('-i', file, '-f', 'f32le', '-acodec', 'pcm_f32le', '-ac', String(channels), '-');
  const buf = execFileSync('ffmpeg', a, { maxBuffer: 1 << 30 });
  const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  const n = Math.floor(all.length / channels);
  const out = [];
  for (let c = 0; c < channels; c++) {
    const d = new Float32Array(n);
    for (let i = 0; i < n; i++) d[i] = all[i * channels + c];
    out.push(d);
  }
  return out;
}

export function installBank(A, keepDelay = false) {
  const t0 = performance.now();
  const pcm = [];
  for (const s of A.SAMPLE_SETS) {
    const f = path.join(ROOT, 'src', 'audio', 'assets', 'inst', s.file);
    pcm.push({ name: s.name, sr: s.sr, data: decodeMp3(f, s.ch, keepDelay) });
  }
  const decodeMs = performance.now() - t0;
  const report = A.installSampleBank({ sets: A.SAMPLE_SETS, pcm }, (defs) => {
    for (const d of defs) A.INSTRUMENTS[d.id] = d;
  });
  A.clearSampleCache();
  return { ...report, decodeMs, installMs: performance.now() - t0 - decodeMs };
}

// ------------------------------------------------------------------------------- WAV
export function writeWav(file, chans, sr) {
  const n = chans[0].length;
  const nc = chans.length;
  const b = Buffer.alloc(44 + n * nc * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * nc * 2, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(nc, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * nc * 2, 28);
  b.writeUInt16LE(nc * 2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * nc * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < nc; c++) {
      const x = Math.max(-1, Math.min(1, chans[c][i]));
      b.writeInt16LE(Math.round(x * 32767), o);
      o += 2;
    }
  fs.writeFileSync(file, b);
}

function levels(L, R) {
  let peak = 0;
  let acc = 0;
  let nan = 0;
  for (let i = 0; i < L.length; i++) {
    const l = L[i];
    const r = R[i];
    if (!Number.isFinite(l) || !Number.isFinite(r)) {
      nan++;
      continue;
    }
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    acc += l * l + r * r;
  }
  const rms = Math.sqrt(acc / (2 * Math.max(1, L.length)));
  return { peakDb: 20 * Math.log10(peak + 1e-12), rmsDb: 20 * Math.log10(rms + 1e-12), nan };
}

// ------------------------------------------------------------------------------- test patterns
/** Notes to test for one instrument: zone roots + in-between notes, layers, round robins. */
function patternNotes(A, id) {
  const spec = A.SAMPLED_SPECS.find((s) => s.id === id);
  const set = spec && A.SAMPLE_SETS.find((s) => s.name === spec.set);
  const notes = [];
  if (!spec || !set) {
    for (const m of [48, 60, 72]) notes.push({ m, v: 0.8, vr: 0 });
    return { notes, spec: null };
  }
  const layerVel = [];
  const th = spec.layers ?? [];
  for (let l = 0; l <= th.length; l++) {
    const lo = l === 0 ? 0.3 : th[l - 1];
    const hi = l === th.length ? 1.2 : th[l];
    layerVel.push(+((lo + hi) / 2).toFixed(3));
  }
  const nv = spec.variants ?? 1;
  if (spec.unpitched) {
    for (const v of layerVel) for (let vr = 0; vr < nv; vr++) notes.push({ m: 60, v, vr });
    return { notes, spec };
  }
  const roots = [...new Set(set.zones.map((z) => Math.round(z.p)))].sort((a, b) => a - b);
  const keys = new Set();
  for (let i = 0; i < roots.length; i++) {
    keys.add(roots[i]);
    if (i + 1 < roots.length && roots[i + 1] - roots[i] > 1) keys.add(Math.round((roots[i] + roots[i + 1]) / 2));
  }
  const lo = Math.min(...set.zones.map((z) => z.lo));
  const hi = Math.max(...set.zones.map((z) => z.hi));
  keys.add(lo);
  keys.add(hi);
  keys.add(hi + 7); // beyond the range: folds an octave
  keys.add(lo - 7);
  const sorted = [...keys].sort((a, b) => a - b);
  const vMid = layerVel[layerVel.length - 1];
  for (const m of sorted) notes.push({ m, v: vMid, vr: 0 });
  for (let l = 0; l < layerVel.length - 1; l++) for (const m of roots) notes.push({ m, v: layerVel[l], vr: 0 });
  for (let vr = 1; vr < nv; vr++) for (const m of roots) notes.push({ m, v: vMid, vr });
  return { notes, spec };
}

async function renderPattern(A, id) {
  const inst = A.INSTRUMENTS[id];
  if (!inst) throw new Error('unknown instrument ' + id);
  const { notes, spec } = patternNotes(A, id);
  const sustain = inst.kind === 'sustain';
  const noteSec = sustain ? 1.2 : 1.0;
  const gap = Math.max(inst.ring ? 2.5 : sustain ? 2.0 : 1.8, (spec?.maxLen ?? 0) + 0.5);
  const steps = notes.length * gap + 3;
  const part = () =>
    notes.map((n, i) => ({ s: i * gap + 0.5, d: noteSec, m: n.m, v: n.v, ch: 'x', vr: n.vr, gate: 1 }));
  const song = {
    id: 'pattern-' + id,
    bpm: 60,
    stepsPerBeat: 1,
    barSteps: steps,
    scale: 'C major',
    channels: { x: { inst: id, gain: 0, pan: 0, send: 0, hum: 0 } },
    sections: { A: { bars: 1, parts: [part] } },
    form: ['A'],
    loopFrom: null,
    reverb: { rt60: 1, size: 1, damp: 0.5, predelay: 0.02 },
    gainDb: 0,
    humanize: 0,
    tail: 1,
  };
  const r = await A.renderSong(song, SR, { slicer: new A.Slicer(1e9), raw: true });
  const meta = notes.map((n, i) => {
    const t = i * gap + 0.5;
    const choice = A.debugChoice ? A.debugChoice(id, n.m, n.vr, inst.layerOf ? inst.layerOf(n.v) : 0) : null;
    const set = choice ? A.SAMPLE_SETS.find((x) => x.name === choice.set) : null;
    return { ...n, t, start: Math.round(t * SR), dur: noteSec, layer: inst.layerOf ? inst.layerOf(n.v) : 0, zone: choice ? choice.zone : null, folded: choice ? choice.midi : n.m, set_sr: set ? set.sr : null };
  });
  const base = path.join(OUT, id);
  writeWav(base + '.wav', [r.left, r.right], SR);
  fs.writeFileSync(base + '.json', JSON.stringify({ id, sr: SR, kind: inst.kind, ring: !!inst.ring, release: inst.release, unpitched: !!spec?.unpitched, sampled: !SYNTH, gap, notes: meta, warnings: r.stats.warnings }, null, 1));
  return { id, notes: notes.length, seconds: r.length / SR, ms: r.stats.ms, ...levels(r.left, r.right), warnings: r.stats.warnings };
}

// ------------------------------------------------------------------------------- main
async function main() {
  const A = await loadAudio();
  let bank = null;
  if (!SYNTH) bank = installBank(A, KEEP_DELAY);
  if (bank && !JSON_OUT) {
    console.log(`sample bank: ${bank.sets} sets, ${bank.instruments.length} instruments, ${(bank.bytes / 1048576).toFixed(1)} MB Int16, decode ${bank.decodeMs.toFixed(0)} ms, install ${bank.installMs.toFixed(0)} ms`);
    const shifts = [...new Set(Object.values(bank.shifts))];
    console.log(`decoder shifts found: ${shifts.join(', ')}${bank.warnings.length ? '\nWARNINGS: ' + bank.warnings.join('; ') : ''}`);
  }
  let bad = 0;
  if (PATTERN) {
    const ids =
      PATTERN === 'all' || PATTERN === 'sampled'
        ? A.SAMPLED_SPECS.map((s) => s.id).filter((id) => A.INSTRUMENTS[id])
        : PATTERN.split(',');
    for (const id of ids) {
      const s = await renderPattern(A, id);
      if (JSON_OUT) console.log(JSON.stringify(s));
      else console.log(`${id.padEnd(13)} ${String(s.notes).padStart(3)} notes ${s.seconds.toFixed(1)} s  peak ${s.peakDb.toFixed(1)} dB  rms ${s.rmsDb.toFixed(1)} dB  ${s.ms.toFixed(0)} ms${s.warnings.length ? '  WARN ' + s.warnings.join('; ') : ''}`);
      if (s.nan || s.warnings.length) bad++;
    }
  } else {
    const ids = target === 'all' ? Object.keys(A.SONGS) : target.split(',');
    for (const id of ids) {
      const song = A.SONGS[id];
      if (!song) throw new Error('unknown song ' + id);
      const r = await A.renderSong(song, SR, { slicer: new A.Slicer(1e9), solo: SOLO ? SOLO.split(',') : undefined });
      const lv = levels(r.left, r.right);
      writeWav(path.join(OUT, `${id}${SYNTH ? '-synth' : ''}.wav`), [r.left, r.right], SR);
      const st = { id, seconds: +(r.length / SR).toFixed(2), loop: r.loop, loopStart: r.loopStart, loopEnd: r.loopEnd, ms: Math.round(r.stats.ms), synthMs: Math.round(r.stats.synthMs), mixMs: Math.round(r.stats.mixMs), peakDb: +lv.peakDb.toFixed(2), rmsDb: +lv.rmsDb.toFixed(2), clipped: r.stats.clipped, nan: lv.nan, warnings: r.stats.warnings, samples: r.stats.samplesSynth };
      if (JSON_OUT) console.log(JSON.stringify(st));
      else console.log(`${id.padEnd(10)} ${st.seconds.toFixed(1).padStart(6)} s  render ${String(st.ms).padStart(5)} ms (samples ${st.synthMs} ms, mix ${st.mixMs} ms)  peak ${st.peakDb.toFixed(1)} dBFS  rms ${st.rmsDb.toFixed(1)} dBFS  soft-clipped ${st.clipped}${st.warnings.length ? '  WARN ' + st.warnings.slice(0, 3).join('; ') : ''}${lv.nan ? '  NaN ' + lv.nan : ''}`);
      if (st.nan || st.warnings.length) bad++;
    }
  }
  process.exitCode = bad ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
