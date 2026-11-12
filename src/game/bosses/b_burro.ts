/**
 * IL PANETTO SUPREMO — The Supreme Butter Block (final boss of Cacio e Pepe; mid-boss in
 * Pesto and Vongole).
 *
 * One body language for every attack (art: boss.burro.attack). WIND-UP (e.telegraph: red flicker):
 * the butter knife goes up, the dish-lid shield comes forward, he glares and sweats butter. ATTACK
 * (e.attackPose after the telegraph): the knife slashes forward. Shots leave from where the art shows
 * them: lobbed pats from the knife tip, pat rings from just outside his body (never over his face).
 *
 *   melt    knife up (0.4 s), then he flicks 5 butter pats at the chef from the knife tip; every
 *           landing spot is marked by a warning ring the size of the slippery puddle it becomes
 *   slide   he turns to the chef and a lane of warning circles as wide as what actually hits (his
 *           body plus the chef) shows the path (0.75 s, butter spraying behind the dish like spinning
 *           wheels), then the dish slides down it at full speed, leaving a buttery trail, and stops
 *           about 120 px past where the chef stood, so it stays on screen; enraged, if he is still on
 *           screen, he turns and slides a second time with the same 0.75 s tell
 *   pats    three rotating rings of butter pats (12, 16 enraged)
 * Enrage (< 50 % HP): it MELTS: smaller hitbox, drawn at 0.9 scale, faster, puddles all around, and it
 * keeps dripping and leaves small butter puddles behind it for the rest of the fight.
 * He never starts an attack in the first 1.6 s after his entrance, or while he is off screen or under the HUD.
 */
import { brain, lobShot, hazard, shoot, steer, toPlayer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const PAT = 'proj.e_butterpat';
const MELTED = 1; // e.aux flag
const BUTTER = ['#fff3b0', '#fbe58a', '#ffffff'];
const SLIDE_WIND = 0.75;
const MELT_AT = 0.4, MELT_RATE = 3.5, MELT_PATS = 5;

interface Block { id: number; born: number; drip: number; phase: 'wind' | 'slide'; until: number; n: number; dur: number; speed: number }

/** Per-boss bookkeeping (enemies are pooled: the record is reset when the id changes). */
const blocks = new WeakMap<Enemy, Block>();
function block(run: Run, e: Enemy): Block {
  let b = blocks.get(e);
  if (!b || b.id !== e.id) blocks.set(e, (b = { id: e.id, born: run.time, drip: 0, phase: 'wind', until: 0, n: 0, dur: 0, speed: 0 }));
  return b;
}

/** Fully in view and clear of the HUD (timer and boss bar on top): only then may an attack start. */
function inView(run: Run, e: Enemy) {
  const v = run.view;
  return e.x > v.x0 + e.r && e.x < v.x1 - e.r && e.y - e.r * 1.4 > v.y0 + 90 && e.y + e.r * 0.6 < v.y1;
}

function facePlayer(run: Run, e: Enemy) {
  e.face = run.player.x >= e.x ? 1 : -1;
}

/** Where the knife tip is in the slash art (world, scale 1 = sprite px). */
function knifeTip(e: Enemy): [number, number] {
  return [e.x + e.face * 132 * e.scale, e.y + 22 * e.scale];
}

/**
 * Aim a slide at the chef: face him and lay the lane of warning circles. The lane is as wide as the
 * contact reach (e.r·0.85 + the chef's radius) and the slide stops about 120 px past the chef.
 */
function aimSlide(run: Run, e: Enemy, b: Block, t: number) {
  const tp = toPlayer(run, e);
  e.ax = tp.dx;
  e.ay = tp.dy;
  e.face = tp.dx >= 0 ? 1 : -1;
  b.speed = e.bossPhase ? 600 : 520;
  b.dur = Math.min(0.85, Math.max(0.35, (tp.d + 120) / b.speed));
  b.phase = 'wind';
  b.until = t + SLIDE_WIND;
  e.telegraph = SLIDE_WIND;
  e.attackPose = SLIDE_WIND + b.dur + 0.15; // hold the slash through the skid
  // warnings are ellipses (r, 0.8r): size the circles so the lane's half width covers the reach
  const reach = e.r * 0.85 + run.player.r;
  const nx = -e.ay, ny = e.ax;
  const w = reach / Math.sqrt(nx * nx + 0.64 * ny * ny);
  const along = w * Math.sqrt(e.ax * e.ax + 0.64 * e.ay * e.ay);
  const len = b.speed * b.dur;
  const step = along * 1.05;
  const n = Math.max(1, Math.ceil(len / step));
  for (let i = 0; i <= n; i++) {
    const d = (len * i) / n;
    run.addArea('warning', e.x + e.ax * d, e.y + e.ay * d, w, SLIDE_WIND, { enemy: true });
  }
  run.sfx('enemy_dash', { volume: 0.7, pitch: 0.7 }, e.x);
}

/** A ring of pats flung out from just outside his body (they never appear on his butter face). */
function patRing(run: Run, e: Enemy, n: number, speed: number, off: number) {
  const cy = e.y - e.r * 0.35;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU;
    const s = shoot(run, e, a, speed, PAT, e.damage * 0.45, 8);
    s.x = e.x + Math.cos(a) * e.r * 1.85;
    s.y = cy + Math.sin(a) * e.r * 1.6;
  }
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
  run.fx.ring(e.x, cy, e.r * 0.8, e.r * 2, 0.3, '#fff3b0', 6);
}

