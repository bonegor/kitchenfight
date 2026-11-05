/**
 * RUN — one play session on a stage: simulation of player, enemies,
 * projectiles, pickups, areas, level-ups and chests.
 */
import { Enemy, Projectile, EnemyShot, Pickup, Area, PickupKind, AreaKind, newId } from './entities';
import { SpatialHash } from '../core/spatial';
import { FX } from './fx';
import { World, PropInst } from './world';
import { Stats, baseStats, StatMod, CharacterDef, WeaponStats } from './types';
import { WEAPONS, WeaponInstance, BASE_WEAPON_IDS } from './weapons';
import { PASSIVES, POWERUPS } from './passives';
import { ENEMIES, EnemyDef } from './enemies';
import { updateEnemy, onEnemyDeath } from './ai';
import { Director } from './director';
import type { StageDef } from './stages';
import { STAGE_ENVS } from '../gfx/stageenv';
import { RNG, TAU, clamp } from '../core/math';
import { audio, SfxId, SfxOpts } from '../audio/audio';
import type { SaveData } from '../core/save';
import { hasSprite } from '../gfx/sprites';

export type RunState = 'playing' | 'levelup' | 'chest' | 'paused' | 'dying' | 'dead' | 'victory';

export interface Choice {
  type: 'weapon' | 'passive' | 'coins' | 'heal';
  id: string;
  level: number; // the level it will become
  isNew: boolean;
}

export interface ChestReward {
  kind: 'upgrade' | 'evolution' | 'coins';
  id: string; // weapon/passive id or evolution id
  from?: string;
  level?: number;
  amount?: number;
}

export interface RunHooks {
  onLevelUp(): void;
  onChest(rewards: ChestReward[], gold: boolean): void;
  onBoss(e: Enemy, final: boolean): void;
  onBossDefeated(e: Enemy, final: boolean): void;
  onGameOver(): void;
  onVictory(): void;
  onRevive(): void;
  onToast(text: string, kind?: 'info' | 'warn' | 'good'): void;
}

export class Player {
  x = 0;
  y = 0;
  r = 14;
  vx = 0;
  vy = 0;
  dirX = 1;
  dirY = 0;
  face = 1;
  hp = 100;
  iframes = 0;
  hurtT = 0;
  anim = 0;
  moving = false;
  slowT = 0;
  slowAmt = 0;
  healT = 0;
  qs = 0;
}

interface Timed {
  t: number;
  fn: () => void;
}

const tmpE: Enemy[] = [];
const tmpE2: Enemy[] = [];
const tmpP: PropInst[] = [];

export class Run {
  readonly stage: StageDef;
  readonly char: CharacterDef;
  readonly world: World;
  readonly fx = new FX();
  readonly rng = new RNG();
  readonly player = new Player();
  readonly director: Director;
  readonly grid = new SpatialHash<Enemy>(72);

  state: RunState = 'playing';
  time = 0; // run clock (seconds)
  realTime = 0;
  stats: Stats = baseStats();
  level = 1;
  xp = 0;
  xpNext = 5;
  pendingLevels = 0;
  kills = 0;
  coins = 0;
  killsBy: Record<string, number> = {};
  weapons: WeaponInstance[] = [];
  passives: { id: string; level: number }[] = [];
  banished = new Set<string>();
  rerolls = 0;
  skips = 0;
  banishes = 0;
  revivals = 0;
  maxWeapons = 6;
  maxPassives = 6;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  shots: EnemyShot[] = [];
  pickups: Pickup[] = [];
  areas: Area[] = [];
  bosses: Enemy[] = [];
  freezeT = 0;
  slowMo = 0; // seconds of slow motion remaining
  timeScale = 1;
  hitStop = 0;
  view = { x0: -600, y0: -400, x1: 600, y1: 400 };
  camX = 0;
  camY = 0;
  finalBossDefeated = false;
  victoryT = 0;
  deathT = 0;
  xpCombo = 0;
  xpComboT = 0;
  lowHpT = 0;
  darkness = 0;
  stageClear = false;
  evolutionsDone: string[] = [];
  chestQueue: { gold: boolean }[] = [];
  damageTaken = 0;
  healed = 0;
  bestCombo = 0;

  private enemyPool: Enemy[] = [];
  private projPool: Projectile[] = [];
  private shotPool: EnemyShot[] = [];
  private pickupPool: Pickup[] = [];
  private areaPool: Area[] = [];
  private timers: Timed[] = [];

  constructor(stage: StageDef, char: CharacterDef, public save: SaveData, public hooks: RunHooks) {
    this.stage = stage;
    this.char = char;
    const env = STAGE_ENVS[stage.env] ?? Object.values(STAGE_ENVS)[0];
    this.world = new World(env, this.rng.int(0, 1000));
    this.director = new Director(this, stage);
    this.player.r = char.radius;
    // permanent power-ups
    for (const p of POWERUPS) {
      const rank = save.powerups[p.id] ?? 0;
      if (p.special === 'reroll') this.rerolls += rank * 2;
      if (p.special === 'skip') this.skips += rank * 2;
      if (p.special === 'banish') this.banishes += rank;
    }
    this.recomputeStats();
    this.player.hp = this.stats.maxHp;
    this.revivals = this.stats.revival;
    this.addWeapon(char.weapon);
    const s = this.settings();
    this.fx.shakeEnabled = s.shake;
    this.fx.flashesEnabled = s.flashes;
    this.fx.numbersEnabled = s.damageNumbers;
    this.fx.bubblesEnabled = s.bubbles;
  }

  settings() {
    return this.save.settings;
  }

  // ======================================================================
  // stats & inventory
  // ======================================================================

  recomputeStats() {
    const st = baseStats();
    const apply = (m: StatMod, times = 1) => {
      for (let i = 0; i < times; i++) {
        if (m.add !== undefined) (st as any)[m.stat] += m.add;
        if (m.mul !== undefined) (st as any)[m.stat] *= m.mul;
      }
    };
    for (const m of this.char.mods) apply(m);
    for (const p of POWERUPS) {
      const rank = this.save.powerups[p.id] ?? 0;
      for (const m of p.mods) apply(m, rank);
    }
    for (const pa of this.passives) {
      const d = PASSIVES[pa.id];
      for (const m of d.mods) apply(m, pa.level);
    }
    st.cooldown = Math.max(0.35, st.cooldown);
    st.moveSpeed = Math.max(0.4, st.moveSpeed);
    const oldMax = this.stats.maxHp;
    this.stats = st;
    if (this.player.hp > 0 && st.maxHp > oldMax) this.player.hp += st.maxHp - oldMax;
    this.player.hp = Math.min(this.player.hp, st.maxHp);
  }

  hasWeapon(id: string) {
    return this.weapons.find((w) => w.def.id === id);
  }
  passiveLevel(id: string) {
    return this.passives.find((p) => p.id === id)?.level ?? 0;
  }

  addWeapon(id: string) {
    const def = WEAPONS[id];
    if (!def) return;
    const w = new WeaponInstance(def, this.weapons.length);
    w.acquired = this.time;
    w.cd = 0.3;
    this.weapons.push(w);
    this.markSeen('w:' + id);
  }

  markSeen(key: string) {
    if (!this.save.seen.includes(key)) this.save.seen.push(key);
  }

  // ======================================================================
  // pools
  // ======================================================================

  spawnProj(): Projectile {
    const p = this.projPool.pop() ?? new Projectile();
    p.reset();
    this.projectiles.push(p);
    return p;
  }

  spawnShot(): EnemyShot {
    const s = this.shotPool.pop() ?? new EnemyShot();
    s.alive = true;
    s.z = 0;
    s.vz = 0;
    s.gravity = 0;
    s.rot = 0;
    s.spin = 0;
    s.scale = 1;
    s.onLand = null;
    this.shots.push(s);
    return s;
  }

  addArea(kind: AreaKind, x: number, y: number, r: number, life: number, o: { damage?: number; tick?: number; weapon?: WeaponInstance | null; slow?: number; enemy?: boolean; burn?: number; onEnd?: (a: Area) => void } = {}): Area {
    const a = this.areaPool.pop() ?? new Area();
    a.alive = true;
    a.kind = kind;
    a.x = x;
    a.y = y;
    a.r = r;
    a.life = a.max = life;
    a.damage = o.damage ?? 0;
    a.tick = o.tick ?? 0.5;
    a.tickT = 0;
    a.slow = o.slow ?? 0;
    a.enemy = o.enemy ?? false;
    a.weapon = o.weapon ?? null;
    a.onEnd = o.onEnd ?? null;
    a.frame = this.rng.int(0, 3);
    a.rot = this.rng.next() * TAU;
    (a as any).burn = o.burn ?? 0;
    this.areas.push(a);
    return a;
  }

