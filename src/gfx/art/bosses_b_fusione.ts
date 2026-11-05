/**
 * BOSS — IL MOSTRO DELLA FUSIONE (The Fusion Abomination). Radius 70. FINAL boss.
 *
 * Every crime fused into one chimera: the body is a whole stuffed-crust pizza (cheese
 * bursting from the crust) loaded with pineapple, ham, peas and ketchup zig-zags; it
 * glares with MANY eyes — two big ones, pepperoni-lidded ones, and one peering out of
 * a cappuccino cup sunk into the dough; a jagged crust maw strung with mozzarella.
 * It wears the Pineapple King's leaves and stolen gold crown, swings a ketchup-bottle
 * arm and a cream-carton arm on spaghetti sinews, struts on fried-chicken drumsticks,
 * and trails writhing spaghetti tentacles. Magenta "fusion" energy crackles at the seams.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, line, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath, speckle, rgba, shade,
} from '../painter';
import {
  OUT, OUT_IN, OUT_S, TAU, phase, S, clipTo, fillPath, strokePath, sparkle, softGlow, pivot, burstLines,
  dripPath, lidEye, pineappleCrown, goldCrown, ball, pineappleRing, steamWisp, swoosh,
} from './bosses_b_kit';

export const FUSIONE_R = 70;
const W = 300, H = 232, AX = 144, AY = 152;

const CRUST = '#e8a24c';
const CRUST_SH = '#b8682a';
const SAUCE = '#d8341e';
const SAUCE_SH = '#9e1f17';
const CHEESE = '#ffd95a';
const CHEESE_SH = '#f0a830';
const FUSE = '#ff3df0';
const FUSE_HI = '#ffc2fa';
const KETCHUP = '#e3231c';
const KETCHUP_SH = '#a3121a';
const NOODLE = '#ffe39a';
const NOODLE_SH = '#e0b25a';
const CHICKEN = '#d8892f';
const CHICKEN_SH = '#a0561c';
const BONE = '#fff3dc';
const BONE_SH = '#dcc6a0';

const PZ = { x: 0, y: -22, rx: 63, ry: 55 };

interface Pose {
  f: number;
  lean: number;
  mouth: 'grin' | 'clench' | 'roar';
  eyesWide: boolean;
  ketchupAng: number; // bottle angle (0 = nozzle straight up)
  ketchupJet: boolean;
  cartonAng: number;
  creamSplash: boolean;
  tentacleFlare: number; // -1 coiled .. 1 flared
  aura: number;
}

// ---------------------------------------------------------------------------
// parts
// ---------------------------------------------------------------------------

/** Crackling magenta fusion bolt between two points. */
function bolt(ctx: Ctx, a: Pt, b: Pt, seed: number, w = 2.2) {
  const pts: Pt[] = [a];
  let s = seed;
  const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const n = 5;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const off = (R() - 0.5) * L * 0.35;
    pts.push([a[0] + dx * t + (-dy / L) * off, a[1] + dy * t + (dx / L) * off]);
  }
  pts.push(b);
  line(ctx, pts, w + 3, FUSE, false, 0.45);
  line(ctx, pts, w, FUSE_HI, false, 1);
}

/** Twisted spaghetti sinew between two points. */
function sinew(ctx: Ctx, a: Pt, b: Pt, f: number, sag = 6) {
  const ph = phase(f);
  for (let k = 0; k < 3; k++) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * sag;
      const tw = Math.sin(t * Math.PI * 3 + k * 2.1 + ph) * 2.6;
      pts.push([x + tw * 0.3, y + tw]);
    }
    line(ctx, pts, 3.4 + OUT_S * 2, INK, true);
    line(ctx, pts, 3.4, k === 1 ? NOODLE_SH : NOODLE, true);
  }
}

