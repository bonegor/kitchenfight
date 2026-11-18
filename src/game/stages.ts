/**
 * IL MENÙ — the levels. Every level is a dish (see recipes.ts): 15 minutes of waves
 * made (≥ 80 % of their weight) of that dish's intruders, its real ingredients to
 * collect, and three bosses (5:00, 10:00, 15:00).
 *
 * BALANCE: the difficulty numbers live in TIERS (+ the BASE_RATE / BASE_MAX curves, the three
 * ramps RATE_RAMP / SPEED_RAMP / DMG_RAMP, DMG_FACTOR_MAX and BOSS_HP_FACTOR). A level's waves
 * only choose WHO comes (pools); HOW MANY, HOW FAST and HOW TOUGH come from its tier, with five
 * optional per-dish factors (StageSpec.rateMul / speedMul / dmgMul / bossHpMul / bossDmgMul).
 * HOW HARD they hit is bounded for every dish by the hit-size rule (HIT_CAP, hitRuleProblems()).
 *
 * POOLS: over the whole run, each intruder's share of the spawn weight follows the order of
 * recipe.intruders (the spec's "weight order": the loudest crime comes most often), checked
 * by stageRuleProblems(). Exempt: ORDER_EXEMPT (support enemies that buff the horde around
 * them, so they stay a seasoning whatever their rank: garlic is first in the Amatriciana).
 */
import type { MusicId } from '../audio/audio';
import { RECIPES, recipeById, intruderIn, type Course, type RecipeDef } from './recipes';
import type { StageAmbient } from '../gfx/stageenv';
import { ELITE_DMG, ENEMIES, GARLIC_BUFF, meanClump, REGULAR_ENEMY_IDS, SHOT_DMG, SPEED_JITTER, touchGrowth, type EnemyDef } from './enemies';
import { baseStats, CHEF_SPEED } from './types';

export interface WaveMinute {
  /** [enemyId, weight] */
  pool: [string, number][];
  /** spawns per second (at curse 1) */
  rate: number;
  /** soft cap of alive enemies */
  max: number;
}

export type EventKind = 'ring' | 'wall' | 'stampede' | 'swarm' | 'elite' | 'toast' | 'ingredient';

export interface StageEvent {
  at: number; // seconds
  kind: EventKind;
  enemy?: string;
  count?: number;
  text?: string;
  /** toast tone (default: 'warn' if the text says ILLEGAL, else 'info') */
  tone?: 'info' | 'warn' | 'good';
  /** 'ingredient': index into the recipe's ingredients */
  index?: number;
}

/** Unlock rule: null = from the start; anyOf = win any of these dishes; wins = win N different dishes. */
export type UnlockRule = null | { anyOf: string[] } | { wins: number };

/** Environment variant: overrides of the env's ambient + a few extra decor props. */
export interface StageVariant {
  /** short label, e.g. 'morning' */
  label: string;
  tint?: string;
  darkness?: number;
  darkColor?: string;
  vignette?: number;
  particles?: StageAmbient['particles'];
  /** darkness ramp over the run (overrides darkness) */
  nightRamp?: [number, number];
  /** extra decor made of existing props (see src/gfx/envvariants.ts) */
  decor?: 'tomatoes' | 'basil' | 'lemons' | 'sea' | 'osteria' | 'embers' | 'pantry';
}

export type TierId = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';

export interface Tier {
  /** what it is tuned against (the pre-menu stages) */
  label: string;
  /** enemy HP multiplier, phased in over the first 7 minutes (Director.ramp) */
  hpBase: number;
  /** extra enemy HP per minute */
  hpGrowth: number;
  /** damage multiplier of the waves, phased in over DMG_RAMP; DMG_FACTOR_MAX stops it, so it sets how early the hits are at full size, not how big they get */
  dmgBase: number;
  /** damage multiplier of the bosses and of the adds they call, phased in over DMG_RAMP (they do not take dmgBase) */
  bossDmg: number;
  /** multiplies BASE_RATE (spawns per second); a rate above 1 phases in over RATE_RAMP */
  rate: number;
  /** multiplies BASE_MAX (soft cap of alive enemies) */
  max: number;
  /** walk-speed factor of everything but the bosses and the heavy bodies (phased in over SPEED_RAMP and capped: see waveSpeed) */
  speed: number;
  /** boss base HP for the 5:00 / 10:00 / 15:00 slots (×hpBase × player level × time at spawn) */
  bossHp: [number, number, number];
}

// =====================================================================================
// TIERS — the one table the balance pass tunes, read top to bottom as the menu's ramp.
// Pre-menu stages for reference (hpBase / hpGrowth / dmgBase): kitchen 1 / 0.11 / 1,
// trattoria 1.6 / 0.13 / 1.15, streets 2.2 / 0.15 / 1.25, foodcourt 2.9 / 0.17 / 1.4.
// - Difficulty comes from crowds, speed, toughness and the patterns of the crimes and the bosses,
//   not from hit size. No enemy hits for more than DMG_FACTOR_MAX (2.9) × its base damage, in any
//   dish, at any time; a dish's dmgBase only decides how early its waves get there (2.2: about
//   9:15, 2.4: 8:40, 2.6: 8:10). Against a chef with no pantry (120 HP, no armor) that makes the
//   touch of an ordinary walker 19 % of the bar at most (17 % for the cream, butter and clams
//   that carry most dishes), a heavy body's 24 %, an elite's 36 %, a cursed can's blast 39 %, a
//   shot 15 %. Ordinary walkers on a standing chef need six touches (2.7 s) to bring him down;
//   a heavy body (frozen lasagne, armoured pineapple, Alfredo the Gluey, the single pot at any
//   size) needs five (2.1 s) and walks at a quarter to two fifths of his pace; only an elite heavy
//   body, a single announced event, can do it in three. hitRuleProblems() checks all of it against
//   HIT_CAP, SURVIVES_TOUCHES and SURVIVES_HEAVY_TOUCHES for every dish, so a retune of this
//   table cannot bring the big hits back.
// - hpBase, dmgBase, bossDmg, max and speed rise (or hold) from T1 to T6. hpGrowth and rate rise
//   from T1 to T5 and step back for T6 on purpose: the finale's own crowd (frozen lasagne,
//   devouring pots, cursed cans, chargers, squeeze bottles) presses hardest by itself.
// - `speed` is what took over from the hit size (the waves of T4 and T5 used to carry a dmgBase
//   of 3.5 and 3.8, a third of a bar a touch): everything a dish spawns walks ×speed, phased in
//   from 3:00 to 8:00 (SPEED_RAMP). waveSpeed() caps it: no walker is taken past 85 % of the
//   chef's pace (WALKER_SPEED_CAP, 112 px/s), the ±8 % spread of a spawn included, so a capped
//   kind walks at 96–112 px/s, 79 % of his pace on average; the garlic's aura stays under the
//   same cap (buffFactor). What is faster by design keeps its own speed (the rolling meatball,
//   the orbiting pepper), and so do the heavy bodies and the bosses. A hopper's hop keeps its
//   own speed too: the factor shortens its rest between hops instead (Enemy.pace). At ×1.4 a
//   cream carton walks at half the chef's pace.
// - The waves of T3–T5 carry far more hpGrowth and rate than the old stage each tier is measured
//   against, for two reasons. The Il Menù intruders are softer than the old crowd (puddlers, a
//   swarm, strafers, lobbers). And the old stages owed most of their pressure to boss fights of
//   four to nine minutes, often two at once; here a fight takes about a minute and a half, so
//   the waves carry the pressure.
// - The openings stay gentle: hpBase phases in over the first 7 minutes (Director), a rate above
//   1 over minutes 2–8 (RATE_RAMP, waves()), a speed above 1 from 3:00 to 8:00 and a dmgBase or
//   bossDmg above 1 from 4:00 to 10:00 (DMG_RAMP). Up to 3:00 the dishes of T2–T6 hit and walk
//   alike; they already differ in who comes, in numbers (max is not phased; rate from 2:00) and
//   in toughness: hpGrowth counts from 0:00, so at 3:00 a T5 crime has 4× its base HP where a
//   T2 crime has 1.3×.
// - A boss hits by its tier's bossDmg, not by dmgBase (1.45–1.75 at full ramp is what the old
//   stages' bosses hit with, the base damage in enemies.ts having been cut by a fifth), and so
//   does everything it calls to its side (summon(): the Ragù's cursed cans cost a third of a
//   bar where they cost three quarters). The 5:00 boss comes at the start of the ramp, so it is
//   the mildest of the three.
//   A dish scales single slots with StageSpec.bossDmgMul: the finals of the Amatriciana and of
//   Cacio e Pepe hit ×0.8. Both were tuned while their boss (Il Re dell'Aglio, Il Panetto
//   Supremo) fell silent whenever the chef kept it above him; now that nothing switches it off
//   it attacks more often against the test bot (17.7 against 13.7 times a minute, 14.4 against
//   12.4), and ×0.8 puts the damage the bot takes in the two fights back where it was (medians:
//   264 against 263, and 263 against 269).
// - bossHp is the slot's base HP; the real HP is ×hpBase × player level × time
//   (Director.spawnBoss). It is set for fights of about a minute and a half with the test bot in
//   every tier: the bot's damage does not grow with the tier, so bossHp × hpBase is about level
//   from T3 to T6 and bossHp itself falls. BOSS_HP_FACTOR evens out the bosses that are slow to
//   bring down anywhere, and a dish scales single slots with StageSpec.bossHpMul (the Vongole's
//   5:00 Butter Block has ×0.75: at ×0.9 the bot beat it without a revive in 2 runs of 24).
// - A dish whose intruders are softer than its tier-mates' asks for more of them
//   (StageSpec.rateMul, phased in like `rate`) or for a quicker step (StageSpec.speedMul: the
//   Pesto's cream, butter and oil); the Margherita's armoured pineapples and ketchup bursts ask
//   for fewer. No dish uses StageSpec.dmgMul any more.
// - Measured with the test bot (Enzo, a mid pantry of Olio 2, San Marzano 2, Grembiule 1 and
//   Minestrone 1; 24 runs per dish and setting). The sim has no seeds and the deaths are bimodal:
//   read a dish's figure as ±3.
//   · deaths in minutes 5–15 with auto-revive: T1 0.1 · T2 0.3 · T3 6.4 · T4 8.0 · T5 10.3 ·
//     T6 24.2 (the old stages with the same bot: kitchen 1.7 · trattoria 8.1 · streets 17.8 ·
//     food court 29.7). By dish: Alfredo 9.8, Amatriciana 4.0, Margherita 5.4, Cacio e Pepe 9.7,
//     Marinara 6.4, Ragù 9.7, Pesto 9.7, Vongole 11.4. T3 and T6 sit a fifth under their old
//     stage, T5 two fifths, and T4 level with the trattoria (before the cap: 6.2 · 12.5 · 15.9 ·
//     22.8). That is what capping the hits cost.
//   · T4 and T5 are one band on this count, and no wave knob moves it: with the hits capped the
//     bot's deaths in T5 stayed within the ±3 for speed ×1.2 or ×1.4, hpGrowth ×1.25, rateMul
//     up to 1.5 and a cap of live enemies ×1.2 or ×1.4 (the crowd of T4 and T5 sits at 85–95 %
//     of `max` from 6:00 on, so a higher rate adds nothing). T5 is the tougher tier in what the
//     bot cannot shrug off: its first boss falls in 28 % of the runs against 48 %, and its
//     crimes carry more HP. Telling the two apart by deaths needs a new pattern in the T5
//     crowds, not a number in this table.
//   · the 5:00 boss dies before the chef (no revive) in 74 % of the T3 runs, 48 % of T4, 28 % of
//     T5 and 4 % of T6 (single dishes swing by ±15 points between rounds of 24). The first death
//     comes at a median of 7:14 in T3, 6:06 in T4, 6:17 in T5 and 5:08 in T6.
//   · a boss fight lasts 66–138 s on average from T3 up (54–89 s in T1 and T2); about one fight
//     in eight goes over 150 s, mostly in runs the bot is losing badly. A strong build ends a
//     fight in 16–25 s now and then, and a weak one leaves the finale's 10:00 Influencer or the
//     Pesto's Frullatore standing in about one run of 24.
//   · with no pantry, 1 run of 264 ended before 2:30 (Cacio e Pepe, the weaker bot, at 1:46) and
//     14 before 3:20; over 480 more such runs of four dishes about 1 % ended before 2:30. The
//     hit-size rule left the first three minutes of T1–T3 as they were; in T4 and T5 the
//     crimes are 5–11 % tougher there than before it (hpGrowth 0.42 → 0.5 and 0.5 → 0.55).
// =====================================================================================
export const TIERS: Record<TierId, Tier> = {
  T1: { label: 'pomodoro ≈ La Cucina ×0.9', hpBase: 0.9, hpGrowth: 0.1, dmgBase: 0.85, bossDmg: 0.85, rate: 0.74, max: 0.8, speed: 1, bossHp: [1300, 2100, 3300] },
  T2: { label: 'carbonara ≈ La Cucina', hpBase: 1, hpGrowth: 0.11, dmgBase: 1, bossDmg: 1, rate: 0.93, max: 0.94, speed: 1, bossHp: [1400, 2300, 3600] },
  T3: { label: 'alfredo / amatriciana / margherita ≈ La Trattoria', hpBase: 1.6, hpGrowth: 0.21, dmgBase: 2.2, bossDmg: 1.45, rate: 1.4, max: 1.05, speed: 1.15, bossHp: [800, 1750, 2400] },
  T4: { label: 'cacio e pepe / marinara: between La Trattoria and I Vicoli', hpBase: 1.9, hpGrowth: 0.5, dmgBase: 2.4, bossDmg: 1.5, rate: 1.8, max: 1.2, speed: 1.3, bossHp: [800, 1800, 2400] },
  T5: { label: 'ragù / pesto / vongole ≈ I Vicoli di Napoli', hpBase: 2.2, hpGrowth: 0.55, dmgBase: 2.6, bossDmg: 1.55, rate: 1.9, max: 1.2, speed: 1.4, bossHp: [1200, 1350, 2200] },
  T6: { label: 'finale ≈ La Food Court', hpBase: 2.9, hpGrowth: 0.26, dmgBase: 2.6, bossDmg: 1.75, rate: 1.6, max: 1.2, speed: 1.4, bossHp: [700, 680, 1550] },
};

