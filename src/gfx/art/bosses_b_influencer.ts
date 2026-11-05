/**
 * BOSS — L'INFLUENCER DELLA PADELLA UNICA (The One-Pan Influencer). Radius 52.
 * Final boss of I Vicoli di Napoli.
 *
 * A monstrous content creator: the head is a glitter-pink smartphone streaming its own
 * beauty-filtered face (dilated sparkle eyes, a smile with far too many teeth), a giant
 * ring light glows behind it like a halo, one hand films everything on a selfie stick,
 * the other shoves a one-pan "carbonara" drowning in cream (and peas!) at the camera.
 * Like / heart / fire notification bubbles float off it constantly.
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, line, ellipsePath, circlePath, roundRectPath, starPath, speckle, rgba, shade,
} from '../painter';
import {
  OUT, OUT_IN, OUT_S, TAU, phase, S, clipTo, fillPath, strokePath, sparkle, heartPath, fist, limb, softGlow, pivot,
  burstLines, stompLegs, dripPath, steamWisp, bubblePath, swoosh,
} from './bosses_b_kit';

export const INFLUENCER_R = 52;
const W = 210, H = 216, AX = 94, AY = 158;

const PINK = '#ff4f9e';
const PINK_SH = '#c4266f';
const LILAC = '#9a7cf2';
const LILAC_SH = '#6a4cc4';
const SKIN = '#ffd2b8';
const SKIN_SH = '#f0a98e';
const HAIR = '#ffe27a';
const HAIR_SH = '#e8b43a';
const RING = '#fffaf0';
const PAN = '#3a3540';
const PAN_SH = '#24202a';
const CREAM = '#fff3d6';
const NOODLE = '#ffe9a8';

const HEAD = { x: 2, y: -60, w: 62, h: 86, r: 13 };

interface Pose {
  f: number;
  lean: number;
  face: 'smile' | 'cheese' | 'scream';
  ringGlow: number; // 0..1 extra glow
  stick: Pt; // selfie hand position
  stickAng: number; // angle of the stick (from hand)
  pan: Pt; // pan hand
  panTilt: number;
  flash: boolean;
  hearts: number; // heart bubble phase offset
}

// ---------------------------------------------------------------------------
// parts
// ---------------------------------------------------------------------------

function ringLight(ctx: Ctx, x: number, y: number, r: number, f: number, glow: number) {
  softGlow(ctx, x, y, r * (1.45 + glow * 0.5), '#fff2c8', 0.5 + glow * 0.45);
  // stand (behind the head, down to the shoulders)
  line(ctx, [[x, y + r], [x, y + r + 18]], 6.5, INK);
  line(ctx, [[x, y + r], [x, y + r + 18]], 3, '#8a8a9a');
  // the ring
  const tube = 8.5;
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, x, y, r);
  ctx.lineWidth = tube + OUT_IN * 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = tube;
  ctx.strokeStyle = '#e9e3ef';
  ctx.stroke();
  ctx.lineWidth = tube * 0.55;
  ctx.strokeStyle = RING;
  ctx.stroke();
  ctx.restore();
  // inner edge shadow (lower-right) + highlight (upper-left)
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r + tube * 0.32, -0.3, 1.9);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c8c0d8';
  ctx.stroke();
  ctx.restore();
  // LED segments, twinkling
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const on = (i + f) % 4 !== 0 || glow > 0;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    fillPath(ctx, (c) => circlePath(c, px, py, on ? 1.7 : 1.2), on ? '#ffffff' : '#f2e6c8', on ? 1 : 0.8);
  }
  if (glow > 0) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      sparkle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 5 + glow * 4, '#ffffff', 0.95);
    }
  }
}

/** Notification bubble with an icon. kind: heart | like | fire | star */
function notif(ctx: Ctx, x: number, y: number, s: number, kind: 'heart' | 'like' | 'fire' | 'star', alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  const col = kind === 'heart' ? '#ff3d6e' : kind === 'like' ? '#3d8bff' : kind === 'fire' ? '#ff8a1e' : '#ffc61e';
  S(ctx, (c) => bubblePath(c, 0, 0, 17, 15, 2), { fill: col, ink: 1.9, shadow: shade(col, 0.25), shadowOffset: [-1.4, -1.4], gloss: [{ x: -4.5, y: -4.5, rx: 3, ry: 1.6, rot: -0.5, alpha: 0.6 }] });
  if (kind === 'heart') {
    shape(ctx, (c) => heartPath(c, 0, 0.3, 4.6), { fill: '#ffffff', ink: 0, shadow: 'none' });
  } else if (kind === 'like') {
    // thumbs-up: palm block + thumb
    fillPath(ctx, (c) => roundRectPath(c, -3.2, -0.8, 6.6, 5.2, 1.4), '#ffffff');
    fillPath(ctx, (c) => {
      c.moveTo(-1.6, -0.6);
      c.lineTo(-0.4, -5.4);
      c.quadraticCurveTo(1.6, -5.6, 1.4, -3);
      c.lineTo(1, -0.6);
      c.closePath();
    }, '#ffffff');
    fillPath(ctx, (c) => c.rect(-5.4, -0.4, 1.6, 4.6), '#ffffff');
  } else if (kind === 'fire') {
    fillPath(ctx, (c) => {
      c.moveTo(0, -5.6);
      c.quadraticCurveTo(4.6, -1, 3.6, 2.2);
      c.quadraticCurveTo(2.6, 5, 0, 5);
      c.quadraticCurveTo(-3.6, 5, -3.8, 1.8);
      c.quadraticCurveTo(-3.6, -1, -1.4, -2.2);
      c.quadraticCurveTo(-1.2, 0.2, 0, 0.4);
      c.quadraticCurveTo(0.6, -2.6, 0, -5.6);
      c.closePath();
    }, '#fff3c0');
  } else {
    fillPath(ctx, (c) => starPath(c, 0, 0.2, 5.4, 2.4, 5), '#ffffff');
  }
  ctx.restore();
}

