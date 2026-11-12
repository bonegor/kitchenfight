/**
 * IL MENÙ — BOSSES B: the final bosses of the Ragù, the Pesto and the Vongole.
 *
 * Follow docs/ART_GUIDE.md (quality bar: bosses_a.ts / bosses_b_*.ts; see registerBoss() there):
 *   boss.<id>          frames: 4, flash: true — idle/walk loop with secondary motion
 *   boss.<id>.attack   frames: 2, flash: true — 0 = wind-up/telegraph, 1 = attack. SAME box/anchor.
 * Anchor = centre of the collision circle; base at y ≈ +radius; face front-right; outline 3–4.
 *
 *   id                box w×h   anchor (ax,ay)  radius  look
 *   boss.bolognese    240×220   (120,150)       62      Lo Spaghettone alla Bolognese: a ghostly mountain of spaghetti
 *                                                       draped like a sheet, ragù ladled over the top with two meatballs and
 *                                                       a fork planted in it, hollow glowing eyes, noodle-bundle ghost arms,
 *                                                       loose noodles drooping off its sides (they break the ghost-sheet
 *                                                       silhouette) and a hem of dangling strands (it floats). A wide cool
 *                                                       ectoplasm halo and rising wisps: it doesn't exist. The code fades it
 *                                                       (alpha ≈ 0.26) while it phases, so it is painted fully opaque with a
 *                                                       heavy outline and high-contrast eyes that still read when faded.
 *   boss.frullatore   170×236   (85,172)        56      Il Frullatore Rovente: a candy-red blender base on chrome legs, a
 *                                                       glass jar of pale creamy-green sludge with cashews and cream swirls,
 *                                                       an angry face in the sludge, a steel blade, steam from the lid cap,
 *                                                       a spatula in one gloved hand. Wind-up: the sludge spins into a
 *                                                       vortex and the cap rattles; attack: it bellows, the cap blows off
 *                                                       and the sludge pours forward over the spout (the spray leaves
 *                                                       from the jet's tip at (72,-112)).
 *   boss.grattugiato  200×226   (100,160)       58      Il Sacco del Grattugiato: a stand-up pouch of pre-grated
 *                                                       "parmesan" (no brand, no text): crimped top seal with a hang hole,
 *                                                       a fake-Italian tricolour ribbon, a navy printed lower panel with a
 *                                                       bottom gusset and a window full of grated cheese, plastic crinkles,
 *                                                       a torn top corner snowing cheese, a steel scoop heaped with it. It
 *                                                       waddles (sway, squash and bounce on every step).
 *
 *   proj.e_meatball  24×24  (12,12)  a meatball in ragù (lobbed). DANGER style (projectiles.ts).
 *   proj.e_pesto     24×24  (12,12)  a blob of green sludge with a cream swirl and a cashew bit. DANGER style.
 *   proj.e_cheese    24×24  (12,12)  a clump of grated cheese "snow". DANGER style.
 *
 *   Fight effects (drawn by the patterns with run.fx.sprite):
 *   fx.noodle_lash        492×64  (18,32)   the noodle whip laid along a Bolognese lash lane (4 frames).
 *   fx.cheese_flake       16×16   centre    a shred falling inside a Grattugiato cheese cloud (3 shapes).
 *   fx.frullatore_heat    170×236 (85,172)  additive red-hot glow over the overheated (enraged) Frullatore.
 */
import { registerBoss, type Pose } from './bosses_a';
import { defineSprite } from '../sprites';
import { danger, sauceBlob } from './projectiles';
import {
  Ctx, Pt, shape, line, inkLine, ellipsePath, circlePath, roundRectPath, smoothPath, polyPath, speckle, rng, brow, glint,
} from '../painter';
import {
  OUT, OUT_IN, OUT_S, TAU, phase, S, G, clipTo, fillPath, strokePath, sparkle, fist, limb, swoosh, burstLines, softGlow,
  pivot, stompLegs, dripPath, ball, lidEye, steamWisp, puffPath,
} from './bosses_b_kit';

// ===========================================================================
// shared helpers
// ===========================================================================

/** Shadow tone over everything already painted inside `build`, outside its copy shifted toward the light. */
function shadeOver(ctx: Ctx, build: (c: Ctx) => void, color: string, off: Pt, alpha = 1) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(-4000, -4000, 8000, 8000);
  ctx.translate(off[0], off[1]);
  build(ctx);
  ctx.translate(-off[0], -off[1]);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill('evenodd');
  ctx.restore();
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

/** Points along a quadratic Bézier. */
function quadPts(a: Pt, c: Pt, b: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}

/** Offset a polyline sideways by `d` (positive = to the left of travel). */
function offsetLine(pts: Pt[], d: number, from = 0, to = 1): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  const i0 = Math.round(from * (n - 1)), i1 = Math.round(to * (n - 1));
  for (let i = i0; i <= i1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const k = 1 - Math.abs((i - i0) / Math.max(1, i1 - i0) - 0.5) * 0.4;
    out.push([pts[i][0] - dy * d * k, pts[i][1] + dx * d * k]);
  }
  return out;
}

// ===========================================================================
// 1. LO SPAGHETTONE ALLA BOLOGNESE — r62, box 240×220, anchor (120,150)
// ===========================================================================

const NOODLE = '#f6d77e';
const NOODLE_SH = '#dba24a';
const NOODLE_DK = '#b8772c';
const NOODLE_HI = '#fff3c4';
const RAGU = '#b9341c';
const RAGU_SH = '#7c1c10';
const RAGU_HI = '#ec6a3e';
const MINCE = '#6a2414';
const MEATB = '#8a4426';
const ECTO = '#bdf1ff';
const ECTO_DK = '#5fc6de';
const SOCKET = '#2a0c12';
const GLOW_EYE = '#fff6a6';
const STEEL = '#e3e9f1';
const STEEL_SH = '#9aa6b8';

interface BoloPose {
  f: number;
  lean: number;
  lift: number; // float height offset (−up)
  arms: 'boo' | 'rear' | 'lash';
  eyes: 'glow' | 'hot' | 'wide';
  mouth: 'grin' | 'clench' | 'roar';
  hemFlare: number;
}

/** Body silhouette (spaghetti sheet), hem animated with the walk phase. */
function boloBodyPts(ph: number, flare: number): Pt[] {
  const top: Pt[] = [
    [-6, -106], [22, -102], [46, -86], [61, -60], [70, -30], [77, 0], [82, 26],
  ];
  const hem: Pt[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = 86 - t * 172;
    const dip = i % 2 === 0 ? 0 : 1;
    const wav = Math.sin(ph + i * 1.25) * 3.2;
    hem.push([x + Math.sin(ph + i) * 1.5 * (1 + flare), 40 + dip * 11 + wav - flare * 6 * (1 - dip) + (i === 0 || i === n ? -4 : 0)]);
  }
  const back: Pt[] = [
    [-82, 24], [-77, -2], [-70, -32], [-60, -62], [-44, -88], [-26, -102],
  ];
  return [...top, ...hem, ...back];
}

/** Draped, tangled spaghetti strands inside the sheet (deterministic). */
function boloStrands(ctx: Ctx, ph: number) {
  const R = rng(2207);
  const strands: Pt[][] = [];
  // draped strands: wavy, falling to the hem
  for (let i = 0; i < 30; i++) {
    const sx = -84 + (i / 29) * 168 + (R() - 0.5) * 10;
    const sy = -112 + Math.abs(sx) * 0.55 + R() * 16;
    const amp = 4 + R() * 6;
    const fr = 0.9 + R() * 0.6;
    const drift = (R() - 0.5) * 2.4 + sx * 0.012;
    const pts: Pt[] = [];
    const segs = 13;
    for (let k = 0; k <= segs; k++) {
      const yy = sy + k * 13.5;
      const sway = k > 8 ? Math.sin(ph + i * 0.7) * (k - 8) * 0.7 : 0;
      pts.push([sx + Math.sin(k * fr + i * 1.9) * amp + drift * k + sway, yy]);
    }
    strands.push(pts);
  }
  // strands sweeping across the heap (the tangle)
  for (let i = 0; i < 12; i++) {
    const y0 = -78 + i * 10 + (R() - 0.5) * 6;
    const dir = i % 2 ? 1 : -1;
    const pts: Pt[] = [];
    const x0 = -90 * dir;
    for (let k = 0; k <= 10; k++) {
      const x = x0 + dir * k * 18;
      pts.push([x, y0 + k * (3 + R() * 2) + Math.sin(k * 1.3 + i) * 5]);
    }
    strands.push(pts);
  }
  for (const pts of strands) line(ctx, pts, 3.9, NOODLE_DK, true, 0.5);
  for (const pts of strands) line(ctx, pts, 2.5, NOODLE, true, 1);
  for (const pts of strands) line(ctx, pts.map(([x, y]) => [x - 0.6, y - 0.5] as Pt), 0.9, NOODLE_HI, true, 0.8);
  // coils piled near the top of the heap
  const loops: [number, number, number, number][] = [[-34, -80, 16, 0.3], [4, -88, 18, -0.2], [38, -72, 14, 0.5], [-54, -50, 12, 0.9], [58, -40, 11, -0.6], [-62, -10, 12, 1.2], [66, 2, 11, -1.1]];
  for (const [x, y, r, rot] of loops) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    for (const [w, col, a] of [[3.9, NOODLE_DK, 0.5], [2.5, NOODLE, 1], [0.9, NOODLE_HI, 0.8]] as [number, string, number][]) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.45, 0, 0.3, TAU - 0.4);
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.strokeStyle = col;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}

/** Dangling strands below the hem (drawn behind the sheet). */
function boloHemStrands(ctx: Ctx, ph: number, flare: number) {
  const R = rng(91);
  for (let i = 0; i < 13; i++) {
    const x = -74 + i * 12.4 + (R() - 0.5) * 4;
    const len = 11 + R() * 7 + (i % 3 === 1 ? 3 : 0);
    const sw = Math.sin(ph + i * 1.1) * 4 * (1 + flare);
    const y0 = 42;
    const pts: Pt[] = [[x, y0], [x + sw * 0.4, y0 + len * 0.45], [x + sw, y0 + len - flare * 4]];
    inkLine(ctx, pts, 2.6, i % 2 ? NOODLE : NOODLE_SH, true, 1.15);
    if (i % 4 === 1) {
      const [ex, ey] = pts[2];
      shape(ctx, (c) => circlePath(c, ex, ey + 1, 2.1), { fill: RAGU, ink: 1, shadow: 'none', gloss: [{ x: ex - 0.6, y: ey + 0.3, rx: 0.7, ry: 0.4, alpha: 0.8 }] });
    }
  }
}

/**
 * Loose spaghetti drooping off the heap in a U (it leaves the body at `a`, sags outward and tucks
 * back in at `b`): two strands, so the bell silhouette breaks into noodles. `out` = the sag.
 */
function noodleDroop(ctx: Ctx, a: Pt, b: Pt, out: Pt, ph: number, seed: number) {
  for (let k = 0; k < 2; k++) {
    const sw = Math.sin(ph + seed + k * 1.4) * 2.2;
    const m: Pt = [(a[0] + b[0]) / 2 + out[0] * (1 - k * 0.32) + sw * 0.4, (a[1] + b[1]) / 2 + out[1] * (1 - k * 0.25) + sw];
    const pts = quadPts([a[0], a[1] + k * 4], [m[0] * 2 - (a[0] + b[0]) / 2, m[1] * 2 - (a[1] + b[1]) / 2], [b[0], b[1] - k * 3], 10);
    inkLine(ctx, pts, 3.1, k ? NOODLE_SH : NOODLE, true, 1.25);
    if (!k) line(ctx, pts.map(([px, py]) => [px - 0.5, py - 0.6] as Pt), 0.9, NOODLE_HI, true, 0.85);
  }
}

/** A loose noodle end hanging off the heap, curling at the tip. */
function noodleEnd(ctx: Ctx, x: number, y: number, dx: number, len: number, ph: number, seed: number) {
  const sw = Math.sin(ph + seed) * 3;
  const pts: Pt[] = [[x, y], [x + dx * 0.6, y + len * 0.35], [x + dx + sw * 0.5, y + len * 0.75], [x + dx * 0.8 + sw, y + len], [x + dx * 0.55 + sw, y + len - 4]];
  inkLine(ctx, pts, 2.6, NOODLE, true, 1.15);
}

