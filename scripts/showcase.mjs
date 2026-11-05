// Gameplay showcase screenshot: node scripts/showcase.mjs <out.png> [stage] [char] [weapons,comma] [seconds] [w] [h]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [,, out = 'showcase.png', stage = 'kitchen', char = 'enzo', weapons = 'olive,forchette,rotella,basilico,moka', secs = '6', w = '1280', h = '720'] = process.argv;
const port = process.env.PORT || '5175';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
await page.mouse.click(5, 5);
await page.evaluate(([s, c]) => { const kf = window.__kf; kf.save.runs = 5; kf.save.unlockedChars = ['enzo','nonna','peppe','sofia','tommaso','concetta','micio']; kf.save.unlockedStages = ['kitchen','trattoria','streets','foodcourt']; kf.startRun(c, s); }, [stage, char]);
await page.waitForTimeout(2000);
await page.evaluate(([ws, t]) => {
  const run = window.__kf.run;
  run.player.hp = 1e6; run.stats.maxHp = 1e6;
  for (const id of ws.split(',').filter(Boolean)) run.addWeapon(id);
  for (const wpn of run.weapons) wpn.level = Math.min(wpn.def.maxLevel, 6);
  run.time = +t;
}, [weapons, process.env.T || '240']);
const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
for (let i = 0; i < +secs; i++) {
  await page.keyboard.down(keys[i % 4]); await page.waitForTimeout(700); await page.keyboard.up(keys[i % 4]);
  await page.evaluate(() => { const r = window.__kf.run; if (r) { r.player.hp = 1e6; } const el = document.querySelector('.choice'); if (el) el.click(); const b=[...document.querySelectorAll('.btn')].find(b=>b.textContent.includes('Continua')); if (b && b.style.visibility!=='hidden') b.click(); });
}
await page.screenshot({ path: out });
console.log(logs.join('\n'));
await browser.close();
