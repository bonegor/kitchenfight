/**
 * IL RE DELL'AGLIO — The Garlic King (final boss of the Amatriciana).
 *
 * One body language for every attack (art: boss.aglio.attack). WIND-UP (e.telegraph: red flicker):
 * the clove sceptre goes up and glows green while his cheeks fill with stink. ATTACK (e.attackPose
 * after the telegraph): he ROARS a green breath and swings the sceptre. Every shot leaves from where
 * the art shows it: the clove fans from the glowing sceptre head, the clove rings from just outside
 * his cape. Each attack has its own extra tell on top of the shared wind-up pose.
 *
 *   cloves  green glints rush into the sceptre (0.6 s), then 3 fans of cloves (4 enraged) fly from
 *           the sceptre head, one every 0.38 s; the fans alternate odd/even, so a chef who stands
 *           still is hit by every other one
 *   stink   he INHALES (green puffs are sucked into his mouth) while red warning circles drop on,
 *           ahead of and around the chef (1 s); they turn into green stink clouds that slow and sting
 *           for 5 s and keep fuming on the ground: the floor fills up, keep moving
 *   leap    warning circle under the chef; he flies over in the wind-up pose (red flicker) and lands
 *           in the ROAR: a royal belly slam, a ring of cloves and a stink shock-ring
 *   summon  raises the sceptre (0.4 s), then his garlic courtiers ('aglio') pop out of stink puffs
 *           around him, where they can be seen
 * Enrage (< 50 % HP): "Via la camicia!" — he sheds his papery skin (harmless flakes drift to the
 * floor), then, after a 0.45 s wind-up, a clove ring bursts out. He walks and attacks faster and
 * stinks for the rest of the fight (green fumes rise behind his crown and around his feet).
 * He never starts an attack in the first 1.6 s after his entrance, or while he is off screen or under the HUD.
 */
import { brain, danger, hazard, leap, steer, shoot, type Pattern } from '../ai';
import { ENEMIES } from '../enemies';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const CLOVE = 'proj.e_clove';
const SHED = 1; // e.aux flag
const STINK_COLS = ['#c8e070', '#a8d84a', '#eef7c0'];
const CLOUD_LIFE = 5;
const ENRAGE_WIND = 0.45;

interface Cloud { x: number; y: number; r: number; until: number; next: number }
interface King { id: number; born: number; clouds: Cloud[]; ringAt: number; aura: number }

/** Per-boss bookkeeping (enemies are pooled: the record is reset when the id changes). */
const kings = new WeakMap<Enemy, King>();
function king(run: Run, e: Enemy): King {
  let k = kings.get(e);
  if (!k || k.id !== e.id) kings.set(e, (k = { id: e.id, born: run.time, clouds: [], ringAt: 0, aura: 0 }));
  return k;
}

/** World position of the sceptre head (the clove in the gold claw) in the attack art, at scale 1. */
function sceptreHead(e: Enemy): [number, number] {
  return [e.x + e.face * 100 * e.scale, e.y - 104 * e.scale];
}

/** His mouth (inhale target). */
function mouth(e: Enemy): [number, number] {
  return [e.x + e.face * 11 * e.scale, e.y + 4 * e.scale];
}

/** A green stink puff. Ground layer by default, so it never covers the chef or the King's face. */
function puff(run: Run, x: number, y: number, size = 0.4, life = 1.3, layer: 0 | 1 = 0, alpha = 0.7) {
  run.fx.sprite(x, y, 'fx.aglio_stink', { frame: (Math.random() * 3) | 0, size, size1: size * 1.9, vz: 22, vx: (Math.random() - 0.5) * 12, life, alpha, layer });
}

/** Green puffs keep rising from every live stink cloud: the clouds read as clearly as the warnings. */
function fume(run: Run, k: King) {
  const list = k.clouds;
  for (let i = list.length - 1; i >= 0; i--) {
    const c = list[i];
    if (run.time >= c.until - 0.4) {
      list.splice(i, 1);
      continue;
    }
    if (run.time < c.next) continue;
    c.next = run.time + 0.35 + Math.random() * 0.25;
    const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * c.r * 0.75;
    puff(run, c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.8);
  }
}

