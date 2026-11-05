/**
 * STAGE 3 — "I Vicoli di Napoli": the alleys of Naples, golden hour → night.
 * Dark lava-stone "basoli" (seamless 768u super-texture in 3×3 tiles) with
 * gutters and manholes; parked Vespas and a tiny vintage city car, café tables
 * under umbrellas, a market stall, a lemon-soda kiosk, iron street lamps, a
 * stone fountain, geraniums, pigeons and laundry strung overhead.
 */
import { defineSprite } from '../sprites';
import { registerStageEnv } from '../stageenv';
import type { PropPlacement } from '../stageenv';
import {
  Ctx, INK, shape, flat, line, ellipsePath, circlePath, roundRectPath, blobPath,
  rng, rgba, mix, shade, light, speckle, glint,
} from '../painter';
import {
  Layout, hash2, mod, rectCol, circleCol, ao, aoRect, softShape, clipped, lgrad, wash, bloom, fadeAll, fadeUp,
  grain, strokeText, tomato, lemon, leaf, crate,
} from './env_common';

const TS = 256;
const SUPER = 768;
const CHUNK = 768;

// ---------------------------------------------------------------------------
// Basalt "basoli" — rows of big lava-stone slabs (super-texture)
// ---------------------------------------------------------------------------

// Diagonal rows (45°). In the rotated frame u=(x+y)/√2 (along rows), v=(x−y)/√2
// (across rows), the screen translation (768,0) is (543.06, 543.06): 16 rows of
// height h and a joint pattern that repeats every 768√2 along u, shifted by
// 543.06 every 16 rows — so the 768u super-texture tiles seamlessly.
const SQ2 = Math.SQRT2;
const HALF = SUPER / SQ2; // 543.06
const NROW = 16;
const RH = HALF / NROW; // ≈ 33.9 row height
const PU = SUPER * SQ2; // u period ≈ 1086.1
const BASALT = ['#4f4e55', '#49494f', '#55535a', '#4c4d53', '#524f54', '#4a4c53', '#504d51', '#57555b'];

/** Base rows: slab start positions along u (period PU) + colours/seeds. */
const BASE_ROWS: { u: number; len: number; col: string; seed: number }[][] = (() => {
  const R = rng(4242);
  const rows: { u: number; len: number; col: string; seed: number }[][] = [];
  for (let r = 0; r < NROW; r++) {
    const lens: number[] = [];
    let sum = 0;
    while (sum < PU - 110) { const l = 56 + R() * 48; lens.push(l); sum += l; }
    const rest = PU - sum;
    if (rest < 46) lens[lens.length - 1] += rest; else lens.push(rest);
    let u = R() * PU;
    const row: { u: number; len: number; col: string; seed: number }[] = [];
    for (const l of lens) {
      const c = mix(BASALT[Math.floor(R() * BASALT.length)], R() < 0.5 ? '#3f3e45' : '#605c62', R() * 0.35);
      row.push({ u, len: l, col: c, seed: Math.floor(R() * 1e6) });
      u += l;
    }
    rows.push(row);
  }
  return rows;
})();

function basaltWindow(ctx: Ctx, wx: number, wy: number) {
  const X0 = wx * TS, Y0 = wy * TS, X1 = X0 + TS, Y1 = Y0 + TS;
  const M = 70;
  ctx.save();
  ctx.translate(-X0, -Y0);
  ctx.fillStyle = '#25242a';
  ctx.fillRect(X0, Y0, TS, TS);
  const vmin = (X0 - M - (Y1 + M)) / SQ2, vmax = (X1 + M - (Y0 - M)) / SQ2;
  const umin = (X0 - M + Y0 - M) / SQ2, umax = (X1 + M + Y1 + M) / SQ2;
  const J = 1.2;
  for (let r = Math.floor(vmin / RH); r <= Math.ceil(vmax / RH); r++) {
    const b = mod(r, NROW), m = Math.floor(r / NROW);
    const off = m * HALF;
    const v0 = r * RH;
    for (const sl of BASE_ROWS[b]) {
      // all periodic copies of this slab that intersect [umin, umax]
      const ua0 = sl.u + off;
      const n0 = Math.floor((umin - ua0 - sl.len) / PU), n1 = Math.ceil((umax - ua0) / PU);
      for (let n = n0; n <= n1; n++) {
        const ua = ua0 + n * PU;
        if (ua > umax || ua + sl.len < umin) continue;
        const uc = ua + sl.len / 2, vc = v0 + RH / 2;
        const xc = (uc + vc) / SQ2, yc = (uc - vc) / SQ2;
        const L2 = sl.len / 2 - J, H2 = RH / 2 - J;
        const build = (p: Ctx) => {
          p.save();
          p.translate(xc, yc);
          p.rotate(Math.PI / 4);
          roundRectPath(p, -L2, -H2, L2 * 2, H2 * 2, 5);
          p.restore();
        };
        ctx.beginPath();
        build(ctx);
        ctx.fillStyle = sl.col;
        ctx.fill();
        const R = rng(sl.seed);
        clipped(ctx, build, () => {
          // screen-space light: warm from the upper-left, cool shadow lower-right
          ctx.fillStyle = lgrad(ctx, xc - 30, yc - 30, xc + 30, yc + 30, [[0, 'rgba(255,205,150,0.14)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(8,8,26,0.26)']]);
          ctx.fillRect(xc - 60, yc - 60, 120, 120);
          // polished, foot-worn centre
          if (R() < 0.6) {
            const g = ctx.createRadialGradient(xc - 4, yc - 4, 1, xc, yc, sl.len * 0.42);
            g.addColorStop(0, 'rgba(200,196,210,0.14)');
            g.addColorStop(1, 'rgba(200,196,210,0)');
            ctx.fillStyle = g;
            ctx.fillRect(xc - 60, yc - 60, 120, 120);
          }
          // chiselled grooves ("picchettatura"): short parallel strokes across the slab
          ctx.save();
          ctx.translate(xc, yc);
          ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = 'rgba(18,17,24,0.32)';
          ctx.lineWidth = 0.7;
          const ng = Math.floor(sl.len / 3.2);
          for (let i = 0; i < ng; i++) {
            const gx = -L2 + 3 + R() * (L2 * 2 - 6), gy = -H2 + 3 + R() * (H2 * 2 - 8);
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + 0.6, gy + 2.2 + R() * 1.5);
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(170,165,180,0.14)';
          for (let i = 0; i < ng * 0.4; i++) {
            const gx = -L2 + 3 + R() * (L2 * 2 - 6), gy = -H2 + 3 + R() * (H2 * 2 - 8);
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + 0.5, gy + 1.8);
            ctx.stroke();
          }
          // edge light / shadow (local -x and -y edges face the light)
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(214,190,150,0.3)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(-L2 + 1, H2 - 4);
          ctx.lineTo(-L2 + 1, -H2 + 1);
          ctx.lineTo(L2 - 4, -H2 + 1);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(10,10,20,0.4)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(-L2 + 4, H2 - 0.8);
          ctx.lineTo(L2 - 0.8, H2 - 0.8);
          ctx.lineTo(L2 - 0.8, -H2 + 4);
          ctx.stroke();
          // occasional crack
          if (R() < 0.1) {
            let cx = -L2 + R() * L2 * 2, cy = -H2;
            ctx.strokeStyle = 'rgba(16,15,22,0.65)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            for (let k = 0; k < 4; k++) { cx += (R() - 0.5) * 9; cy += (H2 * 2) / 4; ctx.lineTo(cx, cy); }
            ctx.stroke();
          }
          ctx.restore();
        });
      }
    }
  }
  // grime, moss and warm dust (wrapped low-frequency variation)
  const R = rng(777);
  for (let i = 0; i < 26; i++) {
    const bx = R() * SUPER, by = R() * SUPER, br = 40 + R() * 90;
    const kind = R();
    const col = kind < 0.45 ? '#121018' : kind < 0.75 ? '#c8a878' : '#3a4a2a';
    const al = kind < 0.45 ? 0.14 : kind < 0.75 ? 0.05 : 0.08;
    for (const ox of [-SUPER, 0, SUPER]) for (const oy of [-SUPER, 0, SUPER]) {
      const cx = bx + ox, cy = by + oy;
      if (cx + br < X0 || cx - br > X1 || cy + br < Y0 || cy - br > Y1) continue;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, br);
      g.addColorStop(0, rgba(col, al));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - br, cy - br, br * 2, br * 2);
    }
  }
  ctx.restore();
}

for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 3; wx++) {
  defineSprite({ id: `tile.streets.${wy * 3 + wx}`, w: TS, h: TS, ax: 0, ay: 0, res: 1.5, draw: (ctx) => basaltWindow(ctx, wx, wy) });
}

// ---------------------------------------------------------------------------
// Vespa (side view, facing right; flip for left)
// ---------------------------------------------------------------------------

function wheel(ctx: Ctx, x: number, y: number, r: number) {
  shape(ctx, (p) => circlePath(p, x, y, r), { fill: '#2a2628', ink: 2, shadow: 'none' });
  shape(ctx, (p) => circlePath(p, x, y, r * 0.55), { fill: '#c9cfd4', ink: 1.2, shadow: '#8a9298', shadowOffset: [-1, -1], gloss: [{ x: x - r * 0.2, y: y - r * 0.2, rx: r * 0.18, ry: r * 0.1, alpha: 0.8 }] });
  flat(ctx, (p) => circlePath(p, x, y, r * 0.16), '#5a6066', 0.6);
}

function vespa(ctx: Ctx, body: string) {
  ao(ctx, 4, -3, 52, 9, 0.55);
  const sh = shade(body, 0.28);
  // kickstand
  line(ctx, [[-6, -12], [-10, 0]], 3.4, INK);
  line(ctx, [[-6, -12], [-10, 0]], 1.6, '#8a9298');
  wheel(ctx, -30, -11, 11);
  wheel(ctx, 32, -11, 11);
  // rear cowl (engine bulge) + floorboard + leg shield as one body
  shape(ctx, (p) => {
    p.moveTo(-46, -22);
    p.bezierCurveTo(-48, -40, -30, -48, -10, -44);
    p.lineTo(4, -42);
    p.quadraticCurveTo(8, -30, 10, -20);
    p.lineTo(18, -20);
    p.lineTo(26, -58);
    p.quadraticCurveTo(28, -64, 33, -62);
    p.lineTo(34, -56);
    p.quadraticCurveTo(28, -40, 30, -22);
    p.lineTo(24, -16);
    p.lineTo(-14, -16);
    p.quadraticCurveTo(-20, -14, -26, -18);
    p.quadraticCurveTo(-38, -14, -46, -22);
    p.closePath();
  }, { fill: body, ink: 2.4, shadow: sh, shadowOffset: [-4, -4], gloss: [{ x: -26, y: -40, rx: 10, ry: 3, rot: -0.1, alpha: 0.55 }, { x: 28, y: -50, rx: 1.4, ry: 6, rot: 0.3, alpha: 0.5 }] });
  // front fender
  shape(ctx, (p) => { p.moveTo(20, -18); p.quadraticCurveTo(32, -30, 44, -18); p.lineTo(40, -16); p.quadraticCurveTo(32, -24, 24, -16); p.closePath(); }, { fill: body, ink: 1.8, shadow: sh, shadowOffset: [-2, -2] });
  // floorboard rubber strips
  for (let i = 0; i < 4; i++) line(ctx, [[-10 + i * 6, -17.5], [-6 + i * 6, -17.5]], 1.2, '#2a2628');
  // side panel vents + chrome trim
  for (let i = 0; i < 4; i++) line(ctx, [[-36 + i * 4, -33], [-34 + i * 4, -26]], 1, sh, false, 0.9);
  line(ctx, [[-44, -24], [-16, -18]], 1, '#e8eef2', true, 0.8);
  // seat
  shape(ctx, (p) => { p.moveTo(-36, -46); p.quadraticCurveTo(-30, -54, -10, -52); p.quadraticCurveTo(0, -51, 2, -46); p.closePath(); }, { fill: '#5a3424', ink: 1.8, shadow: '#3a2014', shadowOffset: [-1.5, -1.5], gloss: [{ x: -22, y: -51, rx: 7, ry: 1.2, alpha: 0.45 }] });
  // steering column + handlebar + round headlight
  line(ctx, [[30, -60], [34, -72]], 4.4, INK);
  line(ctx, [[30, -60], [34, -72]], 2.4, body);
  shape(ctx, (p) => roundRectPath(p, 22, -76, 26, 6, 3), { fill: body, ink: 1.6, shadow: sh, shadowOffset: [-1, -1] });
  line(ctx, [[18, -73], [24, -73]], 3.4, '#2a2628');
  line(ctx, [[46, -73], [50, -73]], 3.4, '#2a2628');
  shape(ctx, (p) => circlePath(p, 40, -79, 5.6), { fill: '#e8eef2', ink: 1.6, shadow: '#9aa2aa', shadowOffset: [-1, -1] });
  flat(ctx, (p) => circlePath(p, 41, -79, 3.6), '#fff4c8', 0.6);
  glint(ctx, 39.4, -80.4, 1.2, 0.8, -0.5, 0.9);
  // mirror
  line(ctx, [[24, -76], [20, -86]], 1.2, '#8a9298');
  shape(ctx, (p) => ellipsePath(p, 19.4, -88, 3, 2.2), { fill: '#d6dde2', ink: 1, shadow: 'none' });
  // tail light + spare detail
  shape(ctx, (p) => roundRectPath(p, -50, -32, 5, 5, 1.5), { fill: '#d23a2a', ink: 1, shadow: 'none' });
}

