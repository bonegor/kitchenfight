/**
 * IL MENÙ — BOSSES C: the final bosses of the Pizza Diavola and of the dolci.
 *
 * Follows docs/ART_GUIDE.md (quality bar: recipes_bosses_b.ts):
 *   boss.<id>          frames: 4, flash: true — idle/walk loop with secondary motion
 *   boss.<id>.attack   frames: 2, flash: true — 0 = wind-up/telegraph, 1 = attack. SAME box/anchor.
 * Anchor = centre of the collision circle; feet at y ≈ +radius; face front-right; outline 3–4.
 *
 *   id               box w×h   anchor (ax,ay)  radius  look
 *   boss.pepperoni   252×268   (104,200)       56      Il Salamone Americano: a giant stick of American pepperoni standing
 *                                                      upright, brick-red casing freckled with fat, its cut top showing the
 *                                                      slice, grease beading down; white sneakers; a huge pizza cutter in
 *                                                      the near hand. Wind-up: the cutter high over his head, grease
 *                                                      sweating. Attack: the cutter swung forward, slices flying off it.
 *   boss.cannolo     236×262   (106,196)       56      Il Cannolone Tarocco: a giant puff-pastry horn standing on its tip,
 *                                                      heaped with piped whipped cream, neon sprinkles and a candied
 *                                                      cherry, a gondolier's straw boater on the cream, a twirled black
 *                                                      moustache and red-and-white striped gondolier legs; a piping bag in
 *                                                      the near hand. Wind-up: the bag raised and squeezed, cream
 *                                                      bulging. Attack: the bag levelled and squirting (the nozzle at
 *                                                      +92,−86: b_cannolo.ts fires from there).
 *   boss.panettone   258×272   (114,204)       58      Il Panettone Industriale: a giant panettone in its brown paper
 *                                                      mould (pleated, scalloped edge), a glossy golden dome with the
 *                                                      cross cut, raisins and candied peel, sealed in cellophane with a
 *                                                      big red bow and a barcode sticker (no text); a tub of margarine in
 *                                                      the near hand. Wind-up: arms up, the dome swelling and glowing.
 *                                                      Attack: the cross cut bursts and the raisins fly (b_panettone.ts
 *                                                      fires them from the dome).
 */
import { registerBoss, type Pose } from './bosses_a';
import { Ctx, Pt, INK, line, ellipsePath, circlePath, roundRectPath, polyPath, blobPath, brow, rgba, rng, speckle } from '../painter';
import {
  OUT, OUT_IN, OUT_S, phase, S, clipTo, fillPath, strokePath, sparkle, fist, limb, swoosh, burstLines, softGlow, stompLegs, lidEye,
} from './bosses_b_kit';
import { pepperoniFace } from './recipes_enemies_c';

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  if (s !== 1) ctx.scale(s, s);
  fn();
  ctx.restore();
}

/** Dark cel crescent over an already painted shape (offset toward the lower right). */
function shadeOver(ctx: Ctx, build: (c: Ctx) => void, col: string, off: Pt, alpha: number) {
  clipTo(ctx, build, () => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-400, -400, 800, 800);
    ctx.translate(-off[0], -off[1]);
    build(ctx);
    ctx.translate(off[0], off[1]);
    ctx.fillStyle = col;
    ctx.globalAlpha = alpha;
    ctx.fill('evenodd');
    ctx.restore();
  });
}

/** A chunky cartoon sneaker (white, with a coloured stripe). */
function sneaker(ctx: Ctx, x: number, y: number, side: number, stripe: string) {
  S(ctx, (c) => {
    c.moveTo(x - 12, y + 1);
    c.quadraticCurveTo(x - 12, y - 10, x - 1, y - 10);
    c.quadraticCurveTo(x + 7, y - 10, x + 14, y - 3);
    c.quadraticCurveTo(x + 15, y + 1, x + 12, y + 1.5);
    c.closePath();
  }, { fill: '#fbf8f0', ink: OUT_IN, shadow: '#cfcabd', shadowOffset: [-1.6, -1.6], gloss: [{ x: x - 5, y: y - 7, rx: 2.6, ry: 1, alpha: 0.6 }] });
  line(ctx, [[x - 4, y - 8], [x + 6, y - 3]], 2.2, stripe);
  line(ctx, [[x - 12, y + 0.5], [x + 13, y + 0.5]], 2.2, '#6a6070', false, 0.9);
  void side;
}

/** A big villain mouth: 'grin' (teeth), 'roar' (wide open, fangs), 'clench'. */
function bigMouth(ctx: Ctx, x: number, y: number, w: number, kind: 'grin' | 'roar' | 'clench') {
  if (kind === 'roar') {
    const maw = (c: Ctx) => {
      c.moveTo(x - w, y - 5);
      c.quadraticCurveTo(x, y - 12, x + w * 1.1, y - 7);
      c.quadraticCurveTo(x + w * 1.15, y + 12, x + w * 0.6, y + 22);
      c.quadraticCurveTo(x, y + 27, x - w * 0.6, y + 21);
      c.quadraticCurveTo(x - w * 1.05, y + 11, x - w, y - 5);
      c.closePath();
    };
    S(ctx, maw, { fill: '#4a0f18', ink: OUT_IN, shadow: 'none' });
    clipTo(ctx, maw, () => {
      fillPath(ctx, (c) => ellipsePath(c, x + 3, y + 22, w * 0.6, 7), '#d8505e');
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.moveTo(x - w * 1.2, y - 16);
      ctx.lineTo(x + w * 1.3, y - 16);
      ctx.lineTo(x + w * 1.3, y - 2);
      for (let i = 0; i <= 10; i++) ctx.lineTo(x + w * 1.3 - i * (w * 2.5) / 10, y - 2 + (i % 2 ? 4.5 : 0));
      ctx.closePath();
      ctx.fill();
    });
    return;
  }
  const open = kind === 'clench' ? 0.45 : 1;
  const gp = (c: Ctx) => {
    c.moveTo(x - w, y - 5);
    c.quadraticCurveTo(x, y + 3, x + w * 1.15, y - 9);
    c.quadraticCurveTo(x + w * 0.9, y + 6 + 11 * open, x + 2, y + 8 + 11 * open);
    c.quadraticCurveTo(x - w * 0.7, y + 6 + 9 * open, x - w, y - 5);
    c.closePath();
  };
  S(ctx, gp, { fill: '#4a0f18', ink: OUT_IN, shadow: 'none' });
  clipTo(ctx, gp, () => {
    fillPath(ctx, (c) => ellipsePath(c, x + 5, y + 13 + 8 * open, w * 0.55, 6.5), '#d8505e');
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.moveTo(x - w * 1.2, y - 9);
    ctx.quadraticCurveTo(x, y - 1, x + w * 1.3, y - 13);
    ctx.lineTo(x + w * 1.3, y - 3);
    ctx.quadraticCurveTo(x, y + 7, x - w * 1.2, y + 1);
    ctx.closePath();
    ctx.fill();
    if (kind === 'clench') fillPath(ctx, (c) => c.rect(x - w * 1.2, y + 6, w * 2.5, 20), '#fff8ea');
    for (let i = -2; i <= 3; i++) {
      line(ctx, [[x + i * w * 0.34, y - 8], [x + i * w * 0.34 + 0.3, y + 1]], 0.9, '#b8987e');
      if (kind === 'clench') line(ctx, [[x + i * w * 0.34 + 4, y + 7], [x + i * w * 0.34 + 4, y + 15]], 0.9, '#b8987e');
    }
  });
}

