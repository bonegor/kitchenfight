/**
 * BOSS — IL MICROONDE MALEDETTO (The Cursed Microwave). Radius 56.
 *
 * A hulking retro radioactive-avocado microwave in 3/4 view on stubby chrome legs. The LED display
 * glares with two angry 7-segment eyes; the window is a fanged mouth glowing orange,
 * and inside a sad plate of rubbery pasta really spins on the turntable (its face turns
 * away and back over the 4 frames). A desk-bell "DING" antenna wobbles on top, oven
 * mitts for hands, and the power cord whips behind like a tail, sparking at the plug.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, line, ellipsePath, circlePath, roundRectPath, polyPath, speckle, rgba,
} from '../painter';
import {
  OUT, OUT_IN, OUT_S, TAU, phase, S, clipTo, fillPath, strokePath, sparkle, limb, softGlow, pivot, rings, burstLines,
  stompLegs, steamWisp, ball,
} from './bosses_b_kit';

export const MICROONDE_R = 56;
const W = 204, H = 194, AX = 102, AY = 128;

const CASE = '#9fc43a';
const CASE_SH = '#628c22';
const CASE_DK = '#466a18';
const CASE_HI = '#d6f08a';
const PANEL = '#ece5d2';
const PANEL_SH = '#c9bfa6';
const CHROME = '#dfe6ee';
const CHROME_SH = '#98a4b6';
const GLASS = '#1c1519';
const LED = '#ff3b24';
const GLOW = '#ff9a2a';
const GLOW_HI = '#ffe08a';
const FANG = '#fff6e0';

// front face + depth (box seen from the front-right and above)
const FX0 = -44, FX1 = 56, FY0 = -54, FY1 = 34;
const DX = -17, DY = -13;

interface Pose {
  f: number;
  lean: number;
  crouch: number;
  eyes: 'angry' | 'slit' | 'wide';
  mouth: number; // 0 = fangs clenched shut, 1 = normal, 2 = gaping
  heat: number; // 0..1 inner glow intensity boost
  mitts: 'down' | 'up' | 'wide';
  ding: boolean;
  shake: boolean;
}

// ---------------------------------------------------------------------------
// parts
// ---------------------------------------------------------------------------

/** 7-segment style bar from a to b. */
function seg(ctx: Ctx, a: Pt, b: Pt, w: number, color: string, alpha = 1) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const h = w / 2;
  fillPath(ctx, (c) => polyPath(c, [
    [a[0], a[1]],
    [a[0] + ux * h + nx * h, a[1] + uy * h + ny * h],
    [b[0] - ux * h + nx * h, b[1] - uy * h + ny * h],
    [b[0], b[1]],
    [b[0] - ux * h - nx * h, b[1] - uy * h - ny * h],
    [a[0] + ux * h - nx * h, a[1] + uy * h - ny * h],
  ]), color, alpha);
}

