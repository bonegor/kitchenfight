#!/usr/bin/env python3
"""
Compare two renders of the same track sample by sample (e.g. the Chromium worker render from
scripts/audio/browser_instrument_test.mjs vs the Node render from scripts/audio/render-song.mjs).

  /home/user/.venv-audio/bin/python scripts/audio/compare_instrument_renders.py a.wav b.wav

Prints the best alignment lag (must be 0: same onset placement in both decoders), the residual
level after alignment (dB re the signal) and the largest absolute sample difference.
"""
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile


def load(p):
    sr, x = wavfile.read(p)
    x = x.astype(np.float64) / 32768.0
    return sr, (x if x.ndim > 1 else x[:, None])


def main():
    sa, a = load(sys.argv[1])
    sb, b = load(sys.argv[2])
    assert sa == sb, 'sample rates differ'
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    ma, mb = a.mean(axis=1), b.mean(axis=1)
    # lag search on the first 20 s (+-2000 samples)
    w = min(n, sa * 20)
    c = signal.correlate(ma[:w], mb[:w], mode='full', method='fft')
    mid = w - 1
    lag = int(np.argmax(c[mid - 2000:mid + 2001])) - 2000
    if lag > 0:
        a2, b2 = a[lag:], b[:n - lag]
    elif lag < 0:
        a2, b2 = a[:n + lag], b[-lag:]
    else:
        a2, b2 = a, b
    d = a2 - b2
    rs = float(np.sqrt(np.mean(a2 ** 2)))
    rd = float(np.sqrt(np.mean(d ** 2)))
    print(f'samples {n}  lag {lag}  residual {20 * np.log10(rd / rs + 1e-12):.1f} dB re signal  '
          f'max |diff| {np.max(np.abs(d)):.6f}  (signal rms {20 * np.log10(rs):.1f} dBFS)')


if __name__ == '__main__':
    main()