/** A noodle-bundle ghost arm from the shoulder along a curve; the bundle frays into drooping noodle fingers. */
function noodleArm(ctx: Ctx, a: Pt, c: Pt, b: Pt, w0: number, w1: number, fingerDir: number, ph: number, whip = 0) {
  const pts = quadPts(a, c, b, 12);
  const n = pts.length - 1;
  const widths = pts.map((_, i) => {
    const t = i / n;
    return w0 + (w1 - w0) * t - (t > 0.8 ? (t - 0.8) * 5 * w1 * 0.55 : 0);
  });
  const outline = ribbon(pts, widths);
  const build = (cx: Ctx) => smoothPath(cx, outline, true, 0.4);
  // noodle fingers fraying out of the tip (behind the arm)
  const [tx, ty] = pts[n];
  const [px, py] = pts[n - 3];
  const dir = Math.atan2(ty - py, tx - px);
  const nf = whip ? 5 : 4;
  for (let k = 0; k < nf; k++) {
    const spread = (k - (nf - 1) / 2) * (whip ? 0.2 : 0.42);
    const ang = dir + spread;
    const L = (whip ? 18 : 16) + (k % 2) * 4;
    const droop = fingerDir * (5 + k * 1.6) * (1 - whip * 0.85);
    const wob = Math.sin(ph + k * 1.7) * 2.2;
    const f0: Pt = [px + (tx - px) * 0.6, py + (ty - py) * 0.6];
    const f1: Pt = [tx + Math.cos(ang) * L * 0.45, ty + Math.sin(ang) * L * 0.45 + droop * 0.3 + wob * 0.4];
    const f2: Pt = [tx + Math.cos(ang) * L, ty + Math.sin(ang) * L + droop + wob];
    inkLine(ctx, [f0, f1, f2], 2.5, k % 2 ? NOODLE : NOODLE_SH, true, 1.2);
    if (k === 1 && !whip) shape(ctx, (cx) => circlePath(cx, f2[0], f2[1] + 1.4, 2), { fill: RAGU, ink: 0.9, shadow: 'none' });
  }
  S(ctx, build, { fill: NOODLE, ink: OUT_IN, shadow: NOODLE_SH, shadowOffset: [-3, -3.4] });
  clipTo(ctx, build, () => {
    for (const d of [-w0 * 0.32, -w0 * 0.08, w0 * 0.18, w0 * 0.38]) {
      const sl = offsetLine(pts, d);
      line(ctx, sl, 1.9, NOODLE_DK, true, 0.42);
      line(ctx, sl.map(([x, y]) => [x - 0.5, y - 0.6] as Pt), 0.8, NOODLE_HI, true, 0.8);
    }
  });
  // a dollop of ragù sliding down the arm
  const m = pts[8];
  const ux = pts[9][0] - pts[7][0], uy = pts[9][1] - pts[7][1];
  const ang = Math.atan2(uy, ux);
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const up = ny > 0 ? -1 : 1; // side facing up
  const off = (widths[8] / 2) * 0.55 * up;
  const sx = m[0] + nx * off, sy = m[1] + ny * off;
  shape(ctx, (cx) => { ellipsePath(cx, sx, sy, 6, 3.6, ang); dripPath(cx, sx + 1, sy + 1, 3.4, 7 + Math.sin(ph) * 1.2); }, { fill: RAGU, ink: 1.2, shadow: RAGU_SH, shadowOffset: [-0.8, -0.9] });
  glint(ctx, sx - 2, sy - 1.4, 1.6, 0.6, ang, 0.85);
}

/** Ragù ladled over the peak with drips; returns nothing (drawn on top of the sheet). */
function boloSauce(ctx: Ctx, f: number) {
  const dr = [0, 1.5, 3, 1.5][f & 3];
  const cap = (c: Ctx) => {
    smoothPath(c, [
      [-58, -62], [-50, -80], [-34, -100], [-10, -113], [16, -114], [40, -100], [56, -80], [63, -60],
      [54, -56], [44, -60], [32, -56], [20, -60], [6, -58], [-8, -62], [-22, -58], [-36, -62], [-48, -58],
    ], true, 0.5);
  };
  const drips = (c: Ctx) => {
    dripPath(c, 50, -62, 8, 20 + dr);
    dripPath(c, 11, -62, 9, 27 + dr * 1.4); // down the nose bridge
    dripPath(c, -28, -62, 8, 15 + dr * 0.8);
    dripPath(c, -50, -62, 6, 12 + dr);
    dripPath(c, 30, -60, 5, 10 + dr * 0.6);
  };
  G(ctx, [
    { build: drips, style: { fill: RAGU, shadow: RAGU_SH, shadowOffset: [-1.6, -1.4] } },
    { build: cap, style: { fill: RAGU, shadow: RAGU_SH, shadowOffset: [-5, -5] } },
  ], OUT_IN + 0.4);
  clipTo(ctx, cap, () => {
    // minced meat: lumpy bits
    const R = rng(77);
    for (let i = 0; i < 46; i++) {
      const x = -54 + R() * 114, y = -112 + R() * 54;
      const r = 1.6 + R() * 2.4;
      fillPath(ctx, (c) => ellipsePath(c, x, y, r, r * 0.75, R() * 3), R() < 0.55 ? MINCE : RAGU_HI, 0.8);
    }
    // carrot / celery flecks of the soffritto
    speckle(ctx, 4, -84, 50, 22, 10, '#f08a2a', 1.1, 5, 0.9);
    speckle(ctx, 4, -84, 50, 22, 6, '#6f9a2e', 0.9, 6, 0.8);
    // glossy oil sheen
    fillPath(ctx, (c) => ellipsePath(c, -22, -96, 16, 5, -0.4), '#ffffff', 0.32);
    fillPath(ctx, (c) => ellipsePath(c, -28, -94, 5, 1.8, -0.4), '#ffffff', 0.8);
    fillPath(ctx, (c) => ellipsePath(c, 30, -98, 5, 1.6, 0.3), '#ffffff', 0.55);
  });
  // drip glints
  for (const [x, y] of [[11, -42 + dr * 1.4], [50, -46 + dr], [-28, -51 + dr * 0.8]] as Pt[]) glint(ctx, x - 1.4, y, 1.2, 0.8, -0.5, 0.85);
}

/** Meatball with minced texture. */
function meatball(ctx: Ctx, x: number, y: number, r: number, seed: number) {
  shape(ctx, (c) => circlePath(c, x, y, r), {
    fill: MEATB, ink: OUT_IN, shadow: '#5a2412', shadowOffset: [-r * 0.32, -r * 0.34],
  });
  clipTo(ctx, (c) => circlePath(c, x, y, r), () => {
    speckle(ctx, x, y, r * 0.85, r * 0.85, 12, '#b0663a', r * 0.14, seed, 0.75);
    speckle(ctx, x, y, r * 0.85, r * 0.85, 9, '#4a1a0c', r * 0.1, seed + 1, 0.7);
    fillPath(ctx, (c) => ellipsePath(c, x - r * 0.36, y - r * 0.42, r * 0.34, r * 0.2, -0.6), '#ffffff', 0.55);
  });
  // sauce dollop + grated cheese
  shape(ctx, (c) => {
    c.moveTo(x - r * 0.8, y - r * 0.45);
    c.quadraticCurveTo(x - r * 0.2, y - r * 1.15, x + r * 0.7, y - r * 0.6);
    c.quadraticCurveTo(x + r * 0.62, y - r * 0.2, x + r * 0.42, y - r * 0.32);
    c.quadraticCurveTo(x + r * 0.3, y + r * 0.05, x + r * 0.12, y - r * 0.3);
    c.quadraticCurveTo(x - r * 0.3, y - r * 0.22, x - r * 0.8, y - r * 0.45);
    c.closePath();
  }, { fill: RAGU, ink: 1.4, shadow: RAGU_SH, shadowOffset: [-1, -1], gloss: [{ x: x - r * 0.2, y: y - r * 0.82, rx: r * 0.22, ry: r * 0.08, alpha: 0.8 }] });
  speckle(ctx, x, y - r * 0.7, r * 0.5, r * 0.18, 5, '#fff8de', 0.8, seed + 2);
}

/** Fork planted in the heap, spaghetti twirled round the tines. */
function boloFork(ctx: Ctx, f: number) {
  const wob = [0, 0.03, 0, -0.03][f & 3];
  ctx.save();
  pivot(ctx, 24, -104, 0.42 + wob);
  // handle
  S(ctx, (c) => roundRectPath(c, 20.5, -141, 7, 31, 3.5), { fill: STEEL, ink: OUT_S + 0.3, shadow: STEEL_SH, shadowOffset: [-2, -1.2], gloss: [{ x: 22.5, y: -133, rx: 0.8, ry: 8, alpha: 0.9 }] });
  // the twirl: a spool of noodles wound round the neck of the fork
  const tw = (c: Ctx) => roundRectPath(c, 13, -117, 22, 17, 8);
  S(ctx, tw, { fill: NOODLE, ink: OUT_S + 0.4, shadow: NOODLE_SH, shadowOffset: [-2.4, -2] });
  clipTo(ctx, tw, () => {
    for (let k = 0; k < 5; k++) {
      const yy = -115 + k * 3.6;
      const bend = 2.2;
      line(ctx, [[12, yy - bend], [24, yy + bend], [36, yy - bend]], 1.5, NOODLE_DK, true, 0.85);
      line(ctx, [[12, yy - bend - 0.8], [24, yy + bend - 0.8], [36, yy - bend - 0.8]], 0.7, NOODLE_HI, true, 0.9);
    }
  });
  // a stray noodle swinging off the twirl
  const s = Math.sin(phase(f)) * 2.5;
  inkLine(ctx, [[33, -104], [39, -98 + s * 0.4], [37, -90 + s]], 2.1, NOODLE, true, 1.1);
  ctx.restore();
}

/** Hollow ghost socket with a glowing pupil; side −1 = left eye. */
function ghostEye(ctx: Ctx, x: number, y: number, rx: number, ry: number, side: number, mode: BoloPose['eyes'], look: Pt) {
  const inner = -side; // inner corner points toward the nose
  const slant = mode === 'wide' ? 0.05 : mode === 'hot' ? 0.75 : 0.5;
  const sock = (c: Ctx) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      let px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
      // flatten + slant the top: lower at the inner corner (angry)
      const k = (px - x) / rx * inner; // -1 outer .. +1 inner
      const cap = y - ry * (0.78 - slant * 0.5 * (k + 1) * 0.9);
      if (py < cap) py = cap + (py - cap) * 0.15;
      pts.push([px, py]);
    }
    smoothPath(c, pts, true, 0.45);
  };
  S(ctx, sock, { fill: SOCKET, ink: OUT_IN, shadow: 'none' });
  clipTo(ctx, sock, () => {
    // inner depth: lighter rim at the bottom-left of the hole
    fillPath(ctx, (c) => ellipsePath(c, x - rx * 0.25, y + ry * 0.5, rx * 0.8, ry * 0.45), '#4a1a22', 0.8);
    const px = x + look[0] * rx * 0.45, py = y + look[1] * ry * 0.4 + (mode === 'hot' ? ry * 0.12 : 0);
    const col = mode === 'hot' ? '#ffb43a' : GLOW_EYE;
    softGlow(ctx, px, py, rx * 1.3, mode === 'hot' ? '#ff6a1a' : '#fff2a0', 0.9);
    const pr = mode === 'wide' ? rx * 0.36 : rx * 0.48;
    shape(ctx, (c) => ellipsePath(c, px, py, pr, pr * 1.18), { fill: col, ink: 0, shadow: mode === 'hot' ? '#ff6a1a' : '#ffd84a', shadowOffset: [-pr * 0.3, -pr * 0.3] });
    fillPath(ctx, (c) => ellipsePath(c, px + pr * 0.1, py + pr * 0.12, pr * 0.42, pr * 0.5), mode === 'hot' ? '#c8200e' : '#e8a020', 0.8);
    fillPath(ctx, (c) => circlePath(c, px - pr * 0.35, py - pr * 0.4, pr * 0.3), '#ffffff');
  });
}

