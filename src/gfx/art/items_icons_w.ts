/**
 * ICONS — weapons ('icon.w.*') and evolutions ('icon.e.*').
 * 48×48 box, anchor centre, res 3. Evolutions get a golden radiant backdrop.
 */
import { Ctx, Pt, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath, line, speckle, glint, rng, rgba } from '../painter';
import { S, G, lit, icon, goldGrad, goldBall, radial, linear, sparkle, inkSparkle, swoosh, softGlow, tube } from './items_kit';
import {
  rollingPin, slipper, chefKnife, olive, fork, trident, margherita, cutterWheel, chilli, moka, lavaRock, meteor,
  basilLeaf, flame, flamePath, angerMark, noodles, wing, heart, oliveLeaf, puff,
} from './items_objects';

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  if (s !== 1) ctx.scale(s, s);
  fn();
  ctx.restore();
}

/** Straight speed lines trailing toward -x in the rotated frame. */
function speedLines(ctx: Ctx, x: number, y: number, a: number, len: number, n: number, gap: number, color = '#ffffff', alpha = 0.85, w = 1.6) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const yy = (i - (n - 1) / 2) * gap;
    const l = len * (i % 2 ? 0.7 : 1);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#2b1712';
    ctx.lineWidth = w + 1.6;
    ctx.beginPath();
    ctx.moveTo(-l, yy);
    ctx.lineTo(0, yy);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.stroke();
  }
  ctx.restore();
}

// ===========================================================================
// MATTARELLO
// ===========================================================================
icon('icon.w.mattarello', (ctx) => {
  puff(ctx, -13, 12, 6.5, { ink: 1.2, seed: 3 });
  puff(ctx, 14, -11, 4, { ink: 1.1, seed: 5 });
  rot(ctx, 0, 0, -0.45, () => rollingPin(ctx, 41, { ink: 2 }));
  speckle(ctx, -6, 13, 8, 3, 6, '#fffaf0', 0.7, 9, 0.9);
});

icon('icon.e.mattarello_nonna', (ctx) => {
  // double 360° spin trails
  swoosh(ctx, 0, 0, 19, Math.PI * 1.05, Math.PI * 1.75, 3, '#fffbe0', 0.95);
  swoosh(ctx, 0, 0, 19, Math.PI * 0.05, Math.PI * 0.75, 3, '#fffbe0', 0.95);
  rot(ctx, 0, 0, -0.45, () => rollingPin(ctx, 40, { ink: 2, gold: true }));
  heart(ctx, 13, -13, 5.5, { ink: 1.4 });
  inkSparkle(ctx, -15, -12, 4, '#fff6c8', 1);
  inkSparkle(ctx, -9, 16, 3, '#fff6c8', 0.9);
}, { evo: true });

// ===========================================================================
// CIABATTA
// ===========================================================================
icon('icon.w.ciabatta', (ctx) => {
  speedLines(ctx, -11, 3, -0.32, 11, 3, 4.6, '#ffffff', 0.9, 1.5);
  rot(ctx, 3, 1, -0.32, () => slipper(ctx, 40, { ink: 2 }));
});

icon('icon.e.ira_nonna', (ctx) => {
  speedLines(ctx, -12, 5, -0.32, 10, 3, 4.6, '#fff4c0', 0.95, 1.5);
  rot(ctx, 1, 4, -0.32, () => slipper(ctx, 38, { ink: 2, gold: true }));
  angerMark(ctx, 13, -13, 7.5, { ink: 1.1 });
  angerMark(ctx, -12, -12, 4.2, { ink: 0.9 });
  inkSparkle(ctx, 17, 4, 3.2, '#fff6c8', 0.9);
}, { evo: true });

// ===========================================================================
// COLTELLI
// ===========================================================================
icon('icon.w.coltelli', (ctx) => {
  const knives: [number, number, number, string][] = [
    [-10, 15, -1.3, '#3a2620'],
    [-14, 12, -0.82, '#6b3b23'],
    [-15, 6, -0.36, '#3a2620'],
  ];
  for (const [x, y, a, h] of knives) {
    rot(ctx, x, y, a, () => {
      ctx.translate(16, 0);
      chefKnife(ctx, 33, { ink: 1.7, handle: h });
    });
  }
});

