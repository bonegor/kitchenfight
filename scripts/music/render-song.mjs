#!/usr/bin/env node
/**
 * render-song.mjs — offline render of a song through the REAL renderer (src/audio/render.ts, the
 * same code the game's music worker runs) to a WAV file, plus a measurement report.
 *
 * Usage (from the repo root):
 *   node scripts/music/render-song.mjs <songId> out.wav [options]
 *   node scripts/music/render-song.mjs --file scratch.ts [--export name] out.wav [options]
 *   node scripts/music/render-song.mjs --all outdir/ [options]        every game track + a summary
 *
 *   --sr 48000        sample rate (default 48000)
 *   --loops N         write the intro + N passes of the loop (default 1 = the rendered buffer)
 *   --float           32-bit float WAV (default 16-bit PCM)
 *   --no-channels     skip the per-channel solo renders (faster)
 *   --target -16.6    loudness target in LUFS (default -16.6 = what all current tracks measure)
 *   --tol-lu 1.5      allowed deviation from the target before warning (LU)
 *   --json            machine-readable report on stdout
 *
 * Report: duration, loop window (intro / loop body, seconds and bars), sample peak (dBFS),
 * RMS (dBFS), integrated loudness (BS.1770 K-weighted, gated — "LUFS-ish": no true-peak
 * oversampling), max short-term (3 s) loudness, soft-clipper activity, spectral balance
 * (<250 Hz / 250 Hz-4 kHz / >4 kHz energy shares), loop-seam check (difference between the audio
 * just before the loop end and just before the loop start, which must be identical), per-channel
 * solo levels (LUFS, peak, share of the mix) and warnings — sequencer warnings (bad bar lengths),
 * channels whose instrument id the renderer does not know (they are SKIPPED: silent in the game
 * until the sampler provides them), clipping, level off target, inaudible channels.
 * Sampled instruments: in Node there are no decoded sample banks, so every instrument renders
 * with its synth version (the sampler team provides the sampled renderer).
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractSong } from './export-song.mjs';
import { loadAudio, parseArgs, resolveSong } from './lib/bundle.mjs';

const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-inf');

// ---------------------------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------------------------

/** RBJ biquad (transposed direct form II) */
function biquad(b0, b1, b2, a0, a1, a2) {
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  return (x, out = new Float32Array(x.length)) => {
    let z1 = 0;
    let z2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = x[i];
      const y = b0 * v + z1;
      z1 = b1 * v - a1 * y + z2;
      z2 = b2 * v - a2 * y;
      out[i] = y;
    }
    return out;
  };
}
function highShelf(sr, fc, gainDb, q) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * fc) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const s = 2 * Math.sqrt(A) * alpha;
  return biquad(A * (A + 1 + (A - 1) * c + s), -2 * A * (A - 1 + (A + 1) * c), A * (A + 1 + (A - 1) * c - s), A + 1 - (A - 1) * c + s, 2 * (A - 1 - (A + 1) * c), A + 1 - (A - 1) * c - s);
}
function highPass(sr, fc, q) {
  const w0 = (2 * Math.PI * fc) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  return biquad((1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + alpha, -2 * c, 1 - alpha);
}
function lowPass(sr, fc, q) {
  const w0 = (2 * Math.PI * fc) / sr;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  return biquad((1 - c) / 2, 1 - c, (1 - c) / 2, 1 + alpha, -2 * c, 1 - alpha);
}
/** BS.1770 K-weighting (pyloudnorm's parameterisation, valid at any sample rate) */
function kWeight(x, sr) {
  const s1 = highShelf(sr, 1681.974450955533, 3.999843853973347, 0.7071752369554196);
  const s2 = highPass(sr, 38.13547087602444, 0.5003270373238773);
  return s2(s1(x));
}
/** gated integrated loudness of [a, b) plus max short-term (3 s) loudness */
function loudness(L, R, sr, a, b) {
  const l = kWeight(L.subarray(a, b), sr);
  const r = kWeight(R.subarray(a, b), sr);
  const n = l.length;
  const blk = Math.round(0.4 * sr);
  const hop = Math.round(0.1 * sr);
  // prefix sums of squares (double precision)
  const ps = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) ps[i + 1] = ps[i] + l[i] * l[i] + r[i] * r[i];
  const lk = (z) => -0.691 + 10 * Math.log10(z);
  const z = [];
  for (let s = 0; s + blk <= n; s += hop) z.push((ps[s + blk] - ps[s]) / blk);
  let integ = -Infinity;
  const g1 = z.filter((v) => v > 0 && lk(v) > -70);
  if (g1.length) {
    const rel = lk(g1.reduce((x, y) => x + y, 0) / g1.length) - 10;
    const g2 = g1.filter((v) => lk(v) > rel);
    if (g2.length) integ = lk(g2.reduce((x, y) => x + y, 0) / g2.length);
  }
  let st = -Infinity;
  const w3 = Math.round(3 * sr);
  for (let s = 0; s + w3 <= n; s += hop) st = Math.max(st, lk((ps[s + w3] - ps[s]) / w3));
  if (n < w3 && n > 0) st = lk(ps[n] / n);
  return { lufs: integ, shortTermMax: st };
}
function stats(L, R, a, b) {
  let peak = 0;
  let ss = 0;
  let dc = 0;
  for (let i = a; i < b; i++) {
    const l = L[i];
    const r = R[i];
    const m = Math.max(Math.abs(l), Math.abs(r));
    if (m > peak) peak = m;
    ss += l * l + r * r;
    dc += l + r;
  }
  const n = Math.max(1, b - a);
  return { peak, rms: Math.sqrt(ss / (2 * n)), dc: dc / (2 * n) };
}
function bands(L, R, sr, a, b) {
  const mono = new Float32Array(b - a);
  for (let i = a; i < b; i++) mono[i - a] = 0.5 * (L[i] + R[i]);
  const e = (x) => x.reduce((s, v) => s + v * v, 0);
  const low = lowPass(sr, 250, 0.7071)(lowPass(sr, 250, 0.7071)(mono));
  const high = highPass(sr, 4000, 0.7071)(highPass(sr, 4000, 0.7071)(mono));
  const tot = e(mono) || 1;
  const el = e(low);
  const eh = e(high);
  const em = Math.max(0, tot - el - eh);
  return { lowDb: 10 * Math.log10(el / tot || 1e-12), midDb: 10 * Math.log10(em / tot || 1e-12), highDb: 10 * Math.log10(eh / tot || 1e-12) };
}
/** the loop plays [ls, le) and jumps back: the audio before le must equal the audio before ls */
function seam(L, R, sr, ls, le) {
  const n = Math.min(Math.round(0.5 * sr), ls);
  let md = 0;
  for (let k = 1; k <= n; k++) {
    md = Math.max(md, Math.abs(L[le - k] - L[ls - k]), Math.abs(R[le - k] - R[ls - k]));
  }
  // sample-to-sample jump across the seam vs. typical local jumps
  const jump = Math.max(Math.abs(L[ls] - L[le - 1]), Math.abs(R[ls] - R[le - 1]));
  let typ = 0;
  for (let k = 1; k < 256; k++) typ = Math.max(typ, Math.abs(L[ls + k] - L[ls + k - 1]), Math.abs(R[ls + k] - R[ls + k - 1]));
  return { mismatchDb: db(md), jump, typicalJump: typ };
}
function firstSound(L, R, thr) {
  for (let i = 0; i < L.length; i++) if (Math.abs(L[i]) > thr || Math.abs(R[i]) > thr) return i;
  return -1;
}

