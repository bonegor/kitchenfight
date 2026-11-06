#!/usr/bin/env python3
"""
Measure the sampled instruments from test-pattern renders (scripts/audio/render-song.mjs --pattern).

Usage:
  node scripts/audio/render-song.mjs --pattern all --out OUT
  /home/user/.venv-audio/bin/python scripts/audio/analyze_instruments.py OUT [--json OUT/analysis.json]

Per note (exact start sample from the pattern JSON; instruments that play a second take on the
right channel (`width`) are measured on the zone itself, recovered from L/R — except the onset of
`sumOnset` instruments (strStab), whose beat is on the two takes' sum: measured on the mono sum, and
not graded on placement, which the sum onset moves on purpose):
  tuning   measured pitch vs the requested (octave-folded) MIDI note, cents   (pitched only; the
           build's own estimator, build_instruments.measure_zone_pitch — a frame-wise track for
           sustained / plucked tones — so this verifies the renderer, the loop and the MP3, not the
           estimator; the build reports each zone's pitch spread and estimator cross-checks)
  place    sample-exact placement: cross-correlation of the rendered note with the zone decoded
           independently here (ffmpeg + marker search) and resampled with scipy; must be ~0 samples
  onset    time from the scheduled beat to where the RMS over the preceding 5 ms comes within
           10 dB of its maximum (the attack's perceptual onset), ms
  loudness K-weighted level of the note body; per instrument and velocity layer the spread
           across the range is reported as +-dB around the median
  clipping peak of the dry render (no master), dBFS
  release  click detector at note-off and at the end of the release: energy above 4 kHz in 1 ms
           frames around the event vs the loudest normal frames (98th percentile) of the preceding
           100 ms, floored at the note's full-band level -35 dB (masking) — power ratio,
           >= 10 (+10 dB) = audible click
  seams    same detector at every predicted loop-seam crossing of sustained / decaying notes
Limits (Audio 2.0 brief): |tuning| <= 5 cents, |onset| <= 5 ms (plucked / struck; the 5 ms window
itself takes ~1 ms to fill), loudness +-2 dB, no clipping, no clicks. Inharmonic instruments
(chimes/timpani/bells) report tuning but are not graded on it.
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
from instrument_dsp import decode_mp3, loudness, max_short_loudness, measure_pitch_centroid, mtof, to_mono  # noqa: E402
from build_instruments import SETS, measure_zone_pitch  # noqa: E402  (the build's windows and estimator)

SPEC = {sp.name: sp for sp in SETS}

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
_sprites: dict = {}


def sprite(name: str) -> tuple[np.ndarray, int]:
    """Decoded sprite of a set, aligned on its marker (independent of the runtime code)."""
    if name not in _sprites:
        x, sr = decode_mp3(os.path.join(ROOT, 'src', 'audio', 'assets', 'inst', name, name + '.mp3'))
        m = to_mono(x)
        mk = int(np.argmax(np.abs(m[:2048 + 4096])))
        _sprites[name] = (x[:, mk - 2048:] if mk >= 2048 else np.pad(x, ((0, 0), (2048 - mk, 0))), sr)
    return _sprites[name]


def placement_lag(rendered: np.ndarray, s: int, n: dict, out_sr: int) -> float | None:
    """Lag (output samples) between where the zone sits in the render and where it should start
    (scheduled time minus the zone's pre-roll at the playback ratio). Cross-correlates the first
    120 ms after the onset."""
    z = n.get('zone')
    if not z or not n.get('set'):
        return None
    x, zsr = sprite(n['set'])
    zone = to_mono(x)[z['o']:z['o'] + min(z['n'], z.get('ls', z['n']))]
    # (cents: the micro-variation of a repeated take — round robin without a second recording)
    ratio = 2 ** ((n['folded'] - z['p']) / 12 + n.get('cents', 0) / 1200) if not n.get('unpitched') else 2 ** (n.get('cents', 0) / 1200)
    inc = ratio * zsr / out_sr
    # reference at the output rate: zone index i -> output (i - pre) / inc after the onset
    t_out = np.arange(int(len(zone) / inc))
    ref = np.interp(t_out * inc, np.arange(len(zone)), zone)
    pre_out = z['pre'] / inc
    a = int(round(s - pre_out))
    L = min(len(ref), int(0.12 * out_sr) + int(pre_out))
    # search +-half a period at most (periodic tones correlate at every period)
    M = 64 if n.get('unpitched') else max(2, min(64, int(out_sr / mtof(n['folded']) / 2) - 1))
    if a < M or L < 256:
        return None
    # first differences (whitened): the correlation of low-frequency content (a bass-drum roll, a low
    # note) is flat over many samples, its maximum anywhere in that plateau
    seg = np.diff(rendered[a - M:a + L + M + 1])
    r = np.diff(ref[:L + 1])
    c = signal.correlate(seg, r, mode='valid')
    k = int(np.argmax(c))
    if 0 < k < len(c) - 1:
        y0, y1, y2 = c[k - 1], c[k], c[k + 1]
        den = y0 - 2 * y1 + y2
        k = k + (0.5 * (y0 - y2) / den if abs(den) > 1e-12 else 0.0)
    return float(k - M)

INHARMONIC = {'bell', 'timp', 'tubularBell', 'timpani', 'orchHit'}
FILTERED = {'accordionDry', 'accChord', 'choirO'}
# not graded on onset: sustained (bowed / blown / sung: the beat is on the faded attack, how soon it
# speaks is graded by check_instrument_attacks.mjs) and swelling articulations (rolls, tam-tam,
# flexatone, whistles, shakers)
SLOW = {'strings', 'violin', 'cello', 'contrabass', 'choir', 'choirO', 'brassSoft', 'horn', 'cymbal', 'bassDrum',
        'accordion', 'accordionDry', 'accChord', 'brass', 'tuba', 'trumpet', 'trombone', 'flute', 'piccolo', 'clarinet',
        'oboe', 'bassoon', 'organ', 'tamtam', 'flexatone', 'ratchet', 'toyWhistle', 'vibraslap', 'shaker', 'tamb'}


def onset_5ms(m: np.ndarray, s: int, sr: int, a: int, b: int) -> float:
    """ms from s to where the RMS over the preceding 5 ms first comes within 10 dB of its maximum
    over [a, b)"""
    W = int(0.005 * sr)
    seg = m[a:b]
    cs = np.concatenate([[0.0], np.cumsum(seg * seg)])
    idx = np.arange(1, len(seg) + 1)
    r5 = np.sqrt((cs[idx] - cs[np.maximum(0, idx - W)]) / W)
    if not len(r5) or r5.max() <= 0:
        return 0.0
    k = int(np.argmax(r5 >= r5.max() * 10 ** (-10 / 20)))
    return (a + k + 1 - s) * 1000 / sr


def zone_signal(x: np.ndarray, width: float | None) -> np.ndarray:
    """The rendered zone itself: mono, or for `width` instruments (L = c a + s b, R = c b + s a with a
    second take b) a = (c L - s R) / (c^2 - s^2)."""
    if width is None or x.shape[0] < 2:
        return to_mono(x)
    th = math.asin(min(1.0, max(0.0, width))) / 2
    c, s_ = math.cos(th), math.sin(th)
    return (c * x[0] - s_ * x[1]) / (c * c - s_ * s_)


def d2_spike(x: np.ndarray, at: int, half: int, ref: int, sr: int = 48000) -> float:
    """Click metric at sample `at`: a click is a broadband transient, so compare the energy above
    4 kHz in 1 ms frames within +-half of `at` with the median 1 ms frame energy over the `ref`
    samples before (ratio in power, e.g. 10 = +10 dB; >= 10 means an audible click)."""
    a0 = max(1, at - ref - half)
    a1 = min(len(x), at + half + 1)
    seg = x[a0:a1]
    if len(seg) < 64:
        return 0.0
    b, a = signal.butter(4, 4000, 'highpass', fs=sr)
    hp = signal.lfilter(b, a, seg)
    n = max(1, int(0.001 * sr))
    frames = [float(np.mean(hp[i:i + n] ** 2)) for i in range(0, len(hp) - n + 1, n)]
    k_at = (at - a0) // n
    lo = max(0, k_at - half // n - 1)
    win = frames[lo:k_at + half // n + 1]
    pre = frames[:max(1, lo)]
    # baseline = the loudest normal frames (98th percentile): periodic tones (brass, reeds) put
    # their HF energy into short pulses each period, so 1 ms frames fluctuate by +-7 dB anyway
    base = float(np.percentile(pre, 98)) if pre else 0.0
    # audibility floor: an HF transient more than 35 dB below the note's own (full-band) level is
    # masked by it — compare against at least that floor (avoids flagging codec-noise wiggles
    # 50+ dB under a low organ / bass tone)
    level = float(np.mean(seg[: max(1, at - a0)] ** 2))
    base = max(base, level * 10 ** (-35 / 10), 1e-12)
    return max(win) / base if win else 0.0


def analyze(path_json: str) -> dict:
    meta = json.load(open(path_json))
    sr, data = wavfile.read(path_json[:-5] + '.wav')
    x = data.astype(np.float64) / 32768.0
    if x.ndim > 1:
        x = x.T
    else:
        x = x[None, :]
    m = zone_signal(x, meta.get('width'))
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
        # onset: perceptual (5 ms RMS within 10 dB of its maximum over the note's first 0.5 s); on what
        # is heard (the mono sum) for instruments whose beat is the onset of their two takes together
        onset_ms = onset_5ms(to_mono(x) if meta.get('sumOnset') else m, s, sr, a, min(b, s + int(0.5 * sr)))
        rec = {'m': n['m'], 'folded': n['folded'], 'v': n['v'], 'vr': n['vr'], 'layer': n['layer'], 'onset_ms': round(onset_ms, 3)}
        rec['fold'] = bool(n.get('fold'))
        # sample-exact placement of the zone
        n2 = dict(n, unpitched=unpitched)
        lag = None if meta.get('sumOnset') else placement_lag(m, s, n2, sr)
        if lag is not None:
            rec['place'] = round(lag, 2)
        sp = SPEC.get(n.get('set') or '')
        sustain = kind == 'sustain'
        ratio = 2 ** ((n['folded'] - z['p']) / 12) if (z and not unpitched) else 1.0
        # tuning (same partial-centroid method and window as the build; windows scale with the
        # playback ratio because a shifted note plays faster/slower)
        # zones whose pitch the build takes from the nominal (piano extremes, timpani: no clean
        # fundamental to measure) are not measured here either
        trusted = bool(sp and z and z.get('p') is not None and (round(z['p']) < sp.trust_below or round(z['p']) > sp.trust_above))
        if not unpitched and not trusted:
            # sustained: inside the loop of the 2.6 s note (what long notes sound like)
            pw = (1.3, 2.5) if sustain else (sp.pitch_win if sp else (0.05, 0.4))
            w0 = s + int(pw[0] / (ratio if not sustain else 1) * sr)
            w1 = s + int(pw[1] / (ratio if not sustain else 1) * sr)
            if sp:
                pm = measure_zone_pitch(sp, m[None, :], sr, w0, min(w1, b), n['folded'], 1.0, {})
            else:
                pm = measure_pitch_centroid(m[None, :], sr, w0, min(w1, b), n['folded'], harmonics=4)
            if pm is not None:
                rec['cents'] = round((pm - n['folded']) * 100, 2)
        # loudness of the body (the build's normalisation window)
        if sp and sp.loud_max:
            lu = max_short_loudness(x, sr, s, b)
        elif sustain:
            lu = loudness(x, sr, s + int(0.1 * sr), s + int(2.5 * sr))
        else:
            lw = sp.loud_win if sp else (0.0, 0.3)
            lu = loudness(x, sr, s + int(lw[0] / ratio * sr), s + int(lw[1] / ratio * sr))
        rec['lu'] = round(lu, 2)
        # release clicks: note-off and end of the release tail
        if not ring:
            off = s + int(n['dur'] * sr)
            rel_end = off + int(meta['release'] * 3.6 * sr)
            rec['click_off'] = round(d2_spike(m, off, int(0.003 * sr), int(0.1 * sr), sr), 2)
            rec['click_end'] = round(d2_spike(m, min(len(m) - 3, rel_end), int(0.003 * sr), int(0.1 * sr), sr), 2)
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
                    worst = max(worst, d2_spike(m, at, int(0.002 * sr), int(0.1 * sr), sr))
                k += 1
            rec['seam'] = round(worst, 2)
            rec['seams_checked'] = k
        res['notes'].append(rec)
    return res


def summarize(r: dict) -> dict:
    notes = r['notes']
    cents = [abs(n['cents']) for n in notes if 'cents' in n]
    onsets = [abs(n['onset_ms']) for n in notes]
    cents_in = [abs(n['cents']) for n in notes if 'cents' in n and not n['fold']]
    places = [abs(n['place']) for n in notes if 'place' in n]
    out = {'id': r['id'], 'notes': len(notes), 'peak_db': round(r['peak_db'], 2), 'slow': r['id'] in SLOW,
           'cents_max': round(max(cents_in), 2) if cents_in else None,
           'cents_med': round(float(np.median(cents_in)), 2) if cents_in else None,
           'cents_fold_max': round(max(cents), 2) if cents else None,
           'place_max': round(max(places), 2) if places else None,
           'onset_max_ms': round(max(onsets), 2) if onsets else None,
           'onset_med_ms': round(float(np.median(onsets)), 2) if onsets else None}
    # loudness spread per layer over notes with vr == 0
    spreads = []
    for layer in sorted({n['layer'] for n in notes}):
        lus = [n['lu'] for n in notes if n['layer'] == layer and n['vr'] == 0 and n['lu'] > -90 and not n['fold']]
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
        if 'notes' not in meta or 'id' not in meta or (only and meta['id'] not in only):
            continue
        r = analyze(f)
        full.append(r)
        rows.append(summarize(r))
    hdr = (f"{'instrument':13s} {'notes':>5s} {'|c| max':>8s} {'|c| med':>8s} {'place':>6s} {'onset max':>9s} "
           f"{'onset med':>9s} {'loud +-dB':>9s} {'rel click':>9s} {'seam':>6s}")
    print(hdr)
    for o in rows:
        f = lambda v, w=8, p=2: (f'{v:{w}.{p}f}' if isinstance(v, (int, float)) else f"{'-':>{w}s}")
        print(f"{o['id']:13s} {o['notes']:5d} {f(o['cents_max'])} {f(o['cents_med'])} {f(o['place_max'], 6, 1)} "
              f"{f(o['onset_max_ms'], 9)} {f(o['onset_med_ms'], 9)} {f(o['loud_pm_db'], 9)} {f(o['release_click_max'], 9)} {f(o['seam_max'], 6)}")
    # verdicts (brief limits); onset is graded on percussive/plucked attacks only — slow bowed / sung
    # attacks have no sharp onset, their timing is graded by the sample-exact placement instead.
    # Placement is not graded for the tone-filtered variants (their IIR filter shifts the phase of
    # the reference; they play the same zones as accordion / choir).
    fails = []
    for o in rows:
        iid = o['id']
        if o['cents_max'] is not None and iid not in INHARMONIC and o['cents_max'] > 5:
            fails.append(f"{iid}: tuning {o['cents_max']} cents")
        if o['place_max'] is not None and o['place_max'] > 3 and iid not in FILTERED:
            fails.append(f"{iid}: placement {o['place_max']} samples")
        if not o['slow'] and o['onset_max_ms'] is not None and o['onset_max_ms'] > 5:
            fails.append(f"{iid}: onset {o['onset_max_ms']} ms")
        if o['loud_pm_db'] is not None and o['loud_pm_db'] > 2:
            fails.append(f"{iid}: loudness +-{o['loud_pm_db']} dB")
        if (o['release_click_max'] or 0) >= 10 or (o['seam_max'] or 0) >= 10:
            fails.append(f"{iid}: click (release {o['release_click_max']}, seam {o['seam_max']})")
    print('\nverdict:', 'all within limits' if not fails else f'{len(fails)} over limits')
    for f_ in fails:
        print('  -', f_)
    if args.json:
        json.dump({'summary': rows, 'notes': full, 'fails': fails}, open(args.json, 'w'), indent=1)


if __name__ == '__main__':
    main()
