/**
 * BOSS — IL RE ANANAS (The Pineapple King). Radius 60. Final boss of La Trattoria.
 *
 * Silhouette: golden armoured pineapple egg + towering fan of spiky leaves with a
 * tiny jaunty gold crown on top, royal red cape flaring at the sides, and a pizza-peel
 * sceptre carrying a slice of Hawaiian pizza. Arrogant grin, sunglasses pushed up,
 * a flower lei (it's a *Hawaiian* pizza, darling).
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, line, ellipsePath, circlePath, roundRectPath, smoothPath, brow, rgba, shade, speckle,
} from '../painter';
import {
  OUT, OUT_IN, OUT_S, TAU, phase, S, clipTo, fillPath, sparkle, fist, limb, swoosh, burstLines, softGlow, pivot,
  pineappleCrown, goldCrown, stompLegs, dripPath, ball, lidEye, pineappleRing,
} from './bosses_b_kit';

export const ANANAS_R = 60;
const W = 252, H = 232, AX = 98, AY = 162;

// palette
const GOLD = '#f6bd35';
const GOLD_MID = '#e59a24';
const GOLD_SH = '#c4721a';
const GROOVE = '#7a3f12';
const RED = '#d0223a';
const RED_SH = '#8f1328';
const RED_HI = '#ff5a6a';
const TRIM = '#ffc93a';
const ERMINE = '#fbf6ea';
const WOOD = '#d79a55';
const WOOD_SH = '#a8682f';
const BROW = '#2a4a1c';

const BODY = { cx: 0, cy: -6, rx: 50, ry: 52, k: 0.07 };

function eggPts(cx: number, cy: number, rx: number, ry: number, k: number, n = 32): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const s = Math.sin(t);
    pts.push([cx + Math.cos(t) * rx * (1 + k * s), cy + s * ry]);
  }
  return pts;
}
const bodyPath = (c: Ctx) => smoothPath(c, eggPts(BODY.cx, BODY.cy, BODY.rx, BODY.ry, BODY.k), true);

/** Ellipsoid projection used by the scale lattice. th = longitude, ph = latitude. */
function proj(th: number, ph: number): Pt {
  const { cx, cy, rx, ry, k } = BODY;
  const t = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, th));
  const p = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, ph));
  return [cx + rx * Math.cos(p) * Math.sin(t) * (1 + k * Math.sin(p)), cy + ry * Math.sin(p)];
}

