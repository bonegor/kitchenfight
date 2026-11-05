/**
 * KITCHEN FIGHT audio engine — implements AudioAPI with the Web Audio API.
 *
 * Graph:
 *   music tracks → [track gain] → muffle low-pass → duck gain → music volume ┐
 *   sfx voices → [gain] → [panner] → sfx volume ─────────────────────────────┤→ master → compressor → out
 *   speech → voice gain ─────────────────────────────────────────────────────┘
 *
 * Music is synthesized in JS (render.ts) — in a Web Worker when available, otherwise in
 * cooperative main-thread slices — into AudioBuffers that loop sample-exactly.
 * SFX are synthesized once per variant after unlock and replayed from buffers.
 * Nothing here throws into the game; before unlock() everything is a silent no-op.
 */
import type { AudioAPI, MusicId, SfxId, SfxOpts, VoiceMood } from './audio';
import { clamp, Slicer, yieldToLoop } from './dsp';
import { renderSong } from './render';
import { bankTransfer, loadSampleBank, type BankLoadStats } from './samplebank';
import { setsOfInstrument, type BankReport } from './sampled';
import { SFX, SFX_IDS, renderSfx } from './sfx';
import { SONGS } from './songs/index';
import { renderVoice } from './voice';
import RenderWorker from './worker?worker&inline';

const MUSIC_TRIM = 0.55;
const SFX_TRIM = 1.0;
const VOICE_TRIM = 0.55;
const MAX_SFX_VOICES = 40;
/** cached music budget (seconds of stereo audio) */
const MUSIC_CACHE_SECONDS = 280;
const DEFAULT_SR = 48000;
/** music renders wait this long for the recorded instrument samples, then fall back to synth */
const BANK_WAIT_MS = 12000;
const MOODS: VoiceMood[] = ['angry', 'happy', 'surprised', 'nonna', 'boss', 'cat'];
/** finite number or default */
const num = (x: unknown, def: number): number => (typeof x === 'number' && Number.isFinite(x) ? x : def);
/** TS 5.9 typed-array generics: Web Audio wants ArrayBuffer-backed arrays (ours always are). */
const f32 = (a: Float32Array): Float32Array<ArrayBuffer> => a as Float32Array<ArrayBuffer>;

interface Track {
  id: MusicId;
  sr: number;
  buffer: AudioBuffer | null;
  raw: { left: Float32Array; right: Float32Array } | null;
  loop: boolean;
  loopStart: number; // seconds
  loopEnd: number;
  seconds: number;
  used: number;
  /** rendered with the recorded instrument samples (false = synthesized fallback) */
  sampled: boolean;
}

interface Playing {
  id: MusicId;
  src: AudioBufferSourceNode;
  gain: GainNode;
}

interface Voice {
  src: AudioBufferSourceNode;
  gain: GainNode;
  end: number;
}

interface Pending {
  promise: Promise<Track | null>;
  resolve: (t: Track | null) => void;
  progress: number;
}

type MusicDone = { seq: number; ok: true; left: Float32Array; right: Float32Array; loop: boolean; loopStart: number; loopEnd: number; length: number; sr: number; ms: number };
type WorkerMsg = { seq: number; [k: string]: unknown };

/** One render worker with request/response routing; marks itself broken on any failure. */
class WorkerPort {
  private w: Worker | null = null;
  private broken = false;
  private seq = 0;
  private jobs = new Map<number, (m: WorkerMsg | null) => boolean>();
  get usable(): boolean {
    return !this.broken;
  }
  private ensure(): Worker | null {
    if (this.broken) return null;
    if (this.w) return this.w;
    try {
      const w = new RenderWorker();
      w.onmessage = (e: MessageEvent<WorkerMsg>) => {
        const m = e.data;
        const h = this.jobs.get(m.seq);
        if (!h) return;
        let done = true;
        try {
          done = h(m);
        } catch {
          /* never throw into the game */
        }
        if (done) this.jobs.delete(m.seq);
      };
      w.onerror = () => this.fail();
      this.w = w;
      return w;
    } catch {
      this.fail();
      return null;
    }
  }
  fail(): void {
    this.broken = true;
    const jobs = [...this.jobs.values()];
    this.jobs.clear();
    for (const h of jobs) {
      try {
        h(null);
      } catch {
        /* ignore */
      }
    }
    try {
      this.w?.terminate();
    } catch {
      /* ignore */
    }
    this.w = null;
  }
  /** handler gets each reply (null on failure) and returns true when the job is finished */
  request(msg: Record<string, unknown>, handler: (m: WorkerMsg | null) => boolean, transfer?: Transferable[]): boolean {
    const w = this.ensure();
    if (!w) return false;
    const seq = ++this.seq;
    this.jobs.set(seq, handler);
    try {
      if (transfer && transfer.length) w.postMessage({ ...msg, seq }, transfer);
      else w.postMessage({ ...msg, seq });
      return true;
    } catch {
      this.jobs.delete(seq);
      this.fail();
      return false;
    }
  }
}

