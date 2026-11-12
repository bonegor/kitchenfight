/**
 * IL MENÙ — the 27 REAL INGREDIENTS (art agent: fill this file; it is imported before
 * placeholders.ts, so every id defined here replaces its placeholder automatically).
 *
 * Contract for every id below: defineSprite({ id, w: 24, h: 24, ax: 12, ay: 12, frames: 1, res: 3, draw }).
 * World units; anchor = centre. The renderer draws a gold-rimmed round badge (r 17) BEHIND the sprite
 * and scales it 1.1× in the world: do NOT paint a badge or a background disc. It must read at 1× in
 * the world AND as a 22 px HUD icon (one clear silhouette, saturated colour, ink outline 1.4–1.8).
 * See src/game/recipes.ts INGREDIENTS for names and colours.
 *
 *   ingr.spaghetti    a bundle of dry spaghetti (tied with string)
 *   ingr.fettuccine   a nest of fresh egg fettuccine
 *   ingr.tonnarelli   a nest of square-cut tonnarelli (darker yellow, thicker)
 *   ingr.tagliatelle  a nest of fresh egg tagliatelle (wide ribbons)
 *   ingr.pomodoro     a San Marzano plum tomato
 *   ingr.passata      a glass bottle of tomato passata
 *   ingr.olio         a bottle/cruet of extra-virgin olive oil (green-gold)
 *   ingr.aglio        a garlic bulb
 *   ingr.basilico     a sprig of basil (3-4 leaves)
 *   ingr.guanciale    a slab of guanciale (pink-white cured cheek, peppered rind)
 *   ingr.tuorli       two egg yolks in a half shell
 *   ingr.pecorino     a wedge of Pecorino Romano (black rind)
 *   ingr.parmigiano   a wedge of Parmigiano Reggiano (dotted rind)
 *   ingr.pepe         black peppercorns / a pepper mill
 *   ingr.burro        a block of butter on paper
 *   ingr.acqua        a ladle of cloudy starchy pasta water
 *   ingr.vino         a bottle of dry wine (straw-coloured)
 *   ingr.peperoncino  a red chili
 *   ingr.manzo        coarse-ground beef
 *   ingr.pancetta     a slice of fresh pancetta (pink and white layers)
 *   ingr.soffritto    diced onion, carrot and celery
 *   ingr.pinoli       pine nuts
 *   ingr.vongole      two clams (vongole veraci)
 *   ingr.prezzemolo   a sprig of flat-leaf parsley
 *   ingr.impasto      a ball of pizza dough
 *   ingr.mozzarella   a ball of mozzarella / fior di latte (with a leaf)
 *   ingr.origano      a bunch of dried oregano
 *
 * Art notes: these are the GOOD GUYS' pantry, so no faces. Each one is a single bold silhouette
 * with its own colour, inked at 1.5 (details 0.6–1.0), cel-shaded from the upper-left and glossy
 * where the real thing shines. Every painter is auto-fitted (centred, shrunk to FIT) and drawn
 * with a faint cream edge and a soft drop, so it sits inside the badge and also reads on the dark
 * HUD. The details that make each one the specific Italian product:
 *   - pasta: dry spaghetti tied with baker's string; fresh egg pasta as 3/4-view nests (one big
 *     floured fettuccine nest, two wider-ribboned tagliatelle nests, a tighter skein of thin
 *     square-cut tonnarelli dusted with semolina)
 *   - San Marzano: long plum shape with a pointed tip and shallow ribs; passata in a glass bottle
 *     with a plain tomato label; EVO oil in a cruet with a steel pourer and an olive sprig
 *   - garlic with red (Sulmona-style) streaks and a loose clove; cupped glossy Genoese basil;
 *     serrated flat-leaf parsley; a tied bunch of DRIED oregano with its papery flower heads
 *   - guanciale: a triangular cheek, black-pepper rind, mostly white fat, a string through the
 *     hole it hung from; pancetta: rolled slices with the spiral of fat (never a bacon rasher)
 *   - Pecorino Romano: white paste, black rind with the basket-weave print; Parmigiano
 *     Reggiano: grainy gold paste with crystals and the pin-dot rind
 *   - deep-orange yolks in a half shell; a wooden pepper mill with peppercorns; butter on its
 *     parchment with a curl; a steel ladle of cloudy pasta water (a spaghetto over the rim)
 *   - dry white wine (straw colour, white grapes); coarse mince on butcher paper; diced onion,
 *     carrot and celery; pine nuts with their cone; vongole veraci with their two siphons;
 *     two proofed panetti on flour; fior di latte cut open in its whey, with a basil leaf
 */
import { defineSprite } from '../sprites';
import {
  Ctx, Pt, INK, ellipsePath, circlePath, roundRectPath, polyPath, smoothPath, blobPath, line, speckle, glint, rng, shade, light,
} from '../painter';
import { S, G, composite, fitted, radial, linear, tube, lit } from './items_kit';

/** Silhouette ink (small sprites: 1.4–1.8). */
const K = 1.5;

/** Largest extent of the painted art (ink included): ±10.8 leaves room for the cream edge and the drop. */
const FIT = 21.6;

function ingr(id: string, paint: (ctx: Ctx) => void) {
  defineSprite({
    id: 'ingr.' + id,
    w: 24,
    h: 24,
    ax: 12,
    ay: 12,
    frames: 1,
    res: 3,
    // centred on its own bounds and shrunk (never enlarged) to fit the box
    draw: (ctx) => composite(ctx, fitted(paint, FIT, 0.7, 1), { edge: '#fffbea', edgeW: 0.7, edgeA: 0.6, drop: true, dropA: 0.22, dropOff: [0.6, 1.0], dropBlur: 0.6 }),
  });
}

function rot(ctx: Ctx, x: number, y: number, a: number, fn: () => void, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  if (s !== 1) ctx.scale(s, s);
  fn();
  ctx.restore();
}

/** Clip to a shape while `fn` paints inside it. */
function inside(ctx: Ctx, build: (c: Ctx) => void, fn: () => void) {
  ctx.save();
  ctx.beginPath();
  build(ctx);
  ctx.clip();
  fn();
  ctx.restore();
}

/** Cel-shadow crescent over an already painted shape (for gradient/texture fills). */
function crescent(ctx: Ctx, build: (c: Ctx) => void, color: string, alpha: number, off: Pt = [-2, -2.2]) {
  const [ox, oy] = lit(ctx, off[0], off[1]);
  inside(ctx, build, () => {
    ctx.beginPath();
    build(ctx);
    ctx.translate(ox, oy);
    build(ctx);
    ctx.translate(-ox, -oy);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill('evenodd');
  });
}

/** Catmull-Rom sampling of an open polyline. */
function sample(pts: Pt[], n: number): Pt[] {
  const out: Pt[] = [];
  const segs = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * segs;
    const s = Math.min(segs - 1, Math.floor(u));
    const t = u - s;
    const p0 = pts[Math.max(0, s - 1)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(pts.length - 1, s + 2)];
    const t2 = t * t, t3 = t2 * t;
    const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}

/** Closed outline around a centreline with a varying width w(t), t = 0..1 (chili, stems). */
function taperPath(c: Ctx, pts: Pt[], w: (t: number) => number, n = 28) {
  const P = sample(pts, n);
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const d = Math.hypot(nx, ny) || 1;
    nx /= d; ny /= d;
    const hw = w(i / (P.length - 1)) / 2;
    L.push([P[i][0] + nx * hw, P[i][1] + ny * hw]);
    R.push([P[i][0] - nx * hw, P[i][1] - ny * hw]);
  }
  polyPath(c, [...L, ...R.reverse()]);
}

/** Leaf outline in a local frame: base at (0,0), tip at (len,0). */
function leafPath(c: Ctx, len: number, wid: number, belly = 0.35) {
  c.moveTo(0, 0);
  c.bezierCurveTo(len * belly, -wid * 0.62, len * 0.78, -wid * 0.5, len, 0);
  c.bezierCurveTo(len * 0.78, wid * 0.5, len * belly, wid * 0.62, 0, 0);
  c.closePath();
}

/** A glossy, cupped Genoese basil leaf at (x,y) pointing at angle a. */
function basilLeaf(ctx: Ctx, x: number, y: number, a: number, len: number, wid: number, ink = 1.2) {
  rot(ctx, x, y, a, () => {
    const b = (c: Ctx) => leafPath(c, len, wid, 0.4);
    S(ctx, b, {
      fill: '#46b04a',
      ink,
      shadow: '#23803a',
      shadowOffset: [-wid * 0.22, -wid * 0.26],
      gloss: [{ x: len * 0.42, y: -wid * 0.16, rx: len * 0.22, ry: wid * 0.09, alpha: 0.55, color: '#d9ffb0' }],
    });
    // midrib + side veins
    line(ctx, [[len * 0.06, 0], [len * 0.5, -wid * 0.03], [len * 0.9, 0]], Math.max(0.35, wid * 0.08), '#a6e584', true, 0.9);
    for (let i = 1; i <= 2; i++) {
      const t = 0.22 + i * 0.2;
      line(ctx, [[len * t, 0], [len * (t + 0.12), -wid * 0.26]], 0.3, '#a6e584', false, 0.6);
      line(ctx, [[len * t, 0], [len * (t + 0.12), wid * 0.26]], 0.3, '#2f8a3a', false, 0.6);
    }
  });
}

// ===========================================================================
// PASTA
// ===========================================================================

ingr('spaghetti', (ctx) => {
  const R = rng(11);
  rot(ctx, 0, 0.2, -0.74, () => {
    const L = 10.6;
    const n = 9;
    const prof = (y: number, x: number) => y * (0.42 + 0.58 * Math.min(1, Math.abs(x) / L));
    const rods = Array.from({ length: n }, (_, i) => ({ y: (i - (n - 1) / 2) * 0.74, l0: L - R() * 1.6, l1: L - R() * 1.6 }));
    const pts = (r: { y: number; l0: number; l1: number }): Pt[] => [
      [-r.l0, prof(r.y, r.l0)], [-L * 0.55, prof(r.y, L * 0.55)], [0, prof(r.y, 0)], [L * 0.55, prof(r.y, L * 0.55)], [r.l1, prof(r.y, r.l1)],
    ];
    // one silhouette for the whole bundle
    for (const r of rods) line(ctx, pts(r), 1.1 + K * 2, INK, true);
    // rods, back (top) to front (bottom): each with a darker edge so they read as separate strands
    rods.forEach((r, i) => {
      const lit = 1 - i / (n - 1);
      line(ctx, pts(r), 1.1, '#c9952f', true);
      line(ctx, pts(r), 0.62, i % 2 ? '#f0cf72' : '#f7dd8c', true);
      if (lit > 0.6) line(ctx, pts(r).slice(0, 4), 0.28, '#fff6cf', true, 0.8);
    });
    // twine: two wraps + a little bow (red baker's string)
    const h = 2.0;
    for (const x of [-0.75, 0.75]) inkLine2(ctx, [[x - 0.2, -h], [x + 0.25, 0], [x - 0.1, h]], 0.95, '#d8322c', 0.6);
    rot(ctx, 0, -h - 0.3, 0, () => {
      S(ctx, (c) => { ellipsePath(c, -1.5, -0.9, 1.6, 0.95, 0.5); ellipsePath(c, 1.5, -0.9, 1.6, 0.95, -0.5); }, { fill: '#e23a30', ink: 0.6, shadow: '#a81e22', shadowOffset: [-0.4, -0.4] });
      S(ctx, (c) => circlePath(c, 0, -0.3, 0.75), { fill: '#e23a30', ink: 0.6, shadow: 'none' });
    });
  });
});

/** Inked line with a custom ink width (thin strings, steam). */
function inkLine2(ctx: Ctx, pts: Pt[], width: number, color: string, ink: number, inkColor = INK, smooth = true) {
  line(ctx, pts, width + ink * 2, inkColor, smooth);
  line(ctx, pts, width, color, smooth);
}

