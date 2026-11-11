// Capture README screenshots into docs/screenshots (JPEG).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const port = process.env.PORT || '5175';
const OUT = 'docs/screenshots';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(0);
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
const shot = async (name) => { await page.evaluate(() => { const r = window.__kf.run; if (r) { r.fx.hurt = 0; r.player.hurtT = 0; } }); await page.waitForTimeout(60); return page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 84 }); };
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
await page.mouse.click(5, 5);
await page.evaluate(() => { const kf = window.__kf; kf.save.runs = 4; kf.save.coins = 2750; kf.save.unlockedChars = ['enzo','nonna','peppe','sofia','tommaso','concetta','micio']; kf.save.unlockedStages = ['pomodoro','carbonara','alfredo','amatriciana','cacioepepe','margherita','marinara','ragu','pesto','vongole','foodcourt']; for (const id of ['spezzato','ketchup','panna','forbici','cipolla','aglio','ananas','pollo','cappuccino','b_ananas','b_panna','fantasma','pentola']) kf.save.seen.push('e:' + id); kf.ui.showTitle(); });
await page.waitForTimeout(2500);
await shot('title');
await page.evaluate(() => window.__kf.ui.showCharSelect());
await page.waitForTimeout(600);
await shot('chefs');
await page.evaluate(() => { window.__kf.ui.showCollection('crimes'); });
await page.waitForTimeout(500);
await page.evaluate(() => { const it = [...document.querySelectorAll('.coll-item')][10]; it && it.click(); });
await page.waitForTimeout(300);
await shot('ricettario');
// gameplay showcase helper
const play = async (stage, char, weapons, t, secs) => {
  await page.evaluate(([s, c]) => window.__kf.startRun(c, s), [stage, char]);
  await page.waitForTimeout(1800);
  await page.evaluate(([ws, tt]) => { const r = window.__kf.run; r.player.hp = 1e6; r.stats.maxHp = 1e6; for (const id of ws.split(',')) r.addWeapon(id); for (const w of r.weapons) w.level = 6; r.time = tt; r.level = 24; }, [weapons, t]);
  const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
  for (let i = 0; i < secs; i++) {
    await page.keyboard.down(keys[i % 4]); await page.waitForTimeout(650); await page.keyboard.up(keys[i % 4]);
    await page.evaluate(() => { const r = window.__kf.run; if (r) { r.player.hp = 1e6; r.pendingLevels = 0; } const el = document.querySelector('.choice'); if (el) el.click(); const b=[...document.querySelectorAll('.btn')].find(b=>b.textContent.includes('Continua')); if (b && b.style.visibility!=='hidden') b.click(); });
  }
};
await play('carbonara', 'enzo', 'olive,forchette,rotella,forno', 250, 7);
await shot('kitchen');
await page.evaluate(() => window.__kf.quitRun());
await play('margherita', 'nonna', 'pizza,peperoncino,moka,basilico', 520, 7);
await shot('trattoria');
await page.evaluate(() => window.__kf.quitRun());
await play('marinara', 'peppe', 'vesuvio,forma,coltelli,spaghetti', 830, 8);
await shot('streets');
await page.evaluate(() => window.__kf.quitRun());
await play('foodcourt', 'concetta', 'olive,moka,rotella,basilico', 590, 7);
await shot('foodcourt');
await page.evaluate(() => { const r = window.__kf.run; r.pendingLevels = 1; });
await page.waitForTimeout(1300);
await shot('levelup');
console.log(logs.join('\n') || 'ok');
await browser.close();
