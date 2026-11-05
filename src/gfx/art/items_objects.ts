/**
 * ITEM OBJECTS — reusable painters for the kitchen arsenal. Icons and world
 * projectiles both use these, so a weapon looks the same in the level-up card
 * and on the battlefield.
 *
 * Every painter draws CENTRED on (0,0) and, where it has a direction, POINTING
 * RIGHT (+x). Sizes are passed in world units.
 */
import {
  Ctx, Pt, INK, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath, line, speckle, glint, rng,
  shade, light, rgba,
} from '../painter';
import { P, S, G, lit, goldGrad, cylGrad, GOLD_CYL, goldBall, radial, linear, tube } from './items_kit';

// ---------------------------------------------------------------------------
// Mattarello — rolling pin (horizontal)
// ---------------------------------------------------------------------------
export function rollingPin(ctx: Ctx, L: number, o: { ink?: number; gold?: boolean; flour?: boolean } = {}) {
  const ink = o.ink ?? 2;
  const gold = !!o.gold;
  const bw = L * 0.6, br = L * 0.125;
  const hr = L * 0.05;
  const knob = hr * 1.45;
  const xb = bw / 2;
  const handleCol = gold ? '#9b3f22' : P.woodD;
  const handle = (s: number) => (c: Ctx) => {
    const x0 = s * (xb - 1.5);
    const x1 = s * (L / 2 - knob);
    roundRectPath(c, Math.min(x0, x1), -hr, Math.abs(x1 - x0), hr * 2, hr);
    circlePath(c, x1, 0, knob);
  };
  const barrel = (c: Ctx) => roundRectPath(c, -xb, -br, bw, br * 2, br * 0.7);
  const hStyle = {
    fill: handleCol,
    shadowOffset: [-0.3, -hr * 0.8] as Pt,
    gloss: [
      { x: -(L / 2 - knob) - knob * 0.25, y: -knob * 0.4, rx: knob * 0.45, ry: knob * 0.3, alpha: 0.55 },
      { x: L / 2 - knob - knob * 0.25, y: -knob * 0.4, rx: knob * 0.45, ry: knob * 0.3, alpha: 0.55 },
    ],
  };
  G(ctx, [
    { build: handle(-1), style: hStyle },
    { build: handle(1), style: hStyle },
    {
      build: barrel,
      style: gold
        ? { fill: cylGrad(ctx, -br, br, GOLD_CYL), shadow: 'none', gloss: [{ x: -bw * 0.06, y: -br * 0.5, rx: bw * 0.38, ry: br * 0.14, alpha: 0.85 }] }
        : { fill: P.wood, shadow: '#c17f45', shadowOffset: [-0.5, -br * 0.55], gloss: [{ x: -bw * 0.06, y: -br * 0.52, rx: bw * 0.38, ry: br * 0.15, alpha: 0.5 }] },
    },
  ], ink);
  // handle grooves
  for (const s of [-1, 1]) {
    const gx = s * (xb + (L / 2 - knob - xb) * 0.45);
    line(ctx, [[gx, -hr * 0.85], [gx, hr * 0.85]], Math.max(0.5, ink * 0.4), gold ? '#5e2112' : P.woodDD, false, 0.8);
  }
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, -xb, -br, bw, br * 2, br * 0.7);
  ctx.clip();
  if (!gold) {
    // wood grain
    const R = rng(Math.round(L * 7));
    for (let i = 0; i < 4; i++) {
      const y = -br * 0.6 + i * br * 0.42 + (R() - 0.5) * br * 0.2;
      const x0 = -xb + R() * bw * 0.3, x1 = x0 + bw * (0.3 + R() * 0.4);
      line(ctx, [[x0, y], [(x0 + x1) / 2, y + br * 0.08], [x1, y - br * 0.04]], Math.max(0.35, L * 0.012), '#b8773c', true, 0.55);
    }
    if (o.flour !== false) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      ellipsePath(ctx, xb * 0.5, br * 0.3, bw * 0.13, br * 0.38, 0.1);
      ellipsePath(ctx, -xb * 0.45, br * 0.5, bw * 0.08, br * 0.28, -0.1);
      ctx.fill();
      ctx.globalAlpha = 1;
      speckle(ctx, xb * 0.35, br * 0.25, xb * 0.35, br * 0.5, Math.round(L * 0.18), '#fffaf0', Math.max(0.3, L * 0.01), 11, 0.8);
    }
  } else {
    // engraved rings + central filigree band
    for (const s of [-1, 1]) {
      for (const k of [0.3, 0.36]) {
        line(ctx, [[s * bw * k, -br], [s * bw * k, br]], Math.max(0.5, ink * 0.35), '#a8620f', false, 0.85);
      }
    }
    ctx.fillStyle = rgba('#b8700f', 0.55);
    ctx.fillRect(-bw * 0.09, -br, bw * 0.18, br * 2);
    // diamond lattice
    ctx.strokeStyle = rgba('#fff3b4', 0.9);
    ctx.lineWidth = Math.max(0.35, L * 0.012);
    ctx.beginPath();
    const n = 3;
    for (let i = 0; i <= n; i++) {
      const x = -bw * 0.09 + (i / n) * bw * 0.18;
      ctx.moveTo(x - bw * 0.03, -br);
      ctx.lineTo(x + bw * 0.03, br);
      ctx.moveTo(x + bw * 0.03, -br);
      ctx.lineTo(x - bw * 0.03, br);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (gold) {
    // ruby set in the middle band
    S(ctx, (c) => ellipsePath(c, 0, -br * 0.05, bw * 0.045, br * 0.42), { fill: '#e2243b', ink: ink * 0.55, shadowOffset: [-0.4, -0.6], gloss: [{ x: -bw * 0.015, y: -br * 0.25, rx: bw * 0.018, ry: br * 0.14, alpha: 0.9 }] });
  }
}

// ---------------------------------------------------------------------------
// Coltello — chef knife, blade pointing right
// ---------------------------------------------------------------------------
export function chefKnife(ctx: Ctx, L: number, o: { ink?: number; mat?: 'steel' | 'blue' | 'gold'; handle?: string } = {}) {
  const ink = o.ink ?? 1.5;
  const mat = o.mat ?? 'steel';
  const hx0 = -L / 2, hx1 = -L / 2 + L * 0.33;
  const hh = L * 0.068;
  const spine = -L * 0.075;
  const heel = L * 0.135;
  const tipX = L / 2, tipY = spine + L * 0.035;
  const blade = (c: Ctx) => {
    c.moveTo(hx1, spine);
    c.lineTo(tipX - L * 0.2, spine + L * 0.002);
    c.quadraticCurveTo(tipX - L * 0.06, spine + L * 0.006, tipX, tipY);
    c.quadraticCurveTo(tipX - L * 0.1, heel * 0.98, hx1 + L * 0.16, heel);
    c.lineTo(hx1, heel);
    c.closePath();
  };
  const handleCol = o.handle ?? (mat === 'gold' ? '#7b2b1a' : mat === 'blue' ? '#273049' : '#3a2620');
  const bladeFill =
    mat === 'gold' ? goldGrad(ctx, 0, spine, 0, heel)
      : mat === 'blue' ? linear(ctx, 0, spine, 0, heel, [[0, '#e8f6ff'], [0.35, '#a6d8ff'], [0.75, '#5aa2e6'], [1, '#3a78c4']])
        : linear(ctx, 0, spine, 0, heel, [[0, '#eef2f7'], [0.25, '#cfd7e2'], [0.7, '#9eabbd'], [1, '#7e8ba1']]);
  G(ctx, [
    {
      build: (c) => roundRectPath(c, hx0, -hh + L * 0.005, hx1 - hx0 + L * 0.02, hh * 2, hh),
      style: { fill: handleCol, shadowOffset: [-0.3, -hh * 0.55], gloss: [{ x: (hx0 + hx1) / 2 - L * 0.02, y: -hh * 0.45, rx: L * 0.11, ry: hh * 0.28, alpha: 0.35 }] },
    },
    {
      build: blade,
      style: { fill: bladeFill, shadow: 'none' },
    },
  ], ink);
  // bevel along the edge
  ctx.save();
  ctx.beginPath();
  blade(ctx);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(hx1 + L * 0.02, heel - L * 0.035);
  ctx.lineTo(hx1 + L * 0.16, heel - L * 0.035);
  ctx.quadraticCurveTo(tipX - L * 0.12, heel * 0.93 - L * 0.035, tipX - L * 0.02, tipY + L * 0.006);
  ctx.lineWidth = Math.max(0.4, L * 0.022);
  ctx.strokeStyle = mat === 'gold' ? rgba('#fff8d0', 0.9) : 'rgba(255,255,255,0.95)';
  ctx.stroke();
  ctx.restore();
  // spine glint
  line(ctx, [[hx1 + L * 0.04, spine + L * 0.022], [tipX - L * 0.2, spine + L * 0.022]], Math.max(0.35, L * 0.016), '#ffffff', false, 0.8);
  // bolster
  S(ctx, (c) => roundRectPath(c, hx1 - L * 0.025, -hh * 1.12, L * 0.045, hh * 2.24, L * 0.012), {
    fill: mat === 'gold' ? '#ffd65a' : '#cdd5df', ink: ink * 0.7, shadowOffset: [-0.3, -0.5],
  });
  // rivets
  for (let i = 0; i < 3; i++) {
    const rx = hx0 + L * 0.07 + i * L * 0.085;
    S(ctx, (c) => circlePath(c, rx, L * 0.005, Math.max(0.35, L * 0.017)), { fill: mat === 'gold' ? '#ffe27a' : '#e7ecf2', ink: 0, shadow: 'none' });
  }
}

// ---------------------------------------------------------------------------
// Olive (pointing right: stem dimple at the back/left)
// ---------------------------------------------------------------------------
export function olive(ctx: Ctx, r: number, o: { ink?: number; gold?: boolean; color?: string; leaf?: boolean } = {}) {
  const ink = o.ink ?? 1.3;
  const gold = !!o.gold;
  const base = o.color ?? '#8db53a';
  S(ctx, (c) => ellipsePath(c, 0, 0, r * 1.2, r * 0.92), {
    fill: gold ? goldBall(ctx, 0, 0, r * 1.15) : radial(ctx, -r * 0.3, -r * 0.35, r * 1.5, [[0, light(base, 0.35)], [0.45, base], [1, shade(base, 0.25)]]),
    ink,
    shadow: gold ? '#cc7f14' : shade(base, 0.3),
    shadowOffset: [-r * 0.28, -r * 0.32],
    gloss: [
      { x: -r * 0.42, y: -r * 0.4, rx: r * 0.42, ry: r * 0.22, rot: -0.35, alpha: 0.9 },
      { x: r * 0.55, y: r * 0.45, rx: r * 0.18, ry: r * 0.08, rot: -0.5, alpha: 0.35 },
    ],
  });
  // stem dimple
  ctx.save();
  ctx.fillStyle = gold ? '#a8620f' : '#55701f';
  ctx.beginPath();
  ellipsePath(ctx, -r * 1.02, 0, r * 0.14, r * 0.2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Forchetta — fork, tines pointing right
// ---------------------------------------------------------------------------
export function fork(ctx: Ctx, L: number, o: { ink?: number; tines?: number; gold?: boolean } = {}) {
  const ink = o.ink ?? 1.3;
  const n = o.tines ?? 4;
  const gold = !!o.gold;
  const w1 = L * 0.07, w2 = L * 0.03, w3 = L * 0.12;
  const xn = -L * 0.02, xh = L * 0.15, xt = L / 2;
  const body = (c: Ctx) => {
    c.moveTo(-L / 2 + w1, -w1);
    c.quadraticCurveTo(-L * 0.2, -w1 * 0.9, xn, -w2);
    c.quadraticCurveTo(xh - L * 0.06, -w2, xh, -w3);
    c.lineTo(xh + L * 0.03, -w3);
    c.lineTo(xh + L * 0.03, w3);
    c.lineTo(xh, w3);
    c.quadraticCurveTo(xh - L * 0.06, w2, xn, w2);
    c.quadraticCurveTo(-L * 0.2, w1 * 0.9, -L / 2 + w1, w1);
    c.arc(-L / 2 + w1, 0, w1, Math.PI / 2, -Math.PI / 2);
    c.closePath();
  };
  const gap = (w3 * 2) / (n * 2.6);
  const tw = (w3 * 2 - gap * (n - 1)) / n;
  const tines = (c: Ctx) => {
    for (let i = 0; i < n; i++) {
      const y = -w3 + i * (tw + gap);
      c.moveTo(xh + L * 0.02, y);
      c.lineTo(xt - tw * 0.6, y);
      c.quadraticCurveTo(xt, y + tw * 0.15, xt, y + tw / 2);
      c.quadraticCurveTo(xt, y + tw * 0.85, xt - tw * 0.6, y + tw);
      c.lineTo(xh + L * 0.02, y + tw);
      c.closePath();
    }
  };
  const fill = gold ? goldGrad(ctx, 0, -w3, 0, w3) : linear(ctx, 0, -w3, 0, w3, [[0, '#ffffff'], [0.45, '#dfe6ee'], [1, '#9eabbd']]);
  G(ctx, [
    { build: body, style: { fill, shadow: 'none', gloss: [{ x: -L * 0.3, y: -w1 * 0.4, rx: L * 0.12, ry: w1 * 0.25, alpha: 0.85 }] } },
    { build: tines, style: { fill, shadow: 'none' } },
  ], ink);
  // engraved handle line
  line(ctx, [[-L * 0.44, 0], [-L * 0.16, 0]], Math.max(0.3, L * 0.012), gold ? '#b86f10' : '#8f9bb0', false, 0.6);
}

// ---------------------------------------------------------------------------
// Tridente — golden trident, prongs pointing right
// ---------------------------------------------------------------------------
export function trident(ctx: Ctx, L: number, o: { ink?: number } = {}) {
  const ink = o.ink ?? 1.4;
  const t = L * 0.06; // prong thickness
  const xc = L * 0.1; // crossbar centre x
  const yo = L * 0.17; // outer prong offset
  const xp = L * 0.38; // outer prong tips
  const gold = goldGrad(ctx, -L / 2, -yo, L / 2, yo);
  // inked underlay for shaft + crossbar + prongs (one silhouette)
  const paths: Pt[][] = [
    [[-L / 2 + t, 0], [xc, 0]],
    [[xc + L * 0.06, -yo], [xc - L * 0.02, -yo * 0.55], [xc, 0], [xc - L * 0.02, yo * 0.55], [xc + L * 0.06, yo]],
    [[xc, 0], [L / 2 - L * 0.1, 0]],
    [[xc + L * 0.05, -yo], [xp - L * 0.04, -yo]],
    [[xc + L * 0.05, yo], [xp - L * 0.04, yo]],
  ];
  const heads: Pt[][] = [
    [[L / 2 - L * 0.13, -t * 1.6], [L / 2, 0], [L / 2 - L * 0.13, t * 1.6], [L / 2 - L * 0.1, 0]],
    [[xp - L * 0.08, -yo - t * 1.4], [xp + L * 0.06, -yo - t * 0.2], [xp - L * 0.08, -yo + t * 1.2], [xp - L * 0.05, -yo]],
    [[xp - L * 0.08, yo - t * 1.2], [xp + L * 0.06, yo + t * 0.2], [xp - L * 0.08, yo + t * 1.4], [xp - L * 0.05, yo]],
  ];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  for (const p of paths) {
    ctx.beginPath();
    smoothPath(ctx, p, false);
    ctx.lineWidth = t + ink * 2;
    ctx.stroke();
  }
  for (const h of heads) {
    ctx.beginPath();
    polyPath(ctx, h);
    ctx.lineWidth = ink * 2;
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of paths) {
    ctx.beginPath();
    smoothPath(ctx, p, false);
    ctx.lineWidth = t;
    ctx.strokeStyle = gold;
    ctx.stroke();
  }
  ctx.restore();
  for (const h of heads) {
    S(ctx, (c) => polyPath(c, h), { fill: gold, ink: 0, shadow: '#d08a18', shadowOffset: [-0.5, -0.8] });
  }
  // highlights
  const [hx, hy] = lit(ctx, -t * 0.2, -t * 0.25);
  for (const p of paths) line(ctx, p.map(([x, y]) => [x + hx, y + hy] as Pt), t * 0.3, '#fff8d2', true, 0.75);
  // shaft wraps (spiral bands)
  for (let i = 0; i < 4; i++) {
    const x = -L * 0.36 + i * L * 0.06;
    line(ctx, [[x, -t * 0.5], [x + L * 0.025, t * 0.5]], Math.max(0.4, t * 0.3), '#b5680e', false, 0.85);
  }
  // sea-blue gem at the crossbar
  S(ctx, (c) => circlePath(c, xc, 0, t * 0.95), {
    fill: '#3fc2e8', ink: ink * 0.7, shadow: '#1d7fb6', shadowOffset: [-0.4, -0.5],
    gloss: [{ x: xc - t * 0.35, y: -t * 0.35, rx: t * 0.35, ry: t * 0.22, alpha: 0.9 }],
  });
}

// ---------------------------------------------------------------------------
// Pizza — dough disc + margherita (TOP VIEW)
// ---------------------------------------------------------------------------
function rimPts(r: number, seed: number, wob = 0.05, n = 18): Pt[] {
  const R = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (R() * 2 - 1) * wob;
    pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]);
  }
  return pts;
}

