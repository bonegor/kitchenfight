// Batch balance sims with boss kill times.
// node sim2.mjs "<dish,dish>" <char> <secs> "<skill,skill>" <n> [puLabel]   (PORT, POWERUPS env)
// Prints one JSON line per run.
import { createRequire } from 'module';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const [,, dishes = 'pomodoro', char = 'enzo', secs = '900', skills = '1', nRuns = '3', puLabel = ''] = process.argv;
const port = process.env.PORT || '5381';
const pu = process.env.POWERUPS ? JSON.parse(process.env.POWERUPS) : {};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.setDefaultTimeout(0);
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 180000 });
await page.evaluate(async () => {
  const mod = await import('/src/game/director.ts');
  const D = mod.Director.prototype;
  if (D.__patched) return;
  D.__patched = true;
  const spawn = D.spawnBoss;
  window.__bossLog = [];
  D.spawnBoss = function (id, slotHp, last) {
    const n0 = this.run.bosses.length;
    spawn.call(this, id, slotHp, last);
    const e = this.run.bosses[this.run.bosses.length - 1];
    if (this.run.bosses.length > n0 && e) window.__bossLog.push({ run: this.run, e, id, at: Math.round(this.run.time), hp: Math.round(e.maxHp), lvl: this.run.level, php: Math.round(this.run.player.hp), pmax: Math.round(this.run.stats.maxHp), killed: null, dmgTaken0: this.run.damageTaken });
  };
  const rmod = await import('/src/game/run.ts');
  const R = rmod.Run.prototype;
  const down = R.playerDown;
  R.playerDown = function () {
    if (window.__god) {
      (window.__deaths ||= []).push(Math.round(this.time));
      this.player.hp = this.stats.maxHp;
      this.player.iframes = 2;
      return;
    }
    return down.call(this);
  };
  const upd = D.update;
  D.update = function (dt) {
    upd.call(this, dt);
    for (const b of window.__bossLog) if (b.run === this.run && b.killed === null && !b.e.alive) { b.killed = Math.round(this.run.time - b.at); b.dmgTaken = Math.round(this.run.damageTaken - b.dmgTaken0); }
  };
});
for (const dish of dishes.split(',')) {
  for (const sk of skills.split(',')) {
    for (let i = 0; i < +nRuns; i++) {
      const res = await page.evaluate(([s, c, t, k, pu, god]) => {
        window.__bossLog = [];
        window.__deaths = [];
        window.__god = !!god;
        window.__kf.save.powerups = pu;
        const r = window.__kf.simulate(s, c, t, k);
        const bosses = window.__bossLog.map((b) => ({ id: b.id, at: b.at, hp: b.hp, lvl: b.lvl, php: b.php + '/' + b.pmax, kill: b.killed, left: b.killed === null ? Math.round((b.e.hp / b.e.maxHp) * 100) + '%' : undefined, dmg: b.dmgTaken }));
        const snaps = r.snaps.map((x) => x.hp + '/' + x.maxHp + ' L' + x.lvl);
        delete r.snaps;
        const top = Object.entries(r.dmgBy).sort((a, b) => b[1] - a[1]).slice(0, 5);
        return { stage: r.stage, skill: k, god: !!god, deaths: window.__deaths.slice(), time: r.time, dead: r.dead, won: r.won, level: r.level, kills: r.kills, dmgTaken: r.dmgTaken, top, bosses, ingr: r.ingredients, snaps, wdmg: r.wdmg };
      }, [dish, char, +secs, +sk, pu, process.env.GOD === '1']);
      res.pu = puLabel;
      console.log(JSON.stringify(res));
    }
  }
}
if (logs.length) console.error(logs.slice(0, 5).join('\n'));
await browser.close();
