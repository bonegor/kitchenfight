/**
 * Enemy behaviours + boss attack patterns.
 */
import type { Run } from './run';
import type { Enemy } from './entities';
import { ENEMIES } from './enemies';
import { TAU } from '../core/math';

const tmp: Enemy[] = [];

// ---------------------------------------------------------------------------
// movement helpers
// ---------------------------------------------------------------------------

function steer(e: Enemy, tvx: number, tvy: number, dt: number, rate = 7) {
  const k = 1 - Math.exp(-rate * dt);
  e.vx += (tvx - e.vx) * k;
  e.vy += (tvy - e.vy) * k;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  if (Math.abs(e.vx) > 6) e.face = e.vx > 0 ? 1 : -1;
  e.anim += dt * (2 + Math.hypot(e.vx, e.vy) / 22);
}

function toPlayer(run: Run, e: Enemy) {
  const p = run.player;
  const dx = p.x - e.x, dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  return { dx: dx / d, dy: dy / d, d };
}

function chase(run: Run, e: Enemy, dt: number, mul = 1, wobble = 0) {
  const t = toPlayer(run, e);
  let a = Math.atan2(t.dy, t.dx);
  if (wobble) a += Math.sin(run.time * 3 + e.id * 1.7) * wobble;
  const sp = e.speed * mul;
  steer(e, Math.cos(a) * sp, Math.sin(a) * sp, dt);
}

function shoot(run: Run, e: Enemy, angle: number, speed: number, sprite: string, dmg: number, r = 6) {
  const s = run.spawnShot();
  s.x = e.x + Math.cos(angle) * e.r * 0.6;
  s.y = e.y - e.r * 0.5 + Math.sin(angle) * e.r * 0.6;
  s.vx = Math.cos(angle) * speed;
  s.vy = Math.sin(angle) * speed;
  s.r = r;
  s.damage = dmg;
  s.life = 2.8;
  s.sprite = sprite;
  s.rot = angle;
  s.spin = sprite === 'proj.e_pepperoni' || sprite === 'proj.e_seed' ? 8 : 0;
  return s;
}

function lobShot(run: Run, e: Enemy, tx: number, ty: number, time: number, sprite: string, dmg: number, onLand: (x: number, y: number) => void) {
  const s = run.spawnShot();
  s.x = e.x;
  s.y = e.y - e.r * 0.5;
  s.vx = (tx - s.x) / time;
  s.vy = (ty - s.y) / time;
  s.gravity = 900;
  s.vz = (900 * time) / 2;
  s.z = 1;
  s.r = 8;
  s.damage = dmg;
  s.life = time + 1;
  s.sprite = sprite;
  s.spin = 6;
  s.onLand = (sh) => onLand(sh.x, sh.y);
  return s;
}

function hazard(run: Run, kind: 'cream' | 'ketchup' | 'cheese', x: number, y: number, r: number, life: number, slow: number, damage = 0) {
  return run.addArea(kind, x, y, r, life, { enemy: true, slow, damage, tick: 0.6 });
}

/** Telegraphed danger circle that damages the player when it ends. */
function danger(run: Run, x: number, y: number, r: number, delay: number, dmg: number, after?: () => void) {
  const a = run.addArea('warning', x, y, r, delay, { enemy: true });
  a.onEnd = () => {
    const p = run.player;
    if ((p.x - x) ** 2 + ((p.y - y) / 0.8) ** 2 < r * r) run.hurtPlayer(dmg, x, y, 'danger');
    run.fx.ring(x, y, r * 0.5, r * 1.1, 0.4, '#ff6b4a', 6);
    run.fx.burst(x, y, 10, { colors: ['#ffffff', '#ffd2c2'], speed: 220, size: 4, life: 0.4 });
    after?.();
  };
  return a;
}

// ---------------------------------------------------------------------------
// regular behaviours
// ---------------------------------------------------------------------------

