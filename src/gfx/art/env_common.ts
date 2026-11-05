/**
 * ENVIRONMENT COMMON — shared toolkit for the four stage environments:
 *  - deterministic hashing + a chunk Layout helper that enforces the
 *    level-design rules (open spawn, >=160u gaps, collider budget),
 *  - soft shadows / ambient occlusion, alpha fades for overhead props,
 *  - a vector stroke font (signage, labels) + neon rendering,
 *  - material helpers (brushed steel, wood grain, wicker, terracotta),
 *  - small food painters reused by several stages (tomato, lemon, basil...),
 *  - shared props: crates, wine barrel, basil pot, puddles, crumbs.
 *
 * View convention for props ("3/4 top-down"): the floor plane is drawn
 * top-down (1:1), objects stand up toward the camera. A box with ground
 * footprint w×d and height h whose front-bottom edge is centred on the
 * anchor (0,0) has its front face in y∈[-h,0] and its top face in
 * y∈[-h-d,-h]. Its collider is the footprint: rect w×d at oy=-d/2.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, Fill, INK, shape, flat, line, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath, blobPath,
  rng, rgba, mix, shade, light, speckle, glint,
} from '../painter';
import type { PropPlacement, Collider } from '../stageenv';

// ---------------------------------------------------------------------------
// Hashing / maths
// ---------------------------------------------------------------------------

/** Deterministic 2D hash → [0,1). */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul((y | 0) + 0x3c6ef372, 0x165667b1) ^ Math.imul((seed | 0) + 0x5bd1e995, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/** Pick an index from weights using a [0,1) value. */
export function pickWeighted(r: number, weights: number[]): number {
  const tot = weights.reduce((a, b) => a + b, 0);
  let t = r * tot;
  for (let i = 0; i < weights.length; i++) {
    t -= weights[i];
    if (t < 0) return i;
  }
  return weights.length - 1;
}

// ---------------------------------------------------------------------------
// Chunk layout helper (level-design rules live here)
// ---------------------------------------------------------------------------

export interface Box { x0: number; y0: number; x1: number; y1: number }

export function boxGap(a: Box, b: Box): number {
  const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1);
  const dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
  return Math.hypot(dx, dy);
}

/** Player spawn half-extent that must stay collider-free. */
export const SPAWN_CLEAR = 260;

/**
 * Collects placements for one chunk. Collider clusters ("blocks") must stay
 * `margin` away from chunk edges (so neighbouring chunks keep >= 2*margin
 * gaps), `gap` away from each other and out of the spawn square.
 */
export class Layout {
  readonly out: PropPlacement[] = [];
  readonly blocks: Box[] = [];
  readonly soft: Box[] = [];
  readonly X0: number;
  readonly Y0: number;
  colliderArea = 0;
  constructor(
    readonly cx: number,
    readonly cy: number,
    readonly size: number,
    readonly rnd: () => number,
    readonly margin = 84,
    readonly gap = 168,
  ) {
    this.X0 = cx * size;
    this.Y0 = cy * size;
  }
  range(a: number, b: number) { return a + (b - a) * this.rnd(); }
  int(a: number, b: number) { return Math.min(b, Math.floor(a + (b - a + 1) * this.rnd())); }
  chance(p: number) { return this.rnd() < p; }
  pick<T>(a: readonly T[]): T { return a[Math.min(a.length - 1, Math.floor(this.rnd() * a.length))]; }
  weighted<T>(items: [T, number][]): T {
    return items[pickWeighted(this.rnd(), items.map((i) => i[1]))][0];
  }
  inSpawn(b: Box, pad = 0): boolean {
    const s = SPAWN_CLEAR + pad;
    return b.x0 < s && b.x1 > -s && b.y0 < s && b.y1 > -s;
  }
  insideChunk(b: Box, margin = this.margin): boolean {
    return b.x0 >= this.X0 + margin && b.x1 <= this.X0 + this.size - margin &&
      b.y0 >= this.Y0 + margin && b.y1 <= this.Y0 + this.size - margin;
  }
  /** can a collider cluster occupy box b? */
  canBlock(b: Box): boolean {
    return this.insideChunk(b) && !this.inSpawn(b, 24) && this.blocks.every((o) => boxGap(o, b) >= this.gap);
  }
  block(b: Box, area?: number) {
    this.blocks.push(b);
    this.colliderArea += area ?? (b.x1 - b.x0) * (b.y1 - b.y0);
  }
  /** free for a non-colliding sorted prop (no overlap with blocks / other soft props) */
  canSoft(b: Box, pad = 8): boolean {
    if (b.x0 < this.X0 + 4 || b.x1 > this.X0 + this.size - 4 || b.y0 < this.Y0 + 4 || b.y1 > this.Y0 + this.size - 4) return false;
    const hit = (o: Box) => !(b.x1 + pad < o.x0 || b.x0 - pad > o.x1 || b.y1 + pad < o.y0 || b.y0 - pad > o.y1);
    // blocks are tall: also keep clear of the strip just behind (north of) them, where they occlude
    const hitBlock = (o: Box) => hit({ x0: o.x0 - 14, y0: o.y0 - 64, x1: o.x1 + 14, y1: o.y1 + 10 });
    return !this.blocks.some(hitBlock) && !this.soft.some(hit);
  }
  softBox(b: Box) { this.soft.push(b); }
  add(p: PropPlacement): PropPlacement {
    this.out.push(p);
    return p;
  }
  floor(sprite: string, x: number, y: number, flip = false) {
    this.out.push({ sprite, x, y, layer: 'floor', flip: flip || undefined });
  }
  overhead(sprite: string, x: number, y: number, extra: Partial<PropPlacement> = {}) {
    this.out.push({ sprite, x, y, layer: 'overhead', ...extra });
  }
  /** random point inside chunk (world coords) with an inner margin */
  pt(m = 40): Pt {
    return [this.X0 + this.range(m, this.size - m), this.Y0 + this.range(m, this.size - m)];
  }
  /**
   * Try to place a small non-colliding sorted prop (breakable / decor) with
   * footprint half-size (hw, hh) somewhere in [x0,x1]×[y0,y1] (world).
   */
  trySoft(
    make: (x: number, y: number) => PropPlacement,
    hw: number,
    hh: number,
    area?: Box,
    tries = 8,
  ): PropPlacement | null {
    const A = area ?? { x0: this.X0 + 30, y0: this.Y0 + 30, x1: this.X0 + this.size - 30, y1: this.Y0 + this.size - 30 };
    for (let i = 0; i < tries; i++) {
      const x = this.range(A.x0, A.x1), y = this.range(A.y0, A.y1);
      const b = { x0: x - hw, y0: y - hh * 2, x1: x + hw, y1: y };
      if (this.canSoft(b)) {
        this.softBox(b);
        return this.add(make(x, y));
      }
    }
    return null;
  }
}

