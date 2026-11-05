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
    version: 1,
    coins: 0,
    totalCoins: 0,
    totalKills: 0,
    runs: 0,
    wins: 0,
    bestTime: 0,
    kills: {},
    seen: [],
    unlockedChars: ['enzo'],
    unlockedStages: ['kitchen'],
    records: {},
    powerups: {},
    achievements: [],
    lastChar: 'enzo',
    lastStage: 'kitchen',
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

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
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
