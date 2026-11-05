/**
 * PICKUPS (world, anchor centre) + picnic-basket chest + UI art (ui.chest, ui.emblem)
 * + icon.chest.
 */
import { defineSprite } from '../sprites';
import { Ctx, Pt, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath, line, speckle, glint, rng, rgba } from '../painter';
import { S, G, icon, composite, goldGrad, goldBall, radial, linear, tube, sparkle, inkSparkle, softGlow, rays, CompositeOpts } from './items_kit';
import { basilLeaf, tomatoBall, coinFace, euroSign, margherita, rollingPin, heart } from './items_objects';
import { toqueIcon } from './items_icons_m';

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  fn();
  ctx.restore();
}

/** World pickup: anchor centre, light edge so it pops on every floor. */
function pickup(id: string, w: number, h: number, paint: (ctx: Ctx, f: number) => void, o: CompositeOpts & { frames?: number; res?: number } = {}) {
  defineSprite({
    id,
    w,
    h,
    res: o.res ?? 3,
    frames: o.frames,
    draw: (ctx, f) => composite(ctx, (c) => paint(c, f), { edge: o.edge ?? '#fffbea', edgeW: o.edgeW ?? 0.8, edgeA: o.edgeA ?? 0.65, glow: o.glow, glowR: o.glowR, glowA: o.glowA }),
  });
}

// ===========================================================================
// Gingham + wicker helpers
// ===========================================================================
export function gingham(ctx: Ctx, build: (c: Ctx) => void, cell: number, x0: number, y0: number, x1: number, y1: number, skew = 0) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = rgba('#e0303a', 0.55);
  for (let x = x0; x < x1; x += cell * 2) {
    ctx.beginPath();
    polyPath(ctx, [[x, y0], [x + cell, y0], [x + cell + skew, y1], [x + skew, y1]]);
    ctx.fill();
  }
  for (let y = y0; y < y1; y += cell * 2) ctx.fillRect(x0, y, x1 - x0, cell);
  ctx.restore();
}