/** A writhing spaghetti tentacle from (x,y) downward. */
function tentacle(ctx: Ctx, x: number, y: number, len: number, f: number, seed: number, flare: number, meatball: boolean) {
  const ph = phase(f);
  const pts: Pt[] = [];
  const n = 8;
  const dir = Math.sin(seed * 3.3) > 0 ? 1 : -1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const wave = Math.sin(t * 5 + ph + seed) * 4 * t;
    const out = flare * t * t * 18 * dir;
    const curl = t > 0.75 ? Math.sin((t - 0.75) * 12 + seed) * 3 : 0;
    pts.push([x + wave + out + curl * dir, y + t * len * (1 - Math.max(0, -flare) * 0.4) - Math.max(0, flare) * t * t * 10]);
  }
  // tapered: outline pass then fill pass, segment by segment
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const w0 = 6.4 - (i / n) * 3.8;
      const a = pts[i], b = pts[i + 1];
      line(ctx, [a, b], pass === 0 ? w0 + OUT_S * 2 : w0, pass === 0 ? INK : NOODLE, false);
    }
  }
  line(ctx, pts.slice(0, n - 1).map(([px, py]) => [px - 1.1, py - 0.4] as Pt), 1.4, '#fff6d2', true, 0.85);
  // a sauce blob riding on it
  const m = pts[Math.round(n * 0.45)];
  fillPath(ctx, (c) => ellipsePath(c, m[0] + 0.5, m[1], 3.4, 2.6), SAUCE, 0.95);
  if (meatball) {
    const e = pts[Math.round(n * 0.7)];
    ball(ctx, e[0], e[1], 5.4, '#8a4a2a', OUT_S);
    speckle(ctx, e[0], e[1], 3.6, 3.6, 5, '#5e2e18', 0.7, seed, 0.9);
  }
}

/** Fried-chicken drumstick leg: meat at the hip, bone down to a knobby foot. */
function drumstickLeg(ctx: Ctx, hx: number, hy: number, fx: number, fy: number, seed: number) {
  const ang = Math.atan2(fy - hy, fx - hx);
  // bone
  line(ctx, [[hx, hy + 14], [fx, fy - 6]], 8 + OUT_IN * 2, INK);
  line(ctx, [[hx, hy + 14], [fx, fy - 6]], 8, BONE);
  line(ctx, [[hx + 2, hy + 16], [fx + 2, fy - 7]], 2.4, BONE_SH, false, 0.9);
  // knobby bone end = foot
  ctx.save();
  ctx.translate(fx, fy - 4);
  S(ctx, (c) => { circlePath(c, -5, 0, 6); circlePath(c, 5.5, 0.5, 6.4); }, { fill: BONE, ink: OUT_IN, shadow: BONE_SH, shadowOffset: [-1.8, -1.8], gloss: [{ x: -6.6, y: -2, rx: 1.8, ry: 1.2, alpha: 0.85 }] });
  ctx.restore();
  // crispy fried meat
  ctx.save();
  ctx.translate(hx + (fx - hx) * 0.12, hy + 4);
  ctx.rotate(ang - Math.PI / 2);
  const meat = (c: Ctx) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const bump = 1 + Math.sin(i * 2.7 + seed) * 0.08;
      const rx = 14 * (a > 0 && a < Math.PI ? 0.85 + 0.15 * Math.cos(a) : 1);
      pts.push([Math.cos(a) * rx * bump, Math.sin(a) * 17 * bump * (Math.sin(a) > 0 ? 0.8 : 1.0)]);
    }
    smoothPath(c, pts, true);
  };
  S(ctx, meat, { fill: CHICKEN, ink: OUT_IN, shadow: CHICKEN_SH, shadowOffset: [-4, -3], gloss: [{ x: -5, y: -6, rx: 3, ry: 5, rot: 0.3, alpha: 0.35 }] });
  clipTo(ctx, meat, () => {
    speckle(ctx, 0, 0, 13, 17, 18, '#f4b45a', 1.7, seed, 0.9);
    speckle(ctx, 2, 3, 13, 17, 10, '#8a4416', 1.1, seed + 5, 0.6);
  });
  ctx.restore();
}