defineSprite({ id: 'prop.streets.vespa_mint', w: 112, h: 98, ax: 54, ay: 90, draw: (ctx) => vespa(ctx, '#9fd3be') });
defineSprite({ id: 'prop.streets.vespa_red', w: 112, h: 98, ax: 54, ay: 90, draw: (ctx) => vespa(ctx, '#c9382f') });
defineSprite({ id: 'prop.streets.vespa_cream', w: 112, h: 98, ax: 54, ay: 90, draw: (ctx) => vespa(ctx, '#eadcbc') });
defineSprite({ id: 'prop.streets.vespa_blue', w: 112, h: 98, ax: 54, ay: 90, draw: (ctx) => vespa(ctx, '#86b9de') });

// ---------------------------------------------------------------------------
// Tiny vintage city car (generic; side view facing right)
// ---------------------------------------------------------------------------

function cityCar(ctx: Ctx, body: string) {
  ao(ctx, 6, -6, 84, 14, 0.6);
  const sh = shade(body, 0.26);
  wheel(ctx, -46, -14, 14);
  wheel(ctx, 46, -14, 14);
  const bodyPath = (p: Ctx) => {
    p.moveTo(-74, -18);
    p.quadraticCurveTo(-78, -40, -66, -48);
    p.bezierCurveTo(-58, -86, 34, -92, 46, -50);
    p.quadraticCurveTo(70, -48, 76, -34);
    p.quadraticCurveTo(78, -20, 72, -16);
    p.lineTo(62, -16);
    p.bezierCurveTo(60, -34, 32, -34, 30, -16);
    p.lineTo(-30, -16);
    p.bezierCurveTo(-32, -34, -60, -34, -62, -16);
    p.closePath();
  };
  shape(ctx, bodyPath, { fill: body, ink: 2.8, shadow: sh, shadowOffset: [-6, -5], gloss: [{ x: -24, y: -72, rx: 26, ry: 5, rot: -0.05, alpha: 0.5 }, { x: 56, y: -44, rx: 8, ry: 2, alpha: 0.4 }] });
  // windows
  const win = (p: Ctx) => { p.moveTo(-54, -50); p.bezierCurveTo(-48, -76, -14, -80, -8, -78); p.lineTo(-8, -50); p.closePath(); };
  const win2 = (p: Ctx) => { p.moveTo(-2, -50); p.lineTo(-2, -78); p.bezierCurveTo(14, -78, 30, -70, 38, -50); p.closePath(); };
  for (const w of [win, win2]) {
    shape(ctx, w, { fill: '#9cc6d8', ink: 1.8, shadow: '#6f9fb4', shadowOffset: [-3, -3] });
    clipped(ctx, w, () => {
      line(ctx, [[-50, -56], [-30, -80]], 4, '#ffffff', false, 0.4);
      line(ctx, [[4, -54], [20, -80]], 3, '#ffffff', false, 0.35);
    });
  }
  // rolled canvas sunroof
  shape(ctx, (p) => roundRectPath(p, -40, -86, 50, 7, 3.5), { fill: '#3a3434', ink: 1.6, shadow: 'none', gloss: [{ x: -20, y: -84.5, rx: 14, ry: 1, alpha: 0.3 }] });
  // door line + handle
  line(ctx, [[-6, -48], [-6, -22]], 1.2, sh, false, 0.9);
  line(ctx, [[-50, -48], [-50, -26]], 1.2, sh, false, 0.6);
  shape(ctx, (p) => roundRectPath(p, -16, -44, 8, 2.4, 1.2), { fill: '#e8eef2', ink: 0.8, shadow: 'none' });
  // chrome bumpers + round headlight + tail light
  shape(ctx, (p) => roundRectPath(p, 64, -24, 16, 5, 2.5), { fill: '#e8eef2', ink: 1.4, shadow: '#9aa2aa', shadowOffset: [-1, -1] });
  shape(ctx, (p) => roundRectPath(p, -82, -24, 14, 5, 2.5), { fill: '#e8eef2', ink: 1.4, shadow: '#9aa2aa', shadowOffset: [-1, -1] });
  shape(ctx, (p) => circlePath(p, 66, -38, 5.6), { fill: '#f4f0dc', ink: 1.6, shadow: '#c9c2a8', shadowOffset: [-1, -1], gloss: [{ x: 64.6, y: -39.4, rx: 1.6, ry: 1, alpha: 0.9 }] });
  shape(ctx, (p) => roundRectPath(p, -76, -40, 5, 8, 2), { fill: '#d23a2a', ink: 1.2, shadow: 'none' });
  // rear rack with a crate of lemons
  line(ctx, [[-70, -50], [-84, -50], [-84, -42]], 1.6, '#c9cfd4');
  ctx.save();
  ctx.translate(-80, -50);
  crate(ctx, 22, 10, 10, { seed: 3, aoAlpha: 0, ink: 1.2, content: (ty) => { for (let i = 0; i < 3; i++) lemon(ctx, -6 + i * 6, ty + 4, 3, 0.3, 0.8); } });
  ctx.restore();
}

defineSprite({ id: 'prop.streets.car_cream', w: 184, h: 108, ax: 88, ay: 100, draw: (ctx) => cityCar(ctx, '#e8d6aa') });
defineSprite({ id: 'prop.streets.car_blue', w: 184, h: 108, ax: 88, ay: 100, draw: (ctx) => cityCar(ctx, '#88bcd6') });
defineSprite({ id: 'prop.streets.car_red', w: 184, h: 108, ax: 88, ay: 100, draw: (ctx) => cityCar(ctx, '#c9433a') });

// ---------------------------------------------------------------------------
// Tiny three-wheeled work truck loaded with lemons (generic; side view)
// ---------------------------------------------------------------------------

function threeWheeler(ctx: Ctx, cab: string) {
  ao(ctx, 6, -5, 78, 12, 0.6);
  const sh = shade(cab, 0.26);
  wheel(ctx, -44, -12, 12);
  wheel(ctx, 48, -12, 12);
  // flatbed
  const wood = '#a8743f';
  shape(ctx, (p) => roundRectPath(p, -72, -38, 92, 16, 2), { fill: '#3e4448', ink: 2, shadow: 'none' });
  shape(ctx, (p) => roundRectPath(p, -74, -62, 96, 26, 2), { fill: wood, ink: 2.2, shadow: shade(wood, 0.25), shadowOffset: [-3, -2] });
  clipped(ctx, (p) => p.rect(-74, -62, 96, 26), () => grain(ctx, -74, -62, 96, 26, shade(wood, 0.45), 4, 0, 1, 0.4));
  for (let i = 1; i < 3; i++) line(ctx, [[-73, -62 + i * 8.7], [21, -62 + i * 8.7]], 1, shade(wood, 0.45), false, 0.8);
  // heap of lemons + leaves (and a few oranges)
  const R = rng(9);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9 - j * 2; i++) {
    const lx = -66 + i * 10 + j * 10 + (R() - 0.5) * 3, ly = -64 - j * 6 + (R() - 0.5) * 2;
    if (R() < 0.18) shape(ctx, (p) => circlePath(p, lx, ly, 4.6), { fill: '#f08a24', ink: 1, shadow: '#c4621a', shadowOffset: [-1.2, -1.2] });
    else lemon(ctx, lx, ly, 4.6, (R() - 0.5) * 1.4, 1);
  }
  for (let i = 0; i < 5; i++) leaf(ctx, -60 + i * 18, -78 + (i % 2) * 6, 9, -0.6 + (i % 3) * 0.8, '#3f8c45', 0.8);
  // cab
  shape(ctx, (p) => {
    p.moveTo(22, -16);
    p.lineTo(22, -78);
    p.quadraticCurveTo(24, -88, 36, -88);
    p.lineTo(52, -88);
    p.quadraticCurveTo(62, -86, 66, -62);
    p.quadraticCurveTo(70, -40, 66, -16);
    p.closePath();
  }, { fill: cab, ink: 2.6, shadow: sh, shadowOffset: [-5, -4], gloss: [{ x: 34, y: -80, rx: 8, ry: 2.4, alpha: 0.5 }] });
  // windows
  shape(ctx, (p) => { p.moveTo(30, -56); p.lineTo(30, -78); p.quadraticCurveTo(31, -82, 37, -82); p.lineTo(50, -82); p.quadraticCurveTo(57, -80, 60, -58); p.closePath(); }, { fill: '#9cc6d8', ink: 1.8, shadow: '#6f9fb4', shadowOffset: [-2.4, -2.4] });
  line(ctx, [[36, -60], [44, -80]], 2.6, '#ffffff', false, 0.4);
  // door + handle + front light
  line(ctx, [[30, -52], [30, -20]], 1.2, sh);
  shape(ctx, (p) => roundRectPath(p, 34, -46, 7, 2.4, 1.2), { fill: '#e8eef2', ink: 0.8, shadow: 'none' });
  shape(ctx, (p) => circlePath(p, 64, -50, 4.4), { fill: '#f4f0dc', ink: 1.4, shadow: 'none', gloss: [{ x: 63, y: -51, rx: 1.2, ry: 0.8, alpha: 0.9 }] });
  shape(ctx, (p) => roundRectPath(p, 56, -22, 16, 6, 3), { fill: '#e8eef2', ink: 1.4, shadow: 'none' });
  // fender over the front wheel
  shape(ctx, (p) => { p.moveTo(34, -18); p.quadraticCurveTo(48, -32, 62, -18); p.closePath(); }, { fill: cab, ink: 1.8, shadow: sh, shadowOffset: [-2, -2] });
}

