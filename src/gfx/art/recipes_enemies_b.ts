/**
 * IL MENÙ — ENEMIES B: the cheap stand-ins and the foreign toppings.
 * (Imported before placeholders.ts, so every id defined here replaces its placeholder.)
 *
 *   id                  box w×h   anchor (ax,ay)  radius  behaviour   look
 *   enemy.anacardo      30×26     (15,15)         8       swarm       beige kidney-shaped roasted cashew (salt grains) in a
 *                                                                     black bandit mask: the "bootleg" pine nut
 *   enemy.olio          40×54     (20,38)         13      puddler     squat clear PET bottle of pale seed oil sloshing inside,
 *                                                                     sky-blue label with a sunflower and a red "offer"
 *                                                                     starburst (no text), orange flip cap, oil running down
 *                                                                     its shoulder, greasy schemer's grin, sweating oil
 *   enemy.filante       52×42     (26,26)         14      slither     warm melted-cheese blob with toasted blisters, reaching
 *                                                                     forward with two stretched goo arms (sagging strings,
 *                                                                     drippy hands) and a grin full of cheese strings; no
 *                                                                     legs, it oozes (painted at 0.9 scale)
 *   enemy.cheddar       44×46     (22,30)         13      strafe      bright-orange glossy processed slice with a thin edge,
 *                                                                     wobbling outline, top-right corner curled over, the
 *                                                                     bottom edge melting in two drips; cocky grin
 *   enemy.bbq           44×56     (22,40)         14      ranged      squat dark-brown sauce bottle in a tan cowboy hat, the
 *                                                                     nozzle poking through the hat's crown (tip at +4,−30,
 *                                                                     where the shots leave), smoking like a gun barrel, red
 *                                                                     bandana, gold tooth, straw, cowboy boots with spurs
 *
 *   fx.seedoil_puddle   66×48     (33,24)  1 frame, res 2: pale, cold lemon-yellow seed-oil slick with floating sunflower
 *                                          husks and bubbles (vs the chef's golden fx.oil_slick)
 *   proj.e_bbq          24×24     (12,12)  1 frame: glossy blob of BBQ sauce, smoky trailing side + drip tail (DANGER style)
 *
 * Anchor = centre of the collision circle; feet/base at y ≈ +radius; facing right; no ground shadow.
 */
import {
  Ctx, Pt, INK, shape, group, line, inkLine, ellipsePath, circlePath, roundRectPath, smoothPath, speckle, glint,
  legs, eye, brow, mouth, rng,
} from '../painter';
import { TAU, LIMB, enemySprite, cyc, dripPath, hoseArm, eyePair, cheeks, clipTo, steamCurl } from './enemies_b_kit';
import { danger, sauceBlob } from './projectiles';
import { fx, puddle } from './fx';
import { radial } from './items_kit';

const SHOE = '#2e1c15';

/** Fill a path with a flat colour at some alpha (overlays: shadows, washes). */
function tint(ctx: Ctx, build: (c: Ctx) => void, col: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}

/**
 * Cheese strand from a to b: full width at both ends, necked in the middle, sagging by `sag`
 * (closed path; the ends are meant to be buried in a blob).
 */
function strandPath(c: Ctx, a: Pt, b: Pt, wa: number, wm: number, wb: number, sag: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
  const s1: Pt = [a[0] + nx * wa / 2, a[1] + ny * wa / 2];
  const e1: Pt = [b[0] + nx * wb / 2, b[1] + ny * wb / 2];
  const m1: Pt = [mx + nx * wm / 2, my + ny * wm / 2];
  const s2: Pt = [b[0] - nx * wb / 2, b[1] - ny * wb / 2];
  const e2: Pt = [a[0] - nx * wa / 2, a[1] - ny * wa / 2];
  const m2: Pt = [mx - nx * wm / 2, my - ny * wm / 2];
  c.moveTo(s1[0], s1[1]);
  c.quadraticCurveTo(2 * m1[0] - (s1[0] + e1[0]) / 2, 2 * m1[1] - (s1[1] + e1[1]) / 2, e1[0], e1[1]);
  c.lineTo(s2[0], s2[1]);
  c.quadraticCurveTo(2 * m2[0] - (s2[0] + e2[0]) / 2, 2 * m2[1] - (s2[1] + e2[1]) / 2, e2[0], e2[1]);
  c.closePath();
}

/** Teardrop (sweat bead, falling drop): pointed top at (x, y − h), round bottom of radius r centred at (x, y). */
function teardrop(c: Ctx, x: number, y: number, r: number, h: number) {
  c.moveTo(x, y - h);
  c.quadraticCurveTo(x + r * 1.1, y - r * 0.7, x + r, y);
  c.arc(x, y, r, 0, Math.PI);
  c.quadraticCurveTo(x - r * 1.1, y - r * 0.7, x, y - h);
  c.closePath();
}

// ===========================================================================
// 1. ANACARDO ABUSIVO — r8. A roasted cashew in a bandit mask: it sneaks into
//    the pesto in place of the pine nuts. Comes in clumps.
// ===========================================================================

const CASHEW = '#efd6a2';
const CASHEW_SH = '#cf9f5e';
const CASHEW_HI = '#fff3d6';
const MASK = '#2c2836';

/** Kidney silhouette: convex belly facing forward, the cashew's notch at the back, upper lobe = the head. */
function cashewPath(c: Ctx) {
  smoothPath(c, [
    [-3, -12.2], [2.6, -11.8], [6.8, -8.8], [8.8, -3.6], [8.4, 1.8], [5.6, 5.8], [0.6, 7.8], [-4.2, 7.4],
    [-7.2, 5], [-6.4, 2], [-3.2, -0.8], [-6.6, -4], [-9.6, -6.8], [-8.6, -10.6],
  ], true, 0.5);
}

