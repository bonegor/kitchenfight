/**
 * Music render worker: renders tracks off the main thread and transfers the PCM back.
 * (Imported by the engine via Vite's `?worker&inline`, so it also works in single-file builds.)
 */
import type { MusicId } from './audio';
import { Slicer } from './dsp';
import { renderSong } from './render';
import { SONGS } from './songs/index';

interface Req {
  seq: number;
  id: MusicId;
  sr: number;
}

const post = (msg: unknown, transfer?: Transferable[]): void =>
  (self as unknown as { postMessage(m: unknown, t?: Transferable[]): void }).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<Req>) => {
  const { seq, id, sr } = e.data;
  try {
    const song = SONGS[id];
    if (!song) throw new Error('unknown track ' + id);
    let lastP = -1;
    const r = await renderSong(song, sr, {
      slicer: new Slicer(1e9),
      onProgress: (p) => {
        if (p - lastP >= 0.05 || p === 1) {
          lastP = p;
          post({ seq, progress: p });
        }
      },
    });
    post(
      { seq, ok: true, left: r.left, right: r.right, loop: r.loop, loopStart: r.loopStart, loopEnd: r.loopEnd, length: r.length, sr: r.sr, ms: r.stats.ms },
      [r.left.buffer, r.right.buffer],
    );
  } catch (err) {
    post({ seq, ok: false, error: String(err) });
  }
};
