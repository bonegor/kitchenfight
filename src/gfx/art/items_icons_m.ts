/**
 * ICONS — misc UI icons (coin, kill, clock, heart, reroll, skip, banish,
 * revival, lock, star, level, xp). 48×48, anchor centre, res 3.
 * (icon.chest lives in items_pickups.ts with the picnic basket painter.)
 */
import { Ctx, Pt, ellipsePath, circlePath, roundRectPath, polyPath, line, rgba, starPath } from '../painter';
import { S, G, icon, goldGrad, goldBall, radial, linear, tube, inkSparkle } from './items_kit';
import { fork, coinFace, heart, basilLeaf, chefKnife } from './items_objects';

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  fn();
  ctx.restore();
}

/** Table knife (rounded blade), pointing right. */
export function tableKnife(ctx: Ctx, L: number, ink = 1.6) {
  const hx = -L / 2, bx = -L / 2 + L * 0.42;
  const hw = L * 0.055;
  G(ctx, [
    { build: (c) => roundRectPath(c, hx, -hw, L * 0.44, hw * 2, hw), style: { fill: linear(ctx, 0, -hw, 0, hw, [[0, '#ffffff'], [0.5, '#d4dbe5'], [1, '#9aa7b9']]), shadow: 'none' } },
    {
      build: (c) => {
        c.moveTo(bx, -hw * 0.75);
        c.lineTo(L / 2 - L * 0.08, -hw * 1.25);
        c.quadraticCurveTo(L / 2, -hw * 1.2, L / 2, 0);
        c.quadraticCurveTo(L / 2 - L * 0.02, hw * 0.75, L / 2 - L * 0.12, hw * 0.8);
        c.lineTo(bx, hw * 0.6);
        c.closePath();
      },
      style: { fill: linear(ctx, 0, -hw, 0, hw, [[0, '#ffffff'], [0.5, '#dfe5ee'], [1, '#a6b2c3']]), shadow: 'none' },
    },
  ], ink);
  line(ctx, [[bx + L * 0.04, -hw * 0.45], [L / 2 - L * 0.1, -hw * 0.75]], Math.max(0.4, L * 0.015), '#ffffff', false, 0.9);
  line(ctx, [[hx + L * 0.06, 0], [bx - L * 0.06, 0]], Math.max(0.4, L * 0.012), '#8d9ab0', false, 0.7);
}

// ---------------------------------------------------------------------------
icon('icon.coin', (ctx) => coinFace(ctx, 19, { ink: 2 }));

icon('icon.kill', (ctx) => {
  rot(ctx, 0, 0, -Math.PI / 4, () => fork(ctx, 44, { ink: 1.9, tines: 4 }));
  rot(ctx, 0, 0, -Math.PI * 0.75, () => tableKnife(ctx, 44, 1.9));
});

// ---------------------------------------------------------------------------
icon('icon.clock', (ctx) => {
  // bells + hammer
  for (const s of [-1, 1]) {
    rot(ctx, s * 10.5, -14, s * 0.55, () => {
      S(ctx, (c) => {
        c.moveTo(-6, 2);
        c.quadraticCurveTo(-6, -5, 0, -5);
        c.quadraticCurveTo(6, -5, 6, 2);
        c.closePath();
      }, { fill: goldGrad(ctx, -6, -5, 6, 2), ink: 1.8, shadow: '#c27a12', shadowOffset: [-0.8, -1] });
    });
  }
  tube(ctx, [[0, -16], [0, -21]], 1.8, '#c6ccd6', 1.1, false);
  S(ctx, (c) => circlePath(c, 0, -21.5, 1.8), { fill: '#e8edf3', ink: 1.1, shadow: 'none' });
  // feet
  tube(ctx, [[-9, 13], [-12, 20]], 2.4, '#3a3536', 1.2, false);
  tube(ctx, [[9, 13], [12, 20]], 2.4, '#3a3536', 1.2, false);
  // body
  S(ctx, (c) => circlePath(c, 0, 1, 16), {
    fill: radial(ctx, -5, -4, 20, [[0, '#ff7262'], [0.5, '#e2363a'], [1, '#a81f28']]),
    ink: 2.1, shadow: '#a01c26', shadowOffset: [-2.2, -2.4],
    gloss: [{ x: -8, y: -8, rx: 4, ry: 2, rot: -0.7, alpha: 0.8 }],
  });
  S(ctx, (c) => circlePath(c, 0, 1, 12.2), { fill: radial(ctx, -3, -2, 14, [[0, '#ffffff'], [1, '#efe6d2']]), ink: 1.5, shadow: '#d8ccb4', shadowOffset: [-1.2, -1.2] });
  // ticks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 8.4 : 9.6;
    line(ctx, [[Math.cos(a) * r0, 1 + Math.sin(a) * r0], [Math.cos(a) * 10.8, 1 + Math.sin(a) * 10.8]], i % 3 === 0 ? 1.5 : 0.9, '#5a4a40');
  }
  // hands (10:10)
  tube(ctx, [[0, 1], [-5, -2.5]], 1.8, '#2b1712', 0, false);
  tube(ctx, [[0, 1], [6.2, -4.5]], 1.4, '#2b1712', 0, false);
  tube(ctx, [[0, 1], [2.5, 8]], 0.7, '#e2363a', 0, false);
  S(ctx, (c) => circlePath(c, 0, 1, 1.6), { fill: '#e2363a', ink: 0.8, shadow: 'none' });
});