  spawnEnemy(def: EnemyDef, x: number, y: number, o: { elite?: boolean; boss?: boolean; hpMul?: number } = {}): Enemy {
    const e = this.enemyPool.pop() ?? new Enemy();
    e.id = newId();
    e.def = def;
    e.alive = true;
    e.x = x;
    e.y = y;
    e.elite = !!o.elite;
    e.boss = !!o.boss || !!def.boss;
    e.scale = (def.scale ?? 1) * (e.elite ? 1.45 : 1);
    e.r = def.radius * (e.elite ? 1.45 : 1);
    const hpScale = this.director.hpScale() * (o.hpMul ?? 1) * this.stats.curse;
    e.maxHp = e.hp = def.hp * hpScale * (e.elite ? 14 : 1);
    e.speed = def.speed * (e.elite ? 0.9 : 1) * (0.92 + this.rng.next() * 0.16);
    e.damage = def.damage * (e.elite ? 1.5 : 1) * this.director.dmgScale();
    e.xp = def.xp;
    e.kx = e.ky = e.vx = e.vy = 0;
    e.face = 1;
    e.anim = this.rng.next() * 4;
    e.flash = e.squash = e.slow = e.slowAmt = e.freeze = e.burn = e.burnDps = e.burnTick = e.stun = 0;
    e.state = 0;
    e.timer = this.rng.next() * 1.5;
    e.aux = 0;
    e.ax = e.ay = 0;
    e.spawnT = 0.35;
    e.layers = def.layers ?? 0;
    e.z = 0;
    e.contactCD = 0;
    e.bossPhase = 0;
    e.bossT = 0;
    e.bossAttack = '';
    e.attackPose = 0;
    e.telegraph = 0;
    e.buff = 0;
    e.slamR = 0;
    e.bossStep = 0;
    e.leapT = 0;
    e.leapDur = 0;
    e.onLand = null;
    e.lastHit = {};
    this.enemies.push(e);
    if (e.boss) this.bosses.push(e);
    this.markSeen('e:' + def.id);
    return e;
  }

