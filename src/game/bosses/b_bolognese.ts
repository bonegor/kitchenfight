/**
 * LO SPAGHETTONE ALLA BOLOGNESE — The Great Spaghetti Bolognese (final boss of the Ragù).
 * A ghostly mountain of spaghetti in red sauce that "doesn't exist".
 *
 *   lash      it rears up (eyes hot) and red lanes of warning circles fan out toward the chef;
 *             the noodle whips crack down along them after 1 s (3 lanes). Enraged, a second
 *             wave of 4 lanes is laid IN THE GAPS the moment the first wave strikes: step out
 *             of the first lanes, then step back into them.
 *   phase     it phases OUT of existence: invulnerable, translucent and harmless to touch for
 *             the whole time it is drawn faded (ectoplasm wisps show where it drifts). It glides
 *             next to the chef, turns solid again, and only then (a contracting red ring and
 *             the wind-up pose warn) bursts a ring of sauce: "Io esisto!"
 *   meatballs rolls out meatballs ('polpetta' crimes)
 *   splat     lobs meatballs in sauce: each landing spot is marked, then becomes a slowing puddle
 * Enrage (< 50 % HP): phases more often, the double lash, a sauce trail while phased.
 */
import { brain, ring, lobShot, hazard, summon, steer, toPlayer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';

const MEATBALL = 'proj.e_meatball';
const SAUCE = 'proj.e_ketchup';
const LASH_LEN = 440;
const LASH_W = 21;

/** One spaghetti lash: a lane of warnings, then damage along the segment. */
function lash(run: Run, e: Enemy, ang: number, delay: number) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const x0 = e.x + ux * e.r * 0.8, y0 = e.y + uy * e.r * 0.8;
  for (let d = 0; d <= LASH_LEN; d += 36) run.addArea('warning', x0 + ux * d, y0 + uy * d * 0.9, LASH_W, delay, { enemy: true });
  run.schedule(delay, () => {
    if (!e.alive) return;
    const p = run.player;
    // distance from the chef to the lane segment (the lane is squashed 0.9 vertically, like the floor)
    const px = p.x - x0, py = p.y - y0;
    const along = Math.max(0, Math.min(LASH_LEN, px * ux + py * uy * 0.9));
    const cx = x0 + ux * along, cy = y0 + uy * along * 0.9;
    if (Math.hypot(p.x - cx, (p.y - cy) / 0.85) < LASH_W + p.r * 0.6) run.hurtPlayer(e.damage * 0.75, cx, cy, 'lash:' + e.def.id);
    for (let d = 0; d <= LASH_LEN; d += 72) {
      run.fx.burst(x0 + ux * d, y0 + uy * d * 0.9, 4, { colors: ['#f3d27a', '#c8421e', '#ffffff'], speed: 140, size: 4, life: 0.35 });
    }
    run.fx.streak(x0, y0, ux * 900, uy * 810, '#f3d27a', 0.35, 7);
    run.fx.shake(0.12);
  });
}

/** A fan of lanes around `base`. */
function lashFan(run: Run, e: Enemy, base: number, offsets: number[], delay: number) {
  for (const o of offsets) lash(run, e, base + o, delay);
  e.telegraph = delay;
  e.attackPose = delay + 0.35;
  run.sfx('enemy_dash', { volume: 0.6, pitch: 0.8 }, e.x);
}

export const bolognese: Pattern = (run, e, dt) => {
  // ectoplasm wisps while it is phased out, so the chef can track it
  if (e.fade > 0.4 && Math.random() < dt * 14) {
    run.fx.burst(e.x + (Math.random() - 0.5) * e.r * 1.6, e.y - e.r * (0.2 + Math.random() * 1.4), 1, { colors: ['#bdf1ff', '#ffffff', '#f3d27a'], speed: 30, size: 3, life: 0.7, angle: -Math.PI / 2, spread: 0.8 });
  }
  const order = e.bossPhase ? ['lash', 'phase', 'splat', 'phase', 'meatballs', 'lash'] : ['lash', 'phase', 'meatballs', 'lash', 'splat', 'phase'];
  brain(run, e, dt, order, 0.9, (a, t, first) => {
    if (a === 'phase') {
      const out = 0.35, glide = 2.0, back = 0.6;
      // it turns solid halfway through `back`; the sauce ring comes at the end of `back`
      const solidAt = out + glide + back * 0.5;
      // invulnerable for exactly as long as it is drawn faded: refreshed from the attack's own
      // clock every frame (a phased boss also ignores slows), so it is never faded but hittable
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
        if (t < solidAt) {
          // flickering back into existence
          const k = (t - out - glide) / (solidAt - out - glide);
          e.fade = Math.max(0.02, 1 - k) * (0.6 + 0.4 * Math.abs(Math.sin(t * 40)));
        } else e.fade = 0;
        if (t - dt < out + glide) {
          // telegraph the sauce ring: wind-up pose + a contracting red ring
          e.telegraph = back;
          e.attackPose = back + 0.3;
          run.fx.ring(e.x, e.y, e.r * 3.2, e.r * 0.8, back, '#ff5a3a', 5, false);
          run.sfx('enemy_dash', { volume: 0.4, pitch: 0.6 }, e.x);
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
      const delay = 1.0, delay2 = 0.75;
      const spread = 0.5;
      if (first) {
        e.ax = Math.atan2(toPlayer(run, e).dy, toPlayer(run, e).dx);
        lashFan(run, e, e.ax, [-spread, 0, spread], delay);
      }
      // enraged: the second wave fills the gaps of the first the moment it strikes
      if (e.bossPhase && t >= delay && t - dt < delay) {
        lashFan(run, e, e.ax, [-spread * 1.5, -spread * 0.5, spread * 0.5, spread * 1.5], delay2);
        run.fx.bubble(e, 'Ancora!', -e.r * 2.4, '#ffd0c8', 0.9, true);
      }
      return t > delay + (e.bossPhase ? delay2 + 0.35 : 0.4);
    }
    if (a === 'splat') {
      if (first) {
        e.telegraph = 0.4;
        e.attackPose = 1.8;
      }
      if (t > 0.4 && Math.floor((t - dt) * 4) !== Math.floor(t * 4)) {
        const p = run.player;
        const x = p.x + (Math.random() - 0.5) * 160, y = p.y + (Math.random() - 0.5) * 120;
        const fly = 0.8;
        // mark the landing spot for the whole flight
        run.addArea('warning', x, y, 38, fly, { enemy: true });
        lobShot(run, e, x, y, fly, MEATBALL, e.damage * 0.55, (lx, ly) => {
          hazard(run, 'ketchup', lx, ly, 38, 5, 0.3, 3);
          run.fx.burst(lx, ly, 8, { colors: ['#c8421e', '#8a2a1a', '#f3d27a'], speed: 130, size: 4, life: 0.5 });
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
