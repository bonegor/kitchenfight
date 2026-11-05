/**
 * PLAYABLE CHEFS (Chef Enzo lives in hero.ts — he is the style reference).
 *
 *   chef.<id>      4-frame walk cycle + hit flash. Box 64×92, anchor (32,66), exactly like
 *                  chef.enzo: anchor = centre of the collision circle (r≈14), feet rest at
 *                  y≈+19, facing front-right. Micio is smaller (r≈12, feet at y≈+14).
 *   portrait.<id>  same painter, idle frame 0, cached at res 5 for menus / character select.
 *
 * Each chef owns a silhouette + colour identity that must read at 1× in a crowd:
 *   nonna     tiny; near-black dress, plum shawl, grey bun, round glasses, raised slipper
 *   peppe     broad; white tank, big tanned forearms, paper cap, wooden peel on his back
 *   sofia     slim; black chef jacket, pecorino-yellow scarf, swinging ponytail, big fork
 *   tommaso   round; brown habit + rope, shiny tonsure, white beard, Parmigiano wedge
 *   concetta  curvy; red polka-dot dress, huge black curls + red headscarf, chilli necklace
 *   micio     small orange tabby cat, mini toque, red neckerchief, swishing tail
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, group, ellipsePath, circlePath, roundRectPath, smoothPath,
  line, inkLine, legs, eye, brow, mouth, speckle, glint, rgba,
} from '../painter';
import { toque } from './hero';

const TAU = Math.PI * 2;
const WHITE = '#fbf6ea';
const WHITE_SH = '#c9cede';
const RED = '#dc3439';
const CHEEK = '#ef6c5a';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function register(id: string, draw: (ctx: Ctx, f: number) => void) {
  defineSprite({ id: `chef.${id}`, w: 64, h: 92, ax: 32, ay: 66, frames: 4, flash: true, draw });
  defineSprite({ id: `portrait.${id}`, w: 64, h: 92, ax: 32, ay: 66, res: 5, draw: (ctx) => draw(ctx, 0) });
}

function blush(ctx: Ctx, spots: [number, number, number, number][], color = CHEEK, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [x, y, rx, ry] of spots) ellipsePath(ctx, x, y, rx, ry);
  ctx.fill();
  ctx.restore();
}

/** Round shaded ball (hands, paws, beads, knots). */
function ball(ctx: Ctx, x: number, y: number, r: number, fill: string, sh: string, ink = 1.4, glossA = 0.5) {
  shape(ctx, (c) => circlePath(c, x, y, r), {
    fill, ink, shadow: sh, shadowOffset: [-r * 0.34, -r * 0.38],
    gloss: [{ x: x - r * 0.38, y: y - r * 0.42, rx: r * 0.32, ry: r * 0.2, rot: -0.5, alpha: glossA }],
  });
}

/** Closed outline around a centre line with per-point widths (tails, ponytails, scarf ends). */
function ribbon(pts: Pt[], widths: number[]): Pt[] {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const w = widths[i] / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return [...L, ...R.reverse()];
}

function qpt(a: Pt, b: Pt, c: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
}

