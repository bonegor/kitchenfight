/**
 * IL MENÙ — ENEMIES C: the crimes of the Pizza Diavola and of the dolci (Cannoli siciliani, Panettone).
 * (Imported before placeholders.ts, like the other Il Menù art files.)
 *
 *   id                  box w×h   anchor (ax,ay)  radius  behaviour   look
 *   enemy.salame_usa    54×40     (27,26)         13      charger     a stubby stick of American pepperoni lying on its side on
 *                                                                     little legs: brick-red casing freckled with fat, the cut
 *                                                                     front showing the slice, a tied string at the back, orange
 *                                                                     grease beading off it; it charges like a torpedo
 *   enemy.sfoglia       58×66     (27,44)         14      chase       a golden puff-pastry horn (the Venice fake cannolo): flaky
 *                     (+_peel1, _peel2)                               spiral bands, its open end heaped with piped whipped cream
 *                                                                     and a candied cherry. Layers: the two peel sprites lose
 *                                                                     bands and cream as it flakes apart
 *   enemy.fluo          56×42     (28,24)         13      burster     a floating cannolo shell stuffed with NEON fillings (hot pink
 *                                                                     one end, electric cyan the other), rainbow sprinkles, a
 *                                                                     glow; it spins on a timer and bursts neon blobs
 *   enemy.ammuddato     52×44     (26,28)         15      hopper      the soggy pre-filled cannolo: a pale, limp shell sagging in
 *                                                                     an arch, ricotta oozing from both ends, drips of whey,
 *                                                                     droopy eyes; 1 = squashed on landing, 3 = in the air
 *   enemy.margarina     46×54     (23,38)         14      puddler     a plastic tub of margarine in a butter disguise (fake glasses
 *                                                                     with a nose and moustache), the lid pushed up like a cap
 *                                                                     on a swirl of yellow spread, a green leaf label (no text)
 *   enemy.palma         48×64     (24,46)         14      lobber      a waxy block of orange palm fat in torn paper, a little palm
 *                                                                     tree sprouting from its head; one hand up with a glob
 *   enemy.lievito       30×30     (15,17)         9       swarm       a small cube of fresh baker's yeast, beige and crumbly, half
 *                                                                     unwrapped from silver foil, puffing bubbles
 *   enemy.conservante   46×60     (23,42)         14      aura        a lab flask of fizzing acid-green preservative with a cork,
 *                                                                     a hazard-diamond label (no text) and a mad grin; its aura
 *                                                                     slows (green motes: params.colors in enemies.ts)
 *
 *   proj.e_neon         24×24     (12,12)  a blob of neon filling, half pink half cyan, with sprinkles (DANGER style)
 *   proj.e_palm         24×24     (12,12)  a glossy glob of orange palm fat (DANGER style)
 *   proj.e_flake        24×24     (12,12)  a curled puff-pastry flake (DANGER style; spins)
 *   proj.e_raisin       24×24     (12,12)  a wrinkled raisin with a cube of candied peel (DANGER style)
 *
 * Anchor = centre of the collision circle; feet/base at y ≈ +radius; facing right; no ground shadow.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, group, line, inkLine, ellipsePath, circlePath, roundRectPath, smoothPath, polyPath, blobPath,
  speckle, glint, legs, eye, brow, mouth, rng, shade,
} from '../painter';
import { TAU, LIMB, cyc, dripPath, hoseArm, eyePair, cheeks, clipTo, wash, twinkle } from './enemies_b_kit';
import { danger, sauceBlob } from './projectiles';
import { radial } from './items_kit';
import { softGlow } from './bosses_b_kit';

const SHOE = '#2e1c15';

function enemy(id: string, w: number, h: number, ay: number, draw: (ctx: Ctx, f: number) => void, ax = w / 2) {
  defineSprite({ id: 'enemy.' + id, w, h, ax, ay, frames: 4, flash: true, draw });
}

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  if (s !== 1) ctx.scale(s, s);
  fn();
  ctx.restore();
}

/** Teardrop (sweat bead, falling drop): pointed top at (x, y − h), round bottom of radius r centred at (x, y). */
function teardrop(c: Ctx, x: number, y: number, r: number, h: number) {
  c.moveTo(x, y - h);
  c.quadraticCurveTo(x + r * 1.05, y - r * 0.4, x + r, y);
  c.arc(x, y, r, 0, Math.PI);
  c.quadraticCurveTo(x - r * 1.05, y - r * 0.4, x, y - h);
  c.closePath();
}

// ===========================================================================
// 1. PEPPERONI INDUSTRIALE — r13, charger. A stubby pepperoni stick on its side.
// ===========================================================================

const PEP = '#b8361e';
const PEP_SH = '#7c1d10';
const PEP_HI = '#e0603a';
const PEP_CUT = '#d9482a';
const PEP_FAT = '#f6c6a6';
const GREASE = '#f59a2a';

function stickPath(c: Ctx, x0: number, x1: number, y: number, r: number) {
  // rounded, crimped back end on the left, a flat cut on the right (the cut face is drawn over it)
  c.moveTo(x1, y - r);
  c.lineTo(x0 + r * 0.6, y - r * 0.96);
  c.quadraticCurveTo(x0 - r * 0.55, y - r * 0.9, x0 - r * 0.6, y);
  c.quadraticCurveTo(x0 - r * 0.55, y + r * 0.9, x0 + r * 0.6, y + r * 0.96);
  c.lineTo(x1, y + r);
  c.closePath();
}

/** A pepperoni slice face (ellipse rx×ry): the cut with its fat freckles and paprika specks. */
function sliceFace(ctx: Ctx, x: number, y: number, rx: number, ry: number, seed: number, ink = 1.4) {
  const b = (c: Ctx) => ellipsePath(c, x, y, rx, ry);
  shape(ctx, b, { fill: radial(ctx, x - rx * 0.3, y - ry * 0.3, Math.max(rx, ry) * 1.3, [[0, '#ef6a44'], [0.6, PEP_CUT], [1, '#a82a16']]), ink, shadow: 'none' });
  clipTo(ctx, b, () => {
    speckle(ctx, x, y, rx * 0.85, ry * 0.85, Math.round(rx * ry * 0.5) + 4, PEP_FAT, Math.min(rx, ry) * 0.14, seed, 0.95);
    speckle(ctx, x, y, rx * 0.85, ry * 0.85, Math.round(rx * ry * 0.4) + 3, '#6e140a', Math.min(rx, ry) * 0.08, seed + 1, 0.8);
    ctx.save();
    ctx.beginPath();
    ellipsePath(ctx, x, y, rx, ry);
    ctx.lineWidth = Math.min(rx, ry) * 0.35;
    ctx.strokeStyle = 'rgba(110,20,10,0.55)';
    ctx.stroke();
    ctx.restore();
  });
  glint(ctx, x - rx * 0.35, y - ry * 0.45, rx * 0.3, ry * 0.14, -0.3, 0.7);
}

