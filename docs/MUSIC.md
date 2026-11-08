# Music: arrangements and verification tools

The soundtrack is written in the music DSL of `src/audio/sequencer.ts`; see its header doc and
`compileSong`. There is one song per file in `src/audio/songs/*.ts`. The Audio 2.0 tracks arrange
public-domain Italian classics, and **every famous melody must be proven faithful** against a
reference transcription. The tools in `scripts/music/` do that, and
[`music/REFERENCES.md`](music/REFERENCES.md) says which reference to use for each piece.

```bash
PY=/home/user/.venv-audio/bin/python        # Python with music21 / numpy / scipy
REFS=/home/user/kitchenfight-refs/abc        # reference ABC files (reference only: never commit them)
```

## Arranger workflow

1. **Pick the reference.** Look the piece up in [`music/REFERENCES.md`](music/REFERENCES.md) for the
   file, tune, voice and bar range of the theme, and a ready-made command line.
2. **Read it.** `$PY scripts/music/abc2notes.py $REFS/bb_funiculi.abc --voice 1 --text` prints the
   tune bar by bar, with the bar numbers every other tool uses. To start the DSL from the
   reference, `--bars 38-45 --dsl 0.5` prints those bars as a `mel()` string with one step = an
   eighth. Use `--dsl 1/3` for triplet-eighth steps.
3. **Write the song** in `src/audio/songs/<id>.ts`. Then check structure and sequencer warnings:
   `node scripts/music/export-song.mjs <id> --form` lists the sections, bars, timeline and loop
   window, and `--text --channel <ch> --section <name>` shows what you wrote bar by bar.
4. **Prove the melody.**
   ```bash
   $PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 38-53 \
       --song <id> --channel <melody channel> --section <section>
   ```
   Exit code 0 means PASS: pitch ≥ 95 %, rhythm ≥ 90 % and no **broken bar** (a reference bar
   with more than half of its notes wrong). Read the bar-by-bar list and fix every difference that
   is not an intentional liberty. Octave changes of a whole phrase, re-struck long notes,
   articulation, song grace notes and short ornaments or passing tones inside a melody note are
   already tolerated (listed with `-v`). Several channels can carry the tune together
   (`--channel acc,mand`), and the highest note per onset is compared.
   - A bar changed **on purpose** (a new cadence for the loop seam, say): name it with
     `--allow-bars 53`. It is then left out of the scores and checks but still listed, and the
     command line documents the liberty.
   - A phrase **shifted on purpose** (a fermata held longer, a bar inserted for a break): add
     `--resync`, which re-anchors the timing at the shift for one rhythm error, or compare the two
     parts separately with `--ref-bars`/`--bars`.
   - A **key change inside the excerpt**: compare each key's part separately.
5. **Render and measure.** `node scripts/music/render-song.mjs <id> /tmp/<id>.wav` renders the
   song through the real renderer and reports loudness, peak, loop seam, per-channel levels and
   instruments the renderer does not know (those are skipped).
6. **After changing the tools**, run `bash scripts/music/selftest.sh` (53 checks, about 35 s).

## Tools

### `export-song.mjs`: the song's note events

```text
node scripts/music/export-song.mjs <songId> [options]
node scripts/music/export-song.mjs --file scratch.ts [--export name] [options]
  --channel a[,b]   only these channels            --section NAME  one section, bars counted inside it
  --form            structure only (meter, sections, form timeline, loop window, channel list)
  --per-section     each section once instead of following the form
  --text            bar-by-bar DSL-style listing    --abc   ABC of the selected channel(s), top line
  --mono            top note per onset, no graces   --no-graces     drop grace/mordent notes
  --out FILE
```

It bundles `src/audio/sequencer.ts` and `src/audio/songs/index.ts` (or a scratch song file) with
esbuild into a temporary module (`scripts/music/lib/bundle.mjs`) and runs the song's parts exactly
as the game does. The JSON output has, per channel, events with `midi`, `note`, `startStep`,
`startBeat`, `startSec`, `durSteps`, `durBeats`, `durSec`, `vel`, `section`, `formIndex`, `bar` and
`beatInBar`, plus flags (`grace`, `trem`, `gate`). It also carries `bpm`, `meter`
(`barSteps`/`stepsPerBeat`), sections, form, the loop window, and the sequencer warnings (wrong
bar lengths, unknown channels). Times are grid-exact, before humanize; seconds include swing.