// ===========================================================================
// 1. IL SALAMONE AMERICANO — the Great American Pepperoni (Pizza Diavola)
// ===========================================================================

const PEP = '#b8361e';
const PEP_DK = '#7c1d10';
const PEP_HI = '#e2603a';
const FAT = '#f6c6a6';
const GREASE = '#f59a2a';
const STEEL = '#dfe5ee';
const STEEL_SH = '#8f9bb0';

interface PepPose { f: number; crouch: number; arm: 'walk' | 'up' | 'swing'; eyes: 'angry' | 'slit'; mouth: 'grin' | 'roar' | 'clench'; bob: number; lean: number }

/** The pizza cutter: a steel wheel on a red handle. (x,y) = the wheel's hub; a = handle direction (from hub to grip). */
function cutter(ctx: Ctx, x: number, y: number, a: number, blur = false) {
  rot(ctx, x, y, a, () => {
    // handle + fork
    S(ctx, (c) => { c.moveTo(4, -3.6); c.lineTo(22, -3.2); c.lineTo(22, 3.2); c.lineTo(4, 3.6); c.closePath(); }, { fill: STEEL, ink: OUT_S + 0.4, shadow: STEEL_SH, shadowOffset: [-0.8, -1] });
    S(ctx, (c) => roundRectPath(c, 20, -5.4, 34, 10.8, 5), { fill: '#d8202e', ink: OUT_IN, shadow: '#9a141e', shadowOffset: [-1.6, -1.8], gloss: [{ x: 30, y: -2.6, rx: 8, ry: 1.4, alpha: 0.6 }] });
    for (const k of [28, 34, 40, 46]) line(ctx, [[k, -4.6], [k, 4.6]], 1, '#9a141e', false, 0.6);
  });
  // the wheel
  const R = 19;
  if (blur) fillPath(ctx, (c) => circlePath(c, x, y, R + 6), '#ffffff', 0.25);
  S(ctx, (c) => circlePath(c, x, y, R), { fill: STEEL, ink: OUT_IN, shadow: STEEL_SH, shadowOffset: [-3, -3.4], gloss: [{ x: x - 7, y: y - 8, rx: 6, ry: 2.4, rot: -0.6, alpha: 0.85 }] });
  strokePath(ctx, (c) => circlePath(c, x, y, R - 3.5), '#b8c2d0', 1.4, 0.9);
  S(ctx, (c) => circlePath(c, x, y, 5), { fill: '#c4ccd8', ink: OUT_S, shadow: STEEL_SH, shadowOffset: [-1, -1] });
  // a slice of pepperoni stuck to the blade
  pepperoniFace(ctx, x + 9, y + 9, 5, 4, 13, 1.4);
}