function stinkCloud(run: Run, e: Enemy, k: King, x: number, y: number) {
  const r = 52;
  hazard(run, 'stink', x, y, r, CLOUD_LIFE, 0.4, e.damage * 0.12);
  run.fx.burst(x, y, 10, { colors: STINK_COLS, speed: 90, size: 6, life: 0.8, drag: 2, layer: 0 });
  for (let i = 0; i < 3; i++) puff(run, x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r * 0.6, 0.55, 1.1);
  k.clouds.push({ x, y, r, until: run.time + CLOUD_LIFE, next: run.time + 0.3 });
}

/** Fully in view and clear of the HUD (timer and boss bar on top): only then may an attack start. */
function inView(run: Run, e: Enemy) {
  const v = run.view;
  return e.x > v.x0 + e.r && e.x < v.x1 - e.r && e.y - e.r * 1.4 > v.y0 + 90 && e.y + e.r * 0.6 < v.y1;
}

function facePlayer(run: Run, e: Enemy) {
  e.face = run.player.x >= e.x ? 1 : -1;
}

/** A fan of cloves from the sceptre head, aimed at the chef. */
function cloveFan(run: Run, e: Enemy, n: number, spread: number, speed: number) {
  const [hx, hy] = sceptreHead(e);
  const p = run.player;
  const a = Math.atan2(p.y - hy, p.x - hx);
  for (let i = 0; i < n; i++) {
    const ang = a + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0);
    const s = shoot(run, e, ang, speed, CLOVE, e.damage * 0.45, 8);
    s.x = hx + Math.cos(ang) * 8;
    s.y = hy + Math.sin(ang) * 8;
  }
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
  run.fx.burst(hx, hy, 6, { colors: STINK_COLS, speed: 140, size: 4, life: 0.4 });
  run.fx.ring(hx, hy, 6, 34, 0.25, '#e6ffb0', 4);
}

/** A ring of cloves bursting out from just outside his cape (never on top of his own face). */
function cloveRing(run: Run, e: Enemy, n: number, speed: number, off: number) {
  const cy = e.y - e.r * 0.5;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * TAU;
    const s = shoot(run, e, a, speed, CLOVE, e.damage * 0.45, 8);
    s.x = e.x + Math.cos(a) * e.r * 1.65;
    s.y = cy + Math.sin(a) * e.r * 1.75;
  }
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
}

/** Charging tell for the clove fan: green glints rush into the sceptre head. */
function chargeGlints(run: Run, e: Enemy) {
  const [hx, hy] = sceptreHead(e);
  const a = Math.random() * TAU, d = 52 + Math.random() * 30, life = 0.32;
  run.fx.sprite(hx + Math.cos(a) * d, hy + Math.sin(a) * d, 'fx.aglio_glint', { frame: (Math.random() * 2) | 0, vx: (-Math.cos(a) * d) / life, vy: (-Math.sin(a) * d) / life, size: 1.45, size1: 0.5, life, vr: 6 });
}

/** Inhale tell for the stink: puffs are sucked into his mouth. */
function inhale(run: Run, e: Enemy) {
  const [mx, my] = mouth(e);
  const a = Math.random() * TAU, d = 100 + Math.random() * 40, life = 0.5;
  const x = mx + Math.cos(a) * d, y = my + Math.sin(a) * d * 0.75;
  run.fx.sprite(x, y, 'fx.aglio_stink', { frame: (Math.random() * 3) | 0, vx: (mx - x) / life, vy: (my - y) / life, size: 0.85, size1: 0.2, life, alpha: 0.95, layer: 1 });
}

