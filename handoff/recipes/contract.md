### FINAL contract for the parallel agents

**File ownership**
- **Art agents:** one file each.
  - `src/gfx/art/recipes_enemies_a.ts`, `recipes_enemies_b.ts`, `recipes_bosses_a.ts`, `recipes_bosses_b.ts`, `recipes_ingredients.ts`, `recipes_dishes.ts`.
  - Import only, never edit: `projectiles.ts`, `fx.ts`, `bosses_a.ts`, `bosses_b_kit.ts`, `enemies_b_kit.ts`, `items_kit.ts`, `../painter`.
  - Never touch `placeholders.ts`: defining an id removes its placeholder automatically.
- **UI agent:** `src/ui/ui.ts`, `src/ui/preview.ts`, `src/styles/main.css`, `src/main.ts` (hooks and banners), and in `run.ts` only the toast text and queue (`queueToast`, `checkSightings`, `spawnIngredient` toast).
- **Balance agent:** `src/game/stages.ts` and enemy and boss stat numbers in `enemies.ts`. Pools may change as long as `stageRuleProblems()` passes. (The five new boss pattern files `src/game/bosses/b_*.ts` belong to the two boss art agents, who polish the fights in parallel; they do not edit `enemies.ts` or `stages.ts`.)
- **Docs agent:** `docs/RECIPES.md`, `docs/DESIGN.md`, README, the `RESEARCH.md` cross-link, and `scripts/readme-shots.mjs`, which still names its output files kitchen/trattoria/streets.
- `src/game/recipes.ts` is kept by hand from now on. The generator in `work/` stays in sync if needed.

**Sprite ids per art file** (boxes, anchors and looks are in each file's header)
- `recipes_enemies_a.ts`: `enemy.burro`, `enemy.funghi`, `enemy.prosciutto`, `enemy.broccoli`, `enemy.gamberi`, `fx.butter_puddle`, `proj.e_spore`, `proj.e_floret` (new).
- `recipes_enemies_b.ts`: `enemy.anacardo`, `enemy.olio`, `enemy.filante`, `enemy.cheddar`, `enemy.bbq` (nozzle at +4,−30), `fx.seedoil_puddle`, `proj.e_bbq`.
- `recipes_bosses_a.ts`: `boss.aglio` + `.attack`, `boss.burro` + `.attack`, `proj.e_clove`, `proj.e_butterpat`.
- `recipes_bosses_b.ts`: `boss.bolognese` + `.attack`, `boss.frullatore` + `.attack`, `boss.grattugiato` + `.attack`, `proj.e_meatball`, `proj.e_pesto`, `proj.e_cheese`.
- `recipes_ingredients.ts`: 24×24 each, `ingr.` + spaghetti, fettuccine, tonnarelli, tagliatelle, pomodoro, passata, olio, aglio, basilico, guanciale, tuorli, pecorino, parmigiano, pepe, burro, acqua, vino, peperoncino, manzo, pancetta, soffritto, pinoli, vongole, prezzemolo, impasto, mozzarella, origano.
- `recipes_dishes.ts`: 120×80 each, `dish.` + pomodoro, carbonara, alfredo, amatriciana, cacioepepe, margherita, marinara, ragu, pesto, vongole, foodcourt.

**RunHooks and Run fields for the UI agent**
- Hooks:
  - `onIngredient(index, complete)`: `main.ts` shows the "<it> ✓ n/m" + buff banner, or "RICETTA COMPLETA!".
  - `onToast(text, kind)`: sightings, friend-or-foe lines, "<ing> is on the map!".
  - Unchanged: `onBoss(e, final)`, `onBossDefeated(e, final)`, `onVictory`, `onGameOver`.
- `Run` fields:
  - `recipe: RecipeDef | null`, `recipeGot: boolean[]`, `recipeComplete`, `ingredientsGot()`, `ingredientMods`.
  - `Run.TOAST_QUEUE = 6`; one toast is shown every 5 s.
- `recipes.ts`:
  - `RECIPES`, `INGREDIENTS`, `BUFFS`, `RECIPE_COMPLETE`
  - `recipeById`, `intruderIn`, `dishesForIntruder` (for the "Non appartiene a:" chips)
  - `FRIEND_OR_FOE`, `foeLineFor`
- `stages.ts`: `COURSES`, `STAGES`, `stageById`, `isDishUnlocked`, `unlockRuleMet`, `unlockText`, `dishWon`, `dishesWon`, `refreshUnlocks`, `LEGACY_STAGE_MAP`.
- Save: `records[id].perfect` = recipe completed at least once, won or lost; the card shows "★ Ricetta completa".

**Stage tier table for the balance agent**
- Where it is: `TIERS` in `/home/user/kitchenfight/src/game/stages.ts`. Columns: `hpBase`, `hpGrowth`, `dmgBase`, `rate`, `max`, `bossHp[5:00, 10:00, 15:00]`.
- Also there: the `BASE_RATE` / `BASE_MAX` per-minute curves, `MAX_EXTRA_SHARE`, `ORDER_EXEMPT` and `intruderShares()`.
- The values are unchanged from my build report (T1 0.9/0.10/0.9 … T6 2.9/0.17/1.4).
- The rules they must keep, all enforced by `stageRuleProblems()` and therefore by `validate.mjs`:
  - at least 80 % intruder weight in every minute
  - the weight order
  - every intruder spawns

Foundation test scripts you may reuse are in `/tmp/claude-0/-home-user-kitchenfight/99284fd8-7f84-5a9c-a2f9-07af06a20ff0/scratchpad/recipes/work/fix/`. The main ones are `reweight.py`, `slowprobe.mjs`, `fof.mjs`, `fof.txt`, `banner.mjs`, `fire2.mjs`, `sims/` and `shots/`.