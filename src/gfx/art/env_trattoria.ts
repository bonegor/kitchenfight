/**
 * STAGE 2 — "La Trattoria": the dining room at night.
 * Herringbone parquet (seamless 768u super-texture cut into 3×3 tiles),
 * round tables with red/white gingham cloths and candles in straw-wrapped
 * Chianti fiaschi, straw-seat chairs, potted lemon trees, wine racks, an
 * upright piano, columns, a coat stand, a sideboard, rugs, pendant lamps.
 */
import { defineSprite } from '../sprites';
import { registerStageEnv } from '../stageenv';
import type { PropPlacement } from '../stageenv';
import {
  Ctx, Pt, INK, shape, flat, line, ellipsePath, circlePath, roundRectPath, blobPath, splatPath,
  rng, rgba, mix, shade, light, speckle, glint,
} from '../painter';
import {
  Layout, hash2, mod, rectCol, circleCol, ao, aoRect, softShape, clipped, lgrad, wash, bloom, fadeUp,
  grain, weave, lemon, leaf, bottle,
} from './env_common';

const TS = 256;
const SUPER = 768;
const CHUNK = 720;

// ---------------------------------------------------------------------------
// Herringbone parquet
// Planks W×5W at ±45°. In screen space the pattern repeats every 128u in x
// and 25.6u in y, so a 768u super-texture tiles seamlessly.
// ---------------------------------------------------------------------------

const HB = 12.8; // W/√2
const PW = HB * Math.SQRT2; // plank width ≈ 18.1
const PL = PW * 5; // plank length ≈ 90.5
const WOODS = ['#93684a', '#9a7051', '#8a6145', '#a07655', '#8f6648', '#966c4d', '#855d42'];

function parquetWindow(ctx: Ctx, wx: number, wy: number) {
  const X0 = wx * TS, Y0 = wy * TS, X1 = X0 + TS, Y1 = Y0 + TS;
  ctx.save();
  ctx.translate(-X0, -Y0);
  ctx.fillStyle = '#5c3b27';
  ctx.fillRect(X0, Y0, TS, TS);
  const planks: { x: number; y: number; a: number; t: number }[] = [];
  for (let m = Math.floor((X0 - 140) / 128); m <= Math.ceil((X1 + 140) / 128); m++) {
    for (const t of [0, 1]) {
      const xc = 128 * m + (t ? 89.6 : 25.6);
      if (xc < X0 - 80 || xc > X1 + 80) continue;
      const base = 128 * m + (t ? 51.2 : 38.4);
      for (let k = Math.ceil((Y0 - 80 - base) / 25.6); k <= Math.floor((Y1 + 80 - base) / 25.6); k++) {
        planks.push({ x: xc, y: base + 25.6 * k, a: t ? (3 * Math.PI) / 4 : Math.PI / 4, t });
      }
    }
  }
  for (const p of planks) {
    const kx = Math.round(mod(p.x, SUPER) * 10), ky = Math.round(mod(p.y, SUPER) * 10);
    const h = hash2(kx, ky, 31 + p.t);
    const h2 = hash2(kx, ky, 77);
    let col = WOODS[Math.floor(h * WOODS.length)];
    col = mix(col, h2 < 0.5 ? '#7d5a40' : '#ac8664', Math.abs(h2 - 0.5) * 0.35);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    const x0 = -PL / 2 + 0.55, y0 = -PW / 2 + 0.55, w = PL - 1.1, hh = PW - 1.1;
    ctx.fillStyle = col;
    ctx.fillRect(x0, y0, w, hh);
    // grain along the plank
    const R = rng(Math.floor(h * 1e6));
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const gy = y0 + 2 + R() * (hh - 4);
      ctx.globalAlpha = 0.18 + R() * 0.16;
      ctx.strokeStyle = R() < 0.6 ? shade(col, 0.35) : light(col, 0.25);
      ctx.lineWidth = 0.5 + R() * 0.6;
      ctx.beginPath();
      const amp = 0.5 + R() * 1.2, ph = R() * 6;
      for (let gx = x0 + 3 + R() * 10; gx < x0 + w - 3; gx += 6) {
        const yy = gy + Math.sin(gx * 0.07 + ph) * amp;
        if (gx < x0 + 9) ctx.moveTo(gx, yy);
        else ctx.lineTo(gx, yy);
      }
      ctx.stroke();
    }
    // knot
    if (R() < 0.12) {
      const kx2 = x0 + 12 + R() * (w - 24), ky2 = y0 + 4 + R() * (hh - 8);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = shade(col, 0.4);
      ctx.beginPath();
      ellipsePath(ctx, kx2, ky2, 2.6, 1.6);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = shade(col, 0.4);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ellipsePath(ctx, kx2, ky2, 4.6, 2.8);
      ctx.stroke();
    }
    // bevels: lit edge toward the upper-left, dark edge toward the lower-right
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = '#e8c69a';
    if (p.t === 0) ctx.fillRect(x0, y0, w, 0.9); else ctx.fillRect(x0, y0 + hh - 0.9, w, 0.9);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#3a2214';
    if (p.t === 0) ctx.fillRect(x0, y0 + hh - 1, w, 1); else ctx.fillRect(x0, y0, w, 1);
    ctx.fillRect(x0 + w - 0.8, y0, 0.8, hh);
    ctx.restore();
  }
  // low-frequency tone variation (wraps across the super-texture)
  const R = rng(1234);
  for (let i = 0; i < 16; i++) {
    const bx = R() * SUPER, by = R() * SUPER, br = 60 + R() * 110, dark = R() < 0.55;
    const al = 0.05 + R() * 0.06;
    for (const ox of [-SUPER, 0, SUPER]) for (const oy of [-SUPER, 0, SUPER]) {
      const cx = bx + ox, cy = by + oy;
      if (cx + br < X0 || cx - br > X1 || cy + br < Y0 || cy - br > Y1) continue;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, br);
      g.addColorStop(0, rgba(dark ? '#3a2010' : '#e0b07a', al));
      g.addColorStop(1, rgba(dark ? '#3a2010' : '#e0b07a', 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - br, cy - br, br * 2, br * 2);
    }
  }
  // fine scratches (wrapped)
  const S = rng(99);
  ctx.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const sx = S() * SUPER, sy = S() * SUPER, a = S() * 6.28, len = 6 + S() * 16;
    const al = 0.08 + S() * 0.1;
    for (const ox of [-SUPER, 0, SUPER]) for (const oy of [-SUPER, 0, SUPER]) {
      const cx = sx + ox, cy = sy + oy;
      if (cx + len < X0 || cx - len > X1 || cy + len < Y0 || cy - len > Y1) continue;
      ctx.globalAlpha = al;
      ctx.strokeStyle = '#f0d0a0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

for (let wy = 0; wy < 3; wy++) for (let wx = 0; wx < 3; wx++) {
  defineSprite({ id: `tile.trattoria.${wy * 3 + wx}`, w: TS, h: TS, ax: 0, ay: 0, res: 1.5, draw: (ctx) => parquetWindow(ctx, wx, wy) });
}

// ---------------------------------------------------------------------------
// Table dressing helpers
// ---------------------------------------------------------------------------

const RED = '#c4362e';
const CLOTH = '#f3ebdd';

/** Gingham (red/white) fill inside the current clip. sy squashes vertically (perspective). */
function gingham(ctx: Ctx, x0: number, y0: number, w: number, h: number, cell: number, sy = 1, ox = 0) {
  ctx.save();
  ctx.fillStyle = CLOTH;
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = rgba(RED, 0.5);
  const ch = cell * sy;
  const startX = x0 - mod(x0 - ox, cell * 2);
  for (let x = startX; x < x0 + w; x += cell * 2) ctx.fillRect(x, y0, cell, h);
  const startY = y0 - mod(y0, ch * 2);
  for (let y = startY; y < y0 + h; y += ch * 2) ctx.fillRect(x0, y, w, ch);
  ctx.restore();
}

/** Straw-wrapped Chianti fiasco with a dripping candle. (x,y) = bottom centre. Returns flame position. */
function fiasco(ctx: Ctx, x: number, y: number, s = 1): Pt {
  // bulb (straw)
  const bw = 9 * s, bh = 12 * s;
  const bulb = (p: Ctx) => {
    p.moveTo(x - bw * 0.5, y - bh * 1.02);
    p.bezierCurveTo(x - bw * 1.25, y - bh * 0.85, x - bw * 1.2, y + bh * 0.02, x, y + bh * 0.02);
    p.bezierCurveTo(x + bw * 1.2, y + bh * 0.02, x + bw * 1.25, y - bh * 0.85, x + bw * 0.5, y - bh * 1.02);
    p.closePath();
  };
  shape(ctx, bulb, { fill: '#d6a94e', ink: 1.3, shadow: 'none' });
  clipped(ctx, bulb, () => {
    for (let i = -6; i <= 6; i++) {
      const xx = x + i * bw * 0.2;
      line(ctx, [[xx, y - bh * 1.1], [xx + i * 0.6, y - bh * 0.5], [xx + i * 0.2, y + 2]], 0.9, i % 2 ? '#b8862e' : '#ecc56a', true, 0.9);
    }
    wash(ctx, lgrad(ctx, x - bw, 0, x + bw, 0, [[0, 'rgba(255,240,190,0.25)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(70,30,0,0.45)']]));
    // red & green binding bands
    ctx.fillStyle = '#b8322a';
    ctx.fillRect(x - bw * 1.5, y - bh * 0.92, bw * 3, 1.6 * s);
    ctx.fillStyle = '#2f7a3a';
    ctx.fillRect(x - bw * 1.5, y - bh * 0.92 + 1.6 * s, bw * 3, 1 * s);
  });
  // neck (green glass)
  const ny = y - bh * 1.02;
  const nh = 12 * s;
  shape(ctx, (p) => { p.moveTo(x - 2.6 * s, ny); p.lineTo(x - 1.8 * s, ny - nh); p.lineTo(x + 1.8 * s, ny - nh); p.lineTo(x + 2.6 * s, ny); p.closePath(); }, { fill: '#2f6a3a', ink: 1.1, shadow: '#1f4a28', shadowOffset: [-1, 0], gloss: [{ x: x - 1, y: ny - nh * 0.5, rx: 0.5, ry: nh * 0.35, alpha: 0.6 }] });
  // wax drips down the neck (many colours from many nights)
  const drips: [number, number, string][] = [[-2, 7, '#e8dcc6'], [0.6, 10, '#c43a30'], [1.8, 6, '#f2e6c8'], [-0.6, 13, '#3e7a42'], [-2.2, 4, '#c43a30']];
  for (const [dx, len, c] of drips) {
    shape(ctx, (p) => roundRectPath(p, x + dx * s - 0.9 * s, ny - nh, 1.8 * s, len * s, 0.9 * s), { fill: c, ink: 0.6, shadow: 'none' });
  }
  // candle
  const cy0 = ny - nh;
  shape(ctx, (p) => roundRectPath(p, x - 2 * s, cy0 - 9 * s, 4 * s, 9.5 * s, 1 * s), { fill: '#f3e9d2', ink: 1, shadow: '#d4c4a2', shadowOffset: [-1, 0] });
  shape(ctx, (p) => ellipsePath(p, x, cy0 - 0.5 * s, 3.6 * s, 1.6 * s), { fill: '#efe2c4', ink: 0.8, shadow: 'none' });
  line(ctx, [[x, cy0 - 9 * s], [x, cy0 - 10.6 * s]], 0.6, '#2b1712');
  // flame
  const fy = cy0 - 10 * s;
  bloom(ctx, x, fy - 3 * s, 16 * s, '#ffb04a', 0.55);
  shape(ctx, (p) => { p.moveTo(x, fy - 8 * s); p.quadraticCurveTo(x + 3 * s, fy - 2 * s, x, fy + 0.5 * s); p.quadraticCurveTo(x - 3 * s, fy - 2 * s, x, fy - 8 * s); p.closePath(); }, { fill: '#ffd25a', ink: 0, shadow: '#ff9a2e', shadowOffset: [0.8, 1.6] });
  flat(ctx, (p) => ellipsePath(p, x, fy - 1.8 * s, 1 * s, 1.8 * s), '#fff7d6', 0);
  return [x, fy - 3 * s];
}

function plateSpaghetti(ctx: Ctx, x: number, y: number, r: number, seed: number) {
  shape(ctx, (p) => ellipsePath(p, x, y, r, r * 0.6), { fill: '#f8f4ec', ink: 1.1, shadow: '#d8cfbf', shadowOffset: [-1.2, -1.2] });
  flat(ctx, (p) => ellipsePath(p, x, y, r * 0.66, r * 0.4), '#ece4d6', 0);
  // nest of pasta + sugo + basil
  const R = rng(seed);
  for (let i = 0; i < 8; i++) {
    const a = R() * 6.28;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 1.2, y + Math.sin(a) * 0.8, r * (0.32 + R() * 0.2), r * (0.2 + R() * 0.12), R() * 3, 0, Math.PI * (1.2 + R()));
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = '#a77d2a';
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = '#f2cf6a';
    ctx.stroke();
    ctx.restore();
  }
  flat(ctx, (p) => blobPath(p, x, y - r * 0.05, r * 0.25, r * 0.16, 0.25, 8, seed), '#c8331f', 0.5, '#7a1a10');
  leaf(ctx, x + r * 0.05, y - r * 0.12, r * 0.3, -0.6, '#3d9a44', 0.5, false);
}

