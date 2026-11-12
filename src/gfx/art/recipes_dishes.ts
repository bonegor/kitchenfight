/**
 * IL MENÙ — the 11 PLATED DISHES, painted as menu illustrations (menu cards, results screen,
 * Ricettario). Imported before placeholders.ts, so every id defined here replaces its placeholder.
 *
 * Contract for every id: defineSprite({ id, w: 120, h: 80, ax: 60, ay: 40, frames: 1, res: 3, draw }).
 * A plated dish seen from 3/4 above, sitting on a hint of tablecloth (a checked napkin and a fork
 * for the pasta, a board or plate for the pizzas). The proper recipe ONLY: no intruders on it.
 * No text, no brands. Light from the upper-left like every other sprite.
 *
 *   dish.pomodoro     spaghetti al pomodoro: tomato-red twirl, a spoon of sauce, basil
 *   dish.carbonara    spaghetti alla carbonara: glossy egg-and-Pecorino yellow, crisp guanciale, black pepper
 *   dish.alfredo      fettuccine al burro: pale golden butter-and-Parmigiano ribbons, grated Parmigiano
 *   dish.amatriciana  bucatini all'amatriciana: tomato, crisp guanciale strips, grated pecorino
 *   dish.cacioepepe   tonnarelli cacio e pepe: creamy pale Pecorino cream, cracked black pepper
 *   dish.margherita   pizza Margherita: leopard-spotted cornicione, tomato, mozzarella, basil, oil
 *   dish.marinara     pizza Marinara: tomato, garlic slices, oregano, olive oil; NO cheese
 *   dish.ragu         tagliatelle al ragù: egg ribbons under a slow-cooked brown meat ragù
 *   dish.pesto        trofie al pesto genovese, with potato, green beans, pine nuts and basil
 *   dish.vongole      spaghetti alle vongole: clams in their shells, olive oil, parsley, chili; NO cheese
 *   dish.foodcourt    the finale's card: Nonna's tagliere, the menu complete on one board — the
 *                     level's pantry (guanciale, Parmigiano, basil, clams, tomatoes, olive oil) plus a
 *                     little plate of spaghetti al pomodoro and a slice of Margherita
 *
 * Long pasta is a twirled nest (`nest`): a dome wound with interleaved helical strands, drawn only
 * where the surface faces the viewer, so the swirl shows on top. Strand kinds: round (spaghetti),
 * tube (bucatini), square (tonnarelli), ribbon (egg fettuccine / tagliatelle, twisting flat bands).
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, group, line, ellipsePath, circlePath, polyPath, smoothPath, blobPath, roundRectPath,
  speckle, glint, shade, light, mix, rgba, rng, rgrad, vgrad,
} from '../painter';

const TAU = Math.PI * 2;
type Build = (c: Ctx) => void;

// ---------------------------------------------------------------------------
// Canvas plumbing
// ---------------------------------------------------------------------------

/** Paint on a scratch layer with the same transform, then draw it back (for cut-outs). */
function layer(ctx: Ctx, paint: (o: Ctx) => void, alpha = 1, op: GlobalCompositeOperation = 'source-over') {
  const src = ctx.canvas as HTMLCanvasElement;
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const o = c.getContext('2d')!;
  o.imageSmoothingEnabled = true;
  o.setTransform(ctx.getTransform());
  paint(o);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = op;
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}

function clip(ctx: Ctx, build: Build, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

function fillP(ctx: Ctx, build: Build, fill: string | CanvasGradient, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

/** Cel crescent: the part of `build` NOT covered by itself shifted toward the light. */
function crescent(ctx: Ctx, build: Build, off: Pt, color: string, alpha: number) {
  layer(ctx, (o) => {
    o.beginPath();
    build(o);
    o.fillStyle = color;
    o.fill();
    o.globalCompositeOperation = 'destination-out';
    o.translate(off[0], off[1]);
    o.beginPath();
    build(o);
    o.fill();
  }, alpha);
}

/** Soft contact shadow (ellipse, fading out). */
function contact(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha: number, col = '#3a2014') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx);
  g.addColorStop(0, rgba(col, alpha));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  circlePath(ctx, 0, 0, rx);
  ctx.fill();
  ctx.restore();
}

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void, sx = 1, sy = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(sx, sy);
  fn();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Table: checked napkin + fork
// ---------------------------------------------------------------------------

/** A gingham napkin lying on the table (parallelogram A-B-C-D, A = far left corner). */
function napkin(ctx: Ctx, A: Pt, B: Pt, C: Pt, D: Pt, col = '#d23a32', cells = 7) {
  const pts: Pt[] = [A, B, C, D];
  const build: Build = (c) => smoothPath(c, [
    A, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 0.6], B, [(B[0] + C[0]) / 2 + 0.5, (B[1] + C[1]) / 2], C,
    [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2 - 0.5], D, [(D[0] + A[0]) / 2 - 0.4, (D[1] + A[1]) / 2],
  ], true, 0.18);
  shape(ctx, build, { fill: '#fbf5ea', ink: 1.3, shadow: 'none' });
  clip(ctx, build, () => {
    ctx.save();
    // map the unit square onto the napkin
    ctx.transform(B[0] - A[0], B[1] - A[1], D[0] - A[0], D[1] - A[1], A[0], A[1]);
    ctx.fillStyle = rgba(col, 0.5);
    for (let i = -1; i <= cells + 1; i += 2) {
      ctx.fillRect(i / cells, -0.2, 1 / cells, 1.4);
      ctx.fillRect(-0.2, i / cells, 1.4, 1 / cells);
    }
    ctx.restore();
    void pts;
    // cloth shading: soft fold + crescent toward the lower right
    const g = ctx.createLinearGradient(A[0], A[1], C[0], C[1]);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.55, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba('#5a1a14', 0.22));
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, 400, 400);
  });
  crescent(ctx, build, [-1.4, -1.6], '#5a1a14', 0.18);
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

/** A fork lying on the table, tines pointing away (up the screen). (x,y) = handle end. */
function fork(ctx: Ctx, x: number, y: number, len: number, a: number) {
  rot(ctx, x, y, a, () => {
    const L = len;
    const steel = '#e3e8ee';
    const build: Build = (c) => {
      // handle (wide end near the viewer), neck, head
      c.moveTo(-1.9, 0);
      c.quadraticCurveTo(-2.3, -L * 0.25, -1.1, -L * 0.5);
      c.lineTo(-0.7, -L * 0.62);
      c.quadraticCurveTo(-2.4, -L * 0.7, -2.5, -L * 0.8);
      // tines
      const tw = 5 / 7;
      for (let i = 0; i < 4; i++) {
        const x0 = -2.5 + i * tw * 2;
        c.lineTo(x0, -L);
        c.lineTo(x0 + tw, -L);
        c.lineTo(x0 + tw, -L * 0.86);
      }
      c.lineTo(2.5, -L * 0.86);
      c.lineTo(2.5, -L);
      c.lineTo(2.5, -L * 0.8);
      c.quadraticCurveTo(2.4, -L * 0.7, 0.7, -L * 0.62);
      c.lineTo(1.1, -L * 0.5);
      c.quadraticCurveTo(2.3, -L * 0.25, 1.9, 0);
      c.quadraticCurveTo(0, 1.6, -1.9, 0);
      c.closePath();
    };
    contact(ctx, 1.4, -L * 0.45, 3.2, L * 0.55, 0.18);
    shape(ctx, build, { fill: steel, ink: 0.85, shadow: '#9ea8b6', shadowOffset: [-0.9, -0.3], gloss: [{ x: -0.7, y: -L * 0.22, rx: 0.45, ry: L * 0.16, alpha: 0.9 }] });
  });
}

// ---------------------------------------------------------------------------
// Plates & boards
// ---------------------------------------------------------------------------

interface PlateOpts { band?: string; well?: number; th?: number; col?: string; ink?: number }

/** A white trattoria pasta plate (piatto fondo) in 3/4 view; returns the well ellipse. */
function plate(ctx: Ctx, x: number, y: number, rx: number, ry: number, o: PlateOpts = {}) {
  const th = o.th ?? 2.6;
  const col = o.col ?? '#fbf8f1';
  const ink = o.ink ?? 1.7;
  contact(ctx, x + 2.5, y + th + 1.2, rx * 1.04, ry * 1.06, 0.32);
  group(ctx, [
    { build: (c) => ellipsePath(c, x, y + th, rx * 0.985, ry), style: { fill: '#d6cbb6', shadow: 'none' } },
    { build: (c) => ellipsePath(c, x, y, rx, ry), style: { fill: rgrad(ctx, x - rx * 0.4, y - ry * 0.6, 2, rx * 1.3, [[0, '#ffffff'], [0.5, col], [1, '#ebe3d3']]), shadow: 'none' } },
  ], ink);
  // underside shading
  clip(ctx, (c) => ellipsePath(c, x, y + th, rx * 0.985, ry), () => {
    fillP(ctx, (c) => ellipsePath(c, x + rx * 0.5, y + th + ry * 0.4, rx * 0.8, ry), '#b9ab93', 0.55);
  });
  // decorative band(s)
  const wk = o.well ?? 0.66;
  if (o.band) {
    ctx.save();
    ctx.strokeStyle = o.band;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ellipsePath(ctx, x, y, rx * 0.9, ry * 0.88);
    ctx.stroke();
    ctx.lineWidth = 0.55;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ellipsePath(ctx, x, y, rx * 0.84, ry * 0.815);
    ctx.stroke();
    ctx.restore();
  }
  // the well: shadowed inner wall at the upper left, lit at the lower right
  const wx = x, wy = y + ry * 0.05, wrx = rx * wk, wry = ry * wk * 0.97;
  const well: Build = (c) => ellipsePath(c, wx, wy, wrx, wry);
  fillP(ctx, well, '#f2ebde');
  crescent(ctx, well, [2.6, 2.4], '#cbbca2', 0.85);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(wx, wy, wrx, wry, 0, 0.15, Math.PI * 0.85);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();
  // rim gloss
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.95, ry * 0.93, 0, Math.PI * 1.08, Math.PI * 1.42);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  glint(ctx, x + rx * 0.62, y + ry * 0.62, 1.8, 0.7, -0.5, 0.8);
  return { x: wx, y: wy, rx: wrx, ry: wry };
}