export class AudioEngine implements AudioAPI {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicIn: GainNode | null = null;
  private muffle: BiquadFilterNode | null = null;
  private duck: GainNode | null = null;
  private musicVol: GainNode | null = null;
  private sfxVol: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private vol = { master: 1, music: 0.8, sfx: 0.9 };
  private muffled = false;

  // music
  private tracks = new Map<MusicId, Track>();
  private pending = new Map<MusicId, Pending>();
  private queue: MusicId[] = [];
  private pumping = false;
  private current: Playing | null = null;
  private wanted: MusicId | null = null;
  private wantedFade = 1;
  private musicWorker = new WorkerPort();
  private fxWorker = new WorkerPort();
  // recorded instrument samples (decoded on the main thread, installed in the music worker)
  private bank: Promise<boolean> | null = null;
  private bankReady = false;
  /** sample sets installed in the music worker so far, and waiters for more */
  private setsIn = new Set<string>();
  private bankDone = false;
  private setWaiters: Array<() => void> = [];
  /** track currently waiting for its sets / rendering (its sets are decoded first) */
  private rendering: MusicId | null = null;
  private bankInfo: { state: string; load?: BankLoadStats; report?: BankReport; t0?: number; tReady?: number; error?: string } = { state: 'idle' };

  // sfx
  private sfxBufs = new Map<string, AudioBuffer>();
  private sfxState = new Map<SfxId, { last: number; voices: Voice[]; lastVariant: number }>();
  private activeVoices = 0;
  private sfxPrerendering = false;
  private speech: Voice | null = null;
  private lastSpeech = 0;
  private speechToken = 0;
  private voiceCache = new Map<string, AudioBuffer>();

  private suspendedByVisibility = false;
  private listening = false;

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Diagnostics for tests/dev tools (sample bank state, which tracks used recorded samples). */
  samplerStatus(): Record<string, unknown> {
    const tracks: Record<string, boolean> = {};
    for (const t of this.tracks.values()) tracks[t.id] = t.sampled;
    return { ...this.bankInfo, bankReady: this.bankReady, tracks, playing: this.current?.id ?? null, ctx: this.ctx?.state ?? 'none' };
  }

  // ------------------------------------------------------------------------------- sample bank

  /** Start (once) decoding the instrument samples and installing them in the music worker. */
  private ensureBank(): Promise<boolean> {
    if (!this.bank) {
      try {
        (globalThis as unknown as { __kfSampler?: unknown }).__kfSampler = { status: () => this.samplerStatus() };
      } catch {
        /* ignore */
      }
      this.bank = this.loadBank().catch(() => false);
    }
    return this.bank;
  }