/** The smartphone head with the streamed face. */
function phoneHead(ctx: Ctx, p: Pose) {
  const { x, y, w, h, r } = HEAD;
  const f = p.f;
  const ph = phase(f);
  const caseB = (c: Ctx) => roundRectPath(c, x - w / 2, y - h / 2, w, h, r);
  // side buttons
  S(ctx, (c) => roundRectPath(c, x + w / 2 - 2, y - 26, 5, 14, 2), { fill: PINK_SH, ink: OUT_S, shadow: 'none' });
  S(ctx, (c) => roundRectPath(c, x - w / 2 - 3, y - 30, 5, 9, 2), { fill: PINK_SH, ink: OUT_S, shadow: 'none' });
  S(ctx, caseB, { fill: PINK, ink: OUT, shadow: PINK_SH, shadowOffset: [-5, -4], gloss: [{ x: x - w / 2 + 6, y: y - h / 2 + 12, rx: 2.4, ry: 9, rot: 0.1, alpha: 0.55 }] });
  // glitter on the case
  clipTo(ctx, caseB, () => speckle(ctx, x, y, w / 2, h / 2, 40, '#ffe6f3', 0.75, 91, 0.85));
  // screen
  const sx = x - w / 2 + 4.5, sy = y - h / 2 + 4.5, sw = w - 9, sh = h - 9;
  const screen = (c: Ctx) => roundRectPath(c, sx, sy, sw, sh, r - 4);
  shape(ctx, screen, { fill: '#1d1830', ink: OUT_S, shadow: 'none' });
  clipTo(ctx, screen, () => {
    // filtered selfie: warm glowing background
    const g = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
    g.addColorStop(0, '#ffe7f2');
    g.addColorStop(0.5, '#ffd9e8');
    g.addColorStop(1, '#ffc4dd');
    ctx.fillStyle = p.flash ? '#ffffff' : g;
    ctx.fillRect(sx, sy, sw, sh);
    if (!p.flash) {
      // bokeh dots
      for (const [bx, by, br, bc] of [[sx + 8, sy + 26, 5, '#ffffff'], [sx + sw - 7, sy + 18, 4, '#fff1a6'], [sx + sw - 9, sy + sh - 22, 6, '#ffffff']] as [number, number, number, string][]) {
        fillPath(ctx, (c) => circlePath(c, bx, by, br), bc, 0.6);
      }
    }
    screenFace(ctx, x + 2, y + 2, p);
    if (p.f === 3 && !p.flash) {
      // stream glitch: a sliced band of the picture slides sideways with RGB fringes
      const gy = y + 6, gh = 7;
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, gy, sw, gh);
      ctx.clip();
      ctx.translate(5, 0);
      screenFace(ctx, x + 2, y + 2, p);
      ctx.restore();
      fillPath(ctx, (c) => c.rect(sx, gy - 1, sw, 1.4), '#36f0ff', 0.75);
      fillPath(ctx, (c) => c.rect(sx, gy + gh, sw, 1.4), '#ff36c8', 0.75);
    }
    // UI: live pill + viewer eye, reaction hearts drifting up the side
    S(ctx, (c) => roundRectPath(c, sx + 4, sy + 9, 15, 7, 3.5), { fill: '#ff2a4a', ink: 1, shadow: 'none' });
    fillPath(ctx, (c) => circlePath(c, sx + 8, sy + 12.5, 1.7), '#ffffff');
    fillPath(ctx, (c) => c.rect(sx + 11, sy + 11.6, 5.5, 1.8), '#ffffff');
    for (let i = 0; i < 4; i++) {
      const t = ((i * 0.27 + f * 0.25) % 1);
      const hx = sx + sw - 7 + Math.sin(t * 9 + i) * 2.4, hy = sy + sh - 8 - t * (sh - 26);
      fillPath(ctx, (c) => heartPath(c, hx, hy, 2.4 + (i % 2) * 0.8), i % 2 ? '#ff3d6e' : '#ff7ab0', 1 - t * 0.6);
    }
    // glass glare
    fillPath(ctx, (c) => {
      c.moveTo(sx - 4, sy + 28);
      c.lineTo(sx + 22, sy - 4);
      c.lineTo(sx + 31, sy - 4);
      c.lineTo(sx - 4, sy + 38);
      c.closePath();
    }, '#ffffff', 0.22);
    // notch / selfie camera
    fillPath(ctx, (c) => roundRectPath(c, x - 7, sy + 2.5, 14, 4.6, 2.3), '#15121e');
    fillPath(ctx, (c) => circlePath(c, x + 3.6, sy + 4.8, 1), '#4a6cff');
  });
  // dangling charm on a strap (secondary motion)
  const sw2 = Math.sin(ph) * 0.35;
  ctx.save();
  ctx.translate(x - w / 2 + 6, y + h / 2 - 2);
  ctx.rotate(sw2);
  line(ctx, [[0, 0], [-2, 8], [0, 14]], 3.4, INK, true);
  line(ctx, [[0, 0], [-2, 8], [0, 14]], 1.6, '#fff1a6', true);
  shape(ctx, (c) => heartPath(c, 0, 19, 5.4), { fill: '#ffd23a', ink: OUT_S, shadow: '#e09a12', shadowOffset: [-1.2, -1.2], gloss: [{ x: -2.2, y: 16.6, rx: 1.4, ry: 0.9, alpha: 0.85 }] });
  ctx.restore();
}