/** A round olive-wood board (tagliere) in 3/4 view. */
function board(ctx: Ctx, x: number, y: number, rx: number, ry: number, seed: number) {
  const th = 3.4;
  const wood = '#c58a4e';
  contact(ctx, x + 2.5, y + th + 1.2, rx * 1.04, ry * 1.08, 0.34);
  group(ctx, [
    { build: (c) => ellipsePath(c, x, y + th, rx * 0.99, ry), style: { fill: '#8f5a2c', shadow: 'none' } },
    { build: (c) => ellipsePath(c, x, y, rx, ry), style: { fill: rgrad(ctx, x - rx * 0.35, y - ry * 0.5, 2, rx * 1.2, [[0, '#dca66a'], [0.6, wood], [1, '#a66f3c']]), shadow: 'none' } },
  ], 1.7);
  // end grain on the side band
  clip(ctx, (c) => ellipsePath(c, x, y + th, rx * 0.99, ry), () => {
    const R = rng(seed + 3);
    for (let i = 0; i < 26; i++) {
      const a = 0.1 + (i / 26) * (Math.PI - 0.2);
      const px = x + Math.cos(a) * rx;
      line(ctx, [[px, y + Math.sin(a) * ry], [px + (R() - 0.5) * 0.6, y + Math.sin(a) * ry + th]], 0.35, '#6e4220', false, 0.5);
    }
  });
  // wood grain: soft wavy streaks
  clip(ctx, (c) => ellipsePath(c, x, y, rx, ry), () => {
    const R = rng(seed);
    for (let i = 0; i < 13; i++) {
      const gy = y - ry + (i + 0.5) * (ry * 2 / 13);
      const pts: Pt[] = [];
      for (let k = 0; k <= 8; k++) pts.push([x - rx + (k / 8) * rx * 2, gy + Math.sin(k * 0.9 + i * 1.7) * 1.1 + (R() - 0.5) * 0.6]);
      line(ctx, pts, 0.45 + R() * 0.35, i % 3 === 0 ? '#9a6232' : '#b0743e', true, 0.55);
    }
    // a knot
    ctx.save();
    ctx.strokeStyle = rgba('#8a5428', 0.55);
    ctx.lineWidth = 0.5;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ellipsePath(ctx, x + rx * 0.5, y + ry * 0.35, 2 + k * 1.4, 0.9 + k * 0.7, 0.1);
      ctx.stroke();
    }
    ctx.restore();
  });
  crescent(ctx, (c) => ellipsePath(c, x, y, rx, ry), [-3, -2.4], '#6e4220', 0.35);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.96, ry * 0.92, 0, Math.PI * 1.06, Math.PI * 1.4);
  ctx.strokeStyle = 'rgba(255,236,200,0.75)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// PASTA: a twirled nest of strands (spaghetti, bucatini, tonnarelli, ribbons)
// ---------------------------------------------------------------------------

type PastaKind = 'round' | 'ribbon' | 'tube' | 'square';
interface PastaStyle {
  kind: PastaKind;
  /** strand width */
  w: number;
  /** strand colour (already coated in its sauce) */
  col: string;
  /** dark tone between strands */
  gap?: string;
  /** highlight tone */
  hi?: string;
  /** strength of the shading overlay */
  shadeA?: number;
}

interface Nest {
  x: number; y: number; rx: number; h: number;
  sil: Build;
  /** point on the dome surface: a = angle (π/2 = front), t = height 0..1, d = radial scale (1 = surface) */
  at(a: number, t: number, d?: number): Pt;
}

/** Plate tilt (ry / rx) shared by every 3/4 ellipse; the view elevation follows from it. */
const TILT = 0.46;
const COS_E = Math.sqrt(1 - TILT * TILT);

/**
 * A flat egg-pasta ribbon (fettuccine, tagliatelle) along `pts`: its width breathes as it twists
 * (narrow where it turns edge-on), with a soft flat sheen and a crisp lit upper edge.
 */
function ribbon(ctx: Ctx, pts: Pt[], st: PastaStyle, gap: string, hi: string) {
  const w = st.w;
  const n = pts.length;
  const up: Pt[] = [], dn: Pt[] = [], mid: Pt[] = [], edge: Pt[] = [];
  let s = 0;
  const ph = (pts[0][0] * 0.37 + pts[0][1] * 0.71) % TAU;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    // normal pointing up the screen
    let nx = -ty, ny = tx;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const hw = w * 0.5 * (0.5 + 0.5 * Math.abs(Math.cos(ph + s * 0.13)));
    const [x, y] = pts[i];
    up.push([x + nx * hw, y + ny * hw]);
    dn.push([x - nx * hw, y - ny * hw]);
    mid.push([x + nx * hw * 0.1, y + ny * hw * 0.1]);
    edge.push([x + nx * hw * 0.68, y + ny * hw * 0.68]);
  }
  const body: Build = (c) => smoothPath(c, [...up, ...dn.reverse()], true, 0.5);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  body(ctx);
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = gap;
  ctx.stroke();
  ctx.fillStyle = st.col;
  ctx.fill();
  ctx.restore();
  line(ctx, dn, 0.6, shade(st.col, 0.2), true, 0.6);
  line(ctx, mid, w * 0.38, light(st.col, 0.3), true, 0.4);
  line(ctx, edge, w * 0.14, hi, true, 0.9);
}

function strand(ctx: Ctx, pts: Pt[], st: PastaStyle, gap: string, hi: string) {
  if (st.kind === 'ribbon') return ribbon(ctx, pts, st, gap, hi);
  const w = st.w;
  const under = st.kind === 'tube' ? 1.0 : 0.85;
  line(ctx, pts, w + under, gap, true, 0.95);
  line(ctx, pts, w, st.col, true);
  const shift = (dy: number) => pts.map(([x, y]) => [x, y + dy * w] as Pt);
  if (st.kind === 'square') {
    // tonnarelli: a square section, so a crisp flat highlight and a shaded lower face
    line(ctx, shift(0.3), w * 0.22, shade(st.col, 0.18), true, 0.6);
    line(ctx, pts.map(([x, y]) => [x - w * 0.08, y - w * 0.24] as Pt), w * 0.22, hi, true, 0.9);
    return;
  }
  line(ctx, pts.map(([x, y]) => [x - w * 0.08, y - w * 0.24] as Pt), w * 0.3, hi, true, 0.75);
}

/**
 * Paint a twirled nest of long pasta: a slightly irregular dome wound with interleaved helical
 * strands (the swirl shows on the top), a few strands crossing over, cel shading and glints.
 * (x,y) = centre of its base on the plate; h = projected height.
 */
function nest(ctx: Ctx, x: number, y: number, rx: number, h: number, st: PastaStyle, seed: number): Nest {
  const R = rng(seed);
  const gap = st.gap ?? shade(st.col, 0.5);
  const hi = st.hi ?? light(st.col, 0.6);
  const w = st.w;
  const p1 = R() * TAU, p2 = R() * TAU;
  const k = (a: number) => 1 + 0.04 * Math.sin(2 * a + p1) + 0.03 * Math.sin(3 * a + p2) + 0.016 * Math.sin(7 * a + 2 * p1);
  const prof = (t: number) => rx * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.max(0, t)), 2.4)), 0.55);
  const at = (a: number, t: number, d = 1): Pt => {
    const r = prof(t) * k(a) * d;
    return [x + Math.cos(a) * r, y - h * t + Math.sin(a) * r * TILT];
  };
  // is the surface point (a, t) facing the viewer?
  const Z = h / COS_E;
  const vis = (a: number, t: number) => {
    const dt = 0.002;
    const t0 = Math.max(0, Math.min(1 - dt, t));
    const dr = (prof(t0 + dt) - prof(t0)) * k(a);
    const beta = Math.atan2(-dr, Z * dt);
    return Math.sin(beta) * TILT + Math.sin(a) * Math.cos(beta) * COS_E > -0.12;
  };
  // meridian arc length → height lookup, so strands are evenly spaced over the surface
  const N = 300;
  const sT: number[] = [0];
  for (let i = 1; i <= N; i++) sT.push(sT[i - 1] + Math.hypot(prof(i / N) - prof((i - 1) / N), Z / N));
  const S = sT[N];
  const tOf = (s: number) => {
    if (s <= 0) return 0;
    if (s >= S) return 1;
    let lo = 0, up = N;
    while (up - lo > 1) {
      const m = (lo + up) >> 1;
      if (sT[m] < s) lo = m;
      else up = m;
    }
    return (lo + (s - sT[lo]) / Math.max(1e-6, sT[up] - sT[lo])) / N;
  };
  // silhouette = union of the horizontal cross-sections
  const sil: Build = (c) => {
    for (let i = 0; i <= 44; i++) {
      const t = Math.pow(i / 44, 0.8) * 0.995;
      const pts: Pt[] = [];
      for (let j = 0; j < 20; j++) pts.push(at((j / 20) * TAU, t));
      smoothPath(c, pts, true);
    }
  };
  ctx.save();
  ctx.beginPath();
  sil(ctx);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  fillP(ctx, sil, gap);

  const drawRun = (run: Pt[]) => { if (run.length >= 3) strand(ctx, run, st, gap, hi); };
  /** walk a curve given by θ → (angle, arc length); draw its visible stretches */
  const walk = (th0: number, th1: number, f: (th: number) => [number, number]) => {
    let run: Pt[] = [];
    for (let th = th0; th <= th1 + 1e-6; th += 0.13) {
      const [a, s] = f(th);
      const t = tOf(s);
      if (s < -w * 0.4 || prof(t) < w * 1.1 || !vis(a, t)) {
        drawRun(run);
        run = [];
        continue;
      }
      run.push(at(a, t, 1 - (w * 0.3) / Math.max(rx * 0.2, prof(t))));
    }
    drawRun(run);
  };

  clip(ctx, sil, () => {
    // interleaved helices, broken into strands of random length
    const NS = 5;
    const gapS = w * 1.12;
    const pitch = (NS * gapS) / TAU;
    for (let i = 0; i < NS; i++) {
      const a0 = R() * TAU;
      const ph = R() * TAU;
      let th = 0;
      let sOff = -(i + 1) * gapS;
      const thMax = (S - sOff) / pitch + 1;
      while (th < thMax) {
        const len = Math.PI * (1.0 + R() * 2.2);
        const o = sOff;
        walk(th, th + len, (tt) => [a0 + tt, o + tt * pitch + Math.sin(tt * 2.1 + ph) * w * 0.22]);
        th += len + 0.16;
        sOff += (R() - 0.5) * 0.35 * gapS;
      }
    }
    // a few strands crossing over the twirl
    for (let c = 0; c < 4; c++) {
      const a0 = 0.1 + R() * 0.9;
      const span = 1.4 + R() * 1.2;
      const s0 = S * (0.1 + R() * 0.45);
      const ds = (R() < 0.5 ? -1 : 1) * gapS * (2.5 + R() * 2);
      walk(0, span, (tt) => [a0 + tt, s0 + (tt / span) * ds]);
    }
    // shading: soft dome light, darker toward the lower right
    const g = ctx.createRadialGradient(x - rx * 0.45, y - h * 0.75, rx * 0.1, x - rx * 0.1, y - h * 0.45, rx * 1.35);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba(shade(st.col, 0.45), st.shadeA ?? 0.34));
    ctx.fillStyle = g;
    ctx.fillRect(x - rx * 2, y - h * 2.5, rx * 4, h * 4);
  });
  crescent(ctx, sil, [-3.2, -2.8], shade(st.col, 0.5), 0.22);
  // specular glints on the lit strands
  for (let j = 0; j < 8; j++) {
    const p = at(Math.PI * (0.5 + R() * 0.45), 0.12 + R() * 0.7, 0.97);
    glint(ctx, p[0], p[1], w * (0.45 + R() * 0.3), w * 0.22, -0.35, 0.85);
  }
  return { x, y, rx, h, sil, at };
}

