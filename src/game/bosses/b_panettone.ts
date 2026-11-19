/**
 * IL PANETTONE INDUSTRIALE — The Factory Panettone (final boss of the Panettone).
 * A giant panettone in its paper mould, sealed in cellophane with a big red bow: made in two hours
 * with yeast and margarine.
 *
 * Body language (art: boss.panettone.attack). WIND-UP (e.telegraph): arms up, the dome swells and
 * glows like the oven. ATTACK: the cross cut on the dome bursts open and the raisins fly.
 *
 *   raisins  three aimed fans of raisins (the middle shot of each at the chef)
 *   margarine lobs pats of margarine at and around the chef; every landing spot is marked by a
 *           warning ring the size of the slippery slick it becomes
 *   flip     "a testa in giù!": warning circle, it flips over and slams down on the chef (a panettone
 *           is cooled hanging upside down); a ring of raisins and candied peel on landing
 *   summon   a clump of baker's yeast cubes ('lievito' swarm)
 * Enrage (< 50 % HP): "SGONFIO!" — the dome sinks: drawn at 0.9 scale, a smaller hitbox, quicker.
 * The entrance gate is brain()'s.
 */
import { brain, aimed, danger, hazard, leap, lobShot, ring, summon, steer, type Pattern } from '../ai';
import type { Enemy } from '../entities';

const RAISIN = 'proj.e_raisin';
const PAT = 'proj.e_butterpat';
const SUNK = 1; // e.aux flag
const CRUMB = ['#f2c24a', '#c98a3a', '#5a2a3a', '#ffa21e'];

/** Shots leave from the dome's cross cut, not from the middle of the body. */
function fromDome(e: Enemy, from: number) {
  return (s: { x: number; y: number }) => {
    s.x = e.x + e.face * e.r * 0.1;
    s.y = e.y - e.r * from;
  };
}

export const panettone: Pattern = (run, e, dt) => {
  if (e.bossPhase && !(e.aux & SUNK)) {
    e.aux |= SUNK;
    e.r *= 0.9;
    e.scale *= 0.9;
    e.speed *= 1.2;
    run.fx.bubble(e, 'SGONFIO!', -e.r * 2.6, '#fff0c8', 1.5, true);
    run.fx.burst(e.x, e.y - e.r * 1.6, 26, { colors: CRUMB, speed: 240, size: 5, life: 0.9, gravity: 500, up: 160 });
  }
  brain(run, e, dt, ['raisins', 'margarine', 'flip', 'summon', 'raisins', 'margarine'], 0.95, (a, t, first) => {
    if (a === 'flip') {
      if (first) {
        const p = run.player;
        danger(run, p.x, p.y, e.r * 1.9, 1.15, 0);
        leap(e, p.x, p.y, 1.15, e.r * 1.9);
        e.attackPose = 1.15;
        run.fx.bubble(e, 'A testa in giù!', -e.r * 2.6, '#fff0c8', 1.0, true);
        e.onLand = () => {
          const n = e.bossPhase ? 18 : 14;
          const before = run.shots.length;
          ring(run, e, n, 150, RAISIN, Math.random());
          for (let i = before; i < run.shots.length; i++) fromDome(e, 0.9)(run.shots[i]);
          run.fx.burst(e.x, e.y, 24, { colors: CRUMB, speed: 260, size: 5, life: 0.8, drag: 1.5 });
        };
      }
      return true;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'raisins') {
      if (first) {
        e.face = run.player.x >= e.x ? 1 : -1;
        e.telegraph = 0.5;
        e.attackPose = 1.6;
      }
      for (let k = 0; k < 3; k++) {
        const at = 0.5 + k * 0.38;
        if (t >= at && t - dt < at) {
          const before = run.shots.length;
          aimed(run, e, e.bossPhase ? 9 : 7, 0.95, 180, RAISIN);
          for (let i = before; i < run.shots.length; i++) fromDome(e, 1.5)(run.shots[i]);
          run.fx.burst(e.x, e.y - e.r * 1.5, 6, { colors: CRUMB, speed: 140, size: 3.5, life: 0.35 });
        }
      }
      return t > 1.6;
    }
    if (a === 'margarine') {
      if (first) {
        const p = run.player;
        e.face = p.x >= e.x ? 1 : -1;
        e.telegraph = 0.4;
        e.attackPose = 1.4;
        const n = e.bossPhase ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const x = i === 0 ? p.x + p.vx * 0.4 : p.x + (Math.random() - 0.5) * 260;
          const y = i === 0 ? p.y + p.vy * 0.4 : p.y + (Math.random() - 0.5) * 190;
          const fly = 0.8 + i * 0.12;
          run.addArea('warning', x, y, 42, fly, { enemy: true });
          lobShot(run, e, x, y, fly, PAT, e.damage * 0.5, (lx, ly) => {
            hazard(run, 'butter', lx, ly, 42, 6, 0.35);
            run.fx.burst(lx, ly, 8, { colors: ['#fff3b0', '#ffe36a', '#ffffff'], speed: 120, size: 4, life: 0.5 });
          });
        }
        run.sfx('enemy_shoot', { volume: 0.4, pitch: 0.8 }, e.x);
      }
      return t > 1.4;
    }
    // summon a clump of yeast
    if (first) {
      summon(run, e, 'lievito', e.bossPhase ? 12 : 8);
      e.attackPose = 0.6;
      run.fx.bubble(e, 'Lievita!', -e.r * 2.6, '#fff0c8', 1.1, true);
      run.sfx('enemy_split', { volume: 0.5 }, e.x);
    }
    return t > 0.8;
  });
};
