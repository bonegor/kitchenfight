/**
 * Reference sprite: CHEF ENZO — the hero. This file doubles as the quality
 * bar / example for every other painter in the project.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, shape, group, ellipsePath, circlePath, line, inkLine, legs, eye, brow,
} from '../painter';

const SKIN = '#f3c29a';
const SKIN_SH = '#e0a07e';
const WHITE = '#fbf6ea';
const WHITE_SH = '#c9cede';
const GREEN = '#2f9a52';
const RED = '#dc3439';
const HAIR = '#3d2418';

/** Classic tall toque. (x,y) = bottom centre of the hat band. */
export function toque(ctx: Ctx, x: number, y: number, s = 1, tilt = -0.08) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  group(ctx, [
    // puffy top
    {
      build: (c) => {
        circlePath(c, -8, -21, 7.5);
        circlePath(c, 0, -24, 9);
        circlePath(c, 8, -21, 7.5);
        ellipsePath(c, 0, -17, 13, 6);
      },
      style: { fill: WHITE, shadow: WHITE_SH, shadowOffset: [-2.4, -2.4], gloss: [{ x: -5, y: -27, rx: 4, ry: 2.2, rot: -0.4, alpha: 0.9 }] },
    },
    // pleated cylinder
    {
      build: (c) => {
        c.moveTo(-9.5, 0);
        c.lineTo(-11, -15);
        c.quadraticCurveTo(0, -18, 11, -15);
        c.lineTo(9.5, 0);
        c.quadraticCurveTo(0, 2, -9.5, 0);
        c.closePath();
      },
      style: { fill: WHITE, shadow: WHITE_SH, shadowOffset: [-2.6, -1] },
    },
  ]);
  // pleats
  for (let i = -2; i <= 2; i++) {
    line(ctx, [[i * 3.6, -1], [i * 4.2, -14.5]], 0.9, '#b9bfd0', false, 0.9);
  }
  // band
  shape(ctx, (c) => {
    c.moveTo(-9.8, -4.5);
    c.quadraticCurveTo(0, -2.6, 9.8, -4.5);
    c.lineTo(9.6, 0.4);
    c.quadraticCurveTo(0, 2.2, -9.6, 0.4);
    c.closePath();
  }, { fill: '#efe8d8', ink: 1.6, shadow: '#cdc6b6', shadowOffset: [-1.5, -1] });
  ctx.restore();
}

/** Big handlebar moustache centred at (x,y). */
export function moustache(ctx: Ctx, x: number, y: number, w: number, color = HAIR) {
  shape(ctx, (c) => {
    // left lobe
    c.moveTo(x, y - w * 0.12);
    c.bezierCurveTo(x - w * 0.25, y - w * 0.32, x - w * 0.55, y - w * 0.18, x - w * 0.62, y + w * 0.02);
    c.bezierCurveTo(x - w * 0.72, y - w * 0.12, x - w * 0.82, y - w * 0.22, x - w * 0.74, y - w * 0.34);
    c.bezierCurveTo(x - w * 0.98, y - w * 0.2, x - w * 0.86, y + w * 0.2, x - w * 0.58, y + w * 0.2);
    c.bezierCurveTo(x - w * 0.36, y + w * 0.2, x - w * 0.14, y + w * 0.08, x, y + w * 0.04);
    // right lobe
    c.bezierCurveTo(x + w * 0.14, y + w * 0.08, x + w * 0.36, y + w * 0.2, x + w * 0.58, y + w * 0.2);
    c.bezierCurveTo(x + w * 0.86, y + w * 0.2, x + w * 0.98, y - w * 0.2, x + w * 0.74, y - w * 0.34);
    c.bezierCurveTo(x + w * 0.82, y - w * 0.22, x + w * 0.72, y - w * 0.12, x + w * 0.62, y + w * 0.02);
    c.bezierCurveTo(x + w * 0.55, y - w * 0.18, x + w * 0.25, y - w * 0.32, x, y - w * 0.12);
    c.closePath();
  }, { fill: color, ink: 1.5, shadow: '#1e100a', shadowOffset: [-0.8, -1.2], gloss: [{ x: x - w * 0.35, y: y - w * 0.08, rx: w * 0.14, ry: w * 0.05, rot: -0.3, alpha: 0.35 }, { x: x + w * 0.3, y: y - w * 0.08, rx: w * 0.14, ry: w * 0.05, rot: 0.3, alpha: 0.35 }] });
}

