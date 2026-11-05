/**
 * BOSSES (part B) — Il Re Ananas, Il Campanile del Cappuccino, L'Influencer della
 * Padella Unica, Il Microonde Maledetto, Il Mostro della Fusione.
 *
 *   boss.<id>          4-frame idle/walk loop with secondary motion, hit flash
 *   boss.<id>.attack   2 frames: 0 = wind-up / telegraph, 1 = attack. Same box/anchor (+ flash).
 *
 * Anchor = centre of the collision circle; the feet/base rest at y ≈ +radius.
 * All bosses face front-right (the renderer mirrors them). Outline width 3.6.
 * Boxes are asymmetric where a prop swings out in the attack frame (anchor stays on the body).
 *
 *   id          box (w×h)   anchor (ax,ay)  radius  dominant colour
 *   ananas      252×232     (98,162)        60      pineapple gold + leaf green + royal red cape
 *   campanile   188×230     (82,172)        52      caramel cup brown + milk-foam cream + bronze bell
 *   influencer  210×216     (94,158)        52      hot pink phone + lilac hoodie + white ring light
 *   microonde   204×194     (102,128)       56      radioactive avocado green + orange oven glow
 *   fusione     300×232     (144,152)       70      pizza red/gold + magenta "fusion" aura
 *
 * The painters live in bosses_b_<id>.ts; shared helpers in bosses_b_kit.ts.
 */
import './bosses_b_ananas';
import './bosses_b_campanile';
import './bosses_b_influencer';
import './bosses_b_microonde';
import './bosses_b_fusione';

export {};
