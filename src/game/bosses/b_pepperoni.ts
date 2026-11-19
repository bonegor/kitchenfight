/**
 * IL SALAMONE AMERICANO — The Great American Pepperoni (final boss of the Pizza Diavola).
 *
 * One body language for every attack (art: boss.pepperoni.attack). WIND-UP (e.telegraph): the pizza
 * cutter goes up over his cut top, grease beads off him. ATTACK: the cutter swings forward and the
 * slices fly.
 *
 *   slices  three staggered rings of spinning pepperoni slices (each ring's slices fly through the
 *           gaps of the ring before)
 *   roll    he turns to the chef and a lane of warning circles as wide as what hits (his body plus the
 *           chef) shows the path (0.8 s), then he bowls down it like a log and stops ~120 px past
 *           where the chef stood, leaving a slick of grease; enraged he goes twice
 *   grease  lobs blobs of hot grease at and around the chef; every landing spot is marked by a
 *           warning ring the size of the burning puddle it becomes
 *   summon  calls factory pepperoni sticks ('salame_usa' chargers) to his side
 * Enrage (< 50 % HP): "PICCANTE!" — he heats up: quicker, embers rise off him and he drips hot grease
 * where he walks.
 * The entrance gate (nothing in the first 1.6 s, nothing from off screen until 4 s) is brain()'s.
 */
import { brain, shoot, hazard, lobShot, summon, steer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const SLICE = 'proj.e_pepperoni';
const GREASE = 'proj.e_palm';
const HOT = 1; // e.aux flag
const ROLL_WIND = 0.8;
const ROLL_MAX = 0.85;
const GREASE_COL = ['#ffb04a', '#f57a1a', '#ffe08a'];

interface Roll { id: number; phase: 'wind' | 'roll'; until: number; n: number; dur: number; speed: number; drip: number }
const rolls = new WeakMap<Enemy, Roll>();
function roll(e: Enemy): Roll {
  let r = rolls.get(e);
  if (!r || r.id !== e.id) rolls.set(e, (r = { id: e.id, phase: 'wind', until: 0, n: 0, dur: 0, speed: 0, drip: 0 }));
  return r;
}

/** A ring of slices flung out from round his body (never over his face). */
function sliceRing(run: Run, e: Enemy, n: number, speed: number, off: number) {
  const cy = e.y - e.r * 0.6;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU;
    const s = shoot(run, e, a, speed, SLICE, e.damage * 0.45, 8);
    s.x = e.x + Math.cos(a) * e.r * 1.3;
    s.y = cy + Math.sin(a) * e.r * 1.2;
  }
  run.fx.ring(e.x, cy, e.r * 0.8, e.r * 2, 0.3, '#ffb07a', 6);
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
}

/** Lay the lane of a roll at the chef: as wide as the contact reach, ending ~120 px past him. */
function aimRoll(run: Run, e: Enemy, r: Roll, t: number) {
  const p = run.player;
  r.speed = e.bossPhase ? 560 : 500;
  const d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
  e.ax = (p.x - e.x) / d;
  e.ay = (p.y - e.y) / d;
  e.face = e.ax >= 0 ? 1 : -1;
  r.dur = Math.min(ROLL_MAX, Math.max(0.35, (d + 120) / r.speed));
  r.phase = 'wind';
  r.until = t + ROLL_WIND;
  e.telegraph = ROLL_WIND;
  e.attackPose = ROLL_WIND + r.dur + 0.15;
  const reach = e.r * 0.85 + p.r;
  const nx = -e.ay, ny = e.ax;
  const w = reach / Math.sqrt(nx * nx + 0.64 * ny * ny);
  const along = w * Math.sqrt(e.ax * e.ax + 0.64 * e.ay * e.ay);
  const len = r.speed * r.dur;
  const n = Math.max(1, Math.ceil(len / (along * 1.05)));
  for (let i = 0; i <= n; i++) {
    const dd = (len * i) / n;
    run.addArea('warning', e.x + e.ax * dd, e.y + e.ay * dd, w, ROLL_WIND + dd / r.speed, { enemy: true });
  }
  run.fx.bubble(e, 'Strike!', -e.r * 2.6, '#ffd0b0', 0.9, true);
  run.sfx('enemy_dash', { volume: 0.7, pitch: 0.6 }, e.x);
}

