// Validate that every sprite referenced by game data exists: node scripts/validate.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const port = process.env.PORT || '5175';
const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
const res = await page.evaluate(async () => {
  const S = await import('/src/gfx/sprites.ts');
  const { ENEMIES } = await import('/src/game/enemies.ts');
  const { WEAPONS } = await import('/src/game/weapons.ts');
  const { PASSIVES, POWERUPS, CHARACTERS } = await import('/src/game/passives.ts');
  const { MEDALS } = await import('/src/game/medals.ts');
  const { STAGE_ENVS } = await import('/src/gfx/stageenv.ts');
  const need = new Set();
  for (const e of Object.values(ENEMIES)) { need.add(e.sprite); if (e.boss) need.add(e.sprite + '.attack'); need.add('fx.splat.' + (e.color ?? 'red')); need.add('fx.chunk.' + (e.chunk ?? 'tomato')); if (e.params?.shot) need.add(e.params.shot); }
  for (const w of Object.values(WEAPONS)) need.add(w.icon);
  for (const p of Object.values(PASSIVES)) need.add(p.icon);
  for (const p of POWERUPS) need.add(p.icon);
  for (const c of CHARACTERS) { need.add(c.sprite); need.add(c.portrait); }
  for (const m of MEDALS) need.add(m.icon);
  ['pickup.xp1','pickup.xp2','pickup.xp3','pickup.xp4','pickup.coin','pickup.coinbag','pickup.cannolo','pickup.lasagna','pickup.bell','pickup.spumante','pickup.gelato','pickup.chest','pickup.chest_gold','ui.chest','ui.emblem','icon.coin','icon.kill','icon.star','fx.puff','fx.steam','fx.spark','fx.heart','fx.confetti','fx.feather','fx.coffee_cloud','fx.lava_crater','fx.fire_patch','fx.oil_slick','fx.pesto','fx.cream_puddle','fx.ketchup_puddle','proj.e_cream','proj.e_seed','proj.e_pepperoni','proj.e_generic','proj.e_ketchup','proj.mattarello','proj.mattarello_nonna','proj.ciabatta','proj.ciabatta_oro','proj.coltello','proj.coltello_mille','proj.olive','proj.olive_oro','proj.forchetta','proj.tridente','proj.pizza','proj.pizza_celeste','proj.rotella','proj.rotella_oro','proj.peperoncino','proj.moka','proj.moka_turbo','proj.vesuvio','proj.meteor','proj.forma','proj.forma_oro','proj.basilico','fx.pigeon_fly'].forEach((i) => need.add(i));
  // stage env props
  for (const env of Object.values(STAGE_ENVS)) {
    for (let cy = -3; cy <= 3; cy++) for (let cx = -3; cx <= 3; cx++) {
      let seed = (cx * 73856093) ^ (cy * 19349663);
      const R = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      for (const p of env.populate(cx, cy, R)) need.add(p.sprite);
      need.add(env.tile(cx, cy));
    }
  }
  const missing = [...need].filter((id) => !S.hasSprite(id));
  return { checked: need.size, missing, envs: Object.keys(STAGE_ENVS), total: S.spriteIds('').length };
});
console.log(JSON.stringify(res, null, 1));
console.log(logs.join('\n'));
await browser.close();
