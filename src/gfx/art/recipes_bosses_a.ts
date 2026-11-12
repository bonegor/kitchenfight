/**
 * IL MENÙ — BOSSES A: the two Roman-pasta final bosses and their shots.
 *
 * Follows docs/ART_GUIDE.md (quality bar: bosses_b_ananas.ts / bosses_b_microonde.ts):
 *   boss.<id>          frames: 4, flash: true — idle/walk loop with secondary motion
 *   boss.<id>.attack   frames: 2, flash: true — 0 = wind-up/telegraph, 1 = attack. SAME box/anchor.
 * Anchor = centre of the collision circle; feet at y ≈ +radius; face front-right; outline 3–4.
 *
 *   id            box w×h   anchor (ax,ay)  radius  look
 *   boss.aglio    246×234   (104,170)       56      Il Re dell'Aglio: a huge garlic bulb king. Mauve cape and high
 *                                                   collar of papery garlic skin, gold crown with clove finials, a
 *                                                   curled root moustache and root beard, purple tights. One gloved
 *                                                   finger up ("solo uno spicchio!"), the sceptre is a single clove
 *                                                   "in camicia" in a gold claw. Wind-up: sceptre raised, cheeks
 *                                                   puffed with stink, the clove glows. Attack: ROAR, a green stink
 *                                                   breath and a fan of cloves. (Enraged he sheds his skin: the code
 *                                                   shows a burst; the sprite stays the same.)
 *   boss.burro    262×196   (106,134)       54      Il Panetto Supremo: a soft butter block melting over its front
 *                                                   edge, on a blue-and-white ceramic butter dish that trots on four
 *                                                   little feet; a silver foil wrapper peeled down like a skirt, a
 *                                                   butter-curl quiff, the dish lid as a shield and a butter knife as a
 *                                                   sword. Wind-up: knife raised high, shield up, glare, gritted teeth,
 *                                                   sweating butter. Attack: the knife slashes forward, butter pats fly.
 *                                                   (Enraged it melts: the code draws it at 0.9 scale.)
 *   The boxes are wider than the placeholders' on the right: the attack poses swing the sceptre / knife there.
 *
 *   proj.e_clove      24×24  (12,12)  1 frame: a garlic clove in its papery shirt, tip forward, a stink trail. DANGER style.
 *   proj.e_butterpat  24×24  (12,12)  1 frame: a stamped butter pat. DANGER style.
 *
 *   Extra fx for the b_aglio pattern (not placeholders):
 *   fx.aglio_stink    34×30  (17,15)  3 frames: a green stink puff rising from the stink clouds.
 *   fx.aglio_skin     16×16  (8,8)    4 frames: papery skin flakes he sheds when enraged.
 */
import { defineSprite } from '../sprites';
import { registerBoss, type Pose as BossPose } from './bosses_a';
import { danger } from './projectiles';
import {
  Ctx, Pt, INK, shape, line, ellipsePath, circlePath, roundRectPath, smoothPath, polyPath, brow, rgba, rng,
} from '../painter';
import {
  OUT, OUT_IN, OUT_S, TAU, phase, S, G, clipTo, fillPath, strokePath, sparkle, fist, limb, swoosh, burstLines, softGlow,
  pivot, stompLegs, ball, gem, lidEye, bladePath,
} from './bosses_b_kit';

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

/** Closed outline around a centre line with per-point widths (tapered strokes: moustaches, roots, curls). */
function ribbon(pts: Pt[], widths: number[]): Pt[] {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const w = widths[i] / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return [...L, ...R.reverse()];
}

/** Garlic clove (teardrop, point up): tip at (tx,ty), belly centred on bx, round bottom at by, half width hw. */
function clovePath(c: Ctx, tx: number, ty: number, bx: number, by: number, hw: number) {
  const cy = by - hw * 0.92;
  c.moveTo(tx, ty);
  c.bezierCurveTo(tx + hw * 0.32 + (bx - tx) * 0.2, ty + (cy - ty) * 0.3, bx + hw * 1.04, cy - hw * 1.25, bx + hw, cy);
  c.bezierCurveTo(bx + hw * 0.97, by - hw * 0.3, bx + hw * 0.52, by, bx, by);
  c.bezierCurveTo(bx - hw * 0.52, by, bx - hw * 0.97, by - hw * 0.3, bx - hw, cy);
  c.bezierCurveTo(bx - hw * 1.04, cy - hw * 1.25, tx - hw * 0.32 + (bx - tx) * 0.2, ty + (cy - ty) * 0.3, tx, ty);
  c.closePath();
}

/** Points along a clove from just under the tip to just above the bottom, offset sideways by `off` (−1..1 of hw). */
function cloveLine(tx: number, ty: number, bx: number, by: number, hw: number, off: number, u0 = 0.12, u1 = 0.9): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const u = u0 + ((u1 - u0) * i) / 6;
    const y = ty + (by - ty) * u;
    const bulge = Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.62) * (u > 0.85 ? 1 - (u - 0.85) * 2.2 : 1);
    const x = tx + (bx - tx) * Math.min(1, u * 1.3) + off * hw * bulge;
    pts.push([x, y]);
  }
  return pts;
}

/** White cartoon glove: palm centred at (x,y), `rot` = direction the fingers point. finger=true raises the index. */
function glove(ctx: Ctx, x: number, y: number, r: number, rot: number, o: { finger?: boolean; cuff?: string; wag?: number } = {}) {
  if (!o.finger) {
    fist(ctx, x, y, r, rot, { cuff: o.cuff, ink: OUT_IN });
    return;
  }
  const GL = '#fbf6ea', GL_SH = '#c9cbdb';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (o.cuff) {
    S(ctx, (c) => roundRectPath(c, -r * 1.62, -r * 0.86, r * 0.8, r * 1.72, r * 0.32), { fill: o.cuff!, ink: OUT_IN, shadowOffset: [-1.4, -1.6], gloss: [{ x: -r * 1.35, y: -r * 0.45, rx: r * 0.16, ry: r * 0.42, alpha: 0.5 }] });
  }
  // the raised index finger (points along +x after rotation), wagging
  ctx.save();
  ctx.translate(r * 0.5, -r * 0.35);
  ctx.rotate(o.wag ?? 0);
  S(ctx, (c) => roundRectPath(c, -r * 0.2, -r * 0.29, r * 2.15, r * 0.58, r * 0.29), { fill: GL, ink: OUT_IN, shadow: GL_SH, shadowOffset: [-0.9, -1.1], gloss: [{ x: r * 0.9, y: -r * 0.1, rx: r * 0.55, ry: r * 0.09, alpha: 0.6 }] });
  ctx.restore();
  // curled fist
  S(ctx, (c) => {
    c.moveTo(-r * 0.95, -r * 0.8);
    c.quadraticCurveTo(r * 0.15, -r * 1.0, r * 0.82, -r * 0.4);
    c.quadraticCurveTo(r * 1.15, r * 0.1, r * 0.85, r * 0.7);
    c.quadraticCurveTo(r * 0.1, r * 1.12, -r * 0.95, r * 0.8);
    c.quadraticCurveTo(-r * 1.15, 0, -r * 0.95, -r * 0.8);
    c.closePath();
  }, { fill: GL, ink: OUT_IN, shadow: GL_SH, shadowOffset: [-r * 0.24, -r * 0.26], gloss: [{ x: -r * 0.3, y: -r * 0.45, rx: r * 0.35, ry: r * 0.2, rot: -0.3, alpha: 0.6 }] });
  for (const k of [0.18, 0.52]) line(ctx, [[r * 0.4, k * r - r * 0.06], [r * 0.92, k * r + r * 0.02]], 1.2, '#aeb3c6');
  S(ctx, (c) => ellipsePath(c, -r * 0.05, -r * 0.62, r * 0.55, r * 0.28, -0.12), { fill: GL, ink: OUT_IN * 0.8, shadow: GL_SH, shadowOffset: [-0.7, -0.9] });
  ctx.restore();
}

// ===========================================================================
// IL RE DELL'AGLIO — The Garlic King (r 56)
// ===========================================================================

export const AGLIO_R = 56;
const AG_W = 246, AG_H = 234, AG_AX = 104, AG_AY = 170;

const GAR = '#f8f0dd';
const GAR_SH = '#dcc6a0';
const GAR_SEAM = '#9c7c56';
const VIO = '#b464a8';
const PAPER = '#efe2c6';
const PAPER_SH = '#cdb58c';
const CAPE = '#9a4f94';
const CAPE_SH = '#64285f';
const CAPE_HI = '#d39ccb';
const VELVET = '#6e2a7c';
const VELVET_SH = '#45164f';
const GOLD = '#ffc93a';
const GOLD_SH = '#d58a12';
const GOLD_HI = '#fff1a6';
const ROOT = '#d2b07e';
const ROOT_SH = '#a07b4e';
const STINK = '#a8d84a';
const STINK_DK = '#4f8a24';
const BROWC = '#4a2440';

/** The five cloves of the bulb, back to front: [tipX, tipY, bellyX, bottomY, halfWidth]. */
const CLOVES: [number, number, number, number, number][] = [
  [-2, -86, -48, 14, 21], // far left
  [10, -86, 54, 10, 17], // far right
  [0, -92, -28, 34, 30], // left
  [10, -92, 36, 30, 27], // right
  [6, -100, 8, 42, 36], // front (the face)
];
const cloveB = (i: number) => (c: Ctx) => {
  const [tx, ty, bx, by, hw] = CLOVES[i];
  clovePath(c, tx, ty, bx, by, hw);
};

