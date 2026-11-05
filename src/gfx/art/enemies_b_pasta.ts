/**
 * ENEMIES B — pasta & co: Alfredo il Colloso, Patatine di Pasta, Spaghetti
 * Fantasma, Lasagna Surgelata, Vongola Formaggiosa.
 */
import {
  Ctx, Pt, INK, shape, group, line, inkLine, ellipsePath, circlePath, roundRectPath, polyPath,
  smoothPath, blobPath, speckle, glint, legs, eye, brow, mouth, shade, rng,
} from '../painter';
import {
  TAU, LIMB, enemySprite, cyc, dripPath, hoseArm, cheeks, clipTo, twinkle, snowflake, wash,
} from './enemies_b_kit';

const PASTA = '#f6d27a';
const PASTA_SH = '#d9a447';

/** Grilled chicken cube in 3/4 view (x,y = centre of the front face). */
function chickenCube(ctx: Ctx, x: number, y: number, s: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const d = s * 0.42;
  const front: Pt[] = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
  const top: Pt[] = [[-s / 2, -s / 2], [-s / 2 + d, -s / 2 - d * 0.8], [s / 2 + d, -s / 2 - d * 0.8], [s / 2, -s / 2]];
  const side: Pt[] = [[s / 2, -s / 2], [s / 2 + d, -s / 2 - d * 0.8], [s / 2 + d, s / 2 - d * 0.8], [s / 2, s / 2]];
  group(ctx, [
    { build: (c) => polyPath(c, side), style: { fill: '#c98e55', shadow: 'none' } },
    { build: (c) => polyPath(c, front), style: { fill: '#f0cf9c', shadow: 'none' } },
    { build: (c) => polyPath(c, top), style: { fill: '#e2b277', shadow: 'none' } },
  ], 1);
  // grill marks
  for (const t of [-0.2, 0.25]) {
    line(ctx, [[-s / 2 + d * 0.3 + t * s, -s / 2 - d * 0.1], [-s / 2 + d * 0.75 + t * s + s * 0.25, -s / 2 - d * 0.7]], 0.7, '#7a4422', false, 0.9);
  }
  line(ctx, [[-s * 0.35, -s * 0.1], [s * 0.3, -s * 0.2]], 0.55, '#d9ad78', false, 0.7);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 3. ALFREDO IL COLLOSO — r17. A gloopy heap of fettuccine drowned in cream,
//    chicken cubes bobbing in it, sticky noodle arms, a stringy gooey mouth.
// ---------------------------------------------------------------------------

const ALF = '#faf2df';
const ALF_SH = '#dfcca6';

function ribbon(ctx: Ctx, pts: Pt[], w: number) {
  inkLine(ctx, pts, w, PASTA, true, 0.85);
  line(ctx, pts, w * 0.32, '#fff0b8', true, 0.85);
}

function drawAlfredo(ctx: Ctx, f: number) {
  const { ph, s, c: co } = cyc(f);

  // far noodle arm (left), dangling to the floor
  ribbon(ctx, [[-14, 0], [-19.6 - s * 0.8, 4], [-21 - s, 10.6], [-18.4, 15.4]], 2.6);
  shape(ctx, (c) => blobPath(c, -18.2, 15.6, 2.8, 1.8, 0.15, 7, 3), { fill: ALF, ink: 1.4, shadow: ALF_SH, shadowOffset: [-0.6, -0.6] });

  // body: a sagging, melting heap with a puddle base
  const base: Pt[] = [
    [-21, 16.4], [-14, 18], [-5, 18.3], [5, 18.3], [14, 18], [21.2, 16.2],
    [19.2, 12.2], [16.2, 8.6], [15.6, 2], [14.6, -5], [12.2, -11.4], [7.4, -16.6], [1, -18.6], [-6, -17.6], [-11.6, -13], [-14.6, -6], [-15.6, 1.4], [-16.6, 8.6], [-19.4, 12.6],
  ];
  const pts = base.map(([x, y], i): Pt => (i < 6 ? [x, y] : [x + Math.sin(ph + i * 0.9) * 0.45, y + Math.cos(ph + i * 0.7) * 0.4]));
  const body = (c: Ctx) => smoothPath(c, pts, true);
  shape(ctx, body, {
    fill: ALF, shadow: ALF_SH, shadowOffset: [-3.4, -3], ink: 2.3,
    gloss: [{ x: -7.6, y: -11.2, rx: 3.6, ry: 2, rot: -0.6, alpha: 0.9 }, { x: -11.4, y: 1, rx: 1.1, ry: 2.6, rot: 0.2, alpha: 0.6 }],
  });

  clipTo(ctx, body, () => {
    // fettuccine draped down the sides, half-drowned
    ribbon(ctx, [[-6, -16], [-11.6, -9], [-13.8, -1], [-12.6, 6]], 2.7);
    ribbon(ctx, [[6.2, -15.4], [11.6, -9.6], [13.6, -2.4]], 2.7);
    ribbon(ctx, [[-14, 10], [-6, 13.6], [4, 14.6], [13, 12.4]], 2.4);
    // cream glazing over the ribbons
    for (const [x, y, rx, ry] of [[-12.6, -4.2, 2.6, 1.6], [12.2, -6.4, 2.4, 1.4], [-2, 14.6, 3.2, 1.6], [8.4, 13.8, 2.6, 1.4]] as [number, number, number, number][]) {
      shape(ctx, (c) => ellipsePath(c, x, y, rx, ry), { fill: ALF, ink: 0, shadow: 'none' });
    }
    // pepper + parsley
    speckle(ctx, 0, 0, 14, 15, 18, '#5a4030', 0.38, 17, 0.9);
    speckle(ctx, 0, -2, 13, 14, 9, '#58a83f', 0.42, 29, 0.9);
  });

  // fettuccine nest on top
  ribbon(ctx, [[-9.4, -14.6], [-6.6, -20.4], [1, -22.2], [7.6, -19.8], [9.6, -14.8]], 2.8);
  ribbon(ctx, [[-6.2, -15.8], [-1.4, -19.2], [4.6, -18.6], [6.6, -15.6]], 2.6);
  shape(ctx, (c) => dripPath(c, -3.4, -18.4, 2, 3 + co * 0.8), { fill: ALF, ink: 1, shadow: 'none' });
  chickenCube(ctx, 1.4, -23.4, 4.6, -0.12);

  // chicken cubes floating in the sauce
  chickenCube(ctx, -12, 8.6, 4.2, 0.2);
  chickenCube(ctx, 12.2, 9.4, 3.8, -0.15);

  // face: noodle brows, glaring eyes
  const fx = 0.8, fy = -6;
  eye(ctx, fx - 4.8, fy, 3.8, { look: [0.32, 0.14], lid: 'angry-l', pupil: 0.5 });
  eye(ctx, fx + 5, fy - 0.2, 4.1, { look: [0.32, 0.14], lid: 'angry-r', pupil: 0.5 });
  ribbon(ctx, [[fx - 8.8, fy - 6.8], [fx - 4.6, fy - 5.6], [fx - 1.4, fy - 4.4]], 2);
  ribbon(ctx, [[fx + 1.6, fy - 4.6], [fx + 5.2, fy - 6], [fx + 9.6, fy - 7.6]], 2);

  // big gooey mouth with sticky strands
  const mx = fx + 0.6, my = fy + 9.4;
  const mp = (c: Ctx) => {
    c.moveTo(mx - 7, my - 2);
    c.quadraticCurveTo(mx, my - 3.4, mx + 7.2, my - 2.4);
    c.quadraticCurveTo(mx + 6.4, my + 5.4, mx, my + 5.4);
    c.quadraticCurveTo(mx - 6.4, my + 5.4, mx - 7, my - 2);
    c.closePath();
  };
  shape(ctx, mp, { fill: '#5b1320', ink: 1.5, shadow: 'none' });
  clipTo(ctx, mp, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.fillRect(mx - 8, my - 4, 16, 2.6);
    ctx.strokeStyle = 'rgba(80,40,30,0.35)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) { ctx.moveTo(mx + i * 2.6, my - 4); ctx.lineTo(mx + i * 2.6, my - 1.4); }
    ctx.stroke();
    ctx.fillStyle = '#e8616e';
    ctx.beginPath();
    ellipsePath(ctx, mx + 1, my + 4.6, 4, 2);
    ctx.fill();
    // stringy cream strands
    for (const [sx, k] of [[-3.6, 0], [1.2, 1.4], [4.6, 2.6]] as Pt[]) {
      const sag = 0.8 + 0.6 * Math.sin(ph + k);
      line(ctx, [[mx + sx, my - 1.6], [mx + sx + sag * 0.6, my + 1.4], [mx + sx - 0.2, my + 4.6]], 0.9, ALF, true, 0.95);
    }
  });
  cheeks(ctx, [[fx - 9, fy + 4.4], [fx + 10, fy + 4]], 2, 1.1, '#f08a6a', 0.35);

  // near noodle arm reaching forward (the tether)
  const ax = 22 + s * 0.8, ay = 6.6 - s * 1.4;
  ribbon(ctx, [[13.6, 0], [18.6, 0.6], [21, 3.2 - s * 0.6], [ax, ay]], 2.6);
  shape(ctx, (c) => {
    blobPath(c, ax, ay + 1, 3, 2.6, 0.18, 8, 5);
    dripPath(c, ax + 0.4, ay + 2.6, 1.6, 3 + (1 - s) * 0.9);
  }, { fill: ALF, ink: 1.4, shadow: ALF_SH, shadowOffset: [-0.8, -0.8], gloss: [{ x: ax - 1.2, y: ay, rx: 0.9, ry: 0.5, alpha: 0.9 }] });
}