interface NestOpts {
  /** ribbon colours: lit, shaded, highlight, the dark gaps between ribbons, and each ribbon's edge */
  col: string; colD: string; colL: string; gap: string; edge: string;
  /** ribbon width, coils on the top, bands round the side */
  w: number; coils: number; bands: number; seed: number;
  /** top-ellipse radii and the height of the nest's side */
  rx?: number; ry?: number; h?: number;
  /** how much the coils tilt against each other */
  tangle?: number;
  /** square-cut strands (tonnarelli): a flat lit face on every strand */
  square?: boolean;
  dust?: string; dustN?: number; dustR?: number;
  /** loose ribbon ends (drawn in front of the nest) */
  ends?: Pt[][];
  /** silhouette ink (raise it when the nest is drawn scaled down) */
  ink?: number;
}

/** Shade a painted area (only where pixels already are) with a lower-right crescent. */
function atopShade(ctx: Ctx, build: (c: Ctx) => void, color: string, alpha: number, off: Pt) {
  const [ox, oy] = lit(ctx, off[0], off[1]);
  inside(ctx, build, () => {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.beginPath();
    build(ctx);
    ctx.translate(ox, oy);
    build(ctx);
    ctx.translate(-ox, -oy);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill('evenodd');
  });
}

/** Stroke a polyline (helper for ribbons). */
function strokePts(ctx: Ctx, pts: Pt[], w: number, col: string, cap: CanvasLineCap = 'butt', alpha = 1) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  polyPath(ctx, pts, false);
  ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.lineWidth = w;
  ctx.strokeStyle = col;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.restore();
}

/** Extend a polyline by d at both ends (so a butt-capped ink line wraps the cut ends). */
function extend(pts: Pt[], d: number): Pt[] {
  if (pts.length < 2) return pts;
  const a = pts[0], b = pts[1], y = pts[pts.length - 2], z = pts[pts.length - 1];
  const la = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, lz = Math.hypot(z[0] - y[0], z[1] - y[1]) || 1;
  return [[a[0] + ((a[0] - b[0]) / la) * d, a[1] + ((a[1] - b[1]) / la) * d], ...pts, [z[0] + ((z[0] - y[0]) / lz) * d, z[1] + ((z[1] - y[1]) / lz) * d]];
}

/**
 * A nest (nido) of fresh egg pasta in 3/4 view: a soft cushion whose top is wound with coils of
 * ribbon around a dimple, with bands of ribbon running round its side and a few loose ends.
 * Every ribbon is cel-shaded along its length (lit from the upper-left) and edged in dark gold.
 */
function nest(ctx: Ctx, o: NestOpts) {
  const R = rng(o.seed);
  const rx = o.rx ?? 9.0, ry = o.ry ?? 5.6, h = o.h ?? 4.2;
  const ty = -h / 2 - 0.2; // centre of the top ellipse
  const by = ty + h; // centre of the bottom ellipse
  const ink = o.ink ?? K;
  const ripple = (t: number) => 1 + Math.sin(t * 9 + o.seed) * 0.025;
  const body = (c: Ctx) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = Math.PI + (i / 24) * Math.PI;
      pts.push([Math.cos(t) * rx * ripple(t), ty + Math.sin(t) * ry * ripple(t)]);
    }
    for (let i = 0; i <= 24; i++) {
      const t = (i / 24) * Math.PI;
      pts.push([Math.cos(t) * rx * 0.97 * ripple(t + 1), by + Math.sin(t) * ry * ripple(t + 1)]);
    }
    smoothPath(c, pts, true, 0.4);
  };
  const ribbon = (pts: Pt[], lit: number[], w: number) => {
    strokePts(ctx, pts, w + 1.0, o.edge);
    strokePts(ctx, pts, w, o.col);
    let run: Pt[] = [];
    const flush = (col: string, ww: number, off: Pt = [0, 0], alpha = 1) => {
      if (run.length > 1) strokePts(ctx, run.map(([x, y]) => [x + off[0], y + off[1]] as Pt), ww, col, 'butt', alpha);
      run = [];
    };
    pts.forEach((p, i) => { if (lit[i] < -0.15) run.push(p); else flush(o.colD, w); });
    flush(o.colD, w);
    pts.forEach((p, i) => { if (lit[i] > 0.2) run.push(p); else flush(o.colL, w * (o.square ? 0.4 : 0.32), [-w * 0.18, -w * 0.24], 0.95); });
    flush(o.colL, w * (o.square ? 0.4 : 0.32), [-w * 0.18, -w * 0.24], 0.95);
  };

  // 1. silhouette and the dark between the ribbons
  S(ctx, body, { fill: o.gap, ink, shadow: 'none' });

  // 2. bands round the side (front half only), bottom band first
  inside(ctx, body, () => {
    for (let j = o.bands - 1; j >= 0; j--) {
      const yy = by - (j / Math.max(1, o.bands - 1)) * (h - 0.6) + 0.2;
      const kk = 0.97 + (R() - 0.5) * 0.04;
      const a0 = 0.02 + R() * 0.1, a1 = Math.PI - 0.02 - R() * 0.1;
      const pts: Pt[] = [], lit: number[] = [];
      for (let i = 0; i <= 26; i++) {
        const t = a0 + ((a1 - a0) * i) / 26;
        pts.push([Math.cos(t) * rx * kk, yy + Math.sin(t) * ry * kk + Math.sin(t * 7 + j) * 0.25]);
        lit.push(Math.cos(t) < -0.35 ? 0.3 : Math.cos(t) > 0.25 ? -0.5 : 0);
      }
      ribbon(pts, lit, o.w * 0.92);
    }
  });

  // 3. the top: coils round a dimple, far halves first
  const top = (c: Ctx) => ellipsePath(c, 0, ty, rx * 1.02, ry * 1.04);
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, 0.2, ty + 0.2, rx * 0.2, ry * 0.2);
  ctx.fillStyle = shade(o.gap, 0.3);
  ctx.fill();
  ctx.restore();
  type Piece = { pts: Pt[]; lit: number[]; key: number };
  const pieces: Piece[] = [];
  for (let i = 0; i < o.coils; i++) {
    const k = 0.3 + 0.72 * (i / Math.max(1, o.coils - 1));
    const rr = (o.tangle ?? 0.15) * (R() - 0.5) * 2;
    const cx = (R() - 0.5) * 1.2, cy = (R() - 0.5) * 0.6;
    const a0 = R() * Math.PI * 2, span = Math.PI * 2 * (0.8 + R() * 0.35);
    let cur: Piece | null = null;
    let side = 0;
    const n = 40;
    for (let j = 0; j <= n; j++) {
      const t = a0 + (span * j) / n;
      const wob = 1 + Math.sin(t * 5 + i) * 0.035;
      const x = Math.cos(t) * rx * k * wob, y = Math.sin(t) * ry * k * wob;
      const p: Pt = [cx + x * Math.cos(rr) - y * Math.sin(rr), ty + cy + x * Math.sin(rr) + y * Math.cos(rr)];
      const lt = Math.cos(t) * -0.62 + Math.sin(t) * -0.78;
      const sd = Math.sin(t) < 0 ? -1 : 1;
      if (!cur || sd !== side) {
        const prev: Piece | null = cur;
        cur = { pts: [], lit: [], key: sd < 0 ? -1 - k : 1 + k };
        if (prev) { cur.pts.push(prev.pts[prev.pts.length - 1]); cur.lit.push(prev.lit[prev.lit.length - 1]); }
        pieces.push(cur);
        side = sd;
      }
      cur.pts.push(p);
      cur.lit.push(lt);
    }
  }
  pieces.sort((p, q) => p.key - q.key);
  inside(ctx, top, () => { for (const p of pieces) ribbon(p.pts, p.lit, o.w); });

  // 4. volume: the whole nest darkens toward the lower right
  atopShade(ctx, body, shade(o.colD, 0.35), 0.3, [-2.6, -2.4]);

  // 5. loose ends in front
  for (const e of o.ends ?? []) {
    const pts = sample(e, 18);
    const lt = pts.map((_, i) => (i < pts.length * 0.5 ? 0.35 : -0.3));
    strokePts(ctx, extend(pts, ink), o.w + ink * 2, INK);
    ribbon(pts, lt, o.w);
  }

  // 6. flour or semolina
  if (o.dust) {
    inside(ctx, body, () => speckle(ctx, -1.2, ty, rx * 0.85, ry * 0.85, o.dustN ?? 22, o.dust!, o.dustR ?? 0.3, o.seed + 3, 0.9));
  }
  glint(ctx, -rx * 0.5, ty - ry * 0.45, 1.8, 0.7, -0.35, 0.55);
}

ingr('fettuccine', (ctx) => {
  nest(ctx, {
    col: '#f8d878', colD: '#e2a944', colL: '#fff6cc', gap: '#6a3e0e', edge: '#8a5414',
    w: 1.9, coils: 6, bands: 3, seed: 21, tangle: 0.22, dust: '#fffdf4', dustN: 30, dustR: 0.22,
  });
});

ingr('tagliatelle', (ctx) => {
  // two nests, the way they are sold in Bologna
  const T = { col: '#fbcb4e', colD: '#e0952a', colL: '#ffeca6', gap: '#62360a', edge: '#844610', w: 2.5, coils: 4, bands: 3, tangle: 0.25, dust: '#fff8e8', dustN: 12 };
  rot(ctx, 4.2, -3.6, 0, () => nest(ctx, { ...T, seed: 41, ink: K / 0.62 }), 0.62);
  rot(ctx, -1.4, 2.0, 0, () => nest(ctx, { ...T, seed: 37, ink: K / 0.82 }), 0.82);
});

ingr('tonnarelli', (ctx) => {
  nest(ctx, {
    col: '#edbd4a', colD: '#c2862a', colL: '#ffe697', gap: '#4e300a', edge: '#6e4410',
    w: 1.3, coils: 9, bands: 5, seed: 53, tangle: 0.5, square: true, dust: '#fff0c2', dustN: 44,
  });
});

// ===========================================================================
// TOMATO, OIL, GARLIC, HERBS
// ===========================================================================

ingr('pomodoro', (ctx) => {
  rot(ctx, 0.6, 0.8, -0.5, () => {
    const body = (c: Ctx) => {
      c.moveTo(0, -8.2);
      c.bezierCurveTo(4.5, -8.6, 6.0, -4.8, 5.9, -0.4);
      c.bezierCurveTo(5.8, 4.4, 3.2, 8.4, 0.3, 10.2);
      c.bezierCurveTo(-2.8, 8.4, -5.9, 4.4, -5.9, -0.4);
      c.bezierCurveTo(-6.0, -4.8, -4.5, -8.6, 0, -8.2);
      c.closePath();
    };
    S(ctx, body, {
      fill: '#ea3a2c',
      ink: K,
      shadow: '#b11f24',
      shadowOffset: [-2.0, -2.2],
      gloss: [
        { x: -2.9, y: -3.4, rx: 1.15, ry: 3.1, rot: 0.12, alpha: 0.85 },
        { x: -1.7, y: 3.6, rx: 0.55, ry: 1.0, rot: 0.2, alpha: 0.55 },
      ],
    });
    // the San Marzano's long shallow ribs
    inside(ctx, body, () => {
      line(ctx, [[1.6, -7.6], [3.2, -1.6], [2.4, 5.0], [0.6, 9.4]], 0.6, '#a91a22', true, 0.5);
      line(ctx, [[-1.2, -7.8], [-2.0, -2.6], [-1.4, 4.4], [0.1, 9.6]], 0.5, '#ff9b80', true, 0.45);
    });
    // calyx: five curling sepals + a short stem
    const sep: [number, number][] = [[Math.PI * 0.86, 3.9], [Math.PI * 1.14, 3.2], [Math.PI * 1.5, 2.2], [Math.PI * 1.86, 3.2], [Math.PI * 0.14, 3.9]];
    S(ctx, (c) => {
      for (const [a, l] of sep) {
        const x0 = 0, y0 = -8.0;
        const ex = x0 + Math.cos(a) * l, ey = y0 + Math.sin(a) * l * 0.75 + (Math.cos(a) !== 0 ? 0.7 : 0);
        const nx = -Math.sin(a) * 0.75, ny = Math.cos(a) * 0.75;
        c.moveTo(x0 + nx, y0 + ny);
        c.quadraticCurveTo((x0 + ex) / 2 + nx * 1.1, (y0 + ey) / 2 + ny * 1.1 - 0.5, ex, ey);
        c.quadraticCurveTo((x0 + ex) / 2 - nx * 1.1, (y0 + ey) / 2 - ny * 1.1 - 0.5, x0 - nx, y0 - ny);
        c.closePath();
      }
      circlePath(c, 0, -8.1, 1.3);
    }, { fill: '#46a83c', ink: 1.0, shadow: '#26773a', shadowOffset: [-0.5, -0.6] });
    tube(ctx, [[0, -8.6], [0.4, -10.2], [1.4, -11.0]], 1.0, '#3d9636', 0.8, true, '#9be07a', 0.7);
  });
});

