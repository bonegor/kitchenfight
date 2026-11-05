/**
 * BOSS — IL CAMPANILE DEL CAPPUCCINO (The Cappuccino Clock Tower). Radius 52.
 *
 * A bell tower stacked from caramel-glazed cappuccino cups: the big bottom cup is the
 * grumpy face (foam eyebrows, foam moustache, gritted teeth, cup handle on the hip),
 * a second cup carries the clock — forever stuck at 11:00, the hour after which no
 * Italian drinks a cappuccino — then a belfry of cinnamon sticks with a swinging bronze
 * bell, and an upside-down espresso cup as the dome with a golden coffee bean on top.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, line, ellipsePath, circlePath, roundRectPath, speckle, rgba,
} from '../painter';
import {
  OUT, OUT_IN, OUT_S, TAU, phase, S, clipTo, fillPath, sparkle, fist, limb, softGlow, pivot, rings, burstLines,
  stompLegs, dripPath, lidEye, steamWisp, swoosh,
} from './bosses_b_kit';

export const CAMPANILE_R = 52;
const W = 188, H = 230, AX = 82, AY = 172;

const CUP = '#b9693c';
const CUP_SH = '#874227';
const CUP_HI = '#e09a62';
const FOAM = '#fff5e4';
const FOAM_SH = '#e7cfac';
const COCOA = '#6e3a1f';
const COFFEE = '#7b4326';
const CREAM = '#fff4e0';
const BRONZE = '#d0903c';
const BRONZE_SH = '#91561f';
const GOLD = '#ffc93a';
const CINN = '#9c5530';
const CINN_SH = '#6e341b';
const SILVER = '#dfe5ee';
const SILVER_SH = '#9aa6b8';

interface Pose {
  f: number;
  lean: number;
  topLean: number;
  bell: number;
  clapper: number;
  mood: 'stern' | 'tense' | 'shout';
  foam: number; // foam swell 0..1
  spoon: Pt; // hand position
  spoonAng: number;
  minute: number; // minute hand angle offset (0 = 12)
  ring: boolean;
}

// ---------------------------------------------------------------------------
// parts
// ---------------------------------------------------------------------------

function saucer(ctx: Ctx, x: number, y: number, rx: number, ry: number, ink = OUT) {
  // underside / thickness
  S(ctx, (c) => ellipsePath(c, x, y + ry * 0.45, rx, ry * 1.05), { fill: CUP_SH, ink, shadow: 'none' });
  // top surface
  S(ctx, (c) => ellipsePath(c, x, y, rx, ry), { fill: CUP, ink: ink * 0.7, shadow: CUP_SH, shadowOffset: [-rx * 0.08, -ry * 0.25], gloss: [{ x: x - rx * 0.55, y: y - ry * 0.35, rx: rx * 0.18, ry: ry * 0.2, rot: -0.15, alpha: 0.45 }] });
  // gold rim line + inner well
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, x, y, rx * 0.88, ry * 0.78);
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(1, ry * 0.14);
  ctx.stroke();
  ctx.restore();
  fillPath(ctx, (c) => ellipsePath(c, x + rx * 0.02, y + ry * 0.05, rx * 0.56, ry * 0.5), CUP_SH, 0.45);
}

/** Main cup silhouette (rim at y=-30, bottom at y=22). */
const mainCup = (c: Ctx) => {
  c.moveTo(-48, -30);
  c.bezierCurveTo(-50, -4, -45, 15, -24, 22);
  c.quadraticCurveTo(0, 28, 24, 22);
  c.bezierCurveTo(45, 15, 50, -4, 48, -30);
  c.quadraticCurveTo(0, -20, -48, -30);
  c.closePath();
};

/** Clock cup silhouette (rim at y=-78, bottom at y=-40). */
const clockCup = (c: Ctx) => {
  c.moveTo(-29, -78);
  c.bezierCurveTo(-30, -60, -27, -46, -15, -40.5);
  c.quadraticCurveTo(0, -37.5, 15, -40.5);
  c.bezierCurveTo(27, -46, 30, -60, 29, -78);
  c.quadraticCurveTo(0, -72, -29, -78);
  c.closePath();
};