/** His garlic courtiers pop out of stink puffs around him, outside his cape. */
function courtiers(run: Run, e: Enemy, n: number) {
  const def = ENEMIES.aglio;
  if (!def) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.random() * 0.5;
    const x = e.x + Math.cos(a) * e.r * 1.85, y = e.y + Math.sin(a) * e.r * 1.5;
    const m = run.spawnEnemy(def, x, y);
    m.kx = Math.cos(a) * 140;
    m.ky = Math.sin(a) * 140;
    for (let j = 0; j < 3; j++) puff(run, x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 18, 0.6, 0.9, 1, 0.75);
    run.fx.burst(x, y, 6, { colors: STINK_COLS, speed: 110, size: 5, life: 0.5 });
  }
}

/**
 * "Via la camicia!": the papery skin flakes off. The flakes are clearly harmless debris: no outline,
 * ivory and mauve (not the outlined, glowing cloves), they pop up, flutter outward and settle on the
 * floor around him, and the clove ring only comes 0.45 s later.
 */
function shedSkin(run: Run, e: Enemy) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * TAU, sp = 70 + Math.random() * 90;
    run.fx.sprite(e.x + Math.cos(a) * e.r * 0.7, e.y - e.r * 0.4 + Math.sin(a) * e.r * 0.5, 'fx.aglio_skin', {
      frame: (Math.random() * 4) | 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 110 + Math.random() * 110, gravity: 300, drag: 1.3,
      size: 1.3 + Math.random() * 0.7, life: 1.6 + Math.random() * 0.7, vr: (Math.random() - 0.5) * 6, alpha: 0.85,
    });
  }
  run.fx.ring(e.x, e.y - e.r * 0.3, e.r * 0.6, e.r * 2.8, 0.6, '#c8e070', 8);
  run.fx.bubble(e, 'Via la camicia!', -e.r * 2.4, '#f4ecd6', 1.4, true);
}

