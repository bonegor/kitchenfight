/** Shared game types. */

export interface Stats {
  maxHp: number;
  recovery: number; // HP per second
  armor: number; // flat damage reduction
  moveSpeed: number; // multiplier
  might: number; // damage multiplier
  area: number; // multiplier
  speed: number; // projectile speed multiplier
  duration: number; // multiplier
  amount: number; // + projectiles
  cooldown: number; // multiplier (lower = faster)
  luck: number; // multiplier
  growth: number; // XP multiplier
  greed: number; // coin multiplier
  magnet: number; // pickup radius multiplier
  revival: number; // extra lives
  curse: number; // enemy hp/spawn multiplier
}

export function baseStats(): Stats {
  return {
    maxHp: 120,
    recovery: 0,
    armor: 0,
    moveSpeed: 1,
    might: 1,
    area: 1,
    speed: 1,
    duration: 1,
    amount: 0,
    cooldown: 1,
    luck: 1,
    growth: 1,
    greed: 1,
    magnet: 1,
    revival: 0,
    curse: 1,
  };
}

export type StatKey = keyof Stats;

/** A modification applied to Stats ("add" for additive, "mul" multiplies the current value). */
export interface StatMod {
  stat: StatKey;
  add?: number;
  mul?: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  bio: string;
  sprite: string;
  portrait: string;
  weapon: string;
  mods: StatMod[];
  bonusText: string;
  unlock: { text: string; check?: (s: import('../core/save').SaveData) => boolean } | null;
  voice: import('../audio/audio').VoiceMood;
  /** collision radius */
  radius: number;
}

export interface PassiveDef {
  id: string;
  name: string;
  short: string;
  desc: string;
  icon: string;
  maxLevel: number;
  mods: StatMod[]; // applied once per level
}

export interface WeaponStats {
  damage: number;
  cooldown: number; // seconds
  area: number; // multiplier on base size
  speed: number; // projectile speed (units/s) or multiplier for non-projectiles
  amount: number; // projectiles per volley
  duration: number; // seconds (lifetime / active time)
  pierce: number; // enemies hit before vanishing (Infinity = unlimited)
  knockback: number; // 0..?
  interval: number; // delay between projectiles within a volley
  crit: number; // crit chance 0..1
  critMul: number;
  hitDelay: number; // per-enemy re-hit delay for persistent hitboxes
}

export interface WeaponLevel {
  text: string;
  mods: Partial<WeaponStats>; // additive
}
