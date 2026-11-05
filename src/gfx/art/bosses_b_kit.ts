/**
 * BOSSES B — shared kit (helpers used by the five bosses in bosses_b_*.ts).
 *
 * Everything here follows the "Trattoria Toon" rules from docs/ART_GUIDE.md:
 * warm ink outlines, cel shadow on the lower-right, gloss on shiny things.
 */
import {
  Ctx, Pt, ShapeStyle, INK, shape, group, line, inkLine, ellipsePath, circlePath, roundRectPath, smoothPath, rgba, shade,
} from '../painter';

/** Boss silhouette outline width. */
export const OUT = 3.6;
/** Outline for big inner parts. */
export const OUT_IN = 2.6;
/** Outline for small details. */
export const OUT_S = 1.7;

export const TAU = Math.PI * 2;

/** Walk-cycle phase angle for frame 0..3. */
export const phase = (f: number) => ((((f % 4) + 4) % 4) / 4) * TAU;

/** Convert a screen-space light offset into the current local frame (keeps cel shadow lower-right when rotated). */
export function lit(ctx: Ctx, ox: number, oy: number): Pt {
  const m = ctx.getTransform();
  const det = m.a * m.d - m.b * m.c;
  if (!det) return [ox, oy];
  const k = Math.sqrt(Math.abs(det));
  return [((m.d * ox - m.c * oy) / det) * k, ((-m.b * ox + m.a * oy) / det) * k];
}

/** shape() whose shadow offset is given in screen space. */
export function S(ctx: Ctx, build: (c: Ctx) => void, st: ShapeStyle) {
  const so = st.shadowOffset ?? [-2.2, -2.6];
  shape(ctx, build, { ...st, shadowOffset: lit(ctx, so[0], so[1]) });
}

