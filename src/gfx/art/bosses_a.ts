/**
 * BOSSES (part A) — crimes against Italian cuisine, made huge and theatrical.
 *
 *   boss.<id>          4-frame idle/walk loop with secondary motion, hit flash
 *   boss.<id>.attack   2 frames: 0 = wind-up / telegraph, 1 = attack. Same box/anchor.
 *
 * Anchor = centre of the collision circle; the feet/base rest at y ≈ +radius.
 * All bosses face front-right (the renderer mirrors them). Outline width 3–4.
 *
 *   id         box (w×h)   anchor (ax,ay)  radius  dominant colour
 *   ketchup    150×200     (75,150)        46      tomato red
 *   alfredo    170×200     (85,140)        54      cream + gold
 *   panna      180×220     (90,160)        58      dairy blue + white
 *   scatolone  170×200     (85,142)        54      tin silver + orange
 *   deepdish   220×200     (110,122)       74      golden crust + tomato
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, group, ellipsePath, circlePath, roundRectPath, smoothPath,
  line, inkLine, eye, brow, mouth, speckle, glint, rgba,
} from '../painter';

export type Pose = 'idle' | 'windup' | 'attack';
const TAU = Math.PI * 2;
/** Boss outline width. */
const BI = 3.4;

/** boss.<id> (4 frames, idle) + boss.<id>.attack (2 frames: wind-up, attack), same box. Exported for the Il Menù art files. */
export function registerBoss(id: string, w: number, h: number, ax: number, ay: number, draw: (ctx: Ctx, f: number, pose: Pose) => void) {
  defineSprite({ id: `boss.${id}`, w, h, ax, ay, frames: 4, flash: true, draw: (ctx, f) => draw(ctx, f, 'idle') });
  defineSprite({ id: `boss.${id}.attack`, w, h, ax, ay, frames: 2, flash: true, draw: (ctx, f) => draw(ctx, f, f === 0 ? 'windup' : 'attack') });
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Closed outline around a centre line with per-point widths. */
function ribbon(pts: Pt[], widths: number[]): Pt[] {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const w = widths[i] / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return [...L, ...R.reverse()];
}

function clipped(ctx: Ctx, build: (c: Ctx) => void, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

/** Hanging drip: attached along a band of width w at (x,y), bulb of radius r at the end. */
function dripPath(c: Ctx, x: number, y: number, w: number, len: number, r = w * 0.42) {
  const by = y + len - r;
  c.moveTo(x - w / 2, y);
  c.bezierCurveTo(x - w * 0.18, y + len * 0.35, x - r * 1.05, by - r * 1.2, x - r, by);
  c.arc(x, by, r, Math.PI, 0, true);
  c.bezierCurveTo(x + r * 1.05, by - r * 1.2, x + w * 0.18, y + len * 0.35, x + w / 2, y);
  c.closePath();
}

/** Falling teardrop (point up) centred on its bulb. */
function dropPath(c: Ctx, x: number, y: number, r: number) {
  c.moveTo(x, y - r * 2.4);
  c.bezierCurveTo(x + r * 0.4, y - r * 1.4, x + r, y - r * 0.8, x + r, y);
  c.arc(x, y, r, 0, Math.PI, false);
  c.bezierCurveTo(x - r, y - r * 0.8, x - r * 0.4, y - r * 1.4, x, y - r * 2.4);
  c.closePath();
}

function ball(ctx: Ctx, x: number, y: number, r: number, fill: string, sh: string, ink = 2, glossA = 0.55) {
  shape(ctx, (c) => circlePath(c, x, y, r), {
    fill, ink, shadow: sh, shadowOffset: [-r * 0.32, -r * 0.36],
    gloss: [{ x: x - r * 0.38, y: y - r * 0.42, rx: r * 0.32, ry: r * 0.2, rot: -0.5, alpha: glossA }],
  });
}

/** Squeezed-shut cartoon eye "> <" (effort / wind-up). side −1 = left eye. */
function squeezeEye(ctx: Ctx, x: number, y: number, r: number, side: number) {
  line(ctx, [[x + side * r, y - r * 0.8], [x - side * r * 0.7, y], [x + side * r, y + r * 0.8]], r * 0.42, INK);
}

/** Small motion/effort tick marks radiating from a point. */
function effortMarks(ctx: Ctx, x: number, y: number, r: number, a0: number, a1: number, n: number, len: number, w = 2) {
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / Math.max(1, n - 1);
    line(ctx, [[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * (r + len), y + Math.sin(a) * (r + len)]], w, INK);
  }
}

// ---------------------------------------------------------------------------
// Shared: villain mouth with pointy teeth, block lettering, steam puffs
// ---------------------------------------------------------------------------

/**
 * Big villain mouth. (x,y) = centre of the top lip line, w×h = size.
 * frown > 0 pulls the corners down. Pointy teeth top (and bottom when open).
 */
function bossMouth(ctx: Ctx, x: number, y: number, w: number, h: number, o: { frown?: number; tongue?: boolean; bottomTeeth?: boolean; ink?: number } = {}) {
  const fr = (o.frown ?? 0.25) * h;
  const build = (c: Ctx) => {
    c.moveTo(x - w / 2, y + fr);
    c.quadraticCurveTo(x, y - h * 0.3, x + w / 2, y + fr * 0.8);
    c.quadraticCurveTo(x + w * 0.1, y + h * 1.25, x - w / 2, y + fr);
    c.closePath();
  };
  shape(ctx, build, { fill: '#5b1320', ink: o.ink ?? BI, shadow: 'none' });
  clipped(ctx, build, () => {
    if (o.tongue) {
      ctx.fillStyle = '#e8616e';
      ctx.beginPath();
      ellipsePath(ctx, x + w * 0.08, y + h * 0.95, w * 0.26, h * 0.42);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ellipsePath(ctx, x + w * 0.02, y + h * 0.8, w * 0.08, h * 0.1);
      ctx.fill();
    }
    const n = Math.max(3, Math.round(w / (h * 0.62)));
    const tw = w / n;
    ctx.fillStyle = '#fff8ea';
    ctx.strokeStyle = 'rgba(90,40,30,0.5)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < n; i++) {
      const tx = x - w / 2 + (i + 0.5) * tw;
      const t = (tx - (x - w / 2)) / w;
      const lipY = (1 - t) * (1 - t) * (y + fr) + 2 * t * (1 - t) * (y - h * 0.3) + t * t * (y + fr * 0.8);
      ctx.beginPath();
      ctx.moveTo(tx - tw * 0.52, lipY - 4);
      ctx.lineTo(tx + tw * 0.52, lipY - 4);
      ctx.lineTo(tx + tw * 0.08, lipY + h * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (o.bottomTeeth) {
      for (let i = 0; i < n - 1; i++) {
        const tx = x - w / 2 + (i + 1) * tw;
        const t = (tx - (x - w / 2)) / w;
        const lowY = (1 - t) * (1 - t) * (y + fr) + 2 * t * (1 - t) * (y + h * 1.25) + t * t * (y + fr * 0.8);
        ctx.beginPath();
        ctx.moveTo(tx - tw * 0.45, lowY + 4);
        ctx.lineTo(tx + tw * 0.45, lowY + 4);
        ctx.lineTo(tx - tw * 0.05, lowY - h * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  });
}

/** Chunky block letters (P, A, N only — enough for "PANNA"). (x,y) = top-left of the first glyph. */
function blockText(ctx: Ctx, text: string, x: number, y: number, h: number, gap: number, fill: string, shadowCol: string, wobble: number[] = []) {
  const w = h * 0.74;
  const t = h * 0.27;
  const glyph = (c: Ctx, ch: string) => {
    if (ch === 'P') {
      c.moveTo(0, h);
      c.lineTo(0, 0);
      c.lineTo(w * 0.5, 0);
      c.quadraticCurveTo(w * 0.98, 0, w * 0.98, h * 0.27);
      c.quadraticCurveTo(w * 0.98, h * 0.54, w * 0.5, h * 0.54);
      c.lineTo(0, h * 0.54);
    } else if (ch === 'A') {
      c.moveTo(0, h);
      c.lineTo(w * 0.42, 0);
      c.lineTo(w * 0.58, 0);
      c.lineTo(w, h);
      c.moveTo(w * 0.2, h * 0.66);
      c.lineTo(w * 0.8, h * 0.66);
    } else if (ch === 'N') {
      c.moveTo(0, h);
      c.lineTo(0, 0);
      c.lineTo(w, h);
      c.lineTo(w, 0);
    }
  };
  const passes: [string, number, number, number][] = [
    [shadowCol, t + 4.4, 1.6, 2],
    [INK, t + 3.6, 0, 0],
    [fill, t, 0, 0],
  ];
  for (const [col, lw, ox, oy] of passes) {
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(x + i * (w + gap) + w / 2 + ox, y + h / 2 + oy);
      ctx.rotate(wobble[i] ?? 0);
      ctx.translate(-w / 2, -h / 2);
      ctx.beginPath();
      glyph(ctx, text[i]);
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = col;
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** Soft translucent steam/pressure puff (no outline). */
function puff(ctx: Ctx, x: number, y: number, r: number, alpha = 0.75) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  circlePath(ctx, x, y, r);
  circlePath(ctx, x + r * 0.8, y + r * 0.2, r * 0.7);
  circlePath(ctx, x - r * 0.7, y + r * 0.3, r * 0.6);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// IL BARONE KETCHUP — pompous squeeze-bottle aristocrat.
// ---------------------------------------------------------------------------
const K_RED = '#e5352f', K_RED_SH = '#a5172b';
const K_SAUCE = '#c3172a', K_SAUCE_SH = '#86101f';
const K_HAT = '#352c3c', K_HAT_SH = '#1a1420', K_HAT_HI = '#6d6080';
const K_GOLD = '#f4c44f', K_GOLD_SH = '#b5852a';
const K_GLOVE = '#fbf8f0', K_GLOVE_SH = '#c9ccd9';
const K_CAP = '#f6f2ea', K_CAP_SH = '#c7c3cf';

function ketchupBottle(c: Ctx) {
  c.moveTo(-16, -62);
  c.bezierCurveTo(-17, -52, -36, -53, -41, -37);
  c.bezierCurveTo(-48, -13, -48, 16, -43, 28);
  c.quadraticCurveTo(-38.5, 37.5, -24, 38);
  c.lineTo(24, 38);
  c.quadraticCurveTo(38.5, 37.5, 43, 28);
  c.bezierCurveTo(48, 16, 48, -13, 41, -37);
  c.bezierCurveTo(36, -53, 17, -52, 16, -62);
  c.closePath();
}

/** Glove (white mitten with a cuff). */
function glove(ctx: Ctx, x: number, y: number, r: number, rot = 0) {
  shape(ctx, (c) => ellipsePath(c, x, y, r, r * 0.92, rot), { fill: K_GLOVE, ink: 2.2, shadow: K_GLOVE_SH, shadowOffset: [-r * 0.3, -r * 0.34], gloss: [{ x: x - r * 0.35, y: y - r * 0.4, rx: r * 0.3, ry: r * 0.18, rot: -0.5, alpha: 0.8 }] });
  line(ctx, [[x - r * 0.2, y - r * 0.1], [x + r * 0.35, y + r * 0.05]], 1.1, K_GLOVE_SH);
}

/** Rubber-hose arm (bottle red) from shoulder via elbow to the hand. */
function hoseArm(ctx: Ctx, pts: Pt[]) {
  inkLine(ctx, pts, 5.4, K_RED, true, 2.2);
  line(ctx, pts.map(([x, y]) => [x - 0.8, y - 0.9] as Pt), 1.4, '#ff8a76', true, 0.6);
}

function topHat(ctx: Ctx, x: number, y: number, rot: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // brim (back half), crown, band, brim front
  shape(ctx, (c) => ellipsePath(c, 0, 0, 31, 7.4), { fill: K_HAT, ink: BI * 0.85, shadow: K_HAT_SH, shadowOffset: [-2, -2] });
  const crown = (c: Ctx) => {
    c.moveTo(-18.4, -1);
    c.lineTo(-20.6, -45);
    c.quadraticCurveTo(0, -49.6, 20.6, -45);
    c.lineTo(18.4, -1);
    c.quadraticCurveTo(0, 3, -18.4, -1);
    c.closePath();
  };
  shape(ctx, crown, { fill: K_HAT, ink: BI * 0.85, shadow: K_HAT_SH, shadowOffset: [-5, -2], rim: K_HAT_HI, gloss: [{ x: -10, y: -26, rx: 2.6, ry: 14, rot: 0.04, alpha: 0.22 }] });
  shape(ctx, (c) => ellipsePath(c, 0, -45, 20.6, 4.6), { fill: '#4a3f52', ink: BI * 0.75, shadow: 'none', gloss: [{ x: -6, y: -46, rx: 8, ry: 1.4, alpha: 0.2 }] });
  // crimson band + gold buckle
  shape(ctx, (c) => {
    c.moveTo(-18.9, -12);
    c.quadraticCurveTo(0, -8, 18.9, -12);
    c.lineTo(18.4, -1.4);
    c.quadraticCurveTo(0, 2.6, -18.4, -1.4);
    c.closePath();
  }, { fill: '#b01c32', ink: 2, shadow: '#741126', shadowOffset: [-3, -1.2] });
  shape(ctx, (c) => roundRectPath(c, 5, -11.4, 8, 9, 1.6), { fill: K_GOLD, ink: 1.8, shadow: K_GOLD_SH, shadowOffset: [-1, -1] });
  shape(ctx, (c) => roundRectPath(c, 7.4, -9, 3.2, 4.2, 0.8), { fill: '#b01c32', ink: 0, shadow: 'none' });
  // brim front lip
  shape(ctx, (c) => {
    c.moveTo(-31, 0);
    c.quadraticCurveTo(-31, 7.6, 0, 7.4);
    c.quadraticCurveTo(31, 7.6, 31, 0);
    c.quadraticCurveTo(26, 2.6, 18.4, 2.2);
    c.quadraticCurveTo(0, 5, -18.4, 2.2);
    c.quadraticCurveTo(-26, 2.6, -31, 0);
    c.closePath();
  }, { fill: K_HAT, ink: BI * 0.85, shadow: K_HAT_SH, shadowOffset: [-2, -1.6], gloss: [{ x: -20, y: 2.4, rx: 6, ry: 1.2, rot: 0.1, alpha: 0.25 }] });
  ctx.restore();
}

/** Waxed handlebar moustache, centred at (x,y), half-width w; curl lifts the tips. */
function waxedMoustache(ctx: Ctx, x: number, y: number, w: number, curl: number) {
  const half = (sgn: number): Pt[] => [
    [x + sgn * 1, y + 0.6], [x + sgn * w * 0.3, y + 3.2], [x + sgn * w * 0.62, y + 1.4],
    [x + sgn * w * 0.86, y - 3.4 - curl], [x + sgn * w * 0.94, y - 9.4 - curl], [x + sgn * w * 0.8, y - 12.6 - curl], [x + sgn * w * 0.68, y - 10.4 - curl],
  ];
  const widths = [11, 9, 6.4, 4, 2.8, 2, 1];
  const build = (c: Ctx) => {
    smoothPath(c, ribbon(half(-1), widths), true, 0.5);
    smoothPath(c, ribbon(half(1), widths), true, 0.5);
    ellipsePath(c, x, y + 0.6, 6.4, 5.2);
  };
  shape(ctx, build, { fill: '#2f1d18', ink: 2.2, shadow: '#160b08', shadowOffset: [-1.2, -1.6], gloss: [{ x: x - w * 0.34, y: y + 0.4, rx: w * 0.16, ry: 1.2, rot: 0.15, alpha: 0.4 }, { x: x + w * 0.3, y: y + 0.4, rx: w * 0.14, ry: 1.1, rot: -0.15, alpha: 0.4 }] });
}

function drawKetchup(ctx: Ctx, f: number, pose: Pose) {
  const ph = (f / 4) * TAU;
  const s = Math.sin(ph), c4 = Math.cos(ph);
  const wind = pose === 'windup', atk = pose === 'attack';
  const idle = pose === 'idle';

  // --- tiny legs with white spats (not scaled with the body)
  for (const side of [-1, 1]) {
    const lift = idle ? Math.max(0, Math.sin(ph + (side < 0 ? 0 : Math.PI))) * 4 : wind ? 0 : side > 0 ? 3 : 0;
    const fx = side * (wind ? 21 : 17) + (idle ? Math.cos(ph + (side < 0 ? 0 : Math.PI)) * 3 : 0);
    const fy = 41.4 - lift;
    inkLine(ctx, [[side * 14, 24], [fx, fy - 2]], 5, '#3b2a30', false, 2);
    shape(ctx, (c) => ellipsePath(c, fx + side * 2.6 + 2, fy + 1.4, 8.2, 4.4), { fill: '#241a1f', ink: 2.2, shadow: 'none', gloss: [{ x: fx + side * 2.6, y: fy - 0.2, rx: 3, ry: 1.2, alpha: 0.45 }] });
    shape(ctx, (c) => roundRectPath(c, fx - 4.4, fy - 6.4, 8.8, 5.6, 2), { fill: K_GLOVE, ink: 1.8, shadow: K_GLOVE_SH, shadowOffset: [-1.4, -1] });
    ball(ctx, fx + 2.6, fy - 3.6, 0.9, '#2b2230', '#100a10', 0.6, 0.4);
  }

  // body squash & stretch around the base
  const sx = wind ? 1.08 : atk ? 0.92 : 1 + 0.014 * c4;
  const sy = wind ? 0.89 : atk ? 1.07 : 1 - 0.016 * c4;
  ctx.save();
  ctx.translate(0, 32);
  ctx.scale(sx, sy);
  ctx.translate(0, -38);

  // --- far arm (behind): hand on the hip, or squeezing in the wind-up
  if (!wind) {
    hoseArm(ctx, [[-42, -12], [-62 - s * 1.2, -4], [-50, 10]]);
  }

  // --- bottle body + bottom drip
  const bd = idle ? 5 + ((f % 4) * 2.6) : wind ? 4 : 9;
  group(ctx, [
    { build: ketchupBottle, style: { fill: K_RED, shadow: K_RED_SH, shadowOffset: [-8, -6], gloss: [{ x: -30, y: -12, rx: 4.4, ry: 18, rot: 0.08, alpha: 0.5 }, { x: -24, y: -38, rx: 4, ry: 2.4, rot: -0.6, alpha: 0.8 }, { x: -33, y: 14, rx: 1.8, ry: 5, rot: 0.1, alpha: 0.4 }] } },
    { build: (c) => dripPath(c, -20, 36, 8, bd, 3.6), style: { fill: K_SAUCE, shadow: 'none' } },
  ], BI);
  if (idle && f === 3) shape(ctx, (c) => dropPath(c, -20, 50, 2.6), { fill: K_SAUCE, ink: 1.8, shadow: 'none' });
  // rim light on the right edge (bottle plastic)
  clipped(ctx, ketchupBottle, () => {
    line(ctx, [[44, -6], [45, 14], [41, 30]], 2.2, '#ff7d6b', true, 0.55);
  });

  // --- heraldic label: cream shield, tomato with a little crown, laurels
  const shield = (c: Ctx) => {
    c.moveTo(-21, -1);
    c.quadraticCurveTo(0, -4, 21, -1);
    c.lineTo(21, 12);
    c.quadraticCurveTo(20, 27, 0, 33);
    c.quadraticCurveTo(-20, 27, -21, 12);
    c.closePath();
  };
  shape(ctx, shield, { fill: '#fbf0d8', ink: 2.4, shadow: '#dcc7a0', shadowOffset: [-3, -2] });
  clipped(ctx, shield, () => {
    ctx.save();
    ctx.translate(0, 1.6);
    ctx.scale(0.86, 0.86);
    ctx.beginPath();
    shield(ctx);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = K_GOLD_SH;
    ctx.stroke();
    ctx.restore();
  });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const lx = side * (13 - i * 0.6), ly = 22 - i * 4.6;
      shape(ctx, (c) => ellipsePath(c, lx, ly, 1.6, 3, side * (0.5 + i * 0.12)), { fill: '#5aa64a', ink: 0.9, shadow: 'none' });
    }
  }
  ball(ctx, 0, 16, 7.6, '#e2352d', '#a3182a', 2, 0.7);
  shape(ctx, (c) => {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * TAU;
      c.moveTo(0, 9.6);
      c.quadraticCurveTo(Math.cos(a - 0.4) * 3.4, 9.6 + Math.sin(a - 0.4) * 2.2, Math.cos(a) * 4.6, 9.6 + Math.sin(a) * 2.8);
      c.quadraticCurveTo(Math.cos(a + 0.4) * 3.4, 9.6 + Math.sin(a + 0.4) * 2.2, 0, 9.6);
    }
  }, { fill: '#4f9a3c', ink: 1.2, shadow: 'none' });
  shape(ctx, (c) => {
    c.moveTo(-5.4, 6.4);
    c.lineTo(-5.4, 1.4);
    c.lineTo(-2.7, 3.8);
    c.lineTo(0, 0.4);
    c.lineTo(2.7, 3.8);
    c.lineTo(5.4, 1.4);
    c.lineTo(5.4, 6.4);
    c.closePath();
  }, { fill: K_GOLD, ink: 1.4, shadow: K_GOLD_SH, shadowOffset: [-0.8, -0.8] });

  // --- face
  if (wind) {
    // squeezing with all his might: eyes shut, cheeks puffed
    squeezeEye(ctx, -15, -33, 6.4, -1);
    squeezeEye(ctx, 10, -33, 6.4, 1);
    brow(ctx, -15, -44, 14, 0.42, 3.6);
    brow(ctx, 10, -44, 14, -0.42, 3.6);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ff8f7e';
    ctx.beginPath();
    ellipsePath(ctx, -28, -20, 8, 5);
    ellipsePath(ctx, 23, -20, 7, 5);
    ctx.fill();
    ctx.restore();
    effortMarks(ctx, -2, -40, 40, -2.6, -0.6, 4, 7, 2.4);
  } else {
    // haughty: smug half-lid left eye, wide monocled right eye
    eye(ctx, -15, -33, 7, { look: atk ? [0.2, -0.2] : [0.42, 0.1], lid: atk ? 'none' : 'half', lidColor: '#c62632', pupil: atk ? 0.34 : 0.5, iris: '#3f86d6', ink: 2.2 });
    if (!atk) {
      ctx.save();
      ctx.beginPath();
      ellipsePath(ctx, -15, -33, 7.6, 8.6);
      ctx.clip();
      line(ctx, [[-23, -35.2], [-15, -34.4], [-7, -35.6]], 2.4, INK, true);
      ctx.restore();
    }
    eye(ctx, 10, -34, 8.2, { look: atk ? [0.2, -0.2] : [0.4, 0.1], pupil: atk ? 0.34 : 0.48, iris: '#3f86d6', ink: 2.2 });
    brow(ctx, -15.6, atk ? -47 : -45.4, 14, atk ? -0.3 : -0.28, 3.6);
    brow(ctx, 10.6, atk ? -49 : -47, 14, atk ? 0.1 : 0.24, 3.6);
  }
  // nose in the air
  shape(ctx, (c) => ellipsePath(c, -1.6, -24.6, 5.2, 4.4, -0.3), { fill: '#f0473f', ink: 2, shadow: K_RED_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: -3.4, y: -26.4, rx: 1.8, ry: 1.1, rot: -0.4, alpha: 0.85 }] });
  // mouth
  if (atk) {
    mouth(ctx, -2, -6, 20, 'shout', { teeth: true, tongue: true });
  } else if (wind) {
    line(ctx, [[-10, -8], [-2, -10], [7, -8]], 2.4, INK, true);
  } else {
    line(ctx, [[-9, -9.6], [-2, -8], [6, -11.6]], 2.4, INK, true);
  }
  // waxed moustache (tips bounce)
  waxedMoustache(ctx, -2, -16.4, 24, wind ? 3 : atk ? -2 : 1.4 * s);

  // --- monocle (pops out on the attack, dangling on its chain)
  const mx = atk ? 24 : 10, my = atk ? -12 : -34;
  if (!wind) {
    line(ctx, [[mx + 7, my + 9], [mx + 14, my + 18 + (idle ? s * 1.5 : 0)], [24, -1]], 3, INK, true);
    ctx.save();
    ctx.setLineDash([2.2, 1.6]);
    line(ctx, [[mx + 7, my + 9], [mx + 14, my + 18 + (idle ? s * 1.5 : 0)], [24, -1]], 1.4, K_GOLD, true);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    circlePath(ctx, mx, my, 11);
    ctx.fillStyle = 'rgba(210,235,255,0.18)';
    ctx.fill();
    ctx.lineWidth = 5.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = K_GOLD;
    ctx.stroke();
    ctx.restore();
    glint(ctx, mx - 4.4, my - 4.6, 3, 1.2, -0.7, 0.85);
    glint(ctx, mx + 3.6, my + 5, 1.2, 0.6, -0.7, 0.6);
  }

  // --- collar: white flip-top cap + black bow tie, drips oozing from under the hat
  shape(ctx, (c) => roundRectPath(c, -18.6, -76, 37.2, 15, 3), { fill: K_CAP, ink: BI * 0.85, shadow: K_CAP_SH, shadowOffset: [-4, -1.4] });
  for (let i = -3; i <= 3; i++) line(ctx, [[i * 4.6, -73.6], [i * 4.6, -63]], 1, '#bdb8c6', false, 0.9);
  if (atk) {
    // exposed nozzle
    shape(ctx, (c) => roundRectPath(c, -5, -84, 10, 9, 2), { fill: K_CAP, ink: 2.4, shadow: K_CAP_SH, shadowOffset: [-1.6, -1] });
  }
  const ooze = idle ? 2 + (f % 4) * 1.6 : wind ? 7 : 3;
  group(ctx, [
    { build: (c) => dripPath(c, 9, -64, 6.6, 12 + ooze, 3), style: { fill: K_SAUCE, shadow: K_SAUCE_SH, shadowOffset: [-1.2, -1.2], gloss: [{ x: 8, y: -58, rx: 1, ry: 2.4, alpha: 0.55 }] } },
    { build: (c) => dripPath(c, -12, -64, 5, 6 + ooze * 0.6, 2.4), style: { fill: K_SAUCE, shadow: K_SAUCE_SH, shadowOffset: [-1, -1] } },
  ], 2.2);
  shape(ctx, (c) => {
    c.moveTo(0, -60);
    c.lineTo(-11, -66);
    c.quadraticCurveTo(-13, -60, -11, -54);
    c.closePath();
    c.moveTo(0, -60);
    c.lineTo(11, -66);
    c.quadraticCurveTo(13, -60, 11, -54);
    c.closePath();
  }, { fill: '#2a2230', ink: 2.2, shadow: 'none', gloss: [{ x: -7, y: -62.5, rx: 2.4, ry: 1, rot: 0.4, alpha: 0.35 }, { x: 6, y: -62.5, rx: 2.4, ry: 1, rot: -0.4, alpha: 0.35 }] });
  ball(ctx, 0, -60, 3.4, '#2a2230', '#100a10', 2, 0.35);

  // --- the far arm squeezes in the wind-up (in front of the body)
  if (wind) {
    hoseArm(ctx, [[-42, -14], [-58, -2], [-46, 6]]);
    glove(ctx, -43, 6, 7.2, 0.3);
  } else {
    glove(ctx, -48, 10, 6.6, -0.4);
  }
  ctx.restore();

  // --- top hat (pops off on the attack)
  const hatLift = wind ? -4 + (f % 2) : atk ? -14 : 0.8 * Math.max(0, -c4);
  const hatTilt = wind ? 0.02 : atk ? -0.55 : 0.08 + s * 0.02;
  const topY = 32 - (38 + 76) * (wind ? 0.89 : atk ? 1.07 : 1 - 0.016 * c4);
  if (atk) {
    // SPLURT: ketchup jet from the nozzle
    const jet: Pt[] = [[0, topY - 8], [6, topY - 26], [20, topY - 40], [38, topY - 46], [54, topY - 44]];
    group(ctx, [
      { build: (c) => smoothPath(c, ribbon(jet, [9, 12, 14, 16, 18]), true, 0.5), style: { fill: K_SAUCE, shadow: K_SAUCE_SH, shadowOffset: [-2.6, -2.6], gloss: [{ x: 14, y: topY - 36, rx: 7, ry: 1.6, rot: -0.7, alpha: 0.45 }] } },
      { build: (c) => circlePath(c, 58, topY - 44, 11), style: { fill: K_SAUCE, shadow: K_SAUCE_SH, shadowOffset: [-2.4, -2.4] } },
    ], BI * 0.8);
    for (const [dx, dy, r] of [[66, -54, 3.6], [42, -58, 2.8], [66, -24, 2.6], [28, -50, 2]] as [number, number, number][]) {
      shape(ctx, (c) => circlePath(c, dx, topY + dy + 8, r), { fill: K_SAUCE, ink: 2, shadow: 'none', gloss: [{ x: dx - r * 0.3, y: topY + dy + 8 - r * 0.3, rx: r * 0.35, ry: r * 0.2, alpha: 0.6 }] });
    }
  }
  topHat(ctx, atk ? -30 : 0, atk ? topY - 6 : topY - 1 + hatLift, atk ? -0.45 : hatTilt, atk ? 0.92 : 1);
  if (atk) effortMarks(ctx, -30, topY - 28, 30, 1.9, 3.0, 3, 7, 2.4);

  // --- near arm + cane
  if (wind) {
    // cane raised high, about to strike
    hoseArm(ctx, [[40, -14], [58, -36], [62, -58]]);
    ctx.save();
    ctx.translate(62, -58);
    ctx.rotate(-0.5);
    inkLine(ctx, [[0, 0], [0, -46]], 3.6, '#2a2230', false, 2.2);
    ball(ctx, 0, 6, 5, K_GOLD, K_GOLD_SH, 2.2, 0.8);
    shape(ctx, (c) => roundRectPath(c, -2.6, -50, 5.2, 6, 1.4), { fill: '#e8e4dc', ink: 2, shadow: 'none' });
    ctx.restore();
    glove(ctx, 62, -58, 7.2, -0.2);
    effortMarks(ctx, 50, -100, 22, -2.2, -0.6, 3, 6, 2.2);
  } else if (atk) {
    // cane thrust forward: "Charge!"
    hoseArm(ctx, [[40, -18], [56, -22], [64, -32]]);
    inkLine(ctx, [[58, -24], [70, -50]], 3.6, '#2a2230', false, 2.2);
    ball(ctx, 60, -28, 5, K_GOLD, K_GOLD_SH, 2.2, 0.8);
    glove(ctx, 64, -32, 7, -0.6);
  } else {
    const tap = f === 1 ? 4 : f === 2 ? 1.5 : 0;
    const hx = 58, hy = 2 - tap;
    hoseArm(ctx, [[41, -18], [58 + s, -12], [hx, hy]]);
    inkLine(ctx, [[hx + 2, hy - 2], [hx + 7.4, 44 - tap]], 3.6, '#2a2230', false, 2.2);
    line(ctx, [[hx + 1.2, hy], [hx + 6, 38 - tap]], 1, '#6a5a76', false, 0.8);
    shape(ctx, (c) => roundRectPath(c, hx + 4.8, 38.6 - tap, 5.4, 6.4, 1.6), { fill: '#e8e4dc', ink: 2, shadow: 'none' });
    ball(ctx, hx + 1.6, hy - 4, 5, K_GOLD, K_GOLD_SH, 2.2, 0.8);
    glove(ctx, hx, hy, 6.8, 0.2);
  }
}

// ---------------------------------------------------------------------------
// IL BARATTOLO ALFREDO — hulking glass jar of gloop with a gold crown-lid.
// ---------------------------------------------------------------------------
const A_SAUCE = '#f7edd2', A_SAUCE_SH = '#dccaa0', A_SAUCE_HI = '#fffbf0';
const A_GOLD = '#f2c14e', A_GOLD_SH = '#b5852a', A_GOLD_HI = '#fff0b4';
const A_PASTA = '#f4d585', A_PASTA_SH = '#c9a14d';

function alfredoJar(c: Ctx) {
  c.moveTo(-38, -50);
  c.lineTo(38, -50);
  c.quadraticCurveTo(52, -48, 53, -34);
  c.bezierCurveTo(58, -8, 58, 26, 53, 43);
  c.quadraticCurveTo(50, 53, 37, 53);
  c.lineTo(-37, 53);
  c.quadraticCurveTo(-50, 53, -53, 43);
  c.bezierCurveTo(-58, 26, -58, -8, -53, -34);
  c.quadraticCurveTo(-52, -48, -38, -50);
  c.closePath();
}

/** One flat fettuccine ribbon along a centre line. */
function fettuccine(ctx: Ctx, pts: Pt[], w: number, seed: number) {
  const ws = pts.map((_, i) => (i === pts.length - 1 ? w * 0.8 : w * (0.5 + 0.5 * Math.abs(Math.cos(i * 1.35 + seed * 0.7)))));
  const build = (c: Ctx) => smoothPath(c, ribbon(pts, ws), true, 0.5);
  shape(ctx, build, { fill: A_PASTA, ink: 2.2, shadow: A_PASTA_SH, shadowOffset: [-1.8, -1.8] });
  clipped(ctx, build, () => {
    // flat ribbon: a pale lit face and a darker turned edge
    const side = ribbon(pts, ws.map((v) => v * 0.55));
    const half = side.slice(0, pts.length);
    line(ctx, half, w * 0.2, '#fff3c8', true, 0.85);
    line(ctx, side.slice(pts.length), w * 0.14, A_PASTA_SH, true, 0.7);
    speckle(ctx, pts[2][0], pts[2][1], 14, 14, 5, A_SAUCE_HI, w * 0.22, seed, 0.95);
  });
}

/** A noodle arm: two fettuccine strands with splayed noodle "fingers". */
function noodleArm(ctx: Ctx, pts: Pt[], seed: number) {
  const n = pts.length;
  const end = pts[n - 1], prev = pts[n - 2];
  const a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  for (const k of [-1, 0, 1]) {
    const fa = a + k * 0.55;
    fettuccine(ctx, [prev, end, [end[0] + Math.cos(fa) * 8, end[1] + Math.sin(fa) * 8], [end[0] + Math.cos(fa) * 13, end[1] + Math.sin(fa) * 13 + 2]], 4.6, seed + k);
  }
  fettuccine(ctx, pts.map(([x, y], i) => [x - 3.6 + i * 0.4, y + 2.6] as Pt), 9, seed + 7);
  fettuccine(ctx, pts, 9.6, seed + 11);
}

function crownLid(ctx: Ctx, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // back crown points
  for (const a of [Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75]) {
    const px = Math.cos(a) * 40, py = -17 + Math.sin(a) * 8;
    shape(ctx, (c) => {
      c.moveTo(px - 7, py + 2);
      c.lineTo(px, py - 12);
      c.lineTo(px + 7, py + 2);
      c.closePath();
    }, { fill: A_GOLD_SH, ink: 2.4, shadow: 'none' });
    ball(ctx, px, py - 13, 2.4, '#fbf4e6', '#cfc4b0', 1.6, 0.8);
  }
  // ribbed band
  const band = (c: Ctx) => {
    c.moveTo(-44, -16);
    c.lineTo(-44, 0);
    c.quadraticCurveTo(0, 11, 44, 0);
    c.lineTo(44, -16);
    c.closePath();
  };
  shape(ctx, band, { fill: A_GOLD, ink: BI, shadow: A_GOLD_SH, shadowOffset: [-7, -2], gloss: [{ x: -28, y: -6, rx: 4, ry: 7, alpha: 0.5, color: A_GOLD_HI }] });
  clipped(ctx, band, () => {
    for (let i = -10; i <= 10; i++) {
      const bx = i * 4.2;
      line(ctx, [[bx, -18], [bx, 12]], 1.2, A_GOLD_SH, false, 0.55 + (i > 4 ? 0.2 : 0));
    }
  });
  // top
  shape(ctx, (c) => ellipsePath(c, 0, -16, 44, 9), { fill: '#f7d469', ink: BI, shadow: 'none', gloss: [{ x: -14, y: -19, rx: 14, ry: 2.6, alpha: 0.45, color: A_GOLD_HI }] });
  shape(ctx, (c) => ellipsePath(c, 0, -16, 34, 6), { fill: '#efc14f', ink: 0, shadow: 'none' });
  // front crown points with pearls
  for (const a of [Math.PI * 0.12, Math.PI * 0.31, Math.PI * 0.5, Math.PI * 0.69, Math.PI * 0.88]) {
    const px = Math.cos(a) * 41, py = -16 + Math.sin(a) * 9;
    const big = Math.abs(a - Math.PI / 2) < 0.1;
    const hgt = big ? 19 : 14;
    shape(ctx, (c) => {
      c.moveTo(px - 8, py + 2);
      c.lineTo(px, py - hgt);
      c.lineTo(px + 8, py + 2);
      c.closePath();
    }, { fill: A_GOLD, ink: 2.6, shadow: A_GOLD_SH, shadowOffset: [-2.4, -1], gloss: [{ x: px - 2.6, y: py - hgt * 0.4, rx: 1.2, ry: 4, alpha: 0.5, color: A_GOLD_HI }] });
    ball(ctx, px, py - hgt - 1.4, big ? 3.4 : 2.6, '#fbf4e6', '#cfc4b0', 1.8, 0.85);
  }
  // ruby on the band
  shape(ctx, (c) => {
    c.moveTo(4, -9);
    c.lineTo(10, -4);
    c.lineTo(4, 3);
    c.lineTo(-2, -4);
    c.closePath();
  }, { fill: '#e2304a', ink: 2, shadow: '#97162d', shadowOffset: [-1.4, -1], gloss: [{ x: 3, y: -5, rx: 1.4, ry: 1, alpha: 0.9 }] });
  ctx.restore();
}

function drawAlfredo(ctx: Ctx, f: number, pose: Pose) {
  const ph = (f / 4) * TAU;
  const s = Math.sin(ph), c4 = Math.cos(ph);
  const wind = pose === 'windup', atk = pose === 'attack';
  const idle = pose === 'idle';
  const tilt = wind ? -0.11 : atk ? 0.13 : s * 0.035;

  // rock on the bottom corner that stays on the ground
  const pivX = tilt < 0 ? -50 : 50;
  ctx.save();
  ctx.translate(pivX, 53);
  ctx.rotate(tilt);
  ctx.translate(-pivX, -53);

  // --- far noodle arm (behind the jar, seen through the glass)
  const wv = idle ? s * 3 : 0;
  if (wind) noodleArm(ctx, [[-36, -52], [-50, -64], [-56, -80], [-50, -96], [-38, -104]], 3);
  else if (atk) noodleArm(ctx, [[-36, -52], [-52, -58], [-62, -46], [-66, -28], [-70, -14]], 3);
  else noodleArm(ctx, [[-36, -52], [-52, -58], [-60, -46], [-62 - wv * 0.3, -26], [-63 - wv, -10], [-64 - wv * 1.2, 2]], 3);

  // --- glass + sauce
  ctx.save();
  ctx.beginPath();
  alfredoJar(ctx);
  ctx.fillStyle = 'rgba(205,234,242,0.42)';
  ctx.fill();
  ctx.restore();
  // slosh: surface tilts against the motion
  const slT = wind ? 0.32 : atk ? -0.3 : -s * 0.12;
  const slA = idle ? 2.4 : 4;
  const surfY = wind ? -26 : -24;
  const surf = (x: number) => surfY + slT * x + slA * Math.sin(x * 0.09 + ph * 1 + 0.6);
  const sauce = (c: Ctx) => {
    c.moveTo(-60, surf(-60));
    for (let x = -56; x <= 60; x += 4) c.lineTo(x, surf(x));
    c.lineTo(60, 60);
    c.lineTo(-60, 60);
    c.closePath();
  };
  clipped(ctx, alfredoJar, () => {
    // sauce smears on the glass above the surface
    ctx.fillStyle = rgba(A_SAUCE, 0.75);
    ctx.beginPath();
    for (const [x0, len, w] of [[-40, 14, 5], [-22, 9, 4], [26, 18, 6], [42, 10, 4]] as [number, number, number][]) {
      dripPath(ctx, x0, surf(x0) - len - 4, w, len + 6, w * 0.45);
    }
    ctx.fill();
    ctx.beginPath();
    sauce(ctx);
    ctx.fillStyle = A_SAUCE;
    ctx.fill();
    // body shading: darker toward the bottom/right (inside the jar)
    const g = ctx.createLinearGradient(-50, 0, 56, 30);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.6, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba(A_SAUCE_SH, 0.9));
    ctx.fillStyle = g;
    ctx.fill();
    // surface lip (top of the liquid seen slightly from above)
    ctx.beginPath();
    for (let x = -60; x <= 60; x += 4) {
      if (x === -60) ctx.moveTo(x, surf(x));
      else ctx.lineTo(x, surf(x));
    }
    for (let x = 60; x >= -60; x -= 4) ctx.lineTo(x, surf(x) + 5 + Math.cos(x * 0.05) * 2);
    ctx.closePath();
    ctx.fillStyle = A_SAUCE_HI;
    ctx.fill();
    line(ctx, Array.from({ length: 31 }, (_, i) => { const x = -60 + i * 4; return [x, surf(x) + 5 + Math.cos(x * 0.05) * 2] as Pt; }), 1.8, A_SAUCE_SH, false, 0.9);
    // pepper + parsley flecks
    speckle(ctx, 0, 22, 50, 26, 40, '#3a2d26', 0.7, 41, 0.75);
    speckle(ctx, 0, 22, 50, 26, 18, '#5c9a3e', 0.8, 43, 0.8);
    // gloopy bubbles
    for (const [bx, by, br] of [[-34, 38, 3.6], [30, 44, 2.6], [40, 14, 2], [-44, 6, 2.4]] as [number, number, number][]) {
      ctx.beginPath();
      circlePath(ctx, bx, by + (idle ? Math.sin(ph + bx) * 1.4 : 0), br);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = rgba(A_SAUCE_SH, 0.9);
      ctx.stroke();
      glint(ctx, bx - br * 0.3, by - br * 0.35 + (idle ? Math.sin(ph + bx) * 1.4 : 0), br * 0.35, br * 0.22, -0.6, 0.9);
    }
  });

  // --- angry face in the sauce (bobs with the slosh)
  const fy = idle ? s * 1.2 : wind ? -2 : 2;
  const fx = atk ? 4 : wind ? -3 : 0;
  if (wind) {
    eye(ctx, -19 + fx, -2 + fy, 10, { look: [0.35, 0.05], lid: 'angry-l', pupil: 0.36, iris: '#7d9a3a', ink: 2.4 });
    eye(ctx, 16 + fx, -4 + fy, 10, { look: [0.35, 0.05], lid: 'angry-r', pupil: 0.36, iris: '#7d9a3a', ink: 2.4 });
  } else {
    eye(ctx, -19 + fx, -2 + fy, 10, { look: [0.35, 0.12], lid: 'angry-l', pupil: 0.46, iris: '#7d9a3a', ink: 2.4 });
    eye(ctx, 16 + fx, -4 + fy, 10, { look: [0.35, 0.12], lid: 'angry-r', pupil: 0.46, iris: '#7d9a3a', ink: 2.4 });
  }
  brow(ctx, -19 + fx, -16 + fy, 20, 0.45, 5);
  brow(ctx, 16 + fx, -18 + fy, 20, -0.45, 5);
  if (idle) bossMouth(ctx, -1 + fx, 22 + fy, 36, 11, { frown: 0.5, bottomTeeth: true, ink: 2.8 });
  else if (wind) {
    // gritted teeth
    const gm = (c: Ctx) => roundRectPath(c, -17 + fx, 18 + fy, 32, 11, 5);
    shape(ctx, gm, { fill: '#fff8ea', ink: 2.8, shadow: 'none' });
    clipped(ctx, gm, () => {
      line(ctx, [[-17 + fx, 23.5 + fy], [15 + fx, 23.5 + fy]], 1.6, INK);
      for (let i = 1; i < 6; i++) line(ctx, [[-17 + fx + i * 5.4, 18 + fy], [-17 + fx + i * 5.4, 29 + fy]], 1.2, 'rgba(90,40,30,0.6)');
    });
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    dropPath(ctx, 34 + fx, -18 + fy, 3);
    ctx.fill();
    ctx.restore();
  } else mouth(ctx, -1 + fx, 24 + fy, 34, 'shout', { teeth: true, tongue: true, open: 1.15 });

  // --- glass: reflections, outline, rim light
  clipped(ctx, alfredoJar, () => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    roundRectPath(ctx, -46, -36, 8, 70, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    roundRectPath(ctx, -35, -30, 3.4, 52, 1.7);
    roundRectPath(ctx, 40, -20, 4.4, 40, 2.2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ellipsePath(ctx, -40, -42, 7, 2.4, -0.25);
    ellipsePath(ctx, 44, 40, 3, 1.4, -0.9);
    ctx.fill();
    // glass thickness: pale rim just inside the outline
    ctx.beginPath();
    alfredoJar(ctx);
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(232,250,255,0.35)';
    ctx.stroke();
  });
  ctx.save();
  ctx.beginPath();
  alfredoJar(ctx);
  ctx.lineWidth = BI * 2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
  // screw threads at the neck
  shape(ctx, (c) => {
    c.moveTo(-40, -58);
    c.lineTo(40, -58);
    c.lineTo(40, -48);
    c.quadraticCurveTo(0, -44, -40, -48);
    c.closePath();
  }, { fill: 'rgba(225,244,250,0.9)', ink: BI * 0.8, shadow: '#a9c6d0', shadowOffset: [-6, -1.5] });
  line(ctx, [[-38, -54], [0, -51.6], [38, -54]], 1.4, '#9bb9c4', true, 0.9);

  // sauce oozing out under the lid and down the outside of the glass
  const oz = idle ? [0, 3, 6, 9][f] : wind ? 10 : 4;
  group(ctx, [
    { build: (c) => dripPath(c, -30, -50, 9, 14 + oz, 3.8), style: { fill: A_SAUCE, shadow: A_SAUCE_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: -31.4, y: -44, rx: 1.2, ry: 3, alpha: 0.9 }] } },
    { build: (c) => dripPath(c, 24, -50, 7, 8 + oz * 0.6, 3), style: { fill: A_SAUCE, shadow: A_SAUCE_SH, shadowOffset: [-1.4, -1.4] } },
  ], 2.4);

  // --- crown lid (rattles in the wind-up; flips off on the attack, drawn below)
  if (!atk) {
    const rattle = wind ? (f === 0 ? -5 : -4) : idle ? Math.max(0, s) * -1.2 : 0;
    crownLid(ctx, 0, -55 + rattle, (wind ? 0.06 : -0.09) + (idle ? c4 * 0.015 : 0));
    if (wind) {
      for (const [px, py, r] of [[-50, -64, 7], [-60, -74, 5], [50, -66, 7], [60, -77, 5]] as [number, number, number][]) puff(ctx, px, py, r, 0.7);
      effortMarks(ctx, 0, -78, 44, -2.7, -0.45, 5, 7, 2.6);
    }
  }

  // --- near noodle arm
  if (wind) noodleArm(ctx, [[36, -52], [50, -64], [58, -78], [54, -92], [43, -100]], 5);
  else if (atk) noodleArm(ctx, [[36, -52], [50, -50], [58, -38], [60, -22], [62, -8]], 5);
  else noodleArm(ctx, [[36, -52], [52, -58], [60, -46], [62 + wv * 0.3, -26], [63 + wv, -10], [64 + wv * 1.2, 2]], 5);

  ctx.restore();

  if (atk) {
    // lid flips off; a geyser of Alfredo erupts forward
    crownLid(ctx, -30, -84, -0.55);
    effortMarks(ctx, -30, -92, 40, 2.2, 3.3, 3, 8, 2.4);
    const g: Pt[] = [[14, -60], [20, -76], [32, -88], [48, -92], [64, -88]];
    group(ctx, [
      { build: (c) => smoothPath(c, ribbon(g, [42, 34, 28, 24, 20]), true, 0.5), style: { fill: A_SAUCE, shadow: A_SAUCE_SH, shadowOffset: [-4, -4], gloss: [{ x: 22, y: -84, rx: 9, ry: 2, rot: -0.5, alpha: 0.8 }] } },
      { build: (c) => circlePath(c, 66, -88, 11), style: { fill: A_SAUCE, shadow: A_SAUCE_SH, shadowOffset: [-2.6, -2.6] } },
    ], BI * 0.85);
    for (const [dx, dy, r] of [[74, -106, 4], [54, -112, 3], [78, -70, 3.4], [36, -108, 2.4]] as [number, number, number][]) {
      shape(ctx, (c) => circlePath(c, dx, dy, r), { fill: A_SAUCE, ink: 2, shadow: 'none', gloss: [{ x: dx - r * 0.3, y: dy - r * 0.3, rx: r * 0.35, ry: r * 0.2, alpha: 0.7 }] });
    }
  }
}