defineSprite({ id: 'prop.streets.ape_blue', w: 168, h: 112, ax: 80, ay: 102, draw: (ctx) => threeWheeler(ctx, '#86b9d4') });
defineSprite({ id: 'prop.streets.ape_red', w: 168, h: 112, ax: 80, ay: 102, draw: (ctx) => threeWheeler(ctx, '#c9433a') });

// ---------------------------------------------------------------------------
// Café table set (marble bistro table + two iron chairs) + umbrella (overhead)
// ---------------------------------------------------------------------------

function bistroChair(ctx: Ctx, x: number, y: number, facing: 1 | -1) {
  const iron = '#2f3a34';
  // legs
  for (const lx of [-6, 6]) line(ctx, [[x + lx, y - 18], [x + lx * 1.1, y]], 3, INK), line(ctx, [[x + lx, y - 18], [x + lx * 1.1, y]], 1.4, iron);
  // backrest loop (on the far side from the table)
  const bx = x - facing * 9;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(bx, y - 32, 5, 12, 0, 0, Math.PI * 2);
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = iron;
  ctx.stroke();
  ctx.restore();
  line(ctx, [[bx, y - 20], [bx, y - 44]], 1, iron);
  // seat
  shape(ctx, (p) => ellipsePath(p, x, y - 19, 10, 4), { fill: '#3c4a42', ink: 1.6, shadow: '#26302a', shadowOffset: [-1.5, -1], gloss: [{ x: x - 3, y: y - 20, rx: 3, ry: 0.8, alpha: 0.4 }] });
}

function cafeSet(ctx: Ctx, cup: boolean) {
  ao(ctx, 4, -10, 50, 15, 0.5);
  bistroChair(ctx, -26, -6, 1);
  // table: iron pedestal + round marble top
  line(ctx, [[0, -4], [0, -32]], 4.4, INK);
  line(ctx, [[0, -4], [0, -32]], 2.4, '#2f3a34');
  for (const s of [-1, 1]) { line(ctx, [[0, -4], [s * 10, 0]], 3.4, INK); line(ctx, [[0, -4], [s * 10, 0]], 1.6, '#2f3a34'); }
  shape(ctx, (p) => ellipsePath(p, 0, -36, 21, 9), { fill: '#efe9e0', ink: 2, shadow: '#c9c0b0', shadowOffset: [-2.4, -2], gloss: [{ x: -7, y: -39, rx: 6, ry: 1.6, alpha: 0.6 }] });
  line(ctx, [[-15, -37], [-4, -40], [6, -35], [14, -38]], 0.5, '#b0a596', true, 0.7);
  if (cup) {
    // espresso cups + sugar
    for (const cx of [-8, 8]) {
      flat(ctx, (p) => ellipsePath(p, cx, -36, 4.4, 1.8), '#ffffff', 0.7, '#8a8178');
      shape(ctx, (p) => { p.moveTo(cx - 2.4, -41); p.lineTo(cx + 2.4, -41); p.lineTo(cx + 2, -37); p.lineTo(cx - 2, -37); p.closePath(); }, { fill: '#ffffff', ink: 0.8, shadow: '#d6d0c6', shadowOffset: [-0.6, 0] });
      flat(ctx, (p) => ellipsePath(p, cx, -41, 2.2, 0.8), '#4a2a1a', 0);
    }
    shape(ctx, (p) => roundRectPath(p, -2, -44, 4, 5, 1), { fill: '#e8d9b0', ink: 0.7, shadow: 'none' });
  } else {
    // a glass of limoncello + a small vase
    flat(ctx, (p) => roundRectPath(p, -9, -44, 4, 6, 1), '#f5e070', 0.7, '#8a7a30');
    shape(ctx, (p) => ellipsePath(p, 6, -40, 3, 4), { fill: '#86b9de', ink: 0.8, shadow: 'none' });
    flat(ctx, (p) => circlePath(p, 6, -46, 2.2), '#d23a3a', 0.5);
  }
  bistroChair(ctx, 26, -6, -1);
  // umbrella pole (canopy is drawn overhead)
  line(ctx, [[3, -36], [3, -118]], 3.4, INK);
  line(ctx, [[3, -36], [3, -118]], 1.8, '#d9d2c2');
  fadeUp(ctx, -96, -120);
}

defineSprite({ id: 'prop.streets.cafe_a', w: 112, h: 130, ax: 56, ay: 120, draw: (ctx) => cafeSet(ctx, true) });
defineSprite({ id: 'prop.streets.cafe_b', w: 112, h: 130, ax: 56, ay: 120, draw: (ctx) => cafeSet(ctx, false) });

function umbrella(ctx: Ctx, a: string, b: string, y0: number) {
  const r = 66, ry = 30;
  const top = y0 - 30;
  // canopy segments (8 panels alternating colour) — 3/4 view cone
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = Math.PI + (i / 8) * Math.PI * 2;
    pts.push([Math.cos(t) * r, y0 + Math.sin(t) * ry]);
  }
  const canopy = (p: Ctx) => {
    p.moveTo(0, top);
    for (let i = 0; i < 8; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      p.lineTo(x1, y1);
      p.quadraticCurveTo((x1 + x2) / 2 * 0.92, (y1 + y2) / 2 + 6, x2, y2);
    }
    p.closePath();
  };
  // draw back-to-front so the panels read
  shape(ctx, (p) => {
    p.moveTo(-r, y0);
    for (let i = 0; i < 8; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      if (i === 0) p.lineTo(x1, y1);
      p.quadraticCurveTo((x1 + x2) / 2 * 0.92, (y1 + y2) / 2 + 6, x2, y2);
    }
    p.lineTo(0, top);
    p.closePath();
  }, { fill: a, ink: 2.4, shadow: 'none' });
  for (let i = 0; i < 8; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const front = (y1 + y2) / 2 > y0;
    const col = i % 2 ? a : b;
    shape(ctx, (p) => { p.moveTo(0, top); p.lineTo(x1, y1); p.quadraticCurveTo((x1 + x2) / 2 * 0.92, (y1 + y2) / 2 + 6, x2, y2); p.closePath(); },
      { fill: front ? col : shade(col, 0.25), ink: 0, shadow: 'none' });
  }
  clipped(ctx, canopy, () => {
    wash(ctx, lgrad(ctx, -r, top, r, y0 + ry, [[0, 'rgba(255,240,210,0.3)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(40,20,30,0.35)']]));
  });
  for (let i = 0; i <= 8; i++) {
    const [x1, y1] = pts[i];
    if (y1 >= y0 - 1) line(ctx, [[0, top], [x1, y1]], 1, shade(a, 0.4), false, 0.5);
  }
  // valance scallops along the front
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12;
    const ang = Math.PI * t;
    const x = Math.cos(Math.PI - ang) * r * 0.98, y = y0 + Math.sin(ang) * ry * 0.98;
    shape(ctx, (p) => { p.moveTo(x - 6, y - 1); p.quadraticCurveTo(x, y + 8, x + 6, y - 1); p.closePath(); }, { fill: i % 2 ? b : a, ink: 1, shadow: 'none' });
  }
  shape(ctx, (p) => circlePath(p, 0, top - 2, 3.2), { fill: '#d9d2c2', ink: 1.4, shadow: 'none' });
}

function umbrellaSprite(a: string, b: string) {
  return (ctx: Ctx) => {
    umbrella(ctx, a, b, -126);
    fadeAll(ctx, 0.86);
  };
}
defineSprite({ id: 'prop.streets.umbrella_green', w: 150, h: 96, ax: 75, ay: 196, draw: umbrellaSprite('#2f7a52', '#f2ead8') });
defineSprite({ id: 'prop.streets.umbrella_red', w: 150, h: 96, ax: 75, ay: 196, draw: umbrellaSprite('#c23a32', '#f2ead8') });
defineSprite({ id: 'prop.streets.umbrella_cream', w: 150, h: 96, ax: 75, ay: 196, draw: umbrellaSprite('#efe2c2', '#d9c49a') });

defineSprite({
  id: 'prop.streets.umbrella_shadow',
  w: 190, h: 110, ax: 95, ay: 55,
  draw: (ctx) => softShape(ctx, (p) => ellipsePath(p, 0, 0, 72, 34), 12, 'rgba(15,12,30,0.32)'),
});

// ---------------------------------------------------------------------------
// Market stall (frutta e verdura) with striped awning
// ---------------------------------------------------------------------------

function produceCrate(ctx: Ctx, x: number, y: number, w: number, kind: 'tom' | 'lem' | 'pep' | 'egg' | 'ora', seed: number) {
  const wood = '#b9824d';
  shape(ctx, (p) => { p.moveTo(x - w / 2, y - 16); p.lineTo(x + w / 2, y - 16); p.lineTo(x + w / 2 - 2, y); p.lineTo(x - w / 2 + 2, y); p.closePath(); }, { fill: wood, ink: 1.6, shadow: shade(wood, 0.25), shadowOffset: [-1.5, -1.5] });
  clipped(ctx, (p) => p.rect(x - w / 2, y - 16, w, 16), () => grain(ctx, x - w / 2, y - 16, w, 16, shade(wood, 0.45), seed, 0, 1, 0.4));
  line(ctx, [[x - w / 2 + 1, y - 8], [x + w / 2 - 1, y - 8]], 1, shade(wood, 0.4));
  const R = rng(seed);
  const n = Math.floor(w / 9);
  for (let j = 0; j < 2; j++) for (let i = 0; i < n; i++) {
    const px = x - w / 2 + 6 + i * ((w - 12) / Math.max(1, n - 1)) + (j ? 3 : 0) + (R() - 0.5) * 2;
    const py = y - 17 - j * 6 + (R() - 0.5) * 2;
    if (j && i === n - 1) continue;
    if (kind === 'tom') tomato(ctx, px, py, 4.6, i * 3 + j, 1);
    else if (kind === 'lem') lemon(ctx, px, py, 4, (R() - 0.5), 1);
    else if (kind === 'ora') shape(ctx, (p) => circlePath(p, px, py, 4.6), { fill: '#f08a24', ink: 1, shadow: '#c4621a', shadowOffset: [-1.2, -1.2], gloss: [{ x: px - 1.5, y: py - 1.6, rx: 1.2, ry: 0.7, alpha: 0.7 }] });
    else if (kind === 'pep') shape(ctx, (p) => roundRectPath(p, px - 4, py - 4.5, 8, 9, 3.4), { fill: R() < 0.5 ? '#d6382a' : '#e8b726', ink: 1, shadowOffset: [-1.2, -1.2], gloss: [{ x: px - 1.6, y: py - 2, rx: 1, ry: 2, alpha: 0.5 }] });
    else shape(ctx, (p) => ellipsePath(p, px, py, 4.4, 6, 0.4), { fill: '#5a2d6b', ink: 1, shadowOffset: [-1.2, -1.2], gloss: [{ x: px - 1.4, y: py - 2, rx: 1, ry: 2.4, alpha: 0.5 }] });
  }
}

