/** Stage definitions and wave scripts (15 minutes each). */
import type { MusicId } from '../audio/audio';

export interface WaveMinute {
  /** [enemyId, weight] */
  pool: [string, number][];
  /** spawns per second (at curse 1) */
  rate: number;
  /** soft cap of alive enemies */
  max: number;
}

export type EventKind = 'ring' | 'wall' | 'stampede' | 'swarm' | 'elite' | 'toast';

export interface StageEvent {
  at: number; // seconds
  kind: EventKind;
  enemy?: string;
  count?: number;
  text?: string;
}

export interface StageDef {
  id: string;
  num: number;
  name: string;
  subtitle: string;
  desc: string;
  env: string;
  music: MusicId;
  hpBase: number;
  hpGrowth: number;
  dmgBase: number;
  bosses: { at: number; id: string }[];
  finalBoss: string;
  waves: WaveMinute[];
  events: StageEvent[];
  unlockAfter: string | null;
  /** darkness ramp over the run (streets: sunset → night) */
  nightRamp?: [number, number];
  accent: string;
}

const W = (rate: number, max: number, ...pool: [string, number][]): WaveMinute => ({ pool, rate, max });

export const STAGES: StageDef[] = [
  {
    id: 'kitchen',
    num: 1,
    name: 'La Cucina',
    subtitle: 'The Kitchen',
    desc: 'Service has started and the crimes are coming through the back door. Protect the carbonara!',
    env: 'kitchen',
    music: 'kitchen',
    hpBase: 1,
    hpGrowth: 0.11,
    dmgBase: 1,
    bosses: [
      { at: 300, id: 'b_ketchup' },
      { at: 600, id: 'b_alfredo' },
      { at: 900, id: 'b_panna' },
    ],
    finalBoss: 'b_panna',
    waves: [
      W(0.8, 22, ['spezzato', 6], ['ketchup', 1]),
      W(1.3, 38, ['spezzato', 5], ['ketchup', 1], ['piselli', 2]),
      W(1.9, 56, ['spezzato', 4], ['ketchup', 1], ['panna', 3], ['piselli', 2]),
      W(2.3, 66, ['panna', 3], ['forbici', 2], ['spezzato', 3], ['bacon', 2]),
      W(2.7, 78, ['forbici', 3], ['bacon', 3], ['scotta', 2], ['ketchup', 1]),
      W(2.3, 70, ['ketchup', 1], ['spezzato', 4], ['scotta', 2], ['piselli', 3]),
      W(3.1, 96, ['scotta', 3], ['cipolla', 2], ['bacon', 2], ['piselli', 3]),
      W(3.4, 108, ['cipolla', 3], ['aglio', 1], ['panna', 3], ['forbici', 2], ['pentola', 1]),
      W(3.8, 126, ['aglio', 2], ['cipolla', 3], ['scotta', 3], ['ketchup', 1], ['bacon', 2]),
      W(4.1, 138, ['parmesan', 2], ['panna', 3], ['cipolla', 3], ['forbici', 3], ['pentola', 1]),
      W(3.4, 120, ['panna', 3], ['alfredo', 1], ['aglio', 2], ['scotta', 2]),
      W(4.5, 156, ['cappuccino', 3], ['cipolla', 2], ['parmesan', 2], ['forbici', 2], ['spezzato', 2]),
      W(4.9, 176, ['cappuccino', 3], ['alfredo', 2], ['aglio', 2], ['bacon', 3], ['piselli', 2]),
      W(5.3, 196, ['cappuccino', 2], ['alfredo', 2], ['cipolla', 3], ['parmesan', 2], ['forbici', 3], ['scotta', 2], ['pentola', 1]),
      W(5.8, 216, ['cappuccino', 3], ['alfredo', 2], ['cipolla', 3], ['aglio', 2], ['forbici', 3], ['panna', 3]),
      W(3, 120, ['panna', 3], ['cappuccino', 2], ['piselli', 3]),
    ],
    events: [
      { at: 20, kind: 'toast', text: 'Service has started! Survive until 15:00.' },
      { at: 90, kind: 'ring', enemy: 'piselli', count: 22 },
      { at: 150, kind: 'elite', enemy: 'panna' },
      { at: 210, kind: 'wall', enemy: 'spezzato', count: 18 },
      { at: 270, kind: 'elite', enemy: 'forbici' },
      { at: 390, kind: 'ring', enemy: 'piselli', count: 36 },
      { at: 450, kind: 'elite', enemy: 'cipolla' },
      { at: 510, kind: 'stampede', enemy: 'spezzato', count: 26 },
      { at: 560, kind: 'elite', enemy: 'scotta' },
      { at: 660, kind: 'toast', text: "It's after 11:00 — cappuccino is now ILLEGAL." },
      { at: 662, kind: 'ring', enemy: 'cappuccino', count: 16 },
      { at: 750, kind: 'elite', enemy: 'alfredo' },
      { at: 810, kind: 'ring', enemy: 'cipolla', count: 26 },
      { at: 860, kind: 'elite', enemy: 'cappuccino' },
      { at: 870, kind: 'elite', enemy: 'aglio' },
    ],
    unlockAfter: null,
    accent: '#e8442f',
  },
  {
    id: 'trattoria',
    num: 2,
    name: 'La Trattoria',
    subtitle: 'The Dining Room',
    desc: 'Candlelight, checkered tablecloths… and a pineapple at table six. Defend the pizza!',
    env: 'trattoria',
    music: 'trattoria',
    hpBase: 1.6,
    hpGrowth: 0.13,
    dmgBase: 1.15,
    bosses: [
      { at: 300, id: 'b_scatolone' },
      { at: 600, id: 'b_deepdish' },
      { at: 900, id: 'b_ananas' },
    ],
    finalBoss: 'b_ananas',
    waves: [
      W(1.0, 26, ['hawaiana', 3], ['pepperoni', 2], ['spezzato', 3]),
      W(1.7, 46, ['hawaiana', 3], ['pepperoni', 3], ['pollo', 2]),
      W(2.1, 60, ['pollo', 3], ['pepperoni', 3], ['ananas_pezzo', 3], ['macchiata', 1]),
      W(2.5, 72, ['ananas', 2], ['pollo', 3], ['hawaiana', 3], ['macchiata', 2]),
      W(2.9, 84, ['polpetta', 2], ['ananas', 2], ['vongola', 2], ['pepperoni', 3]),
      W(2.5, 76, ['hawaiana', 3], ['polpetta', 2], ['pepperoni', 3]),
      W(3.3, 104, ['vongola', 3], ['polpetta', 3], ['ananas', 2], ['macchiata', 2]),
      W(3.6, 116, ['ananas', 3], ['pollo', 3], ['parmesan', 2], ['vongola', 2]),
      W(4, 132, ['polpetta', 3], ['hawaiana', 3], ['ananas', 2], ['macchiata', 2], ['pepperoni', 2]),
      W(4.4, 146, ['ananas', 3], ['vongola', 3], ['parmesan', 2], ['polpetta', 3]),
      W(3.6, 126, ['hawaiana', 3], ['pollo', 3], ['pepperoni', 3]),
      W(4.8, 166, ['cappuccino', 3], ['ananas', 3], ['polpetta', 2], ['vongola', 2]),
      W(5.2, 186, ['cappuccino', 3], ['ananas', 3], ['macchiata', 2], ['pollo', 3], ['pepperoni', 2]),
      W(5.6, 206, ['cappuccino', 2], ['ananas', 3], ['polpetta', 3], ['parmesan', 2], ['hawaiana', 3]),
      W(6.1, 226, ['cappuccino', 3], ['ananas', 4], ['vongola', 3], ['pollo', 3], ['macchiata', 2]),
      W(3.2, 130, ['ananas_pezzo', 4], ['hawaiana', 3], ['pepperoni', 3]),
    ],
    events: [
      { at: 20, kind: 'toast', text: 'Table six ordered a Hawaiian. Brace yourself.' },
      { at: 100, kind: 'ring', enemy: 'pepperoni', count: 20 },
      { at: 160, kind: 'elite', enemy: 'pollo' },
      { at: 220, kind: 'stampede', enemy: 'pollo', count: 18 },
      { at: 270, kind: 'elite', enemy: 'ananas' },
      { at: 400, kind: 'ring', enemy: 'ananas_pezzo', count: 34 },
      { at: 460, kind: 'elite', enemy: 'polpetta' },
      { at: 520, kind: 'wall', enemy: 'polpetta', count: 14 },
      { at: 570, kind: 'elite', enemy: 'vongola' },
      { at: 660, kind: 'toast', text: "It's after 11:00 — cappuccino is now ILLEGAL." },
      { at: 662, kind: 'ring', enemy: 'cappuccino', count: 18 },
      { at: 760, kind: 'elite', enemy: 'ananas' },
      { at: 820, kind: 'stampede', enemy: 'pollo', count: 30 },
      { at: 865, kind: 'elite', enemy: 'polpetta' },
    ],
    unlockAfter: 'kitchen',
    accent: '#c9a227',
  },
  {
    id: 'streets',
    num: 3,
    name: 'I Vicoli di Napoli',
    subtitle: 'The Alleys of Naples',
    desc: 'Laundry overhead, scooters everywhere, and a food influencer filming crimes on every corner.',
    env: 'streets',
    music: 'streets',
    hpBase: 2.2,
    hpGrowth: 0.15,
    dmgBase: 1.25,
    bosses: [
      { at: 300, id: 'b_campanile' },
      { at: 600, id: 'b_deepdish' },
      { at: 900, id: 'b_influencer' },
    ],
    finalBoss: 'b_influencer',
    waves: [
      W(1.0, 26, ['pastachips', 4], ['pepperoni', 1], ['spezzato', 2]),
      W(1.4, 38, ['pastachips', 3], ['pepperoni', 2], ['spezzato', 2], ['piselli', 2]),
      W(1.9, 54, ['glassa', 2], ['pastachips', 3], ['pepperoni', 2], ['smartphone', 1]),
      W(2.4, 70, ['glassa', 2], ['macchiata', 1], ['frappe', 1], ['pollo', 2], ['pastachips', 2]),
      W(2.9, 84, ['scatoletta', 1], ['glassa', 2], ['smartphone', 2], ['pastachips', 3], ['frappe', 1]),
      W(2.7, 80, ['frappe', 3], ['pastachips', 3], ['macchiata', 2]),
      W(3.5, 108, ['scatoletta', 3], ['fantasma', 2], ['glassa', 2], ['polpetta', 2]),
      W(3.9, 122, ['smartphone', 3], ['frappe', 3], ['pentolaunica', 1], ['fantasma', 2]),
      W(4.3, 138, ['macchiata', 3], ['glassa', 3], ['pollo', 3], ['pastachips', 3], ['vongola', 2]),
      W(4.7, 152, ['scatoletta', 3], ['smartphone', 3], ['fantasma', 2], ['frappe', 3]),
      W(3.9, 132, ['macchiata', 3], ['pastachips', 3], ['glassa', 2]),
      W(5.1, 172, ['cappuccino', 3], ['frappe', 3], ['smartphone', 2], ['scatoletta', 2], ['vongola', 2]),
      W(5.5, 192, ['cappuccino', 3], ['fantasma', 3], ['glassa', 2], ['pentolaunica', 1], ['pollo', 2]),
      W(6, 212, ['cappuccino', 3], ['scatoletta', 3], ['smartphone', 3], ['frappe', 3], ['pastachips', 2]),
      W(6.5, 232, ['cappuccino', 3], ['macchiata', 3], ['glassa', 3], ['smartphone', 3], ['fantasma', 2]),
      W(3.4, 140, ['smartphone', 3], ['pastachips', 4], ['frappe', 2]),
    ],
    events: [
      { at: 20, kind: 'toast', text: 'Sunset over Naples. The influencers are filming.' },
      { at: 100, kind: 'ring', enemy: 'pastachips', count: 30 },
      { at: 160, kind: 'elite', enemy: 'frappe' },
      { at: 230, kind: 'stampede', enemy: 'frappe', count: 14 },
      { at: 275, kind: 'elite', enemy: 'smartphone' },
      { at: 400, kind: 'ring', enemy: 'scatoletta', count: 18 },
      { at: 460, kind: 'elite', enemy: 'glassa' },
      { at: 520, kind: 'wall', enemy: 'pastachips', count: 26 },
      { at: 570, kind: 'elite', enemy: 'fantasma' },
      { at: 660, kind: 'toast', text: "It's after 11:00 — cappuccino is now ILLEGAL." },
      { at: 662, kind: 'ring', enemy: 'cappuccino', count: 20 },
      { at: 760, kind: 'elite', enemy: 'macchiata' },
      { at: 820, kind: 'ring', enemy: 'smartphone', count: 16 },
      { at: 865, kind: 'elite', enemy: 'frappe' },
    ],
    unlockAfter: 'trattoria',
    nightRamp: [0.15, 0.62],
    accent: '#3f7fd8',
  },
  {
    id: 'foodcourt',
    num: 4,
    name: 'La Food Court',
    subtitle: 'The Lair of Crimes',
    desc: 'Where every crime is born: neon, plastic trays and pasta in a can. End it here.',
    env: 'foodcourt',
    music: 'foodcourt',
    hpBase: 2.9,
    hpGrowth: 0.17,
    dmgBase: 1.4,
    bosses: [
      { at: 300, id: 'b_microonde' },
      { at: 600, id: 'b_ananas' },
      { at: 900, id: 'b_fusione' },
    ],
    finalBoss: 'b_fusione',
    waves: [
      W(1.0, 26, ['spezzato', 3], ['pastachips', 3], ['piselli', 2]),
      W(1.4, 40, ['pastachips', 3], ['fantasma', 2], ['spezzato', 2], ['panna', 2]),
      W(1.9, 56, ['pentola', 1], ['fantasma', 2], ['macchiata', 1], ['panna', 2], ['spezzato', 3]),
      W(2.5, 74, ['surgelata', 1], ['glassa', 2], ['frappe', 1], ['scatoletta', 1], ['panna', 2], ['ketchup', 1]),
      W(3.2, 92, ['pentola', 1], ['fantasma', 2], ['smartphone', 2], ['ananas', 2], ['parmesan', 2]),
      W(2.8, 84, ['scatoletta', 3], ['ketchup', 3], ['pastachips', 3]),
      W(3.6, 112, ['surgelata', 2], ['pentolaunica', 2], ['alfredo', 2], ['forbici', 2]),
      W(4, 126, ['fantasma', 3], ['scatoletta', 2], ['cipolla', 2], ['polpetta', 2], ['pentola', 1]),
      W(4.4, 142, ['surgelata', 2], ['ananas', 3], ['macchiata', 2], ['frappe', 3]),
      W(4.8, 156, ['vongola', 2], ['scatoletta', 3], ['smartphone', 3], ['glassa', 2], ['pentolaunica', 1]),
      W(4, 136, ['ananas', 3], ['hawaiana', 3], ['pepperoni', 3]),
      W(5.2, 176, ['cappuccino', 3], ['surgelata', 2], ['fantasma', 2], ['pentola', 1], ['macchiata', 2]),
      W(5.6, 196, ['cappuccino', 3], ['scatoletta', 3], ['alfredo', 2], ['pentolaunica', 2], ['forbici', 2]),
      W(6.1, 216, ['cappuccino', 3], ['surgelata', 3], ['ananas', 3], ['smartphone', 3], ['glassa', 2]),
      W(6.6, 240, ['cappuccino', 3], ['surgelata', 3], ['fantasma', 3], ['pentola', 2], ['alfredo', 2], ['frappe', 2]),
      W(3.6, 150, ['panna', 2], ['ketchup', 3], ['ananas_pezzo', 3], ['pastachips', 3]),
    ],
    events: [
      { at: 20, kind: 'toast', text: 'Welcome to the Food Court. Everything here is a crime.' },
      { at: 100, kind: 'ring', enemy: 'pastachips', count: 24 },
      { at: 160, kind: 'elite', enemy: 'surgelata' },
      { at: 230, kind: 'stampede', enemy: 'pastachips', count: 26 },
      { at: 275, kind: 'elite', enemy: 'pentolaunica' },
      { at: 400, kind: 'ring', enemy: 'pastachips', count: 40 },
      { at: 460, kind: 'elite', enemy: 'fantasma' },
      { at: 520, kind: 'wall', enemy: 'scatoletta', count: 20 },
      { at: 570, kind: 'elite', enemy: 'surgelata' },
      { at: 660, kind: 'toast', text: "It's after 11:00 — cappuccino is now ILLEGAL." },
      { at: 662, kind: 'ring', enemy: 'cappuccino', count: 22 },
      { at: 760, kind: 'elite', enemy: 'alfredo' },
      { at: 820, kind: 'ring', enemy: 'ananas', count: 14 },
      { at: 860, kind: 'elite', enemy: 'surgelata' },
      { at: 870, kind: 'elite', enemy: 'pentola' },
    ],
    unlockAfter: 'streets',
    accent: '#d93fd0',
  },
];

export function stageById(id: string): StageDef {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

export const STAGE_LENGTH = 900;