/** group() whose shadow offsets are given in screen space. */
export function G(ctx: Ctx, parts: { build: (c: Ctx) => void; style: ShapeStyle }[], ink = OUT, inkColor = INK) {
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

/** Run `fn` with the canvas clipped to the path built by `build`. */
export function clipTo(ctx: Ctx, build: (c: Ctx) => void, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

/** Fill a path (no outline). */
export function fillPath(ctx: Ctx, build: (c: Ctx) => void, fill: string | CanvasGradient, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

/** Stroke a path (no fill). */
export function strokePath(ctx: Ctx, build: (c: Ctx) => void, color: string, width: number, alpha = 1, dash?: number[]) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  build(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

/** Four-point twinkle star. */
export function sparkle(ctx: Ctx, x: number, y: number, r: number, color = '#ffffff', alpha = 1, thin = 0.2) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  const t = r * thin;
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + t, y - t, x + r, y);
  ctx.quadraticCurveTo(x + t, y + t, x, y + r);
  ctx.quadraticCurveTo(x - t, y + t, x - r, y);
  ctx.quadraticCurveTo(x - t, y - t, x, y - r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Heart centred at (x,y); s ≈ half width. */
export function heartPath(c: Ctx, x: number, y: number, s: number) {
  c.moveTo(x, y + s * 0.95);
  c.bezierCurveTo(x - s * 0.35, y + s * 0.62, x - s * 1.12, y + s * 0.2, x - s * 1.0, y - s * 0.38);
  c.bezierCurveTo(x - s * 0.9, y - s * 0.95, x - s * 0.15, y - s * 1.0, x, y - s * 0.42);
  c.bezierCurveTo(x + s * 0.15, y - s * 1.0, x + s * 0.9, y - s * 0.95, x + s * 1.0, y - s * 0.38);
  c.bezierCurveTo(x + s * 1.12, y + s * 0.2, x + s * 0.35, y + s * 0.62, x, y + s * 0.95);
  c.closePath();
}

/** A drip hanging from (x,y): top width w, total length len, bulb at the bottom. */
export function dripPath(c: Ctx, x: number, y: number, w: number, len: number) {
  // wound clockwise (like arc/ellipse/roundRect) so it unions cleanly with puffs in the same path
  const rb = Math.max(0.6, w * 0.42);
  const cy = y + len - rb;
  c.moveTo(x + w / 2, y - 0.5);
  c.bezierCurveTo(x + w / 2, y + (cy - y) * 0.45, x + rb * 0.8, cy - rb * 1.2, x + rb, cy);
  c.arc(x, cy, rb, 0, Math.PI, false);
  c.bezierCurveTo(x - rb * 0.8, cy - rb * 1.2, x - w / 2, y + (cy - y) * 0.45, x - w / 2, y - 0.5);
  c.closePath();
}

/** Puffy cloud of circles (foam, steam, smoke). */
export function puffPath(c: Ctx, pts: [number, number, number][]) {
  for (const [x, y, r] of pts) circlePath(c, x, y, r);
}

/**
 * Cartoon fist (white glove by default). (x,y) = centre, knuckles point along `rot`.
 * `cuff` draws a glove cuff behind the wrist.
 */
export function fist(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  rot: number,
  o: { fill?: string; shadow?: string; cuff?: string; ink?: number; thumbUp?: boolean; crease?: string } = {},
) {
  const fill = o.fill ?? '#fbf6ea';
  const sh = o.shadow ?? '#c9cbdb';
  const ink = o.ink ?? OUT_IN;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (o.cuff) {
    S(ctx, (c) => roundRectPath(c, -r * 1.62, -r * 0.86, r * 0.8, r * 1.72, r * 0.32), { fill: o.cuff, ink, shadowOffset: [-1.4, -1.6], gloss: [{ x: -r * 1.35, y: -r * 0.45, rx: r * 0.16, ry: r * 0.42, alpha: 0.5 }] });
  }
  S(ctx, (c) => {
    c.moveTo(-r * 0.95, -r * 0.8);
    c.quadraticCurveTo(r * 0.15, -r * 1.12, r * 0.92, -r * 0.62);
    c.quadraticCurveTo(r * 1.28, 0, r * 0.95, r * 0.64);
    c.quadraticCurveTo(r * 0.1, r * 1.12, -r * 0.95, r * 0.8);
    c.quadraticCurveTo(-r * 1.15, 0, -r * 0.95, -r * 0.8);
    c.closePath();
  }, { fill, ink, shadow: sh, shadowOffset: [-r * 0.24, -r * 0.26], gloss: [{ x: -r * 0.3, y: -r * 0.45, rx: r * 0.35, ry: r * 0.2, rot: -0.3, alpha: 0.6 }] });
  // finger creases (knuckle side)
  for (const k of [-0.32, 0.08, 0.46]) {
    line(ctx, [[r * 0.42, k * r - r * 0.06], [r * 1.0, k * r + r * 0.02]], Math.max(0.9, ink * 0.5), o.crease ?? (o.fill ? shade(fill, 0.35) : '#aeb3c6'));
  }
  // thumb
  if (o.thumbUp) {
    S(ctx, (c) => roundRectPath(c, -r * 0.35, -r * 1.85, r * 0.62, r * 1.2, r * 0.3), { fill, ink: ink * 0.85, shadow: sh, shadowOffset: [-0.8, -0.8] });
  } else {
    S(ctx, (c) => ellipsePath(c, -r * 0.05, -r * 0.6, r * 0.58, r * 0.3, -0.12), { fill, ink: ink * 0.8, shadow: sh, shadowOffset: [-0.7, -0.9] });
  }
  ctx.restore();
}

/** Thick inked limb along a smooth polyline (arms, tentacles). */
export function limb(ctx: Ctx, pts: Pt[], width: number, color: string, ink = OUT_IN, shadowCol?: string) {
  inkLine(ctx, pts, width, color, true, ink);
  if (shadowCol) {
    // shading stripe on the lower-right side of the limb + faint highlight on the upper-left
    line(ctx, pts.map(([x, y]) => [x + width * 0.2, y + width * 0.22] as Pt), width * 0.4, shadowCol, true, 0.9);
    line(ctx, pts.map(([x, y]) => [x - width * 0.2, y - width * 0.2] as Pt), width * 0.2, '#ffffff', true, 0.28);
  }
}

/** Tapered crescent "swoosh" (motion arc) around (cx,cy). */
export function swoosh(ctx: Ctx, cx: number, cy: number, r: number, a0: number, a1: number, width: number, color: string, alpha = 0.7) {
  const n = 18;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + (a1 - a0) * t;
    const w = width * Math.sin(t * Math.PI) * (0.35 + 0.65 * t);
    outer.push([cx + Math.cos(a) * (r + w / 2), cy + Math.sin(a) * (r + w / 2)]);
    inner.push([cx + Math.cos(a) * (r - w / 2), cy + Math.sin(a) * (r - w / 2)]);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(outer[0][0], outer[0][1]);
  for (const p of outer) ctx.lineTo(p[0], p[1]);
  for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i][0], inner[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Radial impact / emphasis lines. */
export function burstLines(ctx: Ctx, x: number, y: number, r0: number, r1: number, n: number, color: string, width: number, seed = 5, a0 = 0, a1 = TAU, alpha = 1) {
  let s = seed;
  const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  for (let i = 0; i < n; i++) {
    const a = a0 + ((i + 0.5) / n) * (a1 - a0) + (R() - 0.5) * 0.15;
    const k0 = r0 * (0.9 + R() * 0.25), k1 = r1 * (0.8 + R() * 0.3);
    ctx.lineWidth = width * (0.6 + R() * 0.6);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * k0, y + Math.sin(a) * k0);
    ctx.lineTo(x + Math.cos(a) * k1, y + Math.sin(a) * k1);
    ctx.stroke();
  }
  ctx.restore();
}

/** Arcs radiating from a point (sound / shock rings). */
export function rings(ctx: Ctx, x: number, y: number, r0: number, gap: number, n: number, a0: number, a1: number, color: string, width: number, alpha = 0.9) {
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - i / (n + 0.5));
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (1 - i * 0.18);
    ctx.beginPath();
    ctx.arc(x, y, r0 + i * gap, a0, a1);
    ctx.stroke();
    ctx.restore();
  }
}

/** Soft radial glow without hard edges. */
export function softGlow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1, ry = r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / r);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.35, rgba(color, alpha * 0.55));
  g.addColorStop(0.7, rgba(color, alpha * 0.18));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  circlePath(ctx, 0, 0, r);
  ctx.fill();
  ctx.restore();
}