function drawSalameUsa(ctx: Ctx, f: number) {
  const { s } = cyc(f);
  // frame 1: crouched wind-up (leans back); frame 3: stretched forward (end of a dash)
  const lean = [0, -0.1, 0, 0.08][f];
  const dy = [0, 1.2, 0, -0.4][f];
  legs(ctx, -1, 4, f, { len: 7, spread: 12, thick: 2.8, color: LIMB, shoe: SHOE, stride: 6 });
  // far arm, tucked back like a sprinter
  hoseArm(ctx, -8, -1 + dy, -15 - s * 1.2, 1 + dy, { bend: -0.3, thick: 1.9, handR: 2.2 });
  ctx.save();
  ctx.translate(0, dy);
  ctx.rotate(lean);
  const X0 = -16, X1 = 15, Y = -7, R = 9;
  const body = (c: Ctx) => stickPath(c, X0, X1, Y, R);
  shape(ctx, body, {
    fill: radial(ctx, -4, -13, 26, [[0, PEP_HI], [0.55, PEP], [1, '#8e2414']]),
    ink: 2.2, shadow: PEP_SH, shadowOffset: [-1.4, -3], gloss: [{ x: -4, y: -13.2, rx: 9, ry: 1.6, rot: -0.02, alpha: 0.5 }],
  });
  clipTo(ctx, body, () => {
    // fat freckles + paprika specks seen through the casing, and casing wrinkles
    speckle(ctx, -1, -7, 15, 8, 26, PEP_FAT, 0.9, 11, 0.8);
    speckle(ctx, -1, -7, 15, 8, 22, '#5e120a', 0.55, 12, 0.7);
    for (const x of [-9, -3, 4, 10]) line(ctx, [[x, -15.6], [x + 1.2, -12.6], [x + 0.4, -10]], 0.6, PEP_SH, true, 0.55);
    // a glossy greasy sheen running along the top
    line(ctx, [[-12, -13], [0, -14.2], [13, -13.6]], 1.2, '#ffb07a', true, 0.55);
  });
  // the crimped tie at the back end + its string
  shape(ctx, (c) => roundRectPath(c, X0 - 7.6, Y - 3.6, 3.2, 7.2, 1.2), { fill: '#e9d9b8', ink: 1.2, shadow: '#b9a47c', shadowOffset: [-0.6, -0.6] });
  inkLine(ctx, [[X0 - 7.2, Y - 1.4], [X0 - 10.4, Y - 4 + s * 0.8], [X0 - 12.6, Y - 2.6 + s]], 0.9, '#efe2c2', true, 0.7);
  // the cut front: one slice already sliced off, leaning on it
  sliceFace(ctx, X1, Y, 3.6, R - 0.2, 21, 1.6);
  rot(ctx, X1 + 4.6, Y + 1.6, 0.35, () => sliceFace(ctx, 0, 0, 2.2, 6.4, 23, 1.2));
  // grease beading off the underside (animated drip)
  const d = [2.2, 3, 3.8, 2.8][f];
  shape(ctx, (c) => dripPath(c, -4, Y + R - 0.4, 2, d), { fill: GREASE, ink: 0.8, shadow: 'none', gloss: [{ x: -4.2, y: Y + R + d - 1.6, rx: 0.4, ry: 0.4, alpha: 0.95 }] });
  shape(ctx, (c) => dripPath(c, 7, Y + R - 0.4, 1.6, d * 0.7), { fill: GREASE, ink: 0.7, shadow: 'none' });
  // face, close to the cut end: furious, ready to ram
  eyePair(ctx, 4.6, -9, 2.9, { sp: 7.6, look: [0.5, 0.1], near: 1.1, brow: 0.55, browDy: 1.45, browTh: 1.5 });
  mouth(ctx, 6, -3.2, 7.4, 'snarl', { teeth: true, open: 0.9 });
  cheeks(ctx, [[0.2, -4.8], [10.6, -5]], 1.5, 0.8, '#ff9a6a', 0.35);
  // a bead of grease sweating off the brow
  const sy0 = -13 + [0, 0.6, 1.1, 0.5][f];
  shape(ctx, (c) => teardrop(c, -3.2, sy0, 1, 2.8), { fill: '#ffc46a', ink: 0.6, shadow: GREASE, shadowOffset: [-0.4, -0.5] });
  ctx.restore();
  // near arm: a fist forward (frame 1 pulled back to wind up)
  const ax = [16, 12, 16, 18][f], ay = [-2, -1, -3, -4][f];
  hoseArm(ctx, 9, -2 + dy, ax, ay + dy, { bend: 0.35, thick: 1.9, handR: 2.3 });
}

enemy('salame_usa', 54, 40, 26, drawSalameUsa);

// ===========================================================================
// 2. CANNOLO DI SFOGLIA — r14, chase with 3 layers. The puff-pastry horn of Venice.
// ===========================================================================

const PUFF = '#efb35a';
const PUFF_SH = '#c27a2c';
const PUFF_HI = '#fbdc96';
const CREAM = '#fffdf6';
const CREAM_SH = '#e3dccb';

/** The horn: from the tip (lower left) to the open mouth (upper right). lost = layers flaked off (0..2). */
function hornGeo(lost: number) {
  const tip: Pt = [-15 + lost * 0.8, 5];
  const mouthC: Pt = [8, -13];
  const mr = 11.5 - lost * 0.9;
  return { tip, mouthC, mr, ang: Math.atan2(mouthC[1] - tip[1], mouthC[0] - tip[0]) };
}