export function updateEnemy(run: Run, e: Enemy, dt: number) {
  const d = e.def;
  const P = d.params ?? {};
  if (e.state === 99) {
    // stampede: run straight across, ignoring the player
    e.x += e.ax * dt;
    e.y += e.ay * dt;
    e.vx = e.ax;
    e.vy = e.ay;
    e.face = e.ax > 0 ? 1 : -1;
    e.anim += dt * 10;
    e.timer -= dt;
    if (e.timer <= 0) e.state = 0;
    return;
  }
  switch (d.behavior) {
    case 'chase':
      chase(run, e, dt);
      break;
    case 'swarm':
      chase(run, e, dt, 1, P.wobble ?? 0.6);
      break;
    case 'charger': {
      const t = toPlayer(run, e);
      if (e.state === 0) {
        chase(run, e, dt);
        e.timer -= dt;
        if (t.d < (P.range ?? 220) && e.timer <= 0 && run.onScreen(e.x, e.y, -10)) {
          e.state = 1;
          e.timer = P.windup ?? 0.5;
          e.telegraph = e.timer;
          e.ax = t.dx;
          e.ay = t.dy;
        }
      } else if (e.state === 1) {
        steer(e, -e.ax * 20, -e.ay * 20, dt, 10);
        e.timer -= dt;
        if (e.timer <= 0) {
          // commit to the telegraphed direction (fair & dodgeable)
          e.state = 2;
          e.timer = P.dashTime ?? 0.4;
          e.attackPose = e.timer;
          run.sfx('enemy_dash', { volume: 0.5 }, e.x);
        }
      } else if (e.state === 2) {
        const sp = P.dash ?? 400;
        e.vx = e.ax * sp;
        e.vy = e.ay * sp;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.face = e.vx > 0 ? 1 : -1;
        e.anim += dt * 20;
        if (Math.random() < dt * 30) run.fx.streak(e.x, e.y - e.r * 0.4, -e.vx * 0.3, -e.vy * 0.3, '#ffffff', 0.2, 3);
        e.timer -= dt;
        if (e.timer <= 0) {
          e.state = 0;
          e.timer = P.cd ?? 1.5;
        }
      }
      break;
    }
    case 'ranged': {
      const t = toPlayer(run, e);
      const min = P.min ?? 150, max = P.max ?? 260;
      if (t.d > max) chase(run, e, dt);
      else if (t.d < min) steer(e, -t.dx * e.speed, -t.dy * e.speed, dt);
      else {
        const side = e.id % 2 ? 1 : -1;
        steer(e, -t.dy * e.speed * 0.5 * side, t.dx * e.speed * 0.5 * side, dt, 3);
      }
      e.timer -= dt;
      if (e.timer <= 0 && t.d < max + 60 && run.onScreen(e.x, e.y, -20)) {
        e.timer = (P.cd ?? 2.5) * (0.85 + Math.random() * 0.3);
        const a = Math.atan2(t.dy, t.dx);
        const n = P.count ?? 1;
        const spread = P.spread ?? 0;
        for (let i = 0; i < n; i++) {
          const off = n > 1 ? (i / (n - 1) - 0.5) * spread * 2 : 0;
          const sh = shoot(run, e, a + off, P.shotSpeed ?? 160, P.shot ?? 'proj.e_generic', e.damage * 0.5);
          if (P.muzzle) {
            sh.x = e.x + P.muzzle[0] * e.face * e.scale;
            sh.y = e.y + P.muzzle[1] * e.scale;
            sh.vx = Math.cos(Math.atan2(run.player.y - sh.y, run.player.x - sh.x) + off) * (P.shotSpeed ?? 160);
            sh.vy = Math.sin(Math.atan2(run.player.y - sh.y, run.player.x - sh.x) + off) * (P.shotSpeed ?? 160);
            sh.rot = Math.atan2(sh.vy, sh.vx);
          }
        }
        e.attackPose = 0.3;
        e.face = t.dx > 0 ? 1 : -1;
        run.sfx('enemy_shoot', { volume: 0.4 }, e.x);
      }
      break;
    }
    case 'lobber': {
      const t = toPlayer(run, e);
      const min = P.min ?? 160, max = P.max ?? 290;
      if (t.d > max) chase(run, e, dt);
      else if (t.d < min) steer(e, -t.dx * e.speed, -t.dy * e.speed, dt);
      else steer(e, 0, 0, dt, 3);
      e.timer -= dt;
      if (e.timer <= 0 && t.d < max + 60 && run.onScreen(e.x, e.y, -20)) {
        e.timer = (P.cd ?? 3) * (0.85 + Math.random() * 0.3);
        const p = run.player;
        const tx = p.x + p.vx * 0.6, ty = p.y + p.vy * 0.6;
        const area = P.area ?? 'cheese';
        lobShot(run, e, tx, ty, 0.9, 'proj.e_generic', e.damage, (x, y) => {
          hazard(run, area, x, y, P.r ?? 34, 3.5, P.slow ?? 0.3, e.damage * 0.2);
          run.fx.burst(x, y, 10, { colors: ['#fff6d6', '#f4e3a6'], speed: 140, size: 4, life: 0.5 });
        });
        e.attackPose = 0.3;
        run.sfx('enemy_shoot', { volume: 0.35, pitch: 0.8 }, e.x);
      }
      break;
    }
    case 'hopper': {
      if (e.state === 0) {
        steer(e, 0, 0, dt, 8);
        e.z = 0;
        e.timer -= dt;
        if (e.timer <= 0) {
          e.state = 1;
          e.timer = P.hop ?? 0.45;
          const t = toPlayer(run, e);
          e.ax = t.dx;
          e.ay = t.dy;
        }
      } else {
        const hop = P.hop ?? 0.45;
        const k = 1 - e.timer / hop;
        e.z = Math.sin(k * Math.PI) * (P.height ?? 16);
        const sp = (P.hopSpeed ?? 150) * (e.speed / Math.max(1, d.speed));
        e.x += e.ax * sp * dt;
        e.y += e.ay * sp * dt;
        e.face = e.ax > 0 ? 1 : -1;
        e.anim += dt * 8;
        e.timer -= dt;
        if (e.timer <= 0) {
          e.state = 0;
          e.z = 0;
          e.squash = 0.8;
          e.timer = (P.rest ?? 0.6) * (0.8 + Math.random() * 0.4);
        }
      }
      break;
    }
    case 'slither': {
      const t = toPlayer(run, e);
      const a = Math.atan2(t.dy, t.dx) + Math.sin(run.time * (P.freq ?? 5) + e.id) * (P.amp ?? 0.9);
      steer(e, Math.cos(a) * e.speed, Math.sin(a) * e.speed, dt, 10);
      break;
    }
    case 'roller': {
      const t = toPlayer(run, e);
      const acc = P.accel ?? 260;
      e.vx += t.dx * acc * dt;
      e.vy += t.dy * acc * dt;
      const sp = Math.hypot(e.vx, e.vy);
      if (sp > e.speed) {
        e.vx *= e.speed / sp;
        e.vy *= e.speed / sp;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (Math.abs(e.vx) > 5) e.face = e.vx > 0 ? 1 : -1;
      e.aux += (Math.hypot(e.vx, e.vy) / e.r) * dt * (e.vx >= 0 ? 1 : -1);
      e.anim += (dt * Math.hypot(e.vx, e.vy)) / 14;
      break;
    }
    case 'orbiter': {
      const p = run.player;
      if (!e.aux) e.aux = (P.r ?? 150) + Math.random() * 60;
      e.aux = Math.max(20, e.aux - (P.shrink ?? 12) * dt);
      const ang = Math.atan2(e.y - p.y, e.x - p.x) + (e.id % 2 ? 1 : -1) * dt * (e.speed / Math.max(40, e.aux));
      const tx = p.x + Math.cos(ang) * e.aux, ty = p.y + Math.sin(ang) * e.aux;
      steer(e, (tx - e.x) * 4, (ty - e.y) * 4, dt, 6);
      e.z = 10 + Math.sin(run.time * 4 + e.id) * 4;
      break;
    }
    case 'puddler': {
      chase(run, e, dt);
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = P.interval ?? 2.5;
        hazard(run, P.puddle ?? 'cream', e.x, e.y + e.r * 0.5, P.r ?? 26, P.life ?? 5, P.slow ?? 0.35);
      }
      break;
    }
    case 'kamikaze': {
      const t = toPlayer(run, e);
      if (e.state === 0) {
        chase(run, e, dt);
        if (t.d < (P.trigger ?? 60)) {
          e.state = 1;
          e.timer = P.fuse ?? 0.8;
          e.telegraph = e.timer;
          run.sfx('elite_spawn', { volume: 0.25, pitch: 2 }, e.x);
        }
      } else {
        steer(e, 0, 0, dt, 10);
        e.timer -= dt;
        e.squash = 0.5 + Math.sin(e.timer * 40) * 0.5;
        if (e.timer <= 0) {
          const r = P.blast ?? 70;
          if (t.d < r) run.hurtPlayer(e.damage, e.x, e.y, 'blast:' + e.def.id);
          run.fx.burst(e.x, e.y, 18, { colors: ['#ffd34d', '#ff7b2e', '#ffffff'], speed: 280, size: 5, life: 0.5, additive: true });
          run.fx.ring(e.x, e.y, 10, r, 0.35, '#ffb02e', 6);
          if (P.cloud) hazard(run, 'cheese', e.x, e.y, r * 0.8, 3, 0.3, 3);
          run.sfx('explosion', { volume: 0.6 }, e.x);
          run.fx.shake(0.1);
          run.killEnemy(e, null);
        }
      }
      break;
    }
    case 'support': {
      chase(run, e, dt, 0.8);
      e.timer -= dt;
      if (e.timer <= 0) {
        e.timer = P.every ?? 1.2;
        const r = P.r ?? 110;
        run.enemiesIn(e.x, e.y, r, tmp);
        for (const o of tmp) if (o !== e && !o.boss) o.buff = Math.max(o.buff, (P.every ?? 1.2) + 0.2);
        run.fx.ring(e.x, e.y, 10, r, 0.6, '#d9f5a0', 3, true);
      }
      break;
    }
    case 'strafe': {
      const t = toPlayer(run, e);
      const per = P.period ?? 0.9;
      const side = Math.floor((run.time + e.id * 0.37) / per) % 2 ? 1 : -1;
      const a = Math.atan2(t.dy, t.dx) + side * 0.95;
      steer(e, Math.cos(a) * e.speed, Math.sin(a) * e.speed, dt, 9);
      break;
    }
    case 'leaper': {
      const t = toPlayer(run, e);
      if (e.state === 0) {
        chase(run, e, dt);
        e.z = 0;
        e.timer -= dt;
        if (t.d < (P.range ?? 210) && e.timer <= 0) {
          e.state = 1;
          e.timer = P.time ?? 0.6;
          const p = run.player;
          e.ax = p.x;
          e.ay = p.y;
          e.aux = e.timer;
          e.vx = (e.ax - e.x) / e.timer;
          e.vy = (e.ay - e.y) / e.timer;
          e.attackPose = e.timer;
        }
      } else {
        const k = 1 - e.timer / e.aux;
        e.z = Math.sin(k * Math.PI) * (P.height ?? 40);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.face = e.vx > 0 ? 1 : -1;
        e.timer -= dt;
        if (e.timer <= 0) {
          e.state = 0;
          e.z = 0;
          e.squash = 1;
          e.timer = P.cd ?? 2.4;
          e.vx *= 0.1;
          e.vy *= 0.1;
          run.fx.burst(e.x, e.y + e.r * 0.6, 6, { color: '#d9c7a0', speed: 90, size: 3, life: 0.35, layer: 0 });
        }
      }
      break;
    }
    case 'summoner': {
      const t = toPlayer(run, e);
      const min = P.min ?? 160, max = P.max ?? 260;
      if (t.d > max) chase(run, e, dt);
      else if (t.d < min) steer(e, -t.dx * e.speed, -t.dy * e.speed, dt);
      else steer(e, 0, 0, dt, 3);
      e.timer -= dt;
      if (e.timer <= 0 && run.onScreen(e.x, e.y, 0)) {
        e.timer = P.every ?? 4;
        const def = ENEMIES[P.spawn ?? 'spezzato'];
        for (let i = 0; i < (P.count ?? 2); i++) {
          const a = Math.random() * TAU;
          const m = run.spawnEnemy(def, e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r);
          m.kx = Math.cos(a) * 160;
          m.ky = Math.sin(a) * 160;
        }
        e.attackPose = 0.4;
        run.sfx('enemy_split', { volume: 0.4 }, e.x);
      }
      break;
    }
    case 'burster': {
      const t = toPlayer(run, e);
      const min = P.min ?? 150, max = P.max ?? 250;
      if (t.d > max) chase(run, e, dt);
      else if (t.d < min) steer(e, -t.dx * e.speed, -t.dy * e.speed, dt);
      else steer(e, -t.dy * e.speed * 0.4, t.dx * e.speed * 0.4, dt, 3);
      e.z = 8 + Math.sin(run.time * 3 + e.id) * 3;
      e.aux += dt * 6;
      e.timer -= dt;
      if (e.timer <= 0 && run.onScreen(e.x, e.y, -20)) {
        e.timer = P.cd ?? 3;
        const n = P.count ?? 8;
        e.bossT = (e.bossT + 0.4) % TAU;
        for (let i = 0; i < n; i++) shoot(run, e, e.bossT + (i / n) * TAU, P.shotSpeed ?? 150, P.shot ?? 'proj.e_ketchup', e.damage * 0.7);
        e.attackPose = 0.3;
        run.sfx('enemy_shoot', { volume: 0.35, pitch: 1.2 }, e.x);
      }
      break;
    }
    case 'aura': {
      chase(run, e, dt);
      const p = run.player;
      const r = P.r ?? 95;
      if ((p.x - e.x) ** 2 + (p.y - e.y) ** 2 < r * r) {
        p.slowT = 0.2;
        p.slowAmt = Math.max(p.slowAmt, P.slow ?? 0.3);
      }
      if (Math.random() < dt * 8) {
        const a = Math.random() * TAU, dd = Math.random() * r;
        run.fx.burst(e.x + Math.cos(a) * dd, e.y + Math.sin(a) * dd * 0.7, 1, { colors: ['#dff4ff', '#a9dcff'], speed: 15, size: 2.5, life: 0.8, layer: 0 });
      }
      break;
    }
    case 'devourer': {
      // hunt the nearest smaller crime and swallow it to grow
      let target: Enemy | null = null;
      if (e.scale < 1.9) {
        run.enemiesIn(e.x, e.y, P.range ?? 320, tmp);
        let bd = 1e9;
        for (const o of tmp) {
          if (o === e || o.boss || o.elite || o.def.behavior === 'devourer' || o.r > e.r) continue;
          const dd = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
          if (dd < bd) { bd = dd; target = o; }
        }
      }
      if (target) {
        const dx = target.x - e.x, dy = target.y - e.y;
        const dd = Math.hypot(dx, dy) || 1;
        steer(e, (dx / dd) * e.speed * 1.2, (dy / dd) * e.speed * 1.2, dt);
        if (dd < e.r + target.r * 0.6) {
          target.alive = false;
          e.scale = Math.min(1.9, e.scale * 1.1);
          e.r = e.def.radius * e.scale;
          e.maxHp *= 1.25;
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.25);
          e.damage *= 1.06;
          e.xp += Math.max(1, target.xp);
          e.squash = 1;
          e.attackPose = 0.3;
          run.fx.burst(e.x, e.y - e.r * 0.5, 8, { color: e.def.juice ?? '#fff', speed: 120, size: 3, life: 0.4 });
          if (Math.random() < 0.3) run.fx.bubble(e, 'GNAM!', -e.r * 2.4, '#fff3d6', 0.9);
          run.sfx('enemy_split', { volume: 0.3, pitch: 0.7 }, e.x);
        }
      } else chase(run, e, dt);
      break;
    }
    case 'ghost': {
      chase(run, e, dt);
      e.z = 6 + Math.sin(run.time * 2.5 + e.id) * 4;
      e.timer -= dt;
      if (e.timer <= 0) {
        e.state = e.state === 1 ? 0 : 1;
        e.timer = (P.period ?? 1.6) * (e.state === 1 ? 0.8 : 1.2);
      }
      break;
    }
    case 'boss':
      updateBoss(run, e, dt);
      break;
  }
}