/** Ketchup squeeze bottle; local origin = base centre, nozzle along -y. */
function ketchupBottle(ctx: Ctx, f: number, squeeze: boolean) {
  const ph = phase(f);
  const sq = squeeze ? 1.12 : 1;
  const body = (c: Ctx) => {
    c.moveTo(-11 * sq, 0);
    c.quadraticCurveTo(-14 * sq, -14, -11 * sq, -22);
    c.quadraticCurveTo(-8.5, -28, -12 * sq, -36);
    c.quadraticCurveTo(-13 * sq, -44, -9, -48);
    c.lineTo(9, -48);
    c.quadraticCurveTo(13 * sq, -44, 12 * sq, -36);
    c.quadraticCurveTo(8.5, -28, 11 * sq, -22);
    c.quadraticCurveTo(14 * sq, -14, 11 * sq, 0);
    c.quadraticCurveTo(0, 3, -11 * sq, 0);
    c.closePath();
  };
  S(ctx, body, { fill: KETCHUP, ink: OUT_IN, shadow: KETCHUP_SH, shadowOffset: [-4, -2], gloss: [{ x: -6, y: -34, rx: 2.2, ry: 8, rot: 0.05, alpha: 0.75 }, { x: -6.5, y: -12, rx: 1.8, ry: 5, alpha: 0.55 }] });
  // blank label with a tomato
  S(ctx, (c) => roundRectPath(c, -8.5, -24, 17, 12, 3), { fill: '#fff6e8', ink: OUT_S, shadow: '#e6d6c0', shadowOffset: [-1.2, -1] });
  shape(ctx, (c) => circlePath(c, 0, -18, 3.6), { fill: '#ff4a32', ink: 1, shadowOffset: [-0.8, -0.8] });
  fillPath(ctx, (c) => ellipsePath(c, 0, -21.2, 2.2, 1, 0), '#3fb04b');
  // cap + nozzle
  S(ctx, (c) => roundRectPath(c, -9.5, -55, 19, 8, 3), { fill: '#fff6e8', ink: OUT_IN, shadow: '#d6c8b2', shadowOffset: [-1.6, -1.2] });
  S(ctx, (c) => {
    c.moveTo(-5, -55);
    c.lineTo(-1.8, -68);
    c.lineTo(1.8, -68);
    c.lineTo(5, -55);
    c.closePath();
  }, { fill: '#fff6e8', ink: OUT_S + 0.3, shadow: '#d6c8b2', shadowOffset: [-1, 0] });
  // ketchup glob on the tip (animated drip)
  S(ctx, (c) => { circlePath(c, 0, -69, 2.8); dripPath(c, 1.8, -68, 2.6, 7 + Math.sin(ph) * 3); }, { fill: KETCHUP, ink: OUT_S, shadow: 'none' });
}

/** Gable-top cream carton; local origin = base centre, spout up. */
function creamCarton(ctx: Ctx, f: number, splash: boolean) {
  const ph = phase(f);
  // front face
  S(ctx, (c) => roundRectPath(c, -12, -38, 22, 38, 2.5), { fill: '#fbfdff', ink: OUT_IN, shadow: '#cbd6e6', shadowOffset: [-3, -1.6] });
  // side face (darker)
  S(ctx, (c) => polyPath(c, [[10, -38], [17, -42], [17, -4], [10, 0]]), { fill: '#bfd0ea', ink: OUT_IN, shadow: 'none' });
  // gable roof
  S(ctx, (c) => polyPath(c, [[-12, -38], [-1, -50], [10, -38]]), { fill: '#e8f0fb', ink: OUT_IN, shadow: '#c3d1e6', shadowOffset: [-1.5, 0] });
  S(ctx, (c) => polyPath(c, [[10, -38], [-1, -50], [6, -54], [17, -42]]), { fill: '#a9bfe2', ink: OUT_IN, shadow: 'none' });
  // the open spout
  S(ctx, (c) => polyPath(c, [[-6, -45], [-12, -52], [-4, -54], [0, -48]]), { fill: '#ffffff', ink: OUT_S + 0.3, shadow: 'none' });
  // blue band + a cream-drop icon (no text)
  fillPath(ctx, (c) => c.rect(-12, -24, 22, 9), '#5a8de0');
  shape(ctx, (c) => { c.moveTo(-1, -23); c.quadraticCurveTo(3.5, -17.5, -1, -15.6); c.quadraticCurveTo(-5.5, -17.5, -1, -23); c.closePath(); }, { fill: '#ffffff', ink: 0, shadow: 'none' });
  fillPath(ctx, (c) => c.rect(-12, -9, 22, 2.4), '#5a8de0', 0.7);
  // cream pouring out of the spout
  if (splash) {
    for (const [dx, dy, r] of [[-16, -60, 4.6], [-22, -52, 3.4], [-12, -68, 3], [-26, -62, 2.4]] as [number, number, number][]) {
      S(ctx, (c) => circlePath(c, dx, dy, r), { fill: '#fffaf0', ink: OUT_S, shadow: '#e8dcc6', shadowOffset: [-0.8, -0.8] });
    }
  } else {
    S(ctx, (c) => {
      c.moveTo(-10, -53);
      c.quadraticCurveTo(-16, -52, -15, -44);
      dripPath(c, -15, -46, 4.4, 14 + Math.sin(ph + 1) * 4);
    }, { fill: '#fffaf0', ink: OUT_S, shadow: '#e8dcc6', shadowOffset: [-0.8, -0.8] });
  }
}

