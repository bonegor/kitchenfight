"""
DSP helpers for the instrument build and its measurements (numpy/scipy + ffmpeg).

Everything works on float64 numpy arrays shaped (channels, samples).
"""
from __future__ import annotations

import math
import os
import subprocess
import tempfile

import numpy as np
from scipy import signal

A4 = 440.0


def mtof(m: float) -> float:
    return A4 * 2.0 ** ((m - 69.0) / 12.0)


def ftom(f: float) -> float:
    return 69.0 + 12.0 * math.log2(f / A4)


NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def note_name(m: int) -> str:
    return f'{NOTE_NAMES[m % 12]}{m // 12 - 1}'


# ---------------------------------------------------------------------------------------------
# I/O
# ---------------------------------------------------------------------------------------------

def load_audio(path: str, sr: int | None = None, mono: bool = False) -> tuple[np.ndarray, int]:
    """Decode any file ffmpeg understands into float64 (channels, n). Optional resample (soxr)."""
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries',
                            'stream=sample_rate,channels', '-of', 'csv=p=0', path], capture_output=True, text=True)
    if probe.returncode != 0 or not probe.stdout.strip():
        raise RuntimeError(f'ffprobe failed for {path}: {probe.stderr[:300]}')
    rate_s, ch_s = probe.stdout.strip().split('\n')[0].split(',')[:2]
    src_sr, ch = int(rate_s), int(ch_s)
    out_sr = sr or src_sr
    out_ch = 1 if mono else ch
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-acodec', 'pcm_f32le', '-ac', str(out_ch)]
    if out_sr != src_sr:
        cmd += ['-af', f'aresample={out_sr}:resampler=soxr:precision=28']
    cmd += ['-ar', str(out_sr), '-']
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f'ffmpeg decode failed for {path}: {r.stderr[:300]}')
    x = np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64)
    x = x.reshape(-1, out_ch).T.copy()
    return x, out_sr


def decode_mp3(path: str, trim_delay: bool = True) -> tuple[np.ndarray, int]:
    """Decode an mp3 with ffmpeg; trim_delay=False keeps the encoder priming samples
    (simulates decoders that ignore the LAME gapless header)."""
    cmd = ['ffmpeg', '-v', 'error']
    if not trim_delay:
        cmd += ['-flags2', '+skip_manual']
    cmd += ['-i', path, '-f', 'f32le', '-acodec', 'pcm_f32le', '-']
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries',
                            'stream=sample_rate,channels', '-of', 'csv=p=0', path], capture_output=True, text=True)
    rate_s, ch_s = probe.stdout.strip().split('\n')[0].split(',')[:2]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[:300])
    ch = int(ch_s)
    x = np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64).reshape(-1, ch).T.copy()
    return x, int(rate_s)


def write_wav(path: str, x: np.ndarray, sr: int, bits: int = 16) -> None:
    from scipy.io import wavfile
    y = np.atleast_2d(x).T
    if bits == 16:
        wavfile.write(path, sr, np.clip(np.round(y * 32767), -32768, 32767).astype(np.int16))
    else:
        wavfile.write(path, sr, y.astype(np.float32))


def encode_mp3(x: np.ndarray, sr: int, path: str, quality: float = 4, abr: int | None = None) -> int:
    """libmp3lame VBR (quality 0 best .. 9) or ABR kbps. Returns the file size in bytes."""
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, 'in.wav')
        y = np.atleast_2d(x)
        write_wav(wav, y, sr, bits=32)
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', wav, '-map_metadata', '-1', '-c:a', 'libmp3lame']
        if abr:
            cmd += ['-b:a', f'{abr}k', '-abr', '1']
        else:
            cmd += ['-q:a', str(quality)]
        tmp = path + '.part.mp3'
        cmd += ['-ar', str(sr), '-ac', str(y.shape[0]), '-id3v2_version', '0', '-write_xing', '1', tmp]
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode != 0:
            raise RuntimeError(f'mp3 encode failed: {r.stderr[:300]}')
        os.replace(tmp, path)  # atomic: readers never see a half-written file
    return os.path.getsize(path)


