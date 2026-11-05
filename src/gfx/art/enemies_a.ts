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


/** White cartoon glove (ball + cuff); `ang` = direction the forearm points. */
function glove(ctx: Ctx, x: number, y: number, r: number, ang: number, color = '#fbf6ea', sh = '#c9cede') {
  const cx = x - Math.cos(ang) * r * 0.95, cy = y - Math.sin(ang) * r * 0.95;
  shape(ctx, (c) => ellipsePath(c, cx, cy, r * 0.42, r * 0.72, ang), { fill: color, ink: 0.9, shadow: sh, shadowOffset: [-0.4, -0.5] });
  ball(ctx, x, y, r, color, sh, 1.05, 0.55);
}

/** Rubber-hose arm ending in a white glove. */
function gloveArm(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, r = 2.4, thick = 1.8, bend = 0.15, color = LIMB) {
  const mx = (x1 + x2) / 2 + (y2 - y1) * bend;
  const my = (y1 + y2) / 2 - (x2 - x1) * bend;
  inkLine(ctx, [[x1, y1], [mx, my], [x2, y2]], thick, color, true, 0.9);
  glove(ctx, x2, y2, r, Math.atan2(y2 - my, x2 - mx));
}

/** Handlebar moustache centred at (x,y), width ≈ 2w, with a scalable outline. */
function moustache(ctx: Ctx, x: number, y: number, w: number, color: string, ink = 0.8) {
  shape(ctx, (c) => {
    c.moveTo(x, y - w * 0.12);
    c.bezierCurveTo(x - w * 0.25, y - w * 0.32, x - w * 0.55, y - w * 0.18, x - w * 0.62, y + w * 0.02);
    c.bezierCurveTo(x - w * 0.72, y - w * 0.12, x - w * 0.82, y - w * 0.22, x - w * 0.74, y - w * 0.34);
    c.bezierCurveTo(x - w * 0.98, y - w * 0.2, x - w * 0.86, y + w * 0.2, x - w * 0.58, y + w * 0.2);
    c.bezierCurveTo(x - w * 0.36, y + w * 0.2, x - w * 0.14, y + w * 0.08, x, y + w * 0.04);
    c.bezierCurveTo(x + w * 0.14, y + w * 0.08, x + w * 0.36, y + w * 0.2, x + w * 0.58, y + w * 0.2);
    c.bezierCurveTo(x + w * 0.86, y + w * 0.2, x + w * 0.98, y - w * 0.2, x + w * 0.74, y - w * 0.34);
    c.bezierCurveTo(x + w * 0.82, y - w * 0.22, x + w * 0.72, y - w * 0.12, x + w * 0.62, y + w * 0.02);
    c.bezierCurveTo(x + w * 0.55, y - w * 0.18, x + w * 0.25, y - w * 0.32, x, y - w * 0.12);
    c.closePath();
  }, {
    fill: color, ink, shadow: shade(color, 0.3), shadowOffset: [-w * 0.06, -w * 0.1],
    gloss: [{ x: x - w * 0.35, y: y - w * 0.06, rx: w * 0.14, ry: w * 0.05, rot: -0.3, alpha: 0.4 }, { x: x + w * 0.3, y: y - w * 0.06, rx: w * 0.14, ry: w * 0.05, rot: 0.3, alpha: 0.4 }],
  });
}

// ===========================================================================
// 1. LO SPEZZASPAGHETTI — r10. A bundle of snapped dry spaghetti.
// ===========================================================================

const SPAG = '#f2cf72';
const SPAG_SH = '#cf9a3e';
const SPAG_DK = '#9c6a26';
const SPAG_HI = '#fff0b8';
const TWINE = '#d8343a';

interface Stick { poly: Pt[]; tip: Pt; mid: Pt; t: number }

/** Ribbon around a polyline with a splintered (snapped) top end and a rough bottom end. */
function snappedStick(pts: Pt[], w: number, R: () => number, tipLen: number): { poly: Pt[]; tip: Pt } {
  const rib = ribbon(pts, w);
  const n = pts.length;
  const left = rib.slice(0, n), right = rib.slice(n);
  const a = pts[n - 2], b = pts[n - 1];
  const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / dl, uy = (b[1] - a[1]) / dl;
  const nx = -uy, ny = ux;
  const side = R() < 0.5 ? -1 : 1;
  const P = (u: number, v: number): Pt => [b[0] + ux * u + nx * v * w * 0.5, b[1] + uy * u + ny * v * w * 0.5];
  // jagged break: a sharp shard on one side, a notch on the other
  const tip = P(tipLen, side * 0.45);
  const cap = side > 0
    ? [P(-0.9, -0.2), P(0.2, 0.1), tip]
    : [tip, P(0.3, -0.1), P(-0.8, 0.25)];
  const b0 = pts[0];
  const capBot: Pt[] = [[b0[0] + (R() - 0.5) * 0.8, b0[1] + 0.7 + R() * 0.8]];
  return { poly: [...left, ...cap, ...right, ...capBot], tip };
}

function spaghettiSticks(): Stick[] {
  const R = rng(4242);
  const N = 7;
  const w = 3.1;
  const out: Stick[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * 2 - 1;
    const xb = t * 6.2 + (R() - 0.5) * 0.6;
    const yb = 5.4 - Math.abs(t) * 1.1 - R() * 1.2;
    const xw = t * 4.5;
    let xt = t * 8.6 + (R() - 0.5) * 0.8;
    let yt = -15.2 + Math.abs(t) * 2.4 - R() * 3.2;
    if (i === 2) yt += 3.2; // one stick snapped short
    const pts: Pt[] = [[xb, yb], [xw, 1], [xw * 1.02, -2.2]];
    if (i === 1) {
      // snapped and bent over at a crack
      const cx = t * 6.8, cy = -10.4;
      pts.push([cx, cy]);
      xt = cx - 5.4; yt = cy - 3.0;
    } else if (i === 5) {
      const cx = t * 7.2, cy = -11.8;
      pts.push([cx, cy]);
      xt = cx + 3.6; yt = cy - 4.6;
    }
    pts.push([xt, yt]);
    const { poly, tip } = snappedStick(pts, w, R, 1.6 + R() * 1.4);
    out.push({ poly, tip, mid: pts[pts.length - 2], t });
  }
  return out;
}

const SPAG_STICKS = spaghettiSticks();

function drawSpezzato(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  // far arm: fist shaken above the bundle
  const shake = [0, -1.4, 0, -0.8][f];
  gloveArm(ctx, -5.4, -4.5, -11.2, -12.2 + shake, 2.0, 1.5, -0.25);

  legs(ctx, 0, 3.6, f, { len: 5.4, spread: 6, thick: 2.3, color: LIMB, shoe: SHOE, stride: 3.4 });

  const sticks = SPAG_STICKS;
  // one silhouette outline for the whole bundle
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6 * 2;
  for (const s of sticks) {
    ctx.beginPath();
    polyPath(ctx, s.poly);
    ctx.stroke();
  }
  ctx.restore();
  const order = [...sticks].sort((a, b) => Math.abs(b.t) - Math.abs(a.t));
  for (const s of order) {
    shape(ctx, (c) => polyPath(c, s.poly), {
      fill: SPAG, ink: 0.5, inkColor: SPAG_DK, shadow: SPAG_SH, shadowOffset: [-1.15, -0.25],
    });
    // shine down the lit side + pale fracture at the snapped end
    line(ctx, [[s.mid[0] * 0.55 - 0.7, -1], [s.mid[0] - 0.7, s.mid[1] + 1.2], [s.tip[0] - 0.5, s.tip[1] + 1.6]], 0.6, SPAG_HI, false, 0.8);
    shape(ctx, (c) => circlePath(c, s.tip[0], s.tip[1] + 0.9, 0.75), { fill: '#fff7d6', ink: 0, shadow: 'none' });
  }
  // overall bundle shading (right side)
  clipped(ctx, (c) => { for (const s of sticks) polyPath(c, s.poly); }, () => {
    ctx.fillStyle = rgba('#a8601c', 0.2);
    ctx.beginPath();
    ellipsePath(ctx, 10.5, -4, 5.6, 16);
    ctx.fill();
  });

  // twine belt with a bow
  shape(ctx, (c) => {
    c.moveTo(-6.3, -1.9);
    c.quadraticCurveTo(0, -0.2, 6.3, -2.1);
    c.lineTo(6.1, 1.3);
    c.quadraticCurveTo(0, 3.1, -6.1, 1.5);
    c.closePath();
  }, { fill: TWINE, ink: 1.1, shadowOffset: [-0.6, -0.9] });
  line(ctx, [[-5.7, -0.1], [0, 1.5], [5.7, -0.2]], 0.5, '#8f1a20', true, 0.8);
  const bx = 2.6, by = 0.8;
  shape(ctx, (c) => {
    c.moveTo(bx, by);
    c.bezierCurveTo(bx - 3.6, by - 3.4, bx - 4.4, by + 1.6, bx, by);
    c.moveTo(bx, by);
    c.bezierCurveTo(bx + 3.8, by - 3.6, bx + 4.6, by + 1.4, bx, by);
  }, { fill: TWINE, ink: 0.9, shadowOffset: [-0.5, -0.6] });
  inkLine(ctx, [[bx - 0.2, by + 0.4], [bx - 1.4, by + 3.0 + sw * 0.4], [bx - 0.8, by + 4.4]], 0.8, TWINE, true, 0.6);
  inkLine(ctx, [[bx + 0.2, by + 0.4], [bx + 1.6, by + 3.2 - sw * 0.4], [bx + 2.6, by + 4.2]], 0.8, TWINE, true, 0.6);
  ball(ctx, bx, by, 1.05, TWINE, '#9e1d24', 0.8, 0.4);

  // face
  eyes(ctx, { x: 1.4, y: -8.0, r: 2.6, sp: 5.7, look: [0.32, 0.12], brow: { ang: 0.52, th: 1.4, dy: 1.25 } });
  mouth(ctx, 1.9, -3.6, 6.2, 'snarl', { teeth: true, open: 1.25 });

  // near arm brandishing a snapped stick like a little sword
  const hx = 9.4 + sw * 0.6, hy = -2.4 - Math.cos(ph) * 0.4;
  shape(ctx, (c) => polyPath(c, [[hx - 1.6, hy + 1.6], [hx - 0.6, hy + 2.4], [hx + 5.6, hy - 5.0], [hx + 5.9, hy - 7.6], [hx + 4.4, hy - 6.2]]), {
    fill: SPAG, ink: 0.9, shadow: SPAG_SH, shadowOffset: [-0.6, -0.2],
  });
  gloveArm(ctx, 5.4, -1.2, hx, hy, 2.0, 1.5, 0.25);
}

reg('spezzato', 36, 37, 17, 24, drawSpezzato);

// ===========================================================================
// 2. SPRUZZATORE ROSSO — r14. Angry red squeeze bottle, pointy nozzle hat.
// ===========================================================================

const KET = '#dd2a22';
const KET_SH = '#a3141c';
const KET_DROP = '#c81a17';
const CAP = '#fbf6ea';
const CAP_SH = '#c9cede';

function bottlePath(c: Ctx) {
  c.moveTo(-5.4, -17.2);
  c.quadraticCurveTo(-5.8, -14.6, -9.4, -12.8);
  c.quadraticCurveTo(-11.6, -11.4, -11.6, -7.6);
  c.quadraticCurveTo(-12.4, -1, -11.2, 6);
  c.quadraticCurveTo(-11, 9.8, -6.6, 10);
  c.lineTo(6.6, 10);
  c.quadraticCurveTo(11, 9.8, 11.2, 6);
  c.quadraticCurveTo(12.4, -1, 11.6, -7.6);
  c.quadraticCurveTo(11.6, -11.4, 9.4, -12.8);
  c.quadraticCurveTo(5.8, -14.6, 5.4, -17.2);
  c.closePath();
}

