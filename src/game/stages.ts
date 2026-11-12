/**
 * IL MENÙ — the levels. Every level is a dish (see recipes.ts): 15 minutes of waves
 * made (≥ 80 % of their weight) of that dish's intruders, its real ingredients to
 * collect, and three bosses (5:00, 10:00, 15:00).
 *
 * BALANCE: all difficulty numbers live in TIERS (+ the BASE_RATE / BASE_MAX curves).
 * A level's waves only choose WHO comes (pools); HOW MANY and HOW TOUGH come from its tier.
 *
 * POOLS: over the whole run, each intruder's share of the spawn weight follows the order of
 * recipe.intruders (the spec's "weight order": the loudest crime comes most often), checked
 * by stageRuleProblems(). Exempt: ORDER_EXEMPT (support enemies that buff the horde around
 * them, so they stay a seasoning whatever their rank: garlic is first in the Amatriciana).
 */
import type { MusicId } from '../audio/audio';
import { RECIPES, recipeById, intruderIn, type Course, type RecipeDef } from './recipes';
import type { StageAmbient } from '../gfx/stageenv';

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
  /** enemy HP multiplier reached after 7 minutes (director ramp) */
  hpBase: number;
  /** extra enemy HP per minute */
  hpGrowth: number;
  /** enemy damage multiplier reached after 7 minutes */
  dmgBase: number;
  /** multiplies BASE_RATE (spawns per second) */
  rate: number;
  /** multiplies BASE_MAX (soft cap of alive enemies) */
  max: number;
  /** boss base HP for the 5:00 / 10:00 / 15:00 slots (×hpBase × player-level scaling at spawn) */
  bossHp: [number, number, number];
}

// =====================================================================================
// TIERS — the one table the balance pass tunes (pre-menu stages for reference:
// kitchen 1 / 0.11 / 1, trattoria 1.6 / 0.13 / 1.15, streets 2.2 / 0.15 / 1.25, foodcourt 2.9 / 0.17 / 1.4)
// hpBase / dmgBase only phase in over 7 minutes, so the opening minutes are shaped by the pools
// and `rate`. T4–T5 lean on hpGrowth / dmgBase / rate because their intruders (puddlers,
// a swarm) are softer than the old alleys' crowd. bossHp: the 5:00 slot grows gently from T2
// to T6 (no 5:00 walls); BOSS_HP_FACTOR evens out the ranged bosses.
// =====================================================================================
export const TIERS: Record<TierId, Tier> = {
  T1: { label: 'pomodoro ≈ La Cucina ×0.9', hpBase: 0.9, hpGrowth: 0.1, dmgBase: 0.85, rate: 0.74, max: 0.8, bossHp: [1300, 2100, 3300] },
  T2: { label: 'carbonara ≈ La Cucina', hpBase: 1, hpGrowth: 0.11, dmgBase: 1, rate: 0.93, max: 0.94, bossHp: [1400, 2300, 3600] },
  T3: { label: 'alfredo / amatriciana / margherita ≈ La Trattoria', hpBase: 1.6, hpGrowth: 0.13, dmgBase: 1.12, rate: 0.96, max: 1, bossHp: [2200, 4800, 6200] },
  T4: { label: 'cacio e pepe / marinara: between La Trattoria and I Vicoli', hpBase: 1.9, hpGrowth: 0.16, dmgBase: 1.3, rate: 1.14, max: 1.12, bossHp: [2600, 4500, 6000] },
  T5: { label: 'ragù / pesto / vongole ≈ I Vicoli di Napoli', hpBase: 2.2, hpGrowth: 0.18, dmgBase: 1.45, rate: 1.25, max: 1.2, bossHp: [2900, 5000, 6600] },
  T6: { label: 'finale ≈ La Food Court', hpBase: 2.9, hpGrowth: 0.17, dmgBase: 1.4, rate: 1.08, max: 1.05, bossHp: [3000, 5200, 9000] },
};