enemySprite('alfredo', 52, 58, 38, drawAlfredo);

// ---------------------------------------------------------------------------
// 13. PATATINE DI PASTA — r9. A manic air-fried rigatone chip with a
//     farfalle bow, shedding crumbs. Tiny swarm unit.
// ---------------------------------------------------------------------------

const CHIP = '#f4b443';
const CHIP_SH = '#c9762a';
const CHIP_DK = '#a85a1e';

function farfalle(ctx: Ctx, x: number, y: number, s: number, rot: number, flap: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, flap);
  const wing = (dir: number) => (c: Ctx) => {
    c.moveTo(0, -0.9 * s);
    c.quadraticCurveTo(dir * 2.4 * s, -2.6 * s, dir * 4.6 * s, -2.8 * s);
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      c.lineTo(dir * (4.6 + (i % 2) * 0.7) * s, (-2.8 + t * 5.6) * s);
    }
    c.quadraticCurveTo(dir * 2.4 * s, 2.6 * s, 0, 0.9 * s);
    c.closePath();
  };
  group(ctx, [
    { build: wing(-1), style: { fill: '#f7c45e', shadow: CHIP_SH, shadowOffset: [-0.9, -1] } },
    { build: wing(1), style: { fill: '#f7c45e', shadow: CHIP_SH, shadowOffset: [-0.9, -1] } },
  ], 1.2);
  for (const dir of [-1, 1]) {
    line(ctx, [[dir * 1.2 * s, -0.8 * s], [dir * 3.8 * s, -1.9 * s]], 0.45, CHIP_SH, false, 0.8);
    line(ctx, [[dir * 1.2 * s, 0.8 * s], [dir * 3.8 * s, 1.9 * s]], 0.45, CHIP_SH, false, 0.8);
  }
  shape(ctx, (c) => ellipsePath(c, 0, 0, 1.1 * s, 1.5 * s), { fill: CHIP, ink: 0.9, shadow: 'none' });
  ctx.restore();
}

