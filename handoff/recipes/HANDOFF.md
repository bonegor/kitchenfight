# Handoff: recipe levels ("Il Menù") — what is done, what is left

This folder lets a later session finish the recipe-levels feature without the original session's
scratch files. **Delete the whole `handoff/` folder before merging to `main`.**

## The request

From the project owner:

> right, now levels should be recipes - investigate proper recipes for pasta and pizza and fight against
> ingredients that do not belong in that dish according to popular italian posts about food. For example,
> cream does not belong in a carbonara or a pasta alfredo (the latter one takes butter, parmigian pasta water)

They added: "one good source might be italian influencer chefs".

Their standing rule for this project:

> feel free to use any no matter how licenced imagery or sounds. They will be replaced later entirely so do
> not worry. We need to get the idea of what the perfect game will be

The finished feature ships to `main`, the same way the earlier work did.

## Status (branch `claude/amazing-turing-2nmcn3`)

Everything below is committed and pushed. `main` is still the earlier Audio 2.0 release (`4d44a85`).

| Step | State |
|---|---|
| Research: 20 dishes, 108 intruders, Italian influencer chefs and authorities | done → `recipes_dataset.json`, `RECIPES_RESEARCH.md` |
| Design spec | done → `SPEC.md` (with `SPEC_FRAMEWORK.md` and `contract.md`) |
| Foundation: data, 11 dish stages, ingredient pickups, 10 new enemies, 5 new bosses, save v2, medals | done (`9f7f4d4`..`bdb115a`), checked independently and fixed |
| Art: 10 enemies, 5 bosses, 27 ingredient icons, 11 plated dishes | done; each piece was critiqued and revised; no placeholders left |
| UI: Il Menù, HUD recipe strip, banners, results, Ricettario "Ricette" tab | done, critiqued and revised |
| Docs: `docs/RECIPES.md`, `DESIGN.md`, README levels text | done, critiqued and revised |
| Balance revision on the merged build | done (`dfb4408`, `133d66f`, `31e2a92`) |
| Integration leftovers: fly flags, floret hazard, renderer, medal texts, chef credits, icons | done (merge `88369b9`, docs `3f96db0`) |
| Independent check of balance and integration | done. Its findings are **not yet fixed** (next section). |
| Fix pass for those findings | **interrupted**; untested work saved in `fix_wip_interrupted.patch` |
| Final review (7 lenses with adversarial verification) | **not started** (`review_wf.js`) |
| Release: README shots, `build:play`, push to `main`, republish the artifact | **not started** |

The checker confirmed that everything else works: `tsc`, `validate.mjs` (0 missing, 0 problems, 0 placeholders), `stageRuleProblems()`, `build:single`, the full title → menu → run → victory → unlock flow in the dev server and in the single-file build, five legacy-save migration cases, the finale spawning every listed intruder, and every integration fix.

## Remaining work, in order

### 1. Fix the checker's findings

The checker's full report is `integrate_result.json` → key `check`. In short:

1. **HIGH, pre-existing bug in `run.ts`.** Hazard ticks call `hurtPlayer`, which gives 0.5 s of iframes. A tick comes every 0.6 s, so standing in a cheese cloud blocks about 83 % of other hits. Fix this, then re-measure balance.
2. **HIGH, openings.** Cacio e Pepe and Alfredo die early:
   - `dmgBase` starts ramping at 0:00;
   - Cacio e Pepe has an elite Panna at 2:40;
   - Alfredo has cream puddlers in minutes 0–2.
3. **HIGH, 5:00 bosses.** With no revive and the mid pantry, the 5:00 boss is a wall at T3 and above. Margherita is the hardest dish before the finale (danger circles from the deep-dish). The curve is flat after T2.
4. **MEDIUM, long boss fights.** 10:00 and 15:00 fights in T4–T6 often last over 150 s, and L'Influencer kites. Add per-slot HP multipliers.
5. **MEDIUM:**
   - Marinara's final deep-dish is too strong.
   - The finale's minute 3 is harsh (a design call).
   - Single enemies dominate damage: onion in Amatriciana, the pot in the finale.
6. **LOW:**
   - Overstated numbers in `DESIGN.md` and the `TIERS` comment.
   - Trivial T1/T2 bosses with the pantry.
   - Margherita chef credits name two chefs who are pro-pineapple. Drop them or label them as counter-voices, and drop the untagged Trend Online credit.
   - Trivial items: a comment in `recipes_enemies_a.ts:775`, an "80% < 80%" message, the `scotta_mini` extras check, and a star icon in the results "new dish" rows.

`fix_wip_interrupted.patch` is the interrupted fix pass, against `3f96db0`. It already contains:
- the iframes fix (a `tick` flag on `hurtPlayer`);
- a later `dmgBase` ramp (`DMG_RAMP` in `stages.ts`);
- a boss damage share (`BOSS_DMG_SHARE`, `Director.bossDmgScale`);
- stage edits.

It has **not** been compiled or simulated. Apply it with `git apply`, then verify it or redo it.