function drawKetchup(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  legs(ctx, 0, 4.6, f, { len: 5.6, spread: 9, thick: 3, color: '#7d1717', shoe: SHOE, stride: 3.6 });
  ctx.save();
  ctx.translate(0, -3.4);
  // far arm: shaking fist
  gloveArm(ctx, -10.5, -4.5, -16, -11 + [0, -1.4, 0, -0.8][f], 2.6, 1.9, -0.2);

  // bottle body
  shape(ctx, bottlePath, {
    fill: KET, shadow: KET_SH, ink: 2, shadowOffset: [-3.2, -1.6],
    gloss: [
      { x: -7.6, y: -3, rx: 1.5, ry: 7.4, rot: 0.03, alpha: 0.5 },
      { x: -8.4, y: -10, rx: 1.3, ry: 1.0, alpha: 0.85 },
    ],
  });
  line(ctx, [[8.2, -6], [9.4, -1.5], [8.6, 3]], 0.7, '#8e0f16', true, 0.6);

  // label band with a little tomato
  clipped(ctx, bottlePath, () => {
    ctx.fillStyle = '#f6efdc';
    ctx.beginPath();
    ctx.moveTo(-14, 1.6);
    ctx.quadraticCurveTo(0, 3.6, 14, 1.6);
    ctx.lineTo(14, 7.6);
    ctx.quadraticCurveTo(0, 9.6, -14, 7.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#c9b89a', 0.9);
    ctx.beginPath();
    ctx.moveTo(6.5, 1.6);
    ctx.quadraticCurveTo(10, 2.4, 14, 1.6);
    ctx.lineTo(14, 7.6);
    ctx.quadraticCurveTo(10, 8.6, 6.8, 8.8);
    ctx.closePath();
    ctx.fill();
    line(ctx, [[-14, 1.6], [0, 3.6], [14, 1.6]], 0.8, '#8e0f16', true, 0.7);
    line(ctx, [[-14, 7.6], [0, 9.6], [14, 7.6]], 0.8, '#8e0f16', true, 0.7);
  });
  ball(ctx, 1.4, 5.6, 1.9, '#e2332b', KET_SH, 0.7, 0.6);
  shape(ctx, (c) => {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * TAU;
      c.moveTo(1.4, 4.1);
      c.lineTo(1.4 + Math.cos(a) * 1.6, 4.1 + Math.sin(a) * 0.9);
    }
  }, { fill: '#3f9a3a', ink: 0 });
  line(ctx, [[0.2, 3.9], [1.4, 3.7], [2.6, 3.9]], 0.7, '#3f9a3a', false);
  line(ctx, [[1.4, 3.8], [1.6, 2.9]], 0.6, '#2c6e2a', false);

  // nozzle cap: screw ring + bent pointy hat
  const tip: Pt = [4.6 + sw * 0.2, -32.2];
  group(ctx, [
    {
      build: (c) => roundRectPath(c, -6.8, -21.2, 13.6, 4.6, 1.4),
      style: { fill: CAP, shadow: CAP_SH, shadowOffset: [-1.6, -1] },
    },
    {
      build: (c) => {
        c.moveTo(-5.4, -20.6);
        c.quadraticCurveTo(-3.4, -26.6, 0.8, -29.4);
        c.quadraticCurveTo(2.8, -30.8, tip[0], tip[1]);
        c.quadraticCurveTo(4.0, -29.2, 3.7, -27.8);
        c.quadraticCurveTo(4.4, -24.2, 5.4, -20.6);
        c.closePath();
      },
      style: { fill: CAP, shadow: CAP_SH, shadowOffset: [-1.8, -0.8], gloss: [{ x: -2.2, y: -24.2, rx: 0.8, ry: 2.4, rot: 0.5, alpha: 0.9 }] },
    },
  ], 1.8);
  for (let i = -2; i <= 2; i++) line(ctx, [[i * 2.4, -20.4], [i * 2.4, -17.4]], 0.55, '#aeb4c6', false, 0.9);
  // ketchup smeared on the nozzle tip + hanging drop (animated)
  shape(ctx, (c) => {
    c.moveTo(1.7, -29.8);
    c.quadraticCurveTo(3.5, -31.6, tip[0] + 0.3, tip[1] - 0.2);
    c.quadraticCurveTo(4.9, -29.6, 4.0, -27.6);
    c.quadraticCurveTo(3.2, -26.4, 2.7, -27.8);
    c.quadraticCurveTo(2.1, -28.8, 1.7, -29.8);
    c.closePath();
  }, { fill: KET_DROP, ink: 0.9, shadow: 'none', gloss: [{ x: 3.5, y: -30.6, rx: 0.5, ry: 0.35, alpha: 0.8 }] });
  const dl = [3.2, 4.4, 5.8, 2.4][f];
  shape(ctx, (c) => dropPath(c, 3.25, -28.0, dl, 2.1), { fill: KET_DROP, ink: 0.9, shadow: 'none', gloss: [{ x: 2.8, y: -28.0 + dl - 1.5, rx: 0.4, ry: 0.3, alpha: 0.9 }] });
  if (f === 3) shape(ctx, (c) => circlePath(c, 3.5, -21.2, 0.95), { fill: KET_DROP, ink: 0.8, shadow: 'none' });

  // face
  eyes(ctx, { x: 1.8, y: -7.2, r: 3.15, sp: 7.6, look: [0.3, 0.12], brow: { ang: 0.48, th: 1.6 } });
  mouth(ctx, 2.4, -1.6, 7.6, 'snarl', { teeth: true });

  // near arm, clenched fist
  gloveArm(ctx, 10.8, -0.5, 16.2 + sw * 0.8, 4.2 - Math.abs(sw) * 0.6, 2.6, 1.9, 0.3);
  ctx.restore();
}

reg('ketchup', 46, 55, 23, 40, drawKetchup);

// ===========================================================================
// 3. PANNA INVASORA — r15. Whipped-cream dollop wearing a milk-carton helmet.
// ===========================================================================

const CREAM = '#fff7e6';
const CREAM_SH = '#efdcbc';
const CREAM_LN = '#d3b484';
const CARTON_B = '#3f7fd6';
const CARTON_W = '#f4f7fb';

/** Scalloped tier of piped cream (ellipse with star-tip ridges). */
function tierPath(c: Ctx, cx: number, cy: number, rx: number, ry: number, bumps: number, amp: number, phase = 0) {
  const pts: Pt[] = [];
  const n = bumps * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + Math.cos(a * bumps + phase) * amp * (Math.sin(a) < 0.2 ? 1 : 0.35);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * (1 + (k - 1) * 0.4)]);
  }
  smoothPath(c, pts, true, 0.5);
}

function drawPanna(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const wob = Math.sin(ph);
  const sx = 1 + wob * 0.035, sy = 1 - wob * 0.035;
  const Y = (y: number) => 12 + (y - 12) * sy;

  // glossy puddle (it leaves them everywhere)
  shape(ctx, (c) => {
    c.moveTo(-20.4, 12.8);
    c.bezierCurveTo(-21.4, 9.8, -12, 9.4, 0, 9.8);
    c.bezierCurveTo(12, 9.2, 22.2, 9.8, 20.6, 13.0);
    c.bezierCurveTo(19.4, 16.0, 6, 16.0, 0, 15.8);
    c.bezierCurveTo(-8, 16.2, -19.6, 15.8, -20.4, 12.8);
    c.closePath();
  }, { fill: '#fff3dc', ink: 1.5, shadow: CREAM_SH, shadowOffset: [-1.0, -1.4], gloss: [{ x: -14.6, y: 12.4, rx: 3.2, ry: 0.7, alpha: 0.95 }, { x: 15.4, y: 12.0, rx: 1.6, ry: 0.5, alpha: 0.8 }] });

  // three piped tiers, bottom → top; drips belong to the bottom tier's silhouette
  const dd = [0, 1.0, 1.6, 0.6][f];
  const drips: [number, number, number][] = [[-10.5, 5.6 + dd * 0.5, 4.6], [-0.5, 6.6 + dd, 5.2], [9.5, 5.0 + dd * 0.7, 4.2]];
  const t1 = (c: Ctx) => tierPath(c, 0, Y(7.6), 16.6 * sx, 5.6 * sy, 9, 0.05, 0.4);
  const dr = (c: Ctx) => { for (const [x, l, w] of drips) { c.moveTo(x * sx, Y(8.4)); dropPath(c, x * sx, Y(8.4), l, w); } };
  const t2 = (c: Ctx) => tierPath(c, 0.4 * sx, Y(-1.2), 14.2 * sx, 7.6 * sy, 8, 0.05, 1.1);
  const t3 = (c: Ctx) => tierPath(c, 0.6 * sx, Y(-10.2), 9.8 * sx, 4.6 * sy, 7, 0.07, 0.2);
  const tierStyle = (gx: number, gy: number): ShapeStyle => ({
    fill: CREAM, shadow: CREAM_SH, shadowOffset: [-2.6, -2.2],
    gloss: [{ x: gx, y: gy, rx: 2.2, ry: 1.4, rot: -0.4, alpha: 0.95 }],
  });
  // unified outline first
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  for (const b of [dr, t1, t2, t3]) { ctx.beginPath(); b(ctx); ctx.stroke(); }
  ctx.restore();
  shape(ctx, dr, { fill: CREAM, ink: 0, shadow: CREAM_SH, shadowOffset: [-1.2, -0.6] });
  for (const [x, l] of drips) glint(ctx, x * sx - 0.9, Y(8.4) + l - 2.0, 0.7, 0.5, -0.5, 0.9);
  const fluting = (cx: number, cy: number, rx: number, ry: number, n: number) => {
    for (let i = 1; i < n; i++) {
      const u = (i / n) * 2 - 1;
      const x0 = cx + u * rx * 0.95, x1 = cx + u * rx * 0.78;
      line(ctx, [[x0, cy + ry * 0.75 * Math.sqrt(1 - u * u * 0.6)], [(x0 + x1) / 2 + u * 0.6, cy], [x1, cy - ry * 0.7 * Math.sqrt(1 - u * u * 0.7)]], 0.5, CREAM_LN, true, 0.42);
    }
  };
  shape(ctx, t1, { ...tierStyle(-12 * sx, Y(5.6)), ink: 0 });
  fluting(0, Y(7.4), 16 * sx, 5 * sy, 9);
  // soft contact shadow of tier 2 onto tier 1
  clipped(ctx, t1, () => {
    ctx.fillStyle = rgba('#d9b98a', 0.4);
    ctx.beginPath();
    ellipsePath(ctx, 1.8 * sx, Y(0.2), 14.2 * sx, 7.6 * sy);
    ctx.fill();
  });
  shape(ctx, t2, { ...tierStyle(-9 * sx, Y(-4.6)), ink: 1.2, inkColor: '#b89466' });
  fluting(0.4 * sx, Y(-1.0), 13.4 * sx, 6.6 * sy, 8);
  clipped(ctx, t2, () => {
    ctx.fillStyle = rgba('#d9b98a', 0.4);
    ctx.beginPath();
    ellipsePath(ctx, 1.8 * sx, Y(-9.2), 9.8 * sx, 4.6 * sy);
    ctx.fill();
  });
  shape(ctx, t3, { ...tierStyle(-5.6 * sx, Y(-12), ), ink: 1.1, inkColor: '#b89466' });

  // face: smug-angry
  const fx = 1.8 * sx, fy = Y(-2.4);
  eyes(ctx, { x: fx, y: fy, r: 3.2, sp: 7.8, look: [0.32, 0.2], lid: 'half', pupil: 0.56, brow: { ang: 0.42, th: 1.55, dy: 1.2, tiltR: 0.12 } });
  const smirk = (c: Ctx) => {
    c.moveTo(fx - 3.6, fy + 5.0);
    c.quadraticCurveTo(fx + 1, fy + 6.0, fx + 5.0, fy + 3.4);
    c.quadraticCurveTo(fx + 4.8, fy + 7.6, fx + 1.4, fy + 7.4);
    c.quadraticCurveTo(fx - 1.6, fy + 7.0, fx - 3.6, fy + 5.0);
    c.closePath();
  };
  shape(ctx, smirk, { fill: '#5b1320', ink: 1, shadow: 'none' });
  clipped(ctx, smirk, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(fx - 3.6, fy + 4.4);
    ctx.quadraticCurveTo(fx + 1, fy + 5.6, fx + 5.2, fy + 3.0);
    ctx.lineTo(fx + 5.2, fy + 5.2);
    ctx.quadraticCurveTo(fx + 1, fy + 6.8, fx - 3.6, fy + 5.7);
    ctx.closePath();
    ctx.fill();
    for (const tx of [-0.8, 1.4, 3.4]) line(ctx, [[fx + tx, fy + 4.6], [fx + tx + 0.1, fy + 6.4]], 0.35, '#b08a7a');
  });
  line(ctx, [[fx + 4.8, fy + 3.5], [fx + 5.8, fy + 2.6]], 0.9, INK, false);

  // milk-carton helmet (gable top), jauntily tilted
  ctx.save();
  ctx.translate(0.6 * sx, Y(-12.4));
  ctx.rotate(0.12 + wob * 0.03);
  const front: Pt[] = [[-7.4, 2.2], [-7.6, -7.2], [5.6, -7.6], [5.8, 1.6]];
  const side: Pt[] = [[5.8, 1.6], [5.6, -7.6], [9.6, -9.8], [9.8, -0.6]];
  const gable: Pt[] = [[-7.6, -7.2], [-1.0, -13.2], [5.6, -7.6]];
  const roof: Pt[] = [[-1.0, -13.2], [3.0, -15.4], [9.6, -9.8], [5.6, -7.6]];
  const fin: Pt[] = [[-1.4, -13.0], [-1.0, -15.4], [3.0, -17.6], [3.4, -15.2]];
  group(ctx, [
    { build: (c) => polyPath(c, fin), style: { fill: CARTON_W, shadow: 'none' } },
    { build: (c) => polyPath(c, roof), style: { fill: CARTON_B, shadow: 'none' } },
    { build: (c) => polyPath(c, side), style: { fill: '#c7d3e4', shadow: 'none' } },
    { build: (c) => polyPath(c, front), style: { fill: CARTON_W, shadow: 'none' } },
    { build: (c) => polyPath(c, gable), style: { fill: CARTON_B, shadow: 'none' } },
  ], 1.8);
  line(ctx, [[5.7, 1.6], [5.6, -7.6]], 0.6, '#8ea2c2', false);
  line(ctx, [[-1.0, -13.2], [5.6, -7.6]], 0.6, '#244f94', false);
  line(ctx, [[-1.2, -13.1], [3.2, -15.3]], 0.6, '#9fb0cc', false);
  shape(ctx, (c) => polyPath(c, [[-7.45, -1.4], [5.75, -1.9], [5.8, 1.6], [-7.4, 2.2]]), { fill: CARTON_B, ink: 0, shadow: 'none' });
  shape(ctx, (c) => polyPath(c, [[5.75, -1.9], [9.75, -3.6], [9.8, -0.6], [5.8, 1.6]]), { fill: '#2c5fa8', ink: 0, shadow: 'none' });
  line(ctx, [[-7.45, -1.4], [5.75, -1.9], [9.75, -3.6]], 0.55, '#244f94', false);
  shape(ctx, (c) => {
    c.moveTo(-1, -6.4);
    c.quadraticCurveTo(1.6, -3.6, 1.2, -2.8);
    c.arc(-1, -3.0, 2.0, 0.1, Math.PI - 0.1, false);
    c.quadraticCurveTo(-3.6, -3.6, -1, -6.4);
    c.closePath();
  }, { fill: '#7fb2f0', ink: 0.6, inkColor: '#244f94', shadow: 'none', gloss: [{ x: -1.8, y: -3.6, rx: 0.4, ry: 0.6, alpha: 0.9 }] });
  line(ctx, [[-6.4, -6.2], [-6.5, -2.4]], 0.9, '#ffffff', false, 0.7);
  ctx.restore();
}

