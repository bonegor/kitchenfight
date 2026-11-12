/**
 * LO SPAGHETTONE ALLA BOLOGNESE — The Great Spaghetti Bolognese (final boss of the Ragù).
 * A ghostly mountain of spaghetti in red sauce that "doesn't exist".
 *
 *   lash      it turns to the chef and rears up (eyes hot); straight red lanes of warning circles
 *             fan out toward him; after 1 s a noodle whip cracks down along each lane (3 lanes).
 *             The damage is exactly the warned lanes. Enraged, a second wave of 4 lanes is laid
 *             IN THE GAPS the moment the first wave strikes: step out of the first lanes, then
 *             step back into them.
 *   phase     it phases OUT of existence: invulnerable, translucent and harmless to touch for
 *             the whole time it is drawn faded (ectoplasm wisps and cold ripples show where it
 *             drifts). It glides next to the chef, turns solid again, and only then (pale
 *             contracting rings and the wind-up pose warn) bursts a ring of sauce: "Io esisto!"
 *   meatballs rolls out meatballs ('polpetta' crimes)
 *   splat     two throws (wind-up, fling): each lobs meatballs in sauce; every landing spot is
 *             marked for the whole flight and becomes a slowing puddle
 * Enrage (< 50 % HP): phases more often, the double lash, a sauce trail while phased, 4 meatballs
 * per throw.
 */
import { brain, shoot, lobShot, hazard, summon, steer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const MEATBALL = 'proj.e_meatball';
const SAUCE = 'proj.e_ketchup';
/**
 * Warning circles every LASH_STEP along the lane; the last one sits at LASH_LEN. The step is small
 * enough that the drawn ellipses (LASH_W × 0.8 LASH_W) overlap at every lane angle: no gaps.
 */
const LASH_STEP = 32;
const LASH_LEN = LASH_STEP * 14;
const LASH_W = 21;

/** A white "pop" ring drawn ABOVE the boss (fx.ring always lands on the ground layer, under the sprite). */
function popRing(run: Run, x: number, y: number, r0: number, r1: number, life = 0.32) {
  run.fx.ring(x, y, r0, r1, life, '#ffffff', 8, false);
  const p = run.fx.particles[run.fx.particles.length - 1];
  if (p && p.shape === 2 && p.size === r0) p.layer = 1;
}

/** A ring of shots that leaves from the rim of the body, with a white pop so it reads against the sauce. */
function rimRing(run: Run, e: Enemy, n: number, speed: number, sprite: string, off: number, dmgMul: number) {
  const oy = e.y - e.r * 0.5;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU;
    const s = shoot(run, e, a, speed, sprite, e.damage * dmgMul, 8);
    s.x = e.x + Math.cos(a) * e.r * 1.15;
    s.y = oy + Math.sin(a) * e.r * 1.15;
  }
  popRing(run, e.x, oy, e.r * 0.9, e.r * 1.9);
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
}

/**
 * One spaghetti lash: a straight lane of warning circles from the boss toward `ang`, then a noodle
 * whip along it. The damage zone is exactly the union of the drawn warning ellipses (r × 0.8r).
 */