function boloFace(ctx: Ctx, p: BoloPose) {
  const ex = 14, ey = -30;
  const look: Pt = p.mouth === 'roar' ? [0.6, 0.1] : [0.45, 0.25];
  ghostEye(ctx, ex - 19, ey, 12.5, 15, -1, p.eyes, look);
  ghostEye(ctx, ex + 20, ey - 1, 13.5, 16, 1, p.eyes, look);
  // heavy angry brows
  const bang = p.eyes === 'wide' ? 0.12 : p.eyes === 'hot' ? 0.55 : 0.42;
  const by = ey - (p.eyes === 'wide' ? 22 : 17);
  brow(ctx, ex - 20, by, 22, bang, 6.2);
  brow(ctx, ex + 21, by - 1, 24, -bang, 6.2);
  // mouth
  const mx = ex + 2, my = 8;
  if (p.mouth === 'roar') {
    const maw = (c: Ctx) => {
      c.moveTo(mx - 26, my - 4);
      c.bezierCurveTo(mx - 16, my - 10, mx + 18, my - 11, mx + 30, my - 5);
      c.bezierCurveTo(mx + 30, my + 22, mx + 12, my + 32, mx + 1, my + 32);
      c.bezierCurveTo(mx - 14, my + 32, mx - 28, my + 18, mx - 26, my - 4);
      c.closePath();
    };
    shape(ctx, maw, { fill: '#4a0f18', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, maw, () => {
      fillPath(ctx, (c) => ellipsePath(c, mx + 4, my + 28, 16, 9), '#d8505e');
      fillPath(ctx, (c) => ellipsePath(c, mx + 1, my + 30, 6, 3), '#a03040', 0.7);
    });
    // fangs
    for (const [fx, fl] of [[mx - 16, 9], [mx + 21, 10]] as Pt[]) {
      shape(ctx, (c) => { c.moveTo(fx - 4, my - 7); c.lineTo(fx + 4, my - 8); c.lineTo(fx + 0.5, my - 8 + fl); c.closePath(); }, { fill: '#fff8ea', ink: 1.3, shadow: '#e4d2b4', shadowOffset: [-1, -0.6] });
    }
    // a noodle stuck across the shout
    inkLine(ctx, [[mx - 10, my - 7], [mx - 6, my + 8], [mx - 9, my + 24]], 2.2, NOODLE, true, 1.1);
    return;
  }
  // grin / clench: wide crooked grin full of teeth, a noodle hanging from the lip
  const open = p.mouth === 'clench' ? 0.45 : 1;
  const gp = (c: Ctx) => {
    c.moveTo(mx - 27, my - 4);
    c.quadraticCurveTo(mx, my + 3, mx + 31, my - 9);
    c.quadraticCurveTo(mx + 26, my + 6 + 12 * open, mx + 4, my + 9 + 12 * open);
    c.quadraticCurveTo(mx - 18, my + 8 + 9 * open, mx - 27, my - 4);
    c.closePath();
  };
  shape(ctx, gp, { fill: '#4a0f18', ink: OUT_IN, shadow: 'none' });
  clipTo(ctx, gp, () => {
    fillPath(ctx, (c) => ellipsePath(c, mx + 6, my + 14 + 10 * open, 14, 7), '#d8505e');
    // top teeth
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(mx - 30, my - 8);
    ctx.quadraticCurveTo(mx, my - 1, mx + 34, my - 13);
    ctx.lineTo(mx + 34, my - 2);
    ctx.quadraticCurveTo(mx, my + 9, mx - 30, my + 2);
    ctx.closePath();
    ctx.fill();
    if (p.mouth === 'clench') {
      ctx.beginPath();
      ctx.moveTo(mx - 30, my + 18);
      ctx.quadraticCurveTo(mx, my + 7, mx + 34, my + 4);
      ctx.lineTo(mx + 34, my + 24);
      ctx.lineTo(mx - 30, my + 24);
      ctx.closePath();
      ctx.fill();
    }
    for (let i = -2; i <= 3; i++) {
      const tx = mx + i * 9;
      line(ctx, [[tx, my - 8 - i * 0.6], [tx + 0.4, my + 2 - i * 0.6]], 0.9, '#b8987e');
      if (p.mouth === 'clench') line(ctx, [[tx + 4, my + 10 - i * 0.5], [tx + 4, my + 18]], 0.9, '#b8987e');
    }
  });
  // noodle dangling from the lip + a sauce dot
  const s = Math.sin(phase(p.f)) * 1.5;
  inkLine(ctx, [[mx + 18, my - 2], [mx + 21 + s * 0.4, my + 9], [mx + 18 + s, my + 18]], 2.1, NOODLE, true, 1.1);
  shape(ctx, (c) => circlePath(c, mx + 18 + s, my + 19.5, 1.8), { fill: RAGU, ink: 0.9, shadow: 'none' });
}

function drawBolognese(ctx: Ctx, p: BoloPose) {
  const f = p.f;
  const ph = phase(f);
  const flare = p.hemFlare;

  // ---- a wide, cool ectoplasm halo (it still reads when the whole sprite is faded) + rising wisps
  softGlow(ctx, 0, -30 + p.lift, 118, ECTO, 0.5, 112);
  softGlow(ctx, 0, -20 + p.lift, 96, '#e8fbff', 0.32, 88);
  const rise = (f & 3) * 6;
  for (const [wx, wy, h, s] of [[-96, -10, 26, 0], [98, -24, 24, 1.7], [-70, -96, 20, 3.1], [76, -104, 18, 4.4]] as [number, number, number, number][]) {
    steamWisp(ctx, wx, wy - rise + p.lift, h, ph + s, 6, 0.55, ECTO_DK);
    steamWisp(ctx, wx - 1, wy - rise - 1 + p.lift, h, ph + s, 4, 0.85, '#e8fbff');
  }

  ctx.save();
  ctx.translate(0, p.lift);
  pivot(ctx, 0, 40, p.lean);

  // ---- loose spaghetti drooping off the heap (breaks the bell silhouette into noodles)
  noodleDroop(ctx, [60, -64], [70, -40], [15, 9], ph, 0);
  noodleDroop(ctx, [-58, -66], [-68, -42], [-15, 9], ph, 2.1);
  noodleDroop(ctx, [76, -6], [82, 28], [28, 8], ph, 1.3);
  noodleDroop(ctx, [-76, -10], [-82, 26], [-28, 8], ph, 3.4);
  noodleEnd(ctx, 82, 20, 12, 24, ph, 5);
  noodleEnd(ctx, -82, 16, -12, 22, ph, 6);

  // ---- back arm (behind the sheet)
  if (p.arms === 'boo') {
    const b = Math.sin(ph) * 3;
    noodleArm(ctx, [-58, -20], [-90, -24 + b], [-94, -54 + b], 24, 15, 1, ph);
  } else if (p.arms === 'rear') {
    noodleArm(ctx, [-56, -40], [-86, -70], [-80, -106], 24, 15, -1, ph);
  } else {
    noodleArm(ctx, [-60, -20], [-88, -8], [-96, 8], 24, 15, 1, ph);
  }

  // ---- front arm (also behind the sheet: the arms grow out of its sides)
  if (p.arms === 'boo') {
    const b = Math.sin(ph + Math.PI) * 3;
    noodleArm(ctx, [54, -8], [94, -12 + b], [96, -44 + b], 25, 16, 1, ph);
  } else if (p.arms === 'rear') {
    noodleArm(ctx, [50, -34], [90, -66], [84, -104], 25, 16, -1, ph);
  } else {
    // LASH: the arm whips forward, a long hank of noodles cracks out
    noodleArm(ctx, [50, -34], [82, -58], [94, -34], 25, 15, 1, ph, 1);
  }

  // ---- hem strands, then the spaghetti sheet itself
  boloHemStrands(ctx, ph, flare);
  const body = (c: Ctx) => smoothPath(c, boloBodyPts(ph, flare), true);
  shape(ctx, body, { fill: NOODLE, ink: OUT, shadow: 'none' });
  clipTo(ctx, body, () => boloStrands(ctx, ph));
  shadeOver(ctx, body, NOODLE_SH, [-10, -9], 0.75);
  shadeOver(ctx, body, NOODLE_DK, [-20, -16], 0.35);
  // rim light upper-left + big soft gloss
  clipTo(ctx, body, () => {
    strokePath(ctx, (c) => { ctx.save(); ctx.translate(5, 5); smoothPath(c, boloBodyPts(ph, flare), true); ctx.restore(); }, '#fffbe0', 3, 0.5);
    fillPath(ctx, (c) => ellipsePath(c, -40, -48, 10, 22, 0.45), '#ffffff', 0.25);
  });
  // ragù soaking through the hem
  clipTo(ctx, body, () => {
    fillPath(ctx, (c) => { ellipsePath(c, -54, 42, 14, 7); ellipsePath(c, 50, 44, 11, 6); ellipsePath(c, 0, 48, 9, 5); }, RAGU, 0.45);
  });

  // ---- sauce cap, meatballs, fork
  boloSauce(ctx, f);
  const mb = Math.sin(ph) * 1.2;
  meatball(ctx, 40, -94 - mb, 11.5, 47);
  boloFork(ctx, f);
  meatball(ctx, -26, -102 + mb, 13.5, 31);
  // grated cheese + a basil leaf
  speckle(ctx, 6, -100, 28, 7, 14, '#fff8de', 1, 88);

  // ---- face
  boloFace(ctx, p);

  ctx.restore();
}

const BOLO_IDLE = (f: number): BoloPose => ({ f, lean: 0, lift: Math.sin(phase(f)) * -2, arms: 'boo', eyes: 'glow', mouth: 'grin', hemFlare: 0 });

registerBoss('bolognese', 240, 220, 120, 150, (ctx, f, pose: Pose) => {
  if (pose === 'idle') return drawBolognese(ctx, BOLO_IDLE(f));
  if (pose === 'windup') {
    // rears up, arms high, eyes go hot: the lash is coming
    softGlow(ctx, 0, -40, 96, '#ff6a3a', 0.28, 90);
    drawBolognese(ctx, { f: 1, lean: -0.06, lift: 0, arms: 'rear', eyes: 'hot', mouth: 'clench', hemFlare: 0.6 });
    for (const s of [-1, 1]) {
      line(ctx, [[s * 100, -70], [s * 106, -60], [s * 100, -50]], 2.6, '#ffffff', false, 0.8);
      line(ctx, [[s * 108, -66], [s * 113, -58], [s * 108, -50]], 2, '#ffffff', false, 0.6);
    }
    return;
  }
  // attack: lunges forward, the arm cracks like a whip, "IO ESISTO!"
  swoosh(ctx, 64, -30, 46, -2.0, 0.9, 12, '#fff3c4', 0.8);
  swoosh(ctx, 64, -30, 35, -1.8, 0.7, 6, '#ffffff', 0.65);
  drawBolognese(ctx, { f: 2, lean: 0.07, lift: 2, arms: 'lash', eyes: 'hot', mouth: 'roar', hemFlare: 1 });
  burstLines(ctx, 104, -12, 6, 12, 5, '#ffffff', 2.2, 3, -1.0, 1.4, 0.85);
  // sauce flung off the whip
  for (const [x, y, r] of [[102, -44, 3.4], [112, -26, 2.6], [108, 30, 2.2], [86, -58, 2]] as [number, number, number][]) {
    shape(ctx, (c) => circlePath(c, x, y, r), { fill: RAGU, ink: 1.1, shadow: RAGU_SH, shadowOffset: [-0.6, -0.6] });
  }
});

// ===========================================================================
// 2. IL FRULLATORE ROVENTE — r56, box 170×236, anchor (85,172)
// ===========================================================================

const RED = '#d9302a';
const RED_SH = '#931a1e';
const CHROME = '#e2e8ef';
const CHROME_SH = '#98a3b5';
const RUBBER = '#2f2a33';
const RUBBER_SH = '#1c181f';
const SLUDGE = '#93c64c';
const SLUDGE_SH = '#5f9d32';
const SLUDGE_DK = '#3c7322';
const CREAM = '#f7f2da';
const CASHEW = '#ecd29c';
const CASHEW_SH = '#c79c5a';
const GLASS_EDGE = '#d8f1ff';
const INK_C = '#2b1712';

interface FrullaPose {
  f: number;
  crouch: number;
  shake: boolean;
  eyes: 'angry' | 'slit' | 'wide';
  mouth: 'snarl' | 'clench' | 'roar';
  swirl: number; // 0 calm .. 1 vortex
  cap: 'on' | 'rattle' | 'off';
  arms: 'walk' | 'up' | 'wide';
  heat: number;
}

// jar geometry (glass), bottom → top
const JB = -22, JT = -140, JWB = 30, JWT = 44;
const jarX = (y: number) => JWB + (JWT - JWB) * ((JB - y) / (JB - JT));
function jarPath(c: Ctx, inset = 0) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) {
    const y = JB - (i / 6) * (JB - JT);
    pts.push([jarX(y) - inset + Math.sin((i / 6) * Math.PI) * 2.5, y]);
  }
  const back: Pt[] = pts.map(([x, y]) => [-x, y] as Pt).reverse();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  // spout lip on the right
  c.quadraticCurveTo(pts[pts.length - 1][0] + 6, JT - 2, pts[pts.length - 1][0] + 8, JT - 6);
  c.lineTo(-jarX(JT) + inset, JT - 2);
  for (const [x, y] of back) c.lineTo(x, y);
  c.closePath();
}

