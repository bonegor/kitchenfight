// Automated playtest: node scripts/play.mjs <outdir> [stage] [char] [seconds] [w] [h]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [,, out = '.', stage = 'kitchen', char = 'enzo', secs = '12', w = '1280', h = '720'] = process.argv;
const port = process.env.PORT || '5173';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + e.stack));
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
const t0 = Date.now();
await page.waitForSelector('.press-start', { timeout: 120000 });
console.log('loaded in', Date.now() - t0, 'ms');
await page.screenshot({ path: `${out}/0-loading.png` });
await page.mouse.click(10, 10);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/1-title.png` });
if (process.env.TITLE_ONLY) { console.log(logs.join('\n')); await browser.close(); process.exit(0); }
await page.evaluate(([s, c]) => { const kf = window.__kf; kf.save.unlockedChars = ['enzo','nonna','peppe','sofia','tommaso','concetta','micio']; kf.save.unlockedStages = ['kitchen','trattoria','streets','foodcourt']; kf.startRun(c, s); }, [stage, char]);
await page.waitForTimeout(1500);
const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
const total = +secs;
let shot = 2;
for (let i = 0; i < total; i++) {
  const k = keys[i % 4];
  await page.keyboard.down(k);
  await page.waitForTimeout(1000);
  await page.keyboard.up(k);
  // auto-pick level ups / close chests
  await page.evaluate(() => {
    const el = document.querySelector('.choice');
    if (el) el.click();
    const cont = [...document.querySelectorAll('.btn')].find((b) => b.textContent.includes('Continua'));
    if (cont && cont.style.visibility !== 'hidden') cont.click();
  });
  if (i === Math.floor(total / 2)) await page.screenshot({ path: `${out}/${shot++}-mid.png` });
}
await page.screenshot({ path: `${out}/${shot++}-end.png` });
const info = await page.evaluate(() => { const r = window.__kf.run; if (!r) return null; return { t: r.time.toFixed(1), lvl: r.level, kills: r.kills, enemies: r.enemies.length, proj: r.projectiles.length, hp: r.player.hp.toFixed(0), state: r.state, weapons: r.weapons.map(w => w.def.id + w.level), fps: window.__kf.fps.toFixed(0) }; });
console.log(JSON.stringify(info));
console.log(logs.slice(0, 30).join('\n'));
await browser.close();
