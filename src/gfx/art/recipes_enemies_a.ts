/**
 * IL MENÙ — ENEMIES A: five intruders that do not belong in their dish, the butter slick
 * and two enemy shots. Imported before placeholders.ts, so every id defined here replaces
 * its placeholder automatically.
 *
 * Follow docs/ART_GUIDE.md (quality bar: enemies_a.ts / enemies_b_*.ts). Enemies: 4-frame
 * move cycle (frame 0 neutral) + hit flash, anchor = centre of the collision circle,
 * feet/base at y ≈ +radius, facing right, no ground shadow, one dominant colour.
 *
 *   id                  box w×h   anchor (ax,ay)  radius  behaviour   look
 *   enemy.burro         46×52     (23,36)         14      puddler     pale-yellow butter brick in its opened foil wrapper
 *                                                                     (blue band, a peeled corner), golden melt dripping
 *                                                                     off the top; mischievous grin, tiptoes, hides a
 *                                                                     butter knife behind its back
 *   enemy.funghi        46×50     (23,34)         13      burster     three dark-brown button mushrooms on one clump: the
 *                                                                     boss in a tiny black fedora, two henchmen (one in
 *                                                                     shades); spore puffs drift around. It hovers (the
 *                                                                     renderer lifts it), so rootlets dangle under the clump
 *   enemy.prosciutto    48×50     (24,34)         14      chase       pink cooked ham wrapped in a ham-slice cloak (white fat
 *                                                                     rim + golden rind) with a high collar pulled up over
 *                                                                     its mouth; shifty eyes, sweat, a fake "hello, my name
 *                                                                     is…" sticker (illegible scrawl, no readable text)
 *   enemy.broccoli      50×58     (25,40)         15      lobber      dark-green floret head in a red baseball cap with a
 *                                                                     white star, "Alfredo" cream dripping off the top, pale
 *                                                                     stalk body, white sneakers; swings a floret underhand
 *   enemy.gamberi       44×40     (22,26)         12      leaper      coral-pink shrimp curled into a C like a spring, blue
 *                                                                     swim goggles, long antennae; the tail fan flips
 *
 *   fx.butter_puddle    76×56     (38,28)  1 frame, res 2: melted butter seen from above, a half-melted pat in the
 *                                          middle and milky foam at the rim (enemy hazard 'butter'; drawn scaled to
 *                                          the hazard radius at ~0.92 alpha, like fx.cream_puddle).
 *   proj.e_spore        24×24     (12,12)  1 frame: a dusty puff of mushroom spores (DANGER style: hot rim, red glow).
 *   proj.e_floret       24×24     (12,12)  1 frame: a round broccoli floret dripping cream, stalk stub at the back
 *                                          (lobbed and spun; lands as a cream puddle). DANGER style.
 */
import {
  Ctx, Pt, INK, shape, group, ellipsePath, circlePath, polyPath, smoothPath, line, inkLine, legs, eye, brow,
  speckle, glint, rng, shade, rgba, mix,
} from '../painter';
import { enemySprite, cyc, TAU, LIMB, mitt, hoseArm, cheeks, clipTo, wash } from './enemies_b_kit';
import { danger } from './projectiles';
import { fx, puddle } from './fx';
import { S, radial } from './items_kit';

const SHOE = '#2e1c15';

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Round shaded ball (hands, buds, knots). */
function ball(ctx: Ctx, x: number, y: number, r: number, fill: string, sh = shade(fill), ink = 1.1, glossA = 0.6) {
  shape(ctx, (c) => circlePath(c, x, y, r), {
    fill, ink, shadow: sh, shadowOffset: [-r * 0.36, -r * 0.4],
    gloss: glossA > 0 ? [{ x: x - r * 0.38, y: y - r * 0.42, rx: r * 0.34, ry: r * 0.21, rot: -0.5, alpha: glossA }] : undefined,
  });
}

/** Polygon with rounded corners (r per corner or one r for all). */
function roundPoly(c: Ctx, pts: Pt[], r: number | number[]) {
  const n = pts.length;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const m = mid(p, q);
    c.arcTo(p[0], p[1], m[0], m[1], Array.isArray(r) ? r[i] : r);
  }
  c.closePath();
}

/** Append a hanging drip to the current path (the path is travelling left → right along a lip at height yd). */
function dripAt(c: Ctx, xd: number, yd: number, w: number, len: number) {
  const r = w / 2;
  const by = yd + Math.max(len - r, r * 0.4);
  c.lineTo(xd - w * 0.9, yd);
  c.quadraticCurveTo(xd - r * 0.7, yd + (by - yd) * 0.35, xd - r, by);
  c.arc(xd, by, r, Math.PI, 0, true);
  c.quadraticCurveTo(xd + r * 0.7, yd + (by - yd) * 0.35, xd + w * 0.9, yd);
}

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

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  fn();
  ctx.restore();
}

/** Little sweat drop (points up). */
function sweat(ctx: Ctx, x: number, y: number, s: number) {
  shape(ctx, (c) => {
    c.moveTo(x, y - s * 1.5);
    c.quadraticCurveTo(x + s * 0.95, y - s * 0.1, x, y + s * 0.6);
    c.quadraticCurveTo(x - s * 0.95, y - s * 0.1, x, y - s * 1.5);
    c.closePath();
  }, { fill: '#9ad8f5', ink: 0.8, shadow: '#5fa8d6', shadowOffset: [-0.4, -0.5], gloss: [{ x: x - s * 0.25, y: y - s * 0.2, rx: s * 0.22, ry: s * 0.35, alpha: 0.9 }] });
}

// ===========================================================================
// 1. BURRO FURBETTO — r14. A pale-yellow brick of butter melting out of its
//    opened foil wrapper. Tiptoes in with a mischievous grin, a butter knife
//    hidden behind its back. (Puddler: leaves butter slicks.)
// ===========================================================================

const BUT = '#fbe28a';
const BUT_SH = '#e3b850';
const BUT_HI = '#fffbe6';
const BUT_LN = '#cf9c38';
const MELT = '#f9d34a';
const MELT_SH = '#e0a326';
const FOIL = '#e2e7ee';
const FOIL_SH = '#9ca8bb';
const FOIL_DK = '#6d798d';
const FOIL_BAND = '#2f60b8';
const FOIL_GOLD = '#f2c14e';
const KNIFE = '#e9eef5';
const KNIFE_SH = '#8f9bb0';
const WOOD = '#c7854c';

function butterKnife(ctx: Ctx, x: number, y: number, ang: number) {
  rot(ctx, x, y, ang, () => {
    // handle (below the grip point) with two rivets
    shape(ctx, (c) => roundPoly(c, [[-1.7, 0.4], [1.7, 0.4], [1.5, 7.4], [-1.5, 7.4]], 1.3), { fill: WOOD, ink: 1.0, shadow: '#8f5228', shadowOffset: [-0.7, -0.4] });
    ball(ctx, 0, 3.0, 0.45, '#e9eef5', '#8f9bb0', 0.4, 0);
    ball(ctx, 0, 5.4, 0.45, '#e9eef5', '#8f9bb0', 0.4, 0);
    // blade: long, round-tipped, a touch wider toward the tip
    const blade = (c: Ctx) => {
      c.moveTo(-1.3, -0.8);
      c.lineTo(-2.0, -12.0);
      c.quadraticCurveTo(-2.2, -18.4, 0.4, -18.8);
      c.quadraticCurveTo(2.4, -18.2, 2.0, -11.4);
      c.lineTo(1.2, -0.8);
      c.closePath();
    };
    shape(ctx, blade, { fill: KNIFE, ink: 1.1, shadow: KNIFE_SH, shadowOffset: [-1.2, -0.3], gloss: [{ x: -0.7, y: -10.4, rx: 0.5, ry: 5.6, alpha: 1 }] });
    clipTo(ctx, blade, () => {
      // a smear of butter on the tip
      ctx.fillStyle = BUT;
      ctx.beginPath();
      ctx.moveTo(-3, -14.0);
      ctx.quadraticCurveTo(-0.6, -12.6, 3, -15.2);
      ctx.lineTo(3, -20);
      ctx.lineTo(-3, -20);
      ctx.closePath();
      ctx.fill();
      line(ctx, [[-3, -14.0], [-0.6, -12.6], [3, -15.2]], 0.5, BUT_LN, true, 0.8);
      line(ctx, [[1.4, -1], [1.7, -11]], 0.6, rgba(FOIL_DK, 0.6), false);
    });
    // bolster
    shape(ctx, (c) => roundPoly(c, [[-1.9, -1.6], [1.9, -1.6], [1.9, 1.0], [-1.9, 1.0]], 0.5), { fill: '#b9c2d0', ink: 0.8, shadow: 'none' });
  });
}