export const aglio: Pattern = (run, e, dt) => {
  const k = king(run, e);
  if (e.bossPhase && !(e.aux & SHED)) {
    e.aux |= SHED;
    e.speed *= 1.25;
    shedSkin(run, e);
    // the bare cloves burst out after a short wind-up (his own pose, unless an attack owns it)
    k.ringAt = run.time + ENRAGE_WIND;
    if (!e.bossAttack && e.state !== 50) {
      e.telegraph = ENRAGE_WIND;
      e.attackPose = ENRAGE_WIND + 0.5;
      e.timer = Math.max(e.timer, ENRAGE_WIND + 0.6);
      facePlayer(run, e);
    }
  }
  if (k.ringAt && run.time >= k.ringAt && dt > 0) {
    if (e.state === 50) k.ringAt = run.time + 0.05; // in the air: burst on the ground
    else {
      k.ringAt = 0;
      cloveRing(run, e, 16, 160, Math.random() * TAU);
      run.fx.ring(e.x, e.y - e.r * 0.3, e.r * 0.8, e.r * 2.4, 0.45, '#eaffc0', 6);
      run.fx.shake(0.25);
    }
  }
  fume(run, k);
  // enraged he stinks for good: fumes rise behind the crown and around his feet
  if (e.bossPhase && run.time >= k.aura && dt > 0) {
    k.aura = run.time + 0.22 + Math.random() * 0.12;
    const s = Math.random() < 0.5 ? -1 : 1;
    if (Math.random() < 0.55) puff(run, e.x + s * (58 + Math.random() * 22) * e.scale, e.y - (88 + Math.random() * 20) * e.scale - e.z, 0.42, 1.1, 1, 0.65);
    else puff(run, e.x + (Math.random() - 0.5) * 120 * e.scale, e.y + 40 * e.scale, 0.5, 1.2, 0, 0.7);
  }
  // no attack under the FINAL BOSS banner, from off screen or from under the HUD
  if (!e.bossAttack && e.state !== 50) {
    const age = run.time - k.born;
    if (age < 1.6) e.timer = Math.max(e.timer, 1.6 - age);
    if (!inView(run, e)) e.timer = Math.max(e.timer, 0.3);
  }
  brain(run, e, dt, ['cloves', 'stink', 'leap', 'cloves', 'summon', 'stink'], 0.95, (a, t, first) => {
    if (a === 'leap') {
      if (first) {
        const p = run.player;
        facePlayer(run, e);
        danger(run, p.x, p.y, e.r * 1.8, 1, 0);
        leap(e, p.x, p.y, 1, e.r * 1.8);
        // he flies over in the wind-up pose (red flicker) and lands in the ROAR
        e.telegraph = 0.95;
        e.attackPose = 1.4;
        e.onLand = () => {
          cloveRing(run, e, e.bossPhase ? 14 : 10, 150, Math.random() * TAU);
          // the royal belly slam blows a ring of stink out of his cape
          run.fx.ring(e.x, e.y + e.r * 0.3, e.r * 0.6, e.r * 3, 0.7, '#a8d84a', 10);
          for (let i = 0; i < 10; i++) {
            const ang = (i / 10) * TAU;
            puff(run, e.x + Math.cos(ang) * e.r * 1.4, e.y + e.r * 0.3 + Math.sin(ang) * e.r, 0.6, 1);
          }
        };
      }
      return true;
    }
    steer(e, 0, 0, dt, 6);
    if (a === 'cloves') {
      const volleys = e.bossPhase ? 4 : 3;
      const wind = 0.6, gap = 0.38;
      if (first) {
        facePlayer(run, e);
        e.telegraph = wind;
        e.attackPose = wind + volleys * gap + 0.1;
        run.sfx('enemy_shoot', { volume: 0.45, pitch: 0.6 }, e.x);
      }
      if (t < wind - 0.1 && Math.random() < dt * 40) chargeGlints(run, e);
      for (let i = 0; i < volleys; i++) {
        const at = wind + i * gap;
        if (t >= at && t - dt < at) {
          // odd fans centred on the chef, even fans with a gap in the middle: keep moving
          facePlayer(run, e);
          const odd = i % 2 === 0;
          cloveFan(run, e, (e.bossPhase ? 6 : 4) + (odd ? 1 : 0), odd ? 0.8 : 0.9, 200);
        }
      }
      return t > wind + volleys * gap + 0.15;
    }
    if (a === 'stink') {
      if (first) {
        facePlayer(run, e);
        e.telegraph = 0.9;
        e.attackPose = 1.25;
        const p = run.player;
        const spots: [number, number][] = [[p.x, p.y]];
        if (Math.hypot(p.vx, p.vy) > 30) spots.push([p.x + p.vx * 0.9, p.y + p.vy * 0.9]);
        const n = e.bossPhase ? 5 : 3;
        const a0 = Math.random() * TAU;
        for (let i = 0; i < n; i++) {
          const ang = a0 + (i / n) * TAU + (Math.random() - 0.5) * 0.6, d = 100 + Math.random() * 80;
          spots.push([p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d * 0.8]);
        }
        for (const [x, y] of spots) danger(run, x, y, 46, 1.0, e.damage * 0.5, () => stinkCloud(run, e, k, x, y));
        run.sfx('enemy_shoot', { volume: 0.5, pitch: 0.7 }, e.x);
      }
      if (t < 0.8 && Math.random() < dt * 26) inhale(run, e);
      return t > 1.25;
    }
    // summon: the sceptre goes up, then his garlic courtiers come running
    if (first) {
      facePlayer(run, e);
      e.telegraph = 0.4;
      e.attackPose = 1;
    }
    if (t >= 0.4 && t - dt < 0.4) {
      courtiers(run, e, e.bossPhase ? 4 : 3);
      run.fx.bubble(e, 'Spicchi, a me!', -e.r * 2.4, '#f4ecd6', 1.2, true);
      run.fx.ring(e.x, e.y, e.r * 0.5, e.r * 2.2, 0.5, '#c8e070', 6);
      run.sfx('boss_roar', { volume: 0.6 }, e.x);
    }
    return t > 1;
  });
};
