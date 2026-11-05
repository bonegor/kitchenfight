/**
 * BOSSES B — Il Re Ananas, Il Campanile del Cappuccino, L'Influencer della Padella
 * Unica, Il Microonde Maledetto, Il Mostro della Fusione.
 *
 * Each boss registers:
 *   boss.<id>          4-frame idle/walk loop (+ hit flash)
 *   boss.<id>.attack   2 frames: 0 = wind-up / telegraph, 1 = attack (same box + anchor)
 * Anchor = centre of the collision circle; feet rest at y ≈ +radius; facing right.
 * The painters live in bosses_b_<id>.ts (shared helpers in bosses_b_kit.ts).
 */
import './bosses_b_ananas';
import './bosses_b_campanile';
import './bosses_b_influencer';

export {};
