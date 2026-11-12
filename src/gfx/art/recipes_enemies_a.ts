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
 *   enemy.burro         46×52     (23,36)         14      puddler     pale-yellow butter brick in its opened gold-foil wrapper
 *                                                                     (red band), golden melt dripping off the top; sly
 *                                                                     half-lidded side glance, cocked brow, closed lopsided
 *                                                                     smirk, tiptoes, hides a butter knife behind its back
 *   enemy.funghi        46×50     (23,34)         13      burster     three dark-brown button mushrooms on one clump: the
 *                                                                     boss in a light tweed coppola (flat cap), two henchmen
 *                                                                     (a toothpick; a sticking plaster); olive spore puffs
 *                                                                     fade in and out. It hovers (the renderer lifts it), so
 *                                                                     rootlets dangle under the clump
 *   enemy.prosciutto    48×50     (24,34)         14      chase       pink cooked-ham loaf (white fat cap combed over the top)
 *                                                                     wearing one round ham slice as a cape (white fat ring,
 *                                                                     pale muscle seams); a FAKE guanciale label on its chest
 *                                                                     (a swatch of guanciale stripes, no text); shifty eyes,
 *                                                                     sweat, nervous clenched-teeth grin
 *   enemy.broccoli      50×58     (25,40)         15      lobber      dark-green floret head in a red baseball cap with a
 *                                                                     white star, "Alfredo" cream dripping off the top, pale
 *                                                                     stalk body, white sneakers; swings a floret underhand
 *   enemy.gamberi       44×40     (22,26)         12      leaper      coral-pink shrimp curled into a C like a spring, blue
 *                                                                     swim goggles cut on a scowling slant, cocky toothy
 *                                                                     grin, long antennae; the tail fan flips
 *
 *   fx.butter_puddle    76×56     (38,28)  1 frame, res 2: soft butter smeared over the floor, seen from above: opaque
 *                                          pale butter-yellow (the enemy's colour), knife-spread ridges, toasted flecks and
 *                                          a half-melted pat in the middle; rounder than the other slicks so the renderer's
 *                                          squash + spin keeps it a puddle (enemy hazard 'butter'; drawn scaled to the
 *                                          hazard radius at ~0.92 alpha, like fx.cream_puddle).
 *   proj.e_spore        24×24     (12,12)  1 frame: a dark olive-khaki puff of mushroom spores with sickly yellow-green
 *                                          highlights (DANGER style: hot rim, red glow).
 *   proj.e_floret       24×24     (12,12)  1 frame: a round broccoli floret dripping cream, stalk stub at the back
 *                                          (lobbed and spun; lands as a cream puddle). DANGER style.
 */
import {
  Ctx, Pt, INK, shape, group, ellipsePath, circlePath, polyPath, smoothPath, line, inkLine, legs, eye, brow,
  speckle, glint, rng, shade, rgba, mix,
} from '../painter';
import { enemySprite, cyc, TAU, LIMB, mitt, hoseArm, cheeks, clipTo, wash } from './enemies_b_kit';
import { danger } from './projectiles';
import { fx, puddle, puddlePts } from './fx';
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
const FOIL = '#e8b445';
const FOIL_SH = '#b07a22';
const FOIL_DK = '#7a5216';
const FOIL_HI = '#fff0b8';
const FOIL_BAND = '#b8302e';
const FOIL_GOLD = '#fff2c4';
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

  // --- face: sly — half-lidded eyes glancing sideways, one brow cocked, a closed lopsided smirk
  const lidC = mix(BUT, BUT_SH, 0.55);
  const slyEye = (x: number, y: number, r: number) => {
    eye(ctx, x, y, r, { look: [0.62, 0.12], pupil: 0.56, squash: 1.1, lid: 'half', lidColor: lidC });
    // heavy lid line across the eye
    const ry = r * 1.1, ly = y - ry * 0.25;
    line(ctx, [[x - r * 1.12, ly + 0.5], [x, ly - 0.25], [x + r * 1.12, ly + 0.3]], 1.15, INK, true);
  };
  slyEye(-4.2, -12.0, 2.6);
  slyEye(2.9, -12.2, 2.85);
  brow(ctx, -4.3, -15.2, 4.4, 0.16, 1.45); // low and flat
  brow(ctx, 3.1, -18.6, 4.8, -0.2, 1.45); // cocked high
  cheeks(ctx, [[-7.4, -8.4], [6.2, -8.6]], 1.8, 1.0, '#f2a35a', 0.55);
  // closed, lopsided smirk: flat on the left, hitched up into the right cheek
  line(ctx, [[-4.6, -6.4], [-0.6, -6.0], [3.0, -6.8], [5.6, -8.8]], 1.35, INK, true);
  line(ctx, [[5.0, -9.6], [6.2, -8.4], [5.8, -7.2]], 0.8, INK, true);
  // a hint of the lower lip under the hitched side
  line(ctx, [[0.8, -5.2], [3.2, -5.6]], 0.6, BUT_LN, true, 0.8);

  // --- the foil wrapper, opened down to its waist
  const FT = -1.6;
  const Rn = rng(91);
  const top: Pt[] = [];
  for (let i = 0; i <= 7; i++) top.push([L - 1.0 + (i / 7) * (R + 1.6 - L), FT + (i % 2 ? -0.45 : 0.35) + (Rn() - 0.5) * 0.5]);
  for (let i = 1; i <= 3; i++) top.push([R + 0.6 + (i / 3) * (DX + 0.4), FT + (i / 3) * DY + (i % 2 ? 0.4 : -0.4)]);
  const foilPts: Pt[] = [...top, [R + DX + 1.0, B + DY + 1.0], [R + 0.6, B + 1.1], [L - 1.0, B + 1.1]];
  const foil = (c: Ctx) => roundPoly(c, foilPts, 0.7);
  shape(ctx, foil, { fill: FOIL, ink: 1.9, shadow: 'none' });
  clipTo(ctx, foil, () => {
    const g = ctx.createLinearGradient(L, FT, R, B + 2);
    g.addColorStop(0, FOIL_HI);
    g.addColorStop(0.45, FOIL);
    g.addColorStop(1, mix(FOIL, FOIL_SH, 0.5));
    ctx.fillStyle = g;
    ctx.fillRect(L - 3, FT - 8, R - L + DX + 6, 20);
    // side panel in shadow
    ctx.fillStyle = rgba(FOIL_SH, 0.8);
    ctx.beginPath();
    polyPath(ctx, [[R + 0.6, FT - 1], [R + DX + 3, FT + DY - 3], [R + DX + 3, B + 4], [R + 0.6, B + 4]]);
    ctx.fill();
    // printed band (red with cream pinstripes), following the block's perspective
    const y0 = FT + 2.4, y1 = FT + 5.4;
    const side = (y: number, k: number): Pt => [R + 0.6 + k * (DX + 2), y + k * (DY - 1.4)];
    ctx.fillStyle = FOIL_BAND;
    ctx.beginPath();
    polyPath(ctx, [[L - 3, y0], [R + 0.6, y0], side(y0, 1), side(y1, 1), [R + 0.6, y1], [L - 3, y1]]);
    ctx.fill();
    ctx.fillStyle = rgba('#6e1418', 0.5);
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
      ctx.fillStyle = i % 2 ? rgba(FOIL_HI, 0.6) : rgba(FOIL_DK, 0.22);
      ctx.beginPath();
      polyPath(ctx, [[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l], [x + Math.cos(a + 1.2) * l * 0.7, y + Math.sin(a + 1.2) * l * 0.7]]);
      ctx.fill();
    }
    for (const pts of [
      [[-8.6, FT + 0.2], [-8.0, B]],
      [[-2.4, FT], [-2.9, FT + 2.2]],
      [[2.6, FT], [3.2, FT + 2.4]],
      [[R + 3.6, FT - 2.2], [R + 3.2, B - 1.6]],
    ] as Pt[][]) line(ctx, pts, 0.5, FOIL_DK, true, 0.6);
    // bright vertical sheen on the front
    line(ctx, [[L + 2.4, FT + 1], [L + 2.2, B]], 1.3, '#fffbe8', false, 0.8);
    // crumpled bright rim along the top
    line(ctx, top, 0.8, '#fffbe8', false, 0.9);
  });
  // --- near arm: an innocent little wave
  const wx = 16.8 + s * 0.6, wy = -7.2 + co * 0.6;
  hoseArm(ctx, 10.2, -5.8, wx, wy, { thick: 2.0, bend: -0.2, handR: 2.4 });
}