/** One strand escaping from under the nest and lying on the plate (draw BEFORE the nest). */
function looseStrand(ctx: Ctx, x: number, y: number, rx: number, st: PastaStyle, side = 1) {
  const gap = st.gap ?? shade(st.col, 0.5);
  const hi = st.hi ?? light(st.col, 0.6);
  const a = Math.PI / 2 - side * 0.62;
  const sx = x + Math.cos(a) * rx * 0.8, sy = y + Math.sin(a) * rx * TILT * 0.8;
  const pts: Pt[] = [[sx, sy], [sx + side * 6, sy + 3.6], [sx + side * 11, sy + 3.0], [sx + side * 14.5, sy + 0.8]];
  strand(ctx, pts, st, gap, hi);
  if (st.kind === 'tube') {
    // the cut end of a bucatino shows its hole
    const [ex, ey] = pts[pts.length - 1];
    shape(ctx, (c) => ellipsePath(c, ex + side * 0.3, ey - 0.3, st.w * 0.62, st.w * 0.5, -0.5 * side), { fill: light(st.col, 0.15), ink: 0.6, shadow: 'none' });
    fillP(ctx, (c) => ellipsePath(c, ex + side * 0.35, ey - 0.25, st.w * 0.26, st.w * 0.2, -0.5 * side), shade(st.col, 0.6));
  }
}

/** A puddle of sauce on the plate around the base of the nest. */
function pool(ctx: Ctx, x: number, y: number, rx: number, ry: number, col: string, seed: number, alpha = 1, ink = 0.9) {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, (c) => blobPath(c, x, y, rx, ry, 0.08, 12, seed), {
    fill: col, ink, inkColor: shade(col, 0.55), shadow: shade(col, 0.2), shadowOffset: [1.5, 1.2],
    gloss: [{ x: x - rx * 0.55, y: y + ry * 0.35, rx: rx * 0.18, ry: ry * 0.12, rot: -0.2, alpha: 0.65 }],
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Toppings
// ---------------------------------------------------------------------------

function basilLeaf(ctx: Ctx, x: number, y: number, L: number, a: number, o: { col?: string; ink?: number; sy?: number } = {}) {
  const col = o.col ?? '#3f9a3c';
  const ink = o.ink ?? 0.9;
  rot(ctx, x, y, a, () => {
    const w = L * 0.34;
    const build: Build = (c) => {
      c.moveTo(-L * 0.5, 0);
      c.bezierCurveTo(-L * 0.36, -w * 1.3, L * 0.22, -w * 1.2, L * 0.5, 0);
      c.bezierCurveTo(L * 0.2, w * 1.05, -L * 0.34, w * 1.15, -L * 0.5, 0);
      c.closePath();
    };
    shape(ctx, build, {
      fill: rgrad(ctx, -L * 0.15, -w * 0.5, 0.5, L * 0.8, [[0, light(col, 0.3)], [0.6, col], [1, shade(col, 0.15)]]),
      ink, shadow: shade(col, 0.3), shadowOffset: [-L * 0.04, -w * 0.55],
      gloss: [{ x: -L * 0.05, y: -w * 0.45, rx: L * 0.2, ry: w * 0.16, rot: -0.1, alpha: 0.55 }],
    });
    const vein = shade(col, 0.32);
    line(ctx, [[-L * 0.46, 0.1], [0, -w * 0.08], [L * 0.42, 0]], Math.max(0.3, L * 0.04), vein, true, 0.8);
    for (let i = 0; i < 3; i++) {
      const vx = -L * 0.3 + i * L * 0.2;
      line(ctx, [[vx, -w * 0.04], [vx + L * 0.1, -w * 0.62]], Math.max(0.25, L * 0.025), vein, true, 0.55);
      line(ctx, [[vx, w * 0.04], [vx + L * 0.1, w * 0.58]], Math.max(0.25, L * 0.025), vein, true, 0.55);
    }
  }, 1, o.sy ?? 1);
}

/** A crisp nugget of guanciale (carbonara): amber rendered fat, a deep red meat streak, browned crisp edges. */
function guancialeBit(ctx: Ctx, x: number, y: number, s: number, a: number, seed: number) {
  const R = rng(seed);
  rot(ctx, x, y, a, () => {
    const pts: Pt[] = [[-s * 0.55, -s * 0.3], [-s * 0.1, -s * 0.4], [s * 0.5, -s * 0.34], [s * 0.6, s * 0.06], [s * 0.42, s * 0.3], [-s * 0.2, s * 0.32], [-s * 0.6, s * 0.12]]
      .map(([px, py]) => [px * (0.9 + R() * 0.2), py * (0.9 + R() * 0.2)] as Pt);
    const top: Build = (c) => smoothPath(c, pts, true, 0.3);
    const side: Build = (c) => smoothPath(c, pts.map(([px, py]) => [px, py + s * 0.3] as Pt), true, 0.3);
    group(ctx, [
      { build: side, style: { fill: '#8e4220', shadow: 'none' } },
      { build: top, style: { fill: '#efbb66', shadow: 'none' } },
    ], 0.8);
    clip(ctx, top, () => {
      fillP(ctx, (c) => polyPath(c, [[-s, s * 0.02], [s, -s * 0.1], [s, s * 0.12], [-s, s * 0.22]]), '#a8432c');
      line(ctx, [[-s, s * 0.06], [s, -s * 0.06]], s * 0.06, '#cf6a4a', false, 0.8);
      ctx.save();
      ctx.beginPath();
      smoothPath(ctx, pts, true, 0.3);
      ctx.lineWidth = s * 0.24;
      ctx.strokeStyle = 'rgba(176,98,40,0.85)';
      ctx.stroke();
      ctx.restore();
    });
    clip(ctx, side, () => fillP(ctx, (c) => polyPath(c, [[-s, s * 0.34], [s, s * 0.24], [s, s * 0.44], [-s, s * 0.54]]), '#6e2a14', 0.7));
    glint(ctx, -s * 0.24, -s * 0.18, s * 0.22, s * 0.08, -0.15, 0.9);
  });
}

/** A crisp strip of guanciale (amatriciana): white fat over a red-pink meat band, golden crisp edges. */
function guancialeStrip(ctx: Ctx, x: number, y: number, L: number, a: number) {
  rot(ctx, x, y, a, () => {
    const h = L * 0.42;
    const top: Build = (c) => roundRectPath(c, -L / 2, -h / 2, L, h, h * 0.3);
    const side: Build = (c) => roundRectPath(c, -L / 2, -h / 2 + h * 0.42, L, h, h * 0.3);
    group(ctx, [
      { build: side, style: { fill: '#9a4a26', shadow: 'none' } },
      { build: top, style: { fill: '#f8e8cc', shadow: 'none' } },
    ], 0.8);
    clip(ctx, top, () => {
      fillP(ctx, (c) => polyPath(c, [[-L, -h * 0.06], [L, -h * 0.14], [L, h * 0.3], [-L, h * 0.36]]), '#c8443a');
      line(ctx, [[-L / 2, h * 0.05], [L / 2, -h * 0.03]], h * 0.1, '#e2786a', false, 0.85);
      ctx.save();
      ctx.beginPath();
      roundRectPath(ctx, -L / 2, -h / 2, L, h, h * 0.3);
      ctx.lineWidth = h * 0.28;
      ctx.strokeStyle = 'rgba(206,138,64,0.6)';
      ctx.stroke();
      ctx.restore();
    });
    clip(ctx, side, () => fillP(ctx, (c) => polyPath(c, [[-L, h * 0.42], [L, h * 0.36], [L, h * 0.6], [-L, h * 0.66]]), '#7a2a18', 0.6));
    glint(ctx, -L * 0.18, -h * 0.26, L * 0.18, h * 0.1, 0, 0.9);
  });
}

/** Cracked black pepper. */
function pepper(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, size = 0.42) {
  speckle(ctx, cx, cy, rx, ry, n, '#2a1b14', size, seed, 0.95);
  speckle(ctx, cx, cy, rx, ry, Math.round(n * 0.35), '#5a3e2c', size * 0.8, seed + 7, 0.9);
}

/** Finely grated cheese snow (+ a few bigger crumbs). */
function cheeseSnow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, col = '#fffaf0') {
  speckle(ctx, cx, cy, rx, ry, n, col, 0.36, seed, 0.95);
  speckle(ctx, cx, cy, rx * 0.8, ry * 0.8, Math.round(n * 0.25), col, 0.55, seed + 3, 0.95);
}

/** Glossy spoon of sauce draped over the top of the nest, with drips down the front. */
function sauceDollop(ctx: Ctx, x: number, y: number, rx: number, ry: number, col: string, seed: number, drips = 5) {
  const R = rng(seed);
  const pts: Pt[] = [];
  const n = 22;
  // a few soft lobes where the sauce slides down the front of the nest
  const lobes: number[] = [];
  for (let j = 0; j < drips; j++) lobes.push(Math.PI * (0.18 + (0.64 * (j + 0.5)) / drips) + (R() - 0.5) * 0.25);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    let k = 0.94 + R() * 0.08;
    for (const la of lobes) {
      const d = Math.abs(Math.atan2(Math.sin(a - la), Math.cos(a - la)));
      if (d < 0.32) k += (0.32 - d) * 1.6 * (0.6 + R() * 0.5);
    }
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  const build: Build = (c) => smoothPath(c, pts, true, 0.5);
  shape(ctx, build, {
    fill: rgrad(ctx, x - rx * 0.3, y - ry * 0.5, 0.5, rx * 1.2, [[0, light(col, 0.22)], [0.55, col], [1, shade(col, 0.18)]]),
    ink: 1.0, shadow: shade(col, 0.28), shadowOffset: [-1.6, -1.5],
    gloss: [
      { x: x - rx * 0.35, y: y - ry * 0.35, rx: rx * 0.26, ry: ry * 0.16, rot: -0.35, alpha: 0.85 },
      { x: x + rx * 0.3, y: y + ry * 0.05, rx: rx * 0.07, ry: ry * 0.08, alpha: 0.6 },
    ],
  });
  clip(ctx, build, () => {
    speckle(ctx, x, y, rx * 0.8, ry * 0.8, 10, shade(col, 0.22), 0.7, seed + 1, 0.8);
    speckle(ctx, x, y, rx * 0.7, ry * 0.7, 6, light(col, 0.3), 0.5, seed + 2, 0.7);
  });
}

/** Small glossy clumps of sauce caught between the strands. */
function sauceBits(ctx: Ctx, n: Nest, col: string, count: number, seed: number, size = 1) {
  const R = rng(seed);
  for (let i = 0; i < count; i++) {
    const p = n.at(Math.PI * (0.1 + R() * 0.8), 0.12 + R() * 0.75, 0.96);
    const rx = (1.8 + R() * 1.5) * size, ry = (0.9 + R() * 0.5) * size;
    shape(ctx, (c) => blobPath(c, p[0], p[1], rx, ry, 0.2, 7, i + seed), {
      fill: col, ink: 0, shadow: shade(col, 0.25), shadowOffset: [-0.5, -0.6], gloss: [{ x: p[0] - rx * 0.35, y: p[1] - ry * 0.35, rx: rx * 0.35, ry: ry * 0.3, alpha: 0.9 }],
    });
  }
}

/** Italian parsley, finely chopped. */
function parsley(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R());
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    const s = 0.38 + R() * 0.42;
    shape(ctx, (c) => blobPath(c, x, y, s * 1.2, s * 0.6, 0.5, 5, i + seed), { fill: R() < 0.5 ? '#36962e' : '#26742a', ink: 0.28, inkColor: '#1c4214', shadow: 'none' });
  }
}