interface AgPose {
  f: number;
  lean: number;
  crouch: number;
  eyes: 'haughty' | 'narrow' | 'furious';
  mouth: 'smug' | 'puff' | 'roar';
  arm: 'finger' | 'fist';
  grip: Pt;
  rod: number; // sceptre rotation (0 = straight up)
  glow: number; // sceptre clove glow 0..1
  flare: number; // cape flare 0..1
  crownLift: number;
  crownTilt: number;
  stink: number; // stink aura 0..1
}

/** Wispy green stink curl rising from (x,y). */
function stinkWisp(ctx: Ctx, x: number, y: number, len: number, ph: number, dir: number, w = 4, alpha = 0.9) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([x + Math.sin(ph + t * 5.2) * w * 0.9 * (0.4 + t) + dir * t * w * 1.6, y - t * len]);
  }
  line(ctx, pts, w + 2.4, STINK_DK, true, 0.35 * alpha);
  line(ctx, pts, w, STINK, true, 0.85 * alpha);
  line(ctx, pts.slice(0, 4).map(([px, py]) => [px - w * 0.2, py] as Pt), w * 0.35, '#eaffc0', true, 0.6 * alpha);
}

/** Puffy stink cloud (soft green puffs with an ink-free rim). */
function stinkPuff(ctx: Ctx, x: number, y: number, r: number, seed: number, alpha = 1) {
  const R = rng(seed);
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + R() * 0.6;
    pts.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.42, r * (0.42 + R() * 0.2)]);
  }
  pts.push([x, y, r * 0.6]);
  fillPath(ctx, (c) => { for (const [px, py, pr] of pts) circlePath(c, px + 1.2, py + 1.4, pr); }, STINK_DK, 0.55 * alpha);
  fillPath(ctx, (c) => { for (const [px, py, pr] of pts) circlePath(c, px, py, pr); }, STINK, 0.85 * alpha);
  fillPath(ctx, (c) => { for (const [px, py, pr] of pts.slice(0, 3)) circlePath(c, px - pr * 0.25, py - pr * 0.3, pr * 0.45); }, '#e6ffb0', 0.55 * alpha);
}

/** Pointy royal shoe (purple velvet, gold buckle), toe pointing right. */
function agShoe(ctx: Ctx, x: number, y: number) {
  shape(ctx, (c) => {
    c.moveTo(x - 9, y + 1);
    c.quadraticCurveTo(x - 11, y - 9, x - 2, y - 9);
    c.quadraticCurveTo(x + 7, y - 9, x + 12, y - 4);
    c.quadraticCurveTo(x + 18, y - 3, x + 19, y - 10);
    c.quadraticCurveTo(x + 23, y - 1, x + 13, y + 1.5);
    c.quadraticCurveTo(x + 2, y + 3, x - 9, y + 1);
    c.closePath();
  }, { fill: VELVET, ink: OUT_IN, shadow: VELVET_SH, shadowOffset: [-2, -1.8], gloss: [{ x: x - 2, y: y - 6, rx: 3, ry: 1.4, rot: -0.2, alpha: 0.45 }] });
  ball(ctx, x + 19.5, y - 10.5, 2.2, GOLD, 1.2);
  shape(ctx, (c) => roundRectPath(c, x - 2.5, y - 7.4, 7, 5, 1.4), { fill: GOLD, ink: 1.2, shadow: GOLD_SH, shadowOffset: [-0.8, -0.8] });
}

/** The papery cape (mauve garlic skin) behind everything. */
function agCape(ctx: Ctx, f: number, flare: number) {
  const ph = phase(f);
  const n = 10;
  const hem: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = -86 - flare * 9 + t * (166 + flare * 20);
    const y = 54 + Math.sin(ph + t * 7) * 2.4 - Math.sin(t * Math.PI) * 3 + (i % 2 ? 4 : 0);
    hem.push([x, y]);
  }
  const cape = (c: Ctx) => {
    c.moveTo(-22, -70);
    c.bezierCurveTo(-56, -62, -74 - flare * 6, -26, -80 - flare * 8, 10);
    c.quadraticCurveTo(-88 - flare * 10, 36, hem[0][0], hem[0][1]);
    for (let i = 1; i <= n; i++) c.lineTo(hem[i][0], hem[i][1]);
    c.quadraticCurveTo(84 + flare * 10, 34, 76 + flare * 8, 8);
    c.bezierCurveTo(70, -26, 58, -60, 30, -70);
    c.closePath();
  };
  S(ctx, cape, { fill: CAPE, ink: OUT, shadow: CAPE_SH, shadowOffset: [-10, -3], gloss: [{ x: -70, y: 8, rx: 3, ry: 20, rot: 0.15, alpha: 0.18 }] });
  // papery veins and folds
  clipTo(ctx, cape, () => {
    const R = rng(41);
    for (let i = 0; i < 16; i++) {
      const x0 = -80 + i * 10.5 + (R() - 0.5) * 4;
      const side = x0 < 0 ? -1 : 1;
      line(ctx, [[x0 * 0.4, -60], [x0 * 0.8 + side * 4, 0], [x0 + side * (6 + flare * 6), 56]], 1.1 + R() * 0.8, i % 3 ? CAPE_HI : CAPE_SH, true, i % 3 ? 0.35 : 0.5);
    }
    // translucent papery hem
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hem[0][0], hem[0][1]);
    for (let i = 1; i <= n; i++) ctx.lineTo(hem[i][0], hem[i][1]);
    ctx.lineWidth = 9;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = rgba('#f2d2ea', 0.45);
    ctx.stroke();
    ctx.restore();
  });
}

/** High stand-up collar of papery skin petals behind the head. */
function agCollar(ctx: Ctx, f: number, flare: number) {
  const ph = phase(f);
  // a stand-up ruff of papery skin fanned out behind the head (mauve back row, ivory front row)
  const rows: [number[], number[], number, string, string, number][] = [
    [[0.74, 1.08, 1.42], [60, 58, 50], 26, CAPE, CAPE_SH, OUT],
    [[0.9, 1.26], [48, 44], 22, PAPER, PAPER_SH, OUT_IN],
  ];
  for (const [angs, lens, w, fill, sh, ink] of rows) {
    for (const s of [-1, 1]) {
      angs.forEach((a0, i) => {
        const sway = Math.sin(ph + i * 1.3 + (s > 0 ? 1.2 : 0)) * 0.035;
        const a = -Math.PI / 2 + s * (a0 + flare * 0.12) + sway;
        const bx = 6 + s * 10, by = -50;
        const L = lens[i] + flare * 6;
        const pet = (c: Ctx) => bladePath(c, bx, by, a, L, w, -s * 0.08);
        S(ctx, pet, { fill, ink, shadow: sh, shadowOffset: [-3.4, -2.8] });
        clipTo(ctx, pet, () => {
          const vein = fill === PAPER ? VIO : CAPE_HI;
          for (const k of [-0.45, 0.1, 0.55]) {
            const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
            line(ctx, [[bx + nx * k * 6, by + ny * k * 6], [bx + dx * L * 0.55 + nx * k * w * 0.42, by + dy * L * 0.55 + ny * k * w * 0.42], [bx + dx * L * 0.95 + nx * k * 3, by + dy * L * 0.95 + ny * k * 3]], 1.1, vein, true, 0.5);
          }
        });
      });
    }
  }
}

/** The bulb itself: five cloves, seams, purple streaks, gloss, root plate. */
function agBulb(ctx: Ctx) {
  G(ctx, CLOVES.map((_, i) => ({ build: cloveB(i), style: { fill: GAR, shadow: GAR_SH, shadowOffset: [i === 4 ? -6 : -4.5, -3.5] as Pt } })), OUT);
  // seams: the front clove's edge where it overlaps the others (and the left over the far-left etc.)
  for (const [front, back] of [[2, [0]], [3, [1]], [4, [0, 1, 2, 3]]] as [number, number[]][]) {
    clipTo(ctx, (c) => { for (const b of back) cloveB(b)(c); }, () => {
      ctx.save();
      ctx.beginPath();
      cloveB(front)(ctx);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = GAR_SEAM;
      ctx.stroke();
      ctx.restore();
    });
  }
  // purple streaks inside each clove + a purple blush at the bottom
  for (let i = 0; i < CLOVES.length; i++) {
    const [tx, ty, bx, by, hw] = CLOVES[i];
    clipTo(ctx, cloveB(i), () => {
      const offs = i === 4 ? [-0.82, -0.6, 0.62, 0.84] : [-0.55, 0.15, 0.65];
      offs.forEach((o, k) => line(ctx, cloveLine(tx, ty, bx, by, hw, o, 0.2, 0.86 + (k % 2) * 0.06), k % 2 ? 1.3 : 2, VIO, true, 0.45 + (k % 2) * 0.15));
      fillPath(ctx, (c) => ellipsePath(c, bx, by + 4, hw * 1.1, hw * 0.55), VIO, 0.22);
    });
  }
  // gloss
  clipTo(ctx, cloveB(4), () => {
    fillPath(ctx, (c) => ellipsePath(c, -14, -52, 6.5, 17, 0.32), '#ffffff', 0.62);
    fillPath(ctx, (c) => ellipsePath(c, -18, -70, 2.6, 4.2, 0.4), '#ffffff', 0.85);
  });
  clipTo(ctx, cloveB(2), () => fillPath(ctx, (c) => ellipsePath(c, -42, -20, 4, 13, 0.4), '#ffffff', 0.5));
}