export function doughDisc(ctx: Ctx, r: number, o: { ink?: number; seed?: number } = {}) {
  const ink = o.ink ?? 1.5;
  const rim = rimPts(r, o.seed ?? 5, 0.045);
  S(ctx, (c) => smoothPath(c, rim), {
    fill: radial(ctx, -r * 0.25, -r * 0.3, r * 1.2, [[0, '#fbedcc'], [0.6, '#f3d9a6'], [1, '#e2b977']]),
    ink,
    shadow: '#d9a862',
    shadowOffset: [-r * 0.1, -r * 0.12],
  });
  // inner edge of the puffy cornicione
  ctx.save();
  ctx.beginPath();
  smoothPath(ctx, rimPts(r * 0.74, (o.seed ?? 5) + 3, 0.05, 14));
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = rgba('#d7a964', 0.55);
  ctx.stroke();
  ctx.fillStyle = rgba('#fff6df', 0.55);
  ctx.fill();
  ctx.restore();
  // spiral stretch marks (makes the spin read)
  ctx.save();
  ctx.strokeStyle = rgba('#e3bd7e', 0.6);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.4, r * 0.04);
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    const a0 = (k / 3) * Math.PI * 2;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const a = a0 + t * 2.2;
      const d = r * (0.12 + t * 0.5);
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  // flour dusting
  speckle(ctx, -r * 0.1, -r * 0.05, r * 0.6, r * 0.6, Math.round(r * 1.4), '#ffffff', r * 0.035, 21, 0.85);
  // soft blisters on the rim with a little char
  const bub: [number, number, number][] = [[0.6, -0.5, 0.12], [-0.74, 0.28, 0.1], [0.18, 0.8, 0.09]];
  for (const [bx, by, br] of bub) {
    ctx.save();
    ctx.fillStyle = rgba('#fff3d6', 0.9);
    ctx.beginPath();
    ellipsePath(ctx, bx * r, by * r, br * r, br * r * 0.8, Math.atan2(by, bx));
    ctx.fill();
    ctx.fillStyle = rgba('#7a4520', 0.6);
    ctx.beginPath();
    ellipsePath(ctx, bx * r + br * r * 0.25, by * r + br * r * 0.25, br * r * 0.38, br * r * 0.28, Math.atan2(by, bx));
    ctx.fill();
    ctx.restore();
  }
  glint(ctx, -r * 0.35, -r * 0.4, r * 0.18, r * 0.08, -0.7, 0.55);
}

