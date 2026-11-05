/**
 * Audio render worker: renders music tracks, sfx variants and voice lines off the main thread and
 * transfers the PCM back. (Imported by the engine via Vite's `?worker&inline`, so it also works
 * in single-file builds.) The engine runs two instances: one for music, one for sfx + speech.
 */
import type { MusicId, SfxId, VoiceMood } from './audio';
import { Slicer } from './dsp';
import { INSTRUMENTS } from './instruments';
import { clearSampleCache, renderSong } from './render';
import { addSampleSet, finishSampleBank, installSampleBank, registerArrivedSets, type BankData, type SampleSetDef, type SetPcm } from './sampled';
import { renderSfx } from './sfx';
import { SONGS } from './songs/index';
import { renderVoice } from './voice';

export type WorkerReq =
  | { type: 'bank'; seq: number; bank: BankData }
  | { type: 'bankSet'; seq: number; set: SampleSetDef; pcm: SetPcm }
  | { type: 'bankDone'; seq: number }
  | { type: 'music'; seq: number; id: MusicId; sr: number }
  | { type: 'sfx'; seq: number; sr: number; list: Array<[SfxId, number]> }
  | { type: 'voice'; seq: number; sr: number; text: string; mood: VoiceMood };

const post = (msg: unknown, transfer?: Transferable[]): void =>
  (self as unknown as { postMessage(m: unknown, t?: Transferable[]): void }).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<WorkerReq>) => {
  const req = e.data;
  const { seq } = req;
  try {
    const register = (defs: Parameters<Parameters<typeof finishSampleBank>[0]>[0]) => {
      for (const d of defs) INSTRUMENTS[d.id] = d;
    };
    if (req.type === 'bankSet') {
      // one decoded sample set (sent as soon as it is decoded); its instruments switch from the
      // synthesized to the sampled version right away (renders already queued keep their order)
      const t0 = performance.now();
      const ok = addSampleSet(req.set, req.pcm);
      const ids = ok ? registerArrivedSets(register) : [];
      if (ids.length) clearSampleCache();
      post({ seq, ok, ids, ms: performance.now() - t0 });
    } else if (req.type === 'bankDone' || req.type === 'bank') {
      // recorded instrument samples: replace the synthesized instruments of the same ids
      const t0 = performance.now();
      const rep = req.type === 'bank' ? installSampleBank(req.bank, register) : finishSampleBank(register);
      clearSampleCache();
      post({ seq, ok: rep.ok, report: { ...rep, ms: performance.now() - t0 } });
    } else if (req.type === 'music') {
      const song = SONGS[req.id];
      if (!song) throw new Error('unknown track ' + req.id);
      let lastP = -1;
      const r = await renderSong(song, req.sr, {
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
    } else if (req.type === 'sfx') {
      for (const [id, v] of req.list) {
        const r = renderSfx(id, req.sr, v);
        const tr: Transferable[] = [r.l.buffer];
        if (r.r) tr.push(r.r.buffer);
        post({ seq, sfx: id, v, l: r.l, r: r.r }, tr);
      }
      post({ seq, ok: true, done: true });
    } else if (req.type === 'voice') {
      const d = renderVoice(req.sr, req.text, req.mood);
      post({ seq, ok: true, data: d }, [d.buffer]);
    }
  } catch (err) {
    post({ seq, ok: false, error: String(err) });
  }
};
