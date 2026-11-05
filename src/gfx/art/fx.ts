/**
 * FX — floor splats & puddles, debris chunks, smoke/steam, sparkles, flames,
 * status overlays. Anchor = centre for everything.
 *
 * Floor decals (splats, puddles, craters, patches) have no ink outline — they
 * are drawn flat on the floor (the engine draws splats at reduced alpha).
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath, line, speckle, glint, rng, rgba,
  shade, light, mix, starPath,
} from '../painter';
import { S, composite, radial, linear, softGlow, sparklePath, tube, CompositeOpts } from './items_kit';
import { flamePath, angerMark, heartPath, basilLeaf } from './items_objects';

function fx(id: string, w: number, h: number, draw: (ctx: Ctx, f: number) => void, o: { frames?: number; res?: number } = {}) {
  defineSprite({ id, w, h, frames: o.frames, res: o.res, draw });
}

function fxc(id: string, w: number, h: number, paint: (ctx: Ctx, f: number) => void, o: CompositeOpts & { frames?: number; res?: number } = {}) {
  defineSprite({
    id,
    w,
    h,
    frames: o.frames,
    res: o.res ?? 3,
    draw: (ctx, f) => composite(ctx, (c) => paint(c, f), o),
  });
}

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  fn();
  ctx.restore();
}

// ===========================================================================
// SAUCE SPLATS — fx.splat.<colour>, 4 shapes each
// ===========================================================================
interface Blob { pts: Pt[]; drops: [number, number, number][] }

function splatShape(seed: number, kind: number, r: number): Blob {
  const R = rng(seed);
  const n = 22;
  const arms: number[] = [];
  const nArms = kind === 2 ? 7 : kind === 1 ? 3 : 5;
  for (let i = 0; i < nArms; i++) arms.push(R() * Math.PI * 2);
  const pts: Pt[] = [];
  const sx = kind === 1 ? 1.35 : 1, sy = kind === 1 ? 0.78 : 1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let k = 0.78 + R() * 0.2;
    for (const am of arms) {
      let d = Math.abs(a - am);
      d = Math.min(d, Math.PI * 2 - d);
      if (d < 0.22) k += (kind === 2 ? 0.75 : 0.45) * (1 - d / 0.22);
    }
    if (kind === 3) k *= 0.85 + 0.25 * Math.cos(a * 2 + 0.5);
    pts.push([Math.cos(a) * r * k * sx, Math.sin(a) * r * k * sy]);
  }
  const drops: [number, number, number][] = [];
  for (const am of arms) {
    const d = r * (kind === 2 ? 1.75 : 1.45) + R() * r * 0.25;
    drops.push([Math.cos(am) * d * sx, Math.sin(am) * d * sy, r * (0.09 + R() * 0.07)]);
    if (R() < 0.6) {
      const d2 = d + r * (0.22 + R() * 0.2);
      drops.push([Math.cos(am + (R() - 0.5) * 0.2) * d2 * sx, Math.sin(am) * d2 * sy, r * (0.05 + R() * 0.04)]);
    }
  }
  for (let i = 0; i < 5; i++) {
    const a = R() * Math.PI * 2, d = r * (1.1 + R() * 0.6);
    drops.push([Math.cos(a) * d * sx, Math.sin(a) * d * sy, r * (0.04 + R() * 0.06)]);
  }
  if (kind === 1) {
    // directional splash: trailing droplets to the right
    for (let i = 0; i < 4; i++) drops.push([r * (1.5 + i * 0.32), (R() - 0.5) * r * 0.4, r * (0.11 - i * 0.02)]);
  }
  if (kind === 3) {
    // secondary blob
    drops.push([r * 0.95, r * 0.55, r * 0.34]);
  }
  return { pts, drops };
}

function drawSplat(ctx: Ctx, base: string, seed: number, kind: number, r = 15, halfW = 28, halfH = 26) {
  const raw = splatShape(seed, kind, r);
  // centre the art and fit it inside the box (drops included)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of raw.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (const [x, y, rr] of raw.drops) { x0 = Math.min(x0, x - rr); y0 = Math.min(y0, y - rr); x1 = Math.max(x1, x + rr); y1 = Math.max(y1, y + rr); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const k = Math.min(1, (halfW - 1.5) / ((x1 - x0) / 2), (halfH - 1.5) / ((y1 - y0) / 2));
  const pts = raw.pts.map(([x, y]) => [(x - cx) * k, (y - cy) * k] as Pt);
  const drops = raw.drops.map(([x, y, rr]) => [(x - cx) * k, (y - cy) * k, rr * k] as [number, number, number]);
  r *= k;
  const edge = shade(base, 0.28);
  const build = (c: Ctx) => {
    smoothPath(c, pts, true, 0.55);
    for (const [x, y, rr] of drops) circlePath(c, x, y, rr);
  };
  // body
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = base;
  ctx.fill();
  // darker dried rim (inner edge) + lighter wet centre
  ctx.clip();
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = rgba(edge, 0.75);
  ctx.stroke();
  ctx.fillStyle = radial(ctx, -r * 0.15, -r * 0.2, r * 0.9, [[0, rgba(light(base, 0.18), 0.85)], [1, rgba(base, 0)]]);
  ctx.fillRect(-r * 3, -r * 3, r * 6, r * 6);
  ctx.restore();
  // crisp outer edge
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = Math.max(0.6, r * 0.06);
  ctx.strokeStyle = rgba(shade(base, 0.42), 0.9);
  ctx.stroke();
  ctx.restore();
  // a couple of soft gloss spots
  glint(ctx, -r * 0.35, -r * 0.35, r * 0.22, r * 0.1, -0.6, 0.45);
  glint(ctx, r * 0.2, -r * 0.05, r * 0.08, r * 0.05, -0.6, 0.35);
  for (const [x, y, rr] of drops.slice(0, 3)) glint(ctx, x - rr * 0.3, y - rr * 0.35, rr * 0.35, rr * 0.2, -0.6, 0.45);
}

const SPLATS: Record<string, string> = {
  red: '#c9281f',
  cream: '#f1e0b2',
  yellow: '#f0bf2c',
  green: '#5aa63a',
  brown: '#7a4a2a',
  orange: '#ec7622',
  pink: '#e98aa2',
};

for (const [name, col] of Object.entries(SPLATS)) {
  fx(`fx.splat.${name}`, 60, 56, (ctx, f) => drawSplat(ctx, col, 101 + f * 17 + name.length * 3, f, 16, 30, 28), { frames: 4 });
}

// ===========================================================================
// DEBRIS CHUNKS — fx.chunk.<kind>, 4 variants each (~8–10u)
// ===========================================================================
type ChunkPainter = (ctx: Ctx, f: number) => void;

const CHUNK_INK = 0.9;

const chunks: Record<string, ChunkPainter> = {
  pineapple: (ctx, f) => {
    if (f === 3) {
      // spiky leaf bit
      rot(ctx, 0, 0, -0.5, () => {
        S(ctx, (c) => polyPath(c, [[-5, 1.5], [5, -1.2], [-4, -1.2]]), { fill: '#5fae3a', ink: CHUNK_INK, shadow: '#3c7a2a', shadowOffset: [-0.4, -0.6] });
        line(ctx, [[-4, 0.2], [3.5, -1]], 0.4, '#a8e07a', false, 0.9);
      });
      return;
    }
    const shapes: Pt[][] = [
      [[-4.5, -3], [4.5, -2], [2.5, 4], [-3.5, 3.5]],
      [[-4, -4], [4, -3.6], [4.4, 3.6], [-4.2, 4]],
      [[-5, 2], [-1, -4.5], [5, -1], [3, 4]],
    ];
    const p = shapes[f];
    S(ctx, (c) => polyPath(c, p), { fill: radial(ctx, -1, -1.5, 6, [[0, '#fff3a0'], [0.6, '#ffd23a'], [1, '#e9a515']]), ink: CHUNK_INK, shadow: '#d18c10', shadowOffset: [-0.7, -0.8] });
    // brown "eye" skin edge on one side
    if (f !== 1) line(ctx, [p[2], p[3]], 1.4, '#a8722a', false, 0.9);
    line(ctx, [[-2.5, -1], [2.5, -0.3]], 0.35, '#e09a12', false, 0.8);
    line(ctx, [[-2, 1.2], [1.8, 1.6]], 0.35, '#e09a12', false, 0.8);
  },
  tomato: (ctx, f) => {
    if (f === 3) {
      // seeds in gel
      S(ctx, (c) => ellipsePath(c, 0, 0, 4.4, 3.2, 0.4), { fill: rgba('#f6a08a', 0.95), ink: CHUNK_INK, shadow: 'none' });
      for (const [x, y] of [[-1.6, -0.6], [0.4, 0.8], [1.8, -0.8]] as Pt[]) S(ctx, (c) => ellipsePath(c, x, y, 0.9, 0.6, 0.4), { fill: '#f7e08a', ink: 0.4, shadow: 'none' });
      return;
    }
    const k = [1, 0.8, 1.1][f];
    rot(ctx, 0, 0, f * 1.7, () => {
      // curved skin fragment with pale flesh
      const frag = (c: Ctx) => {
        c.moveTo(-5 * k, 1.5);
        c.quadraticCurveTo(0, -6 * k, 5 * k, 1.5);
        c.quadraticCurveTo(0, -1.5 * k, -5 * k, 1.5);
        c.closePath();
      };
      S(ctx, frag, { fill: '#e2352a', ink: CHUNK_INK, shadow: '#a81f24', shadowOffset: [-0.6, -0.8], gloss: [{ x: -1.5, y: -2.6 * k, rx: 1.4, ry: 0.6, rot: -0.3, alpha: 0.85 }] });
      S(ctx, (c) => {
        c.moveTo(-3.8 * k, 1.2);
        c.quadraticCurveTo(0, -1.2 * k, 3.8 * k, 1.2);
        c.quadraticCurveTo(0, 0, -3.8 * k, 1.2);
        c.closePath();
      }, { fill: '#f6a08a', ink: 0, shadow: 'none' });
    });
  },
  wood: (ctx, f) => {
    const L = [10, 8, 9, 7][f];
    rot(ctx, 0, 0, [-0.4, 0.6, 1.4, -1.1][f], () => {
      S(ctx, (c) => polyPath(c, [[-L / 2, -1.2], [L * 0.2, -1.6], [L / 2, -0.2], [L * 0.1, 1.5], [-L / 2 + 0.6, 1.2]]), {
        fill: ['#c98a4a', '#b9773a', '#d9a060', '#a86a34'][f], ink: CHUNK_INK, shadow: '#7a4a24', shadowOffset: [-0.3, -0.6],
      });
      line(ctx, [[-L / 2 + 1, -0.2], [L / 2 - 1.5, -0.4]], 0.35, '#7a4a24', false, 0.75);
      line(ctx, [[-L / 2 + 2, 0.6], [L * 0.1, 0.5]], 0.3, '#f3cf94', false, 0.8);
    });
  },
  glass: (ctx, f) => {
    const shapes: Pt[][] = [
      [[-4, -3.5], [4.5, -1], [-1, 4.5]],
      [[-3, -4.5], [3.5, -3], [2, 4], [-3.5, 2]],
      [[-5, 0], [0, -3.5], [5, 1], [1, 2.5]],
      [[-2.5, -4.5], [2.5, -2], [0, 4.5]],
    ];
    const p = shapes[f];
    S(ctx, (c) => polyPath(c, p), { fill: rgba('#bfe9f2', 0.8), ink: 0.8, inkColor: '#3a6a7a', shadow: 'none' });
    line(ctx, [p[0], p[1]], 0.7, '#ffffff', false, 0.95);
    glint(ctx, (p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2 + 1, 0.9, 0.4, -0.5, 0.9);
  },
  plastic: (ctx, f) => {
    const cols = ['#e2363a', '#ffd23a', '#f4f4f4', '#3f9ae6'];
    const shapes: Pt[][] = [
      [[-4.5, -2], [4, -3], [4.5, 2.5], [-3.5, 3]],
      [[-3.5, -3.5], [3.5, -3], [1.5, 3.5], [-4, 2]],
      [[-5, -1], [3, -3.5], [5, 1.5], [-2, 3]],
      [[-3, -4], [4.5, -1.5], [2, 4], [-4, 1]],
    ];
    S(ctx, (c) => polyPath(c, shapes[f]), { fill: cols[f], ink: CHUNK_INK, shadow: shade(cols[f], 0.25), shadowOffset: [-0.6, -0.7], gloss: [{ x: -1.2, y: -1.4, rx: 1.4, ry: 0.5, rot: -0.3, alpha: 0.8 }] });
    if (f === 2) line(ctx, [[-3.5, 0.5], [3.5, -1.5]], 0.8, '#e2363a', false, 0.9);
  },
  straw: (ctx, f) => {
    const n = f + 1;
    for (let i = 0; i < Math.min(3, n); i++) {
      const a = -0.5 + i * 0.5 + f * 0.3;
      rot(ctx, (i - 1) * 1.2, (i - 1) * 0.8, a, () => {
        tube(ctx, [[-4.6, 0], [4.6, 0]], 1.2, i % 2 ? '#f0c95a' : '#e3b048', 0.7, false, '#fff3c0', 0.8);
      });
    }
    if (f === 3) rot(ctx, 1, -1, 1.3, () => tube(ctx, [[-3.6, 0], [3.6, 0]], 1.1, '#d9a040', 0.7, false));
  },
  cheese: (ctx, f) => {
    if (f === 3) {
      // grated strands
      for (let i = 0; i < 3; i++) rot(ctx, (i - 1) * 2, (i - 1) * 1.2, -0.4 + i * 0.6, () => S(ctx, (c) => roundRectPath(c, -3, -0.6, 6, 1.2, 0.6), { fill: '#f6d26a', ink: 0.7, shadow: 'none' }));
      return;
    }
    const shapes: Pt[][] = [
      [[-4, 2.5], [-3, -3], [4, -2], [3.5, 3]],
      [[-4.5, 1], [0, -4], [4.5, 1.5], [0, 3.5]],
      [[-4, -1], [1, -3.5], [4, 2], [-2, 3.5]],
    ];
    S(ctx, (c) => polyPath(c, shapes[f]), { fill: radial(ctx, -1, -1, 6, [[0, '#fff3c0'], [1, '#f2c85a']]), ink: CHUNK_INK, shadow: '#d9a440', shadowOffset: [-0.7, -0.8] });
    speckle(ctx, 0, 0.5, 2.5, 1.6, 3, '#ffffff', 0.4, 3 + f, 0.9);
    if (f === 0) line(ctx, [[-3, -3], [4, -2]], 1.1, '#d79a3a', false, 0.9);
  },
  bread: (ctx, f) => {
    const shapes: Pt[][] = [
      [[-4.5, -1.5], [-1, -4], [4.5, -2], [4, 3], [-3.5, 3]],
      [[-4, -3], [4, -3.5], [3, 3.5], [-4.5, 2]],
      [[-5, 0], [-2, -3.5], [3.5, -3], [5, 1.5], [0, 3.5]],
      [[-3.5, -3.5], [3.5, -2.5], [2.5, 3.5], [-3, 3]],
    ];
    const p = shapes[f];
    S(ctx, (c) => polyPath(c, p), { fill: '#f6e2b0', ink: CHUNK_INK, shadow: '#dcc08a', shadowOffset: [-0.5, -0.5] });
    // crust on the top edges
    line(ctx, p.slice(0, 3), 2, '#c27a32', false);
    line(ctx, p.slice(0, 3), 0.6, '#e8a856', false);
    speckle(ctx, 0, 1.4, 2.4, 1.2, 4, '#d8b878', 0.4, 5 + f, 0.9);
  },
};

for (const [name, painter] of Object.entries(chunks)) {
  fxc(`fx.chunk.${name}`, 14, 14, painter, { frames: 4, res: 3, edge: '#fffbea', edgeW: 0.5, edgeA: 0.35 });
}

// ===========================================================================
// SMOKE, STEAM, SPARKS
// ===========================================================================
function puffCluster(ctx: Ctx, r: number, seed: number, light0: string, mid: string, dark: string, alpha = 1) {
  const R = rng(seed);
  const blobs: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + R() * 0.4;
    blobs.push([Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.38, r * (0.42 + R() * 0.15)]);
  }
  blobs.push([0, -r * 0.05, r * 0.58]);
  ctx.save();
  ctx.globalAlpha = alpha;
  // shadow body (offset down-right)
  ctx.fillStyle = dark;
  ctx.beginPath();
  for (const [x, y, rr] of blobs) circlePath(ctx, x + r * 0.05, y + r * 0.07, rr);
  ctx.fill();
  ctx.fillStyle = mid;
  ctx.beginPath();
  for (const [x, y, rr] of blobs) circlePath(ctx, x - r * 0.02, y - r * 0.02, rr * 0.96);
  ctx.fill();
  // lit tops
  ctx.fillStyle = light0;
  ctx.beginPath();
  for (const [x, y, rr] of blobs) circlePath(ctx, x - rr * 0.22, y - rr * 0.26, rr * 0.62);
  ctx.fill();
  ctx.restore();
}

fx('fx.puff', 40, 40, (ctx) => {
  puffCluster(ctx, 19, 5, '#ffffff', '#f1eef3', '#c9c3cf');
}, { res: 2 });

fx('fx.steam', 22, 34, (ctx) => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push([Math.sin(t * Math.PI * 1.6) * 4.2 * (1 - t * 0.3), 13 - t * 27]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    ctx.save();
    ctx.globalAlpha = 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.1));
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5.5 * (1 - t * 0.55);
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    ctx.stroke();
    ctx.restore();
  }
  // brighter core
  ctx.save();
  ctx.globalAlpha = 0.8;
  line(ctx, pts.slice(1, 9).map(([x, y]) => [x - 0.6, y] as Pt), 1.4, '#ffffff', true, 0.9);
  ctx.restore();
}, { res: 2 });

fx('fx.spark', 16, 16, (ctx) => {
  softGlow(ctx, 0, 0, 7.5, '#ffe27a', 0.9);
  ctx.save();
  ctx.beginPath();
  sparklePath(ctx, 0, 0, 6.5, 0.12);
  ctx.fillStyle = '#fffbe8';
  ctx.fill();
  ctx.beginPath();
  sparklePath(ctx, 0, 0, 3.2, 0.2, Math.PI / 4);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
}, { res: 3 });

fxc('fx.star', 20, 20, (ctx) => {
  S(ctx, (c) => starPath(c, 0, 0.6, 8, 3.6, 5), {
    fill: radial(ctx, -2, -2, 9, [[0, '#fff6b8'], [0.5, '#ffd23a'], [1, '#e8930f']]),
    ink: 1.1, shadow: '#cf7d10', shadowOffset: [-1, -1.1],
    gloss: [{ x: -1.6, y: -2, rx: 1.4, ry: 0.8, rot: -0.6, alpha: 0.9 }],
  });
}, { res: 3, edge: '#fffbea', edgeW: 0.6, edgeA: 0.5 });

fxc('fx.heart', 16, 16, (ctx) => {
  S(ctx, (c) => heartPath(c, 0, 0.3, 6), {
    fill: radial(ctx, -2, -2, 8, [[0, '#ff8a96'], [0.5, '#ec2f45'], [1, '#b0182c']]),
    ink: 1.1, shadow: '#a8142a', shadowOffset: [-0.9, -1],
    gloss: [{ x: -2.8, y: -2.3, rx: 1.5, ry: 0.9, rot: -0.7, alpha: 0.95 }],
  });
}, { res: 3, edge: '#fffbea', edgeW: 0.6, edgeA: 0.5 });

// ===========================================================================
// FIRE
// ===========================================================================
/** A flame without heavy ink (FX version) — dark-red rim for readability. */
function fxFlame(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, lean = 0, rim = 1) {
  ctx.save();
  ctx.beginPath();
  flamePath(ctx, x, y, w, h, seed, lean);
  ctx.lineWidth = rim * 2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#8a1a10';
  ctx.stroke();
  ctx.fillStyle = '#ee3b24';
  ctx.fill();
  ctx.fillStyle = '#ff8d26';
  ctx.beginPath();
  flamePath(ctx, x + w * 0.04, y - h * 0.02, w * 0.74, h * 0.78, seed + 1, lean);
  ctx.fill();
  ctx.fillStyle = '#ffd34a';
  ctx.beginPath();
  flamePath(ctx, x + w * 0.06, y - h * 0.03, w * 0.48, h * 0.55, seed + 2, lean * 0.8);
  ctx.fill();
  ctx.fillStyle = '#fff6cf';
  ctx.beginPath();
  ellipsePath(ctx, x + w * 0.05, y - h * 0.15, w * 0.22, h * 0.14);
  ctx.fill();
  ctx.restore();
}

