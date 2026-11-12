/**
 * IL FRULLATORE ROVENTE — The Red-Hot Blender (final boss of the Pesto).
 *
 *   spray   it turns to the chef and the arc it will sweep is marked (out to 300 u) while it winds
 *           up; then the cap blows off and a solid stream of green sludge pours out over the spout
 *           and sweeps across the marked arc (two crossing streams enraged). The stream leaves
 *           from the spout drawn in the attack pose, aimed at the chef's body.
 *   vortex  contracting green rings + "Frulla frulla!" warn, then the blade spins up and PULLS
 *           the chef in (slower than the chef can walk) while rings of sludge spin out
 *   blades  three staggered rings of sludge (each ring's gaps sit where the last ring's shots were)
 *   summon  a handful of bootleg cashews ('anacardo' swarm)
 * Enrage (< 50 % HP): it OVERHEATS: the whole blender glows red-hot (an additive heat sprite drawn
 * over it), embers, fire patches under it as it walks.
 */
import { brain, shoot, summon, hazard, steer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const PESTO = 'proj.e_pesto';
const HOT = 1; // e.aux flag
const SWEEP = 0.55; // half-width of the spray sweep (radians)
/** Where the stream leaves the spout in the attack pose (sprite units from the anchor, facing right). */
const SPOUT_X = 72, SPOUT_Y = -112;

/** A white "pop" ring drawn ABOVE the boss (fx.ring always lands on the ground layer, under the sprite). */
function popRing(run: Run, x: number, y: number, r0: number, r1: number, life = 0.32) {
  run.fx.ring(x, y, r0, r1, life, '#ffffff', 8, false);
  const p = run.fx.particles[run.fx.particles.length - 1];
  if (p && p.shape === 2 && p.size === r0) p.layer = 1;
}

/** A ring of shots that leaves from the rim of the body, with a white pop so it reads against the jar. */
function rimRing(run: Run, e: Enemy, n: number, speed: number, off: number, dmgMul = 0.45) {
  const oy = e.y - e.r * 0.5;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU;
    const s = shoot(run, e, a, speed, PESTO, e.damage * dmgMul, 8);
    s.x = e.x + Math.cos(a) * e.r * 1.2;
    s.y = oy + Math.sin(a) * e.r * 1.2;
  }
  popRing(run, e.x, oy, e.r * 0.9, e.r * 2);
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
}

/** Mark the arc the spray will sweep: rows of warning dots at three distances from the spout. */
function sprayCone(run: Run, ox: number, oy: number, centre: number, life: number) {
  for (const [dist, n, r] of [[105, 5, 13], [200, 7, 15], [295, 9, 17]] as [number, number, number][]) {
    for (let i = 0; i < n; i++) {
      const a = centre + (i / (n - 1) - 0.5) * 2 * SWEEP;
      run.addArea('warning', ox + Math.cos(a) * dist, oy + Math.sin(a) * dist, r, life, { enemy: true });
    }
  }
}