defineSprite({
  id: 'prop.streets.stall',
  w: 228, h: 196, ax: 112, ay: 184,
  draw: (ctx) => {
    const W = 196, SD = 52;
    const x0 = -W / 2;
    const wood = '#8a5a34';
    aoRect(ctx, x0 - 4, -SD - 4, W + 16, SD + 12, 9, 0.55, 6);
    // back posts
    for (const px of [x0 + 6, x0 + W - 6]) { line(ctx, [[px, -SD], [px, -170]], 6, INK); line(ctx, [[px, -SD], [px, -170]], 3.6, shade(wood, 0.15)); }
    // table body
    shape(ctx, (p) => roundRectPath(p, x0, -46, W, 46, 2), { fill: wood, ink: 2.6, shadow: shade(wood, 0.25), shadowOffset: [-3, -2] });
    clipped(ctx, (p) => p.rect(x0, -46, W, 46), () => grain(ctx, x0, -46, W, 46, shade(wood, 0.5), 3, 0, 1, 0.35));
    for (let i = 1; i < 5; i++) line(ctx, [[x0 + 1, -46 + i * 9.2], [x0 + W - 1, -46 + i * 9.2]], 1, shade(wood, 0.45), false, 0.7);
    // tilted display of crates
    shape(ctx, (p) => roundRectPath(p, x0 - 2, -SD - 50, W + 4, 54, 3), { fill: shade(wood, 0.2), ink: 2.2, shadow: 'none' });
    produceCrate(ctx, -66, -SD - 22, 56, 'tom', 3);
    produceCrate(ctx, -4, -SD - 22, 56, 'lem', 5);
    produceCrate(ctx, 60, -SD - 22, 56, 'pep', 7);
    produceCrate(ctx, -36, -SD + 4, 52, 'egg', 9);
    produceCrate(ctx, 28, -SD + 4, 56, 'ora', 11);
    // chalk price tags on sticks
    for (const tx of [-66, 30]) {
      line(ctx, [[tx, -SD - 30], [tx, -SD - 44]], 1.2, '#6a4a2a');
      shape(ctx, (p) => roundRectPath(p, tx - 9, -SD - 54, 18, 11, 1.5), { fill: '#2f3a34', ink: 1.2, shadow: 'none' });
      strokeText(ctx, tx < 0 ? '2$' : '1$', tx, -SD - 51.5, 5.4, '#f2ead8', 0.9);
    }
    // front posts
    for (const px of [x0 + 2, x0 + W - 2]) { line(ctx, [[px, -2], [px, -150]], 6.4, INK); line(ctx, [[px, -2], [px, -150]], 3.8, wood); line(ctx, [[px - 1, -4], [px - 1, -148]], 0.9, light(wood, 0.3), false, 0.7); }
    // striped awning
    const ay0 = -176, ay1 = -146;
    const aw = (p: Ctx) => { p.moveTo(x0 - 10, ay1); p.lineTo(x0 + 6, ay0); p.lineTo(x0 + W - 6, ay0); p.lineTo(x0 + W + 10, ay1); p.closePath(); };
    shape(ctx, aw, { fill: '#f3ebdd', ink: 2.4, shadow: 'none' });
    clipped(ctx, aw, () => {
      for (let i = -1; i < 12; i++) {
        const sx = x0 - 10 + i * 20;
        ctx.fillStyle = '#2f7a52';
        ctx.beginPath();
        ctx.moveTo(sx, ay1);
        ctx.lineTo(sx + 1.4 + 10 * 0.86, ay0);
        ctx.lineTo(sx + 11.4 + 10 * 0.86 * 0, ay0);
        ctx.lineTo(sx + 10, ay1);
        ctx.closePath();
        ctx.fill();
      }
      wash(ctx, lgrad(ctx, 0, ay0, 0, ay1, [[0, 'rgba(255,240,210,0.25)'], [1, 'rgba(40,20,20,0.2)']]));
    });
    // scalloped valance
    for (let i = 0; i < 11; i++) {
      const vx = x0 - 8 + i * ((W + 16) / 11);
      const vw = (W + 16) / 11;
      shape(ctx, (p) => { p.moveTo(vx, ay1); p.lineTo(vx + vw, ay1); p.quadraticCurveTo(vx + vw / 2, ay1 + 12, vx, ay1); p.closePath(); }, { fill: i % 2 ? '#f3ebdd' : '#2f7a52', ink: 1.4, shadow: 'none' });
    }
    // hanging scale + garlic bunch
    line(ctx, [[60, ay1], [60, ay1 + 22]], 1, '#3a3230');
    shape(ctx, (p) => circlePath(p, 60, ay1 + 28, 6.5), { fill: '#d8b25a', ink: 1.4, shadow: '#a8822a', shadowOffset: [-1, -1] });
    flat(ctx, (p) => circlePath(p, 60, ay1 + 28, 4.4), '#f6f0e2', 0.6);
    line(ctx, [[60, ay1 + 28], [62.6, ay1 + 25.4]], 0.8, '#c0392b');
    line(ctx, [[-50, ay1], [-50, ay1 + 14]], 1, '#3a3230');
    for (let i = 0; i < 5; i++) shape(ctx, (p) => ellipsePath(p, -50 + (i % 2 ? 3 : -3), ay1 + 17 + i * 5, 3.6, 3.2), { fill: '#f3ead8', ink: 1, shadow: '#cdbfa8', shadowOffset: [-0.8, -0.8] });
  },
});

// ---------------------------------------------------------------------------
// Lemon-soda kiosk ("acquafrescaio") — lemons piled and hanging
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.streets.kiosk',
  w: 170, h: 210, ax: 84, ay: 198,
  draw: (ctx) => {
    const W = 144, KD = 50;
    const x0 = -W / 2;
    aoRect(ctx, x0 - 4, -KD - 4, W + 16, KD + 12, 9, 0.55, 6);
    // counter body (tiled marble + green panels)
    shape(ctx, (p) => roundRectPath(p, x0, -64, W, 64, 3), { fill: '#2f7a52', ink: 2.6, shadow: '#225a3c', shadowOffset: [-3, -2] });
    for (let i = 0; i < 4; i++) {
      const px = x0 + 8 + i * ((W - 16) / 4);
      shape(ctx, (p) => roundRectPath(p, px + 2, -54, (W - 16) / 4 - 4, 44, 3), { fill: '#3a8a60', ink: 1, inkColor: '#1e4a32', shadow: '#2a6a48', shadowOffset: [-1.5, -1.5] });
      flat(ctx, (p) => circlePath(p, px + (W - 16) / 8, -32, 6), '#f5d43a', 0.8);
      flat(ctx, (p) => ellipsePath(p, px + (W - 16) / 8 - 1.6, -34, 2, 1.2), '#fff6b0', 0);
    }
    // marble counter top with glasses, siphon, piles of lemons
    shape(ctx, (p) => roundRectPath(p, x0 - 4, -64 - KD + 4, W + 8, KD - 2, 3), { fill: '#efe9e0', ink: 2.2, shadow: '#c9c0b0', shadowOffset: [-2, -2] });
    const ty = -64 - KD + 4;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6 - j; i++) lemon(ctx, x0 + 20 + i * 9 + j * 4.5, ty + 32 - j * 6, 4.4, 0.2 * (i - 2), 1);
    for (let k = 0; k < 4; k++) {
      const gx = 16 + k * 10;
      shape(ctx, (p) => { p.moveTo(gx - 3.2, ty + 18); p.lineTo(gx + 3.2, ty + 18); p.lineTo(gx + 2.6, ty + 28); p.lineTo(gx - 2.6, ty + 28); p.closePath(); }, { fill: 'rgba(235,245,250,0.7)', ink: 0.9, shadow: 'none' });
      flat(ctx, (p) => p.rect(gx - 2.4, ty + 22, 4.8, 5.6), '#f5e070', 0);
    }
    // seltzer siphon
    shape(ctx, (p) => roundRectPath(p, 54, ty + 4, 9, 24, 3), { fill: '#7fb8d8', ink: 1.2, shadow: '#5a92b4', shadowOffset: [-1.5, 0], gloss: [{ x: 56.4, y: ty + 14, rx: 0.9, ry: 6, alpha: 0.7 }] });
    shape(ctx, (p) => roundRectPath(p, 52, ty - 2, 13, 7, 2), { fill: '#c9cfd4', ink: 1.2, shadow: 'none' });
    // posts + canopy
    for (const px of [x0 + 4, x0 + W - 4]) { line(ctx, [[px, -64 - KD + 6], [px, -176]], 5.6, INK); line(ctx, [[px, -64 - KD + 6], [px, -176]], 3.2, '#d8b25a'); }
    const cy0 = -196, cy1 = -170;
    const can = (p: Ctx) => { p.moveTo(x0 - 12, cy1); p.lineTo(x0 + 4, cy0); p.lineTo(x0 + W - 4, cy0); p.lineTo(x0 + W + 12, cy1); p.closePath(); };
    shape(ctx, can, { fill: '#f5d43a', ink: 2.4, shadow: 'none' });
    clipped(ctx, can, () => {
      for (let i = -1; i < 10; i++) {
        const sx = x0 - 12 + i * 20;
        ctx.fillStyle = '#f3ebdd';
        ctx.beginPath();
        ctx.moveTo(sx, cy1); ctx.lineTo(sx + 9, cy0); ctx.lineTo(sx + 19, cy0); ctx.lineTo(sx + 10, cy1);
        ctx.closePath();
        ctx.fill();
      }
      wash(ctx, lgrad(ctx, 0, cy0, 0, cy1, [[0, 'rgba(255,250,220,0.25)'], [1, 'rgba(80,50,0,0.2)']]));
    });
    // hanging lemon bunches with leaves (the kiosk's trademark)
    for (const hx of [x0 + 10, x0 + 34, W / 2 - 34, W / 2 - 10]) {
      line(ctx, [[hx, cy1], [hx, cy1 + 10]], 1, '#5a4a2a');
      leaf(ctx, hx - 1, cy1 + 10, 9, 2.2, '#3f8c45', 0.8);
      leaf(ctx, hx + 1, cy1 + 10, 9, 0.9, '#2f7a3a', 0.8);
      lemon(ctx, hx - 3, cy1 + 16, 4.6, 1.2, 1.1);
      lemon(ctx, hx + 4, cy1 + 19, 4.6, 1.8, 1.1);
      lemon(ctx, hx, cy1 + 25, 4.6, 1.5, 1.1);
    }
    // sign board
    shape(ctx, (p) => roundRectPath(p, -40, cy0 - 14, 80, 16, 3), { fill: '#2f7a52', ink: 2, shadowOffset: [-1.5, -1.5] });
    strokeText(ctx, 'LIMONATA', 0, cy0 - 10.5, 7.5, '#f5d43a', 1.4);
  },
});