export function onEnemyDeath(run: Run, e: Enemy) {
  const s = e.def.split;
  if (s) {
    const def = ENEMIES[s.into];
    if (def) {
      for (let i = 0; i < s.count; i++) {
        const a = (i / s.count) * TAU + Math.random();
        const m = run.spawnEnemy(def, e.x + Math.cos(a) * 6, e.y + Math.sin(a) * 6);
        m.kx = Math.cos(a) * 220;
        m.ky = Math.sin(a) * 220;
        m.spawnT = 0.1;
        if (e.elite) {
          m.maxHp *= 3;
          m.hp = m.maxHp;
        }
      }
      run.sfx('enemy_split', { volume: 0.5 }, e.x);
    }
  }
}

// ---------------------------------------------------------------------------
// BOSSES
// ---------------------------------------------------------------------------

type Pattern = (run: Run, e: Enemy, dt: number) => void;

function ring(run: Run, e: Enemy, n: number, speed: number, sprite: string, off = 0, dmgMul = 0.45) {
  for (let i = 0; i < n; i++) shoot(run, e, off + (i / n) * TAU, speed, sprite, e.damage * dmgMul, 8);
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
}

function aimed(run: Run, e: Enemy, n: number, spread: number, speed: number, sprite: string) {
  const t = toPlayer(run, e);
  const a = Math.atan2(t.dy, t.dx);
  for (let i = 0; i < n; i++) {
    const off = n > 1 ? (i / (n - 1) - 0.5) * spread : 0;
    shoot(run, e, a + off, speed, sprite, e.damage * 0.45, 8);
  }
  run.sfx('boss_shoot', { volume: 0.5 }, e.x);
}

