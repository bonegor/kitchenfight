#!/usr/bin/env python3
"""
abc2notes.py - ABC reference transcription -> JSON notes (parsed with music21).

Usage (Python with music21: /home/user/.venv-audio/bin/python, called $PY below):
  $PY scripts/music/abc2notes.py FILE.abc --list [--title SUBSTR] [--no-parse] [--json]
        inventory: every tune in the file (X:, titles, composer, key, meter, voices, bars, notes,
        range, bar-length problems, body section labels)
  $PY scripts/music/abc2notes.py FILE.abc [--tune X | --title SUBSTR] [--voice N|ID]
        [--expand-repeats] [--bars 1-8,17-24] [--text | --dsl STEPQ] [--accidentals pitch|octave|not]
        [--out FILE]

  --tune X          tune by its X: number; "#3" = 3rd tune in the file (X: numbers repeat in some files)
  --title SUBSTR    first tune whose T: (any title line) contains SUBSTR (case-insensitive)
  --voice V         voice id as written after V: (e.g. 1, S, T1) or 1-based index among the voices
                    that contain notes (default: the first voice with notes)
  --expand-repeats  play |: :| repeats and 1st/2nd endings ([1 [2 |1 :|2) in order
  --bars LIST       bar numbers as in the file (pickup = 0, then one per bar line; see --text),
                    comma-separated ranges concatenated in the given order ("1-8,1-7,9" spells out
                    a repeat by hand); with --expand-repeats it filters the expanded sequence
  --text            bar-by-bar listing (durations in quarter notes) - use it to find bar numbers
  --dsl STEPQ       the selected bars as a melody string for src/audio/sequencer.ts, one step =
                    STEPQ quarter notes (0.5 = eighth-note steps, 1/3 = triplet eighths)

Parsing rules (the file is pre-processed, then each voice is parsed by music21 on its own):
  * accidentals carry through the bar (ABC 2.1, double sharps/flats included; --accidentals or
    the file's %%propagate-accidentals override);
  * chords -> highest note; tied notes merged (also ties written inside chords, [d3-B3-]);
    grace notes ignored; text annotations, decorations, lyrics, slurs dropped; chord symbols
    ("Am7") kept when music21 can read them;
  * voices split by V: / [V:]; clef "-8" voices sound an octave lower and V:...transpose=N is
    applied (concert pitch);
  * inline [K:] [M:] [L:] become field lines (music21 ignores the inline forms); labelled
    variant endings ["Coda" are reduced to a bar line; Z multi-bar rests are expanded;
  * a tune without L: whose bars only fit the meter with L:1/8 (LOTRO/Maestro exports) is read
    with L:1/8; voices without bar lines (MIDI dumps) are cut into pseudo-bars of one meter (4/4);
  * --expand-repeats treats a ":|" right after the last ending as a closing bar line (music21 gives
    ABC 2nd endings a single bar) and refuses repeat structures that do not terminate.

JSON output: {file, tune: {index, X, titles, composers, origin, source}, voice: {id, name, clef,
  octaveShift, transpose}, voices: [...], key, keyField, keySignatureSharps, analysedKey, meter,
  meters, unitNote, bars: [{n, seq, startQ, lenQ, nominalQ, meter}], notes: [{midi, name, onsetQ,
  durQ, bar, seq, beatQ, tied}], chordSymbols: [{onsetQ, bar, symbol}], sections: [{line, field,
  label}], barProblems, warnings}
onsetQ/durQ are quarter notes from the start of the selection; beatQ = offset inside the bar.
"""
from __future__ import annotations

import argparse
import contextlib
import io
import json
import math
import os
import re
import sys
import warnings
from dataclasses import dataclass, field
from fractions import Fraction

warnings.filterwarnings('ignore')

_m21 = None


def m21():
    """Lazy music21 import (it is slow to import)."""
    global _m21
    if _m21 is None:
        import music21  # noqa: F401
        from music21 import bar, converter, harmony, key, meter, spanner, stream

        class NS:
            pass

        ns = NS()
        ns.bar, ns.converter, ns.harmony, ns.key, ns.meter, ns.spanner, ns.stream = bar, converter, harmony, key, meter, spanner, stream
        ns.music21 = music21
        _m21 = ns
    return _m21


SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
COMMON_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']


def midi_name(m: int, sharps: int | None = None) -> str:
    names = COMMON_NAMES if sharps is None or sharps == 0 else (SHARP_NAMES if sharps > 0 else FLAT_NAMES)
    return f'{names[m % 12]}{m // 12 - 1}'


# ---------------------------------------------------------------------------------------------
# Splitting files into tunes and voices
# ---------------------------------------------------------------------------------------------


@dataclass
class VoiceDef:
    id: str
    name: str = ''
    clef: str = ''
    octave_shift: int = 0  # semitones (clef -8/+8, octave=)
    transpose: int = 0  # semitones (transpose=)
    lines: list = field(default_factory=list)  # (lineno, text) body lines


@dataclass
class Tune:
    index: int
    x: str
    start_line: int
    header: list = field(default_factory=list)  # (lineno, text) up to and including K:
    body: list = field(default_factory=list)  # (lineno, text)
    titles: list = field(default_factory=list)
    composers: list = field(default_factory=list)
    origin: list = field(default_factory=list)
    source: list = field(default_factory=list)
    file_header: list = field(default_factory=list)

    def field_values(self, f: str) -> list:
        out = []
        for _, t in self.header:
            m = re.match(r'^([A-Za-z]):\s*(.*)$', t)
            if m and m.group(1) == f:
                out.append(m.group(2).strip())
        return out


FIELD_RE = re.compile(r'^([A-Za-z+]):(.*)$')


def split_tunes(text: str) -> list[Tune]:
    lines = text.splitlines()
    tunes: list[Tune] = []
    cur: Tune | None = None
    in_header = False
    file_header: list = []
    in_textblock = False
    for i, raw in enumerate(lines, 1):
        t = raw.rstrip('\r\n')
        if t.strip().startswith('%%begintext'):
            in_textblock = True
            continue
        if t.strip().startswith('%%endtext'):
            in_textblock = False
            continue
        if in_textblock:
            continue
        m = re.match(r'^X:\s*(.*)$', t)
        if m:
            cur = Tune(index=len(tunes) + 1, x=m.group(1).strip(), start_line=i, file_header=file_header)
            tunes.append(cur)
            in_header = True
            continue
        if cur is None:
            file_header.append((i, t))
            continue
        if in_header:
            fm = FIELD_RE.match(t)
            if fm:
                f, v = fm.group(1), fm.group(2).strip()
                cur.header.append((i, t))
                if f == 'T':
                    cur.titles.append(v)
                elif f == 'C':
                    cur.composers.append(v)
                elif f == 'O':
                    cur.origin.append(v)
                elif f in ('B', 'S', 'F'):
                    cur.source.append(v)
                if f == 'K':
                    in_header = False
                continue
            if not t.strip() or t.lstrip().startswith('%'):
                cur.header.append((i, t))
                continue
            # music before K: (malformed) - treat as body
            in_header = False
        cur.body.append((i, t))
    return tunes