function wicker(ctx: Ctx, build: (c: Ctx) => void, x0: number, y0: number, x1: number, y1: number, rowH: number, segW: number, gold = false) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  ctx.fillStyle = gold ? '#b8740f' : '#9a6430';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  let row = 0;
  for (let y = y0; y < y1; y += rowH, row++) {
    for (let x = x0 - segW + (row % 2) * segW * 0.5; x < x1; x += segW) {
      ctx.fillStyle = gold ? goldGrad(ctx, x, y, x, y + rowH) : linear(ctx, 0, y, 0, y + rowH, [[0, '#f3cf8e'], [0.5, '#deaa62'], [1, '#b98040']]);
      ctx.beginPath();
      roundRectPath(ctx, x + segW * 0.06, y + rowH * 0.1, segW * 0.88, rowH * 0.8, rowH * 0.4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      roundRectPath(ctx, x + segW * 0.2, y + rowH * 0.2, segW * 0.5, rowH * 0.2, rowH * 0.1);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ===========================================================================
// Picnic basket (cesta da picnic). Designed ~40u wide; anchor = centre of art.
// ===========================================================================
export function basket(ctx: Ctx, o: { gold?: boolean; open?: boolean; ink?: number } = {}) {
  const gold = !!o.gold;
  const ink = o.ink ?? 2;
  const body = (c: Ctx) => {
    c.moveTo(-19, -3);
    c.lineTo(19, -3);
    c.lineTo(16.5, 13);
    c.quadraticCurveTo(16, 16, 13, 16);
    c.lineTo(-13, 16);
    c.quadraticCurveTo(-16, 16, -16.5, 13);
    c.closePath();
  };
  if (o.open) {
    // lid swung open behind, showing its gingham lining
    const lid = (c: Ctx) => polyPath(c, [[-17.5, -6], [17.5, -6], [20, -27], [-20, -27]]);
    S(ctx, lid, { fill: gold ? '#c98a1c' : '#c99050', ink, shadow: 'none' });
    gingham(ctx, (c) => polyPath(c, [[-15.5, -7.5], [15.5, -7.5], [17.6, -25], [-17.6, -25]]), 2.6, -20, -27, 20, -6, 0);
    ctx.save();
    ctx.lineWidth = ink * 0.6;
    ctx.strokeStyle = '#2b1712';
    ctx.beginPath();
    polyPath(ctx, [[-15.5, -7.5], [15.5, -7.5], [17.6, -25], [-17.6, -25]]);
    ctx.stroke();
    ctx.restore();
    // hinge straps
    for (const x of [-10, 10]) S(ctx, (c) => roundRectPath(c, x - 2, -8, 4, 4, 1), { fill: '#8a4a26', ink: ink * 0.6, shadow: 'none' });
  }
  // body
  S(ctx, body, { fill: gold ? '#e8a628' : '#d39a55', ink, shadow: 'none' });
  wicker(ctx, body, -20, -3, 20, 17, 3.2, 5.2, gold);
  // shading over weave: right side darker, left lit
  ctx.save();
  ctx.beginPath();
  body(ctx);
  ctx.clip();
  ctx.fillStyle = linear(ctx, -19, 0, 19, 0, [[0, 'rgba(255,240,200,0.25)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(70,30,10,0.35)']]);
  ctx.fillRect(-20, -4, 40, 21);
  ctx.fillStyle = linear(ctx, 0, 8, 0, 16, [[0, 'rgba(70,30,10,0)'], [1, 'rgba(70,30,10,0.3)']]);
  ctx.fillRect(-20, 8, 40, 9);
  ctx.restore();
  ctx.save();
  ctx.lineWidth = ink * 2;
  ctx.strokeStyle = '#2b1712';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  body(ctx);
  ctx.globalCompositeOperation = 'destination-over';
  ctx.stroke();
  ctx.restore();
  if (o.open) {
    // opening, brimming with light
    S(ctx, (c) => polyPath(c, [[-18.5, -5.5], [18.5, -5.5], [19.5, -2.5], [-19.5, -2.5]]), { fill: '#fff4c0', ink: ink * 0.8, shadow: 'none' });
  }
  // braided rim
  S(ctx, (c) => roundRectPath(c, -20.5, -4.5, 41, 4.4, 2), { fill: gold ? '#c98a1c' : '#b9803f', ink: ink * 0.85, shadow: 'none' });
  ctx.save();
  ctx.strokeStyle = gold ? 'rgba(255,240,170,0.8)' : 'rgba(250,215,160,0.75)';
  ctx.lineWidth = 0.9;
  for (let x = -19; x < 20; x += 2.6) {
    ctx.beginPath();
    ctx.moveTo(x, -3.8);
    ctx.lineTo(x + 1.6, -0.9);
    ctx.stroke();
  }
  ctx.restore();
  if (!o.open) {
    // lid (closed): top surface + front lip
    const top = (c: Ctx) => polyPath(c, [[-16.5, -11.5], [16.5, -11.5], [20, -5], [-20, -5]]);
    S(ctx, top, { fill: gold ? '#e8a628' : '#d39a55', ink, shadow: 'none' });
    wicker(ctx, top, -21, -12, 21, -4, 2.2, 4, gold);
    ctx.save();
    ctx.beginPath();
    top(ctx);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,240,200,0.25)';
    ctx.fillRect(-21, -12, 42, 3);
    ctx.restore();
    ctx.save();
    ctx.lineWidth = ink;
    ctx.strokeStyle = '#2b1712';
    ctx.beginPath();
    top(ctx);
    ctx.stroke();
    ctx.restore();
    // gingham cloth peeking out at the front
    const cloth = (c: Ctx) => {
      c.moveTo(-9, -4.4);
      c.lineTo(7, -4.4);
      c.quadraticCurveTo(6, 0, 3.5, 2);
      c.lineTo(-0.5, 7.5);
      c.lineTo(-3.5, 2.5);
      c.quadraticCurveTo(-8, 0.5, -9, -4.4);
      c.closePath();
    };
    S(ctx, cloth, { fill: '#fffaf0', ink: ink * 0.8, shadow: 'none' });
    gingham(ctx, cloth, 1.9, -10, -5, 8, 8, -0.6);
    ctx.save();
    ctx.lineWidth = ink * 0.8;
    ctx.strokeStyle = '#2b1712';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    cloth(ctx);
    ctx.stroke();
    ctx.restore();
    // carry handle on the lid
    tube(ctx, [[-8, -9.5], [-7, -16], [0, -19], [7, -16], [8, -9.5]], 2.8, gold ? '#f0b83a' : '#c98a4a', ink * 0.75, true, gold ? '#fff6c8' : '#f3cf8e', 0.8);
    if (gold) {
      // red ribbon bow on the lid
      for (const s of [-1, 1]) {
        S(ctx, (c) => {
          c.moveTo(0, -9);
          c.bezierCurveTo(s * 5, -15, s * 10, -12, s * 8, -8);
          c.bezierCurveTo(s * 6, -5.5, s * 3, -8, 0, -9);
          c.closePath();
        }, { fill: '#e2283a', ink: ink * 0.7, shadow: '#a0141f', shadowOffset: [-0.6, -0.8] });
        tube(ctx, [[0, -8.5], [s * 3, -4], [s * 4.5, 0]], 2, '#e2283a', ink * 0.6, true);
      }
      S(ctx, (c) => circlePath(c, 0, -8.8, 1.8), { fill: '#c81e30', ink: ink * 0.6, shadow: 'none' });
    }
  }
  // leather straps + buckles on the front
  for (const x of [-11, 11]) {
    S(ctx, (c) => roundRectPath(c, x - 2, o.open ? -2 : -6, 4, o.open ? 9 : 13, 1), { fill: gold ? '#c0283c' : '#8a4a26', ink: ink * 0.7, shadow: 'none' });
    S(ctx, (c) => roundRectPath(c, x - 2.6, o.open ? 2 : 1.5, 5.2, 3.6, 0.8), { fill: '#f8c437', ink: ink * 0.6, shadow: 'none' });
    ctx.fillStyle = '#7a4a10';
    ctx.fillRect(x - 1.4, (o.open ? 2 : 1.5) + 1.2, 2.8, 1.2);
  }
  if (gold) {
    // ribbon wrapped around the front
    ctx.save();
    ctx.beginPath();
    body(ctx);
    ctx.clip();
    ctx.fillStyle = '#e2283a';
    ctx.fillRect(-2.2, -3, 4.4, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-1.6, -3, 1, 20);
    ctx.restore();
  }
}

icon('icon.chest', (ctx) => basket(ctx, { ink: 2 }));

pickup('pickup.chest', 46, 44, (ctx) => {
  ctx.save();
  ctx.translate(0, 2);
  ctx.scale(0.9, 0.9);
  basket(ctx, { ink: 1.9 });
  ctx.restore();
});

pickup('pickup.chest_gold', 50, 48, (ctx) => {
  ctx.save();
  ctx.translate(0, 2.5);
  ctx.scale(0.98, 0.98);
  basket(ctx, { ink: 1.9, gold: true });
  ctx.restore();
  sparkle(ctx, -16, -12, 3.6, '#ffffff', 1);
  sparkle(ctx, 18, 3, 2.8, '#ffffff', 0.9);
}, { glow: '#ffd34a', glowR: 3, glowA: 0.85, edge: '#fff6c8' });

/** Light pouring out of the open basket (drawn outside the composite). */
function basketLight(ctx: Ctx, s: number) {
  ctx.save();
  ctx.scale(s, s);
  // clip rays to a soft column so nothing hits the sprite box edge hard
  rays(ctx, 0, -4, 3, 28, 14, '#fff6c8', 0.95, -Math.PI / 2 - 0.95, 0.42);
  softGlow(ctx, 0, -10, 22, '#ffe58a', 0.8, 18);
  softGlow(ctx, 0, -4, 14, '#ffffff', 0.9, 6);
  ctx.restore();
}

defineSprite({
  id: 'ui.chest',
  w: 96,
  h: 96,
  res: 4,
  frames: 2,
  draw: (ctx, f) => {
    const oy = f === 1 ? 14 : 4;
    if (f === 1) {
      softGlow(ctx, 0, -8, 46, '#ffd34a', 0.5);
      ctx.save();
      ctx.translate(0, oy);
      basketLight(ctx, 1.95);
      ctx.restore();
    }
    composite(ctx, (c) => {
      c.save();
      c.translate(0, oy);
      c.scale(1.95, 1.95);
      basket(c, { ink: 1.5, open: f === 1 });
      c.restore();
    }, { drop: true, dropA: 0.35, dropOff: [1.5, 2.5], dropBlur: 1.6 });
    if (f === 1) {
      // light spilling over the front rim (on top)
      ctx.save();
      ctx.translate(0, oy);
      softGlow(ctx, 0, -6, 30, '#fff8d8', 0.55, 8);
      ctx.restore();
      sparkle(ctx, -28, -30, 5, '#ffffff', 1);
      sparkle(ctx, 30, -22, 4, '#ffffff', 0.95);
      sparkle(ctx, 8, -40, 3.4, '#ffffff', 0.9);
      sparkle(ctx, -10, -42, 2.6, '#ffffff', 0.8);
    }
  },
});

// ===========================================================================
// XP ingredients — the tricolore (basil, tomato, mozzarella) + Parmigiano
// ===========================================================================
pickup('pickup.xp1', 18, 18, (ctx) => {
  rot(ctx, 0, 0, -0.6, () => basilLeaf(ctx, 13.5, { ink: 1.1, stem: true }));
});

pickup('pickup.xp2', 18, 18, (ctx) => {
  ctx.translate(0, 0.8);
  tomatoBall(ctx, 6.4, { ink: 1.15 });
});

export function mozzarella(ctx: Ctx, r: number, ink = 1.2) {
  S(ctx, (c) => {
    c.moveTo(-r * 0.25, -r * 0.92);
    c.quadraticCurveTo(-r * 0.15, -r * 1.25, r * 0.05, -r * 1.22);
    c.quadraticCurveTo(r * 0.2, -r * 1.1, r * 0.25, -r * 0.92);
    c.bezierCurveTo(r * 0.85, -r * 0.85, r * 1.05, -r * 0.3, r * 1.0, r * 0.15);
    c.bezierCurveTo(r * 0.95, r * 0.75, r * 0.5, r * 0.98, 0, r * 0.98);
    c.bezierCurveTo(-r * 0.5, r * 0.98, -r * 0.95, r * 0.75, -r * 1.0, r * 0.15);
    c.bezierCurveTo(-r * 1.05, -r * 0.3, -r * 0.85, -r * 0.85, -r * 0.25, -r * 0.92);
    c.closePath();
  }, {
    fill: radial(ctx, -r * 0.3, -r * 0.35, r * 1.4, [[0, '#ffffff'], [0.6, '#fbf6ec'], [1, '#e2dccd']]),
    ink,
    shadow: '#d9d2c4',
    shadowOffset: [-r * 0.22, -r * 0.26],
    gloss: [
      { x: -r * 0.4, y: -r * 0.35, rx: r * 0.32, ry: r * 0.2, rot: -0.7, alpha: 1 },
      { x: r * 0.5, y: r * 0.45, rx: r * 0.14, ry: r * 0.08, rot: -0.7, alpha: 0.7 },
    ],
  });
  // milky sheen line
  line(ctx, [[-r * 0.65, r * 0.1], [-r * 0.45, r * 0.5], [-r * 0.05, r * 0.7]], Math.max(0.4, r * 0.08), '#ffffff', true, 0.85);
}

pickup('pickup.xp3', 22, 22, (ctx) => {
  ctx.translate(0, 1.2);
  mozzarella(ctx, 8, 1.25);
  rot(ctx, 1.8, -8.2, -0.5, () => basilLeaf(ctx, 7.5, { ink: 0.9 }));
});

export function parmigianoChunk(ctx: Ctx, s: number, ink = 1.3) {
  ctx.save();
  ctx.scale(s / 20, s / 20);
  const ik = ink * 20 / s;
  // faces of a craggy wedge
  const front: Pt[] = [[-9.5, -1], [-6, -3.5], [-2, -2.2], [2.5, -4], [6.5, -2.4], [8.5, 6.5], [-8.8, 8.2]];
  const top: Pt[] = [[-9.5, -1], [-3, -9.5], [9.5, -8.5], [6.5, -2.4], [2.5, -4], [-2, -2.2], [-6, -3.5]];
  const side: Pt[] = [[9.5, -8.5], [10.5, 4.5], [8.5, 6.5], [6.5, -2.4]];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = ik * 2;
  ctx.strokeStyle = '#2b1712';
  for (const p of [front, top, side]) {
    ctx.beginPath();
    polyPath(ctx, p);
    ctx.stroke();
  }
  ctx.restore();
  S(ctx, (c) => polyPath(c, front), { fill: linear(ctx, 0, -4, 0, 8, [[0, '#fff0b8'], [1, '#f2c85a']]), ink: 0, shadow: 'none' });
  S(ctx, (c) => polyPath(c, top), { fill: linear(ctx, -9, -9, 9, -2, [[0, '#fffbe2'], [1, '#ffe48a']]), ink: 0, shadow: 'none' });
  S(ctx, (c) => polyPath(c, side), { fill: linear(ctx, 7, 0, 11, 0, [[0, '#e0a23a'], [1, '#b8741e']]), ink: 0, shadow: 'none' });
  // rind band on the back edge
  line(ctx, [[-3, -9.5], [9.5, -8.5], [10.5, 4.5]], 1.6, '#c98a2a', false, 0.95);
  // crags + crystals
  ctx.save();
  ctx.beginPath();
  polyPath(ctx, front);
  ctx.clip();
  speckle(ctx, 0, 3, 8, 4, 12, '#d9a440', 0.55, 7, 0.8);
  speckle(ctx, 0, 3, 8, 4, 8, '#ffffff', 0.5, 8, 1);
  ctx.restore();
  speckle(ctx, 1, -5.5, 6, 2.5, 6, '#ffffff', 0.45, 9, 1);
  line(ctx, [[-6, -3.5], [-2, -2.2], [2.5, -4], [6.5, -2.4]], 0.6, '#fff8d8', false, 0.9);
  ctx.restore();
}

pickup('pickup.xp4', 26, 26, (ctx) => {
  ctx.translate(0, 1);
  parmigianoChunk(ctx, 20, 1.35);
  sparkle(ctx, 7, -8, 3.2, '#ffffff', 1, 0.1);
}, { glow: '#ffe07a', glowR: 2.2, glowA: 0.75, edge: '#fff6c8' });

// ===========================================================================
// Coins
// ===========================================================================
pickup('pickup.coin', 16, 16, (ctx, f) => {
  const r = 6;
  if (f === 0) {
    coinFace(ctx, r, { ink: 1.05 });
  } else if (f === 2) {
    // edge-on: a reeded rim
    S(ctx, (c) => roundRectPath(c, -1.6, -r, 3.2, r * 2, 1.4), { fill: linear(ctx, -1.6, 0, 1.6, 0, [[0, '#ffe98a'], [0.5, '#f2b02a'], [1, '#c27a12']]), ink: 1.05, shadow: 'none' });
    for (let y = -r + 1.4; y < r - 0.8; y += 1.3) line(ctx, [[-1, y], [1, y]], 0.35, '#a8620f', false, 0.8);
  } else {
    ctx.save();
    ctx.scale(f === 1 ? 0.58 : -0.58, 1);
    // thickness behind
    S(ctx, (c) => circlePath(c, 1.6, 0, r), { fill: '#c27a12', ink: 1.05 / 0.58 * 0.75, shadow: 'none' });
    coinFace(ctx, r, { ink: 1.05 / 0.58 * 0.75, back: f === 3 });
    ctx.restore();
  }
}, { frames: 4 });

pickup('pickup.coinbag', 26, 26, (ctx) => {
  ctx.translate(0, 1.5);
  // coins peeking out
  for (const [x, y, a] of [[-3, -7.5, -0.3], [2.5, -8.5, 0.25]] as [number, number, number][]) {
    rot(ctx, x, y, a, () => {
      ctx.save();
      ctx.scale(1, 0.55);
      coinFace(ctx, 3.6, { ink: 1.4 });
      ctx.restore();
    });
  }
  const bag = (c: Ctx) => {
    c.moveTo(-4.5, -5.5);
    c.bezierCurveTo(-11, -3, -11.5, 4, -9.5, 7.5);
    c.quadraticCurveTo(-8, 10.5, -3, 10.5);
    c.lineTo(3, 10.5);
    c.quadraticCurveTo(8, 10.5, 9.5, 7.5);
    c.bezierCurveTo(11.5, 4, 11, -3, 4.5, -5.5);
    c.closePath();
  };
  S(ctx, bag, {
    fill: radial(ctx, -3, 0, 13, [[0, '#d8705a'], [0.6, '#a83a32'], [1, '#7a2228']]),
    ink: 1.4, shadow: '#6e1c22', shadowOffset: [-1.6, -1.4],
    gloss: [{ x: -5, y: 0, rx: 1.4, ry: 3, rot: 0.2, alpha: 0.5 }],
  });
  // ruffled neck
  S(ctx, (c) => {
    c.moveTo(-6.5, -8);
    c.quadraticCurveTo(-3, -5, 0, -6.5);
    c.quadraticCurveTo(3, -5, 6.5, -8);
    c.quadraticCurveTo(6, -4.5, 3.5, -4);
    c.lineTo(-3.5, -4);
    c.quadraticCurveTo(-6, -4.5, -6.5, -8);
    c.closePath();
  }, { fill: '#c24a3e', ink: 1.2, shadow: '#7a2228', shadowOffset: [-0.5, -0.5] });
  // gold cord
  tube(ctx, [[-5, -4.2], [0, -3.4], [5, -4.2]], 1.2, '#f8c437', 0.9, true);
  tube(ctx, [[0.5, -3.6], [2.5, -0.5], [1.5, 2]], 0.9, '#f8c437', 0.8, true);
  // stitched € emblem
  euroSign(ctx, -1, 4.2, 3.2, 1.1);
});

// ===========================================================================
// Healing food
// ===========================================================================
pickup('pickup.cannolo', 32, 32, (ctx) => {
  rot(ctx, 0, 0, -0.6, () => {
    const L = 22, R = 4.6;
    // ricotta ends (behind/front)
    const cream = (x: number, s: number) => {
      S(ctx, (c) => {
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i / 4) * Math.PI;
          circlePath(c, x + s * (1.5 + Math.cos(a) * 1.6), Math.sin(a) * R * 0.85, 2.3);
        }
        ellipsePath(c, x + s * 1, 0, 2.6, R * 1.02);
      }, { fill: '#fffaf0', ink: 1.2, shadow: '#e6dccb', shadowOffset: [-0.7, -0.8] });
    };
    cream(-L / 2 + 1, -1);
    // shell
    S(ctx, (c) => {
      c.moveTo(-L / 2 + 1.5, -R);
      c.lineTo(L / 2 - 1.5, -R);
      c.quadraticCurveTo(L / 2 + 0.5, 0, L / 2 - 1.5, R);
      c.lineTo(-L / 2 + 1.5, R);
      c.quadraticCurveTo(-L / 2 + 3.5, 0, -L / 2 + 1.5, -R);
      c.closePath();
    }, {
      fill: linear(ctx, 0, -R, 0, R, [[0, '#f0bb6a'], [0.45, '#d58f3e'], [1, '#a8622a']]),
      ink: 1.3, shadow: 'none',
      gloss: [{ x: -1, y: -R * 0.55, rx: L * 0.3, ry: 0.8, alpha: 0.5 }],
    });
    // blistered texture
    const rr = rng(5);
    for (let i = 0; i < 12; i++) {
      const x = -L / 2 + 3 + rr() * (L - 6), y = (rr() - 0.5) * R * 1.4;
      ctx.fillStyle = rgba('#fbe0a6', 0.75);
      ctx.beginPath();
      ellipsePath(ctx, x, y, 0.9 + rr() * 0.6, 0.6 + rr() * 0.4);
      ctx.fill();
      ctx.fillStyle = rgba('#8a4a20', 0.45);
      ctx.beginPath();
      circlePath(ctx, x + 0.3, y + 0.3, 0.35);
      ctx.fill();
    }
    cream(L / 2 - 1, 1);
    // pistachio crumbs on one end, candied cherry on the other
    speckle(ctx, L / 2 + 2.5, 0, 1.6, 3.4, 7, '#6cc04a', 0.5, 4, 1);
    S(ctx, (c) => circlePath(c, -L / 2 - 2.6, -0.5, 1.8), { fill: '#e2283a', ink: 0.9, shadow: '#a0141f', shadowOffset: [-0.4, -0.4], gloss: [{ x: -L / 2 - 3.1, y: -1.1, rx: 0.6, ry: 0.4, alpha: 0.95 }] });
    speckle(ctx, -L / 2 - 1.2, 2.2, 1.6, 1.4, 4, '#4a2412', 0.4, 6, 1);
    // icing sugar dusting
    speckle(ctx, 0, -1.5, L * 0.4, R * 0.6, 14, '#ffffff', 0.35, 9, 0.9);
  });
});

