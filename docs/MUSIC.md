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
   Exit code 0 means PASS (pitch ≥ 90 %, rhythm ≥ 80 %). The thresholds are a floor. Read the
   bar-by-bar list and fix every difference that is not an intentional liberty. Ornaments, passing
   tones, repeated-note splits and octave changes are already tolerated and reported with `-v`.
   Several channels can carry the tune together (`--channel acc,mand`), and the highest note per
   onset is compared.
5. **Render and measure.** `node scripts/music/render-song.mjs <id> /tmp/<id>.wav` renders the
   song through the real renderer and reports loudness, peak, loop seam, per-channel levels and
   instruments the renderer does not know (those are skipped).
6. **After changing the tools**, run `bash scripts/music/selftest.sh` (29 checks, about 20 s).

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

`--expand-repeats` plays `|: :|` and numbered endings. A stray `:|` after the last ending is
treated as a closing bar line. `--bars` uses the file's bar numbers: pickup = 0, else the first
bar is 1, and every bar line counts. The output is JSON with `notes` (`midi`, `name`, `onsetQ`,
`durQ`, `bar`, `beatQ`, `tied`) in quarter notes from the start of the selection, plus `bars`,
`chordSymbols`, `key`, `meter`, `voices`, `barProblems` and `warnings`. `--tune '#3'` selects by
position, for files whose X: numbers repeat.

### `compare.py`: is the song faithful?

```text
$PY scripts/music/compare.py --abc REF.abc [--tune X|--title S] [--voice V] [--expand-repeats] [--ref-bars R]
      (--song ID | --song-file F.ts [--export N]) --channel CH[,CH2] [--section NAME] [--bars R]
      | --cand-abc OTHER.abc [--cand-tune/--cand-title/--cand-voice/--cand-expand-repeats/--cand-bars]
      [--pitch-min 90] [--rhythm-min 80] [--shift N] [--scale R] [--tol 0.02] [--strict-octave]
      [--locate | --locate-cand | --global] [--json] [-v] [--max-bars 40]
```

How it matches:

- **Transposition.** All 12 pitch-class shifts are scored by a fast pitch-only alignment. The
  global transposition is the most common interval between aligned notes. Notes in another octave
  are listed as octave displacements; they still count as pitch matches unless `--strict-octave`.
- **Time scale.** Song beats are converted to reference quarter notes by the ratio that aligns
  best: 3/2 for a 6/8 song with 3 steps per beat, ½ or 2 for halved or doubled note values, and
  so on. Force it with `--scale`.
- **Alignment.** Dynamic programming over (pitch, duration) tokens, with these moves:
  - match, and wrong note;
  - missing note, and extra note;
  - one reference note played as repeated notes (*split*), and repeated reference notes merged
    into one (*merge*).

  Short notes beside longer ones (ornaments, written-out graces) and stepwise notes that
  subdivide a longer reference note (passing tones) are *excused* on either side. A missing
  note next to an extra note is always a wrong note, never two excused ornaments, and extra notes
  outside the aligned span are never excused. A second pass prefers anchors that keep the
  dominant time offset.
- **Rhythm** is judged by the onset distance between consecutive aligned notes. Articulation
  (staccato, rest against held note) is ignored, and a local slip does not cascade.
- **Locating.** If the reference is much longer than the song excerpt and no `--ref-bars` are
  given, the excerpt is found inside it; the report says "Located: … bars 38..45". If the song
  side is much longer, the reference is located in it.

The scores are:

- **pitch %** = reference notes matched in pitch / (reference notes − excused ornaments +
  unexplained extra song notes);
- **rhythm %** = aligned notes with the right onset distance / the same denominator.

Exit code 0 means pass, 1 fail, 2 error. The report lists, per reference bar, the reference and
the song (transposed into the reference key) side by side, with each wrong note, rhythm error and
missing or extra note. `--cand-abc` compares two references with each other; REFERENCES.md was
triaged that way.

Caveats:

- An unrelated tune still "locates" at about 50–65 % pitch, so only results above 90 % mean
  the right tune.
- MIDI-derived references (`lotro_*`) have performance timing. Use `--tol 0.1` to `0.15`, or
  `--rhythm-min 0` with a pitch-only reading.
- Grace notes and mordent auxiliaries in the song are ignored. Tremolo is compared as one note.

### `render-song.mjs`: render and measure

```text
node scripts/music/render-song.mjs <songId> out.wav [--sr 48000] [--loops N] [--float] [--no-channels]
                                   [--target -16.6] [--tol-lu 1.5] [--json]
node scripts/music/render-song.mjs --file scratch.ts [--export name] out.wav
node scripts/music/render-song.mjs --all outdir/          # every game track + summary table
```

It renders through the real `src/audio/render.ts` in Node and writes a 16-bit WAV (`--float` for
32-bit). `--loops N` appends N−1 passes of the loop body. The report covers:

- duration and loop window: seconds, bars, and the section the loop starts at;
- integrated loudness (BS.1770 K-weighted and gated, "LUFS-ish", no true-peak) over the loop
  body, plus the whole file and the short-term maximum;
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
- loudness more than 1.5 LU off the target. All current tracks measure −16.6 LUFS, so that is the
  default target;
- seam mismatch;
- channels whose loudest 3 s are more than 30 LU below the mix.

In Node there are no decoded sample banks, so sampled instruments render with their synth
fallback. The sampler team will provide a sampled renderer.

### `selftest.sh`: check the tools

`bash scripts/music/selftest.sh` runs these checks:

- a song against an ABC export of itself (100 %);
- mutated copies of that export. 10 wrong notes and 8 rhythm swaps must FAIL; 2 wrong notes are
  listed but pass, and FAIL with `--pitch-min 100`; an octave transposition and halved note
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

- the awkward ABC cases met in the corpus;
- render-song's skipped-instrument report and seam check.

## Conventions

- **Steps and beats.** A song step is the DSL grid unit: `stepsPerBeat` steps per beat,
  `barSteps` per bar. compare.py reports "1 candidate beat = X reference quarters". For a 6/8
  song with 3 steps per beat against a reference in 6/8 eighths, X = 3/2.
- **Bar numbers** in reports: reference bars as printed by `abc2notes.py --text`. Song bars are
  1-based inside `--section`, or `section:bar` over the whole form.
- **References are reference only.** The music is public domain, but the transcriptions are not
  ours. Do not commit ABC files or copy them wholesale into the repo. Transcribe the melody into
  the DSL and prove it with compare.py.