def parse_voice_props(s: str) -> dict:
    """'1 treble-8 nm="Tenor" transpose=-2' -> props."""
    props = {}
    toks = re.findall(r'(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*(\S+)|(\S+)', s)
    first = True
    for a, b, c, d, e in toks:
        if a:
            props[a.lower()] = b
        elif c:
            props[c.lower()] = d
        elif e:
            if first:
                props['id'] = e
            else:
                props.setdefault('_bare', []).append(e)
        first = False
    return props


CLEF_RE = re.compile(r'^(treble|bass|alto|tenor|baritone|perc|none|C|F|G)(\d)?([+-]8)?$', re.I)


def voice_from_props(props: dict, vid: str) -> VoiceDef:
    v = VoiceDef(id=vid)
    v.name = props.get('nm') or props.get('name') or ''
    clef = props.get('clef') or ''
    for b in props.get('_bare', []):
        if CLEF_RE.match(b):
            clef = b
    v.clef = clef
    cm = CLEF_RE.match(clef) if clef else None
    if cm and cm.group(3):
        v.octave_shift += 12 if cm.group(3) == '+8' else -12
    for k in ('transpose', 't'):
        if k in props:
            try:
                v.transpose = int(props[k])
            except ValueError:
                pass
    if 'octave' in props:
        try:
            v.octave_shift += 12 * int(props['octave'])
        except ValueError:
            pass
    return v


def split_voices(tune: Tune) -> list[VoiceDef]:
    """Distribute body lines over voices (V: lines and [V:x] inline switches)."""
    voices: dict[str, VoiceDef] = {}
    order: list[str] = []

    def get(vid: str, props: dict | None = None) -> VoiceDef:
        if vid not in voices:
            voices[vid] = voice_from_props(props or {}, vid)
            order.append(vid)
        elif props:
            nv = voice_from_props(props, vid)
            ov = voices[vid]
            ov.name = ov.name or nv.name
            if nv.clef:
                ov.clef, ov.octave_shift = nv.clef, nv.octave_shift
            if nv.transpose:
                ov.transpose = nv.transpose
        return voices[vid]

    for _, t in tune.header:
        m = re.match(r'^V:\s*(.*)$', t)
        if m:
            props = parse_voice_props(m.group(1))
            if 'id' in props:
                get(props['id'], props)
    current = order[0] if order else None
    for ln, t in tune.body:
        m = re.match(r'^V:\s*(.*)$', t)
        if m:
            props = parse_voice_props(m.group(1))
            if 'id' in props:
                get(props['id'], props)
                current = props['id']
            continue
        # inline voice switches: split the line
        parts = re.split(r'\[V:\s*([^\]\s]+)[^\]]*\]', t)
        if len(parts) > 1:
            if parts[0].strip():
                vid = current or '1'
                get(vid).lines.append((ln, parts[0]))
            for k in range(1, len(parts), 2):
                current = parts[k]
                get(current)
                if parts[k + 1].strip():
                    get(current).lines.append((ln, parts[k + 1]))
            continue
        vid = current or '1'
        if current is None:
            current = vid
        get(vid).lines.append((ln, t))
    return [voices[k] for k in order]


# ---------------------------------------------------------------------------------------------
# Cleaning ABC for music21
# ---------------------------------------------------------------------------------------------

KEY_MODES = {
    '': '', 'maj': '', 'major': '', 'ion': '', 'ionian': '', 'm': 'm', 'min': 'm', 'minor': 'm', 'aeo': 'm', 'aeolian': 'm',
    'dor': 'dor', 'dorian': 'dor', 'phr': 'phr', 'phrygian': 'phr', 'lyd': 'lyd', 'lydian': 'lyd',
    'mix': 'mix', 'mixolydian': 'mix', 'loc': 'loc', 'locrian': 'loc',
}


def clean_key(val: str) -> tuple[str, dict]:
    """'C maj clef=treble' -> ('C', {clef: treble}); 'none'/'' -> 'C'."""
    props = {}
    for k, v in re.findall(r'(\w+)\s*=\s*("[^"]*"|\S+)', val):
        props[k.lower()] = v.strip('"')
    rest = re.sub(r'\w+\s*=\s*("[^"]*"|\S+)', ' ', val).strip()
    m = re.match(r'^([A-Ga-g])([#b]?)\s*([A-Za-z]*)', rest)
    if not m:
        bare = rest.split()
        for b in bare:
            if CLEF_RE.match(b):
                props['clef'] = b
        return 'C', props
    tonic = m.group(1).upper() + m.group(2)
    mode = KEY_MODES.get(m.group(3).lower()[:3] if m.group(3).lower()[:3] in KEY_MODES else m.group(3).lower(), None)
    if mode is None:
        mode = KEY_MODES.get(m.group(3).lower(), '')
        if mode is None:
            mode = ''
    for b in rest[m.end():].split():
        if CLEF_RE.match(b):
            props['clef'] = b
    return tonic + mode, props


VALID_MUSIC_LETTERS = set('ABCDEFGabcdefgzxZX')
ACCIDENTALS: str | None = None  # None = ABC 2.1 default ('pitch'), or 'octave' / 'not'
DECORATION_LETTERS = set('HLMOPSTuvRJ~')

_cs_ok_cache: dict = {}


def chord_symbol_ok(fig: str) -> bool:
    if fig in _cs_ok_cache:
        return _cs_ok_cache[fig]
    ok = False
    if re.match(r'^[A-G][#b]?[^\s"]{0,14}$', fig):
        try:
            with contextlib.redirect_stderr(io.StringIO()):
                cs = m21().harmony.ChordSymbol(fig.replace('b', '-', 1) if re.match(r'^[A-G]b', fig) else fig)
            ok = len(cs.pitches) > 0
        except Exception:
            ok = False
    _cs_ok_cache[fig] = ok
    return ok


@dataclass
class CleanState:
    meter: Fraction | None = None  # bar length in whole notes
    unit: Fraction = Fraction(1, 8)
    dropped_cs: int = 0
    warnings: list = field(default_factory=list)
    carry: dict = field(default_factory=dict)  # double accidentals active in the current bar


NOTE_TOKEN = re.compile(r"(\^\^|__|\^|_|=)?([A-Ga-g])([,']*)")
# variant ending numbers after a bar line or [ (|1 :|2 [1,3 |2-4)
ENDING_RE = re.compile(r'(?:\||\[)\s*([1-9](?:\s*[,-]\s*[1-9])*)(?![\d/])')


