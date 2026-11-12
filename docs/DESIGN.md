# KITCHEN FIGHT — Game Design

> *Difendi la Tradizione!* — Defend the Tradition!

A top-down **survivors-like** (auto-attacking arena game). You steer an Italian
chef; your kitchen arsenal fires on its own. **Every level is an Italian dish**
(*Il Menù*), and the hordes are the **culinary crimes** that do not belong in it:
cream in the carbonara, ketchup on the spaghetti, pineapple on the Margherita,
cheese on the clams… Collect basil, tomatoes and mozzarella to level up, pick new
weapons and passives, evolve them into legendary forms, gather the dish's **real
ingredients** scattered on the map, and survive 15 minutes until the dish's final
boss shows up. Beat it and Tradition is safe — for now.

## Pillars
1. **Instantly readable chaos** — bold silhouettes, distinct colours per enemy, juicy feedback.
2. **Funny and authentic** — every enemy is a real Italian food pet peeve (see `RESEARCH.md`), and every level is a real recipe whose intruders come from what Italians actually complain about (see `RECIPES.md`).
3. **Builds that feel great** — 14 weapons × 14 passives, 14 evolutions, meaningful choices.
4. **Grade-A presentation** — hand-crafted vector art, dynamic lights, an Italian folk soundtrack.

## Core loop
Move (WASD / arrows / gamepad / touch joystick) → weapons auto-fire → enemies drop
XP ingredients → level up → choose 1 of 3–4 upgrades → elites & bosses drop a
**Picnic Basket** chest → open for upgrades or an **evolution** → pick up the dish's
**real ingredients** when they appear (each one is a small buff; all of them is
**RICETTA COMPLETA**) → survive → final boss at 15:00 → victory. Coins collected in
runs buy permanent upgrades in **La Dispensa** (the pantry).

## Il Menù: the levels
Ten dishes and a finale, in six courses, 15:00 each (mid-bosses at 5:00 and 10:00, final boss at 15:00).
Each plays in one of the four environments below with its own light and a little extra decor.
The proper recipes, the intruders and their sources are in [RECIPES.md](RECIPES.md).

| # | Dish (id) | Course | Environment · variant | Mid-bosses 5:00 / 10:00 | Final boss (15:00) | Unlock |
|---|-----------|--------|-----------------------|-------------------------|--------------------|--------|
| 1 | **Spaghetti al Pomodoro** (`pomodoro`) | Le Basi | La Cucina · morning | Lo Scatolone / Il Microonde Maledetto | Il Barone del Ketchup | start |
| 2 | **Spaghetti alla Carbonara** (`carbonara`) | Primi Romani | La Cucina · warm | L'Influencer della Padella Unica / Il Barattolo Alfredo | Il Colosso di Panna | win the Pomodoro |
| 3 | **Fettuccine Alfredo** (`alfredo`) | Primi Romani | La Trattoria · lunch | Il Microonde Maledetto / Il Colosso di Panna | Il Barattolo Alfredo | win the Carbonara |
| 4 | **Bucatini all'Amatriciana** (`amatriciana`) | Primi Romani | La Cucina · evening, embers | Lo Scatolone / L'Influencer | **Il Re dell'Aglio** (new) | win the Carbonara |
| 5 | **Tonnarelli Cacio e Pepe** (`cacioepepe`) | Primi Romani | La Trattoria · late night | Il Barattolo Alfredo / L'Influencer | **Il Panetto Supremo** (new) | win the Alfredo or the Amatriciana |
| 6 | **Pizza Margherita** (`margherita`) | Le Pizze | I Vicoli di Napoli · sunset to night | Il Pizzone Abissale / Il Barone del Ketchup | Il Re Ananas | win the Carbonara |
| 7 | **Pizza Marinara** (`marinara`) | Le Pizze | I Vicoli di Napoli · night | **Il Sacco del Grattugiato** (new) / Il Campanile del Cappuccino | Il Pizzone Abissale | win the Margherita |
| 8 | **Tagliatelle al Ragù** (`ragu`) | Dal Nord | La Trattoria · Bologna afternoon | Lo Scatolone / Il Microonde Maledetto | **Lo Spaghettone alla Bolognese** (new) | win the Cacio e Pepe or the Marinara |
| 9 | **Trofie al Pesto Genovese** (`pesto`) | Dal Nord | I Vicoli di Napoli · Ligurian day (green tint) | Il Panetto Supremo / L'Influencer | **Il Frullatore Rovente** (new) | win the Ragù |
| 10 | **Spaghetti alle Vongole** (`vongole`) | Dal Sud e dal Mare | I Vicoli di Napoli · seaside morning (blue tint) | Il Panetto Supremo / Il Colosso di Panna | **Il Sacco del Grattugiato** (new) | win the Marinara or the Pesto |
| 11 | **Il Menù degli Orrori** (`foodcourt`) — the finale | Il Gran Finale | La Food Court | Il Campanile del Cappuccino / L'Influencer | Il Mostro della Fusione | win any 6 different dishes |

