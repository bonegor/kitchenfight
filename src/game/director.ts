/**
 * Wave director: spawns the crimes according to the stage script, runs timed
 * events (rings, walls, stampedes, elites, toasts) and the boss schedule.
 */
import type { Run } from './run';
import type { StageDef, WaveMinute } from './stages';
import { ENEMIES } from './enemies';
import { TAU } from '../core/math';
import { audio } from '../audio/audio';

export class Director {
  private acc = 0;
  private eventIdx = 0;
  private bossIdx = 0;
  private bossWarn = -1;
  bossActive = false;
  finalSpawned = false;

  constructor(private run: Run, private stage: StageDef) {}

  hpScale() {
    const t = this.run.time / 60;
    return this.stage.hpBase * (1 + t * this.stage.hpGrowth + Math.max(0, t - 10) * this.stage.hpGrowth * 0.6);
  }

  dmgScale() {
    const t = this.run.time / 60;
    return this.stage.dmgBase * (1 + t * 0.045);
  }

  wave(): WaveMinute {
    const m = Math.floor(this.run.time / 60);
    return this.stage.waves[Math.min(m, this.stage.waves.length - 1)];
  }

  /** Random point just outside the visible area, preferring free ground. */
  spawnPos(r = 14, side?: number): { x: number; y: number } {
    const v = this.run.view;
    const rng = this.run.rng;
    const m = 50 + r;
    for (let tries = 0; tries < 8; tries++) {
      const s = side ?? rng.int(0, 3);
      let x = 0, y = 0;
      const w = v.x1 - v.x0, h = v.y1 - v.y0;
      if (s === 0) { x = v.x0 + rng.next() * w; y = v.y0 - m; }
      else if (s === 1) { x = v.x1 + m; y = v.y0 + rng.next() * h; }
      else if (s === 2) { x = v.x0 + rng.next() * w; y = v.y1 + m; }
      else { x = v.x0 - m; y = v.y0 + rng.next() * h; }
      // bias slightly toward the direction the player is heading
      const p = this.run.player;
      if (rng.next() < 0.35 && (p.vx || p.vy)) {
        const a = Math.atan2(p.vy, p.vx) + (rng.next() - 0.5) * 1.2;
        const d = Math.hypot(w, h) / 2 + m;
        x = p.x + Math.cos(a) * d;
        y = p.y + Math.sin(a) * d * 0.8;
      }
      if (this.run.world.free(x, y, r)) return { x, y };
    }
    const a = rng.next() * TAU;
    return { x: this.run.player.x + Math.cos(a) * 700, y: this.run.player.y + Math.sin(a) * 500 };
  }

  update(dt: number) {
    const run = this.run;
    const t = run.time;
    if (run.finalBossDefeated) {
      // the crimes flee: everything still alive panics and runs away
      for (const e of run.enemies) if (e.alive && !e.boss && e.state !== 99) {
        e.state = 99;
        const a = Math.atan2(e.y - run.player.y, e.x - run.player.x);
        e.ax = Math.cos(a) * 320;
        e.ay = Math.sin(a) * 320;
        e.timer = 5;
      }
      return;
    }
    const w = this.wave();
    let alive = 0;
    for (const e of run.enemies) if (e.alive && !e.boss) alive++;

    // continuous spawning
    const bossCalm = this.bossActive ? 0.55 : 1;
    const cappuccinoOk = t >= 660;
    let rate = w.rate * run.stats.curse * bossCalm;
    if (alive < w.max * 0.3 && t > 20) rate *= 1.8; // keep the pressure up
    if (alive < w.max) this.acc += rate * dt;
    let guard = 0;
    while (this.acc >= 1 && guard++ < 20) {
      this.acc -= 1;
      const pool = w.pool.filter(([id]) => id !== 'cappuccino' || cappuccinoOk).map(([id, weight]) => ({ id, weight }));
      const pick = run.rng.weighted(pool);
      if (!pick) break;
      const def = ENEMIES[pick.id];
      if (!def) continue;
      // swarm types come in small clumps
      const clump = def.behavior === 'swarm' ? run.rng.int(2, 3) : 1;
      this.acc -= (clump - 1) * 0.5;
      const pos = this.spawnPos(def.radius);
      for (let i = 0; i < clump; i++) run.spawnEnemy(def, pos.x + run.rng.range(-18, 18), pos.y + run.rng.range(-18, 18));
    }

    // scripted events
    const ev = this.stage.events;
    while (this.eventIdx < ev.length && t >= ev[this.eventIdx].at) {
      this.fire(ev[this.eventIdx]);
      this.eventIdx++;
    }

    // bosses (warning 3 s before)
    const b = this.stage.bosses[this.bossIdx];
    if (b) {
      if (t >= b.at - 3 && this.bossWarn !== this.bossIdx) {
        this.bossWarn = this.bossIdx;
        run.sfx('boss_warning');
        run.hooks.onToast('⚠ ' + (ENEMIES[b.id]?.boss?.title ?? 'Boss') + ' is coming!', 'warn');
      }
      if (t >= b.at) {
        this.spawnBoss(b.id);
        this.bossIdx++;
      }
    }
    this.bossActive = run.bosses.some((e) => e.alive);
  }