/** The face streamed on the screen. (x,y) ≈ centre between the eyes, a bit low. */
function screenFace(ctx: Ctx, x: number, y: number, p: Pose) {
  const f = p.f;
  // hair framing the selfie
  const hair = (c: Ctx) => {
    c.moveTo(x - 34, y - 30);
    c.quadraticCurveTo(x - 20, y - 50, x + 6, y - 46);
    c.quadraticCurveTo(x + 30, y - 44, x + 34, y - 22);
    c.lineTo(x + 34, y + 16);
    c.quadraticCurveTo(x + 26, y + 6, x + 25, y - 10);
    c.quadraticCurveTo(x + 18, y - 24, x + 2, y - 26);
    c.quadraticCurveTo(x - 10, y - 18, x - 22, y - 20);
    c.quadraticCurveTo(x - 26, y - 4, x - 34, y + 12);
    c.closePath();
  };
  // face skin
  S(ctx, (c) => ellipsePath(c, x, y - 2, 25, 30), { fill: SKIN, ink: OUT_S, shadow: SKIN_SH, shadowOffset: [-3, -3] });
  S(ctx, hair, { fill: HAIR, ink: OUT_S, shadow: HAIR_SH, shadowOffset: [-2, -2], gloss: [{ x: x - 12, y: y - 38, rx: 7, ry: 2, rot: -0.3, alpha: 0.6 }] });
  line(ctx, [[x - 4, y - 38], [x + 14, y - 34], [x + 26, y - 20]], 1, HAIR_SH, true, 0.8);
  // blush with beauty-filter sparkles
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ff7aa8';
  ctx.beginPath();
  ellipsePath(ctx, x - 16, y + 5, 5.4, 3);
  ellipsePath(ctx, x + 17, y + 5, 5.4, 3);
  ctx.fill();
  ctx.restore();
  sparkle(ctx, x - 19, y + 2, 2.6, '#ffffff', 0.95);
  sparkle(ctx, x + 20, y + 3, 2.2, '#ffffff', 0.9);
  // brows: sharp arches
  for (const s of [-1, 1]) {
    const bx = x + s * 11;
    line(ctx, [[bx - s * 6.5, y - 13], [bx + s * 1.5, y - 18.5], [bx + s * 6.5, y - 16]], 2.4, '#7a4a2a', true);
  }
  if (p.face === 'cheese') {
    // squeezed "say cheese" eyes ^^ with lashes
    for (const s of [-1, 1]) {
      const ex = x + s * 11;
      line(ctx, [[ex - 6.5, y - 4], [ex, y - 10], [ex + 6.5, y - 4]], 2.6, INK, true);
      line(ctx, [[ex + s * 5.5, y - 5.5], [ex + s * 9, y - 9]], 1.6, INK);
    }
  } else {
    for (const s of [-1, 1]) {
      const ex = x + s * 11, ey = y - 5;
      const big = p.face === 'scream' ? 8.6 : 8;
      shape(ctx, (c) => ellipsePath(c, ex, ey, big * 0.86, big), { fill: '#ffffff', ink: 1.8, shadow: 'none' });
      clipTo(ctx, (c) => ellipsePath(c, ex, ey, big * 0.86, big), () => {
        const pr = p.face === 'scream' ? big * 0.3 : big * 0.66;
        fillPath(ctx, (c) => circlePath(c, ex + 1.2, ey + 1, pr * 1.2), '#7a3cff');
        fillPath(ctx, (c) => circlePath(c, ex + 1.2, ey + 1, pr * 0.78), '#1d0f3a');
        // ring-light reflection: a perfect ring in each eye
        strokePath(ctx, (c) => circlePath(c, ex + 0.4, ey - 0.6, pr * 0.62), '#ffffff', 1.1, 0.95);
        sparkle(ctx, ex - 2.4, ey - 3.6, 3.2, '#ffffff', 1);
        fillPath(ctx, (c) => circlePath(c, ex + 3, ey + 3.4, 1.1), '#ffffff', 0.9);
      });
      // long lashes
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + s * (0.35 + k * 0.32);
        line(ctx, [[ex + Math.cos(a) * big * 0.84, ey + Math.sin(a) * big], [ex + Math.cos(a) * (big + 3.4), ey + Math.sin(a) * (big + 3.4) - 0.6]], 1.4, INK);
      }
    }
  }
  // tiny nose
  line(ctx, [[x + 1, y + 2], [x + 2.6, y + 6], [x + 0.4, y + 6.6]], 1.3, SKIN_SH, true);
  // THE SMILE: far too wide, far too many teeth
  const open = p.face === 'scream' ? 1.7 : p.face === 'cheese' ? 1.15 : 1;
  const mw = 40;
  const my = y + 12;
  const m = (c: Ctx) => {
    c.moveTo(x - mw / 2, my - 2);
    c.quadraticCurveTo(x, my + 2, x + mw / 2, my - 3);
    c.quadraticCurveTo(x + mw * 0.36, my + 12 * open, x, my + 13 * open);
    c.quadraticCurveTo(x - mw * 0.36, my + 12 * open, x - mw / 2, my - 2);
    c.closePath();
  };
  shape(ctx, m, { fill: '#7a1530', ink: 1.9, shadow: 'none' });
  clipTo(ctx, m, () => {
    if (p.face === 'scream') fillPath(ctx, (c) => ellipsePath(c, x + 1, my + 16, 9, 6), '#ff6f8a');
    // gums
    fillPath(ctx, (c) => {
      c.moveTo(x - mw / 2, my - 3);
      c.quadraticCurveTo(x, my + 1, x + mw / 2, my - 4);
      c.lineTo(x + mw / 2, my + 1);
      c.quadraticCurveTo(x, my + 6, x - mw / 2, my + 1.5);
      c.closePath();
    }, '#ff8fa8');
    // top row: 16 tiny perfect teeth
    const N = 16;
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N;
      const tx = x - mw / 2 + t * mw;
      const ty = my - 2.4 + Math.sin(t * Math.PI) * 3.6;
      fillPath(ctx, (c) => roundRectPath(c, tx - mw / N / 2 + 0.2, ty, mw / N - 0.4, 4.2, 0.8), '#ffffff');
    }
    // bottom row: 14 more
    const M = 14;
    for (let i = 0; i < M; i++) {
      const t = (i + 0.5) / M;
      const tx = x - mw * 0.4 + t * mw * 0.8;
      const ty = my + (12.6 * open) - Math.sin(t * Math.PI) * 1.2 - 3.8;
      fillPath(ctx, (c) => roundRectPath(c, tx - (mw * 0.8) / M / 2 + 0.2, ty, (mw * 0.8) / M - 0.4, 3.8, 0.8), '#fdf6ff');
    }
  });
  // sparkle on the teeth
  sparkle(ctx, x + 8, my + 1, 3.4 + (f % 2), '#ffffff', 1);
}

