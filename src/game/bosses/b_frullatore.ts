/**
 * IL FRULLATORE ROVENTE — The Red-Hot Blender (final boss of the Pesto).
 *
 *   spray   a sweeping cone of green sludge (one stream; two crossing streams enraged)
 *   vortex  contracting green rings warn, then the blade spins up and PULLS the chef in
 *           (slower than the chef can walk) while rings of sludge spin out
 *   blades  three rotating rings of sludge
 *   summon  a handful of bootleg cashews ('anacardo' swarm)
 * Enrage (< 50 % HP): it OVERHEATS: red-hot glow, fire patches under it as it walks.
 */
import { brain, ring, shoot, summon, hazard, steer, toPlayer, type Pattern } from '../ai';
import { TAU } from '../../core/math';

const PESTO = 'proj.e_pesto';
const HOT = 1; // e.aux flag

export const frullatore: Pattern = (run, e, dt) => {
  if (e.bossPhase) {
    if (!(e.aux & HOT)) {
      e.aux |= HOT;
      e.speed *= 1.15;
      run.fx.bubble(e, 'SURRISCALDATO!', -e.r * 2.4, '#ffb08a', 1.5, true);
      run.fx.ring(e.x, e.y, 10, 220, 0.6, '#ff7b2e', 8);
    }
    // overheated: embers (and a fire patch every half second, below)
    if (Math.random() < dt * 14) run.fx.burst(e.x + (Math.random() - 0.5) * e.r, e.y - e.r * (0.5 + Math.random()), 1, { colors: ['#ffd34d', '#ff7b2e', '#ff3d1f'], speed: 40, size: 3, life: 0.6, additive: true, angle: -Math.PI / 2, spread: 0.6 });
  }
  brain(run, e, dt, ['spray', 'vortex', 'blades', 'summon', 'spray', 'blades'], 0.95, (a, t, first) => {
    steer(e, 0, 0, dt, 6);
    if (a === 'spray') {
      const wind = 0.5, dur = 1.3;
      if (first) {
        e.telegraph = wind;
        e.attackPose = wind + dur;
        const tp = toPlayer(run, e);
        e.ax = Math.atan2(tp.dy, tp.dx); // cone centre
      }
      if (t > wind && Math.floor((t - dt) * 9) !== Math.floor(t * 9)) {
        const sweep = Math.sin((t - wind) * 5) * 0.55;
        shoot(run, e, e.ax + sweep, 230, PESTO, e.damage * 0.45, 8);
        if (e.bossPhase) shoot(run, e, e.ax - sweep, 230, PESTO, e.damage * 0.45, 8);
        run.sfx('enemy_shoot', { volume: 0.25, pitch: 1.3 }, e.x);
      }
      return t > wind + dur;
    }
    if (a === 'vortex') {
      const wind = 0.7, dur = 2.4;
      if (first) {
        e.telegraph = wind;
        e.attackPose = wind + dur;
        run.fx.bubble(e, 'Frulla frulla!', -e.r * 2.4, '#d9f5a0', 1.2, true);
      }
      if (Math.floor((t - dt) * 3) !== Math.floor(t * 3)) run.fx.ring(e.x, e.y, 320, 30, 0.6, '#9fe060', 4, true);
      if (t > wind) {
        // pull the chef in (he walks at ~132 u/s: he can always escape)
        const p = run.player;
        const dx = e.x - p.x, dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 560 && d > e.r) {
          const pull = 72 * Math.min(1, (t - wind) * 2);
          p.x += (dx / d) * pull * dt;
          p.y += (dy / d) * pull * dt;
        }
        if (Math.floor((t - dt) * 1.6) !== Math.floor(t * 1.6)) ring(run, e, e.bossPhase ? 12 : 9, 150, PESTO, t * 1.7, 0.45);
        if (Math.random() < dt * 30) {
          const ang = Math.random() * TAU, rr = 80 + Math.random() * 220;
          run.fx.streak(e.x + Math.cos(ang) * rr, e.y + Math.sin(ang) * rr, -Math.cos(ang) * 240, -Math.sin(ang) * 240, '#bfe88a', 0.3, 3);
        }
      }
      return t > wind + dur;
    }
    if (a === 'blades') {
      if (first) {
        e.telegraph = 0.45;
        e.attackPose = 1.6;
      }
      for (let k = 0; k < 3; k++) {
        const at = 0.45 + k * 0.35;
        if (t >= at && t - dt < at) ring(run, e, e.bossPhase ? 18 : 14, 170, PESTO, k * 0.22 + e.bossStep * 0.3, 0.45);
      }
      return t > 1.5;
    }
    // summon cashews
    if (first) {
      summon(run, e, 'anacardo', e.bossPhase ? 12 : 8);
      e.attackPose = 0.6;
      run.fx.bubble(e, 'Con anacardi!', -e.r * 2.4, '#d9f5a0', 1.1, true);
      run.sfx('enemy_split', { volume: 0.5 }, e.x);
    }
    return t > 0.8;
  });
  // overheated: a fire patch at its base every 0.5 s while it moves
  if (e.bossPhase && e.alive && Math.floor((run.time - dt) * 2) !== Math.floor(run.time * 2) && Math.hypot(e.vx, e.vy) > 10) {
    hazard(run, 'fire', e.x, e.y + e.r * 0.6, 26, 3, 0, e.damage * 0.22);
  }
};
