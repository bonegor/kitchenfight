/**
 * ENEMIES (part A) — the first fifteen "culinary crimes".
 *
 *   enemy.<id>   4-frame move cycle (frame 0 = neutral) + white hit flash.
 *                Anchor (0,0) = centre of the collision circle (radius r), the feet / base rest at
 *                about y = +r, facing right (the renderer mirrors). No ground shadow.
 *
 * Every crime owns ONE dominant colour + a silhouette that reads at 1x in a crowd:
 *   spezzato      r10  pale-gold bundle of snapped spaghetti, spiky broken top, red twine belt
 *   ketchup       r14  red squeeze bottle, white pointy nozzle-cap hat, drips
 *   panna         r15  white whipped-cream swirl, blue milk-carton helmet, cream drips
 *   forbici       r13  steel scissors on red finger-loop feet, blades snap like a beak
 *   scotta        r16  saggy pale-yellow blob of swollen noodles, droopy strands
 *   scotta_mini   r10  small angrier version
 *   cipolla       r15  purple onion, khaki trench-coat collar, black shades, green sprout
 *   aglio         r14  garlic-bulb head on a crisp white shirt + red tie, green stink wisps
 *   bacon         r13  wavy pink/white bacon strip with a fake moustache (wave travels along it)
 *   piselli       r8   a single angry pea with a red rebel headband
 *   ananas        r22  big armoured pineapple, riveted diamond plates, spiky leaf crown
 *   ananas_pezzo  r9   bright yellow pineapple chunk with a strip of rind
 *   pollo         r13  roast drumstick in a spy fedora + groucho disguise, on chicken feet
 *   pepperoni     r11  flying salami slice, little white wings, bell-pepper hat (tricolore!)
 *   polpetta      r14  glossy meatball wrapped in spaghetti, sauce cap; texture rolls
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, group, flat, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath,
  line, inkLine, legs, arm, eye, brow, mouth, speckle, glint, rng, shade, light, rgba, mix,
} from '../painter';
import type { EyeOpts, ShapeStyle } from '../painter';

const TAU = Math.PI * 2;
const LIMB = '#4a2c1e'; // stubby legs / arms
const SHOE = '#2e1c15';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function reg(id: string, w: number, h: number, ax: number, ay: number, draw: (ctx: Ctx, f: number) => void) {
  defineSprite({ id: `enemy.${id}`, w, h, ax, ay, frames: 4, flash: true, draw });
}

/** Round shaded ball (hands, peas, studs, knots). */
function ball(ctx: Ctx, x: number, y: number, r: number, fill: string, sh = shade(fill), ink = 1.2, glossA = 0.55) {
  shape(ctx, (c) => circlePath(c, x, y, r), {
    fill, ink, shadow: sh, shadowOffset: [-r * 0.36, -r * 0.4],
    gloss: glossA > 0 ? [{ x: x - r * 0.38, y: y - r * 0.42, rx: r * 0.34, ry: r * 0.21, rot: -0.5, alpha: glossA }] : undefined,
  });
}

/** Run `fn` clipped to the path built by `build`. */
function clipped(ctx: Ctx, build: (c: Ctx) => void, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

/** Closed outline around a centre line with per-point widths. */
function ribbon(pts: Pt[], widths: number[] | number): Pt[] {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const w = (Array.isArray(widths) ? widths[i] : widths) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return [...L, ...R.reverse()];
}

/** Hanging drop (teardrop) attached at (x,y), total length `len`, bulb width `w`. */
function dropPath(c: Ctx, x: number, y: number, len: number, w: number) {
  const r = w / 2, by = y + len - r;
  c.moveTo(x - w * 0.42, y);
  c.quadraticCurveTo(x - w * 0.26, y + (by - y) * 0.62, x - r, by);
  c.arc(x, by, r, Math.PI, 0, true);
  c.quadraticCurveTo(x + w * 0.26, y + (by - y) * 0.62, x + w * 0.42, y);
  c.closePath();
}

interface EyePair {
  x: number;
  y: number;
  r: number;
  sp: number;
  look?: Pt;
  lid?: 'angry' | 'half' | 'sad' | 'none';
  pupil?: number;
  iris?: string;
  squash?: number;
  /** far (left) eye scale, for a 3/4 turn */
  far?: number;
  brow?: { ang: number; dy?: number; len?: number; th?: number; color?: string; tiltR?: number };
}

/** Two cartoon eyes (+ optional brows). Brow ang > 0 = angry V. */
function eyes(ctx: Ctx, o: EyePair) {
  const lx = o.x - o.sp / 2, rx = o.x + o.sp / 2;
  const far = o.far ?? 0.92;
  const lids: Record<string, [EyeOpts['lid'], EyeOpts['lid']]> = {
    angry: ['angry-l', 'angry-r'], half: ['half', 'half'], sad: ['sad-l', 'sad-r'], none: ['none', 'none'],
  };
  const [ll, lr] = lids[o.lid ?? 'angry'];
  const base: EyeOpts = { look: o.look ?? [0.25, 0.1], pupil: o.pupil ?? 0.52, iris: o.iris, squash: o.squash };
  eye(ctx, lx, o.y, o.r * far, { ...base, lid: ll });
  eye(ctx, rx, o.y, o.r, { ...base, lid: lr });
  if (o.brow) {
    const b = o.brow;
    const by = o.y - o.r * (b.dy ?? 1.35);
    const len = b.len ?? o.r * 1.75;
    const th = b.th ?? Math.max(1.1, o.r * 0.46);
    brow(ctx, lx, by + (o.r - o.r * far) * 0.5, len * far, b.ang, th, b.color ?? INK);
    brow(ctx, rx, by, len, -(b.tiltR ?? b.ang), th, b.color ?? INK);
  }
}

/** Soft translucent overlay crescent (for shading textures painted on top of a base). */
function shadeOver(ctx: Ctx, build: (c: Ctx) => void, color: string, off: Pt, alpha = 1) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(-4000, -4000, 8000, 8000);
  ctx.translate(off[0], off[1]);
  build(ctx);
  ctx.translate(-off[0], -off[1]);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill('evenodd');
  ctx.restore();
}

/** Little sparkle (4-point star) — sharp edges, gloss pings. */
function sparkle(ctx: Ctx, x: number, y: number, r: number, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r);
  ctx.fill();
  ctx.restore();
}

/** Mitten hand at the end of a rubber-hose arm. */
function hoseArm(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, hand: string, thick = 1.7, handR = 2.1, bend = 0.15) {
  const mx = (x1 + x2) / 2 + (y2 - y1) * bend;
  const my = (y1 + y2) / 2 - (x2 - x1) * bend;
  inkLine(ctx, [[x1, y1], [mx, my], [x2, y2]], thick, LIMB, true, 0.9);
  ball(ctx, x2, y2, handR, hand, shade(hand, 0.25), 1, 0.45);
}

