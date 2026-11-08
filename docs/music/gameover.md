# `gameover` — "Ridi, Pagliaccio" (sad accordion, sad trombone)

The defeat sting. A lone street accordion sobs Leoncavallo's "Ridi, Pagliaccio, sul tuo amore
infranto!" over soft strings and pizzicato; then a sad trombone deflates it ("wah – wah – wah –
waaah", with a flexatone wobble) and a timpani + slapstick "BONK" ends it. One-shot, 13.8 s.

Song file: [`src/audio/songs/gameover.ts`](../../src/audio/songs/gameover.ts).

## The piece

| | |
|---|---|
| Piece | "Vesti la giubba" (Canio's arioso ending Act 1), the phrase "Ridi, Pagliaccio, sul tuo amore infranto!" |
| Composer | Ruggero Leoncavallo (1857–1919) |
| Work | *Pagliacci*, premiered 21 May 1892, Teatro Dal Verme, Milan; published by Sonzogno, 1892 |
| Status | Public domain: the composer died in 1919 (more than 100 years ago) and the music was published in 1892. The ABC transcriptions are reference only and are not committed; the melody was transcribed into the DSL by hand and verified. |

## How the game plays it

`src/main.ts` `finishRun(false)`: when the chef dies, `src/game/run.ts` fades the run's music out
over 1.5 s (`audio.stopMusic(1.5)`, with the `player_death` SFX and the "MAMMA MIA!" bubble).
2.2 s later the results screen opens with `audio.playMusic('gameover', { fade: 0.3, restart: true })`,
and the track plays once (`loopFrom: null`) and then leaves silence. `startRun` preloads it.
The 0.3 s fade-in is a linear gain ramp, so nothing important starts inside it: only the strings'
B7 chord (a slow bowed swell) starts at 0.00 s. The accordion's cry and the first stroke of the
orchestra's arpeggio come at 0.39 s, after the fade.

## Reference and melody proof

Reference (grade A in [`REFERENCES.md`](REFERENCES.md)): `bb_pagliacci1.abc`, the voice line in
2/4, K:G (E minor), ♩ = 46, with Leoncavallo's dotted rhythms. REFERENCES.md defines the theme as
bars 26–33: "Ridi, Pagliaccio, sul tuo amore infranto! Ridi del duol che t'avvelena il cor!".
Harmony and the intro come from the piano transcription `bb_vesti.abc` V:2–V:4, bars 25–29.

### Deliberate cut: bars 30–33 are not played (approved by the lead)

Approved: the brief asks for the phrase "Ridi, Pagliaccio, sul tuo amore infranto", and the full sentence would
push this one-shot past 20 s against its 9–14 s budget.

The track plays only the first half of the sentence, bars 26–29, "Ridi, Pagliaccio, sul tuo amore
infranto!" (12 notes). It stops on "-to" (bar 29) and never plays bars 30–33, "Ridi del duol che
t'avvelena il cor!". The comic coda takes their place as the "answer". Reasons:

- the track brief names exactly this phrase ("the 'Ridi, Pagliaccio, sul tuo amore infranto'
  phrase") and asks for a one-shot of 9–14 s;
- bars 26–29 already take 7.2 s here (1.58–8.78 s at ♩ = 76 with the rubato and the fermata),
  and the whole track is 13.8 s. Bars 30–33 would add at least 6.3 s (four more bars), so the track
  would run past 20 s.

So the REFERENCES.md command, run exactly as written, **fails**, by design: the four bars that are
not played count as missing. The liberty is declared with `--allow-bars 30-33`, and the run
narrowed to the bars played passes on its own:

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/bb_pagliacci1.abc --bars 26-29 --dsl 1/12      # the DSL string (12 steps per beat)
# 1. REFERENCES.md, as written (FAIL: bars 30-33 are not played)
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci1.abc --ref-bars 26-33 --song gameover --channel acc --section ridi
# 2. the same, with the cut declared (PASS)
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci1.abc --ref-bars 26-33 --allow-bars 30-33 --song gameover --channel acc --section ridi
# 3. narrowed to the bars played (PASS)
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci1.abc --ref-bars 26-29 --song gameover --channel acc --section ridi
# cross-checks
$PY scripts/music/compare.py --abc $REFS/bb_vesti.abc --voice 1 --ref-bars 26-29 --song gameover --channel acc --section ridi
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci2.abc --voice 1 --ref-bars 26-29 --song gameover --channel acc --section ridi
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci1.abc --song gameover --channel acc --section ridi
```

| Comparison (default thresholds, no `--resync`) | Pitch | Rhythm | Broken bars | Result |
|---|---|---|---|---|
| 1. `bb_pagliacci1.abc --ref-bars 26-33`, the REFERENCES.md command as written | 57.1 % (12/21) | 57.1 % (12/21) | 30, 31, 32, 33 (every note missing) | **FAIL**: the cut |
| 2. the same with `--allow-bars 30-33` (the cut declared) | 100 % (12/12) | 100 % (12/12) | none | **PASS** |
| 3. narrowed to the bars played: `bb_pagliacci1.abc --ref-bars 26-29` | 100 % (12/12) | 100 % (12/12) | none | **PASS** |
| `bb_vesti.abc --voice 1 --ref-bars 26-29` (piano, cross-check) | 100 % | 100 % | none | PASS |
| `bb_pagliacci2.abc --voice 1 --ref-bars 26-29` (flute, 4/4, doubled values: 1 beat = 2 ref. quarters) | 100 % | 100 % | none | PASS |
| `bb_pagliacci1.abc` without `--ref-bars` (locate) | 100 % | 100 % | none | PASS, located at bars 26..29 |

Inside bars 26–29 every note is Leoncavallo's, in pitch and in written rhythm (the rubato and the
fermata below change only the performance timing, not the grid that compare.py reads). The phrase
is played at the written (treble) pitch, G5–A5, an octave above the tenor's sounding pitch, in the
original key, E minor. Grace notes are the sob: a falling sigh {A5} into "sul" after the
catch-breath rest, and a scoop {G5} up to the high A5 of "in-FRAN-to". compare.py ignores grace
notes, and it does not score the length of the last note (the fermata).

### Rubato and fermata (performance timing, written rhythm unchanged)

The DSL has one tempo, so the `rubato()` helper in the song file delays each event by W(step)
seconds and moves its end by W(end step), through the gate. A note therefore sounds
W(end) − W(start) longer than written: W rising across a note is a tenuto, W falling moves on,
and legato stays legato. Every part of the `ridi` section gets the same warp, so the strings, cello,
bass and pizzicato follow the soloist like an orchestra following a singer. W never goes back to 0:
the delay stays to the end of the section, the fermata comes on top of it, and the coda starts
after a breath. `fermata()` is applied inside `rubato()`, so the warp sees the held note's real
end. Grid positions and written durations do not change: that is what `export-song --text` lists
and what compare.py checks (above: 100 % rhythm).

| Note (ref. bars 26–29) | "Ri-" G5 | "-di" F#5 | "Pa-" E5 | "-gliac-" G5 | "-cio" F#5 | "sul" F#5 | "tuo" G5 | "a-" A5 | "mo-" G5 | "re in-" F#5 | "FRAN-" A5 | "-to" G5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Onset delay | 0 | +100 ms | +80 ms | +70 ms | +170 ms | +170 ms | +177 ms | +183 ms | +190 ms | +240 ms | +300 ms | +390 ms |
| Sounds | 0.83 s | 0.53 s | 0.17 s | 0.83 s | 0.69 s | 0.25 s | 0.25 s | 0.25 s | 0.42 s | 0.18 s | 0.82 s | **1.29 s** |
| Written × gate 0.93 | 0.73 s | 0.55 s | 0.18 s | 0.73 s | 0.73 s | 0.24 s | 0.24 s | 0.24 s | 0.37 s | 0.12 s | 0.73 s | 0.73 s |

- "**RI**-di, Pa-**GLIAC**-cio": the two accented downbeat G5s each get a 100 ms tenuto (agogic
  weight). Part of it is won back on "-di, Pa-" (−30 ms) and on "-cio" (−40 ms).
- The sob holds the catch-breath rest before "sul" 40 ms longer. Then the singer leans into
  "in-**FRAN**-to": "mo-" +50 ms, the F#5 of "re in-" +60 ms, the high A5 +90 ms.
- **Fermata** on "-to": the G5 is written 9 steps longer (21 steps × gate 0.93 = 1.29 s), 1.56 times
  the A5 before it. Measured on the accordion stem (G5 partial, 100 ms smoothing for the reed's
  beating, until 10 dB below its sustain level), it sounds 1.43 s against 0.92 s for the A5. The
  strings and cello hold the Em/B chord 8 steps longer, so they let go with the accordion: G5 at
  8.78 s, strings and cello at 8.81 s.

## Form

2/4, ♩ = 76, 12 steps per beat (16th = 3, triplet eighth = 4). `export-song gameover --form`:
ah@0.00 s, ridi@1.58 s, wah@7.89 s, 8 bars = 12.63 s of grid, plus a 1.16 s tail.

| Section | Song bars | Time | Source | Content |
|---|---|---|---|---|
| `ah` | 1 | 0.00–1.58 s | ref. bar 25 (voice + `bb_vesti` V:2/V:3) | Strings B3 D#4 A4 from 0.00 s (swelling in under the fade). The "Ah!" cry: accordion F#5, scooped from D#5–E5 (0.30–0.39 s), lands at 0.39 s with the first of four accented strokes of the falling B7 arpeggio A–F#–D#–B (0.39 / 0.69 / 0.99 / 1.28 s). Cellos and basses bowed in octaves, the upright bass plucking the lower octave with them. |
| `ridi` | 2–5 | 1.58–7.89 s on the grid; sounds 1.58–8.81 s | ref. bars 26–29 | "Ridi, Pagliaccio, sul tuo amore infranto!" (accordion, rubato as above). Fermata G5 7.49–8.78 s. |
| `wah` | 6–8 | 7.89–12.63 s (+1.16 s tail) | original comic coda | A 0.30 s breath after the fermata, then the trombone from step 18: G3 – F#3 – F3 in triplet quarters (9.08 / 9.61 / 10.13 s), E3 "waaah" 10.66–11.96 s with the flexatone wobble. **BONK** at 12.11 s (bar 8, a triplet eighth after beat 2): timpani E2 + slapstick + upright bass E1 + pizzicato E2/B2/E3, which then ring out. |

Total 13.79 s. In the 100 ms before the renderer's final 80 ms fade the mix is at −59.2 dBFS RMS
(−50.1 dBFS peak), so the ring-out has decayed and the ending is clean.

### Harmony (from `bb_vesti.abc` V:2–V:4)

| Ref. bar | 25 | 26 | 27 | 28 | 29 |
|---|---|---|---|---|---|
| Chord | B7 (V7) | Am7 → Am6 (iv7 → ii∅/A) | Am7 → Am6 | Am6/C (= F#∅7/C, ii∅) | Em/B (cadential 6/4, A5 appoggiatura → G5) |
| Bass | A–F#–D#–B arpeggio (cello A3…B2, contrabass + upright bass A2…B1) | A1 (pizz) / A2 (cello) | A | C2 / C3 | B1 / B2 |
| Pizz chord, beat 2 | — | A3 C4 E4 | A3 C4 E4 | A3 C4 F#4 | B3 E4 G4 |
| Strings | B3 D#4 A4 | E4 A4 C5 | (held) | F#4 A4 C5 | E4 B4 (held with the fermata) |

The F#5 of "-di" and "-cio" over the A–C of the accompaniment is Leoncavallo's ii∅7 colour, not a
clash. The passing G5s in bar 28 sound against F#4 as in the reduction. A sonority listing found no
other dissonance. In the coda the trombone descends a minor third, chromatically, from the 3rd to
the tonic (G – F# – F♮ – E, through the Neapolitan F), unaccompanied: the strings' last E4–B4 has
died away to about 20 dB under the first "wah". The BONK is an open fifth on E.

**The intro arpeggio (deliberate change of rhythm).** Leoncavallo writes bar 25's arpeggio as
four accented eighths from the downbeat. Here the four strokes are compressed into the bar's last
three eighths (four dotted sixteenths, 0.30 s apart instead of 0.39 s) and start an eighth late,
with the cry. At 0.00 s the first stroke sat inside the game's 0.3 s fade-in: its first 60 ms lost
16.8 dB (−31.8 → −48.6 dB), its whole stroke 2.0 dB. Now it starts at 0.39 s, at full level.

## Instrumentation

| Channel | Instrument id | Role | Range used |
|---|---|---|---|
| `acc` | `accordion` | the lone sobbing voice | D#5–A5 |
| `str` | `strings` | soft sustained chords | B3–C5 |
| `vc` | `cello` | intro arpeggio, detached strokes (gate 0.6); then a sustained bass line | A2–A3 |
| `cb` | `contrabass` | intro arpeggio, octave below (gate 0.6) | B1–A2 |
| `pz` | `pizz` | "pah" chords on beat 2; pizz chord on the BONK | E2–G4 |
| `db` | `uprightBass` | plucks the intro arpeggio's lower octave (the attack of each accent); pizzicato bass on beat 1; low E on the BONK | E1–A2 |
| `tbn` | `trombone` | the sad "wah – wah – wah – waaah" | E3–G3 |
| `flex` | `flexatone` | the cartoon wobble on the "waaah" (variant 2, fast) | — |
| `timp` | `timpani` | the BONK (forte layer) | E2 |
| `slap` | `slapstick` | the BONK's whack (loud layer) | — |

**The arpeggio's accents.** The recorded bowed cello and contrabass notes swell: on isolated
strokes (dry, 10 ms RMS) the old eighths peaked 166–309 ms after their onsets and reached −3 dB of
their peak only after 98–153 ms, just before the next stroke. So the four accents sounded as four
swells. Now the strokes are detached (gate 0.6, 0.18 s each) and the upright bass plucks the lower
octave with them. Its velocities (0.62 / 0.78 / 0.72 / 0.70) even out the sample zones, so the four
plucks peak within 2.3 dB of each other. Each pluck sits 0.5–2.1 dB under the bowed peak of its
stroke (RMS over the stroke −3.1 to +1.8 dB): the bow is still the body and the pluck is the
attack. A quieter pluck was tried first (velocities 0.6 / 0.54 / 0.54 / 0.58, 5–7 dB under the
bowed peak on strokes 2–4), but strokes 2–4 then still needed 54–73 ms to reach −3 dB.

| Stroke (isolated, dry) | A | F# | D# | B |
|---|---|---|---|---|
| before: −3 dB reached after | 153 ms | 98 ms | 106 ms | 130 ms |
| before: level 30 ms after the onset, re the stroke's peak | −13.5 dB | −9.8 dB | −13.4 dB | −12.9 dB |
| now: −6 dB / −3 dB reached after | 6 / 13 ms | 22 / 50 ms | 15 / 28 ms | 25 / 49 ms |
| now: level 30 ms after the onset, re the stroke's peak | −1.0 dB | −5.7 dB | −3.0 dB | −4.7 dB |

In the track (cello + contrabass + upright bass stem, with the reverb and the game's fade), each
of strokes 2–4 rises 5.7 / 3.9 / 4.2 dB above the end of the previous stroke within 40 ms, against
−0.1 / 0.6 / 1.5 dB before. Below 300 Hz in the full mix the rises are 12.9 / 3.9 / 4.3 dB, against
2.2 / 1.4 / 4.0 dB before.

**Accordion, not violin.** The brief allows both. The recorded solo violin (SSO) has a slow bow
swell: measured on isolated notes, it is −10 dB 35–90 ms after the onset, −6 dB after 150–230 ms
and −3 dB only after 320–370 ms. In the first draft this smeared the dotted 16th and the triplets:
a new note took 100–210 ms to become the loudest pitch. The button accordion reaches −3 dB within
25–30 ms. So the dotted "sob" rhythm stays crisp, the grace notes speak, and the street-accordion
colour ties the track to the rest of the soundtrack.

**Trombone.** The recorded notes start sharp and settle within about 0.3 s, a natural droop that
suits the sad trombone. Pitch (YIN on the solo stem, from 0.1 s after each onset): medians G3
+4.6, F#3 +6.1, E3 +2.7 cents; the short F3 is still settling (median +20.5 cents). A second
trombone a quarter-tone flat was also tried for a beating "wobble" on the last note. It added only
0.8 dB of envelope modulation, so it was dropped, and the flexatone does the wobble.

## Levels (sample render)

`node scripts/music/render-song.mjs gameover out.wav` (recorded samples, 54 sets):

```text
gameover: 13.79 s @ 48000 Hz, 70 events
  one-shot (no loop)
  form: ah@0.00s ridi@1.58s wah@7.89s
  whole: integrated -16.3 LUFS (whole file -16.3), short-term max -14.3 LUFS, RMS -19.6 dBFS, sample peak -1.54 dBFS
  soft clipper: 22 samples (0.002 %), DC 0.00000, first sound at 0.001 s
  spectral balance: <250 Hz -10.3 dB, 250 Hz-4 kHz -0.5 dB, >4 kHz -19.2 dB (share of total energy)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  acc          accordion          13    0.9      -16.6    -0.3       -14.8       -5.7
  str          strings            11   -4.2      -27.4   -11.1       -26.3      -15.7
  vc           cello               7   -3.5      -29.6   -13.2       -27.8      -13.3
  cb           contrabass          4   -8.5      -30.5   -14.2       -33.5      -20.0
  pz           pizz               15     -4      -30.8   -14.5       -33.2      -13.7
  db           uprightBass         9     -1      -28.3   -12.0       -28.9      -13.0
  tbn          trombone            4      2      -18.3    -2.0       -17.9       -5.5
  flex         flexatone           1     -3      -26.1    -9.7       -30.0      -12.8
  timp         timpani             1      1      -21.1    -4.7       -26.3       -7.4
  slap         slapstick           1      0      -27.8   -11.5       -36.6       -6.7
  warnings: none
```

- `gainDb` −3.8 gives −16.35 LUFS over the whole file (one-shot target −16.4 ± 0.5). The peak is
  −1.54 dBFS, on the BONK (12.109 s): there the slapstick's crack and the timpani stroke's attack
  add up in phase (each alone peaks at −6.7 dBFS), over the soft clipper's knee (0.62 =
  −4.15 dBFS). The clipper rounds 22 samples (0.002 %), all in the BONK, and takes 0.2 dB off its
  peak (−1.37 dBFS before it).
- The accordion leads the lament (0.3 LU under the mix) and the trombone leads the coda (2.0 LU
  under the mix).
- Momentary loudness (BS.1770 momentary, as `ffmpeg -af ebur128` reports it: 400 ms windows every
  100 ms, time = window end): the lament (from the cry to the end of the fermata, windows ending
  0.8–8.9 s) runs from −21.3 LUFS (5.2 s: the catch-breath rest before "sul") to −12.3 LUFS
  (7.3–7.4 s: the high A5 of "in-FRAN-to" going into the fermata), and the held G5 swells back to
  −12.8 (8.8 s). The breath before the trombone dips to −22.7 LUFS (9.2 s). The trombone runs from
  −19.4 LUFS (11.0 s: the soft start of the "waaah") to −15.6 LUFS (11.5 s: "waaah" + flexatone);
  the BONK reads −15.5 (12.2 s).
- Sample peaks: the lament (0–9.0 s) −4.31 dBFS at 6.64 s (the accordion's high A5 of
  "in-FRAN-to" over the strings' chord); the trombone −5.51 dBFS at 9.52 s; the BONK −1.54 dBFS at
  12.109 s, the track's peak.
- Accompaniment: strings, cello, contrabass, pizzicato and upright bass sit 11–15 LU under the mix:
  soft, but present on every beat.
- Pitch (YIN on the accordion stem): medians +2.0 to +3.3 cents on the held notes.
- No clicks: the only spike in a second-difference scan of the mix (ratio to its 20 ms
  neighbourhood) is the slapstick's crack on the BONK.
- **Chromium:** `audiotest.html` `__at.samplerTrack('gameover')` decodes the MP3 sprites with
  Chromium's decoder and renders in the real worker (no console errors, bank report ok, 54 sets).
  Its output equals the Node render within 16-bit quantization (no sample more than one 16-bit
  step apart, −90.3 dBFS), at the same −16.3 LUFS / −1.54 dBFS.

Other checks: `node scripts/music/export-song.mjs gameover --form` reports no sequencer warnings,
and `node scripts/music/selftest/formcheck.mjs` says "ok gameover 70 events, 3 form entries,
one-shot, 12.631579 s". `npx tsc --noEmit` is clean.

## Review fixes (2026-11-06)

An independent review of the first version (commit aeb18e2) found four problems. All four were
confirmed by measurement and fixed as follows.

1. **The REFERENCES.md command failed and the doc did not say so.** The literal command
   (`--ref-bars 26-33`) gives FAIL, 57.1 % / 57.1 %, broken bars 30–33, because the track stops at
   bar 29. The doc labelled its narrowed 26–29 run "the REFERENCES.md command". Now the cut is
   recorded above as a deliberate deviation, with the literal result, the `--allow-bars 30-33`
   run and the reasons, for the lead to sign off. Three figures of the old doc were also wrong;
   measured again on the old render with the methods used here: the accordion's last G5 ended at
   8.205 s (only the strings ran to 8.29 s); the lament's sample peak was −5.68 dBFS at 1.618 s,
   not −6.7; momentary loudness dipped to −20.4 LUFS in the lament (5.1 s), −20.2 in the coda
   (10.6 s) and −26.5 in the pause before the trombone (8.8 s), not "−14 to −18". Every number
   in this doc is now measured on the final render.
2. **The fermata on "-to" was inaudible.** `fermata()` was applied after `rubato()`, so the warp
   still ended the note at the written end, and W fell back to 0 there. The note started 0.26 s
   late, so the 6 extra steps added only 0.11 s: G5 0.841 s against 0.824 s for the A5 before it.
   0.48 s of near-silence followed. Now the fermata is inside the warp, W stays up, and the hold is
   9 steps: the G5 sounds 1.29 s (1.56 times the A5). To keep a short breath, the trombone now
   enters at wah step 18 instead of 12 (9.08 s instead of 8.68 s). The pause is 0.30 s (momentary
   minimum −23.3 LUFS, was −26.5). The "waaah" is 22 steps (1.30 s, was 1.42 s), the BONK moved
   from step 60 to 64 (12.11 s), and the tail grew from 0.9 s to 1.16 s, keeping 1.69 s of ring-out
   after the BONK. Total 13.53 → 13.79 s, inside the 9–14 s budget.
3. **The accented B7 arpeggio swelled instead of striking, and its first note sat inside the
   fade-in.** Fixed as described under "The arpeggio's accents" and "The intro arpeggio" above:
   strokes after the fade, detached, plucked attack from the upright bass.
4. **"Ri-di, Pa-gliac-cio" ran strictly on the grid.** The rubato now starts at step 0. Each
   accented downbeat G5 gets a 100 ms tenuto (0.83 s instead of 0.73 s), and the time is partly won
   back inside the phrase (table above). compare.py still reads 100 % / 100 %.
