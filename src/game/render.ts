/**
 * Renderer: draws a Run (world, entities, effects, lighting, post).
 */
import type { Run } from './run';
import type { Enemy, Projectile, Pickup, Area } from './entities';
import type { PropInst } from './world';
import { getSprite, drawSprite, getTinted, hasSprite, drawSpriteCanvas, setFastBase, clearFastBase } from '../gfx/sprites';
import { TAU, clamp } from '../core/math';
import { rgba } from '../gfx/painter';
import type { Input } from '../core/input';

export const FONT = "'Lilita One', 'Trebuchet MS', system-ui, sans-serif";

interface DrawItem {
  y: number;
  k: 0 | 1 | 2 | 3; // prop, enemy, player, projectile
  ref: any;
}

interface Mote {
  x: number; y: number; vx: number; vy: number; s: number; a: number; t: number;
}

const glowCache = new Map<string, HTMLCanvasElement>();
function glowSprite(color: string): HTMLCanvasElement {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(color, 0.9));
  gr.addColorStop(0.35, rgba(color, 0.4));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}

let lightBrush: HTMLCanvasElement | null = null;
function getLightBrush() {
  if (lightBrush) return lightBrush;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.75)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  lightBrush = c;
  return c;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr = 1;
  W = 800; // css px
  H = 600;
  zoom = 1;
  private items: DrawItem[] = [];
  private light: HTMLCanvasElement;
  private lctx: CanvasRenderingContext2D;
  private vignette: HTMLCanvasElement | null = null;
  private motes: Mote[] = [];
  private t = 0;
  quality: 'high' | 'low' = 'high';
  profile = false;
  prof: Record<string, number> = {};
  private pt = 0;
  private mark(name: string) {
    if (!this.profile) return;
    const now = performance.now();
    this.prof[name] = (this.prof[name] ?? 0) + (now - this.pt);
    this.pt = now;
  }
  camX = 0;
  camY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.light = document.createElement('canvas');
    this.lctx = this.light.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dprCap = this.quality === 'low' ? 1 : 2;
    this.dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    // area-based zoom: ~1100x620 world units on a 16:9 screen
    this.zoom = clamp(Math.sqrt((this.W * this.H) / (1100 * 620)), 0.62, 2.6);
    this.light.width = Math.ceil(this.W / 2);
    this.light.height = Math.ceil(this.H / 2);
    this.vignette = null;
  }

  private buildVignette() {
    const c = document.createElement('canvas');
    c.width = Math.ceil(this.W / 2);
    c.height = Math.ceil(this.H / 2);
    const g = c.getContext('2d')!;
    const r = Math.hypot(c.width, c.height) / 2;
    const gr = g.createRadialGradient(c.width / 2, c.height / 2, r * 0.45, c.width / 2, c.height / 2, r);
    gr.addColorStop(0, 'rgba(20,8,4,0)');
    gr.addColorStop(1, 'rgba(20,8,4,0.55)');
    g.fillStyle = gr;
    g.fillRect(0, 0, c.width, c.height);
    this.vignette = c;
  }

  /** Update camera + run.view (call before run.update so spawns use current view). */
  updateCamera(run: Run, dt: number, snap = false) {
    const p = run.player;
    const lead = 0.18;
    const tx = p.x + p.vx * lead;
    const ty = p.y - 14 + p.vy * lead;
    const k = snap ? 1 : 1 - Math.exp(-6 * dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    const hw = this.W / this.zoom / 2, hh = this.H / this.zoom / 2;
    run.view.x0 = this.camX - hw;
    run.view.x1 = this.camX + hw;
    run.view.y0 = this.camY - hh;
    run.view.y1 = this.camY + hh;
    run.camX = this.camX;
    run.camY = this.camY;
  }

  render(run: Run, dt: number, input: Input | null) {
    this.t += dt;
    const ctx = this.ctx;
    const env = run.world.env;
    const z = this.zoom * this.dpr;
    const sx = run.fx.shakeX, sy = run.fx.shakeY;
    const ox = Math.round((this.W / 2 - this.camX * this.zoom + sx) * this.dpr);
    const oy = Math.round((this.H / 2 - this.camY * this.zoom + sy) * this.dpr);
    ctx.setTransform(z, 0, 0, z, ox, oy);
    setFastBase(z, ox, oy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    const v = run.view;
    const x0 = v.x0 - 8, y0 = v.y0 - 8, x1 = v.x1 + 8, y1 = v.y1 + 8;
    if (this.profile) this.pt = performance.now();

    // ------------------------------------------------ floor
    const ts = env.tileSize;
    const ov = 1 / this.zoom;
    for (let ty = Math.floor(y0 / ts); ty * ts < y1; ty++) {
      for (let tx = Math.floor(x0 / ts); tx * ts < x1; tx++) {
        const s = getSprite(env.tile(tx, ty));
        ctx.drawImage(s.frames[0], tx * ts, ty * ts, ts + ov, ts + ov);
      }
    }
    this.mark('tiles');
    // floor props
    run.world.update(v.x0, v.y0, v.x1, v.y1, dt);
    const vis = run.world.visible;
    for (const p of vis) if (p.layer === 'floor') this.drawProp(p);
    // decals
    run.fx.drawDecals(ctx, x0, y0, x1, y1);
    // areas
    for (const a of run.areas) if (a.alive) this.drawArea(a);
    // aura weapons
    this.drawAuras(run);
    // pickups (shadows batched in one path)
    ctx.fillStyle = 'rgba(30,16,10,0.22)';
    ctx.beginPath();
    for (const p of run.pickups) {
      if (!p.alive || p.x < x0 - 30 || p.x > x1 + 30 || p.y < y0 - 30 || p.y > y1 + 40) continue;
      ctx.moveTo(p.x + p.r * 0.8, p.y + p.r * 0.7);
      ctx.ellipse(p.x, p.y + p.r * 0.7, p.r * 0.8, p.r * 0.3, 0, 0, TAU);
    }
    ctx.fill();
    for (const p of run.pickups) if (p.alive && p.x > x0 - 30 && p.x < x1 + 30 && p.y > y0 - 30 && p.y < y1 + 40) this.drawPickup(p);
    // ground particles
    run.fx.drawParticles(ctx, 0, x0, y0, x1, y1);
    this.mark('ground');

    // ------------------------------------------------ shadows
    ctx.fillStyle = 'rgba(30,16,10,0.26)';
    ctx.beginPath();
    for (const e of run.enemies) {
      if (!e.alive || e.x < x0 - 80 || e.x > x1 + 80 || e.y < y0 - 80 || e.y > y1 + 120) continue;
      const sh = (e.def.shadow ?? 1) * e.r;
      const k = 1 - Math.min(0.5, e.z / 120);
      ctx.moveTo(e.x + sh * 1.05 * k, e.y + e.r * 0.92);
      ctx.ellipse(e.x, e.y + e.r * 0.92, sh * 1.05 * k, sh * 0.4 * k, 0, 0, TAU);
    }
    const pl = run.player;
    ctx.moveTo(pl.x + 16, pl.y + 19);
    ctx.ellipse(pl.x, pl.y + 19, 16, 6, 0, 0, TAU);
    ctx.fill();

    // ------------------------------------------------ y-sorted
    const items = this.items;
    items.length = 0;
    for (const p of vis) if (!p.layer || p.layer === 'sorted') items.push({ y: p.y + (p.sortOffset ?? 0), k: 0, ref: p });
    for (const e of run.enemies) {
      if (!e.alive || e.x < x0 - 120 || e.x > x1 + 120 || e.y < y0 - 60 || e.y > y1 + 200) continue;
      items.push({ y: e.y + e.r * 0.9, k: 1, ref: e });
    }
    items.push({ y: pl.y + 18, k: 2, ref: pl });
    for (const p of run.projectiles) if (p.alive && p.layer === 0) items.push({ y: p.y + p.r * 0.9, k: 3, ref: p });
    items.sort((a, b) => a.y - b.y);
    this.mark('shadows+sort');
    for (const it of items) {
      if (it.k === 0) this.drawProp(it.ref);
      else if (it.k === 1) this.drawEnemy(run, it.ref);
      else if (it.k === 2) this.drawPlayer(run);
      else this.drawProjectile(run, it.ref);
    }

    this.mark('sorted');
    // ------------------------------------------------ air layer
    for (const p of run.projectiles) if (p.alive && p.layer === 1) this.drawProjectile(run, p);
    this.drawShots(run);
    run.fx.drawParticles(ctx, 1, x0, y0, x1, y1);
    for (const p of vis) if (p.layer === 'overhead') this.drawProp(p, true);
    this.emitPropFx(run, vis, dt);

    this.mark('air');
    // ------------------------------------------------ lighting
    let darkness = env.ambient.darkness;
    const ramp = run.stage.nightRamp;
    if (ramp) darkness = ramp[0] + (ramp[1] - ramp[0]) * clamp(run.time / 900, 0, 1);
    run.darkness = darkness;
    // ambient tint (multiply)
    clearFastBase();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (env.ambient.tint && env.ambient.tint !== '#ffffff') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = env.ambient.tint;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (darkness > 0.01) this.drawLighting(run, vis, darkness, env.ambient.darkColor);

    this.mark('lighting');
    // texts & bubbles (world space, above lighting)
    ctx.setTransform(z, 0, 0, z, ox, oy);
    setFastBase(z, ox, oy);
    run.fx.drawTexts(ctx, FONT);
    run.fx.drawBubbles(ctx, FONT);
    this.drawIndicators(run);

    this.mark('texts');
    // ------------------------------------------------ screen space post
    clearFastBase();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawMotes(run, env.ambient.particles ?? 'none', dt);
    if (!this.vignette) this.buildVignette();
    ctx.globalAlpha = clamp(env.ambient.vignette ?? 0.6, 0, 1) + 0.15;
    ctx.drawImage(this.vignette!, 0, 0, this.canvas.width, this.canvas.height);
    ctx.globalAlpha = 1;
    // freeze tint
    if (run.freezeT > 0) {
      ctx.fillStyle = `rgba(150,215,255,${Math.min(0.22, run.freezeT * 0.1)})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // hurt + low hp
    const lowHp = run.player.hp < run.stats.maxHp * 0.3 && run.state !== 'dead';
    const hurt = Math.max(run.fx.hurt, lowHp ? 0.25 + 0.2 * Math.sin(this.t * 6) : 0);
    if (hurt > 0.01) {
      const g = ctx.createRadialGradient(this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) * 0.42, this.canvas.width / 2, this.canvas.height / 2, Math.hypot(this.canvas.width, this.canvas.height) / 2);
      g.addColorStop(0, 'rgba(200,20,10,0)');
      g.addColorStop(1, `rgba(200,20,10,${Math.min(0.5, hurt * 0.45)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (run.fx.flash > 0.01) {
      ctx.fillStyle = rgba(run.fx.flashColor, Math.min(0.85, run.fx.flash * 0.75));
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (input && input.touchActive) this.drawJoystick(input);
    this.mark('post');
  }

  // =====================================================================

  private drawProp(p: PropInst, overhead = false) {
    const ctx = this.ctx;
    let frame = p.frame ?? 0;
    if (p.animFps) frame = Math.floor(this.t * p.animFps + Math.abs(p.x * 0.013)) + frame;
    const shake = p.shake > 0 ? Math.sin(this.t * 70) * p.shake * 2.5 : 0;
    if (overhead) ctx.globalAlpha = 0.92;
    drawSprite(ctx, p.sprite, frame, p.x + shake, p.y, p.flip ? -1 : 1, 1);
    if (p.hitFlash > 0) {
      const s = getSprite(p.sprite);
      ctx.globalAlpha = 0.6;
      drawSpriteCanvas(ctx, s, getTinted(p.sprite, '#ffffff', frame % s.frames.length), p.x + shake, p.y, p.flip ? -1 : 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  private drawEnemy(run: Run, e: Enemy) {
    const ctx = this.ctx;
    const def = e.def;
    let sid = def.sprite;
    let frame = e.boss ? Math.floor(this.t * 7 + e.id) & 3 : Math.floor(e.anim) & 3;
    // behaviour-specific key frames (the art has poses for these)
    if (def.behavior === 'charger') {
      if (e.state === 1) frame = 1;
      else if (e.state === 2) frame = e.timer < 0.12 ? 3 : 1;
    } else if (def.behavior === 'hopper') {
      frame = e.state === 1 ? 3 : e.squash > 0.3 ? 1 : 0;
    } else if (def.behavior === 'burster' || def.behavior === 'ghost') {
      frame = Math.floor(this.t * 11 + e.id) & 3; // spin / waving hem play on a timer
    } else if (def.behavior === 'kamikaze' && e.state === 1) {
      frame = Math.floor(this.t * 16) & 1 ? 1 : 3; // rattling fuse
    }
    if (e.boss && e.attackPose > 0 && hasSprite(sid + '.attack')) {
      sid = sid + '.attack';
      frame = e.telegraph > 0 ? 0 : 1;
    }
    if (def.layers && e.layers < def.layers) {
      const lost = def.layers - e.layers;
      const peeled = def.sprite + (lost === 1 ? '_peel1' : '_peel2');
      if (hasSprite(peeled)) sid = peeled;
    }
    if (!hasSprite(sid)) sid = def.sprite;
    const s = getSprite(sid);
    let scx = e.scale * e.face;
    let scy = e.scale;
    // spawn pop
    let alpha = 1;
    if (e.spawnT > 0) {
      const k = 1 - e.spawnT / 0.35;
      const b = k < 1 ? 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2) : 1;
      scx *= Math.max(0.05, b);
      scy *= Math.max(0.05, b);
      alpha = Math.min(1, k * 2);
    }
    // squash & stretch
    if (e.squash > 0) {
      scx *= 1 + e.squash * 0.22;
      scy *= 1 - e.squash * 0.18;
    }
    const moving = Math.abs(e.vx) + Math.abs(e.vy) > 8;
    const bob = moving && e.z === 0 ? -Math.abs(Math.sin(e.anim * Math.PI * 0.5)) * 1.6 : 0;
    const tilt = moving && !e.boss ? Math.sin(e.anim * Math.PI * 0.5) * 0.06 : 0;
    let x = e.x, y = e.y - e.z + bob;
    // telegraph shake
    if (e.telegraph > 0) x += Math.sin(this.t * 80) * 1.5;
    const ghost = def.behavior === 'ghost' && e.state === 1;
    if (ghost) alpha *= 0.32 + Math.sin(this.t * 10) * 0.06;
    // phased out of existence (invulnerable boss): translucent and shimmering
    if (e.fade > 0) alpha *= 1 - e.fade * (0.74 + Math.sin(this.t * 9 + e.id) * 0.06);
    // elite glow
    if (e.elite) {
      const pulse = 0.55 + Math.sin(this.t * 5 + e.id) * 0.25;
      ctx.globalAlpha = pulse * alpha;
      ctx.globalCompositeOperation = 'lighter';
      drawSpriteCanvas(ctx, s, getTinted(sid, '#ffc83a', frame % s.frames.length), x, y - 2, scx * 1.14, scy * 1.12, tilt);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = alpha;
    drawSpriteCanvas(ctx, s, s.frames[frame % s.frames.length], x, y, scx, scy, tilt);
    // tints
    const frozen = (run.freezeT > 0 && !e.boss) || e.freeze > 0;
    let tint: string | null = null;
    let ta = 0;
    if (e.flash > 0) { tint = '#ffffff'; ta = Math.min(1, e.flash / 0.08); }
    else if (e.telegraph > 0) { tint = '#ff2a1a'; ta = 0.35 + 0.3 * Math.sin(this.t * 30); }
    else if (frozen) { tint = '#8fd4ff'; ta = 0.55; }
    else if (e.burn > 0) { tint = '#ff7a1a'; ta = 0.18 + 0.12 * Math.sin(this.t * 20 + e.id); }
    else if (e.buff > 0) { tint = '#b5f05a'; ta = 0.22; }
    else if (e.slow > 0 && e.slowAmt > 0.2) { tint = '#7de38a'; ta = 0.2; }
    if (tint) {
      ctx.globalAlpha = ta * alpha;
      drawSpriteCanvas(ctx, s, getTinted(sid, tint, frame % s.frames.length), x, y, scx, scy, tilt);
    }
    ctx.globalAlpha = 1;
    // charge telegraph: show the dash lane
    if (e.telegraph > 0 && def.behavior === 'charger' && e.state === 1) {
      const len = (def.params?.dash ?? 400) * (def.params?.dashTime ?? 0.4) + 20;
      const k = clamp(1 - e.telegraph / (def.params?.windup ?? 0.6), 0, 1);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(Math.atan2(e.ay, e.ax));
      ctx.fillStyle = `rgba(255,60,40,${0.12 + k * 0.22})`;
      ctx.fillRect(0, -e.r * 0.8, len, e.r * 1.6);
      ctx.fillStyle = `rgba(255,80,50,${0.35 + k * 0.4})`;
      ctx.fillRect(0, -e.r * 0.8, len * k, e.r * 1.6);
      ctx.restore();
    }
    // onion layers indicator / elite hp bar
    if ((e.elite || e.layers > 0) && e.hp < e.maxHp) {
      const w = e.r * 1.6;
      const hy = y - e.r * 2.1 * e.scale / Math.max(1, e.scale) - 8;
      ctx.fillStyle = 'rgba(30,14,10,0.75)';
      ctx.fillRect(x - w / 2 - 1, hy - 1, w + 2, 5);
      ctx.fillStyle = e.elite ? '#ffc83a' : '#d98ad9';
      ctx.fillRect(x - w / 2, hy, w * clamp(e.hp / e.maxHp, 0, 1), 3);
    }
  }

  private drawPlayer(run: Run) {
    const ctx = this.ctx;
    const p = run.player;
    const sid = run.char.sprite;
    if (!hasSprite(sid)) return;
    const s = getSprite(sid);
    const frame = p.moving ? Math.floor(p.anim) & 3 : 0;
    const breathe = p.moving ? 0 : Math.sin(this.t * 3) * 0.015;
    const bob = p.moving ? -Math.abs(Math.sin(p.anim * Math.PI * 0.5)) * 2 : 0;
    const tilt = p.moving ? Math.sin(p.anim * Math.PI * 0.5) * 0.04 + p.vx * 0.0003 : 0;
    let alpha = 1;
    if (p.iframes > 0 && run.state === 'playing' && !run.autopilot) alpha = Math.sin(this.t * 40) > 0 ? 1 : 0.45;
    if (run.state === 'dying' || run.state === 'dead') {
      const k = clamp(1 - run.deathT / 2.2, 0, 1);
      ctx.globalAlpha = 1;
      drawSpriteCanvas(ctx, s, s.frames[0], p.x, p.y + k * 6, p.face * (1 + k * 0.2), 1 - k * 0.45, p.face * k * 1.4);
      return;
    }
    ctx.globalAlpha = alpha;
    drawSpriteCanvas(ctx, s, s.frames[frame % s.frames.length], p.x, p.y + bob, p.face, 1 + breathe, tilt);
    if (p.hurtT > 0) {
      ctx.globalAlpha = clamp(p.hurtT / 0.3, 0, 1) * 0.5;
      drawSpriteCanvas(ctx, s, getTinted(sid, '#ff3b2f', frame % s.frames.length), p.x, p.y + bob, p.face, 1 + breathe, tilt);
    }
    ctx.globalAlpha = 1;
    // small hp bar under the chef
    const w = 34;
    const hpk = clamp(p.hp / run.stats.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(30,14,10,0.8)';
    ctx.fillRect(p.x - w / 2 - 1.5, p.y + 25, w + 3, 6);
    ctx.fillStyle = hpk > 0.5 ? '#5fd35a' : hpk > 0.25 ? '#ffc23a' : '#ff4b3e';
    ctx.fillRect(p.x - w / 2, p.y + 26.5, w * hpk, 3);
  }

  private drawPickup(p: Pickup) {
    const ctx = this.ctx;
    if (!hasSprite(p.sprite)) return;
    const bob = Math.sin(p.t * 4 + p.x * 0.1) * 1.8 - 2;
    if (p.kind === 'chest') {
      // light beam
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(p.x, p.y - 120, p.x, p.y);
      const col = p.gold ? '255,210,80' : '255,240,200';
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(1, `rgba(${col},${0.35 + Math.sin(p.t * 3) * 0.1})`);
      ctx.fillStyle = g;
      ctx.fillRect(p.x - 14, p.y - 120, 28, 120);
      ctx.globalCompositeOperation = 'source-over';
    }
    let frame = 0;
    if (p.kind === 'coin') frame = Math.floor(p.t * 10) & 3;
    if (p.kind === 'xp' && p.value < 25) {
      // soft halo so ingredients read as collectibles (and not as flying basil leaves)
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.32 + Math.sin(p.t * 6 + p.x) * 0.1;
      const r = p.value >= 5 ? 15 : 12;
      ctx.drawImage(glowSprite(p.value >= 5 ? '#ff9a7a' : '#d6ffb0'), p.x - r, p.y - p.z + bob - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    if (p.kind === 'ingredient') {
      this.drawIngredient(p);
      return;
    }
    const big = p.kind === 'xp' && p.value >= 25;
    if (big || p.kind === 'chest' || p.kind === 'bell' || p.kind === 'spumante' || p.kind === 'gelato') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45 + Math.sin(p.t * 5) * 0.15;
      const gs = glowSprite(p.kind === 'gelato' ? '#9fdcff' : p.kind === 'xp' && p.value < 100 ? '#ffffff' : '#ffd34d');
      const r = p.r * 2.6;
      ctx.drawImage(gs, p.x - r, p.y - p.z + bob - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    const sp = p.kind === 'chest' && p.gold ? 'pickup.chest_gold' : p.sprite;
    drawSprite(ctx, hasSprite(sp) ? sp : p.sprite, frame, p.x, p.y - p.z + bob);
    const g = (p.t * 0.7 + (p.x * 0.013 + p.y * 0.007)) % 2.2;
    if (g < 0.25) {
      const k = Math.sin((g / 0.25) * Math.PI);
      const sx = p.x + p.r * 0.35, sy = p.y - p.z + bob - p.r * 0.45;
      ctx.fillStyle = `rgba(255,255,255,${0.9 * k})`;
      ctx.beginPath();
      const L = 5 * k + 1;
      ctx.moveTo(sx, sy - L); ctx.lineTo(sx + 1.2, sy - 1.2); ctx.lineTo(sx + L, sy); ctx.lineTo(sx + 1.2, sy + 1.2);
      ctx.lineTo(sx, sy + L); ctx.lineTo(sx - 1.2, sy + 1.2); ctx.lineTo(sx - L, sy); ctx.lineTo(sx - 1.2, sy - 1.2);
      ctx.closePath();
      ctx.fill();
    }
  }

  /** A real ingredient: golden glow, pulsing ground ring, gold-rimmed badge, bobbing sprite. */
  private drawIngredient(p: Pickup) {
    const ctx = this.ctx;
    const bob = Math.sin(p.t * 3.2) * 3 - 6;
    const y = p.y - p.z + bob - 8;
    // pulsing ring on the ground
    const k = (p.t * 0.8) % 1;
    ctx.strokeStyle = `rgba(255,214,90,${0.7 * (1 - k)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 6, 14 + k * 26, (14 + k * 26) * 0.42, 0, 0, TAU);
    ctx.stroke();
    // golden glow
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55 + Math.sin(p.t * 5) * 0.15;
    const g = glowSprite('#ffd34d');
    ctx.drawImage(g, p.x - 40, y - 40, 80, 80);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // gold-rimmed badge
    ctx.fillStyle = '#fff8e6';
    ctx.strokeStyle = '#2b1712';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(p.x, y, 17, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#e8b030';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(p.x, y, 15.2, 0, TAU);
    ctx.stroke();
    if (hasSprite(p.sprite)) drawSprite(ctx, p.sprite, 0, p.x, y, 1.1, 1.1);
    // twinkle
    const tw = (p.t * 1.3) % 1.6;
    if (tw < 0.3) {
      const s = Math.sin((tw / 0.3) * Math.PI) * 7;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(p.x + 11, y - 12 - s); ctx.lineTo(p.x + 12.2, y - 13.2); ctx.lineTo(p.x + 11 + s, y - 12); ctx.lineTo(p.x + 12.2, y - 10.8);
      ctx.lineTo(p.x + 11, y - 12 + s); ctx.lineTo(p.x + 9.8, y - 10.8); ctx.lineTo(p.x + 11 - s, y - 12); ctx.lineTo(p.x + 9.8, y - 13.2);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawArea(a: Area) {
    const ctx = this.ctx;
    const k = a.life / a.max;
    const fadeIn = clamp((a.max - a.life) / 0.2, 0, 1);
    const fade = Math.min(fadeIn, clamp(a.life / 0.5, 0, 1));
    const spriteFor: Record<string, string> = { fire: 'fx.fire_patch', oil: 'fx.oil_slick', pesto: 'fx.pesto', cream: 'fx.cream_puddle', ketchup: 'fx.ketchup_puddle', butter: 'fx.butter_puddle', seedoil: 'fx.seedoil_puddle', floret: 'fx.floret_patch' };
    if (a.kind === 'warning') {
      const col = a.enemy ? '#ff3b2f' : '#ff9b3d';
      ctx.strokeStyle = rgba(col, 0.85);
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, a.r, a.r * 0.8, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgba(col, 0.12 + (1 - k) * 0.25);
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, a.r * (1 - k), a.r * 0.8 * (1 - k), 0, 0, TAU);
      ctx.fill();
      return;
    }
    if (a.kind === 'cheese' || a.kind === 'stink') {
      // clouds: soft glow (cheese dust, garlic stink)
      ctx.globalAlpha = (a.kind === 'stink' ? 0.6 + Math.sin(this.t * 4 + a.rot) * 0.08 : 0.55) * fade;
      const gs = glowSprite(a.kind === 'stink' ? '#a8d84a' : '#f6ecc4');
      ctx.drawImage(gs, a.x - a.r * 1.3, a.y - a.r, a.r * 2.6, a.r * 2);
      ctx.globalAlpha = 1;
      return;
    }
    const sid = spriteFor[a.kind];
    if (sid && hasSprite(sid)) {
      const s = getSprite(sid);
      const scale = (a.r * 2) / s.w;
      ctx.globalAlpha = fade * (a.kind === 'fire' ? 1 : 0.92);
      const frame = s.frames.length > 1 ? Math.floor(this.t * 10 + a.rot * 3) % s.frames.length : a.frame;
      drawSprite(ctx, sid, frame, a.x, a.y, scale, scale * 0.8, a.kind === 'fire' ? 0 : a.rot * 0.2);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = rgba(a.kind === 'fire' ? '#ff6a1f' : '#fff4dc', 0.4 * fade);
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, a.r, a.r * 0.8, 0, 0, TAU);
      ctx.fill();
    }
    if (a.kind === 'fire') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 * fade * (0.8 + Math.sin(this.t * 13 + a.rot) * 0.2);
      const gs = glowSprite('#ff7b2e');
      ctx.drawImage(gs, a.x - a.r * 1.4, a.y - a.r * 1.2, a.r * 2.8, a.r * 2.4);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (a.enemy) {
        // enemy fire (the Red-Hot Blender) gets a hot red danger rim, so it never reads as the chef's own fire
        const pulse = 0.75 + Math.sin(this.t * 10 + a.rot) * 0.25;
        ctx.fillStyle = rgba('#ff2a1a', 0.16 * pulse * fade);
        ctx.beginPath();
        ctx.ellipse(a.x, a.y, a.r * 1.1, a.r * 0.88, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba('#ff2a1a', 0.9 * pulse * fade);
        ctx.lineWidth = 3.5;
        ctx.setLineDash([7, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  private drawAuras(run: Run) {
    const ctx = this.ctx;
    const p = run.player;
    for (const w of run.weapons) {
      if ((w.def.id === 'forno' || w.def.id === 'forno_legna') && w.state.r) {
        const r = w.state.r as number;
        const pulse = (w.state.pulse as number) || 0;
        const evo = w.def.id === 'forno_legna';
        const g = ctx.createRadialGradient(p.x, p.y - 6, r * 0.2, p.x, p.y - 6, r);
        g.addColorStop(0, `rgba(255,${evo ? 120 : 150},40,0)`);
        g.addColorStop(0.75, `rgba(255,${evo ? 110 : 140},40,${0.1 + pulse * 0.12})`);
        g.addColorStop(1, `rgba(255,${evo ? 80 : 120},30,${0.28 + pulse * 0.2})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 6, r, r * 0.82, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,${evo ? 150 : 190},90,${0.45 + pulse * 0.4})`;
        ctx.lineWidth = 2 + pulse * 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 6, r, r * 0.82, 0, 0, TAU);
        ctx.stroke();
        if (Math.random() < 0.5) {
          const a = Math.random() * TAU;
          run.fx.burst(p.x + Math.cos(a) * r * 0.9, p.y - 6 + Math.sin(a) * r * 0.75, 1, { colors: evo ? ['#ffd34d', '#ff5a1f'] : ['#ffb02e', '#ff7b2e'], speed: 20, size: 2.4, life: 0.6, additive: true, angle: -Math.PI / 2, spread: 0.4, layer: 0 });
        }
      }
    }
    // enemy auras (cold pot)
    for (const e of run.enemies) {
      if (!e.alive || e.def.behavior !== 'aura') continue;
      if (!run.onScreen(e.x, e.y, 120)) continue;
      const r = e.def.params?.r ?? 95;
      ctx.fillStyle = 'rgba(160,215,255,0.13)';
      ctx.strokeStyle = 'rgba(190,230,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 4, r, r * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawProjectile(run: Run, p: Projectile) {
    const ctx = this.ctx;
    if (p.draw) {
      p.draw(ctx, p);
      return;
    }
    switch (p.kind) {
      case 'sweep':
        this.drawSweep(run, p);
        return;
      case 'tornado':
        this.drawTornado(p);
        return;
      case 'lob':
      case 'rain': {
        // shadow
        const k = p.kind === 'rain' ? clamp(1 - p.z / 600, 0.1, 1) : 1;
        ctx.fillStyle = `rgba(30,16,10,${0.25 * k})`;
        ctx.beginPath();
        const sr = (p.kind === 'rain' ? Math.max(8, p.r * 0.6) : 10) * k;
        ctx.ellipse(p.x, p.y, sr, sr * 0.4, 0, 0, TAU);
        ctx.fill();
        if (p.glow) this.glow(p.x, p.y - p.z, 26 * p.scale, p.glow, 0.7);
        if (p.sprite) drawSprite(ctx, p.sprite, 0, p.x, p.y - p.z, p.scale, p.scale, p.rot);
        return;
      }
      default:
        break;
    }
    if (!p.sprite) return;
    if (p.kind === 'roller') {
      ctx.fillStyle = 'rgba(30,16,10,0.25)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + p.r * 0.85, p.r * 0.9, p.r * 0.3, 0, 0, TAU);
      ctx.fill();
    }
    if (p.glow) this.glow(p.x, p.y, Math.max(16, p.r * 2.2) * p.scale, p.glow, 0.6);
    let alpha = 1;
    if (p.kind === 'orbit' && p.life < 0.3) alpha = p.life / 0.3;
    if (p.kind === 'bounce' && p.life < 0.25) alpha = p.life / 0.25;
    ctx.globalAlpha = alpha;
    drawSprite(ctx, p.sprite, p.frame, p.x, p.y, p.scale, p.scale, p.rot);
    ctx.globalAlpha = 1;
  }

  private glow(x: number, y: number, r: number, color: string, a: number) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawSweep(run: Run, p: Projectile) {
    const ctx = this.ctx;
    const pl = run.player;
    const k = clamp(p.t / p.max, 0, 1);
    const fade = 1 - Math.pow(k, 3);
    const px = pl.x, py = pl.y - 12;
    if (p.arc) {
      // full spin
      const a = k * TAU * 2 * p.dir;
      const r = p.radius;
      ctx.save();
      ctx.globalAlpha = 0.5 * fade;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = i === 0 ? '#fff4c8' : i === 1 ? 'rgba(255,211,77,0.7)' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = (r * 0.45) * (1 - i * 0.3);
        ctx.beginPath();
        ctx.ellipse(px, py, r * (0.75 - i * 0.05), r * 0.62 * (0.75 - i * 0.05), 0, a - p.dir * 1.6, a, p.dir < 0);
        ctx.stroke();
      }
      ctx.restore();
      if (p.glow) this.glow(px + Math.cos(a) * r * 0.8, py + Math.sin(a) * r * 0.65, 34, p.glow, 0.6);
      drawSprite(ctx, p.sprite, 0, px + Math.cos(a) * r * 0.78, py + Math.sin(a) * r * 0.64, 1.1, 1.1, a + Math.PI / 2);
      return;
    }
    const dir = p.dir;
    const reach = p.w * 0.95;
    const a0 = -1.25, a1 = 1.15;
    const ease = 1 - Math.pow(1 - Math.min(1, k * 1.6), 3);
    const ang = a0 + (a1 - a0) * ease;
    const baseY = py + p.oy;
    // smear (crescent)
    ctx.save();
    ctx.translate(px, baseY);
    ctx.scale(dir, 1);
    ctx.globalAlpha = 0.55 * fade;
    const grad = ctx.createRadialGradient(0, 0, reach * 0.25, 0, 0, reach);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.6, 'rgba(255,250,230,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0.95)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, reach, reach * 0.55, 0, a0, ang);
    ctx.ellipse(0, 0, reach * 0.42, reach * 0.24, 0, ang, a0, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // rolling pin at the swing tip
    const tipX = px + dir * Math.cos(ang) * reach * 0.62;
    const tipY = baseY + Math.sin(ang) * reach * 0.34;
    drawSprite(ctx, p.sprite, 0, tipX, tipY, dir * (0.95 + p.w / 300), 0.95 + p.w / 300, dir * (ang + Math.PI / 2) * 0.9);
  }

  private drawTornado(p: Projectile) {
    const ctx = this.ctx;
    const r = p.r;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 7; i++) {
      const yy = -i * r * 0.28;
      const rr = r * (0.35 + i * 0.12);
      const a = this.t * 9 + i * 0.9;
      ctx.strokeStyle = i % 2 ? '#f6dc8a' : '#e9c46a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, yy, rr, rr * 0.32, 0, a, a + 4.2);
      ctx.stroke();
      ctx.fillStyle = '#2b2522';
      ctx.beginPath();
      ctx.arc(Math.cos(a * 1.3) * rr, yy + Math.sin(a * 1.3) * rr * 0.32, 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawShots(run: Run) {
    const ctx = this.ctx;
    for (const s of run.shots) {
      if (!s.alive) continue;
      if (s.gravity) {
        ctx.fillStyle = 'rgba(40,10,10,0.25)';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 7, 3, 0, 0, TAU);
        ctx.fill();
      }
      this.glow(s.x, s.y - s.z, 15, '#ff4a2a', 0.45);
      if (hasSprite(s.sprite)) drawSprite(ctx, s.sprite, 0, s.x, s.y - s.z, s.scale, s.scale, s.rot);
      else {
        ctx.fillStyle = '#e8312a';
        ctx.beginPath();
        ctx.arc(s.x, s.y - s.z, s.r, 0, TAU);
        ctx.fill();
      }
    }
  }

  private emitPropFx(run: Run, vis: PropInst[], dt: number) {
    // pigeons take off when the chef gets close
    const pl = run.player;
    for (let i = vis.length - 1; i >= 0; i--) {
      const p = vis[i];
      if (!p.sprite.includes('pigeon')) continue;
      const dx = p.x - pl.x, dy = p.y - pl.y;
      if (dx * dx + dy * dy > 120 * 120) continue;
      run.world.destroy(p);
      vis.splice(i, 1);
      const dir = dx >= 0 ? 1 : -1;
      run.fx.sprite(p.x, p.y - 6, 'fx.pigeon_fly', { vx: dir * (120 + Math.random() * 60), vy: -60 - Math.random() * 40, vz: 140, life: 1.6, size: dir, size1: dir * 0.75, fps: 12, frame: 0 });
      run.fx.burst(p.x, p.y - 4, 3, { sprite: 'fx.feather', speed: 60, size: 1, life: 1.4, gravity: 30, up: 40, shrink: false, spin: 4 });
    }
    if (this.quality === 'low') return;
    for (const p of vis) {
      if (!p.fx) continue;
      p.fxT -= dt * (p.fx.rate ?? 1);
      if (p.fxT > 0) continue;
      const x = p.x + (p.fx.ox ?? 0), y = p.y + (p.fx.oy ?? 0);
      switch (p.fx.kind) {
        case 'steam':
          p.fxT = 0.35;
          run.fx.sprite(x + (Math.random() - 0.5) * 10, y, 'fx.steam', { vy: -26, vx: (Math.random() - 0.5) * 8, life: 1.6, size: 0.6, size1: 1.3, alpha: 0.5 });
          break;
        case 'smoke':
          p.fxT = 0.5;
          run.fx.sprite(x, y, 'fx.puff', { vy: -20, vx: 6, life: 2, size: 0.4, size1: 1.1, alpha: 0.35 });
          break;
        case 'flame':
          p.fxT = 0.08;
          run.fx.burst(x + (Math.random() - 0.5) * 16, y, 1, { colors: ['#ffd34d', '#ff8a2a', '#ff4b1f'], speed: 20, size: 3, life: 0.5, additive: true, angle: -Math.PI / 2, spread: 0.5 });
          break;
        case 'sparkle':
          p.fxT = 0.6;
          run.fx.sprite(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 12, 'fx.spark', { life: 0.6, size: 0.5, size1: 0, additive: true, vr: 3 });
          break;
        case 'drip':
          p.fxT = 0.9;
          run.fx.burst(x, y, 1, { color: '#9fd0ff', speed: 0, size: 1.6, life: 0.6, gravity: 300, layer: 1 });
          break;
        case 'bubbles':
          p.fxT = 0.25;
          run.fx.burst(x + (Math.random() - 0.5) * 14, y, 1, { color: 'rgba(255,255,255,0.7)', speed: 10, size: 2, life: 0.6, angle: -Math.PI / 2, spread: 0.3 });
          break;
        case 'fountain':
          p.fxT = 0.05;
          run.fx.burst(x, y, 1, { colors: ['#cdeeff', '#9fd6ff', '#ffffff'], speed: 70, size: 2.2, life: 0.8, gravity: 260, up: 180, angle: -Math.PI / 2, spread: 2.4 });
          break;
        case 'leaves':
          p.fxT = 1.2;
          run.fx.burst(x + (Math.random() - 0.5) * 30, y, 1, { colors: ['#5fae4a', '#8ccf5a'], speed: 18, size: 2.4, life: 2.2, gravity: 30 });
          break;
        case 'pigeons':
          p.fxT = 2.5;
          if (Math.hypot(run.player.x - x, run.player.y - y) < 160) {
            run.fx.burst(x, y, 4, { sprite: 'fx.feather', speed: 90, size: 1, life: 1.6, gravity: 40, up: 60, shrink: false, spin: 4 });
          }
          break;
      }
    }
  }

  private drawLighting(run: Run, vis: PropInst[], darkness: number, darkColor: string) {
    const lc = this.lctx;
    const L = this.light;
    const scale = 0.5; // light map at half css resolution
    lc.globalCompositeOperation = 'source-over';
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, L.width, L.height);
    lc.fillStyle = rgba(darkColor, clamp(darkness, 0, 0.92));
    lc.fillRect(0, 0, L.width, L.height);
    lc.globalCompositeOperation = 'destination-out';
    const brush = getLightBrush();
    const toSX = (x: number) => ((x - this.camX) * this.zoom + this.W / 2) * scale;
    const toSY = (y: number) => ((y - this.camY) * this.zoom + this.H / 2) * scale;
    const put = (x: number, y: number, r: number, a: number) => {
      const sx = toSX(x), sy = toSY(y), sr = r * this.zoom * scale;
      if (sx < -sr || sy < -sr || sx > L.width + sr || sy > L.height + sr) return;
      lc.globalAlpha = clamp(a, 0, 1);
      lc.drawImage(brush, sx - sr, sy - sr, sr * 2, sr * 2);
    };
    // player light
    put(run.player.x, run.player.y - 10, 230, 0.95);
    const glowList: { x: number; y: number; r: number; c: string; a: number }[] = [];
    for (const p of vis) {
      if (!p.light) continue;
      const fl = p.light.flicker ? 1 - p.light.flicker * 0.5 * (0.5 + 0.5 * Math.sin(this.t * 13 + p.x)) * (0.6 + 0.4 * Math.sin(this.t * 7.7 + p.y)) : 1;
      const I = (p.light.intensity ?? 1) * fl;
      const lx = p.x + (p.light.ox ?? 0), ly = p.y + (p.light.oy ?? 0);
      put(lx, ly, p.light.r, I);
      glowList.push({ x: lx, y: ly, r: p.light.r * 0.6, c: p.light.color, a: 0.22 * I });
    }
    for (const a of run.areas) if (a.alive && a.kind === 'fire') put(a.x, a.y, a.r * 2.2, 0.8);
    for (const pr of run.projectiles) if (pr.alive && pr.glow) put(pr.x, pr.y - pr.z, 70, 0.6);
    for (const e of run.enemies) if (e.alive && (e.elite || e.boss)) put(e.x, e.y, e.r * 2.5, 0.35);
    for (const p of run.pickups) if (p.alive && (p.kind === 'chest' || p.kind === 'ingredient')) put(p.x, p.y, p.kind === 'ingredient' ? 110 : 90, 0.75);
    lc.globalAlpha = 1;
    lc.globalCompositeOperation = 'source-over';
    const ctx = this.ctx;
    ctx.drawImage(L, 0, 0, this.canvas.width, this.canvas.height);
    // warm additive glows
    if (this.quality === 'high' && glowList.length) {
      const z = this.zoom * this.dpr;
      ctx.setTransform(z, 0, 0, z, (this.W / 2 - this.camX * this.zoom) * this.dpr, (this.H / 2 - this.camY * this.zoom) * this.dpr);
      ctx.globalCompositeOperation = 'lighter';
      for (const g of glowList) {
        ctx.globalAlpha = g.a * darkness * 1.4;
        ctx.drawImage(glowSprite(g.c), g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  private drawIndicators(run: Run) {
    const ctx = this.ctx;
    const v = run.view;
    const cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2;
    const targets: { x: number; y: number; c: string; big: boolean; size?: number }[] = [];
    for (const b of run.bosses) if (b.alive && !run.onScreen(b.x, b.y, -10)) targets.push({ x: b.x, y: b.y, c: '#ff3b2f', big: true });
    for (const p of run.pickups) if (p.alive && p.kind === 'chest' && !run.onScreen(p.x, p.y, -10)) targets.push({ x: p.x, y: p.y, c: '#ffd34d', big: false });
    // real ingredients: the biggest arrow on screen
    for (const p of run.pickups) if (p.alive && p.kind === 'ingredient' && !run.onScreen(p.x, p.y, -10)) targets.push({ x: p.x, y: p.y, c: '#7cff8a', big: true, size: 16 });
    for (const t of targets) {
      const a = Math.atan2(t.y - cy, t.x - cx);
      const hw = (v.x1 - v.x0) / 2 - 26, hh = (v.y1 - v.y0) / 2 - 26;
      const k = Math.min(hw / Math.abs(Math.cos(a) || 1e-6), hh / Math.abs(Math.sin(a) || 1e-6));
      const x = cx + Math.cos(a) * k, y = cy + Math.sin(a) * k;
      const s = (t.size ?? (t.big ? 13 : 10)) * (1 + Math.sin(this.t * 6) * 0.1);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = t.c;
      ctx.strokeStyle = '#2b1712';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.7, s * 0.75);
      ctx.lineTo(-s * 0.35, 0);
      ctx.lineTo(-s * 0.7, -s * 0.75);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawMotes(run: Run, kind: string, dt: number) {
    if (kind === 'none' || this.quality === 'low') return;
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const want = kind === 'rain' ? 120 : 46;
    while (this.motes.length < want) this.motes.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, s: 0.5 + Math.random(), a: Math.random(), t: Math.random() * 10 });
    const camDX = (run.player.vx || 0) * dt * this.zoom * this.dpr * 0.35;
    const camDY = (run.player.vy || 0) * dt * this.zoom * this.dpr * 0.35;
    for (const m of this.motes) {
      m.t += dt;
      let col = 'rgba(255,248,230,';
      let size = 1.6 * m.s * this.dpr;
      let vx = 6, vy = -4;
      if (kind === 'flour') { vx = 10 + Math.sin(m.t * 0.7) * 8; vy = 6 + Math.cos(m.t * 0.5) * 5; col = 'rgba(255,255,255,'; size = 1.8 * m.s * this.dpr; }
      else if (kind === 'dust') { vx = 5 + Math.sin(m.t * 0.6) * 5; vy = -3 + Math.cos(m.t * 0.4) * 4; col = 'rgba(255,228,170,'; }
      else if (kind === 'fireflies') { vx = Math.sin(m.t * 0.9 + m.s * 5) * 14; vy = Math.cos(m.t * 0.7 + m.s * 3) * 10; col = 'rgba(255,230,120,'; size = 2.2 * m.s * this.dpr; }
      else if (kind === 'embers') { vx = Math.sin(m.t) * 8; vy = -22; col = 'rgba(255,150,60,'; }
      else if (kind === 'petals') { vx = 18 + Math.sin(m.t * 1.3) * 10; vy = 12; col = 'rgba(255,200,215,'; size = 2.4 * m.s * this.dpr; }
      else if (kind === 'rain') { vx = -40; vy = 520; col = 'rgba(190,210,255,'; }
      m.x += vx * dt * this.dpr * m.s - camDX;
      m.y += vy * dt * this.dpr * m.s - camDY;
      if (m.x < -10) m.x += W + 20;
      if (m.x > W + 10) m.x -= W + 20;
      if (m.y < -10) m.y += H + 20;
      if (m.y > H + 10) m.y -= H + 20;
      const alpha = (0.25 + 0.35 * Math.abs(Math.sin(m.t * 0.8 + m.a * 6))) * (kind === 'fireflies' ? 1.4 : 1);
      ctx.fillStyle = col + alpha.toFixed(3) + ')';
      if (kind === 'rain') {
        ctx.fillRect(m.x, m.y, 1 * this.dpr, 10 * this.dpr);
      } else if (kind === 'petals') {
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, size, size * 0.55, m.t * 2, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(m.x, m.y, size, 0, TAU);
        ctx.fill();
      }
    }
  }

  private drawJoystick(input: Input) {
    const ctx = this.ctx;
    const d = this.dpr;
    const r = input.touchRadius * d;
    const ox = input.touchOX * d, oy = input.touchOY * d;
    let dx = (input.touchX - input.touchOX) * d, dy = (input.touchY - input.touchOY) * d;
    const l = Math.hypot(dx, dy);
    if (l > r) { dx = (dx / l) * r; dy = (dy / l) * r; }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff6e6';
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3 * d;
    ctx.strokeStyle = '#2b1712';
    ctx.fillStyle = '#e8442f';
    ctx.beginPath();
    ctx.arc(ox + dx, oy + dy, r * 0.42, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