// ---------------------------------------------------------------------------
// LA PANNA COLOSSALE — a colossal carton of heavy cream with an angry cow label.
// ---------------------------------------------------------------------------
const P_BLUE = '#3a8ae0', P_BLUE_SH = '#2559a8', P_BLUE_DK = '#1d3f80';
const P_WHITE = '#f8fafc', P_WHITE_SH = '#c8d3e2';
const P_CREAM = '#fffdf5', P_CREAM_SH = '#e2dccb';
const P_SKY = '#d8ecfb';

function cowLeg(ctx: Ctx, hip: Pt, foot: Pt, patch: boolean) {
  inkLine(ctx, [hip, [foot[0], foot[1] - 4]], 11, '#f7f5f0', false, BI * 0.75);
  if (patch) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hip[0] - 5.2, hip[1] + 2);
    ctx.lineTo(hip[0] + 5.2, hip[1] + 2);
    ctx.lineTo(foot[0] + 5.2, foot[1] - 4);
    ctx.lineTo(foot[0] - 5.2, foot[1] - 4);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#2b2630';
    ctx.beginPath();
    ellipsePath(ctx, (hip[0] + foot[0]) / 2 + 2, (hip[1] + foot[1]) / 2 - 1, 4.4, 3.6, 0.4);
    ctx.fill();
    ctx.restore();
  }
  shape(ctx, (c) => {
    c.moveTo(foot[0] - 7.4, foot[1] - 4);
    c.lineTo(foot[0] + 7.4, foot[1] - 4);
    c.quadraticCurveTo(foot[0] + 8.6, foot[1] + 3.4, foot[0] + 5, foot[1] + 3.4);
    c.lineTo(foot[0] - 5, foot[1] + 3.4);
    c.quadraticCurveTo(foot[0] - 8.6, foot[1] + 3.4, foot[0] - 7.4, foot[1] - 4);
    c.closePath();
  }, { fill: '#3d3440', ink: BI * 0.75, shadow: '#1f1a22', shadowOffset: [-1.6, -1.4], gloss: [{ x: foot[0] - 2.4, y: foot[1] - 2, rx: 2.8, ry: 0.9, alpha: 0.35 }] });
  line(ctx, [[foot[0] + 0.6, foot[1] - 3.4], [foot[0] + 0.6, foot[1] + 3]], 1.4, '#1f1a22');
}

