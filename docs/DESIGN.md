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
| 5 | **Tonnarelli Cacio e Pepe** (`cacioepepe`) | Primi Romani | La Trattoria · late night | L'Influencer / Il Barattolo Alfredo | **Il Panetto Supremo** (new) | win the Alfredo or the Amatriciana |
| 6 | **Pizza Margherita** (`margherita`) | Le Pizze | I Vicoli di Napoli · sunset to night | Il Barone del Ketchup / Il Pizzone Abissale | Il Re Ananas | win the Carbonara |
| 7 | **Pizza Marinara** (`marinara`) | Le Pizze | I Vicoli di Napoli · night | **Il Sacco del Grattugiato** (new) / Il Campanile del Cappuccino | Il Pizzone Abissale | win the Margherita |
| 8 | **Tagliatelle al Ragù** (`ragu`) | Dal Nord | La Trattoria · Bologna afternoon | Lo Scatolone / Il Microonde Maledetto | **Lo Spaghettone alla Bolognese** (new) | win the Cacio e Pepe or the Marinara |
| 9 | **Trofie al Pesto Genovese** (`pesto`) | Dal Nord | I Vicoli di Napoli · Ligurian day (green tint) | Il Panetto Supremo / L'Influencer | **Il Frullatore Rovente** (new) | win the Ragù |
| 10 | **Spaghetti alle Vongole** (`vongole`) | Dal Sud e dal Mare | I Vicoli di Napoli · seaside morning (blue tint) | Il Panetto Supremo / Il Colosso di Panna | **Il Sacco del Grattugiato** (new) | win the Marinara or the Pesto |
| 11 | **Il Menù degli Orrori** (`foodcourt`) — the finale | Il Gran Finale | La Food Court | Il Campanile del Cappuccino / L'Influencer | Il Mostro della Fusione | win any 6 different dishes |

