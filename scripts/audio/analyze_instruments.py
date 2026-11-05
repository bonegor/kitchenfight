#!/usr/bin/env python3
"""
Measure the sampled instruments from test-pattern renders (scripts/audio/render-song.mjs --pattern).

Usage:
  node scripts/audio/render-song.mjs --pattern all --out OUT
  /home/user/.venv-audio/bin/python scripts/audio/analyze_instruments.py OUT [--json OUT/analysis.json]

Per note (exact start sample from the pattern JSON):
  tuning   measured pitch vs the requested (octave-folded) MIDI note, cents   (pitched only)
  onset    detected attack time vs the scheduled time, ms                      (same detector as the build)
  loudness K-weighted level of the note body; per instrument and velocity layer the spread
           across the range is reported as +-dB around the median
  clipping peak of the dry render (no master), dBFS
  release  click detector at note-off and at the end of the release: largest 2nd difference in the
           window relative to the 99.9th percentile of the preceding 150 ms (>= 4 = click)
  seams    same detector at every predicted loop-seam crossing of sustained / decaying notes
Limits (Audio 2.0 brief): |tuning| <= 5 cents, |onset| <= 3 ms, loudness +-2 dB, no clipping,
no clicks. Inharmonic instruments (chimes/timpani/bells) report tuning but are not graded on it.
"""
from __future__ import annotations

import argparse
import glob
import json
import math
import os
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from instrument_dsp import envelope, loudness, measure_pitch, onset_index, to_mono  # noqa: E402

INHARMONIC = {'bell', 'timp', 'tubularBell', 'timpani', 'orchHit'}
SLOW = {'strings', 'violin', 'cello', 'contrabass', 'choir', 'choirO', 'brassSoft', 'horn'}


def d2_spike(x: np.ndarray, at: int, half: int, ref: int) -> float:
    """Click metric at sample `at`: max |2nd difference| within +-half vs the 99.9th percentile of
    |2nd difference| over the `ref` samples before the window."""
    a0 = max(2, at - half)
    a1 = min(len(x) - 1, at + half)
    if a1 - a0 < 4:
        return 0.0
    d = np.abs(np.diff(x[max(0, a0 - ref - 2):a1], 2))
    win = d[-(a1 - a0):]
    pre = d[: max(1, len(d) - (a1 - a0))]
    base = float(np.percentile(pre, 99.9)) if len(pre) > 32 else float(np.max(pre) if len(pre) else 0)
    level = float(np.sqrt(np.mean(x[max(0, a0 - ref):a1] ** 2)))
    base = max(base, 1e-4 * max(level, 1e-3))
    return float(np.max(win)) / base


def analyze(path_json: str) -> dict:
    meta = json.load(open(path_json))
    sr, data = wavfile.read(path_json[:-5] + '.wav')
    x = data.astype(np.float64) / 32768.0
    if x.ndim > 1:
        x = x.T
    else:
        x = x[None, :]
    m = to_mono(x)
    iid = meta['id']
    kind = meta['kind']
    ring = meta['ring']
    gap = meta['gap']
    res = {'id': iid, 'kind': kind, 'notes': [], 'peak_db': 20 * math.log10(np.max(np.abs(x)) + 1e-12)}
    for n in meta['notes']:
        s = n['start']
        z = n['zone'] or {}
        unpitched = bool(meta.get('unpitched'))
        a = max(0, s - int(0.06 * sr))
        b = min(len(m), s + int((gap - 0.15) * sr))
        seg = x[:, a:b]
        # onset (same detector as the build)
        on = onset_index(seg, sr, slow=iid in SLOW) + a
        onset_ms = (on - s) * 1000 / sr
        rec = {'m': n['m'], 'folded': n['folded'], 'v': n['v'], 'vr': n['vr'], 'layer': n['layer'], 'onset_ms': round(onset_ms, 3)}
        # tuning
        if not unpitched:
            sustain = kind == 'sustain'
            w0 = s + int((0.35 if sustain else 0.05) * sr)
            w1 = s + int((1.0 if sustain else 0.4) * sr)
            pm = measure_pitch(x, sr, w0, min(w1, b), nominal_midi=n['folded'], harmonics=1)
            if pm is not None:
                rec['cents'] = round((pm - n['folded']) * 100, 2)
        # loudness of the body
        if kind == 'sustain':
            lu = loudness(x, sr, s + int(0.3 * sr), s + int(1.0 * sr))
        else:
            lu = loudness(x, sr, s, s + int(0.3 * sr))
        rec['lu'] = round(lu, 2)
        # release clicks: note-off and end of the release tail
        if not ring:
            off = s + int(n['dur'] * sr)
            rel_end = off + int(meta['release'] * 3.6 * sr)
            rec['click_off'] = round(d2_spike(m, off, int(0.004 * sr), int(0.15 * sr)), 2)
            rec['click_end'] = round(d2_spike(m, min(len(m) - 3, rel_end), int(0.004 * sr), int(0.15 * sr)), 2)
        # loop seams
        if z and 'ls' in z and 'le' in z and z.get('le', 0) - z.get('ls', 0) > 16:
            set_sr = n.get('set_sr') or 32000
            ratio = 2 ** ((n['folded'] - z['p']) / 12) if not unpitched else 1.0
            inc = ratio * set_sr / sr
            t_end = s + int((n['dur'] if not ring else gap - 0.2) * sr)
            first = s + (z['le'] - z['pre']) / inc
            L = (z['le'] - z['ls']) / inc
            worst = 0.0
            k = 0
            while first + k * L < t_end - 0.01 * sr and k < 40:
                at = int(round(first + k * L))
                if at > s + int(0.02 * sr):
                    worst = max(worst, d2_spike(m, at, int(0.002 * sr), int(0.1 * sr)))
                k += 1
            rec['seam'] = round(worst, 2)
            rec['seams_checked'] = k
        res['notes'].append(rec)
    return res


