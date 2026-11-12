// node finale.mjs <dish> <runs> <secs> : which enemy ids actually spawn (GOD auto-revive, mid pantry), vs the recipe's intruders/extras
import { createRequire } from 'module';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const [,, dish = 'foodcourt', runs = '3', secs = '900'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://localhost:${process.env.PORT || 5405}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 180000 });
const res = await page.evaluate(async ([dish, runs, secs]) => {
  const R = (await import('/src/game/run.ts')).Run.prototype;
  const { recipeById } = await import('/src/game/recipes.ts');
  const { stageById } = await import('/src/game/stages.ts');
  const sp = R.spawnEnemy;
  window.__sp = {};
  R.spawnEnemy = function (def, x, y, o) { const e = sp.call(this, def, x, y, o); const k = def.id; const s = (window.__sp[k] ||= { n: 0, first: 1e9 }); s.n++; s.first = Math.min(s.first, Math.round(this.time)); return e; };
  const down = R.playerDown;
  R.playerDown = function () { this.player.hp = this.stats.maxHp; this.player.iframes = 2; };
  window.__kf.save.powerups = { might: 2, maxhp: 2, armor: 1, recovery: 1 };
  for (let i = 0; i < runs; i++) window.__kf.simulate(dish, 'enzo', secs, 1);
  R.playerDown = down;
  const r = recipeById(dish);
  const st = stageById(dish);
  const listed = r.intruders.map((i) => ({ enemy: i.enemy, alias: i.alias ?? [] }));
  const missing = [];
  for (const i of listed) if (![i.enemy, ...i.alias].some((id) => window.__sp[id])) missing.push(i.enemy);
  const missingExtras = r.extras.filter((x) => !window.__sp[x]);
  // static: which ids appear in waves/events
  const stat = new Set();
  st.waves.forEach((w) => w.pool.forEach(([id, wt]) => wt > 0 && stat.add(id)));
  st.events.forEach((e) => e.enemy && stat.add(e.enemy));
  return { listed: listed.map((x) => x.enemy + (x.alias.length ? '(' + x.alias.join('/') + ')' : '')), extras: r.extras, missing, missingExtras, spawned: window.__sp, staticIds: [...stat] };
}, [dish, +runs, +secs]);
console.log(JSON.stringify(res, null, 1));
console.log('errors', errs.slice(0, 5));
await browser.close();
