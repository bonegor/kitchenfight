/** Static illustrated previews of a stage (tiles + props + a few crimes). */
import { envForStage } from '../gfx/envvariants';
import { getSprite, drawSprite, hasSprite } from '../gfx/sprites';
import { hash2, seededRandom } from '../core/math';
import { ENEMIES } from '../game/enemies';
import { recipeById } from '../game/recipes';
import type { StageDef } from '../game/stages';

export interface PreviewOptions {
  /**
   * Il Menù cards: no chef in the middle (the dish is plated there, in the DOM) and the
   * dish's intruders closing in on it in a ring, each facing the plate.
   */
  ring?: boolean;
}

export function renderStagePreview(cv: HTMLCanvasElement, stage: StageDef, chefSprite = 'chef.enzo', opts: PreviewOptions = {}) {
  const env = envForStage(stage); // the dish's variant (light + decor) of its environment
  const W = cv.width, H = cv.height;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#3a2a22';
  ctx.fillRect(0, 0, W, H);
  if (!env) return;
  const zoom = W / 560;
  const vw = W / zoom, vh = H / zoom;
  // find an interesting spot: chunk (1,0) area
  const ox = env.chunkSize * 0.9 - vw / 2, oy = env.chunkSize * 0.35 - vh / 2;
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-ox, -oy);
  const ts = env.tileSize;
  for (let ty = Math.floor(oy / ts); ty * ts < oy + vh; ty++)
    for (let tx = Math.floor(ox / ts); tx * ts < ox + vw; tx++) {
      const s = getSprite(env.tile(tx, ty));
      ctx.drawImage(s.frames[0], tx * ts, ty * ts, ts + 1, ts + 1);
    }
  const cs = env.chunkSize;
  const props: any[] = [];
  for (let cy = Math.floor(oy / cs) - 1; cy * cs < oy + vh + cs; cy++)
    for (let cx = Math.floor(ox / cs) - 1; cx * cs < ox + vw + cs; cx++) {
      try {
        props.push(...env.populate(cx, cy, seededRandom(hash2(cx, cy, 977))));
      } catch {
        /* ignore */
      }
    }
  const rnd = seededRandom(stage.num * 1337);
  const pool = stage.waves[4]?.pool ?? [];
  const actors: { sprite: string; x: number; y: number; flip: boolean }[] = [];
  if (opts.ring) {
    // every intruder of the dish once (the finale: the first eight), around the plate
    const ids = (recipeById(stage.recipe)?.intruders.map((i) => i.enemy) ?? pool.map((p) => p[0])).slice(0, 8);
    const n = Math.max(ids.length, 5);
    const cx = ox + vw * 0.5, cy = oy + vh * 0.56;
    const a0 = rnd() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const def = ENEMIES[ids[i % ids.length]];
      if (!def || !hasSprite(def.sprite)) continue;
      const a = a0 + (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
      const x = cx + Math.cos(a) * vw * (0.37 + rnd() * 0.06);
      const y = cy + Math.sin(a) * vh * (0.33 + rnd() * 0.05);
      actors.push({ sprite: def.sprite, x, y, flip: x > cx });
    }
  } else {
    for (let i = 0; i < 7 && pool.length; i++) {
      const id = pool[Math.floor(rnd() * pool.length)][0];
      const def = ENEMIES[id];
      if (!def || !hasSprite(def.sprite)) continue;
      actors.push({ sprite: def.sprite, x: ox + vw * (0.12 + rnd() * 0.76), y: oy + vh * (0.25 + rnd() * 0.65), flip: rnd() < 0.5 });
    }
    if (hasSprite(chefSprite)) actors.push({ sprite: chefSprite, x: ox + vw * 0.5, y: oy + vh * 0.62, flip: false });
  }
  const floor = props.filter((p) => p.layer === 'floor');
  const sorted = [...props.filter((p) => !p.layer || p.layer === 'sorted').map((p) => ({ ...p, a: false })), ...actors.map((a) => ({ ...a, a: true }))].sort((a, b) => a.y - b.y);
  for (const p of floor) if (hasSprite(p.sprite)) drawSprite(ctx, p.sprite, p.frame ?? 0, p.x, p.y, p.flip ? -1 : 1, 1);
  for (const p of sorted) {
    if (!hasSprite(p.sprite)) continue;
    if (p.a) {
      ctx.fillStyle = 'rgba(30,16,10,0.25)';
      ctx.beginPath();
      const s = getSprite(p.sprite);
      ctx.ellipse(p.x, p.y + s.h * 0.22, s.w * 0.28, s.w * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(ctx, p.sprite, 0, p.x, p.y, p.flip ? -1 : 1, 1);
    } else drawSprite(ctx, p.sprite, p.frame ?? 0, p.x, p.y, p.flip ? -1 : 1, 1);
  }
  for (const p of props) if (p.layer === 'overhead' && hasSprite(p.sprite)) drawSprite(ctx, p.sprite, p.frame ?? 0, p.x, p.y, p.flip ? -1 : 1, 1);
  ctx.restore();
  // ambient tint + vignette
  const amb = env.ambient;
  if (amb.tint && amb.tint !== '#ffffff') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = amb.tint;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
  const dark = stage.nightRamp ? stage.nightRamp[0] + 0.1 : amb.darkness;
  if (dark > 0) {
    const g = ctx.createRadialGradient(W / 2, H * 0.6, H * 0.1, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, hexA(amb.darkColor, Math.min(0.8, dark * 1.2)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.65);
  v.addColorStop(0, 'rgba(20,8,4,0)');
  v.addColorStop(1, 'rgba(20,8,4,0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