  dropPickup(kind: PickupKind, x: number, y: number, value = 1, pop = true): Pickup | null {
    if (kind === 'xp' && this.pickups.length > 420) {
      // merge into the nearest XP gem to keep things fast
      let best: Pickup | null = null;
      let bd = 1e12;
      for (const p of this.pickups) {
        if (p.kind !== 'xp' || p.magnet) continue;
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      if (best) {
        best.value += value;
        best.sprite = this.xpSprite(best.value);
        return best;
      }
    }
    const p = this.pickupPool.pop() ?? new Pickup();
    p.alive = true;
    p.kind = kind;
    p.value = value;
    p.x = x;
    p.y = y;
    p.t = 0;
    p.magnet = false;
    p.speed = 0;
    p.gold = false;
    p.frame = 0;
    if (pop) {
      const a = this.rng.next() * TAU;
      const sp = 20 + this.rng.next() * 50;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp * 0.6;
      p.z = 0;
      p.vz = 120 + this.rng.next() * 80;
    } else {
      p.vx = p.vy = p.z = p.vz = 0;
    }
    switch (kind) {
      case 'xp': p.sprite = this.xpSprite(value); p.r = 8; break;
      case 'coin': p.sprite = 'pickup.coin'; p.r = 8; break;
      case 'coinbag': p.sprite = 'pickup.coinbag'; p.r = 10; break;
      case 'cannolo': p.sprite = 'pickup.cannolo'; p.r = 11; break;
      case 'lasagna': p.sprite = 'pickup.lasagna'; p.r = 12; break;
      case 'bell': p.sprite = 'pickup.bell'; p.r = 11; break;
      case 'spumante': p.sprite = 'pickup.spumante'; p.r = 12; break;
      case 'gelato': p.sprite = 'pickup.gelato'; p.r = 11; break;
      case 'chest': p.sprite = 'pickup.chest'; p.r = 16; break;
    }
    this.pickups.push(p);
    return p;
  }

  xpSprite(v: number) {
    return v >= 100 ? 'pickup.xp4' : v >= 25 ? 'pickup.xp3' : v >= 5 ? 'pickup.xp2' : 'pickup.xp1';
  }

  schedule(delay: number, fn: () => void) {
    this.timers.push({ t: this.time + delay, fn });
  }

  // ======================================================================
  // queries
  // ======================================================================

  nearestEnemy(x: number, y: number, maxD = 1e9, exclude?: Set<number>): Enemy | null {
    let best: Enemy | null = null;
    let bd = maxD * maxD;
    for (const e of this.enemies) {
      if (!e.alive || e.spawnT > 0.25 || (e.state === 1 && e.def.behavior === 'ghost')) continue;
      if (exclude && exclude.has(e.id)) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  onScreen(x: number, y: number, m = 0) {
    const v = this.view;
    return x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m;
  }

  randomEnemyOnScreen(): Enemy | null {
    const n = this.enemies.length;
    if (!n) return null;
    for (let tries = 0; tries < 12; tries++) {
      const e = this.enemies[this.rng.int(0, n - 1)];
      if (e.alive && this.onScreen(e.x, e.y, -20)) return e;
    }
    return this.nearestEnemy(this.player.x, this.player.y, 700);
  }

  randomEnemyNear(x: number, y: number, r: number): Enemy | null {
    this.grid.query(x, y, r, tmpE2);
    const alive = tmpE2.filter((e) => e.alive && (e.x - x) ** 2 + (e.y - y) ** 2 < r * r);
    if (!alive.length) return null;
    return alive[this.rng.int(0, alive.length - 1)];
  }

  /** Approximate the centre of the densest crowd near the player. */
  densestPoint(range: number): { x: number; y: number } {
    let best: { x: number; y: number } | null = null;
    let bestN = -1;
    for (let i = 0; i < 6; i++) {
      const e = this.randomEnemyNear(this.player.x, this.player.y, range);
      if (!e) continue;
      this.grid.query(e.x, e.y, 70, tmpE2);
      if (tmpE2.length > bestN) {
        bestN = tmpE2.length;
        best = { x: e.x, y: e.y };
      }
    }
    if (best) return best;
    const a = Math.atan2(this.player.dirY, this.player.dirX);
    return { x: this.player.x + Math.cos(a) * 160, y: this.player.y + Math.sin(a) * 160 };
  }

  enemiesIn(x: number, y: number, r: number, out: Enemy[]): Enemy[] {
    this.grid.query(x, y, r + 40, out);
    let n = 0;
    for (let i = 0; i < out.length; i++) {
      const e = out[i];
      if (!e.alive) continue;
      const rr = r + e.r;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 <= rr * rr) out[n++] = e;
    }
    out.length = n;
    return out;
  }

  // ======================================================================
  // combat
  // ======================================================================

  sfx(id: SfxId, o: SfxOpts = {}, x?: number) {
    if (this.muted) return;
    if (x !== undefined) {
      const cx = (this.view.x0 + this.view.x1) / 2;
      const hw = (this.view.x1 - this.view.x0) / 2;
      o.pan = clamp((x - cx) / hw, -1, 1) * 0.6;
    }
    audio.sfx(id, o);
  }

  /** Apply damage to an enemy from a weapon. Returns true if it died. */
  hitEnemy(e: Enemy, base: number, w: WeaponInstance | null, kx: number, ky: number, o: { knock?: number; crit?: number; critMul?: number; noNumber?: boolean; silent?: boolean } = {}): boolean {
    if (!e.alive) return false;
    let dmg = base * (0.92 + this.rng.next() * 0.16);
    let crit = false;
    if (o.crit && this.rng.next() < o.crit) {
      crit = true;
      dmg *= o.critMul ?? 2;
    }
    // onion layers absorb part of each hit
    if (e.layers > 0) {
      dmg *= 0.55;
    }
    e.hp -= dmg;
    e.flash = 0.11;
    e.squash = 1;
    if (w) w.damageDealt += Math.min(dmg, e.hp + dmg);
    const knock = (o.knock ?? 1) * (e.boss ? 0.08 : 1 - (e.def.knockResist ?? 0)) * (e.elite ? 0.35 : 1);
    if (knock > 0 && (kx || ky)) {
      const l = Math.hypot(kx, ky) || 1;
      e.kx += (kx / l) * 210 * knock;
      e.ky += (ky / l) * 210 * knock;
    }
    this.lastCrit = crit;
    if (!o.noNumber) this.fx.number(e.x, e.y - e.r - 6, dmg, crit);
    if (!o.silent) this.sfx(crit ? 'hit_crit' : 'hit', { volume: 0.55 }, e.x);
    // onion layer peel
    if (e.layers > 0 && e.hp < e.maxHp * (e.layers / ((e.def.layers ?? 1) + 1))) {
      e.layers--;
      this.fx.burst(e.x, e.y, 6, { color: '#e8d5f0', speed: 160, size: 3, life: 0.5 });
      e.speed *= 1.12;
    }
    if (e.hp <= 0) {
      this.killEnemy(e, w);
      return true;
    }
    return false;
  }

  killEnemy(e: Enemy, w: WeaponInstance | null) {
    if (!e.alive) return;
    e.alive = false;
    this.kills++;
    if (this.kills === 100 || this.kills === 500 || this.kills === 1000 || this.kills === 2500 || this.kills === 5000 || this.kills === 10000) {
      this.hooks.onToast(`${this.kills.toLocaleString()} crimes stopped! ${['Bravo!', 'Bravissimo!', 'Fantastico!', 'Magnifico!', 'Leggendario!', 'Nonna is crying with joy!'][[100, 500, 1000, 2500, 5000, 10000].indexOf(this.kills)]}`, 'good');
    }
    if (e.elite || e.boss) this.hitStop = Math.max(this.hitStop, e.boss ? 0.12 : 0.05);
    this.killsBy[e.def.id] = (this.killsBy[e.def.id] ?? 0) + 1;
    if (w) w.kills++;
    const def = e.def;
    // death fx
    const big = e.boss || e.elite || e.r > 22;
    this.fx.decal(e.x, e.y + e.r * 0.4, 'fx.splat.' + (def.color ?? 'red'), this.rng.int(0, 3), (e.r / 16) * (big ? 1.2 : 0.8), 0.7, 22);
    this.fx.burst(e.x, e.y, big ? 16 : 7, { sprite: 'fx.chunk.' + (def.chunk ?? 'tomato'), frames: 4, speed: big ? 260 : 170, size: 1, life: 0.7, gravity: 600, up: 160, bounce: true, layer: 1, shrink: false, drag: 1.8 });
    this.fx.burst(e.x, e.y, big ? 10 : 4, { color: def.juice ?? '#d8322e', speed: 140, size: big ? 5 : 3.5, life: 0.45 });
    this.fx.sprite(e.x, e.y - e.r * 0.3, 'fx.puff', { life: 0.35, size: (e.r / 14) * 0.8, size1: (e.r / 14) * 1.5, alpha: 0.7 });
    this.sfx(big ? 'enemy_death_big' : 'enemy_death', { volume: big ? 0.9 : 0.5 }, e.x);
    // drops
    const xp = e.xp * (e.elite ? 12 : 1);
    if (xp > 0) this.dropPickup('xp', e.x, e.y, xp);
    const luck = this.stats.luck;
    if (e.elite || e.boss) {
      this.dropPickup('chest', e.x, e.y, 1);
      const last = this.pickups[this.pickups.length - 1];
      if (last && last.kind === 'chest') last.gold = e.boss;
      this.dropPickup('coinbag', e.x + 14, e.y, 1);
      if (e.elite) this.dropPickup('cannolo', e.x - 14, e.y, 1);
      this.fx.shake(e.boss ? 0.6 : 0.25);
    } else {
      const r = this.rng.next();
      if (r < 0.012 * luck) this.dropPickup('coin', e.x, e.y, 1);
      else if (r < 0.0155 * luck) this.dropPickup('cannolo', e.x, e.y, 1);
    }
    onEnemyDeath(this, e);
    if (e.boss) this.bossDefeated(e);
  }

  bossDefeated(e: Enemy) {
    this.bosses = this.bosses.filter((b) => b !== e);
    const final = !!e.def.boss?.final && this.stage.finalBoss === e.def.id;
    this.fx.screenFlash(0.8);
    this.fx.shake(0.9);
    this.slowMo = 1.2;
    for (let i = 0; i < 4; i++) {
      this.schedule(i * 0.18, () => {
        const a = this.rng.next() * TAU;
        const d = this.rng.next() * e.r;
        this.fx.ring(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 10, e.r * 1.6, 0.5, '#ffd34d', 6);
        this.fx.burst(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 18, { colors: ['#ffd34d', '#ff7b2e', '#ffffff'], speed: 320, size: 4, life: 0.7, additive: true });
      });
    }
    this.fx.burst(e.x, e.y, 40, { sprite: 'fx.confetti', frames: 6, speed: 420, size: 1, life: 2, gravity: 400, up: 300, layer: 1, shrink: false, drag: 1.2, spin: 14 });
    for (let i = 0; i < 10; i++) this.dropPickup('xp', e.x + this.rng.range(-40, 40), e.y + this.rng.range(-30, 30), 25);
    for (let i = 0; i < 6; i++) this.dropPickup('coin', e.x + this.rng.range(-40, 40), e.y + this.rng.range(-30, 30), 1);
    this.sfx('boss_death');
    this.hooks.onBossDefeated(e, final);
    if (final) {
      this.finalBossDefeated = true;
      this.victoryT = 4.2;
    }
  }

  private sayT = 0;
  /** Chef exclamation: speech bubble + voice babble (rate limited). */
  say(lines: string[], force = false, color = '#fff3d6') {
    if (!force && this.realTime < this.sayT) return;
    this.sayT = this.realTime + 5;
    const text = lines[Math.floor(this.rng.next() * lines.length)];
    this.fx.bubble(this.player, text, -78, color, 1.7, true);
    if (this.fx.bubblesEnabled && !this.muted) audio.voice(text, this.char.voice);
  }

  heal(amount: number) {
    const p = this.player;
    const before = p.hp;
    p.hp = Math.min(this.stats.maxHp, p.hp + amount);
    this.healed += p.hp - before;
    if (p.hp - before >= 5) {
      this.fx.text(p.x, p.y - 50, '+' + Math.round(p.hp - before), '#7dff8a', 15);
      this.fx.burst(p.x, p.y - 20, 8, { sprite: 'fx.heart', speed: 70, size: 1, life: 0.9, up: 0, drag: 1 });
    }
  }

  dmgBy: Record<string, number> = {};
  /** silent run (title-screen demo / headless sims): no sfx, voices or music changes */
  muted = false;
  /** whether the last hitEnemy() call was a critical hit */
  lastCrit = false;

  hurtPlayer(dmg: number, sx: number, sy: number, src = '?') {
    const p = this.player;
    if (p.iframes > 0 || this.state !== 'playing' || p.hp <= 0 || this.finalBossDefeated) return;
    const d = Math.max(1, dmg - this.stats.armor);
    p.hp -= d;
    this.damageTaken += d;
    this.dmgBy[src] = (this.dmgBy[src] ?? 0) + d;
    p.iframes = 0.5;
    p.hurtT = 0.3;
    this.fx.hurt = Math.min(1, this.fx.hurt + 0.35 + d / 40);
    this.fx.shake(0.18 + Math.min(0.3, d / 60));
    this.fx.number(p.x, p.y - 40, d, false, '#ff5a4f');
    this.sfx('player_hurt', { volume: 0.8 });
    if (p.hp < this.stats.maxHp * 0.3 && this.rng.next() < 0.3) this.say(['Aiuto!', 'Mannaggia!', 'Ahia!', 'Porca miseria!'], false, '#ffd0c8');
    else if (this.rng.next() < 0.06) this.say(['Che schifo!', 'Vergogna!', 'Ma che fai?!', 'Non si fa!'], false, '#ffd0c8');
    // push nearby enemies back a little so you can escape
    const dx = p.x - sx, dy = p.y - sy;
    const l = Math.hypot(dx, dy) || 1;
    p.vx += (dx / l) * 80;
    p.vy += (dy / l) * 80;
    if (p.hp <= 0) this.playerDown();
  }

  playerDown() {
    const p = this.player;
    if (this.revivals > 0) {
      this.revivals--;
      p.hp = this.stats.maxHp * 0.5;
      p.iframes = 2.5;
      this.fx.screenFlash(1, '#fff7d6');
      this.fx.ring(p.x, p.y, 10, 260, 0.8, '#ffd34d', 10);
      this.fx.bubble(p, 'BIS!', -78, '#fff3b0', 1.6, true);
      // blast enemies away
      this.enemiesIn(p.x, p.y, 220, tmpE);
      for (const e of tmpE) this.hitEnemy(e, 60, null, e.x - p.x, e.y - p.y, { knock: 3, silent: true });
      this.sfx('player_revive');
      this.hooks.onRevive();
      return;
    }
    p.hp = 0;
    this.state = 'dying';
    this.deathT = 2.2;
    this.slowMo = 2;
    this.fx.screenFlash(0.6, '#ff3b3b');
    this.sfx('player_death');
    if (!this.muted) audio.stopMusic(1.5);
    this.fx.bubble(p, 'MAMMA MIA!', -78, '#ffd0c8', 2.5, true);
  }

  /** Area damage with fx. */
  explode(x: number, y: number, r: number, dmg: number, w: WeaponInstance | null, o: { color?: string; knock?: number; sfx?: SfxId; shake?: number; burn?: number } = {}) {
    this.enemiesIn(x, y, r, tmpE);
    for (const e of tmpE) this.hitEnemy(e, dmg, w, e.x - x, e.y - y, { knock: o.knock ?? 1.5, silent: true });
    this.breakProps(x, y, r, 2);
    const c = o.color ?? 'fire';
    if (c === 'coffee') {
      this.fx.sprite(x, y - 6, 'fx.coffee_cloud', { life: 0.5, size: r / 36, size1: r / 30, alpha: 0.95, fps: 8 });
      this.fx.burst(x, y, 14, { colors: ['#6b3f22', '#a8714a', '#f3e2c4'], speed: 260, size: 5, life: 0.6 });
      this.fx.ring(x, y, r * 0.4, r * 1.15, 0.35, '#f3e2c4', 5, false);
    } else if (c === 'cheese') {
      this.fx.burst(x, y, 16, { colors: ['#ffe28a', '#ffd34d', '#ffffff', '#e8442f'], speed: 280, size: 5, life: 0.6 });
      this.fx.ring(x, y, r * 0.3, r * 1.1, 0.35, '#ffe9a6', 6);
      this.fx.decal(x, y, 'fx.splat.yellow', this.rng.int(0, 3), r / 30, 0.6, 10);
    } else {
      this.fx.burst(x, y, 18, { colors: ['#ffd34d', '#ff7b2e', '#ff3d1f'], speed: 300, size: 5, life: 0.55, additive: true });
      this.fx.ring(x, y, r * 0.3, r * 1.15, 0.4, '#ff9b3d', 7);
      this.fx.sprite(x, y - 6, 'fx.puff', { life: 0.5, size: r / 24, size1: r / 16, alpha: 0.6 });
    }
    if (o.shake) this.fx.shake(o.shake);
    if (o.sfx) this.sfx(o.sfx, { volume: 0.8 }, x);
  }

  /** Delayed strike (Vesuvio). */
  strike(w: WeaponInstance, x: number, y: number, r: number, dmg: number, sprite: string, delay: number, fire: boolean) {
    const warn = this.addArea('warning', x, y, r, delay, {});
    warn.onEnd = () => {
      this.explode(x, y, r, dmg, w, { color: 'fire', knock: 1.6, sfx: 'w_vesuvio', shake: 0.08 });
      this.fx.decal(x, y, 'fx.lava_crater', this.rng.int(0, 1), r / 28, 0.8, 8);
      if (fire) this.addArea('fire', x, y, r * 0.8, 2.5, { damage: dmg * 0.18, tick: 0.4, weapon: w, burn: dmg * 0.1 });
    };
    // falling rock visual
    const p = this.spawnProj();
    p.kind = 'rain';
    p.weapon = w;
    p.sprite = sprite;
    p.x = p.tx = x;
    p.y = p.ty = y;
    p.z = 600;
    p.vz = -600 / delay;
    p.life = p.max = delay;
    p.r = 0;
    p.pierce = 0;
    p.faceVel = false;
    if (sprite === 'proj.meteor') {
      p.rot = Math.PI * 0.62; // falling, tail up-left
      p.spin = 0;
    } else p.spin = 4;
    p.glow = '#ff7b2e';
  }

  /** Spaghetti chain lash. */
  chainLash(w: WeaponInstance, s: WeaponStats, range: number, hop: number, count: number, color: string) {
    const p0 = this.player;
    let from = { x: p0.x, y: p0.y - 14 };
    const hit = new Set<number>();
    const pts: { x: number; y: number }[] = [from];
    for (let i = 0; i < count; i++) {
      const e = this.nearestEnemy(from.x, from.y, i === 0 ? range : hop, hit);
      if (!e) break;
      hit.add(e.id);
      pts.push({ x: e.x, y: e.y - e.r * 0.4 });
      const ex = e.x, ey = e.y;
      this.hitEnemy(e, s.damage, w, ex - from.x, ey - from.y, { knock: s.knockback, silent: i > 0 });
      from = { x: ex, y: ey };
    }
    if (pts.length > 1) {
      const p = this.spawnProj();
      p.kind = 'straight';
      p.weapon = w;
      p.sprite = '';
      p.r = 0;
      p.pierce = 0;
      p.life = p.max = 0.32;
      p.data = { pts, color, seed: this.rng.next() * 100 };
      p.faceVel = false;
      p.draw = drawLash;
      this.sfx('w_spaghetti', { volume: 0.7 });
    }
  }

  /** Heat aura pulse around the player (Forno). */
  auraPulse(w: WeaponInstance, r: number, dmg: number, knock: number, slow: number, burn: number) {
    const p = this.player;
    w.state.r = r;
    w.state.pulse = 1;
    this.enemiesIn(p.x, p.y, r, tmpE);
    for (const e of tmpE) {
      this.hitEnemy(e, dmg, w, e.x - p.x, e.y - p.y, { knock, silent: true });
      if (slow) {
        e.slow = Math.max(e.slow, 0.6);
        e.slowAmt = Math.max(e.slowAmt, slow);
      }
      if (burn) {
        e.burn = 2.5;
        e.burnDps = Math.max(e.burnDps, burn);
      }
    }
    if (tmpE.length) this.sfx('w_forno', { volume: 0.25 });
    this.breakProps(p.x, p.y, r, 1);
  }

  breakProps(x: number, y: number, r: number, dmg: number) {
    this.world.breakablesNear(x, y, r, tmpP);
    for (const pr of tmpP) {
      pr.hp -= dmg;
      pr.hitFlash = 0.1;
      pr.shake = 1;
      if (pr.hp <= 0) this.breakProp(pr);
    }
  }

  breakProp(pr: PropInst) {
    this.world.destroy(pr);
    const deb = pr.breakable?.debris ?? 'wood';
    this.fx.burst(pr.x, pr.y - 16, 14, { sprite: 'fx.chunk.' + deb, frames: 4, speed: 220, size: 1, life: 0.9, gravity: 650, up: 200, bounce: true, shrink: false, drag: 1.5 });
    if (deb === 'flour') this.fx.burst(pr.x, pr.y - 12, 16, { color: '#fffaf0', speed: 120, size: 7, life: 0.9, drag: 2 });
    this.fx.sprite(pr.x, pr.y - 18, 'fx.puff', { life: 0.45, size: 1, size1: 1.8, alpha: 0.8 });
    this.sfx('prop_break', { volume: 0.8 }, pr.x);
    const r = this.rng.next() / Math.max(0.5, this.stats.luck * 0.9);
    let kind: PickupKind = 'coin';
    if (r < 0.05) kind = 'spumante';
    else if (r < 0.1) kind = 'gelato';
    else if (r < 0.17) kind = 'bell';
    else if (r < 0.22) kind = 'lasagna';
    else if (r < 0.38) kind = 'cannolo';
    else if (r < 0.46) kind = 'coinbag';
    else if (r < 0.66) kind = 'xp';
    this.dropPickup(kind, pr.x, pr.y - 8, kind === 'xp' ? 25 : 1);
  }

  // ======================================================================
  // XP & level up
  // ======================================================================

  static xpFor(level: number) {
    if (level < 20) return 5 + (level - 1) * 9;
    if (level < 40) return 195 + (level - 20) * 13 + (level === 20 ? 600 : 0);
    return 455 + (level - 40) * 16 + (level === 40 ? 2400 : 0);
  }

  gainXp(v: number) {
    this.xp += v * this.stats.growth;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Run.xpFor(this.level);
      this.pendingLevels++;
    }
  }

  /** Build level-up choices. */
  rollChoices(n: number): Choice[] {
    const pool: { c: Choice; weight: number }[] = [];
    for (const w of this.weapons) {
      if (w.def.evolution || w.level >= w.def.maxLevel || this.banished.has(w.def.id)) continue;
      pool.push({ c: { type: 'weapon', id: w.def.id, level: w.level + 1, isNew: false }, weight: 10 });
    }
    for (const p of this.passives) {
      const d = PASSIVES[p.id];
      if (p.level >= d.maxLevel || this.banished.has(p.id)) continue;
      pool.push({ c: { type: 'passive', id: p.id, level: p.level + 1, isNew: false }, weight: 8 });
    }
    if (this.weapons.length < this.maxWeapons) {
      for (const id of BASE_WEAPON_IDS) {
        if (this.banished.has(id)) continue;
        if (this.weapons.some((w) => w.def.id === id || w.def.from === id)) continue;
        pool.push({ c: { type: 'weapon', id, level: 1, isNew: true }, weight: 7 });
      }
    }
    if (this.passives.length < this.maxPassives) {
      for (const id of Object.keys(PASSIVES)) {
        if (this.banished.has(id)) continue;
        if (this.passives.some((p) => p.id === id)) continue;
        // favour passives that evolve something we own
        const evolves = this.weapons.some((w) => w.def.evolve?.passive === id);
        pool.push({ c: { type: 'passive', id, level: 1, isNew: true }, weight: evolves ? 9 : 6 });
      }
    }
    const out: Choice[] = [];
    const items = pool.map((p) => ({ ...p }));
    while (out.length < n && items.length) {
      const pick = this.rng.weighted(items)!;
      out.push(pick.c);
      items.splice(items.indexOf(pick), 1);
    }
    if (!out.length) {
      out.push({ type: 'coins', id: 'coins', level: 0, isNew: false });
      out.push({ type: 'heal', id: 'heal', level: 0, isNew: false });
    }
    return out;
  }

  choiceCount() {
    // luck gives a chance for a 4th option
    const p = Math.min(0.9, (this.stats.luck - 1) * 1.5 + 0.1);
    return this.rng.next() < p ? 4 : 3;
  }

  applyChoice(c: Choice) {
    if (c.type === 'weapon') {
      const w = this.hasWeapon(c.id);
      if (w) w.level = Math.min(w.def.maxLevel, w.level + 1);
      else {
        this.addWeapon(c.id);
        this.sfx('new_weapon');
      }
    } else if (c.type === 'passive') {
      const p = this.passives.find((q) => q.id === c.id);
      if (p) p.level++;
      else {
        this.passives.push({ id: c.id, level: 1 });
        this.markSeen('p:' + c.id);
      }
      this.recomputeStats();
    } else if (c.type === 'coins') {
      this.addCoins(25);
    } else if (c.type === 'heal') {
      this.heal(30);
    }
  }

  finishLevelUp() {
    this.pendingLevels = Math.max(0, this.pendingLevels - 1);
    if (this.pendingLevels <= 0 && this.state === 'levelup') this.state = 'playing';
  }

  private coinFrac = 0;
  /** Credit coins with Greed applied (fractions carry over). Returns the coins credited. */
  addCoins(n: number): number {
    this.coinFrac += n * this.stats.greed;
    const v = Math.floor(this.coinFrac + 1e-9);
    this.coinFrac -= v;
    this.coins += v;
    return v;
  }
  /** How many coins addCoins(n) would credit right now (for labels). */
  coinsFor(n: number): number {
    return Math.floor(this.coinFrac + n * this.stats.greed + 1e-9);
  }

  // ======================================================================
  // chests
  // ======================================================================

  evolvable(): WeaponInstance[] {
    return this.weapons.filter((w) => {
      const ev = w.def.evolve;
      if (!ev || w.level < w.def.maxLevel) return false;
      return this.passiveLevel(ev.passive) > 0 && !!WEAPONS[ev.into];
    });
  }

  openChest(gold: boolean): ChestReward[] {
    const out: ChestReward[] = [];
    const evo = this.evolvable();
    if (evo.length) {
      const w = evo[0];
      const into = w.def.evolve!.into;
      out.push({ kind: 'evolution', id: into, from: w.def.id });
      this.evolveWeapon(w, into);
    }
    const luck = this.stats.luck;
    let count = 1;
    const r = this.rng.next();
    if (gold) count = r < 0.35 * luck ? 5 : 3;
    else count = r < 0.06 * luck ? 5 : r < 0.25 * luck ? 3 : 1;
    if (out.length) count = Math.max(0, count - 1);
    for (let i = 0; i < count; i++) {
      const ups: ChestReward[] = [];
      for (const w of this.weapons) if (!w.def.evolution && w.level < w.def.maxLevel) ups.push({ kind: 'upgrade', id: w.def.id, level: w.level + 1 });
      for (const p of this.passives) if (p.level < PASSIVES[p.id].maxLevel) ups.push({ kind: 'upgrade', id: p.id, level: p.level + 1 });
      if (!ups.length) {
        out.push({ kind: 'coins', id: 'coins', amount: this.addCoins(50) });
        continue;
      }
      const u = ups[this.rng.int(0, ups.length - 1)];
      const w = this.hasWeapon(u.id);
      if (w) w.level++;
      else {
        const p = this.passives.find((q) => q.id === u.id);
        if (p) p.level++;
        this.recomputeStats();
      }
      out.push(u);
    }
    const bonus = gold ? 60 + this.rng.int(0, 60) : 10 + this.rng.int(0, 20);
    out.push({ kind: 'coins', id: 'coins', amount: this.addCoins(bonus) });
    return out;
  }

  evolveWeapon(w: WeaponInstance, into: string) {
    const def = WEAPONS[into];
    for (const p of this.projectiles) if (p.weapon === w) p.alive = false;
    w.def = def;
    w.level = 1;
    w.cd = 0.2;
    w.state = {};
    this.evolutionsDone.push(into);
    this.markSeen('w:' + into);
    // celebrate in the world once the chest closes
    this.schedule(0.05, () => {
      const p = this.player;
      this.fx.ring(p.x, p.y, 10, 260, 0.9, '#ffd34d', 10);
      this.fx.ring(p.x, p.y, 10, 160, 0.6, '#ffffff', 6);
      this.fx.burst(p.x, p.y - 20, 40, { colors: ['#ffd34d', '#ffffff', '#ffb02e'], speed: 380, size: 4, life: 0.9, additive: true });
      this.fx.text(p.x, p.y - 90, def.name + '!', '#ffd34d', 20, 2);
      this.fx.screenFlash(0.5, '#fff1b8');
      this.fx.shake(0.3);
      this.slowMo = 0.6;
    });
  }

  // ======================================================================
  // UPDATE
  // ======================================================================

  update(rawDt: number) {
    this.realTime += rawDt;
    // slow motion & hit-stop
    if (this.slowMo > 0) {
      this.slowMo -= rawDt;
      this.timeScale = 0.3;
    } else this.timeScale = 1;
    let dt = rawDt * this.timeScale;
    if (this.hitStop > 0) {
      this.hitStop -= rawDt;
      dt = 0;
    }
    this.fx.update(rawDt);

    if (this.state === 'dying') {
      this.deathT -= rawDt;
      this.updateEnemies(dt * 0.3);
      this.updateProjectiles(dt * 0.3);
      if (this.deathT <= 0) {
        this.state = 'dead';
        this.hooks.onGameOver();
      }
      return;
    }
    if (this.state !== 'playing') return;

    this.time += dt;
    // timers
    if (this.timers.length) {
      for (let i = this.timers.length - 1; i >= 0; i--) {
        const t = this.timers[i];
        if (this.time >= t.t) {
          this.timers.splice(i, 1);
          t.fn();
        }
      }
    }
    this.updatePlayer(dt);
    this.updateWeapons(dt);
    this.director.update(dt);
    // grid rebuild
    this.grid.clear();
    for (const e of this.enemies) if (e.alive) this.grid.insert(e);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateShots(dt);
    this.updateAreas(dt);
    this.updatePickups(dt);
    this.compact();

    if (this.freezeT > 0) this.freezeT -= dt;
    if (this.xpComboT > 0) {
      this.xpComboT -= dt;
      if (this.xpComboT <= 0) this.xpCombo = 0;
    }

    // low HP heartbeat
    if (this.player.hp < this.stats.maxHp * 0.25) {
      this.lowHpT -= dt;
      if (this.lowHpT <= 0) {
        this.lowHpT = 1.1;
        this.sfx('low_hp', { volume: 0.5 });
      }
    }

    // level up
    if (this.pendingLevels > 0 && this.state === 'playing') {
      this.state = 'levelup';
      this.onLevelFx();
      this.hooks.onLevelUp();
      return;
    }
    // queued chests
    if (this.chestQueue.length && this.state === 'playing') {
      const c = this.chestQueue.shift()!;
      this.state = 'chest';
      const rewards = this.openChest(c.gold);
      this.hooks.onChest(rewards, c.gold);
      return;
    }
    if (this.finalBossDefeated) {
      this.victoryT -= rawDt;
      if (this.victoryT <= 0 && this.state === 'playing') {
        this.state = 'victory';
        this.hooks.onVictory();
      }
    }
  }

  onLevelFx() {
    const p = this.player;
    if (this.rng.next() < 0.35) this.say(['Perfetto!', 'Bravissimo!', 'Buonissimo!', 'Delizioso!', 'Che bontà!', 'Si cucina!']);
    this.fx.ring(p.x, p.y, 10, 140, 0.6, '#ffd34d', 8);
    this.fx.burst(p.x, p.y - 20, 22, { colors: ['#ffd34d', '#ffffff', '#7dff8a'], speed: 260, size: 4, life: 0.8, additive: true });
    this.fx.screenFlash(0.25, '#fff4c2');
    this.sfx('levelup');
    if (!this.muted) audio.duckMusic(0.5, 1.2);
  }

  updatePlayer(dt: number) {
    const p = this.player;
    const inp = this.input;
    let mx = inp ? inp.moveX : 0;
    let my = inp ? inp.moveY : 0;
    if (this.autopilot) {
      const ap = this.autopilot(this);
      mx = ap.x;
      my = ap.y;
    }
    const moving = Math.abs(mx) + Math.abs(my) > 0.05;
    p.moving = moving;
    let speed = 132 * this.stats.moveSpeed;
    if (p.slowT > 0) {
      p.slowT -= dt;
      speed *= 1 - p.slowAmt;
    } else p.slowAmt = 0;
    const tvx = mx * speed, tvy = my * speed;
    const k = 1 - Math.exp(-14 * dt);
    p.vx += (tvx - p.vx) * k;
    p.vy += (tvy - p.vy) * k;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (moving) {
      const l = Math.hypot(mx, my);
      p.dirX = mx / l;
      p.dirY = my / l;
      if (Math.abs(mx) > 0.15) p.face = mx > 0 ? 1 : -1;
      p.anim += dt * 9 * Math.min(1.4, Math.hypot(p.vx, p.vy) / 120);
    } else {
      p.anim = 0;
    }
    this.world.resolve(p, p.r * 0.8);
    if (p.iframes > 0) p.iframes -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    // regen
    if (this.stats.recovery > 0 && p.hp < this.stats.maxHp) {
      p.hp = Math.min(this.stats.maxHp, p.hp + this.stats.recovery * dt);
      this.healed += this.stats.recovery * dt;
    }
    // breakables bumped by the player
    this.world.breakablesNear(p.x, p.y, p.r + 4, tmpP);
    for (const pr of tmpP) {
      pr.hp -= dt * 2.5;
      pr.shake = 0.5;
      if (pr.hp <= 0) this.breakProp(pr);
    }
  }

  input: { moveX: number; moveY: number } | null = null;
  autopilot: ((r: Run) => { x: number; y: number }) | null = null;

  updateWeapons(dt: number) {
    for (const w of this.weapons) {
      w.def.update?.(this, w, dt);
      w.cd -= dt;
      if (w.cd <= 0) {
        const s = w.stats(this);
        w.def.fire(this, w);
        w.cd += s.cooldown;
        if (w.cd < 0) w.cd = s.cooldown * 0.5;
      }
      if (w.state.pulse) w.state.pulse = Math.max(0, w.state.pulse - dt * 4);
    }
  }

  updateEnemies(dt: number) {
    const p = this.player;
    const frozen = this.freezeT > 0;
    const v = this.view;
    const vw = v.x1 - v.x0, vh = v.y1 - v.y0;
    const despawnD = Math.max(vw, vh) * 0.95 + 220;
    let contactDmg = 0;
    let csx = 0, csy = 0;
    let csrc = '';
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.spawnT > 0) e.spawnT -= dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.squash > 0) e.squash = Math.max(0, e.squash - dt * 6);
      if (e.attackPose > 0) e.attackPose -= dt;
      if (e.telegraph > 0) e.telegraph -= dt;
      if (e.buff > 0) e.buff -= dt;
      // status
      if (e.burn > 0) {
        e.burn -= dt;
        e.burnTick -= dt;
        if (e.burnTick <= 0) {
          e.burnTick = 0.5;
          this.hitEnemy(e, e.burnDps * 0.5, null, 0, 0, { knock: 0, silent: true });
          if (!e.alive) continue;
          this.fx.burst(e.x, e.y - e.r, 2, { colors: ['#ffb02e', '#ff5a1f'], speed: 40, size: 3, life: 0.4, additive: true, angle: -Math.PI / 2, spread: 1 });
        }
      }
      if (e.slow > 0) {
        e.slow -= dt;
        if (e.slow <= 0) e.slowAmt = 0;
      }
      // knockback integration
      e.x += e.kx * dt;
      e.y += e.ky * dt;
      const kd = Math.exp(-9 * dt);
      e.kx *= kd;
      e.ky *= kd;
      const isFrozen = (frozen && !e.boss) || e.freeze > 0;
      if (e.freeze > 0) e.freeze -= dt;
      if (e.stun > 0) e.stun -= dt;
      if (!isFrozen && (e.stun <= 0 || e.boss)) {
        // an airborne boss ignores slows, so its slam lands exactly when the warning circle ends
        const slow = e.boss && e.state === 50 ? 0 : e.slowAmt;
        updateEnemy(this, e, dt * (1 - slow) * (e.buff > 0 ? 1.35 : 1));
      }
      if (!e.alive) continue;
      // obstacle collision (flyers ignore)
      if (!e.def.flying && !e.boss) this.world.resolve(e, e.r * 0.75);
      // recycle far enemies to the other side
      const dx = e.x - p.x, dy = e.y - p.y;
      if (!e.boss && (Math.abs(dx) > despawnD || Math.abs(dy) > despawnD)) {
        const pos = this.director.spawnPos(e.r);
        e.x = pos.x;
        e.y = pos.y;
        continue;
      }
      // contact with player
      const rr = e.r * 0.85 + p.r;
      const ghosted = e.state === 1 && e.def.behavior === 'ghost';
      if (!isFrozen && !ghosted && e.z < 8 && dx * dx + dy * dy < rr * rr && e.spawnT <= 0.1) {
        if (e.damage > contactDmg) {
          contactDmg = e.damage;
          csx = e.x;
          csy = e.y;
          csrc = e.def.id;
        }
      }
    }
    if (contactDmg > 0) this.hurtPlayer(contactDmg, csx, csy, csrc);
    // separation
    for (const e of this.enemies) {
      if (!e.alive || e.def.flying) continue;
      this.grid.query(e.x, e.y, e.r * 2, tmpE);
      for (const o of tmpE) {
        if (o === e || !o.alive || o.id < e.id || o.def.flying) continue;
        const dx = o.x - e.x, dy = o.y - e.y;
        const rr = (e.r + o.r) * 0.8;
        const d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const push = (rr - d) * 0.5;
          const nx = dx / d, ny = dy / d;
          const we = e.boss ? 0 : o.boss ? 1 : 0.5;
          const wo = o.boss ? 0 : e.boss ? 1 : 0.5;
          e.x -= nx * push * we * 2 * 0.5;
          e.y -= ny * push * we * 2 * 0.5;
          o.x += nx * push * wo * 2 * 0.5;
          o.y += ny * push * wo * 2 * 0.5;
        }
      }
    }
  }

  updateProjectiles(dt: number) {
    const pl = this.player;
    const v = this.view;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.t += dt;
      p.life -= dt;
      p.rot += p.spin * dt;
      p.onUpdate?.(p, dt);
      switch (p.kind) {
        case 'straight':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.faceVel && (p.vx || p.vy)) p.rot = Math.atan2(p.vy, p.vx);
          break;
        case 'homing': {
          const spent = !!p.target && p.hitDelay <= 0 && p.hits.includes(p.target.id);
          if (!p.target || !p.target.alive || spent || (p.target as Enemy).state === 1 && (p.target as Enemy).def?.behavior === 'ghost') {
            p.target = this.nearestEnemy(p.x, p.y, 520, p.hitDelay <= 0 && p.hits.length ? new Set(p.hits) : undefined);
          }
          if (p.target) {
            const want = Math.atan2(p.target.y - p.y, p.target.x - p.x);
            const cur = Math.atan2(p.vy, p.vx);
            let da = want - cur;
            while (da > Math.PI) da -= TAU;
            while (da < -Math.PI) da += TAU;
            const na = cur + clamp(da, -p.turn * dt, p.turn * dt);
            const sp = Math.min(p.speed, Math.hypot(p.vx, p.vy) + p.speed * 2 * dt);
            p.vx = Math.cos(na) * sp;
            p.vy = Math.sin(na) * sp;
          }
          if (p.data !== null && typeof p.data === 'number') {
            // flutter
            p.data += dt * 9;
            const perp = Math.atan2(p.vy, p.vx) + Math.PI / 2;
            const f = Math.sin(p.data) * 50;
            p.x += Math.cos(perp) * f * dt;
            p.y += Math.sin(perp) * f * dt;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.faceVel) p.rot = Math.atan2(p.vy, p.vx);
          break;
        }
        case 'boomerang': {
          const outT = 0.5;
          if (p.t < outT) {
            const k = 1 - p.t / outT;
            const dir = Math.atan2(p.vy, p.vx);
            p.x += Math.cos(dir) * p.speed * k * dt;
            p.y += Math.sin(dir) * p.speed * k * dt;
          } else {
            const dx = pl.x - p.x, dy = pl.y - 14 - p.y;
            const d = Math.hypot(dx, dy);
            const sp = Math.min(p.speed * 1.4, (p.t - outT) * p.speed * 2.2);
            if (d < 18 && p.t > outT + 0.1) {
              p.alive = false;
              break;
            }
            p.x += (dx / d) * sp * dt;
            p.y += (dy / d) * sp * dt;
            p.hitDelay = Math.max(p.hitDelay, 0.3);
          }
          break;
        }
        case 'orbit':
          p.angle += p.angVel * dt;
          p.x = pl.x + Math.cos(p.angle) * p.radius;
          p.y = pl.y - 10 + Math.sin(p.angle) * p.radius * 0.82;
          p.rot = p.angle + Math.PI / 2;
          break;
        case 'bounce':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < v.x0 + p.r && p.vx < 0) p.vx = -p.vx;
          if (p.x > v.x1 - p.r && p.vx > 0) p.vx = -p.vx;
          if (p.y < v.y0 + p.r && p.vy < 0) p.vy = -p.vy;
          if (p.y > v.y1 - p.r && p.vy > 0) p.vy = -p.vy;
          if (p.trail && (p.trailT -= dt) <= 0) {
            p.trailT = 0.05;
            this.fx.sprite(p.x, p.y, p.trail, { life: 0.4, size: 0.8, size1: 0, additive: true, vr: 4 });
          }
          break;
        case 'roller':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += (p.vx >= 0 ? 1 : -1) * (Math.hypot(p.vx, p.vy) / Math.max(10, p.r)) * dt;
          if (p.bounces > 0) {
            if ((p.x < v.x0 + p.r && p.vx < 0) || (p.x > v.x1 - p.r && p.vx > 0)) {
              p.vx = -p.vx;
              p.bounces--;
              this.fx.shake(0.05);
            }
            if ((p.y < v.y0 + p.r && p.vy < 0) || (p.y > v.y1 - p.r && p.vy > 0)) {
              p.vy = -p.vy;
              p.bounces--;
              this.fx.shake(0.05);
            }
          }
          if (Math.random() < dt * 20) this.fx.burst(p.x, p.y + p.r * 0.8, 1, { color: '#e9d9a6', speed: 40, size: 3, life: 0.4, layer: 0 });
          break;
        case 'arc':
          p.vy += (p.data as number) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'lob': {
          const k = 1 - p.life / p.max;
          p.x = p.ox + (p.tx - p.ox) * k;
          p.y = p.oy + (p.ty - p.oy) * k;
          p.z = Math.sin(k * Math.PI) * (60 + Math.hypot(p.tx - p.ox, p.ty - p.oy) * 0.25);
          break;
        }
        case 'rain':
          p.z = Math.max(0, p.z + p.vz * dt);
          if (p.z <= 0 && p.life > 0.02) p.life = 0.0001;
          break;
        case 'sweep':
          p.x = pl.x;
          p.y = pl.y;
          break;
        case 'tornado': {
          p.angle += dt * 1.3;
          const tx = pl.x + Math.cos(p.angle) * p.radius;
          const ty = pl.y + Math.sin(p.angle * 1.3) * p.radius * 0.7;
          p.x += (tx - p.x) * Math.min(1, dt * 2);
          p.y += (ty - p.y) * Math.min(1, dt * 2);
          // pull enemies in
          this.enemiesIn(p.x, p.y, p.r * 1.8, tmpE);
          for (const e of tmpE) {
            if (e.boss) continue;
            const dx = p.x - e.x, dy = p.y - e.y;
            const d = Math.hypot(dx, dy) || 1;
            e.x += (dx / d) * 60 * dt;
            e.y += (dy / d) * 60 * dt;
          }
          if (Math.random() < dt * 30) this.fx.burst(p.x, p.y - 20, 1, { colors: ['#2b2b2b', '#f6dc8a', '#ffffff'], speed: 120, size: 2, life: 0.5 });
          break;
        }
        default:
          break;
      }
      // collisions
      if (p.r > 0 && p.alive && (p.kind !== 'lob' && p.kind !== 'rain')) this.projectileHits(p);
      if (p.life <= 0 || (p.pierce <= 0 && p.kind !== 'lob' && p.kind !== 'rain' && p.r > 0)) {
        if (p.alive) {
          p.alive = false;
          p.onExpire?.(p);
        }
      }
      // off-screen cull for straight shots
      if ((p.kind === 'straight' || p.kind === 'homing' || p.kind === 'arc') && p.r > 0 && !this.onScreen(p.x, p.y, 300)) p.alive = false;
    }
  }

  private canHit(p: Projectile, e: Enemy): boolean {
    const idx = p.hits.indexOf(e.id);
    if (idx < 0) return true;
    if (p.hitDelay <= 0) return false;
    if (this.time - p.hitTimes[idx] >= p.hitDelay) return true;
    return false;
  }

  private markHit(p: Projectile, e: Enemy) {
    const idx = p.hits.indexOf(e.id);
    if (idx < 0) {
      p.hits.push(e.id);
      p.hitTimes.push(this.time);
      if (p.hits.length > 64 && p.hitDelay > 0) {
        // prune old entries
        p.hits.splice(0, 16);
        p.hitTimes.splice(0, 16);
      }
    } else p.hitTimes[idx] = this.time;
  }

  projectileHits(p: Projectile) {
    if (p.kind === 'sweep') {
      this.sweepHits(p);
      return;
    }
    // persistent weapons share hit delays via the weapon slot (orbits)
    this.grid.query(p.x, p.y, p.r + 30, tmpE);
    for (const e of tmpE) {
      if (!e.alive || (e.state === 1 && e.def.behavior === 'ghost')) continue;
      const rr = p.r + e.r;
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy > rr * rr) continue;
      if (!this.canHit(p, e)) continue;
      this.markHit(p, e);
      const kx = p.kind === 'orbit' || p.kind === 'tornado' ? dx : p.vx || dx;
      const ky = p.kind === 'orbit' || p.kind === 'tornado' ? dy : p.vy || dy;
      const died = this.hitEnemy(e, p.damage, p.weapon, kx, ky, { knock: p.knock, crit: p.crit, critMul: p.critMul });
      p.onHit?.(p, died ? e : e);
      if (p.kind === 'straight' || p.kind === 'homing') {
        this.fx.burst(p.x, p.y, 3, { color: '#fff3c4', speed: 120, size: 2, life: 0.25, additive: true });
      }
      if (p.pierce !== Infinity) {
        p.pierce--;
        if (p.pierce <= 0) break;
      }
    }
    if (p.kind === 'roller' || p.kind === 'bounce' || p.kind === 'straight') {
      this.world.breakablesNear(p.x, p.y, p.r, tmpP);
      for (const pr of tmpP) {
        pr.hp -= 1;
        pr.hitFlash = 0.1;
        pr.shake = 1;
        if (pr.hp <= 0) this.breakProp(pr);
        if (p.kind === 'straight') p.pierce--;
      }
    }
  }

  sweepHits(p: Projectile) {
    const pl = this.player;
    if (p.arc) {
      // full spin: ring around the player
      const r = p.radius;
      this.enemiesIn(pl.x, pl.y - 8, r, tmpE);
      const sweepA = (p.t / p.max) * TAU * 2 * p.dir;
      for (const e of tmpE) {
        if (!this.canHit(p, e)) continue;
        // only hit enemies near the leading edge of the swing
        const a = Math.atan2(e.y - pl.y, e.x - pl.x);
        let da = a - sweepA;
        while (da > Math.PI) da -= TAU;
        while (da < -Math.PI) da += TAU;
        if (Math.abs(da) > 1.4) continue;
        this.markHit(p, e);
        const died = this.hitEnemy(e, p.damage, p.weapon, e.x - pl.x, e.y - pl.y, { knock: p.knock });
        p.onHit?.(p, e);
        void died;
      }
      this.breakProps(pl.x, pl.y, r, 1);
      return;
    }
    const cx = pl.x + p.ox;
    const cy = pl.y + p.oy;
    const hw = p.w / 2, hh = p.h / 2;
    this.grid.query(cx, cy, hw + 30, tmpE);
    for (const e of tmpE) {
      if (!e.alive) continue;
      const nx = Math.max(cx - hw, Math.min(e.x, cx + hw));
      const ny = Math.max(cy - hh, Math.min(e.y, cy + hh));
      if ((nx - e.x) ** 2 + (ny - e.y) ** 2 > e.r * e.r) continue;
      if (!this.canHit(p, e)) continue;
      this.markHit(p, e);
      this.hitEnemy(e, p.damage, p.weapon, p.dir, -0.15, { knock: p.knock });
    }
    if (p.t < 0.05) {
      this.world.breakablesNear(cx, cy, hw, tmpP);
      for (const pr of tmpP) {
        pr.hp -= 1;
        pr.hitFlash = 0.1;
        pr.shake = 1;
        if (pr.hp <= 0) this.breakProp(pr);
      }
    }
  }

  updateShots(dt: number) {
    const pl = this.player;
    for (const s of this.shots) {
      if (!s.alive) continue;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.spin * dt;
      if (s.gravity) {
        s.vz -= s.gravity * dt;
        s.z += s.vz * dt;
        if (s.z <= 0) {
          s.alive = false;
          s.onLand?.(s);
          continue;
        }
      }
      if (s.life <= 0) {
        s.alive = false;
        continue;
      }
      if (s.z < 14) {
        const rr = s.r * 0.8 + pl.r * 0.6;
        if ((s.x - pl.x) ** 2 + (s.y - (pl.y - 8)) ** 2 < rr * rr) {
          s.alive = false;
          this.hurtPlayer(s.damage, s.x, s.y, 'shot:' + s.sprite);
          this.fx.burst(s.x, s.y, 6, { color: '#e8312a', speed: 120, size: 3, life: 0.35 });
        }
      }
    }
  }

  updateAreas(dt: number) {
    const pl = this.player;
    for (const a of this.areas) {
      if (!a.alive) continue;
      a.life -= dt;
      if (a.life <= 0) {
        a.alive = false;
        a.onEnd?.(a);
        continue;
      }
      if (a.kind === 'warning' || a.kind === 'crater') continue;
      if (a.enemy) {
        // hazard for the player
        if ((pl.x - a.x) ** 2 / (a.r * a.r) + (pl.y - a.y) ** 2 / (a.r * a.r * 0.6) < 1) {
          if (a.slow) {
            pl.slowT = 0.15;
            pl.slowAmt = a.slow;
          }
          if (a.damage) {
            a.tickT -= dt;
            if (a.tickT <= 0) {
              a.tickT = a.tick;
              this.hurtPlayer(a.damage, a.x, a.y, 'area:' + a.kind);
            }
          }
        }
        continue;
      }
      a.tickT -= dt;
      if (a.tickT <= 0) {
        a.tickT = a.tick;
        this.enemiesIn(a.x, a.y, a.r, tmpE);
        for (const e of tmpE) {
          if (a.damage) this.hitEnemy(e, a.damage, a.weapon, 0, 0, { knock: 0, silent: true });
          if (a.slow) {
            e.slow = Math.max(e.slow, 0.6);
            e.slowAmt = Math.max(e.slowAmt, a.slow);
          }
          const burn = (a as any).burn as number;
          if (burn) {
            e.burn = 2;
            e.burnDps = Math.max(e.burnDps, burn);
          }
        }
      }
      if (a.kind === 'fire' && Math.random() < dt * 12) {
        const ang = Math.random() * TAU, d = Math.random() * a.r;
        this.fx.burst(a.x + Math.cos(ang) * d, a.y + Math.sin(ang) * d * 0.7, 1, { colors: ['#ffd34d', '#ff8a2a', '#ff4b1f'], speed: 30, size: 3, life: 0.5, additive: true, angle: -Math.PI / 2, spread: 0.6 });
      }
    }
  }

  updatePickups(dt: number) {
    const pl = this.player;
    const magR = 52 * this.stats.magnet;
    for (const p of this.pickups) {
      if (!p.alive) continue;
      p.t += dt;
      // pop arc
      if (p.vz || p.z > 0) {
        p.vz -= 520 * dt;
        p.z += p.vz * dt;
        if (p.z <= 0) {
          p.z = 0;
          p.vz = Math.abs(p.vz) > 60 ? -p.vz * 0.3 : 0;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.exp(-3 * dt);
        p.vy *= Math.exp(-3 * dt);
      }
      const dx = pl.x - p.x, dy = pl.y - 10 - p.y;
      const d2 = dx * dx + dy * dy;
      const autoMag = p.kind !== 'chest' && p.kind !== 'xp' && p.kind !== 'coin' ? 0.6 : 1;
      if (!p.magnet && d2 < magR * magR * autoMag * (p.kind === 'chest' ? 0.4 : 1)) p.magnet = true;
      if (p.magnet && p.t > 0.25) {
        const d = Math.sqrt(d2) || 1;
        p.speed = Math.min(900, p.speed + 1300 * dt);
        // slight backwards "anticipation" at first
        const sp = p.speed < 80 ? -40 : p.speed;
        p.x += (dx / d) * sp * dt;
        p.y += (dy / d) * sp * dt;
        if (d < pl.r + 8) this.collect(p);
      } else if (d2 < (pl.r + p.r) ** 2) {
        this.collect(p);
      }
    }
  }

  collect(p: Pickup) {
    p.alive = false;
    const pl = this.player;
    switch (p.kind) {
      case 'xp': {
        this.gainXp(p.value);
        this.xpCombo++;
        this.xpComboT = 0.6;
        this.bestCombo = Math.max(this.bestCombo, this.xpCombo);
        this.sfx('pickup_xp', { volume: 0.4, pitch: Math.min(2, 1 + this.xpCombo * 0.025) });
        break;
      }
      case 'coin':
        this.addCoins(1);
        this.sfx('pickup_coin', { volume: 0.6 });
        this.fx.burst(pl.x, pl.y - 20, 3, { sprite: 'fx.spark', speed: 60, size: 0.8, life: 0.4, additive: true });
        break;
      case 'coinbag':
        this.addCoins(15 + this.rng.int(0, 15));
        this.sfx('pickup_coin', { volume: 0.8, pitch: 0.8 });
        this.fx.text(pl.x, pl.y - 60, '+€', '#ffd34d', 16);
        break;
      case 'cannolo':
        this.heal(20);
        this.sfx('pickup_heal');
        break;
      case 'lasagna':
        this.heal(50);
        this.sfx('pickup_heal', { pitch: 0.85 });
        break;
      case 'bell':
        for (const q of this.pickups) if (q.alive && q.kind === 'xp') q.magnet = true;
        this.sfx('pickup_bell');
        this.fx.bubble(pl, 'A TAVOLA!', -80, '#fff3b0', 1.6, true);
        this.fx.ring(pl.x, pl.y, 20, 600, 0.9, '#ffe9a6', 5, true);
        break;
      case 'spumante': {
        this.sfx('pickup_spumante');
        this.fx.screenFlash(0.7, '#fff6d8');
        this.fx.shake(0.4);
        this.fx.bubble(pl, 'SALUTE!', -80, '#fff3b0', 1.6, true);
        this.fx.burst(pl.x, pl.y - 30, 60, { sprite: 'fx.confetti', frames: 6, speed: 520, size: 1, life: 2.2, gravity: 300, up: 380, shrink: false, drag: 1.4, spin: 14 });
        for (const e of this.enemies) {
          if (!e.alive || !this.onScreen(e.x, e.y, 40)) continue;
          if (e.boss) this.hitEnemy(e, e.maxHp * 0.06, null, 0, 0, { silent: true });
          else this.hitEnemy(e, 9999, null, e.x - pl.x, e.y - pl.y, { knock: 2, silent: true, noNumber: true });
        }
        break;
      }
      case 'gelato':
        this.freezeT = 6;
        this.sfx('pickup_gelato');
        this.fx.screenFlash(0.5, '#cfefff');
        this.fx.bubble(pl, 'BRRR!', -80, '#dff4ff', 1.4, true);
        break;
      case 'chest':
        this.chestQueue.push({ gold: p.gold });
        this.sfx('chest_drop');
        this.say(['Mangia!', 'Che bella cesta!', 'Un regalo!'], true);
        break;
    }
  }

  compact() {
    const sweep = <T extends { alive: boolean }>(arr: T[], pool: T[]) => {
      let n = 0;
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i];
        if (it.alive) arr[n++] = it;
        else pool.push(it);
      }
      arr.length = n;
    };
    sweep(this.enemies, this.enemyPool);
    sweep(this.projectiles, this.projPool);
    sweep(this.shots, this.shotPool);
    sweep(this.pickups, this.pickupPool);
    sweep(this.areas, this.areaPool);
  }

  // ======================================================================
  // results
  // ======================================================================

  /** Persist results into the save. Returns coins earned. */
  commitResults(victory: boolean): number {
    const s = this.save;
    s.coins += this.coins;
    s.totalCoins += this.coins;
    s.totalKills += this.kills;
    s.runs++;
    if (victory) s.wins++;
    s.bestTime = Math.max(s.bestTime, this.time);
    for (const [k, v] of Object.entries(this.killsBy)) s.kills[k] = (s.kills[k] ?? 0) + v;
    const rec = (s.records[this.stage.id] ??= { bestTime: 0, wins: 0, bestKills: 0, bestLevel: 0 });
    rec.bestTime = Math.max(rec.bestTime, this.time);
    rec.bestKills = Math.max(rec.bestKills, this.kills);
    rec.bestLevel = Math.max(rec.bestLevel, this.level);
    if (victory) rec.wins++;
    return this.coins;
  }

  enemyDef(id: string) {
    return ENEMIES[id];
  }

  /** Is the sprite available (art loaded)? */
  has(id: string) {
    return hasSprite(id);
  }
}

/** Draw a spaghetti lash (wiggly noodle through the chain points). */
function drawLash(ctx: CanvasRenderingContext2D, p: Projectile) {
  const { pts, color, seed } = p.data as { pts: { x: number; y: number }[]; color: string; seed: number };
  const k = p.life / p.max;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const n = 10;
      for (let j = 0; j <= n; j++) {
        const t = j / n;
        const w = Math.sin(t * Math.PI * 3 + seed + p.t * 30) * 6 * Math.sin(t * Math.PI);
        const l = Math.hypot(dx, dy) || 1;
        const x = a.x + dx * t + (-dy / l) * w;
        const y = a.y + dy * t + (dx / l) * w;
        if (i === 0 && j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.globalAlpha = Math.min(1, k * 2.5);
    if (pass === 0) {
      ctx.strokeStyle = '#3a2210';
      ctx.lineWidth = 7.5 * k + 2;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 4.5 * k + 1;
    }
    ctx.stroke();
  }
  ctx.restore();
}