/** vertical gradient helper (local). */
function vgradL(ctx: Ctx, y0: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** Kidney-shaped cashew. */
function cashew(ctx: Ctx, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const b = (c: Ctx) => {
    c.moveTo(-s, -s * 0.2);
    c.bezierCurveTo(-s * 1.05, -s * 0.95, s * 0.2, -s * 1.05, s * 0.95, -s * 0.35);
    c.bezierCurveTo(s * 1.25, 0.1 * s, s * 0.85, s * 0.6, s * 0.4, s * 0.4);
    c.bezierCurveTo(s * 0.05, s * 0.2, -s * 0.15, s * 0.15, -s * 0.45, s * 0.55);
    c.bezierCurveTo(-s * 0.9, s * 0.8, -s * 1.05, s * 0.35, -s, -s * 0.2);
    c.closePath();
  };
  shape(ctx, b, { fill: CASHEW, ink: 1.3, shadow: CASHEW_SH, shadowOffset: [-s * 0.25, -s * 0.3], gloss: [{ x: -s * 0.35, y: -s * 0.5, rx: s * 0.35, ry: s * 0.14, rot: -0.3, alpha: 0.7 }] });
  ctx.restore();
}

/** The contents of the jar: creamy pesto sludge, cream swirls, cashews and the blade. */
function jarContents(ctx: Ctx, p: FrullaPose) {
  const f = p.f;
  const ph = phase(f);
  const level = -114 + (p.swirl > 0.5 ? -6 : 0);
  const sludge = (c: Ctx) => {
    const pts: Pt[] = [];
    const w = jarX(level) + 4;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = -w + t * w * 2;
      // calm: lazy waves; vortex: a funnel dipping in the middle
      const funnel = p.swirl * 20 * Math.exp(-((t - 0.5) ** 2) / 0.03);
      const crest = p.swirl * 8 * (Math.abs(t - 0.5) > 0.3 ? -1 : 0);
      pts.push([x, level + Math.sin(ph + t * 9) * 2.4 + funnel + crest]);
    }
    c.moveTo(-60, 0);
    for (const q of pts) c.lineTo(q[0], q[1]);
    c.lineTo(60, 0);
    c.closePath();
  };
  clipTo(ctx, (c) => jarPath(c, 2), () => {
    // glass interior behind the sludge (a pale cool tint)
    fillPath(ctx, (c) => c.rect(-60, JT - 10, 120, 140), '#cfe6ee', 0.9);
    clipTo(ctx, sludge, () => {
      ctx.fillStyle = vgradL(ctx, level - 10, JB, [[0, '#b6db6c'], [0.45, SLUDGE], [1, SLUDGE_SH]]);
      ctx.fillRect(-60, level - 30, 120, 160);
      // cream swirls (they whirl with the vortex)
      const R = rng(13 + f);
      for (let i = 0; i < 6; i++) {
        const cy = level + 14 + i * 13;
        const pts: Pt[] = [];
        for (let k = 0; k <= 10; k++) {
          const t = k / 10;
          const x = -38 + t * 76;
          pts.push([x, cy + Math.sin(t * 6 + i * 1.7 + ph * (1 + p.swirl)) * (3 + p.swirl * 4) + (p.swirl ? (t - 0.5) * 14 * (i % 2 ? 1 : -1) : 0)]);
        }
        line(ctx, pts, 3.2 - i * 0.2, CREAM, true, 0.55 + R() * 0.15);
      }
      // depth on the shadow side + basil flecks
      fillPath(ctx, (c) => ellipsePath(c, 30, -60, 14, 60), SLUDGE_DK, 0.25);
      speckle(ctx, 0, -70, 34, 40, 26, SLUDGE_DK, 1.1, 41, 0.8);
      // cashews tumbling in the sludge
      const cs: [number, number, number, number][] = [[-24, -100, 6, 0.4], [28, -104, 5.5, -0.6], [-28, -40, 6, 2.2], [26, -38, 5.5, 1.1], [-6, -32, 5, -0.4]];
      cs.forEach(([x, y, sz, rot], i) => {
        const spin = p.swirl ? ph * 0.8 + i : Math.sin(ph + i) * 0.25;
        const dx = p.swirl ? Math.sin(ph + i * 1.3) * 3 : 0;
        cashew(ctx, x + dx, y + Math.sin(ph + i * 2) * 1.5, sz, rot + spin);
      });
      // the steel blade at the bottom (spins: a frame-stepped angle + motion blur)
      const by = -28;
      const spinA = (f % 4) * 0.8 + (p.swirl ? 0.3 : 0);
      fillPath(ctx, (c) => ellipsePath(c, 0, by, 22, 6), '#ffffff', 0.25 + p.swirl * 0.25);
      for (let k = 0; k < 4; k++) {
        const a = spinA + k * (Math.PI / 2);
        const tip: Pt = [Math.cos(a) * 20, by + Math.sin(a) * 5];
        shape(ctx, (c) => { c.moveTo(-2, by - 1.6); c.quadraticCurveTo(tip[0] * 0.5, tip[1] - 4, tip[0], tip[1]); c.quadraticCurveTo(tip[0] * 0.5, tip[1] + 3, 2, by + 1.6); c.closePath(); }, { fill: CHROME, ink: 1.2, shadow: CHROME_SH, shadowOffset: [-0.8, -0.8] });
      }
      ball(ctx, 0, by, 3.2, CHROME_SH, 1.2);
      if (p.swirl > 0) {
        for (let k = 0; k < 3; k++) strokePath(ctx, (c) => c.ellipse(0, by - k * 22 - 6, 22 + k * 5, 5 + k, 0, 0.2 + ph, 2.6 + ph), '#ffffff', 2.2 - k * 0.5, 0.7);
      }
      // surface sheen
      line(ctx, [[-24, level + 3], [-6, level + 6], [12, level + 4]], 1.6, '#e5f6b0', true, 0.7);
    });
    // cream foam on the surface
    if (p.swirl < 0.5) {
      const puffs: [number, number, number][] = [[-30, 0, 5], [-21, -1.5, 6.5], [-10, -0.5, 5.5], [0, -2, 6.5], [11, -0.5, 6], [22, -1.5, 6], [31, 0.5, 4.5]];
      const foam = (c: Ctx) => {
        puffPath(c, puffs.map(([x, y, r]) => [x, level + 2 + y + Math.sin(ph + x * 0.3) * 1.2, r] as [number, number, number]));
        c.rect(-34, level + 1, 68, 6);
      };
      shape(ctx, foam, { fill: CREAM, ink: 1.2, shadow: '#d6cf9f', shadowOffset: [-1.4, -1.6], gloss: [{ x: -20, y: level - 3, rx: 2.4, ry: 1.2, alpha: 0.8 }, { x: 2, y: level - 4, rx: 2, ry: 1, alpha: 0.7 }] });
    }
  });
}

function frullaFace(ctx: Ctx, p: FrullaPose) {
  const fx = 9, fy = -80;
  const lid = SLUDGE_DK;
  const lo = p.eyes === 'wide' ? 0.08 : p.eyes === 'slit' ? 0.5 : 0.24;
  const li = p.eyes === 'wide' ? 0.12 : p.eyes === 'slit' ? 0.72 : 0.5;
  const look: Pt = p.swirl > 0.5 ? [0.1, 0.2] : [0.35, 0.18];
  lidEye(ctx, fx - 14, fy, 10, { side: -1, lidOuter: lo, lidInner: li, look, iris: '#d43a1e', pupil: 0.3, lidColor: lid, ink: 2 });
  lidEye(ctx, fx + 14, fy - 1, 11, { side: 1, lidOuter: lo, lidInner: li, look, iris: '#d43a1e', pupil: 0.3, lidColor: lid, ink: 2 });
  const ba = p.eyes === 'wide' ? 0.1 : 0.48;
  brow(ctx, fx - 15, fy - 15, 16, ba, 4.6);
  brow(ctx, fx + 15, fy - 16, 18, -ba, 4.6);
  const my = fy + 26;
  if (p.mouth === 'roar') {
    // an angry bellow: wide square maw, corners pulled down, fangs top and bottom
    const maw = (c: Ctx) => {
      c.moveTo(fx - 19, my - 5);
      c.quadraticCurveTo(fx + 2, my - 10, fx + 23, my - 6);
      c.quadraticCurveTo(fx + 25, my + 10, fx + 17, my + 19);
      c.quadraticCurveTo(fx + 2, my + 23, fx - 13, my + 18);
      c.quadraticCurveTo(fx - 21, my + 9, fx - 19, my - 5);
      c.closePath();
    };
    shape(ctx, maw, { fill: '#2a0e10', ink: OUT_IN - 0.4, shadow: 'none' });
    clipTo(ctx, maw, () => {
      fillPath(ctx, (c) => ellipsePath(c, fx + 4, my + 19, 13, 6), '#d8505e');
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.moveTo(fx - 22, my - 12);
      ctx.lineTo(fx + 26, my - 12);
      ctx.lineTo(fx + 26, my - 2);
      for (let i = 0; i <= 8; i++) ctx.lineTo(fx + 26 - i * 6, my - 2 + (i % 2 ? 3.5 : 0));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - 22, my + 26);
      ctx.lineTo(fx + 26, my + 26);
      ctx.lineTo(fx + 26, my + 16);
      for (let i = 0; i <= 8; i++) ctx.lineTo(fx + 26 - i * 6, my + 16 - (i % 2 ? 3.5 : 0));
      ctx.closePath();
      ctx.fill();
    });
    return;
  }
  const open = p.mouth === 'clench' ? 0.5 : 1;
  const gp = (c: Ctx) => {
    c.moveTo(fx - 17, my - 2);
    c.quadraticCurveTo(fx + 2, my - 6, fx + 21, my - 4);
    c.quadraticCurveTo(fx + 16, my + 10 * open, fx + 2, my + 11 * open);
    c.quadraticCurveTo(fx - 12, my + 9 * open, fx - 17, my - 2);
    c.closePath();
  };
  shape(ctx, gp, { fill: '#2a0e10', ink: OUT_IN - 0.4, shadow: 'none' });
  clipTo(ctx, gp, () => {
    fillPath(ctx, (c) => c.rect(fx - 20, my - 8, 44, 6.5), '#fff8ea');
    if (p.mouth === 'clench') fillPath(ctx, (c) => c.rect(fx - 20, my + 1.5, 44, 8), '#fff8ea');
    for (let i = -2; i <= 2; i++) line(ctx, [[fx + 2 + i * 7, my - 8], [fx + 2 + i * 7, my + (p.mouth === 'clench' ? 10 : -1.5)]], 0.8, '#b8987e');
    fillPath(ctx, (c) => ellipsePath(c, fx + 4, my + 9, 9, 4), '#d8505e', 0.9);
  });
  // a cream drool
  shape(ctx, (c) => dripPath(c, fx - 9, my + 3, 4, 8 + Math.sin(phase(p.f)) * 1.5), { fill: CREAM, ink: 1, shadow: 'none' });
}

function suctionFoot(ctx: Ctx, x: number, y: number) {
  S(ctx, (c) => {
    c.moveTo(x - 10, y + 1);
    c.quadraticCurveTo(x - 9, y - 7, x, y - 7.5);
    c.quadraticCurveTo(x + 9, y - 7, x + 10, y + 1);
    c.closePath();
  }, { fill: RED, ink: OUT_IN, shadow: RED_SH, shadowOffset: [-1.8, -1.6], gloss: [{ x: x - 4, y: y - 4.4, rx: 2.6, ry: 1.2, alpha: 0.5 }] });
}