# ---------------------------------------------------------------------------------------------
# Basic measurements
# ---------------------------------------------------------------------------------------------

def to_mono(x: np.ndarray) -> np.ndarray:
    return np.mean(np.atleast_2d(x), axis=0)


def db(x: float) -> float:
    return 20.0 * math.log10(max(1e-12, x))


def rms(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(x)))) if x.size else 0.0


def k_weight(x: np.ndarray, sr: int) -> np.ndarray:
    """ITU-R BS.1770 K-weighting (pre-filter high shelf + RLB high-pass), any sample rate."""
    def shelf(fc, gain_db, q):
        A = 10 ** (gain_db / 40)
        w0 = 2 * math.pi * fc / sr
        alpha = math.sin(w0) / (2 * q)
        cw = math.cos(w0)
        b = [A * ((A + 1) + (A - 1) * cw + 2 * math.sqrt(A) * alpha), -2 * A * ((A - 1) + (A + 1) * cw),
             A * ((A + 1) + (A - 1) * cw - 2 * math.sqrt(A) * alpha)]
        a = [(A + 1) - (A - 1) * cw + 2 * math.sqrt(A) * alpha, 2 * ((A - 1) - (A + 1) * cw),
             (A + 1) - (A - 1) * cw - 2 * math.sqrt(A) * alpha]
        return np.array(b) / a[0], np.array(a) / a[0]

    def hp(fc, q):
        w0 = 2 * math.pi * fc / sr
        alpha = math.sin(w0) / (2 * q)
        cw = math.cos(w0)
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
        a = [1 + alpha, -2 * cw, 1 - alpha]
        return np.array(b) / a[0], np.array(a) / a[0]

    b1, a1 = shelf(1681.97, 4.0, 0.7071752)
    b2, a2 = hp(38.135, 0.5003270)
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=-1), axis=-1)


def loudness(x: np.ndarray, sr: int, start: int = 0, end: int | None = None) -> float:
    """K-weighted RMS in dB (mono sum of channels' power, BS.1770 style, no gating)."""
    x = np.atleast_2d(x)
    seg_end = x.shape[1] if end is None else min(end, x.shape[1])
    pre = max(0, start - int(0.05 * sr))
    k = k_weight(x[:, pre:seg_end], sr)[:, start - pre:]
    if k.shape[1] == 0:
        return -120.0
    p = float(np.mean(np.sum(np.square(k), axis=0)))
    return 10 * math.log10(max(1e-14, p))


def max_short_loudness(x: np.ndarray, sr: int, start: int = 0, end: int | None = None, win: float = 0.3) -> float:
    """Loudest K-weighted `win`-second window between start and end (dB): the perceived peak
    loudness of one-shots whose level builds up or varies (flexatone, ratchet, rolls)."""
    x = np.atleast_2d(x)
    end = x.shape[1] if end is None else min(end, x.shape[1])
    k = k_weight(x[:, start:end], sr)
    p = np.sum(np.square(k), axis=0)
    n = max(1, min(len(p), int(win * sr)))
    cs = np.concatenate([[0.0], np.cumsum(p)])
    ms = (cs[n:] - cs[:-n]) / n
    return 10 * math.log10(max(1e-14, float(np.max(ms)) if len(ms) else 1e-14))


def envelope(x: np.ndarray, sr: int, win: float = 0.005) -> np.ndarray:
    """RMS envelope sampled every sample (moving window)."""
    m = to_mono(x) if x.ndim > 1 else x
    n = max(1, int(win * sr))
    k = np.ones(n) / n
    return np.sqrt(np.convolve(m * m, k, mode='same'))


