#!/usr/bin/env node
/**
 * Chromium end-to-end test of the recorded instrument samples against the REAL engine.
 *
 *   node scripts/audio/browser_instrument_test.mjs [--port 5181] [--out DIR] [--single dist-single/index.html]
 *
 * 1. audiotest.html: decode every MP3 sprite with Chromium's decoder, install them in a render
 *    worker, render the 'kitchen' track there; report decode/install/render times, the decoder
 *    delay the marker alignment found per set, decoded PCM bytes; the WAV is saved so it can be
 *    compared sample-by-sample with the Node render (scripts/audio/compare_instrument_renders.py).
 * 2. index.html (the game): from navigation to "sample bank ready" and to the title track being
 *    rendered WITH samples (not the synth fallback); then a click unlocks audio and the title
 *    music must be playing. Console errors are collected.
 * 3. the game again with every .mp3 request blocked: the bank must fail cleanly and the title
 *    music must still render (synthesized fallback) and play — also the synth-only baseline latency.
 * 4. --single FILE: the same game check on the single-file build opened from file://.
 * A dev server is started on the port if none answers (vite, scripts/vite.agent.config.ts).
 */
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const PORT = +opt('--port', '5181');
const OUT = path.resolve(opt('--out', 'audio-out'));
const SINGLE = opt('--single', '');
fs.mkdirSync(OUT, { recursive: true });

async function up(url) {
  try {
    const r = await fetch(url);
    return r.ok;
  } catch {
    return false;
  }
}

let server = null;
const base = `http://localhost:${PORT}`;
if (!(await up(base + '/audiotest.html'))) {
  server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--config', 'scripts/vite.agent.config.ts'], { cwd: ROOT, stdio: 'ignore', detached: true });
  for (let i = 0; i < 120 && !(await up(base + '/audiotest.html')); i++) await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const results = {};
try {
  // ---------------------------------------------------------------- 1. audiotest: decode + worker render
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(base + '/audiotest.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__at, null, { timeout: 60000 });
    const r = await page.evaluate(async () => {
      const x = await window.__at.samplerTrack('kitchen', 48000, true);
      return x;
    });
    fs.writeFileSync(path.join(OUT, 'kitchen-chromium.wav'), Buffer.from(r.wav, 'base64'));
    delete r.wav;
    r.errors = errors;
    results.audiotest = r;
    await page.close();
  }
  // ---------------------------------------------------------------- 2/3. the game (dev server, single file)
  const gameCheck = async (url, blockMp3 = false) => {
    const page = await browser.newPage();
    // block the sample files themselves (not Vite's `?url` module imports of them)
    if (blockMp3) await page.route(/\.mp3$/, (r) => r.abort());
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('response', (res) => res.status() >= 400 && errors.push(`${res.status()} ${res.url()}`));
    page.on('requestfailed', (req) => errors.push(`failed ${req.url().slice(0, 120)}`));
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const tDom = Date.now() - t0;
    let st = null;
    let tBank = null;
    let tTitle = null;
    for (let i = 0; i < 600; i++) {
      st = await page.evaluate(() => (window.__kfSampler ? window.__kfSampler.status() : null));
      if (st && st.bankReady && tBank === null) tBank = Date.now() - t0;
      if (st && st.tracks && st.tracks.title !== undefined) {
        tTitle = Date.now() - t0;
        break;
      }
      await page.waitForTimeout(100);
    }
    // user gesture: unlock; the title music must start (poll up to 10 s)
    const tClick = Date.now();
    await page.mouse.click(5, 5);
    let after = null;
    let playMs = null;
    for (let i = 0; i < 100; i++) {
      after = await page.evaluate(() => (window.__kfSampler ? window.__kfSampler.status() : null));
      if (after && after.playing) {
        playMs = Date.now() - tClick;
        break;
      }
      await page.mouse.click(5, 5);
      await page.waitForTimeout(100);
    }
    const mem = await page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : null));
    await page.close();
    return { url, domMs: tDom, bankReadyMs: tBank, titleReadyMs: tTitle, titleSampled: st?.tracks?.title ?? null, playingAfterClickMs: playMs, status: after, mainHeapMB: mem ? +(mem / 1048576).toFixed(1) : null, errors: [...new Set(errors)] };
  };
  results.game = await gameCheck(base + '/');
  results.gameNoSamples = await gameCheck(base + '/', true);
  if (SINGLE) results.single = await gameCheck(pathToFileURL(path.resolve(ROOT, SINGLE)).href);
} finally {
  await browser.close();
  if (server) {
    try {
      process.kill(-server.pid);
    } catch {
      /* ignore */
    }
  }
}
fs.writeFileSync(path.join(OUT, 'browser-results.json'), JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, (k, v) => (k === 'zones' ? undefined : v), 1));