  private async loadBank(): Promise<boolean> {
    this.bankInfo = { state: 'loading', t0: performance.now() };
    if (!this.musicWorker.usable) {
      this.bankInfo.state = 'no-worker';
      return false;
    }
    // stream every decoded set to the worker as soon as it is ready (no main-thread pile-up);
    // the sets of the tracks waiting to render are decoded first
    let sent = 0;
    const loaded = await loadSampleBank(
      2,
      (def, pcm) => {
        const ok = this.musicWorker.request(
          { type: 'bankSet', set: def, pcm },
          (m) => {
            if (m && m.ok === true) this.setsIn.add(def.name);
            this.wakeSetWaiters();
            return true;
          },
          bankTransfer(pcm),
        );
        if (ok) sent++;
      },
      () => {
        const ids = [...(this.rendering ? [this.rendering] : []), ...(this.wanted ? [this.wanted] : []), ...this.queue];
        return ids.flatMap((id) => this.setsOf(id));
      },
    );
    if (!loaded || !sent) {
      this.bankInfo.state = 'decode-failed';
      this.bankDone = true;
      this.wakeSetWaiters();
      return false;
    }
    this.bankInfo.load = loaded.stats;
    this.bankInfo.state = 'installing';
    const ok = await new Promise<boolean>((resolve) => {
      const req = this.musicWorker.request({ type: 'bankDone' }, (m) => {
        if (m && m.report) this.bankInfo.report = m.report as BankReport;
        resolve(!!m && m.ok === true);
        return true;
      });
      if (!req) resolve(false);
    });
    this.bankInfo.state = ok ? 'ready' : 'install-failed';
    this.bankInfo.tReady = performance.now();
    this.bankDone = true;
    this.wakeSetWaiters();
    if (ok) {
      this.bankReady = true;
      // tracks rendered with the synth fallback while we waited: re-render them on next use
      for (const t of [...this.tracks.values()]) if (!t.sampled && t.id !== this.current?.id && t.id !== this.wanted) this.tracks.delete(t.id);
    }
    return ok;
  }

  private wakeSetWaiters(): void {
    const w = this.setWaiters;
    this.setWaiters = [];
    for (const f of w) {
      try {
        f();
      } catch {
        /* ignore */
      }
    }
  }

  /** Sample sets the instruments of a track play. */
  private setsOf(id: MusicId): string[] {
    const song = SONGS[id];
    if (!song) return [];
    const out = new Set<string>();
    for (const ch of Object.values(song.channels)) for (const s of setsOfInstrument(ch.inst)) out.add(s);
    return [...out];
  }

