/**
 * IL MENÙ — BOSSES A (art agent: fill this file; it is imported before placeholders.ts,
 * so every id defined here replaces its placeholder automatically).
 *
 * Follow docs/ART_GUIDE.md (quality bar: bosses_a.ts / bosses_b_*.ts; see registerBoss() there):
 *   boss.<id>          frames: 4, flash: true — idle/walk loop with secondary motion
 *   boss.<id>.attack   frames: 2, flash: true — 0 = wind-up/telegraph, 1 = attack. SAME box/anchor.
 * Anchor = centre of the collision circle; base at y ≈ +radius; face front-right; outline 3–4.
 *
 *   id            box w×h   anchor (ax,ay)  radius  look
 *   boss.aglio    190×220   (95,158)        56      Il Re dell'Aglio: huge garlic bulb in a crown and a royal cape of
 *                                                   garlic skin. Enraged it sheds its skin (the code shows a burst; the
 *                                                   sprite stays the same).
 *   boss.burro    210×180   (105,122)       54      Il Panetto Supremo: giant butter block on a ceramic butter dish,
 *                                                   butter-knife sword. Enraged it melts: the code draws it at 0.9 scale.
 *
 *   proj.e_clove      24×24  (12,12)  1 frame: a garlic clove (aimed fans, rings). DANGER style (projectiles.ts).
 *   proj.e_butterpat  24×24  (12,12)  1 frame: a butter pat (rings, lobbed pats). DANGER style.
 */
export {};