reg('panna', 48, 56, 24, 36, drawPanna);

// ===========================================================================
// 4. FORBICI FURIOSE — r13. Kitchen scissors on finger-loop feet; the blades
//    snap like a beak (open → closed over the cycle, the legs spread with them).
// ===========================================================================

const STEEL = '#cfd8e4';
const STEEL_SH = '#8592a8';
const STEEL_DK = '#5d6a80';
const HANDLE = '#d8343a';
const HANDLE_SH = '#9e1b25';
const RUBBER = '#2b2630';

function bladePoly(px: number, py: number, ang: number, side: number, L: number): Pt[] {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const nx = -uy * side, ny = ux * side;
  const P = (u: number, v: number): Pt => [px + ux * u + nx * v, py + uy * u + ny * v];
  return [P(-2.5, -1.6), P(L * 0.1, -1.6), P(L * 0.6, -1.15), P(L, 0.0), P(L * 0.86, 2.0), P(L * 0.55, 4.4), P(L * 0.2, 5.6), P(-2.2, 5.0)];
}

function handlePath(c: Ctx, px: number, py: number, ang: number, D: number, rl: number, rw: number) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const nx = -uy, ny = ux;
  const cx = px + ux * D, cy = py + uy * D;
  const w0 = 2.8, w1 = 2.2;
  c.moveTo(px + nx * w0, py + ny * w0);
  c.lineTo(cx - ux * rl * 0.7 + nx * w1, cy - uy * rl * 0.7 + ny * w1);
  c.lineTo(cx - ux * rl * 0.7 - nx * w1, cy - uy * rl * 0.7 - ny * w1);
  c.lineTo(px - nx * w0, py - ny * w0);
  c.closePath();
  ellipsePath(c, cx, cy, rl, rw, ang);
}

function drawForbici(ctx: Ctx, f: number) {
  const open = [0.34, 0.56, 0.34, 0.05][f];
  const bA = -0.7; // blade bisector: up and forward
  const hA = Math.PI / 2 + 0.2; // handle bisector: down to the floor
  const D = 12.0;
  const L = 20;
  // rigid halves: A (upper blade + front leg) turns by -open, B by +open
  const aBlade = bA - open, aHandle = hA - open;
  const bBlade = bA + open, bHandle = hA + open;
  const loops: [number, number, number][] = [[aHandle, 5.8, 4.6], [bHandle, 4.8, 4.0]];
  const px = 1.2;
  // put the lowest loop on the floor (y ≈ +12.6)
  let low = -99;
  for (const [ang, rl, rw] of loops) {
    const yy = D * Math.sin(ang) + Math.abs(Math.sin(ang)) * rl + Math.abs(Math.cos(ang)) * rw;
    low = Math.max(low, yy);
  }
  const py = 12.6 - low;

  const drawHandle = (ang: number, rl: number, rw: number) => {
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const cx = px + ux * D, cy = py + uy * D;
    shape(ctx, (c) => handlePath(c, px, py, ang, D, rl, rw), {
      fill: HANDLE, shadow: HANDLE_SH, ink: 2.0, shadowOffset: [-1.5, -1.4],
      gloss: [{ x: cx - rw * 0.5, y: cy - rl * 0.5, rx: rw * 0.3, ry: rl * 0.2, rot: -0.3, alpha: 0.6 }],
    });
    shape(ctx, (c) => ellipsePath(c, cx + 0.2, cy, rl * 0.56, rw * 0.5, ang), { fill: RUBBER, ink: 0.9, shadow: 'none' });
    shape(ctx, (c) => ellipsePath(c, cx + 0.4, cy + 0.2, rl * 0.36, rw * 0.28, ang), { fill: '#5b4a3f', ink: 0, shadow: 'none' });
  };
  const drawBlade = (ang: number, side: number) => {
    const poly = bladePoly(px, py, ang, side, L);
    shape(ctx, (c) => polyPath(c, poly), { fill: STEEL, shadow: STEEL_SH, ink: 2.0, shadowOffset: side < 0 ? [-1.2, -1.8] : [-1.8, -0.7] });
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const nx = -uy * side, ny = ux * side;
    const P = (u: number, v: number): Pt => [px + ux * u + nx * v, py + uy * u + ny * v];
    // ground bevel along the cutting edge + spine shading
    line(ctx, [P(3, -0.5), P(L * 0.6, -0.35), P(L * 0.93, -0.02)], 0.8, '#ffffff', true, 0.95);
    line(ctx, [P(4, 3.2), P(L * 0.5, 3.0), P(L * 0.8, 1.5)], 0.6, STEEL_DK, true, 0.5);
    // serrations on the cutting edge
    const pts: Pt[] = [];
    for (let i = 0; i <= 10; i++) {
      const u = 5 + i * 1.25;
      pts.push(P(u, -1.3 + (i % 2) * 0.75 + (u / L) * 1.0));
    }
    line(ctx, pts, 0.4, STEEL_DK, false, 0.75);
  };

  // jaw interior between the open blades (reads as a snapping beak)
  if (open > 0.1) {
    const mp = (ang: number, side: number, u: number): Pt => {
      const ux = Math.cos(ang), uy = Math.sin(ang);
      return [px + ux * u - uy * side * -1.3, py + uy * u + ux * side * -1.3];
    };
    const m1 = mp(aBlade, -1, 15), m2 = mp(bBlade, 1, 15);
    shape(ctx, (c) => {
      c.moveTo(px, py);
      c.lineTo(m1[0], m1[1]);
      c.quadraticCurveTo((m1[0] + m2[0]) / 2 - 1.2, (m1[1] + m2[1]) / 2 - 1.0, m2[0], m2[1]);
      c.closePath();
    }, { fill: '#5b1320', ink: 1.2, shadow: 'none' });
    const tg = mp(bBlade, 1, 8);
    shape(ctx, (c) => ellipsePath(c, tg[0] - 0.6, tg[1] - 1.4, 3.0, 1.6, bA + 0.3), { fill: '#e8616e', ink: 0, shadow: 'none' });
  }
  drawHandle(bHandle, 4.8, 4.0); // back leg, small loop
  drawBlade(bBlade, 1);
  drawHandle(aHandle, 5.8, 4.6); // front leg, big loop
  drawBlade(aBlade, -1);

  // pivot hub = the head
  const hx = px - 0.2, hy = py + 0.6;
  shape(ctx, (c) => circlePath(c, hx, hy, 6.7), {
    fill: STEEL, shadow: STEEL_SH, ink: 2.0, shadowOffset: [-1.8, -1.9],
    gloss: [{ x: hx - 2.6, y: hy - 2.8, rx: 1.5, ry: 0.85, rot: -0.6, alpha: 0.9 }],
  });
  // pivot screw (between the eyes, under the brow)
  shape(ctx, (c) => circlePath(c, hx - 3.4, hy + 3.3, 1.15), { fill: '#a7b2c4', ink: 0.7, shadow: 'none' });
  line(ctx, [[hx - 4.1, hy + 3.8], [hx - 2.7, hy + 2.8]], 0.45, STEEL_DK);
  // clenched steel grimace
  line(ctx, [[hx - 0.6, hy + 3.4], [hx + 1.6, hy + 3.0], [hx + 3.8, hy + 3.4]], 0.9, INK, true);
  line(ctx, [[hx + 3.6, hy + 3.4], [hx + 4.4, hy + 2.6]], 0.7, INK, false);
  eyes(ctx, { x: hx + 0.6, y: hy - 1.1, r: 2.85, sp: 5.6, look: [0.45, -0.15], brow: { ang: 0.62, th: 1.6, dy: 1.2 } });
  // sharp sparkle on the upper blade tip
  const tA: Pt = [px + Math.cos(aBlade) * L, py + Math.sin(aBlade) * L];
  sparkle(ctx, tA[0] - 0.2, tA[1] + 0.6, f === 3 ? 3.4 : 2.2, 0.95);
}

reg('forbici', 42, 49, 17, 33, drawForbici);

// ===========================================================================
// 5/6. PASTA SCOTTA (r16) + PASTINA SCOTTA (r10). A saggy, swollen, glossy
//      blob of overcooked noodles. Limp strands droop off it; it jiggles.
// ===========================================================================

const SCOT = '#f2dc95';
const SCOT_SH = '#d9b064';
const SCOT_DK = '#b98a3c';
const SCOT_HI = '#fff8d8';

function scottaOutline(j: number): Pt[] {
  const sx = 1 + j * 0.06, sy = 1 - j * 0.07;
  const base: Pt[] = [
    [-17.2, 14.6], [-20.8, 11.4], [-21.2, 6.4], [-19.4, 1.2], [-16.6, -3.8], [-12.6, -8.0], [-7.2, -10.9],
    [0, -12.0], [7.2, -11.0], [12.8, -8.0], [16.8, -3.4], [19.8, 1.8], [21.4, 7.2], [20.8, 12.0],
    [17.4, 14.8], [6.0, 15.6], [-6.0, 15.6],
  ];
  return base.map(([x, y]) => [x * sx, 15.2 + (y - 15.2) * sy] as Pt);
}