/** Wispy steam curl rising from (x,y). */
export function steamWisp(ctx: Ctx, x: number, y: number, h: number, sway: number, width: number, alpha = 0.55, color = '#ffffff') {
  const pts: Pt[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    pts.push([x + Math.sin(t * Math.PI * 1.6 + sway) * width * (0.4 + t * 0.6), y - t * h]);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  // tapered: draw several strokes of decreasing width along prefixes
  for (let k = 0; k < 3; k++) {
    ctx.lineWidth = width * (0.5 - k * 0.14);
    ctx.beginPath();
    smoothPath(ctx, pts.slice(0, 6 - k * 2 || 2), false);
    ctx.stroke();
  }
  ctx.restore();
}

/** Simple cel-shaded ball (gems, studs, meatballs). */
export function ball(ctx: Ctx, x: number, y: number, r: number, fill: string, ink = OUT_S, glossA = 0.75) {
  shape(ctx, (c) => circlePath(c, x, y, r), {
    fill, ink, shadowOffset: [-r * 0.3, -r * 0.35],
    gloss: [{ x: x - r * 0.35, y: y - r * 0.4, rx: r * 0.32, ry: r * 0.22, rot: -0.6, alpha: glossA }],
  });
}

/** Faceted gem (diamond-ish) centred at x,y. */
export function gem(ctx: Ctx, x: number, y: number, r: number, fill: string, ink = OUT_S) {
  shape(ctx, (c) => {
    c.moveTo(x, y - r);
    c.lineTo(x + r * 0.85, y - r * 0.15);
    c.lineTo(x, y + r);
    c.lineTo(x - r * 0.85, y - r * 0.15);
    c.closePath();
  }, { fill, ink, shadowOffset: [-r * 0.35, -r * 0.3], gloss: [{ x: x - r * 0.3, y: y - r * 0.35, rx: r * 0.28, ry: r * 0.16, rot: -0.7, alpha: 0.85 }] });
}

/** Ink-outlined text-free "emoji bubble" (rounded speech bubble with a tail). */
export function bubblePath(c: Ctx, x: number, y: number, w: number, h: number, tail: number) {
  const r = Math.min(w, h) * 0.45;
  roundRectPath(c, x - w / 2, y - h / 2, w, h, r);
  // tail wound the same way as the rounded rect (clockwise) so the overlap doesn't punch a hole
  c.moveTo(x + w * 0.14, y + h / 2 - 0.5);
  c.lineTo(x - w * 0.18 + tail, y + h / 2 + h * 0.42);
  c.lineTo(x - w * 0.12, y + h / 2 - 0.5);
  c.closePath();
}

/** Pivot helper: rotate the coordinate system by `a` around (px,py). */
export function pivot(ctx: Ctx, px: number, py: number, a: number) {
  ctx.translate(px, py);
  ctx.rotate(a);
  ctx.translate(-px, -py);
}

/** Classic cartoon leaf / blade path from base (bx,by) along angle with bend (fraction of len, + = toward the normal). */
export function bladePath(c: Ctx, bx: number, by: number, ang: number, len: number, w: number, bend: number) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const nx = -dy, ny = dx;
  const tx = bx + dx * len + nx * bend * len;
  const ty = by + dy * len + ny * bend * len;
  const mx = bx + dx * len * 0.48 + nx * bend * len * 0.3;
  const my = by + dy * len * 0.48 + ny * bend * len * 0.3;
  c.moveTo(bx - nx * w * 0.42, by - ny * w * 0.42);
  c.quadraticCurveTo(mx - nx * w, my - ny * w, tx, ty);
  c.quadraticCurveTo(mx + nx * w, my + ny * w, bx + nx * w * 0.42, by + ny * w * 0.42);
  c.closePath();
}

