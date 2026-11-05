/**
 * ITEMS KIT — shared palette + helpers for icons, pickups, projectiles and FX.
 *
 * - `S()` / `G()` wrap painter.shape()/group() so the cel-shadow crescent stays on
 *   the lower-right *on screen* even when the object is drawn rotated/mirrored.
 * - `composite()` paints into an offscreen layer and re-draws it with an outer
 *   bright edge / glow / drop shadow (used for icons and projectiles).
 */
import { defineSprite } from '../sprites';
import { Ctx, Pt, ShapeStyle, shape, group, INK, ellipsePath, circlePath, rgba, polyPath, shade, light } from '../painter';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
export const P = {
  ink: INK,
  // gold
  gold: '#f8c437',
  goldL: '#fff1a6',
  goldD: '#cf8616',
  goldDD: '#9a5a0c',
  // steel
  steel: '#dbe2ea',
  steelD: '#97a3b6',
  steelDD: '#6c778b',
  // wood
  wood: '#dda266',
  woodD: '#b67a40',
  woodDD: '#8a5530',
  woodL: '#f3cb94',
  // food
  tomato: '#e63b2e',
  tomatoD: '#b3242a',
  basil: '#3fb04b',
  basilD: '#23803a',
  basilL: '#9ae67e',
  olive: '#8fb33d',
  oliveD: '#5f8c25',
  cheese: '#f6d77a',
  rind: '#d79a3a',
  cream: '#fff5df',
  white: '#fbf6ea',
  whiteSh: '#d4d3df',
  red: '#dc3439',
  green: '#2f9a52',
  chilli: '#e3262b',
  dough: '#f4dcae',
  crust: '#e3ad62',
  brass: '#e2a945',
};

// ---------------------------------------------------------------------------
// Rotation-aware cel shading
// ---------------------------------------------------------------------------

/** Convert a screen-space light offset into the current local frame. */
export function lit(ctx: Ctx, ox: number, oy: number): Pt {
  const m = ctx.getTransform();
  const det = m.a * m.d - m.b * m.c;
  if (!det) return [ox, oy];
  const k = Math.sqrt(Math.abs(det));
  return [((m.d * ox - m.c * oy) / det) * k, ((-m.b * ox + m.a * oy) / det) * k];
}

/** shape() with a screen-space shadow offset. */
export function S(ctx: Ctx, build: (c: Ctx) => void, st: ShapeStyle) {
  const so = st.shadowOffset ?? [-2.2, -2.6];
  shape(ctx, build, { ...st, shadowOffset: lit(ctx, so[0], so[1]) });
}

/** group() with screen-space shadow offsets. */
export function G(ctx: Ctx, parts: { build: (c: Ctx) => void; style: ShapeStyle }[], ink = 2.4, inkColor = INK) {
  group(
    ctx,
    parts.map((p) => {
      const so = p.style.shadowOffset ?? [-2.2, -2.6];
      return { build: p.build, style: { ...p.style, shadowOffset: lit(ctx, so[0], so[1]) } };
    }),
    ink,
    inkColor,
  );
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

/** Polished gold along a direction (x0,y0)->(x1,y1). */
export function goldGrad(ctx: Ctx, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#fff7c9');
  g.addColorStop(0.28, '#ffdc54');
  g.addColorStop(0.62, '#f6b126');
  g.addColorStop(1, '#d9861a');
  return g;
}

/** Metallic cylinder band (bright stripe near the top) across y0->y1. */
export function cylGrad(ctx: Ctx, y0: number, y1: number, cols: [string, string, string, string]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, cols[1]);
  g.addColorStop(0.22, cols[0]);
  g.addColorStop(0.45, cols[1]);
  g.addColorStop(0.82, cols[2]);
  g.addColorStop(1, cols[3]);
  return g;
}

export const GOLD_CYL: [string, string, string, string] = ['#fff6c4', '#ffd447', '#d98b17', '#f0b23a'];
export const STEEL_CYL: [string, string, string, string] = ['#ffffff', '#dfe5ee', '#99a6b9', '#c4ccd8'];

/** Radial gold for discs/spheres lit from the upper-left. */
export function goldBall(ctx: Ctx, x: number, y: number, r: number) {
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r * 1.1);
  g.addColorStop(0, '#fffbe0');
  g.addColorStop(0.25, '#ffe066');
  g.addColorStop(0.65, '#f5ae24');
  g.addColorStop(1, '#c97810');
  return g;
}

