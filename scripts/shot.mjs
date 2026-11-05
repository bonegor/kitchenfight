// Usage: node scripts/shot.mjs "<url path+query>" out.png [width] [height] [dpr]
// Requires the dev server running (npx vite --port 5173).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')); }
const [,, path = '/gallery.html', out = 'shot.png', w = '1400', h = '900', dpr = '1'] = process.argv;
const port = process.env.PORT || '5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(+(process.env.WAIT || 600));
await page.screenshot({ path: out, fullPage: process.env.FULL === '1' });
if (logs.length) console.log(logs.join('\n'));
await browser.close();
console.log('saved', out);
