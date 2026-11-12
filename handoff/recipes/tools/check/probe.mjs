// node probe.mjs outdir scenario,...   scenarios: funghi floret bolo cheese aglio leap
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const [,, OUT = '.', list = 'funghi,floret,bolo,cheese,aglio,leap'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(`http://localhost:${process.env.PORT || 5405}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
await page.mouse.click(5, 5);
await page.evaluate(async () => { window.__E = (await import('/src/game/enemies.ts')).ENEMIES; });
async function start(stage) {
  await page.evaluate(async (stage) => {
    const kf = window.__kf;
    if (kf.run) { kf.run.state = 'dead'; kf.run = null; }
    document.querySelectorAll('.screen').forEach((x) => x.remove());
    kf.startRun('enzo', stage);
    await new Promise((r) => { const t = setInterval(() => { if (kf.run && kf.run.stage.id === stage) { clearInterval(t); r(); } }, 50); });
    kf.run.director.update = () => {};
    clearInterval(window.__ka);
    window.__ka = setInterval(() => { const rr = kf.run; if (rr) { rr.player.hp = rr.stats.maxHp = 1e6; } const ch = document.querySelector('.choice'); if (ch) ch.click(); document.querySelectorAll('.banner,.dish-banner,.toast').forEach((b) => b.remove()); }, 100);
  }, stage);
  await page.waitForTimeout(800);
}
async function freezeWhen(condSrc, focusSrc, timeout = 15000) {
  return page.evaluate(async ([condSrc, focusSrc, timeout]) => {
    const kf = window.__kf;
    const cond = new Function('r', 'return (' + condSrc + ')');
    const focus = new Function('r', 'return (' + focusSrc + ')');
    const t0 = performance.now();
    while (performance.now() - t0 < timeout) {
      const r = kf.run;
      if (r && cond(r)) { r.state = 'paused'; const f = focus(r); const R = kf.renderer; return { ok: true, sx: (f.x - R.camX) * R.zoom + R.W / 2, sy: (f.y - R.camY) * R.zoom + R.H / 2 }; }
      await new Promise((res) => requestAnimationFrame(res));
    }
    return { ok: false };
  }, [condSrc, focusSrc, timeout]);
}
async function shoot(name, f, w = 520, h = 400) {
  await page.waitForTimeout(150);
  if (f?.ok) {
    const x = Math.max(0, Math.min(1280 - w, f.sx - w / 2)), y = Math.max(0, Math.min(720 - h, f.sy - h / 2));
    await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x, y, width: w, height: h } });
  } else await page.screenshot({ path: `${OUT}/${name}_FULL.png` });
  await page.evaluate(() => { if (window.__kf.run) window.__kf.run.state = 'playing'; });
}
const S = {
  async funghi() {
    await start('carbonara');
    const res = await page.evaluate(async () => {
      const r = window.__kf.run;
      // a collider prop near the player
      const props = r.world.visible.filter((p) => p.collider && (p.collider.kind === 'circle' ? p.collider.r >= 14 : Math.min(p.collider.w, p.collider.h) >= 28));
      if (!props.length) return 'no prop';
      const p = props[0];
      const cx = p.x + (p.collider.ox ?? 0), cy = p.y + (p.collider.oy ?? 0);
      const f = r.spawnEnemy(window.__E.funghi, cx, cy);
      const h = r.spawnEnemy(window.__E.prosciutto, cx, cy);
      const b = r.spawnEnemy(window.__E.broccoli, cx, cy);
      const out = [];
      for (let i = 0; i < 6; i++) {
        await new Promise((res) => setTimeout(res, 120));
        out.push(['funghi', 'prosciutto', 'broccoli'].map((n, k) => { const e = [f, h, b][k]; return n + ':' + (r.world.free(e.x, e.y, e.r * 0.75) ? 'free' : 'INSIDE'); }).join(' '));
      }
      return { prop: p.id ?? p.kind ?? p.sprite, collider: p.collider, flying: window.__E.funghi.flying, out };
    });
    console.log('funghi', JSON.stringify(res));
  },
  async floret() {
    await start('alfredo');
    await page.evaluate(() => { const r = window.__kf.run; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; r.spawnEnemy(window.__E.broccoli, r.player.x + Math.cos(a) * 200, r.player.y + Math.sin(a) * 160); } });
    const f = await freezeWhen('r.areas.filter((a) => a.alive && a.kind === "floret").length >= 2', 'r.areas.find((a) => a.alive && a.kind === "floret")', 15000);
    const info = await page.evaluate(() => { const r = window.__kf.run; const kinds = {}; r.areas.filter((a) => a.alive).forEach((a) => { kinds[a.kind] = (kinds[a.kind] ?? 0) + 1; }); const a = r.areas.find((x) => x.alive && x.kind === 'floret'); return { kinds, sample: a && Object.fromEntries(Object.entries(a).filter(([k, v]) => typeof v !== 'object' && typeof v !== 'function')) }; });
    console.log('floret', JSON.stringify(info));
    await shoot('floret', f, 600, 440);
    // slow check: put the player on a floret patch and read his speed multiplier
    const slow = await page.evaluate(async () => { const r = window.__kf.run; const a = r.areas.find((x) => x.alive && x.kind === 'floret'); if (!a) return 'none'; r.player.x = a.x; r.player.y = a.y; await new Promise((res) => setTimeout(res, 300)); const p = r.player; return Object.fromEntries(Object.entries(p).filter(([k, v]) => /slow|speed/i.test(k))); });
    console.log('floret slow on player', JSON.stringify(slow));
  },
  async floret2() {
    await start('alfredo');
    await page.evaluate(() => { const r = window.__kf.run; for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; r.spawnEnemy(window.__E.broccoli, r.player.x + Math.cos(a) * 220, r.player.y + Math.sin(a) * 170); } });
    // wait for a patch, then walk the chef away so it is uncovered
    await page.evaluate(async () => { const r = window.__kf.run; for (let i = 0; i < 300; i++) { if (r.areas.some((a) => a.alive && a.kind === 'floret')) break; await new Promise((res) => setTimeout(res, 50)); } r.player.x += 140; window.__fa = r.areas.find((a) => a.alive && a.kind === 'floret'); });
    const f = await freezeWhen('window.__fa && window.__fa.life > 1.3', 'window.__fa', 8000);
    await shoot('floret2', f, 300, 220);
  },
  async cheesedbg() {
    await start('carbonara');
    const out = await page.evaluate(async () => { const r = window.__kf.run; const es = []; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; es.push(r.spawnEnemy(window.__E.parmesan, r.player.x + Math.cos(a) * 200, r.player.y + Math.sin(a) * 160)); }
      const log = []; for (let k = 0; k < 16; k++) { await new Promise((res) => setTimeout(res, 1000)); const kinds = {}; r.areas.filter((a) => a.alive).forEach((a) => { kinds[a.kind] = (kinds[a.kind] ?? 0) + 1; }); log.push(Math.round(r.time) + ' ' + JSON.stringify(kinds) + ' alive ' + es.filter((e) => e.alive).length + ' d ' + es.map((e) => Math.round(Math.hypot(e.x - r.player.x, e.y - r.player.y))).join(',') + ' proj ' + r.projectiles.filter((p) => p.alive && p.enemy).length + ' state ' + r.state); }
      return log; });
    console.log(out.join('\n'));
  },
  async cheese2() {
    for (const stage of ['carbonara', 'vongole']) {
      await start(stage);
      await page.evaluate(async () => { const r = window.__kf.run; for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; r.spawnEnemy(window.__E.parmesan, r.player.x + Math.cos(a) * 200, r.player.y + Math.sin(a) * 160); }
        for (let i = 0; i < 400; i++) { const a = r.areas.find((x) => x.alive && x.kind === 'cheese'); if (a) { window.__ca = a; break; } await new Promise((res) => setTimeout(res, 50)); }
        r.player.x += 150; r.player.y += 40; });
      const f = await freezeWhen('window.__ca && window.__ca.life < 2.6', 'window.__ca', 10000);
      console.log('cheese2', stage, f.ok, await page.evaluate(() => JSON.stringify({ life: window.__ca?.life, r: window.__ca?.r })));
      await shoot('cheese2_' + stage, f, 240, 180);
    }
  },
  async bolo() {
    await start('ragu');
    await page.evaluate(() => { const r = window.__kf.run; r.time = 310; r.director.spawnBoss('b_bolognese', 7000, true); const e = r.bosses[r.bosses.length - 1]; e.x = r.player.x + 160; e.y = r.player.y - 20; e.bossAttack = 'phase'; e.bossT = 0; e.timer = 0; window.__boss = e; });
    let f = await freezeWhen('window.__boss.fade >= 0.99', 'window.__boss', 15000);
    console.log('bolo phased', f.ok, await page.evaluate(() => window.__boss.fade));
    await shoot('bolo_phased', f, 420, 340);
    f = await freezeWhen('window.__boss.fade > 0.4 && window.__boss.fade < 0.6', 'window.__boss', 15000);
    console.log('bolo half', f.ok);
    await shoot('bolo_half', f, 420, 340);
    f = await freezeWhen('window.__boss.fade === 0 && window.__boss.bossAttack !== "phase"', 'window.__boss', 15000);
    console.log('bolo solid', f.ok);
    await shoot('bolo_solid', f, 420, 340);
  },
  async cheese() {
    for (const stage of ['carbonara', 'vongole']) {
      await start(stage);
      await page.evaluate(() => { const r = window.__kf.run; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; r.spawnEnemy(window.__E.parmesan, r.player.x + Math.cos(a) * 200, r.player.y + Math.sin(a) * 160); } });
      const f = await freezeWhen('r.areas.filter((a) => a.alive && a.kind === "cheese" && a.life > 0.8).length >= 1', 'r.areas.find((a) => a.alive && a.kind === "cheese")', 20000);
      console.log('cheese', stage, f.ok, await page.evaluate(() => JSON.stringify(window.__kf.run.areas.filter((a) => a.alive && a.kind === 'cheese').map((a) => ({ r: a.r, dmg: a.dmg ?? a.damage, life: a.life })))));
      await shoot('cheese_' + stage, f, 560, 420);
    }
  },
  async aglio() {
    await start('amatriciana');
    await page.evaluate(() => { const r = window.__kf.run; r.time = 310; r.director.spawnBoss('b_aglio', 7000, true); const e = r.bosses[r.bosses.length - 1]; e.x = r.player.x + 230; e.y = r.player.y + 20; window.__boss = e; });
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const f = await freezeWhen('window.__boss.telegraph > 0.05', 'window.__boss', 12000);
      pts.push(f.ok);
      await shoot('aglio_tell' + i, f, 420, 380);
      await page.waitForTimeout(1600);
    }
    console.log('aglio tells', pts);
  },
  async leap() {
    await start('alfredo');
    await page.evaluate(() => { const r = window.__kf.run; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; r.spawnEnemy(window.__E[i % 2 ? 'gamberi' : 'pollo'], r.player.x + Math.cos(a) * 260, r.player.y + Math.sin(a) * 200); } });
    for (const [k, cond] of [['up', 'e.aux > 0 && e.timer / e.aux > 0.6 && e.timer / e.aux < 0.75'], ['top', 'e.aux > 0 && Math.abs(e.timer / e.aux - 0.5) < 0.06'], ['ground', 'e.state !== 1']]) {
      const f = await freezeWhen(`r.enemies.some((e) => e.alive && e.def.behavior === 'leaper' && ${k === 'ground' ? cond : 'e.state === 1 && ' + cond} && (window.__lp = e))`, 'window.__lp', 8000);
      console.log('leap', k, f.ok, await page.evaluate(() => JSON.stringify({ id: window.__lp?.def.id, z: Math.round(window.__lp?.z ?? -1), state: window.__lp?.state })));
      await shoot('leap_' + k, f, 300, 220);
      await page.waitForTimeout(300);
    }
  },
};
for (const name of list.split(',')) { try { await S[name](); } catch (e) { console.log('FAIL', name, e.message); } }
console.log('errors', errors.length, errors.slice(0, 10).join('\n'));
await browser.close();