def onset_index(x: np.ndarray, sr: int, rel_db: float = -30.0, slow: bool = False) -> int:
    """Index where the note starts: first point where the 2 ms envelope crosses rel_db below the
    early peak, refined back to where the signal leaves the noise floor."""
    m = np.abs(to_mono(x) if x.ndim > 1 else x)
    env = envelope(m, sr, 0.002)
    look = env[: int(min(len(env), sr * (1.5 if slow else 0.6)))]
    if not look.size:
        return 0
    pk = float(np.max(look))
    if pk <= 0:
        return 0
    thr = pk * 10 ** (rel_db / 20)
    idx = int(np.argmax(look >= thr))
    # walk back to the noise floor (or 3 ms max)
    floor = max(pk * 10 ** (-60 / 20), float(np.median(env[: max(1, idx // 2)])) * 2 if idx > 8 else 0)
    j = idx
    lim = max(0, idx - int(0.003 * sr))
    while j > lim and env[j] > floor:
        j -= 1
    return j


# ---------------------------------------------------------------------------------------------
# Pitch
# ---------------------------------------------------------------------------------------------

def yin_f0(x: np.ndarray, sr: int, fmin: float, fmax: float, thresh: float = 0.12) -> float | None:
    """YIN (cumulative mean normalised difference) on a mono frame; returns Hz or None."""
    x = x - np.mean(x)
    tmax = int(sr / fmin) + 2
    tmin = max(2, int(sr / fmax))
    W = len(x) - tmax
    if W < tmax:
        return None
    # exact difference function d(t) = sum_{j<W} (x[j] - x[j+t])^2 via one FFT cross-correlation
    n = 1 << int(math.ceil(math.log2(len(x) + W)))
    A = np.fft.rfft(x[:W], n)
    B = np.fft.rfft(x, n)
    r = np.fft.irfft(np.conj(A) * B, n)[: tmax + 1]
    cs = np.concatenate([[0.0], np.cumsum(x * x)])
    ts = np.arange(tmax + 1)
    d = cs[W] + (cs[ts + W] - cs[ts]) - 2 * r
    cmnd = np.ones_like(d)
    cmnd[1:] = d[1:] * np.arange(1, tmax + 1) / np.maximum(1e-12, np.cumsum(d[1:]))
    cand = None
    for t in range(tmin, tmax):
        if cmnd[t] < thresh and cmnd[t] <= cmnd[t + 1]:
            cand = t
            break
    if cand is None:
        cand = tmin + int(np.argmin(cmnd[tmin:tmax]))
        if cmnd[cand] > 0.5:
            return None
    t = cand
    if 1 <= t < tmax:
        a, b, c = cmnd[t - 1], cmnd[t], cmnd[t + 1]
        den = a - 2 * b + c
        t = t + (0.5 * (a - c) / den if abs(den) > 1e-12 else 0.0)
    return sr / t


def peak_freq(x: np.ndarray, sr: int, f_guess: float, width: float = 0.06, pad: int = 8) -> tuple[float, float]:
    """Frequency (Hz) and magnitude of the strongest spectral peak within ±width (relative) of
    f_guess, Gaussian-ish window + parabolic interpolation on log magnitude."""
    n = len(x)
    w = signal.windows.blackmanharris(n)
    N = 1 << int(math.ceil(math.log2(n * pad)))
    S = np.abs(np.fft.rfft((x - np.mean(x)) * w, N))
    f = np.fft.rfftfreq(N, 1 / sr)
    lo = np.searchsorted(f, f_guess * (1 - width))
    hi = np.searchsorted(f, f_guess * (1 + width))
    if hi <= lo + 2:
        return f_guess, 0.0
    k = lo + int(np.argmax(S[lo:hi]))
    if 1 <= k < len(S) - 1:
        a, b, c = np.log(S[k - 1] + 1e-20), np.log(S[k] + 1e-20), np.log(S[k + 1] + 1e-20)
        den = a - 2 * b + c
        dk = 0.5 * (a - c) / den if abs(den) > 1e-12 else 0.0
    else:
        dk = 0.0
    return (k + dk) * sr / N, float(S[k])


def measure_pitch(x: np.ndarray, sr: int, start: int, end: int, nominal_midi: float | None = None,
                  fmin: float = 25, fmax: float = 4500, harmonics: int = 2) -> float | None:
    """Mean pitch (fractional MIDI) of a steady segment. Uses YIN for the octave, then refines with
    the fundamental (and 2nd harmonic) spectral peaks. If nominal_midi is given, the search is
    restricted to ±7 semitones around it at any octave, picking the octave YIN supports."""
    seg = to_mono(x)[start:end]
    if len(seg) < int(0.03 * sr):
        return None
    if nominal_midi is not None:
        fmin = max(fmin, mtof(nominal_midi - 15))
        fmax = min(fmax, mtof(nominal_midi + 15))
    # YIN over a few frames, median
    fl = min(len(seg), max(int(sr * 0.08), int(4 * sr / fmin)))
    ests = []
    for s0 in np.linspace(0, len(seg) - fl, num=max(1, min(6, (len(seg) - fl) // max(1, fl // 2) + 1))).astype(int):
        e = yin_f0(seg[s0:s0 + fl], sr, fmin, fmax)
        if e:
            ests.append(e)
    ests = [e for e in ests if e and e > 0 and math.isfinite(e)]
    if not ests:
        return None
    f0 = float(np.median(ests))
    # refine with spectral peaks over the whole segment
    fs = []
    ws = []
    for h in range(1, harmonics + 1):
        fh, mag = peak_freq(seg, sr, f0 * h, width=0.03)
        if mag > 0:
            fs.append(fh / h)
            ws.append(mag / h)
    if not fs:
        return ftom(f0) if f0 > 0 else None
    f = float(np.average(fs, weights=ws))
    if not (f > 0 and math.isfinite(f)):
        return None
    return ftom(f)


def measure_pitch_centroid(x: np.ndarray, sr: int, start: int, end: int, expected_midi: float,
                           span: float = 1.4, harmonics: int = 4, min_prom: float = 15.0) -> float | None:
    """Precise pitch when the octave is known. For each of the first `harmonics` partials, the
    strongest peak within +-span semitones of h * f(expected) is refined to the power-weighted
    centroid of the spectrum within +-max(30 cents, 2.5 analysis bins) (split modes and two-reed
    musette pairs give their perceived centre). Partials that stand out (>= min_prom dB above the
    band median, within 25 dB of the strongest) are combined, weighted by h (a higher partial
    resolves the pitch better); partials that disagree with the lowest one by > 35 cents
    (inharmonic modes) are dropped. Returns fractional MIDI or None."""
    seg = to_mono(x)[start:end]
    n = len(seg)
    if n < int(0.04 * sr):
        return None
    w = signal.windows.blackmanharris(n)
    N = 1 << int(math.ceil(math.log2(n * 8)))
    P = np.abs(np.fft.rfft((seg - np.mean(seg)) * w, N)) ** 2
    f = np.fft.rfftfreq(N, 1 / sr)
    fe = mtof(expected_midi)
    cands = []
    for h in range(1, harmonics + 1):
        lo = np.searchsorted(f, h * fe * 2 ** (-span / 12))
        hi = np.searchsorted(f, h * fe * 2 ** (span / 12))
        if hi <= lo + 4 or hi >= len(P) - 2 or h * fe > 0.45 * sr:
            continue
        band = P[lo:hi]
        k = lo + int(np.argmax(band))
        prom = 10 * math.log10((P[k] + 1e-30) / (np.median(band) + 1e-30))
        half = max(f[k] * (2 ** (30 / 1200) - 1), 2.5 * sr / n)
        a = np.searchsorted(f, f[k] - half)
        b = np.searchsorted(f, f[k] + half) + 1
        fc = float(np.sum(f[a:b] * P[a:b]) / (np.sum(P[a:b]) + 1e-30))
        cands.append((h, fc / h, prom, P[k]))
    if not cands:
        return None
    top = max(c[3] for c in cands)
    good = [c for c in cands if c[2] >= min_prom and c[3] >= top * 10 ** (-2.5)]
    if not good:
        return None
    ref = good[0][1]
    good = [c for c in good if abs(1200 * math.log2(c[1] / ref)) <= 35]
    f0 = sum(c[0] * c[1] for c in good) / sum(c[0] for c in good)
    return ftom(f0)


def measure_pitch_hsum(x: np.ndarray, sr: int, start: int, end: int, expected_midi: float,
                       span: float = 1.0, harmonics: int = 10) -> float | None:
    """Harmonic-sum pitch: the f0 within +-span semitones of the expected pitch that maximises
    the summed log magnitude at its first `harmonics` partials (0.5 cent grid). Robust for voice
    ensembles, whose fundamental is weak and whose partials are broadened by vibrato and spread."""
    seg = to_mono(x)[start:end]
    if len(seg) < int(0.1 * sr):
        return None
    w = signal.windows.blackmanharris(len(seg))
    N = 1 << int(math.ceil(math.log2(len(seg) * 8)))
    L = np.log(np.abs(np.fft.rfft((seg - np.mean(seg)) * w, N)) + 1e-9)
    f = np.fft.rfftfreq(N, 1 / sr)
    hs = np.arange(1, harmonics + 1)
    best = None
    for c in np.arange(-span * 100, span * 100 + 0.25, 0.5):
        f0 = mtof(expected_midi) * 2 ** (c / 1200)
        idx = np.searchsorted(f, f0 * hs)
        idx = idx[idx < len(L)]
        if not len(idx):
            continue
        sc = float(np.sum(L[idx]))
        if best is None or sc > best[0]:
            best = (sc, c)
    return expected_midi + best[1] / 100 if best else None


def measure_pitch_narrow(x: np.ndarray, sr: int, start: int, end: int, nominal_midi: float,
                         span: float = 1.4, harmonics: int = 3) -> float | None:
    """Fallback pitch measurement when the octave is already known: strongest spectral peak of
    harmonic h (h = 1..harmonics) within +-span semitones of h * f(nominal), f0 = f_h / h.
    Accepts only prominent peaks (>= 12 dB above the median level of the search band)."""
    seg = to_mono(x)[start:end]
    if len(seg) < int(0.05 * sr):
        return None
    n = len(seg)
    w = signal.windows.blackmanharris(n)
    N = 1 << int(math.ceil(math.log2(n * 8)))
    S = np.abs(np.fft.rfft((seg - np.mean(seg)) * w, N))
    f = np.fft.rfftfreq(N, 1 / sr)
    f0n = mtof(nominal_midi)
    best = None
    for h in range(1, harmonics + 1):
        lo = np.searchsorted(f, h * f0n * 2 ** (-span / 12))
        hi = np.searchsorted(f, h * f0n * 2 ** (span / 12))
        if hi <= lo + 4 or hi >= len(S) - 1:
            continue
        band = S[lo:hi]
        k = lo + int(np.argmax(band))
        prom = 20 * math.log10((S[k] + 1e-20) / (np.median(band) + 1e-20))
        if prom < 12:
            continue
        a, b, c = np.log(S[k - 1] + 1e-20), np.log(S[k] + 1e-20), np.log(S[k + 1] + 1e-20)
        den = a - 2 * b + c
        dk = 0.5 * (a - c) / den if abs(den) > 1e-12 else 0.0
        fh = (k + dk) * sr / N
        score = S[k] / h  # favour low harmonics
        if best is None or score > best[0]:
            best = (score, fh / h)
    return ftom(best[1]) if best else None


# ---------------------------------------------------------------------------------------------
# Looping
# ---------------------------------------------------------------------------------------------

def loop_corr(x: np.ndarray, sr: int, ls: int, le: int, w: float = 0.015) -> float:
    """Normalised correlation of the material leading into ls and into le (what the seam joins)."""
    m = to_mono(x)
    W = int(w * sr)
    a = m[max(0, ls - W):ls]
    b = m[max(0, le - W):le]
    n = min(len(a), len(b))
    if n < 8:
        return 0.0
    a, b = a[-n:], b[-n:]
    return float(np.dot(a, b) / (math.sqrt(float(np.dot(a, a) * np.dot(b, b))) + 1e-12))


def find_loop(x: np.ndarray, sr: int, start_min: int, start_max: int, len_min: int, len_max: int,
              w: float = 0.02, n_starts: int = 16) -> tuple[int, int, float]:
    """Pick (loop_start, loop_end) with len_min <= le - ls <= len_max maximising the normalised
    correlation between the windows around ls and le (FFT cross-correlation per candidate start),
    with a penalty for level mismatch so the envelope is continuous across the seam."""
    m = to_mono(x)
    W = int(w * sr)
    n = len(m)
    best = (start_min, min(n, start_min + len_min), -2.0)
    start_max = max(start_min, start_max)
    starts = np.unique(np.linspace(start_min, start_max, num=n_starts).astype(int))
    cs = np.concatenate([[0.0], np.cumsum(m * m)])
    for s in starts:
        if s - W < 0:
            continue
        a = m[s - W:s + W]
        ea = float(np.dot(a, a)) + 1e-12
        lo = s + len_min - W
        hi = min(n, s + len_max + W)
        if hi - lo < 2 * W + 1:
            continue
        seg = m[lo:hi]
        corr = signal.fftconvolve(seg, a[::-1], mode='valid')  # corr[k] = sum a * seg[k:k+2W]
        k = np.arange(len(corr))
        e_seg = cs[lo + k + 2 * W] - cs[lo + k] + 1e-12
        c = corr / np.sqrt(ea * e_seg)
        level = np.abs(10 * np.log10(e_seg / ea))  # dB mismatch
        score = c - 0.02 * level
        j = int(np.argmax(score))
        if score[j] > best[2]:
            best = (int(s), int(lo + j + W), float(score[j]))
    return best


def crossfade_loop(x: np.ndarray, ls: int, le: int, xf: int) -> np.ndarray:
    """Make [ls, le) loop seamlessly: the last xf samples before le are crossfaded (equal power for
    uncorrelated parts, linear when correlated) with the samples just before ls, so that reading
    ...le-1 -> ls continues like ...ls-1 -> ls in the original."""
    y = np.array(x, copy=True)
    xf = min(xf, ls, le - ls - 1)
    if xf <= 8:
        return y
    t = np.linspace(0, 1, xf, endpoint=False)
    a = y[..., le - xf:le]
    b = x[..., ls - xf:ls]
    # correlation decides between linear (coherent) and equal-power (incoherent) crossfades
    am, bm = to_mono(a) if a.ndim > 1 else a, to_mono(b) if b.ndim > 1 else b
    c = float(np.dot(am, bm) / (math.sqrt(float(np.dot(am, am) * np.dot(bm, bm))) + 1e-12))
    lin_w = max(0.0, min(1.0, c))
    g_in = lin_w * t + (1 - lin_w) * np.sin(0.5 * math.pi * t)
    g_out = lin_w * (1 - t) + (1 - lin_w) * np.cos(0.5 * math.pi * t)
    y[..., le - xf:le] = a * g_out + b * g_in
    return y


def seam_click(x: np.ndarray, ls: int, le: int) -> float:
    """Discontinuity at the loop seam relative to the typical sample-to-sample step:
    |x[ls] - x[le-1] - typical step| / rms step around the seam."""
    m = to_mono(x) if x.ndim > 1 else x
    d_seam = abs(m[ls] - m[le - 1])
    around = np.concatenate([np.diff(m[max(1, ls - 256):ls + 256]), np.diff(m[le - 256:le])])
    typ = float(np.sqrt(np.mean(around ** 2))) + 1e-12
    return d_seam / typ


def fade(x: np.ndarray, n_in: int = 0, n_out: int = 0) -> np.ndarray:
    y = np.array(x, copy=True)
    if n_in > 0:
        y[..., :n_in] *= 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, n_in))
    if n_out > 0:
        y[..., -n_out:] *= 0.5 + 0.5 * np.cos(np.linspace(0, math.pi, n_out))
    return y


def resample(x: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    if sr_in == sr_out:
        return x
    g = math.gcd(sr_in, sr_out)
    return signal.resample_poly(x, sr_out // g, sr_in // g, axis=-1, window=('kaiser', 9.0))


def pitch_shift_resample(x: np.ndarray, ratio: float) -> np.ndarray:
    """High-quality offline pitch shift by resampling (ratio > 1 raises the pitch)."""
    if abs(ratio - 1) < 1e-6:
        return x
    # rational approximation
    from fractions import Fraction
    fr = Fraction(1 / ratio).limit_denominator(2000)
    return signal.resample_poly(x, fr.numerator, fr.denominator, axis=-1, window=('kaiser', 9.0))
