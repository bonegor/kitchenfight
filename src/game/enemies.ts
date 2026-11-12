/**
 * THE CRIMES — enemy roster. Every enemy is a real Italian food pet peeve
 * (see docs/RESEARCH.md). Stats are at minute 0; the director scales HP.
 */

export type BehaviorKind =
  | 'chase'
  | 'swarm'
  | 'charger'
  | 'ranged'
  | 'lobber'
  | 'hopper'
  | 'slither'
  | 'roller'
  | 'orbiter'
  | 'puddler'
  | 'kamikaze'
  | 'support'
  | 'strafe'
  | 'leaper'
  | 'summoner'
  | 'burster'
  | 'aura'
  | 'devourer'
  | 'ghost'
  | 'boss';

export interface EnemyInfo {
  /** the crime, short */
  crime: string;
  /** why Italians object */
  why: string;
  /** 1..5 */
  severity: number;
  quote?: string;
}

export interface BossDef {
  title: string;
  /** what it shouts on arrival */
  taunt: string;
  /** informational: whether a stage's final boss is decided by StageDef.finalBoss */
  final?: boolean;
  /** AI pattern id (ai.ts) */
  pattern: string;
}

export interface EnemyDef {
  id: string;
  name: string; // Italian enemy name
  en: string; // English gloss
  sprite: string;
  radius: number;
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  behavior: BehaviorKind;
  params?: Record<string, any>;
  knockResist?: number;
  /** splat decal colour: red | cream | yellow | green | brown | orange | pink */
  color?: string;
  /** particle colour for juice */
  juice?: string;
  /** debris chunk sprite suffix (fx.chunk.<chunk>) */
  chunk?: string;
  flying?: boolean;
  scale?: number;
  shadow?: number;
  /** onion layers */
  layers?: number;
  boss?: BossDef;
  info: EnemyInfo;
  /** split on death */
  split?: { into: string; count: number };
}

export const ENEMIES: Record<string, EnemyDef> = {};
function E(d: EnemyDef) {
  ENEMIES[d.id] = d;
}

// ---------------------------------------------------------------------------
// Regular crimes (names, reasons and quotes from docs/RESEARCH.md)
// ---------------------------------------------------------------------------

