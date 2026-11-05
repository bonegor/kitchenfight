#!/usr/bin/env python3
"""
Tuning check for the recorded SFX (Audio 2.0): every layer of build_sfx.DESIGN that is tuned to a note (`note=`)
is rendered on its own and its pitch is measured with an
estimator independent of the one used for tuning: a harmonic-comb fit (the f0 that maximises the summed spectral
magnitude at f0, 2f0 ... 6f0, refined on a 0.1-cent grid). Glockenspiel layers (inharmonic, strong fundamental)
use the fundamental's interpolated spectral peak. Prints the deviation in cents from equal temperament (A4 = 440).

    /home/user/.venv-audio/bin/python -I scripts/audio/sfx_tuning_check.py [--cache DIR]
"""
import argparse
import math
import os
import sys

import numpy as np

sys.dont_write_bytecode = True  # no __pycache__ next to the scripts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_sfx as B  # noqa: E402


def spectrum(y: np.ndarray, t0: float = 0.03, dur: float = 0.25):
    m = y.mean(axis=1)
    on = int(np.argmax(np.abs(m) > np.abs(m).max() * 0.1))
    seg = m[on + int(t0 * B.SR): on + int((t0 + dur) * B.SR)]
    N = 1 << 18
    F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), N))
    return F, B.SR / N


def comb_f0(y: np.ndarray, expect: float, harmonics: int = 6) -> float:
    F, df = spectrum(y)
    best, bf = -1.0, expect
    for cents in np.arange(-60, 60.01, 0.1):
        f = expect * 2 ** (cents / 1200)
        s = 0.0
        for h in range(1, harmonics + 1):
            k = f * h / df
            i = int(k)
            if i + 1 >= len(F):
                break
            s += (F[i] * (i + 1 - k) + F[i + 1] * (k - i)) / h
        if s > best:
            best, bf = s, f
    return bf


def peak_f0(y: np.ndarray, expect: float) -> float:
    F, df = spectrum(y)
    lo, hi = int(expect / 1.06 / df), int(expect * 1.06 / df)
    i = lo + int(np.argmax(F[lo:hi]))
    y0, y1, y2 = (math.log(F[i + k] + 1e-12) for k in (-1, 0, 1))
    return (i + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)) * df


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default=B.Src.cache)
    a = ap.parse_args()
    B.Src.cache = a.cache
    design = B.build_design()
    rows = []
    seen = set()
    for sid, d in design.items():
        for v in d.variants:
            for ly in v.layers:
                if ly.note is None:
                    continue
                key = (ly.src, ly.note, ly.semis, ly.rate)
                if key in seen:
                    continue
                seen.add(key)
                target = ly.note
                solo = B.Layer(**{**ly.__dict__, 'at': 0.0, 'gain': 0.0, 'tau': None, 'env': None, 'pan': 0.0})
                y = B.render_layer(solo, stereo=False)
                expect = B.mtof(target)
                f = peak_f0(y, expect) if 'Glockenspiel' in ly.src else comb_f0(y, expect)
                cents = 1200 * math.log2(f / expect)
                rows.append((sid, ly.src.split('/')[-1], target, f, cents))
    print(f"{'id':16s} {'source':30s} {'note':>5s} {'target Hz':>10s} {'measured':>10s} {'cents':>7s}")
    for sid, src, t, f, c in rows:
        print(f'{sid:16s} {src:30s} {t:5.0f} {B.mtof(t):10.1f} {f:10.1f} {c:+7.1f}')
    worst = max(abs(r[4]) for r in rows)
    print(f'{len(rows)} pitched layers, worst deviation {worst:.1f} cents')


if __name__ == '__main__':
    main()
