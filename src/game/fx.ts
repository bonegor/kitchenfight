/**
 * Visual effects: particles, floor decals, floating combat text, speech
 * bubbles, screen shake, flashes. All pooled, all cheap.
 */
import { drawSprite, hasSprite } from '../gfx/sprites';
import { TAU, RNG } from '../core/math';

export interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; max: number;
  size: number; size1: number;
  rot: number; vr: number;
  gravity: number; drag: number;
  sprite: string | null; frame: number;
  color: string;
  alpha: number;
  additive: boolean;
  bounce: boolean;
  shape: 0 | 1 | 2 | 3; // 0 circle, 1 sprite, 2 ring, 3 streak
  layer: 0 | 1; // 0 = ground (under characters), 1 = above
}

export interface Decal {
  x: number; y: number; sprite: string; frame: number; rot: number; scale: number; alpha: number; life: number; max: number;
}

export interface FloatText {
  x: number; y: number; vy: number; vx: number;
  text: string; color: string; stroke: string; size: number;
  life: number; max: number; pop: number;
}

export interface Bubble {
  text: string; life: number; max: number; target: { x: number; y: number }; oy: number; color: string; big: boolean;
}

const MAX_PARTICLES = 900;
const MAX_DECALS = 160;
const MAX_TEXTS = 140;

export class FX {
  particles: Particle[] = [];
  private pPool: Particle[] = [];
  decals: Decal[] = [];
  texts: FloatText[] = [];
  bubbles: Bubble[] = [];
  trauma = 0;
  shakeX = 0;
  shakeY = 0;
  flash = 0; // white screen flash 0..1
  flashColor = '#ffffff';
  hurt = 0; // red vignette 0..1
  rng = new RNG(1234);
  shakeEnabled = true;
  flashesEnabled = true;
  numbersEnabled = true;
  bubblesEnabled = true;
  private t = 0;

  reset() {
    this.particles.length = 0;
    this.decals.length = 0;
    this.texts.length = 0;
    this.bubbles.length = 0;
    this.trauma = 0;
    this.flash = 0;
    this.hurt = 0;
  }

  private alloc(): Particle | null {
    if (this.particles.length >= MAX_PARTICLES) return null;
    const p = this.pPool.pop() ?? ({} as Particle);
    p.z = 0; p.vz = 0; p.rot = 0; p.vr = 0; p.gravity = 0; p.drag = 0; p.sprite = null; p.frame = 0;
    p.color = '#fff'; p.alpha = 1; p.additive = false; p.bounce = false; p.shape = 0; p.layer = 1; p.size1 = 0;
    this.particles.push(p);
    return p;
  }

  shake(amount: number) {
    if (!this.shakeEnabled) return;
    this.trauma = Math.min(1, this.trauma + amount);
  }

  screenFlash(a: number, color = '#ffffff') {
    if (!this.flashesEnabled) a *= 0.25;
    this.flash = Math.max(this.flash, a);
    this.flashColor = color;
  }

  // ------------------------------------------------------------------ emitters

  /** Generic burst of small coloured circles / sprite chunks. */
  burst(x: number, y: number, n: number, o: {
    color?: string; colors?: string[]; sprite?: string; frames?: number; speed?: number; size?: number; life?: number;
    gravity?: number; up?: number; additive?: boolean; spread?: number; angle?: number; drag?: number; bounce?: boolean; layer?: 0 | 1; shrink?: boolean; spin?: number;
  } = {}) {
    const R = this.rng;
    for (let i = 0; i < n; i++) {
      const p = this.alloc();
      if (!p) return;
      const a = o.angle !== undefined ? o.angle + (R.next() - 0.5) * (o.spread ?? TAU) : R.next() * TAU;
      const sp = (o.speed ?? 120) * (0.35 + R.next() * 0.9);
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp * 0.75;
      p.vz = (o.up ?? 0) * (0.6 + R.next() * 0.8);
      p.z = 0;
      p.life = p.max = (o.life ?? 0.6) * (0.6 + R.next() * 0.7);
      p.size = (o.size ?? 3) * (0.6 + R.next() * 0.8);
      p.size1 = o.shrink === false ? p.size : 0;
      p.gravity = o.gravity ?? 0;
      p.drag = o.drag ?? 2.5;
      p.rot = R.next() * TAU;
      p.vr = (R.next() - 0.5) * (o.spin ?? 10);
      p.additive = !!o.additive;
      p.bounce = !!o.bounce;
      p.layer = o.layer ?? 1;
      if (o.sprite && hasSprite(o.sprite)) {
        p.shape = 1;
        p.sprite = o.sprite;
        p.frame = o.frames ? Math.floor(R.next() * o.frames) : 0;
      } else {
        p.shape = 0;
        p.color = o.colors ? o.colors[Math.floor(R.next() * o.colors.length)] : o.color ?? '#ffffff';
      }
    }
  }

