/**
 * IL MENÙ — ENEMIES B: the cheap stand-ins and the foreign toppings.
 * (Imported before placeholders.ts, so every id defined here replaces its placeholder.)
 *
 *   id                  box w×h   anchor (ax,ay)  radius  behaviour   look
 *   enemy.anacardo      30×26     (15,15)         8       swarm       beige roasted cashew bent into a hunched "C" (deep notch
 *                                                                     under the chin, lower lobe hooking forward, salt grains)
 *                                                                     in a black domino mask: the "bootleg" pine nut
 *   enemy.olio          44×54     (22,38)         13      puddler     squat clear PET bottle, its top third empty plastic and
 *                                                                     pale seed oil sloshing below; cheap red label band with a
 *                                                                     sunflower and a yellow cut-price tag (no text), orange
 *                                                                     flip cap, oil running down its shoulder, greasy grin
 *   enemy.filante       52×37     (26,20)         14      slither     golden pizza-mozzarella blob with leopard blisters, reaching
 *                                                                     forward with necked goo arms and long free strands pulled
 *                                                                     between body and hands (the cheese pull), strings
 *                                                                     stretched across its open mouth; no legs, it oozes
 *                                                                     (painted at 0.9 scale)
 *   enemy.cheddar       48×46     (24,30)         13      strafe      bright-orange glossy processed slice with a thin edge,
 *                                                                     wobbling outline, top-right corner curled over, its
 *                                                                     cellophane peeling off the bottom-left corner, two glossy
 *                                                                     drips between/outside the legs; cocky grin
 *   enemy.bbq           44×56     (22,40)         14      ranged      squat amber-brown pear-shaped squeeze bottle in a tan cowboy
 *                                                                     hat, mean face on an oval kraft label (flame icon, no
 *                                                                     text); gunmetal nozzle poking through the crown (tip at
 *                                                                     +4,−30, where the shots leave), smoking like a gun barrel;
 *                                                                     red bandana, gold tooth, straw, boots with spurs
 *
 *   fx.seedoil_puddle   66×48     (33,24)  1 frame, res 2: pale, cold lemon-yellow seed-oil slick with a khaki rim, a
 *                                          bluish/lilac chemical sheen, one sunflower husk and a stray kernel (vs the
 *                                          chef's golden fx.oil_slick and the butter puddle)
 *   proj.e_bbq          24×24     (12,12)  1 frame: glossy mahogany-orange blob of BBQ sauce, lit through on the lower
 *                                          right, pepper flecks + drip tail (DANGER style)
 *
 * Anchor = centre of the collision circle; feet/base at y ≈ +radius; facing right; no ground shadow.
 */
import {
  Ctx, Pt, INK, shape, group, line, inkLine, ellipsePath, circlePath, roundRectPath, smoothPath, starPath, speckle, glint,
  legs, eye, brow, mouth, rng,
} from '../painter';
import { TAU, LIMB, enemySprite, cyc, dripPath, hoseArm, eyePair, cheeks, clipTo, steamCurl } from './enemies_b_kit';
import { danger, sauceBlob } from './projectiles';
import { fx, puddle, puddlePts } from './fx';
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
 * (and bowing sideways by `bow`) — closed path; the ends are meant to be buried in a blob.
 */
