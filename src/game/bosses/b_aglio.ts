/**
 * IL RE DELL'AGLIO — The Garlic King (final boss of the Amatriciana).
 *
 *   cloves  telegraphed fans of garlic cloves aimed at the chef (3 volleys, 4 enraged)
 *   stink   red warning circles drop on and around the chef, then turn into green stink
 *           clouds that slow and sting for 5 s (the floor fills up: keep moving)
 *   leap    warning circle under the chef, royal belly slam, a ring of cloves on landing
 *   summon  calls his garlic courtiers ('aglio' support crimes speed up their friends)
 * Enrage (< 50 % HP): sheds his papery skin once (clove burst), walks and attacks faster.
 */
import { brain, aimed, ring, danger, hazard, leap, summon, steer, type Pattern } from '../ai';
import { TAU } from '../../core/math';

const CLOVE = 'proj.e_clove';
const SHED = 1; // e.aux flag

export const aglio: Pattern = (run, e, dt) => {
  if (e.bossPhase && !(e.aux & SHED)) {
    e.aux |= SHED;
    e.speed *= 1.25;
    run.fx.burst(e.x, e.y - e.r * 0.8, 34, { colors: ['#f4ecd6', '#e8dcc0', '#ffffff', '#d9c7a0'], speed: 280, size: 5, life: 0.9, gravity: 300, up: 140 });
    ring(run, e, 16, 160, CLOVE, Math.random() * TAU, 0.4);
    run.fx.bubble(e, 'Via la camicia!', -e.r * 2.4, '#f4ecd6', 1.4, true);
  }
  brain(run, e, dt, ['cloves', 'stink', 'leap', 'cloves', 'summon', 'stink'], 0.95, (a, t, first) => {
    if (a === 'leap') {
      if (first) {
        const p = run.player;
        danger(run, p.x, p.y, e.r * 1.8, 1, 0);
        leap(e, p.x, p.y, 1, e.r * 1.8);
        e.attackPose = 1;
        e.onLand = () => ring(run, e, e.bossPhase ? 14 : 10, 150, CLOVE, Math.random() * TAU, 0.4);
      }
      return true;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'cloves') {
      const volleys = e.bossPhase ? 4 : 3;
      if (first) {
        e.telegraph = 0.55;
        e.attackPose = 0.6 + volleys * 0.38;
      }
      for (let k = 0; k < volleys; k++) {
        const at = 0.55 + k * 0.38;
        if (t >= at && t - dt < at) aimed(run, e, e.bossPhase ? 7 : 5, 0.8, 200, CLOVE);
      }
      return t > 0.65 + volleys * 0.38;
    }
    if (a === 'stink') {
      if (first) {
        e.telegraph = 0.9;
        e.attackPose = 1.2;
        const p = run.player;
        const spots: [number, number][] = [[p.x, p.y], [p.x + p.vx * 0.9, p.y + p.vy * 0.9]];
        const n = e.bossPhase ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const ang = Math.random() * TAU, d = 90 + Math.random() * 90;
          spots.push([p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d * 0.8]);
        }
        for (const [x, y] of spots) {
          danger(run, x, y, 46, 1.0, e.damage * 0.5, () => {
            hazard(run, 'stink', x, y, 52, 5, 0.4, e.damage * 0.12);
            run.fx.burst(x, y, 10, { colors: ['#c8e070', '#9fc24a', '#eef7c0'], speed: 90, size: 6, life: 0.8, drag: 2 });
          });
        }
        run.sfx('enemy_shoot', { volume: 0.5, pitch: 0.7 }, e.x);
      }
      return t > 1.2;
    }
    // summon: garlic courtiers in their shirts
    if (first) {
      summon(run, e, 'aglio', e.bossPhase ? 4 : 3);
      e.attackPose = 0.6;
      run.fx.bubble(e, 'Spicchi, a me!', -e.r * 2.4, '#f4ecd6', 1.2, true);
      run.sfx('boss_roar', { volume: 0.6 }, e.x);
    }
    return t > 0.8;
  });
};