/** Rubber spatula held at its handle end; (x,y) = the fist. */
function spatula(ctx: Ctx, x: number, y: number, rot: number, sc = 0.74) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(sc, sc);
  S(ctx, (c) => roundRectPath(c, -3, -40, 6, 46, 3), { fill: RED, ink: OUT_S + 0.3, shadow: RED_SH, shadowOffset: [-1.4, -1], gloss: [{ x: -1.2, y: -34, rx: 0.8, ry: 8, alpha: 0.6 }] });
  const blade = (c: Ctx) => { c.moveTo(-9, -40); c.quadraticCurveTo(-11, -58, -2, -62); c.quadraticCurveTo(11, -62, 10, -44); c.quadraticCurveTo(9, -38, 0, -38); c.quadraticCurveTo(-8, -38, -9, -40); c.closePath(); };
  S(ctx, blade, { fill: '#fbf7ee', ink: OUT_S + 0.4, shadow: '#d6cfc0', shadowOffset: [-2, -1.6] });
  clipTo(ctx, blade, () => {
    fillPath(ctx, (c) => { ellipsePath(c, 2, -56, 9, 5, 0.3); }, SLUDGE, 0.95);
    fillPath(ctx, (c) => dripPath(c, 5, -52, 4, 10), SLUDGE, 0.95);
    fillPath(ctx, (c) => ellipsePath(c, 0, -57, 3, 1.2, 0.3), '#e5f6b0', 0.9);
  });
  ctx.restore();
}

function frullaCord(ctx: Ctx, f: number) {
  const ph = phase(f);
  const sw = Math.sin(ph) * 4;
  const pts: Pt[] = [[-36, 26], [-56, 34], [-70, 22 + sw * 0.3], [-72, 4 + sw * 0.6], [-64, -8 + sw]];
  line(ctx, pts, 5 + OUT_IN * 2, INK_C, true);
  line(ctx, pts, 5, RUBBER, true);
  line(ctx, pts.map(([x, y]) => [x - 0.8, y - 1] as Pt), 1.4, '#7a7488', true, 0.8);
  const [px, py] = pts[pts.length - 1];
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-0.4 + sw * 0.03);
  S(ctx, (c) => roundRectPath(c, -5.5, -9, 11, 10, 2.6), { fill: RUBBER, ink: OUT_S + 0.3, shadow: RUBBER_SH, shadowOffset: [-1.2, -1.2] });
  for (const tx of [-2.6, 2.6]) {
    line(ctx, [[tx, -9], [tx, -15]], 3.6, INK_C);
    line(ctx, [[tx, -9], [tx, -15]], 1.8, '#f2c94c');
  }
  ctx.restore();
}

function drawFrullatore(ctx: Ctx, p: FrullaPose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = 58;

  // heat haze behind when hot
  if (p.heat > 0) softGlow(ctx, 0, 0, 80, '#ff5a1a', 0.3 * p.heat, 70);

  frullaCord(ctx, f);
  stompLegs(ctx, 0, 28 + p.crouch, FOOT, f, {
    spread: 22, thick: 9, color: CHROME, shade: CHROME_SH, stride: 5, lift: 6,
    shoe: (x, y) => suctionFoot(ctx, x, y),
  });

  ctx.save();
  ctx.translate(0, p.crouch);
  if (p.shake) ctx.translate(Math.sin(ph * 5) * 1.6, 0);

  // ---- back arm (left), behind the base
  const sw = Math.sin(ph) * 2.5;
  if (p.arms === 'walk') {
    limb(ctx, [[-38, 6], [-54, 14 - sw], [-58, 28 - sw]], 8, CHROME, OUT_IN, CHROME_SH);
    fist(ctx, -59, 32 - sw, 7.5, 1.9, { cuff: RED, ink: OUT_IN });
  } else if (p.arms === 'up') {
    limb(ctx, [[-38, 0], [-58, -12], [-60, -34]], 8, CHROME, OUT_IN, CHROME_SH);
    fist(ctx, -60, -38, 7.5, -1.6, { cuff: RED, ink: OUT_IN });
  } else {
    limb(ctx, [[-38, 0], [-58, -6], [-66, -22]], 8, CHROME, OUT_IN, CHROME_SH);
    fist(ctx, -68, -26, 7.5, -2.2, { cuff: RED, ink: OUT_IN });
  }

  // ---- motor base
  const base = (c: Ctx) => {
    c.moveTo(-38, -14);
    c.lineTo(38, -14);
    c.quadraticCurveTo(44, -14, 45, -8);
    c.lineTo(48, 28);
    c.quadraticCurveTo(48, 36, 40, 36);
    c.lineTo(-40, 36);
    c.quadraticCurveTo(-48, 36, -48, 28);
    c.lineTo(-45, -8);
    c.quadraticCurveTo(-44, -14, -38, -14);
    c.closePath();
  };
  S(ctx, base, {
    fill: RED, ink: OUT, shadow: RED_SH, shadowOffset: [-7, -5],
    gloss: [{ x: -36, y: 6, rx: 2.6, ry: 16, alpha: 0.45 }, { x: -16, y: -9, rx: 18, ry: 2, alpha: 0.4 }],
  });
  // heat vents
  for (let i = 0; i < 4; i++) {
    const vx = -36 + i * 5;
    line(ctx, [[vx, 22], [vx, 30]], 2.6, RED_SH);
    line(ctx, [[vx, 23], [vx, 29]], 1.2, '#ffb03a', false, 0.4 + p.heat * 0.6);
  }
  // chrome control panel with a big speed dial and three buttons
  S(ctx, (c) => roundRectPath(c, -24, 0, 54, 26, 8), { fill: CHROME, ink: OUT_S + 0.4, shadow: CHROME_SH, shadowOffset: [-2, -2], gloss: [{ x: -14, y: 4, rx: 10, ry: 1.4, alpha: 0.8 }] });
  const dx = 16, dy = 13;
  S(ctx, (c) => circlePath(c, dx, dy, 9), { fill: RUBBER, ink: OUT_S + 0.3, shadow: RUBBER_SH, shadowOffset: [-1.4, -1.4] });
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI * 0.9 + k * 0.45;
    line(ctx, [[dx + Math.cos(a) * 10.5, dy + Math.sin(a) * 10.5], [dx + Math.cos(a) * 12.5, dy + Math.sin(a) * 12.5]], 1, k > 2 ? '#d8232f' : '#5a5560');
  }
  const da = -Math.PI * 0.9 + (p.swirl > 0 || p.heat > 0.5 ? 1.9 : 0.4 + (f % 2) * 0.15);
  line(ctx, [[dx, dy], [dx + Math.cos(da) * 7, dy + Math.sin(da) * 7]], 2.2, '#ffd23a');
  fillPath(ctx, (c) => ellipsePath(c, dx - 3, dy - 3.5, 2.6, 1.4, -0.6), '#ffffff', 0.5);
  const lit = p.swirl > 0 ? 2 : f % 3;
  for (let k = 0; k < 3; k++) {
    const bx = -18 + k * 9.5;
    const on = k === lit;
    S(ctx, (c) => roundRectPath(c, bx - 3.4, 9, 6.8, 9, 2.4), { fill: on ? '#ffcf4a' : '#fdfaf0', ink: 1.2, shadow: on ? '#e0952a' : '#c9c6bc', shadowOffset: [-0.8, -0.8] });
    if (on) softGlow(ctx, bx, 13.5, 7, '#ffb03a', 0.55);
  }

  // ---- jar collar (screws onto the base)
  S(ctx, (c) => roundRectPath(c, -36, -26, 72, 14, 4), { fill: RUBBER, ink: OUT_IN, shadow: RUBBER_SH, shadowOffset: [-2, -2], gloss: [{ x: -24, y: -22, rx: 10, ry: 1.2, alpha: 0.35 }] });
  for (let k = -3; k <= 3; k++) line(ctx, [[k * 9, -24], [k * 9, -15]], 1.4, '#4a4450', false, 0.9);

  // ---- jar handle (left)
  const hnd = (c: Ctx) => {
    c.moveTo(-34, -118);
    c.bezierCurveTo(-66, -118, -66, -50, -32, -46);
    c.lineTo(-32, -58);
    c.bezierCurveTo(-52, -60, -52, -106, -34, -106);
    c.closePath();
  };
  S(ctx, hnd, { fill: RUBBER, ink: OUT_IN, shadow: RUBBER_SH, shadowOffset: [-2, -2], gloss: [{ x: -55, y: -84, rx: 1.6, ry: 12, alpha: 0.35 }] });

  // ---- glass jar
  shape(ctx, (c) => jarPath(c), { fill: '#cfe6ee', ink: OUT, shadow: 'none' });
  jarContents(ctx, p);
  frullaFace(ctx, p);
  // glass: measuring ticks, reflections, rim light
  clipTo(ctx, (c) => jarPath(c), () => {
    for (let k = 0; k < 5; k++) {
      const yy = -46 - k * 16;
      const xr = jarX(yy) - 3;
      line(ctx, [[xr - (k % 2 ? 6 : 10), yy], [xr, yy]], 1.6, '#ffffff', false, 0.75);
    }
    fillPath(ctx, (c) => polyPath(c, [[-30, -30], [-26, -134], [-17, -134], [-21, -30]]), '#ffffff', 0.32);
    fillPath(ctx, (c) => polyPath(c, [[-14, -30], [-11, -134], [-8, -134], [-11, -30]]), '#ffffff', 0.2);
    fillPath(ctx, (c) => ellipsePath(c, -24, -122, 2.4, 7, 0.06), '#ffffff', 0.85);
    strokePath(ctx, (c) => jarPath(c, 3.2), GLASS_EDGE, 2.2, 0.6);
  });

  // ---- lid + measuring cap
  S(ctx, (c) => roundRectPath(c, -48, -150, 96, 13, 5), { fill: RUBBER, ink: OUT, shadow: RUBBER_SH, shadowOffset: [-2.4, -2.4], gloss: [{ x: -30, y: -146, rx: 14, ry: 1.4, alpha: 0.35 }] });
  const capUp = p.cap === 'rattle' ? 4 + (f % 2) * 2 : 0;
  const capTilt = p.cap === 'rattle' ? (f % 2 ? 0.18 : -0.14) : 0;
  if (p.cap !== 'off') {
    if (p.cap === 'rattle') {
      // steam jets out from under the lifted cap
      for (const s of [-1, 1]) {
        fillPath(ctx, (c) => puffPath(c, [[s * 16, -154, 4], [s * 23, -158, 5], [s * 31, -160, 4]]), '#ffffff', 0.85);
      }
    }
    ctx.save();
    pivot(ctx, 0, -152, capTilt);
    ctx.translate(0, -capUp);
    S(ctx, (c) => roundRectPath(c, -12, -162, 24, 13, 4), { fill: RUBBER, ink: OUT_IN, shadow: RUBBER_SH, shadowOffset: [-1.8, -1.8], gloss: [{ x: -6, y: -158, rx: 4, ry: 1.2, alpha: 0.45 }] });
    ctx.restore();
    if (p.cap === 'on') {
      steamWisp(ctx, -26, -152, 13, ph, 4, 0.6);
      steamWisp(ctx, 24, -152, 10, ph + 2, 3.4, 0.45);
    }
  }

  // ---- front arm (right) holding the spatula
  if (p.arms === 'walk') {
    limb(ctx, [[40, 6], [56, 10 + sw], [62, 22 + sw]], 8, CHROME, OUT_IN, CHROME_SH);
    spatula(ctx, 63, 25 + sw, 0.02 + sw * 0.02);
    fist(ctx, 63, 25 + sw, 7.8, -0.9, { cuff: RED, ink: OUT_IN });
  } else if (p.arms === 'up') {
    limb(ctx, [[40, 0], [60, -10], [62, -32]], 8, CHROME, OUT_IN, CHROME_SH);
    spatula(ctx, 62, -36, 0.06);
    fist(ctx, 62, -36, 7.8, -1.6, { cuff: RED, ink: OUT_IN });
  } else {
    limb(ctx, [[40, 0], [60, -4], [66, -20]], 8, CHROME, OUT_IN, CHROME_SH);
    spatula(ctx, 66, -24, 0.16);
    fist(ctx, 66, -24, 7.8, -1.3, { cuff: RED, ink: OUT_IN });
  }
  ctx.restore();
}

const FRULLA_IDLE = (f: number): FrullaPose => ({ f, crouch: 0, shake: false, eyes: 'angry', mouth: 'snarl', swirl: 0, cap: 'on', arms: 'walk', heat: 0.25 });

