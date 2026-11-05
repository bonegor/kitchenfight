/**
 * PROJECTILES — every weapon shot + enemy projectiles.
 *
 * Orientation: POINTING RIGHT (angle 0); the engine rotates them to the travel
 * direction. Anchor = centre. Player shots get a subtle cream edge so they read
 * on every floor; enemy shots get a hot orange rim + red glow (= DANGER).
 */
import { Ctx, Pt, ellipsePath, circlePath, smoothPath, speckle, glint, line, rng, rgba, polyPath } from '../painter';
import { P, S, projectile, softGlow, sparkle, radial, linear, swoosh } from './items_kit';
import {
  rollingPin, slipper, chefKnife, olive, fork, trident, doughDisc, margherita, cutterWheel, chilli, moka, lavaRock,
  meteor, cheeseDisc, basilLeaf,
} from './items_objects';

const GOLD_GLOW = '#ffcf3a';

// --- Mattarello ------------------------------------------------------------
projectile('proj.mattarello', 52, 20, (ctx) => rollingPin(ctx, 44, { ink: 1.6 }));
projectile('proj.mattarello_nonna', 64, 26, (ctx) => rollingPin(ctx, 52, { ink: 1.7, gold: true }), {
  glow: GOLD_GLOW, glowR: 3.2, glowA: 0.75, edge: '#fff6c8',
  over: (ctx) => {
    sparkle(ctx, -14, -7, 3.2, '#ffffff', 0.95);
    sparkle(ctx, 17, 6, 2.6, '#ffffff', 0.85);
  },
});

// --- Ciabatta ---------------------------------------------------------------
projectile('proj.ciabatta', 30, 16, (ctx) => slipper(ctx, 24, { ink: 1.2 }));
projectile('proj.ciabatta_oro', 34, 20, (ctx) => slipper(ctx, 26, { ink: 1.25, gold: true }), {
  glow: GOLD_GLOW, glowR: 2.6, glowA: 0.8, edge: '#fff6c8',
  over: (ctx) => sparkle(ctx, 9, -6, 2.4, '#ffffff', 0.9),
});