function drawAnacardo(ctx: Ctx, f: number) {
  const { s } = cyc(f);
  const flap = [0, 1, 0, -1][f];

  legs(ctx, 1.4, 4.4, f, { len: 2.8, spread: 5.4, thick: 2, color: '#5a3820', shoe: SHOE, stride: 3 });

  ctx.save();
  ctx.translate(0.3, -0.5);
  ctx.scale(0.93, 0.93);
  // mask tails streaming behind (knotted at the back of the head)
  const tail = (pts: Pt[], w: number) => {
    inkLine(ctx, pts, w, MASK, true, 0.9);
  };
  tail([[-9, -7.4], [-11, -9.2 + flap * 0.5], [-12.8, -9.6 + flap * 1.2]], 1.7);
  tail([[-9, -6.4], [-11, -5.6 - flap * 0.4], [-12.4, -4.4 - flap]], 1.5);

  // the nut
  shape(ctx, cashewPath, {
    fill: radial(ctx, -3, -6, 13, [[0, CASHEW_HI], [0.4, CASHEW], [1, '#e2b97a']], -3.5, -7),
    shadow: CASHEW_SH, ink: 1.6, shadowOffset: [-1.9, -2.1],
    gloss: [{ x: -4.2, y: -7.6, rx: 2, ry: 1, rot: -0.7, alpha: 0.6 }],
  });
  clipTo(ctx, cashewPath, () => {
    // toasty tips + a darker crease in the notch
    tint(ctx, (c) => ellipsePath(c, -4.6, 5.6, 3.6, 2.6, -0.4), '#c08848', 0.4);
    tint(ctx, (c) => ellipsePath(c, 3.6, 7.4, 4.4, 1.8, -0.2), '#c08848', 0.3);
    tint(ctx, (c) => ellipsePath(c, -4.6, -1.2, 2.2, 3, 0.4), '#b98040', 0.35);
    speckle(ctx, 1, -1, 7, 7, 9, '#ffffff', 0.32, 4, 0.9);
  });

  // bandit mask wrapped round the head, V-shaped (it doubles as the angry brows)
  const band = (c: Ctx) => {
    c.moveTo(-9.5, -8.4);
    c.lineTo(-1.2, -8.4);
    c.lineTo(2.2, -6.5);
    c.lineTo(6.2, -9);
    c.lineTo(9.5, -8.8);
    c.lineTo(9.5, -3.1);
    c.quadraticCurveTo(2.2, -1.9, -9.5, -3.4);
    c.closePath();
  };
  clipTo(ctx, cashewPath, () => {
    ctx.save();
    ctx.beginPath();
    band(ctx);
    ctx.fillStyle = MASK;
    ctx.fill();
    ctx.restore();
    line(ctx, [[-8, -7.6], [-1.6, -7.7]], 0.55, '#6c6680', false, 0.8);
  });
  // knot
  shape(ctx, (c) => ellipsePath(c, -9.2, -6.8, 1.4, 1.7), { fill: MASK, ink: 0.85, shadow: 'none' });
  eye(ctx, 0.8, -5.2, 2.05, { look: [0.42, 0.1], lid: 'angry-l', pupil: 0.55, ink: 0.7 });
  eye(ctx, 5.4, -5.4, 2.25, { look: [0.42, 0.1], lid: 'angry-r', pupil: 0.55, ink: 0.7 });
  mouth(ctx, 3.8, -0.5, 4.8, 'snarl', { teeth: true, open: 1.2 });

  // near fist, shaking
  hoseArm(ctx, 5.4, 3.4, 9.8 + s * 0.4, 2 - Math.abs(s) * 0.8, { thick: 1.2, handR: 1.7, ink: 0.85, bend: 0.3 });
  ctx.restore();
}

enemySprite('anacardo', 30, 26, 15, drawAnacardo);

// ===========================================================================
// 2. OLIO SBAGLIATO — r13. A squat clear bottle of cheap seed oil, sloshing:
//    sky-blue label with a sunflower, orange cap, greasy salesman grin.
// ===========================================================================

const PET = '#f7f5e4';
const SEED = '#f6e27a';
const SEED_DK = '#d8b941';
const SEED_HI = '#fff6c0';
const SKY = '#7cc6ee';
const SKY_SH = '#4b98cf';
const OCAP = '#f5922a';
const OCAP_SH = '#c4601a';

function oilBottlePath(c: Ctx) {
  c.moveTo(-4.3, -22.4);
  c.lineTo(-4.3, -20.6);
  c.bezierCurveTo(-10.4, -19.8, -12.9, -16.6, -12.9, -11.4);
  c.lineTo(-13.1, 4.6);
  c.quadraticCurveTo(-13.1, 9.6, -8.4, 9.6);
  c.lineTo(8.4, 9.6);
  c.quadraticCurveTo(13.1, 9.6, 13.1, 4.6);
  c.lineTo(12.9, -11.4);
  c.bezierCurveTo(12.9, -16.6, 10.4, -19.8, 4.3, -20.6);
  c.lineTo(4.3, -22.4);
  c.closePath();
}

/** Sunflower (petals + seed head), radius r. */
function sunflower(ctx: Ctx, x: number, y: number, r: number) {
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.15;
    shape(ctx, (c) => ellipsePath(c, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.2, a), {
      fill: '#ffd02a', ink: 0.45, inkColor: '#a8690e', shadow: 'none',
    });
  }
  shape(ctx, (c) => circlePath(c, x, y, r * 0.42), { fill: '#6b3a1a', ink: 0.45, inkColor: '#3c1c0c', shadow: 'none' });
  speckle(ctx, x, y, r * 0.3, r * 0.3, 5, '#a8692e', r * 0.07, 3, 0.9);
  ctx.restore();
}