registerBoss('frullatore', 170, 236, 85, 172, (ctx, f, pose: Pose) => {
  if (pose === 'idle') return drawFrullatore(ctx, FRULLA_IDLE(f));
  if (pose === 'windup') {
    // spinning up: the sludge whirls into a vortex, the cap rattles, the motor shakes
    drawFrullatore(ctx, { f: 1, crouch: 4, shake: true, eyes: 'slit', mouth: 'clench', swirl: 1, cap: 'rattle', arms: 'up', heat: 0.8 });
    for (const s of [-1, 1]) {
      line(ctx, [[s * 66, 0], [s * 71, 8], [s * 66, 16]], 2.4, '#ffffff', false, 0.85);
      line(ctx, [[s * 74, 2], [s * 79, 10], [s * 74, 18]], 2, '#ffffff', false, 0.65);
    }
    return;
  }
  // attack: FRULLA! the cap blows off and the sludge pours out over the spout in a forward jet
  // (the spray stream leaves from the jet's tip: SPOUT_X/SPOUT_Y = (72,-112) in b_frullatore.ts)
  drawFrullatore(ctx, { f: 2, crouch: -2, shake: false, eyes: 'angry', mouth: 'roar', swirl: 1, cap: 'off', arms: 'wide', heat: 1 });
  // a short eruption out of the open top
  const splash = (c: Ctx) => puffPath(c, [[-16, -152, 7], [-4, -156, 8.5], [8, -156, 8], [-26, -149, 5]]);
  S(ctx, splash, { fill: SLUDGE, ink: OUT_IN, shadow: SLUDGE_SH, shadowOffset: [-2, -2] });
  fillPath(ctx, (c) => ellipsePath(c, -8, -159, 4.5, 1.8, -0.2), '#e5f6b0', 0.9);
  // the jet: up out of the mouth, over the spout lip, down toward the chef
  const jetC: Pt[] = quadPts([10, -150], [60, -166], [72, -116], 14);
  const jetW = jetC.map((_, i) => 17 - (i / 14) * 6);
  const jet = (c: Ctx) => smoothPath(c, ribbon(jetC, jetW), true, 0.4);
  S(ctx, jet, { fill: SLUDGE, ink: OUT_IN, shadow: SLUDGE_SH, shadowOffset: [-3, -2.4] });
  clipTo(ctx, jet, () => {
    line(ctx, offsetLine(jetC, 2.5, 0.1, 0.9), 2.6, CREAM, true, 0.75);
    line(ctx, offsetLine(jetC, -4, 0.05, 0.6), 2, '#e5f6b0', true, 0.85);
    cashew(ctx, 50, -158, 4.2, 0.9);
  });
  // a blob leading the stream + droplets
  shape(ctx, (c) => circlePath(c, 72, -112, 7.5), { fill: SLUDGE, ink: OUT_IN, shadow: SLUDGE_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: 69.5, y: -115, rx: 2.4, ry: 1.2, alpha: 0.85 }] });
  for (const [x, y, r] of [[77, -130, 3], [78, -98, 2.6], [62, -96, 2.4], [-34, -158, 3.4], [-28, -164, 2.2], [26, -164, 2.4]] as [number, number, number][]) {
    shape(ctx, (c) => circlePath(c, x, y, r), { fill: SLUDGE, ink: 1.4, shadow: SLUDGE_SH, shadowOffset: [-0.8, -0.8] });
  }
  // the cap flying off behind
  ctx.save();
  ctx.translate(-48, -155);
  ctx.rotate(-0.7);
  S(ctx, (c) => roundRectPath(c, -12, -7, 24, 13, 4), { fill: RUBBER, ink: OUT_IN, shadow: RUBBER_SH, shadowOffset: [-1.8, -1.8] });
  ctx.restore();
  // speed lines along the jet
  for (const [x, y] of [[40, -165], [54, -164]] as Pt[]) line(ctx, [[x - 10, y + 1], [x, y]], 2, '#ffffff', false, 0.7);
});

// ===========================================================================
// 3. IL SACCO DEL GRATTUGIATO — r58, box 200×226, anchor (100,160)
// ===========================================================================

const BAG = '#f8f1df'; // warm plastic white
const BAG_SH = '#c9c6cf';
const BAG_DK = '#9a9aae';
const NAVY = '#24467e'; // the printed lower panel (no brand, no text)
const NAVY_SH = '#16305e';
const NAVY_HI = '#3d65a8';
const GOLD = '#e8b84a';
const CHEESE = '#f7e3a2';
const CHEESE_SH = '#dcb763';
const CHEESE_DK = '#b98e3a';
const IT_GREEN = '#2f9a4a';
const IT_RED = '#d8302e';
const LEGS = '#3b3542';

interface BagPose {
  f: number;
  crouch: number;
  puff: number; // 0..1 inflates (wind-up)
  lean: number;
  eyes: 'angry' | 'slit' | 'wide';
  mouth: 'grin' | 'clench' | 'roar';
  arms: 'walk' | 'up' | 'throw';
  spill: number; // 0..1 cheese bursting out of the tear
  look: Pt;
  bob: number; // 0..1 step bounce (squash at 0, stretch at 1)
}

/** Bag silhouette with the jagged torn top-right corner (≈ 150 u wide). */
function bagPts(puff: number): Pt[] {
  const k = 1 + puff * 0.06;
  return [
    [-54, -146], [-18, -146], [22, -146],
    // the tear (jagged)
    [27, -141], [32, -144], [36, -136], [41, -139], [45, -130], [50, -131], [53, -122], [58, -116],
    [59 * k, -100], [65 * k, -64], [72 * k, -24], [75 * k, 6], [70 * k, 28], [56 * k, 40], [27, 45], [0, 46], [-27, 45],
    [-56 * k, 40], [-70 * k, 28], [-75 * k, 6], [-72 * k, -24], [-65 * k, -64], [-58 * k, -104], [-56, -126],
  ];
}
function bagPath(c: Ctx, puff: number) {
  const pts = bagPts(puff);
  // straight seal edge on top, smooth sides
  c.moveTo(pts[0][0], pts[0][1]);
  c.lineTo(pts[2][0], pts[2][1]);
  for (let i = 3; i <= 11; i++) c.lineTo(pts[i][0], pts[i][1]);
  const rest = pts.slice(11);
  // smooth through the body
  for (let i = 1; i < rest.length; i++) {
    const p0 = rest[i - 1], p1 = rest[i];
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    if (i === 1) c.lineTo(mx, my);
    else c.quadraticCurveTo(p0[0], p0[1], mx, my);
  }
  const last = rest[rest.length - 1];
  c.quadraticCurveTo(last[0], last[1], -55, -136);
  c.lineTo(pts[0][0], pts[0][1]);
  c.closePath();
}

/** Grated-cheese texture: tiny curled shreds. */
function shreds(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, size = 2.4) {
  const R = rng(seed);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R());
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    const L = size * (0.6 + R() * 0.8), rot = R() * TAU;
    const col = R() < 0.35 ? CHEESE_DK : R() < 0.6 ? '#fff8dc' : CHEESE_SH;
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 0.9 + R() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(rot) * L, y - Math.sin(rot) * L);
    ctx.quadraticCurveTo(x + Math.sin(rot) * L * 0.5, y - Math.cos(rot) * L * 0.5, x + Math.cos(rot) * L, y + Math.sin(rot) * L);
    ctx.stroke();
  }
  ctx.restore();
}

/** A heap/clump of grated cheese (outlined, textured). */
function cheeseHeap(ctx: Ctx, puffs: [number, number, number][], seed: number, ink = OUT_S + 0.3) {
  const b = (c: Ctx) => puffPath(c, puffs);
  shape(ctx, b, { fill: CHEESE, ink, shadow: CHEESE_SH, shadowOffset: [-2.2, -2.2] });
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const [x, y, r] of puffs) { minX = Math.min(minX, x - r); maxX = Math.max(maxX, x + r); minY = Math.min(minY, y - r); maxY = Math.max(maxY, y + r); }
  clipTo(ctx, b, () => {
    shreds(ctx, (minX + maxX) / 2, (minY + maxY) / 2, (maxX - minX) / 2, (maxY - minY) / 2, Math.round((maxX - minX) * (maxY - minY) * 0.07), seed);
  });
}

/** Falling cheese flakes. */
function flakes(ctx: Ctx, pts: [number, number, number][]) {
  for (const [x, y, r] of pts) {
    shape(ctx, (c) => { c.moveTo(x - r, y - r * 0.3); c.quadraticCurveTo(x, y - r * 0.9, x + r, y - r * 0.2); c.quadraticCurveTo(x + r * 0.2, y + r * 0.7, x - r, y - r * 0.3); c.closePath(); }, { fill: CHEESE, ink: 1, shadow: 'none' });
  }
}

/** A big serving spoon heaped with grated cheese ("abbondante!"); (x,y) = the fist on the handle, rot = handle direction. */
function bigSpoon(ctx: Ctx, x: number, y: number, rot: number, heap: boolean, flip = false, sc = 0.8) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(sc, flip ? -sc : sc);
  // handle
  S(ctx, (c) => {
    c.moveTo(-6, -2.6);
    c.quadraticCurveTo(14, -3.4, 30, -2.2);
    c.lineTo(30, 2.2);
    c.quadraticCurveTo(14, 3.4, -6, 2.6);
    c.quadraticCurveTo(-9, 0, -6, -2.6);
    c.closePath();
  }, { fill: CHROME, ink: OUT_S + 0.4, shadow: CHROME_SH, shadowOffset: [-1, -1], gloss: [{ x: 10, y: -1.2, rx: 8, ry: 0.6, alpha: 0.9 }] });
  // bowl (seen from the side, open face up = toward −y in local space)
  const bowl = (c: Ctx) => {
    c.moveTo(28, -3);
    c.quadraticCurveTo(30, 9, 42, 9.5);
    c.quadraticCurveTo(54, 9, 56, -3);
    c.closePath();
  };
  if (heap) cheeseHeap(ctx, [[34, -6, 6], [42, -9, 8], [50, -6, 6.5], [45, -14, 4.5]], 61, OUT_S);
  S(ctx, bowl, { fill: CHROME, ink: OUT_IN, shadow: CHROME_SH, shadowOffset: [-2.4, -2.2], gloss: [{ x: 36, y: 2, rx: 4.5, ry: 1.3, rot: 0.15, alpha: 0.9 }] });
  ctx.restore();
}

function bagFace(ctx: Ctx, p: BagPose) {
  const fx = 8, fy = -64;
  const lo = p.eyes === 'wide' ? 0.06 : p.eyes === 'slit' ? 0.32 : 0.2;
  const li = p.eyes === 'wide' ? 0.1 : p.eyes === 'slit' ? 0.82 : 0.56;
  const look: Pt = p.look;
  lidEye(ctx, fx - 18, fy, 12, { side: -1, lidOuter: lo, lidInner: li, look, iris: '#3f86d8', pupil: 0.32, lidColor: BAG_SH, ink: 2.4 });
  lidEye(ctx, fx + 18, fy - 1, 13, { side: 1, lidOuter: lo, lidInner: li, look, iris: '#3f86d8', pupil: 0.32, lidColor: BAG_SH, ink: 2.4 });
  const ba = p.eyes === 'wide' ? 0.08 : p.mouth === 'roar' ? 0.6 : 0.46;
  brow(ctx, fx - 19, fy - 18 + (p.mouth === 'roar' ? 2 : 0), 20, ba, 5.8);
  brow(ctx, fx + 19, fy - 20 + (p.mouth === 'roar' ? 2 : 0), 22, -ba, 5.8);
  const my = fy + 34;
  if (p.mouth === 'roar') {
    // a furious bellow, fangs bared, spitting grated cheese
    const maw = (c: Ctx) => {
      c.moveTo(fx - 24, my - 6);
      c.quadraticCurveTo(fx + 2, my - 13, fx + 28, my - 7);
      c.quadraticCurveTo(fx + 30, my + 12, fx + 18, my + 23);
      c.quadraticCurveTo(fx + 2, my + 28, fx - 14, my + 22);
      c.quadraticCurveTo(fx - 26, my + 12, fx - 24, my - 6);
      c.closePath();
    };
    shape(ctx, maw, { fill: '#4a0f18', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, maw, () => {
      fillPath(ctx, (c) => ellipsePath(c, fx + 4, my + 23, 15, 7), '#d8505e');
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.moveTo(fx - 28, my - 16);
      ctx.lineTo(fx + 32, my - 16);
      ctx.lineTo(fx + 32, my - 3);
      for (let i = 0; i <= 10; i++) ctx.lineTo(fx + 32 - i * 6, my - 3 + (i % 2 ? 4.5 : 0));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - 28, my + 32);
      ctx.lineTo(fx + 32, my + 32);
      ctx.lineTo(fx + 32, my + 21);
      for (let i = 0; i <= 10; i++) ctx.lineTo(fx + 32 - i * 6, my + 21 - (i % 2 ? 4 : 0));
      ctx.closePath();
      ctx.fill();
      // a mouthful of grated cheese being spat out
      shreds(ctx, fx + 6, my + 9, 12, 5, 18, 5, 2.2);
    });
    return;
  }
  const open = p.mouth === 'clench' ? 0.45 : 1;
  const gp = (c: Ctx) => {
    c.moveTo(fx - 26, my - 6);
    c.quadraticCurveTo(fx, my + 2, fx + 30, my - 10);
    c.quadraticCurveTo(fx + 24, my + 6 + 12 * open, fx + 2, my + 8 + 12 * open);
    c.quadraticCurveTo(fx - 18, my + 6 + 10 * open, fx - 26, my - 6);
    c.closePath();
  };
  shape(ctx, gp, { fill: '#4a0f18', ink: OUT_IN, shadow: 'none' });
  clipTo(ctx, gp, () => {
    fillPath(ctx, (c) => ellipsePath(c, fx + 6, my + 14 + 9 * open, 14, 7), '#d8505e');
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(fx - 30, my - 10);
    ctx.quadraticCurveTo(fx, my - 2, fx + 34, my - 14);
    ctx.lineTo(fx + 34, my - 4);
    ctx.quadraticCurveTo(fx, my + 7, fx - 30, my);
    ctx.closePath();
    ctx.fill();
    if (p.mouth === 'clench') fillPath(ctx, (c) => c.rect(fx - 30, my + 6, 64, 20), '#fff8ea');
    for (let i = -2; i <= 3; i++) {
      line(ctx, [[fx + i * 9, my - 9], [fx + i * 9 + 0.3, my + 1]], 0.9, '#b8987e');
      if (p.mouth === 'clench') line(ctx, [[fx + i * 9 + 4, my + 7], [fx + i * 9 + 4, my + 16]], 0.9, '#b8987e');
    }
  });
  // cheese crumbs stuck on the lip
  flakes(ctx, [[fx - 18, my + 3, 2.2], [fx + 22, my - 2, 1.8]]);
}