function wineGlass(ctx: Ctx, x: number, y: number, s = 1) {
  line(ctx, [[x, y], [x, y - 6 * s]], 1.6, INK);
  line(ctx, [[x, y], [x, y - 6 * s]], 0.7, '#e8f0f2');
  flat(ctx, (p) => ellipsePath(p, x, y, 2.6 * s, 1 * s), '#e8f0f2', 0.6);
  shape(ctx, (p) => { p.moveTo(x - 3.2 * s, y - 13 * s); p.lineTo(x + 3.2 * s, y - 13 * s); p.quadraticCurveTo(x + 3.4 * s, y - 6 * s, x, y - 6 * s); p.quadraticCurveTo(x - 3.4 * s, y - 6 * s, x - 3.2 * s, y - 13 * s); p.closePath(); }, { fill: 'rgba(225,240,245,0.55)', ink: 0.9, shadow: 'none' });
  flat(ctx, (p) => { p.moveTo(x - 3 * s, y - 10.5 * s); p.lineTo(x + 3 * s, y - 10.5 * s); p.quadraticCurveTo(x + 3 * s, y - 6.4 * s, x, y - 6.4 * s); p.quadraticCurveTo(x - 3 * s, y - 6.4 * s, x - 3 * s, y - 10.5 * s); p.closePath(); }, '#7a1428', 0);
  glint(ctx, x - 1.6 * s, y - 11 * s, 0.6 * s, 1.6 * s, 0, 0.8);
}

function napkin(ctx: Ctx, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  shape(ctx, (p) => { p.moveTo(-5, -3); p.lineTo(5, -3.6); p.lineTo(4, 3); p.lineTo(-5.5, 3.4); p.closePath(); }, { fill: '#b8322a', ink: 0.9, shadow: '#8a2018', shadowOffset: [-0.8, -0.8] });
  line(ctx, [[-4, 0], [4, -0.4]], 0.5, '#e86a5a', false, 0.7);
  ctx.restore();
  line(ctx, [[x + 6, y - 3], [x + 6.6, y + 4]], 1, '#d6dbe0');
}

function breadBasketTop(ctx: Ctx, x: number, y: number, s = 1) {
  shape(ctx, (p) => ellipsePath(p, x, y, 9 * s, 5.4 * s), { fill: '#c99a55', ink: 1.1, shadow: '#9a6a2c', shadowOffset: [-1, -1] });
  flat(ctx, (p) => ellipsePath(p, x, y - 0.6 * s, 7 * s, 3.6 * s), '#f2ead8', 0);
  for (const [dx, dy, r] of [[-3, -1, 3.4], [2.6, -1.6, 3.2], [0, 1, 3]] as const) {
    shape(ctx, (p) => ellipsePath(p, x + dx * s, y + dy * s, r * s, r * 0.7 * s), { fill: '#d99a4a', ink: 0.8, shadow: '#a86a2a', shadowOffset: [-0.6, -0.6], gloss: [{ x: x + dx * s - 1, y: y + dy * s - 1, rx: 1.2 * s, ry: 0.6 * s, alpha: 0.5 }] });
  }
  for (let i = 0; i < 3; i++) line(ctx, [[x - 6 * s + i * 2.2 * s, y - 1 * s], [x - 9 * s + i * 2 * s, y - 13 * s]], 1.4, '#e8c27e');
}

// ---------------------------------------------------------------------------
// Round table with gingham cloth (front-bottom anchor; footprint circle r=TR)
// ---------------------------------------------------------------------------

const TR = 40; // footprint radius
const TOP_Y = -76; // table-top ellipse centre (relative to anchor)
const TOP_RX = 47;
const TOP_RY = 29;

function tableDraw(ctx: Ctx, variant: number) {
  // contact shadow + cast shadow
  ao(ctx, 4, -16, 56, 24, 0.55);
  // skirt (front half of the cloth hanging to the floor)
  const hemY = -6;
  const skirt = (p: Ctx) => {
    p.moveTo(-TOP_RX, TOP_Y);
    p.bezierCurveTo(-TOP_RX - 2, TOP_Y + 26, -TOP_RX + 2, hemY - 14, -TOP_RX + 6, hemY - 6);
    // scalloped hem with folds
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const xa = -TOP_RX + 6 + (TOP_RX * 2 - 12) * t0, xb = -TOP_RX + 6 + (TOP_RX * 2 - 12) * t1;
      const ya = hemY - 6 + Math.sin(t0 * Math.PI) * 8, yb = hemY - 6 + Math.sin(t1 * Math.PI) * 8;
      p.quadraticCurveTo((xa + xb) / 2, (ya + yb) / 2 + 3.2, xb, yb);
    }
    p.bezierCurveTo(TOP_RX - 2, hemY - 14, TOP_RX + 2, TOP_Y + 26, TOP_RX, TOP_Y);
    p.ellipse(0, TOP_Y, TOP_RX, TOP_RY, 0, 0, Math.PI, false);
    p.closePath();
  };
  shape(ctx, skirt, { fill: CLOTH, ink: 2.6, shadow: 'none' });
  clipped(ctx, skirt, () => {
    // vertical-ish gingham following the drape
    gingham(ctx, -TOP_RX - 4, TOP_Y - 4, TOP_RX * 2 + 8, 90, 7, 1.15);
    // fold shading (vertical bands)
    for (let i = -3; i <= 3; i++) {
      const fx = i * 13;
      ctx.fillStyle = lgrad(ctx, fx - 6, 0, fx + 6, 0, [[0, 'rgba(60,10,10,0)'], [0.55, 'rgba(60,10,10,0.22)'], [1, 'rgba(60,10,10,0)']]);
      ctx.fillRect(fx - 6, TOP_Y, 12, 90);
    }
    // cylinder shading: lit left, dark right & bottom
    wash(ctx, lgrad(ctx, -TOP_RX, 0, TOP_RX, 0, [[0, 'rgba(255,240,220,0.25)'], [0.35, 'rgba(0,0,0,0)'], [1, 'rgba(50,10,20,0.45)']]));
    wash(ctx, lgrad(ctx, 0, TOP_Y + 10, 0, hemY, [[0, 'rgba(40,10,10,0.25)'], [0.3, 'rgba(0,0,0,0)'], [1, 'rgba(40,10,10,0.2)']]));
  });
  // top surface
  const top = (p: Ctx) => ellipsePath(p, 0, TOP_Y, TOP_RX, TOP_RY);
  shape(ctx, top, { fill: CLOTH, ink: 2.2, shadow: 'none' });
  clipped(ctx, top, () => {
    gingham(ctx, -TOP_RX, TOP_Y - TOP_RY, TOP_RX * 2, TOP_RY * 2, 7, 0.62);
    ctx.fillStyle = ctx.createRadialGradient(-14, TOP_Y - 10, 4, 0, TOP_Y, TOP_RX * 1.1);
    (ctx.fillStyle as CanvasGradient).addColorStop(0, 'rgba(255,248,230,0.28)');
    (ctx.fillStyle as CanvasGradient).addColorStop(0.6, 'rgba(255,248,230,0)');
    (ctx.fillStyle as CanvasGradient).addColorStop(1, 'rgba(60,15,20,0.35)');
    ctx.fillRect(-TOP_RX, TOP_Y - TOP_RY, TOP_RX * 2, TOP_RY * 2);
    // edge roll where the cloth bends over
    ctx.beginPath();
    ellipsePath(ctx, 0, TOP_Y + 1.5, TOP_RX - 1, TOP_RY - 1);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(70,15,20,0.25)';
    ctx.stroke();
  });
  // ---- table dressing
  const R = rng(variant * 13 + 5);
  if (variant === 0) {
    plateSpaghetti(ctx, -20, TOP_Y + 8, 11, 3);
    plateSpaghetti(ctx, 21, TOP_Y + 9, 11, 7);
    wineGlass(ctx, -4, TOP_Y + 16);
    wineGlass(ctx, 34, TOP_Y - 2);
    napkin(ctx, -35, TOP_Y + 4, 0.3);
    breadBasketTop(ctx, 18, TOP_Y - 12, 1);
  } else if (variant === 1) {
    plateSpaghetti(ctx, 0, TOP_Y + 13, 12, 11);
    wineGlass(ctx, -24, TOP_Y + 8);
    wineGlass(ctx, 24, TOP_Y + 6);
    bottle(ctx, 28, TOP_Y - 6, 22, '#3a1a24', { label: '#efe6cc', cap: '#7a1f2b', w: 7, ink: 1 });
    napkin(ctx, -32, TOP_Y - 4, -0.2);
  } else {
    // pizza night: a margherita on a stand + two glasses
    shape(ctx, (p) => ellipsePath(p, 4, TOP_Y + 7, 20, 11), { fill: '#e2a85a', ink: 1.3, shadow: '#b8742d', shadowOffset: [-1.4, -1.4] });
    flat(ctx, (p) => ellipsePath(p, 4, TOP_Y + 6.5, 16, 8.4), '#cf3a24', 0);
    for (let i = 0; i < 6; i++) flat(ctx, (p) => ellipsePath(p, 4 + (R() - 0.5) * 22, TOP_Y + 6.5 + (R() - 0.5) * 10, 3, 1.8), '#fff3d6', 0);
    for (let i = 0; i < 3; i++) leaf(ctx, 4 + (R() - 0.5) * 18, TOP_Y + 5 + (R() - 0.5) * 6, 4.5, R() * 6, '#3d9a44', 0.5, false);
    for (let i = 0; i < 4; i++) line(ctx, [[4, TOP_Y + 6.5], [4 + Math.cos(i * 0.785) * 18, TOP_Y + 6.5 + Math.sin(i * 0.785) * 9.5]], 0.6, '#8a3a1a', false, 0.5);
    wineGlass(ctx, -30, TOP_Y + 6);
    wineGlass(ctx, 32, TOP_Y + 8);
  }
  // the fiasco candle at the back-centre
  const fx = variant === 1 ? -8 : -6, fyB = TOP_Y - 6;
  fiasco(ctx, fx, fyB, 1);
  // warm candle light on the cloth
  bloom(ctx, fx, TOP_Y - 2, 40, '#ffb04a', 0.16);
}