A **scratch song** is any `.ts` module exporting a `SongDef` (default export, or `--export name`).
It imports the DSL by path (`import { mel, type SongDef } from '…/src/audio/sequencer'`); the
self-test writes one into a temp dir as an example. Scratch songs are not committed: keep them in
a temp or scratch directory, never in `src/audio/songs/`.

### `abc2notes.py`: the reference's notes

```text
$PY scripts/music/abc2notes.py FILE.abc --list [--title S] [--no-parse] [--json]   inventory
$PY scripts/music/abc2notes.py FILE.abc [--tune X|'#N' | --title S] [--voice ID|N]
      [--expand-repeats] [--bars 1-8,17-24] [--text | --dsl STEPQ] [--accidentals pitch|octave|not]
```

It parses with music21, after its own pre-processing, which:

- splits multi-tune files and voices (`V:` and `[V:]`);
- applies `clef=…-8` and `transpose=` to give concert pitch;
- keeps chord symbols, takes the top note of chords, merges ties and drops grace notes, lyrics,
  decorations and text annotations;
- carries accidentals through the bar (double sharps included);
- moves inline `[K:]`, `[M:]` and `[L:]` onto field lines (music21 ignores the inline forms);
- reads a missing `L:` the LOTRO/Maestro way when only then do the bars fit;
- cuts bar-less MIDI dumps into pseudo-bars.

`--expand-repeats` plays `|: :|` (also `::` and a `:|` with no start sign, which repeats from the
top, pickup included) and 1st/2nd endings, also endings longer than one bar. A stray `:|` after
the last ending is treated as a closing bar line. It does **not** expand endings for a 3rd or later
pass (music21 drops their brackets) or D.C./D.S./segno/coda; the tool warns about both, and you
spell the playing order out with `--bars` instead, e.g. `--bars 1-8,1-6,9`.

`--bars` uses the file's bar numbers: pickup = 0, else the first bar is 1, and every bar line
counts. The output is JSON with `notes` (`midi`, `name`, `onsetQ`, `durQ`, `bar`, `beatQ`,
`tied`) in quarter notes from the start of the selection, plus `bars`, `chordSymbols`, `key`,
`meter`, `voices`, `barProblems` and `warnings`. `--tune '#3'` selects by position, for files
whose X: numbers repeat. Transposed voices (`transpose=-2`, `treble-8`) are spelled in the
sounding key. A clef or `middle=` given on the `K:` line is not applied (only `V:` clefs are);
compare.py is octave-blind anyway.

### `compare.py`: is the song faithful?

```text
$PY scripts/music/compare.py --abc REF.abc [--tune X|--title S] [--voice V] [--expand-repeats] [--ref-bars R]
      (--song ID | --song-file F.ts [--export N]) --channel CH[,CH2] [--section NAME] [--bars R]
      | --cand-abc OTHER.abc [--cand-tune/--cand-title/--cand-voice/--cand-expand-repeats/--cand-bars]
      [--pitch-min 95] [--rhythm-min 90] [--allow-bars R] [--no-bar-check] [--resync]
      [--shift N] [--scale R] [--tol 0.02] [--strict-octave]
      [--locate | --locate-cand | --global] [--json] [-v] [--max-bars 40]
```

How it matches:

- **Transposition.** All 12 pitch-class shifts are scored by a fast pitch-only alignment. The
  global transposition is the most common interval between aligned notes.
- **Time scale.** Song beats are converted to reference quarter notes by the ratio that aligns
  best: 3/2 for a 6/8 song with 3 steps per beat, ½ or 2 for halved or doubled note values, the
  measured ratio itself when it is a simple fraction such as 9/4. Force it with `--scale`.
- **Alignment.** Dynamic programming over the two note lines, with these moves:
  - match, and wrong note;
  - missing note, and extra note;
  - one reference note played as repeated notes (*split*), and repeated reference notes merged
    into one (*merge*).

  A first pass finds the dominant time offset between the lines. A second pass anchors the
  alignment to it, so each reference note is paired with what the song plays at the same place:
  a wrong note in its own time slot is reported as a wrong note, not hidden by borrowing a
  same-pitch note from elsewhere.