function hornPath(c: Ctx, lost: number) {
  const { tip, mouthC, mr, ang } = hornGeo(lost);
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const a: Pt = [mouthC[0] + nx * mr, mouthC[1] + ny * mr];
  const b: Pt = [mouthC[0] - nx * mr, mouthC[1] - ny * mr];
  c.moveTo(tip[0], tip[1]);
  c.quadraticCurveTo(tip[0] + (a[0] - tip[0]) * 0.45 + nx * 4.5, tip[1] + (a[1] - tip[1]) * 0.45 + ny * 4.5, a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.quadraticCurveTo(tip[0] + (b[0] - tip[0]) * 0.45 - nx * 4.5, tip[1] + (b[1] - tip[1]) * 0.45 - ny * 4.5, tip[0] - 0.5, tip[1] + 0.5);
  c.closePath();
}

function drawSfoglia(ctx: Ctx, f: number, lost: number) {
  const { s } = cyc(f);
  legs(ctx, 0, 5, f, { len: 7, spread: 11, thick: 2.8, color: LIMB, shoe: SHOE, stride: 4.6 });
  hoseArm(ctx, -9, -4, -15 - s * 0.6, -1 + Math.abs(s), { bend: -0.3, thick: 1.9, handR: 2.3 });
  ctx.save();
  ctx.rotate(Math.sin((f / 4) * TAU) * 0.04);
  const { mouthC, mr, ang } = hornGeo(lost);
  const horn = (c: Ctx) => hornPath(c, lost);
  shape(ctx, horn, { fill: PUFF, ink: 2.2, shadow: 'none' });
  clipTo(ctx, horn, () => {
    // the spiral of flaky pastry bands: each turn a toasted seam with a scalloped, flaky edge
    const { tip } = hornGeo(lost);
    const ax = Math.cos(ang), ay = Math.sin(ang), nx = -ay, ny = ax;
    const L = Math.hypot(mouthC[0] - tip[0], mouthC[1] - tip[1]);
    const turns = 7 - lost * 2;
    for (let i = 0; i < turns; i++) {
      const t0 = 0.12 + (i / 7) * 0.92;
      const half = 2.5 + t0 * (mr - 1.5);
      // a seam slants across the horn (the ribbon winds round it)
      const P = (u: number, back: number): Pt => {
        const along = t0 * L + u * 3.4 - back;
        return [tip[0] + ax * along + nx * u * half, tip[1] + ay * along + ny * u * half];
      };
      const seam: Pt[] = [];
      for (let k = 0; k <= 8; k++) seam.push(P(-1.2 + (k / 8) * 2.4, 0));
      // the band between this seam and the next, alternately lighter
      if (i % 2 === 0) {
        const next: Pt[] = [];
        for (let k = 8; k >= 0; k--) next.push(P(-1.2 + (k / 8) * 2.4, -L / 7));
        wash(ctx, (c) => polyPath(c, [...seam, ...next]), PUFF_HI, 0.75);
      }
      line(ctx, seam, 1.7, '#a8611c', true, 0.95);
      line(ctx, seam.map(([x, y]) => [x - ax * 1.1, y - ay * 1.1] as Pt), 0.8, '#fff1c4', true, 0.9);
      // flaky scallops along the seam
      for (let k = 1; k < 8; k += 2) {
        const [x, y] = seam[k];
        shape(ctx, (c) => ellipsePath(c, x - ax * 1.4, y - ay * 1.4, 1.5, 0.9, ang), { fill: PUFF_HI, ink: 0.45, inkColor: '#a8611c', shadow: 'none' });
      }
    }
    // deep bake on the shadow side, a dusting of icing sugar on the light side
    wash(ctx, (c) => { c.moveTo(-4, 14); c.lineTo(20, -10); c.lineTo(24, 14); c.closePath(); }, '#8a4a14', 0.28);
    speckle(ctx, -3, -4, 9, 8, 22, '#ffffff', 0.6, 31 + lost, 0.9);
  });
  // re-ink the silhouette (the bands were clipped over the inner half of the outline)
  ctx.save();
  ctx.beginPath();
  horn(ctx);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  // the open end: the dark rim of the horn, heaped with piped whipped cream (less as it flakes apart)
  rot(ctx, mouthC[0], mouthC[1], ang + Math.PI / 2, () => {
    shape(ctx, (c) => ellipsePath(c, 0, 0, mr, mr * 0.42), { fill: '#b8702a', ink: 1.6, shadow: 'none' });
    const k = 1 - lost * 0.28;
    const swirl = (c: Ctx) => {
      c.moveTo(-mr * 0.95, 0);
      c.quadraticCurveTo(-mr * 1.05, -6 * k, -mr * 0.55, -8 * k);
      c.quadraticCurveTo(-mr * 0.65, -13 * k, -1.5, -14 * k);
      c.quadraticCurveTo(0.5, -20 * k, 3, -21 * k);
      c.quadraticCurveTo(4.2, -16 * k, mr * 0.45, -13 * k);
      c.quadraticCurveTo(mr * 0.95, -10 * k, mr * 0.7, -6 * k);
      c.quadraticCurveTo(mr * 1.1, -3 * k, mr * 0.95, 0);
      c.quadraticCurveTo(0, mr * 0.4, -mr * 0.95, 0);
      c.closePath();
    };
    shape(ctx, swirl, { fill: CREAM, ink: 1.6, shadow: CREAM_SH, shadowOffset: [-1.6, -1.2], gloss: [{ x: -3, y: -12 * k, rx: 1.8, ry: 0.9, rot: -0.3, alpha: 0.9 }] });
    // piped ridges
    for (const [x0, y0, x1, y1] of [[-mr * 0.7, -2, -1, -9], [-2, -6, 3, -16], [2, -3, mr * 0.6, -9]] as [number, number, number, number][]) {
      line(ctx, [[x0, y0 * k], [(x0 + x1) / 2 + 1, ((y0 + y1) / 2) * k], [x1, y1 * k]], 0.6, CREAM_SH, true, 0.9);
    }
    if (lost < 2) {
      // a candied cherry on top
      shape(ctx, (c) => circlePath(c, 2.6, -21.5 * k, 2.6), { fill: '#d8202e', ink: 1.1, shadowOffset: [-0.7, -0.8], gloss: [{ x: 1.8, y: -22.4 * k, rx: 0.8, ry: 0.5, alpha: 0.95 }] });
    }
  });
  // face on the pastry: pompous, a pinky-up fake
  eyePair(ctx, -1.6, -3.4, 2.7, { sp: 7.6, look: [0.42, 0.16], lidL: 'half', lidR: 'half', near: 1.1, brow: -0.18, browDy: 1.6, browTh: 1.3 });
  mouth(ctx, -0.4, 2.6, 6.4, 'smirk', { teeth: false });
  cheeks(ctx, [[-6.6, 0.6], [4, 0.2]], 1.4, 0.7, '#e8703a', 0.35);
  // falling flakes when it has lost layers
  if (lost > 0) {
    const R = rng(70 + lost * 3 + f);
    for (let i = 0; i < lost * 2; i++) {
      const x = -12 + R() * 22, y = 8 + R() * 6;
      shape(ctx, (c) => ellipsePath(c, x, y, 1.5, 0.8, R() * 3), { fill: PUFF_HI, ink: 0.6, shadow: 'none' });
    }
  }
  ctx.restore();
  // near arm: holding a little sign of authenticity up (a paper flag with a red stripe: "siciliano", wink)
  const hx = 14 + s * 0.4, hy = -7 - Math.abs(s) * 0.6;
  line(ctx, [[hx, hy + 3], [hx + 0.6, hy - 9]], 1.6, INK, false);
  line(ctx, [[hx, hy + 3], [hx + 0.6, hy - 9]], 0.7, '#d8b886', false);
  shape(ctx, (c) => { c.moveTo(hx + 0.6, hy - 9); c.lineTo(hx + 7.4, hy - 7.6 + s * 0.4); c.lineTo(hx + 0.6, hy - 5.2); c.closePath(); }, { fill: '#f2e6c8', ink: 0.9, shadow: 'none' });
  line(ctx, [[hx + 1, hy - 7.2], [hx + 5.6, hy - 7.4 + s * 0.3]], 0.8, '#d8202e', false);
  hoseArm(ctx, 8.6, -4, hx, hy, { bend: 0.3, thick: 1.9, handR: 2.3 });
}

enemy('sfoglia', 58, 66, 44, (ctx, f) => drawSfoglia(ctx, f, 0), 27);
enemy('sfoglia_peel1', 58, 66, 44, (ctx, f) => drawSfoglia(ctx, f, 1), 27);
enemy('sfoglia_peel2', 58, 66, 44, (ctx, f) => drawSfoglia(ctx, f, 2), 27);

// ===========================================================================
// 3. CANNOLO FLUO — r13, burster. A floating cannolo stuffed with neon fillings.
// ===========================================================================

const SHELL = '#c9853e';
const SHELL_SH = '#8a5222';
const SHELL_HI = '#ebb46e';
const NEON_PINK = '#ff3fb8';
const NEON_CYAN = '#28e4ff';
const SPRINKLES = ['#ffe23a', '#3ad84a', '#ff5a3a', '#4a7aff', '#ffffff', '#c04aff'];

/** A fried cannolo shell (a tube seen from the side), centred at (0,0), length L, radius r: blistered and bubbly. */
function shell(ctx: Ctx, L: number, r: number, seed: number, soggy = 0) {
  const body = (c: Ctx) => roundRectPath(c, -L / 2, -r, L, r * 2, r * 0.45);
  const fill = soggy ? mix2(SHELL_HI, '#e6cfa6', soggy) : SHELL;
  shape(ctx, body, { fill: radial(ctx, -L * 0.2, -r * 0.6, L * 0.7, [[0, soggy ? '#f2dcb4' : SHELL_HI], [0.55, fill], [1, soggy ? '#b89466' : SHELL_SH]]), ink: 2, shadow: soggy ? '#a8865a' : SHELL_SH, shadowOffset: [-1.4, -2.2] });
  clipTo(ctx, body, () => {
    // the blisters of the fried scorza: little raised bubbles with a dark ring
    const R = rng(seed);
    for (let i = 0; i < Math.round(L * 0.5); i++) {
      const x = -L / 2 + R() * L, y = -r + R() * r * 2, br = 0.6 + R() * 1.1;
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, x, y, br);
      ctx.fillStyle = soggy ? 'rgba(160,120,70,0.35)' : 'rgba(110,60,20,0.5)';
      ctx.fill();
      ctx.beginPath();
      circlePath(ctx, x - br * 0.3, y - br * 0.3, br * 0.45);
      ctx.fillStyle = soggy ? 'rgba(255,245,220,0.4)' : 'rgba(255,220,160,0.75)';
      ctx.fill();
      ctx.restore();
    }
    line(ctx, [[-L / 2 + 2, -r * 0.55], [L / 2 - 2, -r * 0.6]], 1, '#ffffff', false, soggy ? 0.15 : 0.35);
  });
}

