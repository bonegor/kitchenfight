/**
 * IL MENÙ — the 11 PLATED DISHES, painted as menu illustrations (menu cards, results screen,
 * Ricettario, HUD recipe strip). Imported before placeholders.ts, so every id defined here replaces
 * its placeholder.
 *
 * Contract for every id: defineSprite({ id, w: 120, h: 80, ax: 60, ay: 40, frames: 1, res: 4, draw }).
 * (res 4 instead of the placeholder's 3: a 390-px phone card draws the dish ~160 CSS px wide at DPR 3.)
 * A plated dish seen from 3/4 above, on a hint of table: each dish has its own vessel and one or two
 * props made of its OWN ingredients (never an intruder), so the cards and their locked silhouettes
 * differ. The proper recipe ONLY. No text, no brands. Light from the upper-left like every sprite.
 *
 *   dish.pomodoro     spaghetti al pomodoro: bright tomato twirl, a spoon of sauce, big basil leaves;
 *                     white plate, tomatoes on the vine behind
 *   dish.carbonara    spaghetti alla carbonara: glossy egg-yolk yellow, big crisp guanciale, Pecorino
 *                     dust, lots of black pepper; a yolk in its half shell behind. No cream, no parsley
 *   dish.alfredo      fettuccine al burro: pale cream-gold butter-and-Parmigiano ribbons on an oval
 *                     gold-rimmed platter; a Parmigiano wedge and the golden fork and spoon behind
 *   dish.amatriciana  bucatini all'amatriciana: deep orange-red, cooked amber guanciale, a white cap of
 *                     Pecorino; a black-rind Pecorino wedge and dried chilies behind. No garlic/onion
 *   dish.cacioepepe   tonnarelli cacio e pepe: straw-ivory Pecorino cream, cracked black pepper; a
 *                     wooden pepper mill behind
 *   dish.margherita   pizza Margherita: leopard-spotted cornicione, tomato, fior di latte, basil, oil
 *   dish.marinara     pizza Marinara on a wooden board with a handle: tomato, thin garlic slices,
 *                     green oregano, a golden gloss of oil; NO cheese; a garlic bulb and oregano behind
 *   dish.ragu         tagliatelle al ragù: egg ribbons TOSSED in the brown meat ragù, Parmigiano;
 *                     terracotta-rimmed plate, a glass of red wine behind
 *   dish.pesto        trofie al pesto genovese in a shallow bowl, with potato cubes, green beans, pine
 *                     nuts, basil; a marble mortar and its pestle behind
 *   dish.vongole      spaghetti alle vongole in a deep pasta bowl: clams in their shells, olive oil,
 *                     parsley, chili; NO cheese; a little dish for the empty shells behind
 *   dish.foodcourt    the finale's card: Nonna's tagliere, the menu complete on one board: olive oil,
 *                     tomatoes on the vine, basil, Parmigiano, guanciale, clams, a little plate of
 *                     spaghetti al pomodoro and a slice of Margherita
 *
 * Long pasta is a low twirled nest (`nest`): a dome wound with interleaved helical strands, drawn only
 * where the surface faces the viewer, with strands that loop over its outline and trail onto the
 * plate. Strand kinds: round (spaghetti), tube (bucatini), square (tonnarelli), ribbon (egg fettuccine
 * / tagliatelle, twisting flat bands). Outer silhouettes (plates, bowls, boards, nests, crusts) carry a
 * 2.4–2.6 ink so the dishes still read at HUD size (30–42 px wide).
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, shape, group, line, ellipsePath, circlePath, polyPath, smoothPath, blobPath, roundRectPath,
  speckle, glint, shade, light, mix, rgba, rng, rgrad, vgrad,
} from '../painter';

const TAU = Math.PI * 2;
type Build = (c: Ctx) => void;
/** Outer silhouette ink for vessels, nests and crusts. */
const OUT = 2.6;

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

function clip(ctx: Ctx, build: Build, fn: () => void, rule: CanvasFillRule = 'nonzero') {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip(rule);
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

function strokeP(ctx: Ctx, build: Build, width: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  build(ctx);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
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

/** Closed polygon with rounded corners: [x, y, corner radius]. */
function roundPoly(c: Ctx, pts: [number, number, number][]) {
  const n = pts.length;
  c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, p[2]);
  }
  c.closePath();
}

/** A turned (lathe) outline, symmetric about x: prof = [height fraction 0..1 from the base, half width]. */
function lathe(x: number, y: number, h: number, prof: [number, number][]): Build {
  const right: Pt[] = prof.map(([t, w]) => [x + w, y - t * h]);
  const left: Pt[] = prof.map(([t, w]) => [x - w, y - t * h] as Pt).reverse();
  return (c) => smoothPath(c, [...right, ...left], true, 0.35);
}

// ---------------------------------------------------------------------------
// Table: checked napkin + cutlery
// ---------------------------------------------------------------------------

/** A gingham napkin lying on the table (parallelogram A-B-C-D, A = far left corner). */
function napkin(ctx: Ctx, A: Pt, B: Pt, C: Pt, D: Pt, col = '#d23a32', cells = 7) {
  const build: Build = (c) => smoothPath(c, [
    A, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 0.6], B, [(B[0] + C[0]) / 2 + 0.5, (B[1] + C[1]) / 2], C,
    [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2 - 0.5], D, [(D[0] + A[0]) / 2 - 0.4, (D[1] + A[1]) / 2],
  ], true, 0.18);
  shape(ctx, build, { fill: '#fbf5ea', ink: 1.8, shadow: 'none' });
  clip(ctx, build, () => {
    ctx.save();
    // map the unit square onto the napkin
    ctx.transform(B[0] - A[0], B[1] - A[1], D[0] - A[0], D[1] - A[1], A[0], A[1]);
    ctx.fillStyle = rgba(col, 0.55);
    for (let i = -1; i <= cells + 1; i += 2) {
      ctx.fillRect(i / cells, -0.2, 1 / cells, 1.4);
      ctx.fillRect(-0.2, i / cells, 1.4, 1 / cells);
    }
    ctx.restore();
    const g = ctx.createLinearGradient(A[0], A[1], C[0], C[1]);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.55, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba('#5a1a14', 0.22));
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, 400, 400);
  });
  crescent(ctx, build, [-1.4, -1.6], '#5a1a14', 0.18);
  strokeP(ctx, build, 1.8, INK);
}

const STEEL = { fill: '#e3e8ee', shadow: '#9ea8b6' };
const GOLD = { fill: '#f2c94c', shadow: '#b9861e' };

/** A fork lying on the table, tines pointing away (up the screen). (x,y) = handle end. */
function fork(ctx: Ctx, x: number, y: number, len: number, a: number, metal = STEEL) {
  rot(ctx, x, y, a, () => {
    const L = len;
    const build: Build = (c) => {
      c.moveTo(-1.9, 0);
      c.quadraticCurveTo(-2.3, -L * 0.25, -1.1, -L * 0.5);
      c.lineTo(-0.7, -L * 0.62);
      c.quadraticCurveTo(-2.4, -L * 0.7, -2.5, -L * 0.8);
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
    contact(ctx, 1.4, -L * 0.45, 3.2, L * 0.55, 0.2);
    shape(ctx, build, { fill: metal.fill, ink: 1.2, shadow: metal.shadow, shadowOffset: [-0.9, -0.3], gloss: [{ x: -0.7, y: -L * 0.22, rx: 0.45, ry: L * 0.16, alpha: 0.9 }] });
  });
}

/** A spoon lying on the table, bowl away from the viewer. (x,y) = handle end. */
function spoon(ctx: Ctx, x: number, y: number, len: number, a: number, metal = STEEL) {
  rot(ctx, x, y, a, () => {
    const L = len;
    const build: Build = (c) => {
      c.moveTo(-1.9, 0);
      c.quadraticCurveTo(-2.3, -L * 0.25, -1.0, -L * 0.52);
      c.lineTo(-0.7, -L * 0.62);
      c.bezierCurveTo(-3.6, -L * 0.66, -3.4, -L, 0, -L);
      c.bezierCurveTo(3.4, -L, 3.6, -L * 0.66, 0.7, -L * 0.62);
      c.lineTo(1.0, -L * 0.52);
      c.quadraticCurveTo(2.3, -L * 0.25, 1.9, 0);
      c.quadraticCurveTo(0, 1.6, -1.9, 0);
      c.closePath();
    };
    contact(ctx, 1.4, -L * 0.45, 3.4, L * 0.55, 0.2);
    shape(ctx, build, {
      fill: metal.fill, ink: 1.2, shadow: metal.shadow, shadowOffset: [-0.9, -0.3],
      gloss: [{ x: -0.7, y: -L * 0.22, rx: 0.45, ry: L * 0.16, alpha: 0.9 }, { x: -1, y: -L * 0.86, rx: 0.9, ry: L * 0.07, alpha: 0.9 }],
    });
  });
}

/** Napkin + fork on the left or right of a plate. */
function setting(ctx: Ctx, side: 'L' | 'R', col: string) {
  if (side === 'L') {
    napkin(ctx, [-55.5, -6], [-26, -10], [-22, 34], [-55, 35], col);
    fork(ctx, -48.5, 32, 34, -0.06);
  } else {
    napkin(ctx, [26, -10], [55.5, -6], [55, 35], [22, 34], col);
    fork(ctx, 48.5, 32, 34, 0.06);
  }
}

// ---------------------------------------------------------------------------
// Vessels
// ---------------------------------------------------------------------------

interface Well { x: number; y: number; rx: number; ry: number }
interface PlateOpts { band?: string; wide?: string; well?: number; th?: number; col?: string; ink?: number; double?: boolean }

/** A white trattoria pasta plate (piatto fondo) in 3/4 view; returns the well ellipse. */
function plate(ctx: Ctx, x: number, y: number, rx: number, ry: number, o: PlateOpts = {}): Well {
  const th = o.th ?? 3;
  const col = o.col ?? '#fbf8f1';
  const ink = o.ink ?? OUT;
  contact(ctx, x + 2.5, y + th + 1.2, rx * 1.04, ry * 1.06, 0.32);
  group(ctx, [
    { build: (c) => ellipsePath(c, x, y + th, rx * 0.985, ry), style: { fill: '#d6cbb6', shadow: 'none' } },
    { build: (c) => ellipsePath(c, x, y, rx, ry), style: { fill: rgrad(ctx, x - rx * 0.4, y - ry * 0.6, 2, rx * 1.3, [[0, '#ffffff'], [0.5, col], [1, shade(col, 0.08)]]), shadow: 'none' } },
  ], ink);
  clip(ctx, (c) => ellipsePath(c, x, y + th, rx * 0.985, ry), () => {
    fillP(ctx, (c) => ellipsePath(c, x + rx * 0.5, y + th + ry * 0.4, rx * 0.8, ry), '#b9ab93', 0.55);
  });
  const wk = o.well ?? 0.66;
  // a wide coloured rim (terracotta, ...)
  if (o.wide) {
    const ring: Build = (c) => { ellipsePath(c, x, y, rx * 0.95, ry * 0.93); ellipsePath(c, x, y, rx * 0.79, ry * 0.77); };
    fillP(ctx, (c) => { ring(c); }, o.wide);
    ctx.save();
    ctx.beginPath();
    ring(ctx);
    ctx.clip('evenodd');
    fillP(ctx, (c) => ellipsePath(c, x + rx * 0.06, y + ry * 0.1, rx, ry), rgrad(ctx, x - rx * 0.5, y - ry * 0.6, 2, rx * 1.4, [[0, 'rgba(255,255,255,0.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(60,20,10,0.3)']]));
    speckle(ctx, x, y, rx * 0.95, ry * 0.93, 70, light(o.wide, 0.25), 0.45, 5, 0.6);
    ctx.restore();
    strokeP(ctx, (c) => ellipsePath(c, x, y, rx * 0.95, ry * 0.93), 0.7, shade(o.wide, 0.35), 0.8);
    strokeP(ctx, (c) => ellipsePath(c, x, y, rx * 0.79, ry * 0.77), 0.7, shade(o.wide, 0.35), 0.8);
  }
  if (o.band) {
    strokeP(ctx, (c) => ellipsePath(c, x, y, rx * 0.9, ry * 0.88), 1.6, o.band);
    if (o.double !== false) strokeP(ctx, (c) => ellipsePath(c, x, y, rx * 0.84, ry * 0.815), 0.6, o.band, 0.85);
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

/**
 * A bowl in 3/4 view: rim ellipse (x,y,rx,ry), its outer wall showing below (depth), and the opening
 * (well * rim). Returns the opening plus `front()`, which repaints the near rim over the food so the
 * food sits INSIDE the bowl.
 */
function bowl(ctx: Ctx, x: number, y: number, rx: number, ry: number, depth: number, o: { band?: string; rimBand?: string; well?: number; col?: string } = {}) {
  const col = o.col ?? '#fbf8f1';
  const wk = o.well ?? 0.8;
  contact(ctx, x + 3, y + depth + ry * 0.62, rx * 0.86, ry * 0.62, 0.36);
  const wall: Build = (c) => {
    c.moveTo(x - rx, y);
    c.bezierCurveTo(x - rx, y + ry * 0.7 + depth * 0.75, x - rx * 0.52, y + ry + depth, x, y + ry + depth);
    c.bezierCurveTo(x + rx * 0.52, y + ry + depth, x + rx, y + ry * 0.7 + depth * 0.75, x + rx, y);
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI);
    c.closePath();
  };
  const rim: Build = (c) => ellipsePath(c, x, y, rx, ry);
  const rimFill = rgrad(ctx, x - rx * 0.4, y - ry * 0.6, 2, rx * 1.3, [[0, '#ffffff'], [0.5, col], [1, shade(col, 0.08)]]);
  group(ctx, [
    { build: wall, style: { fill: col, shadow: 'none' } },
    { build: rim, style: { fill: rimFill, shadow: 'none' } },
  ], OUT);
  // the outer wall: lit at the left, turning into shadow at the right and underneath
  clip(ctx, wall, () => {
    const g = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.4)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba('#7a6a50', 0.42));
    ctx.fillStyle = g;
    ctx.fillRect(x - rx - 2, y - 2, rx * 2 + 4, ry + depth + 6);
    fillP(ctx, (c) => ellipsePath(c, x + rx * 0.2, y + ry + depth + 2, rx * 0.75, ry * 0.4), '#a8987c', 0.4);
    if (o.band) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y + depth * 0.42, rx * 0.97, ry * 1.02, 0, 0.08, Math.PI - 0.08);
      ctx.strokeStyle = o.band;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, y + depth * 0.72, rx * 0.9, ry * 1.0, 0, 0.12, Math.PI - 0.12);
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    }
  });
  const wx = x, wy = y + ry * 0.04, wrx = rx * wk, wry = ry * wk * 0.97;
  const rimRing = (c: Ctx) => { ellipsePath(c, x, y, rx * 0.985, ry * 0.98); ellipsePath(c, wx, wy, wrx, wry); };
  const paintRim = () => {
    if (o.rimBand) {
      strokeP(ctx, (c) => ellipsePath(c, x, y, (rx + wrx) / 2, (ry + wry) / 2 + 0.3), 1.5, o.rimBand);
      strokeP(ctx, (c) => ellipsePath(c, x, y, (rx + wrx) / 2 - 2.4, (ry + wry) / 2 - 1.0), 0.55, o.rimBand, 0.85);
    }
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.95, ry * 0.93, 0, Math.PI * 1.08, Math.PI * 1.42);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  };
  paintRim();
  // inside: the far wall shows above the food, darker toward the upper left
  const opening: Build = (c) => ellipsePath(c, wx, wy, wrx, wry);
  fillP(ctx, opening, '#efe7d8');
  crescent(ctx, opening, [3.2, 4.2], '#c4b495', 0.9);
  return {
    x: wx, y: wy, rx: wrx, ry: wry, depth,
    /** repaint the near (front) rim over whatever sits in the bowl */
    front() {
      ctx.save();
      ctx.beginPath();
      rimRing(ctx);
      ctx.clip('evenodd');
      ctx.beginPath();
      ctx.rect(x - rx - 3, wy, rx * 2 + 6, ry + 4);
      ctx.clip();
      fillP(ctx, (c) => ellipsePath(c, x, y, rx, ry), rimFill);
      paintRim();
      ctx.restore();
      // lip of the opening: a crisp edge with a bright highlight
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(wx, wy, wrx, wry, 0, 0.04, Math.PI - 0.04);
      ctx.strokeStyle = rgba('#8a7656', 0.75);
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(wx, wy + 0.8, wrx, wry, 0, 0.2, Math.PI * 0.75);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
      glint(ctx, x + rx * 0.6, y + ry * 0.66, 1.8, 0.7, -0.5, 0.85);
    },
  };
}