/** Root plate + wiry root beard under the bulb. */
function agBeard(ctx: Ctx, f: number, blow: number) {
  const ph = phase(f);
  const sway = Math.sin(ph) * 1.4 + blow * 4;
  const R = rng(17);
  const roots: Pt[][] = [];
  for (let i = 0; i < 9; i++) {
    const x0 = -14 + i * 3.8;
    const len = 12 + R() * 6 - Math.abs(i - 4) * 0.9;
    const pts: Pt[] = [];
    for (let k = 0; k <= 4; k++) {
      const t = k / 4;
      pts.push([x0 + (x0 - 2) * 0.12 * t + Math.sin(t * 5 + i) * 1.6 + sway * t, 40 + t * len]);
    }
    roots.push(pts);
  }
  for (const pts of roots) line(ctx, pts, 3.6 + OUT_S * 2, INK, true);
  roots.forEach((pts, i) => {
    line(ctx, pts, 3.6, i % 2 ? ROOT : '#e2c597', true);
    line(ctx, pts.slice(0, 3).map(([x, y]) => [x - 0.7, y] as Pt), 1, '#f6e7c4', true, 0.7);
  });
  S(ctx, (c) => ellipsePath(c, 2, 40, 17, 5.2), { fill: ROOT, ink: OUT_IN, shadow: ROOT_SH, shadowOffset: [-2, -2] });
}

/** Handlebar moustache of dried roots, centred at (x,y). lift raises the curls (roar). */
function agMoustache(ctx: Ctx, x: number, y: number, lift: number, f: number) {
  const tw = Math.sin(phase(f) * 2) * 0.8;
  for (const s of [-1, 1]) {
    const pts: Pt[] = [
      [x + s * 1, y],
      [x + s * 9, y + 1 - lift * 0.4],
      [x + s * 18, y - lift],
      [x + s * 26, y - 3 - lift * 1.4],
      [x + s * 30, y - 10 - lift * 1.6 + tw],
      [x + s * 27, y - 15 - lift * 1.6 + tw],
      [x + s * 23, y - 13 - lift * 1.5 + tw],
    ];
    const outl = ribbon(pts, [8, 9.5, 8, 6, 4.2, 2.6, 1.4]);
    S(ctx, (c) => smoothPath(c, outl, true, 0.4), { fill: ROOT, ink: OUT_S + 0.4, shadow: ROOT_SH, shadowOffset: [-1.6, -2.2] });
    line(ctx, pts.slice(0, 4).map(([px, py]) => [px - 0.5, py - 1.6] as Pt), 1.1, '#f4e2bc', true, 0.8);
    line(ctx, pts.slice(1, 5).map(([px, py]) => [px, py + 1.3] as Pt), 0.8, ROOT_SH, true, 0.7);
  }
}