/** Selfie stick from the hand along ang; a mini phone filming at the end. */
function selfieStick(ctx: Ctx, hx: number, hy: number, ang: number, len: number, f: number) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const ex = hx + dx * len, ey = hy + dy * len;
  // telescoping sections
  line(ctx, [[hx, hy], [ex, ey]], 5.6, INK);
  line(ctx, [[hx, hy], [hx + dx * len * 0.45, hy + dy * len * 0.45]], 3.6, '#c9ced8');
  line(ctx, [[hx + dx * len * 0.45, hy + dy * len * 0.45], [ex, ey]], 2.4, '#e6eaf0');
  line(ctx, [[hx + dx * len * 0.45, hy + dy * len * 0.45], [hx + dx * len * 0.47, hy + dy * len * 0.47]], 5, '#8a92a0');
  // grip
  line(ctx, [[hx - dx * 6, hy - dy * 6], [hx + dx * 8, hy + dy * 8]], 7, INK);
  line(ctx, [[hx - dx * 6, hy - dy * 6], [hx + dx * 8, hy + dy * 8]], 4.4, '#2a2632');
  // mini phone (back side facing us: camera lenses)
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(ang + Math.PI / 2 + 0.25);
  S(ctx, (c) => roundRectPath(c, -8, -12, 16, 24, 4), { fill: '#2b2734', ink: OUT_S + 0.2, shadow: '#17141d', shadowOffset: [-1.6, -1.6], gloss: [{ x: -4, y: -6, rx: 1.2, ry: 4, alpha: 0.35 }] });
  for (const [lx, ly] of [[-3.6, -7.5], [-3.6, -2.5], [1.4, -5]] as Pt[]) {
    shape(ctx, (c) => circlePath(c, lx, ly, 2), { fill: '#151320', ink: 1, shadow: 'none' });
    fillPath(ctx, (c) => circlePath(c, lx - 0.6, ly - 0.6, 0.6), '#7ab8ff');
  }
  // recording light blinking
  if (f % 2 === 0) {
    softGlow(ctx, 4, -9, 6, '#ff2a4a', 0.9);
    fillPath(ctx, (c) => circlePath(c, 4, -9, 1.4), '#ff4a5a');
  }
  ctx.restore();
}