function sneaker(ctx: Ctx, x: number, y: number, side: number) {
  S(ctx, (c) => {
    c.moveTo(x - 10, y + 1);
    c.quadraticCurveTo(x - 10, y - 8, x - 1, y - 8);
    c.quadraticCurveTo(x + 6, y - 8, x + 12, y - 2);
    c.quadraticCurveTo(x + 13, y + 1, x + 10, y + 1.5);
    c.closePath();
  }, { fill: '#fbf8f0', ink: OUT_IN, shadow: '#cfcabd', shadowOffset: [-1.6, -1.6], gloss: [{ x: x - 4, y: y - 5.4, rx: 2.4, ry: 1, alpha: 0.6 }] });
  line(ctx, [[x - 3, y - 6], [x + 5, y - 2]], 1.8, side < 0 ? IT_GREEN : IT_RED);
  line(ctx, [[x - 10, y + 0.5], [x + 11, y + 0.5]], 2, '#6a6070', false, 0.9);
}

function drawGrattugiato(ctx: Ctx, p: BagPose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = 60;

  stompLegs(ctx, 0, 34 + p.crouch, FOOT, f, {
    spread: 27, thick: 11, color: LEGS, shade: '#241f29', stride: 7, lift: 7,
    shoe: (x, y, side) => sneaker(ctx, x, y, side),
  });

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean);
  ctx.translate(0, p.crouch - p.bob * 3);
  // inflate from the bottom (wind-up puff) + the step squash & stretch
  const sq = (p.bob - 0.5) * 0.05;
  ctx.translate(0, 40);
  ctx.scale(1 + p.puff * 0.04 - sq, 1 - p.puff * 0.05 + sq);
  ctx.translate(0, -40);

  const sw = Math.sin(ph) * 3.5;
  // ---- back arm (left)
  if (p.arms === 'walk') {
    limb(ctx, [[-63, -18], [-77, -8 + sw], [-77, 6 + sw]], 9, BAG, OUT_IN, BAG_SH);
    fist(ctx, -77, 10 + sw, 8.5, 1.8, { cuff: IT_GREEN, ink: OUT_IN });
  } else if (p.arms === 'up') {
    limb(ctx, [[-61, -30], [-75, -46], [-69, -70]], 9, BAG, OUT_IN, BAG_SH);
    fist(ctx, -69, -74, 8.5, -1.6, { cuff: IT_GREEN, ink: OUT_IN });
  } else {
    limb(ctx, [[-63, -24], [-77, -30], [-77, -50]], 9, BAG, OUT_IN, BAG_SH);
    fist(ctx, -77, -54, 8.5, -2, { cuff: IT_GREEN, ink: OUT_IN });
  }

  // ---- the bag
  const body = (c: Ctx) => bagPath(c, p.puff);
  shape(ctx, body, { fill: BAG, ink: OUT, shadow: 'none' });
  clipTo(ctx, body, () => {
    // crimped heat-seal band with a hang hole
    fillPath(ctx, (c) => c.rect(-90, -150, 180, 26), '#ebe4d2');
    for (let x = -54; x <= 56; x += 4) line(ctx, [[x, -146], [x, -127]], 1.1, BAG_SH, false, 0.9);
    line(ctx, [[-70, -124], [70, -124]], 2.2, BAG_DK, false, 0.8);
    S(ctx, (c) => roundRectPath(c, -11, -142, 22, 8, 4), { fill: '#5b4a3f', ink: OUT_S, shadow: 'none' });
    // the fake-Italian tricolour ribbon sweeping across (it ripples as it walks)
    const rip = Math.sin(ph) * 2;
    const band = (y0: number, col: string) => {
      fillPath(ctx, (c) => {
        c.moveTo(-90, y0 + 10);
        c.bezierCurveTo(-40, y0 - 10 + rip, 20, y0 + 14 - rip, 90, y0 - 8);
        c.lineTo(90, y0 - 1);
        c.bezierCurveTo(20, y0 + 21 - rip, -40, y0 - 3 + rip, -90, y0 + 17);
        c.closePath();
      }, col);
    };
    band(-116, IT_GREEN);
    band(-109, '#ffffff');
    band(-102, IT_RED);
    // the printed navy lower panel with a gold pinstripe
    const panel = (c: Ctx) => {
      c.moveTo(-90, -14);
      c.bezierCurveTo(-40, -26, 30, -2, 90, -20);
      c.lineTo(90, 60);
      c.lineTo(-90, 60);
      c.closePath();
    };
    fillPath(ctx, panel, NAVY);
    strokePath(ctx, (c) => { c.moveTo(-90, -14); c.bezierCurveTo(-40, -26, 30, -2, 90, -20); }, GOLD, 2.6);
    strokePath(ctx, (c) => { c.moveTo(-90, -9); c.bezierCurveTo(-40, -21, 30, 3, 90, -15); }, NAVY_HI, 1.4, 0.9);
    // bottom gusset: the folded base of a stand-up pouch
    fillPath(ctx, (c) => { c.moveTo(-90, 34); c.quadraticCurveTo(0, 22, 90, 34); c.lineTo(90, 60); c.lineTo(-90, 60); c.closePath(); }, NAVY_SH);
    strokePath(ctx, (c) => { c.moveTo(-90, 34); c.quadraticCurveTo(0, 22, 90, 34); }, NAVY_HI, 1.4, 0.8);
    // window onto the cheese (belly)
    const win = (c: Ctx) => {
      c.moveTo(-50, 0);
      c.quadraticCurveTo(-52, -6, -40, -7);
      c.quadraticCurveTo(0, -1, 38, -9);
      c.quadraticCurveTo(52, -10, 52, 2);
      c.quadraticCurveTo(54, 24, 38, 28);
      c.quadraticCurveTo(0, 32, -38, 28);
      c.quadraticCurveTo(-53, 24, -50, 0);
      c.closePath();
    };
    S(ctx, win, { fill: CHEESE, ink: OUT_IN, shadow: CHEESE_SH, shadowOffset: [-6, -5] });
    clipTo(ctx, win, () => {
      shreds(ctx, 2, 12, 56, 26, 260, 99, 2.6);
      // the cheese settles as it walks
      fillPath(ctx, (c) => ellipsePath(c, 6, 30 - p.bob * 2, 50, 8), CHEESE_SH, 0.5);
      // plastic sheen over the window
      fillPath(ctx, (c) => polyPath(c, [[-44, 30], [-26, -10], [-17, -10], [-35, 30]]), '#ffffff', 0.3);
    });
    // printed cheese wedge (with holes: definitely not Parmigiano)
    const wx = -30, wy = 14;
    const wedge = (c: Ctx) => { c.moveTo(wx - 12, wy + 7); c.lineTo(wx + 13, wy + 7); c.lineTo(wx + 13, wy - 4); c.lineTo(wx - 12, wy - 2); c.closePath(); };
    const top = (c: Ctx) => { c.moveTo(wx - 12, wy - 2); c.lineTo(wx + 13, wy - 4); c.lineTo(wx + 5, wy - 11); c.closePath(); };
    S(ctx, wedge, { fill: '#ffd23a', ink: 1.6, shadow: '#e09a1a', shadowOffset: [-1.4, -1.2] });
    S(ctx, top, { fill: '#ffe680', ink: 1.6, shadow: 'none' });
    fillPath(ctx, (c) => { circlePath(c, wx - 4, wy + 2.5, 1.9); circlePath(c, wx + 6, wy + 1, 1.5); circlePath(c, wx + 3, wy - 5.5, 1.2); }, '#d88a12');
    // side gusset fold on the shadow side
    strokePath(ctx, (c) => { c.moveTo(56, -100); c.quadraticCurveTo(66, -40, 62, 34); }, BAG_DK, 1.8, 0.55);
    // cel shading of the plastic: a real crescent on the lower right, darker at the very edge
    shadeOver(ctx, body, '#5c5f80', [-15, -9], 0.36);
    shadeOver(ctx, body, '#2b2c45', [-30, -16], 0.24);
    // crinkles in the plastic (a dark crease with a bright edge)
    const crease = (pts: Pt[]) => {
      line(ctx, pts, 1.7, BAG_DK, true, 0.85);
      line(ctx, pts.map(([x, y]) => [x - 1.4, y - 1.2] as Pt), 1.1, '#ffffff', true, 0.8);
    };
    crease([[-58, -94], [-47, -86], [-52, -76]]);
    crease([[54, -66], [45, -56], [52, -46]]);
    crease([[-62, -36], [-55, -30], [-60, -22]]);
    crease([[30, -118], [24, -112], [28, -104]]);
    // big plastic gloss streaks (upper left)
    fillPath(ctx, (c) => polyPath(c, [[-59, -40], [-50, -118], [-43, -118], [-52, -40]]), '#ffffff', 0.6);
    fillPath(ctx, (c) => polyPath(c, [[-41, -96], [-38, -118], [-34, -118], [-37, -96]]), '#ffffff', 0.45);
    fillPath(ctx, (c) => ellipsePath(c, -46, -128, 7, 2, -0.1), '#ffffff', 0.7);
    // the dark inside of the tear
    fillPath(ctx, (c) => polyPath(c, [[22, -146], [27, -141], [32, -144], [36, -136], [41, -139], [45, -130], [50, -131], [53, -122], [58, -116], [47, -122], [36, -128], [25, -138]]), '#6b6050', 0.9);
  });

  // ---- cheese heap bursting out of the torn corner + flakes falling
  const sp = p.spill;
  const heave = Math.sin(ph) * 1.2;
  cheeseHeap(ctx, [[30, -140 - sp * 4 - heave, 7 + sp * 2], [40, -134 - sp * 3, 8 + sp * 3], [49, -126, 7 + sp * 2], [55, -118, 5 + sp], [43, -142 - sp * 6 - heave, 5 + sp * 2]], 17);
  // crumbs tumbling down the side, a new one every step
  const fall = (f % 4) * 9;
  flakes(ctx, [[61, -108 + fall, 2.6], [66 - fall * 0.1, -90 + fall, 2.2], [60 + fall * 0.15, -74 + fall * 0.8, 2.4], [68, -118 + fall * 1.2, 1.8]]);
  // torn plastic flap, fluttering
  const fl = Math.sin(ph * 2) * 3;
  S(ctx, (c) => polyPath(c, [[53, -124], [67, -119 + fl], [64, -106 + fl * 1.2], [58, -116]]), { fill: '#ebe4d2', ink: OUT_S + 0.3, shadow: BAG_SH, shadowOffset: [-1.4, -1.4] });

  // ---- face
  bagFace(ctx, p);

  // ---- front arm (right) with the scoop
  if (p.arms === 'walk') {
    const bobS = -sw;
    limb(ctx, [[63, -26], [74, -4 + bobS], [50, 14 + bobS]], 9, BAG, OUT_IN, BAG_SH);
    bigSpoon(ctx, 46, 16 + bobS, -0.62 + bobS * 0.03, true);
    fist(ctx, 46, 16 + bobS, 8.5, -0.62, { cuff: IT_RED, ink: OUT_IN });
    // a pinch of cheese dropping off the spoon
    flakes(ctx, [[70 + (f % 2) * 2, 30 + (f % 4) * 6 + bobS, 2]]);
  } else if (p.arms === 'up') {
    limb(ctx, [[63, -30], [80, -48], [70, -70]], 9, BAG, OUT_IN, BAG_SH);
    bigSpoon(ctx, 68, -74, -2.45, true, true);
    fist(ctx, 68, -74, 8.5, -1.5, { cuff: IT_RED, ink: OUT_IN });
  } else {
    limb(ctx, [[63, -24], [74, -20], [56, -6]], 9, BAG, OUT_IN, BAG_SH);
    bigSpoon(ctx, 52, -6, -0.82, false, false, 0.72);
    fist(ctx, 52, -6, 8.5, -0.82, { cuff: IT_RED, ink: OUT_IN });
  }
  ctx.restore();
}

