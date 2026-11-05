#!/usr/bin/env bash
# Full measurement suite for the sampled instruments (run from the repository root).
#
#   scripts/audio/verify_instruments.sh [OUT_DIR]       (default: ./audio-verify)
#
# 1. resampler unit test (tuning, passband, aliasing/interpolation residual)
# 2. test patterns of every sampled instrument + analysis (tuning, placement, onset, loudness
#    evenness, release clicks, loop seams) — verdicts against the Audio 2.0 limits
# 3. song-DSL semantics (tremolo, tambourine articulations, chords, round robins, velocity)
# 4. the 10 songs rendered with samples (and with the synth for comparison): peak / RMS / warnings
# 5. MP3 decoder-delay robustness: patterns rendered from MP3s decoded WITHOUT trimming the
#    encoder delay must be sample-identical to the normal render (marker alignment)
# Browser checks (Chromium, real engine): node scripts/audio/browser_instrument_test.mjs
set -euo pipefail
OUT="${1:-audio-verify}"
PY="${PYTHON:-/home/user/.venv-audio/bin/python}"
mkdir -p "$OUT"
echo "== 1. resampler"; node scripts/audio/test_instrument_resampler.mjs | tee "$OUT/resampler.txt"
echo "== 2. instrument patterns"; rm -rf "$OUT/patterns"
node scripts/audio/render-song.mjs --pattern all --out "$OUT/patterns" | tee "$OUT/patterns.txt"
"$PY" -B scripts/audio/analyze_instruments.py "$OUT/patterns" --json "$OUT/patterns/analysis.json" | tee "$OUT/analysis.txt"
echo "== 3. semantics"; node scripts/audio/test_instrument_semantics.mjs | tee "$OUT/semantics.txt"
echo "== 4. songs"; node scripts/audio/render-song.mjs all --out "$OUT/songs" | tee "$OUT/songs.txt"
node scripts/audio/render-song.mjs all --synth --out "$OUT/songs" | tee "$OUT/songs-synth.txt"
echo "== 5. decoder delay"; rm -rf "$OUT/patterns-delay"
node scripts/audio/render-song.mjs --pattern accordion,mandolin,tamb,strings,timp --keep-delay --out "$OUT/patterns-delay" | tee "$OUT/delay.txt"
for i in accordion mandolin tamb strings timp; do
  printf '%-10s ' "$i"; "$PY" -B scripts/audio/compare_instrument_renders.py "$OUT/patterns/$i.wav" "$OUT/patterns-delay/$i.wav"
done | tee -a "$OUT/delay.txt"