/** Run `fn` clipped to the path built by `build` (patterns: dots, checks, knit...). */
function clipped(ctx: Ctx, build: (c: Ctx) => void, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

interface AlmondOpts {
  iris: string;
  /** pupil offset (−1..1 of the eye) */
  look?: Pt;
  /** upper-lid height near the inner / outer corner (1 = wide open, ~0.5 = narrowed) */
  upIn?: number;
  upOut?: number;
  lashFlick?: boolean;
}

/**
 * Almond eye with a heavy lash line (Sofia, Concetta). (x,y) = centre, w×h = size,
 * side −1 = left eye (outer corner on the left), +1 = right eye.
 */
function almondEye(ctx: Ctx, x: number, y: number, w: number, h: number, side: number, o: AlmondOpts) {
  const upIn = o.upIn ?? 1, upOut = o.upOut ?? 1;
  const xo = x + (side * w) / 2, xi = x - (side * w) / 2;
  const yo = y - h * 0.12, yi = y + h * 0.16;
  const upper = (c: Ctx) => {
    c.moveTo(xi, yi);
    c.bezierCurveTo(xi + side * w * 0.16, y - h * 1.3 * upIn, xo - side * w * 0.2, y - h * 1.32 * upOut, xo, yo);
  };
  const build = (c: Ctx) => {
    upper(c);
    c.bezierCurveTo(xo - side * w * 0.2, y + h * 1.02, xi + side * w * 0.24, y + h * 1.02, xi, yi);
    c.closePath();
  };
  shape(ctx, build, { fill: '#fffaf0', ink: Math.max(0.55, h * 0.18), shadow: 'none' });
  const [lx, ly] = o.look ?? [0.3, 0.1];
  const ix = x + lx * w * 0.3, iy = y + ly * h * 0.35 + h * 0.08;
  clipped(ctx, build, () => {
    ctx.fillStyle = o.iris;
    ctx.beginPath();
    circlePath(ctx, ix, iy, h * 0.86);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    circlePath(ctx, ix + w * 0.02, iy + h * 0.02, h * 0.46);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    circlePath(ctx, ix - h * 0.3, iy - h * 0.34, h * 0.25);
    circlePath(ctx, ix + h * 0.36, iy + h * 0.36, h * 0.1);
    ctx.fill();
    // soft lid shadow on the eyeball
    ctx.translate(0, h * 0.42);
    ctx.beginPath();
    upper(ctx);
    ctx.lineWidth = h * 0.5;
    ctx.strokeStyle = 'rgba(90,40,50,0.22)';
    ctx.stroke();
  });
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  upper(ctx);
  ctx.lineWidth = h * 0.52;
  ctx.strokeStyle = INK;
  ctx.stroke();
  if (o.lashFlick !== false) {
    ctx.beginPath();
    ctx.moveTo(xo - side * w * 0.16, yo - h * 0.42);
    ctx.quadraticCurveTo(xo + side * w * 0.18, yo - h * 0.5, xo + side * w * 0.3, yo - h * 1.05);
    ctx.quadraticCurveTo(xo + side * w * 0.14, yo + h * 0.05, xo - side * w * 0.04, yo + h * 0.2);
    ctx.closePath();
    ctx.fillStyle = INK;
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// NONNA PINA — tiny, fierce, loving. Raised slipper (her Ciabatta), spoon in the pocket.
// ---------------------------------------------------------------------------
const N_SKIN = '#f6c9a9', N_SKIN_SH = '#dc9e86';
const N_DRESS = '#4a4157', N_DRESS_SH = '#2c2636', N_DRESS_RIM = '#9488ad';
const N_SHAWL = '#713a59', N_SHAWL_SH = '#4a2139';
const N_HAIR = '#e0dde6', N_HAIR_SH = '#a6a1b6';
const N_APRON = '#f7efdd', N_APRON_SH = '#d8c9ae';

/** Nonna's tartan "ciabatta" in profile. (x,y) = heel (in her fist); rot = direction of the toe. */
function slipper(ctx: Ctx, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // local: heel at 0, toe at +x (~18), the upper rises toward −y
  shape(ctx, (c) => {
    c.moveTo(-1.4, -2.2);
    c.lineTo(15, -2.6);
    c.quadraticCurveTo(18.8, -2, 18.2, 0.4);
    c.quadraticCurveTo(17.6, 2, 14.6, 2);
    c.lineTo(0, 1.8);
    c.quadraticCurveTo(-2.6, 0.6, -1.4, -2.2);
    c.closePath();
  }, { fill: '#7f4d33', ink: 1.4, shadow: '#52301f', shadowOffset: [-0.8, -0.9] });
  line(ctx, [[0.4, 0.5], [16.8, 0.7]], 0.7, '#3f2416', false, 0.55);
  const upper = (c: Ctx) => {
    c.moveTo(4.4, -2.2);
    c.bezierCurveTo(4.6, -10, 14.6, -10.8, 18, -2.4);
    c.closePath();
  };
  shape(ctx, upper, { fill: '#d63c42', ink: 1.4, shadow: '#972031', shadowOffset: [-1.3, -1.3], gloss: [{ x: 9.8, y: -7.6, rx: 3, ry: 1.1, rot: -0.15, alpha: 0.38 }] });
  clipped(ctx, upper, () => {
    for (let i = 0; i < 6; i++) line(ctx, [[3.2 + i * 2.9, 0], [5.6 + i * 2.9, -11.5]], 1, '#264537', false, 0.7);
    for (let j = 0; j < 3; j++) line(ctx, [[2, -3.6 - j * 2.5], [19, -3.6 - j * 2.5]], 0.55, '#f6cf5c', false, 0.85);
  });
  line(ctx, [[4.6, -2.2], [5.6, -7.4]], 3, INK);
  line(ctx, [[4.6, -2.2], [5.6, -7.4]], 1.8, '#f6ead2');
  ball(ctx, 11.2, -9.2, 2.1, '#f8eed9', '#d6c3a2', 1.1, 0.6);
  ctx.restore();
}

function drawNonna(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  const hx = 1.5, hy = -21;

  // --- bun + hairpins (behind the head; only the pin tips poke out)
  for (const [x1, y1, x2, y2] of [[hx - 14.4, hy - 17.8, hx + 0.6, hy - 8.8], [hx + 0.8, hy - 23.4, hx - 8.2, hy - 4.6]]) {
    line(ctx, [[x1, y1], [x2, y2]], 2.2, INK);
    line(ctx, [[x1, y1], [x2, y2]], 0.9, '#7c5a3c');
    ball(ctx, x1, y1, 1.25, '#3d3139', '#1d161b', 0.7, 0.7);
  }
  shape(ctx, (c) => circlePath(c, hx - 4.2, hy - 12.6, 6.6), {
    fill: N_HAIR, shadow: N_HAIR_SH, shadowOffset: [-1.7, -1.9],
    gloss: [{ x: hx - 6.6, y: hy - 15.6, rx: 2.6, ry: 1.4, rot: -0.5, alpha: 0.75 }],
  });
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx - 4.2, hy - 12.6, 3.4, -2.4, 1.3);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = N_HAIR_SH;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // --- far arm (behind the body), swinging
  inkLine(ctx, [[-9, -9], [-13 - sw * 1.2, -3.5], [-12.6 - sw * 2.6, 2]], 4.4, N_DRESS, true, 1.4);
  ball(ctx, -12.6 - sw * 2.6, 3.2, 2.5, N_SKIN, N_SKIN_SH);

  // --- legs: black stockings, little black shoes
  legs(ctx, 0, 8, f, { len: 11, spread: 7, thick: 3.6, color: '#2f2935', shoe: '#1e181b', stride: 3.6 });

  // --- dress (bell shape)
  const dress = (c: Ctx) => {
    c.moveTo(-8, -12.8);
    c.quadraticCurveTo(-12.6, -11.8, -12.6, -6);
    c.quadraticCurveTo(-13, 2, -15.6, 11);
    c.quadraticCurveTo(-8, 15.2, 0, 15);
    c.quadraticCurveTo(8, 15.2, 15.6, 11);
    c.quadraticCurveTo(13, 2, 12.6, -6);
    c.quadraticCurveTo(12.6, -11.8, 8, -12.8);
    c.quadraticCurveTo(0, -14.6, -8, -12.8);
    c.closePath();
  };
  shape(ctx, dress, { fill: N_DRESS, shadow: N_DRESS_SH, shadowOffset: [-3, -2], rim: N_DRESS_RIM });
  // skirt folds
  line(ctx, [[-10.5, 4], [-12.2, 12.4]], 0.9, N_DRESS_SH, true, 0.9);
  line(ctx, [[11, 4], [12.6, 12.2]], 0.9, N_DRESS_SH, true, 0.9);

  // --- apron: floral print, scalloped lace hem, pocket with a wooden spoon
  const hemY = (x: number) => 10.6 + (1 - (x / 10.6) ** 2) * 1.4;
  const apron = (c: Ctx) => {
    c.moveTo(-8.8, -1.6);
    c.quadraticCurveTo(0, -3.2, 8.8, -1.6);
    c.lineTo(10.6, hemY(10.6));
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x0 = 10.6 - (i * 21.2) / n, x1 = 10.6 - ((i + 1) * 21.2) / n, xm = (x0 + x1) / 2;
      c.quadraticCurveTo(xm, hemY(xm) + 2.6, x1, hemY(x1));
    }
    c.closePath();
  };
  shape(ctx, apron, { fill: N_APRON, shadow: N_APRON_SH, shadowOffset: [-2.2, -1.6] });
  clipped(ctx, apron, () => {
    const flowers: Pt[] = [[-6, 1.5], [-1.5, 5], [-6.8, 8.6], [6.5, 1.2], [3.5, 10.4], [-2.4, 0.4], [8.6, 8.8], [0.6, 9.5]];
    flowers.forEach(([x, y], i) => {
      const col = i % 3 === 0 ? '#5b8fd6' : '#de4d55';
      ctx.fillStyle = col;
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + i;
        ctx.beginPath();
        circlePath(ctx, x + Math.cos(a) * 0.75, y + Math.sin(a) * 0.75, 0.62);
        ctx.fill();
      }
      ctx.fillStyle = '#f4c542';
      ctx.beginPath();
      circlePath(ctx, x, y, 0.42);
      ctx.fill();
    });
  });
  line(ctx, [[-8.8, -1.6], [0, -3.2], [8.8, -1.6]], 1.4, '#c8b593', true);
  // pocket + spoon
  shape(ctx, (c) => {
    c.moveTo(1.6, 4.2);
    c.lineTo(8.2, 3.9);
    c.lineTo(8, 8.4);
    c.quadraticCurveTo(4.8, 9.6, 1.8, 8.6);
    c.closePath();
  }, { fill: N_APRON, ink: 1, shadow: N_APRON_SH, shadowOffset: [-1, -0.8] });
  line(ctx, [[5.4, 6.8], [8.6, -3.4]], 2.6, INK);
  line(ctx, [[5.4, 6.8], [8.6, -3.4]], 1.3, '#cf9452');
  shape(ctx, (c) => ellipsePath(c, 9.3, -5.4, 1.9, 2.7, 0.3), { fill: '#d99d5a', ink: 1.1, shadow: '#a86c34', shadowOffset: [-0.6, -0.7], gloss: [{ x: 8.8, y: -6.2, rx: 0.7, ry: 1, alpha: 0.5 }] });
  shape(ctx, (c) => {
    c.moveTo(1.6, 4.2);
    c.lineTo(8.2, 3.9);
    c.lineTo(8.1, 5.6);
    c.lineTo(1.7, 5.9);
    c.closePath();
  }, { fill: N_APRON, ink: 1, shadow: 'none' });

  // --- near arm (raised, threatening slipper)
  const shake = Math.sin(ph + 0.6);
  const hxr = 14.8 + shake * 0.6, hyr = -23.4 - Math.abs(shake) * 0.5;
  inkLine(ctx, [[10.5, -8.5], [16.4 + shake * 0.3, -13.5], [hxr, hyr + 1.4]], 4.4, N_DRESS, true, 1.4);

  // --- knitted shawl with fringe + cameo brooch
  const shawlL: Pt = [-13.2, -2], shawlTip: Pt = [1.4, 0.8], shawlR: Pt = [13, -2.6];
  const shawl = (c: Ctx) => {
    c.moveTo(-14, -6);
    c.quadraticCurveTo(-15, -13.8, -6, -15.2);
    c.quadraticCurveTo(1, -12.8, 7.8, -15.2);
    c.quadraticCurveTo(15.2, -13.8, 14, -6);
    c.quadraticCurveTo(13.8, -3.6, shawlR[0], shawlR[1]);
    c.quadraticCurveTo(7, -4.4, shawlTip[0], shawlTip[1]);
    c.quadraticCurveTo(-5.6, -4.4, shawlL[0], shawlL[1]);
    c.quadraticCurveTo(-14, -3.6, -14, -6);
    c.closePath();
  };
  // fringe first (under the edge)
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const [x1, y1] = qpt(shawlL, [-5.6, -4.4], shawlTip, t);
    const [x2, y2] = qpt(shawlTip, [7, -4.4], shawlR, t);
    const sway = sw * 0.5;
    inkLine(ctx, [[x1, y1], [x1 + sway - 0.2, y1 + 2.2]], 0.7, N_SHAWL, false, 0.6);
    inkLine(ctx, [[x2, y2], [x2 + sway + 0.2, y2 + 2.2]], 0.7, N_SHAWL, false, 0.6);
  }
  shape(ctx, shawl, { fill: N_SHAWL, shadow: N_SHAWL_SH, shadowOffset: [-2.4, -2], rim: '#b07093' });
  clipped(ctx, shawl, () => {
    // knit chevrons
    ctx.strokeStyle = rgba('#000000', 0.18);
    ctx.lineWidth = 0.5;
    for (let r = 0; r < 7; r++) {
      for (let k = -8; k <= 8; k++) {
        const x = k * 2.1 + (r % 2) * 1.05, y = -15 + r * 2.2;
        ctx.beginPath();
        ctx.moveTo(x - 0.8, y - 0.6);
        ctx.lineTo(x, y + 0.4);
        ctx.lineTo(x + 0.8, y - 0.6);
        ctx.stroke();
      }
    }
  });
  shape(ctx, (c) => ellipsePath(c, 1.4, -4.4, 1.9, 2.3), { fill: '#e7b65a', ink: 1, shadow: '#b8862a', shadowOffset: [-0.5, -0.5] });
  shape(ctx, (c) => ellipsePath(c, 1.4, -4.4, 1.2, 1.55), { fill: '#e98a72', ink: 0, shadow: 'none' });
  shape(ctx, (c) => ellipsePath(c, 1.6, -4.2, 0.6, 0.9), { fill: '#fbefe2', ink: 0, shadow: 'none' });

  // --- head
  shape(ctx, (c) => ellipsePath(c, hx - 11, hy + 1.6, 2.4, 3.2), { fill: N_SKIN, ink: 1.5, shadow: N_SKIN_SH, shadowOffset: [-0.8, -0.8] });
  ball(ctx, hx - 11.2, hy + 5, 0.95, '#fbf6ee', '#cfc7bb', 0.7, 0.9); // pearl earring
  shape(ctx, (c) => circlePath(c, hx, hy, 11.4), {
    fill: N_SKIN, shadow: N_SKIN_SH, shadowOffset: [-2.5, -2.1],
    gloss: [{ x: hx - 5, y: hy - 4.5, rx: 3.4, ry: 2, rot: -0.5, alpha: 0.4 }],
  });
  // hair: swept back, centre part, waves
  const hair = (c: Ctx) => {
    smoothPath(c, [
      [hx - 9.4, hy + 2.6], [hx - 12.2, hy - 3], [hx - 10.4, hy - 9.6], [hx - 4, hy - 12.9], [hx + 3.4, hy - 12.6],
      [hx + 9.6, hy - 9.2], [hx + 12.1, hy - 3.2], [hx + 10.4, hy - 4.6], [hx + 6.6, hy - 7.6], [hx + 1.8, hy - 8.2],
      [hx - 2.6, hy - 7.6], [hx - 6.6, hy - 5.6], [hx - 8.6, hy - 1.6],
    ], true, 0.45);
  };
  shape(ctx, hair, {
    fill: N_HAIR, shadow: N_HAIR_SH, shadowOffset: [-1.8, -1.8],
    gloss: [{ x: hx - 4, y: hy - 10, rx: 3.6, ry: 1.3, rot: -0.25, alpha: 0.8 }],
  });
  line(ctx, [[hx - 7.6, hy - 6.2], [hx - 5.6, hy - 9.4], [hx - 1.6, hy - 11.2]], 0.8, N_HAIR_SH, true, 0.9);
  line(ctx, [[hx + 4.5, hy - 8.6], [hx + 7.6, hy - 9.8], [hx + 9.8, hy - 7]], 0.8, N_HAIR_SH, true, 0.9);
  line(ctx, [[hx + 1.8, hy - 8.4], [hx + 1, hy - 12.2]], 0.8, N_HAIR_SH, true, 0.9);

  // face: cheeks, stern little eyes behind round glasses
  blush(ctx, [[hx - 4.2, hy + 4.4, 2.9, 1.9], [hx + 9.3, hy + 4.2, 2.1, 1.7]], '#ee5f62', 0.5);
  const lx = hx - 1.6, rx = hx + 6.8, ey = hy - 0.6, gr = 3.7;
  eye(ctx, lx + 0.4, ey + 0.3, 2.45, { look: [0.4, 0.08], lid: 'angry-l', pupil: 0.6, iris: '#6a4630', ink: 0.9 });
  eye(ctx, rx + 0.4, ey + 0.3, 2.45, { look: [0.4, 0.08], lid: 'angry-r', pupil: 0.6, iris: '#6a4630', ink: 0.9 });
  // lenses
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, lx, ey, gr);
  circlePath(ctx, rx, ey, gr);
  ctx.fillStyle = 'rgba(220,235,255,0.22)';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
  line(ctx, [[lx + gr, ey - 0.4], [hx + 2.6, ey - 1.6], [rx - gr, ey - 0.4]], 1, INK, true);
  line(ctx, [[lx - gr, ey - 0.6], [hx - 10.2, hy - 0.4]], 1, INK);
  glint(ctx, lx - 1.4, ey - 1.6, 1.3, 0.55, -0.7, 0.85);
  glint(ctx, rx - 1.4, ey - 1.6, 1.3, 0.55, -0.7, 0.85);
  brow(ctx, lx - 0.2, ey - 5.3, 5.2, 0.38, 1.75, '#837c90');
  brow(ctx, rx + 0.2, ey - 5.3, 5.2, -0.38, 1.75, '#837c90');
  // button nose, firm-but-loving little smile, smile lines
  shape(ctx, (c) => ellipsePath(c, hx + 3.2, hy + 3.4, 2.3, 2), { fill: '#f1a88f', ink: 1.2, shadow: '#d88a72', shadowOffset: [-0.8, -0.8], gloss: [{ x: hx + 2.5, y: hy + 2.7, rx: 0.8, ry: 0.55, alpha: 0.8 }] });
  line(ctx, [[hx + 0.4, hy + 7.4], [hx + 3, hy + 8.1], [hx + 6, hy + 6.8]], 1.15, '#7a2e22', true);
  line(ctx, [[hx - 1.6, hy + 4.9], [hx - 0.9, hy + 7.2]], 0.6, N_SKIN_SH, true, 0.9);
  line(ctx, [[hx + 7.9, hy + 4.7], [hx + 7.2, hy + 6.8]], 0.6, N_SKIN_SH, true, 0.9);

  // --- raised hand + slipper
  slipper(ctx, hxr - 0.4, hyr + 0.8, -1.3 + shake * 0.14);
  ball(ctx, hxr, hyr, 2.8, N_SKIN, N_SKIN_SH);
}

// ---------------------------------------------------------------------------
// PEPPE IL PIZZAIOLO — burly Neapolitan, white tank, paper cap, peel on his back.
// ---------------------------------------------------------------------------
const P_SKIN = '#e6a97d', P_SKIN_SH = '#c47f5a';
const P_HAIR = '#26160f';
const P_PANTS = '#3f5d99', P_PANTS_SH = '#2a3f6c';
const P_WOOD = '#ddab63', P_WOOD_SH = '#ad783b';