export function radial(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][], fx?: number, fy?: number) {
  const g = ctx.createRadialGradient(fx ?? x, fy ?? y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function linear(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// ---------------------------------------------------------------------------
// Small decorative helpers
// ---------------------------------------------------------------------------

/** 4-point star sparkle path. */
export function sparklePath(ctx: Ctx, x: number, y: number, r: number, pinch = 0.16, rot = 0) {
  const k = r * pinch;
  const pts: Pt[] = [];
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2 - Math.PI / 2;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2 - Math.PI / 2 + Math.PI / 4;
    const n = pts[(i + 1) % 4];
    ctx.quadraticCurveTo(x + Math.cos(a) * k, y + Math.sin(a) * k, n[0], n[1]);
  }
  ctx.closePath();
}

/** A glowing white/gold sparkle. */
export function sparkle(ctx: Ctx, x: number, y: number, r: number, color = '#fffbe6', alpha = 1, rot = 0, glowCol = '#ffe27a') {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.1);
  g.addColorStop(0, rgba(glowCol, 0.55));
  g.addColorStop(1, rgba(glowCol, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  circlePath(ctx, x, y, r * 1.1);
  ctx.fill();
  ctx.beginPath();
  sparklePath(ctx, x, y, r, 0.14, rot);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Inked sparkle (readable on light backgrounds too). */
export function inkSparkle(ctx: Ctx, x: number, y: number, r: number, fill = '#fff6c8', ink = 1, rot = 0) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  sparklePath(ctx, x, y, r, 0.2, rot);
  ctx.lineWidth = ink * 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  sparklePath(ctx, x - r * 0.08, y - r * 0.08, r * 0.45, 0.2, rot);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

/** Radiant ray burst (wedges) fading outward. */
export function rays(ctx: Ctx, x: number, y: number, r0: number, r1: number, n: number, color: string, alpha = 0.6, rot = 0, width = 0.5) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.55, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  const step = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    const a = rot + i * step;
    const w = step * width * (i % 2 ? 0.55 : 1);
    const rr = i % 2 ? r1 * 0.78 : r1;
    ctx.moveTo(x + Math.cos(a - w * 0.18) * r0, y + Math.sin(a - w * 0.18) * r0);
    ctx.lineTo(x + Math.cos(a - w / 2) * rr, y + Math.sin(a - w / 2) * rr);
    ctx.lineTo(x + Math.cos(a + w / 2) * rr, y + Math.sin(a + w / 2) * rr);
    ctx.lineTo(x + Math.cos(a + w * 0.18) * r0, y + Math.sin(a + w * 0.18) * r0);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

/** Soft radial glow blob. */
export function softGlow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 0.8, ry?: number) {
  ctx.save();
  ctx.translate(x, y);
  if (ry && ry !== r) ctx.scale(1, ry / r);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.45, rgba(color, alpha * 0.5));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  circlePath(ctx, 0, 0, r);
  ctx.fill();
  ctx.restore();
}

/** Curved motion/speed lines (an arc of strokes). */
export function swoosh(ctx: Ctx, x: number, y: number, r: number, a0: number, a1: number, width: number, color: string, alpha = 0.8, ink = 0) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha;
  const n = 6;
  const pass = (col: string, extra: number) => {
    ctx.strokeStyle = col;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      ctx.beginPath();
      ctx.arc(x, y, r, a0 + (a1 - a0) * t0, a0 + (a1 - a0) * t1, a1 < a0);
      ctx.lineWidth = Math.max(0.3, width * (0.25 + 0.75 * t1)) + extra;
      ctx.stroke();
    }
  };
  if (ink > 0) pass(INK, ink * 2);
  pass(color, 0);
  ctx.restore();
}

/** Inked tube stroke along a smooth path (for prongs, noodles, handles). */
export function tube(ctx: Ctx, pts: Pt[], width: number, fill: string | CanvasGradient, ink = 1.6, smooth = true, hi?: string, hiAlpha = 0.6) {
  const run = (w: number, col: string | CanvasGradient, alpha = 1, off: Pt = [0, 0]) => {
    ctx.save();
    ctx.beginPath();
    const p = pts.map(([x, y]) => [x + off[0], y + off[1]] as Pt);
    if (smooth && p.length > 2) {
      // simple catmull-rom
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
        ctx.bezierCurveTo(
          p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
          p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
          p2[0], p2[1],
        );
      }
    } else polyPath(ctx, p, false);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = col;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.restore();
  };
  if (ink > 0) run(width + ink * 2, INK);
  run(width, fill);
  if (hi) {
    const [lx, ly] = lit(ctx, -width * 0.18, -width * 0.22);
    run(width * 0.32, hi, hiAlpha, [lx, ly]);
  }
}