export const frullatore: Pattern = (run, e, dt) => {
  if (e.bossPhase) {
    if (!(e.aux & HOT)) {
      e.aux |= HOT;
      e.speed *= 1.15;
      run.fx.bubble(e, 'SURRISCALDATO!', -e.r * 2.4, '#ffb08a', 1.5, true);
      run.fx.ring(e.x, e.y, 10, 220, 0.6, '#ff7b2e', 8);
    }
    // overheated: the whole blender glows red-hot (drawn once per frame over the sprite), plus embers
    run.fx.sprite(e.x, e.y - e.z, 'fx.frullatore_heat', { size: e.scale * e.face, life: 0.001, additive: true, alpha: 0.6 + Math.sin(run.time * 9) * 0.15, layer: 1 });
    if (Math.random() < dt * 18) run.fx.burst(e.x + (Math.random() - 0.5) * e.r * 1.4, e.y - e.r * (0.5 + Math.random() * 1.6), 1, { colors: ['#ffd34d', '#ff7b2e', '#ff3d1f'], speed: 50, size: 3.4, life: 0.7, additive: true, angle: -Math.PI / 2, spread: 0.6 });
  }
  brain(run, e, dt, ['spray', 'vortex', 'blades', 'summon', 'spray', 'blades'], 0.95, (a, t, first) => {
    steer(e, 0, 0, dt, 6);
    if (a === 'spray') {
      const wind = 0.6, dur = 1.3;
      if (first) {
        const p = run.player;
        e.face = p.x >= e.x ? 1 : -1;
        // the stream leaves the spout and is aimed at the chef's body (his hitbox is 8 u above his feet)
        const ox = e.x + SPOUT_X * e.face * e.scale, oy = e.y + SPOUT_Y * e.scale;
        e.ax = Math.atan2(p.y - 8 - oy, p.x - ox); // cone centre
        // e.ay: the facing (sign) and which edge the sweep starts from (|e.ay| 1 or 2, alternating)
        e.ay = e.face * (Math.floor(e.bossStep / 3) % 2 ? 2 : 1);
        e.telegraph = wind;
        e.attackPose = wind + dur;
        sprayCone(run, ox, oy, e.ax, wind + dur);
        run.sfx('enemy_dash', { volume: 0.4, pitch: 1.4 }, e.x);
      }
      e.face = e.ay > 0 ? 1 : -1; // keep facing the arc (the spout points along it)
      // one pass from one edge of the marked arc to the other (alternating sides each time), 20 shots/s:
      // the stream moves at most ~1.33 rad/s, so consecutive shots are ≤ 0.07 rad apart (no gaps the
      // chef fits through); enraged, a mirrored second stream sweeps the other way and crosses it
      if (t > wind && Math.floor((t - dt) * 20) !== Math.floor(t * 20)) {
        const ox = e.x + SPOUT_X * e.face * e.scale, oy = e.y + SPOUT_Y * e.scale;
        const from = Math.abs(e.ay) > 1.5 ? 1 : -1; // the edge the stream starts at
        const sweep = from * Math.cos(Math.min(1, (t - wind) / dur) * Math.PI) * SWEEP;
        const angs = e.bossPhase ? [e.ax + sweep, e.ax - sweep] : [e.ax + sweep];
        for (const ang of angs) {
          const s = shoot(run, e, ang, 230, PESTO, e.damage * 0.45, 8);
          s.x = ox;
          s.y = oy;
        }
        if (Math.random() < 0.4) run.fx.burst(ox, oy, 1, { colors: ['#93c64c', '#b6db6c', '#f7f2da'], speed: 120, size: 3.5, life: 0.35, angle: e.ax + sweep, spread: 0.5 });
        if (Math.floor((t - dt) * 8) !== Math.floor(t * 8)) run.sfx('enemy_shoot', { volume: 0.22, pitch: 1.3 }, e.x);
      }
      return t > wind + dur;
    }
    if (a === 'vortex') {
      const wind = 0.8, dur = 2.4;
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
        if (Math.floor((t - dt) * 1.6) !== Math.floor(t * 1.6)) rimRing(run, e, e.bossPhase ? 12 : 9, 150, t * 1.7);
        if (Math.random() < dt * 30) {
          const ang = Math.random() * TAU, rr = 80 + Math.random() * 220;
          run.fx.streak(e.x + Math.cos(ang) * rr, e.y + Math.sin(ang) * rr, -Math.cos(ang) * 240, -Math.sin(ang) * 240, '#bfe88a', 0.3, 3);
        }
      }
      return t > wind + dur;
    }
    if (a === 'blades') {
      const n = e.bossPhase ? 18 : 14;
      if (first) {
        e.telegraph = 0.45;
        e.attackPose = 1.6;
        e.ay = Math.random() * TAU; // this volley's base angle
      }
      for (let k = 0; k < 3; k++) {
        const at = 0.45 + k * 0.35;
        // each ring is offset by half a gap: its shots fly where the previous ring left gaps
        if (t >= at && t - dt < at) rimRing(run, e, n, 170, e.ay + (k % 2) * (Math.PI / n));
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
