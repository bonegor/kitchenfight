/**
 * ENEMIES B — pots, cans & shakers: Pentola Fredda, La Pentola Unica,
 * Scatoletta Maledetta, Spargipolvere.
 */
import {
  Ctx, Pt, INK, shape, group, line, inkLine, ellipsePath, circlePath, roundRectPath, polyPath,
  smoothPath, speckle, glint, legs, eye, brow, mouth, shade, rng,
} from '../painter';
import {
  LIMB, enemySprite, cyc, dripPath, cylPath, ringPath, hoseArm, eyePair, cheeks, clipTo,
  shakeLines, twinkle, snowflake, puff, steamCurl,
} from './enemies_b_kit';

const PASTA = '#f6d27a';

// ---------------------------------------------------------------------------
// 8. PENTOLA FREDDA — r15. A frozen pot with icicle eyebrows and a block of
//    dry spaghetti frozen solid in cold water. Chattering teeth, cold mist.
// ---------------------------------------------------------------------------

const POT = '#a9c6dc';
const POT_SH = '#6c8fb0';
const FROST = '#f3fbff';
const ICE = '#cdefff';
const ICE_SH = '#8ccfee';

function icicle(ctx: Ctx, x: number, y: number, w: number, len: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  shape(ctx, (c) => {
    c.moveTo(-w / 2, 0);
    c.quadraticCurveTo(-w * 0.2, len * 0.6, 0, len);
    c.quadraticCurveTo(w * 0.2, len * 0.6, w / 2, 0);
    c.closePath();
  }, { fill: ICE, ink: 1, shadow: ICE_SH, shadowOffset: [-w * 0.35, -0.4], gloss: [{ x: -w * 0.15, y: len * 0.3, rx: w * 0.12, ry: len * 0.22, alpha: 0.9 }] });
  ctx.restore();
}

function drawPentola(ctx: Ctx, f: number) {
  // lift the whole pot a touch so the boots land at y ≈ +r
  ctx.save();
  ctx.translate(0, -1.6);
  paintPentola(ctx, f);
  ctx.restore();
}