function drawPastaChips(ctx: Ctx, f: number) {
  const { s } = cyc(f);

  legs(ctx, 0.6, 5.6, f, { len: 3.4, spread: 6.4, thick: 1.8, color: LIMB, shoe: '#2d2422', stride: 3.4 });

  // crumbs flying off behind
  for (let k = 0; k < 2; k++) {
    const t = ((f + k * 2) % 4) / 4;
    const x = -9 - t * 4 - k, y = -2 + k * 3 - t * 3 + t * t * 6;
    shape(ctx, (c) => polyPath(c, [[x - 0.8, y], [x, y - 0.9], [x + 0.9, y + 0.2], [x, y + 0.7]]), { fill: CHIP, ink: 0.6, shadow: 'none' });
  }

  ctx.save();
  ctx.rotate(0.16);
  // tube body (ridged rigatone)
  const RXt = 6.8;
  const body = (c: Ctx) => {
    c.moveTo(-RXt, -8);
    c.lineTo(-RXt + 0.4, 5.6);
    c.ellipse(0.2, 5.6, RXt - 0.2, 2.6, 0, Math.PI, 0, true);
    c.lineTo(RXt, -8);
    c.ellipse(0, -8, RXt, 2.7, 0, 0, Math.PI, true);
    c.closePath();
  };
  shape(ctx, body, { fill: CHIP, shadow: CHIP_SH, shadowOffset: [-2, -0.8], ink: 1.7, gloss: [{ x: -4.4, y: -3.6, rx: 0.9, ry: 3, alpha: 0.55 }] });
  clipTo(ctx, body, () => {
    for (const x of [-4.8, -2.4, 0, 2.4, 4.8]) {
      line(ctx, [[x, -9], [x * 1.02, 8]], 0.55, CHIP_SH, false, 0.75);
      line(ctx, [[x + 0.7, -9], [x * 1.02 + 0.7, 8]], 0.4, '#ffd98a', false, 0.6);
    }
    speckle(ctx, 0, 0, 6, 8, 9, CHIP_DK, 0.55, 9, 0.75);
  });
  // opening (hollow inside)
  shape(ctx, (c) => ellipsePath(c, 0, -8, RXt, 2.7), { fill: '#f9cf73', ink: 1.4, shadow: 'none' });
  shape(ctx, (c) => ellipsePath(c, 0.2, -7.8, RXt - 2.2, 1.5), { fill: '#8a4318', ink: 0, shadow: 'none' });

  // crazy face (mismatched eyes)
  eye(ctx, -2.6, -1.8, 2.05, { look: [-0.05, 0.25], pupil: 0.42, ink: 0.95 });
  eye(ctx, 2.7, -2.4, 2.65, { look: [0.42, -0.12], pupil: 0.38, ink: 1 });
  brow(ctx, -2.8, -5.2, 3.2, -0.45, 1);
  brow(ctx, 2.9, -6.3, 3.6, 0.35, 1);
  mouth(ctx, 0.4, 2.4, 8.2, 'grin', { open: 1.15, tongue: true });
  ctx.restore();

  // farfalle bow on top
  farfalle(ctx, -4, -11.4, 0.92, -0.45, f % 2 ? 0.72 : 1);
  void s;
}

enemySprite('pastachips', 30, 34, 21, drawPastaChips);

// ---------------------------------------------------------------------------
// 15. SPAGHETTI FANTASMA — r15. A plate of "spaghetti bolognese" (which
//     doesn't exist!) under a newspaper sheet: a ghost. Floats; no legs.
// ---------------------------------------------------------------------------

const PAPER = '#efe8d8';
const PAPER_SH = '#c7bba3';
const RAGU = '#b9442a';
const NEWS_INK = '#3a332e';

