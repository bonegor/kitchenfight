/**
 * STAGE 1 — "La Cucina": the trattoria's kitchen.
 * Warm cream/charcoal checkered ceramic floor, stainless prep islands with
 * food on them, a stove with bubbling pots, a tiled Neapolitan wood oven,
 * pantry shelves, wine barrels, flour sacks / tomato crates / oil tins
 * (breakable), copper pans + garlic + chillies + salumi hanging overhead.
 */
import { defineSprite } from '../sprites';
import { registerStageEnv } from '../stageenv';
import type { PropPlacement } from '../stageenv';
import {
  Ctx, Pt, INK, shape, flat, line, ellipsePath, circlePath, roundRectPath, blobPath, splatPath,
  rng, rgba, mix, shade, light, speckle, glint,
} from '../painter';
import {
  Layout, hash2, pickWeighted, rectCol, circleCol, ao, aoRect, softShape, clipped, lgrad, wash, bloom, fadeUp,
  steelRect, grain, strokeText, tomato, basil, leaf, garlicBulb, bottle,
} from './env_common';

const TS = 128;
const CHUNK = 768;

// ---------------------------------------------------------------------------
// Floor tiles — warm cream / charcoal ceramic checks with grout, wear, glaze
// ---------------------------------------------------------------------------

const CREAM = '#d2c4aa';
const CHAR = '#82766b';
const GROUT = '#a69884';
const CHECK = 64;
const TILE_VARIANTS = 6;

function kitchenTile(ctx: Ctx, v: number) {
  const R = rng(9001 + v * 131);
  const g = 2.2; // grout width
  ctx.fillStyle = v === 4 ? shade(GROUT, 0.08) : GROUT;
  ctx.fillRect(0, 0, TS, TS);
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) {
      const dark = (i + j) % 2 === 1;
      const base = dark ? CHAR : CREAM;
      const t = R();
      const c = dark
        ? mix(base, t < 0.5 ? '#786c63' : '#8a7d71', R() * 0.7)
        : mix(base, t < 0.5 ? '#cbbda2' : '#dbd0bb', R() * 0.8);
      const x = i * CHECK + g / 2, y = j * CHECK + g / 2, w = CHECK - g;
      const build = (p: Ctx) => roundRectPath(p, x, y, w, w, 2.2);
      ctx.beginPath();
      build(ctx);
      ctx.fillStyle = c;
      ctx.fill();
      clipped(ctx, build, () => {
        // glaze: soft pillow highlight from the upper-left + darker lower-right
        ctx.fillStyle = lgrad(ctx, x, y, x + w, y + w, [[0, rgba('#fff8ea', dark ? 0.08 : 0.2)], [0.45, rgba('#ffffff', 0)], [1, rgba('#2a1a10', dark ? 0.1 : 0.07)]]);
        ctx.fillRect(x, y, w, w);
        // low-frequency mottling (glaze thickness)
        for (let k = 0; k < 3; k++) {
          ctx.save();
          ctx.globalAlpha = dark ? 0.035 : 0.06;
          ctx.fillStyle = R() < 0.5 ? (dark ? '#8a7e74' : '#fffaf0') : (dark ? '#5f554f' : '#b8a888');
          ctx.beginPath();
          blobPath(ctx, x + 10 + R() * (w - 20), y + 10 + R() * (w - 20), 10 + R() * 14, 8 + R() * 10, 0.35, 8, Math.floor(R() * 1e5));
          ctx.fill();
          ctx.restore();
        }
        speckle(ctx, x + w / 2, y + w / 2, w * 0.5, w * 0.5, 14, dark ? '#62574f' : '#c2b395', 1.3, Math.floor(R() * 1e6), 0.25);
        // bevel lines
        line(ctx, [[x + 1.2, y + w - 2], [x + 1.2, y + 1.2], [x + w - 2, y + 1.2]], 1, '#fffaf0', false, dark ? 0.12 : 0.4);
        line(ctx, [[x + 2, y + w - 1], [x + w - 1, y + w - 1], [x + w - 1, y + 2]], 1.1, '#2a1a10', false, dark ? 0.18 : 0.1);
        // reflection of the ceiling lamps
        if (R() < (v === 5 ? 0.8 : 0.18)) {
          const sx = x + w * (0.3 + R() * 0.4), sy = y + w * (0.25 + R() * 0.4);
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(-0.75);
          ctx.scale(1, 0.32);
          const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.42);
          gg.addColorStop(0, rgba('#fffaf0', dark ? 0.14 : 0.3));
          gg.addColorStop(1, rgba('#fffaf0', 0));
          ctx.fillStyle = gg;
          ctx.beginPath();
          circlePath(ctx, 0, 0, w * 0.42);
          ctx.fill();
          ctx.restore();
        }
        // scuffs (heel marks)
        const ns = v === 2 ? 3 : R() < 0.25 ? 1 : 0;
        for (let k = 0; k < ns; k++) {
          const sx = x + 8 + R() * (w - 16), sy = y + 8 + R() * (w - 16), a = R() * 6;
          line(ctx, [[sx, sy], [sx + Math.cos(a) * 6, sy + Math.sin(a) * 3], [sx + Math.cos(a) * 11, sy + Math.sin(a) * 1.2]], 0.9, dark ? '#9a8e84' : '#857766', true, 0.3);
        }
        // hairline crack
        if (v === 3 && i === 1 && j === 0) {
          line(ctx, [[x + 3, y + 12], [x + 16, y + 20], [x + 24, y + 18], [x + 36, y + 31], [x + 42, y + 30], [x + w - 1, y + 46]], 0.8, '#5a4e44', false, 0.6);
          line(ctx, [[x + 24, y + 18.6], [x + 26, y + 26]], 0.6, '#5a4e44', false, 0.5);
        }
        // grime toward edges on worn tiles
        if (v === 4) {
          ctx.strokeStyle = rgba('#3a2a1a', 0.14);
          ctx.lineWidth = 5;
          ctx.strokeRect(x, y, w, w);
        }
      });
      // corner chips
      if ((v === 3 && R() < 0.6) || R() < 0.06) {
        const cx = R() < 0.5 ? x + 0.5 : x + w - 0.5, cy = R() < 0.5 ? y + 0.5 : y + w - 0.5;
        ctx.save();
        ctx.beginPath();
        blobPath(ctx, cx, cy, 3, 2.6, 0.3, 6, i * 7 + j + v);
        ctx.fillStyle = dark ? '#958a7f' : '#ab9d8a';
        ctx.fill();
        ctx.restore();
      }
    }
  }
  // the occasional faint stain (stays inside the tile)
  if (v === 4 || v === 2) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#7a4a2a';
    ctx.beginPath();
    blobPath(ctx, 36 + R() * 56, 36 + R() * 56, 20, 13, 0.3, 9, v * 3);
    ctx.fill();
    ctx.restore();
  }
}

for (let v = 0; v < TILE_VARIANTS; v++) {
  defineSprite({ id: `tile.kitchen.${v}`, w: TS, h: TS, ax: 0, ay: 0, draw: (ctx) => kitchenTile(ctx, v) });
}
const TILE_W = [3, 3, 2, 1.1, 1.2, 1.4];

// ---------------------------------------------------------------------------
// Counter modules (stainless islands). Footprint depth D, front height H.
// ---------------------------------------------------------------------------

const D = 54;
const H = 44;
const STEEL_TOP = '#d3d8dc';

type Front = 'doors' | 'drawers' | 'shelf' | 'oven';

function counterBody(ctx: Ctx, w: number, front: Front, seed: number) {
  const x0 = -w / 2, ty = -H - D;
  // contact shadow strip below the front edge (clipped to own width so modules can butt together)
  clipped(ctx, (p) => p.rect(x0, -H - D - 4, w, H + D + 20), () => aoRect(ctx, x0 - 12, -D * 0.7, w + 24, D * 0.7 + 6, 7, 0.6));
  // silhouette
  shape(ctx, (p) => roundRectPath(p, x0, ty, w, D + H, [5, 5, 2, 2]), { fill: '#9aa1a9', ink: 2.6, shadow: 'none' });
  // ---- front face
  steelRect(ctx, x0, -H, w, H, '#a9b0b8', seed, true);
  // toe kick
  ctx.fillStyle = '#3e4148';
  ctx.fillRect(x0 + 1.5, -5, w - 3, 5);
  line(ctx, [[x0 + 1.5, -5], [x0 + w - 1.5, -5]], 0.8, '#7d848c', false, 0.9);
  const fy0 = -H + 4, fh = H - 10;
  if (front === 'doors') {
    const n = w > 135 ? 3 : 2;
    const dw = (w - 6) / n;
    for (let i = 0; i < n; i++) {
      const dx = x0 + 3 + i * dw;
      shape(ctx, (p) => roundRectPath(p, dx + 1, fy0, dw - 2, fh, 2), { fill: '#b7bec5', ink: 0.9, inkColor: '#59606a', shadow: '#959ca5', shadowOffset: [-1.6, -1.2] });
      clipped(ctx, (p) => p.rect(dx + 1, fy0, dw - 2, fh), () => {
        ctx.fillStyle = lgrad(ctx, dx, fy0, dx + dw, fy0 + fh, [[0, 'rgba(255,255,255,0.25)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.08)']]);
        ctx.fillRect(dx, fy0, dw, fh);
      });
      const hx = i % 2 === 0 ? dx + dw - 6 : dx + 6;
      shape(ctx, (p) => roundRectPath(p, hx - 1.3, fy0 + 6, 2.6, 13, 1.3), { fill: '#e9edf0', ink: 0.8, inkColor: '#4a4f57', shadow: '#9aa1a9', shadowOffset: [-0.6, -0.6] });
    }
  } else if (front === 'drawers') {
    const rows = 3;
    const rh = fh / rows;
    for (let r = 0; r < rows; r++) {
      const ry = fy0 + r * rh;
      for (const [dx, dw] of [[x0 + 3, w / 2 - 4], [x0 + w / 2 + 1, w / 2 - 4]] as const) {
        shape(ctx, (p) => roundRectPath(p, dx + 1, ry + 0.8, dw - 2, rh - 1.6, 1.6), { fill: '#b5bcc3', ink: 0.8, inkColor: '#59606a', shadow: '#979ea7', shadowOffset: [-1.2, -1] });
        shape(ctx, (p) => roundRectPath(p, dx + dw / 2 - 9, ry + rh / 2 - 1.3, 18, 2.6, 1.3), { fill: '#eef1f3', ink: 0.7, inkColor: '#4a4f57', shadow: 'none' });
      }
    }
  } else if (front === 'shelf') {
    // open undershelf with stacked pots and plates
    const sx = x0 + 4, sw = w - 8;
    flat(ctx, (p) => roundRectPath(p, sx, fy0 - 1, sw, fh + 2, 2), '#3c3f46', 0.9, '#2a2c31');
    clipped(ctx, (p) => p.rect(sx, fy0 - 1, sw, fh + 2), () => {
      ctx.fillStyle = lgrad(ctx, 0, fy0, 0, fy0 + fh, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]);
      ctx.fillRect(sx, fy0, sw, fh);
    });
    line(ctx, [[sx, fy0 + fh * 0.48], [sx + sw, fy0 + fh * 0.48]], 1.6, '#8d949c');
    // upper: plates stack + bowls
    const sy1 = fy0 + fh * 0.48 - 0.8, sy2 = fy0 + fh;
    for (let k = 0; k < 4; k++) flat(ctx, (p) => roundRectPath(p, sx + 6, sy1 - 2.2 - k * 2.4, 26, 2.2, 1), '#f3eee4', 0.5, '#8a8178');
    shape(ctx, (p) => { p.moveTo(sx + 38, sy1 - 9); p.lineTo(sx + 58, sy1 - 9); p.quadraticCurveTo(sx + 57, sy1, sx + 48, sy1); p.quadraticCurveTo(sx + 39, sy1, sx + 38, sy1 - 9); p.closePath(); }, { fill: '#e8e2d4', ink: 0.8, shadowOffset: [-1.5, -1] });
    shape(ctx, (p) => roundRectPath(p, sx + sw - 34, sy1 - 12, 26, 12, 2), { fill: '#c77b4a', ink: 0.9, shadowOffset: [-2, -1], gloss: [{ x: sx + sw - 28, y: sy1 - 9, rx: 3, ry: 1.2, alpha: 0.6 }] });
    // lower: big stockpot + colander
    shape(ctx, (p) => roundRectPath(p, sx + 8, sy2 - 14, 30, 14, 2), { fill: '#b9c0c7', ink: 0.9, shadowOffset: [-2, -1], gloss: [{ x: sx + 14, y: sy2 - 11, rx: 3, ry: 1.2, alpha: 0.7 }] });
    shape(ctx, (p) => { p.moveTo(sx + 48, sy2 - 11); p.lineTo(sx + 74, sy2 - 11); p.quadraticCurveTo(sx + 72, sy2, sx + 61, sy2); p.quadraticCurveTo(sx + 50, sy2, sx + 48, sy2 - 11); p.closePath(); }, { fill: '#d4dadf', ink: 0.9, shadowOffset: [-1.6, -1] });
    for (let k = 0; k < 5; k++) { ctx.fillStyle = '#5d646c'; ctx.beginPath(); circlePath(ctx, sx + 53 + k * 4, sy2 - 6, 0.8); ctx.fill(); }
    if (sw > 100) shape(ctx, (p) => roundRectPath(p, sx + sw - 30, sy2 - 10, 22, 10, 2), { fill: '#8e5a36', ink: 0.9, shadowOffset: [-1.6, -1] });
  }
  // ---- top face (worktop)
  steelRect(ctx, x0 + 0.5, ty + 0.5, w - 1, D - 1, STEEL_TOP, seed + 1);
  // backsplash upstand at the back edge
  flat(ctx, (p) => roundRectPath(p, x0 + 1, ty + 0.5, w - 2, 5, [4, 4, 0, 0]), '#e4e8eb', 0);
  line(ctx, [[x0 + 2, ty + 5.5], [x0 + w - 2, ty + 5.5]], 0.8, '#8c939b', false, 0.9);
  // rolled front edge
  line(ctx, [[x0 + 1, -H], [x0 + w - 1, -H]], 1.6, INK, false, 0.9);
  line(ctx, [[x0 + 2, -H + 1.6], [x0 + w - 2, -H + 1.6]], 1.4, '#eef2f4', false, 0.9);
  line(ctx, [[x0 + 2, -H - 2.2], [x0 + w - 2, -H - 2.2]], 1, '#f7f9fa', false, 0.7);
  // module seam outline on sides
  line(ctx, [[x0 + 0.6, ty + 3], [x0 + 0.6, -1]], 0.8, '#eef2f4', false, 0.6);
}

/** Wooden cutting board on a worktop (top view). */
function cuttingBoard(ctx: Ctx, x: number, y: number, w: number, h: number, rot: number, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  aoRect(ctx, -w / 2 + 1.5, -h / 2 + 2, w, h, 3, 0.35, 4);
  const wood = '#d39b5c';
  shape(ctx, (p) => roundRectPath(p, -w / 2, -h / 2, w, h, 4), { fill: wood, ink: 1.4, shadow: shade(wood, 0.18), shadowOffset: [-1.6, -1.6] });
  clipped(ctx, (p) => roundRectPath(p, -w / 2, -h / 2, w, h, 4), () => {
    grain(ctx, -w / 2, -h / 2, w, h, '#9a6533', seed, 0, 1.2, 0.35);
    // knife scratches
    const R = rng(seed + 3);
    for (let i = 0; i < 7; i++) {
      const sx = -w / 2 + R() * w, sy = -h / 2 + R() * h;
      line(ctx, [[sx, sy], [sx + 6 + R() * 6, sy + (R() - 0.5) * 4]], 0.4, '#8a5a2c', false, 0.4);
    }
  });
  // handle hole
  flat(ctx, (p) => roundRectPath(p, w / 2 - 9, -2, 6, 4, 2), shade(wood, 0.45), 0.6);
  ctx.restore();
}

