/**
 * All DOM screens: title, character & stage select, HUD, level-up, chest,
 * pause, results, pantry shop, collection, settings, credits.
 */
import { h, img, Nav } from './dom';
import { spriteURL, hasSprite } from '../gfx/sprites';
import { audio } from '../audio/audio';
import { WEAPONS } from '../game/weapons';
import { PASSIVES, POWERUPS, CHARACTERS, powerupCost, charById } from '../game/passives';
import { ENEMIES, REGULAR_ENEMY_IDS, BOSS_IDS } from '../game/enemies';
import { STAGES, stageById } from '../game/stages';
import type { Run, Choice, ChestReward } from '../game/run';
import type { Enemy } from '../game/entities';
import type { SaveData } from '../core/save';
import { formatTime, clamp } from '../core/math';
import { renderStagePreview } from './preview';
import { MEDALS } from '../game/medals';
import type { Input } from '../core/input';

export interface AppAPI {
  save: SaveData;
  run: Run | null;
  input: Input;
  persist(): void;
  applySettings(): void;
  startRun(charId: string, stageId: string): void;
  resumeRun(): void;
  quitRun(): void;
  toTitle(): void;
  resetSave(): void;
  toggleFullscreen(): void;
}

function icon(id: string): string {
  if (hasSprite(id)) return spriteURL(id);
  return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="%23e8d5b0" stroke="%232b1712" stroke-width="3"/><text x="20" y="27" font-size="20" text-anchor="middle" fill="%232b1712">?</text></svg>');
}

const COIN = () => icon('icon.coin');

export class UI {
  root: HTMLElement;
  nav = new Nav();
  screen: HTMLElement | null = null;
  overlay: HTMLElement | null = null; // modal over game
  hud: HTMLElement | null = null;
  private hudRefs: any = {};
  private toastsEl: HTMLElement | null = null;
  private lastHud: Record<string, any> = {};
  private selectedChar = 'enzo';
  private selectedStage = 'kitchen';
  private levelBanish = false;
  private bossTracked: Enemy | null = null;
  current = '';

  constructor(public app: AppAPI) {
    this.root = document.getElementById('ui')!;
    this.selectedChar = app.save.lastChar;
    this.selectedStage = app.save.lastStage;
  }

  // ------------------------------------------------------------------ infra

  private show(el: HTMLElement, name: string, onBack: (() => void) | null = null) {
    this.screen?.remove();
    this.screen = el;
    this.current = name;
    this.root.appendChild(el);
    this.nav.setRoot(el, onBack);
  }

  private showOverlay(el: HTMLElement, name: string, onBack: (() => void) | null = null) {
    this.overlay?.remove();
    this.overlay = el;
    this.current = name;
    this.root.appendChild(el);
    this.nav.setRoot(el, onBack);
  }

  closeOverlay() {
    this.overlay?.remove();
    this.overlay = null;
    this.current = 'game';
    this.nav.setRoot(null);
  }

  clearScreen() {
    this.screen?.remove();
    this.screen = null;
  }

  /** route edge-triggered input to the active screen */
  handleInput(inp: Input) {
    if (inp.consume('up')) this.nav.move(0, -1);
    if (inp.consume('down')) this.nav.move(0, 1);
    if (inp.consume('left')) { if (!this.nav.adjust(-1)) this.nav.move(-1, 0); }
    if (inp.consume('right')) { if (!this.nav.adjust(1)) this.nav.move(1, 0); }
    if (inp.consume('confirm')) this.nav.activate();
    if (inp.consume('back')) {
      if (this.nav.onBack) {
        audio.sfx('ui_back');
        this.nav.onBack();
      }
    }
    if (this.current === 'levelup') {
      if (inp.consume('reroll')) (this.overlay?.querySelector('[data-act=reroll]') as HTMLElement | null)?.click();
      if (inp.consume('skip')) (this.overlay?.querySelector('[data-act=skip]') as HTMLElement | null)?.click();
      if (inp.consume('banish')) (this.overlay?.querySelector('[data-act=banish]') as HTMLElement | null)?.click();
    }
  }