def carry_double_accidentals(line: str, st: CleanState, mode: str) -> str:
    """music21 carries ^ _ = through a bar but not ^^ / __: write those out on every note."""
    if mode == 'not':
        return line
    out = []
    i = 0
    n = len(line)
    while i < n:
        c = line[i]
        if c == '"':
            j = line.find('"', i + 1)
            j = n - 1 if j < 0 else j
            out.append(line[i:j + 1])
            i = j + 1
            continue
        if c == '|':
            st.carry.clear()
            out.append(c)
            i += 1
            continue
        m = NOTE_TOKEN.match(line, i)
        if m:
            acc, letter, octs = m.group(1) or '', m.group(2), m.group(3)
            k = letter.upper() if mode == 'pitch' else letter + octs
            if acc:
                if acc in ('^^', '__'):
                    st.carry[k] = acc
                else:
                    st.carry.pop(k, None)
                out.append(m.group(0))
            elif k in st.carry:
                out.append(st.carry[k] + letter + octs)
            else:
                out.append(m.group(0))
            i = m.end()
            continue
        out.append(c)
        i += 1
    return ''.join(out)


def parse_meter(v: str) -> Fraction | None:
    v = v.strip()
    if v in ('C',):
        return Fraction(1)
    if v in ('C|',):
        return Fraction(1)
    m = re.match(r'^\(?([\d+]+)\)?\s*/\s*(\d+)', v)
    if m:
        num = sum(int(x) for x in m.group(1).split('+'))
        return Fraction(num, int(m.group(2)))
    return None


def clean_music_line(line: str, st: CleanState, keep_cs: bool) -> tuple[list[str], int]:
    """Return (output lines, number of invalid letters). Inline K:/M:/L: become field lines."""
    out_lines: list[str] = []
    out: list[str] = []
    i = 0
    n = len(line)
    bad = 0

    def flush():
        s = ''.join(out).strip()
        if s:
            out_lines.append(s)
        out.clear()

    while i < n:
        c = line[i]
        if c == '\\' and i + 1 < n and line[i + 1] == '%':
            i += 2
            continue
        if c == '%':
            break
        if c == '"':
            j = i + 1
            buf = []
            while j < n and line[j] != '"':
                if line[j] == '\\' and j + 1 < n:
                    buf.append(line[j + 1])
                    j += 2
                    continue
                buf.append(line[j])
                j += 1
            txt = ''.join(buf).strip()
            i = j + 1
            if keep_cs and txt and txt[0] not in '^_<>@' and chord_symbol_ok(txt):
                out.append('"' + txt + '"')
            elif txt and txt[0] not in '^_<>@':
                st.dropped_cs += 1
            continue
        if c == '!':
            j = line.find('!', i + 1)
            if j != -1 and j - i <= 30 and ' ' not in line[i + 1:j]:
                i = j + 1
                continue
            i += 1
            continue
        if c == '+':
            m = re.match(r'\+[a-z][^+\s]{0,24}\+', line[i:])
            if m:
                i += m.end()
                continue
            i += 1
            continue
        if c == '{':
            j = line.find('}', i + 1)
            i = (j + 1) if j != -1 else n
            continue
        if c == '[':
            m = re.match(r'\[([A-Za-z]):([^\]]*)\]', line[i:])
            if m:
                f, v = m.group(1), m.group(2).strip()
                i += m.end()
                if f in 'KML':
                    flush()
                    if f == 'K':
                        k, _ = clean_key(v)
                        out_lines.append(f'K:{k}')
                    else:
                        out_lines.append(f'{f}:{v}')
                        if f == 'M':
                            st.meter = parse_meter(v) or st.meter
                        if f == 'L':
                            try:
                                st.unit = Fraction(v)
                            except (ValueError, ZeroDivisionError):
                                pass
                continue
            if line.startswith('[|]', i):  # invisible bar line
                out.append('|')
                i += 3
                continue
            if i + 1 < n and line[i + 1] == '"':  # labelled variant ending ["Coda": keep the bar only
                i += 1
                continue
            # chord: move ties of chord notes after the bracket ([d3-B3-] -> [d3B3]-)
            m = re.match(r'\[([^\]|:]*)\]([0-9/]*)(-?)', line[i:])
            if m and re.search(r'[A-Ga-g]', m.group(1)):
                inner = m.group(1)
                tie = '-' in inner or m.group(3) == '-'
                inner = re.sub(r'[!"].*?[!"]', '', inner)
                inner = re.sub(r'[^A-Ga-g,\'^_=0-9/]', '', inner)
                out.append('[' + inner + ']' + m.group(2) + ('-' if tie else ''))
                i += m.end()
                continue
            out.append(c)
            i += 1
            continue
        if c == '&':
            # voice overlay: keep the first voice only (drop until the next bar line)
            j = i + 1
            while j < n and line[j] != '|':
                j += 1
            i = j
            continue
        if c in '$`' or c == 'y':
            i += 1
            continue
        if c == 'Z':
            m = re.match(r'Z(\d*)', line[i:])
            cnt = int(m.group(1)) if m.group(1) else 1
            i += m.end()
            if st.meter:
                ln = st.meter / st.unit
                tok = f'z{ln.numerator}' + (f'/{ln.denominator}' if ln.denominator != 1 else '')
                out.append(' | '.join([tok] * cnt))
            continue
        if c == 'x':
            out.append('z')
            i += 1
            continue
        if c.isalpha():
            if c in VALID_MUSIC_LETTERS:
                out.append(c)
            elif c in DECORATION_LETTERS:
                pass
            else:
                bad += 1
            i += 1
            continue
        if c == '(':
            if i + 1 < n and line[i + 1].isdigit():
                m = re.match(r'\((\d)(:\d?)?(:\d?)?', line[i:])
                out.append(m.group(0))
                i += m.end()
                continue
            i += 1
            continue
        if c in ').~':
            i += 1
            continue
        out.append(c)
        i += 1
    flush()
    return out_lines, bad