/** Pepperoni slice with an eye opening in it. */
function pepperoniEye(ctx: Ctx, x: number, y: number, r: number, open: number, look: Pt, glow: boolean) {
  const disc = (c: Ctx) => circlePath(c, x, y, r);
  S(ctx, disc, { fill: '#c0281e', ink: OUT_S + 0.3, shadow: '#8a1414', shadowOffset: [-r * 0.2, -r * 0.2] });
  speckle(ctx, x, y, r * 0.8, r * 0.8, 6, '#ff7a5a', r * 0.09, Math.round(x * 3 + y) & 255, 0.8);
  if (open > 0.05) {
    const eh = r * 0.62 * open;
    const eyeB = (c: Ctx) => {
      c.moveTo(x - r * 0.72, y);
      c.quadraticCurveTo(x, y - eh * 1.6, x + r * 0.72, y);
      c.quadraticCurveTo(x, y + eh * 1.6, x - r * 0.72, y);
      c.closePath();
    };
    if (glow) softGlow(ctx, x, y, r * 1.6, '#fff27a', 0.6);
    shape(ctx, eyeB, { fill: '#fff6b0', ink: 1.4, shadow: 'none' });
    clipTo(ctx, eyeB, () => {
      fillPath(ctx, (c) => ellipsePath(c, x + look[0] * r * 0.3, y + look[1] * r * 0.2, r * 0.17, r * 0.42), INK);
      fillPath(ctx, (c) => circlePath(c, x + look[0] * r * 0.3 - r * 0.12, y - r * 0.18, r * 0.1), '#ffffff');
    });
  } else {
    line(ctx, [[x - r * 0.7, y], [x, y + r * 0.18], [x + r * 0.7, y]], 1.6, INK, true);
  }
}

/** Cappuccino cup sunk into the dough, an eyeball peering out of the foam. */
function cupEye(ctx: Ctx, x: number, y: number, f: number, wide: boolean) {
  const blink = f === 3 && !wide;
  // cup body (tilted, only the top part visible above the sauce)
  S(ctx, (c) => {
    c.moveTo(x - 15, y - 3);
    c.quadraticCurveTo(x - 15, y + 11, x - 4, y + 14);
    c.lineTo(x + 6, y + 14);
    c.quadraticCurveTo(x + 16, y + 11, x + 15, y - 3);
    c.closePath();
  }, { fill: '#fff4e0', ink: OUT_IN, shadow: '#e1c9a6', shadowOffset: [-2.6, -2] });
  fillPath(ctx, (c) => c.rect(x - 15, y + 4, 30, 3), '#b9693c', 0.9);
  // handle
  strokePath(ctx, (c) => ctx.ellipse(x + 17, y + 4, 4, 4.4, 0, -1.6, 1.6), INK, 6);
  strokePath(ctx, (c) => ctx.ellipse(x + 17, y + 4, 4, 4.4, 0, -1.6, 1.6), '#fff4e0', 2.6);
  // foam rim
  S(ctx, (c) => ellipsePath(c, x, y - 3, 15, 5), { fill: '#fff8ea', ink: OUT_S + 0.3, shadow: '#e7cfac', shadowOffset: [-1, -1] });
  speckle(ctx, x + 2, y - 3.5, 11, 3, 8, '#7a4528', 0.55, 17, 0.7);
  // the eyeball rising out of the foam
  if (blink) {
    S(ctx, (c) => { c.moveTo(x - 8, y - 4); c.quadraticCurveTo(x, y - 14, x + 8, y - 4); c.closePath(); }, { fill: '#fff8ea', ink: OUT_S + 0.2, shadow: 'none' });
    line(ctx, [[x - 7, y - 6], [x, y - 4.6], [x + 7, y - 6]], 1.6, INK, true);
  } else {
    lidEye(ctx, x + 0.5, y - 12, 9.4, { side: 1, lidOuter: wide ? 0 : 0.1, lidInner: wide ? 0.08 : 0.3, look: [0.38, 0.32], iris: '#7a3fe8', pupil: 0.22, lidColor: '#c98a5a', ink: 2, glow: wide ? '#fff27a' : undefined });
    // bloodshot veins
    line(ctx, [[x - 8.4, y - 9], [x - 5.6, y - 10.4], [x - 4.6, y - 9.2]], 0.8, '#e8455e', true, 0.85);
    line(ctx, [[x + 8.6, y - 8.6], [x + 6.4, y - 9.6]], 0.8, '#e8455e', false, 0.85);
    // foam lip over the bottom of the eyeball
    S(ctx, (c) => { circlePath(c, x - 8, y - 2.4, 3.2); circlePath(c, x - 1, y - 1.6, 3.4); circlePath(c, x + 7, y - 2.4, 3.2); }, { fill: '#fff8ea', ink: OUT_S, shadow: '#e7cfac', shadowOffset: [-0.8, -0.8] });
  }
}

