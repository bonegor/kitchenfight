// Capture README screenshots into docs/screenshots (JPEG): PORT=5175 node scripts/readme-shots.mjs
// OUT=<dir> writes them somewhere else (e.g. a scratch folder to check them first).
// Gameplay shots are named after the dish (Il Menù): carbonara (kitchen), alfredo (trattoria),
// margherita and vongole (the Naples alleys, two light variants), foodcourt (the finale); menu is
// the dish picker. Run it on the finished build (final art and UI), check the shots, then point the
// README gallery at menu/carbonara/alfredo/margherita/vongole.jpg and delete the old kitchen.jpg,
// trattoria.jpg and streets.jpg (the README keeps them until the new shots exist).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const port = process.env.PORT || '5175';
const OUT = process.env.OUT || 'docs/screenshots';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(0);
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
const shot = async (name) => { await page.evaluate(() => { const r = window.__kf.run; if (r) { r.fx.hurt = 0; r.player.hurtT = 0; } }); await page.waitForTimeout(60); return page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 84 }); };
// before a gameplay shot: no toast over the boss bar (empty the run's queue, hold the next one, drop the
// shown ones) and no boss on top of the chef (a boss closer than 300 units steps aside, still on screen)
const tidy = async () => {
  for (let i = 0; i < 3; i++) { // close a level-up that is already on screen
    const open = await page.evaluate(() => { const r = window.__kf.run; if (r) r.pendingLevels = 0; const el = document.querySelector('.choice'); if (el) el.click(); return !!el; });
    if (!open) break;
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => {
    const r = window.__kf.run;
    if (r) {
      r.toastQueue.length = 0; r.toastT = 60;
      r.xp = r.xpNext * 0.55; r.pendingLevels = 0; // no level-up cards in the shot
      const p = r.player;
      for (const b of r.bosses) {
        if (!b.alive || Math.hypot(b.x - p.x, b.y - p.y) >= 300) continue;
        const side = b.x >= p.x ? 1 : -1;
        b.x = p.x + side * 380; b.y = p.y + 40;
      }
    }
    document.querySelectorAll('.toast').forEach((t) => t.remove());
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
};
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
await page.mouse.click(5, 5);
await page.evaluate(() => { const kf = window.__kf; kf.save.runs = 4; kf.save.coins = 2750; kf.save.unlockedChars = ['enzo','nonna','peppe','sofia','tommaso','concetta','micio']; kf.save.unlockedStages = ['pomodoro','carbonara','alfredo','amatriciana','cacioepepe','margherita','marinara','ragu','pesto','vongole','foodcourt']; for (const id of ['spezzato','ketchup','panna','forbici','cipolla','aglio','ananas','pollo','cappuccino','b_ananas','b_panna','fantasma','pentola']) kf.save.seen.push('e:' + id); kf.ui.showTitle(); });
await page.waitForTimeout(2500);
await shot('title');
await page.evaluate(() => window.__kf.ui.showCharSelect());
await page.waitForTimeout(600);
await shot('chefs');
// Il Menù: the dish picker
await page.evaluate(() => window.__kf.ui.showStageSelect());
await page.waitForTimeout(900);
await shot('menu');
await page.evaluate(() => { window.__kf.ui.showCollection('crimes'); });
await page.waitForTimeout(500);
await page.evaluate(() => { const it = [...document.querySelectorAll('.coll-item')][10]; it && it.click(); });
await page.waitForTimeout(300);
await shot('ricettario');
// gameplay showcase helper: `got` real ingredients already collected (HUD recipe strip),
// and the next one placed on the map (green arrow)
const play = async (stage, char, weapons, t, secs, got = 2) => {
  await page.evaluate(([s, c]) => window.__kf.startRun(c, s), [stage, char]);
  await page.waitForTimeout(1800);
  await page.evaluate(([ws, tt, g]) => { const r = window.__kf.run; r.player.hp = 1e6; r.stats.maxHp = 1e6; for (const id of ws.split(',')) r.addWeapon(id); for (const w of r.weapons) w.level = 6; r.time = tt; r.level = 24; for (let i = 0; i < g; i++) r.collectIngredient(i); r.spawnIngredient(g); }, [weapons, t, got]);
  const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
  for (let i = 0; i < secs; i++) {
    await page.keyboard.down(keys[i % 4]); await page.waitForTimeout(650); await page.keyboard.up(keys[i % 4]);
    await page.evaluate(() => { const r = window.__kf.run; if (r) { r.player.hp = 1e6; r.pendingLevels = 0; } const el = document.querySelector('.choice'); if (el) el.click(); const b=[...document.querySelectorAll('.btn')].find(b=>b.textContent.includes('Continua')); if (b && b.style.visibility!=='hidden') b.click(); });
  }
};
await play('carbonara', 'enzo', 'olive,forchette,rotella,forno', 250, 7);
await tidy();
await shot('carbonara');
await page.evaluate(() => window.__kf.quitRun());
// before the 5:00 mid-boss, and no cheese wheels over the chef
await play('alfredo', 'sofia', 'coltelli,forchette,moka,basilico', 270, 7);
await tidy();
await shot('alfredo');
await page.evaluate(() => window.__kf.quitRun());
await play('margherita', 'nonna', 'pizza,peperoncino,moka,basilico', 520, 7, 3);
await tidy();
await shot('margherita');
await page.evaluate(() => window.__kf.quitRun());
await play('vongole', 'peppe', 'vesuvio,forma,coltelli,spaghetti', 400, 8, 4);
await tidy();
await shot('vongole');
await page.evaluate(() => window.__kf.quitRun());
await play('foodcourt', 'concetta', 'olive,moka,rotella,basilico', 590, 7, 3);
await tidy();
await shot('foodcourt');
await page.evaluate(() => { const r = window.__kf.run; r.pendingLevels = 1; });
await page.waitForTimeout(1300);
await shot('levelup');
console.log(logs.join('\n') || 'ok');
await browser.close();
