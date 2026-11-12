// Boss bench: every dish's 3 boss slots with a fixed build per slot, no waves, autopilot, god mode.
// node bossbench.mjs [dish,dish] [reps]   (PORT, POWERUPS env). Prints one JSON line per case.
import { createRequire } from 'module';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const port = process.env.PORT || '5381';
const pu = process.env.POWERUPS ? JSON.parse(process.env.POWERUPS) : {};
const only = process.argv[2] ? process.argv[2].split(',') : null;
const reps = +(process.argv[3] || 2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(0);
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 180000 });
const dishes = await page.evaluate(async () => {
  const m = await import('/src/game/stages.ts');
  return m.STAGES.map((s) => s.id);
});
const BUILDS = [
  { level: 15, weapons: [['mattarello', 4], ['olive', 4], ['coltelli', 3], ['moka', 3]] },
  { level: 24, weapons: [['mattarello', 6], ['olive', 6], ['coltelli', 5], ['moka', 5], ['pizza', 4]] },
  { level: 35, weapons: [['mattarello', 8], ['olive', 8], ['coltelli', 7], ['moka', 7], ['pizza', 6], ['forchette', 6]] },
];
for (const dish of dishes) {
  if (only && !only.includes(dish)) continue;
  for (let slot = 0; slot < 3; slot++) {
    for (let rep = 0; rep < reps; rep++) {
      const res = await page.evaluate(async ([dish, slot, B, pu]) => {
        const kf = window.__kf;
        const ap = kf.attract?.autopilot ?? window.__ap;
        if (ap) window.__ap = ap;
        const rmod = await import('/src/game/run.ts');
        const R = rmod.Run.prototype;
        if (!R.__benchPatched) {
          R.__benchPatched = true;
          const down = R.playerDown;
          R.playerDown = function () {
            if (window.__god) { window.__deaths.push(this.time); this.player.hp = this.stats.maxHp; this.player.iframes = 2; return; }
            return down.call(this);
          };
        }
        kf.save.powerups = pu;
        kf.save.unlockedStages = ['pomodoro', 'carbonara', 'alfredo', 'amatriciana', 'cacioepepe', 'margherita', 'marinara', 'ragu', 'pesto', 'vongole', 'foodcourt'];
        kf.startRun('enzo', dish);
        await new Promise((r) => { const t = setInterval(() => { if (kf.run && kf.run.stage.id === dish) { clearInterval(t); r(); } }, 30); });
        const r = kf.run;
        r.state = 'paused';
        r.muted = true;
        r.fx.numbersEnabled = false;
        const st = r.director.stage;
        r.director.stage = { ...st, waves: st.waves.map((w) => ({ ...w, rate: 0 })), events: [] };
        for (const [id, lv] of B.weapons) { if (!r.weapons.some((w) => w.def.id === id)) r.addWeapon(id); }
        for (const w of r.weapons) { const want = B.weapons.find(([id]) => id === w.def.id); if (want) w.level = want[1]; }
        r.level = B.level;
        const slotDef = st.bosses[slot];
        r.time = slotDef.at;
        for (const e of r.enemies) e.alive = false;
        r.director.bossIdx = 99; // no scheduled bosses
        r.director.spawnBoss(slotDef.id, slotDef.hp, slot === 2);
        const e = r.bosses[r.bosses.length - 1];
        e.spawnT = 0;
        window.__god = true;
        window.__deaths = [];
        const dt = 1 / 30;
        const dmg0 = r.damageTaken;
        const by0 = { ...r.dmgBy };
        r.autopilot = window.__ap;
        r.state = 'playing';
        let t = 0;
        const LIM = 600;
        for (; t < LIM && e.alive; t += dt) {
          const p = r.player;
          r.pendingLevels = 0; r.chestQueue && (r.chestQueue.length = 0);
          r.view.x0 = p.x - 550; r.view.x1 = p.x + 550; r.view.y0 = p.y - 310; r.view.y1 = p.y + 310;
          r.world.update(r.view.x0, r.view.y0, r.view.x1, r.view.y1, dt);
          r.update(dt);
          if (r.state !== 'playing') r.state = 'playing';
        }
        window.__god = false;
        const by = {};
        for (const [k, v] of Object.entries(r.dmgBy)) { const d = v - (by0[k] ?? 0); if (d > 0) by[k] = Math.round(d); }
        const out = { dish, slot, boss: slotDef.id, hp: Math.round(e.maxHp), ttk: e.alive ? null : Math.round(t), left: e.alive ? Math.round((e.hp / e.maxHp) * 100) + '%' : undefined, dmgTaken: Math.round(r.damageTaken - dmg0), dps: +((r.damageTaken - dmg0) / Math.max(1, t)).toFixed(2), deaths: window.__deaths.length, maxHp: Math.round(r.stats.maxHp), by };
        kf.quitRun();
        return out;
      }, [dish, slot, BUILDS[slot], pu]);
      console.log(JSON.stringify(res));
    }
  }
}
if (errors.length) console.error(errors.slice(0, 5).join('\n'));
await browser.close();
