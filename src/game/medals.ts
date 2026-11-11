/** Medaglie — achievements checked at the end of every run. */
import type { SaveData } from '../core/save';
import type { Run } from './run';
import { CHARACTERS } from './passives';
import { STAGES, dishWon } from './stages';
import { BOSS_IDS } from './enemies';

export interface Medal {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check(s: SaveData, run: Run, victory: boolean): boolean;
}

export const MEDALS: Medal[] = [
  { id: 'first', name: 'Primo Servizio', desc: 'Finish your first service.', icon: 'icon.p.grembiule', check: () => true },
  { id: 'five', name: 'Al Dente', desc: 'Survive 5 minutes.', icon: 'icon.clock', check: (_s, r) => r.time >= 300 },
  { id: 'ten', name: 'Cottura Perfetta', desc: 'Survive 10 minutes.', icon: 'icon.clock', check: (_s, r) => r.time >= 600 },
  { id: 'win', name: 'Chef Stellato', desc: 'Win any stage.', icon: 'icon.star', check: (_s, _r, v) => v },
  { id: 'thousand', name: 'Mille Crimini', desc: 'Stop 1,000 crimes in a single run.', icon: 'icon.kill', check: (_s, r) => r.kills >= 1000 },
  { id: 'evo', name: 'Evoluzione!', desc: 'Evolve a weapon.', icon: 'icon.e.tridente', check: (_s, r) => r.evolutionsDone.length > 0 },
  { id: 'six', name: 'Cucina Completa', desc: 'Carry 6 weapons at once.', icon: 'icon.w.coltelli', check: (_s, r) => r.weapons.length >= 6 },
  { id: 'pineapple', name: 'Niente Ananas', desc: 'Defeat 500 pineapples (in total).', icon: 'icon.w.pizza', check: (s) => (s.kills.ananas ?? 0) + (s.kills.ananas_pezzo ?? 0) >= 500 },
  { id: 'bosses', name: 'Il Boss sono Io', desc: 'Defeat 10 bosses (in total).', icon: 'icon.e.forma_oro', check: (s) => BOSS_IDS.reduce((n, id) => n + (s.kills[id] ?? 0), 0) >= 10 },
  { id: 'clean', name: 'Senza Panna', desc: 'Win a stage taking less than 150 damage.', icon: 'icon.p.minestrone', check: (_s, r, v) => v && r.damageTaken < 150 },
  { id: 'nonna', name: 'La Nonna Approva', desc: 'Win a stage as Nonna Pina.', icon: 'icon.w.ciabatta', check: (_s, r, v) => v && r.char.id === 'nonna' },
  { id: 'micio', name: 'Gatto Chef', desc: 'Win a stage as Micio.', icon: 'icon.w.basilico', check: (_s, r, v) => v && r.char.id === 'micio' },
  { id: 'allchefs', name: 'Tutti a Tavola', desc: 'Unlock every chef.', icon: 'icon.level', check: (s) => CHARACTERS.every((c) => s.unlockedChars.includes(c.id)) },
  { id: 'giro', name: "Giro d'Italia", desc: 'Win every dish on the menu.', icon: 'icon.e.pizza_celeste', check: (s) => STAGES.every((st) => dishWon(s, st.id)) },
  { id: 'perfetta', name: 'Ricetta Perfetta', desc: 'Collect every real ingredient and win the dish.', icon: 'icon.star', check: (_s, r, v) => v && r.recipeComplete },
  { id: 'romani', name: 'Primi Romani', desc: 'Win Carbonara, Alfredo, Amatriciana and Cacio e Pepe.', icon: 'icon.w.forchette', check: (s) => ['carbonara', 'alfredo', 'amatriciana', 'cacioepepe'].every((id) => dishWon(s, id)) },
  { id: 'pizzaiolo', name: 'Pizzaiolo DOC', desc: 'Win the Margherita and the Marinara.', icon: 'icon.w.pizza', check: (s) => ['margherita', 'marinara'].every((id) => dishWon(s, id)) },
  { id: 'quaderno', name: 'Il Quaderno della Nonna', desc: 'Complete 5 different recipes.', icon: 'icon.p.ricettario', check: (s) => STAGES.filter((st) => s.records[st.id]?.perfect).length >= 5 },
];

/** Award new medals; returns the ones earned now. */
export function awardMedals(s: SaveData, run: Run, victory: boolean): Medal[] {
  const got: Medal[] = [];
  for (const m of MEDALS) {
    if (s.achievements.includes(m.id)) continue;
    try {
      if (m.check(s, run, victory)) {
        s.achievements.push(m.id);
        got.push(m);
      }
    } catch {
      /* ignore */
    }
  }
  return got;
}