icon('icon.e.mille_coltelli', (ctx) => {
  // a volley of glowing knives streaming up-right, each with a light trail
  const a = -0.62;
  const ca = Math.cos(a), sa = Math.sin(a);
  const knives: [number, number, number][] = [
    // offset along the flight dir, offset across, length
    [-4, -15, 18], [-8, 13, 18], [4, -5.5, 23], [0, 5.5, 23], [10, 0, 30],
  ];
  for (const [u, v, L] of knives) {
    const x = u * ca - v * sa - 4, y = u * sa + v * ca + 2;
    rot(ctx, x, y, a, () => {
      const g = ctx.createLinearGradient(-L * 1.5, 0, -L * 0.45, 0);
      g.addColorStop(0, 'rgba(120,215,255,0)');
      g.addColorStop(1, 'rgba(170,232,255,0.85)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-L * 1.5, -0.4);
      ctx.lineTo(-L * 0.45, -L * 0.075);
      ctx.lineTo(-L * 0.45, L * 0.09);
      ctx.lineTo(-L * 1.5, 0.6);
      ctx.closePath();
      ctx.fill();
      chefKnife(ctx, L, { ink: L > 25 ? 1.7 : 1.4, mat: 'blue', handle: '#24304d' });
    });
  }
  sparkle(ctx, 14, -16, 3.6, '#ffffff', 1, 0, '#bfefff');
  sparkle(ctx, -16, 12, 2.6, '#ffffff', 0.9, 0, '#bfefff');
}, { evo: true, burst: '#8fdcff' });

// ===========================================================================
// OLIVE
// ===========================================================================
function oliveSprig(ctx: Ctx, gold = false) {
  const twig: Pt[] = [[-19, -14], [-9, -10], [2, -9.5], [12, -12], [19, -17]];
  tube(ctx, twig, 2.6, gold ? '#b9802a' : '#7a5232', 1.3, true);
  if (!gold) {
    oliveLeaf(ctx, -12, -11.5, 12, -2.5, 1.2);
    oliveLeaf(ctx, -4, -10, 13, -1.75, 1.2);
    oliveLeaf(ctx, 8, -11, 13, -0.25, 1.2);
    oliveLeaf(ctx, 15, -14.5, 9, -1.2, 1.1);
  }
}

icon('icon.w.olive', (ctx) => {
  oliveSprig(ctx);
  // stems
  tube(ctx, [[-7, -10], [-9, -5], [-9, -1]], 1.3, '#6e8a2a', 1, true);
  tube(ctx, [[3, -10], [5, -3], [6, 1]], 1.3, '#6e8a2a', 1, true);
  tube(ctx, [[12, -12], [15, -6], [15, -3]], 1.2, '#6e8a2a', 1, true);
  rot(ctx, 15, 4, 1.35, () => olive(ctx, 6.4, { ink: 1.7, color: '#7da832' }));
  rot(ctx, -9, 6.5, 1.65, () => olive(ctx, 8, { ink: 1.9, color: '#8db53a' }));
  rot(ctx, 5, 9, 1.5, () => olive(ctx, 8.6, { ink: 1.9, color: '#9cc040' }));
});

icon('icon.e.olive_oro', (ctx) => {
  tube(ctx, [[-17, -12], [-6, -8], [6, -9], [14, -14]], 2.4, '#c9902f', 1.3, true);
  rot(ctx, -9, 5, 1.55, () => olive(ctx, 8.2, { ink: 1.9, gold: true }));
  rot(ctx, 6, 7, 1.4, () => olive(ctx, 8.6, { ink: 1.9, gold: true }));
  // golden oil drop
  const dx = 15, dy = -4;
  S(ctx, (c) => {
    c.moveTo(dx, dy - 10);
    c.bezierCurveTo(dx + 2.2, dy - 5, dx + 6, dy - 1, dx + 6, dy + 3);
    c.bezierCurveTo(dx + 6, dy + 7, dx + 3, dy + 9, dx, dy + 9);
    c.bezierCurveTo(dx - 3, dy + 9, dx - 6, dy + 7, dx - 6, dy + 3);
    c.bezierCurveTo(dx - 6, dy - 1, dx - 2.2, dy - 5, dx, dy - 10);
    c.closePath();
  }, {
    fill: radial(ctx, dx - 2, dy, 10, [[0, '#fff6b0'], [0.5, '#f5c83a'], [1, '#c98a14']]),
    ink: 1.7, shadow: '#b8780e', shadowOffset: [-1.2, -1.4],
    gloss: [{ x: dx - 2.4, y: dy + 1, rx: 1.4, ry: 2.6, rot: 0.3, alpha: 0.9 }],
  });
  inkSparkle(ctx, -16, -16, 3.6, '#fff6c8', 1);
  inkSparkle(ctx, 18, 14, 3, '#fff6c8', 0.9);
}, { evo: true });

// ===========================================================================
// FORCHETTE
// ===========================================================================
icon('icon.w.forchette', (ctx) => {
  const base = -Math.PI / 2 + 0.2;
  for (let i = 0; i < 3; i++) {
    const a = base + (i * Math.PI * 2) / 3;
    swoosh(ctx, 0, 0, 15.5, a - 1.75, a - 0.55, 2.2, '#fff4dc', 0.85);
  }
  for (let i = 0; i < 3; i++) {
    const a = base + (i * Math.PI * 2) / 3;
    rot(ctx, 0, 0, a, () => {
      ctx.translate(9.5, 0);
      fork(ctx, 23, { ink: 1.6, tines: 4 });
    });
  }
  S(ctx, (c) => circlePath(c, 0, 0, 3), { fill: '#e8edf4', ink: 1.3, shadowOffset: [-0.6, -0.7] });
});

icon('icon.e.tridente', (ctx) => {
  // curling sea wave at the base
  const wave = (c: Ctx) => {
    c.moveTo(-23, 21);
    c.bezierCurveTo(-23, 9, -15, 3, -7, 4);
    c.bezierCurveTo(-1, 5, 1, 10, -2, 13);
    c.bezierCurveTo(-4, 15, -8, 13, -7, 10.5);
    c.bezierCurveTo(-10, 11, -11, 15, -8, 17.5);
    c.bezierCurveTo(-4, 20.5, 3, 19, 7, 15);
    c.quadraticCurveTo(8, 20, 4, 22);
    c.lineTo(-23, 22);
    c.closePath();
  };
  S(ctx, wave, { fill: linear(ctx, 0, 4, 0, 22, [[0, '#6fd3f5'], [0.5, '#2fa6dc'], [1, '#1b6fb0']]), ink: 1.7, shadow: '#1a5f9c', shadowOffset: [-1.4, -1.6], gloss: [{ x: -14, y: 8, rx: 4.5, ry: 1.3, rot: -0.5, alpha: 0.8 }] });
  line(ctx, [[-19, 14], [-14, 9], [-9, 7.5]], 1, '#dff6ff', true, 0.9);
  for (const [x, y, r] of [[2, 8, 1.3], [5, 11, 1], [-1, 5.5, 0.9], [9, 13.5, 1.1]] as [number, number, number][]) {
    S(ctx, (c) => circlePath(c, x, y, r), { fill: '#f2fbff', ink: 0.8, shadow: 'none' });
  }
  rot(ctx, 0, -1, -0.86, () => trident(ctx, 46, { ink: 1.8 }));
  inkSparkle(ctx, 16, -17, 3.6, '#fff6c8', 1);
  inkSparkle(ctx, 18, 6, 2.6, '#fff6c8', 0.9);
}, { evo: true });

// ===========================================================================
// PIZZA
// ===========================================================================
function doughTilted(ctx: Ctx) {
  const rx = 19.5, ry = 15;
  // thickness / underside
  S(ctx, (c) => ellipsePath(c, 0, 2.2, rx, ry), { fill: '#d39b56', ink: 2, shadow: 'none' });
  S(ctx, (c) => ellipsePath(c, 0, 0, rx, ry), {
    fill: radial(ctx, -5, -4, rx * 1.1, [[0, '#ffe8bd'], [0.6, '#f2cf8f'], [1, '#e0aa62']]),
    ink: 2, shadow: '#d29a55', shadowOffset: [-1.6, -1.8],
  });
  // thin stretched centre (paler) inside the puffy cornicione
  S(ctx, (c) => ellipsePath(c, 0.6, 0.5, rx * 0.72, ry * 0.7), {
    fill: radial(ctx, -3, -3, rx * 0.8, [[0, '#fff8e8'], [0.7, '#fbe8c4'], [1, '#f1d29c']]),
    ink: 0.9, inkColor: '#c99050', shadow: 'none',
  });
  // spiral stretch
  ctx.save();
  ctx.scale(1, ry / rx);
  ctx.strokeStyle = rgba('#e3bd7e', 0.7);
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, a = (k / 3) * Math.PI * 2 + t * 2.2, d = 2 + t * 10;
      if (i === 0) ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d);
      else ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d);
    }
    ctx.stroke();
  }
  ctx.restore();
  speckle(ctx, -2, -1, 11, 8, 16, '#ffffff', 0.6, 21, 0.9);
  // blistered rim
  for (const [bx, by, br] of [[14, -7, 2.4], [-16, 4, 2], [6, 12, 2.1], [-8, -12, 1.7], [16, 5, 1.6]] as [number, number, number][]) {
    ctx.fillStyle = rgba('#fff3d6', 0.95);
    ctx.beginPath();
    ellipsePath(ctx, bx, by, br, br * 0.7, Math.atan2(by, bx) + Math.PI / 2);
    ctx.fill();
    ctx.fillStyle = rgba('#7a4520', 0.7);
    ctx.beginPath();
    ellipsePath(ctx, bx + 0.6, by + 0.5, br * 0.4, br * 0.28, 0);
    ctx.fill();
  }
  glint(ctx, -8, -6, 3.5, 1.2, -0.6, 0.6);
}

