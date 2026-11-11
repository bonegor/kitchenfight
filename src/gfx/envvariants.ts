/**
 * Environment VARIANTS for Il Menù: each dish plays in one of the four base environments
 * (kitchen / trattoria / streets / foodcourt) with its own light and a little extra decor
 * made of existing props. A variant is a wrapper StageEnv registered as '<env>:<dishId>':
 * same tiles and props, overridden `ambient`, plus a few decor props per chunk (no
 * colliders, so the spawn area and paths stay exactly as in the base environment).
 */
import { STAGE_ENVS, registerStageEnv, type StageEnv, type PropPlacement } from './stageenv';
import type { StageDef, StageVariant } from '../game/stages';

/** Decor sets: [sprite, weight, layer, breakable hp?, debris?] — all existing props. */
type Decor = [string, number, 'floor' | 'sorted', number?, string?];
const DECOR: Record<NonNullable<StageVariant['decor']>, Decor[]> = {
  tomatoes: [['prop.common.crate_tomato', 2, 'sorted', 2, 'tomato'], ['prop.kitchen.sauce_a', 1.5, 'floor'], ['prop.kitchen.sauce_b', 1, 'floor'], ['prop.kitchen.basil_leaves', 1.2, 'floor']],
  basil: [['prop.common.basil_pot', 2, 'sorted'], ['prop.kitchen.basil_leaves', 2, 'floor'], ['prop.streets.leaves', 1, 'floor']],
  lemons: [['prop.common.crate_lemon', 2, 'sorted', 2, 'wood'], ['prop.trattoria.petals', 1.5, 'floor'], ['prop.trattoria.crumbs', 1, 'floor']],
  sea: [['prop.common.crate_lemon', 1.5, 'sorted', 2, 'wood'], ['prop.common.puddle', 1.5, 'floor'], ['prop.common.puddle_small', 1.5, 'floor'], ['prop.streets.petals', 0.6, 'floor']],
  osteria: [['prop.trattoria.wine_crate', 1.6, 'sorted', 2, 'glass'], ['prop.trattoria.wine_stain', 1.5, 'floor'], ['prop.trattoria.crumbs', 1, 'floor'], ['prop.trattoria.napkin_drop', 0.8, 'floor']],
  embers: [['prop.common.crate_tomato', 1.5, 'sorted', 2, 'tomato'], ['prop.kitchen.peels', 1.4, 'floor'], ['prop.kitchen.sauce_b', 1, 'floor'], ['prop.common.crumbs', 1, 'floor']],
  pantry: [['prop.common.crate', 1.2, 'sorted', 2, 'wood'], ['prop.kitchen.flour_a', 1, 'floor'], ['prop.kitchen.peels', 1, 'floor'], ['prop.common.crumbs', 1.2, 'floor']],
};

function pick(list: Decor[], r: number): Decor {
  const tot = list.reduce((a, d) => a + d[1], 0);
  let x = r * tot;
  for (const d of list) {
    x -= d[1];
    if (x <= 0) return d;
  }
  return list[list.length - 1];
}

function makeVariant(base: StageEnv, st: StageDef): StageEnv {
  const v = st.variant!;
  const decor = v.decor ? DECOR[v.decor].filter((d) => STAGE_ENVS[base.id] && d[0]) : [];
  return {
    id: `${base.id}:${st.id}`,
    tileSize: base.tileSize,
    tile: (tx, ty) => base.tile(tx, ty),
    chunkSize: base.chunkSize,
    populate(cx, cy, rnd) {
      const out: PropPlacement[] = base.populate(cx, cy, rnd);
      if (!decor.length) return out;
      const cs = base.chunkSize;
      const n = 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const x = (cx + 0.08 + rnd() * 0.84) * cs;
        const y = (cy + 0.08 + rnd() * 0.84) * cs;
        const d = pick(decor, rnd());
        // keep clear of the base props (and of the spawn spot for anything solid-looking)
        if (out.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 56 * 56)) continue;
        if (d[2] === 'sorted' && Math.abs(x) < 120 && Math.abs(y) < 120) continue;
        const p: PropPlacement = { sprite: d[0], x, y, flip: rnd() < 0.5 };
        if (d[2] === 'floor') p.layer = 'floor';
        if (d[3]) p.breakable = { hp: d[3], debris: d[4] ?? 'wood' };
        out.push(p);
      }
      return out;
    },
    ambient: {
      ...base.ambient,
      ...(v.tint !== undefined ? { tint: v.tint } : {}),
      ...(v.darkness !== undefined ? { darkness: v.darkness } : {}),
      ...(v.darkColor !== undefined ? { darkColor: v.darkColor } : {}),
      ...(v.vignette !== undefined ? { vignette: v.vignette } : {}),
      ...(v.particles !== undefined ? { particles: v.particles } : {}),
    },
  };
}

/**
 * The environment a stage plays in: its variant wrapper ('<env>:<dishId>', built and
 * registered on first use) or the base environment.
 */
export function envForStage(st: StageDef): StageEnv | undefined {
  const base = STAGE_ENVS[st.env];
  if (!base) return undefined;
  if (!st.variant) return base;
  const id = `${st.env}:${st.id}`;
  let env = STAGE_ENVS[id];
  if (!env) {
    env = makeVariant(base, st);
    registerStageEnv(env);
  }
  return env;
}