/** LED display with segment eyes. */
function display(ctx: Ctx, p: Pose) {
  const x0 = -36, x1 = 48, y0 = -48, y1 = -26;
  const glass = (c: Ctx) => roundRectPath(c, x0, y0, x1 - x0, y1 - y0, 5);
  S(ctx, (c) => roundRectPath(c, x0 - 3, y0 - 3, x1 - x0 + 6, y1 - y0 + 6, 7), { fill: CHROME, ink: OUT_IN, shadow: CHROME_SH, shadowOffset: [-1.6, -1.6] });
  shape(ctx, glass, { fill: GLASS, ink: OUT_S, shadow: 'none' });
  clipTo(ctx, glass, () => {
    // unlit ghost segments (like a real LED panel)
    for (let i = 0; i < 9; i++) {
      const gx = x0 + 6 + i * 9.5;
      seg(ctx, [gx, y0 + 5], [gx + 5, y0 + 5], 1.6, '#3a1c1c', 0.9);
      seg(ctx, [gx, y1 - 5], [gx + 5, y1 - 5], 1.6, '#3a1c1c', 0.9);
    }
    softGlow(ctx, (x0 + x1) / 2, (y0 + y1) / 2, 46, LED, 0.32, 14);
    const cy = (y0 + y1) / 2 + 1;
    for (const s of [-1, 1]) {
      const ex = 6 + s * 20; // eye centre
      const inner = -s; // inner side points to the middle
      const w = 3;
      if (p.eyes === 'slit') {
        seg(ctx, [ex - 9, cy - 2 + (inner < 0 ? 3 : -3)], [ex + 9, cy - 2 + (inner < 0 ? -3 : 3)], w + 0.6, LED);
        seg(ctx, [ex - 7, cy + 4], [ex + 7, cy + 4], w, LED);
      } else if (p.eyes === 'wide') {
        // full "0" rings with a dot pupil — shocked DING eyes
        seg(ctx, [ex - 6, cy - 7], [ex + 6, cy - 7], w, '#ffd23a');
        seg(ctx, [ex - 6, cy + 7], [ex + 6, cy + 7], w, '#ffd23a');
        seg(ctx, [ex - 8, cy - 5.5], [ex - 8, cy + 5.5], w, '#ffd23a');
        seg(ctx, [ex + 8, cy - 5.5], [ex + 8, cy + 5.5], w, '#ffd23a');
        fillPath(ctx, (c) => roundRectPath(c, ex - 2, cy - 2, 4, 4, 1), '#ffd23a');
      } else {
        // angry: slanted brow segment, U-shaped lower lid, square pupil
        const hi = cy - 7, lo = cy - 1.5;
        seg(ctx, [ex - 9, inner > 0 ? hi : lo], [ex + 9, inner > 0 ? lo : hi], w + 0.4, LED);
        seg(ctx, [ex - 9, cy + 1], [ex - 9, cy + 5], w, LED);
        seg(ctx, [ex + 9, cy + 1], [ex + 9, cy + 5], w, LED);
        seg(ctx, [ex - 7, cy + 7.5], [ex + 7, cy + 7.5], w, LED);
        fillPath(ctx, (c) => roundRectPath(c, ex - 2.6 + inner * 1.2, cy + 0.6, 5.2, 4.4, 1), '#ffb07a');
      }
    }
    // blinking colon in the middle (it's a clock, after all)
    if (p.f % 2 === 0 || p.eyes === 'slit') {
      fillPath(ctx, (c) => { c.rect(4.6, cy - 4, 2.6, 2.6); c.rect(4.6, cy + 2, 2.6, 2.6); }, p.eyes === 'wide' ? '#ffd23a' : LED);
    }
    // glass reflection
    fillPath(ctx, (c) => polyPath(c, [[x0 + 4, y1], [x0 + 18, y0], [x0 + 26, y0], [x0 + 12, y1]]), '#ffffff', 0.12);
  });
}

