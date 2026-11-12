// Batch balance sims: boss kill times, deaths (GOD=1 auto-revive), damage taken per minute and by source/phase.
// node sim3.mjs "<dish,dish>" <char> <secs> "<skill,skill>" <n> [label]   (PORT, POWERUPS, GOD env)
// One JSON line per run.
import { createRequire } from 'module';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const [,, dishes = 'pomodoro', char = 'enzo', secs = '900', skills = '1', nRuns = '3', label = ''] = process.argv;
const port = process.env.PORT || '5401';
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
    if (this.run.bosses.length > n0 && e) window.__bossLog.push({ run: this.run, e, id, at: Math.round(this.run.time), hp: Math.round(e.maxHp), lvl: this.run.level, killed: null, dmg0: this.run.damageTaken });
  };
  const rmod = await import('/src/game/run.ts');
  const R = rmod.Run.prototype;
  const down = R.playerDown;
  R.playerDown = function () {
    if (window.__god) {
      window.__deaths.push(Math.round(this.time));
      this.player.hp = this.stats.maxHp;
      this.player.iframes = 2;
      return;
    }
    if (this.revivals <= 0) window.__deaths.push(Math.round(this.time));
    return down.call(this);
  };
  const hurt = R.hurtPlayer;
  R.hurtPlayer = function (dmg, sx, sy, src = '?') {
    const before = this.damageTaken;
    hurt.call(this, dmg, sx, sy, src);
    const d = this.damageTaken - before;
    if (d > 0) {
      const m = Math.floor(this.time / 60);
      window.__dpm[m] = (window.__dpm[m] ?? 0) + d;
      const ph = this.time < 300 ? 'a' : this.time < 900 ? 'b' : 'c';
      const boss = this.bosses.some((b) => b.alive);
      const key = ph + (boss ? 'B' : 'w');
      const o = (window.__src[key] ||= {});
      o[src] = (o[src] ?? 0) + d;
    }
  };
  const upd = D.update;
  D.update = function (dt) {
    upd.call(this, dt);
    for (const b of window.__bossLog) if (b.run === this.run && b.killed === null && !b.e.alive) { b.killed = Math.round(this.run.time - b.at); b.dmg = Math.round(this.run.damageTaken - b.dmg0); }
  };
});
// OVR env: {"<dish>|*": {dmgBase, hpBase, hpGrowth, rate, max, bossHp:[a,b,c], bossMul:[a,b,c]}} patches the live stage objects
if (process.env.OVR) {
  const info = await page.evaluate(async (ovr) => {
    const S = await import('/src/game/stages.ts');
    const out = [];
    for (const st of S.STAGES) {
      const o = { ...(ovr['*'] ?? {}), ...(ovr[st.tier] ?? {}), ...(ovr[st.id] ?? {}) };
      if (!Object.keys(o).length) continue;
      for (const k of ['dmgBase', 'hpBase', 'hpGrowth']) if (o[k] !== undefined) st[k] = o[k];
      if (o.rate !== undefined) st.waves.forEach((w, i) => { w.rate = Math.round(S.BASE_RATE[i] * S.rateFactor(o.rate, i) * 100) / 100; });
      if (o.max !== undefined) st.waves.forEach((w, i) => { w.max = Math.round(S.BASE_MAX[i] * o.max); });
      if (o.bossHp) st.bosses.forEach((b, i) => { b.hp = o.bossHp[i]; });
      if (o.bossMul) st.bosses.forEach((b, i) => { b.hp = Math.round(b.hp * o.bossMul[i]); });
      out.push(st.id + ' ' + JSON.stringify({ hpBase: st.hpBase, hpGrowth: st.hpGrowth, dmgBase: st.dmgBase, rates: st.waves.map((w) => w.rate).join(' '), bosses: st.bosses.map((b) => b.hp).join(' ') }));
    }
    return out;
  }, JSON.parse(process.env.OVR));
  console.error(info.join('\n'));
}
for (const dish of dishes.split(',')) {
  for (const sk of skills.split(',')) {
    for (let i = 0; i < +nRuns; i++) {
      const res = await page.evaluate(([s, c, t, k, pu, god]) => {
        window.__bossLog = [];
        window.__deaths = [];
        window.__dpm = [];
        window.__src = {};
        window.__god = !!god;
        window.__kf.save.powerups = pu;
        const r = window.__kf.simulate(s, c, t, k);
        const bosses = window.__bossLog.map((b) => ({ id: b.id, at: b.at, hp: b.hp, lvl: b.lvl, kill: b.killed, left: b.killed === null ? Math.round((b.e.hp / b.e.maxHp) * 100) : undefined, dmg: b.dmg }));
        const src = {};
        for (const [k2, o] of Object.entries(window.__src)) src[k2] = Object.fromEntries(Object.entries(o).map(([a, b]) => [a, Math.round(b)]));
        const dpm = [];
        for (let m = 0; m < 26; m++) dpm.push(Math.round(window.__dpm[m] ?? 0));
        return { stage: r.stage, skill: k, god: !!god, deaths: window.__deaths.slice(), time: r.time, dead: r.dead, won: r.won, level: r.level, kills: r.kills, dmgTaken: r.dmgTaken, dpm, src, bosses, ingr: r.ingredients, ms: r.ms, snaps: r.snaps.map((x) => x.lvl + ':' + x.hp + '/' + x.maxHp + ':' + x.alive) };
      }, [dish, char, +secs, +sk, pu, process.env.GOD === '1']);
      res.label = label;
      console.log(JSON.stringify(res));
    }
  }
}
if (logs.length) console.error(logs.slice(0, 5).join('\n'));
await browser.close();