  private btn(label: string | Node, cls: string, onClick: () => void, sub?: string, attrs: Record<string, any> = {}) {
    const b = h('button', { class: 'btn ' + cls, 'data-nav': '', ...attrs }, label);
    if (sub) b.appendChild(h('div', { style: { fontSize: '12px', opacity: '0.8', marginTop: '1px' } }, sub));
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (b.hasAttribute('disabled')) {
        audio.sfx('ui_error');
        return;
      }
      audio.sfx('ui_click');
      onClick();
    });
    return b;
  }

  private coinsPill() {
    return h('div', { class: 'coins-pill corner-tr' }, img(COIN()), String(this.app.save.coins));
  }

  // ------------------------------------------------------------------ loading

  showLoading(): { set(p: number, msg?: string): void; done(onStart: () => void): void } {
    const fill = h('i');
    const msg = h('div', { class: 'msg' }, 'Preheating the oven…');
    const el = h('div', { class: 'screen solid loading' },
      h('div', { class: 'logo', style: { fontSize: 'clamp(48px,9vw,96px)' } }, h('span', { class: 'k' }, 'Kitchen '), h('span', { class: 'f' }, 'Fight!')),
      h('div', { class: 'bar' }, fill),
      msg,
    );
    this.show(el, 'loading');
    const lines = ['Preheating the oven…', 'Grating the Parmigiano…', 'Hiding the pineapple…', 'Salting the pasta water…', 'Confiscating the ketchup…', 'Waking up Nonna…'];
    return {
      set: (p, m) => {
        fill.style.width = Math.round(p * 100) + '%';
        msg.textContent = m ?? lines[Math.min(lines.length - 1, Math.floor(p * lines.length))];
      },
      done: (onStart) => {
        fill.style.width = '100%';
        msg.textContent = 'Pronto! The kitchen is open.';
        const press = h('div', { class: 'press-start' }, 'Click, tap or press any key');
        el.appendChild(press);
        let fired = false;
        const go = (ev?: Event) => {
          if (fired) return;
          if (ev && ev instanceof KeyboardEvent && (ev.key === 'F5' || ev.key === 'F12')) return;
          fired = true;
          window.removeEventListener('keydown', go);
          window.removeEventListener('pointerdown', go);
          window.removeEventListener('touchstart', go);
          onStart();
        };
        window.addEventListener('keydown', go);
        window.addEventListener('pointerdown', go);
        window.addEventListener('touchstart', go);
      },
    };
  }

  // ------------------------------------------------------------------ title

  showTitle() {
    const s = this.app.save;
    const el = h('div', { class: 'screen dim title' },
      this.coinsPill(),
      h('div', { class: 'title-wrap' },
        hasSprite('ui.emblem') ? img(spriteURL('ui.emblem'), 'emblem') : null,
        h('div', { class: 'logo' }, h('span', { class: 'k' }, 'Kitchen '), h('span', { class: 'f' }, 'Fight!')),
        h('div', { class: 'tagline' }, 'Difendi la Tradizione!'),
      ),
      h('div', { class: 'menu-col' },
        this.btn('Gioca!', 'big', () => this.showCharSelect(), 'Play', { 'data-nav-default': '' }),
        this.btn('La Dispensa', 'green', () => this.showShop(), 'Pantry · Power-ups'),
        this.btn('Il Ricettario', 'gold', () => this.showCollection(), 'Book of Crimes'),
        h('div', { style: { display: 'flex', gap: '12px' } },
          this.btn('Opzioni', 'cream', () => this.showSettings(() => this.showTitle()), 'Settings', { style: 'flex:1' }),
          this.btn('Crediti', 'cream', () => this.showCredits(), 'Credits', { style: 'flex:1' }),
        ),
      ),
      h('div', { class: 'foot-note' }, `WASD / arrows to move · Esc to pause · Gamepad & touch supported · Runs: ${s.runs} · Wins: ${s.wins}`),
    );
    this.show(el, 'title');
    audio.playMusic('title');
  }

  // ------------------------------------------------------------------ character select

  isCharUnlocked(id: string) {
    return this.app.save.unlockedChars.includes(id);
  }

  private storySeen = false;

  showStory(next: () => void) {
    this.storySeen = true;
    const lineup = ['enemy.ananas', 'enemy.panna', 'enemy.ketchup', 'enemy.forbici', 'enemy.spezzato', 'enemy.cappuccino', 'enemy.polpetta']
      .filter((id) => hasSprite(id))
      .map((id) => img(spriteURL(id)));
    const row = h('div', { class: 'story-lineup' }, lineup);
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper panel story', style: { width: 'min(720px,94vw)' } },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-body' },
          h('div', { class: 'story-kicker' }, 'Napoli, oggi.'),
          h('p', {}, 'The internet has unleashed a plague of ', h('b', {}, 'culinary crimes'), ': cream in the carbonara, pineapple on the pizza, ketchup on the spaghetti, cappuccino after lunch…'),
          row,
          h('p', {}, 'They crawled out of viral videos and now they are marching on the kitchens of Italy. Only one brigade stands in their way.'),
          h('p', { class: 'story-quote' }, '«Non si fa!» — Nonna'),
        ),
        h('div', { class: 'panel-foot' }, this.btn('Andiamo! ▶', 'big green', next, "Let's go", { 'data-nav-default': '' })),
      ),
    );
    this.show(el, 'story', next);
  }

  showCharSelect() {
    if (this.app.save.runs === 0 && !this.storySeen) {
      this.showStory(() => this.showCharSelect());
      return;
    }
    if (!this.isCharUnlocked(this.selectedChar)) this.selectedChar = 'enzo';
    const detail = h('div', { class: 'char-detail' });
    const grid = h('div', { class: 'char-grid' });
    const nextBtn = this.btn('Avanti ▶', 'big green', () => {
      if (!this.isCharUnlocked(this.selectedChar)) {
        audio.sfx('ui_error');
        return;
      }
      this.showStageSelect();
    }, 'Choose kitchen');
    const renderDetail = (id: string) => {
      const c = charById(id);
      const unlocked = this.isCharUnlocked(id);
      const w = WEAPONS[c.weapon];
      detail.innerHTML = '';
      detail.append(
        img(hasSprite(c.portrait) ? spriteURL(c.portrait) : icon(c.sprite), 'port'),
        h('div', {},
          h('h3', {}, unlocked ? c.name : '???'),
          h('div', { class: 'tag' }, c.title),
          h('p', { class: 'bio' }, unlocked ? c.bio : 'Locked — ' + (c.unlock?.text ?? '')),
          h('div', { class: 'kv' }, 'Starts with', img(icon(w.icon)), h('b', {}, w.name)),
          h('div', { class: 'kv' }, 'Bonus:', h('span', { class: 'tag green' }, c.bonusText)),
          !unlocked && c.unlock ? h('div', { class: 'kv lock-note' }, '🔒 ' + c.unlock.text) : null,
        ),
      );
      if (!unlocked) (detail.querySelector('img.port') as HTMLImageElement).style.filter = 'brightness(0) opacity(0.55)';
      nextBtn.toggleAttribute('disabled', !unlocked);
    };
    for (const c of CHARACTERS) {
      const unlocked = this.isCharUnlocked(c.id);
      const card = h('div', { class: 'char-card' + (unlocked ? '' : ' locked') + (c.id === this.selectedChar ? ' selected' : ''), 'data-nav': '', ...(c.id === this.selectedChar ? { 'data-nav-default': '' } : {}) },
        img(icon(c.sprite)),
        h('div', { class: 'nm' }, unlocked ? c.name : '???'),
        h('div', { class: 'tt' }, c.title),
      );
      const select = () => {
        this.selectedChar = c.id;
        grid.querySelectorAll('.char-card').forEach((x) => x.classList.remove('selected'));
        card.classList.add('selected');
        renderDetail(c.id);
      };
      card.addEventListener('navfocus', select);
      card.addEventListener('click', () => {
        select();
        if (unlocked) {
          audio.sfx('ui_confirm');
          this.showStageSelect();
        } else audio.sfx('ui_error');
      });
      grid.appendChild(card);
    }
    renderDetail(this.selectedChar);
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper panel' },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-head' }, h('h2', {}, 'Scegli il tuo Chef'), h('span', { class: 'sub' }, 'Choose your chef')),
        h('div', { class: 'panel-body' }, grid, detail),
        h('div', { class: 'panel-foot' }, this.btn('◀ Indietro', 'cream', () => this.showTitle(), 'Back'), nextBtn),
      ),
    );
    this.show(el, 'charselect', () => this.showTitle());
    audio.playMusic('menu');
  }

  // ------------------------------------------------------------------ stage select

  isStageUnlocked(id: string) {
    return this.app.save.unlockedStages.includes(id);
  }

  showStageSelect() {
    const grid = h('div', { class: 'stage-grid' });
    if (!this.isStageUnlocked(this.selectedStage)) this.selectedStage = 'kitchen';
    const char = charById(this.selectedChar);
    for (const st of STAGES) {
      const unlocked = this.isStageUnlocked(st.id);
      const rec = this.app.save.records[st.id];
      const cv = h('canvas', { width: 460, height: 260 }) as HTMLCanvasElement;
      const card = h('div', { class: 'stage-card' + (unlocked ? '' : ' locked'), 'data-nav': '', ...(st.id === this.selectedStage ? { 'data-nav-default': '' } : {}) },
        cv,
        h('div', { class: 'info' },
          h('div', { class: 'num' }, `Stage ${st.num} · ${st.subtitle}`),
          h('h3', {}, st.name),
          h('p', {}, st.desc),
          unlocked
            ? h('div', { class: 'rec' },
                h('span', { class: 'tag' }, '⏱ ' + formatTime(rec?.bestTime ?? 0)),
                h('span', { class: 'tag green' }, '🏆 ' + (rec?.wins ?? 0)),
                h('span', { class: 'tag red' }, '🍴 ' + (rec?.bestKills ?? 0)),
              )
            : h('div', { class: 'lock-note' }, '🔒 Win ' + stageById(st.unlockAfter ?? 'kitchen').name + ' to unlock'),
        ),
      );
      setTimeout(() => renderStagePreview(cv, st, char.sprite), 0);
      card.addEventListener('navfocus', () => (this.selectedStage = st.id));
      card.addEventListener('click', () => {
        if (!unlocked) {
          audio.sfx('ui_error');
          return;
        }
        audio.sfx('ui_confirm');
        this.selectedStage = st.id;
        this.app.save.lastChar = this.selectedChar;
        this.app.save.lastStage = st.id;
        this.app.persist();
        this.app.startRun(this.selectedChar, st.id);
      });
      grid.appendChild(card);
    }
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper panel' },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-head' }, h('h2', {}, 'Scegli la Cucina'), h('span', { class: 'sub' }, `Chef: ${char.name} — choose where to fight`)),
        h('div', { class: 'panel-body' }, grid),
        h('div', { class: 'panel-foot' }, this.btn('◀ Indietro', 'cream', () => this.showCharSelect(), 'Back')),
      ),
    );
    this.show(el, 'stageselect', () => this.showCharSelect());
  }

  // ------------------------------------------------------------------ HUD

  buildHud(run: Run) {
    this.clearScreen();
    this.hud?.remove();
    const xpFill = h('div', { class: 'fill' });
    const lv = h('div', { class: 'lv' }, 'LV 1');
    const timer = h('div', { class: 'hud-timer' }, '00:00');
    const kills = h('span', {}, '0');
    const coins = h('span', {}, '0');
    const wslots = h('div', { class: 'slots' });
    const pslots = h('div', { class: 'slots' });
    const bossName = h('div', { class: 'nm' }, '');
    const bossFill = h('i');
    const boss = h('div', { class: 'boss-bar hidden' }, bossName, h('div', { class: 'bar' }, bossFill));
    const toasts = h('div', { class: 'toasts' });
    const fps = h('div', { class: 'fps hidden' }, '');
    const pause = h('button', { class: 'btn dark icon-btn hud-pause' }, '❚❚');
    pause.addEventListener('click', (e) => {
      e.stopPropagation();
      this.app.input.releaseTouch();
      this.showPause();
    });
    pause.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    const hud = h('div', { id: 'hud' },
      h('div', { class: 'xpbar' }, xpFill, lv),
      timer,
      h('div', { class: 'hud-left' }, wslots, pslots),
      h('div', { class: 'hud-right' },
        h('div', { class: 'hud-stat' }, img(icon('icon.kill')), kills),
        h('div', { class: 'hud-stat' }, img(COIN()), coins),
      ),
      boss,
      toasts,
      pause,
      fps,
    );
    if (matchMedia('(pointer: coarse)').matches) hud.classList.add('touch');
    this.root.appendChild(hud);
    this.hud = hud;
    this.toastsEl = toasts;
    this.hudRefs = { xpFill, lv, timer, kills, coins, wslots, pslots, boss, bossName, bossFill, fps };
    this.lastHud = {};
    this.bossTracked = null;
  }

  removeHud() {
    this.hud?.remove();
    this.hud = null;
  }

  updateHud(run: Run, fps: number) {
    const r = this.hudRefs;
    if (!this.hud) return;
    const L = this.lastHud;
    const xpk = clamp(run.xp / run.xpNext, 0, 1);
    const xpPct = Math.round(xpk * 1000) / 10;
    if (L.xp !== xpPct) { r.xpFill.style.width = xpPct + '%'; L.xp = xpPct; }
    if (L.lv !== run.level) { r.lv.textContent = 'LV ' + run.level; L.lv = run.level; }
    const ts = formatTime(run.time);
    if (L.t !== ts) {
      r.timer.textContent = ts;
      L.t = ts;
      r.timer.classList.toggle('urgent', run.time > 840 && run.time < 900);
    }
    if (L.k !== run.kills) { r.kills.textContent = String(run.kills); L.k = run.kills; }
    if (L.c !== run.coins) { r.coins.textContent = String(run.coins); L.c = run.coins; }
    const wsig = run.weapons.map((w) => w.def.id + w.level).join(',') + '|' + run.passives.map((p) => p.id + p.level).join(',');
    if (L.w !== wsig) {
      L.w = wsig;
      r.wslots.innerHTML = '';
      for (let i = 0; i < run.maxWeapons; i++) {
        const w = run.weapons[i];
        r.wslots.appendChild(w
          ? h('div', { class: 'slot' + (w.def.evolution ? ' evo' : ''), title: w.def.name }, img(icon(w.def.icon)), h('span', { class: 'lvl' }, w.def.evolution ? '★' : String(w.level)))
          : h('div', { class: 'slot empty' }));
      }
      r.pslots.innerHTML = '';
      for (let i = 0; i < run.maxPassives; i++) {
        const p = run.passives[i];
        r.pslots.appendChild(p
          ? h('div', { class: 'slot passive', title: PASSIVES[p.id].name }, img(icon(PASSIVES[p.id].icon)), h('span', { class: 'lvl' }, String(p.level)))
          : h('div', { class: 'slot passive empty' }));
      }
    }
    // boss bar
    const b = run.bosses.find((e) => e.alive) ?? null;
    if (b !== this.bossTracked) {
      this.bossTracked = b;
      r.boss.classList.toggle('hidden', !b);
      if (b) r.bossName.textContent = b.def.boss?.title ?? b.def.name;
    }
    if (b) {
      const pct = Math.round(clamp(b.hp / b.maxHp, 0, 1) * 1000) / 10;
      if (L.b !== pct) { r.bossFill.style.width = pct + '%'; L.b = pct; }
    }
    if (this.app.save.settings.showFps) {
      r.fps.classList.remove('hidden');
      if ((L.fpsT = (L.fpsT ?? 0) + 1) % 20 === 0) r.fps.textContent = `${fps.toFixed(0)} fps · ${run.enemies.length} crimes · ${run.projectiles.length} proj`;
    } else r.fps.classList.add('hidden');
  }

  toast(text: string, kind: 'info' | 'warn' | 'good' = 'info') {
    if (!this.toastsEl) return;
    const t = h('div', { class: 'toast ' + kind }, text);
    this.toastsEl.appendChild(t);
    while (this.toastsEl.children.length > 3) this.toastsEl.firstChild?.remove();
    setTimeout(() => t.remove(), 3700);
  }

  banner(text: string, sub = '', boss = false) {
    if (!this.hud) return;
    const b = h('div', { class: 'big-banner' + (boss ? ' boss' : '') }, text, sub ? h('small', {}, sub) : null);
    this.hud.appendChild(b);
    setTimeout(() => b.remove(), 2500);
  }

  // ------------------------------------------------------------------ level up

  showLevelUp(run: Run) {
    audio.setMusicMuffled(true);
    this.levelBanish = false;
    const choices = run.rollChoices(run.choiceCount());
    this.renderLevelUp(run, choices);
  }

  private renderLevelUp(run: Run, choices: Choice[]) {
    const wrap = h('div', { class: 'choices' });
    choices.forEach((c, i) => {
      const card = this.choiceCard(run, c);
      if (i === 0) card.setAttribute('data-nav-default', '');
      card.addEventListener('click', () => {
        if (this.levelBanish && c.type !== 'coins' && c.type !== 'heal') {
          run.banished.add(c.id);
          run.banishes--;
          audio.sfx('ui_back');
          this.levelBanish = false;
          this.renderLevelUp(run, run.rollChoices(run.choiceCount()));
          return;
        }
        audio.sfx('ui_confirm');
        run.applyChoice(c);
        this.afterLevelChoice(run);
      });
      wrap.appendChild(card);
    });
    const actions = h('div', { class: 'lvl-actions' });
    const reroll = this.btn(h('span', {}, '🎲 Rimescola', h('span', { class: 'badge' }, String(run.rerolls))), 'cream small', () => {
      run.rerolls--;
      this.renderLevelUp(run, run.rollChoices(choices.length));
    }, 'Reroll (R)', { 'data-act': 'reroll' });
    if (run.rerolls <= 0) reroll.setAttribute('disabled', '');
    const skip = this.btn(h('span', {}, '⏭ Salta', h('span', { class: 'badge' }, String(run.skips))), 'cream small', () => {
      run.skips--;
      run.gainXp(0);
      this.afterLevelChoice(run);
    }, 'Skip (X)', { 'data-act': 'skip' });
    if (run.skips <= 0) skip.setAttribute('disabled', '');
    const banish = this.btn(h('span', {}, '🚫 Via!', h('span', { class: 'badge' }, String(run.banishes))), 'cream small', () => {
      this.levelBanish = !this.levelBanish;
      wrap.querySelectorAll('.choice').forEach((c) => c.classList.toggle('banish-mode', this.levelBanish));
    }, 'Banish (B)', { 'data-act': 'banish' });
    if (run.banishes <= 0) banish.setAttribute('disabled', '');
    actions.append(reroll, skip, banish);
    const el = h('div', { class: 'screen dim levelup' },
      h('div', { class: 'lvl-title' }, 'Livello ' + run.level + '!'),
      wrap,
      actions,
    );
    this.showOverlay(el, 'levelup', null);
  }

  private choiceCard(run: Run, c: Choice): HTMLElement {
    let name = '', desc = '', ico = '', lvText = '', evoHint: HTMLElement | null = null, maxLv = 1;
    if (c.type === 'weapon') {
      const d = WEAPONS[c.id];
      name = d.name;
      ico = d.icon;
      maxLv = d.maxLevel;
      desc = c.isNew ? d.desc : d.levels[c.level - 2]?.text ?? d.desc;
      lvText = c.isNew ? 'Weapon' : `Level ${c.level}`;
      if (d.evolve) {
        const p = PASSIVES[d.evolve.passive];
        const evo = WEAPONS[d.evolve.into];
        evoHint = h('div', { class: 'evo-hint' }, h('span', {}, '✨ Max level + ', img(icon(p.icon)), ' ', p.name), h('b', {}, '→ ' + evo.name));
      }
    } else if (c.type === 'passive') {
      const d = PASSIVES[c.id];
      name = d.name;
      ico = d.icon;
      maxLv = d.maxLevel;
      desc = c.isNew ? `${d.desc} (${d.short})` : d.short + ' more.';
      lvText = c.isNew ? 'Ingredient' : `Level ${c.level}`;
      const evolves = Object.values(WEAPONS).filter((w) => w.evolve?.passive === c.id);
      if (evolves.length) {
        const w = evolves[0];
        evoHint = h('div', { class: 'evo-hint' }, h('span', {}, '✨ Evolves ', img(icon(w.icon)), ' ', w.name), h('b', {}, '→ ' + WEAPONS[w.evolve!.into].name));
      }
    } else if (c.type === 'coins') {
      name = 'Mancia';
      ico = 'icon.coin';
      desc = 'A generous tip: +25 coins.';
      lvText = 'Tip';
    } else {
      name = 'Pranzo della Nonna';
      ico = 'pickup.lasagna';
      desc = "Nonna's lunch: recover 30 HP.";
      lvText = 'Heal';
    }
    const pips = h('div', { class: 'pips' });
    if (maxLv > 1) for (let i = 1; i <= maxLv; i++) pips.appendChild(h('i', { class: i <= c.level ? 'on' : '' }));
    return h('div', { class: 'paper choice', 'data-nav': '' },
      h('div', { class: 'checker checker-strip' }),
      c.isNew ? h('div', { class: 'new' }, 'NUOVO!') : null,
      h('div', { class: 'ico' }, img(icon(ico))),
      h('div', { class: 'nm' }, name),
      h('div', { class: 'lv' }, lvText),
      maxLv > 1 ? pips : null,
      h('div', { class: 'desc' }, desc),
      evoHint,
    );
  }

  private afterLevelChoice(run: Run) {
    run.finishLevelUp();
    if (run.pendingLevels > 0) {
      run.state = 'levelup';
      this.renderLevelUp(run, run.rollChoices(run.choiceCount()));
      run.onLevelFx();
    } else {
      this.closeOverlay();
      audio.setMusicMuffled(false);
    }
  }

  // ------------------------------------------------------------------ chest

  showChest(run: Run, rewards: ChestReward[], gold: boolean) {
    audio.setMusicMuffled(true);
    const rays = h('div', { class: 'chest-rays' });
    const basket = img(hasSprite('ui.chest') ? spriteURL('ui.chest', 0) : icon('pickup.chest'), 'chest-img shake');
    const items = h('div', { class: 'chest-items' });
    const title = h('div', { class: 'chest-title' }, gold ? 'Cesta d’Oro!' : 'Cesta da Picnic!');
    const cont = this.btn('Continua ▶', 'green', () => {
      this.closeOverlay();
      audio.setMusicMuffled(false);
      run.state = 'playing';
    }, 'Continue');
    cont.style.visibility = 'hidden';
    const stage = h('div', { class: 'chest-stage' }, rays, title, basket, items, cont);
    const el = h('div', { class: 'screen dim' }, stage);
    this.showOverlay(el, 'chest', null);
    audio.sfx('chest_open');
    let skipped = false;
    const reveal = () => {
      if (skipped) return;
      skipped = true;
      basket.classList.remove('shake');
      if (hasSprite('ui.chest')) basket.src = spriteURL('ui.chest', 1);
      rays.classList.add('on');
      rewards.forEach((r, i) => {
        setTimeout(() => {
          items.appendChild(this.rewardCard(r));
          audio.sfx(r.kind === 'evolution' ? 'evolution' : 'chest_reward', { pitch: 1 + i * 0.08 });
          if (i === rewards.length - 1) {
            cont.style.visibility = 'visible';
            this.nav.refresh();
            this.nav.focus(cont, false);
          }
        }, 350 + i * 420);
      });
    };
    setTimeout(reveal, 1100);
    el.addEventListener('click', () => reveal());
  }

  private rewardCard(r: ChestReward): HTMLElement {
    if (r.kind === 'coins') return h('div', { class: 'paper chest-item' }, img(icon('icon.coin')), h('div', { class: 'nm' }, '+' + r.amount + ' coins'));
    if (r.kind === 'evolution') {
      const w = WEAPONS[r.id];
      return h('div', { class: 'paper chest-item evo' }, h('div', { class: 'sub' }, 'EVOLUZIONE!'), img(icon(w.icon)), h('div', { class: 'nm' }, w.name), h('div', { class: 'sub' }, w.desc));
    }
    const w = WEAPONS[r.id];
    if (w) return h('div', { class: 'paper chest-item' }, img(icon(w.icon)), h('div', { class: 'nm' }, w.name), h('div', { class: 'sub' }, 'Level ' + r.level));
    const p = PASSIVES[r.id];
    return h('div', { class: 'paper chest-item' }, img(icon(p.icon)), h('div', { class: 'nm' }, p.name), h('div', { class: 'sub' }, 'Level ' + r.level));
  }

  // ------------------------------------------------------------------ pause

  showPause() {
    const run = this.app.run;
    if (!run || run.state !== 'playing') return;
    run.state = 'paused';
    audio.setMusicMuffled(true);
    const st = run.stats;
    const stats: [string, string][] = [
      ['Max HP', Math.round(st.maxHp).toString()], ['Recovery', st.recovery.toFixed(2) + '/s'], ['Armor', String(st.armor)],
      ['Might', '+' + Math.round((st.might - 1) * 100) + '%'], ['Area', '+' + Math.round((st.area - 1) * 100) + '%'], ['Speed', '+' + Math.round((st.speed - 1) * 100) + '%'],
      ['Duration', '+' + Math.round((st.duration - 1) * 100) + '%'], ['Amount', '+' + st.amount], ['Cooldown', '−' + Math.round((1 - st.cooldown) * 100) + '%'],
      ['Move', '+' + Math.round((st.moveSpeed - 1) * 100) + '%'], ['Magnet', '+' + Math.round((st.magnet - 1) * 100) + '%'], ['Luck', '+' + Math.round((st.luck - 1) * 100) + '%'],
      ['Growth', '+' + Math.round((st.growth - 1) * 100) + '%'], ['Greed', '+' + Math.round((st.greed - 1) * 100) + '%'], ['Revivals', String(run.revivals)],
    ];
    const resume = () => {
      this.closeOverlay();
      audio.setMusicMuffled(false);
      this.app.resumeRun();
    };
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper panel', style: { width: 'min(640px,94vw)' } },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-head' }, h('h2', {}, 'Pausa'), h('span', { class: 'sub' }, `${run.stage.name} · ${formatTime(run.time)} · LV ${run.level}`)),
        h('div', { class: 'panel-body' },
          h('div', { class: 'pause-stats' }, stats.map(([k, v]) => h('div', {}, h('span', {}, k), h('b', {}, v)))),
        ),
        h('div', { class: 'panel-foot' },
          this.btn('▶ Riprendi', 'green', resume, 'Resume', { 'data-nav-default': '' }),
          this.btn('Opzioni', 'cream', () => this.showSettings(() => { this.overlay?.remove(); this.overlay = null; run.state = 'playing'; this.showPause(); }, true), 'Settings'),
          this.btn('Esci', 'dark', () => this.confirm('Abandon this service? You keep the coins you earned.', () => this.app.quitRun(), () => { run.state = 'playing'; this.showPause(); }), 'Quit'),
        ),
      ),
    );
    this.showOverlay(el, 'pause', resume);
  }

  confirm(text: string, yes: () => void, no: () => void) {
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper confirm-box' },
        h('p', {}, text),
        h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center' } },
          this.btn('Sì', 'red', yes, 'Yes'),
          this.btn('No', 'cream', no, 'No', { 'data-nav-default': '' }),
        ),
      ),
    );
    this.showOverlay(el, 'confirm', no);
  }

  // ------------------------------------------------------------------ results

  showResults(run: Run, victory: boolean, unlocks: { icon: string; text: string }[], newRecord = false) {
    this.removeHud();
    this.overlay?.remove();
    this.overlay = null;
    const rows = run.weapons
      .slice()
      .sort((a, b) => b.damageDealt - a.damageDealt)
      .map((w) => {
        const alive = Math.max(1, run.time - w.acquired);
        return h('tr', {},
          h('td', {}, img(icon(w.def.icon)), ' ', w.def.name),
          h('td', { class: 'num' }, w.def.evolution ? '★' : String(w.level)),
          h('td', { class: 'num' }, Math.round(w.damageDealt).toLocaleString()),
          h('td', { class: 'num' }, String(w.kills)),
          h('td', { class: 'num' }, (w.damageDealt / alive).toFixed(1)),
        );
      });
    const lines = victory
      ? ['Tradition is safe — for tonight.', 'Nonna would be proud.', 'The carbonara remains pure.', 'Bravissimo, Chef!']
      : ['The crimes got into the kitchen…', 'Somebody put cream in it. Again.', 'Even Nonna is speechless.', 'Next time, al dente.'];
    const el = h('div', { class: 'screen dim results' },
      h('div', { class: 'res-title ' + (victory ? 'win' : 'lose') }, victory ? 'Vittoria!' : 'Mamma Mia!'),
      h('div', { class: 'res-sub' }, lines[Math.floor(Math.random() * lines.length)]),
      h('div', { class: 'paper panel' },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-body' },
          h('div', { class: 'stats-row' },
            h('div', { class: 'stat-box' + (newRecord ? ' record' : '') }, h('div', { class: 'v' }, formatTime(run.time)), h('div', { class: 'k' }, newRecord ? '★ New record!' : 'Survived')),
            h('div', { class: 'stat-box' }, h('div', { class: 'v' }, String(run.level)), h('div', { class: 'k' }, 'Level')),
            h('div', { class: 'stat-box' }, h('div', { class: 'v' }, run.kills.toLocaleString()), h('div', { class: 'k' }, 'Crimes stopped')),
            h('div', { class: 'stat-box' }, h('div', { class: 'v' }, '+' + run.coins), h('div', { class: 'k' }, 'Coins')),
          ),
          h('table', { class: 'dmg' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Weapon'), h('th', {}, 'Lv'), h('th', {}, 'Damage'), h('th', {}, 'Kills'), h('th', {}, 'DPS'))),
            h('tbody', {}, rows),
          ),
          unlocks.length ? h('div', { class: 'unlock-list' }, unlocks.map((u) => h('div', { class: 'unlock' }, img(icon(u.icon)), h('b', {}, u.text)))) : null,
        ),
        h('div', { class: 'panel-foot' },
          this.btn('↻ Ancora', 'green', () => this.app.startRun(run.char.id, run.stage.id), 'Play again', { 'data-nav-default': '' }),
          this.btn('Menu', 'cream', () => this.app.toTitle(), 'Main menu'),
        ),
      ),
    );
    this.show(el, 'results', () => this.app.toTitle());
    if (unlocks.length) setTimeout(() => audio.sfx('ui_unlock'), 600);
  }

  // ------------------------------------------------------------------ shop

  showShop() {
    const s = this.app.save;
    const grid = h('div', { class: 'shop-grid' });
    const totalBought = () => Object.values(s.powerups).reduce((a, b) => a + b, 0);
    const pill = h('div', { class: 'coins-pill' }, img(COIN()), String(s.coins));
    const render = () => {
      grid.innerHTML = '';
      pill.lastChild!.textContent = String(s.coins);
      for (const p of POWERUPS) {
        const rank = s.powerups[p.id] ?? 0;
        const maxed = rank >= p.maxRank;
        const cost = powerupCost(p, rank, totalBought());
        const poor = !maxed && s.coins < cost;
        const pips = h('div', { class: 'pips' });
        for (let i = 0; i < p.maxRank; i++) pips.appendChild(h('i', { class: i < rank ? 'on' : '' }));
        const card = h('div', { class: 'pu' + (maxed ? ' maxed' : '') + (poor ? ' poor' : ''), 'data-nav': '' },
          img(icon(p.icon)),
          h('div', { class: 'nm' }, p.name),
          pips,
          h('div', { class: 'ds' }, p.desc),
          maxed ? h('div', { class: 'cost' }, '✔ Max') : h('div', { class: 'cost' }, img(COIN()), String(cost)),
        );
        card.addEventListener('click', () => {
          if (maxed || s.coins < cost) {
            audio.sfx('ui_error');
            return;
          }
          s.coins -= cost;
          (s as any).spent = ((s as any).spent ?? 0) + cost;
          s.powerups[p.id] = rank + 1;
          this.app.persist();
          audio.sfx('ui_buy');
          const focusIdx = POWERUPS.indexOf(p);
          render();
          this.nav.refresh();
          const el = grid.children[focusIdx] as HTMLElement;
          if (el) this.nav.focus(el, false);
        });
        grid.appendChild(card);
      }
      this.nav.refresh();
    };
    render();
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper panel' },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-head' }, h('div', {}, h('h2', {}, 'La Dispensa'), h('div', { class: 'sub' }, 'The pantry — permanent power-ups, bought with the coins you earn in the kitchen.')), pill),
        h('div', { class: 'panel-body' }, grid),
        h('div', { class: 'panel-foot' },
          this.btn('◀ Indietro', 'cream', () => this.showTitle(), 'Back'),
          this.btn('Rimborso', 'dark small', () => {
            const spent = (s as any).spent ?? 0;
            if (!spent) { audio.sfx('ui_error'); return; }
            this.confirm(`Refund all power-ups for ${spent} coins?`, () => {
              s.coins += spent;
              (s as any).spent = 0;
              s.powerups = {};
              this.app.persist();
              audio.sfx('ui_buy');
              this.showShop();
            }, () => { this.overlay?.remove(); this.overlay = null; this.nav.setRoot(this.screen, () => this.showTitle()); });
          }, 'Refund all'),
        ),
      ),
    );
    this.show(el, 'shop', () => this.showTitle());
    audio.playMusic('menu');
  }

  // ------------------------------------------------------------------ collection

  showCollection(tab: 'crimes' | 'weapons' | 'passives' | 'records' = 'crimes') {
    const s = this.app.save;
    const seen = new Set(s.seen);
    const list = h('div', { class: 'coll-list' });
    const detail = h('div', { class: 'coll-detail' });
    const tabs = h('div', { class: 'tabs' });
    const mk = (id: typeof tab, label: string) => {
      const t = h('div', { class: 'tab' + (tab === id ? ' on' : ''), 'data-nav': '' }, label);
      t.addEventListener('click', () => { audio.sfx('ui_click'); this.showCollection(id); });
      tabs.appendChild(t);
    };
    mk('crimes', '🍍 Crimini');
    mk('weapons', '🔪 Armi');
    mk('passives', '🧄 Ingredienti');
    mk('records', '🏆 Record');
    const sev = (n: number) => h('span', { class: 'sev' }, [1, 2, 3, 4, 5].map((i) => h('i', { class: i <= n ? '' : 'off' })));
    let body: HTMLElement;
    if (tab === 'crimes') {
      const ids = [...REGULAR_ENEMY_IDS, ...BOSS_IDS];
      const showE = (id: string) => {
        const d = ENEMIES[id];
        const known = seen.has('e:' + id);
        detail.innerHTML = '';
        if (!known) {
          detail.append(h('h3', {}, '???'), h('p', { class: 'why' }, 'Not yet encountered. Keep cooking.'));
          return;
        }
        detail.append(
          img(icon(d.sprite), 'big'),
          h('h3', {}, d.name),
          h('div', { class: 'en' }, d.en + (d.boss ? ' · BOSS' : '')),
          h('div', { class: 'crime' }, '⚖ ', h('b', {}, d.info.crime)),
          h('div', { class: 'kv' }, 'Severity ', sev(d.info.severity), h('span', { class: 'sub' }, ` · defeated ${s.kills[id] ?? 0}×`)),
          h('p', { class: 'why' }, d.info.why),
          d.info.quote ? h('blockquote', {}, d.info.quote) : '',
        );
      };
      ids.forEach((id, i) => {
        const d = ENEMIES[id];
        const known = seen.has('e:' + id);
        const it = h('div', { class: 'coll-item' + (known ? '' : ' unseen'), 'data-nav': '', ...(i === 0 ? { 'data-nav-default': '' } : {}) }, img(icon(d.sprite)));
        it.addEventListener('navfocus', () => showE(id));
        it.addEventListener('click', () => showE(id));
        list.appendChild(it);
      });
      showE(ids[0]);
      body = h('div', { class: 'coll' }, list, detail);
    } else if (tab === 'weapons') {
      const ids = Object.keys(WEAPONS);
      const showW = (id: string) => {
        const d = WEAPONS[id];
        const known = seen.has('w:' + id);
        detail.innerHTML = '';
        if (!known) {
          detail.append(h('h3', {}, '???'), h('p', { class: 'why' }, d.evolution ? `An evolution. Hint: max out ${WEAPONS[d.from!].name} and find the right ingredient.` : 'Not yet discovered.'));
          return;
        }
        const evo = d.evolve ? WEAPONS[d.evolve.into] : null;
        const from = d.from ? WEAPONS[d.from] : null;
        detail.append(
          img(icon(d.icon), 'big'),
          h('h3', {}, d.name),
          h('div', { class: 'en' }, d.evolution ? 'Evolution' : 'Weapon · max level ' + d.maxLevel),
          h('p', { class: 'why' }, d.desc),
          evo ? h('div', { class: 'kv' }, 'Evolves with ', img(icon(PASSIVES[d.evolve!.passive].icon)), h('b', {}, PASSIVES[d.evolve!.passive].name), ' → ', img(icon(evo.icon)), h('b', {}, evo.name)) : '',
          from ? h('div', { class: 'kv' }, 'From ', img(icon(from.icon)), h('b', {}, from.name), ' + ', img(icon(PASSIVES[from.evolve!.passive].icon)), h('b', {}, PASSIVES[from.evolve!.passive].name)) : '',
        );
      };
      ids.forEach((id, i) => {
        const d = WEAPONS[id];
        const known = seen.has('w:' + id);
        const it = h('div', { class: 'coll-item' + (known ? '' : ' unseen'), 'data-nav': '', ...(i === 0 ? { 'data-nav-default': '' } : {}) }, img(icon(d.icon)));
        it.addEventListener('navfocus', () => showW(id));
        it.addEventListener('click', () => showW(id));
        list.appendChild(it);
      });
      showW(ids[0]);
      body = h('div', { class: 'coll' }, list, detail);
    } else if (tab === 'passives') {
      const ids = Object.keys(PASSIVES);
      const showP = (id: string) => {
        const d = PASSIVES[id];
        const known = seen.has('p:' + id);
        detail.innerHTML = '';
        if (!known) {
          detail.append(h('h3', {}, '???'), h('p', { class: 'why' }, 'Not yet discovered.'));
          return;
        }
        const evo = Object.values(WEAPONS).find((w) => w.evolve?.passive === id);
        detail.append(
          img(icon(d.icon), 'big'),
          h('h3', {}, d.name),
          h('div', { class: 'en' }, d.short + ' per level · max ' + d.maxLevel),
          h('p', { class: 'why' }, d.desc),
          evo ? h('div', { class: 'kv' }, 'Evolves ', img(icon(evo.icon)), h('b', {}, evo.name)) : '',
        );
      };
      ids.forEach((id, i) => {
        const d = PASSIVES[id];
        const known = seen.has('p:' + id);
        const it = h('div', { class: 'coll-item' + (known ? '' : ' unseen'), 'data-nav': '', ...(i === 0 ? { 'data-nav-default': '' } : {}) }, img(icon(d.icon)));
        it.addEventListener('navfocus', () => showP(id));
        it.addEventListener('click', () => showP(id));
        list.appendChild(it);
      });
      showP(ids[0]);
      body = h('div', { class: 'coll' }, list, detail);
    } else {
      body = h('div', {},
        h('div', { class: 'stats-row' },
          h('div', { class: 'stat-box' }, h('div', { class: 'v' }, String(s.runs)), h('div', { class: 'k' }, 'Services (runs)')),
          h('div', { class: 'stat-box' }, h('div', { class: 'v' }, String(s.wins)), h('div', { class: 'k' }, 'Victories')),
          h('div', { class: 'stat-box' }, h('div', { class: 'v' }, s.totalKills.toLocaleString()), h('div', { class: 'k' }, 'Crimes stopped')),
          h('div', { class: 'stat-box' }, h('div', { class: 'v' }, s.totalCoins.toLocaleString()), h('div', { class: 'k' }, 'Coins earned')),
        ),
        h('table', { class: 'dmg' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Stage'), h('th', {}, 'Best time'), h('th', {}, 'Wins'), h('th', {}, 'Best kills'), h('th', {}, 'Best level'))),
          h('tbody', {}, STAGES.map((st) => {
            const r = s.records[st.id];
            return h('tr', {}, h('td', {}, st.name), h('td', { class: 'num' }, formatTime(r?.bestTime ?? 0)), h('td', { class: 'num' }, String(r?.wins ?? 0)), h('td', { class: 'num' }, String(r?.bestKills ?? 0)), h('td', { class: 'num' }, String(r?.bestLevel ?? 0)));
          })),
        ),
        h('h3', { class: 'medals-h' }, 'Medaglie'),
        h('div', { class: 'medals' }, MEDALS.map((m) => {
          const got = s.achievements.includes(m.id);
          return h('div', { class: 'medal' + (got ? ' got' : '') }, img(icon(m.icon)), h('div', {}, h('b', {}, m.name), h('div', { class: 'sub' }, m.desc)));
        })),
        h('p', { class: 'controls-help' }, `Crimes catalogued: ${[...seen].filter((k) => k.startsWith('e:')).length} / ${REGULAR_ENEMY_IDS.length + BOSS_IDS.length} · Weapons discovered: ${[...seen].filter((k) => k.startsWith('w:')).length} / ${Object.keys(WEAPONS).length}`),
      );
    }
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper panel' },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-head' }, h('div', {}, h('h2', {}, 'Il Ricettario'), h('div', { class: 'sub' }, "Nonna's book of culinary crimes — and of the tools to fight them.")), tabs),
        h('div', { class: 'panel-body' }, body),
        h('div', { class: 'panel-foot' }, this.btn('◀ Indietro', 'cream', () => this.showTitle(), 'Back')),
      ),
    );
    this.show(el, 'collection', () => this.showTitle());
    audio.playMusic('menu');
  }

  // ------------------------------------------------------------------ settings

  showSettings(back: () => void, asOverlay = false) {
    const s = this.app.save.settings;
    const slider = (key: 'master' | 'music' | 'sfx') => {
      const inp = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(s[key]), 'data-nav': '' }) as HTMLInputElement;
      inp.addEventListener('input', () => {
        s[key] = parseFloat(inp.value);
        this.app.applySettings();
      });
      inp.addEventListener('change', () => {
        this.app.persist();
        audio.sfx('ui_tick');
      });
      return inp;
    };
    const toggle = (key: 'shake' | 'damageNumbers' | 'flashes' | 'bubbles' | 'showFps') => {
      const t = h('div', { class: 'toggle' + (s[key] ? ' on' : ''), 'data-nav': '' });
      t.addEventListener('click', () => {
        (s as any)[key] = !s[key];
        t.classList.toggle('on', !!s[key]);
        this.app.applySettings();
        this.app.persist();
        audio.sfx('ui_click');
      });
      return t;
    };
    const quality = h('div', { class: 'toggle' + (s.quality === 'high' ? ' on' : ''), 'data-nav': '' });
    quality.addEventListener('click', () => {
      s.quality = s.quality === 'high' ? 'low' : 'high';
      quality.classList.toggle('on', s.quality === 'high');
      this.app.applySettings();
      this.app.persist();
      audio.sfx('ui_click');
    });
    const el = h('div', { class: 'screen dim' },
      h('div', { class: 'paper panel', style: { width: 'min(640px,94vw)' } },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-head' }, h('h2', {}, 'Opzioni'), h('span', { class: 'sub' }, 'Settings')),
        h('div', { class: 'panel-body' },
          h('div', { class: 'settings-grid' },
            h('div', {}, 'Master volume'), slider('master'),
            h('div', {}, 'Music'), slider('music'),
            h('div', {}, 'Sound effects'), slider('sfx'),
            h('div', {}, 'Screen shake'), toggle('shake'),
            h('div', {}, 'Damage numbers'), toggle('damageNumbers'),
            h('div', {}, 'Bright flashes'), toggle('flashes'),
            h('div', {}, 'Speech bubbles'), toggle('bubbles'),
            h('div', {}, 'High quality (effects, resolution)'), quality,
            h('div', {}, 'Show FPS'), toggle('showFps'),
          ),
          h('p', { class: 'controls-help' },
            'Move: WASD / arrow keys / gamepad stick / drag anywhere on touch screens.', h('br'),
            'Weapons fire automatically. Pause: Esc / P / Start. Level-up: R reroll · X skip · B banish.'),
        ),
        h('div', { class: 'panel-foot' },
          this.btn('◀ Fatto', 'green', back, 'Done', { 'data-nav-default': '' }),
          this.btn('⛶ Fullscreen', 'cream small', () => this.app.toggleFullscreen(), 'Toggle'),
          !asOverlay ? this.btn('Reset', 'dark small', () => this.confirm('Erase ALL progress (coins, unlocks, records)?', () => { this.app.resetSave(); }, () => this.showSettings(back)), 'Erase save') : null,
        ),
      ),
    );
    if (asOverlay) this.showOverlay(el, 'settings', back);
    else this.show(el, 'settings', back);
  }

  // ------------------------------------------------------------------ credits

  showCredits() {
    const el = h('div', { class: 'screen dim credits' },
      h('div', { class: 'paper panel', style: { width: 'min(700px,94vw)' } },
        h('div', { class: 'checker checker-strip' }),
        h('div', { class: 'panel-head' }, h('h2', {}, 'Crediti'), h('span', { class: 'sub' }, 'Credits')),
        h('div', { class: 'panel-body' },
          h('div', { class: 'tricolore', style: { margin: '6px auto 14px', width: '60%' } }),
          h('p', {}, h('b', {}, 'KITCHEN FIGHT'), ' — an original survivors-like about defending Italian culinary tradition.'),
          h('p', {}, 'Every sprite is painted in code with vector shapes. Every note of music and every sound effect is synthesized live in your browser — no samples, no image files.'),
          h('p', {}, 'The crimes are real: pet peeves of Italian chefs, institutions and social media, compiled with sources in docs/RESEARCH.md (YouGov 2022, the town of Amatrice, the Trevi Fountain “pasta activists”, and many more).'),
          h('p', {}, 'Fonts: Lobster, Lilita One and Playfair Display (SIL Open Font License).'),
          h('p', { class: 'sub' }, 'No pineapples were harmed. Several were deeply offended.'),
        ),
        h('div', { class: 'panel-foot' }, this.btn('◀ Indietro', 'cream', () => this.showTitle(), 'Back', { 'data-nav-default': '' })),
      ),
    );
    this.show(el, 'credits', () => this.showTitle());
  }
}
