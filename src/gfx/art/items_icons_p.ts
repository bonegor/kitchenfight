/**
 * ICONS — passives ('icon.p.*'). 48×48, anchor centre, res 3 (auto-fitted).
 */
import {
  Ctx, Pt, ellipsePath, circlePath, roundRectPath, polyPath, line, speckle, glint, rng, rgba, shade, light,
} from '../painter';
import { S, icon, goldGrad, radial, linear, tube, inkSparkle } from './items_kit';
import { olive, basilLeaf, oliveLeaf, coinFace, calyx } from './items_objects';

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  fn();
  ctx.restore();
}

function drop(ctx: Ctx, x: number, y: number, s: number, col = '#f5c83a', ink = 1.5) {
  S(ctx, (c) => {
    c.moveTo(x, y - s);
    c.bezierCurveTo(x + s * 0.22, y - s * 0.5, x + s * 0.6, y - s * 0.1, x + s * 0.6, y + s * 0.3);
    c.bezierCurveTo(x + s * 0.6, y + s * 0.7, x + s * 0.3, y + s * 0.9, x, y + s * 0.9);
    c.bezierCurveTo(x - s * 0.3, y + s * 0.9, x - s * 0.6, y + s * 0.7, x - s * 0.6, y + s * 0.3);
    c.bezierCurveTo(x - s * 0.6, y - s * 0.1, x - s * 0.22, y - s * 0.5, x, y - s);
    c.closePath();
  }, {
    fill: radial(ctx, x - s * 0.2, y, s, [[0, light(col, 0.5)], [0.5, col], [1, shade(col, 0.2)]]),
    ink, shadow: shade(col, 0.3), shadowOffset: [-s * 0.12, -s * 0.14],
    gloss: [{ x: x - s * 0.24, y: y + s * 0.15, rx: s * 0.14, ry: s * 0.26, rot: 0.3, alpha: 0.9 }],
  });
}

function steamCurl(ctx: Ctx, x: number, y: number, h: number, ph = 0, w = 2) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 8; i++) pts.push([x + Math.sin(i * 0.9 + ph) * 2.2, y - (i / 8) * h]);
  tube(ctx, pts, w, '#fbf8f2', 1.1, true);
}

// ---------------------------------------------------------------------------
// OLIO EXTRA VERGINE — glass bottle of golden-green oil + a drop
// ---------------------------------------------------------------------------
icon('icon.p.olio', (ctx) => {
  rot(ctx, -2, 1, -0.18, () => {
    const body = (c: Ctx) => {
      c.moveTo(-3.4, -15);
      c.lineTo(-3.4, -11);
      c.bezierCurveTo(-3.4, -7, -10, -6, -10, 0);
      c.lineTo(-10, 16);
      c.quadraticCurveTo(-10, 20, -6, 20);
      c.lineTo(6, 20);
      c.quadraticCurveTo(10, 20, 10, 16);
      c.lineTo(10, 0);
      c.bezierCurveTo(10, -6, 3.4, -7, 3.4, -11);
      c.lineTo(3.4, -15);
      c.closePath();
    };
    // glass
    S(ctx, body, { fill: rgba('#d8f0d0', 0.9), ink: 2, shadow: 'none' });
    // oil inside
    ctx.save();
    ctx.beginPath();
    body(ctx);
    ctx.clip();
    ctx.fillStyle = linear(ctx, -10, 0, 10, 0, [[0, '#e8dc5a'], [0.5, '#c9c23a'], [1, '#8f9a22']]);
    ctx.fillRect(-12, -4.5, 24, 26);
    ctx.fillStyle = rgba('#fff7a0', 0.8);
    ctx.beginPath();
    ellipsePath(ctx, 0, -4.5, 10, 1.4);
    ctx.fill();
    // glass highlight
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    roundRectPath(ctx, -8, -3, 2.2, 19, 1.1);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    roundRectPath(ctx, 6, 0, 1.4, 16, 0.7);
    ctx.fill();
    ctx.restore();
    // label with an olive sprig
    S(ctx, (c) => roundRectPath(c, -7.5, 3.5, 15, 10, 2), { fill: '#fbf1d8', ink: 1.3, shadow: '#e2d3ae', shadowOffset: [-1, -1] });
    oliveLeaf(ctx, -4.5, 9.5, 6.5, -0.6, 0.8);
    rot(ctx, 2.5, 8.5, 0.6, () => olive(ctx, 2.6, { ink: 0.9, color: '#6f9a2c' }));
    line(ctx, [[-5.5, 11.8], [5.5, 11.8]], 0.6, '#c9a46a', false, 0.9);
    // spout + cork
    S(ctx, (c) => roundRectPath(c, -4.2, -17.5, 8.4, 3.4, 1.2), { fill: '#d9b46a', ink: 1.5, shadow: '#a87f3c', shadowOffset: [-0.8, -0.8] });
    S(ctx, (c) => {
      c.moveTo(-2.4, -17.5);
      c.lineTo(-1.6, -22);
      c.lineTo(2.6, -22.5);
      c.lineTo(2.4, -17.5);
      c.closePath();
    }, { fill: '#c6ccd6', ink: 1.4, shadow: '#8f99a8', shadowOffset: [-0.5, -0.5] });
  });
  drop(ctx, 14, 0, 6.5);
});

