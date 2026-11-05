/**
 * ENEMIES B — bar & café crimes: Cappuccino Ritardatario, Frappè Zuccheroso,
 * Glassa Balsamica, Il Telefonino Virale.
 */
import {
  Ctx, Pt, INK, shape, group, line, inkLine, ellipsePath, circlePath, roundRectPath, polyPath,
  speckle, glint, legs, eye, brow, mouth, shade, light, rng, vgrad,
} from '../painter';
import {
  TAU, LIMB, GLOVE, enemySprite, cyc, dripPath, cylPath, ringPath, heartPath, steamCurl, hoseArm,
  eyePair, cheeks, clipTo, shakeLines, mitt, twinkle,
} from './enemies_b_kit';
import { moustache } from './hero';

// ---------------------------------------------------------------------------
// 2. CAPPUCCINO RITARDATARIO — r14. Teal cup, towering foam with a latte heart,
//    milk moustache, a pocket watch stuck at 11:00 dangling from the handle.
// ---------------------------------------------------------------------------

const CUP = '#25a69c';
const CUP_SH = '#167a78';
const CUP_LT = '#7fd8cc';
const FOAM = '#fdf5e6';
const FOAM_SH = '#e5cfae';
const CREMA = '#c98a52';
const COCOA = '#6e3d22';
const GOLD = '#f2c14e';
const GOLD_SH = '#c88a26';

function pocketWatch(ctx: Ctx, x: number, y: number, r: number) {
  // bow ring
  shape(ctx, (c) => ringPath(c, x, y - r - 1.1, 1.3, 1.3, 0.55, 0.55), { fill: GOLD, ink: 0.8, shadow: 'none' });
  shape(ctx, (c) => circlePath(c, x, y, r), { fill: GOLD, ink: 1.2, shadow: GOLD_SH, shadowOffset: [-0.7, -0.8] });
  shape(ctx, (c) => circlePath(c, x, y, r * 0.72), { fill: '#fffaf0', ink: 0.6, shadow: 'none' });
  // ticks at 12/3/6/9
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    line(ctx, [[x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5], [x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62]], 0.45, INK);
  }
  // 11:00 — hour hand at 11, minute hand at 12
  const ah = -Math.PI / 2 - Math.PI / 6;
  line(ctx, [[x, y], [x + Math.cos(ah) * r * 0.38, y + Math.sin(ah) * r * 0.38]], 0.75, INK);
  line(ctx, [[x, y], [x, y - r * 0.58]], 0.55, INK);
  ctx.save();
  ctx.fillStyle = '#d23a3a';
  ctx.beginPath();
  circlePath(ctx, x, y, 0.45);
  ctx.fill();
  ctx.restore();
  glint(ctx, x - r * 0.45, y - r * 0.45, r * 0.22, r * 0.12, -0.7, 0.9);
}