ingr('passata', (ctx) => {
  rot(ctx, 0, 0.2, -0.12, () => {
    const body = (c: Ctx) => {
      c.moveTo(-2.5, -7.0);
      c.lineTo(-2.5, -5.6);
      c.bezierCurveTo(-2.5, -3.8, -6.2, -3.6, -6.2, -0.2);
      c.lineTo(-6.2, 8.0);
      c.quadraticCurveTo(-6.2, 10.0, -4.2, 10.0);
      c.lineTo(4.2, 10.0);
      c.quadraticCurveTo(6.2, 10.0, 6.2, 8.0);
      c.lineTo(6.2, -0.2);
      c.bezierCurveTo(6.2, -3.6, 2.5, -3.8, 2.5, -5.6);
      c.lineTo(2.5, -7.0);
      c.closePath();
    };
    S(ctx, body, {
      fill: linear(ctx, -6, 0, 6, 0, [[0, '#f0503c'], [0.45, '#d42a22'], [1, '#9e1a1e']]),
      ink: K,
      shadow: 'none',
    });
    crescent(ctx, body, '#6e0f16', 0.35, [-2, -1.6]);
    // glass reflections
    inside(ctx, body, () => {
      line(ctx, [[-4.6, 0.2], [-4.8, 4], [-4.4, 8.4]], 1.0, '#ffffff', true, 0.6);
      line(ctx, [[-1.6, -5.2], [-1.6, -3.8]], 0.7, '#ffffff', false, 0.65);
      line(ctx, [[4.8, 1.0], [4.9, 7.8]], 0.45, '#ffb3a0', false, 0.6);
    });
    // label: a little tomato on cream (no text)
    const label = (c: Ctx) => {
      c.moveTo(-6.2, 1.2);
      c.quadraticCurveTo(0, 2.0, 6.2, 1.2);
      c.lineTo(6.2, 6.6);
      c.quadraticCurveTo(0, 7.4, -6.2, 6.6);
      c.closePath();
    };
    inside(ctx, body, () => S(ctx, label, { fill: '#fbf0d6', ink: 0.7, shadow: '#e2cfa6', shadowOffset: [-1.4, -0.6] }));
    line(ctx, [[-6.0, 2.4], [0, 3.1], [6.0, 2.4]], 0.6, '#3d9636', true, 0.9);
    S(ctx, (c) => circlePath(c, 0.2, 4.6, 1.75), { fill: '#e8382c', ink: 0.55, shadow: '#b11f24', shadowOffset: [-0.5, -0.5], gloss: [{ x: -0.4, y: 4.0, rx: 0.5, ry: 0.35, alpha: 0.9 }] });
    S(ctx, (c) => { ellipsePath(c, -0.6, 2.9, 0.8, 0.35, -0.5); ellipsePath(c, 0.9, 2.9, 0.8, 0.35, 0.5); }, { fill: '#46a83c', ink: 0.4, shadow: 'none' });
    // twist-off cap
    const cap = (c: Ctx) => roundRectPath(c, -3.3, -10.4, 6.6, 3.7, 0.9);
    S(ctx, cap, { fill: linear(ctx, -3.3, 0, 3.3, 0, [[0, '#fff1a6'], [0.35, '#f2c23e'], [1, '#b97a14']]), ink: K, shadow: 'none' });
    for (let i = -2; i <= 2; i++) line(ctx, [[i * 1.25, -9.9], [i * 1.25, -7.2]], 0.35, '#8a5a0c', false, 0.55);
  });
});

ingr('olio', (ctx) => {
  const flask = (c: Ctx) => {
    c.moveTo(-1.8, -6.4);
    c.lineTo(-1.8, -4.6);
    c.bezierCurveTo(-2.0, -3.0, -7.6, -2.0, -7.6, 3.0);
    c.bezierCurveTo(-7.6, 7.6, -4.4, 9.8, -0.6, 9.8);
    c.bezierCurveTo(3.2, 9.8, 6.4, 7.6, 6.4, 3.0);
    c.bezierCurveTo(6.4, -2.0, 0.8, -3.0, 0.6, -4.6);
    c.lineTo(0.6, -6.4);
    c.closePath();
  };
  // steel pourer: collar + spout (behind the flask outline so it reads as one object)
  tube(ctx, [[-0.6, -7.4], [0.8, -9.4], [3.2, -10.2], [5.6, -10.0]], 1.1, '#cfd6e0', 1.0, true, '#ffffff', 0.9);
  S(ctx, flask, { fill: '#eef4dc', ink: K, shadow: 'none' });
  // the oil: green-gold, filled to the shoulder
  inside(ctx, flask, () => {
    ctx.fillStyle = radial(ctx, -2.6, 1.6, 9.5, [[0, '#f4e46a'], [0.45, '#cdb733'], [1, '#7c8a1e']], -3.4, 0.6);
    ctx.fillRect(-9, -1.2, 18, 12);
    ctx.beginPath();
    ellipsePath(ctx, -0.6, -1.2, 6.0, 0.8);
    ctx.fillStyle = '#f7ec96';
    ctx.fill();
  });
  crescent(ctx, flask, '#4f5a10', 0.35, [-2.0, -2.0]);
  inside(ctx, flask, () => {
    line(ctx, [[-5.6, 0.8], [-6.0, 3.8], [-4.6, 7.2]], 1.1, '#ffffff', true, 0.75);
    glint(ctx, -1.0, -3.4, 0.7, 0.45, -0.4, 0.8);
  });
  // collar
  S(ctx, (c) => roundRectPath(c, -2.5, -8.0, 3.8, 1.9, 0.6), { fill: '#dfe5ee', ink: 1.0, shadow: '#99a6b9', shadowOffset: [-0.6, -0.6] });
  // a golden drop at the spout
  S(ctx, (c) => { c.moveTo(5.9, -9.4); c.quadraticCurveTo(7.0, -7.8, 6.2, -7.2); c.quadraticCurveTo(5.2, -7.6, 5.9, -9.4); c.closePath(); }, { fill: '#e3cf4a', ink: 0.6, shadow: 'none', gloss: [{ x: 5.9, y: -7.9, rx: 0.3, ry: 0.3, alpha: 0.9 }] });
  // olive sprig in front: two olives and a silvery leaf
  rot(ctx, 6.4, 7.2, -2.5, () => {
    S(ctx, (c) => leafPath(c, 6.0, 1.9, 0.45), { fill: '#7e9b52', ink: 0.9, shadow: '#55703a', shadowOffset: [-0.5, -0.5] });
    line(ctx, [[0.4, 0], [5.2, 0]], 0.3, '#d5e3b8', false, 0.9);
  });
  S(ctx, (c) => ellipsePath(c, 4.6, 8.0, 2.2, 1.65, -0.4), { fill: '#8fb33d', ink: 1.0, shadow: '#5f8c25', shadowOffset: [-0.7, -0.7], gloss: [{ x: 3.9, y: 7.4, rx: 0.65, ry: 0.4, rot: -0.4, alpha: 0.9 }] });
  S(ctx, (c) => ellipsePath(c, 7.6, 6.6, 2.0, 1.55, -0.6), { fill: '#4a2a42', ink: 1.0, shadow: '#2a1428', shadowOffset: [-0.7, -0.7], gloss: [{ x: 7.0, y: 6.0, rx: 0.6, ry: 0.38, rot: -0.6, alpha: 0.85 }] });
});

ingr('aglio', (ctx) => {
  ctx.save();
  ctx.translate(-1.6, -0.6);
  ctx.scale(0.94, 0.94);
  const bulb = (c: Ctx) => {
    c.moveTo(-1.0, -10.2);
    c.quadraticCurveTo(-1.3, -7.6, -1.6, -6.2);
    c.bezierCurveTo(-4.4, -5.6, -9.0, -3.0, -8.8, 1.6);
    c.bezierCurveTo(-8.6, 5.8, -5.0, 8.2, 0, 8.2);
    c.bezierCurveTo(5.0, 8.2, 8.6, 5.8, 8.8, 1.6);
    c.bezierCurveTo(9.0, -3.0, 4.4, -5.6, 1.6, -6.2);
    c.quadraticCurveTo(1.3, -7.6, 1.0, -10.2);
    c.quadraticCurveTo(0, -10.8, -1.0, -10.2);
    c.closePath();
  };
  // root plate fibres
  for (let i = -3; i <= 3; i++) line(ctx, [[i * 0.7, 7.8], [i * 1.15, 9.8 - Math.abs(i) * 0.3]], 0.75 + 1.0, INK, false);
  for (let i = -3; i <= 3; i++) line(ctx, [[i * 0.7, 7.8], [i * 1.15, 9.8 - Math.abs(i) * 0.3]], 0.75, '#d9c49a', false);
  S(ctx, bulb, { fill: '#f7f1e2', ink: K, shadow: '#d9cbe0', shadowOffset: [-2.4, -2.4], gloss: [{ x: -4.2, y: -1.6, rx: 1.3, ry: 2.6, rot: 0.3, alpha: 0.9 }] });
  // cloves: curved seams + purple streaks (Sulmona-style red garlic)
  inside(ctx, bulb, () => {
    const seams: Pt[][] = [
      [[-1.2, -6.0], [-4.6, -1.8], [-5.0, 3.6], [-3.0, 8.4]],
      [[-0.2, -6.2], [-1.4, -1.0], [-1.2, 4.0], [-0.4, 8.6]],
      [[0.8, -6.1], [2.6, -1.4], [3.0, 4.0], [2.0, 8.6]],
      [[1.4, -5.8], [5.4, -2.2], [6.6, 2.8], [5.4, 7.4]],
    ];
    for (const s of seams) line(ctx, s, 0.65, '#b9a7b8', true, 0.85);
    const streaks: Pt[][] = [
      [[-5.2, 2.0], [-5.2, 5.0], [-3.8, 7.6]],
      [[-2.4, 3.0], [-2.3, 6.0], [-1.6, 8.2]],
      [[1.2, 3.6], [1.4, 6.2], [1.0, 8.4]],
      [[4.4, 2.6], [4.6, 5.4], [3.6, 7.8]],
      [[7.0, 1.0], [7.2, 3.6], [6.4, 6.0]],
    ];
    for (const s of streaks) line(ctx, s, 0.9, '#b45aa0', true, 0.55);
    for (const s of streaks) line(ctx, s.map(([x, y]) => [x + 0.5, y - 1.4] as Pt), 0.45, '#c97ab6', true, 0.45);
  });
  // papery neck twist
  line(ctx, [[-0.4, -9.6], [0.3, -7.6], [-0.2, -6.4]], 0.4, '#c8b89a', true, 0.9);
  ctx.restore();
  // one loose clove
  rot(ctx, 7.0, 5.8, 0.55, () => {
    const clove = (c: Ctx) => {
      c.moveTo(0, -4.2);
      c.bezierCurveTo(2.8, -2.6, 3.2, 2.2, 1.6, 3.6);
      c.quadraticCurveTo(0, 4.4, -1.6, 3.6);
      c.bezierCurveTo(-2.0, 1.4, -1.3, -2.0, 0, -4.2);
      c.closePath();
    };
    S(ctx, clove, { fill: '#f7f0df', ink: 1.2, shadow: '#d6c6d6', shadowOffset: [-1.0, -1.0], gloss: [{ x: -0.4, y: -0.4, rx: 0.5, ry: 1.4, alpha: 0.9 }] });
    line(ctx, [[0.8, -1.6], [1.6, 1.2], [1.1, 3.4]], 0.6, '#b45aa0', true, 0.55);
  });
});