/** Midrib points of a blade built by bladePath (for vein strokes). */
export function bladeRib(bx: number, by: number, ang: number, len: number, bend: number, upto = 0.82): Pt[] {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const nx = -dy, ny = dx;
  const pts: Pt[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = (i / 4) * upto;
    // quadratic bezier: base → control(mid) → tip
    const mx = bx + dx * len * 0.48 + nx * bend * len * 0.3;
    const my = by + dy * len * 0.48 + ny * bend * len * 0.3;
    const tx = bx + dx * len + nx * bend * len;
    const ty = by + dy * len + ny * bend * len;
    const u = 1 - t;
    pts.push([u * u * bx + 2 * u * t * mx + t * t * tx, u * u * by + 2 * u * t * my + t * t * ty]);
  }
  return pts;
}

/**
 * Pineapple leaf crown. (x,y) = where the leaves sprout. `f` animates a sway.
 * `spread` (1 = normal) fans the leaves out, `scale` sizes everything.
 */
export function pineappleCrown(ctx: Ctx, x: number, y: number, scale: number, f: number, o: { spread?: number; flare?: number; sway?: number; ink?: number; lite?: boolean } = {}) {
  const spread = o.spread ?? 1;
  const flare = o.flare ?? 0;
  const ink = o.ink ?? OUT_IN;
  const ph = phase(f);
  const sway = o.sway ?? 1;
  const UP = -Math.PI / 2;
  // [angleOffsetFromUp, len, width, layer]
  const leaves: [number, number, number, number][] = [
    // back layer (dark)
    [-1.45, 50, 7.5, 0], [1.42, 48, 7.5, 0],
    [-1.12, 62, 8.5, 0], [1.1, 60, 8.5, 0],
    [-0.78, 72, 9, 0], [0.75, 70, 9, 0],
    [-0.42, 80, 9.5, 0], [0.4, 78, 9.5, 0],
    [-0.12, 86, 9.5, 0], [0.16, 84, 9.5, 0],
    // middle layer
    [-1.25, 46, 8.5, 1], [1.22, 45, 8.5, 1],
    [-0.9, 56, 9.5, 1], [0.88, 55, 9.5, 1],
    [-0.55, 64, 10, 1], [0.55, 62, 10, 1],
    [-0.22, 70, 10, 1], [0.25, 68, 10, 1],
    // front layer (bright, short, chunky)
    [-1.0, 34, 10, 2], [1.0, 33, 10, 2],
    [-0.6, 42, 11, 2], [0.62, 40, 11, 2],
    [-0.2, 46, 11.5, 2], [0.22, 45, 11.5, 2],
  ];
  const cols = [
    { fill: '#1f7a3e', sh: '#145a32', rib: '#2f9a52' },
    { fill: '#2fa04c', sh: '#1d7a3d', rib: '#6fd27a' },
    { fill: '#4cc25a', sh: '#2c9447', rib: '#a8f09a' },
  ];
  leaves.forEach(([off, len, w, layer], i) => {
    if (o.lite && layer < 2 && Math.abs(off) > 1.0) return; // outer leaves hidden anyway
    const side = off < 0 ? -1 : 1;
    const wob = Math.sin(ph + i * 1.7) * 0.045 * sway * (layer === 0 ? 1.2 : 0.8);
    const a = UP + off * spread * (1 + flare * 0.18) + wob;
    const L = len * scale * (1 + flare * 0.08);
    const W = w * scale;
    const bend = 0.16 * side * (0.4 + Math.abs(off)) * (1 - flare * 0.4);
    const bx = x + Math.sin(off) * 5 * scale, by = y + (layer === 2 ? 3 : 1) * scale;
    const col = cols[layer];
    S(ctx, (c) => bladePath(c, bx, by, a, L, W, bend), { fill: col.fill, ink, shadow: col.sh, shadowOffset: [-W * 0.32, -W * 0.18] });
    if (layer > 0) line(ctx, bladeRib(bx, by, a, L, bend, 0.78), Math.max(0.8, W * 0.16), col.rib, true, 0.85);
  });
}