/** Golden-armour pineapple skin: pillow-shaded diamond plates on a dark groove. */
const BANDS: [number, string, string][] = [
  [0.8, '#ffe47e', '#f6b938'],
  [0.5, '#fbc53e', '#e39c25'],
  [0.15, '#eba12b', '#c9791b'],
  [-0.2, '#cf8222', '#a65c15'],
  [-9, '#a35a18', '#7a3e0f'],
];
function pineappleSkin(ctx: Ctx) {
  const dTh = 0.47, hPh = 0.2;
  const L = [-0.52, -0.62, 0.58];
  const ln = Math.hypot(L[0], L[1], L[2]);
  const Lx = L[0] / ln, Ly = L[1] / ln, Lz = L[2] / ln;
  clipTo(ctx, bodyPath, () => {
    ctx.fillStyle = GROOVE;
    ctx.fillRect(-80, -80, 160, 160);
    for (let j = -9; j <= 9; j++) {
      const ph = j * hPh;
      for (let i = -5; i <= 5; i++) {
        const th = (i + (j & 1 ? 0.5 : 0)) * dTh;
        if (Math.abs(th) > Math.PI / 2 + dTh * 0.5 || Math.abs(ph) > Math.PI / 2 + hPh) continue;
        const nx = Math.cos(ph) * Math.sin(th), ny = Math.sin(ph), nz = Math.cos(ph) * Math.cos(th);
        const lam = nx * Lx + ny * Ly + nz * Lz;
        const band = BANDS.find((b) => lam > b[0])!;
        const ins = 0.84;
        const pL = proj(th - (dTh / 2) * ins, ph);
        const pT = proj(th, ph - hPh * ins);
        const pR = proj(th + (dTh / 2) * ins, ph);
        const pB = proj(th, ph + hPh * ins);
        const mid = (a: number, b: number, c2: number, d: number) => proj((a + c2) / 2, (b + d) / 2);
        const mLT = mid(th - (dTh / 2) * ins, ph, th, ph - hPh * ins);
        const mTR = mid(th, ph - hPh * ins, th + (dTh / 2) * ins, ph);
        const mRB = mid(th + (dTh / 2) * ins, ph, th, ph + hPh * ins);
        const mBL = mid(th, ph + hPh * ins, th - (dTh / 2) * ins, ph);
        const ctl = (m: Pt, a: Pt, b: Pt): Pt => [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
        const q1 = ctl(mLT, pL, pT), q2 = ctl(mTR, pT, pR), q3 = ctl(mRB, pR, pB), q4 = ctl(mBL, pB, pL);
        const plate = (c: Ctx) => {
          c.moveTo(pL[0], pL[1]);
          c.quadraticCurveTo(q1[0], q1[1], pT[0], pT[1]);
          c.quadraticCurveTo(q2[0], q2[1], pR[0], pR[1]);
          c.quadraticCurveTo(q3[0], q3[1], pB[0], pB[1]);
          c.quadraticCurveTo(q4[0], q4[1], pL[0], pL[1]);
          c.closePath();
        };
        const pw = Math.abs(pR[0] - pL[0]);
        clipTo(ctx, plate, () => {
          ctx.fillStyle = band[2];
          ctx.fillRect(pL[0] - 2, pT[1] - 2, pw + 4, pB[1] - pT[1] + 4);
          ctx.save();
          ctx.translate(-Math.min(2.2, pw * 0.16), -2.2);
          ctx.beginPath();
          plate(ctx);
          ctx.fillStyle = band[1];
          ctx.fill();
          ctx.restore();
          if (lam > 0.05) {
            const hx = (pL[0] + pT[0]) / 2 + pw * 0.08, hy = (pL[1] + pT[1]) / 2 + 1;
            fillPath(ctx, (c) => ellipsePath(c, hx, hy, Math.max(0.8, pw * 0.16), 1.4, -0.6), '#fffbe0', lam > 0.5 ? 0.85 : 0.5);
          }
        });
        // fruitlet barb near the bottom of the plate
        if (Math.cos(th) > 0.3) {
          const pc = proj(th, ph + hPh * 0.35);
          const sz = Math.max(0.7, Math.cos(th) * Math.cos(ph) * 2.2);
          fillPath(ctx, (c) => {
            c.moveTo(pc[0] - sz * 1.2, pc[1] + sz * 0.4);
            c.quadraticCurveTo(pc[0], pc[1] - sz * 1.8, pc[0] + sz * 1.2, pc[1] + sz * 0.4);
            c.quadraticCurveTo(pc[0], pc[1] - sz * 0.1, pc[0] - sz * 1.2, pc[1] + sz * 0.4);
            c.closePath();
          }, lam > 0.15 ? '#8a4612' : '#5e2c0a', 0.95);
        }
      }
    }
    // big armour sheen
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ellipsePath(ctx, -22, -28, 13, 24, 0.5);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ellipsePath(ctx, -27, -36, 4.5, 8.5, 0.5);
    ctx.fill();
    ctx.restore();
    // warm bounce light on the lower-right edge
    ctx.save();
    ctx.translate(5, 4);
    ctx.beginPath();
    bodyPath(ctx);
    ctx.lineWidth = 6;
    ctx.strokeStyle = rgba('#ff8a2a', 0.3);
    ctx.stroke();
    ctx.restore();
  });
}

/**
 * The armour lattice never animates, so it is painted once into an offscreen layer
 * (at 4 px/unit — sharper than the sprite cache) and blitted into every frame.
 */
let skinLayer: { c: HTMLCanvasElement; x: number; y: number; w: number; h: number } | null = null;
const SKIN_RES = 4;
function drawSkinLayer(ctx: Ctx) {
  if (!skinLayer) {
    const pad = 4;
    const w = BODY.rx * 2 * (1 + BODY.k) + pad * 2, h = BODY.ry * 2 + pad * 2;
    const x = BODY.cx - w / 2, y = BODY.cy - h / 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * SKIN_RES);
    c.height = Math.ceil(h * SKIN_RES);
    const g = c.getContext('2d')!;
    g.scale(SKIN_RES, SKIN_RES);
    g.translate(-x, -y);
    pineappleSkin(g);
    skinLayer = { c, x, y, w, h };
  }
  const L = skinLayer;
  ctx.drawImage(L.c, L.x, L.y, L.w, L.h);
}

/** Hibiscus flower for the lei. */
function hibiscus(ctx: Ctx, x: number, y: number, r: number, col: string, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  shape(ctx, (c) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      ellipsePath(c, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.55, r * 0.42, a);
    }
  }, { fill: col, ink: OUT_S * 0.9, shadow: 'none' });
  fillPath(ctx, (c) => ellipsePath(c, r * 0.25, r * 0.3, r * 0.75, r * 0.5, 0.6), shade(col, 0.2), 0.45);
  fillPath(ctx, (c) => circlePath(c, 0, 0, r * 0.3), shade(col, 0.45));
  fillPath(ctx, (c) => circlePath(c, r * 0.05, -r * 0.05, r * 0.14), '#ffe14a');
  ctx.restore();
}