function chiliFlakes(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R());
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    fillP(ctx, (c) => ellipsePath(c, x, y, 0.6 + R() * 0.3, 0.32, R() * 3), R() < 0.6 ? '#d8281a' : '#f04a22');
  }
}

/** One clam valve seen from inside: an egg-shaped fan, narrow at the hinge (0,0), opening along +x. */
function valvePath(c: Ctx, s: number) {
  c.moveTo(0, 0);
  c.bezierCurveTo(s * 0.25, -s * 0.5, s * 1.1, -s * 0.62, s * 1.32, -s * 0.05);
  c.bezierCurveTo(s * 1.4, s * 0.45, s * 0.6, s * 0.62, s * 0.2, s * 0.42);
  c.quadraticCurveTo(-s * 0.05, s * 0.25, 0, 0);
  c.closePath();
}

/**
 * An open clam (vongola verace) seen from above: one valve flipped open shows its striped outside,
 * the other shows its nacre inside with the clam in it. (x,y) = hinge.
 */
function clamOpen(ctx: Ctx, x: number, y: number, s: number, a: number, seed: number) {
  const R = rng(seed);
  const col = R() < 0.5 ? '#d9c6a6' : '#cfb999';
  rot(ctx, x, y, a, () => {
    // the flipped valve, umbo toward the hinge
    rot(ctx, -s * 0.6, s * 0.04, Math.PI / 2 - 0.12, () => shellOut(ctx, s * 0.9, col));
    // the valve holding the clam
    const inner: Build = (c) => { c.save(); c.rotate(-0.12); valvePath(c, s * 0.92); c.restore(); };
    shape(ctx, inner, { fill: '#efe5ec', ink: 0.9, shadow: 'none' });
    clip(ctx, inner, () => {
      fillP(ctx, (c) => ellipsePath(c, s * 0.25, 0, s * 0.5, s * 0.36), rgba('#9c7cc0', 0.5));
      ctx.save();
      ctx.beginPath();
      inner(ctx);
      ctx.lineWidth = s * 0.34;
      ctx.strokeStyle = col;
      ctx.stroke();
      ctx.lineWidth = s * 0.12;
      ctx.strokeStyle = '#7a6250';
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.restore();
    });
    const mx = s * 0.66, my = -s * 0.1;
    shape(ctx, (c) => blobPath(c, mx, my, s * 0.5, s * 0.32, 0.14, 8, seed), {
      fill: '#f4a868', ink: 0.6, inkColor: '#8a4a2a', shadow: '#d97e44', shadowOffset: [-s * 0.1, -s * 0.11],
      gloss: [{ x: mx - s * 0.16, y: my - s * 0.1, rx: s * 0.2, ry: s * 0.08, alpha: 0.9 }],
    });
    line(ctx, [[mx - s * 0.3, my + s * 0.1], [mx, my + s * 0.15], [mx + s * 0.28, my + s * 0.06]], 0.5, '#c8602e', true, 0.75);
    fillP(ctx, (c) => ellipsePath(c, -s * 0.02, s * 0.02, s * 0.16, s * 0.11), '#4a3024');
  }, 1, 0.82);
}

/** The outer valve of a vongola (umbo up), centred on the origin: striped, ridged, glossy. */
function shellOut(ctx: Ctx, s: number, col: string) {
  const b: Build = (c) => {
    c.moveTo(-s * 0.1, -s * 0.66);
    c.bezierCurveTo(s * 0.5, -s * 0.64, s * 1.08, -s * 0.2, s * 1.0, s * 0.18);
    c.bezierCurveTo(s * 0.92, s * 0.66, -s * 0.92, s * 0.66, -s * 1.0, s * 0.18);
    c.bezierCurveTo(-s * 1.05, -s * 0.25, -s * 0.6, -s * 0.64, -s * 0.1, -s * 0.66);
    c.closePath();
  };
  shape(ctx, b, { fill: col, ink: 0.9, shadow: shade(col, 0.3), shadowOffset: [-s * 0.18, -s * 0.2], gloss: [{ x: -s * 0.38, y: -s * 0.22, rx: s * 0.34, ry: s * 0.11, rot: -0.3, alpha: 0.8 }] });
  clip(ctx, b, () => {
    // brown chevrons of the vongola verace, then the growth rings
    for (let k = 0; k < 5; k++) {
      const px = -s * 0.75 + k * s * 0.36;
      line(ctx, [[px, -s * 0.2], [px + s * 0.14, s * 0.02], [px - s * 0.04, s * 0.22], [px + s * 0.12, s * 0.48]], s * 0.12, '#7a5c44', false, 0.45);
    }
    for (let k = 1; k <= 4; k++) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(-s * 0.1, -s * 0.66, s * 0.3 * k, s * 0.31 * k, 0, 0.12, Math.PI - 0.12);
      ctx.strokeStyle = '#6e5644';
      ctx.lineWidth = k === 4 ? 0.6 : 0.45;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.restore();
    }
  });
  fillP(ctx, (c) => ellipsePath(c, -s * 0.12, -s * 0.6, s * 0.14, s * 0.08), '#6a5040');
}

/** A clam lying closed (or an empty valve face down). */
function clamClosed(ctx: Ctx, x: number, y: number, s: number, a: number, seed: number) {
  const R = rng(seed);
  const col = R() < 0.5 ? '#d9c6a6' : '#cfb999';
  rot(ctx, x, y, a, () => shellOut(ctx, s, col), 1, 0.85);
}

// ---------------------------------------------------------------------------
// The pasta dishes
// ---------------------------------------------------------------------------

const NEST_RX = 28.5;
const NEST_H = 22;

/** Shared table + plate layout for the pasta plates. Returns the well. */
function pastaTable(ctx: Ctx, band: string, napkinCol: string) {
  napkin(ctx, [-57, -3], [-24, -7], [-20, 35], [-56, 36], napkinCol);
  fork(ctx, -46.5, 33, 34, -0.07);
  return plate(ctx, 6, 12, 48, 23, { band });
}

/** Two soft wisps of steam rising from a hot dish; (x,y) = where they start. */
function steam(ctx: Ctx, x: number, y: number, h: number, seed: number) {
  const R = rng(seed);
  for (const dx of [-6, 5.5]) {
    const x0 = x + dx + (R() - 0.5) * 2;
    const ph = R() * TAU;
    const hh = h * (0.8 + R() * 0.3);
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push([x0 + Math.sin(ph + t * 5.2) * (1 + t * 2.4), y - t * hh]);
    }
    line(ctx, pts.slice(0, 8), 3.6, '#ffffff', true, 0.1);
    line(ctx, pts.slice(1, 7), 2.2, '#ffffff', true, 0.2);
    line(ctx, pts.slice(2, 6), 1.1, '#ffffff', true, 0.38);
  }
}

/** Pool + a loose strand + nest + steam: the common plating. */
function platePasta(ctx: Ctx, band: string, napkinCol: string, poolCol: string, poolA: number, st: PastaStyle, seed: number, h = NEST_H) {
  const well = pastaTable(ctx, band, napkinCol);
  pool(ctx, well.x + 1, well.y + 3.5, well.rx * 0.86, well.ry * 0.6, poolCol, seed + 1, poolA);
  const bx = well.x, by = well.y + 2.5;
  looseStrand(ctx, bx, by, NEST_RX, st, seed % 2 ? 1 : -1);
  steam(ctx, bx, by - h - 9, 17, seed + 5);
  return nest(ctx, bx, by, NEST_RX, h, st, seed);
}

function drawPomodoro(ctx: Ctx) {
  const st: PastaStyle = { kind: 'round', w: 1.75, col: '#e8673a', gap: '#9a2814', hi: '#ffc19a' };
  const n = platePasta(ctx, '#c0392b', '#d23a32', '#d8401f', 1, st, 101);
  sauceBits(ctx, n, '#d8361e', 5, 13);
  // a spoon of sauce on top, then basil
  sauceDollop(ctx, n.x - 0.5, n.y - n.h * 0.93, 12.5, 6, '#d6301c', 21, 6);
  basilLeaf(ctx, n.x + 4.5, n.y - n.h * 1.08, 11, -0.35, { col: '#3e9a3a' });
  basilLeaf(ctx, n.x - 5.5, n.y - n.h * 1.02, 9, -2.6, { col: '#35893a' });
  basilLeaf(ctx, n.x + 0.5, n.y - n.h * 1.15, 7, -1.5, { col: '#4aa843' });
}

function drawCarbonara(ctx: Ctx) {
  const st: PastaStyle = { kind: 'round', w: 1.75, col: '#f7d25a', gap: '#b88320', hi: '#fff8d0', shadeA: 0.26 };
  const n = platePasta(ctx, '#b5651d', '#d23a32', '#f5ca52', 1, st, 202);
  // glossy clumps of the egg-and-Pecorino cream clinging to the strands
  sauceBits(ctx, n, '#fde296', 8, 55);
  // crisp guanciale on top and on the plate
  const bits: [number, number, number, number, number][] = [
    [-0.3, 0.95, 0.45, 4.8, 0.2], [2.2, 0.85, 0.75, 4.6, -0.3], [1.3, 0.98, 0.2, 4.4, 0.5], [0.9, 0.62, 0.95, 4.6, 0.1], [2.6, 0.5, 0.95, 4.4, -0.5], [0.25, 0.42, 0.95, 4.2, 0.4],
  ];
  bits.forEach(([a, t, d, s, r], i) => {
    const p = n.at(a, t, d);
    guancialeBit(ctx, p[0], p[1], s, r, 300 + i);
  });
  guancialeBit(ctx, n.x - 23, n.y + 9.5, 4, 0.3, 320);
  // Pecorino dust and plenty of black pepper
  cheeseSnow(ctx, n.x - 1, n.y - n.h * 0.85, 13, 5.5, 50, 31);
  pepper(ctx, n.x, n.y - n.h * 0.55, 22, 13, 110, 41);
}

function drawAlfredo(ctx: Ctx) {
  const st: PastaStyle = { kind: 'ribbon', w: 3.2, col: '#f6d880', gap: '#bf8c3c', hi: '#fffbe6', shadeA: 0.3 };
  const n = platePasta(ctx, '#b5651d', '#d23a32', '#f2d482', 1, st, 303);
  // the butter-and-Parmigiano emulsion: glossy, pale gold
  sauceBits(ctx, n, '#f9e39c', 8, 66, 1.15);
  const R = rng(67);
  for (let i = 0; i < 12; i++) {
    const p = n.at(Math.PI * (0.35 + R() * 0.55), 0.12 + R() * 0.8, 0.95);
    glint(ctx, p[0], p[1], 1.7 + R(), 0.55, -0.3, 0.85);
  }
  // finely grated Parmigiano Reggiano over the top
  cheeseSnow(ctx, n.x, n.y - n.h * 0.82, 15, 6.5, 150, 32, '#fff8e2');
  speckle(ctx, n.x, n.y - n.h * 0.82, 13, 5.5, 30, '#e3c47a', 0.45, 34, 0.9);
}

