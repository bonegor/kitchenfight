// Audio 2.0 SFX measurements, run through the REAL engine (src/audio/engine.ts) in Chromium.
//
//   npx vite --port 5183 --strictPort --config scripts/vite.agent.config.ts   (in another shell)
//   node scripts/audio/sfx_measure.mjs [--port 5183] [--out <dir>] [--ids a,b] [--wav]
//
// 1. per id (offline, sample-accurate): the engine is unlocked on an OfflineAudioContext (AudioContext patched),
//    every id is fired once through engine.sfx() and the master output is measured: onset latency after the call,
//    LK100 / RMS / peak / true peak / duration / clipping, for the recorded version AND the synthesized one
//    (recorded disabled), plus proof that the recorded buffer (and the synth layer, where designed) was played.
// 2. stress (offline): 20 s of a busy fight at 60 fps with music: dozens of hits + XP pickups per second with combo
//    pitch ramps, every weapon on its cooldown, enemy deaths/shots/burns/explosions, and rare important sounds;
//    reports clipping, loudness, voice counts, drops (rate limit / voice cap) and render CPU.
// 3. realtime: a real AudioContext in Chromium: decode time, per-asset decoder delay trimmed, recorded buffers
//    used for every id, main-thread cost of sfx() calls, output level through an AnalyserNode.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i >= 0 ? process.argv[i + 1] : d;
};
const port = arg('port', process.env.PORT || '5183');
const outDir = arg('out', path.join(process.cwd(), 'sfx-measure-out'));
const onlyIds = (arg('ids', '') || '').split(',').filter(Boolean);
const wantWav = process.argv.includes('--wav');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text());
});
// a blank page on the dev server's origin that only loads the audio modules
await page.route('**/__sfxmeasure.html', (r) =>
  r.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><meta charset="utf-8"><title>sfx measure</title><script type="module">
      window.__mods = Promise.all([import('/src/audio/engine.ts'), import('/src/audio/sfx.ts'), import('/src/audio/sfxsamples.ts')])
        .then(([e, s, r]) => ({ AudioEngine: e.AudioEngine, SFX: s.SFX, SFX_IDS: s.SFX_IDS, SfxSamples: r.SfxSamples }));
    </script>`,
  }),
);
await page.goto(`http://localhost:${port}/__sfxmeasure.html`);
await page.waitForFunction(() => !!window.__mods);

// ------------------------------------------------------------------------------------------------ shared helpers
await page.evaluate(() => {
  const SR = 48000;
  // ITU-R BS.1770 K-weighting at 48 kHz
  const kw = (x) => {
    const y = new Float64Array(x.length);
    let a1 = 0, a2 = 0, b1 = 0, b2 = 0, c1 = 0, c2 = 0, d1 = 0, d2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = x[i];
      const s = 1.53512485958697 * v - 2.69169618940638 * a1 + 1.19839281085285 * a2 + 1.69065929318241 * b1 - 0.73248077421585 * b2;
      a2 = a1; a1 = v; b2 = b1; b1 = s;
      const t = s - 2 * c1 + c2 + 1.99004745483398 * d1 - 0.99007225036621 * d2;
      c2 = c1; c1 = s; d2 = d1; d1 = t;
      y[i] = t;
    }
    return y;
  };
  const db = (v) => 20 * Math.log10(Math.max(v, 1e-12));
  /** LK over a sliding window (max), channels summed */
  const lkMax = (chs, win = 0.1, from = 0, to = chs[0].length) => {
    const n = Math.round(win * SR);
    const p = new Float64Array(to - from);
    for (const c of chs) {
      const z = kw(c.subarray(from, to));
      for (let i = 0; i < z.length; i++) p[i] += z[i] * z[i];
    }
    let acc = 0, best = 0;
    for (let i = 0; i < p.length; i++) {
      acc += p[i];
      if (i >= n) acc -= p[i - n];
      if (i >= n - 1 || i === p.length - 1) best = Math.max(best, acc / n);
    }
    return -0.691 + 10 * Math.log10(Math.max(best, 1e-15));
  };
  /** integrated-ish loudness of a whole stretch (400 ms blocks, -70 abs / -10 rel gates) */
  const lufs = (chs, from = 0, to = chs[0].length) => {
    const n = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
    const zs = chs.map((c) => kw(c.subarray(from, to)));
    const bl = [];
    for (let a = 0; a + n <= to - from; a += hop) {
      let s = 0;
      for (const z of zs) for (let i = a; i < a + n; i++) s += z[i] * z[i];
      bl.push(s / n);
    }
    const L = (v) => -0.691 + 10 * Math.log10(Math.max(v, 1e-15));
    const g1 = bl.filter((v) => L(v) > -70);
    if (!g1.length) return -99;
    const rel = L(g1.reduce((a, b) => a + b, 0) / g1.length) - 10;
    const g2 = g1.filter((v) => L(v) > rel);
    return L(g2.reduce((a, b) => a + b, 0) / g2.length);
  };
  /** true peak (4x oversampled, windowed-sinc interpolation) */
  const truePeak = (chs) => {
    let tp = 0;
    const taps = 16;
    for (const c of chs) {
      for (let i = 0; i < c.length; i++) {
        const a = Math.abs(c[i]);
        if (a > tp) tp = a;
        if (a < tp * 0.5) continue; // only near candidate peaks
        for (const f of [0.25, 0.5, 0.75]) {
          let s = 0;
          for (let k = -taps + 1; k <= taps; k++) {
            const j = i + k;
            if (j < 0 || j >= c.length) continue;
            const x = k - f;
            const w = 0.5 + 0.5 * Math.cos((Math.PI * x) / (taps + 1));
            s += c[j] * (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)) * w;
          }
          if (Math.abs(s) > tp) tp = Math.abs(s);
        }
      }
    }
    return tp;
  };
  /** measure a rendered output from frame `at` (the call) */
  const measure = (chs, at) => {
    const n = chs[0].length;
    let pk = 0, clip = 0;
    for (const c of chs) for (let i = 0; i < n; i++) {
      const a = Math.abs(c[i]);
      if (a > pk) pk = a;
      if (a >= 1) clip++;
    }
    const first = (thrDb) => {
      const t = pk * Math.pow(10, thrDb / 20);
      let best = n;
      for (const c of chs) for (let i = at; i < Math.min(n, best); i++) if (Math.abs(c[i]) > t) { best = i; break; }
      return best;
    };
    const last = (thrDb) => {
      const t = pk * Math.pow(10, thrDb / 20);
      let best = 0;
      for (const c of chs) for (let i = n - 1; i > best; i--) if (Math.abs(c[i]) > t) { best = i; break; }
      return best;
    };
    let ss = 0, cnt = 0;
    const e = last(-60);
    for (const c of chs) for (let i = at; i <= e; i++) { ss += c[i] * c[i]; cnt++; }
    return {
      latency50: ((first(-50) - at) / SR) * 1000,
      latency20: ((first(-20) - at) / SR) * 1000,
      dur: (e - at) / SR,
      lk: lkMax(chs),
      rms: db(Math.sqrt(ss / Math.max(1, cnt))),
      peak: db(pk),
      tp: db(truePeak(chs)),
      clip,
    };
  };
  window.__h = { SR, kw, db, lkMax, lufs, truePeak, measure };

  /**
   * An engine unlocked on an OfflineAudioContext. The render has 4 channels: 0-1 = the final output (after the
   * engine's master compressor), 2-3 = the master bus before the compressor (the SFX path itself).
   * Decoded recordings and synthesized buffers are shared between engines (AudioBuffers are context-free).
   */
  let shared = null;
  window.__offlineEngine = async (seconds, { music = null, hideRec = null } = {}) => {
    const { AudioEngine, SFX, SFX_IDS } = await window.__mods;
    const off = new OfflineAudioContext(4, Math.ceil(seconds * SR), SR);
    off.destination.channelCount = 4;
    off.destination.channelCountMode = 'explicit';
    off.destination.channelInterpretation = 'discrete';
    Object.defineProperty(off, 'state', { get: () => 'running', configurable: true });
    const made = [];
    const cbs = off.createBufferSource.bind(off);
    off.createBufferSource = () => {
      const s = cbs();
      made.push(s);
      return s;
    };
    let comp = null;
    const cdc = off.createDynamicsCompressor.bind(off);
    off.createDynamicsCompressor = () => (comp = cdc());
    const Real = window.AudioContext;
    window.AudioContext = function () {
      return off;
    };
    const eng = new AudioEngine();
    if (shared) {
      eng.rec = hideRec ? { get: (i) => (i === hideRec ? null : shared.rec.get(i)), load() {}, lead: shared.rec.lead } : shared.rec;
      eng.sfxBufs = shared.sfxBufs;
      eng.prerenderSfx = async () => {};
    }
    try {
      eng.unlock();
    } finally {
      window.AudioContext = Real;
    }
    // taps: compressor out -> ch 0-1, master (pre-compressor) -> ch 2-3
    const merger = off.createChannelMerger(4);
    const sp1 = off.createChannelSplitter(2), sp2 = off.createChannelSplitter(2);
    comp.disconnect();
    comp.connect(sp1);
    eng.master.connect(sp2);
    sp1.connect(merger, 0, 0); sp1.connect(merger, 1, 1); sp2.connect(merger, 0, 2); sp2.connect(merger, 1, 3);
    merger.connect(off.destination);
    if (!shared) {
      eng.rec.load();
      await eng.rec.whenDone;
      // the synthesized buffers (fallback + layers) are rendered by the worker after unlock: wait for them
      const total = SFX_IDS.reduce((a, id) => a + (SFX[id].variants ?? 1), 0);
      const t0 = performance.now();
      while (eng.sfxBufs.size < total && performance.now() - t0 < 30000) await new Promise((r) => setTimeout(r, 50));
      shared = { rec: eng.rec, sfxBufs: eng.sfxBufs };
      if (hideRec) eng.rec = { get: (i) => (i === hideRec ? null : shared.rec.get(i)), load() {}, lead: shared.rec.lead };
    }
    if (music) {
      eng.playMusic(music, { fade: 0 });
      const t1 = performance.now();
      while (!eng.current && performance.now() - t1 < 60000) await new Promise((r) => setTimeout(r, 100));
    }
    return { eng, off, made };
  };
  /** [post-compressor L, R], [pre-compressor L, R] */
  window.__split = (buf) => [[buf.getChannelData(0), buf.getChannelData(1)], [buf.getChannelData(2), buf.getChannelData(3)]];
});