/** The jagged crust maw with mozzarella strings. */
function maw(ctx: Ctx, x: number, y: number, w: number, kind: Pose['mouth'], f: number) {
  const ph = phase(f);
  const open = kind === 'roar' ? 30 : kind === 'clench' ? 9 : 19;
  const sl = kind === 'grin' ? -5 : 0; // smirk slant (right corner higher)
  const top = (t: number) => y - 2 + Math.sin(t * Math.PI) * 3 + (t - 0.5) * sl * 2;
  const bot = (t: number) => y + open * (0.35 + Math.sin(t * Math.PI) * 0.65) + (t - 0.5) * sl;
  const m = (c: Ctx) => {
    c.moveTo(x - w / 2, top(0));
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      c.lineTo(x - w / 2 + t * w, top(t));
    }
    for (let i = 12; i >= 0; i--) {
      const t = i / 12;
      c.lineTo(x - w / 2 + t * w, bot(t));
    }
    c.closePath();
  };
  shape(ctx, m, { fill: '#4a0d18', ink: OUT_IN + 0.4, shadow: 'none' });
  clipTo(ctx, m, () => {
    // throat glow
    softGlow(ctx, x + 2, y + open * 0.6, w * 0.4, FUSE, 0.55, open * 0.8);
    // tongue
    if (kind !== 'clench') {
      S(ctx, (c) => ellipsePath(c, x + 6, bot(0.55) - 2, w * 0.2, 6), { fill: '#ff5a7a', ink: 1.6, shadow: '#d8344e', shadowOffset: [-1, -1] });
      line(ctx, [[x + 6, bot(0.55) - 7], [x + 6, bot(0.55) - 2]], 1.2, '#d8344e');
    }
    // mozzarella strings stretching between the jaws
    for (const [t, sw] of [[0.22, 0.6], [0.48, -0.8], [0.74, 0.5]] as [number, number][]) {
      const sx = x - w / 2 + t * w;
      const pts: Pt[] = [[sx, top(t) + 4], [sx + sw * 4 + Math.sin(ph + t * 6) * 1.5, (top(t) + bot(t)) / 2], [sx - sw * 2, bot(t) - 3]];
      line(ctx, pts, 3.4, '#fff3c8', true, 0.95);
      line(ctx, pts, 1.2, '#ffffff', true, 0.8);
    }
  });
  // crust teeth: top row down, bottom row up
  const teeth = (row: 'top' | 'bot') => {
    const n = row === 'top' ? 9 : 8;
    for (let i = 0; i < n; i++) {
      const t0 = (i + 0.1) / n, t1 = (i + 0.9) / n, tm = (i + 0.5) / n;
      const len = (row === 'top' ? 9 : 7.5) * (0.75 + (i % 3 === 1 ? 0.45 : 0.15)) * (kind === 'clench' ? 0.65 : 1);
      const yb0 = row === 'top' ? top(t0) : bot(t0), yb1 = row === 'top' ? top(t1) : bot(t1), ybm = row === 'top' ? top(tm) : bot(tm);
      const dir = row === 'top' ? 1 : -1;
      shape(ctx, (c) => {
        c.moveTo(x - w / 2 + t0 * w, yb0 - dir * 1.5);
        c.lineTo(x - w / 2 + t1 * w, yb1 - dir * 1.5);
        c.lineTo(x - w / 2 + tm * w + dir * 0.8, ybm + dir * len);
        c.closePath();
      }, { fill: '#fff4dc', ink: 1.5, shadow: '#e6cfa0', shadowOffset: [-1, -0.8] });
    }
  };
  teeth('top');
  teeth('bot');
}

// ---------------------------------------------------------------------------
// assembly
// ---------------------------------------------------------------------------

const pizzaPath = (c: Ctx) => ellipsePath(c, PZ.x, PZ.y, PZ.rx, PZ.ry);