/** Flower lei draped across the belly. */
function lei(ctx: Ctx, f: number) {
  const ph = phase(f);
  const bounce = Math.cos(ph * 2) * 1.6; // bobs on every step
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = -47 + t * 96;
    const sag = Math.sin(t * Math.PI) * (21 + bounce);
    pts.push([x, 3 + sag - t * 6]);
  }
  // string
  line(ctx, pts, 2.2, '#2b7a35', true, 1);
  const cols = ['#ff4f8b', '#fff1f0', '#ff9a2e', '#b45be6', '#ff4f8b', '#fff1f0', '#ff9a2e', '#ff4f8b', '#b45be6'];
  // little leaves between flowers
  for (let i = 0; i < 10; i += 2) {
    const p = pts[i], q = pts[i + 1];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    shape(ctx, (c) => ellipsePath(c, mx, my + 2, 4, 2, 0.6 + (i % 2) * 1.6), { fill: '#3fb04b', ink: 1.1, shadow: 'none' });
  }
  for (let i = 0; i < 9; i++) {
    const p = pts[i + 1];
    hibiscus(ctx, p[0], p[1], i === 4 ? 7.6 : 6.4, cols[i], i * 0.7 + ph * 0.1);
  }
}

/** Aviator sunglasses; (x,y) = bridge centre. */
function sunglasses(ctx: Ctx, x: number, y: number, s: number, tilt: number, down: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  const lens = (c: Ctx, cx: number, mirror: number) => {
    c.moveTo(cx - 9 * mirror, -5);
    c.quadraticCurveTo(cx, -7.5, cx + 9 * mirror, -5.5);
    c.quadraticCurveTo(cx + 11 * mirror, 3, cx + 3 * mirror, 7);
    c.quadraticCurveTo(cx - 6 * mirror, 9, cx - 9 * mirror, 1);
    c.closePath();
  };
  // arms (temples) going back toward the leaves
  if (!down) {
    line(ctx, [[-20, -2], [-27, -5]], 3.6, INK);
    line(ctx, [[-20, -2], [-27, -5]], 1.6, TRIM);
  }
  for (const [cx, m] of [[-11, -1], [11, 1]] as [number, number][]) {
    shape(ctx, (c) => lens(c, cx, m), { fill: '#2a2440', ink: 2.2 / s, shadow: 'none' });
    clipTo(ctx, (c) => lens(c, cx, m), () => {
      const g = ctx.createLinearGradient(cx - 9, -6, cx + 9, 8);
      g.addColorStop(0, '#6a4cc8');
      g.addColorStop(0.45, '#ff5e9a');
      g.addColorStop(0.55, '#3a2a60');
      g.addColorStop(1, '#1a1430');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(cx - 12, -10, 24, 20);
      ctx.globalAlpha = 1;
      line(ctx, [[cx - 6, 5], [cx + 4, -6]], 2.4, '#ffffff', false, 0.55);
      line(ctx, [[cx - 1, 7], [cx + 7, -2]], 1.1, '#ffffff', false, 0.4);
    });
    // gold rim
    ctx.save();
    ctx.beginPath();
    lens(ctx, cx, m);
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = TRIM;
    ctx.stroke();
    ctx.restore();
  }
  // bridge
  line(ctx, [[-3, -4.5], [0, -6], [3, -4.5]], 4, INK, true);
  line(ctx, [[-3, -4.5], [0, -6], [3, -4.5]], 1.8, TRIM, true);
  ctx.restore();
}

/** Pizza peel sceptre in local coords: grip at (0,0), handle along -y. Head centre at (0,-hd). */
function peel(ctx: Ctx, hd: number, f: number, glowing: boolean, sliceGone: boolean) {
  const ph = phase(f);
  const butt = 50, neck = hd - 22;
  // handle
  shape(ctx, (c) => roundRectPath(c, -3.6, -neck, 7.2, neck + butt, 3.6), { fill: WOOD, ink: OUT_IN, shadow: WOOD_SH, shadowOffset: [-2, 0] });
  line(ctx, [[-1.2, butt - 6], [-1.2, -neck + 6]], 1.2, '#f3cb94', false, 0.8);
  // gold ferrules
  for (const yy of [butt - 4, -neck + 3]) {
    shape(ctx, (c) => roundRectPath(c, -5, yy - 3, 10, 6, 2), { fill: TRIM, ink: OUT_S, shadow: '#c8860f', shadowOffset: [-1.2, -1], gloss: [{ x: -2.5, y: yy - 1.5, rx: 1.2, ry: 0.8, alpha: 0.8 }] });
  }
  ball(ctx, 0, butt + 3, 4.2, TRIM, OUT_S);
  // paddle head (scaled up a bit so the Hawaiian slice reads at 1x)
  ctx.save();
  ctx.translate(0, -hd);
  ctx.scale(1.2, 1.2);
  ctx.translate(0, hd);
  const head = (c: Ctx) => {
    c.moveTo(-4, -neck + 2);
    c.quadraticCurveTo(-6, -hd + 16, -17, -hd + 12);
    c.quadraticCurveTo(-21, -hd - 4, -17, -hd - 18);
    c.quadraticCurveTo(0, -hd - 26, 17, -hd - 18);
    c.quadraticCurveTo(21, -hd - 4, 17, -hd + 12);
    c.quadraticCurveTo(6, -hd + 16, 4, -neck + 2);
    c.closePath();
  };
  if (glowing) softGlow(ctx, 0, -hd - 2, 38, '#ffe066', 0.8);
  S(ctx, head, { fill: '#e2ab68', ink: OUT_IN / 1.2, shadow: WOOD_SH, shadowOffset: [-3, -2.4], gloss: [{ x: -10, y: -hd - 12, rx: 3, ry: 6, rot: 0.3, alpha: 0.35 }] });
  // wood grain
  for (const gx of [-9, -2, 6, 12]) line(ctx, [[gx, -hd + 10], [gx * 1.1, -hd - 4], [gx * 0.95, -hd - 18]], 0.9, WOOD_SH, true, 0.5);
  if (!sliceGone) hawaiianSlice(ctx, 0, -hd, f, glowing);
  ctx.restore();
  void ph;
}

