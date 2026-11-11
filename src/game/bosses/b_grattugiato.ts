/**
 * IL SACCO DEL GRATTUGIATO — The Bag of Pre-Grated Cheese (final boss of the Vongole;
 * mid-boss in the Marinara).
 *
 *   snow    cones of grated "parmesan" snow aimed at the chef (3 bursts, 4 enraged)
 *   cloud   lobs cheese bombs that burst into slowing cheese clouds
 *   flop    warning circle, belly-flop leap, a cheese cloud and a ring of cheese on landing
 *   summon  calls cheesy clams ('vongola' crimes)
 * Enrage (< 50 % HP): the torn corner rips wider: denser snow, more clouds.
 */
import { brain, aimed, ring, danger, hazard, leap, lobShot, summon, steer, type Pattern } from '../ai';

const CHEESE = 'proj.e_cheese';

export const grattugiato: Pattern = (run, e, dt) => {
  brain(run, e, dt, ['snow', 'cloud', 'flop', 'summon', 'snow', 'cloud'], 0.95, (a, t, first) => {
    if (a === 'flop') {
      if (first) {
        const p = run.player;
        danger(run, p.x, p.y, e.r * 1.9, 1.1, 0);
        leap(e, p.x, p.y, 1.1, e.r * 1.9);
        e.attackPose = 1.1;
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
      if (first) {
        e.telegraph = 0.5;
        e.attackPose = 0.6 + bursts * 0.35;
      }
      for (let k = 0; k < bursts; k++) {
        const at = 0.5 + k * 0.35;
        if (t >= at && t - dt < at) aimed(run, e, e.bossPhase ? 9 : 7, 0.95 + (k % 2) * 0.12, 185, CHEESE);
      }
      return t > 0.6 + bursts * 0.35;
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
          lobShot(run, e, x, y, 0.75 + i * 0.12, CHEESE, e.damage * 0.5, (lx, ly) => {
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
      run.fx.bubble(e, 'Abbondante!', -e.r * 2.4, '#fff3d6', 1.1, true);
      run.sfx('boss_roar', { volume: 0.5 }, e.x);
    }
    return t > 0.8;
  });
};