/** Spawns per second, minute by minute (×tier.rate). Minutes 5 and 10 breathe (boss); minute 15 is the final boss. */
export const BASE_RATE = [0.9, 1.45, 2.0, 2.45, 2.85, 2.5, 3.25, 3.55, 3.95, 4.3, 3.55, 4.7, 5.1, 5.5, 6.0, 3.2];
/** Soft cap of alive enemies, minute by minute (×tier.max). */
export const BASE_MAX = [24, 42, 58, 70, 82, 74, 102, 114, 130, 144, 124, 162, 182, 202, 222, 128];
/** A spawn-rate factor above 1 (tier × dish) is ×1 up to the first minute here and phases in linearly to full at the second. */
export const RATE_RAMP: [number, number] = [2, 8];
/** A dmgBase or bossDmg above 1 is ×1 up to the first second here and phases in linearly to full at the second (dmgFactor). */
export const DMG_RAMP: [number, number] = [240, 600];
/** A dish's extra toughness (hpBase) and a damage factor below 1 phase in over the first seconds here (Director). */
export const HP_RAMP = 420;
/** Everything hits 4.5 % harder with every minute on the clock. */
export const DMG_PER_MINUTE = 0.045;
/**
 * No enemy ever hits for more than this × its base damage (enemies.ts), in any dish, at any time: the
 * factor of the waves and of the bosses grows with the clock up to here and stops. It is what keeps
 * the hits small enough to read (see the hit-size rule, HIT_CAP): a dish's dmgBase only decides how
 * early its waves get here (2.2: about 9:15, 2.6: about 8:10), never how hard they end up hitting.
 */
export const DMG_FACTOR_MAX = 2.9;

/**
 * How hard an enemy spawned at `time` seconds hits, as a factor on its base damage (enemies.ts).
 * @param base the dish's damage factor: dmgBase for the waves, bossDmg for a boss and the adds it calls
 * A factor above 1 phases in over DMG_RAMP, later than the HP, so the openings and the first boss stay
 * gentle; a factor below 1 (the first dish) applies over HP_RAMP. The result never passes DMG_FACTOR_MAX.
 */
export function dmgFactor(base: number, time: number): number {
  const k = base > 1 ? Math.min(1, Math.max(0, (time - DMG_RAMP[0]) / (DMG_RAMP[1] - DMG_RAMP[0]))) : Math.min(1, time / HP_RAMP);
  return Math.min(DMG_FACTOR_MAX, (1 + (base - 1) * k) * (1 + (time / 60) * DMG_PER_MINUTE));
}

/** A dish's speed factor above 1 is ×1 up to the first second here and phases in linearly to full at the second. */
export const SPEED_RAMP: [number, number] = [180, 480];
/** The speed factor of a dish never takes a walker past this share of the chef's base pace, the spawn jitter (SPEED_JITTER) included. */
export const WALKER_SPEED_CAP = 0.85;
/** A heavy body (EnemyDef.heavy) walks at no more than this share of the chef's base pace, in every dish. */
export const HEAVY_SPEED_CAP = 0.4;
/** The fastest nominal walk the speed factor may give: the quickest of a type (+SPEED_JITTER) then walks at exactly WALKER_SPEED_CAP. */
export const WALKER_SPEED_MAX = (CHEF_SPEED * WALKER_SPEED_CAP) / (1 + SPEED_JITTER);

/** A dish's speed factor at `time` seconds: a factor above 1 phases in over SPEED_RAMP (the openings stay as they are). */
export function speedFactor(mul: number, time: number): number {
  const k = Math.min(1, Math.max(0, (time - SPEED_RAMP[0]) / (SPEED_RAMP[1] - SPEED_RAMP[0])));
  return mul > 1 ? 1 + (mul - 1) * k : mul;
}

/**
 * Nominal walk speed of a non-boss enemy in a dish whose speed factor is `factor` (Run.spawnEnemy
 * spreads it by ±SPEED_JITTER): its own speed × the factor, but never past WALKER_SPEED_MAX, so that
 * even the quickest of its kind stays within WALKER_SPEED_CAP of the chef's base pace. What is that
 * fast by design (the rolling meatball, the orbiting pepper) keeps its own speed, and so does a heavy
 * body: its harder hit is fair because it is slow. Dashes, leaps, stampedes and a hopper's hop have
 * their own speeds and are not touched (a hopper rests less instead: paceFactor).
 */
export function waveSpeed(def: EnemyDef, factor: number): number {
  if (factor <= 1) return def.speed * factor;
  if (def.heavy) return def.speed;
  return Math.min(def.speed * factor, Math.max(def.speed, WALKER_SPEED_MAX));
}

/** How much quicker than its own pace an enemy walks in a dish (1 for a heavy body; what waveSpeed left of the dish's factor for the rest). */
export function paceFactor(def: EnemyDef, factor: number): number {
  return def.speed > 0 ? waveSpeed(def, factor) / def.speed : 1;
}

/**
 * How much faster a crime acts under the garlic's aura in a dish whose speed factor is `factor`: the
 * aura's GARLIC_BUFF, as long as that leaves a walker under WALKER_SPEED_MAX. Past it, the dish's
 * factor and the aura together give no more than the larger of that and what the aura alone gives
 * that crime (a buffed pasta-snapper was at 80 % of the chef's pace before any factor).
 */
export function buffFactor(def: EnemyDef, factor: number): number {
  const inDish = waveSpeed(def, factor);
  const allowed = Math.max(def.speed * GARLIC_BUFF, Math.min(inDish * GARLIC_BUFF, WALKER_SPEED_MAX));
  return Math.max(1, Math.min(GARLIC_BUFF, allowed / inDish));
}

/** Max share of a minute's spawns that may come from non-intruder extras: by weight, and by heads (a swarm pick brings a clump). */
export const MAX_EXTRA_SHARE = 0.2;
/** Intruders left out of the weight-order check (support enemies: see the header). */
export const ORDER_EXEMPT = new Set(['aglio']);
/** Weight-order check tolerance: an intruder may have up to 8 % (relative) more than the one ranked above it. */
const ORDER_TOL = 1.08;