/** One-pan "carbonara": cream, peas, bacon — everything Italians fear. (x,y) = pan centre. */
function oneSadPan(ctx: Ctx, x: number, y: number, tilt: number, f: number, hot: boolean) {
  const ph = phase(f);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  // handle (to the left, toward the hand)
  S(ctx, (c) => roundRectPath(c, -48, -3.5, 30, 7, 3.5), { fill: '#2b2734', ink: OUT_IN, shadow: '#17141d', shadowOffset: [-1.5, -1.5] });
  fillPath(ctx, (c) => circlePath(c, -44, 0, 1.8), '#8a8494');
  // pan body: rim ellipse + side
  S(ctx, (c) => {
    c.moveTo(-24, -2);
    c.lineTo(-21, 7);
    c.quadraticCurveTo(0, 14, 21, 7);
    c.lineTo(24, -2);
    c.closePath();
  }, { fill: PAN, ink: OUT_IN, shadow: PAN_SH, shadowOffset: [-3, -1] });
  S(ctx, (c) => ellipsePath(c, 0, -2, 24.5, 10.5), { fill: '#4a4452', ink: OUT_IN, shadow: 'none' });
  // the sauce: a pale lake of cream
  const sauce = (c: Ctx) => ellipsePath(c, 0, -1.5, 21, 8.4);
  fillPath(ctx, sauce, CREAM);
  clipTo(ctx, sauce, () => {
    fillPath(ctx, (c) => ellipsePath(c, 4, 1.5, 18, 6), '#f3dfb4', 0.7);
    // tangle of overcooked spaghetti
    for (let i = 0; i < 7; i++) {
      const yy = -6 + i * 1.8;
      const pts: Pt[] = [];
      for (let k = 0; k <= 6; k++) pts.push([-17 + k * 5.6, yy + Math.sin(k * 1.4 + i * 2 + ph * 0.5) * 1.6]);
      line(ctx, pts, 1.8, '#e6c97a', true);
      line(ctx, pts, 1.1, NOODLE, true);
    }
    // peas (the crime) + pink bacon cubes + parsley
    const R = (i: number) => Math.abs(Math.sin(i * 91.7 + 3.1)) % 1;
    for (let i = 0; i < 9; i++) {
      const px = -16 + R(i) * 32, py = -6 + R(i + 20) * 10;
      shape(ctx, (c) => circlePath(c, px, py, 1.8), { fill: '#6fd04a', ink: 0.8, shadow: 'none', gloss: [{ x: px - 0.5, y: py - 0.6, rx: 0.6, ry: 0.4, alpha: 0.9 }] });
    }
    for (let i = 0; i < 5; i++) {
      const px = -14 + R(i + 40) * 28, py = -5 + R(i + 60) * 8;
      shape(ctx, (c) => roundRectPath(c, px - 1.8, py - 1.5, 3.6, 3, 0.6), { fill: '#f58aa0', ink: 0.8, shadow: 'none' });
    }
    // a glossy cream swirl on top
    strokePath(ctx, (c) => ctx.ellipse(-2, -2, 7, 2.6, 0, 0.4, 5.4), '#ffffff', 1.4, 0.85);
  });
  // cream sloshing over the rim + a drip
  S(ctx, (c) => {
    c.moveTo(14, 3);
    c.quadraticCurveTo(22, 2, 24, 0);
    c.lineTo(24, 4);
    dripPath(c, 21, 5, 4, 7 + Math.sin(ph) * 2.6);
  }, { fill: CREAM, ink: OUT_S, shadow: '#e8d2a8', shadowOffset: [-0.8, -0.8] });
  ctx.restore();
  // steam
  steamWisp(ctx, x - 8, y - 8, 22, ph, 6, hot ? 0.75 : 0.5);
  steamWisp(ctx, x + 8, y - 9, 18, ph + 2.2, 5, hot ? 0.7 : 0.45);
}

