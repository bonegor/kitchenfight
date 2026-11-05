#!/usr/bin/env node
/**
 * Unit test of the sampler's pitch shifter (src/audio/sampled.ts) on a synthetic zone, no MP3:
 * a band-limited sawtooth (A4, harmonics up to 13.6 kHz at 32 kHz — the 32 kHz MP3s are
 * low-passed by LAME around 14-15 kHz) looped like a real zone, played
 * back through the real InstDef at shifts from -12 to +12 semitones into a 48 kHz output.
 *
 * Reports per shift: tuning error (cents), passband deviation of the harmonics below 12 kHz in the
 * output and 12.8 kHz (0.8 x Nyquist) in the source (dB), and the inharmonic residual = energy NOT at harmonic frequencies, i.e. aliasing +
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
const H = Math.floor(13600 / F0);
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

function fftMag(x) {
  // Blackman-Harris windowed power spectrum (radix-2), |X|^2 per bin
  const n = x.length;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / (n - 1);
    const w = 0.35875 - 0.48829 * Math.cos(t) + 0.14128 * Math.cos(2 * t) - 0.01168 * Math.cos(3 * t);
    re[i] = x[i] * w;
  }
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const c = Math.cos(ang * k);
        const sn = Math.sin(ang * k);
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * c - im[i + k + len / 2] * sn;
        const vi = re[i + k + len / 2] * sn + im[i + k + len / 2] * c;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
      }
  }
  const p = new Float64Array(n / 2);
  for (let k = 0; k < n / 2; k++) p[k] = re[k] * re[k] + im[k] * im[k];
  return p;
}

let bad = 0;
console.log('shift  cents   passband(dB)  residual(dB)  [energy away from the harmonics = aliasing + interpolation error, re total]');
const NF = 32768;
for (const shift of [-12, -7, -5, -2, -1, 0, 1, 2, 5, 7, 9, 12]) {
  const s = inst.make(OUT_SR, 69 + shift, 0, 1.2, 0);
  const x = s.l.subarray(Math.round(0.3 * OUT_SR), Math.round(0.3 * OUT_SR) + NF);
  const f = F0 * Math.pow(2, shift / 12);
  const P = fftMag(x);
  const bin = OUT_SR / NF;
  // tuning: parabolic peak of the fundamental
  const k0 = Math.round(f / bin);
  let kp = k0;
  for (let k = k0 - 8; k <= k0 + 8; k++) if (P[k] > P[kp]) kp = k;
  const a = Math.log(P[kp - 1]), b = Math.log(P[kp]), c = Math.log(P[kp + 1]);
  const fk = (kp + (0.5 * (a - c)) / (a - 2 * b + c)) * bin;
  const cents = 1200 * Math.log2(fk / f);
  // harmonic energies (±6 bins around each harmonic) and the residual
  let tot = 0;
  for (let k = 2; k < P.length; k++) tot += P[k];
  let harm = 0;
  const amp = [];
  for (let h = 1; h * f < OUT_SR / 2 - 6 * bin; h++) {
    const kc = Math.round((h * f) / bin);
    let e = 0;
    for (let k = kc - 6; k <= kc + 6; k++) e += P[k] ?? 0;
    harm += e;
    amp.push(Math.sqrt(e));
  }
  const residDb = 10 * Math.log10(Math.max(1e-16, tot - harm) / tot);
  // passband: harmonic level relative to the fundamental vs the 1/h sawtooth law (below 12 kHz)
  let dev = 0;
  for (let h = 2; h <= amp.length && h * f < 12000 && h * F0 <= 0.8 * (SR_SET / 2) && h <= H; h++)
    dev = Math.max(dev, Math.abs(20 * Math.log10((amp[h - 1] / amp[0]) * h)));
  const okC = Math.abs(cents) <= 1;
  const okP = dev <= 1;
  const okR = residDb <= -50;
  if (!okC || !okP || !okR) bad++;
  console.log(`${String(shift).padStart(5)}  ${cents.toFixed(3).padStart(6)}   ${dev.toFixed(2).padStart(10)}   ${residDb.toFixed(1).padStart(11)}  ${okC && okP && okR ? 'ok' : 'FAIL'}`);
}
process.exitCode = bad ? 1 : 0;