function drawOlio(ctx: Ctx, f: number) {
  const { s, c: co } = cyc(f);
  const tilt = [0, 1.4, 0, -1.4][f];

  legs(ctx, 0, 6.6, f, { len: 3.4, spread: 10, thick: 3, color: LIMB, shoe: SHOE, stride: 4.2 });

  ctx.save();
  ctx.translate(0, -1.4);
  // far arm (behind): limp-wristed "trust me" wave
  hoseArm(ctx, -11.5, -4.6, -15.4 - s * 0.5, -11 + co * 0.8, { bend: -0.3, thick: 1.9, handR: 2.3 });

  // bottle: outline + clear plastic
  shape(ctx, oilBottlePath, { fill: PET, ink: 2.1, shadow: 'none' });
  clipTo(ctx, oilBottlePath, () => {
    // the oil (about 4/5 full), its surface tilting as it sloshes
    const lv = (x: number) => -15 + (tilt * x) / 13;
    const oil = (c: Ctx) => {
      c.moveTo(-14, lv(-14));
      c.quadraticCurveTo(0, lv(0) + 0.9, 14, lv(14));
      c.lineTo(14, 12);
      c.lineTo(-14, 12);
      c.closePath();
    };
    ctx.save();
    ctx.beginPath();
    oil(ctx);
    ctx.fillStyle = radial(ctx, -4, -6, 22, [[0, SEED_HI], [0.45, SEED], [1, SEED_DK]], -5, -8);
    ctx.fill();
    ctx.restore();
    // surface: bright meniscus + darker underline
    line(ctx, [[-14, lv(-14)], [0, lv(0) + 0.45], [14, lv(14)]], 1.3, '#fffbe0', true, 0.95);
    line(ctx, [[-14, lv(-14) + 1.4], [0, lv(0) + 1.9], [14, lv(14) + 1.4]], 0.6, SEED_DK, true, 0.55);
    // a few bubbles rising
    for (const [bx, by, br] of [[-8.4, -2, 0.9], [-6.6, -9, 0.6], [9, -8, 0.7]] as [number, number, number][]) {
      const yy = by - ((f * 1.5) % 4);
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, bx, yy, br);
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.stroke();
      ctx.restore();
    }
    // cel shadow down the right side of the bottle (through plastic + oil)
    tint(ctx, (c) => {
      c.moveTo(14, -24);
      c.lineTo(9.6, -18);
      c.quadraticCurveTo(10.6, -4, 9.2, 7);
      c.lineTo(-10, 9.6);
      c.lineTo(-10, 14);
      c.lineTo(14, 14);
      c.closePath();
    }, '#b4891c', 0.42);
    // shoulder grip ridges (moulded plastic)
    for (const yy of [-17.6, -15.6]) line(ctx, [[-10.6, yy + 2.4], [0, yy], [10.6, yy + 2.4]], 0.55, '#c9c3a0', true, 0.8);
    // label: sky blue band with a sunflower, wavy top edge
    const label = (c: Ctx) => {
      c.moveTo(-14, 0);
      c.quadraticCurveTo(-7, -1.6, 0, -0.4);
      c.quadraticCurveTo(7, 0.8, 14, -0.8);
      c.lineTo(14, 7);
      c.quadraticCurveTo(0, 8.2, -14, 7);
      c.closePath();
    };
    ctx.save();
    ctx.beginPath();
    label(ctx);
    ctx.fillStyle = SKY;
    ctx.fill();
    ctx.restore();
    tint(ctx, (c) => ellipsePath(c, -6, 1.8, 7, 1.4, -0.05), '#d4f0ff', 0.6);
    tint(ctx, (c) => {
      c.moveTo(9.6, -2);
      c.quadraticCurveTo(10.2, 3, 9.2, 8);
      c.lineTo(14, 8);
      c.lineTo(14, -2);
      c.closePath();
    }, SKY_SH, 0.75);
    line(ctx, [[-14, 0], [-7, -1.6], [0, -0.4], [7, 0.8], [14, -0.8]], 0.7, '#2f6f9e', true, 0.85);
    line(ctx, [[-14, 7], [0, 8.2], [14, 7]], 0.7, '#2f6f9e', true, 0.85);
    // green hill stripe under the flower
    tint(ctx, (c) => {
      c.moveTo(-14, 6.8);
      c.quadraticCurveTo(-4, 3.4, 6, 5);
      c.quadraticCurveTo(10, 5.6, 14, 4.4);
      c.lineTo(14, 8);
      c.lineTo(-14, 8);
      c.closePath();
    }, '#5cb84a', 0.95);
    // plastic gloss: tall streak on the left + a ping on the shoulder
    tint(ctx, (c) => roundRectPath(c, -10.8, -10, 2.1, 17, 1), '#ffffff', 0.55);
    tint(ctx, (c) => ellipsePath(c, -8.6, -16.4, 1.8, 1, -0.6), '#ffffff', 0.9);
    tint(ctx, (c) => roundRectPath(c, 10.2, -9, 0.9, 7, 0.45), '#ffffff', 0.45);
  });
  // re-ink the silhouette (the clip ate the inner half of the outline)
  ctx.save();
  ctx.beginPath();
  oilBottlePath(ctx);
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  sunflower(ctx, 0.8, 3.4, 3.3);
  shape(ctx, (c) => ellipsePath(c, -3, 5.4, 1.6, 0.8, 0.5), { fill: '#3f9a3a', ink: 0.45, inkColor: '#1f5a22', shadow: 'none' });

  // neck ring + ribbed cap with a flip spout
  shape(ctx, (c) => roundRectPath(c, -5.6, -22.6, 11.2, 2.4, 1), { fill: OCAP, ink: 1.4, shadow: OCAP_SH, shadowOffset: [-1, -0.8] });
  shape(ctx, (c) => roundRectPath(c, -4.9, -28, 9.8, 5.6, [1.8, 1.8, 0.8, 0.8]), {
    fill: OCAP, ink: 1.6, shadow: OCAP_SH, shadowOffset: [-1.6, -1],
    gloss: [{ x: -3, y: -26.6, rx: 0.8, ry: 1.6, alpha: 0.7 }],
  });
  for (let i = -3; i <= 3; i += 1.5) line(ctx, [[i, -24.6], [i, -23]], 0.5, OCAP_SH, false, 0.85);
  shape(ctx, (c) => {
    c.moveTo(-1, -27.8);
    c.lineTo(3.4, -30);
    c.quadraticCurveTo(4.6, -29.6, 4.2, -28.4);
    c.lineTo(1.8, -27.2);
    c.closePath();
  }, { fill: OCAP, ink: 1.1, shadow: 'none' });

  // oil running down from the cap over the shoulder (animated drip)
  const runLen = [2.6, 3.4, 4.4, 3.2][f];
  inkLine(ctx, [[4.6, -21.4], [8, -19], [10.6, -15.6]], 1.4, SEED, true, 0.75);
  shape(ctx, (c) => dripPath(c, 10.7, -15.8, 1.8, runLen), { fill: SEED, ink: 0.75, shadow: 'none', gloss: [{ x: 10.4, y: -15.8 + runLen - 1.2, rx: 0.4, ry: 0.3, alpha: 0.9 }] });

  // "special offer" sticker slapped on the label (a red starburst, no text)
  ctx.save();
  ctx.translate(9.2, 1.8);
  ctx.rotate(-0.25);
  shape(ctx, (c) => {
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TAU, r = i % 2 ? 1.95 : 2.95;
      if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
  }, { fill: '#e8352e', ink: 0.7, shadow: '#b51f26', shadowOffset: [-0.5, -0.6] });
  shape(ctx, (c) => circlePath(c, 0, 0, 1.25), { fill: '#fff4d8', ink: 0, shadow: 'none' });
  ctx.restore();

  // greasy schemer: one eye narrowed, the other wide under a cocked brow
  eye(ctx, -2.4, -8.6, 2.9, { look: [0.45, 0.16], lid: 'angry-l', pupil: 0.56 });
  eye(ctx, 4.9, -9, 3.25, { look: [0.42, 0.14], lid: 'none', pupil: 0.48 });
  brow(ctx, -2.4, -12.4, 4.8, 0.5, 1.4);
  brow(ctx, 5.3, -14.6, 5, -0.12, 1.4);
  mouth(ctx, 2, -4.2, 8.8, 'grin', { teeth: true, tongue: false, open: 0.9 });
  line(ctx, [[6.4, -4.8], [7.4, -5.6]], 0.8, INK, false, 0.9);
  cheeks(ctx, [[-5.2, -5.2], [9, -5.6]], 1.6, 0.9, '#f08a3a', 0.4);
  // a bead of oil sweating off the temple
  const sy0 = -9 + [0, 0.5, 1, 0.5][f];
  shape(ctx, (c) => teardrop(c, -8.2, sy0, 1.05, 3.2), { fill: SEED_HI, ink: 0.6, shadow: SEED_DK, shadowOffset: [-0.4, -0.5], gloss: [{ x: -8.5, y: sy0 - 0.4, rx: 0.3, ry: 0.5, alpha: 0.95 }] });
  glint(ctx, 1.4, -13, 0.9, 0.45, -0.3, 0.9);

  // near arm: palm out, "best price, believe me"
  hoseArm(ctx, 11.8, -3.8, 15.4 + s * 0.5, -8 - Math.abs(s) * 0.8, { bend: 0.45, thick: 1.9, handR: 2.3 });
  ctx.restore();
}