function drawAmatriciana(ctx: Ctx) {
  const st: PastaStyle = { kind: 'tube', w: 2.5, col: '#dc5a2e', gap: '#83200f', hi: '#ffb487', shadeA: 0.3 };
  const n = platePasta(ctx, '#b5651d', '#d23a32', '#c8361c', 1, st, 404);
  sauceBits(ctx, n, '#c9301a', 8, 24, 1.1);
  // crisp guanciale strips
  const strips: [number, number, number, number, number][] = [
    [-1.2, 0.97, 0.5, 7.6, -0.3], [0.4, 0.97, 0.5, 7.4, 0.35], [1.6, 0.99, 0.15, 7, 0.05], [2.55, 0.6, 0.95, 7, -0.6], [0.5, 0.6, 0.95, 7, 0.55], [1.55, 0.42, 0.97, 6.8, 0.15],
  ];
  for (const [a, t, d, L, r] of strips) {
    const p = n.at(a, t, d);
    guancialeStrip(ctx, p[0], p[1], L, r);
  }
  // grated Pecorino Romano and a few chili flakes
  cheeseSnow(ctx, n.x, n.y - n.h * 0.9, 13, 5.5, 90, 34);
  chiliFlakes(ctx, n.x, n.y - n.h * 0.65, 15, 8, 7, 35);
}

function drawCacioePepe(ctx: Ctx) {
  const st: PastaStyle = { kind: 'square', w: 2.0, col: '#f4ebd3', gap: '#b9a77e', hi: '#ffffff', shadeA: 0.36 };
  const n = platePasta(ctx, '#b5651d', '#d23a32', '#f1e8d2', 1, st, 505);
  // the Pecorino cream clinging in glossy folds
  sauceBits(ctx, n, '#fbf5e4', 10, 88);
  cheeseSnow(ctx, n.x, n.y - n.h * 0.85, 14, 6, 70, 37);
  // freshly cracked black pepper, generously
  pepper(ctx, n.x, n.y - n.h * 0.6, 22, 13, 170, 42, 0.52);
  pepper(ctx, n.x, n.y + 9, 26, 4, 22, 43, 0.42);
}

function drawRagu(ctx: Ctx) {
  const st: PastaStyle = { kind: 'ribbon', w: 3.0, col: '#f0c264', gap: '#a46a2a', hi: '#fff1c2', shadeA: 0.3 };
  const n = platePasta(ctx, '#8e2a1e', '#d23a32', '#a9502e', 1, st, 606, 20);
  // a generous ladle of ragù: a crumbly brown-red meat heap
  const R = rng(99);
  const cx = n.x - 0.5, cy = n.y - n.h * 0.92;
  // the heap, slumping down the front of the nest in two soft lobes
  const heap: Build = (c) => {
    blobPath(c, cx, cy, 15.5, 8, 0.14, 14, 61);
    blobPath(c, cx - 7.5, cy + 6, 5.2, 3.6, 0.2, 9, 62);
    blobPath(c, cx + 6.5, cy + 6.8, 4, 3.2, 0.2, 9, 63);
  };
  shape(ctx, heap, { fill: '#8a3a20', ink: 1.1, shadow: '#5e2212', shadowOffset: [-2, -1.8] });
  clip(ctx, heap, () => {
    for (let i = 0; i < 100; i++) {
      const a = R() * TAU, d = Math.sqrt(R());
      const x = cx + Math.cos(a) * 14.5 * d, y = cy + 1.5 + Math.sin(a) * 9.5 * d;
      const r = 0.9 + R() * 0.9;
      const lit = (x - cx) * -0.6 + (y - cy) * -1 > 0;
      shape(ctx, (c) => blobPath(c, x, y, r, r * 0.8, 0.3, 6, i), {
        fill: lit ? (R() < 0.5 ? '#ac562e' : '#9c4a26') : (R() < 0.5 ? '#7a321a' : '#6c2a16'), ink: 0.3, inkColor: '#3e160a', shadow: 'none',
      });
    }
    // soffritto flecks and oily tomato shine
    speckle(ctx, cx, cy, 12, 6.5, 14, '#e0782e', 0.45, 62, 0.9);
    speckle(ctx, cx, cy, 12, 6.5, 10, '#c9452a', 0.6, 63, 0.9);
  });
  crescent(ctx, heap, [-2.2, -1.8], '#4a1a0c', 0.35);
  glint(ctx, cx - 6, cy - 3.2, 2.2, 0.9, -0.3, 0.75);
  glint(ctx, cx - 1, cy - 4.4, 1.2, 0.5, -0.2, 0.7);
  glint(ctx, cx + 5, cy - 2.5, 0.8, 0.4, -0.2, 0.6);
}

function drawVongole(ctx: Ctx) {
  const st: PastaStyle = { kind: 'round', w: 1.7, col: '#f5d97f', gap: '#b98a2e', hi: '#fffbe2', shadeA: 0.28 };
  const well = pastaTable(ctx, '#2d6fb5', '#2f6fc0');
  pool(ctx, well.x + 1, well.y + 3.5, well.rx * 0.88, well.ry * 0.62, '#f1dc9a', 18, 0.7);
  const bx = well.x, by = well.y + 2.5;
  // clams tucked behind the nest
  clamOpen(ctx, bx - 22.5, by - 8.5, 5.6, 0.2, 1);
  clamClosed(ctx, bx + 25.5, by - 7, 5.6, 0.3, 2);
  looseStrand(ctx, bx, by, 25.5, st, 1);
  steam(ctx, bx, by - 28, 16, 712);
  const n = nest(ctx, bx, by, 25.5, 19, st, 707);
  // olive-oil sheen
  const R = rng(111);
  for (let i = 0; i < 9; i++) {
    const p = n.at(Math.PI * (0.3 + R() * 0.6), 0.1 + R() * 0.75, 0.96);
    glint(ctx, p[0], p[1], 1.4 + R(), 0.5, -0.3, 0.75);
  }
  parsley(ctx, n.x, n.y - n.h * 0.6, 20, 10, 60, 71);
  // clams on top and around the front
  clamOpen(ctx, n.x - 4, n.y - n.h * 0.98, 5.2, -0.12, 4);
  clamClosed(ctx, n.x + 11, n.y - n.h * 0.68, 4.9, 0.45, 5);
  clamOpen(ctx, n.x - 17.5, n.y + 7, 5.8, -0.18, 6);
  clamClosed(ctx, n.x + 1.5, n.y + 12, 5.3, 0.05, 7);
  clamOpen(ctx, n.x + 18.5, n.y + 8.5, 5.8, 0.22, 8);
  parsley(ctx, n.x + 2, n.y - n.h * 0.85, 9, 3.5, 20, 74);
  parsley(ctx, well.x, well.y + 9, well.rx * 0.85, well.ry * 0.3, 22, 72);
  chiliFlakes(ctx, n.x, n.y - n.h * 0.55, 17, 9, 6, 73);
}

/** Trofie: a short hand-rolled twist, tapered at both ends, a little curved. (x,y) = centre. */
function trofia(ctx: Ctx, x: number, y: number, L: number, a: number, col: string, bend: number) {
  rot(ctx, x, y, a, () => {
    const w = L * 0.17;
    const N = 8;
    const top: Pt[] = [], bot: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const px = -L / 2 + u * L;
      const py = Math.sin(u * Math.PI) * bend * L * 0.12;
      const hw = w * Math.pow(Math.sin(u * Math.PI), 0.7) + 0.15;
      top.push([px, py - hw]);
      bot.push([px, py + hw]);
    }
    const build: Build = (c) => smoothPath(c, [...top, ...bot.reverse()], true, 0.4);
    shape(ctx, build, { fill: col, ink: 0.6, shadow: shade(col, 0.32), shadowOffset: [-0.4, -0.6] });
    clip(ctx, build, () => {
      for (let i = -3; i <= 3; i++) {
        const gx = i * L * 0.13;
        line(ctx, [[gx - w * 0.9, -w * 1.4 + bend * L * 0.1], [gx + w * 0.9, w * 1.4 + bend * L * 0.1]], 0.42, shade(col, 0.4), false, 0.85);
      }
    });
    glint(ctx, -L * 0.1, -w * 0.4 + bend * L * 0.08, L * 0.14, w * 0.25, 0, 0.75);
  }, 1, 0.85);
}

