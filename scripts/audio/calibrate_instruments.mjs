#!/usr/bin/env node
/**
 * Loudness calibration of the sampled instruments against the synthesized ones they replace, per
 * song channel — so a song mixed against one keeps its balance with the other (the synth is also the
 * fallback whenever the samples are missing).
 *
 * Every channel of every song that plays a sampled instrument is rendered solo (no master gain / clip;
 * the song's reverb send as written) once with the synthesized instruments and once with the samples,
 * with the song's own notes: pitches, lengths (short-note articulation included), velocities and
 * variants. BS.1770 integrated loudness (K-weighted, gated) of each → the difference, and per instrument
 * id the median over its channels. Ids the synth had before the samples (songs mixed against the
 * synth): the sampled instrument's gainDb moves to the synth level. Ids the Audio 2.0 brief added
 * (NEW_IDS, songs mixed against the recordings): the synthesized fallback's trim moves instead
 * (FALLBACK_TRIM_DB in src/audio/instruments.ts). Ids no song uses keep their gains.
 * Song sets: the current songs, plus --songs2 INDEX (e.g. a scratch copy of the arrangement branch's
 * songs next to symlinks of src/audio/*.ts) — the instruments must suit both.
 *
 *   node scripts/audio/calibrate_instruments.mjs [--songs2 path/to/songs/index.ts] [--write] [--json FILE]
 * --write updates SAMPLED_SPECS[].gainDb in src/audio/sampled.ts and FALLBACK_TRIM_DB in
 * src/audio/instruments.ts (corrections under 0.3 dB are left).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { installBank, integratedLoudness, loadAudio } from './render-song.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const WRITE = args.includes('--write');
const SONGS2 = opt('--songs2', '');
const JSON_OUT = opt('--json', '');
const SR = 48000;

async function measureSet(label, songsIndex) {
  const A = await loadAudio(songsIndex);
  const synth = { ...A.INSTRUMENTS };
  installBank(A);
  const sampled = { ...A.INSTRUMENTS };
  const real = (id) => A.INSTRUMENT_ALIASES[id] ?? id;
  const specOf = (id) => A.SAMPLED_SPECS.find((s) => s.id === real(id));
  const rows = [];
  const use = (defs) => {
    Object.assign(A.INSTRUMENTS, defs);
    A.clearSampleCache();
  };
  for (const [sid, song] of Object.entries(A.SONGS)) {
    for (const [ch, def] of Object.entries(song.channels)) {
      const spec = specOf(def.inst);
      if (!spec || sampled[def.inst] === synth[def.inst]) continue;
      const lu = {};
      for (const [kind, defs] of [['synth', synth], ['sampled', sampled]]) {
        use(defs);
        const r = await A.renderSong(song, SR, { slicer: new A.Slicer(1e9), solo: [ch], raw: true });
        lu[kind] = integratedLoudness(r.left, r.right, SR);
      }
      if (!Number.isFinite(lu.synth) || !Number.isFinite(lu.sampled)) continue;
      rows.push({ set: label, song: sid, ch, inst: def.inst, id: spec.id, synth: lu.synth, sampled: lu.sampled, diff: lu.sampled - lu.synth });
    }
  }
  use(sampled);
  return { A, rows };
}

const sets = [await measureSet('songs', '')];
if (SONGS2) sets.push(await measureSet('songs2', SONGS2));
const A = sets[0].A;
const rows = sets.flatMap((s) => s.rows);
const byId = new Map();
for (const r of rows) (byId.get(r.id) ?? byId.set(r.id, []).get(r.id)).push(r);
const med = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  return v.length % 2 ? v[v.length >> 1] : 0.5 * (v[v.length / 2 - 1] + v[v.length / 2]);
};
console.log('per channel (sampled - synth, integrated LUFS of the solo channel):');
for (const r of rows) console.log(`  ${r.set.padEnd(6)} ${(r.song + '.' + r.ch).padEnd(22)} ${r.inst.padEnd(13)} synth ${r.synth.toFixed(1).padStart(6)}  sampled ${r.sampled.toFixed(1).padStart(6)}  diff ${(r.diff >= 0 ? '+' : '') + r.diff.toFixed(1)}`);
// ids the synth had before the samples (the songs were mixed against the synth): the sampled
// instrument moves to the synth's level. Ids the Audio 2.0 brief added (NEW_IDS: the recorded
// instrument is the reference the songs are mixed against): the synthesized fallback moves instead.
console.log('\nid            channels  median diff   min    max   adjusted          now -> new');
const gains = {};
const trims = {};
for (const spec of A.SAMPLED_SPECS) {
  const rs = byId.get(spec.id);
  if (!rs) continue;
  const d = rs.map((r) => r.diff);
  const m = med(d);
  const isNew = A.NEW_IDS.includes(spec.id);
  const now = isNew ? A.FALLBACK_TRIM_DB[spec.id] ?? 0 : spec.gainDb ?? 0;
  const next = Math.abs(m) < 0.3 ? now : Math.round((isNew ? now + m : now - m) * 10) / 10;
  (isNew ? trims : gains)[spec.id] = next;
  console.log(`${spec.id.padEnd(13)} ${String(rs.length).padStart(8)}  ${(m >= 0 ? '+' : '') + m.toFixed(2).padStart(5)}    ${Math.min(...d).toFixed(1).padStart(5)}  ${Math.max(...d).toFixed(1).padStart(5)}   ${isNew ? 'synth fallback' : 'sampled gainDb'}  ${now.toFixed(1).padStart(5)} -> ${next.toFixed(1)}`);
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ rows, gains, trims }, null, 1));
if (WRITE) {
  const file = path.join(ROOT, 'src', 'audio', 'sampled.ts');
  let src = fs.readFileSync(file, 'utf8');
  for (const [id, g] of Object.entries(gains)) {
    const re = new RegExp(`(S\\('${id}', '[^']+', '[a-z]+', [0-9.]+, \\{[^}]*?gainDb: )(-?[0-9.]+)`);
    src = src.replace(re, (_m, a) => `${a}${g}`);
  }
  fs.writeFileSync(file, src);
  const ifile = path.join(ROOT, 'src', 'audio', 'instruments.ts');
  let isrc = fs.readFileSync(ifile, 'utf8');
  const table = Object.entries({ ...A.FALLBACK_TRIM_DB, ...trims })
    .filter(([, v]) => v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  isrc = isrc.replace(/export const FALLBACK_TRIM_DB: Record<string, number> = \{[^}]*\};/, `export const FALLBACK_TRIM_DB: Record<string, number> = { ${table} };`);
  fs.writeFileSync(ifile, isrc);
  console.log('updated', file, 'and', ifile);
}
