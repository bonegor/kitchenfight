/**
 * World: streams the stage environment in chunks around the camera, keeps a
 * static collision grid of props, handles breakable props.
 */
import type { StageEnv, PropPlacement } from '../gfx/stageenv';
import { hash2, seededRandom } from '../core/math';

export interface PropInst extends PropPlacement {
  key: string; // unique & stable: chunk + index
  hp: number;
  hitFlash: number;
  shake: number;
  fxT: number;
  qs: number;
  r: number; // bounding radius for queries
}

const CELL = 128;

export class World {
  env: StageEnv;
  private chunks = new Map<string, PropInst[]>();
  private grid = new Map<number, PropInst[]>();
  private destroyed = new Set<string>();
  visible: PropInst[] = [];
  private stamp = 1;
  private salt: number;

  constructor(env: StageEnv, salt = 0) {
    this.env = env;
    this.salt = salt;
  }

  private gkey(cx: number, cy: number) {
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  private footprint(p: PropInst): [number, number, number, number] | null {
    const c = p.collider;
    if (!c) {
      // breakables without a collider still need a hit area
      if (p.breakable) return [p.x - 20, p.y - 34, p.x + 20, p.y + 4];
      return null;
    }
    const ox = p.x + (c.ox ?? 0), oy = p.y + (c.oy ?? 0);
    if (c.kind === 'circle') return [ox - c.r, oy - c.r, ox + c.r, oy + c.r];
    return [ox - c.w / 2, oy - c.h / 2, ox + c.w / 2, oy + c.h / 2];
  }

  private addToGrid(p: PropInst) {
    const f = this.footprint(p);
    if (!f) return;
    for (let cy = Math.floor(f[1] / CELL); cy <= Math.floor(f[3] / CELL); cy++)
      for (let cx = Math.floor(f[0] / CELL); cx <= Math.floor(f[2] / CELL); cx++) {
        const k = this.gkey(cx, cy);
        let a = this.grid.get(k);
        if (!a) this.grid.set(k, (a = []));
        a.push(p);
      }
  }

  private removeFromGrid(p: PropInst) {
    const f = this.footprint(p);
    if (!f) return;
    for (let cy = Math.floor(f[1] / CELL); cy <= Math.floor(f[3] / CELL); cy++)
      for (let cx = Math.floor(f[0] / CELL); cx <= Math.floor(f[2] / CELL); cx++) {
        const k = this.gkey(cx, cy);
        const a = this.grid.get(k);
        if (!a) continue;
        const i = a.indexOf(p);
        if (i >= 0) a.splice(i, 1);
        if (!a.length) this.grid.delete(k);
      }
  }

  private loadChunk(cx: number, cy: number) {
    const key = cx + ',' + cy;
    if (this.chunks.has(key)) return;
    const rnd = seededRandom(hash2(cx, cy, 977 + this.salt));
    let list: PropPlacement[] = [];
    try {
      list = this.env.populate(cx, cy, rnd);
    } catch (e) {
      console.error('populate failed', e);
    }
    const out: PropInst[] = [];
    list.forEach((pl, i) => {
      const k = key + ':' + i;
      if (this.destroyed.has(k)) return;
      // keep the spawn area clear of colliders no matter what
      if (pl.collider && Math.abs(pl.x) < 200 && Math.abs(pl.y) < 200) return;
      const p: PropInst = {
        ...pl,
        key: k,
        hp: pl.breakable?.hp ?? 0,
        hitFlash: 0,
        shake: 0,
        fxT: Math.random() * 2,
        qs: 0,
        r: 60,
      };
      out.push(p);
      this.addToGrid(p);
    });
    this.chunks.set(key, out);
  }

  private unloadChunk(key: string) {
    const list = this.chunks.get(key);
    if (!list) return;
    for (const p of list) this.removeFromGrid(p);
    this.chunks.delete(key);
  }

  /** Stream chunks covering the given rectangle (+margin). Rebuilds `visible`. */
  update(x0: number, y0: number, x1: number, y1: number, dt: number) {
    const cs = this.env.chunkSize;
    const m = cs * 0.75;
    const cx0 = Math.floor((x0 - m) / cs), cx1 = Math.floor((x1 + m) / cs);
    const cy0 = Math.floor((y0 - m) / cs), cy1 = Math.floor((y1 + m) / cs);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) this.loadChunk(cx, cy);
    // unload far chunks
    for (const key of [...this.chunks.keys()]) {
      const [sx, sy] = key.split(',').map(Number);
      if (sx < cx0 - 2 || sx > cx1 + 2 || sy < cy0 - 2 || sy > cy1 + 2) this.unloadChunk(key);
    }
    this.visible.length = 0;
    const vm = 260;
    for (const list of this.chunks.values()) {
      for (const p of list) {
        if (p.hitFlash > 0) p.hitFlash -= dt;
        if (p.shake > 0) p.shake = Math.max(0, p.shake - dt * 4);
        if (p.x > x0 - vm && p.x < x1 + vm && p.y > y0 - vm && p.y < y1 + vm * 1.6) this.visible.push(p);
      }
    }
  }

