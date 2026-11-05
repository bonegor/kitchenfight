/**
 * Shared loader for the scripts in scripts/music/: bundles the game's TypeScript audio modules
 * (src/audio/sequencer.ts, src/audio/songs/index.ts, optionally src/audio/render.ts and a scratch
 * song file) with esbuild into ONE temporary ESM file, imports it in Node and deletes it again.
 * Nothing is mocked: the songs and the renderer run exactly as in the game's worker.
 *
 *   import { loadAudio, resolveSong, ROOT } from './lib/bundle.mjs';
 *   const mods = await loadAudio({ render: true, songFile: 'path/to/scratch.ts' });
 *   const song = resolveSong(mods, 'title');            // or the scratch file's SongDef
 */
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Repository (worktree) root: scripts/music/lib → ../../.. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const esc = (p) => JSON.stringify(p.split(path.sep).join('/'));

/**
 * Bundle and import the audio modules.
 * @param {{render?: boolean, songFile?: string, samples?: boolean}} o
 *   samples: also bundle the recorded-instrument bank (src/audio/sampled.ts + assets manifest) so
 *   installSamples(mods) can register the sampled instruments exactly like the game's worker.
 * @returns {Promise<{SONGS: Record<string, any>, seq: any, render?: any, inst?: any, dsp?: any, user?: Record<string, any>, userPath?: string}>}
 */
export async function loadAudio(o = {}) {
  const lines = [
    `export { SONGS } from ${esc(path.join(ROOT, 'src/audio/songs/index.ts'))};`,
    `export * as seq from ${esc(path.join(ROOT, 'src/audio/sequencer.ts'))};`,
  ];
  if (o.render) {
    lines.push(`export * as render from ${esc(path.join(ROOT, 'src/audio/render.ts'))};`);
    lines.push(`export * as inst from ${esc(path.join(ROOT, 'src/audio/instruments.ts'))};`);
    lines.push(`export * as dsp from ${esc(path.join(ROOT, 'src/audio/dsp.ts'))};`);
    if (o.samples && hasSampleBank()) {
      lines.push(`export * as sampled from ${esc(path.join(ROOT, 'src/audio/sampled.ts'))};`);
      lines.push(`export { SAMPLE_SETS } from ${esc(path.join(ROOT, 'src/audio/assets/inst/manifest.ts'))};`);
    }
  }
  let userPath;
  if (o.songFile) {
    userPath = path.resolve(o.songFile);
    if (!fs.existsSync(userPath)) throw new Error(`song file not found: ${userPath}`);
    lines.push(`export * as user from ${esc(userPath)};`);
  }
  const res = await build({
    stdin: { contents: lines.join('\n'), resolveDir: ROOT, sourcefile: 'kf-music-entry.ts', loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    write: false,
    logLevel: 'silent',
    // Vite-only module features (import.meta.glob for sample assets) must not break the bundle:
    // they become no-ops here, so sampled instruments fall back to their synth versions.
    define: { 'import.meta.env': '{"DEV":false,"PROD":true,"MODE":"node"}', 'import.meta.glob': '__kfGlob' },
    banner: { js: 'const __kfGlob = () => ({});' },
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kf-music-'));
  const file = path.join(dir, 'bundle.mjs');
  fs.writeFileSync(file, res.outputFiles[0].text);
  try {
    const mods = await import(pathToFileURL(file).href);
    return { ...mods, userPath };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const isSongDef = (x) => !!x && typeof x === 'object' && x.sections && x.channels && Array.isArray(x.form) && typeof x.bpm === 'number';

/**
 * Pick the SongDef: a game track id ('title', 'kitchen', …; also matches SongDef.id) or, when a
 * scratch file was bundled, its default export / the named export `exportName` / the only SongDef
 * it exports.
 */
export function resolveSong(mods, id, exportName) {
  if (mods.user) {
    const u = mods.user;
    if (exportName) {
      if (!isSongDef(u[exportName])) throw new Error(`export "${exportName}" of ${mods.userPath} is not a SongDef`);
      return u[exportName];
    }
    if (isSongDef(u.default)) return u.default;
    const defs = Object.entries(u).filter(([, v]) => isSongDef(v));
    if (id) {
      const hit = defs.find(([k, v]) => k === id || v.id === id);
      if (hit) return hit[1];
    }
    if (defs.length === 1) return defs[0][1];
    if (!defs.length) throw new Error(`${mods.userPath} exports no SongDef`);
    throw new Error(`${mods.userPath} exports several SongDefs (${defs.map(([k]) => k).join(', ')}): pass --export <name>`);
  }
  const S = mods.SONGS;
  if (S[id]) return S[id];
  const hit = Object.values(S).find((s) => s.id === id);
  if (hit) return hit;
  throw new Error(`unknown song "${id}" (known: ${Object.keys(S).join(', ')})`);
}

/** Tiny argv parser: positional args + --flag / --key value / --key=value. */
export function parseArgs(argv, booleans = []) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) opt[a.slice(2, eq)] = a.slice(eq + 1);
      else {
        const k = a.slice(2);
        if (booleans.includes(k) || i + 1 >= argv.length || argv[i + 1].startsWith('--')) opt[k] = true;
        else opt[k] = argv[++i];
      }
    } else pos.push(a);
  }
  return { pos, opt };
}

/** True when this worktree has the recorded-instrument bank (src/audio/assets/inst/manifest.ts). */
export function hasSampleBank() {
  return fs.existsSync(path.join(ROOT, 'src/audio/assets/inst/manifest.ts')) && fs.existsSync(path.join(ROOT, 'src/audio/sampled.ts'));
}

/** Decode one MP3 sprite to planar Float32 channels with ffmpeg (the encoder delay is trimmed like
 *  browsers do; the bank re-aligns every zone on its marker impulse anyway). */
function decodeMp3(file, channels) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-acodec', 'pcm_f32le', '-ac', String(channels), '-'], { maxBuffer: 1 << 30 });
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

/**
 * Register the recorded instruments (the same installSampleBank call the game's music worker
 * makes), so renders use the real samples instead of the synth fallbacks. Needs a bundle loaded
 * with loadAudio({ render: true, samples: true }). Returns null when the bank is unavailable.
 * @returns {{sets: number, ms: number} | null}
 */
export function installSamples(mods) {
  if (!mods.sampled || !mods.SAMPLE_SETS) return null;
  const t0 = performance.now();
  const pcm = mods.SAMPLE_SETS.map((s) => ({ name: s.name, sr: s.sr, data: decodeMp3(path.join(ROOT, 'src/audio/assets/inst', s.file), s.ch) }));
  mods.sampled.installSampleBank({ sets: mods.SAMPLE_SETS, pcm }, (defs) => {
    for (const d of defs) mods.inst.INSTRUMENTS[d.id] = d;
  });
  mods.render.clearSampleCache?.();
  return { sets: mods.SAMPLE_SETS.length, ms: Math.round(performance.now() - t0) };
}
