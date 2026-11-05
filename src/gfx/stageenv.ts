/**
 * Stage ENVIRONMENT contract (visuals + static obstacles of a map).
 * Art modules implement `StageEnv` for each map; the game runtime streams
 * chunks around the camera, draws tiles + props and uses colliders.
 */

export type Collider =
  | { kind: 'circle'; r: number; ox?: number; oy?: number }
  | { kind: 'rect'; w: number; h: number; ox?: number; oy?: number };

export interface PropLight {
  /** light radius (world units) */
  r: number;
  /** light colour (hex) */
  color: string;
  /** 0..1 intensity */
  intensity?: number;
  /** 0..1 flicker amount (candles/fire) */
  flicker?: number;
  ox?: number;
  oy?: number;
}

export type PropFx = 'steam' | 'smoke' | 'flame' | 'sparkle' | 'drip' | 'bubbles' | 'leaves' | 'pigeons' | 'fountain';

export interface PropPlacement {
  /** sprite id to draw (anchor at x,y) */
  sprite: string;
  x: number;
  y: number;
  /** animation frame to show (if the sprite has frames and `animFps` is set, it animates) */
  frame?: number;
  animFps?: number;
  flip?: boolean;
  /** 'floor' = drawn flat under everything (rugs, drains, stains); 'sorted' (default) = y-sorted with characters; 'overhead' = above everything (laundry lines, awnings, hanging lamps) */
  layer?: 'floor' | 'sorted' | 'overhead';
  /** y-sort offset (sort by y + sortOffset) */
  sortOffset?: number;
  /** blocks movement */
  collider?: Collider;
  /** destructible (drops a pickup when broken); hp in "hits" */
  breakable?: { hp: number; debris: string };
  /** emits light at night/dark stages */
  light?: PropLight;
  /** ambient particle emitter attached to this prop */
  fx?: { kind: PropFx; ox?: number; oy?: number; rate?: number };
}

export interface StageAmbient {
  /** multiply tint applied over the world (e.g. warm kitchen '#ffe9cf') */
  tint: string;
  /** 0..1 darkness of the light-map pass (0 = no light pass) */
  darkness: number;
  /** colour of darkness (e.g. deep blue night '#141a3a') */
  darkColor: string;
  /** vignette strength 0..1 */
  vignette: number;
  /** ambient floating particles across the screen */
  particles?: 'dust' | 'flour' | 'fireflies' | 'embers' | 'petals' | 'rain' | 'none';
}

export interface StageEnv {
  id: string;
  /** square floor tile size in world units */
  tileSize: number;
  /** sprite id of the floor tile at integer tile coords (deterministic) */
  tile(tx: number, ty: number): string;
  /** chunk size in world units for prop population */
  chunkSize: number;
  /**
   * Deterministically place props for chunk (cx,cy) — covers world rect
   * [cx*chunkSize, (cx+1)*chunkSize) x [cy*chunkSize, (cy+1)*chunkSize).
   * `rnd` is a seeded RNG for this chunk. Must keep the area around world
   * origin (|x|,|y| < 260) free of colliders (player spawn).
   */
  populate(cx: number, cy: number, rnd: () => number): PropPlacement[];
  ambient: StageAmbient;
}

/** Registry of stage environments (art modules call registerStageEnv at import time). */
export const STAGE_ENVS: Record<string, StageEnv> = {};

export function registerStageEnv(env: StageEnv) {
  STAGE_ENVS[env.id] = env;
}