const TK = 1.16; // table drawing scale
const TRK = TR * TK; // effective footprint radius
for (let v = 0; v < 3; v++) {
  defineSprite({ id: `prop.trattoria.table_${'abc'[v]}`, w: 144, h: 176, ax: 72, ay: 150, draw: (ctx) => { ctx.scale(TK, TK); tableDraw(ctx, v); } });
}

// ---------------------------------------------------------------------------
// Straw-seat chairs ("sedie impagliate")
// ---------------------------------------------------------------------------

const CHAIR_WOOD = '#5e3a24';
const STRAW = '#d9b061';

function strawSeat(ctx: Ctx, build: (p: Ctx) => void, x0: number, y0: number, w: number, h: number) {
  shape(ctx, build, { fill: STRAW, ink: 1.4, shadow: 'none' });
  clipped(ctx, build, () => {
    // woven rush: diagonal bands meeting in the middle
    ctx.lineWidth = 1.1;
    for (let i = -10; i <= 10; i++) {
      line(ctx, [[x0 + w / 2 + i * 2.4, y0 - 2], [x0 + w / 2 + i * 2.4 + h * 0.9, y0 + h + 2]], 1, i % 2 ? '#b48a3a' : '#ecca7a', false, 0.7);
      line(ctx, [[x0 + w / 2 + i * 2.4, y0 - 2], [x0 + w / 2 + i * 2.4 - h * 0.9, y0 + h + 2]], 0.6, '#9a7028', false, 0.4);
    }
    wash(ctx, lgrad(ctx, x0, y0, x0 + w, y0 + h, [[0, 'rgba(255,240,200,0.2)'], [1, 'rgba(70,40,10,0.35)']]));
  });
}

function leg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, col = CHAIR_WOOD, w = 2.6) {
  line(ctx, [[x0, y0], [x1, y1]], w + 2.4, INK);
  line(ctx, [[x0, y0], [x1, y1]], w, col);
  line(ctx, [[x0 - 0.5, y0], [x1 - 0.5, y1]], 0.7, light(col, 0.35), false, 0.7);
}

/** Chair seen from the front (placed north of a table, facing south). */
function chairFront(ctx: Ctx) {
  ao(ctx, 1, -6, 20, 7, 0.5);
  // back legs + backrest posts
  leg(ctx, -11, -62, -11, -14);
  leg(ctx, 11, -62, 11, -14);
  for (const yy of [-58, -48, -38]) {
    shape(ctx, (p) => roundRectPath(p, -12, yy - 2.4, 24, 4.8, 2.2), { fill: CHAIR_WOOD, ink: 1.2, shadow: shade(CHAIR_WOOD, 0.3), shadowOffset: [0, -1.2], gloss: [{ x: -4, y: yy - 1.4, rx: 6, ry: 0.6, alpha: 0.35 }] });
  }
  for (const s of [-1, 1]) shape(ctx, (p) => circlePath(p, s * 11, -63, 2.4), { fill: light(CHAIR_WOOD, 0.1), ink: 1, shadow: 'none' });
  // seat
  const seat = (p: Ctx) => { p.moveTo(-12, -30); p.lineTo(12, -30); p.lineTo(15, -19); p.lineTo(-15, -19); p.closePath(); };
  strawSeat(ctx, seat, -15, -30, 30, 11);
  shape(ctx, (p) => roundRectPath(p, -15.5, -20, 31, 3.2, 1.4), { fill: CHAIR_WOOD, ink: 1.1, shadow: 'none' });
  // front legs + stretcher
  leg(ctx, -13.5, -18, -14, -1);
  leg(ctx, 13.5, -18, 14, -1);
  line(ctx, [[-13.5, -8], [13.5, -8]], 1.8, INK);
  line(ctx, [[-13.5, -8], [13.5, -8]], 0.9, light(CHAIR_WOOD, 0.1));
}

/** Chair seen from behind (south of a table, facing north). */
function chairBack(ctx: Ctx) {
  ao(ctx, 1, -6, 20, 7, 0.5);
  // seat behind the back
  const seat = (p: Ctx) => { p.moveTo(-12, -36); p.lineTo(12, -36); p.lineTo(13, -24); p.lineTo(-13, -24); p.closePath(); };
  strawSeat(ctx, seat, -13, -36, 26, 12);
  // far legs (front legs of the chair, now behind)
  leg(ctx, -11, -24, -10.5, -7, shade(CHAIR_WOOD, 0.2), 2.2);
  leg(ctx, 11, -24, 10.5, -7, shade(CHAIR_WOOD, 0.2), 2.2);
  // near legs rising into backrest posts
  leg(ctx, -13.5, -66, -14, -1);
  leg(ctx, 13.5, -66, 14, -1);
  for (const yy of [-61, -51, -41]) {
    shape(ctx, (p) => roundRectPath(p, -14, yy - 2.4, 28, 4.8, 2.2), { fill: shade(CHAIR_WOOD, 0.05), ink: 1.2, shadow: shade(CHAIR_WOOD, 0.3), shadowOffset: [0, -1.2], gloss: [{ x: -4, y: yy - 1.4, rx: 7, ry: 0.6, alpha: 0.3 }] });
  }
  for (const s of [-1, 1]) shape(ctx, (p) => circlePath(p, s * 13.5, -67, 2.5), { fill: light(CHAIR_WOOD, 0.1), ink: 1, shadow: 'none' });
  shape(ctx, (p) => roundRectPath(p, -14.5, -26, 29, 3, 1.4), { fill: CHAIR_WOOD, ink: 1.1, shadow: 'none' });
}

/** Chair in profile, facing left (west). Flip for east-facing. */
function chairSide(ctx: Ctx) {
  ao(ctx, 2, -6, 20, 7, 0.5);
  // back leg + post on the right
  leg(ctx, 9, -66, 10, -1);
  leg(ctx, 5, -26, 5, -4, shade(CHAIR_WOOD, 0.25), 2.2);
  for (const yy of [-60, -50, -40]) line(ctx, [[8.5, yy], [11, yy - 0.6]], 3.4, CHAIR_WOOD);
  // seat (seen from side + a bit of top)
  const seat = (p: Ctx) => { p.moveTo(-12, -30); p.lineTo(10, -30); p.lineTo(11, -24); p.lineTo(-13, -24); p.closePath(); };
  strawSeat(ctx, seat, -13, -30, 24, 6);
  shape(ctx, (p) => roundRectPath(p, -13.5, -25, 25, 3, 1.4), { fill: CHAIR_WOOD, ink: 1.1, shadow: 'none' });
  // front legs
  leg(ctx, -11, -24, -12, -1);
  leg(ctx, -7, -24, -7.5, -4, shade(CHAIR_WOOD, 0.25), 2.2);
  line(ctx, [[-11.5, -9], [9.5, -9]], 1.6, INK);
  line(ctx, [[-11.5, -9], [9.5, -9]], 0.8, light(CHAIR_WOOD, 0.1));
  shape(ctx, (p) => circlePath(p, 9.2, -67, 2.4), { fill: light(CHAIR_WOOD, 0.1), ink: 1, shadow: 'none' });
}

const CK: [number, number] = [1.22, 1.08];
defineSprite({ id: 'prop.trattoria.chair_n', w: 54, h: 86, ax: 27, ay: 78, draw: (ctx) => { ctx.scale(...CK); chairFront(ctx); } });
defineSprite({ id: 'prop.trattoria.chair_s', w: 54, h: 88, ax: 27, ay: 80, draw: (ctx) => { ctx.scale(...CK); chairBack(ctx); } });
defineSprite({ id: 'prop.trattoria.chair_w', w: 54, h: 88, ax: 27, ay: 80, draw: (ctx) => { ctx.scale(...CK); chairSide(ctx); } });

defineSprite({
  id: 'prop.trattoria.accordion_chair',
  w: 62, h: 92, ax: 30, ay: 82,
  draw: (ctx) => {
    ctx.scale(...CK);
    chairFront(ctx);
    // red mother-of-pearl accordion resting on the seat
    const x = 2, y = -28;
    shape(ctx, (p) => roundRectPath(p, x - 14, y - 22, 9, 24, 2), { fill: '#c8322b', ink: 1.4, shadowOffset: [-1.4, -1], gloss: [{ x: x - 11, y: y - 15, rx: 1.4, ry: 5, alpha: 0.6 }] });
    // bellows
    shape(ctx, (p) => p.rect(x - 5, y - 20, 13, 20), { fill: '#2a2224', ink: 1.2, shadow: 'none' });
    for (let i = 0; i < 6; i++) line(ctx, [[x - 4 + i * 2.2, y - 20], [x - 4 + i * 2.2, y]], 0.8, i % 2 ? '#d8c27a' : '#5a4a50');
    shape(ctx, (p) => roundRectPath(p, x + 8, y - 22, 12, 24, 2), { fill: '#d23a32', ink: 1.4, shadowOffset: [-1.4, -1] });
    // keyboard
    flat(ctx, (p) => p.rect(x + 15, y - 21, 4, 22), '#f6f0e2', 0.6);
    for (let i = 0; i < 6; i++) line(ctx, [[x + 15, y - 19 + i * 3.4], [x + 17.4, y - 19 + i * 3.4]], 1, '#2a2224');
    for (let i = 0; i < 3; i++) flat(ctx, (p) => circlePath(p, x - 9.5, y - 16 + i * 6, 1.1), '#f6f0e2', 0.4);
    glint(ctx, x + 11, y - 18, 1.4, 3, 0, 0.6);
  },
});

// ---------------------------------------------------------------------------
// Potted lemon tree
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.trattoria.lemon_tree',
  w: 120, h: 176, ax: 60, ay: 166,
  draw: (ctx) => {
    ao(ctx, 4, -8, 34, 11, 0.55);
    const terra = '#c56a43';
    // pot with garland relief
    const pot = (p: Ctx) => { p.moveTo(-24, -44); p.lineTo(24, -44); p.lineTo(18, -2); p.quadraticCurveTo(0, 2, -18, -2); p.closePath(); };
    shape(ctx, pot, { fill: terra, ink: 2.2, shadow: shade(terra, 0.3), shadowOffset: [-5, -1] });
    clipped(ctx, pot, () => {
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(i * 7, -30, 3.6, 0, Math.PI);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = light(terra, 0.3);
        ctx.stroke();
      }
      line(ctx, [[-24, -12], [24, -12]], 1, shade(terra, 0.3), false, 0.8);
    });
    shape(ctx, (p) => roundRectPath(p, -27, -50, 54, 8, 3), { fill: light(terra, 0.08), ink: 2, shadowOffset: [-2, -2] });
    flat(ctx, (p) => ellipsePath(p, 0, -49, 22, 3), '#4a2e1c', 0);
    // trunk
    line(ctx, [[0, -49], [-2, -78], [2, -96]], 7, INK, true);
    line(ctx, [[0, -49], [-2, -78], [2, -96]], 4.4, '#7a5234', true);
    line(ctx, [[-2, -78], [-14, -94]], 4, INK, true);
    line(ctx, [[-2, -78], [-14, -94]], 2.2, '#7a5234', true);
    // canopy: clustered leaf blobs
    const R = rng(21);
    const blobs: [number, number, number][] = [[-26, -112, 24], [22, -114, 25], [0, -134, 28], [-14, -150, 20], [16, -148, 20], [0, -104, 22]];
    for (const [bx, by, br] of blobs) {
      shape(ctx, (p) => blobPath(p, bx, by, br, br * 0.85, 0.18, 11, Math.floor(bx * 7 + by)), { fill: '#3f8c45', ink: 2, shadow: '#2a6a35', shadowOffset: [-br * 0.25, -br * 0.3], gloss: [{ x: bx - br * 0.35, y: by - br * 0.4, rx: br * 0.35, ry: br * 0.2, rot: -0.5, alpha: 0.2 }] });
    }
    // leaf texture
    for (let i = 0; i < 46; i++) {
      const [bx, by, br] = blobs[Math.floor(R() * blobs.length)];
      const a = R() * 6.28, d = Math.sqrt(R()) * br * 0.8;
      leaf(ctx, bx + Math.cos(a) * d, by + Math.sin(a) * d * 0.85, 6 + R() * 3, R() * 6.28, R() < 0.5 ? '#4f9f4f' : '#2f7a3a', 0.6, false);
    }
    // lemons
    for (let i = 0; i < 9; i++) {
      const [bx, by, br] = blobs[i % blobs.length];
      const a = R() * 6.28, d = br * (0.4 + R() * 0.45);
      lemon(ctx, bx + Math.cos(a) * d, by + Math.sin(a) * d * 0.8, 4.6, (R() - 0.5) * 1.2, 1.1);
    }
    // a fallen lemon on the floor
    lemon(ctx, 26, -6, 4.4, 0.5, 1.1);
  },
});