enemySprite('olio', 40, 54, 38, drawOlio);

// ===========================================================================
// 3. LA FILANTE ABUSIVA — r14. A gooey blob of melted pizza cheese: toasted
//    blisters on top, reaching forward with long stretched cheese strings.
// ===========================================================================

const MELT = '#fff0c0';
const MELT_SH = '#efc163';
const MELT_HI = '#fffbea';
const BLISTER = '#e09a3c';
const BLISTER_DK = '#b06422';

function filanteBody(c: Ctx, sx: number, sy: number) {
  const P = (x: number, y: number): Pt => [x * sx, 13 - (13 - y) * sy];
  smoothPath(c, [
    P(-4, -15), P(3, -14.2), P(8.6, -10), P(11.4, -3.6), P(12, 3), P(14.2, 9.4), P(10.8, 12.8), P(5, 12.2),
    P(-0.6, 13.4), P(-7.4, 12.4), P(-13.4, 13), P(-18, 10.4), P(-17, 4.6), P(-16, -2.6), P(-12.6, -10), P(-8.6, -13.8),
  ], true, 0.5);
}

/** Point at t along the sagging centre line of strandPath(a, b, …, sag). */
function strandAt(a: Pt, b: Pt, sag: number, t: number): Pt {
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag];
  const cx = 2 * m[0] - (a[0] + b[0]) / 2, cy = 2 * m[1] - (a[1] + b[1]) / 2;
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]];
}

/** A melted "hand": lumpy goo blob with three drooping fingers pointing forward. */
function gooHand(c: Ctx, x: number, y: number, k: number) {
  smoothPath(c, [
    [x - 2.6, y - 1.6], [x - 0.2, y - 2.9], [x + 2.2, y - 2.4], [x + 3.8, y - 1.6 + k * 0.3], [x + 4.2, y - 0.4],
    [x + 2.8, y + 0.2], [x + 3.6, y + 1.4], [x + 2.4, y + 2.6 + k * 0.4], [x + 0.6, y + 1.8], [x - 0.4, y + 3.4],
    [x - 1.8, y + 2.2], [x - 2.9, y + 0.6],
  ], true, 0.5);
}

function drawFilante(ctx: Ctx, f: number) {
  const { s, c: co } = cyc(f);
  const sx = 1 + s * 0.035, sy = 1 - s * 0.03;
  const body = (c: Ctx) => filanteBody(c, sx, sy);
  const reach = 1 + co * 0.12; // the arms stretch (thinner necks) and relax
  const B1: Pt = [8.4, -7.4], H1: Pt = [16.8 + co * 1.2, -12.2 + s * 0.8];
  const B2: Pt = [11, 2.6], H2: Pt = [18.2 + co * 1, 0.8 - s * 0.6];
  const SAG1 = -0.8, SAG2 = 1.1;
  const T0: Pt = [-15.6, 8], TAIL: Pt = [-20.4 - co * 0.6, 10.8];

  // loose cheese strings hanging in a sag under each arm (drawn behind the arms), outlined in
  // a warm melt tone rather than ink so they read as goo, not wire
  const goo = (pts: Pt[], w: number) => {
    line(ctx, pts, w + 0.9, '#b97a30', true, 0.8);
    line(ctx, pts, w, MELT, true);
  };
  const sagString = (p: Pt, q: Pt, sag: number, w: number) => goo([p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + sag], q], w);
  sagString([B1[0] + 1.2, B1[1] + 2.4], [H1[0] - 1.8, H1[1] + 2], 3.4 + s * 0.5, 0.8);
  sagString([B1[0] + 2.6, B1[1] + 1.8], [H1[0] - 0.4, H1[1] + 2.6], 5 + s * 0.6, 0.6);
  sagString([B2[0] + 1.2, B2[1] + 2.4], [H2[0] - 1.4, H2[1] + 2.4], 3.2 - s * 0.4, 0.8);
  // a string hanging off the lower hand with a drop at the end
  const hang = (x: number, y: number, len: number) => {
    goo([[x, y], [x + 0.5, y + len * 0.5], [x + 0.2, y + len]], 0.6);
    shape(ctx, (c) => teardrop(c, x + 0.2, y + len + 0.6, 0.95, 2.2), { fill: MELT, ink: 0.5, inkColor: '#b97a30', shadow: 'none' });
  };
  hang(H2[0] + 1.6, H2[1] + 2.8, 4 + s * 0.8);

  // arms + hands + trailing goo + drips share one gooey silhouette with the body
  const arms = (c: Ctx) => {
    strandPath(c, B1, H1, 6.4, 3.2 / reach, 3.6, SAG1);
    strandPath(c, B2, H2, 6.4, 3.2 / reach, 3.6, SAG2);
    strandPath(c, T0, TAIL, 3.6, 1.4, 2.2, 1);
  };
  const hands = (c: Ctx) => {
    gooHand(c, H1[0], H1[1], s);
    gooHand(c, H2[0], H2[1], -s);
    ellipsePath(c, TAIL[0], TAIL[1], 2.6, 1.9);
  };
  const drips = (c: Ctx) => {
    dripPath(c, -9.6 * sx, 12.2, 2.4, 1.8 + (s + 1) * 0.4);
    dripPath(c, 3.8 * sx, 12, 2, 1.4 + (1 - s) * 0.4);
  };
  group(ctx, [
    { build: arms, style: { fill: MELT, shadow: MELT_SH, shadowOffset: [-0.9, -1.1] } },
    { build: hands, style: { fill: MELT, shadow: MELT_SH, shadowOffset: [-1.1, -1.2], gloss: [{ x: H1[0] - 0.6, y: H1[1] - 1.4, rx: 1, ry: 0.5, rot: -0.3, alpha: 0.85 }, { x: H2[0] - 0.6, y: H2[1] - 1.4, rx: 1, ry: 0.5, rot: -0.3, alpha: 0.85 }] } },
    { build: drips, style: { fill: MELT_SH, shadow: 'none' } },
    {
      build: body,
      style: {
        fill: radial(ctx, -6, -8, 26, [[0, MELT_HI], [0.42, MELT], [1, '#f7d585']], -7, -10),
        shadow: MELT_SH, shadowOffset: [-2.8, -2.6],
        gloss: [{ x: -7.6, y: -10.6, rx: 3.4, ry: 1.6, rot: -0.55, alpha: 0.75 }],
      },
    },
  ], 2.4);
  // highlight along the top of each arm (glossy melted cheese)
  for (const [a, b, sag] of [[B1, H1, SAG1], [B2, H2, SAG2]] as [Pt, Pt, number][]) {
    const p0 = strandAt(a, b, sag, 0.18), p1 = strandAt(a, b, sag, 0.5), p2 = strandAt(a, b, sag, 0.8);
    line(ctx, [[p0[0], p0[1] - 1.5], [p1[0], p1[1] - 0.9], [p2[0], p2[1] - 1.1]], 0.6, '#ffffff', true, 0.8);
  }

  clipTo(ctx, body, () => {
    // warm melt pooling at the base + toasted blisters on the top
    tint(ctx, (c) => ellipsePath(c, -2, 13.6, 19, 4.6), MELT_SH, 0.6);
    const R = rng(31);
    for (const [bx, by, br] of [[-8, -10.6, 2.5], [0.4, -12.6, 1.7], [-12.4, -3.4, 1.6], [6.2, -10.4, 1.3], [-4.4, -7, 0.9], [-11, 5, 1.1], [-14.6, 2, 0.8]] as [number, number, number][]) {
      const k = 0.85 + R() * 0.3;
      shape(ctx, (c) => ellipsePath(c, bx, by, br * k, br * 0.72, R() * 0.6 - 0.3), {
        fill: BLISTER, ink: 0, shadow: BLISTER_DK, shadowOffset: [br * 0.35, br * 0.3],
      });
      glint(ctx, bx - br * 0.35, by - br * 0.3, br * 0.32, br * 0.18, -0.4, 0.75);
    }
    // little oil beads floating on the melt
    speckle(ctx, 0, -2, 10, 9, 7, '#f5b640', 0.55, 9, 0.5);
  });

  // face: wide-eyed and greedy, mouth stretched with strings of cheese
  eyePair(ctx, 1.2, -5.6, 3.3, { sp: 8.6, look: [0.38, 0.1], near: 1.08, brow: 0.42, browDy: 1.5, browTh: 1.5 });
  const mx = 2.4, my = 1.6;
  const mo = (c: Ctx) => {
    c.moveTo(mx - 5, my - 1);
    c.quadraticCurveTo(mx, my + 0.2, mx + 5, my - 1.4);
    c.quadraticCurveTo(mx + 0.6, my + 6.6 + s * 0.4, mx - 5, my - 1);
    c.closePath();
  };
  shape(ctx, mo, { fill: '#5b1320', ink: 1.1, shadow: 'none' });
  clipTo(ctx, mo, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.fillRect(mx - 6, my - 3, 12, 2.3);
    ctx.beginPath();
    ellipsePath(ctx, mx + 0.8, my + 4.6, 2.6, 1.4);
    ctx.fillStyle = '#e8616e';
    ctx.fill();
    // cheese strings stretched between the jaws
    for (const [x0, bow] of [[mx - 2.4, -0.7], [mx + 0.8, 0.8], [mx + 3.2, 0.5]] as Pt[]) {
      line(ctx, [[x0, my - 1], [x0 + bow, my + 2.2], [x0 + 0.1, my + 6]], 0.9, '#ffe08a', true, 1);
    }
  });
  cheeks(ctx, [[-6.2, -1.8], [8.6, -2.2]], 1.8, 1, '#ff9a5a', 0.4);
}