function drawPesto(ctx: Ctx) {
  const well = pastaTable(ctx, '#2d6fb5', '#3a8f3f');
  pool(ctx, well.x + 1, well.y + 3.5, well.rx * 0.84, well.ry * 0.6, '#5aa52c', 18, 0.9);
  const R = rng(121);
  const cx = well.x, base = well.y + 3;
  const MR = 26.5, MH = 19;
  const prof = (t: number) => MR * Math.pow(Math.max(0, 1 - Math.pow(t, 2.2)), 0.5);
  const sil: Build = (c) => {
    for (let i = 0; i <= 30; i++) {
      const t = (i / 30) * 0.98;
      ellipsePath(c, cx, base - MH * t, prof(t), prof(t) * TILT);
    }
  };
  shape(ctx, sil, { fill: '#3e8a22', ink: 1.4, shadow: 'none' });
  // pesto-coated trofie with potato and green beans, painted back to front
  const items: { x: number; y: number; k: number; r: number }[] = [];
  for (let i = 0; i < 135; i++) {
    const t = Math.pow(R(), 0.75) * 0.97;
    const a = R() * TAU;
    const d = 0.6 + 0.38 * Math.sqrt(R());
    const r = prof(t) * d;
    items.push({ x: cx + Math.cos(a) * r, y: base - MH * t + Math.sin(a) * r * TILT, k: i, r: R() });
  }
  items.sort((p, q) => p.y - q.y);
  for (const it of items) {
    const j = it.k;
    if (j % 17 === 5) {
      // potato cube
      shape(ctx, (c) => blobPath(c, it.x, it.y, 2.6, 2.1, 0.12, 6, j), { fill: '#f6e29a', ink: 0.65, shadow: '#d6b965', shadowOffset: [-0.6, -0.7], gloss: [{ x: it.x - 0.8, y: it.y - 0.8, rx: 0.8, ry: 0.4, alpha: 0.85 }] });
      speckle(ctx, it.x, it.y, 2, 1.6, 4, '#4e9a2a', 0.5, j, 0.9);
    } else if (j % 21 === 11) {
      // green bean
      rot(ctx, it.x, it.y, (it.r - 0.5) * 1.4, () => {
        shape(ctx, (c) => smoothPath(c, [[-5.5, 0.2], [-2, -1.15], [3, -1.05], [5.6, 0], [2, 1.05], [-3, 1.05]], true, 0.5), {
          fill: '#2f8f3e', ink: 0.65, shadow: '#20682c', shadowOffset: [-0.4, -0.5], gloss: [{ x: -1, y: -0.5, rx: 2.6, ry: 0.32, alpha: 0.55 }],
        });
      });
    } else {
      // coated pasta: pale durum yellow under bright basil green
      const col = mix('#ecd98c', '#6fbb32', 0.42 + it.r * 0.3);
      trofia(ctx, it.x, it.y, 6.6 + it.r * 1.4, (it.r - 0.5) * 1.6 + (j % 3 === 0 ? 1.2 : 0), col, j % 2 ? 1 : -1);
      if (j % 4 === 1) {
        // a dab of pesto clinging to it
        fillP(ctx, (c) => blobPath(c, it.x + 0.5, it.y + 0.6, 1.4, 0.8, 0.3, 6, j), '#4c9e26', 0.9);
      }
    }
  }
  // shading over the heap
  clip(ctx, sil, () => {
    const g = ctx.createRadialGradient(cx - 10, base - 14, 2, cx - 2, base - 8, 34);
    g.addColorStop(0, 'rgba(255,255,220,0.15)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba('#1f4a0c', 0.4));
    ctx.fillStyle = g;
    ctx.fillRect(cx - 40, base - 40, 80, 60);
  });
  crescent(ctx, sil, [-3, -2.6], '#1f4a0c', 0.2);
  // a spoon of bright pesto on top, glossy with oil
  const top: Build = (c) => blobPath(c, cx, base - MH * 0.93, 10, 4.4, 0.22, 12, 7);
  shape(ctx, top, {
    fill: '#4fa52a', ink: 1.0, shadow: '#3a7c1c', shadowOffset: [-1.2, -1.1],
    gloss: [{ x: cx - 3.5, y: base - MH * 0.93 - 1.5, rx: 3, ry: 1.0, rot: -0.2, alpha: 0.75, color: '#eaf7a8' }],
  });
  clip(ctx, top, () => {
    speckle(ctx, cx, base - MH * 0.93, 8, 3.6, 22, '#2c6a18', 0.45, 8, 0.9);
    speckle(ctx, cx, base - MH * 0.93, 8, 3.6, 12, '#a6d24a', 0.4, 9, 0.9);
  });
  // pine nuts, a little cheese, basil
  for (const [dx, dy, a] of [[-6, -17.5, 0.4], [4.5, -19, -0.6], [7.5, -15, 1.2], [-9, -13.5, -0.9], [0.5, -15.5, 0.1]] as [number, number, number][]) {
    rot(ctx, cx + dx, base + dy, a, () => {
      shape(ctx, (c) => smoothPath(c, [[-1.7, 0], [-0.4, -0.8], [1.6, -0.38], [1.7, 0.38], [-0.4, 0.8]], true, 0.5), {
        fill: '#f6e9c2', ink: 0.55, shadow: '#d7c08a', shadowOffset: [-0.3, -0.35], gloss: [{ x: -0.3, y: -0.3, rx: 0.6, ry: 0.22, alpha: 0.85 }],
      });
    });
  }
  cheeseSnow(ctx, cx, base - 15, 13, 5, 30, 38);
  basilLeaf(ctx, cx + 3.5, base - MH - 3.5, 12.5, -0.45, { col: '#3e9a3a' });
  basilLeaf(ctx, cx - 6, base - MH - 2, 10, -2.7, { col: '#34883a' });
}

// ---------------------------------------------------------------------------
// Pizza
// ---------------------------------------------------------------------------

interface PizzaGeo { x: number; y: number; rx: number; ry: number; sx: number; sy: number; srx: number; sry: number; sauce: Build }

/** Neapolitan base: puffy leopard-spotted cornicione + tomato. */
function pizzaBase(ctx: Ctx, x: number, y: number, rx: number, ry: number, seed: number, sauceCol: string): PizzaGeo {
  const R = rng(seed);
  const th = 3.2;
  const outer: Build = (c) => blobPath(c, x, y, rx, ry, 0.025, 18, seed);
  const under: Build = (c) => blobPath(c, x, y + th, rx * 0.99, ry, 0.025, 18, seed);
  group(ctx, [
    { build: under, style: { fill: '#c98a45', shadow: 'none' } },
    { build: outer, style: { fill: '#e9b66c', shadow: 'none' } },
  ], 1.6);
  // crust volume: lit top-left, toasted lower-right, a lighter crown along the rim
  clip(ctx, outer, () => {
    fillP(ctx, outer, rgrad(ctx, x - rx * 0.4, y - ry * 0.55, 2, rx * 1.25, [[0, '#f7d494'], [0.6, '#e8b264'], [1, '#c8873e']]));
    ctx.save();
    ctx.beginPath();
    ellipsePath(ctx, x, y, rx * 0.93, ry * 0.9);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = 'rgba(255,240,205,0.55)';
    ctx.stroke();
    ctx.restore();
  });
  clip(ctx, under, () => fillP(ctx, (c) => ellipsePath(c, x + rx * 0.4, y + th + ry * 0.4, rx * 0.9, ry), '#a8692e', 0.55));
  // sauce
  const sx = x + 0.6, sy = y + 0.8, srx = rx * 0.8, sry = ry * 0.76;
  const sauce: Build = (c) => blobPath(c, sx, sy, srx, sry, 0.05, 16, seed + 1);
  // the rim casts a soft shade on the tomato at the far (upper) edge
  shape(ctx, sauce, { fill: sauceCol, ink: 0.9, inkColor: '#8a3a1c', shadow: 'none' });
  clip(ctx, sauce, () => {
    speckle(ctx, sx, sy, srx * 0.95, sry * 0.95, 26, shade(sauceCol, 0.22), 1.5, seed + 2, 0.55);
    speckle(ctx, sx, sy, srx * 0.95, sry * 0.95, 18, light(sauceCol, 0.25), 1.1, seed + 3, 0.45);
    // drier, darker tomato at the edge where it meets the crust
    ctx.save();
    ctx.beginPath();
    ellipsePath(ctx, sx, sy, srx, sry);
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba(shade(sauceCol, 0.35), 0.45);
    ctx.stroke();
    ctx.restore();
  });
  crescent(ctx, sauce, [2.2, 2.6], '#5a1a0a', 0.3);
  // leopard spots: charred freckles in clusters + a few blistered bubbles with charred tops
  const ring = (k: number) => {
    const a = R() * TAU;
    const d = 0.86 + R() * 0.12 * k;
    return [x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, a] as [number, number, number];
  };
  clip(ctx, outer, () => {
    for (let i = 0; i < 9; i++) {
      const [bx, by] = ring(1);
      const r = 1.8 + R() * 1.6;
      // raised dough bubbles (no dark dot inside: a dot in a ring would read as an eye)
      shape(ctx, (c) => blobPath(c, bx, by, r, r * 0.62, 0.2, 7, i + seed), { fill: '#f7d79c', ink: 0.4, inkColor: '#c08440', shadow: '#d9a35c', shadowOffset: [-0.5, -0.5], gloss: [{ x: bx - r * 0.35, y: by - r * 0.2, rx: r * 0.3, ry: r * 0.14, alpha: 0.6 }] });
    }
    for (let i = 0; i < 32; i++) {
      const [bx, by] = ring(1);
      const n = 1 + Math.floor(R() * 3);
      for (let j = 0; j < n; j++) {
        const r = 0.4 + R() * 0.95;
        const px = bx + (R() - 0.5) * 3, py = by + (R() - 0.5) * 1.6;
        fillP(ctx, (c) => blobPath(c, px, py, r, r * 0.7, 0.4, 6, i * 3 + j + 40), R() < 0.7 ? '#33200f' : '#6e3c1a', 0.85);
      }
    }
    // flour dust
    speckle(ctx, x, y, rx, ry, 40, '#fff8e8', 0.3, seed + 4, 0.6);
  });
  return { x, y, rx, ry, sx, sy, srx, sry, sauce };
}

function oilGlints(ctx: Ctx, g: PizzaGeo, n: number, seed: number) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * 0.85;
    const px = g.sx + Math.cos(a) * g.srx * d, py = g.sy + Math.sin(a) * g.sry * d;
    fillP(ctx, (c) => blobPath(c, px, py, 1.6 + R() * 1.6, 0.8 + R() * 0.6, 0.25, 7, i + seed), rgba('#ffc24a', 0.55));
    glint(ctx, px - 0.4, py - 0.2, 0.7, 0.35, -0.3, 0.9);
  }
}

function drawMargherita(ctx: Ctx) {
  napkin(ctx, [-57, 6], [-30, 2], [-26, 36], [-56, 36], '#d23a32', 6);
  const pl = { x: 4, y: 11 };
  contact(ctx, pl.x + 2.5, pl.y + 3.6, 53, 25, 0.32);
  group(ctx, [
    { build: (c) => ellipsePath(c, pl.x, pl.y + 2.4, 52.5, 23.5), style: { fill: '#d6cbb6', shadow: 'none' } },
    { build: (c) => ellipsePath(c, pl.x, pl.y, 53, 23.5), style: { fill: rgrad(ctx, pl.x - 20, pl.y - 14, 2, 70, [[0, '#ffffff'], [0.5, '#fbf8f1'], [1, '#e9e1d0']]), shadow: 'none' } },
  ], 1.7);
  ctx.save();
  ctx.strokeStyle = '#2d6fb5';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ellipsePath(ctx, pl.x, pl.y, 50, 21.6);
  ctx.stroke();
  ctx.restore();
  const g = pizzaBase(ctx, 1, 5, 48, 25.5, 801, '#d8361f');
  // torn fior di latte, melted with golden spots
  const R = rng(802);
  const moz: [number, number, number, number][] = [
    [-20, -5, 7.6, 4.2], [2, -11, 7, 3.8], [21, -3, 8, 4.4], [-8, 7, 8, 4.4], [13, 10, 7, 3.8], [-27, 9, 5.6, 3.2], [30, 8, 5, 3],
  ];
  for (const [dx, dy, rx, ry] of moz) {
    const mx = g.sx + dx, my = g.sy + dy;
    const b: Build = (c) => blobPath(c, mx, my, rx, ry, 0.22, 11, Math.round(dx * 13 + dy));
    fillP(ctx, (c) => blobPath(c, mx + 0.6, my + 0.9, rx * 1.12, ry * 1.15, 0.22, 11, Math.round(dx * 13 + dy)), rgba('#f7c9a0', 0.55));
    shape(ctx, b, { fill: '#fffaf0', ink: 0.85, inkColor: '#9a6a4a', shadow: '#e6dccb', shadowOffset: [-1.2, -1.0], gloss: [{ x: mx - rx * 0.35, y: my - ry * 0.35, rx: rx * 0.3, ry: ry * 0.22, rot: -0.3, alpha: 0.95 }] });
    clip(ctx, b, () => speckle(ctx, mx + rx * 0.2, my + ry * 0.2, rx * 0.6, ry * 0.6, 3, '#e8b46a', 0.9, Math.round(R() * 99), 0.55));
  }
  oilGlints(ctx, g, 7, 803);
  // basil: whole leaves laid on after the bake
  basilLeaf(ctx, g.sx - 6, g.sy - 3, 13, -0.6, { col: '#2f8f3a', sy: 0.8 });
  basilLeaf(ctx, g.sx + 10, g.sy + 2, 12, 0.5, { col: '#3a9a3c', sy: 0.8 });
  basilLeaf(ctx, g.sx - 1, g.sy + 11, 11.5, 2.9, { col: '#2f8a38', sy: 0.8 });
  basilLeaf(ctx, g.sx + 26, g.sy - 6, 10, -1.9, { col: '#36923a', sy: 0.8 });
}