  spawnBoss(id: string) {
    const run = this.run;
    const def = ENEMIES[id];
    if (!def) return;
    const pos = this.spawnPos(def.radius, run.rng.int(0, 3));
    const lvlMul = 1 + (run.level - 1) * 0.035;
    const e = run.spawnEnemy(def, pos.x, pos.y, { boss: true, hpMul: lvlMul / this.hpScale() * this.stage.hpBase * (1 + (run.time / 60) * 0.03) });
    e.spawnT = 0.6;
    const final = id === this.stage.finalBoss && run.time >= this.stage.bosses[this.stage.bosses.length - 1].at - 1;
    if (final) this.finalSpawned = true;
    run.fx.shake(0.5);
    run.sfx('boss_roar');
    run.fx.bubble(e, def.boss?.taunt ?? '!!!', -e.r * 2.3, '#ffe1d6', 2.6, true);
    if (run.fx.bubblesEnabled) audio.voice(def.boss?.taunt ?? '!!!', 'boss');
    run.schedule(2.8, () => run.say(['MAMMA MIA!', 'Non si fa!', 'Vergogna!', 'Che orrore!'], true, '#ffd0c8'));
    run.hooks.onBoss(e, final);
  }

  private fire(ev: import('./stages').StageEvent) {
    const run = this.run;
    const p = run.player;
    const def = ev.enemy ? ENEMIES[ev.enemy] : undefined;
    const v = run.view;
    const halfDiag = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) / 2;
    switch (ev.kind) {
      case 'toast':
        if (ev.text) run.hooks.onToast(ev.text, ev.text.includes('ILLEGAL') ? 'warn' : 'info');
        break;
      case 'ring': {
        if (!def) return;
        const n = ev.count ?? 20;
        const R = halfDiag * 0.82;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          run.spawnEnemy(def, p.x + Math.cos(a) * R, p.y + Math.sin(a) * R * 0.85);
        }
        run.hooks.onToast('Surrounded!', 'warn');
        break;
      }
      case 'wall': {
        if (!def) return;
        const n = ev.count ?? 16;
        const side = run.rng.sign();
        const x = p.x + side * ((v.x1 - v.x0) / 2 + 60);
        for (let i = 0; i < n; i++) run.spawnEnemy(def, x + run.rng.range(-10, 10), p.y + (i / (n - 1) - 0.5) * (v.y1 - v.y0) * 1.1);
        break;
      }
      case 'stampede': {
        if (!def) return;
        const n = ev.count ?? 20;
        const side = run.rng.sign();
        const x0 = p.x - side * ((v.x1 - v.x0) / 2 + 80);
        const speed = Math.max(220, def.speed * 2.2);
        for (let i = 0; i < n; i++) {
          const e = run.spawnEnemy(def, x0 - side * run.rng.range(0, 220), p.y + run.rng.range(-1, 1) * (v.y1 - v.y0) * 0.45);
          e.state = 99;
          e.ax = side * speed;
          e.ay = run.rng.range(-20, 20);
          e.timer = ((v.x1 - v.x0) + 600) / speed;
        }
        run.hooks.onToast('Stampede!', 'warn');
        run.sfx('elite_spawn', { volume: 0.6, pitch: 1.3 });
        break;
      }
      case 'swarm': {
        if (!def) return;
        const pos = this.spawnPos(def.radius);
        for (let i = 0; i < (ev.count ?? 12); i++) run.spawnEnemy(def, pos.x + run.rng.range(-40, 40), pos.y + run.rng.range(-40, 40));
        break;
      }
      case 'elite': {
        if (!def) return;
        const pos = this.spawnPos(def.radius * 1.5);
        const e = run.spawnEnemy(def, pos.x, pos.y, { elite: true });
        e.spawnT = 0.5;
        run.sfx('elite_spawn');
        run.hooks.onToast('An elite ' + def.name + ' appears — it carries a picnic basket!', 'info');
        break;
      }
    }
  }
}