fx('fx.flame', 28, 36, (ctx, f) => {
  const lean = [0, 0.08, -0.04, 0.1][f];
  const hh = [25, 27, 24, 26.5][f];
  softGlow(ctx, 0, 4, 13, '#ff7a1a', 0.45, 10);
  fxFlame(ctx, 0, 12, 9.5, hh, 3 + f * 5, lean, 0.9);
}, { frames: 4, res: 2.5 });

fx('fx.fire_patch', 76, 70, (ctx, f) => {
  // scorched ground
  ctx.save();
  ctx.fillStyle = radial(ctx, 0, 6, 34, [[0, 'rgba(30,14,10,0.85)'], [0.6, 'rgba(50,22,14,0.6)'], [1, 'rgba(50,22,14,0)']]);
  ctx.beginPath();
  ellipsePath(ctx, 0, 6, 34, 21);
  ctx.fill();
  ctx.restore();
  softGlow(ctx, 0, 4, 30, '#ff6a1a', 0.55, 18);
  // embers
  const R = rng(40 + f);
  for (let i = 0; i < 14; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R());
    ctx.fillStyle = i % 3 ? '#ffb43a' : '#ff6a1a';
    ctx.beginPath();
    ellipsePath(ctx, Math.cos(a) * d * 26, 6 + Math.sin(a) * d * 15, 0.8 + R() * 0.9, 0.5 + R() * 0.5);
    ctx.fill();
  }
  // flames standing on the patch (back to front)
  const spots: [number, number, number][] = [[-14, -1, 0.8], [10, -2, 0.85], [-2, 2, 1.1], [-22, 7, 0.7], [20, 8, 0.75], [4, 11, 0.9], [-10, 12, 0.7]];
  spots.forEach(([x, y, s], i) => {
    const flick = [1, 0.85, 1.12, 0.93][(f + i) % 4];
    fxFlame(ctx, x, y, 7 * s, 22 * s * flick, 10 + i * 7 + f * 3, ((f + i) % 2 ? 0.08 : -0.06), 0.8);
  });
}, { frames: 4, res: 2 });