/** Selfie "peace" hand: two fingers up in a V. (x,y) = palm centre. */
function peaceHand(ctx: Ctx, x: number, y: number, rot: number, spread = 0.32) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (const a of [-spread, spread]) {
    ctx.save();
    ctx.rotate(a);
    S(ctx, (c) => roundRectPath(c, -2.6, -17, 5.2, 15, 2.6), { fill: SKIN, ink: OUT_S + 0.2, shadow: SKIN_SH, shadowOffset: [-1, -0.6] });
    fillPath(ctx, (c) => ellipsePath(c, 0, -14.6, 1.8, 2.2), PINK);
    ctx.restore();
  }
  S(ctx, (c) => ellipsePath(c, 0, 0, 7.4, 6.4), { fill: SKIN, ink: OUT_S + 0.4, shadow: SKIN_SH, shadowOffset: [-1.6, -1.6], gloss: [{ x: -2.6, y: -2.2, rx: 1.8, ry: 1.1, alpha: 0.6 }] });
  // folded fingers + thumb
  line(ctx, [[-4.6, 1], [3.6, 2.2]], 1.2, SKIN_SH);
  S(ctx, (c) => ellipsePath(c, -4.6, -1.4, 3, 2.1, -0.6), { fill: SKIN, ink: OUT_S * 0.8, shadow: 'none' });
  ctx.restore();
}