function popeyeArm(ctx: Ctx, s: Pt, e: Pt, w: Pt, flour: boolean) {
  // one continuous tapered arm: shoulder → elbow → bulging forearm → wrist
  const m: Pt = [e[0] + (w[0] - e[0]) * 0.45, e[1] + (w[1] - e[1]) * 0.45];
  const armPath = (c: Ctx) => smoothPath(c, ribbon([s, e, m, w], [6.6, 5.6, 9, 6.4]), true, 0.5);
  shape(ctx, armPath, {
    fill: P_SKIN, ink: 1.4, shadow: P_SKIN_SH, shadowOffset: [-1.5, -1.3],
    gloss: [{ x: m[0] - 1.6, y: m[1] - 1, rx: 1.1, ry: 2.2, rot: 0.2, alpha: 0.3 }],
  });
  // elbow crease + forearm muscle line
  line(ctx, [[e[0] - 1.6, e[1] + 0.4], [e[0] + 0.6, e[1] + 1.2]], 0.7, P_SKIN_SH, true, 0.9);
  if (flour) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ellipsePath(ctx, m[0] + 0.8, m[1] + 1.4, 2.2, 1.1, 0.5);
    ellipsePath(ctx, m[0] - 1.6, m[1] + 2.8, 0.9, 0.6, 0.2);
    ctx.fill();
    ctx.restore();
  }
  ball(ctx, w[0], w[1] + 0.8, 3.7, P_SKIN, P_SKIN_SH);
  line(ctx, [[w[0] - 1.8, w[1] - 0.2], [w[0] + 1.4, w[1] - 0.7]], 0.6, P_SKIN_SH, true, 0.9);
}

function drawPeppe(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  const hx = 1, hy = -27.5;

  // --- pizza peel strapped on his back (blade pokes out above-left)
  inkLine(ctx, [[-10, -33], [8, -6]], 3, P_WOOD, false, 1.3);
  const bx = -13.5, by = -38.5;
  shape(ctx, (c) => ellipsePath(c, bx, by, 12.4, 11.4, -0.5), {
    fill: P_WOOD, shadow: P_WOOD_SH, shadowOffset: [-2.4, -2.4],
    gloss: [{ x: bx - 4, y: by - 5, rx: 4, ry: 1.6, rot: -0.6, alpha: 0.4 }],
  });
  clipped(ctx, (c) => ellipsePath(c, bx, by, 12.4, 11.4, -0.5), () => {
    for (let i = -3; i <= 3; i++) line(ctx, [[bx - 14 + i * 1.2, by + i * 3.2 - 6], [bx + 14 + i * 1.2, by + i * 3.2 + 4]], 0.6, '#b98244', true, 0.55);
    ctx.fillStyle = rgba('#3a1d0e', 0.35);
    ctx.beginPath();
    ellipsePath(ctx, bx + 6, by - 6, 3, 1.6, -0.5);
    ellipsePath(ctx, bx - 7, by + 5, 2.2, 1.1, -0.4);
    ctx.fill();
  });

  // --- far arm
  popeyeArm(ctx, [-14.5, -11], [-18.5 - sw * 0.8, -2.5], [-18 - sw * 2.8, 4.8], false);

  // --- legs (jeans, brown shoes) + flour dust
  legs(ctx, 0, 6, f, { len: 13, spread: 10, thick: 5.8, color: P_PANTS, shoe: '#5b3a28', stride: 5 });
  shape(ctx, (c) => roundRectPath(c, -13.6, 3.4, 27.2, 8.6, [1, 1, 5, 5]), { fill: P_PANTS, shadow: P_PANTS_SH, shadowOffset: [-2, -1.6] });
  speckle(ctx, 0, 9, 12, 3.4, 24, '#ffffff', 0.45, 11, 0.55);
  // floury handprint on the thigh
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ellipsePath(ctx, 7.2, 8.6, 1.9, 1.5, 0.2);
  for (let i = 0; i < 4; i++) ellipsePath(ctx, 5.4 + i * 1.25, 6.2 - (i === 1 || i === 2 ? 0.4 : 0), 0.48, 0.95);
  ctx.fill();
  ctx.restore();

  // --- torso: skin shoulders + white tank top
  const torso = (c: Ctx) => {
    c.moveTo(-10.5, -15.6);
    c.quadraticCurveTo(-18.2, -15.2, -18, -8);
    c.quadraticCurveTo(-17.4, 0, -14, 7);
    c.quadraticCurveTo(0, 10, 14, 7);
    c.quadraticCurveTo(17.4, 0, 18, -8);
    c.quadraticCurveTo(18.2, -15.2, 10.5, -15.6);
    c.quadraticCurveTo(0, -18, -10.5, -15.6);
    c.closePath();
  };
  shape(ctx, torso, { fill: P_SKIN, shadow: P_SKIN_SH, shadowOffset: [-2.6, -2] });
  const tank = (c: Ctx) => {
    c.moveTo(-10, -16);
    c.lineTo(-6.6, -16.4);
    c.quadraticCurveTo(0, -8.6, 6.6, -16.4);
    c.lineTo(10, -16);
    c.quadraticCurveTo(11.6, -9.5, 15.6, -6.6);
    c.quadraticCurveTo(16.8, 0, 14, 7);
    c.quadraticCurveTo(0, 10, -14, 7);
    c.quadraticCurveTo(-16.8, 0, -15.6, -6.6);
    c.quadraticCurveTo(-11.6, -9.5, -10, -16);
    c.closePath();
  };
  shape(ctx, tank, { fill: WHITE, ink: 1.6, shadow: WHITE_SH, shadowOffset: [-3, -2], gloss: [{ x: -8, y: -5, rx: 2.4, ry: 4, rot: 0.2, alpha: 0.6 }] });
  // chest hair peeking out of the tank
  for (const [x, y] of [[-1.6, -12.4], [0.6, -11.6], [2.6, -12.6]] as Pt[]) {
    line(ctx, [[x - 0.6, y + 0.6], [x, y - 0.4], [x + 0.6, y + 0.4]], 0.6, P_HAIR, true, 0.8);
  }
  // flour on the tank (warm dusting so it reads on white)
  speckle(ctx, 4, 2, 7, 5, 14, '#e8dcc2', 0.6, 5, 0.9);
  // leather strap for the peel (bandolier)
  shape(ctx, (c) => {
    c.moveTo(-12.4, -12.6);
    c.lineTo(-9.4, -14.6);
    c.lineTo(14.6, 4.6);
    c.lineTo(12.6, 7.2);
    c.closePath();
  }, { fill: '#8a5532', ink: 1.2, shadow: '#5f3820', shadowOffset: [-0.8, -0.8] });
  shape(ctx, (c) => roundRectPath(c, 2.6, -4.2, 3.6, 3.2, 0.6), { fill: '#e7c35a', ink: 0.9, shadow: '#b68f2c', shadowOffset: [-0.5, -0.5] });
  // belt
  shape(ctx, (c) => roundRectPath(c, -13.8, 3.6, 27.6, 3, 1), { fill: '#5a3826', ink: 1.2, shadow: 'none' });
  shape(ctx, (c) => roundRectPath(c, -2.2, 3.3, 4.4, 3.6, 0.7), { fill: '#cfd3dc', ink: 1, shadow: '#8f95a5', shadowOffset: [-0.5, -0.5] });

  // --- red neckerchief, knot on the side, tails flapping
  shape(ctx, (c) => {
    c.moveTo(-8, -16.6);
    c.quadraticCurveTo(0, -12.4, 8.4, -16.4);
    c.quadraticCurveTo(7, -12.8, 3, -11.6);
    c.quadraticCurveTo(-4, -11.6, -8, -16.6);
    c.closePath();
  }, { fill: RED, ink: 1.4, shadowOffset: [-1.2, -1.2] });
  shape(ctx, (c) => {
    c.moveTo(-3.6, -12.2);
    c.quadraticCurveTo(-7 + sw * 0.4, -9.6, -8.6 + sw * 0.6, -6.6);
    c.lineTo(-5.4 + sw * 0.4, -7.8);
    c.lineTo(-3.4 + sw * 0.6, -5.4);
    c.quadraticCurveTo(-2.4, -9, -1, -11.8);
    c.closePath();
  }, { fill: RED, ink: 1.3, shadowOffset: [-0.9, -0.9] });
  ball(ctx, -2.4, -12.2, 1.9, RED, '#9d1f2c', 1.2, 0.4);

  // --- head: broad jaw, curls, stubble, cheeky grin
  const headPts: Pt[] = [
    [hx, hy - 12.4], [hx + 8.8, hy - 9.2], [hx + 12.6, hy - 1.2], [hx + 11.8, hy + 6.4], [hx + 6, hy + 11.8],
    [hx - 2, hy + 12.4], [hx - 9.4, hy + 8.8], [hx - 12.6, hy + 1], [hx - 10, hy - 8.6],
  ];
  const head = (c: Ctx) => smoothPath(c, headPts, true);
  shape(ctx, head, { fill: P_SKIN, shadow: P_SKIN_SH, shadowOffset: [-2.6, -2.2], gloss: [{ x: hx - 5, y: hy - 5.5, rx: 3.6, ry: 2, rot: -0.5, alpha: 0.35 }] });
  // stubble (clipped to the head)
  clipped(ctx, head, () => {
    ctx.fillStyle = 'rgba(52,58,84,0.26)';
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy + 1.5);
    ctx.quadraticCurveTo(hx - 6, hy + 4.4, hx - 1, hy + 4.8);
    ctx.quadraticCurveTo(hx + 4, hy + 6, hx + 8, hy + 4.6);
    ctx.quadraticCurveTo(hx + 11, hy + 3.6, hx + 14, hy + 1);
    ctx.lineTo(hx + 14, hy + 16);
    ctx.lineTo(hx - 13, hy + 16);
    ctx.closePath();
    ctx.fill();
    speckle(ctx, hx + 1, hy + 9, 11, 4, 40, '#2c2a3c', 0.28, 21, 0.55);
  });
  // curly black hair (back + sideburn)
  group(ctx, [
    { build: (c) => { circlePath(c, hx - 10.6, hy - 6, 3.6); circlePath(c, hx - 12.2, hy - 1.2, 2.9); circlePath(c, hx - 7.6, hy - 9.4, 3.4); circlePath(c, hx - 2.4, hy - 10.8, 3.3); circlePath(c, hx + 3.4, hy - 11, 3.1); circlePath(c, hx + 8.6, hy - 9, 3); circlePath(c, hx + 11.4, hy - 5, 2.4); }, style: { fill: P_HAIR, shadow: '#120a07', shadowOffset: [-1, -1], gloss: [{ x: hx - 9, y: hy - 8, rx: 1.6, ry: 0.8, rot: -0.6, alpha: 0.3 }] } },
    { build: (c) => { c.moveTo(hx - 11.8, hy - 2); c.lineTo(hx - 8.4, hy - 2); c.lineTo(hx - 8.6, hy + 4.6); c.quadraticCurveTo(hx - 11, hy + 4, hx - 11.8, hy - 2); c.closePath(); }, style: { fill: P_HAIR, shadow: 'none' } },
  ], 1.4);
  shape(ctx, (c) => ellipsePath(c, hx - 12, hy + 2, 2.6, 3.4), { fill: P_SKIN, ink: 1.5, shadow: P_SKIN_SH, shadowOffset: [-0.8, -0.8] });
  // flour smudge on the cheek
  blush(ctx, [[hx - 5.6, hy + 4.6, 2.6, 1.6]], CHEEK, 0.3);
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ellipsePath(ctx, hx - 6.2, hy + 3.2, 1.6, 0.8, -0.3);
  ellipsePath(ctx, hx - 4.6, hy + 2.6, 0.7, 0.45, -0.3);
  ctx.fill();
  ctx.restore();
  // eyes + cheeky raised brow
  eye(ctx, hx - 1.4, hy - 1.6, 3, { look: [0.34, 0.12], pupil: 0.6, iris: '#5b3a22' });
  eye(ctx, hx + 6.8, hy - 1.8, 3, { look: [0.34, 0.12], pupil: 0.6, iris: '#5b3a22' });
  // lower lids pushed up by the grin (cheeky squint)
  for (const [ex, ey2] of [[hx - 1.4, hy - 1.6], [hx + 6.8, hy - 1.8]] as Pt[]) {
    shape(ctx, (c) => {
      c.moveTo(ex - 3.9, ey2 + 3.8);
      c.lineTo(ex - 3.9, ey2 + 1.2);
      c.quadraticCurveTo(ex, ey2 - 0.4, ex + 3.9, ey2 + 1);
      c.lineTo(ex + 3.9, ey2 + 3.8);
      c.closePath();
    }, { fill: P_SKIN, ink: 0, shadow: 'none' });
    line(ctx, [[ex - 3, ey2 + 1.6], [ex, ey2 + 0.5], [ex + 3, ey2 + 1.4]], 1.1, INK, true);
  }
  brow(ctx, hx - 1.6, hy - 6, 5.6, 0.12, 2.1, P_HAIR);
  brow(ctx, hx + 7.2, hy - 7.6, 5.6, -0.3, 2.1, P_HAIR);
  // big Neapolitan nose
  shape(ctx, (c) => ellipsePath(c, hx + 4.2, hy + 2.8, 3.3, 2.8), { fill: '#e2946c', ink: 1.3, shadow: '#c27552', shadowOffset: [-1, -1], gloss: [{ x: hx + 3.2, y: hy + 1.8, rx: 1.1, ry: 0.75, alpha: 0.75 }] });
  // cheeky open grin
  mouth(ctx, hx + 4, hy + 7.9, 8.2, 'smile', { teeth: true, tongue: true });

  // --- white paper cap (bustina), tilted
  ctx.save();
  ctx.translate(hx + 0.4, hy - 9.2);
  ctx.rotate(-0.12);
  const cap = (c: Ctx) => {
    c.moveTo(-12.6, 0.6);
    c.quadraticCurveTo(-12.2, -6.2, -8.8, -8.6);
    c.lineTo(8.6, -9.8);
    c.quadraticCurveTo(12.8, -6.8, 12.8, 0);
    c.quadraticCurveTo(0, 2.6, -12.6, 0.6);
    c.closePath();
  };
  shape(ctx, cap, { fill: WHITE, ink: 2, shadow: WHITE_SH, shadowOffset: [-2, -1.8], gloss: [{ x: -4, y: -6.4, rx: 4, ry: 1.2, rot: -0.06, alpha: 0.8 }] });
  line(ctx, [[-11.6, -3.2], [0, -2], [11.8, -3.6]], 0.9, '#b9bfd0', true);
  line(ctx, [[-8.8, -8.4], [8.4, -9.6]], 1.1, '#b9bfd0', false, 0.9);
  ctx.restore();

  // --- near arm
  popeyeArm(ctx, [14.5, -11], [18.8 + sw * 0.8, -2.5], [18.6 + sw * 2.8, 4.8], true);
}