enemySprite('burro', 46, 52, 36, drawBurro);

// ===========================================================================
// 2. FUNGHI ABUSIVI — r13. Three brown button mushrooms grown from one clump:
//    the boss in the middle wears a light tweed coppola (flat cap), his two
//    henchmen flank him (one chewing a toothpick, one with a sticking plaster
//    on his cap). Olive spore puffs drift around. (Burster: spore shots.)
// ===========================================================================

const CAP = '#8e5634';
const CAP_SH = '#5f3420';
const CAP_HI = '#c98e5e';
const STEM = '#f4e8d4';
const STEM_SH = '#cdb593';
const GILL = '#6e4a32';
const TWEED = '#cfc6b0';
const TWEED_SH = '#9d927a';
const TWEED_DK = '#7a705c';
const SPORE = '#8f7a45';
const SPORE_SH = '#5e4e2a';
const SPORE_HI = '#b8c24a';

/** Mushroom: cap centre (x,y), cap radii rx/ry, stem width w down to yBot. */
function mushroom(ctx: Ctx, x: number, y: number, rx: number, ry: number, w: number, yBot: number, tilt: number, seed: number, ink = 2.2) {
  // stem (slightly bulging)
  const stem = (c: Ctx) => {
    c.moveTo(x - w * 0.42, y);
    c.bezierCurveTo(x - w * 0.62, y + (yBot - y) * 0.45, x - w * 0.56, yBot - 1.0, x - w * 0.4, yBot);
    c.quadraticCurveTo(x, yBot + 1.4, x + w * 0.42, yBot);
    c.bezierCurveTo(x + w * 0.58, yBot - 1.0, x + w * 0.62, y + (yBot - y) * 0.45, x + w * 0.42, y);
    c.closePath();
  };
  shape(ctx, stem, { fill: STEM, shadow: STEM_SH, ink: ink - 0.2, shadowOffset: [-w * 0.24, -0.6], gloss: [{ x: x - w * 0.26, y: y + (yBot - y) * 0.5, rx: w * 0.08, ry: (yBot - y) * 0.22, alpha: 0.75 }] });
  rot(ctx, x, y, tilt, () => {
    // dark gill rim showing under the cap
    shape(ctx, (c) => ellipsePath(c, 0, ry * 0.1, rx * 0.86, ry * 0.32), { fill: GILL, ink: 1.3, shadow: 'none' });
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
      fill: CAP, shadow: CAP_SH, ink, shadowOffset: [-rx * 0.22, -ry * 0.3],
      gloss: [{ x: -rx * 0.42, y: -ry * 0.56, rx: rx * 0.3, ry: ry * 0.17, rot: -0.45, alpha: 0.75 }],
    });
    clipTo(ctx, dome, () => {
      speckle(ctx, rx * 0.05, -ry * 0.35, rx * 0.8, ry * 0.5, Math.round(rx * 1.4), CAP_HI, 0.45, seed, 0.6);
      speckle(ctx, rx * 0.2, -ry * 0.2, rx * 0.8, ry * 0.5, Math.round(rx * 0.9), CAP_SH, 0.35, seed + 3, 0.45);
      // rim highlight where the cap curls under
      line(ctx, [[-rx * 0.9, ry * 0.02], [-rx * 0.4, ry * 0.2], [rx * 0.2, ry * 0.22]], 0.7, CAP_HI, true, 0.55);
    });
  });
}

