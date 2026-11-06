#!/usr/bin/env python3
"""
Loop-quality analysis of the renders made by scripts/audio/check_instrument_loops.mjs.

  /home/user/.venv-audio/bin/python scripts/audio/analyze_instrument_loops.py DIR [--json FILE]

Per looped zone (played at its own root, 8 s, dry):
  step    level step across the loop seam: |RMS after - RMS before| (dB) over max(20 ms, 3 periods)
          on each side, median over the seams; compared with the same measure at 49 other points
          of the loop cycle ("natural" level changes of the material). Graded: the seam must not
          be the loudest jump of the cycle by more than 1 dB (step - max_other <= 1 dB) and not
          exceed 3 dB when the material is smooth.
  flutter decaying loops: modulation of the (decay-detrended) 10 ms envelope at the loop rate:
          synchronous average over loop cycles, peak-to-peak dB, over the part of the tail that is
          above -40 dB of the note peak; compared with the same measure on the natural (pre-loop)
          part with the same period. Graded: <= max(3 dB, natural + 2 dB).
  tick    high-frequency (second-difference) energy in a 1 ms window at the seam vs the median of
          1 ms windows in the surrounding +-50 ms; graded: a seam is a tick when this exceeds 3x AND
          twice the same measure elsewhere in the loop (90th percentile of 49 other points: buzzy
          tones put their HF energy in one pulse per period).
"""
from __future__ import annotations

import argparse
import glob
import json
import math
import os

import numpy as np


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(x * x))) if len(x) else 0.0


def db(v: float) -> float:
    return 20 * math.log10(max(v, 1e-12))


def seam_step(x: np.ndarray, pos: float, w: int) -> float:
    i = int(round(pos))
    if i - w < 0 or i + w > len(x):
        return float('nan')
    return abs(db(rms(x[i:i + w])) - db(rms(x[i - w:i])))


def env_db(x: np.ndarray, sr: int, frame: float = 0.01) -> np.ndarray:
    n = int(frame * sr)
    k = len(x) // n
    e = np.sqrt(np.mean(x[:k * n].reshape(k, n) ** 2, axis=1))
    return 20 * np.log10(e + 1e-9)


def flutter(env: np.ndarray, period_frames: float, a: int, b: int) -> float:
    """peak-to-peak (dB) of the synchronous average of the detrended envelope over cycles"""
    seg = env[a:b]
    if len(seg) < max(8, 2 * period_frames):
        return float('nan')
    t = np.arange(len(seg))
    trend = np.polyval(np.polyfit(t, seg, 1), t)
    d = seg - trend
    P = max(2, int(round(period_frames)))
    ncyc = len(d) // P
    if ncyc < 2:
        return float('nan')
    # fractional periods: resample each cycle onto P bins by phase
    ph = (t % period_frames) / period_frames
    bins = np.minimum((ph * P).astype(int), P - 1)
    avg = np.array([d[bins == k].mean() if np.any(bins == k) else 0.0 for k in range(P)])
    # smooth over 3 bins (30 ms) so single-frame noise does not count
    if P >= 5:
        avg = np.convolve(np.concatenate([avg[-1:], avg, avg[:1]]), np.ones(3) / 3, mode='valid')
    return float(avg.max() - avg.min())