// ---------------------------------------------------------------------------
// Offscreen compositing: bright edges, glows, drop shadows
// ---------------------------------------------------------------------------

function layerCanvas(ctx: Ctx): HTMLCanvasElement {
  const src = ctx.canvas as HTMLCanvasElement;
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  return c;
}

function paintLayer(ctx: Ctx, paint: (c: Ctx) => void): HTMLCanvasElement {
  const c = layerCanvas(ctx);
  const o = c.getContext('2d')!;
  o.imageSmoothingEnabled = true;
  o.imageSmoothingQuality = 'high';
  o.setTransform(ctx.getTransform());
  paint(o);
  return c;
}

function tint(ctx: Ctx, img: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = layerCanvas(ctx);
  const o = c.getContext('2d')!;
  o.drawImage(img, 0, 0);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = color;
  o.fillRect(0, 0, c.width, c.height);
  return c;
}

function ring(ctx: Ctx, sil: HTMLCanvasElement, px: number): HTMLCanvasElement {
  const c = layerCanvas(ctx);
  const o = c.getContext('2d')!;
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    o.drawImage(sil, Math.cos(a) * px, Math.sin(a) * px);
  }
  o.drawImage(sil, 0, 0);
  return c;
}

export interface CompositeOpts {
  /** outer edge colour (drawn outside the ink outline) */
  edge?: string;
  /** edge width in world units */
  edgeW?: number;
  edgeA?: number;
  /** soft glow around the silhouette */
  glow?: string;
  glowR?: number;
  glowA?: number;
  /** soft drop shadow (down-right) */
  drop?: boolean;
  dropA?: number;
  dropOff?: Pt;
  dropBlur?: number;
}

/**
 * Draw only the (blurred, coloured) shadow of `img` — the classic off-canvas
 * shadow trick, portable to every Canvas 2D implementation.
 */
function shadowOf(ctx: Ctx, img: HTMLCanvasElement, color: string, blurPx: number, dx: number, dy: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = blurPx;
  const W = img.width + 64;
  ctx.shadowOffsetX = dx + W;
  ctx.shadowOffsetY = dy;
  ctx.drawImage(img, -W, 0);
  ctx.restore();
}

