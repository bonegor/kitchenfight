export const meta = {
  name: 'recipes-integrate',
  description: 'Integrate the merged recipe levels: balance revision on the merged build, cross-file leftovers, then an independent check and fix',
  phases: [
    { title: 'Balance', detail: 'balance revision per the critic, on the merged build with the final boss patterns' },
    { title: 'Integrate', detail: 'in parallel, in a worktree: one engineer fixes the cross-file leftovers of the parallel agents' },
    { title: 'Merge', detail: 'merge the integration worktree into the dev branch, update balance facts in the docs' },
    { title: 'Check', detail: 'independent check of balance and integration' },
    { title: 'Fix', detail: 'fix what the check found' },
  ],
}

const R = args.R
const REPO = '/home/user/kitchenfight'
const PU = `POWERUPS='{"might":2,"maxhp":2,"armor":1,"recovery":1}'`
const CTX = `Repository: ${REPO} (TypeScript + Vite survivors-like game "KITCHEN FIGHT"; branch claude/amazing-turing-2nmcn3; work directly in this checkout, commit when done). The levels are now 11 Italian DISHES ("Il Menù") whose enemies are the ingredients that do not belong in them. SPEC: ${R}/SPEC.md. Research dataset: ${R}/recipes_dataset.json. Foundation contract: ${R}/contract.md. Nine parallel branches (art x6, UI, balance, docs) were just merged on top of the foundation (HEAD includes them all); their reports are in ${R}/par1_result.json, ${R}/par2_result.json (lists of {key,made,crit,rev}) and ${R}/par3_result.json (keys ui_made/ui_crit/ui_rev, balance_made/balance_crit, docs_made/docs_crit/docs_rev). Read docs/DESIGN.md and docs/RECIPES.md.
Dev server: \`npx vite --config scripts/vite.agent.config.ts --port <PORT> --strictPort\` (your port is given below; kill it when done; another server on 5175 serves this checkout too). Scripts: scripts/validate.mjs (PORT env; also runs stageRuleProblems), scripts/sim.mjs <dish> <char> [secs] [skill] (PORT env, POWERUPS env JSON — pantry ids are lower case, e.g. ${PU}), scripts/play.mjs <outdir> <dish> <char> <secs>, scripts/shot.mjs + gallery.html. The balance agent's batch tools (sim2.mjs with boss kill times and GOD=1 auto-revive, bossbench.mjs, batch.sh, summ.py, table.py) are in ${R}/work/balance/ and the balance critic's (an.py, shares.mjs, batch.sh) in ${R}/work/balance_critic/ — reuse them. Playwright/Chromium preinstalled. Scratch files go to ${R}/work/integrate/ — never into the repo. Commit messages end with:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJEyVykzbAjxjGTyCahWxp
No model names in code or docs.`

