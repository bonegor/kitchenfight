/**
 * The chef's arsenal: 14 weapons + 14 evolutions.
 * Each weapon fires on its own cooldown using the Run API.
 */
import type { Run } from './run';
import type { WeaponStats, WeaponLevel } from './types';
import { Enemy, Projectile } from './entities';
import { TAU } from '../core/math';
import type { SfxId } from '../audio/audio';

export interface WeaponDef {
  id: string;
  name: string;
  /** one-line description */
  desc: string;
  icon: string;
  maxLevel: number;
  base: WeaponStats;
  levels: WeaponLevel[]; // levels[0] = level 2, ...
  /** evolution recipe: requires this passive (any level) + max level */
  evolve?: { passive: string; into: string };
  evolution?: boolean;
  /** evolved from */
  from?: string;
  sfx: SfxId;
  fire(run: Run, w: WeaponInstance): void;
  /** persistent behaviour each frame (auras, orbits, trails) */
  update?(run: Run, w: WeaponInstance, dt: number): void;
}

const S = (o: Partial<WeaponStats>): WeaponStats => ({
  damage: 10,
  cooldown: 1,
  area: 1,
  speed: 1,
  amount: 1,
  duration: 1,
  pierce: 1,
  knockback: 1,
  interval: 0.08,
  crit: 0,
  critMul: 2,
  hitDelay: 0,
  ...o,
});

const L = (text: string, mods: Partial<WeaponStats>): WeaponLevel => ({ text, mods });

export class WeaponInstance {
  level = 1;
  cd = 0.4;
  damageDealt = 0;
  kills = 0;
  acquired = 0;
  state: any = {};
  constructor(public def: WeaponDef, public slot: number) {}

  /** Raw weapon stats at the current level (before player stats). */
  raw(): WeaponStats {
    const s = { ...this.def.base };
    for (let i = 0; i < this.level - 1 && i < this.def.levels.length; i++) {
      const m = this.def.levels[i].mods;
      for (const k in m) (s as any)[k] += (m as any)[k];
    }
    return s;
  }

