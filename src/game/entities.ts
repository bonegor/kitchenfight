/** Runtime entity classes (pooled where it matters). */
import type { EnemyDef } from './enemies';
import type { WeaponInstance } from './weapons';

let nextId = 1;
export function newId() {
  return nextId++;
}

export class Enemy {
  id = newId();
  def!: EnemyDef;
  alive = false;
  x = 0;
  y = 0;
  r = 10;
  qs = 0;
  hp = 1;
  maxHp = 1;
  speed = 50;
  damage = 5;
  xp = 1;
  /** knockback velocity */
  kx = 0;
  ky = 0;
  /** steering velocity (smoothed) */
  vx = 0;
  vy = 0;
  face = 1;
  anim = 0;
  flash = 0;
  squash = 0;
  slow = 0;
  slowAmt = 0;
  freeze = 0;
  burn = 0;
  burnDps = 0;
  burnTick = 0;
  stun = 0;
  state = 0;
  timer = 0;
  aux = 0;
  ax = 0;
  ay = 0;
  elite = false;
  boss = false;
  scale = 1;
  spawnT = 0;
  layers = 0;
  z = 0; // hop/leap height
  contactCD = 0;
  hpMul = 1;
  bossPhase = 0;
  bossT = 0;
  bossAttack = '';
  attackPose = 0; // >0 shows attack sprite
  telegraph = 0; // red warning tint
  buff = 0; // speed buff timer (garlic aura)
  /** last time hit per weapon slot (for persistent hitboxes) */
  lastHit: Record<number, number> = {};
}

export type ProjKind =
  | 'straight'
  | 'homing'
  | 'boomerang'
  | 'orbit'
  | 'bounce'
  | 'arc'
  | 'lob'
  | 'roller'
  | 'sweep'
  | 'strike'
  | 'aura'
  | 'tornado'
  | 'rain';

export class Projectile {
  id = newId();
  alive = false;
  kind: ProjKind = 'straight';
  weapon: WeaponInstance | null = null;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  r = 6;
  sprite = '';
  frame = 0;
  scale = 1;
  rot = 0;
  spin = 0;
  alpha = 1;
  /** rotate sprite to face velocity */
  faceVel = true;
  damage = 10;
  pierce = 1;
  life = 1;
  max = 1;
  knock = 1;
  crit = 0;
  critMul = 2;
  hitDelay = 0; // 0 = each enemy only once
  hits: number[] = [];
  hitTimes: number[] = [];
  t = 0;
  // behaviour params
  ox = 0;
  oy = 0;
  angle = 0;
  radius = 0;
  angVel = 0;
  speed = 0;
  target: { x: number; y: number; alive: boolean; id: number } | null = null;
  state = 0;
  z = 0;
  vz = 0;
  tx = 0;
  ty = 0;
  bounces = 0;
  turn = 0;
  glow = '';
  trail = '';
  trailT = 0;
  layer: 0 | 1 = 1; // 0 = drawn with ground/sorted, 1 = above characters
  /** sweep (melee) params */
  arc = 0;
  dir = 0;
  w = 0;
  h = 0;
  data: any = null;
  onExpire: ((p: Projectile) => void) | null = null;
  onHit: ((p: Projectile, e: Enemy) => void) | null = null;
  onUpdate: ((p: Projectile, dt: number) => void) | null = null;
  draw: ((ctx: CanvasRenderingContext2D, p: Projectile) => void) | null = null;

  reset() {
    this.alive = true;
    this.weapon = null;
    this.vx = this.vy = 0;
    this.frame = 0;
    this.scale = 1;
    this.rot = 0;
    this.spin = 0;
    this.alpha = 1;
    this.faceVel = true;
    this.pierce = 1;
    this.knock = 1;
    this.crit = 0;
    this.critMul = 2;
    this.hitDelay = 0;
    this.hits.length = 0;
    this.hitTimes.length = 0;
    this.t = 0;
    this.ox = this.oy = 0;
    this.angle = this.radius = this.angVel = this.speed = 0;
    this.target = null;
    this.state = 0;
    this.z = this.vz = 0;
    this.tx = this.ty = 0;
    this.bounces = 0;
    this.turn = 0;
    this.glow = '';
    this.trail = '';
    this.trailT = 0;
    this.layer = 1;
    this.arc = this.dir = this.w = this.h = 0;
    this.data = null;
    this.onExpire = null;
    this.onHit = null;
    this.onUpdate = null;
    this.draw = null;
  }
}

export class EnemyShot {
  alive = false;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  r = 6;
  damage = 8;
  life = 4;
  sprite = 'proj.e_generic';
  rot = 0;
  spin = 0;
  scale = 1;
  /** arcing lob (z height) */
  z = 0;
  vz = 0;
  gravity = 0;
  onLand: ((s: EnemyShot) => void) | null = null;
}

export type PickupKind = 'xp' | 'coin' | 'coinbag' | 'cannolo' | 'lasagna' | 'bell' | 'spumante' | 'gelato' | 'chest';

export class Pickup {
  alive = false;
  kind: PickupKind = 'xp';
  value = 1;
  x = 0;
  y = 0;
  r = 8;
  vx = 0;
  vy = 0;
  z = 0;
  vz = 0;
  t = 0;
  magnet = false;
  speed = 0;
  sprite = '';
  frame = 0;
  gold = false; // golden chest
  qs = 0;
}

export type AreaKind = 'fire' | 'oil' | 'pesto' | 'cream' | 'ketchup' | 'cheese' | 'warning' | 'crater' | 'steam';

export class Area {
  alive = false;
  kind: AreaKind = 'fire';
  x = 0;
  y = 0;
  r = 30;
  life = 3;
  max = 3;
  damage = 0;
  tick = 0.5;
  tickT = 0;
  slow = 0;
  enemy = false; // hazard for the player
  weapon: WeaponInstance | null = null;
  sprite = '';
  frame = 0;
  rot = 0;
  /** for warnings: called when life hits 0 */
  onEnd: ((a: Area) => void) | null = null;
}