// ===========================================================================
// PUDDLES
// ===========================================================================
function puddlePts(rx: number, ry: number, seed: number, n = 14, wob = 0.16): Pt[] {
  const R = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (R() * 2 - 1) * wob;
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  return pts;
}

function puddle(ctx: Ctx, rx: number, ry: number, seed: number, o: { base: string; alpha?: number; rim?: string; glossA?: number; satellites?: number }) {
  const pts = puddlePts(rx, ry, seed);
  const R = rng(seed + 5);
  const sats: [number, number, number, number][] = [];
  for (let i = 0; i < (o.satellites ?? 3); i++) {
    const a = R() * Math.PI * 2;
    sats.push([Math.cos(a) * rx * (0.98 + R() * 0.08), Math.sin(a) * ry * (0.98 + R() * 0.08), rx * (0.08 + R() * 0.06), ry * (0.09 + R() * 0.06)]);
  }
  const build = (c: Ctx) => {
    smoothPath(c, pts, true, 0.6);
    for (const [x, y, a, b] of sats) ellipsePath(c, x, y, a, b);
  };
  const al = o.alpha ?? 1;
  ctx.save();
  ctx.globalAlpha = al;
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = o.base;
  ctx.fill();
  // soft lighter pool in the middle, darker thick rim (flat toon liquid)
  ctx.clip();
  ctx.fillStyle = radial(ctx, -rx * 0.1, -ry * 0.15, Math.max(rx, ry) * 0.8, [[0, rgba(light(o.base, 0.22), 0.9)], [1, rgba(o.base, 0)]]);
  ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4);
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = Math.min(rx, ry) * 0.32;
  ctx.strokeStyle = rgba(shade(o.base, 0.22), 0.6);
  ctx.stroke();
  ctx.restore();
  // crisp edge
  ctx.save();
  ctx.globalAlpha = al;
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = Math.max(0.8, rx * 0.035);
  ctx.strokeStyle = o.rim ?? shade(o.base, 0.4);
  ctx.stroke();
  ctx.restore();
  // contour highlight stroke (upper-left) + a few glints
  const ga = o.glossA ?? 0.7;
  ctx.save();
  ctx.globalAlpha = ga;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, ry * 0.09);
  ctx.beginPath();
  ctx.ellipse(-rx * 0.04, -ry * 0.02, rx * 0.72, ry * 0.66, 0, Math.PI * 1.05, Math.PI * 1.42);
  ctx.stroke();
  ctx.lineWidth = Math.max(0.7, ry * 0.06);
  ctx.beginPath();
  ctx.ellipse(-rx * 0.04, -ry * 0.02, rx * 0.72, ry * 0.66, 0, Math.PI * 1.5, Math.PI * 1.58);
  ctx.stroke();
  ctx.restore();
  glint(ctx, rx * 0.42, ry * 0.32, rx * 0.08, ry * 0.05, -0.2, ga * 0.55);
}