/** A wooden board in 3/4 view: far edge `taper` units narrower than the near one; optional handle. */
function woodBoard(ctx: Ctx, cx: number, cy: number, hw: number, hd: number, seed: number, o: { taper?: number; th?: number; handle?: 'L' | 'R'; r?: number } = {}): Build {
  const tp = o.taper ?? 0, th = o.th ?? 3.6, r = o.r ?? 7;
  const T = cy - hd, B = cy + hd;
  const pts: [number, number, number][] = [[cx - hw + tp, T, r], [cx + hw - tp, T, r]];
  const edgeX = (t: number, s: number) => cx + s * (hw - tp * (1 - t));
  if (o.handle === 'R') {
    const xr = edgeX(0.5, 1);
    pts.push([xr - 0.4, cy - 4.2, 1.5], [xr + 8.5, cy - 3.2, 3], [xr + 8.5, cy + 3.2, 3], [xr - 0.4, cy + 4.2, 1.5]);
  }
  pts.push([cx + hw, B, r], [cx - hw, B, r]);
  if (o.handle === 'L') {
    const xl = edgeX(0.5, -1);
    pts.push([xl + 0.4, cy + 4.2, 1.5], [xl - 8.5, cy + 3.2, 3], [xl - 8.5, cy - 3.2, 3], [xl + 0.4, cy - 4.2, 1.5]);
  }
  const top: Build = (c) => roundPoly(c, pts);
  const under: Build = (c) => roundPoly(c, pts.map(([px, py, pr]) => [px, py + th, pr] as [number, number, number]));
  contact(ctx, cx + 2.5, cy + th + 2, hw + 3, hd + 3, 0.34);
  group(ctx, [
    { build: under, style: { fill: '#8f5a2c', shadow: 'none' } },
    { build: top, style: { fill: rgrad(ctx, cx - hw * 0.5, cy - hd * 0.6, 2, hw * 1.5, [[0, '#dcaa6e'], [0.6, '#c58a4e'], [1, '#a46d3a']]), shadow: 'none' } },
  ], OUT);
  clip(ctx, under, () => fillP(ctx, (c) => c.rect(cx - hw - 12, cy + hd - 4, hw * 2 + 24, 12), '#6e4220', 0.35));
  clip(ctx, top, () => {
    const R = rng(seed);
    const n = Math.round(hd / 2.2);
    for (let i = 0; i < n; i++) {
      const gy = T + (i + 0.5) * (hd * 2 / n);
      const p: Pt[] = [];
      for (let k = 0; k <= 12; k++) p.push([cx - hw - 10 + (k / 12) * (hw * 2 + 20), gy + Math.sin(k * 0.8 + i * 1.3) * 0.9 + (R() - 0.5) * 0.5]);
      line(ctx, p, 0.45 + R() * 0.35, i % 3 === 0 ? '#9a6232' : '#b0743e', true, 0.55);
    }
    // a knot
    for (let k = 0; k < 3; k++) strokeP(ctx, (c) => ellipsePath(c, cx + hw * 0.55, cy + hd * 0.45, 2 + k * 1.4, 0.9 + k * 0.7, 0.1), 0.5, '#8a5428', 0.55);
  });
  crescent(ctx, top, [-2.6, -2.2], '#6e4220', 0.3);
  // lit far edge
  line(ctx, [[cx - hw + tp + 6, T + 1.2], [cx + hw - tp - 6, T + 1.2]], 1.0, 'rgba(255,236,200,0.7)');
  if (o.handle) {
    const s = o.handle === 'R' ? 1 : -1;
    const hx = edgeX(0.5, s) + s * 5.2;
    shape(ctx, (c) => ellipsePath(c, hx, cy, 1.7, 1.2), { fill: '#4a2a12', ink: 0.7, shadow: 'none' });
  }
  return top;
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
  /** screen y of the top outline at screen x */
  top(px: number): number;
}

interface NestOpts {
  /** strands lying on the plate from under the nest: [angle, direction ±1, length scale] */
  trails?: [number, number, number?][];
  /** angles where a strand drapes over the lower outline onto the plate */
  drapes?: number[];
  /** x offsets (× rx) of strand loops poking above the top outline */
  loops?: number[];
  /** strands running round the left / right outline */
  sides?: boolean;
}

/** Plate tilt (ry / rx) shared by every 3/4 ellipse; the view elevation follows from it. */
const TILT = 0.46;
const COS_E = Math.sqrt(1 - TILT * TILT);

/**
 * A flat egg-pasta ribbon (fettuccine, tagliatelle) along `pts`: its width breathes as it twists
 * (narrow where it turns edge-on), with a soft flat sheen and a crisp lit upper edge.
 */
function ribbon(ctx: Ctx, pts: Pt[], st: PastaStyle, gap: string, hi: string, inked = false) {
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
    let nx = -ty, ny = tx;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const hw = w * 0.5 * (0.68 + 0.32 * Math.abs(Math.cos(ph + s * 0.11)));
    const [x, y] = pts[i];
    up.push([x + nx * hw, y + ny * hw]);
    dn.push([x - nx * hw, y - ny * hw]);
    mid.push([x + nx * hw * 0.1, y + ny * hw * 0.1]);
    edge.push([x + nx * hw * 0.68, y + ny * hw * 0.68]);
  }
  const body: Build = (c) => smoothPath(c, [...up, ...[...dn].reverse()], true, 0.5);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  body(ctx);
  ctx.lineWidth = inked ? 1.8 : 1.1;
  ctx.strokeStyle = inked ? INK : gap;
  ctx.stroke();
  ctx.fillStyle = st.col;
  ctx.fill();
  ctx.restore();
  line(ctx, dn, 0.7, shade(st.col, 0.22), true, 0.65);
  line(ctx, mid, w * 0.36, light(st.col, 0.3), true, 0.4);
  line(ctx, edge, w * 0.12, hi, true, 0.9);
}

function strand(ctx: Ctx, pts: Pt[], st: PastaStyle, gap: string, hi: string, inked = false) {
  if (st.kind === 'ribbon') return ribbon(ctx, pts, st, gap, hi, inked);
  const w = st.w;
  if (inked) line(ctx, pts, w + 1.7, INK, true);
  const under = st.kind === 'tube' ? 1.0 : 0.85;
  line(ctx, pts, w + under, gap, true, 0.95);
  line(ctx, pts, w, st.col, true);
  if (st.kind === 'square') {
    // tonnarelli: a square section, so a crisp flat highlight and a shaded lower face
    line(ctx, pts.map(([x, y]) => [x, y + 0.3 * w] as Pt), w * 0.22, shade(st.col, 0.18), true, 0.6);
    line(ctx, pts.map(([x, y]) => [x - w * 0.08, y - w * 0.24] as Pt), w * 0.22, hi, true, 0.9);
    return;
  }
  line(ctx, pts.map(([x, y]) => [x - w * 0.08, y - w * 0.24] as Pt), w * 0.3, hi, true, 0.75);
}

/** The cut end of a bucatino shows its hole. */
function tubeEnd(ctx: Ctx, p: Pt, st: PastaStyle, tilt: number) {
  shape(ctx, (c) => ellipsePath(c, p[0], p[1], st.w * 0.64, st.w * 0.52, tilt), { fill: light(st.col, 0.15), ink: 0.7, shadow: 'none' });
  fillP(ctx, (c) => ellipsePath(c, p[0] + 0.05, p[1] + 0.05, st.w * 0.28, st.w * 0.22, tilt), shade(st.col, 0.6));
}

/**
 * Paint a twirled nest of long pasta: a low, slightly irregular dome wound with interleaved helical
 * strands (the swirl shows on top), strands crossing over it, loops breaking its outline and strands
 * trailing onto the plate. (x,y) = centre of its base on the plate; h = projected height.
 */