function strandPath(c: Ctx, a: Pt, b: Pt, wa: number, wm: number, wb: number, sag: number, bow = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mx = (a[0] + b[0]) / 2 + bow, my = (a[1] + b[1]) / 2 + sag;
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
// 1. ANACARDO ABUSIVO — r8. A roasted cashew in a domino mask: it sneaks into
//    the pesto in place of the pine nuts. Comes in clumps.
// ===========================================================================

const CASHEW = '#efd6a2';
const CASHEW_SH = '#cf9f5e';
const CASHEW_HI = '#fff3d6';
const MASK = '#2c2836';

/**
 * Crescent silhouette: a hunched "C" opening forward — fat upper lobe = the head, a deep notch under
 * the chin, the slimmer lower lobe hooking forward, the convex back behind.
 */
function cashewPath(c: Ctx) {
  smoothPath(c, [
    [-0.6, -12], [4.2, -11.4], [7.8, -8.4], [8.8, -4.6], [7.2, -1.4], [3.6, -0.2], [2.2, 1.6], [4.4, 3.4],
    [7.6, 4.4], [7.2, 6.8], [2.6, 8.4], [-2.6, 7.8], [-7, 4.8], [-8.8, -0.6], [-8, -6.6], [-4.8, -10.6],
  ], true, 0.5);
}

/** Domino mask round both eyes (no tails); its V-shaped top edge doubles as the angry brows. */
function dominoPath(c: Ctx) {
  smoothPath(c, [
    [-3.6, -9.8], [0.4, -10.2], [3.3, -8.2], [6.2, -10.8], [9.4, -10.4], [9.4, -6.4], [6.6, -3.2], [3.4, -4.6],
    [0.4, -3.2], [-2.4, -5.2],
  ], true, 0.45);
}

function drawAnacardo(ctx: Ctx, f: number) {
  const { s } = cyc(f);

  legs(ctx, 0.6, 4.4, f, { len: 2.7, spread: 5.4, thick: 2, color: '#5a3820', shoe: SHOE, stride: 3 });

  ctx.save();
  ctx.translate(0, 0.1);
  ctx.scale(0.93, 0.93);
  // far fist, tucked behind the back (cashew-coloured, so it never reads as a stray white dot)
  hoseArm(ctx, -6.6, 1.6, -9.4 - s * 0.4, 3.2, { thick: 1.2, handR: 1.6, ink: 0.85, bend: -0.3, hand: CASHEW_SH });

  // the nut
  shape(ctx, cashewPath, {
    fill: radial(ctx, -2, -6, 14, [[0, CASHEW_HI], [0.4, CASHEW], [1, '#e2b97a']], -2.5, -7),
    shadow: CASHEW_SH, ink: 1.6, shadowOffset: [-2, -1.9],
    gloss: [{ x: -3.4, y: -8.6, rx: 2.2, ry: 1, rot: -0.6, alpha: 0.6 }, { x: -7, y: -1.4, rx: 0.6, ry: 2, rot: 0.1, alpha: 0.35 }],
  });
  clipTo(ctx, cashewPath, () => {
    // toasty tips + a darker crease along the inner curve
    tint(ctx, (c) => ellipsePath(c, 4.6, 6.6, 3.6, 2.4, -0.5), '#c08848', 0.42);
    tint(ctx, (c) => ellipsePath(c, 2.2, 1.2, 2.6, 1.8, 0.4), '#a8703a', 0.45);
    tint(ctx, (c) => ellipsePath(c, -1.6, -11.4, 4.6, 1.6, 0.1), '#c08848', 0.25);
    speckle(ctx, -2, 0, 7, 8, 10, '#ffffff', 0.32, 4, 0.9);
  });
  // crease line hugging the notch (the nut's seam)
  line(ctx, [[6.2, -2.2], [3.2, -0.9], [1.6, 1.4], [3.4, 3.4], [6.2, 4.6]], 0.6, '#a8703a', true, 0.8);

  // bandit domino mask
  shape(ctx, dominoPath, { fill: MASK, ink: 0.7, shadow: 'none', gloss: [{ x: 0.4, y: -8.4, rx: 1.4, ry: 0.4, rot: -0.2, alpha: 0.35 }] });
  eye(ctx, 0.6, -6.8, 2.05, { look: [0.42, 0.1], lid: 'angry-l', pupil: 0.56, ink: 0.65 });
  eye(ctx, 5.8, -7, 2.3, { look: [0.42, 0.1], lid: 'angry-r', pupil: 0.56, ink: 0.65 });
  mouth(ctx, 5.6, -1.9, 3.8, 'snarl', { teeth: true, open: 1.1 });
  ctx.restore();
}

enemySprite('anacardo', 30, 26, 15, drawAnacardo);

// ===========================================================================
// 2. OLIO SBAGLIATO — r13. A squat clear bottle of cheap seed oil, sloshing:
//    red cut-price label with a sunflower, orange cap, greasy salesman grin.
// ===========================================================================

const PET = '#e6f0ee';
const SEED = '#f8da58';
const SEED_DK = '#d6ad2e';
const SEED_HI = '#fff3b0';
const LABEL = '#e03a2e';
const LABEL_SH = '#a8202a';
const LABEL_LN = '#76141a';
const OCAP = '#f5922a';
const OCAP_SH = '#c4601a';
/** Oil level in the bottle (the top third is empty, clear plastic). */
const OIL_LV = -9.4;

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
  // the oil surface tilts as it sloshes
  const lv = (x: number) => OIL_LV + (tilt * x) / 13;
  const oil = (c: Ctx) => {
    c.moveTo(-14, lv(-14));
    c.quadraticCurveTo(0, lv(0) + 0.9, 14, lv(14));
    c.lineTo(14, 12);
    c.lineTo(-14, 12);
    c.closePath();
  };
  const rightSide = (c: Ctx) => {
    c.moveTo(14, -24);
    c.lineTo(9.6, -18);
    c.quadraticCurveTo(10.6, -4, 9.2, 7);
    c.lineTo(-10, 9.6);
    c.lineTo(-10, 14);
    c.lineTo(14, 14);
    c.closePath();
  };
  clipTo(ctx, oilBottlePath, () => {
    // empty clear plastic up top: cool cel shadow + moulded shoulder grip ridges
    tint(ctx, rightSide, '#8fa6a2', 0.38);
    for (const yy of [-17.6, -15.6]) line(ctx, [[-10.6, yy + 2.4], [0, yy], [10.6, yy + 2.4]], 0.55, '#a9bab6', true, 0.9);
    // the far half of the oil's surface, seen through the plastic
    tint(ctx, (c) => ellipsePath(c, 0, lv(0) + 0.2, 13, 2, (tilt / 13) * 0.9), SEED_HI, 0.9);
    ctx.save();
    ctx.beginPath();
    oil(ctx);
    ctx.fillStyle = radial(ctx, -4, -2, 20, [[0, SEED_HI], [0.45, SEED], [1, SEED_DK]], -5, -4);
    ctx.fill();
    ctx.restore();
    // warm cel shadow through the oil
    clipTo(ctx, oil, () => tint(ctx, rightSide, '#b4891c', 0.42));
    // surface: bright meniscus + darker underline
    line(ctx, [[-14, lv(-14)], [0, lv(0) + 0.45], [14, lv(14)]], 1.3, '#fffbe0', true, 0.95);
    line(ctx, [[-14, lv(-14) + 1.4], [0, lv(0) + 1.9], [14, lv(14) + 1.4]], 0.6, SEED_DK, true, 0.6);
    // a few bubbles rising through the oil
    for (const [bx, by, br] of [[-8.4, -1, 0.9], [-6.4, -5.6, 0.6], [9, -6, 0.7]] as [number, number, number][]) {
      const yy = by - ((f * 1.5) % 4);
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, bx, yy, br);
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.stroke();
      ctx.restore();
    }
    // label: a cheap red band with a wavy top edge (no text)
    const label = (c: Ctx) => {
      c.moveTo(-14, 2.2);
      c.quadraticCurveTo(-7, 0.8, 0, 1.8);
      c.quadraticCurveTo(7, 2.8, 14, 1.4);
      c.lineTo(14, 7.4);
      c.quadraticCurveTo(0, 8.6, -14, 7.4);
      c.closePath();
    };
    ctx.save();
    ctx.beginPath();
    label(ctx);
    ctx.fillStyle = LABEL;
    ctx.fill();
    ctx.restore();
    tint(ctx, (c) => ellipsePath(c, -6, 3.6, 7, 1, -0.05), '#ff8a70', 0.55);
    tint(ctx, (c) => {
      c.moveTo(9.6, 0);
      c.quadraticCurveTo(10.2, 4, 9.2, 8.4);
      c.lineTo(14, 8.4);
      c.lineTo(14, 0);
      c.closePath();
    }, LABEL_SH, 0.8);
    // yellow pinstripes top and bottom
    line(ctx, [[-14, 3.3], [-7, 1.9], [0, 2.9], [7, 3.9], [14, 2.5]], 0.5, '#ffd84a', true, 0.95);
    line(ctx, [[-14, 6.3], [0, 7.5], [14, 6.3]], 0.5, '#ffd84a', true, 0.95);
    line(ctx, [[-14, 2.2], [-7, 0.8], [0, 1.8], [7, 2.8], [14, 1.4]], 0.7, LABEL_LN, true, 0.9);
    line(ctx, [[-14, 7.4], [0, 8.6], [14, 7.4]], 0.7, LABEL_LN, true, 0.9);
    // plastic gloss: tall streak on the left + a ping on the shoulder
    tint(ctx, (c) => roundRectPath(c, -10.8, -14, 2.1, 21, 1), '#ffffff', 0.55);
    tint(ctx, (c) => ellipsePath(c, -8.6, -16.4, 1.8, 1, -0.6), '#ffffff', 0.95);
    tint(ctx, (c) => roundRectPath(c, 10.2, -11, 0.9, 9, 0.45), '#ffffff', 0.5);
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

  sunflower(ctx, 0.2, 5, 2.9);
  shape(ctx, (c) => ellipsePath(c, -3.2, 6.6, 1.5, 0.7, 0.4), { fill: '#3f9a3a', ink: 0.45, inkColor: '#1f5a22', shadow: 'none' });

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

  // a cut-price tag slapped on the label (no text: just a yellow tag with a red slash)
  ctx.save();
  ctx.translate(9.2, 4.6);
  ctx.rotate(-0.35);
  const tag = (c: Ctx) => {
    c.moveTo(-2.9, -1.6);
    c.lineTo(1.6, -1.6);
    c.lineTo(3.2, 0);
    c.lineTo(1.6, 1.6);
    c.lineTo(-2.9, 1.6);
    c.closePath();
  };
  shape(ctx, tag, { fill: '#ffd43a', ink: 0.7, shadow: '#e09a18', shadowOffset: [-0.5, -0.6] });
  clipTo(ctx, tag, () => line(ctx, [[-2.4, 1.8], [0.4, -1.8]], 0.9, '#e8352e', false, 1));
  shape(ctx, (c) => circlePath(c, 1.7, 0, 0.45), { fill: '#7a4a14', ink: 0, shadow: 'none' });
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

enemySprite('olio', 44, 54, 38, drawOlio);

// ===========================================================================
// 3. LA FILANTE ABUSIVA — r14. A gooey blob of golden melted pizza cheese:
//    leopard blisters on top, reaching forward with long stretched cheese strings.
// ===========================================================================

const MELT = '#ffe28f';
const MELT_SH = '#e9a93c';
const MELT_HI = '#fff6cf';
const BLISTER = '#d8862c';
const BLISTER_DK = '#a3561a';

function filanteBody(c: Ctx, sx: number, sy: number) {
  const P = (x: number, y: number): Pt => [x * sx, 13 - (13 - y) * sy];
  smoothPath(c, [
    P(-4, -15), P(3, -14.2), P(8.6, -10), P(11.4, -3.6), P(12, 3), P(14.2, 9.4), P(10.8, 12.8), P(5, 12.2),
    P(-0.6, 13.4), P(-7.4, 12.4), P(-13.4, 13), P(-18, 10.4), P(-17, 4.6), P(-16, -2.6), P(-12.6, -10), P(-8.6, -13.8),
  ], true, 0.5);
}

/** Point at t along the sagging centre line of strandPath(a, b, …, sag). */
type Pt3 = [number, number, number];

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

  // a string hanging off the lower hand with a drop at the end
  const hx = H2[0] + 1.6, hy = H2[1] + 2.8, hl = 3.8 + s * 0.8;
  shape(ctx, (c) => strandPath(c, [hx, hy], [hx + 0.2, hy + hl], 1.4, 0.9, 1, 0.3), { fill: MELT, ink: 0.55, shadow: 'none' });
  shape(ctx, (c) => teardrop(c, hx + 0.2, hy + hl + 0.7, 1.05, 2.3), { fill: MELT, ink: 0.55, shadow: MELT_SH, shadowOffset: [-0.4, -0.4] });

  // arms + hands + trailing goo + drips share one gooey silhouette with the body
  const arms = (c: Ctx) => {
    strandPath(c, B1, H1, 6.6, 2.2 / reach, 3.4, SAG1);
    strandPath(c, B2, H2, 6.6, 2.2 / reach, 3.4, SAG2);
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
  const handStyle = { fill: MELT, shadow: MELT_SH, shadowOffset: [-1.1, -1.2] as Pt, gloss: [{ x: H1[0] - 0.6, y: H1[1] - 1.4, rx: 1, ry: 0.5, rot: -0.3, alpha: 0.85 }, { x: H2[0] - 0.6, y: H2[1] - 1.4, rx: 1, ry: 0.5, rot: -0.3, alpha: 0.85 }] };
  const bodyStyle = {
    fill: radial(ctx, -6, -8, 26, [[0, MELT_HI], [0.42, MELT], [1, '#f5c45c']], -7, -10),
    shadow: MELT_SH, shadowOffset: [-2.8, -2.6] as Pt,
    gloss: [{ x: -7.6, y: -10.6, rx: 3.4, ry: 1.6, rot: -0.55, alpha: 0.75 }],
  };
  group(ctx, [
    { build: arms, style: { fill: MELT, shadow: MELT_SH, shadowOffset: [-0.9, -1.1] } },
    { build: hands, style: handStyle },
    { build: drips, style: { fill: MELT_SH, shadow: 'none' } },
    { build: body, style: bodyStyle },
  ], 2.4);
  // the cheese pull: long free strands from the body to each hand, sagging under the arms with
  // gaps between them; then the body and hands are filled again (no outline) so they swallow the ends
  const pull = (a: Pt, b: Pt, sag: number, w: number) => {
    shape(ctx, (c) => strandPath(c, a, b, w * 1.5, w, w * 1.3, sag), { fill: MELT, ink: 0.65, shadow: MELT_SH, shadowOffset: [-0.3, -0.5] });
    const m = strandAt(a, b, sag, 0.4);
    line(ctx, [[m[0] - 1.2, m[1] - w * 0.25], [m[0] + 1.2, m[1] - w * 0.25 + 0.3]], 0.35, '#ffffff', false, 0.85);
  };
  pull([7.6, -4.8], [H1[0] - 1.4, H1[1] + 1.2], 3.8 + s * 0.4, 1.25);
  pull([8.4, -1.2], [H1[0] + 0.2, H1[1] + 1.8], 7.4 + s * 0.6, 1.3);
  pull([8.8, 6.8], [H2[0] - 0.8, H2[1] + 1.8], 4.6 - s * 0.4, 1.3);
  shape(ctx, hands, { ...handStyle, ink: 0 });
  shape(ctx, body, { ...bodyStyle, ink: 0 });
  // highlight along the top of each arm (glossy melted cheese)
  for (const [a, b, sag] of [[B1, H1, SAG1], [B2, H2, SAG2]] as [Pt, Pt, number][]) {
    const p0 = strandAt(a, b, sag, 0.15), p1 = strandAt(a, b, sag, 0.5), p2 = strandAt(a, b, sag, 0.8);
    line(ctx, [[p0[0], p0[1] - 1.6], [p1[0], p1[1] - 0.6], [p2[0], p2[1] - 1]], 0.55, '#ffffff', true, 0.8);
  }

  clipTo(ctx, body, () => {
    // warm melt pooling at the base + toasted "leopard" blisters on the top and back
    tint(ctx, (c) => ellipsePath(c, -2, 13.6, 19, 4.6), MELT_SH, 0.6);
    const R = rng(31);
    for (const [bx, by, br] of [
      [-8, -10.4, 3], [0.6, -12.8, 2.2], [-12.8, -3.2, 2.2], [6.4, -10.6, 1.5], [-11.2, 5, 1.5], [-15.2, 1.2, 1.2],
      [-14.2, -8, 1.3], [4.6, -14.2, 1], [-4.2, -13.4, 1.1], [-6.4, 8.2, 1.1], [-16.2, 7, 0.9],
    ] as [number, number, number][]) {
      const k = 0.85 + R() * 0.3;
      const rot = R() * 0.6 - 0.3;
      shape(ctx, (c) => ellipsePath(c, bx, by, br * k, br * 0.72, rot), {
        fill: BLISTER, ink: 0, shadow: BLISTER_DK, shadowOffset: [br * 0.35, br * 0.3],
      });
      if (br > 1.4) tint(ctx, (c) => ellipsePath(c, bx + br * 0.15, by + br * 0.12, br * 0.35, br * 0.26, rot), '#6e3410', 0.55);
      glint(ctx, bx - br * 0.35, by - br * 0.3, br * 0.32, br * 0.18, -0.4, 0.75);
    }
    // little oil beads floating on the melt
    speckle(ctx, 0, -2, 10, 9, 7, '#f0a830', 0.55, 9, 0.5);
  });

  // face: wide-eyed and greedy, mouth stretched open with strings of cheese from lip to lip
  eyePair(ctx, 1.2, -5.6, 3.3, { sp: 8.6, look: [0.38, 0.1], near: 1.08, brow: 0.42, browDy: 1.5, browTh: 1.5 });
  const mx = 2.4, my = 1.6;
  // the lips (quadratic curves, evaluated at the parameter t ≈ (x − left corner) / width)
  const quad = (t: number, y0: number, yc: number, y2: number) => (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * yc + t * t * y2;
  const top = (x: number) => quad((x - mx + 5) / 10, my - 1, my + 0.2, my - 1.4);
  const bot = (x: number) => quad((x - mx + 5) / 10, my - 1, my + 6.6 + s * 0.4, my - 1.4);
  const mo = (c: Ctx) => {
    c.moveTo(mx - 5, my - 1);
    c.quadraticCurveTo(mx, my + 0.2, mx + 5, my - 1.4);
    c.quadraticCurveTo(mx + 0.6, my + 6.6 + s * 0.4, mx - 5, my - 1);
    c.closePath();
  };
  shape(ctx, mo, { fill: '#5b1320', ink: 1.1, shadow: 'none' });
  clipTo(ctx, mo, () => {
    ctx.beginPath();
    ellipsePath(ctx, mx + 0.8, my + 4.8, 2.8, 1.4);
    ctx.fillStyle = '#e8616e';
    ctx.fill();
    // strings of cheese stretched from the top lip to the bottom lip, bowing apart (goo, not fangs)
    for (const [x0, x1, bow] of [[mx - 2.2, mx - 1.4, -0.9], [mx + 1.2, mx + 1.8, 0.8], [mx + 3.4, mx + 3.6, 0.5]] as Pt3[]) {
      const a: Pt = [x0, top(x0) - 0.4], b: Pt = [x1, bot(x1) + 0.3];
      shape(ctx, (c) => strandPath(c, a, b, 1.15, 0.3, 1.15, 0, bow), { fill: '#ffd86a', ink: 0, shadow: 'none' });
    }
  });
  cheeks(ctx, [[-6.2, -1.8], [8.6, -2.2]], 1.8, 1, '#ff8a4a', 0.4);
}

enemySprite('filante', 52, 37, 20, (ctx, f) => {
  ctx.save();
  ctx.translate(0, -0.8);
  ctx.scale(0.9, 0.9);
  drawFilante(ctx, f);
  ctx.restore();
});

// ===========================================================================
// 4. CHEDDAR ARANCIONE — r13. A wobbly, plasticky, bright-orange processed
//    slice; top-right corner curling over, its cellophane wrapper peeling off the
//    bottom-left corner, the bottom edge melting.
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
    c.translate(0.6, 0.85);
    smoothPath(c, pts, true, 0.32);
    c.restore();
  };

  // far arm: fist up, ready to throw hands
  hoseArm(ctx, -11.6, -7.6, -16.4 - s * 0.5, -13 + Math.abs(s) * 1.2, { bend: -0.35, thick: 1.9, handR: 2.5 });

  legs(ctx, 0, 5, f, { len: 6, spread: 10, thick: 2.6, color: LIMB, shoe: SHOE, stride: 4.6 });

  // the slice sways a little with each step
  ctx.save();
  ctx.rotate(0.05 * s);
  // the bottom edge going soft: two glossy drips, between the legs and off the right corner
  // (kept clear of the legs so they never read as orange legs)
  const d1 = 2.6 + [0, 0.5, 0.9, 0.5][f], d2 = 3.6 + [0.6, 0.9, 0.3, 0][f];
  const drips = (c: Ctx) => {
    dripPath(c, 0.2, 5, 2.3, d1);
    dripPath(c, 10.6, 4.4, 2.2, d2);
  };
  // drips + thin darker edge (the slice's thickness) + the face of the slice, one silhouette
  group(ctx, [
    { build: drips, style: { fill: CHED, shadow: CHED_EDGE, shadowOffset: [-0.7, -0.6], gloss: [{ x: -0.2, y: 5 + d1 - 1.3, rx: 0.4, ry: 0.65, alpha: 0.9 }, { x: 10.2, y: 4.4 + d2 - 1.3, rx: 0.4, ry: 0.65, alpha: 0.9 }] } },
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

  // the cellophane wrapper, half peeled off the bottom-left corner (a translucent flap with a crisp edge)
  const lift = [0, 0.5, 0.9, 0.5][f];
  const flap = (c: Ctx) => {
    c.moveTo(-13.2, -1.6);
    c.quadraticCurveTo(-16.2 - lift * 0.5, 0.6, -16.4 - lift, 3.6 + lift * 0.4);
    c.quadraticCurveTo(-14.6, 7.4 + lift, -10.4, 8.4 + lift * 0.8);
    c.quadraticCurveTo(-8.6, 7.2, -8, 5.8);
    c.closePath();
  };
  ctx.save();
  ctx.beginPath();
  flap(ctx);
  ctx.fillStyle = 'rgba(240,248,255,0.5)';
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = 'rgba(43,23,18,0.7)';
  ctx.stroke();
  ctx.restore();
  // crisp white crease along the peel line + a sheen down the curled flap
  line(ctx, [[-13.2, -1.6], [-10.4, 2.4], [-8, 5.8]], 0.75, '#ffffff', true, 0.95);
  line(ctx, [[-15.2, 2], [-14.6, 4.8], [-12.4, 6.8]], 0.55, '#ffffff', true, 0.9);

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

enemySprite('cheddar', 48, 46, 30, drawCheddar);

// ===========================================================================
// 5. SALSA BARBECUE — r14. A squat amber-brown sauce bottle in a tan cowboy
//    hat; the nozzle pokes through the crown and smokes like a gun barrel.
//    Nozzle tip at (+4,−30): the shots leave from there.
// ===========================================================================

const BBQ = '#94401a';
const BBQ_LT = '#bc6230';
const BBQ_DK = '#6a2a10';
const BBQ_SH = '#5a210c';
const BBQ_RIM = '#f0a04a';
const SAUCE = '#a8481c';
const KRAFT = '#ecd29c';
const KRAFT_SH = '#c9a368';
const HAT = '#d39a56';
const HAT_SH = '#a26a32';
const HAT_BAND = '#6a3418';
const BANDANA = '#d8362e';
const BANDANA_SH = '#9e1f22';
const BOOT = '#8a4a24';
const BOOT_SH = '#5c2c14';
const GUNMETAL = '#7d828c';

/** Squat squeeze bottle: short neck under the hat, sloping shoulders, flat base at y = 6. */
function bbqBottlePath(c: Ctx) {
  c.moveTo(-5, -20);
  c.lineTo(-5.2, -17.8);
  c.bezierCurveTo(-8.8, -16.8, -12.4, -12.6, -12.8, -5);
  c.lineTo(-13, 1);
  c.quadraticCurveTo(-13, 6, -7.6, 6);
  c.lineTo(7.6, 6);
  c.quadraticCurveTo(13, 6, 13, 1);
  c.lineTo(12.8, -5);
  c.bezierCurveTo(12.4, -12.6, 8.8, -16.8, 5.2, -17.8);
  c.lineTo(5, -20);
  c.closePath();
}

/** Oval kraft label (the face sits on it), a touch to the right for the 3/4 view. */
function bbqLabelPath(c: Ctx) {
  ellipsePath(c, 1.3, -6.5, 10, 7.1);
}

/** Little flame (the label's "smoked" icon). */
function flamePath(c: Ctx, x: number, y: number, k: number) {
  c.moveTo(x, y + 2.2 * k);
  c.bezierCurveTo(x - 2.2 * k, y + 2.2 * k, x - 2.1 * k, y - 0.4 * k, x - 0.6 * k, y - 2.6 * k);
  c.quadraticCurveTo(x - 0.4 * k, y - 0.9 * k, x + 0.5 * k, y - 0.6 * k);
  c.quadraticCurveTo(x + 0.4 * k, y - 1.8 * k, x + 1.2 * k, y - 2.2 * k);
  c.bezierCurveTo(x + 2.4 * k, y - 0.6 * k, x + 2.1 * k, y + 2.2 * k, x, y + 2.2 * k);
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
      c.moveTo(fx - 2.3, fy - 4.8);
      c.lineTo(fx + 1.9, fy - 4.8);
      c.lineTo(fx + 1.9, fy - 1.6);
      c.quadraticCurveTo(fx + 4.4, fy - 1.4, fx + 5, fy + 0.8);
      c.lineTo(fx - 0.6, fy + 0.8);
      c.lineTo(fx - 0.9, fy + 1.9);
      c.lineTo(fx - 2.6, fy + 1.9);
      c.closePath();
    }, { fill: BOOT, ink: 1.1, shadow: BOOT_SH, shadowOffset: [-0.8, -0.8], gloss: [{ x: fx - 1, y: fy - 3.2, rx: 0.5, ry: 1, alpha: 0.5 }] });
    // stitched top band + a heel-to-toe stitch
    line(ctx, [[fx - 2, fy - 3.6], [fx + 1.6, fy - 3.6]], 0.55, '#f0bf78', false, 0.95);
    // spur (star rowel)
    shape(ctx, (c) => starPath(c, fx - 3.4, fy + 0.4, 1.15, 0.5, 5), { fill: '#ffd447', ink: 0.45, shadow: 'none' });
  }
}

function drawBbq(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);

  // far arm akimbo (hand on hip)
  hoseArm(ctx, -11.2, -5, -13, 1.6, { bend: -0.65, thick: 1.9, handR: 2.4 });

  boots(ctx, 0, 6, f, 5.8, 10.4, 4.4);

  // bottle: translucent amber-brown plastic, lit from the upper left
  shape(ctx, bbqBottlePath, {
    fill: radial(ctx, -5, -9, 20, [[0, BBQ_LT], [0.5, BBQ], [1, BBQ_DK]], -6, -10),
    shadow: BBQ_SH, ink: 2.1, shadowOffset: [-3, -1.6],
    gloss: [
      { x: -9.4, y: -3, rx: 1.2, ry: 5.6, rot: 0.02, alpha: 0.5 },
      { x: -8.4, y: -12.6, rx: 1.3, ry: 0.8, rot: -0.7, alpha: 0.8 },
    ],
  });
  clipTo(ctx, bbqBottlePath, () => {
    // amber back-light along the right edge (sauce glowing through the plastic)
    line(ctx, [[9.2, -14.4], [11.6, -7], [12, 1.4], [10, 5.2]], 1.2, BBQ_RIM, true, 0.8);
    // shadow under the hat brim
    tint(ctx, (c) => {
      c.moveTo(-14, -22);
      c.lineTo(14, -22);
      c.lineTo(14, -15.4);
      c.quadraticCurveTo(1, -13.2, -14, -15.8);
      c.closePath();
    }, '#200a04', 0.4);
  });

  // kraft label behind the face (with a little flame icon, no text)
  shape(ctx, bbqLabelPath, { fill: KRAFT, ink: 1.05, shadow: KRAFT_SH, shadowOffset: [-1.8, -1.2] });
  clipTo(ctx, bbqLabelPath, () => {
    // brim shade falling on the label's top edge
    tint(ctx, (c) => ellipsePath(c, 1.3, -14.6, 12, 3), '#5a3214', 0.3);
  });
  shape(ctx, (c) => flamePath(c, -5.9, -2.9, 0.72), { fill: '#f07a22', ink: 0.5, shadow: '#c8401a', shadowOffset: [-0.3, -0.4] });
  shape(ctx, (c) => flamePath(c, -5.85, -2.5, 0.34), { fill: '#ffd447', ink: 0, shadow: 'none' });

  // bandana tied round the waist, knot at the back, triangle at the front
  const band = (c: Ctx) => {
    c.moveTo(-13, -0.2);
    c.quadraticCurveTo(0, 1.8, 13, -0.6);
    c.lineTo(13, 2.8);
    c.quadraticCurveTo(0, 5, -13, 3);
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
      c.moveTo(13, -0.8);
      c.lineTo(8.6, 0.6);
      c.lineTo(8.6, 4.2);
      c.lineTo(13, 3.2);
      c.closePath();
    }, BANDANA_SH, 0.8);
    line(ctx, [[-13, 3], [0, 5], [13, 2.8]], 0.6, BANDANA_SH, true, 0.9);
  });
  const tri = (c: Ctx) => {
    c.moveTo(-3, 2.2);
    c.lineTo(8, 1.8);
    c.quadraticCurveTo(4.8, 4.6, 2.8, 7.4 + s * 0.3);
    c.quadraticCurveTo(-0.6, 4.6, -3, 2.2);
    c.closePath();
  };
  shape(ctx, tri, { fill: BANDANA, ink: 1.2, shadow: BANDANA_SH, shadowOffset: [-1, -1] });
  for (const [dx, dy] of [[-1.4, 1], [2.2, 1.8], [6, 0.8], [-8, 1.4], [-11, 0.8], [10.6, 0.4], [1.8, 4.4], [4.4, 3.6]] as Pt[]) {
    shape(ctx, (c) => circlePath(c, dx, dy, 0.45), { fill: '#fff3e0', ink: 0, shadow: 'none' });
  }
  // knot tails flapping behind
  inkLine(ctx, [[-12.4, 1.4], [-15.4, 2.8 + s * 0.6], [-17, 4.8 + s]], 1.6, BANDANA, true, 0.85);
  inkLine(ctx, [[-12.4, 1.8], [-15, 5.4], [-15.6, 7.6 - s * 0.6]], 1.4, BANDANA_SH, true, 0.85);

  // face on the label: gunslinger's squint, heavy ink brows, crooked sneer with a gold tooth
  eye(ctx, -2.4, -6.6, 2.75, { look: [0.45, 0.08], lid: 'angry-l', pupil: 0.56, squash: 0.92 });
  eye(ctx, 5.6, -6.8, 3.0, { look: [0.42, 0.08], lid: 'angry-r', pupil: 0.54, squash: 1.0 });
  brow(ctx, -2.6, -10.2, 5.4, 0.55, 1.75);
  brow(ctx, 5.9, -10.6, 5.8, -0.5, 1.75);
  const smx = 2.4, smy = -2.2;
  const sneer = (c: Ctx) => {
    c.moveTo(smx - 4.2, smy - 0.2);
    c.quadraticCurveTo(smx, smy + 0.2, smx + 4.4, smy - 1.6);
    c.quadraticCurveTo(smx + 1.4, smy + 2.6, smx - 4.2, smy - 0.2);
    c.closePath();
  };
  shape(ctx, sneer, { fill: '#5b1320', ink: 1, shadow: 'none' });
  clipTo(ctx, sneer, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(smx - 5, smy - 1.4);
    ctx.lineTo(smx + 5, smy - 2.8);
    ctx.lineTo(smx + 5, smy - 0.4);
    ctx.lineTo(smx - 5, smy + 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffc93a';
    ctx.fillRect(smx + 0.6, smy - 2, 1.5, 1.9);
    ctx.fillStyle = '#fff4c0';
    ctx.fillRect(smx + 0.8, smy - 1.6, 0.5, 0.6);
  });
  // a stalk of straw in the corner of the mouth
  inkLine(ctx, [[smx + 3.8, smy - 1.4], [smx + 7, smy - 3.6 + s * 0.3], [smx + 9.8, smy - 5 + s * 0.5]], 0.75, '#f2cf62', false, 0.5);

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
  }, { fill: SAUCE, ink: 0.8, shadow: 'none', gloss: [{ x: 2.4, y: -25.4, rx: 0.8, ry: 0.3, alpha: 0.7 }, { x: 4.8, y: -22.6 + [0, 0.6, 1.2, 0.4][f], rx: 0.25, ry: 0.4, alpha: 0.8 }] });
  // the nozzle: a gunmetal barrel poking out through the hole in the crown (tip at +4,−30: the muzzle)
  shape(ctx, (c) => ellipsePath(c, 3.5, -25.4, 2.7, 0.95), { fill: '#3a2018', ink: 0.9, shadow: 'none' });
  shape(ctx, (c) => {
    c.moveTo(1.2, -25.4);
    c.quadraticCurveTo(2.4, -27.8, 3.1, -29.4);
    c.lineTo(4.9, -29.4);
    c.quadraticCurveTo(5.4, -27.8, 5.9, -25.4);
    c.quadraticCurveTo(3.5, -24.6, 1.2, -25.4);
    c.closePath();
  }, { fill: GUNMETAL, ink: 1.1, shadow: '#4c5058', shadowOffset: [-1, 0], gloss: [{ x: 2.8, y: -27.2, rx: 0.4, ry: 1.5, rot: 0.4, alpha: 0.9 }] });
  // a glossy bead of sauce on the muzzle
  shape(ctx, (c) => ellipsePath(c, 4, -29.9, 1.35, 0.85), { fill: '#c45a24', ink: 0.6, shadow: '#8a3214', shadowOffset: [-0.3, -0.4], gloss: [{ x: 3.5, y: -30.2, rx: 0.5, ry: 0.28, alpha: 0.95 }] });

  // smoking barrel
  steamCurl(ctx, 4.2, -31.4, 6, ph, 1.4, 0.75, '#efe9e2');

  // near arm: gunslinger's hand hovering by the hip
  hoseArm(ctx, 11.6, -4.6, 15.6 + s * 0.6, 1.4 - Math.abs(s) * 0.6, { bend: 0.45, thick: 1.9, handR: 2.4 });
}