E({
  id: 'spezzato', name: 'Lo Spezzaspaghetti', en: 'The Spaghetti-Snapper', sprite: 'enemy.spezzato',
  radius: 10, hp: 7, speed: 78, damage: 4, xp: 1, behavior: 'swarm', params: { wobble: 0.6 },
  color: 'yellow', juice: '#f3d27a', chunk: 'bread',
  info: { crime: 'Breaking spaghetti to fit the pot', why: 'Long pasta is meant to be twirled. Snapping it leaves short, uneven pieces — just wait a few seconds and it softens into the pot by itself.', severity: 4, quote: 'TV chef Lidia Bastianich reportedly stopped a host mid-snap and called it a "criminal offense".' },
});
E({
  id: 'ketchup', name: 'Spruzzatore Rosso', en: 'The Red Squirter', sprite: 'enemy.ketchup',
  radius: 14, hp: 13, speed: 52, damage: 6, xp: 2, behavior: 'ranged', params: { min: 150, max: 260, cd: 3.4, shot: 'proj.e_ketchup', shotSpeed: 140, count: 1, spread: 0, muzzle: [4.6, -35] },
  color: 'red', juice: '#d8231f', chunk: 'plastic',
  info: { crime: 'Ketchup on pasta', why: "Sweet, vinegary and processed — the opposite of a slow-cooked tomato sauce. In a 2022 YouGov survey Italians rated it their #1 food crime (net score −82).", severity: 5, quote: '"The most distressing abuse of Italian food is having ketchup with pasta." — YouGov' },
});
E({
  id: 'panna', name: 'Panna Invasora', en: 'Invading Cream', sprite: 'enemy.panna',
  radius: 15, hp: 16, speed: 46, damage: 7, xp: 2, behavior: 'puddler', params: { puddle: 'cream', interval: 2.4, r: 26, life: 5, slow: 0.35 },
  color: 'cream', juice: '#fff4dc', chunk: 'plastic',
  info: { crime: 'Cream where it does not belong', why: 'Carbonara, cacio e pepe, Alfredo, pesto, vongole, ragù on tagliatelle: in each of them the creaminess comes from egg, cheese, oil, clam juice or starchy pasta water. A carton of cream is the shortcut Italians spot first, and it mutes everything.', severity: 5, quote: '"Basta con la panna nella carbonara!" ("Enough with cream in carbonara!") — protest sign at the Trevi Fountain, 2023' },
});
E({
  id: 'forbici', name: 'Forbici Furiose', en: 'Furious Scissors', sprite: 'enemy.forbici',
  radius: 13, hp: 15, speed: 62, damage: 8, xp: 2, behavior: 'charger', params: { range: 230, windup: 0.65, dash: 360, dashTime: 0.42, cd: 2.2 },
  color: 'pink', juice: '#c9d3e0', chunk: 'glass',
  info: { crime: 'Cutting spaghetti with scissors (or a knife)', why: 'Adults eat long pasta by twirling it on a fork alone — no knife, and certainly no scissors. Italians rate cutting pasta at −46.', severity: 4, quote: '"The only people who are allowed to cut spaghetti are two-year olds!" — a chef, via Tasting Table' },
});
E({
  id: 'scotta', name: 'Pasta Scotta', en: 'Mushy Pasta', sprite: 'enemy.scotta',
  radius: 16, hp: 20, speed: 58, damage: 6, xp: 2, behavior: 'hopper', params: { rest: 0.7, hop: 0.45, hopSpeed: 150, height: 18 },
  color: 'yellow', juice: '#f0dc9a', chunk: 'bread', split: { into: 'scotta_mini', count: 2 },
  info: { crime: 'Overcooked, mushy pasta', why: 'Pasta should be al dente — "to the tooth", with a little bite. Soggy, swollen pasta is the classic complaint Italians bring home from trips abroad.', severity: 4 },
});
E({
  id: 'scotta_mini', name: 'Lo Sciacquapasta', en: 'The Pasta-Rinser', sprite: 'enemy.scotta_mini',
  radius: 10, hp: 7, speed: 70, damage: 4, xp: 1, behavior: 'hopper', params: { rest: 0.45, hop: 0.35, hopSpeed: 170, height: 12 },
  color: 'yellow', juice: '#f0dc9a', chunk: 'bread',
  info: { crime: 'Rinsing cooked pasta', why: 'The starch on freshly drained pasta is what makes the sauce cling. Rinsing washes it away and chills the pasta — only pasta salad gets rinsed.', severity: 3 },
});
E({
  id: 'cipolla', name: 'Cipolla Clandestina', en: 'Stowaway Onion', sprite: 'enemy.cipolla',
  radius: 15, hp: 34, speed: 44, damage: 8, xp: 3, behavior: 'chase', layers: 3, knockResist: 0.3,
  color: 'pink', juice: '#e8c9e8', chunk: 'cheese',
  info: { crime: 'Onion in carbonara or amatriciana', why: "Roman carbonara is guanciale, egg, Pecorino and pepper, and the 2020 EU Amatriciana STG excludes onion too (though old Roman amatriciane often used it). The onions in a viral 2016 French \"carbonara\" were among its most mocked ingredients. In Bologna, mind you, onion belongs in the soffritto of a ragù.", severity: 4 },
});
E({
  id: 'aglio', name: 'Aglio in Camicia', en: 'Garlic in Its Shirt', sprite: 'enemy.aglio',
  radius: 14, hp: 22, speed: 40, damage: 6, xp: 3, behavior: 'support', params: { r: 110, every: 1.2 },
  color: 'cream', juice: '#f4ecd6', chunk: 'cheese',
  info: { crime: 'Garlic where it does not belong', why: "Garlic is essential in pesto, vongole and the Marinara, but the EU's Amatriciana STG excludes it, Bologna's registered ragù forbids it, and Roman purists ban it from carbonara and Alfredo. Amatrice's recipe is guanciale, tomato, Pecorino, a splash of white wine, pepper or chilli.", severity: 4, quote: 'In 2015 a star chef revealed his TV "secret": garlic in its skin. The town of Amatrice answered with the true recipe; the chef said it was only a joke.' },
});
E({
  id: 'bacon', name: 'Bacon Abusivo', en: 'Unlicensed Bacon', sprite: 'enemy.bacon',
  radius: 13, hp: 14, speed: 66, damage: 6, xp: 2, behavior: 'slither', params: { amp: 1.0, freq: 5 },
  color: 'pink', juice: '#e57a7a', chunk: 'tomato',
  info: { crime: 'Bacon (or smoked pancetta) instead of guanciale', why: 'Guanciale, cured pork cheek, melts into sweet, clean fat and is never smoked. Bacon is the swap Italians spot most often in foreign carbonara, the Amatriciana STG names pancetta among its excluded ingredients, and even Bologna\'s registered ragù, which uses fresh pancetta, forbids the smoked kind.', severity: 3, quote: 'Told that ham would make a "British carbonara", Gino D\'Acampo famously shot back (as reported): "If my grandmother had wheels, she would have been a bike!"' },
});
E({
  id: 'piselli', name: 'Piselli Ribelli', en: 'Rebel Peas', sprite: 'enemy.piselli',
  radius: 8, hp: 4, speed: 88, damage: 3, xp: 1, behavior: 'swarm', params: { wobble: 0.9 },
  color: 'green', juice: '#7cc443', chunk: 'tomato',
  info: { crime: 'Peas in carbonara', why: 'Peas are not part of carbonara: Coldiretti lists frozen peas among the distortions found in restaurants abroad. They are fine in other Italian pastas (and even in a Bolognese ragù), just not here.', severity: 3 },
});
E({
  id: 'ananas', name: 'Ananas Corazzato', en: 'Armoured Pineapple', sprite: 'enemy.ananas',
  radius: 22, hp: 60, speed: 38, damage: 11, xp: 5, behavior: 'chase', knockResist: 0.6,
  color: 'yellow', juice: '#ffd23f', chunk: 'pineapple', split: { into: 'ananas_pezzo', count: 4 },
  info: { crime: 'Pineapple on pizza', why: 'Sweet tinned fruit wrecks the savoury balance of tomato and mozzarella. Italians rate it −63. (Plot twist: a famous Naples pizzaiolo put pineapple on his menu in 2023 — and Italy split in half.)', severity: 5, quote: '"Pineapple, a fruit, on a pizza?" — Gino D\'Acampo on British TV (as reported)' },
});
E({
  id: 'ananas_pezzo', name: "Pezzo d'Ananas", en: 'Pineapple Chunk', sprite: 'enemy.ananas_pezzo',
  radius: 9, hp: 8, speed: 92, damage: 4, xp: 1, behavior: 'chase',
  color: 'yellow', juice: '#ffd23f', chunk: 'pineapple',
  info: { crime: 'Tinned pineapple chunks', why: 'Even in small pieces. Especially in small pieces.', severity: 4 },
});
E({
  id: 'pollo', name: 'Pollo Infiltrato', en: 'Undercover Chicken', sprite: 'enemy.pollo',
  radius: 13, hp: 16, speed: 92, damage: 7, xp: 2, behavior: 'leaper', params: { range: 210, time: 0.6, cd: 2.4, height: 40 },
  color: 'orange', juice: '#e9a54b', chunk: 'bread',
  info: { crime: 'Chicken in pasta (and on pizza)', why: 'In an Italian meal pasta is the primo and chicken is a secondo: separate courses. "Chicken Alfredo" is unknown in Rome, and chicken is popular on pizza in many countries but almost never seen in Italian pizzerias.', severity: 4, quote: '"Mettere il pollo sulla pasta è un crimine in Italia" ("Putting chicken on pasta is a crime in Italy") — Trevi Fountain sign, 2023' },
});
E({
  id: 'pepperoni', name: 'Peperone Equivoco', en: 'The Misunderstood Pepper', sprite: 'enemy.pepperoni',
  radius: 11, hp: 10, speed: 120, damage: 6, xp: 2, behavior: 'orbiter', params: { r: 150, shrink: 14 }, flying: true,
  color: 'red', juice: '#c8321e', chunk: 'tomato',
  info: { crime: '"Pepperoni" pizza', why: 'In Italian, peperoni are bell peppers. Order a pepperoni pizza in Rome and you get peppers — the spicy salami is salame piccante, on a pizza diavola.', severity: 2 },
});
E({
  id: 'polpetta', name: 'Polpetta Rotolante', en: 'Rolling Meatball', sprite: 'enemy.polpetta',
  radius: 14, hp: 22, speed: 118, damage: 7, xp: 3, behavior: 'roller', params: { accel: 150, turn: 2.2 }, knockResist: 0.4,
  color: 'brown', juice: '#8a4a2a', chunk: 'bread',
  info: { crime: 'Spaghetti and meatballs', why: 'An Italian-American invention from around 1900. In Italy polpette are a main course on their own — never piled on spaghetti.', severity: 2, quote: '"You\'ll never find spaghetti and meatballs in Italy, at least outside of the most obvious tourist traps." — Tasting Table' },
});
E({
  id: 'hawaiana', name: 'Fetta Hawaiana', en: 'Hawaiian Slice', sprite: 'enemy.hawaiana',
  radius: 15, hp: 22, speed: 56, damage: 8, xp: 2, behavior: 'chase',
  color: 'orange', juice: '#f2a33a', chunk: 'pineapple',
  info: { crime: 'Ham & pineapple "Hawaiian" pizza', why: 'Born in Ontario, Canada, in 1962 and named after a tin of pineapple. Naples has filed a formal complaint with the universe.', severity: 4 },
});
E({
  id: 'cappuccino', name: 'Cappuccino Ritardatario', en: 'Latecomer Cappuccino', sprite: 'enemy.cappuccino',
  radius: 14, hp: 30, speed: 70, damage: 9, xp: 4, behavior: 'chase',
  color: 'brown', juice: '#a8714a', chunk: 'glass',
  info: { crime: 'Cappuccino after 11 a.m. (or with a meal)', why: 'Milky coffee is for breakfast; after lunch or dinner Italians drink an espresso. (Italians do argue about how strict the rule is.) These only show up after 11:00 on the clock.', severity: 3, quote: '"No al cappuccino con la pasta" ("No cappuccino with pasta") — Trevi Fountain sign, 2023' },
});
E({
  id: 'alfredo', name: 'Alfredo il Colloso', en: 'Alfredo the Gluey', sprite: 'enemy.alfredo',
  radius: 17, hp: 40, speed: 42, damage: 10, xp: 4, behavior: 'puddler', params: { puddle: 'cream', interval: 3, r: 30, life: 5, slow: 0.4 }, knockResist: 0.4,
  color: 'cream', juice: '#fff1cf', chunk: 'bread',
  info: { crime: 'Creamy chicken "Alfredo"', why: 'The original, created by Roman restaurateur Alfredo di Lelio in the early 1900s, is fettuccine, butter and Parmigiano — in Italy simply "fettuccine al burro". Jarred cream-and-chicken Alfredo is American.', severity: 3 },
});
E({
  id: 'parmesan', name: 'Spargipolvere', en: 'The Dust-Sprinkler', sprite: 'enemy.parmesan',
  radius: 14, hp: 20, speed: 46, damage: 3, xp: 3, behavior: 'lobber', params: { min: 140, max: 250, cd: 6, area: 'cheese', r: 22, slow: 0.25 },
  color: 'cream', juice: '#f5ecc8', chunk: 'plastic',
  info: { crime: 'Powdered "parmesan", or Parmigiano where it does not belong', why: 'Parmigiano Reggiano is a protected cheese aged at least 12 months, and it is the hero of Alfredo and pesto. But Rome\'s carbonara, amatriciana and cacio e pepe want Pecorino Romano, seafood pasta wants no cheese at all, and some shelf-stable "parmesan" isn\'t even the same cheese: US lab tests in 2016 found up to 8.8% cellulose (wood pulp) in "100% parmesan".', severity: 4 },
});
E({
  id: 'macchiata', name: 'Margherita Macchiata', en: 'Stained Margherita', sprite: 'enemy.macchiata',
  radius: 14, hp: 22, speed: 46, damage: 6, xp: 3, behavior: 'burster', params: { cd: 3, count: 8, shot: 'proj.e_ketchup', shotSpeed: 150, min: 150, max: 250 }, flying: true,
  color: 'red', juice: '#d8231f', chunk: 'bread',
  info: { crime: 'Ketchup on pizza', why: 'A Margherita is tomato, mozzarella, basil and olive oil. Ketchup on top is the pizza version of Italians\' #1 crime.', severity: 5, quote: 'When a TikTok prankster squirted ketchup on a pizza in Italy in 2023, one restaurant manager reportedly grabbed the bottle and threw it.' },
});
E({
  id: 'frappe', name: 'Frappè Zuccheroso', en: 'Sugar-Rush Frappé', sprite: 'enemy.frappe',
  radius: 14, hp: 22, speed: 62, damage: 8, xp: 3, behavior: 'charger', params: { range: 250, windup: 0.62, dash: 380, dashTime: 0.4, cd: 2.4 },
  color: 'pink', juice: '#f5b8c8', chunk: 'plastic',
  info: { crime: 'Giant whipped-cream "coffee" drinks', why: 'An Italian coffee is an espresso drunk standing at the bar in about a minute. A litre of syrup and whipped cream is a dessert in disguise.', severity: 2 },
});
E({
  id: 'smartphone', name: 'Il Telefonino Virale', en: 'The Viral Phone', sprite: 'enemy.smartphone',
  radius: 13, hp: 18, speed: 50, damage: 6, xp: 3, behavior: 'ranged', params: { min: 180, max: 280, cd: 3.4, shot: 'proj.e_generic', shotSpeed: 160, count: 2, spread: 0.24, muzzle: [0, -12] },
  color: 'pink', juice: '#9ad7ff', chunk: 'glass',
  info: { crime: 'Viral "Italian" recipe videos', why: 'Countertop spaghetti, oven-"boiled" raw spaghetti, gummy-candy pizza… every year a new video makes Italians reach for the comment box.', severity: 4, quote: 'A Michelin-starred Italian TV chef posted a horrified reaction video to a viral recipe that "boiled" raw spaghetti in the oven.' },
});
E({
  id: 'pentola', name: 'Pentola Fredda', en: 'The Cold Pot', sprite: 'enemy.pentola',
  radius: 15, hp: 30, speed: 40, damage: 7, xp: 3, behavior: 'aura', params: { r: 95, slow: 0.3 }, knockResist: 0.4,
  color: 'cream', juice: '#cfefff', chunk: 'glass',
  info: { crime: 'Starting pasta in cold water', why: 'Pasta goes into salted water at a rolling boil. In YouGov\'s survey Italians ranked cold-water pasta their #2 crime (−71) — worse than pineapple pizza!', severity: 4, quote: '"Non calare la pasta in acqua bollente svilisce sia la natura che la struttura della materia prima." — Gambero Rosso' },
});
E({
  id: 'vongola', name: 'Vongola Formaggiosa', en: 'The Cheesy Clam', sprite: 'enemy.vongola',
  radius: 13, hp: 18, speed: 76, damage: 7, xp: 2, behavior: 'strafe', params: { period: 0.9 },
  color: 'cream', juice: '#f5ecc8', chunk: 'cheese',
  info: { crime: 'Grated cheese on seafood pasta (and seafood on the Marinara)', why: 'By unwritten rule, aged cheese drowns delicate seafood: spaghetti alle vongole is garlic, oil, parsley and the clams\' own juice. (The Parmigiano consortium itself lists a few exceptions.) Italians rate it −39. And the pizza marinara is named after sailors, not seafood: no clams on it.', severity: 3 },
});
E({
  id: 'surgelata', name: 'Lasagna Surgelata', en: 'Frozen Lasagna', sprite: 'enemy.surgelata',
  radius: 23, hp: 110, speed: 32, damage: 10, xp: 6, behavior: 'chase', knockResist: 0.75,
  color: 'red', juice: '#d9532e', chunk: 'glass',
  info: { crime: 'Frozen microwave lasagna', why: 'Lasagna is a Sunday ritual: fresh egg-pasta sheets, slow-cooked ragù, béchamel and hours in the oven — not a frozen brick nuked for six minutes.', severity: 2 },
});
E({
  id: 'pentolaunica', name: 'La Pentola Unica', en: 'The Single Pot', sprite: 'enemy.pentolaunica',
  radius: 17, hp: 44, speed: 50, damage: 10, xp: 5, behavior: 'devourer', params: { range: 320 }, knockResist: 0.5,
  color: 'cream', juice: '#f3e2b5', chunk: 'bread',
  info: { crime: 'One-pot "carbonara"', why: 'A 2016 French viral video boiled pasta in one pot with onion, bacon and cream. Italians cook pasta in plenty of salted water and build the sauce separately. It eats other crimes to grow — stop it early!', severity: 4, quote: 'Even the pasta maker seen in the clip distanced itself: "this goes too far… désolé".' },
});
E({
  id: 'glassa', name: 'Glassa Balsamica', en: 'Balsamic Glaze', sprite: 'enemy.glassa',
  radius: 13, hp: 20, speed: 54, damage: 6, xp: 3, behavior: 'puddler', params: { puddle: 'ketchup', interval: 1.6, r: 20, life: 4, slow: 0.25, puddleAt: [-13, 14] },
  color: 'brown', juice: '#4a1f1f', chunk: 'glass',
  info: { crime: 'Sugary balsamic glaze on everything', why: 'Real Aceto Balsamico Tradizionale is aged for at least 12 years and used a drop at a time. The bread-dipping saucer of oil and balsamic is an American restaurant custom.', severity: 2 },
});
E({
  id: 'pastachips', name: 'Patatine di Pasta', en: 'Pasta Crisps', sprite: 'enemy.pastachips',
  radius: 9, hp: 6, speed: 96, damage: 3, xp: 1, behavior: 'swarm', params: { wobble: 1.1 },
  color: 'yellow', juice: '#f0c25a', chunk: 'bread',
  info: { crime: 'Air-fried "pasta chips"', why: 'A 2021 trend: boil pasta, then air-fry it into crisps. By Italian standards a minor crime — fried pasta already exists in Italian home cooking.', severity: 2, quote: 'Belgian broadcaster RTBF called it "le nouvel affront à la gastronomie italienne".' },
});
E({
  id: 'scatoletta', name: 'Scatoletta Maledetta', en: 'The Cursed Little Can', sprite: 'enemy.scatoletta',
  radius: 14, hp: 16, speed: 80, damage: 16, xp: 3, behavior: 'kamikaze', params: { trigger: 62, fuse: 0.8, blast: 72 },
  color: 'cream', juice: '#f3e2b5', chunk: 'glass',
  info: { crime: 'Canned carbonara', why: 'Carbonara is an emulsion made to order. A shelf-stable tin is its exact opposite — yet one launched in the UK in 2024.', severity: 4, quote: 'When a canned carbonara launched in 2024, Italian chefs were reported likening it to "cat food" — and calling it a way to "destroy Italian culture".' },
});
E({
  id: 'fantasma', name: 'Spaghetti Fantasma', en: 'Ghost Spaghetti', sprite: 'enemy.fantasma',
  radius: 15, hp: 26, speed: 58, damage: 8, xp: 3, behavior: 'ghost', params: { period: 1.6 }, flying: true,
  color: 'red', juice: '#c8421e', chunk: 'bread',
  info: { crime: 'Spaghetti bolognese', why: "Bologna's ragù goes on fresh egg tagliatelle or into lasagne, not on dried spaghetti. It flickers in and out of existence — hit it while it's solid. (Fun fact: most Italians in the YouGov poll actually shrugged.)", severity: 3, quote: '"Spaghetti Bolognese doesn\'t actually exist; yet, it\'s famous the world over" — the mayor of Bologna, 2019 (via CBC)' },
});

