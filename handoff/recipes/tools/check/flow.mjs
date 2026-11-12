// Full flow: fresh save -> title -> Gioca -> story -> chef -> menu -> Pomodoro -> play 25 s -> fast-forward to 15:00 -> kill final boss -> victory -> results -> menu (carbonara unlocked) -> Carbonara -> die -> results.
// node flow.mjs outdir [url]
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const [,, OUT = '.', URL0] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const url = URL0 || `http://localhost:${process.env.PORT || 5405}/`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const errors = [], cerr = [], bad = [];
page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' / ')));
page.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
page.on('requestfailed', (r) => bad.push('FAILED ' + r.url() + ' ' + r.failure()?.errorText));
await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); sessionStorage.setItem('seeded', '1'); } });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
const log = (...a) => { console.log(...a); };
const vis = () => page.evaluate(() => [...document.querySelectorAll('.btn, button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim().slice(0, 30)));
const clickText = async (text) => {
  const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('.btn, button')].find((x) => x.textContent.includes(t) && x.offsetParent !== null); if (b) { b.click(); return true; } return false; }, text);
  if (!ok) throw new Error('button not found: ' + text + ' visible: ' + (await vis()).join(' | '));
};
await page.mouse.click(10, 10);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/01-title.png` });
log('title buttons:', (await vis()).join(' | '));
await clickText('Gioca');
await page.waitForTimeout(700);
if (await page.$('.story')) { await page.screenshot({ path: `${OUT}/02-story.png` }); await clickText('Andiamo'); await page.waitForTimeout(700); }
await page.screenshot({ path: `${OUT}/03-chef.png` });
log('chef buttons:', (await vis()).join(' | '));
await clickText('Avanti');
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/04-menu.png` });
const cards = await page.evaluate(() => [...document.querySelectorAll('.dish-card')].map((c) => (c.classList.contains('locked') ? 'L:' : 'U:') + c.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)));
log('menu cards:', cards.length, cards.filter((c) => c.startsWith('U:')));
// click Pomodoro with the mouse
const pom = await page.$('.dish-card:not(.locked)');
await pom.click();
await page.waitForFunction(() => window.__kf.run && window.__kf.run.time > 0.3, null, { timeout: 60000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/05-run-start.png` });
const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
let k = 0;
for (;;) {
  const st = await page.evaluate(() => { const r = window.__kf.run; const c = document.querySelector('.choice'); if (c) c.click(); return r ? { t: r.time, state: r.state, hp: Math.round(r.player.hp), lvl: r.level, stage: r.stage.id } : null; });
  if (!st || st.t >= 25 || st.state === 'dead') { log('after play:', JSON.stringify(st)); break; }
  await page.keyboard.down(keys[k % 4]); await page.waitForTimeout(1200); await page.keyboard.up(keys[k % 4]); k++;
}
await page.screenshot({ path: `${OUT}/06-run-25s.png` });
// fast-forward to the final boss and beat it (god mode kept by an interval)
await page.evaluate(() => { const r = window.__kf.run; r.time = 898; window.__god = setInterval(() => { const rr = window.__kf.run; if (rr) { rr.player.hp = rr.stats.maxHp; rr.player.iframes = 1; } }, 50); });
await page.waitForFunction(() => { const r = window.__kf.run; return r && r.bosses.some((b) => b.alive && b.def.id === r.stage.finalBoss); }, null, { timeout: 60000 });
log('bosses at 15:00:', await page.evaluate(() => window.__kf.run.bosses.map((b) => b.def.id + ':' + b.alive).join(', ')));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/07-final-boss.png` });
await page.evaluate(async () => { const r = window.__kf.run; for (let k = 0; k < 100 && !r.finalBossDefeated; k++) { for (const b of r.bosses) if (b.alive) { b.invuln = 0; r.hitEnemy(b, b.hp + 10, null, 1, 0); } const c = document.querySelector('.choice'); if (c) c.click(); await new Promise((res) => setTimeout(res, 100)); } });
for (let i = 0; i < 40; i++) {
  const st = await page.evaluate(() => { const r = window.__kf.run; const c = document.querySelector('.choice'); if (c) c.click(); return { res: !!document.querySelector('.res-dish'), state: r?.state, vT: r?.victoryT, fbd: r?.finalBossDefeated, screens: [...document.querySelectorAll('.screen')].map((x) => x.className).join(',') }; });
  if (i % 3 === 0 || st.res) log('poll', i, JSON.stringify(st));
  if (st.res) break;
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(2500);
await page.evaluate(() => { const c = document.querySelector('.choice'); if (c) c.click(); });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/08-results-win.png` });
log('results win text:', await page.evaluate(() => (document.querySelector('.res-dish')?.textContent || 'NONE').replace(/\s+/g, ' ').slice(0, 200)));
log('results buttons:', (await vis()).join(' | '));
log('res-dish icon size:', await page.evaluate(() => { const i = document.querySelector('.res-dish img, .res-dish canvas'); if (!i) return 'none'; const b = i.getBoundingClientRect(); return b.width + 'x' + b.height; }));
log('save after win:', JSON.stringify(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('kitchenfight.save.v1')); return { v: s.version, unlocked: s.unlockedStages, rec: s.records, wins: s.wins, ach: s.achievements }; })));
// back to the menu
const btns = await vis();
const toMenu = btns.find((b) => /Men|Menu|Il Men/.test(b)) || btns.find((b) => /Continua|Avanti|OK/.test(b));
log('clicking', toMenu);
await clickText(toMenu);
await page.waitForTimeout(1200);
if (!(await page.$('.dish-card'))) { log('after results buttons:', (await vis()).join(' | ')); await clickText('Gioca'); await page.waitForTimeout(800); if (await page.$('.story')) { await clickText('Andiamo'); await page.waitForTimeout(700); } log('chef buttons 2:', (await vis()).join(' | ')); await clickText('Avanti'); await page.waitForTimeout(1000); }
await page.screenshot({ path: `${OUT}/09-menu-after-win.png` });
const cards2 = await page.evaluate(() => [...document.querySelectorAll('.dish-card')].map((c) => (c.classList.contains('locked') ? 'L:' : 'U:') + c.textContent.replace(/\s+/g, ' ').trim().slice(0, 50)));
log('menu cards after win:', cards2.filter((c) => c.startsWith('U:')));
// Carbonara: die
const carb = await page.evaluateHandle(() => [...document.querySelectorAll('.dish-card:not(.locked)')].find((c) => /Carbonara/.test(c.textContent)));
if (carb && (await carb.evaluate((x) => !!x))) {
  await carb.asElement().click();
  await page.waitForFunction(() => window.__kf.run && window.__kf.run.stage.id === 'carbonara' && window.__kf.run.time > 1, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/10-carbonara.png` });
  await page.evaluate(() => clearInterval(window.__god));
  await page.evaluate(() => { const r = window.__kf.run; r.revivals = 0; r.player.hp = 1; r.player.iframes = 0; r.hurtPlayer(50, r.player.x + 5, r.player.y, 'test'); });
  await page.waitForFunction(() => document.querySelector('.res-dish'), null, { timeout: 30000 }).catch((e) => log('no death results', e.message));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/11-results-death.png` });
  log('results death text:', await page.evaluate(() => (document.querySelector('.res-dish')?.textContent || 'NONE').replace(/\s+/g, ' ').slice(0, 200)));
} else log('CARBONARA NOT UNLOCKED');
log('bad responses:', bad.length, bad.slice(0, 10).join('\n'));
log('page errors:', errors.length, errors.slice(0, 5).join('\n'));
log('console errors:', cerr.length, cerr.slice(0, 8).join('\n'));
await browser.close();