// ---------------------------------------------------------------------------
// SOFIA LA ROMANA — carbonara purist: black jacket, pecorino scarf, ponytail, fork.
// ---------------------------------------------------------------------------
const S_SKIN = '#f2c3a0', S_SKIN_SH = '#d99b7d';
const S_JACKET = '#383744', S_JACKET_SH = '#22212c', S_JACKET_RIM = '#8d8aa6';
const S_HAIR = '#3b2219', S_HAIR_SH = '#21110b';
const S_SCARF = '#f3cf63', S_SCARF_SH = '#d39f35';
const S_BANDANA = '#2a2831';
const GOLD = '#f2c14e', GOLD_SH = '#b98a2b';

function fork(ctx: Ctx, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // local: handle end at (0, +9), tines toward −y
  const steel = '#dfe5ee', steelSh = '#98a2b6';
  group(ctx, [
    { build: (c) => roundRectPath(c, -1.1, -12, 2.2, 21.5, 1.1), style: { fill: steel, shadow: steelSh, shadowOffset: [-0.7, 0] } },
    {
      build: (c) => {
        c.moveTo(-1.2, -11);
        c.quadraticCurveTo(-3.6, -13, -3.6, -16);
        c.lineTo(3.6, -16);
        c.quadraticCurveTo(3.6, -13, 1.2, -11);
        c.closePath();
      },
      style: { fill: steel, shadow: steelSh, shadowOffset: [-0.8, 0] },
    },
    ...[-3, -1, 1, 3].map((tx) => ({ build: (c: Ctx) => roundRectPath(c, tx - 0.6, -22, 1.2, 7, 0.6), style: { fill: steel, shadow: steelSh, shadowOffset: [-0.5, 0] as Pt } })),
  ], 1.1);
  line(ctx, [[-0.3, -9], [-0.3, 6]], 0.6, '#ffffff', false, 0.8);
  ctx.restore();
}

function drawSofia(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  const cw = Math.cos(ph);
  const hx = 1, hy = -26;

  // --- high ponytail swinging behind (counter-phase to the walk)
  const swing = -sw * 1.9;
  const pony: Pt[] = [
    [hx - 4.6, hy - 10.6], [hx - 8.8, hy - 16.4], [hx - 14.8 + swing * 0.3, hy - 16.6], [hx - 18.8 + swing * 0.6, hy - 11],
    [hx - 20 + swing * 0.9, hy - 3], [hx - 18.6 + swing * 1.1, hy + 4.6], [hx - 15.2 + swing * 1.3, hy + 9.4],
  ];
  shape(ctx, (c) => smoothPath(c, ribbon(pony, [5.4, 7.4, 8.2, 7.6, 6.2, 3.8, 0.6]), true), {
    fill: S_HAIR, shadow: S_HAIR_SH, shadowOffset: [-1.8, -1.8], rim: '#a0705a',
    gloss: [{ x: hx - 13, y: hy - 15, rx: 3.2, ry: 1.1, rot: -0.2, alpha: 0.4 }],
  });
  line(ctx, [[hx - 10, hy - 14.6], [hx - 16.6 + swing * 0.5, hy - 10], [hx - 17.6 + swing, hy + 1], [hx - 16.4 + swing * 1.2, hy + 6]], 0.7, '#7a4b38', true, 0.85);

  // --- scarf tail fluttering behind
  const flap = cw * 1.4;
  shape(ctx, (c) => smoothPath(c, ribbon([[-6, -15], [-12, -15.6 + flap * 0.3], [-17.5, -13.6 + flap], [-21, -10 + flap * 1.3]], [4.6, 4.2, 3.8, 3.4]), true), {
    fill: S_SCARF, ink: 1.4, shadow: S_SCARF_SH, shadowOffset: [-1, -1.2],
  });
  for (let i = 0; i < 4; i++) line(ctx, [[-22.4 + i * 0.9, -11.2 + flap * 1.3 + i * 0.5], [-24 + i * 0.9, -9.8 + flap * 1.3 + i * 0.6]], 0.7, S_SCARF_SH, false, 0.9);

  // --- far arm
  inkLine(ctx, [[-9.5, -9], [-13 - sw * 1.4, -3], [-12.4 - sw * 3.2, 2.8]], 4.4, S_JACKET, true, 1.4);
  line(ctx, [[-14.6 - sw * 3.2, 1.2], [-10.6 - sw * 3.2, 1.6]], 1, WHITE, false, 0.9);
  ball(ctx, -12.4 - sw * 3.2, 4, 2.5, S_SKIN, S_SKIN_SH);

  // --- legs: houndstooth chef trousers, white clogs
  legs(ctx, 0, 6, f, { len: 13, spread: 8, thick: 4.6, color: '#5d5a6b', shoe: '#f4f0e8', stride: 5.2 });

  // --- jacket
  const jacket = (c: Ctx) => {
    c.moveTo(-8.4, -14);
    c.quadraticCurveTo(-13.2, -13, -13, -6.4);
    c.quadraticCurveTo(-12.4, -0.6, -10.8, 2.6);
    c.quadraticCurveTo(-12.6, 5.6, -12.6, 9);
    c.quadraticCurveTo(0, 12.2, 12.6, 9);
    c.quadraticCurveTo(12.6, 5.6, 10.8, 2.6);
    c.quadraticCurveTo(12.4, -0.6, 13, -6.4);
    c.quadraticCurveTo(13.2, -13, 8.4, -14);
    c.quadraticCurveTo(0, -16, -8.4, -14);
    c.closePath();
  };
  shape(ctx, jacket, { fill: S_JACKET, shadow: S_JACKET_SH, shadowOffset: [-2.8, -2], rim: S_JACKET_RIM, gloss: [{ x: -7.6, y: -7, rx: 2, ry: 3.4, rot: 0.2, alpha: 0.18 }] });
  // white piping: wrap-over front edge + hem
  line(ctx, [[-3.6, -13.2], [3.2, -8.6], [4.2, -2], [4.4, 10.2]], 1.1, WHITE, true);
  line(ctx, [[-12.4, 8.6], [0, 11.4], [12.4, 8.6]], 1, WHITE, true, 0.95);
  for (const by of [-6.4, -1.8, 2.8]) {
    for (const bx of [1.2, 8.2]) ball(ctx, bx, by, 1.05, '#f7f3ea', '#c4c0b8', 0.6, 0.8);
  }

  // --- pecorino scarf around the neck + front tail
  shape(ctx, (c) => smoothPath(c, ribbon([[-3.4, -13.6], [-5.6, -9], [-4.6, -3.6], [-5.6, 0.6]], [4.6, 4.4, 4, 4.2]), true), {
    fill: S_SCARF, ink: 1.4, shadow: S_SCARF_SH, shadowOffset: [-1.2, -1],
  });
  for (let i = 0; i < 4; i++) line(ctx, [[-7.4 + i * 1.1, 2.3], [-7.6 + i * 1.1, 3.8]], 0.7, S_SCARF_SH, false);
  shape(ctx, (c) => {
    c.moveTo(-9.8, -16.4);
    c.quadraticCurveTo(0, -11.6, 10, -16.4);
    c.quadraticCurveTo(10.8, -13.4, 8.6, -11.6);
    c.quadraticCurveTo(0, -8.2, -8.8, -11.6);
    c.quadraticCurveTo(-10.8, -13.4, -9.8, -16.4);
    c.closePath();
  }, { fill: S_SCARF, ink: 1.6, shadow: S_SCARF_SH, shadowOffset: [-1.4, -1.4], gloss: [{ x: -4, y: -13.4, rx: 3, ry: 0.9, alpha: 0.45 }] });
  line(ctx, [[-6, -12.6], [0, -10.6], [6, -12.6]], 0.7, S_SCARF_SH, true, 0.9);

  // --- head
  shape(ctx, (c) => ellipsePath(c, hx - 11, hy + 1.4, 2.4, 3.2), { fill: S_SKIN, ink: 1.5, shadow: S_SKIN_SH, shadowOffset: [-0.8, -0.8] });
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx - 11.4, hy + 6, 1.7, 0, TAU);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.restore();
  shape(ctx, (c) => circlePath(c, hx, hy, 11.5), { fill: S_SKIN, shadow: S_SKIN_SH, shadowOffset: [-2.5, -2.1], gloss: [{ x: hx - 5, y: hy - 4, rx: 3.4, ry: 2, rot: -0.5, alpha: 0.4 }] });
  // hair cap with side-swept bangs
  const hairCap = (c: Ctx) => smoothPath(c, [
    [hx - 11.2, hy + 2.6], [hx - 12.3, hy - 3.6], [hx - 9.8, hy - 9.6], [hx - 3.6, hy - 12.6], [hx + 3.8, hy - 12.3],
    [hx + 9.6, hy - 8.8], [hx + 12.2, hy - 2.6], [hx + 11.6, hy + 0.6], [hx + 9, hy - 4.4], [hx + 4.6, hy - 6.4],
    [hx - 0.6, hy - 6.8], [hx - 5.4, hy - 5.2], [hx - 8.6, hy - 1.8], [hx - 9.2, hy + 2.6],
  ], true, 0.45);
  shape(ctx, hairCap, { fill: S_HAIR, shadow: S_HAIR_SH, shadowOffset: [-1.6, -1.6], rim: '#a0705a', gloss: [{ x: hx + 3, y: hy - 7.6, rx: 3, ry: 0.9, rot: 0.15, alpha: 0.35 }] });
  line(ctx, [[hx - 5, hy - 6.4], [hx + 1.6, hy - 8.6], [hx + 8, hy - 6.8], [hx + 11, hy - 2]], 0.7, S_HAIR_SH, true, 0.9);
  // black bandana tied as a headband (white dots), knot + tails at the back
  const band = (c: Ctx) => {
    c.moveTo(hx - 12, hy - 4.8);
    c.bezierCurveTo(hx - 10, hy - 11.2, hx + 4.6, hy - 14.4, hx + 11.6, hy - 7.6);
    c.lineTo(hx + 12.2, hy - 4.2);
    c.bezierCurveTo(hx + 5.4, hy - 10.4, hx - 8, hy - 8.6, hx - 11.6, hy - 1.2);
    c.closePath();
  };
  shape(ctx, band, { fill: S_BANDANA, ink: 1.5, shadow: '#141318', shadowOffset: [-1, -1.3], rim: '#8a879f' });
  clipped(ctx, band, () => speckle(ctx, hx, hy - 8.4, 12.6, 4, 20, '#f1ece2', 0.42, 31, 0.95));
  const fl = sw * 0.7;
  shape(ctx, (c) => {
    c.moveTo(hx - 12, hy - 4.2);
    c.quadraticCurveTo(hx - 16.6, hy - 6.8 + fl, hx - 18.6, hy - 4.8 + fl);
    c.quadraticCurveTo(hx - 15.6, hy - 3.4 + fl * 0.5, hx - 12.6, hy - 2.2);
    c.closePath();
    c.moveTo(hx - 12.4, hy - 2.4);
    c.quadraticCurveTo(hx - 15.8, hy - 0.6 + fl, hx - 17.2, hy + 2.4 + fl);
    c.quadraticCurveTo(hx - 14.4, hy + 0.6, hx - 11.8, hy - 0.8);
    c.closePath();
  }, { fill: S_BANDANA, ink: 1.2, shadow: 'none', rim: '#8a879f' });
  ball(ctx, hx - 12.2, hy - 3, 1.9, S_BANDANA, '#141318', 1.2, 0.35);
  // pecorino hair tie where the ponytail leaves the crown
  shape(ctx, (c) => ellipsePath(c, hx - 5.8, hy - 12.3, 2.7, 1.6, -0.62), { fill: S_SCARF, ink: 1.1, shadow: S_SCARF_SH, shadowOffset: [-0.6, -0.6] });
  // face: confident half-lidded almond eyes, one arched brow, smirk
  blush(ctx, [[hx - 4.4, hy + 4.2, 2.6, 1.5], [hx + 9.3, hy + 4, 2, 1.4]], '#f07a6e', 0.38);
  almondEye(ctx, hx - 1.5, hy - 0.4, 5.4, 2.8, -1, { iris: '#6b3f26', look: [0.5, 0.15], upIn: 0.66, upOut: 0.8 });
  almondEye(ctx, hx + 6.9, hy - 0.6, 5.4, 2.8, 1, { iris: '#6b3f26', look: [0.5, 0.15], upIn: 0.66, upOut: 0.8 });
  brow(ctx, hx - 1.6, hy - 4.8, 4.8, 0.06, 1.2, S_HAIR);
  brow(ctx, hx + 7.2, hy - 5.9, 4.8, -0.3, 1.2, S_HAIR);
  shape(ctx, (c) => {
    c.moveTo(hx + 3.2, hy + 0.6);
    c.quadraticCurveTo(hx + 5.6, hy + 3.4, hx + 4.4, hy + 4);
    c.quadraticCurveTo(hx + 3, hy + 4.2, hx + 2.6, hy + 3.4);
    c.closePath();
  }, { fill: '#eca988', ink: 1, shadow: 'none' });
  // confident smirk, red lips
  shape(ctx, (c) => {
    c.moveTo(hx + 0.4, hy + 7.4);
    c.quadraticCurveTo(hx + 3.4, hy + 8.4, hx + 6.8, hy + 5.8);
    c.quadraticCurveTo(hx + 4.6, hy + 9.8, hx + 1.6, hy + 8.6);
    c.closePath();
  }, { fill: '#cf4652', ink: 1, shadow: 'none' });
  line(ctx, [[hx + 0.2, hy + 7.4], [hx + 3.4, hy + 8], [hx + 7, hy + 5.6]], 1, INK, true);

  // --- near arm + fork
  const hxr = 14.8 + sw * 2.2, hyr = 1.6 - Math.abs(sw) * 0.4;
  fork(ctx, hxr + 0.4, hyr - 2, 0.14 + sw * 0.06);
  inkLine(ctx, [[10, -9.5], [14.4 + sw * 0.8, -4], [hxr, hyr]], 4.6, S_JACKET, true, 1.4);
  line(ctx, [[hxr - 2, hyr - 1.2], [hxr + 2, hyr - 1.6]], 1, WHITE, false, 0.9);
  ball(ctx, hxr, hyr + 1, 2.7, S_SKIN, S_SKIN_SH);
}

