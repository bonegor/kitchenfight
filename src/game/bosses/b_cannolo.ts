/**
 * IL CANNOLONE TAROCCO — The Fake Mega-Cannolo (final boss of the Cannoli siciliani).
 * A giant puff-pastry horn heaped with whipped cream, in a gondolier's straw hat: the "Sicilian"
 * cannolo of the Venice shop windows.
 *
 * Body language (art: boss.cannolo.attack). WIND-UP (e.telegraph): the piping bag goes up and is
 * squeezed, cream bulging at the nozzle. ATTACK: the bag points forward and squirts.
 *
 *   squirt  it turns to the chef; the cone it will cover is marked and FIXED at wind-up, then 3 bursts
 *           (4 enraged) of whipped cream fill it, every other burst shifted half a gap: the way out
 *           is sideways
 *   flakes  three staggered rings of puff-pastry flakes
 *   flop    warning circle, a soggy belly-flop leap onto the chef; on landing a cream puddle and a
 *           ring of flakes
 *   summon  calls neon cannoli ('fluo' bursters)
 * Enrage (< 50 % HP): "AMMUDDATO!" — it goes soggy: quicker, and it leaves cream puddles where it
 * walks.
 * The entrance gate is brain()'s.
 */
import { brain, shoot, danger, hazard, leap, summon, steer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const CREAM = 'proj.e_cream';
const FLAKE = 'proj.e_flake';
const SOGGY = 1; // e.aux flag
const CREAM_COL = ['#fffdf6', '#f6efe0', '#ffd0ef'];
/** The nozzle of the piping bag in the attack pose (sprite units from the anchor, facing right). */
const NOZ_X = 92, NOZ_Y = -86;

const drips = new WeakMap<Enemy, { id: number; at: number }>();

function nozzle(e: Enemy): [number, number] {
  return [e.x + NOZ_X * e.face * e.scale, e.y + NOZ_Y * e.scale];
}

function flakeRing(run: Run, e: Enemy, n: number, speed: number, off: number) {
  const cy = e.y - e.r * 0.6;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU;
    const s = shoot(run, e, a, speed, FLAKE, e.damage * 0.45, 8);
    s.x = e.x + Math.cos(a) * e.r * 1.25;
    s.y = cy + Math.sin(a) * e.r * 1.15;
    s.spin = 7;
  }
  run.fx.ring(e.x, cy, e.r * 0.8, e.r * 2, 0.3, '#ffe0a0', 6);
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
}

/** Mark the cone a squirt will cover (from the nozzle). */
function squirtCone(run: Run, ox: number, oy: number, c: number, spread: number, life: number) {
  for (const [dist, n] of [[120, 6], [210, 8]] as [number, number][]) {
    for (let i = 0; i < n; i++) {
      const a = c + (i / (n - 1) - 0.5) * spread;
      run.addArea('warning', ox + Math.cos(a) * dist, oy + Math.sin(a) * dist, 14, life, { enemy: true });
    }
  }
}

export const cannolo: Pattern = (run, e, dt) => {
  if (e.bossPhase) {
    if (!(e.aux & SOGGY)) {
      e.aux |= SOGGY;
      e.speed *= 1.2;
      run.fx.bubble(e, 'AMMUDDATO!', -e.r * 2.6, '#fff3d6', 1.5, true);
      run.fx.burst(e.x, e.y - e.r * 1.2, 26, { colors: CREAM_COL, speed: 240, size: 5, life: 0.9, gravity: 500, up: 160 });
    }
    // soggy: cream drips off it and pools where it walks
    let d = drips.get(e);
    if (!d || d.id !== e.id) drips.set(e, (d = { id: e.id, at: 0 }));
    if (dt > 0 && run.time >= d.at && e.state !== 50) {
      d.at = run.time + 0.5;
      hazard(run, 'cream', e.x + (Math.random() - 0.5) * e.r * 0.8, e.y + e.r * 0.45, 22 + Math.random() * 6, 2.6, 0.25);
    }
  }
  brain(run, e, dt, ['squirt', 'flakes', 'flop', 'summon', 'squirt', 'flakes'], 0.95, (a, t, first) => {
    if (a === 'flop') {
      if (first) {
        const p = run.player;
        danger(run, p.x, p.y, e.r * 1.9, 1.1, 0);
        leap(e, p.x, p.y, 1.1, e.r * 1.9);
        e.attackPose = 1.1;
        run.fx.bubble(e, 'Splat!', -e.r * 2.6, '#fff3d6', 1.0, true);
        e.onLand = () => {
          hazard(run, 'cream', e.x, e.y, e.r * 1.6, 5, 0.35);
          flakeRing(run, e, e.bossPhase ? 16 : 12, 150, Math.random());
          run.fx.burst(e.x, e.y, 24, { colors: CREAM_COL, speed: 260, size: 5, life: 0.8, drag: 1.5 });
        };
      }
      return true;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'squirt') {
      const bursts = e.bossPhase ? 4 : 3;
      const n = e.bossPhase ? 9 : 7;
      const spread = 1.0;
      const wind = 0.55;
      if (first) {
        const p = run.player;
        e.face = p.x >= e.x ? 1 : -1;
        const [ox, oy] = nozzle(e);
        e.ax = Math.atan2(p.y - 8 - oy, p.x - ox);
        e.telegraph = wind;
        e.attackPose = wind + 0.1 + bursts * 0.35;
        squirtCone(run, ox, oy, e.ax, spread * (1 + 1 / (n - 1)) + 0.1, wind + (bursts - 1) * 0.35);
        run.sfx('enemy_dash', { volume: 0.35, pitch: 1.3 }, e.x);
      }
      e.face = Math.cos(e.ax) >= 0 ? 1 : -1;
      for (let k = 0; k < bursts; k++) {
        const at = wind + k * 0.35;
        if (t >= at && t - dt < at) {
          const [ox, oy] = nozzle(e);
          const m = n + (k % 2);
          const step = spread / (n - 1);
          for (let i = 0; i < m; i++) {
            const s = shoot(run, e, e.ax + (i - (m - 1) / 2) * step, 185, CREAM, e.damage * 0.45, 8);
            s.x = ox;
            s.y = oy;
          }
          run.fx.burst(ox, oy, 6, { colors: CREAM_COL, speed: 160, size: 3, life: 0.3, angle: e.ax, spread: 1.0 });
          run.sfx('boss_shoot', { volume: 0.5 }, e.x);
        }
      }
      return t > wind + 0.1 + bursts * 0.35;
    }
    if (a === 'flakes') {
      const n = e.bossPhase ? 16 : 12;
      if (first) {
        e.face = run.player.x >= e.x ? 1 : -1;
        e.telegraph = 0.45;
        e.attackPose = 1.6;
        e.ay = Math.random() * TAU;
      }
      for (let k = 0; k < 3; k++) {
        const at = 0.45 + k * 0.38;
        if (t >= at && t - dt < at) flakeRing(run, e, n, 160, e.ay + (k % 2) * (Math.PI / n));
      }
      return t > 1.6;
    }
    // summon neon cannoli
    if (first) {
      summon(run, e, 'fluo', e.bossPhase ? 5 : 3);
      e.attackPose = 0.6;
      run.fx.bubble(e, 'Più colore!', -e.r * 2.6, '#ffd0ef', 1.1, true);
      run.sfx('boss_roar', { volume: 0.5 }, e.x);
    }
    return t > 0.8;
  });
};