function drawBurro(ctx: Ctx, f: number) {
  const { s, c: co } = cyc(f);
  const L = -12, R = 6, T = -24, B = 6.6, DX = 7, DY = -5;

  // --- the knife, hidden behind its back (far hand), sways with the step
  const kx = -15.0, ky = -2.6 + Math.abs(s) * 0.4;
  hoseArm(ctx, -9.5, -8.6, kx + 0.4, ky + 0.6, { thick: 2.0, hand: '' });
  butterKnife(ctx, kx, ky, -0.12 + s * 0.05);
  mitt(ctx, kx + 0.2, ky + 0.8, 2.3);

  // --- tiptoe legs (sneaky)
  legs(ctx, 0.6, 6.6, f, { len: 3.8, spread: 9.6, thick: 2.8, color: LIMB, shoe: SHOE, stride: 3.8 });

  // --- the block
  const block: Pt[] = [[L, T], [L + DX, T + DY], [R + DX, T + DY], [R + DX, B + DY], [R, B], [L, B]];
  const blockB = (c: Ctx) => roundPoly(c, block, [3.4, 3.4, 3.4, 2, 2, 2]);
  shape(ctx, blockB, { fill: BUT, ink: 2.1, shadow: 'none' });
  clipTo(ctx, blockB, () => {
    // front face: soft volume from the upper-left
    ctx.fillStyle = radial(ctx, L + 4, T + 6, 26, [[0, BUT_HI], [0.32, BUT], [1, mix(BUT, BUT_SH, 0.5)]]);
    ctx.fillRect(L - 2, T - 2, R - L + 2, B - T + 4);
    // right side face in shadow
    ctx.fillStyle = BUT_SH;
    ctx.beginPath();
    polyPath(ctx, [[R, T], [R + DX + 3, T + DY - 3], [R + DX + 3, B + DY + 4], [R, B + 4]]);
    ctx.fill();
    ctx.fillStyle = rgba('#c8902e', 0.3);
    ctx.beginPath();
    polyPath(ctx, [[R + DX - 1.4, T + DY], [R + DX + 3, T + DY], [R + DX + 3, B + 4], [R + DX - 1.4, B + 4]]);
    ctx.fill();
    line(ctx, [[R + 1.2, T + 1], [R + 1.4, B - 2]], 0.8, rgba('#fff8d8', 0.55), false);
  });
  // edge between the front face and the side face
  line(ctx, [[R, T + 1.5], [R, B - 1]], 0.75, BUT_LN, false, 0.7);

  // --- melting top: golden, glossy melt pooling on top and running over the front lip
  const dl = [0, 1.2, 2.2, 1.0][f];
  const lip = T + 1.2;
  const melt = (c: Ctx) => {
    c.moveTo(L - 0.9, lip);
    dripAt(c, L + 1.7, lip, 3.4, 9.0 + dl);
    dripAt(c, L + 9.6, lip, 2.4, 4.0 + dl * 0.5);
    dripAt(c, R - 2.4, lip, 2.0, 2.4);
    c.lineTo(R + 0.4, lip);
    // up the side face's top edge, with a drip down the side
    c.lineTo(R + DX * 0.45 - 1.0, lip + DY * 0.45);
    const sx = R + DX * 0.55, sy = lip + DY * 0.55;
    c.quadraticCurveTo(sx - 0.6, sy + 3, sx - 0.4, sy + 5.4 + dl * 0.6);
    c.arc(sx + 0.7, sy + 5.4 + dl * 0.6, 1.1, Math.PI, 0, true);
    c.quadraticCurveTo(sx + 1.6, sy + 2.0, sx + 2.0, sy - 0.6);
    c.lineTo(R + DX + 0.9, lip + DY + 0.2);
    // back edge (rounded, slumped)
    c.quadraticCurveTo(R + DX + 1.4, T + DY - 1.6, R + DX - 1.6, T + DY - 1.6);
    c.lineTo(L + DX + 0.6, T + DY - 1.4);
    c.quadraticCurveTo(L - 0.4, T + DY + 0.4, L - 0.9, lip);
    c.closePath();
  };
  shape(ctx, melt, {
    fill: MELT, ink: 1.15, shadow: MELT_SH, shadowOffset: [-1.0, -1.4],
    gloss: [
      { x: L + 6.8, y: T - 1.8, rx: 4.2, ry: 1.3, rot: -0.3, alpha: 0.95 },
      { x: R + 3.6, y: T - 3.6, rx: 1.4, ry: 0.6, rot: -0.6, alpha: 0.8 },
      { x: L + 1.0, y: T + 6.8 + dl, rx: 0.55, ry: 1.8, alpha: 0.9 },
      { x: L + 9.2, y: T + 4.2 + dl * 0.5, rx: 0.4, ry: 0.9, alpha: 0.85 },
    ],
  });

  // --- face: mischievous — pupils sliding to the corner, one brow down, one cocked
  eye(ctx, -4.2, -12.2, 2.5, { look: [0.5, -0.12], pupil: 0.52, squash: 1.18 });
  eye(ctx, 2.7, -12.5, 2.75, { look: [0.5, -0.12], pupil: 0.52, squash: 1.18 });
  brow(ctx, -4.3, -16.0, 4.2, 0.38, 1.35);
  brow(ctx, 3.0, -17.9, 4.6, 0.22, 1.35); // cocked
  cheeks(ctx, [[-7.4, -8.4], [5.8, -8.8]], 1.8, 1.0, '#f2a35a', 0.5);
  // lopsided grin
  const grin = (c: Ctx) => {
    c.moveTo(-5.4, -7.7);
    c.quadraticCurveTo(0.2, -6.0, 5.6, -9.6);
    c.quadraticCurveTo(4.6, -4.0, 0.2, -3.8);
    c.quadraticCurveTo(-3.8, -4.0, -5.4, -7.7);
    c.closePath();
  };
  shape(ctx, grin, { fill: '#5b1320', ink: 1.0, shadow: 'none' });
  clipTo(ctx, grin, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(-6, -8.8);
    ctx.quadraticCurveTo(0.2, -7.2, 6.4, -10.8);
    ctx.lineTo(6.4, -7.7);
    ctx.quadraticCurveTo(0.2, -4.8, -6, -6.4);
    ctx.closePath();
    ctx.fill();
    line(ctx, [[-2.4, -7.8], [-2.2, -5.8]], 0.35, 'rgba(80,40,30,0.4)');
    line(ctx, [[0.6, -7.8], [0.8, -5.6]], 0.35, 'rgba(80,40,30,0.4)');
    line(ctx, [[3.4, -8.8], [3.4, -6.4]], 0.35, 'rgba(80,40,30,0.4)');
    ctx.fillStyle = '#e8616e';
    ctx.beginPath();
    ellipsePath(ctx, 1.2, -3.4, 2.6, 1.3);
    ctx.fill();
  });
  line(ctx, [[5.4, -9.6], [6.6, -10.6]], 0.8, INK, false);

  // --- the foil wrapper, opened down to its waist
  const FT = -1.6;
  const Rn = rng(91);
  const top: Pt[] = [];
  for (let i = 0; i <= 7; i++) top.push([L - 1.0 + (i / 7) * (R + 1.6 - L), FT + (i % 2 ? -0.45 : 0.35) + (Rn() - 0.5) * 0.5]);
  for (let i = 1; i <= 3; i++) top.push([R + 0.6 + (i / 3) * (DX + 0.4), FT + (i / 3) * DY + (i % 2 ? 0.4 : -0.4)]);
  const foilPts: Pt[] = [...top, [R + DX + 1.0, B + DY + 1.0], [R + 0.6, B + 1.1], [L - 1.0, B + 1.1]];
  const foil = (c: Ctx) => roundPoly(c, foilPts, 0.7);
  shape(ctx, foil, { fill: FOIL, ink: 1.7, shadow: 'none' });
  clipTo(ctx, foil, () => {
    const g = ctx.createLinearGradient(L, FT, R, B + 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, FOIL);
    g.addColorStop(1, mix(FOIL, FOIL_SH, 0.45));
    ctx.fillStyle = g;
    ctx.fillRect(L - 3, FT - 8, R - L + DX + 6, 20);
    // side panel in shadow
    ctx.fillStyle = rgba(FOIL_SH, 0.8);
    ctx.beginPath();
    polyPath(ctx, [[R + 0.6, FT - 1], [R + DX + 3, FT + DY - 3], [R + DX + 3, B + 4], [R + 0.6, B + 4]]);
    ctx.fill();
    // printed band (blue with gold pinstripes), following the block's perspective
    const y0 = FT + 2.4, y1 = FT + 5.4;
    const side = (y: number, k: number): Pt => [R + 0.6 + k * (DX + 2), y + k * (DY - 1.4)];
    ctx.fillStyle = FOIL_BAND;
    ctx.beginPath();
    polyPath(ctx, [[L - 3, y0], [R + 0.6, y0], side(y0, 1), side(y1, 1), [R + 0.6, y1], [L - 3, y1]]);
    ctx.fill();
    ctx.fillStyle = rgba('#173b80', 0.55);
    ctx.beginPath();
    polyPath(ctx, [[R + 0.6, y0], side(y0, 1), side(y1, 1), [R + 0.6, y1]]);
    ctx.fill();
    line(ctx, [[L - 3, y0], [R + 0.6, y0], side(y0, 1)], 0.55, FOIL_GOLD, false, 0.95);
    line(ctx, [[L - 3, y1], [R + 0.6, y1], side(y1, 1)], 0.55, FOIL_GOLD, false, 0.95);
    // tiny white daisy on the band (generic, no brand)
    const dx0 = -3.0, dy0 = (y0 + y1) / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ellipsePath(ctx, dx0 + Math.cos(a) * 0.95, dy0 + Math.sin(a) * 0.95, 0.62, 0.4, a);
      ctx.fill();
    }
    ctx.fillStyle = FOIL_GOLD;
    ctx.beginPath();
    circlePath(ctx, dx0, dy0, 0.45);
    ctx.fill();
    // crinkles: small facets + creases
    for (let i = 0; i < 12; i++) {
      const x = L + Rn() * (R + DX - L), y = FT + Rn() * (B - FT);
      const a = Rn() * TAU, l = 1.4 + Rn() * 2.2;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.5)' : rgba(FOIL_DK, 0.2);
      ctx.beginPath();
      polyPath(ctx, [[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l], [x + Math.cos(a + 1.2) * l * 0.7, y + Math.sin(a + 1.2) * l * 0.7]]);
      ctx.fill();
    }
    for (const pts of [
      [[-8.6, FT + 0.2], [-8.0, B]],
      [[-2.4, FT], [-2.9, FT + 2.2]],
      [[2.6, FT], [3.2, FT + 2.4]],
      [[R + 3.6, FT - 2.2], [R + 3.2, B - 1.6]],
    ] as Pt[][]) line(ctx, pts, 0.5, FOIL_DK, true, 0.5);
    // bright vertical sheen on the front
    line(ctx, [[L + 2.4, FT + 1], [L + 2.2, B]], 1.3, '#ffffff', false, 0.7);
    // crumpled bright rim along the top
    line(ctx, top, 0.8, '#ffffff', false, 0.85);
  });
  // corner flap peeled outward (shows the foil's matte underside)
  shape(ctx, (c) => {
    c.moveTo(L - 1.0, FT + 0.2);
    c.quadraticCurveTo(L + 1.8, FT - 0.6, L + 4.0, FT - 0.2);
    c.quadraticCurveTo(L - 1.4, FT + 1.6, L - 5.4, FT + 5.0);
    c.quadraticCurveTo(L - 3.6, FT + 1.6, L - 1.0, FT + 0.2);
    c.closePath();
  }, { fill: '#c9d0dc', ink: 1.1, shadow: FOIL_SH, shadowOffset: [-0.6, -0.8], gloss: [{ x: L - 1.6, y: FT + 1.6, rx: 1.6, ry: 0.4, rot: -0.6, alpha: 0.8 }] });

  // --- near arm: an innocent little wave
  const wx = 16.8 + s * 0.6, wy = -7.2 + co * 0.6;
  hoseArm(ctx, 10.2, -5.8, wx, wy, { thick: 2.0, bend: -0.2, handR: 2.4 });
}