enemySprite('bbq', 44, 56, 40, drawBbq);

// ===========================================================================
// FX — seed-oil slick: pale, cold, cheap (vs the chef's golden olive oil)
// ===========================================================================

fx('fx.seedoil_puddle', 66, 48, (ctx) => {
  puddle(ctx, 27, 17, 41, { base: '#f2e47e', alpha: 0.9, rim: '#7f6f1c', glossA: 1, satellites: 4 });
  // a firmer khaki edge so the slick holds up on the pale food-court tiles
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  smoothPath(ctx, puddlePts(27, 17, 41), true, 0.6);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#9a8a2c';
  ctx.stroke();
  ctx.restore();
  // a cold, thin, watery look: pale wash in the middle + a bluish/lilac chemical sheen (petrol-like)
  tint(ctx, (c) => ellipsePath(c, -4, 0, 15, 8, -0.1), '#fffbd8', 0.4);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = '#e6f6ff';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(1, 2, 17, 9, -0.06, Math.PI * 0.15, Math.PI * 0.75);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#b9dcff';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(1, 2, 13, 6.4, -0.06, Math.PI * 0.2, Math.PI * 0.7);
  ctx.stroke();
  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = '#d6b8ff';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(1, 2, 20.5, 11, -0.06, Math.PI * 0.22, Math.PI * 0.62);
  ctx.stroke();
  ctx.restore();
  // one floating sunflower-seed husk (dark, pale stripes) and a stray pale kernel, deliberately unpaired
  ctx.save();
  ctx.translate(10.5, -4.5);
  ctx.rotate(-0.55);
  shape(ctx, (c) => {
    c.moveTo(-2.6, 0);
    c.quadraticCurveTo(-1, -1.5, 2.6, -0.2);
    c.quadraticCurveTo(-1, 1.5, -2.6, 0);
    c.closePath();
  }, { fill: '#3a3632', ink: 0.5, inkColor: '#1c1a18', shadow: 'none' });
  line(ctx, [[-1.7, -0.15], [1.9, -0.2]], 0.35, '#e8e2d0', false, 0.9);
  line(ctx, [[-1.2, 0.5], [1.2, 0.35]], 0.3, '#e8e2d0', false, 0.7);
  ctx.restore();
  shape(ctx, (c) => ellipsePath(c, -14.6, 6.4, 1.5, 0.8, 0.3), { fill: '#efe6cc', ink: 0.45, inkColor: '#8a7a50', shadow: 'none' });
  // little bubbles
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.55;
  for (const [x, y, r] of [[3, -7, 1.3], [5.4, -5.4, 0.8], [-17, 1.6, 1], [18, 3, 0.9], [-4, 8, 0.7]] as [number, number, number][]) {
    ctx.beginPath();
    circlePath(ctx, x, y, r);
    ctx.stroke();
  }
  ctx.restore();
  glint(ctx, -9, -7, 7, 1.6, -0.1, 0.9);
  glint(ctx, 3, -10.5, 2.2, 0.8, -0.1, 0.7);
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
  }, { fill: '#a8441a', ink: 1, shadow: 'none', gloss: [{ x: -6, y: -0.6, rx: 1, ry: 0.35, rot: 0.2, alpha: 0.6 }] });
  // a rich, glossy mahogany-orange sauce (browner than the ketchup, deeper than the generic shot)
  sauceBlob(ctx, 6, '#ce6428', '#923812', 19);
  // light glowing through the translucent sauce on the lower right + a lick of smoke trailing
  clipTo(ctx, (c) => circlePath(c, 0, 0, 6), () => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 4.7, 0.05, 1.65);
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f2a050';
    ctx.globalAlpha = 0.75;
    ctx.stroke();
    ctx.restore();
    tint(ctx, (c) => ellipsePath(c, -5.8, 1.8, 3, 4.4, 0.4), '#3a1206', 0.15);
  });
  ctx.save();
  ctx.fillStyle = 'rgba(40,14,6,0.8)';
  for (const [x, y, r] of [[-3.6, 2.8, 0.45], [-1.6, 4.2, 0.4], [-5, 0.4, 0.35], [2.6, 3.4, 0.3]] as [number, number, number][]) {
    ctx.beginPath();
    ellipsePath(ctx, x, y, r * 1.3, r, 0.5);
    ctx.fill();
  }
  ctx.restore();
  glint(ctx, -2, -2.6, 1.6, 0.8, -0.7, 0.95);
  glint(ctx, 3, 2.4, 0.7, 0.35, -0.7, 0.55);
});