- **Unlock rules** (`StageDef.unlock`): `null` (from the start), `{ anyOf: [...] }` (win any of these
  dishes) or `{ wins: n }` (win n different dishes). Locked cards say why ("Win Pizza Marinara or Trofie
  al Pesto Genovese to unlock").
- **Difficulty** comes from the dish's tier, one of six, tuned against the old stages (see
  [Difficulty](#difficulty) below). A dish's waves choose *who* comes; its tier sets how many, how fast
  and how tough. How hard they hit is capped for every dish.
- **Music** is the environment's track (kitchen, trattoria, streets, food court).
- **Variants** (`src/gfx/envvariants.ts`) change only the light (tint, darkness, vignette, a night ramp)
  and the particles (dust, flour, embers, fireflies), and add a little decor made of existing props (tomato
  crates and sauce stains, a flour-dusted pantry, lemon crates, wine crates, basil pots, sea-side puddles).
  The paths and the spawn area stay those of the base environment, and decor that would stand in or
  through a base prop (the oven, a counter, a stall, the fountain) is left out.
- **Old saves** (four stages, save version 1) migrate to version 2: La Cucina's records and wins carry
  over to the Pomodoro and the Carbonara, La Trattoria's to the Margherita, I Vicoli's to the Marinara;
  the Food Court keeps its id. The unlocked list restarts from the Pomodoro (plus the finale if it was
  already open), then every dish whose rule the carried-over wins satisfy is unlocked.
  - Each format has its own storage key. Version 2 saves live under `kitchenfight.save.v2`. The old key,
    `kitchenfight.save.v1`, is only read, to carry a save over while there is no version 2 save yet; it is
    never written and never removed, so the build before Il Menù (which cannot play a version 2 save) keeps
    playing on its own save in the same browser.
  - A save reset writes a fresh version 2 save at once, so the old save is not carried over a second time.
    It leaves the old key alone: that save belongs to the old build.
  - When a save loads, the chefs and the medals that its totals and wins have already earned are granted
    without a message (after a migration: Micio through La Trattoria's win, *Pizzaiolo DOC* through both
    pizzas), so the chef picker and the Record tab agree with the menu from the first screen on.
  - The migration hands back *Giro d'Italia*: it meant "all four stages" and now means every dish, of which
    an old save has won five at most. It is earned again, with its results line, on the full menu.

### Difficulty
Every dish has one of six tiers (`TIERS` in `src/game/stages.ts`), each measured against one of the old stages.

| Tier | Dishes | Measured against | hpBase | hpGrowth | dmgBase | bossDmg | rate | max | speed | Boss HP 5:00 / 10:00 / 15:00 |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | Pomodoro | the old kitchen ×0.9 | 0.9 | 0.10 | 0.85 | 0.85 | 0.74 | 0.8 | 1 | 1300 / 2100 / 3300 |
| T2 | Carbonara | the old kitchen | 1.0 | 0.11 | 1.0 | 1.0 | 0.93 | 0.94 | 1 | 1400 / 2300 / 3600 |
| T3 | Alfredo, Amatriciana, Margherita | the old trattoria | 1.6 | 0.21 | 2.2 | 1.45 | 1.4 | 1.05 | 1.15 | 800 / 1750 / 2400 |
| T4 | Cacio e Pepe, Marinara | between the trattoria and the streets | 1.9 | 0.50 | 2.4 | 1.5 | 1.8 | 1.2 | 1.3 | 800 / 1800 / 2400 |
| T5 | Ragù, Pesto, Vongole | the old streets | 2.2 | 0.55 | 2.6 | 1.55 | 1.9 | 1.2 | 1.4 | 1200 / 1350 / 2200 |
| T6 | the finale | the old food court | 2.9 | 0.26 | 2.6 | 1.75 | 1.6 | 1.2 | 1.4 | 700 / 680 / 1550 |

- **The columns.** `hpBase` multiplies enemy HP and phases in over the first 7 minutes (`Director`);
  `hpGrowth` adds HP every minute, faster after 10:00. `dmgBase` multiplies the damage of the waves and
  `bossDmg` that of the bosses and of the adds they call. `rate` and `max` multiply the spawns per second
  and the cap of live enemies (`BASE_RATE`, `BASE_MAX`). `speed` multiplies the walk of everything a dish
  spawns except its bosses and its heavy bodies.
- **Hit size is capped.** Difficulty comes from crowds, speed, toughness and the patterns of the crimes and
  the bosses, not from how much one touch takes.
  - *One cap for everything.* No enemy ever hits for more than 2.9 × its base damage (`DMG_FACTOR_MAX`,
    applied in `dmgFactor()`), in any dish, at any time. A dish's `dmgBase` only decides how early its
    waves get there: about 9:15 at 2.2, 8:40 at 2.4, 8:10 at 2.6. After that the hits stop growing; the
    crowd, its toughness and its pace do not.
  - *What that means for a chef with no pantry* (120 HP, no armor; `HIT_CAP` in `stages.ts`):

    | What hits | Most it can cost | The rule |
    |---|---|---|
    | the touch of an ordinary walker (base damage up to 8: onion, ghost, Hawaiian slice, cappuccino) | 19 % of the bar; 17 % for the cream, butter, clams and cheese pulls that carry most dishes | at most 25 % |
    | a heavy, slow body (`heavy` in `enemies.ts`: frozen lasagne, armoured pineapple, Alfredo the Gluey, the single pot at any size) | 24 % | at most 40 %, and four touches must not kill |
    | an elite (×1.5) | 25–29 % for an elite walker, 36 % for an elite heavy body | at most 40 % |
    | a cursed can's blast (0.8 s fuse) | 39 % in the finale, 22 % in the Carbonara | at most 40 % |
    | a shot or a lob | 15 % (an elite Stained Margherita's burst), 10 % otherwise | at most 20 % |
    | anything a boss calls to its side | 30–32 % in a fight (the Ragù's cans at 10:00), 39 % at the very most | at most 40 % |

  - *Five touches never kill, and four of a heavy body never do.* Measured at 14:00 with three of a
    kind pinned on a standing chef with no pantry:

    | What touches him | Touches to bring him down | From the first to the last |
    |---|---|---|
    | an ordinary walker, in every dish from T3 up (`SURVIVES_TOUCHES`) | 6 (10 in the Carbonara, 11 or more in the Pomodoro) | 2.7 s |
    | a heavy body: frozen lasagne, armoured pineapple, Alfredo the Gluey (`SURVIVES_HEAVY_TOUCHES`) | 5 (the single pot, fully fed, 8 in the Carbonara) | 2.1 s |
    | an elite heavy body (one announced event at a time; bounded by the 40 % only) | 3 | — |

    A heavy body walks at a quarter to two fifths of the chef's pace (lasagne 32 px/s, pineapple 38,
    Gluey 42, pot 50, against his 132). The waves of T4 and T5 used to carry a `dmgBase` of 3.5 and 3.8:
    a touch cost a third of the bar late in six dishes, and three or four killed.
  - *No inversion.* `dmgBase` never falls from one tier to the next (the finale's walkers used to hit
    half as hard as T5's), and no walker out-hits the touch of its own dish's 10:00 boss.
  - *Checked, not promised.* `hitRuleProblems()` (part of `stageRuleProblems()`, which
    `scripts/validate.mjs` prints) computes every one of these for every dish from the stage and enemy
    tables: wave minutes at their end, events and elites at their time, split pieces and the adds of a
    boss as late as 25:00. A retune that breaks one fails the validation with the dish, the minute and
    the enemy.
  - *Three crimes changed for it.* The cappuccino's base damage is 8 (it was 9, the only ordinary walker
    above 8). The armoured pineapple's is 10 (it was 11: four touches killed, where every other heavy
    body needed five). The single pot's touch no longer grows with its meals (`DEVOUR.dmg` 1; it was
    ×1.06 a meal, ×1.5 fully fed, which put a fed pot in the Carbonara above that dish's 10:00 boss and
    made it a four-touch kill in the finale): a fed pot is wider and tougher, not harder-hitting.
- **Speed took over.** Everything a dish spawns walks × the dish's `speed` (`waveSpeed()`).
  - *Guard rail:* no walker is taken past 85 % of the chef's base pace (`WALKER_SPEED_CAP`; 112 px/s
    against his 132), and that counts the ±8 % spread every spawn gets (`SPEED_JITTER`): the factor
    stops at a nominal 104 px/s (`WALKER_SPEED_MAX`), so a capped kind walks at 96–112 px/s, 79 % of
    the chef's pace on average. What is faster by design keeps its own speed: the rolling meatball
    (118, up to 127 with the spread) and the orbiting pepper (120, up to 130). Dashes, leaps and
    stampedes have their own speeds and are not touched.
  - *Hoppers.* A hop keeps its own speed (170 px/s for the pasta-rinser, as in every dish before); the
    dish's factor shortens the rest between two hops instead (`Enemy.pace`). In the finale (×1.4) forty
    pasta-rinsers closed in at 76 px/s on average over their first four seconds, against 66 in the
    Carbonara (×1); no hop was faster than 183 px/s in either.
  - *Heavy bodies and bosses keep their pace* (the lasagne walks at a quarter of the chef's): a harder
    hit is fair because it is slow.
  - *The garlic's aura* (everything near a garlic acts ×1.35 faster) counts: where the dish's factor has
    used up the room, the aura gives less (`buffFactor()`), so a buffed walker stays under the same cap
    (spread included) unless the aura alone already took it there (a buffed pasta-snapper was at 80 %
    of the chef's pace before any factor; pasta crisps, peas and chicken go past it under the aura as
    they always did).
  - *In numbers,* at full factor: a cream carton walks at 40 % of the chef's pace in T3, 45 % in T4 and
    49 % in T5 and the finale (59 % in the Pesto; 35 % without the factor); the fastest walkers the factor
    moved are at the cap (chicken, pineapple chunks, cashews, peas, pasta crisps, the shrimp between its
    leaps: the quickest of 60 spawns of each walked at 112 px/s, none faster).
- **Gentle openings.** A rate factor above 1 is ×1 until minute 2 and reaches full strength at minute 8
  (`RATE_RAMP`); a speed factor above 1 is ×1 until 3:00 and full at 8:00 (`SPEED_RAMP`); a `dmgBase` or
  `bossDmg` above 1 is ×1 until 4:00 and full at 10:00 (`DMG_RAMP`). Up to 3:00 the dishes of T2–T6
  hit and walk alike. They already differ in who comes, in numbers (`max` is not phased) and in
  toughness: `hpGrowth` counts from 0:00, so at 3:00 a T5 crime has 4× its base HP where a T2 crime has
  1.3×. The tiers differ most in minutes 7–15.
- **Hotter waves than the old stages.** The menu's intruders (puddlers, swarms, strafers, lobbers) are
  softer than the old stages' crowd, and the old stages owed most of their pressure to boss fights of four
  to nine minutes, often two at once. Here a boss fight takes about a minute and a half, so the waves of
  T3–T5 carry far more `hpGrowth` and `rate` than the stage each tier is measured against (the old
  trattoria had 0.13, the streets 0.15), and walk faster. T6 steps back on `hpGrowth` and `rate`: the
  finale's own crowd (frozen lasagna, the single pot, the cursed little can, chargers) presses hardest by
  itself.
- **Bosses.**
  - *Damage.* A boss hits by its tier's `bossDmg`, not by `dmgBase`: 1.45–1.75 at full ramp is what the
    old stages' bosses hit with (their base damage in `enemies.ts`, 14–24, is a fifth lower than it was).
    The 5:00 boss arrives at the start of the damage ramp, so it is the mildest of the three.
  - *Adds.* What a boss calls to its side (`summon()`, the Garlic King's courtiers) hits by `bossDmg`
    too, and so do the pieces an add splits into. They used to take the waves' `dmgBase`: a cursed can
    thrown by Il Microonde in the Ragù cost 76 % of the bar; it now costs 31 %.
  - *Two finals hit ×0.8* (`bossDmgMul`): Il Re dell'Aglio in the Amatriciana and Il Panetto Supremo in
    Cacio e Pepe. Both slots were tuned on a build in which these two fell silent whenever the chef
    kept them above him. Nothing switches them off any more (see *Nobody parks a boss*), so against
    the test bot the King attacks 17.7 times a minute where he made 13.7, and the Block 14.4 where he
    made 12.4. At ×1 the bot took about a sixth more damage from the King himself and a fifth more
    from the Block. At ×0.8 both fights measure as they did: the damage taken during the fight is 264
    (median; 263 before) in the Amatriciana and 263 (269) in Cacio e Pepe, with 0.67 (0.65) and 1.10
    (1.34) deaths in the fight (96 runs against 168 and 144 of the earlier build). The Block's 5:00
    slots in the Pesto and the Vongole keep ×1: there the damage did not move. The King's slot also
    has ×0.95 HP where it had ×0.85: from off screen he now lands next to the chef, the bot's weapons
    reach him more, and at ×0.85 the fight had become a fifth shorter (70 s on average against 86 s).
    ×0.95 gives 76 s with the damage where it was; ×1 gives 91 s, but more damage than before.
    (These figures are from the build before the hit-size cap; the two slots were not re-fitted.)
  - *HP.* A slot's HP replaces the boss's own and is then ×hpBase, ×player level and ×time
    (`Director.spawnBoss`). The slots are set for fights of about a minute and a half with the test bot
    in every tier, which is why the base HP falls from T3 to T6 while `hpBase` rises. `BOSS_HP_FACTOR`
    lowers it for the bosses that are slow to bring down anywhere: L'Influencer ×0.6 and Il Campanile ×0.5
    (they do not come to the chef the way the leaping bosses do), Lo Scatolone ×0.7, Il Microonde ×0.65 and
    Il Sacco del Grattugiato ×0.6 (they hide behind their adds and hazards), Il Panetto Supremo ×0.7,
    Il Frullatore ×0.65, Il Re dell'Aglio ×0.8, and Lo Spaghettone ×0.8 (untouchable while phased out).
  - *Nobody outruns the fight.* A boss more than 300 units behind the chef walks faster, up to 3.5× its
    pace (`BOSS_NEAR` in `ai.ts`), so it cannot be left off screen.
  - *Nobody parks a boss.* Il Re dell'Aglio and Il Panetto Supremo start no attack while they are off
    screen (the middle of the body outside the view; the margin is the same on every side): the attack
    waits. It waits 2.5 s at most (`DENIED_MAX`, counted from the boss's last attack: time off screen,
    or with an attack overdue). Then the next attack is the one that closes the distance, from wherever
    the boss is, and both are marked at the chef: the King's leap by its landing circle, the Block's
    slide by its lane, which runs all the way to the chef and whose circles stay until the dish has
    passed them. From off screen both aim at where the chef is heading (the leap one second ahead, the
    slide at the spot the dish and the chef reach together), so running on in a straight line is no
    way out; a chef who turns away is missed. The other bosses have no such rule: they attack from
    wherever they are.
  - *Nothing unreadable under the HUD.* While one of these two is on screen but the top of its body is
    inside the band the HUD covers (the top 90 units of the view: timer and recipe strip) or above it,
    its pose cannot be read. There it starts only the attacks that are marked on the ground at the
    chef: the King's stink and leap, the Block's melt and slide. The clove fan, the summon and the pat
    rings, which only the pose announces, are passed over. Nothing waits, so the boss attacks as often
    as anywhere else.
  - *Slows.* The chef's slowing weapons (Pesto Genovese 45 %, Olive d'Oro 25 %, the Forno 12–18 %)
    stretch a boss's walk and the pause between two attacks, never an attack: a boss ignores slows
    while an attack runs (and while it is airborne or phased out). Its warning circles, lanes and cones
    run on game time, so a slowed attack would come after its mark had gone. The time the slow would
    have cost the attack is added to the pause after it (`Enemy.slowDebt`), so a slowed boss attacks
    exactly as rarely as if its attacks were slowed too: a slowing build is worth what it always was.
  - *The quake.* Il Pizzone Abissale's quake lays four beats of five danger circles; a circle does 0.6×
    its damage (the slam does 1×).
- **Shots and lobs.** An enemy's own shot does a share of its touch (`SHOT_DMG` in `enemies.ts`): 0.5
  for a ranged shot and for the direct hit of a lob (the cheese sprinkler, the broccoli), 0.7 for a
  burst. A lob's direct hit used to do the full touch; with the cloud it leaves, the cheese sprinkler
  alone dealt half of all damage in the Vongole.
- **Hazards.** An enemy hazard that hurts (a cheese cloud, a broccoli patch, a boss's stink cloud, fire
  or ketchup trail) ticks every 0.6 s while the chef stands in it. A tick is stopped by his
  invulnerability frames but gives none, so a cloud never shields him from the next hit; overlapping
  hazards tick as one, the strongest.
- **Per-dish factors** (`StageSpec`): `rateMul` (more or fewer spawns, phased in like `rate`) for a dish
  whose intruders are softer or tougher than its tier-mates', `speedMul` (a factor on the tier's
  `speed`), `bossHpMul` (single boss slots: the same boss is quicker or slower to bring down in another
  crowd) and `bossDmgMul` (single boss slots: a factor on the tier's `bossDmg`). `dmgMul` (a factor on
  the tier's `dmgBase`) still exists and no dish uses it: the Amatriciana had 1.45 and the Vongole 1.1.

| Dish | rateMul | speedMul | bossHpMul (5:00 / 10:00 / 15:00) | bossDmgMul (5:00 / 10:00 / 15:00) |
|---|---|---|---|---|
| Alfredo | — | — | 1.25 / 1.1 / 1.2 | — |
| Amatriciana | 1.7 | 1.1 | 1.25 / 0.9 / 0.95 | 1 / 1 / 0.8 |
| Cacio e Pepe | 1.2 | — | 1 / 1 / 0.85 | 1 / 1 / 0.8 |
| Margherita | 0.75 | — | 0.65 / 1 / 0.9 | — |
| Marinara | 1.55 | — | — | — |
| Ragù | 1.15 | — | 0.5 / 0.45 / 0.7 | — |
| Pesto | 1.35 | 1.2 | 1 / 0.9 / 0.8 | — |
| Vongole | 1.5 | — | 0.75 / 1 / 1 | — |

  The Pesto's cashews are worth 2 XP (they were 1: half of that dish's crowd, they starved the chef of
  levels and made it harder than the Vongole it unlocks).