  /** Effective stats with the player's stats applied. */
  stats(run: Run): WeaponStats {
    const s = this.raw();
    const p = run.stats;
    s.damage *= p.might;
    s.cooldown = Math.max(0.05, s.cooldown * p.cooldown);
    s.area *= p.area;
    s.speed *= p.speed;
    s.amount += p.amount;
    s.duration *= p.duration;
    return s;
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function volley(run: Run, w: WeaponInstance, n: number, interval: number, fn: (i: number) => void) {
  const d = w.def;
  for (let i = 0; i < n; i++) {
    if (i === 0 || interval <= 0) fn(i);
    else run.schedule(interval * i, () => {
      if (w.def === d) fn(i); // the weapon may have evolved in between
    });
  }
}

function aimAt(run: Run, x: number, y: number): number {
  const e = run.nearestEnemy(x, y, 900);
  if (e) return Math.atan2(e.y - y, e.x - x);
  return Math.atan2(run.player.dirY, run.player.dirX);
}

function baseProj(run: Run, w: WeaponInstance, s: WeaponStats, sprite: string): Projectile {
  const p = run.spawnProj();
  p.weapon = w;
  p.sprite = sprite;
  p.damage = s.damage;
  p.pierce = s.pierce;
  p.knock = s.knockback;
  p.crit = s.crit;
  p.critMul = s.critMul;
  p.hitDelay = s.hitDelay;
  p.x = run.player.x;
  p.y = run.player.y - 10;
  return p;
}

// ---------------------------------------------------------------------------
// WEAPONS
// ---------------------------------------------------------------------------

export const WEAPONS: Record<string, WeaponDef> = {};
function def(d: WeaponDef) {
  WEAPONS[d.id] = d;
}

// 1. MATTARELLO — rolling-pin smash in front (and behind)
def({
  id: 'mattarello',
  name: 'Mattarello',
  desc: "Nonna's rolling pin. Smashes everything in front of you.",
  icon: 'icon.w.mattarello',
  maxLevel: 8,
  sfx: 'w_mattarello',
  base: S({ damage: 15, cooldown: 1.2, area: 1, amount: 1, duration: 0.24, knockback: 1.4, interval: 0.14, pierce: Infinity }),
  levels: [
    L('Smash behind you too.', { amount: 1 }),
    L('+6 damage.', { damage: 6 }),
    L('+10% area, +4 damage.', { area: 0.1, damage: 4 }),
    L('+6 damage.', { damage: 6 }),
    L('+15% area.', { area: 0.15 }),
    L('+8 damage, stronger knockback.', { damage: 8, knockback: 0.5 }),
    L('+10 damage.', { damage: 10 }),
  ],
  evolve: { passive: 'grembiule', into: 'mattarello_nonna' },
  fire(run, w) {
    const s = w.stats(run);
    const pl = run.player;
    const near = run.nearestEnemy(pl.x, pl.y, 150 * s.area);
    const face = near ? (near.x >= pl.x ? 1 : -1) : pl.face;
    volley(run, w, s.amount, s.interval, (i) => {
      const dir = i % 2 === 0 ? face : -face;
      const p = baseProj(run, w, s, 'proj.mattarello');
      p.kind = 'sweep';
      p.life = p.max = s.duration;
      p.dir = dir;
      p.w = 132 * s.area;
      p.h = 62 * s.area;
      p.ox = (dir * p.w) / 2 + dir * 6;
      p.oy = -6 + Math.floor(i / 2) * 22;
      p.r = 1;
      p.faceVel = false;
      run.sfx('w_mattarello', { pitch: 0.95 + Math.random() * 0.1 });
    });
  },
});

def({
  id: 'mattarello_nonna',
  name: 'Mattarello della Nonna',
  desc: 'A blessed golden rolling pin that spins around you. Kills heal.',
  icon: 'icon.e.mattarello_nonna',
  maxLevel: 1,
  evolution: true,
  from: 'mattarello',
  sfx: 'w_mattarello',
  base: S({ damage: 34, cooldown: 1.15, area: 1.15, amount: 1, duration: 0.42, knockback: 2.2, pierce: Infinity, hitDelay: 0.2 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    const p = baseProj(run, w, s, 'proj.mattarello_nonna');
    p.kind = 'sweep';
    p.life = p.max = s.duration;
    p.dir = run.player.face;
    p.arc = 1; // full spin
    p.radius = 92 * s.area;
    p.r = 1;
    p.faceVel = false;
    p.glow = '#ffd34d';
    p.onHit = (_p, e) => {
      if (e.hp <= 0) run.heal(0.6);
    };
    run.sfx('w_mattarello', { pitch: 0.8 });
  },
});

// 2. CIABATTA — Nonna's slipper boomerang
def({
  id: 'ciabatta',
  name: 'Ciabatta',
  desc: "The legendary flying slipper. Always comes back.",
  icon: 'icon.w.ciabatta',
  maxLevel: 8,
  sfx: 'w_ciabatta',
  base: S({ damage: 13, cooldown: 1.6, speed: 1, amount: 1, area: 1, pierce: Infinity, hitDelay: 0.35, interval: 0.12, knockback: 1 }),
  levels: [
    L('+1 slipper.', { amount: 1 }),
    L('+6 damage.', { damage: 6 }),
    L('Thrown 25% further.', { speed: 0.25 }),
    L('+1 slipper.', { amount: 1 }),
    L('+6 damage.', { damage: 6 }),
    L('+20% size.', { area: 0.2 }),
    L('+8 damage.', { damage: 8 }),
  ],
  evolve: { passive: 'minestrone', into: 'ira_nonna' },
  fire(run, w) {
    const s = w.stats(run);
    const base = aimAt(run, run.player.x, run.player.y);
    volley(run, w, s.amount, s.interval, (i) => {
      const a = base + (i - (s.amount - 1) / 2) * 0.35;
      const p = baseProj(run, w, s, 'proj.ciabatta');
      p.kind = 'boomerang';
      p.speed = 470 * s.speed;
      p.vx = Math.cos(a) * p.speed;
      p.vy = Math.sin(a) * p.speed;
      p.r = 13 * s.area;
      p.scale = s.area;
      p.life = p.max = 4;
      p.spin = 16;
      p.faceVel = false;
      run.sfx('w_ciabatta');
    });
  },
});

def({
  id: 'ira_nonna',
  name: "L'Ira della Nonna",
  desc: 'Golden slippers hunt down sinners and stun them.',
  icon: 'icon.e.ira_nonna',
  maxLevel: 1,
  evolution: true,
  from: 'ciabatta',
  sfx: 'w_ciabatta',
  base: S({ damage: 30, cooldown: 1.15, speed: 1.2, amount: 3, area: 1.2, pierce: 9, hitDelay: 0, interval: 0.1, knockback: 1.5 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, (i) => {
      const a = (i / s.amount) * TAU + run.time;
      const p = baseProj(run, w, s, 'proj.ciabatta_oro');
      p.kind = 'homing';
      p.speed = 420 * s.speed;
      p.vx = Math.cos(a) * p.speed;
      p.vy = Math.sin(a) * p.speed;
      p.turn = 7;
      p.r = 14 * s.area;
      p.scale = s.area;
      p.life = p.max = 3.2;
      p.spin = 18;
      p.faceVel = false;
      p.glow = '#ffcf3a';
      p.onHit = (_p, e) => {
        if (!e.boss) e.stun = Math.max(e.stun, 0.6);
        _p.target = null; // pick a new victim
      };
      run.sfx('w_ciabatta', { pitch: 1.15 });
    });
  },
});

// 3. COLTELLI — knives thrown where you're heading
def({
  id: 'coltelli',
  name: 'Coltelli',
  desc: 'Razor-sharp chef knives thrown where you face.',
  icon: 'icon.w.coltelli',
  maxLevel: 8,
  sfx: 'w_coltelli',
  base: S({ damage: 10, cooldown: 1.0, speed: 1, amount: 1, pierce: 1, interval: 0.07, knockback: 0.6 }),
  levels: [
    L('+1 knife.', { amount: 1 }),
    L('+1 knife, +4 damage.', { amount: 1, damage: 4 }),
    L('Pierces +1 enemy.', { pierce: 1 }),
    L('+1 knife.', { amount: 1 }),
    L('+1 knife, +4 damage.', { amount: 1, damage: 4 }),
    L('Pierces +1 enemy.', { pierce: 1 }),
    L('+6 damage.', { damage: 6 }),
  ],
  evolve: { passive: 'espresso', into: 'mille_coltelli' },
  fire(run, w) {
    const s = w.stats(run);
    const a = Math.atan2(run.player.dirY, run.player.dirX);
    volley(run, w, s.amount, s.interval, (i) => {
      const p = baseProj(run, w, s, 'proj.coltello');
      const off = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 7;
      p.x += Math.cos(a + Math.PI / 2) * off;
      p.y += Math.sin(a + Math.PI / 2) * off;
      p.kind = 'straight';
      const sp = 620 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 7;
      p.life = p.max = 1.1;
      run.sfx('w_coltelli', { volume: 0.7 });
    });
  },
});

def({
  id: 'mille_coltelli',
  name: 'Mille Coltelli',
  desc: 'An endless storm of gleaming blades.',
  icon: 'icon.e.mille_coltelli',
  maxLevel: 1,
  evolution: true,
  from: 'coltelli',
  sfx: 'w_coltelli',
  base: S({ damage: 15, cooldown: 0.11, speed: 1.15, amount: 1, pierce: 3, interval: 0, knockback: 0.5 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    const a0 = Math.atan2(run.player.dirY, run.player.dirX);
    const n = Math.max(1, Math.round(s.amount / 2));
    for (let i = 0; i < n; i++) {
      const a = a0 + (Math.random() - 0.5) * 0.22;
      const p = baseProj(run, w, s, 'proj.coltello_mille');
      p.kind = 'straight';
      const sp = 700 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 8;
      p.life = p.max = 1;
      p.glow = '#8fd8ff';
    }
    if (Math.random() < 0.35) run.sfx('w_coltelli', { volume: 0.45, pitch: 1.2 });
  },
});

// 4. OLIVE — auto-aimed olives
def({
  id: 'olive',
  name: 'Olive',
  desc: 'Fires olives at the nearest crime.',
  icon: 'icon.w.olive',
  maxLevel: 8,
  sfx: 'w_olive',
  base: S({ damage: 11, cooldown: 1.1, speed: 1, amount: 1, pierce: 1, interval: 0.09, knockback: 0.7 }),
  levels: [
    L('+1 olive.', { amount: 1 }),
    L('Fires 15% faster.', { cooldown: -0.17 }),
    L('+1 olive.', { amount: 1 }),
    L('+6 damage.', { damage: 6 }),
    L('+1 olive.', { amount: 1 }),
    L('Pierces +1 enemy.', { pierce: 1 }),
    L('+8 damage.', { damage: 8 }),
  ],
  evolve: { passive: 'olio', into: 'olive_oro' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const a = aimAt(run, run.player.x, run.player.y - 10) + (Math.random() - 0.5) * 0.12;
      const p = baseProj(run, w, s, 'proj.olive');
      p.kind = 'straight';
      const sp = 430 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 6;
      p.life = p.max = 1.6;
      run.sfx('w_olive', { volume: 0.7 });
    });
  },
});

def({
  id: 'olive_oro',
  name: "Olive d'Oro",
  desc: 'Piercing golden olives that leave slicks of hot oil.',
  icon: 'icon.e.olive_oro',
  maxLevel: 1,
  evolution: true,
  from: 'olive',
  sfx: 'w_olive',
  base: S({ damage: 24, cooldown: 0.5, speed: 1.2, amount: 2, pierce: 5, interval: 0.06, knockback: 0.8 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, (i) => {
      const a = aimAt(run, run.player.x, run.player.y - 10) + (i - (s.amount - 1) / 2) * 0.1;
      const p = baseProj(run, w, s, 'proj.olive_oro');
      p.kind = 'straight';
      const sp = 520 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 8;
      p.glow = '#ffd84a';
      p.life = p.max = 1.6;
      p.onHit = (pp, e) => {
        if (Math.random() < 0.15) run.addArea('oil', e.x, e.y, 34 * s.area, 2.5, { damage: s.damage * 0.25, tick: 0.4, weapon: w, slow: 0.25 });
        void pp;
      };
    });
    run.sfx('w_olive', { volume: 0.6, pitch: 1.2 });
  },
});

// 5. FORCHETTE — orbiting forks
def({
  id: 'forchette',
  name: 'Forchette',
  desc: 'Forks orbit around you, skewering the unworthy.',
  icon: 'icon.w.forchette',
  maxLevel: 8,
  sfx: 'w_forchette',
  base: S({ damage: 10, cooldown: 4.2, speed: 1, amount: 1, duration: 3, area: 1, pierce: Infinity, hitDelay: 0.5, knockback: 1 }),
  levels: [
    L('+1 fork.', { amount: 1 }),
    L('Spin 25% faster, +5 damage.', { speed: 0.25, damage: 5 }),
    L('+0.5s duration.', { duration: 0.5 }),
    L('+1 fork.', { amount: 1 }),
    L('+25% orbit size.', { area: 0.25 }),
    L('+0.5s duration, +5 damage.', { duration: 0.5, damage: 5 }),
    L('+1 fork.', { amount: 1 }),
  ],
  evolve: { passive: 'semola', into: 'tridente' },
  fire(run, w) {
    const s = w.stats(run);
    const n = s.amount;
    for (let i = 0; i < n; i++) {
      const p = baseProj(run, w, s, 'proj.forchetta');
      p.kind = 'orbit';
      p.angle = (i / n) * TAU;
      p.radius = 74 * s.area;
      p.angVel = 3.3 * s.speed;
      p.life = p.max = s.duration;
      p.r = 11;
      p.scale = Math.min(1.5, 0.85 + s.area * 0.15);
      p.faceVel = false;
    }
    run.sfx('w_forchette', { volume: 0.6 });
  },
});

def({
  id: 'tridente',
  name: 'Tridente di Nettuno',
  desc: "Neptune's golden tridents orbit you forever.",
  icon: 'icon.e.tridente',
  maxLevel: 1,
  evolution: true,
  from: 'forchette',
  sfx: 'w_forchette',
  base: S({ damage: 24, cooldown: 99999, speed: 1.15, amount: 4, duration: 99999, area: 1.25, pierce: Infinity, hitDelay: 0.35, knockback: 2.4 }),
  levels: [],
  fire(run, w) {
    w.state.n = -1; // force rebuild in update
    void run;
  },
  update(run, w) {
    const s = w.stats(run);
    const n = s.amount;
    const list: Projectile[] = (w.state.list ??= []);
    for (let i = list.length - 1; i >= 0; i--) if (!list[i].alive || list[i].weapon !== w) list.splice(i, 1);
    if (w.state.n !== n || list.length !== n) {
      for (const p of list) p.alive = false;
      list.length = 0;
      for (let i = 0; i < n; i++) {
        const p = baseProj(run, w, s, 'proj.tridente');
        p.kind = 'orbit';
        p.angle = (i / n) * TAU;
        p.life = p.max = 1e9;
        p.r = 15;
        p.faceVel = false;
        p.glow = '#ffd34d';
        list.push(p);
      }
      w.state.n = n;
    }
    for (const p of list) {
      p.radius = 92 * s.area;
      p.angVel = 2.8 * s.speed;
      p.damage = s.damage;
    }
  },
});

// 6. PIZZA VOLANTE — dough discs tossed in arcs
def({
  id: 'pizza',
  name: 'Pizza Volante',
  desc: 'Spinning pizza dough tossed high. Hits everything on its way down.',
  icon: 'icon.w.pizza',
  maxLevel: 8,
  sfx: 'w_pizza',
  base: S({ damage: 22, cooldown: 1.9, speed: 1, amount: 1, area: 1, pierce: 3, interval: 0.12, knockback: 1.2 }),
  levels: [
    L('+1 pizza.', { amount: 1 }),
    L('+10 damage.', { damage: 10 }),
    L('Pierces +2 enemies.', { pierce: 2 }),
    L('+1 pizza.', { amount: 1 }),
    L('+10 damage.', { damage: 10 }),
    L('+20% size.', { area: 0.2 }),
    L('+1 pizza, +10 damage.', { amount: 1, damage: 10 }),
  ],
  evolve: { passive: 'sanmarzano', into: 'pizza_celeste' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, (i) => {
      const p = baseProj(run, w, s, 'proj.pizza');
      p.kind = 'arc';
      const side = i % 2 === 0 ? run.player.face : -run.player.face;
      p.vx = side * (50 + Math.random() * 120 + i * 25) * s.speed;
      p.vy = -(560 + Math.random() * 80) * s.speed;
      p.data = 1150 * s.speed * s.speed; // gravity
      p.r = 15 * s.area;
      p.scale = s.area;
      p.spin = 9 * side;
      p.faceVel = false;
      p.life = p.max = 3;
      run.sfx('w_pizza');
    });
  },
});

def({
  id: 'pizza_celeste',
  name: 'Pizza Celeste',
  desc: 'Heavenly margheritas rain from the sky.',
  icon: 'icon.e.pizza_celeste',
  maxLevel: 1,
  evolution: true,
  from: 'pizza',
  sfx: 'w_pizza',
  base: S({ damage: 46, cooldown: 1.7, speed: 1, amount: 5, area: 1.2, pierce: Infinity, interval: 0.09, knockback: 2 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const e = run.randomEnemyOnScreen();
      const v = run.view;
      const tx = e ? e.x : v.x0 + Math.random() * (v.x1 - v.x0);
      const ty = e ? e.y : v.y0 + Math.random() * (v.y1 - v.y0);
      const p = baseProj(run, w, s, 'proj.pizza_celeste');
      p.kind = 'rain';
      p.tx = tx;
      p.ty = ty;
      p.x = tx;
      p.y = ty;
      p.z = 520;
      p.vz = -900;
      p.r = 50 * s.area;
      p.scale = s.area;
      p.spin = 4;
      p.faceVel = false;
      p.life = p.max = 2;
      p.onExpire = (pp) => {
        run.explode(pp.x, pp.y, pp.r, pp.damage, w, { color: 'cheese', knock: 2, sfx: 'w_pizza', shake: 0.12 });
      };
    });
  },
});

