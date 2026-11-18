/**
 * Short first-sighting toasts: "Panna nella Carbonara? NO! Yolk, Pecorino and pasta water make it creamy."
 *
 * Every short reason below is a condensed form of the intruder's `line` / `why` in
 * src/game/recipes.ts (which come from the recipe research dataset): no new facts, no
 * real names, and contested items keep their nuance ("purists", "the row simmers").
 * Toasts read "<it> <inDish>? NO! <reason>" and stay within ~80 characters, so they fit
 * on one or two lines on a phone. The full reasons are in the Ricettario.
 *
 * Every toast says in English what the intruder is: in its reason ("chicken is a second course"),
 * or, where the reason has no room for it, as a gloss after the Italian name ("Piselli (peas)
 * nella Carbonara? NO!", see GLOSS).
 *
 * The dish's extras (the snapped spaghetti, the cold pot…) are not intruders: their toast names a
 * crime of method, never an ingredient "in" the dish (see EXTRA).
 */
import { ENEMIES } from './enemies';
import type { RecipeDef, RecipeIntruder } from './recipes';

/** dish id → enemy id → short reason */
const SIGHTING: Record<string, Record<string, string>> = {
  pomodoro: {
    ketchup: "Voted Italy's worst food crime of all.",
    polpetta: 'A second course in Italy.',
    pollo: 'In Italy chicken is a second course.',
  },
  carbonara: {
    panna: 'Yolk, Pecorino and pasta water make it creamy.',
    cipolla: 'Just guanciale, egg, Pecorino and pepper.',
    bacon: 'It wants guanciale: cured pork cheek.',
    aglio: "Purists ban it (though 1954's recipe had a clove).",
    parmesan: 'Pecorino leads; a little blend is fine.',
    pollo: 'Guanciale is the only meat.',
    piselli: 'A classic fake-carbonara add-on.',
    funghi: 'Not Roman: a frequent foreign add-on.',
    prosciutto: 'Cooked ham is not guanciale.',
    burro: 'The fat is rendered guanciale.',
  },
  alfredo: {
    panna: "It's just butter and Parmigiano.",
    pollo: "'Chicken Alfredo' is unknown in Rome.",
    alfredo: "That's the US chain version.",
    broccoli: 'Lovely in other pasta, not here.',
    gamberi: 'A US restaurant add-on.',
    aglio: 'It came with the US cream version.',
    parmesan: 'Only real Parmigiano Reggiano.',
  },
  amatriciana: {
    aglio: 'The EU recipe rules (STG) exclude it.',
    cipolla: "2020's EU rules say no. The row simmers.",
    bacon: 'The EU recipe rules (STG) want guanciale.',
    parmesan: "It's finished with pecorino.",
  },
  cacioepepe: {
    burro: 'Pecorino, pepper, pasta water. Basta.',
    panna: 'The cream is Pecorino whipped with water.',
    parmesan: "'Cacio' here means Pecorino Romano.",
    olio: 'Purists say no oil: the cheese is the fat.',
  },
  margherita: {
    ananas: 'Not in the EU or AVPN rules.',
    hawaiana: "The 'Hawaiian' is from Canada, 1962.",
    macchiata: 'Its tomato is raw crushed tomato.',
    pollo: 'Almost nowhere in Italian pizzerias.',
    bbq: "Italian pizzerias simply don't use it.",
    cheddar: 'Mozzarella or fior di latte only.',
    pepperoni: 'In Italy you may get bell peppers.',
  },
  marinara: {
    filante: 'The Marinara has no cheese at all.',
    gamberi: "'Marinara' means sailors' pizza, not seafood.",
    vongola: "Sailors' pizza: no seafood on it.",
    parmesan: 'Grated cheese is for the Margherita.',
    cheddar: 'No cheese at all, least of all cheddar.',
  },
  ragu: {
    fantasma: 'Bologna serves it on fresh egg tagliatelle.',
    aglio: "Bologna's registered recipe forbids it.",
    panna: "Bologna's rule: no cream on tagliatelle.",
    bacon: 'The recipe wants fresh pancetta.',
  },
  pesto: {
    panna: "Seven raw ingredients, and cream isn't one.",
    anacardo: 'Pine nuts! Cashews mark an imitation jar.',
    olio: 'Extra-virgin olive oil, ideally Ligurian.',
    burro: "Today's Genoese pesto uses olive oil only.",
    parmesan: 'It wants Parmigiano (or Grana) and pecorino.',
  },
  vongole: {
    vongola: 'A near-universal rule: it hides the clams.',
    parmesan: 'The classic tourist mistake.',
    burro: 'Neapolitan vongole use only olive oil.',
    panna: 'Clam juice and pasta starch make it creamy.',
  },
};

/**
 * dish id → enemy id → English gloss, for the toasts whose reason never says in English what the
 * intruder is: "Burro (butter) nel Pesto? NO! Today's Genoese pesto uses olive oil only."
 */
const GLOSS: Record<string, Record<string, string>> = {
  pomodoro: { polpetta: 'meatballs' },
  carbonara: { cipolla: 'onion', pollo: 'chicken', piselli: 'peas', funghi: 'mushrooms', burro: 'butter' },
  alfredo: { panna: 'cream', gamberi: 'shrimp', aglio: 'garlic' },
  amatriciana: { aglio: 'garlic', cipolla: 'onion' },
  cacioepepe: { burro: 'butter' },
  margherita: { pollo: 'chicken' },
  ragu: { aglio: 'garlic' },
  pesto: { burro: 'butter' },
  vongole: { burro: 'butter' },
};