// ---------------------------------------------------------------------------
// Il Menù: intruders that do not belong in a dish (texts from the recipe research,
// see src/game/recipes.ts and docs/RECIPES.md). Art: src/gfx/art/recipes_enemies_{a,b}.ts
// ---------------------------------------------------------------------------

E({
  id: 'burro', name: 'Burro Furbetto', en: 'Sneaky Butter', sprite: 'enemy.burro',
  radius: 14, hp: 16, speed: 48, damage: 7, xp: 2, behavior: 'puddler', params: { puddle: 'butter', interval: 2.8, r: 26, life: 5, slow: 0.3 },
  color: 'yellow', juice: '#fbe58a', chunk: 'cheese',
  info: { crime: 'Butter where it does not belong', why: 'Butter IS the sauce in Fettuccine Alfredo. But cacio e pepe is only Pecorino, pepper and pasta water, Neapolitan vongole use only olive oil, today\'s Genoese pesto has none, and carbonara\'s fat is rendered guanciale. In 2025 a British recipe for cacio e pepe with butter set off protests in Rome until it was rewritten.', severity: 4 },
});
E({
  id: 'funghi', name: 'Funghi Abusivi', en: 'Bootleg Mushrooms', sprite: 'enemy.funghi',
  radius: 13, hp: 20, speed: 48, damage: 6, xp: 3, behavior: 'burster', params: { cd: 3.8, count: 6, shot: 'proj.e_spore', shotSpeed: 135, min: 150, max: 250 },
  color: 'brown', juice: '#d9c3a0', chunk: 'bread',
  info: { crime: 'Mushrooms in carbonara', why: 'Mushrooms are a frequent foreign addition with no place in the Roman dish. Italian social media mocked a celebrity chef\'s 2020 carbonara video with mushrooms, peas and crème fraîche.', severity: 2 },
});
E({
  id: 'prosciutto', name: 'Prosciutto Impostore', en: 'Impostor Ham', sprite: 'enemy.prosciutto',
  radius: 14, hp: 20, speed: 58, damage: 7, xp: 2, behavior: 'chase', knockResist: 0.3,
  color: 'pink', juice: '#f2a8a8', chunk: 'tomato',
  info: { crime: 'Cooked ham instead of guanciale', why: 'Cooked ham in place of guanciale is a British-style shortcut. Italian food media list ham carbonara among the common recipe "horrors", and an Italian TV chef rejected it on live British TV.', severity: 2 },
});
E({
  id: 'broccoli', name: 'Broccolo Americano', en: 'American Broccoli', sprite: 'enemy.broccoli',
  radius: 15, hp: 22, speed: 44, damage: 4, xp: 3, behavior: 'lobber', params: { min: 150, max: 240, cd: 4.2, shot: 'proj.e_floret', area: 'cream', r: 20, slow: 0.2 },
  color: 'green', juice: '#4f9a3a', chunk: 'tomato',
  info: { crime: 'Broccoli in Fettuccine Alfredo', why: 'Broccoli is a common American add-on to "Alfredo" and is unknown in the Roman dish, which is only egg fettuccine, butter and Parmigiano. Italians love pasta with broccoli, just in other dishes.', severity: 2 },
});
E({
  id: 'gamberi', name: 'Gambero Saltatore', en: 'Hopping Shrimp', sprite: 'enemy.gamberi',
  radius: 12, hp: 13, speed: 86, damage: 6, xp: 2, behavior: 'leaper', params: { range: 195, time: 0.55, cd: 2.6, height: 30 },
  color: 'orange', juice: '#ff9a7a', chunk: 'tomato',
  info: { crime: 'Shrimp in Alfredo (and seafood on the Marinara)', why: 'Fettuccine Alfredo has no protein at all: shrimp is a US restaurant add-on. And despite its name, the pizza marinara has no seafood: "marinara" refers to the sailors who carried its long-lasting ingredients on board.', severity: 2 },
});
E({
  id: 'anacardo', name: 'Anacardo Abusivo', en: 'Bootleg Cashew', sprite: 'enemy.anacardo',
  radius: 8, hp: 5, speed: 84, damage: 3, xp: 1, behavior: 'swarm', params: { wobble: 0.8 },
  color: 'yellow', juice: '#e9d3a2', chunk: 'bread',
  info: { crime: 'Cashews in pesto', why: 'Pesto genovese is made with pine nuts. Cheap industrial jars often replace them with cashews, and Italian food media treat that as the mark of an imitation "alla genovese" pesto.', severity: 3 },
});
E({
  id: 'olio', name: 'Olio Sbagliato', en: 'Wrong Oil', sprite: 'enemy.olio',
  radius: 13, hp: 18, speed: 50, damage: 6, xp: 2, behavior: 'puddler', params: { puddle: 'oil', interval: 2.2, r: 24, life: 4.5, slow: 0.25 },
  color: 'yellow', juice: '#f3e27a', chunk: 'plastic',
  info: { crime: 'The wrong oil', why: 'Pesto genovese wants extra-virgin olive oil, ideally Ligurian, yet many commercial pestos swap in sunflower or other seed oils. And in cacio e pepe the fat comes from the cheese: purists call any oil there a misstep (even if Rome is split).', severity: 3 },
});
E({
  id: 'filante', name: 'La Filante Abusiva', en: 'Rogue Cheese Pull', sprite: 'enemy.filante',
  radius: 14, hp: 18, speed: 62, damage: 7, xp: 2, behavior: 'slither', params: { amp: 1.1, freq: 4 },
  color: 'cream', juice: '#fff6dc', chunk: 'cheese',
  info: { crime: 'Cheese on a Marinara', why: 'The pizza marinara is defined with no cheese at all: tomato, garlic, oregano and olive oil, the oldest classic Neapolitan pizza. Adding mozzarella makes it a different pizza.', severity: 2 },
});
E({
  id: 'cheddar', name: 'Cheddar Arancione', en: 'Orange Cheddar', sprite: 'enemy.cheddar',
  radius: 13, hp: 18, speed: 68, damage: 7, xp: 2, behavior: 'strafe', params: { period: 1.0 },
  color: 'orange', juice: '#ffa62b', chunk: 'cheese',
  info: { crime: 'Cheddar on pizza', why: 'Italian pizza uses mozzarella or fior di latte (and the Marinara no cheese at all). Coldiretti, the Italian farmers\' association, singles out "Anglo-Saxon cheddar" among the wrong cheeses used on pizza abroad.', severity: 2 },
});
E({
  id: 'bbq', name: 'Salsa Barbecue', en: 'BBQ Sauce', sprite: 'enemy.bbq',
  radius: 14, hp: 14, speed: 50, damage: 6, xp: 2, behavior: 'ranged', params: { min: 150, max: 260, cd: 3.2, shot: 'proj.e_bbq', shotSpeed: 145, count: 1, spread: 0, muzzle: [4, -30] },
  color: 'brown', juice: '#5a2a18', chunk: 'plastic',
  info: { crime: 'BBQ sauce on pizza', why: 'Barbecue sauce, usually with chicken, is a foreign topping Italian pizzerias simply do not use. In early 2022 the only pizzeria chain in Italy offering barbecue chicken pizza was an American one, and it left Italy that August.', severity: 2 },
});