// ------------------------------------------------------------------------------------------------ 1. every id
const perId = await page.evaluate(async ({ onlyIds, wantWav }) => {
  const { SFX_IDS, SFX } = await window.__mods;
  const { SR, measure } = window.__h;
  const ids = onlyIds.length ? onlyIds : SFX_IDS;
  const out = {};
  const callAt = 0.1;
  /** render one call of `id` forcing variant `vi` with no random pitch/gain (Math.random scripted) */
  const render = async (id, useRec, vi) => {
    const len = Math.max(1.2, (SFX[id].len ?? 1) + 0.6, 3.6);
    const { eng, off, made } = await window.__offlineEngine(len, { hideRec: useRec ? null : id });
    const rec = eng.rec.get(id);
    const nv = rec ? rec.bufs.length : SFX[id].variants ?? 1;
    const tq = Math.round((callAt * SR) / 128) * 128;
    let used = null;
    off.suspend(tq / SR).then(() => {
      const before = made.length;
      const R = Math.random;
      const q = [...(nv > 1 ? [(vi + 0.5) / nv] : []), 0.5, 0.5];
      Math.random = () => (q.length ? q.shift() : 0.5);
      try {
        eng.sfx(id, { volume: 1 });
      } finally {
        Math.random = R;
      }
      const srcs = made.slice(before);
      used = {
        sources: srcs.length,
        recorded: !!rec && srcs.some((s) => s.buffer === rec.bufs[vi]),
        synthLayer: !!rec && rec.synth > 0 && srcs.some((s) => s.buffer && !rec.bufs.includes(s.buffer)),
        variants: nv,
      };
      off.resume();
    });
    const buf = await off.startRendering();
    const [post, pre] = window.__split(buf);
    const m = measure(pre, tq);
    const mp = measure(post, tq);
    m.postPeak = mp.peak;
    m.postClip = mp.clip;
    m.compLatency = mp.latency50 - m.latency50;
    let wav = null;
    if (wantWav) {
      const a = Math.max(0, tq - 480), b = Math.min(buf.length, tq + Math.round((m.dur + 0.1) * SR));
      wav = [Array.from(pre[0].subarray(a, b)), Array.from(pre[1].subarray(a, b))];
    }
    return { m, used, wav, nv };
  };
  const agg = (ms) => {
    const keys = Object.keys(ms[0]);
    const o = {};
    for (const k of keys) {
      const v = ms.map((m) => m[k]);
      o[k] = { min: Math.min(...v), max: Math.max(...v), mean: v.reduce((a, b) => a + b, 0) / v.length };
    }
    return o;
  };
  for (const id of ids) {
    const first = await render(id, true, 0);
    const recs = [first];
    for (let vi = 1; vi < first.nv; vi++) recs.push(await render(id, true, vi));
    const s0 = await render(id, false, 0);
    const syns = [s0];
    for (let vi = 1; vi < s0.nv; vi++) syns.push(await render(id, false, vi));
    out[id] = {
      variants: first.nv,
      recordedUsed: recs.every((r) => r.used.recorded),
      synthLayer: first.used.synthLayer,
      rec: agg(recs.map((r) => r.m)),
      synth: agg(syns.map((r) => r.m)),
      wav: first.wav,
    };
  }
  return out;
}, { onlyIds, wantWav });