function drawScotta(ctx: Ctx, f: number, mini: boolean) {
  const k = mini ? 0.62 : 1;
  ctx.save();
  ctx.scale(k, k);
  const ink = mini ? 2.6 : 2.1; // in local (scaled) units
  const j = [0, 1, 0, -1][f];
  const sx = 1 + j * 0.06, sy = 1 - j * 0.07;
  const T = (x: number, y: number): Pt => [x * sx, 15.2 + (y - 15.2) * sy];
  const TT = (pts: Pt[]) => pts.map(([x, y]) => T(x, y));
  const outline = scottaOutline(j);
  const body = (c: Ctx) => smoothPath(c, outline, true, 0.5);
  const sway = [0, 1, 0, -1][f];

  const noodle = (pts: Pt[], w = 3.4) => {
    inkLine(ctx, pts, w, SCOT, true, ink * 0.72);
    line(ctx, pts, w * 0.45, SCOT_SH, true, 0.25);
    line(ctx, pts.map(([x, y]) => [x - 0.55, y - 0.6] as Pt), w * 0.3, SCOT_HI, true, 0.95);
  };
  // limp noodles sliding off the sides + a fringe spilling onto the floor (behind the body)
  noodle(TT([[-16.4, 0], [-21.6, 3.6], [-23.2 - sway * 0.6, 9.4], [-22.4 - sway, 14.2], [-19.6 - sway * 0.6, 15.8]]));
  noodle(TT([[16.8, -2.4], [21.6, 1.2], [23.4 + sway * 0.6, 7.0], [22.6 + sway, 12.8], [20.2 + sway * 0.6, 15.2]]));
  const fringe: [number, number, number][] = mini
    ? [[-12, -1, 3.0], [-3, 1, 3.6], [6, -1, 3.2], [14, 1, 2.6]]
    : [[-15, -1, 3.0], [-9, 1, 4.0], [-2.5, -1, 3.4], [4, 1, 4.2], [10.5, -1, 3.2], [16, 1, 2.6]];
  for (const [x, dir, len] of fringe) {
    const w = sway * 0.4 * dir;
    noodle(TT([[x, 12.4], [x + dir * 0.8 + w, 14.6 + len * 0.45], [x + dir * 2.2 + w, 15.2 + len], [x + dir * 3.6 + w * 1.4, 15.0 + len * 0.9]]), 3.0);
  }

  // the mush
  shape(ctx, body, { fill: SCOT, ink, shadow: 'none' });
  // embossed swollen strands framing the face (none across the face itself)
  const strands: Pt[][] = mini
    ? [
      [[-19, 11], [-12, 13.2], [-5, 11.6], [2, 13.6], [9, 11.8], [15, 13.4], [21, 10.8]],
      [[-18, 3.6], [-14.2, -1.6], [-12.6, -7.8]],
      [[18.6, 4.0], [15.2, -1.2], [13.4, -7.6]],
      [[-9, -10.4], [-2, -8.4], [5, -10.0], [11, -8.0]],
    ]
    : [
      [[-20.4, 11.6], [-13, 13.6], [-5.4, 11.8], [2, 13.8], [9.4, 11.8], [16, 13.6], [21.4, 11]],
      [[-21, 6.8], [-16.4, 9.2], [-12.4, 6.4], [-9.8, 9.4]],
      [[21.2, 7.0], [16.8, 9.4], [13.2, 6.6], [10.8, 9.6]],
      [[-19.4, 1.4], [-14.4, -1.4], [-13.2, -6.4], [-9.0, -9.6]],
      [[-17.0, -3.0], [-11.8, -0.8], [-11.0, 3.6], [-14.6, 7.6]],
      [[19.6, 2.0], [15.4, -1.6], [14.2, -6.4], [9.6, -9.6]],
      [[17.2, -3.0], [13.2, 0.0], [13.8, 4.4], [18.0, 7.6]],
      [[-7.6, -10.8], [-2.0, -8.8], [3.6, -10.2], [9.4, -8.6]],
      [[-3.4, -12.2], [1.4, -10.8], [6.6, -11.6]],
    ];
  clipped(ctx, body, () => {
    for (const st of strands) {
      const p = TT(st);
      line(ctx, p, 4.6, SCOT_DK, true, 0.55);
      line(ctx, p, 3.1, SCOT, true);
      line(ctx, p.map(([x, y]) => [x - 0.6, y - 0.65] as Pt), 1.0, SCOT_HI, true, 0.95);
    }
  });
  // cel shading over the texture + wet gloss
  shadeOver(ctx, body, SCOT_SH, [-3.8 * sx, -3.2], 0.62);
  shadeOver(ctx, body, SCOT_DK, [-1.4, -1.3], 0.35);
  clipped(ctx, body, () => {
    glint(ctx, -10.5 * sx, T(0, -4.6)[1], 3.4, 1.7, -0.7, 0.85);
    glint(ctx, -15.0 * sx, T(0, 5)[1], 1.2, 2.4, 0.2, 0.7);
    glint(ctx, 3.0 * sx, T(0, -9.6)[1], 1.6, 0.7, -0.2, 0.6);
  });

  // face: tired-grumpy (mini: furious)
  const fx = 2.2 * sx, fy = T(0, mini ? -0.6 : -1.4)[1];
  const er = mini ? 4.4 : 3.9;
  const sp = mini ? 9.6 : 9.2;
  if (mini) {
    eyes(ctx, { x: fx, y: fy, r: er, sp, look: [0.3, 0.12], lid: 'angry', pupil: 0.5, brow: { ang: 0.62, th: 2.1, dy: 1.25 } });
    mouth(ctx, fx + 0.6, fy + 7.4, 9.6, 'snarl', { teeth: true, open: 1.3 });
  } else {
    eyes(ctx, { x: fx, y: fy, r: er, sp, look: [0.28, 0.32], lid: 'half', pupil: 0.5, brow: { ang: 0.42, th: 1.9, dy: 1.15 } });
    for (const ex of [fx - sp / 2, fx + sp / 2]) {
      line(ctx, [[ex - er * 0.8, fy + er * 1.35], [ex, fy + er * 1.75], [ex + er * 0.8, fy + er * 1.3]], 0.8, SCOT_DK, true, 0.9);
    }
    const mx = fx + 0.8, my = fy + 9.6;
    const mp = (c: Ctx) => {
      c.moveTo(mx - 5.4, my + 1.8);
      c.quadraticCurveTo(mx - 0.4, my - 3.6, mx + 5.2, my + 1.4);
      c.quadraticCurveTo(mx + 0.2, my - 0.6, mx - 5.4, my + 1.8);
      c.closePath();
    };
    shape(ctx, mp, { fill: '#5b1320', ink: 1.3, shadow: 'none' });
    clipped(ctx, mp, () => {
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.moveTo(mx - 6, my - 3.8);
      ctx.lineTo(mx + 6, my - 3.8);
      ctx.lineTo(mx + 6, my - 0.2);
      ctx.quadraticCurveTo(mx, my - 2.1, mx - 6, my + 0.2);
      ctx.closePath();
      ctx.fill();
      for (const tx of [-2, 0.2, 2.4]) line(ctx, [[mx + tx, my - 3], [mx + tx, my - 0.6]], 0.35, '#b08a7a');
    });
    const dl = [3.0, 3.8, 4.8, 3.4][f];
    shape(ctx, (c) => dropPath(c, mx - 4.6, my + 1.2, dl, 2.0), { fill: '#fbf1c8', ink: 0.8, shadow: 'none', gloss: [{ x: mx - 5.0, y: my + dl - 0.6, rx: 0.45, ry: 0.35, alpha: 0.9 }] });
  }

  // lumpy noodle loops piled on top + a wilted tuft flopping over
  const flop = [0, 0.6, 0, -0.6][f];
  const loops: Pt[][] = [
    [[-13.6, -5.6], [-13.4, -10.2], [-8.6, -12.6], [-5.2, -10.4]],
    [[-5.6, -11.2], [-2.2, -14.4], [3.2, -14.2], [6.0, -11.0]],
    [[5.4, -11.2], [9.6, -12.6], [13.8, -9.6], [14.6, -5.0]],
  ];
  for (const lp of loops) {
    const p = TT(lp);
    line(ctx, p, 3.8 + ink * 1.44, INK, true);
  }
  for (const lp of loops) {
    const p = TT(lp);
    line(ctx, p, 3.8, SCOT, true);
    line(ctx, p.map(([x, y]) => [x + 0.5, y + 0.6] as Pt), 1.2, SCOT_SH, true, 0.45);
    line(ctx, p.map(([x, y]) => [x - 0.5, y - 0.7] as Pt), 1.1, SCOT_HI, true, 0.95);
  }
  const tuft = TT([[-0.6, -13.6], [0.6, -18.4], [4.4, -19.6 + flop * 0.4], [7.4 + flop, -17.4], [8.2 + flop * 1.4, -14.8]]);
  inkLine(ctx, tuft, 3.0, SCOT, true, ink * 0.72);
  line(ctx, tuft.map(([x, y]) => [x - 0.45, y - 0.6] as Pt), 0.9, SCOT_HI, true, 0.95);
  ctx.restore();
}

reg('scotta', 62, 52, 31, 27, (ctx, f) => drawScotta(ctx, f, false));
reg('scotta_mini', 42, 34, 21, 18, (ctx, f) => drawScotta(ctx, f, true));

// ===========================================================================
// 7. CIPOLLA CLANDESTINA — r15. A purple onion travelling incognito:
//    popped trench-coat collar, black shades, a sprout, peeling papery skin.
// ===========================================================================

const ONION = '#a8336f';
const ONION_SH = '#741d4e';
const ONION_HI = '#dc7fb0';
const ONION_LN = '#651640';
const PAPER = '#ecc4d6';
const PAPER_SH = '#c48aa6';
const COAT = '#c9a467';
const COAT_SH = '#98743f';
const COAT_DK = '#73552b';
const SHADES = '#1d1a22';
const SPROUT = '#6dbb45';

function onionPath(c: Ctx) {
  c.moveTo(0.8, -25);
  c.bezierCurveTo(3.4, -20.6, 14.2, -19.4, 14.2, -8);
  c.bezierCurveTo(14.2, 1.8, 7.6, 6.2, 0, 6.2);
  c.bezierCurveTo(-7.6, 6.2, -14.2, 1.8, -14.2, -8);
  c.bezierCurveTo(-14.2, -19.4, -1.8, -20.6, 0.8, -25);
  c.closePath();
}

function leaf(ctx: Ctx, pts: Pt[], widths: number[], fill: string, ink = 1.1) {
  shape(ctx, (c) => smoothPath(c, ribbon(pts, widths), true, 0.4), { fill, ink, shadow: shade(fill, 0.3), shadowOffset: [-0.7, -0.7] });
}

function drawCipolla(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  legs(ctx, 0.6, 9.2, f, { len: 3.4, spread: 8, thick: 3.1, color: '#3b3340', shoe: SHOE, stride: 3.2 });

  // sprouts + dry papery neck
  leaf(ctx, [[0.4, -23.6], [2.0, -28.4], [5.6 + sw * 0.3, -31.6]], [2.6, 1.9, 0.3], SPROUT);
  leaf(ctx, [[0.2, -23.6], [-1.6, -27.4], [-5.2 - sw * 0.3, -28.6]], [2.2, 1.6, 0.3], '#5fae3c');
  shape(ctx, (c) => polyPath(c, [[-1.8, -22.6], [-0.8, -26.4], [0.4, -25.2], [1.2, -27.0], [2.0, -25.0], [3.2, -22.4]]), { fill: PAPER, ink: 1.1, shadow: PAPER_SH, shadowOffset: [-0.6, -0.4] });

  // the bulb
  shape(ctx, onionPath, {
    fill: ONION, shadow: ONION_SH, ink: 2.1, shadowOffset: [-3.4, -2.8],
    gloss: [{ x: -7, y: -15.5, rx: 3.6, ry: 1.9, rot: -0.65, alpha: 0.4 }],
  });
  clipped(ctx, onionPath, () => {
    for (const kk of [-0.8, -0.48, -0.16, 0.18, 0.5, 0.82]) {
      const x = 14.2 * kk * 1.22;
      const p = (c: Ctx, dx: number) => {
        c.moveTo(0.8, -25);
        c.bezierCurveTo(x + dx, -17, x + dx, 1, kk * 5 + dx, 6.2);
      };
      ctx.beginPath(); p(ctx, 0);
      ctx.lineWidth = 0.75; ctx.strokeStyle = rgba(ONION_LN, 0.6); ctx.stroke();
      ctx.beginPath(); p(ctx, -0.9);
      ctx.lineWidth = 0.6; ctx.strokeStyle = rgba(ONION_HI, 0.45); ctx.stroke();
    }
    // freshly exposed layer where the skin peeled
    ctx.fillStyle = rgba('#e894c0', 0.55);
    ctx.beginPath();
    ellipsePath(ctx, -10.6, -14.2, 3.4, 4.6, 0.6);
    ctx.fill();
  });
  // peeling papery outer skin, curling off the shoulder
  const flap = [-1.2, 0, 1.0, 0][f] * 0.4;
  shape(ctx, (c) => {
    c.moveTo(-9.0, -18.4);
    c.quadraticCurveTo(-14.8, -21.4 + flap, -18.6, -19.6 + flap);
    c.quadraticCurveTo(-16.4, -18.4, -16.2, -16.6);
    c.quadraticCurveTo(-15.6, -13.4, -13.8, -11.2);
    c.quadraticCurveTo(-12.4, -15.4, -9.0, -18.4);
    c.closePath();
  }, { fill: PAPER, ink: 1.2, shadow: PAPER_SH, shadowOffset: [-0.8, -0.8] });
  line(ctx, [[-10.6, -17.6], [-15.4, -18.8 + flap]], 0.5, PAPER_SH, true, 0.9);
  line(ctx, [[-12.4, -14.6], [-15.6, -16.6]], 0.5, PAPER_SH, true, 0.9);

  // sunglasses + brows + grim mouth
  const lensL = (c: Ctx) => {
    c.moveTo(-8.0, -14.2);
    c.lineTo(-0.9, -14.4);
    c.quadraticCurveTo(-0.5, -9.8, -3.4, -9.0);
    c.quadraticCurveTo(-7.4, -8.6, -8.0, -12.0);
    c.closePath();
  };
  const lensR = (c: Ctx) => {
    c.moveTo(1.4, -14.6);
    c.lineTo(10.8, -15.0);
    c.quadraticCurveTo(11.0, -10.0, 7.4, -9.0);
    c.quadraticCurveTo(2.2, -8.6, 1.4, -12.2);
    c.closePath();
  };
  line(ctx, [[-8, -13.4], [-12.6, -12.8]], 1.6, SHADES);
  line(ctx, [[-1.2, -13.6], [0.2, -14.4], [1.6, -13.8]], 1.6, SHADES, true);
  for (const lens of [lensL, lensR]) {
    shape(ctx, lens, { fill: SHADES, ink: 1.4, shadow: 'none' });
    clipped(ctx, lens, () => {
      ctx.fillStyle = rgba('#6a5c86', 0.55);
      ctx.beginPath();
      ctx.rect(-12, -11.6, 26, 4);
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-6.4, -10.2); ctx.lineTo(-3.6, -13.6);
      ctx.moveTo(3.4, -10.0); ctx.lineTo(6.4, -14.0);
      ctx.stroke();
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(-4.6, -9.6); ctx.lineTo(-2.4, -12.4);
      ctx.moveTo(5.8, -9.4); ctx.lineTo(8.2, -12.6);
      ctx.stroke();
    });
  }
  brow(ctx, -4.2, -16.9, 5.6, 0.36, 1.6);
  brow(ctx, 6.4, -17.3, 6.4, -0.36, 1.6);
  // clenched grimace
  const gm = (c: Ctx) => {
    c.moveTo(-0.4, -5.6);
    c.quadraticCurveTo(3.6, -7.0, 7.8, -6.0);
    c.quadraticCurveTo(7.6, -3.4, 3.6, -3.6);
    c.quadraticCurveTo(0.0, -3.6, -0.4, -5.6);
    c.closePath();
  };
  shape(ctx, gm, { fill: '#fff8ea', ink: 1.1, shadow: 'none' });
  line(ctx, [[-0.2, -4.7], [3.6, -5.2], [7.6, -4.7]], 0.5, '#9a6a6a', true);
  for (const tx of [1.6, 3.6, 5.6]) line(ctx, [[tx, -6.4], [tx, -3.8]], 0.4, '#9a6a6a');

  // trench coat (covers the lower half) + popped collar
  const coat = (c: Ctx) => {
    c.moveTo(-13.6, -5.2);
    c.quadraticCurveTo(-15.6, 2.2, -15.0, 10.6);
    c.quadraticCurveTo(0, 13.4, 15.2, 10.4);
    c.quadraticCurveTo(15.8, 2.0, 13.8, -5.8);
    c.lineTo(9.0, -3.2);
    c.lineTo(2.4, 1.8);
    c.lineTo(-0.4, 1.8);
    c.lineTo(-7.4, -2.8);
    c.closePath();
  };
  shape(ctx, coat, { fill: COAT, shadow: COAT_SH, ink: 2.1, shadowOffset: [-2.8, -1.6], gloss: [{ x: -10.5, y: 2.5, rx: 1.3, ry: 3.2, rot: 0.15, alpha: 0.35 }] });
  clipped(ctx, coat, () => {
    // belt
    ctx.fillStyle = COAT_DK;
    ctx.beginPath();
    ctx.moveTo(-16, 4.6); ctx.quadraticCurveTo(0, 6.4, 16, 4.4);
    ctx.lineTo(16, 6.8); ctx.quadraticCurveTo(0, 8.8, -16, 7.0);
    ctx.closePath();
    ctx.fill();
  });
  line(ctx, [[1.4, 7.6], [1.6, 11.8]], 0.8, COAT_DK, false, 0.9);
  shape(ctx, (c) => roundRectPath(c, -0.4, 4.5, 3.6, 3.2, 0.6), { fill: '#e8c46a', ink: 0.8, shadow: 'none' });
  shape(ctx, (c) => roundRectPath(c, 0.6, 5.4, 1.6, 1.4, 0.3), { fill: COAT_DK, ink: 0, shadow: 'none' });
  for (const [bx, by] of [[-5.2, 0.4], [6.8, 0.2], [-4.6, 3.0], [6.2, 2.8]] as Pt[]) {
    ball(ctx, bx, by, 0.85, '#5a3a22', '#3a2416', 0.6, 0.5);
  }
  // lapel folds
  line(ctx, [[-0.4, 1.8], [-5.4, -0.8], [-8.6, -4.4]], 0.7, COAT_DK, false, 0.8);
  line(ctx, [[2.4, 1.8], [7.4, -1.2], [10.2, -4.6]], 0.7, COAT_DK, false, 0.8);
  // popped collar wings framing the face
  const wingL = (c: Ctx) => {
    c.moveTo(-6.6, -3.0);
    c.lineTo(-14.2, -4.6);
    c.quadraticCurveTo(-16.4, -10, -16.6, -15.6);
    c.quadraticCurveTo(-12.4, -12.2, -10.4, -8.8);
    c.closePath();
  };
  const wingR = (c: Ctx) => {
    c.moveTo(8.4, -3.4);
    c.lineTo(14.6, -5.2);
    c.quadraticCurveTo(16.8, -10.6, 17.2, -16.0);
    c.quadraticCurveTo(13.0, -12.6, 11.0, -9.2);
    c.closePath();
  };
  shape(ctx, wingL, { fill: COAT, shadow: COAT_SH, ink: 1.8, shadowOffset: [-1.6, -0.6] });
  shape(ctx, wingR, { fill: COAT, shadow: COAT_SH, ink: 1.8, shadowOffset: [-1.2, -1.4] });
  line(ctx, [[-9.2, -5.4], [-14.6, -13.2]], 0.6, COAT_DK, true, 0.6);
  line(ctx, [[10.0, -5.8], [15.4, -13.6]], 0.6, COAT_DK, true, 0.6);
}

