/**
 * IL MENÙ — every level is a recipe.
 *
 * The proper recipe of each dish, its real ingredients (collectible pickups that
 * buff the chef) and its intruders (the enemies that do not belong in it).
 *
 * ALL facts, reasons ('why'), one-liners ('line'), sources and quotes come from the
 * recipe research dataset (see docs/RECIPES.md). Rules kept from that research:
 *  - real people appear only as cited sources (`chef` credits, `quote.by`), never in
 *    the in-game texts (`why`, `line`, `note`, `blurb`, `method`);
 *  - `quote` is present only where the exact wording was verified against a search
 *    snippet (the research could not open the live pages; see docs/RECIPES.md);
 *  - contested items carry `contested: true` and a `note` with the other side;
 *  - things Italians accept (cream, corn or würstel on pizza, cheese on tomato pasta,
 *    garlic in pesto…) are never intruders.
 *
 * GENERATED from the research dataset by the foundation tooling, then kept by hand.
 */
import type { StatMod } from './types';

export type Course = 'Le Basi' | 'Primi Romani' | 'Le Pizze' | 'Dal Nord' | 'Dal Sud e dal Mare' | 'Il Gran Finale';

/** A cited source (article, official text, chef's recipe). */
export interface RecipeSource {
  name: string;
  url: string;
  lang?: string;
  year?: string;
  /** an Italian chef / creator behind this source (credit only) */
  chef?: string;
}

export type IngredientCategory = 'pasta' | 'tomato' | 'oil' | 'aroma' | 'herb' | 'meat' | 'egg' | 'cheese' | 'spice' | 'fat' | 'water' | 'wine' | 'veg' | 'nut' | 'sea' | 'dough';

/** A real ingredient (collectible): registry entry. */
export interface IngredientDef {
  id: string;
  /** Italian name (banner: "<it> ✓ n/m") */
  it: string;
  en: string;
  /** sprite id: 'ingr.<id>' (24×24 world units, anchor centre) */
  sprite: string;
  category: IngredientCategory;
  /** stat bonus for the rest of the run once collected */
  mods: StatMod[];
  /** readable buff text, e.g. '+5% Might' */
  buff: string;
  /** dominant colour (placeholders, UI accents) */
  color: string;
}

/** An ingredient as used in one recipe (registry entry + the dish-specific note). */
export interface RecipeIngredient extends IngredientDef {
  note?: string;
}

/** An intruder: an enemy that does not belong in this dish. */
export interface RecipeIntruder {
  /** ENEMIES id */
  enemy: string;
  /** other enemy ids that count as this intruder (e.g. pineapple chunks) */
  alias?: string[];
  it: string;
  en: string;
  /** why Italians object (Ricettario detail) */
  why: string;
  /** one-liner (first-sighting toast, cards) */
  line: string;
  /** 1..5: how loudly Italians complain (editorial estimate from the research) */
  popularity: number;
  /** Italians genuinely disagree, or the item has real historical roots */
  contested: boolean;
  /** the other side / nuance (always present when contested) */
  note?: string;
  /** best source for the claim */
  source: RecipeSource;
  /** Italian chef credited by that source (credit only) */
  chef?: string;
  /** finale only: the dish this crime comes from */
  fromDish?: string;
}

export interface RecipeQuote {
  /** verbatim (verified against a search snippet) */
  text: string;
  translation?: string;
  /** who said / wrote it (a chef, an official text, a newspaper) */
  by: string;
  source: RecipeSource;
}

export interface RecipeDef {
  id: string;
  it: string;
  en: string;
  course: Course;
  origin: string;
  /** pasta shape / base */
  shape: string;
  /** Italian preposition + dish for toasts: "Panna nella Carbonara? NO!" */
  inDish: string;
  blurb: string;
  method: string;
  /** real ingredients in collection order */
  ingredients: RecipeIngredient[];
  intruders: RecipeIntruder[];
  /** dish-relevant extras (method crimes) allowed in the waves (≤ 20 % of weight) */
  extras: string[];
  /** authority sources + Italian chefs */
  sources: RecipeSource[];
  quote?: RecipeQuote;
  funFact: string;
  /** plated dish illustration: 'dish.<id>' (~120×80 world units) */
  sprite: string;
}

// ---------------------------------------------------------------------------
// The 27 real ingredients
// ---------------------------------------------------------------------------

const ING = (id: string, it: string, en: string, category: IngredientCategory, color: string): IngredientDef => {
  const b = BUFFS[category];
  return { id, it, en, sprite: 'ingr.' + id, category, mods: b.mods, buff: b.text, color };
};

/** Buffs by category (small and readable; they stack for the rest of the run). */
export const BUFFS: Record<IngredientCategory, { mods: StatMod[]; text: string }> = {
  pasta: { mods: [{ stat: 'duration', add: 0.08 }], text: '+8% Duration' },
  dough: { mods: [{ stat: 'duration', add: 0.08 }], text: '+8% Duration' },
  tomato: { mods: [{ stat: 'maxHp', mul: 1.1 }], text: '+10% Max HP' },
  oil: { mods: [{ stat: 'might', add: 0.05 }], text: '+5% Might' },
  aroma: { mods: [{ stat: 'area', add: 0.05 }], text: '+5% Area' },
  herb: { mods: [{ stat: 'recovery', add: 0.2 }], text: '+0.2 HP/s' },
  meat: { mods: [{ stat: 'might', add: 0.06 }], text: '+6% Might' },
  egg: { mods: [{ stat: 'maxHp', mul: 1.1 }], text: '+10% Max HP' },
  cheese: { mods: [{ stat: 'armor', add: 1 }], text: '+1 Armor' },
  spice: { mods: [{ stat: 'cooldown', add: -0.05 }], text: '−5% Cooldown' },
  fat: { mods: [{ stat: 'magnet', add: 0.15 }], text: '+15% Magnet' },
  water: { mods: [{ stat: 'area', add: 0.08 }], text: '+8% Area' },
  wine: { mods: [{ stat: 'luck', add: 0.08 }], text: '+8% Luck' },
  veg: { mods: [{ stat: 'moveSpeed', add: 0.05 }], text: '+5% Move speed' },
  nut: { mods: [{ stat: 'growth', add: 0.08 }], text: '+8% Growth' },
  sea: { mods: [{ stat: 'speed', add: 0.1 }], text: '+10% Projectile speed' },
};

/** Reward for collecting every real ingredient of the dish. */
export const RECIPE_COMPLETE = { mods: [{ stat: 'might', add: 0.1 }] as StatMod[], coins: 50, text: 'Full heal, +10% Might, +50 coins' };

export const INGREDIENTS: Record<string, IngredientDef> = {};
for (const d of [
  ING('spaghetti', 'Spaghetti', 'Spaghetti', 'pasta', '#f2d27a'),
  ING('fettuccine', "Fettuccine all'uovo", 'Fresh egg fettuccine', 'pasta', '#f0c860'),
  ING('tonnarelli', 'Tonnarelli', 'Tonnarelli (square egg spaghetti)', 'pasta', '#e8c25a'),
  ING('tagliatelle', "Tagliatelle all'uovo", 'Fresh egg tagliatelle', 'pasta', '#f3cf6a'),
  ING('pomodoro', 'Pomodoro', 'Tomatoes', 'tomato', '#e8382c'),
  ING('passata', 'Passata di pomodoro', 'Tomato passata', 'tomato', '#c8281f'),
  ING('olio', 'Olio extravergine', 'Extra-virgin olive oil', 'oil', '#c9b23a'),
  ING('aglio', 'Aglio', 'Garlic', 'aroma', '#f4ecd6'),
  ING('basilico', 'Basilico', 'Basil', 'herb', '#3f9a3a'),
  ING('guanciale', 'Guanciale', 'Guanciale (cured pork cheek)', 'meat', '#e8b4a0'),
  ING('tuorli', "Tuorli d'uovo", 'Egg yolks', 'egg', '#ffb21c'),
  ING('pecorino', 'Pecorino', 'Pecorino cheese', 'cheese', '#f3ead2'),
  ING('parmigiano', 'Parmigiano Reggiano', 'Parmigiano Reggiano', 'cheese', '#f2d48a'),
  ING('pepe', 'Pepe nero', 'Black pepper', 'spice', '#3a2e28'),
  ING('burro', 'Burro', 'Butter', 'fat', '#fbe58a'),
  ING('acqua', 'Acqua di cottura', 'Starchy pasta water', 'water', '#bfe3f2'),
  ING('vino', 'Vino', 'Dry wine', 'wine', '#f1e6a8'),
  ING('peperoncino', 'Peperoncino', 'Chili', 'spice', '#d8261c'),
  ING('manzo', 'Manzo macinato', 'Coarse-ground beef', 'meat', '#8a3a2a'),
  ING('pancetta', 'Pancetta', 'Fresh pancetta', 'meat', '#f0a8a0'),
  ING('soffritto', 'Soffritto', 'Onion, carrot and celery', 'veg', '#e88a3a'),
  ING('pinoli', 'Pinoli', 'Pine nuts', 'nut', '#ecd7a8'),
  ING('vongole', 'Vongole veraci', 'Clams', 'sea', '#c9b8a0'),
  ING('prezzemolo', 'Prezzemolo', 'Parsley', 'herb', '#4caa3e'),
  ING('impasto', 'Impasto napoletano', 'Neapolitan dough', 'dough', '#f3e3c0'),
  ING('mozzarella', 'Mozzarella', 'Mozzarella (fior di latte or bufala)', 'cheese', '#fbfbf4'),
  ING('origano', 'Origano', 'Oregano', 'aroma', '#6f8a3a'),
]) INGREDIENTS[d.id] = d;

function ingr(id: string, note?: string): RecipeIngredient {
  const d = INGREDIENTS[id];
  if (!d) throw new Error('unknown ingredient ' + id);
  return note ? { ...d, note } : { ...d };
}

// ---------------------------------------------------------------------------
// The menu
// ---------------------------------------------------------------------------