icon('icon.heart', (ctx) => {
  heart(ctx, 0, 0, 19, { ink: 2.2 });
});

// ---------------------------------------------------------------------------
function curvedArrow(ctx: Ctx, cx: number, cy: number, r: number, a0: number, a1: number, w: number, col: string, ink = 1.6) {
  const pts: Pt[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = a0 + ((a1 - a0) * i) / 14;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  tube(ctx, pts, w, col, ink, true, '#ffffff', 0.55);
  // arrowhead at a1
  const ax = cx + Math.cos(a1) * r, ay = cy + Math.sin(a1) * r;
  const dir = a1 + (a1 > a0 ? Math.PI / 2 : -Math.PI / 2);
  rot(ctx, ax, ay, dir, () => {
    S(ctx, (c) => polyPath(c, [[w * 1.5, 0], [-w * 0.6, -w * 1.25], [-w * 0.6, w * 1.25]]), { fill: col, ink, shadow: 'none' });
  });
}

icon('icon.reroll', (ctx) => {
  // die in the centre
  rot(ctx, 0, 0, -0.18, () => {
    S(ctx, (c) => roundRectPath(c, -9, -9, 18, 18, 4), { fill: '#fffaf0', ink: 1.9, shadow: '#d8cfc0', shadowOffset: [-1.8, -1.8], gloss: [{ x: -4, y: -5.5, rx: 4, ry: 1.6, rot: -0.3, alpha: 0.9 }] });
    for (const [x, y] of [[-4.2, -4.2], [4.2, 4.2], [0, 0], [4.2, -4.2], [-4.2, 4.2]] as Pt[]) {
      S(ctx, (c) => circlePath(c, x, y, 1.75), { fill: '#e2363a', ink: 0, shadow: 'none' });
    }
  });
  curvedArrow(ctx, 0, 0, 17, Math.PI * 1.05, Math.PI * 1.72, 3.6, '#4cc06a');
  curvedArrow(ctx, 0, 0, 17, Math.PI * 0.05, Math.PI * 0.72, 3.6, '#4cc06a');
});

icon('icon.skip', (ctx) => {
  const tri = (x: number) => (c: Ctx) => {
    c.moveTo(x - 8, -12);
    c.quadraticCurveTo(x - 9.5, -12.5, x - 9.5, -10.5);
    c.lineTo(x - 9.5, 10.5);
    c.quadraticCurveTo(x - 9.5, 12.5, x - 8, 12);
    c.lineTo(x + 7, 1.4);
    c.quadraticCurveTo(x + 8.6, 0, x + 7, -1.4);
    c.closePath();
  };
  const st = { fill: radial(ctx, -6, -6, 24, [[0, '#9fe3ff'], [0.6, '#3fa8e6'], [1, '#2378b8']]), shadow: '#1f6aa8', shadowOffset: [-1.6, -1.8] as Pt };
  G(ctx, [
    { build: tri(-7), style: st },
    { build: tri(8), style: st },
    { build: (c) => roundRectPath(c, 16, -12.5, 5, 25, 2), style: st },
  ], 2);
  ctx.save();
  ctx.globalAlpha = 0.8;
  line(ctx, [[-14.5, -8], [-14.5, 4]], 1.4, '#ffffff');
  line(ctx, [[0.5, -8], [0.5, 4]], 1.4, '#ffffff');
  ctx.restore();
});

icon('icon.banish', (ctx) => {
  const ring = (c: Ctx) => {
    circlePath(c, 0, 0, 19);
    c.moveTo(14.4, 0);
    c.arc(0, 0, 14.4, 0, Math.PI * 2, true);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(255,240,235,0.35)';
  ctx.beginPath();
  circlePath(ctx, 0, 0, 15);
  ctx.fill();
  ctx.restore();
  const bar = (c: Ctx) => {
    c.save();
    c.rotate(Math.PI / 4);
    roundRectPath(c, -15, -2.6, 30, 5.2, 0.6);
    c.restore();
  };
  const fill = radial(ctx, -6, -6, 26, [[0, '#ff7a6a'], [0.5, '#e2283a'], [1, '#a8141f']]);
  G(ctx, [
    { build: ring, style: { fill, shadow: '#a0141f', shadowOffset: [-1.8, -2] } },
    { build: bar, style: { fill, shadow: '#a0141f', shadowOffset: [-1.2, -1.4] } },
  ], 2);
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 16.8, Math.PI * 1.05, Math.PI * 1.45);
  ctx.stroke();
  ctx.restore();
});

// ---------------------------------------------------------------------------
function plate(ctx: Ctx, x: number, y: number, rx: number, ry: number) {
  S(ctx, (c) => ellipsePath(c, x, y + 1.6, rx, ry), { fill: '#c9cfdc', ink: 1.8, shadow: 'none' });
  S(ctx, (c) => ellipsePath(c, x, y, rx, ry), {
    fill: radial(ctx, x - rx * 0.3, y - ry * 0.4, rx, [[0, '#ffffff'], [1, '#e8e6ef']]),
    ink: 1.8, shadow: '#cdd0de', shadowOffset: [-1.4, -1.2],
  });
  S(ctx, (c) => ellipsePath(c, x, y + 0.3, rx * 0.62, ry * 0.55), { fill: '#f4f3f8', ink: 0.9, inkColor: '#b8bccc', shadow: 'none' });
  // blue rim band
  ctx.save();
  ctx.strokeStyle = rgba('#3f7fd0', 0.85);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ellipsePath(ctx, x, y, rx * 0.84, ry * 0.8);
  ctx.stroke();
  ctx.restore();
}

icon('icon.revival', (ctx) => {
  plate(ctx, 4, 4, 15, 6.4);
  plate(ctx, -2, 11, 17, 7.2);
  heart(ctx, -2, -7, 9.5, { ink: 1.9 });
  // little "again" swirl arrow around the heart
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2b1712';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.arc(-2, -8, 14, Math.PI * 1.2, Math.PI * 1.85);
  ctx.stroke();
  ctx.strokeStyle = '#ffd34a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  rot(ctx, -2 + Math.cos(Math.PI * 1.85) * 14, -8 + Math.sin(Math.PI * 1.85) * 14, Math.PI * 1.85 + Math.PI / 2, () => {
    S(ctx, (c) => polyPath(c, [[3.2, 0], [-1.4, -2.8], [-1.4, 2.8]]), { fill: '#ffd34a', ink: 1.1, shadow: 'none' });
  });
  inkSparkle(ctx, 15, -10, 3.4, '#fff6c8', 1);
  inkSparkle(ctx, -17, -1, 2.6, '#fff6c8', 0.9);
});

