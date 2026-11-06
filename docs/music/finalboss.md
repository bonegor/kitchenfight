# `finalboss`: "Dies irae" (Verdi, Messa da Requiem)

| | |
|---|---|
| Piece | "Dies irae", the opening of No. 2 *Sequenza* of the *Messa da Requiem* |
| Composer | Giuseppe Verdi |
| Year | 1874 (first performed 22 May 1874, Milan, San Marco) |
| Public domain | Yes: Verdi died in 1901 and the score was published by Ricordi in 1874, out of copyright everywhere. The arrangement is new; only Verdi's notes (as listed below) are taken from the reference. |
| Track | `src/audio/songs/finalboss.ts`, export `finalboss`, id `finalboss`: the final boss at 15:00, looping |
| Key / meter / tempo | G minor (Verdi's key), 4/4, ♩ = 84 (`bpm: 84`, `stepsPerBeat: 8`, `barSteps: 32`: one step = a 32nd note, the note value of Verdi's runs and swirl). Verdi writes *Allegro agitato* ♩ = 80; 84 is a touch more relentless for gameplay. |
| Length | 65.7 s of music (23 bars): intro 2.86 s (bar 1, played once), loop body 62.86 s (bars 2–23); rendered buffer 69.7 s including the 4 s seam pad |

## Reference

`/home/user/kitchenfight-refs/abc/lotro_diesirae.abc`, the only candidate (grade C in
[`REFERENCES.md`](REFERENCES.md)): six LOTRO parts dumped by BruTE from a MIDI performance, no bar
lines, durations like `2079/4924` of a quarter at `Q:125`. REFERENCES.md confirms it is **Verdi's**
setting (G-minor hammer chords, descending runs, the G–F♯ swirl), not the chant and not Mozart.
abc2notes cuts each part into pseudo-bars of 4 file quarters; the pseudo-bar numbers below are the
ones `abc2notes.py --tune N --text` prints.

**Use: pitches only**, as REFERENCES.md says (`--locate --tol 0.15 --rhythm-min 0`). Each LOTRO
part is a reduction of several orchestral and choral voices (top note of each chord in
abc2notes), so every line is proved against the part that carries it cleanly:

