// Stress test: node scripts/perf.mjs [enemies]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const n = +(process.argv[2] || 500);
const port = process.env.PORT || '5175';
const browser = await chromium.launch({ args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(0);
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
await page.mouse.click(5, 5);
await page.evaluate(() => window.__kf.startRun('enzo', 'alfredo'));
await page.waitForTimeout(2500);
const res = await page.evaluate(async (n) => {
  const kf = window.__kf; const run = kf.run;
  // god mode + full arsenal
  run.player.hp = 1e9; run.stats.maxHp = 1e9;
  for (const id of ['olive', 'forchette', 'rotella', 'basilico', 'moka']) run.addWeapon(id);
  for (const w of run.weapons) w.level = 8;
  run.time = 600;
  const ids = ['spezzato', 'hawaiana', 'pollo', 'pepperoni', 'ananas', 'polpetta'];
  const { ENEMIES } = await import('/src/game/enemies.ts');
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, d = 150 + Math.random() * 500; run.spawnEnemy(ENEMIES[ids[i % ids.length]], run.player.x + Math.cos(a) * d, run.player.y + Math.sin(a) * d); }
  const r = kf.renderer; r.profile = true; r.prof = {};
  let up = 0, rd = 0, frames = 120;
  for (let f = 0; f < frames; f++) {
    run.player.hp = 1e9;
    while (run.enemies.length < n) { const a = Math.random() * 6.28; run.spawnEnemy(ENEMIES[ids[run.enemies.length % ids.length]], run.player.x + Math.cos(a) * 600, run.player.y + Math.sin(a) * 400); }
    const t0 = performance.now();
    r.updateCamera(run, 1 / 60); run.update(1 / 60);
    const t1 = performance.now();
    r.render(run, 1 / 60, null);
    const t2 = performance.now();
    up += t1 - t0; rd += t2 - t1;
    if (run.state !== 'playing') { run.state = 'playing'; run.pendingLevels = 0; }
  }
  const prof = Object.fromEntries(Object.entries(r.prof).map(([k, v]) => [k, (v / frames).toFixed(1)]));
  return { prof, update: (up / frames).toFixed(2), render: (rd / frames).toFixed(2), enemies: run.enemies.length, proj: run.projectiles.length, particles: run.fx.particles.length };
}, n);
console.log(JSON.stringify(res));
await browser.close();