/**
 * Toast-sized names, where dropping the explanation would change the meaning: the crime in a
 * carbonara is Parmigiano *instead of* pecorino (a little in the blend is fine).
 */
const SHORT_NAME: Record<string, Record<string, string>> = {
  carbonara: { parmesan: 'Solo Parmigiano' },
};

/** The intruder's Italian name without its explanation: "Panna (crema)" → "Panna". */
export function shortIntruderName(i: RecipeIntruder, home?: RecipeDef): string {
  return (home && SHORT_NAME[home.id]?.[i.enemy]) ?? i.it.replace(/\s*\(.*\)\s*$/, '');
}

/**
 * First-sighting toast: "Panna nella Carbonara? NO! Yolk, Pecorino and pasta water make it creamy."
 * `home` is the dish the crime is about (the finale's intruders come from other dishes).
 */
export function sightingToast(home: RecipeDef, i: RecipeIntruder): string {
  const gloss = GLOSS[home.id]?.[i.enemy];
  const head = `${shortIntruderName(i, home)}${gloss ? ` (${gloss})` : ''} ${home.inDish}? NO!`;
  const reason = SIGHTING[home.id]?.[i.enemy];
  if (reason) return head + ' ' + reason;
  // no short line yet: the dataset line when it is short enough, else just the head
  return i.line.length + head.length < 90 ? head + ' ' + i.line : head;
}

/**
 * The extras of the dishes (RecipeDef.extras): enemy id → [the crime in Italian, short reason].
 * They are crimes of method (how not to cook or eat it) or other crimes around the dish, not
 * ingredients that do not belong in it, so the toast reads "<crime>? NO! <reason>" with no dish.
 * Every reason is a condensed form of the enemy's card (info.crime / info.why in enemies.ts): no
 * new facts. The same ~80 characters as the intruders' toasts.
 */
const EXTRA: Record<string, [it: string, reason: string]> = {
  spezzato: ['Spezzare gli spaghetti', 'Never snap long pasta: it softens into the pot.'],
  forbici: ['Tagliare gli spaghetti', 'Twirl them on a fork: no knife, no scissors.'],
  scotta: ['Pasta scotta', 'Overcooked and mushy. Pasta should be al dente, with a bite.'],
  scotta_mini: ['Sciacquare la pasta', 'Rinsing washes off the starch that makes sauce cling.'],
  pentola: ['Pasta in acqua fredda', 'Never cold water: it goes in at a rolling boil.'],
  pentolaunica: ['Tutto in una pentola', 'One-pot pasta: Italians build the sauce separately.'],
  scatoletta: ['Carbonara in scatola', 'Canned? Carbonara is an emulsion made to order.'],
  surgelata: ['Lasagna surgelata', 'A Sunday ritual: hours in the oven, not a frozen brick.'],
  ananas_pezzo: ['Ananas in scatola', 'Tinned pineapple chunks: not even in small pieces.'],
  polpetta: ['Spaghetti con polpette', 'In Italy meatballs are a main course on their own.'],
  smartphone: ['Ricette virali', 'Every year a viral video sends Italians to the comment box.'],
  cappuccino: ['Cappuccino a pranzo', 'Breakfast only, though Italians argue how strictly.'],
  frappe: ['Frappè gigante', 'Italian coffee is an espresso, not a dessert in disguise.'],
  glassa: ['Glassa balsamica', 'Real balsamic is aged 12 years or more, a drop at a time.'],
  pastachips: ['Patatine di pasta', 'A 2021 trend: pasta air-fried into crisps. Minor crime.'],
  alfredo: ['Salsa Alfredo in barattolo', 'Jarred cream-and-chicken Alfredo is American.'],
  macchiata: ['Ketchup sulla pizza', "The pizza version of Italians' number one food crime."],
  hawaiana: ['Pizza hawaiana', 'Ham and pineapple: born in Ontario, Canada, in 1962.'],
  pepperoni: ['Pizza "pepperoni"', 'In Italian, peperoni are bell peppers. Order a diavola.'],
};

/** Extras that are crimes of method: how the dish is cooked or eaten, not what is put in it. */
const METHOD = new Set(['spezzato', 'forbici', 'scotta', 'scotta_mini', 'pentola', 'pentolaunica', 'scatoletta', 'surgelata']);

/** Are all of these extras crimes of method ("Crimini di metodo"), or a mixed lot ("Altri crimini")? */
export function allMethodCrimes(extras: string[]): boolean {
  return extras.every((id) => METHOD.has(id));
}

/** An extra's crime in Italian, as its toast names it: "Spezzare gli spaghetti" (else the enemy's name). */
export function extraName(enemyId: string): string {
  return EXTRA[enemyId]?.[0] ?? ENEMIES[enemyId]?.name ?? enemyId;
}

/**
 * First-sighting toast of an extra: "Spezzare gli spaghetti? NO! Never snap long pasta: it softens
 * into the pot." An extra with no line of its own gets its card's crime.
 */
export function extraToast(enemyId: string): string {
  const x = EXTRA[enemyId];
  return x ? `${x[0]}? NO! ${x[1]}` : `${ENEMIES[enemyId]?.info.crime ?? extraName(enemyId)}? NO!`;
}
