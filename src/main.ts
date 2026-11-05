/**
 * KITCHEN FIGHT — app shell: boot, main loop, screen flow, attract mode.
 */
import '@fontsource/lobster/latin-400.css';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import './styles/main.css';
import './gfx/art/index';
// the audio engine registers itself (optional at dev time)
import.meta.glob('./audio/index.ts', { eager: true });
import { audio } from './audio/audio';
import { prerenderAll, spriteIds } from './gfx/sprites';
import { STAGE_ENVS } from './gfx/stageenv';
import { Input } from './core/input';
import { loadSave, writeSave, resetSave, SaveData } from './core/save';
import { Run, RunHooks } from './game/run';
import { Renderer } from './game/render';
import { UI } from './ui/ui';
import { stageById, STAGES } from './game/stages';
import { charById, CHARACTERS } from './game/passives';
import { WEAPONS, BASE_WEAPON_IDS } from './game/weapons';
import type { Enemy } from './game/entities';
import { awardMedals } from './game/medals';

class App {
  save: SaveData = loadSave();
  canvas = document.getElementById('game') as HTMLCanvasElement;
  input = new Input(this.canvas);
  renderer = new Renderer(this.canvas);
  ui = new UI(this);
  run: Run | null = null;
  attract: Run | null = null;
  mode: 'boot' | 'menu' | 'game' = 'boot';
  private last = performance.now();
  private fps = 60;
  bossMusic = false;
  private slowT = 0;
  private autoLowDone = false;