function knife(ctx: Ctx, x: number, y: number, len: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  shape(ctx, (p) => {
    p.moveTo(0, -2.2);
    p.lineTo(len * 0.62, -2.6);
    p.quadraticCurveTo(len * 0.66, 0.6, len * 0.62, 1.2);
    p.lineTo(0, 1.4);
    p.closePath();
  }, { fill: '#e3e8ec', ink: 0.9, shadow: '#a6aeb6', shadowOffset: [-0.6, -1], gloss: [{ x: len * 0.3, y: -1.2, rx: len * 0.2, ry: 0.5, alpha: 0.9 }] });
  shape(ctx, (p) => roundRectPath(p, -len * 0.38, -1.8, len * 0.4, 3.6, 1.6), { fill: '#2f2725', ink: 0.9, shadow: 'none', gloss: [{ x: -len * 0.2, y: -0.9, rx: len * 0.12, ry: 0.5, alpha: 0.35 }] });
  for (const k of [0.3, 0.18, 0.06]) { ctx.fillStyle = '#c9ced3'; ctx.beginPath(); circlePath(ctx, -len * k, 0, 0.55); ctx.fill(); }
  ctx.restore();
}

function halfTomato(ctx: Ctx, x: number, y: number, r: number) {
  shape(ctx, (p) => ellipsePath(p, x, y, r, r * 0.86), { fill: '#e2483a', ink: 1, shadow: '#b02a26', shadowOffset: [-r * 0.2, -r * 0.2] });
  flat(ctx, (p) => ellipsePath(p, x, y, r * 0.72, r * 0.6), '#f17a5c', 0);
  for (const [dx, dy] of [[-0.3, -0.15], [0.32, -0.12], [0, 0.32]]) {
    flat(ctx, (p) => ellipsePath(p, x + dx * r, y + dy * r, r * 0.22, r * 0.17), '#f4c26a', 0);
  }
  flat(ctx, (p) => circlePath(p, x, y, r * 0.12), '#f7d9a8', 0);
}

function doughBall(ctx: Ctx, x: number, y: number, r: number) {
  ao(ctx, x + 1, y + r * 0.45, r * 1.15, r * 0.45, 0.3);
  shape(ctx, (p) => ellipsePath(p, x, y, r, r * 0.78), { fill: '#f4e6c8', ink: 1.1, shadow: '#dcc59c', shadowOffset: [-r * 0.28, -r * 0.3], gloss: [{ x: x - r * 0.35, y: y - r * 0.32, rx: r * 0.32, ry: r * 0.18, rot: -0.4, alpha: 0.75 }] });
}

defineSprite({
  id: 'prop.kitchen.counter_board',
  w: 164, h: 140, ax: 82, ay: 128,
  draw: (ctx) => {
    counterBody(ctx, 150, 'doors', 11);
    const ty = -H - D;
    // olive oil bottle + salt pot at the back
    bottle(ctx, -58, ty + 18, 26, '#6f8f2c', { label: '#efe2b8', cap: '#3b3b3b', w: 8 });
    shape(ctx, (p) => ellipsePath(p, -44, ty + 14, 6, 4), { fill: '#efe7d9', ink: 1, shadowOffset: [-1, -1] });
    flat(ctx, (p) => ellipsePath(p, -44, ty + 13.4, 4.2, 2.4), '#ffffff', 0.5, '#bdb3a4');
    cuttingBoard(ctx, -4, ty + 28, 62, 34, -0.06, 4);
    halfTomato(ctx, -20, ty + 24, 5.5);
    halfTomato(ctx, -10, ty + 31, 5);
    tomato(ctx, -24, ty + 35, 5.5, 3);
    // chopped basil chiffonade
    const R = rng(77);
    for (let i = 0; i < 12; i++) {
      line(ctx, [[2 + R() * 14, ty + 20 + R() * 16], [5 + R() * 14, ty + 20 + R() * 16]], 1.4, R() < 0.5 ? '#3f9a45' : '#2f7d36', true, 0.95);
    }
    garlicBulb(ctx, 18, ty + 33, 4.2);
    knife(ctx, 6, ty + 40, 38, -0.12);
    // bowl of tomatoes
    shape(ctx, (p) => ellipsePath(p, 48, ty + 30, 17, 12), { fill: '#f1ebe0', ink: 1.6, shadow: '#cfc5b4', shadowOffset: [-2, -2] });
    flat(ctx, (p) => ellipsePath(p, 48, ty + 29, 13.5, 9), '#dcd2c2', 0);
    tomato(ctx, 42, ty + 28, 5.6, 1);
    tomato(ctx, 52, ty + 26, 5.4, 2);
    tomato(ctx, 50, ty + 33, 5.6, 5);
    tomato(ctx, 44, ty + 35, 4.8, 6);
    leaf(ctx, 56, ty + 22, 9, -0.6, '#43a047', 0.8);
  },
});

defineSprite({
  id: 'prop.kitchen.counter_dough',
  w: 164, h: 140, ax: 82, ay: 128,
  draw: (ctx) => {
    counterBody(ctx, 150, 'drawers', 21);
    const ty = -H - D;
    // marble slab
    const mx0 = -68, mw = 92, my0 = ty + 9, mh = D - 15;
    shape(ctx, (p) => roundRectPath(p, mx0, my0, mw, mh, 3), { fill: '#efebe4', ink: 1.4, shadow: '#cfc8bc', shadowOffset: [-1.5, -1.5] });
    clipped(ctx, (p) => roundRectPath(p, mx0, my0, mw, mh, 3), () => {
      line(ctx, [[mx0, my0 + 10], [mx0 + 20, my0 + 14], [mx0 + 36, my0 + 8], [mx0 + 60, my0 + 22], [mx0 + 92, my0 + 18]], 0.6, '#a9a39a', true, 0.5);
      line(ctx, [[mx0 + 10, my0 + mh], [mx0 + 28, my0 + 24], [mx0 + 50, my0 + 30]], 0.5, '#b8b1a6', true, 0.45);
      // flour dusting
      speckle(ctx, mx0 + mw * 0.5, my0 + mh * 0.5, mw * 0.5, mh * 0.5, 90, '#ffffff', 0.8, 5, 0.75);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      blobPath(ctx, mx0 + 30, my0 + 18, 22, 11, 0.3, 9, 4);
      ctx.fill();
    });
    // pizza in progress: base + sauce + mozzarella + basil
    const px = -36, py = ty + 26;
    shape(ctx, (p) => ellipsePath(p, px, py, 20, 14), { fill: '#f0d9a6', ink: 1.3, shadow: '#d5b77f', shadowOffset: [-1.5, -1.5] });
    flat(ctx, (p) => blobPath(p, px, py, 16, 11, 0.06, 12, 3), '#d7392c', 0);
    const R = rng(12);
    for (let i = 0; i < 6; i++) {
      const a = R() * 6.28, d = R() * 9;
      shape(ctx, (p) => blobPath(p, px + Math.cos(a) * d, py + Math.sin(a) * d * 0.7, 3.4, 2.6, 0.25, 7, i + 2), { fill: '#fbf6ea', ink: 0, shadow: '#e8dcc6', shadowOffset: [-0.6, -0.6] });
    }
    leaf(ctx, px - 4, py - 2, 6, -0.7, '#3d9a44', 0.6);
    leaf(ctx, px + 5, py + 3, 5.5, 2.2, '#3d9a44', 0.6);
    // dough balls
    doughBall(ctx, 4, ty + 20, 7.5);
    doughBall(ctx, 16, ty + 31, 7.5);
    doughBall(ctx, 2, ty + 37, 7);
    // rolling pin
    ctx.save();
    ctx.translate(42, ty + 27);
    ctx.rotate(1.25);
    shape(ctx, (p) => roundRectPath(p, -20, -4, 40, 8, 4), { fill: '#d9a868', ink: 1.2, shadow: '#b47e40', shadowOffset: [0, -2.4], gloss: [{ x: 0, y: -2.2, rx: 15, ry: 1, alpha: 0.5 }] });
    shape(ctx, (p) => roundRectPath(p, -27, -2, 8, 4, 2), { fill: '#c4904e', ink: 1, shadow: 'none' });
    shape(ctx, (p) => roundRectPath(p, 19, -2, 8, 4, 2), { fill: '#c4904e', ink: 1, shadow: 'none' });
    ctx.restore();
    // flour bag at the back right
    shape(ctx, (p) => { p.moveTo(54, ty + 26); p.lineTo(56, ty + 6); p.lineTo(70, ty + 6); p.lineTo(72, ty + 26); p.quadraticCurveTo(63, ty + 29, 54, ty + 26); p.closePath(); }, { fill: '#efe5cf', ink: 1.2, shadow: '#cdbf9f', shadowOffset: [-1.6, -1] });
    strokeText(ctx, '00', 63, ty + 13, 6, '#c0392b', 1.2);
  },
});

defineSprite({
  id: 'prop.kitchen.counter_veg',
  w: 134, h: 140, ax: 67, ay: 128,
  draw: (ctx) => {
    counterBody(ctx, 120, 'shelf', 31);
    const ty = -H - D;
    // colander of vegetables
    const cx = -26, cy = ty + 28;
    shape(ctx, (p) => ellipsePath(p, cx, cy, 24, 17), { fill: '#d0d6db', ink: 1.6, shadow: '#9aa2aa', shadowOffset: [-2, -2] });
    flat(ctx, (p) => ellipsePath(p, cx, cy - 1, 20, 13), '#8f979f', 0);
    // zucchini, eggplant, peppers
    const veg = (x: number, y: number, rx: number, ry: number, rot: number, col: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      shape(ctx, (p) => ellipsePath(p, 0, 0, rx, ry), { fill: col, ink: 1, shadow: shade(col, 0.3), shadowOffset: [-ry * 0.4, -ry * 0.5], gloss: [{ x: -rx * 0.3, y: -ry * 0.4, rx: rx * 0.4, ry: ry * 0.22, alpha: 0.55 }] });
      ctx.restore();
    };
    veg(cx - 9, cy - 3, 11, 4.2, 0.3, '#3f7d32');
    veg(cx + 5, cy - 5, 10, 5.2, -0.4, '#5a2d6b');
    veg(cx + 10, cy + 3, 6.5, 5.5, 0.2, '#e8b726');
    veg(cx - 4, cy + 5, 6.5, 5.5, -0.3, '#d63a2a');
    veg(cx + 1, cy + 0, 9, 3.6, 1.2, '#4f8f3a');
    line(ctx, [[cx + 5, cy - 9.5], [cx + 7, cy - 12]], 1.6, '#3f6b2a');
    // onions & garlic
    const onion = (x: number, y: number, r: number) => {
      shape(ctx, (p) => { p.moveTo(x, y - r * 1.2); p.bezierCurveTo(x + r * 1.3, y - r * 0.6, x + r * 1.1, y + r, x, y + r); p.bezierCurveTo(x - r * 1.1, y + r, x - r * 1.3, y - r * 0.6, x, y - r * 1.2); p.closePath(); }, { fill: '#c9823e', ink: 1, shadow: '#9b5a26', shadowOffset: [-r * 0.3, -r * 0.3], gloss: [{ x: x - r * 0.3, y: y - r * 0.2, rx: r * 0.22, ry: r * 0.45, alpha: 0.4 }] });
      line(ctx, [[x, y - r * 0.9], [x - r * 0.25, y + r * 0.6]], 0.45, '#8a4f22', true, 0.7);
    };
    onion(14, ty + 22, 6);
    onion(24, ty + 28, 5.6);
    garlicBulb(ctx, 36, ty + 20, 4.6);
    garlicBulb(ctx, 30, ty + 36, 4.2);
    // basil in a glass of water
    shape(ctx, (p) => roundRectPath(p, 42, ty + 8, 12, 18, 2), { fill: 'rgba(210,235,240,0.7)', ink: 1.2, shadow: 'none', gloss: [{ x: 45, y: ty + 16, rx: 1.4, ry: 6, alpha: 0.7 }] });
    basil(ctx, 48, ty + 6, 13, 21, 0.9);
    basil(ctx, 46, ty + 1, 10, 22, 0.9);
    // peppercorn mill
    shape(ctx, (p) => roundRectPath(p, 4, ty + 6, 7, 22, 3), { fill: '#6b3d22', ink: 1.1, shadowOffset: [-1.5, -1], gloss: [{ x: 6, y: ty + 12, rx: 1, ry: 5, alpha: 0.4 }] });
  },
});

/** A pot in 3/4 view; (x,y) = front-bottom. Returns rim centre y. */
function pot(ctx: Ctx, x: number, y: number, r: number, h: number, body: string, inner: (cx: number, cy: number, rx: number, ry: number) => void, handles = true) {
  const ry = r * 0.42;
  const yb = y - ry, yt = y - h;
  const build = (p: Ctx) => {
    p.moveTo(x - r, yt);
    p.lineTo(x - r, yb);
    p.ellipse(x, yb, r, ry, 0, Math.PI, 0, true);
    p.lineTo(x + r, yt);
    p.ellipse(x, yt, r, ry, 0, 0, Math.PI, true);
    p.closePath();
  };
  if (handles) {
    for (const s of [-1, 1]) shape(ctx, (p) => roundRectPath(p, x + s * r - (s > 0 ? 0 : 7), yt + 3, 7, 3.4, 1.6), { fill: shade(body, 0.2), ink: 1.1, shadow: 'none' });
  }
  shape(ctx, build, { fill: body, ink: 1.6, shadow: 'none' });
  clipped(ctx, build, () => {
    ctx.fillStyle = lgrad(ctx, x - r, 0, x + r, 0, [[0, shade(body, 0.15)], [0.25, light(body, 0.35)], [0.42, body], [0.85, shade(body, 0.32)], [1, shade(body, 0.45)]]);
    ctx.fillRect(x - r, yt - ry, r * 2, h + ry * 2);
  });
  shape(ctx, (p) => ellipsePath(p, x, yt, r, ry), { fill: light(body, 0.2), ink: 1.4, shadow: 'none' });
  inner(x, yt + 0.4, r - 1.8, ry - 1.2);
  return yt;
}

