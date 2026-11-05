/**
 * ENEMIES B — pizza crimes: Fetta Hawaiana, Margherita Macchiata.
 */
import {
  Ctx, Pt, INK, shape, group, line, inkLine, ellipsePath, circlePath, smoothPath, speckle, glint,
  legs, eye, brow, mouth, shade, light, rng,
} from '../painter';
import {
  TAU, LIMB, enemySprite, cyc, dripPath, hoseArm, eyePair, cheeks, clipTo, twinkle,
} from './enemies_b_kit';

const CRUST = '#e4a457';
const CRUST_SH = '#b8692f';
const CHAR = '#7d3f1c';
const SAUCE = '#d8432b';
const CHEESE = '#ffcb52';
const CHEESE_SH = '#f0963a';
const PINE = '#fff27a';
const PINE_SH = '#e7bb2a';
const HAM = '#f58ea0';
const HAM_SH = '#d65b78';
const BASIL = '#36a64a';

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

/** Pineapple tidbit (little wedge with fibre lines). */
function pineChunk(ctx: Ctx, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  shape(ctx, (c) => {
    c.moveTo(-s * 0.55, s * 0.55);
    c.lineTo(-s * 0.95, -s * 0.35);
    c.quadraticCurveTo(0, -s * 0.95, s * 0.95, -s * 0.35);
    c.lineTo(s * 0.55, s * 0.55);
    c.quadraticCurveTo(0, s * 0.75, -s * 0.55, s * 0.55);
    c.closePath();
  }, { fill: PINE, ink: 1.1, shadow: PINE_SH, shadowOffset: [-s * 0.3, -s * 0.35], gloss: [{ x: -s * 0.3, y: -s * 0.35, rx: s * 0.3, ry: s * 0.14, rot: -0.3, alpha: 0.8 }] });
  line(ctx, [[-s * 0.35, s * 0.4], [-s * 0.55, -s * 0.3]], 0.55, PINE_SH, false, 0.9);
  line(ctx, [[s * 0.1, s * 0.45], [s * 0.1, -s * 0.45]], 0.55, PINE_SH, false, 0.9);
  ctx.restore();
}