- **Measured** with the test bot (`simulate()` in `main.ts`; the chef Enzo; a mid-progress pantry of
  Olio 2, San Marzano 2, Grembiule 1 and Minestrone 1; 24 runs per dish and setting). The bot kites crowds
  well but does not dodge telegraphed circles or step out of clouds, so it overstates that kind of damage.
  The simulation has no seeds and the deaths of a dish spread from 0 to 30 a run: **read a dish's figure
  as ±3**, the standard errors below notwithstanding.

| Dish | Tier | Deaths in minutes 5–15, auto-revive (± standard error) | First death, median | 5:00 boss killed, no revive | Boss fights, mean s (5:00 / 10:00 / 15:00) | Level at 15:00 |
|---|---|---|---|---|---|---|
| Pomodoro | T1 | 0.1 ±0.1 | none by 15:00 | 24/24 | 54 / 67 / 81 | 36 |
| Carbonara | T2 | 0.3 ±0.1 | none by 15:00 | 22/24 | 66 / 89 / 79 | 35 |
| Alfredo | T3 | 9.8 ±1.5 | 6:38 | 16/24 | 132 / 110 / 104 | 39 |
| Amatriciana | T3 | 4.0 ±0.6 | 7:40 | 17/24 | 81 / 133 / 85 | 41 |
| Margherita | T3 | 5.4 ±0.9 | 7:30 | 20/24 | 77 / 80 / 83 | 38 |
| Cacio e Pepe | T4 | 9.7 ±1.7 | 6:21 | 13/24 | 99 / 86 / 66 | 33 |
| Marinara | T4 | 6.4 ±0.7 | 5:48 | 10/24 | 86 / 138 / 95 | 38 |
| Ragù | T5 | 9.7 ±1.3 | 6:21 | 10/24 | 95 / 102 / 92 | 41 |
| Pesto | T5 | 9.7 ±1.5 | 6:30 | 5/24 | 110 / 119 / 107 (not killed in 1 of 24 runs) | 36 |
| Vongole | T5 | 11.4 ±1.8 | 6:11 | 5/24 | 89 / 93 / 81 | 35 |
| the finale | T6 | 24.2 ±2.6 | 5:08 | 1/24 | 88 / 116 / 107 | 38 |
| *old kitchen* | | 1.7 ±0.5 | none by 15:00 | 10/12 | 156 / 93 / 87 | |
| *old trattoria* | | 8.1 ±1.1 | 7:16 | 0/12 | 253 / 184 / 223 | |
| *old streets* | | 17.8 ±1.2 | 5:48 | 0/12 | 566 / 280 / 341 (the last one killed in 12 of 24 runs) | |
| *old food court* | | 29.7 ±2.1 | 4:24 | 0/12 | 892 / 522 / 478 (the last one killed in 3 of 24 runs) | |

  - *By tier,* deaths in minutes 5–15: T1 0.1, T2 0.3, T3 6.4, T4 8.0, T5 10.3, T6 24.2. The climb is
    there, but T4 and T5 are lower than before the cap (T3–T6 were 6.2, 12.5, 15.9, 22.8): T3 and T6
    come out a fifth under the old trattoria and the old food court, T5 two fifths under the old
    streets, and T4 level with the trattoria instead of between it and the streets.
    That is what capping the hits cost: the bot takes Nonna's apron in nearly every run, and a 20-point
    touch against five points of armor is worth far less than a 40-point one.
  - *T4 and T5 are one band on this count.* From the Alfredo to the Vongole the harder dishes all sit
    at 10 to 11 deaths, within the ±3 of each other (the Amatriciana, the Margherita and the Marinara
    are softer, at 4 to 6). No wave knob moves a T5 dish out of that band while the hits are capped:
    the deaths stayed within the ±3 for a speed factor of 1.2 or 1.4, `hpGrowth` ×1.25, a `rateMul` up
    to 1.5, and a cap of live enemies ×1.2 or ×1.4 (Ragù 9.7 / 10.1 / 9.9, Pesto 11.9 / 12.2 / 14.0,
    Vongole 11.6 / 11.4 / 12.4, 24 runs each). From 6:00 on the crowd of T4 and T5 already sits at
    85–95 % of its cap, which is why a higher spawn rate adds nothing. T5 shows as the later tier in
    the first boss (below) and in the HP of its crimes; telling the two tiers apart by deaths needs a
    new pattern in the T5 crowds, not a number in the table.
  - *The unlock order.* No dish is softer than a dish that unlocks it by more than the ±3: Cacio e Pepe
    is level with the Alfredo and above the Amatriciana, the Marinara level with the Margherita, the
    Ragù level with Cacio e Pepe and above the Marinara, the Pesto level with the Ragù, the Vongole
    above the Marinara and the Pesto, the finale above all.
  - *The first boss.* With no revive the 5:00 boss dies before the chef in 74 % of the T3 runs, 48 % of
    T4, 28 % of T5 and 4 % of T6 (the aim was about 60 / 40 / 20 for T3–T5). These swing: single
    dishes moved by up to 6 runs of 24 between two rounds on near-identical builds (the finale 5 and
    1, the Pesto 11 and 5), and the tier figures by 5 to 17 points. The Vongole's Butter Block has ×0.75
    HP now (5 of 24, a fight of 89 s; at ×0.9 it was 2 of 24 and 121 s). The first death (median of 48
    runs per dish, with or without auto-revive) comes at 7:14 in T3, 6:06 in T4, 6:17 in T5 and 5:08
    in T6.
  - *Boss fights* last 66–138 s on average from T3 up. About one in eight goes over 150 s and one in
    seventeen over 200 s, mostly in runs the bot is losing badly. The spread is wide: a strong build
    ends a fight in 16–25 s now and then (the shortest of 648 was 20 s; an independent round saw 16 s
    for the finale's Influencer), and a weak one leaves a boss standing (the Pesto's Frullatore in 1 of
    24 runs here, the finale's Influencer in 2 of 24 in the round before).
  - *Damage shares* (minutes 5–15, a lobber's direct hit and its cloud counted together): no enemy
    deals half of a dish's damage except the Amatriciana's onion (57 %; it is a third of that dish's
    spawns and its hardest walker, and its touch is now 19 % of the bar where it was 35 %). The cheese
    sprinkler is at 23 % in the Vongole (it was 49 %), the shrimp at 37 % in the Marinara.
  - *Openings.* With no pantry, 1 run of 264 (both bots, every dish) ended before 2:30 (Cacio e Pepe,
    the weaker bot, at 1:46) and 14 before 3:20; over 480 more such runs of the Alfredo, Cacio e Pepe,
    the Ragù and the finale on the build before this one, 4 ended before 2:30, about 1 %. The hit-size
    rule left the first three minutes of T1–T3 as they were (their `hpGrowth` and `rate` are unchanged
    and the speed factor starts at 3:00). In T4 and T5 the crimes are 5–11 % tougher in those minutes
    than before it, because `hpGrowth` went from 0.42 to 0.5 and from 0.5 to 0.55 and counts from 0:00.
    That does not show in the early deaths: an A/B of 96 no-pantry runs each of the Pomodoro and Cacio e
    Pepe gave 3 deaths before 2:30 on the build before the rule and 2 after.
  - *The old stages* were measured with the same bot and the hazard rule above on the build before the
    menu (24 runs each for the deaths, 12 for the first boss).

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
  walking), so he has to turn back for it; not behind a shelf or a tree and not under an awning, as long as
  an open spot turns up. A toast with the ingredient's badge says "<ingredient> is on the map! Follow the
  green arrow.", or "…Grab the golden badge." when the badge appears in view (no arrow is drawn then).
- **Look.** A golden glow, a pulsing ground ring, a gold-rimmed badge and a bobbing sprite. The badge is
  drawn above every prop. Off screen, or in view but under the HUD's top band, it gets the biggest arrow on
  screen, in green. Edge arrows stop below the HUD (XP bar, timer, recipe strip, slots, boss bar), above
  the toasts where they sit at the bottom (short screens), and under toasts that lie right below the boss
  bar. An arrow that this pushes down onto the chef steps to his side.
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
  if the run is then lost; the *Ricetta Perfetta* medal also needs the win). The ingredient and recipe
  banners lie just under the chef: after their pop they turn translucent (the fight shows through), and on
  a landscape phone, where the toasts sit at the bottom edge below them, the toasts wait until they are gone.