function drawMarinara(ctx: Ctx) {
  napkin(ctx, [-57, 8], [-34, 4], [-30, 36], [-56, 36], '#d23a32', 6);
  board(ctx, 2, 10, 55, 24, 901);
  const g = pizzaBase(ctx, 1, 5.5, 47, 24.5, 902, '#d23c1f');
  // olive oil pooled in glossy golden-orange puddles over the tomato
  const R = rng(905);
  clip(ctx, g.sauce, () => {
    for (const [dx, dy, rx, ry] of [[-18, -6, 7, 2.6], [8, -9, 6, 2.2], [20, 4, 7.5, 2.8], [-6, 6, 8, 3], [-26, 6, 4.5, 2]] as [number, number, number, number][]) {
      const px = g.sx + dx, py = g.sy + dy;
      fillP(ctx, (c) => blobPath(c, px, py, rx, ry, 0.25, 9, Math.round(dx * 7 + dy)), rgba('#f7a030', 0.32));
      fillP(ctx, (c) => blobPath(c, px - rx * 0.2, py - ry * 0.25, rx * 0.45, ry * 0.3, 0.3, 7, Math.round(dx + dy * 3)), 'rgba(255,235,190,0.55)');
    }
  });
  // dried oregano, everywhere
  clip(ctx, g.sauce, () => {
    speckle(ctx, g.sx, g.sy, g.srx, g.sry, 150, '#4b5a20', 0.45, 903, 0.95);
    speckle(ctx, g.sx, g.sy, g.srx, g.sry, 70, '#71802e', 0.4, 904, 0.9);
  });
  // thin slices of garlic, lightly toasted at the edge
  const spots: Pt[] = [[-25, -6], [-10, -10], [6, -11], [22, -7], [-30, 5], [-15, 2], [1, 0], [16, 3], [30, 5], [-20, 12], [-3, 11], [12, 13]];
  spots.forEach(([dx, dy]) => {
    rot(ctx, g.sx + dx + (R() - 0.5) * 3, g.sy + dy + (R() - 0.5) * 2, (R() - 0.5) * 1.4 + (R() < 0.5 ? Math.PI : 0), () => {
      // a clove cut across: a flattened D, creamy and a little translucent, toasted golden at the rim
      const b: Build = (c) => smoothPath(c, [[-3.1, 1.3], [-3.3, -0.5], [-1.6, -1.95], [1.6, -1.95], [3.3, -0.5], [3.1, 1.3], [0, 1.55]], true, 0.4);
      shape(ctx, b, {
        fill: rgrad(ctx, -0.6, -0.4, 0.3, 4, [[0, '#fffaec'], [0.7, '#f6ebcc'], [1, '#e9cf96']]),
        ink: 0.5, inkColor: '#a9814e', shadow: 'none', gloss: [{ x: -1, y: -0.8, rx: 1.1, ry: 0.35, rot: -0.1, alpha: 0.9 }],
      });
      clip(ctx, b, () => {
        ctx.save();
        ctx.beginPath();
        b(ctx);
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = 'rgba(214,160,80,0.55)';
        ctx.stroke();
        ctx.restore();
      });
    }, 1, 0.72);
  });
  oilGlints(ctx, g, 7, 906);
}
// ---------------------------------------------------------------------------
// Finale: Nonna's tagliere (the whole menu's pantry)
// ---------------------------------------------------------------------------

function oilBottle(ctx: Ctx, x: number, y: number, h: number) {
  const w = h * 0.36;
  const body: Build = (c) => {
    c.moveTo(x - w * 0.5, y);
    c.lineTo(x - w * 0.5, y - h * 0.52);
    c.quadraticCurveTo(x - w * 0.5, y - h * 0.68, x - w * 0.16, y - h * 0.74);
    c.lineTo(x - w * 0.16, y - h * 0.92);
    c.lineTo(x + w * 0.16, y - h * 0.92);
    c.lineTo(x + w * 0.16, y - h * 0.74);
    c.quadraticCurveTo(x + w * 0.5, y - h * 0.68, x + w * 0.5, y - h * 0.52);
    c.lineTo(x + w * 0.5, y);
    c.quadraticCurveTo(x, y + w * 0.22, x - w * 0.5, y);
    c.closePath();
  };
  contact(ctx, x + 2, y + 0.5, w * 0.8, w * 0.28, 0.35);
  shape(ctx, body, { fill: rgba('#d9e8c8', 0.9), ink: 1.2, shadow: 'none' });
  // the oil: golden-green, lit through the glass
  clip(ctx, body, () => {
    fillP(ctx, (c) => {
      c.rect(x - w, y - h * 0.62, w * 2, h);
    }, vgrad(ctx, y - h * 0.62, y, [[0, '#d6c43a'], [0.5, '#b6a422'], [1, '#8a7a14']]));
    fillP(ctx, (c) => ellipsePath(c, x - w * 0.2, y - h * 0.3, w * 0.18, h * 0.24), rgba('#f6ec8a', 0.6));
    fillP(ctx, (c) => c.rect(x + w * 0.22, y - h * 0.62, w * 0.3, h), rgba('#5a4a0a', 0.3));
  });
  line(ctx, [[x - w * 0.32, y - h * 0.08], [x - w * 0.32, y - h * 0.5]], 0.9, 'rgba(255,255,255,0.85)');
  // cork + a spout
  shape(ctx, (c) => c.rect(x - w * 0.2, y - h * 1.0, w * 0.4, h * 0.1), { fill: '#c9955a', ink: 0.9, shadow: '#9a6a36', shadowOffset: [-0.6, -0.3] });
}

function cherryTomato(ctx: Ctx, x: number, y: number, r: number, seed: number) {
  const col = seed % 2 ? '#e0331f' : '#d42a1c';
  shape(ctx, (c) => blobPath(c, x, y, r * 1.04, r * 0.96, 0.04, 8, seed), {
    fill: rgrad(ctx, x - r * 0.35, y - r * 0.4, 0.2, r * 1.4, [[0, '#ff7a5a'], [0.5, col], [1, '#9a1a10']]),
    ink: 0.9, shadow: 'none',
    gloss: [{ x: x - r * 0.38, y: y - r * 0.4, rx: r * 0.32, ry: r * 0.18, rot: -0.6, alpha: 0.9 }],
  });
}

function vine(ctx: Ctx, pts: Pt[]) {
  line(ctx, pts, 2.2, INK, true);
  line(ctx, pts, 1.1, '#4f8f2e', true);
}

/** A wedge of Parmigiano Reggiano: grainy straw-pale paste, golden rind on the curved back, its almond knife beside. */
function parmigiano(ctx: Ctx, x: number, y: number, s: number) {
  const h = s * 0.62;
  const T: Pt = [x - s, y + s * 0.15];
  const B1: Pt = [x + s * 0.15, y - s * 0.5];
  const B2: Pt = [x + s * 0.95, y + s * 0.05];
  const rimC: Pt = [x + s * 0.85, y - s * 0.45];
  const top: Build = (c) => {
    c.moveTo(T[0], T[1]);
    c.lineTo(B1[0], B1[1]);
    c.quadraticCurveTo(rimC[0], rimC[1], B2[0], B2[1]);
    c.closePath();
  };
  const front: Build = (c) => polyPath(c, [T, B2, [B2[0], B2[1] + h], [T[0], T[1] + h * 0.85]]);
  const back: Build = (c) => {
    c.moveTo(B2[0], B2[1]);
    c.quadraticCurveTo(rimC[0] + s * 0.25, rimC[1] + s * 0.3, B2[0] + s * 0.12, B2[1] - s * 0.15);
    c.lineTo(B2[0] + s * 0.12, B2[1] - s * 0.15 + h);
    c.lineTo(B2[0], B2[1] + h);
    c.closePath();
  };
  contact(ctx, x + 1.5, y + h * 0.9, s * 1.05, s * 0.32, 0.3);
  group(ctx, [
    { build: back, style: { fill: '#c98f3a', shadow: 'none' } },
    { build: front, style: { fill: '#eccf86', shadow: 'none' } },
    { build: top, style: { fill: '#f8e6a6', shadow: 'none' } },
  ], 1.1);
  // the cut face: crumbly, with pits and white crystals
  clip(ctx, front, () => {
    fillP(ctx, (c) => polyPath(c, [[B2[0] - s * 0.18, B2[1]], B2, [B2[0], B2[1] + h], [B2[0] - s * 0.18, B2[1] + h]]), '#d6a24a');
    speckle(ctx, x, y + s * 0.45, s * 0.95, h * 0.5, 30, '#c9a256', 0.45, 61, 0.8);
    speckle(ctx, x, y + s * 0.45, s * 0.95, h * 0.5, 14, '#fffaf0', 0.38, 62, 0.95);
    line(ctx, [T, B2], 0.8, 'rgba(255,250,230,0.8)');
  });
  // the top: grainy, with the golden rind along the curved back
  clip(ctx, top, () => {
    speckle(ctx, x - s * 0.05, y - s * 0.08, s * 0.8, s * 0.3, 22, '#dcc075', 0.4, 63, 0.75);
    speckle(ctx, x - s * 0.05, y - s * 0.08, s * 0.8, s * 0.3, 10, '#ffffff', 0.33, 64, 0.95);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(B1[0], B1[1]);
    ctx.quadraticCurveTo(rimC[0], rimC[1], B2[0], B2[1]);
    ctx.lineWidth = s * 0.3;
    ctx.strokeStyle = '#d9a447';
    ctx.stroke();
    ctx.restore();
  });
  clip(ctx, back, () => speckle(ctx, B2[0] + s * 0.06, B2[1] + h * 0.4, s * 0.1, h * 0.4, 6, '#9a6a24', 0.35, 65, 0.9));
  glint(ctx, x - s * 0.25, y - s * 0.12, s * 0.28, s * 0.07, -0.45, 0.75);
  // the short almond-shaped Parmigiano knife
  rot(ctx, x + s * 0.55, y + h + s * 0.25, -0.12, () => {
    shape(ctx, (c) => roundRectPath(c, s * 0.05, -s * 0.11, s * 0.55, s * 0.22, s * 0.1), { fill: '#8a5530', ink: 0.8, shadow: '#5e3618', shadowOffset: [-0.4, -0.4] });
    shape(ctx, (c) => {
      c.moveTo(s * 0.05, 0);
      c.quadraticCurveTo(-s * 0.15, -s * 0.22, -s * 0.48, 0);
      c.quadraticCurveTo(-s * 0.15, s * 0.22, s * 0.05, 0);
      c.closePath();
    }, { fill: '#e3e8ee', ink: 0.8, shadow: '#9ea8b6', shadowOffset: [-0.3, -0.4], gloss: [{ x: -s * 0.2, y: -s * 0.05, rx: s * 0.12, ry: s * 0.03, alpha: 0.9 }] });
  });
}

function guancialeSlices(ctx: Ctx, x: number, y: number, s: number) {
  // a fan of thin slices: creamy fat with a pink-red meat band and a peppered rind
  for (let i = 0; i < 4; i++) {
    const ox = x + i * s * 0.42, oy = y + i * s * 0.08;
    rot(ctx, ox, oy, -0.25 + i * 0.12, () => {
      const b: Build = (c) => smoothPath(c, [[-s * 0.55, -s * 0.3], [s * 0.1, -s * 0.42], [s * 0.6, -s * 0.25], [s * 0.6, s * 0.28], [0, s * 0.36], [-s * 0.55, s * 0.25]], true, 0.4);
      shape(ctx, b, { fill: '#f7e2cc', ink: 0.8, shadow: '#e2c0a6', shadowOffset: [-0.6, -0.6] });
      clip(ctx, b, () => {
        fillP(ctx, (c) => smoothPath(c, [[-s, -s * 0.05], [0, s * 0.02], [s, -s * 0.1], [s, s * 0.14], [0, s * 0.2], [-s, s * 0.14]], true, 0.4), '#d0596a');
        fillP(ctx, (c) => c.rect(-s, s * 0.26, s * 2, s), '#9a5a3a');
        speckle(ctx, 0, s * 0.33, s * 0.6, s * 0.05, 8, '#2a1b14', 0.3, i + 70, 0.9);
      });
      glint(ctx, -s * 0.1, -s * 0.22, s * 0.25, s * 0.06, -0.1, 0.75);
    });
  }
}

