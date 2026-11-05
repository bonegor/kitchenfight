/** Note names, chords, scales and voice-leading helpers for the music DSL. */

const LETTER: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** 'C4' → 60, 'Bb3' → 58, 'F#5' → 78 (C4 = middle C). Throws on garbage. */
export function noteToMidi(s: string): number {
  const m = /^([A-Ga-g])([#b]*)(-?\d)$/.exec(s);
  if (!m) throw new Error(`bad note "${s}"`);
  let pc = LETTER[m[1].toLowerCase()];
  for (const ch of m[2]) pc += ch === '#' ? 1 : -1;
  return pc + (parseInt(m[3], 10) + 1) * 12;
}

/** Pitch class of a note name without octave: 'Bb' → 10. */
export function pcOf(name: string): number {
  const m = /^([A-Ga-g])([#b]*)$/.exec(name);
  if (!m) throw new Error(`bad pitch class "${name}"`);
  let pc = LETTER[m[1].toLowerCase()];
  for (const ch of m[2]) pc += ch === '#' ? 1 : -1;
  return ((pc % 12) + 12) % 12;
}

const QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7],
  M: [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  M7: [0, 4, 7, 11],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  mM7: [0, 3, 7, 11],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  '7sus4': [0, 5, 7, 10],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 14],
  madd9: [0, 3, 7, 14],
  '7b9': [0, 4, 7, 10, 13],
  '5': [0, 7],
};

export interface Chord {
  sym: string;
  root: number; // pitch class
  ivs: number[]; // intervals above root (may exceed 12)
  bass: number; // pitch class of the bass note
  pcs: number[]; // pitch classes (deduplicated, root first)
}

const chordCache = new Map<string, Chord>();

export function parseChord(sym: string): Chord {
  const hit = chordCache.get(sym);
  if (hit) return hit;
  const m = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec(sym);
  if (!m) throw new Error(`bad chord "${sym}"`);
  const root = pcOf(m[1]);
  const ivs = QUALITIES[m[2]];
  if (!ivs) throw new Error(`unknown chord quality "${m[2]}" in "${sym}"`);
  const bass = m[3] ? pcOf(m[3]) : root;
  const pcs: number[] = [];
  for (const iv of ivs) {
    const pc = (root + iv) % 12;
    if (!pcs.includes(pc)) pcs.push(pc);
  }
  const c: Chord = { sym, root, ivs, bass, pcs };
  chordCache.set(sym, c);
  return c;
}

/** Midi note with pitch class pc closest to `near` (ties → lower). */
export function nearestPc(pc: number, near: number): number {
  const base = near - (((near - pc) % 12) + 12) % 12; // <= near
  return near - base <= base + 12 - near ? base : base + 12;
}

/** Place pitch class pc inside [lo, hi], closest to `prev` if given (else lowest). */
export function placeInRange(pc: number, lo: number, hi: number, prev?: number): number {
  const cands: number[] = [];
  let m = lo + ((((pc - lo) % 12) + 12) % 12);
  for (; m <= hi; m += 12) cands.push(m);
  if (!cands.length) return lo + ((((pc - lo) % 12) + 12) % 12);
  if (prev === undefined) return cands[0];
  let best = cands[0];
  for (const c of cands) if (Math.abs(c - prev) < Math.abs(best - prev)) best = c;
  return best;
}

/**
 * Close-position voicing of a chord within [lo, hi], chosen to move as little as possible from
 * `prev` (voice leading). `n` = number of voices (default: number of chord tones, max 4).
 * Drops the fifth first when the chord has more tones than voices.
 */
export function voiceChord(ch: Chord, lo: number, hi: number, prev: number[] | null, n?: number): number[] {
  let pcs = ch.pcs.slice();
  const nv = n ?? Math.min(4, pcs.length);
  if (pcs.length > nv) {
    // drop fifth, then root (keep 3rd & 7th colour)
    const fifth = (ch.root + 7) % 12;
    if (pcs.includes(fifth) && pcs.length > nv) pcs = pcs.filter((p) => p !== fifth);
    while (pcs.length > nv) pcs.splice(0, 1);
  }
  while (pcs.length < nv) pcs.push(pcs[0]); // double root
  let best: number[] | null = null;
  let bestScore = Infinity;
  // try every rotation (inversion) starting at every octave within range
  for (let rot = 0; rot < pcs.length; rot++) {
    const order = pcs.slice(rot).concat(pcs.slice(0, rot));
    for (let start = lo; start < lo + 12; start++) {
      if ((start % 12 + 12) % 12 !== order[0]) continue;
      for (let oct = 0; start + oct <= hi; oct += 12) {
        const v: number[] = [start + oct];
        for (let i = 1; i < order.length; i++) {
          let x = v[i - 1] + 1;
          while ((x % 12 + 12) % 12 !== order[i]) x++;
          v.push(x);
        }
        if (v[v.length - 1] > hi || v[0] < lo) continue;
        let score: number;
        if (prev && prev.length) {
          score = 0;
          const sp = prev.slice().sort((a, b) => a - b);
          for (let i = 0; i < v.length; i++) score += Math.abs(v[i] - sp[Math.min(i, sp.length - 1)]);
        } else {
          // prefer centred voicings
          const mid = (lo + hi) / 2;
          score = Math.abs((v[0] + v[v.length - 1]) / 2 - mid);
        }
        if (score < bestScore) {
          bestScore = score;
          best = v;
        }
      }
    }
  }
  if (!best) {
    // range too small: stack upward from lo
    best = [];
    let x = lo;
    for (const pc of pcs) {
      while ((x % 12 + 12) % 12 !== pc) x++;
      best.push(x);
    }
  }
  return best;
}

/** Scale pitch classes from a name like 'A harmonic minor', 'G major', 'D minor'. */
export function scalePcs(name: string): number[] {
  const [tonic, ...rest] = name.split(' ');
  const kind = rest.join(' ');
  const t = pcOf(tonic);
  const steps: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    'natural minor': [0, 2, 3, 5, 7, 8, 10],
    'harmonic minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic minor': [0, 2, 3, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
  };
  const s = steps[kind] ?? steps.major;
  return s.map((x) => (t + x) % 12);
}

/** Next scale tone above midi m (diatonic upper neighbour); falls back to +2. */
export function upperNeighbour(m: number, scale: number[]): number {
  for (let k = 1; k <= 2; k++) if (scale.includes((m + k) % 12)) return m + k;
  return m + 2;
}
export function lowerNeighbour(m: number, scale: number[]): number {
  for (let k = 1; k <= 2; k++) if (scale.includes((((m - k) % 12) + 12) % 12)) return m - k;
  return m - 2;
}