- **Intruders.** The first time each intruder of the dish is on screen, a toast shows its icon and names
  the crime with a one-line reason ("Panna nella Carbonara? NO! …"); the full reason is in Il Ricettario.
  Every toast says in English what the intruder is, in the reason or as a gloss ("Piselli (peas) nella
  Carbonara? NO!"). **Extras** (below) get one toast of their own, worded as a crime of method with no dish
  in it ("Spezzare gli spaghetti? NO! Never snap long pasta: it softens into the pot."); it is shown only
  when no intruder's toast is waiting, and not before the first intruder has been named (or 0:30). The
  recipe page in Il Ricettario lists them under "Crimini di metodo" (or "Altri crimini" where the lot is
  mixed), each with a link to its crime card once met. **Friend or
  foe:** butter, garlic, pancetta, Parmigiano, mozzarella and onion belong in some dishes and are crimes in others; a one-off toast says so when you
  collect one where it belongs or meet it where it does not ("Garlic! In pesto it belongs. Not here!").
  At most 6 toasts wait in the queue; one is shown every 5 s.
- **Waves.** In every minute at least 80 % of the spawn weight comes from the dish's intruders; the rest
  (≤ 20 %) are the dish's *extras*, method crimes that fit it (snapped spaghetti in the Pomodoro, the
  one-pot carbonara in the Carbonara…). Over the run, the intruders' shares follow their order in the
  recipe (the loudest crime comes most often), and every intruder spawns. Garlic, a support enemy, is
  exempt from the order, but it has to spawn too. **The finale's** waves are mixed by hand from the whole
  menu and exempt from the 80 % and order rules, but every intruder and extra its recipe lists must spawn
  in some minute or event. `stageRuleProblems()` checks all of this and `scripts/validate.mjs` prints any
  problem.

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
| **Funghi Abusivi** (new) | Bootleg Mushrooms | burster (spore shots; hovers over props) | Mushrooms in carbonara | Carbonara |
| **Prosciutto Impostore** (new) | Impostor Ham | chase | Cooked ham instead of guanciale | Carbonara |
| **Broccolo Americano** (new) | American Broccoli | lobber (florets that leave slowing mashed broccoli) | Broccoli in Fettuccine Alfredo | Alfredo |
| **Gambero Saltatore** (new) | Hopping Shrimp | leaper | Shrimp in Alfredo (and seafood on the Marinara) | Alfredo, Marinara |
| **Anacardo Abusivo** (new) | Bootleg Cashew | swarm | Cashews in pesto | Pesto |
| **Olio Sbagliato** (new) | Wrong Oil | puddler (seed-oil slick) | The wrong oil | Cacio e Pepe, Pesto |
| **La Filante Abusiva** (new) | Rogue Cheese Pull | slither | Cheese on a Marinara | Marinara |
| **Cheddar Arancione** (new) | Orange Cheddar | strafe | Cheddar on pizza | Margherita, Marinara |
| **Salsa Barbecue** (new) | BBQ Sauce | ranged | BBQ sauce on pizza | Margherita |