/** Each intruder's share of a dish's spawn weight over the 16 minutes (aliases folded in; extras excluded). */
export function intruderShares(st: StageDef, r: RecipeDef): Map<string, number> {
  const tot = new Map<string, number>();
  let all = 0;
  for (const w of st.waves) {
    const sum = w.pool.reduce((a, [, x]) => a + x, 0);
    if (sum <= 0) continue;
    for (const [id, x] of w.pool) {
      const intr = intruderIn(r, id);
      if (!intr) continue;
      const v = (w.rate * x) / sum;
      tot.set(intr.enemy, (tot.get(intr.enemy) ?? 0) + v);
      all += v;
    }
  }
  for (const [k, v] of tot) tot.set(k, all > 0 ? v / all : 0);
  return tot;
}

export interface StageDef {
  id: string;
  num: number;
  /** Italian dish name */
  name: string;
  /** English dish name */
  subtitle: string;
  desc: string;
  course: Course;
  /** recipes.ts id (the same as the stage id) */
  recipe: string;
  /** base environment id (tiles/props): kitchen | trattoria | streets | foodcourt */
  env: string;
  variant?: StageVariant;
  music: MusicId;
  tier: TierId;
  hpBase: number;
  hpGrowth: number;
  dmgBase: number;
  bossDmg: number;
  /** walk-speed factor of everything but the bosses and the heavy bodies (tier × dish; applied through waveSpeed) */
  speed: number;
  /** `hp` = boss base HP for this slot (overrides the boss's own); `dmg` = factor on the boss's damage in this slot */
  bosses: { at: number; id: string; hp?: number; dmg?: number }[];
  finalBoss: string;
  waves: WaveMinute[];
  events: StageEvent[];
  unlock: UnlockRule;
  /** darkness ramp over the run (from the variant) */
  nightRamp?: [number, number];
  accent: string;
}

// -------------------------------------------------------------------------------------
// wave helpers
// -------------------------------------------------------------------------------------
type Pool = [string, number][];
interface MinuteSpec { pool: Pool; extras: string[]; share: number; rate: number }

/**
 * One minute: intruder pool + optional dish-relevant extras taking `share` of the weight. A swarm
 * extra spawns in clumps, so waves() divides its weight by its mean clump: `share` holds by heads too.
 * `rate` is a factor on the minute's spawn rate.
 */
const M = (pool: Pool, extras: string[] = [], share = 0.15, rate = 1): MinuteSpec => ({ pool, extras, share: extras.length ? share : 0, rate });

/** Spawn-rate factor of minute i: a factor above 1 phases in over RATE_RAMP (the openings stay gentle). */
export function rateFactor(mul: number, i: number): number {
  const k = Math.min(1, Math.max(0, (i - RATE_RAMP[0]) / (RATE_RAMP[1] - RATE_RAMP[0])));
  return mul > 1 ? 1 + (mul - 1) * k : mul;
}

function waves(tier: TierId, minutes: MinuteSpec[], rateMul = 1): WaveMinute[] {
  const T = TIERS[tier];
  return minutes.map((m, i) => {
    const sum = m.pool.reduce((a, [, w]) => a + w, 0);
    const extraW = m.extras.length ? ((m.share / (1 - m.share)) * sum) / m.extras.length : 0;
    const pool: Pool = [...m.pool, ...m.extras.map((id) => [id, Math.floor((extraW / meanClump(ENEMIES[id])) * 100) / 100] as [string, number])];
    return { pool, rate: Math.round(BASE_RATE[i] * rateFactor(T.rate * rateMul, i) * m.rate * 100) / 100, max: Math.round(BASE_MAX[i] * T.max) };
  });
}

/**
 * Per-boss factor on the tier's slot HP, measured in full runs (bot with a mid-progress pantry,
 * auto-revive): at equal HP these bosses took clearly longer to bring down than the others in
 * their slot. The ranged ones (influencer, clock tower) do not come to the chef the way the
 * leaping bosses do; the can, the microwave and the cheese bag hide behind the adds and hazards
 * they bring; the butter block's enrage shrinks it. The Bolognese is untouchable while it is
 * phased out: with a fixed build and no waves it took 1.3× as long as the other ragù-tier
 * finals at equal HP. (No boss can be left behind any more: see BOSS_NEAR in ai.ts.)
 */
export const BOSS_HP_FACTOR: Record<string, number> = {
  b_influencer: 0.6, b_campanile: 0.5, b_burro: 0.7, b_microonde: 0.65, b_scatolone: 0.7, b_grattugiato: 0.6, b_frullatore: 0.65, b_aglio: 0.8, b_bolognese: 0.8,
};

const bosses = (tier: TierId, ids: [string, string, string], mul: [number, number, number] = [1, 1, 1], dmg: [number, number, number] = [1, 1, 1]) => {
  const hp = TIERS[tier].bossHp;
  return ids.map((id, i) => ({ at: 300 * (i + 1), id, hp: Math.round(hp[i] * (BOSS_HP_FACTOR[id] ?? 1) * mul[i]), dmg: dmg[i] }));
};

const MUSIC: Record<string, MusicId> = { kitchen: 'kitchen', trattoria: 'trattoria', streets: 'streets', foodcourt: 'foodcourt' };

/**
 * Ingredient events: evenly spaced between 70 s and 830 s, never within ±20 s of a boss
 * (300 / 600). The director spawns them one at a time.
 */
export function ingredientTimes(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let t = n > 1 ? 70 + (i * (830 - 70)) / (n - 1) : 450;
    for (const b of [300, 600]) if (Math.abs(t - b) < 20) t = t < b ? b - 21 : b + 21;
    out.push(Math.round(t));
  }
  return out;
}

interface StageSpec {
  id: string;
  env: string;
  variant?: StageVariant;
  tier: TierId;
  bosses: [string, string, string];
  /** optional per-slot factor on the boss HP: a boss that is slower or quicker to bring down in this dish's crowd */
  bossHpMul?: [number, number, number];
  /** optional factor on the tier's spawn rate (phases in like the tier's): soft intruders come in larger numbers, tough ones in smaller */
  rateMul?: number;
  /** optional factor on the tier's dmgBase (the bosses and their adds keep the tier's bossDmg); the hit-size rule bounds it */
  dmgMul?: number;
  /** optional factor on the tier's walk-speed factor: a crowd of slow intruders that has to press harder */
  speedMul?: number;
  /** optional per-slot factor on the tier's bossDmg: a boss that lands more or fewer of its attacks in this slot */
  bossDmgMul?: [number, number, number];
  unlock: UnlockRule;
  accent: string;
  minutes: MinuteSpec[];
  events: StageEvent[];
}

function stage(num: number, s: StageSpec): StageDef {
  const r = recipeById(s.id)!;
  const T = TIERS[s.tier];
  const events = [...s.events, ...ingredientTimes(r.ingredients.length).map((at, index): StageEvent => ({ at, kind: 'ingredient', index }))];
  events.sort((a, b) => a.at - b.at);
  return {
    id: s.id,
    num,
    name: r.it,
    subtitle: r.en,
    desc: r.blurb,
    course: r.course,
    recipe: r.id,
    env: s.env,
    variant: s.variant,
    music: MUSIC[s.env] ?? 'kitchen',
    tier: s.tier,
    hpBase: T.hpBase,
    hpGrowth: T.hpGrowth,
    dmgBase: Math.round(T.dmgBase * (s.dmgMul ?? 1) * 100) / 100,
    bossDmg: T.bossDmg,
    speed: Math.round(T.speed * (s.speedMul ?? 1) * 100) / 100,
    bosses: bosses(s.tier, s.bosses, s.bossHpMul, s.bossDmgMul),
    finalBoss: s.bosses[2],
    waves: waves(s.tier, s.minutes, s.rateMul),
    events,
    unlock: s.unlock,
    nightRamp: s.variant?.nightRamp,
    accent: s.accent,
  };
}

const T = (at: number, text: string, tone?: StageEvent['tone']): StageEvent => ({ at, kind: 'toast', text, tone });
const E = (at: number, kind: EventKind, enemy: string, count?: number): StageEvent => ({ at, kind, enemy, count });