- **Tolerated liberties** (no penalty):
  - an octave displacement of a **phrase**, i.e. 3 or more consecutive notes. An isolated note in
    another octave breaks the line and counts as a wrong note;
  - a long note re-struck as repeated notes (*split*), and tremolo, which is compared as one note;
  - articulation: staccato, or a rest against a held note;
  - an extra note that decorates the reference note it starts in. It must start inside that
    note's time span and be either stepwise (passing or neighbour tone, re-strike) or a quick grace
    (at most a sixteenth and a quarter of the note). A slower note that leaps is an extra note;
  - a written-out ornament of the reference left out: a note of at most a sixteenth and at most a
    quarter of its longer neighbour. The short note of a dotted figure and running sixteenths are
    melody, so leaving them out counts;
  - song grace notes (`{G5}`) and mordent auxiliaries, which are ignored.

  Extra notes before the first or after the last aligned note are never excused; the report says
  how many and where (trim with `--bars`/`--section` or widen `--ref-bars`).
- **Locating.** If the reference is much longer than the song excerpt and no `--ref-bars` are
  given, the excerpt is found inside it; the report says "Located: … bars 38..45". If the song
  side is much longer, the reference is located in it.

The scores share one denominator: reference notes − excused ornaments + unexplained extra song
notes.

- **pitch %**: reference notes present with the right pitch.
- **rhythm %**: reference notes that start at the right time. A note must sit at the dominant time
  offset **and** keep the right distance to the next aligned note. So a swapped dotted figure costs
  two notes, a bar played late costs every note in it, and repeated notes merged into one held
  note keep only their first onset. Without `--resync` everything after an inserted or dropped
  beat or bar is displaced. `--resync` re-anchors at each deliberate shift (one rhythm error per
  shift, reported as "timing shift"); a displaced stretch shorter than 2 bars is never
  re-anchored, so a shifted bar still fails.

**Verdict.** PASS needs pitch ≥ `--pitch-min` (95), rhythm ≥ `--rhythm-min` (90) and no broken
bar. A broken bar is a reference bar with more than half of its notes wrong, or a one-note bar
whose note is wrong or missing. Rhythm only counts there when `--rhythm-min` > 0. So a single bar
played late, a step too high or with its rhythm swapped fails even when the totals pass.
`--allow-bars LIST` removes reference bars that were changed on purpose from all scores and checks.
They are still listed, marked "(allowed)". `--no-bar-check` turns the bar check off.

Exit code 0 means pass, 1 fail, 2 error. The report lists, per reference bar (in order; a bar
played again in expanded repeats is labelled "5 (2nd time)"), the reference and what the song plays
in the same time span (transposed into the reference key), with each wrong note, displaced or
mistimed note, merge, missing and extra note. `--cand-abc` compares two references with each
other; REFERENCES.md was triaged that way.

Caveats:

- An unrelated tune still "locates" at about 25–55 % pitch, and its rhythm can score high when
  the meter matches, so only results above 90 % pitch mean the right tune.
- MIDI-derived references (`lotro_*`) have performance timing. Use `--tol 0.1` to `0.15`, or
  `--rhythm-min 0` with a pitch-only reading.
- A reference with a defective bar (one a sixteenth short, say) displaces everything after it:
  REFERENCES.md names the known ones. Use `--resync` across them, or compare the parts on either
  side separately.
- One key per comparison: a modulation inside the excerpt fails, so compare each key's part
  separately.
- The song side is the highest note per onset over the selected channels: a harmony line above
  the tune, or an accompaniment channel included by mistake, reads as wrong notes.

### `render-song.mjs`: render and measure

```text
node scripts/music/render-song.mjs <songId> out.wav [--sr 48000] [--loops N] [--float] [--no-channels]
                                   [--target -16.4] [--tol-lu 1.5] [--json]
node scripts/music/render-song.mjs --file scratch.ts [--export name] out.wav
node scripts/music/render-song.mjs --all outdir/          # every game track + summary table
```

It renders through the real `src/audio/render.ts` in Node and writes a 16-bit WAV (`--float` for
32-bit). `--loops N` appends N−1 passes of the loop body. The report covers:

