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
 * On <body> while the focus was last set by the keys, the gamepad or a new screen, off once the
 * pointer moves or presses. main.css shows its :hover looks only while it is off: an element that
 * merely lies under a resting pointer must not look focused next to the one that is.
 */
const KEYS = 'keys-nav';

/**
 * Spatial navigation among elements marked [data-nav] inside a root.
 * Arrow keys / d-pad move focus to the nearest element in that direction.
 */
export class Nav {
  /** keyboard / gamepad scrolling of a data-nav-scroll panel: where the last press is heading */
  private scrollTo: number | null = null;
  private scrollEl: HTMLElement | null = null;
  private scrollAt = 0;
  root: HTMLElement | null = null;
  cur: HTMLElement | null = null;
  onBack: (() => void) | null = null;
  /** where the pointer last was: an event that reports no movement is not a hover */
  private px = NaN;
  private py = NaN;

  /**
   * Hover focus follows real pointer movement only. (mouseenter would also fire when a key-driven
   * scroll, the wheel or a new screen slides an element under a resting pointer, and take the
   * focus away from the keyboard / gamepad.) The innermost [data-nav] under the pointer wins: a
   * link inside a row, else the row.
   */
  private onPointerMove = (e: MouseEvent) => {
    if (e.clientX === this.px && e.clientY === this.py) return;
    this.px = e.clientX;
    this.py = e.clientY;
    this.hover(e.target);
  };

  /** A press without a move before it (the content was scrolled under the pointer) focuses too. */
  private onPointerDown = (e: MouseEvent) => this.hover(e.target);

  private hover(target: EventTarget | null) {
    document.body.classList.remove(KEYS);
    const el = (target as Element | null)?.closest?.<HTMLElement>('[data-nav]');
    if (el && el !== this.cur && this.root?.contains(el)) this.focus(el, true, false, true);
  }

  /** Tab / Shift+Tab move DOM focus: let the highlight follow, so Enter activates what is outlined */
  private onFocusIn = (e: FocusEvent) => {
    const t = e.target as HTMLElement | null;
    if (!t || !this.root || t === this.cur || !this.root.contains(t) || !t.hasAttribute('data-nav')) return;
    this.focus(t, true);
  };

  constructor() {
    document.addEventListener('mousemove', this.onPointerMove, { passive: true });
    document.addEventListener('mousedown', this.onPointerDown, { passive: true });
    document.addEventListener('focusin', this.onFocusIn);
  }

  /** Detach from the document (the app builds a new UI, and with it a new Nav, after a save reset). */
  dispose() {
    document.removeEventListener('mousemove', this.onPointerMove);
    document.removeEventListener('mousedown', this.onPointerDown);
    document.removeEventListener('focusin', this.onFocusIn);
    document.body.classList.remove(KEYS);
    this.root = this.cur = null;
  }

  setRoot(root: HTMLElement | null, onBack: (() => void) | null = null, focusFirst = true) {
    this.root = root;
    this.onBack = onBack;
    this.cur = null;
    if (!root) return;
    if (focusFirst) {
      const def = root.querySelector<HTMLElement>('[data-nav-default]') ?? root.querySelector<HTMLElement>('[data-nav]');
      if (def) this.focus(def, false, false);
    }
  }

  /** the content changed: if the focused element is gone, focus the first one */
  refresh() {
    if (!this.root) return;
    if (this.cur && !this.root.contains(this.cur)) {
      this.cur = null;
      const def = this.root.querySelector<HTMLElement>('[data-nav]');
      if (def) this.focus(def, false);
    }
  }

  /**
   * @param hover the pointer moved onto the element or pressed it (not a key, the d-pad or Tab).
   *   Passed on in the 'navfocus' event's detail: a list entry that opens on focus must not open
   *   under a pointer that is only passing over it (its click handler opens it).
   */
  focus(el: HTMLElement, sound = true, scroll = true, hover = false) {
    if (this.cur === el) return;
    this.cur?.classList.remove('focus');
    this.cur = el;
    el.classList.add('focus');
    document.body.classList.toggle(KEYS, !hover);
    // DOM focus follows the highlight, so the :focus-visible ring and Enter agree with it
    const ae = document.activeElement as HTMLElement | null;
    if (el.tabIndex >= 0) {
      if (ae !== el) el.focus({ preventScroll: true });
    } else if (ae && ae !== document.body && typeof ae.blur === 'function') ae.blur();
    if (sound) audio.sfx('ui_hover', { volume: 0.5 });
    el.dispatchEvent(new CustomEvent('navfocus', { detail: { hover } }));
    // keep keyboard/gamepad focus visible, including content that overflows a screen (a hovered
    // element stays where it is: scrolling it would pull it from under the pointer)
    if (scroll && !hover) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
    if (!best && dy) {
      // nothing further in that direction: scroll a long panel (marked data-nav-scroll) first
      const sc = this.root?.querySelector<HTMLElement>('[data-nav-scroll]');
      if (sc && sc.scrollHeight > sc.clientHeight + 2) {
        const max = sc.scrollHeight - sc.clientHeight;
        // a held key repeats faster than the smooth scroll runs: continue from where the previous
        // press was heading, not from where the animation has got to (or a hold would crawl)
        const now = performance.now();
        const base = this.scrollTo !== null && this.scrollEl === sc && now - this.scrollAt < 450 ? this.scrollTo : sc.scrollTop;
        if ((dy > 0 && base < max - 1) || (dy < 0 && base > 1)) {
          const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
          const top = Math.max(0, Math.min(max, base + dy * Math.max(80, sc.clientHeight * 0.6)));
          this.scrollTo = top;
          this.scrollEl = sc;
          this.scrollAt = now;
          sc.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
          return;
        }
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
      this.cur.dispatchEvent(new Event('change')); // persist (sliders save on change)
      return true;
    }
    return false;
  }
}