/** A small puff of spores (3 blobs + dark specks), olive like the spore shots. */
function sporePuff(ctx: Ctx, x: number, y: number, r: number, alpha: number) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const build = (c: Ctx) => {
    circlePath(c, x, y, r);
    circlePath(c, x - r * 0.8, y + r * 0.35, r * 0.68);
    circlePath(c, x + r * 0.75, y + r * 0.3, r * 0.62);
  };
  shape(ctx, build, { fill: SPORE, ink: 0.7, inkColor: SPORE_SH, shadow: SPORE_SH, shadowOffset: [-r * 0.3, -r * 0.35] });
  ctx.fillStyle = SPORE_HI;
  ctx.beginPath();
  circlePath(ctx, x - r * 0.3, y - r * 0.35, r * 0.32);
  ctx.fill();
  ctx.restore();
}

/** Light tweed coppola (Sicilian flat cap): a wedge, high at the back, snapped down over a short brim. */
function coppola(ctx: Ctx, x: number, y: number, tilt: number) {
  rot(ctx, x, y, tilt, () => {
    const cap = (c: Ctx) => {
      c.moveTo(-8.0, 0.8);
      c.bezierCurveTo(-9.2, -2.4, -7.6, -5.4, -3.6, -5.4);
      c.bezierCurveTo(1.0, -5.4, 6.4, -3.6, 9.4, -1.2);
      c.quadraticCurveTo(11.6, 0.2, 10.6, 1.2);
      c.quadraticCurveTo(8.0, 1.8, 5.2, 1.4);
      c.quadraticCurveTo(-1.6, 1.6, -8.0, 0.8);
      c.closePath();
    };
    shape(ctx, cap, {
      fill: TWEED, shadow: TWEED_SH, ink: 1.7, shadowOffset: [-1.2, -1.2],
      gloss: [{ x: -4.2, y: -4.0, rx: 2.2, ry: 0.6, rot: -0.1, alpha: 0.55 }],
    });
    // herringbone tweed: rows of little chevrons
    clipTo(ctx, cap, () => {
      ctx.strokeStyle = rgba(TWEED_DK, 0.5);
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      for (let row = 0; row < 4; row++) {
        const yy = -5.0 + row * 1.5;
        for (let xx = -9 + (row % 2) * 0.8; xx < 11; xx += 1.6) {
          ctx.moveTo(xx, yy);
          ctx.lineTo(xx + 0.8, yy + 0.6);
          ctx.lineTo(xx + 1.6, yy);
        }
      }
      ctx.stroke();
      // the brim under the snapped-down front, in shade
      ctx.fillStyle = rgba(TWEED_DK, 0.45);
      ctx.beginPath();
      ctx.moveTo(4.2, 2);
      ctx.quadraticCurveTo(6.6, -0.6, 11.4, -0.2);
      ctx.lineTo(12, 2.4);
      ctx.closePath();
      ctx.fill();
    });
    // the seam where the crown snaps down onto the brim
    line(ctx, [[3.8, 1.2], [6.4, -0.4], [10.4, -0.2]], 0.7, TWEED_DK, true, 0.9);
    line(ctx, [[-7.0, -1.0], [-2.0, -0.6], [3.8, 0.6]], 0.45, TWEED_DK, true, 0.6);
  });
}