function mix2(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

/** A bulging end of filling (cx, cy), radius r, colour col, with sprinkles. dir: −1 left end, +1 right end. */
function fillingEnd(ctx: Ctx, cx: number, cy: number, r: number, col: string, dir: number, seed: number, sprinkles = true) {
  const b = (c: Ctx) => {
    c.moveTo(cx, cy - r);
    c.quadraticCurveTo(cx + dir * r * 1.3, cy - r * 1.05, cx + dir * r * 1.15, cy - r * 0.1);
    c.quadraticCurveTo(cx + dir * r * 1.35, cy + r * 0.8, cx, cy + r);
    c.closePath();
  };
  shape(ctx, b, { fill: col, ink: 1.6, shadow: shade(col, 0.22), shadowOffset: [-dir * 0.6 - 0.6, -1.2], gloss: [{ x: cx + dir * r * 0.45, y: cy - r * 0.5, rx: r * 0.32, ry: r * 0.18, rot: -0.3, alpha: 0.85 }] });
  if (!sprinkles) return;
  const R = rng(seed);
  clipTo(ctx, b, () => {
    for (let i = 0; i < 9; i++) {
      const x = cx + dir * (0.2 + R() * 1.0) * r, y = cy + (R() - 0.5) * r * 1.6;
      rot(ctx, x, y, R() * Math.PI, () => {
        ctx.fillStyle = SPRINKLES[i % SPRINKLES.length];
        ctx.fillRect(-1.1, -0.35, 2.2, 0.7);
      });
    }
  });
}

function drawFluo(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const tilt = -0.18 + Math.sin(ph) * 0.06;
  // the neon glow pulses
  softGlow(ctx, -12, -8, 14 + Math.sin(ph) * 1.5, NEON_PINK, 0.38);
  softGlow(ctx, 13, -10, 14 + Math.cos(ph) * 1.5, NEON_CYAN, 0.38);
  // far arm: waving a sprinkle shaker
  hoseArm(ctx, -6, -1, -12 + Math.sin(ph) * 1.4, 7, { bend: -0.3, thick: 1.8, handR: 2.2 });
  ctx.save();
  ctx.translate(0, -9);
  ctx.rotate(tilt);
  fillingEnd(ctx, -13.5, 0, 7.6, NEON_PINK, -1, 41 + f);
  fillingEnd(ctx, 13.5, 0, 7.6, NEON_CYAN, 1, 51 + f);
  shell(ctx, 28, 7.8, 61);
  // face on the shell: a flashy tourist-trap grin
  eyePair(ctx, 1.6, -1.6, 2.6, { sp: 7.4, look: [0.3, 0.2], lidL: 'none', lidR: 'none', near: 1.08, brow: -0.2, browDy: 1.6, browTh: 1.2 });
  mouth(ctx, 2.2, 3.6, 7, 'grin', { teeth: true, open: 0.8 });
  ctx.restore();
  // sparkles of artificial colour
  const tw: Pt[] = [[-20, -21], [21, -23], [-2, -24], [16, 0]];
  for (let i = 0; i < 4; i++) {
    const [x, y] = tw[(i + f) % 4];
    twinkle(ctx, x, y, i === 0 ? 2.6 : 1.8, i % 2 ? '#bff8ff' : '#ffd0ef', 0.95);
  }
  // near arm: thumbs up ("authentic!")
  hoseArm(ctx, 7, -3, 13, 4 + Math.cos(ph), { bend: 0.3, thick: 1.8, handR: 2.3 });
}

enemy('fluo', 56, 42, 24, drawFluo);

// ===========================================================================
// 4. CANNOLO AMMUDDATO — r15, hopper. The soggy pre-filled cannolo, sagging in an arch.
// ===========================================================================

const RICOTTA = '#fbf6ea';
const RICOTTA_SH = '#dcd2bc';

function drawAmmuddato(ctx: Ctx, f: number) {
  // a waterlogged cannolo standing on one end, its top half wilted over like a dying flower,
  // ricotta drooling out of the drooping end. 0 neutral, 1 squashed (just landed), 2 between, 3 airborne
  const squash = [1, 0.84, 0.96, 1.1][f];
  const droop = [1, 1.2, 1.05, 0.8][f];
  const lift = [0, 0, -1, -2][f];
  ctx.save();
  ctx.translate(0, lift);
  // centre line: up from the floor, then bending over to the right and down
  const base: Pt = [-8, 11];
  const pts: Pt[] = [];
  const H = 14 * squash;
  for (let i = 0; i <= 6; i++) pts.push([base[0] + Math.sin((i / 6) * 0.4) * 1.2, base[1] - (i / 6) * H]);
  const top = pts[6];
  const R0 = 10.5;
  for (let i = 1; i <= 8; i++) {
    // over the top and well down the far side: the wilted half hangs
    const a = Math.PI - (i / 8) * Math.PI * (0.92 + 0.25 * (droop - 1));
    pts.push([top[0] + R0 + Math.cos(a) * R0, top[1] - Math.sin(a) * R0 + (i / 8) * (i / 8) * 7 * droop]);
  }
  const N = pts.length - 1;
  const W = 5.6;
  const side = (o: number): Pt[] => pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const w = W * (1 + (i > 5 && i < 10 ? 0.12 : 0)) * o;
    return [p[0] - dy * w, p[1] + dx * w] as Pt;
  });
  const L = side(1), Rr = side(-1);
  const outline = [...L, ...Rr.slice().reverse()];
  const tube = (c: Ctx) => smoothPath(c, outline, true, 0.45);
  // ricotta squeezed out at the foot
  shape(ctx, (c) => blobPath(c, base[0] + 1, 12.2, 10, 2.6, 0.25, 10, 4), { fill: RICOTTA, ink: 1.3, shadow: RICOTTA_SH, shadowOffset: [-0.8, -0.8] });
  speckle(ctx, base[0] + 1, 12.4, 7, 1.4, 5, '#3a2014', 0.55, 3, 0.95);
  shape(ctx, tube, {
    fill: radial(ctx, -8, -10, 30, [[0, '#f0d6a8'], [0.55, '#d6ae74'], [1, '#a87e4c']]),
    ink: 2.2, shadow: '#9a7444', shadowOffset: [-1.4, -1.6],
  });
  clipTo(ctx, tube, () => {
    // limp, faded blisters and dark soaked-through patches
    const R = rng(83);
    for (let i = 0; i < 18; i++) {
      const k = Math.round(R() * N), x = pts[k][0] + (R() - 0.5) * 9, y = pts[k][1] + (R() - 0.5) * 9;
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, x, y, 0.6 + R() * 0.8);
      ctx.fillStyle = 'rgba(130,90,50,0.35)';
      ctx.fill();
      ctx.restore();
    }
    for (const [i, rx, ry] of [[2, 4.6, 3.6], [7, 5.4, 4], [11, 3.8, 3]] as [number, number, number][]) {
      wash(ctx, (c) => blobPath(c, pts[i][0] + 1.5, pts[i][1] + 1, rx, ry, 0.3, 8, i * 7), '#8a6236', 0.36);
    }
    line(ctx, side(0.55).slice(1, 10), 1, '#fff2d6', true, 0.35);
  });
  // the drooping open end: ricotta with chocolate chips drooling out, a string of it about to drop
  const e = pts[N], n = pts[N - 1];
  const a = Math.atan2(e[1] - n[1], e[0] - n[0]);
  rot(ctx, e[0], e[1], a, () => {
    shape(ctx, (c) => ellipsePath(c, 0.2, 0, 2.2, W * 0.95), { fill: '#b88a55', ink: 1.4, shadow: 'none' });
    const fil = (c: Ctx) => { c.moveTo(0, -W * 0.8); c.quadraticCurveTo(5.6, -W * 0.7, 5, 0.6); c.quadraticCurveTo(5.4, W * 0.7, 0, W * 0.8); c.closePath(); };
    shape(ctx, fil, { fill: RICOTTA, ink: 1.3, shadow: RICOTTA_SH, shadowOffset: [-0.8, -0.8], gloss: [{ x: 1.6, y: -2.6, rx: 1.2, ry: 0.6, alpha: 0.8 }] });
    speckle(ctx, 2, 0, 2.2, 4, 4, '#3a2014', 0.55, 9, 0.95);
  });
  const d = [4, 5.2, 4.6, 3][f];
  shape(ctx, (c) => dripPath(c, e[0] + 1.6, e[1] + 4, 2.6, d), { fill: RICOTTA, ink: 1, shadow: RICOTTA_SH, shadowOffset: [-0.5, -0.5], gloss: [{ x: e[0] + 1.2, y: e[1] + 4 + d - 1.6, rx: 0.5, ry: 0.4, alpha: 0.9 }] });
  // face on the upright part: soggy, sulky, sleepy eyes
  const fx = base[0] + 0.6, fy = base[1] - H * 0.62;
  eye(ctx, fx - 2.6, fy, 2.1, { look: [0.4, 0.3], lid: 'half', pupil: 0.55 });
  eye(ctx, fx + 2.8, fy - 0.3, 2.35, { look: [0.4, 0.3], lid: 'half', pupil: 0.52 });
  brow(ctx, fx - 3, fy - 3, 3.6, -0.35, 1.2);
  brow(ctx, fx + 3.2, fy - 3.3, 3.8, 0.35, 1.2);
  mouth(ctx, fx + 0.2, fy + 4.2, 4.4, 'wavy', { teeth: false });
  // a drop of whey sweating off its temple
  shape(ctx, (c) => teardrop(c, fx - 7.6, fy - 2.4 + (f % 2), 0.9, 2.6), { fill: '#e8f4ff', ink: 0.6, shadow: '#a8c4d8', shadowOffset: [-0.4, -0.5] });
  ctx.restore();
}

