export const meta = {
  name: 'recipes-foundation',
  description: 'Build the recipe-levels foundation: data, stages, new enemy/boss defs, ingredient mechanic, save migration, placeholders; then verify',
  phases: [
    { title: 'Build', detail: 'one engineer implements the data model, stages and mechanics with placeholder art' },
    { title: 'Verify', detail: 'independent check: tsc, validate, sims for every dish, browser smoke, contract audit' },
    { title: 'Fix', detail: 'the engineer fixes what the verifier found' },
  ],
}

const R = args.R
const REPO = '/home/user/kitchenfight'
const CTX = `Repository: ${REPO} (TypeScript + Vite, a survivors-like game "KITCHEN FIGHT"; branch claude/amazing-turing-2nmcn3, work directly in this checkout and COMMIT when done — other agents will branch from your commit). Read docs/DESIGN.md and docs/ART_GUIDE.md first.
THE SPEC (read it fully, it is the contract): ${R}/SPEC.md
THE RESEARCH DATASET (all recipe facts, intruder reasons, game_line texts, sources, quotes): ${R}/recipes_dataset.json (dossier: ${R}/RECIPES_RESEARCH.md)
Dev servers: start your own with \`npx vite --config scripts/vite.agent.config.ts --port <PORT> --strictPort\` (use port ${args.port}; another server on 5175 serves this same checkout and may also be used). Scripts: scripts/validate.mjs (sprite refs; PORT env), scripts/sim.mjs <stage> <char> [secs] [skill] (headless bot run; PORT env), scripts/play.mjs (screenshots), scripts/shot.mjs + gallery.html (sprite QA). Playwright/Chromium are preinstalled (require('playwright')). Put scratch files in ${R}/work/ never in the repo. Commit messages end with:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJEyVykzbAjxjGTyCahWxp
Never put a model name in commits or code.`

phase('Build')
const build = await agent(`${CTX}

YOUR JOB: build the FOUNDATION of the recipe levels so that the game is fully playable end to end with placeholder art, and so that six art agents, a UI agent, a balance agent and a docs agent can then work IN PARALLEL on disjoint files without conflicts. Implement everything in SPEC sections 1-4 and 6, the data needed by section 5, and the placeholder/file scaffolding of section 7:

1. src/game/recipes.ts — RecipeDef / RecipeIngredient / RecipeIntruder types and the RECIPES data for all 11 levels, filled from the dataset (it/en names, origin, shape, course, blurb, method, ingredients with buffs and sprite ids 'ingr.<id>', intruders with enemy id + it/en + why + game_line + popularity + contested note + best source {name,url} + chef credit when the evidence is an Italian chef, authority sources, one chef quote ONLY if verified_verbatim, a fun fact; and the friend-or-foe notes). Helpers: recipeById, dishesForIntruder(enemyId), INGREDIENTS registry (27).
2. src/game/stages.ts — replace the 4 stages with the 11 menu levels (ids per SPEC; keep id 'foodcourt' for the finale), with course, recipe id, env + variant, music, difficulty tier, bosses, 16 minutes of waves whose pools follow SPEC §3 (≥80 % intruders), events (rings/walls/stampedes/elites built from that dish's intruders; the cappuccino-after-11 gag only in the finale), unlock rules. Keep STAGE_LENGTH = 900 and the StageDef fields the rest of the code uses (num, name, subtitle, desc, accent, nightRamp...). Write the waves so they are varied and fair; a separate balance agent will tune numbers later with sims, so put tier numbers in one obvious table.
3. src/game/enemies.ts — add the 10 new enemies and 5 new bosses (stats in line with existing enemies of similar role; behaviours from the existing list only; info texts from the dataset), generalize EnemyInfo.crime/why of reused enemies that now appear in several dishes (keep them factual; the dataset is the source). Add hazard kinds 'butter' and 'oil' (ai.ts hazard + render) with fx sprites fx.butter_puddle / fx.seedoil_puddle.
4. Boss patterns: src/game/bosses/{b_aglio,b_burro,b_bolognese,b_frullatore,b_grattugiato}.ts each exporting a working pattern built with the ai.ts helpers (export what is needed from ai.ts), merged into PATTERNS via src/game/bosses/index.ts. Make them real, fun, telegraphed fights per SPEC §3 (the art agents will only add sprites); b_bolognese's phase-out must make it invulnerable and visibly translucent (renderer alpha).
5. Ingredient mechanic per SPEC §2: director 'ingredient' event, PickupKind 'ingredient', placement, glow + bob rendering, off-screen arrow, drift after 90 s, collect banner/voice/buff, recipe complete reward, run.recipe/recipeGot/recipeComplete, RunHooks.onIngredient(index, complete), stage record 'perfect'. Friend-or-foe one-off toasts. First-sighting intruder toast per run (dish-specific game_line), via hooks.onToast.
6. Env variants per SPEC §4 (wrapper StageEnv '<env>:<dish>' with ambient overrides and a few existing decor props; preview.ts must use the variant).
7. Progression per SPEC §6: SaveData v2 migration (unlockedStages/records/lastStage from legacy ids), unlock rules evaluated in main.ts finishRun (and a helper isDishUnlocked used by ui.ts), characters' unlock texts/checks, medals (update giro; add perfetta, romani, pizzaiolo, quaderno with existing icons), ui.ts minimal changes so it compiles and the existing stage picker lists the 11 dishes (the UI agent will redesign it — keep your ui.ts edits minimal and isolated).
8. Art scaffolding per SPEC §7: create the six EMPTY art files (with a header comment listing exactly which sprite ids each must define and the size/anchor contract) and import them in src/gfx/art/index.ts BEFORE a new src/gfx/art/placeholders.ts (imported last) that registers clear placeholder sprites (simple shaded shapes in the right colour + the id initials, correct w/h/anchor/frames/flash; bosses also '.attack') for every new id not yet defined. Extend scripts/validate.mjs to require every enemy/boss/ingr/dish/proj/fx id the data references. Add the new ids to gallery.html filters if it uses prefixes.
9. scripts/play.mjs and any dev scripts that hard-code the old stage ids: update to the new ids.

VERIFY before committing: npx tsc --noEmit; node scripts/validate.mjs (0 missing); node scripts/sim.mjs <dish> enzo 900 1 for EVERY one of the 11 dishes (no page errors; report survival time, level, kills per dish); a browser check that the title → chef select → stage picker → a run of 'carbonara' works and that an ingredient pickup spawns, can be collected (you may teleport the player via window.__kf in the test) and the recipe completes; a migrated legacy save (unlockedStages ['kitchen','trattoria'], records {kitchen:{wins:1,...}}) loads with the right dishes unlocked. Commit in logical commits on the current branch. Return: commits (hashes + subjects), files created/changed, the stage table you implemented (dish, env/variant, bosses, tier numbers, intruder ids), sim results per dish, anything left for other agents, and known issues.`, { label: 'foundation', phase: 'Build' })