// =====================================================================================
// THE MENU
// =====================================================================================
const SPECS: StageSpec[] = [
  // ------------------------------------------------------------------ 1 · Le Basi
  {
    id: 'pomodoro', env: 'kitchen', tier: 'T1', bosses: ['b_scatolone', 'b_microonde', 'b_ketchup'], unlock: null, accent: '#e8442f',
    variant: { label: 'morning', tint: '#fff6e8', darkness: 0, vignette: 0.22, particles: 'dust', decor: 'tomatoes' },
    minutes: [
      // gentle opening: a few squeeze bottles and as many rolling meatballs; the leaping chicken waits for minute 3.
      // The snapped spaghetti are a fifth of the heads (they come in clumps), no longer of the picks, so the
      // first three minutes spawn less often (×0.85): as many intruders as when the snappers were twice as many
      M([['ketchup', 1.5], ['polpetta', 1.5]], ['spezzato'], 0.2, 0.85),
      M([['ketchup', 1.5], ['polpetta', 1.5]], ['spezzato'], 0.2, 0.85),
      M([['ketchup', 2.5], ['polpetta', 1.5], ['pollo', 0.5]], ['spezzato'], 0.2, 0.85),
      M([['ketchup', 3], ['polpetta', 2], ['pollo', 1]], ['spezzato', 'forbici'], 0.2),
      M([['polpetta', 2.5], ['pollo', 2], ['ketchup', 2]], ['scotta'], 0.2),
      M([['ketchup', 3], ['polpetta', 1.5]], ['spezzato'], 0.2),
      M([['polpetta', 3.5], ['ketchup', 3], ['pollo', 2]], ['scotta', 'forbici'], 0.2),
      M([['pollo', 3], ['polpetta', 3], ['ketchup', 2]], ['pentola'], 0.15),
      M([['ketchup', 4], ['polpetta', 3], ['pollo', 2.5]], ['scotta'], 0.2),
      M([['polpetta', 4], ['pollo', 3], ['ketchup', 2]], ['forbici', 'pentola'], 0.2),
      M([['ketchup', 3], ['polpetta', 1.5], ['pollo', 2]], ['spezzato'], 0.2),
      M([['polpetta', 4], ['ketchup', 3], ['pollo', 3]], ['scotta', 'pentola'], 0.2),
      M([['pollo', 3.5], ['ketchup', 3], ['polpetta', 3]], ['forbici'], 0.15),
      M([['polpetta', 4.5], ['ketchup', 3], ['pollo', 3]], ['pentola', 'scotta'], 0.2),
      M([['ketchup', 4], ['polpetta', 3.5], ['pollo', 3]], ['forbici', 'scotta'], 0.2),
      M([['ketchup', 3], ['pollo', 1.5]], ['spezzato'], 0.2),
    ],
    events: [
      T(20, 'Spaghetti al pomodoro: tomato, oil, garlic, basil. Keep the ketchup OUT!'),
      E(90, 'ring', 'ketchup', 6),
      E(150, 'elite', 'ketchup'),
      E(210, 'wall', 'spezzato', 16),
      E(270, 'elite', 'polpetta'),
      E(390, 'ring', 'pollo', 24),
      E(450, 'elite', 'pollo'),
      E(510, 'stampede', 'pollo', 22),
      E(560, 'elite', 'ketchup'),
      T(660, 'Somebody brought a squeeze bottle. Ketchup incoming!', 'warn'),
      E(662, 'ring', 'ketchup', 14),
      E(750, 'elite', 'polpetta'),
      E(810, 'ring', 'polpetta', 16),
      E(860, 'elite', 'pollo'),
      E(870, 'elite', 'ketchup'),
    ],
  },
  // ------------------------------------------------------------------ 2 · Primi Romani
  {
    id: 'carbonara', env: 'kitchen', tier: 'T2', bosses: ['b_influencer', 'b_alfredo', 'b_panna'], unlock: { anyOf: ['pomodoro'] }, accent: '#f2b632',
    variant: { label: 'warm', tint: '#ffe9cf', darkness: 0, vignette: 0.3, particles: 'flour', decor: 'pantry' },
    minutes: [
      M([['piselli', 2], ['bacon', 2]]),
      M([['piselli', 2], ['bacon', 2], ['panna', 2]]),
      M([['panna', 2.5], ['piselli', 1.5], ['prosciutto', 1.5]]),
      M([['panna', 2.5], ['bacon', 2.5], ['funghi', 1], ['piselli', 1]]),
      M([['prosciutto', 2.5], ['funghi', 2.5], ['panna', 2], ['cipolla', 1], ['bacon', 2]]),
      M([['piselli', 2], ['panna', 2], ['burro', 2]]),
      M([['cipolla', 3.5], ['burro', 2], ['bacon', 2], ['funghi', 2.5]], ['scatoletta'], 0.1),
      M([['cipolla', 2], ['aglio', 1], ['panna', 2.5], ['prosciutto', 1.5], ['pollo', 3]]),
      M([['aglio', 2], ['cipolla', 3.5], ['funghi', 2.5], ['burro', 2], ['piselli', 1]], ['scatoletta'], 0.1),
      M([['parmesan', 3.5], ['panna', 2.5], ['cipolla', 3.5], ['pollo', 3], ['bacon', 2]], ['pentolaunica'], 0.08),
      M([['panna', 2.5], ['burro', 2], ['prosciutto', 2.5], ['piselli', 1.5]]),
      M([['parmesan', 3.5], ['cipolla', 3.5], ['funghi', 2.5], ['pollo', 4.5], ['aglio', 2]], ['scatoletta'], 0.12),
      M([['panna', 2.5], ['bacon', 2.5], ['burro', 2], ['prosciutto', 1.5], ['parmesan', 3.5]], ['pentolaunica', 'scatoletta'], 0.12),
      M([['cipolla', 3.5], ['aglio', 2], ['funghi', 3.5], ['pollo', 4.5], ['panna', 2]], ['scatoletta'], 0.12),
      M([['panna', 3.5], ['cipolla', 3.5], ['parmesan', 3.5], ['burro', 2], ['bacon', 2.5], ['prosciutto', 1.5]], ['pentolaunica'], 0.1),
      M([['panna', 2.5], ['piselli', 1.5], ['bacon', 2]]),
    ],
    events: [
      T(20, 'Guanciale, yolks, Pecorino, pepper. Not a drop of cream!'),
      E(90, 'ring', 'piselli', 22),
      E(150, 'elite', 'panna'),
      E(210, 'wall', 'bacon', 16),
      E(270, 'elite', 'prosciutto'),
      E(390, 'ring', 'piselli', 36),
      E(450, 'elite', 'cipolla'),
      E(510, 'stampede', 'bacon', 24),
      E(560, 'elite', 'funghi'),
      T(660, 'Rush hour! Cream cartons everywhere!', 'warn'),
      E(662, 'ring', 'panna', 16),
      E(750, 'elite', 'burro'),
      E(810, 'ring', 'cipolla', 22),
      E(860, 'elite', 'parmesan'),
      E(870, 'elite', 'aglio'),
    ],
  },
  {
    id: 'alfredo', env: 'trattoria', tier: 'T3', bosses: ['b_microonde', 'b_panna', 'b_alfredo'], bossHpMul: [1.25, 1.1, 1.2], unlock: { anyOf: ['carbonara'] }, accent: '#e9c46a',
    variant: { label: 'lunch', tint: '#fff4e2', darkness: 0.1, darkColor: '#2a1a12', vignette: 0.3, particles: 'dust', decor: 'lemons' },
    minutes: [
      // cream opens with a few shrimp and mushy pasta; the broccoli lobs and the gluey Alfredo puddles
      // from minute 2, the leaping chicken from minute 3
      M([['panna', 3], ['gamberi', 0.2]], ['scotta'], 0.2),
      M([['panna', 3], ['gamberi', 0.3]], ['scotta'], 0.2),
      M([['panna', 2.5], ['broccoli', 1], ['alfredo', 0.5], ['gamberi', 0.3]], ['scotta'], 0.15),
      M([['pollo', 0.5], ['panna', 2.5], ['broccoli', 1.5], ['alfredo', 1]], ['scotta'], 0.12),
      M([['alfredo', 2], ['gamberi', 1.2], ['panna', 3], ['pollo', 1.5], ['broccoli', 1.5]]),
      M([['panna', 2.5], ['pollo', 1.5], ['gamberi', 1.5]], ['scotta'], 0.12),
      M([['alfredo', 2.5], ['broccoli', 3], ['aglio', 2], ['pollo', 3]]),
      M([['parmesan', 2], ['panna', 3], ['gamberi', 2], ['aglio', 2], ['pollo', 3]], ['scotta'], 0.12),
      M([['alfredo', 3], ['pollo', 3.5], ['broccoli', 2.5], ['parmesan', 2], ['gamberi', 1]]),
      M([['panna', 3], ['gamberi', 2], ['alfredo', 2.5], ['aglio', 2], ['pollo', 3], ['broccoli', 1]], ['scotta'], 0.12),
      M([['pollo', 3], ['broccoli', 2], ['panna', 2.5]]),
      M([['alfredo', 4], ['parmesan', 2], ['panna', 3], ['pollo', 3.5]], ['scotta'], 0.12),
      M([['broccoli', 3.5], ['gamberi', 2], ['aglio', 2], ['alfredo', 2.5], ['parmesan', 2], ['pollo', 3]]),
      M([['panna', 4.5], ['pollo', 4], ['alfredo', 4], ['broccoli', 2.5]], ['scotta'], 0.12),
      M([['alfredo', 4], ['gamberi', 2.5], ['parmesan', 3], ['panna', 3], ['pollo', 3.5], ['aglio', 2]], ['scotta'], 0.1),
      M([['broccoli', 1.5], ['gamberi', 1], ['pollo', 2.5], ['panna', 2]]),
    ],
    events: [
      T(20, "Fettuccine, butter, Parmigiano, pasta water. Alfredo's dining room is open."),
      E(100, 'ring', 'panna', 10),
      E(160, 'elite', 'broccoli'),
      E(220, 'stampede', 'panna', 16),
      E(270, 'elite', 'panna'),
      E(400, 'ring', 'gamberi', 26),
      E(460, 'elite', 'alfredo'),
      E(520, 'stampede', 'pollo', 18),
      E(570, 'elite', 'parmesan'),
      T(660, 'The US-style lunch crowd arrives: chicken AND cream!', 'warn'),
      E(662, 'stampede', 'pollo', 24),
      E(666, 'ring', 'panna', 14),
      E(760, 'elite', 'alfredo'),
      E(820, 'ring', 'gamberi', 36),
      E(865, 'elite', 'pollo'),
    ],
  },
  {
    id: 'amatriciana', env: 'kitchen', tier: 'T3', bosses: ['b_scatolone', 'b_influencer', 'b_aglio'], bossHpMul: [1.25, 0.9, 0.95], bossDmgMul: [1, 1, 0.8], rateMul: 1.7, speedMul: 1.1, unlock: { anyOf: ['carbonara'] }, accent: '#c8321e',
    variant: { label: 'evening', tint: '#ffd6a8', darkness: 0.46, darkColor: '#2a120a', vignette: 0.45, particles: 'embers', decor: 'embers' },
    minutes: [
      // bacon opens; the layered onions (the dish's hardest hitters early on) build up from minute 2
      M([['bacon', 3.5]], ['spezzato'], 0.2),
      M([['bacon', 3.5]], ['spezzato'], 0.2),
      M([['bacon', 3], ['cipolla', 0.6], ['aglio', 0.5]], ['spezzato'], 0.2),
      M([['cipolla', 1.5], ['bacon', 3], ['parmesan', 1]], ['scotta'], 0.15),
      M([['aglio', 2], ['bacon', 3.5], ['cipolla', 2], ['parmesan', 1]], ['spezzato'], 0.15),
      M([['bacon', 3.5], ['cipolla', 2.5], ['aglio', 1]], ['spezzato'], 0.2),
      M([['cipolla', 4.5], ['aglio', 3.5], ['parmesan', 2], ['bacon', 2.5]], ['scotta'], 0.15),
      M([['bacon', 3.5], ['aglio', 3], ['cipolla', 3.5], ['parmesan', 2]], ['spezzato'], 0.15),
      M([['parmesan', 2], ['cipolla', 4], ['bacon', 2.5], ['aglio', 3]], ['scotta'], 0.15),
      M([['aglio', 4], ['cipolla', 3.5], ['bacon', 3.5], ['parmesan', 2]], ['spezzato', 'scotta'], 0.15),
      M([['bacon', 3.5], ['cipolla', 2.5]], ['spezzato'], 0.2),
      M([['cipolla', 5], ['aglio', 4], ['parmesan', 2], ['bacon', 2.5]], ['scotta'], 0.15),
      M([['bacon', 4], ['aglio', 4], ['cipolla', 4.5], ['parmesan', 3]], ['spezzato'], 0.15),
      M([['cipolla', 5], ['parmesan', 3], ['aglio', 4], ['bacon', 2.5]], ['scotta', 'spezzato'], 0.15),
      M([['aglio', 4], ['cipolla', 5.5], ['bacon', 3.5], ['parmesan', 3]], ['spezzato', 'scotta'], 0.15),
      M([['bacon', 3.5], ['cipolla', 3.5]], ['spezzato'], 0.2),
    ],
    events: [
      T(20, "Amatrice's recipe: guanciale, tomato, pecorino. No garlic, no onion, no pancetta."),
      E(100, 'ring', 'bacon', 18),
      E(160, 'elite', 'bacon'),
      E(220, 'wall', 'bacon', 18),
      E(270, 'elite', 'aglio'),
      E(400, 'ring', 'cipolla', 28),
      E(460, 'elite', 'parmesan'),
      E(520, 'stampede', 'bacon', 26),
      E(570, 'elite', 'cipolla'),
      T(660, 'Somebody is peeling a whole bulb of garlic!', 'warn'),
      E(662, 'ring', 'aglio', 16),
      E(760, 'elite', 'aglio'),
      E(820, 'ring', 'cipolla', 36),
      E(865, 'elite', 'bacon'),
    ],
  },
  {
    id: 'cacioepepe', env: 'trattoria', tier: 'T4', bosses: ['b_influencer', 'b_alfredo', 'b_burro'], bossHpMul: [1, 1, 0.85], bossDmgMul: [1, 1, 0.8], rateMul: 1.2, unlock: { anyOf: ['alfredo', 'amatriciana'] }, accent: '#cfc2a0',
    variant: { label: 'late night', tint: '#ffe0c0', darkness: 0.6, darkColor: '#1a0c18', vignette: 0.5, particles: 'dust', decor: 'osteria' },
    minutes: [
      // butter and cream open; the grated cheese only seasons the dish, and less of it before 5:00
      M([['burro', 3], ['panna', 1.5]], ['scotta'], 0.08),
      M([['burro', 3], ['panna', 2]], ['scotta'], 0.1),
      M([['panna', 3], ['burro', 2.5]], ['scotta'], 0.12),
      M([['burro', 3], ['parmesan', 0.8], ['olio', 1]], ['scotta', 'pentola'], 0.15),
      M([['panna', 3], ['burro', 3], ['parmesan', 1]], ['scotta'], 0.2),
      M([['burro', 3], ['panna', 2]], ['scotta'], 0.2),
      M([['parmesan', 1.5], ['burro', 3], ['olio', 1], ['panna', 2.5]], ['pentola'], 0.15),
      M([['burro', 4], ['panna', 3], ['parmesan', 1.2]], ['scotta'], 0.2),
      M([['panna', 3], ['parmesan', 1.5], ['burro', 3], ['olio', 1]], ['scotta', 'pentola'], 0.2),
      M([['burro', 4], ['parmesan', 2], ['panna', 2.5]], ['scotta'], 0.2),
      M([['burro', 3], ['panna', 3]], ['scotta'], 0.2),
      M([['parmesan', 2], ['burro', 4], ['panna', 3], ['olio', 1]], ['pentola'], 0.15),
      M([['panna', 4], ['burro', 4], ['parmesan', 2]], ['scotta'], 0.2),
      M([['burro', 4], ['parmesan', 2], ['panna', 3], ['olio', 1.5]], ['scotta', 'pentola'], 0.2),
      M([['burro', 5], ['panna', 4], ['parmesan', 2.5], ['olio', 1]], ['scotta'], 0.2),
      M([['burro', 3], ['panna', 3]], ['scotta'], 0.2),
    ],
    events: [
      T(20, 'Pecorino, pepper, pasta water. Three ingredients and nowhere to hide.'),
      E(100, 'wall', 'burro', 12),
      E(160, 'elite', 'parmesan'),
      E(220, 'stampede', 'panna', 14),
      E(270, 'elite', 'olio'),
      E(400, 'ring', 'panna', 22),
      E(460, 'elite', 'panna'),
      E(520, 'ring', 'scotta', 16),
      E(570, 'elite', 'pentola'),
      T(660, 'Someone is reaching for the butter!', 'warn'),
      E(662, 'ring', 'burro', 18),
      E(760, 'wall', 'olio', 14),
      E(820, 'ring', 'panna', 26),
      E(865, 'elite', 'burro'),
    ],
  },
  // ------------------------------------------------------------------ Le Pizze
  {
    id: 'margherita', env: 'streets', tier: 'T3', bosses: ['b_ketchup', 'b_deepdish', 'b_ananas'], bossHpMul: [0.65, 1, 0.9], rateMul: 0.75, unlock: { anyOf: ['carbonara'] }, accent: '#3fa34d',
    variant: { label: 'sunset to night', nightRamp: [0.15, 0.62], decor: 'basil' },
    minutes: [
      M([['pepperoni', 3], ['ananas_pezzo', 3], ['hawaiana', 1]]),
      M([['hawaiana', 3], ['pepperoni', 3], ['cheddar', 1.5]]),
      M([['pollo', 0.5], ['cheddar', 1.5], ['ananas_pezzo', 3], ['macchiata', 1]]),
      M([['ananas', 2], ['pollo', 0.5], ['hawaiana', 3], ['bbq', 1.5]]),
      M([['bbq', 1.5], ['ananas', 2], ['cheddar', 2.5], ['pepperoni', 3], ['macchiata', 1]]),
      M([['hawaiana', 3], ['ananas_pezzo', 3], ['pepperoni', 2]]),
      M([['macchiata', 3.5], ['cheddar', 2.5], ['ananas', 2], ['bbq', 2], ['pollo', 2]]),
      M([['ananas', 3], ['pollo', 2.5], ['hawaiana', 2], ['bbq', 2]]),
      M([['cheddar', 2.5], ['hawaiana', 3], ['ananas', 2], ['macchiata', 3.5], ['pepperoni', 2]]),
      M([['ananas', 3], ['bbq', 2.5], ['pollo', 3.5], ['cheddar', 1.5]]),
      M([['hawaiana', 3], ['pollo', 3], ['pepperoni', 3]]),
      M([['ananas', 3], ['macchiata', 3.5], ['bbq', 2.5], ['cheddar', 2.5]]),
      M([['ananas', 3], ['pollo', 3], ['hawaiana', 3], ['macchiata', 3.5], ['pepperoni', 2]]),
      M([['ananas', 4], ['cheddar', 2.5], ['bbq', 2.5], ['hawaiana', 3]]),
      M([['ananas', 4], ['macchiata', 5], ['pollo', 2.5], ['bbq', 2.5], ['cheddar', 1.5]]),
      M([['ananas_pezzo', 4], ['hawaiana', 3], ['pepperoni', 3]]),
    ],
    events: [
      T(20, 'Tomato, mozzarella, basil, olive oil. Table six ordered a Hawaiian…'),
      E(100, 'ring', 'pepperoni', 20),
      E(160, 'elite', 'pepperoni'),
      E(220, 'stampede', 'hawaiana', 16),
      E(270, 'elite', 'ananas'),
      E(400, 'ring', 'ananas_pezzo', 34),
      E(460, 'elite', 'bbq'),
      E(520, 'wall', 'cheddar', 16),
      E(570, 'elite', 'hawaiana'),
      T(660, 'Table six wants EXTRA pineapple.', 'warn'),
      E(662, 'ring', 'ananas_pezzo', 30),
      E(760, 'elite', 'ananas'),
      E(820, 'stampede', 'pollo', 30),
      E(865, 'elite', 'macchiata'),
    ],
  },
  {
    id: 'marinara', env: 'streets', tier: 'T4', bosses: ['b_grattugiato', 'b_campanile', 'b_deepdish'], rateMul: 1.55, unlock: { anyOf: ['margherita'] }, accent: '#c9302c',
    variant: { label: 'night', nightRamp: [0.45, 0.7], darkColor: '#101634', tint: '#f0ecff', particles: 'fireflies', decor: 'tomatoes' },
    minutes: [
      // the cheese pull leads; the hopping shrimp join slowly (they are the pool's only leapers)
      M([['filante', 3], ['gamberi', 0.4]], ['ananas_pezzo'], 0.15),
      M([['filante', 3], ['gamberi', 0.6], ['vongola', 1.5]]),
      M([['vongola', 3], ['filante', 3], ['parmesan', 1], ['gamberi', 0.3]], ['ananas_pezzo'], 0.12),
      M([['cheddar', 2], ['gamberi', 1.5], ['vongola', 2], ['filante', 2]]),
      M([['parmesan', 2], ['cheddar', 3], ['gamberi', 2], ['filante', 2]], ['ananas_pezzo'], 0.12),
      M([['gamberi', 3], ['filante', 3]], ['ananas_pezzo'], 0.15),
      M([['vongola', 3], ['parmesan', 2], ['cheddar', 2], ['gamberi', 2]]),
      M([['filante', 3], ['gamberi', 3], ['vongola', 2], ['parmesan', 2]], ['ananas_pezzo'], 0.12),
      M([['cheddar', 3], ['filante', 3], ['vongola', 3], ['gamberi', 3]]),
      M([['parmesan', 3], ['vongola', 3], ['gamberi', 3.5], ['cheddar', 2]], ['ananas_pezzo'], 0.12),
      M([['gamberi', 3], ['filante', 3]], ['ananas_pezzo'], 0.15),
      M([['vongola', 3], ['cheddar', 3], ['filante', 3], ['parmesan', 2]]),
      M([['gamberi', 4], ['parmesan', 3], ['vongola', 3], ['filante', 3]], ['ananas_pezzo'], 0.12),
      M([['cheddar', 3], ['filante', 4], ['gamberi', 3], ['parmesan', 3]]),
      M([['vongola', 4], ['gamberi', 3], ['cheddar', 3], ['filante', 3], ['parmesan', 2]], ['ananas_pezzo'], 0.12),
      M([['gamberi', 3], ['filante', 3]], ['ananas_pezzo'], 0.15),
    ],
    events: [
      T(20, 'Tomato, garlic, oregano, oil. No cheese. No seafood. Just the sailors.'),
      E(100, 'ring', 'filante', 18),
      E(160, 'elite', 'filante'),
      E(220, 'stampede', 'filante', 18),
      E(270, 'elite', 'vongola'),
      E(400, 'ring', 'vongola', 24),
      E(460, 'elite', 'cheddar'),
      E(520, 'stampede', 'gamberi', 20),
      E(570, 'elite', 'parmesan'),
      T(660, 'Cheese pull! Somebody ordered EXTRA mozzarella.', 'warn'),
      E(662, 'stampede', 'filante', 22),
      E(760, 'elite', 'gamberi'),
      E(820, 'ring', 'gamberi', 28),
      E(865, 'elite', 'filante'),
    ],
  },
  // ------------------------------------------------------------------ Dal Nord
  {
    id: 'ragu', env: 'trattoria', tier: 'T5', bosses: ['b_scatolone', 'b_microonde', 'b_bolognese'], bossHpMul: [0.5, 0.45, 0.7], rateMul: 1.15, unlock: { anyOf: ['cacioepepe', 'marinara'] }, accent: '#8a3a2a',
    variant: { label: 'Bologna afternoon', tint: '#ffe2b8', darkness: 0.16, darkColor: '#2a160c', vignette: 0.36, particles: 'dust', decor: 'osteria' },
    minutes: [
      // no ranged crimes in Bologna: the pressure comes from the ghosts, the garlic's buff, the meatballs
      // and a few frozen lasagne (the microwave at 10:00 brings more)
      M([['bacon', 2.5], ['fantasma', 0.3]]),
      M([['bacon', 2.5], ['fantasma', 0.6], ['panna', 0.5]]),
      M([['fantasma', 1.5], ['bacon', 2], ['panna', 1.5], ['aglio', 0.5]]),
      M([['panna', 3.5], ['fantasma', 3], ['bacon', 2], ['aglio', 1]], ['polpetta'], 0.06),
      M([['fantasma', 3], ['aglio', 2], ['bacon', 2], ['panna', 3.5]], ['polpetta', 'surgelata'], 0.1),
      M([['bacon', 2.5], ['fantasma', 2]], ['polpetta'], 0.12),
      M([['fantasma', 3], ['panna', 5], ['aglio', 2], ['bacon', 1]], ['polpetta'], 0.12),
      M([['bacon', 2.5], ['fantasma', 3], ['aglio', 2]], ['polpetta', 'surgelata'], 0.12),
      M([['panna', 5], ['fantasma', 3], ['bacon', 2], ['aglio', 2]], ['polpetta'], 0.12),
      M([['fantasma', 3.5], ['aglio', 3], ['bacon', 2], ['panna', 3.5]], ['polpetta', 'surgelata'], 0.12),
      M([['bacon', 2.5], ['fantasma', 3]], ['polpetta'], 0.12),
      M([['fantasma', 3.5], ['panna', 5], ['aglio', 3], ['bacon', 2]], ['polpetta'], 0.12),
      M([['bacon', 3], ['fantasma', 4], ['panna', 5], ['aglio', 2.5]], ['polpetta', 'surgelata'], 0.12),
      M([['fantasma', 4.5], ['aglio', 3], ['panna', 5], ['bacon', 2]], ['polpetta'], 0.12),
      M([['fantasma', 4.5], ['bacon', 2.5], ['panna', 5], ['aglio', 3]], ['surgelata', 'polpetta'], 0.12),
      M([['bacon', 2.5], ['fantasma', 3]], ['polpetta'], 0.12),
    ],
    events: [
      T(20, 'Bologna: the ragù simmers for hours. Spaghetti? That dish does not exist here.'),
      E(100, 'ring', 'bacon', 20),
      E(160, 'elite', 'bacon'),
      E(230, 'stampede', 'bacon', 22),
      E(275, 'elite', 'panna'),
      E(400, 'ring', 'fantasma', 22),
      E(460, 'elite', 'aglio'),
      E(520, 'wall', 'bacon', 22),
      E(570, 'elite', 'fantasma'),
      T(660, 'Spaghetti bolognese sightings all over town!', 'warn'),
      E(662, 'ring', 'fantasma', 24),
      E(760, 'elite', 'panna'),
      E(820, 'wall', 'surgelata', 10),
      E(865, 'elite', 'fantasma'),
    ],
  },
  {
    id: 'pesto', env: 'streets', tier: 'T5', bosses: ['b_burro', 'b_influencer', 'b_frullatore'], bossHpMul: [1, 0.9, 0.8], rateMul: 1.35, speedMul: 1.2, unlock: { anyOf: ['ragu'] }, accent: '#4fa82e',
    variant: { label: 'Ligurian day', tint: '#e4f7d0', darkness: 0.04, darkColor: '#10241a', vignette: 0.3, particles: 'dust', decor: 'basil' },
    minutes: [
      M([['anacardo', 3], ['olio', 1]], ['smartphone'], 0.05),
      M([['anacardo', 3], ['olio', 2], ['panna', 1.5]]),
      M([['anacardo', 2], ['panna', 3.5], ['olio', 2]], ['smartphone'], 0.05),
      M([['burro', 2], ['anacardo', 2], ['panna', 3.5], ['olio', 2]]),
      M([['parmesan', 2], ['anacardo', 2], ['burro', 2], ['olio', 2]], ['smartphone'], 0.05),
      M([['anacardo', 3], ['panna', 3.5]], ['smartphone'], 0.06),
      M([['olio', 3], ['burro', 2], ['parmesan', 2], ['anacardo', 2]]),
      M([['panna', 5], ['anacardo', 3], ['olio', 2], ['burro', 2]], ['smartphone'], 0.06),
      M([['parmesan', 3], ['olio', 3], ['anacardo', 2], ['panna', 3.5]], ['smartphone'], 0.05),
      M([['burro', 3], ['panna', 5], ['anacardo', 3], ['parmesan', 2]], ['smartphone'], 0.06),
      M([['anacardo', 3], ['olio', 3]], ['smartphone'], 0.06),
      M([['parmesan', 3], ['burro', 3], ['olio', 3], ['anacardo', 3]], ['smartphone'], 0.06),
      M([['panna', 6.5], ['anacardo', 3], ['parmesan', 3], ['burro', 2]], ['smartphone'], 0.06),
      M([['olio', 3], ['burro', 3], ['panna', 5], ['anacardo', 3.5], ['parmesan', 2]], ['smartphone'], 0.06),
      M([['anacardo', 3.5], ['panna', 6.5], ['burro', 3], ['olio', 3], ['parmesan', 3]], ['smartphone'], 0.06),
      M([['anacardo', 3], ['panna', 5]], ['smartphone'], 0.06),
    ],
    events: [
      T(20, 'Genoa: basil in the marble mortar. Cream? Cashews? Not today.'),
      E(100, 'ring', 'anacardo', 34),
      E(160, 'elite', 'panna'),
      E(220, 'stampede', 'anacardo', 28),
      E(275, 'elite', 'olio'),
      E(400, 'ring', 'anacardo', 46),
      E(460, 'elite', 'burro'),
      E(520, 'wall', 'anacardo', 26),
      E(570, 'elite', 'parmesan'),
      T(660, 'A blender whirs somewhere… cashews!', 'warn'),
      E(662, 'ring', 'anacardo', 40),
      E(760, 'elite', 'olio'),
      E(820, 'ring', 'panna', 22),
      E(865, 'elite', 'burro'),
    ],
  },
  // ------------------------------------------------------------------ Dal Sud e dal Mare
  {
    id: 'vongole', env: 'streets', tier: 'T5', bosses: ['b_burro', 'b_panna', 'b_grattugiato'], bossHpMul: [0.75, 1, 1], rateMul: 1.5, unlock: { anyOf: ['marinara', 'pesto'] }, accent: '#3f7fd8',
    variant: { label: 'seaside morning', tint: '#dcecff', darkness: 0.04, darkColor: '#0c1a30', vignette: 0.3, particles: 'dust', decor: 'sea' },
    minutes: [
      // the clams lead, butter and cream join early; the grated cheese waits for minute 3 and takes over late
      M([['vongola', 3], ['panna', 1.5], ['burro', 1]]),
      M([['vongola', 3], ['burro', 1.5], ['panna', 1.5]]),
      M([['vongola', 3], ['burro', 2], ['panna', 1]]),
      M([['vongola', 3], ['panna', 2], ['burro', 1.5], ['parmesan', 0.5]]),
      M([['burro', 2], ['vongola', 3.5], ['parmesan', 1], ['panna', 1.5]]),
      M([['vongola', 4], ['panna', 2]]),
      M([['parmesan', 3], ['burro', 2], ['vongola', 3], ['panna', 2]]),
      M([['vongola', 4], ['burro', 2.5], ['panna', 2], ['parmesan', 2.5]]),
      M([['panna', 2.5], ['parmesan', 4], ['vongola', 4]]),
      M([['burro', 3], ['vongola', 4], ['parmesan', 4], ['panna', 2]]),
      M([['vongola', 4], ['burro', 2]]),
      M([['parmesan', 5], ['vongola', 4.5], ['panna', 2.5], ['burro', 2]]),
      M([['vongola', 5], ['burro', 3], ['parmesan', 5]]),
      M([['panna', 3], ['vongola', 5], ['burro', 3], ['parmesan', 5]]),
      M([['vongola', 5], ['parmesan', 5], ['burro', 3], ['panna', 3]]),
      M([['vongola', 4], ['panna', 2], ['burro', 1]]),
    ],
    events: [
      T(20, 'Clams, olive oil, garlic, parsley. The cheese stays in the fridge.'),
      E(100, 'ring', 'vongola', 22),
      E(160, 'elite', 'burro'),
      E(220, 'stampede', 'panna', 16),
      E(275, 'elite', 'vongola'),
      E(400, 'wall', 'burro', 20),
      E(460, 'elite', 'panna'),
      E(520, 'stampede', 'vongola', 24),
      E(570, 'elite', 'burro'),
      T(660, 'The tourist table asks for grated cheese.', 'warn'),
      E(662, 'ring', 'parmesan', 12),
      E(760, 'elite', 'vongola'),
      E(820, 'ring', 'vongola', 36),
      E(865, 'elite', 'parmesan'),
    ],
  },
  // ------------------------------------------------------------------ Il Gran Finale
  {
    id: 'foodcourt', env: 'foodcourt', tier: 'T6', bosses: ['b_campanile', 'b_influencer', 'b_fusione'], unlock: { wins: 6 }, accent: '#d93fd0',
    minutes: [
      // every crime of the menu turns up at least once (stageRuleProblems checks the listed ones)
      M([['spezzato', 3], ['pastachips', 3], ['piselli', 2], ['anacardo', 2], ['scotta_mini', 1.5]]),
      M([['pastachips', 3], ['fantasma', 2], ['spezzato', 2], ['panna', 2], ['bacon', 2]]),
      M([['pentola', 1], ['fantasma', 2], ['macchiata', 1], ['panna', 2], ['spezzato', 3], ['burro', 2], ['scotta', 1.5]]),
      M([['surgelata', 0.5], ['glassa', 2], ['frappe', 1], ['scatoletta', 0.5], ['panna', 2], ['ketchup', 1.5]]),
      M([['pentola', 1], ['fantasma', 2], ['smartphone', 2], ['ananas', 2], ['parmesan', 2], ['cheddar', 2]]),
      M([['scatoletta', 3], ['ketchup', 3], ['pastachips', 3], ['pollo', 2]]),
      M([['surgelata', 2], ['pentolaunica', 0.5], ['alfredo', 2], ['forbici', 2], ['bbq', 2]]),
      M([['fantasma', 3], ['scatoletta', 2], ['cipolla', 2], ['polpetta', 2], ['pentola', 1], ['aglio', 1]]),
      M([['surgelata', 2], ['ananas', 3], ['macchiata', 2], ['frappe', 3], ['gamberi', 2], ['bacon', 1.5]]),
      M([['vongola', 2], ['scatoletta', 3], ['smartphone', 3], ['glassa', 2], ['pentolaunica', 0.5], ['funghi', 2]]),
      M([['ananas', 3], ['hawaiana', 3], ['pepperoni', 3]]),
      M([['cappuccino', 3], ['surgelata', 2], ['fantasma', 2], ['pentola', 1], ['macchiata', 2], ['prosciutto', 2], ['pollo', 2]]),
      M([['cappuccino', 3], ['scatoletta', 3], ['alfredo', 2], ['pentolaunica', 0.5], ['forbici', 2], ['olio', 2], ['aglio', 1]]),
      M([['cappuccino', 3], ['surgelata', 3], ['ananas', 3], ['smartphone', 3], ['glassa', 2], ['broccoli', 2]]),
      M([['cappuccino', 3], ['surgelata', 3], ['fantasma', 3], ['pentola', 2], ['alfredo', 2], ['frappe', 2], ['filante', 2], ['bacon', 2]]),
      M([['panna', 2], ['ketchup', 3], ['ananas_pezzo', 3], ['pastachips', 3]]),
    ],
    events: [
      T(20, 'Welcome to the Food Court. Everything here is a crime.'),
      E(100, 'ring', 'pastachips', 24),
      E(160, 'elite', 'glassa'),
      E(230, 'stampede', 'pastachips', 26),
      E(275, 'elite', 'pastachips'),
      E(400, 'ring', 'pastachips', 40),
      E(460, 'elite', 'fantasma'),
      E(520, 'wall', 'scatoletta', 20),
      E(570, 'elite', 'surgelata'),
      T(660, "It's after 11:00 — cappuccino is now ILLEGAL.", 'warn'),
      E(662, 'ring', 'cappuccino', 22),
      E(760, 'stampede', 'pollo', 20),
      E(820, 'ring', 'ananas', 14),
      E(860, 'elite', 'surgelata'),
      E(870, 'elite', 'pentola'),
    ],
  },
];