enemy('ammuddato', 52, 44, 28, drawAmmuddato);

// ===========================================================================
// 5. MARGARINA — r14, puddler (butter slicks). A tub of margarine in a butter disguise.
// ===========================================================================

const TUB = '#fbf3d6';
const TUB_SH = '#d6c99a';
const MARG = '#ffe36a';
const MARG_SH = '#e8b830';

function drawMargarina(ctx: Ctx, f: number) {
  const { s } = cyc(f);
  legs(ctx, 0, 6, f, { len: 4, spread: 12, thick: 3, color: LIMB, shoe: SHOE, stride: 4.4 });
  hoseArm(ctx, -12.5, -4, -17 - s * 0.6, 1 + Math.abs(s), { bend: -0.35, thick: 1.9, handR: 2.3 });
  ctx.save();
  ctx.translate(0, -0.6 + Math.abs(s) * -0.3);
  // the tub: a wide tapered cylinder
  const tub = (c: Ctx) => {
    c.moveTo(-14, -10);
    c.lineTo(-12, 6.5);
    c.quadraticCurveTo(0, 9.6, 12, 6.5);
    c.lineTo(14, -10);
    c.quadraticCurveTo(0, -6.6, -14, -10);
    c.closePath();
  };
  shape(ctx, tub, { fill: TUB, ink: 2.2, shadow: TUB_SH, shadowOffset: [-2, -1.6], gloss: [{ x: -10, y: -2, rx: 1, ry: 5.5, alpha: 0.7 }] });
  clipTo(ctx, tub, () => {
    // printed label band: green with a two-leaf "vegetable" logo (no text)
    const band = (c: Ctx) => { c.moveTo(-15, -1); c.quadraticCurveTo(0, 2.4, 15, -1); c.lineTo(15, 5); c.quadraticCurveTo(0, 8.4, -15, 5); c.closePath(); };
    ctx.save();
    ctx.beginPath();
    band(ctx);
    ctx.fillStyle = '#58b84a';
    ctx.fill();
    ctx.restore();
    line(ctx, [[-15, -0.6], [0, 2.8], [15, -0.6]], 0.7, '#ffe36a', true, 0.95);
    wash(ctx, (c) => { c.moveTo(8, -12); c.lineTo(16, -12); c.lineTo(16, 10); c.lineTo(9, 10); c.closePath(); }, '#7a6a2a', 0.22);
  });
  for (const [a, x] of [[-0.6, -1.4], [0.6, 1.4]] as [number, number][]) {
    rot(ctx, x, 3.6, a, () => shape(ctx, (c) => ellipsePath(c, 0, -1.2, 1.3, 2.6), { fill: '#bff07a', ink: 0.6, inkColor: '#1f5a22', shadow: 'none' }));
  }
  // the rim and the swirl of yellow spread on top
  shape(ctx, (c) => ellipsePath(c, 0, -10, 14, 3.6), { fill: '#efe2b0', ink: 1.8, shadow: 'none' });
  const swirl = (c: Ctx) => {
    c.moveTo(-12, -10);
    c.quadraticCurveTo(-10, -14, -4, -14.4);
    c.quadraticCurveTo(-1, -18.6, 3, -17.6);
    c.quadraticCurveTo(7, -16, 6.4, -13.6);
    c.quadraticCurveTo(11.6, -13, 12, -10);
    c.quadraticCurveTo(0, -7.2, -12, -10);
    c.closePath();
  };
  shape(ctx, swirl, { fill: MARG, ink: 1.4, shadow: MARG_SH, shadowOffset: [-1, -1.2], gloss: [{ x: -4, y: -14, rx: 2.2, ry: 0.7, rot: -0.2, alpha: 0.9 }] });
  line(ctx, [[-6, -11.4], [-1, -14.4], [4, -14.6]], 0.6, MARG_SH, true, 0.9);
  // the lid, pushed up and back like a cap
  rot(ctx, -5, -20, -0.42, () => {
    shape(ctx, (c) => ellipsePath(c, 0, 0, 13, 3.4), { fill: '#f7e9a8', ink: 1.8, shadow: '#d4be6a', shadowOffset: [-1.2, -1.2], gloss: [{ x: -5, y: -1, rx: 4, ry: 0.8, alpha: 0.75 }] });
    shape(ctx, (c) => ellipsePath(c, 0, -0.6, 9, 2), { fill: '#58b84a', ink: 0.7, shadow: 'none' });
  });
  // the disguise: fake glasses with a plastic nose and a bushy moustache (it wants to pass for butter)
  const ey = -4;
  eye(ctx, -3.8, ey, 2.4, { look: [0.4, 0.15], lid: 'angry-l', pupil: 0.56 });
  eye(ctx, 4.2, ey - 0.2, 2.6, { look: [0.4, 0.15], lid: 'angry-r', pupil: 0.54 });
  for (const x of [-3.8, 4.2]) {
    ctx.save();
    ctx.beginPath();
    circlePath(ctx, x, ey, 3.5);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }
  line(ctx, [[-0.3, ey - 0.6], [0.7, ey - 0.6]], 1.2, INK);
  brow(ctx, -3.8, ey - 4.8, 5, 0.3, 1.8);
  brow(ctx, 4.4, ey - 5, 5.2, -0.3, 1.8);
  shape(ctx, (c) => ellipsePath(c, 0.6, ey + 2.6, 2.1, 1.6), { fill: '#f2a88a', ink: 1, shadowOffset: [-0.5, -0.5], gloss: [{ x: 0, y: ey + 2.1, rx: 0.6, ry: 0.4, alpha: 0.9 }] });
  const mus = (c: Ctx) => {
    c.moveTo(0.6, ey + 3.8);
    c.quadraticCurveTo(-3, ey + 3.4, -5.6, ey + 5.6);
    c.quadraticCurveTo(-3, ey + 6.4, 0.6, ey + 5);
    c.quadraticCurveTo(4.2, ey + 6.4, 6.8, ey + 5.4);
    c.quadraticCurveTo(4.2, ey + 3.4, 0.6, ey + 3.8);
    c.closePath();
  };
  shape(ctx, mus, { fill: '#3a2418', ink: 0.8, shadow: 'none', gloss: [{ x: -2, y: ey + 4.4, rx: 1.4, ry: 0.4, alpha: 0.35 }] });
  mouth(ctx, 0.8, ey + 7.6, 5.4, 'grin', { teeth: true, open: 0.7 });
  ctx.restore();
  // near arm: a butter knife smeared with yellow spread (passing it off as butter)
  const hx = 16 + s * 0.4, hy = -6 - Math.abs(s) * 0.5;
  rot(ctx, hx, hy, -1.15, () => {
    shape(ctx, (c) => roundRectPath(c, -1, -1.2, 5, 2.4, 1), { fill: '#d8a85a', ink: 0.9, shadow: 'none' });
    shape(ctx, (c) => { c.moveTo(4, -1.4); c.lineTo(12, -1.2); c.quadraticCurveTo(13.4, 0, 12, 1.2); c.lineTo(4, 1.4); c.closePath(); }, { fill: '#dfe5ee', ink: 0.9, shadow: '#99a6b9', shadowOffset: [-0.4, -0.6] });
    shape(ctx, (c) => blobPath(c, 9.6, -0.2, 2.6, 1.6, 0.3, 7, 3), { fill: MARG, ink: 0.7, shadow: 'none' });
  });
  hoseArm(ctx, 12.5, -3, hx, hy, { bend: 0.35, thick: 1.9, handR: 2.3 });
}