After any balance change, re-run the batch measurements; the commands are under "Tools" below. Targets from the critics:
- a monotonic curve along the unlock order (pomodoro → carbonara → alfredo/amatriciana/margherita → cacioepepe/marinara → ragu → pesto/vongole → foodcourt), on **both** auto-revive deaths in minutes 5–15 and first-death time;
- auto-revive deaths in minutes 5–15 of roughly 10–14 (T3), 15–19 (T4), 20–24 (T5) and about 29 (T6, the old food court);
- no deaths before about 150–200 s with no pantry;
- with the mid pantry, the 5:00 boss killed in about 60 / 40 / 20 % of T3 / T4 / T5 runs;
- no boss fight much over 150 s with the mid pantry.

### 2. Final review

Run `review_wf.js` with these args:
- `base: '4d44a85'`
- `lenses`: `code`, `uicode`, `progression`, `playtest`, `visual`, `facts`, `balance`

Each lens has a finder, then a verifier that tries to refute every finding, and the workflow returns only confirmed findings. A workflow runs only 2 agents at a time on this 4-CPU container, so start three workflows side by side:
- `['code','uicode','progression']`
- `['playtest','visual']`
- `['facts','balance']`

Then fix the confirmed findings and re-check.

### 3. Release

1. Run `node scripts/readme-shots.mjs` on the final build. Its header has the steps: point the README gallery at `menu`, `carbonara`, `alfredo`, `margherita` and `vongole.jpg`, and delete `kitchen.jpg`, `trattoria.jpg` and `streets.jpg`.
2. Run `npm run build:play` to rebuild `play/kitchenfight.html`, then smoke-test it via `file://`.
3. Delete `handoff/`, commit, and push the dev branch.
4. Fast-forward `main` to the dev branch and push it.
5. Republish the playable artifact at https://claude.ai/artifact/EePibZGAdeyMKujpDnBjJ7:
   ```bash
   npm run build:single
   node scripts/make-artifact.mjs dist-single/index.html <scratch>/kitchen-fight.html
   ```
   Publish that file to the same URL.

## Files here

| File | What it is |
|---|---|
| `SPEC.md`, `SPEC_FRAMEWORK.md`, `contract.md` | the design contract: dishes, ingredients, intruders, bosses, UI, save, art files |
| `recipes_dataset.json` | **the source of truth for every recipe fact**. Includes intruder popularity, contested notes, sources, `verified_verbatim` quotes, `accepted_in_italy` (never mock these) and the influencer chefs. |
| `RECIPES_RESEARCH.md` | the research dossier (the raw sweep files were left out) |
| `foundation_result.json`, `par1_result.json`, `par2_result.json`, `par3_result.json`, `integrate_result.json` | full reports of every build, critic, revise and check step |
| `fix_wip_interrupted.patch` | the interrupted fix pass (see above) |
| `*_wf.js` | the workflow scripts used. `integrate_wf.js` and `review_wf.js` take `args.R` = a folder with these files; `review_wf.js` also takes `args.base` and `args.lenses`. |
| `tools/balance/` | `sim2.mjs` (batch sims with boss kill times; `GOD=1` turns on auto-revive), `bossbench.mjs`, `batch.sh`, `summ.py`, `table.py` |
| `tools/check/` | the checker's batch and analysis tools (`sim3.mjs`, `batch.sh`, `an3.py`, `table3.py`, `pu.py`) and probes (`shield.mjs` for the iframes bug, `elite.mjs`, `finale.mjs`, `flow.mjs`, `rulemut.mjs`, `probe.mjs`, `ui.mjs`) |

The reports and some tools contain the old scratch path (`/tmp/claude-0/.../scratchpad/recipes`). To use them:
1. Copy this folder to a scratch directory outside the repo.
2. Pass that copy as `args.R`, so agents write their `work/` output there and not into the repo.
3. Fix the paths at the top of the `.sh` and `.py` tools.

## Tools and conventions

- **Dev server:**
  ```bash
  npx vite --config scripts/vite.agent.config.ts --port <N> --strictPort
  ```
- **Checks:**
  - `PORT=<N> node scripts/validate.mjs`: sprite ids and `stageRuleProblems()`
  - `npx tsc --noEmit`
  - `npm run build:single`
- **Sims:** `PORT=<N> node scripts/sim.mjs <dish> enzo 900 <skill>`. The mid pantry is `POWERUPS='{"might":2,"maxhp":2,"armor":1,"recovery":1}'`; pantry ids are lower case. The sim has no seeds, so use 8 or more runs per cell. `sim.mjs` stops at 900 s, so it never sees a win; use `tools/balance/sim2.mjs` up to 1500 s for boss kills.
- **Where things live:**
  - balance knobs: `TIERS`, `BASE_RATE` / `BASE_MAX`, `BOSS_HP_FACTOR` and the waves in `src/game/stages.ts`
  - enemy stats: `src/game/enemies.ts`
  - boss fights: `src/game/bosses/*.ts`
- **Commits** end with the session's two attribution lines (`Co-Authored-By` and `Claude-Session`). Never put a model name in code or docs.
- **Text rules:**
  - Player-visible texts never name or ridicule a real person, except as cited sources and chef credits.
  - Recipe facts come only from the dataset.
  - Quotes are shown as verbatim only when marked `verified_verbatim`.
- **Research limit:** page fetching was blocked in the research environment, so quotes were verified against search-result snippets only. `docs/RECIPES.md` says so.