const BAG_IDLE = (f: number): BagPose => ({
  f, crouch: 0, puff: 0, lean: Math.sin(phase(f)) * 0.028, eyes: 'angry', mouth: 'grin', arms: 'walk', spill: 0,
  look: [0.3 + Math.sin(phase(f)) * 0.08, 0.2], bob: (1 - Math.cos(phase(f) * 2)) / 2,
});

registerBoss('grattugiato', 200, 226, 100, 160, (ctx, f, pose: Pose) => {
  if (pose === 'idle') return drawGrattugiato(ctx, BAG_IDLE(f));
  if (pose === 'windup') {
    // puffs up, scoop raised high, cheese welling out of the tear
    drawGrattugiato(ctx, { f: 1, crouch: 5, puff: 1, lean: -0.04, eyes: 'slit', mouth: 'clench', arms: 'up', spill: 0.6, look: [0.3, 0.2], bob: 0.5 });
    for (const s of [-1, 1]) {
      line(ctx, [[s * 84 + 4, -110], [s * 89 + 4, -102], [s * 84 + 4, -94]], 2.4, '#ffffff', false, 0.85);
    }
    return;
  }
  // attack: "ABBONDANTE!" it bellows and the scoop flings a spray of cheese forward, the tear bursts
  drawGrattugiato(ctx, { f: 2, crouch: -2, puff: 0.4, lean: 0.06, eyes: 'angry', mouth: 'roar', arms: 'throw', spill: 1, look: [0.45, 0.1], bob: 0.5 });
  cheeseHeap(ctx, [[80, -50, 6.5], [86, -40, 5.5], [76, -38, 5], [87, -56, 3.6]], 23);
  flakes(ctx, [[90, -68, 2.6], [91, -26, 2.2], [74, -64, 2], [56, -150, 2.4], [70, -148, 2], [80, -136, 2.4]]);
  burstLines(ctx, 72, -38, 12, 18, 5, '#ffffff', 2.2, 4, -1.4, 0.7, 0.85);
});

// ===========================================================================
// projectiles (DANGER style: hot rim + red glow, pointing right)
// ===========================================================================

danger('proj.e_meatball', 12, (ctx) => {
  // sauce trail behind
  shape(ctx, (c) => { ellipsePath(c, -4.5, 1.2, 3.4, 2.2, 0.1); circlePath(c, -8.2, 1.8, 1.2); }, { fill: RAGU, ink: 0.9, shadow: 'none' });
  shape(ctx, (c) => circlePath(c, 0.5, 0, 6.2), { fill: MEATB, ink: 1.3, shadow: '#4f1e0e', shadowOffset: [-1.6, -1.8] });
  clipTo(ctx, (c) => circlePath(c, 0.5, 0, 6.2), () => {
    speckle(ctx, 0.5, 0.5, 5, 5, 9, '#b8703e', 0.8, 12, 0.85);
    speckle(ctx, 0.5, 0.5, 5, 5, 6, '#3e140a', 0.6, 13, 0.8);
  });
  // ragù cap with a drip
  shape(ctx, (c) => {
    c.moveTo(-4.8, -2.4);
    c.quadraticCurveTo(-2, -7.4, 3.6, -5.6);
    c.quadraticCurveTo(6.6, -4.2, 6, -1.2);
    c.quadraticCurveTo(4.6, -1.8, 4, -0.6);
    c.quadraticCurveTo(3.4, 1.6, 2.4, -0.8);
    c.quadraticCurveTo(-1, -1.4, -4.8, -2.4);
    c.closePath();
  }, { fill: '#d23a1e', ink: 1, shadow: RAGU_SH, shadowOffset: [-0.6, -0.6] });
  glint(ctx, -1.4, -4.6, 1.5, 0.6, -0.4, 0.9);
  speckle(ctx, 1, -4, 2.6, 0.9, 3, '#fff8de', 0.45, 3);
});

danger('proj.e_pesto', 12, (ctx) => {
  // splash droplets trailing behind
  shape(ctx, (c) => { circlePath(c, -6.8, 2.4, 1.4); circlePath(c, -7.6, -2.2, 1.0); }, { fill: '#7fbf3c', ink: 0.8, shadow: 'none' });
  sauceBlob(ctx, 6.2, '#8fcb48', '#3f7a24', 17, 1.2);
  // cream swirl folded through the sludge
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const a = t * Math.PI * 1.8 + 0.4;
    const d = 0.8 + t * 3.4;
    const x = Math.cos(a) * d + 0.6, y = Math.sin(a) * d + 0.6;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(247,242,218,0.85)';
  ctx.stroke();
  ctx.restore();
  // a cashew chunk riding on it
  cashew(ctx, 2.6, 2.4, 2.2, 0.6);
  glint(ctx, -2.4, -3, 1.5, 0.8, -0.7, 0.95);
});

danger('proj.e_cheese', 12, (ctx) => {
  // trailing flakes
  flakes(ctx, [[-7.2, 2.6, 1.3], [-6.6, -3, 1.0]]);
  cheeseHeap(ctx, [[-1.6, 0.6, 4.2], [2.2, -1.8, 4], [2.6, 2.6, 3.6], [-0.4, -3.2, 3]], 7, 1.1);
  // sparkle of "snow"
  sparkle(ctx, 3.2, -3.4, 2.2, '#ffffff', 0.95);
});

// ===========================================================================
// fight effects (drawn by the boss patterns with run.fx.sprite)
// ===========================================================================

/**
 * fx.noodle_lash — 492×64, anchor (18,32) = the root of the whip; it lies along +x and is rotated
 * onto a lane. 4 frames played at 12 fps: 0 = the crack (taut, with a hot smear), 1–3 = the noodles
 * relax and wave as it fades. Length matches the lane (432 u + the last warning circle).
 */
defineSprite({
  id: 'fx.noodle_lash', w: 492, h: 64, ax: 18, ay: 32, frames: 4,
  draw: (ctx, f) => {
    const L = 450;
    const amp = [2.2, 4.5, 6.5, 8][f];
    const ph = f * 1.1;
    const strand = (k: number): Pt[] => {
      const pts: Pt[] = [];
      for (let i = 0; i <= 44; i++) {
        const t = i / 44, x = t * L;
        const taper = 1 - t * 0.45;
        const tw = Math.sin(t * 30 + k * 2.1 + ph) * 4.6 * taper; // the strands twist round each other
        const wave = Math.sin(t * 9 - ph * 1.6) * amp * Math.min(1, t * 4);
        const fray = t > 0.88 ? (t - 0.88) * 8.3 * (k - 1) * 9 : 0; // the tip frays apart
        pts.push([x, tw + wave + fray]);
      }
      return pts;
    };
    const ss = [strand(0), strand(1), strand(2)];
    if (f === 0) {
      // the crack: a hot smear along the whole lane
      line(ctx, ss[1], 30, '#fff3c4', true, 0.3);
      line(ctx, ss[1], 18, '#ffffff', true, 0.35);
    }
    const widths = ss[0].map((_, i) => 7 * (1 - (i / 44) * 0.5));
    const order = [0, 2, 1];
    for (const k of order) {
      const pts = ss[k];
      const b = (c: Ctx) => smoothPath(c, ribbon(pts, widths), true, 0.4);
      shape(ctx, b, { fill: k === 1 ? NOODLE : k === 0 ? '#f0c25e' : NOODLE, ink: 2, shadow: NOODLE_SH, shadowOffset: [0, -2.2] });
      line(ctx, pts.map(([x, y]) => [x, y - 1.3] as Pt), 1.4, NOODLE_HI, true, 0.9);
    }
    // ragù clinging to the whip
    const R = rng(404 + f);
    for (let i = 0; i < 9; i++) {
      const t = 0.06 + i * 0.1 + R() * 0.04;
      const [x, y] = ss[i % 3][Math.round(t * 44)];
      const r = 4 - t * 1.6;
      shape(ctx, (c) => { ellipsePath(c, x, y, r * 1.5, r, 0); if (i % 2) dripPath(c, x + 1, y + r * 0.5, r * 0.9, r * 2.4); }, { fill: RAGU, ink: 1.2, shadow: RAGU_SH, shadowOffset: [-0.6, -0.6] });
    }
    // sauce flung off it as it settles
    if (f > 0) {
      for (let i = 0; i < 7; i++) {
        const x = 40 + i * 58 + R() * 20, y = (R() < 0.5 ? -1 : 1) * (10 + f * 3 + R() * 6);
        shape(ctx, (c) => circlePath(c, x, y, 2.4 - f * 0.3), { fill: RAGU, ink: 1, shadow: 'none' });
      }
    } else {
      // crack sparks at the tip
      burstLines(ctx, L - 4, 0, 6, 16, 6, '#ffffff', 2.2, 7);
    }
  },
});

/** fx.cheese_flake — 16×16: a curl of grated cheese drifting down in a cheese cloud (3 frames = 3 shapes). */
defineSprite({
  id: 'fx.cheese_flake', w: 16, h: 16, frames: 3,
  draw: (ctx, f) => {
    const pts: Pt[][] = [
      [[-3.6, 1.4], [-1, -1.8], [1.6, -0.6], [3.4, -2.2]],
      [[-3, -1.6], [0.4, 1.6], [3, -0.4]],
      [[-3.2, 0.8], [-0.6, -1.2], [0.6, 1.4], [3.2, 0]],
    ];
    inkLine(ctx, pts[f], 2.2, f === 1 ? CHEESE_SH : CHEESE, true, 1);
    line(ctx, pts[f].map(([x, y]) => [x - 0.3, y - 0.5] as Pt), 0.7, '#fffbe6', true, 0.9);
  },
});

/**
 * fx.frullatore_heat — same box/anchor as boss.frullatore: an orange-red glow in the shape of the
 * blender, drawn ADDITIVELY over the boss every frame while it is overheated (enraged).
 */
defineSprite({
  id: 'fx.frullatore_heat', w: 170, h: 236, ax: 85, ay: 172,
  draw: (ctx) => {
    // halo on the floor and around the body
    softGlow(ctx, 0, -50, 84, '#ff2a0a', 0.6, 118);
    // the motor base glowing
    softGlow(ctx, 0, 12, 56, '#ff4a12', 0.9, 34);
    clipTo(ctx, (c) => roundRectPath(c, -48, -14, 96, 50, 8), () => {
      fillPath(ctx, (c) => c.rect(-50, -16, 100, 54), '#ff3a0e', 0.55);
      softGlow(ctx, -30, 26, 18, '#ffd34d', 0.8);
    });
    // the jar: hot glass rims + a red heat in the sludge
    clipTo(ctx, (c) => jarPath(c), () => {
      fillPath(ctx, (c) => c.rect(-60, JT - 10, 120, 140), '#e01800', 0.18);
      softGlow(ctx, 0, -60, 40, '#e01800', 0.25, 70);
      softGlow(ctx, 0, -30, 30, '#ffb02e', 0.8, 14); // white-hot blade
    });
    strokePath(ctx, (c) => jarPath(c), '#ff5a1a', 9, 0.55);
    strokePath(ctx, (c) => jarPath(c), '#ffb03a', 3.5, 0.9);
    strokePath(ctx, (c) => roundRectPath(c, -48, -150, 96, 13, 5), '#ff5a1a', 6, 0.6);
  },
});