export const circleCol = (r: number, ox = 0, oy = 0): Collider => ({ kind: 'circle', r, ox, oy });
export const rectCol = (w: number, h: number, ox = 0, oy = 0): Collider => ({ kind: 'rect', w, h, ox, oy });

// ---------------------------------------------------------------------------
// Shadows, AO, alpha fades
// ---------------------------------------------------------------------------

/** Device pixels per world unit of the current transform. */
export function devScale(ctx: Ctx): number {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

/**
 * Fill a path as a soft blurred silhouette (true gaussian via canvas shadow;
 * the shape itself is drawn far outside the canvas).
 */
export function softShape(ctx: Ctx, build: (c: Ctx) => void, blur: number, color: string) {
  const m = ctx.getTransform();
  const k = devScale(ctx);
  const OFF = 6000;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * k;
  ctx.shadowOffsetX = OFF * m.a;
  ctx.shadowOffsetY = OFF * m.b;
  ctx.translate(-OFF, 0);
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
}

/** Soft elliptical contact shadow (ambient occlusion at a prop's base). */
export function ao(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.45, color = '#1c100a') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.5, rgba(color, alpha * 0.62));
  g.addColorStop(0.8, rgba(color, alpha * 0.2));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Soft rectangular shadow (blurred rounded rect). */
export function aoRect(ctx: Ctx, x: number, y: number, w: number, h: number, blur: number, alpha = 0.4, r = 4, color = '#1c100a') {
  softShape(ctx, (c) => roundRectPath(c, x, y, w, h, r), blur, rgba(color, alpha));
}

/** Multiply the alpha of everything painted so far in this sprite. */
export function fadeAll(ctx: Ctx, alpha: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

/** Fade everything painted so far toward transparent going UP (y0 opaque → y1 transparent, y1<y0). */
export function fadeUp(ctx: Ctx, y0: number, y1: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-5000, Math.min(y0, y1) - 5000, 10000, 10000 + Math.abs(y0 - y1));
  ctx.restore();
  // keep everything below y0 fully opaque (the fill above covered it with alpha 1 already)
}