  /**
   * Wait (bounded by BANK_WAIT_MS from the start of loading) until the music worker has every
   * sample set this track uses — not the whole bank. True when the track will render sampled.
   */
  private async waitBank(id: MusicId): Promise<boolean> {
    void this.ensureBank();
    const need = this.setsOf(id);
    const have = () => need.every((n) => this.setsIn.has(n));
    if (have()) return true;
    const started = this.bankInfo.t0 ?? performance.now();
    const deadline = started + BANK_WAIT_MS;
    while (!have() && !this.bankDone && performance.now() < deadline) {
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, Math.max(1, deadline - performance.now()));
        this.setWaiters.push(() => {
          clearTimeout(t);
          resolve();
        });
      });
    }
    return have();
  }

  // ------------------------------------------------------------------------------- lifecycle

  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor: typeof AudioContext | undefined =
          typeof window !== 'undefined' ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;
        if (!Ctor) return;
        this.ctx = new Ctor({ latencyHint: 'interactive' });
        this.buildGraph();
        this.listen();
        // iOS: play one silent sample inside the gesture
        try {
          const b = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
          const s = this.ctx.createBufferSource();
          s.buffer = b;
          s.connect(this.ctx.destination);
          s.start(0);
        } catch {
          /* ignore */
        }
        void this.prerenderSfx();
        // tracks rendered before unlock become AudioBuffers lazily; start a wanted track now
        if (this.wanted) {
          const id = this.wanted;
          this.wanted = null;
          this.playMusic(id, { fade: this.wantedFade });
        }
      }
      const ctx = this.ctx;
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    } catch {
      /* never throw into the game */
    }
  }

  private buildGraph(): void {
    const ctx = this.ctx as AudioContext;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.15;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.connect(comp);

    this.musicIn = ctx.createGain();
    this.muffle = ctx.createBiquadFilter();
    this.muffle.type = 'lowpass';
    this.muffle.Q.value = 0.8;
    this.muffle.frequency.value = this.muffled ? 700 : Math.min(20000, ctx.sampleRate * 0.45);
    this.duck = ctx.createGain();
    this.musicVol = ctx.createGain();
    this.musicIn.connect(this.muffle);
    this.muffle.connect(this.duck);
    this.duck.connect(this.musicVol);
    this.musicVol.connect(this.master);

    this.sfxVol = ctx.createGain();
    this.sfxVol.connect(this.master);
    this.voiceGain = ctx.createGain();
    this.voiceGain.gain.value = VOICE_TRIM;
    this.voiceGain.connect(this.sfxVol);
    this.applyVolumes(0);
  }

  private listen(): void {
    if (this.listening || typeof document === 'undefined') return;
    this.listening = true;
    document.addEventListener('visibilitychange', () => {
      const ctx = this.ctx;
      if (!ctx) return;
      try {
        if (document.hidden) {
          if (ctx.state === 'running') {
            this.suspendedByVisibility = true;
            ctx.suspend().catch(() => {});
          }
        } else if (this.suspendedByVisibility) {
          this.suspendedByVisibility = false;
          ctx.resume().catch(() => {});
        }
      } catch {
        /* ignore */
      }
    });
  }

  // ------------------------------------------------------------------------------- volumes

  setVolumes(master: number, music: number, sfx: number): void {
    this.vol = { master: clamp(num(master, 1), 0, 1), music: clamp(num(music, 0.8), 0, 1), sfx: clamp(num(sfx, 0.9), 0, 1) };
    this.applyVolumes(0.06);
  }

  private applyVolumes(tau: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.musicVol || !this.sfxVol) return;
    const now = ctx.currentTime;
    const curve = (v: number) => v * v; // perceptual-ish slider curve
    const set = (p: AudioParam, v: number) => {
      p.cancelScheduledValues(now);
      if (tau <= 0) p.setValueAtTime(v, now);
      else p.setTargetAtTime(v, now, tau);
    };
    set(this.master.gain, curve(this.vol.master));
    set(this.musicVol.gain, curve(this.vol.music) * MUSIC_TRIM);
    set(this.sfxVol.gain, curve(this.vol.sfx) * SFX_TRIM);
  }

  // ------------------------------------------------------------------------------- music

  async preload(ids: MusicId[], onProgress?: (p: number) => void): Promise<void> {
    try {
      const list = ids.filter((id, i) => SONGS[id] && ids.indexOf(id) === i);
      if (!list.length) {
        onProgress?.(1);
        return;
      }
      const report = () => {
        if (!onProgress) return;
        let sum = 0;
        for (const id of list) sum += this.tracks.has(id) ? 1 : this.pending.get(id)?.progress ?? 0;
        try {
          onProgress(clamp(sum / list.length, 0, 1));
        } catch {
          /* ignore */
        }
      };
      const timer = onProgress ? setInterval(report, 100) : null;
      try {
        for (const id of list) {
          await this.ensure(id, false);
          report();
        }
      } finally {
        if (timer) clearInterval(timer);
        report();
      }
    } catch {
      /* ignore */
    }
  }

  playMusic(id: MusicId, opts?: { fade?: number; restart?: boolean }): void {
    try {
      if (!SONGS[id]) return;
      const fade = clamp(num(opts?.fade, 1), 0, 30);
      if (!opts?.restart) {
        if (this.current?.id === id) {
          this.wanted = null; // cancel any other pending request, keep playing
          return;
        }
        if (this.wanted === id) return;
      }
      this.wanted = id;
      this.wantedFade = fade;
      if (!this.ctx) {
        void this.ensure(id, true); // warm up; starts on unlock
        return;
      }
      const t = this.tracks.get(id);
      if (t) {
        this.startTrack(t, fade);
        return;
      }
      void this.ensure(id, true).then((tr) => {
        if (tr && this.wanted === id && this.ctx) this.startTrack(tr, fade);
      });
    } catch {
      /* ignore */
    }
  }

  stopMusic(fade = 1): void {
    try {
      this.wanted = null;
      if (this.current && this.ctx) this.fadeOut(this.current, clamp(num(fade, 1), 0.01, 30));
      this.current = null;
    } catch {
      /* ignore */
    }
  }

  setMusicMuffled(on: boolean): void {
    this.muffled = on;
    const ctx = this.ctx;
    if (!ctx || !this.muffle) return;
    try {
      const f = this.muffle.frequency;
      const now = ctx.currentTime;
      const top = Math.min(20000, ctx.sampleRate * 0.45);
      f.cancelScheduledValues(now);
      f.setValueAtTime(Math.max(20, f.value), now);
      f.exponentialRampToValueAtTime(on ? 700 : top, now + (on ? 0.25 : 0.35));
    } catch {
      /* ignore */
    }
  }

  duckMusic(amount: number, seconds: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.duck) return;
    try {
      const g = this.duck.gain;
      const now = ctx.currentTime;
      const target = clamp(1 - clamp(num(amount, 0), 0, 1), 0.0001, 1);
      const hold = clamp(num(seconds, 0), 0, 600);
      const anyG = g as AudioParam & { cancelAndHoldAtTime?: (t: number) => void };
      if (anyG.cancelAndHoldAtTime) anyG.cancelAndHoldAtTime(now);
      else {
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
      }
      g.linearRampToValueAtTime(target, now + 0.06);
      g.setValueAtTime(target, now + 0.06 + hold);
      g.linearRampToValueAtTime(1, now + 0.06 + hold + 0.5);
    } catch {
      /* ignore */
    }
  }

  private startTrack(t: Track, fade: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicIn) return;
    const buf = this.bufferOf(t);
    if (!buf) return;
    t.used = performance.now();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (t.loop) {
      src.loop = true;
      src.loopStart = t.loopStart;
      src.loopEnd = t.loopEnd;
    }
    const g = ctx.createGain();
    const now = ctx.currentTime;
    if (fade > 0.001) {
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(1, now + fade);
    } else g.gain.value = 1;
    src.connect(g);
    g.connect(this.musicIn);
    src.start(now + 0.01);
    if (this.current) this.fadeOut(this.current, Math.max(0.01, fade));
    const playing: Playing = { id: t.id, src, gain: g };
    this.current = playing;
    if (this.wanted === t.id) this.wanted = null;
    src.onended = () => {
      try {
        src.disconnect();
        g.disconnect();
      } catch {
        /* ignore */
      }
      if (this.current === playing) this.current = null;
    };
  }

  private fadeOut(p: Playing, fade: number): void {
    const ctx = this.ctx as AudioContext;
    const now = ctx.currentTime;
    try {
      p.gain.gain.cancelScheduledValues(now);
      p.gain.gain.setValueAtTime(p.gain.gain.value, now);
      p.gain.gain.linearRampToValueAtTime(0, now + fade);
      p.src.stop(now + fade + 0.05);
    } catch {
      /* ignore */
    }
  }

  private bufferOf(t: Track): AudioBuffer | null {
    if (t.buffer) return t.buffer;
    const ctx = this.ctx;
    if (!ctx || !t.raw) return null;
    try {
      const b = ctx.createBuffer(2, t.raw.left.length, t.sr);
      b.copyToChannel(f32(t.raw.left), 0);
      b.copyToChannel(f32(t.raw.right), 1);
      t.buffer = b;
      t.raw = null;
      return b;
    } catch {
      return null;
    }
  }

  /** Copy worker PCM into an AudioBuffer in small slices (keeps frames smooth). */
  private async toBufferChunked(t: Track): Promise<void> {
    const ctx = this.ctx;
    if (!ctx || !t.raw || t.buffer) return;
    try {
      const { left, right } = t.raw;
      const b = ctx.createBuffer(2, left.length, t.sr);
      const CH = 1 << 18;
      for (let a = 0; a < left.length; a += CH) {
        const e = Math.min(left.length, a + CH);
        b.copyToChannel(f32(left.subarray(a, e)), 0, a);
        b.copyToChannel(f32(right.subarray(a, e)), 1, a);
        await yieldToLoop();
      }
      t.buffer = b;
      t.raw = null;
    } catch {
      /* keep raw; bufferOf() retries synchronously */
    }
  }

  /** Render (or fetch) a track. Priority requests jump the queue. */
  private ensure(id: MusicId, priority: boolean): Promise<Track | null> {
    const have = this.tracks.get(id);
    if (have) return Promise.resolve(have);
    const p = this.pending.get(id);
    if (p) {
      if (priority) {
        const i = this.queue.indexOf(id);
        if (i > 0) {
          this.queue.splice(i, 1);
          this.queue.unshift(id);
        }
      }
      return p.promise;
    }
    let resolve!: (t: Track | null) => void;
    const promise = new Promise<Track | null>((r) => (resolve = r));
    this.pending.set(id, { promise, resolve, progress: 0 });
    if (priority) this.queue.unshift(id);
    else this.queue.push(id);
    void this.pump();
    return promise;
  }

  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    try {
      while (this.queue.length) {
        const id = this.queue.shift() as MusicId;
        const pend = this.pending.get(id);
        let track: Track | null = null;
        try {
          track = await this.renderTrack(id, (p) => {
            if (pend) pend.progress = p;
          });
        } catch {
          track = null;
        }
        if (track) {
          this.tracks.set(id, track);
          this.evict();
        }
        this.pending.delete(id);
        pend?.resolve(track);
      }
    } finally {
      this.pumping = false;
    }
  }

  private evict(): void {
    let total = 0;
    for (const t of this.tracks.values()) total += t.seconds;
    if (total <= MUSIC_CACHE_SECONDS) return;
    const order = [...this.tracks.values()].sort((a, b) => a.used - b.used);
    for (const t of order) {
      if (total <= MUSIC_CACHE_SECONDS) break;
      if (t.id === this.current?.id || t.id === this.wanted) continue;
      this.tracks.delete(t.id);
      total -= t.seconds;
    }
  }

  private async renderTrack(id: MusicId, onProgress: (p: number) => void): Promise<Track | null> {
    const song = SONGS[id];
    if (!song) return null;
    // never synthesize music above 48 kHz (192 kHz devices would quadruple memory and render time)
    const sr = Math.min(this.ctx?.sampleRate ?? DEFAULT_SR, DEFAULT_SR);
    // 1) worker (with the recorded instrument samples once they are installed there)
    if (this.musicWorker.usable) {
      this.rendering = id;
      const sampled = await this.waitBank(id);
      this.rendering = null;
      const msg = this.musicWorker.usable ? await this.workerRender(id, sr, onProgress) : null;
      if (msg) {
        const track: Track = {
          id,
          sr: msg.sr,
          buffer: null,
          raw: { left: msg.left, right: msg.right },
          loop: msg.loop,
          loopStart: msg.loopStart / msg.sr,
          loopEnd: msg.loopEnd / msg.sr,
          seconds: msg.length / msg.sr,
          used: performance.now(),
          sampled,
        };
        if (this.ctx) await this.toBufferChunked(track);
        return track;
      }
      this.musicWorker.fail();
    }
    // 2) main thread, time-sliced, rendering straight into an AudioBuffer when possible
    let buffer: AudioBuffer | null = null;
    const alloc = (length: number): [Float32Array, Float32Array] => {
      try {
        buffer = this.ctx ? this.ctx.createBuffer(2, length, sr) : new AudioBuffer({ length, numberOfChannels: 2, sampleRate: sr });
        return [buffer.getChannelData(0), buffer.getChannelData(1)];
      } catch {
        buffer = null;
        return [new Float32Array(length), new Float32Array(length)];
      }
    };
    const r = await renderSong(song, sr, { slicer: new Slicer(7), alloc, onProgress });
    return {
      id,
      sr,
      buffer,
      raw: buffer ? null : { left: r.left, right: r.right },
      loop: r.loop,
      loopStart: r.loopStart / sr,
      loopEnd: r.loopEnd / sr,
      seconds: r.length / sr,
      used: performance.now(),
      sampled: false,
    };
  }

  private workerRender(id: MusicId, sr: number, onProgress: (p: number) => void): Promise<MusicDone | null> {
    return new Promise((resolve) => {
      let heard = false;
      let done = false;
      const finish = (m: MusicDone | null) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(m);
      };
      // a worker that never answers (blocked by CSP etc.) → fall back to the main thread
      const timer = setTimeout(() => {
        if (!heard) finish(null);
      }, 8000);
      const ok = this.musicWorker.request({ type: 'music', id, sr }, (m) => {
        if (!m) {
          finish(null);
          return true;
        }
        heard = true;
        if (typeof m.progress === 'number') {
          onProgress(m.progress);
          return false;
        }
        finish(m.ok === true ? (m as unknown as MusicDone) : null);
        return true;
      });
      if (!ok) finish(null);
    });
  }

  // ------------------------------------------------------------------------------- sfx

  private sfxKey(id: SfxId, v: number): string {
    return id + '#' + v;
  }

  private makeSfxBuffer(id: SfxId, v: number): AudioBuffer | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    const key = this.sfxKey(id, v);
    const have = this.sfxBufs.get(key);
    if (have) return have;
    try {
      const r = renderSfx(id, ctx.sampleRate, v);
      const b = ctx.createBuffer(r.r ? 2 : 1, r.l.length, ctx.sampleRate);
      b.copyToChannel(f32(r.l), 0);
      if (r.r) b.copyToChannel(f32(r.r), 1);
      this.sfxBufs.set(key, b);
      return b;
    } catch {
      return null;
    }
  }

  private storeSfx(id: SfxId, v: number, l: Float32Array, r: Float32Array | null): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const key = this.sfxKey(id, v);
    if (this.sfxBufs.has(key)) return;
    try {
      const b = ctx.createBuffer(r ? 2 : 1, l.length, ctx.sampleRate);
      b.copyToChannel(f32(l), 0);
      if (r) b.copyToChannel(f32(r), 1);
      this.sfxBufs.set(key, b);
    } catch {
      /* ignore */
    }
  }

  private async prerenderSfx(): Promise<void> {
    if (this.sfxPrerendering || !this.ctx) return;
    this.sfxPrerendering = true;
    // most frequent first
    const first: SfxId[] = ['hit', 'pickup_xp', 'enemy_death', 'player_hurt', 'ui_hover', 'ui_click', 'pickup_coin', 'hit_crit', 'enemy_shoot'];
    const order = [...first, ...SFX_IDS.filter((id) => !first.includes(id))];
    const list: Array<[SfxId, number]> = [];
    for (const id of order) for (let v = 0; v < (SFX[id].variants ?? 1); v++) list.push([id, v]);
    const sr = this.ctx.sampleRate;
    const viaWorker = await new Promise<boolean>((resolve) => {
      let any = false;
      const ok = this.fxWorker.request({ type: 'sfx', sr, list }, (m) => {
        if (!m) {
          resolve(any);
          return true;
        }
        if (typeof m.sfx === 'string') {
          any = true;
          this.storeSfx(m.sfx as SfxId, m.v as number, m.l as Float32Array, (m.r as Float32Array | null) ?? null);
          return false;
        }
        resolve(m.ok === true);
        return true;
      });
      if (!ok) resolve(false);
    });
    if (viaWorker && list.every(([id, v]) => this.sfxBufs.has(this.sfxKey(id, v)))) return;
    // fallback: main thread, time-sliced
    const sl = new Slicer(5);
    for (const [id, v] of list) {
      this.makeSfxBuffer(id, v);
      if (sl.due()) await sl.yield();
    }
  }

  sfx(id: SfxId, opts?: SfxOpts): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxVol) return;
    try {
      const def = SFX[id];
      if (!def) return;
      const now = ctx.currentTime;
      let st = this.sfxState.get(id);
      if (!st) {
        st = { last: -1, voices: [], lastVariant: -1 };
        this.sfxState.set(id, st);
      }
      if (now - st.last < (def.minGap ?? 0.02)) return;
      st.voices = st.voices.filter((v) => v.end > now);
      const maxV = def.maxVoices ?? 4;
      if (st.voices.length >= maxV) {
        if (def.drop) return;
        const old = st.voices.shift();
        if (old) this.killVoice(old, now);
      }
      if (this.activeVoices >= MAX_SFX_VOICES) return;
      const nv = def.variants ?? 1;
      let variant = nv > 1 ? Math.floor(Math.random() * nv) : 0;
      if (nv > 1 && variant === st.lastVariant) variant = (variant + 1) % nv;
      st.lastVariant = variant;
      const buf = this.makeSfxBuffer(id, variant);
      if (!buf) return;
      const pv = def.pitchVar ?? 0.03;
      const vv = def.volVar ?? 0.06;
      const rate = clamp(num(opts?.pitch, 1) * (1 + (Math.random() * 2 - 1) * pv), 0.25, 4);
      const vol = clamp(num(opts?.volume, 1), 0, 2) * (1 + (Math.random() * 2 - 1) * vv);
      if (vol <= 0.001) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      let pan: StereoPannerNode | null = null;
      const p = num(opts?.pan, 0);
      if (Math.abs(p) > 0.01 && typeof ctx.createStereoPanner === 'function') {
        pan = ctx.createStereoPanner();
        pan.pan.value = clamp(p, -1, 1);
        g.connect(pan);
        pan.connect(this.sfxVol);
      } else g.connect(this.sfxVol);
      const voice: Voice = { src, gain: g, end: now + buf.duration / rate + 0.02 };
      st.voices.push(voice);
      st.last = now;
      this.activeVoices++;
      src.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
        try {
          src.disconnect();
          g.disconnect();
          pan?.disconnect();
        } catch {
          /* ignore */
        }
      };
      src.start(now);
    } catch {
      /* ignore */
    }
  }

  private killVoice(v: Voice, now: number): void {
    try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueAtTime(v.gain.gain.value, now);
      v.gain.gain.linearRampToValueAtTime(0, now + 0.015);
      v.src.stop(now + 0.02);
    } catch {
      /* ignore */
    }
  }

  // ------------------------------------------------------------------------------- speech

  voice(text: string, moodIn: VoiceMood): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.voiceGain) return;
    const mood: VoiceMood = MOODS.includes(moodIn) ? moodIn : 'happy';
    try {
      const now = ctx.currentTime;
      if (now - this.lastSpeech < 0.08) return;
      this.lastSpeech = now;
      const line = String(text ?? '').slice(0, 64);
      const key = mood + '|' + line;
      const cached = this.voiceCache.get(key);
      if (cached) {
        this.playSpeech(cached);
        return;
      }
      const token = ++this.speechToken;
      const asked = performance.now();
      const viaWorker = this.fxWorker.request({ type: 'voice', sr: ctx.sampleRate, text: line, mood }, (m) => {
        if (m && m.ok === true && m.data instanceof Float32Array) {
          const buf = this.cacheVoice(key, m.data);
          // play only if this is still the latest line and it isn't stale
          if (buf && token === this.speechToken && performance.now() - asked < 600) this.playSpeech(buf);
        } else if (token === this.speechToken) {
          try {
            const buf = this.cacheVoice(key, renderVoice(ctx.sampleRate, line, mood));
            if (buf) this.playSpeech(buf);
          } catch {
            /* ignore */
          }
        }
        return true;
      });
      if (!viaWorker) {
        const buf = this.cacheVoice(key, renderVoice(ctx.sampleRate, line, mood));
        if (buf) this.playSpeech(buf);
      }
    } catch {
      /* ignore */
    }
  }

  private cacheVoice(key: string, data: Float32Array): AudioBuffer | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    try {
      const buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.copyToChannel(f32(data), 0);
      this.voiceCache.set(key, buf);
      if (this.voiceCache.size > 24) this.voiceCache.delete(this.voiceCache.keys().next().value as string);
      return buf;
    } catch {
      return null;
    }
  }

  private playSpeech(buf: AudioBuffer): void {
    const ctx = this.ctx;
    if (!ctx || !this.voiceGain) return;
    const now = ctx.currentTime;
    if (this.speech && this.speech.end > now) this.killVoice(this.speech, now);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 1;
    src.connect(g);
    g.connect(this.voiceGain);
    src.onended = () => {
      try {
        src.disconnect();
        g.disconnect();
      } catch {
        /* ignore */
      }
    };
    src.start(now);
    this.speech = { src, gain: g, end: now + buf.duration };
  }
}
