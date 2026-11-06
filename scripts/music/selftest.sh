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

const base = (id: string, melody: string, nb = 8): SongDef => ({
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
      bars: nb,
      chords: CHORDS + ' | G:6'.repeat(nb - 8),
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

// one musical error each: every one of these must FAIL with a clear diff
const BARS = REFRAIN.split('|').map((b) => b.trim()).filter(Boolean);
const J = (bars: string[]): string => bars.join(' | ') + ' |';
const withBar = (k: number, bar: string): string => J(BARS.map((b, i) => (i === k ? bar : b)));
/** bar 1 played an eighth late (a shifted bar) */
export const funiculiShifted = base('funiculiShifted', withBar(0, 'r:1 F#5:3 E5:1 r:1'));
/** bar 5 with its rhythm swapped (dotted quarter + eighth -> eighth + dotted quarter) */
export const funiculiSwapped = base('funiculiSwapped', withBar(4, 'F#5:1 E5:3 r:2'));
/** bar 7 a step too high (a transposed bar) */
export const funiculiStepUp = base('funiculiStepUp', withBar(6, 'A5:1 r:1 G5:1 F#5:1 r:1 A5:1'));
/** 2 wrong notes of 21 (about 10 %) */
export const funiculiTwoWrong = base('funiculiTwoWrong', J(BARS.map((b, i) => (i === 1 ? 'F#5:3 D5:1 r:2' : i === 5 ? 'G5:3 E5:1 r:2' : b))));
/** the short notes left out (held notes instead): they are melody notes, not ornaments */
export const funiculiDropped = base('funiculiDropped', J(BARS.map((b) => b.replace('F#5:3 E5:1 r:2', 'F#5:4 r:2'))));
/** every other note an octave lower: isolated octave jumps break the line (a whole phrase may move) */
let nth = 0;
export const funiculiJumpy = base('funiculiJumpy', REFRAIN.replace(/([A-G]#?)(\d)/g, (_m, n: string, o: string) => n + (nth++ % 2 ? Number(o) - 1 : o)));
/** a leaping foreign note squeezed into every dotted quarter: not an ornament */
export const funiculiLeaps = base('funiculiLeaps', REFRAIN.replace(/F#5:3/g, 'F#5:2 B5:1'));
/** an empty bar inserted after bar 4: everything after it is a bar late (FAIL; PASS with --resync) */
export const funiculiInserted = base('funiculiInserted', J([...BARS.slice(0, 4), 'r:6', ...BARS.slice(4)]), 9);

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

// an instrument id the registry does not know: render-song.mjs must list it as SKIPPED
// instead of failing
export const funiculiNewInstruments: SongDef = {
  ...funiculiRefrain,
  id: 'funiculiNewInstruments',
  channels: {
    ...funiculiRefrain.channels,
    mel: { inst: 'kazooNotReal', gain: -2, pan: 0, send: 0.18 },
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
C="$PY scripts/music/compare.py --abc $W --ref-bars 38-45 --song-file $FIX --channel mel"
GREP='E5 starts 1/2q late.*|Broken bars: 38 ' check 'one bar shifted an eighth -> FAIL (broken bar 38)' 1 $C --export funiculiShifted
GREP='Broken bars: 42 ' check 'one bar with swapped rhythm -> FAIL (broken bar 42)' 1 $C --export funiculiSwapped
GREP='wrong note: ref F5 -> cand G5' check 'one bar a step too high -> FAIL' 1 $C --export funiculiStepUp
GREP='RESULT: PASS' check 'same bar, declared with --allow-bars 44 -> PASS' 0 $C --export funiculiStepUp --allow-bars 44
GREP='pitch 90.5 % < 95 %' check '2 wrong notes of 21 (~10 %) -> FAIL' 1 $C --export funiculiTwoWrong
GREP='missing: ref D5' check 'short melody notes left out -> FAIL (not ornaments)' 1 $C --export funiculiDropped
GREP='isolated note out of the line' check 'every other note an octave off -> FAIL' 1 $C --export funiculiJumpy
GREP='extra: cand A5' check 'leaping extra notes are not ornaments -> FAIL' 1 $C --export funiculiLeaps
GREP='starts 3q (early|late)' check 'empty bar inserted -> FAIL (displaced)' 1 $C --export funiculiInserted
GREP='timing shift' check 'inserted bar declared with --resync -> PASS' 0 $C --export funiculiInserted --resync

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

echo "== 3b. repeat structures and voices (synthetic ABC written below)"
cat > "$T/rep.abc" <<'ABC'
X:1
T:AABB
M:2/4
L:1/8
K:C
|: C D E F | G A B c :|: c B A G | F E D C :|

X:2
T:first and second endings
M:2/4
L:1/8
K:C
|: C D E F | G A B c |1 c B A G :|2 c2 c2 || d e f g | a4 |]

X:3
T:stray repeat sign closing the 2nd ending
M:2/4
L:1/8
K:C
|: C D E F |1 G A B c :|2 c B A G :| d e f g | a4 |]

X:4
T:repeat without a start sign
M:2/4
L:1/8
K:C
C D E F | G A B c :| d e f g | a4 |]

X:5
T:pickup, repeat, endings
M:2/4
L:1/8
K:C
G |: c B A G | F E D C |1 E F G :|2 E D C ||

X:6
T:three endings (not expandable)
M:2/4
L:1/8
K:C
|: C D E F |1 G4 :|2 A4 :|3 B4 |]

X:7
T:two-bar first ending
M:2/4
L:1/8
K:C
|: C D E F |1 G A B c | c B A G :|2 E E E E | C4 |]

X:8
T:double-colon repeat
M:2/4
L:1/8
K:C
|: C D E F | G A B c :: c B A G | F E D C :|

X:9
T:voices in blocks, tenor treble-8, bass clef
M:3/4
L:1/4
V:S clef=treble name="Soprano"
V:T clef=treble-8 name="Tenor"
V:B clef=bass name="Bass"
K:F
[V:S] A B c | d2 c |]
w: la la la la la
[V:T] c d e | f2 e |]
[V:B] F, G, A, | B,2 A, |]

X:10
T:voice lines, transposing clarinet, overlay
M:4/4
L:1/8
K:G
V:1
G2 A2 B2 c2 & E2 F2 G2 A2 | d8 |
V:2 transpose=-2 name="Clarinet in Bb"
A2 B2 c2 d2 | e8 |
ABC
order() { $PY scripts/music/abc2notes.py "$T/rep.abc" --tune "$1" --expand-repeats --text 2>&1 | grep '^bar' | awk '{printf "%s ", $2}'; }
exp_order() { check "repeats X:$1 $2 -> $3" 0 bash -c "[ \"\$(echo \$($(declare -f order); PY=$PY T=$T order $1))\" = '$3' ]"; }
exp_order 1 'AABB' '1 2 1 2 3 4 3 4'
exp_order 2 '1st/2nd endings' '1 2 3 1 2 4 5 6'
exp_order 3 'stray :| after the 2nd ending' '1 2 1 3 4 5'
exp_order 4 'no start sign' '1 2 1 2 3 4'
exp_order 5 'pickup + endings' '0 1 2 3 1 2 4'
exp_order 7 'two-bar 1st ending' '1 2 3 1 4 5'
exp_order 8 'double colon ::' '1 2 1 2 3 4 3 4'
GREP='endings for pass 3 found' check 'repeats X:6 3rd ending -> warning' 0 $PY scripts/music/abc2notes.py "$T/rep.abc" --tune 6 --expand-repeats --text
GREP='bar   1 \| C4:1 D4:1 E4:1' check 'voice T treble-8 sounds an octave down' 0 $PY scripts/music/abc2notes.py "$T/rep.abc" --tune 9 --voice T --text
GREP='bar   1 \| F3:1 G3:1 A3:1' check 'voice B bass clef, absolute pitch' 0 $PY scripts/music/abc2notes.py "$T/rep.abc" --tune 9 --voice 3 --text
GREP='bar   1 \| G4:1 A4:1 Bb4:1 C5:1' check 'transposing voice at concert pitch, sounding-key spelling' 0 $PY scripts/music/abc2notes.py "$T/rep.abc" --tune 10 --voice 2 --text
GREP='bar   1 \| G4:1 A4:1 B4:1 C5:1' check 'voice overlay (&): first voice kept' 0 $PY scripts/music/abc2notes.py "$T/rep.abc" --tune 10 --voice 1 --text

echo "== 3c. export-song reproduces the sequencer (all game tracks: events, form, loop window)"
GREP='^ok +title' check 'export-song == compileSong for all 10 tracks' 0 node scripts/music/selftest/formcheck.mjs

echo "== 4. render-song"
GREP='SKIPPED \(unknown instrument ids\): mel=kazooNotReal' check 'unknown instrument listed as skipped (exit 1)' 1 node scripts/music/render-song.mjs --file $FIX --export funiculiNewInstruments "$T/x.wav" --no-channels
GREP='seam mismatch -1[0-9][0-9]' check 'game track renders, seamless loop (menu)' 0 node scripts/music/render-song.mjs menu "$T/m.wav" --no-channels
GREP='^ok$' check 'K-weighting = ITU-R BS.1770 coefficients at 48 kHz' 0 node -e "import('./scripts/music/render-song.mjs').then(({ kWeightCoefs }) => {
  const { shelf, rlb } = kWeightCoefs(48000);
  const want = [[1.53512485958697, -2.69169618940638, 1.19839281085285, 1, -1.69065929318241, 0.73248077421585], [1, -2, 1, 1, -1.99004745483398, 0.99007225036621]];
  const ok = [shelf, rlb].every((c, k) => c.every((x, i) => Math.abs(x - want[k][i]) < 1e-9));
  console.log(ok ? 'ok' : 'BAD ' + JSON.stringify([shelf, rlb]));
})"

echo
echo "selftest: $pass passed, $fail failed"
[ $fail = 0 ]