// ---------------------------------------------------------------------------
// Wine rack, piano, column, coat stand, sideboard, dessert cart
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.trattoria.wine_rack',
  w: 150, h: 186, ax: 74, ay: 172,
  draw: (ctx) => {
    const W = 134, RD = 34, RH = 148;
    const x0 = -W / 2;
    const wood = '#7a4a2c';
    aoRect(ctx, x0 - 4, -RD - 2, W + 14, RD + 8, 8, 0.6, 6);
    shape(ctx, (p) => roundRectPath(p, x0, -RH - 8, W, RH + 8, 3), { fill: shade(wood, 0.5), ink: 2.8, shadow: 'none' });
    // diamond lattice with bottles poking out
    clipped(ctx, (p) => p.rect(x0 + 5, -RH, W - 10, RH - 8), () => {
      ctx.fillStyle = '#1e120c';
      ctx.fillRect(x0, -RH - 8, W, RH);
      const cell = 22;
      const R = rng(7);
      for (let j = -1; j < 8; j++) for (let i = -1; i < 7; i++) {
        const cx = x0 + 10 + i * cell + (j % 2 ? cell / 2 : 0), cy = -RH + 4 + j * (cell * 0.62);
        // bottle bottom (round base facing us)
        const col = R() < 0.4 ? '#2c4a26' : R() < 0.6 ? '#3a1a24' : '#4a5a22';
        if (R() < 0.85) {
          shape(ctx, (p) => circlePath(p, cx, cy + 6, 6.2), { fill: col, ink: 1, shadow: shade(col, 0.4), shadowOffset: [-1.6, -1.6], gloss: [{ x: cx - 2, y: cy + 4, rx: 1.8, ry: 1, alpha: 0.55 }] });
          flat(ctx, (p) => circlePath(p, cx, cy + 6, 2.4), shade(col, 0.45), 0);
        }
      }
      ctx.strokeStyle = wood;
      ctx.lineWidth = 3;
      for (let i = -8; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + i * 22, -RH - 8);
        ctx.lineTo(x0 + i * 22 + RH * 0.8, 0);
        ctx.moveTo(x0 + i * 22, -RH - 8);
        ctx.lineTo(x0 + i * 22 - RH * 0.8, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = light(wood, 0.25);
      ctx.lineWidth = 0.8;
      for (let i = -8; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + i * 22 - 1, -RH - 8);
        ctx.lineTo(x0 + i * 22 + RH * 0.8 - 1, 0);
        ctx.stroke();
      }
    });
    // frame
    for (const fx of [x0, x0 + W - 7]) shape(ctx, (p) => roundRectPath(p, fx, -RH - 10, 7, RH + 10, 2), { fill: wood, ink: 1.8, shadow: shade(wood, 0.3), shadowOffset: [-2, 0], gloss: [{ x: fx + 2, y: -RH / 2, rx: 0.8, ry: RH * 0.4, alpha: 0.25 }] });
    shape(ctx, (p) => roundRectPath(p, x0 - 3, -RH - 14, W + 6, 9, 2), { fill: light(wood, 0.1), ink: 2, shadowOffset: [-1.5, -1.5] });
    shape(ctx, (p) => roundRectPath(p, x0, -10, W, 10, 2), { fill: wood, ink: 1.8, shadowOffset: [-1.5, -1.5] });
    // bottles + a candle on top
    bottle(ctx, x0 + 22, -RH - 12, 26, '#2c4a26', { label: '#efe6cc', cap: '#7a1f2b', w: 8 });
    bottle(ctx, x0 + 34, -RH - 12, 24, '#3a1a24', { label: '#e9dcc0', cap: '#d8b25a', w: 8 });
    fiasco(ctx, x0 + W - 30, -RH - 12, 1);
  },
});

defineSprite({
  id: 'prop.trattoria.piano',
  w: 176, h: 176, ax: 86, ay: 162,
  draw: (ctx) => {
    const W = 150, PD = 46, PH = 104;
    const x0 = -W / 2;
    const wood = '#3a2018';
    aoRect(ctx, x0 - 6, -PD - 4, W + 18, PD + 12, 9, 0.6, 8);
    // body
    shape(ctx, (p) => roundRectPath(p, x0, -PH - PD * 0.6, W, PH + PD * 0.6, [5, 5, 2, 2]), { fill: wood, ink: 3, shadow: 'none' });
    clipped(ctx, (p) => roundRectPath(p, x0, -PH - PD * 0.6, W, PH + PD * 0.6, [5, 5, 2, 2]), () => {
      wash(ctx, lgrad(ctx, x0, 0, x0 + W, 0, [[0, '#5a3426'], [0.4, wood], [1, '#24130e']]));
      grain(ctx, x0, -PH - PD, W, PH + PD, '#1a0c08', 4, 1, 0.5, 0.35);
      // lacquer reflections
      wash(ctx, lgrad(ctx, x0, -PH, x0 + W, 0, [[0, 'rgba(255,220,180,0)'], [0.3, 'rgba(255,220,180,0)'], [0.34, 'rgba(255,220,180,0.18)'], [0.4, 'rgba(255,220,180,0)'], [1, 'rgba(0,0,0,0)']]));
    });
    // top lid
    shape(ctx, (p) => roundRectPath(p, x0 - 3, -PH - PD * 0.6 - 4, W + 6, 10, 3), { fill: '#4a281e', ink: 2, shadowOffset: [-1.5, -1.5], gloss: [{ x: -30, y: -PH - PD * 0.6 - 1, rx: 30, ry: 1.2, alpha: 0.3 }] });
    // front panel with carved inlay
    shape(ctx, (p) => roundRectPath(p, x0 + 12, -PH + 6, W - 24, 40, 3), { fill: '#43251b', ink: 1.2, shadow: '#2a150f', shadowOffset: [-1.5, -1.5] });
    line(ctx, [[-30, -PH + 26], [-10, -PH + 18], [10, -PH + 26], [30, -PH + 18]], 1, '#b88a4a', true, 0.6);
    // music sheet on the stand
    shape(ctx, (p) => { p.moveTo(-26, -PH + 8); p.lineTo(26, -PH + 8); p.lineTo(24, -PH + 34); p.lineTo(-24, -PH + 34); p.closePath(); }, { fill: '#f3ead6', ink: 1.2, shadow: '#d6c9ae', shadowOffset: [-1.2, -1.2] });
    for (let i = 0; i < 4; i++) {
      line(ctx, [[-20, -PH + 13 + i * 5.5], [20, -PH + 13 + i * 5.5]], 0.5, '#6a5a50', false, 0.8);
      for (let k = 0; k < 6; k++) flat(ctx, (p) => ellipsePath(p, -16 + k * 6.6, -PH + 12.5 + i * 5.5 + ((k * 3 + i) % 4) * 0.9, 1, 0.8), '#2b1712', 0);
    }
    // keybed
    const ky = -PH + 52;
    shape(ctx, (p) => roundRectPath(p, x0 + 6, ky, W - 12, 12, 2), { fill: '#f5efe2', ink: 1.6, shadow: 'none' });
    for (let i = 1; i < 26; i++) line(ctx, [[x0 + 6 + i * ((W - 12) / 26), ky + 1], [x0 + 6 + i * ((W - 12) / 26), ky + 11]], 0.5, '#9a9080');
    for (let i = 0; i < 26; i++) {
      if ([2, 6, 9, 13, 16, 20, 23].includes(i % 26)) continue;
      flat(ctx, (p) => p.rect(x0 + 6 + i * ((W - 12) / 26) + 3, ky + 0.5, 2.6, 6.5), '#1d1412', 0);
    }
    shape(ctx, (p) => roundRectPath(p, x0 + 4, ky + 11, W - 8, 4, 1.5), { fill: '#4a281e', ink: 1.4, shadow: 'none' });
    // legs + pedals
    for (const lx of [x0 + 8, x0 + W - 16]) shape(ctx, (p) => roundRectPath(p, lx, ky + 14, 8, -ky - 14, 2), { fill: '#43251b', ink: 1.6, shadowOffset: [-1.5, 0] });
    for (const px of [-6, 6]) shape(ctx, (p) => roundRectPath(p, px - 2.5, -9, 5, 6, 1.5), { fill: '#d8b25a', ink: 1, shadow: 'none' });
    // candelabra + framed photo on top
    const cy = -PH - PD * 0.6 - 2;
    line(ctx, [[44, cy], [44, cy - 16]], 3.6, INK);
    line(ctx, [[44, cy], [44, cy - 16]], 1.8, '#d8b25a');
    line(ctx, [[34, cy - 18], [44, cy - 14], [54, cy - 18]], 3.6, INK, true);
    line(ctx, [[34, cy - 18], [44, cy - 14], [54, cy - 18]], 1.8, '#d8b25a', true);
    for (const cx of [34, 44, 54]) {
      const top = cx === 44 ? cy - 30 : cy - 26;
      shape(ctx, (p) => roundRectPath(p, cx - 1.8, top, 3.6, (cx === 44 ? cy - 16 : cy - 18) - top, 1), { fill: '#f3e9d2', ink: 0.9, shadow: 'none' });
      bloom(ctx, cx, top - 3, 12, '#ffb04a', 0.5);
      shape(ctx, (p) => { p.moveTo(cx, top - 7); p.quadraticCurveTo(cx + 2.4, top - 2, cx, top); p.quadraticCurveTo(cx - 2.4, top - 2, cx, top - 7); p.closePath(); }, { fill: '#ffd25a', ink: 0, shadow: 'none' });
    }
    shape(ctx, (p) => roundRectPath(p, -46, cy - 22, 20, 22, 2), { fill: '#c9a24a', ink: 1.4, shadowOffset: [-1, -1] });
    flat(ctx, (p) => p.rect(-43, cy - 19, 14, 16), '#cbb79a', 0.6);
    flat(ctx, (p) => circlePath(p, -36, cy - 13, 3.4), '#7a5a4a', 0);
    flat(ctx, (p) => ellipsePath(p, -36, cy - 6, 5, 3), '#2a2224', 0);
    // piano stool
    shape(ctx, (p) => roundRectPath(p, -22, -24, 44, 9, 3), { fill: '#7a2a2a', ink: 1.8, shadowOffset: [-1.5, -1.5], gloss: [{ x: -10, y: -22, rx: 10, ry: 1.2, alpha: 0.3 }] });
    for (const lx of [-18, 18]) line(ctx, [[lx, -15], [lx, -1]], 3.6, INK);
    for (const lx of [-18, 18]) line(ctx, [[lx, -15], [lx, -1]], 1.8, '#43251b');
  },
});