function foamCrown(ctx: Ctx, cx: number, rimY: number, rx: number, f: number, swell: number, seed: number, drips: [number, number][]) {
  const ph = phase(f);
  const puffs: [number, number, number][] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = cx - rx * 0.92 + t * rx * 1.84;
    const r = rx * (0.18 + Math.sin(t * Math.PI) * 0.06) * (1 + swell * 0.12);
    puffs.push([x, rimY - 3 - Math.sin(t * Math.PI) * rx * 0.08, r]);
  }
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4;
    puffs.push([cx - rx * 0.6 + t * rx * 1.2, rimY - rx * 0.22 - Math.sin(t * Math.PI) * rx * 0.06 - swell * 3, rx * 0.22 * (1 + swell * 0.15)]);
  }
  const foam = (c: Ctx) => {
    for (const [x, y, r] of puffs) circlePath(c, x, y, r);
    for (const [dx, len] of drips) dripPath(c, cx + dx, rimY + 1, rx * 0.16, len + Math.sin(ph + dx) * 2 + swell * 3);
  };
  S(ctx, foam, { fill: FOAM, ink: OUT_IN, shadow: FOAM_SH, shadowOffset: [-rx * 0.08, -rx * 0.09] });
  // cocoa / cinnamon dust on the top of the foam
  clipTo(ctx, foam, () => {
    speckle(ctx, cx - rx * 0.05, rimY - rx * 0.26, rx * 0.66, rx * 0.08, Math.round(rx * 0.7), COCOA, rx * 0.014, seed, 0.6);
    // a latte-art swirl
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#c99a6a';
    ctx.lineWidth = rx * 0.035;
    ctx.beginPath();
    ctx.ellipse(cx + rx * 0.08, rimY - rx * 0.24, rx * 0.3, rx * 0.06, 0, 0.3, 5.6);
    ctx.stroke();
    ctx.restore();
  });
  // glossy bubbles
  const R = (i: number) => Math.abs(Math.sin(seed * 12.9898 + i * 78.233)) % 1;
  for (let i = 0; i < 3; i++) {
    const bx = cx - rx * 0.7 + R(i) * rx * 1.4;
    const by = rimY - 4 - R(i + 9) * rx * 0.2;
    const br = 1 + R(i + 3) * rx * 0.04 + ((f + i) % 4 === 0 ? 0.8 : 0);
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#d9bf98';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    circlePath(ctx, bx, by, br);
    ctx.stroke();
    ctx.restore();
    fillPath(ctx, (c) => circlePath(c, bx - br * 0.3, by - br * 0.35, br * 0.3), '#ffffff', 0.9);
  }
}

/** Puffy foam moustache centred at (x,y). */
function foamMoustache(ctx: Ctx, x: number, y: number, w: number, f: number) {
  const ph = phase(f);
  const curl = Math.sin(ph) * 0.8;
  const m = (c: Ctx) => {
    for (const s of [-1, 1]) {
      circlePath(c, x + s * w * 0.14, y, w * 0.17);
      circlePath(c, x + s * w * 0.3, y + w * 0.02, w * 0.15);
      circlePath(c, x + s * w * 0.43, y - w * 0.02, w * 0.11);
      circlePath(c, x + s * w * 0.52, y - w * 0.1 + curl * s * 0.3, w * 0.075);
      circlePath(c, x + s * w * 0.56, y - w * 0.2 + curl * s * 0.4, w * 0.055);
    }
  };
  S(ctx, m, { fill: FOAM, ink: OUT_IN, shadow: FOAM_SH, shadowOffset: [-1.6, -2] });
  speckle(ctx, x, y - w * 0.06, w * 0.38, w * 0.06, 8, COCOA, 0.6, 77, 0.6);
  // centre parting
  line(ctx, [[x, y - w * 0.1], [x, y + w * 0.08]], 1.4, FOAM_SH, false, 0.9);
}

/** Bushy foam eyebrow from (x0,y0) to (x1,y1). */
function foamBrow(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, r: number) {
  const b = (c: Ctx) => {
    for (let i = 0; i <= 3; i++) {
      const t = i / 3;
      circlePath(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * r * 0.25, r * (0.82 + Math.sin(t * Math.PI) * 0.3));
    }
  };
  S(ctx, b, { fill: FOAM, ink: OUT_S + 0.4, shadow: FOAM_SH, shadowOffset: [-1.2, -1.6] });
}