function stoveDraw(ctx: Ctx, f: number) {
  const w = 150;
  counterBody(ctx, w, 'oven', 41);
  const x0 = -w / 2, ty = -H - D;
  // oven door with glowing window + control band
  flat(ctx, (p) => roundRectPath(p, x0 + 4, -H + 2.5, w - 8, 8, 2), '#3a3d44', 0.8, '#26282d');
  for (let i = 0; i < 6; i++) {
    const kx = x0 + 16 + i * ((w - 32) / 5);
    shape(ctx, (p) => circlePath(p, kx, -H + 6.5, 3.1), { fill: i === 2 || i === 3 ? '#c63a2f' : '#24262b', ink: 0.9, shadow: 'none', gloss: [{ x: kx - 1, y: -H + 5.4, rx: 1.1, ry: 0.7, alpha: 0.75 }] });
  }
  const dx0 = x0 + 10, dw = w - 20, dy0 = -H + 13, dh = H - 20;
  shape(ctx, (p) => roundRectPath(p, dx0, dy0, dw, dh, 3), { fill: '#b9c0c7', ink: 1.1, inkColor: '#4a4f57', shadow: '#959ca5', shadowOffset: [-1.6, -1.4] });
  shape(ctx, (p) => roundRectPath(p, dx0 + 14, dy0 + 5, dw - 28, dh - 10, 3), { fill: '#40261b', ink: 1, inkColor: '#2a1a12', shadow: 'none' });
  clipped(ctx, (p) => roundRectPath(p, dx0 + 14, dy0 + 5, dw - 28, dh - 10, 3), () => {
    const flick = [0.85, 1, 0.92][f % 3];
    ctx.fillStyle = lgrad(ctx, 0, dy0 + 5, 0, dy0 + dh - 5, [[0, rgba('#ff9a3c', 0.25 * flick)], [1, rgba('#ffcf5a', 0.9 * flick)]]);
    ctx.fillRect(dx0, dy0, dw, dh);
    // a tray of lasagna inside!
    flat(ctx, (p) => roundRectPath(p, -20, dy0 + dh - 13, 40, 6, 1.5), '#c9542e', 0.6, '#5a2010');
    line(ctx, [[-18, dy0 + dh - 11.5], [18, dy0 + dh - 11.5]], 1, '#f3d28a', false, 0.9);
    line(ctx, [[dx0 + 18, dy0 + 7], [dx0 + 40, dy0 + 7]], 1.2, '#ffffff', false, 0.35);
  });
  shape(ctx, (p) => roundRectPath(p, dx0 + 16, dy0 + 1, dw - 32, 3, 1.5), { fill: '#eef1f3', ink: 0.8, inkColor: '#4a4f57', shadow: 'none' });
  // ---- hob top: black enamel with grates
  const hx0 = x0 + 4, hy0 = ty + 7, hw = w - 8, hh = D - 10;
  shape(ctx, (p) => roundRectPath(p, hx0, hy0, hw, hh, 3), { fill: '#2c2b2e', ink: 1.2, shadow: '#1f1e21', shadowOffset: [-1.5, -1.5] });
  const burners: Pt[] = [[-46, ty + 20], [-46, ty + 38], [6, ty + 22], [42, ty + 34]];
  for (const [bx, by] of burners) {
    flat(ctx, (p) => ellipsePath(p, bx, by, 9, 6.4), '#4a4950', 0.8, '#151417');
    flat(ctx, (p) => ellipsePath(p, bx, by, 4.2, 3), '#6d6c73', 0.6, '#151417');
  }
  // grates
  ctx.save();
  ctx.strokeStyle = '#141316';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const gx = hx0 + 6 + i * ((hw - 12) / 4);
    ctx.beginPath();
    ctx.moveTo(gx, hy0 + 2);
    ctx.lineTo(gx, hy0 + hh - 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(hx0 + 3, hy0 + hh / 2);
  ctx.lineTo(hx0 + hw - 3, hy0 + hh / 2);
  ctx.stroke();
  ctx.restore();
  // little blue flame on the free burner
  const [fx, fy] = burners[1];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const fl = 2.2 + ((i + f) % 3) * 0.7;
    line(ctx, [[fx + Math.cos(a) * 5, fy + Math.sin(a) * 3.6], [fx + Math.cos(a) * 5.3, fy + Math.sin(a) * 3.6 - fl]], 1.4, '#5fb6ff', false, 0.9);
  }
  bloom(ctx, fx, fy, 10, '#3d8bff', 0.35);
  // ---- pots: big stockpot with sugo, pasta pot, copper pan
  const bub = (cx: number, cy: number, rx: number, ry: number, col: string, seed: number) => {
    const R = rng(seed + f * 17);
    for (let i = 0; i < 5; i++) {
      const a = R() * 6.28, d = Math.sqrt(R()) * 0.75;
      const bx = cx + Math.cos(a) * rx * d, by = cy + Math.sin(a) * ry * d;
      const br = 0.8 + R() * 1.6;
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, bx, by, br);
      ctx.fillStyle = light(col, 0.25);
      ctx.fill();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = shade(col, 0.35);
      ctx.stroke();
      ctx.beginPath();
      circlePath(ctx, bx - br * 0.35, by - br * 0.35, br * 0.35);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      ctx.restore();
    }
  };
  // stockpot of tomato sauce (back left)
  pot(ctx, -46, ty + 30, 15, 24, '#c9cfd4', (cx, cy, rx, ry) => {
    flat(ctx, (p) => ellipsePath(p, cx, cy, rx, ry), '#b8261c', 0);
    clipped(ctx, (p) => ellipsePath(p, cx, cy, rx, ry), () => {
      ctx.fillStyle = lgrad(ctx, cx - rx, cy - ry, cx + rx, cy + ry, [[0, 'rgba(255,140,90,0.45)'], [1, 'rgba(90,0,0,0.25)']]);
      ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    });
    bub(cx, cy, rx, ry, '#c8331f', 3);
    // wooden spoon
    inkLine(ctx, [[cx + 4, cy + 1], [cx + 14, cy - 16]], 2.2, '#d2a160');
  });
  // pasta pot (front right)
  pot(ctx, 42, ty + 44, 14, 20, '#d5dadf', (cx, cy, rx, ry) => {
    flat(ctx, (p) => ellipsePath(p, cx, cy, rx, ry), '#cfe0e3', 0);
    bub(cx, cy, rx, ry, '#dfeef0', 9);
    // spaghetti ends sticking out
    for (let i = 0; i < 6; i++) line(ctx, [[cx - 6 + i * 2.2, cy + 1], [cx - 9 + i * 2.6, cy - 12 - (i % 2) * 2]], 1.1, '#f0cf73', false, 1);
  });
  // copper sauté pan (middle) with garlic & oil
  ctx.save();
  shape(ctx, (p) => roundRectPath(p, 18, ty + 18, 26, 4, 2), { fill: '#7a4a2c', ink: 1.1, shadow: 'none' });
  ctx.restore();
  pot(ctx, 6, ty + 30, 13, 9, '#c8743f', (cx, cy, rx, ry) => {
    flat(ctx, (p) => ellipsePath(p, cx, cy, rx, ry), '#8a5a1e', 0);
    flat(ctx, (p) => ellipsePath(p, cx, cy, rx * 0.9, ry * 0.8), '#c49a2c', 0);
    const R = rng(5 + f);
    for (let i = 0; i < 7; i++) flat(ctx, (p) => ellipsePath(p, cx + (R() - 0.5) * rx * 1.4, cy + (R() - 0.5) * ry * 1.2, 1.6, 1.1), '#f6e7c0', 0.4, '#8a6a3a');
    glint(ctx, cx - rx * 0.4, cy - ry * 0.3, 3, 1, -0.3, 0.6);
  }, false);
  // warm glow under pots
  bloom(ctx, -46, ty + 32, 22, '#ff7a2a', 0.2);
}

function inkLine(ctx: Ctx, pts: Pt[], width: number, color: string) {
  line(ctx, pts, width + 2, INK, false);
  line(ctx, pts, width, color, false);
}

defineSprite({ id: 'prop.kitchen.stove', w: 164, h: 150, ax: 82, ay: 128, frames: 3, draw: stoveDraw });

defineSprite({
  id: 'prop.kitchen.sink',
  w: 144, h: 160, ax: 72, ay: 128,
  draw: (ctx) => {
    const w = 130;
    counterBody(ctx, w, 'doors', 51);
    const ty = -H - D;
    // two deep basins
    for (const bx of [-30, 22]) {
      const bw = 42, bh = 32, by = ty + 11;
      shape(ctx, (p) => roundRectPath(p, bx - bw / 2, by, bw, bh, 5), { fill: '#7f878f', ink: 1.4, shadow: 'none' });
      clipped(ctx, (p) => roundRectPath(p, bx - bw / 2, by, bw, bh, 5), () => {
        ctx.fillStyle = lgrad(ctx, 0, by, 0, by + bh, [[0, '#59616a'], [0.5, '#8d959d'], [1, '#b3bac1']]);
        ctx.fillRect(bx - bw / 2, by, bw, bh);
        // water
        ctx.fillStyle = 'rgba(150,200,215,0.55)';
        ctx.fillRect(bx - bw / 2, by + bh * 0.45, bw, bh);
        line(ctx, [[bx - bw / 2 + 4, by + bh * 0.52], [bx + 6, by + bh * 0.52]], 1, '#ffffff', false, 0.6);
      });
      flat(ctx, (p) => circlePath(p, bx, by + bh - 6, 2.4), '#4b525a', 0.6);
    }
    // soaking dishes + suds in the left basin
    flat(ctx, (p) => ellipsePath(p, -34, ty + 33, 12, 6), '#f4efe6', 0.9, '#8a8178');
    flat(ctx, (p) => ellipsePath(p, -34, ty + 33, 7, 3.4), '#e5ddcf', 0);
    const R = rng(4);
    for (let i = 0; i < 14; i++) {
      const sx = -48 + R() * 34, sy = ty + 30 + R() * 10, sr = 1.4 + R() * 2.6;
      shape(ctx, (p) => circlePath(p, sx, sy, sr), { fill: 'rgba(255,255,255,0.85)', ink: 0.5, inkColor: '#9fb3bd', shadow: 'none', gloss: [{ x: sx - sr * 0.35, y: sy - sr * 0.35, rx: sr * 0.3, ry: sr * 0.25, alpha: 0.9 }] });
    }
    // a pot soaking in the right basin
    shape(ctx, (p) => ellipsePath(p, 24, ty + 31, 12, 7), { fill: '#b9c0c7', ink: 1.2, shadowOffset: [-1.5, -1.5] });
    flat(ctx, (p) => ellipsePath(p, 24, ty + 31, 9, 4.6), '#9c3a26', 0);
    // drying rack on the right with plates
    for (let k = 0; k < 4; k++) {
      shape(ctx, (p) => ellipsePath(p, 54, ty + 18 + k * 6, 6.5, 3.4), { fill: '#f5f1e8', ink: 0.9, shadow: '#d2cabb', shadowOffset: [-0.8, -0.8] });
    }
    // gooseneck tap rising from the back
    const tx = -4, tyb = ty + 6;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, tyb);
    ctx.lineTo(tx, tyb - 22);
    ctx.quadraticCurveTo(tx, tyb - 34, tx + 10, tyb - 34);
    ctx.quadraticCurveTo(tx + 18, tyb - 34, tx + 18, tyb - 24);
    ctx.lineWidth = 6.4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 3.6;
    ctx.strokeStyle = '#d9dee2';
    ctx.stroke();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(tx - 0.8, tyb - 4);
    ctx.lineTo(tx - 0.8, tyb - 22);
    ctx.quadraticCurveTo(tx - 0.8, tyb - 32.5, tx + 9, tyb - 33);
    ctx.stroke();
    ctx.restore();
    for (const s of [-1, 1]) shape(ctx, (p) => roundRectPath(p, tx + s * 7 - 3, tyb - 6, 6, 5, 1.5), { fill: '#e6eaed', ink: 1, shadow: '#a6aeb6', shadowOffset: [-0.8, -0.8] });
    // water drop
    shape(ctx, (p) => ellipsePath(p, tx + 18, tyb - 18, 1.2, 1.8), { fill: '#bfe6f5', ink: 0.6, shadow: 'none' });
  },
});

// ---------------------------------------------------------------------------
// Wood-fired pizza oven (Neapolitan, mosaic dome) — animated fire
// ---------------------------------------------------------------------------

const OVEN_W = 184;
const OVEN_D = 84;
const OVEN_H = 50;