- duration and loop window: seconds, bars, and the section the loop starts at;
- integrated loudness in LUFS over the loop body, plus the whole file and the short-term maximum.
  It uses ITU-R BS.1770 K-weighting and gating; the filter coefficients equal the standard's at
  48 kHz, and the result agrees with ffmpeg's `ebur128` within 0.1 LU. The peak is a sample peak
  (no true-peak oversampling);
- RMS, sample peak and soft-clipper activity;
- spectral balance: energy share below 250 Hz, 250 Hz–4 kHz and above 4 kHz;
- the loop-seam check: the audio before the loop end must equal the audio before the loop start.
  It measures −117 to −150 dB on the current tracks;
- per-channel solo levels: LUFS, level against the mix, loudest 3 s and peak.

Warnings cover:

- sequencer warnings;
- **instrument ids the renderer does not know**: those channels are skipped, and the exit code
  is 1;
- clipping;
- loudness more than 1.5 LU off the target. The current tracks measure −16.3 to −16.5 LUFS
  (loop body), so the default target is −16.4. Before this fix the tool read about 0.2 LU low and
  reported −16.6;
- seam mismatch;
- channels whose loudest 3 s are more than 30 LU below the mix.

Renders use the recorded instruments: render-song decodes the MP3 sprites in
`src/audio/assets/inst/` with ffmpeg (about 6 s) and registers them through
`src/audio/sampled.ts` (`installSampleBank`), exactly as the game's music worker does. The first
report line says which bank was used. `--synth` renders the synth fallbacks instead (also the
automatic fallback when the worktree has no sample bank). Measure levels and balance on sample
renders: the recorded bank measures about 2 LU quieter than the synth versions of the old tracks.

### `selftest.sh`: check the tools

`bash scripts/music/selftest.sh` runs 53 checks:

- a song against an ABC export of itself (100 %);
- mutated copies of that export. 10 wrong notes and 8 rhythm swaps must FAIL; 2 wrong notes of 47
  are listed but pass, and FAIL with `--pitch-min 100`; an octave transposition and halved note
  values must PASS;
- the hand-transcribed Funiculì refrain (a scratch song that `selftest.sh` writes into a temp dir, bars
  38–45 of `wf_funiculi.abc`, written a tone higher in G):

  | Variant | Expected result |
  |---------|-----------------|
  | faithful | PASS, 100 % / 100 % |
  | ornamented (graces, mordent, passing tones, a split note, three bars an octave up) | PASS |
  | doubled note values (`stepsPerBeat` 6) | PASS |
  | deliberately broken | FAIL |
  | located in three independent references (`wf_funiculi`, `bb_funiculi`, the piffero part) | PASS |
  | one bar played an eighth late; one bar's rhythm swapped; one bar a step too high | FAIL (broken bar) |
  | the step-too-high bar declared with `--allow-bars` | PASS |
  | 2 wrong notes of 21 (about 10 %) | FAIL |
  | the short melody notes left out (held notes instead) | FAIL |
  | every other note an octave off; a leaping extra note in every bar | FAIL |
  | an empty bar inserted | FAIL; PASS with `--resync` |

- the awkward ABC cases met in the corpus;
- synthetic repeat structures (AABB, 1st/2nd endings, a stray `:|`, no start sign, pickup with
  endings, a two-bar ending, `::`, a 3rd ending that must warn) and voices (blocks, `treble-8`,
  bass clef, a transposing voice, an overlay);
- `selftest/formcheck.mjs`: export-song reproduces the sequencer for all 10 game tracks (every
  event, the form and the loop window, against `compileSong`);
- render-song's skipped-instrument report, seam check, and the BS.1770 filter coefficients.

## Conventions

- **Steps and beats.** A song step is the DSL grid unit: `stepsPerBeat` steps per beat,
  `barSteps` per bar. compare.py reports "1 candidate beat = X reference quarters". For a 6/8
  song with 3 steps per beat against a reference in 6/8 eighths, X = 3/2.
- **Bar numbers** in reports: reference bars as printed by `abc2notes.py --text`. Song bars are
  1-based inside `--section`, or `section:bar` over the whole form.
- **References are reference only.** The music is public domain, but the transcriptions are not
  ours. Do not commit ABC files or copy them wholesale into the repo. Transcribe the melody into
  the DSL and prove it with compare.py.
