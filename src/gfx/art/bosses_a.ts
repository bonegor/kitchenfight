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

type Pose = 'idle' | 'windup' | 'attack';
const TAU = Math.PI * 2;
/** Boss outline width. */
const BI = 3.4;

function registerBoss(id: string, w: number, h: number, ax: number, ay: number, draw: (ctx: Ctx, f: number, pose: Pose) => void) {
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
  line(ctx, [[x - side * r, y - r * 0.8], [x + side * r * 0.7, y], [x - side * r, y + r * 0.8]], r * 0.42, INK);
}

/** Small motion/effort tick marks radiating from a point. */
function effortMarks(ctx: Ctx, x: number, y: number, r: number, a0: number, a1: number, n: number, len: number, w = 2) {
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / Math.max(1, n - 1);
    line(ctx, [[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * (r + len), y + Math.sin(a) * (r + len)]], w, INK);
  }
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
    const fy = 42 - lift;
    inkLine(ctx, [[side * 14, 32], [fx, fy - 2]], 5, '#3b2a30', false, 2);
    shape(ctx, (c) => ellipsePath(c, fx + side * 2.6 + 2, fy + 1.4, 8.2, 4.4), { fill: '#241a1f', ink: 2.2, shadow: 'none', gloss: [{ x: fx + side * 2.6, y: fy - 0.2, rx: 3, ry: 1.2, alpha: 0.45 }] });
    shape(ctx, (c) => roundRectPath(c, fx - 4.4, fy - 6.4, 8.8, 5.6, 2), { fill: K_GLOVE, ink: 1.8, shadow: K_GLOVE_SH, shadowOffset: [-1.4, -1] });
    ball(ctx, fx + 2.6, fy - 3.6, 0.9, '#2b2230', '#100a10', 0.6, 0.4);
  }

  // body squash & stretch around the base
  const sx = wind ? 1.08 : atk ? 0.92 : 1 + 0.014 * c4;
  const sy = wind ? 0.89 : atk ? 1.07 : 1 - 0.016 * c4;
  ctx.save();
  ctx.translate(0, 38);
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
    eye(ctx, -15, -33, 7, { look: atk ? [0.2, -0.2] : [0.42, 0.1], lid: atk ? 'none' : 'half', lidColor: K_RED_SH, pupil: atk ? 0.34 : 0.5, iris: '#3f86d6', ink: 2.2 });
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
  const hatLift = wind ? -4 + (f % 2) : atk ? -40 : 0.8 * Math.max(0, -c4);
  const hatTilt = wind ? 0.02 : atk ? 0.42 : 0.08 + s * 0.02;
  const topY = 38 - (38 + 76) * (wind ? 0.89 : atk ? 1.07 : 1 - 0.016 * c4);
  if (atk) {
    // SPLURT: ketchup jet from the nozzle
    const jet: Pt[] = [[0, topY - 8], [6, topY - 26], [20, topY - 40], [38, topY - 46], [54, topY - 44]];
    group(ctx, [
      { build: (c) => smoothPath(c, ribbon(jet, [9, 12, 14, 16, 18]), true, 0.5), style: { fill: K_SAUCE, shadow: K_SAUCE_SH, shadowOffset: [-2.6, -2.6], gloss: [{ x: 14, y: topY - 36, rx: 7, ry: 1.6, rot: -0.7, alpha: 0.45 }] } },
      { build: (c) => circlePath(c, 58, topY - 44, 11), style: { fill: K_SAUCE, shadow: K_SAUCE_SH, shadowOffset: [-2.4, -2.4] } },
    ], BI * 0.8);
    for (const [dx, dy, r] of [[68, -60, 3.6], [44, -64, 2.8], [66, -30, 2.6], [30, -56, 2]] as [number, number, number][]) {
      shape(ctx, (c) => circlePath(c, dx, topY + dy + 8, r), { fill: K_SAUCE, ink: 2, shadow: 'none', gloss: [{ x: dx - r * 0.3, y: topY + dy + 8 - r * 0.3, rx: r * 0.35, ry: r * 0.2, alpha: 0.6 }] });
    }
  }
  topHat(ctx, atk ? -14 : 0, topY - 1 + hatLift, hatTilt, 1);

  // --- near arm + cane
  if (wind) {
    // cane raised high, about to strike
    hoseArm(ctx, [[40, -14 * 0.89 + 4], [58, -30], [62, -52]]);
    ctx.save();
    ctx.translate(62, -52);
    ctx.rotate(-0.5);
    inkLine(ctx, [[0, 0], [0, -46]], 3.6, '#2a2230', false, 2.2);
    ball(ctx, 0, 6, 5, K_GOLD, K_GOLD_SH, 2.2, 0.8);
    shape(ctx, (c) => roundRectPath(c, -2.6, -50, 5.2, 6, 1.4), { fill: '#e8e4dc', ink: 2, shadow: 'none' });
    ctx.restore();
    glove(ctx, 62, -52, 7.2, -0.2);
    effortMarks(ctx, 50, -96, 22, -2.2, -0.6, 3, 6, 2.2);
  } else if (atk) {
    // cane thrust forward: "Charge!"
    hoseArm(ctx, [[40, -12], [56, -16], [66, -26]]);
    inkLine(ctx, [[60, -18], [74, -44]], 3.6, '#2a2230', false, 2.2);
    ball(ctx, 62, -22, 5, K_GOLD, K_GOLD_SH, 2.2, 0.8);
    glove(ctx, 66, -26, 7, -0.6);
  } else {
    const tap = f === 1 ? 4 : f === 2 ? 1.5 : 0;
    const hx = 58, hy = 8 - tap;
    hoseArm(ctx, [[41, -12], [58 + s, -6], [hx, hy]]);
    inkLine(ctx, [[hx + 2, hy - 2], [hx + 7, 46 - tap]], 3.6, '#2a2230', false, 2.2);
    line(ctx, [[hx + 1.2, hy], [hx + 5.6, 40 - tap]], 1, '#6a5a76', false, 0.8);
    shape(ctx, (c) => roundRectPath(c, hx + 4.4, 40 - tap, 5.4, 6.4, 1.6), { fill: '#e8e4dc', ink: 2, shadow: 'none' });
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
  const build = (c: Ctx) => smoothPath(c, ribbon(pts, pts.map((_, i) => (i === pts.length - 1 ? w * 0.8 : w))), true, 0.5);
  shape(ctx, build, { fill: A_PASTA, ink: 2.2, shadow: A_PASTA_SH, shadowOffset: [-1.6, -1.6] });
  // flat-ribbon highlight + sauce coating
  line(ctx, pts.map(([x, y]) => [x - w * 0.12, y - w * 0.14] as Pt), w * 0.22, '#fff1c2', true, 0.75);
  clipped(ctx, build, () => speckle(ctx, pts[2][0], pts[2][1], 14, 14, 5, A_SAUCE_HI, w * 0.22, seed, 0.9));
}

