/**
 * IL MENÙ — ENEMIES B (art agent: fill this file; it is imported before placeholders.ts,
 * so every id defined here replaces its placeholder automatically).
 *
 * Follow docs/ART_GUIDE.md (quality bar: enemies_a.ts / enemies_b_*.ts). Register with
 * defineSprite({ id, w, h, ax, ay, frames: 4, flash: true, draw }) for the enemies.
 * Anchor = centre of the collision circle; feet/base at y ≈ +radius; face right; no ground
 * shadow; 4-frame walk/idle cycle (frame 0 neutral); one dominant colour, readable at 1×.
 *
 *   id                  box w×h   anchor (ax,ay)  radius  behaviour   look
 *   enemy.anacardo      30×26     (15,15)         8       swarm       small beige kidney-shaped cashew, angry, comes in clumps
 *   enemy.olio          40×54     (20,38)         13      puddler     squat plastic bottle of pale seed oil (sunflower on the
 *                                                                     label, no brand)
 *   enemy.filante       52×42     (26,26)         14      slither     stretchy melted-cheese blob with mozzarella strings
 *                                                                     reaching out (NOT the neat white XP ball)
 *   enemy.cheddar       44×46     (22,30)         13      strafe      bright-orange square processed slice, corners curling,
 *                                                                     wobbly
 *   enemy.bbq           44×56     (22,40)         14      ranged      dark-brown squeeze bottle with a cowboy hat, smoky drips.
 *                                                                     Shots leave from the nozzle at (+4,-30) from the anchor
 *                                                                     (facing right): put the nozzle tip there.
 *
 *   fx.seedoil_puddle   66×48     (33,24)  1 frame, res 2: glossy pale-yellow seed-oil slick seen from above (enemy
 *                                          hazard 'oil'; drawn scaled to the hazard radius). Must differ from the
 *                                          chef's golden fx.oil_slick (paler, colder, "cheap").
 *   proj.e_bbq          24×24     (12,12)  1 frame: enemy shot (blob of BBQ sauce). DANGER style (projectiles.ts).
 *
 * Shared helpers (exported, import them instead of copying; do NOT edit those files):
 *   import { danger, sauceBlob } from './projectiles';   // danger(id, size, paint): 24×24 box at size 12
 *   import { fx, puddle, puddlePts } from './fx';         // puddle(ctx, rx, ry, seed, { base, rim, glossA, satellites })
 *   import { enemySprite, cyc } from './enemies_b_kit';   // enemySprite('olio', w, h, ay, draw, ax?) = enemy.olio, 4 frames + flash
 *   painter: '../painter'; generic shapes/gradients: './items_kit' (S, radial, softGlow, sparkle, ...)
 */
export {};
