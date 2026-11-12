# Recipe levels — framework (dish specifics come from research)

## Player-facing concept
- The stage picker becomes **Il Menù**: every level is a dish (Spaghetti alla Carbonara, Fettuccine Alfredo, …), grouped by course.
- In a dish's level the crimes are the **intruders**: ingredients Italians say do not belong in THAT dish (cream, onion and garlic
  in carbonara; cream, chicken, garlic in Alfredo; pineapple, ketchup on a Margherita; mozzarella on a Marinara; …).
- The **real ingredients** of the dish appear during the run as golden pickups (one at a time, with an off-screen arrow).
  Each one gives a small themed bonus; collecting them all = **Ricetta completa** (full heal + bonus) and a ★ on the menu card.
- Beat the dish's final boss at 15:00 (its worst intruder, e.g. the Cream Colossus for carbonara) → the plated dish on the
  victory screen.
- The same ingredient can be friend or foe: garlic is an intruder in amatriciana but a real ingredient of aglio-olio and pesto;
  onion is an intruder in carbonara but part of the ragù soffritto. The game says so when it happens.
- Il Ricettario gets a **Ricette** tab: the proper recipe, the intruders and why (with the sources: authorities and Italian chefs).

## Data model (src/game/recipes.ts, new)
```ts
export interface RecipeIngredient { id: string; it: string; en: string; sprite: string /* 'ingr.<id>' */; note?: string;
  buff: { stat: StatKey; add?: number; mul?: number; text: string } }
export interface RecipeIntruder { enemy: string /* ENEMIES id */; it: string; en: string; why: string; popularity: 1|2|3|4|5;
  contested?: string; source?: { name: string; url: string } }
export interface RecipeDef { id: string; it: string; en: string; origin: string; shape: string; course: CourseId;
  dish: string /* sprite 'dish.<id>' */; ingredients: RecipeIngredient[] /* 4-6 collectible */; method: string;
  intruders: RecipeIntruder[]; sources: { name: string; url: string }[]; quote?: { text: string; who: string; url?: string };
  funFact?: string }
```
StageDef gains `recipe: string` (RecipeDef id), `variant?: EnvVariant` (ambient overrides + extra decor), `unlock` rule
(`{ anyOf: string[] }` of dishes to win, or null), `course`.

## Real-ingredient pickups (run.ts)
- New PickupKind `'ingredient'` (value = index into the recipe's ingredients). Sprite `ingr.<id>`; gold glow ring; never
  magnet-pulled from afar (like chests); off-screen arrow (render.ts targets list, colour '#7cff8a').
- Spawn schedule: director event kind `'ingredient'` at fixed times (e.g. 1:15, 3:30, 6:15, 8:45, 11:15, 13:30 for six), placed
  320–520 units from the player on free ground, in the direction the player is NOT moving (forces a detour). If a pickup is
  not collected within 90 s it drifts toward the player (no soft-lock).
- Collect: banner "Guanciale ✓ 2/5", sfx 'ui_unlock' + chef voice line, apply buff (permanent for the run), record in
  run.recipeGot. All collected → "RICETTA COMPLETA!" fx, full heal, +10% Might, record `perfect` in the stage record.
- HUD: small recipe strip (dish name + ingredient icons, greyed until collected) under the timer.

## Enemies
- Reuse existing crime enemies that are ingredients; add new ingredient enemies (sprites `enemy.<id>`, existing behaviours
  only; no new AI kinds). EnemyInfo.crime becomes generic for multi-dish intruders ("Cream where it does not belong"); the
  per-dish reason lives in RecipeIntruder.why and is shown on the menu card, the Ricettario and as a first-sighting toast
  ("Panna nella carbonara? NO! — <why short>").
- Waves per dish: ≥ 80 % of spawn weight from that dish's intruders; the rest from a few dish-relevant "method" crimes.

## Bosses
- Final boss per dish = its worst intruder (existing where one fits; new ones otherwise). Mid-bosses (5:00, 10:00) from the
  existing pool, themed. New boss patterns go in a new file `src/game/bosses_recipes.ts` merged into PATTERNS.

## UI
- Il Menù: course sections (headers), dish cards (dish art + name + origin/shape, real-ingredient icon row, intruder icon row,
  records incl. ★ perfect, lock note "Win <dish> to unlock"). Keyboard/gamepad nav as today (data-nav).
- Run start: a short "recipe card" banner (dish name + "Ingredienti: …" + "Intrusi: …").
- Results: plated dish art, "Ricetta completa ★" or "n/m ingredients", intruders stopped.
- Ricettario: new tab "🍝 Ricette"; crimes tab shows "Does not belong in: <dishes>".

## Save / progression
- Save v2 migration: old stage ids → new: kitchen→carbonara, trattoria→margherita, streets→(Naples dish), foodcourt→finale.
  Old unlocks/wins grant the mapped dish unlock + its prerequisites; old records copied to the mapped id.
- Characters: sofia = win Carbonara; concetta = win Amatriciana (chilli); micio = win the Margherita; legacy record ids also count.
- Medals: Giro d'Italia = win every dish; new: Ricetta Perfetta (complete a recipe and win), Primi Romani (win all Roman pastas),
  Pizzaiolo DOC (win both pizzas).
