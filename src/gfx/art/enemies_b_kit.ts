/**
 * ENEMIES B — shared kit (palette bits + small drawing helpers) used by the
 * enemies_b_* painters. Everything here builds on src/gfx/painter.ts.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, line, ellipsePath, circlePath, starPath, rgba, eye, brow, EyeOpts,
} from '../painter';

export const TAU = Math.PI * 2;

/** Rubber-hose limb colour shared by the B-crimes (warm dark brown, a touch lighter than INK). */
export const LIMB = '#4a2a22';
/** Glove white for cartoon mitten hands. */
export const GLOVE = '#fbf4e6';

/**
 * Register an enemy sprite: 'enemy.<id>', 4-frame cycle, hit flash.
 * Anchor = centre of the collision circle; feet rest at about y = +r.
 */
export function enemySprite(id: string, w: number, h: number, ay: number, draw: (ctx: Ctx, f: number) => void, ax = w / 2) {
  defineSprite({ id: 'enemy.' + id, w, h, ax, ay, frames: 4, flash: true, draw });
}

/** Walk-cycle phase helpers. */
export function cyc(f: number) {
  const ph = (f / 4) * TAU;
  return { ph, s: Math.sin(ph), c: Math.cos(ph) };
}

/** Liquid drip hanging from (x,y): neck width w, total length len, round bulb at the end. */
export function dripPath(c: Ctx, x: number, y: number, w: number, len: number) {
  const r = w * 0.5;
  const by = y + Math.max(len - r, r * 0.4);
  c.moveTo(x - w * 0.75, y - 0.6);
  c.quadraticCurveTo(x - r * 0.75, y + (by - y) * 0.45, x - r, by);
  c.arc(x, by, r, Math.PI, 0, true);
  c.quadraticCurveTo(x + r * 0.75, y + (by - y) * 0.45, x + w * 0.75, y - 0.6);
  c.closePath();
}

/**
 * Cylinder silhouette: straight/tapered body with a rounded bottom and the back
 * rim of the top ellipse (the top opening itself is drawn separately).
 */
export function cylPath(c: Ctx, x: number, yTop: number, yBot: number, rxTop: number, rxBot: number, ryTop: number, ryBot = ryTop) {
  c.moveTo(x - rxTop, yTop);
  c.lineTo(x - rxBot, yBot);
  c.ellipse(x, yBot, rxBot, ryBot, 0, Math.PI, 0, true);
  c.lineTo(x + rxTop, yTop);
  c.ellipse(x, yTop, rxTop, ryTop, 0, 0, Math.PI, true);
  c.closePath();
}

/** Elliptical ring (onion ring, saucer groove, ring light) — nonzero-safe hole. */
export function ringPath(c: Ctx, x: number, y: number, rx: number, ry: number, rx2: number, ry2: number, rot = 0) {
  c.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
  c.moveTo(x + Math.cos(rot) * rx2, y + Math.sin(rot) * rx2);
  c.ellipse(x, y, rx2, ry2, rot, TAU, 0, true);
}

/** Cartoon heart, centred near (x,y), size s (≈ half width). */
export function heartPath(c: Ctx, x: number, y: number, s: number) {
  c.moveTo(x, y + s * 0.95);
  c.bezierCurveTo(x - s * 1.5, y + s * 0.05, x - s * 0.95, y - s * 1.05, x, y - s * 0.38);
  c.bezierCurveTo(x + s * 0.95, y - s * 1.05, x + s * 1.5, y + s * 0.05, x, y + s * 0.95);
  c.closePath();
}

/** Wispy steam curl rising from (x,y). */
export function steamCurl(ctx: Ctx, x: number, y: number, h: number, phase: number, w = 1.6, alpha = 0.55, col = '#ffffff') {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([x + Math.sin(phase + t * 4.6) * 2.1 * (0.35 + t), y - t * h]);
  }
  line(ctx, pts.slice(0, 5), w, col, true, alpha);
  line(ctx, pts.slice(3), w * 0.7, col, true, alpha * 0.75);
}

/** Four-point twinkle (ice glints, sparkles). */
export function twinkle(ctx: Ctx, x: number, y: number, r: number, col = '#ffffff', alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  starPath(ctx, x, y, r, r * 0.28, 4);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}

/** Six-armed snowflake. */
export function snowflake(ctx: Ctx, x: number, y: number, r: number, col = '#ffffff', alpha = 0.95, w = 0.8) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI + Math.PI / 2;
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
  }
  ctx.stroke();
  ctx.restore();
}

