/**
 * IL MENÙ — ENEMIES A (art agent: fill this file; it is imported before placeholders.ts,
 * so every id defined here replaces its placeholder automatically).
 *
 * Follow docs/ART_GUIDE.md (quality bar: enemies_a.ts / enemies_b_*.ts). Register with
 * defineSprite({ id, w, h, ax, ay, frames: 4, flash: true, draw }) for the enemies.
 * Anchor = centre of the collision circle; feet/base at y ≈ +radius; face right; no ground
 * shadow; 4-frame walk/idle cycle (frame 0 neutral); one dominant colour, readable at 1×.
 *
 *   id                  box w×h   anchor (ax,ay)  radius  behaviour   look
 *   enemy.burro         46×52     (23,36)         14      puddler     pale-yellow butter block on a foil wrapper, sly grin,
 *                                                                     melting drips, little butter knife
 *   enemy.funghi        46×50     (23,34)         13      burster     cluster of 3 button mushrooms in a tiny mafia hat,
 *                                                                     spore puffs (it hovers a little: the renderer lifts it)
 *   enemy.prosciutto    48×50     (24,34)         14      chase       pink cooked-ham slice folded like a cape, fake
 *                                                                     "guanciale" label (no readable brand)
 *   enemy.broccoli      50×58     (25,40)         15      lobber      dark-green floret tree with a baseball cap,
 *                                                                     cream-sauce drip (throws florets)
 *   enemy.gamberi       44×40     (22,26)         12      leaper      coral-pink curled shrimp with goggles, tail flips
 *
 *   fx.butter_puddle    76×56     (38,28)  1 frame, res 2: yellow butter slick seen from above (enemy hazard
 *                                          'butter'; drawn scaled to the hazard radius, ~0.92 alpha). Match
 *                                          fx.cream_puddle in fx.ts.
 *   proj.e_spore        24×24     (12,12)  1 frame: enemy shot (spore puff). Enemy shots read as DANGER: round,
 *                                          hot rim, red glow (see danger() in projectiles.ts).
 *   proj.e_floret       24×24     (12,12)  1 frame: a lobbed broccoli floret dripping cream (the broccoli's shot;
 *                                          it lands as a cream puddle). DANGER style.
 *
 * Shared helpers (exported, import them instead of copying; do NOT edit those files):
 *   import { danger, sauceBlob } from './projectiles';   // danger(id, size, paint): 24×24 box at size 12
 *   import { fx, puddle, puddlePts } from './fx';         // puddle(ctx, rx, ry, seed, { base, rim, glossA, satellites })
 *   import { enemySprite, cyc } from './enemies_b_kit';   // enemySprite('burro', w, h, ay, draw, ax?) = enemy.burro, 4 frames + flash
 *   painter: '../painter'; generic shapes/gradients: './items_kit' (S, radial, softGlow, sparkle, ...)
 */
export {};