/** The sad pasta on the turntable; ang = rotation (0 = facing us). */
function sadPasta(ctx: Ctx, x: number, y: number, ang: number, f: number) {
  const ph = phase(f);
  // turntable glass tray + rotating markers
  fillPath(ctx, (c) => ellipsePath(c, x, y + 6, 25, 6.5), 'rgba(255,240,200,0.35)');
  strokePath(ctx, (c) => ellipsePath(c, x, y + 6, 25, 6.5), '#7a3a10', 1.4, 0.7);
  for (let i = 0; i < 3; i++) {
    const a = ang + (i / 3) * TAU;
    const mx = x + Math.sin(a) * 21, my = y + 6 + Math.cos(a) * 5.4;
    if (Math.cos(a) > -0.2) fillPath(ctx, (c) => ellipsePath(c, mx, my, 2.2 * (0.4 + 0.6 * Math.abs(Math.cos(a))), 1.2), '#7a3a10', 0.6);
  }
  // plate
  S(ctx, (c) => ellipsePath(c, x, y + 3.5, 19, 5.2), { fill: '#fff8ec', ink: 1.6, shadow: '#e4cfb2', shadowOffset: [-1.5, -1] });
  strokePath(ctx, (c) => ellipsePath(c, x, y + 3.2, 14, 3.5), '#e9b46a', 0.9, 0.9, [2.5, 2.2]);
  // the pasta mound (rubbery, overcooked)
  const mound = (c: Ctx) => {
    c.moveTo(x - 15, y + 3);
    c.bezierCurveTo(x - 16, y - 8, x - 7, y - 14, x, y - 13);
    c.bezierCurveTo(x + 8, y - 14, x + 16, y - 8, x + 15, y + 3);
    c.quadraticCurveTo(x, y + 6, x - 15, y + 3);
    c.closePath();
  };
  S(ctx, mound, { fill: '#ffe08a', ink: 1.6, shadow: '#e9a83c', shadowOffset: [-2, -1.5] });
  clipTo(ctx, mound, () => {
    for (let i = 0; i < 6; i++) {
      const yy = y - 11 + i * 2.6;
      const off = ang * 6;
      const pts: Pt[] = [];
      for (let k = 0; k <= 5; k++) pts.push([x - 16 + k * 6.4, yy + Math.sin(k * 1.7 + i * 1.3 + off) * 1.5]);
      line(ctx, pts, 0.9, '#e2a246', true, 0.8);
    }
    // a sad dollop of sauce rotating with the plate
    const sx = x + Math.sin(ang + 0.6) * 7;
    if (Math.cos(ang + 0.6) > -0.3) fillPath(ctx, (c) => ellipsePath(c, sx, y - 10, 5 * (0.5 + 0.5 * Math.abs(Math.cos(ang + 0.6))), 2.6), '#e0442a', 0.9);
  });
  // the sad face turns with the turntable
  const fc = Math.cos(ang), fs = Math.sin(ang);
  if (fc > 0.05) {
    const fx = x + fs * 8, fy = y - 4;
    const k = fc;
    for (const s of [-1, 1]) {
      const ex = fx + s * 3.6 * k;
      fillPath(ctx, (c) => ellipsePath(c, ex, fy, 1.5 * k + 0.3, 1.9), INK);
      fillPath(ctx, (c) => circlePath(c, ex - 0.4 * k, fy - 0.6, 0.5), '#ffffff');
      // sad brows
      line(ctx, [[ex - s * 2 * k, fy - 3.2], [ex + s * 1.6 * k, fy - 4.4]], 0.9, INK);
    }
    // wobbly frown
    line(ctx, [[fx - 2.8 * k, fy + 4.2], [fx, fy + 3], [fx + 2.8 * k, fy + 4.2]], 1, INK, true);
    // tear
    fillPath(ctx, (c) => ellipsePath(c, fx + 4.4 * k, fy + 2.5 + (f % 2) * 1.2, 0.9, 1.4), '#7ad0ff');
  }
  // fork stuck in the pasta, rotating with it
  const fa = ang + 2.2;
  const fkx = x + Math.sin(fa) * 7, fky = y - 9 + Math.cos(fa) * 1.5;
  const lean = Math.sin(fa) * 0.5;
  ctx.save();
  ctx.translate(fkx, fky);
  ctx.rotate(lean);
  if (Math.cos(fa) < 0.2) {
    line(ctx, [[0, 0], [0, -11]], 2.6, INK);
    line(ctx, [[0, 0], [0, -11]], 1.2, CHROME);
    for (const tx of [-1.6, 0, 1.6]) line(ctx, [[tx, -10.5], [tx, -15]], 1, INK);
  }
  ctx.restore();
  // limp steam
  steamWisp(ctx, x - 4, y - 14, 10, ph, 3.4, 0.6, '#fff4dc');
}