function nest(ctx: Ctx, x: number, y: number, rx: number, h: number, st: PastaStyle, seed: number, o: NestOpts = {}): Nest {
  const R = rng(seed);
  const gap = st.gap ?? shade(st.col, 0.5);
  const hi = st.hi ?? light(st.col, 0.6);
  const w = st.w;
  const p1 = R() * TAU, p2 = R() * TAU, p3 = R() * TAU;
  const k = (a: number) => 1 + 0.05 * Math.sin(2 * a + p1) + 0.035 * Math.sin(3 * a + p2) + 0.02 * Math.sin(5 * a + p3) + 0.012 * Math.sin(9 * a + 2 * p1);
  const prof = (t: number) => rx * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.max(0, t)), 2.1)), 0.5);
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
  // the top outline, sampled from the back half of the dome
  const topY = new Map<number, number>();
  for (let a = -Math.PI; a <= 0; a += 0.02) {
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const p = at(a, t);
      const key = Math.round(p[0] * 2);
      const v = topY.get(key);
      if (v === undefined || p[1] < v) topY.set(key, p[1]);
    }
  }
  const top = (px: number) => topY.get(Math.round(px * 2)) ?? y - h;
  // silhouette = union of the horizontal cross-sections
  const sil: Build = (c) => {
    for (let i = 0; i <= 44; i++) {
      const t = Math.pow(i / 44, 0.8) * 0.995;
      const pts: Pt[] = [];
      for (let j = 0; j < 24; j++) pts.push(at((j / 24) * TAU, t));
      smoothPath(c, pts, true);
    }
  };

  // strands that slid off the twirl: tucked under it, lying on the plate in a soft S
  for (const [a0, dir, ls = 1] of o.trails ?? []) {
    const L = ls;
    const pts: Pt[] = [at(a0, 0, 0.8), at(a0 + dir * 0.06 * L, 0, 1.02), at(a0 + dir * 0.16 * L, 0, 1.14 + 0.04 * L), at(a0 + dir * 0.32 * L, 0, 1.2 + 0.06 * L), at(a0 + dir * 0.5 * L, 0, 1.2 + 0.06 * L)];
    strand(ctx, pts, st, gap, hi, true);
    if (st.kind === 'tube') tubeEnd(ctx, pts[pts.length - 1], st, -0.4 * dir);
  }
  strokeP(ctx, sil, OUT * 2, INK);
  // the sauce between the strands: darker than the pasta, but not a black hole
  fillP(ctx, sil, mix(gap, st.col, 0.35));

  const drawRun = (run: Pt[]) => { if (run.length >= 3) strand(ctx, run, st, gap, hi); };
  /** walk a curve given by θ → (angle, arc length); draw its visible stretches */
  const walk = (th0: number, th1: number, f: (th: number) => [number, number]) => {
    let run: Pt[] = [];
    for (let th = th0; th <= th1 + 1e-6; th += 0.12) {
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
    const gapS = w * (st.kind === 'ribbon' ? 0.92 : 1.05);
    const pitch = (NS * gapS) / TAU;
    for (let i = 0; i < NS; i++) {
      const a0 = R() * TAU;
      const ph = R() * TAU;
      let th = 0;
      let sOff = -(i + 1) * gapS;
      const thMax = (S - sOff) / pitch + 1;
      while (th < thMax) {
        const len = Math.PI * (1.0 + R() * 2.2);
        const off = sOff;
        walk(th, th + len, (tt) => [a0 + tt, off + tt * pitch + Math.sin(tt * 2.1 + ph) * w * 0.25]);
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
    const g = ctx.createRadialGradient(x - rx * 0.45, y - h * 0.85, rx * 0.1, x - rx * 0.1, y - h * 0.5, rx * 1.35);
    g.addColorStop(0, 'rgba(255,255,255,0.2)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba(shade(st.col, 0.45), st.shadeA ?? 0.32));
    ctx.fillStyle = g;
    ctx.fillRect(x - rx * 2, y - h * 3, rx * 4, h * 5);
  });
  crescent(ctx, sil, [-3.2, -2.6], shade(st.col, 0.5), 0.22);

  // strands breaking the outline: round the sides, draped over the front, looping over the top.
  // They blend into the twirl like any strand; only where they leave the silhouette do they get ink.
  const escape = (pts: Pt[]) => {
    // (sil is a union of overlapping ellipses, so "outside" is cut with destination-out, not evenodd)
    layer(ctx, (o) => {
      strand(o, pts, st, gap, hi, true);
      o.globalCompositeOperation = 'destination-out';
      o.beginPath();
      sil(o);
      o.fill();
    });
    clip(ctx, sil, () => strand(ctx, pts, st, gap, hi));
  };
  if (o.sides) {
    for (const s of [1, -1]) {
      const a0 = s > 0 ? 0.04 : Math.PI - 0.04;
      const pts: Pt[] = [at(a0 + s * 0.42, 0.34), at(a0 + s * 0.24, 0.2), at(a0 + s * 0.08, 0.07), at(a0 - s * 0.05, 0, 1.06), at(a0 - s * 0.16, 0, 1.13), at(a0 - s * 0.26, 0, 1.12)];
      escape(pts);
      if (st.kind === 'tube') tubeEnd(ctx, pts[pts.length - 1], st, 0.5 * s);
    }
  }
  // strands sliding down the front and out onto the plate
  for (const a0 of o.drapes ?? []) {
    const dd = a0 < Math.PI / 2 ? -0.05 : 0.05;
    const pts: Pt[] = [at(a0 - dd, 0.3), at(a0, 0.14), at(a0 + dd, 0.03), at(a0 + dd * 2, 0, 1.1), at(a0 + dd * 3, 0, 1.2), at(a0 + dd * 4.4, 0, 1.26)];
    escape(pts);
    if (st.kind === 'tube') tubeEnd(ctx, pts[pts.length - 1], st, -dd * 8);
  }
  for (const fx of o.loops ?? []) {
    const xm = x + fx * rx;
    const d = 3.4 + w * 0.6;
    const up = 0.6 + w * 0.16;
    const pts: Pt[] = [[xm - d * 1.5, top(xm - d * 1.5) + 1.8], [xm - d * 0.75, top(xm - d * 0.75) - up * 0.6], [xm, top(xm) - up], [xm + d * 0.75, top(xm + d * 0.75) - up * 0.6], [xm + d * 1.5, top(xm + d * 1.5) + 1.8]];
    escape(pts);
  }
  // specular glints on the lit strands
  for (let j = 0; j < 9; j++) {
    const p = at(Math.PI * (0.5 + R() * 0.45), 0.12 + R() * 0.7, 0.97);
    glint(ctx, p[0], p[1], w * (0.45 + R() * 0.3), w * 0.22, -0.35, 0.85);
  }
  return { x, y, rx, h, sil, at, top };
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
  const ink = o.ink ?? 1.0;
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

/** A crisp nugget of guanciale (carbonara): amber rendered fat, a deep red-brown meat streak, browned edges. */
function guancialeBit(ctx: Ctx, x: number, y: number, s: number, a: number, seed: number) {
  const R = rng(seed);
  rot(ctx, x, y, a, () => {
    const pts: Pt[] = [[-s * 0.55, -s * 0.3], [-s * 0.1, -s * 0.4], [s * 0.5, -s * 0.34], [s * 0.6, s * 0.06], [s * 0.42, s * 0.3], [-s * 0.2, s * 0.32], [-s * 0.6, s * 0.12]]
      .map(([px, py]) => [px * (0.9 + R() * 0.2), py * (0.9 + R() * 0.2)] as Pt);
    const top: Build = (c) => smoothPath(c, pts, true, 0.3);
    const side: Build = (c) => smoothPath(c, pts.map(([px, py]) => [px, py + s * 0.26] as Pt), true, 0.3);
    group(ctx, [
      { build: side, style: { fill: '#a65a26', shadow: 'none' } },
      { build: top, style: { fill: rgrad(ctx, -s * 0.3, -s * 0.3, 0.2, s, [[0, '#ffe2a4'], [0.6, '#f6c46e'], [1, '#e8a44e']]), shadow: 'none' } },
    ], 1.0);
    clip(ctx, top, () => {
      fillP(ctx, (c) => polyPath(c, [[-s, s * 0.04], [s, -s * 0.08], [s, s * 0.06], [-s, s * 0.17]]), '#a83e22');
      line(ctx, [[-s, s * 0.07], [s, -s * 0.05]], s * 0.05, '#d26a42', false, 0.8);
      strokeP(ctx, top, s * 0.14, 'rgba(196,118,44,0.85)');
    });
    clip(ctx, side, () => fillP(ctx, (c) => polyPath(c, [[-s, s * 0.3], [s, s * 0.2], [s, s * 0.4], [-s, s * 0.5]]), '#7a3414', 0.6));
    glint(ctx, -s * 0.24, -s * 0.2, s * 0.24, s * 0.09, -0.15, 0.95);
  });
}

/** A crisp, curled strip of cooked guanciale (amatriciana): translucent amber fat, a dark meat band, golden-brown edges. */
function guancialeStrip(ctx: Ctx, x: number, y: number, L: number, a: number, bend = 1) {
  rot(ctx, x, y, a, () => {
    const h = L * 0.4;
    const N = 6;
    const upE: Pt[] = [], dnE: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const px = -L / 2 + u * L;
      const py = -Math.sin(u * Math.PI) * bend * L * 0.1;
      const hw = h / 2 * (0.82 + 0.18 * Math.sin(u * Math.PI));
      upE.push([px, py - hw]);
      dnE.push([px, py + hw]);
    }
    const top: Build = (c) => smoothPath(c, [...upE, ...[...dnE].reverse()], true, 0.35);
    const side: Build = (c) => smoothPath(c, [...upE, ...[...dnE].reverse()].map(([px, py]) => [px, py + h * 0.28] as Pt), true, 0.35);
    group(ctx, [
      { build: side, style: { fill: '#a65a26', shadow: 'none' } },
      { build: top, style: { fill: rgrad(ctx, -L * 0.2, -h * 0.4, 0.2, L * 0.7, [[0, '#fbd796'], [0.6, '#f0b464'], [1, '#d98a3c']]), shadow: 'none' } },
    ], 1.0);
    clip(ctx, top, () => {
      // the lean band, deep red-brown, then a thinner second streak
      const mid = (f: number): Pt[] => upE.map(([px, py], i) => [px, py + (dnE[i][1] - py) * f] as Pt);
      line(ctx, mid(0.6), h * 0.2, '#a83e22', true, 1);
      line(ctx, mid(0.57), h * 0.06, '#d8704a', true, 0.8);
      line(ctx, mid(0.22), h * 0.07, '#c0602e', true, 0.55);
      strokeP(ctx, top, h * 0.16, 'rgba(200,120,44,0.85)');
    });
    clip(ctx, side, () => fillP(ctx, (c) => c.rect(-L, h * 0.3, L * 2, h), '#6e2e10', 0.45));
    glint(ctx, -L * 0.18, -h * 0.28 - bend * L * 0.06, L * 0.18, h * 0.1, 0, 0.95);
  });
}

/** Cracked black pepper. */
function pepper(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, size = 0.42) {
  speckle(ctx, cx, cy, rx, ry, n, '#22140e', size, seed, 0.95);
  speckle(ctx, cx, cy, rx, ry, Math.round(n * 0.35), '#5a3e2c', size * 0.8, seed + 7, 0.9);
}

/** Finely grated cheese snow (+ a few bigger crumbs). */
function cheeseSnow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number, col = '#fffaf0') {
  speckle(ctx, cx, cy, rx, ry, n, col, 0.36, seed, 0.95);
  speckle(ctx, cx, cy, rx * 0.8, ry * 0.8, Math.round(n * 0.25), col, 0.55, seed + 3, 0.95);
}

/** A fluffy little mound of freshly grated cheese (amatriciana's Pecorino). */
function cheeseCap(ctx: Ctx, x: number, y: number, rx: number, ry: number, seed: number) {
  const R = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU;
    const kk = (i % 2 ? 1.06 : 0.9) + R() * 0.1;
    pts.push([x + Math.cos(a) * rx * kk, y + Math.sin(a) * ry * kk - Math.max(0, -Math.sin(a)) * ry * 0.4]);
  }
  const b: Build = (c) => smoothPath(c, pts, true, 0.3);
  shape(ctx, b, {
    fill: rgrad(ctx, x - rx * 0.3, y - ry * 0.8, 0.5, rx * 1.3, [[0, '#ffffff'], [0.6, '#fbf5e6'], [1, '#e2d3b2']]),
    ink: 1.0, inkColor: '#7a6040', shadow: '#e0d0ae', shadowOffset: [-1.3, -1.3],
  });
  clip(ctx, b, () => {
    // shreds: little lit crumbs with a soft shadow under each
    for (let i = 0; i < 40; i++) {
      const a = R() * TAU, d = Math.sqrt(R());
      const px = x + Math.cos(a) * rx * 0.95 * d, py = y - ry * 0.25 + Math.sin(a) * ry * 0.95 * d;
      const ang = (R() - 0.5) * 1.2;
      line(ctx, [[px - 0.8, py + 0.45], [px + 0.8, py + 0.45 + ang]], 0.65, '#d4c29a', false, 0.75);
      line(ctx, [[px - 0.8, py], [px + 0.8, py + ang]], 0.6, '#ffffff', false, 0.95);
    }
  });
  cheeseSnow(ctx, x, y + ry * 0.4, rx * 1.4, ry * 0.9, 30, seed + 5);
}

/** Glossy spoon of sauce draped over the top of the nest, with drips down the front. */
function sauceDollop(ctx: Ctx, x: number, y: number, rx: number, ry: number, col: string, seed: number, drips = 5) {
  const R = rng(seed);
  const pts: Pt[] = [];
  const n = 22;
  const lobes: number[] = [];
  for (let j = 0; j < drips; j++) lobes.push(Math.PI * (0.18 + (0.64 * (j + 0.5)) / drips) + (R() - 0.5) * 0.25);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    let kk = 0.94 + R() * 0.08;
    for (const la of lobes) {
      const d = Math.abs(Math.atan2(Math.sin(a - la), Math.cos(a - la)));
      if (d < 0.32) kk += (0.32 - d) * 1.6 * (0.6 + R() * 0.5);
    }
    pts.push([x + Math.cos(a) * rx * kk, y + Math.sin(a) * ry * kk]);
  }
  const build: Build = (c) => smoothPath(c, pts, true, 0.5);
  shape(ctx, build, {
    fill: rgrad(ctx, x - rx * 0.3, y - ry * 0.5, 0.5, rx * 1.2, [[0, light(col, 0.22)], [0.55, col], [1, shade(col, 0.18)]]),
    ink: 1.2, shadow: shade(col, 0.28), shadowOffset: [-1.6, -1.5],
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

/** Glints scattered over the lit side of a nest (butter, oil). */
function sheen(ctx: Ctx, n: Nest, count: number, seed: number, size = 1.6, color?: string) {
  const R = rng(seed);
  for (let i = 0; i < count; i++) {
    const p = n.at(Math.PI * (0.3 + R() * 0.65), 0.1 + R() * 0.8, 0.96);
    if (color) fillP(ctx, (c) => ellipsePath(c, p[0] + 0.4, p[1] + 0.3, size * 1.4, size * 0.5, -0.3), color, 0.55);
    glint(ctx, p[0], p[1], size * (0.8 + R() * 0.6), 0.5, -0.3, 0.85);
  }
}

/** Italian parsley, finely chopped. */
function parsley(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R());
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    const s = 0.42 + R() * 0.45;
    shape(ctx, (c) => blobPath(c, x, y, s * 1.2, s * 0.6, 0.5, 5, i + seed), { fill: R() < 0.5 ? '#36962e' : '#26742a', ink: 0.3, inkColor: '#1c4214', shadow: 'none' });
  }
}

function chiliFlakes(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, n: number, seed: number) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R());
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    fillP(ctx, (c) => ellipsePath(c, x, y, 0.65 + R() * 0.3, 0.34, R() * 3), R() < 0.6 ? '#d8281a' : '#f04a22');
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

/** The inside of a valve: pearly nacre with a striped rim. */
function valveInside(ctx: Ctx, s: number, col: string) {
  const inner: Build = (c) => { c.save(); c.rotate(-0.12); valvePath(c, s * 0.92); c.restore(); };
  shape(ctx, inner, { fill: '#f3ebef', ink: 1.0, shadow: 'none' });
  clip(ctx, inner, () => {
    fillP(ctx, (c) => ellipsePath(c, s * 0.25, 0, s * 0.5, s * 0.36), rgba('#9c7cc0', 0.45));
    strokeP(ctx, inner, s * 0.34, col);
    strokeP(ctx, inner, s * 0.12, '#7a6250', 0.7);
  });
  return inner;
}

/**
 * An open clam (vongola verace) seen from above: one valve flipped open shows its striped outside,
 * the other shows its nacre inside with the clam in it. (x,y) = hinge.
 */
