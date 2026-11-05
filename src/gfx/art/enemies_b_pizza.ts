/**
 * ENEMIES B — pizza crimes: Fetta Hawaiana, Margherita Macchiata.
 */
import {
  Ctx, Pt, shape, group, line, inkLine, ellipsePath, circlePath, smoothPath, blobPath, speckle, glint,
  legs, mouth, shade, rng,
} from '../painter';
import {
  TAU, LIMB, enemySprite, cyc, dripPath, hoseArm, eyePair, cheeks, clipTo,
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
  hoseArm(ctx, -10.5, -5.5, -19.6 - s * 0.8, -7.4 - Math.abs(s) * 1.4, { bend: -0.3, thick: 2, handR: 2.6 });

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
  hamPiece(ctx, -8.6, -3.4, 2.4, -0.3, 9);
  pineChunk(ctx, 0.6, 5.8, 2.3, 0.3);

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

const KETCHUP = '#ff2747';
const KETCHUP_SH = '#b30f2c';
const UFO = '#a3adc2';
const UFO_SH = '#626d86';

function drawMacchiata(ctx: Ctx, f: number) {
  const cx = 0, cy = -4.4;
  const RX = 17.4, RY = 11.2;
  const spin = (f / 4) * (Math.PI / 2); // 4-fold toppings (2-fold ketchup turns at 2×) → seamless loop

  // whoosh arcs (behind)
  for (let k = 0; k < 2; k++) {
    const a0 = (k ? Math.PI : 0) - 0.5 + (f % 2) * 0.25;
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * 0.9;
      pts.push([cx + Math.cos(a) * (RX + 2.8), cy + 1 + Math.sin(a) * (RY + 2.4)]);
    }
    line(ctx, pts, 1.2, '#ffffff', true, 0.5);
  }

  // UFO belly under the pizza
  const belly = (c: Ctx) => ellipsePath(c, cx, cy + 5.2, RX - 1.4, RY - 1.6);
  shape(ctx, belly, { fill: UFO, shadow: UFO_SH, shadowOffset: [-2.2, -3.4], ink: 2.1, gloss: [{ x: cx - 9, y: cy + 9.6, rx: 2.6, ry: 0.8, rot: 0.2, alpha: 0.5 }] });
  // glowing hatch
  shape(ctx, (c) => ellipsePath(c, cx + 0.5, cy + 12.6, 4.6, 1.7), { fill: '#8ff6ff', ink: 1.2, shadow: '#4cc4e0', shadowOffset: [-0.6, -0.7], gloss: [{ x: cx - 1.4, y: cy + 12.1, rx: 1.4, ry: 0.45, alpha: 0.9 }] });
  // chasing rim lights round the belly
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13;
    const sn = Math.sin(a);
    if (sn < 0.12) continue;
    const x = cx + Math.cos(a) * (RX - 2.6), y = cy + 6.2 + sn * (RY - 3.4);
    const lit = (i + f) % 4 === 0;
    const col = i % 2 ? '#ffe45c' : '#7ff3ff';
    if (lit) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = col;
      ctx.beginPath();
      circlePath(ctx, x, y, 2.4);
      ctx.fill();
      ctx.restore();
    }
    shape(ctx, (c) => circlePath(c, x, y, 1.05), { fill: lit ? '#ffffff' : col, ink: 0.75, shadow: 'none' });
  }

  // crust disc
  const disc = (c: Ctx) => ellipsePath(c, cx, cy, RX, RY);
  shape(ctx, disc, { fill: CRUST, shadow: CRUST_SH, shadowOffset: [-1.8, -2.4], ink: 2.1, gloss: [{ x: cx - 9, y: cy - 7, rx: 5, ry: 1.4, rot: -0.22, alpha: 0.5 }] });
  clipTo(ctx, disc, () => {
    const R = rng(12);
    for (let i = 0; i < 14; i++) {
      const a = spin + (i / 14) * TAU + R() * 0.2;
      const x = cx + Math.cos(a) * RX * 0.9, y = cy + Math.sin(a) * RY * 0.86;
      ctx.beginPath();
      ellipsePath(ctx, x, y, 0.8 + R() * 0.7, 0.5 + R() * 0.35, a);
      ctx.fillStyle = CHAR;
      ctx.globalAlpha = 0.5;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // tomato field
  const SX = RX - 3.5, SY = RY - 2.9;
  const scx = cx + 0.2, scy = cy - 0.5;
  const sauce = (c: Ctx) => ellipsePath(c, scx, scy, SX, SY);
  shape(ctx, sauce, { fill: SAUCE, ink: 1.1, inkColor: shade(CRUST_SH, 0.2), shadow: '#b52a20', shadowOffset: [1.2, 1.4] });
  const P = (a: number, d: number): Pt => [scx + Math.cos(a) * SX * d, scy + Math.sin(a) * SY * d];
  clipTo(ctx, sauce, () => {
    // big melted mozzarella patches (4-fold) + small ones between
    for (let k = 0; k < 4; k++) {
      const a = spin + k * (Math.PI / 2);
      const [x, y] = P(a, 0.6);
      shape(ctx, (c) => blobPath(c, x, y, 4.6, 3.1, 0.14, 8, 2), { fill: '#fff6e2', ink: 0.85, inkColor: '#b8865c', shadow: '#efd6b0', shadowOffset: [-0.8, -0.9] });
      const [x2, y2] = P(a + Math.PI / 4, 0.86);
      shape(ctx, (c) => blobPath(c, x2, y2, 2, 1.4, 0.15, 7, 5), { fill: '#fff6e2', ink: 0.7, inkColor: '#b8865c', shadow: 'none' });
    }
    // basil leaves
    for (let k = 0; k < 4; k++) {
      const a = spin + k * (Math.PI / 2) + Math.PI / 4;
      const [x, y] = P(a, 0.58);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + 1.3);
      shape(ctx, (c) => {
        c.moveTo(-2.7, 0);
        c.quadraticCurveTo(0, -2, 2.7, 0);
        c.quadraticCurveTo(0, 2, -2.7, 0);
        c.closePath();
      }, { fill: BASIL, ink: 0.8, shadow: '#1f7a35', shadowOffset: [-0.5, -0.6] });
      line(ctx, [[-1.9, 0], [1.9, 0]], 0.4, '#8fe08a', false, 0.8);
      ctx.restore();
    }
  });

  // the crime: two glossy zig-zags of ketchup squeezed over the cheese
  for (let k = 0; k < 2; k++) {
    const a0 = spin * 2 + k * Math.PI - 0.55;
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = a0 + i * 0.135;
      pts.push(P(a, i % 2 === 0 ? 0.5 : 0.88));
    }
    inkLine(ctx, pts, 1.05, KETCHUP, false, 0.6);
    glint(ctx, pts[3][0], pts[3][1] - 0.2, 0.5, 0.28, 0, 0.9);
  }
  for (let k = 0; k < 4; k++) {
    const [x, y] = P(spin + k * (Math.PI / 2) + 1.2, 0.95);
    shape(ctx, (c) => circlePath(c, x, y, 0.85), { fill: KETCHUP, ink: 0.55, shadow: KETCHUP_SH, shadowOffset: [-0.3, -0.3] });
  }

  // central melted-mozzarella pool carrying the face (stays upright)
  const pool = (c: Ctx) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const k = 1 + 0.08 * Math.sin(i * 2.3 + 1);
      pts.push([cx + 0.7 + Math.cos(a) * 6.9 * k, cy - 1.3 + Math.sin(a) * 5.1 * k]);
    }
    smoothPath(c, pts, true);
  };
  shape(ctx, pool, { fill: '#fff8e8', ink: 1.2, shadow: '#efd6ae', shadowOffset: [-1.3, -1.2], gloss: [{ x: cx - 3.6, y: cy - 4.8, rx: 1.8, ry: 0.7, rot: -0.3, alpha: 0.9 }] });

  eyePair(ctx, cx + 1, cy - 3.2, 2.6, { sp: 7, look: [0.4, 0.14], near: 1.08, brow: 0.55, browDy: 1.45, browTh: 1.45, squash: 1.02 });
  mouth(ctx, cx + 1.4, cy + 1.6, 6.6, 'snarl', { open: 1.05 });
  // ketchup smeared on its cheek
  shape(ctx, (c) => ellipsePath(c, cx - 5.3, cy + 1.5, 1.4, 0.8, 0.3), { fill: KETCHUP, ink: 0.6, shadow: 'none' });
}

enemySprite('macchiata', 46, 42, 24, drawMacchiata);