/** Window = fanged mouth; open: 0 clenched, 1 normal, 2 gaping. */
function windowMouth(ctx: Ctx, p: Pose) {
  const f = p.f;
  const ph = phase(f);
  const gape = p.mouth === 2 ? 12 : 0;
  const wx0 = -34, wx1 = 16, wy0 = -16, wy1 = 26 + gape;
  // door frame
  S(ctx, (c) => roundRectPath(c, wx0 - 8, wy0 - 7, wx1 - wx0 + 16, wy1 - wy0 + 14, 9), { fill: '#3a4250', ink: OUT_IN, shadow: '#262c36', shadowOffset: [-2.4, -2.4], gloss: [{ x: wx0 - 3, y: wy0 + 4, rx: 1.2, ry: 8, alpha: 0.3 }] });
  const win = (c: Ctx) => roundRectPath(c, wx0, wy0, wx1 - wx0, wy1 - wy0, 7);
  const heat = p.heat;
  clipTo(ctx, win, () => {
    const cx = (wx0 + wx1) / 2, cy = (wy0 + wy1) / 2;
    const g = ctx.createRadialGradient(cx, cy + 4, 2, cx, cy, 34);
    g.addColorStop(0, heat > 0.5 ? '#ffffff' : GLOW_HI);
    g.addColorStop(0.45, heat > 0.5 ? '#ffe46a' : GLOW);
    g.addColorStop(1, heat > 0.5 ? '#ff5a12' : '#c2410f');
    ctx.fillStyle = g;
    ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    // cavity back wall lines (perspective)
    line(ctx, [[wx0, wy0], [wx0 + 7, wy0 + 6], [wx1 - 7, wy0 + 6], [wx1, wy0]], 1.2, '#b8460f', false, 0.5);
    line(ctx, [[wx0 + 7, wy0 + 6], [wx0 + 7, wy1 - 9]], 1.2, '#b8460f', false, 0.4);
    // turntable rotation: 90° per frame
    sadPasta(ctx, cx - 1, cy + 7, (f % 4) * (Math.PI / 2), f);
    // hot wobble lines
    for (let i = 0; i < 3; i++) {
      const yy = wy0 + 9 + i * 7;
      const pts: Pt[] = [];
      for (let k = 0; k <= 6; k++) pts.push([wx0 + 3 + k * 7.5, yy + Math.sin(k * 1.6 + ph + i) * 1.2]);
      line(ctx, pts, 1, '#ffffff', true, 0.18 + heat * 0.2);
    }
  });
  // FANGS: top row hangs down, bottom row points up
  const open = p.mouth;
  const topLen = open === 0 ? 18.5 : open === 2 ? 9 : 10.5;
  const botLen = open === 0 ? 18.5 : open === 2 ? 8 : 8.5;
  const nT = 6, nB = 5;
  clipTo(ctx, win, () => {
    for (let i = 0; i < nT; i++) {
      const tw = (wx1 - wx0) / nT;
      const tx = wx0 + i * tw;
      const len = topLen * (i === 1 || i === 4 ? 1.25 : 1);
      shape(ctx, (c) => {
        c.moveTo(tx - 0.5, wy0 - 2);
        c.lineTo(tx + tw + 0.5, wy0 - 2);
        c.quadraticCurveTo(tx + tw * 0.62, wy0 + len * 0.6, tx + tw * 0.5, wy0 + len);
        c.quadraticCurveTo(tx + tw * 0.38, wy0 + len * 0.6, tx - 0.5, wy0 - 2);
        c.closePath();
      }, { fill: FANG, ink: 1.3, shadow: '#e2cfa4', shadowOffset: [-1, -0.6] });
    }
    for (let i = 0; i < nB; i++) {
      const tw = (wx1 - wx0) / nB;
      const tx = wx0 + i * tw;
      const len = botLen * (i === 0 || i === nB - 1 ? 1.2 : 1);
      shape(ctx, (c) => {
        c.moveTo(tx - 0.5, wy1 + 2);
        c.lineTo(tx + tw + 0.5, wy1 + 2);
        c.quadraticCurveTo(tx + tw * 0.62, wy1 - len * 0.6, tx + tw * 0.5, wy1 - len);
        c.quadraticCurveTo(tx + tw * 0.38, wy1 - len * 0.6, tx - 0.5, wy1 + 2);
        c.closePath();
      }, { fill: FANG, ink: 1.3, shadow: '#e2cfa4', shadowOffset: [-1, -0.6] });
    }
    // grime + mesh dots on the glass
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#000000';
    for (let yy = wy0 + 2; yy < wy1; yy += 3.2) for (let xx = wx0 + 2; xx < wx1; xx += 3.2) ctx.fillRect(xx, yy, 0.9, 0.9);
    ctx.restore();
    // a crack in the glass (cursed!)
    line(ctx, [[wx1 - 4, wy0 + 3], [wx1 - 9, wy0 + 9], [wx1 - 7, wy0 + 13], [wx1 - 13, wy0 + 19]], 0.9, '#ffffff', false, 0.75);
    line(ctx, [[wx1 - 9, wy0 + 9], [wx1 - 3, wy0 + 12]], 0.8, '#ffffff', false, 0.6);
    // glass glare
    fillPath(ctx, (c) => polyPath(c, [[wx0, wy0 + 14], [wx0 + 14, wy0], [wx0 + 21, wy0], [wx0, wy0 + 21]]), '#ffffff', 0.2);
  });
  ctx.save();
  ctx.beginPath();
  win(ctx);
  ctx.lineWidth = OUT_S * 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
  // light spilling out of the window
  softGlow(ctx, (wx0 + wx1) / 2, (wy0 + wy1) / 2, 40 + heat * 16, GLOW, 0.28 + heat * 0.25, 30 + heat * 10);
  // door handle bar
  S(ctx, (c) => roundRectPath(c, wx1 + 9, wy0 - 3, 5.5, wy1 - wy0 + 6, 2.7), { fill: CHROME, ink: OUT_S + 0.3, shadow: CHROME_SH, shadowOffset: [-1.2, -1], gloss: [{ x: wx1 + 10.5, y: wy0 + 4, rx: 0.8, ry: 6, alpha: 0.9 }] });
}

