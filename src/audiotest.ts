/**
 * Dev-only audio test page (/audiotest.html): play every track / sfx / voice, and an automation
 * hook (window.__at) used by headless measurement scripts. Not part of the game build.
 */
import './audio/index';
import { audio, type MusicId, type SfxId, type VoiceMood } from './audio/audio';
import { Slicer } from './audio/dsp';
import { renderSong } from './audio/render';
import { renderSfx, SFX, SFX_IDS } from './audio/sfx';
import { SONGS } from './audio/songs/index';
import { renderVoice } from './audio/voice';
import { bankTransfer, loadSampleBank } from './audio/samplebank';
import RenderWorker from './audio/worker?worker&inline';

const root = document.getElementById('root') as HTMLDivElement;
const logEl = document.createElement('div');
logEl.id = 'log';
const log = (s: string) => {
  logEl.textContent = s + '\n' + (logEl.textContent ?? '').slice(0, 6000);
};
const h = (t: string) => {
  const e = document.createElement('h2');
  e.textContent = t;
  root.appendChild(e);
};
const btn = (label: string, fn: () => void, parent: HTMLElement = root) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = () => {
    audio.unlock();
    fn();
  };
  parent.appendChild(b);
  return b;
};

const TRACKS = Object.keys(SONGS) as MusicId[];
h('KITCHEN FIGHT — audio test (click anything to unlock)');
btn('unlock', () => log('ready=' + audio.ready));
btn('preload all', () => {
  const t0 = performance.now();
  void audio.preload(TRACKS, (p) => log(`preload ${(p * 100).toFixed(0)}%`)).then(() => log(`preloaded in ${(performance.now() - t0).toFixed(0)} ms`));
});
h('Music');
for (const id of TRACKS) btn(id, () => audio.playMusic(id));
btn('stop', () => audio.stopMusic());
let muf = false;
btn('muffle', () => {
  muf = !muf;
  audio.setMusicMuffled(muf);
});
btn('duck 0.6 / 1s', () => audio.duckMusic(0.6, 1));
const vols = document.createElement('div');
root.appendChild(vols);
const sliders = ['master', 'music', 'sfx'].map((name) => {
  const l = document.createElement('label');
  l.textContent = name + ' ';
  const s = document.createElement('input');
  s.type = 'range';
  s.min = '0';
  s.max = '1';
  s.step = '0.01';
  s.value = name === 'master' ? '1' : name === 'music' ? '0.8' : '0.9';
  s.oninput = () => audio.setVolumes(+sliders[0].value, +sliders[1].value, +sliders[2].value);
  l.appendChild(s);
  vols.appendChild(l);
  return s;
});
h('SFX');
for (const id of SFX_IDS) btn(id, () => audio.sfx(id, { pan: (Math.random() - 0.5) * 0.6 }));
btn('xp combo 1→2', () => {
  for (let i = 0; i < 12; i++) setTimeout(() => audio.sfx('pickup_xp', { pitch: 1 + i / 11 }), i * 70);
});
btn('hit storm', () => {
  for (let i = 0; i < 60; i++) setTimeout(() => audio.sfx(i % 9 ? 'hit' : 'enemy_death', { pan: Math.random() * 2 - 1, volume: 0.8 }), i * 12);
});
h('Voice');
const txt = document.createElement('input');
txt.type = 'text';
txt.value = 'Mamma mia, che schifo!';
root.appendChild(txt);
for (const m of ['angry', 'happy', 'surprised', 'nonna', 'boss', 'cat'] as VoiceMood[]) btn(m, () => audio.voice(txt.value, m));
root.appendChild(logEl);

// ------------------------------------------------------------------------------ automation API