reg('cipolla', 44, 55, 22, 36, drawCipolla);

// ===========================================================================
// 8. AGLIO IN CAMICIA — r14. A smug garlic bulb in a crisp white shirt and
//    red tie, wagging a finger; green stink wisps rise around him.
// ===========================================================================

const GARLIC = '#f6eedd';
const GARLIC_SH = '#d9c4a3';
const GARLIC_ST = '#c48ab4';
const SHIRT = '#fbfbf6';
const SHIRT_SH = '#c3cadb';
const TIE = '#c8323b';
const STINK = '#a6d65a';

function stinkWisp(ctx: Ctx, x: number, y: number, len: number, phase: number, dir: number) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([x + Math.sin(phase + t * 5.2) * 1.5 * (0.4 + t) + dir * t * 2.2, y - t * len]);
  }
  line(ctx, pts, 2.8, '#3f7a2a', true, 0.32);
  line(ctx, pts, 1.5, STINK, true, 0.85);
}

function drawAglio(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  // stink wisps (behind)
  stinkWisp(ctx, -13.2, -11, 13, ph, -1);
  stinkWisp(ctx, 14.6, -12, 13, ph + 2, 1);
  stinkWisp(ctx, -9.4, -22, 7, ph + 4, -1);

  legs(ctx, 0, 8.0, f, { len: 3.9, spread: 7.4, thick: 2.8, color: '#3a3446', shoe: SHOE, stride: 3 });
  // far arm: fist on the hip, elbow out (smug)
  inkLine(ctx, [[-7.4, -0.4], [-12.4, 1.6], [-11.2, 5.6]], 2.9, '#dfe3ec', true, 1.1);
  ball(ctx, -10.4, 6.0, 2.0, GARLIC, GARLIC_SH, 1.0, 0.5);

  // shirt torso, tucked into trousers
  const torso = (c: Ctx) => {
    c.moveTo(-4.8, -2.6);
    c.quadraticCurveTo(-8.8, -2.4, -9.2, 0.6);
    c.lineTo(-8.8, 8.4);
    c.quadraticCurveTo(0, 9.8, 8.9, 8.2);
    c.lineTo(9.3, 0.4);
    c.quadraticCurveTo(8.8, -2.6, 4.8, -2.8);
    c.closePath();
  };
  shape(ctx, torso, { fill: SHIRT, shadow: SHIRT_SH, ink: 1.9, shadowOffset: [-2.6, -1.2], gloss: [{ x: -6, y: 1.4, rx: 1.0, ry: 2.4, alpha: 0.7 }] });
  clipped(ctx, torso, () => {
    ctx.fillStyle = '#3a3446';
    ctx.beginPath();
    ctx.moveTo(-10, 6.4); ctx.quadraticCurveTo(0, 7.8, 10, 6.2);
    ctx.lineTo(10, 12); ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();
  });
  line(ctx, [[-9, 6.5], [0, 7.9], [9.2, 6.3]], 0.8, INK, true, 0.8);
  // breast pocket with a pen
  line(ctx, [[-6.6, 1.0], [-3.2, 1.0], [-3.4, 4.2], [-6.4, 4.2], [-6.6, 1.0]], 0.5, '#9aa3b8', false);
  inkLine(ctx, [[-5.4, 1.2], [-5.0, -0.8]], 0.8, '#3f7fd6', false, 0.5);

  // garlic-bulb head: three cloves + papery stem
  shape(ctx, (c) => polyPath(c, [[-1.4, -23.2], [-0.8, -28.4], [0.0, -27.4], [0.6, -29.4], [1.4, -27.6], [2.2, -23.4]]), { fill: '#e8d6b0', ink: 1.1, shadow: '#c2a97c', shadowOffset: [-0.5, -0.3] });
  const cloveL = (c: Ctx) => ellipsePath(c, -6.0, -11.2, 6.4, 9.6, 0.34);
  const cloveR = (c: Ctx) => ellipsePath(c, 6.8, -11.6, 6.4, 9.6, -0.34);
  const cloveC = (c: Ctx) => {
    c.moveTo(0.4, -24.4);
    c.bezierCurveTo(5.6, -20.0, 9.2, -13.2, 8.4, -6.6);
    c.bezierCurveTo(7.6, -1.4, 3.6, -0.6, 0.4, -0.6);
    c.bezierCurveTo(-3.0, -0.6, -7.4, -1.4, -8.0, -6.6);
    c.bezierCurveTo(-8.6, -13.2, -4.6, -20.0, 0.4, -24.4);
    c.closePath();
  };
  group(ctx, [
    { build: cloveL, style: { fill: GARLIC, shadow: GARLIC_SH, shadowOffset: [-2.2, -1.6] } },
    { build: cloveR, style: { fill: GARLIC, shadow: GARLIC_SH, shadowOffset: [-2.6, -1.6] } },
  ], 2.0);
  // clove seams under the centre clove
  shape(ctx, cloveC, { fill: GARLIC, shadow: GARLIC_SH, ink: 1.2, inkColor: '#a88f6a', shadowOffset: [-2.4, -1.8], gloss: [{ x: -3.4, y: -15.6, rx: 1.6, ry: 3.0, rot: 0.3, alpha: 0.85 }] });
  // purple streaks
  for (const [pts, a] of [
    [[[-2.4, -21.6], [-6.4, -15], [-6.6, -6]], 0.7],
    [[[3.4, -21.6], [7.0, -15], [7.2, -6.4]], 0.6],
    [[[-8.6, -17.4], [-11.2, -11], [-10.4, -4.6]], 0.55],
    [[[9.6, -17.6], [12.0, -11.4], [11.0, -4.8]], 0.5],
  ] as [Pt[], number][]) line(ctx, pts, 0.7, GARLIC_ST, true, a);

  // collar (crisp, pointy) + red tie
  shape(ctx, (c) => polyPath(c, [[0.4, -2.4], [-6.8, -3.6], [-4.8, 2.2], [-0.4, -0.2]]), { fill: SHIRT, ink: 1.4, shadow: SHIRT_SH, shadowOffset: [-0.8, -1.0] });
  shape(ctx, (c) => polyPath(c, [[0.4, -2.4], [7.4, -3.8], [5.6, 2.2], [1.2, -0.2]]), { fill: SHIRT, ink: 1.4, shadow: SHIRT_SH, shadowOffset: [-1.0, -0.8] });
  const tieBlade = (c: Ctx) => polyPath(c, [[-0.8, 0.6], [1.8, 0.6], [3.2, 6.4], [0.6, 8.8], [-1.8, 6.2]]);
  shape(ctx, tieBlade, { fill: TIE, ink: 1.1, shadowOffset: [-0.9, -0.6] });
  clipped(ctx, tieBlade, () => {
    for (let i = 0; i < 4; i++) line(ctx, [[-3, 2.4 + i * 2.2], [4, 0.6 + i * 2.2]], 0.55, '#8e1a24', false, 0.8);
  });
  shape(ctx, (c) => polyPath(c, [[-1.6, -1.8], [2.4, -1.8], [1.8, 1.0], [-1.0, 1.0]]), { fill: TIE, ink: 1.1, shadow: '#9a1d27', shadowOffset: [-0.5, -0.5] });

  // face: smug — half lids, one brow cocked, crooked smirk
  eyes(ctx, { x: 1.6, y: -12.4, r: 2.75, sp: 6.4, look: [0.38, 0.12], lid: 'half', pupil: 0.56, brow: { ang: 0.3, th: 1.35, dy: 1.3, tiltR: -0.28 } });
  shape(ctx, (c) => {
    c.moveTo(-1.2, -6.6);
    c.quadraticCurveTo(2.6, -5.0, 6.2, -7.8);
    c.quadraticCurveTo(5.4, -4.6, 2.4, -4.6);
    c.quadraticCurveTo(-0.4, -4.8, -1.2, -6.6);
    c.closePath();
  }, { fill: '#fff8ea', ink: 1.0, shadow: 'none' });
  line(ctx, [[-1.0, -6.4], [2.6, -5.6], [6.0, -7.6]], 0.45, '#a07a6a', true);
  line(ctx, [[6.0, -7.7], [7.0, -8.6]], 0.8, INK, false);
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#ef8a8a';
  ctx.beginPath();
  ellipsePath(ctx, -3.2, -8.2, 1.8, 1.0);
  ellipsePath(ctx, 6.8, -8.8, 1.6, 1.0);
  ctx.fill();
  ctx.restore();

  // near arm: "tsk tsk" finger wag
  const wag = [0, 1.4, 0, -1.4][f];
  const hx = 13.6, hy = -5.6;
  inkLine(ctx, [[7.8, 0.0], [12.6, -0.8], [hx, hy + 1.2]], 3.2, SHIRT, true, 1.1);
  ball(ctx, hx, hy, 2.1, GARLIC, GARLIC_SH, 1.0, 0.5);
  inkLine(ctx, [[hx + 0.5, hy - 1.2], [hx + 0.6 + wag * 0.7, hy - 5.2]], 1.15, GARLIC, false, 0.85);
  // a front wisp
  stinkWisp(ctx, 9.6, -22.6, 6, ph + 1, 1);
}

reg('aglio', 42, 52, 21, 34, drawAglio);

// ===========================================================================
// 9. BACON ABUSIVO — r13. A wavy strip of streaky bacon "disguised" as
//    guanciale with a fake handlebar moustache. The wave travels down its body.
// ===========================================================================

const BAC_LEAN = '#df4f60';
const BAC_LEAN_DK = '#b02c42';
const BAC_FAT = '#fcebdd';
const BAC_FAT_SH = '#e9bdb0';