export function margherita(ctx: Ctx, r: number, o: { ink?: number; seed?: number } = {}) {
  const ink = o.ink ?? 1.6;
  const seed = o.seed ?? 9;
  const rim = rimPts(r, seed, 0.04, 20);
  // crust
  S(ctx, (c) => smoothPath(c, rim), {
    fill: radial(ctx, -r * 0.3, -r * 0.3, r * 1.3, [[0, '#f8d38f'], [0.7, '#e9b263'], [1, '#c9843d']]),
    ink,
    shadow: '#b9763a',
    shadowOffset: [-r * 0.08, -r * 0.1],
  });
  // leopard spots on the crust
  const R = rng(seed + 1);
  ctx.save();
  for (let i = 0; i < 11; i++) {
    const a = R() * Math.PI * 2;
    const d = r * (0.84 + R() * 0.08);
    ctx.fillStyle = rgba('#4a2412', 0.75);
    ctx.beginPath();
    ellipsePath(ctx, Math.cos(a) * d, Math.sin(a) * d, r * (0.035 + R() * 0.03), r * (0.025 + R() * 0.02), a);
    ctx.fill();
  }
  ctx.restore();
  // sauce
  const sauce = rimPts(r * 0.76, seed + 2, 0.06, 16);
  S(ctx, (c) => smoothPath(c, sauce), {
    fill: radial(ctx, -r * 0.2, -r * 0.2, r * 0.9, [[0, '#f0553b'], [1, '#c92a22']]),
    ink: ink * 0.55,
    inkColor: '#8a3a1c',
    shadow: 'none',
  });
  // mozzarella blobs
  const moz: [number, number, number][] = [[-0.35, -0.3, 0.2], [0.32, -0.32, 0.17], [0.05, 0.12, 0.19], [-0.38, 0.38, 0.16], [0.4, 0.36, 0.15]];
  moz.forEach(([x, y, s], i) => {
    S(ctx, (c) => {
      const pts = rimPts(s * r, seed + 10 + i, 0.18, 7).map(([px, py]) => [px + x * r, py + y * r] as Pt);
      smoothPath(c, pts);
    }, {
      fill: '#fffaf0', ink: ink * 0.45, inkColor: '#c8a070', shadow: '#efe0c4', shadowOffset: [-s * r * 0.25, -s * r * 0.3],
      gloss: [{ x: x * r - s * r * 0.3, y: y * r - s * r * 0.35, rx: s * r * 0.35, ry: s * r * 0.2, rot: -0.5, alpha: 0.9 }],
    });
  });
  // basil leaves
  const leaves: [number, number, number][] = [[-0.02, -0.5, -0.4], [0.55, 0.0, 1.3], [-0.6, 0.02, 2.6]];
  for (const [x, y, a] of leaves) {
    ctx.save();
    ctx.translate(x * r, y * r);
    ctx.rotate(a);
    basilLeaf(ctx, r * 0.36, { ink: ink * 0.55 });
    ctx.restore();
  }
  // olive-oil glints
  glint(ctx, -r * 0.1, -r * 0.05, r * 0.08, r * 0.04, -0.6, 0.7);
  glint(ctx, r * 0.18, r * 0.5, r * 0.06, r * 0.03, -0.6, 0.6);
}

// ---------------------------------------------------------------------------
// Rotella — pizza cutter wheel (round, face-on)
// ---------------------------------------------------------------------------
export function cutterWheel(ctx: Ctx, r: number, o: { ink?: number; gold?: boolean } = {}) {
  const ink = o.ink ?? 1.5;
  const gold = !!o.gold;
  const disc = gold
    ? goldBall(ctx, 0, 0, r)
    : radial(ctx, 0, 0, r, [[0, '#f2f5f9'], [0.55, '#d3dae4'], [0.86, '#aab5c5'], [0.9, '#f4f7fb'], [1, '#c7cfdb']], -r * 0.25, -r * 0.3);
  S(ctx, (c) => circlePath(c, 0, 0, r), { fill: disc, ink, shadow: 'none' });
  // sharpened bevel ring
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, r * 0.84);
  ctx.lineWidth = Math.max(0.4, r * 0.05);
  ctx.strokeStyle = gold ? rgba('#a8620f', 0.75) : rgba('#7d8aa0', 0.7);
  ctx.stroke();
  // shine arc (upper-left)
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.92, Math.PI * 1.05, Math.PI * 1.55);
  ctx.lineWidth = Math.max(0.5, r * 0.07);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.92, Math.PI * 0.08, Math.PI * 0.3);
  ctx.lineWidth = Math.max(0.4, r * 0.045);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.stroke();
  ctx.restore();
  // brushed face streak
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, r * 0.8);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.2);
  ctx.lineTo(r * 0.2, -r);
  ctx.lineTo(r * 0.45, -r);
  ctx.lineTo(-r, r * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // a dab of tomato on the blade (shows spin + it's a pizza cutter!)
  if (!gold) {
    ctx.save();
    ctx.beginPath();
    circlePath(ctx, 0, 0, r);
    ctx.clip();
    ctx.fillStyle = '#d8392b';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.97, Math.PI * 0.22, Math.PI * 0.55);
    ctx.arc(0, 0, r * 0.78, Math.PI * 0.5, Math.PI * 0.28, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff7a5c';
    ctx.beginPath();
    ellipsePath(ctx, Math.cos(Math.PI * 0.35) * r * 0.88, Math.sin(Math.PI * 0.35) * r * 0.88, r * 0.06, r * 0.035, Math.PI * 0.35 + Math.PI / 2);
    ctx.fill();
    ctx.restore();
  }
  // hub: 3-spoke cap
  const hubR = r * 0.34;
  S(ctx, (c) => circlePath(c, 0, 0, hubR), {
    fill: gold ? '#d8243a' : '#d8342e',
    ink: ink * 0.8,
    shadowOffset: [-hubR * 0.25, -hubR * 0.3],
    gloss: [{ x: -hubR * 0.35, y: -hubR * 0.4, rx: hubR * 0.38, ry: hubR * 0.22, rot: -0.6, alpha: 0.8 }],
  });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    line(ctx, [[Math.cos(a) * hubR * 0.25, Math.sin(a) * hubR * 0.25], [Math.cos(a) * hubR * 0.75, Math.sin(a) * hubR * 0.75]], Math.max(0.4, hubR * 0.16), gold ? '#ffe680' : '#7a1a18', false, 0.9);
  }
  S(ctx, (c) => circlePath(c, 0, 0, hubR * 0.28), { fill: gold ? '#fff2a0' : '#e8edf3', ink: ink * 0.5, shadow: 'none' });
}

