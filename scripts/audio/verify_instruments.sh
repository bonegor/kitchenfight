#!/usr/bin/env bash
# Full measurement suite for the sampled instruments (run from the repository root).
#
#   scripts/audio/verify_instruments.sh [OUT_DIR]       (default: ./audio-verify)
#
# 1. resampler unit test (tuning, passband, aliasing/interpolation residual)
# 2. test patterns of every sampled instrument + analysis (tuning, placement, onset, loudness
#    evenness, release clicks, loop seams) — verdicts against the Audio 2.0 limits
# 3. attack timing of every zone (time from the beat to -10 dB of the note's peak, how soon
#    sustained notes speak, first-sample steps, note-on HF bursts)
# 4. loop quality of every looped zone (level steps at the seam, flutter of decaying loops at the
#    loop rate, HF ticks at the seam)
# 5. song-DSL semantics (tremolo, tambourine articulations, rolls at every velocity, variant
#    loudness, chords, round robins, velocity)
# 6. the 10 songs rendered with samples (and with the synth for comparison): peak / RMS / warnings
# 7. MP3 decoder-delay robustness: patterns rendered from MP3s decoded WITHOUT trimming the
#    encoder delay must be sample-identical to the normal render (marker alignment)
# Every step runs; the summary at the end lists each step's verdict (exit code 1 if any failed).
# Pattern WAVs and loop takes are deleted at the end unless KEEP_WAV=1.
# Browser checks (Chromium, real engine): node scripts/audio/browser_instrument_test.mjs
set -uo pipefail
OUT="${1:-audio-verify}"
PY="${PYTHON:-/home/user/.venv-audio/bin/python}"
mkdir -p "$OUT"
declare -a SUMMARY=()
step() { # step NAME STATUS
  if [ "$2" -eq 0 ]; then SUMMARY+=("ok    $1"); else SUMMARY+=("FAIL  $1 (exit $2)"); fi
}
echo "== 1. resampler"; node scripts/audio/test_instrument_resampler.mjs | tee "$OUT/resampler.txt"; step resampler $?
echo "== 2. instrument patterns"; rm -rf "$OUT/patterns"
node scripts/audio/render-song.mjs --pattern all --out "$OUT/patterns" | tee "$OUT/patterns.txt"; step 'pattern renders' $?
"$PY" -B scripts/audio/analyze_instruments.py "$OUT/patterns" --json "$OUT/patterns/analysis.json" | tee "$OUT/analysis.txt"
step 'pattern analysis' "$(grep -q 'verdict: all within limits' "$OUT/analysis.txt"; echo $?)"
echo "== 3. attacks"; node scripts/audio/check_instrument_attacks.mjs --json "$OUT/attacks.json" | tee "$OUT/attacks.txt"; step attacks $?
echo "== 4. loops"; rm -rf "$OUT/loops"
node scripts/audio/check_instrument_loops.mjs --out "$OUT/loops" > "$OUT/loops-render.txt"
"$PY" -B scripts/audio/analyze_instrument_loops.py "$OUT/loops" --json "$OUT/loops/loops.json" | tee "$OUT/loops.txt"
step loops "$(grep -q 'verdict: all loops within limits' "$OUT/loops.txt"; echo $?)"
echo "== 5. semantics"; node scripts/audio/test_instrument_semantics.mjs | tee "$OUT/semantics.txt"; step semantics $?
echo "== 6. songs"; node scripts/audio/render-song.mjs all --out "$OUT/songs" | tee "$OUT/songs.txt"; step 'songs (sampled)' $?
node scripts/audio/render-song.mjs all --synth --out "$OUT/songs" | tee "$OUT/songs-synth.txt"; step 'songs (synth)' $?
echo "== 7. decoder delay"; rm -rf "$OUT/patterns-delay"
node scripts/audio/render-song.mjs --pattern accordion,mandolin,tamb,strings,timp --keep-delay --out "$OUT/patterns-delay" | tee "$OUT/delay.txt"
for i in accordion mandolin tamb strings timp; do
  printf '%-10s ' "$i"; "$PY" -B scripts/audio/compare_instrument_renders.py "$OUT/patterns/$i.wav" "$OUT/patterns-delay/$i.wav"
done | tee -a "$OUT/delay.txt"
step 'decoder delay' "$(awk '/ lag / { if ($5 != 0) bad = 1 } END { print bad + 0 }' "$OUT/delay.txt")"
echo; echo "== summary"; printf '%s\n' "${SUMMARY[@]}" | tee "$OUT/summary.txt"
# the bulky intermediate renders (patterns, loop takes: ~1.5 GB) go unless KEEP_WAV=1; the songs stay
if [ "${KEEP_WAV:-0}" != 1 ]; then rm -f "$OUT"/patterns/*.wav "$OUT"/patterns-delay/*.wav "$OUT"/loops/*.i16; fi
! grep -q '^FAIL' "$OUT/summary.txt"
