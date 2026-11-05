#!/usr/bin/env node
/**
 * export-song.mjs — dump a song's note events (exactly as the sequencer generates them) as JSON,
 * as a readable bar-by-bar listing, or as ABC (for comparisons / viewing in any ABC editor).
 *
 * Usage (from the repo root):
 *   node scripts/music/export-song.mjs <songId> [options]
 *   node scripts/music/export-song.mjs --file path/to/scratch.ts [--export name] [options]
 *
 *   <songId>            game track id: title menu kitchen trattoria streets foodcourt boss finalboss victory gameover
 *   --file F.ts         a scratch song module (default export or the only exported SongDef; --export picks one)
 *   --channel a[,b]     only these channels (default: all)
 *   --section NAME      only this section, times relative to its start (bars 1-based inside the section)
 *   --form              print only the structure (meter, sections, form timeline, loop window, channels)
 *   --per-section       each section once (in form order) instead of following the full form
 *   --text              human-readable bar-by-bar listing in DSL token form (A4:2 = 2 steps)
 *   --abc               ABC transcription of the selected channel(s) (top note of chords, graces dropped)
 *   --mono              reduce to one line: highest note per onset, graces dropped (implied by --abc)
 *   --no-graces         drop grace notes / mordent auxiliaries from the JSON
 *   --out FILE          write to FILE instead of stdout
 *
 * JSON output (default): {
 *   song, bpm, meter: {barSteps, stepsPerBeat, beatsPerBar, secPerBeat, secPerBar, swing},
 *   scale, sections: {name: {bars, chords, occurrences}}, form: [{index, name, startBar, bars,
 *   startBeat, startSec, endSec, inLoop}], loop: {loopFrom, oneShot, loopStartSec, loopEndSec,
 *   loopStartBar, loopEndBar, tail}, warnings: [sequencer warnings, e.g. wrong bar lengths],
 *   channels: {ch: {inst, gain, pan, send, events: [
 *     {midi, note, startStep, startBeat, startSec, durSteps, durBeats, durSec, vel, section,
 *      formIndex, bar, sectionBar, beatInBar, [grace, offSec, trem, gate]} ]}}
 * }
 * Times: steps/beats are exact grid positions (no humanize); seconds include swing but not the
 * renderer's humanize jitter or gates. `bar` is 1-based over the whole form (or the section with
 * --section); grace notes carry `offSec` (their offset before the beat).
 */