function drawFunghi(ctx: Ctx, f: number) {
  const { ph, s } = cyc(f);
  // drifting spore puffs behind: each fades in, rises a little and fades out (no snap at the loop)
  const puff = (bx: number, by: number, i: number, off: number, r0: number) => {
    const t = ((f / 4) + i / 3 + off) % 1;
    sporePuff(ctx, bx + Math.sin(ph + i) * 0.5, by - t * 3.2, r0 + t * 0.5, 0.5 * Math.sin(t * Math.PI));
  };
  puff(-16.0, -10, 0, 0, 1.4);
  puff(15.6, -13, 1, 0, 1.4);
  puff(-7.6, -24, 2, 0, 1.3);

  // root clump (it hovers: rootlets dangle)
  for (const [x, l, a] of [[-7, 3.4, -0.3], [-2, 4.2, 0.1], [3.4, 3.6, 0.25], [8, 2.8, 0.5]] as [number, number, number][]) {
    const sw = Math.sin(ph + x) * 0.5;
    inkLine(ctx, [[x, 8.6], [x + a * 2 + sw, 8.6 + l * 0.6], [x + a * 3 + sw * 1.6, 8.6 + l]], 0.8, '#e9dcc2', true, 0.7);
  }
  shape(ctx, (c) => {
    c.moveTo(-14, 8.2);
    c.quadraticCurveTo(-13, 4.8, -6, 5.6);
    c.quadraticCurveTo(0, 4.4, 7, 5.8);
    c.quadraticCurveTo(14, 5.4, 14.6, 8.4);
    c.quadraticCurveTo(7, 11.4, 0, 10.6);
    c.quadraticCurveTo(-8, 11.4, -14, 8.2);
    c.closePath();
  }, { fill: '#7a5538', shadow: '#55372a', ink: 2.0, shadowOffset: [-1.4, -1.2] });
  speckle(ctx, 0, 8.4, 12, 1.8, 14, '#a07650', 0.4, 9, 0.8);

  const bob = [0, -0.4, 0, 0.4][f];
  // left henchman (behind), a sticking plaster on his cap
  mushroom(ctx, -11.6, -4.8 + bob * 0.5, 6.8, 5.0, 7.0, 8.0, -0.18 + s * 0.04, 21);
  rot(ctx, -12.8, -7.6 + bob * 0.5, -0.5, () => {
    for (const a of [0.7, -0.7]) {
      rot(ctx, 0, 0, a, () => {
        shape(ctx, (c) => roundPoly(c, [[-3.0, -1.0], [3.0, -1.0], [3.0, 1.0], [-3.0, 1.0]], 0.9), { fill: '#f2c9a0', ink: 0.8, shadow: '#d7a77a', shadowOffset: [-0.3, -0.4] });
        ctx.fillStyle = rgba('#b9875a', 0.6);
        for (const px of [-1.8, 1.8]) {
          ctx.beginPath();
          circlePath(ctx, px, 0, 0.3);
          ctx.fill();
        }
      });
    }
  });
  eye(ctx, -13.8, 1.8, 1.7, { look: [0.4, 0.1], lid: 'angry-l', pupil: 0.6 });
  eye(ctx, -9.8, 1.7, 1.8, { look: [0.4, 0.1], lid: 'angry-r', pupil: 0.6 });
  line(ctx, [[-13.0, 5.4], [-11.6, 4.6], [-10.0, 5.3]], 0.9, INK, true);

  // the boss (middle)
  mushroom(ctx, -0.6, -13.6 + bob, 12.4, 8.0, 13.0, 7.6, 0.04 + s * 0.03, 11, 2.4);
  coppola(ctx, -0.4, -19.6 + bob, -0.1 + s * 0.03);
  // face on the stem: heavy-lidded don
  const fy = -5.8 + bob * 0.5;
  eye(ctx, -3.6, fy, 2.6, { look: [0.45, 0.15], lid: 'half', pupil: 0.62 });
  eye(ctx, 2.4, fy - 0.1, 2.8, { look: [0.45, 0.15], lid: 'half', pupil: 0.62 });
  brow(ctx, -3.8, fy - 3.4, 4.6, 0.42, 1.7);
  brow(ctx, 2.7, fy - 3.6, 4.8, -0.42, 1.7);
  // jowly frown under a pencil moustache
  shape(ctx, (c) => {
    c.moveTo(-4.0, fy + 4.0);
    c.quadraticCurveTo(-0.2, fy + 2.3, 3.8, fy + 3.8);
    c.quadraticCurveTo(-0.2, fy + 3.5, -4.0, fy + 4.0);
    c.closePath();
  }, { fill: '#3a2418', ink: 0.7, shadow: 'none' });
  line(ctx, [[-3.0, fy + 6.6], [0.0, fy + 5.2], [3.0, fy + 6.4]], 1.15, INK, true);
  line(ctx, [[-5.4, fy + 4.6], [-4.6, fy + 7.0]], 0.6, STEM_SH, true, 0.9);
  line(ctx, [[5.2, fy + 4.4], [4.6, fy + 6.8]], 0.6, STEM_SH, true, 0.9);

  // right henchman (front), chewing a toothpick
  mushroom(ctx, 11.6, -0.2 + bob * 0.5, 6.6, 5.0, 7.2, 9.4, 0.2 + s * 0.05, 31);
  eye(ctx, 9.6, 5.2, 1.7, { look: [0.45, 0.1], lid: 'angry-l', pupil: 0.6 });
  eye(ctx, 13.6, 5.0, 1.8, { look: [0.45, 0.1], lid: 'angry-r', pupil: 0.6 });
  line(ctx, [[10.0, 8.2], [11.8, 8.5], [13.4, 7.8]], 0.9, INK, true);
  // the toothpick out of the corner of his smirk, wagging
  const tp = 0.12 + s * 0.12;
  inkLine(ctx, [[13.0, 8.0], [13.0 + Math.cos(tp) * 4.2, 8.0 - Math.sin(tp) * 4.2]], 0.7, '#e8c98a', false, 0.6);

  // spore puffs in front
  puff(17.6, -5, 0, 0.17, 1.2);
  puff(-17.2, 2, 1, 0.17, 1.1);
  puff(9.0, -24, 2, 0.17, 1.1);
}

