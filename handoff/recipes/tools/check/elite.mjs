// node elite.mjs dish runs secs skill : damage before death split by source id and elite flag, plus death time
import { createRequire } from 'module';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const [,, dish, runs = '12', secs = '300', skill = '0.6'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(`http://localhost:${process.env.PORT || 5405}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 180000 });
const out = await page.evaluate(async ([dish, runs, secs, skill]) => {
  const R = (await import('/src/game/run.ts')).Run.prototype;
  const hurt = R.hurtPlayer;
  R.hurtPlayer = function (dmg, sx, sy, src = '?') {
    const before = this.damageTaken; hurt.call(this, dmg, sx, sy, src); const d = this.damageTaken - before;
    if (d > 0) {
      let el = false;
      for (const e of this.enemies) if (e.alive && e.elite && Math.abs(e.x - sx) < 1 && Math.abs(e.y - sy) < 1) el = true;
      const k = src + (el ? '[ELITE]' : '');
      window.__dmg[k] = (window.__dmg[k] ?? 0) + d;
    }
  };
  const res = [];
  window.__kf.save.powerups = {};
  for (let i = 0; i < runs; i++) { window.__dmg = {}; const r = window.__kf.simulate(dish, 'enzo', secs, skill); res.push({ t: Math.round(r.time), dead: r.dead, dmg: Object.fromEntries(Object.entries(window.__dmg).map(([a, b]) => [a, Math.round(b)])) }); }
  return res;
}, [dish, +runs, +secs, +skill]);
for (const r of out) { const tot = Object.values(r.dmg).reduce((a, b) => a + b, 0); console.log(dish, r.dead ? 'died ' + r.t : 'alive', Object.entries(r.dmg).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a, b]) => `${a} ${Math.round(b / tot * 100)}%`).join(', ')); }
await browser.close();
