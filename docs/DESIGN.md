# KITCHEN FIGHT — Game Design

> *Difendi la Tradizione!* — Defend the Tradition!

A top-down **survivors-like** (auto-attacking arena game). You steer an Italian
chef; your kitchen arsenal fires on its own. Hordes of **culinary crimes**
(pineapple pizza, cream carbonara, ketchup pasta, snapped spaghetti…) swarm in
from every side. Collect basil, tomatoes and mozzarella to level up, pick new
weapons and passives, evolve them into legendary forms, and survive 15 minutes
until the stage's final boss shows up. Beat it and Tradition is safe — for now.

## Pillars
1. **Instantly readable chaos** — bold silhouettes, distinct colours per enemy, juicy feedback.
2. **Funny and authentic** — every enemy is a real Italian food pet peeve (see `RESEARCH.md`).
3. **Builds that feel great** — 14 weapons × 14 passives, 14 evolutions, meaningful choices.
4. **Grade-A presentation** — hand-crafted vector art, dynamic lights, an Italian folk soundtrack.

## Core loop
Move (WASD / arrows / gamepad / touch joystick) → weapons auto-fire → enemies drop
XP ingredients → level up → choose 1 of 3–4 upgrades → elites & bosses drop a
**Picnic Basket** chest → open for upgrades or an **evolution** → survive → final
boss at 15:00 → victory. Coins collected in runs buy permanent upgrades in **La
Dispensa** (the pantry).

## Stages (15:00 each; mini-bosses at 5:00 and 10:00, final boss at 15:00)
| # | Stage | Look | Unlock |
|---|-------|------|--------|
| 1 | **La Cucina** — Trattoria kitchen | black/white checkered floor, steel counters, stoves with bubbling pots, copper pans, garlic braids, flour sacks, tomato crates | start |
| 2 | **La Trattoria** — dining room at night | herringbone parquet, round tables with red/white checked cloths, candles in Chianti bottles, lemon trees, wine racks | win stage 1 |
| 3 | **I Vicoli di Napoli** — Naples alleys at sunset→night | basalt cobblestones, Vespas, laundry lines overhead, fountains, street lamps, café tables, market stalls, pigeons | win stage 2 |
| 4 | **La Food Court** — the crimes' lair | glossy linoleum, plastic tables, neon fast-food counters, soda machines, wet-floor signs, fluorescent light | win stage 3 |

## Characters
| id | Name | Starting weapon | Bonus | Unlock |
|----|------|-----------------|-------|--------|
| enzo | **Chef Enzo** — head chef, tricolore apron | Mattarello | +10% Might | start |
| nonna | **Nonna Pina** — black dress, shawl, glasses | Ciabatta | +1 Armor, +0.3 Recovery, −10% speed | survive 5:00 |
| peppe | **Peppe il Pizzaiolo** — Neapolitan pizza maker | Pizza Volante | +15% Area | defeat 1,000 crimes (total) |
| sofia | **Sofia la Romana** — carbonara purist | Forchette | −8% Cooldown | win La Cucina |
| tommaso | **Fra' Tommaso** — monk cheesemaker | Forma di Parmigiano | +25% Max HP, +0.2 Recovery | collect 1,000 coins (total) |
| concetta | **Zia Concetta** — fiery Calabrian aunt | Peperoncino | +15% Luck, +10% Might | win La Trattoria |
| micio | **Micio** — the trattoria cat (tiny toque) | Basilico | +20% Move speed, +30% Magnet | win I Vicoli |

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
| **Moka** | moka pot lobbed into crowds, explodes in coffee steam | Vespa | **Moka Turbo** — chain explosions |
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
| **Vespa** (keys) | +10% Move speed |
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
- Breakable props (flour sacks, tomato crates, barrels, bins) drop pickups.

## Meta progression — La Dispensa (permanent power-ups, bought with coins)
Might, Armor, Max HP, Recovery, Cooldown, Area, Projectile speed, Duration,
Amount, Move speed, Magnet, Luck, Growth, Greed, Revival (“Bis!”), Reroll, Skip,
Banish.

## Il Ricettario (collection)
Bestiary of crimes with **why Italians object** (from research), weapons,
evolutions, characters, stage records.
