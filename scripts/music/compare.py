#!/usr/bin/env python3
"""
compare.py - prove that a song's melody is a faithful transcription of a reference (ABC).

Usage (PY=/home/user/.venv-audio/bin/python, run from the repo root):
  $PY scripts/music/compare.py --abc REF.abc [--tune X | --title SUBSTR] [--voice V]
        [--expand-repeats] [--ref-bars 37-44]
        (--song ID | --song-file scratch.ts [--export NAME]) --channel CH[,CH2]
        [--section NAME] [--bars 1-8]
        [--pitch-min 95] [--rhythm-min 90] [--allow-bars 53] [--no-bar-check] [--resync]
        [--shift N] [--scale R] [--strict-octave] [--tol 0.02]
        [--locate | --locate-cand | --global] [--json] [--verbose]
  Reference vs reference (triage): replace the song options by
        --cand-abc OTHER.abc [--cand-tune X | --cand-title S] [--cand-voice V]
        [--cand-expand-repeats] [--cand-bars LIST]

Reference side: see abc2notes.py (chords -> top note, ties merged, graces ignored; --ref-bars uses
the bar numbers printed by `abc2notes.py FILE --text`, ranges are concatenated in order).
Song side: events from scripts/music/export-song.mjs (exact grid, before humanize); several
channels are merged; the line is reduced to the highest note per onset; grace notes and mordent
auxiliaries are ignored. --section limits to one section (bars counted inside it), --bars to bars.

How it matches:
  * transposition-invariant: all 12 pitch-class shifts are tried, the global shift is the most
    common interval of the aligned notes; notes in another octave are reported as octave
    displacements (they still count as pitch matches unless --strict-octave);
  * time-scale tolerant: song beats are scaled to reference quarter notes by the ratio (1/6 ...
    6, e.g. 3/2 for a 6/8 song against 6/8 eighths, x2 / x1/2 for doubled or halved values)
    that aligns best;
  * alignment = dynamic programming over the two note lines with matches, wrong notes, missing /
    extra notes, split (one ref note played as repeated notes) and merged repeated notes. A first
    pass finds the dominant time offset between the lines; a second pass anchors the alignment to
    it, so each reference note is paired with what the candidate plays at the same place;
  * tolerated liberties (no penalty): octave displacements, a long note re-struck as repeated
    notes (split), articulation (staccato, rests vs. held notes), short extra notes that decorate
    the reference note they start in (ornaments, passing / neighbour tones), written-out
    ornaments of the reference left out (a note of at most a sixteenth and at most a quarter of
    its longer neighbour), song grace notes and mordents;
  * when the reference is much longer than the song excerpt and no --ref-bars are given, the
    excerpt is located inside the reference (--locate / --global force); when the candidate is
    much longer than the reference, the reference is located inside the candidate (--locate-cand
    forces it) and candidate notes outside that span are ignored.

Scores, over the reference notes (minus excused ornaments, plus unexplained extra song notes):
  pitch %  = notes present with the right pitch;
  rhythm % = notes that start at the right time, i.e. at the dominant offset AND at the right
             distance from the next aligned note. Repeated notes merged into one keep only their
             first onset. Everything after an inserted or dropped beat / bar is displaced, unless
             --resync re-anchors there (one error per shift; segments shorter than 2 bars are
             never re-anchored).
Verdict: PASS needs pitch >= --pitch-min (95), rhythm >= --rhythm-min (90) and no broken bar: a
reference bar with more than half of its notes wrong (pitch or rhythm; rhythm only counts when
--rhythm-min > 0), or a one-note bar whose note is wrong or missing. --allow-bars LIST excludes
reference bars that were changed on purpose from all scores and checks (they stay listed).
Exit code 0 = pass, 1 = fail, 2 = error.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
from bisect import bisect_right
from collections import Counter
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import abc2notes  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
EXPORT = os.path.join(HERE, 'export-song.mjs')
SCALES = [Fraction(1, 6), Fraction(1, 4), Fraction(1, 3), Fraction(3, 8), Fraction(1, 2), Fraction(2, 3), Fraction(3, 4), Fraction(1),
          Fraction(4, 3), Fraction(3, 2), Fraction(2), Fraction(8, 3), Fraction(3), Fraction(4), Fraction(6)]
EPS = 1e-4  # time comparisons, in reference quarter notes
ALIGNED = ('match', 'sub', 'split', 'merge')


SPELL = {'sharps': None}  # key signature of the reference (report spelling: G#/Ab)


def nm(m: int) -> str:
    return abc2notes.midi_name(m, SPELL['sharps'])


def bar_labels(R: list[dict]) -> dict:
    """seq -> printable bar label; a bar played again (expanded repeats, ranges like 1-8,1-6)
    is labelled "5 (2nd time)"."""
    seen: Counter = Counter()
    out = {}
    for n in R:
        if n['seq'] in out:
            continue
        seen[n['bar']] += 1
        k = seen[n['bar']]
        out[n['seq']] = f'{n["bar"]}' + ('' if k == 1 else f' ({k}{"nd" if k == 2 else "rd" if k == 3 else "th"} time)')
    return out


def fq(x: float) -> str:
    return abc2notes.fmt_q(x)


# ---------------------------------------------------------------------------------------------
# Loading both sides as [{on, dur, midi, bar, label}]
# ---------------------------------------------------------------------------------------------


def parse_bars(spec: str | None):
    return abc2notes.parse_bar_list(spec) if spec else None


def load_abc_side(path, tune, title, voice, expand, bars) -> dict:
    ref = abc2notes.load_reference(path, tune, title, voice, expand, bars, analyse_key=False)
    notes = [{'on': n['onsetQ'], 'dur': n['durQ'], 'midi': n['midi'], 'bar': n['bar'], 'seq': n['seq']} for n in ref['notes']]
    t = ref['tune']
    desc = f'{os.path.basename(path)} #{t["index"]} X:{t["X"]} "{(t["titles"] or ["?"])[0]}" voice {ref["voice"]["id"]}' + (f' ({ref["voice"]["name"]})' if ref['voice']['name'] else '')
    if bars:
        desc += f', bars {bars}'
    if expand:
        desc += ', repeats expanded'
    bar_len = {b['seq']: (b['startQ'], b['lenQ'], b['n']) for b in ref['bars']}
    nominal = sorted(b['nominalQ'] or b['lenQ'] for b in ref['bars']) or [4.0]
    return {'notes': notes, 'desc': desc, 'unit': 'q', 'meter': ref['meter'], 'key': ref['keyField'], 'bars': bar_len,
            'barQ': nominal[len(nominal) // 2], 'barLabel': lambda n: f'{n["bar"]}', 'raw': ref, 'kind': 'abc'}


def mono(evs: list[dict]) -> list[dict]:
    evs = sorted(evs, key=lambda e: (e['on'], -e['midi']))
    out = []
    for e in evs:
        if out and abs(out[-1]['on'] - e['on']) < EPS:
            continue
        out.append(dict(e))
    for a, b in zip(out, out[1:]):
        if a['dur'] > b['on'] - a['on'] + EPS:
            a['dur'] = b['on'] - a['on']
    return out


def load_song_side(song, song_file, export, channels, section, bars) -> dict:
    cmd = ['node', EXPORT]
    if song_file:
        cmd += ['--file', song_file]
        if export:
            cmd += ['--export', export]
        if song:
            cmd += [song]
    else:
        cmd += [song]
    cmd += ['--channel', channels]
    if section:
        cmd += ['--section', section]
    p = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
    if p.returncode != 0:
        raise SystemExit(f'compare: export-song failed: {p.stderr.strip() or p.stdout.strip()}')
    data = json.loads(p.stdout)
    for w in data['warnings']:
        if not section or f'/{section}]' in w:
            print(f'compare: song warning: {w}', file=sys.stderr)
    spb = data['meter']['stepsPerBeat']
    bs = data['meter']['barSteps']
    bar_beats = bs / spb
    evs = []
    exact = lambda steps: float(Fraction(steps).limit_denominator(192) / spb)  # undo JSON rounding
    for ch, c in data['channels'].items():
        for e in c['events']:
            if e.get('grace'):
                continue
            evs.append({'on': exact(e['startStep']), 'dur': exact(e['durSteps']), 'midi': e['midi'], 'bar': e['bar'], 'section': e['section'],
                        'ch': ch, 'sbar': e['sectionBar']})
    if not evs:
        raise SystemExit(f'compare: no notes on channel(s) {channels}' + (f' in section {section}' if section else ''))
    line = mono(evs)
    rng = parse_bars(bars)
    if rng:
        # concatenate the selected bars in the given order (bars are equal length in songs)
        out = []
        k = 0
        for a, b in rng:
            for bar in range(a, b + 1):
                for e in line:
                    if e['bar'] == bar:
                        ne = dict(e)
                        ne['on'] = k * bar_beats + (e['on'] - (bar - 1) * bar_beats)
                        out.append(ne)
                k += 1
        line = out
        if not line:
            raise SystemExit(f'compare: no notes in song bars {bars}')
    else:
        t0 = math.floor(line[0]['on'] / bar_beats + EPS) * bar_beats
        for e in line:
            e['on'] -= t0
    desc = f'song {data["song"]}{" (" + os.path.relpath(song_file, ROOT) + ")" if song_file else ""} channel {channels}' + (f' section {section}' if section else '') + (f' bars {bars}' if bars else '')
    meter = f'{bs}/{spb} steps/beat'
    return {'notes': line, 'desc': desc, 'unit': 'beat', 'meter': meter, 'key': data['scale'], 'barBeats': bar_beats,
            'barLabel': (lambda n: f'{n["section"]}:{n["sbar"]}') if not section else (lambda n: f'{n["bar"]}'), 'raw': data, 'kind': 'song'}


def iois(notes: list[dict]) -> list[float]:
    out = []
    for i, n in enumerate(notes):
        out.append(notes[i + 1]['on'] - n['on'] if i + 1 < len(notes) else n['dur'])
    return out


# ---------------------------------------------------------------------------------------------
# Alignment
# ---------------------------------------------------------------------------------------------


def pitch_dp_score(rp: list[int], sp: list[int], semiglobal: bool) -> float:
    """Fast pitch-only alignment score (numpy, row-vectorised)."""
    import numpy as np

    r = np.asarray(rp)
    s = np.asarray(sp)
    m = len(s)
    gap = 1.0
    idx = np.arange(m + 1, dtype=float)
    prev = -gap * idx
    best_end = prev[m]
    for i in range(1, len(r) + 1):
        match = np.where(s == r[i - 1], 1.0, -1.0)
        a = np.maximum(prev[:-1] + match, prev[1:] - gap)
        first = 0.0 if semiglobal else -gap * i
        b = np.concatenate(([first], a))
        cur = np.maximum.accumulate(b + gap * idx) - gap * idx
        prev = cur
        if semiglobal:
            best_end = max(best_end, cur[m])
    return float(best_end if semiglobal else prev[m])


class Aligner:
    """DP alignment of the reference line R with the candidate line S.

    Pass 1 (offset None) scores pitch-class agreement and equal note lengths. Pass 2 gets the
    dominant time offset (candidate onset - reference onset, in reference quarters) and rewards
    pairs at that offset, so a wrong note is paired with the reference note it replaces instead of
    with a same-pitch note elsewhere, and extra notes only count as ornaments when they start
    inside the reference note they decorate.
    """

    def __init__(self, R, S, shift_pc, scale, semiglobal, tol, offset=None, semi_cand=False):
        self.R, self.S = R, S
        self.semi_cand = semi_cand  # free leading/trailing candidate notes (excerpt inside a long candidate)
        self.offset = offset
        self.k = shift_pc
        self.r = float(scale)
        self.semi = semiglobal
        self.tol = tol
        self.ron = [n['on'] for n in R]
        self.son = [n['on'] * self.r for n in S]
        self.rlen = iois(R)
        self.slen = [x * self.r for x in iois(S)]
        self.rpc = [n['midi'] % 12 for n in R]
        self.spc = [(n['midi'] - shift_pc) % 12 for n in S]

    def orn_ref(self, i):
        """Written-out ornament in the reference: at most a sixteenth and at most a quarter of its
        longer neighbour (a 32nd turn, a sixteenth before a half note; not the short note of a
        dotted figure, not running sixteenths)."""
        L = self.rlen
        nb = max(L[i - 1] if i > 0 else 0, L[i + 1] if i + 1 < len(L) else 0)
        return L[i] <= 0.25 + EPS and L[i] <= 0.25 * nb + EPS

    def orn_song(self, j):
        """Short candidate note beside a longer one (ornament, written-out grace)."""
        L = self.slen
        nb = max(L[j - 1] if j > 0 else 0, L[j + 1] if j + 1 < len(L) else 0)
        return L[j] <= 0.5 + EPS and L[j] <= 0.5 * nb + EPS

    def stepwise(self, j):
        """Passing / neighbour tone: within 2 semitones of an adjacent candidate note."""
        S = self.S
        m = S[j]['midi']
        return (j > 0 and abs(m - S[j - 1]['midi']) <= 2) or (j + 1 < len(S) and abs(m - S[j + 1]['midi']) <= 2)

    def run(self):
        R, S = self.R, self.S
        n, m = len(R), len(S)
        NEG = -1e18
        D = [[NEG] * (m + 1) for _ in range(n + 1)]
        B = [[None] * (m + 1) for _ in range(n + 1)]
        D[0][0] = 0.0
        orn_r = [self.orn_ref(i) for i in range(n)]
        orn_s = [self.orn_song(j) for j in range(m)]
        step_s = [self.stepwise(j) for j in range(m)]
        dcost = [-0.35 if orn_r[i] else -1.2 for i in range(n)]
        icost = [-0.35 if orn_s[j] else -1.2 for j in range(m)]
        for j in range(1, m + 1):
            if self.semi_cand:
                D[0][j] = 0.0
                B[0][j] = ('start', 0, 1, False)
            else:
                D[0][j] = D[0][j - 1] + icost[j - 1]
                B[0][j] = ('ins', 0, 1, False)
        for i in range(1, n + 1):
            D[i][0] = 0.0 if self.semi else D[i - 1][0] + dcost[i - 1]
            B[i][0] = ('start', 1, 0, False) if self.semi else ('del', 1, 0, orn_r[i - 1])
        rpc, spc, rl, sl, tol = self.rpc, self.spc, self.rlen, self.slen, self.tol
        ron, son, off = self.ron, self.son, self.offset
        smidi = [x['midi'] for x in S]
        rmidi = [x['midi'] for x in R]
        if off is None:
            on_time = None
        else:
            def on_time(i0, j0):
                return abs(son[j0] - ron[i0] - off) <= tol

        def tb(i0, j0):
            """pass 2: a pair at the dominant offset earns a bonus, a displaced pair a penalty that
            grows with the displacement (so a wrong note in its own time slot beats a same-pitch
            note borrowed from elsewhere, but a consistently displaced phrase still aligns)"""
            if on_time is None:
                return 0.0
            dev = abs(son[j0] - ron[i0] - off)
            return 0.45 if dev <= tol else -min(2.0, 1.0 + 2.0 * dev)

        for i in range(1, n + 1):
            Di, Dp = D[i], D[i - 1]
            Bi = B[i]
            ri = i - 1
            for j in range(1, m + 1):
                sj = j - 1
                # match / substitution
                if rpc[ri] == spc[sj]:
                    best = Dp[j - 1] + 2.0 + (0.3 if abs(rl[ri] - sl[sj]) <= tol else 0.0) + tb(ri, sj)
                    bm = ('match', 1, 1, False)
                else:
                    best = Dp[j - 1] + (-1.0 if on_time is None else (-0.2 if on_time(ri, sj) else -1.2))
                    bm = ('sub', 1, 1, False)
                v = Dp[j] + dcost[ri]
                if v > best:
                    best, bm = v, ('del', 1, 0, orn_r[ri])
                # extra candidate note: excused when ornamental in its own line, or when it
                # subdivides the longer ref note just consumed and moves stepwise (passing tone);
                # in pass 2 it must also start inside that ref note's time span
                exc = orn_s[sj] or (sl[sj] <= 0.5 * rl[ri] + EPS and step_s[sj])
                if exc and on_time is not None:
                    t = son[sj] - off
                    exc = ron[ri] - tol < t < ron[ri] + rl[ri] - tol
                v = Di[j - 1] + (-0.35 if exc else -1.2)
                if v > best:
                    best, bm = v, ('ins', 0, 1, exc)
                # split: one ref note <- k repeated candidate notes (same pitch)
                for k in (2, 3, 4):
                    if j - k < 0:
                        break
                    if spc[j - k] != rpc[ri] or any(smidi[x] != smidi[j - k] for x in range(j - k, j)):
                        break
                    tot = sum(sl[j - k:j])
                    v = D[i - 1][j - k] + 2.0 - 0.15 * (k - 1) + (0.3 if abs(tot - rl[ri]) <= tol else -0.6) + tb(ri, j - k)
                    if v > best:
                        best, bm = v, ('split', 1, k, False)
                # merge: k repeated ref notes (same pitch) -> one candidate note
                for k in (2, 3, 4):
                    if i - k < 0:
                        break
                    if rpc[i - k] != spc[sj] or any(rmidi[x] != rmidi[i - k] for x in range(i - k, i)):
                        break
                    tot = sum(rl[i - k:i])
                    v = D[i - k][j - 1] + 2.0 - 0.15 * (k - 1) + (0.3 if abs(tot - sl[sj]) <= tol else -0.6) + tb(i - k, sj)
                    if v > best:
                        best, bm = v, ('merge', k, 1, False)
                Di[j] = best
                Bi[j] = bm
        end_j = m
        if self.semi:
            end_i = max(range(n + 1), key=lambda i: D[i][m])
        elif self.semi_cand:
            end_i = n
            end_j = max(range(m + 1), key=lambda j: D[n][j])
        else:
            end_i = n
        score = D[end_i][end_j]
        self.end_j = end_j
        # traceback
        ops = []
        i, j = end_i, end_j
        while i > 0 or j > 0:
            mv = B[i][j]
            if mv is None:
                break
            kind, di, dj, exc = mv
            if kind == 'start':
                break
            ops.append((kind, i - di, i, j - dj, j, exc))
            i -= di
            j -= dj
        ops.reverse()
        return score, ops


def densest(vals: list[float], tol: float) -> float:
    """The offset shared by the most values (within +-tol): the median of the densest window."""
    if not vals:
        return 0.0
    v = sorted(vals)
    best, lo, hi = 0, 0, 0
    a = 0
    for b in range(len(v)):
        while v[b] - v[a] > 2 * tol + 1e-9:
            a += 1
        if b - a + 1 > best:
            best, lo, hi = b - a + 1, a, b
    w = v[lo:hi + 1]
    return w[len(w) // 2]


def analyse(al: Aligner, ops, opts, bar_q: float, semi: bool, allow: set) -> dict:
    """Turn the alignment into units, diff events, per-note statuses, scores and broken bars."""
    R, S = al.R, al.S
    tol = al.tol
    units: list[dict] = []
    events: list[dict] = []
    dels: list = []
    inss: list = []

    def flush():
        # a missing ref note next to an extra candidate note is a wrong note, never two excused
        # ornaments: pair them up in order
        for d, ins in zip(dels, inss):
            units.append({'kind': 'sub', 'i0': d[0], 'i1': d[0] + 1, 'j0': ins[1], 'j1': ins[1] + 1})
        for i0, j0, exc in dels[len(inss):]:
            events.append({'type': 'missing', 'i': i0, 'j': j0, 'excused': exc})
        for i0, j0, inner in inss[len(dels):]:
            events.append({'type': 'extra', 'i': i0, 'j': j0, 'inner': inner})
        dels.clear()
        inss.clear()

    aligned = [k for k, op in enumerate(ops) if op[0] in ALIGNED]
    first_a = aligned[0] if aligned else len(ops)
    last_a = aligned[-1] if aligned else -1
    for k, (kind, i0, i1, j0, j1, exc) in enumerate(ops):
        if kind in ALIGNED:
            flush()
            units.append({'kind': kind, 'i0': i0, 'i1': i1, 'j0': j0, 'j1': j1})
        elif kind == 'del':
            dels.append((i0, j0, exc))
        elif kind == 'ins':
            # only notes between aligned notes can be ornaments / passing tones
            inss.append((i0, j0, first_a < k < last_a))
    flush()
    units.sort(key=lambda u: (u['i0'], u['j0']))

    # global transposition from the aligned notes
    diffs = Counter(S[u['j0']]['midi'] - R[u['i0']]['midi'] for u in units if u['kind'] != 'sub')
    T = diffs.most_common(1)[0][0] if diffs else al.k

    # dominant time offset, and the expected offset of every unit (--resync: piecewise)
    for u in units:
        u['off'] = al.son[u['j0']] - al.ron[u['i0']]
    base = [u['off'] for u in units if u['kind'] != 'sub'] or [u['off'] for u in units]
    Doff = densest(base, tol)
    exp = [Doff] * len(units)
    shift_at: dict[int, float] = {}
    if opts.resync and units:
        segs: list[dict] = []
        for idx, u in enumerate(units):
            if segs and abs(u['off'] - segs[-1]['off']) <= tol:
                segs[-1]['end'] = idx
            else:
                segs.append({'start': idx, 'end': idx, 'off': u['off']})
        for s, nxt in zip(segs, segs[1:] + [None]):
            t0 = al.ron[units[s['start']]['i0']]
            last = units[s['end']]['i1'] - 1
            t1 = al.ron[units[nxt['start']]['i0']] if nxt else al.ron[last] + al.rlen[last]
            s['anchored'] = t1 - t0 >= 2 * bar_q - tol
        cur = next((s['off'] for s in segs if s['anchored']), Doff)
        for s in segs:
            if s['anchored']:
                if abs(s['off'] - cur) > tol:
                    shift_at[s['start']] = s['off'] - cur
                cur = s['off']
            for idx in range(s['start'], s['end'] + 1):
                exp[idx] = cur

    for idx, u in enumerate(units):
        u['exp'] = exp[idx]
        u['dev'] = u['off'] - exp[idx]
        u['onset_ok'] = abs(u['dev']) <= tol
        u['shift'] = shift_at.get(idx)
        if idx + 1 < len(units):
            v = units[idx + 1]
            dr = al.ron[v['i0']] - al.ron[u['i0']]
            ds = al.son[v['j0']] - al.son[u['j0']]
            u['dr'], u['ds'] = dr, ds
            # the distance to the next aligned note (a re-anchoring shift is charged once, there)
            u['ioi_ok'] = abs(dr - (ds - (exp[idx + 1] - exp[idx]))) <= 2 * tol
        else:
            u['ioi_ok'] = True
        u['rhythm'] = u['onset_ok'] and u['ioi_ok'] and u['shift'] is None
        u['nref'] = u['i1'] - u['i0']
        d = S[u['j0']]['midi'] - R[u['i0']]['midi']
        u['oct'] = (d - T) // 12 if u['kind'] != 'sub' and (d - T) % 12 == 0 else 0
    # octave displacements are accepted for a phrase (a run of >= 3 consecutive matched notes in the
    # same octave; wrong notes inside the run do not break it); an isolated note in another octave
    # breaks the melodic line: a wrong note
    pitched = [u for u in units if u['kind'] != 'sub']
    for u in units:
        u['octJump'] = False
    idx = 0
    while idx < len(pitched):
        end = idx
        while end + 1 < len(pitched) and pitched[end + 1]['oct'] == pitched[idx]['oct']:
            end += 1
        if pitched[idx]['oct'] != 0 and end - idx + 1 < 3:
            for x in range(idx, end + 1):
                pitched[x]['octJump'] = True
        idx = end + 1
    for u in units:
        u['pitch'] = u['kind'] != 'sub' and not u['octJump'] and not (opts.strict_octave and u['oct'] != 0)

    # extra candidate notes: excused only when short (ornament / passing tone), between two aligned
    # notes, and starting inside the reference note before them (at the expected offset). Notes
    # before the first / after the last aligned note are never excused ('outer': not tied to a bar).
    ujs = [u['j0'] for u in units]
    for e in events:
        if e['type'] != 'extra':
            continue
        j = e['j']
        e['excused'] = False
        k = bisect_right(ujs, j) - 1  # unit starting before this note
        if not e['inner'] or k < 0 or k + 1 >= len(units):
            if k < 0 or k + 1 >= len(units):
                e['outer'] = 'before' if k < 0 else 'after'
            continue
        u, v = units[k], units[k + 1]
        if not (u['j1'] <= j < v['j0']):
            continue
        span = al.ron[v['i0']] - al.ron[u['i0']]
        t = al.son[j] - u['exp']
        inside = al.ron[u['i0']] - tol < t < al.ron[v['i0']] - tol
        # a passing / neighbour tone or re-strike (within 2 semitones of a neighbour), or a quick
        # written-out grace (at most a sixteenth and a quarter of the note it decorates); a slower
        # note that leaps is not an ornament
        quick = al.slen[j] <= 0.25 + EPS and al.slen[j] <= 0.25 * span + EPS
        short = al.slen[j] <= 0.5 * span + EPS and (al.stepwise(j) or quick)
        e['excused'] = inside and short
        e['unit'] = k

    # located span (semi-global): only reference notes inside it count
    if semi and units:
        i_lo = min(u['i0'] for u in units)
        i_hi = max(u['i1'] for u in units)
    else:
        i_lo, i_hi = 0, len(R)
    events = [e for e in events if not (e['type'] == 'missing' and not (i_lo <= e['i'] < i_hi))]

    # per reference note: counted / pitch ok / rhythm ok
    allowed = lambda i: R[i]['bar'] in allow
    counted = {i: True for i in range(i_lo, i_hi)}
    p_ok = {i: False for i in range(i_lo, i_hi)}
    r_ok = {i: False for i in range(i_lo, i_hi)}
    for u in units:
        for x in range(u['i0'], u['i1']):
            p_ok[x] = u['pitch']
            r_ok[x] = u['rhythm'] and x == u['i0']  # merged repeated notes lose their own onsets
    for e in events:
        if e['type'] == 'missing' and e['excused']:
            counted[e['i']] = False
    for i in list(counted):
        if allowed(i):
            counted[i] = False

    def extra_bar(e):
        """seq/bar of the reference note an extra candidate note sits after (or before)"""
        if 'unit' in e:
            i = units[e['unit']]['i0']
        else:
            i = min(max(e['i'] - 1, 0), len(R) - 1)
        return R[i]['seq'], R[i]['bar']

    extra_by_seq: Counter = Counter()
    unexplained = 0
    outer = Counter()
    for e in events:
        if e['type'] == 'extra' and not e['excused']:
            if e.get('outer'):
                # before the first / after the last aligned note: in the denominator, not in a bar
                outer[e['outer']] += 1
                unexplained += 1
                continue
            sq, bar = extra_bar(e)
            e['seq'], e['bar'] = sq, bar
            if bar in allow:
                continue
            extra_by_seq[sq] += 1
            unexplained += 1
    n_counted = sum(1 for i in counted if counted[i])
    denom = max(1, n_counted + unexplained)
    pitch_ok = sum(1 for i in counted if counted[i] and p_ok[i])
    rhythm_ok = sum(1 for i in counted if counted[i] and r_ok[i])

    # broken bars: more than half of a bar's notes wrong (or a one-note bar with a wrong note)
    use_rhythm = opts.rhythm_min > 0
    per_seq: dict[int, list[int]] = {}
    for i in range(i_lo, i_hi):
        if counted[i]:
            per_seq.setdefault(R[i]['seq'], []).append(i)
    broken = []
    if not opts.no_bar_check:
        for sq in sorted(set(per_seq) | set(extra_by_seq)):
            notes = per_seq.get(sq, [])
            nb = len(notes)
            err = sum(1 for i in notes if not p_ok[i] or (use_rhythm and not r_ok[i])) + extra_by_seq.get(sq, 0)
            if (nb >= 2 and 2 * err > nb) or (nb == 1 and not p_ok[notes[0]]):
                bar = R[notes[0]]['bar'] if notes else next(e['bar'] for e in events if e.get('seq') == sq)
                broken.append((sq, bar, err, nb))
    j_lo = min((u['j0'] for u in units), default=0)
    j_hi = max((u['j1'] for u in units), default=0)
    return {
        'al': al, 'units': units, 'events': events, 'T': T, 'D': Doff, 'jLo': j_lo, 'jHi': j_hi, 'iLo': i_lo, 'iHi': i_hi,
        'pitch': 100.0 * pitch_ok / denom, 'rhythm': 100.0 * rhythm_ok / denom,
        'pitchOk': pitch_ok, 'rhythmOk': rhythm_ok, 'denom': denom, 'nRef': i_hi - i_lo,
        'excusedMissing': sum(1 for e in events if e['type'] == 'missing' and e['excused']),
        'excusedExtra': sum(1 for e in events if e['type'] == 'extra' and e['excused']),
        'unexplainedExtra': unexplained,
        'splits': sum(1 for u in units if u['kind'] == 'split'), 'merges': sum(1 for u in units if u['kind'] == 'merge'),
        'octaves': [u for u in units if u['oct'] != 0 and u['kind'] != 'sub'],
        'octJumps': sum(1 for u in units if u.get('octJump')),
        'displaced': sum(1 for u in units if not u['onset_ok']), 'shifts': len(shift_at), 'broken': broken,
        'allowed': sorted(allow), 'outer': outer,
    }


def evaluate(R, S, k, scale, semi, opts, bar_q, allow, offset=None, semi_cand=False):
    al = Aligner(R, S, k, scale, semi, opts.tol, offset, semi_cand)
    score, ops = al.run()
    res = analyse(al, ops, opts, bar_q, semi, allow)
    res.update({'score': score, 'scale': scale, 'k': k, 'semiCand': semi_cand})
    return res


def choose_scale_candidates(R, S):
    """Candidate time ratios: the ones near the ratio of median note lengths, plus the usual ones."""
    def med(x):
        x = sorted(v for v in x if v > EPS)
        return x[len(x) // 2] if x else 1.0
    est = med(iois(R)) / max(EPS, med(iois(S)))
    cands = sorted(SCALES, key=lambda c: abs(math.log(float(c) / est)))
    keep = [c for c in cands if abs(math.log(float(c) / est)) <= math.log(2.2)][:5]
    # the usual notational ratios are always tried (median IOIs can mislead on short excerpts),
    # and the measured ratio itself when it is a simple fraction outside the list (e.g. 9/4)
    for c in (Fraction(1), Fraction(3, 2), Fraction(1, 2), Fraction(2), Fraction(3, 4), Fraction(2, 3)):
        if c not in keep:
            keep.append(c)
    fe = Fraction(est).limit_denominator(8)
    if fe > 0 and fe not in keep and abs(float(fe) - est) < 1e-3 * est:
        keep.append(fe)
    return keep


def compare(ref, cand, opts) -> dict:
    R, S = ref['notes'], cand['notes']
    if not R or not S:
        raise SystemExit('compare: empty reference or candidate')
    bar_q = ref.get('barQ') or 4.0
    allow = set()
    for a, b in parse_bars(opts.allow_bars) or []:
        allow.update(range(a, b + 1))
    semi = opts.locate or (not opts.global_ and not opts.ref_bars_given and len(R) > 1.5 * len(S) + 8)
    semi_cand = not semi and (opts.locate_cand or (not opts.global_ and len(S) > 1.5 * len(R) + 8))
    # 1) transposition by fast pitch-only DP
    if opts.shift is not None:
        ks = [opts.shift % 12]
    else:
        rp = [n['midi'] % 12 for n in R]
        scores = []
        for k in range(12):
            sp = [(n['midi'] - k) % 12 for n in S]
            sc_ = pitch_dp_score(sp, rp, True) if semi_cand else pitch_dp_score(rp, sp, semi)
            scores.append((sc_, k))
        scores.sort(reverse=True)
        ks = [scores[0][1]] + [k for s, k in scores[1:3] if s >= scores[0][0] - 2]
    # 2) time scale candidates
    scales = [Fraction(opts.scale)] if opts.scale else choose_scale_candidates(R, S)
    best = None
    # time scale with the best transposition, then the runner-up transpositions at that scale
    for sc in scales:
        res = evaluate(R, S, ks[0], sc, semi, opts, bar_q, allow, None, semi_cand)
        key = (res['pitch'] + res['rhythm'], res['score'])
        if best is None or key > best[0]:
            best = (key, res)
    for k in ks[1:]:
        res = evaluate(R, S, k, best[1]['scale'], semi, opts, bar_q, allow, None, semi_cand)
        key = (res['pitch'] + res['rhythm'], res['score'])
        if key > best[0]:
            best = (key, res)
    res = best[1]
    # 3) second pass anchored at the dominant offset (pairs notes by metric position)
    if res['units']:
        res2 = evaluate(R, S, res['k'], res['scale'], semi, opts, bar_q, allow, res['D'], semi_cand)
        if (res2['pitch'] + res2['rhythm']) >= (res['pitch'] + res['rhythm']) - 1e-9:
            res = res2
    res['semi'] = semi
    return res


# ---------------------------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------------------------


def fmt_bar_tokens(notes, on0, on1, scale=1.0, transpose=0):
    toks = []
    t = on0
    E = 1e-3
    for n in notes:
        on = n['on'] * scale
        if on < on0 - E or on >= on1 - E:
            continue
        if on > t + E:
            toks.append(f'r:{fq(round(on - t, 4))}')
        d = min(n['dur'] * scale, on1 - on)
        toks.append(f'{nm(n["midi"] - transpose)}:{fq(round(d, 4))}')
        t = on + d
    if t < on1 - E:
        toks.append(f'r:{fq(round(on1 - t, 4))}')
    return ' '.join(toks)


def verdict(res, opts) -> tuple[bool, list[str]]:
    lab = bar_labels(res['al'].R)
    why = []
    if res['pitch'] < opts.pitch_min - 1e-9:
        why.append(f'pitch {res["pitch"]:.1f} % < {opts.pitch_min:g} %')
    if res['rhythm'] < opts.rhythm_min - 1e-9:
        why.append(f'rhythm {res["rhythm"]:.1f} % < {opts.rhythm_min:g} %')
    if res['broken']:
        why.append('broken bar' + ('s' if len(res['broken']) > 1 else '') + ' ' + ', '.join(lab.get(b[0], str(b[1])) for b in res['broken']))
    return not why, why


def report(ref, cand, res, opts) -> tuple[str, bool]:
    al = res['al']
    R, S = al.R, al.S
    T = res['T']
    SPELL['sharps'] = (ref.get('raw') or {}).get('keySignatureSharps')
    lab = bar_labels(R)
    lines = []
    lines.append(f'Reference: {ref["desc"]}')
    lines.append(f'           K:{ref.get("key")} M:{ref.get("meter")}, {len(R)} notes')
    lines.append(f'Candidate: {cand["desc"]}')
    lines.append(f'           {cand.get("key")}, {cand.get("meter")}, {len(S)} notes')
    if res['semi']:
        lo, hi = res['iLo'], res['iHi'] - 1
        if hi >= lo:
            lines.append(f'Located:   candidate matches reference bars {R[lo]["bar"]}..{R[hi]["bar"]} ({res["nRef"]} ref notes)')
    if res.get('semiCand') and res['units']:
        cb0 = cand['barLabel'](S[res['jLo']])
        cb1 = cand['barLabel'](S[res['jHi'] - 1])
        lines.append(f'Located:   reference found in candidate bars {cb0}..{cb1} (candidate notes outside are ignored; --global to count them)')
    tr = f'{T:+d} semitones' if T else 'none (same pitch)'
    lines.append(f'Transposition: candidate = reference {tr}')
    unit = 'beat' if cand['unit'] == 'beat' else 'quarter'
    lines.append(f'Time scale: 1 candidate {unit} = {fq(float(res["scale"]))} reference quarter(s)')
    if res['octaves']:
        oc = Counter()
        for u in res['octaves']:
            oc[R[u['i0']]['bar']] += 1
        lines.append(f'Octave displacements: {len(res["octaves"])} note(s) in ref bars ' + ', '.join(f'{b}' for b in sorted(oc)) +
                     (' (counted as wrong: --strict-octave)' if opts.strict_octave else
                      ' (phrases of 3+ notes accepted; --strict-octave to count them' +
                      (f'; {res["octJumps"]} isolated note(s) counted as wrong' if res['octJumps'] else '') + ')'))
    else:
        lines.append('Octave displacements: none')
    lines.append(f'Tolerated: {res["excusedExtra"]} ornament/passing note(s) in candidate, {res["excusedMissing"]} ornamental ref note(s) skipped, '
                 f'{res["splits"]} repeated-note split(s)')
    if res['allowed']:
        lines.append(f'Allowed (not scored): ref bars {opts.allow_bars}')
    ok, why = verdict(res, opts)
    lines.append(f'PITCH  match: {res["pitch"]:5.1f} %  ({res["pitchOk"]}/{res["denom"]})   threshold {opts.pitch_min:g} %')
    lines.append(f'RHYTHM match: {res["rhythm"]:5.1f} %  ({res["rhythmOk"]}/{res["denom"]})   threshold {opts.rhythm_min:g} %')
    if res['unexplainedExtra']:
        lines.append(f'  ({res["unexplainedExtra"]} extra candidate note(s) not explained as ornaments are in the denominator)')
    if res['pitch'] >= 80 and res['rhythm'] < 40 and not opts.scale:
        lines.append('  (pitches agree but almost no onsets do: the note values may relate by an unusual ratio; try --scale, e.g. --scale 9/4)')
    if res['displaced']:
        lines.append(f'  ({res["displaced"]} note(s) displaced from the dominant time offset' +
                     ('' if opts.resync else '; if a phrase was shifted on purpose (held fermata, inserted bar) use --resync or compare the parts separately') + ')')
    if res['shifts']:
        lines.append(f'  ({res["shifts"]} timing shift(s) re-anchored by --resync, one rhythm error each)')
    for side, cnt in sorted(res['outer'].items()):
        js = [e['j'] for e in res['events'] if e['type'] == 'extra' and e.get('outer') == side]
        lines.append(f'  ({cnt} extra candidate note(s) {side} the aligned span, cand bars {cand["barLabel"](S[min(js)])}..{cand["barLabel"](S[max(js)])}: '
                     'trim the song side with --bars / --section, or widen --ref-bars)')
    if not opts.no_bar_check:
        lines.append('Broken bars: ' + (', '.join(f'{lab.get(sq, b)} ({e} of {n} wrong)' for sq, b, e, n in res['broken']) if res['broken'] else 'none') +
                     '   (more than half of a bar wrong fails the check; --allow-bars for intended changes)')

    # per ref bar issues, keyed by the bar's position in the selection (seq)
    issues: dict = {}

    def add(sq, msg):
        issues.setdefault(sq, []).append(msg)

    cb = cand['barLabel']
    allow = set(res['allowed'])
    tag = lambda i: ' (allowed)' if R[i]['bar'] in allow else ''
    for u in res['units']:
        rn = R[u['i0']]
        sn = S[u['j0']]
        sq = rn['seq']
        where = f'cand bar {cb(sn)}'
        a = tag(u['i0'])
        if u['kind'] == 'sub':
            add(sq, f'wrong note: ref {nm(rn["midi"])} -> cand {nm(sn["midi"] - T)}' + (f' (sounding {nm(sn["midi"])})' if T else '') + f' [{where}]{a}')
        elif u.get('octJump'):
            add(sq, f'octave jump: ref {nm(rn["midi"])} -> cand {nm(sn["midi"] - T)} ({u["oct"]:+d} oct, an isolated note out of the line) [{where}]{a}')
        elif not u['pitch']:
            add(sq, f'octave: ref {nm(rn["midi"])} -> cand {nm(sn["midi"] - T)} ({u["oct"]:+d} oct) [{where}]{a}')
        if u['shift'] is not None:
            add(sq, f'rhythm: timing shift, from {nm(rn["midi"])} on the candidate is {fq(abs(u["shift"]))}q {"later" if u["shift"] > 0 else "earlier"} '
                    f'(re-anchored by --resync) [{where}]{a}')
        elif not u['onset_ok']:
            add(sq, f'rhythm: {nm(rn["midi"])} starts {fq(abs(u["dev"]))}q {"late" if u["dev"] > 0 else "early"} [{where}]{a}')
        elif not u['ioi_ok']:
            add(sq, f'rhythm: {nm(rn["midi"])} lasts {fq(u["ds"])}q to the next aligned note, {fq(u["dr"])}q in ref [{where}]{a}')
        if u['kind'] == 'merge':
            add(sq, f'rhythm: merged, ref {" ".join(nm(R[i]["midi"]) for i in range(u["i0"], u["i1"]))} ({u["nref"]} onsets) played as one note '
                    f'(only the first onset counts) [{where}]{a}')
        if opts.verbose and u['kind'] == 'split':
            add(sq, f'(ok) split: ref {nm(rn["midi"])} ~ cand {" ".join(nm(S[j]["midi"] - T) for j in range(u["j0"], u["j1"]))} [{where}]')
        if opts.verbose and u['pitch'] and u['oct']:
            add(sq, f'(ok) octave: ref {nm(rn["midi"])} -> cand {u["oct"]:+d} oct [{where}]')
    for e in res['events']:
        if e['type'] == 'missing':
            rn = R[e['i']]
            near = S[min(e['j'], len(S) - 1)] if S else None
            msg = f'missing: ref {nm(rn["midi"])} ({fq(rn["dur"])}q) not in candidate' + (f' [near cand bar {cb(near)}]' if near else '')
            if e['excused']:
                if opts.verbose:
                    add(rn['seq'], '(ok, ornament) ' + msg)
            else:
                add(rn['seq'], msg + tag(e['i']))
        else:
            sn = S[e['j']]
            if 'seq' in e:
                sq = e['seq']
            else:
                k = e['unit'] if 'unit' in e else None
                sq = R[res['units'][k]['i0']]['seq'] if k is not None else R[min(max(e['i'] - 1, 0), len(R) - 1)]['seq']
            msg = f'extra: cand {nm(sn["midi"] - T)} ({fq(sn["dur"] * al.r)}q) not in reference [cand bar {cb(sn)}]'
            if e['excused']:
                if opts.verbose:
                    add(sq, '(ok, ornament/passing) ' + msg)
            else:
                add(sq, msg + (' (allowed)' if e.get('bar') in allow else ''))
    if issues:
        lines.append('')
        lines.append('Bar-by-bar differences (ref bar numbers as in `abc2notes.py --text`; candidate pitches shown transposed into the reference key,')
        lines.append('the cand line shows what the candidate plays in the same time span):')
        bars_ref = ref.get('bars') or {}
        bar_of_seq = {}
        for n in R:
            bar_of_seq.setdefault(n['seq'], n['bar'])
        exp_of_seq = {}
        for u in res['units']:
            exp_of_seq.setdefault(R[u['i0']]['seq'], u['exp'])
        order = sorted(issues)
        for shown, sq in enumerate(order):
            if shown >= opts.max_bars:
                lines.append(f'  ... {len(order) - shown} more bar(s) with differences (use --max-bars)')
                break
            lines.append(f'  ref bar {lab.get(sq, bar_of_seq.get(sq, "?"))}:')
            if sq in bars_ref:
                st, ln, _ = bars_ref[sq]
                lines.append(f'      ref : {fmt_bar_tokens(R, st, st + ln)}')
                off = exp_of_seq.get(sq, res['D'])
                lines.append(f'      cand: {fmt_bar_tokens(S, st + off, st + ln + off, al.r, T)}')
            for msg in issues[sq]:
                lines.append(f'      - {msg}')
    lines.append('')
    lines.append('RESULT: ' + ('PASS' if ok else 'FAIL') + f'  (pitch {res["pitch"]:.1f} % / rhythm {res["rhythm"]:.1f} %' +
                 ('' if ok else '; ' + '; '.join(why)) + ')')
    return '\n'.join(lines), ok


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--abc', required=True)
    ap.add_argument('--tune')
    ap.add_argument('--title')
    ap.add_argument('--voice')
    ap.add_argument('--expand-repeats', action='store_true')
    ap.add_argument('--ref-bars')
    ap.add_argument('--song')
    ap.add_argument('--song-file')
    ap.add_argument('--export')
    ap.add_argument('--channel')
    ap.add_argument('--section')
    ap.add_argument('--bars')
    ap.add_argument('--cand-abc')
    ap.add_argument('--cand-tune')
    ap.add_argument('--cand-title')
    ap.add_argument('--cand-voice')
    ap.add_argument('--cand-expand-repeats', action='store_true')
    ap.add_argument('--cand-bars')
    ap.add_argument('--pitch-min', type=float, default=95.0)
    ap.add_argument('--rhythm-min', type=float, default=90.0)
    ap.add_argument('--allow-bars', help='reference bars changed on purpose: listed, but not scored and not bar-checked (e.g. "53" or "52-53")')
    ap.add_argument('--no-bar-check', action='store_true', help='do not fail on broken bars (more than half of a bar wrong)')
    ap.add_argument('--resync', action='store_true', help='re-anchor the timing after a deliberate shift (held fermata, inserted bar); one error per shift')
    ap.add_argument('--shift', type=int, help='force the transposition (semitones, mod 12 used for matching)')
    ap.add_argument('--scale', help='force the time ratio: 1 candidate beat = SCALE reference quarters (e.g. 3/2)')
    ap.add_argument('--strict-octave', action='store_true')
    ap.add_argument('--locate', action='store_true', help='find the excerpt inside a longer reference')
    ap.add_argument('--locate-cand', action='store_true', help='find the reference inside a longer candidate')
    ap.add_argument('--global', dest='global_', action='store_true', help='always align end to end')
    ap.add_argument('--tol', type=float, default=0.02, help='rhythm tolerance in reference quarters (default 0.02)')
    ap.add_argument('--json', action='store_true')
    ap.add_argument('--verbose', '-v', action='store_true')
    ap.add_argument('--max-bars', type=int, default=40)
    a = ap.parse_args(argv)
    a.ref_bars_given = bool(a.ref_bars)
    try:
        if a.allow_bars:
            parse_bars(a.allow_bars)
        ref = load_abc_side(a.abc, a.tune, a.title, a.voice, a.expand_repeats, a.ref_bars)
        if a.cand_abc:
            cand = load_abc_side(a.cand_abc, a.cand_tune, a.cand_title, a.cand_voice, a.cand_expand_repeats, a.cand_bars)
            cand['unit'] = 'q'
        else:
            if not (a.song or a.song_file) or not a.channel:
                ap.error('give --song ID (or --song-file F.ts) and --channel CH, or --cand-abc FILE')
            cand = load_song_side(a.song, a.song_file, a.export, a.channel, a.section, a.bars)
        res = compare(ref, cand, a)
    except (ValueError, OSError) as e:
        print(f'compare: {e}', file=sys.stderr)
        return 2
    except SystemExit as e:
        if isinstance(e.code, str):
            print(e.code, file=sys.stderr)
            return 2
        raise
    text, ok = report(ref, cand, res, a)
    if a.json:
        R = ref['notes']
        out = {
            'pass': ok, 'pitch': round(res['pitch'], 2), 'rhythm': round(res['rhythm'], 2), 'transpose': res['T'],
            'scale': str(res['scale']), 'octaveDisplacements': len(res['octaves']), 'located': res['semi'], 'locatedInCandidate': bool(res.get('semiCand')),
            'refBars': sorted({R[u['i0']]['bar'] for u in res['units']}),
            'brokenBars': [b for _, b, _, _ in res['broken']], 'displaced': res['displaced'], 'timingShifts': res['shifts'],
            'allowedBars': res['allowed'],
            'tolerated': {'extra': res['excusedExtra'], 'missing': res['excusedMissing'], 'split': res['splits']},
            'merged': res['merges'], 'unexplainedExtra': res['unexplainedExtra'], 'reference': ref['desc'], 'candidate': cand['desc'], 'report': text,
        }
        text = json.dumps(out, indent=1)
    try:
        print(text)
    except BrokenPipeError:
        pass
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