defineSprite({
  id: 'prop.trattoria.column',
  w: 84, h: 300, ax: 42, ay: 290,
  draw: (ctx) => {
    ao(ctx, 4, -10, 40, 14, 0.6);
    const stone = '#e6dccb';
    // plinth
    shape(ctx, (p) => roundRectPath(p, -34, -22, 68, 22, 2), { fill: '#d6cab6', ink: 2.6, shadow: '#b3a690', shadowOffset: [-4, -2] });
    shape(ctx, (p) => roundRectPath(p, -30, -32, 60, 11, 4), { fill: '#e0d5c2', ink: 2.2, shadow: '#bdb09a', shadowOffset: [-3, -1.5] });
    // shaft with flutes
    const shaft = (p: Ctx) => p.rect(-24, -284, 48, 253);
    shape(ctx, shaft, { fill: stone, ink: 2.6, shadow: 'none' });
    clipped(ctx, shaft, () => {
      wash(ctx, lgrad(ctx, -24, 0, 24, 0, [[0, '#cfc2ac'], [0.2, '#f6efe2'], [0.5, stone], [1, '#a99a82']]));
      for (let i = -3; i <= 3; i++) {
        const fx = i * 6.4;
        line(ctx, [[fx, -284], [fx, -31]], 2.2, '#b9ab94', false, 0.55);
        line(ctx, [[fx - 1.6, -284], [fx - 1.6, -31]], 0.8, '#ffffff', false, 0.35);
      }
      // marble veining
      line(ctx, [[-20, -70], [-8, -96], [-12, -130], [4, -160]], 0.6, '#b0a28a', true, 0.6);
      wash(ctx, lgrad(ctx, 0, -284, 0, -200, [[0, 'rgba(30,18,24,0.55)'], [1, 'rgba(30,18,24,0)']]));
    });
    shape(ctx, (p) => roundRectPath(p, -28, -42, 56, 10, 4), { fill: '#e8dfcf', ink: 2.2, shadow: '#c4b8a2', shadowOffset: [-3, -1.5] });
    // fade into the dark ceiling
    fadeUp(ctx, -200, -290);
    // a potted ivy draping on the plinth
    for (let i = 0; i < 7; i++) leaf(ctx, 18 + i * 1.6, -24 + i * 3, 6, 1.4 + i * 0.2, i % 2 ? '#3f8c45' : '#2f7a3a', 0.6);
  },
});

defineSprite({
  id: 'prop.trattoria.coat_stand',
  w: 66, h: 168, ax: 32, ay: 158,
  draw: (ctx) => {
    ao(ctx, 3, -4, 22, 7, 0.55);
    const wood = '#5a3422';
    // tripod feet
    for (const [x1, y1] of [[-18, -2], [18, -2], [0, 2]] as const) line(ctx, [[0, -14], [x1, y1]], 4.4, INK, true), line(ctx, [[0, -14], [x1, y1]], 2.4, wood, true);
    // pole
    line(ctx, [[0, -150], [0, -10]], 6.4, INK);
    line(ctx, [[0, -150], [0, -10]], 3.8, wood);
    line(ctx, [[-1, -148], [-1, -12]], 0.9, light(wood, 0.35), false, 0.7);
    // hooks
    for (const s of [-1, 1]) line(ctx, [[0, -140], [s * 12, -146], [s * 14, -138]], 2.6, INK, true), line(ctx, [[0, -140], [s * 12, -146], [s * 14, -138]], 1.2, wood, true);
    // long coat on the left hook
    shape(ctx, (p) => {
      p.moveTo(-13, -140);
      p.quadraticCurveTo(-26, -120, -24, -70);
      p.quadraticCurveTo(-14, -64, -4, -70);
      p.quadraticCurveTo(-4, -110, -10, -140);
      p.closePath();
    }, { fill: '#4a4a5e', ink: 2, shadow: '#33334a', shadowOffset: [-3, -1], gloss: [{ x: -18, y: -110, rx: 2, ry: 14, alpha: 0.2 }] });
    for (const by of [-120, -106, -92]) flat(ctx, (p) => circlePath(p, -8, by, 1.4), '#c9a24a', 0.5);
    // striped scarf on the right
    shape(ctx, (p) => { p.moveTo(12, -140); p.lineTo(18, -140); p.lineTo(20, -96); p.lineTo(13, -96); p.closePath(); }, { fill: '#2f7a3a', ink: 1.4, shadowOffset: [-1, 0] });
    for (const yy of [-130, -118, -106]) line(ctx, [[12.5, yy], [19, yy]], 2, '#f3ebdd');
    // hat on top
    shape(ctx, (p) => ellipsePath(p, 0, -152, 17, 5), { fill: '#3a2a22', ink: 1.8, shadowOffset: [-2, -1] });
    shape(ctx, (p) => { p.moveTo(-10, -152); p.lineTo(-9, -166); p.quadraticCurveTo(0, -170, 9, -166); p.lineTo(10, -152); p.closePath(); }, { fill: '#4a382e', ink: 1.8, shadowOffset: [-2.4, -1], gloss: [{ x: -5, y: -162, rx: 2, ry: 3, alpha: 0.25 }] });
    line(ctx, [[-10, -156], [10, -156]], 2.6, '#8a2a2a');
  },
});

defineSprite({
  id: 'prop.trattoria.sideboard',
  w: 176, h: 140, ax: 86, ay: 128,
  draw: (ctx) => {
    const W = 156, SD = 40, SH = 56;
    const x0 = -W / 2;
    const wood = '#6a3e26';
    aoRect(ctx, x0 - 6, -SD - 4, W + 18, SD + 12, 8, 0.6, 6);
    shape(ctx, (p) => roundRectPath(p, x0, -SH - SD, W, SH + SD, [4, 4, 2, 2]), { fill: wood, ink: 2.8, shadow: 'none' });
    // front doors with carved panels
    clipped(ctx, (p) => p.rect(x0, -SH, W, SH), () => {
      wash(ctx, lgrad(ctx, x0, 0, x0 + W, 0, [[0, light(wood, 0.12)], [1, shade(wood, 0.25)]]));
      grain(ctx, x0, -SH, W, SH, shade(wood, 0.5), 9, 0, 0.8, 0.35);
    });
    for (let i = 0; i < 3; i++) {
      const dx = x0 + 6 + i * ((W - 12) / 3);
      const dw = (W - 12) / 3 - 4;
      shape(ctx, (p) => roundRectPath(p, dx, -SH + 6, dw, SH - 14, 3), { fill: shade(wood, 0.08), ink: 1, inkColor: '#2a1610', shadow: shade(wood, 0.3), shadowOffset: [-1.6, -1.6] });
      shape(ctx, (p) => roundRectPath(p, dx + 6, -SH + 12, dw - 12, SH - 26, 2), { fill: light(wood, 0.06), ink: 0.8, inkColor: '#2a1610', shadow: 'none' });
      shape(ctx, (p) => circlePath(p, dx + dw / 2, -SH + 6 + (SH - 14) / 2, 2), { fill: '#d8b25a', ink: 0.8, shadow: 'none', gloss: [{ x: dx + dw / 2 - 0.6, y: -SH + 5 + (SH - 14) / 2, rx: 0.6, ry: 0.4, alpha: 0.8 }] });
    }
    // marble top
    shape(ctx, (p) => roundRectPath(p, x0 - 3, -SH - SD - 2, W + 6, SD + 4, 3), { fill: '#e9e2d6', ink: 2, shadow: '#c9bfae', shadowOffset: [-2, -2] });
    line(ctx, [[x0, -SH - 20], [x0 + 40, -SH - 28], [x0 + 80, -SH - 16], [x0 + 140, -SH - 26]], 0.6, '#b0a596', true, 0.6);
    // stacked plates, glasses, a lamp, bottles
    for (let k = 0; k < 6; k++) shape(ctx, (p) => ellipsePath(p, x0 + 30, -SH - 14 - k * 2.6, 15, 6), { fill: '#f6f2ea', ink: 0.9, shadow: '#d2c9b9', shadowOffset: [-1, -0.6] });
    for (let k = 0; k < 3; k++) wineGlass(ctx, x0 + 58 + k * 9, -SH - 12 - (k % 2) * 4, 1);
    bottle(ctx, x0 + 92, -SH - 10, 28, '#2c4a26', { label: '#efe6cc', cap: '#7a1f2b', w: 8 });
    bottle(ctx, x0 + 103, -SH - 14, 24, '#6a8a2a', { label: '#f0e3bc', cap: '#2f2f2f', w: 7 });
    // table lamp with fringed shade
    const lx = x0 + 132, ly = -SH - 18;
    line(ctx, [[lx, ly], [lx, ly - 22]], 3.6, INK);
    line(ctx, [[lx, ly], [lx, ly - 22]], 1.8, '#c9a24a');
    shape(ctx, (p) => ellipsePath(p, lx, ly, 8, 3), { fill: '#c9a24a', ink: 1.2, shadow: 'none' });
    bloom(ctx, lx, ly - 30, 34, '#ffc070', 0.5);
    shape(ctx, (p) => { p.moveTo(lx - 7, ly - 40); p.lineTo(lx + 7, ly - 40); p.lineTo(lx + 14, ly - 24); p.lineTo(lx - 14, ly - 24); p.closePath(); }, { fill: '#f2c27a', ink: 1.4, shadow: '#d89a4a', shadowOffset: [-2, 0] });
    for (let i = 0; i < 9; i++) line(ctx, [[lx - 13 + i * 3.25, ly - 24], [lx - 13 + i * 3.25, ly - 20]], 0.8, '#b8322a');
  },
});

defineSprite({
  id: 'prop.trattoria.dessert_cart',
  w: 100, h: 104, ax: 48, ay: 94,
  draw: (ctx) => {
    ao(ctx, 3, -10, 44, 13, 0.5);
    const W = 80, x0 = -W / 2;
    const brass = '#c9a24a';
    for (const wx of [x0 + 7, x0 + W - 7]) shape(ctx, (p) => circlePath(p, wx, -5, 5), { fill: '#3a2a22', ink: 1.4, shadow: 'none', gloss: [{ x: wx - 1.5, y: -6.5, rx: 1.4, ry: 0.8, alpha: 0.4 }] });
    for (const lx of [x0 + 3, x0 + W - 3]) { line(ctx, [[lx, -8], [lx, -70]], 4, INK); line(ctx, [[lx, -8], [lx, -70]], 2, brass); }
    line(ctx, [[x0 + W - 3, -70], [x0 + W + 6, -78]], 4, INK);
    line(ctx, [[x0 + W - 3, -70], [x0 + W + 6, -78]], 2, brass);
    // lower shelf: cake
    shape(ctx, (p) => roundRectPath(p, x0, -32, W, 26, 3), { fill: '#6a3e26', ink: 1.8, shadowOffset: [-1.5, -1.5] });
    shape(ctx, (p) => { p.moveTo(x0 + 18, -28); p.lineTo(x0 + 52, -28); p.lineTo(x0 + 52, -14); p.quadraticCurveTo(x0 + 35, -11, x0 + 18, -14); p.closePath(); }, { fill: '#f3e3c2', ink: 1.2, shadowOffset: [-2, -1] });
    line(ctx, [[x0 + 18, -22], [x0 + 52, -22]], 2, '#8a4a2a');
    flat(ctx, (p) => ellipsePath(p, x0 + 35, -28, 17, 4), '#fff6e6', 0.8);
    for (let i = 0; i < 5; i++) flat(ctx, (p) => circlePath(p, x0 + 23 + i * 6, -28.5, 1.6), '#c8232a', 0.4);
    // top shelf: tiramisù tray + cannoli
    shape(ctx, (p) => roundRectPath(p, x0, -70, W, 30, 3), { fill: '#6a3e26', ink: 1.8, shadowOffset: [-1.5, -1.5] });
    shape(ctx, (p) => roundRectPath(p, x0 + 6, -68, 36, 18, 2), { fill: '#dfe4e8', ink: 1.2, shadowOffset: [-1, -1] });
    flat(ctx, (p) => p.rect(x0 + 8, -66, 32, 14), '#7a4a2a', 0);
    speckle(ctx, x0 + 24, -59, 14, 6, 40, '#4a2a1a', 0.7, 3, 0.9);
    line(ctx, [[x0 + 16, -66], [x0 + 16, -52]], 0.6, '#f3e3c2', false, 0.8);
    line(ctx, [[x0 + 28, -66], [x0 + 28, -52]], 0.6, '#f3e3c2', false, 0.8);
    for (let i = 0; i < 3; i++) {
      const cx = x0 + 52 + i * 8, cy = -60 + (i % 2) * 3;
      shape(ctx, (p) => roundRectPath(p, cx - 3.4, cy - 7, 6.8, 14, 3.4), { fill: '#d9a35a', ink: 1, shadow: '#a8702a', shadowOffset: [-1, 0] });
      flat(ctx, (p) => ellipsePath(p, cx, cy - 7, 3.6, 2), '#fbf3e0', 0.6);
      flat(ctx, (p) => ellipsePath(p, cx, cy + 7, 3.6, 2), '#fbf3e0', 0.6);
      flat(ctx, (p) => circlePath(p, cx, cy - 7.6, 1), '#2f9a52', 0);
    }
  },
});