icon('icon.w.pizza', (ctx) => {
  ctx.save();
  ctx.rotate(-0.22);
  ctx.save();
  ctx.scale(1, 0.8);
  swoosh(ctx, 0, 1, 23.5, Math.PI * 0.95, Math.PI * 1.6, 2.6, '#ffffff', 0.95);
  ctx.restore();
  doughTilted(ctx);
  ctx.save();
  ctx.scale(1, 0.8);
  swoosh(ctx, 0, 1, 23.5, Math.PI * -0.05, Math.PI * 0.6, 2.6, '#ffffff', 0.95);
  ctx.restore();
  ctx.restore();
  puff(ctx, 17, -15, 3.8, { ink: 1, seed: 8 });
  puff(ctx, -18, 15, 3.2, { ink: 1, seed: 9 });
});

icon('icon.e.pizza_celeste', (ctx) => {
  wing(ctx, -12, 1, 12, -1, 1.5);
  wing(ctx, 12, 1, 12, 1, 1.5);
  margherita(ctx, 14.5, { ink: 1.8, seed: 9 });
  // halo
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, 0, -17.5, 9, 3);
  ctx.lineWidth = 5.2;
  ctx.strokeStyle = '#2b1712';
  ctx.stroke();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = goldGrad(ctx, -9, -20, 9, -15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -17.5, 7.6, Math.PI * 1.1, Math.PI * 1.45);
  ctx.restore();
  ctx.save();
  ctx.translate(0, -17.5);
  ctx.scale(1, 3 / 9);
  ctx.beginPath();
  ctx.arc(0, 0, 9, Math.PI * 1.1, Math.PI * 1.5);
  ctx.restore();
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = '#fffbe0';
  ctx.stroke();
  inkSparkle(ctx, 17, -15, 3.2, '#fff6c8', 0.9);
}, { evo: true });

// ===========================================================================
// ROTELLA
// ===========================================================================
function cutterHandle(ctx: Ctx, gold = false) {
  // handle pointing down-left from (−3, 3)
  rot(ctx, -3, 3, Math.PI * 0.75, () => {
    G(ctx, [
      { build: (c) => roundRectPath(c, 3, -3.8, 19, 7.6, 3.8), style: { fill: gold ? goldGrad(ctx, 0, -4, 0, 4) : '#d8342e', shadow: gold ? 'none' : '#a01f22', shadowOffset: [-0.8, -1.4], gloss: [{ x: 11, y: -2, rx: 6, ry: 1.1, alpha: 0.55 }] } },
      { build: (c) => ellipsePath(c, 3.2, 0, 2, 5.6), style: { fill: gold ? '#ffd65a' : '#bf2a28', shadow: gold ? '#c27a12' : '#8c1c1e', shadowOffset: [-0.5, -0.8] } },
    ], 1.8);
    line(ctx, [[19, -1.8], [19, 1.8]], 0.8, gold ? '#a8620f' : '#8c1c1e', false, 0.8);
    // hanging hole
    S(ctx, (c) => circlePath(c, 18.2, 0, 1.1), { fill: '#2b1712', ink: 0, shadow: 'none' });
  });
}

icon('icon.w.rotella', (ctx) => {
  cutterHandle(ctx);
  rot(ctx, 6, -6, 0, () => cutterWheel(ctx, 14.5, { ink: 1.9 }));
  // fork bracket from handle to hub
  tube(ctx, [[-2.5, 2.5], [2, -2], [6, -6]], 2.6, '#c9d1dc', 1.3, false, '#ffffff', 0.8);
  S(ctx, (c) => circlePath(c, 6, -6, 2.2), { fill: '#eef2f6', ink: 1.1, shadowOffset: [-0.5, -0.6] });
});

export function fortuneWheel(ctx: Ctx, r: number) {
  S(ctx, (c) => circlePath(c, 0, 0, r), { fill: goldBall(ctx, 0, 0, r), ink: 1.9, shadow: '#c27612', shadowOffset: [-1.2, -1.4] });
  const n = 8;
  const ri = r * 0.8;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, ri, a0, a1);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#fff1cc' : '#e5333a';
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, ri);
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = '#2b1712';
  ctx.stroke();
  // pegs
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    circlePath(ctx, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 0.9);
    ctx.fillStyle = '#fff8d8';
    ctx.fill();
  }
  ctx.restore();
  // shine
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, ri);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ellipsePath(ctx, -r * 0.3, -r * 0.35, r * 0.55, r * 0.3, -0.7);
  ctx.fill();
  ctx.restore();
  S(ctx, (c) => circlePath(c, 0, 0, r * 0.22), { fill: goldBall(ctx, 0, 0, r * 0.22), ink: 1.2, shadow: 'none', gloss: [{ x: -r * 0.07, y: -r * 0.08, rx: r * 0.07, ry: r * 0.05, alpha: 0.9 }] });
}