// ---------------------------------------------------------------------------
// Bosses
// ---------------------------------------------------------------------------

E({
  id: 'b_ketchup', name: 'Il Barone del Ketchup', en: 'The Ketchup Baron', sprite: 'boss.ketchup',
  radius: 46, hp: 1400, speed: 48, damage: 14, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'red', juice: '#d8231f', chunk: 'plastic', shadow: 1.1,
  boss: { title: 'Il Barone del Ketchup', taunt: 'Ketchup goes on EVERYTHING!', pattern: 'ketchup' },
  info: { crime: 'Ketchup on pasta — Italy\'s #1 food crime', why: 'The YouGov survey\'s runaway winner at −82. Ketchup is fine on fries. Only on fries.', severity: 5 },
});
E({
  id: 'b_alfredo', name: 'Il Barattolo Alfredo', en: 'The Alfredo Jar', sprite: 'boss.alfredo',
  radius: 54, hp: 2300, speed: 42, damage: 16, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'cream', juice: '#fff1cf', chunk: 'glass', shadow: 1.1,
  boss: { title: 'Il Barattolo Alfredo', taunt: 'More cream! MORE GARLIC!', pattern: 'alfredo' },
  info: { crime: 'Jarred "Alfredo" sauce', why: 'The Roman original is butter, Parmigiano and a splash of pasta water tossed at the table — not a jar of thickened cream and garlic powder.', severity: 4 },
});
E({
  id: 'b_panna', name: 'Il Colosso di Panna', en: 'The Cream Colossus', sprite: 'boss.panna',
  radius: 58, hp: 3600, speed: 40, damage: 18, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'cream', juice: '#fff4dc', chunk: 'plastic', shadow: 1.15,
  boss: { title: 'Il Colosso di Panna', taunt: 'Carbonara needs CREAM!', final: true, pattern: 'panna' },
  info: { crime: 'Cream in carbonara — the original sin', why: 'Guanciale, Pecorino Romano, eggs, black pepper. That is the recipe. The Colossus disagrees, loudly.', severity: 5, quote: '"Basta con la panna nella carbonara!" — Trevi Fountain, 2023' },
});
E({
  id: 'b_scatolone', name: 'Lo Scatolone', en: 'The Big Can', sprite: 'boss.scatolone',
  radius: 54, hp: 3000, speed: 44, damage: 16, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'orange', juice: '#e8742a', chunk: 'glass', shadow: 1.1,
  boss: { title: 'Lo Scatolone', taunt: 'Pasta… in a CAN!', pattern: 'scatolone' },
  info: { crime: 'Canned spaghetti in sweet sauce', why: 'Pre-cooked, soft, sugary pasta, hermetically sealed. Everything wrong in one tin.', severity: 4 },
});
E({
  id: 'b_deepdish', name: 'Il Pizzone Abissale', en: 'The Abyssal Deep-Dish', sprite: 'boss.deepdish',
  radius: 74, hp: 5200, speed: 30, damage: 21, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'red', juice: '#c8321e', chunk: 'bread', shadow: 1.2,
  boss: { title: 'Il Pizzone Abissale', taunt: 'I AM pizza! Five centimetres of pizza!', pattern: 'deepdish' },
  info: { crime: 'Chicago deep-dish "pizza"', why: 'Italian pizza is thin and blisters in ninety seconds. Deep dish is a tall crust filled with cheese and topped with sauce — closer to a pie.', severity: 3, quote: 'Even a Chicago chef called it "a lasagna with a crust".' },
});
E({
  id: 'b_ananas', name: 'Il Re Ananas', en: 'The Pineapple King', sprite: 'boss.ananas',
  radius: 60, hp: 6200, speed: 40, damage: 19, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'yellow', juice: '#ffd23f', chunk: 'pineapple', shadow: 1.15,
  boss: { title: 'Il Re Ananas', taunt: 'Pineapple belongs on pizza!!', final: true, pattern: 'ananas' },
  info: { crime: 'The King of all pizza crimes', why: 'Crowned by the internet, hated by Naples (mostly). Defeat him and the Margherita sleeps soundly again.', severity: 5 },
});
E({
  id: 'b_campanile', name: 'Il Campanile del Cappuccino', en: 'The Cappuccino Clock Tower', sprite: 'boss.campanile',
  radius: 52, hp: 5000, speed: 40, damage: 18, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'brown', juice: '#a8714a', chunk: 'glass', shadow: 1.1,
  boss: { title: 'Il Campanile del Cappuccino', taunt: 'DONG! It is always 11 o\'clock somewhere!', pattern: 'campanile' },
  info: { crime: 'Cappuccino after lunch, with dinner, with pizza…', why: 'A bell tower of milk foam whose clock is stuck at 11:00. Every toll is a cappuccino ordered with a plate of pasta.', severity: 3, quote: '"Please no cappuccino after 12 pm" — viral sign in central Rome, 2023' },
});
E({
  id: 'b_influencer', name: "L'Influencer della Padella Unica", en: 'The One-Pan Influencer', sprite: 'boss.influencer',
  radius: 52, hp: 8400, speed: 46, damage: 19, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'pink', juice: '#9ad7ff', chunk: 'glass', shadow: 1.1,
  boss: { title: "L'Influencer della Padella Unica", taunt: 'Smash that like! One-pan carbonara with cream!', final: true, pattern: 'influencer' },
  info: { crime: 'The viral recipe factory', why: 'Ring light on, tradition off. Nearly every crime in this game went viral somewhere first.', severity: 5 },
});
E({
  id: 'b_microonde', name: 'Il Microonde Maledetto', en: 'The Cursed Microwave', sprite: 'boss.microonde',
  radius: 56, hp: 7600, speed: 40, damage: 19, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'orange', juice: '#ffcf6a', chunk: 'glass', shadow: 1.15,
  boss: { title: 'Il Microonde Maledetto', taunt: 'DING! Your pasta is ready in 90 seconds!', pattern: 'microonde' },
  info: { crime: 'Microwaving pasta', why: 'Leftover pasta becomes a crispy frittata di pasta in a pan. The microwave turns it into rubber.', severity: 3 },
});
E({
  id: 'b_fusione', name: 'Il Mostro della Fusione', en: 'The Fusion Abomination', sprite: 'boss.fusione',
  radius: 70, hp: 14000, speed: 44, damage: 24, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'pink', juice: '#ff5a8a', chunk: 'pineapple', shadow: 1.25,
  boss: { title: 'Il Mostro della Fusione', taunt: 'Pineapple-ketchup-cream carbonara PIZZA!', final: true, pattern: 'fusione' },
  info: { crime: 'Every crime at once', why: 'Pineapple, ketchup, cream, chicken and a stuffed crust, served on snapped spaghetti. The final boss of bad cooking.', severity: 5 },
});