/** Pink ham square with marbling. */
function hamPiece(ctx: Ctx, x: number, y: number, s: number, rot: number, seed: number) {
  const R = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const pts: Pt[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4;
    const k = 0.85 + R() * 0.3;
    pts.push([Math.cos(a) * s * k, Math.sin(a) * s * k * 0.85]);
  }
  shape(ctx, (c) => smoothPath(c, pts, true, 0.25), { fill: HAM, ink: 1.1, shadow: HAM_SH, shadowOffset: [-s * 0.3, -s * 0.35], gloss: [{ x: -s * 0.3, y: -s * 0.35, rx: s * 0.32, ry: s * 0.16, rot: -0.4, alpha: 0.55 }] });
  line(ctx, [[-s * 0.4, s * 0.1], [0, -s * 0.15], [s * 0.35, s * 0.2]], 0.6, '#ffd0d8', true, 0.9);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 1. FETTA HAWAIANA — r15. A furious slice of pineapple-and-ham pizza.
// ---------------------------------------------------------------------------

function drawHawaiana(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);
  const drip = (k: number) => 1 + 0.5 * Math.sin(ph + k);

  // legs (behind the slice tip)
  legs(ctx, 0.6, 5.5, f, { len: 6.6, spread: 9, thick: 2.5, color: LIMB, shoe: '#e5483b', stride: 5 });

  ctx.save();
  ctx.translate(0, 1.5);
  ctx.rotate(0.07);

  // far arm (raised fist, behind the slice)
  hoseArm(ctx, -12, -8, -18.5 + s * 0.8, -15.5 - Math.abs(s) * 1.2, { bend: -0.25, thick: 2, handR: 2.6 });

  // slice body (cheese) + cheese drips, one silhouette
  const body = (c: Ctx) => {
    c.moveTo(-17.5, -15.5);
    c.quadraticCurveTo(-9, -1.5, -0.8, 10);
    c.quadraticCurveTo(1, 12.2, 2.6, 9.8);
    c.quadraticCurveTo(10.5, -1.5, 17.5, -15.5);
    c.closePath();
  };
  const drips = (c: Ctx) => {
    dripPath(c, -11.6, -6.6, 3.2, 4.6 * drip(0));
    dripPath(c, 12.2, -5.6, 3.6, 6.4 * drip(1.6));
    dripPath(c, 6.3, 2.2, 2.6, 3.4 * drip(3.1));
    dripPath(c, 1, 10.5, 2.2, 3.6 * drip(4.4));
  };
  group(ctx, [
    { build: drips, style: { fill: CHEESE, shadow: CHEESE_SH, shadowOffset: [-1.2, -1.2] } },
    { build: body, style: { fill: CHEESE, shadow: CHEESE_SH, shadowOffset: [-2.6, -2], gloss: [{ x: -9.5, y: -11, rx: 3.2, ry: 1.6, rot: -0.9, alpha: 0.5 }] } },
  ], 2.2);

  clipTo(ctx, body, () => {
    // tomato sauce peeking out under the crust and through holes in the cheese
    ctx.beginPath();
    ctx.moveTo(-19, -18);
    ctx.lineTo(19, -18);
    ctx.lineTo(19, -12.6);
    for (let i = 0; i <= 8; i++) {
      const x = 19 - i * 4.75;
      ctx.quadraticCurveTo(x - 1.2, -10.4 - (i % 2) * 1.6, x - 2.4, -12.6 + (i % 3) * 0.5);
    }
    ctx.closePath();
    ctx.fillStyle = SAUCE;
    ctx.fill();
    speckle(ctx, 0, -2, 9, 10, 9, '#e8742f', 1.1, 21, 0.7);
    // browned cheese bubbles
    speckle(ctx, 0, -4, 13, 10, 7, '#e9902f', 0.9, 5, 0.55);
  });

  // toppings
  pineChunk(ctx, -11.2, -11.2, 3.3, -0.4);
  hamPiece(ctx, 12.6, -10.6, 3.3, 0.5, 3);
  hamPiece(ctx, -5.2, 0.6, 2.5, -0.3, 9);
  pineChunk(ctx, 5.4, 3.6, 2.4, 0.5);

  // crust (thick puffy cornicione) with leopard char
  const crust = (c: Ctx) => {
    c.moveTo(-19.4, -13.6);
    c.quadraticCurveTo(0, -31.5, 19.4, -13.6);
    c.quadraticCurveTo(20.6, -10, 16.4, -10.8);
    c.quadraticCurveTo(0, -22.6, -16.4, -10.8);
    c.quadraticCurveTo(-20.6, -10, -19.4, -13.6);
    c.closePath();
  };
  shape(ctx, crust, { fill: CRUST, shadow: CRUST_SH, shadowOffset: [-1.6, -2.2], ink: 2.2, gloss: [{ x: -6, y: -20.2, rx: 4.5, ry: 1.2, rot: -0.28, alpha: 0.55 }, { x: 7.5, y: -20, rx: 2, ry: 0.8, rot: 0.25, alpha: 0.4 }] });
  clipTo(ctx, crust, () => {
    const R = rng(77);
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      const x = -17 + t * 34;
      const y = -14.6 - Math.sin(t * Math.PI) * 7.6 + (R() - 0.5) * 2;
      ctx.beginPath();
      ellipsePath(ctx, x, y, 0.9 + R() * 0.9, 0.6 + R() * 0.5, R() * 3);
      ctx.fillStyle = CHAR;
      ctx.globalAlpha = 0.75;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // hibiscus tucked behind the "ear" (Hawaiian, obviously)
  const hx = -14.6, hy = -18.4;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - 0.3;
    shape(ctx, (c) => ellipsePath(c, hx + Math.cos(a) * 2.6, hy + Math.sin(a) * 2.6, 2.4, 1.7, a), { fill: '#ff5d8a', ink: 1, shadow: '#d83a6b', shadowOffset: [-0.6, -0.7] });
  }
  shape(ctx, (c) => circlePath(c, hx, hy, 1.4), { fill: '#ffe066', ink: 0.9, shadow: 'none' });
  line(ctx, [[hx + 0.4, hy - 0.2], [hx + 2.2, hy - 1.6]], 0.6, '#d8452f');

  // face
  eyePair(ctx, 1.4, -8.8, 3.5, { sp: 9.2, look: [0.34, 0.1], near: 1.08, brow: 0.5, browDy: 1.5, browTh: 1.7 });
  mouth(ctx, 2, -1.8, 9.6, 'snarl', { open: 1.05 });
  cheeks(ctx, [[-4.6, -4.2], [8.8, -4.4]], 1.7, 1, '#ff6a3d', 0.45);

  // near arm: angry fist pumping forward
  hoseArm(ctx, 11.6, -6, 17.4 + s * 1.2, -2.2 - s * 0.8, { bend: 0.3, thick: 2, handR: 2.7 });
  ctx.restore();
}

enemySprite('hawaiana', 46, 50, 31, drawHawaiana);

// ---------------------------------------------------------------------------
// 5. MARGHERITA MACCHIATA — r14. A ketchup-stained pizza spinning like a UFO.
// ---------------------------------------------------------------------------

const KETCHUP = '#ee1d36';
const KETCHUP_SH = '#a90f26';

function drawMacchiata(ctx: Ctx, f: number) {
  const cx = 0, cy = -3;
  const RX = 17.5, RY = 11;
  const spin = (f / 4) * (Math.PI / 2); // 4-fold pattern → seamless loop

  // whoosh arcs (behind)
  for (let k = 0; k < 2; k++) {
    const a0 = spin * 0.5 + k * Math.PI + 0.3;
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (i / 8) * 1.1;
      pts.push([cx + Math.cos(a) * (RX + 3.2), cy + 2 + Math.sin(a) * (RY + 2.6)]);
    }
    line(ctx, pts, 1.3, '#ffffff', true, 0.45);
  }

  // underside (UFO belly) + rim lights
  shape(ctx, (c) => ellipsePath(c, cx, cy + 3.4, RX - 0.4, RY - 0.2), { fill: '#9aa3b5', shadow: '#6d7488', shadowOffset: [-2.5, -3.2], ink: 2.1 });
  // glowing belly window
  shape(ctx, (c) => ellipsePath(c, cx, cy + 9.6, 5.5, 2.2), { fill: '#8ff6ff', ink: 1.2, shadow: '#4cc4e0', shadowOffset: [-0.8, -0.8], gloss: [{ x: cx - 2, y: cy + 8.9, rx: 1.6, ry: 0.5, alpha: 0.9 }] });

  // crust disc
  const disc = (c: Ctx) => ellipsePath(c, cx, cy, RX, RY);
  shape(ctx, disc, { fill: CRUST, shadow: CRUST_SH, shadowOffset: [-2, -2.6], ink: 2.1, gloss: [{ x: cx - 9, y: cy - 7.2, rx: 5, ry: 1.6, rot: -0.25, alpha: 0.5 }] });
  // leopard char on the rim (rotates)
  clipTo(ctx, disc, () => {
    const R = rng(12);
    for (let i = 0; i < 16; i++) {
      const a = spin + (i / 16) * TAU + R() * 0.2;
      const x = cx + Math.cos(a) * RX * 0.9, y = cy + Math.sin(a) * RY * 0.88;
      ctx.beginPath();
      ellipsePath(ctx, x, y, 0.8 + R() * 0.8, 0.5 + R() * 0.4, a);
      ctx.fillStyle = CHAR;
      ctx.globalAlpha = 0.7;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // sauce field
  const SX = RX - 3.6, SY = RY - 3;
  const sauce = (c: Ctx) => ellipsePath(c, cx + 0.2, cy - 0.5, SX, SY);
  shape(ctx, sauce, { fill: SAUCE, ink: 1.2, inkColor: shade(CRUST_SH, 0.2), shadow: '#b52a20', shadowOffset: [1.4, 1.6] });

  clipTo(ctx, sauce, () => {
    const P = (a: number, d: number): Pt => [cx + Math.cos(a) * SX * d, cy - 0.5 + Math.sin(a) * SY * d];
    // mozzarella patches (4-fold)
    for (let k = 0; k < 4; k++) {
      const a = spin + k * (Math.PI / 2);
      const [x, y] = P(a, 0.72);
      shape(ctx, (c) => ellipsePath(c, x, y, 3.6, 2.4, a * 0.2), { fill: '#fff6e2', ink: 0.9, inkColor: '#c9a27a', shadow: '#f0d9b5', shadowOffset: [-0.8, -0.9] });
    }
    // basil leaves
    for (let k = 0; k < 4; k++) {
      const a = spin + k * (Math.PI / 2) + Math.PI / 4;
      const [x, y] = P(a, 0.8);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + 1.2);
      shape(ctx, (c) => {
        c.moveTo(-2.6, 0);
        c.quadraticCurveTo(0, -2, 2.6, 0);
        c.quadraticCurveTo(0, 2, -2.6, 0);
        c.closePath();
      }, { fill: BASIL, ink: 0.8, shadow: '#1f7a35', shadowOffset: [-0.5, -0.6] });
      ctx.restore();
    }
  });

  // ketchup zig-zags (the crime) — glossy, on top of everything, spinning
  for (let k = 0; k < 4; k++) {
    const a0 = spin + k * (Math.PI / 2) + 0.42;
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = a0 + i * 0.16;
      const d = i % 2 === 0 ? 0.56 : 0.98;
      pts.push([cx + Math.cos(a) * RX * d, cy - 0.5 + Math.sin(a) * RY * d]);
    }
    inkLine(ctx, pts, 1.8, KETCHUP, false, 0.75);
    line(ctx, pts.slice(1, 3), 0.6, '#ff9aa6', false, 0.9);
  }
  // splats
  for (let k = 0; k < 4; k++) {
    const a = spin + k * (Math.PI / 2) + 1.05;
    const x = cx + Math.cos(a) * RX * 0.52, y = cy - 0.5 + Math.sin(a) * RY * 0.5;
    shape(ctx, (c) => circlePath(c, x, y, 1.15), { fill: KETCHUP, ink: 0.7, shadow: KETCHUP_SH, shadowOffset: [-0.4, -0.4] });
  }

  // central melted-mozzarella pool carrying the face
  const pool = (c: Ctx) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const k = 1 + 0.09 * Math.sin(i * 2.3 + 1);
      pts.push([cx + 0.6 + Math.cos(a) * 8.6 * k, cy - 1.6 + Math.sin(a) * 6.4 * k]);
    }
    smoothPath(c, pts, true);
  };
  shape(ctx, pool, { fill: '#fff8e8', ink: 1.3, shadow: '#efd6ae', shadowOffset: [-1.6, -1.4], gloss: [{ x: cx - 4.5, y: cy - 6, rx: 2.2, ry: 0.9, rot: -0.3, alpha: 0.9 }] });

  // face
  eyePair(ctx, cx + 1, cy - 3.6, 2.8, { sp: 7, look: [0.38, 0.12], near: 1.08, brow: 0.55, browDy: 1.45, browTh: 1.45, squash: 1.05 });
  mouth(ctx, cx + 1.4, cy + 1.6, 7.4, 'snarl', { open: 1.1 });
  // ketchup smear on the cheek
  shape(ctx, (c) => ellipsePath(c, cx - 5.6, cy + 1.6, 1.6, 0.9, 0.3), { fill: KETCHUP, ink: 0.7, shadow: 'none' });

  // rim lights on the crust edge (fixed, chasing)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13;
    const sn = Math.sin(a);
    if (sn < 0.05) continue; // only the near half
    const x = cx + Math.cos(a) * (RX - 0.3), y = cy + 1.7 + sn * (RY + 0.2);
    const lit = (i + f) % 4 === 0;
    const col = i % 2 ? '#ffe45c' : '#7ff3ff';
    if (lit) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = col;
      ctx.beginPath();
      circlePath(ctx, x, y, 2.6);
      ctx.fill();
      ctx.restore();
    }
    shape(ctx, (c) => circlePath(c, x, y, 1.15), { fill: lit ? '#ffffff' : shade(col, 0.35), ink: 0.8, shadow: 'none' });
    if (lit) twinkle(ctx, x, y, 2.6, '#ffffff', 0.9);
  }
}

enemySprite('macchiata', 46, 42, 23, drawMacchiata);

// keep tree-shakers honest about helpers we may want later
void light; void glint; void eye; void brow;