/** A slice of pizza Margherita lying on the board. (x,y) = middle of the slice; the tip points along -a. */
function pizzaSlice(ctx: Ctx, x: number, y: number, L: number, a: number) {
  rot(ctx, x, y, a, () => {
    const ax = -L * 0.55;
    const A0 = -0.4, A1 = 0.4;
    const arc = (r: number, a0 = A0, a1 = A1): Pt[] => {
      const pts: Pt[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = a0 + ((a1 - a0) * i) / 10;
        pts.push([ax + Math.cos(t) * r, Math.sin(t) * r]);
      }
      return pts;
    };
    const sector = (r: number, dy = 0): Build => (c) => {
      polyPath(c, [[ax, dy], ...arc(r).map(([px, py]) => [px, py + dy] as Pt)]);
    };
    group(ctx, [
      { build: sector(L, 2), style: { fill: '#b8783a', shadow: 'none' } },
      { build: sector(L), style: { fill: '#eab468', shadow: 'none' } },
    ], 1.1);
    // tomato, mozzarella, basil
    const sauce: Build = (c) => smoothPath(c, [[ax + L * 0.1, 0], ...arc(L * 0.82, A0 + 0.04, A1 - 0.04)], true, 0.1);
    fillP(ctx, sauce, '#d8361f');
    clip(ctx, sauce, () => speckle(ctx, ax + L * 0.5, 0, L * 0.4, L * 0.25, 12, '#a8261a', 0.8, 5, 0.6));
    for (const [mx, my, r] of [[L * 0.02, -L * 0.1, L * 0.13], [L * 0.2, L * 0.12, L * 0.12], [-L * 0.2, L * 0.02, L * 0.09]] as [number, number, number][]) {
      shape(ctx, (c) => blobPath(c, mx, my, r, r * 0.75, 0.2, 9, Math.round(mx * 10)), { fill: '#fffaf0', ink: 0.6, inkColor: '#9a6a4a', shadow: '#e6dccb', shadowOffset: [-0.5, -0.5], gloss: [{ x: mx - r * 0.3, y: my - r * 0.3, rx: r * 0.3, ry: r * 0.2, alpha: 0.9 }] });
    }
    basilLeaf(ctx, L * 0.12, -L * 0.01, L * 0.3, 0.6, { col: '#2f8f3a', ink: 0.7 });
    // the cornicione along the outer edge, puffy and leopard-spotted
    const rim: Build = (c) => smoothPath(c, [...arc(L), ...arc(L * 0.8).reverse()], true, 0.1);
    shape(ctx, rim, { fill: '#efc07a', ink: 0.8, shadow: '#c98a45', shadowOffset: [-L * 0.03, -L * 0.04] });
    clip(ctx, rim, () => {
      speckle(ctx, ax + L * 0.9, 0, L * 0.1, L * 0.38, 12, '#3a2214', 0.45, 7, 0.85);
      speckle(ctx, ax + L * 0.9, 0, L * 0.1, L * 0.38, 5, '#7a4520', 0.7, 8, 0.7);
    });
  }, 1, 0.62);
}

/** A sprig of basil: a few leaves on a stem. */
function basilSprig(ctx: Ctx, x: number, y: number, s: number, a: number) {
  rot(ctx, x, y, a, () => {
    line(ctx, [[-s * 0.9, s * 0.15], [-s * 0.2, 0], [s * 0.4, -s * 0.05]], 1.9, INK, true);
    line(ctx, [[-s * 0.9, s * 0.15], [-s * 0.2, 0], [s * 0.4, -s * 0.05]], 0.9, '#4f8f2e', true);
    basilLeaf(ctx, -s * 0.35, -s * 0.28, s * 0.62, -0.9, { col: '#34883a' });
    basilLeaf(ctx, -s * 0.2, s * 0.28, s * 0.58, 0.8, { col: '#3e9a3a' });
    basilLeaf(ctx, s * 0.5, -s * 0.15, s * 0.72, -0.2, { col: '#47a643' });
    basilLeaf(ctx, s * 0.25, s * 0.25, s * 0.5, 0.45, { col: '#3a9038' });
  });
}

function drawFoodcourt(ctx: Ctx) {
  // the board sits on a checked tablecloth, peeking out behind it
  napkin(ctx, [27, -12], [56, -15.5], [57, 4], [31, 6], '#d23a32', 5);
  const bx = 0, by = 13, brx = 54, bry = 19;
  const th = 3.4;
  const boardB: Build = (c) => {
    // rounded-rectangle board in 3/4 view, with a handle on the right
    const L = bx - brx, Rr = bx + brx - 8, T = by - bry, B = by + bry;
    c.moveTo(L + 8, T);
    c.lineTo(Rr - 6, T);
    c.quadraticCurveTo(Rr, T, Rr + 1, T + 6);
    c.lineTo(Rr + 1, by - 4);
    c.lineTo(bx + brx - 1, by - 3.5);
    c.quadraticCurveTo(bx + brx + 1, by, bx + brx - 1, by + 3.5);
    c.lineTo(Rr + 1, by + 4);
    c.lineTo(Rr + 1, B - 6);
    c.quadraticCurveTo(Rr, B, Rr - 6, B);
    c.lineTo(L + 8, B);
    c.quadraticCurveTo(L, B, L, B - 8);
    c.lineTo(L, T + 8);
    c.quadraticCurveTo(L, T, L + 8, T);
    c.closePath();
  };
  contact(ctx, bx + 2, by + 6, brx + 2, bry + 2, 0.32);
  const under: Build = (c) => { c.save(); c.translate(0, th); boardB(c); c.restore(); };
  group(ctx, [
    { build: under, style: { fill: '#8f5a2c', shadow: 'none' } },
    { build: boardB, style: { fill: rgrad(ctx, bx - 30, by - 14, 2, 80, [[0, '#dcaa6e'], [0.6, '#c58a4e'], [1, '#a46d3a']]), shadow: 'none' } },
  ], 1.7);
  clip(ctx, boardB, () => {
    const R = rng(1101);
    for (let i = 0; i < 10; i++) {
      const gy = by - bry + (i + 0.5) * (bry * 2 / 10);
      const pts: Pt[] = [];
      for (let k = 0; k <= 10; k++) pts.push([bx - brx + (k / 10) * brx * 2, gy + Math.sin(k * 0.8 + i * 1.3) * 0.9 + (R() - 0.5) * 0.5]);
      line(ctx, pts, 0.45 + R() * 0.3, i % 3 === 0 ? '#9a6232' : '#b0743e', true, 0.5);
    }
  });
  shape(ctx, (c) => ellipsePath(c, bx + brx - 5, by, 1.6, 1.1), { fill: '#5a3418', ink: 0.6, shadow: 'none' });
  crescent(ctx, boardB, [-2.6, -2.2], '#6e4220', 0.3);

  // back row: Italy's olive oil, Campania's tomatoes on the vine
  oilBottle(ctx, -43, 4, 38);
  vine(ctx, [[-31, -7], [-25, -10], [-18, -8.5], [-12, -10.5]]);
  cherryTomato(ctx, -28.5, -2.5, 4.6, 1);
  cherryTomato(ctx, -20.5, -4, 4.8, 2);
  cherryTomato(ctx, -12.5, -3.2, 4.4, 3);
  cherryTomato(ctx, -24, 3.2, 4.4, 4);
  for (const [vx, vy] of [[-28.5, -6.8], [-20.5, -8.4], [-12.5, -7.2]] as Pt[]) {
    shape(ctx, (c) => {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * TAU;
        const rr = i % 2 === 0 ? 2.3 : 0.7;
        const px = vx + Math.cos(a) * rr, py = vy + Math.sin(a) * rr * 0.55;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
    }, { fill: '#3f8a3a', ink: 0.55, shadow: 'none' });
  }
  // the menu, complete: a little plate of spaghetti al pomodoro...
  const pw = plate(ctx, 6, -0.5, 17, 7.8, { band: '#c0392b', th: 1.6, ink: 1.2, well: 0.62 });
  const st: PastaStyle = { kind: 'round', w: 1.25, col: '#e8673a', gap: '#9a2814', hi: '#ffc19a' };
  const n = nest(ctx, pw.x, pw.y + 0.6, 9.8, 10, st, 1102);
  sauceDollop(ctx, n.x, n.y - n.h * 0.9, 4.6, 2.2, '#d6301c', 1103, 3);
  basilLeaf(ctx, n.x + 1.6, n.y - n.h * 1.1, 5.4, -0.4, { col: '#3e9a3a', ink: 0.7 });
  // ...Naples' clams in a blue bowl...
  const cx = 37, cy = -0.5;
  contact(ctx, cx + 1.5, cy + 5, 11, 3.8, 0.3);
  group(ctx, [
    { build: (c) => { c.moveTo(cx - 10, cy); c.quadraticCurveTo(cx - 9, cy + 7, cx, cy + 7.4); c.quadraticCurveTo(cx + 9, cy + 7, cx + 10, cy); c.closePath(); }, style: { fill: '#2d6fb5', shadow: 'none' } },
    { build: (c) => ellipsePath(c, cx, cy, 10, 4), style: { fill: '#f4efe4', shadow: 'none' } },
  ], 1.1);
  line(ctx, [[cx - 8.5, cy + 3.4], [cx - 3, cy + 5.6], [cx + 3, cy + 5.6], [cx + 8.5, cy + 3.4]], 0.8, '#f4efe4', true, 0.85);
  clamClosed(ctx, cx + 3.5, cy - 1.8, 3.4, 0.3, 1106);
  clamOpen(ctx, cx - 3.2, cy + 0.2, 3.4, -0.2, 1104);
  clamClosed(ctx, cx + 5, cy + 1.2, 3.2, -0.2, 1105);
  // ...Genoa's basil...
  basilSprig(ctx, -9, 8, 9, -0.15);
  // front row: Emilia's Parmigiano, Rome's guanciale, a slice of Margherita
  parmigiano(ctx, -34, 19, 10.5);
  guancialeSlices(ctx, -12, 24.5, 9);
  pizzaSlice(ctx, 26, 20, 26, -0.15);
  cherryTomato(ctx, 6.5, 27.5, 3.6, 5);
  basilLeaf(ctx, 46, 24, 8.5, -0.6, { col: '#3e9a3a' });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const DISHES: [string, (ctx: Ctx) => void][] = [
  ['pomodoro', drawPomodoro],
  ['carbonara', drawCarbonara],
  ['alfredo', drawAlfredo],
  ['amatriciana', drawAmatriciana],
  ['cacioepepe', drawCacioePepe],
  ['margherita', drawMargherita],
  ['marinara', drawMarinara],
  ['ragu', drawRagu],
  ['pesto', drawPesto],
  ['vongole', drawVongole],
  ['foodcourt', drawFoodcourt],
];

for (const [id, draw] of DISHES) {
  defineSprite({ id: 'dish.' + id, w: 120, h: 80, ax: 60, ay: 40, frames: 1, res: 3, draw: (ctx) => draw(ctx) });
}
