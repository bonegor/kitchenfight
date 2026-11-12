/**
 * IL RE DELL'AGLIO — The Garlic King (final boss of the Amatriciana).
 *
 * One body language for every attack (art: boss.aglio.attack). WIND-UP (e.telegraph: red flicker):
 * the clove sceptre goes up and glows green while his cheeks fill with stink. ATTACK (e.attackPose
 * after the telegraph): he ROARS a green breath and swings the sceptre.
 *
 *   cloves  the sceptre charges (0.6 s), then 3 aimed fans of cloves (4 enraged), one every 0.38 s;
 *           the fans alternate odd/even so a chef who stands still is hit by every other one
 *   stink   red warning circles drop on, ahead of and around the chef (1 s), then turn into green stink
 *           clouds that slow and sting for 5 s and keep fuming: the floor fills up, keep moving
 *   leap    warning circle under the chef, a royal belly slam 1 s later: a ring of cloves and a stink
 *           shock-ring on landing
 *   summon  raises the sceptre (0.4 s), then calls his garlic courtiers ('aglio' support crimes)
 * Enrage (< 50 % HP): "Via la camicia!" — he sheds his papery skin once (flakes and a clove burst),
 * walks and attacks faster.
 */
import { brain, aimed, ring, danger, hazard, leap, summon, steer, type Pattern } from '../ai';
import type { Run } from '../run';
import type { Enemy } from '../entities';
import { TAU } from '../../core/math';

const CLOVE = 'proj.e_clove';
const SHED = 1; // e.aux flag
const STINK_COLS = ['#c8e070', '#a8d84a', '#eef7c0'];
const CLOUD_LIFE = 5;

/** Live stink clouds per boss, so they keep fuming (areas are pooled: keep plain records, not Area refs). */
const clouds = new WeakMap<Enemy, { x: number; y: number; r: number; until: number; next: number }[]>();

function puff(run: Run, x: number, y: number, size = 0.45, life = 1.3) {
  run.fx.sprite(x, y, 'fx.aglio_stink', { frame: (Math.random() * 3) | 0, size, size1: size * 2.1, vz: 26, vx: (Math.random() - 0.5) * 12, life, alpha: 0.8, layer: 1 });
}

/** Green puffs keep rising from every live stink cloud: the clouds read as clearly as the warnings. */
function fume(run: Run, e: Enemy) {
  const list = clouds.get(e);
  if (!list) return;
  for (let i = list.length - 1; i >= 0; i--) {
    const c = list[i];
    if (run.time >= c.until - 0.4) {
      list.splice(i, 1);
      continue;
    }
    if (run.time < c.next) continue;
    c.next = run.time + 0.3 + Math.random() * 0.2;
    const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * c.r * 0.75;
    puff(run, c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.8);
  }
}

function stinkCloud(run: Run, e: Enemy, x: number, y: number) {
  const r = 52;
  hazard(run, 'stink', x, y, r, CLOUD_LIFE, 0.4, e.damage * 0.12);
  run.fx.burst(x, y, 10, { colors: STINK_COLS, speed: 90, size: 6, life: 0.8, drag: 2 });
  for (let k = 0; k < 3; k++) puff(run, x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r * 0.6, 0.6, 1.1);
  let list = clouds.get(e);
  if (!list) clouds.set(e, (list = []));
  list.push({ x, y, r, until: run.time + CLOUD_LIFE, next: run.time + 0.3 });
}

function facePlayer(run: Run, e: Enemy) {
  e.face = run.player.x >= e.x ? 1 : -1;
}

export const aglio: Pattern = (run, e, dt) => {
  if (e.bossPhase && !(e.aux & SHED)) {
    e.aux |= SHED;
    e.speed *= 1.25;
    // "Via la camicia!": the papery skin peels off in flakes and the bare cloves burst out
    run.fx.burst(e.x, e.y - e.r * 0.9, 26, { sprite: 'fx.aglio_skin', frames: 4, speed: 300, size: 1.3, life: 1.6, gravity: 420, up: 230, drag: 1.4, spin: 9, shrink: false });
    run.fx.burst(e.x, e.y - e.r * 0.8, 18, { colors: ['#f4ecd6', '#e8dcc0', '#ffffff', '#d9c7a0'], speed: 280, size: 5, life: 0.9, gravity: 300, up: 140 });
    run.fx.ring(e.x, e.y - e.r * 0.3, e.r * 0.6, e.r * 2.8, 0.6, '#c8e070', 8);
    ring(run, e, 16, 160, CLOVE, Math.random() * TAU, 0.4);
    run.fx.bubble(e, 'Via la camicia!', -e.r * 2.4, '#f4ecd6', 1.4, true);
  }
  fume(run, e);
  brain(run, e, dt, ['cloves', 'stink', 'leap', 'cloves', 'summon', 'stink'], 0.95, (a, t, first) => {
    if (a === 'leap') {
      if (first) {
        const p = run.player;
        facePlayer(run, e);
        danger(run, p.x, p.y, e.r * 1.8, 1, 0);
        leap(e, p.x, p.y, 1, e.r * 1.8);
        e.attackPose = 1;
        e.onLand = () => {
          ring(run, e, e.bossPhase ? 14 : 10, 150, CLOVE, Math.random() * TAU, 0.4);
          // the royal belly slam blows a ring of stink out of his cape
          run.fx.ring(e.x, e.y + e.r * 0.3, e.r * 0.6, e.r * 3, 0.7, '#a8d84a', 10);
          for (let k = 0; k < 10; k++) {
            const ang = (k / 10) * TAU;
            puff(run, e.x + Math.cos(ang) * e.r * 1.3, e.y + e.r * 0.3 + Math.sin(ang) * e.r, 0.6, 1);
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
      for (let k = 0; k < volleys; k++) {
        const at = wind + k * gap;
        if (t >= at && t - dt < at) {
          // odd fans centred on the chef, even fans with a gap in the middle: keep moving
          const odd = k % 2 === 0;
          aimed(run, e, (e.bossPhase ? 6 : 4) + (odd ? 1 : 0), odd ? 0.8 : 0.9, 200, CLOVE);
          run.fx.burst(e.x + e.face * e.r * 0.9, e.y - e.r * 1.2, 5, { colors: STINK_COLS, speed: 120, size: 4, life: 0.4 });
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
        for (const [x, y] of spots) danger(run, x, y, 46, 1.0, e.damage * 0.5, () => stinkCloud(run, e, x, y));
        run.sfx('enemy_shoot', { volume: 0.5, pitch: 0.7 }, e.x);
      }
      return t > 1.25;
    }
    // summon: the sceptre goes up, then his garlic courtiers come running
    if (first) {
      facePlayer(run, e);
      e.telegraph = 0.4;
      e.attackPose = 1;
    }
    if (t >= 0.4 && t - dt < 0.4) {
      summon(run, e, 'aglio', e.bossPhase ? 4 : 3);
      run.fx.bubble(e, 'Spicchi, a me!', -e.r * 2.4, '#f4ecd6', 1.2, true);
      run.fx.ring(e.x, e.y, e.r * 0.5, e.r * 2.2, 0.5, '#c8e070', 6);
      run.sfx('boss_roar', { volume: 0.6 }, e.x);
    }
    return t > 1;
  });
};