function clockFace(ctx: Ctx, x: number, y: number, r: number, minuteOff: number) {
  // bronze bezel
  S(ctx, (c) => circlePath(c, x, y, r + 3.4), { fill: BRONZE, ink: OUT_IN, shadow: BRONZE_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: x - r * 0.6, y: y - r * 0.7, rx: r * 0.3, ry: r * 0.14, rot: -0.7, alpha: 0.7 }] });
  // dial
  S(ctx, (c) => circlePath(c, x, y, r), { fill: CREAM, ink: OUT_S, shadow: '#ead7b8', shadowOffset: [-1.4, -1.4] });
  // ticks: 12 hour marks, the 11 painted red (the forbidden hour)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2;
    const big = i % 3 === 0;
    const r0 = r * (big ? 0.66 : 0.76), r1 = r * 0.9;
    if (i === 11) {
      fillPath(ctx, (c) => circlePath(c, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 2.3), '#e02a36');
      continue;
    }
    line(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], big ? 2.2 : 1.3, INK);
  }
  // hands at 11:00 (hour hand → 11, minute hand → 12)
  const hourA = (11 / 12) * TAU - Math.PI / 2;
  const minA = -Math.PI / 2 + minuteOff;
  const hand = (a: number, len: number, w: number) => {
    const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    shape(ctx, (c) => {
      c.moveTo(x - dx * len * 0.15 + nx * w * 0.4, y - dy * len * 0.15 + ny * w * 0.4);
      c.lineTo(x + dx * len * 0.72 + nx * w * 0.35, y + dy * len * 0.72 + ny * w * 0.35);
      c.lineTo(x + dx * len * 0.72 + nx * w, y + dy * len * 0.72 + ny * w);
      c.lineTo(x + dx * len, y + dy * len);
      c.lineTo(x + dx * len * 0.72 - nx * w, y + dy * len * 0.72 - ny * w);
      c.lineTo(x + dx * len * 0.72 - nx * w * 0.35, y + dy * len * 0.72 - ny * w * 0.35);
      c.lineTo(x - dx * len * 0.15 - nx * w * 0.4, y - dy * len * 0.15 - ny * w * 0.4);
      c.closePath();
    }, { fill: '#3a2a26', ink: 0.9, shadow: 'none' });
  };
  // hour hand: fat arrow to the (red) 11
  hand(hourA, r * 0.62, 3.2);
  // minute hand: long thin needle to 12
  const mdx = Math.cos(minA), mdy = Math.sin(minA);
  line(ctx, [[x - mdx * r * 0.2, y - mdy * r * 0.2], [x + mdx * r * 0.9, y + mdy * r * 0.9]], 3, INK);
  line(ctx, [[x - mdx * r * 0.2, y - mdy * r * 0.2], [x + mdx * r * 0.86, y + mdy * r * 0.86]], 1.2, '#c0392b');
  shape(ctx, (c) => circlePath(c, x, y, 2.2), { fill: GOLD, ink: 1, shadow: 'none' });
  // glass glare
  clipTo(ctx, (c) => circlePath(c, x, y, r), () => {
    fillPath(ctx, (c) => {
      c.moveTo(x - r, y - r * 0.2);
      c.lineTo(x - r * 0.2, y - r);
      c.lineTo(x + r * 0.15, y - r);
      c.lineTo(x - r, y + r * 0.15);
      c.closePath();
    }, '#ffffff', 0.35);
  });
}

