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
 * HUD. The HUD greys the ingredients still missing (grayscale, 40 % opacity, 17–22 px), so every
 * icon must also be told apart by its SHAPE alone from the others in the same recipe strip.
 * The details that make each one the specific Italian product:
 *   - pasta, four different shapes: dry spaghetti tied with baker's string; a nest of fresh egg
 *     fettuccine (a hollow in the middle) on two loose ribbons; fresh tagliatelle hung to dry over
 *     a rolling pin; a hank of thick square-cut tonnarelli folded in two, the cut ends splayed
 *   - San Marzano: long cylinder-plum, widest at mid-height, a blunt nib and a star calyx of thin
 *     curled sepals, with a half cut lengthwise showing its two seed chambers; passata in a tall,
 *     slim 700 g glass bottle (clear glass above the purée, steel twist cap) with a San Marzano at
 *     its foot; EVO oil in a tall square-shouldered bottle with a long steel pourer and an olive sprig
 *   - garlic with red (Sulmona-style) streaks and a loose clove; cupped glossy Genoese basil;
 *     serrated flat-leaf parsley; a tall, narrow tied bunch of DRIED oregano fanning to a flat top
 *   - guanciale: a pear-shaped cheek, mostly creamy fat with one rosy seam, black pepper only on
 *     the rind round its edge, a string through the hole it hung from; pancetta: a slice of
 *     pancetta arrotolata (deep-red lean, irregular spiral of fat, dark rind, cracked pepper at the
 *     heart) with three cubes — never a bacon rasher
 *   - Pecorino Romano: a TALL wedge (the wheels are tall drums), chalk-white paste, a thick black
 *     rind with the basket-weave print; Parmigiano Reggiano: a LOW, wide wedge, grainy gold paste
 *     with crystals, a golden rind with the pin-dot print
 *   - deep-orange yolks, one domed in its half shell and one in front; a wooden pepper mill with
 *     peppercorns; a tall block of butter on its parchment with a curl; a steel ladle (round bowl,
 *     long steep handle) of cloudy pasta water with a spaghetto in it
 *   - a slender green bottle of dry white beside a stemmed glass of straw-coloured wine; coarse
 *     mince on butcher paper; a carrot and a celery stalk crossed behind a heap of onion, carrot
 *     and celery dice; a heap of long ivory pine nuts with a small cone; vongole veraci, one open
 *     on its hinge (pale violet-stained inside, the clam and its short siphons) and one closed (the
 *     decussate lattice); one big proofed panetto dusted with flour and dimpled by a fingertip;
 *     one glossy fior di latte with its pulled tip in a pool of whey, a slice and a basil leaf
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
    const n = 12;
    const prof = (y: number, x: number) => y * (0.42 + 0.58 * Math.min(1, Math.abs(x) / L));
    const rods = Array.from({ length: n }, (_, i) => ({ y: (i - (n - 1) / 2) * 0.8, l0: L - R() * 1.6, l1: L - R() * 1.6 }));
    const pts = (r: { y: number; l0: number; l1: number }): Pt[] => [
      [-r.l0, prof(r.y, r.l0)], [-L * 0.55, prof(r.y, L * 0.55)], [0, prof(r.y, 0)], [L * 0.55, prof(r.y, L * 0.55)], [r.l1, prof(r.y, r.l1)],
    ];
    // one silhouette for the whole bundle
    for (const r of rods) line(ctx, pts(r), 1.2 + K * 2, INK, true);
    // rods, back (top) to front (bottom): each with a darker edge so they read as separate strands
    rods.forEach((r, i) => {
      const lit = 1 - i / (n - 1);
      line(ctx, pts(r), 1.2, '#c9952f', true);
      line(ctx, pts(r), 0.7, i % 2 ? '#f0cf72' : '#f7dd8c', true);
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
  /** size of the hollow in the middle of the top (0..1 of the radius) */
  hollow?: number;
  dust?: string; dustN?: number; dustR?: number;
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
 * ribbon around a hollow, with bands of ribbon running round its side.
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
    pts.forEach((p, i) => { if (lit[i] > 0.2) run.push(p); else flush(o.colL, w * 0.32, [-w * 0.18, -w * 0.24], 0.95); });
    flush(o.colL, w * 0.32, [-w * 0.18, -w * 0.24], 0.95);
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
  const hol = o.hollow ?? 0.2;
  ellipsePath(ctx, 0.2, ty + 0.2, rx * hol, ry * hol);
  ctx.fillStyle = shade(o.gap, 0.3);
  ctx.fill();
  ctx.restore();
  type Piece = { pts: Pt[]; lit: number[]; key: number };
  const pieces: Piece[] = [];
  for (let i = 0; i < o.coils; i++) {
    const k0 = Math.max(0.3, hol + 0.16);
    const k = k0 + (1.02 - k0) * (i / Math.max(1, o.coils - 1));
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

  // 5. flour or semolina
  if (o.dust) {
    inside(ctx, body, () => speckle(ctx, -1.2, ty, rx * 0.85, ry * 0.85, o.dustN ?? 22, o.dust!, o.dustR ?? 0.3, o.seed + 3, 0.9));
  }
  glint(ctx, -rx * 0.5, ty - ry * 0.45, 1.8, 0.7, -0.35, 0.55);
}

/** A flat ribbon of fresh pasta that twists along its length (lit and shaded faces alternate). */
function flatRibbon(ctx: Ctx, pts: Pt[], w: number, col: string, colD: string, colL: string, ink = 0.9, twist = 9) {
  const P = sample(pts, 40);
  strokePts(ctx, extend(P, ink * 0.7), w + ink * 2, INK);
  strokePts(ctx, P, w, col);
  let run: Pt[] = [];
  const flush = (c: string, ww: number, off: Pt = [0, 0], a = 1) => { if (run.length > 1) strokePts(ctx, run.map(([x, y]) => [x + off[0], y + off[1]] as Pt), ww, c, 'butt', a); run = []; };
  P.forEach((p, i) => { if (Math.floor(i / twist) % 2 === 1) run.push(p); else flush(colD, w); });
  flush(colD, w);
  P.forEach((p, i) => { if (Math.floor(i / twist) % 2 === 0 && i % twist > 1 && i % twist < twist - 1) run.push(p); else flush(colL, w * 0.28, [-w * 0.12, -w * 0.22], 0.95); });
  flush(colL, w * 0.28, [-w * 0.12, -w * 0.22], 0.95);
}
ingr('fettuccine', (ctx) => {
  // a nest of fresh egg fettuccine (a few bold, flat ribbons) sitting on two loose ribbons
  ctx.translate(0, -2.6);
  nest(ctx, {
    col: '#ffe07e', colD: '#e6a63e', colL: '#fffbe0', gap: '#4e2a08', edge: '#4e2a08',
    w: 2.6, coils: 3, bands: 2, seed: 21, tangle: 0.45, rx: 7.8, ry: 5.4, h: 3.4, hollow: 0.32, dust: '#fffdf4', dustN: 18, dustR: 0.24,
  });
  flatRibbon(ctx, [[3.4, 4.6], [6.6, 5.4], [8.4, 3.6], [10.6, 4.4], [11.4, 7.2], [13.6, 7.4]], 2.2, '#ffe07e', '#e6a63e', '#fffbe0', 0.9, 7);
  flatRibbon(ctx, [[-2.0, 5.6], [-5.4, 7.2], [-8.4, 6.0], [-10.6, 7.6], [-13.0, 7.0]], 2.2, '#ffe07e', '#e6a63e', '#fffbe0', 0.9, 7);
});

ingr('tagliatelle', (ctx) => {
  // fresh tagliatelle hung to dry over a wooden rolling pin (mattarello), the Bologna way
  const R = rng(41);
  const pin = (c: Ctx) => roundRectPath(c, -11.0, -8.6, 22.0, 2.6, 1.3);
  const col = '#fbcb4e', colD = '#d98f26', colL = '#fff0b8';
  const ribbons = [-7.6, -4.8, -2.0, 0.8, 3.6, 6.4].map((x, i) => ({ x, len: 12.6 + R() * 4.6 - (i % 2) * 1.8, ph: R() * 6, sw: 1.3 + R() * 0.7 }));
  const pts = (r: { x: number; len: number; ph: number; sw: number }, back: boolean): Pt[] => {
    const out: Pt[] = [];
    const y0 = -7.3;
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const y = y0 + t * (back ? r.len * 0.8 : r.len);
      out.push([r.x + (back ? 1.1 : 0) + Math.sin(t * 4.6 + r.ph) * r.sw * Math.min(1, t * 2.2) + (back ? t * 0.8 : -t * 0.4), y]);
    }
    return out;
  };
  const W = 2.3;
  // back halves (hanging behind the pin), darker
  for (const r of ribbons) {
    const p = pts(r, true);
    strokePts(ctx, extend(p, 0.8), W + 1.6, INK);
    strokePts(ctx, p, W, colD);
    strokePts(ctx, p.map(([x, y]) => [x + 0.5, y] as Pt), W * 0.4, shade(colD, 0.15), 'butt', 0.8);
  }
  // the pin
  S(ctx, pin, { fill: '#c98a4e', ink: K, shadow: '#8f5530', shadowOffset: [0, -1.0], gloss: [{ x: -4, y: -8.0, rx: 6, ry: 0.35, alpha: 0.6, color: '#ffd9a8' }] });
  line(ctx, [[-8.6, -7.4], [8.6, -7.4]], 0.3, '#9a5f2e', false, 0.45);
  // front halves, folded over the pin and falling in waves
  for (const r of ribbons) {
    const p = pts(r, false);
    const fold: Pt[] = [[r.x + 0.9, -8.9], [r.x - 0.2, -8.6], ...p];
    strokePts(ctx, extend(fold, 0.8), W + 1.6, INK);
    strokePts(ctx, fold, W, col);
    strokePts(ctx, fold.map(([x, y]) => [x + W * 0.28, y] as Pt), W * 0.36, colD, 'butt', 0.85);
    strokePts(ctx, fold.map(([x, y]) => [x - W * 0.26, y] as Pt).slice(1, 8), W * 0.22, colL, 'round', 0.9);
  }
  // flour on the ribbons
  speckle(ctx, -0.6, 0.0, 8.4, 5.0, 16, '#fffaf0', 0.24, 42, 0.9);
});

ingr('tonnarelli', (ctx) => {
  // a hank of fresh tonnarelli folded in two: thick, square-cut, deep egg-yellow strands, the cut ends splayed
  const col = '#f7bf2a', colD = '#c47c16', colL = '#fff0a0';
  const R = rng(53);
  const n = 4, w = 1.65, gap = 1.6;
  const fx = -5.2, fy = 0; // centre of the fold
  for (let i = 0; i < n; i++) {
    const r = 6.4 - i * gap; // outer strand first
    const pts: Pt[] = [];
    const endT = 9.0 + R() * 1.8;
    const endB = 8.4 + R() * 2.2;
    // upper arm, from its cut end back to the fold
    pts.push([endT, -r - 2.6 + i * 0.5 + (R() - 0.5) * 0.6], [endT * 0.45, -r - 1.0 + i * 0.25], [fx + 1.2, -r]);
    // round the fold
    for (let j = 1; j < 8; j++) {
      const a = -Math.PI / 2 - (j / 8) * Math.PI;
      pts.push([fx + Math.cos(a) * r * 0.82, fy + Math.sin(a) * r]);
    }
    // lower arm, out to its cut end
    pts.push([fx + 1.2, r], [endB * 0.45, r + 1.0 - i * 0.25], [endB, r + 2.4 - i * 0.5 + (R() - 0.5) * 0.6]);
    const P = sample(pts, 40);
    strokePts(ctx, extend(P, 0.8), w + 1.8, INK);
    strokePts(ctx, P, w, colD);
    strokePts(ctx, P.map(([x, y]) => [x - w * 0.12, y - w * 0.18] as Pt), w * 0.6, col);
    strokePts(ctx, P.map(([x, y]) => [x - w * 0.24, y - w * 0.3] as Pt).slice(2, -2), w * 0.18, colL, 'round', 0.85);
    // the square cut faces at both ends
    for (const [z, y] of [[P[0], P[1]], [P[P.length - 1], P[P.length - 2]]] as [Pt, Pt][]) {
      const a = Math.atan2(z[1] - y[1], z[0] - y[0]);
      rot(ctx, z[0], z[1], a, () => S(ctx, (c) => roundRectPath(c, -w * 0.4, -w * 0.5, w * 0.8, w, w * 0.1), { fill: '#ffe07a', ink: 0.4, shadow: 'none' }));
    }
  }
  // semolina dust
  speckle(ctx, 0, 0, 9.0, 7.0, 30, '#fff6d6', 0.26, 54, 0.95);
});

// ===========================================================================
// TOMATO, OIL, GARLIC, HERBS
// ===========================================================================

/** A San Marzano lying along +y (top at -L): long, cylinder-plum, widest at mid-height, blunt nib at the blossom end. */
function sanMarzanoPath(c: Ctx, w: number, L: number) {
  c.moveTo(0, -L * 0.98);
  c.bezierCurveTo(w * 0.78, -L * 1.0, w, -L * 0.58, w, -L * 0.05);
  c.bezierCurveTo(w, L * 0.5, w * 0.74, L * 0.86, w * 0.2, L * 0.96);
  c.quadraticCurveTo(0, L * 1.06, -w * 0.2, L * 0.96);
  c.bezierCurveTo(-w * 0.74, L * 0.86, -w, L * 0.5, -w, -L * 0.05);
  c.bezierCurveTo(-w, -L * 0.58, -w * 0.78, -L * 1.0, 0, -L * 0.98);
  c.closePath();
}

/** A star calyx of thin, curled sepals with a short stem, centred at (x,y). */
function calyxStar(ctx: Ctx, x: number, y: number, r: number, ink = 0.8, n = 6, seed = 5) {
  const R = rng(seed);
  S(ctx, (c) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + (R() - 0.5) * 0.3;
      const l = r * (0.85 + R() * 0.3);
      const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l * 0.62;
      const cx = x + Math.cos(a + 0.5) * l * 0.6, cy = y + Math.sin(a + 0.5) * l * 0.4;
      const nx = -Math.sin(a) * r * 0.16, ny = Math.cos(a) * r * 0.1;
      c.moveTo(x + nx, y + ny);
      c.quadraticCurveTo(cx + nx, cy + ny, ex, ey);
      c.quadraticCurveTo(cx - nx, cy - ny, x - nx, y - ny);
      c.closePath();
    }
    circlePath(c, x, y, r * 0.3);
  }, { fill: '#3f9a36', ink, shadow: '#226b30', shadowOffset: [-0.3, -0.4] });
}