function keypad(ctx: Ctx, p: Pose) {
  const x0 = 33, y0 = -16;
  S(ctx, (c) => roundRectPath(c, x0 - 2, y0 - 3, 23, 49, 4), { fill: PANEL, ink: OUT_S + 0.3, shadow: PANEL_SH, shadowOffset: [-1.6, -1.6] });
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 2; k++) {
      const bx = x0 + 2 + k * 9.5, by = y0 + 1 + r * 8;
      const lit = (r * 2 + k + p.f) % 5 === 0;
      S(ctx, (c) => roundRectPath(c, bx, by, 7, 5.6, 1.6), { fill: lit ? '#ffcf6a' : '#fdfaf0', ink: 1.1, shadow: lit ? '#e09a2a' : '#cfc6b0', shadowOffset: [-0.8, -0.8] });
      if (lit) softGlow(ctx, bx + 3.5, by + 2.8, 6, '#ffb03a', 0.6);
    }
  }
  // big START dial
  const dx = x0 + 9.5, dy = y0 + 36;
  S(ctx, (c) => circlePath(c, dx, dy, 7), { fill: CHROME, ink: OUT_S + 0.3, shadow: CHROME_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: dx - 2.4, y: dy - 2.6, rx: 1.8, ry: 1.2, rot: -0.6, alpha: 0.9 }] });
  const a = -Math.PI / 2 + (p.f % 4) * 0.5 + (p.heat > 0 ? 1.4 : 0);
  line(ctx, [[dx, dy], [dx + Math.cos(a) * 5.5, dy + Math.sin(a) * 5.5]], 1.8, '#d8232f');
}

/** Desk "DING" bell on a spring antenna rooted at (x,y). */
function dingAntenna(ctx: Ctx, x: number, y: number, f: number, ding: boolean, shake: boolean) {
  const ph = phase(f);
  const sway = ding ? 0.4 : shake ? Math.sin(ph * 3) * 0.2 : Math.sin(ph) * 0.18;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  // spring
  const pts: Pt[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    pts.push([Math.sin(t * Math.PI * 8) * 3.2, -t * 30]);
  }
  line(ctx, pts, 3.6, INK, true);
  line(ctx, pts, 1.6, CHROME, true);
  // the desk bell
  ctx.translate(0, -30);
  S(ctx, (c) => roundRectPath(c, -10, -2, 20, 4.5, 1.8), { fill: '#3a3540', ink: OUT_S, shadow: 'none' });
  S(ctx, (c) => {
    c.moveTo(-8.5, -1.5);
    c.quadraticCurveTo(-8.5, -11, 0, -11.5);
    c.quadraticCurveTo(8.5, -11, 8.5, -1.5);
    c.closePath();
  }, { fill: '#ffcf4a', ink: OUT_S + 0.3, shadow: '#d08a14', shadowOffset: [-1.8, -1.4], gloss: [{ x: -3.6, y: -7.6, rx: 1.8, ry: 1.1, rot: -0.6, alpha: 0.9 }] });
  line(ctx, [[0, -11.5], [0, -14.5]], 2.6, INK);
  ball(ctx, 0, -15.5, 2.2, '#ffcf4a', 1.1);
  if (ding) {
    rings(ctx, 0, -7, 13, 6, 3, -2.6, -0.5, '#fff3b0', 2.4, 0.95);
    sparkle(ctx, 13, -18, 5, '#ffffff', 1);
    sparkle(ctx, -14, -16, 3.6, '#ffffff', 0.9);
  }
  ctx.restore();
}