icon('icon.lock', (ctx) => {
  // shackle
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-9, -8);
  ctx.arc(0, -8, 9, Math.PI, 0);
  ctx.lineTo(9, 0);
  ctx.lineWidth = 5 + 4;
  ctx.strokeStyle = '#2b1712';
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = linear(ctx, -9, 0, 9, 0, [[0, '#f4f7fb'], [0.5, '#b9c3d1'], [1, '#8794a8']]);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.lineTo(-10, -8);
  ctx.arc(0, -8, 10, Math.PI, Math.PI * 1.4);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.restore();
  // body
  S(ctx, (c) => roundRectPath(c, -15, -3, 30, 23, 4.5), {
    fill: goldGrad(ctx, -15, -3, 15, 20), ink: 2.1, shadow: '#c27a12', shadowOffset: [-2.2, -2.2],
    gloss: [{ x: -8, y: 1, rx: 5, ry: 1.6, rot: -0.2, alpha: 0.75 }],
  });
  // keyhole
  S(ctx, (c) => {
    circlePath(c, 0, 6, 3);
    c.moveTo(-1.6, 7.5);
    c.lineTo(-2.4, 14);
    c.lineTo(2.4, 14);
    c.lineTo(1.6, 7.5);
    c.closePath();
  }, { fill: '#5a3410', ink: 1.2, shadow: 'none' });
  for (const [x, y] of [[-11, 1], [11, 1], [-11, 16], [11, 16]] as Pt[]) {
    S(ctx, (c) => circlePath(c, x, y, 1.2), { fill: '#fff2a6', ink: 0.7, shadow: 'none' });
  }
});