function drawCappuccino(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);

  // legs under the saucer
  legs(ctx, 0, 8.6, f, { len: 4.4, spread: 11, thick: 2.4, color: LIMB, shoe: '#3a2620', stride: 4.2 });

  // saucer
  shape(ctx, (c) => ellipsePath(c, 0, 8.8, 13, 3.4), { fill: CUP_SH, ink: 2, shadow: 'none' });
  shape(ctx, (c) => ellipsePath(c, 0, 6.8, 16.2, 4.5), { fill: CUP, ink: 2, shadow: CUP_SH, shadowOffset: [-1.2, -1.6], gloss: [{ x: -9.5, y: 5.2, rx: 3, ry: 0.8, rot: -0.15, alpha: 0.6 }] });
  line(ctx, [[-10, 6.1], [-5, 7.9], [0, 8.3], [5, 7.9], [10, 6.1]], 0.8, CUP_LT, true, 0.8);
  // cup foot shadow on the saucer
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = CUP_SH;
  ctx.beginPath();
  ellipsePath(ctx, 0.8, 5.6, 9, 2.2);
  ctx.fill();
  ctx.restore();

  // handle (back-left loop)
  const hdl: Pt[] = [[-11.6, -6.6], [-16.6, -6.2], [-17.4, -1.6], [-11.2, 0.6]];
  inkLine(ctx, hdl, 3, CUP, true, 1.8);
  line(ctx, hdl.slice(0, 3), 0.9, CUP_LT, true, 0.8);

  // the pocket watch, swinging from the handle
  const sw = s * 1.3;
  const wx = -18 + sw, wy = 6.4;
  line(ctx, [[-16.4, -1.4], [-17.6 + sw * 0.5, 2], [wx, wy - 4.6]], 0.7, GOLD_SH, true);
  pocketWatch(ctx, wx, wy, 3.3);

  // cup body
  const body = (c: Ctx) => {
    c.moveTo(-12.4, -11);
    c.bezierCurveTo(-12.6, -2, -10.6, 3.4, -7.2, 4.7);
    c.quadraticCurveTo(0, 6.6, 7.2, 4.7);
    c.bezierCurveTo(10.6, 3.4, 12.6, -2, 12.4, -11);
    c.ellipse(0, -11, 12.4, 3.2, 0, 0, Math.PI, true);
    c.closePath();
  };
  shape(ctx, body, { fill: CUP, shadow: CUP_SH, shadowOffset: [-3, -1.4], ink: 2.1, gloss: [{ x: -8.6, y: -4.8, rx: 1.3, ry: 4.2, rot: 0.12, alpha: 0.55 }, { x: -8, y: 1.6, rx: 0.8, ry: 0.8, alpha: 0.5 }] });

  // foam dome
  const foam = (c: Ctx) => {
    c.moveTo(-12, -10);
    c.bezierCurveTo(-13.6, -14.5, -11.4, -17.6, -8.4, -18.2);
    c.bezierCurveTo(-8.8, -22.6, -3.2, -25.6, 0.6, -24.4);
    c.bezierCurveTo(4.6, -26, 9.6, -22.6, 8.8, -18.4);
    c.bezierCurveTo(12, -17.6, 13.8, -14, 12, -10);
    c.quadraticCurveTo(0, -6.8, -12, -10);
    c.closePath();
  };
  shape(ctx, foam, { fill: FOAM, shadow: FOAM_SH, shadowOffset: [-2.2, -2.4], ink: 2.1, gloss: [{ x: -6.5, y: -20.5, rx: 2.4, ry: 1.2, rot: -0.5, alpha: 0.9 }] });
  clipTo(ctx, foam, () => {
    // crema patch + white latte-art heart
    shape(ctx, (c) => ellipsePath(c, 0.4, -15.2, 8.2, 5.2), { fill: CREMA, ink: 0, shadow: shade(CREMA, 0.18), shadowOffset: [-1.4, -1.4] });
    shape(ctx, (c) => heartPath(c, 0.6, -15.6, 3.7), { fill: FOAM, ink: 0, shadow: 'none' });
    line(ctx, [[0.6, -18.8], [0.6, -12.6]], 0.6, shade(CREMA, 0.1), false, 0.6);
    speckle(ctx, 0, -20, 9, 3, 10, COCOA, 0.45, 41, 0.75);
  });

  // front lip of the cup (over the foam)
  shape(ctx, (c) => {
    c.ellipse(0, -11, 12.4, 3.2, 0, Math.PI, 0, true);
    c.ellipse(0, -11.2, 11, 2.1, 0, 0, Math.PI, false);
    c.closePath();
  }, { fill: CUP_LT, ink: 1.3, shadow: 'none' });

  // face
  eyePair(ctx, 1.6, -4.4, 3.1, { sp: 8.4, look: [0.32, 0.12], near: 1.08, brow: 0.46, browDy: 1.42, browTh: 1.5, lidL: 'angry-l', lidR: 'angry-r' });
  mouth(ctx, 2.2, 2.4, 6.6, 'snarl', { open: 0.9 });
  // milk-foam moustache
  shape(ctx, (c) => {
    c.moveTo(2.2, 0.2);
    c.bezierCurveTo(0.6, -1.6, -2.8, -1.2, -3.6, 0.4);
    c.bezierCurveTo(-2.6, 1.6, -0.2, 1.6, 2.2, 0.9);
    c.bezierCurveTo(4.6, 1.6, 7.2, 1.6, 8.2, 0.4);
    c.bezierCurveTo(7.4, -1.2, 3.8, -1.6, 2.2, 0.2);
    c.closePath();
  }, { fill: FOAM, ink: 1.1, shadow: FOAM_SH, shadowOffset: [-0.6, -0.6] });
  cheeks(ctx, [[-3.5, -0.4], [8.8, -0.6]], 1.5, 0.9, '#ff7a6a', 0.35);

  // steam
  steamCurl(ctx, -3.4, -26, 8, ph, 1.5, 0.55);
  steamCurl(ctx, 4.6, -26.8, 7, ph + 2.2, 1.3, 0.45);
}