enemySprite('filante', 52, 42, 26, (ctx, f) => {
  ctx.save();
  ctx.translate(0, -0.8);
  ctx.scale(0.9, 0.9);
  drawFilante(ctx, f);
  ctx.restore();
});

// ===========================================================================
// 4. CHEDDAR ARANCIONE — r13. A wobbly, plasticky, bright-orange processed
//    slice; top-right corner curling over, the cellophane half peeled off.
// ===========================================================================

const CHED = '#ff9a1f';
const CHED_SH = '#e4670f';
const CHED_EDGE = '#c9510b';
const CHED_HI = '#ffd27a';

/** Wobbly square slice outline with the top-right corner folded away (fold line from (L1) to (L2)). */
function slicePts(f: number): Pt[] {
  const w = (t: number, k: number) => Math.sin(t * Math.PI * 2 + (f / 4) * TAU + k) * 1.05;
  const pts: Pt[] = [];
  const X0 = -13, X1 = 13, Y0 = -21, Y1 = 5;
  // top edge (left → fold)
  for (let i = 0; i <= 3; i++) { const t = i / 4; pts.push([X0 + t * (X1 - X0), Y0 + w(t, 0)]); }
  pts.push([5.6, -21 + w(0.72, 0) * 0.4]);
  // fold line down to the right edge
  pts.push([13, -13.2]);
  // right edge
  for (let i = 1; i <= 3; i++) { const t = 0.32 + (i / 3) * 0.6; pts.push([X1 + w(t, 1.5), Y0 + t * (Y1 - Y0)]); }
  pts.push([X1 - 0.6, Y1 - 0.4]);
  // bottom edge
  for (let i = 1; i <= 3; i++) { const t = i / 4; pts.push([X1 - t * (X1 - X0), Y1 + w(t, 3)]); }
  // bottom-left corner lifts and curls back a little
  pts.push([X0 + 0.4, Y1 - 0.8 - [0, 0.6, 1, 0.6][f]]);
  for (let i = 1; i <= 3; i++) { const t = i / 4; pts.push([X0 + w(t, 4.6), Y1 - t * (Y1 - Y0)]); }
  pts.push([X0 + 0.6, Y0 + 0.5]);
  return pts;
}