function drawPepperoni(ctx: Ctx, p: PepPose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = 58;
  stompLegs(ctx, 0, 30 + p.crouch, FOOT, f, {
    spread: 26, thick: 12, color: PEP_DK, shade: '#4e100a', stride: 7, lift: 7,
    shoe: (x, y, side) => sneaker(ctx, x, y, side, '#d8202e'),
  });
  ctx.save();
  ctx.translate(0, FOOT);
  ctx.rotate(p.lean);
  ctx.translate(0, -FOOT + p.crouch - p.bob * 3);
  const sw = Math.sin(ph) * 4;
  // ---- back arm
  if (p.arm === 'up') {
    limb(ctx, [[-46, -70], [-66, -88], [-62, -112]], 11, PEP, OUT_IN, PEP_DK);
    fist(ctx, -62, -116, 10, -1.6, { ink: OUT_IN });
  } else {
    limb(ctx, [[-46, -62], [-66, -40 + sw], [-64, -18 + sw]], 11, PEP, OUT_IN, PEP_DK);
    fist(ctx, -64, -14 + sw, 10, 1.7, { ink: OUT_IN });
  }
  // ---- the log
  const TOP = -150, BOT = 34, W = 50, TR = 15;
  const log = (c: Ctx) => {
    c.moveTo(-W, TOP);
    c.lineTo(-W, BOT - 16);
    c.quadraticCurveTo(-W, BOT, -W + 18, BOT + 2);
    c.quadraticCurveTo(0, BOT + 10, W - 18, BOT + 2);
    c.quadraticCurveTo(W, BOT, W, BOT - 16);
    c.lineTo(W, TOP);
    c.ellipse(0, TOP, W, TR, 0, 0, Math.PI, true);
    c.closePath();
  };
  const g = ctx.createLinearGradient(-W, 0, W, 0);
  g.addColorStop(0, '#a82c18');
  g.addColorStop(0.28, PEP_HI);
  g.addColorStop(0.55, PEP);
  g.addColorStop(1, '#7a1c10');
  S(ctx, log, { fill: g, ink: OUT, shadow: 'none' });
  clipTo(ctx, log, () => {
    // fat freckles and paprika specks through the casing
    const R = rng(311 + f);
    for (let i = 0; i < 90; i++) {
      const x = -W + R() * W * 2, y = TOP + R() * (BOT - TOP);
      const r = 1.2 + R() * 2.4;
      fillPath(ctx, (c) => ellipsePath(c, x, y, r, r * 0.75, R() * 3), FAT, 0.75);
    }
    speckle(ctx, 0, -60, W, 90, 160, '#4e0e08', 1.1, 77, 0.65);
    // casing wrinkles
    for (const x of [-34, -14, 10, 30]) strokePath(ctx, (c) => { c.moveTo(x, TOP + 30); c.quadraticCurveTo(x + 5, -60, x - 2, 10); }, PEP_DK, 2, 0.35);
    // a long greasy highlight
    fillPath(ctx, (c) => roundRectPath(c, -34, TOP + 20, 6, 150, 3), '#ffffff', 0.28);
    fillPath(ctx, (c) => ellipsePath(c, -28, TOP + 30, 4, 8, 0), '#ffffff', 0.45);
  });
  shadeOver(ctx, log, '#3a0804', [-14, -6], 0.3);
  // ---- the cut top: the slice face of the log
  pepperoniFace(ctx, 0, TOP, W - 1.5, TR - 1, 99, OUT_IN);
  // grease running over the rim
  for (const [x, len] of [[-30, 10], [12, 16], [36, 8]] as [number, number][]) {
    const l = len + (f % 2) * 2;
    S(ctx, (c) => {
      c.moveTo(x - 3.5, TOP + 6);
      c.lineTo(x - 2.6, TOP + 6 + l);
      c.arc(x, TOP + 6 + l, 2.6, Math.PI, 0, true);
      c.lineTo(x + 3.5, TOP + 6);
      c.closePath();
    }, { fill: GREASE, ink: OUT_S, shadow: 'none', gloss: [{ x: x - 0.8, y: TOP + 5 + l, rx: 0.8, ry: 0.8, alpha: 0.9 }] });
  }
  // ---- face
  const fx = 8, fy = -88;
  const lo = p.eyes === 'slit' ? 0.32 : 0.2, li = p.eyes === 'slit' ? 0.82 : 0.56;
  lidEye(ctx, fx - 18, fy, 13, { side: -1, lidOuter: lo, lidInner: li, look: [0.35, 0.2], iris: '#ffb02e', pupil: 0.32, lidColor: PEP_DK, ink: 2.6 });
  lidEye(ctx, fx + 18, fy - 1, 14, { side: 1, lidOuter: lo, lidInner: li, look: [0.35, 0.2], iris: '#ffb02e', pupil: 0.32, lidColor: PEP_DK, ink: 2.6 });
  brow(ctx, fx - 19, fy - 19, 22, 0.5, 6.2);
  brow(ctx, fx + 19, fy - 21, 24, -0.5, 6.2);
  bigMouth(ctx, fx + 2, fy + 34, 24, p.mouth);
  // sweat beads of grease
  for (const [x, y] of [[-40, -110], [44, -104]] as Pt[]) {
    S(ctx, (c) => { c.moveTo(x, y - 7); c.quadraticCurveTo(x + 4, y - 1, x + 3.6, y + 1.6); c.arc(x, y + 1.6, 3.6, 0, Math.PI); c.quadraticCurveTo(x - 4, y - 1, x, y - 7); c.closePath(); }, { fill: '#ffc46a', ink: OUT_S, shadow: GREASE, shadowOffset: [-0.8, -1] });
  }
  // ---- front arm with the cutter
  if (p.arm === 'walk') {
    limb(ctx, [[48, -52], [70, -38 - sw], [74, -22 - sw]], 11, PEP, OUT_IN, PEP_DK);
    cutter(ctx, 92, -6 - sw, -2.3);
    fist(ctx, 76, -20 - sw, 10, -0.8, { ink: OUT_IN });
  } else if (p.arm === 'up') {
    limb(ctx, [[46, -72], [66, -102], [58, -134]], 11, PEP, OUT_IN, PEP_DK);
    cutter(ctx, 66, -184, 1.8);
    fist(ctx, 58, -140, 10, -1.5, { ink: OUT_IN });
  } else {
    limb(ctx, [[46, -66], [78, -66], [96, -52]], 11, PEP, OUT_IN, PEP_DK);
    swoosh(ctx, 70, -70, 64, -1.9, 0.2, 10, '#ffffff', 0.7);
    cutter(ctx, 118, -36, -2.6, true);
    fist(ctx, 98, -50, 10, 0.4, { ink: OUT_IN });
  }
  ctx.restore();
}

const PEP_IDLE = (f: number): PepPose => ({ f, crouch: 0, arm: 'walk', eyes: 'angry', mouth: 'grin', bob: (1 - Math.cos(phase(f) * 2)) / 2, lean: Math.sin(phase(f)) * 0.025 });

registerBoss('pepperoni', 252, 268, 104, 200, (ctx, f, pose: Pose) => {
  if (pose === 'idle') return drawPepperoni(ctx, PEP_IDLE(f));
  if (pose === 'windup') {
    drawPepperoni(ctx, { f: 1, crouch: 5, arm: 'up', eyes: 'slit', mouth: 'clench', bob: 0.5, lean: -0.05 });
    for (const s of [-1, 1]) line(ctx, [[s * 70 + 10, -150], [s * 76 + 10, -140], [s * 70 + 10, -130]], 2.4, '#ffffff', false, 0.85);
    return;
  }
  drawPepperoni(ctx, { f: 2, crouch: -2, arm: 'swing', eyes: 'angry', mouth: 'roar', bob: 0.5, lean: 0.06 });
  // slices flung off the blade
  for (const [x, y, a] of [[124, -70, 0.3], [112, -6, -0.4], [128, -32, 1]] as [number, number, number][]) rot(ctx, x, y, a, () => pepperoniFace(ctx, 0, 0, 6.5, 4.6, Math.round(x), 1.6));
  burstLines(ctx, 118, -36, 24, 34, 6, '#ffffff', 2.2, 4, -1.2, 1.2, 0.85);
});

// ===========================================================================
// 2. IL CANNOLONE TAROCCO — the Fake Mega-Cannolo (Cannoli siciliani)
// ===========================================================================

const PUFF = '#efb35a';
const PUFF_DK = '#a8611c';
const PUFF_HI = '#fbdc96';
const CREAM = '#fffdf6';
const CREAM_SH = '#e3dccb';
const NEON = ['#ff3fb8', '#28e4ff', '#ffe23a', '#3ad84a', '#c04aff'];
const STRIPE = '#d8202e';