function sneaker(ctx: Ctx, x: number, y: number) {
  S(ctx, (c) => {
    c.moveTo(x - 10, y + 1);
    c.lineTo(x - 10, y - 7);
    c.quadraticCurveTo(x - 9, y - 12, x - 2, y - 11);
    c.quadraticCurveTo(x + 6, y - 10, x + 12, y - 4);
    c.quadraticCurveTo(x + 15, y - 1, x + 13, y + 1);
    c.closePath();
  }, { fill: '#ffffff', ink: OUT_IN, shadow: '#d8d4e6', shadowOffset: [-2, -1.6], gloss: [{ x: x - 4, y: y - 8.5, rx: 3, ry: 1.2, alpha: 0.8 }] });
  // chunky pink platform sole
  S(ctx, (c) => roundRectPath(c, x - 11, y - 1, 25, 6, 2.5), { fill: PINK, ink: OUT_IN, shadow: PINK_SH, shadowOffset: [-1.4, -1.4] });
  line(ctx, [[x - 3, y - 9], [x + 1, y - 5]], 1.3, LILAC, false);
  line(ctx, [[x + 1, y - 8.6], [x + 5, y - 4.4]], 1.3, LILAC, false);
}

// ---------------------------------------------------------------------------
// assembly
// ---------------------------------------------------------------------------

function drawInfluencer(ctx: Ctx, p: Pose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = INFLUENCER_R;

  // legs: black leggings + chunky sneakers
  stompLegs(ctx, 2, 18, FOOT - 5, f, {
    spread: 13, thick: 10, color: '#2b2632', shade: '#17141d', stride: 7, lift: 6,
    shoe: (x, y) => sneaker(ctx, x + 1, y),
  });

  ctx.save();
  pivot(ctx, 0, FOOT, p.lean);

  // ring light halo behind the head
  ringLight(ctx, HEAD.x, HEAD.y - 2, 53, f, p.ringGlow);

  // selfie arm (back, left): stick raised high, filming everything
  const [sx, sy] = p.stick;
  limb(ctx, [[-18, -6], [sx - 6, (sy - 6) / 2 + 8], [sx, sy + 2]], 10, LILAC, OUT_IN, LILAC_SH);
  selfieStick(ctx, sx, sy, p.stickAng, 66, f);
  fist(ctx, sx, sy, 7, p.stickAng, { fill: SKIN, shadow: SKIN_SH, cuff: LILAC, ink: OUT_IN });

  // body: lilac hoodie + white apron with a heart
  const torso = (c: Ctx) => {
    c.moveTo(-22, -12);
    c.quadraticCurveTo(-27, 8, -24, 26);
    c.quadraticCurveTo(0, 32, 26, 26);
    c.quadraticCurveTo(29, 8, 24, -12);
    c.quadraticCurveTo(0, -18, -22, -12);
    c.closePath();
  };
  S(ctx, torso, { fill: LILAC, ink: OUT, shadow: LILAC_SH, shadowOffset: [-5, -3], gloss: [{ x: -14, y: -2, rx: 3, ry: 8, rot: 0.2, alpha: 0.3 }] });
  // hoodie strings
  line(ctx, [[-5, -12], [-6, 0]], 1.6, '#ffffff', false);
  line(ctx, [[6, -12], [7, 0]], 1.6, '#ffffff', false);
  // apron
  const apron = (c: Ctx) => {
    c.moveTo(-17, 2);
    c.quadraticCurveTo(0, 0, 19, 2);
    c.lineTo(21, 26);
    c.quadraticCurveTo(0, 31, -19, 26);
    c.closePath();
  };
  S(ctx, apron, { fill: '#fffaf4', ink: OUT_IN, shadow: '#e2d8ea', shadowOffset: [-2.6, -1.6] });
  shape(ctx, (c) => heartPath(c, 1.5, 14, 6.4), { fill: PINK, ink: OUT_S, shadow: PINK_SH, shadowOffset: [-1, -1], gloss: [{ x: -1.5, y: 11, rx: 1.5, ry: 1, alpha: 0.8 }] });
  sparkle(ctx, 8, 9, 2.6, '#ffffff', 0.95);
  // fake "authentic" ribbon seal on the apron (a rosette — no text)
  shape(ctx, (c) => starPath(c, -11, 21, 4.4, 3.2, 10), { fill: '#ffc93a', ink: 1.2, shadow: '#d08a14', shadowOffset: [-0.8, -0.8] });
  // neck
  S(ctx, (c) => roundRectPath(c, -5, -20, 12, 10, 3), { fill: SKIN, ink: OUT_IN, shadow: SKIN_SH, shadowOffset: [-1.5, 0] });
  // hood bunched behind the neck
  S(ctx, (c) => ellipsePath(c, 1, -14, 17, 5.6), { fill: LILAC, ink: OUT_IN, shadow: LILAC_SH, shadowOffset: [-1.6, -1.6] });

  // the phone head
  ctx.save();
  pivot(ctx, HEAD.x, HEAD.y + HEAD.h / 2, Math.sin(ph) * 0.03 + p.lean * 0.4);
  phoneHead(ctx, p);
  ctx.restore();

  // third arm (yes, a third one): the obligatory selfie peace sign
  const vx = 47 + Math.sin(ph) * 1.5, vy = -48 + Math.cos(ph) * 1.2 - (p.face === 'cheese' ? 6 : 0);
  limb(ctx, [[22, -10], [44, -18], [vx - 1, vy + 6]], 9, LILAC, OUT_IN, LILAC_SH);
  S(ctx, (c) => roundRectPath(c, vx - 6, vy + 3, 12, 6, 2.5), { fill: LILAC, ink: OUT_S + 0.4, shadow: LILAC_SH, shadowOffset: [-1, -1] });
  peaceHand(ctx, vx, vy, 0.18 + Math.sin(ph) * 0.06, p.face === 'scream' ? 0.45 : 0.32);

  // pan arm (front, right)
  const [px, py] = p.pan;
  oneSadPan(ctx, px + 37, py - 2, p.panTilt, f, p.flash);
  limb(ctx, [[19, -6], [px - 8, py + 10], [px - 1, py + 1]], 10, LILAC, OUT_IN, LILAC_SH);
  fist(ctx, px, py, 7.4, p.panTilt, { fill: SKIN, shadow: SKIN_SH, cuff: LILAC, ink: OUT_IN });

  ctx.restore();

  // floating notification bubbles (rising, cycling)
  const bubbles: [number, number, 'heart' | 'like' | 'fire' | 'star', number][] = [
    [-62, -42, 'heart', 0], [58, -104, 'like', 0.35], [-46, -116, 'fire', 0.6], [78, -66, 'heart', 0.85],
  ];
  bubbles.forEach(([bx, by, kind, off], i) => {
    const t = (off + f * 0.25 + p.hearts) % 1;
    const yy = by - t * 16;
    const a = t < 0.75 ? 1 : 1 - (t - 0.75) * 3;
    notif(ctx, bx + Math.sin(t * TAU + i) * 2.5, yy, 0.95 + (i % 2) * 0.12, kind, Math.max(0.15, a));
  });
}