enemySprite('burro', 46, 52, 36, drawBurro);

// ===========================================================================
// 2. FUNGHI ABUSIVI — r13. Three brown button mushrooms grown from one clump:
//    the boss in the middle wears a tiny black fedora, his two henchmen flank
//    him (one in shades). Spore puffs drift around. (Burster: spore shots.)
// ===========================================================================

const CAP = '#8e5634';
const CAP_SH = '#5f3420';
const CAP_HI = '#c98e5e';
const STEM = '#f4e8d4';
const STEM_SH = '#cdb593';
const GILL = '#6e4a32';
const HAT = '#312d38';
const HAT_SH = '#17151c';
const HAT_BAND = '#efe1c2';
const SPORE = '#d9c79a';
const SPORE_INK = '#8a7350';

/** Mushroom: cap centre (x,y), cap radii rx/ry, stem width w down to yBot. */
function mushroom(ctx: Ctx, x: number, y: number, rx: number, ry: number, w: number, yBot: number, tilt: number, seed: number) {
  // stem (slightly bulging)
  const stem = (c: Ctx) => {
    c.moveTo(x - w * 0.42, y);
    c.bezierCurveTo(x - w * 0.62, y + (yBot - y) * 0.45, x - w * 0.56, yBot - 1.0, x - w * 0.4, yBot);
    c.quadraticCurveTo(x, yBot + 1.4, x + w * 0.42, yBot);
    c.bezierCurveTo(x + w * 0.58, yBot - 1.0, x + w * 0.62, y + (yBot - y) * 0.45, x + w * 0.42, y);
    c.closePath();
  };
  shape(ctx, stem, { fill: STEM, shadow: STEM_SH, ink: 1.6, shadowOffset: [-w * 0.24, -0.6], gloss: [{ x: x - w * 0.26, y: y + (yBot - y) * 0.5, rx: w * 0.08, ry: (yBot - y) * 0.22, alpha: 0.75 }] });
  rot(ctx, x, y, tilt, () => {
    // dark gill rim showing under the cap
    shape(ctx, (c) => ellipsePath(c, 0, ry * 0.1, rx * 0.86, ry * 0.32), { fill: GILL, ink: 1.2, shadow: 'none' });
    for (let i = -3; i <= 3; i++) line(ctx, [[i * rx * 0.1, ry * 0.32], [i * rx * 0.2, -ry * 0.02]], 0.35, '#a07c5c', false, 0.7);
    // the dome
    const dome = (c: Ctx) => {
      c.moveTo(-rx, ry * 0.12);
      c.bezierCurveTo(-rx * 1.04, -ry * 1.3, rx * 1.04, -ry * 1.3, rx, ry * 0.12);
      c.quadraticCurveTo(rx * 0.6, ry * 0.42, 0, ry * 0.28);
      c.quadraticCurveTo(-rx * 0.6, ry * 0.42, -rx, ry * 0.12);
      c.closePath();
    };
    shape(ctx, dome, {
      fill: CAP, shadow: CAP_SH, ink: 1.8, shadowOffset: [-rx * 0.22, -ry * 0.3],
      gloss: [{ x: -rx * 0.42, y: -ry * 0.56, rx: rx * 0.3, ry: ry * 0.17, rot: -0.45, alpha: 0.7 }],
    });
    clipTo(ctx, dome, () => {
      speckle(ctx, rx * 0.05, -ry * 0.35, rx * 0.8, ry * 0.5, Math.round(rx * 1.4), CAP_HI, 0.45, seed, 0.6);
      speckle(ctx, rx * 0.2, -ry * 0.2, rx * 0.8, ry * 0.5, Math.round(rx * 0.9), CAP_SH, 0.35, seed + 3, 0.45);
      // rim highlight where the cap curls under
      line(ctx, [[-rx * 0.9, ry * 0.02], [-rx * 0.4, ry * 0.2], [rx * 0.2, ry * 0.22]], 0.7, CAP_HI, true, 0.55);
    });
  });
}

/** A tiny puff of spores (3 blobs + dots). */
function sporePuff(ctx: Ctx, x: number, y: number, r: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const build = (c: Ctx) => {
    circlePath(c, x, y, r);
    circlePath(c, x - r * 0.8, y + r * 0.35, r * 0.68);
    circlePath(c, x + r * 0.75, y + r * 0.3, r * 0.62);
  };
  shape(ctx, build, { fill: SPORE, ink: 0.75, inkColor: SPORE_INK, shadow: '#b9a170', shadowOffset: [-r * 0.3, -r * 0.35] });
  ctx.fillStyle = '#6d5236';
  for (const [dx, dy] of [[-0.4, 0.1], [0.35, -0.3], [0.1, 0.45]] as Pt[]) {
    ctx.beginPath();
    circlePath(ctx, x + dx * r, y + dy * r, r * 0.16);
    ctx.fill();
  }
  ctx.restore();
}