/** Spawns per second, minute by minute (×tier.rate). Minutes 5 and 10 breathe (boss); minute 15 is the final boss. */
export const BASE_RATE = [0.9, 1.45, 2.0, 2.45, 2.85, 2.5, 3.25, 3.55, 3.95, 4.3, 3.55, 4.7, 5.1, 5.5, 6.0, 3.2];
/** Soft cap of alive enemies, minute by minute (×tier.max). */
export const BASE_MAX = [24, 42, 58, 70, 82, 74, 102, 114, 130, 144, 124, 162, 182, 202, 222, 128];
/** Max share of a minute's spawn weight that may come from non-intruder extras. */
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
  /** `hp` = boss base HP for this slot (overrides the boss's own) */
  bosses: { at: number; id: string; hp?: number }[];
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
interface MinuteSpec { pool: Pool; extras: string[]; share: number }

/** One minute: intruder pool + optional dish-relevant extras taking `share` of the weight. */
const M = (pool: Pool, extras: string[] = [], share = 0.15): MinuteSpec => ({ pool, extras, share: extras.length ? share : 0 });

function waves(tier: TierId, minutes: MinuteSpec[]): WaveMinute[] {
  const T = TIERS[tier];
  return minutes.map((m, i) => {
    const sum = m.pool.reduce((a, [, w]) => a + w, 0);
    const extraW = m.extras.length ? ((m.share / (1 - m.share)) * sum) / m.extras.length : 0;
    const pool: Pool = [...m.pool, ...m.extras.map((id) => [id, Math.floor(extraW * 100) / 100] as [string, number])];
    return { pool, rate: Math.round(BASE_RATE[i] * T.rate * 100) / 100, max: Math.round(BASE_MAX[i] * T.max) };
  });
}

/**
 * Per-boss factor on the tier's slot HP. The ranged bosses keep their distance (the chef's
 * melee weapons reach them less often), so they take ~25 % longer to bring down at equal HP;
 * this evens out the fight length across the bosses that share a slot.
 */
export const BOSS_HP_FACTOR: Record<string, number> = { b_influencer: 0.8, b_campanile: 0.8 };

