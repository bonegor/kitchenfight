#!/usr/bin/env node
/**
 * Self-test helper: export-song.mjs must reproduce the sequencer exactly. For every game track,
 * extractSong() (following the form) is compared with compileSong() (humanize 0, gate 1, no
 * tremolo expansion): same events (channel, pitch, start time, form index), every event inside
 * its form entry's bars, and the same loop window / one-shot end. Exit 1 on any difference.
 *
 *   node scripts/music/selftest/formcheck.mjs
 */
import { extractSong } from '../export-song.mjs';
import { loadAudio } from '../lib/bundle.mjs';

const mods = await loadAudio();
let bad = 0;
for (const [id, song0] of Object.entries(mods.SONGS)) {
  const song = { ...song0, humanize: 0 };
  const comp = mods.seq.compileSong(song, { gate: () => 1, plucked: () => false });
  const data = extractSong(mods.seq, song, {});
  const ex = [];
  for (const [ch, c] of Object.entries(data.channels)) for (const e of c.events) ex.push({ t: e.startSec, m: e.midi, ch, fi: e.formIndex, sec: e.section, bar: e.bar });
  const cmp = (a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : 0) || a.fi - b.fi || a.t - b.t || a.m - b.m;
  const A = comp.events.map((e) => ({ t: e.t, m: e.m, ch: e.ch, fi: e.fi })).sort(cmp);
  const B = ex.slice().sort(cmp);
  let mism = 0;
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const a = A[i];
    const b = B[i];
    if (!a || !b || a.ch !== b.ch || a.fi !== b.fi || a.m !== b.m || Math.abs(a.t - b.t) > 2e-6) mism++;
  }
  let barBad = 0;
  for (const e of ex) {
    const f = data.form[e.fi];
    if (f.name !== e.sec || e.bar < f.startBar || e.bar >= f.startBar + f.bars) barBad++;
  }
  const loopOk =
    song.loopFrom === null
      ? Math.abs(data.loop.endSec - comp.end) < 1e-6
      : Math.abs(data.loop.loopStartSec - comp.loopStart) < 1e-6 && Math.abs(data.loop.loopEndSec - comp.loopEnd) < 1e-6;
  const ok = !mism && !barBad && loopOk && A.length === B.length;
  if (!ok) bad++;
  const loop = song.loopFrom === null ? `one-shot, ${data.loop.endSec} s` : `loop from "${data.form[song.loopFrom].name}" bars ${data.loop.loopStartBar}-${data.loop.loopEndBar - 1}`;
  console.log(`${ok ? 'ok ' : 'BAD'} ${id.padEnd(10)} ${String(B.length).padStart(5)} events, ${data.form.length} form entries, ${loop}${mism ? `, ${mism} mismatched events` : ''}${barBad ? `, ${barBad} outside their bars` : ''}${loopOk ? '' : ', LOOP WINDOW DIFFERS'}`);
}
process.exit(bad ? 1 : 0);