function clamOpen(ctx: Ctx, x: number, y: number, s: number, a: number, seed: number) {
  const R = rng(seed);
  const col = R() < 0.5 ? '#d9c6a6' : '#cfb999';
  rot(ctx, x, y, a, () => {
    rot(ctx, -s * 0.6, s * 0.04, Math.PI / 2 - 0.12, () => shellOut(ctx, s * 0.9, col));
    valveInside(ctx, s, col);
    // the clam itself: plump, pale ivory-beige
    const mx = s * 0.66, my = -s * 0.1;
    shape(ctx, (c) => blobPath(c, mx, my, s * 0.52, s * 0.34, 0.14, 8, seed), {
      fill: '#f3dcb4', ink: 0.65, inkColor: '#8a6440', shadow: '#d9a56e', shadowOffset: [-s * 0.1, -s * 0.12],
      gloss: [{ x: mx - s * 0.16, y: my - s * 0.1, rx: s * 0.2, ry: s * 0.08, alpha: 0.95 }],
    });
    line(ctx, [[mx - s * 0.3, my + s * 0.1], [mx, my + s * 0.16], [mx + s * 0.28, my + s * 0.06]], 0.5, '#b88452', true, 0.75);
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
  shape(ctx, b, { fill: col, ink: 1.0, shadow: shade(col, 0.3), shadowOffset: [-s * 0.18, -s * 0.2], gloss: [{ x: -s * 0.38, y: -s * 0.22, rx: s * 0.34, ry: s * 0.11, rot: -0.3, alpha: 0.8 }] });
  clip(ctx, b, () => {
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

/** A clam lying closed. */
function clamClosed(ctx: Ctx, x: number, y: number, s: number, a: number, seed: number) {
  const R = rng(seed);
  const col = R() < 0.5 ? '#d9c6a6' : '#cfb999';
  rot(ctx, x, y, a, () => shellOut(ctx, s, col), 1, 0.85);
}

// ---------------------------------------------------------------------------
// Props (each dish's own ingredients, never an intruder)
// ---------------------------------------------------------------------------

function cherryTomato(ctx: Ctx, x: number, y: number, r: number, seed: number) {
  const col = seed % 2 ? '#e0331f' : '#d42a1c';
  shape(ctx, (c) => blobPath(c, x, y, r * 1.04, r * 0.96, 0.04, 8, seed), {
    fill: rgrad(ctx, x - r * 0.35, y - r * 0.4, 0.2, r * 1.4, [[0, '#ff7a5a'], [0.5, col], [1, '#9a1a10']]),
    ink: 1.1, shadow: 'none',
    gloss: [{ x: x - r * 0.38, y: y - r * 0.4, rx: r * 0.32, ry: r * 0.18, rot: -0.6, alpha: 0.9 }],
  });
}

function calyx(ctx: Ctx, vx: number, vy: number, r = 2.3) {
  shape(ctx, (c) => {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TAU;
      const rr = i % 2 === 0 ? r : r * 0.3;
      const px = vx + Math.cos(a) * rr, py = vy + Math.sin(a) * rr * 0.55;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }, { fill: '#3f8a3a', ink: 0.6, shadow: 'none' });
}

function vine(ctx: Ctx, pts: Pt[]) {
  line(ctx, pts, 2.4, INK, true);
  line(ctx, pts, 1.2, '#4f8f2e', true);
}

/** A truss of cherry tomatoes on the vine. tom = [dx, dy, r] relative to (x,y); the stem runs above. */
function vineTomatoes(ctx: Ctx, x: number, y: number, tom: [number, number, number][], seed: number) {
  const stems: Pt[] = tom.map(([dx, dy, r]) => [x + dx, y + dy - r * 0.95] as Pt);
  const sorted = [...stems].sort((a, b) => a[0] - b[0]);
  const vy = Math.min(...stems.map((p) => p[1])) - 3.5;
  vine(ctx, [[sorted[0][0] - 4, vy + 1.5], ...sorted.map(([sx]) => [sx, vy - 0.4 + (sx % 3) * 0.3] as Pt), [sorted[sorted.length - 1][0] + 3, vy - 1.2]]);
  for (const [sx, sy] of stems) line(ctx, [[sx, vy], [sx, sy]], 1.9, INK), line(ctx, [[sx, vy], [sx, sy]], 0.9, '#4f8f2e');
  tom.forEach(([dx, dy, r], i) => cherryTomato(ctx, x + dx, y + dy, r, seed + i));
  stems.forEach(([sx, sy]) => calyx(ctx, sx, sy + 0.4));
}

/** A cheese wedge in 3/4: the cut paste on top and front, the rind along its curved back. */
function cheeseWedge(ctx: Ctx, x: number, y: number, s: number, o: { paste: string; side: string; rind: string; rindSide: string; grain: string; knife?: boolean }) {
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
    { build: back, style: { fill: o.rindSide, shadow: 'none' } },
    { build: front, style: { fill: o.side, shadow: 'none' } },
    { build: top, style: { fill: o.paste, shadow: 'none' } },
  ], 1.4);
  clip(ctx, front, () => {
    fillP(ctx, (c) => polyPath(c, [[B2[0] - s * 0.16, B2[1]], B2, [B2[0], B2[1] + h], [B2[0] - s * 0.16, B2[1] + h]]), o.rind);
    speckle(ctx, x, y + s * 0.45, s * 0.95, h * 0.5, 30, o.grain, 0.45, 61, 0.8);
    speckle(ctx, x, y + s * 0.45, s * 0.95, h * 0.5, 14, '#fffaf0', 0.38, 62, 0.95);
    line(ctx, [T, B2], 0.8, 'rgba(255,250,230,0.8)');
  });
  clip(ctx, top, () => {
    speckle(ctx, x - s * 0.05, y - s * 0.08, s * 0.8, s * 0.3, 22, o.grain, 0.4, 63, 0.75);
    speckle(ctx, x - s * 0.05, y - s * 0.08, s * 0.8, s * 0.3, 10, '#ffffff', 0.33, 64, 0.95);
    strokeP(ctx, (c) => { c.moveTo(B1[0], B1[1]); c.quadraticCurveTo(rimC[0], rimC[1], B2[0], B2[1]); }, s * 0.3, o.rind);
  });
  glint(ctx, x - s * 0.25, y - s * 0.12, s * 0.28, s * 0.07, -0.45, 0.75);
  if (o.knife) {
    // the short almond-shaped Parmigiano knife
    rot(ctx, x + s * 0.55, y + h + s * 0.25, -0.12, () => {
      shape(ctx, (c) => roundRectPath(c, s * 0.05, -s * 0.11, s * 0.55, s * 0.22, s * 0.1), { fill: '#8a5530', ink: 0.9, shadow: '#5e3618', shadowOffset: [-0.4, -0.4] });
      shape(ctx, (c) => {
        c.moveTo(s * 0.05, 0);
        c.quadraticCurveTo(-s * 0.15, -s * 0.22, -s * 0.48, 0);
        c.quadraticCurveTo(-s * 0.15, s * 0.22, s * 0.05, 0);
        c.closePath();
      }, { fill: '#e3e8ee', ink: 0.9, shadow: '#9ea8b6', shadowOffset: [-0.3, -0.4], gloss: [{ x: -s * 0.2, y: -s * 0.05, rx: s * 0.12, ry: s * 0.03, alpha: 0.9 }] });
    });
  }
}

/** Parmigiano Reggiano: grainy straw paste, golden rind, its almond knife. */
const parmigiano = (ctx: Ctx, x: number, y: number, s: number, knife = true) =>
  cheeseWedge(ctx, x, y, s, { paste: '#f8e6a6', side: '#eccf86', rind: '#d9a447', rindSide: '#c98f3a', grain: '#dcc075', knife });
/** Pecorino Romano: chalk-white paste under a black-coated rind. */
const pecorino = (ctx: Ctx, x: number, y: number, s: number) =>
  cheeseWedge(ctx, x, y, s, { paste: '#fbf6e8', side: '#ece3cc', rind: '#3a2c24', rindSide: '#2c201a', grain: '#ddd2b6' });

/** A half eggshell lying cup-up; with `yolk`, the yolk still sits in it. */
function eggShell(ctx: Ctx, x: number, y: number, s: number, a: number, yolk: boolean, seed: number) {
  const R = rng(seed);
  rot(ctx, x, y, a, () => {
    // the jagged opening
    const rim: Pt[] = [];
    for (let i = 0; i < 18; i++) {
      const t = (i / 18) * TAU;
      const kk = i % 2 ? 0.86 + R() * 0.06 : 1;
      rim.push([Math.cos(t) * s * kk, Math.sin(t) * s * 0.44 * kk]);
    }
    const cup: Build = (c) => {
      c.moveTo(-s, 0);
      c.bezierCurveTo(-s, s * 0.75, -s * 0.45, s * 1.0, s * 0.05, s * 1.0);
      c.bezierCurveTo(s * 0.55, s * 1.0, s, s * 0.7, s, 0);
      polyPath(c, rim);
    };
    shape(ctx, cup, {
      fill: rgrad(ctx, -s * 0.4, s * 0.2, 0.2, s * 1.4, [[0, '#fffaf0'], [0.6, '#f2e4cc'], [1, '#d9c3a0']]),
      ink: 1.3, shadow: '#cdb48e', shadowOffset: [-s * 0.18, -s * 0.12],
    });
    const open: Build = (c) => polyPath(c, rim);
    fillP(ctx, open, '#fff6e2');
    crescent(ctx, open, [s * 0.12, s * 0.2], '#d8c39e', 0.9);
    strokeP(ctx, open, 0.8, '#a88a62', 0.9);
    speckle(ctx, s * 0.05, s * 0.55, s * 0.7, s * 0.3, 8, '#c8aa80', 0.35, seed + 2, 0.6);
    if (yolk) {
      shape(ctx, (c) => ellipsePath(c, s * 0.04, s * 0.02, s * 0.6, s * 0.34), {
        fill: rgrad(ctx, -s * 0.2, -s * 0.12, 0.2, s * 0.7, [[0, '#ffd84a'], [0.6, '#ffaa14'], [1, '#e88a08']]),
        ink: 1.0, shadow: '#e07a06', shadowOffset: [-s * 0.08, -s * 0.1],
        gloss: [{ x: -s * 0.18, y: -s * 0.1, rx: s * 0.2, ry: s * 0.08, rot: -0.2, alpha: 0.95 }],
      });
    }
  });
}

/** A wooden pepper mill standing on the table; (x,y) = the middle of its base. */
function pepperMill(ctx: Ctx, x: number, y: number, h: number) {
  const prof: [number, number][] = [
    [0, h * 0.17], [0.05, h * 0.185], [0.12, h * 0.18], [0.15, h * 0.155], [0.3, h * 0.12], [0.48, h * 0.105],
    [0.64, h * 0.135], [0.76, h * 0.15], [0.84, h * 0.13], [0.88, h * 0.09], [0.92, h * 0.105], [0.95, h * 0.06], [1, h * 0.05],
  ];
  contact(ctx, x + 2, y + 0.5, h * 0.3, h * 0.08, 0.4);
  const body = lathe(x, y, h, prof);
  shape(ctx, body, {
    fill: vgrad(ctx, y - h, y, [[0, '#9a5a30'], [0.5, '#7a4222'], [1, '#5e3018']]),
    ink: 2.0, shadow: '#4a2410', shadowOffset: [-h * 0.07, 0],
  });
  clip(ctx, body, () => {
    // turned rings and the metal collar at the base
    fillP(ctx, (c) => c.rect(x - h * 0.3, y - h * 0.14, h * 0.6, h * 0.035), '#d6d9de');
    for (const t of [0.12, 0.84, 0.9]) line(ctx, [[x - h * 0.3, y - h * t], [x + h * 0.3, y - h * t]], 0.7, '#3a1a08', false, 0.7);
    // grain
    for (let i = -2; i <= 2; i++) line(ctx, [[x + i * h * 0.04, y - h * 0.16], [x + i * h * 0.05, y - h * 0.82]], 0.35, '#4a2410', true, 0.35);
    line(ctx, [[x - h * 0.08, y - h * 0.2], [x - h * 0.065, y - h * 0.45], [x - h * 0.085, y - h * 0.72]], h * 0.03, 'rgba(255,220,180,0.55)', true);
  });
  shape(ctx, (c) => ellipsePath(c, x, y - h * 1.0, h * 0.06, h * 0.045), { fill: '#a8683a', ink: 1.2, shadow: 'none', gloss: [{ x: x - h * 0.02, y: y - h * 1.01, rx: h * 0.025, ry: h * 0.015, alpha: 0.8 }] });
}

/** A dried red chili lying on the table. */
function chili(ctx: Ctx, x: number, y: number, L: number, a: number, bend = 1) {
  rot(ctx, x, y, a, () => {
    const w = L * 0.16;
    const pts: Pt[] = [];
    const lo: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const px = -L / 2 + u * L;
      const py = Math.sin(u * Math.PI * 0.9) * bend * L * 0.1 + u * u * bend * L * 0.08;
      const hw = w * (1 - Math.pow(u, 1.6)) + 0.25;
      pts.push([px, py - hw]);
      lo.push([px, py + hw]);
    }
    const b: Build = (c) => smoothPath(c, [...pts, ...[...lo].reverse()], true, 0.4);
    shape(ctx, b, {
      fill: rgrad(ctx, -L * 0.2, -w * 0.5, 0.2, L * 0.7, [[0, '#f0442a'], [0.6, '#c81e14'], [1, '#8a120c']]),
      ink: 1.2, shadow: '#8a120c', shadowOffset: [-0.4, -w * 0.5],
      gloss: [{ x: -L * 0.12, y: -w * 0.45, rx: L * 0.22, ry: w * 0.16, rot: 0.05, alpha: 0.8 }],
    });
    clip(ctx, b, () => {
      for (let i = 0; i < 4; i++) line(ctx, [[-L * 0.3 + i * L * 0.18, -w], [-L * 0.25 + i * L * 0.18, w]], 0.4, '#7a0e08', true, 0.45);
    });
    // calyx and stem
    shape(ctx, (c) => blobPath(c, -L * 0.52, 0, w * 0.55, w * 0.95, 0.15, 7, 3), { fill: '#6a7a2a', ink: 1.0, shadow: '#4a5418' });
    line(ctx, [[-L * 0.58, 0], [-L * 0.7, -w * 0.3], [-L * 0.76, -w * 0.9]], 1.9, INK, true);
    line(ctx, [[-L * 0.58, 0], [-L * 0.7, -w * 0.3], [-L * 0.76, -w * 0.9]], 0.9, '#7a8a32', true);
  });
}

/** A stemmed glass of red wine; (x,y) = the middle of its foot. */
function wineGlass(ctx: Ctx, x: number, y: number, h: number) {
  const bw = h * 0.21;
  const bowlB: Build = (c) => {
    c.moveTo(x - bw * 0.82, y - h);
    c.bezierCurveTo(x - bw * 1.08, y - h * 0.82, x - bw * 1.05, y - h * 0.55, x, y - h * 0.47);
    c.bezierCurveTo(x + bw * 1.05, y - h * 0.55, x + bw * 1.08, y - h * 0.82, x + bw * 0.82, y - h);
    c.closePath();
  };
  contact(ctx, x + 2, y + 0.6, h * 0.24, h * 0.07, 0.35);
  // foot + stem
  shape(ctx, (c) => ellipsePath(c, x, y, h * 0.17, h * 0.055), { fill: rgba('#eef4f6', 0.85), ink: 1.3, shadow: 'none' });
  shape(ctx, (c) => roundRectPath(c, x - 0.75, y - h * 0.49, 1.5, h * 0.48, 0.7), { fill: '#eef4f6', ink: 1.1, shadow: 'none' });
  // the bowl: wine in the lower part, clear glass above
  shape(ctx, bowlB, { fill: rgba('#f4f8fa', 0.6), ink: 1.5, shadow: 'none' });
  const wy = y - h * 0.72;
  clip(ctx, bowlB, () => {
    fillP(ctx, (c) => c.rect(x - bw * 1.2, wy, bw * 2.4, h * 0.3), rgrad(ctx, x - bw * 0.4, wy + h * 0.06, 0.5, bw * 1.3, [[0, '#b2203a'], [0.55, '#7e1024'], [1, '#4a0614']]));
    fillP(ctx, (c) => ellipsePath(c, x, wy, bw * 1.02, h * 0.035), '#9a1a30');
    fillP(ctx, (c) => ellipsePath(c, x - bw * 0.25, wy, bw * 0.45, h * 0.012), 'rgba(255,190,200,0.6)');
  });
  strokeP(ctx, (c) => ellipsePath(c, x, y - h, bw * 0.82, h * 0.03), 0.8, rgba(INK, 0.8));
  line(ctx, [[x - bw * 0.62, y - h * 0.93], [x - bw * 0.78, y - h * 0.78], [x - bw * 0.6, y - h * 0.62]], 1.1, 'rgba(255,255,255,0.95)', true);
  glint(ctx, x + bw * 0.5, y - h * 0.62, 0.8, 0.5, 0, 0.8);
}

/** A marble mortar with its wooden pestle, a little pesto inside and basil peeking over the rim. */
function mortar(ctx: Ctx, x: number, y: number, s: number) {
  const ry = s * 0.42, depth = s * 0.62;
  contact(ctx, x + 2, y + ry + depth * 0.9, s * 1.05, s * 0.3, 0.35);
  const wall: Build = (c) => {
    c.moveTo(x - s, y);
    c.bezierCurveTo(x - s, y + ry + depth * 0.6, x - s * 0.6, y + ry + depth, x, y + ry + depth);
    c.bezierCurveTo(x + s * 0.6, y + ry + depth, x + s, y + ry + depth * 0.6, x + s, y);
    c.ellipse(x, y, s, ry, 0, 0, Math.PI);
    c.closePath();
  };
  const lug = (sx: number): Build => (c) => roundRectPath(c, x + sx * s * 0.93 - s * 0.14, y - ry * 0.2, s * 0.28, ry * 0.9, s * 0.08);
  const rimB: Build = (c) => ellipsePath(c, x, y, s, ry);
  group(ctx, [
    { build: lug(-1), style: { fill: '#e8e4dc', shadow: 'none' } },
    { build: lug(1), style: { fill: '#d6d0c4', shadow: 'none' } },
    { build: wall, style: { fill: '#efece6', shadow: 'none' } },
    { build: rimB, style: { fill: '#f7f5f0', shadow: 'none' } },
  ], 2.0);
  clip(ctx, wall, () => {
    const g = ctx.createLinearGradient(x - s, 0, x + s, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.4)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(90,90,100,0.38)');
    ctx.fillStyle = g;
    ctx.fillRect(x - s - 2, y - 2, s * 2 + 4, ry + depth + 6);
    // marble veins
    line(ctx, [[x - s * 0.7, y + ry * 0.8], [x - s * 0.3, y + ry + depth * 0.4], [x + s * 0.1, y + ry + depth * 0.5]], 0.45, '#9aa0aa', true, 0.6);
    line(ctx, [[x + s * 0.2, y + ry * 0.9], [x + s * 0.55, y + ry + depth * 0.3]], 0.35, '#9aa0aa', true, 0.5);
  });
  // the pesto inside
  const op: Build = (c) => ellipsePath(c, x, y + ry * 0.05, s * 0.8, ry * 0.76);
  fillP(ctx, op, '#dcd8d0');
  clip(ctx, op, () => {
    fillP(ctx, (c) => ellipsePath(c, x + s * 0.06, y + ry * 0.35, s * 0.78, ry * 0.62), '#58a82c');
    speckle(ctx, x + s * 0.06, y + ry * 0.35, s * 0.7, ry * 0.5, 14, '#2c6a18', 0.4, 9, 0.9);
    glint(ctx, x - s * 0.25, y + ry * 0.2, s * 0.18, s * 0.05, -0.1, 0.8);
  });
  crescent(ctx, op, [s * 0.1, s * 0.16], '#a8a294', 0.7);
  basilLeaf(ctx, x - s * 0.45, y - ry * 0.35, s * 0.85, -0.9, { col: '#3e9a3a' });
  // the pestle, leaning on the rim
  rot(ctx, x + s * 0.15, y + ry * 0.1, -0.95, () => {
    shape(ctx, (c) => {
      c.moveTo(-s * 0.18, 0);
      c.lineTo(-s * 0.09, -s * 1.5);
      c.quadraticCurveTo(0, -s * 1.62, s * 0.09, -s * 1.5);
      c.lineTo(s * 0.18, 0);
      c.quadraticCurveTo(0, s * 0.16, -s * 0.18, 0);
      c.closePath();
    }, { fill: '#d9a86c', ink: 1.4, shadow: '#a8743c', shadowOffset: [-s * 0.08, 0], gloss: [{ x: -s * 0.06, y: -s * 0.8, rx: s * 0.03, ry: s * 0.45, alpha: 0.6 }] });
  });
  basilLeaf(ctx, x + s * 0.55, y - ry * 0.15, s * 0.75, 0.5, { col: '#47a643' });
}

/** A little dish for the empty clam shells. */
function shellDish(ctx: Ctx, x: number, y: number, s: number) {
  plate(ctx, x, y, s, s * TILT, { band: '#2d6fb5', th: 1.8, ink: 1.8, well: 0.6, double: false });
  const col = '#d4bf9e';
  rot(ctx, x - s * 0.36, y - s * 0.02, 0.4, () => shellOut(ctx, s * 0.34, '#cfb999'), 1, 0.8);
  rot(ctx, x + s * 0.32, y - s * 0.08, -0.5, () => { valveInside(ctx, s * 0.34, col); });
  rot(ctx, x - s * 0.02, y + s * 0.16, 0.2, () => shellOut(ctx, s * 0.36, '#d9c6a6'), 1, 0.8);
  rot(ctx, x + s * 0.18, y + s * 0.2, 2.6, () => { valveInside(ctx, s * 0.3, col); });
}

/** A whole head of garlic, papery and streaked with violet, with a loose clove. */
function garlicBulb(ctx: Ctx, x: number, y: number, s: number) {
  contact(ctx, x + 1.5, y + s * 0.75, s * 1.05, s * 0.3, 0.35);
  const body: Build = (c) => {
    c.moveTo(x, y - s * 1.25);
    c.bezierCurveTo(x + s * 0.18, y - s * 0.95, x + s * 1.05, y - s * 0.75, x + s * 1.02, y + s * 0.05);
    c.bezierCurveTo(x + s * 1.0, y + s * 0.7, x + s * 0.4, y + s * 0.82, x, y + s * 0.8);
    c.bezierCurveTo(x - s * 0.4, y + s * 0.82, x - s * 1.0, y + s * 0.7, x - s * 1.02, y + s * 0.05);
    c.bezierCurveTo(x - s * 1.05, y - s * 0.75, x - s * 0.18, y - s * 0.95, x, y - s * 1.25);
    c.closePath();
  };
  shape(ctx, body, {
    fill: rgrad(ctx, x - s * 0.4, y - s * 0.4, 0.3, s * 1.5, [[0, '#ffffff'], [0.55, '#f4ede0'], [1, '#d8cab2']]),
    ink: 1.6, shadow: '#d4c4aa', shadowOffset: [-s * 0.22, -s * 0.15],
    gloss: [{ x: x - s * 0.45, y: y - s * 0.3, rx: s * 0.16, ry: s * 0.32, rot: 0.2, alpha: 0.8 }],
  });
  clip(ctx, body, () => {
    for (const k of [-0.62, -0.25, 0.18, 0.58]) {
      line(ctx, [[x + k * s * 0.3, y - s * 0.95], [x + k * s * 1.05, y - s * 0.2], [x + k * s * 0.9, y + s * 0.5], [x + k * s * 0.4, y + s * 0.82]], 0.6, '#b4a080', true, 0.85);
      line(ctx, [[x + k * s * 1.0 + s * 0.08, y - s * 0.3], [x + k * s * 0.95 + s * 0.1, y + s * 0.3]], s * 0.08, '#b07aa8', true, 0.45);
    }
  });
  // roots
  for (let i = -2; i <= 2; i++) line(ctx, [[x + i * s * 0.08, y + s * 0.8], [x + i * s * 0.16, y + s * 0.98]], 0.5, '#a08a68', false, 0.9);
}

/** A little bunch of dried oregano: thin woody stems with clusters of tiny grey-green leaves at the tips. */
function oreganoSprig(ctx: Ctx, x: number, y: number, s: number, a: number) {
  rot(ctx, x, y, a, () => {
    const R = rng(77);
    const tips: Pt[] = [[s * 0.95, -s * 0.32], [s * 1.0, s * 0.02], [s * 0.85, s * 0.3]];
    for (const [tx, ty] of tips) {
      const stem: Pt[] = [[-s * 0.9, s * 0.05], [-s * 0.2, ty * 0.3], [tx * 0.7, ty * 0.85], [tx, ty]];
      line(ctx, stem, 1.5, INK, true);
      line(ctx, stem, 0.6, '#9a8448', true);
    }
    // tie of kitchen string
    line(ctx, [[-s * 0.45, -s * 0.12], [-s * 0.42, s * 0.18]], 1.6, '#e8dcc0');
    for (const [tx, ty] of tips) {
      for (let i = 0; i < 9; i++) {
        const u = R(), v = R() * TAU;
        const lx = tx - u * s * 0.45 + Math.cos(v) * s * 0.06, ly = ty * (1 - u * 0.35) + Math.sin(v) * s * 0.1;
        const r = s * (0.07 + R() * 0.035);
        shape(ctx, (c) => ellipsePath(c, lx, ly, r, r * 0.65, R() * 3), { fill: R() < 0.5 ? '#7a9038' : '#93a84a', ink: 0.45, inkColor: '#3a4a14', shadow: '#5a6e26', shadowOffset: [-0.15, -0.2] });
      }
    }
  });
}

// ---------------------------------------------------------------------------
// The pasta dishes
// ---------------------------------------------------------------------------

/** The standard pasta plate: x = 6 with the napkin on the left, -6 with it on the right. */
const PY = 8, PRX = 50, PRY = 22.5;

function drawPomodoro(ctx: Ctx) {
  vineTomatoes(ctx, 43, -17, [[-6, 0, 5], [2, -2, 5.4], [9.5, 1, 4.8], [-1, 6, 4.6]], 11);
  basilLeaf(ctx, 30, -21, 9, -0.4, { col: '#3e9a3a' });
  setting(ctx, 'L', '#d23a32');
  const well = plate(ctx, 6, PY, PRX, PRY, { band: '#c0392b' });
  pool(ctx, well.x + 1, well.y + 3.2, well.rx * 0.9, well.ry * 0.62, '#e2381e', 102);
  const st: PastaStyle = { kind: 'round', w: 1.8, col: '#f45e32', gap: '#a51f0e', hi: '#ffd0b4' };
  const n = nest(ctx, well.x, well.y + 2, 30.5, 15, st, 101, { trails: [[2.2, 1], [0.7, -1, 0.8]], drapes: [1.3, 2.0], loops: [-0.45, 0.35] });
  sauceBits(ctx, n, '#e8381e', 6, 13);
  sauceDollop(ctx, n.x - 1, n.y - n.h * 0.98, 11, 5.2, '#e5321b', 21, 5);
  basilLeaf(ctx, n.x + 5, n.y - n.h * 1.2, 14, -0.35, { col: '#3e9a3a' });
  basilLeaf(ctx, n.x - 7, n.y - n.h * 1.08, 12, -2.6, { col: '#35893a' });
  basilLeaf(ctx, n.x + 0.5, n.y - n.h * 1.32, 8.5, -1.5, { col: '#4aa843' });
}

function drawCarbonara(ctx: Ctx) {
  eggShell(ctx, -44, -24, 7.5, 0.15, true, 21);
  eggShell(ctx, -30, -27, 6, -0.3, false, 22);
  pecorino(ctx, -22, -24, 6.5);
  setting(ctx, 'R', '#d23a32');
  const well = plate(ctx, -6, PY, PRX, PRY, { band: '#a8661c' });
  pool(ctx, well.x + 1, well.y + 3.2, well.rx * 0.88, well.ry * 0.6, '#ffd24e', 202);
  const st: PastaStyle = { kind: 'round', w: 1.8, col: '#ffd65a', gap: '#d4961c', hi: '#fffbe0', shadeA: 0.24 };
  const n = nest(ctx, well.x, well.y + 2, 30.5, 15, st, 202, { trails: [[0.9, -1], [2.4, 1, 0.8]], drapes: [1.85, 1.15], loops: [-0.3, 0.5] });
  // glossy clumps of the egg-and-Pecorino cream clinging to the strands
  sauceBits(ctx, n, '#ffe680', 10, 55, 1.1);
  sheen(ctx, n, 10, 56, 1.5);
  // big crisp guanciale on top and on the plate
  const bits: [number, number, number, number, number][] = [
    [-0.3, 0.95, 0.45, 6.4, 0.2], [2.2, 0.9, 0.7, 6.2, -0.3], [1.2, 0.98, 0.15, 6, 0.5], [0.85, 0.55, 0.96, 6.2, 0.1], [2.55, 0.45, 0.96, 6, -0.5], [0.15, 0.4, 0.96, 5.8, 0.4],
  ];
  bits.forEach(([a, t, d, s, r], i) => {
    const p = n.at(a, t, d);
    guancialeBit(ctx, p[0], p[1], s, r, 300 + i);
  });
  guancialeBit(ctx, n.x + 26, n.y + 9, 5.4, 0.3, 320);
  // Pecorino dust and plenty of black pepper
  cheeseSnow(ctx, n.x - 1, n.y - n.h * 0.85, 13, 5, 50, 31);
  pepper(ctx, n.x, n.y - n.h * 0.5, 22, 11, 120, 41, 0.46);
}

function drawAlfredo(ctx: Ctx) {
  parmigiano(ctx, -40, -24, 10);
  fork(ctx, 30, -14, 26, 1.0, GOLD);
  spoon(ctx, 32, -9, 26, 1.12, GOLD);
  // an oval serving platter with a double gold rim
  const well = plate(ctx, 0, PY + 1, 55, 22, { band: '#c99a22', well: 0.7 });
  pool(ctx, well.x + 1, well.y + 3, well.rx * 0.86, well.ry * 0.6, '#f6e2a0', 303);
  const st: PastaStyle = { kind: 'ribbon', w: 4.4, col: '#f9e09a', gap: '#b88c46', hi: '#fffdf0', shadeA: 0.26 };
  const n = nest(ctx, well.x, well.y + 2, 33, 14, st, 303, { trails: [[2.5, 1], [0.55, -1, 0.9]], drapes: [1.35] });
  // the butter-and-Parmigiano emulsion: glossy, pale gold
  sauceBits(ctx, n, '#fbeab2', 8, 66, 1.2);
  sheen(ctx, n, 14, 67, 1.8);
  // finely grated Parmigiano Reggiano over the top
  cheeseSnow(ctx, n.x, n.y - n.h * 0.82, 16, 6, 150, 32, '#fffaea');
  speckle(ctx, n.x, n.y - n.h * 0.82, 14, 5, 30, '#e3c47a', 0.45, 34, 0.9);
}

function drawAmatriciana(ctx: Ctx) {
  pecorino(ctx, -42, -24, 9.5);
  chili(ctx, -22, -22, 13, 0.35, 1);
  chili(ctx, -19, -15, 11, -0.2, -1);
  setting(ctx, 'R', '#2d6fb5');
  const well = plate(ctx, -6, PY, PRX, PRY, { band: '#8e2a1e' });
  pool(ctx, well.x + 1, well.y + 3.2, well.rx * 0.9, well.ry * 0.62, '#c8361c', 404);
  const st: PastaStyle = { kind: 'tube', w: 3.0, col: '#e0541e', gap: '#8e2a0c', hi: '#ffbe84', shadeA: 0.22 };
  const n = nest(ctx, well.x, well.y + 2, 30.5, 15.5, st, 404, { trails: [[0.8, -1], [2.3, 1, 0.8]], drapes: [1.2, 1.95], loops: [-0.45, 0.4] });
  sauceBits(ctx, n, '#c9301a', 8, 24, 1.1);
  // the oily sheen of rendered guanciale fat in the tomato
  sheen(ctx, n, 10, 25, 1.3, '#ffb648');
  // cooked guanciale: fewer, bigger, amber and crisp
  const strips: [number, number, number, number, number, number][] = [
    [0.55, 0.62, 0.97, 10, 0.5, 1], [2.45, 0.6, 0.97, 9.5, -0.6, -1], [1.5, 0.35, 0.98, 9.5, 0.1, 1], [-0.6, 0.86, 0.55, 9, -0.25, -1], [0.05, 0.3, 0.98, 8.5, 0.9, 1],
  ];
  for (const [a, t, d, L, r, b] of strips) {
    const p = n.at(a, t, d);
    guancialeStrip(ctx, p[0], p[1], L, r, b);
  }
  // a white cap of grated Pecorino Romano, and a few chili flakes
  cheeseCap(ctx, n.x - 1, n.y - n.h * 0.98, 9.5, 4.2, 34);
  cheeseSnow(ctx, n.x, n.y - n.h * 0.85, 15, 6, 50, 35);
  chiliFlakes(ctx, n.x, n.y - n.h * 0.6, 16, 8, 7, 36);
}

function drawCacioePepe(ctx: Ctx) {
  pepperMill(ctx, 44, -3, 32);
  speckle(ctx, 33, -8, 5, 1.6, 7, '#22140e', 0.7, 51, 1);
  setting(ctx, 'L', '#2d6fb5');
  const well = plate(ctx, 6, PY, PRX, PRY, { band: '#8a5a2a' });
  pool(ctx, well.x + 1, well.y + 3.2, well.rx * 0.88, well.ry * 0.6, '#f2e6c4', 505);
  const st: PastaStyle = { kind: 'square', w: 2.1, col: '#f0e0b2', gap: '#ad935c', hi: '#fffdf2', shadeA: 0.34 };
  const n = nest(ctx, well.x, well.y + 2, 30.5, 15, st, 505, { trails: [[2.3, 1], [0.6, -1, 0.9]], drapes: [1.4, 2.1], loops: [-0.4, 0.3] });
  // the Pecorino cream clinging in glossy folds
  sauceBits(ctx, n, '#fbf1d6', 10, 88, 1.05);
  cheeseSnow(ctx, n.x, n.y - n.h * 0.85, 14, 5.5, 60, 37);
  // freshly cracked black pepper, generously
  pepper(ctx, n.x, n.y - n.h * 0.55, 23, 12, 190, 42, 0.56);
  pepper(ctx, n.x, n.y + 9, 27, 4, 24, 43, 0.46);
}

function drawRagu(ctx: Ctx) {
  wineGlass(ctx, -45, -5, 31);
  setting(ctx, 'R', '#3a8f3f');
  const well = plate(ctx, -6, PY, PRX, PRY, { wide: '#c0602e', col: '#fbf4e6' });
  pool(ctx, well.x + 1, well.y + 3.2, well.rx * 0.9, well.ry * 0.64, '#9a4424', 606);
  // egg tagliatelle tossed in the ragù: orange-brown ribbons
  const st: PastaStyle = { kind: 'ribbon', w: 4.4, col: '#e8963e', gap: '#5a1e0a', hi: '#ffe0a8', shadeA: 0.24 };
  const n = nest(ctx, well.x, well.y + 2, 31, 15, st, 606, { trails: [[0.6, -1, 0.8], [2.5, 1, 0.8]], drapes: [1.25, 1.95] });
  // the ragù all through it: a grainy coat of minced meat on every ribbon, and clumps in the folds
  const R = rng(99);
  const crumbs = (px: number, py: number, rx: number, ry: number, count: number, seed: number, size = 1) => {
    const Q = rng(seed);
    for (let i = 0; i < count; i++) {
      const a = Q() * TAU, d = Math.sqrt(Q());
      const x = px + Math.cos(a) * rx * d, y = py + Math.sin(a) * ry * d;
      const r = (0.4 + Q() * 0.45) * size;
      const lit = Math.sin(a) < 0.2 && Q() < 0.75;
      fillP(ctx, (c) => blobPath(c, x, y, r * 1.2, r * 0.8, 0.4, 6, i + seed), lit ? (Q() < 0.5 ? '#b65e30' : '#9e4a24') : (Q() < 0.5 ? '#5a200e' : '#6e2a14'));
    }
  };
  clip(ctx, n.sil, () => {
    speckle(ctx, n.x, n.y - n.h * 0.45, n.rx, n.h * 0.9, 60, '#7a2c12', 0.45, 401, 0.8);
    for (let i = 0; i < 30; i++) {
      const a = Math.PI * (-0.02 + R() * 1.04), t = 0.06 + R() * 0.86;
      const p = n.at(a, t, 0.99);
      const r = 1.5 + R() * 1.5;
      fillP(ctx, (c) => blobPath(c, p[0] + 0.3, p[1] + 0.5, r * 1.35, r * 0.75, 0.35, 9, 400 + i), '#3a1206', 0.55);
      fillP(ctx, (c) => blobPath(c, p[0], p[1], r * 1.3, r * 0.7, 0.35, 9, 400 + i), '#8a3416');
      crumbs(p[0], p[1] - r * 0.1, r * 1.1, r * 0.6, Math.round(r * 5), 500 + i * 7);
      glint(ctx, p[0] - r * 0.5, p[1] - r * 0.3, r * 0.3, r * 0.1, -0.2, 0.7);
    }
  });
  // a spoonful more on top: a crumbly heap, glossy with tomato and soffritto
  const cx = n.x - 1, cy = n.y - n.h * 1.0;
  fillP(ctx, (c) => blobPath(c, cx, cy + 0.6, 8.5, 3.8, 0.3, 12, 61), '#3a1206');
  fillP(ctx, (c) => blobPath(c, cx, cy, 8, 3.6, 0.3, 12, 61), '#7e3016');
  crumbs(cx, cy - 0.4, 7.6, 3.4, 46, 62, 1.25);
  crumbs(cx - 1, cy - 1.2, 5, 2, 16, 64, 1.1);
  speckle(ctx, cx, cy, 7, 3.2, 8, '#e0782e', 0.45, 63, 0.9);
  glint(ctx, cx - 3.5, cy - 1.8, 1.6, 0.6, -0.3, 0.8);
  // Parmigiano snow
  cheeseSnow(ctx, n.x, n.y - n.h * 0.85, 13, 5, 45, 63, '#fff6dc');
}

function drawVongole(ctx: Ctx) {
  shellDish(ctx, -43, -22, 12);
  setting(ctx, 'R', '#2d6fb5');
  // a deep pasta bowl with a wide blue-banded rim
  const b = bowl(ctx, -6, 4, 48, 20.5, 9, { rimBand: '#2d6fb5', well: 0.7, band: '#2d6fb5' });
  pool(ctx, b.x + 1, b.y + 4.5, b.rx * 0.84, b.ry * 0.6, '#f1dc9a', 18, 0.75);
  const st: PastaStyle = { kind: 'round', w: 1.75, col: '#f5d97f', gap: '#b98a2e', hi: '#fffbe2', shadeA: 0.26 };
  const bx = b.x, by = b.y + 4.5;
  // clams tucked behind the nest
  clamOpen(ctx, bx - 21, by - 9, 6.4, 0.2, 1);
  clamClosed(ctx, bx + 23, by - 8, 6.2, 0.3, 2);
  const n = nest(ctx, bx, by, 26.5, 14, st, 707, { trails: [[2.5, 1, 0.7]], drapes: [1.75], loops: [-0.4, 0.3] });
  sheen(ctx, n, 10, 111, 1.4, '#fff0a8');
  parsley(ctx, n.x, n.y - n.h * 0.6, 20, 9, 60, 71);
  clamOpen(ctx, n.x - 3, n.y - n.h * 1.0, 6, -0.12, 4);
  clamClosed(ctx, n.x + 12, n.y - n.h * 0.66, 5.6, 0.45, 5);
  b.front();
  // clams round the front, some on the rim
  clamOpen(ctx, n.x - 19, n.y + 6.5, 6.6, -0.18, 6);
  clamClosed(ctx, n.x + 2, n.y + 11, 6, 0.05, 7);
  clamOpen(ctx, n.x + 18, n.y + 7.5, 6.6, 0.22, 8);
  parsley(ctx, n.x + 2, n.y - n.h * 0.85, 9, 3.5, 20, 74);
  parsley(ctx, b.x, b.y + 11, b.rx * 0.9, 3, 18, 72);
  chiliFlakes(ctx, n.x, n.y - n.h * 0.55, 17, 8, 7, 73);
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
    // pale durum tips, pesto-green in the middle
    const g = ctx.createLinearGradient(-L / 2, 0, L / 2, 0);
    g.addColorStop(0, '#f4e6aa');
    g.addColorStop(0.3, col);
    g.addColorStop(0.7, col);
    g.addColorStop(1, '#f4e6aa');
    shape(ctx, build, { fill: g, ink: 0.55, inkColor: '#24480e', shadow: shade(col, 0.2), shadowOffset: [-0.4, -0.6] });
    clip(ctx, build, () => {
      for (let i = -3; i <= 3; i++) {
        const gx = i * L * 0.13;
        line(ctx, [[gx - w * 0.9, -w * 1.4 + bend * L * 0.1], [gx + w * 0.9, w * 1.4 + bend * L * 0.1]], 0.4, shade(col, 0.3), false, 0.6);
      }
    });
    glint(ctx, -L * 0.1, -w * 0.4 + bend * L * 0.08, L * 0.14, w * 0.25, 0, 0.8);
  }, 1, 0.85);
}

