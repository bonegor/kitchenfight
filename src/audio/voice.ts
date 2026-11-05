/**
 * "Animalese"-style gibberish speech for comic speech bubbles.
 * One short formant-synth syllable per ~2 letters (max 12). Vowels follow the text's own vowels
 * (Italian a/e/i/o/u formants), consonants become tiny plosive / nasal / fricative / tap onsets.
 * Pitch contour, timbre and tempo depend on the mood.
 */
import type { VoiceMood } from './audio';
import { clamp, hashStr, Rng, Svf, TAU } from './dsp';

const VOWELS: Record<string, [number, number, number]> = {
  a: [800, 1300, 2550],
  e: [480, 1850, 2550],
  i: [300, 2300, 3000],
  o: [500, 880, 2450],
  u: [330, 750, 2400],
};

type Cons = 'none' | 'plosiveLo' | 'plosiveHi' | 'plosiveMid' | 'nasal' | 'tap' | 'liquid' | 'fric' | 'sh';
function consType(c: string): Cons {
  if ('pb'.includes(c)) return 'plosiveLo';
  if ('td'.includes(c)) return 'plosiveHi';
  if ('kgcq'.includes(c)) return 'plosiveMid';
  if ('mn'.includes(c)) return 'nasal';
  if (c === 'r') return 'tap';
  if (c === 'l') return 'liquid';
  if ('szx'.includes(c)) return 'fric';
  if ('fvhjwy'.includes(c)) return 'sh';
  return 'none';
}

interface MoodCfg {
  f0: number; // base pitch Hz
  tract: number; // formant scale
  syl: number; // syllable seconds
  gap: number; // gap between syllables
  amp: number;
  breath: number;
  jitter: number;
  drive: number;
  vib: number; // vibrato depth (semitones)
  vibRate: number;
  defaultVowel: string;
}
const MOODS: Record<VoiceMood, MoodCfg> = {
  angry: { f0: 155, tract: 0.95, syl: 0.075, gap: 0.014, amp: 1.0, breath: 0.05, jitter: 0.02, drive: 1.2, vib: 0, vibRate: 0, defaultVowel: 'a' },
  happy: { f0: 235, tract: 1.06, syl: 0.08, gap: 0.016, amp: 0.85, breath: 0.04, jitter: 0.005, drive: 0, vib: 0.15, vibRate: 6, defaultVowel: 'e' },
  surprised: { f0: 245, tract: 1.06, syl: 0.085, gap: 0.016, amp: 0.9, breath: 0.05, jitter: 0.005, drive: 0, vib: 0.1, vibRate: 6, defaultVowel: 'o' },
  nonna: { f0: 285, tract: 1.12, syl: 0.1, gap: 0.022, amp: 0.8, breath: 0.12, jitter: 0.012, drive: 0, vib: 0.7, vibRate: 6.5, defaultVowel: 'a' },
  boss: { f0: 82, tract: 0.78, syl: 0.12, gap: 0.02, amp: 1.0, breath: 0.08, jitter: 0.05, drive: 2.2, vib: 0.2, vibRate: 4, defaultVowel: 'o' },
  cat: { f0: 520, tract: 1.35, syl: 0.15, gap: 0.03, amp: 0.75, breath: 0.03, jitter: 0.004, drive: 0, vib: 0.2, vibRate: 7, defaultVowel: 'a' },
};

interface Syl {
  cons: Cons;
  vowel: string;
}

function syllables(text: string, mood: VoiceMood): Syl[] {
  const letters = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
  const n = clamp(Math.ceil(letters.length / 2), 1, 12);
  const out: Syl[] = [];
  const cfg = MOODS[mood];
  for (let k = 0; k < n; k++) {
    const chunk = letters.slice(k * 2, k * 2 + 2) || cfg.defaultVowel;
    let cons: Cons = 'none';
    let vowel = '';
    for (const c of chunk) {
      if ('aeiou'.includes(c)) {
        if (!vowel) vowel = c;
      } else if (cons === 'none' && !vowel) cons = consType(c);
    }
    if (!vowel) {
      // borrow the next vowel in the text so "grr" or "pss" still sings
      const rest = letters.slice(k * 2 + 2);
      const m = /[aeiou]/.exec(rest);
      vowel = m ? m[0] : cfg.defaultVowel;
    }
    out.push({ cons, vowel });
  }
  return out;
}