// 7. ROTELLA — bouncing pizza cutter
def({
  id: 'rotella',
  name: 'Rotella',
  desc: 'A pizza cutter that ricochets around the screen.',
  icon: 'icon.w.rotella',
  maxLevel: 8,
  sfx: 'w_rotella',
  base: S({ damage: 10, cooldown: 3, speed: 1, amount: 1, duration: 2.5, area: 1, pierce: Infinity, hitDelay: 0.3, knockback: 0.8, interval: 0.15 }),
  levels: [
    L('+1 cutter.', { amount: 1 }),
    L('+0.5s duration, +3 damage.', { duration: 0.5, damage: 3 }),
    L('20% faster.', { speed: 0.2 }),
    L('+1 cutter.', { amount: 1 }),
    L('+0.5s duration, +4 damage.', { duration: 0.5, damage: 4 }),
    L('+20% size.', { area: 0.2 }),
    L('+1 cutter.', { amount: 1 }),
  ],
  evolve: { passive: 'cornicello', into: 'ruota_fortuna' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const a = Math.random() * TAU;
      const p = baseProj(run, w, s, 'proj.rotella');
      p.kind = 'bounce';
      const sp = 360 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 13 * s.area;
      p.scale = s.area;
      p.spin = 20;
      p.faceVel = false;
      p.life = p.max = s.duration;
      run.sfx('w_rotella', { volume: 0.7 });
    });
  },
});