const f = (v, d = 1) => (typeof v === 'number' ? v.toFixed(d) : String(v));
const lines = [];
lines.push('| id | recorded used | variants | synth layer | latency ms (-50 dB) | attack ms (-20 dB) | dur s | LK100 rec (min..max) | LK100 synth | RMS | peak / true peak | clipped |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
let allRec = true, maxLat = 0, clips = 0;
for (const [id, r] of Object.entries(perId)) {
  allRec = allRec && r.recordedUsed;
  maxLat = Math.max(maxLat, r.rec.latency50.max);
  clips += r.rec.clip.max + r.rec.postClip.max;
  lines.push(
    `| \`${id}\` | ${r.recordedUsed ? 'yes' : 'NO'} | ${r.variants} | ${r.synthLayer ? 'yes' : '-'} | ${f(r.rec.latency50.max, 2)} | ${f(r.rec.latency20.max, 1)} | ` +
      `${f(r.rec.dur.mean, 2)} | ${f(r.rec.lk.mean)} (${f(r.rec.lk.min)}..${f(r.rec.lk.max)}) | ${f(r.synth.lk.mean)} | ${f(r.rec.rms.mean)} | ${f(r.rec.peak.max)} / ${f(r.rec.tp.max)} | ${r.rec.clip.max} |`,
  );
}
lines.push('');
lines.push(`ids: ${Object.keys(perId).length}; recorded version used for every variant of every id: ${allRec}; max latency (call -> first sound above -50 dB re its peak, pre-compressor): ${f(maxLat, 2)} ms; clipped samples: ${clips}`);
fs.writeFileSync(path.join(outDir, 'per_id.md'), lines.join('\n') + '\n');
if (wantWav) {
  for (const [id, r] of Object.entries(perId)) if (r.wav) fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(r.wav));
}
for (const r of Object.values(perId)) delete r.wav;
fs.writeFileSync(path.join(outDir, 'per_id.json'), JSON.stringify(perId, null, 1));
console.log(lines.join('\n'));