pickup('pickup.lasagna', 34, 34, (ctx) => {
  ctx.translate(-0.5, 1.5);
  // 3/4 slice: front face with layers, right side, top
  const front: Pt[] = [[-12, -3], [6, -3], [6, 10], [-12, 10]];
  const side: Pt[] = [[6, -3], [12.5, -8.5], [12.5, 4.5], [6, 10]];
  const top: Pt[] = [[-12, -3], [-5.5, -8.5], [12.5, -8.5], [6, -3]];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2b1712';
  for (const p of [front, side, top]) {
    ctx.beginPath();
    polyPath(ctx, p);
    ctx.stroke();
  }
  ctx.restore();
  const layers = (pts: Pt[], x0: number, x1: number, y0: number, y1: number, dark: number, slope: number) => {
    ctx.save();
    ctx.beginPath();
    polyPath(ctx, pts);
    ctx.clip();
    const h = (y1 - y0) / 6;
    const cols = ['#f3d27a', '#c8362a', '#fbefd4', '#f3d27a', '#c8362a', '#fbefd4'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      const ya = y0 + i * h, yb = y0 + (i + 1) * h;
      polyPath(ctx, [[x0, ya], [x1, ya + slope], [x1, yb + slope + 0.3], [x0, yb + 0.3]]);
      ctx.fill();
      // wavy pasta edges
      if (i % 3 === 0) {
        ctx.strokeStyle = 'rgba(200,140,40,0.7)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 1) {
          const t = (x - x0) / Math.max(0.001, x1 - x0);
          const y = ya + t * slope + Math.sin(x * 1.6) * 0.35;
          if (x === x0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    if (dark) {
      ctx.fillStyle = `rgba(60,20,10,${dark})`;
      ctx.fillRect(x0 - 1, y0 - 12, x1 - x0 + 2, y1 - y0 + 24);
    }
    // ragù bits
    speckle(ctx, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, 10, '#7a1a14', 0.45, 3, 0.7);
    ctx.restore();
  };
  layers(front, -12, 6, -3, 10, 0, 0);
  layers(side, 6, 12.5, -3, 10, 0.22, -5.5);
  // top: browned cheese
  S(ctx, (c) => polyPath(c, top), { fill: linear(ctx, -10, -8, 10, -3, [[0, '#fbe08a'], [1, '#eab04a']]), ink: 0, shadow: 'none' });
  ctx.save();
  ctx.beginPath();
  polyPath(ctx, top);
  ctx.clip();
  const R = rng(12);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 3 ? rgba('#b8641e', 0.65) : rgba('#d8402a', 0.7);
    ctx.beginPath();
    ellipsePath(ctx, -8 + R() * 18, -7.5 + R() * 4, 1 + R() * 1.2, 0.6 + R() * 0.5, R());
    ctx.fill();
  }
  ctx.restore();
  // sauce drip over the front edge
  S(ctx, (c) => {
    c.moveTo(-8, -3.4);
    c.quadraticCurveTo(-6.5, 1, -5.5, -1);
    c.quadraticCurveTo(-4.5, 2.5, -3.5, -3.2);
    c.closePath();
  }, { fill: '#d0382a', ink: 0.8, shadow: 'none' });
  glint(ctx, -2, -6.2, 2.4, 0.6, -0.1, 0.8);
  rot(ctx, 4, -7.5, -0.35, () => basilLeaf(ctx, 7.5, { ink: 0.9 }));
  // steam
  for (const [x, ph] of [[-7, 0], [-1, 2]] as [number, number][]) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) pts.push([x + Math.sin(i * 1.1 + ph) * 1.1, -10 - i * 0.9]);
    tube(ctx, pts, 1.1, '#ffffff', 0.7, true);
  }
});

