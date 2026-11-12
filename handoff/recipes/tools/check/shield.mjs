// Does standing in an enemy cheese cloud shield the chef from contact hits? Same crowd, with and without a cloud under him.
import { createRequire } from 'module';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:5405/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
const r = await page.evaluate(async () => {
  const { ENEMIES } = await import('/src/game/enemies.ts');
  const { Run } = await import('/src/game/run.ts');
  const { stageById } = await import('/src/game/stages.ts');
  const { charById } = await import('/src/game/passives.ts');
  const noop = () => undefined;
  const hooks = { onLevelUp: noop, onChest: noop, onBoss: noop, onBossDefeated: noop, onGameOver: noop, onVictory: noop, onRevive: noop, onToast: noop, onIngredient: noop };
  const kf = window.__kf;
  const res = {};
  for (const cloud of [false, true]) {
    let tot = { contact: 0, area: 0, hits: 0 };
    for (let rep = 0; rep < 3; rep++) {
      const run = new Run(stageById('vongole'), charById('enzo'), JSON.parse(JSON.stringify(kf.save)), hooks);
      run.director.update = () => {};
      run.state = 'paused';
      run.weapons.length = 0; // no weapons: the crowd stays
      run.player.hp = run.stats.maxHp = 1e6;
      run.enemies.length = 0;
      if (cloud) run.addArea('cheese', run.player.x, run.player.y, 40, 1e9, { enemy: true, slow: 0.25, damage: 0.6, tick: 0.6 });
      const by = run.dmgBy; for (const k in by) delete by[k];
      const hurt = run.hurtPlayer.bind(run);
      let hits = 0;
      run.hurtPlayer = (d, x, y, s) => { const b = run.damageTaken; hurt(d, x, y, s); if (run.damageTaken > b && !String(s).startsWith('area')) hits++; };
      run.state = 'playing';
      for (let f = 0; f < 60 * 20; f++) { run.player.vx = 0; run.player.vy = 0; run.update(1 / 60); if (f % 97 === 50) run.hurtPlayer(30, run.player.x + 50, run.player.y, 'slam:test'); run.player.hp = 1e6; if (run.state !== 'playing') run.state = 'playing'; }
      for (const [k, v] of Object.entries(run.dmgBy)) { if (k.startsWith('area')) tot.area += v; else tot.contact += v; }
      tot.hits += hits;
      run.state = 'dead';
    }
    res[cloud ? 'with cloud' : 'no cloud'] = tot;
  }
  return res;
});
console.log(JSON.stringify(r));
await browser.close();