/** Bronze bell hanging from pivot (px,py). */
function bell(ctx: Ctx, px: number, py: number, ang: number, clapper: number, s: number, glowing: boolean) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(ang);
  ctx.scale(s, s);
  // clapper (behind the lip)
  ctx.save();
  ctx.rotate(clapper - ang);
  line(ctx, [[0, 4], [0, 19]], 3.2, INK);
  line(ctx, [[0, 4], [0, 19]], 1.4, '#6a6070');
  shape(ctx, (c) => circlePath(c, 0, 20.5, 3.4), { fill: '#5d5560', ink: 1.6, shadowOffset: [-0.8, -0.8] });
  ctx.restore();
  if (glowing) softGlow(ctx, 0, 10, 26, '#ffd27a', 0.6);
  const body = (c: Ctx) => {
    c.moveTo(-5.5, 1);
    c.quadraticCurveTo(-6.5, -1.5, -3, -2);
    c.lineTo(3, -2);
    c.quadraticCurveTo(6.5, -1.5, 5.5, 1);
    c.bezierCurveTo(8.5, 6, 8, 11, 10, 15);
    c.quadraticCurveTo(13.5, 17.5, 13.5, 19);
    c.quadraticCurveTo(0, 22.5, -13.5, 19);
    c.quadraticCurveTo(-13.5, 17.5, -10, 15);
    c.bezierCurveTo(-8, 11, -8.5, 6, -5.5, 1);
    c.closePath();
  };
  S(ctx, body, { fill: BRONZE, ink: OUT_IN / s, shadow: BRONZE_SH, shadowOffset: [-3, -1], gloss: [{ x: -4.5, y: 6, rx: 1.4, ry: 5, rot: 0.12, alpha: 0.8 }, { x: -9, y: 17.2, rx: 2.2, ry: 0.8, rot: 0.1, alpha: 0.5 }] });
  // decorative bands
  line(ctx, [[-9.4, 14.2], [0, 15.6], [9.4, 14.2]], 1.3, BRONZE_SH, true, 0.9);
  line(ctx, [[-7, 4.8], [0, 5.8], [7, 4.8]], 1.1, BRONZE_SH, true, 0.8);
  // crown loop on top
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -3.5, 3, Math.PI, 0);
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = BRONZE;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/** Cinnamon-stick pillar from (x,y0) up to (x,y1). */
function cinnamonPillar(ctx: Ctx, x: number, y0: number, y1: number, w: number) {
  S(ctx, (c) => roundRectPath(c, x - w / 2, y1, w, y0 - y1, w * 0.35), { fill: CINN, ink: OUT_IN, shadow: CINN_SH, shadowOffset: [-w * 0.3, 0] });
  // rolled bark: spiral lines
  for (let yy = y1 + 3; yy < y0 - 2; yy += 5) {
    line(ctx, [[x - w / 2 + 0.6, yy], [x + w / 2 - 0.6, yy + 2.2]], 0.9, CINN_SH, false, 0.8);
  }
  line(ctx, [[x - w * 0.18, y1 + 2], [x - w * 0.18, y0 - 2]], 0.9, '#c98458', false, 0.8);
  // rolled curl at the top end
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + w * 0.05, y1 + w * 0.42, w * 0.26, 0.4, 5.2);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = CINN_SH;
  ctx.stroke();
  ctx.restore();
}

