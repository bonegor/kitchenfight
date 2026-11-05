/** Uniform-grid spatial hash for many moving circles (rebuilt every frame). */

export interface Spatial {
  x: number;
  y: number;
  r: number;
  /** query stamp scratch field (owned by SpatialHash) */
  qs: number;
}

export class SpatialHash<T extends Spatial> {
  private cells = new Map<number, T[]>();
  private used: T[][] = [];
  private pool: T[][] = [];
  private stamp = 0;

  constructor(public cell = 64) {}

  private key(cx: number, cy: number) {
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  clear() {
    for (const arr of this.used) arr.length = 0;
    this.pool.push(...this.used);
    this.used.length = 0;
    this.cells.clear();
  }

  insert(item: T) {
    const c = this.cell;
    const x0 = Math.floor((item.x - item.r) / c), x1 = Math.floor((item.x + item.r) / c);
    const y0 = Math.floor((item.y - item.r) / c), y1 = Math.floor((item.y + item.r) / c);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const k = this.key(cx, cy);
        let arr = this.cells.get(k);
        if (!arr) {
          arr = this.pool.pop() ?? [];
          this.cells.set(k, arr);
          this.used.push(arr);
        }
        arr.push(item);
      }
    }
  }

  /** Collect unique items whose cells overlap the circle's AABB into `out`. */
  query(x: number, y: number, r: number, out: T[]): T[] {
    out.length = 0;
    const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    const st = ++this.stamp;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          const it = arr[i];
          if (it.qs === st) continue;
          it.qs = st;
          out.push(it);
        }
      }
    }
    return out;
  }
}