  /** Push a circle out of all colliders. Returns true if it collided. */
  resolve(o: { x: number; y: number }, r: number): boolean {
    const x0 = Math.floor((o.x - r) / CELL), x1 = Math.floor((o.x + r) / CELL);
    const y0 = Math.floor((o.y - r) / CELL), y1 = Math.floor((o.y + r) / CELL);
    let hit = false;
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const a = this.grid.get(this.gkey(cx, cy));
        if (!a) continue;
        for (const p of a) {
          const c = p.collider;
          if (!c) continue;
          const px = p.x + (c.ox ?? 0), py = p.y + (c.oy ?? 0);
          if (c.kind === 'circle') {
            const dx = o.x - px, dy = o.y - py;
            const rr = r + c.r;
            const d2 = dx * dx + dy * dy;
            if (d2 < rr * rr) {
              const d = Math.sqrt(d2) || 0.001;
              const push = rr - d;
              o.x += (dx / d) * push;
              o.y += (dy / d) * push;
              hit = true;
            }
          } else {
            const hw = c.w / 2, hh = c.h / 2;
            const nx = Math.max(px - hw, Math.min(o.x, px + hw));
            const ny = Math.max(py - hh, Math.min(o.y, py + hh));
            let dx = o.x - nx, dy = o.y - ny;
            const d2 = dx * dx + dy * dy;
            if (d2 < r * r) {
              if (d2 > 1e-6) {
                const d = Math.sqrt(d2);
                o.x += (dx / d) * (r - d);
                o.y += (dy / d) * (r - d);
              } else {
                // centre inside the rect: push along the smallest axis
                const l = o.x - (px - hw), rr = px + hw - o.x, t = o.y - (py - hh), b = py + hh - o.y;
                const m = Math.min(l, rr, t, b);
                if (m === l) o.x = px - hw - r;
                else if (m === rr) o.x = px + hw + r;
                else if (m === t) o.y = py - hh - r;
                else o.y = py + hh + r;
              }
              hit = true;
            }
          }
        }
      }
    return hit;
  }

  /** Is a point (with radius) free of colliders? */
  free(x: number, y: number, r: number): boolean {
    const o = { x, y };
    return !this.resolve(o, r);
  }

  /** Breakable props whose footprint overlaps the circle. */
  breakablesNear(x: number, y: number, r: number, out: PropInst[]): PropInst[] {
    out.length = 0;
    const st = ++this.stamp;
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
    const y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const a = this.grid.get(this.gkey(cx, cy));
        if (!a) continue;
        for (const p of a) {
          if (!p.breakable || p.hp <= 0 || p.qs === st) continue;
          p.qs = st;
          const f = this.footprint(p)!;
          const nx = Math.max(f[0], Math.min(x, f[2])), ny = Math.max(f[1], Math.min(y, f[3]));
          if ((nx - x) ** 2 + (ny - y) ** 2 <= r * r) out.push(p);
        }
      }
    return out;
  }

  destroy(p: PropInst) {
    this.destroyed.add(p.key);
    this.removeFromGrid(p);
    const key = p.key.split(':')[0];
    const list = this.chunks.get(key);
    if (list) {
      const i = list.indexOf(p);
      if (i >= 0) list.splice(i, 1);
    }
  }
}