function fedora(ctx: Ctx, x: number, y: number, tilt: number) {
  rot(ctx, x, y, tilt, () => {
    group(ctx, [
      {
        build: (c) => {
          c.moveTo(-4.6, 0.2);
          c.quadraticCurveTo(-5.2, -4.6, -2.8, -6.0);
          c.quadraticCurveTo(-0.6, -4.8, 0.6, -6.2);
          c.quadraticCurveTo(4.0, -5.6, 4.6, 0.0);
          c.closePath();
        },
        style: { fill: HAT, shadow: HAT_SH, shadowOffset: [-1.2, -0.6], gloss: [{ x: -2.8, y: -4.2, rx: 1.0, ry: 0.5, rot: -0.5, alpha: 0.4 }] },
      },
      {
        build: (c) => {
          c.moveTo(-8.2, 0.6);
          c.quadraticCurveTo(-0.6, -1.8, 8.4, 0.2);
          c.quadraticCurveTo(9.4, 2.0, 7.2, 2.0);
          c.quadraticCurveTo(-0.6, 0.9, -7.6, 2.4);
          c.quadraticCurveTo(-9.4, 2.2, -8.2, 0.6);
          c.closePath();
        },
        style: { fill: HAT, shadow: HAT_SH, shadowOffset: [-0.6, -0.8] },
      },
    ], 1.4);
    // cream band
    shape(ctx, (c) => {
      c.moveTo(-4.7, -0.4);
      c.quadraticCurveTo(0, -1.8, 4.6, -0.6);
      c.lineTo(4.5, -2.0);
      c.quadraticCurveTo(0, -3.2, -4.8, -1.8);
      c.closePath();
    }, { fill: HAT_BAND, ink: 0, shadow: 'none' });
    // pinch + pinstripes
    line(ctx, [[-1.8, -5.0], [-0.4, -4.4], [0.8, -5.2]], 0.5, '#5a5566', true, 0.9);
    for (const px of [-2.6, 0.2, 2.8]) line(ctx, [[px, -2.4], [px * 0.85, -4.8]], 0.3, '#6f6a7c', false, 0.6);
    line(ctx, [[-7.2, 1.0], [-2, 0.0]], 0.5, '#6f6a7c', false, 0.7);
  });
}

function drawFunghi(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);
  // drifting spores behind
  for (let i = 0; i < 3; i++) {
    const t = ((f / 4) + i / 3) % 1;
    const bx = [-16.2, 15.6, -7.6][i], by = [-11, -14, -22][i];
    sporePuff(ctx, bx + Math.sin(ph + i) * 0.8, by - t * 6, 1.5 + t * 0.7, 0.9 - t * 0.55);
  }

  // root clump (it hovers: rootlets dangle)
  for (const [x, l, a] of [[-7, 3.4, -0.3], [-2, 4.2, 0.1], [3.4, 3.6, 0.25], [8, 2.8, 0.5]] as [number, number, number][]) {
    const sw = Math.sin(ph + x) * 0.5;
    inkLine(ctx, [[x, 8.6], [x + a * 2 + sw, 8.6 + l * 0.6], [x + a * 3 + sw * 1.6, 8.6 + l]], 0.7, '#e9dcc2', true, 0.6);
  }
  shape(ctx, (c) => {
    c.moveTo(-14, 8.2);
    c.quadraticCurveTo(-13, 4.8, -6, 5.6);
    c.quadraticCurveTo(0, 4.4, 7, 5.8);
    c.quadraticCurveTo(14, 5.4, 14.6, 8.4);
    c.quadraticCurveTo(7, 11.4, 0, 10.6);
    c.quadraticCurveTo(-8, 11.4, -14, 8.2);
    c.closePath();
  }, { fill: '#7a5538', shadow: '#55372a', ink: 1.6, shadowOffset: [-1.4, -1.2] });
  speckle(ctx, 0, 8.4, 12, 1.8, 14, '#a07650', 0.4, 9, 0.8);

  const bob = [0, -0.4, 0, 0.4][f];
  // left henchman (behind)
  mushroom(ctx, -12.4, -4.8 + bob * 0.5, 6.6, 4.8, 6.4, 8.0, -0.18 + s * 0.04, 21);
  eye(ctx, -14.4, 1.8, 1.45, { look: [0.4, 0.1], lid: 'angry-l', pupil: 0.58 });
  eye(ctx, -10.8, 1.7, 1.55, { look: [0.4, 0.1], lid: 'angry-r', pupil: 0.58 });
  line(ctx, [[-13.6, 5.0], [-12.4, 4.4], [-11.0, 5.0]], 0.8, INK, true);

  // the boss (middle)
  mushroom(ctx, -0.6, -13.6 + bob, 12.2, 8.0, 11.6, 7.6, 0.04 + s * 0.03, 11);
  fedora(ctx, 1.2, -21.2 + bob, -0.22 + s * 0.03);
  // face on the stem: heavy-lidded don
  const fy = -6.0 + bob * 0.5;
  eye(ctx, -2.8, fy, 2.35, { look: [0.45, 0.15], lid: 'half', pupil: 0.6 });
  eye(ctx, 3.0, fy - 0.1, 2.55, { look: [0.45, 0.15], lid: 'half', pupil: 0.6 });
  brow(ctx, -3.0, fy - 3.4, 4.2, 0.42, 1.5);
  brow(ctx, 3.3, fy - 3.6, 4.4, -0.42, 1.5);
  // jowly frown + pencil moustache
  shape(ctx, (c) => {
    c.moveTo(-3.2, fy + 3.8);
    c.quadraticCurveTo(0.4, fy + 2.2, 4.2, fy + 3.6);
    c.quadraticCurveTo(0.4, fy + 3.4, -3.2, fy + 3.8);
    c.closePath();
  }, { fill: '#3a2418', ink: 0.6, shadow: 'none' });
  line(ctx, [[-2.2, fy + 6.2], [0.6, fy + 5.0], [3.4, fy + 6.0]], 1.0, INK, true);
  line(ctx, [[-4.6, fy + 4.4], [-3.8, fy + 6.8]], 0.55, STEM_SH, true, 0.9);
  line(ctx, [[5.6, fy + 4.2], [5.0, fy + 6.6]], 0.55, STEM_SH, true, 0.9);

  // right henchman (front) in shades
  mushroom(ctx, 11.6, -1.4 + bob * 0.5, 7.0, 5.0, 6.8, 9.2, 0.2 + s * 0.05, 31);
  shape(ctx, (c) => {
    c.moveTo(8.6, 3.6);
    c.lineTo(15.2, 3.2);
    c.quadraticCurveTo(15.0, 5.8, 13.2, 5.8);
    c.quadraticCurveTo(12.0, 5.6, 12.0, 4.4);
    c.quadraticCurveTo(11.6, 6.0, 10.2, 5.8);
    c.quadraticCurveTo(8.6, 5.6, 8.6, 3.6);
    c.closePath();
  }, { fill: '#1d1a22', ink: 0.8, shadow: 'none', gloss: [{ x: 10.0, y: 4.2, rx: 0.8, ry: 0.35, alpha: 0.7 }, { x: 13.5, y: 4.0, rx: 0.8, ry: 0.35, alpha: 0.7 }] });
  line(ctx, [[10.4, 7.4], [12.2, 7.0], [13.6, 7.6]], 0.75, INK, true);

  // spores in front
  for (let i = 0; i < 3; i++) {
    const t = ((f / 4) + i / 3 + 0.17) % 1;
    const bx = [17.4, -17.0, 9.6][i], by = [-6, 3, -23][i];
    sporePuff(ctx, bx + Math.cos(ph + i * 2) * 0.7, by - t * 5, 1.2 + t * 0.6, 0.95 - t * 0.6);
  }
}

enemySprite('funghi', 46, 50, 34, drawFunghi);

// ===========================================================================
// 3. PROSCIUTTO IMPOSTORE — r14. Plain cooked ham pretending to be guanciale:
//    wrapped in a ham-slice cloak (white fat rim) with the collar pulled up
//    over its mouth and a fake name sticker on its chest. Shifty, sweaty, fast.
// ===========================================================================

const HAM = '#f4a2a7';
const HAM_SH = '#d6707d';
const HAM_HI = '#ffd3d0';
const HAM_DK = '#b9505f';
const FAT = '#fff4ee';
const FAT_SH = '#efc9c4';
const RIND = '#dda56a';
const TAG_RED = '#d23a3f';
const TAG = '#fdf8ee';

/**
 * White fat rim along a ham edge, drawn inside the clip of the ham shape. `centre` points inward.
 * inner = true for an edge that lies inside the shape (an overlapping flap): the band then sits
 * wholly on the inner side and the edge itself gets a fine ink line.
 */
function fatRim(ctx: Ctx, pts: Pt[], w: number, centre: Pt, inner = false) {
  const toward = (p: Pt, k: number): Pt => {
    const dx = centre[0] - p[0], dy = centre[1] - p[1], d = Math.hypot(dx, dy) || 1;
    return [p[0] + (dx / d) * k, p[1] + (dy / d) * k];
  };
  const band = inner ? pts.map((p) => toward(p, w * 0.5)) : pts;
  line(ctx, band, w, FAT, true);
  // soft shading on the inner side of the fat + the thin golden rind at the very edge
  line(ctx, band.map((p) => toward(p, w * 0.42)), w * 0.3, FAT_SH, true, 0.85);
  line(ctx, pts, w * 0.42, RIND, true, 0.9);
  if (inner) line(ctx, pts.map((p) => toward(p, -w * 0.2)), 0.6, INK, true, 0.8);
}