/** A boiled potato cube: lit top, mid left face, shaded right face. */
function potatoCube(ctx: Ctx, x: number, y: number, s: number, a: number) {
  rot(ctx, x, y, a * 0.3, () => {
    const t: Pt[] = [[-s * 0.55, -s * 0.18], [s * 0.05, -s * 0.5], [s * 0.6, -s * 0.2], [0, s * 0.1]];
    const lf: Pt[] = [t[0], t[3], [0, s * 0.68], [-s * 0.55, s * 0.36]];
    const rf: Pt[] = [t[3], t[2], [s * 0.6, s * 0.36], [0, s * 0.68]];
    group(ctx, [
      { build: (c) => polyPath(c, lf), style: { fill: '#f1d885', shadow: 'none' } },
      { build: (c) => polyPath(c, rf), style: { fill: '#d6b45c', shadow: 'none' } },
      { build: (c) => polyPath(c, t), style: { fill: '#fdf0bc', shadow: 'none' } },
    ], 0.85);
    line(ctx, [t[0], t[3], t[2]], 0.45, '#b8964a', false, 0.8);
    line(ctx, [t[3], [0, s * 0.68]], 0.45, '#b8964a', false, 0.8);
    speckle(ctx, s * 0.02, -s * 0.18, s * 0.35, s * 0.14, 3, '#4e9a2a', 0.45, Math.round(x * 7), 0.9);
    glint(ctx, -s * 0.05, -s * 0.24, s * 0.18, s * 0.07, -0.4, 0.9);
  });
}