function summon(run: Run, e: Enemy, id: string, n: number) {
  const def = ENEMIES[id];
  if (!def) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.random() * 0.5;
    const m = run.spawnEnemy(def, e.x + Math.cos(a) * (e.r + 10), e.y + Math.sin(a) * (e.r + 10));
    m.kx = Math.cos(a) * 200;
    m.ky = Math.sin(a) * 200;
  }
}

/** Jump to (tx,ty) over `time`, slam on landing. */
function leap(e: Enemy, tx: number, ty: number, time: number, r = e.r * 1.8) {
  e.slamR = r;
  e.state = 50;
  e.timer = time;
  e.aux = time;
  e.ax = tx;
  e.ay = ty;
  e.vx = (tx - e.x) / time;
  e.vy = (ty - e.y) / time;
}

/** generic leap update; returns true on landing */
function leapUpdate(run: Run, e: Enemy, dt: number, height = 120): boolean {
  const k = 1 - e.timer / e.aux;
  e.z = Math.sin(k * Math.PI) * height;
  e.x += e.vx * dt;
  e.y += e.vy * dt;
  e.timer -= dt;
  if (e.timer <= 0) {
    e.z = 0;
    e.squash = 1;
    run.fx.shake(0.45);
    run.sfx('boss_slam', {}, e.x);
    run.fx.ring(e.x, e.y + e.r * 0.4, e.r * 0.5, e.r * 2.6, 0.5, '#ffffff', 8, false);
    run.fx.burst(e.x, e.y + e.r * 0.5, 22, { color: '#d9c7a0', speed: 260, size: 5, life: 0.5, layer: 0 });
    const p = run.player;
    const R = e.slamR || e.r * 1.8;
    if ((p.x - e.x) ** 2 + ((p.y - e.y) / 0.8) ** 2 < R * R) run.hurtPlayer(e.damage, e.x, e.y, 'slam:' + e.def.id);
    return true;
  }
  return false;
}