function ovenDraw(ctx: Ctx, f: number) {
  const W = OVEN_W, x0 = -W / 2;
  const topY = -OVEN_H - OVEN_D;
  // shadow
  aoRect(ctx, x0 - 4, -OVEN_D - 4, W + 18, OVEN_D + 12, 10, 0.55, 10);
  // ---- base: rough stone/brick block with log niche
  const baseBuild = (p: Ctx) => roundRectPath(p, x0, -OVEN_H, W, OVEN_H, [2, 2, 3, 3]);
  shape(ctx, baseBuild, { fill: '#b9a48a', ink: 3, shadow: 'none' });
  clipped(ctx, baseBuild, () => {
    const R = rng(3);
    // stone blocks
    const rows = 4, rh = OVEN_H / rows;
    for (let r = 0; r < rows; r++) {
      let x = x0 - R() * 20;
      while (x < x0 + W) {
        const bw = 22 + R() * 18;
        const c = mix('#b49d82', R() < 0.5 ? '#a58d72' : '#c6b297', R());
        shape(ctx, (p) => roundRectPath(p, x + 0.8, -OVEN_H + r * rh + 0.8, bw - 1.6, rh - 1.6, 2.5), { fill: c, ink: 0, shadow: shade(c, 0.18), shadowOffset: [-1.4, -1.4] });
        x += bw;
      }
    }
    ctx.fillStyle = lgrad(ctx, 0, -OVEN_H, 0, 0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(40,20,10,0.25)']]);
    ctx.fillRect(x0, -OVEN_H, W, OVEN_H);
  });
  // log niche (arched opening) with stacked logs
  const nx = -30, nw = 60, nh = 34;
  const niche = (p: Ctx) => {
    p.moveTo(nx - nw / 2, -2);
    p.lineTo(nx - nw / 2, -nh + 12);
    p.quadraticCurveTo(nx, -nh - 10, nx + nw / 2, -nh + 12);
    p.lineTo(nx + nw / 2, -2);
    p.closePath();
  };
  shape(ctx, niche, { fill: '#2b1a12', ink: 1.6, shadow: 'none' });
  clipped(ctx, niche, () => {
    for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - r; i++) {
      const lx = nx - 22 + i * 11 + r * 5.5, ly = -8 - r * 9.5;
      shape(ctx, (p) => circlePath(p, lx, ly, 5.2), { fill: '#c8945a', ink: 1, shadow: '#8d5a2b', shadowOffset: [-1, -1] });
      ctx.save();
      ctx.beginPath();
      circlePath(ctx, lx + 0.4, ly + 0.3, 2.8);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#8d5a2b';
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = lgrad(ctx, 0, -nh, 0, 0, [[0, 'rgba(20,8,4,0.6)'], [0.5, 'rgba(20,8,4,0)']]);
    ctx.fillRect(nx - nw, -nh - 10, nw * 2, nh + 10);
  });
  // brass plaque on the base
  shape(ctx, (p) => roundRectPath(p, 26, -36, 46, 18, 3), { fill: '#caa04a', ink: 1.4, shadow: '#9b7330', shadowOffset: [-1.2, -1.2], gloss: [{ x: 36, y: -32, rx: 8, ry: 1.6, alpha: 0.6 }] });
  strokeText(ctx, 'FORNO', 49, -31.5, 7, '#5a3a12', 1.3);
  // ---- top slab (marble landing)
  const slabBuild = (p: Ctx) => roundRectPath(p, x0, topY, W, OVEN_D, [6, 6, 0, 0]);
  shape(ctx, slabBuild, { fill: '#cdb9a0', ink: 0, shadow: 'none' });
  clipped(ctx, slabBuild, () => {
    ctx.fillStyle = lgrad(ctx, x0, topY, x0 + W, -OVEN_H, [[0, '#ddcbb1'], [1, '#bba68a']]);
    ctx.fillRect(x0, topY, W, OVEN_D);
  });
  // landing ledge in front of the mouth (light marble)
  shape(ctx, (p) => roundRectPath(p, -54, -OVEN_H - 22, 108, 20, 3), { fill: '#efe9e0', ink: 1.6, shadow: '#cbc2b4', shadowOffset: [-1.6, -1.6] });
  line(ctx, [[-50, -OVEN_H - 12], [-20, -OVEN_H - 16], [10, -OVEN_H - 10], [44, -OVEN_H - 15]], 0.5, '#b5aca0', true, 0.6);
  line(ctx, [[x0 + 1, -OVEN_H], [x0 + W - 1, -OVEN_H]], 1.8, INK, false, 0.9);
  line(ctx, [[x0 + 3, -OVEN_H + 1.8], [x0 + W - 3, -OVEN_H + 1.8]], 1.2, '#e6d6bf', false, 0.8);
  // ---- dome (mosaic tiles in gold with a blue/white band)
  const dcx = 0, dcy = -OVEN_H - 34; // dome base centre on the slab
  const drx = 80, dry = 30, dh = 78;
  const domeBuild = (p: Ctx) => {
    p.moveTo(dcx - drx, dcy);
    p.bezierCurveTo(dcx - drx, dcy - dh * 1.1, dcx + drx, dcy - dh * 1.1, dcx + drx, dcy);
    p.ellipse(dcx, dcy, drx, dry, 0, 0, Math.PI, false);
    p.closePath();
  };
  softShape(ctx, (p) => ellipsePath(p, dcx + 6, dcy + 4, drx + 4, dry + 4), 6, 'rgba(40,20,10,0.4)');
  shape(ctx, domeBuild, { fill: '#d9a441', ink: 3, shadow: 'none' });
  clipped(ctx, domeBuild, () => {
    // mosaic tesserae
    const R = rng(8);
    const ts = 6.2;
    for (let yy = dcy - dh - 4; yy < dcy + dry; yy += ts) {
      const row = Math.round((yy - dcy) / ts);
      for (let xx = dcx - drx - 4 + (row % 2) * ts * 0.5; xx < dcx + drx + 4; xx += ts) {
        const band = yy > dcy - 30 && yy < dcy - 18;
        const band2 = yy > dcy - 16 && yy < dcy - 11;
        let c = band ? (R() < 0.5 ? '#2a5fa8' : '#2f6fb8') : band2 ? '#f2ebdc' : mix('#d9a441', R() < 0.5 ? '#e8bf5a' : '#c58f33', R());
        if (!band && !band2 && R() < 0.05) c = '#f5d77a';
        ctx.fillStyle = c;
        ctx.beginPath();
        roundRectPath(ctx, xx + 0.5, yy + 0.5, ts - 1.1, ts - 1.1, 1.2);
        ctx.fill();
      }
    }
    // diamond pattern in the blue band
    for (let i = -6; i <= 6; i++) {
      ctx.fillStyle = '#f5d77a';
      ctx.beginPath();
      const px = dcx + i * 12.5, py = dcy - 24;
      ctx.moveTo(px, py - 4.5); ctx.lineTo(px + 4, py); ctx.lineTo(px, py + 4.5); ctx.lineTo(px - 4, py);
      ctx.closePath();
      ctx.fill();
    }
    // grout tone + volume shading
    ctx.fillStyle = rgrad2(ctx, dcx - drx * 0.4, dcy - dh * 0.7, drx * 1.6, [[0, 'rgba(255,240,200,0.35)'], [0.45, 'rgba(255,240,200,0)'], [1, 'rgba(70,30,10,0.55)']]);
    ctx.fillRect(dcx - drx - 5, dcy - dh - 10, drx * 2 + 10, dh + dry + 20);
    // specular
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ellipsePath(ctx, dcx - 36, dcy - 52, 18, 7, -0.5);
    ctx.fillStyle = '#fff6dc';
    ctx.fill();
    ctx.restore();
  });
  // ---- mouth: brick arch with fire inside
  const mw = 66, mh = 46, my = dcy + dry - 4;
  const mouthOuter = (p: Ctx) => {
    p.moveTo(-mw / 2 - 9, my);
    p.lineTo(-mw / 2 - 9, my - mh * 0.55);
    p.bezierCurveTo(-mw / 2 - 9, my - mh - 14, mw / 2 + 9, my - mh - 14, mw / 2 + 9, my - mh * 0.55);
    p.lineTo(mw / 2 + 9, my);
    p.closePath();
  };
  const mouthInner = (p: Ctx) => {
    p.moveTo(-mw / 2, my);
    p.lineTo(-mw / 2, my - mh * 0.55);
    p.bezierCurveTo(-mw / 2, my - mh - 2, mw / 2, my - mh - 2, mw / 2, my - mh * 0.55);
    p.lineTo(mw / 2, my);
    p.closePath();
  };
  shape(ctx, mouthOuter, { fill: '#b5482f', ink: 2.4, shadow: '#8a3020', shadowOffset: [-2, -2] });
  // arch bricks
  clipped(ctx, mouthOuter, () => {
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const cx = Math.cos(a), cy = Math.sin(a);
      line(ctx, [[cx * (mw / 2) * 1.0, my - mh * 0.55 + cy * mh * 0.62], [cx * (mw / 2 + 12), my - mh * 0.55 + cy * (mh * 0.62 + 12)]], 1, '#6e2416', false, 0.8);
    }
    line(ctx, [[-mw / 2 - 9, my - 12], [-mw / 2, my - 12]], 1, '#6e2416', false, 0.8);
    line(ctx, [[mw / 2, my - 12], [mw / 2 + 9, my - 12]], 1, '#6e2416', false, 0.8);
  });
  shape(ctx, mouthInner, { fill: '#1c0d08', ink: 1.6, shadow: 'none' });
  clipped(ctx, mouthInner, () => {
    // inner glow
    const flick = [1, 0.86, 0.94][f % 3];
    ctx.fillStyle = rgrad2(ctx, -10, my - 10, 46, [[0, rgba('#ffcf5a', 0.95 * flick)], [0.35, rgba('#ff7a22', 0.75 * flick)], [1, rgba('#3a1008', 0.2)]]);
    ctx.fillRect(-mw, my - mh - 10, mw * 2, mh + 20);
    // embers bed
    const R = rng(30 + f);
    for (let i = 0; i < 18; i++) {
      const ex = -mw / 2 + 4 + R() * (mw * 0.55), ey = my - 3 - R() * 6;
      flat(ctx, (p) => circlePath(p, ex, ey, 1 + R() * 1.8), R() < 0.5 ? '#ffd36a' : '#ff8a2a', 0);
    }
    // flames licking up the left back wall
    const fl = (x: number, hgt: number, wd: number, col: string, ph: number) => {
      const sw = Math.sin(f * 2.1 + ph) * 3;
      ctx.beginPath();
      ctx.moveTo(x - wd, my - 4);
      ctx.bezierCurveTo(x - wd, my - hgt * 0.5, x + sw - wd * 0.3, my - hgt * 0.7, x + sw, my - hgt);
      ctx.bezierCurveTo(x + sw + wd * 0.4, my - hgt * 0.65, x + wd, my - hgt * 0.45, x + wd, my - 4);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    };
    fl(-18, 34 + (f % 3) * 3, 11, '#ff7a22', 0);
    fl(-8, 26 + ((f + 1) % 3) * 3, 9, '#ff9a2e', 1);
    fl(-22, 22 + ((f + 2) % 3) * 2, 7, '#ffc74a', 2);
    fl(-12, 16, 5, '#fff0a0', 3);
    // a margherita baking on the oven floor (right)
    shape(ctx, (p) => ellipsePath(p, 14, my - 6, 15, 5), { fill: '#e9b15a', ink: 1, shadow: '#b9742d', shadowOffset: [-1, -1] });
    flat(ctx, (p) => ellipsePath(p, 14, my - 6.4, 11, 3.4), '#cf3a24', 0);
    for (const [dx, dy] of [[-4, -0.6], [3, 0.4], [8, -0.8], [-1, 1]]) flat(ctx, (p) => ellipsePath(p, 14 + dx, my - 6.4 + dy, 2.4, 1.1), '#fff3d6', 0);
    // char marks on the crust
    for (const dx of [-12, -6, 10, 22]) flat(ctx, (p) => circlePath(p, 14 + dx * 0.6, my - 2.6, 0.8), '#5a2a10', 0);
  });
  // ---- copper flue hood above the mouth, pipe going up and fading
  const hoodY = dcy - dh * 0.72;
  ctx.save();
  shape(ctx, (p) => {
    p.moveTo(-20, hoodY + 20);
    p.lineTo(-11, hoodY - 4);
    p.lineTo(11, hoodY - 4);
    p.lineTo(20, hoodY + 20);
    p.quadraticCurveTo(0, hoodY + 26, -20, hoodY + 20);
    p.closePath();
  }, { fill: '#c87a45', ink: 2.2, shadow: '#9a5230', shadowOffset: [-2.4, -1], gloss: [{ x: -8, y: hoodY + 8, rx: 2, ry: 8, alpha: 0.5 }] });
  ctx.restore();
  const pipeTop = hoodY - 90;
  ctx.save();
  shape(ctx, (p) => p.rect(-9, pipeTop, 18, hoodY - pipeTop - 2), { fill: '#b86f3d', ink: 2.2, shadow: '#8a4a26', shadowOffset: [-3.5, 0], gloss: [{ x: -4, y: (pipeTop + hoodY) / 2, rx: 1.6, ry: 30, alpha: 0.5 }] });
  for (const yy of [hoodY - 20, hoodY - 52]) {
    shape(ctx, (p) => roundRectPath(p, -11, yy, 22, 5, 2), { fill: '#d18a52', ink: 1.6, shadowOffset: [-1.5, -1] });
  }
  ctx.restore();
  // fade the pipe into the ceiling haze
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = lgrad(ctx, 0, pipeTop, 0, pipeTop + 40, [[0, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
  ctx.fillRect(-14, pipeTop - 2, 28, 42);
  ctx.restore();
  // ---- tools: a long pizza peel leaning on the right side + brush
  ctx.save();
  ctx.translate(W / 2 - 6, -OVEN_H - 6);
  ctx.rotate(-0.22);
  shape(ctx, (p) => roundRectPath(p, -2, -118, 4, 104, 2), { fill: '#c9955a', ink: 1.4, shadow: '#9a6a36', shadowOffset: [-1, 0] });
  shape(ctx, (p) => { p.moveTo(-13, -14); p.lineTo(13, -14); p.lineTo(11, 12); p.quadraticCurveTo(0, 16, -11, 12); p.closePath(); }, { fill: '#d6dbe0', ink: 1.6, shadow: '#9aa2aa', shadowOffset: [-2, -1], gloss: [{ x: -4, y: -4, rx: 3, ry: 8, alpha: 0.5 }] });
  ctx.restore();
  // warm light spill on the slab in front of the mouth
  bloom(ctx, 0, my - 6, 70, '#ff8a3a', [0.3, 0.24, 0.27][f % 3]);
}

function rgrad2(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

defineSprite({ id: 'prop.kitchen.oven', w: 212, h: 290, ax: 100, ay: 282, frames: 3, draw: ovenDraw });

defineSprite({
  id: 'prop.kitchen.woodpile',
  w: 84, h: 66, ax: 40, ay: 58,
  draw: (ctx) => {
    ao(ctx, 4, -10, 40, 13, 0.5);
    const R = rng(14);
    const logs: [number, number][] = [];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) logs.push([-24 + i * 15.5 + r * 7.8, -10 - r * 12.5]);
    for (const [lx, ly] of logs) {
      // bark side going back
      shape(ctx, (p) => roundRectPath(p, lx - 7, ly - 13, 14, 12, 4), { fill: '#6b4428', ink: 1.6, shadow: '#4a2d1a', shadowOffset: [-1, -1] });
      const rr = 7 + R() * 0.8;
      shape(ctx, (p) => circlePath(p, lx, ly, rr), { fill: '#dcae73', ink: 1.6, shadow: '#b47d45', shadowOffset: [-1.4, -1.4] });
      ctx.save();
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = '#a06a35';
      for (const k of [0.65, 0.35]) { ctx.beginPath(); circlePath(ctx, lx + 0.5, ly + 0.4, rr * k); ctx.stroke(); }
      ctx.restore();
      line(ctx, [[lx, ly], [lx + rr * 0.8, ly - rr * 0.3]], 0.5, '#8a5428', false, 0.7);
    }
  },
});

// ---------------------------------------------------------------------------
// Pantry shelf (jars of passata, giardiniera, dried pasta, tins, oil)
// ---------------------------------------------------------------------------

function jar(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, lid = '#c9b04a', seed = 1) {
  shape(ctx, (p) => roundRectPath(p, x - w / 2, y - h, w, h, 3), { fill, ink: 1.2, shadow: shade(fill, 0.3), shadowOffset: [-w * 0.18, -1], gloss: [{ x: x - w * 0.26, y: y - h * 0.55, rx: w * 0.09, ry: h * 0.28, alpha: 0.6 }] });
  if (fill === '#d9b45a' || fill === '#e8cf7a') {
    // pasta shapes visible inside
    const R = rng(seed);
    for (let i = 0; i < 6; i++) line(ctx, [[x - w * 0.35 + R() * w * 0.6, y - h * 0.15 - R() * h * 0.6], [x - w * 0.3 + R() * w * 0.6, y - h * 0.2 - R() * h * 0.6]], 1.2, '#b88a32', false, 0.7);
  }
  flat(ctx, (p) => roundRectPath(p, x - w / 2 - 0.5, y - h - 3, w + 1, 4, 1.4), lid, 0.9);
  flat(ctx, (p) => p.rect(x - w / 2 + 1, y - h * 0.55, w - 2, h * 0.24), '#f2ead6', 0.5, '#8a7a60');
}

function tinCan(ctx: Ctx, x: number, y: number, w: number, h: number, col: string) {
  shape(ctx, (p) => roundRectPath(p, x - w / 2, y - h, w, h, 1.5), { fill: col, ink: 1.1, shadow: shade(col, 0.3), shadowOffset: [-w * 0.2, 0], gloss: [{ x: x - w * 0.25, y: y - h / 2, rx: w * 0.08, ry: h * 0.35, alpha: 0.5 }] });
  line(ctx, [[x - w / 2, y - h + 2], [x + w / 2, y - h + 2]], 0.8, '#d7dbe0', false, 0.9);
  line(ctx, [[x - w / 2, y - 2], [x + w / 2, y - 2]], 0.8, '#d7dbe0', false, 0.9);
  tomatoDot(ctx, x, y - h * 0.5, w * 0.22);
}

function tomatoDot(ctx: Ctx, x: number, y: number, r: number) {
  flat(ctx, (p) => circlePath(p, x, y, r), '#e8453a', 0.5);
  flat(ctx, (p) => ellipsePath(p, x, y - r * 0.8, r * 0.5, r * 0.25), '#3f8a3a', 0);
}

function shelfDraw(ctx: Ctx, variant: number) {
  const W = 132, SD = 34, SH = 150;
  const x0 = -W / 2;
  const wood = '#9d6a40';
  aoRect(ctx, x0 - 4, -SD - 2, W + 14, SD + 8, 8, 0.55, 6);
  // back panel
  shape(ctx, (p) => roundRectPath(p, x0, -SH - SD * 0.5, W, SH + SD * 0.5, 3), { fill: shade(wood, 0.45), ink: 2.6, shadow: 'none' });
  clipped(ctx, (p) => p.rect(x0, -SH - SD * 0.5, W, SH + SD * 0.5), () => {
    grain(ctx, x0, -SH - SD, W, SH + SD, shade(wood, 0.65), 7 + variant, 1, 0.6, 0.3);
    ctx.fillStyle = lgrad(ctx, 0, -SH, 0, 0, [[0, 'rgba(0,0,0,0.05)'], [1, 'rgba(0,0,0,0.3)']]);
    ctx.fillRect(x0, -SH - SD, W, SH + SD);
  });
  const levels = [-6, -42, -80, -118];
  const R = rng(55 + variant * 9);
  // contents per level (drawn before the board lips so they sit "on" them)
  levels.forEach((ly, li) => {
    const top = ly - 2;
    let x = x0 + 8;
    while (x < x0 + W - 12) {
      const k = R();
      if (li === 3 && variant === 0) {
        // top: big terracotta pot + rolled tea towels
        if (x < x0 + 40) { shape(ctx, (p) => { p.moveTo(x, top - 18); p.lineTo(x + 24, top - 18); p.lineTo(x + 20, top); p.lineTo(x + 4, top); p.closePath(); }, { fill: '#c8673e', ink: 1.2, shadowOffset: [-2, -1] }); x += 28; continue; }
      }
      if (k < 0.3) {
        jar(ctx, x + 6, top, 12, 20 + R() * 4, '#c23a2a', '#c9b04a', li * 10 + Math.floor(x));
        x += 15;
      } else if (k < 0.48) {
        jar(ctx, x + 7, top, 14, 24, R() < 0.5 ? '#d9b45a' : '#e8cf7a', '#9a9aa2', Math.floor(x) + li);
        x += 17;
      } else if (k < 0.62) {
        tinCan(ctx, x + 5.5, top, 11, 14, '#c8cdd2');
        if (R() < 0.6) tinCan(ctx, x + 5.5, top - 14, 11, 14, '#c8cdd2');
        x += 13;
      } else if (k < 0.78) {
        bottle(ctx, x + 4, top, 30, R() < 0.5 ? '#6f8f2c' : '#3e5a22', { label: '#f0e3bc', cap: '#2f2f2f', w: 8, ink: 1 });
        x += 11;
      } else if (k < 0.9) {
        // giardiniera
        shape(ctx, (p) => roundRectPath(p, x, top - 22, 15, 22, 3), { fill: '#e9c86a', ink: 1.2, shadowOffset: [-2, -1], gloss: [{ x: x + 3.5, y: top - 13, rx: 1.3, ry: 6, alpha: 0.55 }] });
        for (let i = 0; i < 5; i++) flat(ctx, (p) => circlePath(p, x + 3 + R() * 9, top - 4 - R() * 14, 1.6), R() < 0.5 ? '#e0582a' : '#7cb342', 0);
        flat(ctx, (p) => roundRectPath(p, x - 0.5, top - 25, 16, 4, 1.4), '#c9b04a', 0.9);
        x += 18;
      } else {
        // spaghetti packet (paper) leaning
        shape(ctx, (p) => { p.moveTo(x, top); p.lineTo(x + 3, top - 30); p.lineTo(x + 13, top - 29); p.lineTo(x + 12, top); p.closePath(); }, { fill: '#2f5fa8', ink: 1.1, shadowOffset: [-1.5, 0] });
        flat(ctx, (p) => p.rect(x + 3.5, top - 20, 7.5, 9), '#f5e6b0', 0.4);
        x += 15;
      }
    }
  });
  // shelf boards (front lips)
  for (const ly of levels) {
    shape(ctx, (p) => roundRectPath(p, x0 - 2, ly - 2, W + 4, 6, 1.5), { fill: wood, ink: 1.6, shadow: shade(wood, 0.25), shadowOffset: [-1, -1.6] });
    line(ctx, [[x0, ly - 1.2], [x0 + W, ly - 1.2]], 0.8, light(wood, 0.35), false, 0.8);
  }
  // uprights
  for (const ux of [x0 - 3, x0 + W - 3]) {
    shape(ctx, (p) => roundRectPath(p, ux, -SH - SD * 0.5 - 2, 6, SH + SD * 0.5 + 2, 2), { fill: shade(wood, 0.08), ink: 1.8, shadow: shade(wood, 0.3), shadowOffset: [-2, 0] });
  }
  // top board (seen from above)
  shape(ctx, (p) => roundRectPath(p, x0 - 3, -SH - SD * 0.5 - 6, W + 6, 8, 2), { fill: light(wood, 0.1), ink: 2, shadow: shade(wood, 0.15), shadowOffset: [-1.5, -1.5] });
  // a garlic braid hanging on the side
  if (variant === 1) {
    for (let i = 0; i < 6; i++) garlicBulb(ctx, x0 + W + 1 + (i % 2) * 3, -SH + 22 + i * 9, 4.6, 1);
  }
}

defineSprite({ id: 'prop.kitchen.shelf', w: 150, h: 186, ax: 74, ay: 172, draw: (ctx) => shelfDraw(ctx, 0) });
defineSprite({ id: 'prop.kitchen.shelf_b', w: 156, h: 186, ax: 74, ay: 172, draw: (ctx) => shelfDraw(ctx, 1) });

// ---------------------------------------------------------------------------
// Breakables: flour sacks, olive-oil tins (+ common tomato crates)
// ---------------------------------------------------------------------------

function sack(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, label = 'FARINA', lean = 0) {
  const burlap = '#e3d2ad';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  const build = (p: Ctx) => {
    p.moveTo(-w * 0.48, -2);
    p.bezierCurveTo(-w * 0.62, -h * 0.4, -w * 0.5, -h * 0.82, -w * 0.3, -h * 0.92);
    p.quadraticCurveTo(-w * 0.2, -h * 1.06, -w * 0.08, -h * 0.98);
    p.quadraticCurveTo(0, -h * 1.12, w * 0.1, -h * 0.98);
    p.quadraticCurveTo(w * 0.24, -h * 1.05, w * 0.3, -h * 0.92);
    p.bezierCurveTo(w * 0.52, -h * 0.82, w * 0.62, -h * 0.4, w * 0.48, -2);
    p.quadraticCurveTo(0, h * 0.06, -w * 0.48, -2);
    p.closePath();
  };
  shape(ctx, build, { fill: burlap, ink: 2, shadow: '#c2ab7e', shadowOffset: [-w * 0.14, -h * 0.08] });
  clipped(ctx, build, () => {
    // weave texture
    for (let yy = -h * 1.1; yy < 4; yy += 2.6) line(ctx, [[-w, yy], [w, yy + 1]], 0.45, '#8a7450', false, 0.1);
    for (let xx = -w; xx < w; xx += 2.8) line(ctx, [[xx, -h * 1.1], [xx + 1, 4]], 0.4, '#8a7450', false, 0.08);
    // flour dust on the sack
    speckle(ctx, 0, -h * 0.35, w * 0.45, h * 0.35, 40, '#ffffff', 0.9, seed, 0.6);
    // red stamped band + label
    ctx.fillStyle = rgba('#b93a2c', 0.85);
    ctx.fillRect(-w, -h * 0.66, w * 2, 2);
    ctx.fillRect(-w, -h * 0.28, w * 2, 2);
  });
  // stencilled wheat ear + "00"
  strokeText(ctx, label === 'FARINA' ? '00' : '0', 0, -h * 0.6, 9, label === 'FARINA' ? '#2f5fa8' : '#b93a2c', 2);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const ly = -h * 0.36 - k * 3.2;
    flat(ctx, (p) => ellipsePath(p, s * 4.2, ly, 2.2, 1.1, s * 0.6), '#b98a3a', 0);
  }
  line(ctx, [[0, -h * 0.26], [0, -h * 0.47]], 0.9, '#b98a3a', false);
  // tie at the top
  line(ctx, [[-w * 0.22, -h * 0.9], [w * 0.22, -h * 0.9]], 1.6, '#8a6a3a', true);
  ctx.restore();
}

defineSprite({
  id: 'prop.kitchen.sack',
  w: 60, h: 66, ax: 30, ay: 58,
  draw: (ctx) => {
    ao(ctx, 3, -4, 27, 9, 0.5);
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    blobPath(ctx, 10, 1, 16, 4, 0.3, 8, 3);
    ctx.fill();
    ctx.restore();
    sack(ctx, 0, 0, 40, 50, 3);
  },
});

defineSprite({
  id: 'prop.kitchen.sacks',
  w: 92, h: 70, ax: 44, ay: 62,
  draw: (ctx) => {
    ao(ctx, 4, -5, 42, 11, 0.5);
    sack(ctx, -14, -4, 38, 46, 5, 'FARINA', -0.06);
    sack(ctx, 14, 0, 40, 50, 7, 'SEMOLA', 0.05);
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    blobPath(ctx, -26, 2, 12, 3.5, 0.35, 8, 9);
    ctx.fill();
    ctx.restore();
    // scoop
    shape(ctx, (p) => roundRectPath(p, -36, -6, 12, 6, 2), { fill: '#d4d9de', ink: 1.2, shadowOffset: [-1, -1] });
  },
});

function oilTin(ctx: Ctx, x: number, y: number, w: number, d: number, h: number) {
  const x0 = x - w / 2;
  shape(ctx, (p) => roundRectPath(p, x0, y - h - d, w, h + d, 2), { fill: '#b9bfc5', ink: 1.8, shadow: 'none' });
  // front label
  steelRect(ctx, x0 + 0.5, y - h, w - 1, h - 0.5, '#c8ced3', 5, true);
  flat(ctx, (p) => p.rect(x0 + 2, y - h + 4, w - 4, h - 8), '#2f6b3a', 0.6, '#1d3f22');
  flat(ctx, (p) => p.rect(x0 + 2, y - h + 6, w - 4, 3), '#d9b44a', 0);
  // olive branch
  line(ctx, [[x - w * 0.3, y - h * 0.3], [x + w * 0.25, y - h * 0.55]], 0.8, '#c8b46a', true);
  for (let i = 0; i < 3; i++) {
    flat(ctx, (p) => ellipsePath(p, x - w * 0.18 + i * w * 0.14, y - h * 0.38 - i * 2.5, 2.4, 1.2, -0.4), '#8fb35a', 0);
  }
  flat(ctx, (p) => ellipsePath(p, x + w * 0.12, y - h * 0.32, 1.8, 2.2), '#3a2a40', 0.4);
  strokeText(ctx, 'OLIO', x, y - h * 0.82, 4.2, '#f3e3b0', 0.9);
  // top face
  steelRect(ctx, x0 + 0.5, y - h - d + 0.5, w - 1, d - 1, '#d9dee2', 9);
  line(ctx, [[x0, y - h], [x0 + w, y - h]], 1.2, INK, false, 0.8);
  // spout cap
  shape(ctx, (p) => ellipsePath(p, x + w * 0.22, y - h - d * 0.55, 3.2, 2), { fill: '#d0a33a', ink: 1, shadowOffset: [-0.6, -0.6] });
}

defineSprite({
  id: 'prop.kitchen.tins',
  w: 72, h: 76, ax: 34, ay: 68,
  draw: (ctx) => {
    ao(ctx, 3, -9, 34, 12, 0.5);
    oilTin(ctx, -13, -10, 22, 14, 30);
    oilTin(ctx, 12, -8, 22, 14, 30);
    oilTin(ctx, -1, 0, 22, 14, 30);
  },
});

defineSprite({
  id: 'prop.kitchen.parmigiano',
  w: 70, h: 66, ax: 34, ay: 58,
  draw: (ctx) => {
    ao(ctx, 3, -9, 32, 11, 0.5);
    for (let i = 0; i < 3; i++) {
      const yy = -i * 14;
      const r = 25 - i * 0.6;
      const ry = 9;
      const build = (p: Ctx) => {
        p.moveTo(-r, yy - ry - 12);
        p.lineTo(-r, yy - ry);
        p.ellipse(0, yy - ry, r, ry, 0, Math.PI, 0, true);
        p.lineTo(r, yy - ry - 12);
        p.ellipse(0, yy - ry - 12, r, ry, 0, 0, Math.PI, true);
        p.closePath();
      };
      shape(ctx, build, { fill: '#e6b75a', ink: 1.8, shadow: '#c48c34', shadowOffset: [-4, 0] });
      // dotted rind lettering band
      ctx.save();
      ctx.fillStyle = '#b07a2a';
      for (let k = -6; k <= 6; k++) {
        ctx.beginPath();
        circlePath(ctx, k * 3.4, yy - ry - 2 + Math.cos((k / 7) * 1.5) * 4.2, 0.7);
        ctx.fill();
      }
      ctx.restore();
    }
    shape(ctx, (p) => ellipsePath(p, 0, -2 * 14 - 9 - 12, 24.4, 9), { fill: '#f2d38a', ink: 1.6, shadow: '#dcb362', shadowOffset: [-2, -1.5] });
    // a wedge cut + knife
    flat(ctx, (p) => { p.moveTo(0, -49); p.lineTo(14, -44); p.lineTo(20, -50); p.closePath(); }, '#f7e3ad', 0.8);
    speckle(ctx, 0, -49, 16, 5, 10, '#d9a64a', 0.7, 3, 0.8);
  },
});

// ---------------------------------------------------------------------------
// Overhead hangings (drawn above everything; anchored on the floor point below)
// ---------------------------------------------------------------------------

function chain(ctx: Ctx, x: number, y0: number, y1: number) {
  for (let y = y1; y > y0; y -= 5) {
    ctx.save();
    ctx.beginPath();
    ellipsePath(ctx, x, y, 1.6, 2.6);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = '#2e2724';
    ctx.stroke();
    ctx.restore();
  }
}

function copperPan(ctx: Ctx, x: number, y: number, r: number, handleLen: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // handle up to the hook
  shape(ctx, (p) => roundRectPath(p, -2.2, -handleLen - r * 0.2, 4.4, handleLen, 2), { fill: '#a65a2e', ink: 1.4, shadow: 'none' });
  flat(ctx, (p) => circlePath(p, 0, -handleLen - r * 0.2 + 3.5, 1.4), '#2b1712', 0);
  // pan bottom (facing camera)
  shape(ctx, (p) => circlePath(p, 0, r * 0.8, r), {
    fill: '#cf7a45', ink: 1.8, shadow: '#9a4a26', shadowOffset: [-r * 0.22, -r * 0.24],
    gloss: [{ x: -r * 0.38, y: r * 0.4, rx: r * 0.32, ry: r * 0.14, rot: -0.7, alpha: 0.7 }],
  });
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, r * 0.8, r * 0.72);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#a3542c';
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.restore();
  glint(ctx, -r * 0.35, r * 0.35, r * 0.12, r * 0.07, -0.7, 0.9);
  ctx.restore();
}

defineSprite({
  id: 'prop.kitchen.rack',
  w: 236, h: 130, ax: 118, ay: 196,
  draw: (ctx) => {
    const by = -158; // rack bar height (pans hang down to the island's back edge)
    chain(ctx, -88, -196, by);
    chain(ctx, 88, -196, by);
    fadeUp(ctx, -172, -196);
    // bar
    shape(ctx, (p) => roundRectPath(p, -104, by - 2.5, 208, 5, 2.5), { fill: '#3a3230', ink: 1.6, shadow: 'none', gloss: [{ x: 0, y: by - 1.2, rx: 90, ry: 0.7, alpha: 0.35 }] });
    for (const ex of [-104, 104]) shape(ctx, (p) => circlePath(p, ex, by, 4.2), { fill: '#4a403c', ink: 1.4, shadow: 'none' });
    // hanging utensils
    copperPan(ctx, -76, by + 6, 15, 16, 0.05);
    // ladle
    inkLine(ctx, [[-46, by + 3], [-46, by + 34]], 2, '#d6dbe0');
    shape(ctx, (p) => ellipsePath(p, -46, by + 40, 8, 6.5), { fill: '#cfd5da', ink: 1.4, shadow: '#9aa2aa', shadowOffset: [-1.4, -1.4], gloss: [{ x: -48.5, y: by + 37.5, rx: 2.4, ry: 1.2, alpha: 0.8 }] });
    copperPan(ctx, -16, by + 6, 19, 18, -0.04);
    // whisk
    inkLine(ctx, [[18, by + 3], [18, by + 18]], 2.2, '#cfd5da');
    for (let i = -2; i <= 2; i++) line(ctx, [[18, by + 18], [18 + i * 2.6, by + 30], [18 + i * 0.8, by + 40]], 0.9, '#bfc6cc', true);
    copperPan(ctx, 50, by + 6, 13, 14, 0.06);
    // colander
    shape(ctx, (p) => { p.moveTo(70, by + 14); p.lineTo(100, by + 14); p.quadraticCurveTo(98, by + 36, 85, by + 36); p.quadraticCurveTo(72, by + 36, 70, by + 14); p.closePath(); }, { fill: '#d5dade', ink: 1.6, shadow: '#9aa2aa', shadowOffset: [-2.4, -1] });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) flat(ctx, (p) => circlePath(p, 77 + i * 5 + j * 2.5, by + 21 + j * 6, 0.9), '#59616a', 0);
    line(ctx, [[85, by + 3], [85, by + 14]], 1.4, '#3a3230');
  },
});