function drawPanna(ctx: Ctx, f: number, pose: Pose) {
  const ph = (f / 4) * TAU;
  const s = Math.sin(ph), c4 = Math.cos(ph);
  const wind = pose === 'windup', atk = pose === 'attack';
  const idle = pose === 'idle';
  const L = -56, R = 30, T = -100, B = 30, rr = 6;

  // --- legs: one back leg (under the side face), two front cow legs
  const step = (k: number) => (idle ? Math.max(0, Math.sin(ph + k * Math.PI)) * 5 : 0);
  const sp = wind ? 7 : 0;
  cowLeg(ctx, [46, 12], [49 + (idle ? Math.cos(ph + Math.PI) * 2 : 0), 46 - step(1)], false);
  cowLeg(ctx, [-36, 22], [-38 - sp + (idle ? Math.cos(ph) * 3 : 0), 53.4 - step(0)], true);
  cowLeg(ctx, [12, 22], [14 + sp + (idle ? Math.cos(ph + Math.PI) * 3 : 0), 53.4 - step(1)], false);

  // --- carton (squash & stretch around its base)
  const sx = wind ? 1.07 : atk ? 0.93 : 1 + 0.012 * c4;
  const sy = wind ? 0.93 : atk ? 1.06 : 1 - 0.012 * c4;
  ctx.save();
  ctx.translate(0, B);
  ctx.scale(sx, sy);
  ctx.translate(0, -B);

  const b = wind ? 10 : atk ? 0.5 : 4 + c4 * 0.8;
  const front = (c: Ctx) => {
    c.moveTo(L + rr, T);
    c.quadraticCurveTo((L + R) / 2, T - b, R - rr, T);
    c.quadraticCurveTo(R, T, R, T + rr);
    c.quadraticCurveTo(R + b, (T + B) / 2, R, B - rr);
    c.quadraticCurveTo(R, B, R - rr, B);
    c.quadraticCurveTo((L + R) / 2, B + b * 0.6, L + rr, B);
    c.quadraticCurveTo(L, B, L, B - rr);
    c.quadraticCurveTo(L - b, (T + B) / 2, L, T + rr);
    c.quadraticCurveTo(L, T, L + rr, T);
    c.closePath();
  };
  const side = (c: Ctx) => {
    c.moveTo(R - 2, T + 1);
    c.lineTo(R + 26, T - 13);
    c.quadraticCurveTo(R + 28, T - 12, R + 28, T - 8);
    c.quadraticCurveTo(R + 28 + b * 0.7, (T + B) / 2 - 8, R + 28, B - 18);
    c.quadraticCurveTo(R + 27, B - 14, R + 22, B - 10);
    c.lineTo(R - 2, B - 1);
    c.closePath();
  };
  const top = (c: Ctx) => {
    c.moveTo(L + 2, T + 1);
    c.lineTo(L + 26, T - 13);
    c.lineTo(R + 26, T - 13);
    c.lineTo(R - 2, T + 1);
    c.closePath();
  };
  group(ctx, [
    { build: top, style: { fill: '#eef3f9', shadow: 'none' } },
    { build: side, style: { fill: P_BLUE_SH, shadow: P_BLUE_DK, shadowOffset: [-4, -6] } },
    { build: front, style: { fill: P_WHITE, shadow: 'none' } },
  ], BI);
  // side-face waves + folded flap
  clipped(ctx, side, () => {
    for (let k = 0; k < 4; k++) {
      const y0 = T + 10 + k * 30;
      line(ctx, [[R, y0 + 10], [R + 8, y0 + 2], [R + 16, y0 + 6], [R + 30, y0 - 6]], 3, '#5d9fe6', true, 0.55);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    roundRectPath(ctx, R + 3, T - 6, 4, 120, 2);
    ctx.fill();
  });
  shape(ctx, (c) => {
    c.moveTo(R + 4, T - 2);
    c.lineTo(R + 24, T - 12);
    c.lineTo(R + 20, T + 6);
    c.closePath();
  }, { fill: '#4d95e4', ink: 2, shadow: 'none' });
  // sealed seam strip on the top face
  shape(ctx, (c) => {
    c.moveTo(L + 12, T - 6.5);
    c.lineTo(R + 14, T - 6.5);
    c.lineTo(R + 18, T - 9.5);
    c.lineTo(L + 16, T - 9.5);
    c.closePath();
  }, { fill: '#dfe7f1', ink: 1.8, shadow: 'none' });

  // front face design: blue top band, sky panel, hills, blue bottom wave
  clipped(ctx, front, () => {
    ctx.fillStyle = P_BLUE;
    ctx.fillRect(L - 20, T - 20, 140, 46);
    ctx.fillStyle = P_SKY;
    ctx.fillRect(L - 20, T + 26, 140, 110);
    ctx.fillStyle = '#7cc35a';
    ctx.beginPath();
    ctx.moveTo(L - 20, B - 32);
    ctx.quadraticCurveTo(-36, B - 44, -14, B - 34);
    ctx.quadraticCurveTo(10, B - 46, R + 20, B - 34);
    ctx.lineTo(R + 20, B + 20);
    ctx.lineTo(L - 20, B + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P_BLUE;
    ctx.beginPath();
    ctx.moveTo(L - 20, B - 18);
    for (let x = L - 20; x <= R + 20; x += 6) ctx.quadraticCurveTo(x + 3, B - 14 - 4 * Math.sin(x * 0.3), x + 6, B - 18);
    ctx.lineTo(R + 20, B + 30);
    ctx.lineTo(L - 20, B + 30);
    ctx.closePath();
    ctx.fill();
    line(ctx, Array.from({ length: 16 }, (_, i) => [L - 4 + i * 6, B - 19 + 2.4 * Math.sin(i * 1.7)] as Pt), 3, '#ffffff', true, 0.95);
    // cel shadow on the right of the front face + a glossy streak
    ctx.fillStyle = 'rgba(37,89,168,0.22)';
    ctx.beginPath();
    roundRectPath(ctx, R - 9, T, 20, 140, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    roundRectPath(ctx, L + 4, T + 32, 4, 60, 2);
    ctx.fill();
  });
  line(ctx, [[L + rr, T], [R - rr, T]], 2.4, INK);
  line(ctx, [[R, T + rr], [R + b * 0.5, (T + B) / 2], [R, B - rr]], 2.4, INK, true);
  blockText(ctx, 'PANNA', -41, T + 5, 14.4, 3.4, '#ffffff', P_BLUE_DK, idle ? [0.05 * s, -0.04, 0.05 * c4, -0.05 * s, 0.04] : [0.08, -0.08, 0.06, -0.08, 0.1]);

  // --- the angry cow on the label
  const cx = -12, cy = -38;
  for (const sgn of [-1, 1]) {
    shape(ctx, (c) => {
      c.moveTo(cx + sgn * 18, cy - 20);
      c.quadraticCurveTo(cx + sgn * 30, cy - 26, cx + sgn * 32, cy - 40);
      c.quadraticCurveTo(cx + sgn * 24, cy - 30, cx + sgn * 13, cy - 26);
      c.closePath();
    }, { fill: '#f3e7c9', ink: 2.4, shadow: '#cdbb92', shadowOffset: [-1.4, -1.4] });
    shape(ctx, (c) => ellipsePath(c, cx + sgn * 33, cy - 12, 10, 5, sgn * 0.35), { fill: '#f7f5f0', ink: 2.4, shadow: '#cfd0d6', shadowOffset: [-1.4, -1.4] });
    shape(ctx, (c) => ellipsePath(c, cx + sgn * 34, cy - 11.4, 6, 2.6, sgn * 0.35), { fill: '#f4a3b0', ink: 0, shadow: 'none' });
  }
  const head = (c: Ctx) => ellipsePath(c, cx, cy - 4, 27, 24);
  shape(ctx, head, { fill: '#fbfbf8', ink: BI * 0.85, shadow: '#cfd3dc', shadowOffset: [-4, -3] });
  clipped(ctx, head, () => {
    ctx.fillStyle = '#2b2630';
    ctx.beginPath();
    smoothPath(ctx, [[cx - 30, cy - 30], [cx - 14, cy - 28], [cx - 8, cy - 18], [cx - 16, cy - 8], [cx - 30, cy - 6]], true);
    smoothPath(ctx, [[cx + 10, cy - 30], [cx + 24, cy - 26], [cx + 30, cy - 14], [cx + 18, cy - 16], [cx + 12, cy - 22]], true);
    ctx.fill();
  });
  const snY = cy + 12;
  shape(ctx, (c) => ellipsePath(c, cx + 1, snY, 21, 12), { fill: '#f6a9b6', ink: BI * 0.8, shadow: '#d97f92', shadowOffset: [-3, -2.4], gloss: [{ x: cx - 7, y: snY - 6, rx: 6, ry: 2, rot: -0.1, alpha: 0.55 }] });
  const flare = wind ? 1.4 : atk ? 1.25 : 1 + Math.max(0, s) * 0.15;
  for (const sgn of [-1, 1]) {
    shape(ctx, (c) => ellipsePath(c, cx + 1 + sgn * 8, snY - 3, 2.8 * flare, 3.8 * flare, sgn * 0.3), { fill: '#7a2b3c', ink: 1.6, shadow: 'none' });
  }
  if (wind) {
    puff(ctx, cx - 16, snY + 5, 5.4, 0.85);
    puff(ctx, cx + 20, snY + 5, 5.4, 0.85);
    squeezeEye(ctx, cx - 11, cy - 10, 7, -1);
    squeezeEye(ctx, cx + 12, cy - 10, 7, 1);
    line(ctx, [[cx - 6, snY + 8], [cx + 8, snY + 8]], 2.4, '#7a2b3c');
  } else {
    eye(ctx, cx - 11, cy - 10, 7.4, { look: [0.42, 0.12], lid: 'angry-l', pupil: atk ? 0.36 : 0.5, ink: 2.2 });
    eye(ctx, cx + 12, cy - 11, 7.4, { look: [0.42, 0.12], lid: 'angry-r', pupil: atk ? 0.36 : 0.5, ink: 2.2 });
    if (atk) bossMouth(ctx, cx + 1, snY + 5, 20, 9, { frown: 0.1, tongue: true, bottomTeeth: true, ink: 2.4 });
    else line(ctx, [[cx - 7, snY + 7.4], [cx + 1, snY + 5.6], [cx + 9, snY + 7.4]], 2.4, '#7a2b3c', true);
  }
  brow(ctx, cx - 11, cy - 21, 14, 0.42, 4.2);
  brow(ctx, cx + 12, cy - 22, 14, -0.42, 4.2);

  // --- spout cap on the top-left + cream dribbling down the left margin
  const capX = -34, capY = T - 7;
  const ooze = idle ? f * 3 : wind ? 10 : 4;
  const dx0 = L + 7;
  group(ctx, [
    { build: (c) => { c.moveTo(capX - 8, capY + 2); c.quadraticCurveTo(capX - 14, T - 2, dx0 - 5, T + 1); c.lineTo(dx0 + 5, T + 1); c.quadraticCurveTo(capX - 4, T - 1, capX + 2, capY + 3); c.closePath(); }, style: { fill: P_CREAM, shadow: 'none' } },
    { build: (c) => dripPath(c, dx0, T, 10, 22 + ooze, 4.4), style: { fill: P_CREAM, shadow: P_CREAM_SH, shadowOffset: [-1.8, -1.8], gloss: [{ x: dx0 - 1.8, y: T + 8, rx: 1.4, ry: 4, alpha: 0.85 }] } },
  ], 2.4);
  group(ctx, [{ build: (c) => dripPath(c, R - 4, T + 0.5, 7, 9 + ooze * 0.4, 3), style: { fill: P_CREAM, shadow: P_CREAM_SH, shadowOffset: [-1.2, -1.2] } }], 2.2);
  if (idle && f === 3) shape(ctx, (c) => dropPath(c, dx0, T + 46, 3.4), { fill: P_CREAM, ink: 2, shadow: 'none' });
  if (!atk) {
    const lift = wind ? -5 : 0;
    shape(ctx, (c) => {
      c.moveTo(capX - 12, capY);
      c.lineTo(capX - 12, capY - 9 + lift);
      c.lineTo(capX + 12, capY - 9 + lift);
      c.lineTo(capX + 12, capY);
      c.quadraticCurveTo(capX, capY + 5, capX - 12, capY);
      c.closePath();
    }, { fill: '#ffffff', ink: BI * 0.8, shadow: P_WHITE_SH, shadowOffset: [-4, -1] });
    for (let i = -2; i <= 2; i++) line(ctx, [[capX + i * 4.4, capY - 7.6 + lift], [capX + i * 4.4, capY + 1]], 1.1, '#c4cede', false, 0.9);
    shape(ctx, (c) => ellipsePath(c, capX, capY - 9 + lift, 12, 4.4), { fill: '#ffffff', ink: BI * 0.8, shadow: 'none', gloss: [{ x: capX - 4, y: capY - 10 + lift, rx: 5, ry: 1.2, alpha: 0.6 }] });
    if (wind) {
      shape(ctx, (c) => { ellipsePath(c, capX - 14, capY - 1, 5, 3.4); ellipsePath(c, capX + 14, capY - 1, 4.4, 3); }, { fill: P_CREAM, ink: 2, shadow: 'none' });
      effortMarks(ctx, capX, capY - 6, 18, -2.6, -0.5, 4, 6, 2.4);
    }
  } else {
    shape(ctx, (c) => ellipsePath(c, capX, capY, 10, 3.8), { fill: '#5b4f4a', ink: BI * 0.8, shadow: 'none' });
  }
  ctx.restore();

  if (atk) {
    // the cap rockets off; a geyser of cream arcs forward
    const topY = B - (B - (T - 7)) * sy;
    const g: Pt[] = [[capX, topY + 2], [capX + 4, topY - 10], [capX + 18, topY - 19], [capX + 42, topY - 22], [capX + 66, topY - 16]];
    group(ctx, [
      { build: (c) => smoothPath(c, ribbon(g, [10, 14, 18, 22, 24]), true, 0.5), style: { fill: P_CREAM, shadow: P_CREAM_SH, shadowOffset: [-3.4, -3.4], gloss: [{ x: capX + 16, y: topY - 18, rx: 7, ry: 1.8, rot: -0.4, alpha: 0.9 }] } },
      { build: (c) => { circlePath(c, capX + 70, topY - 22, 9); circlePath(c, capX + 76, topY - 10, 9.6); circlePath(c, capX + 68, topY - 4, 7); }, style: { fill: P_CREAM, shadow: P_CREAM_SH, shadowOffset: [-3, -3] } },
    ], BI * 0.85);
    for (const [ddx, ddy, r] of [[88, -30, 4.2], [60, -34, 3], [92, 0, 3.4], [38, -32, 2.4], [84, 10, 2.6]] as [number, number, number][]) {
      shape(ctx, (c) => circlePath(c, capX + ddx, topY + ddy, r), { fill: P_CREAM, ink: 2, shadow: 'none' });
    }
    ctx.save();
    ctx.translate(capX - 24, topY - 17);
    ctx.rotate(-0.7);
    shape(ctx, (c) => roundRectPath(c, -12, -9, 24, 10, 3), { fill: '#ffffff', ink: BI * 0.8, shadow: P_WHITE_SH, shadowOffset: [-3, -1] });
    shape(ctx, (c) => ellipsePath(c, 0, -9, 12, 4.4), { fill: '#ffffff', ink: BI * 0.8, shadow: 'none' });
    ctx.restore();
    effortMarks(ctx, capX - 24, topY - 17, 16, 0.4, 2.0, 3, 6, 2.2);
  }
}

// ---------------------------------------------------------------------------
// LO SCATOLONE — giant tin of spaghetti rings; the jagged lid is its jaw.
// ---------------------------------------------------------------------------
const S_LABEL = '#f3a53a', S_STRIPE = '#d9412e';
const S_SAUCE = '#ee6a24', S_SAUCE_SH = '#b23d16', S_RING = '#f6b04a';

function metalGrad(ctx: Ctx, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, '#7f8a9b');
  g.addColorStop(0.1, '#d9e0ea');
  g.addColorStop(0.26, '#f6f9fc');
  g.addColorStop(0.5, '#c2cad6');
  g.addColorStop(0.8, '#97a1b2');
  g.addColorStop(1, '#6a7385');
  return g;
}

/** Spaghetti ring (tiny torus) at (x,y). */
function pastaRing(ctx: Ctx, x: number, y: number, r: number, rot = 0) {
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, x, y, r, r * 0.62, rot);
  ctx.lineWidth = r * 0.95;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = r * 0.55;
  ctx.strokeStyle = S_RING;
  ctx.stroke();
  ctx.restore();
  glint(ctx, x - r * 0.5, y - r * 0.5, r * 0.22, r * 0.14, rot - 0.5, 0.8);
}

function drawScatolone(ctx: Ctx, f: number, pose: Pose) {
  const ph = (f / 4) * TAU;
  const s = Math.sin(ph), c4 = Math.cos(ph);
  const wind = pose === 'windup', atk = pose === 'attack';
  const idle = pose === 'idle';
  const RX = 46, TOP = -40, BOT = 22, RY = 13;

  // --- little legs + red sneakers
  for (const side of [-1, 1]) {
    const lift = idle ? Math.max(0, Math.sin(ph + (side < 0 ? 0 : Math.PI))) * 5 : 0;
    const fx = side * (wind ? 28 : 22) + (idle ? Math.cos(ph + (side < 0 ? 0 : Math.PI)) * 3 : 0);
    const fy = 49.6 - lift;
    inkLine(ctx, [[side * 20, 30], [fx, fy - 2]], 8, '#4a5162', false, BI * 0.75);
    shape(ctx, (c) => {
      c.moveTo(fx - 9 + side * 2, fy + 3.6);
      c.quadraticCurveTo(fx - 9 + side * 2, fy - 5, fx + side * 2, fy - 5);
      c.quadraticCurveTo(fx + 11 + side * 2, fy - 4, fx + 11 + side * 2, fy + 3.6);
      c.closePath();
    }, { fill: '#d9443a', ink: BI * 0.75, shadow: '#a12a2a', shadowOffset: [-2, -1.6], gloss: [{ x: fx - 2, y: fy - 2.4, rx: 3, ry: 1.2, alpha: 0.5 }] });
    line(ctx, [[fx - 8 + side * 2, fy + 2.6], [fx + 10 + side * 2, fy + 2.6]], 2.2, '#f4efe6');
  }

  const sx = wind ? 1.07 : atk ? 0.95 : 1 + 0.012 * c4;
  const sy = wind ? 0.94 : atk ? 1.04 : 1 - 0.012 * c4;
  ctx.save();
  ctx.translate(0, BOT + RY);
  ctx.scale(sx, sy);
  ctx.translate(0, -(BOT + RY));

  // --- can body (metal)
  const body = (c: Ctx) => {
    c.moveTo(-RX, TOP);
    c.ellipse(0, TOP, RX, RY, 0, Math.PI, 0, true);
    c.lineTo(RX, BOT);
    c.ellipse(0, BOT, RX, RY, 0, 0, Math.PI, false);
    c.closePath();
  };
  shape(ctx, body, { fill: metalGrad(ctx, -RX, RX), ink: BI, shadow: 'none' });
  for (const ry0 of [TOP + 8, BOT - 6]) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, ry0, RX, RY, 0, Math.PI * 0.98, Math.PI * 0.02, true);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = 'rgba(70,78,96,0.55)';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, ry0 - 2, RX, RY, 0, Math.PI * 0.98, Math.PI * 0.02, true);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.stroke();
    ctx.restore();
  }

  // --- dented label
  const LT = -24, LB = 10;
  const label = (c: Ctx) => {
    c.moveTo(-RX, LT);
    c.ellipse(0, LT, RX, RY, 0, Math.PI, 0, true);
    c.lineTo(RX, LB);
    c.ellipse(0, LB, RX, RY, 0, 0, Math.PI, false);
    c.closePath();
  };
  shape(ctx, label, { fill: S_LABEL, ink: 2.2, shadow: 'none' });
  clipped(ctx, label, () => {
    for (const [yy, w] of [[LT + 4, 5], [LB + 4.6, 5]] as Pt[]) {
      ctx.beginPath();
      ctx.ellipse(0, yy, RX, RY, 0, Math.PI, 0, true);
      ctx.lineWidth = w;
      ctx.strokeStyle = S_STRIPE;
      ctx.stroke();
    }
    const ey = (LT + LB) / 2 + 4;
    ctx.fillStyle = '#fff7e6';
    ctx.beginPath();
    ellipsePath(ctx, 4, ey, 19, 12);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = S_STRIPE;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-8, ey);
    ctx.quadraticCurveTo(4, ey + 15, 16, ey);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#8f99aa';
    ctx.stroke();
    for (const [rx0, ry0] of [[-3, -3], [3, -5], [9, -3], [0, 0], [6, -0.6], [12, 0]] as Pt[]) {
      ctx.beginPath();
      circlePath(ctx, rx0 + 1, ey + ry0, 2.2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = S_SAUCE;
      ctx.stroke();
    }
    ctx.fillStyle = '#fff2c4';
    for (const [sx0, sy0] of [[-30, ey - 6], [-24, ey + 6], [34, ey + 4]] as Pt[]) {
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU, r = k % 2 ? 1 : 3;
        const px = sx0 + Math.cos(a) * r, py = sy0 + Math.sin(a) * r;
        if (k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    const g = ctx.createLinearGradient(-RX, 0, RX, 0);
    g.addColorStop(0, 'rgba(120,40,10,0.35)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.32, 'rgba(255,255,255,0)');
    g.addColorStop(0.75, 'rgba(120,40,10,0.1)');
    g.addColorStop(1, 'rgba(120,40,10,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(-RX, LT - 20, RX * 2, 70);
    // the dent: crumpled crease
    ctx.fillStyle = 'rgba(90,30,10,0.3)';
    ctx.beginPath();
    smoothPath(ctx, [[-44, ey - 12], [-32, ey - 8], [-28, ey + 2], [-36, ey + 10], [-46, ey + 8]], true);
    ctx.fill();
    line(ctx, [[-46, ey - 10], [-36, ey - 6], [-31, ey], [-37, ey + 4], [-33, ey + 9]], 1.6, '#7a3412', false, 0.9);
    line(ctx, [[-44, ey - 9], [-35, ey - 5]], 1, '#ffd38a', false, 0.8);
  });
  shape(ctx, (c) => {
    c.moveTo(RX - 1, LT + 6);
    c.lineTo(RX - 12, LT + 8);
    c.quadraticCurveTo(RX - 6, LT + 16, RX - 1, LT + 22);
    c.closePath();
  }, { fill: '#fff4dc', ink: 1.8, shadow: '#d8c7a4', shadowOffset: [-1.2, -1.2] });

  // --- the jaw: lid (upper jaw, with the eyes) over a dark throat
  const chomp = idle ? [0, -3, -1, 1.5][f] : 0;
  const lidRY = wind ? 21 : atk ? 30 : 27;
  const lidCY = wind ? TOP - 12 : atk ? TOP - RY - 44 : TOP - RY - 28 + chomp;
  const lidRot = wind ? 0.02 : atk ? -0.14 : 0.05 + (idle ? s * 0.025 : 0);
  const lidBot = lidCY + lidRY;
  const throat = (c: Ctx) => {
    c.moveTo(-RX + 2, TOP);
    c.bezierCurveTo(-RX - 2, TOP - 12, -RX + 2, lidBot - 10, -RX + 10, lidCY);
    c.lineTo(RX - 10, lidCY);
    c.bezierCurveTo(RX - 2, lidBot - 10, RX + 2, TOP - 12, RX - 2, TOP);
    c.ellipse(0, TOP, RX - 2, RY - 1.4, 0, 0, Math.PI, false);
    c.closePath();
  };
  if (!wind) {
    shape(ctx, throat, { fill: '#3d1510', ink: BI, shadow: 'none' });
    clipped(ctx, throat, () => {
      const g = ctx.createLinearGradient(0, lidCY, 0, TOP + RY);
      g.addColorStop(0, '#1c0806');
      g.addColorStop(1, '#5a1d12');
      ctx.fillStyle = g;
      ctx.fillRect(-RX, lidCY - 4, RX * 2, TOP + RY - lidCY + 8);
      // sauce pool with rings at the bottom of the mouth
      ctx.fillStyle = S_SAUCE;
      ctx.beginPath();
      ellipsePath(ctx, 0, TOP + 4, RX - 6, RY - 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,190,120,0.45)';
      ctx.beginPath();
      ellipsePath(ctx, -10, TOP, 16, 3);
      ctx.fill();
      for (const [px, py, r] of [[-28, TOP + 2, 4], [-16, TOP + 5, 4.4], [-3, TOP + 1, 4], [12, TOP + 4, 4.2], [26, TOP + 1, 4], [36, TOP + 5, 3.4], [4, TOP + 8, 3.8]] as [number, number, number][]) {
        pastaRing(ctx, px, py + (idle ? Math.sin(ph + px) * 0.8 : 0), r, 0.1);
      }
      // drooling strands of sauce between the jaws
      for (const [x0, w] of [[-22, 2.6], [20, 2.2]] as Pt[]) {
        const sag = idle ? s * 1.5 : 0;
        line(ctx, [[x0, lidBot - 2], [x0 + 1.4 + sag, (lidBot + TOP) / 2], [x0 + 0.6, TOP + 2]], w + 2, '#7a2410', true, 0.9);
        line(ctx, [[x0, lidBot - 2], [x0 + 1.4 + sag, (lidBot + TOP) / 2], [x0 + 0.6, TOP + 2]], w, S_SAUCE, true);
        shape(ctx, (c) => dropPath(c, x0 + 1.4 + sag, (lidBot + TOP) / 2 + 3, w * 0.9), { fill: S_SAUCE, ink: 1.2, shadow: 'none' });
      }
    });
  }
  // front rim (lower jaw) with tin teeth
  const rimFront = (c: Ctx) => {
    c.moveTo(-RX, TOP);
    c.ellipse(0, TOP, RX, RY, 0, Math.PI, 0, true);
    c.lineTo(RX - 4.6, TOP);
    c.ellipse(0, TOP, RX - 4.6, RY - 3.4, 0, 0, Math.PI, false);
    c.closePath();
  };
  shape(ctx, rimFront, { fill: '#eef2f7', ink: 2.4, shadow: '#a7b0bf', shadowOffset: [3, -1.4] });
  // sauce + rings spilling over the front rim and down the label
  const dl = idle ? f * 2.6 : wind ? 12 : 6;
  group(ctx, [
    { build: (c) => { c.moveTo(-24, TOP + 6); c.quadraticCurveTo(-8, TOP + 20, 10, TOP + 9); c.lineTo(12, TOP + 2); c.lineTo(-24, TOP + 2); c.closePath(); }, style: { fill: S_SAUCE, shadow: 'none' } },
    { build: (c) => dripPath(c, -12, TOP + 10, 12, 18 + dl, 4.6), style: { fill: S_SAUCE, shadow: S_SAUCE_SH, shadowOffset: [-2, -2], gloss: [{ x: -14, y: TOP + 18, rx: 1.4, ry: 4, alpha: 0.6 }] } },
    { build: (c) => dripPath(c, 4, TOP + 10, 8, 10 + dl * 0.6, 3.4), style: { fill: S_SAUCE, shadow: S_SAUCE_SH, shadowOffset: [-1.6, -1.6] } },
  ], 2.4);
  pastaRing(ctx, -14, TOP + 14 + dl * 0.5, 4.2, 0.3);
  pastaRing(ctx, 2, TOP + 9, 3.8, -0.2);
  if (idle && f === 3) shape(ctx, (c) => dropPath(c, -12, TOP + 46, 3), { fill: S_SAUCE, ink: 1.8, shadow: 'none' });
  for (let i = 0; i < 9; i++) {
    if (i === 3 || i === 4) continue; // gap where the sauce spills out
    const a = Math.PI * (0.1 + (i / 8) * 0.8);
    const px = Math.cos(a) * (RX - 3.6), py = TOP + Math.sin(a) * (RY - 2.6);
    const th = wind ? 4 : 9;
    shape(ctx, (c) => {
      c.moveTo(px - 4.8, py + 1.6);
      c.lineTo(px + (i - 4) * 0.3, py - th);
      c.lineTo(px + 4.8, py + 1.6);
      c.closePath();
    }, { fill: '#f2f5f9', ink: 1.8, shadow: '#a7b0bf', shadowOffset: [-1.4, 0] });
  }
  if (wind) {
    // clamped shut: sauce squeezing out at the corners
    for (const sgn of [-1, 1]) {
      group(ctx, [{ build: (c) => dripPath(c, sgn * (RX - 4), TOP - 2, 9, 16 + (f % 2) * 4, 3.6), style: { fill: S_SAUCE, shadow: S_SAUCE_SH, shadowOffset: [-1.4, -1.4] } }], 2.2);
    }
  }

  // --- lid / upper jaw
  ctx.save();
  ctx.translate(2, lidCY);
  ctx.rotate(lidRot);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.1 + (i / 8) * 0.8);
    const px = Math.cos(a) * (RX - 1), py = Math.sin(a) * lidRY;
    shape(ctx, (c) => {
      c.moveTo(px - 5, py - 3);
      c.lineTo(px - (i - 4) * 0.3, py + (wind ? 5 : 9));
      c.lineTo(px + 5, py - 3);
      c.closePath();
    }, { fill: '#f2f5f9', ink: 1.8, shadow: '#a7b0bf', shadowOffset: [-1.4, 0] });
  }
  const lid = (c: Ctx) => ellipsePath(c, 0, 0, RX + 1, lidRY);
  shape(ctx, lid, { fill: metalGrad(ctx, -RX, RX), ink: BI, shadow: 'none' });
  clipped(ctx, lid, () => {
    for (const k of [0.8, 0.58]) {
      ctx.beginPath();
      ellipsePath(ctx, 0, 0, RX * k, lidRY * k);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(70,78,96,0.45)';
      ctx.stroke();
      ctx.beginPath();
      ellipsePath(ctx, -1.4, -1.6, RX * k, lidRY * k);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ellipsePath(ctx, -26, -lidRY * 0.52, 10, 3, -0.5);
    ctx.fill();
  });
  const er = Math.min(10.5, lidRY * 0.4);
  if (wind) {
    squeezeEye(ctx, -16, 0, er * 0.85, -1);
    squeezeEye(ctx, 16, -1, er * 0.85, 1);
  } else {
    eye(ctx, -16, 0, er, { look: [0.4, 0.2], lid: 'angry-l', pupil: atk ? 0.34 : 0.48, iris: '#e0442c', ink: 2.4 });
    eye(ctx, 16, -1, er, { look: [0.4, 0.2], lid: 'angry-r', pupil: atk ? 0.34 : 0.48, iris: '#e0442c', ink: 2.4 });
  }
  brow(ctx, -16, -er - 5, 20, 0.42, 4.6, '#3d4352');
  brow(ctx, 16, -er - 6, 20, -0.42, 4.6, '#3d4352');
  ctx.restore();
  if (wind) effortMarks(ctx, 0, lidCY - 4, 52, -2.8, -0.35, 5, 8, 2.6);
  ctx.restore();

  if (atk) {
    // a blast of sauce and rings out of the jaws
    const my = BOT + RY - (BOT + RY - TOP) * sy;
    // widening splash: a cone with a lumpy front made of blobs
    group(ctx, [
      {
        build: (c) => {
          c.moveTo(-4, my - 8);
          c.quadraticCurveTo(10, my - 10, 16, my - 18);
          c.quadraticCurveTo(24, my - 26, 33, my - 27);
          c.quadraticCurveTo(42, my - 32, 44, my - 42);
          c.lineTo(54, my);
          c.quadraticCurveTo(40, my + 7, 28, my + 2);
          c.quadraticCurveTo(14, my + 7, -2, my + 4);
          c.closePath();
        },
        style: { fill: S_SAUCE, shadow: S_SAUCE_SH, shadowOffset: [-3, -4], gloss: [{ x: 22, y: my - 16, rx: 9, ry: 2, rot: -0.5, alpha: 0.45 }] },
      },
      { build: (c) => { circlePath(c, 45, my - 38, 9); circlePath(c, 55, my - 25, 10); circlePath(c, 57, my - 11, 9); circlePath(c, 49, my - 1, 7); }, style: { fill: S_SAUCE, shadow: S_SAUCE_SH, shadowOffset: [-3, -3] } },
    ], BI * 0.85);
    for (const [px, py, r] of [[14, -6, 4], [26, -17, 4.4], [36, -6, 4.2], [47, -26, 4.6], [50, -10, 4.2], [66, -42, 4.2], [70, -20, 4], [60, -56, 3.6], [72, -4, 3.6], [34, -38, 3.8]] as [number, number, number][]) {
      pastaRing(ctx, px, my + py, r, (px % 7) * 0.2);
    }
    for (const [px, py, r] of [[54, -62, 3.4], [77, -32, 2.8], [24, -34, 2.4], [64, 7, 2.6]] as [number, number, number][]) {
      shape(ctx, (c) => circlePath(c, px, my + py, r), { fill: S_SAUCE, ink: 1.8, shadow: 'none', gloss: [{ x: px - r * 0.3, y: my + py - r * 0.3, rx: r * 0.3, ry: r * 0.2, alpha: 0.6 }] });
    }
  }
}

// ---------------------------------------------------------------------------
// IL DEEP DISH — a Chicago deep-dish behemoth: crust walls, molten cheese lake.
// ---------------------------------------------------------------------------
const D_CRUST = '#de9c4a', D_CRUST_HI = '#f4cd85';
const D_SAUCE = '#c8331f', D_SAUCE_SH = '#8f1f12';
const D_CHEESE = '#f8d867', D_CHEESE_SH = '#d9a93a';

function drawDeepDish(ctx: Ctx, f: number, pose: Pose) {
  const ph = (f / 4) * TAU;
  const s = Math.sin(ph), c4 = Math.cos(ph);
  const wind = pose === 'windup', atk = pose === 'attack';
  const idle = pose === 'idle';
  const RX = 96, RY = 32, TY = -26, BY = 36, BRX = 92, BRY = 28;

  // --- stubby legs (back pair first)
  const legLift = (k: number) => (idle ? Math.max(0, Math.sin(ph + k * Math.PI)) * 6 : 0);
  const stubLeg = (hx: number, hy: number, fx: number, fy: number, back: boolean) => {
    inkLine(ctx, [[hx, hy], [fx, fy - 9]], 17, back ? '#8c4e22' : '#a35d28', false, BI);
    shape(ctx, (c) => {
      c.moveTo(fx - 13, fy + 4);
      c.quadraticCurveTo(fx - 13, fy - 8, fx, fy - 8);
      c.quadraticCurveTo(fx + 14, fy - 8, fx + 14, fy + 4);
      c.closePath();
    }, { fill: back ? '#4a2812' : '#5c3218', ink: BI, shadow: '#2f180a', shadowOffset: [-2.4, -2], gloss: [{ x: fx - 4, y: fy - 4, rx: 4, ry: 1.4, alpha: 0.35 }] });
  };
  if (!wind) {
    stubLeg(-66, 40, -70 + (idle ? Math.cos(ph + Math.PI) * 3 : 0), 62 - legLift(1), true);
    stubLeg(64, 40, 70 + (idle ? Math.cos(ph) * 3 : 0), 62 - legLift(0), true);
  }

  // body transform: rear up on the back foot (wind-up), slam squash (attack), heavy idle bob
  ctx.save();
  if (wind) {
    ctx.translate(-72, 64);
    ctx.rotate(-0.12);
    ctx.translate(72, -64);
    ctx.translate(4, -2);
    stubLeg(-64, 38, -68, 64, true);
    stubLeg(64, 38, 72, 62, true);
  } else {
    const sx = atk ? 1.08 : 1 + 0.01 * c4;
    const sy = atk ? 0.86 : 1 - 0.012 * c4;
    ctx.translate(0, 62);
    ctx.scale(sx, sy);
    ctx.translate(0, -62);
  }

  // --- front legs
  if (wind) {
    stubLeg(-44, 52, -50, 68, false);
    stubLeg(38, 52, 50, 64, false);
  } else {
    stubLeg(-44, 54, -48 + (idle ? Math.cos(ph) * 4 : 0) - (atk ? 8 : 0), 68 - legLift(0), false);
    stubLeg(40, 54, 44 + (idle ? Math.cos(ph + Math.PI) * 4 : 0) + (atk ? 8 : 0), 68 - legLift(1), false);
  }

  // --- crust wall
  const wall = (c: Ctx) => {
    c.moveTo(-RX, TY);
    c.ellipse(0, TY, RX, RY, 0, Math.PI, 0, true);
    c.lineTo(BRX, BY);
    c.ellipse(0, BY, BRX, BRY, 0, 0, Math.PI, false);
    c.closePath();
  };
  const wg = ctx.createLinearGradient(0, TY, 0, BY + BRY);
  wg.addColorStop(0, '#e9ad57');
  wg.addColorStop(0.55, D_CRUST);
  wg.addColorStop(1, '#b06a2c');
  shape(ctx, wall, { fill: wg, ink: BI, shadow: 'none' });
  clipped(ctx, wall, () => {
    // side shading (cylinder), lower bake, texture
    const g = ctx.createLinearGradient(-RX, 0, RX, 0);
    g.addColorStop(0, 'rgba(120,50,10,0.3)');
    g.addColorStop(0.2, 'rgba(255,240,200,0.18)');
    g.addColorStop(0.4, 'rgba(255,255,255,0)');
    g.addColorStop(0.8, 'rgba(110,45,10,0.18)');
    g.addColorStop(1, 'rgba(110,45,10,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(-RX - 4, TY - 40, RX * 2 + 8, 140);
    speckle(ctx, 0, 30, 90, 30, 70, '#8a4a1c', 0.8, 61, 0.55);
    speckle(ctx, 0, 30, 90, 30, 40, '#f6d48e', 0.7, 63, 0.7);
    // blisters
    for (const [bx, by, br] of [[-70, 30, 4], [62, 14, 3.4], [-6, 56, 3], [74, 42, 3.6], [-80, 6, 2.6]] as [number, number, number][]) {
      ctx.fillStyle = 'rgba(255,230,170,0.6)';
      ctx.beginPath();
      ellipsePath(ctx, bx, by, br * 1.4, br);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(120,60,20,0.5)';
      ctx.stroke();
    }
  });

  // --- top: crust lip + chunky tomato + molten cheese
  const inner = (c: Ctx) => ellipsePath(c, 0, TY + 3, RX - 13, RY - 8.5);
  shape(ctx, (c) => ellipsePath(c, 0, TY, RX, RY), { fill: D_CRUST_HI, ink: BI, shadow: 'none' });
  // lip shading: inner bevel
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, 0, TY, RX, RY);
  ctx.clip();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(169,101,42,0.55)';
  ctx.beginPath();
  ellipsePath(ctx, 2, TY + 3, RX - 2, RY - 2);
  ctx.stroke();
  speckle(ctx, 0, TY, RX - 3, RY - 3, 50, '#b8732e', 0.7, 71, 0.5);
  ctx.restore();
  const slosh = wind ? -6 : atk ? 4 : 0;
  shape(ctx, inner, { fill: D_SAUCE, ink: 2.4, shadow: 'none' });
  clipped(ctx, inner, () => {
    // sauce depth shadow near the back lip
    ctx.fillStyle = 'rgba(80,10,5,0.35)';
    ctx.beginPath();
    ellipsePath(ctx, 0, TY - 6 + slosh * 0.3, RX - 14, RY - 14);
    ctx.fill();
    // cheese pools (molten lake)
    const pools: [number, number, number, number][] = [[-40, TY + 4, 24, 9], [18, TY - 2, 30, 10], [56, TY + 8, 16, 6], [-6, TY + 12, 18, 6]];
    for (const [px, py, prx, pry] of pools) {
      shape(ctx, (c) => smoothPath(c, Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * TAU;
        const k = 1 + 0.18 * Math.sin(a * 3 + px);
        return [px + slosh + Math.cos(a) * prx * k, py + Math.sin(a) * pry * k] as Pt;
      }), true), { fill: D_CHEESE, ink: 1.6, inkColor: '#b9822a', shadow: D_CHEESE_SH, shadowOffset: [-2.4, -2], gloss: [{ x: px - prx * 0.3, y: py - pry * 0.3, rx: prx * 0.3, ry: pry * 0.25, alpha: 0.6 }] });
    }
    // tomato chunks
    for (const [tx, ty, tr] of [[-66, TY + 2, 7], [-20, TY - 8, 6], [40, TY - 12, 6.4], [70, TY - 2, 5.4], [-50, TY + 14, 5], [30, TY + 14, 6], [-24, TY + 16, 4.6], [0, TY - 16, 5]] as [number, number, number][]) {
      shape(ctx, (c) => smoothPath(c, [[tx - tr, ty], [tx - tr * 0.3, ty - tr * 0.7], [tx + tr, ty - tr * 0.4], [tx + tr * 0.7, ty + tr * 0.6], [tx - tr * 0.4, ty + tr * 0.7]], true), { fill: '#e2462a', ink: 1.6, inkColor: '#7a160c', shadow: D_SAUCE_SH, shadowOffset: [-1.4, -1.4], gloss: [{ x: tx - tr * 0.3, y: ty - tr * 0.3, rx: tr * 0.3, ry: tr * 0.18, alpha: 0.6 }] });
    }
    // sausage crumbles + pepperoni peeking out of the sauce
    for (const [px, py, pr] of [[-56, TY - 6, 5.4], [46, TY + 2, 5], [-14, TY + 2, 4.6], [70, TY - 10, 4.4]] as [number, number, number][]) {
      shape(ctx, (c) => ellipsePath(c, px + slosh * 0.5, py, pr * 1.3, pr * 0.62), { fill: '#b8402e', ink: 1.5, inkColor: '#5e150c', shadow: '#8a2416', shadowOffset: [-1, -0.8], gloss: [{ x: px - pr * 0.4, y: py - pr * 0.2, rx: pr * 0.4, ry: pr * 0.14, alpha: 0.55 }] });
      speckle(ctx, px + slosh * 0.5, py, pr, pr * 0.5, 4, '#f1c9a0', 0.45, (px * 7) | 0, 0.9);
    }
    for (const [px, py] of [[-34, TY - 12], [30, TY + 10], [-70, TY + 8], [8, TY - 14]] as Pt[]) {
      shape(ctx, (c) => smoothPath(c, [[px - 3.4, py], [px - 1, py - 2.6], [px + 3, py - 1.6], [px + 2.4, py + 2], [px - 1.6, py + 2.2]], true), { fill: '#8a4a2a', ink: 1.3, inkColor: '#4a2410', shadow: 'none', gloss: [{ x: px - 1, y: py - 1, rx: 1, ry: 0.6, alpha: 0.4 }] });
    }
    speckle(ctx, 0, TY + 2, RX - 16, RY - 10, 40, '#3f6a2a', 0.9, 77, 0.85);
    speckle(ctx, 0, TY + 2, RX - 16, RY - 10, 26, '#fff3d6', 0.6, 79, 0.8);
    // pre-cut into slices: knife lines radiating from the centre
    ctx.save();
    ctx.lineCap = 'round';
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + 0.2;
      ctx.beginPath();
      ctx.moveTo(slosh * 0.3, TY + 3);
      ctx.lineTo(Math.cos(a) * (RX - 12), TY + 3 + Math.sin(a) * (RY - 8));
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = 'rgba(90,15,8,0.45)';
      ctx.stroke();
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = 'rgba(255,210,150,0.35)';
      ctx.stroke();
    }
    ctx.restore();
    // bubbles in the cheese (pop on frame 2)
    const bub = idle ? [3.6, 4.6, 0, 2.4][f] : 4;
    if (bub > 0) {
      shape(ctx, (c) => circlePath(c, 14 + slosh, TY - 4, bub), { fill: D_CHEESE, ink: 1.4, inkColor: '#b9822a', shadow: D_CHEESE_SH, shadowOffset: [-1, -1], gloss: [{ x: 13, y: TY - 5.4, rx: bub * 0.35, ry: bub * 0.22, alpha: 0.85 }] });
    } else {
      ctx.save();
      ctx.strokeStyle = '#b9822a';
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        ctx.beginPath();
        ctx.moveTo(14 + Math.cos(a) * 3, TY - 4 + Math.sin(a) * 2);
        ctx.lineTo(14 + Math.cos(a) * 6, TY - 4 + Math.sin(a) * 4);
        ctx.stroke();
      }
      ctx.restore();
    }
    const b2 = idle ? [1.6, 0, 2.6, 3.2][f] : 2.4;
    if (b2 > 0) shape(ctx, (c) => circlePath(c, -40 + slosh, TY + 4, b2), { fill: D_CHEESE, ink: 1.2, inkColor: '#b9822a', shadow: 'none', gloss: [{ x: -41, y: TY + 3, rx: b2 * 0.35, ry: b2 * 0.22, alpha: 0.85 }] });
  });

  // --- angry face on the crust wall (drawn after the top so the brows sit under the lip)
  const fyo = idle ? s * 0.8 : 0;
  const EY = 27;
  if (wind) {
    eye(ctx, -38, EY, 12.4, { look: [0.45, 0.05], lid: 'angry-l', pupil: 0.34, iris: '#7a3a12', ink: 2.8 });
    eye(ctx, 26, EY - 2, 12.4, { look: [0.45, 0.05], lid: 'angry-r', pupil: 0.34, iris: '#7a3a12', ink: 2.8 });
    bossMouth(ctx, -6, 42, 60, 15, { frown: 0.15, tongue: true, bottomTeeth: true });
  } else if (atk) {
    eye(ctx, -38, EY + 1, 12.4, { look: [0.3, 0.2], lid: 'angry-l', pupil: 0.3, iris: '#7a3a12', ink: 2.8 });
    eye(ctx, 26, EY - 1, 12.4, { look: [0.3, 0.2], lid: 'angry-r', pupil: 0.3, iris: '#7a3a12', ink: 2.8 });
    bossMouth(ctx, -6, 44, 72, 11, { frown: 0.1, tongue: true, bottomTeeth: true });
  } else {
    eye(ctx, -38, EY + fyo, 12.4, { look: [0.42, 0.12], lid: 'angry-l', pupil: 0.48, iris: '#7a3a12', ink: 2.8 });
    eye(ctx, 26, EY - 2 + fyo, 12.4, { look: [0.42, 0.12], lid: 'angry-r', pupil: 0.48, iris: '#7a3a12', ink: 2.8 });
    bossMouth(ctx, -6, 44 + fyo * 0.5, 62, 13, { frown: 0.55, bottomTeeth: true, tongue: true });
  }
  brow(ctx, -38, EY - 15 + fyo, 30, 0.4, 7.4, '#5a2a10');
  brow(ctx, 26, EY - 17 + fyo, 30, -0.4, 7.4, '#5a2a10');

  // --- cheese oozing over the lip, dripping down the wall
  const dl = idle ? [0, 4, 8, 11][f] : wind ? 2 : 14;
  for (const [x0, w, len] of [[-80, 14, 22], [70, 16, 24]] as [number, number, number][]) {
    const ly = TY + Math.sqrt(Math.max(0, 1 - (x0 / RX) ** 2)) * RY - 3;
    group(ctx, [
      { build: (c) => ellipsePath(c, x0, ly - 1, w * 0.9, 5), style: { fill: D_CHEESE, shadow: 'none' } },
      { build: (c) => dripPath(c, x0, ly, w, len + dl, w * 0.4), style: { fill: D_CHEESE, shadow: D_CHEESE_SH, shadowOffset: [-2, -2], gloss: [{ x: x0 - w * 0.2, y: ly + 6, rx: 1.6, ry: 4, alpha: 0.7 }] } },
    ], 2.4);
  }
  // a tomato drip
  group(ctx, [{ build: (c) => dripPath(c, 50, TY + Math.sqrt(1 - (50 / RX) ** 2) * RY - 3, 9, 10 + dl * 0.5, 3.6), style: { fill: D_SAUCE, shadow: D_SAUCE_SH, shadowOffset: [-1.6, -1.6] } }], 2.4);

  ctx.restore();

  // --- steam / splash
  if (idle || wind) {
    for (const [x0, y0, k] of [[-30, -60, 0], [34, -66, 2]] as [number, number, number][]) {
      const t = ((idle ? f : 1) / 4 + k / 4) % 1;
      const rise = t * 14;
      const sway = Math.sin((t + k) * TAU) * 2.4;
      const wisp: Pt[] = [[x0, y0 - rise], [x0 + 4 + sway, y0 - 10 - rise], [x0 + 2 + sway, y0 - 20 - rise], [x0 + 6 + sway * 0.6, y0 - 28 - rise]];
      ctx.save();
      ctx.globalAlpha = 0.5 * (1 - t * 0.75);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      smoothPath(ctx, ribbon(wisp, [7, 6, 4.4, 1]), true, 0.5);
      ctx.fill();
      ctx.restore();
    }
  }
  if (atk) {
    // SLAM: sauce + cheese blobs fly up, dust puffs at the feet
    for (const [bx, by, br, col] of [[-60, -72, 8, D_CHEESE], [-24, -88, 7, D_SAUCE], [20, -92, 8.4, D_CHEESE], [58, -80, 7, D_SAUCE], [84, -58, 6, D_CHEESE], [-86, -50, 6, D_SAUCE], [0, -70, 5, D_CHEESE]] as [number, number, number, string][]) {
      shape(ctx, (c) => dropPath(c, bx, by, br), { fill: col, ink: 2.4, shadow: col === D_SAUCE ? D_SAUCE_SH : D_CHEESE_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: bx - br * 0.3, y: by - br * 0.3, rx: br * 0.3, ry: br * 0.2, alpha: 0.7 }] });
    }
    for (const [px, py, r] of [[-90, 62, 9], [-78, 67, 7], [88, 62, 9], [76, 67, 7]] as [number, number, number][]) puff(ctx, px, py, r, 0.8);
  }
}

registerBoss('ketchup', 150, 200, 75, 150, drawKetchup);
registerBoss('alfredo', 170, 200, 85, 140, drawAlfredo);
registerBoss('panna', 180, 220, 90, 160, drawPanna);
registerBoss('scatolone', 170, 200, 85, 142, drawScatolone);
registerBoss('deepdish', 220, 200, 110, 122, drawDeepDish);