enemySprite('funghi', 46, 50, 34, drawFunghi);

// ===========================================================================
// 3. PROSCIUTTO IMPOSTORE — r14. Plain cooked ham pretending to be guanciale:
//    a pink ham loaf (white fat cap combed over the top) wearing one big round
//    ham slice as a cape, with a FAKE guanciale label taped to its chest (a
//    swatch of guanciale stripes, no text). Shifty eyes, sweat, a nervous
//    clenched-teeth grin. (Chase, knock-resistant.)
// ===========================================================================

const HAM = '#f49aa2';
const HAM_SH = '#d6697a';
const HAM_HI = '#ffd0cf';
const HAM_DK = '#b9505f';
const HAM_SEAM = '#ffe2df';
const FAT = '#fff6f0';
const FAT_SH = '#efc9c4';
const RIND = '#dda56a';
const TAG = '#fdf8ee';
const GUA_LEAN = '#9e2f35';
const GUA_FAT = '#fbeee2';
const GUA_RIND = '#5a2a1e';

/** The round ham-slice cape: centre (x,y), radii rx/ry tilted by tilt, edge ripple phase ph. */
function hamSlice(ctx: Ctx, x: number, y: number, rx: number, ry: number, tilt: number, ph: number, seed: number) {
  const N = 26;
  const pts: Pt[] = [];
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    // the trailing (left/bottom) edge ripples as it runs; the edge tucked behind the neck stays put
    const trail = Math.max(0, -Math.cos(a - 0.5));
    const k = 1 + (Math.sin(a * 3 + ph) * 0.05 + Math.sin(a * 5 - ph * 2) * 0.025) * trail;
    const u = Math.cos(a) * rx * k, v = Math.sin(a) * ry * k;
    pts.push([x + u * ct - v * st, y + u * st + v * ct]);
  }
  const disc = (c: Ctx) => smoothPath(c, pts, true, 0.5);
  const r = Math.max(rx, ry);
  shape(ctx, disc, {
    fill: radial(ctx, x - r * 0.35, y - r * 0.4, r * 1.25, [[0, '#ffc4c4'], [0.55, HAM], [1, mix(HAM, HAM_SH, 0.45)]]),
    shadow: 'none', ink: 2.2,
  });
  clipTo(ctx, disc, () => {
    // pale seams between the muscles (the classic cooked-ham "map")
    const R = rng(seed);
    for (const seam of [
      [[-0.78, -0.25], [-0.42, -0.05], [-0.2, 0.3], [-0.12, 0.8]],
      [[-0.42, -0.05], [-0.3, -0.5], [-0.05, -0.85]],
      [[-0.2, 0.3], [-0.55, 0.55], [-0.85, 0.5]],
    ] as Pt[][]) {
      const p = seam.map(([u, v]): Pt => [x + u * rx + (R() - 0.5) * 0.6, y + v * ry + (R() - 0.5) * 0.6]);
      line(ctx, p, 1.4, HAM_SEAM, true, 0.9);
      line(ctx, p.map(([px, py]): Pt => [px + 0.55, py + 0.65]), 0.5, HAM_SH, true, 0.5);
    }
    speckle(ctx, x, y, rx * 0.75, ry * 0.75, 18, HAM_DK, 0.32, seed + 1, 0.3);
    speckle(ctx, x, y, rx * 0.75, ry * 0.75, 10, HAM_HI, 0.4, seed + 2, 0.5);
    // the white fat ring (+ golden rind outside it)
    ctx.beginPath();
    smoothPath(ctx, pts, true, 0.5);
    ctx.lineWidth = 5.2;
    ctx.strokeStyle = FAT;
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = RIND;
    ctx.stroke();
    // shading on the fat ring's inner edge
    ctx.beginPath();
    smoothPath(ctx, pts.map(([px, py]): Pt => [x + (px - x) * 0.83, y + (py - y) * 0.83]), true, 0.5);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = rgba(FAT_SH, 0.9);
    ctx.stroke();
    // cel shadow: the body casts a soft shade on the slice near its edge
    ctx.fillStyle = rgba(HAM_DK, 0.3);
    ctx.beginPath();
    ellipsePath(ctx, x + rx * 0.95, y + ry * 0.1, rx * 0.5, ry * 1.1);
    ctx.fill();
  });
  // gloss on the fat ring, upper-left
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.86, ry * 0.86, tilt, Math.PI * 1.02, Math.PI * 1.3);
  ctx.stroke();
  ctx.restore();
}

