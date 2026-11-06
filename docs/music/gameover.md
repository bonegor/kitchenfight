# `gameover` — "Ridi, Pagliaccio" (sad accordion, sad trombone)

The defeat sting. A lone street accordion sobs Leoncavallo's "Ridi, Pagliaccio, sul tuo amore
infranto!" over soft strings and pizzicato; then a sad trombone deflates it ("wah – wah – wah –
waaah", with a flexatone wobble) and a timpani + slapstick "BONK" ends it. One-shot, 13.5 s.

Song file: [`src/audio/songs/gameover.ts`](../../src/audio/songs/gameover.ts).

## The piece

| | |
|---|---|
| Piece | "Vesti la giubba" (Canio's arioso ending Act 1), the phrase "Ridi, Pagliaccio, sul tuo amore infranto!" |
| Composer | Ruggero Leoncavallo (1857–1919) |
| Work | *Pagliacci*, premiered 21 May 1892, Teatro Dal Verme, Milan; published by Sonzogno, 1892 |
| Status | Public domain: the composer died in 1919 (more than 100 years ago) and the music was published in 1892. The ABC transcriptions are reference only and are not committed; the melody was transcribed into the DSL by hand and verified. |

## How the game plays it

`src/main.ts` `finishRun(false)`: when the chef dies, the run's music fades out over 1.5 s
(`run.ts`, `audio.stopMusic(1.5)`, with the `player_death` SFX and the "MAMMA MIA!" bubble). 2.2 s
later the results screen opens with `audio.playMusic('gameover', { fade: 0.3, restart: true })`,
and the track plays once (`loopFrom: null`) and then leaves silence. `startRun` preloads it. Because
of the 0.3 s fade-in, the accordion's cry enters at 0.39 s, after the fade. The low strings'
first note at 0.00 s is the only thing under it.

## Reference and melody proof

Reference (grade A in [`REFERENCES.md`](REFERENCES.md)): `bb_pagliacci1.abc`, the voice line in
2/4, K:G (E minor), ♩ = 46, with Leoncavallo's dotted rhythms. "Ridi, Pagliaccio, sul tuo amore
infranto!" is **bars 26–29** (12 notes). Harmony and the intro come from the piano transcription
`bb_vesti.abc` V:2–V:4, bars 25–29.

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/bb_pagliacci1.abc --bars 26-29 --dsl 1/12      # the DSL string (12 steps per beat)
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci1.abc --ref-bars 26-29 --song gameover --channel acc --section ridi
```

| Comparison (default thresholds, no `--allow-bars`, no `--resync`) | Pitch | Rhythm | Broken bars | Result |
|---|---|---|---|---|
| `bb_pagliacci1.abc` bars 26–29 (the REFERENCES.md command above) | 100 % (12/12) | 100 % (12/12) | none | **PASS** |
| `bb_vesti.abc --voice 1 --ref-bars 26-29` (piano, cross-check) | 100 % | 100 % | none | PASS |
| `bb_pagliacci2.abc --voice 1 --ref-bars 26-29` (flute, 4/4, doubled values) | 100 % | 100 % | none | PASS |
| `bb_pagliacci1.abc` without `--ref-bars` (locate) | 100 % | 100 % | none | PASS, located at bars 26..29 |

The phrase is played at the written (treble) pitch, G5–A5, an octave above the tenor's sounding
pitch. It is in the original key, E minor. Grace notes are the sob: a falling sigh {A5} into "sul"
after the catch-breath rest, and a scoop {G5} up to the high A5 of "in-FRAN-to". compare.py ignores
grace notes. The last note, G5, is held an eighth longer as a fermata, into the coda. compare.py
does not score the length of the last note.

Only the first half of the sentence is used. The track brief names this phrase, and the 9–14 s
budget leaves no room for "Ridi del duol…" (bars 30–33). The comic coda takes its place as the
"answer".

### Rubato (performance timing, written rhythm unchanged)

The DSL has one tempo, so the `rubato()` helper in the song file delays events by W(step) seconds.
It moves each note's end with its start, through the gate, so legato stays legato. Every part of
the `ridi` section gets the same warp, so the strings and pizzicato follow the soloist like an
orchestra following a singer. Grid positions and written durations do not change. That is what
`export-song --text` lists and what compare.py checks (above: 100 % rhythm). The delays:

| Note (ref. bar 28–29) | "sul" F#5 | G5 | "a-" A5 | "mo-" G5 | "re in-" F#5 | "FRAN-" A5 | "-to" G5 |
|---|---|---|---|---|---|---|---|
| Delay | +40 ms | +45 ms | +50 ms | +74 ms | +110 ms | +170 ms | +260 ms |

So the sob holds "sul" back slightly, the singer leans into the high A5 (held about 0.22 s
longer), and the fermata follows. W returns to 0 at the section end, and the fermata absorbs it,
so the coda starts in strict tempo.

## Form

2/4, ♩ = 76, 12 steps per beat (16th = 3, triplet eighth = 4). `export-song gameover --form`:

| Section | Song bars | Time | Source | Content |
|---|---|---|---|---|
| `ah` | 1 | 0.00–1.58 s | ref. bar 25 (voice + `bb_vesti` V:2/V:3) | The "Ah!" cry: accordion F#5 scooped from D#5–E5 (enters at 0.39 s). Cellos + basses play the accented falling B7 arpeggio A–F#–D#–B in octaves (Leoncavallo's lead-in), with strings B3 D#4 A4. |
| `ridi` | 2–5 | 1.58–7.89 s | ref. bars 26–29 | "Ridi, Pagliaccio, sul tuo amore infranto!" (accordion, rubato) |
| `wah` | 6–8 | 7.89–12.63 s (+0.9 s tail) | original comic coda | G5 fermata (to 8.28 s), a 0.4 s pause, then trombone G3 – F#3 – F3 (triplet quarters, 8.68 / 9.21 / 9.74 s) – E3 "waaah" (10.26–11.68 s) with the flexatone. **BONK** at 11.84 s (bar 8 beat 2): timpani E2 + slapstick + pizzicato E1/E2/B2/E3, which then ring out. |

Total 13.53 s (12.63 s of music + 0.9 s tail). The mix has decayed to about −58 dBFS RMS
before the renderer's final 80 ms fade, so the ending is clean.

### Harmony (from `bb_vesti.abc` V:2–V:4)

| Ref. bar | 25 | 26 | 27 | 28 | 29 |
|---|---|---|---|---|---|
| Chord | B7 (V7) | Am7 → Am6 (iv7 → ii∅/A) | Am7 → Am6 | Am6/C (= F#∅7/C, ii∅) | Em/B (cadential 6/4, A5 appoggiatura → G5) |
| Bass | A–F#–D#–B arpeggio | A1 (pizz) / A2 (cello) | A | C2 / C3 | B1 / B2 |
| Pizz chord, beat 2 | — | A3 C4 E4 | A3 C4 E4 | A3 C4 F#4 | B3 E4 G4 |
| Strings | B3 D#4 A4 | E4 A4 C5 | (held) | F#4 A4 C5 | E4 B4 (held with the fermata) |

The F#5 of "-di" and "-cio" over the A–C of the accompaniment is Leoncavallo's ii∅7 colour, not a
clash. The passing G5s in bar 28 sound against F#4 as in the reduction. A sonority listing found no
other dissonance. In the coda the trombone descends a minor third, chromatically, from the 3rd to
the tonic (G – F# – F♮ – E, through the Neapolitan F), unaccompanied. The BONK is an open fifth on E.

## Instrumentation

| Channel | Instrument id | Role | Range used |
|---|---|---|---|
| `acc` | `accordion` | the lone sobbing voice | D#5–A5 |
| `str` | `strings` | soft sustained chords | B3–C5 |
| `vc` | `cello` | intro arpeggio (marcato, gate 0.8); then a sustained bass line | A2–A3 |
| `cb` | `contrabass` | intro arpeggio, octave below | B1–A2 |
| `pz` | `pizz` | "pah" chords on beat 2; pizz chord on the BONK | E2–G4 |
| `db` | `uprightBass` | pizzicato bass on beat 1; low E on the BONK | E1–C2 |
| `tbn` | `trombone` | the sad "wah – wah – wah – waaah" | E3–G3 |
| `flex` | `flexatone` | the cartoon wobble on the "waaah" (variant 2, fast) | — |
| `timp` | `timpani` | the BONK (forte layer) | E2 |
| `slap` | `slapstick` | the BONK's whack (loud layer) | — |

**Accordion, not violin.** The brief allows both. The recorded solo violin (SSO) has a slow bow
swell: measured on isolated notes, it is −10 dB 35–90 ms after the onset, −6 dB after 150–230 ms
and −3 dB only after 320–370 ms. In the first draft this smeared the dotted 16th and the triplets:
a new note took 100–210 ms to become the loudest pitch. The button accordion reaches −3 dB within
25–30 ms. So the dotted "sob" rhythm stays crisp, the grace notes speak, and the street-accordion
colour ties the track to the rest of the soundtrack.

**Trombone.** The recorded notes start about 39 cents sharp and settle within about 0.3 s, a
natural droop that suits the sad trombone. A second trombone a quarter-tone flat was also tried
for a beating "wobble" on the last note. It added only 0.8 dB of envelope modulation, so it was
dropped, and the flexatone does the wobble.

## Levels (sample render)

`node scripts/music/render-song.mjs gameover out.wav` (recorded samples, 53 sets):

```text
gameover: 13.53 s @ 48000 Hz, 66 events
  one-shot (no loop)
  form: ah@0.00s ridi@1.58s wah@7.89s
  whole: integrated -16.4 LUFS (whole file -16.4), short-term max -15.1 LUFS, RMS -19.6 dBFS, sample peak -4.37 dBFS
  soft clipper: 0 samples (0.000 %), DC 0.00000, first sound at 0.000 s
  spectral balance: <250 Hz -11.2 dB, 250 Hz-4 kHz -0.4 dB, >4 kHz -21.7 dB (share of total energy)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  acc          accordion          13      0      -16.8    -0.3       -15.8       -8.5
  str          strings            11     -6      -27.4   -11.0       -26.1      -15.6
  vc           cello               7     -3      -28.3   -11.8       -25.9      -12.4
  cb           contrabass          4     -4      -27.8   -11.3       -29.9      -16.5
  pz           pizz               15     -3      -30.6   -14.1       -33.1      -12.5
  db           uprightBass         5     -1      -28.8   -12.4       -30.9      -13.1
  tbn          trombone            4      2      -17.7    -1.3       -17.4       -4.7
  flex         flexatone           1     -3      -25.9    -9.4       -29.8      -12.5
  timp         timpani             1      0      -21.4    -4.9       -26.1       -7.0
  slap         slapstick           1      0      -28.8   -12.4       -36.6       -6.7
  warnings: none
```

- `gainDb` −3.6 gives −16.4 LUFS over the whole file (one-shot target −16.4 ± 0.5). The peak is
  −4.4 dBFS, and the soft clipper never engages.
- The accordion leads the lament (0.3 LU under the mix) and the trombone leads the coda (1.3 LU
  under the mix).
- Momentary loudness (400 ms) runs about −14 to −18 LUFS through the lament and the coda. The
  "waaah" is −15 to −16. The BONK has the highest sample peak of the track (−4.4 dBFS against −6.7
  in the lament).
- Accompaniment: strings, cello and pizzicato sit 11–14 LU under the mix: soft, but present on every beat.
- Pitch check (YIN on the solo stems): accordion notes within ±5 cents, trombone notes within
  ±6 cents once settled.
- No clicks: second-difference scan of the mix.
- **Chromium:** `audiotest.html` `__at.samplerTrack('gameover')` decodes the MP3 sprites with
  Chromium's decoder and renders in the real worker. Its output equals the Node render to
  −92 dB, at the same −16.45 LUFS / −4.37 dBFS, with no console errors.

Other checks: `node scripts/music/export-song.mjs gameover --form` reports no sequencer warnings,
and `node scripts/music/selftest/formcheck.mjs` says "ok gameover 66 events, 3 form entries,
one-shot, 12.631579 s". `npx tsc --noEmit` is clean for the song file.
