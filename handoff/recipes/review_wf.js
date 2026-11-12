export const meta = {
  name: 'recipes-review',
  description: 'Final review of the recipe levels: lens finders, each followed by an adversarial verifier that tries to refute every finding',
  phases: [
    { title: 'Find', detail: 'one reviewer per lens, read-only, by running the game' },
    { title: 'Refute', detail: 'an independent skeptic tries to refute every finding of that lens' },
  ],
}

const R = args.R
const BASE = args.base // commit before the recipe work (audio-shipped main)
const REPO = '/home/user/kitchenfight'
const CTX = `Repository: ${REPO} (TypeScript + Vite survivors-like game "KITCHEN FIGHT"), HEAD of branch claude/amazing-turing-2nmcn3. The recipe-levels feature (diff ${BASE}..HEAD) turned the 4 stages into 11 Italian DISHES ("Il Menù"): enemies are the ingredients that do not belong in each dish, the dish's real ingredients are golden pickups, new enemies/bosses/art, a new menu UI, Ricettario recipes tab, save v2 migration, medals. SPEC: ${R}/SPEC.md. Research dataset (the only source of truth for recipe facts): ${R}/recipes_dataset.json (dossier ${R}/RECIPES_RESEARCH.md). Docs: docs/RECIPES.md, docs/DESIGN.md, docs/ART_GUIDE.md.
YOU ARE READ-ONLY: do not edit or commit anything in the repo. Put scratch files and screenshots in ${R}/work/review/<your lens>/. Start your own dev server: \`npx vite --config scripts/vite.agent.config.ts --port <PORT> --strictPort\` (port below; kill it when done). Tools: scripts/validate.mjs (PORT env), scripts/sim.mjs <dish> <char> [secs] [skill] (PORT, POWERUPS env), scripts/play.mjs <outdir> <dish> <char> <secs>, scripts/shot.mjs + gallery.html, window.__kf in the page for probes (read src/main.ts for what it exposes). Playwright/Chromium preinstalled (require('playwright')). Look at every screenshot you take with the Read tool. Font 403 errors from a symlinked node_modules are a known dev-setup artefact, not a finding.`

const FIND_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'short unique id, e.g. code-3' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          area: { type: 'string', description: 'files or screen involved' },
          title: { type: 'string' },
          detail: { type: 'string', description: 'what is wrong and why it matters to the player' },
          evidence: { type: 'string', description: 'concrete repro: commands, probe, screenshot path, file:line' },
          fix: { type: 'string', description: 'suggested fix' },
        },
        required: ['id', 'severity', 'area', 'title', 'detail', 'evidence', 'fix'],
      },
    },
    coverage: { type: 'string', description: 'what you checked and what you could not check' },
  },
  required: ['findings', 'coverage'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          real: { type: 'boolean', description: 'true only if you reproduced it / confirmed it in the code yourself' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string', description: 'your evidence for or against' },
          fix: { type: 'string', description: 'best fix, if real' },
        },
        required: ['id', 'real', 'severity', 'reason'],
      },
    },
  },
  required: ['verdicts'],
}