/** Paint `paint` and re-draw it with outer edge / glow / drop shadow. */
export function composite(ctx: Ctx, paint: (c: Ctx) => void, o: CompositeOpts) {
  const m = ctx.getTransform();
  const res = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
  const img = paintLayer(ctx, paint);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (o.drop) {
    const [dx, dy] = o.dropOff ?? [1.1, 1.7];
    shadowOf(ctx, img, '#1a0d08', (o.dropBlur ?? 1.1) * 2 * res, dx * res, dy * res, o.dropA ?? 0.35);
  }
  if (o.glow) {
    const r = (o.glowR ?? 3) * 2 * res;
    shadowOf(ctx, img, o.glow, r, 0, 0, o.glowA ?? 0.8);
    shadowOf(ctx, img, o.glow, r * 0.5, 0, 0, (o.glowA ?? 0.8) * 0.8);
  }
  if (o.edge && (o.edgeA ?? 0.6) > 0) {
    const sil = tint(ctx, img, o.edge);
    const rg = ring(ctx, sil, (o.edgeW ?? 0.8) * res);
    ctx.save();
    ctx.globalAlpha = o.edgeA ?? 0.6;
    ctx.drawImage(rg, 0, 0);
    ctx.restore();
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/** Single-colour soft layer: paints `paint` and draws only its blurred shadow (smoke, glows). */
export function soft(ctx: Ctx, blur: number, color: string, paint: (c: Ctx) => void, alpha = 1) {
  const m = ctx.getTransform();
  const res = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
  const img = paintLayer(ctx, paint);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  shadowOf(ctx, img, color, blur * 2 * res, 0, 0, alpha);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Sprite definition shortcuts
// ---------------------------------------------------------------------------

export interface IconOpts {
  /** evolution: golden radiant burst behind */
  evo?: boolean;
  /** burst colour for evolutions */
  burst?: string;
  /** add a soft drop shadow (default true) */
  drop?: boolean;
  /** auto-fit: max extent (world units) of the painted art; false = paint as-is. Default 41 (34 for evolutions). */
  fit?: number | false;
}

/** Evolution backdrop: a radiant golden medallion (reads on dark AND light UIs). */
export function evoBackdrop(ctx: Ctx, color = '#ffcf3f', rot = 0.2) {
  // outer soft aura
  softGlow(ctx, 0, 0, 24, color, 0.75);
  // medallion disc
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, 21.6);
  const g = ctx.createRadialGradient(-4, -5, 1, 0, 0, 22);
  g.addColorStop(0, rgba('#fffbe6', 0.98));
  g.addColorStop(0.45, rgba(light(color, 0.18), 0.92));
  g.addColorStop(1, rgba(shade(color, 0.16), 0.95));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  // rays inside the disc
  rays(ctx, 0, 0, 3, 24, 16, '#ffffff', 0.75, rot, 0.55);
  ctx.restore();
  // rim: dark gold outer line + bright inner bevel
  ctx.save();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = rgba(shade(color, 0.45), 0.95);
  ctx.beginPath();
  ellipsePath(ctx, 0, 0, 21.8, 21.8);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = rgba('#fff8d8', 0.95);
  ctx.beginPath();
  ellipsePath(ctx, 0, 0, 20.2, 20.2);
  ctx.stroke();
  ctx.restore();
}

/** Measure the alpha bounds of a painter (world units, around the anchor). */
export function measure(paint: (c: Ctx) => void, half = 48, res = 2): { x0: number; y0: number; x1: number; y1: number } {
  const n = half * 2 * res;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const o = c.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings)!;
  o.setTransform(res, 0, 0, res, n / 2, n / 2);
  paint(o);
  const d = o.getImageData(0, 0, n, n).data;
  let x0 = n, y0 = n, x1 = -1, y1 = -1;
  for (let y = 0; y < n; y++) {
    const row = y * n * 4;
    for (let x = 0; x < n; x++) {
      if (d[row + x * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  return { x0: x0 / res - half, y0: y0 / res - half, x1: (x1 + 1) / res - half, y1: (y1 + 1) / res - half };
}

/** Wrap a painter so its art is centred and scaled to `target` max extent. */
export function fitted(paint: (c: Ctx) => void, target: number, minS = 0.6, maxS = 1.2): (c: Ctx) => void {
  const b = measure(paint);
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  const s = Math.max(minS, Math.min(maxS, target / Math.max(1, w, h)));
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  return (c: Ctx) => {
    c.save();
    c.scale(s, s);
    c.translate(-cx, -cy);
    paint(c);
    c.restore();
  };
}

/** UI icon: 48×48 box, anchor centre, res 3. */
export function icon(id: string, paint: (ctx: Ctx) => void, o: IconOpts = {}) {
  defineSprite({
    id,
    w: 48,
    h: 48,
    res: 3,
    draw: (ctx) => {
      if (o.evo) evoBackdrop(ctx, o.burst);
      const fit = o.fit ?? (o.evo ? 38 : 41);
      const p = fit === false ? paint : fitted(paint, fit);
      composite(ctx, p, {
        drop: o.drop ?? true,
        dropA: 0.32,
        edge: o.evo ? '#fffbe8' : '#fff4dc',
        edgeW: 0.9,
        edgeA: o.evo ? 0.85 : 0.22,
        glow: o.evo ? '#fff3b0' : undefined,
        glowR: 1.6,
        glowA: 0.9,
      });
    },
  });
}

/** World projectile: anchor centre, pointing right, subtle bright edge. */
export function projectile(
  id: string,
  w: number,
  h: number,
  paint: (ctx: Ctx, frame: number) => void,
  o: CompositeOpts & { res?: number; frames?: number; under?: (ctx: Ctx, frame: number) => void; over?: (ctx: Ctx, frame: number) => void } = {},
) {
  defineSprite({
    id,
    w,
    h,
    res: o.res ?? 3,
    frames: o.frames,
    draw: (ctx, f) => {
      o.under?.(ctx, f);
      composite(ctx, (c) => paint(c, f), { edge: o.edge ?? '#fffbea', edgeW: o.edgeW ?? 0.75, edgeA: o.edgeA ?? 0.7, glow: o.glow, glowR: o.glowR, glowA: o.glowA, drop: o.drop, dropA: o.dropA, dropOff: o.dropOff, dropBlur: o.dropBlur });
      o.over?.(ctx, f);
    },
  });
}
