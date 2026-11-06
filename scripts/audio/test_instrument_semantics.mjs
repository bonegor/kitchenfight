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
// tremolo strokes must speak at once at every pitch (recordings with pick noise before the pluck put
// the real attack 20-40 ms late and left a dip of tens of ms in every stroke): per stroke, the 5 ms RMS
// reaches -10 dB of the stroke's maximum within 6 ms, and never dips more than 24 dB below it
for (const m of [61, 69, 72, 76]) {
  const part = () => [{ s: 0, d: 8, m, v: 0.8, ch: 'x', trem: true }];
  const sg = song('mandolin', [part]);
  const r = await render(sg);
  const inst = A.INSTRUMENTS.mandolin;
  const comp = A.compileSong(sg, { gate: () => inst.gate ?? 1, plucked: () => true });
  const evs = comp.events.filter((e) => e.ch === 'x');
  const x = r.left;
  const W = Math.round(0.005 * SR);
  const cs = new Float64Array(x.length + 1);
  for (let i = 0; i < x.length; i++) cs[i + 1] = cs[i] + x[i] * x[i];
  const r5 = (t) => Math.sqrt((cs[t] - cs[Math.max(0, t - W)]) / W);
  let worstAtt = 0;
  let worstDip = 0;
  for (let k = 1; k < evs.length - 1; k++) {
    const a = Math.round(evs[k].t * SR);
    const b = Math.round(evs[k + 1].t * SR);
    let pk = 0;
    for (let t = a; t < b; t++) pk = Math.max(pk, r5(t));
    let t10 = a;
    while (t10 < b && r5(t10) < pk * Math.pow(10, -10 / 20)) t10++;
    worstAtt = Math.max(worstAtt, ((t10 - a) / SR) * 1000);
    let mn = Infinity;
    for (let t = a + W; t < b; t++) mn = Math.min(mn, r5(t));
    worstDip = Math.min(worstDip, 20 * Math.log10(mn / pk + 1e-12));
  }
  check(worstAtt <= 6 && worstDip >= -24, `mandolin tremolo m=${m}: every stroke within -10 dB of its peak after <= ${worstAtt.toFixed(1)} ms (limit 6), deepest dip ${worstDip.toFixed(1)} dB (limit -24)`);
}
// ---------------------------------------------------------------- short articulation
// short notes of slow-attack instruments (bowed strings, chorus, flute) play the short articulation:
// they speak at once and sit at the level of a long note's sustain, without a click
for (const [id, m] of [['violin', 76], ['strings', 67], ['cello', 50], ['choir', 64], ['flute', 79]]) {
  const inst = A.INSTRUMENTS[id];
  if (!inst.shortArt) {
    check(false, `${id}: has a short articulation`);
    continue;
  }
  const part = () => [
    { s: 1, d: 0.12, m, v: 0.8, ch: 'x', vr: 0 },
    { s: 3, d: 2.4, m, v: 0.8, ch: 'x', vr: 0 },
  ];
  const r = await render(song(id, [part], { steps: 8, spb: 1, bpm: 60 }));
  const x = r.left;
  const W = Math.round(0.005 * SR);
  const cs = new Float64Array(x.length + 1);
  for (let i = 0; i < x.length; i++) cs[i + 1] = cs[i] + x[i] * x[i];
  const r5 = (t) => Math.sqrt((cs[t] - cs[Math.max(0, t - W)]) / W);
  const a = Math.round(1 * SR);
  let pk = 0;
  for (let t = a; t < a + Math.round(0.12 * SR); t++) pk = Math.max(pk, r5(t));
  let t10 = a - Math.round(0.03 * SR);
  while (r5(t10) < pk * Math.pow(10, -10 / 20)) t10++;
  const att = ((t10 - a) / SR) * 1000;
  const lvShort = 20 * Math.log10(rms(x, a + Math.round(0.02 * SR), a + Math.round(0.11 * SR)) + 1e-12);
  const b = Math.round(3 * SR);
  const lvLong = 20 * Math.log10(rms(x, b + Math.round(0.8 * SR), b + Math.round(2.0 * SR)) + 1e-12);
  // no step: the 1 ms before the note's first sample vs. its first ms
  check(Math.abs(att) <= 15 && Math.abs(lvShort - lvLong) <= 3, `${id}: a 0.12 s note speaks ${att.toFixed(1)} ms from the beat (limit 15) at ${(lvShort - lvLong).toFixed(1)} dB re a long note's sustain (limit +-3)`);
}
// ---------------------------------------------------------------- stereo image of ensembles
// mono recordings of ensembles / cymbals play a second take on the right channel: a centred note is
// wide (L/R correlation well under 1) but not hollow
for (const [id, m, lo, hi] of [['strings', 67, 0.3, 0.85], ['choir', 64, 0.3, 0.85], ['accordion', 69, 0.3, 0.85], ['crash', 60, -0.1, 0.6], ['tamtam', 60, -0.1, 0.7], ['strStab', 67, 0.3, 0.85]]) {
  const inst = A.INSTRUMENTS[id];
  const sm = inst.make(SR, m, 0, 1.5, inst.layerOf ? inst.layerOf(0.8) : 0);
  if (!sm.r) {
    check(false, `${id}: stereo note`);
    continue;
  }
  const a = (sm.pre ?? 0) + Math.round(0.05 * SR);
  const b = Math.min(sm.l.length, a + Math.round(1.0 * SR));
  let ll = 0, rr = 0, lr = 0;
  for (let i = a; i < b; i++) {
    ll += sm.l[i] * sm.l[i];
    rr += sm.r[i] * sm.r[i];
    lr += sm.l[i] * sm.r[i];
  }
  const rho = lr / Math.sqrt(ll * rr + 1e-30);
  const bal = 10 * Math.log10(ll / (rr + 1e-30));
  check(rho >= lo && rho <= hi && Math.abs(bal) < 3, `${id}: L/R correlation ${rho.toFixed(2)} (range ${lo}..${hi}), L/R balance ${bal.toFixed(1)} dB`);
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
  // hits 4 s apart so no tail of a ringing hit overlaps the next one (from 1 s: a note at 0 s has
  // its pre-roll clipped at the buffer start)
  const part = () => [1, 5, 9, 13].map((s) => ({ s, d: 1, m, v: 0.8, ch: 'x' }));
  const r = await render(song(id, [part], { steps: 17, spb: 1, bpm: 60 }));
  const seg = (k) => r.left.subarray(Math.round((1 + 4 * k - 0.1) * SR), Math.round((1 + 4 * k + 0.05) * SR));
  const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(!same(seg(0), seg(1)) && same(seg(0), seg(2)), `${id}: repeated notes alternate round robins (1st != 2nd, 1st == 3rd)`);
}
// ---------------------------------------------------------------- ringing notes capped by maxLen
// a recording that rings longer than its instrument's maxLen fades out over its last 0.3 s instead of
// being cut (a 6 ms cut of a bell still at -20 dB is a click)
for (const [id, m] of [['bell', 72], ['glock', 84], ['triangle', 60], ['crash', 60], ['pan', 60], ['anvil', 60], ['timp', 41]]) {
  const inst = A.INSTRUMENTS[id];
  const sm = inst.make(SR, m, 0, 0, inst.layerOf ? inst.layerOf(0.9) : 0);
  const x = sm.l;
  const n = x.length;
  const pre = sm.pre ?? 0;
  const db = (a, b) => 20 * Math.log10(rms(x, a, b) + 1e-12);
  let pk = -200;
  for (let a = pre; a + 2400 < Math.min(n, pre + 24000); a += 1200) pk = Math.max(pk, db(a, a + 2400));
  const endLv = db(n - Math.round(0.003 * SR), n) - pk;
  const before = db(n - Math.round(0.33 * SR), n - Math.round(0.3 * SR)) - pk;
  // either it has died away by itself, or the last 0.3 s fade it out smoothly
  const ok = endLv < -45 || (before - endLv > 15 && endLv < -30);
  check(ok, `${id}: ends ${endLv.toFixed(1)} dB re its loudest 50 ms (0.3 s before the end: ${before.toFixed(1)} dB), length ${(n / SR).toFixed(2)} s`);
}
// ---------------------------------------------------------------- round robins never identical
// variant 1 of a repeated note borrows the neighbouring recording (<= 3.5 semitones) or, where there
// is none, replays the take with a micro-variation: never sample-identical to variant 0
for (const id of ['guitar', 'harp', 'harpsi', 'steelGuitar', 'timp', 'mandolin', 'ubass', 'pizz', 'strStab']) {
  const inst = A.INSTRUMENTS[id];
  const spec = A.SAMPLED_SPECS.find((x) => x.id === id);
  const set = A.SAMPLE_SETS.find((x) => x.name === spec.set);
  const lo = Math.min(...set.zones.map((z) => z.lo));
  const hi = Math.max(...set.zones.map((z) => z.hi));
  let same = 0;
  let n = 0;
  for (let m = lo; m <= hi; m++) {
    for (const v of [0.4, 0.9]) {
      const layer = inst.layerOf ? inst.layerOf(v) : 0;
      const a = inst.make(SR, m, 0, 0.4, layer);
      const b = inst.make(SR, m, 1, 0.4, layer);
      const pa = a.pre ?? 0;
      const pb = b.pre ?? 0;
      const N = Math.round(0.2 * SR);
      let ab = 0, aa = 0, bb = 0;
      for (let i = 0; i < N; i++) {
        const x = a.l[pa + i] ?? 0;
        const y = b.l[pb + i] ?? 0;
        ab += x * y;
        aa += x * x;
        bb += y * y;
      }
      const c = ab / Math.sqrt(aa * bb + 1e-30);
      const identical = c > 0.9999 && Math.abs(10 * Math.log10((aa + 1e-30) / (bb + 1e-30))) < 0.05;
      if (identical) same++;
      n++;
    }
  }
  check(same === 0, `${id}: variant 0 / 1 differ on every note (${same} of ${n} note/velocity pairs sample-identical)`);
}
// ---------------------------------------------------------------- velocity layers + gain
for (const id of ['mandolin', 'guitar', 'snare', 'timp', 'piano']) {
  const inst = A.INSTRUMENTS[id];
  const vs = [0.3, 0.5, 0.7, 0.9, 1.1];
  const layers = vs.map((v) => inst.layerOf(v));
  // one variant throughout (timpani variant 1 is the soft stroke by design)
  const part = () => vs.map((v, i) => ({ s: 1 + i * 2, d: 1, m: id === 'snare' ? 60 : id === 'timp' ? 41 : 67, v, ch: 'x', vr: 0 }));
  const r = await render(song(id, [part], { steps: 12, spb: 1, bpm: 60 }));
  const lv = vs.map((_, i) => 20 * Math.log10(rms(r.left, Math.round((1 + 2 * i) * SR), Math.round((1 + 2 * i + 0.25) * SR)) + 1e-9));
  const mono = lv.every((l, i) => i === 0 || l > lv[i - 1]);
  check(mono, `${id}: layers ${layers.join(',')} for v ${vs.join('/')}; level ${lv.map((l) => l.toFixed(1)).join(' < ')} dB`);
}
// ---------------------------------------------------------------- articulations at every velocity
// cymbal / bass drum variant 1 = roll (recorded at one dynamic): a roll must stay a roll at any
// velocity (the articulation is chosen before the velocity layer)
for (const id of ['cymbal', 'bassDrum']) {
  const inst = A.INSTRUMENTS[id];
  const res = [0.4, 0.8, 1.1].map((v) => {
    const s = inst.make(SR, 60, 1, 3, inst.layerOf(v));
    const pre = s.pre ?? 0;
    const a = 20 * Math.log10(rms(s.l, pre, pre + Math.round(0.3 * SR)) + 1e-12);
    const b = 20 * Math.log10(rms(s.l, pre + Math.round(2 * SR), pre + Math.round(2.5 * SR)) + 1e-12);
    const c = A.debugChoice(id, 60, 1, inst.layerOf(v));
    return { v, r: c?.zone.r, a, b };
  });
  // (a roll sustains: less than 8 dB down after 2 s; a single hit is 15-20 dB down)
  const ok = res.every((x) => x.r === 1 && x.b > x.a - 8);
  check(ok, `${id}: variant 1 is the roll at v 0.4/0.8/1.1 (zones r=${res.map((x) => x.r).join('/')}; 0-0.3 s vs 2-2.5 s: ${res.map((x) => `${x.a.toFixed(1)}→${x.b.toFixed(1)}`).join(', ')} dB)`);
}
// variant loudness semantics kept from the synth: timpani variant 1 = soft stroke (about -4.5 dB),
// tambourine accents (v4/5) about +2 dB over hits, shakes (v2/3) about -3 dB under hits
{
  const lu = (id, m, vr) => {
    const inst = A.INSTRUMENTS[id];
    const s = inst.make(SR, m, vr, 0, 0);
    const pre = s.pre ?? 0;
    return 20 * Math.log10(rms(s.l, pre, Math.min(s.l.length, pre + Math.round(0.3 * SR))) + 1e-12);
  };
  const t0 = lu('timp', 41, 0);
  const t1 = lu('timp', 41, 1);
  check(t1 < t0 - 3 && t1 > t0 - 7, `timp: variant 1 (soft stroke) ${(t1 - t0).toFixed(1)} dB re variant 0 (synth -4.5)`);
  const tb = [0, 1, 2, 3, 4, 5].map((v) => lu('tamb', 60, v));
  const hit = (tb[0] + tb[1]) / 2;
  const shake = (tb[2] + tb[3]) / 2;
  const acc = (tb[4] + tb[5]) / 2;
  check(acc > hit + 0.8 && shake < hit - 1.5, `tamb: accents ${(acc - hit).toFixed(1)} dB, shakes ${(shake - hit).toFixed(1)} dB re plain hits (synth +2.2 / -3.2)`);
}
process.exitCode = bad ? 1 : 0;