function lash(run: Run, e: Enemy, ang: number, delay: number) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const x0 = e.x + ux * e.r * 0.8, y0 = e.y + uy * e.r * 0.8;
  // the lanes stay up through the strike frame, under the whip
  for (let d = 0; d <= LASH_LEN; d += LASH_STEP) run.addArea('warning', x0 + ux * d, y0 + uy * d, LASH_W, delay + 0.06, { enemy: true });
  run.schedule(delay, () => {
    if (!e.alive) return;
    const p = run.player;
    // hit iff the chef's feet are inside one of the drawn warning ellipses (+ the width of its
    // dashed rim), the same rule as danger(): the damage zone is exactly the red lane
    const R = LASH_W + 2;
    for (let d = 0; d <= LASH_LEN; d += LASH_STEP) {
      const cx = x0 + ux * d, cy = y0 + uy * d;
      if ((p.x - cx) ** 2 + ((p.y - cy) / 0.8) ** 2 < R * R) {
        run.hurtPlayer(e.damage * 0.75, cx, cy, 'lash:' + e.def.id);
        break;
      }
    }
    // the noodle whip cracking down along the lane, plus sauce flying off it
    run.fx.sprite(x0, y0, 'fx.noodle_lash', { rot: ang, life: 0.34, fps: 12, layer: 1 });
    for (let d = 32; d <= LASH_LEN; d += 64) {
      run.fx.burst(x0 + ux * d, y0 + uy * d, 4, { colors: ['#f3d27a', '#c8421e', '#ffffff'], speed: 140, size: 4, life: 0.35 });
    }
    run.fx.ring(x0 + ux * LASH_LEN, y0 + uy * LASH_LEN, 8, 40, 0.3, '#ffffff', 5, false);
    run.fx.shake(0.12);
    run.sfx('enemy_dash', { volume: 0.45, pitch: 1.3 }, e.x);
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
  if (e.fade > 0.4) {
    // ectoplasm wisps and cold ripples while it is phased out, so the chef can track it
    if (Math.random() < dt * 22) {
      run.fx.burst(e.x + (Math.random() - 0.5) * e.r * 1.8, e.y - e.r * (0.1 + Math.random() * 1.5), 1, { colors: ['#e8fbff', '#bdf1ff', '#ffffff'], speed: 30, size: 5, life: 0.8, angle: -Math.PI / 2, spread: 0.8, additive: true });
    }
    if (Math.floor((run.time - dt) * 3) !== Math.floor(run.time * 3)) run.fx.ring(e.x, e.y + e.r * 0.55, e.r * 0.5, e.r * 1.35, 0.6, '#bdf1ff', 4, true);
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
        e.face = run.player.x >= e.x ? 1 : -1;
        if (t < solidAt) {
          // flickering back into existence
          const k = (t - out - glide) / (solidAt - out - glide);
          e.fade = Math.max(0.02, 1 - k) * (0.6 + 0.4 * Math.abs(Math.sin(t * 40)));
        } else e.fade = 0;
        if (t - dt < out + glide) {
          // telegraph the sauce ring: wind-up pose + pale contracting rings
          e.telegraph = back;
          e.attackPose = back + 0.3;
          run.sfx('enemy_dash', { volume: 0.4, pitch: 0.6 }, e.x);
        }
        for (const at of [0, 0.2, 0.4]) {
          const tt = out + glide + at;
          if (t >= tt && t - dt < tt) run.fx.ring(e.x, e.y, e.r * 3.4, e.r * 0.9, back - at + 0.05, '#ffd0c8', 8, false);
        }
      }
      if (t >= out + glide + back) {
        e.fade = 0;
        e.invuln = 0;
        rimRing(run, e, e.bossPhase ? 18 : 14, 165, SAUCE, Math.random(), 0.45);
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
        const p = run.player;
        e.ax = Math.atan2(p.y - e.y, p.x - e.x);
        lashFan(run, e, e.ax, [-spread, 0, spread], delay);
      }
      // it turns to face the lanes (the whip arm points along them)
      e.face = Math.cos(e.ax) >= 0 ? 1 : -1;
      // enraged: the second wave fills the gaps of the first the moment it strikes
      if (e.bossPhase && t >= delay && t - dt < delay) {
        lashFan(run, e, e.ax, [-spread * 1.5, -spread * 0.5, spread * 0.5, spread * 1.5], delay2);
        run.fx.bubble(e, 'Ancora!', -e.r * 2.4, '#ffd0c8', 0.9, true);
      }
      return t > delay + (e.bossPhase ? delay2 + 0.35 : 0.4);
    }
    if (a === 'splat') {
      // two throws: wind-up (0.4 s), fling a handful of meatballs, follow through
      const wind = 0.4, every = 0.8, throws = 2;
      const n = e.bossPhase ? 4 : 3;
      for (let k = 0; k < throws; k++) {
        const ws = k * every, at = ws + wind;
        if (k === 0 ? first : t >= ws && t - dt < ws) {
          e.telegraph = wind;
          e.attackPose = wind + 0.35;
          run.sfx('enemy_dash', { volume: 0.35, pitch: 0.9 }, e.x);
        }
        if (t >= at && t - dt < at) {
          const p = run.player;
          for (let i = 0; i < n; i++) {
            const x = i === 0 ? p.x : p.x + (Math.random() - 0.5) * 220;
            const y = i === 0 ? p.y : p.y + (Math.random() - 0.5) * 160;
            const fly = 0.75 + i * 0.08;
            // mark the landing spot for the whole flight
            run.addArea('warning', x, y, 38, fly, { enemy: true });
            lobShot(run, e, x, y, fly, MEATBALL, e.damage * 0.55, (lx, ly) => {
              hazard(run, 'ketchup', lx, ly, 38, 5, 0.3, 3);
              run.fx.burst(lx, ly, 8, { colors: ['#c8421e', '#8a2a1a', '#f3d27a'], speed: 130, size: 4, life: 0.5 });
            });
          }
          run.sfx('enemy_shoot', { volume: 0.4, pitch: 0.7 }, e.x);
        }
      }
      e.face = run.player.x >= e.x ? 1 : -1;
      return t > (throws - 1) * every + wind + 0.45;
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