// ---------------------------------------------------------------------------
// ESPRESSO — demitasse on a saucer, with steam
// ---------------------------------------------------------------------------
icon('icon.p.espresso', (ctx) => {
  steamCurl(ctx, -3, -9, 12, 0, 2.2);
  steamCurl(ctx, 4, -10, 10, 2, 1.9);
  // saucer
  S(ctx, (c) => ellipsePath(c, 0, 15, 19, 5.5), { fill: '#f7f4ee', ink: 1.9, shadow: '#cfd2df', shadowOffset: [-1.5, -1.6] });
  S(ctx, (c) => ellipsePath(c, 0, 14.4, 12, 3), { fill: '#e7e4ee', ink: 0, shadow: 'none' });
  line(ctx, [[-14, 17.5], [-4, 19.5]], 0.8, 'rgba(255,255,255,0.9)', true);
  // handle
  S(ctx, (c) => {
    c.moveTo(9, -1);
    c.bezierCurveTo(17, -3, 18, 9, 8.5, 8);
    c.lineTo(8.8, 4.8);
    c.bezierCurveTo(13.5, 5, 13, 1.5, 9.3, 2.2);
    c.closePath();
  }, { fill: '#fbf8f2', ink: 1.6, shadow: '#cfd2df', shadowOffset: [-0.8, -1] });
  // cup body
  const cup = (c: Ctx) => {
    c.moveTo(-12, -3);
    c.lineTo(12, -3);
    c.bezierCurveTo(12, 8, 8, 14, 0, 14);
    c.bezierCurveTo(-8, 14, -12, 8, -12, -3);
    c.closePath();
  };
  S(ctx, cup, { fill: '#fbf8f2', ink: 2, shadow: '#cdd0de', shadowOffset: [-3, -1.5], gloss: [{ x: -7.5, y: 3, rx: 1.6, ry: 4.5, rot: 0.15, alpha: 0.9 }] });
  // red tricolore band
  ctx.save();
  ctx.beginPath();
  cup(ctx);
  ctx.clip();
  ctx.fillStyle = '#d8343a';
  ctx.fillRect(-14, 3, 28, 2.2);
  ctx.fillStyle = '#2f9a52';
  ctx.fillRect(-14, 5.2, 28, 1.3);
  ctx.restore();
  // coffee with crema
  S(ctx, (c) => ellipsePath(c, 0, -3, 12, 3.4), { fill: '#fbf8f2', ink: 1.8, shadow: 'none' });
  S(ctx, (c) => ellipsePath(c, 0, -2.8, 10.2, 2.4), { fill: radial(ctx, -2, -3, 10, [[0, '#e6b27a'], [0.6, '#b8743c'], [1, '#6e3a1c']]), ink: 0, shadow: 'none' });
  line(ctx, [[-5, -3.2], [-1, -2.2], [3, -3.4]], 0.6, 'rgba(255,236,200,0.85)', true);
  // coffee bean on the saucer
  rot(ctx, -13, 13.5, -0.5, () => {
    S(ctx, (c) => ellipsePath(c, 0, 0, 2.6, 1.8), { fill: '#6e3a1c', ink: 1, shadow: '#4a2412', shadowOffset: [-0.4, -0.4] });
    line(ctx, [[-1.8, 0.2], [0, -0.3], [1.8, 0.2]], 0.5, '#2b1712', true);
  });
});

// ---------------------------------------------------------------------------
// GREMBIULE DELLA NONNA — floral apron with ruffled hem
// ---------------------------------------------------------------------------
icon('icon.p.grembiule', (ctx) => {
  // neck strap
  tube(ctx, [[-6, -15], [-4, -21], [4, -21], [6, -15]], 2, '#e86a6a', 1.2, true);
  // waist ties
  tube(ctx, [[-10, -4], [-16, -3], [-21, 1], [-19, 6]], 2, '#e86a6a', 1.2, true);
  tube(ctx, [[10, -4], [16, -3], [20, -6], [22, -1]], 2, '#e86a6a', 1.2, true);
  const apron = (c: Ctx) => {
    c.moveTo(-7, -16);
    c.lineTo(7, -16);
    c.lineTo(9, -5);
    c.quadraticCurveTo(9.5, -3, 11, -2);
    c.bezierCurveTo(14, 4, 16, 10, 16.5, 15);
    // ruffled hem
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x0 = 16.5 - (i / n) * 33, x1 = 16.5 - ((i + 1) / n) * 33;
      c.quadraticCurveTo((x0 + x1) / 2, 21.5, x1, 15);
    }
    c.bezierCurveTo(-16, 10, -14, 4, -11, -2);
    c.quadraticCurveTo(-9.5, -3, -9, -5);
    c.closePath();
  };
  S(ctx, apron, { fill: '#8fc4ea', ink: 2, shadow: '#5f93c4', shadowOffset: [-2.6, -1.6] });
  // floral print
  ctx.save();
  ctx.beginPath();
  apron(ctx);
  ctx.clip();
  const R = rng(4);
  for (let i = 0; i < 16; i++) {
    const x = -15 + R() * 30, y = -15 + R() * 33;
    const col = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#f2667a' : '#ffd84a';
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      ctx.fillStyle = col;
      ctx.beginPath();
      circlePath(ctx, x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1, 0.8);
      ctx.fill();
    }
    ctx.fillStyle = '#e8a23a';
    ctx.beginPath();
    circlePath(ctx, x, y, 0.55);
    ctx.fill();
  }
  ctx.restore();
  // white lace ruffle trim
  ctx.save();
  ctx.beginPath();
  const n = 7;
  ctx.moveTo(16.5, 15);
  for (let i = 0; i < n; i++) {
    const x0 = 16.5 - (i / n) * 33, x1 = 16.5 - ((i + 1) / n) * 33;
    ctx.quadraticCurveTo((x0 + x1) / 2, 21.5, x1, 15);
  }
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#fffaf0';
  ctx.stroke();
  ctx.restore();
  // waistband
  S(ctx, (c) => roundRectPath(c, -11, -5, 22, 3.4, 1.2), { fill: '#e86a6a', ink: 1.4, shadow: '#b84a4a', shadowOffset: [-0.8, -0.8] });
  // heart pocket
  S(ctx, (c) => roundRectPath(c, -6.5, 3, 13, 9, [1.5, 1.5, 4, 4]), { fill: '#fffaf0', ink: 1.4, shadow: '#e3d8c4', shadowOffset: [-1, -1] });
  ctx.save();
  ctx.setLineDash([1, 1]);
  line(ctx, [[-5.2, 4.6], [5.2, 4.6]], 0.6, '#d26a6a');
  ctx.restore();
  S(ctx, (c) => {
    const x = 0, y = 8, s = 2.6;
    c.moveTo(x, y + s * 0.95);
    c.bezierCurveTo(x - s * 1.1, y + s * 0.1, x - s * 1.0, y - s * 0.9, x, y - s * 0.35);
    c.bezierCurveTo(x + s * 1.0, y - s * 0.9, x + s * 1.1, y + s * 0.1, x, y + s * 0.95);
    c.closePath();
  }, { fill: '#e8404c', ink: 0.9, shadow: 'none' });
});