  /** Expanding ring (shockwave). */
  ring(x: number, y: number, r0: number, r1: number, life: number, color: string, width = 4, additive = true) {
    const p = this.alloc();
    if (!p) return;
    p.x = x; p.y = y; p.vx = 0; p.vy = 0;
    p.life = p.max = life;
    p.size = r0; p.size1 = r1;
    p.shape = 2; p.color = color; p.additive = additive; p.rot = width; p.layer = 0;
  }

  /** Sprite particle with explicit params. */
  sprite(x: number, y: number, sprite: string, o: { frame?: number; vx?: number; vy?: number; life?: number; size?: number; size1?: number; rot?: number; vr?: number; additive?: boolean; layer?: 0 | 1; gravity?: number; drag?: number; vz?: number; alpha?: number } = {}) {
    const p = this.alloc();
    if (!p) return;
    p.x = x; p.y = y;
    p.vx = o.vx ?? 0; p.vy = o.vy ?? 0; p.vz = o.vz ?? 0;
    p.life = p.max = o.life ?? 0.6;
    p.size = o.size ?? 1; p.size1 = o.size1 ?? p.size;
    p.rot = o.rot ?? 0; p.vr = o.vr ?? 0;
    p.shape = 1; p.sprite = sprite; p.frame = o.frame ?? 0;
    p.additive = !!o.additive; p.layer = o.layer ?? 1;
    p.gravity = o.gravity ?? 0; p.drag = o.drag ?? 0;
    p.alpha = o.alpha ?? 1;
  }

  /** Speed streak (for dashes / fast projectiles). */
  streak(x: number, y: number, vx: number, vy: number, color: string, life = 0.25, width = 3) {
    const p = this.alloc();
    if (!p) return;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.size = width; p.shape = 3; p.color = color; p.drag = 6; p.additive = true;
  }

  decal(x: number, y: number, sprite: string, frame: number, scale = 1, alpha = 0.85, life = 30) {
    if (!hasSprite(sprite)) return;
    if (this.decals.length >= MAX_DECALS) this.decals.shift();
    this.decals.push({ x, y, sprite, frame, rot: this.rng.next() * TAU, scale, alpha, life, max: life });
  }

  number(x: number, y: number, value: number, crit: boolean, color?: string) {
    if (!this.numbersEnabled) return;
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    const v = Math.round(value);
    this.texts.push({
      x: x + (this.rng.next() - 0.5) * 10,
      y: y - 6,
      vx: (this.rng.next() - 0.5) * 30,
      vy: -70 - this.rng.next() * 20,
      text: String(v),
      color: color ?? (crit ? '#ffd23f' : '#ffffff'),
      stroke: crit ? '#7a1d00' : '#2b1712',
      size: crit ? 17 : v >= 100 ? 14 : 12,
      life: crit ? 0.95 : 0.7,
      max: crit ? 0.95 : 0.7,
      pop: crit ? 1.8 : 1.35,
    });
  }