function agFace(ctx: Ctx, p: AgPose) {
  const fx = 9, ey = -30;
  const ex0 = fx - 15, ex1 = fx + 18;
  if (p.eyes === 'haughty') {
    lidEye(ctx, ex0, ey, 10, { side: -1, lidOuter: 0.36, lidInner: 0.44, look: [0.42, 0.34], iris: '#6fae3a', pupil: 0.3, lidColor: GAR_SH, ink: 2.4, lash: true });
    lidEye(ctx, ex1, ey, 10.5, { side: 1, lidOuter: 0.3, lidInner: 0.42, look: [0.42, 0.34], iris: '#6fae3a', pupil: 0.3, lidColor: GAR_SH, ink: 2.4, lash: true });
    brow(ctx, ex0 - 1, ey - 18, 19, -0.28, 5, BROWC); // arched in disdain
    brow(ctx, ex1 + 1, ey - 15, 20, -0.12, 5, BROWC);
  } else if (p.eyes === 'narrow') {
    lidEye(ctx, ex0, ey + 1, 10, { side: -1, lidOuter: 0.18, lidInner: 0.62, look: [0.45, 0.2], iris: '#6fae3a', pupil: 0.34, lidColor: GAR_SH, ink: 2.4 });
    lidEye(ctx, ex1, ey + 1, 10.5, { side: 1, lidOuter: 0.18, lidInner: 0.62, look: [0.45, 0.2], iris: '#6fae3a', pupil: 0.34, lidColor: GAR_SH, ink: 2.4 });
    brow(ctx, ex0 + 1, ey - 12, 21, 0.42, 5.6, BROWC);
    brow(ctx, ex1 - 1, ey - 12, 22, -0.42, 5.6, BROWC);
  } else {
    lidEye(ctx, ex0, ey - 1, 11, { side: -1, lidOuter: 0.04, lidInner: 0.22, look: [0.35, 0.05], iris: '#8ccf3a', pupil: 0.22, lidColor: GAR_SH, ink: 2.5, squash: 1.15 });
    lidEye(ctx, ex1, ey - 1, 11.5, { side: 1, lidOuter: 0.04, lidInner: 0.22, look: [0.35, 0.05], iris: '#8ccf3a', pupil: 0.22, lidColor: GAR_SH, ink: 2.5, squash: 1.15 });
    brow(ctx, ex0, ey - 17, 22, 0.5, 6, BROWC);
    brow(ctx, ex1, ey - 17, 23, -0.5, 6, BROWC);
  }
  const mx = fx + 2, my = -4;
  if (p.mouth === 'smug') {
    // smirking grin under the moustache, raised on the right
    const m = (c: Ctx) => {
      c.moveTo(mx - 15, my + 7);
      c.quadraticCurveTo(mx, my + 11, mx + 18, my + 3);
      c.quadraticCurveTo(mx + 14, my + 21, mx + 1, my + 21);
      c.quadraticCurveTo(mx - 11, my + 19, mx - 15, my + 7);
      c.closePath();
    };
    shape(ctx, m, { fill: '#5b1320', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, m, () => {
      fillPath(ctx, (c) => {
        c.moveTo(mx - 18, my + 4);
        c.quadraticCurveTo(mx, my + 9, mx + 20, my);
        c.lineTo(mx + 20, my + 11);
        c.quadraticCurveTo(mx, my + 18, mx - 18, my + 13);
        c.closePath();
      }, '#fff8ea');
      for (let i = -2; i <= 3; i++) line(ctx, [[mx + i * 5.6, my + 2], [mx + i * 5.6 + 0.4, my + 15]], 0.9, 'rgba(80,40,30,0.4)');
      fillPath(ctx, (c) => ellipsePath(c, mx + 1, my + 21, 8, 3.4), '#e8616e');
    });
    line(ctx, [[mx + 18, my + 3], [mx + 22, my + 1]], 1.6, INK, true);
  } else if (p.mouth === 'puff') {
    // cheeks puffed full of stink, lips pressed, stink leaking at the corners
    for (const s of [-1, 1]) {
      const cx = mx + s * 22, cy = my + 11;
      S(ctx, (c) => circlePath(c, cx, cy, 11), { fill: '#e4f2b8', ink: OUT_IN, shadow: '#b6d276', shadowOffset: [-2.6, -2.8], gloss: [{ x: cx - 3.4, y: cy - 4.4, rx: 3.4, ry: 2.2, rot: -0.5, alpha: 0.8 }] });
    }
    S(ctx, (c) => ellipsePath(c, mx, my + 13, 12, 8), { fill: '#e4f2b8', ink: OUT_IN, shadow: '#b6d276', shadowOffset: [-1.6, -1.8] });
    line(ctx, [[mx - 7, my + 12], [mx - 2, my + 10.5], [mx + 2, my + 13], [mx + 7, my + 11.5]], 2.2, INK, true);
    stinkPuff(ctx, mx + 12, my + 18, 6, 3, 0.9);
    stinkPuff(ctx, mx - 13, my + 19, 5, 8, 0.8);
  } else {
    // ROAR: a huge open mouth, fangs, green breath glowing inside
    const m = (c: Ctx) => {
      c.moveTo(mx - 20, my + 4);
      c.quadraticCurveTo(mx, my - 2, mx + 22, my + 2);
      c.quadraticCurveTo(mx + 22, my + 30, mx + 1, my + 33);
      c.quadraticCurveTo(mx - 20, my + 30, mx - 20, my + 4);
      c.closePath();
    };
    shape(ctx, m, { fill: '#4a1020', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, m, () => {
      softGlow(ctx, mx + 2, my + 22, 18, STINK, 0.85);
      fillPath(ctx, (c) => ellipsePath(c, mx + 4, my + 32, 12, 7), '#e8616e');
      for (let i = 0; i < 5; i++) {
        const tx = mx - 17 + i * 9;
        fillPath(ctx, (c) => polyPath(c, [[tx - 4, my - 2], [tx + 5, my - 2], [tx + 0.6, my + 8 + (i % 2) * 2]]), '#fff8ea');
      }
      for (let i = 0; i < 3; i++) {
        const tx = mx - 10 + i * 11;
        fillPath(ctx, (c) => polyPath(c, [[tx - 3.6, my + 36], [tx + 3.6, my + 36], [tx, my + 27]]), '#fff8ea');
      }
    });
  }
  agMoustache(ctx, mx, my + (p.mouth === 'roar' ? -2 : 1), p.mouth === 'roar' ? 5 : p.mouth === 'puff' ? 2 : 0, p.f);
  // a blush of royal smugness
  if (p.mouth === 'smug') {
    fillPath(ctx, (c) => ellipsePath(c, ex0 - 6, -12, 6, 3.4), '#ef9aa0', 0.4);
    fillPath(ctx, (c) => ellipsePath(c, ex1 + 8, -12, 6, 3.4), '#ef9aa0', 0.4);
  }
}

/** Sceptre in local coords: grip at (0,0), rod along −y; a clove "in camicia" in a gold claw on top. */
function agSceptre(ctx: Ctx, f: number, glow: number) {
  const ph = phase(f);
  const top = 66, butt = 16;
  shape(ctx, (c) => roundRectPath(c, -3.4, -top, 6.8, top + butt, 3.4), { fill: GOLD, ink: OUT_IN, shadow: GOLD_SH, shadowOffset: [-2, 0] });
  line(ctx, [[-1.2, butt - 4], [-1.2, -top + 6]], 1.2, GOLD_HI, false, 0.85);
  for (const yy of [-top * 0.45, -top * 0.75]) shape(ctx, (c) => roundRectPath(c, -5, yy - 2.4, 10, 4.8, 2), { fill: VELVET, ink: OUT_S, shadow: VELVET_SH, shadowOffset: [-1, -1] });
  ball(ctx, 0, butt + 3.5, 4.6, GOLD, OUT_S);
  // claw cup
  const cy = -top - 4;
  if (glow > 0) {
    softGlow(ctx, 0, cy - 14, 36 + glow * 8, STINK, 0.55 + glow * 0.35);
    softGlow(ctx, 0, cy - 14, 18, '#efffc0', 0.5 * glow);
  }
  S(ctx, (c) => {
    c.moveTo(-14, cy - 4);
    c.quadraticCurveTo(-12, cy + 7, 0, cy + 8);
    c.quadraticCurveTo(12, cy + 7, 14, cy - 4);
    c.quadraticCurveTo(7, cy + 1, 0, cy + 1);
    c.quadraticCurveTo(-7, cy + 1, -14, cy - 4);
    c.closePath();
  }, { fill: GOLD, ink: OUT_S + 0.3, shadow: GOLD_SH, shadowOffset: [-1.6, -1.4], gloss: [{ x: -6, y: cy + 3, rx: 2.4, ry: 1.2, alpha: 0.8 }] });
  // the sacred clove, in its shirt
  const ct = cy - 36;
  const cl = (c: Ctx) => {
    c.moveTo(1, ct);
    c.bezierCurveTo(9, ct + 9, 14, ct + 22, 11, ct + 32);
    c.quadraticCurveTo(6, ct + 38, -1, ct + 37);
    c.quadraticCurveTo(-11, ct + 35, -12, ct + 26);
    c.bezierCurveTo(-12, ct + 15, -6, ct + 7, 1, ct);
    c.closePath();
  };
  S(ctx, cl, { fill: glow > 0.5 ? '#f4ffe0' : GAR, ink: OUT_IN, shadow: glow > 0.5 ? '#c8e690' : GAR_SH, shadowOffset: [-3, -2], gloss: [{ x: -5, y: ct + 16, rx: 2.4, ry: 6, rot: 0.25, alpha: 0.8 }] });
  clipTo(ctx, cl, () => {
    line(ctx, [[2, ct + 4], [7, ct + 18], [6, ct + 34]], 1.4, VIO, true, 0.6);
    line(ctx, [[-3, ct + 6], [-7, ct + 20], [-5, ct + 34]], 1, VIO, true, 0.45);
  });
  // papery tip twist
  S(ctx, (c) => polyPath(c, [[-1, ct + 2], [0, ct - 7], [2.5, ct - 4], [4, ct - 9], [4, ct + 2]]), { fill: PAPER, ink: OUT_S, shadow: PAPER_SH, shadowOffset: [-0.8, -0.6] });
  // claw prongs over the clove
  for (const s of [-1, 1]) {
    inkLine2(ctx, [[s * 13, cy - 4], [s * 14.5, cy - 13], [s * 9, cy - 21]], 3.4, GOLD);
    ball(ctx, s * 9, cy - 21, 2.4, GOLD_HI, 1.2);
  }
  gem(ctx, 0, cy + 3, 3.2, '#3fbf5a', 1.2);
  if (glow > 0) {
    sparkle(ctx, 12, ct + 2, 6 + glow * 2, '#ffffff', 0.95);
    sparkle(ctx, -14, ct + 22, 4, '#eaffc0', 0.9);
  } else {
    const tw = [[10, ct + 4], [-12, ct + 18], [9, ct + 26], [-6, ct - 2]][((f % 4) + 4) % 4];
    sparkle(ctx, tw[0], tw[1], 4, '#ffffff', 0.85);
  }
  void ph;
}

function inkLine2(ctx: Ctx, pts: Pt[], w: number, col: string) {
  line(ctx, pts, w + OUT_S * 2, INK, true);
  line(ctx, pts, w, col, true);
}

/** Gold crown with a velvet cap and clove finials. (x,y) = bottom centre of the band. */
function agCrown(ctx: Ctx, x: number, y: number, tilt: number, f: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  // velvet cap
  S(ctx, (c) => {
    c.moveTo(-22, -8);
    c.bezierCurveTo(-24, -30, -10, -38, 0, -38);
    c.bezierCurveTo(10, -38, 24, -30, 22, -8);
    c.closePath();
  }, { fill: VELVET, ink: OUT_IN, shadow: VELVET_SH, shadowOffset: [-4, -2], gloss: [{ x: -10, y: -28, rx: 3, ry: 6, rot: 0.4, alpha: 0.3 }] });
  // gold body with five points
  const pts: Pt[] = [[-27, 0], [-29, -24], [-18, -12], [-10, -30], [0, -14], [10, -30], [18, -12], [29, -24], [27, 0]];
  S(ctx, (c) => {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.quadraticCurveTo(0, 4, -27, 0);
    c.closePath();
  }, { fill: GOLD, ink: OUT_IN, shadow: GOLD_SH, shadowOffset: [-4, -2.4], gloss: [{ x: -16, y: -10, rx: 3, ry: 6, rot: 0.2, alpha: 0.7 }] });
  // band with gems
  S(ctx, (c) => {
    c.moveTo(-28.4, -9);
    c.quadraticCurveTo(0, -5, 28.4, -9);
    c.lineTo(27, 0);
    c.quadraticCurveTo(0, 4, -27, 0);
    c.closePath();
  }, { fill: '#ffb320', ink: OUT_S, shadow: '#c87a10', shadowOffset: [-2, -1.2] });
  gem(ctx, 0, -4.6, 4.2, '#9b3fd0', 1.4);
  gem(ctx, -15, -4.4, 3, '#3fbf5a', 1.2);
  gem(ctx, 15, -4.4, 3, '#3fbf5a', 1.2);
  // clove finials on the tips
  for (const [bx, by] of [[-29, -24], [-10, -30], [10, -30], [29, -24]] as Pt[]) {
    S(ctx, (c) => clovePath(c, bx, by - 9, bx, by + 1.5, 4), { fill: GOLD_HI, ink: OUT_S, shadow: GOLD, shadowOffset: [-1, -0.8] });
  }
  // orb on top of the cap
  ball(ctx, 0, -41, 4.6, GOLD, OUT_S);
  const tw = [[-20, -18], [20, -20], [0, -46], [-6, -6]][((f % 4) + 4) % 4];
  sparkle(ctx, tw[0], tw[1], 5, '#ffffff', 0.95);
  ctx.restore();
}

function drawAglioKing(ctx: Ctx, p: AgPose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = AGLIO_R;
  if (p.stink > 0) softGlow(ctx, 4, -20, 104, STINK, 0.32 * p.stink, 92);

  // back stink wisps
  stinkWisp(ctx, -60, -64, 26 + p.stink * 10, ph, -1, 4.4);
  stinkWisp(ctx, 66, -58, 24 + p.stink * 10, ph + 2.1, 1, 4);

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean * 0.5);
  agCape(ctx, f, p.flare);
  ctx.restore();

  stompLegs(ctx, 4, 24, FOOT, f, {
    spread: 22, thick: 14, color: VELVET, shade: VELVET_SH, stride: 6, lift: 6,
    shoe: (x, y) => agShoe(ctx, x - 2, y),
  });

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean);
  ctx.translate(0, p.crouch - 5);
  agCollar(ctx, f, p.flare);

  // far arm (behind the bulb): "just ONE clove" finger, or a clenched fist
  if (p.arm === 'finger') {
    const wag = [0, 0.16, 0, -0.16][((f % 4) + 4) % 4];
    limb(ctx, [[-44, -8], [-70, -12], [-76, -34]], 15, VELVET, OUT_IN, VELVET_SH);
    glove(ctx, -76, -42, 9.5, -Math.PI / 2, { finger: true, cuff: GOLD, wag });
  } else {
    limb(ctx, [[-44, -6], [-74, -2], [-80, -24]], 15, VELVET, OUT_IN, VELVET_SH);
    glove(ctx, -80, -31, 10, -Math.PI / 2 - 0.1, { cuff: GOLD });
    burstLines(ctx, -80, -36, 15, 23, 5, '#ffffff', 2.2, 3, -2.7, -0.5, 0.85);
  }

  agBulb(ctx);
  agBeard(ctx, f, p.mouth === 'roar' ? 1 : 0);
  agFace(ctx, p);

  // near arm + sceptre
  const [gx, gy] = p.grip;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(p.rod);
  agSceptre(ctx, f, p.glow);
  ctx.restore();
  const ex = gy > -20 ? gx - 6 : gx + 10, ey = gy > -20 ? gy + 16 : (gy + 6) / 2 + 8;
  limb(ctx, [[42, -2], [ex, ey], [gx - 1, gy + 3]], 15, VELVET, OUT_IN, VELVET_SH);
  glove(ctx, gx, gy, 10, p.rod + Math.PI / 2, { cuff: GOLD });

  // crown
  agCrown(ctx, 6 + Math.sin(ph) * 1, -80 - p.crownLift + Math.cos(ph * 2) * 1.2, p.crownTilt + Math.sin(ph) * 0.04, f);

  ctx.restore();
  // front wisp
  stinkWisp(ctx, 46, -92, 18 + p.stink * 8, ph + 4, 1, 3.4, 0.8);
}