ingr('pomodoro', (ctx) => {
  // the whole San Marzano, standing a little tilted
  rot(ctx, -2.2, -0.6, 0.38, () => {
    const w = 5.0, L = 10.2;
    const body = (c: Ctx) => sanMarzanoPath(c, w, L);
    S(ctx, body, {
      fill: radial(ctx, -1.8, -3.2, 12, [[0, '#ff7559'], [0.45, '#e8352a'], [1, '#b01f24']]),
      ink: K,
      shadow: '#991a22',
      shadowOffset: [-2.0, -1.6],
      gloss: [
        { x: -2.4, y: -3.6, rx: 1.0, ry: 3.6, rot: 0.06, alpha: 0.85 },
        { x: -2.9, y: 4.0, rx: 0.45, ry: 1.3, rot: 0.1, alpha: 0.5 },
      ],
    });
    // two long shallow lobes
    inside(ctx, body, () => line(ctx, [[1.0, -9.4], [2.0, -2.0], [1.6, 5.0], [0.4, 9.6]], 0.55, '#a01a22', true, 0.55));
    calyxStar(ctx, 0, -L * 0.92, 3.6, 0.8, 6, 5);
    tube(ctx, [[0, -L * 0.95], [0.3, -L * 1.1], [1.2, -L * 1.2]], 0.9, '#3d9636', 0.7, true, '#9be07a', 0.7);
  });
  // a half, cut lengthwise, lying in front: red wall, two seed chambers in golden gel
  rot(ctx, 4.4, 5.0, -1.05, () => {
    const w = 3.6, L = 6.4;
    const half = (c: Ctx) => sanMarzanoPath(c, w, L);
    S(ctx, half, { fill: '#d92b26', ink: K, shadow: '#9c1a22', shadowOffset: [-1.0, -0.8] });
    const flesh = (c: Ctx) => sanMarzanoPath(c, w - 0.85, L - 0.85);
    S(ctx, flesh, { fill: '#f4604a', ink: 0, shadow: '#e4423a', shadowOffset: [0.6, 0.8] });
    for (const sx of [-1, 1]) {
      const cham = (c: Ctx) => ellipsePath(c, sx * 1.15, 0.6, 0.95, L * 0.62);
      S(ctx, cham, { fill: '#f7c64a', ink: 0.35, inkColor: '#b8332a', shadow: '#e59a30', shadowOffset: [sx * 0.3, 0.4] });
      for (let k = -2; k <= 2; k++) S(ctx, (c) => ellipsePath(c, sx * 1.15 + (k % 2 ? 0.25 : -0.25), 0.6 + k * 1.3, 0.42, 0.3), { fill: '#fff4c8', ink: 0.25, inkColor: '#a86a1c', shadow: 'none' });
    }
    // the core running down the middle
    line(ctx, [[0, -L * 0.75], [0, L * 0.75]], 0.6, '#ffb09a', false, 0.9);
    glint(ctx, -w * 0.62, -L * 0.3, 0.4, 1.3, 0.05, 0.85);
  });
});