icon('icon.e.ruota_fortuna', (ctx) => {
  cutterHandle(ctx, true);
  rot(ctx, 6, -6, 0.3, () => cutterWheel(ctx, 15.5, { ink: 1.9, gold: true }));
  tube(ctx, [[-2.5, 2.5], [2, -2], [6, -6]], 2.6, '#ffd65a', 1.3, false, '#fff8d0', 0.9);
  S(ctx, (c) => circlePath(c, 6, -6, 2.2), { fill: '#fff2a6', ink: 1.1, shadowOffset: [-0.5, -0.6] });
  // crit sparks flying off the edge
  for (const [x, y, a] of [[21, -14, -0.4], [19, 3, 0.35], [-6, -20, -1.9]] as [number, number, number][]) {
    rot(ctx, x, y, a, () => {
      S(ctx, (c) => polyPath(c, [[-4, 0], [0, -1.2], [4.5, 0], [0, 1.2]]), { fill: '#fff6c8', ink: 0.9, shadow: 'none' });
    });
  }
  inkSparkle(ctx, -14, -12, 4.2, '#fff6c8', 1);
  inkSparkle(ctx, 14, 14, 3, '#fff6c8', 0.9);
}, { evo: true });

// ===========================================================================
// PEPERONCINO
// ===========================================================================
function heatWave(ctx: Ctx, x: number, y: number, h: number, col = '#ff7b3a') {
  const pts: Pt[] = [];
  for (let i = 0; i <= 6; i++) pts.push([x + Math.sin(i * 1.4) * 1.5, y - (i / 6) * h]);
  tube(ctx, pts, 1.6, col, 1, true);
}

icon('icon.w.peperoncino', (ctx) => {
  heatWave(ctx, 13, -6, 11);
  heatWave(ctx, 19, -1, 8);
  rot(ctx, -1, 2, -0.52, () => chilli(ctx, 42, { ink: 2 }));
});

icon('icon.e.inferno', (ctx) => {
  softGlow(ctx, 0, 4, 22, '#ff6a1a', 0.7);
  flame(ctx, 0, 21, 19, 43, { ink: 1.8, seed: 4 });
  rot(ctx, 0, 6, -0.55, () => chilli(ctx, 34, { ink: 1.9 }));
  // embers
  const R = rng(12);
  for (let i = 0; i < 6; i++) {
    const a = R() * Math.PI * 2, d = 15 + R() * 6;
    ctx.fillStyle = i % 2 ? '#ffd34a' : '#ff8a2a';
    ctx.beginPath();
    circlePath(ctx, Math.cos(a) * d, Math.sin(a) * d - 3, 0.9 + R() * 0.8);
    ctx.fill();
  }
}, { evo: true, burst: '#ff9a3a' });

// ===========================================================================
// MOKA
// ===========================================================================
icon('icon.w.moka', (ctx) => {
  puff(ctx, 15, -16, 4.6, { ink: 1.1, seed: 4 });
  puff(ctx, 20.5, -20.5, 2.6, { ink: 0.9, seed: 6 });
  rot(ctx, -1, 3, -0.12, () => moka(ctx, 39, { ink: 1.9 }));
});

icon('icon.e.moka_turbo', (ctx) => {
  speedLines(ctx, -10, 10, -0.75, 10, 3, 5, '#ffffff', 0.9, 1.5);
  rot(ctx, 1, 0, 0.55, () => {
    // rocket exhaust under the boiler
    flame(ctx, 0, 33, 7, 15, { ink: 1.3, seed: 7, cool: true });
    ctx.save();
    ctx.scale(1, -1);
    ctx.restore();
  });
  rot(ctx, 1, 0, 0.55, () => {
    ctx.save();
    ctx.translate(0, 16);
    ctx.rotate(Math.PI);
    flame(ctx, 0, 0, 6.5, 13, { ink: 1.3, seed: 7, cool: true });
    ctx.restore();
    moka(ctx, 34, { ink: 1.9, turbo: true });
  });
  inkSparkle(ctx, 16, -15, 3.4, '#fff6c8', 1);
}, { evo: true });

// ===========================================================================
// SPAGHETTI
// ===========================================================================
/** Twirled nest of spaghetti (the classic fork-twirl), centred at (x,y). */
function twirl(ctx: Ctx, x: number, y: number, r: number, ink = 1.2) {
  S(ctx, (c) => ellipsePath(c, x, y, r, r * 0.8), { fill: '#f0c95e', ink: ink * 1.4, shadow: '#cf9f3e', shadowOffset: [-r * 0.15, -r * 0.18] });
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, x, y, r, r * 0.8);
  ctx.clip();
  for (let i = 0; i < 7; i++) {
    const yy = y - r * 0.9 + i * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.1, yy + r * 0.12);
    ctx.quadraticCurveTo(x, yy - r * 0.22, x + r * 1.1, yy + r * 0.12);
    ctx.lineWidth = r * 0.17 + ink * 1.6;
    ctx.strokeStyle = 'rgba(43,23,18,0.85)';
    ctx.stroke();
    ctx.lineWidth = r * 0.17;
    ctx.strokeStyle = i % 2 ? '#f9dc7c' : '#fde7a4';
    ctx.stroke();
  }
  ctx.restore();
}