interface CanPose { f: number; crouch: number; arm: 'walk' | 'up' | 'squirt'; eyes: 'smug' | 'slit' | 'angry'; mouth: 'grin' | 'roar' | 'clench'; bob: number; lean: number; bulge: number }

function hornPath(c: Ctx) {
  c.moveTo(-58, -118);
  c.quadraticCurveTo(-50, -40, -6, 34);
  c.quadraticCurveTo(0, 40, 6, 34);
  c.quadraticCurveTo(50, -40, 58, -118);
  c.ellipse(0, -118, 58, 18, 0, 0, Math.PI, true);
  c.closePath();
}

/** The whipped-cream heap on the open end (piped, ridged). */
function creamHeap(ctx: Ctx, puff: number) {
  const k = 0.86 + puff * 0.07;
  const heap = (c: Ctx) => {
    c.moveTo(-62, -118);
    c.quadraticCurveTo(-70, -136 * k, -48, -142 * k);
    c.quadraticCurveTo(-52, -164 * k, -26, -164 * k);
    c.quadraticCurveTo(-24, -186 * k, 0, -184 * k);
    c.quadraticCurveTo(10, -204 * k, 22, -196 * k);
    c.quadraticCurveTo(30, -184 * k, 26, -170 * k);
    c.quadraticCurveTo(52, -168 * k, 48, -146 * k);
    c.quadraticCurveTo(70, -138 * k, 62, -118);
    c.quadraticCurveTo(0, -102, -62, -118);
    c.closePath();
  };
  S(ctx, heap, { fill: CREAM, ink: OUT, shadow: CREAM_SH, shadowOffset: [-7, -6], gloss: [{ x: -26, y: -160 * k, rx: 9, ry: 4, rot: -0.3, alpha: 0.9 }] });
  // piped ridges
  for (const pts of [
    [[-54, -124], [-40, -138], [-22, -146]], [[-36, -150], [-18, -162], [2, -166]], [[-12, -170], [2, -182], [16, -186]],
    [[8, -150], [26, -156], [40, -150]], [[20, -128], [38, -134], [54, -128]], [[-30, -126], [-10, -134], [8, -132]],
  ] as Pt[][]) {
    line(ctx, pts.map(([x, y]) => [x, y * k] as Pt), 2.4, CREAM_SH, true, 0.9);
    line(ctx, pts.map(([x, y]) => [x - 1.4, y * k - 1.6] as Pt), 1.2, '#ffffff', true, 0.9);
  }
  // neon sprinkles (the tourist trap)
  const R = rng(57);
  clipTo(ctx, heap, () => {
    for (let i = 0; i < 42; i++) {
      const x = -54 + R() * 108, y = (-122 - R() * 70) * k;
      rot(ctx, x, y, R() * Math.PI, () => {
        fillPath(ctx, (c) => roundRectPath(c, -3.4, -1.1, 6.8, 2.2, 1.1), NEON[i % NEON.length]);
      });
    }
  });
  // a candied cherry
  S(ctx, (c) => circlePath(c, 36, -150 * k, 7.5), { fill: '#d8202e', ink: OUT_IN, shadowOffset: [-2, -2.2], gloss: [{ x: 33, y: -153 * k, rx: 2.6, ry: 1.6, alpha: 0.95 }] });
  line(ctx, [[36, -157 * k], [40, -165 * k], [46, -167 * k]], 2, '#3a7a2a', true);
}

/** A gondolier's straw boater with a red ribbon, tilted on the cream. */
function boater(ctx: Ctx, x: number, y: number, a: number) {
  rot(ctx, x, y, a, () => {
    S(ctx, (c) => ellipsePath(c, 0, 0, 40, 9), { fill: '#f2d27a', ink: OUT_IN, shadow: '#c9a24a', shadowOffset: [-3, -2.4], gloss: [{ x: -16, y: -2.6, rx: 10, ry: 1.6, alpha: 0.6 }] });
    const crown = (c: Ctx) => { c.moveTo(-24, -1); c.lineTo(-23, -20); c.quadraticCurveTo(0, -25, 23, -20); c.lineTo(24, -1); c.quadraticCurveTo(0, 4, -24, -1); c.closePath(); };
    S(ctx, crown, { fill: '#f6dc8a', ink: OUT_IN, shadow: '#c9a24a', shadowOffset: [-3, -2] });
    clipTo(ctx, crown, () => {
      for (let i = -20; i <= 20; i += 4) line(ctx, [[i, -22], [i + 1, 2]], 0.8, '#c9a24a', false, 0.7);
      fillPath(ctx, (c) => { c.moveTo(-26, -10); c.quadraticCurveTo(0, -14, 26, -10); c.lineTo(26, -3); c.quadraticCurveTo(0, -7, -26, -3); c.closePath(); }, STRIPE);
    });
    // ribbon tails
    S(ctx, (c) => { c.moveTo(-20, -6); c.lineTo(-32, 6); c.lineTo(-27, 7); c.lineTo(-24, 3); c.lineTo(-22, 9); c.lineTo(-16, -4); c.closePath(); }, { fill: STRIPE, ink: OUT_S, shadow: '#9a141e', shadowOffset: [-1, -1] });
  });
}

/** The piping bag. (x,y) = the hand; a = where the nozzle points; squeeze 0..1. */
function pipingBag(ctx: Ctx, x: number, y: number, a: number, squeeze: number) {
  rot(ctx, x, y, a, () => {
    const bag = (c: Ctx) => {
      c.moveTo(-22, -12 - squeeze * 3);
      c.quadraticCurveTo(-4, -16 - squeeze * 4, 22, -5);
      c.lineTo(22, 5);
      c.quadraticCurveTo(-4, 16 + squeeze * 4, -22, 12 + squeeze * 3);
      c.quadraticCurveTo(-28, 0, -22, -12 - squeeze * 3);
      c.closePath();
    };
    S(ctx, bag, { fill: '#f4f6fa', ink: OUT_IN, shadow: '#bfc6d4', shadowOffset: [-2.4, -2.4], gloss: [{ x: -6, y: -8, rx: 8, ry: 1.8, rot: -0.1, alpha: 0.75 }] });
    clipTo(ctx, bag, () => fillPath(ctx, (c) => ellipsePath(c, 0, 0, 18, 9 + squeeze * 3), CREAM_SH, 0.5));
    // the twisted tail
    S(ctx, (c) => { c.moveTo(-24, -6); c.lineTo(-34, -9); c.lineTo(-33, 7); c.lineTo(-24, 6); c.closePath(); }, { fill: '#e8ecf2', ink: OUT_S, shadow: 'none' });
    // the star nozzle
    S(ctx, (c) => { c.moveTo(21, -6); c.lineTo(34, -2.6); c.lineTo(34, 2.6); c.lineTo(21, 6); c.closePath(); }, { fill: STEEL, ink: OUT_S + 0.3, shadow: STEEL_SH, shadowOffset: [-1, -1] });
    for (const yy of [-3, 0, 3]) line(ctx, [[24, yy * 1.2], [33, yy * 0.6]], 0.8, STEEL_SH, false, 0.8);
    if (squeeze > 0.5) {
      S(ctx, (c) => blobPath(c, 37, 0, 5, 4, 0.3, 8, 3), { fill: CREAM, ink: OUT_S, shadow: CREAM_SH, shadowOffset: [-1, -1] });
    }
  });
}

