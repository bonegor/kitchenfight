/**
 * IL MENÙ — BOSSES B (art agent: fill this file; it is imported before placeholders.ts,
 * so every id defined here replaces its placeholder automatically).
 *
 * Follow docs/ART_GUIDE.md (quality bar: bosses_a.ts / bosses_b_*.ts; see registerBoss() there):
 *   boss.<id>          frames: 4, flash: true — idle/walk loop with secondary motion
 *   boss.<id>.attack   frames: 2, flash: true — 0 = wind-up/telegraph, 1 = attack. SAME box/anchor.
 * Anchor = centre of the collision circle; base at y ≈ +radius; face front-right; outline 3–4.
 *
 *   id                box w×h   anchor (ax,ay)  radius  look
 *   boss.bolognese    240×220   (120,150)       62      Lo Spaghettone alla Bolognese: a ghostly mountain of spaghetti in
 *                                                       red ragù that "doesn't exist". The code fades it out (alpha) when it
 *                                                       phases: paint it fully opaque.
 *   boss.frullatore   170×236   (85,172)        56      Il Frullatore Rovente: glass blender full of green sludge with
 *                                                       cashews and cream, spinning blade. Enraged it overheats (the code adds
 *                                                       embers and fire patches).
 *   boss.grattugiato  200×226   (100,160)       58      Il Sacco del Grattugiato: industrial plastic bag of grated "parmesan"
 *                                                       with a torn corner (no brand), belly-flops.
 *
 *   proj.e_meatball  24×24  (12,12)  1 frame: a meatball in red sauce (lobbed). DANGER style (projectiles.ts).
 *   proj.e_pesto     24×24  (12,12)  1 frame: a blob of green sludge (sprays, rings). DANGER style.
 *   proj.e_cheese    24×24  (12,12)  1 frame: a clump of grated cheese "snow" (cones, lobs). DANGER style.
 *
 * Shared helpers (exported, import them instead of copying; do NOT edit those files):
 *   import { registerBoss, type Pose } from './bosses_a';  // registerBoss(id, w, h, ax, ay, (ctx, f, pose) => …)
 *                                                          // defines boss.<id> (4 f) + boss.<id>.attack (2 f)
 *   import { danger, sauceBlob } from './projectiles';     // danger(id, size, paint): 24×24 box at size 12
 *   import { OUT, lit, S, G, softGlow, ... } from './bosses_b_kit';  // the boss painting kit
 *   painter: '../painter'
 */
export {};