import fs from 'node:fs';
import { loadAudio, parseArgs, resolveSong } from './lib/bundle.mjs';

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = 'CDEFGAB';
const SCALE_STEPS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  'natural minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic minor': [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};
/** Note speller for a song scale ('A harmonic minor' → G#, 'F major' → Bb); display only. */
export function speller(scale) {
  const [tonic = 'C', ...rest] = String(scale || 'C major').split(' ');
  const steps = SCALE_STEPS[rest.join(' ')] ?? SCALE_STEPS.major;
  const t0 = LETTER_PC[tonic[0].toUpperCase()] ?? 0;
  const tpc = (((t0 + [...tonic.slice(1)].reduce((a, c) => a + (c === '#' ? 1 : c === 'b' ? -1 : 0), 0)) % 12) + 12) % 12;
  const li = LETTERS.indexOf(tonic[0].toUpperCase());
  const names = {};
  let flats = 0;
  let sharps = 0;
  steps.forEach((st, k) => {
    const pc = (tpc + st) % 12;
    const letter = LETTERS[(li + k) % 7];
    let diff = (((pc - LETTER_PC[letter]) % 12) + 12) % 12;
    if (diff > 6) diff -= 12;
    if (diff < 0) flats -= diff;
    if (diff > 0) sharps += diff;
    names[pc] = letter + (diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff));
  });
  // chromatic notes: follow the key's accidentals when it has 2+, else the common C#/Eb/F#/G#/Bb
  const COMMON = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const fallback = flats >= 2 ? FLATS : sharps >= 2 ? SHARPS : COMMON;
  return (m) => {
    const pc = ((m % 12) + 12) % 12;
    let n = names[pc] ?? fallback[pc];
    let oct = Math.floor(m / 12) - 1;
    // B#3 is C4, Cb5 is B4: keep the octave of the letter
    if (n.startsWith('B') && n.includes('#') && pc < 6) oct -= 1;
    if (n.startsWith('C') && n.includes('b') && pc > 6) oct += 1;
    return n + oct;
  };
}
export const midiName = (m) => SHARPS[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const r6 = (x) => Math.round(x * 1e6) / 1e6;

/** The sequencer's swing mapping (mirrors compileSong's stepToSec). */
function stepToSecFn(song) {
  const stepSec = 60 / (song.bpm * song.stepsPerBeat);
  const sw = song.swing ?? 0;
  return (s) => {
    if (!sw) return s * stepSec;
    const pair = Math.floor(s / 2);
    const p = s - pair * 2;
    const w = p < 1 ? p * (1 + sw) : 1 + sw + (p - 1) * (1 - sw);
    return (pair * 2 + w) * stepSec;
  };
}

/**
 * Generate all events of a song.
 * @returns structure described in the header (channels → events)
 */
export function extractSong(seq, song, o = {}) {
  const warnings = [];
  const stepToSec = stepToSecFn(song);
  const spb = song.stepsPerBeat;
  const bs = song.barSteps;
  const secEvents = new Map(); // section name → Ev[] (relative steps)
  const evsOf = (name) => {
    let evs = secEvents.get(name);
    if (!evs) {
      const ctx = seq.makeCtx(song, name, warnings);
      evs = [];
      for (const p of song.sections[name].parts) evs.push(...p(ctx));
      secEvents.set(name, evs);
    }
    return evs;
  };
  const sections = {};
  for (const [name, sec] of Object.entries(song.sections)) sections[name] = { bars: sec.bars, chords: sec.chords ?? null, occurrences: [] };
  const form = [];
  let pos = 0;
  let loopStartStep = null;
  song.form.forEach((name, fi) => {
    const sec = song.sections[name];
    if (!sec) {
      warnings.push(`[${song.id}] unknown section ${name}`);
      return;
    }
    if (song.loopFrom === fi) loopStartStep = pos;
    sections[name].occurrences.push(fi);
    form.push({
      index: fi,
      name,
      startBar: pos / bs + 1,
      bars: sec.bars,
      startStep: pos,
      startBeat: r6(pos / spb),
      startSec: r6(stepToSec(pos)),
      endSec: r6(stepToSec(pos + sec.bars * bs)),
      inLoop: song.loopFrom !== null && fi >= song.loopFrom,
    });
    pos += sec.bars * bs;
  });
  const endStep = pos;

  const want = o.channels ? new Set(o.channels) : null;
  const channels = {};
  for (const [ch, def] of Object.entries(song.channels)) {
    if (want && !want.has(ch)) continue;
    channels[ch] = { inst: def.inst, gain: def.gain, pan: def.pan ?? 0, send: def.send ?? null, events: [] };
  }
  if (want) for (const ch of want) if (!channels[ch]) warnings.push(`channel "${ch}" is not defined in song ${song.id} (channels: ${Object.keys(song.channels).join(', ')})`);

  const spell = speller(song.scale);
  const push = (e, base, name, fi, sectionRelative) => {
    const c = channels[e.ch];
    if (!c) {
      if (!song.channels[e.ch]) warnings.push(`[${song.id}/${name}] events on undefined channel ${e.ch}`);
      return;
    }
    if (o.noGraces && e.grace) return;
    const abs = base + e.s;
    const out = {
      midi: e.m,
      note: spell(e.m),
      startStep: r6(abs),
      startBeat: r6(abs / spb),
      startSec: r6(stepToSec(abs) + (e.offSec ?? 0)),
      durSteps: r6(e.d),
      durBeats: r6(e.d / spb),
      durSec: e.grace ? r6(e.graceSec ?? 0.048) : r6(stepToSec(abs + e.d) - stepToSec(abs)),
      vel: r6(e.v),
      section: name,
      formIndex: fi,
      bar: Math.floor(abs / bs + 1e-9) + 1,
      sectionBar: Math.floor(e.s / bs + 1e-9) + 1,
      beatInBar: r6((abs - Math.floor(abs / bs + 1e-9) * bs) / spb),
    };
    if (sectionRelative) out.bar = out.sectionBar;
    if (e.grace) out.grace = true;
    if (e.offSec) out.offSec = r6(e.offSec);
    if (e.trem) out.trem = true;
    if (e.gate !== undefined) out.gate = e.gate;
    if (e.vr !== undefined) out.vr = e.vr;
    if (e.pan) out.pan = e.pan;
    c.events.push(out);
  };

  if (o.section) {
    if (!song.sections[o.section]) throw new Error(`unknown section "${o.section}" (sections: ${Object.keys(song.sections).join(', ')})`);
    for (const e of evsOf(o.section)) push(e, 0, o.section, song.form.indexOf(o.section), true);
  } else if (o.perSection) {
    let p = 0;
    const seen = new Set();
    song.form.forEach((name, fi) => {
      if (seen.has(name) || !song.sections[name]) return;
      seen.add(name);
      for (const e of evsOf(name)) push(e, p, name, fi, false);
      p += song.sections[name].bars * bs;
    });
  } else {
    for (const f of form) for (const e of evsOf(f.name)) push(e, f.startStep, f.name, f.index, false);
  }
  // make sure every section is generated once so its warnings are reported
  for (const name of Object.keys(song.sections)) evsOf(name);
  // per onset: graces first (in playing order), then chord tones high → low
  const ord = (e) => (e.grace ? -1 + (e.offSec ?? 0) : 0);
  for (const c of Object.values(channels)) c.events.sort((a, b) => a.startStep - b.startStep || ord(a) - ord(b) || b.midi - a.midi);

  const loop =
    song.loopFrom === null
      ? { loopFrom: null, oneShot: true, endSec: r6(stepToSec(endStep)), tail: song.tail ?? 2.5 }
      : {
          loopFrom: song.loopFrom,
          loopFromSection: song.form[song.loopFrom],
          oneShot: false,
          loopStartSec: r6(stepToSec(loopStartStep ?? 0)),
          loopEndSec: r6(stepToSec(endStep)),
          loopStartBar: (loopStartStep ?? 0) / bs + 1,
          loopEndBar: endStep / bs + 1,
          loopStartBeat: r6((loopStartStep ?? 0) / spb),
          loopEndBeat: r6(endStep / spb),
        };
  return {
    song: song.id,
    bpm: song.bpm,
    meter: {
      barSteps: bs,
      stepsPerBeat: spb,
      beatsPerBar: r6(bs / spb),
      secPerBeat: r6(60 / song.bpm),
      secPerBar: r6((60 / song.bpm) * (bs / spb)),
      swing: song.swing ?? 0,
    },
    scale: song.scale,
    totalBars: endStep / bs,
    totalSec: r6(stepToSec(endStep)),
    sections,
    form,
    loop,
    warnings: [...new Set(warnings)],
    channels,
  };
}

/** Highest note per onset; graces dropped; overlapping notes are cut at the next onset. */
export function monoLine(events) {
  const evs = events.filter((e) => !e.grace).sort((a, b) => a.startStep - b.startStep || b.midi - a.midi);
  const out = [];
  for (const e of evs) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.startStep - e.startStep) < 1e-6) continue; // lower note of a chord
    out.push({ ...e });
  }
  for (let i = 0; i + 1 < out.length; i++) {
    const room = out[i + 1].startStep - out[i].startStep;
    const e = out[i];
    if (e.durSteps > room + 1e-9) {
      const k = e.durSteps > 0 ? room / e.durSteps : 0;
      e.durBeats = r6(e.durBeats * k);
      e.durSec = r6(e.durSec * k);
      e.durSteps = r6(room);
    }
  }
  return out;
}

