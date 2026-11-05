/**
 * STAGE 4 — "La Food Court": the culinary crimes' lair — a soulless fusion
 * food hall. Glossy cheap vinyl tiles, plastic tables, fast-food counters with
 * garish neon parody signs, soda + slush machines, bins, wet-floor signs,
 * plastic plants, spilled drinks, fluorescent ceiling panels.
 */
import { defineSprite } from '../sprites';
import { registerStageEnv } from '../stageenv';
import type { PropPlacement } from '../stageenv';
import {
  Ctx, Pt, INK, shape, flat, line, ellipsePath, circlePath, roundRectPath, blobPath, splatPath,
  rng, rgba, mix, shade, light, speckle, glint,
} from '../painter';
import {
  Layout, hash2, pickWeighted, rectCol, ao, aoRect, softShape, clipped, lgrad, wash, bloom, fadeAll, fadeUp,
  strokeText, neonText, steelRect, leaf, tomato,
} from './env_common';

const TS = 128;
const CHUNK = 768;

// ---------------------------------------------------------------------------
// Floor: glossy vinyl composition tiles (2×2 per tile), speckled, scuffed
// ---------------------------------------------------------------------------

const VCT_A = '#cfcec4';
const VCT_B = '#a3b5b3';
const VARIANTS = 6;

function fcTile(ctx: Ctx, v: number) {
  const R = rng(5150 + v * 97);
  const S = 64;
  ctx.fillStyle = '#8f9895';
  ctx.fillRect(0, 0, TS, TS);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const alt = (i + j) % 2 === 1;
    let c = alt ? VCT_B : VCT_A;
    c = mix(c, R() < 0.5 ? '#c8cbc0' : '#e2e2da', R() * 0.25);
    if (v === 5 && !alt) c = mix(c, '#e2d9b8', 0.35); // yellowed
    const x = i * S + 0.6, y = j * S + 0.6, w = S - 1.2;
    const build = (p: Ctx) => p.rect(x, y, w, w);
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, w);
    clipped(ctx, build, () => {
      // vinyl chips (VCT speckle)
      speckle(ctx, x + w / 2, y + w / 2, w * 0.55, w * 0.55, 46, alt ? '#7f9a96' : '#b9b7aa', 1.1, Math.floor(R() * 1e6), 0.5);
      speckle(ctx, x + w / 2, y + w / 2, w * 0.55, w * 0.55, 26, '#ffffff', 0.9, Math.floor(R() * 1e6), 0.45);
      speckle(ctx, x + w / 2, y + w / 2, w * 0.55, w * 0.55, 10, alt ? '#d38aa0' : '#8ab0c8', 0.9, Math.floor(R() * 1e6), 0.35);
      // wax gloss: diagonal soft reflection band of the ceiling panels
      ctx.fillStyle = lgrad(ctx, x, y, x + w, y + w, [[0, 'rgba(255,255,255,0.14)'], [0.4, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0)'], [1, 'rgba(20,30,40,0.06)']]);
      ctx.fillRect(x, y, w, w);
      if (R() < (v === 0 ? 0.5 : 0.25)) {
        ctx.save();
        ctx.translate(x + w * (0.3 + R() * 0.4), y + w * (0.3 + R() * 0.4));
        ctx.rotate(-0.78);
        ctx.scale(1, 0.25);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.5);
        g.addColorStop(0, 'rgba(240,252,255,0.35)');
        g.addColorStop(1, 'rgba(240,252,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        circlePath(ctx, 0, 0, w * 0.5);
        ctx.fill();
        ctx.restore();
      }
      // black heel scuffs
      const ns = v === 1 ? 4 : R() < 0.2 ? 1 : 0;
      for (let k = 0; k < ns; k++) {
        const sx = x + 8 + R() * (w - 16), sy = y + 8 + R() * (w - 16), a = R() * 6;
        line(ctx, [[sx, sy], [sx + Math.cos(a) * 7, sy + Math.sin(a) * 3], [sx + Math.cos(a) * 12, sy + Math.sin(a) * 1]], 1.1, '#2b2b30', true, 0.4);
      }
      // gum spots
      if (v === 2 && (i + j) % 2 === 0) for (let k = 0; k < 2; k++) {
        const gx = x + 6 + R() * (w - 12), gy = y + 6 + R() * (w - 12);
        flat(ctx, (p) => blobPath(p, gx, gy, 1.5, 1.2, 0.25, 7, k + i * 3 + j), '#6a6a72', 0);
        flat(ctx, (p) => blobPath(p, gx - 0.3, gy - 0.3, 0.8, 0.6, 0.25, 7, k + 9), '#8a8a92', 0);
      }
      // faint sticky soda ring
      if (v === 3 && i === 0 && j === 1) {
        ctx.save();
        ctx.beginPath();
        ellipsePath(ctx, x + w / 2, y + w / 2, 9, 6);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(110,70,40,0.18)';
        ctx.stroke();
        ctx.restore();
      }
      // chipped / cracked tile
      if (v === 4 && i === 1 && j === 0) {
        flat(ctx, (p) => { p.moveTo(x + w, y + 10); p.lineTo(x + w - 9, y + 16); p.lineTo(x + w - 4, y + 24); p.lineTo(x + w, y + 22); p.closePath(); }, '#8f9895', 0);
        line(ctx, [[x + w - 9, y + 16], [x + w - 24, y + 30], [x + w - 30, y + 46]], 0.7, '#5f6664', false, 0.7);
      }
    });
    // tile edge bevel (very subtle)
    line(ctx, [[x + 0.5, y + w], [x + 0.5, y + 0.5], [x + w, y + 0.5]], 0.8, '#ffffff', false, 0.35);
    line(ctx, [[x + 1, y + w - 0.4], [x + w - 0.4, y + w - 0.4], [x + w - 0.4, y + 1]], 0.8, '#3a4442', false, 0.18);
  }
}

for (let v = 0; v < VARIANTS; v++) defineSprite({ id: `tile.foodcourt.${v}`, w: TS, h: TS, ax: 0, ay: 0, draw: (ctx) => fcTile(ctx, v) });
const TILE_W = [3, 1.4, 1.1, 1, 0.8, 1.2];

// ---------------------------------------------------------------------------
// Plastic table sets (table + 4 molded chairs, one sprite, one collider)
// ---------------------------------------------------------------------------