enemy('margarina', 46, 54, 38, drawMargarina);

// ===========================================================================
// 6. GRASSO DI PALMA — r14, lobber. A block of orange palm fat with a palm tree on its head.
// ===========================================================================

const PALM = '#f08a32';
const PALM_SH = '#c45a1a';
const PALM_HI = '#ffc27a';
const FROND = '#3fae3a';
const FROND_SH = '#227a2a';
const TRUNK = '#9a6232';

function frond(ctx: Ctx, x: number, y: number, L: number, a: number, droop: number) {
  rot(ctx, x, y, a, () => {
    const spine: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      spine.push([t * L, Math.pow(t, 2) * droop * L]);
    }
    const top: Pt[] = [], bot: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const w = Math.sin(t * Math.PI) * L * 0.22 + 0.4;
      const [px, py] = spine[i];
      top.push([px, py - w * (i % 2 ? 0.7 : 1)]);
      bot.push([px, py + w * (i % 2 ? 1 : 0.65)]);
    }
    const leaf = [...top, ...bot.slice().reverse()];
    shape(ctx, (c) => smoothPath(c, leaf, true, 0.3), { fill: FROND, ink: 1.1, shadow: FROND_SH, shadowOffset: [0, -1], gloss: [{ x: L * 0.35, y: -L * 0.05, rx: L * 0.15, ry: 0.5, alpha: 0.5 }] });
    line(ctx, spine, 0.6, FROND_SH, true, 0.9);
  });
}

function drawPalma(ctx: Ctx, f: number) {
  const { s } = cyc(f);
  legs(ctx, 0, 6, f, { len: 4, spread: 12, thick: 3, color: LIMB, shoe: SHOE, stride: 4.2 });
  hoseArm(ctx, -13, -4, -17 - s * 0.6, 2 + Math.abs(s), { bend: -0.35, thick: 1.9, handR: 2.3 });
  ctx.save();
  ctx.translate(0, Math.abs(s) * -0.4);
  // the little palm tree on its head (behind the block's top edge)
  const sway = Math.sin((f / 4) * TAU) * 0.08;
  inkLine(ctx, [[0, -14], [1 + sway * 10, -22], [2.6 + sway * 20, -30]], 2.6, TRUNK, true, 1.1);
  for (const yy of [-17, -20.5, -24, -27.5]) line(ctx, [[-0.6 + (yy + 14) * -0.1, yy], [2.2 + (yy + 14) * -0.12, yy - 0.6]], 0.6, '#6a3a18', false, 0.8);
  const tx = 2.6 + sway * 20, ty = -30;
  for (const [a, L, d] of [[-2.7, 11, 0.35], [-2.0, 12, 0.25], [-1.1, 10, 0.2], [-0.4, 12, 0.28], [0.25, 11, 0.38]] as [number, number, number][]) frond(ctx, tx, ty, L, a + sway, d);
  shape(ctx, (c) => { circlePath(c, tx - 1.4, ty + 1.6, 1.6); circlePath(c, tx + 1.3, ty + 1.8, 1.5); }, { fill: '#6a4220', ink: 0.8, shadow: 'none', gloss: [{ x: tx - 1.8, y: ty + 1, rx: 0.5, ry: 0.3, alpha: 0.7 }] });
  // the block of fat
  const block = (c: Ctx) => roundRectPath(c, -13, -15, 26, 22, 5);
  shape(ctx, block, {
    fill: radial(ctx, -6, -12, 28, [[0, PALM_HI], [0.5, PALM], [1, '#d8661e']]),
    ink: 2.2, shadow: PALM_SH, shadowOffset: [-2, -2.2], gloss: [{ x: -7, y: -11, rx: 3.6, ry: 1.4, rot: -0.3, alpha: 0.75 }],
  });
  clipTo(ctx, block, () => {
    // waxy, slightly granular texture + knife marks where it was cut from the slab
    speckle(ctx, 0, -4, 11, 9, 24, '#ffd29a', 0.7, 91, 0.6);
    line(ctx, [[-13, -6], [-4, -8], [6, -5]], 0.6, PALM_SH, true, 0.5);
    // the torn paper wrapper round its lower half
    const paper = (c: Ctx) => {
      c.moveTo(-14, 0);
      c.lineTo(-10, -2.4);
      c.lineTo(-7, 0.6);
      c.lineTo(-3, -2.8);
      c.lineTo(1, 0);
      c.lineTo(5, -3);
      c.lineTo(9, 0.4);
      c.lineTo(14, -2);
      c.lineTo(14, 10);
      c.lineTo(-14, 10);
      c.closePath();
    };
    ctx.save();
    ctx.beginPath();
    paper(ctx);
    ctx.fillStyle = '#efe6d2';
    ctx.fill();
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = '#8a7a5a';
    ctx.stroke();
    ctx.restore();
    wash(ctx, (c) => c.rect(6, -4, 10, 14), '#7a6a50', 0.25);
    // a grease stain soaking through the paper
    wash(ctx, (c) => blobPath(c, -6, 4, 3.6, 2.4, 0.3, 8, 5), PALM, 0.45);
  });
  // face: slick and greasy
  eyePair(ctx, 0.6, -8.4, 2.8, { sp: 8, look: [0.45, 0.25], near: 1.08, brow: 0.42, browDy: 1.5, browTh: 1.5 });
  mouth(ctx, 1.6, -2.6, 7.4, 'grin', { teeth: true, open: 0.8 });
  cheeks(ctx, [[-5, -4.6], [7.6, -4.8]], 1.5, 0.8, '#e8401a', 0.35);
  ctx.restore();
  // near arm raised with a glob of fat, ready to lob
  const hx = 15 + s * 0.4, hy = -15 - Math.abs(s) * 0.6;
  hoseArm(ctx, 12.6, -6, hx, hy, { bend: 0.4, thick: 1.9, handR: 2.3 });
  shape(ctx, (c) => blobPath(c, hx + 0.4, hy - 3.4, 3.2, 2.6, 0.25, 8, 7), { fill: PALM, ink: 1, shadow: PALM_SH, shadowOffset: [-0.6, -0.7], gloss: [{ x: hx - 0.6, y: hy - 4.4, rx: 1, ry: 0.6, alpha: 0.9 }] });
}