  constructor() {
    (window as any).__kf = this; // handy for debugging & automated playtests
    this.applySettings();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.run && this.run.state === 'playing') this.ui.showPause();
    });
    window.addEventListener('blur', () => {
      if (this.run && this.run.state === 'playing') this.ui.showPause();
    });
    // the canvas swallows touches for the joystick; UI elements sit above it
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    // (re)unlock audio on any user gesture — iOS Safari needs touchend/click
    for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(ev, () => audio.unlock(), { passive: true });
    requestAnimationFrame((t) => this.frame(t));
    this.boot();
  }

  async boot() {
    const loading = this.ui.showLoading();
    // music renders in a worker and can start before the first gesture
    audio.preload(['title', 'menu']).catch(() => undefined);
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
      await Promise.all([
        document.fonts.load("20px 'Lilita One'"),
        document.fonts.load("20px 'Lobster'"),
      ]).catch(() => undefined);
    } catch {
      /* fonts are optional */
    }
    await prerenderAll(['chef.', 'enemy.', 'proj.', 'pickup.', 'fx.', 'icon.', 'ui.'], (p) => loading.set(p * 0.9));
    loading.set(1);
    this.mode = 'menu';
    this.startAttract();
    loading.done(() => {
      audio.unlock();
      this.applySettings();
      this.ui.showTitle();
      audio.preload(['kitchen']).catch(() => undefined);
    });
  }

  persist() {
    writeSave(this.save);
  }

  applySettings() {
    const s = this.save.settings;
    audio.setVolumes(s.master, s.music, s.sfx);
    if (this.renderer.quality !== s.quality) {
      this.renderer.quality = s.quality;
      this.renderer.resize();
    }
    for (const r of [this.run, this.attract]) {
      if (!r) continue;
      r.fx.shakeEnabled = s.shake;
      r.fx.flashesEnabled = s.flashes;
      r.fx.numbersEnabled = s.damageNumbers;
      r.fx.bubblesEnabled = s.bubbles;
    }
  }

  toggleFullscreen() {
    const d = document as any;
    if (!document.fullscreenElement) (document.documentElement.requestFullscreen?.() ?? d.webkitRequestFullscreen?.call(document.documentElement))?.catch?.(() => undefined);
    else document.exitFullscreen?.().catch(() => undefined);
  }

  resetSave() {
    this.save = resetSave();
    this.ui = new UI(this);
    this.applySettings();
    this.toTitle();
  }

  // ------------------------------------------------------------------ attract mode (title background)

  startAttract() {
    const stages = STAGES.filter((s) => this.save.unlockedStages.includes(s.id));
    const st = stages[Math.floor(Math.random() * stages.length)] ?? STAGES[0];
    const chars = CHARACTERS.filter((c) => this.save.unlockedChars.includes(c.id));
    const ch = chars[Math.floor(Math.random() * chars.length)] ?? CHARACTERS[0];
    const dummySave: SaveData = JSON.parse(JSON.stringify(this.save));
    dummySave.powerups = {};
    let r: Run;
    const hooks: RunHooks = {
      onLevelUp: () => {
        const c = r.rollChoices(3);
        r.applyChoice(c[Math.floor(Math.random() * c.length)]);
        r.pendingLevels = 0;
        r.state = 'playing';
      },
      onChest: () => {
        r.state = 'playing';
      },
      onBoss: () => undefined,
      onBossDefeated: () => undefined,
      onGameOver: () => this.startAttract(),
      onVictory: () => this.startAttract(),
      onRevive: () => undefined,
      onToast: () => undefined,
    };
    r = new Run(st, ch, dummySave, hooks);
    r.fx.bubblesEnabled = false;
    // a little spectacle: a few extra weapons
    const extra = BASE_WEAPON_IDS.filter((id) => id !== ch.weapon).sort(() => Math.random() - 0.5).slice(0, 3);
    for (const id of extra) r.addWeapon(id);
    for (const w of r.weapons) w.level = 3 + Math.floor(Math.random() * 4);
    r.time = 60 + Math.random() * 180;
    r.autopilot = autopilot;
    this.attract = r;
    this.renderer.updateCamera(r, 0, true);
  }

  // ------------------------------------------------------------------ runs

  startRun(charId: string, stageId: string) {
    const st = stageById(stageId);
    const ch = charById(charId);
    this.attract = null;
    this.ui.clearScreen();
    this.ui.closeOverlay();
    // warm up this stage's art (tiles, props, bosses) before the first frame
    const env = STAGE_ENVS[st.env];
    const prefixes = ['tile.' + st.env, 'prop.' + st.env, 'prop.common', ...st.bosses.map((b) => b.id.replace('b_', 'boss.'))];
    void env;
    prerenderAll(prefixes).then(() => {
      const hooks: RunHooks = {
        onLevelUp: () => this.ui.showLevelUp(run),
        onChest: (rewards, gold) => this.ui.showChest(run, rewards, gold),
        onBoss: (e: Enemy, final: boolean) => {
          this.bossMusic = true;
          audio.playMusic(final ? 'finalboss' : 'boss', { fade: 0.6 });
          this.ui.banner(e.def.boss?.title ?? e.def.name, final ? 'FINAL BOSS — defeat it to win!' : 'BOSS', true);
        },
        onBossDefeated: (e: Enemy, final: boolean) => {
          this.ui.toast((e.def.boss?.title ?? e.def.name) + ' defeated! Perfetto!', 'good');
          if (!final) {
            if (!run.bosses.some((b) => b.alive && b !== e)) {
              this.bossMusic = false;
              audio.playMusic(st.music, { fade: 1.2 });
            }
          } else {
            this.ui.banner('Vittoria!', 'Tradition is safe', false);
          }
        },
        onGameOver: () => this.finishRun(false),
        onVictory: () => this.finishRun(true),
        onRevive: () => this.ui.toast('Bis! A second helping of life.', 'good'),
        onToast: (t, k) => this.ui.toast(t, k),
      };
      const run = new Run(st, ch, this.save, hooks);
      audio.setMusicMuffled(false);
      this.run = run;
      this.mode = 'game';
      this.bossMusic = false;
      this.ui.buildHud(run);
      this.renderer.updateCamera(run, 0, true);
      audio.playMusic(st.music, { fade: 0.8 });
      audio.preload(['boss', 'finalboss', 'victory', 'gameover']).catch(() => undefined);
      setTimeout(() => {
        if (this.run === run) {
          run.fx.bubble(run.player, ['Andiamo!', 'Forza!', 'Al lavoro!', 'Pronti!'][Math.floor(Math.random() * 4)], -78, '#fff3d6', 1.8);
          audio.voice('Andiamo!', ch.voice);
        }
      }, 400);
      this.ui.banner(st.name, st.subtitle + ' — survive 15:00');
      if (this.save.runs === 0) {
        const touch = matchMedia('(pointer: coarse)').matches;
        const tips: [number, string][] = [
          [2.6, touch ? 'Drag anywhere to move. Your weapons fire on their own!' : 'Move with WASD or the arrow keys. Your weapons fire on their own!'],
          [8, 'Collect basil, cherry tomatoes and mozzarella to level up.'],
          [16, 'Smash crates and flour sacks — they hide food and coins.'],
          [26, 'Max a weapon + own its ingredient, then open a picnic basket to EVOLVE it.'],
        ];
        for (const [t, msg] of tips) setTimeout(() => { if (this.run === run && run.state !== 'dead') this.ui.toast(msg, 'info'); }, t * 1000);
      }
    });
  }

  resumeRun() {
    if (this.run && this.run.state === 'paused') this.run.state = 'playing';
  }

  quitRun() {
    if (!this.run) return;
    this.finishRun(false);
  }

  finishRun(victory: boolean) {
    const run = this.run;
    if (!run) return;
    run.state = victory ? 'victory' : 'dead';
    const prev = this.save.records[run.stage.id];
    const newRecord = !prev || run.time > prev.bestTime + 0.5;
    run.commitResults(victory);
    const unlocks: { icon: string; text: string }[] = [];
    if (victory) {
      for (const s of STAGES) {
        if (s.unlockAfter === run.stage.id && !this.save.unlockedStages.includes(s.id)) {
          this.save.unlockedStages.push(s.id);
          unlocks.push({ icon: 'icon.star', text: `New kitchen unlocked: ${s.name}!` });
        }
      }
    }
    for (const c of CHARACTERS) {
      if (this.save.unlockedChars.includes(c.id) || !c.unlock?.check) continue;
      if (c.unlock.check(this.save)) {
        this.save.unlockedChars.push(c.id);
        unlocks.push({ icon: c.sprite, text: `New chef unlocked: ${c.name}, ${c.title}!` });
      }
    }
    for (const m of awardMedals(this.save, run, victory)) unlocks.push({ icon: m.icon, text: `Medal: ${m.name} — ${m.desc}` });
    this.persist();
    audio.setMusicMuffled(false);
    audio.playMusic(victory ? 'victory' : 'gameover', { fade: 0.3, restart: true });
    this.ui.showResults(run, victory, unlocks, newRecord && run.time > 30);
    this.mode = 'menu';
    this.run = null;
    this.startAttract();
  }

  toTitle() {
    audio.setMusicMuffled(false);
    this.ui.closeOverlay();
    this.ui.removeHud();
    this.run = null;
    this.mode = 'menu';
    if (!this.attract) this.startAttract();
    this.ui.showTitle();
  }

  // ------------------------------------------------------------------ headless balance simulation (dev)

  /** Simulate a run with a bot (no rendering). Returns per-minute stats. */
  simulate(stageId: string, charId: string, seconds = 900, skill = 1) {
    const st = stageById(stageId);
    const ch = charById(charId);
    const save: SaveData = JSON.parse(JSON.stringify(this.save));
    let r!: Run;
    let dead = false, won = false;
    const pick = () => {
      const cs = r.rollChoices(r.choiceCount());
      const score = (c: import('./game/run').Choice) => {
        let v = Math.random();
        if (c.type === 'weapon') v += c.isNew ? (r.weapons.length < 4 ? 6 : -5) : 7.5;
        if (c.type === 'passive') {
          v += r.weapons.some((w) => w.def.evolve?.passive === c.id) ? 8 : 2;
          if (['olio', 'espresso', 'sanmarzano', 'grembiule', 'macinapepe', 'minestrone'].includes(c.id)) v += 2.5;
        }
        return v;
      };
      cs.sort((a, b) => score(b) - score(a));
      r.applyChoice(cs[0]);
    };
    const hooks: RunHooks = {
      onLevelUp: () => {
        while (r.pendingLevels > 0) { pick(); r.pendingLevels--; }
        r.state = 'playing';
      },
      onChest: () => { r.state = 'playing'; },
      onBoss: () => undefined,
      onBossDefeated: () => undefined,
      onGameOver: () => { dead = true; },
      onVictory: () => { won = true; },
      onRevive: () => undefined,
      onToast: () => undefined,
    };
    r = new Run(st, ch, save, hooks);
    r.fx.numbersEnabled = false;
    r.autopilot = (rr) => {
      const a = autopilot(rr);
      return skill >= 1 ? a : { x: a.x * skill, y: a.y * skill };
    };
    const dt = 1 / 30;
    const snaps: any[] = [];
    let nextSnap = 60;
    const t0 = performance.now();
    while (!dead && !won && r.time < seconds) {
      const p = r.player;
      r.view.x0 = p.x - 550; r.view.x1 = p.x + 550; r.view.y0 = p.y - 310; r.view.y1 = p.y + 310;
      r.world.update(r.view.x0, r.view.y0, r.view.x1, r.view.y1, dt);
      r.update(dt);
      if (r.state === 'dying') { for (let i = 0; i < 100 && r.state === 'dying'; i++) r.update(0.05); }
      if (r.time >= nextSnap) {
        nextSnap += 60;
        snaps.push({ m: Math.round(r.time / 60), lvl: r.level, hp: Math.round(p.hp), maxHp: Math.round(r.stats.maxHp), kills: r.kills, alive: r.enemies.length, weapons: r.weapons.map((w) => w.def.id + ':' + w.level).join(' '), passives: r.passives.map((q) => q.id + ':' + q.level).join(' '), bosses: r.bosses.filter((b) => b.alive).map((b) => b.def.id + ' ' + Math.round((b.hp / b.maxHp) * 100) + '%').join(',') });
      }
    }
    return { stage: stageId, char: charId, time: Math.round(r.time), dead, won, level: r.level, kills: r.kills, coins: r.coins, evolutions: r.evolutionsDone, ms: Math.round(performance.now() - t0), snaps, dmgTaken: Math.round(r.damageTaken), dmgBy: Object.fromEntries(Object.entries(r.dmgBy).map(([k, v]) => [k, Math.round(v)])), wdmg: r.weapons.map((w) => w.def.id + ':' + Math.round(w.damageDealt)).join(' ') };
  }

  // ------------------------------------------------------------------ loop

  frame(now: number) {
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    if (dt > 0) this.fps += (1 / dt - this.fps) * 0.05;
    const step = Math.min(dt, 1 / 30);
    const inp = this.input;
    inp.update(dt);
    const run = this.run;
    if (this.mode === 'game' && run) {
      const overlay = !!this.ui.overlay;
      inp.joystickEnabled = !overlay && run.state === 'playing';
      if (overlay) this.ui.handleInput(inp);
      else if (inp.consume('pause') && run.state === 'playing') this.ui.showPause();
      run.input = inp;
      // auto performance mode on slow devices
      if (!this.autoLowDone && run.state === 'playing' && this.save.settings.quality === 'high') {
        this.slowT = this.fps < 36 ? this.slowT + dt : Math.max(0, this.slowT - dt * 2);
        if (this.slowT > 5) {
          this.autoLowDone = true;
          this.save.settings.quality = 'low';
          this.applySettings();
          this.persist();
          this.ui.toast('Performance mode on — change it in Settings.', 'info');
        }
      }
      this.renderer.updateCamera(run, step);
      run.update(step);
      this.renderer.render(run, step, inp);
      this.ui.updateHud(run, this.fps);
    } else {
      inp.joystickEnabled = false;
      this.ui.handleInput(inp);
      const a = this.attract;
      if (a) {
        a.player.hp = a.stats.maxHp;
        a.player.iframes = 1;
        this.renderer.updateCamera(a, step);
        a.update(step);
        this.renderer.render(a, step, null);
      } else {
        const c = this.renderer.ctx;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.fillStyle = '#1a0f0b';
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    inp.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }
}

/** Autopilot (title screen + balance sims): circle-strafe crowds, dodge, grab ingredients. */
function autopilot(r: Run): { x: number; y: number } {
  const p = r.player;
  let ax = 0, ay = 0;
  let cx = 0, cy = 0, n = 0;
  for (const e of r.enemies) {
    if (!e.alive) continue;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < 380 * 380) { cx += e.x; cy += e.y; n++; }
    const danger = e.boss ? 170 : 75 + e.r;
    if (d2 > danger * danger || d2 < 1) continue;
    const d = Math.sqrt(d2);
    const w = (danger - d) / danger;
    ax += (dx / d) * w * 3.2;
    ay += (dy / d) * w * 3.2;
  }
  for (const s of r.shots) {
    if (!s.alive) continue;
    const dx = p.x - s.x, dy = p.y - s.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 160 * 160 || d2 < 1) continue;
    // will it hit? closest approach along its path
    const sv = Math.hypot(s.vx, s.vy) || 1;
    const ux = s.vx / sv, uy = s.vy / sv;
    const along = dx * ux + dy * uy;
    if (along < 0) continue;
    const px = dx - ux * along, py = dy - uy * along; // perpendicular offset from the path
    const miss = Math.hypot(px, py);
    if (miss > 34) continue;
    const k = (34 - miss) / 34 * 2.6;
    const pl = miss > 0.5 ? 1 / miss : 0;
    ax += (px * pl || -uy) * k;
    ay += (py * pl || ux) * k;
  }
  for (const e of r.enemies) {
    if (!e.alive || e.telegraph <= 0 || e.def.behavior !== 'charger') continue;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 320) continue;
    ax += (-dy / d) * 2.2;
    ay += (dx / d) * 2.2;
  }
  if (n) {
    cx /= n; cy /= n;
    const dx = p.x - cx, dy = p.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const want = 150;
    const radial = (want - d) / want;
    ax += (dx / d) * radial * 1.2 + (-dy / d) * 0.9;
    ay += (dy / d) * radial * 1.2 + (dx / d) * 0.9;
  }
  let best = 1e12, tx = 0, ty = 0;
  const hurt = p.hp < r.stats.maxHp * 0.6;
  for (const q of r.pickups) {
    if (!q.alive) continue;
    let d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (hurt && (q.kind === 'cannolo' || q.kind === 'lasagna')) d *= 0.1;
    if (q.kind === 'chest') d *= 0.3;
    if (d < best && d < 260 * 260) { best = d; tx = q.x; ty = q.y; }
  }
  if (hurt && best > 120 * 120) {
    for (const pr of r.world.visible) {
      if (!pr.breakable || pr.hp <= 0) continue;
      const d = ((pr.x - p.x) ** 2 + (pr.y - p.y) ** 2) * 0.5;
      if (d < best) { best = d; tx = pr.x; ty = pr.y; }
    }
  }
  if (best < 1e12) {
    const d = Math.sqrt(best) || 1;
    ax += ((tx - p.x) / d) * 0.8;
    ay += ((ty - p.y) / d) * 0.8;
  }
  if (!n) {
    const wa = r.realTime * 0.25;
    ax += Math.cos(wa) * 0.5;
    ay += Math.sin(wa * 1.3) * 0.5;
  }
  const l = Math.hypot(ax, ay);
  if (l < 0.05) return { x: 0, y: 0 };
  return { x: ax / l, y: ay / l };
}

new App();
void WEAPONS;
void spriteIds;
