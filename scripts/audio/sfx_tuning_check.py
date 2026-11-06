#!/usr/bin/env python3
"""
Tuning, key and beating check for the recorded SFX (Audio 2.0), with estimators independent of the ones used for
tuning (build_sfx.f0_estimate):

1. layers tuned to a note (`note=`): pitch measured with a harmonic-comb fit (the f0 that maximises the summed spectral
   magnitude at f0 .. 6 f0, on a 0.1-cent grid); glockenspiel layers (inharmonic, strong fundamental) use the
   interpolated spectral peak of the fundamental. Deviation in cents from equal temperament (A4 = 440 Hz).
2. tonal layers without a note (`pitched=True`: orchestral stings, bells, hand chimes): their strongest partials.
3. musical ids (`key=`): every note, and every strong partial of an untuned tonal layer (bell, chime), must lie on
   the id's major scale (within 30 cents), and layers sounding together must not beat: two partials of different
   layers 6..60 Hz apart, both within 15 dB of the loudest (an audible wobble). A tuned note counts with its
   fundamental (beats between harmonics of two in-tune chord notes are inherent in equal temperament); a recorded
   piece of music that sets the key (`keyref`, e.g. an orchestral sting) counts with all its partials for beating.
4. ids with a synth layer: the strongest partials of the actual mix (decoded asset at its runtime gain + the
   synthesized layer, as the engine plays them), so the recorded and synthesized parts can be seen to agree.

    /home/user/.venv-audio/bin/python -I scripts/audio/sfx_tuning_check.py [--cache DIR]

Exit status 1 if a tuned layer is off by more than 10 cents, or a key / beating check fails.
"""
import argparse
import json
import math
import os
import sys

import numpy as np

sys.dont_write_bytecode = True  # no __pycache__ next to the scripts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_sfx as B  # noqa: E402

NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
MAJOR = (0, 2, 4, 5, 7, 9, 11)
KEY_TOL = 30.0      # cents from the nearest scale note
STRONG_DB = 15.0    # partials within this of the loudest one are checked
BEAT = (6.0, 60.0)  # Hz: partials of different layers this far apart beat audibly


def note_name(f: float) -> str:
    m = 69 + 12 * math.log2(f / 440)
    r = round(m)
    return f'{NAMES[r % 12]}{r // 12 - 1}{(m - r) * 100:+.0f}c'


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


def partials(y: np.ndarray, fmin: float = 120, fmax: float = 6000, rng: float = 30.0, t0: float = 0.02, dur: float = 0.6) -> list:
    """strongest spectral peaks (Hz, dB re the loudest) of a sound's sustained part"""
    m = y.mean(axis=1)
    on = int(np.argmax(np.abs(m) > np.abs(m).max() * 0.1))
    seg = m[on + int(t0 * B.SR): on + int((t0 + dur) * B.SR)]
    if len(seg) < 2048:
        seg = m[on:on + int(dur * B.SR)]
    N = 1 << 18
    F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), N))
    f = np.fft.rfftfreq(N, 1 / B.SR)
    band = np.nonzero((f >= fmin) & (f <= fmax))[0]
    idx = [i for i in band if F[i] > F[i - 1] and F[i] >= F[i + 1]]
    idx.sort(key=lambda i: -F[i])
    top = F[idx[0]] if idx else 1.0
    out = []
    for i in idx:
        lv = 20 * math.log10(F[i] / top + 1e-12)
        if lv < -rng:
            break
        y0, y1, y2 = (math.log(F[i + k] + 1e-12) for k in (-1, 0, 1))
        fr = (i + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)) * B.SR / N
        if any(abs(fr - p) < max(4.0, p * 0.004) for p, _ in out):
            continue  # side lobe / same partial
        out.append((fr, lv))
        if len(out) >= 12:
            break
    return out


def off_scale(f: float, key: str) -> float:
    """cents from the nearest note of the major scale on `key`"""
    tonic = NAMES.index(key)
    m = 69 + 12 * math.log2(f / 440)
    best = 99.0
    for st in MAJOR:
        pc = (tonic + st) % 12
        k = round((m - pc) / 12) * 12 + pc  # nearest MIDI note with this pitch class
        best = min(best, abs(m - k) * 100)
    return best


def solo(ly: B.Layer, stereo: bool = False) -> np.ndarray:
    """a layer rendered on its own at its designed level (placement and panning removed)"""
    return B.render_layer(B.Layer(**{**ly.__dict__, 'at': 0.0, 'pan': 0.0}), stereo)