defineSprite({
  id: 'prop.kitchen.garlic',
  w: 40, h: 116, ax: 20, ay: 250,
  draw: (ctx) => {
    const top = -250;
    line(ctx, [[0, top], [0, top + 20]], 1.6, '#7a5a34');
    fadeUp(ctx, top + 12, top);
    // braided stems
    for (let i = 0; i < 9; i++) {
      const yy = top + 22 + i * 8;
      line(ctx, [[-3, yy], [3, yy + 5], [-3, yy + 9]], 2.2, '#c9b07a', true);
    }
    const R = rng(3);
    for (let i = 0; i < 9; i++) {
      const s = i % 2 ? 1 : -1;
      garlicBulb(ctx, s * (6 + R() * 2), top + 30 + i * 8.6, 5.6 + R() * 1.2, 1.2);
    }
    garlicBulb(ctx, 0, top + 108, 6, 1.2);
  },
});

defineSprite({
  id: 'prop.kitchen.chillies',
  w: 36, h: 118, ax: 18, ay: 250,
  draw: (ctx) => {
    const top = -250;
    line(ctx, [[0, top], [0, top + 108]], 1.2, '#8a7a50');
    fadeUp(ctx, top + 12, top);
    const R = rng(8);
    for (let i = 0; i < 26; i++) {
      const yy = top + 18 + i * 3.6;
      const a = (i % 2 ? 1 : -1) * (0.5 + R() * 0.7) + Math.PI / 2;
      const len = 11 + R() * 4;
      ctx.save();
      ctx.translate(0, yy);
      ctx.rotate(a - Math.PI / 2);
      shape(ctx, (p) => { p.moveTo(-2.2, 0); p.quadraticCurveTo(-2.6, len * 0.6, 0.4, len); p.quadraticCurveTo(2.6, len * 0.5, 2.2, 0); p.closePath(); }, { fill: R() < 0.2 ? '#a3201a' : '#d42a1e', ink: 1, shadow: '#8e1712', shadowOffset: [-0.8, 0], gloss: [{ x: -0.8, y: len * 0.35, rx: 0.6, ry: len * 0.22, alpha: 0.6 }] });
      flat(ctx, (p) => ellipsePath(p, 0, -0.4, 2, 1.4), '#3f7d32', 0.5);
      ctx.restore();
    }
  },
});