function drawCheddar(ctx: Ctx, f: number) {
  const { s } = cyc(f);
  const pts = slicePts(f);
  const slab = (c: Ctx) => smoothPath(c, pts, true, 0.32);
  const edge = (c: Ctx) => {
    c.save();
    c.translate(0.9, 1.2);
    smoothPath(c, pts, true, 0.32);
    c.restore();
  };

  // far arm: fist up, ready to throw hands
  hoseArm(ctx, -11.6, -7.6, -16.4 - s * 0.5, -13 + Math.abs(s) * 1.2, { bend: -0.35, thick: 1.9, handR: 2.5 });

  legs(ctx, 0, 5, f, { len: 6, spread: 10, thick: 2.6, color: LIMB, shoe: SHOE, stride: 4.6 });

  // the slice sways a little with each step
  ctx.save();
  ctx.rotate(0.05 * s);
  // the bottom edge going soft: two thick drips (it melts on everything)
  const drips = (c: Ctx) => {
    dripPath(c, -5.6, 5, 2.8, 3.8 + [0, 0.6, 1.1, 0.6][f]);
    dripPath(c, 7, 5, 2.2, 2.8 + [0.7, 1, 0.4, 0][f]);
  };
  // drips + thin darker edge (the slice's thickness) + the face of the slice, one silhouette
  group(ctx, [
    { build: drips, style: { fill: CHED_SH, shadow: 'none', gloss: [{ x: -6.3, y: 7.6 + [0, 0.6, 1.1, 0.6][f], rx: 0.45, ry: 0.7, alpha: 0.75 }] } },
    { build: edge, style: { fill: CHED_EDGE, shadow: 'none' } },
    {
      build: slab,
      style: {
        fill: radial(ctx, -6, -14, 30, [[0, '#ffbd52'], [0.45, CHED], [1, '#f7820f']], -7, -15),
        shadow: CHED_SH, shadowOffset: [-2.4, -2.4],
        gloss: [{ x: -8.6, y: -17.4, rx: 3.2, ry: 1.2, rot: -0.15, alpha: 0.55 }],
      },
    },
  ], 2.1);
  clipTo(ctx, slab, () => {
    // plasticky sheen: a long diagonal glare + a faint second one
    tint(ctx, (c) => {
      c.moveTo(-15, -6);
      c.lineTo(-9, -22);
      c.lineTo(-6.6, -22);
      c.lineTo(-12.6, -6);
      c.closePath();
    }, '#ffffff', 0.22);
    tint(ctx, (c) => {
      c.moveTo(4, 7);
      c.lineTo(10.4, -10);
      c.lineTo(11.4, -10);
      c.lineTo(5, 7);
      c.closePath();
    }, '#ffffff', 0.16);
    // the "processed" smoothness: a few tiny pin dots
    speckle(ctx, -2, -6, 10, 10, 10, '#ffd690', 0.26, 17, 0.7);
  });

  // shadow cast by the curled corner + the curl itself (paler underside)
  const tip: Pt = [7.4 + [0, 0.5, 0.9, 0.5][f], -14.4 + [0, 0.4, 0.8, 0.4][f]];
  tint(ctx, (c) => {
    c.moveTo(5.6, -20.6);
    c.lineTo(13, -13.2);
    c.lineTo(tip[0] + 1.2, tip[1] + 1.6);
    c.closePath();
  }, CHED_EDGE, 0.45);
  shape(ctx, (c) => {
    c.moveTo(5.2, -21.2);
    c.quadraticCurveTo(9.6, -19.6, 13.4, -13);
    c.quadraticCurveTo(10.6, -13.6, tip[0], tip[1]);
    c.quadraticCurveTo(6.8, -17.6, 5.2, -21.2);
    c.closePath();
  }, { fill: CHED_HI, ink: 1.3, shadow: '#f6a640', shadowOffset: [1, 1.2], gloss: [{ x: 8.6, y: -17.6, rx: 1.6, ry: 0.5, rot: 0.8, alpha: 0.7 }] });

  // face: loud, cocky "say cheese"
  eyePair(ctx, 1.4, -12, 3.3, { sp: 8.8, look: [0.34, 0.12], near: 1.08, brow: 0.46, browDy: 1.5, browTh: 1.6 });
  mouth(ctx, 2, -4.6, 10, 'grin', { teeth: true, open: 1.05 });
  cheeks(ctx, [[-4.2, -6.8], [9.6, -7]], 1.9, 1, '#e8401a', 0.35);
  ctx.restore();

  // near arm: jab forward
  hoseArm(ctx, 12, -5.4, 16.4 + s * 1, -3.8 - s * 0.8, { bend: 0.3, thick: 1.9, handR: 2.5 });
}

enemySprite('cheddar', 44, 46, 30, drawCheddar);

// ===========================================================================
// 5. SALSA BARBECUE — r14. A squat dark-brown sauce bottle in a tan cowboy
//    hat; the nozzle pokes through the crown and smokes like a gun barrel.
//    Nozzle tip at (+4,−30): the shots leave from there.
// ===========================================================================

const BBQ = '#6e2e16';
const BBQ_SH = '#401509';
const BBQ_HI = '#b5643a';
const SAUCE = '#7a3015';
const HAT = '#d39a56';
const HAT_SH = '#a26a32';
const HAT_BAND = '#6a3418';
const BANDANA = '#d8362e';
const BANDANA_SH = '#9e1f22';
const BOOT = '#8a4a24';
const BOOT_SH = '#5c2c14';

function bbqBottlePath(c: Ctx) {
  c.moveTo(-5.2, -18.6);
  c.bezierCurveTo(-10.6, -17.4, -12.6, -14.2, -12.6, -9);
  c.lineTo(-12.8, 4.4);
  c.quadraticCurveTo(-12.8, 9.4, -8, 9.4);
  c.lineTo(8, 9.4);
  c.quadraticCurveTo(12.8, 9.4, 12.8, 4.4);
  c.lineTo(12.6, -9);
  c.bezierCurveTo(12.6, -14.2, 10.6, -17.4, 5.2, -18.6);
  c.closePath();
}

/** Stubby legs in cowboy boots (pointed toe forward, heel, little spur). */
function boots(ctx: Ctx, x: number, y: number, f: number, len: number, spread: number, stride: number) {
  const phase = ((f % 4) / 4) * TAU;
  for (const side of [-1, 1]) {
    const sn = Math.sin(phase + (side < 0 ? 0 : Math.PI));
    const lift = Math.max(0, -Math.cos(phase + (side < 0 ? 0 : Math.PI))) * 2;
    const fx = x + side * spread * 0.5 + sn * stride * 0.5;
    const fy = y + len - lift;
    inkLine(ctx, [[x + side * spread * 0.35, y], [fx, fy - 3]], 2.8, LIMB, false, 1.15);
    // shaft + foot with a pointed toe, one silhouette
    shape(ctx, (c) => {
      c.moveTo(fx - 2.2, fy - 4.6);
      c.lineTo(fx + 1.8, fy - 4.6);
      c.lineTo(fx + 1.9, fy - 1.6);
      c.quadraticCurveTo(fx + 4.4, fy - 1.4, fx + 5, fy + 0.8);
      c.lineTo(fx - 0.6, fy + 0.8);
      c.lineTo(fx - 0.9, fy + 1.9);
      c.lineTo(fx - 2.6, fy + 1.9);
      c.closePath();
    }, { fill: BOOT, ink: 1.1, shadow: BOOT_SH, shadowOffset: [-0.8, -0.8], gloss: [{ x: fx - 1, y: fy - 3.2, rx: 0.5, ry: 1, alpha: 0.45 }] });
    line(ctx, [[fx - 2, fy - 3.4], [fx + 1.6, fy - 3.4]], 0.5, '#e6b06a', false, 0.9);
    // spur
    shape(ctx, (c) => circlePath(c, fx - 3.3, fy + 0.4, 0.75), { fill: '#ffd447', ink: 0.5, shadow: 'none' });
  }
}