function drawFantasma(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);

  // dangling spaghetti under the hem (behind the sheet)
  for (let i = 0; i < 5; i++) {
    const x = -11 + i * 5.4;
    const sw = Math.sin(ph + i * 1.3) * 1.8;
    const len = 6 + (i % 2) * 2.4;
    inkLine(ctx, [[x, 8], [x + sw * 0.5, 8 + len * 0.55], [x + sw, 8 + len]], 1.25, PASTA, true, 0.75);
    if (i % 2 === 0) shape(ctx, (c) => circlePath(c, x + sw * 0.7, 8 + len * 0.72, 0.9), { fill: RAGU, ink: 0.6, shadow: 'none' });
  }

  // fork + twirl on top (behind the sheet's top edge)
  ctx.save();
  ctx.translate(2.8, -24.4);
  ctx.rotate(0.38);
  inkLine(ctx, [[0, 0], [0, -11.4]], 1.5, '#e5eaf2', false, 0.95);
  shape(ctx, (c) => ellipsePath(c, 0, -11.8, 1.3, 1.9), { fill: '#e5eaf2', ink: 1, shadow: 'none' });
  ctx.restore();

  // the sheet
  const hem: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const x = 18.4 - i * 4.6;
    hem.push([x, 9.6 + 2.2 * Math.sin(i * 1.7 + ph) + (i % 2 ? 1 : 0)]);
  }
  const sheetPts: Pt[] = [
    [0.6, -25.2], [8.6, -22.8], [13, -15.6], [14.2, -9.6], [20.2, -8.4 + s * 0.6], [16.4, -3.6], [16.4, 2.6], ...hem,
    [-16.2, 2.6], [-14.6, -5.4], [-13.2, -15.2], [-8.4, -22.6],
  ];
  const sheet = (c: Ctx) => smoothPath(c, sheetPts, true);
  shape(ctx, sheet, { fill: PAPER, shadow: PAPER_SH, shadowOffset: [-3.2, -2.6], ink: 2.2, gloss: [{ x: -7, y: -17.6, rx: 3.4, ry: 1.4, rot: -0.7, alpha: 0.6 }] });

  clipTo(ctx, sheet, () => {
    // headline (bold unreadable blocks)
    const R = rng(8);
    let x = -10.6;
    while (x < 10.6) {
      const w = 1.6 + R() * 2.6;
      const yy = -19.2 + 0.012 * x * x;
      ctx.fillStyle = NEWS_INK;
      ctx.beginPath();
      roundRectPath(ctx, x, yy - 1.6, w, 3.2, 0.6);
      ctx.fill();
      x += w + 0.7 + (R() < 0.25 ? 1 : 0);
    }
    // rule under the headline
    line(ctx, [[-12, -14.6], [-6, -15.3], [6, -15.3], [12, -14.6]], 0.6, NEWS_INK, true, 0.7);
    // columns of squiggle text
    for (let col = 0; col < 3; col++) {
      const x0 = -13 + col * 9;
      for (let row = 0; row < 11; row++) {
        const y = -12.6 + row * 2;
        const len = 6.2 - (R() < 0.2 ? R() * 3 : 0);
        const pts: Pt[] = [];
        for (let k = 0; k <= 5; k++) pts.push([x0 + (k / 5) * len, y + (k % 2 ? 0.25 : -0.25)]);
        line(ctx, pts, 0.55, '#8d857a', false, 0.75);
      }
    }
    // photo box
    ctx.fillStyle = '#b5ad9e';
    ctx.fillRect(6.2, -12.8, 7, 5.2);
    line(ctx, [[7, -8.4], [8.6, -10.6], [10, -9.4], [11.6, -11.6], [12.6, -8.4]], 0.6, '#6d665b', false, 0.9);
    // fold creases
    line(ctx, [[0.8, -24], [1.4, -6], [0.6, 12]], 0.7, '#ffffff', true, 0.7);
    line(ctx, [[1.6, -24], [2.2, -6], [1.4, 12]], 0.5, PAPER_SH, true, 0.7);
    // ragù soaking through
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#c4572f';
    ctx.beginPath();
    blobPath(ctx, -10.4, 6.4, 3.6, 2.6, 0.25, 9, 4);
    blobPath(ctx, 9.8, 5.4, 2.6, 2, 0.25, 8, 6);
    blobPath(ctx, -4, -23.6, 3.4, 2, 0.2, 8, 9);
    ctx.fill();
    ctx.restore();
  });

  // spaghetti twirl on the head, with a ragù dollop
  ctx.save();
  ctx.translate(1.6, -24.6);
  shape(ctx, (c) => ellipsePath(c, 0, 0, 6.2, 3.4), { fill: PASTA, ink: 1.6, shadow: PASTA_SH, shadowOffset: [-1, -1] });
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.ellipse(0.3, -0.2 + k * 0.4, 5.4 - k * 1.1, 2.6 - k * 0.5, 0, 0.2, Math.PI * 1.8);
    ctx.strokeStyle = PASTA_SH;
    ctx.lineWidth = 0.55;
    ctx.stroke();
  }
  shape(ctx, (c) => blobPath(c, 0.6, -2.4, 3.6, 2.2, 0.22, 9, 11), { fill: RAGU, ink: 1.2, shadow: '#7f2a1c', shadowOffset: [-0.6, -0.7], gloss: [{ x: -0.6, y: -3.4, rx: 1, ry: 0.5, alpha: 0.7 }] });
  speckle(ctx, 0.6, -2.4, 2.6, 1.4, 5, '#7a2416', 0.4, 2, 0.9);
  ctx.restore();

  // eye holes (angry) with glowing pupils
  const hole = (x: number, y: number, dir: number, sc: number) => (c: Ctx) => {
    c.moveTo(x - dir * 3.2 * sc, y - 2.6 * sc);
    c.quadraticCurveTo(x, y - 1.6 * sc, x + dir * 2.6 * sc, y - 0.4 * sc);
    c.quadraticCurveTo(x + dir * 3 * sc, y + 2.8 * sc, x, y + 2.8 * sc);
    c.quadraticCurveTo(x - dir * 3.4 * sc, y + 2.4 * sc, x - dir * 3.2 * sc, y - 2.6 * sc);
    c.closePath();
  };
  for (const [hx, dir, sc] of [[-4.2, 1, 1], [5.6, -1, 1.1]] as [number, number, number][]) {
    const h = hole(hx, -7.6, dir, sc);
    shape(ctx, h, { fill: '#1b0f0c', ink: 1, inkColor: '#8d7f68', shadow: 'none' });
    ctx.save();
    ctx.shadowColor = '#ffe27a';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    circlePath(ctx, hx + 0.9 * sc, -6.6 + 0.2, 1.05 * sc);
    ctx.fill();
    ctx.restore();
  }
  // wailing mouth hole with paper fangs
  const mh = (c: Ctx) => {
    c.moveTo(-3.2, 0.6);
    c.quadraticCurveTo(1.6, 2, 6.6, -0.2);
    c.quadraticCurveTo(5.4, 6.4, 1.4, 6.2);
    c.quadraticCurveTo(-2.4, 5.8, -3.2, 0.6);
    c.closePath();
  };
  shape(ctx, mh, { fill: '#1b0f0c', ink: 1, inkColor: '#8d7f68', shadow: 'none' });
  clipTo(ctx, mh, () => {
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    polyPath(ctx, [[-1, 0], [0.4, 3.2], [1.6, 0]]);
    polyPath(ctx, [[3.2, 0], [4.4, 2.8], [5.6, -0.4]]);
    ctx.fill();
    // spaghetti glimpsed inside
    line(ctx, [[-2, 5.2], [1, 4.2], [4.6, 5]], 0.8, PASTA, true, 0.9);
  });
}