const fmtDur = (d) => {
  const r = Math.round(d * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : String(r);
};

/** Bar-by-bar DSL-like listing of a set of events (absolute steps). */
function textListing(data, events, title) {
  const bs = data.meter.barSteps;
  const lines = [`# ${title}`];
  // group chord tones: same start & dur → A4+C5
  const groups = [];
  for (const e of events) {
    const g = groups[groups.length - 1];
    if (g && !e.grace && !g.grace && Math.abs(g.startStep - e.startStep) < 1e-6 && Math.abs(g.durSteps - e.durSteps) < 1e-6) g.notes.push(e.note);
    else groups.push({ startStep: e.startStep, durSteps: e.durSteps, notes: [e.note], grace: !!e.grace, section: e.section, bar: e.bar, trem: e.trem });
  }
  let cur = null;
  let t = null;
  let buf = [];
  const flush = () => {
    if (cur !== null) lines.push(`bar ${String(cur.bar).padStart(3)} [${cur.section}]`.padEnd(26) + '| ' + buf.join(' '));
    buf = [];
  };
  for (const g of groups) {
    if (!cur || g.bar !== cur.bar) {
      if (cur && t !== null && t < cur.barEnd - 1e-6 && !g.grace) buf.push(`r:${fmtDur(cur.barEnd - t)}`);
      flush();
      const barStart = Math.floor(g.startStep / bs + 1e-9) * bs;
      cur = { bar: g.bar, section: g.section, barEnd: barStart + bs };
      t = barStart;
    }
    if (g.grace) {
      buf.push(`{${g.notes.join(',')}}`);
      continue;
    }
    if (g.startStep > t + 1e-6) buf.push(`r:${fmtDur(g.startStep - t)}`);
    buf.push(`${g.notes.join('+')}${g.trem ? '~' : ''}:${fmtDur(g.durSteps)}`);
    t = Math.max(t, g.startStep + g.durSteps);
  }
  flush();
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------
// ABC writer (monophonic line)
// ---------------------------------------------------------------------------------------------

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
/** step duration → ABC length multiplier relative to L (= 1 step). */
function abcLen(d) {
  for (const den of [1, 2, 3, 4, 6, 8, 12, 16, 24, 32]) {
    const num = Math.round(d * den);
    if (Math.abs(num / den - d) < 1e-6) {
      const g = gcd(num, den);
      const n = num / g;
      const dd = den / g;
      if (dd === 1) return n === 1 ? '' : String(n);
      return (n === 1 ? '' : String(n)) + '/' + dd;
    }
  }
  return String(Math.round(d * 1000) / 1000);
}
const ABC_SHARP = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
function abcPitch(m) {
  const pc = ((m % 12) + 12) % 12;
  const oct = Math.floor(m / 12) - 1; // C4 = middle C = "C"
  let s = ABC_SHARP[pc];
  const acc = s.startsWith('^') ? '^' : '';
  let letter = s.replace('^', '');
  if (oct >= 5) {
    letter = letter.toLowerCase() + "'".repeat(oct - 5);
  } else {
    letter = letter + ','.repeat(4 - oct);
  }
  return acc + letter;
}
const SCALE_KEY = (scale) => {
  const [tonic, ...rest] = String(scale || 'C major').split(' ');
  const kind = rest.join(' ');
  if (/minor/.test(kind)) return tonic + 'm';
  if (/dorian/.test(kind)) return tonic + 'dor';
  if (/mixolydian/.test(kind)) return tonic + 'mix';
  if (/phrygian/.test(kind)) return tonic + 'phr';
  return tonic;
};

/**
 * ABC for a monophonic line. Every note carries an explicit accidental (^ or =) so the key
 * signature (K: from the song's scale, informational only) never changes pitches.
 */
export function toAbc(data, line, title) {
  const spb = data.meter.stepsPerBeat;
  const bs = data.meter.barSteps;
  const compound = spb % 3 === 0;
  // step note value (fraction of a whole note) and meter
  const stepWhole = compound ? 3 / 8 / spb : 1 / (4 * spb);
  const unitDen = Math.round(1 / stepWhole);
  const meter = compound ? `${Math.round(bs * stepWhole * 8)}/8` : `${Math.round(bs / spb)}/4`;
  const out = [`X:1`, `T:${title}`, `M:${meter}`, `L:1/${unitDen}`, `Q:1/4=${Math.round(data.bpm * (compound ? 1.5 : 1))}`, `K:${SCALE_KEY(data.scale)}`];
  // ABC can only express power-of-two units cleanly; non-integer units fall back to L:1/<x>
  const toks = [];
  let t = line.length ? Math.floor(line[0].startStep / bs) * bs : 0;
  const startBar = t;
  const pushNote = (sym, d, tieNext) => {
    // split at bar lines
    let rem = d;
    let first = true;
    while (rem > 1e-9) {
      const barEnd = (Math.floor(t / bs + 1e-9) + 1) * bs;
      const seg = Math.min(rem, barEnd - t);
      const isLast = rem - seg <= 1e-9;
      toks.push(`${sym}${abcLen(seg)}${sym !== 'z' && (!isLast || tieNext) ? '-' : ''}`);
      t += seg;
      rem -= seg;
      if (Math.abs(t - barEnd) < 1e-9) toks.push('|');
      first = false;
    }
    return first;
  };
  for (const e of line) {
    if (e.startStep > t + 1e-9) pushNote('z', e.startStep - t, false);
    const sym = abcPitch(e.midi).replace(/^([A-Ga-g])/, '=$1');
    pushNote(sym, e.durSteps, false);
  }
  // pad the last bar
  const barEnd = (Math.ceil(t / bs - 1e-9)) * bs;
  if (barEnd > t + 1e-9) pushNote('z', barEnd - t, false);
  if (toks[toks.length - 1] === '|') toks[toks.length - 1] = '|]';
  // wrap 4 bars per line
  const lines = [];
  let cur = [];
  let bars = 0;
  for (const tk of toks) {
    cur.push(tk);
    if (tk === '|' || tk === '|]') {
      bars++;
      if (bars % 4 === 0) {
        lines.push(cur.join(' '));
        cur = [];
      }
    }
  }
  if (cur.length) lines.push(cur.join(' '));
  out.push(`% generated by scripts/music/export-song.mjs (first bar = song bar ${startBar / bs + 1})`);
  return out.concat(lines).join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------

async function main() {
  process.stdout.on('error', (e) => {
    if (e.code === 'EPIPE') process.exit(0);
    throw e;
  });
  const { pos, opt } = parseArgs(process.argv.slice(2), ['form', 'per-section', 'text', 'abc', 'mono', 'no-graces', 'help']);
  if (opt.help || (!pos[0] && !opt.file)) {
    const src = fs.readFileSync(new URL(import.meta.url), 'utf8');
    process.stdout.write(src.slice(src.indexOf('/**') + 3, src.indexOf('*/')).replace(/^ \* ?/gm, '') + '\n');
    process.exit(opt.help ? 0 : 2);
  }
  const mods = await loadAudio({ songFile: opt.file });
  const song = resolveSong(mods, pos[0], opt.export);
  const channels = typeof opt.channel === 'string' ? opt.channel.split(',').map((s) => s.trim()).filter(Boolean) : null;
  const data = extractSong(mods.seq, song, {
    channels,
    section: typeof opt.section === 'string' ? opt.section : undefined,
    perSection: !!opt['per-section'],
    noGraces: !!opt['no-graces'],
  });
  let text;
  if (opt.form) {
    const { channels: chs, ...rest } = data;
    rest.channels = Object.fromEntries(Object.entries(chs).map(([k, v]) => [k, { inst: v.inst, gain: v.gain, pan: v.pan, send: v.send, events: v.events.length }]));
    text = JSON.stringify(rest, null, 1);
  } else if (opt.abc || opt.text || opt.mono) {
    const parts = [];
    const sel = Object.entries(data.channels);
    if (opt.abc) {
      const all = sel.flatMap(([, c]) => c.events);
      const line = monoLine(all);
      const what = `${song.id} ${sel.map(([k]) => k).join('+')}${opt.section ? ' section ' + opt.section : ''}`;
      text = toAbc(data, line, what);
    } else {
      for (const [ch, c] of sel) {
        const evs = opt.mono ? monoLine(c.events) : c.events;
        if (opt.text) parts.push(textListing(data, evs, `${song.id} / ${ch} (${c.inst})${opt.section ? ' / section ' + opt.section : ''}`) + (evs.length ? '' : '\n(no events)'));
        else parts.push(JSON.stringify({ channel: ch, inst: c.inst, events: evs }));
      }
      text = parts.join('\n\n');
      if (opt.text && data.warnings.length) text += '\n\n# sequencer warnings\n' + data.warnings.join('\n');
    }
  } else {
    text = JSON.stringify(data, null, 0);
  }
  if (typeof opt.out === 'string') fs.writeFileSync(opt.out, text.endsWith('\n') ? text : text + '\n');
  else process.stdout.write(text.endsWith('\n') ? text : text + '\n');
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href || process.argv[1]?.endsWith('export-song.mjs')) {
  main().catch((e) => {
    process.stderr.write(`export-song: ${e.message}\n`);
    process.exit(2);
  });
}