| Part (`--tune`) | LOTRO instrument | What it carries in the opening |
|---|---|---|
| 1 | clarinet | the violin-I line of the runs bar, including the end of the C♯°7 plunge (C♯5 held, G♯4–A4–B4–D5); hammer chords topped by D5 |
| 2 | flute | REFERENCES.md's default part: hammer chords topped by G5, the runs, the scale — but on beats 3–4 of the runs bar its top line jumps between inner voices (B♭4 B♭3 G4 E5 A4 F4 …), and in the swirl the chord tops read G5 where the swirl is on F♯ |
| 4 | bagpipes | one line in octaves, silent during the orchestral bars: the **chorus** line ("Dies irae, dies illa / solvet saeclum in favilla", "teste David cum Sibylla"; later soft repeated-note phrases that fit the chorus's sotto-voce "Quantus tremor") |
| 5 | pibgorn | the bass arpeggios of the runs bar, then the **swirl** G4–F♯4 as clean single notes |
| 6 | drums | one LOTRO drum note for every stroke (timpani and bass drum are not distinguished) |

Reference map (file quarters at Q:125, as printed by my own parse of the raw events and by
`abc2notes.py --text`; the beat is 1.53–1.60 file quarters, i.e. ♩ ≈ 78–82):

| Verdi bar (counted from the start of the Dies irae) | 1st statement | 2nd statement | Material |
|---|---|---|---|
| 1 / 6 | 0.70–5.50 (pseudo-bars 1–2) | 31.71–36.59 (8–10) | four G-minor tutti chords, one per beat, each about a 16th long |
| 2 / 7 | 7.08–13.4 (2–4) | 38.21–44.3 (10–12) | runs G5→G4 (beats 1, 2: 8 notes of 0.19 = 32nds), C♯°7 arpeggio B♭5 G5 E5 C♯5 (beat 3), F/A then D/F♯ (beat 4, 8ths) |
| 3–4 / 8–9 | 13.44–25.64 (4–7) | 44.35–56.16 (12–15) | chorus: G (1 beat) F♯ F E E♭ D C (½ beat each), D C B♭ C D E♭ D C B♭ (⅓ beat: triplets), C (⅞ beat) D (⅛) → G; over the swirl G–F♯ in 32nds |
| 5 / 10 | 25.64–31.71 (7–8) | 56.16–61.96 (15–16) | unison scale with turns, 32 notes of 0.19 = 32nds, G5 → G2 |
| 11–12 / 13–14 | 61.96–74.78 (16–19) | 74.78–87.53 (19–22) | "teste David cum Sibylla": chorus F5 E5 F5 E5 on the four off-beats, then D5 (beat 2) E5 (2½) E5 (3, held) A5 (4½, fff) |

Drum part (tune 6): in the first hammer bar it strikes only with the chords (on the beats); in the
second hammer bar it strikes **every eighth** (31.71 32.56 33.38 34.19 35.00 35.81 36.59 37.40), and
in both runs bars on beat 1 and then **the four off-beats** (7.08 7.88 9.45 11.01 12.63; 38.21 38.96
40.51 42.02 43.58). That is Verdi's famous gran cassa: timpani with the chords, the bass drum on the
off-beats.

## Melody proofs (compare.py at default thresholds, MIDI-reference tolerances)

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
C="$PY scripts/music/compare.py --abc $REFS/lotro_diesirae.abc --locate --tol 0.15 --rhythm-min 0 --song finalboss"
$C --tune 1 --channel vln   --section A --bars 1-2              # hammer chords + runs (Verdi 1-2)
$C --tune 4 --channel choir --section A --bars 3-5              # chorus "Dies irae, dies illa" (Verdi 3-5)
$C --tune 5 --channel vln   --section A --bars 3-4              # the swirl (Verdi 3-4)
$C --tune 2 --channel vln   --section A --bars 5 --allow-bars 7 # the unison scale (Verdi 5), see below
$C --tune 4 --channel choir --section B --bars 1-2              # "teste David cum Sibylla" (Verdi 11-12)
$C --tune 4 --channel choir --section B --bars 1-2 --scale 8/5  # same, at the MIDI's local beat (rhythm check)
```

First statements:

| Passage | Reference (located) | Song side | Pitch | Rhythm | Result |
|---|---|---|---|---|---|
| Hammer chords + runs | tune 1, pseudo-bars 8–11 (33 notes) | `vln`, A bars 1–2 | 100.0 % | 72.7 % | PASS |
| Chorus "Dies irae, dies illa / solvet saeclum in favilla" → G | tune 4, 4–7 (19 notes) | `choir`, A bars 3–5 | 100.0 % | 100.0 % | PASS |
| Swirl G–F♯ | tune 5, 4–7 (63 notes) | `vln`, A bars 3–4 | 96.9 % | 98.4 % | PASS |
| Unison scale | tune 2, 7–8 (28 notes; bar 7 allowed) | `vln`, A bar 5 | 100.0 % | 100.0 % | PASS |
| "teste David cum Sibylla" | tune 4, 16–19 (8 notes) | `choir`, B bars 1–2 | 100.0 % | 37.5 % (100.0 % with `--scale 8/5`) | PASS |

Restatements (same commands, other sections/channels), all PASS at 100.0 % pitch: the motif in
`A2` (`choir`, 100 / 100), on the trombones in `A2` (`tbn`, two octaves down), on the bassoons
(`bsn`, brk bars 1–2), the xylophone (`xylo`, brk bars 3–4) and the "oh" choir (`choirO`, brk bars
5–6) — 100 / 100 each against tune 4 — and the second "teste David" (B bars 3–4, `--scale 8/5`:
100 / 100).

What the remaining numbers mean:

- **Rhythm** does not count for this reference (`--rhythm-min 0`): compare.py scales the song by a
  fixed 3/2 while the MIDI performance breathes between 1.53 and 1.60 file quarters per beat, so
  long excerpts drift past the 0.15 tolerance. At the MIDI's local beat (`--scale 8/5`) the
  "teste David" bars score 100 % rhythm, i.e. the off-beat sighs are where the performance has
  them. The runs bar's 72.7 % also contains "merged" notes: the MIDI re-strikes the held C♯5 four
  times and A4 three times.
- **Hammer + runs against tune 2** (the flute part REFERENCES.md names): 67.6 %, FAIL. The flute's
  chords are topped by G5 where my strings' chord tops D5 (the trumpets carry the G5), and its top
  line on beats 3–4 of the runs bar interleaves inner voices. Tune 1 carries the same runs and the
  violin line through those beats; the two parts agree on the runs (except the last 32nd of beat 2:
  E♭5 in the flute, G4 in the clarinet) and on the arpeggio B♭5 G5 E5 C♯5.
- **Swirl against tune 2:** 94.1 %: the flute's chords `[F♯4 F♯5 G5]` read G5 where the swirl is on
  F♯. Against tune 5 the only difference is the pibgorn's bass G3 just before its swirl starts.
- **Scale, `--allow-bars 7`** — a reference defect that REFERENCES.md does not list yet (worth
  adding there): in all four melodic parts the MIDI's legato overlaps on beat 1 of the scale are
  written as chords, `[D5 F5 G5]`, `[C♯5 D5]`, `[C5 B♭4]` (the horn part has `[G4 F5 G5 E♭5]`), so the
  top-note line reads G5 G5 D5 D5 C5 and hides F5, E♭5, C♯5 and B♭4. Without `--allow-bars 7` the bar
  scores 90.0 % (27/30): exactly those three notes (F5 against the chord-top G5, E♭5 and C♯5 as
  extras). Pseudo-bar 7 also holds the end of the swirl (proved above against tune 5) and the first
  half of beat 2. The second statement shows the turn of beat 1 as single notes (D5 C♯5 D5 C5 B♭4 at
  56.71–57.45), so beat 1 reads G5 F5 E♭5 D5 C♯5 D5 C5 B♭4; beats 2½–4 (18 notes) are proved as is.

### What was verified, and what comes from the score as I know it

Verified against the reference (pitch and, via the beat grid above, the note values): every note of
the hammer chords' top line, the runs, the C♯°7 plunge and its end (C♯5–G♯4–A4–B4–D5), the swirl, the
chorus motif with its triplets and the C–D→G cadence, the unison scale, the "teste David" chorus
line; the bass of the runs bar (G–E♭–E–F–F♯ arpeggios, tune 5) and the chords of the runs bar (horn
part: Gm, E♭/G, E°, F/A, D/F♯); the harmony of "teste David" (Dm, Am/C, Gm/D, Eø7, A: horn and
pibgorn parts); the percussion rhythm (tune 6).

From knowledge of Verdi's score, consistent with the reference but not provable from it: the bar
lines and the 4/4 Allegro agitato ♩ = 80 (the reference has none; its beat grid fits); that the
off-beat strokes are the bass drum and the on-beat strokes the timpani (tune 6 has one drum note
for both); that the bagpipe line is the chorus; the orchestration below. The C♯5 grace before the
D5 at the end of the runs bar is the first statement's quick B4–C♯5 pair (the second statement
shows only B4).

## Form

| Section | Song bars | Time (s) | Verdi | Texture |
|---|---|---|---|---|
| `intro` | 1 | 0.00–2.86 | — | Doom: tam-tam, organ pedal G1–D2–G2, the "oh" choir humming G minor, timpani roll on D crescendo, suspended-cymbal roll. Played once. |
| `A` | 2–6 | 2.86–17.14 | 1–5 | **Hammer bar**: tutti G-minor chords on the beats (strings, brass, trumpets, tuba, basses, timpani G), the bass drum THWACKING every off-beat, crash on 1. **Runs**: strings in octaves rush down (two scales, the C♯°7 plunge), brass chords E♭/G, C♯°7/E, F, D/F♯, trumpet top G-G-G-A-F♯, cellos in 16th arpeggios over the rising bass G–E♭–E–F–F♯, bass drum on 1 and the off-beats. **Chorus** (2 bars): the choir in octaves shouts the motif over the violins' G–F♯ swirl, G pedal in the basses, cellos in 8ths, timpani; cadence C–D→G. **Scale**: the unison scale with turns from G5 to G2 (violins, violas an octave down for two beats, basses and trombones joining for the last two), bass-drum and cymbal rolls and a timpani roll on D into the next hammer bar. |
| `A2` | 7–11 | 17.14–31.43 | 6–10 | The same, heavier: tam-tam and **frying-pan clangs on the bass-drum thwacks** (the kitchen joke), piccolo doubling the runs two octaves up, trombones doubling the motif two octaves down, horns and organ pedal under the chorus. |
| `B` | 12–15 | 31.43–42.86 | 11–14 | "Teste David cum Sibylla" in D minor: violins' rising 32nds to an accented high A and falling arpeggios, brass and bass drum on the off-beat accents with the choir's F–E sighs, cellos' arpeggios, basses D–C, organ pedal; the B♭–A shake, then the A-major rising scale and the fff A-major blow (crash; tam-tam the second time). Twice, as in Verdi. |
| `brk` | 16–21 | 42.86–60.00 | motif of 3–4 | The cartoon break, subito piano after the fff: the motif sneaks by on bassoons in octaves (staccato) over a tuba oom-pah, pizzicato off-beats, timpani G–D, woodblock ticks and a slapstick crack; then skeleton xylophone + piccolo; then the "oh" choir murmurs it with the horns over the returning swirl, crescendo, timpani roll on D. |
| `bld` | 22–23 | 60.00–65.71 | — | The dominant build: rising D-scale runs per beat (D3→D4→D5→D6), brass stabs and the choir on D7 in crescendo, horns, organ, basses in 8ths then 16ths, timpani, bass-drum and cymbal rolls; the sustained parts cut off on beat 4½ so the hammer blows land on a clean G minor. → loop to `A`. |

Loop: `loopFrom: 1` (section `A`, bar 2), body 22 bars = 62.86 s. The build ends on D7 and the loop
restarts on the G-minor hammer blows, as the intro's D roll does on the first pass.

## Instrumentation

| Channel | Instrument | Role |
|---|---|---|
| `vln` | `strStab` | violins (with the celli in the low notes): hammer chords, runs, swirl, scale, "teste David" figures, build runs |
| `vla` | `strStab` | the runs and the swirl an octave down, start of the scale, build |
| `strS` | `strings` | the held A-major chord of "teste David" |
| `vc` | `cello` | 16th arpeggios (runs bar), 8th pulse (chorus), arpeggios and the A-major scale (B) |
| `cb` | `contrabass` | bass line, G pedal, end of the scale |
| `pizz` | `pizz` | off-beat chords in the break |
| `brass` | `brass` | tutti chords, off-beat accents, build stabs |
| `trp` | `trumpet` | top G5 of the hammer chords, G-G-G-A-F♯ in the runs bar |
| `tbn` | `trombone` | motif two octaves down (A2), end of the scale |
| `horn` | `brassSoft` | pedal and chords under the chorus (A2), motif in the break, build |
| `tuba` | `tuba` | hammer chords, break oom-pah, build |
| `choir` | `choir` | **lead**: the motif in octaves, the "teste David" sighs, the D7 build |
| `choirO` | `choirO` | intro hum, the murmured motif in the break |
| `organ` | `organ` | doom pedals (intro, A2 chorus, B, build) |
| `bsn` | `bassoon` | comic motif in octaves (break) |
| `picc` | `piccolo` | runs two octaves up (A2), comic motif (break) |
| `xylo` | `xylophone` | skeleton motif (break) |
| `timp` | `timpani` | G with the hammer chords, D rolls, D/A in B, G–D in the break |
| `bd` | `bassDrum` | the off-beat THWACKS (hits, ff layer) |
| `bdR` | `bassDrum` | rolls (variant 1; velocity kept under 0.5, the only layer with a roll) |
| `crash` | `crash` | piatti on the hammer and the fff blows |
| `cym` | `cymbal` | suspended-cymbal rolls (variant 1, velocity under 0.7) into the hammer bars |
| `tam` | `tamtam` | intro, A2 downbeat, end of B |
| `pan` | `panClang` | frying-pan clangs on the A2 thwacks |
| `wb`, `slap` | `woodblock`, `slapstick` | break ticks and cracks |

Ranges stay inside the natural ones (violins G3+, the low end of the strStab lines being the celli;
basses down to G1; trumpets F♯4–A5; trombones G2–D4; bassoons B♭1–G3; piccolo up to B♭6; xylophone
B♭4–G5; timpani A1–A2).

## Levels (sample render)

```bash
node scripts/music/render-song.mjs finalboss out.wav
```

Recorded samples (53 sets). 69.71 s @ 48 kHz, 2061 events.

| Measure | Value |
|---|---|
| Loop body (bars 2–23, 62.86 s) | **−16.4 LUFS** integrated (whole file −16.6), short-term max −13.6 LUFS, RMS −19.1 dBFS |
| Sample peak | **−2.43 dBFS** |
| Soft clipper | 364 samples (0.005 %) |
| Loop seam | −93.2 dBFS mismatch |
| Spectral balance | < 250 Hz −6.3 dB, 250 Hz–4 kHz −1.2 dB, > 4 kHz −22.8 dB |
| Lead | `choir` solo −18.5 LUFS = −2.1 LU against the mix; strings `vln` −5.5 LU; brass −7.4 LU; bass drum −8.6 LU; timpani −11.0 LU |
| Warnings | none |
| `gainDb` | −6.8 |

Per section (my solo renders, LUFS over each section; the break is meant to breathe):

| | intro | A | A2 | B | brk | bld |
|---|---|---|---|---|---|---|
| mix | −20.0 | −16.2 | −15.0 | −15.4 | −20.4 | −16.4 |
| choir + choirO | −23.6 | −18.1 | −17.3 | −18.3 | −23.2 | −23.2 |
| strings | — | −19.5 | −18.4 | −21.7 | −25.3 | −19.4 |
| brass + tuba | — | −21.9 | −22.7 | −24.5 | −30.9 | −26.0 |
| percussion | −23.9 | −23.8 | −23.4 | −24.0 | −31.6 | −23.5 |

In the hammer bars the 32nd-by-32nd envelope alternates chord (beat) and bass-drum stroke
(off-beat) at the same level (about −16/−17 dB RMS), and below 120 Hz the off-beat thwacks stand
8 dB above the chords.
