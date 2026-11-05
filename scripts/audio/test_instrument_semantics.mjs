#!/usr/bin/env node
/**
 * Song-DSL semantics through the sampled instruments (real sequencer + renderer + sample bank):
 *   - mandolin tremolo ('~'): re-plucks on the 13.5 Hz grid, alternating strokes (variant 0/1 →
 *     primary / neighbouring zone), onsets detected in the audio
 *   - tambourine variants 0..7 keep the synth meaning (hit, shake, accent, roll): 8 distinct samples,
 *     rolls longest, accents loudest
 *   - accChord chords: every chord tone sounds (spectral peaks at each pitch)
 *   - round robin: repeated notes alternate variants (render.ts) → different zones (timpani lh/rh,
 *     pizzicato rr1/rr2) — consecutive hits are not sample-identical
 *   - velocity: layer switches at the thresholds and loudness rises monotonically with v
 * Usage: node scripts/audio/test_instrument_semantics.mjs
 */
import { installBank, loadAudio } from './render-song.mjs';

const SR = 48000;
const A = await loadAudio();
installBank(A);
let bad = 0;
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${msg}`);
  if (!ok) bad++;
};

function song(inst, parts, { bpm = 120, steps = 16, spb = 2 } = {}) {
  return {
    id: 'sem-' + inst,
    bpm,
    stepsPerBeat: spb,
    barSteps: steps,
    scale: 'C major',
    channels: { x: { inst, gain: 0, pan: 0, send: 0, hum: 0 } },
    sections: { A: { bars: 1, parts } },
    form: ['A'],
    loopFrom: null,
    reverb: { rt60: 1, size: 1, damp: 0.5, predelay: 0.02 },
    gainDb: 0,
    humanize: 0,
    tail: 1,
  };
}
const render = (s) => A.renderSong(s, SR, { slicer: new A.Slicer(1e9), raw: true });
const env = (x, win = 0.003) => {
  const n = Math.round(win * SR);
  const out = new Float32Array(Math.floor(x.length / n));
  for (let k = 0; k < out.length; k++) {
    let a = 0;
    for (let i = k * n; i < (k + 1) * n; i++) a += x[i] * x[i];
    out[k] = Math.sqrt(a / n);
  }
  return out;
};
function onsets(x) {
  // spectral-flux-like detector: high-passed (> 2 kHz) energy in 2 ms frames; an onset is a frame
  // whose energy jumps 3x above the average of the previous 10 ms (pick transients stand out
  // even on top of the previous pluck's ringing tail)
  const n = Math.round(0.002 * SR);
  const hp = new Float32Array(x.length);
  let y1 = 0;
  let x1 = 0;
  const a = Math.exp((-2 * Math.PI * 2000) / SR);
  for (let i = 0; i < x.length; i++) {
    y1 = a * (y1 + x[i] - x1);
    x1 = x[i];
    hp[i] = y1;
  }
  const e = [];
  for (let k = 0; k * n + n <= x.length; k++) {
    let s = 0;
    for (let i = k * n; i < k * n + n; i++) s += hp[i] * hp[i];
    e.push(s / n);
  }
  const out = [];
  let last = -1;
  for (let k = 5; k < e.length; k++) {
    const prev = (e[k - 1] + e[k - 2] + e[k - 3] + e[k - 4] + e[k - 5]) / 5;
    if (e[k] > 3 * prev + 1e-9 && k - last > 10) {
      out.push(k * 0.002);
      last = k;
    }
  }
  return out;
}
const rms = (x, a, b) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
};

// ---------------------------------------------------------------- mandolin tremolo
{
  const part = () => [{ s: 0, d: 8, m: 69, v: 0.8, ch: 'x', trem: true }];
  const sg = song('mandolin', [part]);
  const r = await render(sg);
  // the sequencer expands the tremolo note into re-plucks (pluck instruments only) ...
  const inst = A.INSTRUMENTS.mandolin;
  const comp = A.compileSong(sg, { gate: () => inst.gate ?? 1, plucked: () => inst.kind === 'pluck' || inst.kind === 'perc' });
  const evs = comp.events.filter((e) => e.ch === 'x');
  const stepSec = 60 / (120 * 2);
  const per = Math.max(1, Math.round(13.5 * stepSec));
  const expected = 8 * per;
  const alt = evs.every((e, i) => e.vr === i % 2);
  check(evs.length === expected && alt, `mandolin tremolo: ${evs.length} re-plucks scheduled (grid ${expected}), strokes alternate variants 0/1: ${alt}`);
  // ... and every re-pluck is heard: in the pick band (> 2 kHz, 2 ms frames) the string is damped
  // just before each stroke and re-excited by it — articulation depth = loudest frame in the
  // 8 ms after the stroke minus the quietest frame in the 6 ms before it (>= 6 dB required)
  const hp = new Float32Array(r.left.length);
  let y1 = 0;
  let x1 = 0;
  const ka = Math.exp((-2 * Math.PI * 2000) / SR);
  for (let i = 0; i < hp.length; i++) {
    y1 = ka * (y1 + r.left[i] - x1);
    x1 = r.left[i];
    hp[i] = y1;
  }
  const f2 = Math.round(0.002 * SR);
  const fr = (s0) => {
    let t = 0;
    for (let i = s0; i < s0 + f2; i++) t += hp[i] * hp[i];
    return 10 * Math.log10(t / f2 + 1e-14);
  };
  const depth = evs.slice(1).map((e) => {
    const s0 = Math.round(e.t * SR);
    const before = Math.min(fr(s0 - 3 * f2), fr(s0 - 2 * f2), fr(s0 - f2));
    const after = Math.max(fr(s0), fr(s0 + f2), fr(s0 + 2 * f2), fr(s0 + 3 * f2));
    return after - before;
  });
  const dmin = Math.min(...depth);
  check(dmin >= 6, `mandolin tremolo: every stroke re-articulates (damp-to-attack depth min ${dmin.toFixed(1)} dB, median ${depth.sort((a, b) => a - b)[depth.length >> 1].toFixed(1)} dB)`);
  const ch0 = A.debugChoice('mandolin', 69, 0, 1);
  const ch1 = A.debugChoice('mandolin', 69, 1, 1);
  check(ch0 && ch1 && ch0.zone.o !== ch1.zone.o, `mandolin up/down strokes use different recordings (zones ${ch0?.zone.p.toFixed(2)} / ${ch1?.zone.p.toFixed(2)})`);
}
// ---------------------------------------------------------------- tambourine articulations
{
  const inst = A.INSTRUMENTS.tamb;
  const s = [...Array(8).keys()].map((v) => inst.make(SR, 60, v, 0, 0));
  const lens = s.map((x) => x.l.length / SR);
  const rmsV = s.map((x) => rms(x.l, 0, Math.min(x.l.length, Math.round(0.1 * SR))));
  const distinct = new Set(s.map((x) => x.l.length + ':' + x.l[Math.round(0.01 * SR)].toFixed(6))).size;
  check(distinct === 8, `tamb: 8 distinct samples for variants 0..7`);
  check(Math.min(lens[6], lens[7]) > Math.max(lens[0], lens[1]), `tamb: rolls (v6/7, ${lens[6].toFixed(2)}/${lens[7].toFixed(2)} s) longer than hits (v0/1, ${lens[0].toFixed(2)}/${lens[1].toFixed(2)} s)`);
  check(Math.min(rmsV[4], rmsV[5]) > Math.min(rmsV[0], rmsV[1]), `tamb: accents (v4/5) louder than plain hits (v0/1) in the first 100 ms`);
}
// ---------------------------------------------------------------- accordion chord
{
  const chord = [64, 67, 72];
  const part = () => chord.map((m) => ({ s: 0, d: 4, m, v: 0.6, ch: 'x' }));
  const r = await render(song('accChord', [part]));
  const x = r.left.subarray(Math.round(0.3 * SR), Math.round(0.3 * SR) + 16384);
  const mag = (f) => {
    let re = 0;
    let im = 0;
    for (let i = 0; i < x.length; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / x.length);
      re += x[i] * w * Math.cos((2 * Math.PI * f * i) / SR);
      im -= x[i] * w * Math.sin((2 * Math.PI * f * i) / SR);
    }
    return Math.hypot(re, im);
  };
  const levels = chord.map((m) => mag(440 * Math.pow(2, (m - 69) / 12)));
  const offs = chord.map((m) => mag(440 * Math.pow(2, (m + 0.5 - 69) / 12)));
  check(levels.every((l, i) => l > 4 * offs[i]), `accChord C-E-G... chord tones ${chord.join('/')} all present (peak/off-peak ${levels.map((l, i) => (l / offs[i]).toFixed(1)).join(', ')})`);
}
// ---------------------------------------------------------------- round robin alternation
for (const [id, m] of [['timp', 41], ['pizz', 62], ['strStab', 67]]) {
  // hits 4 s apart so no tail of a ringing hit overlaps the next one
  const part = () => [0, 4, 8, 12].map((s) => ({ s, d: 1, m, v: 0.8, ch: 'x' }));
  const r = await render(song(id, [part], { steps: 16, spb: 1, bpm: 60 }));
  const seg = (k) => r.left.subarray(Math.round((4 * k) * SR), Math.round((4 * k + 0.05) * SR));
  const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(!same(seg(0), seg(1)) && same(seg(0), seg(2)), `${id}: repeated notes alternate round robins (1st != 2nd, 1st == 3rd)`);
}
// ---------------------------------------------------------------- velocity layers + gain
for (const id of ['mandolin', 'guitar', 'snare', 'timp', 'piano']) {
  const inst = A.INSTRUMENTS[id];
  const vs = [0.3, 0.5, 0.7, 0.9, 1.1];
  const layers = vs.map((v) => inst.layerOf(v));
  const part = () => vs.map((v, i) => ({ s: i * 2, d: 1, m: id === 'snare' ? 60 : id === 'timp' ? 41 : 67, v, ch: 'x' }));
  const r = await render(song(id, [part], { steps: 10, spb: 1, bpm: 60 }));
  const lv = vs.map((_, i) => 20 * Math.log10(rms(r.left, Math.round(2 * i * SR), Math.round((2 * i + 0.25) * SR)) + 1e-9));
  const mono = lv.every((l, i) => i === 0 || l > lv[i - 1]);
  check(mono, `${id}: layers ${layers.join(',')} for v ${vs.join('/')}; level ${lv.map((l) => l.toFixed(1)).join(' < ')} dB`);
}
process.exitCode = bad ? 1 : 0;