- **Unlock rules** (`StageDef.unlock`): `null` (from the start), `{ anyOf: [...] }` (win any of these
  dishes) or `{ wins: n }` (win n different dishes). Locked cards say why ("Win Pizza Marinara or Trofie
  al Pesto Genovese to unlock").
- **Difficulty** comes from six tiers (`TIERS` in `src/game/stages.ts`), interpolated from the old stages:
  Pomodoro ≈ the old kitchen ×0.9; Carbonara ≈ the old kitchen; Alfredo, Amatriciana and Margherita ≈ the
  old trattoria; Cacio e Pepe and Marinara between the trattoria and the streets; Ragù, Pesto and Vongole ≈
  the old streets; the finale ≈ the old food court. A dish's waves choose *who* comes; its tier sets how
  many and how tough.
- **Music** is the environment's track (kitchen, trattoria, streets, food court).
- **Variants** (`src/gfx/envvariants.ts`) change only the light (tint, darkness, vignette, a night ramp)
  and the particles (dust, flour, embers, fireflies), and add a little decor made of existing props (tomato
  crates and sauce stains, a flour-dusted pantry, lemon crates, wine crates, basil pots, sea-side puddles).
  The paths and the spawn area stay those of the base environment.
- **Old saves** (four stages, save version 1) migrate to version 2: La Cucina's records and wins carry
  over to the Pomodoro and the Carbonara, La Trattoria's to the Margherita, I Vicoli's to the Marinara;
  the Food Court keeps its id. The unlocked list restarts from the Pomodoro (plus the finale if it was
  already open), then every dish whose rule the carried-over wins satisfy is unlocked.

### Environments
| Environment | Look | Dishes |
|-------------|------|--------|
| **La Cucina** — trattoria kitchen | black/white checkered floor, steel counters, stoves with bubbling pots, copper pans, garlic braids, flour sacks, tomato crates | Pomodoro, Carbonara, Amatriciana |
| **La Trattoria** — dining room | herringbone parquet, round tables with red/white checked cloths, candles in Chianti bottles, lemon trees, wine racks | Alfredo, Cacio e Pepe, Ragù |
| **I Vicoli di Napoli** — Naples alleys | basalt cobblestones, scooters, laundry lines overhead, fountains, street lamps, café tables, market stalls, pigeons | Margherita, Marinara, Pesto, Vongole |
| **La Food Court** — the crimes' lair | glossy linoleum, plastic tables, neon fast-food counters, soda machines, wet-floor signs, fluorescent light | the finale |

## The recipe mechanic
Every dish has 4–6 **real ingredients** (`RecipeDef.ingredients` in `src/game/recipes.ts`, 27 different
ones in all, sprites `ingr.<id>`). The finale's six are "Nonna's pantry", one sacred ingredient from
each corner of Italy.

- **When.** Director events place them one by one, in recipe order, at evenly spaced times between
  1:10 and 13:50, kept at least 20 s clear of the 5:00 and 10:00 bosses (`ingredientTimes()`).
- **Where.** 320–520 units from the chef on free ground, preferably *behind* him (opposite to where he is
  walking), so he has to turn back for it. A toast says "<ingredient> is on the map! Follow the green arrow."
- **Look.** A golden glow, a pulsing ground ring, a gold-rimmed badge and a bobbing sprite; off screen it
  gets the biggest arrow on screen, in green.
- **Pickup.** The magnet ignores it until the chef is within 60 units. Left alone for 90 s, it starts
  drifting slowly toward him.
- **Collect.** A banner "<Ingredient> ✓ n/m" with its buff, a chime and a chef line. The buff lasts for the
  rest of the run (by category, `BUFFS`):

| Category | Ingredients | Buff |
|---|---|---|
| pasta, dough | spaghetti, fettuccine, tonnarelli, tagliatelle, Neapolitan dough | +8% Duration |
| tomato, egg | tomatoes, passata, egg yolks | +10% Max HP |
| oil | extra-virgin olive oil | +5% Might |
| meat | guanciale, pancetta, beef | +6% Might |
| aroma | garlic, oregano | +5% Area |
| water | starchy pasta water | +8% Area |
| herb | basil, parsley | +0.2 HP/s |
| cheese | pecorino, Parmigiano, mozzarella | +1 Armor |
| spice | black pepper, chili | −5% Cooldown |
| fat | butter | +15% Magnet |
| wine | wine | +8% Luck |
| veg | soffritto | +5% Move speed |
| nut | pine nuts | +8% Growth |
| sea | clams | +10% Projectile speed |

- **RICETTA COMPLETA!** All of a dish's ingredients in one run: full heal, +10% Might, +50 coins,
  confetti and the dinner bell. The dish's record gets **★ Ricetta completa** on its menu card (saved even
  if the run is then lost; the *Ricetta Perfetta* medal also needs the win).