// ------------------------------------------------------------------------------------------------ 2. stress
if (!onlyIds.length) {
  const stress = await page.evaluate(async () => {
    const { SR, measure, lufs, lkMax, db } = window.__h;
    const T = 20;
    const { eng, off, made } = await window.__offlineEngine(T + 1, { music: 'kitchen' });
    // deterministic pseudo-random
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const pan = () => (rnd() * 2 - 1) * 0.6;
    const ev = []; // [t, id, opts, important]
    const fps = 60;
    let combo = 0;
    for (let fr = 0; fr < T * fps; fr++) {
      const t = 0.5 + fr / fps;
      if (t > T) break;
      const k = (n) => { // Poisson-ish count per frame for rate n/s
        let c = 0, p = n / fps;
        while (p > 0) { if (rnd() < Math.min(1, p)) c++; p -= 1; }
        return c;
      };
      for (let i = 0; i < k(45); i++) ev.push([t, rnd() < 0.08 ? 'hit_crit' : 'hit', { volume: 0.55, pan: pan() }]);
      for (let i = 0; i < k(35); i++) { combo++; ev.push([t, 'pickup_xp', { volume: 0.4, pitch: Math.min(2, 1 + combo * 0.025) }]); }
      if (fr % 90 === 0) combo = 0;
      for (let i = 0; i < k(12); i++) ev.push([t, rnd() < 0.1 ? 'enemy_death_big' : 'enemy_death', { volume: 0.5, pan: pan() }]);
      for (let i = 0; i < k(5); i++) ev.push([t, 'pickup_coin', { volume: 0.6 }]);
      for (let i = 0; i < k(4); i++) ev.push([t, 'enemy_shoot', { volume: 0.4, pan: pan() }]);
      for (let i = 0; i < k(4); i++) ev.push([t, 'burn', { volume: 0.5 }]);
      for (let i = 0; i < k(1); i++) ev.push([t, 'explosion', { volume: 0.8, pan: pan() }]);
      for (let i = 0; i < k(0.6); i++) ev.push([t, 'prop_break', { volume: 0.8, pan: pan() }]);
      for (let i = 0; i < k(1.5); i++) ev.push([t, 'enemy_dash', { volume: 0.5, pan: pan() }]);
      for (let i = 0; i < k(0.8); i++) ev.push([t, 'enemy_split', { volume: 0.4, pan: pan() }]);
    }
    // all 14 weapons on their cooldowns (with volleys) - a maxed-out late-game build
    const weapons = [['w_mattarello', 1.0, 2, 0.14, { pitch: 1 }], ['w_ciabatta', 1.3, 3, 0.12, {}], ['w_coltelli', 0.8, 5, 0.07, { volume: 0.7 }],
      ['w_olive', 0.9, 3, 0.09, { volume: 0.7 }], ['w_forchette', 3.6, 1, 0, { volume: 0.6 }], ['w_pizza', 1.6, 2, 0.12, {}], ['w_rotella', 2.5, 2, 0.15, { volume: 0.7 }],
      ['w_peperoncino', 2.0, 3, 0.15, { volume: 0.6 }], ['w_moka', 2.6, 2, 0.25, { volume: 0.8 }], ['w_spaghetti', 1.2, 1, 0, { volume: 0.7 }],
      ['w_vesuvio', 2.2, 3, 0.12, { volume: 0.8 }], ['w_forma', 3.8, 2, 0.4, { volume: 0.8 }], ['w_basilico', 1.0, 3, 0.07, { volume: 0.55 }], ['w_forno', 0.5, 1, 0, { volume: 0.25 }]];
    for (const [id, cd, n, iv, o] of weapons) for (let t = 0.6 + rnd(); t < T; t += cd) for (let i = 0; i < n; i++) ev.push([t + i * iv, id, { ...o, pan: pan() }]);
    // rare, important sounds that must never be dropped
    const imp = [[3.0, 'player_hurt', { volume: 0.8 }], [4.0, 'levelup', {}], [5.5, 'new_weapon', {}], [6.0, 'chest_drop', { volume: 1 }],
      [7.0, 'boss_warning', {}], [9.2, 'boss_roar', {}], [10.5, 'boss_slam', {}], [11.0, 'player_hurt', { volume: 0.8 }], [12.0, 'boss_shoot', { volume: 0.5 }],
      [13.0, 'pickup_heal', {}], [14.0, 'low_hp', { volume: 0.5 }], [15.0, 'pickup_bell', {}], [16.0, 'boss_death', {}], [17.5, 'pickup_spumante', {}],
      [18.2, 'pickup_gelato', {}], [19.0, 'elite_spawn', {}]];
    for (const [t, id, o] of imp) ev.push([t, id, o, true]);
    ev.sort((a, b) => a[0] - b[0]);
    // group by render quantum
    const groups = new Map();
    for (const e of ev) {
      const q = Math.round((e[0] * SR) / 128) * 128;
      if (!groups.has(q)) groups.set(q, []);
      groups.get(q).push(e);
    }
    const stats = { calls: 0, played: 0, importantCalls: 0, importantPlayed: 0, importantDropped: [], maxActive: 0, maxSameFrame: 0, capHits: 0, sfxMsTotal: 0, sfxMsMax: 0 };
    const perId = {};
    const activeTrace = [];
    for (const [q, list] of groups) {
      off.suspend(q / SR).then(() => {
        const t0 = performance.now();
        for (const [t, id, o, important] of list) {
          const before = made.length;
          if (eng.activeVoices >= 40) stats.capHits++;
          eng.sfx(id, o);
          const played = made.length > before;
          stats.calls++;
          if (played) stats.played++;
          perId[id] = perId[id] || { calls: 0, played: 0 };
          perId[id].calls++;
          if (played) perId[id].played++;
          if (important) {
            stats.importantCalls++;
            if (played) stats.importantPlayed++;
            else stats.importantDropped.push(id + '@' + t);
          }
        }
        const dt = performance.now() - t0;
        stats.sfxMsTotal += dt;
        stats.sfxMsMax = Math.max(stats.sfxMsMax, dt);
        stats.maxSameFrame = Math.max(stats.maxSameFrame, list.length);
        stats.maxActive = Math.max(stats.maxActive, eng.activeVoices);
        activeTrace.push([q / SR, eng.activeVoices]);
        off.resume();
      });
    }
    const t0 = performance.now();
    const buf = await off.startRendering();
    const renderMs = performance.now() - t0;
    const [post, pre] = window.__split(buf);
    const m = measure(post, 0);
    const mpre = measure(pre, 0);
    // loudness of the mix in 1 s windows
    const winL = [];
    for (let a = 0; a + SR <= buf.length; a += SR) winL.push(lkMax(post, 0.4, a, a + SR));
    return {
      seconds: T, events: ev.length, renderMs, cpuPct: (renderMs / 1000 / (T + 1)) * 100, ...stats,
      perId, mix: { peak: m.peak, tp: m.tp, clip: m.clip, lufs: lufs(post), maxLk400: Math.max(...winL), minLk400: Math.min(...winL),
        prePeak: mpre.peak, preClip: mpre.clip },
      musicPlaying: !!eng.current,
    };
  });
  stress.sfxMsAvgPerCall = stress.sfxMsTotal / stress.calls;
  fs.writeFileSync(path.join(outDir, 'stress.json'), JSON.stringify(stress, null, 1));
  console.log('\nSTRESS', JSON.stringify({ ...stress, perId: undefined }, null, 1));
  console.log('per id calls/played:', Object.entries(stress.perId).map(([k, v]) => `${k} ${v.played}/${v.calls}`).join(', '));
}