/**
 * Little jaunty gold crown. (x,y) = bottom centre of the band; band ≈ 28·s wide.
 */
export function goldCrown(ctx: Ctx, x: number, y: number, s: number, tilt: number, f = 0, ink = OUT_IN) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  const GOLD = '#ffc93a', GOLD_SH = '#d58a12';
  // body with 5 points
  S(ctx, (c) => {
    c.moveTo(-14, 0);
    c.lineTo(-15.5, -17);
    c.lineTo(-8.5, -9.5);
    c.lineTo(-5, -21);
    c.lineTo(0, -11);
    c.lineTo(5, -21);
    c.lineTo(8.5, -9.5);
    c.lineTo(15.5, -17);
    c.lineTo(14, 0);
    c.quadraticCurveTo(0, 2.5, -14, 0);
    c.closePath();
  }, { fill: GOLD, ink: ink / s, shadow: GOLD_SH, shadowOffset: [-2.6, -1.6], gloss: [{ x: -8, y: -8, rx: 2.2, ry: 4.5, rot: 0.2, alpha: 0.7 }] });
  // band
  S(ctx, (c) => {
    c.moveTo(-14.6, -6);
    c.quadraticCurveTo(0, -3.4, 14.6, -6);
    c.lineTo(14, 0);
    c.quadraticCurveTo(0, 2.5, -14, 0);
    c.closePath();
  }, { fill: '#ffb320', ink: (ink * 0.7) / s, shadow: '#c87a10', shadowOffset: [-1.5, -1] });
  // balls on tips
  for (const [bx, by] of [[-15.5, -17], [-5, -21], [5, -21], [15.5, -17]] as Pt[]) ball(ctx, bx, by, 2.3, '#fff1a6', (ink * 0.55) / s, 0.9);
  // gems
  gem(ctx, 0, -3, 2.6, '#e8304a', (ink * 0.5) / s);
  gem(ctx, -8, -2.7, 1.9, '#2f8cff', (ink * 0.5) / s);
  gem(ctx, 8, -2.7, 1.9, '#2fbf5a', (ink * 0.5) / s);
  // twinkle
  const tw = [[-11, -12], [11, -13], [0, -16], [-4, -6]][((f % 4) + 4) % 4];
  sparkle(ctx, tw[0], tw[1], 4.2, '#ffffff', 0.95);
  ctx.restore();
}

/** Thick boss legs with a 4-frame stomp cycle. `shoe(x,y,side,lift)` draws each foot. */
export function stompLegs(
  ctx: Ctx,
  hipX: number,
  hipY: number,
  footY: number,
  f: number,
  o: { spread: number; thick: number; color: string; stride: number; lift: number; ink?: number; shade?: string; shoe: (x: number, y: number, side: number, lift: number) => void },
) {
  const ph = phase(f);
  const ink = o.ink ?? OUT_IN;
  for (const side of [-1, 1]) {
    const pp = ph + (side < 0 ? 0 : Math.PI);
    const s = Math.sin(pp);
    const lift = Math.max(0, -Math.cos(pp)) * o.lift;
    const fx = hipX + side * o.spread + s * o.stride;
    const fy = footY - lift;
    const hx = hipX + side * o.spread * 0.75;
    inkLine(ctx, [[hx, hipY], [(hx + fx) / 2 + side * 1.5, (hipY + fy) / 2], [fx, fy - o.thick * 0.35]], o.thick, o.color, true, ink);
    if (o.shade) line(ctx, [[hx + o.thick * 0.22, hipY + 2], [fx + o.thick * 0.22, fy - o.thick * 0.5]], o.thick * 0.32, o.shade, false, 0.9);
    o.shoe(fx, fy, side, lift);
  }
}

/**
 * Villain eye with a slanted lid: `lidOuter`/`lidInner` = how far down (0 = top, 1 = bottom)
 * the lid edge reaches at the outer / inner corner. side = -1 for the left eye, +1 for the right.
 */
