#!/usr/bin/env node
/**
 * Unit test of the sampler's pitch shifter (src/audio/sampled.ts) on a synthetic zone, no MP3:
 * a band-limited sawtooth (A4, harmonics up to 15 kHz at 32 kHz) looped like a real zone, played
 * back through the real InstDef at shifts from -12 to +12 semitones into a 48 kHz output.
 *
 * Reports per shift: tuning error (cents), passband deviation of the harmonics that stay below
 * 12 kHz (dB), and the inharmonic residual = energy NOT at harmonic frequencies, i.e. aliasing +
 * interpolation error (dB re total). Fails (exit 1) on |cents| > 1, passband > 1 dB or residual
 * above -50 dB.
 *
 * Usage: node scripts/audio/test_instrument_resampler.mjs
 */
import { loadAudio } from './render-song.mjs';

const A = await loadAudio();
const SR_SET = 32000;
const OUT_SR = 48000;
const F0 = 440;
const N = SR_SET * 2;
const MARKER = 2048;
const DATA0 = MARKER + 6144;
const total = DATA0 + N + 4096;
const pcm = new Float32Array(total);
pcm[MARKER] = 0.9;
// band-limited sawtooth, exact period so the loop below is seamless
const H = Math.floor(15000 / F0);
for (let i = 0; i < N; i++) {
  let v = 0;
  for (let h = 1; h <= H; h++) v += Math.sin((2 * Math.PI * F0 * h * i) / SR_SET) / h;
  pcm[DATA0 + i] = 0.4 * v;
}
const period = SR_SET / F0; // 72.727 samples: 11 periods = 800 samples exactly
const ls = 8000;
const le = ls + Math.round(period * 110); // 8000 samples = 110 periods exactly
const zone = { p: 69, lo: 0, hi: 127, l: 0, r: 0, o: DATA0, n: N, pre: 0, g: 1, ls, le };
const set = { name: 'violin', file: 'x', sr: SR_SET, ch: 1, marker: MARKER, win: MARKER + 4096, zones: [zone] };
let inst = null;
A.installSampleBank({ sets: [set], pcm: [{ name: 'violin', sr: SR_SET, data: [pcm] }] }, (defs) => {
  inst = defs.find((d) => d.id === 'violin');
});
if (!inst) throw new Error('no instrument');

function dft(x, f, sr) {
  let re = 0;
  let im = 0;
  const w = (2 * Math.PI * f) / sr;
  for (let i = 0; i < x.length; i++) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (x.length - 1));
    re += x[i] * hann * Math.cos(w * i);
    im -= x[i] * hann * Math.sin(w * i);
  }
  return Math.hypot(re, im) / (x.length / 4);
}

let bad = 0;
console.log('shift  cents   passband(dB)  residual(dB)  [aliasing + interpolation error vs total]');
for (const shift of [-12, -7, -5, -2, -1, 0, 1, 2, 5, 7, 9, 12]) {
  const s = inst.make(OUT_SR, 69 + shift, 0, 1.2, 0);
  const x = s.l.subarray(Math.round(0.4 * OUT_SR), Math.round(0.4 * OUT_SR) + 8192 * 2);
  const f = F0 * Math.pow(2, shift / 12);
  // tuning: refine the fundamental by a fine search around f
  let bestF = f;
  let bestM = 0;
  for (let c = -20; c <= 20; c += 0.25) {
    const ff = f * Math.pow(2, c / 1200);
    const mm = dft(x, ff, OUT_SR);
    if (mm > bestM) {
      bestM = mm;
      bestF = ff;
    }
  }
  const cents = 1200 * Math.log2(bestF / f);
  // passband: harmonic levels (relative to 1/h) for harmonics below 12 kHz
  let dev = 0;
  let harmE = 0;
  for (let h = 1; h * f < OUT_SR / 2 && h <= H; h++) {
    const a = dft(x, h * f, OUT_SR);
    harmE += a * a;
    if (h * f < 12000) {
      const ref = 0.4 / h;
      dev = Math.max(dev, Math.abs(20 * Math.log10(a / ref + 1e-12)));
    }
  }
  // residual: total energy minus harmonic energy (Parseval with Hann: use time-domain power)
  let tot = 0;
  for (let i = 0; i < x.length; i++) tot += x[i] * x[i];
  tot /= x.length;
  const harmPow = harmE / 2 * 0.375 / 0.375; // a = amplitude → power a^2/2
  const resid = Math.max(1e-14, tot - harmPow);
  const residDb = 10 * Math.log10(resid / tot);
  const okC = Math.abs(cents) <= 1;
  const okP = dev <= 1;
  const okR = residDb <= -50;
  if (!okC || !okP || !okR) bad++;
  console.log(`${String(shift).padStart(5)}  ${cents.toFixed(2).padStart(6)}   ${dev.toFixed(2).padStart(10)}   ${residDb.toFixed(1).padStart(11)}  ${okC && okP && okR ? 'ok' : 'FAIL'}`);
}
process.exitCode = bad ? 1 : 0;