/** Whipped-foam spire (soft-serve coils) with a golden coffee bean on top. (x,y) = base centre. */
function foamSpire(ctx: Ctx, x: number, y: number, f: number, sway: number) {
  const ph = phase(f);
  const coils: [number, number, number][] = [
    // [y offset, half width, height]
    [0, 23, 8.5], [-8, 17.5, 8], [-15, 12.5, 7.2], [-21, 7.5, 6],
  ];
  coils.forEach(([oy, hw, hh], i) => {
    const sx = x + sway * (-oy) * 0.12 + (i % 2 ? 1 : -1) * 0.8;
    const cy = y + oy;
    const coil = (c: Ctx) => {
      c.moveTo(sx - hw, cy);
      c.bezierCurveTo(sx - hw - 2, cy - hh * 0.9, sx + hw * 0.2, cy - hh * 1.15, sx + hw, cy - hh * 0.35);
      c.quadraticCurveTo(sx + hw + 2.5, cy + hh * 0.35, sx + hw - 2, cy + hh * 0.5);
      c.quadraticCurveTo(sx, cy + hh * 0.85, sx - hw + 1, cy + hh * 0.45);
      c.quadraticCurveTo(sx - hw - 1.5, cy + hh * 0.2, sx - hw, cy);
      c.closePath();
    };
    S(ctx, coil, { fill: FOAM, ink: OUT_IN, shadow: FOAM_SH, shadowOffset: [-hw * 0.18, -2.2], gloss: [{ x: sx - hw * 0.45, y: cy - hh * 0.35, rx: hw * 0.22, ry: hh * 0.16, rot: -0.2, alpha: 0.9 }] });
    // cocoa dusting on the upper part of each coil
    clipTo(ctx, coil, () => speckle(ctx, sx + hw * 0.1, cy - hh * 0.5, hw * 0.8, hh * 0.3, Math.round(hw * 0.8), COCOA, 0.65, 40 + i, 0.7));
  });
  // curly tip
  const tx = x + sway * 3.6, ty = y - 27.5;
  S(ctx, (c) => {
    c.moveTo(tx - 4, ty + 2);
    c.quadraticCurveTo(tx - 3, ty - 5, tx + 2, ty - 7);
    c.quadraticCurveTo(tx + 0.5, ty - 3, tx + 4, ty + 1.5);
    c.closePath();
  }, { fill: FOAM, ink: OUT_S + 0.3, shadow: FOAM_SH, shadowOffset: [-1, -1] });
  // golden coffee bean on a little spike (the "angel" of this campanile)
  line(ctx, [[tx + 1, ty - 5], [tx + 1, ty - 9]], 3.4, INK);
  line(ctx, [[tx + 1, ty - 5], [tx + 1, ty - 9]], 1.5, GOLD);
  ctx.save();
  ctx.translate(tx + 1, ty - 14);
  ctx.rotate(0.35 + Math.sin(ph) * 0.08);
  S(ctx, (c) => ellipsePath(c, 0, 0, 4.6, 6.2), { fill: GOLD, ink: OUT_S, shadow: '#c8860f', shadowOffset: [-1.2, -1.2], gloss: [{ x: -1.8, y: -2.4, rx: 1.2, ry: 2, alpha: 0.85 }] });
  line(ctx, [[0.4, -4.8], [-0.9, 0], [0.4, 4.8]], 1.2, '#9a5a0c', true);
  ctx.restore();
  const tw = [[7, -4], [-6, 2], [6, 4], [-6, -4]][((f % 4) + 4) % 4];
  sparkle(ctx, tx + 1 + tw[0], ty - 14 + tw[1], 3.4, '#ffffff', 0.95);
}

/** Big teaspoon; (x,y) = grip, pointing along ang (0 = up). */
function teaspoon(ctx: Ctx, x: number, y: number, ang: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  S(ctx, (c) => {
    c.moveTo(-2.4, 14);
    c.quadraticCurveTo(-3, 0, -1.6, -26);
    c.lineTo(1.6, -26);
    c.quadraticCurveTo(3, 0, 2.4, 14);
    c.quadraticCurveTo(0, 17, -2.4, 14);
    c.closePath();
  }, { fill: SILVER, ink: OUT_S + 0.3, shadow: SILVER_SH, shadowOffset: [-1, 0] });
  S(ctx, (c) => ellipsePath(c, 0, -36, 8, 11.5), { fill: SILVER, ink: OUT_IN, shadow: SILVER_SH, shadowOffset: [-2.4, -2.4], gloss: [{ x: -2.6, y: -40, rx: 2, ry: 4.4, rot: 0.2, alpha: 0.95 }] });
  // a dollop of foam in the bowl
  S(ctx, (c) => { circlePath(c, -1, -39, 4.4); circlePath(c, 2.6, -35, 3.6); }, { fill: FOAM, ink: 1.2, shadow: FOAM_SH, shadowOffset: [-0.8, -0.8] });
  ctx.restore();
}

function sugarCubeFoot(ctx: Ctx, x: number, y: number) {
  S(ctx, (c) => roundRectPath(c, x - 9, y - 9, 18, 10, 2.6), { fill: '#fffdf6', ink: OUT_IN, shadow: '#dcd6cc', shadowOffset: [-2, -1.6] });
  speckle(ctx, x, y - 4, 7, 3, 6, '#d8d2c6', 0.55, Math.round(x * 7) & 255, 0.8);
  fillPath(ctx, (c) => c.rect(x - 9, y - 9, 18, 3), '#ffffff', 0.7);
}

// ---------------------------------------------------------------------------
// assembly
// ---------------------------------------------------------------------------