const LENSES = {
  code: { port: 5411, prompt: `LENS: game-logic correctness. Review \`git diff ${BASE}..HEAD -- src/game src/core src/main.ts src/gfx/render.ts src/gfx/stageenv.ts src/gfx/envvariants.ts\` like a senior engineer hunting real bugs: ingredient spawn/placement (can it spawn inside walls/props/off-map, unreachable?), drift, collection, buffs stacking, recipe-complete reward, toasts queue, director events per dish, boss schedule and victory (isFinal), invulnerability/fade logic, hazards ('butter','oil','stink','cheese', enemy fire), new enemy behaviours' params, save v2 migration edge cases (missing fields, already v2, corrupt), unlock rules (anyOf/wins), refreshUnlocks, medals and character unlocks, legacy ids, NaN/undefined paths, per-frame allocations or O(n^2) hot paths added. Confirm each suspicion by running a probe in the browser or a node script — no speculative findings.` },
  uicode: { port: 5421, prompt: `LENS: UI code and flows. Review \`git diff ${BASE}..HEAD -- src/ui src/styles src/main.ts\` and exercise every touched screen in the browser: Il Menù (cards, locks, ★, course headers), run-start banner, HUD recipe strip, ingredient / recipe-complete banners, toasts, pause, results (dish art, n/m, unlocks), Ricettario (Ricette tab, chef links open in a new tab with rel=noopener, crimes 'Non appartiene a:' chips, two-way links, records), story, settings. Hunt: listeners not removed (leaks on repeated open/close — open/close each screen 20x and check listener/DOM counts), focus traps, keyboard/gamepad nav dead ends (arrows/Enter/Esc only), state bugs (menu shows wrong lock/record after a win; HUD strip wrong after quitting and starting another dish), text overflow at 1280x720, 390x844, 844x390, 568x320, 2560x1440, console errors.` },
  progression: { port: 5431, prompt: `LENS: progression, saves, build. Test with real saves in the browser (localStorage 'kitchenfight.save.v1'): fresh save; legacy v1 saves (various unlockedStages/records/lastStage combos incl. foodcourt unlocked, missing fields, garbage JSON); already-v2; play-through of the unlock chain by simulating wins (finishRun or the real victory path); character unlocks (sofia/concetta/micio), medals (giro, perfetta, romani, pizzaiolo, quaderno, and the old ones still reachable), shop/coins unaffected, records incl. perfect ★, 'seen' entries for new enemies/ingredients. Then \`npm run build:single\` and open dist-single/index.html via file:// in Chromium: title -> menu -> a run of margherita 60 s -> no errors, sprites drawn, audio starts after a click. Check bundle size vs ${BASE} (git stash nothing; build the base in a temporary worktree under ${R}/work/review/progression/base if needed) and sprite-cache build time at load (performance.now around the art registration or the existing timing logs), FPS in a late foodcourt run (minute 12+, many enemies) with the new sprites.` },
  playtest: { port: 5441, prompt: `LENS: real-time playtest as a demanding player. Play (with a Playwright bot that moves sensibly, or by scripted input) real runs of at least: pomodoro (first experience: is it welcoming, is the dish concept clear in the first 60 s?), carbonara, amatriciana, margherita, ragu, vongole, foodcourt — 3+ minutes each, plus jump-ahead probes (window.__kf to set time) to see each dish's 5:00/10:00/15:00 boss fights for 40 s and the victory -> results -> menu flow. Judge: is the theme clear (which ingredients are intruders, which are the real recipe), are ingredient pickups findable (arrow) and reachable, are toasts/banners readable and not spammy, are new enemies' attacks readable/fair (shrimp leaps, bbq shots, oil/butter slicks, cheese clouds, spores, florets), are boss attacks telegraphed, any soft-lock, any moment where the screen is unreadable. Screenshots for every finding.` },
  visual: { port: 5451, prompt: `LENS: visual quality and consistency (art director). Screenshot every dish in a real run at 1280x720 at minute ~3 and ~8 (window.__kf to jump), every new enemy/boss/ingredient/dish sprite in the gallery (zoom 1 and 3, on the four floor types), the menu, Ricettario recipe pages, results with dish art. Compare the NEW art (recipes_*.ts) with the existing art (enemies_a.ts, bosses_b_*.ts, hero.ts) for style consistency (outline weight, cel shading, faces, palette, scale relative to the chef), readability at 1x in crowds, colour clashes with each dish's floor/variant lighting (night/evening variants!), anything that looks unfinished, clipped, misaligned (anchors), mirrored text, wrong facing, z-order problems, and HUD overlap. Also check the env variants (decor and lighting per dish) look intentional and distinct.` },
  facts: { port: 5461, prompt: `LENS: recipe facts, texts and language. Every player-visible text added by this feature — src/game/recipes.ts (names, blurbs, methods, ingredient notes, intruder why/line/contested, sources, quotes, fun facts, FRIEND_OR_FOE), enemies.ts info for new and reused intruders, sightings toasts (src/game/sightings.ts), banners in main.ts, ui strings, medals, story, docs/RECIPES.md, README — must match ${R}/recipes_dataset.json: no invented facts, no quote presented as verbatim unless verified_verbatim, contested items presented as contested, accepted-in-Italy items (dataset accepted_in_italy) never mocked as crimes in the dish where they are accepted, chef/source attributions correct (right person, right URL), no real person ridiculed. Italian: grammar, spelling, accents (perché, è, più), capitalisation of dish names, gender/number agreement; English: clear and correct. Every source URL well-formed. Is anything factually wrong about Italian cooking even if the dataset says so (flag with reasoning)?` },
  balance: { port: 5471, prompt: `LENS: balance and difficulty curve. For all 11 dishes run node scripts/sim.mjs <dish> enzo 900 1 and 0.6 (3 seeds each where the sim allows; otherwise repeated runs) and with POWERUPS='{"might":2,"maxhp":2,"armor":1,"recovery":1}' (2 runs each), plus 2 other chefs on 3 dishes. Report survival mean/range, level, kills, ingredients collected, boss kill times at 5:00/10:00/15:00. Findings: menu order not monotonic in difficulty (unlock order: pomodoro -> carbonara -> alfredo/amatriciana/margherita -> cacioepepe/marinara -> ragu -> pesto/vongole -> foodcourt), walls (a boss not killable with POWERUPS in ~90 s), trivial bosses (<10 s), a dish much harder than its tier neighbours, a single enemy type dealing most of the damage, ingredient schedule making the recipe nearly impossible to complete. Old-stage baselines for reference (one run each, skill 1/0.6): kitchen 453/394 s, trattoria 506/381, streets 270/332, foodcourt 219/202.` },
}