/** Puffy gingham oven mitt; (x,y) = centre, rot = direction the mitt points. */
function ovenMitt(ctx: Ctx, x: number, y: number, rot: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  const mitt = (c: Ctx) => {
    c.moveTo(-9, 8);
    c.quadraticCurveTo(-11, -4, -6, -11);
    c.quadraticCurveTo(0, -16, 6, -11);
    c.quadraticCurveTo(10, -5, 9, 4);
    // thumb
    c.quadraticCurveTo(15, 0, 16, 5);
    c.quadraticCurveTo(15, 11, 8, 10);
    c.lineTo(8, 10);
    c.quadraticCurveTo(0, 13, -9, 8);
    c.closePath();
  };
  S(ctx, mitt, { fill: '#e8433a', ink: OUT_IN / s, shadow: '#a8242a', shadowOffset: [-2.4, -2.2] });
  clipTo(ctx, mitt, () => {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let gx = -12; gx < 18; gx += 6) ctx.fillRect(gx, -18, 3, 34);
    for (let gy = -18; gy < 16; gy += 6) ctx.fillRect(-12, gy, 30, 3);
    fillPath(ctx, (c) => ellipsePath(c, -3, -7, 3, 4.6, 0.3), '#ffffff', 0.35);
  });
  // quilted cuff
  S(ctx, (c) => roundRectPath(c, -10.5, 7, 20, 6.5, 2.6), { fill: '#fff4e0', ink: OUT_S / s + 0.2, shadow: '#e2cfa4', shadowOffset: [-1.2, -1] });
  ctx.restore();
}

/** Power cord tail with a sparking plug. */
function cordTail(ctx: Ctx, f: number, whip: number) {
  const ph = phase(f);
  const sw = Math.sin(ph) * 5 + whip * 8;
  const pts: Pt[] = [[-56, 22], [-72, 30], [-86, 22 + sw * 0.3], [-90, 6 + sw * 0.6], [-82, -6 + sw]];
  line(ctx, pts, 5 + OUT_IN * 2, INK, true);
  line(ctx, pts, 5, '#3a3540', true);
  line(ctx, pts.map(([x, y]) => [x - 0.8, y - 1] as Pt), 1.4, '#7a7488', true, 0.8);
  // plug
  const [px, py] = pts[pts.length - 1];
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-0.5 + sw * 0.03);
  S(ctx, (c) => roundRectPath(c, -5.5, -9, 11, 10, 2.6), { fill: '#3a3540', ink: OUT_S + 0.3, shadow: '#232028', shadowOffset: [-1.2, -1.2] });
  for (const tx of [-2.6, 2.6]) {
    line(ctx, [[tx, -9], [tx, -15]], 3.6, INK);
    line(ctx, [[tx, -9], [tx, -15]], 1.8, '#f2c94c');
  }
  ctx.restore();
  // sparks (they jump around every frame)
  const sp = [[-6, -20], [6, -18], [-2, -24], [7, -24]][((f % 4) + 4) % 4];
  sparkle(ctx, px + sp[0], py + sp[1], 5, '#fff07a', 1, 0.16);
  sparkle(ctx, px + sp[1] * 0.3, py + sp[0] - 10, 3, '#ffffff', 0.9, 0.16);
}

function rubberFoot(ctx: Ctx, x: number, y: number) {
  S(ctx, (c) => {
    c.moveTo(x - 9, y + 1);
    c.quadraticCurveTo(x - 9, y - 7, x, y - 7);
    c.quadraticCurveTo(x + 9, y - 7, x + 9, y + 1);
    c.closePath();
  }, { fill: '#3a3540', ink: OUT_IN, shadow: '#232028', shadowOffset: [-1.6, -1.6], gloss: [{ x: x - 3.6, y: y - 4.4, rx: 2.6, ry: 1.2, alpha: 0.4 }] });
}

// ---------------------------------------------------------------------------
// assembly
// ---------------------------------------------------------------------------