function paintPentola(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);
  const chatter = f % 2;
  const RIM = -9; // rim height
  const BOT = 10.6; // bottom of the pot

  // cold fog curling round the feet (behind)
  for (const [x, y, r, k] of [[-14.6, 12.4, 2.6, 0], [15.4, 12, 2.4, 2], [-9.6, 14.6, 2, 4], [10.4, 14.8, 2.1, 1]] as [number, number, number, number][]) {
    puff(ctx, x + Math.sin(ph + k) * 1.2, y - Math.abs(Math.sin(ph + k)) * 0.8, r, '#d2f0ff', '#9fd8f5', 0.78, 0.6);
  }
  steamCurl(ctx, -17.2, 12.6, 7, ph, 1.1, 0.75, '#c8ecff');
  steamCurl(ctx, 17.6, 12.2, 6, ph + 2, 1.1, 0.7, '#c8ecff');

  legs(ctx, 0, BOT, f, { len: 4, spread: 12, thick: 2.7, color: '#5e7c9c', shoe: '#eef6ff', stride: 3.6 });

  // side handles (behind the body) with icicles
  for (const sx of [-1, 1]) {
    shape(ctx, (c) => roundRectPath(c, sx < 0 ? -19.8 : 13.4, RIM + 2.6, 6.4, 3.4, 1.4), { fill: '#7f98b2', ink: 1.6, shadow: '#5a7391', shadowOffset: [-0.8, -0.8] });
    icicle(ctx, sx * 17.6, RIM + 5.6, 2, 4.4 + (sx > 0 ? 1.4 : 0) + s * 0.3);
    icicle(ctx, sx * 15.8, RIM + 5.6, 1.5, 2.8);
  }

  // pot body
  const body = (c: Ctx) => cylPath(c, 0, RIM, BOT, 14, 12.8, 3.8, 3.2);
  shape(ctx, body, { fill: POT, shadow: POT_SH, shadowOffset: [-3, -1.2], ink: 2.2, gloss: [{ x: -10, y: 1, rx: 1.3, ry: 6.4, alpha: 0.55 }] });
  clipTo(ctx, body, () => {
    // frost creeping up from the bottom + rime under the rim
    const R = rng(4);
    ctx.fillStyle = FROST;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(-16, 18);
    for (let i = 0; i <= 10; i++) ctx.lineTo(-16 + i * 3.2, BOT - 0.6 - R() * 3);
    ctx.lineTo(16, 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-16, RIM - 1);
    for (let i = 0; i <= 12; i++) ctx.lineTo(-16 + i * 2.7, RIM + 3.6 + R() * 1.8 - (i % 2) * 1.3);
    ctx.lineTo(16, RIM - 1);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    speckle(ctx, 0, 2, 12, 7, 10, '#ffffff', 0.45, 13, 0.8);
  });

  // opening (dark icy water)
  shape(ctx, (c) => ellipsePath(c, 0, RIM, 12.6, 2.9), { fill: '#3d6d93', ink: 0, shadow: 'none' });

  // frozen block of spaghetti
  ctx.save();
  ctx.translate(0.6, RIM + 2);
  ctx.rotate(-0.07);
  const front: Pt[] = [[-8, -1], [6.4, -1], [6.4, -14], [-8, -14]];
  const top: Pt[] = [[-8, -14], [-4.6, -17.2], [9.8, -17.2], [6.4, -14]];
  const side: Pt[] = [[6.4, -1], [9.8, -4.2], [9.8, -17.2], [6.4, -14]];
  // sticks poking out of the top (behind the top face edge)
  const sticks: [number, number, number][] = [[-4.5, -15, -0.32], [-1.6, -15.6, -0.1], [1.2, -15.8, 0.08], [3.8, -15.4, 0.22], [6.6, -15.8, 0.36], [0, -16, -0.22]];
  for (const [x, y, a2] of sticks) {
    const L = 6.4 + ((x * 7) % 3);
    inkLine(ctx, [[x, y + 2], [x + Math.sin(a2) * L, y - Math.cos(a2) * L]], 1, PASTA, false, 0.75);
  }
  group(ctx, [
    { build: (c) => polyPath(c, side), style: { fill: ICE_SH, shadow: 'none' } },
    { build: (c) => polyPath(c, front), style: { fill: ICE, shadow: 'none' } },
    { build: (c) => polyPath(c, top), style: { fill: '#effbff', shadow: 'none' } },
  ], 1.8);
  clipTo(ctx, (c) => { polyPath(c, front); polyPath(c, side); }, () => {
    for (let i = 0; i < 9; i++) {
      const x = -7 + i * 1.9;
      const a2 = (i - 4) * 0.05;
      line(ctx, [[x + Math.sin(a2) * 14, 0], [x - Math.sin(a2) * 2, -14.4]], 0.75, '#e9c35e', false, 0.75);
    }
    for (const [bx, by, br] of [[-5, -10, 0.7], [3.5, -4.4, 0.55], [-2.4, -3.6, 0.45], [4.6, -10.6, 0.4]] as [number, number, number][]) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      circlePath(ctx, bx, by, br);
      ctx.stroke();
      ctx.restore();
    }
    line(ctx, [[-8, -7.4], [-4.6, -9], [-3.6, -6.4]], 0.5, '#ffffff', false, 0.85);
    line(ctx, [[-6.8, -12.8], [-6.8, -2.6]], 1, '#ffffff', false, 0.7);
    line(ctx, [[5.2, -13], [5.2, -10.4]], 0.7, '#ffffff', false, 0.6);
  });
  twinkle(ctx, 8.6, -16.6, 2.2, '#ffffff', 0.95);
  ctx.restore();

  // front rim (frosted lip over the block) + snow lumps
  shape(ctx, (c) => {
    c.ellipse(0, RIM, 14, 3.8, 0, Math.PI, 0, true);
    c.ellipse(0, RIM - 0.3, 12.2, 2.5, 0, 0, Math.PI, false);
    c.closePath();
  }, { fill: '#d9ecf8', ink: 1.6, shadow: 'none' });
  for (const [x, dy, r] of [[-11.4, 1.4, 1.8], [-6, 2.8, 2], [0.5, 3.3, 1.8], [7, 2.7, 2], [11.8, 1.3, 1.7]] as [number, number, number][]) {
    shape(ctx, (c) => ellipsePath(c, x, RIM + dy, r * 1.2, r * 0.7), { fill: FROST, ink: 1, shadow: '#cfe3f2', shadowOffset: [-0.6, -0.7] });
  }

  // face: angry & shivering
  const fx = 1, fy = 1.8;
  eye(ctx, fx - 4.4, fy, 3.3, { look: [0.32, 0.12], lid: 'angry-l', pupil: 0.48 });
  eye(ctx, fx + 4.7, fy, 3.6, { look: [0.32, 0.12], lid: 'angry-r', pupil: 0.48 });
  // icicle eyebrows (pointy inner ends dip down = angry)
  icicle(ctx, fx - 7.6, fy - 4.6, 2.5, 7, -1.92);
  icicle(ctx, fx + 8.4, fy - 5, 2.7, 7.4, 1.92);
  // chattering teeth
  const my = fy + 6.2, mw = 9.4, mh = 3.4 + chatter * 0.8;
  const mp = (c: Ctx) => roundRectPath(c, fx - mw / 2 + 0.6, my - mh / 2, mw, mh, 1.4);
  shape(ctx, mp, { fill: '#3a1a2a', ink: 1.2, shadow: 'none' });
  clipTo(ctx, mp, () => {
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(fx - 6, my - mh / 2, 12, mh * 0.42);
    ctx.fillRect(fx - 6, my + mh / 2 - mh * 0.38, 12, mh * 0.4);
    ctx.strokeStyle = 'rgba(60,80,110,0.5)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(fx + 0.6 + i * 1.9, my - mh / 2);
      ctx.lineTo(fx + 0.6 + i * 1.9, my + mh / 2);
    }
    ctx.stroke();
  });
  cheeks(ctx, [[fx - 8.6, fy + 4], [fx + 9.8, fy + 3.6]], 1.8, 1, '#5aa8ff', 0.45);
  shakeLines(ctx, -17.8, fy + 4 + chatter, -1, 2, 2, 2.4, '#3d6d93', 0.7, 0.8);
  shakeLines(ctx, 18, fy + 4 - chatter, 1, 2, 2, 2.4, '#3d6d93', 0.7, 0.8);

  // snowflakes + icy vapour
  snowflake(ctx, -15 + s, -20 - f * 0.6, 1.6, '#ffffff', 0.9);
  snowflake(ctx, 15.4, -15 + s * 0.8, 1.3, '#ffffff', 0.8);
  steamCurl(ctx, -2.6, -27.6, 4.6, ph, 1.2, 0.5, '#e8f7ff');
}