def({
  id: 'ruota_fortuna',
  name: 'Ruota della Fortuna',
  desc: 'Golden wheels of fortune. Huge critical hits; crits may drop coins.',
  icon: 'icon.e.ruota_fortuna',
  maxLevel: 1,
  evolution: true,
  from: 'rotella',
  sfx: 'w_rotella',
  base: S({ damage: 20, cooldown: 2.4, speed: 1.2, amount: 3, duration: 4, area: 1.3, pierce: Infinity, hitDelay: 0.25, knockback: 1, crit: 0.3, critMul: 3, interval: 0.1 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const a = Math.random() * TAU;
      const p = baseProj(run, w, s, 'proj.rotella_oro');
      p.kind = 'bounce';
      const sp = 380 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 14 * s.area;
      p.scale = s.area;
      p.spin = 22;
      p.faceVel = false;
      p.glow = '#ffd34d';
      p.trail = 'fx.spark';
      p.life = p.max = s.duration;
      p.crit = s.crit * run.stats.luck;
      p.onHit = (_p, e) => {
        if (run.lastCrit && Math.random() < 0.15) run.dropPickup('coin', e.x, e.y, 1);
      };
    });
    run.sfx('w_rotella', { pitch: 1.2 });
  },
});

// 8. PEPERONCINO — chillies that burst into flames
def({
  id: 'peperoncino',
  name: 'Peperoncino',
  desc: 'Calabrian chillies burst into burning patches.',
  icon: 'icon.w.peperoncino',
  maxLevel: 8,
  sfx: 'w_peperoncino',
  base: S({ damage: 6, cooldown: 2.4, speed: 1, amount: 1, duration: 2.5, area: 1, pierce: Infinity, interval: 0.15, knockback: 0 }),
  levels: [
    L('+1 chilli.', { amount: 1 }),
    L('+20% fire size.', { area: 0.2 }),
    L('+3 damage.', { damage: 3 }),
    L('+1 chilli.', { amount: 1 }),
    L('Burns 0.75s longer.', { duration: 0.75 }),
    L('+20% fire size.', { area: 0.2 }),
    L('+1 chilli, +3 damage.', { amount: 1, damage: 3 }),
  ],
  evolve: { passive: 'sale', into: 'inferno' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const e = run.randomEnemyNear(run.player.x, run.player.y, 380);
      const a = Math.random() * TAU;
      const d = 80 + Math.random() * 160;
      const tx = e ? e.x : run.player.x + Math.cos(a) * d;
      const ty = e ? e.y : run.player.y + Math.sin(a) * d;
      const p = baseProj(run, w, s, 'proj.peperoncino');
      lob(p, tx, ty, 0.55);
      p.spin = 10;
      p.faceVel = false;
      p.onExpire = (pp) => {
        run.addArea('fire', pp.x, pp.y, 40 * s.area, s.duration, { damage: s.damage, tick: 0.4, weapon: w, burn: s.damage * 0.5 });
        run.sfx('burn', { volume: 0.5 });
      };
      run.sfx('w_peperoncino', { volume: 0.6 });
    });
  },
});