function drawCannolo(ctx: Ctx, p: CanPose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = 58;
  // red-and-white gondolier stockings
  stompLegs(ctx, 0, 22 + p.crouch, FOOT, f, {
    spread: 18, thick: 11, color: '#fbf8f0', shade: '#d8d2c4', stride: 7, lift: 7,
    shoe: (x, y) => {
      S(ctx, (c) => { c.moveTo(x - 11, y + 1); c.quadraticCurveTo(x - 11, y - 9, x, y - 9); c.quadraticCurveTo(x + 9, y - 9, x + 14, y - 1); c.quadraticCurveTo(x + 13, y + 2, x + 10, y + 1.5); c.closePath(); }, { fill: '#2e1c15', ink: OUT_IN, shadow: 'none', gloss: [{ x: x - 4, y: y - 6, rx: 3, ry: 1, alpha: 0.4 }] });
    },
  });
  // the stripes on the stockings
  for (const side of [-1, 1]) {
    const pp = ph + (side < 0 ? 0 : Math.PI);
    const fxs = side * 18 + Math.sin(pp) * 7, hx = side * 18 * 0.75;
    for (let k = 1; k <= 3; k++) {
      const t = k / 4.2;
      const x = hx + (fxs - hx) * t, y = 22 + p.crouch + (FOOT - 6 - 22 - p.crouch) * t;
      line(ctx, [[x - 5, y - 1], [x + 5, y + 1]], 3, STRIPE);
    }
  }
  ctx.save();
  ctx.translate(0, FOOT);
  ctx.rotate(p.lean);
  ctx.translate(0, -FOOT + p.crouch - p.bob * 3);
  const sw = Math.sin(ph) * 4;
  // ---- back arm on the hip
  if (p.arm === 'up') {
    limb(ctx, [[-44, -70], [-64, -92], [-50, -114]], 10, PUFF, OUT_IN, PUFF_DK);
    fist(ctx, -48, -118, 9.5, -1.4, { ink: OUT_IN });
  } else {
    limb(ctx, [[-46, -66], [-70, -50 + sw], [-56, -34 + sw]], 10, PUFF, OUT_IN, PUFF_DK);
    fist(ctx, -52, -32 + sw, 9.5, 0.4, { ink: OUT_IN });
  }
  // ---- the horn
  S(ctx, hornPath, { fill: PUFF, ink: OUT, shadow: 'none' });
  clipTo(ctx, hornPath, () => {
    // spiral bands of flaky pastry
    for (let i = 0; i < 8; i++) {
      const y = -112 + i * 20;
      const w = 58 * (1 - (i * 20 + 6) / 160);
      if (i % 2 === 0) fillPath(ctx, (c) => { c.moveTo(-70, y + 10); c.quadraticCurveTo(0, y - 4, 70, y - 18); c.lineTo(70, y + 2); c.quadraticCurveTo(0, y + 16, -70, y + 30); c.closePath(); }, PUFF_HI, 0.75);
      strokePath(ctx, (c) => { c.moveTo(-70, y + 10); c.quadraticCurveTo(0, y - 4, 70, y - 18); }, PUFF_DK, 3, 0.95);
      strokePath(ctx, (c) => { c.moveTo(-70, y + 7); c.quadraticCurveTo(0, y - 7, 70, y - 21); }, '#fff1c4', 1.4, 0.85);
      // flaky scallops along the seam
      for (let k = -3; k <= 3; k++) {
        const x = k * w * 0.28, yy = y + 3 - (x + 70) * 0.2 + 10 - 4;
        fillPath(ctx, (c) => ellipsePath(c, x, yy - 2, 5, 2.2, -0.2), PUFF_HI, 0.9);
      }
    }
    speckle(ctx, -18, -60, 30, 50, 60, '#ffffff', 1.1, 21, 0.7);
  });
  shadeOver(ctx, hornPath, '#6a3008', [-16, -6], 0.32);
  // ---- cream, hat
  creamHeap(ctx, p.bulge);
  boater(ctx, -14, -160 - p.bulge * 10, -0.2);
  // ---- face: smug, with a twirled gondolier moustache
  const fx = 6, fy = -84;
  const lo = p.eyes === 'slit' ? 0.32 : p.eyes === 'smug' ? 0.42 : 0.2, li = p.eyes === 'slit' ? 0.82 : p.eyes === 'smug' ? 0.42 : 0.56;
  lidEye(ctx, fx - 17, fy, 12, { side: -1, lidOuter: lo, lidInner: li, look: [0.35, 0.15], iris: '#3f86d8', pupil: 0.32, lidColor: PUFF_DK, ink: 2.4 });
  lidEye(ctx, fx + 17, fy - 1, 13, { side: 1, lidOuter: lo, lidInner: li, look: [0.35, 0.15], iris: '#3f86d8', pupil: 0.32, lidColor: PUFF_DK, ink: 2.4 });
  const ba = p.eyes === 'smug' ? -0.15 : 0.46;
  brow(ctx, fx - 18, fy - 18, 20, ba, 5.6);
  brow(ctx, fx + 18, fy - 20, 22, -ba, 5.6);
  bigMouth(ctx, fx + 2, fy + 34, 18, p.mouth);
  const mus = (c: Ctx) => {
    c.moveTo(fx + 2, fy + 20);
    c.bezierCurveTo(fx - 10, fy + 15, fx - 22, fy + 24, fx - 30, fy + 18);
    c.bezierCurveTo(fx - 36, fy + 12, fx - 30, fy + 6, fx - 26, fy + 10);
    c.bezierCurveTo(fx - 28, fy + 14, fx - 22, fy + 18, fx - 14, fy + 16);
    c.bezierCurveTo(fx - 6, fy + 14, fx, fy + 16, fx + 2, fy + 18);
    c.bezierCurveTo(fx + 4, fy + 16, fx + 10, fy + 14, fx + 18, fy + 16);
    c.bezierCurveTo(fx + 26, fy + 18, fx + 32, fy + 14, fx + 30, fy + 10);
    c.bezierCurveTo(fx + 34, fy + 6, fx + 40, fy + 12, fx + 34, fy + 18);
    c.bezierCurveTo(fx + 26, fy + 24, fx + 14, fy + 15, fx + 2, fy + 20);
    c.closePath();
  };
  S(ctx, mus, { fill: '#2a1a14', ink: OUT_S, shadow: 'none', gloss: [{ x: fx - 14, y: fy + 16, rx: 5, ry: 1, alpha: 0.35 }] });
  // ---- front arm with the piping bag
  if (p.arm === 'walk') {
    limb(ctx, [[44, -66], [66, -48 - sw], [70, -30 - sw]], 10, PUFF, OUT_IN, PUFF_DK);
    pipingBag(ctx, 76, -24 - sw, 0.9, 0);
    fist(ctx, 72, -28 - sw, 9.5, 0.9, { ink: OUT_IN });
  } else if (p.arm === 'up') {
    limb(ctx, [[44, -72], [70, -96], [66, -124]], 10, PUFF, OUT_IN, PUFF_DK);
    pipingBag(ctx, 70, -132, -0.6, 1);
    fist(ctx, 66, -128, 9.5, -0.6, { ink: OUT_IN });
  } else {
    limb(ctx, [[44, -70], [62, -82], [56, -88]], 10, PUFF, OUT_IN, PUFF_DK);
    pipingBag(ctx, 58, -86, 0, 1);
    fist(ctx, 56, -88, 9.5, 0, { ink: OUT_IN });
  }
  ctx.restore();
}