/** The fake guanciale label: a cream tag showing a swatch of guanciale stripes, stuck on askew. */
function fakeLabel(ctx: Ctx, x: number, y: number, a: number) {
  rot(ctx, x, y, a, () => {
    const tag = (c: Ctx) => roundPoly(c, [[-5.0, -3.6], [5.0, -3.6], [5.0, 3.6], [-5.0, 3.6]], 1.0);
    shape(ctx, tag, { fill: TAG, ink: 1.0, shadow: '#e2d6c2', shadowOffset: [-0.7, -0.7] });
    // the swatch: peppered rind, then fat / lean / fat / lean layers
    const sw = (c: Ctx) => roundPoly(c, [[-3.8, -2.5], [3.8, -2.5], [3.8, 2.5], [-3.8, 2.5]], 0.6);
    clipTo(ctx, sw, () => {
      const bands: [number, number, string][] = [
        [-2.6, -1.5, GUA_RIND], [-1.5, -0.5, GUA_FAT], [-0.5, 0.5, GUA_LEAN], [0.5, 1.3, GUA_FAT], [1.3, 2.6, GUA_LEAN],
      ];
      for (const [y0, y1, col] of bands) {
        ctx.fillStyle = col;
        ctx.beginPath();
        // a gentle wave so the layers read as meat, not a flag
        ctx.moveTo(-4, y0 + 0.15);
        ctx.quadraticCurveTo(0, y0 - 0.35, 4, y0 + 0.1);
        ctx.lineTo(4, y1 + 0.1);
        ctx.quadraticCurveTo(0, y1 - 0.35, -4, y1 + 0.15);
        ctx.closePath();
        ctx.fill();
      }
      speckle(ctx, 0, -2.0, 3.6, 0.6, 9, '#1c1210', 0.28, 77, 1);
      speckle(ctx, 0, -1.0, 3.6, 0.4, 4, '#3a2a22', 0.2, 78, 0.8);
    });
    ctx.save();
    ctx.beginPath();
    sw(ctx);
    ctx.lineWidth = 0.55;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  });
}