// ------------------------------------------------------------------------------------------------ 3. realtime
if (!onlyIds.length) {
  const rt = await page.evaluate(async () => {
    const { AudioEngine, SFX_IDS } = await window.__mods;
    const eng = new AudioEngine();
    eng.unlock();
    const t0 = performance.now();
    await eng.rec.whenDone;
    const decodeWall = performance.now() - t0;
    const ctx = eng.ctx;
    for (let i = 0; i < 100 && ctx.state !== 'running'; i++) await new Promise((r) => setTimeout(r, 20));
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    eng.master.connect(an);
    const made = [];
    const cbs = ctx.createBufferSource.bind(ctx);
    ctx.createBufferSource = () => {
      const s = cbs();
      made.push(s);
      return s;
    };
    const res = {};
    let maxRms = 0;
    for (const id of SFX_IDS) {
      const before = made.length;
      const c0 = performance.now();
      eng.sfx(id, {});
      const callMs = performance.now() - c0;
      const rec = eng.rec.get(id);
      const srcs = made.slice(before);
      res[id] = { recorded: !!rec && srcs.some((s) => rec.bufs.includes(s.buffer)), callMs };
      await new Promise((r) => setTimeout(r, 40));
      const d = new Float32Array(an.fftSize);
      an.getFloatTimeDomainData(d);
      let ss = 0;
      for (const v of d) ss += v * v;
      maxRms = Math.max(maxRms, Math.sqrt(ss / d.length));
    }
    // main-thread cost of a burst of calls (rate limiting makes most of them cheap no-ops)
    const b0 = performance.now();
    for (let i = 0; i < 1000; i++) eng.sfx(SFX_IDS[i % SFX_IDS.length], { pan: Math.random() * 2 - 1, pitch: 1 + Math.random(), volume: Math.random() });
    const burstMs = performance.now() - b0;
    const leads = Object.values(eng.rec.lead);
    return {
      sampleRate: ctx.sampleRate, baseLatencyMs: (ctx.baseLatency || 0) * 1000, outputLatencyMs: (ctx.outputLatency || 0) * 1000, state: ctx.state,
      decodeLoadMs: eng.rec.loadMs, decodeWallMs: decodeWall, failed: eng.rec.failed, assets: leads.length,
      leadSamples: { min: Math.min(...leads), max: Math.max(...leads), nonzero: leads.filter((v) => v > 0).length },
      allRecorded: Object.values(res).every((r) => r.recorded), notRecorded: Object.entries(res).filter(([, r]) => !r.recorded).map(([k]) => k),
      maxCallMs: Math.max(...Object.values(res).map((r) => r.callMs)), burst1000Ms: burstMs, analyserMaxRms: maxRms,
    };
  });
  fs.writeFileSync(path.join(outDir, 'realtime.json'), JSON.stringify(rt, null, 1));
  console.log('\nREALTIME', JSON.stringify(rt, null, 1));
}
console.log(logs.length ? '\nPAGE LOG:\n' + logs.slice(0, 20).join('\n') : '\nno page errors');
await browser.close();
