/**
 * Feedback-delay-network reverb, processed at half the sample rate (the tail needs no content
 * above ~9 kHz), time-invariant (no modulation) so rendered loops stay sample-exact at the seam.
 * 8 delay lines, Hadamard feedback, per-line HF damping, Dattorro-style input diffusion,
 * a few early reflections. Mono send in → stereo out (added into L/R).
 */
import { Biquad, type Slicer } from './dsp';

export interface ReverbOpts {
  /** decay time (s) at low/mid frequencies */
  rt60: number;
  /** delay-line scale (room size) ~0.6 (small) .. 1.4 (hall) */
  size: number;
  /** HF decay ratio (0.3 = dark, 0.8 = bright) */
  damp: number;
  /** pre-delay seconds */
  predelay: number;
  /** early reflections level */
  er?: number;
  /** send high-pass (Hz) — keeps the low-mids clean */
  hp?: number;
  /** send low-pass (Hz) */
  lp?: number;
  /** wet output gain */
  wet?: number;
}

const BASE_LINES = [1031, 1327, 1523, 1801, 2053, 2311, 2579, 2903]; // samples @ 24 kHz
const DIFF = [142, 107, 379, 277]; // Dattorro input diffusers @ 29.76 kHz
const ER_TAPS: Array<[number, number, number]> = [
  // [ms, gainL, gainR]
  [7.1, 0.55, 0.2],
  [11.3, 0.2, 0.5],
  [16.9, 0.42, 0.18],
  [22.7, 0.16, 0.4],
  [29.3, 0.32, 0.22],
  [37.9, 0.2, 0.3],
];