/** Run `fn` with a clip path. */
export function clipped(ctx: Ctx, build: (c: Ctx) => void, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

/** Linear gradient between two points. */
export function lgrad(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** Fill the current clip region with a colour/gradient (used inside clipped()). */
export function wash(ctx: Ctx, fill: Fill, alpha = 1, op: GlobalCompositeOperation = 'source-over') {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = op;
  ctx.fillStyle = fill;
  ctx.fillRect(-5000, -5000, 10000, 10000);
  ctx.restore();
}

/** Soft radial light glow painted additively (bake glows into sprites). */
export function bloom(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 0.6) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.35, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  circlePath(ctx, x, y, r);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Vector stroke font (signage + labels; font-independent, perfect for neon)
// Glyph grid: x 0..4, y 0..6 (y down). Each glyph = list of polylines.
// ---------------------------------------------------------------------------

const GLYPHS: Record<string, number[][]> = {
  A: [[0, 6, 0, 2.2, 2, 0, 4, 2.2, 4, 6], [0, 3.8, 4, 3.8]],
  B: [[0, 3, 3, 3, 4, 3.9, 4, 5.1, 3, 6, 0, 6, 0, 0, 2.8, 0, 3.8, 0.8, 3.8, 2.2, 3, 3]],
  C: [[4, 1.1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 4.9]],
  D: [[0, 0, 0, 6, 2.4, 6, 4, 4.4, 4, 1.6, 2.4, 0, 0, 0]],
  E: [[4, 0, 0, 0, 0, 6, 4, 6], [0, 3, 3, 3]],
  F: [[4, 0, 0, 0, 0, 6], [0, 3, 3, 3]],
  G: [[4, 1.1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.4, 2.2, 3.4]],
  H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3, 4, 3]],
  I: [[2, 0, 2, 6]],
  J: [[4, 0, 4, 5, 3, 6, 1, 6, 0, 5]],
  K: [[0, 0, 0, 6], [4, 0, 0, 3.6], [1.4, 2.6, 4, 6]],
  L: [[0, 0, 0, 6, 4, 6]],
  M: [[0, 6, 0, 0, 2, 3.2, 4, 0, 4, 6]],
  N: [[0, 6, 0, 0, 4, 6, 4, 0]],
  O: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  P: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2.4, 3, 3.4, 0, 3.4]],
  Q: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0], [2.4, 4.4, 4, 6.2]],
  R: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2.4, 3, 3.4, 0, 3.4], [2, 3.4, 4, 6]],
  S: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 2.2, 1, 3, 3, 3, 4, 3.8, 4, 5, 3, 6, 1, 6, 0, 5]],
  T: [[0, 0, 4, 0], [2, 0, 2, 6]],
  U: [[0, 0, 0, 5, 1, 6, 3, 6, 4, 5, 4, 0]],
  V: [[0, 0, 2, 6, 4, 0]],
  W: [[0, 0, 0.9, 6, 2, 2.4, 3.1, 6, 4, 0]],
  X: [[0, 0, 4, 6], [4, 0, 0, 6]],
  Y: [[0, 0, 2, 3, 4, 0], [2, 3, 2, 6]],
  Z: [[0, 0, 4, 0, 0, 6, 4, 6]],
  '0': [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  '1': [[0.8, 1.2, 2.2, 0, 2.2, 6]],
  '2': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2.2, 0, 6, 4, 6]],
  '3': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1.6, 3], [3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]],
  '4': [[3, 6, 3, 0, 0, 4.2, 4, 4.2]],
  '5': [[4, 0, 0.3, 0, 0, 3, 3, 2.8, 4, 3.8, 4, 5, 3, 6, 1, 6, 0, 5]],
  '6': [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.8, 3, 3, 0, 3]],
  '7': [[0, 0, 4, 0, 1.6, 6]],
  '8': [[1, 3, 0, 2.1, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2.1, 3, 3, 1, 3, 0, 3.9, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.9, 3, 3]],
  '9': [[4, 3, 1, 3, 0, 2.2, 0, 1, 1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5]],
  $: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 2.2, 1, 3, 3, 3, 4, 3.8, 4, 5, 3, 6, 1, 6, 0, 5], [2, -0.9, 2, 6.9]],
  '!': [[0.5, 0, 0.5, 4]],
  "'": [[0.6, 0, 0.3, 1.6]],
  '-': [[0.4, 3, 2.6, 3]],
  '/': [[0, 6, 3, 0]],
  '+': [[2, 1.5, 2, 4.5], [0.5, 3, 3.5, 3]],
  '&': [[4, 6, 1, 2.2, 1, 1, 1.8, 0, 2.8, 0, 3.4, 1, 3.2, 2, 0.4, 3.8, 0.2, 5, 1, 6, 2.6, 6, 4, 3.8]],
  '%': [[0, 6, 4, 0], [0.6, 0.4, 1.2, 0.4, 1.2, 1.6, 0.6, 1.6, 0.6, 0.4], [2.8, 4.4, 3.4, 4.4, 3.4, 5.6, 2.8, 5.6, 2.8, 4.4]],
};
const GLYPH_DOTS: Record<string, Pt[]> = { '!': [[0.5, 5.8]], '.': [[0.5, 5.8]], ':': [[0.5, 1.8], [0.5, 5.2]] };
const GLYPH_W: Record<string, number> = { I: 0, '1': 2.2, '!': 1, '.': 1, ':': 1, "'": 1, '-': 3, ' ': 2.2, '/': 3 };

function glyphW(ch: string): number {
  return GLYPH_W[ch] ?? 4;
}

/** Width of `text` at cap-height `size` (world units). */
export function textWidth(text: string, size: number, tracking = 1.5): number {
  const s = size / 6;
  let w = 0;
  for (let i = 0; i < text.length; i++) w += (glyphW(text[i]) + (i < text.length - 1 ? tracking : 0)) * s;
  return w;
}