phase('Balance')
const [bal, integ] = await parallel([() => agent(`${CTX}
Your port: ${args.port}. You own src/game/stages.ts and the stat numbers in src/game/enemies.ts (hp/speed/damage/cooldowns/params, not info texts). Do NOT edit src/game/bosses/*.ts (final, polished by the boss agents) unless a fight is unfair and a number there is the only fix — then keep it minimal and say so.

YOU ARE THE BALANCE ENGINEER, doing the REVISION pass of the balance work. The balance maker's commit (f96d9eb) is merged. An independent critic then found serious problems (read par3_result.json → balance_made and balance_crit fully). A previous attempt at this revision was interrupted by a machine restart; its unfinished diff (against f96d9eb, made on the foundation boss patterns, never verified) is saved in ${R}/balance_wip_interrupted.patch — you may read it for ideas, but do not apply it blindly.
IMPORTANT DIFFERENCE: the merged build now has the FINAL versions of the five new boss fights (b_aglio, b_burro, b_bolognese, b_frullatore, b_grattugiato — changed a lot by the boss agents; read their reports in par2_result.json for damage measurements and the Bolognese invulnerability share ~21 %), and new enemy art boxes. Every measurement must be made on THIS build.

Fix the critic's P1–P10 (verify each first): a smooth, monotonic difficulty curve along the unlock order (pomodoro → carbonara → alfredo/amatriciana/margherita → cacioepepe/marinara → ragu → pesto/vongole → foodcourt), measured on a metric that does not saturate at the 5:00 boss (auto-revive deaths and/or damage taken per minute in minutes 5-15, as the critic suggests, PLUS time to first death for the openings); 5:00 bosses not walls in T3+ (critic's bossHp targets); b_burro mid-boss HP; margherita's 10:00 b_ketchup and ragù's 10:00 b_microonde (per-slot HP factor); parmesan cloud dominance in vongole/cacio e pepe; fair openings (phase rate in over the first minutes; pomodoro minutes 0-1 fewer ketchup shooters); the pizza course order (marinara must be at least as hard as margherita); stat changes leaking into other dishes; variety in vongole/cacio e pepe events; a readable tier table (comment or re-express).
ALSO: (a) the finale (foodcourt) lists intruders that never spawn there (bacon, garlic, chicken, Mushy Pasta, Pasta-Rinser per the docs agent) — make every intruder listed in the finale's recipe actually spawn in its waves/events, and extend stageRuleProblems so the finale is checked for "every listed intruder spawns" (it may stay exempt from the 80 % and order rules); (b) the Bolognese (ragù final) phases out ~21 % of the time — even out its kill time vs the other T5 finals (BOSS_HP_FACTOR).
Keep stageRuleProblems passing (≥80 % intruders per minute, weight order, every intruder spawns). Use enough runs per cell (the sim has no seeds; ≥8 runs per cell for the key metrics) and keep all raw results. Commit in logical commits. Return: commits; per critic item what you changed (or why not); the final tier table; a results table per dish (survival skill 1 and 0.6 mean [range], auto-revive deaths with the mid pantry, boss kill times 5:00/10:00/15:00 with the mid pantry, top damage source) plus the old-stage reference rows; remaining concerns.`, { label: 'balance', phase: 'Balance' }),
() => agent(`${CTX}
Your port: ${args.port + 2}.
YOU WORK IN YOUR OWN GIT WORKTREE (your current directory), NOT in ${REPO}. First: \`git merge --ff-only ${args.head}\` (or \`git reset --hard ${args.head}\` if the worktree is clean and not a descendant) so you start from the merged dev HEAD ${args.head}; \`ln -s ${REPO}/node_modules node_modules\` if node_modules is missing; run all commands in your worktree; commit there. Your final answer MUST start with "WORKTREE: <absolute path> BRANCH: <branch> COMMIT: <hash>". A balance engineer is working IN PARALLEL in ${REPO} on src/game/stages.ts and the stat numbers in src/game/enemies.ts — do not touch stages.ts; in enemies.ts change only what an item below strictly needs (e.g. one flag), so the later merge is trivial.

YOU ARE THE INTEGRATION ENGINEER. The parallel agents left cross-file items they were not allowed to touch. Do NOT retune balance; if you change anything that affects difficulty, re-run a few sims and say so. Verify each leftover first, then fix:
1. enemies.ts: Funghi (Bootleg Mushrooms) hovers in its art but has no flying flag — decide per how 'flying' is used (walls, puddles, hazards) and make it consistent.
2. Broccoli florets (proj.e_floret, lobber) land as fx.cream_puddle, whose art contains carbonara pancetta cubes — give the floret landing its own appropriate hazard/visual (no cream) so the broccoli does not leave cream; keep its gameplay effect.
3. render.ts: the phased b_bolognese's ground shadow should fade with it (scale by 1 - fade); the 'cheese' hazard area kind should get a readable rim for every cheese cloud (the grattugiato boss solved it only inside its own pattern — avoid double rims there); the red wind-up tint should not hide the Garlic King's green glints (only if cheap).
4. Leapers (pollo, gamberi) have no mid-air key frame — only if render.ts can cheaply show airborne (e.g. a frame + small scale/shadow change); otherwise skip and say so.
5. medals.ts texts still say "Win any stage" / "Win a stage…" — reword for dishes (Il Menù wording), and check every other player-visible "stage"/"livello" wording in the UI that should now say dish/piatto.
6. recipes.ts chef credits: pomodoro, amatriciana, margherita, marinara, ragu have none. Add credits ONLY where the dataset/dossier has an Italian chef or influencer as evidence for that dish (no inventions; same format as existing credits). If none, leave it and say so.
7. Collection/Ricettario/menu icons of the new bosses and enemies: sprite boxes changed (boss.aglio 254x238 anchor 109,168; boss.burro 284x196 anchor 111,133; enemy.filante 52x37, enemy.olio 44x54, enemy.cheddar 48x46; check bolognese/frullatore/grattugiato too) — make sure every icon is framed well (screenshots).
8. Every other "for the owners" / "still open" / "not done" / "outside my files" item in the reports in par1_result.json, par2_result.json and par3_result.json (ui_rev, docs_rev) — read them all and handle each (fix, or explain why not). The README image switch (scripts/readme-shots.mjs) is done later at release — skip it.
9. Docs: update docs/RECIPES.md and docs/DESIGN.md wherever YOUR fixes change facts they state (medal texts, chef credits, hazards). Leave the balance facts (tier table, finale waves) — they are updated after the balance revision.
VERIFY: npx tsc --noEmit; PORT=${args.port + 2} node scripts/validate.mjs (0 missing, 0 problems, 0 placeholders); npm run build:single succeeds; a browser smoke of title -> Il Menù -> carbonara run 60 s -> quit -> results; no page errors. Commit in logical commits. Return: commits, what you did per item, anything left.`, { label: 'integrate', phase: 'Integrate', isolation: 'worktree' }),
])