ingr('basilico', (ctx) => {
  ctx.translate(0, 0.4);
  // stem
  tube(ctx, [[0.8, 10.2], [0.4, 5.0], [0.0, -1.0], [-0.2, -6.2]], 1.2, '#4e9a3a', 0.9, true, '#9be07a', 0.6);
  // leaves: big pair, middle pair, top bud
  basilLeaf(ctx, -0.1, -5.6, -1.25, 4.4, 2.8, 1.0);
  basilLeaf(ctx, -0.3, -5.6, -1.95, 4.2, 2.7, 1.0);
  basilLeaf(ctx, 0.0, -1.8, -0.62, 7.0, 4.3, 1.15);
  basilLeaf(ctx, -0.1, -1.6, Math.PI + 0.62, 7.0, 4.3, 1.15);
  basilLeaf(ctx, 0.4, 4.0, -0.18, 9.4, 5.6, 1.25);
  basilLeaf(ctx, 0.3, 4.2, Math.PI + 0.22, 9.2, 5.6, 1.25);
});

ingr('prezzemolo', (ctx) => {
  ctx.translate(0, 0.2);
  /** one serrated lobe pointing along -y (base at 0,0) */
  const lobe = (c: Ctx, s: number) => {
    const p: Pt[] = [[0, 0], [-1.1, -0.9], [-2.6, -1.3], [-2.0, -2.4], [-2.9, -3.4], [-1.5, -3.6], [-1.0, -5.0], [0, -4.2], [1.0, -5.0], [1.5, -3.6], [2.9, -3.4], [2.0, -2.4], [2.6, -1.3], [1.1, -0.9]];
    polyPath(c, p.map(([x, y]) => [x * s, y * s] as Pt));
  };
  const sprig = (x: number, y: number, a: number, s: number) => {
    rot(ctx, x, y, a, () => {
      // three serrated lobes fanned from one point (the path survives save/restore)
      const b = (c: Ctx) => {
        lobe(c, s);
        for (const a of [-0.95, 0.95]) {
          c.save();
          c.rotate(a);
          lobe(c, s * 0.85);
          c.restore();
        }
      };
      S(ctx, b, { fill: '#33a043', ink: 1.0, shadow: '#1d6e30', shadowOffset: [-0.9, -1.0] });
      // veins
      line(ctx, [[0, 0], [0, -3.6 * s]], 0.35, '#8fd27a', false, 0.9);
      line(ctx, [[0, 0], [Math.sin(-0.95) * -3.0 * s * 0.85, -Math.cos(-0.95) * 3.0 * s * 0.85]], 0.3, '#8fd27a', false, 0.8);
      line(ctx, [[0, 0], [Math.sin(0.95) * -3.0 * s * 0.85, -Math.cos(0.95) * 3.0 * s * 0.85]], 0.3, '#8fd27a', false, 0.8);
    });
  };
  // stems
  const stems: Pt[][] = [
    [[0.4, 10.2], [0.0, 4.0], [-2.6, -1.0], [-5.0, -3.6]],
    [[0.4, 10.2], [0.4, 3.0], [0.8, -2.0], [1.0, -5.6]],
    [[0.4, 10.2], [0.8, 4.2], [3.6, 0.6], [5.8, -1.0]],
  ];
  for (const s of stems) inkLine2(ctx, s, 0.8, '#5aa040', 0.8);
  sprig(-5.0, -3.6, -0.85, 1.05);
  sprig(5.8, -1.0, 1.0, 1.0);
  sprig(1.0, -5.6, 0.05, 1.12);
  sprig(-1.6, 3.6, -1.6, 0.8);
});

ingr('origano', (ctx) => {
  const R = rng(91);
  const base: Pt = [0, 6.4];
  const tips: Pt[] = [[-8.0, -2.2], [-6.6, -6.6], [-3.4, -9.4], [0.2, -10.2], [3.8, -9.2], [6.8, -6.6], [8.2, -2.6]];
  const mid = (t: Pt): Pt => [base[0] + (t[0] - base[0]) * 0.5 - t[0] * 0.04, base[1] + (t[1] - base[1]) * 0.5];
  // leaf pairs along each stem, shrinking toward the tip
  const leaves: { x: number; y: number; a: number; s: number }[] = [];
  for (const t of tips) {
    const a = Math.atan2(t[1] - base[1], t[0] - base[0]);
    for (const f of [0.4, 0.58, 0.75]) {
      const x = base[0] + (t[0] - base[0]) * f, y = base[1] + (t[1] - base[1]) * f;
      for (const side of [-1, 1]) leaves.push({ x, y, a: a + side * (0.8 + R() * 0.25), s: 1.05 - f * 0.35 });
    }
  }
  const stemB = (c: Ctx) => { for (const t of tips) taperPath(c, [base, mid(t), t], (u) => 0.9 - u * 0.35, 10); };
  const leafB = (c: Ctx) => {
    for (const L of leaves) {
      c.save();
      c.translate(L.x, L.y);
      c.rotate(L.a);
      leafPath(c, 2.5 * L.s, 1.6 * L.s, 0.5);
      c.restore();
    }
  };
  // dried flower heads: little clusters of papery bracts
  const heads = tips.map((t) => Array.from({ length: 4 }, (_, k): [number, number, number] => {
    const a = (k / 4) * Math.PI * 2 + R();
    return [t[0] + Math.cos(a) * 0.95, t[1] + Math.sin(a) * 0.85, 0.95 + R() * 0.25];
  }));
  const headB = (c: Ctx) => { for (const h of heads) for (const [x, y, r] of h) circlePath(c, x, y, r); };
  G(ctx, [
    { build: stemB, style: { fill: '#9c8656', shadow: 'none' } },
    { build: leafB, style: { fill: '#91a656', shadow: '#647a38', shadowOffset: [-0.55, -0.6] } },
    { build: headB, style: { fill: '#d2c995', shadow: '#a39c66', shadowOffset: [-0.5, -0.55] } },
  ], 1.1);
  for (const L of leaves) line(ctx, [[L.x, L.y], [L.x + Math.cos(L.a) * 1.7 * L.s, L.y + Math.sin(L.a) * 1.7 * L.s]], 0.25, '#c8dc90', false, 0.8);
  for (const h of heads) {
    const [x, y] = h[0];
    speckle(ctx, x, y, 1.6, 1.4, 6, '#d99ab2', 0.3, Math.floor(R() * 100), 0.95);
    speckle(ctx, x - 0.4, y - 0.4, 1.2, 1.0, 3, '#fffbe0', 0.28, Math.floor(R() * 100), 0.95);
  }
  // cut stems under the tie
  for (let i = -2; i <= 2; i++) inkLine2(ctx, [[i * 0.45, 7.0], [i * 0.85, 9.8]], 0.7, '#9c8656', 0.6, INK, false);
  // twine tie with a bow
  S(ctx, (c) => roundRectPath(c, -2.1, 5.8, 4.2, 2.3, 0.8), { fill: '#d9b47a', ink: 0.9, shadow: '#a87c42', shadowOffset: [-0.5, -0.5] });
  line(ctx, [[-1.9, 6.9], [1.9, 7.1]], 0.35, '#8a6230', false, 0.8);
  S(ctx, (c) => { ellipsePath(c, 3.1, 6.0, 1.4, 0.8, -0.5); ellipsePath(c, 3.3, 8.0, 1.3, 0.7, 0.5); }, { fill: '#d9b47a', ink: 0.7, shadow: 'none' });
});

// ===========================================================================
// MEAT, EGGS, CHEESE, PEPPER, BUTTER
// ===========================================================================

ingr('guanciale', (ctx) => {
  // a triangular slab of cured cheek: peppered rind on top, the cut face below
  const top: Pt[] = [[-9.8, 0.6], [-6.0, -3.6], [-0.6, -9.6], [5.0, -6.4], [9.6, -2.6], [1.8, 2.2]];
  const front: Pt[] = [[-9.8, 0.6], [1.8, 2.2], [9.6, -2.6], [9.4, 2.0], [1.8, 7.2], [-9.6, 5.4]];
  const topB = (c: Ctx) => smoothPath(c, top, true, 0.3);
  const frontB = (c: Ctx) => smoothPath(c, front, true, 0.12);
  G(ctx, [
    { build: frontB, style: { fill: '#faeee0', shadow: '#e2c9b6', shadowOffset: [-1.6, -1.6] } },
    { build: topB, style: { fill: '#d4a47c', shadow: '#b07c54', shadowOffset: [-1.8, -1.8] } },
  ], K);
  // the cut face: white fat with a seam of rosy lean
  inside(ctx, frontB, () => {
    const band = (dy: number, w: number, col: string, a = 1) =>
      line(ctx, [[-10.4, 1.2 + dy], [-4, 2.4 + dy], [1.8, 3.0 + dy], [6, 0.8 + dy], [10.2, -1.8 + dy]], w, col, true, a);
    band(0.15, 0.8, '#c08a5e', 0.95);
    band(2.2, 1.8, '#e5787e');
    band(1.9, 0.5, '#f6b0ae', 0.95);
    band(4.2, 0.85, '#e78a8e', 0.85);
  });
  // cured outside, rubbed with black pepper (and a pinch of chili)
  inside(ctx, topB, () => {
    speckle(ctx, 0, -3.4, 9.6, 6.0, 130, '#2b2220', 0.4, 17, 0.95);
    speckle(ctx, 0, -3.4, 9.0, 5.4, 14, '#c0442a', 0.3, 18, 0.85);
    speckle(ctx, -2, -3.6, 5.0, 2.6, 10, '#f0d0a8', 0.32, 19, 0.75);
  });
  glint(ctx, -4.6, -2.6, 1.8, 0.6, -0.8, 0.5);
  // the hole it hung from, with a twist of string
  S(ctx, (c) => ellipsePath(c, -0.7, -7.4, 0.8, 0.62), { fill: '#5a2e22', ink: 0.55, shadow: 'none' });
  inkLine2(ctx, [[-0.7, -7.4], [-1.8, -9.4], [-3.4, -10.2], [-3.8, -8.8], [-2.4, -7.8]], 0.5, '#efd7a6', 0.5);
});