enemySprite('pentola', 46, 56, 37, drawPentola);

// ---------------------------------------------------------------------------
// 11. LA PENTOLA UNICA — r17. A dented, greedy stockpot overflowing with
//     pasta, onion rings, bacon and cream; knife & fork at the ready.
// ---------------------------------------------------------------------------

const STEEL = '#c0c7d3';
const STEEL_SH = '#7f889c';
const CRM = '#fbf1da';
const CRM_SH = '#e2cca2';
const BACON = '#e8707a';

function onionRing(ctx: Ctx, x: number, y: number, r: number, rot: number) {
  shape(ctx, (c) => ringPath(c, x, y, r, r * 0.62, r * 0.55, r * 0.3, rot), { fill: '#e9ad4c', ink: 1.1, shadow: '#bf7a2a', shadowOffset: [-0.8, -0.9], gloss: [{ x: x - r * 0.5, y: y - r * 0.4, rx: r * 0.3, ry: r * 0.12, rot: -0.5, alpha: 0.6 }] });
  speckle(ctx, x, y, r * 0.8, r * 0.5, 5, '#c98a3a', 0.35, (x * 13) | 0, 0.8);
}

function drawPentolaUnica(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);

  // far arm (knife)
  const kx = -21.4 - s * 0.6, ky = -10.8 + s * 0.8;
  shape(ctx, (c) => {
    c.moveTo(kx - 0.6, ky);
    c.lineTo(kx - 1.2, ky - 8.4);
    c.quadraticCurveTo(kx + 1.6, ky - 7, kx + 1, ky);
    c.closePath();
  }, { fill: '#e7ecf3', ink: 1.1, shadow: '#a9b2c3', shadowOffset: [-0.6, -0.4] });
  hoseArm(ctx, -16.4, -4.6, kx, ky + 1.2, { bend: -0.2, thick: 2.1, handR: 2.7 });

  legs(ctx, 0, 11, f, { len: 4.6, spread: 13, thick: 3.1, color: LIMB, shoe: '#2d2422', stride: 4.2 });

  // pot body
  const body = (c: Ctx) => cylPath(c, 0, -8, 11.4, 17, 15.6, 4.4, 3.6);
  shape(ctx, body, { fill: STEEL, shadow: STEEL_SH, shadowOffset: [-3.6, -1.4], ink: 2.4, gloss: [{ x: -12, y: 1, rx: 1.5, ry: 6.2, alpha: 0.6 }, { x: -8.6, y: 7, rx: 0.8, ry: 1.8, alpha: 0.4 }] });
  // side handles
  for (const sx of [-1, 1]) {
    shape(ctx, (c) => roundRectPath(c, sx < 0 ? -20 : 15.8, -6.4, 4.2, 3, 1.2), { fill: '#8a93a6', ink: 1.6, shadow: 'none' });
  }
  // dents
  clipTo(ctx, body, () => {
    for (const [dx, dy, dr] of [[-11.4, -2.4, 3.6], [12.2, 7.4, 2.6]] as [number, number, number][]) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = STEEL_SH;
      ctx.beginPath();
      ellipsePath(ctx, dx + dr * 0.25, dy + dr * 0.2, dr, dr * 0.8, 0.4);
      ctx.fill();
      ctx.restore();
      line(ctx, [[dx - dr * 0.8, dy - dr * 0.4], [dx - dr * 0.2, dy - dr * 0.9], [dx + dr * 0.7, dy - dr * 0.5]], 0.8, '#ffffff', true, 0.8);
      line(ctx, [[dx - dr * 0.6, dy + dr * 0.5], [dx + dr * 0.4, dy + dr * 0.75]], 0.7, shade(STEEL_SH, 0.3), true, 0.7);
    }
  });

  // overflow: cream mound + slop over the rim
  const dr = (k: number) => 1 + 0.35 * Math.sin(ph + k);
  const mound = (c: Ctx) => {
    smoothPath(c, [
      [-17.6, -8.4], [-15.2, -14.6], [-10.6, -19.4], [-4.4, -21.2], [2.4, -22.6], [8.8, -20.2], [13.8, -16.4], [17.4, -9.6],
      [12, -5.8], [4, -4.8], [-4, -5], [-12, -5.6],
    ], true);
  };
  const slops = (c: Ctx) => {
    dripPath(c, -13.2, -6.4, 3.4, 5.8 * dr(0));
    dripPath(c, 9.6, -5.6, 3, 4.6 * dr(2));
    dripPath(c, 15.4, -7.6, 2.6, 6.8 * dr(4));
  };
  // rim back edge first
  shape(ctx, (c) => ellipsePath(c, 0, -8, 17.2, 4.4), { fill: '#9aa3b5', ink: 2.2, shadow: 'none' });
  // wooden spoon stuck in the slop
  inkLine(ctx, [[-4, -14], [-13.6, -31]], 2.4, '#d9a066', false, 1.2);
  shape(ctx, (c) => ellipsePath(c, -13.9, -31.4, 1.6, 1.2, -1), { fill: '#d9a066', ink: 1, shadow: 'none' });
  line(ctx, [[-5, -16.4], [-12.4, -29.6]], 0.6, '#f6cf98', false, 0.8);
  group(ctx, [
    { build: slops, style: { fill: CRM, shadow: CRM_SH, shadowOffset: [-1, -1] } },
    { build: mound, style: { fill: CRM, shadow: CRM_SH, shadowOffset: [-2.4, -2.6], gloss: [{ x: -8, y: -16.6, rx: 3, ry: 1.2, rot: -0.4, alpha: 0.8 }] } },
  ], 2.1);
  // spaghetti looping all over
  inkLine(ctx, [[-15, -10], [-11, -15.6], [-5, -12.6], [-1, -18.8], [5.4, -14.6], [10.6, -18.4], [14.6, -12]], 1.3, PASTA, true, 0.75);
  inkLine(ctx, [[-9.6, -8], [-6.4, -16.6], [1.4, -15.2], [6.4, -9.6]], 1.3, PASTA, true, 0.75);
  inkLine(ctx, [[12.6, -8.6], [14.6, -5], [14.2, 0.6 + s * 0.5]], 1.3, PASTA, true, 0.75);
  inkLine(ctx, [[-16, -8], [-17.6, -3], [-16.8, 2 - s * 0.5]], 1.3, PASTA, true, 0.75);
  // onion rings + bacon
  onionRing(ctx, 6.2, -19.6, 3.4, -0.3);
  onionRing(ctx, -9.8, -15.8, 3, 0.4);
  for (const [bx, by, br] of [[-2.2, -17.2, 0], [11.6, -12.6, 0.6], [-14, -11.2, -0.4]] as [number, number, number][]) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(br);
    shape(ctx, (c) => roundRectPath(c, -1.8, -1.4, 3.6, 2.8, 0.7), { fill: BACON, ink: 1, shadow: '#b84358', shadowOffset: [-0.5, -0.5] });
    line(ctx, [[-1.6, 0.1], [1.6, -0.1]], 0.7, '#fff0e8', false, 0.9);
    ctx.restore();
  }
  speckle(ctx, 0, -14, 12, 4, 12, '#5a4030', 0.35, 31, 0.9);

  // the face: greedy & starving
  eyePair(ctx, 0.6, -1.6, 3.7, { sp: 10.2, look: [0.2, 0.25], near: 1.06, brow: 0.32, browDy: 1.4, browTh: 1.8, lidL: 'none', lidR: 'none', pupil: 0.6 });
  // huge mouth
  const mouthP = (c: Ctx) => {
    c.moveTo(-9.6, 2.6);
    c.quadraticCurveTo(1, 4.6, 12.2, 2);
    c.quadraticCurveTo(10.4, 12.4, 1, 12.2);
    c.quadraticCurveTo(-8.4, 11.6, -9.6, 2.6);
    c.closePath();
  };
  shape(ctx, mouthP, { fill: '#5b1320', ink: 1.6, shadow: 'none' });
  clipTo(ctx, mouthP, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const x = -8.6 + i * 3.1;
      ctx.moveTo(x, 2);
      ctx.lineTo(x + 1.55, 5.6);
      ctx.lineTo(x + 3.1, 2);
    }
    ctx.fill();
    // throat
    ctx.fillStyle = '#3a0812';
    ctx.beginPath();
    ellipsePath(ctx, 1.2, 11, 6, 3);
    ctx.fill();
  });
  // tongue licking the corner
  shape(ctx, (c) => {
    c.moveTo(6, 9.4);
    c.quadraticCurveTo(12.6, 10.4, 13.6, 5.4);
    c.quadraticCurveTo(15.6, 3.2, 14.6, 1.6);
    c.quadraticCurveTo(11.6, 3.4, 10.4, 5.4);
    c.quadraticCurveTo(8.6, 7.4, 4.6, 7.2);
    c.closePath();
  }, { fill: '#f0707f', ink: 1.2, shadow: '#c94a5c', shadowOffset: [-0.6, -0.8] });
  // drool
  shape(ctx, (c) => dripPath(c, -8.4, 5.6, 1.8, 4.6 + (s + 1) * 1.2), { fill: CRM, ink: 1, shadow: 'none' });

  // near arm with fork raised
  const hx = 21.2 + s * 0.6, hy = -10.6 - s * 0.8;
  line(ctx, [[hx + 0.4, hy], [hx + 0.9, hy - 10]], 2.6, INK);
  line(ctx, [[hx + 0.4, hy], [hx + 0.9, hy - 10]], 1.2, '#e7ecf3');
  shape(ctx, (c) => {
    c.moveTo(hx - 1.6, hy - 9);
    c.lineTo(hx + 3.4, hy - 9.6);
    c.lineTo(hx + 3.4, hy - 13.6);
    c.lineTo(hx - 1.6, hy - 13);
    c.closePath();
  }, { fill: '#e7ecf3', ink: 0.9, shadow: 'none' });
  for (const t of [-1.4, 0.3, 2, 3.4]) line(ctx, [[hx + t, hy - 12.8 - t * 0.12], [hx + t, hy - 16.6 - t * 0.12]], 0.75, INK);
  hoseArm(ctx, 16.4, -4.6, hx, hy + 1, { bend: 0.2, thick: 2.1, handR: 2.7 });
}