export const RECIPES: RecipeDef[] = [
  {
    id: "pomodoro",
    it: "Spaghetti al Pomodoro",
    en: "Spaghetti with tomato sauce",
    course: "Le Basi",
    origin: "Southern Italy (Naples and Campania), now eaten everywhere in Italy",
    shape: "Spaghetti (any shape works)",
    inDish: "negli Spaghetti al Pomodoro",
    blurb: "Italy's everyday classic: good tomatoes, olive oil, garlic or onion, and basil. So simple that every shortcut shows.",
    method: "Soften garlic or onion (or chili) in olive oil, add the tomatoes and cook them down briefly, then salt. Finish al dente spaghetti in the pan with the sauce and a little pasta water. Add fresh basil off the heat; grated cheese at the table is optional.",
    ingredients: [ingr("spaghetti", "Any shape works"), ingr("pomodoro", "Fresh, peeled San Marzano or passata"), ingr("olio"), ingr("aglio", "Or onion, spring onion or chili: a free choice"), ingr("basilico", "Fresh, added off the heat")],
    intruders: [
      {
        enemy: "ketchup",
        it: "Ketchup",
        en: "Ketchup",
        why: "Ketchup is a sweetened, vinegared industrial sauce, not a tomato sauce. In a 17-country YouGov survey, Italians rated ketchup on pasta the single worst crime against Italian food (net score -82), worse even than starting pasta in cold water.",
        line: "Italians in a YouGov poll rated ketchup on pasta the worst food crime of all: -82.",
        popularity: 5,
        contested: false,
        source: { name: "You're doing Italian food all wrong, say Italians (YouGov)", url: "https://business.yougov.com/content/40810-italian-food-crimes", lang: "en", year: "2022" },
      },
      {
        enemy: "polpetta",
        it: "Polpette",
        en: "Meatballs (piled on the spaghetti)",
        why: "Spaghetti and meatballs is an Italian-American dish. In Italy meatballs (polpette) are a second course eaten on their own; the tomato sauce they cook in may dress the pasta, but big meatballs are not served on top of the spaghetti.",
        line: "In Italy meatballs are a second course. Spaghetti and meatballs is Italian-American.",
        popularity: 2,
        contested: true,
        note: "Italy does have pasta with tiny meatballs, such as Abruzzo's chitarra con le pallottine. The complaint is about big American-style meatballs piled on a plate of spaghetti.",
        source: { name: "Why You Shouldn't Expect To Find Spaghetti And Meatballs In Italy (Tasting Table)", url: "https://www.tastingtable.com/1190751/why-you-shouldnt-expect-to-find-spaghetti-and-meatballs-in-italy", lang: "en" },
      },
      {
        enemy: "pollo",
        it: "Pollo",
        en: "Chicken",
        why: "In an Italian meal pasta is the first course and chicken the second. A sign at a 2023 Trevi Fountain protest against foreign 'food crimes' said putting chicken on pasta is a crime in Italy.",
        line: "A 2023 Trevi Fountain protest sign said it plainly: chicken on pasta is a crime in Italy.",
        popularity: 2,
        contested: false,
        source: { name: "Group protests at the Trevi Fountain against food crimes (Italianismo)", url: "https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/", lang: "en", year: "2023" },
      },
    ],
    extras: ["spezzato", "forbici", "scotta", "scotta_mini", "pentola"],
    sources: [
      { name: "Sughi di pomodoro sciuè sciuè: 5 errori che facciamo spesso (Dissapore)", url: "https://www.dissapore.com/grande-notizia/sughi-al-pomodoro-veloci-5-errori/", lang: "it" },
      { name: "La ricetta perfetta dello chef: spaghetti alla Don Alfonso (Scatti di Gusto)", url: "https://www.scattidigusto.it/la-ricetta-perfetta-dello-chef-spaghetti-alla-don-alfonso", lang: "it", year: "2014" },
      { name: "Spaghetti al pomodoro (Giallo Zafferano blog, Amici in cucina)", url: "https://blog.giallozafferano.it/amicincucina/spaghetti-al-pomodoro/", lang: "it" },
    ],
    quote: { text: "fate appassire nell'olio quel che preferite fra cipolla, cipollotto, aglio, peperoncino", translation: "Soften in the oil whichever you prefer: onion, spring onion, garlic or chili.", by: "Dissapore", source: { name: "Sughi di pomodoro sciuè sciuè: 5 errori che facciamo spesso (Dissapore)", url: "https://www.dissapore.com/grande-notizia/sughi-al-pomodoro-veloci-5-errori/", lang: "it" } },
    funFact: "Garlic versus onion is a free choice in Italy, and grated Parmigiano on spaghetti al pomodoro is perfectly accepted (unlike on seafood pasta).",
    sprite: "dish.pomodoro",
  },
  {
    id: "carbonara",
    it: "Spaghetti alla Carbonara",
    en: "Spaghetti carbonara",
    course: "Primi Romani",
    origin: "Rome, Lazio. The first recipes were printed in the 1950s, and where the dish began is still argued over",
    shape: "Spaghetti or spaghettoni. Rigatoni and mezze maniche are common and accepted in Roman trattorie.",
    inDish: "nella Carbonara",
    blurb: "Rome's most argued-over pasta: guanciale, egg yolk, Pecorino Romano and black pepper. Its silky sauce comes from technique, not cream.",
    method: "Render guanciale until crisp. Whisk yolks with grated Pecorino and plenty of black pepper. Toss hot spaghetti with the guanciale and its fat, then, off the heat, stir in the egg mix with a splash of pasta water until glossy, not scrambled.",
    ingredients: [ingr("guanciale", "Cured pork cheek, rendered until crisp"), ingr("tuorli", "Yolks only, or yolks plus some whole eggs: both are accepted"), ingr("pecorino", "Pecorino Romano DOP. A little Parmigiano blended in is fine; a full swap is not"), ingr("pepe", "Freshly ground, and plenty of it"), ingr("spaghetti", "Rigatoni and mezze maniche are accepted in Roman trattorie")],
    intruders: [
      {
        enemy: "panna",
        it: "Panna",
        en: "Cream (and crème fraîche)",
        why: "In carbonara the creaminess comes from egg yolks, Pecorino, guanciale fat and starchy pasta water. Italian chefs say added cream makes the dish greasier and flattens its flavor. It is the most common complaint about carbonara made outside Italy.",
        line: "Carbonara gets its cream from egg yolk, Pecorino and pasta water — never from a carton.",
        popularity: 5,
        contested: false,
        note: "Cream did appear in Italian cookbook carbonaras in past decades, but Italy has abandoned the habit: it is not a living regional variant.",
        source: { name: "Vincenzo's Plate, spaghetti alla carbonara recipe page (author reply in the comments)", url: "https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/comment-page-5/", lang: "en", year: "2025" },
        chef: "Vincenzo's Plate (Vincenzo Prosperi)",
      },
      {
        enemy: "cipolla",
        it: "Cipolla",
        en: "Onion",
        why: "Roman carbonara is guanciale, egg, Pecorino and pepper, and onion is not part of it. In 2016 a French one-pot video that boiled onion with the pasta caused an outcry in Italy.",
        line: "Roman carbonara is guanciale, egg, Pecorino and pepper. Onion was the star of a 2016 French video scandal.",
        popularity: 4,
        contested: false,
        note: "A few chefs' twists and old cookbooks used onion, but it is not part of the Roman classic.",
        source: { name: "Pasta alla carbonara: 5 errori da non fare (Dissapore)", url: "https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/", lang: "it" },
      },
      {
        enemy: "bacon",
        it: "Bacon affumicato",
        en: "Smoked bacon",
        why: "Carbonara uses guanciale, cured pork cheek, which is not smoked. Bacon in place of guanciale is the swap Italians spot most often in foreign carbonara, and Coldiretti, the Italian farmers' association, names it among the typical 'fake carbonara' errors abroad.",
        line: "Guanciale is cured pork cheek, never smoked. Coldiretti names bacon a classic fake-carbonara swap.",
        popularity: 4,
        contested: false,
        source: { name: "Carbonara Day: Coldiretti, ricette taroccate in 6 ristoranti stranieri su 10 (AGI)", url: "https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/", lang: "it", year: "2024" },
      },
      {
        enemy: "aglio",
        it: "Aglio",
        en: "Garlic",
        why: "Purists say garlic's sharpness has no place in carbonara, and Roman rules lists ban it outright. Its flavor competes with the guanciale and pepper.",
        line: "Purists ban garlic from carbonara, though the first recipe printed in Italy, in 1954, used a clove.",
        popularity: 3,
        contested: true,
        note: "The first carbonara printed in Italy (La Cucina Italiana, 1954) used a clove of garlic, and some classic cookbooks kept it. Purists ban it today.",
        source: { name: "Pasta alla carbonara: 5 errori da non fare (Dissapore)", url: "https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/", lang: "it" },
      },
      {
        enemy: "parmesan",
        it: "Parmigiano (al posto del pecorino)",
        en: "Parmesan instead of Pecorino",
        why: "The cheese of Roman carbonara is Pecorino Romano, which is sharp and salty. Using only Parmigiano is a listed purist sin.",
        line: "Carbonara's cheese is Pecorino Romano. A little Parmigiano mixed in is fine; a full swap is not.",
        popularity: 3,
        contested: true,
        note: "Blending some Parmigiano or Grana Padano into the Pecorino is widely accepted, even by Rome's best-known carbonara chefs. Only a full swap draws complaints.",
        source: { name: "Italy marks Carbonara Day (ANSA English)", url: "https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html", lang: "en", year: "2017" },
      },
      {
        enemy: "pollo",
        it: "Pollo",
        en: "Chicken",
        why: "Carbonara has no meat other than guanciale. Chicken carbonara is a foreign variation: Italian coverage of American pasta lists chicken among the typical US additions, and a 2023 Trevi Fountain protest sign called chicken on pasta a crime in Italy.",
        line: "The only meat in carbonara is guanciale. Chicken carbonara is a foreign invention.",
        popularity: 3,
        contested: false,
        source: { name: "La pasta che mangiano gli americani (Il Post)", url: "https://www.ilpost.it/2021/02/28/pasta-stati-uniti/", lang: "it", year: "2021" },
      },
      {
        enemy: "piselli",
        it: "Piselli",
        en: "Peas",
        why: "Peas are not part of carbonara. Coldiretti lists frozen peas among the distortions found in restaurants abroad.",
        line: "Coldiretti lists frozen peas among the fake carbonaras served abroad. Peas belong in other pastas.",
        popularity: 2,
        contested: false,
        note: "Peas are fine in other Italian pastas, such as pasta panna, prosciutto e piselli: the complaint is only about carbonara.",
        source: { name: "La Carbonara? Con panna, piselli, burro e basilico (Il Nordest)", url: "https://www.ilnordest.it/economia/la-carbonara-con-panna-piselli-burro-e-basilico-tz2dlxce", lang: "it", year: "2024" },
      },
      {
        enemy: "funghi",
        it: "Funghi",
        en: "Mushrooms",
        why: "Mushrooms are a frequent foreign addition with no place in the Roman dish. Italian social media mocked a celebrity chef's 2020 carbonara video with mushrooms, peas and crème fraîche.",
        line: "Mushrooms helped spark a Roman revolt against a 2020 celebrity-chef carbonara video.",
        popularity: 2,
        contested: false,
        source: { name: "La carbonara di Gordon Ramsay: è rivolta a Roma e dintorni", url: "https://www.scattidigusto.it/2020/02/21/la-carbonara-di-gordon-ramsay-e-rivolta-a-roma-e-dintorni/", lang: "it", year: "2020" },
      },
      {
        enemy: "prosciutto",
        it: "Prosciutto cotto",
        en: "Cooked ham",
        why: "Cooked ham in place of guanciale is a British-style shortcut. Italian food media list ham carbonara among the common recipe 'horrors', and an Italian TV chef rejected it on live British TV.",
        line: "Cooked ham is not guanciale. Italian food media list ham carbonara among recipe 'horrors'.",
        popularity: 2,
        contested: false,
        source: { name: "Food52: We can't stop laughing at this old British TV clip (Gino D'Acampo, This Morning)", url: "https://vercel.food52.com/story/20529-we-can-t-stop-laughing-at-this-old-british-tv-clip", lang: "en", year: "2010" },
        chef: "Gino D'Acampo",
      },
      {
        enemy: "burro",
        it: "Burro",
        en: "Butter",
        why: "The fat in carbonara comes from the rendered guanciale. Coldiretti names butter among the additions found in fake carbonaras abroad.",
        line: "Carbonara's fat is rendered guanciale. Coldiretti lists butter among the add-ons of fake carbonara.",
        popularity: 2,
        contested: false,
        note: "Some top chefs brown the guanciale in a little butter; purists say the guanciale fat is enough.",
        source: { name: "Carbonara Day: Coldiretti (AGI)", url: "https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/", lang: "it", year: "2024" },
      },
    ],
    extras: ["scatoletta", "pentolaunica"],
    sources: [
      { name: "La carbonara del 1954: the first printed Italian recipe, from La Cucina Italiana (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/la-carbonara-del-1954-la-prima-ricetta-del-piatto-icona-di-roma-che-viene-da-milano-ed-e-fatta-con-laglio", lang: "it", year: "2024" },
      { name: "Carbonara, la ricetta perfetta di Luciano Monosilio (Scatti di Gusto)", url: "https://www.scattidigusto.it/carbonara-ricetta-perfetta-luciano-monosilio", lang: "it" },
      { name: "Carbonara Day, la ricetta perfetta (AGI)", url: "https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/", lang: "it", year: "2023" },
      { name: "Italy marks Carbonara Day (ANSA English)", url: "https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html", lang: "en", year: "2017" },
      { name: "Pasta alla carbonara: 5 errori da non fare (Dissapore)", url: "https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/", lang: "it" },
      { name: "Carbonara, la vera ricetta originale (Sky TG24)", url: "https://tg24.sky.it/salute-e-benessere/approfondimenti/carbonara-ricetta-originale", lang: "it" },
      { name: "History of Carbonara (Vincenzo's Plate)", url: "https://www.vincenzosplate.com/history-of-carbonara/", lang: "en" },
      { name: "Luciano Monosilio interview with his carbonara recipe (Il Fatto Quotidiano, 2016)", url: "https://www.ilfattoquotidiano.it/2016/03/31/luciano-monosilio-la-cucina-e-lavoro-la-parte-spettacolare-ce-ma-non-e-tutto/2597245/", lang: "it", year: "2016", chef: "Luciano Monosilio" },
      { name: "Pasta alla Carbonara di Luciano Monosilio (Italia Squisita video recipe)", url: "https://italiasquisita.net/it/video-ricette/pasta-alla-carbonara-di-luciano-monosilio", lang: "it", chef: "Luciano Monosilio; Italia Squisita" },
      { name: "Carbonara, la ricetta perfetta di Luciano Monosilio (Scatti di Gusto)", url: "https://www.scattidigusto.it/2018/04/05/carbonara-ricetta-perfetta-luciano-monosilio/", lang: "it", year: "2018", chef: "Luciano Monosilio" },
      { name: "King of carbonara Luciano Monosilio reveals secrets behind his dish (SCMP)", url: "https://www.scmp.com/magazines/post-magazine/article/1862632/king-carbonara-luciano-monosilio-reveals-secrets-behind-his", lang: "en", chef: "Luciano Monosilio" },
      { name: "Focus segreti MyCarbonara (Unione Italiana Food pasta makers' Carbonara Day material with chef Luciano Monosilio's '5 errori da non fare')", url: "https://welovepasta.it/wp-content/uploads/2021/03/Focus-segreti-MyCarbonara.doc", lang: "it", year: "2021", chef: "Luciano Monosilio" },
      { name: "Spaghetti alla Carbonara recipe (Vincenzo's Plate, Italian YouTube cook who campaigns for 'no cream in carbonara')", url: "https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/", lang: "en", chef: "Vincenzo's Plate (Vincenzo Prosperi)" },
      { name: "Videoricette: la carbonara di Max Mariola (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/videoricette-la-carbonara-di-max-mariola/", lang: "it", chef: "Max Mariola" },
    ],
    quote: { text: "NO CREAM IN CARBONARA!", by: "Vincenzo's Plate (Vincenzo Prosperi), Italian YouTube cook", source: { name: "Vincenzo's Plate, spaghetti alla carbonara recipe page (author reply in the comments)", url: "https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/comment-page-5/", lang: "en", year: "2025" } },
    funFact: "The first carbonara recipe printed in Italy (La Cucina Italiana, August 1954) used pancetta, Gruyère and garlic. Carbonara Day is celebrated on 6 April.",
    sprite: "dish.carbonara",
  },
  {
    id: "alfredo",
    it: "Fettuccine Alfredo",
    en: "Fettuccine Alfredo (fettuccine al burro)",
    course: "Primi Romani",
    origin: "Rome, created in a Roman restaurant in the early 1900s (sources date it between about 1907 and 1914)",
    shape: "Fresh egg fettuccine, rolled very thin",
    inDish: "nelle Fettuccine Alfredo",
    blurb: "Born in a Roman restaurant in the early 1900s: fresh fettuccine, lots of butter and Parmigiano, emulsified with pasta water. Not a drop of cream.",
    method: "Cook thin fresh egg fettuccine briefly. Toss them hard with soft butter, finely grated Parmigiano Reggiano and a little pasta water until butter and cheese melt into a silky coating. Restaurants traditionally finish it at the table.",
    ingredients: [ingr("fettuccine", "Fresh egg fettuccine, rolled very thin"), ingr("burro", "Lots of it: the family calls it \"al triplo burro\""), ingr("parmigiano", "Parmigiano Reggiano: correct here, unlike in carbonara"), ingr("acqua", "Starchy pasta water emulsifies butter and cheese")],
    intruders: [
      {
        enemy: "panna",
        it: "Panna",
        en: "Cream",
        why: "The original is only egg fettuccine, butter and Parmigiano, and its creaminess comes from emulsifying them with pasta water. Heavy cream is the American addition that defines 'Alfredo sauce' abroad and is foreign to the Roman recipe.",
        line: "Real Alfredo is fettuccine, butter and Parmigiano. The cream sauce is a later American addition.",
        popularity: 5,
        contested: false,
        source: { name: "The biggest misconception about Alfredo sauce, according to The Pasta Queen (The Daily Meal)", url: "https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen", lang: "en" },
        chef: "The Pasta Queen (Nadia Caterina Munno)",
      },
      {
        enemy: "pollo",
        it: "Pollo",
        en: "Chicken",
        why: "In Italy chicken is normally a main course, rarely a pasta topping, and 'chicken Alfredo' is unknown there. It is the US chain-restaurant version Italian creators mock most.",
        line: "In Italy chicken is a main course, not a pasta topping. 'Chicken Alfredo' is unknown in Rome.",
        popularity: 5,
        contested: false,
        source: { name: "The Pasta Queen on Alfredo misconceptions (syndicated article on Nordot; the original interview was not identified)", url: "https://nordot.app/1169279368201650965", lang: "en" },
        chef: "The Pasta Queen (Nadia Caterina Munno)",
      },
      {
        enemy: "alfredo",
        it: "Panna e pollo",
        en: "Creamy chicken 'Alfredo'",
        why: "The 'Alfredo' served abroad piles heavy cream and chicken onto the pasta. The Roman original is only egg fettuccine, butter and Parmigiano emulsified with pasta water; in Italy it is simply 'fettuccine al burro'.",
        line: "Cream AND chicken: the US chain-restaurant 'Alfredo' is the version Italian creators mock most.",
        popularity: 5,
        contested: false,
        source: { name: "The biggest misconception about Alfredo sauce, according to The Pasta Queen (The Daily Meal)", url: "https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen", lang: "en" },
        chef: "The Pasta Queen (Nadia Caterina Munno)",
      },
      {
        enemy: "broccoli",
        it: "Broccoli",
        en: "Broccoli",
        why: "Broccoli is a common American add-on to 'Alfredo' and is unknown in the Roman dish.",
        line: "Italians love pasta with broccoli, just not in Alfredo, which is only butter and Parmigiano.",
        popularity: 2,
        contested: false,
        note: "Broccoli with pasta is normal in Italy in other dishes (for example pasta e broccoli); the complaint is only about Alfredo.",
        source: { name: "La pasta che mangiano gli americani (Il Post)", url: "https://www.ilpost.it/2021/02/28/pasta-stati-uniti/", lang: "it", year: "2021" },
      },
      {
        enemy: "gamberi",
        it: "Gamberi",
        en: "Shrimp",
        why: "Seafood is a US add-on. The original has no protein and is a plain butter-and-cheese pasta.",
        line: "Fettuccine Alfredo has no protein at all. Shrimp is a US restaurant add-on.",
        popularity: 2,
        contested: false,
        source: { name: "La pasta che mangiano gli americani (Il Post)", url: "https://www.ilpost.it/2021/02/28/pasta-stati-uniti/", lang: "it", year: "2021" },
      },
      {
        enemy: "aglio",
        it: "Aglio",
        en: "Garlic",
        why: "The Roman original is just butter and Parmigiano on egg pasta. Garlic belongs to the American cream-sauce version.",
        line: "The Roman original is butter and Parmigiano on egg pasta. Garlic came with the US cream version.",
        popularity: 2,
        contested: false,
        source: { name: "Fettuccine Alfredo, la ricetta originale della pasta cremosa che piace agli americani (Dissapore)", url: "https://www.dissapore.com/ricette/fettuccine-alfredo/", lang: "it" },
      },
      {
        enemy: "parmesan",
        it: "Parmesan finto",
        en: "Imitation 'Parmesan' in a shaker",
        why: "Fettuccine Alfredo is real Parmigiano Reggiano, butter and pasta water: here Parmigiano is the hero. Coldiretti calls US-made 'Parmesan' a fake of real Parmigiano and Grana.",
        line: "Alfredo's soul is real Parmigiano Reggiano. A shaker of imitation 'Parmesan' is not.",
        popularity: 1,
        contested: false,
        note: "Only the imitation is the target: real Parmigiano is correct in Alfredo, unlike in carbonara.",
        source: { name: "MeteoWeb: Coldiretti 'Pizzeria degli Orrori'", url: "https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/", lang: "it", year: "2023" },
      },
    ],
    extras: ["scotta", "scotta_mini"],
    sources: [
      { name: "La storia delle fettuccine Alfredo (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo", lang: "it" },
      { name: "Vi racconto la storia di mio nonno Alfredo di Lelio (Gambero Rosso, Ines Di Lelio)", url: "https://www.gamberorosso.it/rubriche/storie/vi-racconto-la-storia-di-mio-nonno-alfredo-di-lelio-inventore-delle-note-fettuccine-allalfredo/", lang: "it" },
      { name: "Our history (Il Vero Alfredo, Rome)", url: "https://ilveroalfredo.it/en/?p=770", lang: "en" },
      { name: "Fettuccine Alfredo (Turismo Roma, City of Rome)", url: "https://www.turismoroma.it/it/page/fettuccine-alfredo", lang: "it" },
      { name: "The Real Alfredo (Saveur)", url: "https://www.saveur.com/article/Kitchen/The-Real-Alfredo/", lang: "en" },
      { name: "Fettuccine Alfredo (Wikipedia)", url: "https://en.wikipedia.org/wiki/Fettuccine_Alfredo", lang: "en" },
    ],
    quote: { text: "Chicken alfredo really rubs me the wrong way", by: "The Pasta Queen (Nadia Caterina Munno), Italian-born creator", source: { name: "The Pasta Queen on Alfredo misconceptions (syndicated article on Nordot; the original interview was not identified)", url: "https://nordot.app/1169279368201650965", lang: "en" } },
    funFact: "In Italy the dish is usually just 'fettuccine al burro', the plain comfort food for anyone feeling unwell. Hollywood stars tasted it on their 1920 honeymoon in Rome and made it famous in America.",
    sprite: "dish.alfredo",
  },
  {
    id: "amatriciana",
    it: "Bucatini all'Amatriciana",
    en: "Bucatini all'amatriciana",
    course: "Primi Romani",
    origin: "Amatrice (province of Rieti, Lazio); popularised in Rome",
    shape: "Spaghetti in Amatrice's own municipal (De.C.O.) recipe; bucatini is the Roman favourite; rigatoni and mezze maniche are common in Roman trattorie.",
    inDish: "nell'Amatriciana",
    blurb: "Amatrice's pride and an EU-protected speciality since 2020: guanciale, tomato, pecorino and chili. No garlic, no onion, no pancetta.",
    method: "Render guanciale strips, splash in dry white wine, then add tomatoes and chili and cook briefly. Many cooks lift the guanciale out and return it at the end so it stays crisp. Toss with spaghetti or bucatini and finish with grated pecorino.",
    ingredients: [ingr("guanciale", "Guanciale tipo Amatriciano"), ingr("pomodoro", "San Marzano, peeled or fresh"), ingr("pecorino", "Amatrice's own pecorino or Pecorino Romano"), ingr("vino", "A splash of dry white wine"), ingr("peperoncino", "Chili and/or black pepper: the STG allows both")],
    intruders: [
      {
        enemy: "aglio",
        it: "Aglio",
        en: "Garlic",
        why: "The official STG specification explicitly excludes garlic. When a celebrity chef said on Italian TV in 2015 that he adds a garlic clove, Amatrice's town council answered with a formal statement and the chef apologised.",
        line: "The EU's Amatriciana STG rules out garlic. Amatrice protested when a TV chef added a clove in 2015.",
        popularity: 5,
        contested: false,
        source: { name: "MIPAAF 2020 STG disciplinare", url: "https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf", lang: "it", year: "2020" },
      },
      {
        enemy: "cipolla",
        it: "Cipolla",
        en: "Onion",
        why: "The STG specification and the Amatrice recipe exclude onion. Its sweetness softens the sharp balance of guanciale, tomato and pecorino. In 2020 an amatriciana with onion on a national TV cooking show set off a public row.",
        line: "The 2020 EU STG excludes onion, though many old Roman recipes used it. The row still simmers.",
        popularity: 5,
        contested: true,
        note: "The liveliest debate in this dish: onion was a constant in Roman recipes until the mid-1960s and many trattorie still use it. Amatrice's own recipe (2015) and the EU STG (2020) exclude it.",
        source: { name: "Amatriciana con cipolla o senza? La diatriba (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/", lang: "it" },
      },
      {
        enemy: "bacon",
        it: "Pancetta o bacon",
        en: "Pancetta (or bacon)",
        why: "Amatriciana is made with guanciale, cured pork cheek, and the STG specification names pancetta among the excluded ingredients. Bacon, which is smoked, is even further from the recipe.",
        line: "Guanciale or nothing: the Amatriciana STG names pancetta among its excluded ingredients.",
        popularity: 4,
        contested: true,
        note: "Pancetta replaced guanciale in some recipes up to the mid-1960s and is a common home fallback, but the STG excludes it today. Smoked bacon is even further away.",
        source: { name: "MIPAAF 2020 STG disciplinare", url: "https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf", lang: "it", year: "2020" },
      },
      {
        enemy: "parmesan",
        it: "Parmigiano",
        en: "Parmesan",
        why: "Amatriciana is finished with pecorino: Amatrice pecorino or Pecorino Romano, the cheeses the specification allows. Parmigiano is milder and comes from another region.",
        line: "Amatriciana is finished with pecorino, Amatrice's own or Romano. Parmigiano is milder and from up north.",
        popularity: 2,
        contested: true,
        note: "Some recipes before the mid-1960s used Parmigiano instead of pecorino.",
        source: { name: "Disciplinare Amatriciana Tradizionale STG (Regione Veneto copy)", url: "https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345", lang: "it", year: "2020" },
      },
    ],
    extras: ["spezzato", "scotta", "scotta_mini"],
    sources: [
      { name: "MIPAAF provvedimento 13 marzo 2020: Amatriciana Tradizionale STG, disciplinare (Italian publication of the specification)", url: "https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf", lang: "it", year: "2020" },
      { name: "Disciplinare Amatriciana Tradizionale STG (copy hosted by Regione Veneto)", url: "https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345", lang: "it", year: "2020" },
      { name: "Commission Implementing Regulation (EU) 2020/395 registering 'Amatriciana Tradizionale' as a TSG (copy at ARSIAL)", url: "https://www.arsial.it/app/uploads/Reg_2020_395_STG-AmatricianaTradizionale.pdf", lang: "it", year: "2020" },
      { name: "L'Amatriciana Tradizionale è STG: l'Europa tutela la salsa dei pastori di Amatrice (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/lamatriciana-tradizionale-e-stg-leuropa-tutela-la-salsa-dei-pastori-di-amatrice", lang: "it", year: "2020" },
      { name: "Giornata internazionale dell'Amatriciana: storia e ricetta originale (Sky TG24)", url: "https://tg24.sky.it/lifestyle/2026/03/06/giornata-amatriciana-storia-ricetta-originale", lang: "it", year: "2026" },
      { name: "Storia e ricetta originale dell'amatriciana: the Amatrice De.C.O., delibera n. 27/2015 (Gazzetta del Gusto)", url: "https://gazzettadelgusto.it/ricette/salse-sughi/storia-e-ricetta-originale-dellamatriciana/?print=pdf", lang: "it" },
    ],
    quote: { text: "La \"Amatriciana Tradizionale\" a differenza di altre salse analoghe non prevede l'impiego di ingredienti quali aglio cipolla o pancetta.", translation: "Unlike other similar sauces, 'Amatriciana Tradizionale' does not use ingredients such as garlic, onion or pancetta.", by: "The EU Amatriciana Tradizionale STG specification (2020)", source: { name: "MIPAAF provvedimento 13 marzo 2020: Amatriciana Tradizionale STG, disciplinare (Italian publication of the specification)", url: "https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf", lang: "it", year: "2020" } },
    funFact: "Amatriciana has been an EU 'Traditional Speciality Guaranteed' since March 2020. After the 2016 earthquake, restaurants everywhere served 'amatriciana solidale' to help the town.",
    sprite: "dish.amatriciana",
  },
  {
    id: "cacioepepe",
    it: "Tonnarelli Cacio e Pepe",
    en: "Cacio e pepe",
    course: "Primi Romani",
    origin: "Rome and the Lazio countryside (shepherds' cooking)",
    shape: "Tonnarelli (fresh square-cut egg spaghetti, the Roman classic) or dried spaghetti; short shapes such as mezze maniche are also seen in Rome.",
    inDish: "nella Cacio e Pepe",
    blurb: "Three ingredients and nowhere to hide: Pecorino Romano, black pepper and starchy pasta water whipped into a cream. A Roman shepherds' dish.",
    method: "Toast cracked pepper and loosen it with pasta water. Whisk grated Pecorino with lukewarm (not boiling) pasta water into a paste. Finish tonnarelli in the pepper water, then off the heat toss in the cheese cream, adding water until it coats.",
    ingredients: [ingr("tonnarelli", "Or dried spaghetti"), ingr("pecorino", "Pecorino Romano DOP: 'cacio' is the old word for cheese"), ingr("pepe", "Toasted and cracked"), ingr("acqua", "Lukewarm and starchy: it makes the cream")],
    intruders: [
      {
        enemy: "burro",
        it: "Burro",
        en: "Butter",
        why: "Cacio e pepe is only Pecorino, pepper and pasta water, and the creaminess comes from the cheese emulsion. In 2025 Rome's restaurateurs protested a British food website's recipe with butter and Parmesan until it was rewritten.",
        line: "Cacio e pepe is Pecorino, pepper and pasta water. A 2025 butter recipe drew a protest to an embassy.",
        popularity: 5,
        contested: false,
        source: { name: "Caso cacio e pepe BBC (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/", lang: "it", year: "2025" },
      },
      {
        enemy: "panna",
        it: "Panna",
        en: "Cream",
        why: "Cream is a shortcut that hides a failed emulsion. In 2025 even the corrected British recipe was criticised for suggesting double cream to rescue a split sauce.",
        line: "Cacio e pepe's cream is Pecorino whipped with starchy water. Dairy cream only hides a broken sauce.",
        popularity: 4,
        contested: false,
        source: { name: "La ricetta vera della cacio e pepe (Gambero Rosso)", url: "https://www.gamberorosso.it/attualita/ricetta-vera-cacio-pepe/", lang: "it" },
      },
      {
        enemy: "parmesan",
        it: "Parmigiano",
        en: "Parmesan",
        why: "'Cacio' here means Pecorino Romano. Parmigiano in place of Pecorino was half of the 2025 British recipe scandal.",
        line: "'Cacio' here means Pecorino Romano. Swapping in Parmigiano was half of the 2025 recipe row.",
        popularity: 4,
        contested: true,
        note: "Some well-known Italian chefs blend Parmigiano with the Pecorino. Replacing the Pecorino entirely is what draws outrage.",
        source: { name: "Caso cacio e pepe BBC (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/", lang: "it", year: "2025" },
      },
      {
        enemy: "olio",
        it: "Olio d'oliva",
        en: "Olive oil",
        why: "The fat in cacio e pepe comes from the cheese, so oil is unnecessary and can split the sauce. Dissapore ran a headline calling oil in cacio e pepe an 'atrocity'.",
        line: "The fat comes from the cheese. Even Rome is split, but purists call oil in cacio e pepe a misstep.",
        popularity: 3,
        contested: true,
        note: "Even Rome is split: a famous Roman trattoria reportedly adds oil to its cacio e pepe.",
        source: { name: "Atrocità, onta, ripulsa: l'olio nella Cacio e Pepe non va (Dissapore)", url: "https://www.dissapore.com/cucina/atrocita-onta-ripulsa-lolio-nella-cacio-e-pepe-non-va/", lang: "it" },
      },
    ],
    extras: ["scotta", "scotta_mini", "pentola"],
    sources: [
      { name: "Caso cacio e pepe BBC: ricette scorrette (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/", lang: "it", year: "2025" },
      { name: "La ricetta vera della cacio e pepe (Gambero Rosso)", url: "https://www.gamberorosso.it/attualita/ricetta-vera-cacio-pepe/", lang: "it" },
      { name: "Cacio e pepe: 5 errori da non fare (Dissapore)", url: "https://www.dissapore.com/ricette/cacio-e-pepe-5-errori-da-non-fare/", lang: "it" },
      { name: "Max cucina l'Italia: Cacio e pepe (Sky TG24, Max Mariola)", url: "https://tg24.sky.it/lifestyle/ricette/cacio-e-pepe-ricetta", lang: "it" },
      { name: "Cacio e pepe: traditional or gourmet? Italia Squisita video with Claudio Gargioli (Armando al Pantheon) and Cristina Bowerman (Life in Italy)", url: "https://lifeinitaly.com/?p=55289", lang: "en" },
      { name: "Gambero Rosso: Videoricette, spaghetti cacio e pepe di Max Mariola", url: "https://www.gamberorosso.it/notizie/videoricette-spaghetti-cacio-e-pepe-di-max-mariola/", lang: "it", chef: "Max Mariola" },
    ],
    funFact: "In 2025 Italian physicists won the Ig Nobel Prize for Physics with the paper 'Phase behavior of Cacio and Pepe sauce'.",
    sprite: "dish.cacioepepe",
  },
  {
    id: "margherita",
    it: "Pizza Margherita",
    en: "Margherita pizza",
    course: "Le Pizze",
    origin: "Naples, Campania. Tradition dates it to 1889 and a royal visit; treat that as legend, as tomato-mozzarella-basil pizzas existed earlier",
    shape: "Neapolitan dough of wheat flour, water, salt and brewer's yeast (the AVPN also allows a natural starter). It is stretched by hand, never with a rolling pin or press, into a soft disc no wider than 35 cm with a raised rim (cornicione), then baked 60-90 s in a wood-fired oven at about 485 °C (EU STG figures).",
    inDish: "sulla Margherita",
    blurb: "Naples' red, white and green icon, protected as an EU STG: raw tomato, mozzarella or fior di latte, basil and olive oil on hand-stretched dough.",
    method: "Stretch the dough by hand into a disc no wider than 35 cm with a puffy rim. Spread raw crushed tomatoes, add torn fior di latte or buffalo mozzarella, a few basil leaves and olive oil. Bake 60-90 seconds in a wood-fired oven at about 485 °C.",
    ingredients: [ingr("impasto", "Stretched by hand, never with a rolling pin, no wider than 35 cm"), ingr("pomodoro", "Raw crushed peeled tomatoes"), ingr("mozzarella", "Fior di latte or buffalo mozzarella"), ingr("basilico", "A few fresh leaves"), ingr("olio", "A drizzle before the oven")],
    intruders: [
      {
        enemy: "ananas",
        alias: ["ananas_pezzo"],
        it: "Ananas",
        en: "Pineapple",
        why: "Pineapple appears in neither the EU STG nor the AVPN rules for a Margherita. Many Italians say its sweetness clashes with the acidic tomato. When a famous Naples pizzaiolo put a 'Margherita with pineapple' on his menu at the end of 2023, it caused a national row.",
        line: "Neither the EU STG nor the AVPN rules allow pineapple on a Margherita. Most Italians agree.",
        popularity: 5,
        contested: true,
        note: "A few star pizzaioli now serve pineapple creations, and a famous Naples pizzaiolo's 2023 pineapple Margherita split the city. For most Italians it is still THE pizza crime.",
        source: { name: "ANSA: Famed Naples pizza maker adds pineapple, spurring row", url: "https://ansa.it/amp/english/news/lifestyle/food_wine/2023/12/30/famed-naples-pizza-maker-adds-pineapple-spurring-row_1717aa08-bf5e-4cc7-8a36-faf3e42e72fd.html", lang: "en", year: "2023" },
      },
      {
        enemy: "hawaiana",
        it: "Prosciutto e ananas",
        en: "Ham & pineapple 'Hawaiian'",
        why: "Pineapple is the most famous 'crime' against pizza in Italian eyes: a sweet fruit on a savoury pizza. The 'Hawaiian' pizza was invented in Canada in 1962, not in Hawaii and not in Italy.",
        line: "The 'Hawaiian' was invented in Canada in 1962. Italians rated pineapple on pizza -63 in a YouGov poll.",
        popularity: 5,
        contested: true,
        note: "Cooked ham is a classic Italian pizza topping: the complaint is the pineapple.",
        source: { name: "YouGov: You're doing Italian food all wrong, say Italians (pineapple on pizza: -63 net among Italians)", url: "https://yougov.co.uk/international/articles/40810-italian-food-crimes", lang: "en", year: "2022" },
      },
      {
        enemy: "macchiata",
        it: "Ketchup",
        en: "Ketchup on pizza",
        why: "The Margherita's tomato is plain peeled tomato crushed raw. Ketchup is a cooked, sweetened, vinegary sauce. Coldiretti, the Italian farmers' association, lists using ketchup instead of tomato sauce among foreign pizza 'horrors'.",
        line: "A Margherita's tomato is raw crushed tomato. Coldiretti lists ketchup among foreign pizza horrors.",
        popularity: 3,
        contested: false,
        source: { name: "MeteoWeb: From pineapple to crickets, here is the 'Pizzeria degli Orrori' (Coldiretti/Ipsos)", url: "https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/", lang: "it", year: "2023" },
      },
      {
        enemy: "pollo",
        it: "Pollo",
        en: "Chicken on pizza",
        why: "Chicken is popular on pizza in many countries but almost never seen in Italian pizzerias. Coldiretti lists chicken pizzas abroad among its pizza 'horrors', and a fried-chicken-base 'pizza' sold by a fast-food chain was reported in Italy as a pizza that makes Italians angry.",
        line: "Chicken is everywhere on pizza abroad and almost nowhere in Italian pizzerias.",
        popularity: 3,
        contested: false,
        source: { name: "Il Post: Le pizze degli altri", url: "https://www.ilpost.it/2022/02/18/pizze-straniere-ingredienti/", lang: "it", year: "2022" },
      },
      {
        enemy: "bbq",
        it: "Salsa barbecue",
        en: "BBQ sauce",
        why: "Barbecue sauce, usually with chicken, is a foreign topping that Italian pizzerias simply do not use. In early 2022 Il Post noted that the only pizzeria chain in Italy offering barbecue chicken pizza was an American one, which left Italy that August.",
        line: "In 2022 the only pizza chain offering BBQ chicken in Italy was American. It left that summer.",
        popularity: 2,
        contested: false,
        source: { name: "Il Post: Le pizze degli altri", url: "https://www.ilpost.it/2022/02/18/pizze-straniere-ingredienti/", lang: "it", year: "2022" },
      },
      {
        enemy: "cheddar",
        it: "Cheddar",
        en: "Cheddar",
        why: "A Margherita's cheese is mozzarella or fior di latte, optionally with a little grated hard cheese. Coldiretti singles out 'Anglo-Saxon cheddar' among the wrong cheeses used on pizza abroad.",
        line: "Mozzarella or fior di latte only. Coldiretti singles out 'Anglo-Saxon cheddar' on pizza abroad.",
        popularity: 1,
        contested: false,
        source: { name: "MeteoWeb: Coldiretti 'Pizzeria degli Orrori'", url: "https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/", lang: "it", year: "2023" },
      },
      {
        enemy: "pepperoni",
        it: "\"Pepperoni\"",
        en: "'Pepperoni' (the American salami, and the word)",
        why: "There is no 'pepperoni' in Italy: the word sounds like 'peperoni', which means bell peppers. Italians order a diavola with salame piccante (spicy salami), and they find it funny that abroad the diavola is sold as 'pepperoni pizza'.",
        line: "Ask for 'pepperoni' in Italy and you may get bell peppers. A diavola uses salame piccante.",
        popularity: 2,
        contested: true,
        note: "American pepperoni is a close cousin of southern Italian spicy salami, and the diavola is Italy's equivalent. Italians mostly joke about the name and dislike the industrial product; they do not object to spicy salami on pizza.",
        source: { name: "Ooni: Why Italians don't eat pepperoni", url: "https://uk.ooni.com/blogs/ooni-insights/why-italians-dont-eat-pepperoni", lang: "en" },
      },
    ],
    extras: [],
    sources: [
      { name: "AVPN (Associazione Verace Pizza Napoletana) International Regulations 2024 (English)", url: "https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf", lang: "en", year: "2024" },
      { name: "AVPN Disciplinare 2022 (Italian)", url: "https://www.pizzanapoletana.org/public/pdf/Disciplinare_AVPN_2022.pdf", lang: "it", year: "2022" },
      { name: "Commission Regulation (EU) No 97/2010 entering 'Pizza Napoletana' in the register of Traditional Specialities Guaranteed (STG/TSG)", url: "https://eur-lex.europa.eu/eli/reg/2010/97/oj", lang: "en", year: "2010" },
      { name: "Pizza Napoletana STG: disciplinare (copy of the Gazzetta Ufficiale text), Horecanews", url: "https://horecanews.it/wp-content/uploads/2022/11/pizza-napoletana-stg.pdf", lang: "it", year: "2010" },
      { name: "Dissapore: Pizza Napoletana, the EU removes from menus pizza that does not follow the disciplinare (Reg. 2022/2313)", url: "https://www.dissapore.com/notizie/pizza-napoletana-lue-elimina-dai-menu-quella-che-non-rispetta-il-disciplinare-di-produzione/", lang: "it", year: "2022" },
      { name: "Dissapore: Pizza napoletana STG, the disciplinare changes (hand stretching only: no rolling pin, no mechanical press)", url: "https://www.dissapore.com/alimentazione/pizza-napoletana-stg-cambia-il-disciplinare-e-si-conferma-unassurdita/", lang: "it" },
      { name: "Scatti di Gusto: Mozzarella vs fiordilatte on pizza", url: "https://www.scattidigusto.it/2012/07/05/bufala-vieni-a-vedere-se-sulla-pizza-ci-va-mozzarella-o-fiordilatte/", lang: "it", year: "2012" },
    ],
    funFact: "The Margherita and the Marinara are the only pizzas codified by the EU 'Pizza Napoletana' STG, and since 2022 the name 'Pizza Napoletana' itself is reserved for pizza made to that specification.",
    sprite: "dish.margherita",
  },
  {
    id: "marinara",
    it: "Pizza Marinara",
    en: "Marinara pizza",
    course: "Le Pizze",
    origin: "Naples, Campania. It is considered the oldest of the classic Neapolitan pizzas",
    shape: "The same Neapolitan dough and wood-fired bake as the Margherita (hand-stretched, max 35 cm, raised rim).",
    inDish: "sulla Marinara",
    blurb: "The oldest classic Neapolitan pizza: tomato, garlic, oregano and olive oil. No cheese, and no seafood, whatever the name suggests.",
    method: "Stretch the Neapolitan dough by hand. Top with raw crushed tomatoes, slices of peeled garlic, a generous pinch of dried oregano and a drizzle of olive oil. Bake for about a minute in a wood-fired oven. No cheese of any kind.",
    ingredients: [ingr("impasto", "The same hand-stretched Neapolitan dough"), ingr("pomodoro", "Raw crushed peeled tomatoes"), ingr("aglio", "Sliced peeled garlic"), ingr("origano", "A generous pinch, dried"), ingr("olio", "A drizzle of extra-virgin olive oil")],
    intruders: [
      {
        enemy: "filante",
        it: "Mozzarella",
        en: "Mozzarella (any cheese)",
        why: "The marinara is defined with no cheese at all: tomato, garlic, oregano and olive oil. Its ingredients are the kind that keep well, which is why the pizza is linked to Naples' sailors. Adding mozzarella makes it a different pizza.",
        line: "The marinara has no cheese at all: tomato, garlic, oregano and olive oil.",
        popularity: 2,
        contested: false,
        source: { name: "AVPN International Regulations 2024", url: "https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf", lang: "en", year: "2024" },
      },
      {
        enemy: "gamberi",
        it: "Gamberi",
        en: "Prawns (seafood)",
        why: "Despite the name, there is no fish or seafood on a pizza marinara. 'Marinara' refers to sailors ('marinai'), who could carry its long-lasting ingredients on board, not to food from the sea.",
        line: "'Marinara' means the sailors' pizza, not seafood. There is no fish on it.",
        popularity: 2,
        contested: false,
        source: { name: "Wikipedia: Pizza marinara", url: "https://en.wikipedia.org/wiki/Pizza_marinara", lang: "en" },
      },
      {
        enemy: "vongola",
        it: "Vongole",
        en: "Clams (seafood)",
        why: "Despite the name, there is no fish or seafood on a pizza marinara. 'Marinara' refers to sailors ('marinai'), who could carry its long-lasting ingredients on board, not to food from the sea.",
        line: "'Marinara' refers to the sailors who could carry its long-lasting ingredients on board, not to food from the sea.",
        popularity: 2,
        contested: false,
        source: { name: "Napolike: History of Neapolitan pizza", url: "https://www.napolike.it/storia-della-pizza-napoletana-unesco", lang: "it" },
      },
      {
        enemy: "parmesan",
        it: "Formaggio grattugiato",
        en: "Grated cheese",
        why: "The AVPN rules give grated cheese to the Margherita, not to the Marinara, which has no cheese.",
        line: "The AVPN rules give grated cheese to the Margherita, not to the cheese-free Marinara.",
        popularity: 1,
        contested: false,
        source: { name: "AVPN International Regulations 2024", url: "https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf", lang: "en", year: "2024" },
      },
      {
        enemy: "cheddar",
        it: "Cheddar",
        en: "Cheddar",
        why: "The Marinara is tomato, garlic, oregano and olive oil, with no cheese of any kind. Italian pizza cheese is mozzarella or fior di latte, and Coldiretti singles out 'Anglo-Saxon cheddar' among the wrong cheeses used on pizza abroad.",
        line: "The Marinara has no cheese at all, least of all the 'Anglo-Saxon cheddar' Coldiretti calls out abroad.",
        popularity: 2,
        contested: false,
        source: { name: "MeteoWeb: Coldiretti 'Pizzeria degli Orrori'", url: "https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/", lang: "it", year: "2023" },
      },
    ],
    extras: ["ananas_pezzo"],
    sources: [
      { name: "AVPN International Regulations 2024 (English)", url: "https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf", lang: "en", year: "2024" },
      { name: "Commission Regulation (EU) No 97/2010, Pizza Napoletana STG", url: "https://eur-lex.europa.eu/eli/reg/2010/97/oj", lang: "en", year: "2010" },
      { name: "Wikipedia: Pizza marinara", url: "https://en.wikipedia.org/wiki/Pizza_marinara", lang: "en" },
      { name: "Napolike: History of Neapolitan pizza, from food of the poor to UNESCO heritage", url: "https://www.napolike.it/storia-della-pizza-napoletana-unesco", lang: "it" },
      { name: "Scatti di Gusto: The best marinara pizzas in Naples", url: "https://www.scattidigusto.it/pizzerie/migliori-pizze-marinara-napoli", lang: "it" },
    ],
    funFact: "Abroad, 'marinara' can mean a cooked tomato sauce or even a seafood pizza; in Naples it means tomato, garlic, oregano and oil. A basil leaf or anchovies are accepted variations.",
    sprite: "dish.marinara",
  },
  {
    id: "ragu",
    it: "Tagliatelle al Ragù",
    en: "Tagliatelle with Bolognese meat ragù",
    course: "Dal Nord",
    origin: "Bologna, Emilia-Romagna. The recipe was registered by the Accademia Italiana della Cucina in 1982 and updated in 2023",
    shape: "Fresh egg tagliatelle (the Bologna pairing). The same ragù also goes into lasagne verdi, and Bolognese custom allows it on dry pasta such as rigatoni or maccheroni. Spaghetti is the classic complaint.",
    inDish: "nel Ragù",
    blurb: "Bologna's slow-cooked meat sauce, registered by the Accademia Italiana della Cucina (1982, updated 2023) and served on fresh egg tagliatelle.",
    method: "Soften onion, carrot and celery in oil with fresh pancetta. Brown coarse ground beef, add wine, then passata and a little concentrate. Simmer 2-3 hours, adding light broth and, if you like, milk. Toss with egg tagliatelle; Parmigiano at the table.",
    ingredients: [ingr("manzo", "Coarse-ground beef; some pork is allowed"), ingr("pancetta", "Fresh pork pancetta, never smoked"), ingr("soffritto", "Onion, carrot and celery"), ingr("passata", "Plus a little double concentrate"), ingr("vino", "Red or dry white"), ingr("tagliatelle", "Fresh egg tagliatelle")],
    intruders: [
      {
        enemy: "fantasma",
        it: "Spaghetti",
        en: "Spaghetti bolognese",
        why: "In Bologna, ragù goes on fresh egg tagliatelle, whose wide, porous surface holds the meat sauce. In 2019 Bologna's mayor asked people to send him photos of 'spaghetti bolognese' from around the world, calling it a dish that does not exist.",
        line: "In Bologna, ragù goes on fresh egg tagliatelle. Spaghetti bolognese is the dish Bologna never serves.",
        popularity: 5,
        contested: true,
        note: "Bolognese custom does put ragù on dry pasta such as maccheroni, and most Italians in a 2022 YouGov survey rated ragù on spaghetti acceptable (net +81). The loudest objection comes from Bologna itself.",
        source: { name: "CBC: Mayor of Bologna, Italy, on crusade to expose fake spaghetti Bolognese", url: "https://www.cbc.ca/lite/story/1.5041024", lang: "en", year: "2019" },
      },
      {
        enemy: "aglio",
        it: "Aglio",
        en: "Garlic",
        why: "The Accademia Italiana della Cucina's registered recipe names garlic among the ingredients that are not allowed. The aromatic base of Bolognese ragù is only onion, carrot and celery.",
        line: "Bologna's registered ragù lists garlic as not allowed: the base is onion, carrot and celery only.",
        popularity: 4,
        contested: false,
        note: "Garlic is common in home meat sauces elsewhere in Italy. The exclusion is specific to the Bolognese recipe.",
        source: { name: "LaPresse: Cambia la ricetta del ragù bolognese: eccola", url: "https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/", lang: "it", year: "2023" },
      },
      {
        enemy: "panna",
        it: "Panna",
        en: "Cream",
        why: "Bologna's own heritage text says cream is ruled out for tagliatelle al ragù, and the optional softener in the registered recipe is whole milk. When a major US newspaper shared a creamy 'white Bolognese' in 2016, Italian readers protested.",
        line: "Bologna's rule: no cream on tagliatelle al ragù. Whole milk is the optional softener.",
        popularity: 3,
        contested: true,
        note: "Bolognese custom allows stirring cream into finished ragù when it dresses dry pasta, never tagliatelle: the rule is 'no cream with tagliatelle', not 'no cream ever'.",
        source: { name: "Bologna city heritage sheet: Tagliatella al ragù (PDF)", url: "https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf", lang: "it", year: "2022" },
      },
      {
        enemy: "bacon",
        it: "Pancetta affumicata",
        en: "Smoked pancetta (or bacon)",
        why: "The registered recipe uses fresh, unsmoked pork belly. Cured flat or rolled pancetta is allowed, but smoked pancetta is explicitly not, and foreign recipes often use bacon.",
        line: "The registered ragù uses fresh pancetta. Smoked pancetta, let alone bacon, is explicitly not allowed.",
        popularity: 2,
        contested: false,
        source: { name: "LaPresse: Cambia la ricetta del ragù bolognese: eccola", url: "https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/", lang: "it", year: "2023" },
      },
    ],
    extras: ["surgelata", "polpetta"],
    sources: [
      { name: "Accademia Italiana della Cucina: Ragù alla bolognese, ricetta aggiornata 20 aprile 2023 (PDF)", url: "https://accademiaitalianadellacucina.it/sites/default/files/Ragù%20alla%20bolognese%20-%20ricetta%20aggiornata%2020%20aprile%202023.pdf", lang: "it", year: "2023" },
      { name: "Accademia Italiana della Cucina: Ragù alla bolognese, updated recipe 20 April 2023 (PDF, English)", url: "https://www.accademiaitalianadellacucina.it/sites/default/files/Ragù%20alla%20bolognese%20-%20updated%20recipe_20%20April%202023.pdf", lang: "en", year: "2023" },
      { name: "Accademia Italiana della Cucina: announcement of the updated ragù recipe", url: "https://accademiaitalianadellacucina.it/en/node/62013", lang: "en", year: "2023" },
      { name: "Camera di Commercio di Bologna: press release on depositing the renewed ragù recipe (20 April 2023, PDF)", url: "https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/2023/comunicato%20stampa%20deposito%20rinnovata%20ricetta%20vero%20Ragù%20alla%20bolognese%2020%20aprile%202023.pdf", lang: "it", year: "2023" },
      { name: "LaPresse: Cambia la ricetta del ragù bolognese: eccola", url: "https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/", lang: "it", year: "2023" },
      { name: "Bologna city heritage sheet: Tagliatella al ragù (PDF)", url: "https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf", lang: "it", year: "2022" },
      { name: "Dissapore: Ragù alla bolognese, aggiornata la ricetta ufficiale: pancetta e manzo al posto della 'cartella'", url: "https://www.dissapore.com/notizie/ragu-alla-bolognese-aggiornata-la-ricetta-ufficiale-pancetta-e-manzo-al-posto-della-cartella/", lang: "it", year: "2023" },
      { name: "Sky TG24: Ragù alla bolognese, la nuova ricetta depositata ha qualche piccola variazione", url: "https://tg24.sky.it/lifestyle/2023/04/20/ragu-alla-bolognese-ricetta-originale", lang: "it", year: "2023" },
    ],
    quote: { text: "Quando il ragù è pronto, secondo l'uso bolognese, si usa aggiungere la panna se si tratta di condire paste secche. Per le tagliatelle il suo uso è da escludere.", translation: "When the ragù is ready, by Bolognese custom, cream is added if it is to dress dry pasta. For tagliatelle its use is to be ruled out.", by: "The City of Bologna's heritage sheet on tagliatella al ragù", source: { name: "Bologna city heritage sheet: Tagliatella al ragù (PDF)", url: "https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf", lang: "it", year: "2022" } },
    funFact: "Whole milk is an official, optional ingredient of the registered recipe, and so are olive oil and a light broth. Thickening with flour is forbidden, and so is brandy.",
    sprite: "dish.ragu",
  },
  {
    id: "pesto",
    it: "Trofie al Pesto Genovese",
    en: "Trofie with Genoese basil pesto",
    course: "Dal Nord",
    origin: "Genoa, Liguria",
    shape: "Trofie, trenette (often 'avvantaggiate' with potatoes and green beans), and also mandilli de sea (thin silk-handkerchief sheets), testaroli and gnocchi",
    inDish: "nel Pesto",
    blurb: "Genoa's raw green sauce: Genoese basil, olive oil, pine nuts, garlic, salt, Parmigiano and Sardinian pecorino, pounded in a marble mortar.",
    method: "Crush garlic with coarse salt in a marble mortar, then grind in basil leaves with a rotating pestle. Work in pine nuts and grated cheeses, then loosen with olive oil. Never cook it: toss off the heat with trofie or trenette, often boiled with potato and green beans.",
    ingredients: [ingr("basilico", "Basilico Genovese DOP"), ingr("pinoli", "Pine nuts: the canonical nut"), ingr("aglio", "Essential, ideally from Vessalico"), ingr("olio", "Extra-virgin, ideally Ligurian"), ingr("parmigiano", "Or Grana Padano"), ingr("pecorino", "Fiore Sardo or another Sardinian pecorino")],
    intruders: [
      {
        enemy: "panna",
        it: "Panna",
        en: "Cream",
        why: "Genoese pesto is a raw sauce of basil, olive oil, cheese, pine nuts, garlic and salt. Cream is not among those seven ingredients, and it dulls the basil. Cream against tradition is a long-running pesto argument in Italian food writing.",
        line: "Genoese pesto is seven raw ingredients, and cream is not one of them. It drowns the basil.",
        popularity: 4,
        contested: false,
        note: "Cream-enriched pesto was a common restaurant and home shortcut, so some Italians do eat it, but no Genoese authority accepts it.",
        source: { name: "Gambero Rosso: classifica dei 10 pesti genovesi (the seven-ingredient rule)", url: "https://www.gamberorosso.it/notizie/rubriche/classifiche/10-pesti-genovesi-classifica-gambero-rosso/", lang: "it" },
      },
      {
        enemy: "anacardo",
        it: "Anacardi",
        en: "Cashews",
        why: "Cheap industrial jars often replace pine nuts with cashews. Italian food media treat this as the mark of an imitation 'alla genovese' pesto.",
        line: "Pine nuts, not cashews. Italian food media call cashews the mark of an imitation pesto jar.",
        popularity: 3,
        contested: false,
        source: { name: "Dissapore: Il pesto migliore: oli vegetali, addensanti e anacardi che vi risparmiate", url: "https://www.dissapore.com/spesa/il-migliore-pesto-genovese-in-barattolo/", lang: "it" },
      },
      {
        enemy: "olio",
        it: "Olio di semi (girasole)",
        en: "Seed oil (sunflower oil)",
        why: "The recipe calls for extra-virgin olive oil, ideally Ligurian. Many commercial pestos swap in sunflower or other seed oils, which Italian food media call out.",
        line: "Pesto genovese wants extra-virgin olive oil, ideally Ligurian, not cheap seed oil.",
        popularity: 3,
        contested: false,
        source: { name: "Dissapore: Il pesto migliore: oli vegetali, addensanti e anacardi che vi risparmiate", url: "https://www.dissapore.com/spesa/il-migliore-pesto-genovese-in-barattolo/", lang: "it" },
      },
      {
        enemy: "burro",
        it: "Burro",
        en: "Butter",
        why: "Butter is not among the seven ingredients of today's Genoese pesto. A waitress at a Genoa pesto restaurant called butter in pesto 'a crime', like cream in carbonara, and when a Milan-area star chef defended butter in 2015, Genoa dismissed it as 'stuff for the Milanese'.",
        line: "Today's Genoese pesto uses olive oil only. Genoa called butter pesto 'stuff for the Milanese'.",
        popularity: 3,
        contested: true,
        note: "The first printed Genoese pesto (1863), as usually quoted, used a little butter. Today's Genoese tradition and the seven-ingredient rule exclude it.",
        source: { name: "Internazionale: Caccia al pesto perfetto", url: "https://www.internazionale.it/essenziale/notizie/tom-landolfi/2023/01/04/caccia-pesto-perfetto", lang: "it", year: "2023" },
      },
      {
        enemy: "parmesan",
        it: "Formaggio generico",
        en: "Generic or non-Italian cheese",
        why: "The cheeses of pesto genovese are Parmigiano Reggiano (or Grana Padano) and Sardinian pecorino. Genoese purists insist both be authentic and reject Gouda-based versions, and Coldiretti's lists of dishes distorted abroad complain about generic cheese in pesto.",
        line: "Pesto's cheeses are Parmigiano and Sardinian pecorino. Coldiretti decries generic cheese swaps.",
        popularity: 1,
        contested: true,
        note: "The first printed Genoese recipe, as usually quoted, mixed a Dutch cheese with Parmigiano. Modern Genoese pesto uses only Italian cheeses.",
        source: { name: "Scatti di Gusto: Diversamente pesto. La tabella dei 18 ingredienti alternativi che Roberto Panizza non consiglierebbe", url: "https://www.scattidigusto.it/ricetta-pesto-ingredienti-alternativi", lang: "it", year: "2016" },
        chef: "Roberto Panizza",
      },
    ],
    extras: ["smartphone"],
    sources: [
      { name: "Gambero Rosso: classifica dei 10 pesti genovesi (describes the Consorzio's 7-ingredient rule)", url: "https://www.gamberorosso.it/notizie/rubriche/classifiche/10-pesti-genovesi-classifica-gambero-rosso/", lang: "it" },
      { name: "Visit Italy: Pesto genovese, ricetta", url: "https://www.visititaly.eu/it/cibo-e-sapori/pesto-genovese-ricetta", lang: "it" },
      { name: "Italia.it (official tourism portal): Pesto alla genovese", url: "https://www.italia.it/it/liguria/cosa-fare/pesto-alla-genovese", lang: "it" },
      { name: "Dissapore: Il pesto è una delle salse italiane più vendute al mondo, ma non ha ancora un disciplinare", url: "https://www.dissapore.com/notizie/il-pesto-e-una-delle-salse-italiane-piu-vendute-al-mondo-ma-non-ha-ancora-un-disciplinare/", lang: "it" },
      { name: "Scatti di Gusto: Pesto al mortaio, la ricetta di Roberto Panizza (Genoese restaurateur behind the World Pesto Championship)", url: "https://www.scattidigusto.it/pesto-al-mortaio-la-ricetta-di-roberto-panizza-da-fare-a-casa/", lang: "it", year: "2019" },
      { name: "Gambero Rosso: 85-year-old Genoese woman wins the 2026 World Pesto al Mortaio Championship", url: "https://www.gamberorosso.it/notizie/attualita/donna-genovese-85-anni-vincitrice-campionato-mondiale-pesto-mortaio-2026/", lang: "it", year: "2026" },
      { name: "Associazione Palatifini: World Pesto Championship, who we are", url: "https://www.pestochampionship.it/who-we-are/?lang=en", lang: "en" },
    ],
    quote: { text: "Il burro no, è reato, non scherziamo. Sarebbe come mettere la panna nella carbonara", translation: "Butter, no, that's a crime, let's not joke. It would be like putting cream in carbonara.", by: "A waitress at a Genoa pesto restaurant, to Internazionale (2023)", source: { name: "Internazionale: Caccia al pesto perfetto", url: "https://www.internazionale.it/essenziale/notizie/tom-landolfi/2023/01/04/caccia-pesto-perfetto", lang: "it", year: "2023" } },
    funFact: "Potatoes and green beans boiled with the pasta are traditional ('trenette avvantaggiate'). Genoa even hosts a World Pesto al Mortaio Championship.",
    sprite: "dish.pesto",
  },
  {
    id: "vongole",
    it: "Spaghetti alle Vongole",
    en: "Spaghetti with clams",
    course: "Dal Sud e dal Mare",
    origin: "Naples, Campania",
    shape: "Spaghetti (also vermicelli or linguine)",
    inDish: "nelle Vongole",
    blurb: "Naples on a plate: clams, olive oil, garlic, parsley and the sea's own juices clinging to spaghetti. No cheese, no cream, no butter.",
    method: "Warm garlic (and chili) in olive oil, add the clams with a splash of white wine and cover until they open. Keep and filter the liquid. Finish very al dente spaghetti in the pan with that juice until creamy from starch alone; add parsley off the heat.",
    ingredients: [ingr("spaghetti", "Or vermicelli or linguine"), ingr("vongole", "Vongole veraci, opened in the pan; keep their juice"), ingr("aglio", "Warmed gently in the oil"), ingr("olio", "Extra-virgin olive oil: the only fat"), ingr("prezzemolo", "Added off the heat"), ingr("peperoncino", "A little chili")],
    intruders: [
      {
        enemy: "vongola",
        it: "Formaggio",
        en: "Cheese on clams",
        why: "Italians widely follow an unwritten rule: no grated aged cheese such as Parmigiano or Pecorino on fish and shellfish pasta, because it covers the delicate taste of the clams. In a 2022 YouGov survey, Italians gave cheese on seafood pasta a net score of -39. Asking for cheese on spaghetti alle vongole is the classic tourist mistake in Italian restaurants.",
        line: "No cheese on clams: in a YouGov poll Italians rated cheese on seafood pasta -39.",
        popularity: 5,
        contested: true,
        note: "A custom, not a law: a 19th-century Florentine recipe for small clams used butter and Parmigiano, and some Italian writers point to traditional fish-and-cheese dishes. For Neapolitan spaghetti alle vongole, though, the no-cheese rule is close to universal.",
        source: { name: "Italian food mistakes Americans make (Vincenzo's Plate, Italian-born YouTube cook)", url: "https://www.vincenzosplate.com/italian-food-mistakes-americans-make/", lang: "en" },
        chef: "Vincenzo's Plate (Vincenzo Prosperi)",
      },
      {
        enemy: "parmesan",
        it: "Parmigiano grattugiato",
        en: "Grated Parmesan",
        why: "Italians widely follow an unwritten rule: no grated aged cheese such as Parmigiano or Pecorino on fish and shellfish pasta, because it covers the delicate taste of the clams. In a 2022 YouGov survey, Italians gave cheese on seafood pasta a net score of -39. Asking for cheese on spaghetti alle vongole is the classic tourist mistake in Italian restaurants.",
        line: "Grated Parmigiano on clams? Asking for it is the classic tourist mistake in Italian restaurants.",
        popularity: 5,
        contested: true,
        note: "A strong custom rather than a law, but for Neapolitan vongole it is close to universal.",
        source: { name: "Gambero Rosso: New York Times, cacio e pepe con tonno", url: "https://www.gamberorosso.it/notizie/attualita/new-york-times-cacio-pepe-tonno/", lang: "it" },
      },
      {
        enemy: "burro",
        it: "Burro",
        en: "Butter",
        why: "The Neapolitan recipe uses only extra-virgin olive oil. In December 2023 a famous TV chef posted spaghetti alle vongole finished with a knob of butter, and Italian social media erupted.",
        line: "Neapolitan vongole use only olive oil. A TV chef's butter version in 2023 set Italy arguing.",
        popularity: 4,
        contested: true,
        note: "Food critics pointed to a 19th-century recipe with butter, so the debate is genuine, but butter is not part of the Neapolitan classic.",
        source: { name: "Bruno Barbieri mette il burro negli spaghetti con le vongole e scatena il panico (Dissapore)", url: "https://www.dissapore.com/notizie/bruno-barbieri-mette-il-burro-negli-spaghetti-con-le-vongole-e-scatena-il-panico/", lang: "it" },
      },
      {
        enemy: "panna",
        it: "Panna",
        en: "Cream",
        why: "The creamy sauce in spaghetti alle vongole comes only from clam juice, olive oil and pasta starch tossed together in the pan. Dairy cream is an Italian-American or foreign addition that smothers the taste of the sea.",
        line: "The creaminess comes from clam juice, olive oil and pasta starch. Cream smothers the sea.",
        popularity: 3,
        contested: false,
        source: { name: "Spaghetti alle vongole (Wikipedia)", url: "https://en.wikipedia.org/wiki/Spaghetti_alle_vongole", lang: "en" },
      },
    ],
    extras: [],
    sources: [
      { name: "In cucina: spaghetto a vongole (Italy Segreta)", url: "https://italysegreta.com/it/in-cucina-spaghetto-a-vongole/", lang: "it" },
      { name: "Spaghetti alle vongole (Wikipedia)", url: "https://en.wikipedia.org/wiki/Spaghetti_alle_vongole", lang: "en" },
      { name: "I 7 errori più frequenti che non vanno commessi quando si preparano gli spaghetti alle vongole (Centro Meteo Italiano / Il Messaggero network)", url: "https://www.centrometeoitaliano.it/attualita/i-7-errori-piu-frequenti-che-non-vanno-commessi-quando-si-preparano-gli-spaghetti-alle-vongole-175750/", lang: "it" },
      { name: "Spaghetti alle vongole, 4 errori da evitare se volete un piatto perfetto (Dissapore)", url: "https://www.dissapore.com/cucina/spaghetti-alle-vongole-4-errori-da-evitare-se-volete-un-piatto-perfetto/", lang: "it" },
    ],
    quote: { text: "If you order spaghetti alle vongole in Italy and ask for cheese on top, your waiter will look at you with an expression you will not forget.", by: "Vincenzo's Plate (Vincenzo Prosperi), Italian-born YouTube cook", source: { name: "Italian food mistakes Americans make (Vincenzo's Plate, Italian-born YouTube cook)", url: "https://www.vincenzosplate.com/italian-food-mistakes-americans-make/", lang: "en" } },
    funFact: "Naples has 'spaghetti con le vongole fujute' ('with the escaped clams'): cherry tomatoes, garlic, chili and olive oil, and no clams at all.",
    sprite: "dish.vongole",
  },
  {
    id: "foodcourt",
    it: "Il Menù degli Orrori",
    en: "The Menu of Horrors",
    course: "Il Gran Finale",
    origin: "The food court: where every crime is born",
    shape: "Nonna's pantry: one sacred ingredient from each corner of Italy",
    inDish: "nel Menù degli Orrori",
    blurb: "Not a dish: the lair of every crime on the menu. Gather Nonna's pantry, one sacred ingredient from each corner of Italy, and close the food court for good.",
    method: "Rome's guanciale, Emilia's Parmigiano, Genoa's basil, Naples' clams, Campania's tomatoes and Italy's olive oil. Keep them away from ketchup, cream and pineapple, and cook something proper.",
    ingredients: [ingr("guanciale", "From Rome"), ingr("parmigiano", "From Emilia"), ingr("basilico", "From Genoa"), ingr("vongole", "From Naples' sea"), ingr("pomodoro", "From the Campania sun"), ingr("olio", "From every corner of Italy")],
    intruders: [
      {
        enemy: "panna",
        it: "Panna",
        en: "Cream (and crème fraîche)",
        why: "In carbonara the creaminess comes from egg yolks, Pecorino, guanciale fat and starchy pasta water. Italian chefs say added cream makes the dish greasier and flattens its flavor. It is the most common complaint about carbonara made outside Italy.",
        line: "Carbonara gets its cream from egg yolk, Pecorino and pasta water — never from a carton.",
        popularity: 5,
        contested: false,
        source: { name: "Vincenzo's Plate, spaghetti alla carbonara recipe page (author reply in the comments)", url: "https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/comment-page-5/", lang: "en", year: "2025" },
        chef: "Vincenzo's Plate (Vincenzo Prosperi)",
        fromDish: "carbonara",
      },
      {
        enemy: "ketchup",
        it: "Ketchup",
        en: "Ketchup",
        why: "Ketchup is a sweetened, vinegared industrial sauce, not a tomato sauce. In a 17-country YouGov survey, Italians rated ketchup on pasta the single worst crime against Italian food (net score -82), worse even than starting pasta in cold water.",
        line: "Italians in a YouGov poll rated ketchup on pasta the worst food crime of all: -82.",
        popularity: 5,
        contested: false,
        source: { name: "You're doing Italian food all wrong, say Italians (YouGov)", url: "https://business.yougov.com/content/40810-italian-food-crimes", lang: "en", year: "2022" },
        fromDish: "pomodoro",
      },
      {
        enemy: "ananas",
        alias: ["ananas_pezzo"],
        it: "Ananas",
        en: "Pineapple",
        why: "Pineapple is the most famous 'crime' against pizza in Italian eyes: a sweet fruit on a savoury pizza. The 'Hawaiian' pizza was invented in Canada in 1962. Italian TV chefs, pizzaioli and social media have mocked it for years.",
        line: "The 'Hawaiian' was invented in Canada in 1962. Italians rated pineapple on pizza -63 in a YouGov poll.",
        popularity: 5,
        contested: true,
        note: "Since about 2017 some top Italian pizzaioli have broken the taboo, but most Italians still reject it.",
        source: { name: "YouGov: You're doing Italian food all wrong, say Italians (pineapple on pizza: -63 net among Italians)", url: "https://yougov.co.uk/international/articles/40810-italian-food-crimes", lang: "en", year: "2022" },
        fromDish: "margherita",
      },
      {
        enemy: "bacon",
        it: "Bacon affumicato",
        en: "Smoked bacon",
        why: "Carbonara uses guanciale, cured pork cheek, which is not smoked. Bacon in place of guanciale is the swap Italians spot most often in foreign carbonara, and Coldiretti, the Italian farmers' association, names it among the typical 'fake carbonara' errors abroad.",
        line: "Guanciale is cured pork cheek, never smoked. Coldiretti names bacon a classic fake-carbonara swap.",
        popularity: 4,
        contested: false,
        source: { name: "Carbonara Day: Coldiretti, ricette taroccate in 6 ristoranti stranieri su 10 (AGI)", url: "https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/", lang: "it", year: "2024" },
        fromDish: "carbonara",
      },
      {
        enemy: "cipolla",
        it: "Cipolla",
        en: "Onion",
        why: "Roman carbonara is guanciale, egg, Pecorino and pepper, and onion is not part of it. In 2016 a French one-pot video that boiled onion with the pasta caused an outcry in Italy.",
        line: "Roman carbonara is guanciale, egg, Pecorino and pepper. Onion was the star of a 2016 French video scandal.",
        popularity: 4,
        contested: false,
        source: { name: "Pasta alla carbonara: 5 errori da non fare (Dissapore)", url: "https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/", lang: "it" },
        fromDish: "carbonara",
      },
      {
        enemy: "burro",
        it: "Burro",
        en: "Butter",
        why: "Cacio e pepe is only Pecorino, pepper and pasta water, and the creaminess comes from the cheese emulsion. In 2025 Rome's restaurateurs protested a British food website's recipe with butter and Parmesan until it was rewritten.",
        line: "Cacio e pepe is Pecorino, pepper and pasta water. A 2025 butter recipe drew a protest to an embassy.",
        popularity: 5,
        contested: false,
        source: { name: "Caso cacio e pepe BBC (Gambero Rosso)", url: "https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/", lang: "it", year: "2025" },
        fromDish: "cacioepepe",
      },
      {
        enemy: "aglio",
        it: "Aglio",
        en: "Garlic",
        why: "The official STG specification explicitly excludes garlic. When a celebrity chef said on Italian TV in 2015 that he adds a garlic clove, Amatrice's town council answered with a formal statement and the chef apologised.",
        line: "The EU's Amatriciana STG rules out garlic. Amatrice protested when a TV chef added a clove in 2015.",
        popularity: 5,
        contested: false,
        source: { name: "MIPAAF 2020 STG disciplinare", url: "https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf", lang: "it", year: "2020" },
        fromDish: "amatriciana",
      },
      {
        enemy: "parmesan",
        it: "Parmigiano (al posto del pecorino)",
        en: "Parmesan instead of Pecorino",
        why: "The cheese of Roman carbonara is Pecorino Romano, which is sharp and salty. Using only Parmigiano is a listed purist sin.",
        line: "Carbonara's cheese is Pecorino Romano. A little Parmigiano mixed in is fine; a full swap is not.",
        popularity: 3,
        contested: true,
        note: "Blending some Parmigiano into the Pecorino is widely accepted. Only a full swap draws complaints.",
        source: { name: "Italy marks Carbonara Day (ANSA English)", url: "https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html", lang: "en", year: "2017" },
        fromDish: "carbonara",
      },
      {
        enemy: "fantasma",
        it: "Spaghetti",
        en: "Spaghetti bolognese",
        why: "In Bologna, ragù goes on fresh egg tagliatelle, whose wide, porous surface holds the meat sauce. Bologna's mayor once called spaghetti bolognese a dish that does not exist.",
        line: "In Bologna, ragù goes on fresh egg tagliatelle. Spaghetti bolognese is the dish Bologna never serves.",
        popularity: 5,
        contested: true,
        note: "Most Italians in a 2022 YouGov survey actually rated ragù on spaghetti acceptable (net +81). The loudest objection comes from Bologna.",
        source: { name: "CBC: Mayor of Bologna, Italy, on crusade to expose fake spaghetti Bolognese", url: "https://www.cbc.ca/lite/story/1.5041024", lang: "en", year: "2019" },
        fromDish: "ragu",
      },
      {
        enemy: "pollo",
        it: "Pollo",
        en: "Chicken",
        why: "In Italy chicken is normally a main course, rarely a pasta topping, and 'chicken Alfredo' is unknown there. It is the US chain-restaurant version Italian creators mock most.",
        line: "In Italy chicken is a main course, not a pasta topping. 'Chicken Alfredo' is unknown in Rome.",
        popularity: 5,
        contested: false,
        source: { name: "The Pasta Queen on Alfredo misconceptions (syndicated article on Nordot; the original interview was not identified)", url: "https://nordot.app/1169279368201650965", lang: "en" },
        chef: "The Pasta Queen (Nadia Caterina Munno)",
        fromDish: "alfredo",
      },
      {
        enemy: "vongola",
        it: "Formaggio",
        en: "Cheese on clams",
        why: "Italians widely follow an unwritten rule: no grated aged cheese such as Parmigiano or Pecorino on fish and shellfish pasta, because it covers the delicate taste of the clams. In a 2022 YouGov survey, Italians gave cheese on seafood pasta a net score of -39. Asking for cheese on spaghetti alle vongole is the classic tourist mistake in Italian restaurants.",
        line: "No cheese on clams: in a YouGov poll Italians rated cheese on seafood pasta -39.",
        popularity: 5,
        contested: true,
        note: "A custom, not a law, but for Neapolitan vongole it is close to universal.",
        source: { name: "Italian food mistakes Americans make (Vincenzo's Plate, Italian-born YouTube cook)", url: "https://www.vincenzosplate.com/italian-food-mistakes-americans-make/", lang: "en" },
        chef: "Vincenzo's Plate (Vincenzo Prosperi)",
        fromDish: "vongole",
      },
      {
        enemy: "piselli",
        it: "Piselli",
        en: "Peas",
        why: "Peas are not part of carbonara. Coldiretti lists frozen peas among the distortions found in restaurants abroad.",
        line: "Coldiretti lists frozen peas among the fake carbonaras served abroad. Peas belong in other pastas.",
        popularity: 2,
        contested: false,
        source: { name: "La Carbonara? Con panna, piselli, burro e basilico (Il Nordest)", url: "https://www.ilnordest.it/economia/la-carbonara-con-panna-piselli-burro-e-basilico-tz2dlxce", lang: "it", year: "2024" },
        fromDish: "carbonara",
      },
      {
        enemy: "funghi",
        it: "Funghi",
        en: "Mushrooms",
        why: "Mushrooms are a frequent foreign addition with no place in the Roman dish. Italian social media mocked a celebrity chef's 2020 carbonara video with mushrooms, peas and crème fraîche.",
        line: "Mushrooms helped spark a Roman revolt against a 2020 celebrity-chef carbonara video.",
        popularity: 2,
        contested: false,
        source: { name: "La carbonara di Gordon Ramsay: è rivolta a Roma e dintorni", url: "https://www.scattidigusto.it/2020/02/21/la-carbonara-di-gordon-ramsay-e-rivolta-a-roma-e-dintorni/", lang: "it", year: "2020" },
        fromDish: "carbonara",
      },
    ],
    extras: ["spezzato", "forbici", "scotta", "scotta_mini", "pentola", "pentolaunica", "scatoletta", "surgelata", "cappuccino", "frappe", "smartphone", "glassa", "pastachips", "alfredo", "macchiata", "hawaiana", "pepperoni", "polpetta"],
    sources: [
      { name: "You're doing Italian food all wrong, say Italians (YouGov)", url: "https://business.yougov.com/content/40810-italian-food-crimes", lang: "en", year: "2022" },
    ],
    funFact: "In a 2022 YouGov survey, Italians rated ketchup on pasta at −82, pineapple on pizza at −63 and cream in carbonara at −45. They were far kinder to ragù on spaghetti: +81.",
    sprite: "dish.foodcourt",
  },
];