const bosses = (tier: TierId, mid5: string, mid10: string, final: string) => {
  const hp = TIERS[tier].bossHp;
  const f = (id: string) => BOSS_HP_FACTOR[id] ?? 1;
  return [
    { at: 300, id: mid5, hp: Math.round(hp[0] * f(mid5)) },
    { at: 600, id: mid10, hp: Math.round(hp[1] * f(mid10)) },
    { at: 900, id: final, hp: Math.round(hp[2] * f(final)) },
  ];
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
    dmgBase: T.dmgBase,
    bosses: bosses(s.tier, ...s.bosses),
    finalBoss: s.bosses[2],
    waves: waves(s.tier, s.minutes),
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
      // gentle opening: squeeze bottles and a few rolling meatballs; the leaping chicken waits for minute 3
      M([['ketchup', 2.5], ['polpetta', 1]], ['spezzato'], 0.2),
      M([['ketchup', 3], ['polpetta', 1.5]], ['spezzato'], 0.2),
      M([['ketchup', 3], ['polpetta', 1.5], ['pollo', 0.5]], ['spezzato'], 0.2),
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
      E(90, 'ring', 'spezzato', 18),
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
    id: 'alfredo', env: 'trattoria', tier: 'T3', bosses: ['b_microonde', 'b_panna', 'b_alfredo'], unlock: { anyOf: ['carbonara'] }, accent: '#e9c46a',
    variant: { label: 'lunch', tint: '#fff4e2', darkness: 0.1, darkColor: '#2a1a12', vignette: 0.3, particles: 'dust', decor: 'lemons' },
    minutes: [
      // cream and shrimp open; the leaping chicken and the broccoli lobs build up from minute 2
      M([['panna', 3], ['gamberi', 1]], ['scotta'], 0.1),
      M([['panna', 3], ['alfredo', 0.5], ['gamberi', 1.5]]),
      M([['panna', 3], ['alfredo', 1], ['broccoli', 1], ['pollo', 1]]),
      M([['pollo', 2], ['panna', 2.5], ['broccoli', 1.5], ['alfredo', 1]], ['scotta'], 0.12),
      M([['alfredo', 2], ['gamberi', 1.5], ['panna', 3], ['pollo', 2], ['broccoli', 1.5]]),
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
      E(100, 'ring', 'panna', 16),
      E(160, 'elite', 'panna'),
      E(220, 'stampede', 'pollo', 18),
      E(270, 'elite', 'broccoli'),
      E(400, 'ring', 'gamberi', 26),
      E(460, 'elite', 'alfredo'),
      E(520, 'wall', 'pollo', 16),
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
    id: 'amatriciana', env: 'kitchen', tier: 'T3', bosses: ['b_scatolone', 'b_influencer', 'b_aglio'], unlock: { anyOf: ['carbonara'] }, accent: '#c8321e',
    variant: { label: 'evening', tint: '#ffd6a8', darkness: 0.46, darkColor: '#2a120a', vignette: 0.45, particles: 'embers', decor: 'embers' },
    minutes: [
      M([['bacon', 3.5]], ['spezzato'], 0.2),
      M([['bacon', 3.5], ['cipolla', 0.5]], ['spezzato'], 0.2),
      M([['bacon', 2.5], ['cipolla', 2], ['aglio', 1]], ['spezzato'], 0.2),
      M([['cipolla', 3], ['bacon', 2.5], ['parmesan', 1]], ['scotta'], 0.15),
      M([['aglio', 2], ['bacon', 3.5], ['cipolla', 2.5], ['parmesan', 1]], ['spezzato'], 0.15),
      M([['bacon', 3.5], ['cipolla', 2.5], ['aglio', 1]], ['spezzato'], 0.2),
      M([['cipolla', 4.5], ['aglio', 2.5], ['parmesan', 2], ['bacon', 2.5]], ['scotta'], 0.15),
      M([['bacon', 3.5], ['aglio', 2], ['cipolla', 3.5], ['parmesan', 1]], ['spezzato'], 0.15),
      M([['parmesan', 2], ['cipolla', 4], ['bacon', 2.5], ['aglio', 2]], ['scotta'], 0.15),
      M([['aglio', 3], ['cipolla', 3.5], ['bacon', 3.5], ['parmesan', 2]], ['spezzato', 'scotta'], 0.15),
      M([['bacon', 3.5], ['cipolla', 2.5]], ['spezzato'], 0.2),
      M([['cipolla', 5], ['aglio', 3], ['parmesan', 2], ['bacon', 2.5]], ['scotta'], 0.15),
      M([['bacon', 4.5], ['aglio', 3], ['cipolla', 3.5], ['parmesan', 2]], ['spezzato'], 0.15),
      M([['cipolla', 5], ['parmesan', 3], ['aglio', 3], ['bacon', 2.5]], ['scotta', 'spezzato'], 0.15),
      M([['aglio', 3], ['cipolla', 5], ['bacon', 3.5], ['parmesan', 3]], ['spezzato', 'scotta'], 0.15),
      M([['bacon', 3.5], ['cipolla', 3.5]], ['spezzato'], 0.2),
    ],
    events: [
      T(20, "Amatrice's recipe: guanciale, tomato, pecorino. No garlic, no onion, no pancetta."),
      E(100, 'ring', 'bacon', 18),
      E(160, 'elite', 'cipolla'),
      E(220, 'wall', 'bacon', 18),
      E(270, 'elite', 'aglio'),
      E(400, 'ring', 'cipolla', 18),
      E(460, 'elite', 'parmesan'),
      E(520, 'stampede', 'bacon', 26),
      E(570, 'elite', 'cipolla'),
      T(660, 'Somebody is peeling a whole bulb of garlic!', 'warn'),
      E(662, 'ring', 'aglio', 10),
      E(760, 'elite', 'aglio'),
      E(820, 'ring', 'cipolla', 24),
      E(865, 'elite', 'bacon'),
    ],
  },
  {
    id: 'cacioepepe', env: 'trattoria', tier: 'T4', bosses: ['b_alfredo', 'b_influencer', 'b_burro'], unlock: { anyOf: ['alfredo', 'amatriciana'] }, accent: '#cfc2a0',
    variant: { label: 'late night', tint: '#ffe0c0', darkness: 0.6, darkColor: '#1a0c18', vignette: 0.5, particles: 'dust', decor: 'osteria' },
    minutes: [
      M([['burro', 3], ['panna', 1.5]], ['scotta'], 0.15),
      M([['burro', 3], ['panna', 2]], ['scotta'], 0.2),
      M([['panna', 3], ['burro', 2.5], ['parmesan', 0.5]], ['scotta'], 0.2),
      M([['burro', 3], ['parmesan', 1.5], ['olio', 1]], ['scotta', 'pentola'], 0.2),
      M([['panna', 3], ['burro', 3], ['parmesan', 1.5]], ['scotta'], 0.2),
      M([['burro', 3], ['panna', 2]], ['scotta'], 0.2),
      M([['parmesan', 2], ['burro', 3], ['olio', 1], ['panna', 2.5]], ['pentola'], 0.15),
      M([['burro', 4], ['panna', 3], ['parmesan', 1.5]], ['scotta'], 0.2),
      M([['panna', 3], ['parmesan', 2], ['burro', 3], ['olio', 1]], ['scotta', 'pentola'], 0.2),
      M([['burro', 4], ['parmesan', 2.5], ['panna', 2.5]], ['scotta'], 0.2),
      M([['burro', 3], ['panna', 3]], ['scotta'], 0.2),
      M([['parmesan', 2.5], ['burro', 4], ['panna', 3], ['olio', 1]], ['pentola'], 0.15),
      M([['panna', 4], ['burro', 4], ['parmesan', 2.5]], ['scotta'], 0.2),
      M([['burro', 4], ['parmesan', 2.5], ['panna', 3], ['olio', 1.5]], ['scotta', 'pentola'], 0.2),
      M([['burro', 5], ['panna', 4], ['parmesan', 3], ['olio', 1]], ['scotta'], 0.2),
      M([['burro', 3], ['panna', 3]], ['scotta'], 0.2),
    ],
    events: [
      T(20, 'Pecorino, pepper, pasta water. Three ingredients and nowhere to hide.'),
      E(100, 'ring', 'burro', 16),
      E(160, 'elite', 'panna'),
      E(220, 'wall', 'burro', 16),
      E(270, 'elite', 'parmesan'),
      E(400, 'ring', 'panna', 22),
      E(460, 'elite', 'burro'),
      E(520, 'stampede', 'panna', 20),
      E(570, 'elite', 'olio'),
      T(660, 'Someone is reaching for the butter!', 'warn'),
      E(662, 'ring', 'burro', 18),
      E(760, 'elite', 'parmesan'),
      E(820, 'ring', 'panna', 26),
      E(865, 'elite', 'burro'),
    ],
  },
  // ------------------------------------------------------------------ Le Pizze
  {
    id: 'margherita', env: 'streets', tier: 'T3', bosses: ['b_deepdish', 'b_ketchup', 'b_ananas'], unlock: { anyOf: ['carbonara'] }, accent: '#3fa34d',
    variant: { label: 'sunset to night', nightRamp: [0.15, 0.62], decor: 'basil' },
    minutes: [
      M([['pepperoni', 3], ['ananas_pezzo', 3], ['hawaiana', 1]]),
      M([['hawaiana', 3], ['pepperoni', 3], ['cheddar', 1.5]]),
      M([['pollo', 1.5], ['cheddar', 1.5], ['ananas_pezzo', 3], ['macchiata', 1]]),
      M([['ananas', 2], ['pollo', 1.5], ['hawaiana', 3], ['bbq', 2]]),
      M([['bbq', 2], ['ananas', 2], ['cheddar', 2.5], ['pepperoni', 3], ['macchiata', 1]]),
      M([['hawaiana', 3], ['ananas_pezzo', 3], ['pepperoni', 2]]),
      M([['macchiata', 3.5], ['cheddar', 2.5], ['ananas', 2], ['bbq', 2], ['pollo', 2]]),
      M([['ananas', 3], ['pollo', 2.5], ['hawaiana', 2], ['bbq', 2]]),
      M([['cheddar', 2.5], ['hawaiana', 3], ['ananas', 2], ['macchiata', 3.5], ['pepperoni', 2]]),
      M([['ananas', 3], ['bbq', 2.5], ['pollo', 3], ['cheddar', 1.5]]),
      M([['hawaiana', 3], ['pollo', 2.5], ['pepperoni', 3]]),
      M([['ananas', 3], ['macchiata', 3.5], ['bbq', 2.5], ['cheddar', 2.5]]),
      M([['ananas', 3], ['pollo', 3], ['hawaiana', 3], ['macchiata', 3.5], ['pepperoni', 2]]),
      M([['ananas', 4], ['cheddar', 2.5], ['bbq', 2.5], ['hawaiana', 3]]),
      M([['ananas', 4], ['macchiata', 5], ['pollo', 2.5], ['bbq', 2.5], ['cheddar', 1.5]]),
      M([['ananas_pezzo', 4], ['hawaiana', 3], ['pepperoni', 3]]),
    ],
    events: [
      T(20, 'Tomato, mozzarella, basil, olive oil. Table six ordered a Hawaiian…'),
      E(100, 'ring', 'pepperoni', 20),
      E(160, 'elite', 'pollo'),
      E(220, 'stampede', 'pollo', 18),
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
    id: 'marinara', env: 'streets', tier: 'T4', bosses: ['b_grattugiato', 'b_campanile', 'b_deepdish'], unlock: { anyOf: ['margherita'] }, accent: '#c9302c',
    variant: { label: 'night', nightRamp: [0.45, 0.7], darkColor: '#101634', tint: '#f0ecff', particles: 'fireflies', decor: 'tomatoes' },
    minutes: [
      M([['filante', 3], ['gamberi', 1.5]], ['ananas_pezzo'], 0.15),
      M([['filante', 3], ['gamberi', 2], ['vongola', 1.5]]),
      M([['vongola', 3], ['filante', 3], ['parmesan', 1]], ['ananas_pezzo'], 0.12),
      M([['cheddar', 2], ['gamberi', 3], ['vongola', 2], ['filante', 2]]),
      M([['parmesan', 2], ['cheddar', 3], ['gamberi', 3], ['filante', 2]], ['ananas_pezzo'], 0.12),
      M([['gamberi', 3], ['filante', 3]], ['ananas_pezzo'], 0.15),
      M([['vongola', 3], ['parmesan', 2], ['cheddar', 2], ['gamberi', 2]]),
      M([['filante', 3], ['gamberi', 3], ['vongola', 2], ['parmesan', 2]], ['ananas_pezzo'], 0.12),
      M([['cheddar', 3], ['filante', 3], ['vongola', 3], ['gamberi', 2]]),
      M([['parmesan', 3], ['vongola', 3], ['gamberi', 3], ['cheddar', 2]], ['ananas_pezzo'], 0.12),
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
      E(220, 'stampede', 'gamberi', 20),
      E(270, 'elite', 'vongola'),
      E(400, 'ring', 'vongola', 24),
      E(460, 'elite', 'cheddar'),
      E(520, 'wall', 'filante', 16),
      E(570, 'elite', 'parmesan'),
      T(660, 'Cheese pull! Somebody ordered EXTRA mozzarella.', 'warn'),
      E(662, 'stampede', 'filante', 22),
      E(760, 'elite', 'gamberi'),
      E(820, 'ring', 'cheddar', 24),
      E(865, 'elite', 'filante'),
    ],
  },
  // ------------------------------------------------------------------ Dal Nord
  {
    id: 'ragu', env: 'trattoria', tier: 'T5', bosses: ['b_scatolone', 'b_microonde', 'b_bolognese'], unlock: { anyOf: ['cacioepepe', 'marinara'] }, accent: '#8a3a2a',
    variant: { label: 'Bologna afternoon', tint: '#ffe2b8', darkness: 0.16, darkColor: '#2a160c', vignette: 0.36, particles: 'dust', decor: 'osteria' },
    minutes: [
      // no ranged crimes in Bologna: the pressure comes from the ghosts, the garlic's buff and the frozen lasagne
      M([['bacon', 2.5], ['fantasma', 1]], ['polpetta'], 0.08),
      M([['bacon', 2.5], ['fantasma', 2]], ['polpetta'], 0.1),
      M([['fantasma', 3], ['bacon', 2], ['panna', 1.5], ['aglio', 0.5]], ['polpetta'], 0.12),
      M([['panna', 3.5], ['fantasma', 3], ['bacon', 2], ['aglio', 1]], ['surgelata', 'polpetta'], 0.15),
      M([['fantasma', 3], ['aglio', 2], ['bacon', 2], ['panna', 3.5]], ['polpetta'], 0.15),
      M([['bacon', 2.5], ['fantasma', 2]], ['polpetta'], 0.15),
      M([['fantasma', 3], ['panna', 5], ['aglio', 2], ['bacon', 1]], ['surgelata'], 0.15),
      M([['bacon', 2.5], ['fantasma', 3], ['aglio', 2]], ['polpetta'], 0.15),
      M([['panna', 5], ['fantasma', 3], ['bacon', 2], ['aglio', 2]], ['surgelata', 'polpetta'], 0.18),
      M([['fantasma', 3.5], ['aglio', 3], ['bacon', 2], ['panna', 3.5]], ['polpetta', 'surgelata'], 0.18),
      M([['bacon', 2.5], ['fantasma', 3]], ['polpetta'], 0.15),
      M([['fantasma', 3.5], ['panna', 5], ['aglio', 3], ['bacon', 2]], ['surgelata', 'polpetta'], 0.18),
      M([['bacon', 3], ['fantasma', 3.5], ['panna', 5], ['aglio', 2.5]], ['polpetta', 'surgelata'], 0.2),
      M([['fantasma', 4], ['aglio', 3], ['panna', 5], ['bacon', 2]], ['surgelata', 'polpetta'], 0.2),
      M([['fantasma', 4.5], ['bacon', 2.5], ['panna', 5], ['aglio', 3]], ['surgelata', 'polpetta'], 0.2),
      M([['bacon', 2.5], ['fantasma', 3]], ['polpetta'], 0.15),
    ],
    events: [
      T(20, 'Bologna: the ragù simmers for hours. Spaghetti? That dish does not exist here.'),
      E(100, 'ring', 'bacon', 20),
      E(160, 'elite', 'fantasma'),
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
    id: 'pesto', env: 'streets', tier: 'T5', bosses: ['b_burro', 'b_influencer', 'b_frullatore'], unlock: { anyOf: ['ragu'] }, accent: '#4fa82e',
    variant: { label: 'Ligurian day', tint: '#e4f7d0', darkness: 0.04, darkColor: '#10241a', vignette: 0.3, particles: 'dust', decor: 'basil' },
    minutes: [
      M([['anacardo', 3], ['olio', 1]], ['smartphone'], 0.08),
      M([['anacardo', 3], ['olio', 2], ['panna', 1.5]]),
      M([['anacardo', 2], ['panna', 3.5], ['olio', 2]], ['smartphone'], 0.1),
      M([['burro', 2], ['anacardo', 2], ['panna', 3.5], ['olio', 2]]),
      M([['parmesan', 2], ['anacardo', 2], ['burro', 2], ['olio', 2]], ['smartphone'], 0.1),
      M([['anacardo', 3], ['panna', 3.5]], ['smartphone'], 0.12),
      M([['olio', 3], ['burro', 2], ['parmesan', 2], ['anacardo', 2]]),
      M([['panna', 5], ['anacardo', 3], ['olio', 2], ['burro', 2]], ['smartphone'], 0.12),
      M([['parmesan', 3], ['olio', 3], ['anacardo', 2], ['panna', 3.5]], ['smartphone'], 0.1),
      M([['burro', 3], ['panna', 5], ['anacardo', 3], ['parmesan', 2]], ['smartphone'], 0.12),
      M([['anacardo', 3], ['olio', 3]], ['smartphone'], 0.12),
      M([['parmesan', 3], ['burro', 3], ['olio', 3], ['anacardo', 3]], ['smartphone'], 0.12),
      M([['panna', 6.5], ['anacardo', 3], ['parmesan', 3], ['burro', 2]], ['smartphone'], 0.12),
      M([['olio', 3], ['burro', 3], ['panna', 5], ['anacardo', 3.5], ['parmesan', 2]], ['smartphone'], 0.12),
      M([['anacardo', 3.5], ['panna', 6.5], ['burro', 3], ['olio', 3], ['parmesan', 3]], ['smartphone'], 0.12),
      M([['anacardo', 3], ['panna', 5]], ['smartphone'], 0.12),
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
    id: 'vongole', env: 'streets', tier: 'T5', bosses: ['b_burro', 'b_panna', 'b_grattugiato'], unlock: { anyOf: ['marinara', 'pesto'] }, accent: '#3f7fd8',
    variant: { label: 'seaside morning', tint: '#dcecff', darkness: 0.04, darkColor: '#0c1a30', vignette: 0.3, particles: 'dust', decor: 'sea' },
    minutes: [
      M([['vongola', 4], ['panna', 1]]),
      M([['vongola', 4], ['parmesan', 1], ['panna', 1]]),
      M([['vongola', 3], ['burro', 2], ['parmesan', 1]]),
      M([['parmesan', 2], ['vongola', 4], ['panna', 2]]),
      M([['burro', 2], ['vongola', 4], ['parmesan', 2], ['panna', 1]]),
      M([['vongola', 4], ['panna', 2]]),
      M([['parmesan', 3], ['burro', 2], ['vongola', 3], ['panna', 2]]),
      M([['vongola', 4], ['burro', 3], ['panna', 2]]),
      M([['panna', 3], ['parmesan', 3], ['vongola', 4]]),
      M([['burro', 3], ['vongola', 4], ['parmesan', 3], ['panna', 2]]),
      M([['vongola', 4], ['burro', 2]]),
      M([['parmesan', 3], ['vongola', 4], ['panna', 3], ['burro', 2]]),
      M([['vongola', 5], ['burro', 3], ['parmesan', 3]]),
      M([['panna', 3], ['vongola', 5], ['burro', 3], ['parmesan', 3]]),
      M([['vongola', 5], ['parmesan', 4], ['burro', 3], ['panna', 3]]),
      M([['vongola', 4], ['panna', 2]]),
    ],
    events: [
      T(20, 'Clams, olive oil, garlic, parsley. The cheese stays in the fridge.'),
      E(100, 'ring', 'vongola', 22),
      E(160, 'elite', 'burro'),
      E(220, 'stampede', 'vongola', 22),
      E(275, 'elite', 'parmesan'),
      E(400, 'ring', 'vongola', 32),
      E(460, 'elite', 'panna'),
      E(520, 'wall', 'vongola', 20),
      E(570, 'elite', 'burro'),
      T(660, 'The tourist table asks for grated cheese.', 'warn'),
      E(662, 'ring', 'parmesan', 12),
      E(760, 'elite', 'vongola'),
      E(820, 'stampede', 'vongola', 30),
      E(865, 'elite', 'parmesan'),
    ],
  },
  // ------------------------------------------------------------------ Il Gran Finale
  {
    id: 'foodcourt', env: 'foodcourt', tier: 'T6', bosses: ['b_campanile', 'b_influencer', 'b_fusione'], unlock: { wins: 6 }, accent: '#d93fd0',
    minutes: [
      M([['spezzato', 3], ['pastachips', 3], ['piselli', 2], ['anacardo', 2]]),
      M([['pastachips', 3], ['fantasma', 2], ['spezzato', 2], ['panna', 2]]),
      M([['pentola', 1], ['fantasma', 2], ['macchiata', 1], ['panna', 2], ['spezzato', 3], ['burro', 2]]),
      M([['surgelata', 1], ['glassa', 2], ['frappe', 1], ['scatoletta', 1], ['panna', 2], ['ketchup', 1]]),
      M([['pentola', 1], ['fantasma', 2], ['smartphone', 2], ['ananas', 2], ['parmesan', 2], ['cheddar', 2]]),
      M([['scatoletta', 3], ['ketchup', 3], ['pastachips', 3]]),
      M([['surgelata', 2], ['pentolaunica', 2], ['alfredo', 2], ['forbici', 2], ['bbq', 2]]),
      M([['fantasma', 3], ['scatoletta', 2], ['cipolla', 2], ['polpetta', 2], ['pentola', 1]]),
      M([['surgelata', 2], ['ananas', 3], ['macchiata', 2], ['frappe', 3], ['gamberi', 2]]),
      M([['vongola', 2], ['scatoletta', 3], ['smartphone', 3], ['glassa', 2], ['pentolaunica', 1], ['funghi', 2]]),
      M([['ananas', 3], ['hawaiana', 3], ['pepperoni', 3]]),
      M([['cappuccino', 3], ['surgelata', 2], ['fantasma', 2], ['pentola', 1], ['macchiata', 2], ['prosciutto', 2]]),
      M([['cappuccino', 3], ['scatoletta', 3], ['alfredo', 2], ['pentolaunica', 2], ['forbici', 2], ['olio', 2]]),
      M([['cappuccino', 3], ['surgelata', 3], ['ananas', 3], ['smartphone', 3], ['glassa', 2], ['broccoli', 2]]),
      M([['cappuccino', 3], ['surgelata', 3], ['fantasma', 3], ['pentola', 2], ['alfredo', 2], ['frappe', 2], ['filante', 2]]),
      M([['panna', 2], ['ketchup', 3], ['ananas_pezzo', 3], ['pastachips', 3]]),
    ],
    events: [
      T(20, 'Welcome to the Food Court. Everything here is a crime.'),
      E(100, 'ring', 'pastachips', 24),
      E(160, 'elite', 'surgelata'),
      E(230, 'stampede', 'pastachips', 26),
      E(275, 'elite', 'pentolaunica'),
      E(400, 'ring', 'pastachips', 40),
      E(460, 'elite', 'fantasma'),
      E(520, 'wall', 'scatoletta', 20),
      E(570, 'elite', 'surgelata'),
      T(660, "It's after 11:00 — cappuccino is now ILLEGAL.", 'warn'),
      E(662, 'ring', 'cappuccino', 22),
      E(760, 'elite', 'alfredo'),
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

/** Every minute's pool must draw ≥ 80 % of its weight from the dish's intruders (finale exempt). */
export function stageRuleProblems(): string[] {
  const out: string[] = [];
  for (const st of STAGES) {
    const r: RecipeDef | undefined = recipeById(st.recipe);
    if (!r) { out.push(st.id + ': no recipe'); continue; }
    if (st.waves.length !== 16) out.push(`${st.id}: ${st.waves.length} wave minutes (want 16)`);
    if (st.id === 'foodcourt') continue;
    st.waves.forEach((w, m) => {
      let tot = 0, intr = 0;
      for (const [id, wt] of w.pool) {
        tot += wt;
        if (intruderIn(r, id)) intr += wt;
        else if (!r.extras.includes(id)) out.push(`${st.id} m${m}: ${id} is neither an intruder nor an extra`);
      }
      if (tot > 0 && intr / tot < 1 - MAX_EXTRA_SHARE - 1e-6) out.push(`${st.id} m${m}: intruders ${(100 * intr / tot).toFixed(0)}% < 80%`);
    });
    for (const ev of st.events) if (ev.enemy && ev.kind !== 'toast' && !intruderIn(r, ev.enemy) && !r.extras.includes(ev.enemy)) out.push(`${st.id} @${ev.at}: event enemy ${ev.enemy} not an intruder`);
    // weight order (see the header)
    const sh = intruderShares(st, r);
    const ranked = r.intruders.map((i) => i.enemy).filter((id) => !ORDER_EXEMPT.has(id));
    for (let i = 0; i + 1 < ranked.length; i++) {
      const a = sh.get(ranked[i]) ?? 0, b = sh.get(ranked[i + 1]) ?? 0;
      if (b > a * ORDER_TOL + 0.005) out.push(`${st.id}: ${ranked[i + 1]} ${(b * 100).toFixed(0)}% outweighs ${ranked[i]} ${(a * 100).toFixed(0)}% (weight order)`);
    }
    for (const id of ranked) if (!sh.get(id)) out.push(`${st.id}: intruder ${id} never spawns`);
  }
  if (STAGES.length !== RECIPES.length) out.push(`stages ${STAGES.length} vs recipes ${RECIPES.length}`);
  return out;
}