function drawProsciutto(ctx: Ctx, f: number) {
  ctx.save();
  ctx.translate(2.6, -0.6);
  const { ph } = cyc(f);
  const w = (k: number) => Math.sin(ph + k) * 1.4;

  // --- the ham-slice cloak: high collar behind the head, streaming out behind as it runs
  const flare: Pt[] = [
    [-1.6, -15.4], [-5.8, -20.6], [-9.0, -26.2], [-11.6, -20.4], [-16.6, -15.0 + w(0) * 0.5], [-21.0, -8.0 + w(0.7)],
    [-19.0, -2.4 + w(1.4)], [-21.2, 3.6 + w(2.1)], [-16.0, 4.0 + w(2.8)], [-16.6, 9.8 + w(3.5) * 0.7], [-10.6, 7.4],
    [-6.6, 9.6], [-3.6, 1.0],
  ];
  const flareB = (c: Ctx) => smoothPath(c, flare, true, 0.42);
  shape(ctx, flareB, { fill: mix(HAM, HAM_SH, 0.18), shadow: HAM_SH, ink: 2.0, shadowOffset: [-2.4, -2.8], gloss: [{ x: -15.6, y: -11.6, rx: 1.0, ry: 3.0, rot: 0.6, alpha: 0.4 }] });
  clipTo(ctx, flareB, () => {
    for (const pts of [
      [[-8.6, -14.4], [-13.4, -9.4], [-13.0, -3.2]],
      [[-16.6, -7.0], [-17.2, -1.0], [-14.6, 2.6]],
      [[-8.6, -21.4], [-9.4, -16.6]],
    ] as Pt[][]) line(ctx, pts, 0.85, HAM_HI, true, 0.75);
    speckle(ctx, -13, -4, 6, 9, 12, HAM_DK, 0.32, 47, 0.3);
    fatRim(ctx, flare.slice(1, 12), 3.4, [-9, -4]);
  });

  // --- running legs
  legs(ctx, 0.8, 6.2, f, { len: 4.6, spread: 8.2, thick: 2.8, color: LIMB, shoe: SHOE, stride: 4.6 });

  // --- the head (lighter ham, marbled), peeking over the collar
  const hx = 3.2, hy = -18.4;
  const head = (c: Ctx) => ellipsePath(c, hx, hy, 8.4, 8.6);
  shape(ctx, head, {
    fill: radial(ctx, hx - 3, hy - 4, 12, [[0, '#ffd9d6'], [0.45, '#f8b2b5'], [1, HAM]]),
    shadow: HAM_SH, ink: 2.0, shadowOffset: [-2.4, -2.0],
    gloss: [{ x: hx - 3.8, y: hy - 4.8, rx: 2.6, ry: 1.3, rot: -0.6, alpha: 0.65 }],
  });
  clipTo(ctx, head, () => {
    line(ctx, [[hx - 7, hy - 2], [hx - 3.6, hy - 0.6], [hx - 3.2, hy + 4]], 0.8, HAM_HI, true, 0.8);
    speckle(ctx, hx, hy, 7, 7, 10, HAM_DK, 0.3, 51, 0.3);
    // the slice's fat edge across the top, like a slicked comb-over
    const arc: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (1.08 + i * 0.075);
      arc.push([hx + Math.cos(a) * 8.4, hy + Math.sin(a) * 8.6]);
    }
    fatRim(ctx, arc, 6.0, [hx, hy]);
  });

  // --- shifty eyes (sliding right), one brow up, sweat
  eye(ctx, hx - 2.8, hy - 1.6, 2.4, { look: [0.6, 0.0], pupil: 0.55 });
  eye(ctx, hx + 3.4, hy - 1.8, 2.6, { look: [0.6, 0.0], pupil: 0.55 });
  brow(ctx, hx - 3.0, hy - 5.6, 4.0, -0.32, 1.25); // raised, worried
  brow(ctx, hx + 3.8, hy - 5.2, 4.2, -0.38, 1.25); // pulled down: sly
  sweat(ctx, hx - 8.8, hy - 4.8 + [0, 0.7, 1.4, 0.7][f], 1.3);

  // --- the cloak body (one big folded ham slice), fat rim at the hem and front edge
  const cloak: Pt[] = [
    [-7.0, -12.6], [-1.0, -11.8], [7.0, -12.4], [11.6, -10.6], [12.6, -3.0], [11.8, 4.6], [6.8, 7.8], [-1.0, 8.6], [-7.8, 7.8], [-10.8, 4.0], [-10.0, -5.6],
  ];
  const cloakB = (c: Ctx) => smoothPath(c, cloak, true, 0.5);
  shape(ctx, cloakB, {
    fill: HAM, shadow: HAM_SH, ink: 2.1, shadowOffset: [-3.0, -2.4],
    gloss: [{ x: -7.6, y: -5.6, rx: 1.0, ry: 3.2, rot: 0.15, alpha: 0.45 }],
  });
  clipTo(ctx, cloakB, () => {
    // overlapping front flap edge + hem: the slice's white fat rim
    fatRim(ctx, [[6.4, -12.0], [7.6, -4.0], [7.0, 2.6], [5.0, 9.4]], 2.4, [-4, -2], true);
    fatRim(ctx, [[-12.0, 4.6], [-7.8, 8.2], [-1.0, 9.0], [6.8, 8.2], [12.4, 4.8]], 2.6, [0, -4]);
    // marbling (connective-tissue seams) + meat grain
    line(ctx, [[-8.6, -8.4], [-5.2, -6.2], [-4.6, -1.0], [-7.0, 3.4]], 0.9, HAM_HI, true, 0.75);
    line(ctx, [[8.4, -8.6], [10.6, -4.0], [9.8, 1.6]], 0.8, HAM_HI, true, 0.65);
    speckle(ctx, 0, -2, 10, 8, 18, HAM_DK, 0.3, 53, 0.28);
  });

  // --- near collar flap, pulled up over the mouth (fat rim along its top)
  const nearCol = (c: Ctx) => {
    c.moveTo(-4.4, -10.8);
    c.quadraticCurveTo(-3.6, -14.6, 0.4, -14.6);
    c.quadraticCurveTo(6.6, -14.2, 13.6, -17.4);
    c.quadraticCurveTo(13.6, -12.4, 11.6, -9.6);
    c.quadraticCurveTo(3.4, -9.0, -4.4, -10.8);
    c.closePath();
  };
  shape(ctx, nearCol, { fill: HAM, shadow: HAM_SH, ink: 1.8, shadowOffset: [-1.2, -1.6] });
  clipTo(ctx, nearCol, () => {
    fatRim(ctx, [[-4.0, -13.4], [-1.0, -15.0], [6.6, -14.6], [13.8, -17.6]], 2.6, [4, -9]);
    line(ctx, [[0.0, -11.2], [5.4, -11.6], [10.4, -11.4]], 0.7, HAM_HI, true, 0.7);
  });

  // --- the fake label: a "hello, my name is…" sticker with an illegible scrawl
  rot(ctx, 0.6, -3.6, -0.14, () => {
    const tag = (c: Ctx) => roundPoly(c, [[-4.8, -3.2], [4.8, -3.2], [4.8, 3.2], [-4.8, 3.2]], 1.0);
    shape(ctx, tag, { fill: TAG, ink: 0.95, shadow: '#e6dccb', shadowOffset: [-0.6, -0.6] });
    clipTo(ctx, tag, () => {
      ctx.fillStyle = TAG_RED;
      ctx.fillRect(-5, -3.4, 10, 2.6);
      line(ctx, [[-3.0, -2.0], [-2.0, -2.3], [-1.0, -1.9], [0.2, -2.3], [1.4, -1.9], [2.8, -2.2]], 0.35, '#ffffff', false, 0.9);
      line(ctx, [[-3.6, 1.0], [-2.6, -0.1], [-1.8, 1.4], [-0.8, 0.0], [0.2, 1.3], [1.2, 0.1], [2.2, 1.2], [3.4, 0.4]], 0.55, '#2a2a3a', true, 0.95);
      line(ctx, [[-3.2, 2.3], [3.0, 2.0]], 0.35, '#2a2a3a', false, 0.6);
    });
  });

  // --- near hand, out of the cloak's opening, clutching the collar closed
  mitt(ctx, 10.8, -11.6, 2.5);
  line(ctx, [[9.4, -12.6], [10.2, -10.2]], 0.5, '#c9cede', false, 0.9);
  ctx.restore();
}

enemySprite('prosciutto', 48, 50, 34, drawProsciutto);

// ===========================================================================
// 4. BROCCOLO AMERICANO — r15. A dark-green floret head in a red baseball cap,
//    dunked in "Alfredo" cream that drips off the top; pale stalk body, white
//    sneakers. Swings a floret underhand to lob it. (Lobber: florets → cream puddles.)
// ===========================================================================

