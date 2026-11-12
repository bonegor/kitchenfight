/**
 * Short first-sighting toasts: "Panna nella Carbonara? NO! Yolk, Pecorino and pasta water make it creamy."
 *
 * Every short reason below is a condensed form of the intruder's `line` / `why` in
 * src/game/recipes.ts (which come from the recipe research dataset): no new facts, no
 * real names, and contested items keep their nuance ("purists", "the row simmers").
 * Toasts read "<it> <inDish>? NO! <reason>" and stay within ~80 characters, so they fit
 * on one or two lines on a phone. The full reasons are in the Ricettario.
 */
import type { RecipeDef, RecipeIntruder } from './recipes';

/** dish id → enemy id → short reason */
const SIGHTING: Record<string, Record<string, string>> = {
  pomodoro: {
    ketchup: "Voted Italy's worst food crime of all.",
    polpetta: "In Italy they're a second course.",
    pollo: 'In Italy chicken is a second course.',
  },
  carbonara: {
    panna: 'Yolk, Pecorino and pasta water make it creamy.',
    cipolla: "Guanciale, egg, Pecorino, pepper. That's all.",
    bacon: 'Guanciale is never smoked.',
    aglio: "Purists ban it (though 1954's recipe had a clove).",
    parmesan: 'Pecorino leads; a little blend is fine.',
    pollo: 'Guanciale is the only meat.',
    piselli: 'A classic fake-carbonara add-on.',
    funghi: 'They helped spark a 2020 Roman revolt.',
    prosciutto: 'Cooked ham is not guanciale.',
    burro: 'The fat is rendered guanciale.',
  },
  alfredo: {
    panna: 'Real Alfredo is butter and Parmigiano.',
    pollo: "'Chicken Alfredo' is unknown in Rome.",
    alfredo: "That's the US chain version.",
    broccoli: 'Lovely in other pasta, not here.',
    gamberi: 'A US restaurant add-on.',
    aglio: 'It came with the US cream version.',
    parmesan: 'Only real Parmigiano Reggiano.',
  },
  amatriciana: {
    aglio: 'The EU recipe rules (STG) exclude it.',
    cipolla: 'Excluded by the 2020 EU rules. The row simmers.',
    bacon: 'Guanciale or nothing.',
    parmesan: "It's finished with pecorino.",
  },
  cacioepepe: {
    burro: 'Pecorino, pepper, pasta water. Basta.',
    panna: 'The cream is Pecorino whipped with water.',
    parmesan: "'Cacio' here means Pecorino Romano.",
    olio: 'Purists say the fat comes from the cheese.',
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
    parmesan: 'Parmigiano and pecorino sardo only.',
  },
  vongole: {
    vongola: 'A near-universal rule: it hides the clams.',
    parmesan: 'The classic tourist mistake.',
    burro: 'Neapolitan vongole use only olive oil.',
    panna: 'Clam juice and pasta starch make it creamy.',
  },
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
  const head = `${shortIntruderName(i, home)} ${home.inDish}? NO!`;
  const reason = SIGHTING[home.id]?.[i.enemy];
  if (reason) return head + ' ' + reason;
  // no short line yet: the dataset line when it is short enough, else just the head
  return i.line.length + head.length < 90 ? head + ' ' + i.line : head;
}
