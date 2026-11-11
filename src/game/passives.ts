/** Passive items (stat boosters) + permanent pantry power-ups + characters. */
import type { PassiveDef, CharacterDef, StatMod } from './types';
import type { SaveData } from '../core/save';
import { dishWon } from './stages';

export const PASSIVES: Record<string, PassiveDef> = {};
function P(d: PassiveDef) {
  PASSIVES[d.id] = d;
}

P({ id: 'olio', name: 'Olio Extra Vergine', short: '+10% Might', desc: 'Cold-pressed liquid gold. Everything hits harder.', icon: 'icon.p.olio', maxLevel: 5, mods: [{ stat: 'might', add: 0.1 }] });
P({ id: 'espresso', name: 'Espresso', short: '−8% Cooldown', desc: 'Short, strong, standing at the bar. Weapons reload faster.', icon: 'icon.p.espresso', maxLevel: 5, mods: [{ stat: 'cooldown', add: -0.08 }] });
P({ id: 'grembiule', name: 'Grembiule della Nonna', short: '+1 Armor', desc: "Nonna's apron. Has survived worse than you.", icon: 'icon.p.grembiule', maxLevel: 5, mods: [{ stat: 'armor', add: 1 }] });
P({ id: 'sanmarzano', name: 'Pomodoro San Marzano', short: '+20% Max HP', desc: 'Grown in volcanic soil under Vesuvius. Pure vitality.', icon: 'icon.p.sanmarzano', maxLevel: 5, mods: [{ stat: 'maxHp', mul: 1.2 }] });
P({ id: 'minestrone', name: 'Minestrone', short: '+0.25 HP/s', desc: 'A bowl of soup cures everything. Slowly regenerates health.', icon: 'icon.p.minestrone', maxLevel: 5, mods: [{ stat: 'recovery', add: 0.25 }] });
P({ id: 'grattugia', name: 'Grattugia', short: '+10% Area', desc: 'Grate generously. Attacks cover more ground.', icon: 'icon.p.grattugia', maxLevel: 5, mods: [{ stat: 'area', add: 0.1 }] });
P({ id: 'semola', name: 'Semola di Grano Duro', short: '+10% Duration', desc: 'Durum-wheat semolina: holds its shape. Effects last longer.', icon: 'icon.p.semola', maxLevel: 5, mods: [{ stat: 'duration', add: 0.1 }] });
P({ id: 'macinapepe', name: 'Macinapepe', short: '+1 Amount', desc: 'Another twist of the pepper mill. Fires extra projectiles.', icon: 'icon.p.macinapepe', maxLevel: 2, mods: [{ stat: 'amount', add: 1 }] });
P({ id: 'vespa', name: 'Motorino', short: '+10% Speed', desc: 'Keys to a vintage Italian scooter. Move faster.', icon: 'icon.p.vespa', maxLevel: 5, mods: [{ stat: 'moveSpeed', add: 0.1 }] });
P({ id: 'cornicello', name: 'Cornicello', short: '+10% Luck', desc: 'A red Neapolitan lucky horn. Never buy your own — but this one was a gift.', icon: 'icon.p.cornicello', maxLevel: 5, mods: [{ stat: 'luck', add: 0.1 }] });
P({ id: 'ricettario', name: 'Ricettario della Nonna', short: '+8% Growth', desc: "Nonna's handwritten recipe book. Learn faster.", icon: 'icon.p.ricettario', maxLevel: 5, mods: [{ stat: 'growth', add: 0.08 }] });
P({ id: 'profumo', name: 'Profumo di Ragù', short: '+25% Magnet', desc: 'Sunday ragù simmering for six hours. Ingredients come to you.', icon: 'icon.p.profumo', maxLevel: 5, mods: [{ stat: 'magnet', add: 0.25 }] });
P({ id: 'sale', name: 'Sale Grosso', short: '+10% Proj. Speed', desc: 'Coarse sea salt for the pasta water. Projectiles fly faster.', icon: 'icon.p.sale', maxLevel: 5, mods: [{ stat: 'speed', add: 0.1 }] });
P({ id: 'salvadanaio', name: 'Salvadanaio', short: '+15% Greed', desc: 'A ceramic piggy bank. More coins from everything.', icon: 'icon.p.salvadanaio', maxLevel: 5, mods: [{ stat: 'greed', add: 0.15 }] });

// ---------------------------------------------------------------------------
// LA DISPENSA — permanent power-ups bought with coins
// ---------------------------------------------------------------------------