def({
  id: 'inferno',
  name: 'Inferno Calabrese',
  desc: 'Leaves a trail of fire and hurls blazing chillies.',
  icon: 'icon.e.inferno',
  maxLevel: 1,
  evolution: true,
  from: 'peperoncino',
  sfx: 'w_peperoncino',
  base: S({ damage: 12, cooldown: 1.8, speed: 1, amount: 4, duration: 3.5, area: 1.35, pierce: Infinity, interval: 0.1, knockback: 0 }),
  levels: [],
  fire(run, w) {
    WEAPONS.peperoncino.fire(run, w);
  },
  update(run, w, dt) {
    const s = w.stats(run);
    w.state.trail = (w.state.trail ?? 0) - dt;
    const moving = Math.abs(run.player.vx) + Math.abs(run.player.vy) > 10;
    if (moving && w.state.trail <= 0) {
      w.state.trail = 0.22;
      run.addArea('fire', run.player.x, run.player.y + 8, 28 * s.area, 2.2, { damage: s.damage * 0.7, tick: 0.4, weapon: w, burn: s.damage * 0.4 });
    }
  },
});

// 9. MOKA — moka pot bombs
def({
  id: 'moka',
  name: 'Moka',
  desc: 'Lobs a moka pot into the crowd. Pressure builds. BOOM.',
  icon: 'icon.w.moka',
  maxLevel: 8,
  sfx: 'w_moka',
  base: S({ damage: 30, cooldown: 3.2, speed: 1, amount: 1, area: 1, pierce: Infinity, knockback: 2, interval: 0.25 }),
  levels: [
    L('+8 damage.', { damage: 8 }),
    L('+1 moka.', { amount: 1 }),
    L('+20% blast radius.', { area: 0.2 }),
    L('+8 damage.', { damage: 8 }),
    L('+1 moka.', { amount: 1 }),
    L('+20% blast radius.', { area: 0.2 }),
    L('Reloads 0.6s faster, +10 damage.', { cooldown: -0.6, damage: 10 }),
  ],
  evolve: { passive: 'vespa', into: 'moka_turbo' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const t = run.densestPoint(380);
      const p = baseProj(run, w, s, 'proj.moka');
      lob(p, t.x, t.y, 0.7);
      p.spin = 7;
      p.faceVel = false;
      p.onExpire = (pp) => {
        run.explode(pp.x, pp.y, 64 * s.area, pp.damage, w, { color: 'coffee', knock: 2.4, sfx: 'w_moka', shake: 0.15 });
      };
    });
  },
});