/** A slice of Hawaiian pizza; (x,y) = centre of the peel head (tip pointing down). */
export function hawaiianSlice(ctx: Ctx, x: number, y: number, f: number, glowing = false, s = 1) {
  const ph = phase(f);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const slice = (c: Ctx) => {
    c.moveTo(-15, -12);
    c.quadraticCurveTo(0, -17, 15, -12);
    c.lineTo(1.5, 16);
    c.quadraticCurveTo(0, 18, -1.5, 16);
    c.closePath();
  };
  shape(ctx, slice, { fill: '#ffd654', ink: OUT_S + 0.3, shadow: '#e9a530', shadowOffset: [-2, -1.6] });
  clipTo(ctx, slice, () => {
    // sauce peeking at the edges
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#d8432a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    slice(ctx);
    ctx.stroke();
    ctx.restore();
    speckle(ctx, 0, 0, 12, 12, 14, '#f6a23a', 0.8, 31, 0.8);
  });
  // cheese drip from the tip
  const dl = 7 + Math.sin(ph) * 2.5;
  shape(ctx, (c) => dripPath(c, 0, 14, 4, dl), { fill: '#ffd654', ink: OUT_S * 0.8, shadow: 'none' });
  // ham
  for (const [hx, hy, r] of [[-6, -5, 0.3], [5, 3, -0.4]] as [number, number, number][]) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(r);
    shape(ctx, (c) => roundRectPath(c, -3.6, -3, 7.2, 6, 1.4), { fill: '#f590a8', ink: 1.2, shadow: '#d8607e', shadowOffset: [-1, -1] });
    line(ctx, [[-2.4, -0.8], [2.2, 0.6]], 0.9, '#ffd2dc', false, 0.9);
    ctx.restore();
  }
  // pineapple chunks
  for (const [px, py, r] of [[4, -7, 0.2], [-4, 4, -0.5], [1, 10, 0.4]] as [number, number, number][]) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(r);
    shape(ctx, (c) => {
      c.moveTo(-3.6, -2.4);
      c.lineTo(3.6, -2.8);
      c.lineTo(2.6, 2.6);
      c.lineTo(-2.8, 2.4);
      c.closePath();
    }, { fill: '#fff07a', ink: 1.2, shadow: '#f2c23a', shadowOffset: [-0.9, -0.9] });
    line(ctx, [[-2, -1.4], [1.6, -1.6]], 0.8, '#ffffff', false, 0.8);
    ctx.restore();
  }
  // crust
  shape(ctx, (c) => {
    c.moveTo(-17, -12);
    c.quadraticCurveTo(0, -20, 17, -12);
    c.quadraticCurveTo(18, -7, 14, -8.5);
    c.quadraticCurveTo(0, -12.5, -14, -8.5);
    c.quadraticCurveTo(-18, -7, -17, -12);
    c.closePath();
  }, { fill: '#e7a64b', ink: OUT_S + 0.3, shadow: '#b8742e', shadowOffset: [-1.4, -1.4], gloss: [{ x: -7, y: -14.5, rx: 3.5, ry: 1.2, rot: -0.1, alpha: 0.5 }] });
  speckle(ctx, 0, -12.5, 12, 2, 6, '#8a4a1c', 0.45, 5, 0.7);
  if (glowing) {
    sparkle(ctx, 12, -18, 7, '#ffffff', 0.95);
    sparkle(ctx, -14, 4, 4.5, '#fff6c0', 0.9);
  }
  ctx.restore();
}