/** Render a voice line (mono). */
export function renderVoice(sr: number, text: string, mood: VoiceMood): Float32Array {
  const cfg = MOODS[mood];
  const syls = syllables(text, mood);
  const rng = new Rng(hashStr(text + mood));
  const n = syls.length;
  // timing
  const starts: number[] = [];
  const durs: number[] = [];
  let t = 0.01;
  for (let k = 0; k < n; k++) {
    const d = cfg.syl * (0.85 + 0.3 * rng.next()) * (k === n - 1 ? 1.35 : 1);
    starts.push(t);
    durs.push(d);
    t += d + cfg.gap * (0.7 + 0.6 * rng.next());
  }
  const total = t + 0.08;
  const len = Math.round(total * sr);
  const out = new Float32Array(len);
  // per-syllable pitch targets (semitones relative to base)
  const semis: number[] = [];
  for (let k = 0; k < n; k++) {
    const x = n === 1 ? 1 : k / (n - 1);
    let s = 0;
    switch (mood) {
      case 'angry':
        s = 2 - 6 * x + (rng.next() - 0.5) * 1.5;
        break;
      case 'happy':
        s = (k % 2 ? -2.5 : 2) + 4 * x * x + (rng.next() - 0.5);
        break;
      case 'surprised':
        s = -1 + 9 * x * x + (rng.next() - 0.5);
        break;
      case 'nonna':
        s = 1.5 - 3 * x + (k % 2 ? -1 : 1) + (rng.next() - 0.5);
        break;
      case 'boss':
        s = 1 - 5 * x + (rng.next() - 0.5) * 2;
        break;
      case 'cat':
        s = (rng.next() - 0.5) * 4 + (k === n - 1 ? -2 : 0);
        break;
    }
    semis.push(s);
  }
  // source + formant filters
  const f1 = new Svf(sr, 700, 6);
  const f2 = new Svf(sr, 1200, 8);
  const f3 = new Svf(sr, 2600, 10);
  const nasal = new Svf(sr, 260, 4);
  const fric = new Svf(sr, 5000, 1.2);
  let ph = 0;
  let jit = 1;
  const BLK = 16;
  for (let b = 0; b < len; b += BLK) {
    const tb = b / sr;
    // which syllable are we in (or between)
    let k = 0;
    while (k < n - 1 && tb >= starts[k + 1]) k++;
    const local = tb - starts[k];
    const d = durs[k];
    const prog = clamp(local / d, 0, 1);
    const syl = syls[k];
    // formants: glide from previous vowel over the first 25 ms (cat: i→a→u meow glide)
    let F = VOWELS[syl.vowel];
    if (mood === 'cat') {
      const a = VOWELS.i;
      const m = VOWELS.a;
      const u = VOWELS.u;
      F = prog < 0.45 ? mixF(a, m, prog / 0.45) : mixF(m, u, (prog - 0.45) / 0.55);
    } else if (k > 0 && local < 0.025) {
      F = mixF(VOWELS[syls[k - 1].vowel], F, local / 0.025);
    }
    const sc = cfg.tract;
    f1.set(F[0] * sc, 5);
    f2.set(F[1] * sc, 7);
    f3.set(F[2] * sc, 9);
    // pitch
    let semi = semis[k];
    if (mood === 'angry') semi -= 3 * prog;
    else if (mood === 'surprised' && k === n - 1) semi += 5 * prog;
    else if (mood === 'happy') semi += 1.5 * Math.sin(Math.PI * prog);
    else if (mood === 'cat') semi += 5 * Math.sin(Math.PI * Math.min(1, prog * 1.2)) - 2 * prog;
    else if (mood === 'boss') semi -= 1.5 * prog;
    const vib = cfg.vib * Math.sin(TAU * cfg.vibRate * tb);
    const f0 = cfg.f0 * Math.pow(2, (semi + vib) / 12);
    // amplitude envelope (syllable) + consonant shaping
    const inSyl = local >= 0 && local <= d;
    const att = syl.cons.startsWith('plosive') ? 0.004 : 0.009;
    let env = inSyl ? Math.min(1, local / att) * Math.min(1, (d - local) / 0.022) : 0;
    let consNoise = 0;
    let nasalAmt = 0;
    const cl = local; // consonant time
    switch (syl.cons) {
      case 'plosiveLo':
      case 'plosiveHi':
      case 'plosiveMid':
        // short closure then burst
        if (cl < 0.012) env *= 0.05;
        else if (cl < 0.02) consNoise = 0.9;
        break;
      case 'nasal':
        if (cl < 0.03) {
          nasalAmt = 1;
          env *= 0.35;
        }
        break;
      case 'tap':
        if (cl > 0.006 && cl < 0.02) env *= 0.25;
        break;
      case 'liquid':
        if (cl < 0.02) {
          f2.set(1100 * sc, 6);
        }
        break;
      case 'fric':
        if (cl < 0.035) {
          consNoise = 0.6;
          env *= 0.2;
        }
        break;
      case 'sh':
        if (cl < 0.028) {
          consNoise = 0.45;
          env *= 0.35;
        }
        break;
    }
    if (syl.cons === 'plosiveLo') fric.set(900, 0.9);
    else if (syl.cons === 'plosiveHi' || syl.cons === 'fric') fric.set(5200, 1.1);
    else fric.set(2400, 1.0);
    const be = Math.min(len, b + BLK);
    for (let i = b; i < be; i++) {
      ph += (f0 * jit) / sr;
      if (ph >= 1) {
        ph -= 1;
        if (cfg.jitter) jit = 1 + rng.bi() * cfg.jitter;
      }
      const src = (ph < 0.55 ? Math.sin((Math.PI * ph) / 0.55) ** 2 : 0) - 0.3;
      const nz = rng.bi();
      const x = src + nz * cfg.breath;
      f1.lp(x);
      f2.lp(x);
      f3.lp(x);
      let v = (f1.bp * 1.0 + f2.bp * 0.55 + f3.bp * 0.22) * env;
      if (nasalAmt) {
        nasal.lp(src);
        v += nasal.bp * 0.6 * nasalAmt * (inSyl ? 1 : 0);
      }
      if (consNoise) {
        const lpOut = fric.lp(nz);
        v += (syl.cons === 'plosiveLo' ? lpOut * 0.4 : fric.bp) * consNoise * 0.5;
      }
      if (cfg.drive) v = Math.tanh(v * (1 + cfg.drive)) / Math.tanh(1 + cfg.drive);
      out[i] = v * cfg.amp;
    }
  }
  // boss: add a sub-octave growl
  if (mood === 'boss') {
    let p2 = 0;
    for (let i = 0; i < len; i++) {
      p2 += (cfg.f0 * 0.5) / sr;
      out[i] += Math.sin(TAU * p2) * 0.15 * Math.min(1, Math.abs(out[i]) * 6);
    }
  }
  // normalise, gentle fades
  let pk = 1e-9;
  for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(out[i]));
  const g = 0.89 / pk;
  const nf = Math.round(0.01 * sr);
  for (let i = 0; i < len; i++) {
    const f = Math.min(1, i / 32, (len - 1 - i) / nf);
    out[i] *= g * f;
  }
  return out;
}

function mixF(a: [number, number, number], b: [number, number, number], x: number): [number, number, number] {
  const y = clamp(x, 0, 1);
  return [a[0] + (b[0] - a[0]) * y, a[1] + (b[1] - a[1]) * y, a[2] + (b[2] - a[2]) * y];
}
