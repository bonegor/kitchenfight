/**
 * Short texts for the Il Menù UI: card origins, course names, chip-sized dish names.
 * (The short first-sighting toasts live next to the game code, in src/game/sightings.ts.)
 */
import type { Course, RecipeDef } from '../game/recipes';

/** Card-sized origin, condensed from RecipeDef.origin. */
const ORIGIN: Record<string, string> = {
  pomodoro: 'Southern Italy (Campania)',
  carbonara: 'Rome, Lazio',
  alfredo: 'Rome, early 1900s',
  amatriciana: 'Amatrice, Lazio',
  cacioepepe: 'Rome and Lazio',
  margherita: 'Naples, Campania',
  marinara: 'Naples, Campania',
  ragu: 'Bologna, Emilia-Romagna',
  pesto: 'Genoa, Liguria',
  vongole: 'Naples, Campania',
  foodcourt: 'The food court',
};

export function shortOrigin(r: RecipeDef): string {
  return ORIGIN[r.id] ?? r.origin.split(/[.;]/)[0];
}

/** Chip-sized dish name: "Spaghetti alla Carbonara" → "Carbonara". */
const SHORT_DISH: Record<string, string> = {
  pomodoro: 'Al Pomodoro',
  carbonara: 'Carbonara',
  alfredo: 'Alfredo',
  amatriciana: 'Amatriciana',
  cacioepepe: 'Cacio e Pepe',
  margherita: 'Margherita',
  marinara: 'Marinara',
  ragu: 'Ragù',
  pesto: 'Pesto',
  vongole: 'Vongole',
  foodcourt: 'Menù degli Orrori',
};

export function shortDishName(r: RecipeDef): string {
  return SHORT_DISH[r.id] ?? r.it;
}

export const COURSE_EN: Record<Course, string> = {
  'Le Basi': 'The basics',
  'Primi Romani': 'Roman first courses',
  'Le Pizze': 'The pizzas',
  'Dal Nord': 'From the North',
  'Dal Sud e dal Mare': 'From the South and the sea',
  'Il Gran Finale': 'The grand finale',
};

/** "https://www.dissapore.com/…" → "dissapore.com" (shown next to a source link). */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