function plasticChair(ctx: Ctx, x: number, y: number, col: string, view: 'front' | 'back' | 'side', flip = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const sh = shade(col, 0.28);
  const legs = (pts: Pt[][]) => { for (const pl of pts) { line(ctx, pl, 3.4, INK); line(ctx, pl, 1.6, '#c9cfd4'); } };
  if (view === 'front') {
    legs([[[-10, -16], [-12, 0]], [[10, -16], [12, 0]]]);
    shape(ctx, (p) => { p.moveTo(-12, -48); p.quadraticCurveTo(0, -54, 12, -48); p.lineTo(11, -26); p.lineTo(-11, -26); p.closePath(); }, { fill: col, ink: 1.8, shadow: sh, shadowOffset: [-2.4, -1.6], gloss: [{ x: -5, y: -44, rx: 3, ry: 1.2, alpha: 0.5 }] });
    shape(ctx, (p) => { p.moveTo(-13, -26); p.lineTo(13, -26); p.lineTo(14, -16); p.quadraticCurveTo(0, -13, -14, -16); p.closePath(); }, { fill: light(col, 0.08), ink: 1.8, shadow: sh, shadowOffset: [-2, -2] });
  } else if (view === 'back') {
    legs([[[-11, -16], [-12, 0]], [[11, -16], [12, 0]]]);
    shape(ctx, (p) => { p.moveTo(-13, -22); p.lineTo(13, -22); p.lineTo(13, -16); p.lineTo(-13, -16); p.closePath(); }, { fill: sh, ink: 1.6, shadow: 'none' });
    shape(ctx, (p) => { p.moveTo(-13, -52); p.quadraticCurveTo(0, -58, 13, -52); p.lineTo(12, -24); p.quadraticCurveTo(0, -21, -12, -24); p.closePath(); }, { fill: col, ink: 1.8, shadow: sh, shadowOffset: [-2.4, -1.6], gloss: [{ x: -5, y: -48, rx: 3, ry: 1.4, alpha: 0.45 }] });
    flat(ctx, (p) => roundRectPath(p, -5, -48, 10, 3, 1.5), sh, 0);
  } else {
    legs([[[-8, -16], [-10, 0]], [[8, -16], [10, 0]]]);
    shape(ctx, (p) => { p.moveTo(-12, -24); p.lineTo(10, -24); p.lineTo(12, -16); p.lineTo(-12, -16); p.closePath(); }, { fill: col, ink: 1.8, shadow: sh, shadowOffset: [-1.5, -1.5] });
    shape(ctx, (p) => { p.moveTo(8, -18); p.quadraticCurveTo(14, -36, 12, -50); p.lineTo(7, -50); p.quadraticCurveTo(9, -34, 4, -22); p.closePath(); }, { fill: col, ink: 1.8, shadow: sh, shadowOffset: [-1.5, 0] });
  }
  ctx.restore();
}

function tray(ctx: Ctx, x: number, y: number, col: string, seed: number) {
  const R = rng(seed);
  shape(ctx, (p) => roundRectPath(p, x - 17, y - 10, 34, 20, 3), { fill: col, ink: 1.3, shadow: shade(col, 0.25), shadowOffset: [-1.2, -1.2] });
  // crime food: pineapple pizza slice / ketchup pasta / fries
  const kind = Math.floor(R() * 3);
  if (kind === 0) {
    shape(ctx, (p) => { p.moveTo(x - 12, y - 6); p.lineTo(x + 2, y - 6); p.lineTo(x - 5, y + 7); p.closePath(); }, { fill: '#e6b65a', ink: 1, shadowOffset: [-0.8, -0.8] });
    flat(ctx, (p) => { p.moveTo(x - 10.5, y - 4.6); p.lineTo(x + 0.6, y - 4.6); p.lineTo(x - 5, y + 5); p.closePath(); }, '#e04a2a', 0);
    for (const [dx, dy] of [[-7, -3], [-3, -2.4], [-5, 1]] as const) flat(ctx, (p) => roundRectPath(p, x + dx - 1.4, y + dy - 1.2, 2.8, 2.4, 0.6), '#f7e04a', 0.5);
  } else if (kind === 1) {
    shape(ctx, (p) => ellipsePath(p, x - 5, y, 9, 6), { fill: '#ffffff', ink: 1, shadow: '#d6d0c6', shadowOffset: [-0.8, -0.8] });
    for (let i = 0; i < 5; i++) line(ctx, [[x - 11 + R() * 4, y - 3 + R() * 6], [x - 3 + R() * 6, y - 3 + R() * 6]], 1.1, '#f0cf6a', true);
    flat(ctx, (p) => blobPath(p, x - 5, y - 0.5, 4.6, 3, 0.3, 8, 3), '#ff2a1a', 0);
  } else {
    shape(ctx, (p) => { p.moveTo(x - 10, y - 2); p.lineTo(x - 1, y - 2); p.lineTo(x - 2, y + 7); p.lineTo(x - 9, y + 7); p.closePath(); }, { fill: '#e23a2a', ink: 1, shadowOffset: [-0.8, 0] });
    for (let i = 0; i < 5; i++) line(ctx, [[x - 9 + i * 2, y - 2], [x - 9.5 + i * 2.2, y - 8]], 1.4, '#f5d04a');
  }
  // cup with straw
  shape(ctx, (p) => { p.moveTo(x + 6, y - 9); p.lineTo(x + 14, y - 9); p.lineTo(x + 13, y + 5); p.lineTo(x + 7, y + 5); p.closePath(); }, { fill: '#ffffff', ink: 1, shadow: '#cfd6dc', shadowOffset: [-1, 0] });
  flat(ctx, (p) => p.rect(x + 6.6, y - 4, 6.8, 4), R() < 0.5 ? '#ff3fa4' : '#3fd0ff', 0);
  line(ctx, [[x + 11, y - 9], [x + 13, y - 16]], 1.4, '#ff6a3a');
}