function royalShoe(ctx: Ctx, x: number, y: number) {
  shape(ctx, (c) => {
    c.moveTo(x - 9, y + 1);
    c.quadraticCurveTo(x - 11, y - 9, x - 2, y - 9);
    c.quadraticCurveTo(x + 7, y - 9, x + 12, y - 4);
    c.quadraticCurveTo(x + 18, y - 3, x + 19, y - 10);
    c.quadraticCurveTo(x + 23, y - 1, x + 13, y + 1.5);
    c.quadraticCurveTo(x + 2, y + 3, x - 9, y + 1);
    c.closePath();
  }, { fill: TRIM, ink: OUT_IN, shadow: '#c8860f', shadowOffset: [-2, -1.8], gloss: [{ x: x - 2, y: y - 6, rx: 3, ry: 1.5, rot: -0.2, alpha: 0.8 }] });
  ball(ctx, x + 19.5, y - 10.5, 2.3, '#ff4f6a', 1.2);
  // red buckle gem
  shape(ctx, (c) => roundRectPath(c, x - 2, y - 7, 6, 4.6, 1.4), { fill: RED, ink: 1.2, shadow: RED_SH, shadowOffset: [-0.8, -0.8] });
}

/** Royal cape (behind everything). hem wave animated by f. */
function cape(ctx: Ctx, f: number, flare: number) {
  const ph = phase(f);
  const hem: Pt[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = -72 - flare * 10 + t * (140 + flare * 18);
    const y = 58 + Math.sin(ph + t * 7) * 2.6 - Math.sin(t * Math.PI) * 4;
    hem.push([x, y]);
  }
  const capeOuter = (c: Ctx) => {
    c.moveTo(-40, -30);
    c.bezierCurveTo(-58, -26, -64 - flare * 6, -2, -66 - flare * 8, 20);
    c.quadraticCurveTo(-70 - flare * 10, 44, hem[0][0], hem[0][1]);
    for (let i = 1; i <= n; i++) {
      const p = hem[i - 1], q = hem[i];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 + (i % 2 ? 3.2 : -1.5);
      c.quadraticCurveTo(mx, my, q[0], q[1]);
    }
    c.quadraticCurveTo(66 + flare * 8, 40, 62 + flare * 6, 18);
    c.bezierCurveTo(60, -2, 56, -24, 40, -30);
    c.closePath();
  };
  S(ctx, capeOuter, { fill: RED, ink: OUT, shadow: RED_SH, shadowOffset: [-9, -2], gloss: [{ x: -60, y: 8, rx: 3, ry: 18, rot: 0.15, alpha: 0.25 }] });
  // velvet folds
  for (const [x0, x1] of [[-56, -64], [-48, -52], [52, 58]] as Pt[]) {
    line(ctx, [[x0, 0], [x0 + (x1 - x0) * 0.5, 26], [x1, 50]], 2.2, RED_SH, true, 0.6);
  }
  line(ctx, [[-62, -2], [-66, 30]], 1.6, RED_HI, true, 0.45);
  // gold trim along the hem
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(hem[0][0], hem[0][1]);
  for (let i = 1; i <= n; i++) {
    const p = hem[i - 1], q = hem[i];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 + (i % 2 ? 3.2 : -1.5);
    ctx.quadraticCurveTo(mx, my, q[0], q[1]);
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = TRIM;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#fff1a6';
  ctx.stroke();
  ctx.restore();
}

/** High stand-up royal collar (velvet outside, ermine lining facing us) behind the body. */
function collar(ctx: Ctx, f: number, flare: number) {
  const ph = phase(f);
  for (const s of [-1, 1]) {
    const tipX = s * (76 + flare * 6), tipY = -74 - flare * 4 + Math.sin(ph + (s > 0 ? 1 : 0)) * 1.2;
    const outer = (c: Ctx) => {
      c.moveTo(s * 14, -44);
      c.bezierCurveTo(s * 30, -58, s * 50, -64, tipX, tipY);
      c.bezierCurveTo(s * 74, -56, s * 72, -36, s * 64, -20);
      c.quadraticCurveTo(s * 58, -8, s * 44, -2);
      c.lineTo(s * 14, -14);
      c.closePath();
    };
    S(ctx, outer, { fill: RED, ink: OUT, shadow: RED_SH, shadowOffset: [-4, -3] });
    const lining = (c: Ctx) => {
      c.moveTo(s * 18, -44);
      c.bezierCurveTo(s * 32, -54, s * 50, -60, tipX - s * 8, tipY + 7);
      c.bezierCurveTo(s * 66, -54, s * 65, -38, s * 58, -24);
      c.quadraticCurveTo(s * 53, -12, s * 42, -8);
      c.lineTo(s * 18, -18);
      c.closePath();
    };
    S(ctx, lining, { fill: ERMINE, ink: OUT_S, shadow: '#d2d0de', shadowOffset: [s > 0 ? -3 : -2, -2.5] });
    // ermine tail spots
    for (const [x, y] of [[50, -50], [60, -40], [54, -28], [40, -50], [46, -18], [64, -56]] as Pt[]) {
      const X = s * x, Y = y;
      fillPath(ctx, (c) => {
        c.moveTo(X - 1.8, Y - 2.6);
        c.quadraticCurveTo(X + 1.9, Y - 2.6, X + 1.1, Y + 1);
        c.lineTo(X, Y + 3.8);
        c.lineTo(X - 1.1, Y + 1);
        c.closePath();
      }, '#2b1712');
    }
    // gold piping along the outer edge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s * 30, -55);
    ctx.bezierCurveTo(s * 44, -62, s * 56, -66, tipX, tipY);
    ctx.bezierCurveTo(s * 74, -56, s * 72, -36, s * 64, -20);
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = TRIM;
    ctx.stroke();
    ctx.restore();
    ball(ctx, tipX, tipY, 3, TRIM, OUT_S);
  }
}

interface Pose {
  f: number;
  lean: number;
  grip: Pt;
  peelAng: number;
  peelHd: number;
  glassesDown: boolean;
  mouth: 'grin' | 'clench' | 'roar';
  spread: number;
  flare: number;
  armL: 'hip' | 'fist';
  glow: boolean;
  sliceGone: boolean;
  crownTilt: number;
  crownLift: number;
}

function arrogantGrin(ctx: Ctx, x: number, y: number, w: number, kind: Pose['mouth']) {
  if (kind === 'roar') {
    const m = (c: Ctx) => {
      c.moveTo(x - w * 0.5, y - 4);
      c.quadraticCurveTo(x, y - 10, x + w * 0.52, y - 8);
      c.quadraticCurveTo(x + w * 0.4, y + 22, x, y + 24);
      c.quadraticCurveTo(x - w * 0.42, y + 20, x - w * 0.5, y - 4);
      c.closePath();
    };
    shape(ctx, m, { fill: '#5b1320', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, m, () => {
      fillPath(ctx, (c) => ellipsePath(c, x + 3, y + 22, w * 0.3, 9), '#e8616e');
      fillPath(ctx, (c) => {
        c.moveTo(x - w * 0.6, y - 12);
        c.lineTo(x + w * 0.6, y - 14);
        c.lineTo(x + w * 0.6, y - 2);
        c.quadraticCurveTo(x, y + 1, x - w * 0.6, y);
        c.closePath();
      }, '#fff8ea');
      for (let i = -3; i <= 3; i++) line(ctx, [[x + i * w * 0.12, y - 12], [x + i * w * 0.12, y - 1]], 0.9, 'rgba(80,40,30,0.4)');
      // gold tooth
      fillPath(ctx, (c) => c.rect(x + w * 0.12, y - 12, w * 0.12, 10.5), TRIM);
    });
    return;
  }
  const lift = kind === 'clench' ? 0.6 : 1;
  const m = (c: Ctx) => {
    c.moveTo(x - w * 0.5, y - 2);
    c.quadraticCurveTo(x - w * 0.1, y + 3 * lift, x + w * 0.52, y - 9);
    c.quadraticCurveTo(x + w * 0.3, y + 15 * lift, x - w * 0.08, y + 13 * lift);
    c.quadraticCurveTo(x - w * 0.4, y + 9 * lift, x - w * 0.5, y - 2);
    c.closePath();
  };
  shape(ctx, m, { fill: '#5b1320', ink: OUT_IN, shadow: 'none' });
  clipTo(ctx, m, () => {
    // top teeth band following the upper lip
    fillPath(ctx, (c) => {
      c.moveTo(x - w * 0.6, y - 6);
      c.quadraticCurveTo(x - w * 0.1, y + 1 * lift, x + w * 0.6, y - 13);
      c.lineTo(x + w * 0.6, y - 2);
      c.quadraticCurveTo(x - w * 0.1, y + (kind === 'clench' ? 14 : 8) * lift, x - w * 0.6, y + 4);
      c.closePath();
    }, '#fff8ea');
    if (kind === 'clench') {
      line(ctx, [[x - w * 0.5, y + 1.5], [x - w * 0.1, y + 5], [x + w * 0.5, y - 4]], 1.2, 'rgba(80,40,30,0.55)', true);
    }
    for (let i = -3; i <= 3; i++) {
      const tx = x + i * w * 0.13;
      line(ctx, [[tx, y - 12], [tx + 0.6, y + 12]], 1, 'rgba(80,40,30,0.38)');
    }
    // the gold tooth
    fillPath(ctx, (c) => c.rect(x + w * 0.13, y - 14, w * 0.13, kind === 'clench' ? 18 : 12), TRIM);
    line(ctx, [[x + w * 0.15, y - 6], [x + w * 0.17, y - 2]], 1.2, '#ffffff', false, 0.9);
    if (kind === 'grin') fillPath(ctx, (c) => ellipsePath(c, x + 2, y + 12, w * 0.26, 4), '#e8616e');
  });
  // dimple / smirk crease at the high corner
  line(ctx, [[x + w * 0.5, y - 13], [x + w * 0.6, y - 8], [x + w * 0.55, y - 3]], 1.6, GROOVE, true, 0.85);
}

function drawAnanas(ctx: Ctx, p: Pose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = ANANAS_R;

  // ---- cape (behind everything)
  ctx.save();
  pivot(ctx, 0, FOOT, p.lean * 0.5);
  cape(ctx, f, p.flare);
  ctx.restore();

  // ---- legs (stubby, green tights, golden pointy shoes)
  stompLegs(ctx, 0, 34, FOOT, f, {
    spread: 20, thick: 15, color: '#2f8a46', shade: '#1d6a34', stride: 7, lift: 6,
    shoe: (x, y) => royalShoe(ctx, x - 2, y),
  });

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean);

  // ---- high collar, leaf crown (back layers)
  collar(ctx, f, p.flare);
  const leafY = BODY.cy - BODY.ry + 6;
  pineappleCrown(ctx, 2, leafY, 1.0, f, { spread: p.spread, flare: p.flare });

  // ---- far arm (left): fist on hip, elbow out (red velvet sleeve)
  if (p.armL === 'hip') {
    limb(ctx, [[-40, -6], [-70, 6], [-54, 26]], 15, RED, OUT_IN, RED_SH);
    fist(ctx, -50, 25, 9.5, 0.25, { cuff: TRIM, ink: OUT_IN });
  }

  // ---- the body
  shape(ctx, bodyPath, { fill: GOLD, ink: OUT, shadow: 'none' });
  drawSkinLayer(ctx);

  // ---- front leaves (short ones sprouting over the top of the body)
  frontTuft(ctx, 2, leafY + 2, f, p.spread, p.flare);

  // ---- face
  const fx = 9, fy = -22;
  if (p.glassesDown) {
    brow(ctx, fx - 13, fy - 15, 18, 0.36, 5.2, BROW);
    brow(ctx, fx + 15, fy - 16, 18, -0.4, 5.2, BROW);
    sunglasses(ctx, fx + 1, fy - 1, 1.12, -0.05, true);
    // menacing glints on the lenses
    sparkle(ctx, fx - 16, fy - 6, 6.5, '#ffffff', 0.95);
    sparkle(ctx, fx + 22, fy - 4, 3.8, '#ffffff', 0.8);
  } else {
    // scheming, half-lidded eyes looking down at the chef
    const blink = false;
    void blink;
    lidEye(ctx, fx - 13, fy, 8.8, { side: -1, lidOuter: 0.3, lidInner: 0.52, look: [0.36, 0.3], iris: '#3fae4a', pupil: 0.3, lidColor: GOLD_MID, ink: 2.3, lash: true });
    lidEye(ctx, fx + 14, fy, 8.8, { side: 1, lidOuter: 0.3, lidInner: 0.52, look: [0.36, 0.3], iris: '#3fae4a', pupil: 0.3, lidColor: GOLD_MID, ink: 2.3, lash: true });
    // one brow arched high (disdain), one pressed low (scheming)
    brow(ctx, fx - 14, fy - 17, 18, -0.22, 4.8, BROW);
    brow(ctx, fx + 15, fy - 13.5, 18, -0.3, 4.8, BROW);
    sunglasses(ctx, fx + 1, fy - 30, 0.92, -0.08, false);
  }
  // nose: a pineapple-scale nub
  shape(ctx, (c) => ellipsePath(c, fx + 3, fy + 9, 4.8, 3.7), { fill: GOLD_MID, ink: 2.1, shadow: GOLD_SH, shadowOffset: [-1.2, -1.2], gloss: [{ x: fx + 1.6, y: fy + 7.5, rx: 1.5, ry: 1, alpha: 0.85 }] });
  arrogantGrin(ctx, fx + 1, fy + 23, 42, p.mouth);

  // ---- lei
  lei(ctx, f);

  // ---- far arm (fist variant: raised clenched fist in the wind-up)
  if (p.armL === 'fist') {
    limb(ctx, [[-42, -4], [-68, -10], [-64, -36]], 15, RED, OUT_IN, RED_SH);
    fist(ctx, -62, -42, 10, -1.75, { cuff: TRIM, ink: OUT_IN });
    burstLines(ctx, -62, -44, 16, 24, 5, '#ffffff', 2.2, 3, -2.6, -0.9, 0.85);
  }

  // ---- near arm + sceptre
  const [gx, gy] = p.grip;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(p.peelAng);
  peel(ctx, p.peelHd, f, p.glow, p.sliceGone);
  ctx.restore();
  const ex = gy > -10 ? gx - 9 : gx + 8, ey = gy > -10 ? gy + 18 : (gy + 2) / 2 + 6;
  limb(ctx, [[47, 5], [ex, ey], [gx - 1, gy + 3]], 15, RED, OUT_IN, RED_SH);
  fist(ctx, gx, gy, 10, p.peelAng + Math.PI / 2, { cuff: TRIM, ink: OUT_IN });

  // ---- the little crown, perched on top of the leaves
  goldCrown(ctx, 4 + Math.sin(ph) * 1.2, leafY - 70 - p.crownLift + Math.cos(ph * 2) * 1.4, 1.05, p.crownTilt + Math.sin(ph) * 0.05, f);

  ctx.restore();
}

/** The short bright leaves at the front of the tuft. */
function frontTuft(ctx: Ctx, x: number, y: number, f: number, spread: number, flare: number) {
  const ph = phase(f);
  const leaves: [number, number, number][] = [[-0.95, 22, 8], [0.95, 21, 8], [-0.5, 26, 9], [0.52, 25, 9], [-0.12, 28, 9.5], [0.18, 27, 9.5]];
  leaves.forEach(([off, len, w], i) => {
    const side = off < 0 ? -1 : 1;
    const a = -Math.PI / 2 + off * spread * (1 + flare * 0.2) + Math.sin(ph + i * 2.1) * 0.05;
    const bend = 0.18 * side;
    const bx = x + Math.sin(off) * 4, by = y;
    S(ctx, (c) => {
      const dx = Math.cos(a), dy = Math.sin(a);
      const nx = -dy, ny = dx;
      const tx = bx + dx * len + nx * bend * len, ty = by + dy * len + ny * bend * len;
      const mx = bx + dx * len * 0.5 + nx * bend * len * 0.3, my = by + dy * len * 0.5 + ny * bend * len * 0.3;
      c.moveTo(bx - nx * w * 0.5, by - ny * w * 0.5);
      c.quadraticCurveTo(mx - nx * w, my - ny * w, tx, ty);
      c.quadraticCurveTo(mx + nx * w, my + ny * w, bx + nx * w * 0.5, by + ny * w * 0.5);
      c.closePath();
    }, { fill: '#58cc62', ink: OUT_IN, shadow: '#2c9447', shadowOffset: [-w * 0.3, -w * 0.2] });
  });
}

const WALK = (f: number): Pose => ({
  f, lean: 0, grip: [66, 8 + Math.sin(phase(f)) * 1.5], peelAng: 0.12 + Math.sin(phase(f)) * 0.03, peelHd: 74, glassesDown: false, mouth: 'grin',
  spread: 0.86, flare: 0, armL: 'hip', glow: false, sliceGone: false, crownTilt: 0.16, crownLift: 0,
});

defineSprite({ id: 'boss.ananas', w: W, h: H, ax: AX, ay: AY, frames: 4, flash: true, draw: (ctx, f) => drawAnanas(ctx, WALK(f)) });

defineSprite({
  id: 'boss.ananas.attack', w: W, h: H, ax: AX, ay: AY, frames: 2, flash: true,
  draw: (ctx, f) => {
    if (f === 0) {
      // wind-up: shades DOWN, sceptre raised high, the slice charges with pineapple power
      drawAnanas(ctx, {
        f: 0, lean: -0.07, grip: [54, -42], peelAng: -0.16, peelHd: 64, glassesDown: true, mouth: 'clench',
        spread: 0.95, flare: 0.3, armL: 'fist', glow: true, sliceGone: false, crownTilt: -0.1, crownLift: 4,
      });
    } else {
      // strike: sceptre thrust at the chef, pineapple rings fly, leaves flare, ROAR
      swoosh(ctx, 44, -18, 66, -2.3, -0.5, 20, '#fff4c0', 0.5);
      drawAnanas(ctx, {
        f: 2, lean: 0.08, grip: [60, -12], peelAng: 0.76, peelHd: 52, glassesDown: true, mouth: 'roar',
        spread: 1.05, flare: 1, armL: 'hip', glow: true, sliceGone: false, crownTilt: 0.3, crownLift: 8,
      });
      ctx.save();
      ctx.translate(0, ANANAS_R);
      ctx.rotate(0.08);
      ctx.translate(0, -ANANAS_R);
      burstLines(ctx, 98, -58, 27, 38, 9, '#fff4c0', 2.6, 11, -1.9, 0.9, 0.95);
      pineappleRing(ctx, 116, -92, 9.5, 0.7, 0.5);
      pineappleRing(ctx, 124, -26, 8.5, 0.7, -0.3);
      ctx.restore();
    }
  },
});
