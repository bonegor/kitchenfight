/**
 * AUDIO — public API used by the game. (Implementation lives in src/audio/*.)
 *
 * Everything is synthesized with the Web Audio API (no audio files):
 *   - music: composed tracks rendered with OfflineAudioContext into loopable buffers
 *   - sfx:   short synthesized sounds, voice-limited and rate-limited
 *
 * The game calls ONLY what is exported here.
 */

export type MusicId =
  | 'title' // title screen theme (catchy main theme)
  | 'menu' // shops / character select / collection (relaxed trattoria waltz)
  | 'kitchen' // stage 1 La Cucina
  | 'trattoria' // stage 2 La Trattoria
  | 'streets' // stage 3 I Vicoli di Napoli
  | 'foodcourt' // stage 4 La Food Court
  | 'boss' // mini-boss fights
  | 'finalboss' // final boss fights
  | 'victory' // victory (short, may loop softly)
  | 'gameover'; // defeat (short, sad-comic)

export type SfxId =
  // UI
  | 'ui_hover' | 'ui_click' | 'ui_back' | 'ui_confirm' | 'ui_buy' | 'ui_error' | 'ui_unlock' | 'ui_tick'
  // progression
  | 'levelup' | 'chest_drop' | 'chest_open' | 'chest_reward' | 'evolution' | 'new_weapon'
  // pickups
  | 'pickup_xp' | 'pickup_coin' | 'pickup_heal' | 'pickup_bell' | 'pickup_spumante' | 'pickup_gelato'
  // player
  | 'player_hurt' | 'player_death' | 'player_revive' | 'low_hp'
  // enemies
  | 'hit' | 'hit_crit' | 'enemy_death' | 'enemy_death_big' | 'enemy_shoot' | 'enemy_dash' | 'enemy_split'
  | 'elite_spawn' | 'prop_break'
  // bosses
  | 'boss_warning' | 'boss_roar' | 'boss_slam' | 'boss_shoot' | 'boss_death'
  // weapons
  | 'w_mattarello' | 'w_ciabatta' | 'w_coltelli' | 'w_olive' | 'w_forchette' | 'w_pizza' | 'w_rotella'
  | 'w_peperoncino' | 'w_moka' | 'w_spaghetti' | 'w_vesuvio' | 'w_forma' | 'w_basilico' | 'w_forno'
  | 'explosion' | 'burn' | 'freeze';

export interface SfxOpts {
  /** 0..1 multiplier (default 1) */
  volume?: number;
  /** playback-rate multiplier (default 1); e.g. pickup_xp combo uses 1 → 2 */
  pitch?: number;
  /** -1..1 stereo pan */
  pan?: number;
}

export type VoiceMood = 'angry' | 'happy' | 'surprised' | 'nonna' | 'boss' | 'cat';

export interface AudioAPI {
  /** Call from any user gesture; creates/resumes the AudioContext. Idempotent. */
  unlock(): void;
  /** True once the AudioContext is running. */
  readonly ready: boolean;
  /** Pre-render music tracks (optional — playMusic renders on demand). */
  preload(ids: MusicId[], onProgress?: (p: number) => void): Promise<void>;
  /** Start a track (crossfades from the current one). No-op if already playing that id unless restart. */
  playMusic(id: MusicId, opts?: { fade?: number; restart?: boolean }): void;
  stopMusic(fade?: number): void;
  /** Low-pass "muffle" on the music bus (paused / level-up menu). */
  setMusicMuffled(on: boolean): void;
  /** Duck music for `seconds` (e.g. under a level-up fanfare). */
  duckMusic(amount: number, seconds: number): void;
  /** Fire a sound effect. Must be cheap to call many times per frame (internally rate-limited). */
  sfx(id: SfxId, opts?: SfxOpts): void;
  /** Gibberish "speech" for comic speech bubbles (formant babble), ~syllables from text. */
  voice(text: string, mood: VoiceMood): void;
  /** 0..1 volumes */
  setVolumes(master: number, music: number, sfx: number): void;
}

/** Stub used until the real engine is plugged in (keeps the game runnable). */
class SilentAudio implements AudioAPI {
  ready = false;
  unlock() {}
  async preload() {}
  playMusic() {}
  stopMusic() {}
  setMusicMuffled() {}
  duckMusic() {}
  sfx() {}
  voice() {}
  setVolumes() {}
}

export let audio: AudioAPI = new SilentAudio();

/** The implementation module calls this at import time. */
export function installAudio(impl: AudioAPI) {
  audio = impl;
}