export function recipeById(id: string): RecipeDef | undefined {
  return RECIPES.find((r) => r.id === id);
}

/** The intruder entry for an enemy in a dish (aliases included), if it is one. */
export function intruderIn(recipe: RecipeDef | null | undefined, enemyId: string): RecipeIntruder | undefined {
  if (!recipe) return undefined;
  return recipe.intruders.find((i) => i.enemy === enemyId || (i.alias?.includes(enemyId) ?? false));
}

/** Every dish an enemy does not belong in (for 'Non appartiene a:' chips). */
export function dishesForIntruder(enemyId: string): RecipeDef[] {
  return RECIPES.filter((r) => r.id !== 'foodcourt' && !!intruderIn(r, enemyId));
}

// ---------------------------------------------------------------------------
// Friend or foe: the same ingredient is sacred in one dish and a crime in another
// ---------------------------------------------------------------------------

export interface FriendOrFoe {
  /** INGREDIENTS id (the friend) */
  ingredient: string;
  /** ENEMIES id (the foe) */
  enemy: string;
  /** dishes where the ingredient belongs */
  friendIn: string[];
  /** dishes where it is an intruder */
  foeIn: string[];
  /** toast when the ingredient is collected (it is a crime elsewhere) */
  friendLine: string;
  /** toast when the intruder is met in a dish where it is a foe */
  foeLine: string;
}