// ---------------------------------------------------------------------------
// Peperoncino — red chilli, tip pointing right
// ---------------------------------------------------------------------------
export function chilli(ctx: Ctx, L: number, o: { ink?: number; color?: string; stem?: boolean } = {}) {
  const ink = o.ink ?? 1.4;
  const col = o.color ?? P.chilli;
  const x0 = -L * 0.36, w = L * 0.17;
  const body = (c: Ctx) => {
    c.moveTo(x0, -w * 0.95);
    c.bezierCurveTo(x0 + L * 0.3, -w * 1.15, L * 0.38, -w * 0.4, L * 0.5, w * 0.35);
    c.bezierCurveTo(L * 0.42, w * 0.2, L * 0.25, w * 0.95, x0 + L * 0.02, w * 0.95);
    c.bezierCurveTo(x0 - L * 0.07, w * 0.9, x0 - L * 0.07, -w * 0.9, x0, -w * 0.95);
    c.closePath();
  };
  S(ctx, body, {
    fill: radial(ctx, x0 + L * 0.2, -w * 0.5, L * 0.7, [[0, light(col, 0.3)], [0.5, col], [1, shade(col, 0.2)]]),
    ink,
    shadow: shade(col, 0.32),
    shadowOffset: [-L * 0.04, -w * 0.55],
    gloss: [
      { x: x0 + L * 0.24, y: -w * 0.55, rx: L * 0.17, ry: w * 0.2, rot: 0.06, alpha: 0.85 },
      { x: x0 + L * 0.04, y: -w * 0.45, rx: L * 0.03, ry: w * 0.16, rot: 0.3, alpha: 0.55 },
    ],
  });
  if (o.stem !== false) {
    // calyx cap
    S(ctx, (c) => {
      c.moveTo(x0 + L * 0.03, -w * 1.02);
      c.quadraticCurveTo(x0 + L * 0.1, -w * 0.4, x0 + L * 0.06, -w * 0.05);
      c.quadraticCurveTo(x0 + L * 0.11, w * 0.4, x0 + L * 0.03, w * 1.0);
      c.quadraticCurveTo(x0 - L * 0.1, w * 0.9, x0 - L * 0.1, 0);
      c.quadraticCurveTo(x0 - L * 0.1, -w * 0.9, x0 + L * 0.03, -w * 1.02);
      c.closePath();
    }, { fill: '#4fae3a', ink: ink * 0.9, shadow: '#2d7c2a', shadowOffset: [-L * 0.02, -w * 0.3] });
    tube(ctx, [[x0 - L * 0.08, 0], [x0 - L * 0.16, -w * 0.25], [x0 - L * 0.2, -w * 0.9]], Math.max(0.8, L * 0.05), '#5bbb44', ink * 0.85, true);
  }
}

// ---------------------------------------------------------------------------
// Moka — stovetop coffee pot (upright, spout on the right). H = total height
// ---------------------------------------------------------------------------
export function moka(ctx: Ctx, H: number, o: { ink?: number; turbo?: boolean } = {}) {
  const k = H / 40;
  const ink = o.ink ?? 2;
  const turbo = !!o.turbo;
  ctx.save();
  ctx.scale(k, k);
  const ik = ink / k;
  const body = turbo ? '#e2312c' : '#c9cfd8';
  const bodyL = turbo ? '#ff7a62' : '#eef2f6';
  const bodyD = turbo ? '#9c1620' : '#9199a7';
  // bottom chamber (boiler), waist, top chamber (collector), lid
  const boiler: Pt[] = [[-8.5, 7], [8.5, 7], [11, 19.5], [-11, 19.5]];
  const top: Pt[] = [[-7.6, 5.2], [7.6, 5.2], [10.4, -11.5], [-10.4, -11.5]];
  const lid: Pt[] = [[-10.4, -11.5], [10.4, -11.5], [8.4, -15.5], [-8.4, -15.5]];
  const spout: Pt[] = [[8.6, -11.6], [15.5, -14.2], [14.2, -11.2], [10, -6.5]];
  // handle (behind)
  S(ctx, (c) => {
    c.moveTo(-9.5, -9.5);
    c.lineTo(-17.5, -10.5);
    c.quadraticCurveTo(-19.5, -10.3, -19.2, -8);
    c.lineTo(-16.8, 3.5);
    c.quadraticCurveTo(-16.5, 5.2, -14.5, 4.5);
    c.lineTo(-8.5, 1.5);
    c.lineTo(-9, -2);
    c.lineTo(-13.6, -0.6);
    c.lineTo(-15, -7);
    c.lineTo(-9.5, -6.2);
    c.closePath();
  }, { fill: turbo ? '#2b2a30' : '#2f2a2a', ink: ik, shadow: '#141012', shadowOffset: [-0.8, -1], gloss: [{ x: -17.4, y: -6, rx: 0.7, ry: 3.5, rot: -0.2, alpha: 0.35 }] });
  G(ctx, [
    { build: (c) => polyPath(c, boiler), style: { fill: body, shadow: 'none' } },
    { build: (c) => roundRectPath(c, -8.4, 4.4, 16.8, 3.4, 0.8), style: { fill: bodyD, shadow: 'none' } },
    { build: (c) => polyPath(c, top), style: { fill: body, shadow: 'none' } },
    { build: (c) => polyPath(c, spout), style: { fill: body, shadow: 'none' } },
    { build: (c) => polyPath(c, lid), style: { fill: body, shadow: 'none' } },
  ], ik);
  // facets (octagonal look): left light, right dark
  const facet = (poly: Pt[], tl: number, tr: number, bl: number, br: number) => {
    // poly: [tl, tr, br, bl] corners of a trapezoid; facet split at 1/3 & 2/3
    const [a, b, c2, d] = poly;
    const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const t1a = lerp(a, b, tl), t2a = lerp(a, b, tr);
    const t1b = lerp(d, c2, bl), t2b = lerp(d, c2, br);
    ctx.save();
    ctx.fillStyle = bodyL;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    polyPath(ctx, [a, t1a, t1b, d]);
    ctx.fill();
    ctx.fillStyle = bodyD;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    polyPath(ctx, [t2a, b, c2, t2b]);
    ctx.fill();
    ctx.restore();
    line(ctx, [t1a, t1b], 0.6 / k * k, rgba('#5c6372', 0.5));
    line(ctx, [t2a, t2b], 0.6, rgba('#5c6372', 0.5));
  };
  facet([[-8.5, 7], [8.5, 7], [11, 19.5], [-11, 19.5]], 0.3, 0.7, 0.3, 0.7);
  facet([[-10.4, -11.5], [10.4, -11.5], [7.6, 5.2], [-7.6, 5.2]], 0.3, 0.7, 0.3, 0.7);
  facet([[-8.4, -15.5], [8.4, -15.5], [10.4, -11.5], [-10.4, -11.5]], 0.3, 0.7, 0.3, 0.7);
  // gloss streaks
  glint(ctx, -6.5, -4, 0.9, 5.5, 0.15, turbo ? 0.65 : 0.85);
  glint(ctx, -7.2, 13, 0.9, 4, 0.12, turbo ? 0.6 : 0.8);
  // safety valve
  S(ctx, (c) => circlePath(c, 3.5, 12.5, 1.6), { fill: turbo ? '#ffd24a' : '#e3b44a', ink: 0.9 / k * k, shadow: 'none', gloss: [{ x: 3, y: 12, rx: 0.6, ry: 0.4, alpha: 0.9 }] });
  // lid knob
  S(ctx, (c) => {
    roundRectPath(c, -1.6, -18.3, 3.2, 3.2, 0.6);
    ellipsePath(c, 0, -19.2, 3.4, 2);
  }, { fill: '#2f2a2a', ink: ik * 0.85, shadow: '#141012', shadowOffset: [-0.6, -0.6], gloss: [{ x: -1.3, y: -19.9, rx: 1.3, ry: 0.6, alpha: 0.5 }] });
  if (turbo) {
    // chrome racing stripe
    ctx.save();
    ctx.beginPath();
    polyPath(ctx, boiler);
    polyPath(ctx, top);
    ctx.clip();
    ctx.fillStyle = '#f4f6fa';
    ctx.fillRect(-1.6, -12, 3.2, 32);
    ctx.fillStyle = '#9aa5b5';
    ctx.fillRect(0.9, -12, 0.7, 32);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Lava rock + meteor
// ---------------------------------------------------------------------------
export function rockPts(r: number, seed: number, n = 9, jag = 0.22): Pt[] {
  const R = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (R() - 0.5) * 0.3;
    const k = 1 - jag / 2 + R() * jag;
    pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]);
  }
  return pts;
}

