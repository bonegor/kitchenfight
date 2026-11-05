/**
 * PAINTER — the shared drawing toolkit for every sprite in KITCHEN FIGHT.
 *
 * Style: "Trattoria Toon" — bold warm-brown ink outlines, 2-tone cel shading
 * (light comes from the upper-left), glossy highlights, saturated Mediterranean
 * colours, expressive cartoon faces.
 *
 * All coordinates are WORLD UNITS. Painters draw around the sprite anchor (0,0).
 * The sprite cache renders them at high resolution, so never think in pixels.
 */

export type Ctx = CanvasRenderingContext2D;
export type Fill = string | CanvasGradient | CanvasPattern;
export type Pt = [number, number];

/** Main outline colour (warm near-black, never pure #000). */
export const INK = '#2b1712';
/** Default outline width for normal-sized sprites (world units). */
export const INK_W = 2.4;

// ---------------------------------------------------------------------------
// Colour utilities
// ---------------------------------------------------------------------------

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Linear mix of two hex colours. */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

/**
 * Shadow tone for cel shading: darker, a bit more saturated and hue-shifted
 * toward red/purple (looks far richer than plain darkening).
 */
export function shade(hex: string, amt = 0.22): string {
  const [r, g, b] = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(r, g, b);
  // shift hue toward ~0.95 (magenta-red) a little
  const target = 0.96;
  let dh = target - h;
  if (dh > 0.5) dh -= 1;
  if (dh < -0.5) dh += 1;
  h = (h + dh * 0.08 * (amt / 0.22) + 1) % 1;
  s = clamp01(s * (1 + amt * 0.35));
  l = clamp01(l * (1 - amt * 1.25));
  const [R, G, B] = hslToRgb(h, s, l);
  return rgbToHex(R, G, B);
}

/** Highlight tone: lighter and hue-shifted slightly toward warm yellow. */
export function light(hex: string, amt = 0.25): string {
  const [r, g, b] = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(r, g, b);
  const target = 0.13;
  let dh = target - h;
  if (dh > 0.5) dh -= 1;
  if (dh < -0.5) dh += 1;
  h = (h + dh * 0.06 * (amt / 0.25) + 1) % 1;
  l = clamp01(l + (1 - l) * amt * 1.4);
  s = clamp01(s * (1 - amt * 0.1));
  const [R, G, B] = hslToRgb(h, s, l);
  return rgbToHex(R, G, B);
}

