/**
 * PLACEHOLDERS for the Il Menù sprites. Imported LAST by art/index.ts: for every id below
 * that no art module has defined yet, it registers a clear stand-in (shaded shape in the
 * right colour + the id's initials) with the final box, anchor, frames and hit flash, so
 * the game is fully playable before the art lands. As soon as an art module defines an id,
 * its placeholder is simply never registered. `PLACEHOLDER_IDS` lists the ones in use
 * (scripts/validate.mjs prints them).
 */
import { defineSprite, hasSprite } from '../sprites';
import { shape, ellipsePath, circlePath, roundRectPath, glint, rgba, shade, light, INK, type Ctx } from '../painter';
import { INGREDIENTS } from '../../game/recipes';

type Kind = 'enemy' | 'boss' | 'proj' | 'puddle' | 'ingr' | 'dish';
interface Spec { id: string; kind: Kind; w: number; h: number; ax: number; ay: number; r: number; color: string; label: string; form?: 'round' | 'box' | 'tall' | 'blob' }

const SPECS: Spec[] = [
  // enemies (contract in recipes_enemies_a.ts / recipes_enemies_b.ts)
  { id: 'enemy.burro', kind: 'enemy', w: 46, h: 52, ax: 23, ay: 36, r: 14, color: '#fbe58a', label: 'BU', form: 'box' },
  { id: 'enemy.funghi', kind: 'enemy', w: 46, h: 50, ax: 23, ay: 34, r: 13, color: '#d9c3a0', label: 'FU', form: 'round' },
  { id: 'enemy.prosciutto', kind: 'enemy', w: 48, h: 50, ax: 24, ay: 34, r: 14, color: '#f2a8a8', label: 'PR', form: 'blob' },
  { id: 'enemy.broccoli', kind: 'enemy', w: 50, h: 58, ax: 25, ay: 40, r: 15, color: '#3f8a34', label: 'BR', form: 'round' },
  { id: 'enemy.gamberi', kind: 'enemy', w: 44, h: 40, ax: 22, ay: 26, r: 12, color: '#ff8a6a', label: 'GA', form: 'blob' },
  { id: 'enemy.anacardo', kind: 'enemy', w: 30, h: 26, ax: 15, ay: 15, r: 8, color: '#e9d3a2', label: 'A', form: 'blob' },
  { id: 'enemy.olio', kind: 'enemy', w: 40, h: 54, ax: 20, ay: 38, r: 13, color: '#f3e27a', label: 'OL', form: 'tall' },
  { id: 'enemy.filante', kind: 'enemy', w: 52, h: 42, ax: 26, ay: 26, r: 14, color: '#fff3d0', label: 'FI', form: 'blob' },
  { id: 'enemy.cheddar', kind: 'enemy', w: 44, h: 46, ax: 22, ay: 30, r: 13, color: '#ff9a1f', label: 'CH', form: 'box' },
  { id: 'enemy.bbq', kind: 'enemy', w: 44, h: 56, ax: 22, ay: 40, r: 14, color: '#6a3018', label: 'BQ', form: 'tall' },
  // bosses (contract in recipes_bosses_a.ts / recipes_bosses_b.ts)
  { id: 'boss.aglio', kind: 'boss', w: 190, h: 220, ax: 95, ay: 158, r: 56, color: '#f4ecd6', label: 'AGLIO', form: 'round' },
  { id: 'boss.burro', kind: 'boss', w: 210, h: 180, ax: 105, ay: 122, r: 54, color: '#fbe58a', label: 'BURRO', form: 'box' },
  { id: 'boss.bolognese', kind: 'boss', w: 240, h: 220, ax: 120, ay: 150, r: 62, color: '#c8421e', label: 'BOLOGNESE', form: 'blob' },
  { id: 'boss.frullatore', kind: 'boss', w: 170, h: 236, ax: 85, ay: 172, r: 56, color: '#5fb03a', label: 'FRULLA', form: 'tall' },
  { id: 'boss.grattugiato', kind: 'boss', w: 200, h: 226, ax: 100, ay: 160, r: 58, color: '#f3ecd0', label: 'GRATTUG', form: 'box' },
  // enemy projectiles
  { id: 'proj.e_spore', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#cdb48a', label: '' },
  { id: 'proj.e_floret', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#3f8a34', label: '' },
  { id: 'proj.e_bbq', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#6a3018', label: '' },
  { id: 'proj.e_clove', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#f4ecd6', label: '' },
  { id: 'proj.e_butterpat', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#fbe58a', label: '' },
  { id: 'proj.e_meatball', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#8a3a22', label: '' },
  { id: 'proj.e_pesto', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#4fa82e', label: '' },
  { id: 'proj.e_cheese', kind: 'proj', w: 24, h: 24, ax: 12, ay: 12, r: 6, color: '#fff3c8', label: '' },
  // hazard puddles
  { id: 'fx.butter_puddle', kind: 'puddle', w: 76, h: 56, ax: 38, ay: 28, r: 30, color: '#fbe58a', label: '' },
  { id: 'fx.seedoil_puddle', kind: 'puddle', w: 66, h: 48, ax: 33, ay: 24, r: 26, color: '#f3ec9a', label: '' },
  // the 27 real ingredients (contract in recipes_ingredients.ts)
  ...Object.values(INGREDIENTS).map((d): Spec => ({ id: d.sprite, kind: 'ingr', w: 24, h: 24, ax: 12, ay: 12, r: 9, color: d.color, label: d.id.slice(0, 2).toUpperCase() })),
  // the 11 dishes (contract in recipes_dishes.ts)
  ...([
    ['pomodoro', '#d8321e'], ['carbonara', '#f2c14e'], ['alfredo', '#f3e6c0'], ['amatriciana', '#c0301c'], ['cacioepepe', '#efe6cf'],
    ['margherita', '#d8321e'], ['marinara', '#c42a1a'], ['ragu', '#8a3a22'], ['pesto', '#4fa82e'], ['vongole', '#f0dca0'], ['foodcourt', '#d93fd0'],
  ] as [string, string][]).map(([id, c]): Spec => ({ id: 'dish.' + id, kind: 'dish', w: 120, h: 80, ax: 60, ay: 40, r: 34, color: c, label: id.slice(0, 4).toUpperCase() })),
];

function label(ctx: Ctx, text: string, x: number, y: number, size: number, color = INK) {
  if (!text) return;
  ctx.save();
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function body(ctx: Ctx, s: Spec, cx: number, cy: number, rx: number, ry: number, ink: number) {
  const build = (c: Ctx) => {
    if (s.form === 'box') roundRectPath(c, cx - rx, cy - ry, rx * 2, ry * 2, Math.min(rx, ry) * 0.35);
    else if (s.form === 'tall') roundRectPath(c, cx - rx * 0.75, cy - ry * 1.1, rx * 1.5, ry * 2.1, rx * 0.4);
    else if (s.form === 'blob') ellipsePath(c, cx, cy, rx * 1.12, ry * 0.88);
    else circlePath(c, cx, cy, Math.min(rx, ry));
  };
  shape(ctx, build, {
    fill: s.color,
    ink,
    shadow: shade(s.color, 0.25),
    shadowOffset: [-rx * 0.16, -ry * 0.18],
    gloss: [{ x: cx - rx * 0.35, y: cy - ry * 0.45, rx: rx * 0.3, ry: ry * 0.16, rot: -0.5, alpha: 0.6 }],
  });
}

/** A tiny angry face so placeholders still read as villains. */
function face(ctx: Ctx, cx: number, cy: number, k: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = k * 0.12;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + sx * k * 0.32, cy - k * 0.1, k * 0.17, k * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(cx + sx * k * 0.3 + k * 0.04, cy - k * 0.07, k * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx + sx * k * 0.52, cy - k * 0.42);
    ctx.lineTo(cx + sx * k * 0.14, cy - k * 0.3);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - k * 0.22, cy + k * 0.28);
  ctx.quadraticCurveTo(cx, cy + k * 0.14, cx + k * 0.22, cy + k * 0.28);
  ctx.stroke();
  ctx.restore();
}

function drawEnemy(ctx: Ctx, s: Spec, f: number, pose: 'idle' | 'windup' | 'attack') {
  const big = s.kind === 'boss';
  const bob = [0, -1, 0, 1][f % 4] * (big ? 2.5 : 1);
  const squash = pose === 'windup' ? 0.9 : pose === 'attack' ? 1.1 : 1;
  const rx = s.r * 1.05 * (pose === 'attack' ? 1.06 : 1);
  const ry = s.r * 1.05 * squash;
  const cy = -ry * 0.25 + bob;
  // stubby feet
  ctx.fillStyle = INK;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * rx * 0.4 + (f % 2 ? sx : -sx) * 1.2, s.r * 0.92, rx * 0.2, s.r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  body(ctx, s, 0, cy, rx, ry, big ? 3.4 : 2.2);
  face(ctx, rx * 0.12, cy - ry * 0.12, Math.min(rx, ry) * 0.9);
  if (pose !== 'idle') {
    ctx.save();
    ctx.strokeStyle = pose === 'windup' ? '#ff3b2f' : '#ffd34d';
    ctx.lineWidth = big ? 4 : 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(0, cy, rx * 1.18, ry * 1.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, s.label, 0, cy + ry * 0.55, big ? 16 : Math.max(6, s.r * 0.55));
}

function drawProj(ctx: Ctx, s: Spec) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 11);
  g.addColorStop(0, rgba('#ff8a2a', 0.5));
  g.addColorStop(1, rgba('#ff3a1a', 0));
  ctx.fillStyle = g;
  ctx.fillRect(-12, -12, 24, 24);
  shape(ctx, (c) => circlePath(c, 0, 0, s.r), { fill: s.color, ink: 1.2, shadow: shade(s.color, 0.3), shadowOffset: [-1, -1.2] });
  ctx.save();
  ctx.strokeStyle = '#ffb03a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  circlePath(ctx, 0, 0, s.r + 1.2);
  ctx.stroke();
  ctx.restore();
  glint(ctx, -2, -2.4, 1.6, 0.9, -0.6, 0.9);
}

function drawPuddle(ctx: Ctx, s: Spec) {
  ctx.save();
  ctx.globalAlpha = 0.85;
  shape(ctx, (c) => ellipsePath(c, 0, 0, s.w * 0.42, s.h * 0.36), { fill: s.color, ink: 1.4, inkColor: shade(s.color, 0.45), shadow: light(s.color, 0.2), shadowOffset: [2, 2] });
  ctx.restore();
  glint(ctx, -s.w * 0.12, -s.h * 0.1, s.w * 0.12, s.h * 0.05, -0.15, 0.8);
}

function drawIngr(ctx: Ctx, s: Spec) {
  shape(ctx, (c) => circlePath(c, 0, 0, s.r), { fill: s.color, ink: 1.5, shadow: shade(s.color, 0.25), shadowOffset: [-1.6, -1.8], gloss: [{ x: -3, y: -3.5, rx: 2.6, ry: 1.4, rot: -0.6, alpha: 0.7 }] });
  label(ctx, s.label, 0, 0.5, 8);
}

function drawDish(ctx: Ctx, s: Spec) {
  // plate
  shape(ctx, (c) => ellipsePath(c, 0, 6, 54, 30), { fill: '#fbf7ee', ink: 2.2, shadow: '#e2d8c4', shadowOffset: [-3, -3] });
  ctx.save();
  ctx.strokeStyle = 'rgba(160,140,110,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 6, 40, 21, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  shape(ctx, (c) => ellipsePath(c, 0, 2, 34, 18), { fill: s.color, ink: 1.8, shadow: shade(s.color, 0.22), shadowOffset: [-2.5, -2.5], gloss: [{ x: -10, y: -5, rx: 9, ry: 3.5, rot: -0.3, alpha: 0.55 }] });
  label(ctx, s.label, 0, 2, 13);
}

/** Ids that are still placeholders (filled in below). */
export const PLACEHOLDER_IDS: string[] = [];

for (const s of SPECS) {
  if (s.kind === 'boss') {
    if (!hasSprite(s.id)) {
      PLACEHOLDER_IDS.push(s.id);
      defineSprite({ id: s.id, w: s.w, h: s.h, ax: s.ax, ay: s.ay, frames: 4, flash: true, draw: (ctx, f) => drawEnemy(ctx, s, f, 'idle') });
    }
    if (!hasSprite(s.id + '.attack')) {
      PLACEHOLDER_IDS.push(s.id + '.attack');
      defineSprite({ id: s.id + '.attack', w: s.w, h: s.h, ax: s.ax, ay: s.ay, frames: 2, flash: true, draw: (ctx, f) => drawEnemy(ctx, s, 0, f === 0 ? 'windup' : 'attack') });
    }
    continue;
  }
  if (hasSprite(s.id)) continue;
  PLACEHOLDER_IDS.push(s.id);
  if (s.kind === 'enemy') defineSprite({ id: s.id, w: s.w, h: s.h, ax: s.ax, ay: s.ay, frames: 4, flash: true, draw: (ctx, f) => drawEnemy(ctx, s, f, 'idle') });
  else if (s.kind === 'proj') defineSprite({ id: s.id, w: s.w, h: s.h, ax: s.ax, ay: s.ay, draw: (ctx) => drawProj(ctx, s) });
  else if (s.kind === 'puddle') defineSprite({ id: s.id, w: s.w, h: s.h, ax: s.ax, ay: s.ay, res: 2, draw: (ctx) => drawPuddle(ctx, s) });
  else if (s.kind === 'ingr') defineSprite({ id: s.id, w: s.w, h: s.h, ax: s.ax, ay: s.ay, res: 3, draw: (ctx) => drawIngr(ctx, s) });
  else defineSprite({ id: s.id, w: s.w, h: s.h, ax: s.ax, ay: s.ay, res: 3, draw: (ctx) => drawDish(ctx, s) });
}
