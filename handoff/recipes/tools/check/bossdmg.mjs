import { createRequire } from 'module';
const require = createRequire('/home/user/kitchenfight/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:5405/`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.press-start', { timeout: 120000 });
const r = await page.evaluate(async () => {
  const { ENEMIES } = await import('/src/game/enemies.ts');
  const { STAGES, stageRuleProblems } = await import('/src/game/stages.ts');
  const b = Object.values(ENEMIES).filter((e) => e.boss).map((e) => e.id + ':' + e.damage);
  const st = STAGES.map((s) => s.id + ' dmgBase ' + s.dmgBase + ' bosses ' + s.bosses.map((x) => x.id + '=' + x.hp).join(','));
  return { b, st, rules: stageRuleProblems() };
});
console.log(r.b.join(' '));
console.log(r.st.join('\n'));
console.log('rules', JSON.stringify(r.rules));
await browser.close();