const AG_WALK = (f: number): AgPose => ({
  f, lean: 0, crouch: 0, eyes: 'haughty', mouth: 'smug', arm: 'finger',
  grip: [64, 10 + Math.sin(phase(f)) * 1.5], rod: 0.12 + Math.sin(phase(f)) * 0.03, glow: 0,
  flare: 0, crownLift: 0, crownTilt: -0.12, stink: 0,
});

function drawAglioPose(ctx: Ctx, f: number, pose: BossPose) {
  if (pose === 'idle') return drawAglioKing(ctx, AG_WALK(f));
  if (pose === 'windup') {
    // inhale: sceptre raised, the clove charges with stink, cheeks puffed, cape flares
    drawAglioKing(ctx, {
      f: 1, lean: -0.06, crouch: 3, eyes: 'narrow', mouth: 'puff', arm: 'fist',
      grip: [70, -40], rod: 0.04, glow: 1, flare: 0.5, crownLift: 4, crownTilt: -0.2, stink: 0.8,
    });
    return;
  }
  // ROAR: sceptre swung forward, stink breath and a fan of cloves
  drawAglioKing(ctx, {
    f: 2, lean: 0.07, crouch: -2, eyes: 'furious', mouth: 'roar', arm: 'fist',
    grip: [58, -22], rod: 0.4, glow: 1, flare: 1, crownLift: 8, crownTilt: 0.1, stink: 1,
  });
  // breath blast toward the chef
  ctx.save();
  stinkPuff(ctx, 36, 14, 9, 21, 0.9);
  stinkPuff(ctx, 58, 18, 12, 22, 0.8);
  stinkPuff(ctx, 86, 14, 14, 23, 0.65);
  stinkPuff(ctx, 114, 6, 12, 24, 0.45);
  burstLines(ctx, 96, -118, 22, 32, 8, '#f2ffd0', 2.6, 13, -2.2, 0.9, 0.95);
  ctx.restore();
  for (const [cx, cy, rot, s] of [[126, -122, -0.5, 1], [128, -90, 0.25, 0.95], [100, -150, -1.2, 0.85]] as [number, number, number, number][]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(s * 1.3, s * 1.3);
    cloveShot(ctx);
    ctx.restore();
  }
}

registerBoss('aglio', AG_W, AG_H, AG_AX, AG_AY, drawAglioPose);

// ---------------------------------------------------------------------------
// proj.e_clove — a garlic clove in its papery shirt, tip pointing right (travel direction)
// ---------------------------------------------------------------------------
function cloveShot(ctx: Ctx) {
  // a little green stink trail behind it
  line(ctx, [[-6, 0.6], [-8.4, -1.4], [-10.6, 0.4]], 3, STINK, true, 0.55);
  line(ctx, [[-6, 0.6], [-8.4, -1.4], [-10.6, 0.4]], 1.2, '#eaffc0', true, 0.7);
  const cl = (c: Ctx) => {
    c.moveTo(8.8, -0.8);
    c.bezierCurveTo(4.4, -6.4, -2.2, -7, -6.8, -4.6);
    c.quadraticCurveTo(-9, -1.6, -8, 2);
    c.quadraticCurveTo(-4.8, 5.2, 0.6, 4.8);
    c.bezierCurveTo(5, 4.4, 7.6, 2, 8.8, -0.8);
    c.closePath();
  };
  S(ctx, cl, { fill: GAR, ink: 1.3, shadow: '#d2b788', shadowOffset: [-1.4, -1.8], gloss: [{ x: -1.5, y: -3.4, rx: 3.4, ry: 1.1, rot: -0.12, alpha: 0.95 }] });
  clipTo(ctx, cl, () => {
    fillPath(ctx, (c) => ellipsePath(c, -7, 1, 4.4, 6), VIO, 0.45);
    line(ctx, [[-6.4, -2.8], [0, -4], [6.6, -1.8]], 1.1, VIO, true, 0.85);
    line(ctx, [[-7, 1.4], [0, 2.8], [6.6, 0.8]], 0.9, VIO, true, 0.65);
  });
  // flat root end
  line(ctx, [[-7.8, -2.6], [-8.6, 0], [-7.6, 2.4]], 1.5, ROOT_SH, true, 0.95);
  // papery tip wisp
  line(ctx, [[8.2, -0.8], [10.6, -1.8], [11.2, -0.2]], 1.2, PAPER_SH, true, 0.95);
}
danger('proj.e_clove', 12, cloveShot);

// ---------------------------------------------------------------------------
// fx used by the Garlic King's pattern (b_aglio.ts): rising stink puffs and papery skin flakes
// ---------------------------------------------------------------------------
defineSprite({
  id: 'fx.aglio_stink', w: 34, h: 30, ax: 17, ay: 15, frames: 3,
  draw: (ctx, f) => {
    const R = rng(71 + f * 13);
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + R() * 0.7;
      pts.push([Math.cos(a) * 7.5, Math.sin(a) * 5.5, 6 + R() * 2.6]);
    }
    pts.push([0, 0, 8.5]);
    const cloud = (c: Ctx) => { for (const [x, y, r] of pts) circlePath(c, x, y, r); };
    G(ctx, [{ build: cloud, style: { fill: STINK, shadow: '#79b02e', shadowOffset: [-2.6, -2.6] } }], 1.3, STINK_DK);
    fillPath(ctx, (c) => { for (const [x, y, r] of pts.slice(0, 3)) circlePath(c, x - r * 0.3, y - r * 0.35, r * 0.4); }, '#eaffc0', 0.75);
    // tiny swirly stink marks
    line(ctx, [[-3, 1], [-1, -1.6], [1.4, 0.4], [3.6, -1.6]], 1, STINK_DK, true, 0.7);
  },
});
defineSprite({
  id: 'fx.aglio_skin', w: 16, h: 16, ax: 8, ay: 8, frames: 4,
  draw: (ctx, f) => {
    const R = rng(91 + f * 7);
    const pts: Pt[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      const k = 0.65 + R() * 0.45;
      pts.push([Math.cos(a) * 6 * k, Math.sin(a) * 4.2 * k]);
    }
    const flake = (c: Ctx) => polyPath(c, pts);
    S(ctx, flake, { fill: f % 2 ? PAPER : '#f6ead2', ink: 1, shadow: PAPER_SH, shadowOffset: [-1, -1] });
    clipTo(ctx, flake, () => {
      line(ctx, [[-5, -1], [0, -2], [5, 0]], 0.7, VIO, true, 0.7);
      line(ctx, [[-4, 2], [1, 1.4], [5, 2.6]], 0.6, VIO, true, 0.5);
    });
  },
});

// ===========================================================================
// IL PANETTO SUPREMO — The Supreme Butter Block (r 54)
// ===========================================================================
export const BURRO_R = 54;
const BU_W = 262, BU_H = 196, BU_AX = 106, BU_AY = 134;

const BUT = '#fde48a';
const BUT_TOP = '#fff3bd';
const BUT_SIDE = '#f1c95a';
const BUT_SH = '#e2b445';
const BUT_DK = '#b98a22';
const CER = '#f8f6f0';
const CER_SH = '#c9d0e2';
const BLUE = '#2f62b8';
const BLUE_LT = '#7aa2e6';
const FOIL = '#d6dde8';
const FOIL_HI = '#ffffff';
const FOIL_SH = '#8f9bb0';
const STEEL = '#e4eaf1';
const STEEL_SH = '#98a4b6';
const BU_BROW = '#6a3a12';

// block: front face + depth toward the upper-left (we see its left side and its top)
const FX0 = -40, FX1 = 56, FY0 = -62, FY1 = 30;
const BDX = -24, BDY = -16;
// the dish under it
const DISH_X = -8, DISH_Y = 28, DISH_RX = 94, DISH_RY = 17, DISH_T = 7;

interface BuPose {
  f: number;
  lean: number;
  crouch: number;
  eyes: 'smug' | 'glare' | 'fierce';
  mouth: 'smug' | 'clench' | 'shout';
  grip: Pt;
  knife: number; // knife rotation (0 = blade straight up)
  shield: Pt; // centre of the lid shield
  shieldTilt: number;
  sweat: boolean;
  melt: number; // drip length boost
}

const bFront = (c: Ctx) => roundRectPath(c, FX0, FY0, FX1 - FX0, FY1 - FY0, 11);
const bTop = (c: Ctx) => {
  c.moveTo(FX0 + 8, FY0);
  c.quadraticCurveTo(FX0 + BDX * 0.5 + 2, FY0 + BDY * 0.5 - 1, FX0 + BDX + 9, FY0 + BDY);
  c.lineTo(FX1 + BDX - 5, FY0 + BDY);
  c.quadraticCurveTo(FX1 + BDX * 0.5 + 1, FY0 + BDY * 0.5 - 1, FX1 - 6, FY0);
  c.closePath();
};
const bSide = (c: Ctx) => {
  c.moveTo(FX0 + 3, FY0 + 6);
  c.quadraticCurveTo(FX0 + BDX * 0.5, FY0 + BDY * 0.5 + 1, FX0 + BDX + 4, FY0 + BDY + 9);
  c.lineTo(FX0 + BDX + 1, FY1 + BDY - 6);
  c.quadraticCurveTo(FX0 + BDX * 0.5, FY1 + BDY * 0.5 + 2, FX0 + 1, FY1 - 4);
  c.closePath();
};

