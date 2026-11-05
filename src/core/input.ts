/**
 * Unified input: keyboard, gamepad and a floating touch joystick.
 * - Continuous movement vector (analog, length ≤ 1).
 * - Edge-triggered UI actions consumed once per frame.
 */

export type Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back' | 'pause' | 'reroll' | 'skip' | 'banish';
export type Device = 'keyboard' | 'gamepad' | 'touch' | 'mouse';

const KEYMAP: Record<string, Action[]> = {
  ArrowUp: ['up'], KeyW: ['up'], KeyZ: ['up'],
  ArrowDown: ['down'], KeyS: ['down'],
  ArrowLeft: ['left'], KeyA: ['left'], KeyQ: ['left'],
  ArrowRight: ['right'], KeyD: ['right'],
  Enter: ['confirm'], Space: ['confirm'], NumpadEnter: ['confirm'],
  Escape: ['back', 'pause'], Backspace: ['back'], KeyP: ['pause'],
  KeyR: ['reroll'], KeyX: ['skip'], KeyB: ['banish'],
};

const MOVE_KEYS = {
  up: ['ArrowUp', 'KeyW', 'KeyZ'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA', 'KeyQ'],
  right: ['ArrowRight', 'KeyD'],
};

export class Input {
  moveX = 0;
  moveY = 0;
  device: Device = 'keyboard';
  private keys = new Set<string>();
  private pressedQ = new Set<Action>();
  private padPrev: boolean[] = [];
  private padRepeat = new Map<Action, number>();
  // touch joystick
  touchActive = false;
  touchId: number | null = null;
  touchOX = 0;
  touchOY = 0;
  touchX = 0;
  touchY = 0;
  readonly touchRadius = 56;
  /** true while gameplay accepts joystick touches (UI screens disable it) */
  joystickEnabled = false;
  onDeviceChange?: (d: Device) => void;

  constructor(touchSurface: HTMLElement) {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.keys.clear());
    window.addEventListener('mousemove', () => this.setDevice('mouse'), { passive: true });
    window.addEventListener('mousedown', () => this.setDevice('mouse'), { passive: true });
    const ts = touchSurface;
    ts.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    ts.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    ts.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    ts.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
    // pointer (mouse) drag joystick fallback is not needed — keyboard on desktop.
  }

  private setDevice(d: Device) {
    if (this.device !== d) {
      this.device = d;
      this.onDeviceChange?.(d);
    }
  }

  private onKey(e: KeyboardEvent, down: boolean) {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (down) {
      if (!e.repeat || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        const acts = KEYMAP[e.code];
        if (acts) for (const a of acts) this.pressedQ.add(a);
      }
      this.keys.add(e.code);
      this.setDevice('keyboard');
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    } else {
      this.keys.delete(e.code);
    }
  }

  private onTouchStart(e: TouchEvent) {
    this.setDevice('touch');
    if (!this.joystickEnabled) return;
    e.preventDefault();
    if (this.touchId !== null) return;
    const t = e.changedTouches[0];
    this.touchId = t.identifier;
    this.touchActive = true;
    this.touchOX = this.touchX = t.clientX;
    this.touchOY = this.touchY = t.clientY;
  }
  private onTouchMove(e: TouchEvent) {
    if (this.touchId === null) return;
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier !== this.touchId) continue;
      this.touchX = t.clientX;
      this.touchY = t.clientY;
      // drag the origin along if the finger goes far (floating stick)
      const dx = this.touchX - this.touchOX, dy = this.touchY - this.touchOY;
      const d = Math.hypot(dx, dy);
      const max = this.touchRadius * 1.25;
      if (d > max) {
        this.touchOX = this.touchX - (dx / d) * max;
        this.touchOY = this.touchY - (dy / d) * max;
      }
    }
  }
  private onTouchEnd(e: TouchEvent) {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.touchId) {
        this.touchId = null;
        this.touchActive = false;
      }
    }
  }

  releaseTouch() {
    this.touchId = null;
    this.touchActive = false;
  }

  private key(codes: string[]) {
    for (const c of codes) if (this.keys.has(c)) return true;
    return false;
  }

  /** Poll devices; call once per frame before reading. */
  update(dt: number) {
    let mx = 0, my = 0;
    if (this.key(MOVE_KEYS.left)) mx -= 1;
    if (this.key(MOVE_KEYS.right)) mx += 1;
    if (this.key(MOVE_KEYS.up)) my -= 1;
    if (this.key(MOVE_KEYS.down)) my += 1;
    if (mx || my) {
      const l = Math.hypot(mx, my);
      mx /= l; my /= l;
    }
    // gamepad
    let pads: (Gamepad | null)[] = [];
    try {
      pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    } catch {
      pads = []; // blocked by permissions policy (e.g. sandboxed iframe)
    }
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
      const mag = Math.hypot(ax, ay);
      const dead = 0.22;
      if (mag > dead) {
        const k = Math.min(1, (mag - dead) / (1 - dead)) / mag;
        mx = ax * k; my = ay * k;
        this.setDevice('gamepad');
      }
      const b = (i: number) => !!p.buttons[i]?.pressed;
      const dpadX = (b(15) ? 1 : 0) - (b(14) ? 1 : 0);
      const dpadY = (b(13) ? 1 : 0) - (b(12) ? 1 : 0);
      if ((dpadX || dpadY) && !(mag > dead)) {
        const l = Math.hypot(dpadX, dpadY);
        mx = dpadX / l; my = dpadY / l;
      }
      const map: [number, Action][] = [[0, 'confirm'], [1, 'back'], [9, 'pause'], [8, 'back'], [2, 'reroll'], [3, 'skip'], [12, 'up'], [13, 'down'], [14, 'left'], [15, 'right']];
      for (const [i, a] of map) {
        const now = b(i);
        const was = this.padPrev[i] ?? false;
        if (now && !was) {
          this.pressedQ.add(a);
          this.setDevice('gamepad');
          this.padRepeat.set(a, 0.38);
        } else if (now && (a === 'up' || a === 'down' || a === 'left' || a === 'right')) {
          const r = (this.padRepeat.get(a) ?? 0.38) - dt;
          if (r <= 0) { this.pressedQ.add(a); this.padRepeat.set(a, 0.12); } else this.padRepeat.set(a, r);
        }
        this.padPrev[i] = now;
      }
      // stick as menu navigation (edge)
      const sx = ax > 0.6 ? 1 : ax < -0.6 ? -1 : 0;
      const sy = ay > 0.6 ? 1 : ay < -0.6 ? -1 : 0;
      const prevSx = this.padPrev[100] ? 1 : this.padPrev[101] ? -1 : 0;
      const prevSy = this.padPrev[102] ? 1 : this.padPrev[103] ? -1 : 0;
      if (sx !== prevSx && sx !== 0) this.pressedQ.add(sx > 0 ? 'right' : 'left');
      if (sy !== prevSy && sy !== 0) this.pressedQ.add(sy > 0 ? 'down' : 'up');
      this.padPrev[100] = sx > 0; this.padPrev[101] = sx < 0;
      this.padPrev[102] = sy > 0; this.padPrev[103] = sy < 0;
      break;
    }
    // touch joystick
    if (this.touchActive) {
      const dx = this.touchX - this.touchOX, dy = this.touchY - this.touchOY;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        const k = Math.min(1, d / this.touchRadius) / d;
        mx = dx * k; my = dy * k;
      }
    }
    this.moveX = mx;
    this.moveY = my;
  }

  /** Was the action pressed since last endFrame()? */
  pressed(a: Action): boolean {
    return this.pressedQ.has(a);
  }
  consume(a: Action): boolean {
    if (this.pressedQ.has(a)) {
      this.pressedQ.delete(a);
      return true;
    }
    return false;
  }
  endFrame() {
    this.pressedQ.clear();
  }
  get hasGamepad() {
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) if (p && p.connected) return true;
    } catch {
      /* not allowed here */
    }
    return false;
  }
}