const CAN_IDLE = (f: number): CanPose => ({ f, crouch: 0, arm: 'walk', eyes: 'smug', mouth: 'grin', bob: (1 - Math.cos(phase(f) * 2)) / 2, lean: Math.sin(phase(f)) * 0.025, bulge: 0 });

registerBoss('cannolo', 236, 262, 106, 196, (ctx, f, pose: Pose) => {
  if (pose === 'idle') return drawCannolo(ctx, CAN_IDLE(f));
  if (pose === 'windup') {
    drawCannolo(ctx, { f: 1, crouch: 5, arm: 'up', eyes: 'slit', mouth: 'clench', bob: 0.5, lean: -0.05, bulge: 1 });
    for (const s of [-1, 1]) line(ctx, [[s * 72 + 4, -150], [s * 78 + 4, -140], [s * 72 + 4, -130]], 2.4, '#ffffff', false, 0.85);
    return;
  }
  drawCannolo(ctx, { f: 2, crouch: -2, arm: 'squirt', eyes: 'angry', mouth: 'roar', bob: 0.5, lean: 0.05, bulge: 0.4 });
  // the squirt leaving the nozzle (b_cannolo.ts fires from +92,−86)
  for (const [x, y, r] of [[100, -86, 6], [110, -84, 4.6], [118, -90, 3.4]] as [number, number, number][]) {
    S(ctx, (c) => blobPath(c, x, y, r, r * 0.8, 0.25, 8, Math.round(x)), { fill: CREAM, ink: OUT_S, shadow: CREAM_SH, shadowOffset: [-1, -1] });
  }
  burstLines(ctx, 96, -86, 14, 22, 5, '#ffffff', 2.2, 4, -0.9, 0.9, 0.85);
});

// ===========================================================================
// 3. IL PANETTONE INDUSTRIALE — the Factory Panettone (Panettone)
// ===========================================================================

const CRUST = '#c8822e';
const CRUST_HI = '#f0b45a';
const CRUST_DK = '#7a4414';
const CRUMB = '#f6dc8e';
const PAPER = '#8a5a30';
const PAPER_HI = '#b07a46';
const RAISIN = '#4a2030';
const PEEL = '#ffa21e';

interface PanPose { f: number; crouch: number; arm: 'walk' | 'up' | 'throw'; eyes: 'angry' | 'slit'; mouth: 'grin' | 'roar' | 'clench'; bob: number; lean: number; swell: number; burst: number }

function raisin(ctx: Ctx, x: number, y: number, r: number, a = 0) {
  rot(ctx, x, y, a, () => {
    S(ctx, (c) => blobPath(c, 0, 0, r, r * 0.75, 0.22, 8, Math.round(x * 3 + y)), { fill: RAISIN, ink: OUT_S * 0.8, shadow: '#2a0c16', shadowOffset: [-r * 0.2, -r * 0.2] });
    line(ctx, [[-r * 0.5, -r * 0.1], [r * 0.4, r * 0.15]], 0.8, '#8a4a5a', true, 0.8);
  });
}

function peelCube(ctx: Ctx, x: number, y: number, s: number, a = 0, col = PEEL) {
  rot(ctx, x, y, a, () => S(ctx, (c) => roundRectPath(c, -s, -s, s * 2, s * 2, s * 0.3), { fill: col, ink: OUT_S * 0.8, shadow: '#c8601a', shadowOffset: [-s * 0.3, -s * 0.3], gloss: [{ x: -s * 0.3, y: -s * 0.4, rx: s * 0.4, ry: s * 0.2, alpha: 0.9 }] }));
}

/** A small tub of margarine (no face), held in the hand. */
function tub(ctx: Ctx, x: number, y: number, a: number) {
  rot(ctx, x, y, a, () => {
    const body = (c: Ctx) => { c.moveTo(-14, -8); c.lineTo(-12, 9); c.quadraticCurveTo(0, 12, 12, 9); c.lineTo(14, -8); c.quadraticCurveTo(0, -5, -14, -8); c.closePath(); };
    S(ctx, body, { fill: '#fbf3d6', ink: OUT_IN, shadow: '#d6c99a', shadowOffset: [-2, -1.6] });
    clipTo(ctx, body, () => fillPath(ctx, (c) => { c.moveTo(-15, 0); c.quadraticCurveTo(0, 3, 15, 0); c.lineTo(15, 6); c.quadraticCurveTo(0, 9, -15, 6); c.closePath(); }, '#58b84a'));
    S(ctx, (c) => ellipsePath(c, 0, -8, 14, 4), { fill: '#ffe36a', ink: OUT_S + 0.4, shadow: '#e8b830', shadowOffset: [-1.4, -1] });
    S(ctx, (c) => { c.moveTo(-6, -9); c.quadraticCurveTo(0, -16, 6, -10); c.quadraticCurveTo(0, -8, -6, -9); c.closePath(); }, { fill: '#ffe36a', ink: OUT_S, shadow: 'none' });
  });
}

