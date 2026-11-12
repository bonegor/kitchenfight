/**
 * IL PANETTO SUPREMO — The Supreme Butter Block (final boss of Cacio e Pepe; mid-boss in
 * Pesto and Vongole).
 *
 * One body language for every attack (art: boss.burro.attack). WIND-UP (e.telegraph: red flicker):
 * the butter knife goes up, the dish-lid shield comes forward, he glares and sweats butter. ATTACK
 * (e.attackPose after the telegraph): the knife slashes forward and pats fly.
 *
 *   melt    knife up (0.4 s), then he flicks 5 butter pats at the chef; every landing spot is marked
 *           by a warning ring the size of the slippery butter puddle it becomes
 *   slide   he turns to the chef and a lane of warning circles as wide as his body shows the path
 *           (0.75 s, butter spraying behind the dish like spinning wheels), then the dish slides down
 *           it at full speed leaving a buttery trail; enraged he turns and slides a second time
 *   pats    three rotating rings of butter pats (12, 16 enraged)
 * Enrage (< 50 % HP): it MELTS: smaller hitbox, drawn at 0.9 scale, faster, puddles all around, and it
 * keeps dripping.
 */
import { brain, ring, lobShot, hazard, steer, toPlayer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const PAT = 'proj.e_butterpat';
const MELTED = 1; // e.aux flag
const BUTTER = ['#fff3b0', '#fbe58a', '#ffffff'];

function facePlayer(run: Run, e: Enemy) {
  e.face = run.player.x >= e.x ? 1 : -1;
}

/** Aim a slide at the chef: face him and lay the lane of warning circles. */
function aimSlide(run: Run, e: Enemy, wind: number, dur: number, speed: number) {
  const tp = toPlayer(run, e);
  e.ax = tp.dx;
  e.ay = tp.dy;
  e.face = tp.dx >= 0 ? 1 : -1;
  e.telegraph = wind;
  e.attackPose = wind + dur;
  // the lane as wide as the block: where it will slide
  const len = speed * dur;
  const w = e.r * 0.8;
  for (let d = e.r * 0.5; d <= len; d += w * 1.05) run.addArea('warning', e.x + e.ax * d, e.y + e.ay * d, w, wind, { enemy: true });
  run.sfx('enemy_dash', { volume: 0.7, pitch: 0.7 }, e.x);
}

export const burro: Pattern = (run, e, dt) => {
  if (e.bossPhase && !(e.aux & MELTED)) {
    e.aux |= MELTED;
    e.r *= 0.85;
    e.scale *= 0.9;
    e.speed *= 1.25;
    for (let i = 0; i < 6; i++) hazard(run, 'butter', e.x + Math.cos((i / 6) * TAU) * 70, e.y + Math.sin((i / 6) * TAU) * 55, 34, 6, 0.3);
    run.fx.burst(e.x, e.y - e.r * 0.6, 24, { colors: BUTTER, speed: 260, size: 5, life: 0.9, gravity: 500, up: 180 });
    run.fx.bubble(e, 'Mi sciolgo… ma non mollo!', -e.r * 2.4, '#fff3b0', 1.6, true);
  }
  // melted: it keeps dripping
  if (e.aux & MELTED && Math.random() < dt * 5) {
    run.fx.burst(e.x + (Math.random() - 0.5) * e.r * 1.6, e.y - e.r * (0.6 + Math.random() * 0.6), 1, { colors: BUTTER, speed: 20, size: 4, life: 0.7, gravity: 520, up: 40, shrink: false });
  }
  brain(run, e, dt, ['melt', 'slide', 'pats', 'slide', 'melt', 'pats'], 1, (a, t, first) => {
    if (a === 'slide') {
      const wind = 0.75, wind2 = 0.5, dur = 0.85;
      const speed = e.bossPhase ? 600 : 520;
      const twice = e.bossPhase > 0;
      const t1 = wind + dur; // end of the first slide
      if (first) aimSlide(run, e, wind, dur, speed);
      if (twice && t >= t1 && t - dt < t1) aimSlide(run, e, wind2, dur, speed);
      const winding = t < wind || (twice && t >= t1 && t < t1 + wind2);
      e.face = e.ax >= 0 ? 1 : -1; // steer() would turn him by his leftover walk
      if (winding) {
        steer(e, 0, 0, dt, 8);
        e.face = e.ax >= 0 ? 1 : -1;
        // revving: butter sprays out behind the dish
        if (Math.random() < dt * 24) {
          run.fx.burst(e.x - e.ax * e.r * 0.7, e.y + e.r * 0.6, 1, { colors: BUTTER, speed: 170, size: 4, life: 0.4, angle: Math.atan2(-e.ay, -e.ax), spread: 1, up: 60, gravity: 400 });
        }
      } else {
        e.x += e.ax * speed * dt;
        e.y += e.ay * speed * dt;
        e.vx = e.ax * speed;
        e.vy = e.ay * speed;
        e.anim += dt * 12;
        if (Math.floor((t - dt) * 10) !== Math.floor(t * 10)) hazard(run, 'butter', e.x, e.y + e.r * 0.5, 24, 3.5, 0.3);
        if (Math.random() < dt * 30) run.fx.streak(e.x, e.y - e.r * 0.3, -e.ax * 220, -e.ay * 220, '#fff3b0', 0.3, 6);
      }
      // a skid and a splash where each slide stops
      const end = t1 + (twice ? wind2 + dur : 0);
      for (const stop of twice ? [t1, end] : [t1]) {
        if (t >= stop && t - dt < stop) {
          e.vx *= 0.1;
          e.vy *= 0.1;
          run.fx.burst(e.x + e.ax * e.r * 0.6, e.y + e.r * 0.5, 12, { colors: BUTTER, speed: 200, size: 4.5, life: 0.5, angle: Math.atan2(e.ay, e.ax), spread: 1.6, up: 80, gravity: 400 });
        }
      }
      return t > end;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'melt') {
      if (first) {
        facePlayer(run, e);
        e.telegraph = 0.4;
        e.attackPose = 1.8;
      }
      if (t > 0.4 && Math.floor((t - dt) * 3.5) !== Math.floor(t * 3.5)) {
        const p = run.player;
        const x = p.x + p.vx * 0.5 + (Math.random() - 0.5) * 170, y = p.y + p.vy * 0.5 + (Math.random() - 0.5) * 120;
        run.addArea('warning', x, y, 40, 0.8, { enemy: true });
        lobShot(run, e, x, y, 0.8, PAT, e.damage * 0.5, (lx, ly) => {
          hazard(run, 'butter', lx, ly, 40, 6, 0.35);
          run.fx.burst(lx, ly, 8, { colors: BUTTER, speed: 120, size: 4, life: 0.5 });
        });
      }
      return t > 1.9;
    }
    // pats: rotating rings
    if (first) {
      facePlayer(run, e);
      e.telegraph = 0.45;
      e.attackPose = 1.6;
    }
    for (let k = 0; k < 3; k++) {
      const at = 0.45 + k * 0.4;
      if (t >= at && t - dt < at) ring(run, e, e.bossPhase ? 16 : 12, 165, PAT, k * 0.13 + e.bossStep * 0.4, 0.45);
    }
    return t > 1.7;
  });
};