function drawMicroonde(ctx: Ctx, p: Pose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = MICROONDE_R;

  // back legs (peeking under the side panel) — a stubby 4-legged trot
  for (const [lx, side] of [[-50, 0], [34, 2]] as [number, number][]) {
    const pp = ph + side * Math.PI * 0.5 + Math.PI;
    const lift = Math.max(0, -Math.cos(pp)) * 4;
    const fx = lx + DX * 0.6 + Math.sin(pp) * 4;
    line(ctx, [[lx + DX * 0.6, 24], [fx, FOOT - 12 - lift]], 8 + OUT_IN * 2, INK);
    line(ctx, [[lx + DX * 0.6, 24], [fx, FOOT - 12 - lift]], 8, CHROME_SH);
    rubberFoot(ctx, fx, FOOT - 9 - lift);
  }
  // power cord tail
  cordTail(ctx, f, p.ding ? 1 : 0);

  // front legs
  stompLegs(ctx, 6, 30 + p.crouch, FOOT, f, {
    spread: 34, thick: 10, color: CHROME, shade: CHROME_SH, stride: 5, lift: 6,
    shoe: (x, y) => rubberFoot(ctx, x, y),
  });

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean);
  ctx.translate(0, p.crouch);
  if (p.shake) ctx.translate(Math.sin(ph * 5) * 1.2, 0);

  // ---- the box: side panel (left), top, front
  const side = (c: Ctx) => polyPath(c, [[FX0 + 4, FY0 + 4], [FX0 + DX, FY0 + DY + 6], [FX0 + DX, FY1 + DY - 2], [FX0 + 2, FY1 - 2]]);
  const top = (c: Ctx) => {
    c.moveTo(FX0 + 6, FY0);
    c.lineTo(FX0 + DX + 4, FY0 + DY);
    c.lineTo(FX1 + DX - 2, FY0 + DY);
    c.lineTo(FX1 - 4, FY0);
    c.closePath();
  };
  const front = (c: Ctx) => roundRectPath(c, FX0, FY0, FX1 - FX0, FY1 - FY0, 11);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = OUT * 2;
  for (const b of [side, top, front]) { ctx.beginPath(); b(ctx); ctx.stroke(); }
  ctx.restore();
  shape(ctx, side, { fill: CASE_SH, ink: 0, shadow: CASE_DK, shadowOffset: [3, -3] });
  shape(ctx, top, { fill: CASE_HI, ink: 0, shadow: 'none' });
  // side vents glowing
  for (let i = 0; i < 5; i++) {
    const vy = FY0 + 2 + i * 9;
    const vx0 = FX0 + DX + 4, vx1 = FX0 - 3;
    line(ctx, [[vx0, vy + 2], [vx1, vy + 6]], 3.6, '#23340e');
    line(ctx, [[vx0 + 1, vy + 2.2], [vx1 - 1, vy + 5.8]], 1.6, GLOW, false, 0.55 + p.heat * 0.4);
  }
  // rust spots on the side
  speckle(ctx, FX0 + DX * 0.5 - 2, FY1 - 18, 5, 8, 7, '#b0602a', 1.3, 13, 0.7);
  // top vents + steam
  for (let i = 0; i < 4; i++) {
    const tx = -18 + i * 9;
    line(ctx, [[tx + DX * 0.4, FY0 + DY * 0.5], [tx + 6 + DX * 0.4, FY0 + DY * 0.5]], 2.2, CASE_SH);
  }
  // front casing
  shape(ctx, front, {
    fill: CASE, ink: 0, shadow: CASE_SH, shadowOffset: [-8, -6],
    gloss: [{ x: FX0 + 10, y: FY0 + 18, rx: 3, ry: 14, rot: 0.05, alpha: 0.35 }, { x: FX0 + 30, y: FY0 + 7, rx: 16, ry: 2.4, rot: 0, alpha: 0.3 }],
  });
  // chrome trim line + dent
  line(ctx, [[FX0 + 8, FY1 - 6], [FX1 - 8, FY1 - 6]], 2.4, CASE_SH, false, 0.8);
  strokePath(ctx, (c) => ctx.arc(FX1 - 12, FY0 + 10, 4, 0.4, 2.8), CASE_DK, 1.2, 0.6);

  display(ctx, p);
  windowMouth(ctx, p);
  keypad(ctx, p);

  // ---- ghostly cursed wisps rising off the top
  for (let i = 0; i < 2; i++) {
    steamWisp(ctx, -24 + i * 30 + DX * 0.5, FY0 + DY + 2, 20 + i * 4, ph + i * 2, 6, 0.4 + p.heat * 0.3, i ? '#b8ffe8' : '#ffffff');
  }
  // ---- DING antenna on the top
  dingAntenna(ctx, 10 + DX * 0.5, FY0 + DY * 0.5, f, p.ding, p.shake);

  // ---- arms with oven mitts
  if (p.mitts === 'down') {
    limb(ctx, [[FX1 - 2, 4], [FX1 + 12, 12 + Math.sin(ph) * 2], [FX1 + 16, 22 + Math.sin(ph) * 2]], 9, CHROME, OUT_IN, CHROME_SH);
    ovenMitt(ctx, FX1 + 17, 26 + Math.sin(ph) * 2, -0.25 + Math.sin(ph) * 0.1);
    limb(ctx, [[FX0 + DX + 2, 6], [FX0 + DX - 10, 14 - Math.sin(ph) * 2], [FX0 + DX - 14, 24 - Math.sin(ph) * 2]], 9, CHROME, OUT_IN, CHROME_SH);
    ovenMitt(ctx, FX0 + DX - 15, 28 - Math.sin(ph) * 2, 0.35 - Math.sin(ph) * 0.1, 0.92);
  } else if (p.mitts === 'up') {
    limb(ctx, [[FX1 - 2, -4], [FX1 + 16, -10], [FX1 + 16, -30]], 9, CHROME, OUT_IN, CHROME_SH);
    ovenMitt(ctx, FX1 + 16, -34, -0.15);
    limb(ctx, [[FX0 + DX + 2, -2], [FX0 + DX - 14, -10], [FX0 + DX - 14, -30]], 9, CHROME, OUT_IN, CHROME_SH);
    ovenMitt(ctx, FX0 + DX - 14, -34, 0.2, 0.92);
  } else {
    limb(ctx, [[FX1 - 2, -2], [FX1 + 18, -12], [FX1 + 24, -26]], 9, CHROME, OUT_IN, CHROME_SH);
    ovenMitt(ctx, FX1 + 26, -31, 0.55);
    limb(ctx, [[FX0 + DX + 2, -4], [FX0 + DX - 16, -14], [FX0 + DX - 22, -28]], 9, CHROME, OUT_IN, CHROME_SH);
    ovenMitt(ctx, FX0 + DX - 24, -33, -0.6, 0.92);
  }
  ctx.restore();
}

