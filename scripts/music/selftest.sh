#!/usr/bin/env bash
# Self-test for the music verification tools (scripts/music/*). Run from anywhere:
#   bash scripts/music/selftest.sh            (needs /home/user/kitchenfight-refs/abc and the
#                                              music21 venv; override with REFS=… PY=…)
# Checks: a song against an ABC export of itself (100 %), mutated copies (wrong notes / rhythms
# must fail, octave / time-scale changes must pass), a hand-transcribed Funiculì refrain (a
# scratch song written below into a temp dir) against three independent references, its broken
# variant (must fail), abc2notes on awkward files, and render-song's skipped-instrument report.
set -u
cd "$(dirname "$0")/../.."
PY=${PY:-/home/user/.venv-audio/bin/python}
REFS=${REFS:-/home/user/kitchenfight-refs/abc}
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
# the hand-transcribed scratch song lives only in the temp dir (scratch songs are not committed)
FIX="$T/funiculi-refrain.ts"
sed "s#@ROOT@#$PWD#" > "$FIX" <<'SCRATCH_SONG'
/**
 * Scratch song written by scripts/music/selftest.sh into a temp dir (never committed as a song).
 *
 * Hand transcription of 8 bars of the Funiculì Funiculà refrain ("Listen, listen, echoes sound
 * afar ... far, Fu-ni-cu-") from /home/user/kitchenfight-refs/abc/wf_funiculi.abc, bars 38-45
 * (bar numbers as printed by `abc2notes.py wf_funiculi.abc --text`). The reference is in F major;
 * this transcription is a whole tone higher (G major) to exercise transposition invariance.
 *
 * Exports:
 *   funiculiRefrain    faithful (expected: PASS, 100 % / 100 %)
 *   funiculiOrnamented faithful + arranger liberties: graces, mordent, passing tones, a repeated
 *                      note split in two, one phrase an octave up (expected: PASS)
 *   funiculiDoubled    same melody notated in 6/16-style doubled values: 6 sixteenth steps per
 *                      half bar (stepsPerBeat 6) (expected: PASS, other time scale)
 *   funiculiBroken     wrong notes + wrong rhythms (expected: FAIL)
 */
import { bass, comp, mel, type SongDef } from '@ROOT@/src/audio/sequencer';

const CHORDS = 'D7:6 | D7:6 | D7:6 | D7:6 | D7:6 | D7:6 | D7:6 | G:6';

// bars 38-45, transposed +2 semitones (E5 -> F#5, D5 -> E5, F5 -> G5, C5 -> D5, A4 -> B4)
export const REFRAIN = `
  F#5:3 E5:1 r:2 | F#5:3 E5:1 r:2 | G5:1 r:1 F#5:1 E5:1 r:1 G5:1 | F#5:5 r:1 |
  F#5:3 E5:1 r:2 | F#5:3 E5:1 r:2 | G5:1 r:1 F#5:1 E5:1 r:1 G5:1 | D5:1 r:1 B4:1 B4:2 B4:1 |`;

// arranger liberties that must still PASS: grace notes, a mordent, passing tones (short notes
// between the long ones), "F#5:5" split into two repeated notes, bars 42-44 an octave up
const ORNAMENTED = `
  {G5}F#5:3 E5:1 r:2 | F#5*:3 E5:1 r:2 | G5:1 r:1 F#5:1 E5:1 r:1 G5:1 | F#5:3 F#5:2 r:1 |
  F#6:2 G6:1/2 F#6:1/2 E6:1 r:2 | F#6:3 E6:1 r:2 | G6:1 r:1 F#6:1 E6:1 r:1 G6:1 | D5:1 C5:1 B4:1 B4:2 B4:1 |`;

// wrong notes (bars 2, 5, 7) and wrong rhythms (bars 1, 4, 6, 8)
const BROKEN = `
  F#5:2 E5:2 r:2 | F#5:3 D5:1 r:2 | G5:1 r:1 F#5:1 E5:1 r:1 G5:1 | F#5:3 r:3 |
  A5:3 E5:1 r:2 | F#5:1 E5:3 r:2 | G5:1 r:1 A5:1 B5:1 r:1 G5:1 | D5:2 B4:1 B4:1 B4:1 r:1 |`;

const base = (id: string, melody: string): SongDef => ({
  id,
  bpm: 132,
  stepsPerBeat: 3,
  barSteps: 6,
  scale: 'G major',
  gainDb: -2,
  reverb: { rt60: 1.4, size: 1.0, damp: 0.5, predelay: 0.02, er: 0.3, hp: 250, lp: 7000, wet: 1.4 },
  channels: {
    mel: { inst: 'accordion', gain: -2, pan: 0, send: 0.18 },
    accC: { inst: 'accChord', gain: -11, pan: -0.2, send: 0.12 },
    tuba: { inst: 'tuba', gain: -6, pan: 0, send: 0.04 },
  },
  sections: {
    refrain: {
      bars: 8,
      chords: CHORDS,
      parts: [
        mel('mel', melody, { vel: 0.85 }),
        comp('accC', 'r:2 c:1 r:2 c:1', { lo: 'E4', hi: 'D5', vel: 0.55 }),
        bass('tuba', '1:2 r:1 5:2 r:1', { lo: 'E1', hi: 'E2', vel: 0.75 }),
      ],
    },
  },
  form: ['refrain'],
  loopFrom: null,
  tail: 1.5,
});