export const STAGES: StageDef[] = SPECS.map((s, i) => stage(i + 1, s));

export function stageById(id: string): StageDef {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

export const STAGE_LENGTH = 900;

/** The order the menu lists its courses in. */
export const COURSES: Course[] = ['Le Basi', 'Primi Romani', 'Le Pizze', 'Dal Nord', 'Dal Sud e dal Mare', 'Il Gran Finale'];

// -------------------------------------------------------------------------------------
// progression helpers (unlock rules)
// -------------------------------------------------------------------------------------

/** Legacy (pre-menu) stage ids and the dishes their wins carry over to. */
export const LEGACY_STAGE_MAP: Record<string, string[]> = {
  kitchen: ['pomodoro', 'carbonara'],
  trattoria: ['margherita'],
  streets: ['marinara'],
  foodcourt: ['foodcourt'],
};

type WinsSource = { records: Record<string, { wins: number } | undefined> };

/** Has this dish been won (legacy record ids that map to it count too)? */
export function dishWon(save: WinsSource, id: string): boolean {
  if ((save.records[id]?.wins ?? 0) > 0) return true;
  for (const [legacy, ids] of Object.entries(LEGACY_STAGE_MAP)) if (legacy !== id && ids.includes(id) && (save.records[legacy]?.wins ?? 0) > 0) return true;
  return false;
}

/** How many different dishes of the menu have been won. */
export function dishesWon(save: WinsSource): number {
  return STAGES.filter((s) => dishWon(save, s.id)).length;
}

/** Is the unlock rule of this dish satisfied by the save's wins? */
export function unlockRuleMet(save: WinsSource, st: StageDef): boolean {
  const u = st.unlock;
  if (!u) return true;
  if ('anyOf' in u) return u.anyOf.some((id) => dishWon(save, id));
  return dishesWon(save) >= u.wins;
}

/** Is a dish playable (unlocked earlier, or its rule is met now)? Used by the UI. */
export function isDishUnlocked(save: WinsSource & { unlockedStages: string[] }, id: string): boolean {
  const st = STAGES.find((s) => s.id === id);
  if (!st) return false;
  return save.unlockedStages.includes(id) || unlockRuleMet(save, st);
}

/** Add every dish whose rule is now met to save.unlockedStages. Returns the newly unlocked dishes. */
export function refreshUnlocks(save: WinsSource & { unlockedStages: string[] }): StageDef[] {
  const out: StageDef[] = [];
  for (const st of STAGES) {
    if (save.unlockedStages.includes(st.id)) continue;
    if (unlockRuleMet(save, st)) {
      save.unlockedStages.push(st.id);
      out.push(st);
    }
  }
  return out;
}

/** "Win Carbonara to unlock" / "Win Alfredo or Amatriciana to unlock" / "Win 6 different dishes". */
export function unlockText(st: StageDef): string {
  const u = st.unlock;
  if (!u) return '';
  if ('anyOf' in u) return 'Win ' + u.anyOf.map((id) => stageById(id).name).join(' or ') + ' to unlock';
  return `Win ${u.wins} different dishes to unlock`;
}

// -------------------------------------------------------------------------------------
// rule checks (scripts/validate.mjs prints these; empty = OK)
// -------------------------------------------------------------------------------------

/**
 * The wave rules (empty = OK).
 * - Dishes 1–10: every minute's pool draws ≥ 80 % of its weight, and ≥ 80 % of its heads (a swarm
 *   pick brings a clump: meanClump), from the dish's intruders and
 *   the rest from its extras; event enemies are intruders or extras; the intruders' shares follow
 *   the recipe's order (ORDER_EXEMPT aside); every intruder spawns.
 * - The finale is mixed by hand from the whole menu (exempt from the 80 % and order rules), but
 *   every intruder and every extra its recipe lists must spawn in some minute or event.
 */
export function stageRuleProblems(): string[] {
  const out: string[] = [];
  for (const st of STAGES) {
    const r: RecipeDef | undefined = recipeById(st.recipe);
    if (!r) { out.push(st.id + ': no recipe'); continue; }
    if (st.waves.length !== 16) out.push(`${st.id}: ${st.waves.length} wave minutes (want 16)`);
    if (st.id === 'foodcourt') {
      const spawned = new Set<string>();
      for (const w of st.waves) for (const [id, wt] of w.pool) if (wt > 0) spawned.add(id);
      for (const ev of st.events) if (ev.enemy && ev.kind !== 'toast') spawned.add(ev.enemy);
      // an enemy that splits when it dies brings its pieces too (the mushy pasta's pasta-rinsers)
      for (const id of [...spawned]) { const into = ENEMIES[id]?.split?.into; if (into) spawned.add(into); }
      for (const i of r.intruders) if (![i.enemy, ...(i.alias ?? [])].some((id) => spawned.has(id))) out.push(`${st.id}: listed intruder ${i.enemy} never spawns`);
      for (const id of r.extras) if (!spawned.has(id)) out.push(`${st.id}: listed extra ${id} never spawns`);
      continue;
    }
    st.waves.forEach((w, m) => {
      let tot = 0, intr = 0, heads = 0, intrHeads = 0;
      for (const [id, wt] of w.pool) {
        const h = wt * meanClump(ENEMIES[id]);
        tot += wt;
        heads += h;
        if (intruderIn(r, id)) { intr += wt; intrHeads += h; }
        else if (!r.extras.includes(id)) out.push(`${st.id} m${m}: ${id} is neither an intruder nor an extra`);
      }
      if (tot > 0 && intr / tot < 1 - MAX_EXTRA_SHARE - 1e-6) out.push(`${st.id} m${m}: intruders ${(Math.floor((1000 * intr) / tot) / 10).toFixed(1)}% < ${Math.round(100 * (1 - MAX_EXTRA_SHARE))}%`);
      if (heads > 0 && intrHeads / heads < 1 - MAX_EXTRA_SHARE - 1e-6) out.push(`${st.id} m${m}: intruders ${(Math.floor((1000 * intrHeads) / heads) / 10).toFixed(1)}% of the heads < ${Math.round(100 * (1 - MAX_EXTRA_SHARE))}%`);
    });
    for (const ev of st.events) if (ev.enemy && ev.kind !== 'toast' && !intruderIn(r, ev.enemy) && !r.extras.includes(ev.enemy)) out.push(`${st.id} @${ev.at}: event enemy ${ev.enemy} not an intruder`);
    // weight order (see the header)
    const sh = intruderShares(st, r);
    const ranked = r.intruders.map((i) => i.enemy).filter((id) => !ORDER_EXEMPT.has(id));
    for (let i = 0; i + 1 < ranked.length; i++) {
      const a = sh.get(ranked[i]) ?? 0, b = sh.get(ranked[i + 1]) ?? 0;
      if (b > a * ORDER_TOL + 0.005) out.push(`${st.id}: ${ranked[i + 1]} ${(b * 100).toFixed(0)}% outweighs ${ranked[i]} ${(a * 100).toFixed(0)}% (weight order)`);
    }
    for (const i of r.intruders) if (!sh.get(i.enemy)) out.push(`${st.id}: intruder ${i.enemy} never spawns`);
  }
  if (STAGES.length !== RECIPES.length) out.push(`stages ${STAGES.length} vs recipes ${RECIPES.length}`);
  out.push(...hitRuleProblems());
  return out;
}

// -------------------------------------------------------------------------------------
// the hit-size rule
// -------------------------------------------------------------------------------------

/**
 * The most a single hit may cost, as a share of the bar of a chef with no pantry and no apron
 * (baseStats().maxHp, armor 0). Difficulty comes from crowds, speed, toughness and patterns, not from
 * hit size: the tiers' damage factors are bounded by these, whatever a retune does elsewhere.
 */
export const HIT_CAP = {
  /** the touch of an ordinary wave enemy (SURVIVES_TOUCHES is the tighter bound: five touches must not kill, so under 20 %) */
  walker: 0.25,
  /** a heavy, slow body (EnemyDef.heavy), an elite, a cursed can's blast, anything a boss calls to its side */
  heavy: 0.4,
  /** an enemy's shot or lob */
  shot: 0.2,
};

/** As late as a run gets (25:00): the last minute's pool, split pieces and a boss's adds are checked here; DMG_FACTOR_MAX bounds anything later. */
const LATE = 1500;
/** An ordinary walker must need more than this many touches to bring down a chef at full health. */
export const SURVIVES_TOUCHES = 5;
/** A heavy body (EnemyDef.heavy, at any size) must need more than this many: the fifth touch may kill, the fourth never. */
export const SURVIVES_HEAVY_TOUCHES = 4;

/** Where and when a dish spawns a crime: wave minutes count at their end (the hardest moment), events at their time. */
export interface StageSpawn { id: string; t: number; elite: boolean; where: string }

export function stageSpawns(st: StageDef): StageSpawn[] {
  const out: StageSpawn[] = [];
  st.waves.forEach((w, m) => {
    // the last minute's pool keeps coming for as long as the last boss stands
    for (const [id, wt] of w.pool) if (wt > 0) out.push({ id, t: m + 1 < st.waves.length ? 60 * (m + 1) : LATE, elite: false, where: 'm' + m });
  });
  for (const ev of st.events) if (ev.enemy && ev.kind !== 'toast' && ev.kind !== 'ingredient') out.push({ id: ev.enemy, t: ev.at, elite: ev.kind === 'elite', where: '@' + ev.at });
  // the pieces of a crime that splits come when it dies: at any time after it spawned
  for (const sp of [...out]) {
    const into = ENEMIES[sp.id]?.split?.into;
    if (into) out.push({ id: into, t: LATE, elite: false, where: sp.where + ' (split)' });
  }
  return out;
}

/** HP a touch costs a chef without armor: a crime spawned at `t` seconds in this dish (a fed devourer counted at its largest). */
export function touchDamage(st: StageDef, def: EnemyDef, t: number, o: { elite?: boolean; add?: boolean } = {}): number {
  return def.damage * (o.elite ? ELITE_DMG : 1) * touchGrowth(def) * dmgFactor(o.add ? st.bossDmg : st.dmgBase, t);
}

/** Which cap a crime's touch falls under. */
export function hitClass(def: EnemyDef, elite = false): 'walker' | 'heavy' {
  return elite || def.heavy || def.behavior === 'kamikaze' ? 'heavy' : 'walker';
}

/**
 * The hit-size rule and its companions (empty = OK), for every dish:
 * - no touch, blast or shot of anything the waves and events spawn passes its HIT_CAP at any time, and
 *   SURVIVES_TOUCHES touches of an ordinary walker never bring down a chef at full health, nor do
 *   SURVIVES_HEAVY_TOUCHES of a heavy body (a fully fed pot included; elites are bounded by HIT_CAP only);
 * - nothing a boss could call to its side passes HIT_CAP.heavy (adds hit by bossDmg);
 * - a heavy body stays slow (HEAVY_SPEED_CAP), and the dish's speed factor takes no walker past
 *   WALKER_SPEED_CAP of the chef's pace, with or without the garlic's aura, the spawn jitter included;
 * - no inversion: the waves' damage factor never falls from one tier to the next, and no walker
 *   out-hits the touch of its dish's own 10:00 boss.
 */
export function hitRuleProblems(): string[] {
  const out: string[] = [];
  const hp = baseStats().maxHp;
  const pc = (v: number) => ((100 * v) / hp).toFixed(1) + '%';
  const tiers = Object.keys(TIERS);
  for (const st of STAGES) {
    const worst = new Map<string, { v: number; cap: number; msg: string }>();
    const note = (key: string, v: number, cap: number, msg: string) => {
      if (v > cap * hp + 1e-9 && v > (worst.get(key)?.v ?? 0)) worst.set(key, { v, cap, msg });
    };
    let walker = 0, walkerId = '';
    for (const sp of stageSpawns(st)) {
      const def = ENEMIES[sp.id];
      if (!def || def.boss) continue;
      const v = touchDamage(st, def, sp.t, sp);
      const cls = hitClass(def, sp.elite);
      const what = (sp.elite ? 'an elite ' : '') + sp.id;
      note(sp.id + (sp.elite ? '+' : ''), v, HIT_CAP[cls], `${st.id} ${sp.where}: ${what} hits for ${v.toFixed(1)} = ${pc(v)} of the chef's ${hp} HP (${cls === 'walker' ? 'an ordinary touch' : 'a heavy body, an elite or a blast'}: at most ${100 * HIT_CAP[cls]}%)`);
      const shot = SHOT_DMG[def.behavior];
      if (shot) note(sp.id + (sp.elite ? '+' : '') + ' shot', v * shot, HIT_CAP.shot, `${st.id} ${sp.where}: the shot of ${what} hits for ${(v * shot).toFixed(1)} = ${pc(v * shot)} of the chef's ${hp} HP (shots and lobs: at most ${100 * HIT_CAP.shot}%)`);
      if (!sp.elite && def.behavior !== 'kamikaze' && v > walker) { walker = v; walkerId = sp.id; }
      if (cls === 'walker' && v * SURVIVES_TOUCHES >= hp - 1e-9) note(sp.id + ' touches', v, 0, `${st.id} ${sp.where}: ${SURVIVES_TOUCHES} touches of ${sp.id} (${v.toFixed(1)} each) bring down a chef with ${hp} HP: he must survive ${SURVIVES_TOUCHES}`);
      if (def.heavy && !sp.elite && v * SURVIVES_HEAVY_TOUCHES >= hp - 1e-9) note(sp.id + ' touches', v, 0, `${st.id} ${sp.where}: ${SURVIVES_HEAVY_TOUCHES} touches of the heavy ${sp.id} (${v.toFixed(1)} each) bring down a chef with ${hp} HP: he must survive ${SURVIVES_HEAVY_TOUCHES}`);
      if (def.heavy && waveSpeed(def, st.speed) > CHEF_SPEED * HEAVY_SPEED_CAP + 1e-9) note(sp.id + ' speed', Infinity, 0, `${st.id}: the heavy ${sp.id} walks at ${waveSpeed(def, st.speed).toFixed(0)} px/s, over ${100 * HEAVY_SPEED_CAP}% of the chef's ${CHEF_SPEED}`);
      // the guard rail of the speed factor: nothing slower than the cap is taken past it, with or without the garlic's aura,
      // and that holds for the quickest of a type (the spawn jitter is counted in)
      const J = 1 + SPEED_JITTER, cap = CHEF_SPEED * WALKER_SPEED_CAP, sped = waveSpeed(def, st.speed) * J, buffed = sped * buffFactor(def, st.speed);
      if (sped > Math.max(def.speed * J, cap) + 1e-9 || buffed > Math.max(def.speed * J * GARLIC_BUFF, cap) + 1e-9) note(sp.id + ' pace', Infinity, 0, `${st.id}: the quickest ${sp.id} walks at ${sped.toFixed(0)} px/s (${buffed.toFixed(0)} under the garlic's aura), past ${100 * WALKER_SPEED_CAP}% of the chef's ${CHEF_SPEED}`);
    }
    for (const w of worst.values()) out.push(w.msg);
    // anything a boss might call (summon) hits by bossDmg, however long the fight lasts
    for (const id of REGULAR_ENEMY_IDS) {
      const v = touchDamage(st, ENEMIES[id], LATE, { add: true });
      if (v > HIT_CAP.heavy * hp + 1e-9) out.push(`${st.id}: ${id} called by a boss would hit for ${v.toFixed(1)} = ${pc(v)} of the chef's ${hp} HP (a boss's adds: at most ${100 * HIT_CAP.heavy}%)`);
    }
    const mid = st.bosses[1];
    const midDef = mid && ENEMIES[mid.id];
    if (midDef) {
      const boss = midDef.damage * dmgFactor(st.bossDmg, mid.at) * (mid.dmg ?? 1);
      if (walker > boss + 1e-9) out.push(`${st.id}: ${walkerId} hits for ${walker.toFixed(1)}, more than the touch of the dish's own 10:00 boss ${mid.id} (${boss.toFixed(1)})`);
    }
    const softer = STAGES.filter((o) => tiers.indexOf(o.tier) < tiers.indexOf(st.tier) && o.dmgBase > st.dmgBase + 1e-9).sort((a, b) => b.dmgBase - a.dmgBase)[0];
    if (softer) out.push(`${st.id} (${st.tier}): dmgBase ${st.dmgBase} is below ${softer.id}'s ${softer.dmgBase} (${softer.tier}): the waves of a later tier must not hit softer`);
  }
  return out;
}
