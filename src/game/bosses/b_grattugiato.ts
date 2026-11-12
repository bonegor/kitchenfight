/**
 * IL SACCO DEL GRATTUGIATO — The Bag of Pre-Grated Cheese (final boss of the Vongole;
 * mid-boss in the Marinara).
 *
 *   snow    it raises the heaped spoon (the cone is marked), then cones of grated "parmesan"
 *           snow at the chef: 3 bursts (4 enraged), every other burst shifted half a gap, so
 *           the way out is sideways, out of the cone
 *   cloud   lobs cheese bombs at and around the chef; every landing spot is marked, and each
 *           bursts into a slowing cheese cloud
 *   flop    warning circle, belly-flop leap, a cheese cloud and a ring of cheese on landing
 *   summon  calls cheesy clams ('vongola' crimes)
 * Enrage (< 50 % HP): the torn corner rips wider: it snows cheese as it walks, denser snow,
 * more clouds.
 */
import { brain, aimed, ring, danger, hazard, leap, lobShot, summon, steer, toPlayer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';

const CHEESE = 'proj.e_cheese';
const RIPPED = 1; // e.aux flag

/** Mark the cone a snow burst will cover. */
function snowCone(run: Run, e: Enemy, spread: number, wind: number) {
  const tp = toPlayer(run, e);
  const c = Math.atan2(tp.dy, tp.dx);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = c + (i / (n - 1) - 0.5) * spread;
    run.addArea('warning', e.x + Math.cos(a) * 120, e.y - e.r * 0.5 + Math.sin(a) * 120, 14, wind, { enemy: true });
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
          hazard(run, 'cheese', e.x, e.y, e.r * 1.6, 5, 0.35, 3);
          ring(run, e, e.bossPhase ? 16 : 12, 150, CHEESE, Math.random(), 0.4);
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
        e.telegraph = wind;
        e.attackPose = wind + 0.1 + bursts * 0.35;
        snowCone(run, e, spread + 0.15, wind);
        run.sfx('enemy_dash', { volume: 0.35, pitch: 1.2 }, e.x);
      }
      for (let k = 0; k < bursts; k++) {
        const at = wind + k * 0.35;
        // odd bursts are widened by one gap: their shots land in the previous burst's gaps
        if (t >= at && t - dt < at) aimed(run, e, n + (k % 2), spread * (1 + (k % 2) / (n - 1)), 185, CHEESE);
      }
      return t > wind + 0.1 + bursts * 0.35;
    }
    if (a === 'cloud') {
      if (first) {
        e.telegraph = 0.4;
        e.attackPose = 1.4;
        const p = run.player;
        const n = e.bossPhase ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const x = i === 0 ? p.x : p.x + (Math.random() - 0.5) * 260;
          const y = i === 0 ? p.y : p.y + (Math.random() - 0.5) * 190;
          const fly = 0.75 + i * 0.12;
          run.addArea('warning', x, y, 54, fly, { enemy: true });
          lobShot(run, e, x, y, fly, CHEESE, e.damage * 0.5, (lx, ly) => {
            hazard(run, 'cheese', lx, ly, 54, 5, 0.35, 3);
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