enemySprite('fantasma', 46, 56, 36, drawFantasma);

// ---------------------------------------------------------------------------
// 10. LASAGNA SURGELATA — r23. A grumpy frozen microwave-lasagna brick in a
//     black tray, layers showing, frost and ice crystals. Heavy tank.
// ---------------------------------------------------------------------------

const TRAY = '#2f2b38';
const TRAY_SH = '#1b1822';
const LAS_PASTA = '#f2cd72';
const LAS_RAGU = '#b8432c';
const LAS_BESC = '#f7ecd4';
const LAS_TOP = '#e98b3b';
const ICEB = '#d4f1ff';

function drawSurgelata(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);
  const dx = 6.4, dy = -5.4;
  const L = -20, R = 16, T = -18, B = 6;

  // stubby frost-bitten arms (behind)
  hoseArm(ctx, -19, -4, -25.6 - s * 0.6, 2.4 + s, { bend: -0.25, thick: 3, handR: 3.6, hand: '#cfe7ff' });

  legs(ctx, -1, 16.4, f, { len: 4, spread: 20, thick: 4.4, color: LIMB, shoe: '#3d4f78', stride: 3.4 });

  // tray (back rim, then the brick, then the tray front)
  shape(ctx, (c) => polyPath(c, [[L - 2.6, B - 3], [L - 2.6 + dx, B - 3 + dy], [R + 2.6 + dx, B - 3 + dy], [R + 2.6, B - 3]]), { fill: '#4a4556', ink: 2, shadow: 'none' });

  // brick faces
  const front: Pt[] = [[L, T], [R, T], [R, B + 4], [L, B + 4]];
  const side: Pt[] = [[R, T], [R + dx, T + dy], [R + dx, B + 4 + dy], [R, B + 4]];
  const top: Pt[] = [[L, T], [L + dx, T + dy], [R + dx, T + dy], [R, T]];
  group(ctx, [
    { build: (c) => polyPath(c, side), style: { fill: LAS_PASTA, shadow: 'none' } },
    { build: (c) => polyPath(c, front), style: { fill: LAS_PASTA, shadow: 'none' } },
    { build: (c) => polyPath(c, top), style: { fill: LAS_TOP, shadow: 'none' } },
  ], 2.6);

  // layers on the front + side
  const layers: [number, number, string][] = [
    [T, T + 3.4, '#e7a14a'],
    [T + 3.4, T + 6.2, LAS_PASTA],
    [T + 6.2, T + 9.8, LAS_RAGU],
    [T + 9.8, T + 12, LAS_BESC],
    [T + 12, T + 14.6, LAS_PASTA],
    [T + 14.6, T + 18.2, LAS_RAGU],
    [T + 18.2, T + 20.4, LAS_BESC],
    [T + 20.4, T + 23, LAS_PASTA],
    [T + 23, B + 5, LAS_RAGU],
  ];
  clipTo(ctx, (c) => polyPath(c, front), () => {
    layers.forEach(([y0, y1, col], i) => {
      ctx.beginPath();
      ctx.moveTo(L - 1, y1 + 0.5);
      for (let k = 0; k <= 9; k++) {
        const x = L - 1 + k * ((R - L + 2) / 9);
        ctx.lineTo(x, y0 + Math.sin(k * 1.9 + i * 2.3) * 0.55);
      }
      ctx.lineTo(R + 1, y1 + 0.5);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    });
    speckle(ctx, (L + R) / 2, -1, 17, 10, 16, '#7d2416', 0.5, 23, 0.6);
    // frozen glaze
    wash(ctx, (c) => polyPath(c, front), '#dff3ff', 0.32);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#f7fcff';
    ctx.beginPath();
    ctx.moveTo(L - 1, T - 1);
    for (let k = 0; k <= 12; k++) {
      const x = L - 1 + k * ((R - L + 2) / 12);
      ctx.lineTo(x, T + 1.8 + (k % 2) * 1.6 + Math.sin(k * 3.1) * 0.6);
    }
    ctx.lineTo(R + 1, T - 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // frost streaks
    line(ctx, [[L + 2.2, T + 4], [L + 2.2, B]], 1.2, '#ffffff', false, 0.5);
    line(ctx, [[L + 4.2, T + 6], [L + 4.2, T + 12]], 0.7, '#ffffff', false, 0.45);
  });
  clipTo(ctx, (c) => polyPath(c, side), () => {
    layers.forEach(([y0, y1, col], i) => {
      ctx.beginPath();
      ctx.moveTo(R, y0);
      ctx.lineTo(R + dx, y0 + dy);
      ctx.lineTo(R + dx, y1 + dy + 0.5);
      ctx.lineTo(R, y1 + 0.5);
      ctx.closePath();
      ctx.fillStyle = shade(col, 0.2);
      ctx.fill();
      void i;
    });
    wash(ctx, (c) => polyPath(c, side), '#bfe4ff', 0.38);
  });
  // top: mottled sauce & cheese under heavy frost
  clipTo(ctx, (c) => polyPath(c, top), () => {
    speckle(ctx, (L + R + dx) / 2, T + dy / 2, 17, 2.6, 14, '#b8432c', 1, 3, 0.8);
    wash(ctx, (c) => polyPath(c, top), '#f4fbff', 0.6);
    speckle(ctx, (L + R + dx) / 2, T + dy / 2, 18, 2.6, 18, '#ffffff', 0.7, 6, 0.9);
  });
  // cling film peeling at the front-left corner
  shape(ctx, (c) => {
    c.moveTo(L + 0.6, T - 0.4);
    c.quadraticCurveTo(L - 3.6, T - 6.6, L + 2.6, T - 9.6);
    c.quadraticCurveTo(L + 4.4, T - 6.4, L + 6.6, T - 4.6);
    c.closePath();
  }, { fill: 'rgba(230,246,255,0.75)', ink: 1.1, inkColor: '#8fb6cf', shadow: 'none' });
  line(ctx, [[L + 1.4, T - 6.8], [L + 3.4, T - 8.4]], 0.7, '#ffffff', false, 0.9);

  // ice crystals sprouting on the back-right corner
  for (const [cx, cy, h, a] of [[R + 3.6, T + dy + 0.6, 8.6, 0.15], [R + 6.4, T + dy + 1.6, 6, 0.55], [R + 0.4, T + dy + 2.4, 5.4, -0.3]] as [number, number, number, number][]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    shape(ctx, (c) => polyPath(c, [[-1.6, 0], [-1.6, -h * 0.75], [0, -h], [1.6, -h * 0.75], [1.6, 0]]), { fill: ICEB, ink: 1.2, shadow: '#8fcbea', shadowOffset: [-0.8, 0], gloss: [{ x: -0.6, y: -h * 0.5, rx: 0.4, ry: h * 0.3, alpha: 0.9 }] });
    ctx.restore();
  }
  twinkle(ctx, R + 9.4, T + dy - 6, 2.4, '#ffffff', 0.9);

  // tray front (in front of the brick bottom)
  const tray = (c: Ctx) => polyPath(c, [[L - 3, B - 1], [R + 3, B - 1], [R + 3 + dx * 0.55, B - 1 + dy * 0.55], [R + 2 + dx * 0.5, B + 9.6 + dy * 0.5], [R + 1, B + 11], [L - 1, B + 11]]);
  shape(ctx, tray, { fill: TRAY, shadow: TRAY_SH, shadowOffset: [-2.4, -1.6], ink: 2.6, gloss: [{ x: L + 4, y: B + 1.6, rx: 6, ry: 0.7, alpha: 0.35 }] });
  line(ctx, [[L - 2.4, B + 1.2], [R + 2.4, B + 1.2]], 1, '#5c566c', false, 0.9);
  line(ctx, [[R + 3, B - 1], [R + 2, B + 11]], 0.9, '#5c566c', false, 0.7);
  // frost on the tray lip + icicles
  for (const [ix, il] of [[L + 1, 3.6], [L + 5.6, 2.4], [R - 1.6, 4], [R - 6, 2.6]] as Pt[]) {
    shape(ctx, (c) => {
      c.moveTo(ix - 1.1, B - 0.6);
      c.quadraticCurveTo(ix - 0.3, B + il * 0.6, ix, B - 0.6 + il + (s * 0.3));
      c.quadraticCurveTo(ix + 0.3, B + il * 0.6, ix + 1.1, B - 0.6);
      c.closePath();
    }, { fill: ICEB, ink: 0.9, shadow: 'none' });
  }

  // grumpy frozen face
  const fx = -1.6, fy = -7.4;
  eye(ctx, fx - 6.2, fy, 4.4, { look: [0.3, 0.2], lid: 'half', pupil: 0.5 });
  eye(ctx, fx + 6.4, fy - 0.2, 4.7, { look: [0.3, 0.2], lid: 'half', pupil: 0.5 });
  // frosty bushy brows
  for (const [bx, by, a] of [[fx - 6.4, fy - 6.2, 0.42], [fx + 6.8, fy - 6.6, -0.42]] as [number, number, number][]) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(a);
    shape(ctx, (c) => {
      circlePath(c, -3.2, 0.4, 1.9);
      circlePath(c, -0.6, -0.4, 2.2);
      circlePath(c, 2.2, -0.2, 2);
      circlePath(c, 4, 0.6, 1.4);
    }, { fill: '#f4fbff', ink: 1.3, shadow: '#bcdcf2', shadowOffset: [-0.6, -0.8] });
    ctx.restore();
  }
  // clenched grimace with an icicle drip
  const my = fy + 9.4;
  const gm = (c: Ctx) => roundRectPath(c, fx - 6.2, my - 2.4, 12.8, 4.8, 2);
  shape(ctx, gm, { fill: '#4a1626', ink: 1.6, shadow: 'none' });
  clipTo(ctx, gm, () => {
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(fx - 7, my - 2.6, 14, 2.2);
    ctx.fillRect(fx - 7, my + 0.6, 14, 2.2);
    ctx.strokeStyle = 'rgba(70,90,120,0.55)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = -2; i <= 3; i++) { ctx.moveTo(fx + i * 2.3 - 1.2, my - 2.6); ctx.lineTo(fx + i * 2.3 - 1.2, my + 2.8); }
    ctx.stroke();
  });
  shape(ctx, (c) => {
    c.moveTo(fx + 3.4, my + 2.2);
    c.quadraticCurveTo(fx + 3.9, my + 4.4, fx + 4.2, my + 5.4 + s * 0.4);
    c.quadraticCurveTo(fx + 4.6, my + 4.4, fx + 5.2, my + 2.2);
    c.closePath();
  }, { fill: ICEB, ink: 0.9, shadow: 'none' });
  cheeks(ctx, [[fx - 10, fy + 5], [fx + 11, fy + 4.6]], 2.2, 1.2, '#7cc4ff', 0.5);

  // near arm
  hoseArm(ctx, R + 3, -3, R + 9.6 + s * 0.6, 3 - s, { bend: 0.25, thick: 3, handR: 3.6, hand: '#cfe7ff' });

  // drifting snowflakes
  snowflake(ctx, L - 6 + s, T - 8 - f * 0.8, 2, '#ffffff', 0.85, 0.9);
  snowflake(ctx, L + 12, T - 16 + s, 1.5, '#ffffff', 0.7, 0.8);
  void ph; void INK;
}