export function lavaRock(ctx: Ctx, r: number, o: { ink?: number; seed?: number; hot?: number } = {}) {
  const ink = o.ink ?? 1.4;
  const seed = o.seed ?? 4;
  const pts = rockPts(r, seed);
  const hot = o.hot ?? 1;
  S(ctx, (c) => {
    // slightly rounded polygon
    polyPath(c, pts);
  }, {
    fill: radial(ctx, -r * 0.3, -r * 0.35, r * 1.3, [[0, '#7b5a52'], [0.6, '#4a3431'], [1, '#2e1f1e']]),
    ink,
    shadow: '#2a1a1a',
    shadowOffset: [-r * 0.2, -r * 0.24],
  });
  // facet highlights
  ctx.save();
  ctx.beginPath();
  polyPath(ctx, pts);
  ctx.clip();
  ctx.fillStyle = rgba('#a07a6c', 0.5);
  ctx.beginPath();
  polyPath(ctx, [pts[4], pts[5], pts[6], [0, -r * 0.1]]);
  ctx.fill();
  // glowing crack network
  const R = rng(seed + 9);
  const j = () => (R() - 0.5) * 0.12;
  const base: Pt[][] = [
    [[-0.75, -0.05], [-0.35, 0.08], [-0.05, -0.12], [0.3, -0.05], [0.7, 0.18]],
    [[-0.05, -0.12], [0.05, -0.45], [-0.1, -0.75]],
    [[-0.35, 0.08], [-0.25, 0.42], [0.05, 0.62]],
    [[0.3, -0.05], [0.42, 0.4]],
  ];
  const cracks: Pt[][] = base.map((p) => p.map(([x, y]) => [(x + j()) * r, (y + j()) * r] as Pt));
  for (const p of cracks) line(ctx, p, r * 0.24, rgba('#ff5a1a', 0.55 * hot), false);
  for (const p of cracks) line(ctx, p, r * 0.11, hot > 0.5 ? '#ffb43a' : '#e0661e', false);
  for (const p of cracks) line(ctx, p, r * 0.045, rgba('#fff3b0', hot), false);
  ctx.restore();
  // hot rim on the lower-right (lit by its own glow)
  ctx.save();
  ctx.beginPath();
  polyPath(ctx, pts);
  ctx.clip();
  const g = ctx.createRadialGradient(r * 0.7, r * 0.7, 0, r * 0.7, r * 0.7, r * 1.1);
  g.addColorStop(0, rgba('#ff7a2a', 0.55 * hot));
  g.addColorStop(1, rgba('#ff7a2a', 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
  ctx.restore();
}

/** Flame tongue path pointing in -x (tail), from (0,0) back to (-len,0). */
export function flameTailPath(ctx: Ctx, len: number, w: number, seed: number, waves = 3) {
  const R = rng(seed);
  const top: Pt[] = [];
  const bot: Pt[] = [];
  for (let i = 0; i <= waves * 2; i++) {
    const t = i / (waves * 2);
    const ww = w * Math.pow(1 - t, 0.9) * (0.85 + R() * 0.3);
    const x = -len * t;
    top.push([x, -ww + (i % 2 ? w * 0.18 : 0)]);
    bot.push([x, ww - (i % 2 ? 0 : w * 0.14)]);
  }
  const pts: Pt[] = [[w * 0.55, 0], ...top.slice(0, -1), [-len, (R() - 0.5) * w * 0.4], ...bot.slice(0, -1).reverse()];
  smoothPath(ctx, pts, true, 0.6);
}

export function meteor(ctx: Ctx, L: number, o: { ink?: number; seed?: number } = {}) {
  const ink = o.ink ?? 1.4;
  const r = L * 0.25;
  const cx = L / 2 - r - 1.2;
  ctx.save();
  ctx.translate(cx, 0);
  // fire tail (layered)
  const len = L - r * 2 - 2;
  S(ctx, (c) => flameTailPath(c, len + r * 0.5, r * 1.25, (o.seed ?? 3) + 1), { fill: '#e8402a', ink: ink * 0.85, shadow: 'none' });
  ctx.save();
  ctx.fillStyle = '#ff8f2a';
  ctx.beginPath();
  ctx.translate(-r * 0.15, 0);
  flameTailPath(ctx, len * 0.8, r * 0.95, (o.seed ?? 3) + 2);
  ctx.fill();
  ctx.fillStyle = '#ffd75a';
  ctx.beginPath();
  flameTailPath(ctx, len * 0.55, r * 0.62, (o.seed ?? 3) + 3);
  ctx.fill();
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath();
  flameTailPath(ctx, len * 0.3, r * 0.35, (o.seed ?? 3) + 4);
  ctx.fill();
  ctx.restore();
  lavaRock(ctx, r, { ink, seed: (o.seed ?? 3) + 7 });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Forma — Parmigiano wheel, face-on disc (rolls when the engine rotates it)
// ---------------------------------------------------------------------------
export function cheeseDisc(ctx: Ctx, r: number, o: { ink?: number; gold?: boolean } = {}) {
  const ink = o.ink ?? 2;
  const gold = !!o.gold;
  const rindCol = gold ? goldBall(ctx, 0, 0, r) : radial(ctx, -r * 0.3, -r * 0.3, r * 1.3, [[0, '#e9a94c'], [0.7, '#cf8a33'], [1, '#a9661f']]);
  S(ctx, (c) => circlePath(c, 0, 0, r), { fill: rindCol, ink, shadow: gold ? '#c67a12' : '#94561a', shadowOffset: [-r * 0.07, -r * 0.08] });
  // dotted "lettering" band on the rind: pin-dot glyph groups (abstract, no real text)
  ctx.save();
  ctx.fillStyle = gold ? '#9a560c' : '#5a300e';
  const groups = 11;
  const R = rng(17);
  const dotR = Math.max(0.42, r * 0.026);
  for (let gi = 0; gi < groups; gi++) {
    const a0 = (gi / groups) * Math.PI * 2 + 0.12;
    const cols = 3 + Math.floor(R() * 2);
    for (let ci = 0; ci < cols; ci++) {
      for (let row = 0; row < 3; row++) {
        if (R() < 0.28) continue;
        const a = a0 + ci * (dotR * 2.6) / r;
        const d = r * 0.84 + row * dotR * 2.5 + dotR;
        ctx.beginPath();
        circlePath(ctx, Math.cos(a) * d, Math.sin(a) * d, dotR);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  // paste face
  const fr = r * 0.78;
  S(ctx, (c) => circlePath(c, 0, 0, fr), {
    fill: gold ? radial(ctx, -fr * 0.3, -fr * 0.35, fr * 1.2, [[0, '#fff8c8'], [0.5, '#ffe178'], [1, '#f2b638']]) : radial(ctx, -fr * 0.3, -fr * 0.35, fr * 1.2, [[0, '#fffbe6'], [0.55, '#f9e7a8'], [1, '#efcf7c']]),
    ink: ink * 0.6,
    inkColor: gold ? '#a86010' : '#9a6224',
    shadow: 'none',
  });
  // granular texture + tyrosine crystals
  speckle(ctx, 0, 0, fr * 0.9, fr * 0.9, Math.round(r * 2.2), gold ? '#d8901c' : '#d7aa52', r * 0.02, 33, 0.55);
  speckle(ctx, 0, 0, fr * 0.85, fr * 0.85, Math.round(r * 1.1), '#ffffff', r * 0.018, 34, 0.85);
  // concentric pressing ring + rind bevel (reads as a drum face)
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, fr * 0.62);
  ctx.lineWidth = Math.max(0.4, r * 0.022);
  ctx.strokeStyle = gold ? rgba('#e09a20', 0.6) : rgba('#d9ad5a', 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.9, Math.PI * 1.02, Math.PI * 1.48);
  ctx.lineWidth = Math.max(0.6, r * 0.05);
  ctx.lineCap = 'round';
  ctx.strokeStyle = gold ? 'rgba(255,250,210,0.85)' : 'rgba(255,225,160,0.7)';
  ctx.stroke();
  ctx.restore();
  // centre stamp (generic oval of dots)
  ctx.save();
  ctx.strokeStyle = gold ? rgba('#b86c10', 0.8) : rgba('#b17d33', 0.7);
  ctx.lineWidth = Math.max(0.4, r * 0.02);
  ctx.setLineDash([r * 0.02, r * 0.035]);
  ctx.beginPath();
  ellipsePath(ctx, 0, 0, fr * 0.36, fr * 0.26);
  ctx.stroke();
  ctx.restore();
  glint(ctx, -fr * 0.45, -fr * 0.5, fr * 0.22, fr * 0.1, -0.75, gold ? 0.85 : 0.6);
}

// ---------------------------------------------------------------------------
// Basilico — basil leaf (tip pointing right)
// ---------------------------------------------------------------------------
export function basilLeaf(ctx: Ctx, L: number, o: { ink?: number; color?: string; stem?: boolean; gold?: boolean } = {}) {
  const ink = o.ink ?? 1.2;
  const col = o.color ?? P.basil;
  const w = L * 0.3;
  const x0 = -L * 0.42, x1 = L * 0.5;
  const leaf = (c: Ctx) => {
    c.moveTo(x0, 0);
    c.bezierCurveTo(x0 + L * 0.12, -w * 1.25, x1 - L * 0.3, -w * 1.15, x1, 0);
    c.bezierCurveTo(x1 - L * 0.32, w * 1.05, x0 + L * 0.14, w * 1.15, x0, 0);
    c.closePath();
  };
  const fill = o.gold ? goldGrad(ctx, x0, -w, x1, w) : radial(ctx, -L * 0.1, -w * 0.5, L * 0.8, [[0, light(col, 0.28)], [0.6, col], [1, shade(col, 0.18)]]);
  S(ctx, leaf, {
    fill,
    ink,
    shadow: o.gold ? '#c88216' : shade(col, 0.28),
    shadowOffset: [-L * 0.03, -w * 0.5],
    gloss: [{ x: -L * 0.02, y: -w * 0.5, rx: L * 0.2, ry: w * 0.16, rot: -0.12, alpha: 0.6 }],
  });
  // midrib + side veins
  const vein = o.gold ? '#b8700f' : shade(col, 0.35);
  line(ctx, [[x0 + L * 0.02, 0], [L * 0.05, -w * 0.08], [x1 - L * 0.08, -w * 0.02]], Math.max(0.35, L * 0.035), vein, true, 0.85);
  for (let i = 0; i < 3; i++) {
    const x = x0 + L * (0.2 + i * 0.2);
    line(ctx, [[x, -w * 0.05], [x + L * 0.1, -w * 0.62 + i * 0.08 * w]], Math.max(0.3, L * 0.022), vein, true, 0.6);
    line(ctx, [[x, w * 0.02], [x + L * 0.1, w * 0.58 - i * 0.08 * w]], Math.max(0.3, L * 0.022), vein, true, 0.6);
  }
  if (o.stem) tube(ctx, [[x0 + L * 0.02, 0], [x0 - L * 0.1, w * 0.12], [x0 - L * 0.18, w * 0.3]], Math.max(0.6, L * 0.05), shade(col, 0.1), ink * 0.8, true);
}

// ---------------------------------------------------------------------------
// Small food bits shared by icons / pickups
// ---------------------------------------------------------------------------
export function tomatoBall(ctx: Ctx, r: number, o: { ink?: number; color?: string; plum?: number } = {}) {
  const ink = o.ink ?? 1.4;
  const col = o.color ?? P.tomato;
  const ry = r * (o.plum ?? 0.95);
  S(ctx, (c) => {
    c.moveTo(0, -ry * 0.85);
    c.bezierCurveTo(r * 0.75, -ry * 1.1, r * 1.05, -ry * 0.3, r * 0.98, ry * 0.2);
    c.bezierCurveTo(r * 0.9, ry * 0.85, r * 0.45, ry * 1.02, 0, ry * 1.0);
    c.bezierCurveTo(-r * 0.45, ry * 1.02, -r * 0.9, ry * 0.85, -r * 0.98, ry * 0.2);
    c.bezierCurveTo(-r * 1.05, -ry * 0.3, -r * 0.75, -ry * 1.1, 0, -ry * 0.85);
    c.closePath();
  }, {
    fill: radial(ctx, -r * 0.3, -r * 0.35, r * 1.4, [[0, light(col, 0.3)], [0.5, col], [1, shade(col, 0.2)]]),
    ink,
    shadow: shade(col, 0.3),
    shadowOffset: [-r * 0.22, -r * 0.26],
    gloss: [
      { x: -r * 0.42, y: -r * 0.35, rx: r * 0.3, ry: r * 0.18, rot: -0.7, alpha: 0.9 },
      { x: -r * 0.62, y: r * 0.05, rx: r * 0.07, ry: r * 0.12, rot: -0.2, alpha: 0.6 },
    ],
  });
  // calyx star
  calyx(ctx, 0, -ry * 0.82, r * 0.55, ink * 0.8);
}

export function calyx(ctx: Ctx, x: number, y: number, s: number, ink = 1) {
  S(ctx, (c) => {
    const n = 5;
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i / (n * 2)) * Math.PI * 2 + 0.2;
      const rr = i % 2 === 0 ? s : s * 0.32;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.55;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }, { fill: '#4cae3c', ink, shadow: '#2c7a2a', shadowOffset: [-s * 0.15, -s * 0.15] });
  tube(ctx, [[x, y], [x + s * 0.1, y - s * 0.35], [x + s * 0.3, y - s * 0.55]], Math.max(0.6, s * 0.22), '#5ab944', ink * 0.8, true);
}

/** Euro-style gold coin face. */
export function coinFace(ctx: Ctx, r: number, o: { ink?: number; back?: boolean } = {}) {
  const ink = o.ink ?? 1.4;
  S(ctx, (c) => circlePath(c, 0, 0, r), {
    fill: goldBall(ctx, 0, 0, r),
    ink,
    shadow: '#c27612',
    shadowOffset: [-r * 0.12, -r * 0.14],
  });
  // raised rim
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, r * 0.78);
  ctx.lineWidth = Math.max(0.4, r * 0.07);
  ctx.strokeStyle = rgba('#b8690f', 0.75);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-r * 0.02, -r * 0.02, r * 0.78, Math.PI * 1.0, Math.PI * 1.6);
  ctx.lineWidth = Math.max(0.3, r * 0.05);
  ctx.strokeStyle = 'rgba(255,250,215,0.9)';
  ctx.stroke();
  ctx.restore();
  // ring of tiny stars
  ctx.save();
  ctx.fillStyle = rgba('#a95f0c', 0.85);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    circlePath(ctx, Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, Math.max(0.25, r * 0.045));
    ctx.fill();
  }
  ctx.restore();
  if (!o.back) {
    // embossed € sign
    euroSign(ctx, 0, 0, r * 0.42, Math.max(0.6, r * 0.13));
  } else {
    // back: a laurel-ish embossed leaf
    ctx.save();
    ctx.strokeStyle = '#b06a10';
    ctx.lineWidth = Math.max(0.5, r * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r * 0.32, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(0, -r * 0.08);
    ctx.rotate(-Math.PI / 2);
    basilLeaf(ctx, r * 0.6, { ink: 0, gold: true });
    ctx.restore();
  }
  glint(ctx, -r * 0.4, -r * 0.42, r * 0.22, r * 0.1, -0.75, 0.9);
}

export function euroSign(ctx: Ctx, x: number, y: number, s: number, w: number) {
  const draw = (col: string, lw: number, ox: number, oy: number) => {
    ctx.save();
    ctx.translate(x + ox, y + oy);
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(s * 0.12, 0, s * 0.85, Math.PI * 0.28, Math.PI * 1.72);
    ctx.moveTo(-s * 0.95, -s * 0.18);
    ctx.lineTo(s * 0.25, -s * 0.18);
    ctx.moveTo(-s * 0.95, s * 0.2);
    ctx.lineTo(s * 0.15, s * 0.2);
    ctx.stroke();
    ctx.restore();
  };
  draw('#fff6c6', w, -w * 0.25, -w * 0.3);
  draw('#a65d0b', w, w * 0.15, w * 0.2);
  draw('#e9a221', w * 0.8, 0, 0);
}

// ---------------------------------------------------------------------------
// Flames, anger marks, noodles, wings — shared by icons & FX
// ---------------------------------------------------------------------------

/** Flame silhouette, base centred at (x,y), rising to y-h. */
export function flamePath(ctx: Ctx, x: number, y: number, w: number, h: number, seed = 1, lean = 0) {
  const R = rng(seed);
  const j = (v: number) => v * (0.88 + R() * 0.24);
  const pts: Pt[] = [
    [x, y],
    [x - j(w * 0.78), y - h * 0.08],
    [x - j(w), y - h * 0.32],
    [x - j(w * 0.78), y - h * 0.58],
    [x - w * 0.62 + lean * h * 0.55, y - j(h * 0.86)],
    [x - w * 0.3 + lean * h * 0.4, y - h * 0.62],
    [x - w * 0.12 + lean * h, y - h],
    [x + w * 0.22 + lean * h * 0.6, y - h * 0.68],
    [x + w * 0.56 + lean * h * 0.5, y - j(h * 0.8)],
    [x + j(w * 0.8), y - h * 0.48],
    [x + j(w * 0.98), y - h * 0.24],
    [x + j(w * 0.72), y - h * 0.06],
  ];
  smoothPath(ctx, pts, true, 0.42);
}

/** Layered cartoon flame (red → orange → yellow → white core). */
export function flame(ctx: Ctx, x: number, y: number, w: number, h: number, o: { ink?: number; seed?: number; lean?: number; cool?: boolean } = {}) {
  const seed = o.seed ?? 1;
  const lean = o.lean ?? 0;
  const ink = o.ink ?? 0;
  S(ctx, (c) => flamePath(c, x, y, w, h, seed, lean), { fill: o.cool ? '#ff8a2a' : '#ee3b24', ink, shadow: 'none' });
  ctx.save();
  ctx.fillStyle = o.cool ? '#ffc23a' : '#ff8d26';
  ctx.beginPath();
  flamePath(ctx, x + w * 0.04, y - h * 0.02, w * 0.74, h * 0.78, seed + 1, lean);
  ctx.fill();
  ctx.fillStyle = '#ffd34a';
  ctx.beginPath();
  flamePath(ctx, x + w * 0.06, y - h * 0.03, w * 0.48, h * 0.55, seed + 2, lean * 0.8);
  ctx.fill();
  ctx.fillStyle = '#fff6cf';
  ctx.beginPath();
  ellipsePath(ctx, x + w * 0.06, y - h * 0.16, w * 0.22, h * 0.15);
  ctx.fill();
  ctx.restore();
}

/** Cartoon anger mark (four inward-cornered curves). */
export function angerMark(ctx: Ctx, x: number, y: number, s: number, o: { ink?: number; color?: string } = {}) {
  const ink = o.ink ?? s * 0.12;
  const col = o.color ?? '#ff3b3b';
  const segs: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const build = (c: Ctx) => {
    for (const [sx, sy] of segs) {
      c.moveTo(x + sx * s * 0.28, y + sy * s * 0.95);
      c.quadraticCurveTo(x + sx * s * 0.3, y + sy * s * 0.3, x + sx * s * 0.95, y + sy * s * 0.28);
    }
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = s * 0.34 + ink * 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = s * 0.34;
  ctx.strokeStyle = col;
  ctx.stroke();
  ctx.beginPath();
  for (const [sx, sy] of segs) {
    ctx.moveTo(x + sx * s * 0.25 - s * 0.05, y + sy * s * 0.8 - s * 0.05);
    ctx.quadraticCurveTo(x + sx * s * 0.27 - s * 0.05, y + sy * s * 0.27 - s * 0.05, x + sx * s * 0.8 - s * 0.05, y + sy * s * 0.25 - s * 0.05);
  }
  ctx.lineWidth = s * 0.1;
  ctx.strokeStyle = 'rgba(255,200,190,0.8)';
  ctx.stroke();
  ctx.restore();
}

/** Bundle of spaghetti strands following a centre path. */
export function noodles(ctx: Ctx, path: Pt[], n: number, spread: number, w: number, o: { ink?: number; color?: string; seed?: number } = {}) {
  const ink = o.ink ?? 1.1;
  const col = o.color ?? '#f6d26a';
  const R = rng(o.seed ?? 3);
  // normals
  const norms: Pt[] = path.map((p, i) => {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
  for (let k = 0; k < n; k++) {
    const off = n === 1 ? 0 : (k / (n - 1) - 0.5) * spread;
    const ph = R() * 6;
    const pts = path.map((p, i) => {
      const wob = Math.sin(i * 1.3 + ph) * spread * 0.18;
      return [p[0] + norms[i][0] * (off + wob), p[1] + norms[i][1] * (off + wob)] as Pt;
    });
    tube(ctx, pts, w, col, ink, true, '#fff6c8', 0.75);
  }
}

/** Angel wing (feathered), attached at (x,y), extending toward dir (1 = right, -1 = left). */
export function wing(ctx: Ctx, x: number, y: number, s: number, dir: number, ink = 1.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const build = (c: Ctx) => {
    c.moveTo(0, -s * 0.15);
    c.bezierCurveTo(s * 0.35, -s * 0.75, s * 0.95, -s * 0.95, s * 1.1, -s * 0.7);
    c.quadraticCurveTo(s * 1.15, -s * 0.5, s * 0.95, -s * 0.42);
    c.quadraticCurveTo(s * 1.05, -s * 0.22, s * 0.8, -s * 0.12);
    c.quadraticCurveTo(s * 0.88, s * 0.08, s * 0.58, s * 0.1);
    c.quadraticCurveTo(s * 0.55, s * 0.32, s * 0.28, s * 0.25);
    c.quadraticCurveTo(s * 0.1, s * 0.3, 0, s * 0.12);
    c.closePath();
  };
  S(ctx, build, {
    fill: '#ffffff', ink, shadow: '#cfd8ec', shadowOffset: [-s * 0.08 * dir, -s * 0.1],
    gloss: [{ x: s * 0.5, y: -s * 0.58, rx: s * 0.28, ry: s * 0.08, rot: -0.4, alpha: 0.9 }],
  });
  line(ctx, [[s * 0.3, -s * 0.2], [s * 0.85, -s * 0.48]], Math.max(0.4, s * 0.05), '#b9c5de', true, 0.9);
  line(ctx, [[s * 0.25, -s * 0.02], [s * 0.66, -s * 0.12]], Math.max(0.4, s * 0.05), '#b9c5de', true, 0.9);
  ctx.restore();
}

/** Heart path centred at (x,y); s = half-width. */
export function heartPath(ctx: Ctx, x: number, y: number, s: number) {
  ctx.moveTo(x, y + s * 0.95);
  ctx.bezierCurveTo(x - s * 0.18, y + s * 0.72, x - s * 1.05, y + s * 0.22, x - s * 1.0, y - s * 0.3);
  ctx.bezierCurveTo(x - s * 0.95, y - s * 0.88, x - s * 0.22, y - s * 1.02, x, y - s * 0.42);
  ctx.bezierCurveTo(x + s * 0.22, y - s * 1.02, x + s * 0.95, y - s * 0.88, x + s * 1.0, y - s * 0.3);
  ctx.bezierCurveTo(x + s * 1.05, y + s * 0.22, x + s * 0.18, y + s * 0.72, x, y + s * 0.95);
  ctx.closePath();
}

export function heart(ctx: Ctx, x: number, y: number, s: number, o: { ink?: number; color?: string } = {}) {
  const col = o.color ?? '#ec2f45';
  S(ctx, (c) => heartPath(c, x, y, s), {
    fill: radial(ctx, x - s * 0.3, y - s * 0.35, s * 1.5, [[0, light(col, 0.35)], [0.5, col], [1, shade(col, 0.2)]]),
    ink: o.ink ?? Math.max(1, s * 0.16),
    shadow: shade(col, 0.32),
    shadowOffset: [-s * 0.2, -s * 0.22],
    gloss: [
      { x: x - s * 0.5, y: y - s * 0.42, rx: s * 0.28, ry: s * 0.17, rot: -0.7, alpha: 0.95 },
      { x: x + s * 0.55, y: y - s * 0.5, rx: s * 0.1, ry: s * 0.06, rot: 0.5, alpha: 0.6 },
    ],
  });
}

/** Narrow silvery olive leaf at (x,y) pointing along angle a. */
export function oliveLeaf(ctx: Ctx, x: number, y: number, len: number, a: number, ink = 1.2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  const w = len * 0.17;
  S(ctx, (c) => {
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.45, -w * 1.6, len, 0);
    c.quadraticCurveTo(len * 0.45, w * 1.6, 0, 0);
    c.closePath();
  }, {
    fill: '#7f9e4a', ink, shadow: '#5b7a34', shadowOffset: [-len * 0.03, -w * 0.5],
    gloss: [{ x: len * 0.45, y: -w * 0.35, rx: len * 0.25, ry: w * 0.22, alpha: 0.35 }],
  });
  line(ctx, [[len * 0.06, 0], [len * 0.9, 0]], Math.max(0.3, len * 0.04), '#c8d8a0', false, 0.8);
  ctx.restore();
}

/** Small soft flour/smoke puff (inked lightly). */
export function puff(ctx: Ctx, x: number, y: number, r: number, o: { ink?: number; color?: string; shadow?: string; seed?: number; alpha?: number } = {}) {
  const R = rng(o.seed ?? 2);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  S(ctx, (c) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + R() * 0.5;
      circlePath(c, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.4, r * (0.48 + R() * 0.18));
    }
    circlePath(c, x, y, r * 0.62);
  }, { fill: o.color ?? '#fffaf0', ink: o.ink ?? 1.1, shadow: o.shadow ?? '#d9d4de', shadowOffset: [-r * 0.18, -r * 0.22] });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Ciabatta, 3/4 view from above: foot-shaped sole, domed upper, visible
// insole + fluffy opening. Toe points right. L = length.
// ---------------------------------------------------------------------------
const SOLE34: Pt[] = [
  [-0.5, 0.0], [-0.47, -0.1], [-0.38, -0.152], [-0.24, -0.158], [-0.06, -0.168], [0.12, -0.192], [0.29, -0.205],
  [0.43, -0.165], [0.5, -0.07], [0.5, 0.04], [0.45, 0.135], [0.33, 0.19], [0.17, 0.18], [0.04, 0.12],
  [-0.12, 0.1], [-0.28, 0.13], [-0.42, 0.125], [-0.485, 0.075],
];

export function slipper34(ctx: Ctx, L: number, o: { ink?: number; gold?: boolean } = {}) {
  const ink = o.ink ?? 1.8;
  const gold = !!o.gold;
  const sq = 0.62; // perspective squash of the sole outline
  const sole = SOLE34.map(([x, y]) => [x * L, y * L * sq] as Pt);
  const th = L * 0.075; // sole thickness
  // sole side wall
  S(ctx, (c) => {
    smoothPath(c, sole.map(([x, y]) => [x, y + th] as Pt));
  }, { fill: gold ? '#b36a0e' : '#6e4129', ink, shadow: 'none' });
  S(ctx, (c) => {
    // connect top & bottom outlines on the near side
    c.moveTo(-0.5 * L, 0);
    c.lineTo(-0.5 * L, th);
    c.lineTo(0.5 * L, th);
    c.lineTo(0.5 * L, 0);
    c.closePath();
  }, { fill: gold ? '#b36a0e' : '#6e4129', ink: 0, shadow: 'none' });
  line(ctx, [[-0.46 * L, th * 0.55], [0.47 * L, th * 0.45]], Math.max(0.4, L * 0.012), gold ? '#ffd76a' : '#a8714a', false, 0.7);
  // insole (top surface)
  S(ctx, (c) => smoothPath(c, sole), {
    fill: gold ? '#fff2d6' : '#efd5a8', ink, shadow: gold ? '#e6c690' : '#d8b482', shadowOffset: [-L * 0.03, -L * 0.03],
  });
  // heel imprint
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = gold ? '#d9a860' : '#a8794a';
  ctx.beginPath();
  ellipsePath(ctx, -0.33 * L, 0, 0.09 * L, 0.06 * L);
  ctx.fill();
  ctx.restore();
  // upper (dome over the front)
  const N: Pt = [-0.06 * L, 0.085 * L];
  const T: Pt = [0.5 * L, 0.005 * L];
  const D: Pt = [-0.02 * L, -0.2 * L];
  const upper = (c: Ctx) => {
    c.moveTo(N[0], N[1]);
    c.bezierCurveTo(0.12 * L, 0.15 * L, 0.38 * L, 0.14 * L, T[0], T[1]);
    c.bezierCurveTo(0.5 * L, -0.2 * L, 0.2 * L, -0.31 * L, D[0], D[1]);
    c.quadraticCurveTo(-0.17 * L, -0.06 * L, N[0], N[1]);
    c.closePath();
  };
  const fabric = gold ? goldGrad(ctx, -0.05 * L, -0.28 * L, 0.45 * L, 0.12 * L) : '#4a68bd';
  S(ctx, upper, {
    fill: fabric, ink, shadow: gold ? '#c27a12' : '#2d4689', shadowOffset: [-L * 0.06, -L * 0.07],
    gloss: [{ x: 0.17 * L, y: -0.17 * L, rx: 0.15 * L, ry: 0.035 * L, rot: -0.2, alpha: gold ? 0.9 : 0.4 }],
  });
  ctx.save();
  ctx.beginPath();
  upper(ctx);
  ctx.clip();
  if (!gold) {
    // tartan, following the dome a little
    ctx.fillStyle = rgba('#9ab8ff', 0.3);
    for (let i = 0; i < 4; i++) ctx.fillRect(-0.2 * L, -0.25 * L + i * 0.095 * L, 0.8 * L, 0.04 * L);
    for (let i = 0; i < 5; i++) ctx.fillRect(0.02 * L + i * 0.11 * L, -0.35 * L, 0.04 * L, 0.6 * L);
    ctx.strokeStyle = rgba('#ff5a4a', 0.8);
    ctx.lineWidth = Math.max(0.3, L * 0.012);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(-0.2 * L, -0.23 * L + i * 0.095 * L);
      ctx.lineTo(0.6 * L, -0.23 * L + i * 0.095 * L);
    }
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(0.04 * L + i * 0.11 * L, -0.35 * L);
      ctx.lineTo(0.04 * L + i * 0.11 * L, 0.25 * L);
    }
    ctx.stroke();
  } else {
    ctx.strokeStyle = rgba('#fff6c8', 0.75);
    ctx.lineWidth = Math.max(0.35, L * 0.016);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = -0.05 * L + i * 0.1 * L;
      ctx.moveTo(x, -0.35 * L);
      ctx.lineTo(x + 0.1 * L, 0.2 * L);
    }
    ctx.stroke();
  }
  // dark lining just inside the opening
  ctx.fillStyle = gold ? 'rgba(120,60,10,0.5)' : 'rgba(20,30,70,0.55)';
  ctx.beginPath();
  ctx.moveTo(D[0], D[1]);
  ctx.quadraticCurveTo(-0.17 * L, -0.06 * L, N[0], N[1]);
  ctx.quadraticCurveTo(-0.07 * L, -0.05 * L, D[0], D[1]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // fluffy trim along the opening
  S(ctx, (c) => {
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      // quadratic D -> ctrl -> N
      const cx = -0.17 * L, cy = -0.06 * L;
      const x = (1 - t) * (1 - t) * D[0] + 2 * (1 - t) * t * cx + t * t * N[0];
      const y = (1 - t) * (1 - t) * D[1] + 2 * (1 - t) * t * cy + t * t * N[1];
      circlePath(c, x, y, L * 0.042);
    }
  }, { fill: gold ? '#ffffff' : '#f7eedf', ink: ink * 0.75, shadow: gold ? '#eedcb8' : '#d6c3aa', shadowOffset: [-L * 0.014, -L * 0.016] });
  if (gold) {
    S(ctx, (c) => ellipsePath(c, 0.24 * L, -0.08 * L, 0.045 * L, 0.05 * L), {
      fill: '#e2243b', ink: ink * 0.6, shadow: '#9b1428', shadowOffset: [-L * 0.012, -L * 0.015],
      gloss: [{ x: 0.228 * L, y: -0.098 * L, rx: 0.018 * L, ry: 0.013 * L, alpha: 0.95 }],
    });
  }
}