def({
  id: 'moka_turbo',
  name: 'Moka Turbo',
  desc: 'Every blast scatters smaller mokas that explode again.',
  icon: 'icon.e.moka_turbo',
  maxLevel: 1,
  evolution: true,
  from: 'moka',
  sfx: 'w_moka',
  base: S({ damage: 48, cooldown: 2.3, speed: 1, amount: 2, area: 1.25, pierce: Infinity, knockback: 2.5, interval: 0.2 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const t = run.densestPoint(420);
      const p = baseProj(run, w, s, 'proj.moka_turbo');
      lob(p, t.x, t.y, 0.65);
      p.spin = 8;
      p.faceVel = false;
      p.onExpire = (pp) => {
        run.explode(pp.x, pp.y, 70 * s.area, pp.damage, w, { color: 'coffee', knock: 2.6, sfx: 'w_moka', shake: 0.18 });
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * TAU + Math.random();
          const q = baseProj(run, w, s, 'proj.moka');
          q.x = pp.x;
          q.y = pp.y;
          lob(q, pp.x + Math.cos(a) * 90, pp.y + Math.sin(a) * 70, 0.45);
          q.scale = 0.7;
          q.spin = 10;
          q.faceVel = false;
          q.damage = pp.damage * 0.55;
          q.onExpire = (qq) => run.explode(qq.x, qq.y, 44 * s.area, qq.damage, w, { color: 'coffee', knock: 1.5, sfx: 'explosion', shake: 0.05 });
        }
      };
    });
  },
});

// 10. SPAGHETTI — chain lash
def({
  id: 'spaghetti',
  name: 'Spaghetti',
  desc: 'A whip of al dente spaghetti that chains between enemies.',
  icon: 'icon.w.spaghetti',
  maxLevel: 8,
  sfx: 'w_spaghetti',
  base: S({ damage: 12, cooldown: 1.5, area: 1, amount: 3, pierce: Infinity, knockback: 0.6 }),
  levels: [
    L('Chains to +1 enemy.', { amount: 1 }),
    L('+5 damage.', { damage: 5 }),
    L('Chains to +1 enemy.', { amount: 1 }),
    L('Lashes 15% faster.', { cooldown: -0.22 }),
    L('Chains to +1 enemy, +5 damage.', { amount: 1, damage: 5 }),
    L('+20% reach.', { area: 0.2 }),
    L('Chains to +2 enemies.', { amount: 2 }),
  ],
  evolve: { passive: 'macinapepe', into: 'cacio_pepe' },
  fire(run, w) {
    const s = w.stats(run);
    run.chainLash(w, s, 230 * s.area, 140 * s.area, s.amount, '#f2c66d');
  },
});