  text(x: number, y: number, text: string, color = '#ffffff', size = 16, life = 1.2, stroke = '#2b1712') {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x, y, vx: 0, vy: -38, text, color, stroke, size, life, max: life, pop: 1.5 });
  }

  bubble(target: { x: number; y: number }, text: string, oy = -70, color = '#ffffff', life = 1.8, big = false) {
    if (!this.bubblesEnabled) return;
    // one bubble per target
    this.bubbles = this.bubbles.filter((b) => b.target !== target);
    this.bubbles.push({ text, life, max: life, target, oy, color, big });
  }

  // ------------------------------------------------------------------ update

  update(dt: number) {
    this.t += dt;
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) {
        ps[i] = ps[ps.length - 1];
        ps.pop();
        this.pPool.push(p);
        continue;
      }
      const dr = Math.exp(-p.drag * dt);
      p.vx *= dr;
      p.vy *= dr;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) {
        p.vz -= p.gravity * dt;
        p.z += p.vz * dt;
        if (p.z < 0) {
          if (p.bounce && Math.abs(p.vz) > 40) {
            p.z = 0;
            p.vz = -p.vz * 0.35;
            p.vx *= 0.6;
            p.vy *= 0.6;
          } else {
            p.z = 0;
            p.vz = 0;
          }
        }
      } else if (p.vz) {
        p.z += p.vz * dt;
      }
      p.rot += p.vr * dt;
    }
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.life -= dt;
      if (d.life <= 0) this.decals.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.x += t.vx * dt;
      t.vy *= Math.exp(-3.2 * dt);
      t.vx *= Math.exp(-3 * dt);
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      if (b.life <= 0) this.bubbles.splice(i, 1);
    }
    // shake
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const s = this.trauma * this.trauma * 14;
    this.shakeX = s * (Math.sin(this.t * 61.3) * 0.6 + Math.sin(this.t * 97.1) * 0.4);
    this.shakeY = s * (Math.sin(this.t * 71.7) * 0.6 + Math.sin(this.t * 113.3) * 0.4);
    this.flash = Math.max(0, this.flash - dt * 3.5);
    this.hurt = Math.max(0, this.hurt - dt * 2.2);
  }

  // ------------------------------------------------------------------ draw (world space)

  drawDecals(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
    for (const d of this.decals) {
      if (d.x < x0 - 60 || d.x > x1 + 60 || d.y < y0 - 60 || d.y > y1 + 60) continue;
      const fade = Math.min(1, d.life / 3);
      ctx.globalAlpha = d.alpha * fade;
      drawSprite(ctx, d.sprite, d.frame, d.x, d.y, d.scale, d.scale * 0.8, d.rot);
    }
    ctx.globalAlpha = 1;
  }

  drawParticles(ctx: CanvasRenderingContext2D, layer: 0 | 1, x0: number, y0: number, x1: number, y1: number) {
    let additive = false;
    for (const p of this.particles) {
      if (p.layer !== layer) continue;
      if (p.x < x0 - 80 || p.x > x1 + 80 || p.y < y0 - 120 || p.y > y1 + 80) continue;
      const t = p.life / p.max; // 1 → 0
      if (p.additive !== additive) {
        ctx.globalCompositeOperation = p.additive ? 'lighter' : 'source-over';
        additive = p.additive;
      }
      const size = p.size1 + (p.size - p.size1) * t;
      switch (p.shape) {
        case 0: {
          ctx.globalAlpha = Math.min(1, t * 2) * p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y - p.z, Math.max(0.3, size), 0, TAU);
          ctx.fill();
          break;
        }
        case 1: {
          ctx.globalAlpha = Math.min(1, t * 2.2) * p.alpha;
          drawSprite(ctx, p.sprite!, p.frame, p.x, p.y - p.z, size, size, p.rot);
          break;
        }
        case 2: {
          const k = 1 - t;
          const r = p.size + (p.size1 - p.size) * (1 - Math.pow(1 - k, 3));
          ctx.globalAlpha = t * 0.9;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.5, p.rot * t);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r, r * 0.78, 0, 0, TAU);
          ctx.stroke();
          break;
        }
        case 3: {
          ctx.globalAlpha = t;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * t;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.06, p.y - p.vy * 0.06);
          ctx.stroke();
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  drawTexts(ctx: CanvasRenderingContext2D, font: string) {
    if (!this.texts.length) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    let lastSize = -1;
    for (const t of this.texts) {
      const k = t.life / t.max; // 1 → 0
      const age = 1 - k;
      const pop = age < 0.12 ? 1 + (t.pop - 1) * (age / 0.12) : 1 + (t.pop - 1) * Math.max(0, 1 - (age - 0.12) / 0.18);
      const size = Math.round(t.size * pop);
      if (size !== lastSize) {
        ctx.font = `${size}px ${font}`;
        lastSize = size;
      }
      ctx.globalAlpha = Math.min(1, k * 3);
      ctx.lineWidth = Math.max(2.5, size * 0.28);
      ctx.strokeStyle = t.stroke;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  drawBubbles(ctx: CanvasRenderingContext2D, font: string) {
    for (const b of this.bubbles) {
      const age = b.max - b.life;
      const appear = Math.min(1, age / 0.18);
      const vanish = Math.min(1, b.life / 0.25);
      const s = (0.6 + 0.4 * appear + (appear < 1 ? 0.15 * Math.sin(appear * Math.PI) : 0)) * vanish;
      if (s <= 0.02) continue;
      const size = b.big ? 15 : 12;
      ctx.font = `${size}px ${font}`;
      const w = ctx.measureText(b.text).width + 16;
      const h = size + 12;
      const x = b.target.x, y = b.target.y + b.oy;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.globalAlpha = Math.min(1, vanish * 1.5);
      // bubble
      ctx.beginPath();
      const r = h / 2;
      ctx.moveTo(-w / 2 + r, -h / 2);
      ctx.lineTo(w / 2 - r, -h / 2);
      ctx.arc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(6, h / 2);
      ctx.lineTo(-2, h / 2 + 8);
      ctx.lineTo(-4, h / 2);
      ctx.lineTo(-w / 2 + r, h / 2);
      ctx.arc(-w / 2 + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2);
      ctx.closePath();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#2b1712';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.fillStyle = '#2b1712';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, 0, 1);
      ctx.restore();
    }
  }
}