function drawPanettone(ctx: Ctx, p: PanPose) {
  const f = p.f;
  const ph = phase(f);
  const FOOT = 60;
  stompLegs(ctx, 0, 34 + p.crouch, FOOT, f, {
    spread: 30, thick: 12, color: '#5a3a24', shade: '#3a2414', stride: 7, lift: 7,
    shoe: (x, y) => {
      S(ctx, (c) => { c.moveTo(x - 12, y + 1); c.quadraticCurveTo(x - 12, y - 10, x, y - 10); c.quadraticCurveTo(x + 10, y - 10, x + 15, y - 1); c.quadraticCurveTo(x + 14, y + 2, x + 11, y + 1.5); c.closePath(); }, { fill: '#c8202e', ink: OUT_IN, shadow: '#8a141e', shadowOffset: [-1.6, -1.6], gloss: [{ x: x - 5, y: y - 7, rx: 3, ry: 1, alpha: 0.5 }] });
    },
  });
  ctx.save();
  ctx.translate(0, FOOT);
  ctx.rotate(p.lean);
  ctx.translate(0, -FOOT + p.crouch - p.bob * 3);
  const sw = Math.sin(ph) * 4;
  const sv = 1 + p.swell * 0.06;
  // ---- back arm
  if (p.arm === 'up') {
    limb(ctx, [[-56, -30], [-80, -60], [-70, -92]], 11, CRUST, OUT_IN, CRUST_DK);
    fist(ctx, -68, -96, 10, -1.5, { ink: OUT_IN });
  } else {
    limb(ctx, [[-56, -24], [-80, -6 + sw], [-78, 14 + sw]], 11, CRUST, OUT_IN, CRUST_DK);
    fist(ctx, -78, 18 + sw, 10, 1.7, { ink: OUT_IN });
  }
  // ---- the dome (behind the paper band's top edge)
  const dome = (c: Ctx) => {
    c.moveTo(-62, -36);
    c.bezierCurveTo(-74 * sv, -60, -70 * sv, -130 * sv, -36, -150 * sv);
    c.quadraticCurveTo(0, -166 * sv, 36, -150 * sv);
    c.bezierCurveTo(70 * sv, -130 * sv, 74 * sv, -60, 62, -36);
    c.closePath();
  };
  const g = ctx.createRadialGradient(-22, -128, 6, 0, -90, 110);
  g.addColorStop(0, CRUST_HI);
  g.addColorStop(0.45, CRUST);
  g.addColorStop(1, '#8a4a16');
  S(ctx, dome, { fill: g, ink: OUT, shadow: 'none' });
  clipTo(ctx, dome, () => {
    // the dark glossy top, raisins and peel baked into the crust
    fillPath(ctx, (c) => ellipsePath(c, 0, -150 * sv, 54, 26), CRUST_DK, 0.45);
    const R = rng(222);
    for (let i = 0; i < 14; i++) {
      const x = -58 + R() * 116, y = -60 - R() * 80;
      if (Math.abs(x) < 34 && y > -110) continue; // keep the face clear
      if (i % 3) raisin(ctx, x, y, 3.4 + R() * 1.4, R() * 3);
      else peelCube(ctx, x, y, 2.6, R(), i % 2 ? PEEL : '#7ac04a');
    }
    // a glossy egg-wash sheen
    fillPath(ctx, (c) => ellipsePath(c, -30, -122 * sv, 16, 7, -0.6), '#ffffff', 0.35);
  });
  shadeOver(ctx, dome, '#3a1804', [-14, -8], 0.28);
  // the cross cut on top: four toasted flaps opened on the pale crumb (bursting in the attack)
  const cy = -150 * sv + 6;
  const op = 1 + p.burst * 0.6;
  const cut = (c: Ctx) => {
    c.moveTo(-26 * op, cy);
    c.quadraticCurveTo(0, cy - 10 * op, 26 * op, cy);
    c.quadraticCurveTo(0, cy + 10 * op, -26 * op, cy);
    c.closePath();
  };
  S(ctx, cut, { fill: CRUMB, ink: OUT_IN, shadow: '#d8b060', shadowOffset: [-2, -2] });
  clipTo(ctx, cut, () => {
    speckle(ctx, 0, cy, 22 * op, 7 * op, 18, '#c8a050', 1.2, 4, 0.8);
    raisin(ctx, -10, cy + 1, 3.2, 0.4);
    peelCube(ctx, 8, cy - 1, 2.4, 0.3);
  });
  for (const s of [-1, 1]) {
    S(ctx, (c) => { c.moveTo(s * 4, cy - 2); c.quadraticCurveTo(s * 18 * op, cy - 14 * op, s * 30 * op, cy - 6); c.quadraticCurveTo(s * 18 * op, cy - 4, s * 4, cy - 2); c.closePath(); }, { fill: CRUST_DK, ink: OUT_S, shadow: 'none', gloss: [{ x: s * 16 * op, y: cy - 9 * op, rx: 5, ry: 1, alpha: 0.4 }] });
  }
  // ---- the paper mould band
  const band = (c: Ctx) => {
    c.moveTo(-62, -40);
    for (let i = 0; i <= 12; i++) {
      const x = -62 + (i * 124) / 12;
      c.quadraticCurveTo(x - 124 / 24, -48 + (i % 2) * 2, x, -40);
    }
    c.lineTo(60, 26);
    c.quadraticCurveTo(0, 40, -60, 26);
    c.closePath();
  };
  S(ctx, band, { fill: PAPER, ink: OUT, shadow: 'none' });
  clipTo(ctx, band, () => {
    for (let x = -60; x <= 60; x += 8) line(ctx, [[x, -44], [x * 0.98, 36]], 2, PAPER_HI, false, 0.6);
    for (let x = -56; x <= 60; x += 8) line(ctx, [[x, -44], [x * 0.98, 36]], 1.2, '#5a3418', false, 0.5);
    // the barcode sticker (industrial; no text)
    fillPath(ctx, (c) => roundRectPath(c, 18, -6, 30, 20, 2), '#fbfbf2');
    for (let i = 0; i < 12; i++) fillPath(ctx, (c) => c.rect(21 + i * 2.2, -3, i % 3 === 0 ? 1.4 : 0.8, 13), INK);
  });
  shadeOver(ctx, band, '#2a1406', [-14, -6], 0.3);
  // ---- the cellophane: a cold sheen all over, gathered in a twisted knot with a red bow on top
  strokePath(ctx, dome, '#dff2ff', 3, 0.5);
  fillPath(ctx, (c) => polyPath(c, [[-58, 20], [-44, -128], [-34, -132], [-48, 20]]), '#eaf6ff', 0.32);
  fillPath(ctx, (c) => polyPath(c, [[50, 10], [58, -80], [62, -78], [55, 10]]), '#eaf6ff', 0.4);
  for (const [x, y] of [[-40, -118], [44, -60], [-52, -10]] as Pt[]) sparkle(ctx, x, y, 4.2, '#ffffff', 0.9);
  const ky = -166 * sv - 6;
  S(ctx, (c) => { c.moveTo(-10, ky + 8); c.lineTo(-6, ky - 8); c.lineTo(6, ky - 8); c.lineTo(10, ky + 8); c.closePath(); }, { fill: rgba('#eaf6ff', 0.75), ink: OUT_S, shadow: 'none' });
  for (const s of [-1, 1]) {
    S(ctx, (c) => { c.moveTo(0, ky - 4); c.quadraticCurveTo(s * 18, ky - 26, s * 30, ky - 14); c.quadraticCurveTo(s * 26, ky + 2, 0, ky - 4); c.closePath(); }, { fill: '#d8202e', ink: OUT_IN, shadow: '#9a141e', shadowOffset: [-2, -2], gloss: [{ x: s * 16, y: ky - 16, rx: 5, ry: 1.6, rot: s * 0.4, alpha: 0.6 }] });
    S(ctx, (c) => { c.moveTo(0, ky - 2); c.lineTo(s * 14, ky + 16); c.lineTo(s * 8, ky + 18); c.lineTo(s * 4, ky + 12); c.closePath(); }, { fill: '#d8202e', ink: OUT_S, shadow: '#9a141e', shadowOffset: [-1, -1] });
  }
  S(ctx, (c) => ellipsePath(c, 0, ky - 4, 6, 5), { fill: '#e83a3e', ink: OUT_S, shadow: '#9a141e', shadowOffset: [-1, -1] });
  // ---- face on the crust
  const fx = 6, fy = -86;
  const lo = p.eyes === 'slit' ? 0.32 : 0.2, li = p.eyes === 'slit' ? 0.82 : 0.56;
  lidEye(ctx, fx - 18, fy, 13, { side: -1, lidOuter: lo, lidInner: li, look: [0.35, 0.2], iris: '#3f86d8', pupil: 0.32, lidColor: CRUST_DK, ink: 2.6 });
  lidEye(ctx, fx + 18, fy - 1, 14, { side: 1, lidOuter: lo, lidInner: li, look: [0.35, 0.2], iris: '#3f86d8', pupil: 0.32, lidColor: CRUST_DK, ink: 2.6 });
  brow(ctx, fx - 19, fy - 19, 22, 0.48, 6.2);
  brow(ctx, fx + 19, fy - 21, 24, -0.48, 6.2);
  bigMouth(ctx, fx + 2, fy + 34, 22, p.mouth);
  // ---- front arm with the margarine tub
  if (p.arm === 'walk') {
    limb(ctx, [[56, -26], [80, -8 - sw], [82, 12 - sw]], 11, CRUST, OUT_IN, CRUST_DK);
    tub(ctx, 92, 8 - sw, 0.15);
    fist(ctx, 82, 16 - sw, 10, 1.4, { ink: OUT_IN });
  } else if (p.arm === 'up') {
    limb(ctx, [[56, -32], [80, -60], [72, -92]], 11, CRUST, OUT_IN, CRUST_DK);
    tub(ctx, 76, -110, -0.3);
    fist(ctx, 72, -96, 10, -1.5, { ink: OUT_IN });
  } else {
    limb(ctx, [[56, -30], [86, -34], [102, -24]], 11, CRUST, OUT_IN, CRUST_DK);
    tub(ctx, 116, -26, 0.6);
    fist(ctx, 104, -22, 10, 0.2, { ink: OUT_IN });
  }
  ctx.restore();
}