ingr('pancetta', (ctx) => {
  // a second rolled slice behind
  const back = (c: Ctx) => ellipsePath(c, 3.6, -3.6, 6.4, 5.6, 0.2);
  S(ctx, back, { fill: '#e57c86', ink: K, shadow: '#bd5662', shadowOffset: [-1.2, -1.2] });
  inside(ctx, back, () => {
    const pts: Pt[] = [];
    for (let t = 0.6; t < 11.6; t += 0.25) pts.push([3.6 + Math.cos(t) * t * 0.5, -3.6 + Math.sin(t) * t * 0.45]);
    line(ctx, pts, 1.0, '#fbeee6', false, 0.95);
  });
  // the front slice: a disc with visible thickness
  const cx = -1.6, cy = 1.6, rx = 8.0, ry = 7.2;
  const side = (c: Ctx) => ellipsePath(c, cx + 0.9, cy + 1.5, rx, ry);
  const face = (c: Ctx) => ellipsePath(c, cx, cy, rx, ry);
  G(ctx, [
    { build: side, style: { fill: '#e9a49c', shadow: '#c06a66', shadowOffset: [-1.4, -1.4] } },
    { build: face, style: { fill: '#e8737f', shadow: 'none' } },
  ], K);
  // layered edge
  inside(ctx, side, () => {
    for (let i = 0; i < 9; i++) {
      const a = 0.2 + i * 0.32;
      line(ctx, [[cx + Math.cos(a) * rx * 0.95, cy + Math.sin(a) * ry * 0.95], [cx + 0.9 + Math.cos(a) * rx, cy + 1.5 + Math.sin(a) * ry]], 0.6, i % 2 ? '#fbeee6' : '#d9646e', false, 0.85);
    }
  });
  inside(ctx, face, () => {
    // the spiral of fat in the pink meat
    const pts: Pt[] = [];
    for (let t = 0.5; t < 13.8; t += 0.2) pts.push([cx + Math.cos(t) * t * 0.56, cy + Math.sin(t) * t * 0.5]);
    line(ctx, pts, 1.7, '#fdf1ea', false);
    line(ctx, pts.map(([x, y]) => [x + 0.35, y + 0.4] as Pt), 0.45, '#c9545f', false, 0.6);
    // rind ring
    ctx.beginPath();
    ellipsePath(ctx, cx, cy, rx - 0.5, ry - 0.5);
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#c45a5a';
    ctx.stroke();
  });
  crescent(ctx, face, '#9c2f3e', 0.3, [-2.0, -2.0]);
  glint(ctx, cx - 4.0, cy - 3.8, 1.7, 0.75, -0.6, 0.7);
});