def voice_abc(tune: Tune, voice: VoiceDef, unit_override: str | None, keep_cs: bool) -> tuple[str, CleanState, list]:
    """Build a single-voice ABC tune for music21."""
    st = CleanState()
    hdr = {'M': None, 'L': None, 'K': None}
    for _, t in tune.header:
        m = FIELD_RE.match(t)
        if m and m.group(1) in hdr:
            hdr[m.group(1)] = m.group(2).strip()
    for _, t in tune.file_header:
        m = FIELD_RE.match(t)
        if m and m.group(1) in ('M', 'L') and hdr[m.group(1)] is None:
            hdr[m.group(1)] = m.group(2).strip()
    meter = hdr['M']
    st.meter = parse_meter(meter) if meter else None
    unit = unit_override or hdr['L']
    if not unit:
        unit = '1/16' if (st.meter is not None and st.meter < Fraction(3, 4)) else '1/8'
    try:
        st.unit = Fraction(unit)
    except (ValueError, ZeroDivisionError):
        st.unit = Fraction(1, 8)
    k, kprops = clean_key(hdr['K'] or 'C')
    # ABC >= 2.0 makes music21 carry accidentals through the bar (the 2.1 default, "pitch");
    # a file's own %%propagate-accidentals directive, or ACCIDENTALS (CLI --accidentals), wins
    prop = ACCIDENTALS
    if prop is None:
        for _, t in list(tune.file_header) + list(tune.header) + list(tune.body):
            mm = re.match(r'^%%propagate-accidentals\s+(\w+)', t.strip())
            if mm:
                prop = mm.group(1)
    lines = ['%abc-2.1', 'X:1', 'T:voice']
    if prop:
        lines.insert(1, f'%%propagate-accidentals {prop}')
    if meter and meter.lower() != 'none':
        lines.append(f'M:{meter}')
    lines.append(f'L:{unit}')
    lines.append(f'K:{k}')
    skipped = []
    for ln, t in voice.lines:
        s = t.strip()
        if not s or s.startswith('%'):
            continue
        fm = FIELD_RE.match(s)
        if fm and not s.startswith('|'):
            f, v = fm.group(1), fm.group(2).strip()
            if f == 'K':
                kk, _ = clean_key(v)
                lines.append(f'K:{kk}')
            elif f == 'M':
                lines.append(f'M:{v}')
                st.meter = parse_meter(v) or st.meter
            elif f == 'L':
                lines.append(f'L:{v}')
                try:
                    st.unit = Fraction(v)
                except (ValueError, ZeroDivisionError):
                    pass
            continue
        outs, bad = clean_music_line(s, st, keep_cs)
        if bad >= 2:
            skipped.append((ln, s[:60]))
            continue
        lines.extend(carry_double_accidentals(o, st, prop or 'pitch') if not FIELD_RE.match(o) else o for o in outs)
    body = '\n'.join(lines) + '\n'
    # music21 only builds measures when it sees >= 2 plain bar lines: normalise || |] [| otherwise
    plain = len(re.findall(r'(?<![|:\[])\|(?![|:\]\[0-9])', body))
    if plain < 2:
        body = re.sub(r'\|\]|\|\||\[\|', '|', body)
    return body, st, skipped


# ---------------------------------------------------------------------------------------------
# music21 -> notes
# ---------------------------------------------------------------------------------------------


@dataclass
class Bar:
    idx: int
    number: int
    len_q: float
    nominal_q: float | None
    start_rep: bool = False
    end_rep: int = 0
    endings: frozenset | None = None
    events: list = field(default_factory=list)  # (offset_q, dur_q, midi|None, tie_type, is_rest)
    chord_symbols: list = field(default_factory=list)  # (offset_q, figure)
    key_sharps: int | None = None
    meter: str | None = None


def _spell(p) -> str:
    return p.nameWithOctave.replace('-', 'b')


def _top_and_tie(el):
    """(midi, tie type, spelled name) of a note or of the highest note of a chord"""
    if el.isChord:
        ps = sorted(el.notes, key=lambda n: n.pitch.midi)
        top = ps[-1]
        tie = (top.tie.type if top.tie else None) or (el.tie.type if el.tie else None)
        return top.pitch.midi, tie, _spell(top.pitch)
    return el.pitch.midi, (el.tie.type if el.tie else None), _spell(el.pitch)


def music21_bars(abc_text: str) -> tuple[list[Bar], list[str]]:
    M = m21()
    msgs = []
    err = io.StringIO()
    with contextlib.redirect_stderr(err), contextlib.redirect_stdout(io.StringIO()):
        score = M.converter.parseData(abc_text, format='abc')
    if err.getvalue().strip():
        msgs.extend(sorted(set(x.strip() for x in err.getvalue().splitlines() if x.strip()))[:5])
    parts = list(score.parts) if hasattr(score, 'parts') and len(score.parts) else [score]
    part = max(parts, key=lambda p: len(p.recurse().notes))
    measures = list(part.getElementsByClass(M.stream.Measure))
    if not measures:
        return pseudo_bars(part, M), msgs + ['no bar lines: cut into pseudo-bars of one meter length (4/4 if M: is missing)']
    brackets = {}
    for sp in part.spannerBundle.getByClass(M.spanner.RepeatBracket):
        nums = set()
        for tok in re.split(r'[,\s]+', str(sp.number or '')):
            if '-' in tok:
                a, b = tok.split('-', 1)
                if a.isdigit() and b.isdigit():
                    nums.update(range(int(a), int(b) + 1))
            elif tok.isdigit():
                nums.add(int(tok))
        for m in sp.getSpannedElements():
            brackets[id(m)] = frozenset(nums or {1})
    bars = []
    cur_ts = None
    cur_sharps = None
    for k, m in enumerate(measures):
        ts = getattr(m, 'timeSignature', None)
        if ts is not None:
            cur_ts = ts
        else:
            tss = list(m.getElementsByClass(M.meter.TimeSignature)) if hasattr(m, 'getElementsByClass') else []
            if tss:
                cur_ts = tss[0]
        ks = getattr(m, 'keySignature', None)
        if ks is not None:
            cur_sharps = ks.sharps
        b = Bar(idx=k, number=k, len_q=float(m.duration.quarterLength),
                nominal_q=float(cur_ts.barDuration.quarterLength) if cur_ts is not None else None,
                key_sharps=cur_sharps, meter=cur_ts.ratioString if cur_ts is not None else None)
        lb, rb = getattr(m, 'leftBarline', None), getattr(m, 'rightBarline', None)
        if isinstance(lb, M.bar.Repeat) and lb.direction == 'start':
            b.start_rep = True
        if isinstance(rb, M.bar.Repeat) and rb.direction == 'end':
            b.end_rep = int(rb.times) if rb.times else 2
        if isinstance(lb, M.bar.Repeat) and lb.direction == 'end':
            # some writers put ":|" at the start of the next bar
            if bars:
                bars[-1].end_rep = bars[-1].end_rep or 2
        b.endings = brackets.get(id(m))
        flat = m.flatten() if m is not part else part.flatten()
        for el in flat.notesAndRests:
            off = float(el.offset)
            if isinstance(el, M.harmony.ChordSymbol):
                fig = el.figure.replace('-', 'b')
                b.chord_symbols.append((off, fig))
                continue
            if el.duration.isGrace:
                continue
            ql = float(el.quarterLength)
            if ql <= 0:
                continue
            if el.isRest:
                b.events.append((off, ql, None, None, True, None))
            else:
                midi, tie, name = _top_and_tie(el)
                b.events.append((off, ql, midi, tie, False, name))
        bars.append(b)
    # music21 leaves a complete first bar numbered 0: number bars ourselves (pickup = 0, else 1..)
    pickup = bool(bars) and bars[0].nominal_q is not None and bars[0].len_q < bars[0].nominal_q - 1e-6 and len(bars) > 1
    for k, b in enumerate(bars):
        b.number = k if pickup else k + 1
    return bars, msgs


