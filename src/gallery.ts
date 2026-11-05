/**
 * DEV ONLY — sprite gallery for visual QA.
 *
 *   /gallery.html?prefix=enemy.            all sprites whose id starts with "enemy."
 *   &zoom=2                                 display zoom (default 1.5)
 *   &bg=#3b2f2a | &bg=tile:tile.kitchen.0   background colour or tiled sprite
 *   &frames=1                               show every animation frame (default 1 = yes)
 *   &flash=1                                also show hit-flash silhouette
 *   &cols=8                                 columns
 *   /gallery.html?stage=kitchen&zoom=1      stage environment preview (tiles + props)
 */
import './gfx/art/index';
import { getSprite, spriteIds, drawSprite, RES } from './gfx/sprites';
import { STAGE_ENVS } from './gfx/art/index';

const q = new URLSearchParams(location.search);
const root = document.getElementById('root')!;

function bgFill(ctx: CanvasRenderingContext2D, w: number, h: number, bg: string, zoom: number) {
  if (bg.startsWith('tile:')) {
    const s = getSprite(bg.slice(5));
    for (let y = 0; y < h / zoom; y += s.h) for (let x = 0; x < w / zoom; x += s.w) ctx.drawImage(s.frames[0], x, y, s.w, s.h);
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
}

function gallery() {
  const prefix = q.get('prefix') ?? '';
  const zoom = parseFloat(q.get('zoom') ?? '1.5');
  const bg = q.get('bg') ?? '#5b4a3f';
  const showFrames = q.get('frames') !== '0';
  const showFlash = q.get('flash') === '1';
  const cols = parseInt(q.get('cols') ?? '6');
  const ids = spriteIds(prefix).sort();
  const cells: { id: string; frames: number; w: number; h: number }[] = ids.map((id) => {
    const s = getSprite(id);
    return { id, frames: showFrames ? s.frames.length : 1, w: s.w, h: s.h };
  });
  const pad = 10;
  const cellW = Math.max(...cells.map((c) => c.w * (c.frames + (showFlash ? 1 : 0)) + pad * (c.frames + 1)), 80);
  const cellH = Math.max(...cells.map((c) => c.h), 40) + 22;
  const W = Math.min(cols, cells.length) * cellW * zoom;
  const H = Math.ceil(cells.length / cols) * cellH * zoom;
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  root.appendChild(cv);
  const ctx = cv.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.save();
  ctx.scale(zoom, zoom);
  bgFill(ctx, W, H, bg, zoom);
  cells.forEach((c, i) => {
    const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
    const s = getSprite(c.id);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
    for (let f = 0; f < c.frames; f++) {
      const x = cx + pad + f * (c.w + pad) + s.ax;
      const y = cy + 4 + s.ay;
      drawSprite(ctx, c.id, f, x, y);
    }
    if (showFlash && s.flash) {
      const x = cx + pad + c.frames * (c.w + pad);
      ctx.drawImage(s.flash, x, cy + 4, s.w, s.h);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '7px system-ui';
    ctx.fillText(`${c.id}  (${c.w}x${c.h}${s.frames.length > 1 ? ', ' + s.frames.length + 'f' : ''})`, cx + 4, cy + cellH - 6);
  });
  ctx.restore();
  document.title = `gallery ${prefix} (${cells.length}) RES=${RES}`;
}

function stagePreview(id: string) {
  const env = STAGE_ENVS[id];
  if (!env) { root.textContent = 'unknown stage ' + id + ' — known: ' + Object.keys(STAGE_ENVS).join(', '); return; }
  const zoom = parseFloat(q.get('zoom') ?? '1');
  const W = parseInt(q.get('w') ?? '1400'), H = parseInt(q.get('h') ?? '900');
  const ox = parseFloat(q.get('x') ?? '0'), oy = parseFloat(q.get('y') ?? '0');
  const cv = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  root.appendChild(cv);
  const ctx = cv.getContext('2d')!;
  ctx.scale(dpr * zoom, dpr * zoom);
  ctx.translate(-ox, -oy);
  const vw = W / zoom, vh = H / zoom;
  // tiles
  const ts = env.tileSize;
  for (let ty = Math.floor(oy / ts); ty * ts < oy + vh; ty++) {
    for (let tx = Math.floor(ox / ts); tx * ts < ox + vw; tx++) {
      const sid = env.tile(tx, ty);
      const s = getSprite(sid);
      ctx.drawImage(s.frames[0], tx * ts, ty * ts, ts + 0.5, ts + 0.5);
    }
  }
  // props
  const cs = env.chunkSize;
  const props: any[] = [];
  for (let cy = Math.floor(oy / cs) - 1; cy * cs < oy + vh + cs; cy++) {
    for (let cx = Math.floor(ox / cs) - 1; cx * cs < ox + vw + cs; cx++) {
      let seed = (cx * 73856093) ^ (cy * 19349663) ^ 0x5bd1e995;
      const R = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      props.push(...env.populate(cx, cy, R));
    }
  }
  const floor = props.filter((p) => p.layer === 'floor');
  const sorted = props.filter((p) => !p.layer || p.layer === 'sorted').sort((a, b) => a.y - b.y);
  const over = props.filter((p) => p.layer === 'overhead');
  for (const p of [...floor, ...sorted, ...over]) {
    drawSprite(ctx, p.sprite, p.frame ?? 0, p.x, p.y, p.flip ? -1 : 1, 1);
  }
  if (q.get('colliders') === '1') {
    ctx.strokeStyle = 'rgba(0,255,255,0.8)';
    ctx.lineWidth = 1;
    for (const p of props) {
      const c = p.collider; if (!c) continue;
      ctx.beginPath();
      if (c.kind === 'circle') ctx.arc(p.x + (c.ox ?? 0), p.y + (c.oy ?? 0), c.r, 0, Math.PI * 2);
      else ctx.rect(p.x + (c.ox ?? 0) - c.w / 2, p.y + (c.oy ?? 0) - c.h / 2, c.w, c.h);
      ctx.stroke();
    }
  }
  // sample characters for scale reference
  if (q.get('chars') !== '0') {
    const cxm = ox + vw / 2, cym = oy + vh / 2;
    drawSprite(ctx, 'chef.enzo', 0, cxm, cym);
  }
}

const stage = q.get('stage');
if (stage) stagePreview(stage);
else gallery();