/** Short ceramic legs with blue bun feet, 4-frame trot. */
function dishLegs(ctx: Ctx, f: number) {
  const ph = phase(f);
  const xs = [-70, -30, 14, 54];
  xs.forEach((x, i) => {
    const pp = ph + (i % 2 ? Math.PI : 0);
    const lift = Math.max(0, -Math.cos(pp)) * 4;
    const fx = x + Math.sin(pp) * 3.5;
    const top = DISH_Y + DISH_T + 6;
    line(ctx, [[x, top], [fx, BURRO_R - 5 - lift]], 7 + OUT_IN * 2, INK, true);
    line(ctx, [[x, top], [fx, BURRO_R - 5 - lift]], 7, CER, true);
    line(ctx, [[x + 2, top], [fx + 2, BURRO_R - 6 - lift]], 2.2, CER_SH, true, 0.9);
    S(ctx, (c) => {
      c.moveTo(fx - 8, BURRO_R - lift);
      c.quadraticCurveTo(fx - 8, BURRO_R - 8 - lift, fx + 1, BURRO_R - 8 - lift);
      c.quadraticCurveTo(fx + 10, BURRO_R - 8 - lift, fx + 10, BURRO_R - lift);
      c.closePath();
    }, { fill: BLUE, ink: OUT_IN, shadow: '#1d3f80', shadowOffset: [-1.6, -1.6], gloss: [{ x: fx - 2, y: BURRO_R - 5.6 - lift, rx: 2.6, ry: 1.1, alpha: 0.55 }] });
  });
}

/** The ceramic butter dish (plate with a blue rim), seen from above at an angle. */
function butterDish(ctx: Ctx, f: number, melt: number) {
  const top = (c: Ctx) => ellipsePath(c, DISH_X, DISH_Y, DISH_RX, DISH_RY);
  const side = (c: Ctx) => {
    c.moveTo(DISH_X - DISH_RX, DISH_Y);
    c.lineTo(DISH_X - DISH_RX + 3, DISH_Y + DISH_T);
    c.ellipse(DISH_X, DISH_Y + DISH_T, DISH_RX - 3, DISH_RY - 1, 0, Math.PI, 0, true);
    c.lineTo(DISH_X + DISH_RX, DISH_Y);
    c.closePath();
  };
  G(ctx, [
    { build: side, style: { fill: CER_SH, shadow: '#9aa6c4', shadowOffset: [-6, -2] } },
    { build: top, style: { fill: CER, shadow: CER_SH, shadowOffset: [-5, -3], gloss: [{ x: DISH_X - 56, y: DISH_Y - 6, rx: 16, ry: 2.4, rot: -0.08, alpha: 0.85 }] } },
  ], OUT);
  // blue rim band + dots on the side
  strokePath(ctx, (c) => ellipsePath(c, DISH_X, DISH_Y, DISH_RX - 7, DISH_RY - 4), BLUE, 2.6, 0.95);
  strokePath(ctx, (c) => ellipsePath(c, DISH_X, DISH_Y, DISH_RX - 11, DISH_RY - 6.4), BLUE_LT, 1, 0.8, [3, 4]);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.12 + (i / 8) * 0.76);
    const x = DISH_X + Math.cos(a) * (DISH_RX - 2), y = DISH_Y + DISH_T * 0.55 + Math.sin(a) * (DISH_RY - 1);
    fillPath(ctx, (c) => ellipsePath(c, x, y, 2.4, 1.4), BLUE, 0.9);
  }
  // melted butter pooling on the plate
  const ph = phase(f);
  const pool = (c: Ctx) => {
    ellipsePath(c, 6, FY1 + 3, 62 + melt * 6 + Math.sin(ph) * 1.2, 7 + melt);
    ellipsePath(c, -54, FY1 - 6, 14, 4.6);
  };
  S(ctx, pool, { fill: '#fde995', ink: OUT_S, shadow: BUT_SH, shadowOffset: [-2, -1.6], gloss: [{ x: 30, y: FY1 + 1, rx: 9, ry: 1.4, alpha: 0.85 }] });
}

/** Butter-curl quiff on top of the block. */
function butterCurl(ctx: Ctx, x: number, y: number, f: number, s = 1) {
  const bob = Math.sin(phase(f) * 2) * 0.8;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(s, s);
  const pts: Pt[] = [[-22, 5], [-14, -3], [-4, -9], [6, -12], [15, -12], [22, -6], [23, 2], [18, 6], [12, 4], [10, -1], [13, -4], [16, -2]];
  const outl = ribbon(pts, [5, 10, 12, 13, 13, 12, 10, 8, 6, 4.5, 3, 1.6]);
  S(ctx, (c) => smoothPath(c, outl, true, 0.45), { fill: BUT_TOP, ink: OUT_IN, shadow: BUT_SH, shadowOffset: [-2.6, -3], gloss: [{ x: -2, y: -9, rx: 7, ry: 1.8, rot: -0.3, alpha: 0.9 }] });
  // ridges of the curl
  for (const k of [-0.3, 0.1, 0.45]) {
    line(ctx, pts.slice(1, 6).map(([px, py], i) => [px + k * 2, py + k * (9 - i)] as Pt), 1, BUT_DK, true, 0.5);
  }
  ctx.restore();
}

/** The block itself: side, top, front, foil skirt, drips. */
function butterBlock(ctx: Ctx, p: BuPose) {
  const f = p.f;
  const ph = phase(f);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = OUT * 2;
  for (const b of [bSide, bTop, bFront]) { ctx.beginPath(); b(ctx); ctx.stroke(); }
  ctx.restore();
  shape(ctx, bSide, { fill: BUT_SIDE, ink: 0, shadow: BUT_SH, shadowOffset: [4, -4], gloss: [{ x: FX0 + BDX * 0.5, y: -20, rx: 2.4, ry: 18, rot: 0.1, alpha: 0.25 }] });
  shape(ctx, bTop, { fill: BUT_TOP, ink: 0, shadow: 'none', gloss: [{ x: FX0 + 20, y: FY0 - 9, rx: 14, ry: 2.6, rot: 0, alpha: 0.7 }] });
  shape(ctx, bFront, {
    fill: BUT, ink: 0, shadow: BUT_SH, shadowOffset: [-8, -7],
    gloss: [{ x: FX0 + 9, y: -16, rx: 3.4, ry: 22, rot: 0.04, alpha: 0.6 }, { x: FX0 + 9, y: FY0 + 10, rx: 2.4, ry: 3.4, alpha: 0.9 }],
  });
  // a knife scrape on the top (someone already had a go at it)
  line(ctx, [[FX1 - 30, FY0 - 6], [FX1 - 14, FY0 - 10]], 2.2, BUT_SIDE, true, 0.8);
  line(ctx, [[FX1 - 29, FY0 - 4.6], [FX1 - 13, FY0 - 8.6]], 1, '#ffffff', true, 0.8);
  // inner edge line (soft corner)
  line(ctx, [[FX0 + 6, FY0 + 1], [FX1 - 6, FY0 + 1]], 1.2, BUT_DK, false, 0.35);
  // melting cap: a softer, glossier layer sagging over the front edge, with drips (animated)
  const drips: [number, number, number][] = [[-30, 9, 17], [9, 10, 21], [47, 8, 14]];
  const cap = (c: Ctx) => {
    c.moveTo(FX0 + 2, FY0 + 4);
    c.quadraticCurveTo(FX0 + 1, FY0 - 2, FX0 + 10, FY0 - 2);
    c.lineTo(FX1 - 10, FY0 - 2);
    c.quadraticCurveTo(FX1 - 1, FY0 - 2, FX1 - 2, FY0 + 4);
    // wavy lower edge (right to left) with a drip at each slot
    let x = FX1 - 2;
    for (let i = drips.length - 1; i >= 0; i--) {
      const [dx, w, len] = drips[i];
      const L = len + Math.sin(ph + i * 1.9) * 2.5 + p.melt * 6;
      const rb = w * 0.42;
      c.quadraticCurveTo((x + dx + w / 2) / 2, FY0 + 9, dx + w / 2, FY0 + 5);
      c.bezierCurveTo(dx + w / 2, FY0 + L * 0.5, dx + rb, FY0 + L - rb * 2.2, dx + rb, FY0 + L - rb);
      c.arc(dx, FY0 + L - rb, rb, 0, Math.PI, false);
      c.bezierCurveTo(dx - rb, FY0 + L - rb * 2.2, dx - w / 2, FY0 + L * 0.5, dx - w / 2, FY0 + 5);
      x = dx - w / 2;
    }
    c.quadraticCurveTo((x + FX0 + 2) / 2, FY0 + 9, FX0 + 2, FY0 + 4);
    c.closePath();
  };
  S(ctx, cap, {
    fill: BUT_TOP, ink: OUT_S + 0.3, shadow: '#f6d779', shadowOffset: [-2.2, -2.2],
    gloss: [{ x: FX0 + 22, y: FY0 + 2, rx: 12, ry: 1.6, alpha: 0.9 }, ...drips.map(([dx, w, len], i) => ({ x: dx - w * 0.14, y: FY0 + len + Math.sin(ph + i * 1.9) * 2.5 + p.melt * 6 - w * 0.62, rx: w * 0.14, ry: w * 0.22, alpha: 0.95 }))],
  });
  // gold foil wrapper peeled down like a skirt (front + side), crinkled top edge
  const fy = FY1 - 16;
  const crinkle = (x0: number, x1: number, y0: number, y1: number, n: number): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + (i % 2 ? 3.4 : -1.6)]);
    }
    return pts;
  };
  const fTop = crinkle(FX0 - 2, FX1 + 2, fy, fy, 12);
  const foilF = (c: Ctx) => {
    c.moveTo(fTop[0][0], fTop[0][1]);
    for (const q of fTop) c.lineTo(q[0], q[1]);
    c.lineTo(FX1 + 2, FY1 - 6);
    c.quadraticCurveTo(FX1 + 2, FY1 + 2, FX1 - 8, FY1 + 2);
    c.lineTo(FX0 + 8, FY1 + 2);
    c.quadraticCurveTo(FX0 - 2, FY1 + 2, FX0 - 2, FY1 - 6);
    c.closePath();
  };
  const sTop = crinkle(FX0 + BDX + 1, FX0 - 1, fy + BDY + 2, fy, 5);
  const foilS = (c: Ctx) => {
    c.moveTo(sTop[0][0], sTop[0][1]);
    for (const q of sTop) c.lineTo(q[0], q[1]);
    c.lineTo(FX0, FY1 - 2);
    c.quadraticCurveTo(FX0 + BDX * 0.5, FY1 + BDY * 0.5 + 2, FX0 + BDX + 1, FY1 + BDY - 4);
    c.closePath();
  };
  G(ctx, [
    { build: foilS, style: { fill: '#aab4c6', shadow: FOIL_SH, shadowOffset: [2, -2] } },
    { build: foilF, style: { fill: FOIL, shadow: FOIL_SH, shadowOffset: [-6, -4] } },
  ], OUT_IN);
  clipTo(ctx, foilF, () => {
    const R = rng(23);
    for (let i = 0; i < 9; i++) {
      const x = FX0 + 4 + i * 10.4 + (R() - 0.5) * 3;
      line(ctx, [[x, fy - 2], [x + (R() - 0.5) * 6, fy + 8], [x + (R() - 0.5) * 4, FY1 + 2]], 1.6, i % 2 ? FOIL_HI : FOIL_SH, false, i % 2 ? 0.8 : 0.55);
    }
    fillPath(ctx, (c) => ellipsePath(c, FX0 + 18, fy + 6, 10, 2.2, -0.1), '#ffffff', 0.6);
  });
}

