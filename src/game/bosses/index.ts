/**
 * Il Menù boss patterns, one file per boss. ai.ts looks them up by `boss.pattern`
 * (lazily: these modules import ai.ts's helpers).
 */
import type { Pattern } from '../ai';
import { aglio } from './b_aglio';
import { burro } from './b_burro';
import { bolognese } from './b_bolognese';
import { frullatore } from './b_frullatore';
import { grattugiato } from './b_grattugiato';

export const BOSS_PATTERNS: Record<string, Pattern> = { aglio, burro, bolognese, frullatore, grattugiato };

/** Projectile sprites these bosses fire (scripts/validate.mjs requires them). */
export const BOSS_PROJECTILES = ['proj.e_clove', 'proj.e_butterpat', 'proj.e_meatball', 'proj.e_pesto', 'proj.e_cheese'];