ingr('passata', (ctx) => {
  // a tall, slim 700 g glass bottle: clear glass at the top, deep brick-red purée below
  rot(ctx, 2.0, 0, 0.06, () => {
    const hw = 3.7, nw = 2.1;
    const bottle = (c: Ctx) => {
      c.moveTo(-nw, -8.4);
      c.lineTo(-nw, -6.6);
      c.bezierCurveTo(-nw, -5.2, -hw, -5.0, -hw, -3.2);
      c.lineTo(-hw, 9.6);
      c.quadraticCurveTo(-hw, 10.8, -hw + 1.2, 10.8);
      c.lineTo(hw - 1.2, 10.8);
      c.quadraticCurveTo(hw, 10.8, hw, 9.6);
      c.lineTo(hw, -3.2);
      c.bezierCurveTo(hw, -5.0, nw, -5.2, nw, -6.6);
      c.lineTo(nw, -8.4);
      c.closePath();
    };
    S(ctx, bottle, { fill: '#e6f0ee', ink: K, shadow: 'none' });
    inside(ctx, bottle, () => {
      // glass tint at the shoulder
      ctx.fillStyle = '#cfdedd';
      ctx.fillRect(1.2, -9, 4, 8);
      // the purée, filled to just under the shoulder
      ctx.fillStyle = linear(ctx, -hw, 0, hw, 0, [[0, '#e0462e'], [0.4, '#bd2a1e'], [1, '#7c1418']]);
      ctx.fillRect(-5, -2.6, 10, 14);
      ctx.beginPath();
      ellipsePath(ctx, 0, -2.6, hw, 0.55);
      ctx.fillStyle = '#e8573a';
      ctx.fill();
      // glass: one long vertical highlight band and a thin one on the right
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.beginPath();
      roundRectPath(ctx, -2.9, -4.4, 1.05, 14.2, 0.5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      roundRectPath(ctx, 2.5, -2.0, 0.5, 11.4, 0.25);
      ctx.fill();
      line(ctx, [[-1.0, -7.8], [-1.0, -6.0]], 0.55, '#ffffff', false, 0.9);
    });
    // label: an elongated San Marzano and a basil leaf, no text
    const label = (c: Ctx) => roundRectPath(c, -hw - 0.1, 1.6, hw * 2 + 0.2, 5.6, 0.3);
    inside(ctx, bottle, () => S(ctx, label, { fill: '#fbf1d8', ink: 0.65, shadow: '#e3d0a8', shadowOffset: [-1.4, -0.5] }));
    rot(ctx, -0.3, 4.4, 1.25, () => {
      S(ctx, (c) => sanMarzanoPath(c, 1.05, 2.3), { fill: '#e2352a', ink: 0.5, shadow: '#a81f24', shadowOffset: [-0.4, -0.3] });
    });
    rot(ctx, 1.9, 3.3, -0.5, () => S(ctx, (c) => leafPath(c, 2.2, 1.3, 0.45), { fill: '#46a83c', ink: 0.4, shadow: 'none' }));
    // steel twist-off cap
    const cap = (c: Ctx) => roundRectPath(c, -2.6, -10.8, 5.2, 2.9, 0.7);
    S(ctx, cap, { fill: linear(ctx, -2.6, 0, 2.6, 0, [[0, '#ffffff'], [0.35, '#d5dbe4'], [1, '#8592a6']]), ink: K, shadow: 'none' });
    for (let i = -2; i <= 2; i++) line(ctx, [[i * 0.95, -10.4], [i * 0.95, -8.3]], 0.3, '#6f7c90', false, 0.6);
  });
  // a fresh San Marzano at its foot
  rot(ctx, -5.4, 7.6, -1.42, () => {
    S(ctx, (c) => sanMarzanoPath(c, 2.6, 5.0), {
      fill: radial(ctx, -0.8, -1.6, 6, [[0, '#ff7559'], [0.5, '#e8352a'], [1, '#b01f24']]),
      ink: 1.2,
      shadow: '#991a22',
      shadowOffset: [-1.0, -0.8],
      gloss: [{ x: -1.2, y: -1.4, rx: 0.5, ry: 1.8, alpha: 0.85 }],
    });
    calyxStar(ctx, 0, -4.6, 2.0, 0.6, 5, 9);
  });
});

ingr('olio', (ctx) => {
  // a tall, square-shouldered (dorica) bottle of green-gold extra-virgin oil with a steel pourer
  rot(ctx, -1.6, 0, -0.08, () => {
    const hw = 4.4, nw = 1.45, sx = 1.7;
    const bottle = (c: Ctx) => {
      c.moveTo(-nw, -7.0);
      c.lineTo(-nw, -5.8);
      c.lineTo(-hw + 0.6, -3.9);
      c.quadraticCurveTo(-hw, -3.7, -hw, -3.0);
      c.lineTo(-hw, 9.8);
      c.quadraticCurveTo(-hw, 10.8, -hw + 1.0, 10.8);
      c.lineTo(hw - 1.0, 10.8);
      c.quadraticCurveTo(hw, 10.8, hw, 9.8);
      c.lineTo(hw, -3.0);
      c.quadraticCurveTo(hw, -3.7, hw - 0.6, -3.9);
      c.lineTo(nw, -5.8);
      c.lineTo(nw, -7.0);
      c.closePath();
    };
    // the long thin spout (behind the collar)
    tube(ctx, [[0, -8.6], [1.6, -10.0], [4.6, -11.0], [7.4, -11.2]], 0.9, '#d5dce6', 0.95, false, '#ffffff', 0.9);
    S(ctx, bottle, { fill: '#eaf2d8', ink: K, shadow: 'none' });
    inside(ctx, bottle, () => {
      // oil up to the shoulder: lit front face, darker side face
      ctx.fillStyle = linear(ctx, -hw, 0, sx, 0, [[0, '#f4e466'], [1, '#cdbb30']]);
      ctx.fillRect(-6, -3.2, 6 + sx, 15);
      ctx.fillStyle = linear(ctx, sx, 0, hw, 0, [[0, '#9aa024'], [1, '#68761a']]);
      ctx.fillRect(sx, -3.2, 4, 15);
      ctx.beginPath();
      ellipsePath(ctx, 0, -3.2, hw, 0.5);
      ctx.fillStyle = '#f7ec96';
      ctx.fill();
      // the square section: one vertical edge, and glass shine
      line(ctx, [[sx, -3.8], [sx, 10.8]], 0.45, '#4f5a10', false, 0.55);
      line(ctx, [[sx + 0.45, -3.4], [sx + 0.45, 10.4]], 0.35, '#fff6b0', false, 0.6);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      roundRectPath(ctx, -3.5, -2.6, 1.15, 12.4, 0.55);
      ctx.fill();
      line(ctx, [[-0.6, -6.6], [-0.6, -5.2]], 0.5, '#ffffff', false, 0.9);
    });
    // a plain label with an olive mark (no text)
    inside(ctx, bottle, () => S(ctx, (c) => roundRectPath(c, -hw - 0.2, 2.6, hw * 2 + 0.4, 4.8, 0.3), { fill: '#fbf1d8', ink: 0.6, shadow: '#e3d0a8', shadowOffset: [-1.4, -0.4] }));
    S(ctx, (c) => ellipsePath(c, -1.2, 5.1, 1.15, 0.85, -0.3), { fill: '#7fa437', ink: 0.45, shadow: 'none' });
    rot(ctx, -0.3, 4.6, -0.6, () => S(ctx, (c) => leafPath(c, 2.4, 0.9, 0.45), { fill: '#5d7e3a', ink: 0.35, shadow: 'none' }));
    // steel pourer collar
    S(ctx, (c) => roundRectPath(c, -2.2, -8.8, 4.4, 2.2, 0.6), { fill: '#dfe5ee', ink: 1.0, shadow: '#99a6b9', shadowOffset: [-0.6, -0.6] });
    // a golden drop at the spout
    S(ctx, (c) => { c.moveTo(7.6, -10.6); c.quadraticCurveTo(8.7, -8.8, 7.9, -8.2); c.quadraticCurveTo(6.9, -8.6, 7.6, -10.6); c.closePath(); }, { fill: '#e8d44a', ink: 0.6, shadow: 'none', gloss: [{ x: 7.6, y: -8.9, rx: 0.3, ry: 0.3, alpha: 0.9 }] });
  });
  // olive sprig at its foot: a silvery leaf and two olives
  rot(ctx, 8.6, 5.6, 2.6, () => {
    S(ctx, (c) => leafPath(c, 5.0, 1.7, 0.45), { fill: '#7e9b52', ink: 0.85, shadow: '#55703a', shadowOffset: [-0.5, -0.5] });
    line(ctx, [[0.4, 0], [4.2, 0]], 0.3, '#d5e3b8', false, 0.9);
  });
  S(ctx, (c) => ellipsePath(c, 4.4, 9.2, 1.95, 1.5, -0.3), { fill: '#8fb33d', ink: 1.0, shadow: '#5f8c25', shadowOffset: [-0.7, -0.7], gloss: [{ x: 3.8, y: 8.6, rx: 0.6, ry: 0.38, rot: -0.3, alpha: 0.9 }] });
  S(ctx, (c) => ellipsePath(c, 7.4, 8.4, 1.8, 1.4, -0.5), { fill: '#4a2a42', ink: 1.0, shadow: '#2a1428', shadowOffset: [-0.6, -0.6], gloss: [{ x: 6.8, y: 7.9, rx: 0.55, ry: 0.35, rot: -0.5, alpha: 0.85 }] });
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
  // a tall, narrow tied bunch of DRIED oregano: straight stems fanning out to a flat top of papery flower heads
  const R = rng(91);
  const base: Pt = [0, 6.6];
  const tips: Pt[] = [[-6.0, -8.6], [-3.8, -10.0], [-1.2, -10.6], [1.4, -10.4], [3.8, -10.0], [6.0, -8.8]];
  const stemTip = (t: Pt, f: number): Pt => [base[0] + (t[0] - base[0]) * f, base[1] + (t[1] - base[1]) * f];
  // little leaves in pairs on the upper half of each stem
  const leaves: { x: number; y: number; a: number; s: number }[] = [];
  for (const t of tips) {
    const a = Math.atan2(t[1] - base[1], t[0] - base[0]);
    for (const f of [0.4, 0.54, 0.68, 0.82]) {
      const [x, y] = stemTip(t, f);
      for (const side of [-1, 1]) leaves.push({ x, y, a: a + side * (0.85 + R() * 0.3), s: 1.2 - f * 0.4 });
    }
  }
  const stemB = (c: Ctx) => { for (const t of tips) taperPath(c, [base, stemTip(t, 0.5), t], (u) => 0.85 - u * 0.3, 8); };
  const leafB = (c: Ctx) => {
    for (const L of leaves) {
      c.save();
      c.translate(L.x, L.y);
      c.rotate(L.a);
      leafPath(c, 2.5 * L.s, 1.75 * L.s, 0.5);
      c.restore();
    }
  };
  // dried flower heads at the tips: small oval clusters of papery bracts
  const heads = tips.map((t) => Array.from({ length: 3 }, (_, k): [number, number, number] => [t[0] + (k - 1) * 0.6, t[1] + (k === 1 ? -0.4 : 0.2), 0.7 + R() * 0.15]));
  const headB = (c: Ctx) => { for (const h of heads) for (const [x, y, r] of h) ellipsePath(c, x, y, r * 0.8, r); };
  G(ctx, [
    { build: stemB, style: { fill: '#a08a58', shadow: 'none' } },
    { build: leafB, style: { fill: '#8fa454', shadow: '#647a38', shadowOffset: [-0.5, -0.55] } },
    { build: headB, style: { fill: '#c9c486', shadow: '#99945a', shadowOffset: [-0.4, -0.45] } },
  ], 1.0);
  for (const L of leaves) line(ctx, [[L.x, L.y], [L.x + Math.cos(L.a) * 1.5 * L.s, L.y + Math.sin(L.a) * 1.5 * L.s]], 0.25, '#c8dc90', false, 0.8);
  for (const h of heads) {
    const [x, y] = h[1];
    speckle(ctx, x, y, 1.4, 1.1, 5, '#d99ab2', 0.28, Math.floor(R() * 100), 0.95);
  }
  // cut stems under the tie
  for (let i = -2; i <= 2; i++) inkLine2(ctx, [[i * 0.4, 7.0], [i * 0.7, 10.4]], 0.7, '#a08a58', 0.6, INK, false);
  // twine tie with a bow
  S(ctx, (c) => roundRectPath(c, -1.9, 5.6, 3.8, 2.3, 0.8), { fill: '#d9b47a', ink: 0.9, shadow: '#a87c42', shadowOffset: [-0.5, -0.5] });
  line(ctx, [[-1.7, 6.7], [1.7, 6.9]], 0.35, '#8a6230', false, 0.8);
  S(ctx, (c) => { ellipsePath(c, 2.9, 5.8, 1.4, 0.8, -0.5); ellipsePath(c, 3.1, 7.8, 1.3, 0.7, 0.5); }, { fill: '#d9b47a', ink: 0.7, shadow: 'none' });
});

// ===========================================================================
// MEAT, EGGS, CHEESE, PEPPER, BUTTER
// ===========================================================================

ingr('guanciale', (ctx) => {
  // a whole cured cheek: a pear-shaped slab, mostly creamy fat with one thin rosy seam of lean,
  // the black-pepper rind only round its edge, a string through the hole it hung from
  ctx.rotate(0.22);
  const outline: Pt[] = [[-0.6, -10.2], [2.6, -8.0], [5.6, -4.6], [9.4, 0.6], [10.0, 5.4], [6.4, 8.6], [-1.0, 8.8], [-7.6, 7.2], [-9.6, 3.4], [-7.2, -1.6], [-3.6, -7.0]];
  const face = (c: Ctx) => smoothPath(c, outline, true, 0.5);
  const side = (c: Ctx) => smoothPath(c, outline.map(([x, y]) => [x + 0.9, y + 1.7] as Pt), true, 0.5);
  const inset = (c: Ctx) => smoothPath(c, outline.map(([x, y]) => [0.6 + (x - 0.6) * 0.8, 1.4 + (y - 1.4) * 0.8] as Pt), true, 0.5);
  G(ctx, [
    { build: side, style: { fill: '#8c5a36', shadow: 'none' } },
    { build: face, style: { fill: '#fcefdc', shadow: '#efd6b8', shadowOffset: [-1.8, -1.8] } },
  ], K);
  // the peppered rind on the slab's thickness
  inside(ctx, side, () => {
    ctx.save();
    ctx.beginPath();
    face(ctx);
    ctx.rect(-20, -20, 40, 40);
    ctx.clip('evenodd');
    speckle(ctx, 1, 2, 11, 10, 90, '#1e1614', 0.36, 16, 0.95);
    ctx.restore();
  });
  // one rosy seam of lean through the fat
  inside(ctx, face, () => {
    const seam: Pt[] = [[-9.8, 2.6], [-5.0, 1.6], [-0.4, 3.2], [4.6, 1.8], [10.4, 3.0]];
    line(ctx, seam, 2.2, '#d9606c', true);
    line(ctx, seam.map(([x, y]) => [x, y - 0.6] as Pt), 0.6, '#f4a6a6', true, 0.95);
    line(ctx, [[-7.0, 5.8], [-2.0, 6.6], [3.0, 5.6], [8.0, 6.4]], 0.8, '#e48a90', true, 0.75);
    line(ctx, [[-4.0, -3.2], [-0.6, -2.4], [3.4, -3.0]], 0.45, '#eaa0a0', true, 0.55);
    // the rind round the edge: a dark band dusted with cracked pepper
    ctx.save();
    ctx.beginPath();
    face(ctx);
    inset(ctx);
    ctx.clip('evenodd');
    ctx.fillStyle = '#a8683a';
    ctx.fillRect(-20, -20, 40, 40);
    speckle(ctx, 0.6, 0, 10.5, 10.5, 170, '#1e1614', 0.4, 17, 0.95);
    speckle(ctx, 0.6, 0, 10.5, 10.5, 16, '#c0442a', 0.3, 18, 0.9);
    ctx.restore();
    ctx.beginPath();
    inset(ctx);
    ctx.lineWidth = 0.4;
    ctx.strokeStyle = '#7a4a2a';
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  glint(ctx, -3.0, -1.6, 2.4, 0.9, -0.8, 0.8);
  glint(ctx, 2.2, 5.0, 1.2, 0.4, -0.2, 0.55);
  // the hole near the tip, and a loop of string
  S(ctx, (c) => ellipsePath(c, 0.6, -6.6, 0.8, 0.65), { fill: '#4a2a1c', ink: 0.5, shadow: 'none' });
  inkLine2(ctx, [[0.6, -6.6], [-0.6, -9.0], [-2.2, -11.4], [-3.4, -10.6], [-2.6, -8.4], [-0.6, -7.0]], 0.55, '#efd7a6', 0.5);
});

ingr('pancetta', (ctx) => {
  // a thick slice of rolled pancetta (arrotolata): deep-red lean, an irregular, marbled spiral of
  // fat, a thin dark rind round it, cracked pepper at the heart; three cubes in front
  const cx = -1.6, cy = -1.4;
  const R = rng(61);
  const wob = Array.from({ length: 7 }, () => R());
  const rad = (a: number) => 1 + (wob[0] - 0.5) * 0.12 * Math.sin(a * 2 + wob[1] * 6) + (wob[2] - 0.5) * 0.1 * Math.sin(a * 3 + wob[3] * 6);
  const disc = (dx: number, dy: number, k = 1) => (c: Ctx) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      pts.push([cx + dx + Math.cos(a) * 8.4 * k * rad(a), cy + dy + Math.sin(a) * 7.8 * k * rad(a)]);
    }
    smoothPath(c, pts, true, 0.5);
  };
  const face = disc(0, 0), side = disc(0.8, 1.5);
  G(ctx, [
    { build: side, style: { fill: '#9a3a3c', shadow: 'none' } },
    { build: face, style: { fill: '#b8323e', shadow: 'none' } },
  ], K);
  // layers on the slice's thickness
  inside(ctx, side, () => {
    for (let i = 0; i < 10; i++) {
      const a = 0.1 + i * 0.3;
      line(ctx, [[cx + Math.cos(a) * 8.0, cy + Math.sin(a) * 7.4], [cx + 0.8 + Math.cos(a) * 8.6, cy + 1.5 + Math.sin(a) * 8.0]], 0.7, i % 3 ? '#f3dccb' : '#b8484e', false, 0.85);
  }
  });
  inside(ctx, face, () => {
    // the spiral of fat: irregular width, wobbling, with marbled flecks
    const sp: Pt[] = [];
    for (let t = 1.4; t < 13.2; t += 0.14) {
      const r = t * 0.6 * (1 + Math.sin(t * 2.3 + 0.6) * 0.12 + Math.sin(t * 0.9) * 0.06);
      sp.push([cx + Math.cos(t) * r * 1.05, cy + Math.sin(t) * r]);
    }
    for (let i = 0; i < sp.length - 1; i++) {
      const w = 0.55 + 1.5 * Math.pow(0.5 + 0.5 * Math.sin(i * 0.19 + 1.0), 1.6);
      line(ctx, [sp[i], sp[i + 1]], w, '#f4e2ce', false);
    }
    line(ctx, sp.map(([x, y]) => [x + 0.35, y + 0.35] as Pt), 0.35, '#e0b4a0', true, 0.55);
    for (let i = 0; i < 14; i++) {
      const a = R() * Math.PI * 2, r = 1.8 + R() * 5.6;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.93;
      line(ctx, [[x, y], [x + Math.cos(a + 1.6) * (0.6 + R()), y + Math.sin(a + 1.6) * (0.6 + R())]], 0.3 + R() * 0.3, '#eec2b2', false, 0.75);
    }
    // lean shading toward the lower right
    crescent(ctx, face, '#7a1824', 0.35, [-2.0, -2.0]);
    // thin dark rind ring
    ctx.beginPath();
    disc(0, 0, 0.965)(ctx);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = '#7a2e24';
    ctx.stroke();
  });
  // cracked black pepper at the heart
  speckle(ctx, cx + 0.2, cy, 1.6, 1.5, 12, '#1e1614', 0.32, 62, 1);
  glint(ctx, cx - 4.2, cy - 4.0, 1.8, 0.7, -0.7, 0.75);
  // three cubes in front
  const cube = (x: number, y: number, s: number) => {
    dice(ctx, x, y, s, '#c8404a', 0.8);
    const a = s * 0.5;
    line(ctx, [[x - a, y + a * 0.05], [x, y + a * 0.55], [x + a, y + a * 0.05]], 0.75, '#f7e6d6', false);
    line(ctx, [[x - a * 0.5, y - a * 0.75], [x + a * 0.5, y - a * 0.25]], 0.55, '#f7e6d6', false, 0.9);
  };
  cube(6.4, 6.6, 4.0);
  cube(9.4, 3.4, 3.4);
  cube(2.6, 8.8, 3.4);
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

/** A glossy deep-orange egg yolk (a slightly flattened dome). */
function yolk(ctx: Ctx, x: number, y: number, r: number, flat = 1) {
  S(ctx, (c) => ellipsePath(c, x, y, r, r * flat), {
    fill: radial(ctx, x - r * 0.3, y - r * 0.35 * flat, r * 1.3, [[0, '#ffd45a'], [0.5, '#ffaa18'], [1, '#f08400']]),
    ink: 1.25,
    shadow: '#e27200',
    shadowOffset: [-1.3, -1.3 * flat],
    gloss: [
      { x: x - r * 0.38, y: y - r * 0.42 * flat, rx: r * 0.32, ry: r * 0.2, rot: -0.6, alpha: 0.95 },
      { x: x + r * 0.42, y: y + r * 0.3 * flat, rx: r * 0.1, ry: r * 0.07, alpha: 0.7 },
    ],
  });
}

ingr('tuorli', (ctx) => {
  // a half eggshell standing tilted, its yolk domed over the broken rim; a second yolk in front of it
  rot(ctx, 3.0, -1.0, 0.28, () => {
    const cx = 0, rimY = -1.2, rx = 6.6, ry = 2.2;
    const inner = (c: Ctx) => ellipsePath(c, cx, rimY, rx, ry);
    S(ctx, inner, { fill: '#fff3df', ink: K, shadow: '#e8d2b4', shadowOffset: [1.4, 1.4] });
    yolk(ctx, cx + 0.2, rimY - 2.2, 4.6, 0.92);
    const shell = (c: Ctx) => {
      c.moveTo(cx - rx, rimY);
      c.bezierCurveTo(cx - rx, rimY + 7.0, cx - 3.6, rimY + 10.6, cx, rimY + 10.6);
      c.bezierCurveTo(cx + 3.6, rimY + 10.6, cx + rx, rimY + 7.0, cx + rx, rimY);
      const jag: Pt[] = [[5.6, 1.0], [4.4, 0.2], [3.0, 1.6], [1.6, 0.4], [0.2, 1.8], [-1.4, 0.6], [-2.8, 1.8], [-4.2, 0.4], [-5.6, 1.2]];
      for (const [x, y] of jag) c.lineTo(cx + x, rimY + y);
      c.closePath();
    };
    S(ctx, shell, {
      fill: '#f4d6b2',
      ink: K,
      shadow: '#d6a87c',
      shadowOffset: [-2.0, -1.6],
      gloss: [{ x: cx - 4.0, y: rimY + 4.8, rx: 0.9, ry: 2.2, rot: 0.4, alpha: 0.75 }],
    });
    inside(ctx, shell, () => speckle(ctx, cx + 1, rimY + 6.5, 5, 3, 8, '#c98f5e', 0.25, 4, 0.7));
    line(ctx, [[5.6, 1.3], [4.4, 0.5], [3.0, 1.9], [1.6, 0.7], [0.2, 2.1], [-1.4, 0.9], [-2.8, 2.1], [-4.2, 0.7], [-5.6, 1.5]].map(([x, y]) => [cx + x, rimY + y] as Pt), 0.5, '#fff6e6', false, 0.9);
  });
  // the second yolk, resting in front
  yolk(ctx, -5.4, 5.6, 4.4, 0.8);
});

/** A cheese wedge: tip on the left (or right when `flip`), rind on the curved back. */
function wedge(ctx: Ctx, o: {
  paste: string; pasteTop: string; pasteSh: string; rind: string; rindL: string; seed: number;
  flip?: boolean; crag?: boolean;
  /** depth of the top face (1 = default) and height of the cut face */
  dk?: number; hf?: number;
  /** marks on the rind, called at points along it (x, y, i): basket weave, pin dots... */
  mark?: (x: number, y: number, i: number) => void;
}) {
  const R = rng(o.seed);
  ctx.save();
  if (o.flip) ctx.scale(-1, 1);
  const dk = o.dk ?? 1, hf = o.hf ?? 7.2, y0 = 0.6;
  const tipT: Pt = [-10, y0], A: Pt = [1.6, y0 - 9.2 * dk], C: Pt = [8.6, y0 - 9.0 * dk], B: Pt = [9.8, y0 - 3.4 * dk], Bb: Pt = [9.8, B[1] + hf], tipB: Pt = [-10, y0 + hf];
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
    line(ctx, sample([A, [6.6, A[1] + 1.0 * dk], [9.0, A[1] + 3.4 * dk], B], 12).map(([x, y]) => [x - 1.5, y + 0.9] as Pt), 0.35, INK, true, 0.45);
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
  const rindEnd = (c: Ctx) => polyPath(c, [[7.6, B[1] + 0.4], B, Bb, [7.6, Bb[1] + 0.4]]);
  inside(ctx, front, () => {
    S(ctx, rindEnd, { fill: o.rind, ink: 0, shadow: 'none' });
    inside(ctx, rindEnd, () => {
      if (o.mark) for (let j = 0; j < 4; j++) o.mark(8.7, B[1] + 1.8 + (j * (hf - 2)) / 3.4, j + 20);
    });
    line(ctx, [[7.6, B[1] + 0.6], [7.6, Bb[1] + 0.4]], 0.5, INK, false, 0.6);
    line(ctx, [[8.2, B[1] + 1.0], [8.2, Bb[1] - 0.2]], 0.4, o.rindL, false, 0.8);
  });
  ctx.restore();
}

ingr('pecorino', (ctx) => {
  // a TALL wedge of Pecorino Romano (the wheels are tall drums): chalk-white paste, a thick black rind
  // with the basket-weave print along the curved back and down the side
  const T: Pt = [-8.0, -1.6], A: Pt = [-1.6, -10.4], C: Pt = [6.6, -11.4], B: Pt = [8.4, -4.2];
  const T2: Pt = [-8.0, 10.2], B2: Pt = [8.4, 9.2];
  const top = (c: Ctx) => {
    c.moveTo(T[0], T[1]);
    c.lineTo(A[0], A[1]);
    c.quadraticCurveTo(C[0], C[1], B[0], B[1]);
    c.closePath();
  };
  const front = (c: Ctx) => polyPath(c, [T, B, B2, T2]);
  // the rind seen past the cut face: the curved back of the drum
  const back = (c: Ctx) => {
    c.moveTo(A[0], A[1]);
    c.quadraticCurveTo(C[0], C[1], B[0], B[1]);
    c.lineTo(B2[0], B2[1]);
    c.lineTo(B2[0] + 1.2, B2[1] - 1.0);
    c.lineTo(B[0] + 1.3, B[1] - 1.2);
    c.quadraticCurveTo(C[0] + 1.0, C[1] - 0.9, A[0] + 0.2, A[1] - 0.7);
    c.closePath();
  };
  G(ctx, [
    { build: back, style: { fill: '#2a2422', shadow: 'none' } },
    { build: front, style: { fill: '#ece2c8', shadow: '#d4c4a2', shadowOffset: [-1.8, -1.4] } },
    { build: top, style: { fill: '#fffbf0', shadow: 'none' } },
  ], K);
  line(ctx, [T, B], 0.7, INK, false, 0.85);
  // thick black rind band along the top's curved back, and down the cut face's far edge
  inside(ctx, top, () => {
    ctx.beginPath();
    ctx.moveTo(A[0] - 1.0, A[1] - 0.3);
    ctx.quadraticCurveTo(C[0], C[1], B[0] + 0.4, B[1] + 0.4);
    ctx.lineWidth = 5.0;
    ctx.strokeStyle = '#2a2422';
    ctx.stroke();
    line(ctx, sample([[A[0] + 0.4, A[1] + 2.6], [4.0, -7.8], [B[0] - 2.4, B[1] + 0.4]], 10), 0.4, '#9a8e7c', true, 0.7);
  });
  const rindSide = (c: Ctx) => polyPath(c, [[6.0, -4.0], B, B2, [6.0, 9.4]]);
  inside(ctx, front, () => {
    S(ctx, rindSide, { fill: '#2a2422', ink: 0, shadow: 'none' });
    line(ctx, [[6.0, -3.8], [6.0, 9.4]], 0.45, '#9a8e7c', false, 0.7);
  });
  // the basket-weave print of the moulds on the rind (grey criss-cross)
  const R = rng(3);
  const weave = (x: number, y: number, i: number) => line(ctx, [[x - 0.5, y + (i % 2 ? -0.5 : 0.5)], [x + 0.5, y + (i % 2 ? 0.5 : -0.5)]], 0.32, '#6e6660', false, 0.9);
  inside(ctx, back, () => { for (let i = 0; i < 30; i++) weave(6.0 + R() * 4.0, -10.4 + R() * 19.0, i); });
  inside(ctx, rindSide, () => { for (let i = 0; i < 12; i++) weave(6.6 + R() * 1.8, -3.0 + R() * 12.0, i); });
  // small, sparse eyes and a faint grain in the paste
  for (const [x, y, r] of [[-4.0, 4.0, 0.55], [0.6, 2.6, 0.42], [3.0, 6.2, 0.5], [-1.6, 7.6, 0.36], [-5.6, 7.8, 0.36], [-2.4, -5.0, 0.36], [1.2, -6.4, 0.32], [-4.2, -2.6, 0.3]] as [number, number, number][]) {
    S(ctx, (c) => ellipsePath(c, x, y, r, r * 0.75), { fill: '#d8caa8', ink: 0, shadow: 'none' });
    glint(ctx, x + r * 0.3, y + r * 0.35, r * 0.4, r * 0.25, 0, 0.8);
  }
  speckle(ctx, -1, 4.0, 6.0, 5.0, 12, '#e2d6bc', 0.3, 5, 0.8);
  glint(ctx, -5.2, 3.0, 0.7, 3.0, 0.02, 0.6);
});

ingr('parmigiano', (ctx) => {
  // a LOW, wide wedge of Parmigiano Reggiano: grainy gold paste, a thick golden rind with the pin-dot print
  wedge(ctx, {
    paste: '#f2cc6e', pasteTop: '#fbe3a0', pasteSh: '#d9a443', rind: '#c4842e', rindL: '#f1c27a', flip: true, crag: true, seed: 9,
    dk: 0.62, hf: 5.6,
    // the pin-dot rind (puntinatura)
    mark: (x, y) => {
      for (const [dx, dy] of [[-0.5, -0.4], [0.5, 0.4]] as Pt[]) S(ctx, (c) => circlePath(c, x + dx, y + dy, 0.3), { fill: '#6e3c10', ink: 0, shadow: 'none' });
    },
  });
  // granular, craggy paste with tyrosine crystals
  speckle(ctx, 0, 3.4, 8.5, 2.2, 26, '#d49a3a', 0.36, 12, 0.85);
  speckle(ctx, 0, 3.4, 8.5, 2.2, 14, '#fff7da', 0.32, 13, 1);
  speckle(ctx, 1, -2.0, 5, 1.6, 10, '#fffbe8', 0.3, 14, 1);
  speckle(ctx, 1, -1.8, 6, 1.6, 10, '#e2b250', 0.3, 15, 0.8);
  glint(ctx, 3.0, -1.6, 2.2, 0.5, 0.2, 0.65);
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
  const L = 11.6, D = 6.4, H = 7.6;
  const P0: Pt = [-7.2, 7.0];
  const add = (p: Pt, q: Pt, k: number): Pt => [p[0] + q[0] * k, p[1] + q[1] * k];
  const P1 = add(P0, u, L), P3 = add(P0, v, D), P2 = add(P1, v, D);
  const Q0: Pt = [P0[0], P0[1] - H], Q1: Pt = [P1[0], P1[1] - H], Q2: Pt = [P2[0], P2[1] - H], Q3: Pt = [P3[0], P3[1] - H];
  // the parchment it came in, opened out flat (crinkled edges, one corner folded back)
  const e = 1.7;
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
  // a steel ladle: a round hemispherical bowl on a long, steep handle, full of cloudy, starchy pasta water
  const cx = -3.0, cy = 2.6, rx = 6.4, ry = 1.9, d = 6.4;
  // the handle rises steeply from the back of the rim and ends in a hook
  tube(ctx, [[cx + 3.6, cy - 0.8], [cx + 5.6, cy - 5.6], [cx + 7.6, cy - 10.4], [cx + 8.6, cy - 13.2], [cx + 7.6, cy - 14.6], [cx + 6.4, cy - 13.8]], 1.35, '#d7dee8', K, true, '#ffffff', 0.9);
  const bowl = (c: Ctx) => {
    c.moveTo(cx - rx, cy);
    c.bezierCurveTo(cx - rx, cy + d * 0.62, cx - rx * 0.56, cy + d, cx, cy + d);
    c.bezierCurveTo(cx + rx * 0.56, cy + d, cx + rx, cy + d * 0.62, cx + rx, cy);
    c.closePath();
  };
  const rim = (c: Ctx) => ellipsePath(c, cx, cy, rx, ry);
  G(ctx, [
    { build: bowl, style: { fill: linear(ctx, cx - rx, 0, cx + rx, 0, [[0, '#ffffff'], [0.3, '#e2e8f0'], [0.75, '#97a3b6'], [1, '#c4ccd8']]), shadow: 'none' } },
    { build: rim, style: { fill: '#aeb8c8', shadow: 'none' } },
  ], K);
  inside(ctx, bowl, () => {
    line(ctx, [[cx - 5.0, cy + 2.0], [cx - 3.8, cy + 4.6], [cx - 1.4, cy + 5.8]], 0.9, '#ffffff', true, 0.9);
    line(ctx, [[cx + 4.8, cy + 2.2], [cx + 3.6, cy + 4.4]], 0.45, '#e8edf4', true, 0.7);
  });
  // cloudy, opalescent water filled to the brim
  const water = (c: Ctx) => ellipsePath(c, cx, cy + 0.15, rx - 0.75, ry - 0.5);
  S(ctx, water, { fill: radial(ctx, cx - 2.0, cy - 0.3, rx, [[0, '#ffffff'], [0.5, '#eef4f0'], [1, '#c4d6d8']]), ink: 0.55, inkColor: '#6f8296', shadow: 'none' });
  inside(ctx, water, () => {
    line(ctx, [[cx - 4.6, cy - 0.3], [cx - 2.2, cy - 0.8], [cx + 0.4, cy - 0.4]], 0.45, '#ffffff', true, 0.95);
    for (const [x, y, r] of [[cx + 2.8, cy + 0.5, 0.45], [cx + 4.0, cy - 0.2, 0.3], [cx + 1.8, cy + 1.0, 0.3]] as [number, number, number][]) {
      ctx.beginPath();
      circlePath(ctx, x, y, r);
      ctx.lineWidth = 0.25;
      ctx.strokeStyle = '#8fa6b6';
      ctx.stroke();
    }
  });
  // one spaghetto draped over the rim: it IS pasta water
  inkLine2(ctx, [[cx + 1.2, cy + 0.4], [cx - 1.4, cy + 0.9], [cx - 3.0, cy + 1.6], [cx - 3.6, cy + 3.0], [cx - 3.0, cy + 4.0], [cx - 3.8, cy + 5.2]], 0.75, '#f4d27a', 0.5);
  // steam
  for (const [x, a] of [[cx - 2.4, 1], [cx + 1.8, -1]] as [number, number][]) {
    const pts: Pt[] = [[x, cy - 2.2], [x - 1.0 * a, cy - 4.4], [x + 0.6 * a, cy - 6.8], [x - 0.5 * a, cy - 9.2]];
    line(ctx, pts, 1.7, '#8fa6b8', true, 0.5);
    line(ctx, pts, 1.05, '#ffffff', true, 0.95);
  }
});

ingr('vino', (ctx) => {
  // a slender bottle of dry white (green glass) behind a stemmed glass of straw-coloured wine
  rot(ctx, -3.6, 0, -0.06, () => {
    const hw = 3.1, nw = 1.15;
    const bottle = (c: Ctx) => {
      c.moveTo(-nw, -11.0);
      c.lineTo(-nw, -5.6);
      c.bezierCurveTo(-nw, -3.6, -hw, -3.6, -hw, -1.0);
      c.lineTo(-hw, 9.8);
      c.quadraticCurveTo(-hw, 10.8, -hw + 1.0, 10.8);
      c.lineTo(hw - 1.0, 10.8);
      c.quadraticCurveTo(hw, 10.8, hw, 9.8);
      c.lineTo(hw, -1.0);
      c.bezierCurveTo(hw, -3.6, nw, -3.6, nw, -5.6);
      c.lineTo(nw, -11.0);
      c.closePath();
    };
    S(ctx, bottle, { fill: linear(ctx, -hw, 0, hw, 0, [[0, '#5f9a50'], [0.45, '#3a7038'], [1, '#1f4422']]), ink: K, shadow: 'none' });
    inside(ctx, bottle, () => {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      roundRectPath(ctx, -2.3, -1.6, 0.9, 11.0, 0.45);
      ctx.fill();
      line(ctx, [[-0.4, -9.8], [-0.4, -5.6]], 0.45, '#cfeac0', false, 0.8);
      // plain label (no text)
      S(ctx, (c) => roundRectPath(c, -hw - 0.2, 2.8, hw * 2 + 0.4, 4.6, 0.3), { fill: '#fbf3dc', ink: 0.6, shadow: '#dccfb0', shadowOffset: [-1.0, -0.4] });
      line(ctx, [[-2.0, 3.8], [2.0, 3.8]], 0.45, '#b5343e', false, 0.85);
      for (const [x, y] of [[-0.55, 5.2], [0.55, 5.2], [0, 6.1]] as Pt[]) S(ctx, (c) => circlePath(c, x, y, 0.5), { fill: '#b8c24a', ink: 0, shadow: 'none' });
    });
    // capsule
    S(ctx, (c) => roundRectPath(c, -1.6, -12.4, 3.2, 3.6, 0.5), { fill: linear(ctx, -1.6, 0, 1.6, 0, [[0, '#fff1a6'], [0.4, '#e0b03c'], [1, '#9c6a14']]), ink: K, shadow: 'none' });
  });
  // the glass: tulip bowl, stem, foot
  const gx = 4.6, rimY = -1.6;
  const bowl = (c: Ctx) => {
    c.moveTo(gx - 3.6, rimY);
    c.bezierCurveTo(gx - 4.2, rimY + 3.4, gx - 2.6, rimY + 6.6, gx, rimY + 6.8);
    c.bezierCurveTo(gx + 2.6, rimY + 6.6, gx + 4.2, rimY + 3.4, gx + 3.6, rimY);
    c.closePath();
  };
  // stem + foot (one inked silhouette under the bowl)
  G(ctx, [
    { build: (c) => roundRectPath(c, gx - 0.45, rimY + 6.2, 0.9, 5.2, 0.4), style: { fill: '#eef6f6', shadow: 'none' } },
    { build: (c) => ellipsePath(c, gx, rimY + 11.6, 3.4, 0.95), style: { fill: '#eef6f6', shadow: '#c6d4d8', shadowOffset: [-0.6, -0.4] } },
  ], 1.1);
  S(ctx, bowl, { fill: 'rgba(240,248,248,0.92)', ink: 1.2, shadow: 'none' });
  inside(ctx, bowl, () => {
    // the wine, two thirds up
    ctx.beginPath();
    ctx.rect(gx - 5, rimY + 2.4, 10, 6);
    ctx.fillStyle = linear(ctx, gx - 4, 0, gx + 4, 0, [[0, '#fff3b0'], [0.5, '#f2d96a'], [1, '#c9a634']]);
    ctx.fill();
    ctx.beginPath();
    ellipsePath(ctx, gx, rimY + 2.4, 3.9, 0.55);
    ctx.fillStyle = '#fff7c8';
    ctx.fill();
    line(ctx, [[gx - 2.6, rimY + 0.8], [gx - 2.8, rimY + 3.4], [gx - 1.8, rimY + 5.4]], 0.7, '#ffffff', true, 0.9);
  });
  // the rim, seen as a thin ellipse
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, gx, rimY, 3.6, 0.6);
  ctx.lineWidth = 0.45;
  ctx.strokeStyle = '#8fa2a8';
  ctx.stroke();
  ctx.restore();
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
  // the three vegetables whole, crossed behind a small heap of their dice
  // a carrot, with its feathery top
  rot(ctx, -1.0, -2.6, -0.85, () => {
    rot(ctx, 9.6, 0, 0, () => {
      S(ctx, (c) => {
        for (const a of [-0.55, -0.1, 0.4]) { c.save(); c.rotate(a); leafPath(c, 4.6, 1.6, 0.4); c.restore(); }
      }, { fill: '#5cb848', ink: 0.85, shadow: '#3a8a30', shadowOffset: [-0.4, -0.4] });
    });
    const carrot = (c: Ctx) => taperPath(c, [[9.8, 0], [3.0, 0.1], [-5.0, -0.2], [-10.4, 0.3]], (t) => 4.2 * Math.pow(1 - t, 0.55) + 0.4, 24);
    S(ctx, carrot, { fill: '#f58a24', ink: K, shadow: '#cf5e14', shadowOffset: [0, -1.1], gloss: [{ x: 3, y: -1.0, rx: 4.4, ry: 0.4, alpha: 0.6, color: '#ffd9a0' }] });
    for (const x of [5.4, 1.4, -2.4, -5.6]) line(ctx, [[x, -1.4 + Math.abs(x) * 0.05], [x - 0.4, 0.2]], 0.35, '#c4581a', false, 0.75);
  });
  // a celery stalk with its leaves
  rot(ctx, 1.0, -2.8, 0.82, () => {
    rot(ctx, -9.8, 0, Math.PI, () => {
      S(ctx, (c) => {
        for (const a of [-0.6, 0, 0.6]) { c.save(); c.rotate(a); leafPath(c, 3.8, 2.4, 0.45); c.restore(); }
      }, { fill: '#7ccc50', ink: 0.85, shadow: '#4a9a34', shadowOffset: [-0.4, -0.4] });
    });
    const stalk = (c: Ctx) => roundRectPath(c, -9.8, -1.6, 19.6, 3.2, [0.6, 1.4, 1.4, 0.6]);
    S(ctx, stalk, { fill: '#b6e07a', ink: K, shadow: '#7fb84e', shadowOffset: [0, -1.0] });
    for (const y of [-0.6, 0.5]) line(ctx, [[-9.0, y], [9.0, y]], 0.35, '#86b852', false, 0.8);
  });
  // a small heap of dice in front: carrot, celery and onion
  const ON = '#f6f0d8', CA = '#f28a22', CE = '#9ad25a';
  const cubes: [number, number, string][] = [
    [-1.4, 3.2, ON], [2.2, 3.4, CA],
    [-4.8, 5.8, CA], [-1.2, 6.4, CE], [2.4, 6.6, ON], [5.8, 6.2, CE],
    [-6.6, 9.0, ON], [-3.0, 9.4, CE], [0.6, 9.6, CA], [4.2, 9.4, ON], [7.4, 9.0, CA],
  ];
  for (const [x, y, c] of cubes) dice(ctx, x, y, 3.6, c);
});

ingr('pinoli', (ctx) => {
  // a heap of long ivory Mediterranean pine nuts, a small cone behind it
  rot(ctx, 6.6, -6.4, 0.5, () => {
    const cone = (c: Ctx) => {
      c.moveTo(0, -4.6);
      c.bezierCurveTo(2.8, -4.4, 3.5, -1.0, 3.1, 1.4);
      c.bezierCurveTo(2.7, 3.5, 1.1, 4.4, 0, 4.4);
      c.bezierCurveTo(-1.1, 4.4, -2.7, 3.5, -3.1, 1.4);
      c.bezierCurveTo(-3.5, -1.0, -2.8, -4.4, 0, -4.6);
      c.closePath();
    };
    S(ctx, cone, { fill: '#9a5a2e', ink: 1.2, shadow: '#6a3518', shadowOffset: [-0.9, -0.9] });
    inside(ctx, cone, () => {
      for (let r = -2; r <= 2; r++) {
        for (let q = -2; q <= 2; q++) {
          const x = q * 1.6 + (r % 2 ? 0.8 : 0), y = r * 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 0.75, y + 0.2);
          ctx.quadraticCurveTo(x, y - 0.75, x + 0.75, y + 0.2);
          ctx.quadraticCurveTo(x, y + 0.7, x - 0.75, y + 0.2);
          ctx.closePath();
          ctx.fillStyle = '#c98a4e';
          ctx.fill();
          ctx.lineWidth = 0.3;
          ctx.strokeStyle = '#4a2410';
          ctx.stroke();
        }
      }
    });
  });
  // the heap, back rows first
  const R = rng(31);
  const kern: [number, number, number][] = [
    [-1.6, -5.4, -0.3], [1.6, -5.0, 0.5],
    [-4.6, -2.0, 0.6], [-1.2, -1.4, -0.2], [2.4, -1.6, 0.8], [5.6, -0.6, -0.5],
    [-7.4, 2.0, -0.7], [-4.0, 2.4, 0.3], [-0.4, 2.6, -0.9], [3.2, 2.6, 0.2], [6.8, 3.0, 1.0],
    [-8.6, 6.4, 0.4], [-5.2, 6.8, -0.4], [-1.6, 7.0, 0.7], [2.0, 7.0, -0.2], [5.6, 7.0, 0.5], [8.8, 6.6, -0.9],
  ];
  for (const [x, y, a] of kern) {
    rot(ctx, x, y, a + (R() - 0.5) * 0.3, () => {
      const k = (c: Ctx) => {
        c.moveTo(0, -3.0);
        c.bezierCurveTo(1.6, -2.4, 1.75, 1.4, 0, 2.7);
        c.bezierCurveTo(-1.75, 1.4, -1.6, -2.4, 0, -3.0);
        c.closePath();
      };
      S(ctx, k, { fill: '#f6e8c2', ink: 0.95, shadow: '#d8b57a', shadowOffset: [-0.7, -0.8], gloss: [{ x: -0.5, y: 0.2, rx: 0.36, ry: 1.2, alpha: 0.9 }] });
      inside(ctx, k, () => { ctx.beginPath(); ellipsePath(ctx, 0, -2.9, 1.0, 0.85); ctx.fillStyle = '#c9965a'; ctx.fill(); });
    });
  }
});

/** Outline of a vongola verace's valve (umbo near the top-left). */
function clamPath(c: Ctx, s: number) {
  c.moveTo(-0.8 * s, -5.6 * s);
  c.bezierCurveTo(0.8 * s, -5.4 * s, 5.0 * s, -3.4 * s, 6.2 * s, 0.4 * s);
  c.bezierCurveTo(6.8 * s, 3.8 * s, 3.6 * s, 5.2 * s, 0, 5.2 * s);
  c.bezierCurveTo(-3.8 * s, 5.2 * s, -6.8 * s, 3.6 * s, -6.2 * s, 0.2 * s);
  c.bezierCurveTo(-5.6 * s, -3.0 * s, -2.4 * s, -5.2 * s, -0.8 * s, -5.6 * s);
  c.closePath();
}

/** The verace's decussate shell: bold growth rings crossed by radial ribs, with brown zig-zags. */
function clamTexture(ctx: Ctx, s: number, seed: number) {
  const R = rng(seed);
  const um: Pt = [-0.8 * s, -5.6 * s];
  for (let k = 0.3; k < 1; k += 0.14) {
    ctx.save();
    ctx.translate(um[0], um[1]);
    ctx.scale(k, k);
    ctx.translate(-um[0], -um[1]);
    ctx.beginPath();
    clamPath(ctx, s);
    ctx.lineWidth = 0.55 / k;
    ctx.strokeStyle = '#6a5866';
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 14; i++) {
    const a = 0.15 + (i / 13) * (Math.PI - 0.3);
    line(ctx, [um, [um[0] + Math.cos(a) * 12 * s, um[1] + Math.sin(a) * 12 * s]], 0.4, '#6a5866', false, 0.6);
  }
  for (let i = 0; i < 3; i++) {
    const a = 0.7 + i * 0.75 + R() * 0.2;
    const pts: Pt[] = [];
    for (let j = 1; j <= 4; j++) {
      const d = j * 2.3 * s;
      pts.push([um[0] + Math.cos(a + (j % 2 ? 0.14 : -0.14)) * d, um[1] + Math.sin(a + (j % 2 ? 0.14 : -0.14)) * d]);
    }
    line(ctx, pts, 0.9 * s, '#7a5236', false, 0.5);
  }
}

ingr('vongole', (ctx) => {
  const closed = () => rot(ctx, -4.6, 5.4, -0.2, () => {
    const s = 0.74;
    const b = (c: Ctx) => clamPath(c, s);
    S(ctx, b, { fill: '#e8dfd8', ink: K, shadow: '#b8a8b4', shadowOffset: [-1.4, -1.5] });
    inside(ctx, b, () => clamTexture(ctx, s, 5));
    glint(ctx, -3.0 * s, -1.2 * s, 1.4 * s, 0.6 * s, -0.7, 0.85);
  });
  // ...and one open in front: both valves spread on the hinge like a butterfly, the pale interior,
  // the plump clam and its two short siphons
  const H: Pt = [0.8, -4.6];
  const s = 0.8;
  const valve = (a: number, flip: number, meat: boolean) => rot(ctx, H[0], H[1], a, () => {
    ctx.save();
    ctx.scale(flip, 1);
    ctx.translate(0.8 * s, 5.6 * s);
    const b = (c: Ctx) => clamPath(c, s);
    S(ctx, b, { fill: '#c6b4c2', ink: K, shadow: 'none' });
    const inner = (c: Ctx) => {
      c.save();
      c.translate(0.2 * s, 0.5 * s);
      c.scale(0.84, 0.82);
      clamPath(c, s);
      c.restore();
    };
    S(ctx, inner, {
      fill: radial(ctx, 0.6 * s, 1.0 * s, 7 * s, [[0, '#ffffff'], [0.62, '#f6f0f6'], [1, '#c9a2c6']]),
      ink: 0.5,
      inkColor: '#7a6074',
      shadow: 'none',
      gloss: [{ x: -2.6 * s, y: 1.6 * s, rx: 1.6 * s, ry: 0.55 * s, rot: 0.6, alpha: 0.85 }],
    });
    // the violet stain near the hinge
    inside(ctx, inner, () => { ctx.beginPath(); ellipsePath(ctx, -0.6 * s, -3.8 * s, 2.2 * s, 1.4 * s, -0.2); ctx.fillStyle = 'rgba(140,80,150,0.45)'; ctx.fill(); });
    if (meat) {
      S(ctx, (c) => blobPath(c, 0.4 * s, 0.6 * s, 3.4 * s, 2.7 * s, 0.14, 9, 7), {
        fill: radial(ctx, -0.4 * s, -0.4 * s, 4 * s, [[0, '#ffe6c8'], [0.7, '#f5bb8e'], [1, '#d98a62']]),
        ink: 0.8,
        shadow: '#d48a62',
        shadowOffset: [-0.6, -0.6],
        gloss: [{ x: -0.6 * s, y: -0.2 * s, rx: 1.0 * s, ry: 0.5 * s, rot: -0.4, alpha: 0.8 }],
      });
      // two short pale siphons
      for (const dy of [-0.55, 0.55]) tube(ctx, [[2.9 * s, 1.0 * s + dy], [4.1 * s, 1.0 * s + dy * 1.25]], 0.8, '#fbe8d6', 0.5, false, '#ffffff', 0.7);
    }
    ctx.restore();
  });
  valve(1.25, -1, false);
  valve(-1.05, 1, true);
  // the hinge
  S(ctx, (c) => ellipsePath(c, H[0], H[1] - 0.2, 1.3, 0.8, 0), { fill: '#8a6a5a', ink: 0.8, shadow: 'none' });
  // one closed clam in front
  closed();
});

ingr('impasto', (ctx) => {
  // flour dusted on the board (no outline: it is a dusting, not a plate)
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  blobPath(ctx, 0.4, 6.6, 10.6, 2.6, 0.18, 12, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  speckle(ctx, 0.4, 6.8, 11.0, 3.0, 18, '#ffffff', 0.35, 44, 1);
  // one big proofed panetto: a low, wide, soft dome, slumped from rising
  const x = 0, y = 2.2;
  const ball = (c: Ctx) => {
    c.moveTo(x - 9.4, y + 3.0);
    c.bezierCurveTo(x - 10.0, y - 4.6, x - 5.2, y - 9.2, x, y - 9.2);
    c.bezierCurveTo(x + 5.2, y - 9.2, x + 10.0, y - 4.6, x + 9.4, y + 3.0);
    c.bezierCurveTo(x + 7.8, y + 5.6, x - 7.8, y + 5.6, x - 9.4, y + 3.0);
    c.closePath();
  };
  S(ctx, ball, {
    fill: radial(ctx, x - 3.0, y - 5.0, 12, [[0, '#fffbf0'], [0.5, '#f6e4c0'], [1, '#e0c08c']]),
    ink: K,
    shadow: '#d6b47e',
    shadowOffset: [-2.6, -2.6],
    gloss: [{ x: x - 3.6, y: y - 5.4, rx: 2.8, ry: 1.3, rot: -0.5, alpha: 0.55 }],
  });
  inside(ctx, ball, () => {
    // flour on top, a few gas bubbles under the skin
    speckle(ctx, x - 0.6, y - 5.4, 6.0, 2.6, 22, '#ffffff', 0.36, 47, 0.95);
    for (const [dx, dy, r] of [[4.0, -2.4, 0.5], [5.6, -0.2, 0.36], [-5.6, 0.2, 0.42], [-3.2, 2.4, 0.3], [2.0, 2.0, 0.34]] as [number, number, number][]) {
      ctx.beginPath();
      circlePath(ctx, x + dx, y + dy, r);
      ctx.lineWidth = 0.32;
      ctx.strokeStyle = '#c9a874';
      ctx.stroke();
    }
  });
  // a fingertip dimple: the baker's test that it has proofed
  S(ctx, (c) => ellipsePath(c, x + 2.6, y - 4.0, 1.5, 1.0, -0.2), { fill: '#e2c690', ink: 0, shadow: '#f6e6c6', shadowOffset: [0.5, 0.5] });
  line(ctx, [[x + 1.2, y - 4.5], [x + 2.4, y - 5.0], [x + 3.9, y - 4.6]], 0.45, '#b8925a', true, 0.85);
});

ingr('mozzarella', (ctx) => {
  // a shallow pool of whey (soft, no rim: it is not a plate)
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, 0.8, 6.6, 10.4, 2.8);
  ctx.fillStyle = 'rgba(214,230,242,0.95)';
  ctx.fill();
  ctx.restore();
  line(ctx, [[-4.0, 8.0], [1.0, 8.8], [6.4, 8.2]], 0.5, '#ffffff', true, 0.9);
  // one glossy porcelain-white fior di latte, the soft pulled tip where it was torn off the curd
  const bx = 1.8, by = -1.2;
  const ball = (c: Ctx) => {
    c.moveTo(bx - 0.6, by - 7.8);
    c.bezierCurveTo(bx + 0.6, by - 9.6, bx + 1.6, by - 7.8, bx + 2.4, by - 7.3);
    c.bezierCurveTo(bx + 6.2, by - 6.4, bx + 7.8, by - 3.0, bx + 7.8, by + 0.6);
    c.bezierCurveTo(bx + 7.8, by + 5.4, bx + 4.2, by + 7.6, bx, by + 7.6);
    c.bezierCurveTo(bx - 4.2, by + 7.6, bx - 7.8, by + 5.4, bx - 7.8, by + 0.6);
    c.bezierCurveTo(bx - 7.8, by - 3.6, bx - 4.6, by - 7.4, bx - 0.6, by - 7.8);
    c.closePath();
  };
  S(ctx, ball, {
    fill: radial(ctx, bx - 2.6, by - 3.0, 11, [[0, '#ffffff'], [0.6, '#fbfaf6'], [1, '#e0e6ee']]),
    ink: K,
    shadow: '#cfd8e6',
    shadowOffset: [-2.6, -2.6],
    gloss: [
      { x: bx - 3.4, y: by - 3.2, rx: 2.6, ry: 1.4, rot: -0.7, alpha: 1 },
      { x: bx + 4.6, y: by + 3.6, rx: 0.5, ry: 0.9, rot: -0.6, alpha: 0.7 },
    ],
  });
  // the soft crease under the pulled tip
  line(ctx, [[bx - 1.2, by - 6.8], [bx + 0.4, by - 6.2], [bx + 1.8, by - 6.7]], 0.45, '#c4ccd8', true, 0.95);
  // a round slice in front, with the faint layered fibres of pasta filata
  const sx = -5.2, sy = 6.0;
  const edge = (c: Ctx) => ellipsePath(c, sx + 0.3, sy + 0.9, 4.6, 2.5);
  const face = (c: Ctx) => ellipsePath(c, sx, sy, 4.6, 2.5);
  G(ctx, [
    { build: edge, style: { fill: '#e6ecf2', shadow: 'none' } },
    { build: face, style: { fill: '#fdfdfb', shadow: '#eef1f5', shadowOffset: [-1.0, -0.8] } },
  ], 1.2);
  inside(ctx, face, () => {
    for (const k of [-1, 0, 1]) line(ctx, [[sx - 3.6, sy + k * 0.8 - 0.2], [sx - 1.0, sy + k * 0.8 + 0.25], [sx + 1.6, sy + k * 0.8 - 0.1], [sx + 3.6, sy + k * 0.8 + 0.2]], 0.3, '#d6dde8', true, 0.9);
    glint(ctx, sx - 1.6, sy - 1.0, 1.2, 0.35, -0.1, 0.9);
  });
  // a basil leaf at its side
  basilLeaf(ctx, 7.4, 5.0, -0.5, 5.6, 3.4, 1.0);
});