function drawPesto(ctx: Ctx) {
  mortar(ctx, 43, -20, 10);
  setting(ctx, 'L', '#d23a32');
  // a shallow coupe bowl, green-banded outside
  const b = bowl(ctx, 6, 5, 46, 20.5, 9, { band: '#3a8f3f', well: 0.9 });
  const R = rng(121);
  const cx = b.x, base = b.y + 4.5;
  const MR = 31, MH = 17;
  const prof = (t: number) => MR * Math.pow(Math.max(0, 1 - Math.pow(t, 2.2)), 0.5);
  const sil: Build = (c) => {
    for (let i = 0; i <= 30; i++) {
      const t = (i / 30) * 0.98;
      ellipsePath(c, cx, base - MH * t, prof(t), prof(t) * TILT);
    }
  };
  shape(ctx, sil, { fill: '#5aae2c', ink: OUT, shadow: 'none' });
  // pesto-coated trofie with potato and green beans, painted back to front
  const items: { x: number; y: number; k: number; r: number }[] = [];
  for (let i = 0; i < 125; i++) {
    const t = Math.pow(R(), 0.75) * 0.97;
    const a = R() * TAU;
    const d = 0.6 + 0.38 * Math.sqrt(R());
    const r = prof(t) * d;
    items.push({ x: cx + Math.cos(a) * r, y: base - MH * t + Math.sin(a) * r * TILT, k: i, r: R() });
  }
  items.sort((p, q) => p.y - q.y);
  for (const it of items) {
    const j = it.k;
    if (j % 16 === 5) {
      potatoCube(ctx, it.x, it.y, 4.6, it.r - 0.5);
    } else if (j % 21 === 11) {
      // green bean
      rot(ctx, it.x, it.y, (it.r - 0.5) * 1.4, () => {
        shape(ctx, (c) => smoothPath(c, [[-6, 0.2], [-2, -1.25], [3, -1.15], [6.1, 0], [2, 1.15], [-3, 1.15]], true, 0.5), {
          fill: '#2f9a3e', ink: 0.75, shadow: '#1f6a2c', shadowOffset: [-0.4, -0.5], gloss: [{ x: -1, y: -0.5, rx: 2.6, ry: 0.32, alpha: 0.6 }],
        });
      });
    } else {
      const col = mix('#d6e070', '#5cb82a', 0.4 + it.r * 0.35);
      trofia(ctx, it.x, it.y, 7 + it.r * 1.4, (it.r - 0.5) * 1.6 + (j % 3 === 0 ? 1.2 : 0), col, j % 2 ? 1 : -1);
      if (j % 4 === 1) fillP(ctx, (c) => blobPath(c, it.x + 0.5, it.y + 0.6, 1.4, 0.8, 0.3, 6, j), '#5cb02a', 0.9);
    }
  }
  // light shading over the heap
  clip(ctx, sil, () => {
    const g = ctx.createRadialGradient(cx - 10, base - 14, 2, cx - 2, base - 8, 36);
    g.addColorStop(0, 'rgba(255,255,220,0.2)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, rgba('#2a5a10', 0.22));
    ctx.fillStyle = g;
    ctx.fillRect(cx - 40, base - 40, 80, 60);
  });
  crescent(ctx, sil, [-3, -2.6], '#2a5a10', 0.14);
  b.front();
  // a spoon of bright pesto on top, glossy with oil
  const tx = cx, ty = base - MH * 0.95;
  const top: Build = (c) => blobPath(c, tx, ty, 10.5, 4.6, 0.22, 12, 7);
  shape(ctx, top, {
    fill: '#62b832', ink: 1.2, shadow: '#3f8a1e', shadowOffset: [-1.2, -1.1],
    gloss: [{ x: tx - 3.5, y: ty - 1.5, rx: 3.2, ry: 1.0, rot: -0.2, alpha: 0.8, color: '#f0fab8' }],
  });
  clip(ctx, top, () => {
    speckle(ctx, tx, ty, 8, 3.6, 18, '#2c6a18', 0.45, 8, 0.85);
    speckle(ctx, tx, ty, 8, 3.6, 12, '#b8e05a', 0.4, 9, 0.9);
  });
  // three pine nuts, a little cheese, basil
  for (const [dx, dy, a] of [[-6.5, -17.5, 0.4], [5, -19.5, -0.6], [8.5, -15, 1.2]] as [number, number, number][]) {
    rot(ctx, cx + dx, base + dy, a, () => {
      shape(ctx, (c) => smoothPath(c, [[-1.4, 0], [-0.3, -0.65], [1.3, -0.3], [1.4, 0.3], [-0.3, 0.65]], true, 0.5), {
        fill: '#f6e9c2', ink: 0.55, shadow: '#d7c08a', shadowOffset: [-0.3, -0.35], gloss: [{ x: -0.3, y: -0.3, rx: 0.5, ry: 0.2, alpha: 0.85 }],
      });
    });
  }
  cheeseSnow(ctx, cx, base - 15, 13, 5, 26, 38);
  basilLeaf(ctx, cx + 4, base - MH - 4.5, 14, -0.45, { col: '#3e9a3a' });
  basilLeaf(ctx, cx - 6.5, base - MH - 3, 11, -2.7, { col: '#34883a' });
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
  ], 2.4);
  clip(ctx, outer, () => {
    fillP(ctx, outer, rgrad(ctx, x - rx * 0.4, y - ry * 0.55, 2, rx * 1.25, [[0, '#f7d494'], [0.6, '#e8b264'], [1, '#c8873e']]));
    strokeP(ctx, (c) => ellipsePath(c, x, y, rx * 0.93, ry * 0.9), 3.2, 'rgba(255,240,205,0.55)');
  });
  clip(ctx, under, () => fillP(ctx, (c) => ellipsePath(c, x + rx * 0.4, y + th + ry * 0.4, rx * 0.9, ry), '#a8692e', 0.55));
  const sx = x + 0.6, sy = y + 0.8, srx = rx * 0.8, sry = ry * 0.76;
  const sauce: Build = (c) => blobPath(c, sx, sy, srx, sry, 0.05, 16, seed + 1);
  shape(ctx, sauce, { fill: sauceCol, ink: 1.0, inkColor: '#8a3a1c', shadow: 'none' });
  clip(ctx, sauce, () => {
    speckle(ctx, sx, sy, srx * 0.95, sry * 0.95, 26, shade(sauceCol, 0.22), 1.5, seed + 2, 0.55);
    speckle(ctx, sx, sy, srx * 0.95, sry * 0.95, 18, light(sauceCol, 0.25), 1.1, seed + 3, 0.45);
    strokeP(ctx, (c) => ellipsePath(c, sx, sy, srx, sry), 3, rgba(shade(sauceCol, 0.35), 0.45));
  });
  crescent(ctx, sauce, [2.2, 2.6], '#5a1a0a', 0.3);
  // leopard spots: charred freckles in clusters + a few blistered bubbles
  const ring = () => {
    const a = R() * TAU;
    const d = 0.86 + R() * 0.12;
    return [x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d] as Pt;
  };
  clip(ctx, outer, () => {
    for (let i = 0; i < 9; i++) {
      const [bx, by] = ring();
      const r = 1.8 + R() * 1.6;
      // raised dough bubbles (no dark dot inside: a dot in a ring would read as an eye)
      shape(ctx, (c) => blobPath(c, bx, by, r, r * 0.62, 0.2, 7, i + seed), { fill: '#f7d79c', ink: 0.45, inkColor: '#c08440', shadow: '#d9a35c', shadowOffset: [-0.5, -0.5], gloss: [{ x: bx - r * 0.35, y: by - r * 0.2, rx: r * 0.3, ry: r * 0.14, alpha: 0.6 }] });
    }
    for (let i = 0; i < 32; i++) {
      const [bx, by] = ring();
      const n = 1 + Math.floor(R() * 3);
      for (let j = 0; j < n; j++) {
        const r = 0.45 + R() * 0.95;
        const px = bx + (R() - 0.5) * 3, py = by + (R() - 0.5) * 1.6;
        fillP(ctx, (c) => blobPath(c, px, py, r, r * 0.7, 0.4, 6, i * 3 + j + 40), R() < 0.7 ? '#33200f' : '#6e3c1a', 0.85);
      }
    }
    speckle(ctx, x, y, rx, ry, 40, '#fff8e8', 0.3, seed + 4, 0.6);
  });
  return { x, y, rx, ry, sx, sy, srx, sry, sauce };
}

