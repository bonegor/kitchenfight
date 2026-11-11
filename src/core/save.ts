/** Persistent save data (localStorage, fault-tolerant). */

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  shake: boolean;
  damageNumbers: boolean;
  flashes: boolean;
  bubbles: boolean;
  quality: 'high' | 'low';
  showFps: boolean;
}

export interface StageRecord {
  bestTime: number;
  wins: number;
  bestKills: number;
  bestLevel: number;
  /** Il Menù: every real ingredient of the dish was collected in a run (★ on the menu) */
  perfect?: boolean;
}

export interface SaveData {
  version: number;
  coins: number;
  totalCoins: number;
  totalKills: number;
  runs: number;
  wins: number;
  bestTime: number;
  kills: Record<string, number>;
  seen: string[];
  unlockedChars: string[];
  unlockedStages: string[];
  records: Record<string, StageRecord>;
  powerups: Record<string, number>;
  achievements: string[];
  lastChar: string;
  lastStage: string;
  settings: Settings;
}

const KEY = 'kitchenfight.save.v1';
/** Save format version: 2 = Il Menù (dishes replace the four stages). */
export const SAVE_VERSION = 2;

/**
 * Legacy stage ids (v1) → the dishes whose records/wins they carry over to (v2).
 * Kept here (not in game data) so the save loads without the game modules.
 */
const LEGACY_TO_DISHES: Record<string, string[]> = {
  kitchen: ['pomodoro', 'carbonara'],
  trattoria: ['margherita'],
  streets: ['marinara'],
  foodcourt: ['foodcourt'],
};
const LEGACY_LAST: Record<string, string> = { kitchen: 'carbonara', trattoria: 'margherita', streets: 'marinara', foodcourt: 'foodcourt' };

function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function defaultSave(): SaveData {
  const calm = prefersReducedMotion();
  return {
    version: SAVE_VERSION,
    coins: 0,
    totalCoins: 0,
    totalKills: 0,
    runs: 0,
    wins: 0,
    bestTime: 0,
    kills: {},
    seen: [],
    unlockedChars: ['enzo'],
    unlockedStages: ['pomodoro'],
    records: {},
    powerups: {},
    achievements: [],
    lastChar: 'enzo',
    lastStage: 'pomodoro',
    settings: {
      master: 0.8,
      music: 0.7,
      sfx: 0.8,
      shake: !calm,
      damageNumbers: true,
      flashes: !calm,
      bubbles: true,
      quality: 'high',
      showFps: false,
    },
  };
}

function merge<T extends object>(base: T, loaded: Partial<T>): T {
  const out: any = { ...base };
  for (const k of Object.keys(loaded) as (keyof T)[]) {
    const v = loaded[k];
    if (v === undefined || v === null) continue;
    const b = (base as any)[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && typeof v === 'object' && !Array.isArray(v)) out[k] = merge(b, v as any);
    else out[k] = v;
  }
  return out;
}

/**
 * v1 → v2 (Il Menù): legacy stage records are copied to the dishes they map to (the
 * legacy entries stay, so 'legacy record ids also count' checks keep working), the
 * unlocked list restarts from the first dish (+ the finale if it was already open: it
 * is never taken away), and lastStage moves to the mapped dish. The caller then adds
 * every dish whose unlock rule the carried-over wins satisfy (stages.ts refreshUnlocks).
 */
export function migrateSave(s: SaveData): SaveData {
  if ((s.version ?? 1) >= SAVE_VERSION) return s;
  for (const [legacy, dishes] of Object.entries(LEGACY_TO_DISHES)) {
    const rec = s.records[legacy];
    if (!rec) continue;
    for (const id of dishes) {
      if (id === legacy) continue;
      const cur = s.records[id];
      s.records[id] = cur
        ? { bestTime: Math.max(cur.bestTime, rec.bestTime), wins: Math.max(cur.wins, rec.wins), bestKills: Math.max(cur.bestKills, rec.bestKills), bestLevel: Math.max(cur.bestLevel, rec.bestLevel), perfect: cur.perfect }
        : { bestTime: rec.bestTime, wins: rec.wins, bestKills: rec.bestKills, bestLevel: rec.bestLevel };
    }
  }
  const hadFinale = s.unlockedStages.includes('foodcourt');
  s.unlockedStages = ['pomodoro', ...(hadFinale ? ['foodcourt'] : [])];
  if (LEGACY_LAST[s.lastStage]) s.lastStage = LEGACY_LAST[s.lastStage];
  s.version = SAVE_VERSION;
  return s;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    // a v1 save has no 'version' 2: the defaults must not mask its legacy fields
    if (!parsed.version || parsed.version < SAVE_VERSION) {
      parsed.version = parsed.version ?? 1;
      return migrateSave(merge({ ...defaultSave(), version: parsed.version, unlockedStages: [], lastStage: '' }, parsed));
    }
    return merge(defaultSave(), parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(s: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — progress lives only for this session */
  }
}

export function resetSave(): SaveData {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return defaultSave();
}