function drawBbq(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);

  // far arm akimbo (hand on hip)
  hoseArm(ctx, -11.4, -6, -12.6, 2.2, { bend: -0.65, thick: 1.9, handR: 2.4 });

  boots(ctx, 0, 6.6, f, 5.6, 10.4, 4.4);

  // bottle
  shape(ctx, bbqBottlePath, {
    fill: BBQ, shadow: BBQ_SH, ink: 2.1, shadowOffset: [-3, -1.8], rim: BBQ_HI,
    gloss: [
      { x: -8.6, y: -4, rx: 1.3, ry: 6.8, rot: 0.02, alpha: 0.42 },
      { x: -8.2, y: -13.2, rx: 1.4, ry: 0.9, rot: -0.6, alpha: 0.75 },
      { x: 9.6, y: 1, rx: 0.5, ry: 3.2, alpha: 0.3 },
    ],
  });
  clipTo(ctx, bbqBottlePath, () => {
    // shadow under the hat brim
    tint(ctx, (c) => {
      c.moveTo(-14, -20);
      c.lineTo(14, -20);
      c.lineTo(14, -14);
      c.quadraticCurveTo(1, -11.6, -14, -14.4);
      c.closePath();
    }, '#200a04', 0.45);
    // smoky dark sauce streak down the far side
    speckle(ctx, 4, 2, 7, 6, 6, '#8e3e1c', 0.6, 23, 0.5);
  });

  // bandana tied round the waist, knot at the back, triangle at the front
  const band = (c: Ctx) => {
    c.moveTo(-13, 0.6);
    c.quadraticCurveTo(0, 2.6, 13, 0.2);
    c.lineTo(13, 3.6);
    c.quadraticCurveTo(0, 5.8, -13, 3.8);
    c.closePath();
  };
  clipTo(ctx, bbqBottlePath, () => {
    ctx.save();
    ctx.beginPath();
    band(ctx);
    ctx.fillStyle = BANDANA;
    ctx.fill();
    ctx.restore();
    tint(ctx, (c) => {
      c.moveTo(13, 0);
      c.lineTo(8.6, 1.4);
      c.lineTo(8.6, 5);
      c.lineTo(13, 4);
      c.closePath();
    }, BANDANA_SH, 0.8);
  });
  const tri = (c: Ctx) => {
    c.moveTo(-3.2, 3);
    c.lineTo(8.2, 2.6);
    c.quadraticCurveTo(4.8, 6, 2.6, 8.8 + s * 0.3);
    c.quadraticCurveTo(-0.8, 5.6, -3.2, 3);
    c.closePath();
  };
  shape(ctx, tri, { fill: BANDANA, ink: 1.2, shadow: BANDANA_SH, shadowOffset: [-1, -1] });
  for (const [dx, dy] of [[-1.4, 1.8], [2.2, 2.6], [6, 1.6], [-8, 2.2], [-11, 1.6], [10.6, 1.2], [1.6, 5.4], [4.2, 4.6]] as Pt[]) {
    shape(ctx, (c) => circlePath(c, dx, dy, 0.45), { fill: '#fff3e0', ink: 0, shadow: 'none' });
  }
  // knot tails flapping behind
  inkLine(ctx, [[-12.4, 2.2], [-15.4, 3.6 + s * 0.6], [-17, 5.6 + s]], 1.6, BANDANA, true, 0.85);
  inkLine(ctx, [[-12.4, 2.6], [-15, 6.2], [-15.6, 8.4 - s * 0.6]], 1.4, BANDANA_SH, true, 0.85);

  // face (in the brim's shade): mean squint, gold tooth, a stalk of straw
  eyePair(ctx, 1.8, -9.6, 3.1, { sp: 8.2, look: [0.4, 0.06], near: 1.06, brow: 0.5, browDy: 1.35, browTh: 1.55, browCol: '#1a0a06', squash: 0.86 });
  mouth(ctx, 2.6, -3.8, 8.4, 'grin', { teeth: true, tongue: false, open: 0.85 });
  shape(ctx, (c) => roundRectPath(c, 3.1, -3.95, 1.7, 1.5, 0.35), { fill: '#ffd447', ink: 0.35, shadow: 'none', gloss: [{ x: 3.6, y: -3.6, rx: 0.35, ry: 0.25, alpha: 0.9 }] });
  inkLine(ctx, [[6.4, -4], [9.6, -6.2 + s * 0.3], [12.4, -7.6 + s * 0.5]], 0.75, '#f2cf62', false, 0.5);

  // cowboy hat: brim curled up at the sides, dented crown, nozzle poking through the dent
  const crown = (c: Ctx) => {
    c.moveTo(-7.4, -19.4);
    c.quadraticCurveTo(-8.6, -24.6, -6.2, -27.2);
    c.quadraticCurveTo(-3.6, -28.4, -1.2, -26.6);
    c.quadraticCurveTo(1.6, -25.6, 3.6, -26.4);
    c.quadraticCurveTo(7.2, -28.2, 8.8, -25.4);
    c.quadraticCurveTo(10, -22.4, 9.4, -19.4);
    c.quadraticCurveTo(1, -18, -7.4, -19.4);
    c.closePath();
  };
  const brim = (c: Ctx) => {
    c.moveTo(-15.6, -23.2);
    c.quadraticCurveTo(-15, -18.6, -10.4, -17.4);
    c.quadraticCurveTo(1, -14.8, 12.6, -17.6);
    c.quadraticCurveTo(17, -18.6, 17.8, -23.6);
    c.quadraticCurveTo(14, -19.8, 9.4, -20.8);
    c.quadraticCurveTo(1, -21.8, -7.6, -20.8);
    c.quadraticCurveTo(-12.4, -20, -15.6, -23.2);
    c.closePath();
  };
  group(ctx, [
    { build: brim, style: { fill: HAT, shadow: HAT_SH, shadowOffset: [-1.6, -1.8], gloss: [{ x: -10.4, y: -19.4, rx: 2.6, ry: 0.7, rot: 0.3, alpha: 0.45 }] } },
    { build: crown, style: { fill: HAT, shadow: HAT_SH, shadowOffset: [-2.2, -1.4], gloss: [{ x: -5, y: -25, rx: 0.9, ry: 1.8, rot: 0.3, alpha: 0.5 }] } },
  ], 1.9);
  // crown crease + hat band with a little concho
  line(ctx, [[-2.8, -26.6], [-1.2, -23.4], [0.6, -22]], 0.6, HAT_SH, true, 0.85);
  clipTo(ctx, crown, () => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-9, -22.4);
    ctx.quadraticCurveTo(1, -20.8, 11, -22.6);
    ctx.lineTo(11, -18);
    ctx.lineTo(-9, -18);
    ctx.closePath();
    ctx.fillStyle = HAT_BAND;
    ctx.fill();
    ctx.restore();
  });
  shape(ctx, (c) => circlePath(c, -4.4, -20.6, 0.9), { fill: '#e8e2d4', ink: 0.5, shadow: 'none' });
  // sauce oozing from the hole, dribbling down the crown
  shape(ctx, (c) => {
    c.moveTo(0.6, -25.2);
    c.quadraticCurveTo(3.4, -26.8, 6.6, -25.4);
    c.quadraticCurveTo(6.2, -24.2, 5.4, -24.6);
    c.lineTo(5.3, -23.2);
    c.quadraticCurveTo(4.8, -21.6 + [0, 0.6, 1.2, 0.4][f], 4.3, -23.2);
    c.lineTo(4.1, -24.4);
    c.quadraticCurveTo(2.4, -24.2, 0.6, -25.2);
    c.closePath();
  }, { fill: SAUCE, ink: 0.8, shadow: 'none', gloss: [{ x: 2.4, y: -25.4, rx: 0.8, ry: 0.3, alpha: 0.6 }] });
  // the nozzle, poking out through the hole in the crown (tip at +4,−30: the muzzle)
  shape(ctx, (c) => ellipsePath(c, 3.5, -25.4, 2.7, 0.95), { fill: '#2a140c', ink: 0.9, shadow: 'none' });
  shape(ctx, (c) => {
    c.moveTo(1.2, -25.4);
    c.quadraticCurveTo(2.4, -27.8, 3.2, -29.6);
    c.quadraticCurveTo(4, -30.8, 4.8, -29.6);
    c.quadraticCurveTo(5.4, -27.8, 5.9, -25.4);
    c.quadraticCurveTo(3.5, -24.6, 1.2, -25.4);
    c.closePath();
  }, { fill: '#5a3222', ink: 1.2, shadow: '#311810', shadowOffset: [-1.1, 0], gloss: [{ x: 2.9, y: -27.4, rx: 0.45, ry: 1.6, rot: 0.4, alpha: 0.7 }] });
  // a smear on the nozzle tip
  shape(ctx, (c) => ellipsePath(c, 4.1, -29.9, 1, 0.65), { fill: SAUCE, ink: 0.55, shadow: 'none', gloss: [{ x: 3.8, y: -30.1, rx: 0.35, ry: 0.2, alpha: 0.8 }] });

  // smoking barrel
  steamCurl(ctx, 4.2, -31.2, 6.2, ph, 1.3, 0.6, '#d9d2cc');

  // near arm: gunslinger's hand hovering by the hip
  hoseArm(ctx, 11.6, -5, 15.6 + s * 0.6, 1.4 - Math.abs(s) * 0.6, { bend: 0.45, thick: 1.9, handR: 2.4 });
}

