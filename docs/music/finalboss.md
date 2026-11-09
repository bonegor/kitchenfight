# `finalboss`: "Dies irae" (Verdi, Messa da Requiem)

| | |
|---|---|
| Piece | "Dies irae", the opening of No. 2 *Sequenza* of the *Messa da Requiem* |
| Composer | Giuseppe Verdi |
| Year | 1874 (first performed 22 May 1874, Milan, San Marco) |
| Public domain | Yes: Verdi died in 1901 and the score was published by Ricordi in 1874, out of copyright everywhere. The arrangement is new; only Verdi's notes (as listed below) are taken from the reference. |
| Track | `src/audio/songs/finalboss.ts`, export `finalboss`, id `finalboss`: the final boss at 15:00, looping |
| Key / meter / tempo | G minor (Verdi's key), 4/4, ♩ = 84 (`bpm: 84`, `stepsPerBeat: 8`, `barSteps: 32`: one step = a 32nd note, the note value of Verdi's runs and swirl). Verdi writes *Allegro agitato* ♩ = 80; 84 is a touch more relentless for gameplay. |
| Length | 65.7 s of music (23 bars): intro 2.86 s (bar 1, played once), loop body 62.86 s (bars 2–23); rendered buffer 71.7 s including the 6 s seam pad |

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
40.51 42.02 43.58).