// ---------------------------------------------------------------------------
// POMODORO SAN MARZANO — elongated plum tomato
// ---------------------------------------------------------------------------
export function sanMarzano(ctx: Ctx, s = 1, ink = 2) {
  ctx.save();
  ctx.scale(s, s);
  const body = (c: Ctx) => {
    c.moveTo(0, -15);
    c.bezierCurveTo(8, -15.5, 11, -8, 10.5, 1);
    c.bezierCurveTo(10, 10, 6, 17, 0.5, 19.5);
    c.bezierCurveTo(-5.5, 17, -10, 10, -10.5, 1);
    c.bezierCurveTo(-11, -8, -8, -15.5, 0, -15);
    c.closePath();
  };
  S(ctx, body, {
    fill: radial(ctx, -4, -6, 22, [[0, '#ff7a5c'], [0.45, '#e2352a'], [1, '#a81f24']]),
    ink: ink / s,
    shadow: '#9c1c22',
    shadowOffset: [-3, -2.6],
    gloss: [
      { x: -4.5, y: -6, rx: 2.2, ry: 6, rot: 0.15, alpha: 0.85 },
      { x: -5.5, y: 6, rx: 0.9, ry: 2.2, rot: 0.1, alpha: 0.55 },
    ],
  });
  // subtle lobe line
  line(ctx, [[2, -12], [4, 0], [1.5, 15]], 0.9, rgba('#a81f24', 0.55), true);
  calyx(ctx, 0, -14.5, 8, 1.4 / s);
  ctx.restore();
}

icon('icon.p.sanmarzano', (ctx) => {
  rot(ctx, 0, 0, 0.32, () => sanMarzano(ctx));
});

// ---------------------------------------------------------------------------
// MINESTRONE — bowl of soup with veg, spoon and steam
// ---------------------------------------------------------------------------
icon('icon.p.minestrone', (ctx) => {
  steamCurl(ctx, -6, -9, 11, 0, 2);
  steamCurl(ctx, 3, -10, 12, 1.8, 2.2);
  // spoon (behind)
  rot(ctx, 9, -6, -0.75, () => {
    S(ctx, (c) => roundRectPath(c, 0, -1.6, 17, 3.2, 1.6), { fill: '#d8dee8', ink: 1.6, shadow: '#9aa6b9', shadowOffset: [-0.4, -1] });
  });
  // bowl
  const bowl = (c: Ctx) => {
    c.moveTo(-20, -2);
    c.lineTo(20, -2);
    c.bezierCurveTo(20, 10, 12, 17, 0, 17);
    c.bezierCurveTo(-12, 17, -20, 10, -20, -2);
    c.closePath();
  };
  S(ctx, (c) => roundRectPath(c, -8, 15, 16, 4.5, 1.6), { fill: '#d8673f', ink: 1.8, shadow: '#a8482c', shadowOffset: [-1, -1] });
  S(ctx, bowl, { fill: radial(ctx, -8, 0, 26, [[0, '#f59a6a'], [0.6, '#df7044'], [1, '#b04a2c']]), ink: 2, shadow: '#a4442a', shadowOffset: [-3, -2], gloss: [{ x: -13, y: 4, rx: 2, ry: 4, rot: 0.3, alpha: 0.5 }] });
  // painted rim stripe
  ctx.save();
  ctx.beginPath();
  bowl(ctx);
  ctx.clip();
  ctx.fillStyle = '#fbe6b8';
  ctx.fillRect(-22, 1.5, 44, 2);
  ctx.restore();
  // soup surface
  S(ctx, (c) => ellipsePath(c, 0, -2, 19.5, 5), { fill: radial(ctx, -4, -4, 20, [[0, '#ffad5a'], [0.6, '#e8742e'], [1, '#c4561e']]), ink: 1.8, shadow: 'none' });
  // veg: carrot coins, peas, beans, ditalini, celery
  const veg: [string, number, number, number][] = [
    ['carrot', -10, -3, 2.2], ['carrot', 6, -0.5, 2.1], ['pea', -3, -4.5, 1.3], ['pea', 11, -3.5, 1.2], ['pea', -14, -1, 1.2],
    ['pea', 2, -1.2, 1.2], ['bean', -6, 0, 1.6], ['bean', 13, 0, 1.5], ['pasta', 0, -4, 1.6], ['pasta', -12, 1, 1.5], ['celery', 8, -4.5, 1.6],
  ];
  for (const [k, x, y, r] of veg) {
    if (k === 'carrot') {
      S(ctx, (c) => ellipsePath(c, x, y, r, r * 0.65), { fill: '#ff8a2a', ink: 0.8, shadow: 'none' });
      ctx.fillStyle = '#ffc06a';
      ctx.beginPath();
      ellipsePath(ctx, x, y, r * 0.45, r * 0.3);
      ctx.fill();
    } else if (k === 'pea') {
      S(ctx, (c) => circlePath(c, x, y, r), { fill: '#6cc04a', ink: 0.7, shadow: 'none', gloss: [{ x: x - r * 0.3, y: y - r * 0.3, rx: r * 0.35, ry: r * 0.25, alpha: 0.8 }] });
    } else if (k === 'bean') {
      S(ctx, (c) => ellipsePath(c, x, y, r * 1.3, r * 0.75, 0.3), { fill: '#fbf0d8', ink: 0.8, shadow: 'none' });
    } else if (k === 'pasta') {
      S(ctx, (c) => ellipsePath(c, x, y, r, r * 0.7), { fill: '#f7d878', ink: 0.8, shadow: 'none' });
      ctx.fillStyle = '#c4561e';
      ctx.beginPath();
      ellipsePath(ctx, x, y, r * 0.4, r * 0.28);
      ctx.fill();
    } else {
      S(ctx, (c) => roundRectPath(c, x - r, y - r * 0.5, r * 2, r, 0.4), { fill: '#9ad06a', ink: 0.8, shadow: 'none' });
    }
  }
  rot(ctx, -7, -6.5, -0.4, () => basilLeaf(ctx, 6.5, { ink: 0.9 }));
  glint(ctx, 5, -4.5, 2.4, 0.6, -0.1, 0.7);
  // spoon bowl dipping in (front)
  rot(ctx, 9, -6, -0.75, () => {
    S(ctx, (c) => ellipsePath(c, -1.5, 0, 4, 3), { fill: '#d8dee8', ink: 1.5, shadow: '#9aa6b9', shadowOffset: [-0.6, -0.8] });
  });
});