def({
  id: 'cacio_pepe',
  name: 'Tornado Cacio e Pepe',
  desc: 'Peppery pasta tornadoes swirl around you, dragging crimes in.',
  icon: 'icon.e.cacio_pepe',
  maxLevel: 1,
  evolution: true,
  from: 'spaghetti',
  sfx: 'w_spaghetti',
  base: S({ damage: 16, cooldown: 1.2, area: 1.2, amount: 5, pierce: Infinity, knockback: 0.4, hitDelay: 0.3 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    run.chainLash(w, s, 260 * s.area, 160 * s.area, s.amount + 2, '#f6dc8a');
  },
  update(run, w) {
    const s = w.stats(run);
    const n = Math.max(1, Math.floor(s.amount / 3));
    const list: Projectile[] = (w.state.list ??= []);
    for (let i = list.length - 1; i >= 0; i--) if (!list[i].alive || list[i].weapon !== w) list.splice(i, 1);
    while (list.length < n) {
      const p = baseProj(run, w, s, '');
      p.kind = 'tornado';
      p.life = p.max = 1e9;
      p.angle = Math.random() * TAU;
      p.radius = 110 + Math.random() * 60;
      p.faceVel = false;
      list.push(p);
    }
    for (const p of list) {
      p.r = 46 * s.area;
      p.damage = s.damage;
      p.hitDelay = 0.3;
    }
  },
});

// 11. VESUVIO — lava strikes
def({
  id: 'vesuvio',
  name: 'Vesuvio',
  desc: 'Volcanic rocks rain down on random crimes.',
  icon: 'icon.w.vesuvio',
  maxLevel: 8,
  sfx: 'w_vesuvio',
  base: S({ damage: 26, cooldown: 2.6, area: 1, amount: 2, pierce: Infinity, interval: 0.12, knockback: 1.4 }),
  levels: [
    L('+1 strike.', { amount: 1 }),
    L('+8 damage.', { damage: 8 }),
    L('+20% blast radius.', { area: 0.2 }),
    L('+1 strike.', { amount: 1 }),
    L('+8 damage.', { damage: 8 }),
    L('+1 strike.', { amount: 1 }),
    L('+20% radius, +10 damage.', { area: 0.2, damage: 10 }),
  ],
  evolve: { passive: 'grattugia', into: 'pompei' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const e = run.randomEnemyOnScreen();
      if (!e) return;
      run.strike(w, e.x, e.y, 46 * s.area, s.damage, 'proj.vesuvio', 0.45, false);
    });
  },
});

def({
  id: 'pompei',
  name: 'Pompei',
  desc: 'A meteor shower of molten rock. The ground burns.',
  icon: 'icon.e.pompei',
  maxLevel: 1,
  evolution: true,
  from: 'vesuvio',
  sfx: 'w_vesuvio',
  base: S({ damage: 52, cooldown: 2.1, area: 1.35, amount: 6, pierce: Infinity, interval: 0.08, knockback: 1.8 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const e = run.randomEnemyOnScreen();
      const v = run.view;
      const x = e ? e.x : v.x0 + Math.random() * (v.x1 - v.x0);
      const y = e ? e.y : v.y0 + Math.random() * (v.y1 - v.y0);
      run.strike(w, x, y, 56 * s.area, s.damage, 'proj.meteor', 0.5, true);
    });
  },
});

// 12. FORMA — rolling Parmigiano wheel
def({
  id: 'forma',
  name: 'Forma di Parmigiano',
  desc: 'A 40 kg wheel of aged Parmigiano rolls over everything.',
  icon: 'icon.w.forma',
  maxLevel: 8,
  sfx: 'w_forma',
  base: S({ damage: 32, cooldown: 4.4, speed: 1, amount: 1, duration: 4, area: 1, pierce: Infinity, hitDelay: 0.55, knockback: 3, interval: 0.4 }),
  levels: [
    L('+10 damage.', { damage: 10 }),
    L('+1 wheel.', { amount: 1 }),
    L('+20% size.', { area: 0.2 }),
    L('+10 damage.', { damage: 10 }),
    L('Rolls 1s longer.', { duration: 1 }),
    L('+1 wheel.', { amount: 1 }),
    L('+20% size, +15 damage.', { area: 0.2, damage: 15 }),
  ],
  evolve: { passive: 'salvadanaio', into: 'forma_oro' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, (i) => {
      const a = i === 0 ? Math.atan2(run.player.dirY, run.player.dirX) : Math.random() * TAU;
      const p = baseProj(run, w, s, 'proj.forma');
      p.kind = 'roller';
      const sp = 250 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 26 * s.area;
      p.scale = s.area;
      p.faceVel = false;
      p.layer = 0;
      p.bounces = 2;
      p.life = p.max = s.duration;
      run.sfx('w_forma', { volume: 0.8 });
    });
  },
});

def({
  id: 'forma_oro',
  name: "Forma d'Oro",
  desc: 'Golden wheels — banks accept Parmigiano as collateral. Kills may drop coins.',
  icon: 'icon.e.forma_oro',
  maxLevel: 1,
  evolution: true,
  from: 'forma',
  sfx: 'w_forma',
  base: S({ damage: 64, cooldown: 3.4, speed: 1.15, amount: 2, duration: 5, area: 1.35, pierce: Infinity, hitDelay: 0.45, knockback: 3.5, interval: 0.3 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, () => {
      const a = Math.random() * TAU;
      const p = baseProj(run, w, s, 'proj.forma_oro');
      p.kind = 'roller';
      const sp = 280 * s.speed;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.r = 28 * s.area;
      p.scale = s.area;
      p.faceVel = false;
      p.layer = 0;
      p.bounces = 99;
      p.glow = '#ffd34d';
      p.life = p.max = s.duration;
      p.onHit = (_p, e) => {
        if (e.hp <= 0 && Math.random() < 0.18) run.dropPickup('coin', e.x, e.y, 1);
      };
      run.sfx('w_forma', { volume: 0.8, pitch: 1.1 });
    });
  },
});