// ---------------------------------------------------------------------------
// FRA' TOMMASO — round jolly monk cheesemaker with a Parmigiano wedge.
// ---------------------------------------------------------------------------
const T_SKIN = '#f6c4a1', T_SKIN_SH = '#dc9a7e';
const T_HABIT = '#8c5a37', T_HABIT_SH = '#5e3820', T_HABIT_RIM = '#c48c5e';
const T_ROPE = '#efe2c2', T_ROPE_SH = '#c4ad84';
const T_BEARD = '#f7f3ec', T_BEARD_SH = '#c9c5d2';

function cheeseWedge(ctx: Ctx, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // tip at the origin, rind arc on the right
  const top = (c: Ctx) => {
    c.moveTo(0, 0);
    c.lineTo(11.6, -6.2);
    c.quadraticCurveTo(14.6, -3, 13.4, 1.2);
    c.closePath();
  };
  const side = (c: Ctx) => {
    c.moveTo(0, 0);
    c.lineTo(13.4, 1.2);
    c.lineTo(13.4, 5.6);
    c.lineTo(0, 3.6);
    c.closePath();
  };
  const rind = (c: Ctx) => {
    c.moveTo(11.6, -6.2);
    c.quadraticCurveTo(14.6, -3, 13.4, 1.2);
    c.lineTo(13.4, 5.6);
    c.quadraticCurveTo(15.8, 0.8, 13.6, -6.2);
    c.closePath();
  };
  group(ctx, [
    { build: top, style: { fill: '#f8db7c', shadow: 'none', gloss: [{ x: 7, y: -2.4, rx: 3, ry: 0.9, rot: -0.3, alpha: 0.5 }] } },
    { build: side, style: { fill: '#eec35a', shadow: 'none' } },
    { build: rind, style: { fill: '#d99633', shadow: 'none' } },
  ], 1.3);
  line(ctx, [[0, 0], [13.4, 1.2]], 0.7, '#c99a3a', false, 0.9);
  speckle(ctx, 8, -1.6, 3.4, 1.6, 7, '#fff1c4', 0.4, 4, 0.9); // crystals
  speckle(ctx, 7, 3, 4, 0.8, 5, '#c9983c', 0.35, 9, 0.8);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#9a5d1b';
    ctx.beginPath();
    circlePath(ctx, 14.2, -4 + i * 2.4, 0.35);
    circlePath(ctx, 14.8, -3.2 + i * 2.4, 0.35);
    ctx.fill();
  }
  ctx.restore();
}