The finale mixes crimes from the whole menu, and every enemy above appears in one of its minutes or events.
Its waves are exempt from the 80 % and order rules; `stageRuleProblems()` checks that every intruder and
extra its recipe lists spawns.

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
- **Il Re dell'Aglio** — a crowned garlic bulb: fans of garlic cloves, stink clouds that slow (a green pool
  with a rim of crawling dashes exactly where they act), a royal belly slam, garlic courtiers; enraged, he
  sheds his papery skin and speeds up. *"Solo uno spicchio… in camicia!"*
- **Il Panetto Supremo** — a giant butter block: butter pats that land as slippery puddles, telegraphed
  slides that leave a buttery trail, rings of pats; enraged, it melts (smaller and faster).
  *"Un pochino di burro, per la cremosità!"*
- **Lo Spaghettone alla Bolognese** — a ghostly mountain of spaghetti that "doesn't exist": spaghetti lashes
  down warning lanes, phases out (invulnerable) and back, rolls meatballs, lobs sauce puddles. *"Io esisto! I EXIST!"*
- **Il Frullatore Rovente** — a blender of green sludge: sweeping sludge sprays, a vortex that pulls the chef
  in, blade rings, bootleg cashews; enraged, it overheats and leaves fire. *"Pesto in trenta secondi! Con anacardi e panna!"*