// --- Coltelli ---------------------------------------------------------------
projectile('proj.coltello', 34, 14, (ctx) => chefKnife(ctx, 28, { ink: 1.15 }));
projectile('proj.coltello_mille', 42, 20, (ctx) => chefKnife(ctx, 30, { ink: 1.2, mat: 'blue' }), {
  glow: '#59c8ff', glowR: 2.6, glowA: 0.9, edge: '#e6f7ff',
  under: (ctx) => {
    // speed trail behind the knife
    ctx.save();
    const g = ctx.createLinearGradient(-20, 0, -4, 0);
    g.addColorStop(0, 'rgba(120,210,255,0)');
    g.addColorStop(1, 'rgba(160,225,255,0.65)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-20, -0.6);
    ctx.lineTo(-4, -2.4);
    ctx.lineTo(-4, 2.6);
    ctx.lineTo(-20, 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
});

// --- Olive ------------------------------------------------------------------
projectile('proj.olive', 16, 14, (ctx) => olive(ctx, 4.3, { ink: 1.05 }));
projectile('proj.olive_oro', 20, 18, (ctx) => olive(ctx, 5.1, { ink: 1.1, gold: true }), {
  glow: GOLD_GLOW, glowR: 2.2, glowA: 0.85, edge: '#fff6c8',
  under: (ctx) => {
    // oil drip trail
    ctx.save();
    const g = ctx.createLinearGradient(-10, 0, -3, 0);
    g.addColorStop(0, 'rgba(255,214,90,0)');
    g.addColorStop(1, 'rgba(255,214,90,0.7)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ellipsePath(ctx, -6, 0.4, 4.5, 1.6);
    ctx.fill();
    ctx.restore();
  },
});

// --- Forchette --------------------------------------------------------------
projectile('proj.forchetta', 32, 14, (ctx) => fork(ctx, 26, { ink: 1.05, tines: 4 }));
projectile('proj.tridente', 46, 24, (ctx) => trident(ctx, 38, { ink: 1.25 }), {
  glow: GOLD_GLOW, glowR: 2.8, glowA: 0.8, edge: '#fff6c8',
});

// --- Pizza ------------------------------------------------------------------
projectile('proj.pizza', 36, 36, (ctx) => doughDisc(ctx, 15, { ink: 1.4 }));
projectile('proj.pizza_celeste', 54, 54, (ctx) => margherita(ctx, 22, { ink: 1.6 }), {
  glow: '#fff0a0', glowR: 3, glowA: 0.85, edge: '#fffbe6',
});

// --- Rotella ----------------------------------------------------------------
projectile('proj.rotella', 32, 32, (ctx) => cutterWheel(ctx, 13, { ink: 1.3 }));
projectile('proj.rotella_oro', 38, 38, (ctx) => cutterWheel(ctx, 14, { ink: 1.35, gold: true }), {
  glow: GOLD_GLOW, glowR: 3, glowA: 0.85, edge: '#fff6c8',
  over: (ctx) => {
    sparkle(ctx, 9, -10, 3, '#ffffff', 0.95);
    sparkle(ctx, -11, 8, 2.2, '#ffffff', 0.8);
  },
});

// --- Peperoncino ------------------------------------------------------------
projectile('proj.peperoncino', 28, 14, (ctx) => chilli(ctx, 20, { ink: 1.15 }), {
  under: (ctx) => softGlow(ctx, 2, 0, 10, '#ff6a2a', 0.35, 6),
});

// --- Moka -------------------------------------------------------------------
projectile('proj.moka', 30, 30, (ctx) => moka(ctx, 24, { ink: 1.3 }));
projectile('proj.moka_turbo', 36, 34, (ctx) => moka(ctx, 26, { ink: 1.35, turbo: true }), {
  glow: '#ff5a3a', glowR: 2.2, glowA: 0.55, edge: '#fff0e0',
  under: (ctx) => {
    // exhaust puff/flame under the boiler (it's a rocket now)
    ctx.save();
    ctx.translate(0, 13);
    ctx.fillStyle = 'rgba(255,140,40,0.85)';
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.quadraticCurveTo(0, 8, 5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,170,0.95)';
    ctx.beginPath();
    ctx.moveTo(-2.6, -2);
    ctx.quadraticCurveTo(0, 4.5, 2.6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
});

// --- Vesuvio / Pompei -------------------------------------------------------
projectile('proj.vesuvio', 30, 30, (ctx) => lavaRock(ctx, 9.5, { ink: 1.25, seed: 6 }), {
  glow: '#ff6a1a', glowR: 3.2, glowA: 0.85, edge: '#ffd7a0', edgeA: 0.55,
});
projectile('proj.meteor', 44, 26, (ctx) => meteor(ctx, 34, { ink: 1.25, seed: 5 }), {
  glow: '#ff5a1a', glowR: 3, glowA: 0.8, edge: '#ffe0a8', edgeA: 0.5,
});

// --- Forma ------------------------------------------------------------------
projectile('proj.forma', 60, 60, (ctx) => cheeseDisc(ctx, 26, { ink: 1.9 }));
projectile('proj.forma_oro', 62, 62, (ctx) => cheeseDisc(ctx, 26, { ink: 1.9, gold: true }), {
  glow: GOLD_GLOW, glowR: 3, glowA: 0.85, edge: '#fff6c8',
  over: (ctx) => {
    sparkle(ctx, -14, -16, 3.6, '#ffffff', 0.95);
    sparkle(ctx, 17, 12, 2.8, '#ffffff', 0.85);
  },
});

// --- Basilico ---------------------------------------------------------------
projectile('proj.basilico', 22, 14, (ctx) => basilLeaf(ctx, 16, { ink: 1.0, stem: true }), {
  under: (ctx) => {
    // little green swirl behind (homing leaf feels alive)
    swoosh(ctx, -1, 0, 6.5, Math.PI * 0.6, Math.PI * 1.4, 1.1, '#bff5a0', 0.55);
  },
});

// ===========================================================================
// ENEMY PROJECTILES — round, hot rim, red glow = DANGER
// ===========================================================================
function danger(id: string, size: number, paint: (ctx: Ctx) => void) {
  const box = Math.ceil(size + 12);
  projectile(id, box, box, paint, {
    edge: '#ffb03a',
    edgeW: 0.9,
    edgeA: 1,
    under: (ctx) => {
      softGlow(ctx, 0, 0, size * 0.95, '#ff3a1a', 0.55);
      softGlow(ctx, 0, 0, size * 0.62, '#ff8a2a', 0.45);
    },
  });
}

/** Generic glossy sauce blob (wobbly round). */
function sauceBlob(ctx: Ctx, r: number, col: string, shadow: string, seed: number, ink = 1.15) {
  const R = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const k = 1 + (R() - 0.5) * 0.14;
    pts.push([Math.cos(a) * r * k, Math.sin(a) * r * k]);
  }
  S(ctx, (c) => smoothPath(c, pts), {
    fill: radial(ctx, -r * 0.3, -r * 0.3, r * 1.3, [[0, '#ffffff'], [0.12, col], [1, shadow]], -r * 0.35, -r * 0.4),
    ink,
    shadow,
    shadowOffset: [-r * 0.25, -r * 0.3],
    gloss: [
      { x: -r * 0.38, y: -r * 0.4, rx: r * 0.32, ry: r * 0.2, rot: -0.7, alpha: 0.95 },
      { x: r * 0.42, y: r * 0.36, rx: r * 0.12, ry: r * 0.07, rot: -0.7, alpha: 0.5 },
    ],
  });
}

danger('proj.e_ketchup', 12, (ctx) => {
  sauceBlob(ctx, 6, '#e8231f', '#a4141a', 3);
  // tiny drip tail (points back)
  S(ctx, (c) => ellipsePath(c, -6.2, 1.8, 1.6, 1.3), { fill: '#d81e1c', ink: 0.9, shadow: 'none' });
});

danger('proj.e_cream', 12, (ctx) => {
  sauceBlob(ctx, 6, '#fff3cf', '#d6b878', 7);
  // whipped swirl (reads as a dollop of cream from above)
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const a = t * Math.PI * 2.2 + 0.6;
    const d = 0.8 + t * 3.6;
    const x = Math.cos(a) * d + 0.3, y = Math.sin(a) * d + 0.4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 0.75;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(200,160,90,0.6)';
  ctx.stroke();
  ctx.restore();
  glint(ctx, -2.2, -2.6, 1.5, 0.8, -0.7, 0.95);
});

danger('proj.e_seed', 10, (ctx) => {
  // pineapple chunk: rounded wedge with fibrous texture
  const tri: Pt[] = [[-5.2, -3.4], [5.4, -1.2], [-1.8, 5]];
  S(ctx, (c) => smoothPath(c, [...tri, [-4.6, 1.6]], true, 0.4), {
    fill: radial(ctx, -1.5, -1.5, 7, [[0, '#fff3a0'], [0.6, '#ffd23a'], [1, '#e9a515']]),
    ink: 1.1,
    shadow: '#d18c10',
    shadowOffset: [-1, -1.2],
    gloss: [{ x: -2, y: -1.8, rx: 2, ry: 0.9, rot: -0.2, alpha: 0.85 }],
  });
  line(ctx, [[-3.6, -1.6], [2.8, -0.6]], 0.45, '#e09a12', false, 0.8);
  line(ctx, [[-3.6, 0.6], [1.6, 0.9]], 0.45, '#e09a12', false, 0.8);
  line(ctx, [[-2.8, 2.4], [-0.6, 2.6]], 0.45, '#e09a12', false, 0.8);
});

danger('proj.e_pepperoni', 14, (ctx) => {
  S(ctx, (c) => circlePath(c, 0, 0, 7), {
    fill: radial(ctx, -2, -2.4, 9, [[0, '#ec6a4a'], [0.6, '#cf3a2c'], [1, '#9a2020']]),
    ink: 1.2,
    shadow: '#8c1d1d',
    shadowOffset: [-1.1, -1.3],
    gloss: [{ x: -2.8, y: -3, rx: 2.4, ry: 1.2, rot: -0.7, alpha: 0.7 }],
  });
  // fat specks
  const R = rng(14);
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 4.8;
    ctx.fillStyle = 'rgba(255,214,200,0.85)';
    ctx.beginPath();
    ellipsePath(ctx, Math.cos(a) * d, Math.sin(a) * d, 0.7 + R() * 0.5, 0.5 + R() * 0.4, R() * 3);
    ctx.fill();
  }
  ctx.restore();
  // curled darker rim
  ctx.save();
  ctx.beginPath();
  circlePath(ctx, 0, 0, 6.1);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'rgba(120,20,20,0.6)';
  ctx.stroke();
  ctx.restore();
});

danger('proj.e_generic', 12, (ctx) => {
  sauceBlob(ctx, 6, '#f2622a', '#b13018', 11);
  glint(ctx, 1.8, -2.6, 0.7, 0.5, 0, 0.8);
});

// helper kept for engine-side debugging: list ids
export const PROJECTILE_IDS = [
  'proj.mattarello', 'proj.mattarello_nonna', 'proj.ciabatta', 'proj.ciabatta_oro', 'proj.coltello', 'proj.coltello_mille',
  'proj.olive', 'proj.olive_oro', 'proj.forchetta', 'proj.tridente', 'proj.pizza', 'proj.pizza_celeste', 'proj.rotella',
  'proj.rotella_oro', 'proj.peperoncino', 'proj.moka', 'proj.moka_turbo', 'proj.vesuvio', 'proj.meteor', 'proj.forma',
  'proj.forma_oro', 'proj.basilico', 'proj.e_ketchup', 'proj.e_cream', 'proj.e_seed', 'proj.e_pepperoni', 'proj.e_generic',
];
// keep imports used under noUnusedLocals
void linear; void polyPath; void rgba;