const keys = args.lenses
const out = await pipeline(
  keys,
  (k) => agent(`${CTX}\nYour port: ${LENSES[k].port}.\n\n${LENSES[k].prompt}\n\nReturn ONLY real, reproduced problems (no praise, no style nits without player impact). Severity: high = broken/crash/soft-lock/wrong fact presented as true/unfair wall; medium = clearly hurts the experience or correctness; low = polish.`, { label: `find:${k}`, phase: 'Find', schema: FIND_SCHEMA }),
  (found, k) => {
    if (!found || !found.findings || found.findings.length === 0) return { lens: k, found, verdicts: { verdicts: [] } }
    return agent(`${CTX}\nYour port: ${LENSES[k].port + 5}.\n\nYOU ARE AN ADVERSARIAL VERIFIER. Another reviewer (lens: ${k}) reported the findings below. For EACH finding, try hard to REFUTE it: reproduce it yourself from scratch (run the probe, read the code path, take the screenshot), check whether it is actually intended per SPEC/docs, already handled elsewhere, or a test artefact. Mark real=true ONLY if you reproduced/confirmed it yourself; if you cannot reproduce it, real=false. Re-assess severity honestly. Give the best concrete fix for real ones.\n\nFINDINGS:\n${JSON.stringify(found.findings, null, 1)}`, { label: `refute:${k}`, phase: 'Refute', schema: VERDICT_SCHEMA }).then((verdicts) => ({ lens: k, found, verdicts }))
  },
)

const confirmed = []
const rejected = []
for (const r of out.filter(Boolean)) {
  const byId = {}
  for (const v of (r.verdicts && r.verdicts.verdicts) || []) byId[v.id] = v
  for (const f of (r.found && r.found.findings) || []) {
    const v = byId[f.id]
    if (v && v.real) confirmed.push({ lens: r.lens, ...f, severity: v.severity, verify: v.reason, fix: v.fix || f.fix })
    else rejected.push({ lens: r.lens, id: f.id, title: f.title, why: v ? v.reason : 'no verdict' })
  }
}
log(`${confirmed.length} confirmed, ${rejected.length} rejected`)
return { confirmed, rejected, coverage: out.filter(Boolean).map((r) => ({ lens: r.lens, coverage: r.found && r.found.coverage })) }