enemySprite('bbq', 44, 56, 40, drawBbq);

// ===========================================================================
// FX — seed-oil slick: pale, cold, cheap (vs the chef's golden olive oil)
// ===========================================================================

fx('fx.seedoil_puddle', 66, 48, (ctx) => {
  puddle(ctx, 27, 17, 41, { base: '#f4e98a', alpha: 0.86, rim: '#b3a032', glossA: 1, satellites: 4 });
  // a cold, thin, watery look: pale wash in the middle + a bluish-white chemical sheen
  tint(ctx, (c) => ellipsePath(c, -4, 0, 15, 8, -0.1), '#fffbd8', 0.4);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = '#eaf8ff';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(1, 2, 17, 9, -0.06, Math.PI * 0.15, Math.PI * 0.75);
  ctx.stroke();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#c6e8ff';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(1, 2, 13, 6.4, -0.06, Math.PI * 0.2, Math.PI * 0.7);
  ctx.stroke();
  ctx.restore();
  // two floating sunflower-seed husks (dark with pale stripes)
  for (const [x, y, a] of [[-11, -2, 0.5], [11, 5, -0.4]] as [number, number, number][]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    shape(ctx, (c) => {
      c.moveTo(-2.4, 0);
      c.quadraticCurveTo(-1, -1.4, 2.4, -0.2);
      c.quadraticCurveTo(-1, 1.4, -2.4, 0);
      c.closePath();
    }, { fill: '#3a3632', ink: 0.5, inkColor: '#1c1a18', shadow: 'none' });
    line(ctx, [[-1.6, -0.15], [1.8, -0.2]], 0.35, '#e8e2d0', false, 0.9);
    ctx.restore();
  }
  // little bubbles
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.55;
  for (const [x, y, r] of [[4, -6, 1.3], [6.4, -4.6, 0.8], [-16, 6, 1], [18, 1, 0.9], [-5, 8, 0.7]] as [number, number, number][]) {
    ctx.beginPath();
    circlePath(ctx, x, y, r);
    ctx.stroke();
  }
  ctx.restore();
  glint(ctx, -9, -7, 7, 1.6, -0.1, 0.9);
  glint(ctx, 3, -10, 2.2, 0.8, -0.1, 0.7);
}, { res: 2 });

// ===========================================================================
// PROJECTILE — a blob of BBQ sauce (the bottle's shot)
// ===========================================================================

danger('proj.e_bbq', 12, (ctx) => {
  // drip tail (points back = left)
  shape(ctx, (c) => {
    c.moveTo(-3, -2.6);
    c.quadraticCurveTo(-7, -1.6, -8.6, 0.8);
    c.quadraticCurveTo(-7.2, 2.4, -3, 2.6);
    c.closePath();
  }, { fill: '#6a2810', ink: 1, shadow: 'none', gloss: [{ x: -6, y: -0.6, rx: 1, ry: 0.35, rot: 0.2, alpha: 0.5 }] });
  sauceBlob(ctx, 6, '#9c3e1a', '#4e180a', 19);
  // smoky dark rim on the trailing side + pepper flecks
  clipTo(ctx, (c) => circlePath(c, 0, 0, 6), () => {
    tint(ctx, (c) => ellipsePath(c, -5.6, 1.6, 3.4, 4.6, 0.4), '#2a0c04', 0.35);
  });
  ctx.save();
  ctx.fillStyle = 'rgba(30,10,4,0.85)';
  for (const [x, y, r] of [[-4.4, 2.6, 0.45], [-2.8, 4.2, 0.4], [-6.4, 0.2, 0.35]] as [number, number, number][]) {
    ctx.beginPath();
    ellipsePath(ctx, x, y, r * 1.3, r, 0.5);
    ctx.fill();
  }
  ctx.restore();
  glint(ctx, -2, -2.6, 1.5, 0.75, -0.7, 0.9);
  glint(ctx, 3, 2.4, 0.7, 0.35, -0.7, 0.5);
});