function butterFace(ctx: Ctx, p: BuPose) {
  const fx = 9, ey = -30;
  const ex0 = fx - 17, ex1 = fx + 17;
  if (p.eyes === 'smug') {
    lidEye(ctx, ex0, ey, 11, { side: -1, lidOuter: 0.34, lidInner: 0.46, look: [0.42, 0.32], iris: '#3a7fd6', pupil: 0.3, lidColor: BUT_SH, ink: 2.4, lash: true });
    lidEye(ctx, ex1, ey, 11.5, { side: 1, lidOuter: 0.3, lidInner: 0.42, look: [0.42, 0.32], iris: '#3a7fd6', pupil: 0.3, lidColor: BUT_SH, ink: 2.4, lash: true });
    brow(ctx, ex0 - 1, ey - 19, 19, -0.3, 5, BU_BROW);
    brow(ctx, ex1 + 1, ey - 16, 20, -0.1, 5, BU_BROW);
  } else if (p.eyes === 'glare') {
    lidEye(ctx, ex0, ey + 1, 11, { side: -1, lidOuter: 0.16, lidInner: 0.6, look: [0.45, 0.18], iris: '#3a7fd6', pupil: 0.34, lidColor: BUT_SH, ink: 2.4 });
    lidEye(ctx, ex1, ey + 1, 11.5, { side: 1, lidOuter: 0.16, lidInner: 0.6, look: [0.45, 0.18], iris: '#3a7fd6', pupil: 0.34, lidColor: BUT_SH, ink: 2.4 });
    brow(ctx, ex0 + 1, ey - 13, 22, 0.42, 5.6, BU_BROW);
    brow(ctx, ex1 - 1, ey - 13, 23, -0.42, 5.6, BU_BROW);
  } else {
    lidEye(ctx, ex0, ey - 1, 12, { side: -1, lidOuter: 0.04, lidInner: 0.24, look: [0.38, 0.08], iris: '#4a92f0', pupil: 0.22, lidColor: BUT_SH, ink: 2.5, squash: 1.14 });
    lidEye(ctx, ex1, ey - 1, 12.5, { side: 1, lidOuter: 0.04, lidInner: 0.24, look: [0.38, 0.08], iris: '#4a92f0', pupil: 0.22, lidColor: BUT_SH, ink: 2.5, squash: 1.14 });
    brow(ctx, ex0, ey - 19, 23, 0.5, 6, BU_BROW);
    brow(ctx, ex1, ey - 19, 24, -0.5, 6, BU_BROW);
  }
  // blush
  fillPath(ctx, (c) => ellipsePath(c, ex0 - 4, ey + 15, 6.5, 3.4), '#f39a7a', 0.45);
  fillPath(ctx, (c) => ellipsePath(c, ex1 + 6, ey + 15, 6.5, 3.4), '#f39a7a', 0.45);
  const mx = fx + 1, my = -5;
  if (p.mouth === 'smug') {
    const m = (c: Ctx) => {
      c.moveTo(mx - 19, my - 2);
      c.quadraticCurveTo(mx, my + 4, mx + 21, my - 6);
      c.quadraticCurveTo(mx + 15, my + 14, mx + 1, my + 14);
      c.quadraticCurveTo(mx - 14, my + 13, mx - 19, my - 2);
      c.closePath();
    };
    shape(ctx, m, { fill: '#5b1320', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, m, () => {
      fillPath(ctx, (c) => {
        c.moveTo(mx - 22, my - 6);
        c.quadraticCurveTo(mx, my + 1, mx + 24, my - 10);
        c.lineTo(mx + 24, my + 2);
        c.quadraticCurveTo(mx, my + 10, mx - 22, my + 4);
        c.closePath();
      }, '#fff8ea');
      for (let i = -3; i <= 3; i++) line(ctx, [[mx + i * 5.6, my - 6], [mx + i * 5.6 + 0.4, my + 8]], 0.9, 'rgba(80,40,30,0.4)');
      fillPath(ctx, (c) => ellipsePath(c, mx + 2, my + 14, 9, 3.6), '#e8616e');
    });
    line(ctx, [[mx + 21, my - 6], [mx + 25, my - 9]], 1.6, INK, true);
    line(ctx, [[mx - 19, my - 2], [mx - 22, my - 3.5]], 1.6, INK, true);
  } else if (p.mouth === 'clench') {
    const m = (c: Ctx) => roundRectPath(c, mx - 18, my - 4, 36, 14, 6);
    shape(ctx, m, { fill: '#fff8ea', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, m, () => {
      line(ctx, [[mx - 18, my + 3], [mx + 18, my + 3]], 1.4, 'rgba(80,40,30,0.6)');
      for (let i = -2; i <= 2; i++) line(ctx, [[mx + i * 7, my - 4], [mx + i * 7, my + 10]], 1, 'rgba(80,40,30,0.45)');
    });
  } else {
    const m = (c: Ctx) => {
      c.moveTo(mx - 18, my - 4);
      c.quadraticCurveTo(mx, my - 9, mx + 20, my - 6);
      c.quadraticCurveTo(mx + 19, my + 22, mx + 1, my + 24);
      c.quadraticCurveTo(mx - 18, my + 21, mx - 18, my - 4);
      c.closePath();
    };
    shape(ctx, m, { fill: '#5b1320', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, m, () => {
      fillPath(ctx, (c) => ellipsePath(c, mx + 3, my + 22, 11, 7), '#e8616e');
      fillPath(ctx, (c) => {
        c.moveTo(mx - 22, my - 12);
        c.lineTo(mx + 24, my - 12);
        c.lineTo(mx + 24, my);
        c.quadraticCurveTo(mx, my + 3, mx - 22, my + 1);
        c.closePath();
      }, '#fff8ea');
      for (let i = -3; i <= 3; i++) line(ctx, [[mx + i * 5.6, my - 10], [mx + i * 5.6, my + 1]], 0.9, 'rgba(80,40,30,0.4)');
    });
  }
}

/** Butter knife in local coords: grip at (0,0), handle along +y, blade along −y. */
function butterKnife(ctx: Ctx, f: number, shine: boolean) {
  // handle: ceramic, blue bands (matches the dish)
  S(ctx, (c) => roundRectPath(c, -5, 0, 10, 28, 5), { fill: CER, ink: OUT_IN, shadow: CER_SH, shadowOffset: [-2.2, -1], gloss: [{ x: -2, y: 12, rx: 1.2, ry: 8, alpha: 0.8 }] });
  for (const yy of [6, 21]) fillPath(ctx, (c) => c.rect(-5, yy, 10, 2.6), BLUE);
  // bolster
  S(ctx, (c) => roundRectPath(c, -6.5, -6, 13, 7, 2.4), { fill: STEEL, ink: OUT_S + 0.3, shadow: STEEL_SH, shadowOffset: [-1.4, -1] });
  // broad round-tipped blade
  const blade = (c: Ctx) => {
    c.moveTo(-5.5, -5);
    c.lineTo(-7, -56);
    c.quadraticCurveTo(-7.5, -72, 2, -73);
    c.quadraticCurveTo(10, -72, 9, -56);
    c.quadraticCurveTo(7.6, -30, 5.5, -5);
    c.closePath();
  };
  S(ctx, blade, { fill: STEEL, ink: OUT_IN, shadow: STEEL_SH, shadowOffset: [-4, -1], gloss: [{ x: -2.6, y: -40, rx: 1.4, ry: 22, alpha: 0.9 }] });
  line(ctx, [[3, -12], [4.6, -58]], 1, '#ffffff', false, 0.5);
  // a generous smear of butter on the blade
  S(ctx, (c) => {
    c.moveTo(-7.4, -50);
    c.quadraticCurveTo(-10, -60, -3, -64);
    c.quadraticCurveTo(6, -68, 9.6, -60);
    c.quadraticCurveTo(10, -52, 6, -50);
    c.quadraticCurveTo(0, -46, -7.4, -50);
    c.closePath();
  }, { fill: BUT, ink: OUT_S, shadow: BUT_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: -2, y: -60, rx: 3.2, ry: 1.4, rot: -0.3, alpha: 0.9 }] });
  if (shine) {
    sparkle(ctx, 4, -70, 8, '#ffffff', 1);
    sparkle(ctx, -6, -30, 4.6, '#ffffff', 0.85);
  } else {
    const tw = [[-3, -66], [5, -36], [-4, -20], [6, -60]][((f % 4) + 4) % 4];
    sparkle(ctx, tw[0], tw[1], 4.2, '#ffffff', 0.9);
  }
}

/** The dish lid as a shield. (x,y) = centre. */
function lidShield(ctx: Ctx, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const dome = (c: Ctx) => {
    c.moveTo(-22, 20);
    c.lineTo(-22, -4);
    c.bezierCurveTo(-22, -22, -12, -26, 0, -26);
    c.bezierCurveTo(12, -26, 22, -22, 22, -4);
    c.lineTo(22, 20);
    c.closePath();
  };
  const rim = (c: Ctx) => roundRectPath(c, -26, 16, 52, 9, 4);
  G(ctx, [
    { build: dome, style: { fill: CER, shadow: CER_SH, shadowOffset: [-6, -3], gloss: [{ x: -12, y: -8, rx: 3, ry: 11, rot: 0.1, alpha: 0.9 }] } },
    { build: rim, style: { fill: CER, shadow: CER_SH, shadowOffset: [-3, -2] } },
  ], OUT);
  // blue decoration: band + a little flower
  clipTo(ctx, dome, () => {
    fillPath(ctx, (c) => c.rect(-24, 8, 48, 4), BLUE);
    for (let i = -2; i <= 2; i++) fillPath(ctx, (c) => circlePath(c, i * 8.4, 4, 1.3), BLUE_LT);
  });
  fillPath(ctx, (c) => { for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - Math.PI / 2; ellipsePath(c, Math.cos(a) * 4.2, -9 + Math.sin(a) * 4.2, 3, 2, a); } }, BLUE);
  fillPath(ctx, (c) => circlePath(c, 0, -9, 2), '#ffcf4a');
  strokePath(ctx, (c) => roundRectPath(c, -24, 18.5, 48, 4, 2), BLUE, 1.6, 0.9);
  // knob
  ball(ctx, 0, -29, 5, CER, OUT_S + 0.3, 0.9);
  fillPath(ctx, (c) => circlePath(c, 0, -29, 1.8), BLUE);
  ctx.restore();
}

