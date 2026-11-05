/** Tiny DOM helpers + spatial keyboard/gamepad navigation. */
import { audio } from '../audio/audio';

type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, any> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  const add = (c: Child) => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  };
  children.forEach(add);
  return el;
}

export function img(src: string, cls = '', alt = ''): HTMLImageElement {
  const i = document.createElement('img');
  i.src = src;
  if (cls) i.className = cls;
  i.alt = alt;
  i.draggable = false;
  return i;
}

/**
 * Spatial navigation among elements marked [data-nav] inside a root.
 * Arrow keys / d-pad move focus to the nearest element in that direction.
 */
export class Nav {
  root: HTMLElement | null = null;
  cur: HTMLElement | null = null;
  onBack: (() => void) | null = null;

  setRoot(root: HTMLElement | null, onBack: (() => void) | null = null, focusFirst = true) {
    this.root = root;
    this.onBack = onBack;
    this.cur = null;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => this.wire(el));
    if (focusFirst) {
      const def = root.querySelector<HTMLElement>('[data-nav-default]') ?? root.querySelector<HTMLElement>('[data-nav]');
      if (def) this.focus(def, false);
    }
  }

  /** register newly added elements */
  refresh() {
    if (!this.root) return;
    this.root.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => this.wire(el));
    if (this.cur && !this.root.contains(this.cur)) {
      this.cur = null;
      const def = this.root.querySelector<HTMLElement>('[data-nav]');
      if (def) this.focus(def, false);
    }
  }

  private wire(el: HTMLElement) {
    if ((el as any)._navWired) return;
    (el as any)._navWired = true;
    el.addEventListener('mouseenter', () => this.focus(el, true));
  }

  focus(el: HTMLElement, sound = true) {
    if (this.cur === el) return;
    this.cur?.classList.remove('focus');
    this.cur = el;
    el.classList.add('focus');
    if (sound) audio.sfx('ui_hover', { volume: 0.5 });
    el.dispatchEvent(new CustomEvent('navfocus'));
    const sc = el.closest('.scroll, .panel-body, .coll-list');
    if (sc) el.scrollIntoView({ block: 'nearest' });
  }

  private items(): HTMLElement[] {
    if (!this.root) return [];
    return Array.from(this.root.querySelectorAll<HTMLElement>('[data-nav]')).filter((e) => e.offsetParent !== null || e.getClientRects().length > 0);
  }

  move(dx: number, dy: number) {
    const items = this.items();
    if (!items.length) return;
    if (!this.cur || !items.includes(this.cur)) {
      this.focus(items[0]);
      return;
    }
    const r0 = this.cur.getBoundingClientRect();
    const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best: HTMLElement | null = null;
    let bestScore = Infinity;
    for (const el of items) {
      if (el === this.cur) continue;
      const r = el.getBoundingClientRect();
      const ex = r.left + r.width / 2, ey = r.top + r.height / 2;
      const vx = ex - cx, vy = ey - cy;
      const along = vx * dx + vy * dy;
      if (along <= 4) continue;
      const perp = Math.abs(vx * dy - vy * dx);
      const score = along + perp * 2.2;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    if (!best) {
      // wrap around for vertical/horizontal lists
      const idx = items.indexOf(this.cur);
      const next = dx + dy > 0 ? items[(idx + 1) % items.length] : items[(idx - 1 + items.length) % items.length];
      best = next;
    }
    if (best) this.focus(best);
  }

  activate() {
    if (this.cur) {
      if (this.cur.classList.contains('toggle') || this.cur.tagName === 'BUTTON' || this.cur.dataset.nav !== undefined) this.cur.click();
    }
  }

  /** left/right on range inputs */
  adjust(d: number): boolean {
    if (this.cur && this.cur instanceof HTMLInputElement && this.cur.type === 'range') {
      const step = parseFloat(this.cur.step || '0.05');
      this.cur.value = String(Math.min(parseFloat(this.cur.max), Math.max(parseFloat(this.cur.min), parseFloat(this.cur.value) + d * step)));
      this.cur.dispatchEvent(new Event('input'));
      return true;
    }
    return false;
  }
}