function baconSpine(f: number): { pts: Pt[]; widths: number[] } {
  const phase = (f / 4) * TAU;
  const pts: Pt[] = [];
  const widths: number[] = [];
  // wavy body: tail (left) → neck
  for (let x = -24; x <= 0; x += 2) {
    const sN = -x / 24; // 0 at neck, 1 at tail
    const amp = 2.9 * Math.pow(sN, 0.7);
    pts.push([x, 6.0 + amp * Math.sin((x + 24) * (TAU / 15) + phase)]);
    widths.push(8.8 - sN * sN * 3.4);
  }
  // the neck rears up (gentle arc so the ribbon never folds) into the head
  const head: Pt[] = [[2.6, 5.4], [5.6, 4.0], [8.6, 1.6], [10.8, -1.8], [12.0, -5.6], [12.4, -9.4], [12.0, -12.6], [11.6, -14.4]];
  const hw = [9.2, 9.8, 10.8, 12.0, 13.2, 13.8, 12.4, 7.0];
  head.forEach((p, i) => { pts.push(p); widths.push(hw[i]); });
  return { pts, widths };
}

function bandPoly(pts: Pt[], widths: number[], v0: number, v1: number, wig: number): Pt[] {
  const A: Pt[] = [], B: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const nx = -dy, ny = dx;
    const h = widths[i] / 2;
    const w0 = v0 + Math.sin(i * 1.7) * wig, w1 = v1 + Math.sin(i * 1.3 + 2) * wig;
    A.push([pts[i][0] + nx * h * w0, pts[i][1] + ny * h * w0]);
    B.push([pts[i][0] + nx * h * w1, pts[i][1] + ny * h * w1]);
  }
  return [...A, ...B.reverse()];
}

function drawBacon(ctx: Ctx, f: number) {
  const { pts, widths } = baconSpine(f);
  const outline = ribbon(pts, widths);
  // rounded cut at the head, ragged at the tail
  const body = (c: Ctx) => smoothPath(c, outline, true, 0.35);
  shape(ctx, body, { fill: BAC_LEAN, ink: 2.0, shadow: 'none' });
  clipped(ctx, body, () => {
    // streaky layers (normal points to the strip's top edge… then down)
    const bands: [number, number, string][] = [
      [-1.4, -0.62, BAC_LEAN_DK],
      [-0.6, -0.16, BAC_FAT],
      [0.3, 0.58, BAC_FAT],
    ];
    for (const [v0, v1, col] of bands) {
      ctx.beginPath();
      smoothPath(ctx, bandPoly(pts, widths, v0, v1, col === BAC_FAT ? 0.08 : 0), true, 0.4);
      ctx.fillStyle = col;
      ctx.fill();
    }
    // marbling flecks in the lean
    speckle(ctx, -6, 6, 16, 3, 10, rgba('#ffd9d2', 0.7), 0.45, 77);
    // cel shadow on the lower edge + grease sheen on the top
    ctx.beginPath();
    smoothPath(ctx, bandPoly(pts, widths, 0.72, 1.4, 0), true, 0.4);
    ctx.fillStyle = rgba('#7a1a2c', 0.4);
    ctx.fill();
    line(ctx, pts.map(([x, y], i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      return [x - (dy / d) * widths[i] * 0.38 + 0.2, y + (dx / d) * widths[i] * 0.38] as Pt;
    }).slice(2, -2), 0.7, '#ffffff', true, 0.6);
  });
  // a few shiny grease glints on the fat
  glint(ctx, -15.6, 4.4 + Math.sin((f / 4) * TAU + 1) * 2, 1.2, 0.6, -0.3, 0.8);
  glint(ctx, 8.6, 0.6, 1.1, 0.6, -1.0, 0.8);

  // face on the reared-up head
  eyes(ctx, { x: 12.4, y: -8.6, r: 2.45, sp: 5.8, look: [0.35, 0.1], brow: { ang: 0.5, th: 1.15, dy: 1.3 } });
  mouth(ctx, 13.4, -0.6, 5.0, 'grin', { teeth: true, tongue: false });
  // the "guanciale" disguise: a big fake handlebar moustache, slightly crooked
  ctx.save();
  ctx.translate(13.2, -4.0);
  ctx.rotate(-0.18 + [0, 0.06, 0, -0.06][f]);
  moustache(ctx, 0, 0, 5.4, '#2a1814', 0.6);
  // the little strip of tape holding it on
  shape(ctx, (c) => polyPath(c, [[-0.8, -1.5], [0.9, -1.6], [1.0, -0.7], [-0.7, -0.6]]), { fill: '#f0e2c0', ink: 0.45, shadow: 'none' });
  ctx.restore();
}

reg('bacon', 54, 36, 30, 19, drawBacon);

// ===========================================================================
// 10. PISELLI RIBELLI — r8. One angry little pea in a red rebel headband.
// ===========================================================================

const PEA = '#68c046';
const PEA_SH = '#3c8a2c';
const BAND = '#e0303a';

function drawPiselli(ctx: Ctx, f: number) {
  const flap = [0, 1, 0, -1][f];
  // headband tails streaming behind
  leaf(ctx, [[-5.2, -5.6], [-8.6, -7.0 + flap * 0.6], [-12.2, -6.4 + flap * 1.4]], [2.0, 1.8, 1.1], BAND, 0.9);
  leaf(ctx, [[-5.2, -5.0], [-8.4, -3.8 - flap * 0.4], [-11.4, -2.2 - flap]], [1.9, 1.6, 1.0], '#c8242e', 0.9);
  legs(ctx, 0.4, 4.0, f, { len: 2.9, spread: 5, thick: 2, color: '#2f5e22', shoe: SHOE, stride: 2.8 });
  // the pea
  shape(ctx, (c) => circlePath(c, 0, -1.4, 7.6), {
    fill: PEA, shadow: PEA_SH, ink: 1.6, shadowOffset: [-2.0, -2.2],
    gloss: [{ x: -3.4, y: -5.0, rx: 2.2, ry: 1.2, rot: -0.6, alpha: 0.55 }],
  });
  // rebel headband wrapped round the top
  const hb = (c: Ctx) => {
    c.moveTo(-7.5, -4.2);
    c.quadraticCurveTo(0, -8.6, 7.5, -4.6);
    c.lineTo(7.2, -2.2);
    c.quadraticCurveTo(0, -6.2, -7.3, -1.8);
    c.closePath();
  };
  shape(ctx, hb, { fill: BAND, ink: 1.1, shadow: '#9a1a24', shadowOffset: [-0.7, -0.9] });
  line(ctx, [[-6.4, -3.6], [0, -6.8], [6.4, -3.9]], 0.5, '#ff8c8c', true, 0.8);
  ball(ctx, -6.0, -3.4, 1.4, BAND, '#9a1a24', 0.8, 0.4);
  // face
  eyes(ctx, { x: 1.2, y: -0.2, r: 2.35, sp: 5.0, look: [0.35, 0.12], brow: { ang: 0.55, th: 1.2, dy: 1.15 } });
  mouth(ctx, 1.6, 3.6, 4.4, 'snarl', { teeth: true, open: 1.2 });
}

reg('piselli', 30, 26, 16, 15, drawPiselli);

// ===========================================================================
// 11. ANANAS CORAZZATO — r22. The tank: a big pineapple whose diamond skin is
//     riveted armour plate, with a war-crown of spiky leaves and steel fists.
// ===========================================================================

const PINE = '#f2b23a';
const PINE_SH = '#c27a1e';
const PINE_GROOVE = '#8a5a14';
const PINE_STUD = '#6b4216';
const LEAF_D = '#2f8a3a';
const LEAF_L = '#5fb84a';
const GAUNT = '#c9d3e0';

function pinePath(c: Ctx) {
  c.moveTo(0, -30.5);
  c.bezierCurveTo(12.4, -30.5, 19.6, -20.5, 19.6, -6.5);
  c.bezierCurveTo(19.6, 7, 11.2, 14.2, 0, 14.2);
  c.bezierCurveTo(-11.2, 14.2, -19.6, 7, -19.6, -6.5);
  c.bezierCurveTo(-19.6, -20.5, -12.4, -30.5, 0, -30.5);
  c.closePath();
}

/** Half-width of the pineapple body at height y (matches pinePath roughly). */
function pineHalfW(y: number) {
  const t = (y + 8.2) / 22.6; // −1 top … +1 bottom
  return 19.6 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(t), 2.3)));
}

function drawAnanas(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  // crown of spiky leaves (back row first)
  ctx.save();
  ctx.translate(0, -27.5);
  ctx.rotate(sw * 0.03);
  const crown: [number, number, string][] = [
    [-2.5, 16, LEAF_D], [-0.62, 16, LEAF_D], [-2.0, 21, LEAF_D], [-1.12, 21.5, LEAF_D],
    [-2.95, 12.5, LEAF_L], [-0.2, 12.5, LEAF_L], [-1.57, 24.5, LEAF_L], [-2.25, 18, LEAF_L], [-0.9, 18.5, LEAF_L],
  ];
  for (const [a, len, col] of crown) {
    const ux = Math.cos(a), uy = Math.sin(a);
    const bend = (a + Math.PI / 2) * 0.35;
    const pts: Pt[] = [[ux * 2, uy * 2], [ux * len * 0.5 - bend * 2, uy * len * 0.5], [ux * len, uy * len]];
    shape(ctx, (c) => polyPath(c, ribbon(pts, [6.0, 4.0, 0.2])), { fill: col, ink: 1.9, shadow: shade(col, 0.3), shadowOffset: [-1.2, -0.8] });
    line(ctx, [pts[0], pts[1], [ux * len * 0.85, uy * len * 0.85]], 0.6, light(col, 0.4), true, 0.7);
  }
  ctx.restore();

  // far arm + steel gauntlet
  inkLine(ctx, [[-17, 0], [-21.8, 2.4 + sw], [-23.4, 7.0 + sw]], 4.2, LIMB, true, 1.2);
  ball(ctx, -23.4, 7.8 + sw, 3.8, GAUNT, STEEL_SH, 1.5, 0.75);
  // stubby legs in steel sabatons
  legs(ctx, 0, 11.4, f, { len: 6.4, spread: 15, thick: 5.2, color: LIMB, shoe: '#9aa6b9', stride: 4.6 });

  // armoured body
  shape(ctx, pinePath, {
    fill: PINE, shadow: PINE_SH, ink: 2.6, shadowOffset: [-4.6, -3.4],
    gloss: [{ x: -9.5, y: -17, rx: 4.4, ry: 2.4, rot: -0.7, alpha: 0.35 }],
  });
  // diamond plates mapped round the body
  clipped(ctx, pinePath, () => {
    const rows = 7, du = 0.44;
    const map = (u: number, y: number): Pt => [pineHalfW(y) * Math.sin(u), y];
    for (let r = 0; r < rows; r++) {
      const y = -28 + r * 6.4;
      const off = r % 2 ? du / 2 : 0;
      for (let u = -1.8 + off; u <= 1.8; u += du) {
        const T = map(u, y - 3.3), Rr = map(u + du / 2, y), B = map(u, y + 3.3), Lf = map(u - du / 2, y);
        const C = map(u, y);
        // groove
        ctx.beginPath();
        polyPath(ctx, [T, Rr, B, Lf]);
        ctx.lineWidth = 0.95;
        ctx.strokeStyle = rgba(PINE_GROOVE, 0.75);
        ctx.stroke();
        // bevel: lit upper-left edges, shaded lower-right edges
        line(ctx, [[Lf[0] + 0.5, Lf[1]], [T[0], T[1] + 0.55], [Rr[0] - 0.4, Rr[1] - 0.1]], 0.55, '#ffe6a0', false, 0.7);
        line(ctx, [[Rr[0] - 0.4, Rr[1] + 0.1], [B[0], B[1] - 0.5]], 0.6, rgba('#8a4a10', 0.45), false);
        // stud / rivet with a tiny spike
        const sr = 1.05 * Math.max(0.35, Math.cos(u));
        ctx.beginPath();
        circlePath(ctx, C[0], C[1] + 0.3, sr + 0.35);
        ctx.fillStyle = rgba('#4a2c0e', 0.55);
        ctx.fill();
        ctx.beginPath();
        circlePath(ctx, C[0], C[1], sr);
        ctx.fillStyle = PINE_STUD;
        ctx.fill();
        ctx.beginPath();
        circlePath(ctx, C[0] - sr * 0.35, C[1] - sr * 0.35, sr * 0.35);
        ctx.fillStyle = 'rgba(255,240,200,0.8)';
        ctx.fill();
      }
    }
    // re-apply the big cel shadow so the plates sit in the form
    ctx.globalAlpha = 0.38;
    ctx.translate(-4.6, -3.4);
    ctx.beginPath();
    ctx.rect(-60, -80, 120, 160);
    pinePath(ctx);
    ctx.fillStyle = PINE_SH;
    ctx.fill('evenodd');
  });
  // calm the plating behind the face so it stays readable
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = PINE;
  ctx.beginPath();
  ellipsePath(ctx, 2.6, -5.4, 11.6, 8.6);
  ctx.fill();
  ctx.restore();

  // fierce face
  eyes(ctx, { x: 2.6, y: -9.0, r: 4.4, sp: 10.8, look: [0.32, 0.15], pupil: 0.5, brow: { ang: 0.5, th: 2.6, dy: 1.25, len: 8.4 } });
  mouth(ctx, 3.4, -0.6, 11.6, 'snarl', { teeth: true, open: 1.15 });
  // underbite fangs
  for (const tx of [-0.6, 7.0]) {
    shape(ctx, (c) => polyPath(c, [[tx - 1.1, 0.4], [tx + 1.1, 0.2], [tx + 0.1, -2.6]]), { fill: '#fff8ea', ink: 0.8, shadow: 'none' });
  }
  // battle scar
  line(ctx, [[-9.6, -15.6], [-6.4, -11.4]], 0.9, '#8a4a10', false, 0.9);
  line(ctx, [[-9.2, -13.0], [-7.6, -14.0]], 0.6, '#8a4a10', false, 0.9);

  // near arm + steel gauntlet
  inkLine(ctx, [[18.6, 1.6], [22.6, 3.4 - sw], [24.0, 7.2 - sw]], 4.4, LIMB, true, 1.2);
  ball(ctx, 24.0, 8.0 - sw, 4.0, GAUNT, STEEL_SH, 1.5, 0.75);
  line(ctx, [[22.2, 6.8 - sw], [25.2, 5.8 - sw]], 0.6, STEEL_DK, false, 0.8);
}