phase('Merge')
const merge = await agent(`${CTX}
Your port: ${args.port + 6}.
Two engineers worked in parallel: a balance engineer committed directly in ${REPO} (branch claude/amazing-turing-2nmcn3), and an integration engineer committed in a separate worktree (first line of their report gives WORKTREE/BRANCH/COMMIT). Merge the integration branch into claude/amazing-turing-2nmcn3 in ${REPO} with \`git merge --no-ff\` (message: "Merge the Il Menù integration fixes" + the two attribution lines). Resolve any conflict by keeping both intents (balance numbers from the balance engineer; flags/fixes from the integration engineer). Then: npx tsc --noEmit; PORT=${args.port + 6} node scripts/validate.mjs (0 missing, 0 problems, 0 placeholders); npm run build:single. Fix only what the merge broke. Then update docs/RECIPES.md and docs/DESIGN.md wherever the balance revision changed facts they state (tier table, finale waves, enemy stats, boss HP) — read stages.ts/enemies.ts for the truth; commit. Return: merge commit, conflicts and how resolved, doc changes, check results.

BALANCE REPORT:
${bal}

INTEGRATION REPORT:
${integ}`, { label: 'merge', phase: 'Merge' })

phase('Check')
const check = await agent(`${CTX}
Your port: ${args.port + 4}.

YOU ARE AN INDEPENDENT CHECKER of the balance revision and the integration commits just made (reports below). Do not fix anything. By RUNNING things:
- Balance: re-run the key metrics yourself with fresh runs (≥6 per cell) for all 11 dishes: survival skill 1 and 0.6, auto-revive deaths with the mid pantry, boss kill times. Is the curve monotonic along the unlock order? Any wall (a boss alive > ~150 s with the mid pantry), any trivial boss, any unfair opening (deaths before 150 s), one enemy dominating damage? Do the claimed numbers hold?
- Integration: verify each claimed fix really works in the game (screenshots you Read, probes via window.__kf).
- Regressions: tsc, validate, build:single, a full title -> menu -> run -> results flow, the legacy-save migration, the finale spawning every listed intruder.
Report a prioritized list: severity, what, evidence/repro, suggested fix.

BALANCE REPORT:
${bal}

INTEGRATION REPORT:
${integ}

MERGE REPORT:
${merge}`, { label: 'check', phase: 'Check' })

phase('Fix')
const fix = await agent(`${CTX}
Your port: ${args.port}.

You are the balance + integration engineer for this last pass (both reports below). An independent checker reviewed the work (findings below). Fix every real high/medium finding and cheap low ones (verify first; explain rejections). Re-run what is affected (sims with enough runs for any balance change); tsc, validate, build:single; commit. Return: commits, fixes, rejections with reasons, the FINAL balance table, known issues.

BALANCE REPORT:
${bal}

INTEGRATION REPORT:
${integ}

MERGE REPORT:
${merge}

CHECKER:
${check}`, { label: 'fix', phase: 'Fix' })

return { bal, integ, merge, check, fix }