const BROC = '#3e8c39';
const BROC_SH = '#235f2a';
const BROC_HI = '#79bd57';
const BROC_DK = '#1b4a21';
const STALK = '#a9d273';
const STALK_SH = '#73a24b';
const STALK_LN = '#5f8a3c';
const CREAM = '#fff4d8';
const CREAM_SH = '#e6d09c';
const CAP_RED = '#d8363e';
const CAP_RED_SH = '#9a1d2a';
const SNEAKER = '#f7f4ec';

/** A cluster of floret bumps (each with its own cel shading) under one unified outline. */
function floret(ctx: Ctx, bumps: [number, number, number][], ink: number, seed: number) {
  group(ctx, bumps.map(([x, y, r]) => ({
    build: (c: Ctx) => circlePath(c, x, y, r),
    style: { fill: BROC, shadow: BROC_SH, shadowOffset: [-r * 0.32, -r * 0.36] as Pt },
  })), ink);
  // bud texture
  const R = rng(seed);
  for (const [x, y, r] of bumps) {
    ctx.save();
    ctx.beginPath();
    circlePath(ctx, x, y, r);
    ctx.clip();
    const n = Math.round(r * 2.2);
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * r * 0.9;
      const bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d;
      const lit = (bx - x) + (by - y) < -r * 0.2;
      ctx.fillStyle = lit ? rgba(BROC_HI, 0.85) : rgba(BROC_DK, 0.55);
      ctx.beginPath();
      circlePath(ctx, bx, by, r * (0.12 + R() * 0.08));
      ctx.fill();
    }
    ctx.restore();
  }
}

const CROWN: [number, number, number][] = [
  [-10.6, -26.4, 6.4], [-3.2, -30.2, 6.6], [5.0, -29.8, 6.4], [11.6, -24.6, 6.2],
  [-14.4, -19.6, 5.6], [14.4, -17.6, 5.2],
  [-8.2, -20.6, 7.2], [0.8, -23.4, 8.0], [8.8, -18.8, 7.0], [-2.4, -16.0, 6.4], [5.2, -14.0, 5.6], [-10.2, -14.2, 4.8],
];

function drawBroccoli(ctx: Ctx, f: number) {
  const { c: co } = cyc(f);

  // --- legs (stalk green) + sneakers
  legs(ctx, 0.6, 6.0, f, { len: 5.4, spread: 9.4, thick: 3.2, color: STALK, shoe: SNEAKER, stride: 3.8 });

  // --- far arm on the hip
  inkLine(ctx, [[-6.2, -6.4], [-11.0, -3.4], [-8.6, 0.6]], 2.4, STALK, true, 1.0);
  ball(ctx, -8.4, 0.6, 1.9, STALK, STALK_SH, 1.0, 0.4);

  // --- stalk body
  const stalk = (c: Ctx) => {
    c.moveTo(-6.2, -14);
    c.quadraticCurveTo(-7.8, -2, -7.4, 5.0);
    c.quadraticCurveTo(0.6, 8.6, 8.2, 5.0);
    c.quadraticCurveTo(8.6, -2, 6.8, -14);
    c.closePath();
  };
  shape(ctx, stalk, { fill: STALK, shadow: STALK_SH, ink: 2.0, shadowOffset: [-2.6, -1.2], gloss: [{ x: -4.4, y: -3, rx: 0.9, ry: 4.2, alpha: 0.5 }] });
  clipTo(ctx, stalk, () => {
    for (const x of [-3.6, 0.4, 4.2]) line(ctx, [[x, -12], [x - 0.4, -2], [x * 1.1, 6]], 0.6, STALK_LN, true, 0.45);
    // little cut branch stub
    shape(ctx, (c) => ellipsePath(c, -5.6, -3.4, 1.5, 1.0, 0.4), { fill: '#d4ecae', ink: 0.7, inkColor: STALK_LN, shadow: 'none' });
  });

  // --- the floret head (+ cream, face and cap), sat a little lower on the stalk
  ctx.save();
  ctx.translate(0, 2.2);
  floret(ctx, CROWN, 2.2, 7);

  // --- cream sauce poured over the top, dripping down the left
  const dl = [0, 0.8, 1.6, 0.8][f];
  const lipY = (x: number) => -25.2 + ((x + 16.0) / 16.4) * -6.6;
  const cream = (c: Ctx) => {
    c.moveTo(-16.0, lipY(-16.0));
    dripAt(c, -13.6, lipY(-13.6), 2.4, 7.4 + dl);
    dripAt(c, -8.8, lipY(-8.8), 2.0, 4.4 + dl * 0.6);
    dripAt(c, -4.2, lipY(-4.2), 1.7, 2.6 + dl * 0.3);
    c.lineTo(0.4, lipY(0.4));
    // back over the top of the bumps
    c.quadraticCurveTo(0.2, -35.4, -3.4, -36.2);
    c.quadraticCurveTo(-7.8, -36.8, -10.8, -32.8);
    c.quadraticCurveTo(-15.4, -31.6, -16.6, -27.6);
    c.quadraticCurveTo(-17.0, -26.0, -16.0, lipY(-16.0));
    c.closePath();
  };
  shape(ctx, cream, {
    fill: CREAM, shadow: CREAM_SH, ink: 1.2, shadowOffset: [-1.0, -1.3],
    gloss: [
      { x: -8.6, y: -34.0, rx: 2.6, ry: 0.9, rot: -0.55, alpha: 0.95 },
      { x: -14.2, y: -22.0 + dl, rx: 0.45, ry: 1.3, alpha: 0.85 },
    ],
  });
  // flecks of black pepper / herbs in the sauce
  speckle(ctx, -7.4, -32.4, 5.4, 2.4, 6, '#4a3a2a', 0.28, 23, 0.7);

  // --- face on the floret head: angry snarl
  eye(ctx, 0.6, -21.0, 2.7, { look: [0.42, 0.12], lid: 'angry-l', pupil: 0.55 });
  eye(ctx, 7.6, -21.2, 2.9, { look: [0.42, 0.12], lid: 'angry-r', pupil: 0.55 });
  brow(ctx, 0.4, -25.0, 4.6, 0.42, 1.5, BROC_DK);
  brow(ctx, 8.0, -25.3, 4.9, -0.42, 1.5, BROC_DK);
  const mouthB = (c: Ctx) => {
    c.moveTo(0.4, -15.6);
    c.quadraticCurveTo(4.6, -17.4, 9.6, -16.2);
    c.quadraticCurveTo(8.2, -11.6, 4.4, -11.8);
    c.quadraticCurveTo(1.0, -12.2, 0.4, -15.6);
    c.closePath();
  };
  shape(ctx, mouthB, { fill: '#5b1320', ink: 1.1, shadow: 'none' });
  clipTo(ctx, mouthB, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(-1, -17);
    ctx.quadraticCurveTo(4.6, -18.8, 11, -17.4);
    ctx.lineTo(11, -14.8);
    ctx.quadraticCurveTo(4.6, -16, -1, -14.4);
    ctx.closePath();
    ctx.fill();
    for (const tx of [2.6, 4.8, 7.0]) line(ctx, [[tx, -17.6], [tx, -14.6]], 0.35, 'rgba(80,40,30,0.45)');
    ctx.fillStyle = '#e8616e';
    ctx.beginPath();
    ellipsePath(ctx, 5.4, -11.8, 2.6, 1.3);
    ctx.fill();
  });

  // --- red baseball cap, visor forward
  rot(ctx, 4.4, -31.4, 0.12, () => {
    group(ctx, [
      {
        build: (c) => {
          c.moveTo(-7.4, 1.0);
          c.bezierCurveTo(-7.6, -5.6, 6.6, -6.6, 7.2, 0.4);
          c.quadraticCurveTo(0, 2.0, -7.4, 1.0);
          c.closePath();
        },
        style: { fill: CAP_RED, shadow: CAP_RED_SH, shadowOffset: [-1.6, -1.0], gloss: [{ x: -3.2, y: -3.2, rx: 1.8, ry: 0.8, rot: -0.4, alpha: 0.55 }] },
      },
      {
        build: (c) => {
          c.moveTo(4.6, -0.6);
          c.quadraticCurveTo(10.8, -1.2, 13.2, 1.0);
          c.quadraticCurveTo(10.6, 2.8, 5.2, 1.8);
          c.closePath();
        },
        style: { fill: CAP_RED, shadow: CAP_RED_SH, shadowOffset: [-0.4, -1.0] },
      },
    ], 1.5);
    line(ctx, [[5.6, 1.4], [12.4, 1.4]], 0.6, CAP_RED_SH, true, 0.9);
    // white star on the front panel + top button + seams
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TAU;
      const r = i % 2 ? 0.75 : 1.75;
      const px = 2.0 + Math.cos(a) * r, py = -2.0 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    line(ctx, [[-1.6, -4.4], [-3.4, 0.6]], 0.45, CAP_RED_SH, false, 0.8);
    ball(ctx, -0.6, -4.9, 0.8, CAP_RED, CAP_RED_SH, 0.6, 0.5);
  });

  ctx.restore();

  // --- near arm: winds a floret back, then forward to lob it
  const sx = 7.0, sy = -7.0;
  const hx = [15.0, 12.8, 11.2, 16.4][f], hy = [-1.0, 2.0, 3.6, -5.4][f] + co * 0.2;
  inkLine(ctx, [[sx, sy], [(sx + hx) / 2 + 2.0, (sy + hy) / 2 + 1.0], [hx, hy]], 2.4, STALK, true, 1.0);
  // the floret to throw: little stalk in the fist, crown on top
  shape(ctx, (c) => roundPoly(c, [[hx - 1.1, hy - 4.6], [hx + 1.1, hy - 4.6], [hx + 1.0, hy - 0.4], [hx - 1.0, hy - 0.4]], 0.6), { fill: STALK, ink: 0.9, shadow: STALK_SH, shadowOffset: [-0.5, -0.3] });
  floret(ctx, [[hx - 2.4, hy - 6.0, 2.9], [hx + 2.4, hy - 6.2, 2.8], [hx, hy - 8.6, 3.1], [hx, hy - 5.4, 2.6]], 1.25, 17);
  ball(ctx, hx, hy - 0.4, 2.0, STALK, STALK_SH, 1.0, 0.4);
}