def short(ly: B.Layer) -> str:
    return ly.src.split('/')[-1].split(':')[-1]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default=B.Src.cache)
    a = ap.parse_args()
    B.Src.cache = a.cache
    design = B.build_design()
    fail = []

    # 1. tuned layers
    rows, seen = [], set()
    for sid, d in design.items():
        for v in d.variants:
            for ly in v.layers:
                if ly.note is None:
                    continue
                key = (ly.src, ly.note, ly.semis, ly.rate)
                if key in seen:
                    continue
                seen.add(key)
                y = B.render_layer(B.Layer(**{**ly.__dict__, 'at': 0.0, 'gain': 0.0, 'tau': None, 'env': None, 'pan': 0.0, 'eq': ()}), stereo=False)
                expect = B.mtof(ly.note)
                f = peak_f0(y, expect) if 'Glockenspiel' in ly.src else comb_f0(y, expect)
                rows.append((sid, short(ly), ly.note, f, 1200 * math.log2(f / expect)))
    print('1. layers tuned to a note')
    print(f"   {'id':16s} {'source':30s} {'note':>6s} {'target Hz':>10s} {'measured':>10s} {'cents':>7s}")
    for sid, src, t, f, c in rows:
        print(f'   {sid:16s} {src:30s} {t:6.1f} {B.mtof(t):10.1f} {f:10.1f} {c:+7.1f}')
    worst = max(abs(r[4]) for r in rows)
    print(f'   {len(rows)} tuned layers, worst deviation {worst:.1f} cents')
    if worst > 10:
        fail.append(f'tuned layer off by {worst:.1f} cents')

    # 2. tonal layers without a note
    print('\n2. tonal layers without a note: strongest partials (Hz, note, dB re the loudest)')
    seen = set()
    for sid, d in design.items():
        for v in d.variants:
            for ly in v.layers:
                if not ly.pitched:
                    continue
                key = (ly.src, ly.semis, ly.rate, ly.eq)
                if key in seen:
                    continue
                seen.add(key)
                ps = partials(solo(ly), rng=STRONG_DB)
                print(f'   {sid:16s} {short(ly):36s} ' + '  '.join(f'{f:7.1f} {note_name(f):9s}{lv:+5.1f}' for f, lv in ps[:6]))

    # 3. key and beating per musical id
    print(f'\n3. key (major scale, {KEY_TOL:.0f} cents) and beating ({BEAT[0]:.0f}-{BEAT[1]:.0f} Hz between strong partials of simultaneous layers)')
    for sid, d in design.items():
        if not d.key:
            continue
        for k, v in enumerate(d.variants):
            name = sid if len(d.variants) == 1 else f'{sid}_{k + 1}'
            tonal = [ly for ly in v.layers if ly.note is not None or ly.pitched]
            items = []  # (layer, partials (Hz, absolute dB), start, end)
            for ly in tonal:
                y = solo(ly)
                lvl = 20 * math.log10(np.abs(y).max() + 1e-12)
                ps = partials(y, rng=STRONG_DB)
                if ly.note is not None:
                    # a tuned note counts with its fundamental (the strongest peak within 3 %; its tuning is checked in 1.)
                    f0 = B.mtof(ly.note)
                    near = [(f, lv) for f, lv in ps if abs(f - f0) < f0 * 0.03]
                    ps = [max(near, key=lambda p: p[1])] if near else [(f0, max((lv for _, lv in ps), default=0.0))]
                items.append((ly, [(f, lv + lvl) for f, lv in ps], ly.at, ly.at + len(y) / B.SR))
            top = max((lv for _, ps, _, _ in items for _, lv in ps), default=0.0)
            bad_key, beats = [], set()
            for ly, ps, _, _ in items:
                if ly.keyref:
                    continue  # it sets the key
                for f, lv in ps:
                    if lv < top - STRONG_DB:
                        continue
                    c = off_scale(f, d.key)
                    if c > KEY_TOL:
                        bad_key.append(f'{short(ly)} {f:.1f} Hz ({note_name(f)}, {c:.0f} c off the scale, {lv - top:+.1f} dB)')
            for i in range(len(items)):
                for j in range(i + 1, len(items)):
                    li, pi, ai, bi = items[i]
                    lj, pj, aj, bj = items[j]
                    if min(bi, bj) - max(ai, aj) < 0.1:
                        continue  # not sounding together
                    for fi, vi in pi:
                        for fj, vj in pj:
                            df = abs(fi - fj)
                            if BEAT[0] < df < BEAT[1] and min(vi, vj) > top - STRONG_DB:
                                beats.add(f'{fi:.1f} Hz ({short(li)}) vs {fj:.1f} Hz ({short(lj)}): {df:.1f} Hz, levels {vi - top:+.1f} / {vj - top:+.1f} dB')
            status = 'ok' if not bad_key and not beats else 'FAIL'
            print(f'   {name:16s} key {d.key:2s} {len(tonal):2d} tonal layers: {status}')
            for msg in bad_key:
                print('      off key:', msg)
            for msg in sorted(beats):
                print('      beating:', msg)
            if status != 'ok':
                fail.append(f'{name}: {len(bad_key)} off-key partials, {len(beats)} beating pairs')

    # 4. recorded + synth layer mixes
    man = json.load(open(os.path.join(B.OUT_DIR, 'manifest.json')))
    print('\n4. recording + synth layer as played (strongest partials of the mix, 15-200 ms)')
    for sid, d in design.items():
        if d.synth is None:
            continue
        m = man['ids'][sid]
        for k, (name, g) in enumerate(zip(m['v'], m['g'])):
            ch = man['assets'][name]['ch']
            dec = B.decode(os.path.join(B.OUT_DIR, name + '.mp3'), ch)
            mix = B.mix_played(dec * 10 ** (g / 20), B.Synth.pcm(sid, k % B.Synth.variants(sid)) * 10 ** (d.synth / 20))
            ps = partials(mix, fmin=80, fmax=12000, rng=20.0, t0=0.015, dur=0.185)
            print(f'   {name:18s} ' + '  '.join(f'{f:7.1f} {note_name(f):9s}{lv:+5.1f}' for f, lv in ps[:5]))

    print('\nRESULT:', 'all checks passed' if not fail else 'FAILED: ' + '; '.join(fail))
    sys.exit(1 if fail else 0)


if __name__ == '__main__':
    main()