enemySprite('cappuccino', 44, 52, 34, drawCappuccino, 23);

// ---------------------------------------------------------------------------
// 6. FRAPPÈ ZUCCHEROSO — r14. A sugar-rushing iced coffee cup: whipped-cream
//    mountain, caramel drizzle, sprinkles, a candy-striped straw. Dasher.
// ---------------------------------------------------------------------------

const DRINK = '#c98d58';
const DRINK_DK = '#9a5b34';
const CREAM = '#fffaf0';
const CREAM_SH = '#ead7c2';
const CARAMEL = '#e39a2f';
const CARAMEL_SH = '#a9611a';
const STRAW = '#ff4f9a';

function drawFrappe(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);
  const jit = f % 2 ? 0.4 : -0.4;

  // far arm (pumping)
  hoseArm(ctx, -8.2, -3, -14.5 - s * 2, 2.5 - s * 2.5, { bend: -0.2, thick: 1.9, handR: 2.4 });
  // legs (sprinting)
  legs(ctx, 0, 8, f, { len: 5.2, spread: 8, thick: 2.3, color: LIMB, shoe: '#ff5aa5', stride: 7 });

  // straw (behind the cream)
  const st: Pt[] = [[2.5, -16], [11.5, -34]];
  inkLine(ctx, st, 3.2, STRAW, false, 1.2);
  clipTo(ctx, (c) => {
    const [a, b] = st;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy), nx = -dy / L * 1.6, ny = dx / L * 1.6;
    polyPath(c, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]);
  }, () => {
    for (let t = 0.05; t < 1; t += 0.14) {
      const x = st[0][0] + (st[1][0] - st[0][0]) * t, y = st[0][1] + (st[1][1] - st[0][1]) * t;
      line(ctx, [[x - 2.4, y - 0.4], [x + 2.4, y + 1.6]], 1.1, '#ffffff', false, 0.95);
    }
  });
  line(ctx, [[3.3, -18.5], [10.6, -33]], 0.6, '#ffd1e6', false, 0.8);

  // cup
  const cup = (c: Ctx) => cylPath(c, 0, -11, 8.2, 11, 7.4, 3, 2.2);
  shape(ctx, cup, { fill: vgrad(ctx, -11, 9, [[0, '#ddb07c'], [0.5, DRINK], [1, DRINK_DK]]), shadow: shade(DRINK, 0.25), shadowOffset: [-2.6, -0.8], ink: 2.1 });
  clipTo(ctx, cup, () => {
    // ice cubes
    const ice = (x: number, y: number, sz: number, r: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#f4fbff';
      ctx.beginPath();
      roundRectPath(ctx, -sz / 2, -sz / 2, sz, sz, sz * 0.25);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    };
    ice(-8.2, -7.2, 4, 0.3);
    ice(8.6, -8.6, 3.6, -0.4);
    ice(-6.6, 4, 3, 0.6);
    // clear band at the top (plastic above the drink)
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#e8f4fa';
    ctx.fillRect(-12, -14, 24, 3.4);
    ctx.restore();
    // plastic shine
    line(ctx, [[-8.6, -8], [-6.8, 5.5]], 1.4, '#ffffff', false, 0.55);
    line(ctx, [[8.4, -7], [7.2, 3]], 0.7, '#ffffff', false, 0.4);
  });
  // plastic rim
  shape(ctx, (c) => ringPath(c, 0, -11, 11.6, 3.3, 10.2, 2.4), { fill: '#f1f6fa', ink: 1.2, shadow: 'none' });

  // whipped-cream mountain (3 tiers + curl), one silhouette
  const tier = (x: number, y: number, w: number, h: number, bumps: number) => (c: Ctx) => {
    c.moveTo(x - w, y);
    for (let i = 0; i < bumps; i++) {
      const x0 = x - w + (i / bumps) * 2 * w, x1 = x - w + ((i + 1) / bumps) * 2 * w;
      const k = 1 - Math.abs((i + 0.5) / bumps - 0.5) * 0.9;
      c.quadraticCurveTo((x0 + x1) / 2, y - h * k * 1.25, x1, y - (i === bumps - 1 ? 0 : h * 0.18));
    }
    c.quadraticCurveTo(x, y + h * 0.42, x - w, y);
    c.closePath();
  };
  const t1 = tier(0, -11.6, 12, 5.4, 4);
  const t2 = tier(0.6, -16.4, 9.4, 5, 3);
  const t3 = tier(1, -20.8, 6.4, 4.6, 2);
  const curl = (c: Ctx) => {
    c.moveTo(-2.2, -24);
    c.quadraticCurveTo(-1.4, -29.6, 3.8, -29.2);
    c.quadraticCurveTo(1.4, -27.2, 3.6, -23.4);
    c.closePath();
  };
  const dr = 1 + 0.35 * Math.sin(ph);
  const drips = (c: Ctx) => {
    dripPath(c, -8.6, -10.8, 2.6, 4.2 * dr);
    dripPath(c, 7.4, -10.5, 2.3, 3 * (2 - dr));
  };
  group(ctx, [
    { build: drips, style: { fill: CARAMEL, shadow: CARAMEL_SH, shadowOffset: [-0.7, -0.8] } },
    { build: t1, style: { fill: CREAM, shadow: CREAM_SH, shadowOffset: [-1.8, -1.8] } },
    { build: t2, style: { fill: CREAM, shadow: CREAM_SH, shadowOffset: [-1.6, -1.6] } },
    { build: t3, style: { fill: CREAM, shadow: CREAM_SH, shadowOffset: [-1.4, -1.4] } },
    { build: curl, style: { fill: CREAM, shadow: CREAM_SH, shadowOffset: [-0.8, -0.8] } },
  ], 2);
  // tier separation creases
  line(ctx, [[-9.5, -12.6], [-3, -13.4], [3, -13.4], [9.8, -12.4]], 0.9, CREAM_SH, true, 0.9);
  line(ctx, [[-6.8, -17.4], [0, -18.2], [7.6, -17.2]], 0.9, CREAM_SH, true, 0.9);
  // caramel zig-zag drizzle
  const zz: Pt[] = [[-9.8, -13.2], [-5.6, -19.2], [-3.4, -13.8], [0.4, -22.6], [2.8, -15.8], [6.4, -21.4], [9.4, -13.6]];
  inkLine(ctx, zz, 1.3, CARAMEL, false, 0.7);
  line(ctx, zz.slice(0, 3), 0.45, '#ffe0a0', false, 0.9);
  // sprinkles
  const R = rng(5);
  const cols = ['#ff5f9e', '#5cc8ff', '#ffd23f', '#7be06a', '#b07cff'];
  for (let i = 0; i < 11; i++) {
    const x = -8 + R() * 17, y = -13 - R() * 11;
    if (Math.abs(x - 1) * 0.55 + (y + 13) * -0.1 > 6) continue;
    const a = R() * Math.PI;
    line(ctx, [[x - Math.cos(a) * 0.8, y - Math.sin(a) * 0.8], [x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.8]], 0.95, cols[i % cols.length]);
  }
  glint(ctx, -3, -26.6, 1.1, 0.6, -0.6, 0.9);

  // face: sugar-rush (huge eyes, pin pupils, maniac grin)
  ctx.save();
  ctx.translate(jit * 0.5, 0);
  eye(ctx, -3.6, -4.6, 3.6, { look: [0.3, -0.05], pupil: 0.26, squash: 1.18 });
  eye(ctx, 4.8, -4.8, 4.1, { look: [0.25, 0.05], pupil: 0.3, squash: 1.18 });
  brow(ctx, -3.9, -10.4, 5.2, -0.32, 1.45);
  brow(ctx, 5.1, -11, 5.8, 0.38, 1.45);
  mouth(ctx, 1.2, 2.4, 11.6, 'grin', { open: 1.05, tongue: true });
  ctx.restore();
  cheeks(ctx, [[-6.6, 0.6], [9.6, 0.2]], 1.6, 0.9, '#ff5f9e', 0.45);

  // jitter lines (vibrating with sugar)
  shakeLines(ctx, -13.2 + jit, -3, -1, 3, 2.6, 2.8, INK, 0.65, 0.9);
  shakeLines(ctx, 13.2 - jit, -5, 1, 3, 2.6, 2.8, INK, 0.65, 0.9);

  // near arm
  hoseArm(ctx, 8.6, -2.5, 15 + s * 2.2, 2.4 + s * 2, { bend: 0.25, thick: 1.9, handR: 2.5 });
}