function drawCampanile(ctx: Ctx, p: Pose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = CAMPANILE_R;

  // legs with sugar-cube shoes
  stompLegs(ctx, 0, 30, FOOT - 1, f, {
    spread: 19, thick: 11, color: CUP, shade: CUP_SH, stride: 6, lift: 5,
    shoe: (x, y) => sugarCubeFoot(ctx, x + 1, y + 1),
  });

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean);

  // ---- foam erupting out of the cup (attack)
  if (p.ring) {
    for (const [bx, by, r, a] of [[-60, -52, 6, -2.4], [-70, -30, 4.6, -2.8], [-50, -70, 4, -2.0], [62, -54, 6, -0.7], [70, -32, 4.4, -0.35], [50, -72, 4, -1.1]] as [number, number, number, number][]) {
      line(ctx, [[bx - Math.cos(a) * 4, by - Math.sin(a) * 4], [bx - Math.cos(a) * 16, by - Math.sin(a) * 16]], r * 0.9, '#ffffff', false, 0.35);
      S(ctx, (c) => { circlePath(c, bx, by, r); circlePath(c, bx - Math.cos(a) * r * 0.9, by - Math.sin(a) * r * 0.9, r * 0.6); }, { fill: FOAM, ink: 1.8, shadow: FOAM_SH, shadowOffset: [-1, -1.2], gloss: [{ x: bx - r * 0.35, y: by - r * 0.4, rx: r * 0.3, ry: r * 0.2, rot: -0.6, alpha: 0.95 }] });
    }
  }

  // ---- saucer
  saucer(ctx, 0, 24, 57, 10);

  // ---- cup handle on the left = the hand on the hip
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-44, -18);
  ctx.bezierCurveTo(-70, -24, -76, 6, -45, 9);
  ctx.lineCap = 'round';
  ctx.lineWidth = 13 + OUT_IN * 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 13;
  ctx.strokeStyle = CUP;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = CUP_HI;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(-50, -19);
  ctx.bezierCurveTo(-66, -20, -70, -4, -64, 2);
  ctx.stroke();
  ctx.restore();

  // ---- the main cup (the face)
  S(ctx, mainCup, {
    fill: CUP, ink: OUT, shadow: CUP_SH, shadowOffset: [-9, -4],
    gloss: [{ x: -34, y: -8, rx: 4.5, ry: 14, rot: 0.12, alpha: 0.32 }, { x: -36, y: -12, rx: 1.8, ry: 6, rot: 0.12, alpha: 0.6 }],
  });
  // gold-lined cream band near the bottom
  clipTo(ctx, mainCup, () => {
    fillPath(ctx, (c) => {
      c.moveTo(-60, 9);
      c.quadraticCurveTo(0, 17, 60, 9);
      c.lineTo(60, 16);
      c.quadraticCurveTo(0, 24, -60, 16);
      c.closePath();
    }, CREAM);
    line(ctx, [[-60, 9], [0, 17], [60, 9]], 1.4, GOLD, true);
    line(ctx, [[-60, 16], [0, 24], [60, 16]], 1.4, GOLD, true);
    // little coffee beans on the band
    for (const hx of [-36, -20, -4, 12, 28]) fillPath(ctx, (c) => ellipsePath(c, hx + 6, 16.5 - Math.abs(hx + 6) * 0.06, 2, 1.4, 0.3), CUP);
    // coffee drip stain running down the cup
    fillPath(ctx, (c) => dripPath(c, 36, -28, 5, 18 + Math.sin(ph) * 2), COFFEE, 0.8);
  });

  // ---- face
  const fx = 6, fy = -7;
  const lidC = CUP_SH;
  if (p.mood === 'shout') {
    lidEye(ctx, fx - 13, fy, 8.6, { side: -1, lidOuter: 0.05, lidInner: 0.3, look: [0.3, 0.1], pupil: 0.24, lidColor: lidC, ink: 2.3 });
    lidEye(ctx, fx + 14, fy, 8.6, { side: 1, lidOuter: 0.05, lidInner: 0.3, look: [0.3, 0.1], pupil: 0.24, lidColor: lidC, ink: 2.3 });
  } else {
    const tense = p.mood === 'tense';
    lidEye(ctx, fx - 13, fy, 8.4, { side: -1, lidOuter: tense ? 0.36 : 0.2, lidInner: tense ? 0.64 : 0.5, look: [0.38, 0.22], pupil: 0.3, iris: '#d6402a', lidColor: lidC, ink: 2.3 });
    lidEye(ctx, fx + 14, fy, 8.4, { side: 1, lidOuter: tense ? 0.36 : 0.2, lidInner: tense ? 0.64 : 0.5, look: [0.38, 0.22], pupil: 0.3, iris: '#d6402a', lidColor: lidC, ink: 2.3 });
  }
  // big bulbous nose
  S(ctx, (c) => ellipsePath(c, fx + 2.5, fy + 9, 6.2, 5.2), { fill: '#c97a4c', ink: OUT_S + 0.3, shadow: CUP_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: fx + 0.4, y: fy + 7, rx: 1.8, ry: 1.2, alpha: 0.8 }] });
  // mouth under the moustache
  if (p.mood === 'shout') {
    const m = (c: Ctx) => ellipsePath(c, fx + 2, fy + 25, 11, 9);
    shape(ctx, m, { fill: '#5b1320', ink: OUT_S + 0.3, shadow: 'none' });
    clipTo(ctx, m, () => {
      fillPath(ctx, (c) => ellipsePath(c, fx + 4, fy + 32, 7, 4.5), '#e8616e');
      fillPath(ctx, (c) => c.rect(fx - 12, fy + 14, 28, 6), '#fff8ea');
    });
  } else {
    const m = (c: Ctx) => {
      c.moveTo(fx - 9, fy + 22);
      c.quadraticCurveTo(fx + 2, fy + 18.5, fx + 13, fy + 22);
      c.lineTo(fx + 12, fy + 26.5);
      c.quadraticCurveTo(fx + 2, fy + 24, fx - 8, fy + 27);
      c.closePath();
    };
    shape(ctx, m, { fill: '#fff8ea', ink: OUT_S + 0.2, shadow: 'none' });
    line(ctx, [[fx - 8.5, fy + 24.5], [fx + 2, fy + 21.6], [fx + 12.5, fy + 24.2]], 1.1, 'rgba(80,40,30,0.6)', true);
    for (const tx of [-4, 0.5, 5, 9]) line(ctx, [[fx + tx, fy + 20.5], [fx + tx, fy + 26]], 0.8, 'rgba(80,40,30,0.4)');
  }
  foamMoustache(ctx, fx + 2.5, fy + 16.5, 40, f);

  // ---- foam crown of the main cup (its drips become the bushy brows)
  foamCrown(ctx, 0, -30, 48, f, p.foam, 11, [[-36, 10], [-24, 6], [30, 11], [42, 7]]);
  const browDrop = p.mood === 'tense' ? 2 : p.mood === 'shout' ? -2 : 0;
  foamBrow(ctx, fx - 23, fy - 13 + browDrop * 0.3, fx - 4, fy - 8 + browDrop, 4.6);
  foamBrow(ctx, fx + 4.5, fy - 8 + browDrop, fx + 24, fy - 13 + browDrop * 0.3, 4.6);

  // ---- upper tower (wobbles like a stack of cups)
  const sway = p.topLean + Math.sin(ph + 0.6) * 0.024;
  ctx.save();
  pivot(ctx, 0, -38, sway);
  saucer(ctx, 0, -38, 33, 6.5, OUT_IN);
  S(ctx, clockCup, { fill: CUP, ink: OUT_IN + 0.4, shadow: CUP_SH, shadowOffset: [-5, -2.5], gloss: [{ x: -21, y: -62, rx: 2.4, ry: 8, rot: 0.1, alpha: 0.4 }] });
  clockFace(ctx, 2, -58, 15, p.minute);
  foamCrown(ctx, 0, -78, 29, f + 1, p.foam * 0.6, 23, [[-19, 6], [17, 8]]);
  // belfry: cinnamon pillars + biscotto lintel, a big bronze bell inside
  const bellY = -108;
  cinnamonPillar(ctx, -20, -82, -110, 7.5);
  cinnamonPillar(ctx, 21, -82, -110, 7.5);
  ctx.save();
  pivot(ctx, 0, bellY, sway * 2);
  bell(ctx, 0.5, bellY + 1, p.bell, p.clapper, 1.06, p.ring);
  ctx.restore();
  S(ctx, (c) => {
    c.moveTo(-29, -106);
    c.quadraticCurveTo(0, -117, 30, -106);
    c.lineTo(30, -111.5);
    c.quadraticCurveTo(0, -123, -29, -111.5);
    c.closePath();
  }, { fill: '#e8b46c', ink: OUT_IN, shadow: '#c1813e', shadowOffset: [-2, -1.6] });
  for (const [ax2, ay2] of [[-18, -111.5], [-5, -115], [9, -114.5], [21, -111.5]] as Pt[]) {
    fillPath(ctx, (c) => ellipsePath(c, ax2, ay2, 2.3, 1.5, 0.3), '#fff0d0');
  }
  foamSpire(ctx, 0.5, -117, f, sway * 10);
  ctx.restore();

  // ---- steam curling up beside the tower
  steamWisp(ctx, -34, -40, 26, ph, 7, 0.5);
  steamWisp(ctx, 36, -42, 22, ph + 2, 6, 0.45);

  // ---- spoon arm (front, right)
  const [hx, hy] = p.spoon;
  teaspoon(ctx, hx, hy, p.spoonAng);
  limb(ctx, [[42, 2], [hx - 2, (hy + 2) / 2 + 12], [hx - 1, hy + 2]], 11, CUP, OUT_IN, CUP_SH);
  fist(ctx, hx, hy, 8, p.spoonAng - Math.PI / 2, { cuff: CREAM, ink: OUT_IN });

  // ---- falling cinnamon dust
  for (let i = 0; i < 7; i++) {
    const dx = -40 + i * 13 + Math.sin(i * 3.1) * 4;
    const dy = -30 + ((i * 17 + f * 6) % 40);
    fillPath(ctx, (c) => circlePath(c, dx + 60 * (i % 2 ? 1 : -1) * 0.2, dy + 50, 1.1), COCOA, 0.55);
  }
  ctx.restore();
}