- **Intruders.** The first time each intruder of the dish is on screen, a toast names the crime with a
  one-line reason ("Panna nella Carbonara? NO! …"); the full reason is in Il Ricettario. **Friend or
  foe:** butter, garlic, pancetta, Parmigiano, mozzarella and onion belong in some dishes and are crimes in others; a one-off toast says so when you
  collect one where it belongs or meet it where it does not ("Garlic! In pesto it belongs. Not here!").
  At most 6 toasts wait in the queue; one is shown every 5 s.
- **Waves.** In every minute at least 80 % of the spawn weight comes from the dish's intruders; the rest
  (≤ 20 %) are the dish's *extras*, method crimes that fit it (snapped spaghetti in the Pomodoro, the
  one-pot carbonara in the Carbonara…). Over the run, the intruders' shares follow their order in the
  recipe (the loudest crime comes most often), and every intruder spawns. Garlic, a support enemy, is
  exempt from the order (and from the spawn check). `stageRuleProblems()` checks all of this for dishes
  1–10 and `scripts/validate.mjs` prints any problem. **The finale is exempt from every wave rule**: its
  waves are mixed by hand and not checked.

## Characters
| id | Name | Starting weapon | Bonus | Unlock |
|----|------|-----------------|-------|--------|
| enzo | **Chef Enzo** — head chef, tricolore apron | Mattarello | +10% Might | start |
| nonna | **Nonna Pina** — black dress, shawl, glasses | Ciabatta | +1 Armor, +0.3 Recovery, −10% speed | survive 5:00 in any dish |
| peppe | **Peppe il Pizzaiolo** — Neapolitan pizza maker | Pizza Volante | +15% Area | defeat 1,000 crimes (total) |
| sofia | **Sofia la Romana** — carbonara purist | Forchette | −8% Cooldown | win the Carbonara |
| tommaso | **Fra' Tommaso** — monk cheesemaker | Forma di Parmigiano | +25% Max HP, +0.2 Recovery | collect 1,000 coins (total) |
| concetta | **Zia Concetta** — fiery Calabrian aunt | Peperoncino | +15% Luck, +10% Might | win the Amatriciana |
| micio | **Micio** — the trattoria cat (tiny toque) | Basilico | +20% Move speed, +30% Magnet, −15% Max HP | win the Margherita |