- **Il Sacco del Grattugiato** — a torn bag of pre-grated "parmesan": cheese snow cones, slowing cheese
  clouds, a belly-flop, cheesy clams. *"Formaggio sulle vongole? Abbondante!"*

A boss that visits another dish as a mid-boss says a line about that dish, not about its home dish
(`BOSS_LINES` in `src/game/recipes.ts`): the Cream Colossus shouts *"Alfredo needs CREAM!"* in the Alfredo
and *"Clams need CREAM!"* in the Vongole, the Bag of Pre-Grated Cheese *"Formaggio sulla Marinara?
Abbondante!"* on the Marinara, and the One-Pan Influencer sells a one-pan amatriciana with onion, cacio e
pepe with cream and pesto with cream. The bubble and the spoken line use the same text.

A boss shouts its line in a speech bubble as it arrives at the edge of the screen. The bubble is kept in
view, below the HUD's top band, and takes the nearest place clear of the toasts and the boss banner: over,
under or beside them, and not on the chef. Its tail shows only while the boss stands under it.

## Medals (Medaglie)
Checked at the end of every run (`src/game/medals.ts`).

| Medal | How |
|---|---|
| Primo Servizio | Finish your first service. |
| Al Dente | Survive 5 minutes. |
| Cottura Perfetta | Survive 10 minutes. |
| Chef Stellato | Win any dish on the menu. |
| Mille Crimini | Stop 1,000 crimes in a single run. |
| Evoluzione! | Evolve a weapon. |
| Cucina Completa | Carry 6 weapons at once. |
| Niente Ananas | Defeat 500 pineapples (in total). |
| Il Boss sono Io | Defeat 10 bosses (in total). |
| Senza Panna | Win a dish taking less than 150 damage. |
| La Nonna Approva | Win a dish as Nonna Pina. |
| Gatto Chef | Win a dish as Micio. |
| Tutti a Tavola | Unlock every chef. |
| Giro d'Italia | Win every dish on the menu (was: all four stages). |
| **Ricetta Perfetta** (new) | Collect every real ingredient and win the dish. |
| **Primi Romani** (new) | Win Carbonara, Alfredo, Amatriciana and Cacio e Pepe. |
| **Pizzaiolo DOC** (new) | Win the Margherita and the Marinara. |
| **Il Quaderno della Nonna** (new) | Complete 5 different recipes (★ on 5 dishes, won or not). |

The medals that the save alone earns (`saved` in `medals.ts`: the two "in total" ones, Tutti a Tavola, Giro
d'Italia, Primi Romani, Pizzaiolo DOC, Il Quaderno della Nonna) are also checked when a save loads, without
a message. The others need a run and are only checked at its end.

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
- **Armi** (weapons and their evolutions), **Rinforzi** (the passives; "ingredients" now means a dish's real ingredients) and **Record** (each
  dish's records).
- In the four lists an entry opens on a click, a tap, or keyboard / gamepad focus. The pointer passing over
  an entry only highlights it (it may be on its way to the open entry's links and chips); the open entry
  keeps its gold ring. The Record tab scrolls with Up / Down before the focus moves on to the Back button.
- Hover focus follows real pointer movement only (`Nav` in `src/ui/dom.ts`): a card that a key press, the
  wheel or a new screen slides under a resting pointer does not take the focus from the keyboard / gamepad,
  and does not show the hover look either (`body.keys-nav` in `main.css`), so one element looks focused.