phase('Verify')
const verify = await agent(`${CTX}

YOU ARE AN INDEPENDENT VERIFIER of the recipe-levels FOUNDATION that another engineer just committed on this branch (their report is below). Be skeptical and concrete. Check, by running things (not just reading):
1. Contract audit vs SPEC.md: every dish, ingredient list, intruder mapping, boss assignment, unlock rule, medal, character unlock; the six empty art files + placeholders.ts import order (art files BEFORE placeholders); validate.mjs requires every new sprite id; no file that a parallel art/UI/balance/docs agent will own is entangled with unrelated logic.
2. Facts: compare recipes.ts texts with ${R}/recipes_dataset.json — no invented quotes, unverified quotes not presented as verbatim, accepted-in-Italy items not mocked (e.g. no panna/mais/ham/mushroom intruders in pizza levels).
3. Run: npx tsc --noEmit; node scripts/validate.mjs; sims for at least 5 dishes incl. foodcourt (use your own dev server port ${args.port + 1}); a browser playthrough that collects every ingredient of one dish (teleport allowed) and checks the HUD/banners/toasts don't throw; friend-or-foe toast; boss fights for the 5 new bosses (spawn them directly via window.__kf / the director, survive ~40 s each, check no exceptions, b_bolognese invulnerable while phased); legacy save migration; unlock rule evaluation after a win (simulate finishRun(true)).
Report findings as a list: severity (high/medium/low), what, evidence/repro, suggested fix. Do not fix anything yourself.

ENGINEER'S REPORT:
${build}`, { label: 'verify', phase: 'Verify' })

phase('Fix')
const fix = await agent(`${CTX}

You built the recipe-levels foundation (your report below). An independent verifier then checked it (findings below). Fix every high and medium finding and every low one that is cheap; for any you disagree with, verify again and explain. Re-run tsc, validate.mjs and sims for the dishes affected; commit. Return: commits, what you fixed, what you left and why, and the FINAL contract summary the parallel agents need (file ownership list, sprite ids per art file, RunHooks/Run fields for the UI agent, the stage tier table location for the balance agent).

YOUR BUILD REPORT:
${build}

VERIFIER FINDINGS:
${verify}`, { label: 'fix', phase: 'Fix' })

return { build, verify, fix }