// ---------------------------------------------------------------------------
// Street lamp, fountain, geraniums, bicycle, pigeons
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.streets.lamp',
  w: 64, h: 262, ax: 32, ay: 252,
  draw: (ctx) => {
    ao(ctx, 3, -4, 18, 6, 0.6);
    const iron = '#2c3330';
    // fluted base
    shape(ctx, (p) => { p.moveTo(-11, 0); p.lineTo(-8, -32); p.lineTo(8, -32); p.lineTo(11, 0); p.closePath(); }, { fill: iron, ink: 2.2, shadow: '#1a1f1d', shadowOffset: [-3, 0], gloss: [{ x: -5, y: -16, rx: 1.4, ry: 10, alpha: 0.3 }] });
    shape(ctx, (p) => roundRectPath(p, -9, -38, 18, 7, 3), { fill: iron, ink: 1.8, shadowOffset: [-1.5, -1] });
    // post
    shape(ctx, (p) => p.rect(-3.4, -196, 6.8, 160), { fill: iron, ink: 2, shadow: '#1a1f1d', shadowOffset: [-2.4, 0], gloss: [{ x: -1.6, y: -120, rx: 0.8, ry: 60, alpha: 0.35 }] });
    for (const ky of [-80, -150]) shape(ctx, (p) => roundRectPath(p, -6, ky, 12, 5, 2.5), { fill: iron, ink: 1.6, shadow: 'none' });
    // lantern
    const ly = -206;
    bloom(ctx, 0, ly - 8, 44, '#ffc46a', 0.5);
    shape(ctx, (p) => { p.moveTo(-13, ly - 24); p.lineTo(13, ly - 24); p.lineTo(9, ly + 4); p.lineTo(-9, ly + 4); p.closePath(); }, { fill: '#ffd98a', ink: 2, shadow: '#f0b04a', shadowOffset: [-3, 0] });
    clipped(ctx, (p) => { p.moveTo(-13, ly - 24); p.lineTo(13, ly - 24); p.lineTo(9, ly + 4); p.lineTo(-9, ly + 4); p.closePath(); }, () => {
      line(ctx, [[0, ly - 24], [0, ly + 4]], 1.6, iron);
      bloom(ctx, 0, ly - 8, 12, '#ffffff', 0.7);
    });
    shape(ctx, (p) => { p.moveTo(-17, ly - 24); p.lineTo(17, ly - 24); p.lineTo(6, ly - 36); p.lineTo(-6, ly - 36); p.closePath(); }, { fill: iron, ink: 2, shadowOffset: [-2, -1] });
    shape(ctx, (p) => circlePath(p, 0, ly - 39, 3.4), { fill: iron, ink: 1.6, shadow: 'none' });
    shape(ctx, (p) => roundRectPath(p, -10, ly + 3, 20, 5, 2), { fill: iron, ink: 1.6, shadow: 'none' });
    // scroll bracket
    line(ctx, [[-3, -186], [-12, -192], [-10, -200]], 2.6, INK, true);
    line(ctx, [[3, -186], [12, -192], [10, -200]], 2.6, INK, true);
  },
});

function fountainDraw(ctx: Ctx, f: number) {
  const rx = 92, ry = 40, cy = -46;
  ao(ctx, 6, cy + 10, rx + 16, ry + 16, 0.55);
  const stone = '#c9bca4';
  // outer basin wall (front)
  const wall = (p: Ctx) => {
    p.moveTo(-rx, cy);
    p.lineTo(-rx, cy + 16);
    p.ellipse(0, cy + 16, rx, ry, 0, Math.PI, 0, true);
    p.lineTo(rx, cy);
    p.ellipse(0, cy, rx, ry, 0, 0, Math.PI, true);
    p.closePath();
  };
  shape(ctx, wall, { fill: stone, ink: 2.8, shadow: 'none' });
  clipped(ctx, wall, () => {
    wash(ctx, lgrad(ctx, -rx, 0, rx, 0, [[0, '#ddd2bc'], [0.3, stone], [1, '#8f826e']]));
    for (let i = -6; i <= 6; i++) {
      const xx = i * 14;
      const yy = cy + 16 + Math.sqrt(Math.max(0, 1 - (xx / rx) ** 2)) * ry;
      line(ctx, [[xx, yy - 16], [xx, yy]], 1, '#8a7c66', false, 0.6);
    }
    speckle(ctx, 0, cy + 30, rx, 20, 60, '#6a5e4c', 0.8, 4, 0.35);
  });
  // rim (top of wall)
  shape(ctx, (p) => { ellipsePath(p, 0, cy, rx, ry); }, { fill: '#ddd2bc', ink: 2.4, shadow: 'none' });
  // water
  const water = (p: Ctx) => ellipsePath(p, 0, cy + 1, rx - 9, ry - 6);
  shape(ctx, water, { fill: '#5d9fae', ink: 1.6, inkColor: '#5a5040', shadow: 'none' });
  clipped(ctx, water, () => {
    wash(ctx, lgrad(ctx, 0, cy - ry, 0, cy + ry, [[0, '#3f7a8c'], [1, '#7fc0c8']]));
    // ripples (animated)
    for (let k = 0; k < 3; k++) {
      const rr = ((k * 0.33 + f * 0.11) % 1) * (rx - 12);
      ctx.beginPath();
      ellipsePath(ctx, 0, cy + 2, rr + 18, (rr + 18) * 0.42);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();
    }
    line(ctx, [[-60, cy - 6], [-30, cy - 14]], 2, '#ffffff', true, 0.4);
    // coins at the bottom
    for (const [cx2, cy2] of [[-40, 8], [30, 12], [52, 2], [-18, 16]] as const) flat(ctx, (p) => ellipsePath(p, cx2, cy + cy2, 2.4, 1.3), '#d8b25a', 0.4, '#6a5a2a');
  });
  // central pedestal + upper basin + spout
  shape(ctx, (p) => { p.moveTo(-14, cy + 6); p.lineTo(-9, cy - 58); p.lineTo(9, cy - 58); p.lineTo(14, cy + 6); p.closePath(); }, { fill: stone, ink: 2.4, shadow: '#9a8d76', shadowOffset: [-4, 0] });
  shape(ctx, (p) => { p.moveTo(-34, cy - 62); p.quadraticCurveTo(0, cy - 40, 34, cy - 62); p.closePath(); }, { fill: '#d6caB2'.toLowerCase(), ink: 2.2, shadow: '#a89a82', shadowOffset: [-3, -2] });
  shape(ctx, (p) => ellipsePath(p, 0, cy - 62, 34, 10), { fill: '#6fb0bc', ink: 2, inkColor: INK, shadow: 'none' });
  // water curtain from the upper basin (animated streaks)
  for (let i = -3; i <= 3; i++) {
    const xx = i * 9;
    const y0 = cy - 56 + Math.abs(i) * 0.8;
    const ph = (f + i) % 3;
    line(ctx, [[xx, y0], [xx * 1.25, cy - 18 + ph * 2]], 2.4, '#bfe6ee', true, 0.55);
    line(ctx, [[xx, y0], [xx * 1.25, cy - 18 + ph * 2]], 0.9, '#ffffff', true, 0.7);
  }
  // top spout (pine cone / pigna) with a jet
  shape(ctx, (p) => { p.moveTo(-5, cy - 64); p.quadraticCurveTo(-7, cy - 78, 0, cy - 86); p.quadraticCurveTo(7, cy - 78, 5, cy - 64); p.closePath(); }, { fill: '#b7a98e', ink: 1.8, shadow: '#8a7c66', shadowOffset: [-1.5, 0] });
  for (const s of [-1, 1]) {
    line(ctx, [[0, cy - 86], [s * 8, cy - 98 - (f % 2)], [s * 18, cy - 70]], 2.2, '#bfe6ee', true, 0.6);
    line(ctx, [[0, cy - 86], [s * 8, cy - 98 - (f % 2)], [s * 18, cy - 70]], 0.8, '#ffffff', true, 0.8);
  }
  // splashes on the water
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.28 + f;
    flat(ctx, (p) => circlePath(p, Math.cos(a) * 30, cy - 10 + Math.sin(a) * 9, 1.4), '#ffffff', 0);
  }
}

defineSprite({ id: 'prop.streets.fountain', w: 224, h: 196, ax: 112, ay: 180, frames: 3, draw: fountainDraw });

function geraniumPot(ctx: Ctx, x: number, y: number, s: number, flower: string, seed: number) {
  const terra = '#c56a43';
  shape(ctx, (p) => { p.moveTo(x - 9 * s, y - 16 * s); p.lineTo(x + 9 * s, y - 16 * s); p.lineTo(x + 7 * s, y); p.quadraticCurveTo(x, y + 1.5, x - 7 * s, y); p.closePath(); }, { fill: terra, ink: 1.6, shadow: shade(terra, 0.3), shadowOffset: [-2.4 * s, -1] });
  shape(ctx, (p) => roundRectPath(p, x - 10.5 * s, y - 19 * s, 21 * s, 4.4 * s, 2), { fill: light(terra, 0.1), ink: 1.4, shadowOffset: [-1, -1] });
  const R = rng(seed);
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (R() - 0.5) * 2.6;
    leaf(ctx, x + Math.cos(a) * 3 * s, y - 20 * s + Math.sin(a) * 2, 8 * s, a, R() < 0.5 ? '#4f9a4a' : '#3a8a40', 0.8, false);
  }
  for (let i = 0; i < 4; i++) {
    const fx = x + (R() - 0.5) * 16 * s, fy = y - 26 * s - R() * 8 * s;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * 6.28;
      shape(ctx, (p) => circlePath(p, fx + Math.cos(a) * 2.6 * s, fy + Math.sin(a) * 2.2 * s, 2 * s), { fill: k % 2 ? flower : light(flower, 0.15), ink: 0.7, shadow: 'none' });
    }
    flat(ctx, (p) => circlePath(p, fx, fy, 1.2 * s), light(flower, 0.5), 0);
  }
}

defineSprite({
  id: 'prop.streets.geraniums',
  w: 92, h: 70, ax: 44, ay: 60,
  draw: (ctx) => {
    ao(ctx, 3, -5, 40, 9, 0.5);
    geraniumPot(ctx, -22, -6, 1, '#d8283a', 3);
    geraniumPot(ctx, 22, -4, 0.9, '#e8507a', 5);
    geraniumPot(ctx, 0, 0, 1.15, '#d8283a', 7);
  },
});

defineSprite({
  id: 'prop.streets.geranium',
  w: 50, h: 64, ax: 24, ay: 56,
  draw: (ctx) => {
    ao(ctx, 2, -3, 18, 6, 0.5);
    geraniumPot(ctx, 0, 0, 1.15, '#e04060', 11);
  },
});

defineSprite({
  id: 'prop.streets.bicycle',
  w: 96, h: 70, ax: 46, ay: 62,
  draw: (ctx) => {
    ao(ctx, 3, -3, 42, 7, 0.45);
    const frame = '#2f6a8a';
    for (const wx of [-28, 28]) {
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, wx, -17, 16);
      ctx.lineWidth = 4.4;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#3a3434';
      ctx.stroke();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#c9cfd4';
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 15, -17 + Math.sin(a) * 15); ctx.lineTo(wx - Math.cos(a) * 15, -17 - Math.sin(a) * 15); ctx.stroke(); }
      ctx.restore();
    }
    const pts: [number, number][][] = [[[-28, -17], [-4, -18], [-12, -40]], [[-4, -18], [22, -40], [-12, -40]], [[22, -40], [28, -17]], [[22, -40], [20, -50]]];
    for (const pl of pts) { line(ctx, pl, 4, INK); line(ctx, pl, 2.2, frame); }
    line(ctx, [[14, -52], [26, -50]], 3.6, INK);
    line(ctx, [[14, -52], [26, -50]], 1.8, '#c9cfd4');
    shape(ctx, (p) => ellipsePath(p, -13, -43, 7, 2.6), { fill: '#3a2a22', ink: 1.4, shadow: 'none' });
    // front basket with bread + flowers
    shape(ctx, (p) => roundRectPath(p, 24, -62, 18, 12, 2), { fill: '#c99a55', ink: 1.4, shadowOffset: [-1.5, -1] });
    line(ctx, [[28, -62], [24, -72]], 2.6, '#d6913f');
    line(ctx, [[33, -62], [31, -74]], 2.6, '#e2a654');
    flat(ctx, (p) => circlePath(p, 38, -64, 2.4), '#d8283a', 0.6);
  },
});