icon('icon.star', (ctx) => {
  S(ctx, (c) => starPath(c, 0, 1.5, 21, 9.5, 5), {
    fill: radial(ctx, -5, -4, 24, [[0, '#fff6b8'], [0.45, '#ffd23a'], [1, '#e8930f']]),
    ink: 2.2, shadow: '#cf7d10', shadowOffset: [-2.6, -2.6],
    gloss: [{ x: -4, y: -5, rx: 3.4, ry: 2, rot: -0.6, alpha: 0.9 }],
  });
  inkSparkle(ctx, 14, -14, 3.2, '#ffffff', 0.9);
});

// ---------------------------------------------------------------------------
/** Simple chef toque; (x,y) = bottom centre of the band. */
export function toqueIcon(ctx: Ctx, x: number, y: number, s = 1, ink = 2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  G(ctx, [
    {
      build: (c) => {
        circlePath(c, -8, -19, 7.5);
        circlePath(c, 0, -22, 9);
        circlePath(c, 8, -19, 7.5);
        ellipsePath(c, 0, -15, 13, 6);
      },
      style: { fill: '#fbf6ea', shadow: '#c9cede', shadowOffset: [-2.4, -2.4], gloss: [{ x: -5, y: -25, rx: 4, ry: 2.2, rot: -0.4, alpha: 0.9 }] },
    },
    {
      build: (c) => {
        c.moveTo(-9.5, 0);
        c.lineTo(-11, -14);
        c.quadraticCurveTo(0, -17, 11, -14);
        c.lineTo(9.5, 0);
        c.quadraticCurveTo(0, 2, -9.5, 0);
        c.closePath();
      },
      style: { fill: '#fbf6ea', shadow: '#c9cede', shadowOffset: [-2.6, -1] },
    },
  ], ink / s);
  for (let i = -2; i <= 2; i++) line(ctx, [[i * 3.6, -1], [i * 4.2, -13.5]], 0.9, '#b9bfd0', false, 0.9);
  S(ctx, (c) => {
    c.moveTo(-9.8, -4.5);
    c.quadraticCurveTo(0, -2.6, 9.8, -4.5);
    c.lineTo(9.6, 0.4);
    c.quadraticCurveTo(0, 2.2, -9.6, 0.4);
    c.closePath();
  }, { fill: '#efe8d8', ink: 1.6 / s, shadow: '#cdc6b6', shadowOffset: [-1.5, -1] });
  // tricolore stripe on the band
  ctx.fillStyle = '#2f9a52';
  ctx.fillRect(-9.4, -3.2, 6.2, 2.2);
  ctx.fillStyle = '#dc3439';
  ctx.fillRect(3.2, -3.2, 6.2, 2.2);
  ctx.restore();
}

icon('icon.level', (ctx) => {
  toqueIcon(ctx, -4, 17, 1.12);
  // green up-arrow
  const arrow = (c: Ctx) => {
    c.moveTo(14, -6);
    c.lineTo(23, 4);
    c.lineTo(17.5, 4);
    c.lineTo(17.5, 16);
    c.quadraticCurveTo(17.5, 18, 15.5, 18);
    c.lineTo(12.5, 18);
    c.quadraticCurveTo(10.5, 18, 10.5, 16);
    c.lineTo(10.5, 4);
    c.lineTo(5, 4);
    c.closePath();
  };
  S(ctx, arrow, {
    fill: radial(ctx, 12, 0, 20, [[0, '#a6f08a'], [0.5, '#4cc06a'], [1, '#2a8a44']]),
    ink: 2, shadow: '#2a8a44', shadowOffset: [-1.4, -1.6],
    gloss: [{ x: 12, y: 0, rx: 2.2, ry: 1.2, rot: -0.7, alpha: 0.8 }],
  });
});

icon('icon.xp', (ctx) => {
  ctx.save();
  ctx.rotate(-0.6);
  basilLeaf(ctx, 40, { ink: 2.1, stem: true });
  ctx.restore();
});

void goldBall; void chefKnife;