function tableSet(ctx: Ctx, chair: string, top: string, seed: number) {
  ao(ctx, 4, -24, 66, 26, 0.45);
  // chairs behind (north) first
  plasticChair(ctx, -20, -54, chair, 'front');
  plasticChair(ctx, 20, -54, chair, 'front');
  // side chairs
  plasticChair(ctx, -56, -18, chair, 'side', true);
  plasticChair(ctx, 56, -18, chair, 'side');
  // table: chrome pedestal + laminate top
  line(ctx, [[0, -10], [0, -40]], 5, INK);
  line(ctx, [[0, -10], [0, -40]], 2.8, '#c9cfd4');
  shape(ctx, (p) => ellipsePath(p, 0, -8, 16, 4.4), { fill: '#b9c0c6', ink: 1.6, shadow: 'none' });
  const T = (p: Ctx) => roundRectPath(p, -40, -72, 80, 32, 4);
  shape(ctx, (p) => roundRectPath(p, -40, -44, 80, 5, 2), { fill: shade(top, 0.3), ink: 1.8, shadow: 'none' });
  shape(ctx, T, { fill: top, ink: 2.2, shadow: shade(top, 0.12), shadowOffset: [-2, -2] });
  clipped(ctx, T, () => {
    speckle(ctx, 0, -56, 40, 16, 30, shade(top, 0.15), 0.8, seed, 0.6);
    wash(ctx, lgrad(ctx, -40, -72, 40, -40, [[0, 'rgba(255,255,255,0.3)'], [0.3, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.05)']]));
  });
  tray(ctx, -14, -58, ['#e8463a', '#2f8ac8', '#f2a72a'][seed % 3], seed);
  const R = rng(seed);
  if (R() < 0.6) {
    // napkins + ketchup sachet
    shape(ctx, (p) => roundRectPath(p, 12, -66, 12, 9, 1), { fill: '#ffffff', ink: 0.9, shadow: '#d6d0c6', shadowOffset: [-0.8, -0.8] });
    flat(ctx, (p) => roundRectPath(p, 26, -60, 7, 4, 1), '#e23a2a', 0.6);
  }
  shape(ctx, (p) => { p.moveTo(22, -70); p.lineTo(30, -70); p.lineTo(29, -54); p.lineTo(23, -54); p.closePath(); }, { fill: '#ffffff', ink: 1, shadow: '#cfd6dc', shadowOffset: [-1, 0] });
  flat(ctx, (p) => p.rect(22.6, -64, 6.8, 5), '#b6ff3f', 0);
  // chairs in front (south)
  plasticChair(ctx, -20, 2, chair, 'back');
  plasticChair(ctx, 20, 2, chair, 'back');
}

defineSprite({ id: 'prop.foodcourt.table_orange', w: 150, h: 132, ax: 75, ay: 116, draw: (ctx) => tableSet(ctx, '#f28a2a', '#eceae2', 1) });
defineSprite({ id: 'prop.foodcourt.table_teal', w: 150, h: 132, ax: 75, ay: 116, draw: (ctx) => tableSet(ctx, '#2fb7b0', '#eceae2', 2) });
defineSprite({ id: 'prop.foodcourt.table_red', w: 150, h: 132, ax: 75, ay: 116, draw: (ctx) => tableSet(ctx, '#e5413a', '#e2e6ea', 3) });
defineSprite({ id: 'prop.foodcourt.table_yellow', w: 150, h: 132, ax: 75, ay: 116, draw: (ctx) => tableSet(ctx, '#f2c22a', '#e2e6ea', 4) });

// ---------------------------------------------------------------------------
// Fast-food counters with neon parody signs
// ---------------------------------------------------------------------------

interface CounterDef { id: string; text: string; neon: string; body: string; stripe: string; menu: string[] }

const COUNTERS: CounterDef[] = [
  { id: 'pizza', text: 'PIZZA 1$', neon: '#ff3fa4', body: '#3a2a6a', stripe: '#ff3fa4', menu: ['ananas', 'hotdog', 'fries'] },
  { id: 'pasta', text: 'PASTA BAR', neon: '#3ff0ff', body: '#1f3a5a', stripe: '#3ff0ff', menu: ['ketchup', 'cream', 'cup'] },
  { id: 'fusion', text: 'FUSION!', neon: '#b6ff3f', body: '#2a4a2a', stripe: '#b6ff3f', menu: ['sushi', 'ananas', 'cup'] },
  { id: 'sushizza', text: 'SUSHIZZA', neon: '#ff9a2e', body: '#5a2a2a', stripe: '#ff9a2e', menu: ['sushi', 'hotdog', 'ketchup'] },
  { id: 'cappuccino', text: 'CAPPUCCINO 24H', neon: '#c07cff', body: '#2f2448', stripe: '#c07cff', menu: ['cup', 'cream', 'fries'] },
];

function menuPic(ctx: Ctx, x: number, y: number, kind: string) {
  flat(ctx, (p) => roundRectPath(p, x - 15, y - 11, 30, 22, 2), '#fff8e6', 0.8, '#3a3440');
  if (kind === 'ananas') {
    shape(ctx, (p) => ellipsePath(p, x, y, 11, 7), { fill: '#e6b65a', ink: 0.9, shadow: 'none' });
    flat(ctx, (p) => ellipsePath(p, x, y, 9, 5.6), '#e04a2a', 0);
    for (let i = 0; i < 4; i++) flat(ctx, (p) => roundRectPath(p, x - 6 + i * 3.6, y - 2 + (i % 2) * 2, 2.6, 2.2, 0.6), '#f7e04a', 0.4);
  } else if (kind === 'ketchup') {
    flat(ctx, (p) => ellipsePath(p, x, y + 2, 11, 5.4), '#ffffff', 0.6);
    for (let i = 0; i < 4; i++) line(ctx, [[x - 8, y + i - 1], [x + 8, y + 2 - i]], 1, '#f0cf6a', true);
    flat(ctx, (p) => blobPath(p, x, y, 5, 3, 0.3, 8, 2), '#ff2a1a', 0);
  } else if (kind === 'cream') {
    flat(ctx, (p) => ellipsePath(p, x, y + 2, 11, 5.4), '#ffffff', 0.6);
    flat(ctx, (p) => blobPath(p, x, y + 1, 8, 3.6, 0.2, 8, 4), '#f6efd6', 0.5, '#b8a888');
    for (let i = 0; i < 3; i++) flat(ctx, (p) => roundRectPath(p, x - 5 + i * 4, y - 1, 2.2, 1.6, 0.5), '#e8a0a0', 0);
  } else if (kind === 'sushi') {
    for (const dx of [-6, 6]) {
      flat(ctx, (p) => roundRectPath(p, x + dx - 4.6, y - 3, 9.2, 7, 2), '#ffffff', 0.6);
      flat(ctx, (p) => roundRectPath(p, x + dx - 4.6, y - 5, 9.2, 3.4, 1.4), '#e04a2a', 0.4);
      flat(ctx, (p) => circlePath(p, x + dx, y - 4, 1.2), '#f7e04a', 0);
    }
  } else if (kind === 'hotdog') {
    flat(ctx, (p) => roundRectPath(p, x - 11, y - 3, 22, 8, 4), '#e6b65a', 0.6);
    flat(ctx, (p) => roundRectPath(p, x - 12, y - 4, 24, 4.6, 2.3), '#c8523a', 0.5);
    line(ctx, [[x - 9, y - 2], [x - 4, y - 3], [x + 1, y - 2], [x + 6, y - 3]], 0.9, '#f7e04a', true);
  } else if (kind === 'fries') {
    flat(ctx, (p) => { p.moveTo(x - 6, y - 1); p.lineTo(x + 6, y - 1); p.lineTo(x + 5, y + 9); p.lineTo(x - 5, y + 9); p.closePath(); }, '#e23a2a', 0.6);
    for (let i = 0; i < 5; i++) line(ctx, [[x - 4 + i * 2, y - 1], [x - 4.5 + i * 2.2, y - 8]], 1.3, '#f5d04a');
  } else {
    flat(ctx, (p) => { p.moveTo(x - 6, y - 7); p.lineTo(x + 6, y - 7); p.lineTo(x + 5, y + 8); p.lineTo(x - 5, y + 8); p.closePath(); }, '#ffffff', 0.6);
    flat(ctx, (p) => ellipsePath(p, x, y - 7, 6, 2), '#c49a6a', 0);
    flat(ctx, (p) => ellipsePath(p, x, y - 8, 4, 2.6), '#fffaf0', 0);
  }
}

function counterDraw(ctx: Ctx, def: CounterDef) {
  const W = 212, CD = 50, CH = 52;
  const x0 = -W / 2;
  aoRect(ctx, x0 - 6, -CD - 4, W + 18, CD + 12, 9, 0.55, 6);
  // back wall panel with menu boards (rises above the counter)
  const backTop = -CH - CD - 112;
  shape(ctx, (p) => roundRectPath(p, x0 + 6, backTop, W - 12, 120, [6, 6, 0, 0]), { fill: shade(def.body, 0.2), ink: 2.4, shadow: 'none' });
  // backlit menu boards
  for (let i = 0; i < 3; i++) {
    const mx = x0 + 18 + i * ((W - 36) / 3), mw = (W - 36) / 3 - 6;
    shape(ctx, (p) => roundRectPath(p, mx, backTop + 34, mw, 46, 3), { fill: '#fdf6e4', ink: 1.6, shadow: 'none' });
    bloom(ctx, mx + mw / 2, backTop + 57, 40, '#ffffff', 0.25);
    menuPic(ctx, mx + mw / 2, backTop + 50, def.menu[i]);
    strokeText(ctx, ['0.99', '1.49', '2.99'][i], mx + mw / 2, backTop + 66, 6, '#d02a2a', 1.2);
    flat(ctx, (p) => p.rect(mx + 4, backTop + 76, mw - 8, 1.4), def.stripe, 0);
  }
  // neon sign
  const sy = backTop + 6;
  shape(ctx, (p) => roundRectPath(p, x0 + 14, sy - 2, W - 28, 30, 6), { fill: '#120c1e', ink: 2, shadow: 'none' });
  const size = def.text.length > 10 ? 13 : 17;
  neonText(ctx, def.text, 0, sy + (28 - size) / 2, size, def.neon, { tracking: 1.6 });
  // counter body
  const front = (p: Ctx) => roundRectPath(p, x0, -CH, W, CH, [0, 0, 3, 3]);
  shape(ctx, front, { fill: def.body, ink: 2.6, shadow: 'none' });
  clipped(ctx, front, () => {
    wash(ctx, lgrad(ctx, x0, 0, x0 + W, 0, [[0, light(def.body, 0.15)], [0.5, def.body], [1, shade(def.body, 0.2)]]));
    // glossy stripes
    ctx.fillStyle = def.stripe;
    ctx.fillRect(x0, -CH + 14, W, 5);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x0, -CH + 22, W, 2);
    ctx.globalAlpha = 1;
    wash(ctx, lgrad(ctx, x0, -CH, x0 + W, 0, [[0, 'rgba(255,255,255,0)'], [0.3, 'rgba(255,255,255,0)'], [0.33, 'rgba(255,255,255,0.22)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]));
    ctx.fillStyle = '#16121e';
    ctx.fillRect(x0, -6, W, 6);
  });
  // countertop (steel)
  steelRect(ctx, x0 + 0.5, -CH - CD + 0.5, W - 1, CD - 1, '#ccd2d8', 7);
  line(ctx, [[x0 + 1, -CH], [x0 + W - 1, -CH]], 1.8, INK, false, 0.9);
  line(ctx, [[x0 + 2, -CH + 1.8], [x0 + W - 2, -CH + 1.8]], 1.2, '#f2f6f8', false, 0.8);
  // register, heat lamp tray, napkin dispenser, a box of "pizza"
  const ty = -CH - CD;
  shape(ctx, (p) => roundRectPath(p, x0 + 12, ty + 12, 30, 22, 3), { fill: '#3a3a44', ink: 1.6, shadowOffset: [-2, -2] });
  flat(ctx, (p) => roundRectPath(p, x0 + 16, ty + 14, 22, 10, 2), '#6fe0c8', 0.8, '#1a2a2a');
  strokeText(ctx, '$$$', x0 + 27, ty + 15.5, 6, '#123a32', 1);
  // heat tray with crime food
  shape(ctx, (p) => roundRectPath(p, -40, ty + 10, 80, 30, 3), { fill: '#a9b0b8', ink: 1.6, shadowOffset: [-1.5, -1.5] });
  bloom(ctx, 0, ty + 24, 40, '#ff9a3a', 0.3);
  for (let i = 0; i < 4; i++) menuPic(ctx, -28 + i * 19, ty + 24, def.menu[i % 3]);
  shape(ctx, (p) => roundRectPath(p, W / 2 - 40, ty + 10, 24, 24, 3), { fill: '#e6e8ea', ink: 1.6, shadowOffset: [-1.5, -1.5] });
  flat(ctx, (p) => p.rect(W / 2 - 36, ty + 13, 16, 6), '#ffffff', 0.6);
  // neon light spill on the countertop
  bloom(ctx, 0, -CH - CD + 4, 90, def.neon, 0.16);
}

for (const def of COUNTERS) {
  defineSprite({ id: `prop.foodcourt.counter_${def.id}`, w: 236, h: 236, ax: 116, ay: 222, draw: (ctx) => counterDraw(ctx, def) });
}

/** Coloured neon glow reflected on the glossy floor (floor layer). */
function neonPool(color: string) {
  return (ctx: Ctx) => {
    ctx.save();
    ctx.scale(1, 0.42);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 130);
    g.addColorStop(0, rgba(color, 0.3));
    g.addColorStop(0.5, rgba(color, 0.1));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    circlePath(ctx, 0, 0, 130);
    ctx.fill();
    ctx.restore();
  };
}
for (const def of COUNTERS) defineSprite({ id: `prop.foodcourt.glow_${def.id}`, w: 270, h: 120, ax: 135, ay: 60, draw: neonPool(def.neon) });

// ---------------------------------------------------------------------------
// Soda fountain + slush machine (animated swirls)
// ---------------------------------------------------------------------------

function machineBase(ctx: Ctx, W: number, MD: number, MH: number, body: string) {
  aoRect(ctx, -W / 2 - 4, -MD - 4, W + 14, MD + 10, 8, 0.55, 6);
  shape(ctx, (p) => roundRectPath(p, -W / 2, -MH, W, MH, [2, 2, 3, 3]), { fill: body, ink: 2.4, shadow: shade(body, 0.25), shadowOffset: [-3, -1] });
  steelRect(ctx, -W / 2 + 0.5, -MH - MD + 0.5, W - 1, MD - 1, '#c8ced4', 3);
  line(ctx, [[-W / 2 + 1, -MH], [W / 2 - 1, -MH]], 1.6, INK, false, 0.9);
}

defineSprite({
  id: 'prop.foodcourt.soda',
  w: 124, h: 168, ax: 60, ay: 156,
  draw: (ctx) => {
    const W = 104, MD = 40, MH = 44;
    machineBase(ctx, W, MD, MH, '#2a2f3a');
    const ty = -MH - MD;
    // dispenser tower
    const tw = 84;
    shape(ctx, (p) => roundRectPath(p, -tw / 2, ty - 70, tw, 84, [8, 8, 2, 2]), { fill: '#d23a4a', ink: 2.4, shadow: '#9a2232', shadowOffset: [-3, -2], gloss: [{ x: -26, y: ty - 54, rx: 3, ry: 14, alpha: 0.3 }] });
    // flavour panels
    const flv = ['#ff3fa4', '#3fd0ff', '#b6ff3f', '#ff9a2e'];
    for (let i = 0; i < 4; i++) {
      const fx = -tw / 2 + 8 + i * 18;
      shape(ctx, (p) => roundRectPath(p, fx, ty - 58, 14, 26, 3), { fill: flv[i], ink: 1.2, shadow: shade(flv[i], 0.3), shadowOffset: [-1.5, -1.5], gloss: [{ x: fx + 4, y: ty - 50, rx: 1.4, ry: 5, alpha: 0.6 }] });
      // nozzle
      shape(ctx, (p) => roundRectPath(p, fx + 4, ty - 28, 6, 8, 2), { fill: '#c9cfd4', ink: 1, shadow: 'none' });
    }
    bloom(ctx, 0, ty - 44, 60, '#3fd0ff', 0.2);
    // drip tray + cups
    shape(ctx, (p) => roundRectPath(p, -tw / 2 + 2, ty + 2, tw - 4, 8, 2), { fill: '#3a3f4a', ink: 1.4, shadow: 'none' });
    for (let i = 0; i < 3; i++) {
      const cx = -26 + i * 22;
      shape(ctx, (p) => { p.moveTo(cx - 6, ty - 12); p.lineTo(cx + 6, ty - 12); p.lineTo(cx + 5, ty + 6); p.lineTo(cx - 5, ty + 6); p.closePath(); }, { fill: '#ffffff', ink: 1.1, shadow: '#cfd6dc', shadowOffset: [-1.4, 0] });
      flat(ctx, (p) => p.rect(cx - 5.4, ty - 6, 10.8, 6), flv[i], 0);
    }
    // stack of cups on the side
    for (let k = 0; k < 5; k++) shape(ctx, (p) => roundRectPath(p, W / 2 - 14, ty - 26 + k * 6, 10, 7, 1.5), { fill: '#f4f6f8', ink: 0.9, shadow: 'none' });
    neonText(ctx, 'SODA', 0, ty - 68, 9, '#3ff0ff', { tracking: 1.4 });
    // front panel spill stains
    flat(ctx, (p) => blobPath(p, 20, -18, 8, 3, 0.3, 8, 3), rgba('#ff3fa4', 0.35), 0);
  },
});

function slushDraw(ctx: Ctx, f: number) {
  const W = 104, MD = 40, MH = 44;
  machineBase(ctx, W, MD, MH, '#e6e8ec');
  const ty = -MH - MD;
  const tanks = ['#3fa0ff', '#ff3f6a', '#7aff3f'];
  for (let i = 0; i < 3; i++) {
    const tx = -32 + i * 32;
    // bowl
    const bowl = (p: Ctx) => { p.moveTo(tx - 14, ty - 60); p.lineTo(tx + 14, ty - 60); p.quadraticCurveTo(tx + 16, ty - 20, tx + 12, ty - 8); p.lineTo(tx - 12, ty - 8); p.quadraticCurveTo(tx - 16, ty - 20, tx - 14, ty - 60); p.closePath(); };
    shape(ctx, bowl, { fill: tanks[i], ink: 2, shadow: 'none' });
    clipped(ctx, bowl, () => {
      wash(ctx, lgrad(ctx, tx - 14, 0, tx + 14, 0, [[0, light(tanks[i], 0.4)], [0.5, tanks[i]], [1, shade(tanks[i], 0.3)]]));
      // swirling auger
      for (let k = 0; k < 4; k++) {
        const yy = ty - 52 + k * 11 + ((f * 4) % 11);
        line(ctx, [[tx - 12, yy], [tx, yy + 4], [tx + 12, yy]], 2.2, light(tanks[i], 0.5), true, 0.6);
      }
      wash(ctx, 'rgba(255,255,255,0.12)');
      line(ctx, [[tx - 9, ty - 56], [tx - 10, ty - 14]], 2, '#ffffff', false, 0.55);
    });
    bloom(ctx, tx, ty - 34, 26, tanks[i], 0.25);
    shape(ctx, (p) => roundRectPath(p, tx - 15, ty - 66, 30, 7, 3), { fill: '#3a3f4a', ink: 1.6, shadow: 'none' });
    shape(ctx, (p) => roundRectPath(p, tx - 4, ty - 8, 8, 9, 2), { fill: '#3a3f4a', ink: 1.2, shadow: 'none' });
  }
  neonText(ctx, 'SLUSH', 0, ty - 84, 10, '#ff3fa4', { tracking: 1.4 });
  flat(ctx, (p) => blobPath(p, -18, -14, 7, 2.6, 0.3, 8, 5), rgba('#3fa0ff', 0.35), 0);
}

defineSprite({ id: 'prop.foodcourt.slush', w: 124, h: 182, ax: 60, ay: 168, frames: 3, draw: slushDraw });

// ---------------------------------------------------------------------------
// Breakables + decor: bins, wet-floor sign, plastic plant, boxes
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.foodcourt.bin',
  w: 58, h: 86, ax: 28, ay: 78,
  draw: (ctx) => {
    ao(ctx, 3, -4, 22, 7, 0.55);
    const body = '#5a6a7a';
    shape(ctx, (p) => { p.moveTo(-17, -52); p.lineTo(17, -52); p.lineTo(15, -1); p.quadraticCurveTo(0, 2, -15, -1); p.closePath(); }, { fill: body, ink: 2, shadow: shade(body, 0.3), shadowOffset: [-4, 0], gloss: [{ x: -10, y: -32, rx: 2, ry: 12, alpha: 0.3 }] });
    for (const yy of [-40, -14]) line(ctx, [[-16, yy], [16, yy]], 1.2, shade(body, 0.35), false, 0.9);
    // recycling-ish arrows (generic)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 6.28 - 1.57;
      line(ctx, [[Math.cos(a) * 5, -27 + Math.sin(a) * 5], [Math.cos(a + 1.6) * 5, -27 + Math.sin(a + 1.6) * 5]], 1.4, '#cfe0ea', true, 0.8);
    }
    // swing lid
    shape(ctx, (p) => { p.moveTo(-19, -52); p.quadraticCurveTo(0, -66, 19, -52); p.closePath(); }, { fill: shade(body, 0.08), ink: 2, shadowOffset: [-2, -1.5] });
    flat(ctx, (p) => roundRectPath(p, -9, -58, 18, 4, 2), '#1c2026', 0.6);
    // overflowing trash: cups, fries box, wrapper
    shape(ctx, (p) => { p.moveTo(4, -60); p.lineTo(14, -62); p.lineTo(13, -46); p.lineTo(5, -46); p.closePath(); }, { fill: '#ffffff', ink: 1.1, shadow: '#cfd6dc', shadowOffset: [-1, 0] });
    flat(ctx, (p) => p.rect(5, -56, 8.4, 4), '#ff3fa4', 0);
    line(ctx, [[10, -62], [13, -70]], 1.4, '#3fd0ff');
    shape(ctx, (p) => { p.moveTo(-14, -56); p.lineTo(-4, -60); p.lineTo(-2, -50); p.lineTo(-12, -48); p.closePath(); }, { fill: '#e23a2a', ink: 1.1, shadowOffset: [-1, -1] });
    for (let i = 0; i < 3; i++) line(ctx, [[-11 + i * 3, -58], [-12 + i * 3.4, -64]], 1.3, '#f5d04a');
    shape(ctx, (p) => blobPath(p, 16, -48, 5, 3.4, 0.3, 7, 4), { fill: '#f2e6c8', ink: 1, shadow: 'none' });
  },
});

defineSprite({
  id: 'prop.foodcourt.wet_sign',
  w: 46, h: 66, ax: 22, ay: 58,
  draw: (ctx) => {
    ao(ctx, 2, -3, 18, 5, 0.45);
    const y = '#f7c81e';
    // back leg
    shape(ctx, (p) => { p.moveTo(-10, -50); p.lineTo(4, -50); p.lineTo(12, -2); p.lineTo(4, -2); p.closePath(); }, { fill: shade(y, 0.3), ink: 1.6, shadow: 'none' });
    // front panel
    shape(ctx, (p) => { p.moveTo(-8, -52); p.lineTo(6, -52); p.lineTo(12, 0); p.lineTo(-14, 0); p.closePath(); }, { fill: y, ink: 2, shadow: shade(y, 0.2), shadowOffset: [-2.4, -1], gloss: [{ x: -4, y: -36, rx: 1.6, ry: 8, alpha: 0.4 }] });
    flat(ctx, (p) => roundRectPath(p, -5, -54, 8, 4, 1.5), '#2b2b30', 0.8);
    // warning triangle + slipping figure
    flat(ctx, (p) => { p.moveTo(-1, -44); p.lineTo(7, -31); p.lineTo(-9, -31); p.closePath(); }, '#2b2b30', 0);
    flat(ctx, (p) => { p.moveTo(-1, -41); p.lineTo(5, -32.5); p.lineTo(-7, -32.5); p.closePath(); }, y, 0);
    flat(ctx, (p) => circlePath(p, 0.6, -38, 1.2), '#2b2b30', 0);
    line(ctx, [[0.2, -36.6], [-1.4, -34], [-4, -33.4]], 0.9, '#2b2b30');
    line(ctx, [[-1.4, -34], [1.6, -33]], 0.9, '#2b2b30');
    strokeText(ctx, 'WET', -1, -26, 5.4, '#2b2b30', 1.1);
    strokeText(ctx, 'FLOOR', -1, -18, 4.6, '#2b2b30', 1);
  },
});

defineSprite({
  id: 'prop.foodcourt.plant',
  w: 84, h: 138, ax: 42, ay: 128,
  draw: (ctx) => {
    ao(ctx, 3, -5, 26, 8, 0.5);
    // white plastic cube planter
    shape(ctx, (p) => roundRectPath(p, -22, -38, 44, 38, 3), { fill: '#eef0f2', ink: 2.2, shadow: '#c4cad0', shadowOffset: [-4, -1], gloss: [{ x: -14, y: -24, rx: 2, ry: 10, alpha: 0.5 }] });
    shape(ctx, (p) => roundRectPath(p, -24, -44, 48, 8, 2), { fill: '#f6f8fa', ink: 2, shadowOffset: [-1.5, -1.5] });
    flat(ctx, (p) => ellipsePath(p, 0, -42, 19, 2.6), '#6a5040', 0);
    // fake palm: too-perfect, too-green, slightly dusty fronds
    line(ctx, [[0, -42], [2, -80]], 5, INK);
    line(ctx, [[0, -42], [2, -80]], 3, '#8a6a4a');
    const fronds: [number, number][] = [[-2.6, 38], [-2.0, 42], [-1.3, 40], [-0.6, 34], [-3.0, 30], [0.0, 30], [-1.7, 26]];
    for (const [a, len] of fronds) {
      const ex = 2 + Math.cos(a) * len, ey = -80 + Math.sin(a) * len * 0.8;
      line(ctx, [[2, -80], [(2 + ex) / 2, -86 + Math.sin(a) * len * 0.3], [ex, ey]], 2.4, INK, true);
      for (let k = 1; k < 7; k++) {
        const t = k / 7;
        const px = 2 + (ex - 2) * t, py = -80 + (ey + 80) * t - Math.sin(t * Math.PI) * 6;
        leaf(ctx, px, py, 11 - k * 0.6, a + 1.2, '#36c26a', 0.8, false);
        leaf(ctx, px, py, 11 - k * 0.6, a - 1.2, '#2ea85a', 0.8, false);
      }
    }
    // price tag still attached
    line(ctx, [[10, -60], [16, -50]], 0.8, '#ffffff');
    flat(ctx, (p) => roundRectPath(p, 13, -51, 9, 6, 1), '#ff3fa4', 0.6);
  },
});

defineSprite({
  id: 'prop.foodcourt.boxes',
  w: 74, h: 76, ax: 36, ay: 68,
  draw: (ctx) => {
    ao(ctx, 3, -8, 32, 11, 0.5);
    const card = '#c9a06a';
    const box = (x: number, y: number, w: number, d: number, h: number, label: string) => {
      shape(ctx, (p) => roundRectPath(p, x - w / 2, y - h - d, w, h + d, 1.5), { fill: shade(card, 0.2), ink: 1.8, shadow: 'none' });
      shape(ctx, (p) => p.rect(x - w / 2 + 0.5, y - h, w - 1, h - 0.5), { fill: card, ink: 0, shadow: shade(card, 0.15), shadowOffset: [-2, -1.5] });
      flat(ctx, (p) => p.rect(x - w / 2 + 0.5, y - h - d + 0.5, w - 1, d - 1), light(card, 0.12), 0);
      line(ctx, [[x - w / 2, y - h - d / 2], [x + w / 2, y - h - d / 2]], 2.2, '#d8c49a', false, 0.9);
      strokeText(ctx, label, x, y - h * 0.7, 5.6, '#7a2a2a', 1.1);
      flat(ctx, (p) => roundRectPath(p, x - 7, y - h * 0.38, 14, 6, 1), '#ffffff', 0.6);
    };
    box(-10, 0, 40, 18, 22, 'FROZEN');
    box(12, -6, 36, 16, 20, 'XXL');
    box(-2, -30, 34, 16, 18, 'PIZZA');
  },
});

// ---------------------------------------------------------------------------
// Overhead fluorescent panels (+ glossy floor reflections)
// ---------------------------------------------------------------------------

defineSprite({
  id: 'prop.foodcourt.fluo',
  w: 190, h: 290, ax: 95, ay: 274,
  draw: (ctx) => {
    const y = -150;
    // cold light cone falling to the floor (reads as a ceiling light, keeps action visible)
    ctx.save();
    const cone = ctx.createLinearGradient(0, y, 0, 0);
    cone.addColorStop(0, 'rgba(150,225,255,0.3)');
    cone.addColorStop(1, 'rgba(150,225,255,0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(-60, y + 4);
    ctx.lineTo(60, y + 4);
    ctx.lineTo(80, 0);
    ctx.lineTo(-80, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // long suspension wires up into the dark ceiling
    line(ctx, [[-56, y - 120], [-56, y - 6]], 1.2, '#2a2f3a');
    line(ctx, [[56, y - 120], [56, y - 6]], 1.2, '#2a2f3a');
    bloom(ctx, 0, y, 92, '#9fe6ff', 0.6);
    shape(ctx, (p) => roundRectPath(p, -66, y - 8, 132, 16, 3), { fill: '#c9d2da', ink: 2, shadow: 'none' });
    shape(ctx, (p) => roundRectPath(p, -60, y - 4, 120, 9, 2), { fill: '#f6feff', ink: 1, inkColor: '#8aa0b0', shadow: 'none' });
    // one tube dimmer than the others (sad food court)
    flat(ctx, (p) => roundRectPath(p, 18, y - 3, 40, 7, 2), '#cfe0e8', 0);
    for (let i = -5; i <= 5; i++) line(ctx, [[i * 11, y - 4], [i * 11, y + 5]], 0.6, '#9ab0c0', false, 0.6);
    fadeUp(ctx, y - 30, y - 122);
    fadeAll(ctx, 0.88);
  },
});

defineSprite({
  id: 'prop.foodcourt.fluo_reflection',
  w: 220, h: 90, ax: 110, ay: 45,
  draw: (ctx) => {
    softShape(ctx, (p) => roundRectPath(p, -80, -9, 160, 18, 9), 14, 'rgba(225,248,255,0.4)');
    softShape(ctx, (p) => roundRectPath(p, -60, -3, 120, 6, 3), 4, 'rgba(255,255,255,0.35)');
  },
});

// ---------------------------------------------------------------------------
// Floor decals: spilled soda, ketchup, fries, napkins, tray, receipt, mop streaks
// ---------------------------------------------------------------------------

function spill(ctx: Ctx, col: string, seed: number, withCup: boolean) {
  ctx.save();
  ctx.beginPath();
  splatPath(ctx, 0, 0, 22, seed, 4);
  ctx.fillStyle = rgba(col, 0.45);
  ctx.fill();
  ctx.restore();
  clipped(ctx, (p) => splatPath(p, 0, 0, 22, seed, 0), () => {
    wash(ctx, lgrad(ctx, -20, -16, 20, 16, [[0, 'rgba(255,255,255,0.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.1)']]));
  });
  glint(ctx, -8, -6, 6, 1.6, -0.3, 0.6);
  // ice cubes
  const R = rng(seed);
  for (let i = 0; i < 3; i++) {
    const x = (R() - 0.5) * 24, y = (R() - 0.5) * 14;
    shape(ctx, (p) => roundRectPath(p, x - 2.6, y - 2.2, 5.2, 4.4, 1.2), { fill: 'rgba(235,250,255,0.85)', ink: 0.8, inkColor: '#7a9aaa', shadow: 'none' });
  }
  if (withCup) {
    ctx.save();
    ctx.translate(18, -8);
    ctx.rotate(1.3);
    shape(ctx, (p) => { p.moveTo(-6, -9); p.lineTo(6, -9); p.lineTo(4.6, 9); p.lineTo(-4.6, 9); p.closePath(); }, { fill: '#ffffff', ink: 1.2, shadow: '#cfd6dc', shadowOffset: [-1.4, 0] });
    flat(ctx, (p) => p.rect(-5.4, -3, 10.8, 5), col, 0);
    flat(ctx, (p) => ellipsePath(p, 0, -9, 6, 1.8), '#e8eef2', 0.8);
    ctx.restore();
    line(ctx, [[2, 10], [16, 14]], 1.6, '#ff6a3a');
  }
}

defineSprite({ id: 'prop.foodcourt.spill_blue', w: 80, h: 60, ax: 40, ay: 30, draw: (ctx) => spill(ctx, '#3f8aff', 3, true) });
defineSprite({ id: 'prop.foodcourt.spill_pink', w: 80, h: 60, ax: 40, ay: 30, draw: (ctx) => spill(ctx, '#ff3fa4', 7, true) });
defineSprite({ id: 'prop.foodcourt.spill_cola', w: 80, h: 60, ax: 40, ay: 30, draw: (ctx) => spill(ctx, '#5a2a14', 11, false) });

defineSprite({
  id: 'prop.foodcourt.ketchup',
  w: 64, h: 48, ax: 32, ay: 24,
  draw: (ctx) => {
    ctx.save();
    ctx.beginPath();
    splatPath(ctx, 0, 0, 15, 8, 7);
    ctx.fillStyle = rgba('#e8200e', 0.8);
    ctx.fill();
    ctx.restore();
    glint(ctx, -5, -4, 4, 1.2, -0.4, 0.6);
    // squeezed sachet
    shape(ctx, (p) => roundRectPath(p, 10, 4, 12, 7, 1.5), { fill: '#e23a2a', ink: 1, shadowOffset: [-0.8, -0.8] });
    flat(ctx, (p) => p.rect(13, 5.6, 6, 2.4), '#ffffff', 0);
  },
});

defineSprite({
  id: 'prop.foodcourt.fries',
  w: 70, h: 44, ax: 35, ay: 22,
  draw: (ctx) => {
    const R = rng(4);
    for (let i = 0; i < 9; i++) {
      const x = (R() - 0.5) * 44, y = (R() - 0.5) * 22, a = R() * 3.14;
      softShape(ctx, (p) => roundRectPath(p, x - 5 + 1.5, y - 1.2 + 1.5, 10, 2.4, 1), 1.5, 'rgba(10,20,30,0.25)');
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      shape(ctx, (p) => roundRectPath(p, -6, -1.4, 12, 2.8, 1), { fill: '#f5d04a', ink: 0.8, shadow: '#d8a82a', shadowOffset: [0, -0.8] });
      ctx.restore();
    }
    // empty fries carton
    ctx.save();
    ctx.translate(16, 6);
    ctx.rotate(-0.4);
    shape(ctx, (p) => { p.moveTo(-8, -6); p.lineTo(8, -6); p.lineTo(6, 8); p.lineTo(-6, 8); p.closePath(); }, { fill: '#e23a2a', ink: 1.2, shadowOffset: [-1, -1] });
    flat(ctx, (p) => roundRectPath(p, -3, -1, 6, 5, 1.5), '#f7e04a', 0);
    ctx.restore();
  },
});

defineSprite({
  id: 'prop.foodcourt.napkins',
  w: 60, h: 40, ax: 30, ay: 20,
  draw: (ctx) => {
    const R = rng(9);
    for (let i = 0; i < 4; i++) {
      const x = (R() - 0.5) * 34, y = (R() - 0.5) * 16, a = R() * 6.28;
      softShape(ctx, (p) => ellipsePath(p, x + 2, y + 2, 7, 4), 2, 'rgba(10,20,30,0.2)');
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      shape(ctx, (p) => blobPath(p, 0, 0, 7, 5, 0.3, 7, i + 3), { fill: '#ffffff', ink: 0.9, inkColor: '#8a9aa6', shadow: '#d8e0e6', shadowOffset: [-1, -1] });
      line(ctx, [[-3, -1], [3, 1]], 0.5, '#b8c4cc');
      ctx.restore();
    }
    // receipt
    ctx.save();
    ctx.translate(14, 8);
    ctx.rotate(0.5);
    shape(ctx, (p) => p.rect(-4, -9, 8, 18), { fill: '#f6f4ec', ink: 0.8, inkColor: '#8a8a80', shadow: 'none' });
    for (let k = 0; k < 6; k++) line(ctx, [[-2.6, -7 + k * 2.6], [k % 2 ? 1 : 2.6, -7 + k * 2.6]], 0.5, '#6a6a70');
    ctx.restore();
  },
});

defineSprite({
  id: 'prop.foodcourt.tray_drop',
  w: 70, h: 50, ax: 35, ay: 25,
  draw: (ctx) => {
    softShape(ctx, (p) => roundRectPath(p, -16, -8, 36, 22, 3), 3, 'rgba(10,20,30,0.3)');
    ctx.save();
    ctx.rotate(0.25);
    tray(ctx, 0, 0, '#2f8ac8', 5);
    ctx.restore();
    // squashed burger-pizza crime
    shape(ctx, (p) => ellipsePath(p, 22, 10, 7, 4), { fill: '#d99a4a', ink: 1, shadowOffset: [-0.8, -0.8] });
    flat(ctx, (p) => ellipsePath(p, 22, 11, 7.6, 1.8), '#5a2a14', 0.5);
  },
});

defineSprite({
  id: 'prop.foodcourt.mop_streaks',
  w: 180, h: 80, ax: 90, ay: 40,
  draw: (ctx) => {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(-30 + i * 14, (i % 2) * 6, 56, 18, -0.15, Math.PI * 1.1, Math.PI * 1.9);
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(200,235,250,0.16)';
      ctx.stroke();
    }
    ctx.restore();
    glint(ctx, -20, -8, 14, 2, -0.2, 0.25);
  },
});

defineSprite({
  id: 'prop.foodcourt.pineapple_bits',
  w: 50, h: 36, ax: 25, ay: 18,
  draw: (ctx) => {
    const R = rng(2);
    for (let i = 0; i < 6; i++) {
      const x = (R() - 0.5) * 34, y = (R() - 0.5) * 18;
      shape(ctx, (p) => roundRectPath(p, x - 2.6, y - 2.2, 5.2, 4.4, 1), { fill: '#f7e04a', ink: 0.8, shadow: '#d8b82a', shadowOffset: [-0.6, -0.6] });
    }
    tomato(ctx, 12, 6, 3, 2, 0.7, '#e04a2a');
  },
});

// ---------------------------------------------------------------------------
// Layout — counter rows along "aisles", table grids, machines, bins
// ---------------------------------------------------------------------------

const AREA_BUDGET = CHUNK * CHUNK * 0.1;
const TABLES = ['prop.foodcourt.table_orange', 'prop.foodcourt.table_teal', 'prop.foodcourt.table_red', 'prop.foodcourt.table_yellow'];
const NEON: Record<string, string> = Object.fromEntries(COUNTERS.map((c) => [c.id, c.neon]));

function placeCounter(L: Layout, x: number, fy: number, used: Set<string>): boolean {
  const W = 212, CD = 50;
  const box = { x0: x - W / 2, y0: fy - CD, x1: x + W / 2, y1: fy };
  if (!L.canBlock(box) || L.colliderArea + W * CD > AREA_BUDGET) return false;
  const choices = COUNTERS.filter((c) => !used.has(c.id));
  const def = L.pick(choices.length ? choices : COUNTERS);
  used.add(def.id);
  L.block(box, W * CD);
  L.floor(`prop.foodcourt.glow_${def.id}`, x, fy + 34);
  L.add({
    sprite: `prop.foodcourt.counter_${def.id}`, x, y: fy, collider: rectCol(W, CD, 0, -CD / 2), sortOffset: -CD / 2,
    light: { r: 240, color: NEON[def.id], intensity: 0.85, flicker: 0.08, oy: -60 },
  });
  // a queue of spilled things in front
  if (L.chance(0.6)) L.floor(L.pick(['prop.foodcourt.ketchup', 'prop.foodcourt.fries', 'prop.foodcourt.napkins']), x + L.range(-80, 80), fy + L.range(40, 70));
  return true;
}

function placeMachine(L: Layout, x: number, fy: number): boolean {
  const W = 104, MD = 40;
  const box = { x0: x - W / 2, y0: fy - MD, x1: x + W / 2, y1: fy };
  if (!L.canBlock(box) || L.colliderArea + W * MD > AREA_BUDGET) return false;
  L.block(box, W * MD);
  const slush = L.chance(0.5);
  L.add({
    sprite: slush ? 'prop.foodcourt.slush' : 'prop.foodcourt.soda', x, y: fy, animFps: slush ? 5 : undefined,
    collider: rectCol(W, MD, 0, -MD / 2), sortOffset: -MD / 2,
    light: { r: 160, color: slush ? '#ff3fa4' : '#3ff0ff', intensity: 0.7, flicker: 0.05, oy: -70 },
    fx: slush ? undefined : { kind: 'bubbles', oy: -100, rate: 0.5 },
  });
  L.floor(L.pick(['prop.foodcourt.spill_blue', 'prop.foodcourt.spill_pink', 'prop.foodcourt.spill_cola']), x + L.range(-30, 30), fy + 32);
  return true;
}

function placeTable(L: Layout, x: number, y: number): boolean {
  // footprint: table + chairs ~ 136 × 70 (front-bottom anchor)
  const box = { x0: x - 68, y0: y - 74, x1: x + 68, y1: y };
  if (!L.canBlock(box) || L.colliderArea + 136 * 74 > AREA_BUDGET) return false;
  L.block(box, 136 * 74);
  L.add({ sprite: L.pick(TABLES), x, y, collider: rectCol(136, 74, 0, -37), sortOffset: -37 });
  if (L.chance(0.45)) L.floor(L.pick(['prop.foodcourt.fries', 'prop.foodcourt.napkins', 'prop.foodcourt.tray_drop', 'prop.foodcourt.ketchup', 'prop.foodcourt.pineapple_bits']), x + L.range(-70, 70), y + L.range(24, 50));
  return true;
}

function breakableAt(L: Layout, x: number, y: number): boolean {
  const [sprite, hw, debris, hp] = L.weighted<[string, number, string, number]>([
    [['prop.foodcourt.bin', 20, 'plastic', 2], 3],
    [['prop.foodcourt.wet_sign', 16, 'plastic', 1], 1.6],
    [['prop.foodcourt.boxes', 30, 'wood', 2], 1.2],
  ]);
  const b = { x0: x - hw, y0: y - 34, x1: x + hw, y1: y + 4 };
  if (!L.canSoft(b)) return false;
  L.softBox(b);
  L.add({ sprite, x, y, breakable: { hp, debris } });
  if (sprite === 'prop.foodcourt.wet_sign') L.floor('prop.foodcourt.mop_streaks', x + L.range(-20, 20), y + 20);
  return true;
}

function populateFoodcourt(cx: number, cy: number, rnd: () => number): PropPlacement[] {
  const L = new Layout(cx, cy, CHUNK, rnd);
  const used = new Set<string>();
  // the top band of every other chunk-row is a counter "aisle" (consistent across chunks)
  const counterRow = hash2(0, cy, 404) < 0.55;
  const bands = [L.Y0 + 236 + L.range(-14, 14), L.Y0 + 600 + L.range(-14, 14)];
  bands.forEach((fy, bi) => {
    if (bi === 0 && counterRow) {
      const xs = L.chance(0.5) ? [L.X0 + 220, L.X0 + 586] : [L.X0 + 196, L.X0 + 560];
      if (!placeCounter(L, xs[0] + L.range(-10, 10), fy, used)) {/* spawn area */}
      if (L.chance(0.6)) placeMachine(L, xs[1] + L.range(-10, 30), fy);
      else placeCounter(L, xs[1] + L.range(-10, 10) + 30, fy, used);
    } else {
      // table row: 2 tables per band at a loose 360u spacing
      for (let i = 0; i < 2; i++) {
        if (L.chance(0.14)) continue;
        placeTable(L, L.X0 + 196 + i * 372 + L.range(-14, 14), fy + L.range(-10, 10));
      }
    }
  });
  // overhead fluorescent panels on a loose grid with floor reflections
  for (const [px, py] of [[L.X0 + 192, L.Y0 + 440], [L.X0 + 576, L.Y0 + 440]] as const) {
    if (!L.chance(0.7)) continue;
    const x = px + L.range(-20, 20), y = py + L.range(-20, 20);
    L.floor('prop.foodcourt.fluo_reflection', x, y);
    L.overhead('prop.foodcourt.fluo', x, y, { light: { r: 260, color: '#d8f4ff', intensity: 0.75, flicker: L.chance(0.2) ? 0.5 : 0.04 } });
  }
  // breakables + plants
  for (let i = 0; i < L.int(2, 4); i++) {
    for (let t = 0; t < 8; t++) {
      const [x, y] = L.pt(50);
      if (breakableAt(L, x, y)) break;
    }
  }
  for (let i = 0; i < L.int(0, 2); i++) L.trySoft((x, y) => ({ sprite: 'prop.foodcourt.plant', x, y }), 26, 30);
  // decals
  const nd = L.int(3, 6);
  for (let i = 0; i < nd; i++) {
    L.floor(L.weighted([
      ['prop.foodcourt.spill_blue', 1], ['prop.foodcourt.spill_pink', 1], ['prop.foodcourt.spill_cola', 1], ['prop.foodcourt.ketchup', 0.5],
      ['prop.foodcourt.fries', 1.4], ['prop.foodcourt.napkins', 1.6], ['prop.foodcourt.tray_drop', 0.8], ['prop.foodcourt.pineapple_bits', 0.8], ['prop.foodcourt.mop_streaks', 0.6],
    ]), ...L.pt(40), L.chance(0.5));
  }
  return L.out;
}

registerStageEnv({
  id: 'foodcourt',
  tileSize: TS,
  tile: (tx, ty) => `tile.foodcourt.${pickWeighted(hash2(tx, ty, 29), TILE_W)}`,
  chunkSize: CHUNK,
  populate: populateFoodcourt,
  ambient: { tint: '#eef8ff', darkness: 0.3, darkColor: '#1d1036', vignette: 0.36, particles: 'dust' },
});