function drawTommaso(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  const hx = 1, hy = -25.4;

  // --- hood bunched behind the neck
  shape(ctx, (c) => {
    c.moveTo(-14.6, -12);
    c.quadraticCurveTo(-15.6, -20, -7, -21.4);
    c.lineTo(9, -21.4);
    c.quadraticCurveTo(16.2, -20, 14.8, -12);
    c.closePath();
  }, { fill: T_HABIT, shadow: T_HABIT_SH, shadowOffset: [-1.8, -1.8], rim: T_HABIT_RIM });

  // --- far sleeve (behind)
  shape(ctx, (c) => {
    c.moveTo(-12, -11);
    c.quadraticCurveTo(-20 - sw, -7, -20.6 - sw * 2, 1.6);
    c.lineTo(-14.6 - sw * 2, 3.2);
    c.quadraticCurveTo(-14, -4, -10, -6);
    c.closePath();
  }, { fill: T_HABIT, shadow: T_HABIT_SH, shadowOffset: [-1.6, -1.4] });
  ball(ctx, -17.8 - sw * 2, 3.6, 2.7, T_SKIN, T_SKIN_SH);

  // --- sandalled feet peeking from under the hem
  for (const side of [-1, 1]) {
    const s = Math.sin(ph + (side < 0 ? 0 : Math.PI));
    const lift = Math.max(0, -Math.cos(ph + (side < 0 ? 0 : Math.PI))) * 1.8;
    const fx = side * 5.6 + s * 2.6, fy = 19.6 - lift;
    shape(ctx, (c) => ellipsePath(c, fx + side * 0.6, fy + 0.8, 4.2, 1.6), { fill: '#7a4a2a', ink: 1.2, shadow: 'none' });
    shape(ctx, (c) => ellipsePath(c, fx + side * 0.4, fy - 0.4, 3.4, 2.1), { fill: T_SKIN, ink: 1.2, shadow: T_SKIN_SH, shadowOffset: [-0.6, -0.6] });
    line(ctx, [[fx - 2.4, fy - 1.2], [fx + 2.6, fy - 1.6]], 1.3, '#7a4a2a');
    for (let t = 0; t < 3; t++) line(ctx, [[fx + side * 1.2 + t * 1.1, fy + 0.6], [fx + side * 1.2 + t * 1.1, fy + 1.3]], 0.4, T_SKIN_SH);
  }

  // --- round habit
  const habit = (c: Ctx) => {
    c.moveTo(-9, -14.2);
    c.bezierCurveTo(-19.6, -9, -20.4, 8, -15.6, 14.4);
    c.quadraticCurveTo(-11, 17.2, -6, 16.2);
    c.quadraticCurveTo(0, 17.8, 6, 16.2);
    c.quadraticCurveTo(11, 17.2, 15.6, 14.4);
    c.bezierCurveTo(20.4, 8, 19.6, -9, 9, -14.2);
    c.quadraticCurveTo(0, -16.6, -9, -14.2);
    c.closePath();
  };
  shape(ctx, habit, {
    fill: T_HABIT, shadow: T_HABIT_SH, shadowOffset: [-3.4, -2.6], rim: T_HABIT_RIM,
    gloss: [{ x: -9, y: -4, rx: 2.6, ry: 5, rot: 0.25, alpha: 0.16 }],
  });
  // fabric folds
  line(ctx, [[-8, 5], [-9.4, 15.6]], 1, T_HABIT_SH, true, 0.75);
  line(ctx, [[6.6, 6], [7.8, 15.8]], 1, T_HABIT_SH, true, 0.75);
  line(ctx, [[-1, 8], [-0.4, 16.6]], 0.8, T_HABIT_SH, true, 0.6);

  // --- rope belt with three Franciscan knots swinging
  shape(ctx, (c) => {
    c.moveTo(-18.6, -1.4);
    c.quadraticCurveTo(0, 3.6, 18.6, -1.4);
    c.lineTo(18.4, 1.4);
    c.quadraticCurveTo(0, 6.4, -18.4, 1.4);
    c.closePath();
  }, { fill: T_ROPE, ink: 1.3, shadow: T_ROPE_SH, shadowOffset: [-0.8, -0.9] });
  for (let i = -6; i <= 6; i++) line(ctx, [[i * 2.8 - 0.8, 0.4 + Math.abs(i) * -0.35 + 1.6], [i * 2.8 + 0.6, -0.6 + Math.abs(i) * -0.35 + 1.6]], 0.5, T_ROPE_SH, false, 0.9);
  const sway = -sw * 1.2;
  for (const [ox, len] of [[-6.2, 13], [-3.6, 11]] as Pt[]) {
    const pts: Pt[] = [[ox, 2.6], [ox + sway * 0.4, 2.6 + len * 0.5], [ox + sway, 2.6 + len]];
    inkLine(ctx, pts, 1.4, T_ROPE, true, 1);
    for (let k = 1; k <= 3; k++) {
      const t = k / 3.4;
      ball(ctx, ox + sway * t * t * 0.9, 2.6 + len * t, 1.25, T_ROPE, T_ROPE_SH, 0.9, 0.5);
    }
  }
  ball(ctx, -5, 2.6, 2, T_ROPE, T_ROPE_SH, 1.1);

  // --- head: tonsure, rosy cheeks, jolly closed eyes, big white beard
  shape(ctx, (c) => ellipsePath(c, hx - 12.2, hy + 1.6, 2.5, 3.3), { fill: T_SKIN, ink: 1.5, shadow: T_SKIN_SH, shadowOffset: [-0.8, -0.8] });
  shape(ctx, (c) => circlePath(c, hx, hy, 12.6), {
    fill: T_SKIN, shadow: T_SKIN_SH, shadowOffset: [-2.6, -2.2],
    gloss: [{ x: hx - 4.4, y: hy - 8.4, rx: 4.6, ry: 2.4, rot: -0.4, alpha: 0.75 }, { x: hx + 1.6, y: hy - 10.6, rx: 1.4, ry: 0.8, rot: -0.2, alpha: 0.7 }],
  });
  // tonsure fringe (fluffy white ring at the sides/back)
  group(ctx, [
    { build: (c) => { circlePath(c, hx - 11.6, hy - 4.6, 3); circlePath(c, hx - 12.6, hy - 0.6, 2.6); circlePath(c, hx - 9.6, hy - 8, 2.6); }, style: { fill: T_BEARD, shadow: T_BEARD_SH, shadowOffset: [-0.9, -0.9] } },
  ], 1.3);
  group(ctx, [
    { build: (c) => { circlePath(c, hx + 11.4, hy - 4.6, 2.5); circlePath(c, hx + 12.2, hy - 1, 2.1); }, style: { fill: T_BEARD, shadow: T_BEARD_SH, shadowOffset: [-0.9, -0.9] } },
  ], 1.3);
  // beard (puffy cloud from cheek to cheek)
  const beardPuffs: [number, number, number][] = [
    [hx - 9, hy + 4.4, 3.4], [hx - 7.4, hy + 8.6, 3.8], [hx - 3.4, hy + 11.6, 4.2], [hx + 2, hy + 12.8, 4.4],
    [hx + 7.4, hy + 11.2, 4], [hx + 10.6, hy + 7.4, 3.4], [hx + 11, hy + 3.6, 2.8], [hx + 1.6, hy + 7.4, 5.6],
  ];
  group(ctx, [{ build: (c) => { for (const [x, y, r] of beardPuffs) circlePath(c, x, y, r); }, style: { fill: T_BEARD, shadow: T_BEARD_SH, shadowOffset: [-1.8, -1.8] } }], 1.6);
  line(ctx, [[hx - 3, hy + 11], [hx - 1, hy + 13.4]], 0.7, T_BEARD_SH, true);
  line(ctx, [[hx + 4.6, hy + 12], [hx + 5.6, hy + 14.2]], 0.7, T_BEARD_SH, true);
  // jolly mouth in the beard
  shape(ctx, (c) => {
    c.moveTo(hx + 0.2, hy + 7.4);
    c.quadraticCurveTo(hx + 3.8, hy + 8.4, hx + 7.4, hy + 7);
    c.quadraticCurveTo(hx + 4.4, hy + 12.2, hx + 0.2, hy + 7.4);
    c.closePath();
  }, { fill: '#6b1d24', ink: 1.1, shadow: 'none' });
  shape(ctx, (c) => ellipsePath(c, hx + 4, hy + 9.6, 2, 1), { fill: '#e8616e', ink: 0, shadow: 'none' });
  // fluffy moustache
  group(ctx, [{ build: (c) => { circlePath(c, hx + 1.4, hy + 5.6, 2.6); circlePath(c, hx + 6.2, hy + 5.4, 2.6); circlePath(c, hx + 3.8, hy + 5, 2.2); }, style: { fill: T_BEARD, shadow: T_BEARD_SH, shadowOffset: [-0.8, -1] } }], 1.2);
  // cheeks + nose
  blush(ctx, [[hx - 5, hy + 1.8, 3.2, 2.2], [hx + 9.6, hy + 1.6, 2.4, 2]], '#f06a64', 0.55);
  shape(ctx, (c) => circlePath(c, hx + 3.8, hy + 2, 2.8), { fill: '#f19a86', ink: 1.3, shadow: '#d9796a', shadowOffset: [-0.9, -0.9], gloss: [{ x: hx + 2.8, y: hy + 1, rx: 1, ry: 0.7, alpha: 0.85 }] });
  // ^^ eyes + bushy white brows
  for (const ex of [hx - 1.6, hx + 7.4]) {
    line(ctx, [[ex - 2.6, hy - 1], [ex, hy - 3.6], [ex + 2.6, hy - 1]], 1.5, INK, true);
    line(ctx, [[ex + 2.4, hy - 0.4], [ex + 3.2, hy + 0.2]], 0.6, T_SKIN_SH, false);
  }
  brow(ctx, hx - 1.6, hy - 7.2, 5.4, -0.18, 2.2, T_BEARD);
  brow(ctx, hx + 7.6, hy - 7.2, 5.4, 0.18, 2.2, T_BEARD);
  line(ctx, [[hx - 4.2, hy - 7.6], [hx + 0.8, hy - 8.4]], 0.5, T_BEARD_SH);

  // --- near sleeve + Parmigiano wedge
  const hxr = 13.6 + sw * 1.2, hyr = -0.4;
  shape(ctx, (c) => {
    c.moveTo(10.4, -12.4);
    c.quadraticCurveTo(18.6 + sw * 0.6, -10, 18.4 + sw * 1.2, -1.8);
    c.quadraticCurveTo(15 + sw * 1.2, 1.4, 10.6 + sw * 1.2, -1.2);
    c.quadraticCurveTo(12, -6, 8.8, -8);
    c.closePath();
  }, { fill: T_HABIT, shadow: T_HABIT_SH, shadowOffset: [-1.8, -1.6], rim: T_HABIT_RIM });
  cheeseWedge(ctx, hxr - 6.4, hyr - 1.6, -0.12);
  ball(ctx, hxr + 1.6, hyr + 0.6, 2.8, T_SKIN, T_SKIN_SH);
}

// ---------------------------------------------------------------------------
// ZIA CONCETTA — fiery Calabrian aunt: polka-dot dress, curls, chillies, gold hoops.
// ---------------------------------------------------------------------------
const C_SKIN = '#e9b28a', C_SKIN_SH = '#c98c68';
const C_DRESS = '#d92a3c', C_DRESS_SH = '#9b1530';
const C_HAIR = '#2b1b22', C_HAIR_SH = '#130a0e', C_HAIR_HI = '#6e4c5c';
const C_SCARF = '#ec3e44', C_SCARF_SH = '#a8192c';
const CHILLI = '#ff4a26', CHILLI_SH = '#c2181c';

function chilli(ctx: Ctx, x: number, y: number, len: number, rot: number, w = len * 0.32) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // local: stem at origin, pod curving toward +y
  shape(ctx, (c) => {
    c.moveTo(-w * 0.55, 0.2);
    c.quadraticCurveTo(-w * 0.7, len * 0.55, w * 0.2, len);
    c.quadraticCurveTo(w * 0.3, len * 0.6, w * 0.55, 0.2);
    c.quadraticCurveTo(0, -w * 0.2, -w * 0.55, 0.2);
    c.closePath();
  }, { fill: CHILLI, ink: Math.min(1.3, 0.5 + len * 0.07), shadow: CHILLI_SH, shadowOffset: [-w * 0.25, -w * 0.1], gloss: [{ x: -w * 0.2, y: len * 0.3, rx: w * 0.14, ry: len * 0.18, rot: 0.1, alpha: 0.7 }] });
  shape(ctx, (c) => {
    c.moveTo(-w * 0.62, 0.6);
    c.quadraticCurveTo(0, -w * 0.5, w * 0.62, 0.6);
    c.quadraticCurveTo(0, w * 0.3, -w * 0.62, 0.6);
    c.closePath();
  }, { fill: '#3f9a3e', ink: Math.min(1, 0.4 + len * 0.05), shadow: 'none' });
  line(ctx, [[0, -w * 0.2], [w * 0.15, -w * 0.7]], Math.max(0.6, w * 0.22), '#2f7a30');
  ctx.restore();
}

/** Big glossy hand-held chilli: calyx at (x,y), pod along local +y with a hooked tip toward −x. */
function bigChilli(ctx: Ctx, x: number, y: number, len: number, rot: number, w: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const pts: Pt[] = [[0, 0.6], [w * 0.22, len * 0.3], [w * 0.12, len * 0.6], [-w * 0.3, len * 0.86], [-w * 0.75, len]];
  const pod = (c: Ctx) => smoothPath(c, ribbon(pts, [w * 1.08, w, w * 0.8, w * 0.42, 0.2]), true, 0.5);
  shape(ctx, pod, {
    fill: CHILLI, ink: 1.3, shadow: CHILLI_SH, shadowOffset: [-w * 0.3, -w * 0.1],
    gloss: [{ x: -w * 0.08, y: len * 0.3, rx: w * 0.15, ry: len * 0.17, rot: -0.08, alpha: 0.8 }],
  });
  shape(ctx, (c) => {
    c.moveTo(-w * 0.64, 1.2);
    c.quadraticCurveTo(-w * 0.52, -w * 0.34, 0, -w * 0.3);
    c.quadraticCurveTo(w * 0.52, -w * 0.34, w * 0.64, 1.2);
    c.quadraticCurveTo(w * 0.36, w * 0.3, w * 0.12, 1.4);
    c.quadraticCurveTo(-w * 0.14, w * 0.34, -w * 0.32, 1.2);
    c.quadraticCurveTo(-w * 0.48, w * 0.38, -w * 0.64, 1.2);
    c.closePath();
  }, { fill: '#48a843', ink: 1.1, shadow: '#2c7a2c', shadowOffset: [-0.5, -0.5] });
  inkLine(ctx, [[0, -w * 0.3], [w * 0.2, -w * 0.78], [w * 0.6, -w * 1]], Math.max(0.9, w * 0.24), '#3b8a37', true, 0.9);
  ctx.restore();
}