reg('ananas', 62, 82, 31, 56, drawAnanas);

// ===========================================================================
// 12. PEZZO D'ANANAS — r9. A small, fast, furious pineapple chunk.
// ===========================================================================

const CHUNK = '#ffd23f';
const CHUNK_SH = '#e8a21a';
const RIND = '#d98a1e';

function chunkPath(c: Ctx) {
  c.moveTo(-9.6, -9.0);
  c.quadraticCurveTo(0.4, -12.6, 10.4, -9.6);
  c.quadraticCurveTo(9.4, -2.8, 4.6, 4.4);
  c.quadraticCurveTo(0.6, 6.0, -3.6, 4.6);
  c.quadraticCurveTo(-8.6, -2.0, -9.6, -9.0);
  c.closePath();
}

function drawPezzo(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  // flying juice drops (speed!)
  const jd = f % 2 ? 1.2 : 0;
  shape(ctx, (c) => circlePath(c, -11.6 - jd, -4.6 + jd, 1.1), { fill: '#ffe58a', ink: 0.7, shadow: 'none' });
  shape(ctx, (c) => circlePath(c, -12.8 + jd, 0.6, 0.8), { fill: '#ffe58a', ink: 0.7, shadow: 'none' });
  gloveArm(ctx, -6.4, -2, -9.6 - sw * 1.4, 2.6, 1.7, 1.2, 0.2, LIMB);
  legs(ctx, 0.6, 4.4, f, { len: 2.8, spread: 5.4, thick: 2.1, color: LIMB, shoe: SHOE, stride: 3.6 });
  shape(ctx, chunkPath, {
    fill: CHUNK, shadow: CHUNK_SH, ink: 1.6, shadowOffset: [-2.2, -1.8],
    gloss: [{ x: -5.6, y: -5.6, rx: 1.4, ry: 2.4, rot: 0.3, alpha: 0.7 }],
  });
  clipped(ctx, chunkPath, () => {
    // fibres converging toward the core
    for (let i = -4; i <= 4; i++) line(ctx, [[i * 2.3, -10], [i * 0.5 + 0.6, 6]], 0.45, '#e8a21a', false, 0.55);
    // rind band with little diamond eyes
    ctx.beginPath();
    ctx.moveTo(-12, -9.8);
    ctx.quadraticCurveTo(0.4, -13.6, 12, -10.4);
    ctx.lineTo(12, -7.0);
    ctx.quadraticCurveTo(0.4, -10.2, -12, -6.4);
    ctx.closePath();
    ctx.fillStyle = RIND;
    ctx.fill();
    for (let i = -3; i <= 3; i++) {
      const x = i * 2.9 + 0.6, y = -9.5 - Math.cos(i * 0.35) * 0.9;
      ctx.beginPath();
      polyPath(ctx, [[x, y - 1.1], [x + 1.2, y], [x, y + 1.1], [x - 1.2, y]]);
      ctx.fillStyle = '#9a5a12';
      ctx.fill();
    }
    line(ctx, [[-12, -6.4], [0.4, -10.2], [12, -7.0]], 0.6, '#9a5a12', true, 0.8);
  });
  eyes(ctx, { x: 1.2, y: -3.4, r: 2.4, sp: 5.4, look: [0.38, 0.1], brow: { ang: 0.58, th: 1.3, dy: 1.2 } });
  mouth(ctx, 1.4, 1.0, 4.8, 'snarl', { teeth: true, open: 1.2 });
  gloveArm(ctx, 7.6, 0.2, 11.0 + sw * 1.4, 3.0, 1.7, 1.2, 0.3, LIMB);
}

reg('ananas_pezzo', 36, 29, 18, 16, drawPezzo);

// ===========================================================================
// 13. POLLO INFILTRATO — r13. A roast drumstick working undercover: spy fedora,
//     groucho glasses-nose-moustache, sprinting on scrawny chicken feet.
// ===========================================================================

const ROAST = '#d98a3a';
const ROAST_SH = '#a6561f';
const ROAST_HI = '#f6c06a';
const BONE = '#f4ecd8';
const BONE_SH = '#cdbf9c';
const FOOT = '#f0a23a';
const FEDORA = '#46404c';
const FEDORA_SH = '#2c2731';

function drumPath(c: Ctx) {
  c.moveTo(-9.0, -6.8);
  c.bezierCurveTo(-5.6, -13.6, 7.0, -14.4, 11.8, -7.4);
  c.bezierCurveTo(15.8, -1.4, 13.2, 7.6, 5.4, 8.6);
  c.bezierCurveTo(-1.2, 9.6, -6.2, 4.6, -8.4, 0.6);
  c.bezierCurveTo(-9.8, -1.6, -10.8, -4.0, -9.0, -6.8);
  c.closePath();
}

/** Scrawny chicken leg: shank from hip to ankle, three forward toes + a back toe. */
function chickenLeg(ctx: Ctx, hx: number, hy: number, ax: number, ay: number, toeAng: number) {
  inkLine(ctx, [[hx, hy], [ax, ay]], 1.8, FOOT, false, 0.9);
  for (const [da, len] of [[-0.5, 4.0], [0, 4.6], [0.5, 3.8], [Math.PI - 0.2, 2.4]] as Pt[]) {
    const a = toeAng + da;
    inkLine(ctx, [[ax, ay], [ax + Math.cos(a) * len, ay + Math.sin(a) * len * 0.5]], 1.35, FOOT, false, 0.85);
  }
  shape(ctx, (c) => circlePath(c, ax, ay, 1.35), { fill: FOOT, ink: 0.8, shadow: 'none' });
}

function drawPollo(ctx: Ctx, f: number) {
  // running legs: [hip, ankle] per frame; the back leg is drawn first
  const run: [Pt, Pt][][] = [
    [[[-1, 7], [-4.4, 11.4]], [[3.6, 7.4], [6.8, 11.8]]],
    [[[-1, 7], [-6.4, 9.4]], [[3.6, 7.4], [8.8, 11.2]]],
    [[[-1, 7], [0.6, 11.6]], [[3.6, 7.4], [2.0, 10.6]]],
    [[[-1, 7], [3.8, 11.0]], [[3.6, 7.4], [-1.8, 9.8]]],
  ];
  const [back, front] = run[f];
  chickenLeg(ctx, back[0][0], back[0][1], back[1][0], back[1][1], 0.1);

  // the bone, trailing behind like a tail
  group(ctx, [
    { build: (c) => polyPath(c, ribbon([[-6.4, -2.4], [-12.6, -6.4], [-16.4, -9.0]], [4.6, 3.4, 3.4])), style: { fill: BONE, shadow: BONE_SH, shadowOffset: [-0.8, -1.0] } },
    { build: (c) => { circlePath(c, -17.6, -11.0, 2.6); circlePath(c, -19.0, -7.6, 2.5); }, style: { fill: BONE, shadow: BONE_SH, shadowOffset: [-0.8, -0.9], gloss: [{ x: -18.4, y: -12.0, rx: 0.9, ry: 0.5, alpha: 0.8 }] } },
  ], 1.7);
  line(ctx, [[-8.6, -4.6], [-14.0, -8.2]], 0.7, '#ffffff', false, 0.8);

  // the meaty, crispy drumstick body
  shape(ctx, drumPath, {
    fill: ROAST, shadow: ROAST_SH, ink: 2.0, shadowOffset: [-3.0, -2.6],
    gloss: [{ x: -2.6, y: -9.0, rx: 3.6, ry: 1.6, rot: -0.35, alpha: 0.55 }, { x: -6.0, y: -4.2, rx: 0.9, ry: 1.6, rot: 0.4, alpha: 0.5 }],
  });
  clipped(ctx, drumPath, () => {
    // roasted patches + seasoning
    ctx.fillStyle = rgba('#8f4316', 0.28);
    ctx.beginPath();
    ellipsePath(ctx, 6.6, 3.2, 5.6, 3.0, -0.4);
    ellipsePath(ctx, -5.4, 2.6, 2.8, 2.0, 0.6);
    ctx.fill();
    speckle(ctx, 2, -1, 11, 8, 26, '#7a3a14', 0.32, 31, 0.8);
    speckle(ctx, 1, -2, 10, 7, 8, '#4f8a2a', 0.3, 32, 0.9);
    line(ctx, [[-4, -11.2], [3, -12.4], [8.8, -10.0]], 0.7, ROAST_HI, true, 0.8);
  });

  // groucho disguise: round glasses, big pink nose, bushy brows, moustache
  eyes(ctx, { x: 7.0, y: -4.8, r: 2.15, sp: 5.8, look: [0.45, 0.05], lid: 'angry', pupil: 0.55, far: 0.95 });
  for (const ex of [4.1, 9.9]) {
    ctx.save();
    ctx.beginPath();
    circlePath(ctx, ex, -4.8, 2.95);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#1a1416';
    ctx.stroke();
    ctx.restore();
  }
  line(ctx, [[6.9, -5.6], [7.1, -5.9]], 1.2, '#1a1416');
  line(ctx, [[1.2, -5.2], [-1.4, -5.8]], 1.1, '#1a1416');
  brow(ctx, 3.9, -8.7, 4.8, 0.32, 1.8, '#1a1416');
  brow(ctx, 10.1, -8.9, 5.0, -0.32, 1.8, '#1a1416');
  moustache(ctx, 8.0, 1.0, 4.4, '#1a1416', 0.55);
  shape(ctx, (c) => ellipsePath(c, 8.2, -1.4, 2.4, 2.1), {
    fill: '#f5a2a2', ink: 0.9, shadow: '#d9787f', shadowOffset: [-0.7, -0.7],
    gloss: [{ x: 7.9, y: -2.2, rx: 0.8, ry: 0.5, alpha: 0.85 }],
  });
  // sly grin under it all
  line(ctx, [[5.0, 3.6], [7.8, 4.4], [11.0, 3.0]], 0.9, '#5b1320', true);

  // spy fedora, brim pulled low
  ctx.save();
  ctx.translate(2.8, -12.0);
  ctx.rotate(0.1);
  group(ctx, [
    {
      build: (c) => {
        c.moveTo(-6.0, 0.4);
        c.quadraticCurveTo(-6.6, -5.4, -3.6, -7.4);
        c.quadraticCurveTo(-0.8, -6.0, 0.6, -7.6);
        c.quadraticCurveTo(4.6, -6.8, 5.8, 0.2);
        c.closePath();
      },
      style: { fill: FEDORA, shadow: FEDORA_SH, shadowOffset: [-1.4, -0.8], gloss: [{ x: -3.4, y: -5.0, rx: 1.2, ry: 0.6, rot: -0.5, alpha: 0.35 }] },
    },
    {
      build: (c) => {
        c.moveTo(-10.4, 0.6);
        c.quadraticCurveTo(-1, -2.4, 10.6, 0.4);
        c.quadraticCurveTo(11.6, 2.6, 9.0, 2.4);
        c.quadraticCurveTo(-1, 1.0, -9.6, 2.8);
        c.quadraticCurveTo(-11.8, 2.6, -10.4, 0.6);
        c.closePath();
      },
      style: { fill: FEDORA, shadow: FEDORA_SH, shadowOffset: [-0.8, -1.0] },
    },
  ], 1.6);
  shape(ctx, (c) => {
    c.moveTo(-6.0, -0.6);
    c.quadraticCurveTo(0, -2.4, 5.8, -0.8);
    c.lineTo(5.6, -2.4);
    c.quadraticCurveTo(0, -4.0, -6.1, -2.2);
    c.closePath();
  }, { fill: '#1d1a20', ink: 0, shadow: 'none' });
  line(ctx, [[-2.4, -6.2], [-0.6, -5.4], [0.8, -6.4]], 0.6, FEDORA_SH, true, 0.9);
  ctx.restore();

  chickenLeg(ctx, front[0][0], front[0][1], front[1][0], front[1][1], 0.05);
}

reg('pollo', 46, 44, 24, 28, drawPollo);

// ===========================================================================
// 14. PEPPERONI VOLANTE — r11. A spicy salami slice on little white wings,
//     wearing a tiny green bell pepper as a hat (in Italy, "peperoni" ARE
//     bell peppers). Red + white + green: accidentally tricolore.
// ===========================================================================

const SALAMI = '#c8321e';
const SALAMI_SH = '#8e1c14';
const SALAMI_RIM = '#9c2216';
const WING = '#fbf8f0';
const WING_SH = '#cfd3e2';
const PEPPER = '#3faa3a';