enemySprite('broccoli', 50, 58, 40, drawBroccoli);

// ===========================================================================
// 5. GAMBERO SALTATORE — r12. A coral-pink shrimp curled into a C like a
//    spring, in swim goggles, long antennae streaming back. The tail fan flips
//    every frame. (Leaper.)
// ===========================================================================

const SHR = '#ff8a6a';
const SHR_SH = '#df5449';
const SHR_HI = '#ffc6a6';
const SHR_BAND = '#fff1e4';
const SHR_TIP = '#d8333a';
const GOG = '#2a86d4';
const LENS = '#8ee2f4';

function drawGamberi(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);
  const flip = [0, 1, 0, -1][f];
  const cx = -2.8, cy = -2.7, Rr = 9.2 + flip * 0.25;
  const a0 = -1.0, a1 = 1.30 + flip * 0.08; // spine angles: head (top-right) → around the back → tail (bottom-right)
  const N = 9;
  const spine: Pt[] = [];
  const widths: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = a0 - t * (TAU - (a1 - a0));
    spine.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]);
    widths.push(10.6 - t * 6.0);
  }

  // --- antennae (behind), streaming back over the body
  const sw = s * 0.8;
  inkLine(ctx, [[10.4, -17.0], [7, -21.4 + sw * 0.3], [-1.6, -22.4 + sw * 0.5], [-10.8, -19.8 + sw]], 0.55, SHR_SH, true, 0.55);
  inkLine(ctx, [[11.4, -16.6], [10.2, -20.6 - sw * 0.3], [4.0, -22.6 - sw * 0.4], [-4.8, -22.6 - sw * 0.6]], 0.5, SHR_SH, true, 0.5);

  // --- tail fan (at the end of the spine, flips)
  const tp = spine[N], tq = spine[N - 1];
  const ta = Math.atan2(tp[1] - tq[1], tp[0] - tq[0]) + [0, -0.34, 0, 0.16][f];
  rot(ctx, tp[0], tp[1], ta, () => {
    const lobe = (ang: number, len: number, wid: number) => (c: Ctx) => {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const P = (x: number, y: number): Pt => [x * ca - y * sa, x * sa + y * ca];
      const pts: Pt[] = [P(-0.6, 0), P(len * 0.45, -wid), P(len, -wid * 0.35), P(len * 1.02, wid * 0.35), P(len * 0.45, wid), P(-0.6, 0.2)];
      smoothPath(c, pts, true, 0.5);
    };
    group(ctx, [
      { build: lobe(-0.5, 7.6, 2.6), style: { fill: SHR, shadow: SHR_SH, shadowOffset: [-0.6, -0.8] } },
      { build: lobe(0.5, 7.6, 2.6), style: { fill: SHR, shadow: SHR_SH, shadowOffset: [-0.6, -0.8] } },
      { build: lobe(0, 8.6, 2.4), style: { fill: SHR, shadow: SHR_SH, shadowOffset: [-0.6, -0.8], gloss: [{ x: 3.2, y: -0.6, rx: 1.6, ry: 0.5, alpha: 0.6 }] } },
    ], 1.3);
    // red tips
    for (const ang of [-0.5, 0, 0.5]) {
      const L = ang === 0 ? 8.6 : 7.6;
      ctx.save();
      ctx.beginPath();
      ellipsePath(ctx, Math.cos(ang) * (L - 1.0), Math.sin(ang) * (L - 1.0), 1.4, 1.3, ang);
      ctx.fillStyle = rgba(SHR_TIP, 0.8);
      ctx.fill();
      ctx.restore();
    }
  });

  // --- the curled body
  const outline = ribbon(spine, widths);
  const bodyB = (c: Ctx) => smoothPath(c, outline, true, 0.5);
  shape(ctx, bodyB, { fill: SHR, shadow: SHR_SH, ink: 2.0, shadowOffset: [-2.0, -2.4], gloss: [{ x: -9.8, y: -6.8, rx: 1.2, ry: 3.4, rot: 0.5, alpha: 0.55 }] });
  clipTo(ctx, bodyB, () => {
    // segment plates: a pale band behind each joint + a joint line
    for (let i = 1; i < N; i += 1) {
      if (i % 2 === 0 && i < N - 1) continue;
      const t = i / N;
      const a = a0 - t * (TAU - (a1 - a0));
      const wv = widths[i] * 0.62;
      const ox = Math.cos(a), oy = Math.sin(a);
      const p: Pt = [cx + ox * Rr, cy + oy * Rr];
      const inner: Pt = [p[0] - ox * wv, p[1] - oy * wv];
      const outer: Pt = [p[0] + ox * wv, p[1] + oy * wv];
      // band just behind the joint (toward the tail)
      const da = -0.16;
      const q: Pt = [cx + Math.cos(a + da) * Rr, cy + Math.sin(a + da) * Rr];
      line(ctx, [[q[0] + Math.cos(a + da) * wv, q[1] + Math.sin(a + da) * wv], q], 1.6, SHR_BAND, false, 0.75);
      line(ctx, [outer, inner], 0.7, SHR_SH, false, 0.95);
    }
    // inner (belly) side darker
    ctx.beginPath();
    ctx.arc(cx, cy, Rr - 2.6, 0, TAU);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = rgba(SHR_SH, 0.45);
    ctx.stroke();
    // vein-line highlight along the back
    ctx.beginPath();
    ctx.arc(cx, cy, Rr + 2.4, a1 - 0.2 + TAU, a0 + TAU, true);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = rgba(SHR_HI, 0.85);
    ctx.stroke();
  });

  // --- little paddling legs on the belly, poking into the curl
  for (let i = 2; i <= 6; i++) {
    const t = i / N;
    const a = a0 - t * (TAU - (a1 - a0));
    const r0 = Rr - widths[i] * 0.5 + 0.9;
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0;
    const la = a + Math.PI + 0.55 + Math.sin(ph + i * 1.4) * 0.28;
    inkLine(ctx, [[x0, y0], [x0 + Math.cos(la) * 3.4, y0 + Math.sin(la) * 3.4]], 0.85, SHR_HI, false, 0.55);
  }

  // --- head (carapace) with rostrum spike — a bit oversized (chibi)
  const hx = 6.4, hy = -13.2;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(1.1, 1.1);
  ctx.translate(-hx, -hy);
  const head = (c: Ctx) => {
    c.moveTo(hx - 6.6, hy + 2.6);
    c.bezierCurveTo(hx - 7.2, hy - 4.4, hx + 2.0, hy - 7.4, hx + 6.2, hy - 3.0);
    c.lineTo(hx + 9.2, hy - 5.2); // rostrum
    c.lineTo(hx + 6.8, hy - 0.8);
    c.bezierCurveTo(hx + 7.6, hy + 3.6, hx + 3.6, hy + 6.4, hx - 0.4, hy + 6.0);
    c.bezierCurveTo(hx - 4.2, hy + 5.6, hx - 6.4, hy + 4.6, hx - 6.6, hy + 2.6);
    c.closePath();
  };
  shape(ctx, head, { fill: SHR, shadow: SHR_SH, ink: 2.0, shadowOffset: [-2.0, -2.0], gloss: [{ x: hx - 2.6, y: hy - 3.6, rx: 2.4, ry: 1.2, rot: -0.4, alpha: 0.6 }] });
  clipTo(ctx, head, () => {
    line(ctx, [[hx - 5.6, hy + 0.8], [hx - 1.0, hy - 1.6], [hx + 5.4, hy - 2.0]], 0.6, SHR_HI, true, 0.8);
    speckle(ctx, hx, hy + 1, 6, 4, 8, SHR_SH, 0.3, 61, 0.5);
  });

  // --- swim goggles: strap round the head, two lenses
  line(ctx, [[hx - 6.4, hy - 1.6], [hx - 1, hy - 3.4], [hx + 2, hy - 3.2]], 2.6, INK, true);
  line(ctx, [[hx - 6.4, hy - 1.6], [hx - 1, hy - 3.4], [hx + 2, hy - 3.2]], 1.4, GOG, true);
  const lens = (x: number, y: number, r: number) => {
    shape(ctx, (c) => circlePath(c, x, y, r + 1.4), { fill: GOG, ink: 1.0, shadow: '#195a9e', shadowOffset: [-0.5, -0.6], gloss: [{ x: x - r * 0.8, y: y - r * 0.9, rx: r * 0.35, ry: r * 0.18, rot: -0.6, alpha: 0.7 }] });
    eye(ctx, x, y, r, { look: [0.45, 0.12], lid: 'angry-' + (x < hx + 4 ? 'l' : 'r') as 'angry-l' | 'angry-r', pupil: 0.55, sclera: '#f4fcff', ink: 0.7 });
    wash(ctx, (c) => circlePath(c, x, y, r), LENS, 0.28);
    glint(ctx, x - r * 0.4, y - r * 0.45, r * 0.32, r * 0.18, -0.6, 0.95);
  };
  line(ctx, [[hx + 2.0, hy - 2.6], [hx + 3.8, hy - 2.8]], 1.4, GOG, false);
  lens(hx + 0.8, hy - 2.2, 2.2);
  lens(hx + 6.2, hy - 2.6, 2.4);
  brow(ctx, hx + 0.8, hy - 6.4, 3.6, 0.4, 1.15);
  brow(ctx, hx + 6.2, hy - 6.8, 3.8, -0.4, 1.15);

  // --- mouth: "wheee!" toothy grin under the goggles
  const m = (c: Ctx) => {
    c.moveTo(hx + 1.4, hy + 2.0);
    c.quadraticCurveTo(hx + 4.6, hy + 2.8, hx + 7.4, hy + 1.0);
    c.quadraticCurveTo(hx + 6.6, hy + 5.4, hx + 3.8, hy + 5.0);
    c.quadraticCurveTo(hx + 1.8, hy + 4.6, hx + 1.4, hy + 2.0);
    c.closePath();
  };
  shape(ctx, m, { fill: '#5b1320', ink: 0.9, shadow: 'none' });
  clipTo(ctx, m, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 1.2);
    ctx.quadraticCurveTo(hx + 4.6, hy + 2.2, hx + 8, hy + 0.2);
    ctx.lineTo(hx + 8, hy + 2.4);
    ctx.quadraticCurveTo(hx + 4.6, hy + 4.0, hx, hy + 3.0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8616e';
    ctx.beginPath();
    ellipsePath(ctx, hx + 4.4, hy + 5.0, 1.8, 1.0);
    ctx.fill();
  });

  ctx.restore();
}