fx('fx.oil_slick', 66, 48, (ctx) => {
  puddle(ctx, 27, 17, 7, { base: '#f0b92a', alpha: 0.72, rim: '#b8800e', glossA: 0.95, satellites: 3 });
  // olive-green tint pooling at one side + iridescent sheen
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#b8b030';
  ctx.beginPath();
  ellipsePath(ctx, 8, 5, 13, 7, 0.2);
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = linear(ctx, -20, 0, 20, 0, [[0, '#b8f0a0'], [0.5, '#fff8b0'], [1, '#ffc080']]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(3, 3, 16, 9, 0.12, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.restore();
  glint(ctx, -8, -6, 7, 1.6, -0.12, 0.85);
  glint(ctx, 2, -9, 2.2, 0.9, -0.12, 0.7);
}, { res: 2 });

fx('fx.pesto', 66, 48, (ctx) => {
  puddle(ctx, 27, 17, 11, { base: '#4fa82e', rim: '#2a6a1c', glossA: 0.6, satellites: 4 });
  // texture: ground basil + pine nuts + oil pools
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, 0, 0, 25, 16);
  ctx.clip();
  speckle(ctx, 0, 0, 23, 14, 60, '#2e7a1e', 0.9, 4, 0.7);
  speckle(ctx, 0, 0, 23, 14, 30, '#8fd85a', 0.7, 5, 0.7);
  ctx.restore();
  for (const [x, y, a] of [[-9, -3, 0.4], [6, 5, -0.6], [13, -4, 1.2], [-3, 8, 0.1]] as [number, number, number][]) {
    S(ctx, (c) => ellipsePath(c, x, y, 2.2, 1.2, a), { fill: '#f6e2a8', ink: 0.7, inkColor: '#8a6a3a', shadow: 'none' });
  }
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#e8d84a';
  ctx.beginPath();
  ellipsePath(ctx, -12, 5, 4, 2);
  ellipsePath(ctx, 10, -8, 3, 1.5);
  ctx.fill();
  ctx.restore();
  rot(ctx, 1, -2, -0.4, () => basilLeaf(ctx, 9, { ink: 0.8 }));
}, { res: 2 });

fx('fx.cream_puddle', 76, 56, (ctx) => {
  puddle(ctx, 31, 20, 23, { base: '#f6e7bc', rim: '#b8944a', glossA: 0.95, satellites: 4 });
  // swirls + pancetta + pepper (carbonara crime!)
  ctx.save();
  ctx.strokeStyle = rgba('#dcc48a', 0.7);
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(2, 2, 14, 7, 0.1, 0.3, Math.PI * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-4, -2, 7, 3.5, 0.1, Math.PI * 0.9, Math.PI * 2.1);
  ctx.stroke();
  ctx.restore();
  for (const [x, y, a] of [[-14, 4, 0.3], [9, -7, -0.5], [16, 6, 1.1], [-2, 10, 0.8]] as [number, number, number][]) {
    rot(ctx, x, y, a, () => {
      S(ctx, (c) => roundRectPath(c, -2.4, -1.4, 4.8, 2.8, 0.8), { fill: '#f08e8a', ink: 0.7, inkColor: '#7a2a24', shadow: '#c0605e', shadowOffset: [-0.3, -0.4] });
      line(ctx, [[-1.8, 0], [1.8, 0]], 0.6, '#fff0ea', false, 0.85);
    });
  }
  speckle(ctx, 0, 0, 24, 14, 22, '#3a2a22', 0.38, 7, 0.85);
}, { res: 2 });

fx('fx.ketchup_puddle', 66, 48, (ctx) => {
  puddle(ctx, 27, 17, 31, { base: '#d0261f', rim: '#6e0e10', glossA: 0.8, satellites: 4 });
  // a few thicker blobs (ketchup is gloopy)
  for (const [x, y, r] of [[-9, 4, 4], [7, -3, 3.2], [13, 6, 2.4]] as [number, number, number][]) {
    ctx.save();
    ctx.fillStyle = '#b81c1a';
    ctx.beginPath();
    ellipsePath(ctx, x, y, r, r * 0.6);
    ctx.fill();
    ctx.restore();
    glint(ctx, x - r * 0.3, y - r * 0.25, r * 0.4, r * 0.15, -0.1, 0.7);
  }
}, { res: 2 });

// ===========================================================================
// COFFEE CLOUD — moka explosion, 4 expanding frames
// ===========================================================================
fx('fx.coffee_cloud', 80, 80, (ctx, f) => {
  const t = f / 3;
  const r = 16 + t * 18;
  const a = 1 - t * 0.45;
  // dark coffee core fades as it expands
  softGlow(ctx, 0, 0, r * 1.15, '#7a4a2a', 0.35 * a);
  const R = rng(70 + f);
  const n = 7 + f * 2;
  const blobs: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + R() * 0.4;
    const d = r * (0.45 + t * 0.35) * (0.8 + R() * 0.3);
    blobs.push([Math.cos(ang) * d, Math.sin(ang) * d * 0.9, r * (0.42 - t * 0.12) * (0.8 + R() * 0.4)]);
  }
  if (f < 3) blobs.push([0, 0, r * 0.55]);
  ctx.save();
  ctx.globalAlpha = a;
  // shadow (coffee brown)
  ctx.fillStyle = mix('#7a4a2a', '#c9a27a', t);
  ctx.beginPath();
  for (const [x, y, rr] of blobs) circlePath(ctx, x + rr * 0.1, y + rr * 0.12, rr);
  ctx.fill();
  // body (crema)
  ctx.fillStyle = mix('#c9894a', '#e8d2b0', t);
  ctx.beginPath();
  for (const [x, y, rr] of blobs) circlePath(ctx, x - rr * 0.03, y - rr * 0.03, rr * 0.93);
  ctx.fill();
  // highlights (milky foam)
  ctx.fillStyle = mix('#f2d2a6', '#fff6e8', t);
  ctx.beginPath();
  for (const [x, y, rr] of blobs) circlePath(ctx, x - rr * 0.25, y - rr * 0.28, rr * 0.55);
  ctx.fill();
  ctx.restore();
  if (f >= 2) {
    // hollow centre as the ring dissipates
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = radial(ctx, 0, 0, r * 0.7, [[0, `rgba(0,0,0,${f === 3 ? 0.75 : 0.4})`], [1, 'rgba(0,0,0,0)']]);
    ctx.beginPath();
    circlePath(ctx, 0, 0, r * 0.7);
    ctx.fill();
    ctx.restore();
  }
  // flying coffee droplets / grounds
  for (let i = 0; i < 6 + f * 2; i++) {
    const ang = R() * Math.PI * 2, d = r * (0.9 + R() * 0.35);
    ctx.fillStyle = i % 2 ? '#4a2412' : '#7a4a2a';
    ctx.globalAlpha = a;
    ctx.beginPath();
    ellipsePath(ctx, Math.cos(ang) * d, Math.sin(ang) * d, 1.2 + R(), 0.8 + R() * 0.5, ang);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}, { frames: 4, res: 2 });

// ===========================================================================
// LAVA CRATER — 2 frames (hot, cooling)
// ===========================================================================
fx('fx.lava_crater', 64, 50, (ctx, f) => {
  const hot = f === 0 ? 1 : 0.45;
  // scorched surroundings
  ctx.save();
  ctx.fillStyle = radial(ctx, 0, 0, 30, [[0, 'rgba(25,12,10,0.9)'], [0.65, 'rgba(45,22,16,0.7)'], [1, 'rgba(45,22,16,0)']]);
  ctx.beginPath();
  ellipsePath(ctx, 0, 0, 30, 21);
  ctx.fill();
  ctx.restore();
  // crater rim (rocky ring)
  const rim = puddlePts(19, 12.5, 61, 16, 0.12);
  S(ctx, (c) => smoothPath(c, rim, true, 0.5), { fill: '#5a3a30', ink: 1.4, shadow: '#3a2420', shadowOffset: [1.2, 1.4] });
  // molten pool
  const pool = puddlePts(14, 8.5, 62, 12, 0.14);
  softGlow(ctx, 0, 0, 24, '#ff6a1a', 0.6 * hot, 16);
  S(ctx, (c) => smoothPath(c, pool, true, 0.6), {
    fill: radial(ctx, -2, -1, 15, f === 0 ? [[0, '#fff3a0'], [0.35, '#ffb02e'], [0.8, '#f05a1a'], [1, '#a8301a']] : [[0, '#ffb04a'], [0.5, '#c8461a'], [1, '#5a2418']]),
    ink: 1.1, inkColor: '#3a1a10', shadow: 'none',
  });
  // crust plates floating
  ctx.save();
  ctx.beginPath();
  smoothPath(ctx, pool, true, 0.6);
  ctx.clip();
  ctx.fillStyle = f === 0 ? 'rgba(80,30,20,0.55)' : 'rgba(60,26,20,0.8)';
  for (const [x, y, a, b] of [[-6, 2, 4, 2.4], [5, -2, 3.4, 2], [8, 4, 2.4, 1.4]] as [number, number, number, number][]) {
    ctx.beginPath();
    ellipsePath(ctx, x, y, a * (f === 0 ? 1 : 1.6), b * (f === 0 ? 1 : 1.6), 0.3);
    ctx.fill();
  }
  ctx.restore();
  // glowing cracks radiating out
  const R = rng(63);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + R() * 0.4;
    const p: Pt[] = [[Math.cos(a) * 15, Math.sin(a) * 10]];
    let x = p[0][0], y = p[0][1];
    for (let k = 0; k < 2; k++) {
      x += Math.cos(a + (R() - 0.5) * 0.8) * (4 + R() * 3);
      y += Math.sin(a + (R() - 0.5) * 0.8) * (3 + R() * 2);
      p.push([x, y]);
    }
    line(ctx, p, 1.6, rgba('#ff5a1a', 0.6 * hot), false);
    line(ctx, p, 0.7, f === 0 ? '#ffd76a' : '#e0661e', false, hot);
  }
  if (f === 0) glint(ctx, -4, -2.5, 3.4, 1.2, -0.1, 0.75);
}, { frames: 2, res: 2 });