defineSprite({
  id: 'prop.kitchen.salumi',
  w: 150, h: 146, ax: 75, ay: 232,
  draw: (ctx) => {
    const by = -202;
    chain(ctx, -60, -232, by);
    chain(ctx, 60, -232, by);
    fadeUp(ctx, -216, -232);
    shape(ctx, (p) => roundRectPath(p, -70, by - 3, 140, 6, 3), { fill: '#7a5332', ink: 1.6, shadowOffset: [0, -1.6] });
    // prosciutto leg
    line(ctx, [[-36, by + 2], [-36, by + 12]], 1.2, '#d8c9a8');
    shape(ctx, (p) => {
      p.moveTo(-40, by + 12);
      p.quadraticCurveTo(-32, by + 10, -32, by + 18);
      p.bezierCurveTo(-18, by + 40, -16, by + 70, -34, by + 82);
      p.bezierCurveTo(-52, by + 86, -60, by + 66, -54, by + 48);
      p.bezierCurveTo(-48, by + 34, -42, by + 24, -40, by + 12);
      p.closePath();
    }, { fill: '#b8653f', ink: 1.8, shadow: '#874326', shadowOffset: [-4, -2], gloss: [{ x: -44, y: by + 50, rx: 4, ry: 12, rot: 0.3, alpha: 0.35 }] });
    shape(ctx, (p) => ellipsePath(p, -38, by + 70, 13, 10, 0.3), { fill: '#e48f86', ink: 1.2, shadow: '#c46a62', shadowOffset: [-2, -2] });
    flat(ctx, (p) => ellipsePath(p, -36, by + 68, 8, 5, 0.3), '#f6e6d6', 0);
    // salami with strings
    for (const [sx, len, col] of [[-6, 54, '#8e3b30'], [14, 44, '#9b4436'], [32, 58, '#7f3229'], [52, 40, '#a24a3a']] as const) {
      line(ctx, [[sx, by + 2], [sx, by + 10]], 1, '#e8e0cc');
      shape(ctx, (p) => roundRectPath(p, sx - 6, by + 10, 12, len, 6), { fill: col, ink: 1.6, shadow: shade(col, 0.3), shadowOffset: [-2.4, 0], gloss: [{ x: sx - 2.4, y: by + 10 + len * 0.35, rx: 1.2, ry: len * 0.22, alpha: 0.4 }] });
      // string netting
      for (let k = 1; k < 5; k++) line(ctx, [[sx - 6, by + 10 + (len / 5) * k], [sx + 6, by + 10 + (len / 5) * k + 2]], 0.6, '#efe6d2', false, 0.8);
      speckle(ctx, sx, by + 10 + len / 2, 4, len * 0.4, 8, '#f3e9d8', 0.6, Math.floor(sx + 20), 0.6);
    }
  },
});

// ---------------------------------------------------------------------------
// Floor decals
// ---------------------------------------------------------------------------

function flourSpill(ctx: Ctx, seed: number, rx: number, ry: number, steps: boolean) {
  const R = rng(seed);
  ctx.save();
  // soft dusty base
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.16 + i * 0.07;
    ctx.fillStyle = '#fbf8f1';
    ctx.beginPath();
    blobPath(ctx, (R() - 0.5) * rx * 0.3, (R() - 0.5) * ry * 0.3, rx * (1 - i * 0.2), ry * (1 - i * 0.2), 0.35, 12, seed + i);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  speckle(ctx, 0, 0, rx * 1.25, ry * 1.25, 70, '#ffffff', 1.1, seed + 7, 0.75);
  // footprints (chef clogs) walking through the flour
  if (steps) {
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) {
      const fx = -rx * 0.7 + i * rx * 0.45, fy = (i % 2 ? -1 : 1) * 6 - i * 3;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ellipsePath(ctx, fx, fy, 7, 3.6, -0.15);
      ellipsePath(ctx, fx - 9, fy + 1, 3.6, 3, -0.15);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // flour footprints continuing out of the spill
    for (let i = 0; i < 3; i++) {
      const fx = rx * 1.1 + i * 22, fy = -4 - (i % 2 ? 6 : -4) - i * 3;
      ctx.globalAlpha = 0.45 - i * 0.12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ellipsePath(ctx, fx, fy, 6.5, 3.4, -0.15);
      ellipsePath(ctx, fx - 8.5, fy + 1, 3.4, 2.8, -0.15);
      ctx.fill();
    }
  }
  ctx.restore();
}

defineSprite({ id: 'prop.kitchen.flour_a', w: 230, h: 90, ax: 80, ay: 45, draw: (ctx) => flourSpill(ctx, 11, 58, 28, true) });
defineSprite({ id: 'prop.kitchen.flour_b', w: 110, h: 70, ax: 55, ay: 35, draw: (ctx) => flourSpill(ctx, 23, 40, 22, false) });

defineSprite({
  id: 'prop.kitchen.drain',
  w: 44, h: 44, ax: 22, ay: 22,
  draw: (ctx) => {
    ao(ctx, 0, 0, 20, 20, 0.25);
    shape(ctx, (p) => circlePath(p, 0, 0, 13), { fill: '#a7adb3', ink: 1.4, inkColor: '#4e4844', shadow: '#7f868d', shadowOffset: [-1.5, -1.5] });
    flat(ctx, (p) => circlePath(p, 0, 0, 10), '#3c3a3a', 0.8, '#55504c');
    ctx.save();
    ctx.strokeStyle = '#b9c0c6';
    ctx.lineWidth = 1.6;
    for (let i = -3; i <= 3; i++) {
      const xx = i * 2.8;
      const hh = Math.sqrt(Math.max(0, 100 - xx * xx));
      ctx.beginPath();
      ctx.moveTo(xx, -hh + 0.8);
      ctx.lineTo(xx, hh - 0.8);
      ctx.stroke();
    }
    ctx.restore();
    glint(ctx, -6, -6, 3, 1.2, -0.7, 0.5);
  },
});

defineSprite({
  id: 'prop.kitchen.mat',
  w: 150, h: 58, ax: 75, ay: 29,
  draw: (ctx) => {
    const w = 136, h = 42;
    const col = '#3b3534';
    softShape(ctx, (p) => roundRectPath(p, -w / 2 + 2, -h / 2 + 3, w, h, 6), 3, 'rgba(30,15,10,0.35)');
    shape(ctx, (p) => roundRectPath(p, -w / 2, -h / 2, w, h, 6), { fill: col, ink: 1.2, inkColor: '#2a2120', shadow: 'none' });
    clipped(ctx, (p) => roundRectPath(p, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 4), () => {
      for (let j = 0; j < 5; j++) for (let i = 0; i < 18; i++) {
        const x = -w / 2 + 6 + i * 7.4 + (j % 2) * 3.7, y = -h / 2 + 6 + j * 7.6;
        ctx.fillStyle = '#7b6e64';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        roundRectPath(ctx, x - 2.4, y - 2.4, 4.8, 4.8, 1.8);
        ctx.fill();
        ctx.fillStyle = '#211b1a';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        roundRectPath(ctx, x - 1.8, y - 1.6, 3.6, 3.6, 1.4);
        ctx.fill();
      }
    });
    line(ctx, [[-w / 2 + 4, -h / 2 + 1.6], [w / 2 - 4, -h / 2 + 1.6]], 1, '#6a5f5a', false, 0.8);
  },
});

defineSprite({
  id: 'prop.kitchen.basil_leaves',
  w: 64, h: 44, ax: 32, ay: 22,
  draw: (ctx) => {
    const R = rng(6);
    for (let i = 0; i < 5; i++) {
      const x = (R() - 0.5) * 40, y = (R() - 0.5) * 22;
      softShape(ctx, (p) => ellipsePath(p, x + 4, y + 2.5, 5, 3), 2, 'rgba(30,20,10,0.25)');
      leaf(ctx, x - 4, y, 9 + R() * 4, R() * 6.28, R() < 0.5 ? '#3f9a45' : '#4caf50', 0.9);
    }
  },
});

function sauceStain(ctx: Ctx, seed: number, r: number) {
  ctx.save();
  ctx.beginPath();
  splatPath(ctx, 0, 0, r, seed, 6);
  ctx.fillStyle = rgba('#a3361e', 0.38);
  ctx.fill();
  ctx.beginPath();
  splatPath(ctx, -r * 0.08, -r * 0.08, r * 0.72, seed, 0);
  ctx.fillStyle = rgba('#d0532e', 0.42);
  ctx.fill();
  ctx.restore();
  glint(ctx, -r * 0.3, -r * 0.25, r * 0.28, r * 0.1, -0.4, 0.4);
  // squashed tomato: skin flap + seeds, so it reads as food
  shape(ctx, (p) => { p.moveTo(-r * 0.3, r * 0.05); p.quadraticCurveTo(-r * 0.05, -r * 0.42, r * 0.36, -r * 0.12); p.quadraticCurveTo(r * 0.1, r * 0.02, r * 0.24, r * 0.26); p.quadraticCurveTo(-r * 0.1, r * 0.3, -r * 0.3, r * 0.05); p.closePath(); }, { fill: '#e04a32', ink: 1, inkColor: '#7a2414', shadow: '#b8301e', shadowOffset: [-1, -1], gloss: [{ x: -r * 0.05, y: -r * 0.14, rx: r * 0.12, ry: r * 0.05, rot: -0.4, alpha: 0.7 }] });
  speckle(ctx, r * 0.1, r * 0.15, r * 0.55, r * 0.35, 9, '#f4cf7a', Math.max(0.6, r * 0.05), seed + 1, 0.9);
  if (r > 18) leaf(ctx, r * 0.45, -r * 0.4, 7, -0.6, '#3f9a45', 0.8);
}

defineSprite({ id: 'prop.kitchen.sauce_a', w: 76, h: 64, ax: 38, ay: 32, draw: (ctx) => sauceStain(ctx, 4, 22) });
defineSprite({ id: 'prop.kitchen.sauce_b', w: 56, h: 48, ax: 28, ay: 24, draw: (ctx) => sauceStain(ctx, 9, 14) });

defineSprite({
  id: 'prop.kitchen.peels',
  w: 70, h: 44, ax: 35, ay: 22,
  draw: (ctx) => {
    const R = rng(3);
    for (let i = 0; i < 6; i++) {
      const x = (R() - 0.5) * 46, y = (R() - 0.5) * 22, a = R() * 6.28;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      const onion = R() < 0.5;
      shape(ctx, (p) => { p.moveTo(-6, 0); p.quadraticCurveTo(-2, -5, 6, -2); p.quadraticCurveTo(2, 1, 5, 4); p.quadraticCurveTo(-3, 4, -6, 0); p.closePath(); }, { fill: onion ? '#d39a55' : '#f1e7d4', ink: 0.8, inkColor: onion ? '#7a4a22' : '#a89a80', shadow: onion ? '#b0763a' : '#d6cab2', shadowOffset: [-0.8, -0.8] });
      ctx.restore();
    }
  },
});