enemy('palma', 48, 64, 46, drawPalma);

// ===========================================================================
// 7. LIEVITO DI BIRRA — r9, swarm. A small cube of fresh baker's yeast in foil.
// ===========================================================================

const YEAST = '#dccb9c';
const YEAST_SH = '#b29c66';
const FOIL = '#d8dee6';
const FOIL_SH = '#8c96a6';

function drawLievito(ctx: Ctx, f: number) {
  const { s } = cyc(f);
  legs(ctx, 0, 3.6, f, { len: 4.4, spread: 7, thick: 2, color: LIMB, shoe: SHOE, stride: 3.4 });
  ctx.save();
  ctx.translate(0, Math.abs(s) * -0.5);
  // the cube in 3/4: top, front and side faces
  const top = (c: Ctx) => polyPath(c, [[-8, -9], [-1, -12.4], [8.6, -10], [1.6, -6.8]]);
  const front = (c: Ctx) => polyPath(c, [[-8, -9], [1.6, -6.8], [1.6, 4], [-8, 1.8]]);
  const side = (c: Ctx) => polyPath(c, [[1.6, -6.8], [8.6, -10], [8.6, 0.8], [1.6, 4]]);
  group(ctx, [
    { build: side, style: { fill: YEAST_SH, shadow: 'none' } },
    { build: front, style: { fill: YEAST, shadow: 'none' } },
    { build: top, style: { fill: '#efe2b8', shadow: 'none' } },
  ], 1.6);
  // crumbly texture
  clipTo(ctx, (c) => { top(c); front(c); side(c); }, () => {
    speckle(ctx, 0, -4, 8, 8, 30, '#9a8450', 0.45, 7, 0.7);
    speckle(ctx, 0, -9, 7, 3, 12, '#ffffff', 0.4, 8, 0.6);
  });
  // the silver foil it is half unwrapped from (round its bottom)
  const foil = (c: Ctx) => {
    c.moveTo(-8.6, -1);
    c.lineTo(-6, -2.6);
    c.lineTo(-3.4, -0.6);
    c.lineTo(-0.4, -2.2);
    c.lineTo(1.6, -0.4);
    c.lineTo(4.6, -3.6);
    c.lineTo(9.2, -2.6);
    c.lineTo(9.2, 1.6);
    c.lineTo(1.6, 4.8);
    c.lineTo(-8.6, 2.6);
    c.closePath();
  };
  shape(ctx, foil, { fill: FOIL, ink: 1.2, shadow: FOIL_SH, shadowOffset: [-1.2, -1.4], gloss: [{ x: -4, y: 0.4, rx: 2.4, ry: 0.6, alpha: 0.9 }] });
  line(ctx, [[-3.4, -0.6], [-2.4, 2.8]], 0.5, FOIL_SH, false, 0.9);
  line(ctx, [[4.6, -3.6], [5, 1.2]], 0.5, FOIL_SH, false, 0.9);
  // face on the front: cheeky, puffed up
  eye(ctx, -5, -4.6, 1.7, { look: [0.5, 0.15], lid: 'angry-l', pupil: 0.56 });
  eye(ctx, -0.6, -3.8, 1.85, { look: [0.5, 0.15], lid: 'angry-r', pupil: 0.54 });
  mouth(ctx, -2.6, -0.6, 3.6, 'grin', { teeth: true, open: 0.8 });
  ctx.restore();
  // fermentation bubbles rising (they cycle)
  for (let i = 0; i < 3; i++) {
    const k = ((f + i * 1.4) % 4) / 4;
    const x = 2 + i * 3 + Math.sin(k * 6 + i) * 1, y = -13 - k * 9, r = 0.8 + k * 1.1;
    ctx.save();
    ctx.globalAlpha = 1 - k * 0.6;
    ctx.beginPath();
    circlePath(ctx, x, y, r);
    ctx.fillStyle = 'rgba(255,250,235,0.65)';
    ctx.fill();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = '#7a6a40';
    ctx.stroke();
    ctx.restore();
  }
}

enemy('lievito', 30, 30, 17, drawLievito);

// ===========================================================================
// 8. CONSERVANTE — r14, aura. A lab flask of fizzing green preservative.
// ===========================================================================

const ACID = '#8ef03a';
const ACID_SH = '#4aa81a';
const ACID_HI = '#d8ff9a';
const GLASS = '#e8f6fb';

function flaskPath(c: Ctx) {
  c.moveTo(-3.6, -24);
  c.lineTo(-3.6, -14);
  c.lineTo(-14, 4);
  c.quadraticCurveTo(-15.6, 8.6, -10.6, 8.6);
  c.lineTo(10.6, 8.6);
  c.quadraticCurveTo(15.6, 8.6, 14, 4);
  c.lineTo(3.6, -14);
  c.lineTo(3.6, -24);
  c.closePath();
}