function drawConcetta(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  const hx = 1.5, hy = -25;

  // --- big black curls behind the head
  const curls: [number, number, number][] = [
    [-12.4, -5, 4.6], [-13.6, 1.6, 4.2], [-11.4, 7.6, 3.8], [-7.4, 10.4, 3.2], [-10.8, -11, 4.2], [-5.4, -14.6, 4.2],
    [1.4, -15.8, 4.2], [7.8, -14, 4], [12.2, -9.4, 3.8], [14, -3.4, 3.6], [13.4, 2.8, 3.2],
  ];
  group(ctx, [{ build: (c) => { for (const [x, y, r] of curls) circlePath(c, hx + x, hy + y, r); }, style: { fill: C_HAIR, shadow: C_HAIR_SH, shadowOffset: [-1.6, -1.6] } }], 2.2);
  for (const [x, y, r] of curls) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(hx + x - r * 0.08, hy + y - r * 0.08, r * 0.6, -2.7, -0.9);
    ctx.lineWidth = r * 0.3;
    ctx.strokeStyle = C_HAIR_HI;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // --- far arm: hand on the hip (akimbo)
  inkLine(ctx, [[-11, -10], [-17.4, -7], [-18.8 - sw * 0.4, -3.2], [-13.6, 1.4]], 4.2, C_SKIN, true, 1.4);
  shape(ctx, (c) => ellipsePath(c, -12, -10.4, 3.6, 2.8, -0.3), { fill: C_DRESS, ink: 1.4, shadow: C_DRESS_SH, shadowOffset: [-1, -1] });

  // --- legs (bare, black heels)
  legs(ctx, 0, 9, f, { len: 10, spread: 7, thick: 3.8, color: C_SKIN, shoe: '#241a1e', stride: 4 });

  // --- curvy red dress
  const dress = (c: Ctx) => {
    c.moveTo(-9, -13.4);
    c.quadraticCurveTo(-14.6, -12.4, -14, -6);
    c.quadraticCurveTo(-13, -1.2, -10.4, 0);
    c.quadraticCurveTo(-15.6, 4, -16.8, 12);
    c.quadraticCurveTo(0, 16.4, 16.8, 12);
    c.quadraticCurveTo(15.6, 4, 10.4, 0);
    c.quadraticCurveTo(13, -1.2, 14, -6);
    c.quadraticCurveTo(14.6, -12.4, 9, -13.4);
    c.quadraticCurveTo(0, -15.4, -9, -13.4);
    c.closePath();
  };
  // lace petticoat edge
  shape(ctx, (c) => {
    c.moveTo(-16.4, 11);
    c.quadraticCurveTo(0, 15.6, 16.4, 11);
    for (let i = 0; i <= 8; i++) {
      const x = 16.4 - i * 4.1;
      const y = 11 + (1 - (x / 16.4) ** 2) * 4.6;
      c.quadraticCurveTo(x - 2, y + 3.4, x - 4.1, y + 0.6);
    }
    c.closePath();
  }, { fill: '#fbf3e8', ink: 1.2, shadow: '#d9cdbd', shadowOffset: [-0.8, -0.8] });
  shape(ctx, dress, { fill: C_DRESS, shadow: C_DRESS_SH, shadowOffset: [-3, -2.2], gloss: [{ x: -8.6, y: -7, rx: 2.4, ry: 3.6, rot: 0.25, alpha: 0.3 }] });
  clipped(ctx, dress, () => {
    ctx.fillStyle = '#fff4ea';
    for (let r = 0; r < 8; r++) {
      for (let k = 0; k < 8; k++) {
        const x = -17 + k * 4.6 + (r % 2) * 2.3, y = -14 + r * 3.9;
        ctx.beginPath();
        circlePath(ctx, x, y, 1.05);
        ctx.fill();
      }
    }
  });
  // black belt + gold buckle
  shape(ctx, (c) => {
    c.moveTo(-11.2, -1.8);
    c.quadraticCurveTo(0, 0.4, 11.2, -1.8);
    c.lineTo(11, 1.2);
    c.quadraticCurveTo(0, 3.4, -11, 1.2);
    c.closePath();
  }, { fill: '#2a1d22', ink: 1.2, shadow: 'none' });
  shape(ctx, (c) => roundRectPath(c, 1, -1.2, 3.4, 3.4, 0.6), { fill: GOLD, ink: 0.9, shadow: GOLD_SH, shadowOffset: [-0.5, -0.5] });
  // sweetheart neckline (skin)
  shape(ctx, (c) => {
    c.moveTo(-7.2, -13.8);
    c.quadraticCurveTo(0, -11.6, 7.4, -13.8);
    c.lineTo(6.6, -9.6);
    c.quadraticCurveTo(4, -7, 0.6, -8.6);
    c.quadraticCurveTo(-3, -7, -6.2, -9.4);
    c.closePath();
  }, { fill: C_SKIN, ink: 1.4, shadow: C_SKIN_SH, shadowOffset: [-1, -1.4] });

  // --- chilli necklace (sways)
  const nsw = -sw * 0.5;
  line(ctx, [[-6.6, -13.2], [0.4 + nsw, -8.6], [7, -13.2]], 0.7, INK, true);
  const pods: [number, number][] = [[-5, -11.6], [-2.4, -9.6], [0.6, -8.8], [3.6, -9.8], [6, -11.8]];
  pods.forEach(([x, y], i) => chilli(ctx, x + nsw * (1 - Math.abs(x) / 8), y, 4.6, 0.25 - i * 0.12 + nsw * 0.1, 1.9));

  // --- head
  shape(ctx, (c) => ellipsePath(c, hx - 11, hy + 1.6, 2.4, 3.2), { fill: C_SKIN, ink: 1.5, shadow: C_SKIN_SH, shadowOffset: [-0.8, -0.8] });
  // big gold hoop (swings a little)
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, hx - 11.6 - sw * 0.3, hy + 7.6, 2.7, 3.2, 0.1);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.restore();
  shape(ctx, (c) => circlePath(c, hx, hy, 11.4), { fill: C_SKIN, shadow: C_SKIN_SH, shadowOffset: [-2.5, -2.1], gloss: [{ x: hx - 5, y: hy - 4, rx: 3.4, ry: 2, rot: -0.5, alpha: 0.35 }] });
  // red headscarf with the knot on top
  const scarf = (c: Ctx) => {
    smoothPath(c, [[hx - 11.4, hy - 2], [hx - 10.6, hy - 8.4], [hx - 4.6, hy - 12.8], [hx + 4, hy - 12.8], [hx + 10.4, hy - 8.4], [hx + 11.8, hy - 2.6], [hx + 7.6, hy - 5.6], [hx + 0.6, hy - 6.8], [hx - 6.6, hy - 5.4]], true, 0.5);
  };
  // front curls escaping
  group(ctx, [{ build: (c) => { circlePath(c, hx - 7.6, hy - 5, 2.6); circlePath(c, hx - 3.4, hy - 6.2, 2.4); circlePath(c, hx + 9.4, hy - 4.6, 2.2); }, style: { fill: C_HAIR, shadow: C_HAIR_SH, shadowOffset: [-0.8, -0.8], gloss: [{ x: hx - 8.4, y: hy - 6, rx: 1, ry: 0.5, rot: -0.5, alpha: 0.35 }, { x: hx - 4.2, y: hy - 7.2, rx: 0.9, ry: 0.45, rot: -0.5, alpha: 0.35 }] } }], 1.3);
  shape(ctx, scarf, { fill: C_SCARF, shadow: C_SCARF_SH, shadowOffset: [-1.8, -1.8], gloss: [{ x: hx - 3, y: hy - 10.6, rx: 3.6, ry: 1.1, rot: -0.15, alpha: 0.45 }] });
  clipped(ctx, scarf, () => speckle(ctx, hx, hy - 8, 12, 5, 12, '#fff4ea', 0.55, 13, 0.95));
  // knot ears
  const kx = hx + 5, ky = hy - 12.6;
  shape(ctx, (c) => {
    c.moveTo(kx, ky + 1);
    c.quadraticCurveTo(kx - 6.4, ky - 3.4 + sw * 0.3, kx - 4.6, ky - 7.4);
    c.quadraticCurveTo(kx - 1.6, ky - 4, kx, ky + 1);
    c.moveTo(kx, ky + 1);
    c.quadraticCurveTo(kx + 6, ky - 2.2 - sw * 0.3, kx + 6.6, ky - 6.8);
    c.quadraticCurveTo(kx + 2, ky - 4.4, kx, ky + 1);
  }, { fill: C_SCARF, ink: 1.4, shadow: C_SCARF_SH, shadowOffset: [-1, -1] });
  ball(ctx, kx, ky, 2, C_SCARF, C_SCARF_SH, 1.3, 0.4);
  // fierce face
  blush(ctx, [[hx - 4.6, hy + 4.4, 2.6, 1.5], [hx + 9.4, hy + 4.2, 2, 1.4]], '#e8534f', 0.35);
  almondEye(ctx, hx - 1.8, hy - 0.2, 5.8, 3, -1, { iris: '#6a3418', look: [0.5, 0.12], upIn: 0.5, upOut: 0.98 });
  almondEye(ctx, hx + 6.9, hy - 0.4, 5.8, 3, 1, { iris: '#6a3418', look: [0.5, 0.12], upIn: 0.5, upOut: 0.98 });
  brow(ctx, hx - 2, hy - 5, 5.8, 0.34, 1.8, C_HAIR);
  brow(ctx, hx + 7.4, hy - 5.2, 5.8, -0.34, 1.8, C_HAIR);
  shape(ctx, (c) => ellipsePath(c, hx + 3.2, hy + 3, 2.2, 1.8), { fill: '#e09c76', ink: 1.1, shadow: 'none', gloss: [{ x: hx + 2.6, y: hy + 2.4, rx: 0.7, ry: 0.5, alpha: 0.7 }] });
  // fiery open grin with red lips
  shape(ctx, (c) => {
    c.moveTo(hx - 0.6, hy + 6.4);
    c.quadraticCurveTo(hx + 3.4, hy + 7.6, hx + 7.6, hy + 5.8);
    c.quadraticCurveTo(hx + 4.6, hy + 11.6, hx - 0.6, hy + 6.4);
    c.closePath();
  }, { fill: '#b01e34', ink: 1.2, shadow: 'none' });
  shape(ctx, (c) => {
    c.moveTo(hx + 0.4, hy + 7.2);
    c.quadraticCurveTo(hx + 3.6, hy + 8.1, hx + 6.6, hy + 6.8);
    c.lineTo(hx + 6, hy + 8);
    c.quadraticCurveTo(hx + 3.4, hy + 8.9, hx + 1, hy + 8);
    c.closePath();
  }, { fill: '#fff8ea', ink: 0, shadow: 'none' });
  ctx.fillStyle = INK;
  ctx.beginPath();
  circlePath(ctx, hx + 9.2, hy + 7, 0.55);
  ctx.fill();

  // --- near arm brandishing a big chilli
  const hxr = 16.4 + sw * 1.6, hyr = -2.4 - Math.abs(sw) * 0.6;
  inkLine(ctx, [[11.4, -10.4], [15.6 + sw * 0.6, -6], [hxr, hyr]], 3.8, C_SKIN, true, 1.4);
  shape(ctx, (c) => ellipsePath(c, 11.8, -10.6, 3.6, 2.8, 0.3), { fill: C_DRESS, ink: 1.4, shadow: C_DRESS_SH, shadowOffset: [-1, -1] });
  clipped(ctx, (c) => ellipsePath(c, 11.8, -10.6, 3.6, 2.8, 0.3), () => {
    ctx.fillStyle = '#fff4ea';
    ctx.beginPath();
    circlePath(ctx, 11, -11.4, 0.9);
    circlePath(ctx, 13.6, -9.6, 0.9);
    ctx.fill();
  });
  bigChilli(ctx, hxr - 0.4, hyr + 3.6, 15.5, Math.PI + 0.22 + sw * 0.08, 4.6);
  ball(ctx, hxr, hyr, 2.6, C_SKIN, C_SKIN_SH);
  // hand on hip (drawn over the dress)
  ball(ctx, -13.4, 1.4, 2.6, C_SKIN, C_SKIN_SH);
}