function drawFusione(ctx: Ctx, p: Pose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = FUSIONE_R;

  // ---- fusion aura
  softGlow(ctx, 0, -26, 124, FUSE, 0.3 + p.aura * 0.32, 112);

  // ---- spaghetti tentacles (behind the legs)
  const tents: [number, number, number, boolean][] = [[-44, 12, 32, true], [-26, 24, 28, false], [-6, 30, 24, true], [12, 30, 24, false], [30, 24, 28, true], [48, 10, 32, false]];
  tents.forEach(([tx, ty, len, mb], i) => tentacle(ctx, tx, ty, len, f, i * 1.7 + 0.4, p.tentacleFlare, mb));

  // ---- chicken drumstick legs
  for (const side of [-1, 1]) {
    const pp = ph + (side < 0 ? 0 : Math.PI);
    const lift = Math.max(0, -Math.cos(pp)) * 7;
    const fx = side * 34 + Math.sin(pp) * 8;
    drumstickLeg(ctx, side * 28, 36, fx, FOOT - lift, side > 0 ? 3 : 7);
  }

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean);
  // the upper body is drawn 8% larger than the layout numbers: the final boss must loom
  ctx.translate(PZ.x, PZ.y);
  ctx.scale(1.08, 1.08);
  ctx.translate(-PZ.x, -PZ.y);

  // ---- cream-carton arm (back, left)
  const cA: Pt = [-58, -22], cB: Pt = [-78, -30];
  sinew(ctx, cA, cB, f, 5);
  ctx.save();
  ctx.translate(-84, -28);
  ctx.rotate(p.cartonAng);
  creamCarton(ctx, f, p.creamSplash);
  ctx.restore();
  bolt(ctx, [-60, -28], [-76, -36], 11 + f * 7);

  // ---- grafted-on pineapple tuft (lopsided, sprouting from the upper-left crust)
  ctx.save();
  ctx.translate(-22, PZ.y - PZ.ry + 12);
  ctx.rotate(-0.42);
  pineappleCrown(ctx, 0, 0, 0.74, f, { spread: 0.62 + p.aura * 0.1, flare: p.tentacleFlare > 0 ? 0.7 : 0, lite: true });
  ctx.restore();
  // wild spaghetti hair sprouting from the top
  for (const [hx, ang, len, k] of [[8, -1.75, 26, 0], [20, -1.35, 22, 1], [-4, -2.05, 20, 2]] as [number, number, number, number][]) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const a = ang + Math.sin(t * 4 + ph + k * 2) * 0.35 * t;
      pts.push([hx + Math.cos(a) * len * t + Math.sin(t * 9 + k) * 2 * t, PZ.y - PZ.ry + 6 + Math.sin(a) * len * t]);
    }
    line(ctx, pts, 4.4 + OUT_S * 2, INK, true);
    line(ctx, pts, 4.4, NOODLE, true);
    const e = pts[6];
    // curl at the tip
    strokePath(ctx, (c) => ctx.arc(e[0] + 2.4, e[1], 2.6, Math.PI, Math.PI * 2.6), INK, 4.4 + OUT_S * 2);
    strokePath(ctx, (c) => ctx.arc(e[0] + 2.4, e[1], 2.6, Math.PI, Math.PI * 2.6), NOODLE, 4.4);
  }

  // ---- THE PIZZA BODY
  // stuffed crust ring
  S(ctx, pizzaPath, { fill: CRUST, ink: OUT, shadow: CRUST_SH, shadowOffset: [-8, -7], gloss: [{ x: -40, y: -50, rx: 12, ry: 4, rot: -0.7, alpha: 0.35 }] });
  speckle(ctx, PZ.x, PZ.y, PZ.rx - 3, PZ.ry - 3, 26, '#c87a34', 1.2, 3, 0.55);
  // crust cracks bursting with stuffed cheese
  for (const a of [-2.4, -1.1, 0.2, 1.3, 2.3, 3.0]) {
    const cx = PZ.x + Math.cos(a) * (PZ.rx - 5), cy = PZ.y + Math.sin(a) * (PZ.ry - 5);
    S(ctx, (c) => ellipsePath(c, cx, cy, 5.4, 3.6, a + Math.PI / 2), { fill: CHEESE, ink: OUT_S, shadow: CHEESE_SH, shadowOffset: [-1, -1] });
  }
  // a cheese drip oozing off the bottom crust
  S(ctx, (c) => dripPath(c, 18, PZ.y + PZ.ry - 4, 6, 10 + Math.sin(ph) * 3), { fill: CHEESE, ink: OUT_S, shadow: CHEESE_SH, shadowOffset: [-1, -1] });
  S(ctx, (c) => dripPath(c, -26, PZ.y + PZ.ry - 6, 5, 7 + Math.cos(ph) * 2.4), { fill: CHEESE, ink: OUT_S, shadow: CHEESE_SH, shadowOffset: [-1, -1] });
  // sauce + cheese surface
  const inner = (c: Ctx) => ellipsePath(c, PZ.x + 1, PZ.y + 1, PZ.rx - 12, PZ.ry - 11);
  S(ctx, inner, { fill: SAUCE, ink: OUT_S + 0.4, shadow: SAUCE_SH, shadowOffset: [-5, -5] });
  clipTo(ctx, inner, () => {
    ctx.translate(0, -8);
    // melted cheese continents
    for (const [cx, cy, rx, ry, rot] of [[-20, -48, 20, 9, -0.3], [26, -38, 18, 11, 0.4], [-36, -14, 12, 14, 0.2], [40, -6, 10, 13, -0.2], [-6, -8, 16, 8, 0]] as [number, number, number, number, number][]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      fillPath(ctx, (c) => {
        const pts: Pt[] = [];
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * TAU;
          const k = 1 + Math.sin(i * 2.3 + cx) * 0.18;
          pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
        }
        smoothPath(c, pts, true);
      }, CHEESE);
      fillPath(ctx, (c) => ellipsePath(c, -rx * 0.3, -ry * 0.3, rx * 0.35, ry * 0.25), '#fff2a8', 0.8);
      ctx.restore();
    }
    // ketchup zig-zag (crime on top of crime)
    line(ctx, [[-44, -30], [-34, -38], [-24, -28], [-14, -38], [-4, -28]], 3.2, KETCHUP_SH, false, 0.9);
    line(ctx, [[-44, -30], [-34, -38], [-24, -28], [-14, -38], [-4, -28]], 2, '#ff4a3a', false, 1);
    // cream drizzle
    line(ctx, [[8, -58], [20, -52], [32, -58], [44, -50]], 2.4, '#fffaf0', true, 0.95);
    // ham, pineapple, peas, chicken bits
    const R = (i: number) => Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
    for (let i = 0; i < 4; i++) {
      const hx = [-48, 10, 50, -30][i], hy = [-40, -24, -24, 18][i];
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(R(i) * 2);
      shape(ctx, (c) => roundRectPath(c, -4, -3.4, 8, 6.8, 1.4), { fill: '#f590a8', ink: 1.3, shadow: 'none' });
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) {
      const hx = [-2, 46, -52, 30][i], hy = [-60, -44, -8, 24][i];
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(R(i + 9) * 2);
      shape(ctx, (c) => polyPath(c, [[-4, -2.6], [4, -3], [3, 3], [-3, 2.8]]), { fill: '#fff07a', ink: 1.3, shadow: 'none' });
      ctx.restore();
    }
    for (let i = 0; i < 8; i++) {
      const px = -50 + R(i + 30) * 100, py = -62 + R(i + 50) * 90;
      if (Math.abs(px - 4) < 34 && py > -40 && py < 30) continue; // keep the face clear
      shape(ctx, (c) => circlePath(c, px, py, 2.2), { fill: '#6fd04a', ink: 0.9, shadow: 'none' });
      fillPath(ctx, (c) => circlePath(c, px - 0.7, py - 0.8, 0.7), '#ffffff', 0.85);
    }
  });
  // glistening grease highlight
  fillPath(ctx, (c) => ellipsePath(c, -18, -64, 9, 3.4, -0.3), '#ffffff', 0.3);

  // ---- fusion seam: crackling bolts across the crust
  bolt(ctx, [-58, -48], [-46, -64], 3 + f * 5, 1.6);
  bolt(ctx, [54, 6], [60, -14], 9 + f * 3, 1.6);

  // ---- EYES (many, glaring)
  const wide = p.eyesWide;
  ctx.save();
  ctx.translate(-36, -54);
  ctx.scale(1.3, 1.3);
  cupEye(ctx, 0, 0, f, wide);
  ctx.restore();
  pepperoniEye(ctx, 40, -56, 9, wide ? 1 : f === 1 ? 0 : 0.85, [0.4, 0.4], wide);
  pepperoniEye(ctx, -46, -8, 7.4, wide ? 1 : f === 2 ? 0 : 0.8, [0.6, 0.2], wide);
  pepperoniEye(ctx, 47, -20, 6.4, wide ? 1 : f === 0 ? 0.55 : 0.9, [0.5, 0.3], wide);
  // the two big main eyes (yellow, slit pupils, furious lids of sauce)
  const ey = -31;
  for (const [ex, side] of [[-8, -1], [23, 1]] as [number, number][]) {
    lidEye(ctx, ex, ey, 13, {
      side, lidOuter: wide ? 0.08 : 0.24, lidInner: wide ? 0.3 : 0.56, look: [0.32, 0.22], iris: '#ffd21e', pupil: 0.3,
      lidColor: SAUCE_SH, ink: 2.6, slit: true, glow: wide ? '#fff27a' : undefined,
    });
  }
  // brows of burnt crust
  line(ctx, [[-23, -50], [-10, -48], [3, -41]], 6.6, INK, true);
  line(ctx, [[-23, -50], [-10, -48], [3, -41]], 3.4, '#7a3a16', true);
  line(ctx, [[12, -41], [25, -48], [38, -50]], 6.6, INK, true);
  line(ctx, [[12, -41], [25, -48], [38, -50]], 3.4, '#7a3a16', true);

  // ---- the maw
  maw(ctx, 8, -1, 76, p.mouth, f);

  // ---- ketchup-bottle arm (front, right)
  const kA: Pt = [56, -26], kB: Pt = [72, -32];
  sinew(ctx, kA, kB, f + 2, 5);
  ctx.save();
  ctx.translate(78, -30);
  ctx.rotate(p.ketchupAng);
  ctx.scale(0.92, 0.92);
  if (p.ketchupJet) {
    // the jet: a thick ketchup stream out of the nozzle
    const jet: Pt[] = [[0, -70], [3, -80], [1, -90], [4, -98]];
    line(ctx, jet, 9 + OUT_S * 2, INK, true);
    line(ctx, jet, 9, KETCHUP, true);
    line(ctx, jet.map(([x, y]) => [x - 2, y] as Pt), 2.4, '#ff8a7a', true, 0.9);
    for (const [dx, dy, r] of [[-7, -96, 3.4], [11, -92, 2.6], [-5, -86, 2.2], [9, -103, 3]] as [number, number, number][]) {
      S(ctx, (c) => circlePath(c, dx, dy, r), { fill: KETCHUP, ink: OUT_S, shadow: 'none' });
    }
  }
  ketchupBottle(ctx, f, p.ketchupJet);
  ctx.restore();
  bolt(ctx, [58, -32], [74, -40], 5 + f * 11);

  // ---- front tentacles curling out from under the crust
  tentacle(ctx, -52, 10, 26, f + 1, 9.1, p.tentacleFlare * 1.2, false);
  tentacle(ctx, 54, 8, 26, f + 3, 2.2, p.tentacleFlare * 1.2, false);

  // ---- the stolen gold crown, jammed askew on the right side of the crust
  goldCrown(ctx, 30 + Math.sin(ph) * 1.2, PZ.y - PZ.ry + 9 + Math.cos(ph * 2) * 1.2, 1.05, 0.52 + Math.sin(ph) * 0.05, f);

  // ---- fusion sparks
  const sp = [[-72, -70], [70, -80], [-66, 24], [72, 26]];
  for (let i = 0; i < 4; i++) {
    const k = (i + f) % 4;
    sparkle(ctx, sp[k][0], sp[k][1], 4 + (i % 2) * 2 + p.aura * 2, i % 2 ? FUSE_HI : '#ffffff', 0.9, 0.18);
  }
  ctx.restore();
}