export const funiculiRefrain = base('funiculiRefrain', REFRAIN);
export const funiculiOrnamented = base('funiculiOrnamented', ORNAMENTED);
export const funiculiBroken = base('funiculiBroken', BROKEN);

// doubled note values: 6 steps per beat (sixteenth steps), 12 steps per bar
const DOUBLED = REFRAIN.replace(/:(\d+)/g, (_m, d: string) => ':' + 2 * Number(d));
export const funiculiDoubled: SongDef = {
  ...base('funiculiDoubled', DOUBLED),
  stepsPerBeat: 6,
  barSteps: 12,
  sections: {
    refrain: {
      bars: 8,
      chords: CHORDS.replace(/:6/g, ':12'),
      parts: [mel('mel', DOUBLED, { vel: 0.85 })],
    },
  },
};

// instrument ids the synth registry does not know yet (sampler adds them later): render-song.mjs
// must list them as SKIPPED instead of failing
export const funiculiNewInstruments: SongDef = {
  ...funiculiRefrain,
  id: 'funiculiNewInstruments',
  channels: {
    ...funiculiRefrain.channels,
    mel: { inst: 'clarinet', gain: -2, pan: 0, send: 0.18 },
  },
};
SCRATCH_SONG
pass=0
fail=0

check() { # name expected_exit cmd... ; also greps $GREP in the output when set
  local name=$1 want=$2
  shift 2
  local out code
  out=$("$@" 2>&1)
  code=$?
  local ok=1
  [ "$code" = "$want" ] || ok=0
  if [ -n "${GREP:-}" ] && ! grep -qE "$GREP" <<<"$out"; then ok=0; fi
  local summary
  summary=$(grep -E 'RESULT|SKIPPED|Located|Transposition|Time scale' <<<"$out" | tr '\n' ' ' | sed 's/  */ /g' | cut -c1-150)
  if [ $ok = 1 ]; then
    pass=$((pass + 1))
    printf 'ok    %-58s exit %s  %s\n' "$name" "$code" "$summary"
  else
    fail=$((fail + 1))
    printf 'FAIL  %-58s exit %s (want %s)\n%s\n' "$name" "$code" "$want" "$out"
  fi
  GREP=
}

echo "== 1. song vs an ABC export of itself, and mutated copies (title / acc / section A)"
node scripts/music/export-song.mjs title --channel acc --section A --abc --out "$T/self.abc"
GREP='PITCH  match: 100.0 %.*' check 'self: identical -> 100 %' 0 $PY scripts/music/compare.py --abc "$T/self.abc" --song title --channel acc --section A
$PY scripts/music/selftest/mutate.py "$T/self.abc" "$T/w10.abc" --wrong-notes 10 >/dev/null
GREP='wrong note' check 'mutated: 10 wrong notes -> FAIL' 1 $PY scripts/music/compare.py --abc "$T/w10.abc" --song title --channel acc --section A
$PY scripts/music/selftest/mutate.py "$T/self.abc" "$T/w2.abc" --wrong-notes 2 --every 20 >/dev/null
GREP='wrong note: ref F5 -> cand E5' check 'mutated: 2 wrong notes -> listed, within threshold' 0 $PY scripts/music/compare.py --abc "$T/w2.abc" --song title --channel acc --section A
GREP='wrong note' check 'mutated: 2 wrong notes, --pitch-min 100 -> FAIL' 1 $PY scripts/music/compare.py --abc "$T/w2.abc" --song title --channel acc --section A --pitch-min 100
$PY scripts/music/selftest/mutate.py "$T/self.abc" "$T/r8.abc" --rhythm 8 >/dev/null
GREP='rhythm:' check 'mutated: 8 rhythm swaps -> FAIL' 1 $PY scripts/music/compare.py --abc "$T/r8.abc" --song title --channel acc --section A
$PY scripts/music/selftest/mutate.py "$T/self.abc" "$T/oct.abc" --octave-up >/dev/null
GREP='reference -12 semitones' check 'mutated: octave up -> PASS (transposition found)' 0 $PY scripts/music/compare.py --abc "$T/oct.abc" --song title --channel acc --section A
$PY scripts/music/selftest/mutate.py "$T/self.abc" "$T/half.abc" --halve >/dev/null
GREP='= 3/4 reference' check 'mutated: halved note values -> PASS (time scale found)' 0 $PY scripts/music/compare.py --abc "$T/half.abc" --song title --channel acc --section A