enemySprite('surgelata', 66, 74, 48, drawSurgelata, 33);

// ---------------------------------------------------------------------------
// 9. VONGOLA FORMAGGIOSA — r13. A clam in a wig of grated cheese, eyes glaring
//    out of the shell gap, tongue out, scuttling sideways on crab legs.
// ---------------------------------------------------------------------------

const SHELL = '#c9a7df';
const SHELL_SH = '#8f6aae';
const SHELL_LN = '#7a5596';
const WIG = '#fde58a';
const WIG_SH = '#e2b54a';

function drawVongola(ctx: Ctx, f: number) {
  // crab legs (3 a side), scuttling
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const up = (i + f + (side > 0 ? 1 : 0)) % 2 === 0;
      const lift = up ? 1.6 : 0;
      const hx = side * (6 + i * 2.6), hy = 6.4 + i * 0.6;
      const kx = side * (11 + i * 2.4), ky = 3.6 + i * 1.6 - lift;
      const fx = side * (12 + i * 2.6) + (up ? side * 0.6 : 0), fy = 13 - lift * 0.8 + (i === 1 ? 0.5 : 0);
      inkLine(ctx, [[hx, hy], [kx, ky], [fx, fy]], 1.5, '#ef8b6c', false, 0.9);
    }
  }

  const CY = -1;
  // lower shell (bowl)
  const lower = (c: Ctx) => {
    c.moveTo(-14.2, CY - 0.6);
    c.bezierCurveTo(-13.6, CY + 8.4, -6, CY + 11.6, 0, CY + 11.6);
    c.bezierCurveTo(6, CY + 11.6, 13.6, CY + 8.4, 14.2, CY - 0.6);
    c.bezierCurveTo(10, CY + 3.6, 5, CY + 5.6, 0, CY + 5.6);
    c.bezierCurveTo(-5, CY + 5.6, -10, CY + 3.6, -14.2, CY - 0.6);
    c.closePath();
  };
  shape(ctx, lower, { fill: SHELL, shadow: SHELL_SH, shadowOffset: [-1.8, -2.2], ink: 2 });
  clipTo(ctx, lower, () => {
    for (let i = -4; i <= 4; i++) {
      line(ctx, [[i * 3.3, CY + 4.4], [i * 1.4, CY + 13]], 0.7, SHELL_LN, false, 0.55);
    }
    line(ctx, [[-12, CY + 4.6], [-6, CY + 8.4], [0, CY + 9.4], [6, CY + 8.4], [12, CY + 4.6]], 0.9, '#efe0f7', true, 0.6);
  });

  // gap / interior + mantle
  const gap = (c: Ctx) => {
    c.moveTo(-14, CY - 0.6);
    c.bezierCurveTo(-10, CY - 6.6, 10, CY - 6.6, 14, CY - 0.6);
    c.bezierCurveTo(10, CY + 4, 5, CY + 6, 0, CY + 6);
    c.bezierCurveTo(-5, CY + 6, -10, CY + 4, -14, CY - 0.6);
    c.closePath();
  };
  shape(ctx, gap, { fill: '#3b1430', ink: 0, shadow: 'none' });
  clipTo(ctx, gap, () => {
    ctx.beginPath();
    ctx.moveTo(-14, CY + 6);
    for (let i = 0; i <= 14; i++) {
      const x = -13 + i * (26 / 14);
      ctx.lineTo(x, CY + 3 + (i % 2) * 1 + Math.abs(x) * 0.05);
    }
    ctx.lineTo(14, CY + 6);
    ctx.closePath();
    ctx.fillStyle = '#f0a6b0';
    ctx.fill();
  });

  // eyes glaring out
  eye(ctx, -3.8, CY - 0.4, 2.9, { look: [0.4, 0.05], pupil: 0.52 });
  eye(ctx, 4.4, CY - 0.6, 3.1, { look: [0.4, 0.05], pupil: 0.52 });
  // tongue (the clam's foot) sticking out
  shape(ctx, (c) => {
    c.moveTo(1, CY + 4.2);
    c.quadraticCurveTo(1.6, CY + 9.6, 4.6, CY + 9.4);
    c.quadraticCurveTo(7.2, CY + 9, 6.6, CY + 3.6);
    c.closePath();
  }, { fill: '#ff8fa3', ink: 1.1, shadow: '#e0607c', shadowOffset: [-0.6, -0.6] });
  line(ctx, [[3.8, CY + 4.8], [4, CY + 7.8]], 0.55, '#d84b6c', false, 0.8);

  // upper shell (its lip forms an angry brow over the eyes)
  const upper = (c: Ctx) => {
    c.moveTo(-14.6, CY - 0.4);
    c.bezierCurveTo(-15, CY - 9.6, -7.4, CY - 14.2, 0, CY - 14.2);
    c.bezierCurveTo(7.4, CY - 14.2, 15, CY - 9.6, 14.6, CY - 0.4);
    // scalloped M-shaped lip, dipping toward the middle
    const lip: Pt[] = [[11.4, CY - 3.4], [8, CY - 4.6], [4.4, CY - 4.4], [1.4, CY - 2.6], [-1.4, CY - 2.4], [-4.2, CY - 4.2], [-7.8, CY - 4.6], [-11.4, CY - 3.4], [-14.6, CY - 0.4]];
    let px = 14.6, py = CY - 0.4;
    for (const [x, y] of lip) {
      c.quadraticCurveTo((px + x) / 2, (py + y) / 2 + 1.1, x, y);
      px = x; py = y;
    }
    c.closePath();
  };
  shape(ctx, upper, { fill: SHELL, shadow: SHELL_SH, shadowOffset: [-2.2, -2.6], ink: 2, gloss: [{ x: -6.6, y: CY - 10, rx: 2.8, ry: 1.2, rot: -0.5, alpha: 0.65 }] });
  clipTo(ctx, upper, () => {
    // radial ridges + zig-zag growth bands
    for (let i = -5; i <= 5; i++) {
      line(ctx, [[0, CY - 16], [i * 3.1, CY - 1]], 0.7, SHELL_LN, false, 0.5);
    }
    for (const [k, col] of [[0.55, '#9b6db8'], [0.8, '#b48bd0']] as [number, string][]) {
      const pts: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        pts.push([Math.cos(a) * 14 * k, CY - 1.6 + Math.sin(a) * 12.4 * k + (i % 2 ? 0.7 : -0.7)]);
      }
      line(ctx, pts, 0.9, col, false, 0.8);
    }
  });

  // grated-cheese wig
  const R = rng(19);
  const wig = (c: Ctx) => blobPath(c, -0.6, CY - 15.2, 10.6, 5.4, 0.16, 15, 21);
  shape(ctx, wig, { fill: WIG, shadow: WIG_SH, shadowOffset: [-1.8, -1.8], ink: 1.6, gloss: [{ x: -4.6, y: CY - 18, rx: 2.4, ry: 1, rot: -0.3, alpha: 0.6 }] });
  // shreds sticking out of the silhouette
  for (let i = 0; i < 13; i++) {
    const a = Math.PI + 0.2 + (i / 12) * (Math.PI - 0.4);
    const x = -0.6 + Math.cos(a) * 10.4, y = CY - 15.2 + Math.sin(a) * 5.2;
    const L2 = 1.8 + R() * 1.6;
    inkLine(ctx, [[x, y], [x + Math.cos(a + (R() - 0.5)) * L2, y + Math.sin(a + (R() - 0.5)) * L2]], 0.8, WIG, false, 0.6);
  }
  clipTo(ctx, wig, () => {
    for (let i = 0; i < 26; i++) {
      const x = -10 + R() * 19, y = CY - 19.6 + R() * 8.4;
      const a = R() * Math.PI;
      line(ctx, [[x, y], [x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6]], 0.55, R() < 0.5 ? WIG_SH : '#fff8d6', false, 0.9);
    }
  });
  // a shred or two drifting off
  const dt = (f % 4) / 4;
  inkLine(ctx, [[12 + dt * 2, CY - 13 + dt * 7], [13.4 + dt * 2, CY - 12 + dt * 7]], 0.8, WIG, false, 0.55);
  // angry brow wrinkle on the shell
  brow(ctx, -4, CY - 6.4, 3.6, 0.5, 0.9, SHELL_LN);
  brow(ctx, 4.6, CY - 6.6, 3.6, -0.5, 0.9, SHELL_LN);
}

enemySprite('vongola', 42, 44, 25, drawVongola);

void mouth; void glint; void TAU;