function pigeon(ctx: Ctx, f: number) {
  const body = '#8a8f9e';
  const peck = f === 1;
  shape(ctx, (p) => ellipsePath(p, 0, -6, 8, 5), { fill: body, ink: 1.4, shadow: '#6a6e7c', shadowOffset: [-1.5, -1.5], gloss: [{ x: -2, y: -8, rx: 3, ry: 1, alpha: 0.3 }] });
  // tail
  shape(ctx, (p) => { p.moveTo(-6, -7); p.lineTo(-13, -9); p.lineTo(-12, -4); p.closePath(); }, { fill: '#6a6e7c', ink: 1.1, shadow: 'none' });
  // wing bars
  line(ctx, [[-3, -7], [2, -5]], 1, '#4a4e5a');
  line(ctx, [[-2, -5], [3, -3.5]], 1, '#4a4e5a');
  // head + iridescent neck
  const hx = peck ? 8 : 6, hy = peck ? -3 : -12;
  shape(ctx, (p) => circlePath(p, hx, hy, 3.6), { fill: '#7a8090', ink: 1.2, shadow: 'none' });
  flat(ctx, (p) => ellipsePath(p, hx - 1.8, hy + 2.6, 2.6, 1.8), '#5aa08a', 0);
  flat(ctx, (p) => circlePath(p, hx + 1.2, hy - 0.6, 0.8), '#e86a2a', 0);
  flat(ctx, (p) => { p.moveTo(hx + 3, hy); p.lineTo(hx + 5.6, hy + 0.8); p.lineTo(hx + 3, hy + 1.4); p.closePath(); }, '#3a3434', 0);
  // legs
  line(ctx, [[-1, -1.5], [-1.4, 0.5]], 1, '#d8664a');
  line(ctx, [[2, -1.5], [2.4, 0.5]], 1, '#d8664a');
}

defineSprite({ id: 'prop.streets.pigeon', w: 32, h: 24, ax: 14, ay: 20, frames: 2, draw: pigeon });

// ---------------------------------------------------------------------------
// Laundry line (overhead, semi-transparent) + its soft ground shadow
// ---------------------------------------------------------------------------

const LW = 460;

function laundryPieces(seed: number) {
  const R = rng(seed);
  const items: { x: number; kind: number; col: string; w: number }[] = [];
  let x = -LW / 2 + 30;
  const cols = ['#f4f1e8', '#3f6aa8', '#d23a3a', '#f2d24a', '#7fc2e8', '#e8e0f0', '#2f8a5a', '#f08ab0'];
  while (x < LW / 2 - 40) {
    const kind = Math.floor(R() * 6);
    const w = [34, 26, 14, 46, 30, 22][kind];
    items.push({ x: x + w / 2, kind, col: cols[Math.floor(R() * cols.length)], w });
    x += w + 6 + R() * 16;
  }
  return items;
}

function sagY(x: number) {
  const t = (x + LW / 2) / LW;
  return 4 * t * (1 - t) * 26; // parabola sag
}

function laundryDraw(ctx: Ctx, seed: number, shadowOnly: boolean) {
  const items = laundryPieces(seed);
  const base = -150;
  const draw = (k: { x: number; kind: number; col: string; w: number }, y: number, sh: boolean) => {
    const st = sh ? 'rgba(10,10,30,1)' : k.col;
    const ink = sh ? 0 : 1.6;
    const S = (b: (p: Ctx) => void, extra: Partial<Parameters<typeof shape>[2]> = {}) => shape(ctx, b, { fill: st, ink, shadow: sh ? 'none' : shade(k.col, 0.22), shadowOffset: [-3, -2], ...extra });
    const x = k.x;
    if (k.kind === 0) {
      // shirt
      S((p) => { p.moveTo(x - 12, y); p.lineTo(x + 12, y); p.lineTo(x + 18, y + 9); p.lineTo(x + 13, y + 12); p.lineTo(x + 11, y + 8); p.lineTo(x + 11, y + 34); p.lineTo(x - 11, y + 34); p.lineTo(x - 11, y + 8); p.lineTo(x - 13, y + 12); p.lineTo(x - 18, y + 9); p.closePath(); });
      if (!sh) { line(ctx, [[x, y + 1], [x, y + 33]], 0.8, shade(k.col, 0.3), false, 0.7); for (let i = 0; i < 4; i++) flat(ctx, (p) => circlePath(p, x + 1.6, y + 6 + i * 7, 0.9), shade(k.col, 0.4), 0); }
    } else if (k.kind === 1) {
      // trousers
      S((p) => { p.moveTo(x - 11, y); p.lineTo(x + 11, y); p.lineTo(x + 12, y + 40); p.lineTo(x + 3, y + 40); p.lineTo(x, y + 12); p.lineTo(x - 3, y + 40); p.lineTo(x - 12, y + 40); p.closePath(); });
    } else if (k.kind === 2) {
      // pair of socks
      for (const dx of [-4, 4]) S((p) => { p.moveTo(x + dx - 3, y); p.lineTo(x + dx + 3, y); p.lineTo(x + dx + 3, y + 12); p.quadraticCurveTo(x + dx + 8, y + 14, x + dx + 6, y + 18); p.lineTo(x + dx - 1, y + 17); p.quadraticCurveTo(x + dx - 3, y + 15, x + dx - 3, y + 12); p.closePath(); });
    } else if (k.kind === 3) {
      // bedsheet / towel with stripes
      S((p) => { p.moveTo(x - 23, y); p.lineTo(x + 23, y); p.lineTo(x + 22, y + 44); p.quadraticCurveTo(x, y + 48, x - 22, y + 44); p.closePath(); });
      if (!sh) clipped(ctx, (p) => { p.moveTo(x - 23, y); p.lineTo(x + 23, y); p.lineTo(x + 22, y + 44); p.quadraticCurveTo(x, y + 48, x - 22, y + 44); p.closePath(); }, () => {
        for (const yy of [8, 30]) { ctx.fillStyle = rgba('#d23a3a', 0.8); ctx.fillRect(x - 24, y + yy, 48, 3); ctx.fillStyle = rgba('#2f8a5a', 0.8); ctx.fillRect(x - 24, y + yy + 4, 48, 2); }
      });
    } else if (k.kind === 4) {
      // football shirt (sky blue, generic, no logo) or dress
      S((p) => { p.moveTo(x - 10, y); p.lineTo(x + 10, y); p.lineTo(x + 16, y + 7); p.lineTo(x + 11, y + 12); p.lineTo(x + 10, y + 32); p.lineTo(x - 10, y + 32); p.lineTo(x - 11, y + 12); p.lineTo(x - 16, y + 7); p.closePath(); }, sh ? {} : { fill: '#7fc2e8', shadow: '#5a9ac4' });
      if (!sh) strokeText(ctx, '10', x, y + 10, 9, '#f4f1e8', 1.8);
    } else {
      // little dress
      S((p) => { p.moveTo(x - 6, y); p.lineTo(x + 6, y); p.lineTo(x + 8, y + 10); p.lineTo(x + 13, y + 30); p.quadraticCurveTo(x, y + 34, x - 13, y + 30); p.lineTo(x - 8, y + 10); p.closePath(); });
      if (!sh) for (let i = 0; i < 5; i++) flat(ctx, (p) => circlePath(p, x - 6 + i * 3, y + 16 + (i % 2) * 6, 1.2), '#ffffff', 0);
    }
    // pegs
    if (!sh) for (const dx of [-k.w / 2 + 3, k.w / 2 - 3]) flat(ctx, (p) => roundRectPath(p, x + dx - 1.2, y - 3, 2.4, 6, 1), '#d9b47a', 0.6);
  };
  if (shadowOnly) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    softShape(ctx, (p) => {
      p.moveTo(-LW / 2, base + sagY(-LW / 2) - 0.6);
      for (let x = -LW / 2; x <= LW / 2; x += 20) p.lineTo(x, base + sagY(x) - 0.6);
      for (let x = LW / 2; x >= -LW / 2; x -= 20) p.lineTo(x, base + sagY(x) + 0.6);
      p.closePath();
    }, 3, 'rgba(10,10,30,1)');
    ctx.restore();
    // garments as a blurred silhouette
    ctx.save();
    ctx.globalAlpha = 0.26;
    for (const k of items) {
      const y = base + sagY(k.x);
      softShape(ctx, (p) => roundRectPath(p, k.x - k.w / 2, y, k.w, k.kind === 2 ? 18 : k.kind === 3 ? 46 : k.kind === 1 ? 40 : 32, 4), 5, 'rgba(10,10,30,1)');
    }
    ctx.restore();
    return;
  }
  // rope
  ctx.save();
  ctx.beginPath();
  for (let x = -LW / 2; x <= LW / 2; x += 10) {
    const y = base + sagY(x);
    if (x === -LW / 2) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#e8e0cc';
  ctx.stroke();
  ctx.restore();
  for (const k of items) draw(k, base + sagY(k.x) + 1, false);
  // ends fade out (the walls are off-screen)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createLinearGradient(-LW / 2, 0, LW / 2, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.07, 'rgba(0,0,0,1)');
  g.addColorStop(0.93, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-LW / 2 - 10, -400, LW + 20, 800);
  ctx.restore();
  fadeAll(ctx, 0.84);
}

for (let i = 0; i < 3; i++) {
  defineSprite({ id: `prop.streets.laundry_${i}`, w: LW + 10, h: 110, ax: LW / 2 + 5, ay: 166, res: 1.5, draw: (ctx) => laundryDraw(ctx, 11 + i * 7, false) });
  defineSprite({ id: `prop.streets.laundry_shadow_${i}`, w: LW + 30, h: 130, ax: LW / 2 + 15, ay: 176, res: 1, draw: (ctx) => laundryDraw(ctx, 11 + i * 7, true) });
}

// ---------------------------------------------------------------------------
// Festoon string lights ("luminarie") strung overhead — warm bulbs, light source
// ---------------------------------------------------------------------------