echo "== 2. hand-transcribed Funiculi refrain (wf_funiculi.abc bars 38-45)"
W="$REFS/wf_funiculi.abc"
GREP='PITCH  match: 100.0 %' check 'faithful (G major, ref F major) -> PASS 100 %' 0 $PY scripts/music/compare.py --abc "$W" --ref-bars 38-45 --song-file $FIX --export funiculiRefrain --channel mel
GREP='Octave displacements: 8' check 'ornamented/split/octave-up liberties -> PASS' 0 $PY scripts/music/compare.py --abc "$W" --ref-bars 38-45 --song-file $FIX --export funiculiOrnamented --channel mel
GREP='= 3/2 reference' check 'doubled note values (stepsPerBeat 6) -> PASS' 0 $PY scripts/music/compare.py --abc "$W" --ref-bars 38-45 --song-file $FIX --export funiculiDoubled --channel mel
GREP='wrong note' check 'broken (wrong notes + rhythms) -> FAIL' 1 $PY scripts/music/compare.py --abc "$W" --ref-bars 38-45 --song-file $FIX --export funiculiBroken --channel mel
GREP='Located: .*bars 38..45' check 'locate in wf_funiculi (no --ref-bars)' 0 $PY scripts/music/compare.py --abc "$W" --song-file $FIX --export funiculiRefrain --channel mel
GREP='Located: .*bars 38..45' check 'locate in bb_funiculi (1927 print, Eb)' 0 $PY scripts/music/compare.py --abc "$REFS/bb_funiculi.abc" --song-file $FIX --export funiculiRefrain --channel mel
GREP='Located: .*bars 30..37' check 'locate in jc_funiculi_201278317 (piffero, G)' 0 $PY scripts/music/compare.py --abc "$REFS/jc_funiculi_201278317.abc" --song-file $FIX --export funiculiRefrain --channel mel
GREP='Located' check 'broken variant located but FAIL' 1 $PY scripts/music/compare.py --abc "$W" --song-file $FIX --export funiculiBroken --channel mel

echo "== 3. abc2notes on awkward files"
GREP='V:1 Piano: 140 notes' check 'escaped quotes in annotations (bb_funiculi)' 0 $PY scripts/music/abc2notes.py "$REFS/bb_funiculi.abc" --list
GREP='V:3 Tenor.*octave -12' check 'SATB, treble-8 tenor (bb_libiamo)' 0 $PY scripts/music/abc2notes.py "$REFS/bb_libiamo.abc" --list
GREP='transpose -2' check 'transposing clarinets (bb_pagliacci2)' 0 $PY scripts/music/abc2notes.py "$REFS/bb_pagliacci2.abc" --list
GREP='read with L:1/8' check 'LOTRO part without L: (lotro_brindisi #1)' 0 $PY scripts/music/abc2notes.py "$REFS/lotro_brindisi.abc" --tune '#1' --text
GREP='Anvil Chorus' check 'multi-tune book, --title (col_101best)' 0 $PY scripts/music/abc2notes.py "$REFS/col_101best.abc" --title anvil --text
check 'repeats expanded: bars 0-9 played twice (jc_funiculi_201229790)' 0 bash -c "[ \$($PY scripts/music/abc2notes.py '$REFS/jc_funiculi_201229790.abc' --expand-repeats --text | grep -c '^bar   9 ') = 2 ]"
GREP='bar  12 \| _:1 G4:1/2 A4:1 A4:1/2' check 'accidentals carry through the bar (=A2A)' 0 $PY scripts/music/abc2notes.py "$REFS/jc_funiculi_201229790.abc" --text
GREP='E5:3 D5:1 r:2' check 'DSL output (--dsl 0.5)' 0 $PY scripts/music/abc2notes.py "$W" --bars 38-45 --dsl 0.5
GREP='bar  51 \| A4:1/2 B4:1/2 A4:3/16 r:5/16 F##4:1/2 A4:1/2 F##4:3/16' check 'double sharps carry through the bar (bb_ladanza1)' 0 $PY scripts/music/abc2notes.py "$REFS/bb_ladanza1.abc" --voice 1 --text --bars 51
GREP='V:1 Sopran: 170 notes.*bar problems 0' check 'chord tie before duration [Bd-]3 (bb_libiamo)' 0 $PY scripts/music/abc2notes.py "$REFS/bb_libiamo.abc" --list
GREP='bar  36 \| ' check 'labelled variant ending ["Coda" (jc_solemio_201318418)' 0 $PY scripts/music/abc2notes.py "$REFS/jc_solemio_201318418.abc" --tune 1 --text
check 'closing :| after a 2nd ending terminates (jc_santalucia_201333973)' 0 bash -c "[ \$($PY scripts/music/abc2notes.py '$REFS/jc_santalucia_201333973.abc' --expand-repeats --text | grep -c '^bar ') = 32 ]"

echo "== 4. render-song"
GREP='SKIPPED \(unknown instrument ids\): mel=clarinet' check 'unknown instrument listed as skipped (exit 1)' 1 node scripts/music/render-song.mjs --file $FIX --export funiculiNewInstruments "$T/x.wav" --no-channels
GREP='seam mismatch -1[0-9][0-9]' check 'game track renders, seamless loop (menu)' 0 node scripts/music/render-song.mjs menu "$T/m.wav" --no-channels

echo
echo "selftest: $pass passed, $fail failed"
[ $fail = 0 ]