function drawProsciutto(ctx: Ctx, f: number) {
  const { ph, s, c: co } = cyc(f);
  ctx.save();
  ctx.translate(2.2, -0.4); // the cape trails behind, so the body sits a little right of the anchor

  // --- the cape: one big round ham slice tied at the neck, streaming out behind
  hamSlice(ctx, -8.2 - Math.abs(s) * 0.3, -8.6 + co * 0.3, 11.6, 14.6, 0.3, ph, 47);

  // --- far arm (behind the body), pumping
  hoseArm(ctx, -7.6, -6.0, -11.4 - s * 1.6, -0.4 + co * 0.8, { thick: 2.0, bend: 0.3, handR: 2.3 });

  // --- running legs
  legs(ctx, 0.4, 6.4, f, { len: 4.6, spread: 8.4, thick: 2.9, color: LIMB, shoe: SHOE, stride: 4.6 });

  // --- the ham loaf body
  const body: Pt[] = [
    [-8.0, -21.8], [-1.4, -26.0], [6.8, -25.6], [11.6, -20.4], [12.8, -9.0], [11.8, 3.6], [6.6, 8.4], [-1.6, 9.0], [-8.4, 6.4], [-10.2, -4.0], [-10.2, -14.8],
  ];
  const bodyB = (c: Ctx) => smoothPath(c, body, true, 0.5);
  shape(ctx, bodyB, {
    fill: radial(ctx, -3.5, -17, 26, [[0, '#ffc9c8'], [0.38, '#f6a7ad'], [1, HAM]]),
    shadow: HAM_SH, ink: 2.3, shadowOffset: [-3.2, -2.8],
    gloss: [{ x: -6.2, y: -14.2, rx: 1.3, ry: 3.2, rot: 0.25, alpha: 0.55 }],
  });
  clipTo(ctx, bodyB, () => {
    // muscle seams + meat grain
    line(ctx, [[-8.4, -9.4], [-5.0, -6.4], [-5.6, 0.6], [-8.6, 4.4]], 1.0, HAM_SEAM, true, 0.75);
    line(ctx, [[-5.0, -6.4], [-1.2, -5.2]], 0.8, HAM_SEAM, true, 0.6);
    line(ctx, [[8.6, 0.8], [6.0, 4.4], [6.8, 8.4]], 0.9, HAM_SEAM, true, 0.6);
    speckle(ctx, 0, -6, 10, 13, 22, HAM_DK, 0.3, 53, 0.28);
    // the fat cap on top, combed over like a slicked hairdo (+ thin golden rind at the edge)
    const fatLine: Pt[] = [[-13.0, -12.4], [-9.6, -17.0], [-4.6, -20.6], [1.0, -22.0], [6.6, -21.6], [10.8, -19.8], [14.0, -17.0]];
    const fatB = (c: Ctx) => {
      smoothPath(c, fatLine, false, 0.5);
      c.lineTo(14, -32);
      c.lineTo(-13, -32);
      c.closePath();
    };
    ctx.fillStyle = FAT;
    ctx.beginPath();
    fatB(ctx);
    ctx.fill();
    clipTo(ctx, fatB, () => {
      ctx.save();
      ctx.beginPath();
      bodyB(ctx);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = RIND;
      ctx.stroke();
      ctx.restore();
      // cel shade on the fat's lower-right
      ctx.fillStyle = rgba(FAT_SH, 0.75);
      ctx.beginPath();
      ellipsePath(ctx, 12, -16, 5, 7);
      ctx.fill();
    });
    line(ctx, fatLine.map(([x, y]): Pt => [x, y - 0.5]), 1.0, FAT_SH, true, 0.95);
    line(ctx, fatLine, 0.5, HAM_SH, true, 0.6);
    // comb lines in the fat
    for (const [x0, y0, x1, y1] of [[-9.4, -19.2, -3.8, -23.0], [-3.6, -22.4, 3.4, -24.4], [3.6, -23.6, 9.4, -22.2]]) {
      line(ctx, [[x0, y0], [(x0 + x1) / 2, Math.min(y0, y1) - 0.6], [x1, y1]], 0.5, FAT_SH, true, 0.95);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ellipsePath(ctx, -4.4, -23.4, 2.6, 0.75, -0.35);
    ctx.fill();
  });

  // --- face: shifty eyes glancing back over its shoulder, one worried brow
  const lk: Pt = [-0.55, 0.08];
  eye(ctx, 0.6, -14.6, 2.7, { look: lk, pupil: 0.56 });
  eye(ctx, 7.0, -14.8, 2.9, { look: lk, pupil: 0.56 });
  brow(ctx, 0.4, -19.4, 4.2, -0.36, 1.45); // raised, worried
  brow(ctx, 7.4, -19.6, 4.4, 0.28, 1.45); // pulled down
  cheeks(ctx, [[-2.8, -10.6], [10.2, -10.8]], 1.7, 1.0, '#e8606e', 0.45);
  // nervous clenched-teeth grin (both rows, wobbly corners)
  const gm = (c: Ctx) => {
    c.moveTo(-0.8, -9.0);
    c.quadraticCurveTo(4.2, -10.0, 9.4, -9.4);
    c.quadraticCurveTo(10.2, -7.8, 9.2, -6.0);
    c.quadraticCurveTo(4.0, -5.0, -0.6, -6.2);
    c.quadraticCurveTo(-1.6, -7.6, -0.8, -9.0);
    c.closePath();
  };
  shape(ctx, gm, { fill: '#fff8ea', ink: 1.1, shadow: 'none' });
  clipTo(ctx, gm, () => {
    line(ctx, [[-1.4, -7.6], [4.2, -7.9], [10, -7.7]], 0.55, 'rgba(80,40,30,0.75)', true);
    for (const tx of [1.6, 4.0, 6.4]) line(ctx, [[tx, -10.2], [tx + 0.1, -4.8]], 0.4, 'rgba(80,40,30,0.5)');
    ctx.fillStyle = rgba('#e3cdbb', 0.8);
    ctx.fillRect(-2, -6.6, 13, 2);
  });
  // squiggly corner (nervous twitch)
  line(ctx, [[9.4, -9.4], [10.4, -10.2], [10.0, -11.0]], 0.7, INK, true);
  sweat(ctx, -6.6, -17.6 + [0, 0.7, 1.4, 0.7][f], 1.35);
  sweat(ctx, 12.8, -21.8 + [0.7, 1.4, 0.7, 0][f], 1.0);

  // --- the fake guanciale label, taped on the chest
  fakeLabel(ctx, 3.8, 0.8, -0.12);

  // --- near arm, pumping at its side
  hoseArm(ctx, 11.4, -5.4, 15.0 + s * 1.2, -0.6 - co * 1.0, { thick: 2.0, bend: -0.3, handR: 2.4 });
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
  // scowling goggles: each lens is a circle with its top cut on a slant (low at the nose), so the
  // bright blue frames themselves make the angry V
  const cutLens = (c: Ctx, x: number, y: number, R: number, inner: number) => {
    const pts: Pt[] = [];
    const lineY = (px: number) => y - 0.5 * R + ((px - (x - inner * R)) / (2 * inner * R)) * 0.62 * R;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU;
      const px = x + Math.cos(a) * R;
      pts.push([px, Math.max(y + Math.sin(a) * R, lineY(px))]);
    }
    polyPath(c, pts);
  };
  const lens = (x: number, y: number, r: number, inner: 1 | -1) => {
    shape(ctx, (c) => cutLens(c, x, y, r + 1.4, inner), { fill: GOG, ink: 1.05, shadow: '#195a9e', shadowOffset: [-0.5, -0.6] });
    clipTo(ctx, (c) => cutLens(c, x, y + 0.2, r, inner), () => {
      eye(ctx, x, y + 0.2, r, { look: [0.5, 0.25], pupil: 0.62, sclera: '#f4fcff', ink: 0.7 });
    });
    ctx.save();
    ctx.beginPath();
    cutLens(ctx, x, y + 0.2, r, inner);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
    wash(ctx, (c) => cutLens(c, x, y + 0.2, r, inner), LENS, 0.2);
    glint(ctx, x - r * 0.45, y + r * 0.45, r * 0.3, r * 0.16, -0.6, 0.9);
    // a heavy brow riding the slanted top of the frame
    const R = r + 1.4;
    const lineY = (px: number) => y - 0.5 * R + ((px - (x - inner * R)) / (2 * inner * R)) * 0.62 * R;
    const x0 = x - inner * (R + 0.6), x1 = x + inner * (R * 0.9);
    line(ctx, [[x0, lineY(x0) - 1.0], [x1, lineY(x1) - 0.9]], 1.6, INK, false);
  };
  line(ctx, [[hx + 2.0, hy - 2.0], [hx + 3.8, hy - 2.2]], 1.4, GOG, false);
  lens(hx + 0.8, hy - 2.2, 2.3, 1);
  lens(hx + 6.4, hy - 2.6, 2.5, -1);

  // --- mouth: cocky toothy grin, hitched up on the near side
  const m = (c: Ctx) => {
    c.moveTo(hx + 0.8, hy + 2.6);
    c.quadraticCurveTo(hx + 4.4, hy + 3.0, hx + 8.0, hy + 0.4);
    c.quadraticCurveTo(hx + 7.6, hy + 5.6, hx + 4.0, hy + 5.4);
    c.quadraticCurveTo(hx + 1.4, hy + 5.0, hx + 0.8, hy + 2.6);
    c.closePath();
  };
  shape(ctx, m, { fill: '#5b1320', ink: 1.0, shadow: 'none' });
  clipTo(ctx, m, () => {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 1.8);
    ctx.quadraticCurveTo(hx + 4.4, hy + 2.4, hx + 8.6, hy - 0.4);
    ctx.lineTo(hx + 8.6, hy + 2.4);
    ctx.quadraticCurveTo(hx + 4.4, hy + 4.4, hx, hy + 3.8);
    ctx.closePath();
    ctx.fill();
    for (const tx of [2.6, 4.6, 6.4]) line(ctx, [[hx + tx, hy + 1.2], [hx + tx, hy + 4.0]], 0.35, 'rgba(80,40,30,0.45)');
    ctx.fillStyle = '#e8616e';
    ctx.beginPath();
    ellipsePath(ctx, hx + 4.0, hy + 5.6, 1.8, 1.0);
    ctx.fill();
  });
  // smirk crease at the raised corner
  line(ctx, [[hx + 7.8, hy - 0.4], [hx + 8.8, hy + 0.2], [hx + 8.6, hy + 1.2]], 0.7, INK, true);

  ctx.restore();
}