defineSprite({
  id: 'prop.kitchen.pasta',
  w: 70, h: 50, ax: 35, ay: 25,
  draw: (ctx) => {
    const R = rng(12);
    for (let i = 0; i < 5; i++) {
      const x0 = (R() - 0.5) * 40, y0 = (R() - 0.5) * 24;
      const pts: Pt[] = [[x0, y0]];
      for (let k = 0; k < 4; k++) pts.push([x0 + (k + 1) * 6 + (R() - 0.5) * 6, y0 + (R() - 0.5) * 10]);
      line(ctx, pts, 2.6, '#7a5a20', true, 0.5);
      line(ctx, pts, 1.8, '#f2cf6a', true);
    }
    // a couple of penne
    for (let i = 0; i < 3; i++) {
      const x = (R() - 0.5) * 40, y = (R() - 0.5) * 24;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(R() * 6.28);
      shape(ctx, (p) => { p.moveTo(-5, -2); p.lineTo(4, -2.6); p.lineTo(6, 2); p.lineTo(-3, 2.6); p.closePath(); }, { fill: '#f0c95a', ink: 0.9, shadow: '#c99a32', shadowOffset: [-0.6, -0.8] });
      ctx.restore();
    }
  },
});

/** Soft cast shadows that extend a prop island's ends (floor layer). */
defineSprite({
  id: 'prop.kitchen.shadow_r',
  w: 40, h: 80, ax: 4, ay: 68,
  draw: (ctx) => {
    clipped(ctx, (p) => p.rect(0, -80, 40, 92), () => aoRect(ctx, -30, -D - 2, 46, D + 10, 9, 0.55, 6));
  },
});
defineSprite({
  id: 'prop.kitchen.shadow_l',
  w: 30, h: 80, ax: 26, ay: 68,
  draw: (ctx) => {
    clipped(ctx, (p) => p.rect(-30, -80, 30, 92), () => aoRect(ctx, -10, -D + 2, 30, D + 6, 7, 0.38, 6));
  },
});

// ---------------------------------------------------------------------------
// More kitchen life: drying pasta, baskets, plates, mop, stool, fridge, cart
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.kitchen.pasta_rack',
  w: 84, h: 96, ax: 42, ay: 88,
  draw: (ctx) => {
    ao(ctx, 2, -4, 36, 9, 0.45);
    const wood = '#b98352';
    // feet + post
    shape(ctx, (p) => roundRectPath(p, -26, -6, 52, 6, 3), { fill: shade(wood, 0.1), ink: 1.6, shadowOffset: [-1, -1.5] });
    shape(ctx, (p) => roundRectPath(p, -3, -82, 6, 78, 2), { fill: wood, ink: 1.6, shadow: shade(wood, 0.3), shadowOffset: [-2, 0] });
    // three arms with tagliatelle
    const arms = [-74, -62, -50];
    arms.forEach((ay, i) => {
      const len = 34 - i * 2;
      shape(ctx, (p) => roundRectPath(p, -len, ay - 1.6, len * 2, 3.2, 1.6), { fill: light(wood, 0.1), ink: 1.2, shadow: 'none' });
      const R = rng(4 + i);
      for (let k = 0; k < 9; k++) {
        const x = -len + 4 + k * ((len * 2 - 8) / 8) + (R() - 0.5) * 2;
        const dl = 18 + R() * 16 - i * 3;
        const sw = (R() - 0.5) * 3;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 1.8, ay + 1);
        ctx.quadraticCurveTo(x - 1.8 + sw, ay + dl * 0.6, x - 1 + sw, ay + dl);
        ctx.moveTo(x + 1.8, ay + 1);
        ctx.quadraticCurveTo(x + 1.8 + sw, ay + dl * 0.6, x + 1 + sw, ay + dl);
        ctx.lineWidth = 3.6;
        ctx.strokeStyle = shade('#f1d98a', 0.35);
        ctx.stroke();
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#f3dc92';
        ctx.stroke();
        ctx.restore();
      }
    });
    speckle(ctx, 0, -2, 26, 3, 20, '#ffffff', 0.8, 3, 0.7);
  },
});

defineSprite({
  id: 'prop.kitchen.basket',
  w: 62, h: 56, ax: 30, ay: 48,
  draw: (ctx) => {
    ao(ctx, 3, -5, 28, 9, 0.5);
    const body = (p: Ctx) => { p.moveTo(-23, -26); p.lineTo(23, -26); p.lineTo(18, -1); p.quadraticCurveTo(0, 3, -18, -1); p.closePath(); };
    shape(ctx, body, { fill: '#c99a55', ink: 2, shadow: 'none' });
    clipped(ctx, body, () => {
      for (let r = 0; r < 7; r++) for (let i = 0; i < 12; i++) {
        const x = -24 + i * 4.2 + (r % 2) * 2.1, y = -26 + r * 3.8;
        flat(ctx, (p) => ellipsePath(p, x, y + 1.8, 2.2, 1.5), r % 2 ? '#d8ad66' : '#b8863f', 0);
      }
      wash(ctx, lgrad(ctx, -23, 0, 23, 0, [[0, 'rgba(255,240,200,0.15)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(60,30,10,0.35)']]));
    });
    const R = rng(7);
    for (let i = 0; i < 9; i++) tomato(ctx, -16 + (i % 5) * 8 + (i > 4 ? 4 : 0) + (R() - 0.5) * 2, -28 - (i > 4 ? 5 : 0) + (R() - 0.5) * 2, 5, i + 20, 1.1);
    shape(ctx, (p) => roundRectPath(p, -25, -29, 50, 5, 2.5), { fill: '#b8863f', ink: 1.6, shadowOffset: [-1, -1.2] });
    // handle arc
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -28, 20, 22, 0, Math.PI, 0);
    ctx.lineWidth = 5.2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#c99a55';
    ctx.stroke();
    ctx.restore();
  },
});

defineSprite({
  id: 'prop.kitchen.plates',
  w: 66, h: 56, ax: 32, ay: 48,
  draw: (ctx) => {
    ao(ctx, 3, -6, 30, 10, 0.45);
    const plateStack = (x: number, y: number, n: number, r: number) => {
      for (let i = 0; i < n; i++) {
        const yy = y - i * 3.1;
        shape(ctx, (p) => ellipsePath(p, x, yy, r, r * 0.38), { fill: '#f6f2ea', ink: 1.1, shadow: '#cfc6b6', shadowOffset: [-1.2, -0.6] });
        line(ctx, [[x - r * 0.9, yy + 0.4], [x + r * 0.9, yy + 0.4]], 0.6, '#2f6fb8', false, 0.6);
      }
      flat(ctx, (p) => ellipsePath(p, x, y - (n - 1) * 3.1, r * 0.6, r * 0.22), '#e9e2d4', 0);
    };
    plateStack(-9, -6, 7, 16);
    plateStack(14, -2, 4, 13);
    // a bowl on top
    shape(ctx, (p) => { p.moveTo(-20, -30); p.lineTo(2, -30); p.quadraticCurveTo(0, -20, -9, -20); p.quadraticCurveTo(-18, -20, -20, -30); p.closePath(); }, { fill: '#f6f2ea', ink: 1.2, shadow: '#d2c9b9', shadowOffset: [-2, -1] });
    line(ctx, [[-19, -27], [1, -27]], 1, '#2f6fb8', false, 0.7);
  },
});

defineSprite({
  id: 'prop.kitchen.bucket',
  w: 60, h: 96, ax: 26, ay: 88,
  draw: (ctx) => {
    ao(ctx, 3, -4, 22, 8, 0.45);
    // mop handle leaning
    inkLine(ctx, [[8, -12], [26, -86]], 3, '#c99a5a');
    const body = (p: Ctx) => { p.moveTo(-15, -28); p.lineTo(15, -28); p.lineTo(12, -2); p.quadraticCurveTo(0, 2, -12, -2); p.closePath(); };
    shape(ctx, body, { fill: '#aeb6bd', ink: 1.8, shadow: '#7f8890', shadowOffset: [-4, 0], gloss: [{ x: -8, y: -16, rx: 2, ry: 8, alpha: 0.5 }] });
    for (const yy of [-22, -9]) line(ctx, [[-14, yy], [14, yy]], 1, '#7f8890', false, 0.9);
    shape(ctx, (p) => ellipsePath(p, 0, -28, 15, 5), { fill: '#7f8890', ink: 1.6, shadow: 'none' });
    flat(ctx, (p) => ellipsePath(p, 0, -27.6, 12.4, 3.6), '#8fb8c4', 0);
    // mop head in the bucket
    for (let i = 0; i < 9; i++) line(ctx, [[2 + (i - 4) * 1.6, -30], [4 + (i - 4) * 2.2, -36 - (i % 3)]], 1.6, '#efe9da', true, 0.95);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -28, 16, 18, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#4a4f57';
    ctx.stroke();
    ctx.restore();
  },
});

defineSprite({
  id: 'prop.kitchen.stool',
  w: 44, h: 58, ax: 22, ay: 50,
  draw: (ctx) => {
    ao(ctx, 2, -3, 18, 6, 0.45);
    const wood = '#a8713f';
    for (const [x0, x1] of [[-11, -14], [11, 14], [-5, -6], [5, 6]] as const) inkLine(ctx, [[x0, -30], [x1, -1]], 2.4, x0 * x1 > 0 && Math.abs(x0) < 6 ? shade(wood, 0.25) : wood);
    line(ctx, [[-12, -12], [12, -12]], 1.6, shade(wood, 0.3));
    shape(ctx, (p) => ellipsePath(p, 0, -32, 15, 6), { fill: light(wood, 0.1), ink: 1.8, shadow: shade(wood, 0.25), shadowOffset: [-2, -1.6], gloss: [{ x: -5, y: -34, rx: 5, ry: 1.4, alpha: 0.4 }] });
    // a folded tea towel on top
    shape(ctx, (p) => roundRectPath(p, -9, -38, 16, 6, 1.5), { fill: '#f4efe4', ink: 1, shadowOffset: [-1, -1] });
    line(ctx, [[-9, -35.5], [7, -35.5]], 1, '#c63a2f');
  },
});

defineSprite({
  id: 'prop.kitchen.fridge',
  w: 118, h: 196, ax: 58, ay: 184,
  draw: (ctx) => {
    const W = 104, FD = 44, FH = 134;
    const x0 = -W / 2;
    aoRect(ctx, x0 - 4, -FD - 2, W + 14, FD + 8, 8, 0.55, 6);
    shape(ctx, (p) => roundRectPath(p, x0, -FH - FD, W, FH + FD, [6, 6, 3, 3]), { fill: '#a9b0b8', ink: 2.8, shadow: 'none' });
    steelRect(ctx, x0 + 1, -FH, W - 2, FH - 1, '#bcc3ca', 61, true);
    // doors
    for (const dx of [x0 + 3, -1]) {
      shape(ctx, (p) => roundRectPath(p, dx + 1, -FH + 4, W / 2 - 4, FH - 14, 3), { fill: '#c3cad0', ink: 1, inkColor: '#59606a', shadow: '#a0a7af', shadowOffset: [-2, -1.6] });
      clipped(ctx, (p) => roundRectPath(p, dx + 1, -FH + 4, W / 2 - 4, FH - 14, 3), () => {
        wash(ctx, lgrad(ctx, dx, -FH, dx + W / 2, 0, [[0, 'rgba(255,255,255,0.3)'], [0.35, 'rgba(255,255,255,0)'], [0.4, 'rgba(255,255,255,0.18)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.1)']]));
      });
    }
    for (const hx of [-6, 4]) shape(ctx, (p) => roundRectPath(p, hx - 1.6, -FH + 34, 3.2, 46, 1.6), { fill: '#eef1f3', ink: 1, inkColor: '#3e434a', shadow: '#a9b0b8', shadowOffset: [-0.8, -0.8] });
    // grille + kick
    ctx.fillStyle = '#3e4148';
    ctx.fillRect(x0 + 2, -9, W - 4, 9);
    for (let i = 0; i < 12; i++) line(ctx, [[x0 + 8 + i * 8, -7], [x0 + 12 + i * 8, -2]], 1, '#6d737b');
    // control display
    flat(ctx, (p) => roundRectPath(p, x0 + 12, -FH + 12, 22, 9, 2), '#20343a', 0.8);
    strokeText(ctx, '4', x0 + 19, -FH + 13.6, 5.5, '#7fe7ff', 1);
    flat(ctx, (p) => circlePath(p, x0 + 28, -FH + 16.5, 1.4), '#7fe7ff', 0);
    // magnets + a note (no text)
    flat(ctx, (p) => roundRectPath(p, 14, -FH + 18, 18, 22, 1.5), '#fff6c8', 0.7, '#8a7a50');
    for (let k = 0; k < 4; k++) line(ctx, [[17, -FH + 24 + k * 4], [29 - (k % 2) * 4, -FH + 24 + k * 4]], 0.7, '#5a6a9a', false, 0.8);
    flat(ctx, (p) => circlePath(p, 23, -FH + 18.5, 2.2), '#d63a2f', 0.6);
    flat(ctx, (p) => circlePath(p, x0 + 20, -FH + 52, 3), '#2f9a52', 0.6);
    // top
    steelRect(ctx, x0 + 1, -FH - FD + 1, W - 2, FD - 1, '#d3d8dc', 63);
    line(ctx, [[x0 + 1, -FH], [x0 + W - 1, -FH]], 1.6, INK, false, 0.85);
    // stuff on top: a crate of lemons-like jars & a bread loaf
    shape(ctx, (p) => ellipsePath(p, -18, -FH - 22, 16, 7), { fill: '#d39a4a', ink: 1.4, shadow: '#a86a2c', shadowOffset: [-2, -2], gloss: [{ x: -24, y: -FH - 25, rx: 5, ry: 1.6, alpha: 0.5 }] });
    for (let i = 0; i < 4; i++) line(ctx, [[-28 + i * 6, -FH - 26], [-24 + i * 6, -FH - 18]], 1, '#9a5a22', false, 0.8);
    jarTop(ctx, 18, -FH - 14);
  },
});

function jarTop(ctx: Ctx, x: number, y: number) {
  shape(ctx, (p) => roundRectPath(p, x - 7, y - 18, 14, 18, 3), { fill: '#c23a2a', ink: 1.2, shadowOffset: [-2, -1], gloss: [{ x: x - 3.5, y: y - 10, rx: 1.2, ry: 5, alpha: 0.5 }] });
  flat(ctx, (p) => roundRectPath(p, x - 7.5, y - 21, 15, 4, 1.4), '#c9b04a', 0.9);
  flat(ctx, (p) => p.rect(x - 6, y - 12, 12, 5), '#f2ead6', 0.5);
}

defineSprite({
  id: 'prop.kitchen.cart',
  w: 96, h: 88, ax: 46, ay: 80,
  draw: (ctx) => {
    ao(ctx, 3, -10, 42, 13, 0.45);
    const W = 78, CD = 30;
    const x0 = -W / 2;
    // wheels
    for (const wx of [x0 + 6, x0 + W - 6]) shape(ctx, (p) => circlePath(p, wx, -3, 3.4), { fill: '#3a3a40', ink: 1.2, shadow: 'none' });
    // legs
    for (const lx of [x0 + 4, x0 + W - 4]) inkLine(ctx, [[lx, -6], [lx, -58]], 2, '#c9cfd4');
    // lower shelf with pots
    steelRect(ctx, x0, -24 - CD * 0.55, W, CD * 0.55, '#c6ccd1', 71);
    shape(ctx, (p) => roundRectPath(p, x0, -24, W, 4, 1), { fill: '#b3bac1', ink: 1.4, shadow: 'none' });
    shape(ctx, (p) => roundRectPath(p, x0 + 8, -40, 26, 16, 2), { fill: '#c8743f', ink: 1.2, shadowOffset: [-2, -1], gloss: [{ x: x0 + 13, y: -36, rx: 3, ry: 1.2, alpha: 0.6 }] });
    shape(ctx, (p) => roundRectPath(p, x0 + 40, -36, 28, 12, 2), { fill: '#d5dadf', ink: 1.2, shadowOffset: [-2, -1] });
    // top shelf with plated pasta waiting at the pass
    steelRect(ctx, x0, -58 - CD, W, CD, '#d3d8dc', 72);
    shape(ctx, (p) => roundRectPath(p, x0, -58, W, 4, 1), { fill: '#b3bac1', ink: 1.4, shadow: 'none' });
    for (const [px, py] of [[-20, -74], [6, -70], [24, -78]] as const) {
      shape(ctx, (p) => ellipsePath(p, px, py, 11, 6), { fill: '#f6f2ea', ink: 1.1, shadow: '#d2c9b9', shadowOffset: [-1, -1] });
      flat(ctx, (p) => blobPath(p, px, py - 0.6, 6.5, 3.4, 0.2, 9, px + 50), '#e8c463', 0.5, '#a07a2a');
      flat(ctx, (p) => blobPath(p, px + 1, py - 1.2, 4, 2, 0.25, 8, px + 9), '#c8331f', 0);
      leaf(ctx, px - 1, py - 2.4, 4, -0.5, '#3d9a44', 0.5);
    }
  },
});

