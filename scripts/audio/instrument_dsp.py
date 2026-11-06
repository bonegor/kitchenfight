"""
DSP helpers for the instrument build and its measurements (numpy/scipy + ffmpeg).

Everything works on float64 numpy arrays shaped (channels, samples).
"""
from __future__ import annotations

import math
import os
import subprocess
import tempfile

from typing import Callable

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


def dc_block(x: np.ndarray, sr: int, fc: float = 12.0) -> np.ndarray:
    """Remove DC / sub-audio offset: causal 2nd-order Butterworth high-pass at fc (no pre-echo;
    -0.1 dB at 32 Hz). Applied to every source before anything else."""
    sos = signal.butter(2, fc, 'highpass', fs=sr, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def first_at_or_above(env: np.ndarray, thr: float, start: int = 0) -> int:
    """First index >= start where env >= thr (len(env) if never)."""
    hit = np.nonzero(env[start:] >= thr)[0]
    return int(start + hit[0]) if len(hit) else len(env)


def walk_back(es: np.ndarray, k: int, lim: int, silent: float, tol: float = 0.02) -> int:
    """From index k, walk back while the (smoothed) envelope keeps falling (within tol) and is not yet
    silent: the start of the rise that leads to k. Stops at a dip / the floor of whatever precedes it
    (pick / hammer / handling noise, a mechanism thump, bow noise), at silence, or at lim."""
    j = k
    lim = max(0, lim)
    while j > lim and es[j - 1] <= es[j] * (1 + tol) and es[j - 1] > silent:
        j -= 1
    return j


def attack_points(x: np.ndarray, sr: int, mode: str, *, pre_ms: float = 1.5, look: float = 0.6,
                  rel_db: float = -12.0, max_walk: float = 0.025, perc_db: float = -10.0, max_pre: float = 0.06,
                  max_attack: float | None = None, fade_in: float = 0.0, min_fade: float = 0.003,
                  sus_db: float = -12.0, sus_win: tuple[float, float] = (0.3, 1.0),
                  period: float | None = None) -> tuple[int, int, int, dict]:
    """Where a zone starts (`st`, everything before is dropped), where its beat is (`on`, the
    sample the mixer puts on the grid) and how many samples to fade in from `st` (`fin`).
    The beat is the PERCEPTUAL onset (where the attack has become loud enough to be heard as the
    note's start), not the first sample above a low threshold: recordings carry pick / hammer /
    handling noise, plectrum scrapes and key thumps at -15..-40 dB up to tens of ms before the real
    attack, and slow (bowed, section) attacks build up over 20-80 ms — a low threshold puts the beat
    on that and every note sounds late.

    mode 'transient' (plucked / struck / percussive): the beat is the first point where the RMS over
      the preceding 5 ms (pitched notes: in the band 0.7..6 x f0) comes within rel_db (-12 dB) of its
      peak. The zone keeps the rise that leads
      there — walked back on an envelope smoothed over max(2 ms, one period) (`period`, samples) while
      it keeps falling, at most max_walk — plus pre_ms before it (faded in), and drops whatever
      precedes the rise (pre-noise, a thump or scrape separated from the attack by a dip).
    mode 'perceptual' (section articulations, orchestra hits: spread attacks): the beat is the RMS
      over the preceding 5 ms reaching perc_db (-10 dB) of its peak — the main jump of the attack, not the bow-noise
      plateau before it; the zone keeps the build-up before the beat (from where the sound leaves
      -40 dB of the peak, at most max_pre) so the attack sounds natural and lands on the beat.
    mode 'sustain' (bowed / blown / sung, reference = the early-sustain level): the zone starts where
      the sound leaves the noise floor; when the attack is slower than max_attack (time to -6 dB of
      the sustain) its quiet beginning is cut (with a fade-in) so short notes speak; fade_in forces
      a minimum fade (e.g. a chorus sample that starts mid-sound). The beat is the sus_db (-12 dB)
      point of the (faded) attack, at most max_pre after the start.
    Every zone that does not start from silence gets at least min_fade of fade-in (no click)."""
    m = to_mono(x) if x.ndim > 1 else x
    n = len(m)
    info: dict = {'attack': mode}
    if n < 16:
        return 0, 0, 0, info
    e2 = envelope(m, sr, 0.002)
    L = int(min(n, look * sr))
    pk = float(np.max(e2[:L])) if L else 0.0
    if pk <= 0:
        return 0, 0, 0, info
    pre_n = int(round(pre_ms * sr / 1000))
    mf = int(round(min_fade * sr))
    # RMS over the preceding 5 ms: the ear integrates over a few ms; a causal window, so a spread
    # attack's beat is not pulled early by a centred window's look-ahead. Pitched plucked / struck
    # notes are measured in the band of their fundamental and first harmonics (zero-phase band-pass
    # 0.7 f0 .. 6 f0): a plectrum scrape or a key thump outside it does not count as the attack (a
    # section's bow noise does: 'perceptual' stays full-band).
    W5 = max(1, int(0.005 * sr))
    mb = m
    if period and mode == 'transient':
        f0 = sr / period
        lo, hi = 0.7 * f0, min(6.0 * f0, 0.45 * sr)
        if hi > lo * 1.5:
            mb = signal.sosfiltfilt(signal.butter(2, [lo, hi], 'bandpass', fs=sr, output='sos'), m)
    cs = np.concatenate([[0.0], np.cumsum(mb * mb)])
    idx = np.arange(1, n + 1)
    r5 = np.sqrt((cs[idx] - cs[np.maximum(0, idx - W5)]) / W5)
    pk5 = float(np.max(r5[:L]))
    if mode == 'transient':
        on = first_at_or_above(r5[:L], pk5 * 10 ** (rel_db / 20))
        ws = min(0.012, max(0.002, (period or 0) / sr))
        es = envelope(m, sr, ws)
        rise = walk_back(es, on, on - int(max_walk * sr), pk * 10 ** (-50 / 20))
        st = max(0, rise - pre_n)
        fin = rise - st
        info['rise_ms'] = round((on - rise) * 1000 / sr, 1)
        info['skipped_ms'] = round(st * 1000 / sr, 1)
    elif mode == 'perceptual':
        on = first_at_or_above(r5[:L], pk5 * 10 ** (perc_db / 20))
        # the build-up starts where the 2 ms envelope first leaves the floor (-40 dB of the peak)
        s0 = first_at_or_above(e2[:max(1, on)], pk * 10 ** (-40 / 20))
        st = max(0, s0 - pre_n, on - int(max_pre * sr))
        fin = max(0, min(on - st, s0 - st if s0 > st else 0))
        info['skipped_ms'] = round(st * 1000 / sr, 1)
    else:  # sustain
        e10 = envelope(m, sr, 0.01)
        s_on = first_at_or_above(e2, float(np.max(e2[:int(min(n, 1.5 * sr))])) * 10 ** (-35 / 20))
        a = min(n - 1, s_on + int(sus_win[0] * sr))
        b = min(n, s_on + int(sus_win[1] * sr))
        ref = float(np.median(e10[a:b])) if b > a + 8 else float(np.max(e10))
        ref = max(ref, 1e-9)
        st = max(0, s_on - pre_n)
        t6 = first_at_or_above(e10, ref * 10 ** (-6 / 20), s_on)
        info['attack_ms'] = round((t6 - s_on) * 1000 / sr, 1)
        if max_attack is not None and t6 < n and t6 - st > int(max_attack * sr):
            st = t6 - int(max_attack * sr)
            info['attack_cut_ms'] = round((st - s_on) * 1000 / sr, 1)
        fin = max(int(round(fade_in * sr)), 0)
        if st > s_on:  # cut into the attack: fade in over a fifth of the remaining rise
            fin = max(fin, int(0.2 * max_attack * sr) if max_attack else mf)
        # beat: sus_db (-12 dB) of the sustain level on the faded attack
        y = m[st:].copy()
        if fin > 0:
            y[:fin] *= 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, fin))
        ey = envelope(y, sr, 0.01)
        on = st + min(first_at_or_above(ey, ref * 10 ** (sus_db / 20)), int(max_pre * sr))
        info['ref_db'] = round(db(ref), 1)
    # never start with a step: a zone that starts loud (> -30 dB of its peak, e.g. a sample trimmed
    # into the sound) gets at least min_fade of fade-in, any other non-silent start at least 1 ms
    head = float(np.max(np.abs(m[st:st + max(1, mf // 4)]))) if st < n else 0.0
    if fin < mf and head > pk * 10 ** (-30 / 20):
        fin = mf
        info['anti_click'] = True
    elif fin < int(0.001 * sr) and head > pk * 10 ** (-60 / 20):
        fin = int(0.001 * sr)
    on = max(on, st)
    return int(st), int(on), int(fin), info


def onset10_index(x: np.ndarray, sr: int, pre: int, rel_db: float = -10.0, look: float = 0.5) -> int:
    """The perceptual onset of a note whose beat is now at `pre`: the first t (window end, exclusive)
    where the RMS over the preceding 5 ms comes within rel_db of its maximum over [1, pre + look]."""
    m = to_mono(x) if np.ndim(x) > 1 else np.asarray(x, dtype=np.float64)
    n = min(len(m), pre + int(look * sr))
    if n < 2:
        return pre
    W = max(1, int(round(0.005 * sr)))
    cs = np.concatenate([[0.0], np.cumsum(m[:n] ** 2)])
    t = np.arange(1, n + 1)
    p = (cs[t] - cs[np.maximum(0, t - W)]) / W
    if p.max() <= 0:
        return pre
    return int(t[int(np.argmax(p >= p.max() * 10 ** (rel_db / 10)))])


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
    seg = to_mono(np.atleast_2d(x)[:, start:end])
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
    seg = to_mono(np.atleast_2d(x)[:, start:end])
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
    seg = to_mono(np.atleast_2d(x)[:, start:end])
    if len(seg) < int(0.1 * sr):
        return None
    w = signal.windows.blackmanharris(len(seg))
    N = 1 << int(math.ceil(math.log2(len(seg) * 8)))
    L = np.log(np.abs(np.fft.rfft((seg - np.mean(seg)) * w, N)) + 1e-9)
    f = np.fft.rfftfreq(N, 1 / sr)
    cents = np.arange(-span * 100, span * 100 + 0.25, 0.5)
    f0 = mtof(expected_midi) * 2 ** (cents / 1200)
    # every candidate sums the same harmonics: those below 0.45 sr for the highest candidate
    hmax = min(harmonics, int(0.45 * sr / f0[-1]))
    if hmax < 1:
        return None
    hs = np.arange(1, hmax + 1)
    idx = np.searchsorted(f, f0[:, None] * hs[None, :])  # (candidates, harmonics)
    sc = L[np.minimum(idx, len(L) - 1)].sum(axis=1)
    return expected_midi + float(cents[int(np.argmax(sc))]) / 100


def measure_pitch_hfit(x: np.ndarray, sr: int, start: int, end: int, expected_midi: float, span: float = 1.4,
                       hmin: int = 1, hmax: int = 6, min_prom: float = 12.0,
                       equal_weights: bool = False) -> tuple[float | None, dict]:
    """Pitch from a weighted least-squares fit of the harmonic series h = hmin..hmax.
    Coarse: harmonic-sum search (log magnitude at h*f0, 1-cent grid) over +-span semitones of the
    expected pitch; fine: every harmonic's peak within +-35 cents of h*f0_coarse refined by
    parabolic interpolation on the log spectrum (Blackman-Harris, 8x zero padding);
    f0 = sum(w h f_h) / sum(w h^2), w = peak magnitude. Peaks less than min_prom dB above the
    median of their search band or more than 30 dB under the strongest are ignored.
    Low strings (double bass, tuba) radiate a fundamental 20-40 dB under the 2nd harmonic: fit
    them with hmin = 2, and compare with hmin = 1 as a check. Returns (midi or None, info)."""
    seg = to_mono(np.atleast_2d(x)[:, start:end])
    n = len(seg)
    info: dict = {}
    if n < int(0.05 * sr):
        return None, info
    w = signal.windows.blackmanharris(n)
    N = 1 << int(math.ceil(math.log2(n * 8)))
    S = np.abs(np.fft.rfft((seg - np.mean(seg)) * w, N))
    L = np.log(S + 1e-20)
    f = np.fft.rfftfreq(N, 1 / sr)
    hs = np.arange(hmin, hmax + 1)
    best = None
    for c in np.arange(-span * 100, span * 100 + 0.5, 1.0):
        f0 = mtof(expected_midi) * 2 ** (c / 1200)
        idx = np.searchsorted(f, f0 * hs)
        idx = idx[idx < len(L) - 1]
        if not len(idx):
            continue
        sc = float(np.sum(np.maximum(L[idx], L[idx - 1])))
        if best is None or sc > best[0]:
            best = (sc, f0)
    if best is None:
        return None, info
    f0c = best[1]
    peaks = []
    binw = sr / n  # analysis resolution (Hz)
    for h in hs:
        fh = h * f0c
        if fh > 0.45 * sr:
            break
        half = max(fh * (2 ** (35 / 1200) - 1), 2 * binw)
        lo = np.searchsorted(f, fh - half)
        hi = np.searchsorted(f, fh + half)
        # prominence against the spectrum between the neighbouring harmonics
        blo = np.searchsorted(f, fh - 0.5 * f0c)
        bhi = np.searchsorted(f, fh + 0.5 * f0c)
        if hi <= lo + 2 or hi >= len(S) - 2:
            continue
        k = lo + int(np.argmax(S[lo:hi]))
        prom = 20 * math.log10((S[k] + 1e-20) / (np.median(S[blo:bhi]) + 1e-20))
        a, b, c = L[k - 1], L[k], L[k + 1]
        den = a - 2 * b + c
        dk = 0.5 * (a - c) / den if abs(den) > 1e-12 else 0.0
        peaks.append((int(h), (k + dk) * sr / N, float(S[k]), prom))
    if not peaks:
        return None, info
    top = max(p[2] for p in peaks)
    good = [p for p in peaks if p[3] >= min_prom and p[2] >= top * 10 ** (-30 / 20)]
    info['levels'] = {p[0]: round(20 * math.log10(p[2] / top + 1e-12), 1) for p in peaks}
    if not good:
        return None, info
    wgt = (lambda p: 1.0) if equal_weights else (lambda p: p[2])
    num = sum(wgt(p) * p[0] * p[1] for p in good)
    den = sum(wgt(p) * p[0] * p[0] for p in good)
    info['used'] = [p[0] for p in good]
    return ftom(num / den), info


def measure_pitch_track(x: np.ndarray, sr: int, start: int, end: int, expected_midi: float,
                        method: Callable[[np.ndarray, int, int, int, float], float | None],
                        frame: float = 0.08, hop: float = 0.02, periods: float = 6.0) -> tuple[float | None, dict]:
    """Mean pitch of [start, end) from a frame-wise pitch track: frames of max(`frame`, `periods`
    periods of the expected pitch) every `hop` s, each measured with `method(x, sr, a, b, expected)`;
    the result is the energy-weighted mean (in cents) of the frames within 60 cents of the track's
    median. Vibrato and intonation drift inside a loop are averaged as the ear averages them (one
    long analysis window instead weights the spectrum's peak shape, and a loop whose two halves sit
    30 cents apart can then read 25 cents off). Returns (midi or None, {'spread': p90 - p10 cents,
    'frames': n})."""
    x = np.atleast_2d(x)
    end = min(end, x.shape[1])
    m = to_mono(x[:, start:end])
    F = int(max(frame, periods / mtof(expected_midi)) * sr)
    H = max(1, int(hop * sr))
    info: dict = {}
    if end - start < F:
        p = method(x, sr, start, end, expected_midi)
        info['frames'] = 1 if p is not None else 0
        return p, info
    ps, ws = [], []
    for a in range(start, end - F + 1, H):
        p = method(x, sr, a, a + F, expected_midi)
        if p is None:
            continue
        ps.append(p)
        ws.append(float(np.mean(m[a - start:a - start + F] ** 2)))
    if len(ps) < 2:
        # (almost) no frame could be measured: the whole window at once
        p = method(x, sr, start, end, expected_midi)
        return p, {'frames': 1 if p is not None else 0}
    ps_a = np.array(ps)
    w_a = np.array(ws) + 1e-20
    med = float(np.median(ps_a))
    keep = np.abs(ps_a - med) <= 0.6
    if not np.any(keep):
        keep = np.ones(len(ps_a), bool)
    mean = float(np.sum(ps_a[keep] * w_a[keep]) / np.sum(w_a[keep]))
    info['frames'] = int(np.sum(keep))
    info['spread'] = round(float(np.percentile(ps_a[keep], 90) - np.percentile(ps_a[keep], 10)) * 100, 1)
    return mean, info


def measure_pitch_decay(x: np.ndarray, sr: int, start: int, end: int, expected_midi: float,
                        span_cents: float = 70.0, hmax: int = 10, floor_db: float = -30.0,
                        frame: float = 0.06, hop: float = 0.01) -> tuple[float | None, dict]:
    """Pitch of a decaying, spread tone (section pizzicato: several players, a pitch glide after the
    pluck) as heard over [start, end): a frame-wise track (frames of max(`frame`, 6 periods), every
    `hop`) with two estimates per frame — the median over the prominent harmonics h = 1..hmax of
    (peak frequency / h) within +-span_cents of h * f(expected), and YIN within +-2 semitones — pooled
    and reduced to their weighted median (weight: frame RMS, i.e. louder frames count more, frames
    more than floor_db under the loudest are left out). One window over the whole decay would weigh the
    spectrum's shape instead (a comb over 30-450 ms reads a section pizz up to 60 cents off its
    frames); the early frames alone miss where the pitch settles after the pluck.
    Returns (midi or None, {'spread': p90 - p10 of the pooled estimates in cents, 'frames': n})."""
    m = to_mono(np.atleast_2d(x))
    end = min(end, len(m))
    f0 = mtof(expected_midi)
    F = int(max(frame, 6.0 / f0) * sr)
    H = max(1, int(hop * sr))
    info: dict = {}
    if end - start < F:
        return None, info
    w = signal.windows.blackmanharris(F)
    N = 1 << int(math.ceil(math.log2(F * 8)))
    f = np.fft.rfftfreq(N, 1 / sr)
    starts = list(range(start, end - F + 1, H))
    pw = np.array([float(np.mean(m[a:a + F] ** 2)) for a in starts])
    if not len(pw) or pw.max() <= 0:
        return None, info
    est: list[float] = []
    wts: list[float] = []
    for a, p in zip(starts, pw):
        if p < pw.max() * 10 ** (floor_db / 10):
            continue
        seg = m[a:a + F]
        S = np.abs(np.fft.rfft((seg - np.mean(seg)) * w, N))
        L = np.log(S + 1e-20)
        hs = []
        for h in range(1, hmax + 1):
            fh = h * f0
            if fh > 0.45 * sr:
                break
            lo = np.searchsorted(f, fh * 2 ** (-span_cents / 1200))
            hi = np.searchsorted(f, fh * 2 ** (span_cents / 1200))
            if hi <= lo + 2:
                continue
            k = lo + int(np.argmax(S[lo:hi]))
            if k <= lo or k >= hi - 1:
                continue  # the band's maximum is on its edge: no peak of this harmonic inside
            blo = np.searchsorted(f, fh - 0.5 * f0)
            bhi = np.searchsorted(f, fh + 0.5 * f0)
            if 20 * math.log10((S[k] + 1e-20) / (np.median(S[blo:bhi]) + 1e-20)) < 10:
                continue
            a_, b_, c_ = L[k - 1], L[k], L[k + 1]
            den = a_ - 2 * b_ + c_
            dk = 0.5 * (a_ - c_) / den if abs(den) > 1e-12 else 0.0
            hs.append(1200 * math.log2((k + dk) * sr / N / h / f0))
        wt = math.sqrt(p)
        if hs:
            est.append(float(np.median(hs)))
            wts.append(wt)
        yf = yin_f0(seg, sr, mtof(expected_midi - 2), mtof(expected_midi + 2))
        if yf:
            c = 1200 * math.log2(yf / f0)
            if abs(c) <= 200:
                est.append(c)
                wts.append(wt)
    if len(est) < 3:
        return None, info
    e = np.array(est)
    wa = np.array(wts)
    o = np.argsort(e)
    cw = np.cumsum(wa[o]) / np.sum(wa)
    med = float(e[o][min(len(e) - 1, int(np.searchsorted(cw, 0.5)))])
    info['frames'] = len(starts)
    info['spread'] = round(float(np.percentile(e, 90) - np.percentile(e, 10)), 1)
    return expected_midi + med / 100, info


def measure_pitch_narrow(x: np.ndarray, sr: int, start: int, end: int, nominal_midi: float,
                         span: float = 1.4, harmonics: int = 3) -> float | None:
    """Fallback pitch measurement when the octave is already known: strongest spectral peak of
    harmonic h (h = 1..harmonics) within +-span semitones of h * f(nominal), f0 = f_h / h.
    Accepts only prominent peaks (>= 12 dB above the median level of the search band)."""
    seg = to_mono(np.atleast_2d(x)[:, start:end])
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


def env_range_db(x: np.ndarray, sr: int, a: int, b: int, circular: bool = False, win: float = 0.02,
                 hop: float = 0.005, detrend: bool = False) -> float:
    """Level range (max - min, dB) of the `win` RMS envelope over [a, b), every `hop`; circular: the
    span as a loop plays it (its start follows its end), so a dip anywhere in it counts once per pass;
    detrend: around its straight dB line (a decaying span: the modulation on top of the decay)."""
    m = to_mono(x) if x.ndim > 1 else x
    seg = np.asarray(m[a:b], dtype=np.float64)
    W = max(1, int(win * sr))
    if circular:
        seg = np.concatenate([seg, seg[:W]])
    if len(seg) <= W:
        return 0.0
    cs = np.concatenate([[0.0], np.cumsum(seg * seg)])
    st = np.arange(0, len(seg) - W + 1, max(1, int(hop * sr)))
    p = (cs[st + W] - cs[st]) / W
    d = 10 * np.log10(p + 1e-20)
    if detrend and len(d) > 2:
        t = np.arange(len(d))
        d = d - np.polyval(np.polyfit(t, d, 1), t)
    return float(d.max() - d.min())


def find_loop(x: np.ndarray, sr: int, start_min: int, start_max: int, len_min: int, len_max: int,
              w: float = 0.02, n_starts: int = 16, env_ctx: float = 0.0, env_k: float = 0.05,
              top: int = 6, range_lim: float | None = None, range_detrend: bool = False) -> tuple[int, int, float]:
    """Pick (loop_start, loop_end) with len_min <= le - ls <= len_max maximising the normalised
    correlation between the windows around ls and le (FFT cross-correlation per candidate start),
    with a penalty for level mismatch so the envelope is continuous across the seam.
    env_ctx > 0 (sustained loops): the best `top` candidates per start are re-ranked by how well the
    10 ms envelope (dB) within +-env_ctx of le matches the one around ls (shape AND level: a loop
    whose end sits on a vibrato / bow swell crest and whose start sits in a trough plays a level
    bump at every seam even when the waveforms correlate), penalty env_k per dB of mean mismatch.
    range_lim (dB, with env_ctx): a candidate whose level range as it loops (20 ms RMS, env_range_db)
    exceeds it ranks below every candidate that does not (a breath dip or the note's release inside
    the loop would pump at the loop rate); range_detrend: measured around the span's decay line (a
    beat null inside a decaying loop would flutter at the loop rate)."""
    m = to_mono(x)
    W = int(w * sr)
    n = len(m)
    best = (start_min, min(n, start_min + len_min), -2.0)
    start_max = max(start_min, start_max)
    starts = np.unique(np.linspace(start_min, start_max, num=n_starts).astype(int))
    cs = np.concatenate([[0.0], np.cumsum(m * m)])
    cands: list[tuple[float, int, int]] = []
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
        if env_ctx <= 0:
            j = int(np.argmax(score))
            if score[j] > best[2]:
                best = (int(s), int(lo + j + W), float(score[j]))
            continue
        # local maxima of the score, best first (distinct candidates, >= 2 ms apart)
        order = np.argsort(score)[::-1]
        picked: list[int] = []
        for j in order[:max(top * 40, 200)]:
            if all(abs(int(j) - p) > int(0.002 * sr) for p in picked):
                picked.append(int(j))
            if len(picked) >= top:
                break
        for j in picked:
            cands.append((float(score[j]), int(s), int(lo + j + W)))
    if env_ctx <= 0 or not cands:
        return best
    ev = 20 * np.log10(envelope(m, sr, 0.01) + 1e-9)
    C = int(env_ctx * sr)
    offs = np.arange(-C, C + 1, max(1, int(0.005 * sr)))
    best = (cands[0][1], cands[0][2], -1e9)
    for sc, s, e in cands:
        ia = np.clip(s + offs, 0, n - 1)
        ib = np.clip(e + offs, 0, n - 1)
        mism = float(np.mean(np.abs(ev[ia] - ev[ib])))
        tot = sc - env_k * mism
        if range_lim is not None:
            rg = env_range_db(m, sr, s, e, circular=not range_detrend, detrend=range_detrend)
            if rg > range_lim:
                tot -= 100.0 + rg
        if tot > best[2]:
            best = (s, e, tot)
    return best


def flatten_sustain_loop(x: np.ndarray, sr: int, ls: int, le: int, range_db: float, limit_db: float = 8.0,
                         win: float = 0.02, ease: float = 0.06) -> tuple[np.ndarray, float]:
    """A sustained loop that still pumps (a level dip it could not avoid): where its envelope as it
    loops (`win` RMS, computed circularly so the correction is continuous across the seam) strays
    more than range_db / 2 from its median level, it is pulled back to that band (gain limited to
    +-limit_db); the natural movement inside the band (vibrato, bow) is kept. The gain at the loop
    start is eased in over the `ease` seconds before it (no step entering the loop). Returns the new
    signal and the range left."""
    y = np.array(x, copy=True)
    m = to_mono(y) if y.ndim > 1 else y
    L = le - ls
    W = max(8, int(win * sr))
    if L <= 2 * W:
        return y, env_range_db(y, sr, ls, le, circular=True)
    loop = np.asarray(m[ls:le], dtype=np.float64)
    ext = np.concatenate([loop[-W:], loop, loop[:W]])
    k = np.ones(W) / W
    env = np.sqrt(np.convolve(ext * ext, k, mode='same'))[W:W + L]
    ldb = 20 * np.log10(env + 1e-12)
    dev = ldb - np.median(ldb)
    h = max(0.75, range_db / 2)
    g_db = np.clip(np.clip(dev, -h, h) - dev, -limit_db, limit_db)
    g = 10 ** (g_db / 20)
    y[..., ls:le] *= g
    e = min(ls, int(ease * sr))
    if e > 0:
        r = np.linspace(0.0, 1.0, e)
        y[..., ls - e:ls] *= 10 ** (g_db[0] * (0.5 - 0.5 * np.cos(np.pi * r)) / 20)
    return y, env_range_db(y, sr, ls, le, circular=True)


def decay_slope(x: np.ndarray, sr: int, a: int, b: int, period: float | None) -> float | None:
    """Decay rate (dB/s) of [a, b): least-squares line through the dB envelope (RMS over
    max(20 ms, 2 periods)). Over a few hundred ms it averages out the beating of string courses and
    partials, which a fit over one loop and the 80 ms before it does not (+-40 dB/s errors)."""
    m = to_mono(np.atleast_2d(x))
    win = max(0.02, 2.0 * period / sr if period else 0.02)
    pad = int(win * sr)
    b0 = max(0, a - pad)
    env = envelope(m[b0:min(len(m), b + pad)], sr, win)[a - b0:a - b0 + (b - a)]
    if len(env) < int(0.05 * sr):
        return None
    ldb = 20 * np.log10(env + 1e-12)
    return float(np.polyfit(np.arange(len(ldb)), ldb, 1)[0] * sr)


def flatten_loop_envelope(x: np.ndarray, sr: int, a: int, ls: int, le: int, period: float | None,
                          limit_db: float = 6.0, slope: float | None = None) -> tuple[np.ndarray, float, float]:
    """Decaying loops, on the natural (not yet decay-compensated) signal: remove the slow amplitude
    modulation (beating string courses / partials) around the exponential decay inside [a, le), so
    a repeated loop does not flutter at the loop rate. The envelope (RMS over max(20 ms, 2 periods))
    is pulled onto its straight dB decay line (fitted over [a, le); with `slope` (dB/s, measured over a
    longer stretch, see decay_slope) only its level is fitted), the gain limited to +-limit_db
    and eased in over [a, ls) so the material before the loop keeps its natural shape. Returns the
    new signal, the line's decay (dB/s) and the modulation inside the loop before the correction
    (98th - 2nd percentile of the detrended envelope, dB)."""
    y = np.array(x, copy=True)
    m = to_mono(y)
    win = max(0.02, 2.0 * period / sr if period else 0.02)
    pad = int(win * sr)
    b0 = max(0, a - pad)
    env = envelope(m[b0:min(len(m), le + pad)], sr, win)
    env = env[a - b0:a - b0 + (le - a)]
    if len(env) < 16 or ls <= a:
        return y, 0.0, 0.0
    ldb = 20 * np.log10(env + 1e-12)
    t = np.arange(len(ldb))
    if slope is None:
        coef = np.polyfit(t, ldb, 1)
    else:
        k = slope / sr
        coef = np.array([k, float(np.mean(ldb - k * t))])
    trend = np.polyval(coef, t)
    dev = ldb - trend
    loop_dev = dev[ls - a:]
    resid = float(np.percentile(loop_dev, 98) - np.percentile(loop_dev, 2)) if len(loop_dev) > 8 else 0.0
    g_db = np.clip(-dev, -limit_db, limit_db)
    ease = np.ones(len(ldb))
    r = ls - a
    ease[:r] = 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, r))
    y[..., a:le] *= 10 ** (g_db * ease / 20)
    return y, float(coef[0] * sr), resid


def single_reed(x: np.ndarray, sr: int, c0: int, ls: int, le: int, f0: float, fade: float = 0.04,
                span_cents: float = 45.0) -> tuple[np.ndarray, int, int, dict]:
    """A musette (two reeds tuned a little apart, beating) reduced to its lower reed. The loop
    [ls, le) holds whole beat cycles, so in the DFT of exactly one loop the two reeds' partials sit
    on separate bins: reed A's h-th partial on h*kA, reed B's on h*kB (kB - kA = the beat cycles in
    the loop). Reed B's bins are cleared, which leaves one period of reed A (with the bellows noise
    between the partials), seamless by construction. The zone keeps its recorded attack up to c0 and
    crossfades (over `fade` s, phase-aligned by circular cross-correlation, level-matched) into reed
    A repeated; its loop is one period of that. Returns (signal, new ls, new le, info)."""
    m = to_mono(np.atleast_2d(x))
    L = le - ls
    X = np.fft.rfft(m[ls:le])
    binhz = sr / L
    k0 = f0 / binhz
    lo = max(1, int(np.floor(k0 * 2 ** (-span_cents / 1200))))
    hi = int(np.ceil(k0 * 2 ** (span_cents / 1200))) + 1
    mag = np.abs(X)
    info: dict = {}
    # the stronger reed: the largest bin near f0; the other: the largest bin within 40 cents of it
    # (the reeds sit 15-35 cents apart, 1-3 bins in a loop of 1-2 beat cycles; a reed's own
    # neighbouring bins are 25-30 dB down, the other reed about level with it)
    hi = min(hi, len(X) - 1)
    k1 = lo + int(np.argmax(mag[lo:hi]))
    nb_max = max(1, int(np.ceil(k1 * (2 ** (40 / 1200) - 1))))
    cand = [k for k in range(k1 - nb_max, k1 + nb_max + 1) if k != k1 and 0 < k < len(X)]
    k2 = max(cand, key=lambda k: mag[k]) if cand else k1
    if k2 == k1 or mag[k2] < mag[k1] * 10 ** (-12 / 20):
        info['reed'] = 'no second reed found'
        return np.atleast_2d(x), ls, le, info
    kA, kB = sorted((k1, k2))
    nb = kB - kA
    Y = X.copy()
    h = 1
    while h * kB < len(X) - 1:
        # each harmonic: reed B's partial sits on h*kB, reed A's on h*kA — refined to the local peak
        # when they are 3+ bins apart (a reed's upper partials can sit a bin off h x its fundamental);
        # reed B's peak and its leakage (the bins within (gap - 1) / 2 of it) are cleared, reed A's
        # peak is never touched
        ka, kb = h * kA, h * kB
        if kb - ka >= 3:
            ka = max((ka - 1, ka, ka + 1), key=lambda j: mag[j])
            kb = max((j for j in (kb - 1, kb, kb + 1) if j < len(X)), key=lambda j: mag[j])
        w = max(0, (kb - ka - 1) // 2)
        Y[max(ka + 1, kb - w):kb + w + 1] = 0
        h += 1
    yA = np.fft.irfft(Y, L)
    # crossfade from the recorded attack into reed A: the offset of reed A's period that best matches
    # the recording at c0 (so reed A carries on in phase while reed B fades out)
    F = int(fade * sr)
    seg = np.zeros(L)
    seg[:F] = m[c0:c0 + F]
    corr = np.fft.irfft(np.conj(np.fft.rfft(seg)) * np.fft.rfft(yA), L)
    d = int(np.argmax(corr))
    g = float(np.sqrt(np.mean(m[c0:c0 + F] ** 2) / (np.mean(yA ** 2) + 1e-20)))
    rep = np.tile(yA * g, (F + L) // L + 2)[d:d + F + L]
    w = 0.5 - 0.5 * np.cos(np.pi * (np.arange(F) + 0.5) / F)
    out = np.concatenate([m[:c0], m[c0:c0 + F] * (1 - w) + rep[:F] * w, rep[F:F + L]])
    info['reed'] = f'kept {kA * binhz:.2f} Hz, cleared {kB * binhz:.2f} Hz ({1200 * math.log2(kB / kA):.0f} c, {nb} beat cycles/loop)'
    info['reed_gain_db'] = round(20 * math.log10(g + 1e-12), 1)
    return out[None, :], c0 + F, c0 + F + L, info


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