const PAN_IDLE = (f: number): PanPose => ({ f, crouch: 0, arm: 'walk', eyes: 'angry', mouth: 'grin', bob: (1 - Math.cos(phase(f) * 2)) / 2, lean: Math.sin(phase(f)) * 0.025, swell: 0, burst: 0 });

registerBoss('panettone', 258, 272, 114, 204, (ctx, f, pose: Pose) => {
  if (pose === 'idle') return drawPanettone(ctx, PAN_IDLE(f));
  if (pose === 'windup') {
    softGlow(ctx, 0, -100, 96, '#ffb04a', 0.45, 80);
    drawPanettone(ctx, { f: 1, crouch: 5, arm: 'up', eyes: 'slit', mouth: 'clench', bob: 0.5, lean: -0.04, swell: 1, burst: 0 });
    for (const s of [-1, 1]) line(ctx, [[s * 88, -120], [s * 94, -110], [s * 88, -100]], 2.4, '#ffffff', false, 0.85);
    return;
  }
  drawPanettone(ctx, { f: 2, crouch: -2, arm: 'throw', eyes: 'angry', mouth: 'roar', bob: 0.5, lean: 0.05, swell: 0.5, burst: 1 });
  // raisins and peel bursting out of the cross cut
  for (const [x, y, k] of [[-30, -200, 0], [10, -210, 1], [40, -196, 0], [-8, -190, 2], [26, -184, 1]] as [number, number, number][]) {
    if (k === 1) peelCube(ctx, x, y, 3.6, x * 0.05);
    else raisin(ctx, x, y, 5, x * 0.1);
  }
  burstLines(ctx, 0, -170, 22, 38, 7, '#ffffff', 2.4, 6, -2.6, -0.5, 0.85);
});