enemySprite('frappe', 42, 56, 38, drawFrappe);

// ---------------------------------------------------------------------------
// 12. GLASSA BALSAMICA — r13. A smug, monocled squeeze bottle of balsamic
//     glaze, hands on hips, trailing a glossy zig-zag drizzle.
// ---------------------------------------------------------------------------

const GLAZE = '#4f1d2c';
const GLAZE_SH = '#2c0d18';
const GLAZE_HI = '#b0607a';
const LABEL = '#f3e6c6';

function drawGlassa(ctx: Ctx, f: number) {
  const { s } = cyc(f);

  // zig-zag drizzle ribbon trailing behind (to the left) from the nozzle
  const zig = f % 2 === 0 ? 1 : -1;
  const rib: Pt[] = [
    [-0.4, -26.2], [-5.5, -28.4], [-11, -25], [-13.4, -19.5],
    [-9.4 - zig * 0.5, -15.6], [-15.2 + zig * 0.5, -10.6], [-10.2 - zig * 0.5, -5.8], [-15.6 + zig * 0.5, -0.8], [-11 - zig * 0.4, 4], [-15.2, 9.5], [-12.4, 13.6],
  ];
  inkLine(ctx, rib, 2.2, GLAZE, true, 1.1);
  line(ctx, rib.slice(1, 5), 0.6, GLAZE_HI, true, 0.9);
  shape(ctx, (c) => ellipsePath(c, -12.6, 14.4, 3.2, 1.1), { fill: GLAZE, ink: 1, shadow: 'none', gloss: [{ x: -13.4, y: 14, rx: 1, ry: 0.3, alpha: 0.6 }] });

  // legs
  legs(ctx, 0, 8.5, f, { len: 4.6, spread: 8, thick: 2, color: LIMB, shoe: '#1d1418', stride: 3.6 });

  // arms akimbo (hands on hips)
  hoseArm(ctx, -8.6, -5, -9.4, 2.4, { bend: 0.55, thick: 1.8, handR: 2.2 });

  // bottle
  const bottle = (c: Ctx) => {
    c.moveTo(-9, 4.5);
    c.lineTo(-9, -7.5);
    c.quadraticCurveTo(-9, -13.2, -4.7, -14.8);
    c.lineTo(-4.7, -16.6);
    c.lineTo(4.7, -16.6);
    c.lineTo(4.7, -14.8);
    c.quadraticCurveTo(9, -13.2, 9, -7.5);
    c.lineTo(9, 4.5);
    c.quadraticCurveTo(9, 9.6, 4.2, 9.6);
    c.lineTo(-4.2, 9.6);
    c.quadraticCurveTo(-9, 9.6, -9, 4.5);
    c.closePath();
  };
  shape(ctx, bottle, {
    fill: GLAZE, shadow: GLAZE_SH, shadowOffset: [-2.4, -1.2], ink: 2, rim: GLAZE_HI,
    gloss: [{ x: -6.4, y: -2.5, rx: 1.15, ry: 6.4, rot: 0.02, alpha: 0.7 }, { x: -5.4, y: -11.6, rx: 1.4, ry: 0.8, rot: -0.6, alpha: 0.8 }, { x: 6.6, y: 4, rx: 0.6, ry: 2.6, alpha: 0.35 }],
  });

  // cap + nozzle (gold, posh)
  shape(ctx, (c) => {
    roundRectPath(c, -5.4, -21.2, 10.8, 5, 1.4);
  }, { fill: GOLD, ink: 1.6, shadow: GOLD_SH, shadowOffset: [-1.2, -0.8], gloss: [{ x: -3.2, y: -19.8, rx: 1, ry: 1.6, alpha: 0.7 }] });
  for (let i = -3; i <= 3; i += 1.5) line(ctx, [[i, -20.4], [i, -16.9]], 0.5, GOLD_SH, false, 0.8);
  shape(ctx, (c) => {
    c.moveTo(-2.6, -21);
    c.lineTo(-0.9, -26.4);
    c.quadraticCurveTo(0, -27.2, 0.9, -26.4);
    c.lineTo(2.6, -21);
    c.closePath();
  }, { fill: GOLD, ink: 1.4, shadow: GOLD_SH, shadowOffset: [-0.7, -0.4] });

  // label (cream, gold border) carrying the face
  const label = (c: Ctx) => roundRectPath(c, -7.4, -10.2, 14.8, 15.4, [4, 4, 5, 5]);
  shape(ctx, label, { fill: LABEL, ink: 1.2, shadow: '#dcc9a0', shadowOffset: [-1.4, -1] });
  ctx.save();
  ctx.setLineDash([0.8, 0.8]);
  ctx.beginPath();
  roundRectPath(ctx, -6.2, -9, 12.4, 13, [3.2, 3.2, 4, 4]);
  ctx.strokeStyle = GOLD_SH;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
  // tiny grape crest
  for (const [gx, gy] of [[-0.9, 2.2], [0.9, 2.2], [0, 3.6], [-1.8, 0.9], [0, 0.9], [1.8, 0.9]] as Pt[]) {
    shape(ctx, (c) => circlePath(c, gx + 0.4, gy, 0.8), { fill: '#7b3a7a', ink: 0, shadow: 'none' });
  }
  line(ctx, [[0.4, 0], [1.2, -1.1]], 0.5, '#3f8f3a');

  // smug aristocratic face
  eye(ctx, -2.4, -5, 2.5, { look: [0.42, 0.3], lid: 'half', pupil: 0.52 });
  eye(ctx, 3.8, -5.1, 2.7, { look: [0.42, 0.3], lid: 'half', pupil: 0.52 });
  brow(ctx, -2.6, -9.1, 4, -0.38, 1.15);
  brow(ctx, 4, -8.2, 4, -0.08, 1.15);
  // monocle (right eye) + chain
  shape(ctx, (c) => ringPath(c, 3.8, -5, 3.7, 3.7, 2.9, 2.9), { fill: GOLD, ink: 0.8, shadow: 'none' });
  line(ctx, [[6.6, -2.8], [7.6, 0.6], [7, 4]], 0.5, GOLD_SH, true);
  glint(ctx, 2.4, -6.6, 0.8, 0.4, -0.7, 0.8);
  moustache(ctx, 0.9, -0.6, 4.6, '#3b1e14');
  line(ctx, [[-0.4, 2.6], [1.5, 2.9], [3.4, 2.1]], 0.9, INK, true);

  // bow tie at the neck
  shape(ctx, (c) => {
    c.moveTo(0, -14);
    c.lineTo(-4.4, -16.4);
    c.lineTo(-4.4, -11.6);
    c.closePath();
    c.moveTo(0, -14);
    c.lineTo(4.4, -16.4);
    c.lineTo(4.4, -11.6);
    c.closePath();
  }, { fill: '#e2383f', ink: 1.1, shadow: '#a51f31', shadowOffset: [-0.6, -0.6] });
  shape(ctx, (c) => roundRectPath(c, -1.1, -15.2, 2.2, 2.4, 0.6), { fill: '#e2383f', ink: 0.9, shadow: 'none' });

  // drip running down the nozzle
  shape(ctx, (c) => dripPath(c, 1.3, -25.4, 1.1, 3.6 + (s + 1) * 0.6), { fill: GLAZE, ink: 0.8, shadow: 'none' });

  // near arm akimbo
  hoseArm(ctx, 8.6, -5, 9.4, 2.4, { bend: -0.55, thick: 1.8, handR: 2.2 });
}