## Melody proofs (compare.py at default thresholds, MIDI-reference tolerances)

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
C="$PY scripts/music/compare.py --abc $REFS/lotro_diesirae.abc --locate --tol 0.15 --rhythm-min 0 --song finalboss"
# first statements
$C --tune 1 --channel vln   --section A --bars 1-2              # hammer chords + runs (Verdi 1-2)
$C --tune 4 --channel choir --section A --bars 3-5              # chorus "Dies irae, dies illa" (Verdi 3-5)
$C --tune 4 --channel choir,trpC,clar --section A --bars 3-5    # the same line as heard: choir + its doublings
$C --tune 5 --channel vln   --section A --bars 3-4              # the swirl (Verdi 3-4)
$C --tune 2 --channel vln   --section A --bars 5 --allow-bars 7 # the unison scale (Verdi 5), see below
$C --tune 4 --channel choir --section B --bars 1-2              # "teste David cum Sibylla" (Verdi 11-12)
$C --tune 4 --channel choir --section B --bars 1-2 --scale 8/5  # same, at the MIDI's local beat (rhythm check)
# restatements and doublings
$C --tune 4 --channel choir --section A2   --bars 3-5
$C --tune 4 --channel trpC  --section A    --bars 3-4           # trumpets (A); same with --section A2
$C --tune 4 --channel clar  --section A    --bars 3-4           # clarinets (A); same with --section A2 and --section gath --bars 1-2
$C --tune 4 --channel tbn   --section A2   --bars 3-4           # trombones: bars 3-4 only, see below
$C --tune 4 --channel bsn   --section brk  --bars 1-2
$C --tune 4 --channel xylo  --section brk  --bars 3-4           # same for --channel picc
$C --tune 4 --channel choir --section gath --bars 1-2           # same for --channel tbn
$C --tune 4 --channel choir --section B    --bars 3-4 --scale 8/5
```

First statements:

| Passage | Reference (located) | Song side | Pitch | Rhythm | Result |
|---|---|---|---|---|---|
| Hammer chords + runs | tune 1, pseudo-bars 8–11 (33 notes) | `vln`, A bars 1–2 | 100.0 % | 72.7 % | PASS |
| Chorus "Dies irae, dies illa / solvet saeclum in favilla" → G | tune 4, 4–7 (19 notes) | `choir`, A bars 3–5 | 100.0 % | 100.0 % | PASS |
| The same line with its doublings | tune 4, 4–7 (19 notes) | `choir,trpC,clar`, A bars 3–5 | 100.0 % | 100.0 % | PASS |
| Swirl G–F♯ | tune 5, 4–7 (63 notes) | `vln`, A bars 3–4 | 96.9 % | 98.4 % | PASS |
| Unison scale | tune 2, 7–8 (28 notes; bar 7 allowed) | `vln`, A bar 5 | 100.0 % | 100.0 % | PASS |
| "teste David cum Sibylla" | tune 4, 16–19 (8 notes) | `choir`, B bars 1–2 | 100.0 % | 37.5 % (100.0 % with `--scale 8/5`) | PASS |

Restatements, each 100.0 % pitch / 100.0 % rhythm against tune 4 (pseudo-bars 4–7, 18 notes for
the two motif bars, 19 with the cadence G): the chorus in `A2` (`choir`, bars 3–5); the trumpets
(`trpC`) and clarinets (`clar`) in unison with it in `A` and `A2` (bars 3–4); the trombones an
octave below in `A2` (`tbn`, bars 3–4); the bassoons (`bsn`, brk bars 1–2); the xylophone and the
piccolo (`xylo`, `picc`, brk bars 3–4); the chorus, clarinets and trombones in `gath` (bars 1–2);
and the second "teste David" (B bars 3–4, `--scale 8/5`: 8 notes, 100 / 100).

**The trombone command must stop at bar 4.** `tbn` also plays the end of the unison scale in bar 5
(beats 3–4, D4 → G2), so `--channel tbn --section A2 --bars 3-5` reads those 16 notes against the
chorus line and FAILS (pitch 90.0 %, rhythm 85.0 %, broken bar 12). With `--bars 3-4` it passes
100 / 100.

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

### What was verified, and what comes from the score or the arrangement

Verified against the reference (pitch and, via the beat grid above, the note values): every note of
the hammer chords' top line, the runs, the C♯°7 plunge and its end (C♯5–G♯4–A4–B4–D5), the swirl, the
chorus motif with its triplets and the C–D→G cadence, the unison scale, the "teste David" chorus
line; the bass of the runs bar (G–E♭–E–F–F♯ arpeggios, tune 5) and the chords of the runs bar (horn
part: Gm, E♭/G, E°, F/A, D/F♯); the harmony of "teste David" (Dm, Am/C, Gm/D, Eø7, A: horn and
pibgorn parts).

**Not** verified, and deliberate: the percussion. Tune 6 has one drum note for every stroke and
strikes only with the chords in the first hammer bar; off-beat strokes appear in its second hammer
bar (every eighth) and in both runs bars (beat 1 + the four off-beats). The song's runs bars follow
that, but its bass drum also strikes the four off-beats of the **first** hammer bar (`BD_A`, steps
4/12/20/28; in `A2` the timpani on the beats plus the bass drum on the off-beats give every eighth,
as tune 6's second hammer bar). That is an arrangement choice: the off-beat gran-cassa thwack is the
passage's signature and the track must drive from its first bar. That the off-beat strokes are the
bass drum and the on-beat strokes the timpani is from the score as I know it, not provable from tune
6.

From knowledge of Verdi's score, consistent with the reference but not provable from it: the bar
lines and the 4/4 Allegro agitato ♩ = 80 (the reference has none; its beat grid fits); that the
bagpipe line is the chorus. The C♯5 grace before the D5 at the end of the runs bar is the first
statement's quick B4–C♯5 pair (the second statement shows only B4). The orchestration (who doubles
the chorus, the break, the organ) is the arrangement's, see below.

## Articulation of the chorus line

The recorded choir (`choir`, `choirO`) releases with a 0.4 s time constant (`src/audio/sampled.ts`),
longer than the motif's eighths (357 ms) and triplets (238 ms). Sung exactly as written by the
choir alone it smears the triplet bar into clusters. Two changes fix it in every statement of the
motif sung by the chorus (`A`, `A2`, `gath`):

1. **An articulate doubling in unison and an octave below** (`MOTIF_A`, all notes of the motif):
   trumpets (`trpC`) and clarinets (`clar`) in unison in `A` and `A2`; in `A2` also the trombones an
   octave below (lighter on the triplets, see below); in `gath` clarinets in unison and trombones an
   octave below. The trumpets carry the attack (their energy is in the upper partials); the
   clarinets give the line a strong fundamental (at equal loudness a trumpet's fundamental is about
   9 dB under the choir's, so trumpets alone barely move a fundamental-only measurement).
2. **The choir shapes its line** (`choirLine`): bar 3 slightly detached (gate 0.7; the last C
   staccato so it does not ring into the triplets), bar 4 at 0.85× velocity with gate 0.5 (the lower
   octave at 0.6× of that, because its 2nd harmonics fall on the top line's fundamentals). The
   chorus still leads bar 3 ("Dies irae, dies illa") and sings every note of bar 4; the brass and
   clarinets lead the triplets ("solvet saeclum in favilla").

Measurement (scratch tool, not committed; same method as the review): render the lead channels
solo through the real renderer with reverb send 0; for each note of the chorus's top line take an
80 ms Hann window centred at 70 % of the note; **F** = magnitude at the previous note's fundamental
relative to the current note's (the review's measure); **Favg** = the same as a power ratio over
windows at 60/65/70/75/80 %; **H** = energy of partials 1–6 of the previous note relative to those
of the current note (these are all seconds, so no partials coincide). Negative = the previous
pitch has died away.

Section A (song bars 4–5), per note. "Before" = commit aeb18e2, choir solo (the review measured the
same notes at −2.8, +3.5, −0.8, −2.3, −3.7, −4.5 and +10 dB); "after" = choir + trumpets + clarinets:

| Note (time) | F before | F after | H after |
|---|---|---|---|
| F♯5 (9.29 s) | −11.5 | −12.5 | −15.3 |
| F5 (9.64 s) | −3.8 | −20.8 | −20.1 |
| E5 (10.00 s) | −5.3 | −11.3 | −17.8 |
| E♭5 (10.36 s) | −4.4 | −4.9 | −11.4 |
| D5 (10.71 s) | −8.2 | −12.0 | −13.4 |
| C5 (11.07 s) | −16.5 | −17.0 | −12.5 |
| triplets: D5 (11.43 s) | −2.9 | −3.2 | −10.5 |
| C5 (11.67 s) | −4.5 | −3.6 | −8.6 |
| B♭4 (11.90 s) | −7.0 | −4.4 | −11.0 |
| C5 (12.14 s) | −10.9 | −9.4 | −12.0 |
| D5 (12.38 s) | **+2.9** | −10.0 | −10.5 |
| E♭5 (12.62 s) | −13.1 | −5.9 | −10.0 |
| D5 (12.86 s) | −0.5 | −2.8 | −8.8 |
| C5 (13.10 s) | −6.4 | −6.4 | −8.3 |
| B♭4 (13.33 s) | −2.0 | −5.6 | −11.1 |
| C5 (13.57 s) | −16.0 | −20.3 | −21.9 |
| closing 32nd D5 (14.20 s) | **+9.6** | −15.2 | −12.3 |

Summaries (worst / median, dB):

| Passage | Lead channels | Triplets F | Triplets Favg | Triplets H | Eighths F | Eighths H | 32nd D: F / H |
|---|---|---|---|---|---|---|---|
| A, before (aeb18e2) | `choir` | +2.9 / −4.5 | — | — | −3.8 / −5.3 | — | +9.6 / — |
| A, choir alone after shaping | `choir` | +8.6 / −1.9 | +7.9 / −2.2 | +0.2 / −3.5 | −6.0 / −9.4 | −6.0 / −7.4 | −7.5 / −11.6 |
| A | `choir,trpC,clar` | −2.8 / −5.6 | −3.6 / −5.9 | −8.3 / −10.5 | −4.9 / −12.0 | −11.4 / −13.4 | −15.2 / −12.3 |
| A2 (song bars 9–10) | `choir,trpC,clar,tbn` | −1.2 / −8.2 | −0.8 / −7.4 | −7.0 / −11.1 | −3.8 / −16.0 | −8.7 / −15.3 | +0.3 / −4.2 |
| gath (song bars 20–21) | `choir,clar,tbn` | +4.1 / −6.9 | −1.6 / −7.4 | −2.6 / −9.1 | +5.8 / −10.5 | −2.0 / −10.6 | −8.1 / −7.8 |

Notes:

- A2's eighths F worst (−3.8, F♯5 at 23.57 s) is a window-position effect: Favg −8.0, H −8.7. The
  positive F worsts are single windows too: over the five positions and over the partials the
  previous pitch is under the new one (gath's F♯5 at 55.00 s, F +5.8: Favg −0.3, H −2.0; its first
  triplet D5 at 57.14 s, F +4.1: Favg −1.6, H −2.6; A2's closing 32nd D5 at 28.48 s, F +0.3:
  Favg −0.8, H −4.2).
- Unison and octave doublings can cancel one partial for a whole note when two samples happen to
  be in anti-phase. With the trombones at full level on the triplets, A2's first triplet D5
  (25.71 s) read F +4.4: the clarinets' D5 (36.3 dB, −148°) and the trombones' 2nd harmonic of D4
  (32.6 dB, +35°) cancelled, leaving the D5 fundamental at 16.7 dB, while H stayed at −11.2 dB.
  The trombones therefore play the triplet bar lighter (0.68 against 1.0 in bar 3), which keeps
  any such cancellation partial: that note now reads F −5.0, Favg −7.4, H −7.8.

## Form

| Section | Song bars | Time (s) | Verdi | Texture |
|---|---|---|---|---|
| `intro` | 1 | 0.00–2.86 | — | Doom: tam-tam, organ G1–G2–D3–G3, the "oh" choir humming G minor, timpani roll on D crescendo, suspended-cymbal roll. Played once. |
| `A` | 2–6 | 2.86–17.14 | 1–5 | **Hammer bar**: tutti G-minor chords on the beats (strings, brass, trumpets, tuba, basses, timpani G), the bass drum THWACKING every off-beat, crash on 1, the triangle on blows 2–4. **Runs**: strings rush down (violins G5…, violas an octave lower; the glockenspiel an octave above the violins), brass chords E♭/G, C♯°7/E, F, D/F♯ with the triangle, trumpet top G-G-G-A-F♯, cellos in 16th arpeggios over the rising bass G–E♭–E–F–F♯, bass drum on 1 and the off-beats. **Chorus** (2 bars): the choir in octaves with trumpets and clarinets in unison sings the motif over the violins' G–F♯ swirl (violas an octave lower), the basses hold G in the first bar, then move G–C–G–C–D (i–iv–i–iv–V) under the triplets, cellos in 8ths, timpani; cadence C–D→G. **Scale**: the unison scale with turns from G5 to G2 (violins, the glockenspiel an octave above them down to G5; violas one octave below for the first two beats, G4 → E♭3, the basses then continue one octave below from D3; trombones in unison with the violins for the last two beats), bass-drum and cymbal rolls and a timpani roll on D into the next hammer bar. |
| `A2` | 7–11 | 17.14–31.43 | 6–10 | The same, heavier: crash and a louder tam-tam on 1 (its roar blooms between the hammer blows) and **frying-pan clangs on the four off-beat thwacks** (the kitchen joke), piccolo doubling the runs **one octave above the violins** (G6 → G5), the chorus doubled by trumpets and clarinets in unison and **trombones an octave below**, **organ chords** G2–D3–G3 / C3–E♭3–G3 under the chorus. |
| `B` | 12–15 | 31.43–42.86 | 11–14 | "Teste David cum Sibylla" in D minor: violins' rising 32nds to an accented high A and falling arpeggios, brass and bass drum on the off-beat accents with the choir's F–E sighs, cellos' arpeggios, basses D–C; the organ doubles the bass line in octaves with a chord tone on top, chord by chord (D–A, C–A, D–G, E–G, A–E); timpani D2 and A2; the B♭–A shake, then the A-major rising scale and the fff A-major blow (crash, a suspended-cymbal swell into it; tam-tam the second time). The triangle rings with the off-beat accents, the glockenspiel doubles the violins' top line an octave up. Twice, as in Verdi. |
| `brk` | 16–19 | 42.86–54.29 | motif of 3–4 | The cartoon break: the motif sneaks by on bassoons in octaves (staccato, bars 1–2), then on skeleton xylophone + piccolo an octave above (bars 3–4), over an oom-pah that keeps the pulse: tuba on every beat, pizzicato chords on every off-beat (G3–G4–B♭4 under the motif's chromatic bar, so no D meets its E♭; then G minor / C minor), timpani G and bass drum on beats 1 and 3, a woodblock tick on the off-beats, a slapstick crack on beat 4½ of bars 2 and 4. |
| `gath` | 20–21 | 54.29–60.00 | motif of 3–4 | The storm gathers (its own 2-bar section, so the crescendo spans exactly these bars): the chorus sings the motif again with clarinets in unison and trombones an octave below, crescendo 0.8 → 1.1 (trombones 0.75 → 1.1); the violas swirl G4–F♯4 underneath, crescendo 0.55 → 1.1; the basses and tenors hum a low G ("oh"); the basses and cellos in 8ths, G in the first bar, then G–C–G–C–D (i–iv–i–iv–V) under the triplets; timpani G and a G roll (G minor and C minor both contain G); cymbal roll. |
| `bld` | 22–23 | 60.00–65.71 | — | The dominant build: rising D-scale runs per beat (D3→D4→D5→D6), brass stabs and the choir on D7 in crescendo, horns, organ D2–A2–D3 then D2–A2–C3–F♯3, basses in 8ths then 16ths, timpani on D, bass-drum and cymbal rolls, the triangle on the brass stabs of bar 2; the sustained parts cut off on beat 4½ so the hammer blows land on a clean G minor. → loop to `A`. |

Loop: `loopFrom: 1` (section `A`, bar 2), body 22 bars = 62.86 s. The build ends on D7 and the loop
restarts on the G-minor hammer blows, as the intro's D roll does on the first pass.

## Instrumentation

| Channel | Instrument | Role |
|---|---|---|
| `vln` | `strStab` | string section in unison/octaves: hammer chords, runs, swirl, scale, "teste David" figures, build runs |
| `vla` | `strStab` | the runs and the swirl an octave below the violins, the first two beats of the scale one octave below (G4 → E♭3), the swirl in `gath`, build |
| `strS` | `strings` | the held A-major chord of "teste David" |
| `vc` | `cello` | 16th arpeggios (runs bar), 8th pulse (chorus, `gath`), arpeggios and the A-major scale (B) |
| `cb` | `contrabass` | bass line, G pedal, end of the scale, build |
| `pizz` | `pizz` | off-beat "pah" chords in the break |
| `brass` | `brass` | tutti chords, off-beat accents, build stabs |
| `trp` | `trumpet` | top G5 of the hammer chords, G-G-G-A-F♯ in the runs bar |
| `trpC` | `trumpet` | the chorus line in unison with the choir (A, A2) |
| `clar` | `clarinet` | the chorus line in unison with the choir (A, A2, `gath`) |
| `tbn` | `trombone` | the chorus line an octave below the choir (A2, `gath`), the last two beats of the unison scale (A, A2) |
| `horn` | `brassSoft` | the D7 chord in the build |
| `tuba` | `tuba` | hammer chords, the break's oom, build |
| `choir` | `choir` | **lead**: the motif in octaves, the "teste David" sighs, the D7 build |
| `choirO` | `choirO` | intro hum, the hummed low G in `gath` |
| `organ` | `organ` | doom: intro chord, chords under the A2 chorus, the B bass line, the build |
| `bsn` | `bassoon` | comic motif in octaves (break bars 1–2) |
| `picc` | `piccolo` | runs an octave above the violins (A2), comic motif an octave above the xylophone (break bars 3–4) |
| `xylo` | `xylophone` | skeleton motif (break bars 3–4) |
| `timp` | `timpani` | G with the hammer chords, D rolls, D/A in B, G on 1 and 3 in the break, G roll in `gath`, D in the build |
| `bd` | `bassDrum` | the off-beat THWACKS (hits, ff layer), off-beat accents in B, beats 1 and 3 in the break |
| `bdR` | `bassDrum` | rolls (variant 1; velocity kept under 0.5, the only layer with a roll) |
| `crash` | `crash` | piatti on the hammer bars' downbeats (A, A2), the chorus entries (A, A2), A2's scale and the fff blows of B |
| `cym` | `cymbal` | suspended-cymbal rolls (variant 1: the bank's bright crescendo roll, at its peak on the downbeat it swells into; velocity 0.28–0.67) into the hammer bars, the fff blows of B and the build |
| `tam` | `tamtam` | intro, A2 downbeat, end of B (the last two at velocity 1.3 / 1.2) |
| `tri` | `triangleInst` | the tutti accents: hammer blows 2–4 and the runs bar's chords (A, A2), the off-beat accents of B, the brass stabs of the build |
| `glock` | `glock` | the violins an octave up: the runs and the first half of the scale (A, A2), the top line of "teste David" (B) |
| `pan` | `panClang` | frying-pan clangs on the A2 thwacks |
| `wb`, `slap` | `woodblock`, `slapstick` | break ticks and cracks |

Ranges (from `export-song.mjs`): `strStab` lines D2–D6 (the recorded set is the string section,
zones G1–E7: lines below G3 are the lower strings), trumpets F♯4–A5 (`trp`) and B♭4–G5 (`trpC`),
clarinets B♭4–G5, trombones G2–G4, horns D3–F♯4, tuba G1–D2, choir B♭3–A5, `choirO` G2–G4, organ
G1–A3, bassoons B♭1–G3, piccolo G5–B♭6, xylophone B♭4–G5, cellos E♭2–E4, basses G1–E♭3, pizzicato
G3–B♭4, **timpani D2–A2** (the "teste David" strokes and roll that were on A1, below the
instrument, are on A2).

## Levels (sample render)

```bash
node scripts/music/render-song.mjs finalboss out.wav
```

Recorded samples (54 sets). 71.71 s @ 48 kHz (with the 6 s loop pad), 2523 events.

| Measure | Value |
|---|---|
| Loop body (bars 2–23, 62.86 s) | **−16.3 LUFS** integrated (−16.26; whole file −16.4), short-term max −14.2 LUFS, RMS −19.1 dBFS |
| Sample peak | **−1.56 dBFS** |
| Soft clipper | 480 samples (0.007 %) |
| Loop seam | −131.4 dBFS mismatch |
| Spectral balance | < 250 Hz −6.4 dB, 250 Hz–4 kHz −1.2 dB, > 4 kHz −18.8 dB (−22.2 before the polish: see "Polish" at the end) |
| Lead | `choir` −20.5 LUFS solo (−4.3 LU); the chorus as heard (`choir,trpC,clar`) −1.4 LU in A's chorus bars, with `tbn` −1.9 LU in A2's; bassoons −2.5 LU and xylophone + piccolo −2.0 LU in the break; `choir,clar,tbn` −1.7 LU in `gath` |
| Other channels (loop body, vs mix) | strings `vln` −6.5 LU, brass −8.8, trumpets `trpC` −6.7, trombones −8.9, organ −8.1, clarinets −8.6, bass drum −10.1, timpani −12.0, tam-tam −11.0, glockenspiel −12.8, cymbal −15.5, triangle −16.2, crash −18.3 |
| Warnings | none |
| `gainDb` | −7.8 |

Per section (gated LUFS over each section, the loop sections as they repeat; solo renders of
channel groups: strings = violins, violas, sustained strings, cellos, basses and pizzicato; brass +
tuba = brass, trumpets, trombones, horns and tuba; percussion = timpani, bass drums, crash, cymbal,
tam-tam, triangle, glockenspiel, pan, woodblock and slapstick):

| | intro | A | A2 | B | brk | gath | bld |
|---|---|---|---|---|---|---|---|
| mix | −20.6 | −16.7 | −15.7 | −14.9 | −18.0 | −18.3 | −15.6 |
| choir + choirO + trpC + clar | −24.3 | −18.2 | −19.2 | −18.1 | — | −20.5 | −21.5 |
| strings | — | −20.5 | −20.0 | −23.5 | −26.7 | −25.0 | −20.2 |
| brass + tuba | — | −24.0 | −22.7 | −25.6 | −27.4 | −27.0 | −23.5 |
| bassoons + piccolo + xylophone | — | — | −22.1 | — | −20.2 | — | — |
| organ | −29.2 | — | −27.3 | −23.3 | — | — | −24.3 |
| percussion | −24.3 | −23.4 | −22.6 | −23.8 | −25.1 | −28.2 | −23.5 |

— = the group does not play there (at most a reverb tail of the previous section).

Per bar (K-weighted LUFS of the mix over each bar, the loop as it repeats; loop body −16.3):

| Bars | Section | LUFS per bar |
|---|---|---|
| 2–6 | A | −18.6, −15.9, −15.5, −17.3, −16.8 |
| 7–11 | A2 | −17.4, −14.5, −14.5, −16.7, −16.3 |
| 12–15 | B | −15.1, −14.8, −15.2, −14.6 |
| 16–19 | brk | −17.4, −18.5, −18.3, −17.6 |
| 20–21 | gath | −19.1, −17.5 |
| 22–23 | bld | −17.6, −14.3 |

The break and the gathering are a breath, not a drop-out: at most 2.0 LU under the loop body
(before the review fixes they reached −22.4 LUFS, 6 LU under it, and the loop swung 8.5 LU; now
the quietest bar is −19.1, the gathering's first, and the loudest −14.3, the build's last).

What the review asked to make audible (mix vs the mix without the channel, same bars; measured
when the review fixes went in, on the bank of that time and before the polish below, whose own
measurements of the crash, tam-tam, cymbal, triangle and glockenspiel are at the end):

| Element | Contribution |
|---|---|
| Break pulse | tuba −28 LUFS per bar (+1.2 dB at 30–120 Hz), timpani −31.5 per bar (was −37 to −41), woodblock +2.5 dB at 1–4 kHz under the bassoons and +1.0 dB under the xylophone (the xylophone strikes the same off-beats); slapstick +8.7 / +3.9 dB at 1–8 kHz over 120 ms |
| A2 piccolo (bar 8) | solo −22.1 LUFS, +1.6 dB at 1–4 kHz, +1.9 dB at 600–1500 Hz |
| A2 trombones (bars 9–10) | solo −22.3 LUFS (−7.5 LU), +1.5 dB at 600–1500 Hz |
| A2 trumpets (bars 9–10) | +1.3 dB at 1–4 kHz |
| A2 pan clangs (bar 7) | +4.7, +6.2, +9.5, +16.2 dB at 2–8 kHz over 150 ms |
| Organ | A2 chorus +1.6 dB at 150–600 Hz; B +1.2 dB at 30–120 Hz and +1.7 dB at 150–600 Hz; build +2.0 dB at 30–120 Hz; intro +2.0 dB at 30–120 Hz |
| `gath` | lead (`choir,clar,tbn`) −19.0 LUFS against −22.9 for everything else; violas' swirl +1.2 dB at 1–6 kHz |

In the hammer bars the envelope alternates chord (beat) and bass-drum stroke (off-beat); at the
review fixes, below 120 Hz the off-beat thwacks stood about 5.5 dB above the chords (RMS over each
16th, A and A2).

## Changes after the review

- The chorus line is doubled by trumpets and clarinets in unison (A, A2), plus trombones an octave
  below (A2, `gath`); the choir sings bar 3 slightly detached and bar 4 lighter and shorter
  (`choirLine`). Section "Articulation of the chorus line" has the before/after numbers.
- The 6-bar break is now `brk` (4 bars, comic) + `gath` (2 bars, crescendo), so `cresc` spans the
  bars where the parts play. The break keeps a pulse (tuba on every beat, pizzicato and woodblock
  on the off-beats, timpani and bass drum on 1 and 3) and sits 1.5–1.9 LU under the loop body.
- In `gath` the swirl moved to the violas, an octave below the chorus; the chorus (`choir`, not the
  darker `choirO`) leads with clarinets and trombones; the basses' pedal is softer.
- A2: trombones an octave below the chorus, louder piccolo, organ chords under the chorus, pan
  clangs with no crash on that downbeat; the A2 horns were dropped (with the organ they only
  thickened 150–600 Hz). The organ is 8 dB up and voiced in G2–G3 (A2) and as an octave bass line
  in B; B's bars 2/4 no longer hold A under Gm/D and Eø7 (D–G, then E–G).
- Break bars 1 and 3: the pizzicato chord under the motif's chromatic bar has no D (G3–G4–B♭4), and
  the timpani play G only, so the E♭ (bassoons, xylophone, piccolo) meets no D.
- Timpani A1 → A2 in B. The `gath` roll is on G (on D it rubbed against C minor).
- The violas' half of the unison scale is one octave below the violins (it was two, G3 → E♭2), so
  the line runs on into the basses' D3.

## Polish: the bright cymbal roll, the tam-tam, and high-frequency life

**Method** (scratch script on the full render, recorded bank, the review's method): for each note,
the largest third-octave rise of the mix over the mix without that channel (63 Hz–12.5 kHz, bands
within 40 dB of the window's loudest); a part is heard when its notes rise 3 dB or more in their
own band. Windows: rolls over their last 150 ms, hits over their first 100 ms, the tam-tam also
over its bloom. "Cymbal vs mix" and "lead vs mix" are momentary (400 ms, K-weighted) loudness at
that point; the lead is the chorus with its doublings, or the violins.

**Cymbal rolls.** The bank's suspended-cymbal roll was rebuilt bright (SSO's crescendo roll,
spectral centroid about 4 kHz on its peak instead of 0.6 kHz). A review had found every swell
inaudible with the old roll; with the new one, at the unchanged `cym` gain (+5.9 dB), each swell
crested clearly but under the tune.

A second review found that the rolls did not reach their downbeats: the cymbal was gated at 90 % of
the written length, so the release began before each downbeat (B's swells were 0.6 dB down at the
fff blows), and the roll's crescendo was 0.76 s long, so B's 1.07 s swells held flat at their end
while the short rolls (0.36 and 0.71 s) ended below the roll's peak. Both are fixed in the sampler
(see `docs/credits/music-samples.md`): the cymbal plays its written length, and every roll note
grows evenly over its whole length into its peak on the downbeat, so its crest is now set by its
velocity alone; the held roll also plays at the stereo loudness of the old VCSL roll, 1.5 dB under
the bright roll's first build. Re-balanced so every roll crests where it crested before (within
0.4 dB, the cymbal's own K-weighted level over the 150 ms up to it), now on its downbeat: `cym` gain
+5.9 → +5.4 dB, A's and A2's four-roll crescendo 0.35 / 0.45 / 0.55 / 0.66 → 0.28 / 0.37 / 0.45 /
0.55, B's swells 0.45 / 0.55 → 0.55 / 0.67. The 0.36 s rolls of A and A2 now end in the roll's
bright peak (4–12 kHz 3–6.5 dB higher at the same crest), and the four join into one crescendo:
each grows 4 dB and starts within 1.5 dB of where the one before it ended.

Rises in the last 150 ms before each downbeat (each roll note); cover, cymbal and lead there for the
loudest:

| Swell (velocities) | Rise on the downbeat (each roll note) | Cover | Cymbal vs mix / lead vs mix |
|---|---|---|---|
| intro (0.3 → 0.62) | +9.9, +24.4, **+28.4 dB** | 0.55 LU | −9.5 LU / (doom pad only) |
| A, into A2's hammer (0.28 → 0.55) | +8.7, +12.1, +17.8, **+19.8 dB** | 0.26 LU | −12.0 / −3.7 LU |
| A2, into B (0.28 → 0.55) | +8.0, +12.1, +20.0, **+18.0 dB** | 0.27 LU | −12.5 / −3.2 LU |
| B, into each fff blow (0.55 / 0.67) | **+11.5 / +13.7 dB** | 0.15 / 0.29 LU | −14.8 / −12.0 LU against −3.7 / −3.5 LU |
| gath (0.3 → 0.45) | +7.4, **+12.9 dB** | 0.12 LU | −16.3 / −5.0 LU |
| bld, into the loop (0.3 → 0.66) | +2.8, +6.3, +9.0, **+25.8 dB** | 0.47 LU | −10.1 / −5.3 LU |

(The build's roll is a crescendo out of the texture: its first quarter-beat is under the band, its
end rises 26 dB where the sustained parts cut off on beat 4½.)

**Tam-tam** (review: the A2-downbeat and end-of-B strokes rose 0.3 / 0.6 dB). A tam-tam's stroke is
a dull thud (its first 100 ms sit at 250 Hz, 30 dB under its bloom), and its roar blooms over the
next second; under the tutti's downbeat no level makes the thud itself heard. So: the **crash is
restored on A2's downbeat** (it had been left out for the pan clangs, which stay clear: their rises
are +10.2, +19.6, +17.2, +24.2 dB), and both strokes are louder (velocity 0.8 → 1.3 and
0.75 → 1.2) so the roar is heard:

| Stroke | First 100 ms | 0.1–0.6 s | 0–1 s | 0.3–1.5 s | Cover (0.1–0.6 s) |
|---|---|---|---|---|---|
| A2 downbeat, before (v 0.8) | +0.7 dB | — | +0.7 dB | +1.4 dB | — |
| A2 downbeat, after (v 1.3) + crash | +1.1 dB; **crash +18.6 dB** | **+7.0 dB** | +2.8 dB | **+4.8 dB** | 1.6 LU |
| end of B, before (v 0.75) | +1.0 dB | — | +1.5 dB | +5.3 dB | — |
| end of B, after (v 1.2) | +2.9 dB | **+3.9 dB** | **+3.7 dB** | **+10.5 dB** | 0.8 LU |

Per section the tam-tam sits 11.9 LU under the mix in A2 and 13.1 in B (the chorus 3.5 and 3.2).

**High-frequency life.** The track was much darker than the other nine: render-song's > 4 kHz
share −22.2 dB (the review measured −22.6 on the old bank) against −14.7 (menu) … −19.4
(foodcourt); spectral centroid 718 Hz (scratch FFT of the loop body) against 839–1063 Hz. Its
orchestra (strings, choir, organ, brass, timpani, bass drum) leaves 5–11 kHz nearly empty: the 8 kHz
octave held 3–5 dB less of the energy than in `boss`, `gameover` or `foodcourt`. The reverb's
low-pass (7000 → 9000 / 12000 / 16000 Hz) and its damping (0.5 → 0.8) change the share by under
0.1 dB (its send is band-limited and half-rate), so they stay. The additions, all on the tutti's
own accents and lines:

- the **triangle** on the hammer blows 2–4 and the runs bar's chords (A, A2), on the off-beat
  accents of B, and on the brass stabs of the build (gain 0 dB); it stays off the crash's beats, so
  the crashes keep their +16 to +22 dB;
- the **glockenspiel** an octave above the violins: the runs and the first half of the scale (A,
  A2), the top line of "teste David" (B) (gain −4 dB);
- the **crash** restored on A2's downbeat and the **cymbal swells** into B's fff blows (above).

| > 4 kHz share | intro | A | A2 | B | brk | gath | bld | loop (render-song) |
|---|---|---|---|---|---|---|---|---|
| before | −22.0 | −23.1 | −23.0 | −26.5 | −17.1 | −26.0 | −23.1 | **−22.2 dB** |
| after | −21.9 | −18.0 | −18.6 | −19.9 | −17.0 | −25.8 | −20.0 | **−18.8 dB** |

(The "after" row is the current render, with the cymbal rolls on their downbeats.)
The loop's > 4 kHz share is now −18.8 dB, inside the other tracks' range, between `boss` (−18.7)
and `gameover` (−19.4): the air above 4 kHz that the orchestra lacked is the brightness this polish
set out to give it, and the goal is met on that measure. By its spectral centroid the track is still
the darkest of the ten: 785 Hz over the loop body, against 826 Hz (`victory`) to 1078 Hz (`menu`)
for the others (scratch Welch spectrum of the mono loop body, master output). That is its low-mid
weight, not a lack of highs: it has the most energy at 125–250 Hz of any track (−7.6 dB of the
total, the others −9.2 to −12.8 dB: trombones, tuba, organ pedal, timpani, cellos and basses, the
bass drum), which pulls a full-band centroid down. Above 250 Hz its centroid is 1048 Hz, inside the
others' 942–1408 Hz; its 2–5 kHz presence and its > 4 kHz share, each against its own 250 Hz–2 kHz
band (−10.7 and −15.8 dB), are inside theirs (−6.0 to −14.6 and −11.0 to −18.4 dB). Moving the
full-band centroid into the others' range would take about +1.3 dB over all of 2–5 kHz, or 2 dB less
at 125–250 Hz: a different balance from the Dies irae's, which keeps its weight. The new parts are
heard without leading:

| Part | Notes rising ≥ 3 dB | Median rise | Part vs mix (momentary, median) | Per section (LU): part / chorus / violins |
|---|---|---|---|---|
| triangle | 35 of 35 | +13.6 dB | −16.7 LU | A −14.8 / −1.5 / −5.9; A2 −15.6 / −3.5 / −6.0; B −20.4 / −3.2 / −11.5 |
| glockenspiel | 132 of 132 | +16.9 dB | −13.0 LU | A −10.5; A2 −11.5; B −16.9 |

Loop body −16.3 LUFS, peak −1.56 dBFS, soft clipper 0.007 %, no warnings (table above). Melody
channels are untouched; all compare.py commands above give the same results.