Wins of the old stages still count (La Cucina for Sofia, La Trattoria for Concetta, I Vicoli for Micio).

## Weapons (max level 8) and evolutions
| Weapon | Behaviour | + Passive | → Evolution |
|--------|-----------|-----------|-------------|
| **Mattarello** (rolling pin) | horizontal sweeping smash in facing direction (+behind at L2) | Grembiule | **Mattarello della Nonna** — double 360° spin, heals on kills |
| **Ciabatta** (Nonna's slipper) | boomerang thrown at nearest enemy, returns, pierces | Minestrone | **L'Ira della Nonna** — homing golden slippers, stun |
| **Coltelli** (chef knives) | fast knives in facing direction | Espresso | **Mille Coltelli** — endless knife stream |
| **Olive** | olives auto-aimed at nearest enemy | Olio EVO | **Olive d'Oro** — piercing golden olives that leave oil slicks |
| **Forchette** (forks) | forks orbit the chef | Semola | **Tridente di Nettuno** — permanent orbiting golden tridents |
| **Pizza Volante** | spinning dough discs tossed up in arcs | San Marzano | **Pizza Celeste** — margheritas rain from the sky |
| **Rotella** (pizza cutter) | wheel bouncing off the screen edges | Cornicello | **Ruota della Fortuna** — golden wheels, big crits |
| **Peperoncino** | chillies burst into burning patches | Sale Grosso | **Inferno Calabrese** — fire trails + giant blazes |
| **Moka** | moka pot lobbed into crowds, explodes in coffee steam | Motorino | **Moka Turbo** — chain explosions |
| **Spaghetti** | noodle lash chaining between nearby enemies | Macinapepe | **Tornado Cacio e Pepe** — spinning pasta tornado |
| **Vesuvio** | lava rocks strike random enemies on screen | Grattugia | **Pompei** — meteor showers |
| **Forma di Parmigiano** | huge cheese wheel rolls through everything | Salvadanaio | **Forma d'Oro** — golden wheels (Parmigiano is literally bank collateral in Emilia) |
| **Basilico** | homing basil leaves | Profumo di Ragù | **Pesto Genovese** — leaves burst into slowing pesto |
| **Forno** (oven heat) | damaging heat aura around the chef | Ricettario | **Forno a Legna** — bigger blazing aura, burns |

## Passives (max level 5 unless noted)
| Passive | Effect per level |
|---------|------------------|
| **Olio Extra Vergine** | +10% Might (damage) |
| **Espresso** | −8% Cooldown |
| **Grembiule della Nonna** (apron) | +1 Armor |
| **Pomodoro San Marzano** | +20% Max HP |
| **Minestrone** | +0.25 HP/s Recovery |
| **Grattugia** (grater) | +10% Area |
| **Semola di Grano Duro** | +10% Duration |
| **Macinapepe** (pepper mill) | +1 Amount (max 2) |
| **Motorino** (scooter keys) | +10% Move speed |
| **Cornicello** (lucky horn) | +10% Luck |
| **Ricettario della Nonna** | +8% Growth (XP) |
| **Profumo di Ragù** | +25% Magnet radius |
| **Sale Grosso** | +10% Projectile speed |
| **Salvadanaio** (piggy bank) | +15% Greed (coins) |

## Pickups
- XP: **Basil leaf** (1), **Cherry tomato** (5), **Mozzarella** (25), **Parmigiano chunk** (100, merged) — the tricolore.
- **Euro coin**, **coin pouch**.
- **Cannolo** (+20 HP), **Lasagna** (+50 HP).
- **Campanella della Nonna** — dinner bell: "A TAVOLA!" — pulls every XP ingredient on the map.
- **Spumante** — bottle pop: damages every enemy on screen ("SALUTE!").
- **Gelato** — freezes every enemy for 6 s.
- **Cesta da Picnic** — picnic-basket chest (from elites & bosses).
- **Real ingredients** of the dish — see [The recipe mechanic](#the-recipe-mechanic).
- Breakable props (flour sacks, tomato crates, barrels, bins) drop pickups.

## The crimes (enemies & bosses)
Every enemy is a documented Italian food pet peeve — sources and quotes in `RESEARCH.md` and, per dish,
in `RECIPES.md`; shown in-game in *Il Ricettario*. An enemy's crime below is the general one; the reason
it does not belong in each dish is in the recipe's intruder entry (`src/game/recipes.ts`).

| Enemy | English | Behaviour | The crime | Intruder in |
|---|---|---|---|---|
| Lo Spezzaspaghetti | The Spaghetti-Snapper | swarm | Breaking spaghetti to fit the pot | method crime (Pomodoro, Amatriciana) |
| Spruzzatore Rosso | The Red Squirter | ranged | Ketchup on pasta | Pomodoro |
| Panna Invasora | Invading Cream | puddler | Cream where it does not belong | Carbonara, Alfredo, Cacio e Pepe, Ragù, Pesto, Vongole |
| Forbici Furiose | Furious Scissors | charger | Cutting spaghetti with scissors (or a knife) | method crime (Pomodoro) |
| Pasta Scotta | Mushy Pasta | hopper | Overcooked, mushy pasta | method crime (Pomodoro, Alfredo, Amatriciana, Cacio e Pepe) |
| Lo Sciacquapasta | The Pasta-Rinser | hopper | Rinsing cooked pasta (splits off Mushy Pasta) | method crime (wherever Mushy Pasta is: Pomodoro, Alfredo, Amatriciana, Cacio e Pepe) |
| Cipolla Clandestina | Stowaway Onion | chase | Onion in carbonara or amatriciana | Carbonara, Amatriciana |
| Aglio in Camicia | Garlic in Its Shirt | support | Garlic where it does not belong | Carbonara, Alfredo, Amatriciana, Ragù |
| Bacon Abusivo | Unlicensed Bacon | slither | Bacon (or smoked pancetta) instead of guanciale | Carbonara, Amatriciana, Ragù |
| Piselli Ribelli | Rebel Peas | swarm | Peas in carbonara | Carbonara |
| Ananas Corazzato | Armoured Pineapple | chase | Pineapple on pizza | Margherita |
| Pezzo d'Ananas | Pineapple Chunk | chase | Tinned pineapple chunks | Margherita (extra on the Marinara) |
| Pollo Infiltrato | Undercover Chicken | leaper | Chicken in pasta (and on pizza) | Pomodoro, Carbonara, Alfredo, Margherita |
| Peperone Equivoco | The Misunderstood Pepper | orbiter | "Pepperoni" pizza | Margherita |
| Polpetta Rotolante | Rolling Meatball | roller | Spaghetti and meatballs | Pomodoro (extra in the Ragù) |
| Fetta Hawaiana | Hawaiian Slice | chase | Ham & pineapple "Hawaiian" pizza | Margherita |
| Cappuccino Ritardatario | Latecomer Cappuccino | chase | Cappuccino after 11 a.m. (or with a meal) | only in the finale |
| Alfredo il Colloso | Alfredo the Gluey | puddler | Creamy chicken "Alfredo" | Alfredo |
| Spargipolvere | The Dust-Sprinkler | lobber | Powdered "parmesan", or Parmigiano where it does not belong | Carbonara, Alfredo, Amatriciana, Cacio e Pepe, Marinara, Pesto, Vongole |
| Margherita Macchiata | Stained Margherita | burster | Ketchup on pizza | Margherita |
| Frappè Zuccheroso | Sugar-Rush Frappé | charger | Giant whipped-cream "coffee" drinks | only in the finale |
| Il Telefonino Virale | The Viral Phone | ranged | Viral "Italian" recipe videos | extra in the Pesto |
| Pentola Fredda | The Cold Pot | aura | Starting pasta in cold water | method crime (Pomodoro, Cacio e Pepe) |
| Vongola Formaggiosa | The Cheesy Clam | strafe | Grated cheese on seafood pasta (and seafood on the Marinara) | Marinara, Vongole |
| Lasagna Surgelata | Frozen Lasagna | chase | Frozen microwave lasagna | extra in the Ragù |
| La Pentola Unica | The Single Pot | devourer | One-pot "carbonara" | extra in the Carbonara |
| Glassa Balsamica | Balsamic Glaze | puddler | Sugary balsamic glaze on everything | only in the finale |
| Patatine di Pasta | Pasta Crisps | swarm | Air-fried "pasta chips" | only in the finale |
| Scatoletta Maledetta | The Cursed Little Can | kamikaze | Canned carbonara | extra in the Carbonara |
| Spaghetti Fantasma | Ghost Spaghetti | ghost | Spaghetti bolognese | Ragù |
| **Burro Furbetto** (new) | Sneaky Butter | puddler (butter slick) | Butter where it does not belong | Carbonara, Cacio e Pepe, Pesto, Vongole |
| **Funghi Abusivi** (new) | Bootleg Mushrooms | burster (spore shots) | Mushrooms in carbonara | Carbonara |
| **Prosciutto Impostore** (new) | Impostor Ham | chase | Cooked ham instead of guanciale | Carbonara |
| **Broccolo Americano** (new) | American Broccoli | lobber (florets) | Broccoli in Fettuccine Alfredo | Alfredo |
| **Gambero Saltatore** (new) | Hopping Shrimp | leaper | Shrimp in Alfredo (and seafood on the Marinara) | Alfredo, Marinara |
| **Anacardo Abusivo** (new) | Bootleg Cashew | swarm | Cashews in pesto | Pesto |
| **Olio Sbagliato** (new) | Wrong Oil | puddler (seed-oil slick) | The wrong oil | Cacio e Pepe, Pesto |
| **La Filante Abusiva** (new) | Rogue Cheese Pull | slither | Cheese on a Marinara | Marinara |
| **Cheddar Arancione** (new) | Orange Cheddar | strafe | Cheddar on pizza | Margherita, Marinara |
| **Salsa Barbecue** (new) | BBQ Sauce | ranged | BBQ sauce on pizza | Margherita |

The finale mixes crimes from the whole menu, and its waves are exempt from every wave rule. At the time of
writing every enemy above appears there except Mushy Pasta, the Pasta-Rinser, garlic, bacon and chicken.
The last three are listed among the finale's intruders, so their absence is a wave fix for `stages.ts`.

| Boss | English | The crime | Final boss of | Mid-boss in |
|---|---|---|---|---|
| Il Barone del Ketchup | The Ketchup Baron | Ketchup on pasta — Italy's #1 food crime | Pomodoro | Margherita |
| Il Barattolo Alfredo | The Alfredo Jar | Jarred "Alfredo" sauce | Alfredo | Carbonara, Cacio e Pepe |
| Il Colosso di Panna | The Cream Colossus | Cream in carbonara — the original sin | Carbonara | Alfredo, Vongole |
| Lo Scatolone | The Big Can | Canned spaghetti in sweet sauce | — | Pomodoro, Amatriciana, Ragù |
| Il Pizzone Abissale | The Abyssal Deep-Dish | Chicago deep-dish "pizza" | Marinara | Margherita |
| Il Re Ananas | The Pineapple King | The King of all pizza crimes | Margherita | — |
| Il Campanile del Cappuccino | The Cappuccino Clock Tower | Cappuccino after lunch, with dinner, with pizza… | — | Marinara, the finale |
| L'Influencer della Padella Unica | The One-Pan Influencer | The viral recipe factory | — | Carbonara, Amatriciana, Cacio e Pepe, Pesto, the finale |
| Il Microonde Maledetto | The Cursed Microwave | Microwaving pasta | — | Pomodoro, Alfredo, Ragù |
| Il Mostro della Fusione | The Fusion Abomination | Every crime at once | the finale | — |
| **Il Re dell'Aglio** (new) | The Garlic King | Garlic in amatriciana | Amatriciana | — |
| **Il Panetto Supremo** (new) | The Supreme Butter Block | Butter in cacio e pepe | Cacio e Pepe | Pesto, Vongole |
| **Lo Spaghettone alla Bolognese** (new) | The Great Spaghetti Bolognese | Spaghetti bolognese | Ragù | — |
| **Il Frullatore Rovente** (new) | The Red-Hot Blender | Instant pesto with cream and cashews | Pesto | — |
| **Il Sacco del Grattugiato** (new) | The Bag of Pre-Grated Cheese | Pre-grated cheese on clams | Vongole | Marinara |

The five new bosses (patterns in `src/game/bosses/b_*.ts`):
- **Il Re dell'Aglio** — a crowned garlic bulb: fans of garlic cloves, stink clouds that slow, a royal belly
  slam, garlic courtiers; enraged, he sheds his papery skin and speeds up. *"Solo uno spicchio… in camicia!"*
- **Il Panetto Supremo** — a giant butter block: butter pats that land as slippery puddles, telegraphed
  slides that leave a buttery trail, rings of pats; enraged, it melts (smaller and faster).
  *"Un pochino di burro, per la cremosità!"*
- **Lo Spaghettone alla Bolognese** — a ghostly mountain of spaghetti that "doesn't exist": spaghetti lashes
  down warning lanes, phases out (invulnerable) and back, rolls meatballs, lobs sauce puddles. *"Io esisto! I EXIST!"*
- **Il Frullatore Rovente** — a blender of green sludge: sweeping sludge sprays, a vortex that pulls the chef
  in, blade rings, bootleg cashews; enraged, it overheats and leaves fire. *"Pesto in trenta secondi! Con anacardi e panna!"*
- **Il Sacco del Grattugiato** — a torn bag of pre-grated "parmesan": cheese snow cones, slowing cheese
  clouds, a belly-flop, cheesy clams. *"Formaggio sulle vongole? Abbondante!"*

## Medals (Medaglie)
Checked at the end of every run (`src/game/medals.ts`).

| Medal | How |
|---|---|
| Primo Servizio | Finish your first service. |
| Al Dente | Survive 5 minutes. |
| Cottura Perfetta | Survive 10 minutes. |
| Chef Stellato | Win any stage. |
| Mille Crimini | Stop 1,000 crimes in a single run. |
| Evoluzione! | Evolve a weapon. |
| Cucina Completa | Carry 6 weapons at once. |
| Niente Ananas | Defeat 500 pineapples (in total). |
| Il Boss sono Io | Defeat 10 bosses (in total). |
| Senza Panna | Win a stage taking less than 150 damage. |
| La Nonna Approva | Win a stage as Nonna Pina. |
| Gatto Chef | Win a stage as Micio. |
| Tutti a Tavola | Unlock every chef. |
| Giro d'Italia | Win every dish on the menu (was: all four stages). |
| **Ricetta Perfetta** (new) | Collect every real ingredient and win the dish. |
| **Primi Romani** (new) | Win Carbonara, Alfredo, Amatriciana and Cacio e Pepe. |
| **Pizzaiolo DOC** (new) | Win the Margherita and the Marinara. |
| **Il Quaderno della Nonna** (new) | Complete 5 different recipes (★ on 5 dishes, won or not). |

## Meta progression — La Dispensa (permanent power-ups, bought with coins)
Might, Armor, Max HP, Recovery, Cooldown, Area, Projectile speed, Duration,
Amount, Move speed, Magnet, Luck, Growth, Greed, Revival (“Bis!”), Reroll, Skip,
Banish.

## Il Ricettario (collection)
- **Ricette** — every dish of the menu: the proper recipe (ingredients and method), why it is sacred, its
  intruders with *why Italians object* and how loudly, the sources (authorities and Italian chefs), a
  verified quote where there is one, and a fun fact. The long version, with the research limits, is
  [RECIPES.md](RECIPES.md).
- **Crimini** — the bestiary with *why Italians object* (from research) and, for each crime, the dishes it
  does not belong in ("Non appartiene a:").
- **Armi** (weapons and their evolutions), **Ingredienti** (the passive ingredients) and **Record** (each
  dish's records).