/** Soft cloud puff (powder, mist): blobby circles with a light outline. */
export function puff(ctx: Ctx, x: number, y: number, r: number, fill: string, edge: string, alpha = 1, ink = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const build = (c: Ctx) => {
    circlePath(c, x, y, r);
    circlePath(c, x - r * 0.75, y + r * 0.25, r * 0.7);
    circlePath(c, x + r * 0.8, y + r * 0.2, r * 0.66);
    circlePath(c, x + r * 0.15, y - r * 0.55, r * 0.6);
  };
  shape(ctx, build, { fill, ink, inkColor: edge, shadow: 'none' });
  ctx.restore();
}

/** Mitten hand (white glove) at (x,y). */
export function mitt(ctx: Ctx, x: number, y: number, r: number, col = GLOVE, ink = 1.2) {
  shape(ctx, (c) => circlePath(c, x, y, r), {
    fill: col, ink, shadowOffset: [-r * 0.35, -r * 0.4],
    gloss: [{ x: x - r * 0.35, y: y - r * 0.4, rx: r * 0.35, ry: r * 0.22, rot: -0.5, alpha: 0.7 }],
  });
}

/** Rubber-hose arm from shoulder (x1,y1) to hand (x2,y2) with a gentle elbow bend. */
export function hoseArm(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, o: { bend?: number; thick?: number; col?: string; hand?: string; handR?: number; ink?: number } = {}) {
  const bend = o.bend ?? 0.18;
  const thick = o.thick ?? 1.9;
  const mx = (x1 + x2) / 2 + (y2 - y1) * bend;
  const my = (y1 + y2) / 2 - (x2 - x1) * bend;
  const ink = o.ink ?? 1.05;
  line(ctx, [[x1, y1], [mx, my], [x2, y2]], thick + ink * 2, INK, true);
  line(ctx, [[x1, y1], [mx, my], [x2, y2]], thick, o.col ?? LIMB, true);
  if (o.hand !== '') mitt(ctx, x2, y2, o.handR ?? thick * 1.25, o.hand ?? GLOVE, ink);
}

/** A pair of eyes + brows with full control (3/4 faces usually put the near eye a bit bigger). */
export function eyePair(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  o: {
    sp?: number;
    look?: Pt;
    lidL?: EyeOpts['lid'];
    lidR?: EyeOpts['lid'];
    pupil?: number;
    iris?: string;
    near?: number; // size factor of the right (near) eye
    brow?: number; // brow angle (0 = none)
    browCol?: string;
    browDy?: number;
    browLen?: number;
    browTh?: number;
    squash?: number;
  } = {},
) {
  const sp = o.sp ?? r * 2.5;
  const lx = x - sp / 2, rx = x + sp / 2;
  const rn = r * (o.near ?? 1.06);
  const look = o.look ?? [0.3, 0.06];
  eye(ctx, lx, y, r, { look, lid: o.lidL ?? 'angry-l', pupil: o.pupil ?? 0.5, iris: o.iris, squash: o.squash });
  eye(ctx, rx, y, rn, { look, lid: o.lidR ?? 'angry-r', pupil: o.pupil ?? 0.5, iris: o.iris, squash: o.squash });
  if (o.brow) {
    const by = y - r * (o.browDy ?? 1.45);
    const bl = o.browLen ?? r * 1.75;
    const th = o.browTh ?? Math.max(1.2, r * 0.45);
    brow(ctx, lx - r * 0.05, by, bl, o.brow, th, o.browCol ?? INK);
    brow(ctx, rx + r * 0.05, by - (rn - r) * 0.8, bl * (rn / r), -o.brow, th, o.browCol ?? INK);
  }
}

/** Blush/cheek spots. */
export function cheeks(ctx: Ctx, pts: Pt[], rx: number, ry: number, col: string, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = col;
  ctx.beginPath();
  for (const [x, y] of pts) ellipsePath(ctx, x, y, rx, ry);
  ctx.fill();
  ctx.restore();
}

/** Short motion/vibration strokes ("rattle lines"). */
export function shakeLines(ctx: Ctx, x: number, y: number, dir: 1 | -1, n = 3, len = 3, gap = 3, col = INK, alpha = 0.7, w = 0.9) {
  for (let i = 0; i < n; i++) {
    const yy = y + (i - (n - 1) / 2) * gap;
    const l = len * (i === (n - 1) / 2 ? 1.25 : 0.9);
    line(ctx, [[x, yy], [x + dir * l, yy - l * 0.15]], w, col, false, alpha);
  }
}

/** Translucent white wash, for glassy/frosty overlays. */
export function wash(ctx: Ctx, build: (c: Ctx) => void, col: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}

/** Clip to a path while running fn. */
export function clipTo(ctx: Ctx, build: (c: Ctx) => void, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

export { rgba };