const WALK = (f: number): Pose => {
  const ph = phase(f);
  return {
    f, lean: 0, mouth: 'grin', eyesWide: false, ketchupAng: 0.42 + Math.sin(ph) * 0.08, ketchupJet: false,
    cartonAng: -0.32 - Math.sin(ph) * 0.08, creamSplash: false, tentacleFlare: 0, aura: 0,
  };
};

defineSprite({ id: 'boss.fusione', w: W, h: H, ax: AX, ay: AY, frames: 4, flash: true, draw: (ctx, f) => drawFusione(ctx, WALK(f)) });

defineSprite({
  id: 'boss.fusione.attack', w: W, h: H, ax: AX, ay: AY, frames: 2, flash: true,
  draw: (ctx, f) => {
    if (f === 0) {
      // wind-up: every eye snaps open, jaws clenched, bottle cocked, tentacles coil, aura surges
      drawFusione(ctx, {
        f: 0, lean: -0.05, mouth: 'clench', eyesWide: true, ketchupAng: 0.08, ketchupJet: false,
        cartonAng: -0.44, creamSplash: false, tentacleFlare: -1, aura: 1,
      });
    } else {
      // attack: ROAR, ketchup jet, cream splash, tentacles flare
      drawFusione(ctx, {
        f: 2, lean: 0.04, mouth: 'roar', eyesWide: true, ketchupAng: 0.46, ketchupJet: true,
        cartonAng: -0.15, creamSplash: true, tentacleFlare: 1, aura: 1,
      });
    }
  },
});

void rgba; void shade; void burstLines; void pineappleRing; void steamWisp; void swoosh;