enemySprite('glassa', 40, 54, 35, drawGlassa, 21);

// ---------------------------------------------------------------------------
// 7. IL TELEFONINO VIRALE — r13. A phone on a selfie-stick tripod with a ring
//    light, filming you, REC dot blinking, likes floating off.
// ---------------------------------------------------------------------------

const CASE = '#9a44e0';
const CASE_SH = '#6a24a8';
const SCREEN_A = '#d9fbff';
const SCREEN_B = '#86def2';
const PIX = '#1b2148';

function drawSmartphone(ctx: Ctx, f: number) {
  const lift = [0, 1, 0, 1][f];
  const side = f < 2 ? -1 : 1;

  // ring light halo (behind)
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ringPath(ctx, 0, -12.6, 16.4, 16.4, 10.6, 10.6);
  ctx.fill();
  ctx.restore();
  shape(ctx, (c) => ringPath(c, 0, -12.6, 14.2, 14.2, 11.6, 11.6), { fill: '#fff6dc', ink: 1.3, shadow: '#e8cf8e', shadowOffset: [-0.8, -0.8] });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    shape(ctx, (c) => circlePath(c, Math.cos(a) * 12.9, -12.6 + Math.sin(a) * 12.9, 0.55), { fill: '#ffffff', ink: 0, shadow: 'none' });
  }

  // tripod (selfie-stick legs)
  const hip: Pt = [0, 8];
  const footL: Pt = [-7.6 + (side < 0 ? lift * 1.2 : 0), 14.2 - (side < 0 ? lift * 1.6 : 0)];
  const footR: Pt = [7.6 + (side > 0 ? -lift * 1.2 : 0), 14.2 - (side > 0 ? lift * 1.6 : 0)];
  inkLine(ctx, [hip, [1.6, 12.6]], 1.5, '#9ea6b6', false, 1);
  inkLine(ctx, [hip, footL], 1.6, '#d3d8e2', false, 1.05);
  inkLine(ctx, [hip, footR], 1.6, '#d3d8e2', false, 1.05);
  for (const p of [footL, footR]) shape(ctx, (c) => ellipsePath(c, p[0], p[1] + 0.4, 1.6, 1.1), { fill: '#2b2427', ink: 0.9, shadow: 'none' });
  // stick + joint
  inkLine(ctx, [[0, 0], [0, 8.4]], 2, '#dfe4ec', false, 1.1);
  shape(ctx, (c) => roundRectPath(c, -1.8, 4.2, 3.6, 1.8, 0.6), { fill: '#6d7486', ink: 0.8, shadow: 'none' });
  shape(ctx, (c) => circlePath(c, 0, 8.2, 1.7), { fill: '#4b5163', ink: 1, shadow: 'none' });

  ctx.save();
  ctx.rotate(-0.06);
  // phone clamp
  shape(ctx, (c) => roundRectPath(c, -4.6, -0.6, 9.2, 3.2, 1.2), { fill: '#3d4254', ink: 1.2, shadow: 'none' });
  // phone (case)
  const phone = (c: Ctx) => roundRectPath(c, -8.6, -26.2, 17.2, 27.6, 4.2);
  shape(ctx, phone, { fill: CASE, shadow: CASE_SH, shadowOffset: [-2.2, -1.6], ink: 2, gloss: [{ x: -6.6, y: -20, rx: 0.8, ry: 4.4, alpha: 0.5 }] });
  // side buttons
  shape(ctx, (c) => roundRectPath(c, 8.2, -20, 1.6, 4.4, 0.6), { fill: CASE_SH, ink: 0.8, shadow: 'none' });
  // screen
  const scr = (c: Ctx) => roundRectPath(c, -6.8, -23.8, 13.6, 22.8, 2.4);
  shape(ctx, scr, { fill: vgrad(ctx, -23.8, -1, [[0, SCREEN_A], [1, SCREEN_B]]), ink: 1.1, inkColor: '#21142e', shadow: 'none' });
  clipTo(ctx, scr, () => {
    // screen glare
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    polyPath(ctx, [[-7, -12], [7, -24], [7, -19], [-7, -7]]);
    ctx.fill();
    ctx.restore();
    // pixel face (angry brows, chunky eyes, evil grin)
    const p = 2;
    const ox = -5.6, oy = -19.4;
    const map = [
      'B....B',
      '.B..B.',
      'EE..EE',
      'EE..EE',
      '......',
      'M....M',
      '.MMMM.',
    ];
    ctx.fillStyle = PIX;
    map.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === '.') continue;
        const x = ox + i * p + (row[i] === 'B' ? 0 : 0), y = oy + j * p;
        ctx.fillRect(x, y, p + 0.05, p + 0.05);
      }
    });
    // eye glints looking right
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 1 * p + 0.25, oy + 2 * p + 0.25, 0.9, 0.9);
    ctx.fillRect(ox + 5 * p + 0.25, oy + 2 * p + 0.25, 0.9, 0.9);
    // teeth pixels
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 2 * p + 0.2, oy + 6 * p, 0.9, 0.9);
    ctx.fillRect(ox + 3.5 * p + 0.2, oy + 6 * p, 0.9, 0.9);
  });
  // status bar: REC dot (blinking) + battery
  const rec = f < 2;
  if (rec) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath();
    circlePath(ctx, -4.4, -21.4, 2.3);
    ctx.fill();
    ctx.restore();
  }
  shape(ctx, (c) => circlePath(c, -4.4, -21.4, 1.25), { fill: rec ? '#ff2d3a' : '#7a2a33', ink: 0.7, shadow: 'none' });
  shape(ctx, (c) => roundRectPath(c, 2.4, -22.3, 3, 1.6, 0.4), { fill: '#3ec46d', ink: 0.6, shadow: 'none' });
  // front camera
  shape(ctx, (c) => roundRectPath(c, -1.6, -25.4, 3.2, 1.2, 0.6), { fill: '#21142e', ink: 0, shadow: 'none' });
  ctx.restore();

  // floating likes
  for (let k = 0; k < 2; k++) {
    const t = ((f + k * 2) % 4) / 4;
    const x = 12.6 + k * 1.6 + Math.sin(t * TAU) * 0.8, y = -10 - k * 6 - t * 7;
    ctx.save();
    ctx.globalAlpha = 1 - t * 0.55;
    shape(ctx, (c) => heartPath(c, x, y, 2.1 - t * 0.5), { fill: '#ff4f8b', ink: 0.9, shadow: '#d42f6c', shadowOffset: [-0.5, -0.5] });
    ctx.restore();
  }
}

enemySprite('smartphone', 42, 52, 33, drawSmartphone);

void light; void speckle; void mitt; void twinkle; void GLOVE; void eyePair;