// ---------------------------------------------------------------------------
// GRATTUGIA — box grater + a nugget of cheese
// ---------------------------------------------------------------------------
icon('icon.p.grattugia', (ctx) => {
  // handle loop (behind)
  tube(ctx, [[-5, -15], [-5, -21], [5, -21], [5, -15]], 2.4, '#2f2a2a', 1.4, false);
  // side face
  S(ctx, (c) => polyPath(c, [[7, -15], [11.5, -13], [15, 18], [10, 20]]), { fill: linear(ctx, 7, 0, 15, 0, [[0, '#a9b4c4'], [1, '#7e8aa0']]), ink: 1.9, shadow: 'none' });
  // front face
  const front = (c: Ctx) => polyPath(c, [[-7, -15], [7, -15], [10, 20], [-10, 20]]);
  S(ctx, front, { fill: linear(ctx, -10, 0, 10, 0, [[0, '#f3f6fa'], [0.5, '#d4dbe5'], [1, '#b3becd']]), ink: 2, shadow: 'none' });
  // grating holes: rows of little raised slots
  ctx.save();
  ctx.beginPath();
  front(ctx);
  ctx.clip();
  for (let r = 0; r < 7; r++) {
    const y = -11 + r * 4.4;
    const half = 7 + (y + 15) * (3 / 35);
    for (let x = -half + 2.2; x <= half - 2; x += 3.4) {
      const xx = x + (r % 2) * 1.7;
      ctx.fillStyle = '#4e5668';
      ctx.beginPath();
      ellipsePath(ctx, xx, y, 1.1, 0.75);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ellipsePath(ctx, xx - 0.2, y - 0.85, 1.0, 0.35);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  polyPath(ctx, [[-7, -15], [-3.5, -15], [-6, 20], [-10, 20]]);
  ctx.fill();
  ctx.restore();
  // top rim
  S(ctx, (c) => polyPath(c, [[-7.5, -16.5], [7.5, -16.5], [11.8, -14.2], [-3, -14.2]]), { fill: '#e8edf3', ink: 1.5, shadow: 'none' });
  // cheese nugget + gratings
  rot(ctx, -13, 15, -0.2, () => {
    S(ctx, (c) => polyPath(c, [[-6, 3.5], [-4.5, -4], [5.5, -2], [6.5, 3.5]]), { fill: '#f6d26a', ink: 1.6, shadow: '#d9a83e', shadowOffset: [-1, -1.2] });
    S(ctx, (c) => polyPath(c, [[-4.5, -4], [5.5, -2], [6.5, 3.5], [5.2, -3.8]]), { fill: '#d99a3a', ink: 0, shadow: 'none' });
    speckle(ctx, 0, 0.5, 4, 2.2, 6, '#fff3c0', 0.5, 3, 0.9);
  });
  for (const [x, y, a] of [[13, 21, 0.4], [17, 19.5, -0.3], [9, 22, 1.1]] as [number, number, number][]) {
    rot(ctx, x, y, a, () => S(ctx, (c) => roundRectPath(c, -2, -0.6, 4, 1.2, 0.6), { fill: '#f6d26a', ink: 0.8, shadow: 'none' }));
  }
});

// ---------------------------------------------------------------------------
// SEMOLA DI GRANO DURO — burlap sack with wheat ears
// ---------------------------------------------------------------------------
function wheatEar(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, ink = 1.1) {
  tube(ctx, [[x0, y0], [x1, y1]], 1.2, '#d9a840', ink, false);
  const a = Math.atan2(y1 - y0, x1 - x0);
  const len = Math.hypot(x1 - x0, y1 - y0);
  rot(ctx, x1, y1, a, () => {
    // grains in chevrons
    for (let i = 0; i < 5; i++) {
      const gx = -i * 2.3;
      for (const sd of [-1, 1]) {
        S(ctx, (c) => ellipsePath(c, gx, sd * 1.4, 1.7, 1.05, sd * 0.5), { fill: '#f2c45a', ink: ink * 0.8, shadow: '#c9902e', shadowOffset: [-0.3, -0.35] });
      }
    }
    S(ctx, (c) => ellipsePath(c, 2, 0, 1.8, 1.1), { fill: '#f2c45a', ink: ink * 0.8, shadow: 'none' });
    // awns
    for (let i = 0; i < 4; i++) {
      line(ctx, [[-i * 2.3, -1.8], [-i * 2.3 + 4, -4.2]], 0.45, '#b9862e', false, 0.9);
      line(ctx, [[-i * 2.3, 1.8], [-i * 2.3 + 4, 4.2]], 0.45, '#b9862e', false, 0.9);
    }
  });
  void len;
}

icon('icon.p.semola', (ctx) => {
  // wheat ears behind the sack opening
  wheatEar(ctx, -2, -6, -10, -20);
  wheatEar(ctx, 1, -6, 2, -22);
  wheatEar(ctx, 3, -6, 12, -19);
  const sack = (c: Ctx) => {
    c.moveTo(-9, -7);
    c.bezierCurveTo(-18, -3, -19, 10, -16, 17);
    c.quadraticCurveTo(-15, 20.5, -10, 20.5);
    c.lineTo(10, 20.5);
    c.quadraticCurveTo(15, 20.5, 16, 17);
    c.bezierCurveTo(19, 10, 18, -3, 9, -7);
    c.closePath();
  };
  S(ctx, sack, { fill: radial(ctx, -5, 2, 24, [[0, '#f0d3a0'], [0.6, '#dcb47a'], [1, '#b98a52']]), ink: 2, shadow: '#a87c48', shadowOffset: [-3, -2] });
  // burlap weave
  ctx.save();
  ctx.beginPath();
  sack(ctx);
  ctx.clip();
  ctx.strokeStyle = rgba('#9a6e3c', 0.35);
  ctx.lineWidth = 0.6;
  for (let y = -6; y < 22; y += 2.2) {
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(20, y + 0.6);
    ctx.stroke();
  }
  for (let x = -18; x < 20; x += 2.2) {
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.lineTo(x + 0.6, 22);
    ctx.stroke();
  }
  ctx.restore();
  // stamped wheat emblem (no text)
  S(ctx, (c) => ellipsePath(c, 0, 8.5, 7.5, 6.5), { fill: rgba('#fbf0d8', 0.0), ink: 0, shadow: 'none' });
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = rgba('#7a4a20', 0.75);
  ctx.beginPath();
  ellipsePath(ctx, 0, 8.5, 7.5, 6.2);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.75;
  line(ctx, [[0, 13], [0, 4]], 0.9, '#7a4a20');
  for (let i = 0; i < 3; i++) {
    line(ctx, [[0, 11 - i * 2.4], [-2.2, 9.6 - i * 2.4]], 0.9, '#7a4a20');
    line(ctx, [[0, 11 - i * 2.4], [2.2, 9.6 - i * 2.4]], 0.9, '#7a4a20');
  }
  ctx.restore();
  // gathered neck + string
  S(ctx, (c) => {
    c.moveTo(-11, -9);
    c.quadraticCurveTo(-6, -5.5, 0, -6.5);
    c.quadraticCurveTo(6, -5.5, 11, -9);
    c.quadraticCurveTo(12, -11.5, 8, -11);
    c.quadraticCurveTo(0, -9, -8, -11);
    c.quadraticCurveTo(-12, -11.5, -11, -9);
    c.closePath();
  }, { fill: '#e8c48c', ink: 1.6, shadow: '#b98a52', shadowOffset: [-0.8, -0.8] });
  tube(ctx, [[-9, -5.5], [0, -4.2], [9, -5.5]], 1.6, '#c0392b', 1, true);
  tube(ctx, [[1, -4.4], [3, -1], [1.5, 2]], 1.3, '#c0392b', 0.9, true);
  // spilled semolina
  S(ctx, (c) => ellipsePath(c, 15, 20, 6, 2.2), { fill: '#f6d97a', ink: 1.2, shadow: '#d9b04a', shadowOffset: [-0.6, -0.6] });
  speckle(ctx, 15, 19.5, 5, 1.5, 8, '#fff3c0', 0.4, 5, 0.9);
});

// ---------------------------------------------------------------------------
// MACINAPEPE — wooden pepper mill + peppercorns
// ---------------------------------------------------------------------------
icon('icon.p.macinapepe', (ctx) => {
  rot(ctx, 0, 0, 0.2, () => {
    const mill = (c: Ctx) => {
      c.moveTo(-6, -14);
      c.bezierCurveTo(-9, -10, -9, -6, -5.5, -3);
      c.bezierCurveTo(-3.6, -1.2, -3.8, 1.5, -6.5, 4);
      c.bezierCurveTo(-10, 7.5, -10, 13, -8, 16);
      c.lineTo(-8.5, 20);
      c.lineTo(8.5, 20);
      c.lineTo(8, 16);
      c.bezierCurveTo(10, 13, 10, 7.5, 6.5, 4);
      c.bezierCurveTo(3.8, 1.5, 3.6, -1.2, 5.5, -3);
      c.bezierCurveTo(9, -6, 9, -10, 6, -14);
      c.closePath();
    };
    S(ctx, mill, {
      fill: linear(ctx, -10, 0, 10, 0, [[0, '#b0683a'], [0.3, '#8e4a26'], [0.75, '#6a3418'], [1, '#4e2410']]),
      ink: 2, shadow: 'none',
      gloss: [{ x: -5.5, y: 10, rx: 1.3, ry: 5, rot: 0.1, alpha: 0.6 }, { x: -5.6, y: -8.5, rx: 1, ry: 3, rot: -0.2, alpha: 0.55 }],
    });
    // turned rings
    for (const y of [-3.2, 4.2, 16]) {
      line(ctx, [[-7, y], [7, y]], 0.9, rgba('#3a1a0a', 0.6));
    }
    // top cap + chrome nut
    S(ctx, (c) => {
      c.moveTo(-6, -14);
      c.quadraticCurveTo(0, -20, 6, -14);
      c.closePath();
    }, { fill: '#7a3c1c', ink: 1.8, shadow: '#4e2410', shadowOffset: [-0.8, -0.8] });
    S(ctx, (c) => {
      ellipsePath(c, 0, -19, 2.6, 1.6);
      roundRectPath(c, -1.2, -19, 2.4, 2.5, 0.4);
    }, { fill: '#dfe5ee', ink: 1.3, shadow: '#9aa6b9', shadowOffset: [-0.5, -0.5], gloss: [{ x: -0.8, y: -19.6, rx: 0.9, ry: 0.4, alpha: 0.9 }] });
  });
  // peppercorns
  const R = rng(6);
  for (const [x, y, r] of [[-15, 17, 2.2], [-11, 20, 1.9], [14, 19, 2.1], [-17, 12.5, 1.7], [11.5, 21.5, 1.6]] as [number, number, number][]) {
    S(ctx, (c) => circlePath(c, x, y, r), { fill: '#3e2a24', ink: 1, shadow: '#21140f', shadowOffset: [-r * 0.3, -r * 0.3], gloss: [{ x: x - r * 0.35, y: y - r * 0.35, rx: r * 0.3, ry: r * 0.2, alpha: 0.7 }] });
    line(ctx, [[x - r * 0.5, y + R() * 0.4], [x + r * 0.4, y - r * 0.2]], 0.35, '#6a4a3a', true, 0.8);
  }
});

// ---------------------------------------------------------------------------
// VESPA — a cute generic retro scooter
// ---------------------------------------------------------------------------
icon('icon.p.vespa', (ctx) => {
  // speed lines
  for (const [y, l] of [[-4, 9], [2, 12], [8, 8]] as [number, number][]) {
    line(ctx, [[-22, y], [-22 + l, y]], 3.2, '#2b1712', false, 0.9);
    line(ctx, [[-22, y], [-22 + l, y]], 1.4, '#ffffff', false, 0.95);
  }
  const wheel = (x: number) => {
    S(ctx, (c) => circlePath(c, x, 13, 5.6), { fill: '#3a3536', ink: 1.8, shadow: '#1e1a1b', shadowOffset: [-0.8, -0.9] });
    S(ctx, (c) => circlePath(c, x, 13, 2.6), { fill: '#e3e7ee', ink: 1, shadow: '#9aa6b9', shadowOffset: [-0.4, -0.5] });
  };
  wheel(-9);
  wheel(14);
  // body: rear cowl + floorboard + leg shield
  const body = (c: Ctx) => {
    c.moveTo(-17, 9);
    c.bezierCurveTo(-18, 0, -14, -6, -5, -5);
    c.lineTo(1, -4);
    c.lineTo(3, 6);
    c.lineTo(9, 6);
    c.lineTo(10, -12);
    c.quadraticCurveTo(15, -13, 16, -9);
    c.lineTo(16, 7);
    c.quadraticCurveTo(16, 10, 13, 10);
    c.lineTo(-14, 10.5);
    c.quadraticCurveTo(-17, 10.5, -17, 9);
    c.closePath();
  };
  S(ctx, body, {
    fill: radial(ctx, -6, -4, 26, [[0, '#b8f0de'], [0.55, '#7fd4bd'], [1, '#4aa78f']]),
    ink: 2, shadow: '#3f9680', shadowOffset: [-2, -2],
    gloss: [{ x: -10, y: -2, rx: 4, ry: 1.6, rot: -0.3, alpha: 0.75 }, { x: 13, y: -6, rx: 0.9, ry: 3.6, alpha: 0.6 }],
  });
  // seat
  S(ctx, (c) => roundRectPath(c, -14, -9, 13, 4, 2), { fill: '#7a4a2c', ink: 1.6, shadow: '#55301c', shadowOffset: [-0.6, -0.8], gloss: [{ x: -9, y: -8, rx: 3, ry: 0.7, alpha: 0.4 }] });
  // handlebar + headlight
  tube(ctx, [[13, -12], [12, -17], [8, -18.5]], 1.8, '#d8dee8', 1.2, true);
  tube(ctx, [[12, -17], [17, -18]], 2.6, '#2f2a2a', 1, false);
  S(ctx, (c) => circlePath(c, 17.5, -11.5, 3.4), { fill: '#fff6c8', ink: 1.5, shadow: '#e8c86a', shadowOffset: [-0.6, -0.6], gloss: [{ x: 16.5, y: -12.5, rx: 1.2, ry: 0.8, alpha: 0.95 }] });
  // little tricolore flag on the back
  tube(ctx, [[-15, -2], [-17, -12]], 0.9, '#5a4a40', 0.8, false);
  S(ctx, (c) => polyPath(c, [[-16.6, -12], [-10.5, -11.2], [-11, -8], [-16.2, -8.6]]), { fill: '#ffffff', ink: 1, shadow: 'none' });
  ctx.fillStyle = '#2f9a52';
  ctx.beginPath();
  polyPath(ctx, [[-16.6, -12], [-14.5, -11.7], [-14.4, -8.4], [-16.2, -8.6]]);
  ctx.fill();
  ctx.fillStyle = '#dc3439';
  ctx.beginPath();
  polyPath(ctx, [[-12.5, -11.45], [-10.5, -11.2], [-11, -8], [-12.6, -8.2]]);
  ctx.fill();
});

// ---------------------------------------------------------------------------
// CORNICELLO — red lucky horn with gold cap
// ---------------------------------------------------------------------------
icon('icon.p.cornicello', (ctx) => {
  rot(ctx, 0, 0, 0.12, () => {
    const horn = (c: Ctx) => {
      c.moveTo(-8, -10);
      c.bezierCurveTo(-9, 2, -4, 12, 9, 19);
      c.bezierCurveTo(1, 9, 1, 0, 6, -10);
      c.closePath();
    };
    S(ctx, horn, {
      fill: radial(ctx, -4, -4, 24, [[0, '#ff7060'], [0.5, '#e0283a'], [1, '#a0141f']]),
      ink: 2.1, shadow: '#a0141f', shadowOffset: [-2.4, -1.6],
      gloss: [{ x: -4.6, y: -3, rx: 1.5, ry: 6, rot: -0.15, alpha: 0.85 }, { x: 1, y: 10, rx: 0.7, ry: 2.6, rot: -0.7, alpha: 0.6 }],
    });
    // spiral twist lines
    ctx.save();
    ctx.beginPath();
    horn(ctx);
    ctx.clip();
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const y = -6 + t * 20;
      line(ctx, [[-10 + t * 6, y + 2], [4 + t * 3, y - 2]], 0.8, rgba('#8c0f1a', 0.55), true);
    }
    ctx.restore();
    // gold cap + ring
    S(ctx, (c) => roundRectPath(c, -9.5, -15, 17, 6.5, 2), { fill: goldGrad(ctx, -9, -15, 8, -9), ink: 1.8, shadow: '#c27a12', shadowOffset: [-0.8, -1] });
    line(ctx, [[-8.5, -11.5], [6.5, -11.5]], 0.8, '#b06a10', false, 0.8);
    ctx.save();
    ctx.beginPath();
    ellipsePath(ctx, -1, -19, 3.4, 3.4);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#2b1712';
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#f8c437';
    ctx.stroke();
    ctx.restore();
  });
  inkSparkle(ctx, 13, -12, 3.6, '#fff6c8', 1);
  inkSparkle(ctx, -14, 10, 2.6, '#fff6c8', 0.9);
});

// ---------------------------------------------------------------------------
// RICETTARIO DELLA NONNA — old recipe book with cards + ribbon
// ---------------------------------------------------------------------------
icon('icon.p.ricettario', (ctx) => {
  rot(ctx, 0, 1, -0.12, () => {
    // recipe cards sticking out (behind)
    rot(ctx, 4, -16, 0.18, () => S(ctx, (c) => roundRectPath(c, -5, -4, 11, 10, 1), { fill: '#fbf3dc', ink: 1.4, shadow: '#e2d3ae', shadowOffset: [-0.8, -0.8] }));
    rot(ctx, -6, -16, -0.12, () => S(ctx, (c) => roundRectPath(c, -5, -3, 10, 9, 1), { fill: '#fff8e8', ink: 1.4, shadow: '#e2d3ae', shadowOffset: [-0.8, -0.8] }));
    line(ctx, [[1.5, -18.5], [7.5, -17.5]], 0.7, '#7a8ab0', false);
    line(ctx, [[1.2, -16.6], [6.5, -15.7]], 0.7, '#7a8ab0', false);
    line(ctx, [[-9.5, -18.5], [-3.5, -19.2]], 0.7, '#7a8ab0', false);
    // page block (side)
    S(ctx, (c) => polyPath(c, [[15, -14], [18, -11], [18, 19], [15, 17]]), { fill: '#f4e8c8', ink: 1.8, shadow: 'none' });
    for (let i = 0; i < 5; i++) line(ctx, [[15.6, -10 + i * 6], [17.4, -8 + i * 6]], 0.5, '#c9b48a', false, 0.8);
    // cover
    const cover = (c: Ctx) => roundRectPath(c, -15, -14, 30, 31, 2.5);
    S(ctx, cover, {
      fill: radial(ctx, -6, -6, 30, [[0, '#c4434e'], [0.6, '#962a36'], [1, '#6e1a26']]),
      ink: 2.1, shadow: '#5e1420', shadowOffset: [-2.4, -2.4],
      gloss: [{ x: -9, y: -8, rx: 4, ry: 1.6, rot: -0.5, alpha: 0.35 }],
    });
    // spine
    S(ctx, (c) => roundRectPath(c, -15, -14, 5, 31, [2.5, 0, 0, 2.5]), { fill: '#7a1e2a', ink: 1.4, shadow: 'none' });
    for (const y of [-9, 12]) line(ctx, [[-14.5, y], [-10.5, y]], 1, '#f8c437', false);
    // gold corners
    for (const [x, y, sx, sy] of [[15, -14, -1, 1], [15, 17, -1, -1]] as [number, number, number, number][]) {
      S(ctx, (c) => polyPath(c, [[x, y], [x + sx * 6, y], [x, y + sy * 6]]), { fill: goldGrad(ctx, x - 6, y - 6, x + 6, y + 6), ink: 1.2, shadow: 'none' });
    }
    // cover emblem: crossed wooden spoon & whisk in a gold frame
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#f8c437';
    ctx.beginPath();
    roundRectPath(ctx, -6.5, -7, 18, 18, 3);
    ctx.stroke();
    ctx.restore();
    rot(ctx, 2.5, 2, -0.75, () => {
      tube(ctx, [[-8, 0], [5, 0]], 1.4, '#f8c437', 0.9, false);
      S(ctx, (c) => ellipsePath(c, 6.5, 0, 2.6, 1.8), { fill: '#f8c437', ink: 0.9, shadow: 'none' });
    });
    rot(ctx, 2.5, 2, 0.75, () => {
      tube(ctx, [[-8, 0], [2, 0]], 1.2, '#f8c437', 0.9, false);
      ctx.save();
      ctx.strokeStyle = '#2b1712';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ellipsePath(ctx, 5, 0, 3.6, 2.2);
      ctx.stroke();
      ctx.strokeStyle = '#f8c437';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
    // ribbon bookmark
    S(ctx, (c) => polyPath(c, [[7, 16], [10.5, 16], [10.5, 23], [8.75, 21.2], [7, 23]]), { fill: '#2f9a52', ink: 1.2, shadow: 'none' });
  });
});

// ---------------------------------------------------------------------------
// PROFUMO DI RAGÙ — simmering pot with aroma swirls
// ---------------------------------------------------------------------------
icon('icon.p.profumo', (ctx) => {
  // aroma swirls
  const swirl = (x: number, y: number, h: number, ph: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 10; i++) pts.push([x + Math.sin(i * 0.8 + ph) * 3, y - (i / 10) * h]);
    tube(ctx, pts, 2.2, '#ffd9b0', 1.1, true, '#ffffff', 0.7);
  };
  swirl(-9, -6, 14, 0);
  swirl(0, -8, 15, 2);
  swirl(9, -6, 13, 4);
  // wooden spoon (behind)
  rot(ctx, 6, -2, -1.0, () => {
    S(ctx, (c) => roundRectPath(c, 0, -1.4, 20, 2.8, 1.4), { fill: '#d9a466', ink: 1.6, shadow: '#a8743c', shadowOffset: [-0.4, -0.9] });
  });
  // pot
  const pot = (c: Ctx) => {
    c.moveTo(-17, -2);
    c.lineTo(17, -2);
    c.lineTo(16, 15);
    c.quadraticCurveTo(15.5, 19, 11, 19);
    c.lineTo(-11, 19);
    c.quadraticCurveTo(-15.5, 19, -16, 15);
    c.closePath();
  };
  // handles
  S(ctx, (c) => {
    roundRectPath(c, -22, 1, 7, 3.4, 1.7);
    roundRectPath(c, 15, 1, 7, 3.4, 1.7);
  }, { fill: '#b8683a', ink: 1.6, shadow: '#7a3c1c', shadowOffset: [-0.5, -0.8] });
  S(ctx, pot, {
    fill: linear(ctx, -17, 0, 17, 0, [[0, '#f0a06a'], [0.35, '#d9783e'], [0.8, '#a84e26'], [1, '#8a3c1c']]),
    ink: 2, shadow: 'none',
    gloss: [{ x: -11, y: 7, rx: 1.6, ry: 6, rot: 0.05, alpha: 0.65 }],
  });
  line(ctx, [[-16.5, 4], [16.5, 4]], 0.9, rgba('#7a3c1c', 0.6));
  // rim + bubbling ragù
  S(ctx, (c) => ellipsePath(c, 0, -2, 17.5, 4.4), { fill: '#e8955c', ink: 1.9, shadow: 'none' });
  S(ctx, (c) => ellipsePath(c, 0, -1.8, 15, 3.2), { fill: radial(ctx, -3, -3, 15, [[0, '#e8503a'], [0.6, '#b8281e'], [1, '#801818']]), ink: 0, shadow: 'none' });
  for (const [x, y, r] of [[-6, -2.5, 1.6], [4, -1.2, 1.3], [9, -2.6, 1], [-1, -0.6, 0.9]] as [number, number, number][]) {
    S(ctx, (c) => circlePath(c, x, y, r), { fill: '#e8503a', ink: 0.7, shadow: 'none', gloss: [{ x: x - r * 0.3, y: y - r * 0.35, rx: r * 0.35, ry: r * 0.22, alpha: 0.9 }] });
  }
  speckle(ctx, 0, -1.8, 12, 2.2, 8, '#6a2a18', 0.45, 4, 0.8);
  rot(ctx, -9, -3.2, -0.3, () => basilLeaf(ctx, 6.5, { ink: 0.9 }));
});

// ---------------------------------------------------------------------------
// SALE GROSSO — jar of coarse salt crystals
// ---------------------------------------------------------------------------
function crystal(ctx: Ctx, x: number, y: number, s: number, a: number, ink = 1) {
  rot(ctx, x, y, a, () => {
    S(ctx, (c) => polyPath(c, [[-s, -s * 0.7], [s * 0.6, -s], [s, s * 0.6], [-s * 0.5, s]]), { fill: '#ffffff', ink, shadow: '#cfd8ec', shadowOffset: [-s * 0.35, -s * 0.4] });
    ctx.fillStyle = rgba('#dfe9ff', 0.9);
    ctx.beginPath();
    polyPath(ctx, [[s * 0.6, -s], [s, s * 0.6], [s * 0.15, 0]]);
    ctx.fill();
  });
}

icon('icon.p.sale', (ctx) => {
  // wooden scoop resting in the heap (behind)
  rot(ctx, 9, -12, -0.7, () => {
    S(ctx, (c) => roundRectPath(c, 0, -1.6, 13, 3.2, 1.6), { fill: '#d9a466', ink: 1.6, shadow: '#a8743c', shadowOffset: [-0.4, -1] });
  });
  // terracotta salt crock
  const crock = (c: Ctx) => {
    c.moveTo(-17, -3);
    c.lineTo(17, -3);
    c.bezierCurveTo(18, 6, 15, 17, 9, 19);
    c.lineTo(-9, 19);
    c.bezierCurveTo(-15, 17, -18, 6, -17, -3);
    c.closePath();
  };
  // heap of coarse crystals (behind the rim)
  const heap = (c: Ctx) => {
    c.moveTo(-17, -2);
    c.bezierCurveTo(-15, -15, -5, -21, 1, -20.5);
    c.bezierCurveTo(9, -20, 15, -13, 17, -2);
    c.closePath();
  };
  S(ctx, heap, { fill: '#f3f7fd', ink: 1.8, shadow: '#c9d4e6', shadowOffset: [-2.4, -2.4] });
  ctx.save();
  ctx.beginPath();
  heap(ctx);
  ctx.clip();
  const R = rng(9);
  for (let i = 0; i < 22; i++) {
    const t = R();
    const x = -15 + t * 30;
    const top = -2 - Math.sin(t * Math.PI) * 18;
    const y = top + 1.5 + R() * (-top - 2);
    crystal(ctx, x, y, 1.9 + R() * 1.3, R() * 3, 0.7);
  }
  ctx.restore();
  S(ctx, crock, {
    fill: radial(ctx, -6, 2, 24, [[0, '#f0a06a'], [0.55, '#d4763e'], [1, '#a4502a']]),
    ink: 2, shadow: '#9a4424', shadowOffset: [-2.6, -1.8],
    gloss: [{ x: -11, y: 5, rx: 1.6, ry: 4.5, rot: 0.2, alpha: 0.55 }],
  });
  // glazed band with little waves
  ctx.save();
  ctx.beginPath();
  crock(ctx);
  ctx.clip();
  ctx.fillStyle = '#2f6fb8';
  ctx.fillRect(-20, 3, 40, 4.4);
  ctx.strokeStyle = '#e8f2ff';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = -18; x <= 18; x += 1) {
    const y = 5.2 + Math.sin(x * 0.9) * 1.1;
    if (x === -18) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  // rim
  S(ctx, (c) => roundRectPath(c, -18.5, -5, 37, 4, 2), { fill: '#e08850', ink: 1.8, shadow: '#a4502a', shadowOffset: [-0.6, -0.9], gloss: [{ x: -8, y: -4.2, rx: 7, ry: 0.7, alpha: 0.5 }] });
  // spilled crystals
  crystal(ctx, -19, 17, 2.4, 0.4, 1.1);
  crystal(ctx, 18, 18, 2.2, 1.2, 1.1);
  crystal(ctx, 14.5, 21, 1.6, 0.2, 1);
  inkSparkle(ctx, -9, -17, 3.2, '#ffffff', 0.9);
  inkSparkle(ctx, 4, -22, 2.4, '#ffffff', 0.8);
});

// ---------------------------------------------------------------------------
// SALVADANAIO — ceramic piggy bank with a coin going in
// ---------------------------------------------------------------------------
icon('icon.p.salvadanaio', (ctx) => {
  // legs
  for (const x of [-9, -3, 6, 11]) {
    S(ctx, (c) => roundRectPath(c, x - 2.4, 11, 4.8, 7, 2), { fill: x < 0 && x > -5 || x > 10 ? '#e67a9a' : '#f193ae', ink: 1.6, shadow: '#c95a7a', shadowOffset: [-0.6, -0.6] });
  }
  // tail
  tube(ctx, [[-17, 2], [-20, -0.5], [-19, -3.5], [-16.5, -2], [-19.5, 1]], 1.4, '#f193ae', 1, true);
  // body
  S(ctx, (c) => ellipsePath(c, 0, 2, 18, 13.5), {
    fill: radial(ctx, -5, -4, 22, [[0, '#ffd0de'], [0.5, '#f7a2bb'], [1, '#df7695']]),
    ink: 2.1, shadow: '#d66e8c', shadowOffset: [-3, -2.6],
    gloss: [{ x: -6, y: -6, rx: 5, ry: 2.4, rot: -0.4, alpha: 0.85 }],
  });
  // ear
  S(ctx, (c) => polyPath(c, [[5, -9], [8, -17], [12, -8]]), { fill: '#f7a2bb', ink: 1.6, shadow: '#d66e8c', shadowOffset: [-0.8, -0.8] });
  // snout
  S(ctx, (c) => ellipsePath(c, 17, 3, 4, 5), { fill: '#f7a2bb', ink: 1.8, shadow: '#d66e8c', shadowOffset: [-0.8, -0.9] });
  for (const y of [1.3, 4.7]) {
    ctx.fillStyle = '#b84a6a';
    ctx.beginPath();
    ellipsePath(ctx, 17.6, y, 0.8, 1.1);
    ctx.fill();
  }
  // eye + blush
  ctx.fillStyle = '#2b1712';
  ctx.beginPath();
  ellipsePath(ctx, 10, -2.5, 1.5, 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  circlePath(ctx, 9.5, -3.2, 0.55);
  ctx.fill();
  ctx.fillStyle = rgba('#ff6a8a', 0.5);
  ctx.beginPath();
  ellipsePath(ctx, 10.5, 2.5, 2.4, 1.3);
  ctx.fill();
  // flower painted on the flank
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    S(ctx, (c) => circlePath(c, -6 + Math.cos(a) * 2, 4 + Math.sin(a) * 2, 1.4), { fill: '#ffffff', ink: 0.6, shadow: 'none' });
  }
  S(ctx, (c) => circlePath(c, -6, 4, 1.2), { fill: '#ffd84a', ink: 0.6, shadow: 'none' });
  // coin slot + coin
  S(ctx, (c) => roundRectPath(c, -6, -11.6, 9, 2, 1), { fill: '#7a2a40', ink: 1, shadow: 'none' });
  rot(ctx, -1.5, -16.5, 0.15, () => {
    ctx.save();
    ctx.scale(0.62, 1);
    coinFace(ctx, 6.5, { ink: 1.6 / 0.8 });
    ctx.restore();
  });
});