function festoon(ctx: Ctx, seed: number) {
  const base = -170;
  const sag = (x: number) => { const t = (x + LW / 2) / LW; return 4 * t * (1 - t) * 34; };
  ctx.save();
  ctx.beginPath();
  for (let x = -LW / 2; x <= LW / 2; x += 10) { const y = base + sag(x); if (x === -LW / 2) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1c1a1e';
  ctx.stroke();
  ctx.restore();
  const R = rng(seed);
  const cols = ['#ffd27a', '#ffb45a', '#fff0b0', '#ff9a6a'];
  for (let x = -LW / 2 + 22; x < LW / 2 - 16; x += 26) {
    const y = base + sag(x) + 2;
    const c = cols[Math.floor(R() * cols.length)];
    bloom(ctx, x, y + 6, 15, c, 0.6);
    line(ctx, [[x, y - 1], [x, y + 2]], 2, '#2a2628');
    shape(ctx, (p) => ellipsePath(p, x, y + 6, 3.4, 4.4), { fill: c, ink: 1.1, shadow: 'none', gloss: [{ x: x - 1, y: y + 4.6, rx: 1, ry: 1.4, alpha: 0.9 }] });
  }
  // ends fade out (walls off-screen)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createLinearGradient(-LW / 2, 0, LW / 2, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.06, 'rgba(0,0,0,1)');
  g.addColorStop(0.94, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-LW / 2 - 10, -400, LW + 20, 800);
  ctx.restore();
}

defineSprite({ id: 'prop.streets.festoon_0', w: LW + 10, h: 80, ax: LW / 2 + 5, ay: 186, res: 1.5, draw: (ctx) => festoon(ctx, 3) });
defineSprite({ id: 'prop.streets.festoon_1', w: LW + 10, h: 80, ax: LW / 2 + 5, ay: 186, res: 1.5, draw: (ctx) => festoon(ctx, 8) });

// ---------------------------------------------------------------------------
// Floor decals: gutter, manhole, drain, leaves, chalk hopscotch, newspaper, oil
// ---------------------------------------------------------------------------

function gutterSeg(ctx: Ctx, vertical: boolean) {
  ctx.save();
  if (vertical) ctx.transform(0, 1, 1, 0, 0, 0); // swap axes
  // a shallow channel of long curved kerb stones with a wet dark centre line
  ctx.fillStyle = 'rgba(14,12,20,0.6)';
  ctx.fillRect(0, -15, 256, 30);
  for (let i = 0; i < 4; i++) {
    const x = i * 64;
    for (const side of [-1, 1]) {
      const y0 = side < 0 ? -14 : 3;
      shape(ctx, (p) => roundRectPath(p, x + 1, y0, 62, 11, 4), { fill: '#64626a', ink: 0, shadow: 'none' });
      clipped(ctx, (p) => roundRectPath(p, x + 1, y0, 62, 11, 4), () => {
        wash(ctx, lgrad(ctx, 0, y0, 0, y0 + 11, side < 0 ? [[0, 'rgba(255,214,160,0.2)'], [1, 'rgba(10,10,20,0.35)']] : [[0, 'rgba(10,10,20,0.35)'], [1, 'rgba(255,214,160,0.14)']]));
        speckle(ctx, x + 32, y0 + 5, 28, 4, 16, '#2a282e', 0.6, i * 3 + side + 5, 0.45);
      });
    }
  }
  // water trickle with sky reflections
  line(ctx, [[0, 0], [256, 0]], 4.2, '#1a1a24', false, 0.9);
  line(ctx, [[0, -0.6], [256, -0.6]], 1.1, '#8ab0c8', false, 0.45);
  for (let i = 0; i < 6; i++) line(ctx, [[18 + i * 42, -1], [30 + i * 42, -1]], 1.2, '#e8d0a0', false, 0.35);
  ctx.restore();
}

defineSprite({ id: 'prop.streets.gutter', w: 256, h: 40, ax: 0, ay: 20, draw: (ctx) => gutterSeg(ctx, false) });

defineSprite({
  id: 'prop.streets.manhole',
  w: 64, h: 64, ax: 32, ay: 32,
  draw: (ctx) => {
    ao(ctx, 0, 0, 30, 30, 0.3);
    shape(ctx, (p) => circlePath(p, 0, 0, 24), { fill: '#3e3c40', ink: 1.6, inkColor: '#1c1a20', shadow: 'none' });
    shape(ctx, (p) => circlePath(p, 0, 0, 21), { fill: '#4a474c', ink: 1, inkColor: '#25232a', shadow: '#34323a', shadowOffset: [-1.5, -1.5] });
    clipped(ctx, (p) => circlePath(p, 0, 0, 21), () => {
      ctx.strokeStyle = 'rgba(25,24,30,0.7)';
      ctx.lineWidth = 1.2;
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(-24, i * 4); ctx.lineTo(24, i * 4 + 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * 4, -24); ctx.lineTo(i * 4 + 6, 24); ctx.stroke();
      }
      wash(ctx, lgrad(ctx, -21, -21, 21, 21, [[0, 'rgba(255,220,170,0.18)'], [1, 'rgba(0,0,0,0.2)']]));
    });
    flat(ctx, (p) => roundRectPath(p, -11, -5, 22, 10, 2), '#4a474c', 0.8, '#25232a');
    strokeText(ctx, 'NAPOLI', 0, -2.4, 4.6, '#7a767e', 0.9);
  },
});

defineSprite({
  id: 'prop.streets.drain',
  w: 50, h: 40, ax: 25, ay: 20,
  draw: (ctx) => {
    shape(ctx, (p) => roundRectPath(p, -20, -12, 40, 24, 3), { fill: '#3a383e', ink: 1.4, inkColor: '#1c1a20', shadow: 'none' });
    for (let i = 0; i < 7; i++) flat(ctx, (p) => roundRectPath(p, -16 + i * 4.8, -9, 2.6, 18, 1), '#141218', 0);
    line(ctx, [[-19, -11], [19, -11]], 1, '#9a948a', false, 0.35);
  },
});

defineSprite({
  id: 'prop.streets.leaves',
  w: 70, h: 46, ax: 35, ay: 23,
  draw: (ctx) => {
    const R = rng(5);
    for (let i = 0; i < 7; i++) {
      const x = (R() - 0.5) * 50, y = (R() - 0.5) * 26;
      softShape(ctx, (p) => ellipsePath(p, x + 3, y + 2, 4.6, 2.4), 2, 'rgba(10,10,20,0.3)');
      leaf(ctx, x - 4, y, 8 + R() * 4, R() * 6.28, R() < 0.4 ? '#c8862a' : R() < 0.7 ? '#a8a03a' : '#d85a2a', 0.8);
    }
  },
});

defineSprite({
  id: 'prop.streets.petals',
  w: 70, h: 46, ax: 35, ay: 23,
  draw: (ctx) => {
    const R = rng(15);
    for (let i = 0; i < 12; i++) {
      const x = (R() - 0.5) * 54, y = (R() - 0.5) * 30, a = R() * 6.28;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      shape(ctx, (p) => { p.moveTo(-3, 0); p.quadraticCurveTo(0, -4, 3.4, -0.4); p.quadraticCurveTo(0, 3, -3, 0); p.closePath(); }, { fill: R() < 0.6 ? '#d8288a' : '#e8507a', ink: 0.6, inkColor: '#5a0a34', shadow: 'none' });
      ctx.restore();
    }
  },
});

defineSprite({
  id: 'prop.streets.hopscotch',
  w: 120, h: 230, ax: 60, ay: 115,
  draw: (ctx) => {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f2ead8';
    ctx.lineWidth = 2;
    const sq = 32;
    const cells: [number, number][] = [[0, 3], [0, 2], [-0.5, 1], [0.5, 1], [0, 0], [-0.5, -1], [0.5, -1], [0, -2]];
    for (const [cx, cy] of cells) {
      ctx.beginPath();
      ctx.rect(cx * sq - sq / 2 + (Math.sin(cy) * 1.5), cy * sq - sq / 2 - 16, sq, sq);
      ctx.stroke();
    }
    ctx.restore();
    const nums = ['1', '2', '3', '4', '5', '6', '7', '8'];
    cells.forEach(([cx, cy], i) => strokeText(ctx, nums[i], cx * sq, cy * sq - 22, 10, rgba('#f2ead8', 0.6), 1.8));
    // half-moon "cielo" at the top
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(0, -2.5 * sq - 16, sq * 0.8, Math.PI, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f2ead8';
    ctx.stroke();
    ctx.restore();
    // chalk stub
    shape(ctx, (p) => roundRectPath(p, 28, 60, 8, 4, 2), { fill: '#f0a0c0', ink: 0.8, shadow: 'none' });
  },
});

defineSprite({
  id: 'prop.streets.newspaper',
  w: 60, h: 44, ax: 30, ay: 22,
  draw: (ctx) => {
    softShape(ctx, (p) => roundRectPath(p, -18, -10, 38, 26, 2), 3, 'rgba(10,10,20,0.35)');
    ctx.save();
    ctx.rotate(-0.2);
    shape(ctx, (p) => roundRectPath(p, -20, -13, 38, 26, 1.5), { fill: '#e9e2d0', ink: 1, inkColor: '#5a5448', shadow: '#cfc6b2', shadowOffset: [-1.5, -1.5] });
    strokeText(ctx, 'IL MATTINO', -1, -10, 3.6, '#2b2724', 0.7);
    for (let i = 0; i < 5; i++) line(ctx, [[-16, -2 + i * 3.6], [i % 2 ? 4 : 14, -2 + i * 3.6]], 0.8, '#8a8274', false, 0.8);
    flat(ctx, (p) => p.rect(6, -3, 9, 9), '#a8a090', 0);
    line(ctx, [[-1, -13], [-1, 13]], 0.6, '#b8b0a0', false, 0.8);
    ctx.restore();
  },
});

defineSprite({
  id: 'prop.streets.oil',
  w: 70, h: 40, ax: 35, ay: 20,
  draw: (ctx) => {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    blobPath(ctx, 0, 0, 24, 11, 0.25, 10, 4);
    ctx.fillStyle = '#16141c';
    ctx.fill();
    ctx.restore();
    // rainbow sheen
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    blobPath(ctx, -3, -1, 14, 6, 0.3, 9, 8);
    ctx.fillStyle = lgrad(ctx, -14, 0, 14, 0, [[0, '#d040a0'], [0.5, '#40c0d0'], [1, '#e0d040']]);
    ctx.fill();
    ctx.restore();
  },
});

defineSprite({
  id: 'prop.streets.crumbs',
  w: 60, h: 40, ax: 30, ay: 20,
  draw: (ctx) => {
    const R = rng(21);
    for (let i = 0; i < 18; i++) {
      const x = (R() - 0.5) * 44, y = (R() - 0.5) * 22, s = 0.8 + R() * 1.6;
      flat(ctx, (p) => blobPath(p, x, y, s, s * 0.8, 0.3, 6, i), R() < 0.5 ? '#e2c27a' : '#c49a54', 0.4, '#5a3a1a');
    }
    // a bit of pizza crust
    shape(ctx, (p) => { p.moveTo(-6, 4); p.quadraticCurveTo(0, -2, 8, 3); p.lineTo(6, 6); p.quadraticCurveTo(0, 2, -5, 7); p.closePath(); }, { fill: '#d99a4a', ink: 0.9, shadow: '#a86a2a', shadowOffset: [-0.8, -0.8] });
  },
});

// ---------------------------------------------------------------------------
// Layout — street grid of gutters, parked scooters, café clusters, stalls
// ---------------------------------------------------------------------------

const VESPAS = ['prop.streets.vespa_mint', 'prop.streets.vespa_red', 'prop.streets.vespa_cream', 'prop.streets.vespa_blue'];
const CARS = ['prop.streets.car_cream', 'prop.streets.car_blue', 'prop.streets.car_red'];
const UMBRELLAS = ['prop.streets.umbrella_green', 'prop.streets.umbrella_red', 'prop.streets.umbrella_cream'];
const AREA_BUDGET = CHUNK * CHUNK * 0.1;

function placeScooterRow(L: Layout, x: number, y: number, n: number): boolean {
  const W = 92 + (n - 1) * 62;
  const box = { x0: x - 46, y0: y - 28, x1: x - 46 + W, y1: y };
  if (!L.canBlock(box) || L.colliderArea + W * 24 > AREA_BUDGET) return false;
  L.block(box, W * 24);
  const flip = L.chance(0.5);
  for (let i = 0; i < n; i++) {
    L.add({ sprite: L.pick(VESPAS), x: x + i * 62, y: y - (i % 2) * 4, flip: flip || undefined, collider: rectCol(84, 22, 0, -11), sortOffset: -10 });
  }
  if (L.chance(0.5)) L.floor('prop.streets.oil', x + L.range(0, W - 92), y + 4);
  return true;
}

function placeCar(L: Layout, x: number, y: number): boolean {
  const box = { x0: x - 76, y0: y - 46, x1: x + 76, y1: y };
  if (!L.canBlock(box) || L.colliderArea + 152 * 46 > AREA_BUDGET) return false;
  L.block(box, 152 * 46);
  const ape = L.chance(0.4);
  L.add({ sprite: ape ? L.pick(['prop.streets.ape_blue', 'prop.streets.ape_red']) : L.pick(CARS), x, y, flip: L.chance(0.5) || undefined, collider: rectCol(150, 44, 0, -22), sortOffset: -22 });
  if (ape && L.chance(0.7)) {
    const bx = x + L.range(-40, 40), by = y + L.range(44, 64);
    const b = { x0: bx - 30, y0: by - 34, x1: bx + 30, y1: by + 4 };
    if (L.canSoft(b)) { L.softBox(b); L.add({ sprite: 'prop.common.crate_lemon', x: bx, y: by, breakable: { hp: 2, debris: 'wood' } }); }
  }
  L.floor('prop.streets.oil', x + L.range(-30, 30), y - 6);
  return true;
}

function placeCafe(L: Layout, x: number, y: number): boolean {
  // a terrace: 1-3 bistro sets in a row sharing one collider (no narrow gaps between tables)
  const n = L.weighted<number>([[1, 1], [2, 2.2], [3, 1.6]]);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) pts.push([x + i * 100 - (n - 1) * 50, y + L.range(-5, 5)]);
  const W = (n - 1) * 100 + 92;
  const box = { x0: x - W / 2, y0: y - 48, x1: x + W / 2, y1: y + 6 };
  if (!L.canBlock(box) || L.colliderArea + W * 40 > AREA_BUDGET) return false;
  L.block(box, W * 40);
  const umb = L.pick(UMBRELLAS);
  pts.forEach(([px, py], i) => {
    L.floor('prop.streets.umbrella_shadow', px + 26, py + 6);
    L.add({
      sprite: L.chance(0.6) ? 'prop.streets.cafe_a' : 'prop.streets.cafe_b', x: px, y: py, sortOffset: -14,
      collider: i === 0 ? rectCol(W, 40, x - px, -20) : undefined,
    });
    L.overhead(umb, px + 3, py);
  });
  if (L.chance(0.6)) {
    const b = { x0: box.x1 + 10, y0: box.y1 - 60, x1: box.x1 + 60, y1: box.y1 };
    if (L.canSoft(b)) { L.softBox(b); L.add({ sprite: 'prop.streets.geraniums', x: box.x1 + 36, y: box.y1 - 4 }); }
  }
  if (L.chance(0.5)) {
    L.floor('prop.streets.crumbs', x + L.range(-60, 60), box.y1 + 30, false);
    for (let i = 0; i < L.int(2, 4); i++) L.add({ sprite: 'prop.streets.pigeon', x: x + L.range(-70, 70), y: box.y1 + L.range(22, 46), frame: L.int(0, 1), flip: L.chance(0.5) || undefined, animFps: L.chance(0.5) ? 1.5 : undefined });
  }
  return true;
}

