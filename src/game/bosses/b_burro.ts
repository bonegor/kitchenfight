/**
 * IL PANETTO SUPREMO — The Supreme Butter Block (final boss of Cacio e Pepe; mid-boss in
 * Pesto and Vongole).
 *
 *   melt    lobs butter pats around the chef: each lands as a slippery butter puddle
 *   slide   a red lane of warning circles shows the path, then the block slides down it
 *           at full speed, leaving a buttery trail (two slides in a row when enraged)
 *   pats    three rotating rings of butter pats
 * Enrage (< 50 % HP): it MELTS: smaller hitbox, faster, puddles everywhere.
 */
import { brain, ring, lobShot, hazard, steer, toPlayer, type Pattern } from '../ai';
import { TAU } from '../../core/math';

const PAT = 'proj.e_butterpat';
const MELTED = 1; // e.aux flag

export const burro: Pattern = (run, e, dt) => {
  if (e.bossPhase && !(e.aux & MELTED)) {
    e.aux |= MELTED;
    e.r *= 0.85;
    e.scale *= 0.9;
    e.speed *= 1.25;
    for (let i = 0; i < 6; i++) hazard(run, 'butter', e.x + Math.cos((i / 6) * TAU) * 70, e.y + Math.sin((i / 6) * TAU) * 55, 34, 6, 0.3);
    run.fx.bubble(e, 'Mi sciolgo… ma non mollo!', -e.r * 2.4, '#fff3b0', 1.6, true);
  }
  brain(run, e, dt, ['melt', 'slide', 'pats', 'slide', 'melt', 'pats'], 1, (a, t, first) => {
    if (a === 'slide') {
      const wind = 0.75;
      const dur = 0.85;
      const speed = e.bossPhase ? 600 : 520;
      if (first) {
        const tp = toPlayer(run, e);
        e.ax = tp.dx;
        e.ay = tp.dy;
        e.telegraph = wind;
        e.attackPose = wind + dur;
        // the lane: where the block will slide
        const len = speed * dur;
        for (let d = e.r; d <= len; d += 44) run.addArea('warning', e.x + e.ax * d, e.y + e.ay * d, 30, wind, { enemy: true });
        run.sfx('enemy_dash', { volume: 0.7, pitch: 0.7 }, e.x);
      }
      if (t > wind) {
        e.x += e.ax * speed * dt;
        e.y += e.ay * speed * dt;
        e.vx = e.ax * speed;
        e.vy = e.ay * speed;
        e.anim += dt * 12;
        if (Math.floor((t - dt) * 10) !== Math.floor(t * 10)) hazard(run, 'butter', e.x, e.y + e.r * 0.5, 24, 3.5, 0.3);
        if (Math.random() < dt * 30) run.fx.streak(e.x, e.y - e.r * 0.3, -e.ax * 220, -e.ay * 220, '#fff3b0', 0.3, 6);
      } else steer(e, 0, 0, dt, 8);
      return t > wind + dur;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'melt') {
      if (first) {
        e.telegraph = 0.4;
        e.attackPose = 1.8;
      }
      if (t > 0.4 && Math.floor((t - dt) * 3.5) !== Math.floor(t * 3.5)) {
        const p = run.player;
        const x = p.x + p.vx * 0.5 + (Math.random() - 0.5) * 170, y = p.y + p.vy * 0.5 + (Math.random() - 0.5) * 120;
        lobShot(run, e, x, y, 0.8, PAT, e.damage * 0.5, (lx, ly) => {
          hazard(run, 'butter', lx, ly, 40, 6, 0.35);
          run.fx.burst(lx, ly, 8, { colors: ['#fff3b0', '#fbe58a', '#ffffff'], speed: 120, size: 4, life: 0.5 });
        });
      }
      return t > 1.9;
    }
    // pats: rotating rings
    if (first) {
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