export function lidEye(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  o: {
    side: number; lidOuter: number; lidInner: number; look?: Pt; iris?: string; pupil?: number; lidColor: string;
    ink?: number; squash?: number; sclera?: string; glow?: string; lash?: boolean; slit?: boolean;
  },
) {
  const ry = r * (o.squash ?? 1.08);
  const ink = o.ink ?? Math.max(1.2, r * 0.26);
  const eyeB = (c: Ctx) => ellipsePath(c, x, y, r, ry);
  if (o.glow) softGlow(ctx, x, y, r * 2.2, o.glow, 0.7);
  shape(ctx, eyeB, { fill: o.sclera ?? '#fffaf0', ink, shadow: 'none' });
  const inner = -o.side;
  const xo = x - inner * r * 1.25, xi = x + inner * r * 1.25;
  const yo = y - ry + ry * 2 * o.lidOuter, yi = y - ry + ry * 2 * o.lidInner;
  clipTo(ctx, eyeB, () => {
    const [lx, ly] = o.look ?? [0.25, 0.15];
    const px = x + lx * r, py = y + ly * r;
    if (o.iris) {
      fillPath(ctx, (c) => circlePath(c, px, py, r * 0.64), o.iris);
      fillPath(ctx, (c) => circlePath(c, px + r * 0.12, py + r * 0.14, r * 0.64), shade(o.iris, 0.3), 0.55);
    }
    if (o.slit) fillPath(ctx, (c) => ellipsePath(c, px, py, r * 0.14, r * 0.5), INK);
    else fillPath(ctx, (c) => circlePath(c, px, py, r * (o.pupil ?? 0.34)), INK);
    fillPath(ctx, (c) => circlePath(c, px - r * 0.22, py - r * 0.24, r * 0.17), '#ffffff');
    // under-lid shadow on the sclera
    fillPath(ctx, (c) => {
      c.moveTo(xo, yo);
      c.lineTo(xi, yi);
      c.lineTo(xi, yi + r * 0.32);
      c.lineTo(xo, yo + r * 0.32);
      c.closePath();
    }, '#000000', 0.12);
    // lid
    fillPath(ctx, (c) => {
      c.moveTo(xo - inner * r, y - ry * 2);
      c.lineTo(xi + inner * r, y - ry * 2);
      c.lineTo(xi + inner * r, yi);
      c.quadraticCurveTo(x, (yo + yi) / 2 + r * 0.12, xo - inner * r, yo);
      c.closePath();
    }, o.lidColor);
  });
  // lid edge (thick ink) clipped to a slightly bigger eye
  clipTo(ctx, (c) => ellipsePath(c, x, y, r + ink, ry + ink), () => {
    line(ctx, [[xo - inner * r * 0.2, yo], [x, (yo + yi) / 2 + r * 0.06], [xi + inner * r * 0.2, yi]], ink * 1.5, INK, true);
  });
  if (o.lash) {
    line(ctx, [[x - inner * r * 0.92, yo + r * 0.06], [x - inner * r * 1.32, yo - r * 0.3]], ink * 1.1, INK, false);
  }
}

/** Pineapple ring (tinned slice) centred at (x,y), seen at an angle (ry/rx = tilt). */
export function pineappleRing(ctx: Ctx, x: number, y: number, r: number, tilt = 0.75, rot = 0, ink = OUT_S) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const ring = (c: Ctx) => {
    ellipsePath(c, 0, 0, r, r * tilt);
    c.moveTo(r * 0.36, 0);
    c.ellipse(0, 0, r * 0.36, r * 0.36 * tilt, 0, 0, TAU, true);
  };
  shape(ctx, ring, { fill: '#ffe066', ink, shadow: '#f0b42a', shadowOffset: [-r * 0.18, -r * 0.2], gloss: [{ x: -r * 0.55, y: -r * 0.35 * tilt, rx: r * 0.22, ry: r * 0.1, rot: -0.5, alpha: 0.7 }] });
  // fibres
  ctx.save();
  ctx.beginPath();
  ring(ctx);
  ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(220,150,40,0.55)';
  ctx.lineWidth = Math.max(0.6, r * 0.05);
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    ctx.moveTo(Math.cos(a) * r * 0.44, Math.sin(a) * r * 0.44 * tilt);
    ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9 * tilt);
  }
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/** Smooth closed outline through points (convenience). */
export function blob(c: Ctx, pts: Pt[]) {
  smoothPath(c, pts, true);
}

export { INK };