const WALK = (f: number): Pose => ({
  f, lean: 0, crouch: 0, eyes: 'angry', mouth: 1, heat: 0, mitts: 'down', ding: false, shake: false,
});

defineSprite({ id: 'boss.microonde', w: W, h: H, ax: AX, ay: AY, frames: 4, flash: true, draw: (ctx, f) => drawMicroonde(ctx, WALK(f)) });

defineSprite({
  id: 'boss.microonde.attack', w: W, h: H, ax: AX, ay: AY, frames: 2, flash: true,
  draw: (ctx, f) => {
    if (f === 0) {
      // wind-up: fangs clenched, white-hot core, crouched and rattling, eyes narrowed
      softGlow(ctx, -9, 4, 70, GLOW, 0.45);
      drawMicroonde(ctx, { f: 1, lean: -0.03, crouch: 5, eyes: 'slit', mouth: 0, heat: 1, mitts: 'up', ding: false, shake: true });
      // rattle marks
      for (const s of [-1, 1]) {
        line(ctx, [[s * 76 - 6, -24], [s * 80 - 6, -16], [s * 76 - 6, -8]], 2.4, '#ffffff', false, 0.8);
        line(ctx, [[s * 84 - 6, -20], [s * 88 - 6, -12], [s * 84 - 6, -4]], 2, '#ffffff', false, 0.6);
      }
    } else {
      // DING! the jaw gapes, a radial pulse blasts out, the bell rings
      ctx.save();
      ctx.globalAlpha = 0.9;
      strokePath(ctx, (c) => ellipsePath(c, -4, 2, 88, 54), '#ffd27a', 5, 0.55);
      strokePath(ctx, (c) => ellipsePath(c, -4, 2, 77, 47), '#fff3c0', 3, 0.7);
      ctx.restore();
      softGlow(ctx, -9, -4, 66, GLOW_HI, 0.6);
      burstLines(ctx, -9, 6, 36, 60, 14, '#fff3c0', 3, 7, 0, TAU, 0.75);
      drawMicroonde(ctx, { f: 2, lean: 0.04, crouch: -3, eyes: 'wide', mouth: 2, heat: 1, mitts: 'wide', ding: true, shake: false });
    }
  },
});

void rgba;