export async function applyReverb(
  send: Float32Array,
  L: Float32Array,
  R: Float32Array,
  sr: number,
  o: ReverbOpts,
  slicer: Slicer,
): Promise<void> {
  const n = Math.min(send.length, L.length);
  // 1. band-limit the send at full rate
  const filters = [Biquad.hp(sr, o.hp ?? 220, 0.6), Biquad.lp(sr, o.lp ?? 7500, 0.6), Biquad.lp(sr, 10000, 0.7)];
  const BLK = 16384;
  for (const f of filters) {
    for (let s = 0; s < n; s += BLK) {
      f.run(send, s, Math.min(n, s + BLK));
      if (slicer.due()) await slicer.yield();
    }
  }
  // 2. half-rate processing
  const hsr = sr / 2;
  const hn = Math.ceil(n / 2);
  const outL = new Float32Array(hn + 1);
  const outR = new Float32Array(hn + 1);
  const scale = o.size;
  const lens = BASE_LINES.map((l) => Math.max(64, Math.round(((l * hsr) / 24000) * scale)));
  const lineBits = 13; // 8192 > max length
  const LSIZE = 1 << Math.max(lineBits, Math.ceil(Math.log2(Math.max(...lens) + 2)));
  const lmask = LSIZE - 1;
  const lines = lens.map(() => new Float32Array(LSIZE));
  const gains = lens.map((l) => Math.pow(10, (-3 * l) / (o.rt60 * hsr)));
  // damping: one-pole low-pass per line, tuned so HF (~6 kHz) decays faster
  const hfRt = o.rt60 * o.damp;
  const damps = lens.map((l) => {
    const gHF = Math.pow(10, (-3 * l) / (hfRt * hsr));
    const gLF = Math.pow(10, (-3 * l) / (o.rt60 * hsr));
    const ratio = Math.min(0.999, gHF / gLF); // desired attenuation at HF relative to LF
    // one-pole y += a (x - y): gain at Nyquist-ish ≈ a / (2 - a)  → solve a for ratio at ~6 kHz
    const w = (2 * Math.PI * 6000) / hsr;
    // |H(w)| = a / sqrt(1 + (1-a)^2 - 2(1-a)cos w)
    let lo = 0.01;
    let hi = 1;
    for (let it = 0; it < 30; it++) {
      const a = (lo + hi) / 2;
      const mag = a / Math.sqrt(1 + (1 - a) * (1 - a) - 2 * (1 - a) * Math.cos(w));
      if (mag > ratio) hi = a;
      else lo = a;
    }
    return (lo + hi) / 2;
  });
  const lpState = new Float64Array(8);
  // diffusers
  const dl = DIFF.map((d) => Math.max(8, Math.round((d * hsr) / 29761)));
  const dg = [0.75, 0.75, 0.625, 0.625];
  const DSIZE = 1024;
  const dmask = DSIZE - 1;
  const dbuf = dl.map(() => new Float32Array(DSIZE));
  // pre-delay + early reflections
  const pre = Math.max(1, Math.round(o.predelay * hsr));
  const PSIZE = 1 << Math.ceil(Math.log2(pre + Math.round(0.05 * hsr * Math.max(1, scale)) + 4));
  const pmask = PSIZE - 1;
  const pbuf = new Float32Array(PSIZE);
  const er = o.er ?? 0.35;
  const taps = ER_TAPS.map(([ms, gl, gr]) => [Math.round((ms * scale * hsr) / 1000), gl * er, gr * er] as [number, number, number]);
  let w = 0;
  let pw = 0;
  let dw = 0;
  const l0 = lines[0], l1 = lines[1], l2 = lines[2], l3 = lines[3], l4 = lines[4], l5 = lines[5], l6 = lines[6], l7 = lines[7];
  const [n0, n1, n2, n3, n4, n5, n6, n7] = lens;
  const [g0, g1, g2, g3, g4, g5, g6, g7] = gains;
  const [a0, a1, a2, a3, a4, a5, a6, a7] = damps;
  const [d0, d1, d2, d3] = dl;
  const [db0, db1, db2, db3] = dbuf;
  const H = 0.35355339059327373; // 1/sqrt(8)
  const BLK2 = 8192;
  for (let s = 0; s < hn; s += BLK2) {
    const e = Math.min(hn, s + BLK2);
    for (let i = s; i < e; i++) {
      const x = send[i * 2] ?? 0;
      pbuf[pw] = x;
      const xd = pbuf[(pw - pre) & pmask];
      let el = 0;
      let erR = 0;
      for (let t = 0; t < taps.length; t++) {
        const v = pbuf[(pw - pre - taps[t][0]) & pmask];
        el += v * taps[t][1];
        erR += v * taps[t][2];
      }
      pw = (pw + 1) & pmask;
      // input diffusion (allpass chain)
      let u = xd;
      let z = db0[(dw - d0) & dmask];
      let y = z - dg[0] * u;
      db0[dw] = u + dg[0] * y;
      u = y;
      z = db1[(dw - d1) & dmask];
      y = z - dg[1] * u;
      db1[dw] = u + dg[1] * y;
      u = y;
      z = db2[(dw - d2) & dmask];
      y = z - dg[2] * u;
      db2[dw] = u + dg[2] * y;
      u = y;
      z = db3[(dw - d3) & dmask];
      y = z - dg[3] * u;
      db3[dw] = u + dg[3] * y;
      u = y;
      dw = (dw + 1) & dmask;
      // FDN
      const o0 = l0[(w - n0) & lmask];
      const o1 = l1[(w - n1) & lmask];
      const o2 = l2[(w - n2) & lmask];
      const o3 = l3[(w - n3) & lmask];
      const o4 = l4[(w - n4) & lmask];
      const o5 = l5[(w - n5) & lmask];
      const o6 = l6[(w - n6) & lmask];
      const o7 = l7[(w - n7) & lmask];
      const s0 = (lpState[0] += a0 * (o0 * g0 - lpState[0]));
      const s1 = (lpState[1] += a1 * (o1 * g1 - lpState[1]));
      const s2 = (lpState[2] += a2 * (o2 * g2 - lpState[2]));
      const s3 = (lpState[3] += a3 * (o3 * g3 - lpState[3]));
      const s4 = (lpState[4] += a4 * (o4 * g4 - lpState[4]));
      const s5 = (lpState[5] += a5 * (o5 * g5 - lpState[5]));
      const s6 = (lpState[6] += a6 * (o6 * g6 - lpState[6]));
      const s7 = (lpState[7] += a7 * (o7 * g7 - lpState[7]));
      const b0 = s0 + s1, b1 = s0 - s1, b2 = s2 + s3, b3 = s2 - s3;
      const b4 = s4 + s5, b5 = s4 - s5, b6 = s6 + s7, b7 = s6 - s7;
      const c0 = b0 + b2, c1 = b1 + b3, c2 = b0 - b2, c3 = b1 - b3;
      const c4 = b4 + b6, c5 = b5 + b7, c6 = b4 - b6, c7 = b5 - b7;
      const inj = u * 0.5;
      l0[w] = (c0 + c4) * H + inj;
      l1[w] = (c1 + c5) * H - inj;
      l2[w] = (c2 + c6) * H + inj;
      l3[w] = (c3 + c7) * H - inj;
      l4[w] = (c0 - c4) * H + inj;
      l5[w] = (c1 - c5) * H + inj;
      l6[w] = (c2 - c6) * H - inj;
      l7[w] = (c3 - c7) * H - inj;
      w = (w + 1) & lmask;
      outL[i] = (o0 - o2 + o4 - o6 + 0.6 * (o1 + o5)) * 0.42 + el;
      outR[i] = (o1 - o3 + o5 - o7 + 0.6 * (o2 + o6)) * 0.42 + erR;
    }
    // denormal guard
    for (let k = 0; k < 8; k++) if (Math.abs(lpState[k]) < 1e-20) lpState[k] = 0;
    if (slicer.due()) await slicer.yield();
  }
  // 3. upsample (linear) + smoothing low-pass, add into L/R
  const wet = o.wet ?? 1;
  const sl = Biquad.lp(sr, 9500, 0.6);
  const srr = Biquad.lp(sr, 9500, 0.6);
  for (let s = 0; s < n; s += BLK) {
    const e = Math.min(n, s + BLK);
    for (let i = s; i < e; i++) {
      const h = i >> 1;
      let vl: number;
      let vr: number;
      if (i & 1) {
        vl = 0.5 * (outL[h] + outL[h + 1]);
        vr = 0.5 * (outR[h] + outR[h + 1]);
      } else {
        vl = outL[h];
        vr = outR[h];
      }
      L[i] += sl.process(vl) * wet;
      R[i] += srr.process(vr) * wet;
    }
    if (slicer.due()) await slicer.yield();
  }
}