function drawEnzo(ctx: Ctx, f: number) {
  const ph = (f / 4) * Math.PI * 2;
  const sw = Math.sin(ph);

  // --- far arm (behind body)
  inkLine(ctx, [[-10, -7], [-14 - sw * 1.5, -1], [-13 - sw * 3.5, 4]], 5, WHITE, true, 1.4);
  shape(ctx, (c) => circlePath(c, -13 - sw * 3.5, 5, 2.9), { fill: SKIN, ink: 1.4, shadow: SKIN_SH, shadowOffset: [-0.9, -1] });

  // --- legs (charcoal chef trousers, black clogs)
  legs(ctx, 0, 5, f, { len: 14, spread: 9, thick: 5, color: '#3d3d4f', shoe: '#2b2522', stride: 5 });

  // --- body: white double-breasted jacket
  shape(ctx, (c) => {
    c.moveTo(-9.5, -13);
    c.quadraticCurveTo(-14.5, -11, -14.5, -4);
    c.lineTo(-13.5, 7);
    c.quadraticCurveTo(0, 11, 13.5, 7);
    c.lineTo(14.5, -4);
    c.quadraticCurveTo(14.5, -11, 9.5, -13);
    c.quadraticCurveTo(0, -16, -9.5, -13);
    c.closePath();
  }, { fill: WHITE, shadow: WHITE_SH, shadowOffset: [-3, -2], gloss: [{ x: -7.5, y: -7, rx: 2.6, ry: 4, rot: 0.2, alpha: 0.6 }] });

  // jacket centre overlap line + double-breasted buttons
  line(ctx, [[2.5, -11.5], [3.2, -2]], 1, '#b4bacb');
  for (const by of [-9, -5]) {
    for (const bx of [-2.5, 7.5]) {
      shape(ctx, (c) => circlePath(c, bx, by, 1.25), { fill: '#3b2a24', ink: 0.6, shadow: 'none', gloss: [{ x: bx - 0.4, y: by - 0.45, rx: 0.5, ry: 0.35, alpha: 0.7 }] });
    }
  }

  // --- green apron (tricolore: green apron, white jacket, red neckerchief)
  shape(ctx, (c) => {
    c.moveTo(-12.8, -2);
    c.quadraticCurveTo(0, -3.8, 12.8, -2);
    c.lineTo(13.2, 9);
    c.quadraticCurveTo(0, 13, -13.2, 9);
    c.closePath();
  }, { fill: GREEN, shadowOffset: [-2.8, -2], gloss: [{ x: -7, y: 1.5, rx: 2.2, ry: 3.6, rot: 0.15, alpha: 0.28 }] });
  line(ctx, [[-12.8, -2], [12.8, -2]], 1.5, '#1f6b39');
  // stitched hem
  ctx.save();
  ctx.setLineDash([1.3, 1.3]);
  line(ctx, [[-12, 7.4], [-6, 9.3], [0, 10], [6, 9.3], [12, 7.4]], 0.7, '#8fe0aa', true, 0.9);
  ctx.restore();
  // kitchen towel tucked in the apron string (red/white stripes)
  shape(ctx, (c) => {
    c.moveTo(-11.5, -2.5);
    c.lineTo(-7, -2.5);
    c.lineTo(-7.6, 7.5);
    c.quadraticCurveTo(-9.6, 8.6, -11.8, 7.5);
    c.closePath();
  }, { fill: '#f7f2e6', ink: 1.2, shadow: '#cfd2df', shadowOffset: [-1.2, -0.6] });
  line(ctx, [[-11.3, 1], [-7.3, 1]], 1.1, RED);
  line(ctx, [[-11.4, 4.2], [-7.5, 4.2]], 1.1, RED);

  // --- head (chibi proportions: big head reads well at gameplay scale)
  const hx = 1, hy = -24.5;
  shape(ctx, (c) => ellipsePath(c, hx - 11.6, hy + 1.5, 2.6, 3.4), { fill: SKIN, ink: 1.6, shadow: SKIN_SH, shadowOffset: [-0.8, -0.8] });
  shape(ctx, (c) => circlePath(c, hx, hy, 12.2), {
    fill: SKIN,
    shadow: SKIN_SH,
    shadowOffset: [-2.6, -2.2],
    gloss: [{ x: hx - 5, y: hy - 5.5, rx: 3.8, ry: 2.2, rot: -0.5, alpha: 0.45 }],
  });
  // sideburns + hair under the hat
  shape(ctx, (c) => {
    c.moveTo(hx - 11.8, hy - 5);
    c.quadraticCurveTo(hx - 13, hy + 2.5, hx - 8.8, hy + 3.2);
    c.lineTo(hx - 8.2, hy - 5);
    c.closePath();
  }, { fill: HAIR, ink: 1.2, shadow: 'none' });
  // cheeks blush
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = '#ef6c5a';
  ctx.beginPath();
  ellipsePath(ctx, hx - 4.6, hy + 4.4, 2.8, 1.7);
  ellipsePath(ctx, hx + 9, hy + 4.2, 2.4, 1.7);
  ctx.fill();
  ctx.restore();
  // eyes (determined, looking right)
  eye(ctx, hx - 1.5, hy - 2.4, 3, { look: [0.32, 0.08], lid: 'angry-l', pupil: 0.56, iris: '#6b4423' });
  eye(ctx, hx + 6.8, hy - 2.4, 3, { look: [0.32, 0.08], lid: 'angry-r', pupil: 0.56, iris: '#6b4423' });
  brow(ctx, hx - 1.8, hy - 7.2, 5.4, 0.2, 1.7, HAIR);
  brow(ctx, hx + 7.2, hy - 7.2, 5.4, -0.2, 1.7, HAIR);
  // nose
  shape(ctx, (c) => ellipsePath(c, hx + 3.8, hy + 2.4, 3, 2.5), { fill: '#f0a986', ink: 1.3, shadow: '#d98a6a', shadowOffset: [-1, -1], gloss: [{ x: hx + 2.9, y: hy + 1.5, rx: 1, ry: 0.7, alpha: 0.85 }] });
  // smile under moustache
  line(ctx, [[hx + 0.5, hy + 8.2], [hx + 3.4, hy + 9.2], [hx + 6.4, hy + 8]], 1.1, '#7a2e22', true);
  moustache(ctx, hx + 3.6, hy + 5.8, 9.6);

  // --- toque
  toque(ctx, hx - 0.5, hy - 9.6, 1, -0.07);

  // --- red neckerchief (over the collar)
  shape(ctx, (c) => {
    c.moveTo(-6.5, -13.8);
    c.quadraticCurveTo(0, -10.8, 7.5, -13.8);
    c.quadraticCurveTo(6, -9.8, 2.5, -9.3);
    c.lineTo(4.6, -5.8);
    c.lineTo(0.6, -7.6);
    c.lineTo(-1.5, -9.1);
    c.quadraticCurveTo(-5.5, -10.2, -6.5, -13.8);
    c.closePath();
  }, { fill: RED, ink: 1.4, shadowOffset: [-1.2, -1.2], gloss: [{ x: -2, y: -12.4, rx: 2, ry: 0.8, alpha: 0.45 }] });

  // --- near arm (in front)
  const hxr = 14.5 + sw * 3.4, hyr = 4.5 - Math.abs(sw) * 0.6;
  inkLine(ctx, [[10.5, -8.5], [15.5 + sw * 1.4, -2], [hxr, hyr]], 5.4, WHITE, true, 1.4);
  shape(ctx, (c) => circlePath(c, hxr, hyr + 1, 3), { fill: SKIN, ink: 1.4, shadow: SKIN_SH, shadowOffset: [-1, -1], gloss: [{ x: hxr - 1, y: hyr, rx: 0.9, ry: 0.6, alpha: 0.6 }] });
}

defineSprite({ id: 'chef.enzo', w: 64, h: 92, ax: 32, ay: 66, frames: 4, flash: true, draw: drawEnzo });

/** Bigger, idle pose for portraits (same painter, scaled up by the cache via res). */
defineSprite({ id: 'portrait.enzo', w: 64, h: 92, ax: 32, ay: 66, res: 5, draw: (ctx) => drawEnzo(ctx, 0) });