/**
 * Boss brain: cycles through an attack list. Each attack = [name, duration].
 * state 0 = walk (timer until next attack). Attacks run in `bossAttack`.
 */
function brain(run: Run, e: Enemy, dt: number, attacks: string[], walkMul: number, perform: (name: string, t: number, first: boolean) => boolean) {
  // enrage under 50% HP
  const enraged = e.hp < e.maxHp * 0.5;
  if (enraged && e.bossPhase === 0) {
    e.bossPhase = 1;
    run.fx.bubble(e, 'MAMMA MIA!!', -e.r * 2.2, '#ffd0c8', 1.6, true);
    run.sfx('boss_roar', {}, e.x);
    run.fx.shake(0.4);
  }
  if (e.state === 50) {
    if (leapUpdate(run, e, dt)) {
      e.state = 0;
      e.timer = 0.6;
    }
    return;
  }
  if (!e.bossAttack) {
    chase(run, e, dt, walkMul * (enraged ? 1.25 : 1));
    e.timer -= dt;
    if (e.timer <= 0) {
      e.bossAttack = attacks[e.aux++ % attacks.length];
      e.bossT = 0;
    }
    return;
  }
  const first = e.bossT === 0;
  e.bossT += dt;
  const done = perform(e.bossAttack, e.bossT, first);
  if (done) {
    e.bossAttack = '';
    e.timer = (enraged ? 1.2 : 2) + Math.random() * 0.8;
  }
}