/** Olive oil: a faint golden sheen with bright glints (not orange blotches). */
function oilGlints(ctx: Ctx, g: PizzaGeo, n: number, seed: number) {
  const R = rng(seed);
  clip(ctx, g.sauce, () => {
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * 0.85;
      const px = g.sx + Math.cos(a) * g.srx * d, py = g.sy + Math.sin(a) * g.sry * d;
      const rr = 2.2 + R() * 2;
      fillP(ctx, (c) => blobPath(c, px, py, rr, rr * 0.4, 0.25, 7, i + seed), rgba('#ffd75a', 0.28));
      line(ctx, [[px - rr * 0.6, py - 0.2], [px - rr * 0.1, py - rr * 0.22], [px + rr * 0.4, py - 0.1]], 0.7, '#fff6c8', true, 0.95);
      glint(ctx, px - rr * 0.35, py - 0.35, 0.65, 0.35, -0.3, 1);
    }
  });
}

function drawMargherita(ctx: Ctx) {
  ctx.translate(0, -1.5);
  napkin(ctx, [-56, 6], [-30, 2], [-26, 36], [-55, 36], '#d23a32', 6);
  const pl = { x: 4, y: 11 };
  contact(ctx, pl.x + 2.5, pl.y + 3.6, 53, 25, 0.32);
  group(ctx, [
    { build: (c) => ellipsePath(c, pl.x, pl.y + 2.4, 51.5, 23.5), style: { fill: '#d6cbb6', shadow: 'none' } },
    { build: (c) => ellipsePath(c, pl.x, pl.y, 52, 23.5), style: { fill: rgrad(ctx, pl.x - 20, pl.y - 14, 2, 70, [[0, '#ffffff'], [0.5, '#fbf8f1'], [1, '#e9e1d0']]), shadow: 'none' } },
  ], OUT);
  strokeP(ctx, (c) => ellipsePath(c, pl.x, pl.y, 49, 21.6), 1.4, '#2d6fb5');
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
    shape(ctx, b, { fill: '#fffaf0', ink: 0.95, inkColor: '#9a6a4a', shadow: '#e6dccb', shadowOffset: [-1.2, -1.0], gloss: [{ x: mx - rx * 0.35, y: my - ry * 0.35, rx: rx * 0.3, ry: ry * 0.22, rot: -0.3, alpha: 0.95 }] });
    clip(ctx, b, () => speckle(ctx, mx + rx * 0.2, my + ry * 0.2, rx * 0.6, ry * 0.6, 3, '#e8b46a', 0.9, Math.round(R() * 99), 0.55));
  }
  oilGlints(ctx, g, 6, 803);
  // basil: whole leaves laid on after the bake
  basilLeaf(ctx, g.sx - 6, g.sy - 3, 13.5, -0.6, { col: '#2f8f3a', sy: 0.8 });
  basilLeaf(ctx, g.sx + 10, g.sy + 2, 12.5, 0.5, { col: '#3a9a3c', sy: 0.8 });
  basilLeaf(ctx, g.sx - 1, g.sy + 11, 12, 2.9, { col: '#2f8a38', sy: 0.8 });
  basilLeaf(ctx, g.sx + 26, g.sy - 6, 10.5, -1.9, { col: '#36923a', sy: 0.8 });
}