export interface PowerupDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  maxRank: number;
  baseCost: number;
  mods: StatMod[]; // per rank
  special?: 'reroll' | 'skip' | 'banish';
}

export const POWERUPS: PowerupDef[] = [
  { id: 'might', name: 'Olio', icon: 'icon.p.olio', desc: '+5% Might per rank', maxRank: 5, baseCost: 200, mods: [{ stat: 'might', add: 0.05 }] },
  { id: 'armor', name: 'Grembiule', icon: 'icon.p.grembiule', desc: '+1 Armor per rank', maxRank: 3, baseCost: 600, mods: [{ stat: 'armor', add: 1 }] },
  { id: 'maxhp', name: 'San Marzano', icon: 'icon.p.sanmarzano', desc: '+10% Max HP per rank', maxRank: 3, baseCost: 200, mods: [{ stat: 'maxHp', mul: 1.1 }] },
  { id: 'recovery', name: 'Minestrone', icon: 'icon.p.minestrone', desc: '+0.1 HP/s per rank', maxRank: 5, baseCost: 200, mods: [{ stat: 'recovery', add: 0.1 }] },
  { id: 'cooldown', name: 'Espresso', icon: 'icon.p.espresso', desc: '−2.5% Cooldown per rank', maxRank: 2, baseCost: 900, mods: [{ stat: 'cooldown', add: -0.025 }] },
  { id: 'area', name: 'Grattugia', icon: 'icon.p.grattugia', desc: '+5% Area per rank', maxRank: 2, baseCost: 300, mods: [{ stat: 'area', add: 0.05 }] },
  { id: 'speed', name: 'Sale Grosso', icon: 'icon.p.sale', desc: '+10% Projectile speed per rank', maxRank: 2, baseCost: 300, mods: [{ stat: 'speed', add: 0.1 }] },
  { id: 'duration', name: 'Semola', icon: 'icon.p.semola', desc: '+15% Duration per rank', maxRank: 2, baseCost: 300, mods: [{ stat: 'duration', add: 0.15 }] },
  { id: 'amount', name: 'Macinapepe', icon: 'icon.p.macinapepe', desc: '+1 Projectile', maxRank: 1, baseCost: 5000, mods: [{ stat: 'amount', add: 1 }] },
  { id: 'move', name: 'Motorino', icon: 'icon.p.vespa', desc: '+5% Move speed per rank', maxRank: 2, baseCost: 300, mods: [{ stat: 'moveSpeed', add: 0.05 }] },
  { id: 'magnet', name: 'Profumo', icon: 'icon.p.profumo', desc: '+25% Magnet per rank', maxRank: 2, baseCost: 300, mods: [{ stat: 'magnet', add: 0.25 }] },
  { id: 'luck', name: 'Cornicello', icon: 'icon.p.cornicello', desc: '+10% Luck per rank', maxRank: 3, baseCost: 600, mods: [{ stat: 'luck', add: 0.1 }] },
  { id: 'growth', name: 'Ricettario', icon: 'icon.p.ricettario', desc: '+3% Growth per rank', maxRank: 5, baseCost: 900, mods: [{ stat: 'growth', add: 0.03 }] },
  { id: 'greed', name: 'Salvadanaio', icon: 'icon.p.salvadanaio', desc: '+10% Greed per rank', maxRank: 5, baseCost: 200, mods: [{ stat: 'greed', add: 0.1 }] },
  { id: 'revival', name: 'Bis!', icon: 'icon.revival', desc: 'Revive once per run ("a second helping")', maxRank: 1, baseCost: 10000, mods: [{ stat: 'revival', add: 1 }] },
  { id: 'reroll', name: 'Rimescola', icon: 'icon.reroll', desc: '+2 Rerolls per run', maxRank: 5, baseCost: 1000, mods: [], special: 'reroll' },
  { id: 'skip', name: 'Salta', icon: 'icon.skip', desc: '+2 Skips per run', maxRank: 5, baseCost: 100, mods: [], special: 'skip' },
  { id: 'banish', name: 'Via!', icon: 'icon.banish', desc: '+1 Banish per run', maxRank: 5, baseCost: 100, mods: [], special: 'banish' },
];

/** Cost of the next rank (prices rise with total ranks bought, like a real pantry). */
export function powerupCost(p: PowerupDef, rank: number, totalBought: number): number {
  return Math.round((p.baseCost * (1 + rank) * (1 + totalBought * 0.1)) / 10) * 10;
}