/** A noodle arm: two fettuccine strands with splayed noodle "fingers". */
function noodleArm(ctx: Ctx, pts: Pt[], seed: number) {
  const n = pts.length;
  const end = pts[n - 1], prev = pts[n - 2];
  const a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  for (const k of [-1, 0, 1]) {
    const fa = a + k * 0.55;
    fettuccine(ctx, [prev, end, [end[0] + Math.cos(fa) * 9, end[1] + Math.sin(fa) * 9], [end[0] + Math.cos(fa) * 15, end[1] + Math.sin(fa) * 15 + 2]], 4.2, seed + k);
  }
  fettuccine(ctx, pts.map(([x, y], i) => [x - 3 + i * 0.4, y + 2] as Pt), 6.4, seed + 7);
  fettuccine(ctx, pts, 6.8, seed + 11);
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

  ctx.save();
  ctx.translate(0, 53);
  ctx.rotate(tilt);
  ctx.translate(0, -53);

  // --- far noodle arm (behind the jar, seen through the glass)
  const wv = idle ? s * 3 : 0;
  if (wind) noodleArm(ctx, [[-36, -52], [-50, -66], [-58, -84], [-52, -104], [-38, -114]], 3);
  else if (atk) noodleArm(ctx, [[-36, -52], [-52, -58], [-62, -46], [-66, -28], [-70, -14]], 3);
  else noodleArm(ctx, [[-36, -52], [-52, -58], [-62, -46], [-65 - wv * 0.3, -26], [-68 - wv, -8], [-74 - wv, 4]], 3);

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
    eye(ctx, -19 + fx, -2 + fy, 10, { look: [-0.1, -0.3], lid: 'angry-l', pupil: 0.32, ink: 2.4 });
    eye(ctx, 16 + fx, -4 + fy, 10, { look: [-0.1, -0.3], lid: 'angry-r', pupil: 0.32, ink: 2.4 });
  } else {
    eye(ctx, -19 + fx, -2 + fy, 10, { look: [0.35, 0.12], lid: 'angry-l', pupil: 0.46, iris: '#7d9a3a', ink: 2.4 });
    eye(ctx, 16 + fx, -4 + fy, 10, { look: [0.35, 0.12], lid: 'angry-r', pupil: 0.46, iris: '#7d9a3a', ink: 2.4 });
  }
  brow(ctx, -19 + fx, -16 + fy, 20, 0.45, 5);
  brow(ctx, 16 + fx, -18 + fy, 20, -0.45, 5);
  if (idle) mouth(ctx, -1 + fx, 26 + fy, 34, 'snarl', { teeth: true });
  else mouth(ctx, -1 + fx, 24 + fy, 34, 'shout', { teeth: true, tongue: true, open: wind ? 0.8 : 1.15 });

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

  // --- crown lid (rattles in the wind-up, flips up on the attack)
  if (atk) {
    crownLid(ctx, -10, -100, -0.5);
    // geyser of Alfredo erupting forward
    const g: Pt[] = [[0, -52], [10, -70], [28, -84], [52, -86], [74, -76]];
    group(ctx, [
      { build: (c) => smoothPath(c, ribbon(g, [44, 34, 26, 22, 18]), true, 0.5), style: { fill: A_SAUCE, shadow: A_SAUCE_SH, shadowOffset: [-4, -4], gloss: [{ x: 18, y: -82, rx: 9, ry: 2, rot: -0.4, alpha: 0.8 }] } },
      { build: (c) => circlePath(c, 76, -76, 11), style: { fill: A_SAUCE, shadow: A_SAUCE_SH, shadowOffset: [-2.6, -2.6] } },
    ], BI * 0.85);
    for (const [dx, dy, r] of [[78, -96, 4], [60, -104, 3], [80, -56, 3.4], [40, -102, 2.4]] as [number, number, number][]) {
      shape(ctx, (c) => circlePath(c, dx, dy, r), { fill: A_SAUCE, ink: 2, shadow: 'none', gloss: [{ x: dx - r * 0.3, y: dy - r * 0.3, rx: r * 0.35, ry: r * 0.2, alpha: 0.7 }] });
    }
  } else {
    const rattle = wind ? (f === 0 ? -5 : -4) : idle ? Math.max(0, s) * -1.2 : 0;
    crownLid(ctx, 0, -55 + rattle, (wind ? 0.06 : -0.09) + (idle ? c4 * 0.015 : 0));
    if (wind) {
      // steam puffs of pressure under the lid
      for (const [px, py, r] of [[-48, -62, 6], [-56, -70, 4.4], [50, -64, 6], [58, -73, 4.4]] as [number, number, number][]) {
        shape(ctx, (c) => circlePath(c, px, py, r), { fill: 'rgba(255,255,255,0.85)', ink: 1.6, shadow: 'none' });
      }
    }
  }

  // --- near noodle arm
  if (wind) noodleArm(ctx, [[36, -52], [50, -66], [60, -86], [56, -108], [42, -120]], 5);
  else if (atk) noodleArm(ctx, [[36, -52], [52, -50], [64, -40], [76, -36], [84, -34]], 5);
  else noodleArm(ctx, [[36, -52], [52, -58], [62, -46], [65 + wv * 0.3, -26], [68 + wv, -8], [72 + wv, 4]], 5);

  ctx.restore();
}

registerBoss('ketchup', 150, 200, 75, 150, drawKetchup);
registerBoss('alfredo', 170, 200, 85, 140, drawAlfredo);