function placeStall(L: Layout, x: number, y: number): boolean {
  const box = { x0: x - 100, y0: y - 54, x1: x + 100, y1: y };
  if (!L.canBlock(box) || L.colliderArea + 200 * 54 > AREA_BUDGET) return false;
  L.block(box, 200 * 54);
  L.add({ sprite: 'prop.streets.stall', x, y, collider: rectCol(198, 52, 0, -26), sortOffset: -26 });
  // crates of produce in front (breakable)
  for (const [dx, s] of [[-70, 'prop.common.crate_tomato'], [70, 'prop.common.crate_lemon']] as const) {
    const bx = x + dx + L.range(-8, 8), by = y + L.range(50, 70);
    const b = { x0: bx - 30, y0: by - 34, x1: bx + 30, y1: by + 4 };
    if (L.chance(0.75) && L.canSoft(b)) { L.softBox(b); L.add({ sprite: s, x: bx, y: by, breakable: { hp: 2, debris: s.endsWith('tomato') ? 'tomato' : 'wood' } }); }
  }
  L.floor('prop.streets.leaves', x + L.range(-50, 50), y + 34, L.chance(0.5));
  return true;
}

function placeKiosk(L: Layout, x: number, y: number): boolean {
  const box = { x0: x - 74, y0: y - 50, x1: x + 74, y1: y };
  if (!L.canBlock(box) || L.colliderArea + 148 * 50 > AREA_BUDGET) return false;
  L.block(box, 148 * 50);
  L.add({ sprite: 'prop.streets.kiosk', x, y, collider: rectCol(148, 50, 0, -25), sortOffset: -25, light: { r: 170, color: '#ffe08a', intensity: 0.7, flicker: 0.05, oy: -60 } });
  return true;
}

function placeFountain(L: Layout, x: number, y: number): boolean {
  const box = { x0: x - 90, y0: y - 86, x1: x + 90, y1: y - 6 };
  const area = 180 * 80;
  if (!L.canBlock(box) || L.colliderArea + area > AREA_BUDGET) return false;
  L.block(box, area);
  L.add({ sprite: 'prop.streets.fountain', x, y, animFps: 6, collider: rectCol(180, 80, 0, -46), sortOffset: -46, fx: { kind: 'fountain', oy: -136, rate: 1 } });
  // pigeons around the fountain
  L.floor('prop.streets.crumbs', x + L.range(-80, 80), y + 34);
  L.add({ sprite: 'prop.streets.crumbs', x: x + 70, y: y + 30, layer: 'floor', fx: { kind: 'pigeons', rate: 1 } });
  for (let i = 0; i < L.int(3, 5); i++) L.add({ sprite: 'prop.streets.pigeon', x: x + L.range(-100, 100), y: y + L.range(16, 60), frame: L.int(0, 1), flip: L.chance(0.5) || undefined, animFps: L.chance(0.5) ? 1.2 : undefined });
  return true;
}

function placeLamp(L: Layout, x: number, y: number): boolean {
  const box = { x0: x - 12, y0: y - 18, x1: x + 12, y1: y + 6 };
  if (!L.canBlock(box)) return false;
  L.block(box, Math.PI * 11 * 11);
  L.add({ sprite: 'prop.streets.lamp', x, y, collider: circleCol(11, 0, -6), light: { r: 280, color: '#ffc874', intensity: 0.95, flicker: 0.06, oy: -30 } });
  return true;
}

function populateStreets(cx: number, cy: number, rnd: () => number): PropPlacement[] {
  const L = new Layout(cx, cy, CHUNK, rnd);
  const mid = CHUNK / 2;
  // streets: horizontal gutter for some rows of chunks, vertical for some columns (consistent across chunks)
  const hStreet = hash2(0, cy, 91) < 0.62;
  const vStreet = hash2(cx, 0, 93) < 0.38;
  const gy = L.Y0 + mid, gx = L.X0 + mid;
  if (hStreet) {
    for (let i = 0; i < 3; i++) L.floor('prop.streets.gutter', L.X0 + i * 256, gy);
  }
  if (vStreet) {
    for (let i = 0; i < 3; i++) L.add({ sprite: 'prop.streets.gutter_v', x: gx, y: L.Y0 + i * 256, layer: 'floor' });
  }
  if (hStreet && vStreet) L.floor('prop.streets.manhole', gx, gy);
  else if (L.chance(0.6)) L.floor(L.chance(0.6) ? 'prop.streets.manhole' : 'prop.streets.drain', L.X0 + L.range(120, CHUNK - 120), hStreet ? gy : L.Y0 + L.range(120, CHUNK - 120));

  // parked scooters / car along the gutter
  if (hStreet) {
    const side = L.chance(0.5) ? -46 : 72;
    if (L.chance(0.35)) placeCar(L, L.X0 + L.range(190, CHUNK - 190), gy + side);
    else placeScooterRow(L, L.X0 + L.range(110, CHUNK - 330), gy + side, L.int(2, 4));
    // a lamp post along the street
    if (L.chance(0.75)) placeLamp(L, L.X0 + L.range(110, CHUNK - 110), L.chance(0.5) ? gy - 64 : gy + 96);
  }
  if (vStreet) {
    if (L.chance(0.5)) placeLamp(L, gx + 60, L.Y0 + L.range(120, 260));
    if (L.chance(0.5)) placeScooterRow(L, gx - 150, L.Y0 + L.range(520, 640), 2);
  }
  // one or two "features" per chunk
  const feats = L.int(1, 3);
  for (let i = 0; i < feats; i++) {
    const kind = L.weighted<string>([['cafe', 3], ['stall', 1.6], ['kiosk', 0.6], ['fountain', 0.45], ['scooters', 1.2], ['car', 0.8], ['lamp', 0.3]]);
    for (let t = 0; t < 4; t++) {
      const x = L.X0 + L.range(150, CHUNK - 150), y = L.Y0 + L.range(150, CHUNK - 110);
      let ok = false;
      if (kind === 'cafe') ok = placeCafe(L, x, y);
      else if (kind === 'stall') ok = placeStall(L, x, y);
      else if (kind === 'kiosk') ok = placeKiosk(L, x, y);
      else if (kind === 'fountain') ok = placeFountain(L, x, y);
      else if (kind === 'scooters') ok = placeScooterRow(L, x - 60, y, L.int(2, 3));
      else if (kind === 'car') ok = placeCar(L, x, y);
      else ok = placeLamp(L, x, y);
      if (ok) break;
    }
  }
  // geraniums, bicycle, crates (breakable), pigeons
  for (let i = 0; i < L.int(1, 3); i++) L.trySoft((x, y) => ({ sprite: L.chance(0.6) ? 'prop.streets.geraniums' : 'prop.streets.geranium', x, y }), 40, 30);
  if (L.chance(0.35)) L.trySoft((x, y) => ({ sprite: 'prop.streets.bicycle', x, y, flip: L.chance(0.5) || undefined }), 44, 30);
  for (let i = 0; i < L.int(1, 3); i++) {
    const s = L.weighted([['prop.common.crate_tomato', 2], ['prop.common.crate_lemon', 2], ['prop.common.crate', 1], ['prop.common.crate_stack', 1]]);
    L.trySoft((x, y) => ({ sprite: s, x, y, breakable: { hp: s.endsWith('stack') ? 3 : 2, debris: s.endsWith('tomato') ? 'tomato' : 'wood' } }), 30, 30);
  }
  // laundry lines strung overhead between (invisible) buildings + ground shadows
  const nl = L.weighted<number>([[0, 1], [1, 2.2], [2, 1]]);
  const used: number[] = [];
  for (let i = 0; i < nl; i++) {
    const ly = L.Y0 + L.range(60, CHUNK - 140);
    if (used.some((u) => Math.abs(u - ly) < 180)) continue;
    used.push(ly);
    const lx = L.X0 + L.range(240, CHUNK - 240);
    if (L.chance(0.38)) {
      // string lights instead of laundry: a warm light pool under the middle
      L.overhead(`prop.streets.festoon_${L.int(0, 1)}`, lx, ly, { light: { r: 300, color: '#ffc874', intensity: 0.85, flicker: 0.08, oy: 0 } });
    } else {
      const k = L.int(0, 2);
      L.floor(`prop.streets.laundry_shadow_${k}`, lx + 70, ly + 120);
      L.overhead(`prop.streets.laundry_${k}`, lx, ly);
    }
  }
  // floor decals
  const nd = L.int(3, 6);
  for (let i = 0; i < nd; i++) {
    const s = L.weighted([['prop.streets.leaves', 2], ['prop.streets.petals', 2], ['prop.common.puddle', 1.3], ['prop.common.puddle_small', 1.3], ['prop.streets.newspaper', 0.6], ['prop.streets.crumbs', 0.8], ['prop.streets.hopscotch', 0.25]]);
    L.floor(s, ...L.pt(60), L.chance(0.5));
  }
  return L.out;
}

defineSprite({ id: 'prop.streets.gutter_v', w: 40, h: 256, ax: 20, ay: 0, draw: (ctx) => gutterSeg(ctx, true) });

registerStageEnv({
  id: 'streets',
  tileSize: TS,
  tile: (tx, ty) => `tile.streets.${mod(ty, 3) * 3 + mod(tx, 3)}`,
  chunkSize: CHUNK,
  populate: populateStreets,
  ambient: { tint: '#ffe4c4', darkness: 0.35, darkColor: '#141a3a', vignette: 0.38, particles: 'petals' },
});