ingr('manzo', (ctx) => {
  const R = rng(77);
  // butcher paper
  const paper: Pt[] = [[-10.4, 4.6], [-1.0, 0.4], [10.2, 3.6], [1.2, 9.8]];
  S(ctx, (c) => polyPath(c, paper), { fill: '#e6cda2', ink: K, shadow: '#c4a476', shadowOffset: [-1.2, -1.0] });
  line(ctx, [[-5.6, 2.6], [5.8, 6.6]], 0.4, '#c4a476', false, 0.8);
  // the mound of coarse mince
  const mound = (c: Ctx) => {
    const pts: Pt[] = [];
    const m = 30;
    for (let i = 0; i < m; i++) {
      const a = (i / m) * Math.PI * 2;
      const k = 1 + Math.sin(a * 9 + 1.3) * 0.06 + Math.sin(a * 5) * 0.03;
      const y = Math.sin(a) > 0 ? Math.sin(a) * 4.0 : Math.sin(a) * 8.2;
      pts.push([-0.2 + Math.cos(a) * 8.0 * k, 1.6 + y * k]);
    }
    smoothPath(c, pts, true);
  };
  S(ctx, mound, { fill: '#c9473c', ink: K, shadow: 'none' });
  inside(ctx, mound, () => {
    for (let i = 0; i < 70; i++) {
      const x = -8 + R() * 16, y = -6.8 + R() * 12.5;
      const a = R() * Math.PI;
      const l = 1.0 + R() * 1.0;
      const col = i % 3 === 0 ? '#ec8a78' : i % 3 === 1 ? '#97272a' : '#d85a4c';
      line(ctx, [[x - Math.cos(a) * l, y - Math.sin(a) * l], [x + Math.sin(a) * 0.5, y - Math.cos(a) * 0.5], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 0.85, col, true);
    }
    speckle(ctx, -0.2, -0.6, 7, 5.6, 16, '#f8e2d6', 0.35, 78, 0.95);
  });
  crescent(ctx, mound, '#6a1416', 0.42, [-2.2, -2.4]);
  glint(ctx, -3.4, -3.8, 1.9, 0.8, -0.5, 0.5);
});

ingr('tuorli', (ctx) => {
  // inside of the half shell
  const rim = (c: Ctx) => ellipsePath(c, 0, 1.4, 9.0, 3.0);
  S(ctx, rim, { fill: '#fff3df', ink: K, shadow: '#e8d2b4', shadowOffset: [1.6, 1.6] });
  // two deep-orange yolks
  const yolk = (x: number, y: number, r: number) => S(ctx, (c) => circlePath(c, x, y, r), {
    fill: radial(ctx, x - r * 0.3, y - r * 0.35, r * 1.3, [[0, '#ffd45a'], [0.5, '#ffaa18'], [1, '#f08400']]),
    ink: 1.25,
    shadow: '#e27200',
    shadowOffset: [-1.3, -1.3],
    gloss: [
      { x: x - r * 0.38, y: y - r * 0.42, rx: r * 0.32, ry: r * 0.2, rot: -0.6, alpha: 0.95 },
      { x: x + r * 0.42, y: y + r * 0.3, rx: r * 0.1, ry: r * 0.07, alpha: 0.7 },
    ],
  });
  yolk(3.3, -2.5, 4.2);
  yolk(-3.0, -1.0, 4.5);
  // front of the shell with a broken rim
  const front = (c: Ctx) => {
    c.moveTo(-9.0, 1.4);
    c.bezierCurveTo(-9.0, 7.6, -4.6, 10.0, 0, 10.0);
    c.bezierCurveTo(4.6, 10.0, 9.0, 7.6, 9.0, 1.4);
    const jag: Pt[] = [[7.8, 2.9], [6.6, 2.0], [5.2, 3.8], [3.6, 2.5], [2.0, 4.1], [0.2, 2.8], [-1.6, 4.3], [-3.4, 3.0], [-5.0, 4.1], [-6.6, 2.6], [-7.8, 3.1]];
    for (const [x, y] of jag) c.lineTo(x, y);
    c.closePath();
  };
  S(ctx, front, {
    fill: '#f2d2ac',
    ink: K,
    shadow: '#d4a679',
    shadowOffset: [-2.2, -2.0],
    gloss: [{ x: -5.6, y: 5.6, rx: 1.0, ry: 2.0, rot: 0.6, alpha: 0.7 }],
  });
  inside(ctx, front, () => speckle(ctx, 1, 7, 7, 3, 9, '#c98f5e', 0.25, 4, 0.7));
  line(ctx, [[-7.6, 3.4], [-6.6, 2.9], [-5.0, 4.4], [-3.4, 3.3], [-1.6, 4.6], [0.2, 3.1], [2.0, 4.4], [3.6, 2.8], [5.2, 4.1], [6.6, 2.3], [7.8, 3.2]], 0.5, '#fff6e6', false, 0.9);
});

/** A cheese wedge: tip on the left (or right when `flip`), rind on the curved back. */
function wedge(ctx: Ctx, o: {
  paste: string; pasteTop: string; pasteSh: string; rind: string; rindL: string; seed: number;
  flip?: boolean; crag?: boolean;
  /** marks on the rind, called at points along it (x, y, i): basket weave, pin dots... */
  mark?: (x: number, y: number, i: number) => void;
}) {
  const R = rng(o.seed);
  ctx.save();
  if (o.flip) ctx.scale(-1, 1);
  const tipT: Pt = [-10, 0.6], A: Pt = [1.6, -8.6], C: Pt = [8.6, -8.4], B: Pt = [9.8, -2.8], Bb: Pt = [9.8, 4.4], tipB: Pt = [-10, 7.8];
  // front edge (jagged when the cheese is broken rather than cut)
  const edge: Pt[] = [tipT];
  const n = o.crag ? 7 : 1;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    edge.push([tipT[0] + (B[0] - tipT[0]) * t, tipT[1] + (B[1] - tipT[1]) * t + (R() - 0.5) * 1.2]);
  }
  edge.push(B);
  const top = (c: Ctx) => {
    polyPath(c, [...edge], false);
    c.quadraticCurveTo(C[0], C[1], A[0], A[1]);
    c.closePath();
  };
  const front = (c: Ctx) => polyPath(c, [...edge, Bb, tipB]);
  const flipOff = (x: number, y: number): Pt => [o.flip ? -x : x, y];
  G(ctx, [
    { build: front, style: { fill: o.paste, shadow: o.pasteSh, shadowOffset: flipOff(-1.6, -1.6) } },
    { build: top, style: { fill: o.pasteTop, shadow: 'none' } },
  ], K);
  // rind: a band along the curved back of the top face...
  const RW = 3.4;
  inside(ctx, top, () => {
    ctx.beginPath();
    ctx.moveTo(A[0] - 0.6, A[1] - 0.2);
    ctx.quadraticCurveTo(C[0], C[1], B[0] + 0.3, B[1] + 0.2);
    ctx.lineWidth = RW;
    ctx.strokeStyle = o.rind;
    ctx.stroke();
    line(ctx, sample([A, [6.6, -7.6], [9.0, -5.2], B], 12).map(([x, y]) => [x - 1.5, y + 0.9] as Pt), 0.35, INK, true, 0.45);
    if (o.mark) {
      for (let i = 1; i < 9; i++) {
        const t = i / 9;
        const x = (1 - t) ** 2 * A[0] + 2 * (1 - t) * t * C[0] + t * t * B[0];
        const y = (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * C[1] + t * t * B[1];
        o.mark(x - 0.55, y + 0.5, i);
      }
    }
  });
  // ...and the rind end of the front face
  const rindEnd = (c: Ctx) => polyPath(c, [[7.6, -2.4], B, Bb, [7.6, 4.8]]);
  inside(ctx, front, () => {
    S(ctx, rindEnd, { fill: o.rind, ink: 0, shadow: 'none' });
    inside(ctx, rindEnd, () => {
      if (o.mark) for (let j = 0; j < 4; j++) o.mark(8.7, -1.0 + j * 1.6, j + 20);
    });
    line(ctx, [[7.6, -2.2], [7.6, 4.8]], 0.5, INK, false, 0.6);
    line(ctx, [[8.2, -1.8], [8.2, 4.2]], 0.4, o.rindL, false, 0.8);
  });
  ctx.restore();
}

ingr('pecorino', (ctx) => {
  ctx.translate(0, 0.6);
  wedge(ctx, {
    paste: '#f2ead5', pasteTop: '#fffaee', pasteSh: '#d6c9ae', rind: '#2a2422', rindL: '#7b726a', seed: 3,
    // the basket-weave print of the mould on the black rind
    mark: (x, y, i) => line(ctx, [[x - 0.45, y + (i % 2 ? -0.45 : 0.45)], [x + 0.45, y + (i % 2 ? 0.45 : -0.45)]], 0.32, '#6e6660', false, 0.9),
  });
  // small, sparse eyes and a faint grain
  for (const [x, y, r] of [[-3.6, 3.4, 0.55], [1.2, 2.4, 0.42], [4.0, 4.6, 0.5], [-0.8, -3.2, 0.42], [-5.6, 5.0, 0.36], [3.0, -5.4, 0.38], [-4.6, -0.8, 0.32]] as [number, number, number][]) {
    S(ctx, (c) => ellipsePath(c, x, y, r, r * 0.75), { fill: '#d8caa8', ink: 0, shadow: 'none' });
    glint(ctx, x + r * 0.3, y + r * 0.35, r * 0.4, r * 0.25, 0, 0.8);
  }
  speckle(ctx, -1, 4.4, 7.6, 2.6, 10, '#e2d6bc', 0.3, 5, 0.8);
  glint(ctx, -3.0, -2.2, 2.6, 0.7, -0.36, 0.75);
});

ingr('parmigiano', (ctx) => {
  ctx.translate(0, 0.6);
  wedge(ctx, {
    paste: '#f2cc6e', pasteTop: '#fbe3a0', pasteSh: '#d9a443', rind: '#c4842e', rindL: '#f1c27a', flip: true, crag: true, seed: 9,
    // the pin-dot rind (puntinatura)
    mark: (x, y) => {
      for (const [dx, dy] of [[-0.5, -0.4], [0.5, 0.4]] as Pt[]) S(ctx, (c) => circlePath(c, x + dx, y + dy, 0.3), { fill: '#6e3c10', ink: 0, shadow: 'none' });
    },
  });
  // granular, craggy paste with tyrosine crystals
  speckle(ctx, 0, 3.6, 8.5, 2.8, 26, '#d49a3a', 0.36, 12, 0.85);
  speckle(ctx, 0, 3.6, 8.5, 2.8, 14, '#fff7da', 0.32, 13, 1);
  speckle(ctx, -1, -3.6, 5, 2.4, 10, '#fffbe8', 0.3, 14, 1);
  speckle(ctx, 1, -3.0, 6, 2.6, 10, '#e2b250', 0.3, 15, 0.8);
  glint(ctx, 3.0, -2.6, 2.2, 0.6, 0.3, 0.65);
});

ingr('pepe', (ctx) => {
  // a wooden pepper mill...
  ctx.save();
  ctx.translate(-3.0, 0);
  const wood = '#a8693a';
  G(ctx, [
    { build: (c) => { c.moveTo(-3.9, -3.0); c.bezierCurveTo(-4.6, -6.8, -2.2, -8.0, 0, -8.0); c.bezierCurveTo(2.2, -8.0, 4.6, -6.8, 3.9, -3.0); c.closePath(); }, style: { fill: wood, shadow: '#77401f', shadowOffset: [-1.4, -1.4] } },
    { build: (c) => roundRectPath(c, -3.2, -3.6, 6.4, 1.6, 0.5), style: { fill: '#c98a4e', shadow: 'none' } },
    {
      build: (c) => {
        c.moveTo(-2.4, -2.2);
        c.bezierCurveTo(-2.4, 0.2, -5.0, 1.8, -5.0, 5.0);
        c.bezierCurveTo(-5.0, 7.0, -4.0, 8.0, -4.0, 8.4);
        c.lineTo(4.0, 8.4);
        c.bezierCurveTo(4.0, 8.0, 5.0, 7.0, 5.0, 5.0);
        c.bezierCurveTo(5.0, 1.8, 2.4, 0.2, 2.4, -2.2);
        c.closePath();
      },
      style: { fill: wood, shadow: '#77401f', shadowOffset: [-1.8, -1.6] },
    },
    { build: (c) => roundRectPath(c, -5.0, 8.0, 10.0, 1.9, 0.7), style: { fill: '#8f5530', shadow: 'none' } },
  ], K);
  // turned rings + grain + varnish shine
  line(ctx, [[-4.4, 2.6], [0, 3.2], [4.4, 2.6]], 0.45, '#6e3a1a', true, 0.7);
  line(ctx, [[-4.9, 6.4], [0, 7.0], [4.9, 6.4]], 0.45, '#6e3a1a', true, 0.7);
  line(ctx, [[-3.4, -2.8], [3.4, -2.8]], 0.4, '#f0c08a', false, 0.8);
  line(ctx, [[-3.0, 0.6], [-3.6, 4.0], [-3.2, 7.4]], 0.9, '#e8b07a', true, 0.75);
  glint(ctx, -1.8, -6.0, 1.3, 0.55, -0.6, 0.7);
  // brass finial
  S(ctx, (c) => { circlePath(c, 0, -9.0, 1.35); }, { fill: '#e2a945', ink: 1.1, shadow: '#a86a18', shadowOffset: [-0.5, -0.5], gloss: [{ x: -0.4, y: -9.4, rx: 0.45, ry: 0.3, alpha: 0.9 }] });
  ctx.restore();
  // ...and a spill of black peppercorns
  const corns: [number, number, number][] = [[4.6, 8.2, 1.75], [7.8, 7.4, 1.7], [6.4, 4.8, 1.6], [9.0, 4.4, 1.35], [3.8, 4.8, 1.4]];
  const R = rng(4);
  for (const [x, y, r] of corns) {
    S(ctx, (c) => circlePath(c, x, y, r), { fill: '#4a3a32', ink: 1.0, shadow: '#241a16', shadowOffset: [-0.7, -0.7] });
    // wrinkles
    for (let k = 0; k < 3; k++) {
      const a = R() * Math.PI * 2;
      line(ctx, [[x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6], [x + Math.cos(a + 0.9) * r * 0.25, y + Math.sin(a + 0.9) * r * 0.25]], 0.3, '#1e1410', false, 0.8);
    }
    glint(ctx, x - r * 0.38, y - r * 0.4, r * 0.32, r * 0.2, -0.6, 0.85);
  }
});

ingr('burro', (ctx) => {
  ctx.save();
  ctx.translate(-0.4, -2.0);
  const u: Pt = [1, 0.18], v: Pt = [0.55, -0.42];
  const L = 12.4, D = 7.0, H = 5.6;
  const P0: Pt = [-7.6, 6.2];
  const add = (p: Pt, q: Pt, k: number): Pt => [p[0] + q[0] * k, p[1] + q[1] * k];
  const P1 = add(P0, u, L), P3 = add(P0, v, D), P2 = add(P1, v, D);
  const Q0: Pt = [P0[0], P0[1] - H], Q1: Pt = [P1[0], P1[1] - H], Q2: Pt = [P2[0], P2[1] - H], Q3: Pt = [P3[0], P3[1] - H];
  // the parchment it came in, opened out flat (crinkled edges, one corner folded back)
  const e = 1.9;
  const c0 = add(add(P0, u, -e), v, -e * 0.8), c1 = add(add(P1, u, e), v, -e * 0.8), c2 = add(add(P2, u, e * 0.8), v, e * 0.5), c3 = add(add(P3, u, -e), v, e * 0.5);
  const R = rng(8);
  const crinkle = (a: Pt, b: Pt, k: number): Pt[] => Array.from({ length: k }, (_, i) => {
    const t = (i + 1) / (k + 1);
    return [a[0] + (b[0] - a[0]) * t + (R() - 0.5) * 0.7, a[1] + (b[1] - a[1]) * t + (R() - 0.5) * 0.7] as Pt;
  });
  const paper: Pt[] = [c0, ...crinkle(c0, c1, 4), c1, ...crinkle(c1, c2, 2), c2, ...crinkle(c2, c3, 4), c3, ...crinkle(c3, c0, 2)];
  S(ctx, (c) => polyPath(c, paper), { fill: '#fbf7ec', ink: K, shadow: '#ddd4c0', shadowOffset: [-1.0, -1.0] });
  S(ctx, (c) => polyPath(c, [c1, add(c1, u, -3.0), add(c1, v, 2.2)]), { fill: '#ffffff', ink: 0.7, shadow: '#e4dccb', shadowOffset: [-0.4, -0.4] });
  line(ctx, [add(c0, u, 3.0), add(c3, u, 3.0)], 0.35, '#d6ccb6', false, 0.9);
  // the block
  G(ctx, [
    { build: (c) => polyPath(c, [Q0, Q1, P1, P0]), style: { fill: '#fbe07a', shadow: 'none' } },
    { build: (c) => polyPath(c, [Q1, Q2, P2, P1]), style: { fill: '#e9bf4c', shadow: 'none' } },
    { build: (c) => polyPath(c, [Q0, Q3, Q2, Q1]), style: { fill: '#fff2b2', shadow: 'none' } },
  ], K);
  line(ctx, [Q0, Q1, Q2], 0.5, '#fffbe0', false, 0.95);
  line(ctx, [Q1, P1], 0.5, '#c79a2c', false, 0.6);
  // a soft sheen along the front face
  line(ctx, [[Q0[0] + 1.4, Q0[1] + 1.5], [Q0[0] + 7.0, Q0[1] + 2.5]], 0.8, '#ffffff', false, 0.55);
  // a butter curl on top
  const Cc = add(add(Q0, u, L * 0.5), v, D * 0.5);
  rot(ctx, Cc[0], Cc[1] - 0.7, Math.atan2(u[1], u[0]), () => {
    S(ctx, (c) => roundRectPath(c, -3.4, -1.3, 6.8, 2.6, 1.3), { fill: '#ffe98a', ink: 0.9, shadow: '#e4bc48', shadowOffset: [-0.6, -0.7] });
    for (const x of [-1.8, -0.4, 1.0, 2.4]) line(ctx, [[x, -1.1], [x - 0.4, 1.1]], 0.35, '#e0b444', false, 0.85);
    S(ctx, (c) => ellipsePath(c, 3.4, 0, 0.9, 1.3), { fill: '#fff4b8', ink: 0.7, shadow: 'none' });
    line(ctx, [[3.4, -0.5], [3.7, 0.1], [3.2, 0.5]], 0.3, '#d9a83a', true, 0.9);
  });
  ctx.restore();
});

// ===========================================================================
// WATER, WINE, CHILI
// ===========================================================================

ingr('acqua', (ctx) => {
  const cx = -1.4, cy = 0.8, rx = 7.0, ry = 2.5;
  // the handle rises from the back of the rim and ends in a hook
  tube(ctx, [[cx + 4.6, cy - 1.4], [cx + 6.6, cy - 5.6], [cx + 8.0, cy - 9.4], [cx + 8.2, cy - 11.0], [cx + 7.0, cy - 11.6]], 1.45, '#d7dee8', K, true, '#ffffff', 0.9);
  // deep round bowl + rim, one silhouette
  const bowl = (c: Ctx) => {
    c.moveTo(cx - rx, cy);
    c.bezierCurveTo(cx - rx, cy + 7.2, cx - 3.6, cy + 9.0, cx, cy + 9.0);
    c.bezierCurveTo(cx + 3.6, cy + 9.0, cx + rx, cy + 7.2, cx + rx, cy);
    c.closePath();
  };
  const rim = (c: Ctx) => ellipsePath(c, cx, cy, rx, ry);
  G(ctx, [
    { build: bowl, style: { fill: linear(ctx, cx - rx, 0, cx + rx, 0, [[0, '#ffffff'], [0.28, '#e2e8f0'], [0.75, '#97a3b6'], [1, '#c4ccd8']]), shadow: 'none' } },
    { build: rim, style: { fill: '#aeb8c8', shadow: 'none' } },
  ], K);
  inside(ctx, bowl, () => {
    line(ctx, [[cx - 5.2, cy + 3.0], [cx - 4.2, cy + 6.4], [cx - 1.6, cy + 7.8]], 0.95, '#ffffff', true, 0.9);
    line(ctx, [[cx + 4.8, cy + 3.4], [cx + 3.8, cy + 6.2]], 0.5, '#e8edf4', true, 0.7);
  });
  // cloudy, starchy water (opalescent, not clear)
  const water = (c: Ctx) => ellipsePath(c, cx, cy + 0.25, rx - 0.85, ry - 0.6);
  S(ctx, water, { fill: radial(ctx, cx - 1.8, cy - 0.2, rx, [[0, '#ffffff'], [0.5, '#e8f2f2'], [1, '#bcd4dc']]), ink: 0.6, inkColor: '#6f8296', shadow: 'none' });
  inside(ctx, water, () => {
    line(ctx, [[cx - 4.2, cy - 0.2], [cx - 2.0, cy - 0.7], [cx + 0.6, cy - 0.3]], 0.45, '#ffffff', true, 0.95);
    for (const [x, y, r] of [[cx + 2.6, cy + 0.6, 0.45], [cx + 3.7, cy - 0.2, 0.3], [cx + 1.6, cy + 1.2, 0.3]] as [number, number, number][]) {
      ctx.beginPath();
      circlePath(ctx, x, y, r);
      ctx.lineWidth = 0.25;
      ctx.strokeStyle = '#8fa6b6';
      ctx.stroke();
    }
  });
  // one spaghetto draped over the rim: it IS pasta water
  inkLine2(ctx, [[cx - 0.6, cy + 0.4], [cx - 3.6, cy + 1.6], [cx - 6.0, cy + 2.2], [cx - 7.6, cy + 3.6], [cx - 7.6, cy + 6.0]], 0.85, '#f4d27a', 0.55);
  // steam
  for (const [x, a] of [[cx - 2.4, 1], [cx + 1.6, -1]] as [number, number][]) {
    const pts: Pt[] = [[x, cy - 2.6], [x - 1.0 * a, cy - 4.6], [x + 0.6 * a, cy - 6.8], [x - 0.5 * a, cy - 9.0]];
    line(ctx, pts, 1.7, '#8fa6b8', true, 0.5);
    line(ctx, pts, 1.05, '#ffffff', true, 0.95);
  }
});

ingr('vino', (ctx) => {
  // white grapes at the foot (behind the bottle's right side)
  const grapes: [number, number][] = [[6.0, 3.0], [8.4, 3.4], [5.0, 5.4], [7.4, 5.8], [9.0, 6.6], [6.2, 8.0], [8.0, 8.8]];
  // vine leaf
  rot(ctx, 7.0, 1.4, -0.6, () => {
    S(ctx, (c) => {
      c.moveTo(0, 0);
      c.bezierCurveTo(-1.0, -1.6, 0.4, -3.6, 1.6, -2.4);
      c.bezierCurveTo(2.0, -4.0, 4.4, -3.6, 3.8, -1.6);
      c.bezierCurveTo(5.4, -1.2, 5.0, 1.0, 3.2, 0.8);
      c.bezierCurveTo(2.4, 1.6, 0.8, 1.4, 0, 0);
      c.closePath();
    }, { fill: '#5ea040', ink: 0.9, shadow: '#3c7a2c', shadowOffset: [-0.6, -0.6] });
    line(ctx, [[0.3, 0], [2.6, -1.4]], 0.3, '#b6e08a', false, 0.9);
  });
  for (const [x, y] of grapes) {
    S(ctx, (c) => circlePath(c, x, y, 1.65), { fill: '#cddc66', ink: 0.85, shadow: '#9cae38', shadowOffset: [-0.6, -0.6], gloss: [{ x: x - 0.55, y: y - 0.6, rx: 0.45, ry: 0.3, rot: -0.6, alpha: 0.95 }] });
  }
  rot(ctx, -2.4, 0.4, -0.2, () => {
    const bottle = (c: Ctx) => {
      c.moveTo(-1.4, -8.2);
      c.lineTo(-1.4, -4.8);
      c.bezierCurveTo(-1.4, -3.0, -3.7, -2.8, -3.7, -0.6);
      c.lineTo(-3.7, 9.0);
      c.quadraticCurveTo(-3.7, 10.0, -2.7, 10.0);
      c.lineTo(2.7, 10.0);
      c.quadraticCurveTo(3.7, 10.0, 3.7, 9.0);
      c.lineTo(3.7, -0.6);
      c.bezierCurveTo(3.7, -2.8, 1.4, -3.0, 1.4, -4.8);
      c.lineTo(1.4, -8.2);
      c.closePath();
    };
    S(ctx, bottle, { fill: '#e4efcf', ink: K, shadow: 'none' });
    // straw-coloured dry white, up to the shoulder
    inside(ctx, bottle, () => {
      ctx.fillStyle = linear(ctx, -3.7, 0, 3.7, 0, [[0, '#fbf1b8'], [0.5, '#efd978'], [1, '#c9a93a']]);
      ctx.fillRect(-5, -2.2, 10, 13);
      ctx.beginPath();
      ellipsePath(ctx, 0, -2.2, 3.6, 0.5);
      ctx.fillStyle = '#fff8cc';
      ctx.fill();
    });
    crescent(ctx, bottle, '#7a7a2a', 0.3, [-1.6, -1.4]);
    inside(ctx, bottle, () => {
      line(ctx, [[-2.6, -0.6], [-2.7, 8.6]], 0.8, '#ffffff', false, 0.75);
      line(ctx, [[-0.6, -7.6], [-0.6, -4.8]], 0.5, '#ffffff', false, 0.8);
      // plain label (no text): a band with a little grape mark
      S(ctx, (c) => roundRectPath(c, -3.8, 2.6, 7.6, 4.4, 0.4), { fill: '#fbf3dc', ink: 0.6, shadow: '#dccfb0', shadowOffset: [-1.0, -0.6] });
      for (const [x, y] of [[-0.6, 4.2], [0.6, 4.2], [0, 5.2]] as Pt[]) S(ctx, (c) => circlePath(c, x, y, 0.55), { fill: '#9cae38', ink: 0, shadow: 'none' });
      line(ctx, [[-2.6, 3.3], [2.6, 3.3]], 0.4, '#b5343e', false, 0.8);
    });
    // capsule
    S(ctx, (c) => roundRectPath(c, -1.85, -10.4, 3.7, 3.6, 0.6), { fill: linear(ctx, -1.8, 0, 1.8, 0, [[0, '#d65a64'], [0.4, '#a8283a'], [1, '#6e1224']]), ink: K, shadow: 'none' });
    line(ctx, [[-1.7, -7.6], [1.7, -7.6]], 0.4, '#e8a0a6', false, 0.8);
  });
});

ingr('peperoncino', (ctx) => {
  // a smaller chili behind
  const back: Pt[] = [[-3.2, -7.8], [0.6, -7.4], [4.4, -5.2], [6.8, -1.6], [7.6, 1.2]];
  S(ctx, (c) => taperPath(c, back, (t) => 3.6 * Math.pow(1 - t, 0.6) + 0.35), { fill: '#bd1f1c', ink: K, shadow: '#7f1014', shadowOffset: [-1.0, -1.2], gloss: [{ x: 1.4, y: -8.2, rx: 1.8, ry: 0.4, rot: 0.25, alpha: 0.6 }] });
  S(ctx, (c) => ellipsePath(c, -3.3, -7.8, 1.3, 1.9, -0.1), { fill: '#3f8a2e', ink: 0.9, shadow: 'none' });
  // the big one, curling to a point
  const main: Pt[] = [[-6.6, -5.4], [-4.6, -2.2], [-1.6, 1.6], [2.2, 5.4], [5.6, 8.0], [8.4, 8.8], [9.6, 7.6]];
  const b = (c: Ctx) => taperPath(c, main, (t) => 5.6 * Math.pow(1 - t, 0.75) + 0.35, 32);
  S(ctx, b, { fill: '#e2281e', ink: K, shadow: '#a3141a', shadowOffset: [-1.6, -1.8] });
  line(ctx, sample(main, 14).slice(1, 11).map(([x, y]) => [x - 1.3, y - 0.2] as Pt), 0.9, '#ffb4a0', true, 0.8);
  glint(ctx, -4.6, -3.6, 1.2, 0.55, 1.0, 0.95);
  // green calyx + stem
  rot(ctx, -6.6, -5.4, -0.95, () => {
    S(ctx, (c) => {
      c.moveTo(-1.6, -3.0);
      c.quadraticCurveTo(1.6, -3.4, 2.2, -0.4);
      c.lineTo(1.2, 0.2);
      c.lineTo(0.6, -0.6);
      c.lineTo(-0.2, 0.4);
      c.lineTo(-0.9, -0.5);
      c.lineTo(-1.8, 0.2);
      c.lineTo(-2.6, -0.6);
      c.quadraticCurveTo(-2.6, -2.6, -1.6, -3.0);
      c.closePath();
    }, { fill: '#46a83c', ink: 1.0, shadow: '#26773a', shadowOffset: [-0.5, -0.6] });
  });
  tube(ctx, [[-7.4, -6.6], [-8.6, -8.2], [-8.0, -9.8]], 1.0, '#3d9636', 0.8, true, '#9be07a', 0.7);
});

// ===========================================================================
// SOFFRITTO, PINE NUTS, CLAMS, DOUGH, MOZZARELLA
// ===========================================================================

/** A small iso dice cube (top lit, right side shaded). */
function dice(ctx: Ctx, x: number, y: number, s: number, col: string, ink = 0.8) {
  const a = s * 0.5;
  const top: Pt[] = [[x, y - a], [x + a, y - a * 0.5], [x, y], [x - a, y - a * 0.5]];
  const left: Pt[] = [[x - a, y - a * 0.5], [x, y], [x, y + a], [x - a, y + a * 0.5]];
  const right: Pt[] = [[x, y], [x + a, y - a * 0.5], [x + a, y + a * 0.5], [x, y + a]];
  const hex: Pt[] = [[x, y - a], [x + a, y - a * 0.5], [x + a, y + a * 0.5], [x, y + a], [x - a, y + a * 0.5], [x - a, y - a * 0.5]];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  polyPath(ctx, hex);
  ctx.lineWidth = ink * 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  const f = (p: Pt[], c: string) => { ctx.beginPath(); polyPath(ctx, p); ctx.fillStyle = c; ctx.fill(); };
  f(left, col);
  f(right, shade(col, 0.24));
  f(top, light(col, 0.32));
  ctx.restore();
}

ingr('soffritto', (ctx) => {
  const ON = '#f4eccb', CA = '#f28a22', CE = '#8fcb4e';
  const s = 3.7;
  const cubes: [number, number, string][] = [
    [-1.6, -5.0, CA], [1.9, -4.6, CE],
    [-4.6, -1.8, CE], [-1.0, -1.2, ON], [2.6, -0.9, CA], [6.0, -1.6, ON],
    [-7.2, 1.8, ON], [-3.4, 2.4, CA], [0.4, 2.8, CE], [4.2, 2.6, ON], [7.6, 2.0, CA],
    [-5.4, 6.0, CA], [-1.8, 6.6, ON], [1.9, 6.6, CA], [5.6, 6.0, CE],
  ];
  // back to front so the ink of each cube overlaps the one behind
  for (const [x, y, c] of cubes) dice(ctx, x, y, s, c);
  // a celery leaf top + a carrot ribbon sticking out of the heap
  rot(ctx, 3.4, -6.6, -0.9, () => {
    S(ctx, (c) => {
      leafPath(c, 4.4, 2.6, 0.45);
      c.save(); c.rotate(-0.7); leafPath(c, 3.4, 2.2, 0.45); c.restore();
      c.save(); c.rotate(0.7); leafPath(c, 3.4, 2.2, 0.45); c.restore();
    }, { fill: '#6cc04a', ink: 0.9, shadow: '#3f8a2e', shadowOffset: [-0.6, -0.6] });
    line(ctx, [[0, 0], [3.8, 0]], 0.3, '#c6f09a', false, 0.9);
  });
  glint(ctx, -1.8, -6.2, 0.8, 0.4, -0.5, 0.8);
});

ingr('pinoli', (ctx) => {
  // a pine cone behind
  rot(ctx, 3.6, -3.0, 0.55, () => {
    const cone = (c: Ctx) => {
      c.moveTo(0, -7.4);
      c.bezierCurveTo(4.4, -7.0, 5.6, -1.6, 5.0, 2.2);
      c.bezierCurveTo(4.4, 5.6, 1.8, 7.0, 0, 7.0);
      c.bezierCurveTo(-1.8, 7.0, -4.4, 5.6, -5.0, 2.2);
      c.bezierCurveTo(-5.6, -1.6, -4.4, -7.0, 0, -7.4);
      c.closePath();
    };
    S(ctx, cone, { fill: '#9a5a2e', ink: K, shadow: '#6a3518', shadowOffset: [-1.4, -1.4] });
    inside(ctx, cone, () => {
      for (let r = -3; r <= 3; r++) {
        for (let q = -3; q <= 3; q++) {
          const x = q * 2.4 + (r % 2 ? 1.2 : 0), y = r * 2.2;
          if (Math.abs(x) > 5.4 || Math.abs(y) > 7.2) continue;
          ctx.beginPath();
          ctx.moveTo(x - 1.1, y + 0.3);
          ctx.quadraticCurveTo(x, y - 1.1, x + 1.1, y + 0.3);
          ctx.quadraticCurveTo(x, y + 1.0, x - 1.1, y + 0.3);
          ctx.closePath();
          ctx.fillStyle = '#c98a4e';
          ctx.fill();
          ctx.lineWidth = 0.35;
          ctx.strokeStyle = '#4a2410';
          ctx.stroke();
        }
      }
    });
    crescent(ctx, cone, '#3e1c0a', 0.35, [-1.6, -1.6]);
  });
  // a heap of ivory kernels in front
  const R = rng(31);
  const kern: [number, number, number][] = [
    [-2.8, 0.4, -0.5], [0.6, 1.6, 0.6], [-5.2, 3.0, 0.2], [-1.6, 3.6, 1.2], [2.2, 4.4, -0.9],
    [-7.4, 6.4, -1.0], [-4.2, 6.8, 0.5], [-0.8, 7.2, -0.3], [2.8, 7.8, 0.9], [5.6, 6.8, -0.4],
  ];
  for (const [x, y, a] of kern) {
    rot(ctx, x, y, a + (R() - 0.5) * 0.3, () => {
      const k = (c: Ctx) => {
        c.moveTo(0, -2.5);
        c.bezierCurveTo(1.45, -2.0, 1.55, 1.2, 0, 2.2);
        c.bezierCurveTo(-1.55, 1.2, -1.45, -2.0, 0, -2.5);
        c.closePath();
      };
      S(ctx, k, { fill: '#f4e3b8', ink: 0.95, shadow: '#d4b47c', shadowOffset: [-0.6, -0.7], gloss: [{ x: -0.45, y: 0.2, rx: 0.32, ry: 1.0, alpha: 0.85 }] });
      inside(ctx, k, () => { ctx.beginPath(); ellipsePath(ctx, 0, -2.4, 0.9, 0.8); ctx.fillStyle = '#c99a5a'; ctx.fill(); });
    });
  }
});

/** Shell outline of a vongola verace seen from above (umbo near the top-left). */
function clamPath(c: Ctx, s: number) {
  c.moveTo(-0.8 * s, -5.6 * s);
  c.bezierCurveTo(0.8 * s, -5.4 * s, 5.0 * s, -3.4 * s, 6.2 * s, 0.4 * s);
  c.bezierCurveTo(6.8 * s, 3.8 * s, 3.6 * s, 5.2 * s, 0, 5.2 * s);
  c.bezierCurveTo(-3.8 * s, 5.2 * s, -6.8 * s, 3.6 * s, -6.2 * s, 0.2 * s);
  c.bezierCurveTo(-5.6 * s, -3.0 * s, -2.4 * s, -5.2 * s, -0.8 * s, -5.6 * s);
  c.closePath();
}

function clamTexture(ctx: Ctx, s: number, seed: number) {
  const R = rng(seed);
  const um: Pt = [-0.8 * s, -5.6 * s];
  // growth rings (the clearest "clam" cue at small size)
  for (let k = 0.32; k < 1; k += 0.15) {
    ctx.save();
    ctx.translate(um[0], um[1]);
    ctx.scale(k, k);
    ctx.translate(-um[0], -um[1]);
    ctx.beginPath();
    clamPath(ctx, s);
    ctx.lineWidth = 0.5 / k;
    ctx.strokeStyle = '#7a5e42';
    ctx.globalAlpha = 0.75;
    ctx.stroke();
    ctx.restore();
  }
  // fine radial ribs crossing them: the verace's lattice
  for (let i = 0; i < 13; i++) {
    const a = 0.2 + (i / 12) * (Math.PI - 0.4);
    line(ctx, [um, [um[0] + Math.cos(a) * 11 * s, um[1] + Math.sin(a) * 11 * s]], 0.3, '#8c7458', false, 0.35);
  }
  // brown zig-zag markings
  for (let i = 0; i < 3; i++) {
    const a = 0.7 + i * 0.75 + R() * 0.2;
    const pts: Pt[] = [];
    for (let j = 1; j <= 4; j++) {
      const d = j * 2.3 * s;
      pts.push([um[0] + Math.cos(a + (j % 2 ? 0.12 : -0.12)) * d, um[1] + Math.sin(a + (j % 2 ? 0.12 : -0.12)) * d]);
    }
    line(ctx, pts, 0.9 * s, '#6e4a30', false, 0.55);
  }
}

ingr('vongole', (ctx) => {
  const clam = (x: number, y: number, a: number, s: number, seed: number) => rot(ctx, x, y, a, () => {
    const b = (c: Ctx) => clamPath(c, s);
    S(ctx, b, { fill: '#ddc9a6', ink: K, shadow: '#a88a66', shadowOffset: [-1.6, -1.8] });
    inside(ctx, b, () => clamTexture(ctx, s, seed));
    // the beak (umbo) and a wet shine
    S(ctx, (c) => ellipsePath(c, -0.8 * s, -4.6 * s, 1.1 * s, 0.8 * s), { fill: '#b89a74', ink: 0, shadow: 'none' });
    glint(ctx, -3.2 * s, -1.0 * s, 1.5 * s, 0.6 * s, -0.7, 0.8);
  });
  clam(3.8, -3.4, 0.4, 0.86, 2);
  // the verace's two separate siphons, peeking out from under the front clam
  for (const [pts, tip] of [
    [[[2.6, 3.6], [5.6, 3.8], [8.2, 2.8]], [8.4, 2.7]],
    [[[2.6, 5.0], [5.4, 6.0], [7.8, 6.6]], [8.0, 6.7]],
  ] as [Pt[], Pt][]) {
    inkLine2(ctx, pts, 1.3, '#f6ead8', 0.8, INK, true);
    S(ctx, (c) => circlePath(c, tip[0], tip[1], 0.75), { fill: '#9a6a52', ink: 0.6, shadow: 'none' });
  }
  clam(-2.0, 2.6, -0.25, 1.0, 5);
});

ingr('impasto', (ctx) => {
  // flour dusted on the board (no outline: it is a dusting, not a plate)
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  blobPath(ctx, 0, 6.6, 10.2, 2.8, 0.16, 12, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  speckle(ctx, 0, 6.6, 10.4, 3.0, 16, '#ffffff', 0.35, 44, 1);
  // two panetti side by side, soft and slightly slumped from proofing
  const ballPath = (c: Ctx, x: number, y: number, s: number) => {
    c.moveTo(x - 6.4 * s, y + 2.6 * s);
    c.bezierCurveTo(x - 7.6 * s, y - 2.8 * s, x - 3.8 * s, y - 6.4 * s, x, y - 6.4 * s);
    c.bezierCurveTo(x + 3.8 * s, y - 6.4 * s, x + 7.6 * s, y - 2.8 * s, x + 6.4 * s, y + 2.6 * s);
    c.bezierCurveTo(x + 5.2 * s, y + 5.0 * s, x - 5.2 * s, y + 5.0 * s, x - 6.4 * s, y + 2.6 * s);
    c.closePath();
  };
  const dough = (x: number, y: number, s: number, seed: number) => {
    const b = (c: Ctx) => ballPath(c, x, y, s);
    S(ctx, b, {
      fill: radial(ctx, x - 2.2 * s, y - 3.2 * s, 9 * s, [[0, '#fffbf0'], [0.5, '#f7e8c8'], [1, '#e6cc9a']]),
      ink: K,
      shadow: '#dcbc8a',
      shadowOffset: [-2.0 * s, -2.0 * s],
      gloss: [{ x: x - 2.8 * s, y: y - 3.4 * s, rx: 2.0 * s, ry: 1.0 * s, rot: -0.6, alpha: 0.5 }],
    });
    inside(ctx, b, () => {
      speckle(ctx, x - 0.4 * s, y - 3.8 * s, 4.4 * s, 1.8 * s, 14, '#ffffff', 0.34, seed, 0.95);
      for (const [dx, dy, r] of [[2.8, -1.4, 0.45], [4.0, 0.4, 0.32], [-3.8, 0.6, 0.36]] as [number, number, number][]) {
        ctx.beginPath();
        circlePath(ctx, x + dx * s, y + dy * s, r);
        ctx.lineWidth = 0.3;
        ctx.strokeStyle = '#c9a874';
        ctx.stroke();
      }
    });
  };
  dough(4.0, -1.8, 0.82, 47);
  dough(-2.2, 2.0, 1.02, 43);
});

ingr('mozzarella', (ctx) => {
  // a little pool of whey (soft, no rim: it is not a plate)
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, 0.4, 6.8, 9.8, 2.6);
  ctx.fillStyle = 'rgba(214,230,242,0.95)';
  ctx.fill();
  ctx.restore();
  line(ctx, [[-6.4, 7.4], [-2.0, 8.4], [3.4, 8.2]], 0.5, '#ffffff', true, 0.9);
  // the ball (fior di latte), cut open on the right to show its milky layers
  const bx = -1.0, by = -1.0, r = 8.0;
  const ball = (c: Ctx) => circlePath(c, bx, by, r);
  const cut = (c: Ctx) => ellipsePath(c, bx + 4.4, by + 0.6, 3.9, 6.9, -0.2);
  // the little pinched knot where it was torn off the curd (mozzatura)
  const knot = (c: Ctx) => ellipsePath(c, bx - 0.6, by - r - 0.1, 1.7, 1.1, -0.2);
  S(ctx, knot, { fill: '#f4f6f9', ink: K, shadow: '#cdd7e6', shadowOffset: [-0.6, -0.6] });
  S(ctx, ball, {
    fill: radial(ctx, bx - 2.6, by - 3.0, r * 1.5, [[0, '#ffffff'], [0.6, '#fbfaf5'], [1, '#e2e6ec']]),
    ink: K,
    shadow: '#cdd7e6',
    shadowOffset: [-2.6, -2.6],
    gloss: [{ x: bx - 3.4, y: by - 3.4, rx: 2.6, ry: 1.5, rot: -0.7, alpha: 1 }],
  });
  inside(ctx, ball, () => {
    // the cut face: wet, glossy, brighter than the skin, with a few milky beads
    S(ctx, cut, { fill: radial(ctx, bx + 3.6, by - 1.6, 7, [[0, '#ffffff'], [1, '#f1f5fa']]), ink: 0.9, shadow: '#e2e9f2', shadowOffset: [1.6, 1.4] });
    inside(ctx, cut, () => {
      glint(ctx, bx + 3.4, by - 2.6, 0.8, 2.0, 0.1, 0.95);
      for (const [x, y] of [[bx + 5.2, by + 2.2], [bx + 4.0, by + 4.2], [bx + 6.0, by - 1.0]] as Pt[]) {
        ctx.beginPath();
        circlePath(ctx, x, y, 0.45);
        ctx.lineWidth = 0.3;
        ctx.strokeStyle = '#c9d4e2';
        ctx.stroke();
      }
    });
  });
  // a crease under the knot, and a sheen
  line(ctx, [[bx - 2.0, by - r + 0.9], [bx - 0.6, by - r + 1.5], [bx + 0.8, by - r + 0.9]], 0.45, '#c4ccd8', true, 0.95);
  line(ctx, [[bx - 6.0, by + 1.6], [bx - 4.4, by + 4.6], [bx - 1.4, by + 6.0]], 0.8, '#ffffff', true, 0.9);
  // a drop of milk running down from the cut
  S(ctx, (c) => {
    c.moveTo(bx + 5.6, by + 6.0);
    c.bezierCurveTo(bx + 6.2, by + 7.2, bx + 7.0, by + 8.0, bx + 6.4, by + 8.8);
    c.bezierCurveTo(bx + 5.6, by + 9.4, bx + 4.6, by + 8.6, bx + 5.0, by + 7.6);
    c.quadraticCurveTo(bx + 5.3, by + 6.8, bx + 5.6, by + 6.0);
    c.closePath();
  }, { fill: '#ffffff', ink: 0.8, inkColor: '#5f7f98', shadow: '#dce6f0', shadowOffset: [-0.4, -0.4], gloss: [{ x: bx + 5.4, y: by + 8.0, rx: 0.3, ry: 0.4, alpha: 0.9 }] });
  // a basil leaf at its side
  basilLeaf(ctx, -5.0, 6.0, Math.PI + 0.4, 6.4, 3.8, 1.1);
});