enemySprite('pentolaunica', 58, 60, 38, drawPentolaUnica);

// ---------------------------------------------------------------------------
// 14. SCATOLETTA MALEDETTA — r14. A cursed can of carbonara: rattling,
//     bulging, lid popping, pale sauce oozing out. Kamikaze.
// ---------------------------------------------------------------------------

const TIN = '#cfd4de';
const TIN_SH = '#8b93a6';
const LABEL_RED = '#d63a30';
const LABEL_CREAM = '#f7ebcd';
const CARBO = '#f4dc84';
const GUANCIALE = '#f39aa6';

function drawScatoletta(ctx: Ctx, f: number) {
  const rot = [0, 0.07, -0.05, 0.035][f];
  const bulge = [1, 1.035, 1, 1.07][f];
  const lift = [0.4, 1.6, 0.8, 2.8][f];

  legs(ctx, 0, 10, f, { len: 2.8, spread: 11, thick: 2.4, color: LIMB, shoe: '#2d2422', stride: 3.4 });

  ctx.save();
  ctx.translate(0, 10);
  ctx.rotate(rot);
  ctx.scale(bulge, 1 / Math.sqrt(bulge));
  ctx.translate(0, -10);

  const RX = 11, RY = 3.4, YT = -10.6, YB = 9;
  const body = (c: Ctx) => cylPath(c, 0, YT, YB, RX, RX, RY);
  shape(ctx, body, { fill: TIN, shadow: TIN_SH, shadowOffset: [-3, -1], ink: 2.1, gloss: [{ x: -8.2, y: 0, rx: 1.2, ry: 8, alpha: 0.6 }] });
  clipTo(ctx, body, () => {
    // ribs above/below the label
    for (const y of [-8.4, 7.2]) {
      ctx.beginPath();
      ctx.ellipse(0, y, RX, RY, 0, 0, Math.PI);
      ctx.strokeStyle = TIN_SH;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    // label band
    const lab = (c: Ctx) => {
      c.moveTo(-RX - 1, -7);
      c.ellipse(0, -7, RX + 1, RY, 0, Math.PI, 0, true);
      c.lineTo(RX + 1, 5.4);
      c.ellipse(0, 5.4, RX + 1, RY, 0, 0, Math.PI, false);
      c.closePath();
    };
    shape(ctx, lab, { fill: LABEL_RED, ink: 0, shadow: shade(LABEL_RED, 0.25), shadowOffset: [-2.8, 0] });
    // cream stripes
    ctx.save();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = LABEL_CREAM;
    for (const y of [-5.6, 4.2]) {
      ctx.beginPath();
      ctx.ellipse(0, y, RX + 1, RY, 0, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
    // pictured bowl of carbonara (wrapping round the left side)
    ctx.save();
    ctx.translate(-8.6, 2.6);
    ctx.scale(0.5, 0.8);
    shape(ctx, (c) => {
      c.moveTo(-4, -0.6);
      c.quadraticCurveTo(0, 5.4, 4, -0.6);
      c.closePath();
    }, { fill: '#ffffff', ink: 0.8, shadow: '#d5d9e3', shadowOffset: [-0.6, -0.6] });
    shape(ctx, (c) => ellipsePath(c, 0, -0.9, 4, 1.7), { fill: CARBO, ink: 0.8, shadow: 'none' });
    for (const [px, py] of [[-1.6, -1.2], [0.8, -0.6], [2, -1.4]] as Pt[]) {
      ctx.fillStyle = GUANCIALE;
      ctx.fillRect(px - 0.55, py - 0.55, 1.1, 1.1);
    }
    ctx.restore();
    // dent (crumple + scuffs)
    line(ctx, [[-6.4, 5], [-4, 2.2], [-5.2, -0.4]], 0.9, shade(LABEL_RED, 0.45), false, 0.8);
    line(ctx, [[-5.8, 5.2], [-3.4, 2.4], [-4.6, -0.2]], 0.6, '#ff8a7c', false, 0.7);
  });

  // open top: dark gap + sauce
  shape(ctx, (c) => ellipsePath(c, 0, YT, RX - 0.6, RY - 0.5), { fill: '#3a2414', ink: 1.2, shadow: 'none' });
  shape(ctx, (c) => ellipsePath(c, 0, YT + 0.5, RX - 1.4, RY - 1.2), { fill: CARBO, ink: 0, shadow: '#d9b55a', shadowOffset: [1, 0.6] });
  // ooze over the front rim + drips
  const oz = (c: Ctx) => {
    c.moveTo(5.2, YT + 2.6);
    c.quadraticCurveTo(8.4, YT + 4.2, 10.8, YT + 1.2);
    c.quadraticCurveTo(8.6, YT + 0.6, 5.2, YT + 2.6);
    c.closePath();
    dripPath(c, 9.4, YT + 2.8, 2, 3.4 + lift * 1.1);
  };
  shape(ctx, oz, { fill: CARBO, ink: 1, shadow: '#d9b55a', shadowOffset: [-0.6, -0.6], gloss: [{ x: 8.6, y: YT + 2.2, rx: 0.9, ry: 0.4, alpha: 0.8 }] });
  ctx.fillStyle = GUANCIALE;
  ctx.fillRect(7.2, YT + 2, 1.2, 1);

  // lid, popping up at the front-right (hinged at the back-left)
  ctx.save();
  ctx.translate(-9.4, YT - 0.8);
  ctx.rotate(-0.16 - lift * 0.05);
  ctx.translate(9.4 + 0.6, -lift * 0.8);
  shape(ctx, (c) => ellipsePath(c, 0, 0, RX, RY + 0.4), { fill: '#e2e6ee', ink: 1.6, shadow: TIN_SH, shadowOffset: [-1.4, -1.2] });
  ctx.beginPath();
  ellipsePath(ctx, 0, 0, RX - 2.2, RY - 1);
  ctx.strokeStyle = TIN_SH;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // pull-tab ring
  shape(ctx, (c) => ringPath(c, 5.4, -0.6, 2.8, 1.6, 1.5, 0.7), { fill: '#f1f3f7', ink: 1, shadow: 'none' });
  glint(ctx, -4, -1.2, 1.6, 0.5, -0.1, 0.9);
  ctx.restore();

  // face: deranged
  eye(ctx, -1.8, -2.4, 3.05, { look: [0.4, 0.15], lid: 'angry-l', pupil: 0.36 });
  eye(ctx, 5.6, -2.7, 3.75, { look: [0.3, 0.1], lid: 'angry-r', pupil: 0.3 });
  brow(ctx, -2, -6.8, 4.8, 0.5, 1.55);
  brow(ctx, 6, -8, 5.6, -0.5, 1.55);
  // jagged can-opener grin
  const gm = (c: Ctx) => {
    c.moveTo(-3.6, 2.2);
    c.quadraticCurveTo(2, 3.6, 9.4, 1.4);
    c.quadraticCurveTo(7.8, 7.6, 2.6, 7.4);
    c.quadraticCurveTo(-2.4, 7, -3.6, 2.2);
    c.closePath();
  };
  shape(ctx, gm, { fill: '#5b1320', ink: 1.2, shadow: 'none' });
  clipTo(ctx, gm, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = -3.6 + i * 2.2;
      ctx.moveTo(x, 1.6);
      ctx.lineTo(x + 1.1, 4.4);
      ctx.lineTo(x + 2.2, 1.6);
    }
    for (let i = 0; i < 5; i++) {
      const x = -2.2 + i * 2.2;
      ctx.moveTo(x, 8);
      ctx.lineTo(x + 1.1, 5.6);
      ctx.lineTo(x + 2.2, 8);
    }
    ctx.fill();
  });
  ctx.restore();

  // rattle lines + escaping steam when it is about to pop
  if (f === 1 || f === 3) {
    shakeLines(ctx, -14.6, -1, -1, 3, 2.6, 3, INK, 0.75, 1);
    shakeLines(ctx, 14.8, -2, 1, 3, 2.6, 3, INK, 0.75, 1);
  }
  if (f === 3) {
    puff(ctx, 9.6, -17.6, 1.8, '#ffffff', '#d8dbe4', 0.85, 0.8);
    puff(ctx, -6.6, -17, 1.4, '#ffffff', '#d8dbe4', 0.7, 0.8);
  }
}

enemySprite('scatoletta', 42, 48, 30, drawScatoletta);

// ---------------------------------------------------------------------------
// 4. SPARGIPOLVERE — r14. A shifty green shaker of powdered "parmesan",
//    rubbing its hands, puffing dust clouds from its sprinkle lid. Lobber.
// ---------------------------------------------------------------------------

const CAN_G = '#3f9b4c';
const CAN_G_SH = '#256a37';
const CAP = '#f6e07c';
const CAP_SH = '#d6ab3c';
const POWDER = '#fff4cf';

/** A painted question mark (path, not font text). */
function questionMark(ctx: Ctx, x: number, y: number, h: number, col: string) {
  const w = h * 0.2;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [lw, c] of [[w + 1.4, INK], [w, col]] as [number, string][]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x, y - h * 0.22, h * 0.24, Math.PI * 1.05, Math.PI * 2.35);
    ctx.quadraticCurveTo(x, y + h * 0.02, x, y + h * 0.16);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    circlePath(ctx, x, y + h * 0.42, lw * 0.55);
    ctx.fill();
  }
  ctx.restore();
}