const WALK = (f: number): Pose => {
  const ph = phase(f);
  return {
    f, lean: 0, topLean: 0, bell: 0.34 * Math.sin(ph), clapper: 0.34 * Math.sin(ph - 0.9) * 1.25, mood: 'stern', foam: 0,
    spoon: [62, 6 + Math.sin(ph) * 1.5], spoonAng: 0.18 + Math.sin(ph) * 0.05, minute: 0, ring: false,
  };
};

defineSprite({ id: 'boss.campanile', w: W, h: H, ax: AX, ay: AY, frames: 4, flash: true, draw: (ctx, f) => drawCampanile(ctx, WALK(f)) });

defineSprite({
  id: 'boss.campanile.attack', w: W, h: H, ax: AX, ay: AY, frames: 2, flash: true,
  draw: (ctx, f) => {
    if (f === 0) {
      // wind-up: the bell hauled back, foam swelling, the tower leaning back, spoon raised
      drawCampanile(ctx, {
        f: 0, lean: -0.05, topLean: -0.06, bell: -0.85, clapper: -0.55, mood: 'tense', foam: 1,
        spoon: [58, -22], spoonAng: -0.35, minute: 0.05, ring: false,
      });
      burstLines(ctx, -18, -104, 20, 29, 4, '#fff4d0', 2.2, 9, -2.9, -1.7, 0.9);
    } else {
      // DONG: the bell slams over, sound rings + a ring of milk bubbles, foam erupts
      ctx.save();
      rings(ctx, 12, -100, 26, 9, 3, -1.2, 0.9, '#fff1c8', 3.2, 0.9);
      rings(ctx, -10, -100, 26, 9, 3, Math.PI - 0.9, Math.PI + 1.2, '#fff1c8', 3.2, 0.9);
      ctx.restore();
      swoosh(ctx, 52, -10, 30, -1.6, 0.2, 10, '#ffffff', 0.45);
      drawCampanile(ctx, {
        f: 2, lean: 0.06, topLean: 0.08, bell: 0.95, clapper: 1.25, mood: 'shout', foam: 1,
        spoon: [62, -10], spoonAng: 0.6, minute: 0.1, ring: true,
      });
    }
  },
});

void rgba;
