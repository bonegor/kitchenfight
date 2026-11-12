// node ui.mjs outdir : legacy save migration + Ricettario chef credits + crimes icons
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const [,, OUT = '.'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const url = `http://localhost:${process.env.PORT || 5405}/`;
const browser = await chromium.launch();
const errors = [];
async function legacy(name, v1) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(name + ' pageerror: ' + e.message));
  await page.addInitScript((v1) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); if (v1) localStorage.setItem('kitchenfight.save.v1', JSON.stringify(v1)); sessionStorage.setItem('seeded', '1'); } }, v1);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.press-start', { timeout: 120000 });
  const s = await page.evaluate(() => { const s = window.__kf.save; return { version: s.version, unlocked: s.unlockedStages, records: s.records, lastStage: s.lastStage, coins: s.coins, powerups: s.powerups, ach: s.achievements, chars: s.unlockedChars, stored: JSON.parse(localStorage.getItem('kitchenfight.save.v1') || 'null')?.version }; });
  console.log('MIGRATION', name, JSON.stringify(s));
  await page.mouse.click(5, 5);
  await page.evaluate(() => window.__kf.ui.showStageSelect());
  await page.waitForTimeout(900);
  const cards = await page.evaluate(() => [...document.querySelectorAll('.dish-card')].map((c) => (c.classList.contains('locked') ? 'L ' : 'U ') + (c.querySelector('h3,.name,b')?.textContent ?? c.textContent).trim().slice(0, 28) + (c.querySelector('.perfect-badge') ? ' ★' : '') + ((c.textContent.match(/\d+:\d\d/) || [''])[0] ? ' ' + c.textContent.match(/\d+:\d\d/)[0] : '')));
  console.log('  cards', JSON.stringify(cards));
  console.log('  focused', await page.evaluate(() => document.querySelector('.dish-card.focus, .dish-card.sel, .dish-card[data-nav-default]')?.textContent.trim().slice(0, 30)));
  await page.screenshot({ path: `${OUT}/menu_${name}.png` });
  // reload: the migrated save must stay v2 and stable
  await page.evaluate(() => window.__kf.ui.showTitle?.());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.press-start', { timeout: 120000 });
  console.log('  after reload', JSON.stringify(await page.evaluate(() => ({ v: window.__kf.save.version, unlocked: window.__kf.save.unlockedStages, last: window.__kf.save.lastStage }))));
  await ctx.close();
}
const rec = (t, w, k = 500, l = 20) => ({ bestTime: t, wins: w, bestKills: k, bestLevel: l });
await legacy('v1_all', { coins: 1234, totalCoins: 5000, totalKills: 9000, runs: 30, wins: 4, bestTime: 900, kills: { ananas: 300 }, seen: ['e:panna'], unlockedChars: ['enzo', 'nonna'], unlockedStages: ['kitchen', 'trattoria', 'streets', 'foodcourt'], records: { kitchen: rec(900, 2), trattoria: rec(900, 1), streets: rec(900, 1), foodcourt: rec(700, 0) }, powerups: { might: 3, maxhp: 2 }, achievements: ['first', 'win'], lastChar: 'nonna', lastStage: 'streets', settings: { master: 0.5 } });
await legacy('v1_kitchen_only', { coins: 10, unlockedStages: ['kitchen', 'trattoria'], records: { kitchen: rec(900, 1), trattoria: rec(400, 0) }, lastStage: 'trattoria', unlockedChars: ['enzo'] });
await legacy('v1_finale_open_no_wins', { unlockedStages: ['kitchen', 'trattoria', 'streets', 'foodcourt'], records: { kitchen: rec(500, 0) }, lastStage: 'foodcourt' });
await legacy('v1_minimal', { coins: 5 });
await legacy('garbage', null);
// Ricettario
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('ui pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('ui console: ' + m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
await page.mouse.click(5, 5);
await page.evaluate(async () => { const { ENEMIES } = await import('/src/game/enemies.ts'); const s = window.__kf.save; s.seen = [...new Set([...s.seen, ...Object.keys(ENEMIES).map((k) => 'e:' + k)])]; });
for (const d of ['pomodoro', 'amatriciana', 'margherita', 'ragu', 'marinara']) {
  await page.evaluate((d) => window.__kf.ui.showCollection('recipes', d), d);
  await page.waitForTimeout(600);
  const chefs = await page.evaluate(() => [...document.querySelectorAll('.rc-sources.chefs li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()));
  console.log('CHEFS', d, JSON.stringify(chefs));
  if (d === 'margherita') {
    await page.evaluate(() => document.querySelector('.rc-sources.chefs')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/chefs_${d}.png` });
  }
}
await page.evaluate(() => window.__kf.ui.showCollection('crimes'));
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/crimes_grid.png` });
const cells = await page.evaluate(() => [...document.querySelectorAll('.coll-item:not(.dish)')].slice(0, 80).map((c) => { const b = c.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); }));
const sizes = {}; cells.forEach((s) => { sizes[s] = (sizes[s] ?? 0) + 1; });
console.log('crime cell sizes', JSON.stringify(sizes));
for (const id of ['b_aglio', 'b_burro', 'b_frullatore', 'b_fusione']) {
  await page.evaluate((id) => window.__kf.ui.showCollection('crimes', id), id);
  await page.waitForTimeout(500);
  const el = await page.$('.coll-detail img.big, .coll-detail img');
  if (el) await el.screenshot({ path: `${OUT}/crime_${id}.png` });
}
console.log('errors', errors.length, errors.slice(0, 8).join('\n'));
await browser.close();