icon('icon.w.spaghetti', (ctx) => {
  // fork handle (down-left)
  rot(ctx, -4, 4, Math.PI * 0.75, () => {
    ctx.translate(12, 0);
    ctx.scale(-1, 1);
    fork(ctx, 30, { ink: 1.6, tines: 4 });
  });
  // the whip: strands lashing out of the twirl in an S-curve
  const whip: Pt[] = [[2, -4], [8, -12], [16, -15], [20, -8], [16, -1], [19, 6], [23, 9]];
  swoosh(ctx, 14, -6, 13, Math.PI * 1.25, Math.PI * 1.85, 2, '#ffffff', 0.9);
  noodles(ctx, whip, 3, 3.2, 1.9, { ink: 1.05, seed: 5, color: '#f8da78' });
  twirl(ctx, -2, -1, 10.5, 1.2);
  // a drizzle of tomato sauce on top of the twirl
  S(ctx, (c) => {
    c.moveTo(-8, -6.5);
    c.bezierCurveTo(-5, -9.5, 2, -10, 5, -6.5);
    c.quadraticCurveTo(5.5, -4.5, 4, -4.6);
    c.quadraticCurveTo(3, -2, 2, -4.4);
    c.quadraticCurveTo(-1, -5, -3, -4.2);
    c.quadraticCurveTo(-4.2, -1.6, -5.2, -4.4);
    c.quadraticCurveTo(-7.8, -4.2, -8, -6.5);
    c.closePath();
  }, { fill: '#e2382a', ink: 1.2, shadow: '#a8201e', shadowOffset: [-0.8, -1], gloss: [{ x: -3, y: -7.6, rx: 2.2, ry: 0.8, rot: -0.1, alpha: 0.85 }] });
});

icon('icon.e.cacio_pepe', (ctx) => {
  // helix tornado
  const pts: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const y = -16 + t * 35;
    const r = 18 * Math.pow(1 - t, 1.1) + 2;
    const a = t * Math.PI * 2 * 4.2;
    const sway = Math.sin(t * 3) * 2.5;
    pts.push([Math.cos(a) * r + sway, y + Math.sin(a) * r * 0.28]);
  }
  softGlow(ctx, 0, -2, 20, '#fff2c0', 0.6);
  noodles(ctx, pts, 2, 2.6, 2.1, { ink: 1.05, seed: 7, color: '#f8de8a' });
  // pecorino flakes + black pepper
  const R = rng(31);
  for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2, d = 10 + R() * 11;
    const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.8 - 4;
    S(ctx, (c) => polyPath(c, [[x - 1.4, y], [x, y - 1.1], [x + 1.5, y + 0.2], [x - 0.2, y + 1.1]]), { fill: '#fffaf0', ink: 0.8, shadow: 'none' });
  }
  for (let i = 0; i < 14; i++) {
    const a = R() * Math.PI * 2, d = 6 + R() * 15;
    ctx.fillStyle = '#2b1712';
    ctx.beginPath();
    circlePath(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.85 - 3, 0.75 + R() * 0.6);
    ctx.fill();
  }
}, { evo: true });

// ===========================================================================
// VESUVIO
// ===========================================================================
function volcano(ctx: Ctx, o: { s?: number; erupt?: boolean } = {}) {
  const s = o.s ?? 1;
  ctx.save();
  ctx.scale(s, s);
  const cone = (c: Ctx) => {
    c.moveTo(-23, 21);
    c.quadraticCurveTo(-14, 6, -9.5, -5);
    c.quadraticCurveTo(0, -8.5, 9.5, -5);
    c.quadraticCurveTo(14, 6, 23, 21);
    c.closePath();
  };
  S(ctx, cone, {
    fill: linear(ctx, -20, -6, 20, 20, [[0, '#a7786a'], [0.55, '#7d5248'], [1, '#5e3a35']]),
    ink: 2 / s,
    shadow: '#4f302c',
    shadowOffset: [-5, -1],
  });
  // ridges
  line(ctx, [[-6, -3], [-10, 8], [-15, 18]], 1.1, rgba('#c49a8a', 0.7), true);
  line(ctx, [[3, -2], [6, 9], [9, 19]], 1.1, rgba('#4a2c28', 0.6), true);
  // green foothills
  S(ctx, (c) => {
    c.moveTo(-23.5, 21);
    c.quadraticCurveTo(-20, 13, -14, 15);
    c.quadraticCurveTo(-9, 11, -3, 15);
    c.quadraticCurveTo(3, 12, 9, 15.5);
    c.quadraticCurveTo(16, 12, 23.5, 21);
    c.closePath();
  }, { fill: '#58a345', ink: 1.6 / s, shadow: '#3c7a35', shadowOffset: [-1.5, -1.5] });
  // crater with lava
  S(ctx, (c) => ellipsePath(c, 0, -5.5, 9.5, 2.8), { fill: '#ffb02e', ink: 1.6 / s, shadow: '#ff6a1a', shadowOffset: [0.6, 0.9] });
  // lava flows
  const flows: Pt[][] = [
    [[-4, -4.5], [-6, 0], [-5, 4], [-8, 9], [-8, 12]],
    [[4.5, -4.5], [6, 0], [10, 5], [11, 10]],
  ];
  for (const f of flows) {
    tube(ctx, f, 3.2, '#ff8a22', 1.3 / s, true);
    line(ctx, f, 1.2, '#ffe27a', true);
  }
  // drips at the ends
  S(ctx, (c) => circlePath(c, -8, 13, 1.7), { fill: '#ff8a22', ink: 1.1 / s, shadow: 'none' });
  S(ctx, (c) => circlePath(c, 11, 11, 1.6), { fill: '#ff8a22', ink: 1.1 / s, shadow: 'none' });
  ctx.restore();
}

icon('icon.w.vesuvio', (ctx) => {
  // smoke plume
  puff(ctx, -4, -15, 6, { ink: 1.3, seed: 2, color: '#e9e2e6', shadow: '#b9adb8' });
  puff(ctx, 6, -18, 5.4, { ink: 1.3, seed: 3, color: '#efe8ec', shadow: '#bfb3be' });
  puff(ctx, 0, -10.5, 5, { ink: 1.3, seed: 4, color: '#f4eef2', shadow: '#c9bec8' });
  ctx.save();
  ctx.translate(0, 1);
  volcano(ctx);
  ctx.restore();
  // flying lava bombs
  S(ctx, (c) => circlePath(c, -14, -10, 2.2), { fill: '#ff8a22', ink: 1.2, shadow: '#d4501a', shadowOffset: [-0.5, -0.6] });
  S(ctx, (c) => circlePath(c, 15, -8, 1.8), { fill: '#ffb02e', ink: 1.1, shadow: '#d4501a', shadowOffset: [-0.5, -0.6] });
});

