// End-to-end check of the recorded SFX inside the actual game (dev server or the single-file build).
//
//   node scripts/audio/sfx_game_check.mjs --url http://localhost:5183/        (dev server, port 5183)
//   node scripts/audio/sfx_game_check.mjs --file dist-single/index.html      (npm run build:single first)
//   options: --secs 25 (seconds of autoplayed run)
//
// Web Audio is instrumented before the game loads: buffers decoded from the MP3s (or created on the
// OfflineAudioContext that aligns them) count as "recorded"; buffers made on the realtime context are synthesized.
// Every AudioBufferSourceNode.start() is classified: recorded voice, synthesized layer of a recorded voice
// (same start time, right after it), synthesized-only (fallback) or music (> 8 s buffers). Speech bubbles are
// switched off so that the formant babble (not an SFX) is not counted.
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i >= 0 ? process.argv[i + 1] : d;
};
const file = arg('file', '');
const url = file ? 'file://' + path.resolve(file) : arg('url', 'http://localhost:5183/');
const secs = +arg('secs', '25');

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') logs.push('console: ' + m.text());
});
await page.addInitScript(() => {
  const st = { decoded: 0, decodeFailed: 0, decodeMs: 0, firstDecode: 0, lastDecode: 0, recorded: 0, layer: 0, synthOnly: 0, music: 0, beforeReady: 0 };
  window.__sfxStats = st;
  const recBufs = new WeakSet();
  const Off = window.OfflineAudioContext;
  const B = window.BaseAudioContext || window.AudioContext;
  const dec = B.prototype.decodeAudioData;
  B.prototype.decodeAudioData = function (data, ok, err) {
    const t0 = performance.now();
    if (!st.firstDecode) st.firstDecode = t0;
    const p = dec.call(
      this,
      data,
      (b) => {
        recBufs.add(b);
        ok?.(b);
      },
      (e) => err?.(e),
    );
    p?.then(
      (b) => {
        recBufs.add(b);
        st.decoded++;
        st.lastDecode = performance.now();
        st.decodeMs += performance.now() - t0;
      },
      () => st.decodeFailed++,
    );
    return p;
  };
  const cb = B.prototype.createBuffer;
  B.prototype.createBuffer = function (...a) {
    const b = cb.apply(this, a);
    if (Off && this instanceof Off) recBufs.add(b); // the aligned copies of decoded MP3s
    return b;
  };
  const start = AudioBufferSourceNode.prototype.start;
  let prev = null;
  AudioBufferSourceNode.prototype.start = function (when, ...rest) {
    const b = this.buffer;
    if (b) {
      if (b.duration > 8) st.music++;
      else if (recBufs.has(b)) {
        st.recorded++;
        prev = { when, ctx: this.context };
        return start.call(this, when, ...rest);
      } else if (prev && prev.when === when && prev.ctx === this.context) st.layer++;
      else if (b.length > 1) {
        st.synthOnly++;
        if (st.decoded < 100) st.beforeReady++;
      }
    }
    prev = null;
    return start.call(this, when, ...rest);
  };
});
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
const loadMs = Date.now() - t0;
await page.mouse.click(10, 10); // unlock audio
await page.waitForFunction(() => window.__sfxStats.decoded >= 100 || window.__sfxStats.decodeFailed > 0, null, { timeout: 30000 });
await page.waitForTimeout(800);
// menu sounds: hover and click a few buttons
const btns = await page.$$('.btn');
for (const b of btns.slice(0, 4)) {
  await b.hover().catch(() => {});
  await page.waitForTimeout(120);
}
const menu = await page.evaluate(() => ({ ...window.__sfxStats }));
// a real run, autoplayed with keyboard input; level-ups and chests are picked automatically
await page.evaluate(() => {
  const kf = window.__kf;
  kf.save.unlockedChars = ['enzo', 'nonna', 'peppe', 'sofia', 'tommaso', 'concetta', 'micio'];
  kf.startRun('enzo', 'kitchen');
});
await page.waitForFunction(() => !!window.__kf.run, null, { timeout: 20000 });
await page.evaluate(() => {
  const r = window.__kf.run;
  r.fx.bubblesEnabled = false;
  r.player.maxHp = r.stats.maxHp = 1e6; // survive the whole check
  r.player.hp = 1e6;
});
const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
for (let i = 0; i < secs; i++) {
  const k = keys[i % 4];
  await page.keyboard.down(k);
  await page.waitForTimeout(1000);
  await page.keyboard.up(k);
  await page.evaluate(() => {
    const el = document.querySelector('.choice');
    if (el) el.click();
    const cont = [...document.querySelectorAll('.btn')].find((b) => b.textContent.includes('Continua'));
    if (cont && cont.style.visibility !== 'hidden') cont.click();
    const r = window.__kf.run;
    if (r) r.player.hp = Math.max(r.player.hp, 1e5);
  });
}
const res = await page.evaluate(() => {
  const st = window.__sfxStats;
  const r = window.__kf.run;
  return { ...st, decodeWindowMs: st.lastDecode - st.firstDecode, run: r ? { t: +r.time.toFixed(1), level: r.level, kills: r.kills, weapons: r.weapons.map((w) => w.def.id) } : null };
});
const voices = res.recorded + res.synthOnly;
console.log(JSON.stringify({ url, pageLoadMs: loadMs, menu: { recorded: menu.recorded, synthOnly: menu.synthOnly }, ...res, recordedShare: voices ? +(res.recorded / voices).toFixed(4) : 0 }, null, 1));
console.log(logs.length ? 'PAGE LOG:\n' + logs.slice(0, 20).join('\n') : 'no page errors');
await browser.close();