// ---------------------------------------------------------------------------
// MICIO — the trattoria's orange tabby, mini toque, red neckerchief, swishing tail.
// ---------------------------------------------------------------------------
const M_FUR = '#f39a3d', M_FUR_SH = '#cc6a26', M_STRIPE = '#c25a1c';
const M_CREAM = '#fbe8c8', M_CREAM_SH = '#e2c49a';

function drawMicio(ctx: Ctx, f: number) {
  const ph = (f / 4) * TAU;
  const sw = Math.sin(ph);
  const cw = Math.cos(ph);
  const hx = 1.5, hy = -13;

  // --- tail (swishes with the walk)
  const tw = sw * 2.4, tw2 = cw * 1.6;
  const tail: Pt[] = [[-5, 5], [-12, 4.4], [-16.6, -0.6], [-17.4 + tw * 0.5, -7.4], [-15 + tw, -13 + tw2 * 0.4], [-11.4 + tw * 1.1, -14.4 + tw2 * 0.6]];
  const tailPath = (c: Ctx) => smoothPath(c, ribbon(tail, [5, 5, 4.8, 4.6, 4.2, 2.8]), true);
  shape(ctx, tailPath, { fill: M_FUR, shadow: M_FUR_SH, shadowOffset: [-1.4, -1.4] });
  clipped(ctx, tailPath, () => {
    for (let i = 1; i < tail.length - 1; i++) {
      const [x, y] = tail[i];
      const [nx, ny] = tail[i + 1];
      const a = Math.atan2(ny - y, nx - x) + Math.PI / 2;
      line(ctx, [[x + Math.cos(a) * 4, y + Math.sin(a) * 4], [x - Math.cos(a) * 4, y - Math.sin(a) * 4]], 1.3, M_STRIPE, false, 0.9);
    }
  });

  // --- far arm (paw)
  inkLine(ctx, [[-5, -3], [-8.6 - sw * 1, 0], [-9 - sw * 2.4, 3.6]], 3.8, M_FUR, true, 1.3);
  ball(ctx, -9 - sw * 2.4, 4.4, 2.3, M_CREAM, M_CREAM_SH, 1.3);

  // --- stubby legs with cream paws
  legs(ctx, 0, 5, f, { len: 7.4, spread: 7.4, thick: 4.6, color: M_FUR, shoe: M_CREAM, stride: 3.8 });

  // --- body (little pear) + cream belly + stripes
  const body = (c: Ctx) => {
    c.moveTo(-5, -5.6);
    c.quadraticCurveTo(-9.6, -3, -9.4, 4);
    c.quadraticCurveTo(-8.6, 9.4, 0, 9.4);
    c.quadraticCurveTo(8.6, 9.4, 9.4, 4);
    c.quadraticCurveTo(9.6, -3, 5, -5.6);
    c.closePath();
  };
  shape(ctx, body, { fill: M_FUR, shadow: M_FUR_SH, shadowOffset: [-2, -1.6] });
  shape(ctx, (c) => ellipsePath(c, 1, 3, 5.2, 5.4), { fill: M_CREAM, ink: 0, shadow: M_CREAM_SH, shadowOffset: [-1.2, -1] });
  line(ctx, [[-9, 0], [-6.6, 0.6]], 1.1, M_STRIPE, false, 0.9);
  line(ctx, [[-9.2, 3.6], [-6.8, 3.8]], 1.1, M_STRIPE, false, 0.9);
  line(ctx, [[9.2, 1], [7.2, 1.4]], 1.1, M_STRIPE, false, 0.9);

  // --- red neckerchief
  shape(ctx, (c) => {
    c.moveTo(-6.4, -6.6);
    c.quadraticCurveTo(1, -3.6, 8, -6.8);
    c.quadraticCurveTo(5, -2.2, 1.6, 1.8);
    c.quadraticCurveTo(-2.6, -2.4, -6.4, -6.6);
    c.closePath();
  }, { fill: RED, ink: 1.4, shadowOffset: [-1.1, -1.1], gloss: [{ x: -1, y: -5, rx: 1.8, ry: 0.7, alpha: 0.45 }] });

  // --- near paw holding a basil sprig out to the side
  const pxr = 11.4 + sw * 1.6, pyr = 4.4;
  inkLine(ctx, [[pxr - 0.8, pyr + 1.4], [pxr + 3.4, pyr - 2.8], [pxr + 5.8, pyr - 6.6]], 0.9, '#3c7a2e', true, 0.7);
  for (const [lx2, ly2, rot, sz] of [[pxr + 5.8, pyr - 6.6, -1, 1.15], [pxr + 3.2, pyr - 3, -2.5, 1], [pxr + 3.6, pyr - 2.4, 0.3, 1], [pxr + 5.6, pyr - 6.4, 0.2, 0.8]] as [number, number, number, number][]) {
    shape(ctx, (c) => {
      c.save();
      c.translate(lx2, ly2);
      c.rotate(rot);
      c.scale(sz, sz);
      c.moveTo(0, 0);
      c.quadraticCurveTo(1.8, -2.2, 4.6, 0);
      c.quadraticCurveTo(1.8, 2.2, 0, 0);
      c.closePath();
      c.restore();
    }, { fill: '#52b34c', ink: 0.9, shadow: '#2f7d33', shadowOffset: [-0.5, -0.6] });
  }
  inkLine(ctx, [[5, -3.4], [9 + sw, -0.4], [pxr, pyr]], 3.8, M_FUR, true, 1.3);
  ball(ctx, pxr, pyr + 0.6, 2.4, M_CREAM, M_CREAM_SH, 1.3);

  // --- head: ears, fluffy cheeks
  for (const [b1, tip, b2] of [
    [[hx - 12.2, hy - 3.6], [hx - 10.6, hy - 17.4], [hx - 3.4, hy - 9.6]],
    [[hx + 4.8, hy - 9.8], [hx + 12, hy - 16.8], [hx + 13.2, hy - 3.4]],
  ] as Pt[][]) {
    shape(ctx, (c) => {
      c.moveTo(b1[0], b1[1]);
      c.quadraticCurveTo(tip[0] - 1, tip[1] + 1, tip[0], tip[1]);
      c.quadraticCurveTo(tip[0] + 1, tip[1] + 1.4, b2[0], b2[1]);
      c.closePath();
    }, { fill: M_FUR, shadow: M_FUR_SH, shadowOffset: [-1.2, -1.2] });
    const ix = (b1[0] + b2[0]) / 2, iy = (b1[1] + b2[1]) / 2;
    shape(ctx, (c) => {
      c.moveTo(ix + (b1[0] - ix) * 0.55, iy + (b1[1] - iy) * 0.55 + 0.6);
      c.lineTo(tip[0] + (ix - tip[0]) * 0.22, tip[1] + (iy - tip[1]) * 0.22);
      c.lineTo(ix + (b2[0] - ix) * 0.55, iy + (b2[1] - iy) * 0.55 + 0.6);
      c.closePath();
    }, { fill: '#f6a7a6', ink: 0, shadow: 'none' });
  }
  const headPts: Pt[] = [
    [hx, hy - 11.2], [hx + 8.6, hy - 9.6], [hx + 12.6, hy - 3.4], [hx + 14.8, hy + 1.6], [hx + 12.4, hy + 3.2], [hx + 14, hy + 5.6],
    [hx + 9.6, hy + 9.4], [hx, hy + 11], [hx - 9.4, hy + 9.4], [hx - 13.6, hy + 5.6], [hx - 12, hy + 3.2], [hx - 14.4, hy + 1.4],
    [hx - 12.4, hy - 3.6], [hx - 8.6, hy - 9.6],
  ];
  const head = (c: Ctx) => smoothPath(c, headPts, true, 0.42);
  shape(ctx, head, { fill: M_FUR, shadow: M_FUR_SH, shadowOffset: [-2.4, -2], gloss: [{ x: hx - 5, y: hy - 6.4, rx: 3.6, ry: 1.8, rot: -0.4, alpha: 0.4 }] });
  // tabby stripes
  clipped(ctx, head, () => {
    for (const dx of [-3, 0.6, 4.2]) line(ctx, [[hx + dx, hy - 11.6], [hx + dx * 0.8 + 0.2, hy - 7.2]], 1.4, M_STRIPE, false, 0.95);
    line(ctx, [[hx - 15, hy + 0.4], [hx - 11.4, hy + 1]], 1.2, M_STRIPE, false, 0.9);
    line(ctx, [[hx - 14.6, hy + 3.4], [hx - 11.8, hy + 3.4]], 1.2, M_STRIPE, false, 0.9);
    line(ctx, [[hx + 15, hy + 0.6], [hx + 12.4, hy + 1]], 1.2, M_STRIPE, false, 0.9);
  });
  // muzzle
  group(ctx, [{ build: (c) => { ellipsePath(c, hx + 0.4, hy + 5.6, 3.4, 2.7); ellipsePath(c, hx + 5, hy + 5.6, 3.4, 2.7); ellipsePath(c, hx + 2.7, hy + 7.6, 2.4, 1.8); }, style: { fill: M_CREAM, shadow: M_CREAM_SH, shadowOffset: [-0.8, -0.9] } }], 1.1);
  // big eyes
  eye(ctx, hx - 3.4, hy - 0.4, 4, { look: [0.26, 0.14], pupil: 0.56, iris: '#86c64a', ink: 1.1 });
  eye(ctx, hx + 6.6, hy - 0.6, 4, { look: [0.26, 0.14], pupil: 0.56, iris: '#86c64a', ink: 1.1 });
  glint(ctx, hx - 1.8, hy + 1.4, 0.7, 0.7, 0, 0.9);
  glint(ctx, hx + 8.2, hy + 1.2, 0.7, 0.7, 0, 0.9);
  // nose + mouth
  shape(ctx, (c) => {
    c.moveTo(hx + 1.2, hy + 3.4);
    c.lineTo(hx + 4.4, hy + 3.4);
    c.quadraticCurveTo(hx + 3.4, hy + 5.6, hx + 2.8, hy + 5.6);
    c.quadraticCurveTo(hx + 2.2, hy + 5.6, hx + 1.2, hy + 3.4);
    c.closePath();
  }, { fill: '#f07c8c', ink: 1, shadow: 'none', gloss: [{ x: hx + 2.4, y: hy + 3.9, rx: 0.7, ry: 0.35, alpha: 0.8 }] });
  line(ctx, [[hx + 0.4, hy + 6.6], [hx + 1.6, hy + 7.4], [hx + 2.8, hy + 5.8], [hx + 4, hy + 7.4], [hx + 5.2, hy + 6.6]], 0.9, INK, true);
  // whiskers
  for (const s of [-1, 1]) {
    const bx = s < 0 ? hx - 1.6 : hx + 7;
    for (let i = 0; i < 3; i++) line(ctx, [[bx, hy + 5.6 + i * 0.9], [bx + s * 7, hy + 4.4 + i * 1.8]], 0.45, INK, false, 0.65);
  }
  blush(ctx, [[hx - 5.6, hy + 4.6, 2, 1.2], [hx + 10, hy + 4.4, 1.8, 1.1]], '#f0707c', 0.45);

  // --- mini toque between the ears
  toque(ctx, hx + 0.6, hy - 9.6, 0.5, -0.12);

}

register('nonna', drawNonna);
register('peppe', drawPeppe);
register('sofia', drawSofia);
register('tommaso', drawTommaso);
register('concetta', drawConcetta);
register('micio', drawMicio);