export const FRIEND_OR_FOE: FriendOrFoe[] = [
  {
    ingredient: 'burro', enemy: 'burro', friendIn: ['alfredo'], foeIn: ['cacioepepe', 'vongole', 'pesto', 'carbonara'],
    friendLine: 'Burro! In Fettuccine Alfredo it IS the sauce. In cacio e pepe it would be a crime.',
    foeLine: 'Butter? In Fettuccine Alfredo it belongs. Not here!',
  },
  {
    ingredient: 'aglio', enemy: 'aglio', friendIn: ['pomodoro', 'marinara', 'pesto', 'vongole'], foeIn: ['amatriciana', 'carbonara', 'ragu', 'alfredo'],
    friendLine: 'Aglio! Here it belongs. In amatriciana or carbonara it would be a crime.',
    foeLine: 'Garlic! In pesto it belongs. Not here!',
  },
  {
    ingredient: 'pancetta', enemy: 'bacon', friendIn: ['ragu'], foeIn: ['carbonara', 'amatriciana'],
    friendLine: 'Pancetta! Fresh, in a Bolognese ragù, it belongs. In carbonara, guanciale rules.',
    foeLine: 'Pancetta? Fresh, in a Bolognese ragù, sì. Here it is guanciale or nothing!',
  },
  {
    ingredient: 'parmigiano', enemy: 'parmesan', friendIn: ['alfredo', 'pesto'], foeIn: ['carbonara', 'amatriciana', 'cacioepepe', 'vongole'],
    friendLine: 'Parmigiano! In Alfredo and pesto it belongs. Never on clams.',
    foeLine: 'Parmigiano? In Alfredo and pesto, sì. Here, no!',
  },
  {
    ingredient: 'mozzarella', enemy: 'filante', friendIn: ['margherita'], foeIn: ['marinara'],
    friendLine: 'Mozzarella! On a Margherita it belongs. The Marinara has no cheese at all.',
    foeLine: 'Cheese? On a Margherita, sì. The Marinara has none!',
  },
  {
    ingredient: 'soffritto', enemy: 'cipolla', friendIn: ['ragu'], foeIn: ['carbonara', 'amatriciana'],
    friendLine: 'Soffritto! Onion belongs in a Bolognese ragù. Never in carbonara.',
    foeLine: 'Onion? In a Bolognese soffritto, sì. Not here!',
  },
];