// Il Menù bosses (patterns in src/game/bosses/, art in src/gfx/art/recipes_bosses_{a,b}.ts)
E({
  id: 'b_aglio', name: "Il Re dell'Aglio", en: 'The Garlic King', sprite: 'boss.aglio',
  radius: 56, hp: 5600, speed: 42, damage: 18, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'cream', juice: '#f4ecd6', chunk: 'cheese', shadow: 1.1,
  boss: { title: "Il Re dell'Aglio", taunt: 'Solo uno spicchio… in camicia!', final: true, pattern: 'aglio' },
  info: { crime: 'Garlic in amatriciana', why: 'The EU specification says Amatriciana Tradizionale, unlike similar sauces, uses no garlic, onion or pancetta. When a celebrity chef revealed on Italian TV in 2015 that he adds a clove "in its shirt", Amatrice\'s town council answered with a formal statement and the chef apologised.', severity: 5 },
});
E({
  id: 'b_burro', name: 'Il Panetto Supremo', en: 'The Supreme Butter Block', sprite: 'boss.burro',
  radius: 54, hp: 5200, speed: 44, damage: 18, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'yellow', juice: '#fbe58a', chunk: 'cheese', shadow: 1.15,
  boss: { title: 'Il Panetto Supremo', taunt: 'Un pochino di burro, per la cremosità!', final: true, pattern: 'burro' },
  info: { crime: 'Butter in cacio e pepe', why: 'Cacio e pepe is only Pecorino Romano, black pepper and pasta water whipped into a cream. In 2025 Rome\'s restaurateurs protested a British food website\'s recipe with butter and Parmesan, all the way to a complaint to an embassy, until it was rewritten.', severity: 5 },
});
E({
  id: 'b_bolognese', name: "Lo Spaghettone alla Bolognese", en: 'The Great Spaghetti Bolognese', sprite: 'boss.bolognese',
  radius: 62, hp: 8400, speed: 40, damage: 19, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'red', juice: '#c8421e', chunk: 'bread', shadow: 1.2,
  boss: { title: "Lo Spaghettone alla Bolognese", taunt: 'Io esisto! I EXIST!', final: true, pattern: 'bolognese' },
  info: { crime: 'Spaghetti bolognese', why: 'In Bologna, ragù goes on fresh egg tagliatelle, whose porous surface holds the sauce. In 2019 Bologna\'s mayor called spaghetti bolognese a dish that does not exist. (Most Italians in a 2022 YouGov poll actually shrugged and rated it acceptable.) It phases in and out of existence: hit it while it is solid.', severity: 4, quote: '"Spaghetti Bolognese doesn\'t actually exist; yet, it\'s famous the world over" — the mayor of Bologna, 2019 (via CBC)' },
});
E({
  id: 'b_frullatore', name: 'Il Frullatore Rovente', en: 'The Red-Hot Blender', sprite: 'boss.frullatore',
  radius: 56, hp: 8400, speed: 42, damage: 19, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'green', juice: '#4fa82e', chunk: 'glass', shadow: 1.1,
  boss: { title: 'Il Frullatore Rovente', taunt: 'Pesto in trenta secondi! Con anacardi e panna!', final: true, pattern: 'frullatore' },
  info: { crime: 'Instant pesto with cream and cashews', why: 'Genoese pesto is a raw sauce pounded in a marble mortar from basil, olive oil, pine nuts, garlic, salt, Parmigiano and Sardinian pecorino. Cream drowns the basil, cheap seed oil replaces the olive oil, and cashews are the mark of an imitation jar.', severity: 4 },
});
E({
  id: 'b_grattugiato', name: 'Il Sacco del Grattugiato', en: 'The Bag of Pre-Grated Cheese', sprite: 'boss.grattugiato',
  radius: 58, hp: 8400, speed: 40, damage: 19, xp: 0, behavior: 'boss', knockResist: 1,
  color: 'cream', juice: '#f5ecc8', chunk: 'plastic', shadow: 1.15,
  boss: { title: 'Il Sacco del Grattugiato', taunt: 'Formaggio sulle vongole? Abbondante!', final: true, pattern: 'grattugiato' },
  info: { crime: 'Pre-grated cheese on clams', why: 'Italians widely follow an unwritten rule: no grated aged cheese on fish and shellfish pasta, because it covers the delicate taste of the clams. In a 2022 YouGov survey Italians gave cheese on seafood pasta a net −39. A bag of imitation "Parmesan" makes it worse still.', severity: 5 },
});

export const REGULAR_ENEMY_IDS = Object.values(ENEMIES)
  .filter((e) => e.behavior !== 'boss')
  .map((e) => e.id);
export const BOSS_IDS = Object.values(ENEMIES)
  .filter((e) => e.behavior === 'boss')
  .map((e) => e.id);