export const pepperoni: Pattern = (run, e, dt) => {
  const r = roll(e);
  if (e.bossPhase) {
    if (!(e.aux & HOT)) {
      e.aux |= HOT;
      e.speed *= 1.15;
      run.fx.bubble(e, 'PICCANTE!', -e.r * 2.6, '#ffb08a', 1.5, true);
      run.fx.ring(e.x, e.y, 10, 220, 0.6, '#ff7b2e', 8);
    }
    if (Math.random() < dt * 16) run.fx.burst(e.x + (Math.random() - 0.5) * e.r * 1.4, e.y - e.r * (0.4 + Math.random() * 1.8), 1, { colors: ['#ffd34d', '#ff7b2e', '#ff3d1f'], speed: 50, size: 3.4, life: 0.7, additive: true, angle: -Math.PI / 2, spread: 0.6 });
    // drips of hot grease where he walks
    if (dt > 0 && run.time >= r.drip && e.state !== 50 && Math.hypot(e.vx, e.vy) > 10) {
      r.drip = run.time + 0.5;
      hazard(run, 'fire', e.x, e.y + e.r * 0.6, 22, 2.6, 0, e.damage * 0.2);
    }
  }
  brain(run, e, dt, ['slices', 'roll', 'grease', 'summon', 'roll', 'slices'], 0.95, (a, t, first) => {
    if (a === 'roll') {
      if (first) {
        r.n = 0;
        aimRoll(run, e, r, t);
      }
      e.face = e.ax >= 0 ? 1 : -1;
      if (r.phase === 'wind') {
        steer(e, 0, 0, dt, 8);
        e.face = e.ax >= 0 ? 1 : -1;
        if (Math.random() < dt * 20) run.fx.burst(e.x - e.ax * e.r * 0.7, e.y + e.r * 0.6, 1, { colors: GREASE_COL, speed: 150, size: 4, life: 0.4, angle: Math.atan2(-e.ay, -e.ax), spread: 1, up: 60, gravity: 400 });
        if (t >= r.until) {
          r.phase = 'roll';
          r.until = t + r.dur;
        }
        return false;
      }
      e.x += e.ax * r.speed * dt;
      e.y += e.ay * r.speed * dt;
      e.vx = e.ax * r.speed;
      e.vy = e.ay * r.speed;
      e.anim += dt * 12;
      if (Math.floor((t - dt) * 10) !== Math.floor(t * 10)) hazard(run, 'oil', e.x, e.y + e.r * 0.5, 24, 3.5, 0.3);
      if (Math.random() < dt * 30) run.fx.streak(e.x, e.y - e.r * 0.3, -e.ax * 220, -e.ay * 220, '#ffb07a', 0.3, 6);
      if (t < r.until) return false;
      e.vx *= 0.1;
      e.vy *= 0.1;
      run.fx.burst(e.x + e.ax * e.r * 0.6, e.y + e.r * 0.5, 12, { colors: GREASE_COL, speed: 200, size: 4.5, life: 0.5, angle: Math.atan2(e.ay, e.ax), spread: 1.6, up: 80, gravity: 400 });
      r.n++;
      // enraged: a second roll, with the full tell
      if (e.bossPhase && r.n < 2) {
        aimRoll(run, e, r, t);
        return false;
      }
      return true;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'slices') {
      const n = e.bossPhase ? 16 : 12;
      if (first) {
        e.face = run.player.x >= e.x ? 1 : -1;
        e.telegraph = 0.45;
        e.attackPose = 1.6;
        e.ay = Math.random() * TAU;
      }
      for (let k = 0; k < 3; k++) {
        const at = 0.45 + k * 0.38;
        if (t >= at && t - dt < at) sliceRing(run, e, n, 165, e.ay + (k % 2) * (Math.PI / n));
      }
      return t > 1.6;
    }
    if (a === 'grease') {
      if (first) {
        const p = run.player;
        e.face = p.x >= e.x ? 1 : -1;
        e.telegraph = 0.4;
        e.attackPose = 1.3;
        const n = e.bossPhase ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const x = i === 0 ? p.x + p.vx * 0.4 : p.x + (Math.random() - 0.5) * 260;
          const y = i === 0 ? p.y + p.vy * 0.4 : p.y + (Math.random() - 0.5) * 190;
          const fly = 0.8 + i * 0.1;
          run.addArea('warning', x, y, 46, fly, { enemy: true });
          lobShot(run, e, x, y, fly, GREASE, e.damage * 0.5, (lx, ly) => {
            hazard(run, 'fire', lx, ly, 46, 4, 0, e.damage * 0.22);
            run.fx.burst(lx, ly, 12, { colors: GREASE_COL, speed: 150, size: 5, life: 0.6 });
          });
        }
        run.sfx('enemy_shoot', { volume: 0.45, pitch: 0.7 }, e.x);
      }
      return t > 1.3;
    }
    // summon factory pepperoni
    if (first) {
      summon(run, e, 'salame_usa', e.bossPhase ? 5 : 3);
      e.attackPose = 0.6;
      run.fx.bubble(e, 'Extra pepperoni!', -e.r * 2.6, '#ffd0b0', 1.1, true);
      run.sfx('boss_roar', { volume: 0.5 }, e.x);
    }
    return t > 0.8;
  });
};
