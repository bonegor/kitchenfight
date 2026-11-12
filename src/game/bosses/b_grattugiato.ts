/**
 * IL SACCO DEL GRATTUGIATO — The Bag of Pre-Grated Cheese (final boss of the Vongole;
 * mid-boss in the Marinara).
 *
 *   snow    it turns to the chef and raises the heaped spoon; the cone is marked and FIXED at
 *           wind-up, then 3 bursts (4 enraged) of grated "parmesan" snow fill it, every other
 *           burst shifted half a gap: the way out is sideways, out of the cone
 *   cloud   lobs cheese bombs at and around the chef; every landing spot is marked, and each
 *           bursts into a slowing cheese cloud (a pulsing amber rim and falling shreds show it)
 *   flop    warning circle, belly-flop leap, a cheese cloud and a ring of cheese on landing
 *   summon  calls cheesy clams ('vongola' crimes)
 * Enrage (< 50 % HP): the torn corner rips wider: it snows cheese as it walks, denser snow,
 * more clouds.
 */
import { brain, shoot, danger, hazard, leap, lobShot, summon, steer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const CHEESE = 'proj.e_cheese';
const RIPPED = 1; // e.aux flag

/** A white "pop" ring drawn ABOVE the boss (fx.ring always lands on the ground layer, under the sprite). */
function popRing(run: Run, x: number, y: number, r0: number, r1: number, life = 0.32) {
  run.fx.ring(x, y, r0, r1, life, '#ffffff', 8, false);
  const p = run.fx.particles[run.fx.particles.length - 1];
  if (p && p.shape === 2 && p.size === r0) p.layer = 1;
}

/** Shots leaving from the rim of the bag (not over the cream body), with a white pop. */
function rimShot(run: Run, e: Enemy, a: number, speed: number, dmg: number, rim: number) {
  const s = shoot(run, e, a, speed, CHEESE, dmg, 8);
  s.x = e.x + Math.cos(a) * e.r * rim;
  s.y = e.y - e.r * 0.5 + Math.sin(a) * e.r * rim;
}

/**
 * A slowing cheese cloud that is easy to see on any floor: the 'cheese' area is only a soft glow,
 * so while it lives it pulses an amber rim and grated shreds drift down inside it.
 */
function cheeseCloud(run: Run, x: number, y: number, r: number, life: number) {
  const area = hazard(run, 'cheese', x, y, r, life, 0.35, 3);
  let n = 0;
  const tick = () => {
    // areas are pooled: stop when this one died (or was reused for something else)
    if (!area.alive || area.kind !== 'cheese' || area.x !== x || area.y !== y) return;
    if (n % 3 === 0) {
      run.fx.ring(x, y, r * 0.86, r * 1.0, 0.55, '#c9973a', 3.5, false);
      run.fx.ring(x, y, r * 0.8, r * 0.94, 0.55, '#fff3c8', 2, false);
    }
    const k = Math.min(3, Math.ceil(r / 24));
    for (let i = 0; i < k; i++) {
      const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * r * 0.85;
      run.fx.sprite(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 'fx.cheese_flake', {
        frame: (Math.random() * 3) | 0, vz: -12, gravity: 40, life: 0.7 + Math.random() * 0.3, size: 0.9 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 16, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, layer: 0,
      });
      // start them in the air: they fall onto the floor of the cloud
      const p = run.fx.particles[run.fx.particles.length - 1];
      if (p && p.sprite === 'fx.cheese_flake') p.z = 14 + Math.random() * 22;
    }
    n++;
    run.schedule(0.14, tick);
  };
  tick();
  return area;
}

/** Mark the cone a snow burst will cover (from the shot origin). */
function snowCone(run: Run, e: Enemy, c: number, spread: number, wind: number) {
  const ox = e.x, oy = e.y - e.r * 0.5;
  for (const [dist, n] of [[120, 6], [210, 8]] as [number, number][]) {
    for (let i = 0; i < n; i++) {
      const a = c + (i / (n - 1) - 0.5) * spread;
      run.addArea('warning', ox + Math.cos(a) * dist, oy + Math.sin(a) * dist, 14, wind, { enemy: true });
    }
  }
}

export const grattugiato: Pattern = (run, e, dt) => {
  if (e.bossPhase) {
    if (!(e.aux & RIPPED)) {
      e.aux |= RIPPED;
      run.fx.bubble(e, 'Si è strappato!', -e.r * 2.4, '#fff3d6', 1.4, true);
      run.fx.burst(e.x + e.r * 0.6 * e.face, e.y - e.r * 2.2, 30, { colors: ['#fff6d6', '#f4e3a6', '#ffffff'], speed: 220, size: 4, life: 0.9, drag: 1.5 });
    }
    // the ripped corner snows cheese as it walks
    if (Math.random() < dt * 12) run.fx.burst(e.x + e.r * 0.75 * e.face, e.y - e.r * 2.1, 1, { colors: ['#fff6d6', '#f4e3a6'], speed: 50, size: 3, life: 0.9, angle: Math.PI / 2, spread: 0.9, gravity: 120 });
  }
  brain(run, e, dt, ['snow', 'cloud', 'flop', 'summon', 'snow', 'cloud'], 0.95, (a, t, first) => {
    if (a === 'flop') {
      if (first) {
        const p = run.player;
        danger(run, p.x, p.y, e.r * 1.9, 1.1, 0);
        leap(e, p.x, p.y, 1.1, e.r * 1.9);
        e.attackPose = 1.1;
        run.fx.bubble(e, 'Abbondante!', -e.r * 2.4, '#fff3d6', 1.0, true);
        e.onLand = () => {
          cheeseCloud(run, e.x, e.y, e.r * 1.6, 5);
          const n = e.bossPhase ? 16 : 12, off = Math.random();
          for (let i = 0; i < n; i++) rimShot(run, e, off + (i / n) * TAU, 150, e.damage * 0.4, 1.3);
          popRing(run, e.x, e.y - e.r * 0.5, e.r, e.r * 2.1);
          run.sfx('boss_shoot', { volume: 0.5 }, e.x);
          run.fx.burst(e.x, e.y, 26, { colors: ['#fff6d6', '#f4e3a6', '#ffffff'], speed: 260, size: 5, life: 0.8, drag: 1.5 });
        };
      }
      return true;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'snow') {
      const bursts = e.bossPhase ? 4 : 3;
      const n = e.bossPhase ? 9 : 7;
      const spread = 1.0;
      const wind = 0.55;
      if (first) {
        const p = run.player;
        // the cone is fixed now: aimed from the shot origin at the chef's body
        e.ax = Math.atan2(p.y - 8 - (e.y - e.r * 0.5), p.x - e.x);
        e.telegraph = wind;
        e.attackPose = wind + 0.1 + bursts * 0.35;
        snowCone(run, e, e.ax, spread * (1 + 1 / (n - 1)) + 0.1, wind + (bursts - 1) * 0.35);
        run.sfx('enemy_dash', { volume: 0.35, pitch: 1.2 }, e.x);
      }
      e.face = Math.cos(e.ax) >= 0 ? 1 : -1;
      for (let k = 0; k < bursts; k++) {
        const at = wind + k * 0.35;
        if (t >= at && t - dt < at) {
          // odd bursts carry one more shot, shifted half a gap: they land in the previous burst's gaps
          const m = n + (k % 2);
          const step = spread / (n - 1);
          for (let i = 0; i < m; i++) rimShot(run, e, e.ax + (i - (m - 1) / 2) * step, 185, e.damage * 0.45, 1.15);
          const ox = e.x + Math.cos(e.ax) * e.r * 1.15, oy = e.y - e.r * 0.5 + Math.sin(e.ax) * e.r * 1.15;
          popRing(run, ox, oy, 6, 34, 0.24);
          run.fx.burst(ox, oy, 6, { colors: ['#fff6d6', '#ffffff'], speed: 160, size: 3, life: 0.3, angle: e.ax, spread: 1.0 });
          run.sfx('boss_shoot', { volume: 0.5 }, e.x);
        }
      }
      return t > wind + 0.1 + bursts * 0.35;
    }
    if (a === 'cloud') {
      if (first) {
        e.telegraph = 0.4;
        e.attackPose = 1.4;
        const p = run.player;
        e.face = p.x >= e.x ? 1 : -1;
        const n = e.bossPhase ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const x = i === 0 ? p.x : p.x + (Math.random() - 0.5) * 260;
          const y = i === 0 ? p.y : p.y + (Math.random() - 0.5) * 190;
          const fly = 0.75 + i * 0.12;
          run.addArea('warning', x, y, 54, fly, { enemy: true });
          lobShot(run, e, x, y, fly, CHEESE, e.damage * 0.5, (lx, ly) => {
            cheeseCloud(run, lx, ly, 54, 5);
            run.fx.burst(lx, ly, 12, { colors: ['#fff6d6', '#f4e3a6'], speed: 150, size: 5, life: 0.6 });
          });
        }
        run.sfx('enemy_shoot', { volume: 0.4, pitch: 0.8 }, e.x);
      }
      return t > 1.4;
    }
    // summon cheesy clams
    if (first) {
      summon(run, e, 'vongola', e.bossPhase ? 5 : 3);
      e.attackPose = 0.6;
      run.fx.bubble(e, 'Più formaggio!', -e.r * 2.4, '#fff3d6', 1.1, true);
      run.sfx('boss_roar', { volume: 0.5 }, e.x);
    }
    return t > 0.8;
  });
};