icon('icon.e.pompei', (ctx) => {
  softGlow(ctx, 0, -6, 20, '#ff5a1a', 0.75);
  // lava fountain
  flame(ctx, 0, 0, 9, 20, { ink: 1.5, seed: 11 });
  ctx.save();
  ctx.translate(0, 5);
  volcano(ctx, { s: 0.82 });
  ctx.restore();
  // meteors flying out
  rot(ctx, -13, -14, -2.5, () => meteor(ctx, 16, { ink: 1.2, seed: 2 }));
  rot(ctx, 14, -15, -0.7, () => meteor(ctx, 17, { ink: 1.2, seed: 4 }));
  rot(ctx, 19, 0, -0.2, () => meteor(ctx, 11, { ink: 1, seed: 6 }));
}, { evo: true, burst: '#ff9a3a' });

// ===========================================================================
// FORMA
// ===========================================================================
function cheeseWheel3q(ctx: Ctx, gold = false) {
  const cx = 0, ty = -6, by = 9, rx = 20, ry = 8.5;
  const a1 = (16 * Math.PI) / 180, a2 = (72 * Math.PI) / 180;
  const ex = (a: number, y: number): Pt => [cx + Math.cos(a) * rx, y + Math.sin(a) * ry];
  const rindSide = gold ? goldGrad(ctx, -rx, ty, rx, by + ry) : linear(ctx, -rx, 0, rx, 0, [[0, '#f0bb5c'], [0.5, '#e2a043'], [1, '#c27c2b']]);
  const rindTop = gold ? radial(ctx, -6, ty - 3, rx, [[0, '#fff6c0'], [0.5, '#ffd54a'], [1, '#e9a020']]) : radial(ctx, -6, ty - 3, rx, [[0, '#fbdb8e'], [0.6, '#f0c062'], [1, '#dda049']]);
  const paste = gold ? '#ffe68a' : '#fbe7a6';
  const ink = 2;
  // silhouette outline (whole wheel minus wedge)
  const sideA = (c: Ctx) => {
    // right piece of the band: angle 0..a1
    const [x0, y0] = ex(0, ty);
    c.moveTo(x0, y0);
    c.ellipse(cx, ty, rx, ry, 0, 0, a1);
    const [x1, y1] = ex(a1, by);
    c.lineTo(x1, y1);
    c.ellipse(cx, by, rx, ry, 0, a1, 0, true);
    c.closePath();
  };
  const sideB = (c: Ctx) => {
    const [x0, y0] = ex(a2, ty);
    c.moveTo(x0, y0);
    c.ellipse(cx, ty, rx, ry, 0, a2, Math.PI);
    c.lineTo(cx - rx, by);
    c.ellipse(cx, by, rx, ry, 0, Math.PI, a2, true);
    c.closePath();
  };
  const cut = (c: Ctx) => {
    const [x1, y1] = ex(a1, ty);
    const [x2, y2] = ex(a1, by);
    c.moveTo(cx, ty);
    c.lineTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineTo(cx, by);
    c.closePath();
  };
  const top = (c: Ctx) => {
    c.moveTo(cx, ty);
    const [x2, y2] = ex(a2, ty);
    c.lineTo(x2, y2);
    c.ellipse(cx, ty, rx, ry, 0, a2, a1 + Math.PI * 2);
    c.closePath();
  };
  // outer ink for the union
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = ink * 2;
  ctx.strokeStyle = '#2b1712';
  for (const b of [sideA, cut, sideB, top]) {
    ctx.beginPath();
    b(ctx);
    ctx.stroke();
  }
  ctx.restore();
  S(ctx, sideA, { fill: rindSide, ink: 0, shadow: 'none' });
  S(ctx, cut, { fill: paste, ink: 0, shadow: gold ? '#f3c450' : '#efcf7e', shadowOffset: [-2, -1] });
  // crumbly texture on the cut + rind strip
  ctx.save();
  ctx.beginPath();
  cut(ctx);
  ctx.clip();
  speckle(ctx, 9, 3, 9, 7, 26, gold ? '#e9a828' : '#e2b65a', 0.6, 5, 0.8);
  speckle(ctx, 9, 3, 9, 7, 14, '#ffffff', 0.5, 6, 0.9);
  const [rx1, ry1] = ex(a1, ty);
  const [rx2, ry2] = ex(a1, by);
  line(ctx, [[rx1 - 1.4, ry1], [rx2 - 1.4, ry2]], 2.2, gold ? '#e2a020' : '#d8973c');
  line(ctx, [[cx + 1, ty + 0.5], [rx1, ry1 + 0.8]], 1.6, gold ? '#ffe680' : '#efc064');
  ctx.restore();
  S(ctx, sideB, { fill: rindSide, ink: 0, shadow: 'none' });
  // dotted lettering on the band (pin-dot rows)
  ctx.save();
  ctx.beginPath();
  sideB(ctx);
  sideA(ctx);
  ctx.clip();
  ctx.fillStyle = gold ? rgba('#9a5a0c', 0.85) : rgba('#7a4214', 0.85);
  const R = rng(3);
  for (let gi = 0; gi < 7; gi++) {
    const a0 = Math.PI * (0.98 - gi * 0.12);
    if (a0 < a2 + 0.08 && a0 > a1 - 0.25) continue;
    for (let ci = 0; ci < 3; ci++) {
      for (let row = 0; row < 3; row++) {
        if (R() < 0.33) continue;
        const a = a0 - ci * 0.035;
        const y = ty + 4 + row * 2.6;
        const [px, py] = ex(a, y);
        ctx.beginPath();
        circlePath(ctx, px, py, 0.55);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  // band edge highlight
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, ty, rx, ry, 0, a2 + 0.05, Math.PI);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = gold ? 'rgba(255,250,210,0.9)' : 'rgba(255,230,170,0.85)';
  ctx.stroke();
  ctx.restore();
  // edge of the hidden cut wall (seen edge-on)
  const [ex1, ey1] = ex(a2, ty);
  const [ex2, ey2] = ex(a2, by);
  line(ctx, [[ex1, ey1], [ex2, ey2]], 1.2, '#2b1712');
  S(ctx, top, {
    fill: rindTop, ink: 0, shadow: 'none',
    gloss: [{ x: -8, y: ty - 3, rx: 6, ry: 1.8, rot: -0.15, alpha: gold ? 0.85 : 0.45 }],
  });
  // ink lines between top and band / cut
  ctx.save();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#2b1712';
  ctx.beginPath();
  ctx.ellipse(cx, ty, rx, ry, 0, a2, Math.PI);
  ctx.moveTo(...ex(0, ty));
  ctx.ellipse(cx, ty, rx, ry, 0, 0, a1);
  ctx.moveTo(cx, ty);
  ctx.lineTo(...ex(a1, ty));
  ctx.moveTo(cx, ty);
  ctx.lineTo(...ex(a2, ty));
  ctx.moveTo(cx, ty);
  ctx.lineTo(cx, by);
  ctx.stroke();
  ctx.restore();
  // top surface stamp ring
  ctx.save();
  ctx.setLineDash([0.9, 1.2]);
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = gold ? rgba('#b8700f', 0.8) : rgba('#b07a30', 0.8);
  ctx.beginPath();
  ellipsePath(ctx, -5, ty - 1.5, 6, 2.4);
  ctx.stroke();
  ctx.restore();
}

icon('icon.w.forma', (ctx) => {
  ctx.save();
  ctx.translate(0, 2);
  cheeseWheel3q(ctx);
  ctx.restore();
});

icon('icon.e.forma_oro', (ctx) => {
  ctx.save();
  ctx.translate(0, 0);
  cheeseWheel3q(ctx, true);
  ctx.restore();
  // gold coins stacked in front (Parmigiano = bank collateral)
  for (let i = 0; i < 3; i++) {
    S(ctx, (c) => ellipsePath(c, 13, 18 - i * 2.6, 6, 2.2), { fill: goldBall(ctx, 12, 16 - i * 2.6, 6), ink: 1.3, shadow: '#c27612', shadowOffset: [-0.6, -0.8] });
  }
  inkSparkle(ctx, -15, -15, 4, '#fff6c8', 1);
  inkSparkle(ctx, 17, -12, 3, '#fff6c8', 0.9);
}, { evo: true });

// ===========================================================================
// BASILICO
// ===========================================================================
function basilSprig(ctx: Ctx, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  tube(ctx, [[2, 22], [1, 10], [0, -2], [0.5, -12]], 2.4, '#4f9a3c', 1.3, true);
  const leaf = (x: number, y: number, a: number, L: number, col?: string) => rot(ctx, x, y, a, () => {
    ctx.translate(L * 0.42, 0);
    basilLeaf(ctx, L, { ink: 1.5, color: col });
  });
  leaf(1, 9, Math.PI - 0.55, 21, '#3a9e45');
  leaf(1, 9, 0.5, 21, '#3a9e45');
  leaf(0.3, -1, Math.PI - 0.85, 16, '#44b04c');
  leaf(0.3, -1, 0.75, 16, '#44b04c');
  leaf(0.5, -11, -Math.PI / 2 - 0.5, 11, '#5cc35a');
  leaf(0.5, -11, -Math.PI / 2 + 0.45, 11, '#5cc35a');
  ctx.restore();
}

icon('icon.w.basilico', (ctx) => {
  rot(ctx, 0, 0, 0.15, () => basilSprig(ctx, 0.98));
});

icon('icon.e.pesto', (ctx) => {
  // pestle (behind)
  rot(ctx, 6, -2, -0.95, () => {
    G(ctx, [{ build: (c) => roundRectPath(c, -2, -3, 26, 6, 3), style: { fill: '#d39a5a', shadow: '#a86f3a', shadowOffset: [-0.6, -1.2], gloss: [{ x: 13, y: -1.5, rx: 8, ry: 0.9, alpha: 0.5 }] } }], 1.7);
    S(ctx, (c) => ellipsePath(c, 24, 0, 3.4, 4), { fill: '#d39a5a', ink: 1.6, shadow: '#a86f3a', shadowOffset: [-0.6, -0.8] });
  });
  // leaves sticking out
  rot(ctx, -9, -5, -2.2, () => { ctx.translate(6, 0); basilLeaf(ctx, 15, { ink: 1.5 }); });
  rot(ctx, -3, -6, -1.65, () => { ctx.translate(5, 0); basilLeaf(ctx, 12, { ink: 1.4, color: '#4cba4f' }); });
  // mortar bowl (marble)
  const bowl = (c: Ctx) => {
    c.moveTo(-20, -4);
    c.lineTo(20, -4);
    c.bezierCurveTo(20, 9, 13, 17, 0, 17);
    c.bezierCurveTo(-13, 17, -20, 9, -20, -4);
    c.closePath();
  };
  S(ctx, (c) => roundRectPath(c, -9, 15, 18, 5.5, 2), { fill: '#e6e3ea', ink: 1.8, shadow: '#b8b3c4', shadowOffset: [-1, -1] });
  S(ctx, bowl, { fill: radial(ctx, -8, -2, 26, [[0, '#ffffff'], [0.6, '#eceaf0'], [1, '#c9c4d4']]), ink: 2, shadow: '#bdb6c9', shadowOffset: [-3, -2], gloss: [{ x: -12, y: 4, rx: 2.4, ry: 5, rot: 0.3, alpha: 0.8 }] });
  // marble veins
  line(ctx, [[-14, 3], [-9, 6], [-6, 11], [-1, 13]], 0.7, rgba('#9a93ad', 0.7), true);
  line(ctx, [[6, 1], [10, 6], [15, 7]], 0.7, rgba('#9a93ad', 0.7), true);
  // pesto surface
  S(ctx, (c) => ellipsePath(c, 0, -4, 19.5, 4.5), {
    fill: radial(ctx, -5, -6, 20, [[0, '#9be05a'], [0.5, '#4fae2e'], [1, '#2f7f22']]),
    ink: 1.8, shadow: 'none',
  });
  speckle(ctx, 0, -4, 16, 3.4, 22, '#2a6a1c', 0.55, 8, 0.8);
  speckle(ctx, 0, -4, 16, 3.4, 10, '#f6efc0', 0.45, 9, 0.9);
  glint(ctx, -7, -5.5, 3.5, 0.9, -0.1, 0.85);
  glint(ctx, 8, -3, 1.6, 0.6, -0.1, 0.6);
  // pine nuts
  for (const [x, y, a] of [[-16, 18, 0.4], [16, 17, -0.6], [12, 20, 0.9]] as [number, number, number][]) {
    S(ctx, (c) => ellipsePath(c, x, y, 2.2, 1.2, a), { fill: '#f6e2a8', ink: 0.9, shadow: '#d8bd78', shadowOffset: [-0.4, -0.4] });
  }
}, { evo: true, burst: '#d6ff7a' });

// ===========================================================================
// FORNO
// ===========================================================================
function oven(ctx: Ctx, blaze = false) {
  // stone base
  S(ctx, (c) => roundRectPath(c, -22, 11, 44, 10, 2), { fill: '#b3a597', ink: 2, shadow: '#8c7d72', shadowOffset: [-1.5, -1.5] });
  line(ctx, [[-22, 16], [22, 16]], 0.8, rgba('#6e6058', 0.7));
  for (const x of [-12, 2, 15]) line(ctx, [[x, 11], [x, 16]], 0.8, rgba('#6e6058', 0.7));
  for (const x of [-5, 9]) line(ctx, [[x, 16], [x, 21]], 0.8, rgba('#6e6058', 0.7));
  // chimney
  S(ctx, (c) => roundRectPath(c, 8, -21, 6, 10, 1), { fill: '#b9553c', ink: 1.8, shadow: '#8c3a2a', shadowOffset: [-1, -0.8] });
  // dome
  const dome = (c: Ctx) => {
    c.moveTo(-21, 11.5);
    c.bezierCurveTo(-21, -10, -12, -17, 0, -17);
    c.bezierCurveTo(12, -17, 21, -10, 21, 11.5);
    c.closePath();
  };
  S(ctx, dome, {
    fill: radial(ctx, -7, -9, 30, [[0, '#ee8a5e'], [0.55, '#cf5d3c'], [1, '#a5402c']]),
    ink: 2.1, shadow: '#9c3a28', shadowOffset: [-3.4, -2.6],
    gloss: [{ x: -9, y: -10, rx: 5, ry: 2.4, rot: -0.6, alpha: 0.35 }],
  });
  // brick courses on the dome
  ctx.save();
  ctx.beginPath();
  dome(ctx);
  ctx.clip();
  ctx.strokeStyle = rgba('#f6c3a0', 0.45);
  ctx.lineWidth = 0.75;
  for (let i = 1; i < 6; i++) {
    const y = 11 - i * 4.8;
    ctx.beginPath();
    ctx.moveTo(-24, y + 1);
    ctx.quadraticCurveTo(0, y - 1.5, 24, y + 1);
    ctx.stroke();
    const R = rng(i);
    for (let k = -4; k <= 4; k++) {
      const x = k * 5.2 + (i % 2) * 2.6 + R() * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y - 0.6);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }
  ctx.restore();
  // mouth: arch of voussoirs + fiery interior
  const mouth = (c: Ctx) => {
    c.moveTo(-9, 11.5);
    c.lineTo(-9, 3);
    c.arc(0, 3, 9, Math.PI, 0);
    c.lineTo(9, 11.5);
    c.closePath();
  };
  S(ctx, (c) => {
    c.moveTo(-13.5, 11.5);
    c.lineTo(-13.5, 3);
    c.arc(0, 3, 13.5, Math.PI, 0);
    c.lineTo(13.5, 11.5);
    c.closePath();
  }, { fill: '#e8b27e', ink: 1.8, shadow: '#c48654', shadowOffset: [-1, -1] });
  ctx.save();
  ctx.strokeStyle = rgba('#7a4a2c', 0.7);
  ctx.lineWidth = 0.8;
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 9, 3 + Math.sin(a) * 9);
    ctx.lineTo(Math.cos(a) * 13.5, 3 + Math.sin(a) * 13.5);
    ctx.stroke();
  }
  ctx.restore();
  S(ctx, mouth, { fill: radial(ctx, 0, 9, 14, [[0, '#ffb43a'], [0.45, '#d0461e'], [1, '#3a1410']]), ink: 1.8, shadow: 'none' });
  // fire inside
  ctx.save();
  ctx.beginPath();
  mouth(ctx);
  ctx.clip();
  // logs
  tube(ctx, [[-7, 10.5], [6, 8.5]], 2.4, '#7a4a2c', 0.9, false);
  tube(ctx, [[-4, 8], [8, 10.8]], 2.4, '#8a5532', 0.9, false);
  flame(ctx, -3, 10, 4.5, 10, { ink: 1, seed: 3 });
  flame(ctx, 3.5, 10, 4, 8.5, { ink: 1, seed: 5 });
  ctx.restore();
  if (!blaze) {
    // glow spilling on the base
    softGlow(ctx, 0, 13, 10, '#ffb040', 0.55, 4);
  }
  // little smoke curl from the chimney
  puff(ctx, 11, -21, 3, { ink: 1, seed: 7, color: '#eee8ec', shadow: '#bdb2bc' });
}

icon('icon.w.forno', (ctx) => {
  oven(ctx);
});

icon('icon.e.forno_legna', (ctx) => {
  softGlow(ctx, 0, 4, 24, '#ff7a1a', 0.75);
  oven(ctx, true);
  // flames bursting out of the mouth and over the dome
  flame(ctx, -12, -4, 7, 18, { ink: 1.6, seed: 21, lean: -0.15 });
  flame(ctx, 12, -4, 7, 17, { ink: 1.6, seed: 22, lean: 0.15 });
  flame(ctx, 0, 11, 11, 25, { ink: 1.7, seed: 23 });
  softGlow(ctx, 0, 14, 12, '#ffe07a', 0.6, 5);
}, { evo: true, burst: '#ffb03a' });

// keep tree-shaking honest under noUnusedLocals
void lit; void lavaRock; void flamePath; void smoothPath;
