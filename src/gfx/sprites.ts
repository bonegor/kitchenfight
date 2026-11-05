/**
 * Sprite registry + high-resolution cache.
 *
 * Art modules call `defineSprite({...})` at import time. Nothing is rendered
 * until first use (or `prerenderAll()` during loading). Each frame is painted
 * once into an offscreen canvas at RES pixels per world unit and then blitted.
 */
import type { Ctx } from './painter';

/** Pixels per world unit used for cached sprites. */
export const RES = 2;

export interface SpriteSpec {
  /** Namespaced id, e.g. 'enemy.pineapple', 'chef.enzo', 'prop.kitchen.stove' */
  id: string;
  /** Drawing box size in world units. Anything outside is clipped. */
  w: number;
  h: number;
  /** Anchor (origin of draw()) measured from the box's top-left, world units. Default: box centre. */
  ax?: number;
  ay?: number;
  /** Number of animation frames (draw() receives 0..frames-1). Default 1. */
  frames?: number;
  /** Generate a white hit-flash silhouette of frame 0. Default false. */
  flash?: boolean;
  /** Override cache resolution (pixels per world unit). */
  res?: number;
  /** Paint the sprite. Origin (0,0) = anchor. World units. */
  draw(ctx: Ctx, frame: number): void;
}

export interface Sprite {
  id: string;
  w: number;
  h: number;
  ax: number;
  ay: number;
  res: number;
  frames: HTMLCanvasElement[];
  flash: HTMLCanvasElement | null;
}

const specs = new Map<string, SpriteSpec>();
const cache = new Map<string, Sprite>();
const tintCache = new Map<string, HTMLCanvasElement>();

export function defineSprite(spec: SpriteSpec): void {
  if (specs.has(spec.id)) console.warn('[sprites] duplicate sprite id', spec.id);
  specs.set(spec.id, spec);
  cache.delete(spec.id);
}

export function hasSprite(id: string): boolean {
  return specs.has(id);
}

export function spriteIds(prefix = ''): string[] {
  return [...specs.keys()].filter((k) => k.startsWith(prefix));
}

export function spriteSpec(id: string): SpriteSpec | undefined {
  return specs.get(id);
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function renderFrame(spec: SpriteSpec, frame: number, res: number): HTMLCanvasElement {
  const c = makeCanvas(spec.w * res, spec.h * res);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(res, res);
  ctx.translate(spec.ax ?? spec.w / 2, spec.ay ?? spec.h / 2);
  try {
    spec.draw(ctx, frame);
  } catch (e) {
    console.error('[sprites] draw failed for', spec.id, e);
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(-4, -4, 8, 8);
  }
  return c;
}

function silhouette(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

const MISSING: SpriteSpec = {
  id: '__missing',
  w: 24,
  h: 24,
  draw(ctx) {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.fillStyle = '#000';
    ctx.fillRect(-10, -10, 10, 10);
    ctx.fillRect(0, 0, 10, 10);
  },
};

export function getSprite(id: string): Sprite {
  let s = cache.get(id);
  if (s) return s;
  let spec = specs.get(id);
  if (!spec) {
    console.warn('[sprites] missing sprite', id);
    spec = { ...MISSING, id };
    specs.set(id, spec);
  }
  const res = spec.res ?? RES;
  const n = Math.max(1, spec.frames ?? 1);
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < n; i++) frames.push(renderFrame(spec, i, res));
  s = {
    id,
    w: spec.w,
    h: spec.h,
    ax: spec.ax ?? spec.w / 2,
    ay: spec.ay ?? spec.h / 2,
    res,
    frames,
    flash: spec.flash ? silhouette(frames[0], '#ffffff') : null,
  };
  cache.set(id, s);
  return s;
}

/** Coloured silhouette of a sprite frame (cached) — used for elite glows, freeze tint, etc. */
export function getTinted(id: string, color: string, frame = 0): HTMLCanvasElement {
  const key = id + '|' + color + '|' + frame;
  let c = tintCache.get(key);
  if (!c) {
    const s = getSprite(id);
    c = silhouette(s.frames[frame % s.frames.length], color);
    tintCache.set(key, c);
  }
  return c;
}

/** Render all (or some) sprites up-front, yielding to the browser between batches. */
export async function prerenderAll(prefixes: string[] | null, onProgress?: (p: number) => void): Promise<void> {
  const ids = [...specs.keys()].filter((id) => !prefixes || prefixes.some((p) => id.startsWith(p)));
  let i = 0;
  let last = performance.now();
  for (const id of ids) {
    getSprite(id);
    i++;
    if (performance.now() - last > 12) {
      onProgress?.(i / ids.length);
      await new Promise((r) => setTimeout(r, 0));
      last = performance.now();
    }
  }
  onProgress?.(1);
}

/**
 * Draw a sprite into a context whose transform is in WORLD UNITS.
 * Fast path when no rotation/scale.
 */
export function drawSprite(
  ctx: Ctx,
  id: string,
  frame: number,
  x: number,
  y: number,
  scaleX = 1,
  scaleY = 1,
  rot = 0,
): void {
  const s = getSprite(id);
  const img = s.frames[((frame % s.frames.length) + s.frames.length) % s.frames.length];
  if (rot === 0 && scaleX === 1 && scaleY === 1) {
    ctx.drawImage(img, x - s.ax, y - s.ay, s.w, s.h);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(img, -s.ax, -s.ay, s.w, s.h);
  ctx.restore();
}

/** Draw an arbitrary cached canvas belonging to sprite `s` (flash/tint) with the sprite's geometry. */
export function drawSpriteCanvas(ctx: Ctx, s: Sprite, img: HTMLCanvasElement, x: number, y: number, scaleX = 1, scaleY = 1, rot = 0) {
  if (rot === 0 && scaleX === 1 && scaleY === 1) {
    ctx.drawImage(img, x - s.ax, y - s.ay, s.w, s.h);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(img, -s.ax, -s.ay, s.w, s.h);
  ctx.restore();
}

/** PNG data URL of a sprite frame (for DOM <img> icons/portraits). Cached. */
const urlCache = new Map<string, string>();
export function spriteURL(id: string, frame = 0, pad = 0): string {
  const key = id + '#' + frame + '#' + pad;
  let u = urlCache.get(key);
  if (u) return u;
  const s = getSprite(id);
  const src = s.frames[frame % s.frames.length];
  if (pad) {
    const c = makeCanvas(src.width + pad * 2, src.height + pad * 2);
    c.getContext('2d')!.drawImage(src, pad, pad);
    u = c.toDataURL('image/png');
  } else {
    u = src.toDataURL('image/png');
  }
  urlCache.set(key, u);
  return u;
}