/** Build the glyph polylines of `text` into the current path. (x,y) = top-left. */
function buildText(ctx: Ctx, text: string, x: number, y: number, size: number, tracking: number, slant: number, dotR: number) {
  const s = size / 6;
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch];
    const tx = (gx: number, gy: number): Pt => [cx + (gx + (6 - gy) * slant) * s, y + gy * s];
    if (g) {
      for (const pl of g) {
        for (let i = 0; i < pl.length; i += 2) {
          const [px, py] = tx(pl[i], pl[i + 1]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
    }
    const dots = GLYPH_DOTS[ch];
    if (dots) for (const [dx, dy] of dots) {
      const [px, py] = tx(dx, dy);
      ctx.moveTo(px + dotR, py);
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
    }
    cx += (glyphW(ch) + tracking) * s;
  }
}

export interface TextOpts {
  align?: 'left' | 'center' | 'right';
  tracking?: number;
  slant?: number;
  alpha?: number;
  /** extra rotation (radians) around (x,y) */
  rot?: number;
}

/** Stroke text with the vector font. (x,y) = top (align point), size = cap height. */
export function strokeText(ctx: Ctx, text: string, x: number, y: number, size: number, color: string, width: number, o: TextOpts = {}) {
  const tracking = o.tracking ?? 1.5;
  const w = textWidth(text, size, tracking);
  const ax = o.align === 'left' ? 0 : o.align === 'right' ? w : w / 2;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.beginPath();
  buildText(ctx, text, -ax, 0, size, tracking, o.slant ?? 0, width * 0.5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.stroke();
  ctx.restore();
}

/** Neon tube text: coloured glow + saturated tube + hot white core. */
export function neonText(ctx: Ctx, text: string, x: number, y: number, size: number, color: string, o: TextOpts & { tube?: number; glow?: number } = {}) {
  const k = devScale(ctx);
  const tube = o.tube ?? size * 0.15;
  ctx.save();
  // wide atmospheric glow
  ctx.shadowColor = rgba(color, 0.95);
  ctx.shadowBlur = (o.glow ?? size * 1.1) * k;
  strokeText(ctx, text, x, y, size, rgba(color, 0.55), tube * 2.2, o);
  ctx.shadowBlur = size * 0.4 * k;
  strokeText(ctx, text, x, y, size, color, tube * 1.25, o);
  ctx.restore();
  strokeText(ctx, text, x, y, size, light(color, 0.5), tube * 0.8, o);
  strokeText(ctx, text, x, y, size, '#ffffff', tube * 0.32, { ...o, alpha: 0.9 });
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

/** Brushed stainless steel fill for a rect (horizontal streaks + soft sheen). */
export function steelRect(ctx: Ctx, x: number, y: number, w: number, h: number, base = '#c4cad0', seed = 3, vertical = false) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = vertical
    ? lgrad(ctx, x, y, x + w, y, [[0, light(base, 0.35)], [0.45, base], [1, shade(base, 0.18)]])
    : lgrad(ctx, x, y, x + w * 0.4, y + h * 1.4, [[0, light(base, 0.3)], [0.5, base], [1, shade(base, 0.16)]]);
  ctx.fillRect(x, y, w, h);
  const R = rng(seed);
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < (vertical ? w : h) / 1.6; i++) {
    const t = R();
    ctx.strokeStyle = R() < 0.5 ? '#ffffff' : '#6f7880';
    ctx.beginPath();
    if (vertical) {
      const xx = x + t * w;
      const y0 = y + R() * h * 0.5;
      ctx.moveTo(xx, y0);
      ctx.lineTo(xx, y0 + h * (0.3 + R() * 0.7));
    } else {
      const yy = y + t * h;
      const x0 = x + R() * w * 0.5;
      ctx.moveTo(x0, yy);
      ctx.lineTo(x0 + w * (0.3 + R() * 0.7), yy);
    }
    ctx.stroke();
  }
  // diagonal sheen band
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = lgrad(ctx, x, y, x + w, y + h, [[0, 'rgba(255,255,255,0)'], [0.32, 'rgba(255,255,255,0)'], [0.38, 'rgba(255,255,255,1)'], [0.46, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,255,255,0.6)'], [0.58, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Wood grain strokes inside the current clip; dir 0 = horizontal planks, 1 = vertical. */
export function grain(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, seed = 5, dir = 0, density = 1, alpha = 0.35) {
  const R = rng(seed);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const n = Math.max(2, Math.round(((dir ? w : h) / 3.2) * density));
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * (0.4 + R() * 0.6);
    ctx.lineWidth = 0.35 + R() * 0.55;
    ctx.beginPath();
    const t = R();
    const amp = 0.4 + R() * 1.2;
    const fr = 0.04 + R() * 0.08;
    const ph = R() * 6;
    if (dir === 0) {
      const yy = y + t * h;
      const xa = x + R() * w * 0.3, xb = x + w * (0.6 + R() * 0.4);
      for (let xx = xa; xx <= xb; xx += 3) {
        const py = yy + Math.sin(xx * fr + ph) * amp;
        if (xx === xa) ctx.moveTo(xx, py);
        else ctx.lineTo(xx, py);
      }
    } else {
      const xx = x + t * w;
      const ya = y + R() * h * 0.3, yb = y + h * (0.6 + R() * 0.4);
      for (let yy = ya; yy <= yb; yy += 3) {
        const px = xx + Math.sin(yy * fr + ph) * amp;
        if (yy === ya) ctx.moveTo(px, yy);
        else ctx.lineTo(px, yy);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Wicker / straw weave pattern inside current clip. */
export function weave(ctx: Ctx, x: number, y: number, w: number, h: number, base: string, cell = 4) {
  ctx.save();
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const dk = shade(base, 0.3), lt = light(base, 0.3);
  for (let j = 0; j * cell < h + cell; j++) {
    for (let i = 0; i * cell < w + cell; i++) {
      const px = x + i * cell + (j % 2 ? cell / 2 : 0), py = y + j * cell;
      ctx.fillStyle = dk;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ellipsePath(ctx, px + cell * 0.5, py + cell * 0.55, cell * 0.5, cell * 0.36);
      ctx.fill();
      ctx.fillStyle = lt;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ellipsePath(ctx, px + cell * 0.42, py + cell * 0.4, cell * 0.36, cell * 0.2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Small food painters (shared)
// ---------------------------------------------------------------------------

export function tomato(ctx: Ctx, x: number, y: number, r: number, seed = 1, ink = 1.2, col = '#d8352c') {
  const R = rng(seed);
  const c = mix(col, R() < 0.3 ? '#e8642c' : col, 0.5);
  shape(ctx, (p) => blobPath(p, x, y, r * 1.06, r * 0.94, 0.06, 8, seed), {
    fill: c, ink, shadow: shade(c, 0.3), shadowOffset: [-r * 0.3, -r * 0.32],
    gloss: [{ x: x - r * 0.38, y: y - r * 0.4, rx: r * 0.3, ry: r * 0.17, rot: -0.6, alpha: 0.8 }],
  });
  // calyx
  ctx.save();
  ctx.translate(x + r * 0.08, y - r * 0.62);
  ctx.rotate(R() * 6);
  shape(ctx, (p) => {
    const n = 5;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      const rr = i % 2 === 0 ? r * 0.42 : r * 0.12;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.7;
      if (i === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
    }
    p.closePath();
  }, { fill: '#3f8a3a', ink: ink * 0.6, shadow: 'none' });
  ctx.restore();
}

export function lemon(ctx: Ctx, x: number, y: number, r: number, rot = 0, ink = 1.1, col = '#f5d43a') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  shape(ctx, (p) => {
    p.moveTo(-r * 1.25, 0);
    p.bezierCurveTo(-r * 1.1, -r * 0.95, r * 1.1, -r * 0.95, r * 1.25, 0);
    p.bezierCurveTo(r * 1.1, r * 0.95, -r * 1.1, r * 0.95, -r * 1.25, 0);
    p.closePath();
  }, { fill: col, ink, shadow: shade(col, 0.28), shadowOffset: [-r * 0.28, -r * 0.3], gloss: [{ x: -r * 0.35, y: -r * 0.38, rx: r * 0.35, ry: r * 0.14, rot: -0.2, alpha: 0.7 }] });
  ctx.restore();
}

export function leaf(ctx: Ctx, x: number, y: number, len: number, rot: number, col = '#3f9a45', ink = 1, vein = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  shape(ctx, (p) => {
    p.moveTo(0, 0);
    p.quadraticCurveTo(len * 0.5, -len * 0.42, len, 0);
    p.quadraticCurveTo(len * 0.5, len * 0.42, 0, 0);
    p.closePath();
  }, { fill: col, ink, shadow: shade(col, 0.25), shadowOffset: [-len * 0.06, -len * 0.12], gloss: [{ x: len * 0.42, y: -len * 0.1, rx: len * 0.2, ry: len * 0.06, alpha: 0.35 }] });
  if (vein) line(ctx, [[len * 0.08, 0], [len * 0.85, 0]], Math.max(0.4, len * 0.05), light(col, 0.35), false, 0.8);
  ctx.restore();
}

/** Basil sprig (cluster of leaves). */
export function basil(ctx: Ctx, x: number, y: number, s: number, seed = 2, ink = 0.9) {
  const R = rng(seed);
  const n = 5 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (R() - 0.5) * 3.2;
    const d = s * (0.1 + R() * 0.35);
    leaf(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, s * (0.55 + R() * 0.35), a + (R() - 0.5) * 0.6, R() < 0.5 ? '#43a047' : '#3a8f3f', ink);
  }
}

export function garlicBulb(ctx: Ctx, x: number, y: number, r: number, ink = 1) {
  shape(ctx, (p) => {
    p.moveTo(x, y - r * 1.25);
    p.bezierCurveTo(x + r * 0.2, y - r * 0.7, x + r * 1.15, y - r * 0.55, x + r * 1.05, y + r * 0.25);
    p.bezierCurveTo(x + r * 0.95, y + r * 0.95, x - r * 0.95, y + r * 0.95, x - r * 1.05, y + r * 0.25);
    p.bezierCurveTo(x - r * 1.15, y - r * 0.55, x - r * 0.2, y - r * 0.7, x, y - r * 1.25);
    p.closePath();
  }, { fill: '#f3ead8', ink, shadow: '#cdbfa8', shadowOffset: [-r * 0.3, -r * 0.25], gloss: [{ x: x - r * 0.4, y: y - r * 0.15, rx: r * 0.22, ry: r * 0.4, alpha: 0.7 }] });
  line(ctx, [[x, y - r * 0.9], [x - r * 0.15, y + r * 0.7]], 0.5, '#c4a98a', true, 0.8);
  line(ctx, [[x + r * 0.45, y - r * 0.55], [x + r * 0.5, y + r * 0.6]], 0.5, '#c4a98a', true, 0.6);
  line(ctx, [[x - r * 0.45, y - r * 0.55], [x - r * 0.55, y + r * 0.6]], 0.5, '#c4a98a', true, 0.6);
}

/** Glass bottle (side view). (x,y) = bottom centre. */
export function bottle(ctx: Ctx, x: number, y: number, h: number, col: string, o: { label?: string; cap?: string; w?: number; ink?: number } = {}) {
  const w = o.w ?? h * 0.3;
  const ink = o.ink ?? 1.1;
  shape(ctx, (p) => {
    p.moveTo(x - w / 2, y);
    p.lineTo(x - w / 2, y - h * 0.55);
    p.quadraticCurveTo(x - w / 2, y - h * 0.72, x - w * 0.17, y - h * 0.78);
    p.lineTo(x - w * 0.17, y - h);
    p.lineTo(x + w * 0.17, y - h);
    p.lineTo(x + w * 0.17, y - h * 0.78);
    p.quadraticCurveTo(x + w / 2, y - h * 0.72, x + w / 2, y - h * 0.55);
    p.lineTo(x + w / 2, y);
    p.closePath();
  }, { fill: col, ink, shadow: shade(col, 0.35), shadowOffset: [-w * 0.3, -1], gloss: [{ x: x - w * 0.22, y: y - h * 0.45, rx: w * 0.09, ry: h * 0.2, alpha: 0.55 }] });
  if (o.label) {
    flat(ctx, (p) => p.rect(x - w / 2 + 0.3, y - h * 0.48, w - 0.6, h * 0.26), o.label, ink * 0.5);
  }
  if (o.cap) flat(ctx, (p) => p.rect(x - w * 0.2, y - h - 1, w * 0.4, h * 0.09), o.cap, ink * 0.5);
}

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------

const WOOD = '#c08a52';

/** Wooden crate in 3/4 view, footprint w×d, height h; front-bottom centre at (0,0). */
export function crate(ctx: Ctx, w: number, d: number, h: number, o: { wood?: string; content?: (topY: number) => void; open?: boolean; seed?: number; ink?: number; aoAlpha?: number } = {}) {
  const wood = o.wood ?? WOOD;
  const ink = o.ink ?? 2;
  const x0 = -w / 2;
  ao(ctx, 3, -d * 0.35, w * 0.62, d * 0.7, o.aoAlpha ?? 0.5);
  // body outline
  shape(ctx, (p) => roundRectPath(p, x0, -h - d, w, h + d, 2.5), { fill: shade(wood, 0.35), ink, shadow: 'none' });
  // inside (open crate) / lid
  const topY = -h - d;
  if (o.open !== false) {
    // inner back wall + floor
    flat(ctx, (p) => p.rect(x0 + 3, topY + 3, w - 6, d - 3), shade(wood, 0.5), 0);
    flat(ctx, (p) => p.rect(x0 + 3, topY + 3, w - 6, 4), shade(wood, 0.25), 0);
    o.content?.(topY);
  } else {
    flat(ctx, (p) => p.rect(x0 + 0.5, topY + 0.5, w - 1, d - 1), light(wood, 0.12), 0);
    const n = Math.max(2, Math.round(d / 7));
    for (let i = 1; i < n; i++) line(ctx, [[x0 + 1, topY + (d / n) * i], [x0 + w - 1, topY + (d / n) * i]], 0.9, shade(wood, 0.4), false, 0.8);
    clipped(ctx, (p) => p.rect(x0, topY, w, d), () => grain(ctx, x0, topY, w, d, shade(wood, 0.35), (o.seed ?? 1) + 9, 0, 0.8, 0.3));
  }
  // front slats
  const slats = Math.max(2, Math.round(h / 9));
  const sh = (h - 2) / slats;
  for (let i = 0; i < slats; i++) {
    const sy = -h + 1 + i * sh;
    const c = mix(wood, i % 2 ? light(wood, 0.08) : shade(wood, 0.05), 0.6);
    shape(ctx, (p) => roundRectPath(p, x0 + 1, sy + 0.4, w - 2, sh - 1.2, 1.2), { fill: c, ink: 0.8, inkColor: shade(wood, 0.6), shadow: shade(c, 0.22), shadowOffset: [-1.2, -1.4] });
    clipped(ctx, (p) => p.rect(x0 + 1, sy, w - 2, sh), () => grain(ctx, x0, sy, w, sh, shade(wood, 0.45), (o.seed ?? 1) * 13 + i, 0, 1.2, 0.35));
  }
  // corner posts
  for (const px of [x0 + 1, x0 + w - 6]) {
    shape(ctx, (p) => roundRectPath(p, px, -h + 0.5, 5, h - 1, 1), { fill: shade(wood, 0.12), ink: 0.8, inkColor: shade(wood, 0.6), shadow: shade(wood, 0.32), shadowOffset: [-1.2, 0] });
  }
  // top rim highlight
  line(ctx, [[x0 + 1.5, -h - d + 1.2], [x0 + w - 1.5, -h - d + 1.2]], 1, light(wood, 0.35), false, 0.8);
  line(ctx, [[x0 + 1, -h], [x0 + w - 1, -h]], 1.2, light(wood, 0.25), false, 0.9);
  // nails
  for (const px of [x0 + 3.5, x0 + w - 3.5]) for (let i = 0; i < slats; i++) {
    ctx.fillStyle = '#4a3a30';
    ctx.beginPath();
    circlePath(ctx, px, -h + 1 + i * sh + sh / 2, 0.6);
    ctx.fill();
  }
}

/** Upright wine barrel. (0,0) = front-bottom; radius r, height h. */
export function barrel(ctx: Ctx, r: number, h: number, o: { wood?: string; seed?: number; tap?: boolean; top?: (y: number) => void } = {}) {
  const wood = o.wood ?? '#9a5f36';
  const ry = r * 0.42;
  const yb = -ry; // bottom ellipse centre
  const yt = -h; // top ellipse centre
  ao(ctx, 5, -ry * 0.7, r * 1.35, ry * 1.5, 0.55);
  const bulge = r * 0.12;
  const body = (p: Ctx) => {
    p.moveTo(-r, yt);
    p.bezierCurveTo(-r - bulge * 1.6, yt + (yb - yt) * 0.33, -r - bulge * 1.6, yt + (yb - yt) * 0.67, -r, yb);
    p.ellipse(0, yb, r, ry, 0, Math.PI, 0, true);
    p.bezierCurveTo(r + bulge * 1.6, yt + (yb - yt) * 0.67, r + bulge * 1.6, yt + (yb - yt) * 0.33, r, yt);
    p.ellipse(0, yt, r, ry, 0, 0, Math.PI, true);
    p.closePath();
  };
  shape(ctx, body, { fill: wood, ink: 2.4, shadow: 'none' });
  // staves with cylindrical shading
  clipped(ctx, body, () => {
    ctx.fillStyle = lgrad(ctx, -r - bulge, 0, r + bulge, 0, [[0, shade(wood, 0.25)], [0.22, light(wood, 0.18)], [0.45, wood], [0.8, shade(wood, 0.3)], [1, shade(wood, 0.5)]]);
    ctx.fillRect(-r * 2, yt - ry * 2, r * 4, h + ry * 4);
    const R = rng(o.seed ?? 4);
    const n = 9;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const xx = -Math.cos(t * Math.PI) * (r + bulge * 0.8);
      line(ctx, [[xx * 0.98, yt + ry], [xx, (yt + yb) / 2], [xx * 0.98, yb + ry]], 0.8, shade(wood, 0.45), true, 0.7);
      if (R() < 0.6) line(ctx, [[xx + 2, yt + ry + 4 + R() * 10], [xx + 2.2, yb - R() * 10]], 0.5, light(wood, 0.25), true, 0.35);
    }
    // hoops
    for (const t of [0.1, 0.3, 0.7, 0.9]) {
      const hy = yt + (yb - yt) * t;
      const hw = r + bulge * Math.sin(t * Math.PI) * 1.2;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, hy + ry * 0.05, hw + 1, ry, 0, 0, Math.PI);
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = '#3a3330';
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, hy - 0.6, hw + 0.6, ry, 0, Math.PI * 0.62, Math.PI * 0.95);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#8f8781';
      ctx.stroke();
      ctx.restore();
    }
  });
  // top lid
  shape(ctx, (p) => ellipsePath(p, 0, yt, r - 1.2, ry - 0.8), { fill: shade(wood, 0.12), ink: 1.4, shadow: shade(wood, 0.32), shadowOffset: [-2, -1.5] });
  clipped(ctx, (p) => ellipsePath(p, 0, yt, r - 1.2, ry - 0.8), () => {
    for (let i = -3; i <= 3; i++) line(ctx, [[i * r * 0.27, yt - ry], [i * r * 0.27, yt + ry]], 0.7, shade(wood, 0.4), false, 0.7);
    grain(ctx, -r, yt - ry, r * 2, ry * 2, shade(wood, 0.45), (o.seed ?? 4) + 3, 1, 1, 0.3);
  });
  line(ctx, [[-r * 0.7, yt - ry * 0.55], [-r * 0.1, yt - ry * 0.85]], 1.2, light(wood, 0.4), true, 0.6);
  if (o.tap) {
    const ty = (yt + yb) / 2 + 6;
    flat(ctx, (p) => roundRectPath(p, -3, ty - 2, 6, 5, 1.5), '#b07b3c', 1);
    flat(ctx, (p) => roundRectPath(p, -1.6, ty + 2, 3.2, 6, 1), '#c9944a', 1);
  }
  o.top?.(yt);
}

function drawPuddle(ctx: Ctx, seed: number, rx: number, ry: number) {
  const R = rng(seed);
  const pts: Pt[] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.7 + R() * 0.45;
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  const build = (p: Ctx) => smoothPath(p, pts, true);
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = 'rgba(40,55,70,0.16)';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(30,30,40,0.18)';
  ctx.stroke();
  ctx.restore();
  clipped(ctx, build, () => {
    ctx.fillStyle = lgrad(ctx, -rx, -ry, rx, ry, [[0, 'rgba(255,255,255,0.32)'], [0.4, 'rgba(255,255,255,0.06)'], [0.7, 'rgba(170,200,230,0.14)'], [1, 'rgba(255,255,255,0.0)']]);
    ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4);
    line(ctx, [[-rx * 0.5, -ry * 0.25], [-rx * 0.05, -ry * 0.48]], 1.6, '#ffffff', true, 0.5);
    line(ctx, [[rx * 0.15, ry * 0.3], [rx * 0.45, ry * 0.18]], 1, '#ffffff', true, 0.35);
  });
}

function drawCrumbs(ctx: Ctx, seed: number, r: number) {
  const R = rng(seed);
  for (let i = 0; i < 22; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r;
    const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.7;
    const s = 0.6 + R() * 1.6;
    const c = R() < 0.5 ? '#d9a35a' : R() < 0.5 ? '#e8c27e' : '#b47a3c';
    ctx.save();
    ctx.beginPath();
    blobPath(ctx, x, y, s, s * 0.8, 0.3, 6, i + seed);
    ctx.fillStyle = 'rgba(40,20,10,0.25)';
    ctx.translate(0.5, 0.5);
    ctx.fill();
    ctx.translate(-0.5, -0.5);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.restore();
  }
}

defineSprite({
  id: 'prop.common.crate',
  w: 68, h: 66, ax: 34, ay: 58,
  draw: (ctx) => crate(ctx, 54, 30, 26, { open: false, seed: 3 }),
});

defineSprite({
  id: 'prop.common.crate_stack',
  w: 72, h: 100, ax: 36, ay: 90,
  draw: (ctx) => {
    crate(ctx, 54, 30, 26, { open: false, seed: 5 });
    ctx.save();
    ctx.translate(2, -30);
    crate(ctx, 50, 28, 24, { open: false, seed: 8, wood: '#b9824d', aoAlpha: 0.3 });
    ctx.restore();
  },
});

defineSprite({
  id: 'prop.common.crate_tomato',
  w: 70, h: 72, ax: 35, ay: 62,
  draw: (ctx) => crate(ctx, 56, 32, 26, {
    seed: 11,
    content: (ty) => {
      const R = rng(41);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) {
        const x = -22 + i * 8.8 + (j % 2) * 3 + (R() - 0.5) * 2;
        const y = ty + 4 + j * 8.5 + (R() - 0.5) * 2;
        tomato(ctx, x, y, 5.2, i * 7 + j, 1.1);
      }
      basil(ctx, 14, ty + 6, 9, 3, 0.8);
    },
  }),
});

defineSprite({
  id: 'prop.common.crate_lemon',
  w: 70, h: 72, ax: 35, ay: 62,
  draw: (ctx) => crate(ctx, 56, 32, 26, {
    seed: 12,
    wood: '#c79a62',
    content: (ty) => {
      const R = rng(42);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) {
        const x = -20 + i * 10 + (j % 2) * 3 + (R() - 0.5) * 2;
        const y = ty + 5 + j * 8 + (R() - 0.5) * 2;
        lemon(ctx, x, y, 4.6, (R() - 0.5) * 1.2, 1.05);
      }
      leaf(ctx, -16, ty + 3, 11, -0.5, '#3d8f43', 0.9);
      leaf(ctx, 10, ty + 2, 10, -2.6, '#46a04b', 0.9);
    },
  }),
});

defineSprite({
  id: 'prop.common.barrel',
  w: 84, h: 104, ax: 40, ay: 96,
  draw: (ctx) => barrel(ctx, 27, 74, { seed: 6, tap: true }),
});

defineSprite({
  id: 'prop.common.barrel_wine',
  w: 84, h: 112, ax: 40, ay: 96,
  draw: (ctx) => barrel(ctx, 27, 74, {
    seed: 9,
    top: (yt) => {
      // a couple of bottles + a glass on the lid
      bottle(ctx, -8, yt + 3, 24, '#2f5a2c', { label: '#efe6cc', cap: '#7a1f2b' });
      bottle(ctx, 4, yt + 4, 22, '#4a2030', { label: '#e9dcc0', cap: '#d8b25a' });
    },
  }),
});

defineSprite({
  id: 'prop.common.basil_pot',
  w: 44, h: 54, ax: 22, ay: 46,
  draw: (ctx) => {
    ao(ctx, 2, -3, 16, 6, 0.45);
    const terra = '#c8673e';
    shape(ctx, (p) => {
      p.moveTo(-11, -18);
      p.lineTo(11, -18);
      p.lineTo(8, 0);
      p.quadraticCurveTo(0, 2, -8, 0);
      p.closePath();
    }, { fill: terra, ink: 1.6, shadow: shade(terra, 0.3), shadowOffset: [-3, -1] });
    shape(ctx, (p) => roundRectPath(p, -13, -22, 26, 6, 2), { fill: light(terra, 0.1), ink: 1.6, shadowOffset: [-1.5, -1.5] });
    flat(ctx, (p) => ellipsePath(p, 0, -22, 11, 2.6), '#4a3020', 0);
    basil(ctx, 0, -27, 15, 7, 1);
    basil(ctx, -4, -33, 12, 9, 1);
    basil(ctx, 5, -32, 11, 13, 1);
  },
});

defineSprite({ id: 'prop.common.puddle', w: 100, h: 60, ax: 50, ay: 30, draw: (ctx) => drawPuddle(ctx, 5, 44, 24) });
defineSprite({ id: 'prop.common.puddle_small', w: 64, h: 40, ax: 32, ay: 20, draw: (ctx) => drawPuddle(ctx, 9, 27, 15) });
defineSprite({ id: 'prop.common.crumbs', w: 50, h: 36, ax: 25, ay: 18, draw: (ctx) => drawCrumbs(ctx, 3, 20) });

// re-export a few painter bits stage modules commonly need together with these helpers
export { INK, speckle, glint, polyPath };