const WALK = (f: number): Pose => {
  const ph = phase(f);
  return {
    f, lean: 0, face: 'smile', ringGlow: 0, stick: [-40, -26 + Math.sin(ph) * 1.5], stickAng: -2.05 + Math.sin(ph) * 0.05,
    pan: [38, 8 + Math.cos(ph) * 1.5], panTilt: -0.04 + Math.sin(ph) * 0.04, flash: false, hearts: 0,
  };
};

defineSprite({ id: 'boss.influencer', w: W, h: H, ax: AX, ay: AY, frames: 4, flash: true, draw: (ctx, f) => drawInfluencer(ctx, WALK(f)) });

defineSprite({
  id: 'boss.influencer.attack', w: W, h: H, ax: AX, ay: AY, frames: 2, flash: true,
  draw: (ctx, f) => {
    if (f === 0) {
      // wind-up: ring light charging, "say cheese!", selfie stick up high
      drawInfluencer(ctx, {
        f: 0, lean: -0.05, face: 'cheese', ringGlow: 0.6, stick: [-40, -36], stickAng: -1.85,
        pan: [34, 2], panTilt: -0.25, flash: false, hearts: 0.2,
      });
    } else {
      // FLASH: blinding burst from the ring light, hearts everywhere, pan shoved forward
      softGlow(ctx, HEAD.x, HEAD.y, 82, '#ffffff', 0.9);
      burstLines(ctx, HEAD.x, HEAD.y, 56, 76, 16, '#ffffff', 4, 21, 0, TAU, 0.9);
      drawInfluencer(ctx, {
        f: 2, lean: 0.06, face: 'scream', ringGlow: 1, stick: [-42, -30], stickAng: -2.2,
        pan: [40, 6], panTilt: 0.28, flash: true, hearts: 0.5,
      });
      swoosh(ctx, 64, 4, 34, -1.2, 0.8, 12, '#fff3d6', 0.5);
    }
  },
});

void rgba;