enemySprite('gamberi', 44, 40, 26, drawGamberi);

// ===========================================================================
// FX — butter slick (enemy hazard 'butter')
// ===========================================================================

fx('fx.butter_puddle', 76, 56, (ctx) => {
  // soft butter smeared over the floor: opaque, pale butter-yellow (the enemy's own colour), knife-spread
  // ridges, toasted brown-butter flecks at the rim and a half-melted pat in the middle. Rounder than the
  // other slicks, so the renderer's squash + spin keeps it a puddle, not a lemon.
  puddle(ctx, 29, 22, 52, { base: '#fbe08a', rim: '#a8711f', glossA: 0.75, satellites: 3 });
  const lob = puddlePts(29, 22, 52);
  clipTo(ctx, (c) => smoothPath(c, lob, true, 0.6), () => {
    // toasted ring just inside the rim (brown butter)
    ctx.save();
    ctx.beginPath();
    smoothPath(ctx, lob, true, 0.6);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = rgba('#d99a3c', 0.55);
    ctx.stroke();
    ctx.restore();
    speckle(ctx, 0, 0, 26, 19, 14, '#b9782c', 0.6, 57, 0.5);
    // knife-spread ridges: pairs of curved strokes (a highlight with its shadow just below)
    for (const [cx, cy, rx, ry, a0, a1] of [
      [-6, 6, 18, 10, 3.5, 5.4], [8, -4, 15, 9, 0.2, 1.9], [-12, -5, 11, 6, 3.9, 5.6], [12, 9, 10, 6, 4.1, 5.5],
    ] as [number, number, number, number, number, number][]) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = rgba('#fff6cf', 0.9);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.08, a0, a1);
      ctx.stroke();
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = rgba('#d9a43c', 0.7);
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1.3, rx, ry, 0.08, a0 + 0.05, a1 - 0.05);
      ctx.stroke();
      ctx.restore();
    }
  });
  // the half-melted pat in the middle, slumping into the smear
  rot(ctx, 2, -1, -0.18, () => {
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
      fill: radial(ctx, -3, -3, 12, [[0, '#fffbe6'], [0.5, '#fde98f'], [1, '#efc75a']]),
      ink: 1.3, inkColor: '#8f6118', shadow: '#e2b648', shadowOffset: [-1.4, -1.6],
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
  // a lumpy puff of mushroom spores: dark olive-khaki cloud, sickly yellow-green highlights, a darker
  // spore core and a few strays — dark enough to read on the pale kitchen and food-court floors
  const puffs: [number, number, number][] = [[0.2, 0.4, 4.4], [-3.4, 1.8, 2.9], [3.4, 1.6, 2.9], [-2.0, -2.8, 3.0], [2.4, -2.8, 2.8], [0.4, 3.4, 2.6]];
  group(ctx, puffs.map(([x, y, r]) => ({
    build: (c: Ctx) => circlePath(c, x, y, r),
    style: { fill: SPORE, shadow: SPORE_SH, shadowOffset: [-r * 0.32, -r * 0.38] as Pt },
  })), 1.2);
  ctx.save();
  ctx.fillStyle = rgba('#3e3218', 0.55);
  ctx.beginPath();
  circlePath(ctx, 0.8, 1.2, 2.4);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = SPORE_HI;
  ctx.beginPath();
  circlePath(ctx, -2.4, -3.3, 1.35);
  circlePath(ctx, -4.0, 0.8, 0.85);
  circlePath(ctx, 1.8, -3.6, 0.8);
  ctx.fill();
  ctx.restore();
  speckle(ctx, 0.6, 1.0, 4.6, 3.6, 12, '#2c2210', 0.42, 71, 0.95);
  // stray spores
  ctx.save();
  ctx.fillStyle = '#3e3218';
  for (const [x, y, r] of [[6.4, -3.6, 0.6], [-6.6, -2.2, 0.55], [5.4, 4.6, 0.5]] as [number, number, number][]) {
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