// 13. BASILICO — homing basil leaves
def({
  id: 'basilico',
  name: 'Basilico',
  desc: 'Fresh basil leaves flutter after the nearest crimes.',
  icon: 'icon.w.basilico',
  maxLevel: 8,
  sfx: 'w_basilico',
  base: S({ damage: 9, cooldown: 1.25, speed: 1, amount: 2, pierce: 1, interval: 0.07, knockback: 0.4 }),
  levels: [
    L('+1 leaf.', { amount: 1 }),
    L('+4 damage.', { damage: 4 }),
    L('+1 leaf.', { amount: 1 }),
    L('Flies 20% faster.', { speed: 0.2 }),
    L('+1 leaf.', { amount: 1 }),
    L('+5 damage.', { damage: 5 }),
    L('+2 leaves.', { amount: 2 }),
  ],
  evolve: { passive: 'profumo', into: 'pesto' },
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, (i) => {
      const a = (i / Math.max(1, s.amount)) * TAU + run.time * 2;
      const p = baseProj(run, w, s, 'proj.basilico');
      p.kind = 'homing';
      p.speed = 300 * s.speed;
      p.vx = Math.cos(a) * p.speed * 0.6;
      p.vy = Math.sin(a) * p.speed * 0.6;
      p.turn = 5.5;
      p.r = 7;
      p.life = p.max = 2.4;
      p.data = Math.random() * TAU; // flutter phase
    });
    run.sfx('w_basilico', { volume: 0.55 });
  },
});

def({
  id: 'pesto',
  name: 'Pesto Genovese',
  desc: 'Basil leaves burst into sticky pesto that slows and stings.',
  icon: 'icon.e.pesto',
  maxLevel: 1,
  evolution: true,
  from: 'basilico',
  sfx: 'w_basilico',
  base: S({ damage: 17, cooldown: 1.0, speed: 1.15, amount: 5, pierce: 1, interval: 0.05, knockback: 0.4, area: 1 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    volley(run, w, s.amount, s.interval, (i) => {
      const a = (i / Math.max(1, s.amount)) * TAU + run.time * 2;
      const p = baseProj(run, w, s, 'proj.basilico');
      p.kind = 'homing';
      p.speed = 330 * s.speed;
      p.vx = Math.cos(a) * p.speed * 0.6;
      p.vy = Math.sin(a) * p.speed * 0.6;
      p.turn = 6;
      p.r = 8;
      p.scale = 1.25;
      p.glow = '#7dff8a';
      p.life = p.max = 2.4;
      p.data = Math.random() * TAU;
      p.onHit = (pp, e) => {
        run.addArea('pesto', e.x, e.y, 34 * s.area, 2.2, { damage: s.damage * 0.3, tick: 0.5, weapon: w, slow: 0.45 });
        void pp;
      };
    });
    run.sfx('w_basilico', { volume: 0.6, pitch: 1.1 });
  },
});

// 14. FORNO — oven heat aura
def({
  id: 'forno',
  name: 'Forno',
  desc: 'The heat of a wood-fired oven radiates around you.',
  icon: 'icon.w.forno',
  maxLevel: 8,
  sfx: 'w_forno',
  base: S({ damage: 6, cooldown: 0.55, area: 1, pierce: Infinity, knockback: 0.25 }),
  levels: [
    L('+20% radius, +1 damage.', { area: 0.2, damage: 1 }),
    L('Burns 15% more often.', { cooldown: -0.08 }),
    L('+20% radius, +1 damage.', { area: 0.2, damage: 1 }),
    L('+2 damage.', { damage: 2 }),
    L('+20% radius.', { area: 0.2 }),
    L('Burns faster, +1 damage.', { cooldown: -0.07, damage: 1 }),
    L('+20% radius, +2 damage.', { area: 0.2, damage: 2 }),
  ],
  evolve: { passive: 'ricettario', into: 'forno_legna' },
  fire(run, w) {
    const s = w.stats(run);
    run.auraPulse(w, 64 * s.area, s.damage, s.knockback, 0.12, 0);
  },
});

def({
  id: 'forno_legna',
  name: 'Forno a Legna',
  desc: 'A roaring wood-fired blaze. Sets crimes on fire.',
  icon: 'icon.e.forno_legna',
  maxLevel: 1,
  evolution: true,
  from: 'forno',
  sfx: 'w_forno',
  base: S({ damage: 13, cooldown: 0.4, area: 2.1, pierce: Infinity, knockback: 0.4 }),
  levels: [],
  fire(run, w) {
    const s = w.stats(run);
    run.auraPulse(w, 64 * s.area, s.damage, s.knockback, 0.18, s.damage * 0.6);
  },
});

/** Configure a projectile to be lobbed to (tx,ty) over `time` seconds. */
export function lob(p: Projectile, tx: number, ty: number, time: number) {
  p.kind = 'lob';
  p.ox = p.x;
  p.oy = p.y;
  p.tx = tx;
  p.ty = ty;
  p.life = p.max = time;
  p.r = 0;
  p.pierce = 0;
}

export const BASE_WEAPON_IDS = Object.values(WEAPONS)
  .filter((w) => !w.evolution)
  .map((w) => w.id);

export function enemyAlive(e: Enemy | null): e is Enemy {
  return !!e && e.alive;
}