// ===========================================================================
// Power-ups: bell, spumante, gelato
// ===========================================================================
pickup('pickup.bell', 34, 32, (ctx) => {
  ctx.translate(0, 1);
  rot(ctx, 0, 0, -0.25, () => {
    // handle
    S(ctx, (c) => {
      roundRectPath(c, -1.9, -14, 3.8, 7, 1.6);
      ellipsePath(c, 0, -14.3, 2.6, 2.1);
    }, { fill: '#8a4a26', ink: 1.3, shadow: '#5e2e14', shadowOffset: [-0.5, -0.6], gloss: [{ x: -0.8, y: -14.8, rx: 0.9, ry: 0.5, alpha: 0.6 }] });
    S(ctx, (c) => roundRectPath(c, -3, -8, 6, 2.2, 0.8), { fill: '#e2a945', ink: 1.1, shadow: 'none' });
    // clapper
    S(ctx, (c) => circlePath(c, 1.5, 9, 2.1), { fill: '#c98a2a', ink: 1.1, shadow: '#8a5a14', shadowOffset: [-0.4, -0.5] });
    // bell body
    S(ctx, (c) => {
      c.moveTo(-4, -6);
      c.bezierCurveTo(-7.5, -5, -7, 2, -9.5, 6);
      c.quadraticCurveTo(-11, 8.5, -8, 8.5);
      c.lineTo(8, 8.5);
      c.quadraticCurveTo(11, 8.5, 9.5, 6);
      c.bezierCurveTo(7, 2, 7.5, -5, 4, -6);
      c.closePath();
    }, {
      fill: linear(ctx, -10, 0, 10, 0, [[0, '#fff1a6'], [0.25, '#f2c24a'], [0.7, '#c98a22'], [1, '#9a6014']]),
      ink: 1.4, shadow: 'none',
      gloss: [{ x: -4.2, y: 0, rx: 1, ry: 4.2, rot: 0.2, alpha: 0.85 }],
    });
    // lip band
    line(ctx, [[-9.2, 6.6], [9.2, 6.6]], 0.8, '#9a6014', false, 0.9);
  });
  // ringing marks
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.strokeStyle = '#2b1712';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(s * 4, 2, 11.5, s > 0 ? -0.5 : Math.PI - 0.1, s > 0 ? 0.1 : Math.PI + 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#fff6c8';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }
});

pickup('pickup.spumante', 32, 38, (ctx) => {
  rot(ctx, 0, 1, 0.42, () => {
    const bottle = (c: Ctx) => {
      c.moveTo(-2.4, -12);
      c.lineTo(2.4, -12);
      c.lineTo(2.6, -6);
      c.bezierCurveTo(2.8, -3, 6, -3, 6, 1);
      c.lineTo(6, 12);
      c.quadraticCurveTo(6, 14, 4, 14);
      c.lineTo(-4, 14);
      c.quadraticCurveTo(-6, 14, -6, 12);
      c.lineTo(-6, 1);
      c.bezierCurveTo(-6, -3, -2.8, -3, -2.6, -6);
      c.closePath();
    };
    S(ctx, bottle, {
      fill: linear(ctx, -6, 0, 6, 0, [[0, '#3f9a5a'], [0.35, '#1f6e3c'], [1, '#0f4024']]),
      ink: 1.4, shadow: 'none',
      gloss: [{ x: -3.6, y: 5, rx: 0.9, ry: 6, alpha: 0.75 }, { x: 3.8, y: 6, rx: 0.4, ry: 4, alpha: 0.35 }],
    });
    // gold foil
    S(ctx, (c) => {
      c.moveTo(-2.9, -12.5);
      c.lineTo(2.9, -12.5);
      c.lineTo(3.1, -5.5);
      c.quadraticCurveTo(0, -4.2, -3.1, -5.5);
      c.closePath();
    }, { fill: goldGrad(ctx, -3, -12, 3, -5), ink: 1.2, shadow: 'none' });
    line(ctx, [[-2.6, -8], [2.6, -8]], 0.5, '#a8620f', false, 0.9);
    // label
    S(ctx, (c) => roundRectPath(c, -5, 3, 10, 7, 1), { fill: '#fbf1d8', ink: 1, shadow: 'none' });
    S(ctx, (c) => roundRectPath(c, -3.6, 4.2, 7.2, 1.6, 0.5), { fill: '#e8b23a', ink: 0, shadow: 'none' });
    line(ctx, [[-3, 7.5], [3, 7.5]], 0.5, '#7a5a3a', false, 0.8);
    // cork popping
    S(ctx, (c) => {
      c.moveTo(-2.2, -12.6);
      c.lineTo(2.2, -12.6);
      c.lineTo(2.6, -15);
      c.quadraticCurveTo(0, -17.5, -2.6, -15);
      c.closePath();
    }, { fill: '#e8c48c', ink: 1.1, shadow: '#b98a52', shadowOffset: [-0.4, -0.5] });
  });
  // bubbles
  for (const [x, y, r] of [[-9, -12, 1.5], [-6, -15, 1], [-11, -7, 1.1], [-3, -14, 0.8]] as [number, number, number][]) {
    ctx.save();
    ctx.strokeStyle = '#2b1712';
    ctx.lineWidth = 0.7;
    ctx.fillStyle = 'rgba(255,255,240,0.85)';
    ctx.beginPath();
    circlePath(ctx, x, y, r);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  sparkle(ctx, -11, -14, 2.6, '#ffffff', 0.95);
});

pickup('pickup.gelato', 24, 30, (ctx) => {
  ctx.translate(0, 1.5);
  // cone
  const cone = (c: Ctx) => {
    c.moveTo(-6.5, -1);
    c.lineTo(6.5, -1);
    c.lineTo(0.6, 13);
    c.quadraticCurveTo(0, 14, -0.6, 13);
    c.closePath();
  };
  S(ctx, cone, { fill: linear(ctx, -6, 0, 6, 0, [[0, '#f3c27a'], [1, '#c98a3e']]), ink: 1.3, shadow: 'none' });
  ctx.save();
  ctx.beginPath();
  cone(ctx);
  ctx.clip();
  ctx.strokeStyle = rgba('#9a5a20', 0.65);
  ctx.lineWidth = 0.6;
  for (let i = -6; i < 8; i += 2.4) {
    ctx.beginPath();
    ctx.moveTo(i - 6, -1);
    ctx.lineTo(i + 4, 14);
    ctx.moveTo(i + 6, -1);
    ctx.lineTo(i - 4, 14);
    ctx.stroke();
  }
  ctx.restore();
  // scoops: pistachio + fior di latte + cherry (tricolore)
  const scoop = (x: number, y: number, r: number, col: string, sh: string) => {
    S(ctx, (c) => {
      c.moveTo(x - r, y + r * 0.35);
      c.bezierCurveTo(x - r * 1.05, y - r * 0.9, x + r * 1.05, y - r * 0.9, x + r, y + r * 0.35);
      for (let i = 0; i < 4; i++) {
        const x0 = x + r - (i / 4) * r * 2, x1 = x + r - ((i + 1) / 4) * r * 2;
        c.quadraticCurveTo((x0 + x1) / 2, y + r * 0.85, x1, y + r * 0.35);
      }
      c.closePath();
    }, { fill: col, ink: 1.2, shadow: sh, shadowOffset: [-r * 0.2, -r * 0.25], gloss: [{ x: x - r * 0.35, y: y - r * 0.3, rx: r * 0.3, ry: r * 0.17, rot: -0.6, alpha: 0.85 }] });
  };
  scoop(0, -2, 6.6, '#9fd27a', '#6aa84a');
  scoop(0, -8.5, 5.6, '#fffaf0', '#e2dccd');
  S(ctx, (c) => circlePath(c, 0.6, -13.6, 2), { fill: '#e2283a', ink: 1, shadow: '#a0141f', shadowOffset: [-0.4, -0.5], gloss: [{ x: 0, y: -14.2, rx: 0.6, ry: 0.4, alpha: 0.95 }] });
  tube(ctx, [[1.2, -15.2], [2.6, -17]], 0.6, '#4a7a2a', 0.6, false);
  // frost sparkles
  sparkle(ctx, -7.5, -10, 2.4, '#ffffff', 1, 0, '#a8e4ff');
  sparkle(ctx, 8, -5, 1.8, '#ffffff', 0.9, 0.4, '#a8e4ff');
}, { edge: '#e8f8ff', edgeA: 0.75 });

// ===========================================================================
// UI EMBLEM — heraldic crest: pizza shield, crossed rolling pin & spoon,
// basil laurel, tricolore ribbon, chef hat (no text)
// ===========================================================================
function woodenSpoon(ctx: Ctx, L: number, ink: number) {
  G(ctx, [
    { build: (c) => roundRectPath(c, -L / 2, -L * 0.035, L * 0.68, L * 0.07, L * 0.035), style: { fill: '#d9a466', shadow: '#a8743c', shadowOffset: [-0.5, -L * 0.025] } },
    { build: (c) => ellipsePath(c, L / 2 - L * 0.15, 0, L * 0.15, L * 0.1), style: { fill: '#dcaa6c', shadow: '#a8743c', shadowOffset: [-L * 0.03, -L * 0.03] } },
  ], ink);
  S(ctx, (c) => ellipsePath(c, L / 2 - L * 0.14, 0.4, L * 0.1, L * 0.065), { fill: '#c08a50', ink: 0, shadow: 'none' });
  glint(ctx, L / 2 - L * 0.2, -L * 0.04, L * 0.04, L * 0.015, 0, 0.6);
}

function laurelBranch(ctx: Ctx, dir: number) {
  ctx.save();
  ctx.scale(dir, 1);
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.6 + (i / 10) * Math.PI * 0.62;
    pts.push([Math.cos(a) * 54, 8 + Math.sin(a) * 54]);
  }
  tube(ctx, pts, 3, '#3f8a34', 1.8, true);
  for (let i = 1; i <= 9; i++) {
    const a = Math.PI * 0.6 + (i / 10) * Math.PI * 0.62;
    const x = Math.cos(a) * 54, y = 8 + Math.sin(a) * 54;
    const t = a + Math.PI / 2;
    for (const side of [-1, 1]) {
      rot(ctx, x, y, t + Math.PI + side * 0.55, () => {
        ctx.translate(7, 0);
        basilLeaf(ctx, 15 - i * 0.35, { ink: 1.6, color: i % 2 ? '#3fb04b' : '#4cbb52' });
      });
    }
  }
  ctx.restore();
}

defineSprite({
  id: 'ui.emblem',
  w: 180,
  h: 180,
  res: 4,
  draw: (ctx) => {
    softGlow(ctx, 0, -4, 86, '#ffd34a', 0.35);
    composite(ctx, (c) => {
      // crossed rolling pin & wooden spoon behind the shield
      rot(c, 0, -2, Math.PI / 4 + Math.PI, () => rollingPin(c, 172, { ink: 3 }));
      rot(c, 0, -2, -Math.PI / 4 + Math.PI, () => woodenSpoon(c, 170, 3));
      // laurel of basil
      laurelBranch(c, 1);
      laurelBranch(c, -1);
      // shield: a margherita shaped like a heater shield
      const shield = (cc: Ctx) => {
        cc.moveTo(-40, -42);
        cc.quadraticCurveTo(0, -50, 40, -42);
        cc.lineTo(40, -6);
        cc.bezierCurveTo(40, 22, 20, 38, 0, 48);
        cc.bezierCurveTo(-20, 38, -40, 22, -40, -6);
        cc.closePath();
      };
      S(c, shield, {
        fill: radial(c, -12, -20, 70, [[0, '#f8d38f'], [0.7, '#e9b263'], [1, '#c9843d']]),
        ink: 3.4, shadow: '#b9763a', shadowOffset: [-3, -3],
      });
      // leopard spots on the crust border
      const R = rng(21);
      for (let i = 0; i < 18; i++) {
        const t = R();
        let x: number, y: number;
        if (t < 0.3) { x = -36 + R() * 72; y = -42 + R() * 3; }
        else if (t < 0.65) { const s = R() < 0.5 ? -1 : 1; x = s * (36.5 + R() * 2); y = -36 + R() * 34; }
        else { const u = R(); const s = R() < 0.5 ? -1 : 1; x = s * (34 - u * 30); y = -2 + u * 40; }
        c.fillStyle = rgba('#4a2412', 0.7);
        c.beginPath();
        ellipsePath(c, x, y, 1.6 + R() * 1.4, 1.1 + R(), R() * 3);
        c.fill();
      }
      // sauce field
      const field = (cc: Ctx) => {
        cc.moveTo(-33, -35);
        cc.quadraticCurveTo(0, -42, 33, -35);
        cc.lineTo(33, -6);
        cc.bezierCurveTo(33, 17, 17, 30, 0, 39);
        cc.bezierCurveTo(-17, 30, -33, 17, -33, -6);
        cc.closePath();
      };
      S(c, field, { fill: radial(c, -8, -12, 60, [[0, '#f0553b'], [1, '#c02a22']]), ink: 1.6, inkColor: '#8a3a1c', shadow: '#a8241e', shadowOffset: [-2.5, -2.5] });
      // mozzarella + basil on the shield: three blobs in a heraldic pattern
      const moz: [number, number, number][] = [[-15, -18, 8.5], [15, -18, 8.5], [0, 8, 9.5]];
      moz.forEach(([x, y, r], i) => {
        S(c, (cc) => {
          const pts: Pt[] = [];
          const RR = rng(40 + i);
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const kk = 1 + (RR() - 0.5) * 0.25;
            pts.push([x + Math.cos(a) * r * kk, y + Math.sin(a) * r * kk]);
          }
          smoothPath(cc, pts);
        }, { fill: '#fffaf0', ink: 1.5, inkColor: '#c8a070', shadow: '#efe0c4', shadowOffset: [-2, -2.2], gloss: [{ x: x - r * 0.35, y: y - r * 0.4, rx: r * 0.35, ry: r * 0.2, rot: -0.5, alpha: 0.95 }] });
      });
      rot(c, 0, -27, -0.15, () => basilLeaf(c, 18, { ink: 1.6 }));
      rot(c, -16, 24, -0.9, () => basilLeaf(c, 13, { ink: 1.4 }));
      rot(c, 16, 24, -2.2, () => basilLeaf(c, 13, { ink: 1.4 }));
      glint(c, -24, -30, 5, 1.6, -0.2, 0.55);
      // chef hat on top
      toqueIcon(c, 0, -44, 1.55, 3);
      // tricolore ribbon banner across the bottom
      const band = (cc: Ctx) => {
        cc.moveTo(-62, 44);
        cc.quadraticCurveTo(0, 62, 62, 44);
        cc.lineTo(62, 60);
        cc.quadraticCurveTo(0, 78, -62, 60);
        cc.closePath();
      };
      // folded tails
      for (const s of [-1, 1]) {
        S(c, (cc) => {
          cc.moveTo(s * 56, 48);
          cc.lineTo(s * 78, 46);
          cc.lineTo(s * 70, 56);
          cc.lineTo(s * 78, 66);
          cc.lineTo(s * 56, 64);
          cc.closePath();
        }, { fill: s < 0 ? '#23803f' : '#b82a2f', ink: 2.8, shadow: 'none' });
      }
      S(c, band, { fill: '#ffffff', ink: 3, shadow: 'none' });
      c.save();
      c.beginPath();
      band(c);
      c.clip();
      c.fillStyle = '#2f9a52';
      c.fillRect(-64, 30, 42, 50);
      c.fillStyle = '#fbf6ea';
      c.fillRect(-22, 30, 44, 50);
      c.fillStyle = '#dc3439';
      c.fillRect(22, 30, 42, 50);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.beginPath();
      c.moveTo(-62, 46);
      c.quadraticCurveTo(0, 64, 62, 46);
      c.lineTo(62, 50);
      c.quadraticCurveTo(0, 68, -62, 50);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(60,20,10,0.18)';
      c.beginPath();
      c.moveTo(-62, 56);
      c.quadraticCurveTo(0, 74, 62, 56);
      c.lineTo(62, 60);
      c.quadraticCurveTo(0, 78, -62, 60);
      c.closePath();
      c.fill();
      c.restore();
      c.save();
      c.lineWidth = 3;
      c.strokeStyle = '#2b1712';
      c.lineJoin = 'round';
      c.beginPath();
      band(c);
      c.stroke();
      c.restore();
      // stars on the ribbon
      for (const x of [-38, 0, 38]) {
        const y = 52 + (1 - (x / 62) ** 2) * 9 + 0.5;
        inkSparkle(c, x, y, 3.6, '#ffd34a', 1.1);
      }
      inkSparkle(c, -50, -50, 6, '#fff6c8', 1.6);
      inkSparkle(c, 54, -40, 5, '#fff6c8', 1.4);
    }, { drop: true, dropA: 0.4, dropOff: [2, 3], dropBlur: 2, edge: '#fff4dc', edgeW: 1.2, edgeA: 0.35 });
  },
});

void margherita; void heart; void goldBall; void G;