// ===========================================================================
// CONFETTI, FEATHER, ICE, NOTE, ANGER, SWEAT
// ===========================================================================
fx('fx.confetti', 10, 10, (ctx, f) => {
  const cols = ['#2f9a52', '#fbf6ea', '#dc3439', '#2f9a52', '#fbf6ea', '#dc3439'];
  const col = cols[f];
  const edge = col === '#fbf6ea' ? '#9a9aa8' : shade(col, 0.4);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = edge;
  ctx.fillStyle = col;
  ctx.beginPath();
  if (f < 3) {
    ctx.rotate([0.4, -0.7, 1.1][f]);
    roundRectPath(ctx, -3.2, -1.5, 6.4, 3, 0.4);
  } else if (f === 3) {
    // curl
    ctx.moveTo(-3, 1.5);
    ctx.quadraticCurveTo(-1, -3.5, 1, 0);
    ctx.quadraticCurveTo(2.5, 3, 3.4, -1.6);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = edge;
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = col;
    ctx.stroke();
    ctx.restore();
    return;
  } else if (f === 4) {
    circlePath(ctx, 0, 0, 2.4);
  } else {
    polyPath(ctx, [[-2.8, 2.2], [0, -3], [2.8, 2.2]]);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(-2, -1, 2, 0.8);
  ctx.restore();
}, { frames: 6, res: 3 });

fxc('fx.feather', 12, 12, (ctx) => {
  rot(ctx, 0, 0, -0.7, () => {
    S(ctx, (c) => {
      c.moveTo(-4.5, 0.4);
      c.quadraticCurveTo(-1, -2.6, 4.6, -0.6);
      c.quadraticCurveTo(1, 2.6, -4.5, 0.4);
      c.closePath();
    }, { fill: '#e9e6ee', ink: 0.7, shadow: '#a9a4b6', shadowOffset: [-0.3, -0.6] });
    line(ctx, [[-5.2, 0.6], [4.2, -0.6]], 0.45, '#8a8496', false);
    line(ctx, [[-1, -0.8], [0.4, -1.8]], 0.3, '#a9a4b6', false, 0.8);
  });
}, { res: 3, edge: '#ffffff', edgeW: 0.4, edgeA: 0.3 });

fx('fx.ice', 48, 48, (ctx) => {
  const pts = puddlePts(16.5, 17.5, 88, 11, 0.16);
  // frosty translucent shell
  ctx.save();
  ctx.beginPath();
  polyPath(ctx, pts);
  ctx.fillStyle = radial(ctx, -4, -6, 22, [[0, 'rgba(235,250,255,0.42)'], [0.55, 'rgba(160,220,255,0.32)'], [1, 'rgba(110,190,255,0.55)']]);
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = 'rgba(40,110,190,0.55)';
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(240,252,255,0.95)';
  ctx.stroke();
  ctx.restore();
  // facets + big glare
  ctx.save();
  ctx.beginPath();
  polyPath(ctx, pts);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < pts.length; i += 2) {
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i][0] * 0.3 + 1, pts[i][1] * 0.3 - 1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  polyPath(ctx, [[-13, -6], [-6, -14], [-2, -12], [-11, -2]]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  polyPath(ctx, [[6, 10], [13, 3], [14, 6], [9, 12]]);
  ctx.fill();
  ctx.restore();
  // ice shards poking out of the rim
  const R = rng(91);
  for (let i = 0; i < 6; i++) {
    const a = -2.6 + i * 0.95 + (R() - 0.5) * 0.4;
    const x = Math.cos(a) * 15, y = Math.sin(a) * 15.5;
    rot(ctx, x, y, a, () => {
      ctx.fillStyle = 'rgba(225,246,255,0.92)';
      ctx.strokeStyle = 'rgba(40,110,190,0.75)';
      ctx.lineWidth = 0.7;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      polyPath(ctx, [[-2, -2], [4 + R() * 2.5, -0.4], [-2, 2]]);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      polyPath(ctx, [[-1.5, -1.5], [3.5, -0.4], [-1.5, -0.2]]);
      ctx.fill();
    });
  }
  // snowflake sparkles
  for (const [x, y, sz] of [[-7, -8, 3.4], [9, 7, 2.6], [6, -10, 2]] as [number, number, number][]) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * sz, y - Math.sin(a) * sz);
      ctx.lineTo(x + Math.cos(a) * sz, y + Math.sin(a) * sz);
      ctx.stroke();
    }
    ctx.restore();
  }
}, { res: 2 });