// ---------------------------------------------------------------------------
// Breakables: bread basket (straw), wine crate (glass), flower vase (glass)
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.trattoria.bread_basket',
  w: 70, h: 92, ax: 34, ay: 84,
  draw: (ctx) => {
    ao(ctx, 3, -5, 24, 8, 0.55);
    // little wooden stand (sgabello)
    const st = '#6a3e26';
    for (const [x0, x1] of [[-14, -17], [14, 17]] as const) { line(ctx, [[x0, -26], [x1, -1]], 5, INK); line(ctx, [[x0, -26], [x1, -1]], 2.8, st); }
    line(ctx, [[-15, -11], [15, -11]], 3.6, INK);
    line(ctx, [[-15, -11], [15, -11]], 1.8, light(st, 0.1));
    shape(ctx, (p) => roundRectPath(p, -20, -30, 40, 6, 2), { fill: light(st, 0.12), ink: 1.6, shadowOffset: [-1.5, -1.5] });
    ctx.translate(0, -28);
    const body = (p: Ctx) => { p.moveTo(-26, -24); p.quadraticCurveTo(-24, 0, 0, 0); p.quadraticCurveTo(24, 0, 26, -24); p.closePath(); };
    shape(ctx, body, { fill: '#c99a55', ink: 2, shadow: 'none' });
    clipped(ctx, body, () => {
      weave(ctx, -28, -26, 56, 28, '#c99a55', 4.2);
      wash(ctx, lgrad(ctx, -26, 0, 26, 0, [[0, 'rgba(255,240,200,0.12)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(60,30,10,0.4)']]));
    });
    // gingham napkin lining
    clipped(ctx, (p) => { p.moveTo(-24, -24); p.lineTo(24, -24); p.lineTo(18, -16); p.lineTo(4, -21); p.lineTo(-10, -15); p.closePath(); }, () => gingham(ctx, -26, -26, 52, 12, 3.5, 0.8));
    // loaves, rolls and grissini
    for (let i = 0; i < 4; i++) line(ctx, [[-14 + i * 4, -22], [-22 + i * 3, -50 + i * 2]], 3.4, INK), line(ctx, [[-14 + i * 4, -22], [-22 + i * 3, -50 + i * 2]], 1.8, '#ecc27e');
    shape(ctx, (p) => ellipsePath(p, 6, -28, 14, 7, -0.2), { fill: '#d6913f', ink: 1.6, shadow: '#a8662a', shadowOffset: [-2, -2], gloss: [{ x: 2, y: -31, rx: 5, ry: 1.6, rot: -0.2, alpha: 0.4 }] });
    for (let i = 0; i < 4; i++) line(ctx, [[-2 + i * 5, -33], [1 + i * 5, -25]], 1, '#8a4a1a', false, 0.8);
    shape(ctx, (p) => circlePath(p, -8, -26, 6.5), { fill: '#e2a654', ink: 1.4, shadow: '#b8742d', shadowOffset: [-1.5, -1.5] });
    line(ctx, [[-11, -27], [-5, -25]], 0.9, '#8a4a1a');
    shape(ctx, (p) => circlePath(p, 18, -22, 5.5), { fill: '#e8b264', ink: 1.4, shadow: '#b8742d', shadowOffset: [-1.5, -1.5] });
    speckle(ctx, 18, -24, 4, 3, 6, '#fff6e0', 0.5, 3, 0.9);
  },
});

defineSprite({
  id: 'prop.trattoria.wine_crate',
  w: 72, h: 76, ax: 35, ay: 66,
  draw: (ctx) => {
    ao(ctx, 3, -9, 32, 11, 0.55);
    const wood = '#b9824d';
    const x0 = -27, w = 54, d = 28, h = 26;
    shape(ctx, (p) => roundRectPath(p, x0, -h - d, w, h + d, 2.5), { fill: shade(wood, 0.4), ink: 2, shadow: 'none' });
    flat(ctx, (p) => p.rect(x0 + 3, -h - d + 3, w - 6, d - 2), '#2a1810', 0);
    // bottles (corks/foil tops visible)
    const R = rng(3);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
      const bx = x0 + 9 + i * 12, by = -h - d + 9 + j * 11;
      const col = R() < 0.5 ? '#2c4a26' : '#3a1a24';
      shape(ctx, (p) => circlePath(p, bx, by, 5), { fill: col, ink: 1, shadow: shade(col, 0.4), shadowOffset: [-1.4, -1.4] });
      flat(ctx, (p) => circlePath(p, bx, by, 2.2), R() < 0.5 ? '#c9a24a' : '#8a1a2a', 0.6);
    }
    shape(ctx, (p) => roundRectPath(p, x0 + 1, -h, w - 2, h - 1, 2), { fill: wood, ink: 1.2, shadow: shade(wood, 0.25), shadowOffset: [-2, -2] });
    clipped(ctx, (p) => p.rect(x0 + 1, -h, w - 2, h - 1), () => grain(ctx, x0, -h, w, h, shade(wood, 0.45), 5, 0, 1, 0.4));
    // branded stamp (generic)
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ellipsePath(ctx, 0, -h / 2, 13, 7);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#5a2a14';
    ctx.stroke();
    ctx.restore();
    flat(ctx, (p) => { p.moveTo(-6, -h / 2 + 3); p.lineTo(0, -h / 2 - 4); p.lineTo(6, -h / 2 + 3); p.closePath(); }, 'rgba(90,42,20,0.7)', 0);
    line(ctx, [[x0 + 1, -h], [x0 + w - 1, -h]], 1.2, light(wood, 0.3), false, 0.8);
  },
});

defineSprite({
  id: 'prop.trattoria.flower_vase',
  w: 52, h: 84, ax: 26, ay: 76,
  draw: (ctx) => {
    ao(ctx, 2, -4, 18, 6, 0.5);
    // tall ceramic amphora vase with sunflowers & lavender
    const vase = (p: Ctx) => { p.moveTo(-6, -40); p.quadraticCurveTo(-18, -26, -12, -6); p.quadraticCurveTo(-10, 0, 0, 0); p.quadraticCurveTo(10, 0, 12, -6); p.quadraticCurveTo(18, -26, 6, -40); p.closePath(); };
    for (let i = 0; i < 5; i++) line(ctx, [[0, -40], [-12 + i * 6, -62 - (i % 2) * 6]], 1.2, '#3f7d32', true);
    for (let i = 0; i < 5; i++) {
      const fx = -12 + i * 6, fy = -62 - (i % 2) * 6;
      if (i % 2) {
        for (let k = 0; k < 6; k++) flat(ctx, (p) => ellipsePath(p, fx, fy - k * 2, 1.4, 1.1), '#8a6ad0', 0.4);
      } else {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * 6.28;
          flat(ctx, (p) => ellipsePath(p, fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 2.4, 1.2, a), '#f5c83a', 0.5);
        }
        flat(ctx, (p) => circlePath(p, fx, fy, 2.4), '#6a3a1a', 0.5);
      }
    }
    shape(ctx, vase, { fill: '#2f6fb8', ink: 1.8, shadow: '#1f4a88', shadowOffset: [-4, -1], gloss: [{ x: -6, y: -22, rx: 1.6, ry: 7, alpha: 0.5 }] });
    clipped(ctx, vase, () => {
      line(ctx, [[-16, -22], [16, -22]], 2.2, '#f2d36a');
      for (let i = -3; i <= 3; i++) flat(ctx, (p) => circlePath(p, i * 4, -16, 1.2), '#f6efe2', 0);
      line(ctx, [[-16, -10], [16, -10]], 1.2, '#f6efe2', false, 0.9);
    });
  },
});

defineSprite({
  id: 'prop.trattoria.candelabra',
  w: 56, h: 136, ax: 28, ay: 128,
  draw: (ctx) => {
    ao(ctx, 2, -3, 18, 6, 0.55);
    const brass = '#c9973a';
    // tripod base
    for (const [x1, y1] of [[-14, -1], [14, -1], [0, 2]] as const) { line(ctx, [[0, -12], [x1, y1]], 4.6, INK, true); line(ctx, [[0, -12], [x1, y1]], 2.4, brass, true); }
    // stem with knobs
    line(ctx, [[0, -96], [0, -10]], 5.6, INK);
    line(ctx, [[0, -96], [0, -10]], 3, brass);
    line(ctx, [[-0.8, -94], [-0.8, -12]], 0.8, light(brass, 0.5), false, 0.8);
    for (const ky of [-30, -62]) shape(ctx, (p) => ellipsePath(p, 0, ky, 4.6, 3), { fill: brass, ink: 1.2, shadow: shade(brass, 0.3), shadowOffset: [-1, -1], gloss: [{ x: -1.4, y: ky - 1, rx: 1.2, ry: 0.7, alpha: 0.7 }] });
    // arms
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-18, -104);
    ctx.quadraticCurveTo(-18, -92, 0, -92);
    ctx.quadraticCurveTo(18, -92, 18, -104);
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = brass;
    ctx.stroke();
    ctx.restore();
    for (const cx of [-18, 0, 18]) {
      const top = cx === 0 ? -122 : -114;
      const base = cx === 0 ? -100 : -104;
      shape(ctx, (p) => ellipsePath(p, cx, base, 4.4, 1.8), { fill: brass, ink: 1, shadow: 'none' });
      shape(ctx, (p) => roundRectPath(p, cx - 2, top, 4, base - top, 1), { fill: '#f3e9d2', ink: 1, shadow: '#d4c4a2', shadowOffset: [-1, 0] });
      shape(ctx, (p) => roundRectPath(p, cx - 2.6, top + 2, 1.6, 6, 0.8), { fill: '#efe2c4', ink: 0.5, shadow: 'none' });
      bloom(ctx, cx, top - 4, 16, '#ffb04a', 0.55);
      shape(ctx, (p) => { p.moveTo(cx, top - 9); p.quadraticCurveTo(cx + 2.8, top - 3, cx, top); p.quadraticCurveTo(cx - 2.8, top - 3, cx, top - 9); p.closePath(); }, { fill: '#ffd25a', ink: 0, shadow: '#ff9a2e', shadowOffset: [0.6, 1.2] });
      flat(ctx, (p) => ellipsePath(p, cx, top - 2.2, 0.9, 1.6), '#fff7d6', 0);
    }
  },
});