function drawConservante(ctx: Ctx, f: number) {
  const { s } = cyc(f);
  legs(ctx, 0, 8, f, { len: 3, spread: 12, thick: 3, color: LIMB, shoe: SHOE, stride: 4 });
  hoseArm(ctx, -10, -4, -16 - s * 0.6, 1 + Math.abs(s), { bend: -0.35, thick: 1.9, handR: 2.3 });
  ctx.save();
  ctx.translate(0, Math.abs(s) * -0.4);
  // a sickly green glow
  softGlow(ctx, 0, -2, 18, '#a6ff4a', 0.28);
  shape(ctx, flaskPath, { fill: GLASS, ink: 2.2, shadow: 'none' });
  const lv = -6 + [0, 0.6, 0, -0.6][f];
  clipTo(ctx, flaskPath, () => {
    const liquid = (c: Ctx) => { c.moveTo(-16, lv); c.quadraticCurveTo(0, lv + 1.4, 16, lv); c.lineTo(16, 10); c.lineTo(-16, 10); c.closePath(); };
    ctx.save();
    ctx.beginPath();
    liquid(ctx);
    ctx.fillStyle = radial(ctx, -4, 0, 20, [[0, ACID_HI], [0.5, ACID], [1, ACID_SH]]);
    ctx.fill();
    ctx.restore();
    line(ctx, [[-16, lv], [0, lv + 0.7], [16, lv]], 1.2, '#f2ffd0', true, 0.95);
    // the bubbles fizz upward (they cycle)
    for (let i = 0; i < 6; i++) {
      const k = ((f + i * 0.7) % 4) / 4;
      const x = -8 + i * 3.3 + Math.sin(i * 2 + k * 4) * 1.2, y = 7 - k * 12;
      if (y < lv) continue;
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, x, y, 0.7 + (i % 3) * 0.35);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.stroke();
      ctx.restore();
    }
    // glass: cool shadow on the right + gloss streak
    wash(ctx, (c) => { c.moveTo(6, -24); c.lineTo(16, 4); c.lineTo(16, 10); c.lineTo(8, 10); c.lineTo(10, 3); c.lineTo(2, -14); c.closePath(); }, '#2a5a6a', 0.22);
    wash(ctx, (c) => polyPath(c, [[-11, 4], [-3.2, -12], [-1.8, -12], [-9.4, 4]]), '#ffffff', 0.55);
    // graduation marks
    for (const y of [-2, 1.5, 5]) line(ctx, [[5.4 - (y + 6) * -0.2, y], [8 - (y + 6) * -0.25, y]], 0.5, '#2a6a3a', false, 0.7);
  });
  // re-ink the glass silhouette
  ctx.save();
  ctx.beginPath();
  flaskPath(ctx);
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  // the lab label: a hazard diamond (no text)
  shape(ctx, (c) => roundRectPath(c, -6, 0, 9.4, 6.6, 1), { fill: '#fbfbf2', ink: 1, shadow: 'none' });
  rot(ctx, -1.3, 3.3, Math.PI / 4, () => shape(ctx, (c) => roundRectPath(c, -2, -2, 4, 4, 0.4), { fill: '#ff9a1a', ink: 0.7, shadow: 'none' }));
  line(ctx, [[-1.3, 1.9], [-1.3, 3.6]], 0.7, INK);
  shape(ctx, (c) => circlePath(c, -1.3, 4.6, 0.35), { fill: INK, ink: 0, shadow: 'none' });
  // the cork
  shape(ctx, (c) => { c.moveTo(-4.8, -24); c.lineTo(-4.2, -29.6); c.lineTo(4.2, -29.6); c.lineTo(4.8, -24); c.closePath(); }, { fill: '#c69a62', ink: 1.6, shadow: '#946a3a', shadowOffset: [-0.8, -0.6] });
  speckle(ctx, 0, -27, 3.4, 2, 6, '#8a5a2a', 0.4, 3, 0.8);
  // green fumes curling out round the cork
  for (const [x, ph] of [[-4, 0], [4, 2]] as [number, number][]) {
    const k = (f + ph) % 4;
    ctx.save();
    ctx.globalAlpha = 0.85 - k * 0.15;
    shape(ctx, (c) => { circlePath(c, x + Math.sin(k) * 1.4, -31 - k * 2, 1.6 + k * 0.5); }, { fill: '#c8ff8a', ink: 0.7, inkColor: '#4aa81a', shadow: 'none' });
    ctx.restore();
  }
  // face in the green: mad scientist grin
  eye(ctx, -4.4, -11, 2.3, { look: [0.4, 0.2], lid: 'none', pupil: 0.36, iris: '#ff3a3a' });
  eye(ctx, 2.6, -11.4, 2.5, { look: [0.4, 0.2], lid: 'none', pupil: 0.36, iris: '#ff3a3a' });
  brow(ctx, -4.6, -14.8, 4.4, 0.5, 1.4);
  brow(ctx, 3, -15.2, 4.6, -0.5, 1.4);
  mouth(ctx, -0.8, -5.6, 6, 'grin', { teeth: true, open: 0.9 });
  ctx.restore();
  // near arm: a little test tube held up
  const hx = 15 + s * 0.4, hy = -8 - Math.abs(s) * 0.6;
  rot(ctx, hx + 1, hy - 4, 0.25, () => {
    shape(ctx, (c) => roundRectPath(c, -1.6, -5, 3.2, 9, [0.4, 0.4, 1.6, 1.6]), { fill: GLASS, ink: 1, shadow: 'none' });
    shape(ctx, (c) => roundRectPath(c, -1.6, -0.5, 3.2, 4.5, [0, 0, 1.6, 1.6]), { fill: ACID, ink: 0, shadow: 'none' });
  });
  hoseArm(ctx, 11, -3, hx, hy, { bend: 0.35, thick: 1.9, handR: 2.3 });
}

enemy('conservante', 46, 60, 42, drawConservante);

// ===========================================================================
// projectiles (DANGER style: hot rim + red glow, pointing right)
// ===========================================================================

danger('proj.e_neon', 12, (ctx) => {
  const b = (c: Ctx) => blobPath(c, 0, 0, 6.2, 5.6, 0.18, 9, 4);
  shape(ctx, b, { fill: NEON_PINK, ink: 1.2, shadow: 'none' });
  clipTo(ctx, b, () => {
    ctx.fillStyle = NEON_CYAN;
    ctx.beginPath();
    ctx.moveTo(-1, -8);
    ctx.quadraticCurveTo(3, 0, 1, 8);
    ctx.lineTo(9, 8);
    ctx.lineTo(9, -8);
    ctx.closePath();
    ctx.fill();
    const R = rng(5);
    for (let i = 0; i < 7; i++) {
      rot(ctx, (R() - 0.5) * 8, (R() - 0.5) * 7, R() * 3, () => {
        ctx.fillStyle = SPRINKLES[i % SPRINKLES.length];
        ctx.fillRect(-1.1, -0.35, 2.2, 0.7);
      });
    }
  });
  glint(ctx, -2.4, -2.6, 1.6, 0.8, -0.7, 0.95);
});

danger('proj.e_palm', 12, (ctx) => {
  shape(ctx, (c) => { circlePath(c, -6.6, 2.2, 1.4); circlePath(c, -7.8, -1.6, 0.9); }, { fill: PALM, ink: 0.8, shadow: 'none' });
  sauceBlob(ctx, 6, PALM, PALM_SH, 23, 1.15);
  speckle(ctx, 0.4, 0.6, 4, 4, 6, '#ffd29a', 0.5, 6, 0.8);
  glint(ctx, -2.2, -2.6, 1.7, 0.8, -0.7, 0.95);
});

danger('proj.e_flake', 12, (ctx) => {
  // a curl of puff pastry: three toasted layers
  for (let k = 0; k < 3; k++) {
    const b = (c: Ctx) => {
      c.moveTo(-6.4 + k, 2.4 - k * 2.2);
      c.quadraticCurveTo(-2, -2.6 - k * 2.2, 6.4 - k, 0.6 - k * 2);
      c.quadraticCurveTo(7.2 - k, 2.6 - k * 2, 5 - k, 3 - k * 1.8);
      c.quadraticCurveTo(-1, -0.2 - k * 2.2, -5.4 + k, 4.2 - k * 2.2);
      c.closePath();
    };
    shape(ctx, b, { fill: k === 1 ? PUFF_HI : PUFF, ink: 1, shadow: PUFF_SH, shadowOffset: [-0.5, -0.8] });
  }
  speckle(ctx, 0, -2, 4, 2, 5, '#ffffff', 0.4, 3, 0.9);
});

danger('proj.e_raisin', 12, (ctx) => {
  const b = (c: Ctx) => blobPath(c, -0.6, 0.4, 5.6, 4.6, 0.2, 10, 8);
  shape(ctx, b, { fill: '#5a2a3a', ink: 1.2, shadow: '#36141e', shadowOffset: [-1, -1.2] });
  clipTo(ctx, b, () => {
    for (const pts of [[[-4, -1], [-1, -2.6], [2, -1.4]], [[-3, 2], [0, 0.4], [3.6, 1.6]], [[-1.4, 3.6], [1.6, 2.8]]] as Pt[][]) {
      line(ctx, pts, 0.7, '#2a0c14', true, 0.9);
      line(ctx, pts.map(([x, y]) => [x - 0.4, y - 0.5] as Pt), 0.5, '#9a5a6a', true, 0.8);
    }
  });
  // a cube of candied peel riding with it
  rot(ctx, 4.4, -3.2, 0.4, () => shape(ctx, (c) => roundRectPath(c, -1.8, -1.8, 3.6, 3.6, 0.6), { fill: '#ffa21e', ink: 0.8, shadow: '#d8701a', shadowOffset: [-0.5, -0.5], gloss: [{ x: -0.6, y: -0.8, rx: 0.8, ry: 0.4, alpha: 0.9 }] }));
  glint(ctx, -2.6, -2, 1.2, 0.6, -0.7, 0.8);
});

// re-export the shell painter for the dish and boss art
export { shell as cannoloShell, fillingEnd as cannoloEnd, sliceFace as pepperoniFace, frond as palmFrond };