const PATTERNS: Record<string, Pattern> = {
  ketchup(run, e, dt) {
    brain(run, e, dt, ['spray', 'spiral', 'charge', 'spray'], 1, (a, t, first) => {
      steer(e, 0, 0, dt, 6);
      if (a === 'spray') {
        if (first) { e.telegraph = 0.5; e.attackPose = 1.6; }
        if (t > 0.5 && Math.floor((t - dt) * 5) !== Math.floor(t * 5)) aimed(run, e, 3, 0.55, 190, 'proj.e_ketchup');
        return t > 1.6;
      }
      if (a === 'spiral') {
        if (first) { e.telegraph = 0.4; e.attackPose = 2.4; }
        if (t > 0.4 && Math.floor((t - dt) * 9) !== Math.floor(t * 9)) {
          const off = t * 3.2;
          shoot(run, e, off, 160, 'proj.e_ketchup', e.damage * 0.4, 8);
          shoot(run, e, off + Math.PI, 160, 'proj.e_ketchup', e.damage * 0.4, 8);
          if (e.bossPhase) shoot(run, e, off + Math.PI / 2, 160, 'proj.e_ketchup', e.damage * 0.4, 8);
        }
        return t > 2.4;
      }
      // charge
      if (first) {
        e.telegraph = 0.6;
        const tp = toPlayer(run, e);
        e.ax = tp.dx;
        e.ay = tp.dy;
      }
      if (t > 0.6) {
        e.x += e.ax * 420 * dt;
        e.y += e.ay * 420 * dt;
        e.attackPose = 0.1;
        if (Math.random() < dt * 25) hazard(run, 'ketchup', e.x, e.y + e.r * 0.5, 26, 4, 0.25, 4);
      }
      return t > 1.3;
    });
  },
  alfredo(run, e, dt) {
    brain(run, e, dt, ['slam', 'ring', 'summon', 'slam'], 0.9, (a, t, first) => {
      steer(e, 0, 0, dt, 6);
      if (a === 'slam') {
        if (first) {
          const p = run.player;
          danger(run, p.x, p.y, e.r * 1.9, 0.9, 0);
          leap(e, p.x, p.y, 0.9, e.r * 1.9);
          e.attackPose = 0.9;
        }
        return true;
      }
      if (a === 'ring') {
        if (first) { e.telegraph = 0.5; e.attackPose = 1.4; }
        if (t > 0.5 && Math.floor((t - dt) * 2.5) !== Math.floor(t * 2.5)) ring(run, e, e.bossPhase ? 18 : 12, 160, 'proj.e_cream', t);
        return t > 1.6;
      }
      if (first) {
        summon(run, e, 'panna', 3);
        summon(run, e, 'pollo', 2);
        e.attackPose = 0.6;
        run.sfx('boss_roar', { volume: 0.6 }, e.x);
      }
      return t > 0.8;
    });
  },
  panna(run, e, dt) {
    brain(run, e, dt, ['flood', 'leap', 'ring', 'leap', 'summon'], 0.9, (a, t, first) => {
      steer(e, 0, 0, dt, 6);
      if (a === 'flood') {
        if (first) { e.telegraph = 0.4; e.attackPose = 2; }
        if (t > 0.4 && Math.floor((t - dt) * 4) !== Math.floor(t * 4)) {
          const p = run.player;
          lobShot(run, e, p.x + (Math.random() - 0.5) * 160, p.y + (Math.random() - 0.5) * 120, 0.8, 'proj.e_cream', e.damage * 0.5, (x, y) => hazard(run, 'cream', x, y, 46, 7, 0.45));
        }
        return t > 2;
      }
      if (a === 'leap') {
        if (first) {
          const p = run.player;
          danger(run, p.x, p.y, e.r * 2, 1, 0);
          leap(e, p.x, p.y, 1, e.r * 2);
          e.attackPose = 1;
          run.schedule(1.02, () => {
            if (e.alive) for (let i = 0; i < 4; i++) hazard(run, 'cream', e.x + Math.cos(i * 1.57) * 60, e.y + Math.sin(i * 1.57) * 45, 40, 6, 0.4);
          });
        }
        return true;
      }
      if (a === 'ring') {
        if (first) { e.telegraph = 0.5; e.attackPose = 1.6; }
        if (t > 0.5 && Math.floor((t - dt) * 3) !== Math.floor(t * 3)) ring(run, e, e.bossPhase ? 20 : 14, 150, 'proj.e_cream', t * 0.7);
        return t > 1.8;
      }
      if (first) {
        summon(run, e, 'panna', 4);
        summon(run, e, 'alfredo', 1);
        e.attackPose = 0.6;
      }
      return t > 0.8;
    });
  },
  scatolone(run, e, dt) {
    brain(run, e, dt, ['rings', 'roll', 'summon'], 1, (a, t, first) => {
      if (a === 'rings') {
        steer(e, 0, 0, dt, 6);
        if (first) { e.telegraph = 0.4; e.attackPose = 1.8; }
        if (t > 0.4 && Math.floor((t - dt) * 2) !== Math.floor(t * 2)) ring(run, e, e.bossPhase ? 16 : 11, 180, 'proj.e_generic', t);
        return t > 1.9;
      }
      if (a === 'roll') {
        if (first) {
          e.telegraph = 0.6;
          const tp = toPlayer(run, e);
          e.ax = tp.dx;
          e.ay = tp.dy;
        }
        if (t > 0.6) {
          const tp = toPlayer(run, e);
          e.ax += (tp.dx - e.ax) * dt * 0.6;
          e.ay += (tp.dy - e.ay) * dt * 0.6;
          const l = Math.hypot(e.ax, e.ay) || 1;
          e.x += (e.ax / l) * 320 * dt;
          e.y += (e.ay / l) * 320 * dt;
          e.anim += dt * 20;
          e.attackPose = 0.1;
        } else steer(e, 0, 0, dt, 6);
        return t > 2.2;
      }
      steer(e, 0, 0, dt, 6);
      if (first) {
        summon(run, e, 'spezzato', 6);
        summon(run, e, 'scatoletta', 1);
        e.attackPose = 0.5;
      }
      return t > 0.8;
    });
  },
  deepdish(run, e, dt) {
    brain(run, e, dt, ['slam', 'quake', 'slam', 'summon'], 1, (a, t, first) => {
      steer(e, 0, 0, dt, 6);
      if (a === 'slam') {
        if (first) {
          const p = run.player;
          danger(run, p.x, p.y, e.r * 1.6, 1.1, 0);
          leap(e, p.x, p.y, 1.1, e.r * 1.6);
          e.attackPose = 1.1;
        }
        return true;
      }
      if (a === 'quake') {
        if (first) { e.telegraph = 0.9; e.attackPose = 2; }
        if (t > 0.9 && Math.floor((t - dt) * 2) !== Math.floor(t * 2)) {
          for (let i = 0; i < 5; i++) {
            const p = run.player;
            danger(run, p.x + (Math.random() - 0.5) * 300, p.y + (Math.random() - 0.5) * 220, 50, 0.8, e.damage * 0.8);
          }
          run.fx.shake(0.2);
        }
        return t > 2.6;
      }
      if (first) {
        summon(run, e, 'hawaiana', 3);
        summon(run, e, 'crosta', 2);
        e.attackPose = 0.5;
      }
      return t > 0.8;
    });
  },
  ananas(run, e, dt) {
    brain(run, e, dt, ['volley', 'spin', 'summon', 'leap'], 1, (a, t, first) => {
      if (a === 'volley') {
        steer(e, 0, 0, dt, 6);
        if (first) { e.telegraph = 0.5; e.attackPose = 1.8; }
        if (t > 0.5 && Math.floor((t - dt) * 5) !== Math.floor(t * 5)) {
          const p = run.player;
          for (let k = 0; k < (e.bossPhase ? 2 : 1); k++)
            lobShot(run, e, p.x + (Math.random() - 0.5) * 120, p.y + (Math.random() - 0.5) * 90, 0.8, 'proj.e_seed', e.damage * 0.6, (x, y) => {
              danger(run, x, y, 1, 0.01, 0);
              const pl = run.player;
              if (Math.hypot(pl.x - x, pl.y - y) < 34) run.hurtPlayer(e.damage * 0.6, x, y);
              run.fx.burst(x, y, 8, { sprite: 'fx.chunk.pineapple', frames: 4, speed: 140, size: 1, life: 0.6, gravity: 500, up: 120, shrink: false });
            });
        }
        return t > 1.9;
      }
      if (a === 'spin') {
        if (first) { e.telegraph = 0.6; }
        if (t > 0.6) {
          chase(run, e, dt, 2.4);
          e.attackPose = 0.1;
          if (Math.floor((t - dt) * 6) !== Math.floor(t * 6)) ring(run, e, 8, 200, 'proj.e_seed', t * 2, 0.5);
        } else steer(e, 0, 0, dt, 6);
        return t > 2.8;
      }
      if (a === 'summon') {
        steer(e, 0, 0, dt, 6);
        if (first) {
          summon(run, e, 'ananas', 2);
          summon(run, e, 'hawaiana', 3);
          e.attackPose = 0.6;
          run.sfx('boss_roar', { volume: 0.6 }, e.x);
        }
        return t > 0.9;
      }
      if (first) {
        const p = run.player;
        danger(run, p.x, p.y, e.r * 1.8, 0.95, 0);
        leap(e, p.x, p.y, 0.95, e.r * 1.8);
      }
      return true;
    });
  },
  campanile(run, e, dt) {
    brain(run, e, dt, ['toll', 'foam', 'summon', 'toll', 'dash'], 1, (a, t, first) => {
      if (a === 'dash') {
        if (first) {
          e.telegraph = 0.5;
          const tp = toPlayer(run, e);
          e.ax = tp.dx;
          e.ay = tp.dy;
        }
        if (t > 0.5) {
          e.x += e.ax * 480 * dt;
          e.y += e.ay * 480 * dt;
          e.attackPose = 0.1;
          if (Math.random() < dt * 30) run.fx.streak(e.x, e.y - 30, -e.ax * 200, -e.ay * 200, '#f3e2c4', 0.3, 6);
        } else steer(e, 0, 0, dt, 8);
        return t > 1.2;
      }
      steer(e, 0, 0, dt, 6);
      if (a === 'toll') {
        if (first) { e.telegraph = 0.5; e.attackPose = 2.2; }
        if (t > 0.5 && Math.floor((t - dt) * 1.4) !== Math.floor(t * 1.4)) {
          // DONG: expanding ring of foam + shock
          ring(run, e, e.bossPhase ? 22 : 16, 170, 'proj.e_cream', t, 0.55);
          run.fx.ring(e.x, e.y, 20, 340, 0.9, '#f3e2c4', 6, false);
          run.fx.shake(0.18);
          run.sfx('boss_slam', { volume: 0.5, pitch: 1.4 }, e.x);
        }
        return t > 2.3;
      }
      if (a === 'foam') {
        if (first) { e.telegraph = 0.4; e.attackPose = 1.6; }
        if (t > 0.4 && Math.floor((t - dt) * 4) !== Math.floor(t * 4)) {
          const p = run.player;
          lobShot(run, e, p.x + (Math.random() - 0.5) * 150, p.y + (Math.random() - 0.5) * 110, 0.75, 'proj.e_cream', e.damage * 0.5, (x, y) => hazard(run, 'cream', x, y, 42, 6, 0.4));
        }
        return t > 1.7;
      }
      if (first) {
        summon(run, e, 'cappuccino', 4);
        summon(run, e, 'frappe', 2);
        run.fx.bubble(e, 'DONG!', -e.r * 2.4, '#fff3d6', 1.2, true);
        e.attackPose = 0.6;
      }
      return t > 0.9;
    });
  },
  influencer(run, e, dt) {
    brain(run, e, dt, ['viral', 'flash', 'beam', 'viral', 'flash'], 0.9, (a, t, first) => {
      steer(e, 0, 0, dt, 6);
      if (a === 'viral') {
        if (first) {
          const pool = ['ketchup', 'panna', 'ananas_pezzo', 'pastachips', 'frappe', 'smartphone'];
          for (let i = 0; i < 3; i++) summon(run, e, pool[Math.floor(Math.random() * pool.length)], 2);
          run.fx.bubble(e, '#VIRALE!', -e.r * 2.2, '#ffd6f0', 1.4, true);
          e.attackPose = 0.7;
        }
        return t > 1;
      }
      if (a === 'flash') {
        if (first) { e.telegraph = 0.8; e.attackPose = 1.2; }
        if (t > 0.8 && t - dt <= 0.8) {
          run.fx.screenFlash(0.55, '#ffffff');
          ring(run, e, e.bossPhase ? 28 : 20, 210, 'proj.e_generic', 0, 0.55);
        }
        return t > 1.4;
      }
      // beam: aimed streams
      if (first) { e.telegraph = 0.4; e.attackPose = 1.8; }
      if (t > 0.4 && Math.floor((t - dt) * 10) !== Math.floor(t * 10)) aimed(run, e, e.bossPhase ? 3 : 1, 0.4, 300, 'proj.e_generic');
      return t > 1.9;
    });
  },
  microonde(run, e, dt) {
    brain(run, e, dt, ['waves', 'ding', 'summon', 'waves'], 0.9, (a, t, first) => {
      steer(e, 0, 0, dt, 6);
      if (a === 'waves') {
        if (first) { e.telegraph = 0.5; e.attackPose = 2; }
        if (t > 0.5 && Math.floor((t - dt) * 2.2) !== Math.floor(t * 2.2)) {
          ring(run, e, e.bossPhase ? 24 : 16, 150, 'proj.e_generic', t * 0.9, 0.5);
          run.fx.ring(e.x, e.y, 10, 300, 0.8, '#ffe28a', 4);
        }
        return t > 2.2;
      }
      if (a === 'ding') {
        if (first) {
          e.telegraph = 1;
          const p = run.player;
          for (let i = 0; i < 6; i++) danger(run, p.x + (Math.random() - 0.5) * 260, p.y + (Math.random() - 0.5) * 200, 56, 1.1, e.damage * 0.8);
        }
        return t > 1.3;
      }
      if (first) {
        summon(run, e, 'surgelata', 1);
        summon(run, e, 'noodlecup', 4);
        e.attackPose = 0.6;
      }
      return t > 0.8;
    });
  },
  fusione(run, e, dt) {
    brain(run, e, dt, ['spiral', 'leap', 'summon', 'flood', 'ring', 'leap'], 1, (a, t, first) => {
      if (a === 'leap') {
        if (first) {
          const p = run.player;
          danger(run, p.x, p.y, e.r * 1.7, 1, 0);
          leap(e, p.x, p.y, 1, e.r * 1.7);
        }
        return true;
      }
      steer(e, 0, 0, dt, 6);
      if (a === 'spiral') {
        if (first) { e.telegraph = 0.4; e.attackPose = 2.6; }
        if (t > 0.4 && Math.floor((t - dt) * 14) !== Math.floor(t * 14)) {
          const off = t * 2.6;
          for (let k = 0; k < (e.bossPhase ? 4 : 3); k++) shoot(run, e, off + (k / (e.bossPhase ? 4 : 3)) * TAU, 180, k % 2 ? 'proj.e_ketchup' : 'proj.e_seed', e.damage * 0.45, 8);
        }
        return t > 2.6;
      }
      if (a === 'summon') {
        if (first) {
          summon(run, e, 'ananas', 2);
          summon(run, e, 'panna', 2);
          summon(run, e, 'pollo', 2);
          e.attackPose = 0.6;
          run.sfx('boss_roar', {}, e.x);
        }
        return t > 0.9;
      }
      if (a === 'flood') {
        if (first) { e.telegraph = 0.4; e.attackPose = 1.8; }
        if (t > 0.4 && Math.floor((t - dt) * 5) !== Math.floor(t * 5)) {
          const p = run.player;
          lobShot(run, e, p.x + (Math.random() - 0.5) * 180, p.y + (Math.random() - 0.5) * 120, 0.8, 'proj.e_cream', e.damage * 0.5, (x, y) => hazard(run, Math.random() < 0.5 ? 'cream' : 'ketchup', x, y, 44, 6, 0.4, 4));
        }
        return t > 1.8;
      }
      if (first) { e.telegraph = 0.5; e.attackPose = 1.6; }
      if (t > 0.5 && Math.floor((t - dt) * 3) !== Math.floor(t * 3)) ring(run, e, e.bossPhase ? 26 : 18, 170, 'proj.e_pepperoni', t, 0.5);
      return t > 1.7;
    });
  },
};

function updateBoss(run: Run, e: Enemy, dt: number) {
  const pat = PATTERNS[e.def.boss?.pattern ?? 'ketchup'] ?? PATTERNS.ketchup;
  pat(run, e, dt);
}