defineSprite({
  id: 'prop.trattoria.amphora',
  w: 56, h: 84, ax: 28, ay: 76,
  draw: (ctx) => {
    ao(ctx, 3, -4, 20, 7, 0.55);
    const terra = '#c56a43';
    const body = (p: Ctx) => {
      p.moveTo(-7, -60);
      p.quadraticCurveTo(-8, -54, -14, -50);
      p.bezierCurveTo(-26, -40, -22, -10, -9, -2);
      p.quadraticCurveTo(0, 2, 9, -2);
      p.bezierCurveTo(22, -10, 26, -40, 14, -50);
      p.quadraticCurveTo(8, -54, 7, -60);
      p.closePath();
    };
    // handles
    for (const sx of [-1, 1]) { line(ctx, [[sx * 7, -56], [sx * 18, -54], [sx * 16, -44]], 5, INK, true); line(ctx, [[sx * 7, -56], [sx * 18, -54], [sx * 16, -44]], 2.6, terra, true); }
    shape(ctx, body, { fill: terra, ink: 2, shadow: shade(terra, 0.32), shadowOffset: [-6, -2], gloss: [{ x: -9, y: -36, rx: 2.4, ry: 8, rot: 0.15, alpha: 0.35 }] });
    clipped(ctx, body, () => {
      line(ctx, [[-24, -40], [24, -40]], 2, '#2b1712', false, 0.6);
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 5 - 2.5, -40);
        ctx.lineTo(i * 5, -34);
        ctx.lineTo(i * 5 + 2.5, -40);
        ctx.fillStyle = 'rgba(43,23,18,0.65)';
        ctx.fill();
      }
      line(ctx, [[-24, -16], [24, -16]], 1.2, light(terra, 0.3), false, 0.8);
    });
    shape(ctx, (p) => ellipsePath(p, 0, -60, 9, 3), { fill: light(terra, 0.12), ink: 1.6, shadow: 'none' });
    flat(ctx, (p) => ellipsePath(p, 0, -60, 6, 1.8), '#3a1e12', 0);
    // olive branch tucked in
    line(ctx, [[1, -60], [8, -76]], 1.2, '#6b5a3a', true);
    for (let i = 0; i < 4; i++) leaf(ctx, 2 + i * 1.8, -64 - i * 3.6, 6, -1 + (i % 2) * 1.6, '#8aa05a', 0.6, false);
  },
});

// ---------------------------------------------------------------------------
// Overhead: pendant lamps
// ---------------------------------------------------------------------------

function pendant(ctx: Ctx, shadeCol: string, by: number) {
  line(ctx, [[0, by - 120], [0, by - 18]], 1.4, '#1c1412');
  fadeUp(ctx, by - 60, by - 120);
  // glow behind
  bloom(ctx, 0, by + 2, 46, '#ffc070', 0.55);
  // shade (enamel dome)
  shape(ctx, (p) => { p.moveTo(-6, by - 18); p.lineTo(6, by - 18); p.quadraticCurveTo(22, by - 12, 24, by); p.quadraticCurveTo(0, by + 5, -24, by); p.quadraticCurveTo(-22, by - 12, -6, by - 18); p.closePath(); },
    { fill: shadeCol, ink: 2, shadow: shade(shadeCol, 0.35), shadowOffset: [-4, -2], gloss: [{ x: -9, y: by - 10, rx: 5, ry: 2, rot: -0.4, alpha: 0.45 }] });
  // inner rim + bulb
  shape(ctx, (p) => ellipsePath(p, 0, by, 23, 4.2), { fill: '#fff1c8', ink: 1.4, shadow: 'none' });
  flat(ctx, (p) => ellipsePath(p, 0, by + 1.4, 7, 3.4), '#ffffff', 0);
  shape(ctx, (p) => roundRectPath(p, -3, by - 22, 6, 5, 1.5), { fill: '#c9a24a', ink: 1.1, shadow: 'none' });
}

defineSprite({ id: 'prop.trattoria.lamp_green', w: 70, h: 160, ax: 35, ay: 272, draw: (ctx) => pendant(ctx, '#2f6a4a', -150) });
defineSprite({ id: 'prop.trattoria.lamp_brass', w: 70, h: 160, ax: 35, ay: 272, draw: (ctx) => pendant(ctx, '#c9973a', -150) });

// ---------------------------------------------------------------------------
// Floor: rugs + decals
// ---------------------------------------------------------------------------

function rugRound(ctx: Ctx, pal: string[]) {
  {
    const rx = 140, ry = 96;
    softShape(ctx, (p) => ellipsePath(p, 3, 4, rx, ry), 6, 'rgba(20,8,6,0.45)');
    const R0 = (p: Ctx) => ellipsePath(p, 0, 0, rx, ry);
    shape(ctx, R0, { fill: pal[0], ink: 1.6, inkColor: '#3a1210', shadow: 'none' });
    clipped(ctx, R0, () => {
      // concentric bands
      const bands: [number, string][] = [[0.94, pal[1]], [0.9, pal[2]], [0.8, pal[3]], [0.78, pal[4]], [0.62, pal[5]], [0.4, pal[1]], [0.36, pal[2]], [0.24, pal[3]]];
      for (const [k, c] of bands) {
        ctx.beginPath();
        ellipsePath(ctx, 0, 0, rx * k, ry * k);
        ctx.fillStyle = c;
        ctx.fill();
      }
      // medallion petals
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.save();
        ctx.translate(Math.cos(a) * rx * 0.5, Math.sin(a) * ry * 0.5);
        ctx.rotate(a);
        ctx.beginPath();
        ellipsePath(ctx, 0, 0, 13, 5.5);
        ctx.fillStyle = pal[4];
        ctx.fill();
        ctx.restore();
      }
      // border motif dots
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        flat(ctx, (p) => circlePath(p, Math.cos(a) * rx * 0.85, Math.sin(a) * ry * 0.85, 2.2), i % 2 ? '#f0d9a0' : pal[6], 0);
      }
      flat(ctx, (p) => starPath8(p, 0, 0, rx * 0.18, ry * 0.18), '#f0d9a0', 0);
      // wool texture + wear
      speckle(ctx, 0, 0, rx, ry, 500, '#000000', 0.7, 3, 0.08);
      speckle(ctx, 0, 0, rx, ry, 300, '#ffffff', 0.6, 5, 0.06);
      wash(ctx, ctx.createRadialGradient(-30, -20, 10, 0, 0, rx), 1);
      const g = ctx.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx);
      g.addColorStop(0, 'rgba(255,230,190,0.08)');
      g.addColorStop(1, 'rgba(20,5,5,0.25)');
      wash(ctx, g);
    });
    // fringe
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      line(ctx, [[x, y], [x + Math.cos(a) * 5, y + Math.sin(a) * 4]], 0.8, '#efe2c4', false, 0.7);
    }
  }
}

defineSprite({ id: 'prop.trattoria.rug_round', w: 300, h: 210, ax: 150, ay: 105, res: 1.5, draw: (ctx) => rugRound(ctx, ['#6e2226', '#b8924e', '#2e3c56', '#83302c', '#cfae6c', '#5e1e22', '#3a5a8a']) });
defineSprite({ id: 'prop.trattoria.rug_round_b', w: 300, h: 210, ax: 150, ay: 105, res: 1.5, draw: (ctx) => rugRound(ctx, ['#2f4a3a', '#c2a05a', '#6a2a2a', '#3a5a44', '#d6b874', '#26402f', '#8a3a2a']) });

function starPath8(p: Ctx, x: number, y: number, rx: number, ry: number) {
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? 1 : 0.45;
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r;
    if (i === 0) p.moveTo(px, py);
    else p.lineTo(px, py);
  }
  p.closePath();
}

function rugRunner(ctx: Ctx, pal: string[]) {
  {
    const w = 270, h = 86;
    softShape(ctx, (p) => roundRectPath(p, -w / 2 + 3, -h / 2 + 4, w, h, 3), 5, 'rgba(20,8,6,0.45)');
    const body = (p: Ctx) => roundRectPath(p, -w / 2, -h / 2, w, h, 3);
    shape(ctx, body, { fill: pal[0], ink: 1.6, inkColor: '#14202a', shadow: 'none' });
    clipped(ctx, body, () => {
      flat(ctx, (p) => roundRectPath(p, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 2), pal[1], 0);
      flat(ctx, (p) => roundRectPath(p, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 2), pal[2], 0);
      flat(ctx, (p) => roundRectPath(p, -w / 2 + 18, -h / 2 + 18, w - 36, h - 36, 2), pal[3], 0);
      for (let i = 0; i < 5; i++) {
        const cx = -96 + i * 48;
        flat(ctx, (p) => { p.moveTo(cx, -18); p.lineTo(cx + 16, 0); p.lineTo(cx, 18); p.lineTo(cx - 16, 0); p.closePath(); }, i % 2 ? pal[4] : pal[0], 0);
        flat(ctx, (p) => { p.moveTo(cx, -8); p.lineTo(cx + 7, 0); p.lineTo(cx, 8); p.lineTo(cx - 7, 0); p.closePath(); }, '#f0d9a0', 0);
      }
      speckle(ctx, 0, 0, w / 2, h / 2, 400, '#000000', 0.7, 7, 0.08);
      wash(ctx, lgrad(ctx, -w / 2, 0, w / 2, 0, [[0, 'rgba(255,230,190,0.06)'], [1, 'rgba(20,5,5,0.2)']]));
    });
    for (const s of [-1, 1]) for (let i = 0; i < 24; i++) {
      const y = -h / 2 + 3 + i * ((h - 6) / 23);
      line(ctx, [[s * w / 2, y], [s * (w / 2 + 6), y]], 0.9, '#efe2c4', false, 0.75);
    }
  }
}

defineSprite({ id: 'prop.trattoria.rug_runner', w: 300, h: 110, ax: 150, ay: 55, res: 1.5, draw: (ctx) => rugRunner(ctx, ['#2c4656', '#7e2c2a', '#bf9a52', '#6e2226', '#d0b06c']) });
defineSprite({ id: 'prop.trattoria.rug_runner_b', w: 300, h: 110, ax: 150, ay: 55, res: 1.5, draw: (ctx) => rugRunner(ctx, ['#5a2a22', '#c2a05a', '#2f4a3a', '#7a5a2a', '#e0c27a']) });

function wineStain(ctx: Ctx, seed: number, r: number) {
  ctx.save();
  ctx.beginPath();
  splatPath(ctx, 0, 0, r, seed, 5);
  ctx.fillStyle = rgba('#5a0f22', 0.45);
  ctx.fill();
  ctx.beginPath();
  ellipsePath(ctx, -r * 0.1, -r * 0.1, r * 0.6, r * 0.4);
  ctx.fillStyle = rgba('#8a1a32', 0.35);
  ctx.fill();
  ctx.restore();
  glint(ctx, -r * 0.3, -r * 0.25, r * 0.22, r * 0.08, -0.4, 0.35);
}

defineSprite({ id: 'prop.trattoria.wine_stain', w: 60, h: 48, ax: 30, ay: 24, draw: (ctx) => wineStain(ctx, 5, 16) });

defineSprite({
  id: 'prop.trattoria.napkin_drop',
  w: 40, h: 30, ax: 20, ay: 15,
  draw: (ctx) => {
    softShape(ctx, (p) => ellipsePath(p, 2, 3, 12, 6), 3, 'rgba(20,8,6,0.35)');
    shape(ctx, (p) => { p.moveTo(-12, -2); p.quadraticCurveTo(-6, -9, 4, -7); p.lineTo(13, -1); p.quadraticCurveTo(6, 7, -4, 6); p.closePath(); }, { fill: '#c4362e', ink: 1, inkColor: '#5a1010', shadow: '#8e2018', shadowOffset: [-1.5, -1.5] });
    line(ctx, [[-6, -2], [6, 0]], 0.8, '#e86a5a', true, 0.7);
    // cork
    shape(ctx, (p) => roundRectPath(p, 8, 4, 8, 5, 2), { fill: '#d3a46a', ink: 0.9, shadow: '#a87840', shadowOffset: [-0.8, -0.8] });
    flat(ctx, (p) => ellipsePath(p, 8.4, 6.5, 1.2, 2.4), '#8a1a32', 0);
  },
});