function drawMarinara(ctx: Ctx) {
  // on the table behind: a head of garlic and a sprig of oregano
  garlicBulb(ctx, -45, -27, 6.5);
  shape(ctx, (c) => { c.moveTo(-34, -24); c.quadraticCurveTo(-31, -30, -28, -25); c.quadraticCurveTo(-31, -23.5, -34, -24); c.closePath(); }, { fill: '#f6efe2', ink: 1.2, shadow: '#d4c4aa', shadowOffset: [-0.6, -0.6] });
  oreganoSprig(ctx, 41, -27, 12, -0.15);
  // a wooden pizza board with a handle
  woodBoard(ctx, -5, 6, 50, 25, 901, { handle: 'R', r: 6 });
  const g = pizzaBase(ctx, -6, 4.5, 45, 23.5, 902, '#d6401f');
  // oregano: a generous green dusting, with some bigger crumbled leaves
  clip(ctx, g.sauce, () => {
    speckle(ctx, g.sx, g.sy, g.srx, g.sry, 140, '#4f6a1e', 0.5, 903, 0.95);
    speckle(ctx, g.sx, g.sy, g.srx, g.sry, 90, '#7a9a32', 0.5, 904, 0.95);
    const R = rng(907);
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * 0.92;
      const px = g.sx + Math.cos(a) * g.srx * d, py = g.sy + Math.sin(a) * g.sry * d;
      fillP(ctx, (c) => blobPath(c, px, py, 1.0 + R() * 0.5, 0.65, 0.35, 6, i + 900), R() < 0.5 ? '#6a8a2a' : '#87a83c');
    }
  });
  oilGlints(ctx, g, 8, 906);
  // six thin slices of garlic: translucent ivory-gold, toasted at the rim
  const R = rng(905);
  const spots: Pt[] = [[-22, -6], [3, -10], [22, -4], [-12, 7], [10, 6], [28, 9]];
  spots.forEach(([dx, dy]) => {
    rot(ctx, g.sx + dx + (R() - 0.5) * 2, g.sy + dy + (R() - 0.5) * 1.5, (R() - 0.5) * 1.2 + (R() < 0.5 ? Math.PI : 0), () => {
      const b: Build = (c) => smoothPath(c, [[-3.3, 1.2], [-3.4, -0.6], [-1.7, -2.0], [1.7, -2.0], [3.4, -0.6], [3.3, 1.2], [0, 1.6]], true, 0.4);
      shape(ctx, b, {
        fill: rgrad(ctx, -0.6, -0.4, 0.3, 4, [[0, '#f8ecc4'], [0.65, '#f1dca4'], [1, '#e2c27c']]),
        ink: 0.75, inkColor: '#8a5a24', shadow: 'none', gloss: [{ x: -1, y: -0.8, rx: 1.1, ry: 0.35, rot: -0.1, alpha: 0.85 }],
      });
      clip(ctx, b, () => {
        strokeP(ctx, b, 1.3, 'rgba(211,154,74,0.85)');
        // the faint inner ring of a sliced clove
        strokeP(ctx, (c) => ellipsePath(c, 0, -0.1, 1.7, 0.95), 0.35, 'rgba(200,160,90,0.6)');
      });
    }, 1, 0.75);
  });
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
  shape(ctx, body, { fill: rgba('#d9e8c8', 0.9), ink: 1.8, shadow: 'none' });
  clip(ctx, body, () => {
    fillP(ctx, (c) => c.rect(x - w, y - h * 0.62, w * 2, h), vgrad(ctx, y - h * 0.62, y, [[0, '#d6c43a'], [0.5, '#b6a422'], [1, '#8a7a14']]));
    fillP(ctx, (c) => ellipsePath(c, x - w * 0.2, y - h * 0.3, w * 0.18, h * 0.24), rgba('#f6ec8a', 0.6));
    fillP(ctx, (c) => c.rect(x + w * 0.22, y - h * 0.62, w * 0.3, h), rgba('#5a4a0a', 0.3));
  });
  line(ctx, [[x - w * 0.32, y - h * 0.08], [x - w * 0.32, y - h * 0.5]], 0.9, 'rgba(255,255,255,0.85)');
  shape(ctx, (c) => c.rect(x - w * 0.2, y - h * 1.0, w * 0.4, h * 0.1), { fill: '#c9955a', ink: 1.1, shadow: '#9a6a36', shadowOffset: [-0.6, -0.3] });
}

/** A piece of guanciale: peppered rind on top, the cut face striped fat and deep red lean; slices beside. */
function guanciale(ctx: Ctx, x: number, y: number, s: number) {
  // two slices fanned in front of the block
  for (let i = 0; i < 2; i++) {
    rot(ctx, x + s * 0.55 + i * s * 0.55, y + s * 0.62 + i * s * 0.06, -0.2 + i * 0.2, () => {
      const b: Build = (c) => smoothPath(c, [[-s * 0.55, -s * 0.24], [s * 0.1, -s * 0.34], [s * 0.6, -s * 0.2], [s * 0.6, s * 0.22], [0, s * 0.3], [-s * 0.55, s * 0.2]], true, 0.4);
      shape(ctx, b, { fill: '#fbf0e0', ink: 1.0, shadow: '#e8d4bc', shadowOffset: [-0.6, -0.6] });
      clip(ctx, b, () => {
        fillP(ctx, (c) => smoothPath(c, [[-s, s * 0.0], [0, s * 0.05], [s, -s * 0.04], [s, s * 0.08], [0, s * 0.13], [-s, s * 0.08]], true, 0.4), '#8e2228');
        fillP(ctx, (c) => c.rect(-s, s * 0.22, s * 2, s), '#4a2e1c');
        speckle(ctx, 0, s * 0.27, s * 0.6, s * 0.05, 8, '#1a100a', 0.3, i + 70, 0.9);
      });
      glint(ctx, -s * 0.1, -s * 0.2, s * 0.25, s * 0.06, -0.1, 0.75);
    });
  }
  // the block, in 3/4: top = peppered rind, front = cut face
  const w = s * 1.15, d = s * 0.42, hh = s * 0.62;
  const top: Build = (c) => roundPoly(c, [[x - w, y - d, 1.5], [x + w * 0.7, y - d - 0.6, 1.5], [x + w * 0.95, y, 1.5], [x - w * 0.8, y + 0.5, 1.5]]);
  const front: Build = (c) => roundPoly(c, [[x - w * 0.8, y + 0.5, 0.8], [x + w * 0.95, y, 0.8], [x + w * 0.92, y + hh, 1.5], [x - w * 0.78, y + hh + 0.4, 1.5]]);
  contact(ctx, x + 1.5, y + hh, w * 1.2, s * 0.3, 0.32);
  group(ctx, [
    { build: front, style: { fill: '#fbf0e0', shadow: 'none' } },
    { build: top, style: { fill: '#6a4428', shadow: 'none' } },
  ], 1.4);
  clip(ctx, top, () => {
    speckle(ctx, x, y - d * 0.5, w, d * 0.7, 40, '#1a100a', 0.5, 81, 0.95);
    speckle(ctx, x, y - d * 0.5, w, d * 0.7, 12, '#a87a4a', 0.4, 82, 0.8);
  });
  clip(ctx, front, () => {
    for (const [f, t, col] of [[0.0, 0.16, '#4a2e1c'], [0.5, 0.16, '#8e2228']] as [number, number, string][]) {
      fillP(ctx, (c) => polyPath(c, [[x - w, y + hh * f], [x + w, y + hh * f - 0.4], [x + w, y + hh * (f + t) - 0.4], [x - w, y + hh * (f + t)]]), col);
    }
    fillP(ctx, (c) => c.rect(x + w * 0.5, y - 2, w, hh + 4), 'rgba(120,70,40,0.18)');
  });
  glint(ctx, x - w * 0.5, y + hh * 0.5, s * 0.25, s * 0.06, -0.05, 0.7);
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
      { build: sector(L, 2.2), style: { fill: '#b8783a', shadow: 'none' } },
      { build: sector(L), style: { fill: '#eab468', shadow: 'none' } },
    ], 1.6);
    const sauce: Build = (c) => smoothPath(c, [[ax + L * 0.1, 0], ...arc(L * 0.82, A0 + 0.04, A1 - 0.04)], true, 0.1);
    fillP(ctx, sauce, '#d8361f');
    clip(ctx, sauce, () => speckle(ctx, ax + L * 0.5, 0, L * 0.4, L * 0.25, 12, '#a8261a', 0.8, 5, 0.6));
    for (const [mx, my, r] of [[L * 0.02, -L * 0.1, L * 0.13], [L * 0.2, L * 0.12, L * 0.12], [-L * 0.2, L * 0.02, L * 0.09]] as [number, number, number][]) {
      shape(ctx, (c) => blobPath(c, mx, my, r, r * 0.75, 0.2, 9, Math.round(mx * 10)), { fill: '#fffaf0', ink: 0.7, inkColor: '#9a6a4a', shadow: '#e6dccb', shadowOffset: [-0.5, -0.5], gloss: [{ x: mx - r * 0.3, y: my - r * 0.3, rx: r * 0.3, ry: r * 0.2, alpha: 0.9 }] });
    }
    basilLeaf(ctx, L * 0.12, -L * 0.01, L * 0.32, 0.6, { col: '#2f8f3a', ink: 0.8 });
    const rim: Build = (c) => smoothPath(c, [...arc(L), ...arc(L * 0.8).reverse()], true, 0.1);
    shape(ctx, rim, { fill: '#efc07a', ink: 0.9, shadow: '#c98a45', shadowOffset: [-L * 0.03, -L * 0.04] });
    clip(ctx, rim, () => {
      speckle(ctx, ax + L * 0.9, 0, L * 0.1, L * 0.38, 12, '#3a2214', 0.45, 7, 0.85);
      speckle(ctx, ax + L * 0.9, 0, L * 0.1, L * 0.38, 5, '#7a4520', 0.7, 8, 0.7);
    });
  }, 1, 0.62);
}

/** A sprig of basil: a few leaves on a stem. */
function basilSprig(ctx: Ctx, x: number, y: number, s: number, a: number) {
  rot(ctx, x, y, a, () => {
    line(ctx, [[-s * 0.9, s * 0.15], [-s * 0.2, 0], [s * 0.4, -s * 0.05]], 2.0, INK, true);
    line(ctx, [[-s * 0.9, s * 0.15], [-s * 0.2, 0], [s * 0.4, -s * 0.05]], 0.9, '#4f8f2e', true);
    basilLeaf(ctx, -s * 0.35, -s * 0.28, s * 0.62, -0.9, { col: '#34883a' });
    basilLeaf(ctx, -s * 0.2, s * 0.28, s * 0.58, 0.8, { col: '#3e9a3a' });
    basilLeaf(ctx, s * 0.5, -s * 0.15, s * 0.72, -0.2, { col: '#47a643' });
    basilLeaf(ctx, s * 0.25, s * 0.25, s * 0.5, 0.45, { col: '#3a9038' });
  });
}

function drawFoodcourt(ctx: Ctx) {
  // the board sits on a checked tablecloth, peeking out behind it
  napkin(ctx, [24, -24], [56, -27], [56, -2], [28, 0], '#d23a32', 5);
  napkin(ctx, [-56, 14], [-44, 12], [-42, 36], [-56, 36], '#d23a32', 3);
  // Nonna's board in 3/4: the far edge narrower, a handle on the right
  woodBoard(ctx, -3, 9, 49, 21, 1101, { taper: 6, handle: 'R', th: 4, r: 8 });

  // back row: olive oil, tomatoes on the vine, the plate of spaghetti al pomodoro, clams
  oilBottle(ctx, -42, 2, 38);
  vineTomatoes(ctx, -22, -6, [[-6.5, 0, 5.2], [2, -1.6, 5.4], [-2, 6.2, 4.8]], 1);
  const pw = plate(ctx, 7, -2, 20, 9.2, { band: '#c0392b', th: 1.8, ink: 1.8, well: 0.64 });
  const st: PastaStyle = { kind: 'round', w: 1.4, col: '#f45e32', gap: '#a51f0e', hi: '#ffd0b4' };
  const n = nest(ctx, pw.x, pw.y + 0.8, 12, 8.5, st, 1102, { loops: [0.1] });
  sauceDollop(ctx, n.x, n.y - n.h * 0.95, 5, 2.4, '#e5321b', 1103, 3);
  basilLeaf(ctx, n.x + 1.6, n.y - n.h * 1.2, 6.5, -0.4, { col: '#3e9a3a', ink: 0.8 });
  // Naples' clams in a blue bowl
  const cx = 35, cy = -3;
  contact(ctx, cx + 1.5, cy + 6, 12, 4, 0.32);
  group(ctx, [
    { build: (c) => { c.moveTo(cx - 11, cy); c.quadraticCurveTo(cx - 10, cy + 8, cx, cy + 8.4); c.quadraticCurveTo(cx + 10, cy + 8, cx + 11, cy); c.closePath(); }, style: { fill: '#2d6fb5', shadow: 'none' } },
    { build: (c) => ellipsePath(c, cx, cy, 11, 4.4), style: { fill: '#f4efe4', shadow: 'none' } },
  ], 1.6);
  line(ctx, [[cx - 9.5, cy + 3.8], [cx - 3.5, cy + 6.3], [cx + 3.5, cy + 6.3], [cx + 9.5, cy + 3.8]], 0.9, '#f4efe4', true, 0.85);
  fillP(ctx, (c) => ellipsePath(c, cx, cy + 0.3, 9.2, 3.4), '#dcd2c0');
  clamClosed(ctx, cx + 4, cy - 2, 4, 0.3, 1106);
  clamOpen(ctx, cx - 4.5, cy + 0.2, 4, -0.2, 1104);
  clamClosed(ctx, cx + 5.5, cy + 1.5, 3.8, -0.2, 1105);
  // front row: Emilia's Parmigiano, Genoa's basil, Rome's guanciale, a slice of Margherita
  parmigiano(ctx, -33, 18, 10.5, false);
  basilSprig(ctx, -11, 9, 9.5, -0.15);
  guanciale(ctx, -7, 19, 8.5);
  pizzaSlice(ctx, 28, 19, 27, -0.15);
  cherryTomato(ctx, 43, 25, 3.8, 5);
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
  defineSprite({ id: 'dish.' + id, w: 120, h: 80, ax: 60, ay: 40, frames: 1, res: 4, draw: (ctx) => draw(ctx) });
}