/** A butter pat (seen from above, slight thickness). */
function butterPat(ctx: Ctx, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  const side = (c: Ctx) => roundRectPath(c, -6.6, -4.4, 13.2, 10.6, 2.6);
  const top = (c: Ctx) => roundRectPath(c, -6.6, -5.8, 13.2, 9.4, 2.6);
  G(ctx, [
    { build: side, style: { fill: BUT_SIDE, shadow: BUT_SH, shadowOffset: [-1, -1] } },
    { build: top, style: { fill: BUT, shadow: BUT_SH, shadowOffset: [-1.3, -1.3], gloss: [{ x: -3, y: -3.6, rx: 2.6, ry: 0.9, rot: -0.1, alpha: 0.95 }] } },
  ], 1.2);
  // stamped flower on the top
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = BUT_DK;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + 0.4;
    ellipsePath(ctx, 0.6 + Math.cos(a) * 1.9, -1.1 + Math.sin(a) * 1.4, 1.3, 0.8, a);
  }
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawButter(ctx: Ctx, p: BuPose) {
  const f = p.f;
  const ph = phase(f);
  dishLegs(ctx, f);
  ctx.save();
  pivot(ctx, 0, BURRO_R, p.lean * 0.4);
  butterDish(ctx, f, p.melt);
  ctx.restore();
  ctx.save();
  pivot(ctx, 0, DISH_Y + 4, p.lean);
  ctx.translate(0, p.crouch);
  ctx.scale(1 + p.crouch * 0.008, 1 - p.crouch * 0.01);

  // far arm (holding the shield) — behind the shield, from the left side
  const [sx, sy] = p.shield;
  limb(ctx, [[FX0 + BDX * 0.5, -6], [sx + 10, sy + 10], [sx + 4, sy + 2]], 12, BUT_SIDE, OUT_IN, BUT_SH);
  butterBlock(ctx, p);
  butterCurl(ctx, 4, FY0 - 12, f);
  butterFace(ctx, p);
  if (p.sweat) {
    for (const [dx, dy, r] of [[-56, -66, 3.6], [62, -70, 3.2], [-46, -84, 2.6]] as [number, number, number][]) {
      S(ctx, (c) => {
        c.moveTo(dx, dy - r * 2.4);
        c.bezierCurveTo(dx + r * 0.4, dy - r * 1.4, dx + r, dy - r * 0.8, dx + r, dy);
        c.arc(dx, dy, r, 0, Math.PI, false);
        c.bezierCurveTo(dx - r, dy - r * 0.8, dx - r * 0.4, dy - r * 1.4, dx, dy - r * 2.4);
        c.closePath();
      }, { fill: BUT_TOP, ink: OUT_S, shadow: BUT_SH, shadowOffset: [-1, -1] });
    }
    // heat shimmer
    for (const k of [-1, 0, 1]) line(ctx, [[k * 24 + 2, FY0 - 34], [k * 24 + 6, FY0 - 40], [k * 24 + 2, FY0 - 46], [k * 24 + 6, FY0 - 52]], 1.8, '#ffffff', true, 0.55);
  }
  lidShield(ctx, sx, sy, p.shieldTilt);
  glove(ctx, sx + 20, sy + 4, 7.5, 0.2, {});

  // near arm + knife
  const [gx, gy] = p.grip;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(p.knife);
  butterKnife(ctx, f, p.eyes !== 'smug');
  ctx.restore();
  const ex = gy > -30 ? gx - 6 : gx + 8, ey = gy > -30 ? gy + 14 : (gy - 6) / 2 + 6;
  limb(ctx, [[FX1 - 4, -4], [ex, ey + Math.sin(ph) * 1.2], [gx - 1, gy + 2]], 12, BUT, OUT_IN, BUT_SH);
  glove(ctx, gx, gy, 9, p.knife + Math.PI / 2, {});
  ctx.restore();
}

const BU_WALK = (f: number): BuPose => ({
  f, lean: Math.sin(phase(f)) * 0.012, crouch: Math.max(0, Math.cos(phase(f) * 2)) * 1.2, eyes: 'smug', mouth: 'smug',
  grip: [76, 6 + Math.sin(phase(f)) * 1.4], knife: 0.1 + Math.sin(phase(f)) * 0.04,
  shield: [-74, 2 + Math.cos(phase(f)) * 1.2], shieldTilt: -0.08, sweat: false, melt: 0,
});

function drawButterPose(ctx: Ctx, f: number, pose: BossPose) {
  if (pose === 'idle') return drawButter(ctx, BU_WALK(f));
  if (pose === 'windup') {
    // knife raised high behind the head, shield up, glaring and sweating butter
    softGlow(ctx, 6, -20, 92, '#ffe680', 0.35, 70);
    drawButter(ctx, {
      f: 1, lean: -0.05, crouch: 4, eyes: 'glare', mouth: 'clench',
      grip: [74, -48], knife: -0.3, shield: [-64, -8], shieldTilt: -0.18, sweat: true, melt: 0.4,
    });
    return;
  }
  // the slash: knife swung forward, butter pats flying
  swoosh(ctx, 56, -22, 82, -2.3, 0.45, 26, '#ffffff', 0.75);
  swoosh(ctx, 56, -22, 70, -2.0, 0.3, 12, '#fff3b0', 0.8);
  drawButter(ctx, {
    f: 2, lean: 0.06, crouch: -2, eyes: 'fierce', mouth: 'shout',
    grip: [70, -8], knife: 1.95, shield: [-70, 0], shieldTilt: 0.06, sweat: false, melt: 0.7,
  });
  burstLines(ctx, 138, 18, 14, 24, 7, '#fff6c8', 2.4, 9, -1.6, 1.4, 0.95);
  for (const [px, py, rot, s] of [[120, -52, 0.4, 1.25], [142, -22, -0.3, 1.1], [100, -80, 0.9, 1]] as [number, number, number, number][]) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    butterPat(ctx, s);
    ctx.restore();
  }
}

registerBoss('burro', BU_W, BU_H, BU_AX, BU_AY, drawButterPose);

// ---------------------------------------------------------------------------
// proj.e_butterpat — stamped butter pat (rings, lobbed pats)
// ---------------------------------------------------------------------------
danger('proj.e_butterpat', 12, (ctx) => butterPat(ctx, 1));