/** Warm light pool on the floor (oven / stove glow), floor layer. */
defineSprite({
  id: 'prop.kitchen.glow',
  w: 280, h: 160, ax: 140, ay: 80,
  draw: (ctx) => {
    ctx.save();
    ctx.scale(1, 0.55);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 138);
    g.addColorStop(0, 'rgba(255,170,80,0.32)');
    g.addColorStop(0.45, 'rgba(255,150,60,0.14)');
    g.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    circlePath(ctx, 0, 0, 138);
    ctx.fill();
    ctx.restore();
  },
});

/** Window light falling on the floor (four panes), floor layer. */
defineSprite({
  id: 'prop.kitchen.sunpatch',
  w: 260, h: 200, ax: 130, ay: 100,
  draw: (ctx) => {
    const sk = 0.55; // skew of the light shaft
    ctx.save();
    ctx.transform(1, 0, sk, 1, 0, 0);
    for (const [px, py] of [[-62, -70], [4, -70], [-62, 4], [4, 4]] as const) {
      softShape(ctx, (p) => roundRectPath(p, px - 30, py, 58, 66, 4), 9, 'rgba(255,238,196,0.3)');
    }
    ctx.restore();
  },
});

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

type ModKey = 'board' | 'dough' | 'veg' | 'stove' | 'sink';
const MODS: Record<ModKey, { id: string; w: number }> = {
  board: { id: 'prop.kitchen.counter_board', w: 150 },
  dough: { id: 'prop.kitchen.counter_dough', w: 150 },
  veg: { id: 'prop.kitchen.counter_veg', w: 120 },
  stove: { id: 'prop.kitchen.stove', w: 150 },
  sink: { id: 'prop.kitchen.sink', w: 130 },
};
const ISLANDS: ModKey[][] = [
  ['board', 'stove', 'dough'],
  ['veg', 'sink'],
  ['stove', 'board'],
  ['dough', 'stove', 'veg'],
  ['sink', 'board'],
  ['board', 'stove'],
  ['veg', 'stove', 'board'],
  ['dough', 'sink'],
];

const BREAKABLES: [[string, number, string, number], number][] = [
  [['prop.kitchen.sack', 22, 'flour', 2], 3],
  [['prop.kitchen.sacks', 40, 'flour', 3], 1.4],
  [['prop.common.crate_tomato', 30, 'tomato', 2], 3],
  [['prop.kitchen.tins', 30, 'glass', 2], 2],
  [['prop.common.crate', 28, 'wood', 2], 0.8],
  [['prop.common.crate_stack', 30, 'wood', 3], 0.8],
  [['prop.kitchen.basket', 26, 'straw', 2], 1.6],
  [['prop.kitchen.plates', 28, 'glass', 1], 1.2],
];
const DECOR: [[string, number], number][] = [
  [['prop.kitchen.pasta_rack', 36], 1.2],
  [['prop.kitchen.parmigiano', 26], 1],
  [['prop.kitchen.bucket', 18], 0.8],
  [['prop.kitchen.stool', 16], 1],
  [['prop.kitchen.cart', 40], 0.9],
  [['prop.common.basil_pot', 14], 0.8],
];

function breakableAt(L: Layout, x: number, y: number): boolean {
  const [sprite, hw, debris, hp] = L.weighted(BREAKABLES);
  const b = { x0: x - hw, y0: y - 36, x1: x + hw, y1: y + 4 };
  if (!L.canSoft(b)) return false;
  L.softBox(b);
  L.add({ sprite, x, y, breakable: { hp, debris } });
  return true;
}

function decorAt(L: Layout, x: number, y: number): boolean {
  const [sprite, hw] = L.weighted(DECOR);
  const b = { x0: x - hw, y0: y - 40, x1: x + hw, y1: y + 4 };
  if (!L.canSoft(b) || L.out.some((p) => p.sprite === sprite)) return false;
  L.softBox(b);
  L.add({ sprite, x, y });
  return true;
}

function scatter(L: Layout, n: number, fn: (L: Layout, x: number, y: number) => boolean) {
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < 8; t++) {
      const [x, y] = L.pt(56);
      if (fn(L, x, y)) break;
    }
  }
}

const AREA_BUDGET = CHUNK * CHUNK * 0.1;

function placeIsland(L: Layout, fy: number): boolean {
  const comp = L.pick(ISLANDS);
  const W = comp.reduce((s, k) => s + MODS[k].w, 0);
  const lo = L.X0 + L.margin + W / 2 + 8, hi = L.X0 + L.size - L.margin - W / 2 - 14;
  if (hi < lo) return false;
  const xc = Math.round(L.range(lo, hi));
  const box = { x0: xc - W / 2, y0: fy - D, x1: xc + W / 2, y1: fy };
  if (!L.canBlock(box) || L.colliderArea + W * D > AREA_BUDGET) return false;
  L.block(box);
  let x = xc - W / 2;
  let hot = false;
  for (const k of comp) {
    const m = MODS[k];
    const mx = x + m.w / 2;
    const p: PropPlacement = { sprite: m.id, x: mx, y: fy, collider: rectCol(m.w, D, 0, -D / 2), sortOffset: -D / 2 };
    if (k === 'stove') {
      p.animFps = 5;
      p.fx = { kind: 'steam', ox: -46, oy: -H - D + 4, rate: 1 };
      p.light = { r: 130, color: '#ffb066', intensity: 0.5, flicker: 0.15, oy: -H };
      L.floor('prop.kitchen.mat', mx, fy + 30);
      hot = true;
    } else if (k === 'sink') {
      p.fx = { kind: 'drip', ox: 14, oy: -H - D - 12, rate: 0.5 };
      L.floor('prop.kitchen.mat', mx, fy + 30);
      if (L.chance(0.6)) L.floor('prop.common.puddle_small', mx + L.range(-30, 30), fy + 50);
    }
    L.add(p);
    x += m.w;
  }
  L.floor('prop.kitchen.shadow_r', xc + W / 2, fy);
  L.floor('prop.kitchen.shadow_l', xc - W / 2, fy);
  if (hot && L.chance(0.5)) L.floor('prop.kitchen.glow', xc, fy + 26);
  // pot rack overhead (above the back half of the island)
  if (L.chance(0.7)) L.overhead('prop.kitchen.rack', xc + L.range(-W / 2 + 118, W / 2 - 118), fy - 4);
  // breakables guarding the island ends
  if (L.chance(0.75)) breakableAt(L, xc + W / 2 + 40, fy + L.range(-10, 18));
  if (L.chance(0.55)) breakableAt(L, xc - W / 2 - 38, fy + L.range(-6, 18));
  if (L.chance(0.4)) decorAt(L, xc + L.range(-W / 2, W / 2), fy + L.range(70, 110));
  return true;
}

function placeOven(L: Layout, fy: number): boolean {
  const W = OVEN_W;
  const lo = L.X0 + L.margin + W / 2 + 60, hi = L.X0 + L.size - L.margin - W / 2 - 20;
  const xc = Math.round(L.range(lo, hi));
  const box = { x0: xc - W / 2, y0: fy - OVEN_D, x1: xc + W / 2, y1: fy };
  if (!L.canBlock(box) || L.colliderArea + W * OVEN_D > AREA_BUDGET) return false;
  L.block(box);
  L.floor('prop.kitchen.glow', xc, fy + 34);
  L.add({
    sprite: 'prop.kitchen.oven', x: xc, y: fy, animFps: 7,
    collider: rectCol(W, OVEN_D, 0, -OVEN_D / 2), sortOffset: -OVEN_D / 2,
    light: { r: 320, color: '#ff9442', intensity: 0.9, flicker: 0.35, oy: -OVEN_H - 30 },
    fx: { kind: 'flame', ox: -10, oy: -OVEN_H - 40, rate: 1 },
  });
  L.floor('prop.kitchen.shadow_r', xc + W / 2, fy);
  // wood pile + flour by the oven
  const wx = xc - W / 2 - 52;
  const wb = { x0: wx - 40, y0: fy - 40, x1: wx + 40, y1: fy + 4 };
  if (L.canSoft(wb)) { L.softBox(wb); L.add({ sprite: 'prop.kitchen.woodpile', x: wx, y: fy - 4, breakable: { hp: 2, debris: 'wood' } }); }
  breakableAt(L, xc + W / 2 + 44, fy + 8);
  L.floor('prop.kitchen.flour_b', xc + L.range(-40, 40), fy + 46);
  return true;
}

function placePantry(L: Layout, fy: number): boolean {
  const fridge = L.chance(0.45);
  const n = fridge ? 1 : L.chance(0.5) ? 2 : 1;
  const SW = 132, FW = 104;
  const W = SW * n + (n - 1) * 6 + (fridge ? FW + 4 : 0);
  const lo = L.X0 + L.margin + W / 2 + 8, hi = L.X0 + L.size - L.margin - W / 2 - 8;
  const xc = Math.round(L.range(lo, hi));
  const SD = 44;
  const box = { x0: xc - W / 2 - 3, y0: fy - SD, x1: xc + W / 2 + 3, y1: fy };
  if (!L.canBlock(box) || L.colliderArea + W * SD > AREA_BUDGET) return false;
  L.block(box);
  let x = xc - W / 2;
  const fridgeLeft = L.chance(0.5);
  if (fridge && fridgeLeft) {
    L.add({ sprite: 'prop.kitchen.fridge', x: x + FW / 2, y: fy, collider: rectCol(FW, 44, 0, -22), sortOffset: -22 });
    x += FW + 4;
  }
  for (let i = 0; i < n; i++) {
    L.add({ sprite: i % 2 ? 'prop.kitchen.shelf_b' : L.pick(['prop.kitchen.shelf', 'prop.kitchen.shelf_b']), x: x + SW / 2, y: fy, collider: rectCol(SW + 6, 34, 0, -17), sortOffset: -17 });
    x += SW + 6;
  }
  if (fridge && !fridgeLeft) {
    L.add({ sprite: 'prop.kitchen.fridge', x: x + FW / 2 - 2, y: fy, collider: rectCol(FW, 44, 0, -22), sortOffset: -22 });
  }
  // hangings in front of the shelves
  L.overhead(L.pick(['prop.kitchen.garlic', 'prop.kitchen.chillies']), xc - W / 2 + 22, fy - 8);
  if (n === 2 || L.chance(0.5)) L.overhead(L.chance(0.5) ? 'prop.kitchen.chillies' : 'prop.kitchen.garlic', xc + W / 2 - 24, fy - 8);
  for (let i = 0; i < 3; i++) breakableAt(L, xc + L.range(-W / 2 - 50, W / 2 + 50), fy + L.range(34, 76));
  return true;
}

function placeCellar(L: Layout, fy: number): boolean {
  const n = L.int(2, 3);
  const W = n * 56;
  const lo = L.X0 + L.margin + W / 2 + 10, hi = L.X0 + L.size - L.margin - W / 2 - 10;
  const xc = Math.round(L.range(lo, hi));
  const box = { x0: xc - W / 2, y0: fy - 58, x1: xc + W / 2, y1: fy };
  const area = n * Math.PI * 28 * 28;
  if (!L.canBlock(box) || L.colliderArea + area > AREA_BUDGET) return false;
  L.block(box, area);
  for (let i = 0; i < n; i++) {
    const bx = xc - W / 2 + 28 + i * 56;
    const by = fy - (i % 2) * 12;
    L.add({ sprite: i === 1 ? 'prop.common.barrel_wine' : 'prop.common.barrel', x: bx, y: by, collider: circleCol(28, 0, -16), sortOffset: -14 });
  }
  if (L.chance(0.7)) L.overhead('prop.kitchen.salumi', xc, fy - 8);
  breakableAt(L, xc + W / 2 + 40, fy + 6);
  breakableAt(L, xc - W / 2 - 36, fy + 10);
  return true;
}

function decorate(L: Layout) {
  // floor decals
  if (L.chance(0.7)) L.floor(L.chance(0.5) ? 'prop.kitchen.flour_a' : 'prop.kitchen.flour_b', ...L.pt(90), L.chance(0.5));
  if (L.chance(0.8)) L.floor('prop.kitchen.drain', L.X0 + L.size / 2 + L.range(-90, 90), L.Y0 + L.size / 2 + L.range(-40, 40));
  if (L.chance(0.35)) L.floor('prop.kitchen.sunpatch', ...L.pt(130));
  const n = L.int(4, 7);
  for (let i = 0; i < n; i++) {
    const s = L.weighted([
      ['prop.kitchen.basil_leaves', 3], ['prop.kitchen.sauce_a', 0.6], ['prop.kitchen.sauce_b', 1], ['prop.kitchen.peels', 1.5],
      ['prop.kitchen.pasta', 1.2], ['prop.common.puddle', 0.5], ['prop.common.crumbs', 1.2], ['prop.kitchen.flour_b', 0.8],
    ]);
    L.floor(s, ...L.pt(40), L.chance(0.5));
  }
}

function populateKitchen(cx: number, cy: number, rnd: () => number): PropPlacement[] {
  const L = new Layout(cx, cy, CHUNK, rnd);
  const bands = [L.Y0 + 250 + L.range(-24, 20), L.Y0 + 646 + L.range(-30, 12)];
  let oven = false;
  for (const fy of bands) {
    let placed = 0;
    for (let attempt = 0; attempt < 3 && placed < 2; attempt++) {
      const kind = L.weighted<string>([['island', 4], ['oven', oven ? 0 : 1.1], ['pantry', 1.7], ['cellar', 1.4], ['open', placed ? 2.2 : 0.8]]);
      let ok = false;
      if (kind === 'island') ok = placeIsland(L, fy);
      else if (kind === 'oven') ok = oven = placeOven(L, fy);
      else if (kind === 'pantry') ok = placePantry(L, fy);
      else if (kind === 'cellar') ok = placeCellar(L, fy);
      else break;
      if (ok) placed++;
    }
  }
  scatter(L, L.int(2, 4), breakableAt);
  scatter(L, L.int(1, 3), decorAt);
  decorate(L);
  return L.out;
}

registerStageEnv({
  id: 'kitchen',
  tileSize: TS,
  tile: (tx, ty) => `tile.kitchen.${pickWeighted(hash2(tx, ty, 17), TILE_W)}`,
  chunkSize: CHUNK,
  populate: populateKitchen,
  ambient: { tint: '#fff1dc', darkness: 0, darkColor: '#2a1a12', vignette: 0.28, particles: 'flour' },
});