function wing(ctx: Ctx, x: number, y: number, side: number, ang: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side, 1);
  ctx.rotate(ang);
  const build = (c: Ctx) => {
    c.moveTo(0, -1.2);
    c.quadraticCurveTo(5.6, -6.4, 10.6, -4.6);
    c.quadraticCurveTo(10.8, -2.4, 9.0, -2.0);
    c.quadraticCurveTo(10.0, -0.2, 8.0, 0.6);
    c.quadraticCurveTo(8.4, 2.4, 6.0, 2.6);
    c.quadraticCurveTo(3.4, 3.4, 0, 1.8);
    c.closePath();
  };
  shape(ctx, build, { fill: WING, shadow: WING_SH, ink: 1.4, shadowOffset: [-0.6, -1.4] });
  line(ctx, [[2.2, 0.2], [8.8, -2.0]], 0.5, WING_SH, true, 0.9);
  line(ctx, [[2.0, 1.2], [7.6, 0.8]], 0.5, WING_SH, true, 0.9);
  ctx.restore();
}

function blobPathLocal(c: Ctx, x: number, y: number, rx: number, ry: number, seed: number) {
  const pts: Pt[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + seed;
    const k = 0.8 + ((Math.sin(seed * 13.7 + i * 2.3) + 1) / 2) * 0.4;
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  smoothPath(c, pts, true, 0.5);
}

function drawPepperoni(ctx: Ctx, f: number) {
  const flap = [0, -0.55, 0, 0.45][f];
  const cy = -4.4;
  // wings behind the slice
  wing(ctx, -10.0, cy - 0.4, -1, flap);
  wing(ctx, 10.2, cy - 0.8, 1, flap);
  // slice edge (thickness) then the top face: crinkled, slightly cupped
  const crinkle = (c: Ctx, dy: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      const k = 1 + (i % 2 ? 0.035 : -0.02);
      pts.push([Math.cos(a) * 11.6 * k, cy + dy + Math.sin(a) * 7.8 * k]);
    }
    smoothPath(c, pts, true, 0.5);
  };
  const rim = (c: Ctx) => crinkle(c, 2.6);
  const top = (c: Ctx) => crinkle(c, 0);
  shape(ctx, rim, { fill: SALAMI_RIM, ink: 1.8, shadow: '#6e140e', shadowOffset: [-2.4, -0.6] });
  shape(ctx, top, { fill: SALAMI, shadow: SALAMI_SH, ink: 1.5, shadowOffset: [-1.6, -1.4] });
  clipped(ctx, top, () => {
    // curled-up edge: a lighter lip all round, darker cupped centre
    ctx.beginPath();
    ellipsePath(ctx, 0, cy, 11.4, 7.7);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = rgba('#ec6a4c', 0.75);
    ctx.stroke();
    ctx.beginPath();
    ellipsePath(ctx, 0.4, cy + 0.6, 7.2, 4.6);
    ctx.fillStyle = rgba('#8e1c14', 0.18);
    ctx.fill();
    // fat specks (irregular) + black peppercorns
    const Rn = rng(93);
    for (let i = 0; i < 15; i++) {
      const a = Rn() * TAU, d = Math.sqrt(Rn()) * 0.86;
      const x = Math.cos(a) * 10 * d, y = cy + Math.sin(a) * 6.6 * d;
      ctx.beginPath();
      blobPathLocal(ctx, x, y, 0.75 + Rn() * 0.55, 0.55 + Rn() * 0.4, Rn() * 9);
      ctx.fillStyle = '#fbd8c8';
      ctx.fill();
    }
    speckle(ctx, 0, cy, 9.6, 6.4, 8, '#3a0d08', 0.32, 92);
    // oily sheen streak
    glint(ctx, -5.6, cy - 4.4, 2.8, 0.75, -0.25, 0.6);
  });
  // tiny bell-pepper hat, cocked over one eye
  ctx.save();
  ctx.translate(5.6, cy - 7.6);
  ctx.rotate(0.5);
  ctx.scale(0.9, 0.9);
  shape(ctx, (c) => {
    c.moveTo(-3.4, -1.0);
    c.bezierCurveTo(-4.4, 2.6, -2.8, 3.8, -1.3, 3.1);
    c.quadraticCurveTo(0, 4.0, 1.3, 3.1);
    c.bezierCurveTo(2.8, 3.8, 4.4, 2.6, 3.4, -1.0);
    c.quadraticCurveTo(0, -3.0, -3.4, -1.0);
    c.closePath();
  }, { fill: PEPPER, shadow: '#26742a', ink: 1.3, shadowOffset: [-0.9, -0.8], gloss: [{ x: -1.8, y: -0.2, rx: 0.7, ry: 1.3, alpha: 0.75 }] });
  line(ctx, [[-1.1, 0.4], [-1.2, 2.8]], 0.5, '#26742a', false, 0.8);
  line(ctx, [[1.1, 0.4], [1.2, 2.8]], 0.5, '#26742a', false, 0.8);
  shape(ctx, (c) => ellipsePath(c, 0, -1.8, 1.8, 0.8), { fill: '#2d7a2c', ink: 0.8, shadow: 'none' });
  inkLine(ctx, [[0, -2.0], [0.3, -4.0], [1.8, -4.8]], 1.2, '#2d6e2a', true, 0.65);
  ctx.restore();
  // face: evil spicy grin
  eyes(ctx, { x: 1.0, y: cy - 1.8, r: 2.6, sp: 5.8, look: [0.35, 0.1], lid: 'angry', pupil: 0.42, brow: { ang: 0.6, th: 1.3, dy: 1.2 } });
  mouth(ctx, 1.6, cy + 3.2, 7.0, 'grin', { teeth: true, tongue: true });
}

reg('pepperoni', 52, 34, 26, 22, drawPepperoni);

// ===========================================================================
// 15. POLPETTA ROTOLANTE — r14. A glossy meatball tangled in spaghetti, with a
//     dollop of sauce on top and a maniac grin. The texture ROLLS: 30° per
//     frame (3-fold symmetric, so 4 frames = 120° loops seamlessly).
// ===========================================================================

const MEAT = '#8c4a2a';
const MEAT_SH = '#5f2a16';
const MEAT_HI = '#c27a4c';
const SAUCE = '#d8341f';
const NOODLE = '#f2d27e';

function drawPolpetta(ctx: Ctx, f: number) {
  const rot = (f / 4) * (TAU / 3);
  const R = 13.6;
  const ballPath = (c: Ctx) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + rot;
      const k = 1 + Math.sin(i * 2.1) * 0.025 + Math.cos(i * 3.7) * 0.02;
      pts.push([Math.cos(a) * R * k, Math.sin(a) * R * k]);
    }
    smoothPath(c, pts, true, 0.5);
  };
  // rotate a point of the surface texture
  const P = (a: number, d: number): Pt => [Math.cos(a + rot) * d, Math.sin(a + rot) * d];

  // spaghetti ends sticking out (behind the ball)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.5;
    const p0 = P(a, R * 0.8), p1 = P(a + 0.1, R * 1.16), p2 = P(a + 0.32, R * 1.32), p3 = P(a + 0.52, R * 1.22);
    inkLine(ctx, [p0, p1, p2, p3], 1.7, NOODLE, true, 0.85);
  }

  shape(ctx, ballPath, { fill: MEAT, ink: 2.0, shadow: 'none' });
  clipped(ctx, ballPath, () => {
    // lumpy minced texture (3-fold symmetric)
    for (let k = 0; k < 3; k++) {
      const base = (k / 3) * TAU;
      for (const [a, d, r, col] of [
        [0.2, 5, 2.6, MEAT_HI], [0.9, 9.5, 2.2, MEAT_SH], [1.5, 3, 1.8, MEAT_SH], [1.8, 10.5, 2.4, MEAT_HI],
        [0.55, 11.5, 1.4, '#6e3a1e'], [1.25, 7, 1.5, MEAT_HI],
      ] as [number, number, number, string][]) {
        const [x, y] = P(base + a, d);
        ctx.beginPath();
        ellipsePath(ctx, x, y, r, r * 0.75, base + a + rot);
        ctx.fillStyle = rgba(col, 0.55);
        ctx.fill();
      }
      for (const [a, d] of [[0.4, 8], [1.1, 4.5], [1.7, 11]] as Pt[]) {
        const [x, y] = P(base + a, d);
        ctx.beginPath();
        ellipsePath(ctx, x, y, 0.8, 0.45, base + a);
        ctx.fillStyle = '#4f8a2a';
        ctx.fill();
      }
    }
    // spaghetti strands wrapped round the ball (great-circle arcs)
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU + 0.5 + rot;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.98, R * 0.42, 0, -0.15, Math.PI + 0.15);
      ctx.lineCap = 'round';
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = NOODLE;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -0.5, R * 0.98, R * 0.42, 0, 0.5, Math.PI - 0.5);
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = '#fff6d0';
      ctx.stroke();
      ctx.restore();
    }
  });
  // round-ball cel shading + gloss (static: light doesn't roll)
  shadeOver(ctx, ballPath, MEAT_SH, [-3.6, -3.4], 0.55);
  clipped(ctx, ballPath, () => {
    glint(ctx, -6.2, -6.4, 3.2, 1.6, -0.7, 0.55);
    glint(ctx, -9.2, -1.6, 0.8, 1.4, 0.2, 0.5);
  });

  // tomato sauce ladled over the top, dripping down (static: gravity wins)
  const dr = [0, 0.6, 1.1, 0.4][f];
  const sauce = (c: Ctx) => {
    c.moveTo(-10.4, -8.4);
    c.bezierCurveTo(-9.6, -13.6, -5.0, -15.4, 0.4, -15.2);
    c.bezierCurveTo(5.6, -15.0, 10.2, -13.2, 10.8, -8.0);
    c.quadraticCurveTo(10.2, -6.6, 9.0, -7.4);
    c.quadraticCurveTo(8.9, -4.0 - dr, 7.6, -3.8 - dr);
    c.quadraticCurveTo(6.2, -3.8 - dr, 6.2, -7.8);
    c.quadraticCurveTo(3.6, -9.2, 1.2, -9.0);
    c.quadraticCurveTo(1.0, -5.8 - dr * 0.6, -0.4, -5.8 - dr * 0.6);
    c.quadraticCurveTo(-1.8, -5.8 - dr * 0.6, -2.0, -8.8);
    c.quadraticCurveTo(-4.4, -8.6, -5.6, -8.2);
    c.quadraticCurveTo(-6.0, -6.6, -7.2, -6.8);
    c.quadraticCurveTo(-8.4, -7.0, -8.4, -8.0);
    c.quadraticCurveTo(-9.6, -7.6, -10.4, -8.4);
    c.closePath();
  };
  shape(ctx, sauce, {
    fill: SAUCE, shadow: '#a01e12', ink: 1.6, shadowOffset: [-1.4, -1.5],
    gloss: [{ x: -3.6, y: -13.0, rx: 2.8, ry: 0.9, rot: -0.15, alpha: 0.75 }, { x: 6.2, y: -12.2, rx: 0.8, ry: 0.45, alpha: 0.8 }],
  });
  // grated cheese snow + a little basil leaf lying on the sauce
  speckle(ctx, 1.0, -12.2, 7.0, 1.8, 9, '#fff6d8', 0.42, 57);
  leaf(ctx, [[2.6, -13.4], [5.2, -15.0], [7.6, -14.4]], [1.0, 2.4, 0.3], '#3f9a3a', 0.9);

  // maniacal face (static — the face doesn't roll, only the meat does)
  eye(ctx, -1.8, -1.4, 2.5, { look: [0.3, 0.1], pupil: 0.3, iris: '#e8c44a' });
  eye(ctx, 4.6, -1.8, 3.1, { look: [0.25, 0.05], pupil: 0.26, iris: '#e8c44a' });
  brow(ctx, -2.0, -5.0, 4.2, 0.55, 1.3);
  brow(ctx, 4.8, -6.3, 5.0, 0.12, 1.3);
  const gp = (c: Ctx) => {
    c.moveTo(-3.8, 3.0);
    c.quadraticCurveTo(1.8, 4.8, 8.2, 1.8);
    c.quadraticCurveTo(7.4, 8.8, 2.0, 8.8);
    c.quadraticCurveTo(-2.8, 8.4, -3.8, 3.0);
    c.closePath();
  };
  shape(ctx, gp, { fill: '#5b1320', ink: 1.2, shadow: 'none' });
  clipped(ctx, gp, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(-6, 2.2); ctx.quadraticCurveTo(1.6, 4.6, 10, 0.8);
    ctx.lineTo(10, 3.6); ctx.quadraticCurveTo(1.6, 6.8, -6, 4.6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, 9.6); ctx.quadraticCurveTo(1.8, 7.6, 10, 8.4);
    ctx.lineTo(10, 11); ctx.lineTo(-6, 11);
    ctx.closePath();
    ctx.fill();
    for (const tx of [-2.6, -0.2, 2.2, 4.6, 7.0]) {
      line(ctx, [[tx, 2.8], [tx + 0.1, 5.0]], 0.35, '#b08a7a');
      line(ctx, [[tx, 7.8], [tx, 9.6]], 0.35, '#b08a7a');
    }
    ctx.beginPath();
    ellipsePath(ctx, 2.6, 7.6, 3.0, 1.2);
    ctx.fillStyle = '#e8616e';
    ctx.fill();
  });
}

reg('polpetta', 44, 46, 22, 23, drawPolpetta);
