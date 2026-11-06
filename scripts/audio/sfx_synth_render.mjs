// Renders every SYNTHESIZED sound effect (src/audio/sfx.ts, the fallback and the synth layers) in Node, exactly as the
// game's worker does (same code, same seeds), so that scripts/audio/build_sfx.py can measure them: the recorded
// variants are loudness-matched to these renders, and ids with a synth layer are mixed with them when matching.
//
//   node scripts/audio/sfx_synth_render.mjs <out dir> [sample rate = 48000]
//
// Writes <out dir>/<id>.<variant>.f32 (float32, channels interleaved) and <out dir>/index.json
// ({ sr, ids: { id: { ch, variants, len: [samples per variant] } } }). No browser or dev server needed: sfx.ts and
// dsp.ts are plain DSP code, bundled on the fly with esbuild (from node_modules).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const out = process.argv[2];
const sr = +(process.argv[3] || 48000);
if (!out) {
  console.error('usage: node scripts/audio/sfx_synth_render.mjs <out dir> [sr]');
  process.exit(2);
}
const built = await esbuild.build({
  entryPoints: [path.join(root, 'src', 'audio', 'sfx.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  logLevel: 'error',
});
const { SFX, SFX_IDS, renderSfx } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
fs.mkdirSync(out, { recursive: true });
const index = { sr, ids: {} };
for (const id of SFX_IDS) {
  const nv = SFX[id].variants ?? 1;
  const e = { ch: SFX[id].stereo ? 2 : 1, variants: nv, len: [] };
  for (let v = 0; v < nv; v++) {
    const { l, r } = renderSfx(id, sr, v);
    const ch = r ? 2 : 1;
    e.ch = ch;
    const buf = new Float32Array(l.length * ch);
    for (let i = 0; i < l.length; i++) {
      buf[i * ch] = l[i];
      if (r) buf[i * ch + 1] = r[i];
    }
    fs.writeFileSync(path.join(out, `${id}.${v}.f32`), Buffer.from(buf.buffer));
    e.len.push(l.length);
  }
  index.ids[id] = e;
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index));
console.log(`${Object.keys(index.ids).length} synthesized ids rendered at ${sr} Hz into ${out}`);