// ---------------------------------------------------------------------------
// Deterministic RNG (for textures: seeds, speckles, crumbs...)
// ---------------------------------------------------------------------------

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Path builders (they only BUILD paths; they don't begin or fill)
// ---------------------------------------------------------------------------

export function ellipsePath(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
}

export function circlePath(ctx: Ctx, x: number, y: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2);
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[]) {
  const rr = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = rr.map((v) => Math.min(v, w / 2, h / 2));
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

export function polyPath(ctx: Ctx, pts: Pt[], closed = true) {
  if (!pts.length) return;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
}

/**
 * Smooth closed (or open) curve through points (Catmull-Rom → Bézier).
 * Great for organic blobs, leaves, sauce splats, pasta.
 */
export function smoothPath(ctx: Ctx, pts: Pt[], closed = true, tension = 0.5) {
  const n = pts.length;
  if (n < 2) return;
  const get = (i: number): Pt => {
    if (closed) return pts[((i % n) + n) % n];
    return pts[Math.max(0, Math.min(n - 1, i))];
  };
  ctx.moveTo(pts[0][0], pts[0][1]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const t = tension / 3;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}

/** Wobbly blob (organic circle) — r varies with deterministic noise. */
export function blobPath(ctx: Ctx, x: number, y: number, rx: number, ry: number, wobble = 0.12, points = 10, seed = 1) {
  const R = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const k = 1 + (R() * 2 - 1) * wobble;
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  smoothPath(ctx, pts, true);
}

/** Star / spiky polygon path. */
export function starPath(ctx: Ctx, x: number, y: number, rOuter: number, rInner: number, points: number, rot = -Math.PI / 2) {
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = rot + (i / (points * 2)) * Math.PI * 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Shapes with full Trattoria-Toon treatment
// ---------------------------------------------------------------------------

export interface ShapeStyle {
  fill: Fill;
  /** outline width; 0 disables. default INK_W */
  ink?: number;
  inkColor?: string;
  /** cel-shadow colour; default shade(fill) when fill is a hex string. 'none' disables */
  shadow?: string | 'none';
  /** offset of the lit copy (toward light) — larger = thicker shadow crescent. default [-2.2,-2.6] */
  shadowOffset?: Pt;
  /** highlight spot(s), drawn clipped inside the shape */
  gloss?: { x: number; y: number; rx: number; ry: number; rot?: number; alpha?: number; color?: string }[];
  /** rim light colour on upper-left edge (subtle) */
  rim?: string;
}

/**
 * Draw a shape with outline + fill + cel shadow + gloss.
 * `build` must add sub-paths to the current path (no beginPath needed).
 */
export function shape(ctx: Ctx, build: (c: Ctx) => void, st: ShapeStyle) {
  const ink = st.ink ?? INK_W;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // outline (stroke first, so fill covers inner half → clean outer outline)
  if (ink > 0) {
    ctx.beginPath();
    build(ctx);
    ctx.lineWidth = ink * 2;
    ctx.strokeStyle = st.inkColor ?? INK;
    ctx.stroke();
  }
  ctx.beginPath();
  build(ctx);
  ctx.fillStyle = st.fill;
  ctx.fill();

  const shadowCol = st.shadow === 'none' ? null : st.shadow ?? (typeof st.fill === 'string' ? shade(st.fill) : null);
  const needClip = !!shadowCol || (st.gloss && st.gloss.length) || st.rim;
  if (needClip) {
    ctx.save();
    ctx.beginPath();
    build(ctx);
    ctx.clip();
    if (shadowCol) {
      // fill everything with shadow, then the lit copy shifted toward the light
      const [ox, oy] = st.shadowOffset ?? [-2.2, -2.6];
      ctx.fillStyle = shadowCol;
      ctx.fillRect(-4000, -4000, 8000, 8000);
      ctx.translate(ox, oy);
      ctx.beginPath();
      build(ctx);
      ctx.fillStyle = st.fill;
      ctx.fill();
      ctx.translate(-ox, -oy);
    }
    if (st.rim) {
      const [ox, oy] = st.shadowOffset ?? [-2.2, -2.6];
      ctx.save();
      ctx.beginPath();
      build(ctx);
      ctx.translate(-ox * 0.5, -oy * 0.5);
      ctx.lineWidth = Math.abs(ox) * 0.9;
      ctx.strokeStyle = st.rim;
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.restore();
    }
    if (st.gloss) {
      for (const g of st.gloss) {
        ctx.beginPath();
        ellipsePath(ctx, g.x, g.y, g.rx, g.ry, g.rot ?? 0);
        ctx.fillStyle = g.color ?? '#ffffff';
        ctx.globalAlpha = g.alpha ?? 0.75;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Same as shape() but only outline+flat fill (for small details). */
export function flat(ctx: Ctx, build: (c: Ctx) => void, fill: Fill, ink = INK_W * 0.7, inkColor = INK) {
  shape(ctx, build, { fill, ink, inkColor, shadow: 'none' });
}

/**
 * Draw outlines of several parts FIRST, then fill them, so the group has one
 * unified silhouette outline (no inner lines where parts overlap).
 */
export function group(ctx: Ctx, parts: { build: (c: Ctx) => void; style: ShapeStyle }[], ink = INK_W, inkColor = INK) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = ink * 2;
  for (const p of parts) {
    ctx.beginPath();
    p.build(ctx);
    ctx.stroke();
  }
  ctx.restore();
  for (const p of parts) shape(ctx, p.build, { ...p.style, ink: 0 });
}

/** A soft line (detail strokes inside shapes, e.g. creases, seams). */
export function line(ctx: Ctx, pts: Pt[], width: number, color: string, smooth = false, alpha = 1) {
  ctx.save();
  ctx.beginPath();
  if (smooth) smoothPath(ctx, pts, false);
  else polyPath(ctx, pts, false);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.restore();
}

/** Inked line: dark outline stroke then coloured stroke on top (noodles, stems, wires). */
export function inkLine(ctx: Ctx, pts: Pt[], width: number, color: string, smooth = true, ink = INK_W * 0.8) {
  line(ctx, pts, width + ink * 2, INK, smooth);
  line(ctx, pts, width, color, smooth);
}

/** Small glossy highlight (specular dot/streak). */
export function glint(ctx: Ctx, x: number, y: number, rx: number, ry = rx * 0.6, rot = -0.6, alpha = 0.9) {
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, x, y, rx, ry, rot);
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.restore();
}

/** Scatter little marks inside an ellipse (seeds, pores, crumbs, speckles). */
export function speckle(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  color: string,
  size: number,
  seed = 7,
  alpha = 1,
) {
  const R = rng(seed);
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R());
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const s = size * (0.6 + R() * 0.7);
    ctx.beginPath();
    ellipsePath(ctx, x, y, s, s * (0.6 + R() * 0.5), R() * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Faces — the soul of every character
// ---------------------------------------------------------------------------

export type Mood = 'angry' | 'evil' | 'happy' | 'sad' | 'surprised' | 'dizzy' | 'smug' | 'focused';

export interface EyeOpts {
  /** pupil offset in units of eye radius, e.g. [0.2, 0.1] */
  look?: Pt;
  /** iris colour (default none → big black pupil) */
  iris?: string;
  /** pupil size relative to eye radius (default 0.48) */
  pupil?: number;
  /** eyelid: covers top part. 'angry' slants inward, 'half' sleepy, 'none' */
  lid?: 'angry-l' | 'angry-r' | 'half' | 'sad-l' | 'sad-r' | 'none';
  lidColor?: string;
  sclera?: string;
  ink?: number;
  /** vertical squash (ry = r * squash) */
  squash?: number;
  glow?: string;
}

/** A single cartoon eye centred at (x,y). */
export function eye(ctx: Ctx, x: number, y: number, r: number, o: EyeOpts = {}) {
  const ry = r * (o.squash ?? 1.12);
  const ink = o.ink ?? Math.max(1.1, r * 0.28);
  ctx.save();
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = r * 2;
  }
  // sclera
  ctx.beginPath();
  ellipsePath(ctx, x, y, r, ry);
  ctx.lineWidth = ink * 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = o.sclera ?? '#fffaf0';
  ctx.fill();
  // pupil
  ctx.save();
  ctx.beginPath();
  ellipsePath(ctx, x, y, r, ry);
  ctx.clip();
  const [lx, ly] = o.look ?? [0.12, 0.08];
  const pr = r * (o.pupil ?? 0.5);
  const px = x + lx * r, py = y + ly * r;
  if (o.iris) {
    ctx.beginPath();
    circlePath(ctx, px, py, pr * 1.45);
    ctx.fillStyle = o.iris;
    ctx.fill();
  }
  ctx.beginPath();
  circlePath(ctx, px, py, pr);
  ctx.fillStyle = INK;
  ctx.fill();
  // highlight
  ctx.beginPath();
  circlePath(ctx, px - pr * 0.4, py - pr * 0.45, pr * 0.38);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // lid
  const lid = o.lid ?? 'none';
  if (lid !== 'none') {
    ctx.fillStyle = o.lidColor ?? INK;
    ctx.beginPath();
    if (lid === 'angry-l' || lid === 'angry-r') {
      // slanted lid: inner corner low
      const inner = lid === 'angry-l' ? 1 : -1; // left eye: inner side is +x
      ctx.moveTo(x - r * 1.3, y - ry * 1.3);
      ctx.lineTo(x + r * 1.3, y - ry * 1.3);
      ctx.lineTo(x + r * 1.3 * inner, y - ry * 0.05);
      ctx.lineTo(x - r * 1.3 * inner, y - ry * 0.75);
      ctx.closePath();
    } else if (lid === 'sad-l' || lid === 'sad-r') {
      const outer = lid === 'sad-l' ? -1 : 1;
      ctx.moveTo(x - r * 1.3, y - ry * 1.3);
      ctx.lineTo(x + r * 1.3, y - ry * 1.3);
      ctx.lineTo(x + r * 1.3 * outer, y - ry * 0.1);
      ctx.lineTo(x - r * 1.3 * outer, y - ry * 0.7);
      ctx.closePath();
    } else {
      ctx.rect(x - r * 1.3, y - ry * 1.3, r * 2.6, ry * 1.05);
    }
    ctx.fill();
    // lid line
  }
  ctx.restore();
  ctx.restore();
}

/** Thick eyebrow stroke. angle>0 = inner end lower (angry) for the LEFT brow. */
export function brow(ctx: Ctx, x: number, y: number, len: number, angle: number, thick: number, color = INK) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  // tapered brow
  ctx.moveTo(-len / 2, thick * 0.15);
  ctx.quadraticCurveTo(0, -thick * 0.9, len / 2, -thick * 0.1);
  ctx.quadraticCurveTo(0, thick * 0.6, -len / 2, thick * 0.15);
  ctx.closePath();
  ctx.lineWidth = thick;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export interface FaceOpts {
  mood?: Mood;
  /** eye radius */
  eyeR?: number;
  /** distance between eye centres */
  spacing?: number;
  look?: Pt;
  iris?: string;
  mouthW?: number;
  mouthY?: number;
  /** show brows (default true for angry/evil/sad/surprised) */
  brows?: boolean;
  teeth?: boolean;
  tongue?: boolean;
  blush?: string | null;
  mouthOpen?: number;
}

/**
 * Complete cartoon face centred at (x,y) (= midpoint between the eyes).
 * Mood drives eye lids, brows and mouth.
 */
export function face(ctx: Ctx, x: number, y: number, o: FaceOpts = {}) {
  const mood = o.mood ?? 'angry';
  const r = o.eyeR ?? 4;
  const sp = o.spacing ?? r * 2.6;
  const look = o.look ?? [0.1, 0.12];
  const lx = x - sp / 2, rx = x + sp / 2;
  let lidL: EyeOpts['lid'] = 'none', lidR: EyeOpts['lid'] = 'none';
  if (mood === 'angry' || mood === 'evil' || mood === 'focused') { lidL = 'angry-l'; lidR = 'angry-r'; }
  if (mood === 'sad') { lidL = 'sad-l'; lidR = 'sad-r'; }
  if (mood === 'smug') { lidL = 'half'; lidR = 'half'; }
  const pupil = mood === 'surprised' ? 0.3 : mood === 'evil' ? 0.38 : 0.5;
  if (mood === 'dizzy') {
    // spiral eyes
    for (const ex of [lx, rx]) {
      ctx.save();
      ctx.beginPath();
      ellipsePath(ctx, ex, y, r, r * 1.1);
      ctx.lineWidth = r * 0.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = '#fffaf0';
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < 40; i++) {
        const a = i * 0.45;
        const d = (i / 40) * r * 0.85;
        const px = ex + Math.cos(a) * d, py = y + Math.sin(a) * d;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineWidth = r * 0.22;
      ctx.stroke();
      ctx.restore();
    }
  } else if (mood === 'happy') {
    // closed happy arcs ^^
    for (const ex of [lx, rx]) {
      line(ctx, [[ex - r, y + r * 0.3], [ex, y - r * 0.6], [ex + r, y + r * 0.3]], r * 0.55, INK, true);
    }
  } else {
    eye(ctx, lx, y, r, { look, lid: lidL, pupil, iris: o.iris });
    eye(ctx, rx, y, r, { look, lid: lidR, pupil, iris: o.iris });
  }
  const showBrows = o.brows ?? (mood === 'angry' || mood === 'evil' || mood === 'sad' || mood === 'surprised' || mood === 'focused');
  if (showBrows) {
    const by = y - r * (mood === 'surprised' ? 1.95 : 1.35);
    const bl = r * 1.7;
    const th = Math.max(1.2, r * 0.42);
    let ang = 0.42;
    if (mood === 'sad') ang = -0.38;
    if (mood === 'surprised') ang = -0.15;
    if (mood === 'focused') ang = 0.25;
    if (mood === 'evil') ang = 0.55;
    brow(ctx, lx, by, bl, ang, th);
    brow(ctx, rx, by, bl, -ang, th);
  }
  if (o.blush) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = o.blush;
    ctx.beginPath();
    ellipsePath(ctx, lx - r * 0.5, y + r * 1.7, r * 0.9, r * 0.5);
    ellipsePath(ctx, rx + r * 0.5, y + r * 1.7, r * 0.9, r * 0.5);
    ctx.fill();
    ctx.restore();
  }
  // mouth
  const mw = o.mouthW ?? sp * 0.9;
  const my = y + (o.mouthY ?? r * 2.4);
  const kind: MouthKind =
    mood === 'angry' ? 'snarl' : mood === 'evil' ? 'grin' : mood === 'happy' ? 'smile' : mood === 'sad' ? 'frown' :
    mood === 'surprised' ? 'o' : mood === 'dizzy' ? 'wavy' : mood === 'smug' ? 'smirk' : 'flat';
  mouth(ctx, x, my, mw, kind, { teeth: o.teeth ?? true, tongue: o.tongue ?? false, open: o.mouthOpen });
}

export type MouthKind = 'snarl' | 'grin' | 'smile' | 'frown' | 'o' | 'wavy' | 'smirk' | 'flat' | 'shout';

export function mouth(ctx: Ctx, x: number, y: number, w: number, kind: MouthKind, o: { teeth?: boolean; tongue?: boolean; open?: number } = {}) {
  const ink = Math.max(1, w * 0.12);
  const inside = '#5b1320';
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const fillMouth = (build: () => void, teeth: 'top' | 'both' | 'none', tongue: boolean) => {
    ctx.beginPath();
    build();
    ctx.lineWidth = ink * 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = inside;
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    build();
    ctx.clip();
    if (tongue) {
      ctx.beginPath();
      ellipsePath(ctx, x + w * 0.1, y + w * 0.32, w * 0.32, w * 0.2);
      ctx.fillStyle = '#e8616e';
      ctx.fill();
    }
    if (teeth !== 'none') {
      ctx.fillStyle = '#fff8ea';
      ctx.fillRect(x - w, y - w, w * 2, w * 0.86);
      if (teeth === 'both') ctx.fillRect(x - w, y + w * 0.16, w * 2, w);
      // tooth gaps
      ctx.strokeStyle = 'rgba(80,40,30,0.35)';
      ctx.lineWidth = Math.max(0.5, w * 0.05);
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(x + i * w * 0.2, y - w);
        ctx.lineTo(x + i * w * 0.2, y - w * 0.14);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
  const open = o.open ?? 1;
  switch (kind) {
    case 'snarl':
      fillMouth(() => {
        ctx.moveTo(x - w / 2, y - w * 0.06);
        ctx.quadraticCurveTo(x, y - w * 0.28, x + w / 2, y - w * 0.12);
        ctx.quadraticCurveTo(x + w * 0.1, y + w * 0.42 * open, x - w / 2, y - w * 0.06);
        ctx.closePath();
      }, o.teeth === false ? 'none' : 'both', !!o.tongue);
      break;
    case 'grin':
      fillMouth(() => {
        ctx.moveTo(x - w / 2, y - w * 0.12);
        ctx.quadraticCurveTo(x, y + w * 0.02, x + w / 2, y - w * 0.12);
        ctx.quadraticCurveTo(x, y + w * 0.62 * open, x - w / 2, y - w * 0.12);
        ctx.closePath();
      }, o.teeth === false ? 'none' : 'top', o.tongue ?? true);
      break;
    case 'shout':
      fillMouth(() => {
        ellipsePath(ctx, x, y + w * 0.12, w * 0.42, w * 0.38 * open);
      }, 'top', true);
      break;
    case 'o':
      fillMouth(() => {
        ellipsePath(ctx, x, y + w * 0.05, w * 0.2, w * 0.26 * open);
      }, 'none', false);
      break;
    case 'smile':
      fillMouth(() => {
        ctx.moveTo(x - w / 2, y - w * 0.1);
        ctx.quadraticCurveTo(x, y - w * 0.02, x + w / 2, y - w * 0.1);
        ctx.quadraticCurveTo(x, y + w * 0.5 * open, x - w / 2, y - w * 0.1);
        ctx.closePath();
      }, 'top', true);
      break;
    case 'frown':
      line(ctx, [[x - w / 2, y + w * 0.15], [x, y - w * 0.12], [x + w / 2, y + w * 0.15]], ink * 1.6, INK, true);
      break;
    case 'smirk':
      line(ctx, [[x - w / 2, y], [x + w * 0.1, y + w * 0.08], [x + w / 2, y - w * 0.16]], ink * 1.6, INK, true);
      break;
    case 'wavy':
      line(ctx, [[x - w / 2, y], [x - w / 4, y - w * 0.1], [x, y], [x + w / 4, y - w * 0.1], [x + w / 2, y]], ink * 1.5, INK, true);
      break;
    case 'flat':
    default:
      line(ctx, [[x - w / 2, y], [x + w / 2, y]], ink * 1.5, INK);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Limbs
// ---------------------------------------------------------------------------

/**
 * Stubby cartoon legs with a 4-frame walk cycle (frame 0..3).
 * (x,y) = hip centre; legs extend downward by `len`.
 */
export function legs(
  ctx: Ctx,
  x: number,
  y: number,
  frame: number,
  o: { len?: number; spread?: number; thick?: number; color?: string; shoe?: string; stride?: number } = {},
) {
  const len = o.len ?? 8;
  const spread = o.spread ?? 6;
  const thick = o.thick ?? 3.2;
  const color = o.color ?? INK;
  const shoe = o.shoe ?? INK;
  const stride = o.stride ?? 3.2;
  const phase = (frame % 4) / 4 * Math.PI * 2;
  for (const side of [-1, 1]) {
    const s = Math.sin(phase + (side < 0 ? 0 : Math.PI));
    const lift = Math.max(0, -Math.cos(phase + (side < 0 ? 0 : Math.PI))) * 2.2;
    const fx = x + side * spread * 0.5 + s * stride * 0.5;
    const fy = y + len - lift;
    inkLine(ctx, [[x + side * spread * 0.35, y], [fx, fy]], thick, color, false, 1.2);
    // shoe
    shape(ctx, (c) => ellipsePath(c, fx + side * 0.9, fy + 0.6, thick * 1.05, thick * 0.7), { fill: shoe, ink: 1.2, shadow: 'none', gloss: [{ x: fx + side * 0.6 - 0.6, y: fy - 0.2, rx: thick * 0.4, ry: thick * 0.22, alpha: 0.35 }] });
  }
}

/** Little arm with a round hand (mitten). */
export function arm(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, o: { color?: string; hand?: string; thick?: number; handR?: number } = {}) {
  const thick = o.thick ?? 2.6;
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.15;
  const my = (y1 + y2) / 2 - (x2 - x1) * 0.15;
  inkLine(ctx, [[x1, y1], [mx, my], [x2, y2]], thick, o.color ?? INK, true, 1.1);
  if (o.hand !== undefined || o.handR) {
    shape(ctx, (c) => circlePath(c, x2, y2, o.handR ?? thick * 1.05), { fill: o.hand ?? '#ffffff', ink: 1.1, shadowOffset: [-0.8, -0.9] });
  }
}

// ---------------------------------------------------------------------------
// Effects helpers (usable at runtime too)
// ---------------------------------------------------------------------------

/** Radial glow (additive-friendly). */
export function glow(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.4, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  circlePath(ctx, x, y, r);
  ctx.fill();
}

/** Sauce splat silhouette path (for decals / impacts). */
export function splatPath(ctx: Ctx, x: number, y: number, r: number, seed = 3, drops = 7) {
  const R = rng(seed);
  const pts: Pt[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.72 + R() * 0.45;
    pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.8]);
  }
  smoothPath(ctx, pts, true);
  for (let i = 0; i < drops; i++) {
    const a = R() * Math.PI * 2;
    const d = r * (1.15 + R() * 0.7);
    const s = r * (0.08 + R() * 0.14);
    circlePath(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, s);
  }
}

/** Linear gradient helper (top→bottom). */
export function vgrad(ctx: Ctx, y0: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** Radial gradient helper. */
export function rgrad(ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][], fx?: number, fy?: number) {
  const g = ctx.createRadialGradient(fx ?? x, fy ?? y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** "Volume" fill: radial gradient lit from the upper-left. */
export function volume(ctx: Ctx, x: number, y: number, r: number, base: string, amt = 0.28) {
  return rgrad(ctx, x - r * 0.35, y - r * 0.4, r * 0.05, r * 1.25, [
    [0, light(base, amt)],
    [0.55, base],
    [1, shade(base, amt * 0.6)],
  ]);
}