fxc('fx.note', 16, 16, (ctx) => {
  // eighth note: head + stem + flag
  rot(ctx, 0, 0, -0.12, () => {
    S(ctx, (c) => {
      ellipsePath(c, -2.2, 4, 3, 2.2, -0.4);
    }, { fill: '#3a2a4a', ink: 0.9, shadow: '#1a1020', shadowOffset: [-0.5, -0.5], gloss: [{ x: -3, y: 3.2, rx: 1, ry: 0.5, rot: -0.4, alpha: 0.7 }] });
    tube(ctx, [[0.5, 3.5], [0.5, -5.8]], 1.1, '#3a2a4a', 0.9, false);
    S(ctx, (c) => {
      c.moveTo(0, -6.2);
      c.quadraticCurveTo(4.5, -4.5, 4, -0.5);
      c.quadraticCurveTo(3.4, -3, 0.5, -3.4);
      c.closePath();
    }, { fill: '#3a2a4a', ink: 0.9, shadow: 'none' });
  });
}, { res: 3, edge: '#fff6dc', edgeW: 0.8, edgeA: 0.9 });

fxc('fx.anger', 18, 18, (ctx) => {
  angerMark(ctx, 0, 0, 6.4, { ink: 0.8 });
}, { res: 3, edge: '#fff6dc', edgeW: 0.5, edgeA: 0.4 });

fxc('fx.sweat', 10, 12, (ctx) => {
  S(ctx, (c) => {
    c.moveTo(0, -4.6);
    c.bezierCurveTo(1, -2.4, 3, -0.6, 3, 1.4);
    c.bezierCurveTo(3, 3.4, 1.5, 4.4, 0, 4.4);
    c.bezierCurveTo(-1.5, 4.4, -3, 3.4, -3, 1.4);
    c.bezierCurveTo(-3, -0.6, -1, -2.4, 0, -4.6);
    c.closePath();
  }, {
    fill: radial(ctx, -1, 0, 5, [[0, '#e6f8ff'], [0.5, '#8fd2ff'], [1, '#4a9ae0']]),
    ink: 0.8, shadow: '#3a86d0', shadowOffset: [-0.5, -0.6],
    gloss: [{ x: -1.1, y: 1, rx: 0.6, ry: 1.1, rot: 0.3, alpha: 0.95 }],
  });
}, { res: 3, edge: '#ffffff', edgeW: 0.4, edgeA: 0.4 });

