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

type WorkerMsg =
  | { seq: number; progress: number }
  | { seq: number; ok: true; left: Float32Array; right: Float32Array; loop: boolean; loopStart: number; loopEnd: number; length: number; sr: number; ms: number }
  | { seq: number; ok: false; error: string };

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
  private worker: Worker | null = null;
  private workerBroken = false;
  private seq = 0;
  private workerJobs = new Map<number, { resolve: (m: WorkerMsg | null) => void; onProgress: (p: number) => void }>();

  // sfx
  private sfxBufs = new Map<string, AudioBuffer>();
  private sfxState = new Map<SfxId, { last: number; voices: Voice[]; lastVariant: number }>();
  private activeVoices = 0;
  private sfxPrerendering = false;
  private speech: Voice | null = null;
  private lastSpeech = 0;
  private voiceCache = new Map<string, AudioBuffer>();

  private suspendedByVisibility = false;
  private listening = false;

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
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
    this.vol = { master: clamp(+master || 0, 0, 1), music: clamp(+music || 0, 0, 1), sfx: clamp(+sfx || 0, 0, 1) };
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
      const fade = Math.max(0, opts?.fade ?? 1);
      if (!opts?.restart) {
        if (this.wanted === id) return;
        if (!this.wanted && this.current?.id === id) return;
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
      if (this.current && this.ctx) this.fadeOut(this.current, Math.max(0.01, fade));
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
      const target = clamp(1 - clamp(amount, 0, 1), 0.0001, 1);
      const hold = Math.max(0, seconds);
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
      b.copyToChannel(t.raw.left, 0);
      b.copyToChannel(t.raw.right, 1);
      t.buffer = b;
      t.raw = null;
      return b;
    } catch {
      return null;
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
    const sr = this.ctx?.sampleRate ?? DEFAULT_SR;
    // 1) worker
    const w = this.getWorker();
    if (w) {
      const msg = await this.workerRender(w, id, sr, onProgress);
      if (msg && 'ok' in msg && msg.ok) {
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
        };
        if (this.ctx) {
          await yieldToLoop();
          this.bufferOf(track);
        }
        return track;
      }
      this.workerBroken = true;
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
    };
  }

  private getWorker(): Worker | null {
    if (this.workerBroken) return null;
    if (this.worker) return this.worker;
    try {
      const w = new RenderWorker();
      w.onmessage = (e: MessageEvent<WorkerMsg>) => {
        const m = e.data;
        const job = this.workerJobs.get(m.seq);
        if (!job) return;
        if ('progress' in m) {
          job.onProgress(m.progress);
          return;
        }
        this.workerJobs.delete(m.seq);
        job.resolve(m);
      };
      w.onerror = () => {
        this.workerBroken = true;
        for (const j of this.workerJobs.values()) j.resolve(null);
        this.workerJobs.clear();
        try {
          w.terminate();
        } catch {
          /* ignore */
        }
        this.worker = null;
      };
      this.worker = w;
      return w;
    } catch {
      this.workerBroken = true;
      return null;
    }
  }

  private workerRender(w: Worker, id: MusicId, sr: number, onProgress: (p: number) => void): Promise<WorkerMsg | null> {
    return new Promise((resolve) => {
      const seq = ++this.seq;
      let done = false;
      let heard = false;
      const finish = (m: WorkerMsg | null) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(m);
      };
      // if the worker never answers at all (blocked by CSP etc.), fall back
      const timer = setTimeout(() => {
        if (!heard) {
          this.workerJobs.delete(seq);
          finish(null);
        }
      }, 8000);
      this.workerJobs.set(seq, {
        resolve: finish,
        onProgress: (p) => {
          heard = true;
          onProgress(p);
        },
      });
      try {
        w.postMessage({ seq, id, sr });
      } catch {
        finish(null);
      }
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
      b.copyToChannel(r.l, 0);
      if (r.r) b.copyToChannel(r.r, 1);
      this.sfxBufs.set(key, b);
      return b;
    } catch {
      return null;
    }
  }

  private async prerenderSfx(): Promise<void> {
    if (this.sfxPrerendering) return;
    this.sfxPrerendering = true;
    const sl = new Slicer(5);
    // most frequent first
    const first: SfxId[] = ['hit', 'pickup_xp', 'enemy_death', 'player_hurt', 'ui_hover', 'ui_click', 'pickup_coin', 'hit_crit'];
    const order = [...first, ...SFX_IDS.filter((id) => !first.includes(id))];
    for (const id of order) {
      const n = SFX[id].variants ?? 1;
      for (let v = 0; v < n; v++) {
        this.makeSfxBuffer(id, v);
        if (sl.due()) await sl.yield();
      }
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
      const rate = clamp((opts?.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * pv), 0.25, 4);
      const vol = clamp(opts?.volume ?? 1, 0, 2) * (1 + (Math.random() * 2 - 1) * vv);
      if (vol <= 0.001) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      let pan: StereoPannerNode | null = null;
      const p = opts?.pan ?? 0;
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

  voice(text: string, mood: VoiceMood): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.voiceGain) return;
    try {
      const now = ctx.currentTime;
      if (now - this.lastSpeech < 0.08) return;
      this.lastSpeech = now;
      const key = mood + '|' + String(text ?? '').slice(0, 64);
      let buf = this.voiceCache.get(key);
      if (!buf) {
        const data = renderVoice(ctx.sampleRate, String(text ?? ''), mood);
        buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
        buf.copyToChannel(data, 0);
        this.voiceCache.set(key, buf);
        if (this.voiceCache.size > 24) this.voiceCache.delete(this.voiceCache.keys().next().value as string);
      }
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
    } catch {
      /* ignore */
    }
  }
}