function drawParmesan(ctx: Ctx, f: number) {
  const { s } = cyc(f);

  legs(ctx, 0, 9.6, f, { len: 3.2, spread: 9, thick: 2.3, color: LIMB, shoe: '#2d2422', stride: 3.6 });

  // standing flip lid (we see its underside) with a big "?" on it
  const lid = (c: Ctx) => {
    c.moveTo(-9.6, -19.2);
    c.bezierCurveTo(-10.4, -33.4, 10.4, -33.4, 9.6, -19.2);
    c.closePath();
  };
  shape(ctx, lid, { fill: '#ecc952', ink: 1.8, shadow: CAP_SH, shadowOffset: [-1.6, -1.4], gloss: [{ x: -5.6, y: -27.4, rx: 1.8, ry: 0.8, rot: -0.7, alpha: 0.55 }] });
  line(ctx, [[-8.6, -20.4], [8.6, -20.4]], 0.6, CAP_SH, false, 0.6);
  questionMark(ctx, 0.4, -26.6, 6.6, '#e0402e');

  // can body (green), metal base
  const body = (c: Ctx) => cylPath(c, 0, -13.4, 9.4, 9.6, 9.6, 2.9);
  shape(ctx, body, { fill: CAN_G, shadow: CAN_G_SH, shadowOffset: [-2.8, -0.8], ink: 2, gloss: [{ x: -6.8, y: -2, rx: 1.1, ry: 7.4, alpha: 0.45 }] });
  clipTo(ctx, body, () => {
    // pale stripe low on the label + dark base band
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#bfe3a6';
    ctx.beginPath();
    ctx.ellipse(0, 3.8, 9.6, 2.9, 0, 0, Math.PI);
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#1e5a2e';
    ctx.beginPath();
    ctx.ellipse(0, 7, 9.6, 2.9, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  });
  // metal bottom rim
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 9.4, 9.6, 2.9, 0, 0.15, Math.PI - 0.15);
  ctx.strokeStyle = '#c9ced8';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();

  // cap
  const cap = (c: Ctx) => cylPath(c, 0, -19.2, -13, 10.2, 10.2, 3);
  shape(ctx, cap, { fill: CAP, shadow: CAP_SH, shadowOffset: [-2, -0.6], ink: 1.9 });
  clipTo(ctx, cap, () => {
    for (let i = -4; i <= 4; i++) line(ctx, [[i * 2.3, -18], [i * 2.3, -9]], 0.5, CAP_SH, false, 0.6);
  });
  // top face: front half with sprinkle holes
  shape(ctx, (c) => {
    c.moveTo(-10.2, -19.2);
    c.ellipse(0, -19.2, 10.2, 3, 0, Math.PI, 0, true);
    c.closePath();
  }, { fill: '#fff0a8', ink: 0, shadow: 'none' });
  for (const [hx, hy] of [[-5.2, -18.4], [-1.8, -17.8], [1.8, -17.8], [5.2, -18.4], [-3.4, -17], [0, -16.6], [3.4, -17]] as Pt[]) {
    ctx.fillStyle = '#5c4a1f';
    ctx.beginPath();
    ellipsePath(ctx, hx, hy, 0.7, 0.42);
    ctx.fill();
  }

  // powder puffs drifting up (looping)
  for (let k = 0; k < 3; k++) {
    const t = ((f + k * 1.34) % 4) / 4;
    const x = 4 + k * 2.4 + t * 7, y = -19.6 - t * 9 - k * 1.2;
    puff(ctx, x, y, 1.5 + t * 1.6, POWDER, '#d9c38a', 0.95 - t * 0.55, 0.8);
  }
  speckle(ctx, 10, -25, 5, 4, 7, '#f7e9b8', 0.45, 3 + f, 0.9);

  // shifty face
  eye(ctx, -2.6, -6.6, 3.1, { look: [0.62, 0.16], lid: 'half', pupil: 0.48 });
  eye(ctx, 4.6, -6.7, 3.35, { look: [0.62, 0.16], lid: 'half', pupil: 0.48 });
  brow(ctx, -2.8, -10.6, 4.8, 0.42, 1.4);
  brow(ctx, 5.2, -12.4, 5, -0.28, 1.4);
  mouth(ctx, 2.2, -1.2, 6.6, 'smirk');
  shape(ctx, (c) => roundRectPath(c, 3.4, -1.5, 1.4, 1.5, 0.3), { fill: '#fff8ea', ink: 0.5, shadow: 'none' });
  // sweat bead (guilty)
  shape(ctx, (c) => {
    c.moveTo(10.6, -11.4);
    c.quadraticCurveTo(11.8, -9.4, 10.6, -8.6);
    c.quadraticCurveTo(9.4, -9.4, 10.6, -11.4);
    c.closePath();
  }, { fill: '#bfe8ff', ink: 0.7, shadow: 'none' });

  // hands rubbing together (scheming)
  const rub = s * 0.7;
  hoseArm(ctx, -9.2, 1.4, 0.2 + rub, 5.8, { bend: 0.22, thick: 1.8, handR: 2.3 });
  hoseArm(ctx, 9.4, 1.2, 3.6 - rub, 6.2, { bend: -0.22, thick: 1.8, handR: 2.4 });
}

enemySprite('parmesan', 42, 56, 37, drawParmesan);