def summarize(r: dict) -> dict:
    notes = r['notes']
    cents = [abs(n['cents']) for n in notes if 'cents' in n]
    onsets = [abs(n['onset_ms']) for n in notes]
    out = {'id': r['id'], 'notes': len(notes), 'peak_db': round(r['peak_db'], 2),
           'cents_max': round(max(cents), 2) if cents else None,
           'cents_med': round(float(np.median(cents)), 2) if cents else None,
           'onset_max_ms': round(max(onsets), 2) if onsets else None,
           'onset_med_ms': round(float(np.median(onsets)), 2) if onsets else None}
    # loudness spread per layer over notes with vr == 0
    spreads = []
    for layer in sorted({n['layer'] for n in notes}):
        lus = [n['lu'] for n in notes if n['layer'] == layer and n['vr'] == 0 and n['lu'] > -90]
        if len(lus) >= 2:
            med = float(np.median(lus))
            spreads.append(max(abs(v - med) for v in lus))
    out['loud_pm_db'] = round(max(spreads), 2) if spreads else None
    clicks = [max(n.get('click_off', 0), n.get('click_end', 0)) for n in notes if 'click_off' in n]
    out['release_click_max'] = round(max(clicks), 2) if clicks else None
    seams = [n['seam'] for n in notes if 'seam' in n]
    out['seam_max'] = round(max(seams), 2) if seams else None
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('dir')
    ap.add_argument('--json', default='')
    ap.add_argument('--only', default='')
    args = ap.parse_args()
    files = sorted(glob.glob(os.path.join(args.dir, '*.json')))
    only = set(args.only.split(',')) if args.only else None
    rows = []
    full = []
    for f in files:
        if os.path.basename(f) == 'analysis.json':
            continue
        meta = json.load(open(f))
        if 'notes' not in meta or (only and meta['id'] not in only):
            continue
        r = analyze(f)
        full.append(r)
        rows.append(summarize(r))
    hdr = f"{'instrument':13s} {'notes':>5s} {'peak dB':>8s} {'|c| max':>8s} {'|c| med':>8s} {'onset max':>9s} {'onset med':>9s} {'loud +-dB':>9s} {'rel click':>9s} {'seam':>6s}"
    print(hdr)
    for o in rows:
        f = lambda v, w=8, p=2: (f'{v:{w}.{p}f}' if isinstance(v, (int, float)) else f"{'-':>{w}s}")
        print(f"{o['id']:13s} {o['notes']:5d} {f(o['peak_db'])} {f(o['cents_max'])} {f(o['cents_med'])} {f(o['onset_max_ms'], 9)} "
              f"{f(o['onset_med_ms'], 9)} {f(o['loud_pm_db'], 9)} {f(o['release_click_max'], 9)} {f(o['seam_max'], 6)}")
    if args.json:
        json.dump({'summary': rows, 'notes': full}, open(args.json, 'w'), indent=1)


if __name__ == '__main__':
    main()