function wavB64(chans: Float32Array[], sr: number): string {
  const n = chans[0].length;
  const nc = chans.length;
  const buf = new ArrayBuffer(44 + n * nc * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + n * nc * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, nc, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * nc * 2, true);
  v.setUint16(32, nc * 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, n * nc * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < nc; c++) {
      const x = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(o, Math.round(x * 32767), true);
      o += 2;
    }
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function seamCheck(L: Float32Array, R: Float32Array, ls: number, le: number, sr: number) {
  const n = Math.min(Math.round(0.5 * sr), ls);
  let maxd = 0;
  for (let k = 1; k <= n; k++) {
    maxd = Math.max(maxd, Math.abs(L[le - k] - L[ls - k]), Math.abs(R[le - k] - R[ls - k]));
  }
  const jump = Math.max(Math.abs(L[ls] - L[le - 1]), Math.abs(R[ls] - R[le - 1]));
  let typ = 0;
  for (let i = le - 4000; i < le - 1; i++) typ = Math.max(typ, Math.abs(L[i + 1] - L[i]));
  return { seamMaxDiff: maxd, jump, typStep: typ };
}

let lastLong = 0;
(function frameWatch() {
  // longest main-thread gap between animation frames (jank detector)
  let prev = performance.now();
  const tick = () => {
    const t = performance.now();
    lastLong = Math.max(lastLong, t - prev);
    prev = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

const at = {
  tracks: TRACKS,
  sfxIds: SFX_IDS,
  sfxVariants: (id: SfxId) => SFX[id].variants ?? 1,
  async renderTrack(id: MusicId, sr = 48000, wantWav = true) {
    const slicer = new Slicer(8);
    const t0 = performance.now();
    const r = await renderSong(SONGS[id], sr, { slicer });
    const ms = performance.now() - t0;
    const seam = r.loop ? seamCheck(r.left, r.right, r.loopStart, r.loopEnd, sr) : null;
    let nan = 0;
    for (let i = 0; i < r.length; i += 7) if (!Number.isFinite(r.left[i]) || !Number.isFinite(r.right[i])) nan++;
    return {
      id,
      sr,
      length: r.length,
      seconds: r.length / sr,
      loop: r.loop,
      loopStart: r.loopStart,
      loopEnd: r.loopEnd,
      ms,
      maxSliceMs: r.stats.maxSliceMs,
      maxPhase: r.stats.maxPhase,
      synthMs: r.stats.synthMs,
      mixMs: r.stats.mixMs,
      revMs: r.stats.revMs,
      peak: r.stats.peak,
      clipped: r.stats.clipped,
      warnings: r.stats.warnings,
      nan,
      seam,
      wav: wantWav ? wavB64([r.left, r.right], sr) : '',
    };
  },
  async renderTrackWorker(id: MusicId, sr = 48000) {
    const w = new RenderWorker();
    lastLong = 0;
    const t0 = performance.now();
    const res = await new Promise<{ ms: number; ok: boolean }>((resolve) => {
      w.onmessage = (e: MessageEvent) => {
        const m = e.data as { ok?: boolean; ms?: number; progress?: number };
        if (m.progress !== undefined) return;
        resolve({ ok: !!m.ok, ms: m.ms ?? -1 });
      };
      w.postMessage({ type: 'music', seq: 1, id, sr });
    });
    const wall = performance.now() - t0;
    w.terminate();
    return { id, ...res, wall, longestFrameGap: lastLong };
  },
  /** All tracks through ONE persistent worker (warm JIT + shared sample cache), like the game. */
  async renderAllWarm(sr = 48000) {
    const w = new RenderWorker();
    const out: Array<{ id: MusicId; ms: number; wall: number }> = [];
    lastLong = 0;
    for (const id of TRACKS) {
      const t0 = performance.now();
      const ms = await new Promise<number>((resolve) => {
        w.onmessage = (e: MessageEvent) => {
          const m = e.data as { ms?: number; progress?: number };
          if (m.progress !== undefined) return;
          resolve(m.ms ?? -1);
        };
        w.postMessage({ type: 'music', seq: 1, id, sr });
      });
      out.push({ id, ms: Math.round(ms), wall: Math.round(performance.now() - t0) });
    }
    w.terminate();
    return { tracks: out, longestFrameGap: lastLong };
  },
  renderSfx(id: SfxId, variant = 0, sr = 48000) {
    const t0 = performance.now();
    const r = renderSfx(id, sr, variant);
    const ms = performance.now() - t0;
    let peak = 0;
    let nan = 0;
    for (const c of r.r ? [r.l, r.r] : [r.l])
      for (let i = 0; i < c.length; i++) {
        if (!Number.isFinite(c[i])) nan++;
        else peak = Math.max(peak, Math.abs(c[i]));
      }
    return { id, variant, ms, seconds: r.l.length / sr, peak, nan, wav: wavB64(r.r ? [r.l, r.r] : [r.l], sr) };
  },
  renderVoice(text: string, mood: VoiceMood, sr = 48000) {
    const t0 = performance.now();
    const d = renderVoice(sr, text, mood);
    return { ms: performance.now() - t0, seconds: d.length / sr, wav: wavB64([d], sr) };
  },
  /**
   * Recorded instrument samples, end to end in this browser: decode the MP3 sprites (this
   * browser's decoder), install them in a fresh render worker, render a track there.
   * Returns timings, decoder shifts found by the marker alignment, memory and the WAV.
   */
  async samplerTrack(id: MusicId = 'kitchen', sr = 48000, wantWav = true) {
    const w = new RenderWorker();
    let seq = 0;
    const waiters = new Map<number, (m: Record<string, unknown>) => void>();
    w.onmessage = (e: MessageEvent) => {
      const m = e.data as Record<string, unknown>;
      if (typeof m.progress === 'number') return;
      const f = waiters.get(m.seq as number);
      if (f) {
        waiters.delete(m.seq as number);
        f(m);
      }
    };
    const ask = (msg: Record<string, unknown>, transfer?: Transferable[]) =>
      new Promise<Record<string, unknown>>((resolve) => {
        const s = ++seq;
        waiters.set(s, resolve);
        w.postMessage({ ...msg, seq: s }, transfer ?? []);
      });
    lastLong = 0;
    const t0 = performance.now();
    const acks: Array<Promise<Record<string, unknown>>> = [];
    const loaded = await loadSampleBank(2, (def, pcm) => {
      acks.push(ask({ type: 'bankSet', set: def, pcm }, bankTransfer(pcm)));
    });
    const tDecoded = performance.now();
    await Promise.all(acks);
    const done = await ask({ type: 'bankDone' });
    const tReady = performance.now();
    const r = await ask({ type: 'music', id, sr });
    const tRendered = performance.now();
    w.terminate();
    const left = r.left as Float32Array;
    const right = r.right as Float32Array;
    return {
      id,
      decodeMs: tDecoded - t0,
      installMs: tReady - tDecoded,
      readyMs: tReady - t0,
      renderMs: tRendered - tReady,
      workerRenderMs: r.ms,
      stats: loaded?.stats ?? null,
      report: done.report,
      longestFrameGap: lastLong,
      length: left.length,
      loopStart: r.loopStart,
      loopEnd: r.loopEnd,
      wav: wantWav ? wavB64([left, right], sr) : '',
    };
  },
  /** Engine status: sample bank state + which cached tracks used recorded samples. */
  samplerStatus() {
    return (audio as unknown as { samplerStatus?: () => unknown }).samplerStatus?.() ?? null;
  },
  /** Exercise the public API end-to-end on the real AudioContext. */
  async apiSmoke() {
    const errors: string[] = [];
    const onErr = (e: ErrorEvent) => errors.push(String(e.message));
    window.addEventListener('error', onErr);
    // before unlock: everything must be a no-op
    audio.sfx('hit');
    audio.voice('ciao', 'happy');
    audio.duckMusic(0.5, 1);
    audio.setMusicMuffled(true);
    audio.setMusicMuffled(false);
    audio.setVolumes(1, 0.8, 0.9);
    const readyBefore = audio.ready;
    audio.unlock();
    await new Promise((r) => setTimeout(r, 300));
    const readyAfter = audio.ready;
    lastLong = 0;
    const t0 = performance.now();
    await audio.preload(['title'], () => {});
    const preloadMs = performance.now() - t0;
    audio.playMusic('title');
    await new Promise((r) => setTimeout(r, 400));
    for (let i = 0; i < 200; i++) audio.sfx(SFX_IDS[i % SFX_IDS.length], { pan: Math.random() * 2 - 1, pitch: 1 + Math.random(), volume: Math.random() });
    for (const m of ['angry', 'happy', 'surprised', 'nonna', 'boss', 'cat'] as VoiceMood[]) audio.voice('Mamma mia!', m);
    audio.duckMusic(0.6, 0.5);
    audio.setMusicMuffled(true);
    await new Promise((r) => setTimeout(r, 300));
    audio.setMusicMuffled(false);
    audio.playMusic('kitchen', { fade: 0.5 });
    const t1 = performance.now();
    while (performance.now() - t1 < 20000) {
      await new Promise((r) => setTimeout(r, 100));
      if ((audio as unknown as { current?: { id: string } }).current?.id === 'kitchen') break;
    }
    const switchMs = performance.now() - t1;
    audio.stopMusic(0.3);
    window.removeEventListener('error', onErr);
    return { readyBefore, readyAfter, preloadMs, switchMs, longestFrameGap: lastLong, errors };
  },
};
(window as unknown as { __at: typeof at; __audio: unknown }).__at = at;
(window as unknown as { __audio: unknown }).__audio = audio;
log('audio test ready — tracks: ' + TRACKS.join(', '));
