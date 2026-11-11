// Soak test: run every dish of the menu to 15:00+ in god mode with rendering every few steps; report errors.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const port = process.env.PORT || '5175';
const stages = (process.argv[2] || 'pomodoro,carbonara,alfredo,amatriciana,cacioepepe,margherita,marinara,ragu,pesto,vongole,foodcourt').split(',');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(0);
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + e.stack));
page.on('console', (m) => { if (m.type() === 'error') logs.push('console: ' + m.text()); });
await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
await page.mouse.click(5, 5);
for (const st of stages) {
  const res = await page.evaluate(async (st) => {
    const kf = window.__kf;
    kf.startRun('enzo', st);
    await new Promise((r) => { const t = setInterval(() => { if (kf.run) { clearInterval(t); r(); } }, 50); });
    const run = kf.run;
    kf.mode = 'soak'; // stop the app loop from driving this run
    run.autopilot = null;
    const errors = [];
    const dt = 1 / 30;
    let steps = 0, rendered = 0, maxEnemies = 0, maxProj = 0;
    const t0 = performance.now();
    while (run.time < 905 && steps < 40000) {
      run.player.hp = run.stats.maxHp;
      run.player.iframes = 0.1;
      // keep the bot moving in circles
      run.input = { moveX: Math.cos(run.time * 0.7), moveY: Math.sin(run.time * 0.9) };
      try {
        kf.renderer.updateCamera(run, dt);
        run.update(dt);
        if (run.state === 'levelup') { const c = run.rollChoices(3); run.applyChoice(c[0]); run.pendingLevels = 0; run.state = 'playing'; }
        if (run.state === 'chest') run.state = 'playing';
        if (steps % 15 === 0) { kf.renderer.render(run, dt * 15, null); rendered++; }
      } catch (e) {
        errors.push(String(e && e.stack || e));
        if (errors.length > 3) break;
      }
      maxEnemies = Math.max(maxEnemies, run.enemies.length);
      maxProj = Math.max(maxProj, run.projectiles.length);
      steps++;
      if (steps % 3000 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    const out = { st, time: Math.round(run.time), level: run.level, kills: run.kills, steps, rendered, maxEnemies, maxProj, bossesSeen: Object.keys(run.killsBy).filter((k) => k.startsWith('b_')), alive: run.bosses.map((b) => b.def.id), ms: Math.round(performance.now() - t0), errors };
    kf.mode = 'menu';
    kf.run = null;
    return out;
  }, st);
  console.log(JSON.stringify(res));
}
console.log(logs.slice(0, 10).join('\n') || 'no page errors');
await browser.close();