// ---------------------------------------------------------------------------------------------
// WAV
// ---------------------------------------------------------------------------------------------

function writeWav(file, chans, sr, float) {
  const n = chans[0].length;
  const nc = chans.length;
  const bps = float ? 4 : 2;
  const data = Buffer.alloc(n * nc * bps);
  let o = 0;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      const v = chans[c][i];
      if (float) data.writeFloatLE(v, o);
      else data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), o);
      o += bps;
    }
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(float ? 3 : 1, 20);
  h.writeUInt16LE(nc, 22);
  h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * nc * bps, 28);
  h.writeUInt16LE(nc * bps, 32);
  h.writeUInt16LE(bps * 8, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

function withLoops(r, loops) {
  if (!r.loop || loops <= 1) return [r.left, r.right];
  const body = r.loopEnd - r.loopStart;
  const n = r.length + (loops - 1) * body;
  const out = [new Float32Array(n), new Float32Array(n)];
  out[0].set(r.left);
  out[1].set(r.right);
  for (let k = 1; k < loops; k++) {
    out[0].set(r.left.subarray(r.loopStart, r.loopEnd), r.length + (k - 1) * body);
    out[1].set(r.right.subarray(r.loopStart, r.loopEnd), r.length + (k - 1) * body);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------

export async function analyseSong(mods, song, o = {}) {
  const sr = o.sr ?? 48000;
  const { renderSong } = mods.render;
  const { Slicer } = mods.dsp;
  const INST = mods.inst.INSTRUMENTS;
  const meta = extractSong(mods.seq, song, {});
  const warnings = [];
  // channels, instruments, event counts
  const chans = [];
  for (const [ch, def] of Object.entries(song.channels)) {
    const evs = meta.channels[ch]?.events ?? [];
    chans.push({ ch, inst: def.inst, known: !!INST[def.inst], events: evs.filter((e) => !e.grace).length, gain: def.gain });
  }
  const unknown = chans.filter((c) => !c.known);
  for (const c of unknown) warnings.push(`channel "${c.ch}": instrument "${c.inst}" is unknown to the renderer — its ${c.events} note(s) are SKIPPED`);
  for (const c of chans) if (c.known && !c.events) warnings.push(`channel "${c.ch}" (${c.inst}) has no events`);
  for (const w of meta.warnings) warnings.push(`sequencer: ${w}`);

  const t0 = performance.now();
  const r = await renderSong(song, sr, { slicer: new Slicer(1e9) });
  const ms = performance.now() - t0;
  const rw = new Map();
  for (const w of r.stats.warnings) {
    if (/^no instrument for channel/.test(w)) continue; // reported above, once per channel
    if (meta.warnings.some((m) => w.includes(m))) continue;
    rw.set(w, (rw.get(w) ?? 0) + 1);
  }
  for (const [w, n] of rw) warnings.push(`renderer: ${w}${n > 1 ? ` (x${n})` : ''}`);

  const L = r.left;
  const R = r.right;
  // the window that the player hears repeatedly (loop body) or the whole one-shot
  const a = r.loop ? r.loopStart : 0;
  const b = r.loop ? r.loopEnd : r.length;
  const st = stats(L, R, a, b);
  const whole = stats(L, R, 0, r.length);
  const ld = loudness(L, R, sr, a, b);
  const ldAll = loudness(L, R, sr, 0, r.length);
  const bl = bands(L, R, sr, a, b);
  const first = firstSound(L, R, Math.pow(10, -50 / 20));
  const rep = {
    song: song.id,
    sr,
    renderMs: Math.round(ms),
    durationSec: r.length / sr,
    loop: r.loop,
    introSec: r.loop ? r.loopStart / sr : null,
    loopStartSec: r.loop ? r.loopStart / sr : null,
    loopEndSec: r.loop ? r.loopEnd / sr : null,
    loopBodySec: r.loop ? (r.loopEnd - r.loopStart) / sr : null,
    loopBars: r.loop ? { from: meta.loop.loopStartBar, to: meta.loop.loopEndBar - 1, section: meta.loop.loopFromSection } : null,
    form: meta.form.map((f) => `${f.name}@${f.startSec.toFixed(2)}s`).join(' '),
    events: r.stats.events,
    peakDbfs: db(whole.peak),
    rmsDbfs: db(st.rms),
    lufs: ld.lufs,
    lufsWhole: ldAll.lufs,
    shortTermMaxLufs: ld.shortTermMax,
    dc: st.dc,
    softClipSamples: r.stats.clipped,
    softClipPct: (100 * r.stats.clipped) / (2 * r.length),
    bands: bl,
    firstSoundSec: first < 0 ? null : first / sr,
    channels: [],
    unknownInstruments: unknown.map((c) => ({ channel: c.ch, inst: c.inst, notes: c.events })),
    warnings,
  };
  if (r.loop) {
    const s = seam(L, R, sr, r.loopStart, r.loopEnd);
    rep.seamMismatchDb = s.mismatchDb;
    rep.seamJump = s.jump;
    if (s.mismatchDb > -60) warnings.push(`loop seam: audio before the loop end differs from the audio before the loop start by ${fmt(s.mismatchDb)} dBFS (click risk)`);
    if (s.jump > Math.max(0.05, 3 * s.typicalJump)) warnings.push(`loop seam: sample jump ${s.jump.toFixed(3)} across the seam (typical ${s.typicalJump.toFixed(3)})`);
  }
  if (whole.peak > 0.891) warnings.push(`peak ${fmt(db(whole.peak), 2)} dBFS is above -1 dBFS`);
  if (rep.softClipPct > 0.1) warnings.push(`soft clipper active on ${rep.softClipPct.toFixed(2)} % of samples (master too hot: lower gainDb)`);
  const target = o.target ?? -16.6;
  const tolLu = o.tolLu ?? 1.5;
  if (Number.isFinite(ld.lufs) && Math.abs(ld.lufs - target) > tolLu) warnings.push(`loudness ${fmt(ld.lufs)} LUFS is ${fmt(ld.lufs - target)} LU off the ${target} LUFS target (adjust gainDb)`);
  if (Math.abs(st.dc) > 0.002) warnings.push(`DC offset ${st.dc.toFixed(4)}`);
  if (rep.firstSoundSec !== null && rep.firstSoundSec > 0.5) warnings.push(`first sound only at ${rep.firstSoundSec.toFixed(2)} s`);

  if (o.channels !== false) {
    for (const c of chans) {
      if (!c.known || !c.events) {
        rep.channels.push({ ch: c.ch, inst: c.inst, notes: c.events, skipped: !c.known });
        continue;
      }
      const rs = await renderSong(song, sr, { slicer: new Slicer(1e9), solo: [c.ch] });
      const s2 = stats(rs.left, rs.right, a, b);
      const l2 = loudness(rs.left, rs.right, sr, a, b);
      const row = {
        ch: c.ch, inst: c.inst, notes: c.events, gainDb: c.gain, lufs: l2.lufs, shortTermMaxLufs: l2.shortTermMax,
        peakDbfs: db(s2.peak), rmsDbfs: db(s2.rms), relLu: l2.lufs - ld.lufs, relStLu: l2.shortTermMax - ld.lufs,
      };
      rep.channels.push(row);
      // sparse accents (crash, glock) have a low integrated level: judge audibility by their loudest 3 s
      if (Number.isFinite(row.relStLu) && row.relStLu < -30) warnings.push(`channel "${c.ch}" (${c.inst}): even its loudest 3 s are ${fmt(-row.relStLu)} LU below the mix — check it is audible`);
    }
  }
  return { rep, r };
}

function printReport(rep) {
  const out = [];
  out.push(`${rep.song}: ${rep.durationSec.toFixed(2)} s @ ${rep.sr} Hz, ${rep.events} events, rendered in ${rep.renderMs} ms`);
  if (rep.loop) out.push(`  loop: plays 0 → ${rep.loopEndSec.toFixed(3)} s, then repeats ${rep.loopStartSec.toFixed(3)} → ${rep.loopEndSec.toFixed(3)} s (body ${rep.loopBodySec.toFixed(3)} s = bars ${rep.loopBars.from}-${rep.loopBars.to} from section "${rep.loopBars.section}"; seam mismatch ${fmt(rep.seamMismatchDb)} dBFS)`);
  else out.push(`  one-shot (no loop)`);
  out.push(`  form: ${rep.form}`);
  out.push(`  ${rep.loop ? 'loop body' : 'whole'}: integrated ${fmt(rep.lufs)} LUFS (whole file ${fmt(rep.lufsWhole)}), short-term max ${fmt(rep.shortTermMaxLufs)} LUFS, RMS ${fmt(rep.rmsDbfs)} dBFS, sample peak ${fmt(rep.peakDbfs, 2)} dBFS`);
  out.push(`  soft clipper: ${rep.softClipSamples} samples (${rep.softClipPct.toFixed(3)} %), DC ${rep.dc.toFixed(5)}, first sound at ${rep.firstSoundSec === null ? '-' : rep.firstSoundSec.toFixed(3) + ' s'}`);
  out.push(`  spectral balance: <250 Hz ${fmt(rep.bands.lowDb)} dB, 250 Hz-4 kHz ${fmt(rep.bands.midDb)} dB, >4 kHz ${fmt(rep.bands.highDb)} dB (share of total energy)`);
  if (rep.unknownInstruments.length) out.push(`  SKIPPED (unknown instrument ids): ${rep.unknownInstruments.map((u) => `${u.channel}=${u.inst} (${u.notes} notes)`).join(', ')}`);
  if (rep.channels.length) {
    out.push('  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS');
    for (const c of rep.channels) {
      if (c.skipped || c.lufs === undefined) {
        out.push(`  ${c.ch.padEnd(12)} ${c.inst.padEnd(15)} ${String(c.notes).padStart(5)}  ${c.skipped ? 'SKIPPED (unknown instrument)' : '(no events)'}`);
        continue;
      }
      out.push(`  ${c.ch.padEnd(12)} ${c.inst.padEnd(15)} ${String(c.notes).padStart(5)}  ${String(c.gainDb).padStart(5)}  ${fmt(c.lufs).padStart(9)}  ${fmt(c.relLu).padStart(6)}  ${fmt(c.shortTermMaxLufs).padStart(10)}  ${fmt(c.peakDbfs, 1).padStart(9)}`);
    }
  }
  if (rep.warnings.length) {
    out.push(`  warnings (${rep.warnings.length}):`);
    for (const w of rep.warnings) out.push(`   - ${w}`);
  } else out.push('  warnings: none');
  return out.join('\n');
}

async function main() {
  process.stdout.on('error', (e) => {
    if (e.code === 'EPIPE') process.exit(0);
    throw e;
  });
  const { pos, opt } = parseArgs(process.argv.slice(2), ['float', 'no-channels', 'json', 'help']);
  if (opt.help || (!pos.length && !opt.all)) {
    const src = fs.readFileSync(new URL(import.meta.url), 'utf8');
    process.stdout.write(src.slice(src.indexOf('/**') + 3, src.indexOf('*/')).replace(/^ \* ?/gm, '') + '\n');
    process.exit(opt.help ? 0 : 2);
  }
  const sr = opt.sr ? Number(opt.sr) : 48000;
  const loops = opt.loops ? Number(opt.loops) : 1;
  const o = { sr, channels: !opt['no-channels'], target: opt.target !== undefined ? Number(opt.target) : -16.6, tolLu: opt['tol-lu'] !== undefined ? Number(opt['tol-lu']) : 1.5 };
  const mods = await loadAudio({ render: true, songFile: opt.file });
  const jobs = [];
  if (opt.all) {
    const dir = typeof opt.all === 'string' ? opt.all : pos[0];
    if (!dir) throw new Error('--all needs an output directory');
    for (const id of Object.keys(mods.SONGS)) jobs.push({ song: mods.SONGS[id], out: path.join(dir, `${id}.wav`) });
  } else {
    let id;
    let out;
    if (opt.file) [id, out] = pos.length >= 2 ? pos : [undefined, pos[0]];
    else [id, out] = pos;
    if (!out) throw new Error('missing output .wav path');
    jobs.push({ song: resolveSong(mods, id, opt.export), out });
  }
  const reps = [];
  let worst = 0;
  for (const j of jobs) {
    const { rep, r } = await analyseSong(mods, j.song, o);
    writeWav(j.out, withLoops(r, loops), sr, !!opt.float);
    rep.wav = path.resolve(j.out);
    reps.push(rep);
    if (rep.unknownInstruments.length) worst = Math.max(worst, 1);
    if (!opt.json) {
      process.stdout.write(printReport(rep) + `\n  wrote ${rep.wav}${loops > 1 ? ` (${loops} loop passes)` : ''}\n\n`);
    }
  }
  if (opt.json) process.stdout.write(JSON.stringify(reps.length === 1 ? reps[0] : reps, null, 1) + '\n');
  else if (reps.length > 1) {
    const out = ['summary   LUFS(loop)  peak dBFS  softclip%  seam dB  warnings'];
    for (const r of reps) out.push(`${r.song.padEnd(10)} ${fmt(r.lufs).padStart(9)}  ${fmt(r.peakDbfs, 2).padStart(9)}  ${r.softClipPct.toFixed(3).padStart(9)}  ${r.loop ? fmt(r.seamMismatchDb).padStart(7) : '    -  '}  ${r.warnings.length}`);
    process.stdout.write(out.join('\n') + '\n');
  }
  process.exit(worst);
}

main().catch((e) => {
  process.stderr.write(`render-song: ${e.stack || e.message}\n`);
  process.exit(2);
});
