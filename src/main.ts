/**
 * KITCHEN FIGHT — app shell: boot, main loop, screen flow, attract mode.
 */
import '@fontsource/lobster/400.css';
import '@fontsource/lilita-one/400.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/400-italic.css';
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
    document.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
    document.addEventListener('keydown', () => audio.unlock());
    requestAnimationFrame((t) => this.frame(t));
    this.boot();
  }

  async boot() {
    const loading = this.ui.showLoading();
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
      audio.preload(['title', 'menu']).catch(() => undefined);
      this.ui.showTitle();
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
            this.bossMusic = false;
            audio.playMusic(st.music, { fade: 1.2 });
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
    this.persist();
    audio.playMusic(victory ? 'victory' : 'gameover', { fade: 0.3, restart: true });
    this.ui.showResults(run, victory, unlocks);
    this.mode = 'menu';
    this.run = null;
    this.startAttract();
  }

  toTitle() {
    this.ui.closeOverlay();
    this.ui.removeHud();
    this.run = null;
    this.mode = 'menu';
    if (!this.attract) this.startAttract();
    this.ui.showTitle();
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

/** Title-screen autopilot: dodge crimes, chase ingredients, wander. */
function autopilot(r: Run): { x: number; y: number } {
  const p = r.player;
  let ax = 0, ay = 0;
  for (const e of r.enemies) {
    if (!e.alive) continue;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > 220 * 220 || d2 < 1) continue;
    const w = 1 / d2;
    ax += dx * w * 4000;
    ay += dy * w * 4000;
  }
  let best = 1e12, tx = 0, ty = 0;
  for (const q of r.pickups) {
    if (!q.alive) continue;
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d < best && d < 340 * 340) { best = d; tx = q.x; ty = q.y; }
  }
  if (best < 1e12) {
    const d = Math.sqrt(best) || 1;
    ax += ((tx - p.x) / d) * 0.6;
    ay += ((ty - p.y) / d) * 0.6;
  }
  const wa = r.realTime * 0.25;
  ax += Math.cos(wa) * 0.35;
  ay += Math.sin(wa * 1.3) * 0.35;
  const l = Math.hypot(ax, ay) || 1;
  return { x: ax / l, y: ay / l };
}

new App();
void WEAPONS;
void spriteIds;
