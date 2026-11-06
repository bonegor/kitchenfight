/**
 * Main-thread loader for the recorded instrument samples.
 *
 * The MP3 sprites (src/audio/assets/inst/<set>/<set>.mp3) are embedded through Vite
 * (`?url`: files in the multi-file build, base64 data: URLs in the single-file build), read
 * (data: URLs are decoded in place — a fetch() of one obeys the page's CSP connect-src, which a
 * host may not open to data: — other URLs are fetched), and decoded with decodeAudioData on an
 * OfflineAudioContext, which works before any user gesture. The decoded channel data is handed to
 * the music worker (worker.ts → 'bankSet' messages), which aligns every sprite on its marker
 * impulse and stores it as Int16 (see sampled.ts).
 * Never throws: any failure resolves to null and the synthesized instruments keep playing.
 */
import { SAMPLE_SETS } from './assets/inst/manifest';
import type { BankData, SampleSetDef, SetPcm } from './sampled';

const URLS = import.meta.glob('./assets/inst/*/*.mp3', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

export interface BankLoadStats {
  /** wall time from start to all sets decoded (ms) */
  ms: number;
  sets: number;
  failed: string[];
  /** encoded bytes fetched */
  mp3Bytes: number;
  /** decoded float32 PCM bytes (before the worker converts to Int16) */
  pcmBytes: number;
  /** decode sample rates actually used */
  rates: number[];
  /** why loading stopped early (e.g. every fetch refused by the page's CSP), if it did */
  error?: string;
}

/** The bytes behind a sample-set URL: data: URLs decoded in place, others fetched. */
async function readUrl(url: string): Promise<ArrayBuffer> {
  if (url.slice(0, 5).toLowerCase() === 'data:') {
    const comma = url.indexOf(',');
    if (comma < 0) throw new Error('malformed data: URL');
    const meta = url.slice(5, comma);
    const body = url.slice(comma + 1);
    let bin: string;
    if (/;base64$/i.test(meta)) bin = atob(body);
    else bin = body.replace(/%([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 255;
    return out.buffer;
  }
  if (typeof fetch !== 'function') throw new Error('no fetch');
  const res = await fetch(url);
  if (!res.ok && res.status !== 0) throw new Error('http ' + res.status);
  return res.arrayBuffer();
}

type DecodeCtx = OfflineAudioContext;

function offlineCtor(): (new (ch: number, len: number, sr: number) => DecodeCtx) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext };
  return (w.OfflineAudioContext ?? w.webkitOfflineAudioContext ?? null) as (new (ch: number, len: number, sr: number) => DecodeCtx) | null;
}

const ctxCache = new Map<number, DecodeCtx | null>();

/** A decode context at `sr` (no resampling); falls back to 44.1/48 kHz contexts. */
function ctxFor(sr: number): DecodeCtx | null {
  if (ctxCache.has(sr)) return ctxCache.get(sr) ?? null;
  const C = offlineCtor();
  let ctx: DecodeCtx | null = null;
  for (const rate of [sr, 44100, 48000]) {
    try {
      if (C) ctx = new C(1, 1, rate);
      if (ctx) break;
    } catch {
      ctx = null;
    }
  }
  ctxCache.set(sr, ctx);
  return ctx;
}

function decode(ctx: DecodeCtx, ab: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      // promise form (modern) + callback form (old Safari) — whichever answers first
      const p = ctx.decodeAudioData(ab, resolve, reject) as unknown as Promise<AudioBuffer> | undefined;
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}

export function sampleSetUrls(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of SAMPLE_SETS) {
    const u = URLS['./assets/inst/' + s.file];
    if (u) out[s.name] = u;
  }
  return out;
}

/** sets that fail to load before any has loaded: after this many the rest are not tried (a page
 *  whose CSP refuses the reads would otherwise log two console errors per set) */
const FAIL_FAST = 2;

/**
 * Read + decode every sample set. With `onSet`, each set is handed over as soon as it is decoded
 * (and not kept here, so the decoded float PCM never piles up on the main thread); otherwise
 * everything is returned at the end. Resolves null when nothing could be decoded. `warn` gets one
 * message when loading stops early (the first sets all failed: the rest are not tried).
 */
export async function loadSampleBank(
  concurrency = 2,
  onSet?: (def: SampleSetDef, pcm: SetPcm) => void,
  /** called whenever a decoder slot frees up: set names to decode first (e.g. the requested track's) */
  priority?: () => string[],
  /** true = stop fetching / decoding (e.g. the worker the sets are for is gone) */
  abort?: () => boolean,
  /** before fetching a set nobody asked for yet: a promise to wait for (e.g. the first user gesture,
   *  so the bank does not compete with the game's boot downloads), or null to go on */
  holdRest?: () => Promise<void> | null,
  warn?: (msg: string) => void,
): Promise<{ data: BankData; stats: BankLoadStats } | null> {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const stats: BankLoadStats = { ms: 0, sets: 0, failed: [], mp3Bytes: 0, pcmBytes: 0, rates: [] };
  try {
    if (!offlineCtor()) return null;
    const urls = sampleSetUrls();
    let loadedAny = false;
    let stop = false;
    const pcm: SetPcm[] = [];
    const queue = SAMPLE_SETS.slice();
    const wanted = (): SampleSetDef | undefined => {
      try {
        const want = priority ? priority() : [];
        for (const name of want) {
          const i = queue.findIndex((d) => d.name === name);
          if (i >= 0) return queue.splice(i, 1)[0];
        }
      } catch {
        /* ignore */
      }
      return undefined;
    };
    const take = async (): Promise<SampleSetDef | undefined> => {
      const w = wanted();
      if (w) return w;
      // nothing requested right now: wait (if asked to) before fetching the rest, re-checking for
      // requested sets every 250 ms
      let hold: Promise<void> | null = null;
      try {
        hold = holdRest ? holdRest() : null;
      } catch {
        hold = null;
      }
      while (hold) {
        let open = false;
        await Promise.race([hold.then(() => (open = true)), new Promise((r) => setTimeout(r, 250))]);
        if (abort && abort()) return undefined;
        const w2 = wanted();
        if (w2) return w2;
        if (open) break;
      }
      return queue.shift();
    };
    const worker = async () => {
      while (queue.length && !stop) {
        if (abort && abort()) break;
        const def = await take();
        if (!def) break;
        try {
          const url = urls[def.name];
          if (!url) throw new Error('no url');
          let ab: ArrayBuffer;
          try {
            ab = await readUrl(url);
          } catch (e) {
            // the first reads all refused (a CSP without the source in connect-src, offline):
            // stop instead of logging the same refusal for every set
            if (!loadedAny && stats.failed.length + 1 >= FAIL_FAST && !stop) {
              stop = true;
              stats.error = `sample bank: reading the sample sets failed (${String(e)}); playing the synthesized instruments`;
              try {
                warn?.(stats.error);
              } catch {
                /* ignore */
              }
            }
            throw e;
          }
          stats.mp3Bytes += ab.byteLength;
          const ctx = ctxFor(def.sr);
          if (!ctx) throw new Error('no OfflineAudioContext');
          const buf = await decode(ctx, ab);
          const data: Float32Array[] = [];
          for (let c = 0; c < buf.numberOfChannels; c++) data.push(buf.getChannelData(c).slice());
          stats.pcmBytes += data.reduce((a, d) => a + d.byteLength, 0);
          if (!stats.rates.includes(buf.sampleRate)) stats.rates.push(buf.sampleRate);
          const one: SetPcm = { name: def.name, sr: buf.sampleRate, data };
          loadedAny = true;
          if (onSet) {
            onSet(def, one);
            pcm.push({ name: def.name, sr: one.sr, data: [] });
          } else pcm.push(one);
        } catch {
          stats.failed.push(def.name);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
    stats.sets = pcm.length;
    stats.ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    if (!pcm.length) return null;
    return { data: { sets: SAMPLE_SETS.filter((s) => pcm.some((p) => p.name === s.name)), pcm }, stats };
  } catch {
    return null;
  }
}

/** Transfer list for a bank message (the decoded channel buffers). */
export function bankTransfer(data: BankData | SetPcm): Transferable[] {
  const out: Transferable[] = [];
  const list = 'pcm' in data ? data.pcm : [data];
  for (const p of list) for (const d of p.data) out.push(d.buffer as ArrayBuffer);
  return out;
}
