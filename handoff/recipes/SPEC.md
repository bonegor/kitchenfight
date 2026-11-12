# KITCHEN FIGHT — "Il Menù": every level is a recipe (implementation spec)

User request: "levels should be recipes — investigate proper recipes for pasta and pizza and fight against ingredients that do
not belong in that dish according to popular Italian posts about food. For example, cream does not belong in a carbonara or a
pasta alfredo (the latter one takes butter, parmigiano, pasta water)." Follow-up: "one good source might be Italian influencer chefs".

Research dataset: $R/recipes_dataset.json and dossier $R/RECIPES_RESEARCH.md ($R = /tmp/claude-0/-home-user-kitchenfight/
99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes). ALL in-game recipe facts, intruder reasons ('why' / 'game_line'),
quotes and sources come from that dataset. Never invent a quote; attribute claims; use "reportedly" where the dataset marks a
quote unverified. Items in accepted_in_italy must not be mocked (e.g. panna, mais, würstel e patatine, ham and mushrooms are
accepted ON PIZZA; Parmigiano/pecorino is optional on spaghetti al pomodoro; garlic and parsley belong in vongole).

## 1. The menu (11 levels; replaces the 4 stages)
| # | id | Dish (it / en) | Course | Env (variant) | Final boss (15:00) | Mid-bosses 5:00 / 10:00 | Unlock |
|---|----|----------------|--------|---------------|--------------------|-------------------------|--------|
| 1 | pomodoro | Spaghetti al Pomodoro / Spaghetti with tomato sauce | Le Basi | kitchen (morning) | b_ketchup | b_scatolone / b_microonde | start |
| 2 | carbonara | Spaghetti alla Carbonara | Primi Romani | kitchen (warm) | b_panna | b_influencer / b_alfredo | win pomodoro |
| 3 | alfredo | Fettuccine Alfredo (al burro) | Primi Romani | trattoria (Alfredo's dining room, lunch) | b_alfredo | b_microonde / b_panna | win carbonara |
| 4 | amatriciana | Bucatini all'Amatriciana | Primi Romani | kitchen (evening, embers) | b_aglio (NEW) | b_scatolone / b_influencer | win carbonara |
| 5 | cacioepepe | Tonnarelli Cacio e Pepe | Primi Romani | trattoria (late night) | b_burro (NEW) | b_alfredo / b_influencer | win alfredo OR amatriciana |
| 6 | margherita | Pizza Margherita | Le Pizze | streets (sunset→night, as today) | b_ananas | b_deepdish / b_ketchup | win carbonara |
| 7 | marinara | Pizza Marinara | Le Pizze | streets (night) | b_deepdish | b_grattugiato (NEW) / b_campanile | win margherita |
| 8 | ragu | Tagliatelle al Ragù (alla bolognese) | Dal Nord | trattoria (Bologna afternoon) | b_bolognese (NEW) | b_scatolone / b_microonde | win cacioepepe OR marinara |
| 9 | pesto | Trofie al Pesto Genovese | Dal Nord | streets (Ligurian day, green tint) | b_frullatore (NEW) | b_burro / b_influencer | win ragu |
| 10 | vongole | Spaghetti alle Vongole | Dal Sud e dal Mare | streets (seaside morning, blue tint) | b_grattugiato (NEW) | b_burro / b_panna | win marinara OR pesto |
| 11 | foodcourt | Il Menù degli Orrori (finale) | Il Gran Finale | foodcourt | b_fusione | b_campanile / b_influencer | win any 6 different dishes |
Run length stays 15:00 (bosses at 300/600/900). Difficulty tiers interpolate today's stages: pomodoro ≈ kitchen×0.9,
carbonara ≈ kitchen, alfredo/amatriciana/margherita ≈ trattoria, cacioepepe/marinara ≈ between trattoria and streets,
ragu/pesto/vongole ≈ streets, foodcourt = foodcourt. Music = the env's track (kitchen/trattoria/streets/foodcourt).
Unlock rule type: `unlock: null | { anyOf: string[] } | { wins: number }`.

## 2. Real ingredients (collectible pickups; sprite `ingr.<id>`)
| Dish | Ingredients (in collection order) |
|------|-----------------------------------|
| pomodoro | spaghetti, pomodoro, olio, aglio (note: "or onion — free choice"), basilico |
| carbonara | guanciale, tuorli, pecorino, pepe, spaghetti |
| alfredo | fettuccine, burro, parmigiano, acqua (starchy pasta water) |
| amatriciana | guanciale, pomodoro, pecorino, vino (dry white), peperoncino |
| cacioepepe | tonnarelli, pecorino, pepe, acqua |
| margherita | impasto, pomodoro, mozzarella (fior di latte / bufala), basilico, olio |
| marinara | impasto, pomodoro, aglio, origano, olio |
| ragu | manzo, pancetta, soffritto (onion+carrot+celery), passata, vino, tagliatelle |
| pesto | basilico, pinoli, aglio, olio, parmigiano, pecorino |
| vongole | spaghetti, vongole, aglio, olio, prezzemolo, peperoncino |
| foodcourt | guanciale, parmigiano, basilico, vongole, pomodoro, olio ("Nonna's pantry: one sacred ingredient from each corner of Italy") |
27 unique ingredient sprites: spaghetti fettuccine tonnarelli tagliatelle pomodoro passata olio aglio basilico guanciale tuorli
pecorino parmigiano pepe burro acqua vino peperoncino manzo pancetta soffritto pinoli vongole prezzemolo impasto mozzarella origano.
Friend-or-foe: burro (real in Alfredo, intruder in cacio e pepe/vongole/pesto/carbonara), aglio (real in pomodoro/marinara/pesto/
vongole, intruder in amatriciana/carbonara/ragù/Alfredo), pancetta (real in ragù; smoked bacon/pancetta intruder in carbonara/
amatriciana), parmigiano (real in Alfredo/pesto; intruder as a replacement for pecorino in Roman pastas and on clams),
mozzarella (real on Margherita, intruder on Marinara), onion (soffritto in ragù; intruder in carbonara/amatriciana). When the
player collects/meets one of these in a level where it is the opposite, show a one-off toast ("Garlic! In pesto it belongs.").

Mechanic: director event kind 'ingredient' at evenly spaced times between 70 s and 830 s (skip ±20 s around 300/600), one at a
time, placed 320–520 units from the player on free ground, preferring the direction opposite to the player's movement. Pickup
kind 'ingredient' (value = index); not magnet-pulled until within 60 units; golden glow ring + bob; off-screen arrow (render.ts
targets, colour '#7cff8a', bigger than the chest arrow). After 90 s uncollected it drifts slowly toward the player. Collect →
banner "<Ingredient it> ✓ n/m", sfx 'ui_unlock' (exists), chef voice line, apply its buff for the rest of the run. Buffs by
category (small, readable): pasta +8% Duration; tomato/passata +10% Max HP; olio +5% Might; aglio/origano +5% Area;
herbs (basilico, prezzemolo) +0.2 HP/s; meat (guanciale, pancetta, manzo) +6% Might; tuorli +10% Max HP; cheese (pecorino,
parmigiano, mozzarella) +1 Armor; spice (pepe, peperoncino) −5% Cooldown; burro +15% Magnet; acqua +8% Area; vino +8% Luck;
soffritto +5% Move speed; pinoli +8% Growth; vongole +10% Projectile speed; impasto +8% Duration.
All collected → "RICETTA COMPLETA!" (big banner + confetti + 'pickup_bell'), full heal, +10% Might, +50 coins; stage record
gets `perfect: true` (★ on the menu card). Run fields: `recipe`, `recipeGot: boolean[]`, `recipeComplete`; hook
`onIngredient(index, complete)` for the UI.

## 3. Intruders (enemies) per dish (≥ 80 % of wave weight from these; ids are ENEMIES ids)
| Dish | Intruders (weight order) | Dish-relevant extras (≤ 20 %) |
|------|--------------------------|-------------------------------|
| pomodoro | ketchup, polpetta (meatballs piled on), pollo, zucchero? (only if dataset supports; else skip) | spezzato, forbici, scotta(+mini), pentola (the basics of cooking pasta) |
| carbonara | panna, cipolla, bacon, aglio, parmesan (as "Parmesan instead of Pecorino"), pollo, piselli, funghi (NEW), prosciutto (NEW, cooked ham), burro (NEW) | scatoletta (canned carbonara), pentolaunica (one-pot carbonara) |
| alfredo | panna, pollo, alfredo (creamy chicken Alfredo), broccoli (NEW), gamberi (NEW), aglio, parmesan (powdered) | scotta |
| amatriciana | aglio, cipolla, bacon (pancetta/bacon), parmesan | spezzato (bucatini), scotta |
| cacioepepe | burro, panna, parmesan, olio (NEW, "oil"; contested → low weight) | scotta, pentola |
| margherita | ananas(+pezzo), hawaiana, macchiata (ketchup on pizza), pollo, bbq (NEW), cheddar (NEW), pepperoni | — (NOT panna, mais, wurstel, ham, mushrooms: accepted on Italian pizza) |
| marinara | filante (NEW, "any cheese / mozzarella"), gamberi (seafood mix-up), vongola (the clam: seafood + cheese), parmesan, cheddar | ananas_pezzo |
| ragu | fantasma (spaghetti bolognese), aglio, panna, bacon (smoked pancetta) | surgelata (frozen lasagna), polpetta |
| pesto | panna, anacardo (NEW cashews), olio (NEW seed oil), burro, parmesan (generic grated cheese) | smartphone (viral pesto videos) |
| vongole | vongola (cheese on clams), parmesan, burro, panna | pollo? no — only if dataset supports |
| foodcourt | everything incl. method crimes, drinks (cappuccino after 11:00 event, frappe), smartphone, glassa, pastachips | — |

NEW enemy ids (sprite `enemy.<id>`, 4 frames + flash, existing behaviours only):
| id | Name (it / en) | Look (one dominant colour, readable at 1×) | Behaviour | Radius |
|----|----------------|---------------------------------------------|-----------|--------|
| burro | Burro Furbetto / Sneaky Butter | pale-yellow butter block on a foil wrapper, sly grin, melting drips, little butter knife | puddler (new hazard 'butter': yellow slick, slow 0.3) | 14 |
| funghi | Funghi Abusivi / Bootleg Mushrooms | cluster of 3 button mushrooms in a tiny mafia hat, spore puffs | burster (spore shots, proj 'proj.e_spore') | 13 |
| prosciutto | Prosciutto Impostore / Impostor Ham | pink cooked-ham slice folded like a cape, fake guanciale label | chase, knockResist 0.3 | 14 |
| broccoli | Broccolo Americano / American Broccoli | dark-green floret tree with a baseball cap, cream-sauce drip | lobber (throws florets → small cream puddles) | 15 |
| gamberi | Gambero Saltatore / Hopping Shrimp | coral-pink curled shrimp with goggles, tail flips | leaper | 12 |
| anacardo | Anacardo Abusivo / Bootleg Cashew | small beige kidney-shaped cashew, angry, comes in clumps | swarm | 8 |
| olio | Olio Sbagliato / Wrong Oil | squat plastic bottle of pale seed oil (sunflower on label, no brand) | puddler (hazard 'oil': glossy yellow slick, slow 0.25) | 13 |
| filante | La Filante Abusiva / Rogue Cheese Pull | stretchy melted-cheese blob with mozzarella strings reaching out (NOT the neat white XP ball) | slither | 14 |
| cheddar | Cheddar Arancione / Orange Cheddar | bright-orange square processed slice, corners curling, wobbly | strafe | 13 |
| bbq | Salsa Barbecue / BBQ Sauce | dark-brown squeeze bottle with a cowboy hat, smoky drips | ranged (proj 'proj.e_bbq') | 14 |

NEW bosses (sprite `boss.<id>` + `boss.<id>.attack`, pattern in `src/game/bosses/<id>.ts`):
| id | Name (it / en) | Dish | Concept & attacks (use the helpers in ai.ts: brain, ring, aimed, summon, leap, lobShot, hazard) | Taunt |
|----|----------------|------|------------------------------------------------------------------------------------------------|-------|
| b_aglio | Il Re dell'Aglio / The Garlic King | amatriciana | huge garlic bulb in a crown and royal cape of garlic skin; clove barrage (aimed fan), stink rings (slow green areas), summons 'aglio', leap slam; enrage: sheds skin, faster | "Solo uno spicchio… in camicia!" |
| b_burro | Il Panetto Supremo / The Supreme Butter Block | cacio e pepe | giant butter block on a ceramic butter dish, butter knife sword; melt puddles ('butter' hazards), sliding charge, butter-pat volleys; enrage: melts (faster, smaller hitbox) | "Un pochino di burro, per la cremosità!" |
| b_bolognese | Lo Spaghettone alla Bolognese / The Great Spaghetti Bolognese | ragù | a ghostly mountain of spaghetti in red sauce that "doesn't exist": phases out (invulnerable, translucent) and back; spaghetti lashes (line attacks), rolls meatballs (summon polpetta), sauce splats | "Io esisto! I EXIST!" |
| b_frullatore | Il Frullatore Rovente / The Red-Hot Blender | pesto | glass blender full of green sludge with cashews and cream, spinning blade; vortex pull, blade ring, green spray cones, summons anacardo; enrage: overheats (red glow, fire) | "Pesto in trenta secondi! Con anacardi e panna!" |
| b_grattugiato | Il Sacco del Grattugiato / The Bag of Pre-Grated Cheese | vongole (mid in marinara) | industrial plastic bag of grated "parmesan" with a torn corner; cheese snow cones, cheese cloud areas ('cheese' hazard exists), summons 'vongola', belly-flop leap | "Formaggio sulle vongole? Abbondante!" |
Boss info texts (crime/why) come from the dataset.

Existing enemies keep their art; their EnemyInfo.crime/why become general where they now appear in several dishes (e.g. panna
"Cream where it does not belong"), and the per-dish reasons live in the recipe intruder entries.

## 4. Environment variants
StageDef gains `variant?: { tint?, darkness?, darkColor?, vignette?, particles?, nightRamp?, decor?: 'basil' | 'lemons' | 'sea' |
'osteria' | ... }`. Implement as a wrapper StageEnv registered under `<env>:<dishId>` that overrides `ambient` and may add a
few existing props (no colliders within 260 of the origin). No new tile art.

## 5. UI
- Stage select → "Il Menù" (title "Il Menù", sub "Choose your dish"): course headers; dish cards with the dish illustration
  (`dish.<id>`), Italian name, English name, origin, real-ingredient icon row, intruder icon row, records (best time, wins,
  best kills, ★ perfect), lock note "🔒 Win <dish> (or <dish>) to unlock" / "🔒 Win 6 different dishes". Keyboard/gamepad nav
  and touch as today; must work at 390×844, 844×390, 1280×720.
- Run start banner: dish name + "Ingredienti veri: …" ; first-sighting toast per intruder: "<it> nella <dish>? NO!" + game_line.
- HUD recipe strip under the timer: dish icon + ingredient icons (grey until collected, ✓ pop on collect).
- Results: dish illustration, "n/m ingredienti", "Ricetta completa ★" when complete.
- Ricettario: new first tab "🍝 Ricette": dish list → detail with the proper recipe (ingredients with icons, method), why it is
  sacred (blurb), intruders (enemy icon, why, popularity dots), sources (authorities + Italian chefs; links open in a new tab),
  one verified chef quote if available, fun fact. Crimes tab: add "Non appartiene a:" dish chips for each enemy.
- Story screen text: recipes framing.

## 6. Progression
- Save version 2 migration: legacy wins kitchen→pomodoro+carbonara, trattoria→margherita, streets→marinara, foodcourt keeps id;
  copy legacy records to the mapped ids; recompute unlocked dishes from wins by the unlock rules.
- Characters: sofia = win Carbonara; concetta = win Amatriciana; micio = win the Margherita (legacy record ids also count).
- Medals: giro = "Win every dish on the menu"; new: perfetta "Ricetta Perfetta — collect every real ingredient and win the dish";
  romani "Primi Romani — win Carbonara, Alfredo, Amatriciana and Cacio e Pepe"; pizzaiolo "Pizzaiolo DOC — win the Margherita and
  the Marinara"; quaderno "Il Quaderno della Nonna — complete 5 different recipes".

## 7. Art contracts (all new sprites; follow docs/ART_GUIDE.md, quality = existing enemies/bosses)
- enemy.<id> for the 10 new enemies; proj.e_spore, proj.e_bbq, fx.butter_puddle, fx.seedoil_puddle.
- boss.<id> and boss.<id>.attack for the 5 new bosses (+ any new projectile sprites they need: proj.e_clove, proj.e_butterpat,
  proj.e_meatball?, proj.e_pesto, proj.e_cheese).
- ingr.<id> for the 27 ingredients: ~24×24 world units, anchor centre, 1 frame, res 3; a gold-rimmed round badge behind is
  drawn by the renderer, not in the sprite. Must read at 1× and as 22 px HUD icons.
- dish.<id> for the 11 dishes: plated dish illustration ~120×80 units, res 3 (menu cards, results, Ricettario).
Placeholders: the foundation registers simple placeholder sprites for every new id ONLY IF the id is still missing after all
art modules have loaded (src/gfx/art/placeholders.ts imported last), so art agents just fill their own pre-created files:
recipes_enemies_a.ts (burro funghi prosciutto broccoli gamberi + fx.butter_puddle + proj.e_spore), recipes_enemies_b.ts
(anacardo olio filante cheddar bbq + fx.seedoil_puddle + proj.e_bbq), recipes_bosses_a.ts (b_aglio, b_burro),
recipes_bosses_b.ts (b_bolognese, b_frullatore, b_grattugiato), recipes_ingredients.ts (27 ingr.*), recipes_dishes.ts (11 dish.*).

## 8. Docs
docs/RECIPES.md (the dossier, edited for the repo, with sources and the verification limits), docs/DESIGN.md (stages → the
menu, new enemies/bosses, recipe mechanic), README (levels section), docs/RESEARCH.md cross-link.
