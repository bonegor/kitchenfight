#!/usr/bin/env python3
"""
compare.py - prove that a song's melody is a faithful transcription of a reference (ABC).

Usage (PY=/home/user/.venv-audio/bin/python, run from the repo root):
  $PY scripts/music/compare.py --abc REF.abc [--tune X | --title SUBSTR] [--voice V]
        [--expand-repeats] [--ref-bars 37-44]
        (--song ID | --song-file scratch.ts [--export NAME]) --channel CH[,CH2]
        [--section NAME] [--bars 1-8]
        [--pitch-min 90] [--rhythm-min 80] [--shift N] [--scale R] [--strict-octave]
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
  * time-scale tolerant: song beats are scaled to reference quarter notes by the ratio (1/4 ...
    6, e.g. 3/2 for a 6/8 song against 6/8 eighths, x2 / x1/2 for doubled or halved values)
    that aligns best; rhythm is judged by onset distances between consecutive matched notes, so
    articulation (staccato, rests vs. held notes) and local slips don't cascade;
  * alignment = dynamic programming over (pitch, duration) tokens with: matches, wrong notes,
    missing / extra notes, split (one ref note played as repeated notes) and merged repeated
    notes; short notes next to longer ones (ornaments, passing tones) are excused on both sides;
  * when the reference is much longer than the song excerpt and no --ref-bars are given, the
    excerpt is located inside the reference (semi-global alignment; --locate / --global force);
    when the candidate is much longer than the reference, the reference is located inside the
    candidate (--locate-cand forces it) and candidate notes outside that span are ignored.
    Extra candidate notes before the first / after the last aligned note are never excused.

Scores: pitch % = ref notes matched in pitch / (ref notes - excused ornaments + unexplained extra
song notes); rhythm % = aligned ref notes with the right onset distance / same denominator.
Exit code 0 when pitch >= --pitch-min (90) and rhythm >= --rhythm-min (80); 1 = fail; 2 = error.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
from collections import Counter
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import abc2notes  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
EXPORT = os.path.join(HERE, 'export-song.mjs')
SCALES = [Fraction(1, 6), Fraction(1, 4), Fraction(1, 3), Fraction(3, 8), Fraction(1, 2), Fraction(2, 3), Fraction(3, 4), Fraction(1),
          Fraction(4, 3), Fraction(3, 2), Fraction(2), Fraction(8, 3), Fraction(3), Fraction(4), Fraction(6)]
NAMES = abc2notes.COMMON_NAMES
EPS = 1e-4  # time comparisons, in reference quarter notes


def nm(m: int) -> str:
    return f'{NAMES[m % 12]}{m // 12 - 1}'


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
    return {'notes': notes, 'desc': desc, 'unit': 'q', 'meter': ref['meter'], 'key': ref['keyField'], 'bars': bar_len,
            'barLabel': lambda n: f'{n["bar"]}', 'raw': ref, 'kind': 'abc'}


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
    def __init__(self, R, S, shift_pc, scale, semiglobal, tol, offset=None, semi_cand=False):
        self.R, self.S = R, S
        self.semi_cand = semi_cand  # free leading/trailing candidate notes (excerpt inside a long candidate)
        self.offset = offset  # expected (cand onset - ref onset); None = ignore timing
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
        L = self.rlen
        nb = max(L[i - 1] if i > 0 else 0, L[i + 1] if i + 1 < len(L) else 0)
        return L[i] <= 0.5 + EPS and L[i] <= 0.5 * nb + EPS

    def orn_song(self, j):
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

        def tb(i0, j0):  # bonus for a time-consistent anchor (second pass only)
            return 0.45 if off is not None and abs(son[j0] - ron[i0] - off) <= tol else 0.0

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
                    best = Dp[j - 1] - 1.0
                    bm = ('sub', 1, 1, False)
                v = Dp[j] + dcost[ri]
                if v > best:
                    best, bm = v, ('del', 1, 0, orn_r[ri])
                # extra candidate note: excused when ornamental in its own line, or when it
                # subdivides the longer ref note just consumed and moves stepwise (passing tone)
                exc = orn_s[sj] or (sl[sj] <= 0.5 * rl[ri] + EPS and step_s[sj])
                v = Di[j - 1] + (-0.35 if exc else -1.2)
                if v > best:
                    best, bm = v, ('ins', 0, 1, exc)
                # split: one ref note <- k song notes of the same pitch class
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
        return score, ops, end_i, orn_r, orn_s


def analyse_ops(al: Aligner, ops, orn_r, orn_s, strict_octave: bool):
    R, S = al.R, al.S
    units = []  # aligned units in order
    events = []  # diff events
    dels, inss = [], []

    def flush():
        # a missing ref note next to an extra candidate note is a wrong note, never two excused
        # ornaments: pair them up in order
        for d, ins in zip(dels, inss):
            units.append({'kind': 'sub', 'i0': d[0], 'i1': d[0] + 1, 'j0': ins[1], 'j1': ins[1] + 1})
        for i0, j0, exc in dels[len(inss):]:
            events.append({'type': 'missing', 'i': i0, 'j': j0, 'excused': exc})
        for i0, j0, exc in inss[len(dels):]:
            events.append({'type': 'extra', 'i': i0, 'j': j0, 'excused': exc})
        dels.clear()
        inss.clear()

    aligned = [k for k, op in enumerate(ops) if op[0] in ('match', 'sub', 'split', 'merge')]
    first_a = aligned[0] if aligned else len(ops)
    last_a = aligned[-1] if aligned else -1
    for k, (kind, i0, i1, j0, j1, exc) in enumerate(ops):
        if kind in ('match', 'sub', 'split', 'merge'):
            flush()
            units.append({'kind': kind, 'i0': i0, 'i1': i1, 'j0': j0, 'j1': j1})
        elif kind == 'del':
            dels.append((i0, j0, exc))
        elif kind == 'ins':
            # only notes between aligned notes can be ornaments / passing tones
            inss.append((i0, j0, exc and first_a < k < last_a))
    flush()
    # global transposition from matched units
    diffs = Counter()
    for u in units:
        if u['kind'] != 'sub':
            diffs[S[u['j0']]['midi'] - R[u['i0']]['midi']] += 1
    T = diffs.most_common(1)[0][0] if diffs else al.k
    # rhythm by onset distance between consecutive units
    prev = None
    for u in units:
        ro = al.ron[u['i0']]
        so = al.son[u['j0']]
        u['rhythm'] = True
        if prev is not None:
            dr = ro - al.ron[prev['i0']]
            ds = so - al.son[prev['j0']]
            if abs(dr - ds) > al.tol:
                u['rhythm'] = False
                u['dr'], u['ds'] = dr, ds
        prev = u
        u['nref'] = u['i1'] - u['i0']
        d = S[u['j0']]['midi'] - R[u['i0']]['midi']
        u['oct'] = (d - T) // 12 if u['kind'] != 'sub' and (d - T) % 12 == 0 else 0
        u['pitch'] = u['kind'] != 'sub' and not (strict_octave and u['oct'] != 0)
    return units, events, T


def evaluate(R, S, k, scale, semi, strict_octave, tol, offset=None, semi_cand=False):
    al = Aligner(R, S, k, scale, semi, tol, offset, semi_cand)
    score, ops, end_i, orn_r, orn_s = al.run()
    units, events, T = analyse_ops(al, ops, orn_r, orn_s, strict_octave)
    covered_i = [u for u in units]
    if semi and covered_i:
        i_lo = min(u['i0'] for u in units)
        i_hi = max(u['i1'] for u in units)
    else:
        i_lo, i_hi = 0, len(R)
    # in semi-global mode only ref notes inside the located span count
    ev_in = [e for e in events if not (e['type'] == 'missing' and not (i_lo <= e['i'] < i_hi))]
    excused_missing = sum(1 for e in ev_in if e['type'] == 'missing' and e['excused'])
    unexplained_extra = sum(1 for e in ev_in if e['type'] == 'extra' and not e['excused'])
    n_ref = i_hi - i_lo
    denom = max(1, n_ref - excused_missing + unexplained_extra)
    pitch_ok = sum(u['nref'] for u in units if u['pitch'])
    rhythm_ok = sum(u['nref'] for u in units if u['rhythm'])
    j_lo = min((u['j0'] for u in units), default=0)
    j_hi = max((u['j1'] for u in units), default=0)
    return {
        'al': al, 'score': score, 'units': units, 'events': ev_in, 'T': T, 'scale': scale, 'k': k, 'jLo': j_lo, 'jHi': j_hi,
        'semiCand': semi_cand,
        'pitch': 100.0 * pitch_ok / denom, 'rhythm': 100.0 * rhythm_ok / denom,
        'pitchOk': pitch_ok, 'rhythmOk': rhythm_ok, 'denom': denom, 'nRef': n_ref, 'iLo': i_lo, 'iHi': i_hi,
        'excusedMissing': excused_missing, 'excusedExtra': sum(1 for e in ev_in if e['type'] == 'extra' and e['excused']),
        'unexplainedExtra': unexplained_extra,
        'splits': sum(1 for u in units if u['kind'] == 'split'), 'merges': sum(1 for u in units if u['kind'] == 'merge'),
        'octaves': [u for u in units if u['oct'] != 0 and u['kind'] != 'sub'],
    }


def choose_scale_candidates(R, S, k, semi):
    """Estimate the time ratio from the pitch-only alignment, return candidate ratios."""
    # crude estimate: median IOI ratio over notes of equal pitch-class sequences is fragile; use
    # total-duration ratio and the IOI medians, then keep candidates within a factor 2.2
    def med(x):
        x = sorted(v for v in x if v > EPS)
        return x[len(x) // 2] if x else 1.0
    est = med(iois(R)) / max(EPS, med(iois(S)))
    cands = sorted(SCALES, key=lambda c: abs(math.log(float(c) / est)))
    keep = [c for c in cands if abs(math.log(float(c) / est)) <= math.log(2.2)][:5]
    # the usual notational ratios are always tried (median IOIs can mislead on short excerpts)
    for c in (Fraction(1), Fraction(3, 2), Fraction(1, 2), Fraction(2), Fraction(3, 4), Fraction(2, 3)):
        if c not in keep:
            keep.append(c)
    return keep


def compare(ref, cand, opts) -> dict:
    R, S = ref['notes'], cand['notes']
    if not R or not S:
        raise SystemExit('compare: empty reference or candidate')
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
    if opts.scale:
        scales = [Fraction(opts.scale)]
    else:
        scales = choose_scale_candidates(R, S, ks[0], semi)
    best = None
    # time scale with the best transposition, then the runner-up transpositions at that scale
    for sc in scales:
        res = evaluate(R, S, ks[0], sc, semi, opts.strict_octave, opts.tol, None, semi_cand)
        key = (res['pitch'] + res['rhythm'], res['score'])
        if best is None or key > best[0]:
            best = (key, res)
    for k in ks[1:]:
        res = evaluate(R, S, k, best[1]['scale'], semi, opts.strict_octave, opts.tol, None, semi_cand)
        key = (res['pitch'] + res['rhythm'], res['score'])
        if key > best[0]:
            best = (key, res)
    res = best[1]
    # second pass: prefer anchors that keep the dominant time offset (stops ornaments or
    # octave-displaced repeats from stealing the alignment)
    al = res['al']
    offs = sorted(round(al.son[u['j0']] - al.ron[u['i0']], 4) for u in res['units'] if u['kind'] != 'sub')
    if offs:
        mode = Counter(offs).most_common(1)[0][0]
        res2 = evaluate(R, S, res['k'], res['scale'], semi, opts.strict_octave, opts.tol, mode, semi_cand)
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


def report(ref, cand, res, opts) -> tuple[str, bool]:
    al = res['al']
    R, S = al.R, al.S
    T = res['T']
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
                     (' (counted as wrong: --strict-octave)' if opts.strict_octave else ' (accepted; --strict-octave to count them)'))
    else:
        lines.append('Octave displacements: none')
    lines.append(f'Tolerated: {res["excusedExtra"]} ornament/passing note(s) in candidate, {res["excusedMissing"]} ornamental ref note(s) skipped, '
                 f'{res["splits"]} split + {res["merges"]} merged repeated note(s)')
    ok = res['pitch'] >= opts.pitch_min - 1e-9 and res['rhythm'] >= opts.rhythm_min - 1e-9
    lines.append(f'PITCH  match: {res["pitch"]:5.1f} %  ({res["pitchOk"]}/{res["denom"]})   threshold {opts.pitch_min:g} %')
    lines.append(f'RHYTHM match: {res["rhythm"]:5.1f} %  ({res["rhythmOk"]}/{res["denom"]})   threshold {opts.rhythm_min:g} %')
    if res['unexplainedExtra']:
        lines.append(f'  ({res["unexplainedExtra"]} extra candidate note(s) not explained as ornaments are in the denominator)')

    # per ref bar issues
    issues: dict = {}
    order_bars = []

    def add(rb, msg):
        if rb not in issues:
            issues[rb] = []
            order_bars.append(rb)
        issues[rb].append(msg)

    cb = cand['barLabel']
    for u in res['units']:
        rn = R[u['i0']]
        sn = S[u['j0']]
        where = f'cand bar {cb(sn)}'
        if u['kind'] == 'sub':
            add(rn['bar'], f'wrong note: ref {nm(rn["midi"])} -> cand {nm(sn["midi"] - T)}' + (f' (sounding {nm(sn["midi"])})' if T else '') + f' [{where}]')
        elif not u['pitch']:
            add(rn['bar'], f'octave: ref {nm(rn["midi"])} -> cand {nm(sn["midi"] - T)} ({u["oct"]:+d} oct) [{where}]')
        if not u['rhythm']:
            add(rn['bar'], f'rhythm: {nm(rn["midi"])} starts {fq(u["dr"])}q after the previous match in ref, {fq(u["ds"])}q in cand [{where}]')
        if opts.verbose and u['kind'] in ('split', 'merge'):
            add(rn['bar'], f'(ok) {u["kind"]}: ref {" ".join(nm(R[i]["midi"]) for i in range(u["i0"], u["i1"]))} ~ cand {" ".join(nm(S[j]["midi"] - T) for j in range(u["j0"], u["j1"]))} [{where}]')
        if opts.verbose and u['pitch'] and u['oct']:
            add(rn['bar'], f'(ok) octave: ref {nm(rn["midi"])} -> cand {u["oct"]:+d} oct [{where}]')
    for e in res['events']:
        if e['type'] == 'missing':
            rn = R[e['i']]
            near = S[min(e['j'], len(S) - 1)] if S else None
            msg = f'missing: ref {nm(rn["midi"])} ({fq(rn["dur"])}q) not in candidate' + (f' [near cand bar {cb(near)}]' if near else '')
            if e['excused']:
                if opts.verbose:
                    add(rn['bar'], '(ok, ornament) ' + msg)
            else:
                add(rn['bar'], msg)
        else:
            sn = S[e['j']]
            rb = R[min(max(e['i'] - 1, 0), len(R) - 1)]['bar']
            msg = f'extra: cand {nm(sn["midi"] - T)} ({fq(sn["dur"] * al.r)}q) not in reference [cand bar {cb(sn)}]'
            if e['excused']:
                if opts.verbose:
                    add(rb, '(ok, ornament/passing) ' + msg)
            else:
                add(rb, msg)
    if order_bars:
        lines.append('')
        lines.append('Bar-by-bar differences (ref bar numbers as in `abc2notes.py --text`; candidate pitches shown transposed into the reference key):')
        bars_ref = ref.get('bars') or {}
        shown = 0
        seq_of_bar = {}
        for n in R:
            seq_of_bar.setdefault(n['bar'], n['seq'])
        # map ref bar -> aligned candidate span for the side-by-side view
        for rb in order_bars:
            if shown >= opts.max_bars:
                lines.append(f'  ... {len(order_bars) - shown} more bar(s) with differences (use --max-bars)')
                break
            shown += 1
            msgs = issues[rb]
            lines.append(f'  ref bar {rb}:')
            sq = seq_of_bar.get(rb)
            if sq in bars_ref:
                st, ln, _ = bars_ref[sq]
                lines.append(f'      ref : {fmt_bar_tokens(R, st, st + ln)}')
                # candidate notes aligned into this bar's time span (via the unit anchors)
                anchors = [u for u in res['units'] if R[u['i0']]['seq'] == sq]
                if anchors:
                    a = anchors[0]
                    off = al.son[a['j0']] - al.ron[a['i0']]
                    lines.append(f'      cand: {fmt_bar_tokens(S, st + off, st + ln + off, al.r, T)}')
            for msg in msgs:
                lines.append(f'      - {msg}')
    lines.append('')
    lines.append('RESULT: ' + ('PASS' if ok else 'FAIL') + f'  (pitch {res["pitch"]:.1f} % / rhythm {res["rhythm"]:.1f} %)')
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
    ap.add_argument('--pitch-min', type=float, default=90.0)
    ap.add_argument('--rhythm-min', type=float, default=80.0)
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
        ref = load_abc_side(a.abc, a.tune, a.title, a.voice, a.expand_repeats, a.ref_bars)
        if a.cand_abc:
            cand = load_abc_side(a.cand_abc, a.cand_tune, a.cand_title, a.cand_voice, a.cand_expand_repeats, a.cand_bars)
            cand['unit'] = 'q'
        else:
            if not (a.song or a.song_file) or not a.channel:
                ap.error('give --song ID (or --song-file F.ts) and --channel CH, or --cand-abc FILE')
            cand = load_song_side(a.song, a.song_file, a.export, a.channel, a.section, a.bars)
        res = compare(ref, cand, a)
    except SystemExit as e:
        if isinstance(e.code, str):
            print(e.code, file=sys.stderr)
            return 2
        raise
    text, ok = report(ref, cand, res, a)
    if a.json:
        out = {
            'pass': ok, 'pitch': round(res['pitch'], 2), 'rhythm': round(res['rhythm'], 2), 'transpose': res['T'],
            'scale': str(res['scale']), 'octaveDisplacements': len(res['octaves']), 'located': res['semi'], 'locatedInCandidate': bool(res.get('semiCand')),
            'refBars': [al_bar for al_bar in sorted({ref['notes'][u['i0']]['bar'] for u in res['units']})],
            'tolerated': {'extra': res['excusedExtra'], 'missing': res['excusedMissing'], 'split': res['splits'], 'merge': res['merges']},
            'unexplainedExtra': res['unexplainedExtra'], 'reference': ref['desc'], 'candidate': cand['desc'], 'report': text,
        }
        text = json.dumps(out, indent=1)
    try:
        print(text)
    except BrokenPipeError:
        pass
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