export const burro: Pattern = (run, e, dt) => {
  const b = block(run, e);
  if (e.bossPhase && !(e.aux & MELTED)) {
    e.aux |= MELTED;
    e.r *= 0.85;
    e.scale *= 0.9;
    e.speed *= 1.25;
    for (let i = 0; i < 6; i++) hazard(run, 'butter', e.x + Math.cos((i / 6) * TAU) * 70, e.y + Math.sin((i / 6) * TAU) * 55, 34, 6, 0.3);
    run.fx.burst(e.x, e.y - e.r * 0.6, 24, { colors: BUTTER, speed: 260, size: 5, life: 0.9, gravity: 500, up: 180 });
    run.fx.bubble(e, 'Mi sciolgo… ma non mollo!', -e.r * 2.4, '#fff3b0', 1.6, true);
  }
  // melted: it keeps dripping and leaves little butter puddles where it walks
  if (e.aux & MELTED && dt > 0) {
    if (Math.random() < dt * 5) {
      run.fx.burst(e.x + (Math.random() - 0.5) * e.r * 1.6, e.y - e.r * (0.6 + Math.random() * 0.6), 1, { colors: BUTTER, speed: 20, size: 4, life: 0.7, gravity: 520, up: 40, shrink: false });
    }
    if (run.time >= b.drip && e.state !== 50) {
      b.drip = run.time + 0.45;
      hazard(run, 'butter', e.x + (Math.random() - 0.5) * e.r * 0.8, e.y + e.r * 0.45, 22 + Math.random() * 6, 2.6, 0.2);
    }
  }
  // no attack under the FINAL BOSS banner, from off screen or from under the HUD
  if (!e.bossAttack && e.state !== 50) {
    const age = run.time - b.born;
    if (age < 1.6) e.timer = Math.max(e.timer, 1.6 - age);
    if (!inView(run, e)) e.timer = Math.max(e.timer, 0.3);
  }
  brain(run, e, dt, ['melt', 'slide', 'pats', 'slide', 'melt', 'pats'], 1, (a, t, first) => {
    if (a === 'slide') {
      if (first) {
        b.n = 0;
        aimSlide(run, e, b, t);
      }
      e.face = e.ax >= 0 ? 1 : -1; // steer() would turn him by his leftover walk
      if (b.phase === 'wind') {
        steer(e, 0, 0, dt, 8);
        e.face = e.ax >= 0 ? 1 : -1;
        // revving: butter sprays out behind the dish
        if (Math.random() < dt * 24) {
          run.fx.burst(e.x - e.ax * e.r * 0.7, e.y + e.r * 0.6, 1, { colors: BUTTER, speed: 170, size: 4, life: 0.4, angle: Math.atan2(-e.ay, -e.ax), spread: 1, up: 60, gravity: 400 });
        }
        if (t >= b.until) {
          b.phase = 'slide';
          b.until = t + b.dur;
        }
        return false;
      }
      e.x += e.ax * b.speed * dt;
      e.y += e.ay * b.speed * dt;
      e.vx = e.ax * b.speed;
      e.vy = e.ay * b.speed;
      e.anim += dt * 12;
      if (Math.floor((t - dt) * 10) !== Math.floor(t * 10)) hazard(run, 'butter', e.x, e.y + e.r * 0.5, 24, 3.5, 0.3);
      if (Math.random() < dt * 30) run.fx.streak(e.x, e.y - e.r * 0.3, -e.ax * 220, -e.ay * 220, '#fff3b0', 0.3, 6);
      if (t < b.until) return false;
      // a skid and a splash where the slide stops
      e.vx *= 0.1;
      e.vy *= 0.1;
      run.fx.burst(e.x + e.ax * e.r * 0.6, e.y + e.r * 0.5, 12, { colors: BUTTER, speed: 200, size: 4.5, life: 0.5, angle: Math.atan2(e.ay, e.ax), spread: 1.6, up: 80, gravity: 400 });
      b.n++;
      // enraged: turn and go again, with the full tell, only where the chef can see it
      if (e.bossPhase && b.n < 2 && inView(run, e)) {
        aimSlide(run, e, b, t);
        return false;
      }
      return true;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'melt') {
      if (first) {
        facePlayer(run, e);
        e.telegraph = MELT_AT;
        e.attackPose = MELT_AT + (MELT_PATS - 1) / MELT_RATE + 0.25;
      }
      // the first pat leaves on the first frame of the slash, then one every 1/3.5 s
      const k = Math.floor((t - MELT_AT) * MELT_RATE);
      if (t >= MELT_AT && k < MELT_PATS && Math.floor((t - dt - MELT_AT) * MELT_RATE) !== k) {
        facePlayer(run, e);
        const p = run.player;
        const x = p.x + p.vx * 0.5 + (Math.random() - 0.5) * 170, y = p.y + p.vy * 0.5 + (Math.random() - 0.5) * 120;
        run.addArea('warning', x, y, 40, 0.8, { enemy: true });
        const s = lobShot(run, e, x, y, 0.8, PAT, e.damage * 0.5, (lx, ly) => {
          hazard(run, 'butter', lx, ly, 40, 6, 0.35);
          run.fx.burst(lx, ly, 8, { colors: BUTTER, speed: 120, size: 4, life: 0.5 });
        });
        // flicked off the knife tip
        const [tx, ty] = knifeTip(e);
        s.x = tx;
        s.y = ty;
        s.vx = (x - tx) / 0.8;
        s.vy = (y - ty) / 0.8;
        run.fx.burst(tx, ty - 20, 5, { colors: BUTTER, speed: 120, size: 3.5, life: 0.35 });
      }
      return t > MELT_AT + (MELT_PATS - 1) / MELT_RATE + 0.35;
    }
    // pats: rotating rings
    if (first) {
      facePlayer(run, e);
      e.telegraph = 0.45;
      e.attackPose = 1.6;
    }
    for (let k = 0; k < 3; k++) {
      const at = 0.45 + k * 0.4;
      if (t >= at && t - dt < at) patRing(run, e, e.bossPhase ? 16 : 12, 165, k * 0.13 + e.bossStep * 0.4);
    }
    return t > 1.7;
  });
};