def tick(x: np.ndarray, pos: float, sr: int) -> float:
    i = int(round(pos))
    n = int(0.001 * sr)
    W = int(0.05 * sr)
    if i - W < 1 or i + W + 1 > len(x):
        return float('nan')
    seg = x[i - W - 1:i + W + 1]
    d2 = seg[2:] - 2 * seg[1:-1] + seg[:-2]
    e = d2 * d2
    frames = np.array([e[k:k + n].mean() for k in range(0, len(e) - n + 1, n // 2)])
    centre = (W - n // 2) // (n // 2)
    at = frames[max(0, centre - 1):centre + 2].max()
    floor = float(np.median(frames)) + 1e-20
    return float(at / floor)


def analyze(meta: dict, x: np.ndarray) -> list[dict]:
    sr = meta['sr']
    out = []
    for z in meta['zones']:
        y = x[z['at']:z['at'] + z['n']].astype(np.float64)
        seams = [s for s in z['seams'] if s > 0]
        if not seams:
            continue
        f0 = 440 * 2 ** ((z['p'] - 69) / 12)
        w = max(int(0.02 * sr), int(3 * sr / f0))
        Lout = z['loopOut']
        steps = [seam_step(y, s, w) for s in seams[:12]]
        steps = [s for s in steps if math.isfinite(s)]
        s0 = seams[0]
        others = [seam_step(y, s0 + Lout * (k + 1) / 50.0, w) for k in range(49)]
        others = [s for s in others if math.isfinite(s)]
        step = float(np.median(steps)) if steps else float('nan')
        rec = {'zi': z['zi'], 'p': round(z['p'], 2), 'l': z['l'], 'r': z['r'], 'loop_ms': round(Lout * 1000 / sr, 1),
               'dec': z['dec'], 'step_db': round(step, 2),
               'step_other_max': round(max(others), 2) if others else None,
               'step_pct': round(100.0 * sum(1 for o in others if o < step) / max(1, len(others)), 1)}
        ticks = [tick(y, s, sr) for s in seams[:12]]
        ticks = [t for t in ticks if math.isfinite(t)]
        rec['tick'] = round(float(np.median(ticks)), 2) if ticks else None
        # the same measure at 49 other points of the loop cycle: buzzy tones (brass, reeds) put
        # their HF energy in a pulse per period, so 1 ms windows vary a lot anyway
        t_other = [tick(y, s0 + Lout * (k + 1) / 50.0, sr) for k in range(49)]
        t_other = [t for t in t_other if math.isfinite(t)]
        rec['tick_other'] = round(float(np.percentile(t_other, 90)), 2) if t_other else None
        if z['dec']:
            env = env_db(y, sr)
            pk = env.max()
            fr = 0.01 * sr
            a = int(s0 / fr) + 1
            alive = np.nonzero(env > pk - 40)[0]
            b = int(alive[-1]) if len(alive) else a
            per = Lout / fr
            rec['flutter_db'] = round(flutter(env, per, a, b), 2) if b - a > 2 * per else None
            # natural modulation with the same period, between the attack and the first seam
            na = int((z['pre'] + 0.15 * sr) / fr)
            rec['natural_db'] = round(flutter(env, per, na, a - 1), 2) if a - 1 - na > 2 * per else None
            rec['flutter_cycles'] = round((b - a) / per, 1)
        out.append(rec)
    return out


def grade(r: dict) -> list[str]:
    bad = []
    if r['step_db'] is not None and math.isfinite(r['step_db']):
        other = r['step_other_max'] or 0.0
        if r['step_db'] > other + 1.0 and r['step_db'] > 1.5:
            bad.append(f"seam step {r['step_db']} dB (cycle max elsewhere {other})")
    f = r.get('flutter_db')
    if f is not None and math.isfinite(f):
        nat = r.get('natural_db')
        lim = max(3.0, (nat if nat is not None and math.isfinite(nat) else 0.0) + 2.0)
        if f > lim:
            bad.append(f'loop flutter {f} dB (natural {nat})')
    if r.get('tick') is not None and r['tick'] > 3.0 and r['tick'] > 2.0 * (r.get('tick_other') or 0.0):
        bad.append(f"seam tick x{r['tick']} (elsewhere in the loop x{r.get('tick_other')})")
    return bad


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('dir')
    ap.add_argument('--json', default='')
    args = ap.parse_args()
    res = {}
    fails = []
    for jf in sorted(glob.glob(os.path.join(args.dir, '*.json'))):
        if os.path.basename(jf) == 'loops.json':
            continue
        meta = json.load(open(jf))
        x = np.fromfile(jf[:-5] + '.i16', dtype=np.int16).astype(np.float64) / 32767.0
        rows = analyze(meta, x)
        res[meta['set']] = rows
        worst_step = max((r['step_db'] - (r['step_other_max'] or 0) for r in rows if math.isfinite(r['step_db'])), default=0)
        fl = [r['flutter_db'] for r in rows if r.get('flutter_db') is not None and math.isfinite(r['flutter_db'])]
        tk = [r['tick'] for r in rows if r.get('tick') is not None]
        nb = 0
        for r in rows:
            g = grade(r)
            if g:
                nb += 1
                fails.append(f"{meta['set']} zone {r['zi']} (p={r['p']}, L{r['l']} R{r['r']}, loop {r['loop_ms']} ms): " + '; '.join(g))
        print(f"{meta['set']:12s} {len(rows):3d} loops  worst seam-step excess {worst_step:+5.2f} dB  "
              f"flutter max {max(fl) if fl else 0:5.2f} dB  tick max x{max(tk) if tk else 0:5.2f}  {nb} over limits")
    print(f"\nverdict: {'all loops within limits' if not fails else f'{len(fails)} loops over limits'}")
    for f in fails:
        print('  -', f)
    if args.json:
        json.dump({'sets': res, 'fails': fails}, open(args.json, 'w'), indent=1)


if __name__ == '__main__':
    main()