defineSprite({
  id: 'prop.trattoria.petals',
  w: 70, h: 44, ax: 35, ay: 22,
  draw: (ctx) => {
    const R = rng(8);
    for (let i = 0; i < 9; i++) {
      const x = (R() - 0.5) * 50, y = (R() - 0.5) * 26, a = R() * 6.28;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      shape(ctx, (p) => { p.moveTo(-3.4, 0); p.quadraticCurveTo(0, -4.4, 3.6, -0.6); p.quadraticCurveTo(0, 3.2, -3.4, 0); p.closePath(); }, { fill: R() < 0.7 ? '#c8232f' : '#e8566a', ink: 0.6, inkColor: '#5a0a14', shadow: '#8a1420', shadowOffset: [-0.6, -0.6] });
      ctx.restore();
    }
  },
});

defineSprite({
  id: 'prop.trattoria.crumbs',
  w: 50, h: 36, ax: 25, ay: 18,
  draw: (ctx) => {
    const R = rng(13);
    for (let i = 0; i < 16; i++) {
      const x = (R() - 0.5) * 36, y = (R() - 0.5) * 20, s = 0.8 + R() * 1.6;
      flat(ctx, (p) => blobPath(p, x, y, s, s * 0.8, 0.3, 6, i), R() < 0.5 ? '#e2b06a' : '#c48a44', 0.4, '#6a3a1a');
    }
    // a grissino stick
    line(ctx, [[-14, 8], [10, 2]], 3, '#6a3a1a');
    line(ctx, [[-14, 8], [10, 2]], 1.8, '#ecc27e');
  },
});

// ---------------------------------------------------------------------------
// Layout — tables on a loose 320u grid, structured clusters
// ---------------------------------------------------------------------------

const SLOT = 360;
const TABLE_COL_R = 48;

function placeTable(L: Layout, x: number, y: number): boolean {
  // anchor = front of table footprint; centre at (x, y - TRK)
  const cyc = y - TRK;
  const chairs: ('n' | 's' | 'e' | 'w')[] = [];
  const n = L.weighted<number>([[4, 4], [3, 2.5], [2, 1.5]]);
  const all: ('n' | 's' | 'e' | 'w')[] = ['n', 'e', 'w', 's'];
  if (n === 4) chairs.push(...all);
  else if (n === 3) { const skip = L.pick(all); chairs.push(...all.filter((c) => c !== skip)); }
  else chairs.push(...(L.chance(0.5) ? (['e', 'w'] as const) : (['n', 's'] as const)));
  const box = { x0: x - 72, y0: cyc - 72, x1: x + 72, y1: cyc + 70 };
  if (!L.canBlock(box)) return false;
  let area = Math.PI * TABLE_COL_R * TABLE_COL_R;
  // rug under some tables
  if (L.chance(0.22)) L.floor(L.chance(0.6) ? 'prop.trattoria.rug_round' : 'prop.trattoria.rug_round_b', x, cyc + 8);
  const variant = L.pick(['a', 'b', 'c']);
  L.add({
    sprite: `prop.trattoria.table_${variant}`, x, y,
    collider: circleCol(TABLE_COL_R, 0, -TRK), sortOffset: -TRK,
    light: { r: 180, color: '#ffb35a', intensity: 0.9, flicker: 0.45, ox: -7, oy: (TOP_Y - 34) * TK },
  });
  for (const c of chairs) {
    const j = L.range(-4, 4);
    if (c === 'n') L.add({ sprite: 'prop.trattoria.chair_n', x: x + j, y: cyc - 58, collider: circleCol(13, 0, 2) });
    else if (c === 's') L.add({ sprite: 'prop.trattoria.chair_s', x: x + j, y: cyc + 62, collider: circleCol(13, 0, -6) });
    else if (c === 'e') L.add({ sprite: 'prop.trattoria.chair_w', x: x + 66, y: cyc + 8 + j, collider: circleCol(13, -10, -8) });
    else L.add({ sprite: 'prop.trattoria.chair_w', x: x - 66, y: cyc + 8 + j, flip: true, collider: circleCol(13, 10, -8) });
    area += Math.PI * 13 * 13;
  }
  L.block(box, area);
  // pendant lamp above (overhead)
  if (L.chance(0.6)) L.overhead(L.chance(0.6) ? 'prop.trattoria.lamp_brass' : 'prop.trattoria.lamp_green', x + L.range(-6, 6), cyc, { light: { r: 240, color: '#ffd08a', intensity: 0.75, flicker: 0.04, oy: 0 } });
  // floor life around the table
  if (L.chance(0.45)) L.floor(L.pick(['prop.trattoria.crumbs', 'prop.trattoria.napkin_drop', 'prop.trattoria.wine_stain', 'prop.trattoria.petals']), x + L.range(-70, 70), cyc + L.range(64, 90));
  return true;
}

function placeSingle(L: Layout, x: number, y: number, sprite: string, hw: number, hd: number, extra: Partial<PropPlacement> = {}): boolean {
  const box = { x0: x - hw, y0: y - hd, x1: x + hw, y1: y };
  if (!L.canBlock(box)) return false;
  L.block(box, extra.collider?.kind === 'circle' ? Math.PI * extra.collider.r * extra.collider.r : hw * 2 * hd);
  L.add({ sprite, x, y, ...extra });
  return true;
}

function breakableAt(L: Layout, x: number, y: number): boolean {
  const [sprite, hw, debris, hp] = L.weighted<[string, number, string, number]>([
    [['prop.trattoria.bread_basket', 24, 'straw', 2], 1.3],
    [['prop.trattoria.wine_crate', 28, 'glass', 2], 1.6],
    [['prop.trattoria.flower_vase', 16, 'glass', 1], 1],
    [['prop.trattoria.candelabra', 18, 'glass', 2], 1.6],
    [['prop.trattoria.amphora', 20, 'wood', 2], 1.1],
    [['prop.common.crate_lemon', 30, 'wood', 2], 0.6],
  ]);
  const b = { x0: x - hw, y0: y - 34, x1: x + hw, y1: y + 4 };
  if (!L.canSoft(b) || L.out.filter((p) => p.sprite === sprite).length >= 2) return false;
  L.softBox(b);
  const p: PropPlacement = { sprite, x, y, breakable: { hp, debris } };
  if (sprite === 'prop.trattoria.candelabra') p.light = { r: 190, color: '#ffb35a', intensity: 0.9, flicker: 0.45, oy: -118 };
  L.add(p);
  return true;
}

function populateTrattoria(cx: number, cy: number, rnd: () => number): PropPlacement[] {
  const L = new Layout(cx, cy, CHUNK, rnd, 80, 160);
  let specials = 0, carts = 0, rugs = 0;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const sx = L.X0 + SLOT / 2 + i * SLOT + L.range(-8, 8);
    const sy = L.Y0 + SLOT / 2 + j * SLOT + L.range(-8, 8);
    const kind = L.weighted<string>([
      ['table', 8], ['lemon', 1.1], ['rack', specials ? 0.25 : 0.8], ['piano', specials ? 0 : 0.35], ['column', 0.7],
      ['coat', 0.35], ['sideboard', specials ? 0.15 : 0.6], ['barrels', 0.4], ['empty', 0.8],
    ]);
    let ok = false;
    if (kind === 'table') ok = placeTable(L, sx, sy + TRK);
    else if (kind === 'lemon') {
      ok = placeSingle(L, sx, sy + 16, 'prop.trattoria.lemon_tree', 30, 36, { collider: circleCol(24, 0, -20), sortOffset: -18 });
      if (ok && L.chance(0.6)) {
        const dx = L.chance(0.5) ? 48 : -48;
        L.add({ sprite: 'prop.trattoria.lemon_tree', x: sx + dx, y: sy + 30, collider: circleCol(24, 0, -20), sortOffset: -18 });
        L.colliderArea += Math.PI * 24 * 24;
        L.blocks[L.blocks.length - 1] = { x0: Math.min(sx, sx + dx) - 30, y0: sy - 20, x1: Math.max(sx, sx + dx) + 30, y1: sy + 30 };
      }
    } else if (kind === 'rack') {
      ok = placeSingle(L, sx, sy + 20, 'prop.trattoria.wine_rack', 72, 36, { collider: rectCol(140, 34, 0, -17), sortOffset: -17, light: { r: 120, color: '#ffb35a', intensity: 0.7, flicker: 0.4, ox: 37, oy: -190 } });
      specials++;
    } else if (kind === 'piano') {
      ok = placeSingle(L, sx, sy + 24, 'prop.trattoria.piano', 78, 46, { collider: rectCol(152, 46, 0, -23), sortOffset: -23, light: { r: 190, color: '#ffb35a', intensity: 0.85, flicker: 0.35, ox: 44, oy: -200 } });
      if (ok) {
        specials++;
        const ax = sx + (L.chance(0.5) ? 116 : -116);
        const b = { x0: ax - 26, y0: sy, x1: ax + 26, y1: sy + 40 };
        if (L.canSoft(b)) { L.softBox(b); L.add({ sprite: 'prop.trattoria.accordion_chair', x: ax, y: sy + 34 }); }
        L.floor(L.pick(['prop.trattoria.rug_runner', 'prop.trattoria.rug_runner_b']), sx, sy + 74);
        rugs++;
      }
    } else if (kind === 'column') {
      ok = placeSingle(L, sx, sy + 12, 'prop.trattoria.column', 34, 34, { collider: circleCol(30, 0, -16), sortOffset: -16 });
    } else if (kind === 'coat') {
      ok = placeSingle(L, sx, sy + 8, 'prop.trattoria.coat_stand', 20, 22, { collider: circleCol(14, 0, -6) });
    } else if (kind === 'sideboard') {
      ok = placeSingle(L, sx, sy + 20, 'prop.trattoria.sideboard', 80, 40, { collider: rectCol(158, 40, 0, -20), sortOffset: -20, light: { r: 170, color: '#ffc070', intensity: 0.8, flicker: 0.05, ox: 54, oy: -110 } });
      specials++;
    } else if (kind === 'barrels') {
      ok = placeSingle(L, sx, sy + 16, 'prop.common.barrel_wine', 56, 50, { collider: circleCol(28, 0, -16), sortOffset: -14 });
      if (ok) {
        // a second barrel touching the first (same cluster)
        L.add({ sprite: 'prop.common.barrel', x: sx + 50, y: sy + 4, collider: circleCol(28, 0, -16), sortOffset: -14 });
        L.colliderArea += Math.PI * 28 * 28;
      }
    }
    if (!ok || kind === 'empty') {
      // open slot: a rug, maybe a dessert cart
      if (!rugs && L.chance(0.4)) { L.floor(L.pick(['prop.trattoria.rug_round', 'prop.trattoria.rug_round_b', 'prop.trattoria.rug_runner', 'prop.trattoria.rug_runner_b']), sx, sy); rugs++; }
      if (!carts && L.chance(0.3) && L.trySoft((x, y) => ({ sprite: 'prop.trattoria.dessert_cart', x, y }), 44, 24, { x0: sx - 60, y0: sy - 40, x1: sx + 60, y1: sy + 40 })) carts++;
    }
  }
  // breakables tucked between slots
  const nb = L.int(2, 4);
  for (let i = 0; i < nb; i++) {
    for (let t = 0; t < 8; t++) {
      const [x, y] = L.pt(36);
      if (breakableAt(L, x, y)) break;
    }
  }
  // floor decals
  const nd = L.int(3, 6);
  for (let i = 0; i < nd; i++) {
    L.floor(L.weighted([['prop.trattoria.crumbs', 2], ['prop.trattoria.wine_stain', 1.2], ['prop.trattoria.petals', 1.2], ['prop.trattoria.napkin_drop', 0.8], ['prop.common.crumbs', 1]]), ...L.pt(30), L.chance(0.5));
  }
  return L.out;
}

registerStageEnv({
  id: 'trattoria',
  tileSize: TS,
  tile: (tx, ty) => `tile.trattoria.${mod(ty, 3) * 3 + mod(tx, 3)}`,
  chunkSize: CHUNK,
  populate: populateTrattoria,
  ambient: { tint: '#ffe8cc', darkness: 0.45, darkColor: '#24121c', vignette: 0.42, particles: 'dust' },
});