def pseudo_bars(part, M) -> list[Bar]:
    """Bar-less voices (e.g. MIDI-to-ABC dumps): fixed-length bars by onset time."""
    tss = list(part.recurse().getElementsByClass(M.meter.TimeSignature))
    blen = float(tss[0].barDuration.quarterLength) if tss else 4.0
    flat = part.flatten()
    evs = []
    css = []
    for el in flat.notesAndRests:
        off = float(el.offset)
        if isinstance(el, M.harmony.ChordSymbol):
            css.append((off, el.figure.replace('-', 'b')))
            continue
        if el.duration.isGrace or float(el.quarterLength) <= 0:
            continue
        if el.isRest:
            evs.append((off, float(el.quarterLength), None, None, True, None))
        else:
            midi, tie, name = _top_and_tie(el)
            evs.append((off, float(el.quarterLength), midi, tie, False, name))
    end = max((o + d for o, d, *_ in evs), default=0.0)
    nbars = max(1, int(math.ceil(end / blen - 1e-9)))
    meter = tss[0].ratioString if tss else '4/4'
    bars = [Bar(idx=k, number=k + 1, len_q=blen, nominal_q=blen, meter=meter) for k in range(nbars)]
    bars[-1].len_q = max(1e-6, end - blen * (nbars - 1))
    for o, d, midi, tie, rest, name in evs:
        k = min(nbars - 1, int(o // blen + 1e-9))
        bars[k].events.append((o - k * blen, d, midi, tie, rest, name))
    for o, f in css:
        k = min(nbars - 1, int(o // blen + 1e-9))
        bars[k].chord_symbols.append((o - k * blen, f))
    return bars


def expand_order(bars: list[Bar]) -> list[int]:
    """Indices of bars in playing order (|: :| repeats with N times, numbered endings).

    A repeat sign in the bar right after the last ending is treated as a closing bar line
    (music21 only gives an ABC 2nd ending one bar, and many files end it with ":|").
    """
    order = []
    i, n = 0, len(bars)
    rep_start, pass_no = 0, 1
    jumped = False
    in_ending = False
    closed_at = -1  # index of the first bar after a completed final ending
    while i < n and len(order) <= 4 * n + 16:
        b = bars[i]
        if b.start_rep and not jumped:
            rep_start, pass_no = i, 1
        jumped = False
        if b.endings:
            if pass_no not in b.endings:
                i += 1
                continue
            in_ending = True
        elif in_ending:
            in_ending = False
            if pass_no > 1:  # the final ending is done: a new block starts here
                pass_no = 1
                rep_start = i
                closed_at = i
        order.append(i)
        if b.end_rep:
            if i == closed_at:
                rep_start = i + 1
            elif pass_no < b.end_rep:
                pass_no += 1
                i = rep_start
                jumped = True
                in_ending = False
                continue
            else:
                pass_no = 1
                rep_start = i + 1
        i += 1
    if len(order) > 4 * n + 16:
        raise ValueError('repeat structure does not terminate')
    return order


def parse_bar_list(spec: str) -> list[tuple[int, int]]:
    out = []
    for part in spec.split(','):
        part = part.strip()
        if not part:
            continue
        m = re.match(r'^(-?\d+)\s*(?:-|\.\.)\s*(-?\d+)$', part)
        if m:
            out.append((int(m.group(1)), int(m.group(2))))
        elif re.match(r'^-?\d+$', part):
            out.append((int(part), int(part)))
        else:
            raise ValueError(f'bad bar range "{part}"')
    return out


def select_order(bars: list[Bar], expand: bool, bar_spec: str | None) -> list[int]:
    if expand:
        try:
            order = expand_order(bars)
        except ValueError as e:
            print(f'abc2notes: warning: {e}; repeats NOT expanded', file=sys.stderr)
            order = list(range(len(bars)))
        if bar_spec:
            rng = parse_bar_list(bar_spec)
            order = [k for k in order if any(a <= bars[k].number <= b for a, b in rng)]
        return order
    if bar_spec:
        order = []
        for a, b in parse_bar_list(bar_spec):
            sel = [k for k, br in enumerate(bars) if a <= br.number <= b]
            order.extend(sel)
        return order
    return list(range(len(bars)))


def build_notes(bars: list[Bar], order: list[int], shift: int) -> tuple[list[dict], list[dict], list[dict], list[str]]:
    notes: list[dict] = []
    css: list[dict] = []
    bar_out: list[dict] = []
    warns: list[str] = []
    t = 0.0
    open_tie = None  # note dict waiting for its tie continuation
    for seq, k in enumerate(order, 1):
        b = bars[k]
        bar_out.append({'n': b.number, 'seq': seq, 'startQ': round(t, 6), 'lenQ': round(b.len_q, 6),
                        'nominalQ': b.nominal_q, 'meter': b.meter})
        for off, fig in b.chord_symbols:
            css.append({'onsetQ': round(t + off, 6), 'bar': b.number, 'symbol': fig})
        for off, ql, midi, tie, is_rest, spelled in b.events:
            on = t + off
            if is_rest:
                if open_tie is not None:
                    open_tie = None
                continue
            m = midi + shift
            if open_tie is not None and open_tie['midi'] == m and abs(open_tie['onsetQ'] + open_tie['durQ'] - on) < 1e-6:
                open_tie['durQ'] = round(open_tie['durQ'] + ql, 6)
                open_tie['tied'] = True
                if tie not in ('start', 'continue'):
                    open_tie = None
                continue
            if open_tie is not None:
                warns.append(f'bar {b.number}: tie from {midi_name(open_tie["midi"])} not continued by the same pitch')
                open_tie = None
            # transposed voices (clarinet in Bb, tenor -8) are spelled in the sounding key
            sharps = None if b.key_sharps is None else ((b.key_sharps + 7 * shift + 6) % 12) - 6
            name = spelled if shift == 0 and spelled else midi_name(m, sharps)
            nd = {'midi': m, 'name': name, 'onsetQ': round(on, 6), 'durQ': round(ql, 6),
                  'bar': b.number, 'seq': seq, 'beatQ': round(off, 6), 'tied': False}
            notes.append(nd)
            if tie in ('start', 'continue'):
                open_tie = nd
        t += b.len_q
    return notes, css, bar_out, warns


def bar_problems(bars: list[Bar]) -> list[str]:
    """Bars whose length differs from the meter (a pickup + closing bar pair is fine)."""
    out = []
    for k, b in enumerate(bars):
        if b.nominal_q is None or abs(b.len_q - b.nominal_q) < 1e-6:
            continue
        if b.len_q < b.nominal_q:
            if k == 0 or k == len(bars) - 1:
                continue
            # pairs split by a repeat sign / double bar: neighbours sum to a full bar
            prev = bars[k - 1] if k > 0 else None
            nxt = bars[k + 1] if k + 1 < len(bars) else None
            if nxt and abs(b.len_q + nxt.len_q - b.nominal_q) < 1e-6:
                continue
            if prev and abs(b.len_q + prev.len_q - b.nominal_q) < 1e-6:
                continue
            if abs(b.len_q + bars[0].len_q - b.nominal_q) < 1e-6 and (b.end_rep or (nxt and nxt.start_rep)):
                continue  # closes the pickup at a repeat
            out.append(f'bar {b.number}: {b.len_q:g}q, meter {b.nominal_q:g}q (incomplete)')
        else:
            out.append(f'bar {b.number}: {b.len_q:g}q, meter {b.nominal_q:g}q (overfull)')
    return out


# ---------------------------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------------------------


def find_tune(tunes: list[Tune], tune: str | None, title: str | None) -> Tune:
    if tune:
        if tune.startswith('#'):
            k = int(tune[1:])
            if not 1 <= k <= len(tunes):
                raise SystemExit(f'abc2notes: tune {tune} out of range (file has {len(tunes)} tunes)')
            return tunes[k - 1]
        hits = [t for t in tunes if t.x == tune]
        if not hits:
            raise SystemExit(f'abc2notes: no tune with X:{tune} (X values: {", ".join(t.x for t in tunes[:40])}...)')
        if len(hits) > 1:
            print(f'abc2notes: warning: {len(hits)} tunes have X:{tune}; using the first (#{hits[0].index}); use --tune "#N"', file=sys.stderr)
        return hits[0]
    if title:
        s = title.lower()
        hits = [t for t in tunes if any(s in x.lower() for x in t.titles)]
        if not hits:
            raise SystemExit(f'abc2notes: no tune title contains "{title}"')
        if len(hits) > 1:
            print(f'abc2notes: warning: {len(hits)} tunes match "{title}"; using #{hits[0].index} X:{hits[0].x} ({hits[0].titles[0] if hits[0].titles else ""})', file=sys.stderr)
        return hits[0]
    real = [t for t in tunes if t.body and any(l.strip() and not l.strip().startswith('%') for _, l in t.body)]
    if not real:
        raise SystemExit('abc2notes: no tune with music in the file')
    if len(real) > 1:
        print(f'abc2notes: warning: file has {len(real)} tunes; using the first (#{real[0].index} X:{real[0].x}); pick one with --tune/--title', file=sys.stderr)
    return real[0]


def parse_voice(tune: Tune, voice: VoiceDef, keep_cs: bool = True) -> dict:
    """Parse one voice -> {bars: [Bar], ...}; auto-fixes a missing L: (LOTRO exports)."""
    has_l = any(FIELD_RE.match(t) and FIELD_RE.match(t).group(1) == 'L' for _, t in tune.header)
    text, st, skipped = voice_abc(tune, voice, None, keep_cs)
    warns = []
    try:
        bars, msgs = music21_bars(text)
    except Exception as e:  # chord symbols are the usual culprit
        if keep_cs:
            text, st, skipped = voice_abc(tune, voice, None, False)
            bars, msgs = music21_bars(text)
            warns.append(f'chord symbols dropped (music21: {str(e)[:80]})')
        else:
            raise
    if not has_l:
        fit = lambda bs: sum(1 for b in bs if b.nominal_q and abs(b.len_q - b.nominal_q) < 1e-6)
        alt_unit = '1/8' if st.unit != Fraction(1, 8) else '1/16'
        try:
            text2, st2, sk2 = voice_abc(tune, voice, alt_unit, keep_cs)
            bars2, msgs2 = music21_bars(text2)
            if fit(bars2) > fit(bars) * 1.5 + 1:
                warns.append(f'no L: field - read with L:{alt_unit} (bars fit the meter; LOTRO/Maestro convention)')
                bars, msgs, st, skipped, text = bars2, msgs2, st2, sk2, text2
        except Exception:
            pass
    if st.dropped_cs:
        warns.append(f'{st.dropped_cs} chord symbol(s) music21 cannot read were dropped')
    # music21 drops the bracket of a 3rd (4th...) ending, so --expand-repeats cannot play it
    late = sorted({int(x) for _, t in voice.lines for g in ENDING_RE.findall(t.split('%')[0]) for x in re.findall(r'\d+', g) if int(x) >= 3})
    if late:
        warns.append(f'endings for pass {", ".join(map(str, late))} found: --expand-repeats only handles 1st/2nd endings; '
                     'spell the playing order out with --bars (e.g. 1-8,1-6,9)')
    if re.search(r'D\.\s?[CS]\.|Da Capo|Dal Segno|!(?:D\.[CS]\.|dacapo|dacoda|segno|coda)!', '\n'.join(t for _, t in voice.lines), re.I):
        warns.append('D.C. / D.S. / segno / coda markings are not expanded: spell the playing order out with --bars')
    for ln, s in skipped:
        warns.append(f'line {ln} skipped (not music): {s}')
    return {'bars': bars, 'warnings': warns + msgs, 'abc': text}


def voice_summary(v: VoiceDef, bars: list[Bar] | None) -> dict:
    d = {'id': v.id, 'name': v.name, 'clef': v.clef, 'octaveShift': v.octave_shift, 'transpose': v.transpose}
    if bars is not None:
        mids = [e[2] for b in bars for e in b.events if not e[4]]
        d['notes'] = len(mids)
        d['bars'] = len(bars)
        if mids:
            sh = v.octave_shift + v.transpose
            d['range'] = f'{midi_name(min(mids) + sh)}-{midi_name(max(mids) + sh)}'
    return d


def load_reference(path: str, tune: str | None = None, title: str | None = None, voice: str | None = None,
                   expand_repeats: bool = False, bars: str | None = None, analyse_key: bool = True) -> dict:
    with open(path, encoding='utf-8', errors='replace') as fh:
        text = fh.read()
    tunes = split_tunes(text)
    if not tunes:
        raise SystemExit(f'abc2notes: no X: tunes in {path}')
    t = find_tune(tunes, tune, title)
    voices = split_voices(t)
    if not voices:
        raise SystemExit(f'abc2notes: tune X:{t.x} has no music')
    parsed: dict[str, dict] = {}
    with_notes = []
    for v in voices:
        if not any(l.strip() and not l.strip().startswith('%') and not FIELD_RE.match(l.strip()) for _, l in v.lines):
            continue
        try:
            parsed[v.id] = parse_voice(t, v)
        except Exception as e:
            parsed[v.id] = {'error': str(e)[:200], 'bars': []}
        if any(not e[4] for b in parsed[v.id]['bars'] for e in b.events):
            with_notes.append(v)
    if not with_notes:
        errs = '; '.join(f'{k}: {p.get("error")}' for k, p in parsed.items() if p.get('error'))
        raise SystemExit(f'abc2notes: no voice with notes in tune X:{t.x} {errs}')
    if voice is None:
        sel = with_notes[0]
    else:
        sel = next((v for v in voices if v.id == voice), None)
        if sel is None and voice.isdigit() and 1 <= int(voice) <= len(with_notes):
            sel = with_notes[int(voice) - 1]
        if sel is None:
            raise SystemExit(f'abc2notes: no voice "{voice}" (voices: {", ".join(v.id + (" " + v.name if v.name else "") for v in with_notes)})')
        if sel.id not in parsed or not parsed[sel.id]['bars']:
            raise SystemExit(f'abc2notes: voice "{voice}" has no notes')
    p = parsed[sel.id]
    bl = p['bars']
    order = select_order(bl, expand_repeats, bars)
    shift = sel.octave_shift + sel.transpose
    notes, css, bar_out, tie_w = build_notes(bl, order, shift)
    key_field = next(iter(t.field_values('K')), '')
    meter_field = next(iter(t.field_values('M')), '')
    unit_field = next(iter(t.field_values('L')), '')
    first_sharps = next((b.key_sharps for b in bl if b.key_sharps is not None), None)
    res = {
        'file': os.path.abspath(path),
        'tune': {'index': t.index, 'X': t.x, 'titles': t.titles, 'composers': t.composers, 'origin': t.origin,
                 'source': t.source, 'line': t.start_line},
        'voice': voice_summary(sel, bl),
        'voices': [voice_summary(v, parsed[v.id]['bars'] if v.id in parsed else None) for v in voices],
        'key': clean_key(key_field)[0] if key_field else None,
        'keyField': key_field,
        'keySignatureSharps': first_sharps,
        'meter': meter_field or None,
        'meters': sorted({b.meter for b in bl if b.meter}),
        'unitNote': unit_field or None,
        'expandRepeats': expand_repeats,
        'barSelection': bars,
        'bars': bar_out,
        'notes': notes,
        'chordSymbols': css,
        'sections': body_sections(t, bl),
        'barProblems': bar_problems(bl),
        'warnings': p['warnings'] + tie_w,
    }
    if analyse_key and notes:
        res['analysedKey'] = analyse(notes)
    return res


def body_sections(t: Tune, bars: list[Bar]) -> list[dict]:
    """P: and body T: labels with the source line (bar numbers are approximate)."""
    out = []
    for ln, s in t.body:
        m = re.match(r'^([PT]):\s*(.*)$', s.strip())
        if m and m.group(2):
            out.append({'line': ln, 'field': m.group(1), 'label': m.group(2)})
    return out


def analyse(notes: list[dict]) -> str | None:
    """Krumhansl-Schmuckler key estimate from duration-weighted pitch classes."""
    prof_maj = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
    prof_min = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
    hist = [0.0] * 12
    for n in notes:
        hist[n['midi'] % 12] += n['durQ']
    if not sum(hist):
        return None

    def corr(a, b):
        ma, mb = sum(a) / 12, sum(b) / 12
        num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
        den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
        return num / den if den else 0

    best = None
    for tonic in range(12):
        for prof, mode in ((prof_maj, 'major'), (prof_min, 'minor')):
            rot = [prof[(i - tonic) % 12] for i in range(12)]
            c = corr(hist, rot)
            if best is None or c > best[0]:
                best = (c, f'{COMMON_NAMES[tonic]} {mode}')
    return f'{best[1]} (r={best[0]:.2f})'


# ---------------------------------------------------------------------------------------------
# Output formats
# ---------------------------------------------------------------------------------------------


def fmt_q(x: float) -> str:
    fr = Fraction(x).limit_denominator(48)
    if abs(float(fr) - x) > 1e-6:
        return f'{x:.3f}'
    return str(fr.numerator) if fr.denominator == 1 else f'{fr.numerator}/{fr.denominator}'


def bar_tokens(ref: dict, step_q: float) -> list[tuple[dict, list[str]]]:
    """Per selected bar: tokens 'A4:2', 'r:1', '_:2' (tie into this bar), durations in steps."""
    out = []
    notes = ref['notes']
    k = 0
    carry = 0.0
    for b in ref['bars']:
        toks = []
        t = b['startQ']
        end = b['startQ'] + b['lenQ']
        if carry > 1e-9:
            seg = min(carry, b['lenQ'])
            toks.append(f'_:{fmt_q(seg / step_q)}')
            t += seg
            carry -= seg
        while k < len(notes) and notes[k]['onsetQ'] < end - 1e-9:
            n = notes[k]
            if n["onsetQ"] > t + 1e-4:
                toks.append(f'r:{fmt_q((n["onsetQ"] - t) / step_q)}')
                t = n['onsetQ']
            d = n['durQ']
            seg = min(d, end - n['onsetQ'])
            toks.append(f'{n["name"]}:{fmt_q(seg / step_q)}')
            t = n['onsetQ'] + seg
            carry = d - seg
            k += 1
        if t < end - 1e-9 and carry <= 1e-9:
            toks.append(f'r:{fmt_q((end - t) / step_q)}')
        out.append((b, toks))
    return out


def text_listing(ref: dict) -> str:
    lines = []
    t = ref['tune']
    lines.append(f'# {os.path.basename(ref["file"])} #{t["index"]} X:{t["X"]} {" / ".join(t["titles"][:2])}  voice {ref["voice"]["id"]} {ref["voice"]["name"]}')
    lines.append(f'# K:{ref["keyField"]}  M:{ref["meter"]}  L:{ref["unitNote"]}  key~{ref.get("analysedKey")}  (durations in quarter notes; _ = tied over the bar line)')
    cs_by_seq: dict[int, list] = {}
    starts = {b['seq']: (b['startQ'], b['startQ'] + b['lenQ']) for b in ref['bars']}
    for c in ref['chordSymbols']:
        for sq, (a, e) in starts.items():
            if a - 1e-9 <= c['onsetQ'] < e - 1e-9:
                cs_by_seq.setdefault(sq, []).append(c['symbol'])
                break
    for b, toks in bar_tokens(ref, 1.0):
        flag = ''
        if b['nominalQ'] and abs(b['lenQ'] - b['nominalQ']) > 1e-6:
            flag = f'  ({fmt_q(b["lenQ"])}q of {fmt_q(b["nominalQ"])})'
        chords = f'  [{" ".join(cs_by_seq.get(b["seq"], []))}]' if cs_by_seq.get(b['seq']) else ''
        lines.append(f'bar {b["n"]:>3} | {" ".join(toks)}{flag}{chords}')
    for w in ref['barProblems']:
        lines.append(f'# bar problem: {w}')
    for w in ref['warnings']:
        lines.append(f'# warning: {w}')
    return '\n'.join(lines)


def dsl_listing(ref: dict, step_q: float) -> str:
    """Melody string for sequencer.mel(): one token per note/rest, '|' per bar."""
    out_bars = [' '.join(toks) for _, toks in bar_tokens(ref, step_q)]
    lines = []
    for i in range(0, len(out_bars), 4):
        lines.append('  ' + ' | '.join(out_bars[i:i + 4]) + ' |')
    first = ref['bars'][0]['n'] if ref['bars'] else '-'
    last = ref['bars'][-1]['n'] if ref['bars'] else '-'
    hdr = f'// {os.path.basename(ref["file"])} X:{ref["tune"]["X"]} voice {ref["voice"]["id"]}, bars {first}..{last}, 1 step = {fmt_q(step_q)} quarter'
    return hdr + '\n`\n' + '\n'.join(lines) + '\n`'


def list_file(path: str, title: str | None, parse: bool) -> list[dict]:
    with open(path, encoding='utf-8', errors='replace') as fh:
        text = fh.read()
    tunes = split_tunes(text)
    rows = []
    for t in tunes:
        if title and not any(title.lower() in x.lower() for x in t.titles):
            continue
        has_music = any(l.strip() and not l.strip().startswith('%') and not FIELD_RE.match(l.strip()) for _, l in t.body)
        row = {'index': t.index, 'X': t.x, 'line': t.start_line, 'titles': t.titles, 'composers': t.composers, 'origin': t.origin,
               'source': t.source, 'K': next(iter(t.field_values('K')), None), 'M': next(iter(t.field_values('M')), None),
               'L': next(iter(t.field_values('L')), None), 'hasMusic': has_music, 'sections': [s['label'] for s in body_sections(t, [])]}
        if parse and has_music:
            vs = []
            for v in split_voices(t):
                if not any(l.strip() and not l.strip().startswith('%') and not FIELD_RE.match(l.strip()) for _, l in v.lines):
                    continue
                try:
                    p = parse_voice(t, v)
                    d = voice_summary(v, p['bars'])
                    d['barProblems'] = len(bar_problems(p['bars']))
                    d['warnings'] = len(p['warnings'])
                    order = list(range(len(p['bars'])))
                    ns, _, _, _ = build_notes(p['bars'], order, v.octave_shift + v.transpose)
                    d['analysedKey'] = analyse(ns)
                    d['lengthQ'] = round(sum(b.len_q for b in p['bars']), 3)
                    d['repeats'] = sum(1 for b in p['bars'] if b.end_rep) + sum(1 for b in p['bars'] if b.endings)
                except Exception as e:
                    d = voice_summary(v, None)
                    d['error'] = str(e)[:120]
                vs.append(d)
            row['voices'] = vs
        rows.append(row)
    return rows


def print_list(rows: list[dict], path: str) -> None:
    print(f'# {path}: {len(rows)} tune(s)')
    for r in rows:
        t = ' / '.join(r['titles'][:3]) or '(no title)'
        comp = ('; C: ' + ' | '.join(r['composers'])) if r['composers'] else ''
        org = ('; O: ' + ' | '.join(r['origin'])) if r['origin'] else ''
        print(f'#{r["index"]:<3} X:{r["X"]:<6} line {r["line"]:<6} {t}{comp}{org}')
        print(f'      K:{r["K"]} M:{r["M"]} L:{r["L"]}' + ('' if r['hasMusic'] else '  (no music)') +
              (f'  sections: {", ".join(r["sections"][:8])}' if r['sections'] else ''))
        for v in r.get('voices', []):
            if 'error' in v:
                print(f'      V:{v["id"]} {v["name"]}: PARSE ERROR {v["error"]}')
                continue
            extra = []
            if v.get('octaveShift'):
                extra.append(f'octave {v["octaveShift"]:+d}')
            if v.get('transpose'):
                extra.append(f'transpose {v["transpose"]:+d}')
            print(f'      V:{v["id"]} {v["name"] or ""}'.rstrip() + f': {v.get("notes", 0)} notes, {v.get("bars", 0)} bars, {fmt_q(v.get("lengthQ", 0))}q, range {v.get("range", "-")}, '
                  f'key~{v.get("analysedKey")}, repeats/endings {v.get("repeats", 0)}, bar problems {v.get("barProblems", 0)}' +
                  (f', warnings {v["warnings"]}' if v.get('warnings') else '') + (f' ({", ".join(extra)})' if extra else ''))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('file')
    ap.add_argument('--tune')
    ap.add_argument('--title')
    ap.add_argument('--voice')
    ap.add_argument('--expand-repeats', action='store_true')
    ap.add_argument('--bars')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--no-parse', action='store_true')
    ap.add_argument('--json', action='store_true', help='with --list: JSON output')
    ap.add_argument('--text', action='store_true')
    ap.add_argument('--dsl', type=str, help='step length in quarter notes, e.g. 0.5 or 1/3')
    ap.add_argument('--accidentals', choices=['pitch', 'octave', 'not'],
                    help="how accidentals carry through a bar (default: the file's %%%%propagate-accidentals, else ABC 2.1 'pitch')")
    ap.add_argument('--out')
    a = ap.parse_args(argv)
    global ACCIDENTALS
    ACCIDENTALS = a.accidentals
    if a.list:
        rows = list_file(a.file, a.title, not a.no_parse)
        if a.json:
            out = json.dumps(rows, indent=1)
        else:
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                print_list(rows, a.file)
            out = buf.getvalue()
    else:
        ref = load_reference(a.file, a.tune, a.title, a.voice, a.expand_repeats, a.bars)
        if a.text:
            out = text_listing(ref)
        elif a.dsl:
            out = dsl_listing(ref, float(Fraction(a.dsl)))
        else:
            out = json.dumps(ref)
    if a.out:
        with open(a.out, 'w') as fh:
            fh.write(out if out.endswith('\n') else out + '\n')
    else:
        try:
            sys.stdout.write(out if out.endswith('\n') else out + '\n')
        except BrokenPipeError:
            pass
    return 0


if __name__ == '__main__':
    sys.exit(main())