// ---------------------------------------------------------------------------
// CHARACTERS
// ---------------------------------------------------------------------------

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'enzo', name: 'Chef Enzo', title: 'Il Capo', sprite: 'chef.enzo', portrait: 'portrait.enzo', weapon: 'mattarello',
    bio: 'Head chef of Trattoria da Enzo. Has never once put cream in a carbonara and never will.',
    mods: [{ stat: 'might', add: 0.1 }], bonusText: '+10% Might', unlock: null, voice: 'angry', radius: 14,
  },
  {
    id: 'nonna', name: 'Nonna Pina', title: 'La Nonna', sprite: 'chef.nonna', portrait: 'portrait.nonna', weapon: 'ciabatta',
    bio: 'Eighty-seven years old. Her slipper has a longer range than most artillery.',
    mods: [{ stat: 'armor', add: 1 }, { stat: 'recovery', add: 0.3 }, { stat: 'moveSpeed', add: -0.1 }],
    bonusText: '+1 Armor, +0.3 HP/s, −10% Speed', unlock: { text: 'Survive 5 minutes in any dish', check: (s: SaveData) => s.bestTime >= 300 }, voice: 'nonna', radius: 13,
  },
  {
    id: 'peppe', name: 'Peppe', title: 'Il Pizzaiolo', sprite: 'chef.peppe', portrait: 'portrait.peppe', weapon: 'pizza',
    bio: 'Neapolitan pizza maker. Spins dough at 400 rpm. Pineapple is a personal insult.',
    mods: [{ stat: 'area', add: 0.15 }], bonusText: '+15% Area', unlock: { text: 'Defeat 1,000 crimes in total', check: (s: SaveData) => s.totalKills >= 1000 }, voice: 'happy', radius: 15,
  },
  {
    id: 'sofia', name: 'Sofia', title: 'La Romana', sprite: 'chef.sofia', portrait: 'portrait.sofia', weapon: 'forchette',
    bio: 'Roman trattoria cook. Guanciale, pecorino, eggs, pepper. That is the list. There is no other list.',
    mods: [{ stat: 'cooldown', add: -0.08 }], bonusText: '−8% Cooldown', unlock: { text: 'Win the Carbonara', check: (s: SaveData) => dishWon(s, 'carbonara') || (s.records.kitchen?.wins ?? 0) > 0 }, voice: 'angry', radius: 13,
  },
  {
    id: 'tommaso', name: "Fra' Tommaso", title: 'Il Casaro', sprite: 'chef.tommaso', portrait: 'portrait.tommaso', weapon: 'forma',
    bio: 'Monk and cheesemaker. Ages his Parmigiano 36 months and his patience even longer.',
    mods: [{ stat: 'maxHp', mul: 1.25 }, { stat: 'recovery', add: 0.2 }], bonusText: '+25% Max HP, +0.2 HP/s', unlock: { text: 'Collect 1,000 coins in total', check: (s: SaveData) => s.totalCoins >= 1000 }, voice: 'happy', radius: 15,
  },
  {
    id: 'concetta', name: 'Zia Concetta', title: 'La Calabrese', sprite: 'chef.concetta', portrait: 'portrait.concetta', weapon: 'peperoncino',
    bio: 'Fiery Calabrian aunt. Her chilli jars come with a legal disclaimer.',
    mods: [{ stat: 'luck', add: 0.15 }, { stat: 'might', add: 0.1 }], bonusText: '+15% Luck, +10% Might', unlock: { text: "Win the Amatriciana", check: (s: SaveData) => dishWon(s, 'amatriciana') || (s.records.trattoria?.wins ?? 0) > 0 }, voice: 'angry', radius: 14,
  },
  {
    id: 'micio', name: 'Micio', title: 'Il Gatto', sprite: 'chef.micio', portrait: 'portrait.micio', weapon: 'basilico',
    bio: "The trattoria's cat. Unpaid, unbothered, and the only one allowed to sit on the counter.",
    mods: [{ stat: 'moveSpeed', add: 0.2 }, { stat: 'magnet', add: 0.3 }, { stat: 'maxHp', mul: 0.85 }], bonusText: '+20% Speed, +30% Magnet, −15% Max HP', unlock: { text: 'Win the Margherita', check: (s: SaveData) => dishWon(s, 'margherita') || (s.records.streets?.wins ?? 0) > 0 }, voice: 'cat', radius: 12,
  },
];

export function charById(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