enemySprite('gamberi', 44, 40, 26, drawGamberi);

// ===========================================================================
// FX — butter slick (enemy hazard 'butter')
// ===========================================================================

fx('fx.butter_puddle', 76, 56, (ctx) => {
  puddle(ctx, 31, 20, 47, { base: '#f8d867', rim: '#b7861f', glossA: 0.9, satellites: 4 });
  // milky foam where the butter melts (clusters of tiny bubbles at the rim)
  const R = rng(48);
  for (const [cx, cy, n] of [[-18, 6, 7], [16, -9, 6], [20, 7, 5], [-12, -11, 5]] as [number, number, number][]) {
    for (let i = 0; i < n; i++) {
      const x = cx + (R() - 0.5) * 7, y = cy + (R() - 0.5) * 3.6, r = 0.7 + R() * 1.0;
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, x, y, r);
      ctx.fillStyle = rgba('#fffbe8', 0.85);
      ctx.fill();
      ctx.lineWidth = 0.35;
      ctx.strokeStyle = rgba('#c9a040', 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }
  // a swirl of golden melt
  ctx.save();
  ctx.strokeStyle = rgba('#e4b02c', 0.55);
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(-2, 3, 17, 8, 0.08, 0.4, Math.PI * 1.25);
  ctx.stroke();
  ctx.restore();
  // the half-melted pat in the middle, slumping into the slick
  rot(ctx, 3, -1, -0.18, () => {
    const pat = (c: Ctx) => {
      c.moveTo(-8.4, 1.8);
      c.quadraticCurveTo(-9.0, -4.2, -6.2, -4.8);
      c.lineTo(5.6, -5.4);
      c.quadraticCurveTo(8.8, -5.0, 8.4, -1.0);
      c.quadraticCurveTo(9.6, 3.4, 6.0, 4.0);
      c.quadraticCurveTo(0, 6.2, -5.4, 4.6);
      c.quadraticCurveTo(-9.6, 4.6, -8.4, 1.8);
      c.closePath();
    };
    S(ctx, pat, {
      fill: radial(ctx, -3, -3, 12, [[0, '#fffbe0'], [0.5, '#fde98f'], [1, '#efc75a']]),
      ink: 1.1, inkColor: '#a8791c', shadow: '#e2b648', shadowOffset: [-1.4, -1.6],
      gloss: [{ x: -3.6, y: -2.6, rx: 3.4, ry: 1.0, rot: -0.1, alpha: 0.9 }],
    });
    // top face edge (the pat is a soft block seen from above)
    line(ctx, [[-6.4, 1.8], [-1, 2.6], [6.6, 1.2]], 0.6, rgba('#c99a30', 0.7), true);
    glint(ctx, 5.4, -2.6, 1.2, 0.5, -0.2, 0.85);
  });
}, { res: 2 });

// ===========================================================================
// ENEMY SHOTS (DANGER style)
// ===========================================================================

danger('proj.e_spore', 12, (ctx) => {
  // a soft, dusty puff of mushroom spores (lighter cloud, dark spore specks, a few strays around it)
  const puffs: [number, number, number][] = [[0.2, 0.4, 4.4], [-3.4, 1.8, 2.9], [3.4, 1.6, 2.9], [-2.0, -2.8, 3.0], [2.4, -2.8, 2.8], [0.4, 3.4, 2.6]];
  group(ctx, puffs.map(([x, y, r]) => ({
    build: (c: Ctx) => circlePath(c, x, y, r),
    style: { fill: '#d4bb8c', shadow: '#a07a50', shadowOffset: [-r * 0.32, -r * 0.38] as Pt },
  })), 1.1);
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#f4e6c6';
  ctx.beginPath();
  circlePath(ctx, -2.4, -3.2, 1.5);
  circlePath(ctx, -4.0, 0.9, 0.9);
  circlePath(ctx, 1.6, -3.6, 0.8);
  ctx.fill();
  ctx.restore();
  speckle(ctx, 0.6, 1.0, 4.6, 3.6, 12, '#5a3c24', 0.42, 71, 0.95);
  // stray spores
  ctx.save();
  ctx.fillStyle = '#5a3c24';
  for (const [x, y, r] of [[6.4, -3.6, 0.55], [-6.6, -2.2, 0.5], [5.4, 4.6, 0.45]] as [number, number, number][]) {
    ctx.beginPath();
    circlePath(ctx, x, y, r);
    ctx.fill();
  }
  ctx.restore();
});

danger('proj.e_floret', 12, (ctx) => {
  // a round floret: stalk stub at the back, bumpy crown leading, cream dripping off the top
  shape(ctx, (c) => roundPoly(c, [[-6.4, -1.4], [-1.6, -2.4], [-1.6, 2.4], [-6.4, 1.6]], 1.2), { fill: STALK, ink: 1.0, shadow: STALK_SH, shadowOffset: [-0.6, -0.8] });
  line(ctx, [[-5.4, 0.1], [-2.2, 0.1]], 0.4, STALK_LN, false, 0.6);
  floret(ctx, [[-0.8, -2.6, 3.0], [-0.6, 2.8, 3.0], [2.6, -3.2, 3.2], [2.8, 2.8, 3.1], [4.6, -0.2, 3.2], [1.0, 0.0, 3.2]], 1.1, 19);
  shape(ctx, (c) => {
    c.moveTo(-1.6, -4.6);
    c.quadraticCurveTo(2.6, -7.4, 6.4, -3.0);
    c.quadraticCurveTo(5.6, -1.6, 4.8, -2.0);
    c.quadraticCurveTo(4.6, 1.0, 3.4, 0.9);
    c.quadraticCurveTo(2.6, -1.6, 1.4, -2.4);
    c.quadraticCurveTo(0.6, -0.4, -0.2, -0.6);
    c.quadraticCurveTo(-0.6, -2.6, -1.6, -4.6);
    c.closePath();
  }, { fill: CREAM, ink: 0.85, shadow: CREAM_SH, shadowOffset: [-0.5, -0.6], gloss: [{ x: 2.0, y: -5.0, rx: 1.3, ry: 0.5, rot: -0.3, alpha: 0.95 }] });
});
