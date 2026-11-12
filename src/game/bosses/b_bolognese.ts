/**
 * LO SPAGHETTONE ALLA BOLOGNESE — The Great Spaghetti Bolognese (final boss of the Ragù).
 * A ghostly mountain of spaghetti in red sauce that "doesn't exist".
 *
 *   lash      red lanes of warning circles fan out toward the chef, then the spaghetti
 *             whip down along them (3 lanes, 5 enraged): step out of the lanes
 *   phase     it phases OUT of existence (invulnerable, translucent, harmless to touch),
 *             glides next to the chef, then flickers back with a telegraph and a ring of
 *             sauce: "Io esisto!"
 *   meatballs rolls out meatballs ('polpetta' crimes)
 *   splat     lobs meatballs in sauce that land as slowing sauce puddles
 * Enrage (< 50 % HP): phases more often, more lanes, sauce puddles while phased.
 */
import { brain, ring, lobShot, hazard, summon, steer, toPlayer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';

const MEATBALL = 'proj.e_meatball';
const SAUCE = 'proj.e_ketchup';

/** One spaghetti lash: a lane of warnings, then damage along the segment. */
function lash(run: Run, e: Enemy, ang: number, delay: number) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const x0 = e.x + ux * e.r * 0.8, y0 = e.y + uy * e.r * 0.8;
  const len = 440;
  for (let d = 0; d <= len; d += 36) run.addArea('warning', x0 + ux * d, y0 + uy * d * 0.9, 21, delay, { enemy: true });
  run.schedule(delay, () => {
    if (!e.alive) return;
    const p = run.player;
    // distance from the chef to the lane segment
    const px = p.x - x0, py = p.y - y0;
    const along = Math.max(0, Math.min(len, px * ux + py * uy * 0.9));
    const cx = x0 + ux * along, cy = y0 + uy * along * 0.9;
    if (Math.hypot(p.x - cx, (p.y - cy) / 0.85) < 21 + p.r * 0.6) run.hurtPlayer(e.damage * 0.75, cx, cy, 'lash:' + e.def.id);
    for (let d = 0; d <= len; d += 72) {
      run.fx.burst(x0 + ux * d, y0 + uy * d * 0.9, 4, { colors: ['#f3d27a', '#c8421e', '#ffffff'], speed: 140, size: 4, life: 0.35 });
    }
    run.fx.streak(x0, y0, ux * 900, uy * 810, '#f3d27a', 0.35, 7);
    run.fx.shake(0.12);
  });
}

export const bolognese: Pattern = (run, e, dt) => {
  const order = e.bossPhase ? ['lash', 'phase', 'splat', 'phase', 'meatballs', 'lash'] : ['lash', 'phase', 'meatballs', 'lash', 'splat', 'phase'];
  brain(run, e, dt, order, 0.9, (a, t, first) => {
    if (a === 'phase') {
      const out = 0.35, glide = 2.0, back = 0.5;
      // invulnerable exactly while the timeline says it is faded out: refreshed from the
      // attack's own clock every frame, so no slow or hitch can make it faded but hittable
      const solidAt = out + glide + back * 0.6;
      e.invuln = t < solidAt ? Math.max(0.05, solidAt - t) : 0;
      if (first) {
        run.fx.bubble(e, 'Non esisto…', -e.r * 2.3, '#ffd0c8', 1.2, true);
        run.sfx('enemy_split', { volume: 0.5, pitch: 0.6 }, e.x);
      }
      if (t < out) {
        e.fade = t / out;
        steer(e, 0, 0, dt, 6);
      } else if (t < out + glide) {
        e.fade = 1;
        // glide to a spot beside the chef
        const p = run.player;
        const side = e.x < p.x ? -1 : 1;
        const tx = p.x + side * 150, ty = p.y - 20;
        const dx = tx - e.x, dy = ty - e.y;
        const d = Math.hypot(dx, dy) || 1;
        const sp = Math.min(240, d * 2.5);
        steer(e, (dx / d) * sp, (dy / d) * sp, dt, 5);
        if (e.bossPhase && Math.floor((t - dt) * 2.5) !== Math.floor(t * 2.5)) hazard(run, 'ketchup', e.x, e.y + e.r * 0.4, 30, 4, 0.25, 3);
      } else {
        steer(e, 0, 0, dt, 8);
        const k = (t - out - glide) / back;
        e.fade = Math.max(0, 1 - k) * (0.6 + 0.4 * Math.abs(Math.sin(t * 40)));
        if (e.telegraph <= 0 && k < 0.2) {
          e.telegraph = back;
          e.attackPose = back + 0.3;
        }
      }
      if (t >= out + glide + back) {
        e.fade = 0;
        e.invuln = 0;
        ring(run, e, e.bossPhase ? 18 : 14, 165, SAUCE, Math.random(), 0.45);
        run.fx.bubble(e, 'Io esisto!', -e.r * 2.4, '#ffd0c8', 1.3, true);
        run.fx.shake(0.25);
        return true;
      }
      return false;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'lash') {
      const delay = 1.0;
      if (first) {
        e.telegraph = delay;
        e.attackPose = delay + 0.4;
        const base = Math.atan2(toPlayer(run, e).dy, toPlayer(run, e).dx);
        const n = e.bossPhase ? 5 : 3;
        const spread = e.bossPhase ? 0.42 : 0.5;
        for (let i = 0; i < n; i++) lash(run, e, base + (i - (n - 1) / 2) * spread, delay);
        run.sfx('enemy_dash', { volume: 0.6, pitch: 0.8 }, e.x);
      }
      return t > delay + 0.4;
    }
    if (a === 'splat') {
      if (first) {
        e.telegraph = 0.4;
        e.attackPose = 1.8;
      }
      if (t > 0.4 && Math.floor((t - dt) * 4) !== Math.floor(t * 4)) {
        const p = run.player;
        lobShot(run, e, p.x + (Math.random() - 0.5) * 160, p.y + (Math.random() - 0.5) * 120, 0.8, MEATBALL, e.damage * 0.55, (x, y) => {
          hazard(run, 'ketchup', x, y, 38, 5, 0.3, 3);
          run.fx.burst(x, y, 8, { colors: ['#c8421e', '#8a2a1a', '#f3d27a'], speed: 130, size: 4, life: 0.5 });
        });
      }
      return t > 1.9;
    }
    // meatballs
    if (first) {
      summon(run, e, 'polpetta', e.bossPhase ? 5 : 3);
      e.attackPose = 0.6;
      run.fx.bubble(e, 'Polpette!', -e.r * 2.4, '#ffd0c8', 1.1, true);
      run.sfx('enemy_split', { volume: 0.5 }, e.x);
    }
    return t > 0.8;
  });
};
