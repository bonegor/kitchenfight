# `trattoria`: Brindisi "Libiamo ne' lieti calici" (Verdi)

Stage 2, **La Trattoria** (a candle-lit dining room at night): gameplay music, looping. A festive
toast at the table, a little tipsy. File: [`src/audio/songs/trattoria.ts`](../../src/audio/songs/trattoria.ts).

## The piece

| | |
|---|---|
| Work | Brindisi "Libiamo ne' lieti calici", *La Traviata*, Act I |
| Composer | Giuseppe Verdi (1813–1901); libretto by Francesco Maria Piave (1810–1876) |
| Year | 1853 (premiere: Venice, Teatro La Fenice, 6 March 1853) |
| Status | Public domain worldwide: the composer and the librettist died more than 120 years ago. Only the melody and harmony are used; no edition is copied. The reference transcriptions are used to check the notes and are not committed. |

The arrangement follows the opera's dramaturgy:

1. Alfredo (the **accordion**) sings the verse in B♭.
2. Violetta (**violin + mandolin**, the Neapolitan pair) answers with "Ah! godiamo", which Verdi
   sets to the same tune in E♭ (IV). This is the track's second key area.
3. The whole table sings the chorus "Ah! libiam".
4. After a tipsy break, the two sing the verse as a duet.
5. The grand chorus leads back to the top.

## Key, meter, tempo, grid

- **B♭ major**, Verdi's key, with the "Ah! godiamo" section in **E♭ major** (IV), as in the opera.
  - The verse reference (LOTRO) is in F, so the verse is written a fourth higher (+5
    semitones). It lies in F4–G5, the accordion's and the violin's singing register.
  - The chorus reference is already in B♭.
  - The E♭ section is the bb_libiamo soprano an octave up (B♭4–C6). That is the register in
    which the LOTRO performance plays it, and it lies above the B♭ verse: Violetta's strophe
    lifts.
- **3/8 at ♩. = 69** (`bpm: 69`, `stepsPerBeat: 9`, `barSteps: 9`): a one-in-a-bar fast waltz,
  0.870 s per bar.
- **1 step = a triplet sixteenth** (1/6 of a quarter).
  - The verse's turns sit exactly on that grid as the reference performance plays them, in step
    values 2+1+1+1+2+1: the main note, the turn as triplet sixteenths, then a short upper note.
  - The chorus turns and the E♭ section's turns are straight sixteenths (1.5 steps), as in the
    choral score.
  - The sequencer's tremolo is locked to the grid at one stroke per step. That gives 10.4 Hz on
    the mandolin's long notes, a natural tremolo rate.

## References and melody proofs

| Theme | Reference (grade) | Contents |
|---|---|---|
| Verse "Libiamo, libiamo ne' lieti calici… s'inebrii a voluttà" | `lotro_brindisi.abc --tune 24`, bars 2–17 (C: MIDI-derived, F major) | Bar 2 holds the pickup "Li-". Bars 3–17 are the tune. Bars 18–21 are the performance's rubato cadenza. |
| "Ah! godiamo, la tazza e il cantico… ne scopra il nuovo dì" | `bb_libiamo.abc --voice 1`, bars 10–30 (B: SATB, B♭ with this passage in E♭) | All four voices sing it in unison or octaves here: the verse tune in E♭. |
| Chorus "Ah! libiam, amor fra' calici più caldi baci avrà" | `bb_libiamo.abc --voice 1`, bars 1–9 (B) | Voice 2 (alto) is played literally by the clarinet. Voices 3 and 4 are only the soprano and the alto an octave down, so they give no bass line (see Harmony). |

**The cadence** ("s'inebrii a voluttà", song bars V1:16–19). The LOTRO bars 18–21 are rubato,
and that flute part stops before the last note. The song writes the cadence in strict time with
the turn figure that the same performer plays in strict time in the chorus. That is LOTRO bars
70–71: the turn on D (with C♯), then the turn on C (with B♮), in triplet sixteenths, then the
tonic B♭. compare.py matches LOTRO bars 70–71 to song bars V1:17–18 note for note (below). The
song's own chorus has the bb_libiamo version of the same turns in straight sixteenths.

**"Ah! godiamo": the two references differ.** bb_libiamo sings G–F♯–G on "la tazza e il" (bars
15 and 25) and turns in straight sixteenths. LOTRO (bars 121–141) plays the verse's upper-neighbour
figure G–A♭–G–F–A♭ and triplet turns. The song follows bb_libiamo (grade B, a notated score)
literally. Against LOTRO it scores 78.0 % / 79.7 %, as the two references do against each other
(80.7 % / 82.5 %).

All commands are run from the worktree root with `PY=/home/user/.venv-audio/bin/python` and
`REFS=/home/user/kitchenfight-refs/abc`. Song bars without `--section` count over the whole form:
bar 4 is the intro's last bar, which holds the pickup, and V1 starts at bar 5.

```bash
# Verse, first statement (accordion; intro bar 4 = pickup, V1 bars 1-15)
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 2-17 --tol 0.1 \
    --song trattoria --channel acc --bars 4-19
# Verse including the cleaned-up cadenza (reference bars 18-21 rubato, listed but not scored)
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 2-21 --tol 0.1 --allow-bars 18-21 \
    --song trattoria --channel acc --bars 4-23
# The strict-time cadence against the performer's strict-time chorus turns
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 70-71 --tol 0.1 \
    --song trattoria --channel acc --section V1 --bars 17-18
# "Ah! godiamo" in E-flat, first statement (violin + mandolin together, and the mandolin alone)
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 10-30 --song trattoria --channel vln,mand --section G
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 10-30 --song trattoria --channel mand --section G
# Chorus, first statement (C1 bars 1-9), and its repeat (C1 bars 10-18)
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel acc --section C1 --bars 1-9
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel acc --section C1 --bars 10-18
# Chorus alto line (clarinet) against the SATB alto
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 2 --ref-bars 1-9 --song trattoria --channel clar --section C1 --bars 1-9
# Restatements: the duet's top line (pickup in brk bar 4 = form bar 67), the grand chorus C2
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 2-17 --tol 0.1 --song trattoria --channel vln,mand --bars 67-82
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel acc --section C2 --bars 1-9
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel vln,mand --section C2 --bars 1-9
# For information only: the E-flat section against the other reference
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 121-141 --tol 0.1 --song trattoria --channel vln,mand --section G
```

| Passage | Channel | Result |
|---|---|---|
| Verse, LOTRO 2–17 (first statement) | `acc` | **PASS 100.0 % / 100.0 %** (43/43 notes, +5 semitones, 1 beat = 3/2 q). Also passes at the default `--tol 0.02`. |
| Verse, LOTRO 2–21 with `--allow-bars 18-21` | `acc` | **PASS 97.7 % / 97.7 %**. The one unmatched note is the final tonic, which the LOTRO flute part leaves out. |
| Cadence V1:17–18 against LOTRO chorus 70–71 | `acc` | **PASS 100.0 % / 100.0 %** (12/12) |
| "Ah! godiamo", bb 10–30 (first statement) | `vln,mand` | **PASS 100.0 % / 100.0 %** (51/51, +12 semitones), default thresholds |
| "Ah! godiamo", bb 10–30 | `mand` alone | PASS 100.0 % / 100.0 % (the mandolin plays every note; the violin alone plays the notes of two steps and more, by design) |
| Chorus, bb 1–9 (first statement) | `acc` | **PASS 100.0 % / 100.0 %** (28/28, same pitch) |
| Chorus repeat, bb 1–9 | `acc` (C1 10–18) | PASS 100.0 % / 100.0 % |
| Chorus alto line, bb V:2 1–9 | `clar` | PASS 100.0 % / 100.0 % |
| Duet top line | `vln,mand` | PASS 100.0 % / 100.0 % (the slides are grace notes, which the tool ignores) |
| Grand chorus C2 | `acc`; `vln,mand` an octave up | PASS 100.0 % / 100.0 % each |
| "Ah! godiamo" against LOTRO 121–141 (information) | `vln,mand` | 78.0 % / 79.7 %: the references differ (above) |

No bar is allowed in the first statements, and no `--resync` is used.

## Form

| Section | Bars | Time (s) | Length | Content |
|---|---|---|---|---|
| `intro` | 1–4 | 0.00–3.48 | 3.48 s | Oom-pa-pa vamp I–I–V7–V7 (new material). Two glass clinks, a clarinet arpeggio, and the accordion pickup. |
| `V1` | 5–24 | 3.48–20.87 | 17.39 s | **Alfredo**: the verse on the accordion. Upright bass "oom", guitar "pa-pa", light tambourine, clinks. Bar 20 is the F7 turnaround; the clarinet climbs the F7 into Violetta's "Ah!". |
| `G` | 25–45 | 20.87–39.13 | 18.26 s | **Violetta, "Ah! godiamo" in E♭.** The violin and a mandolin play the tune. "Ah!" sits on B♭7 with a horn and clarinet swell and a double clink. The guitar breaks the "pa-pa" into sixteenths; a soft horn pad, clarinet answers under the long notes, medium tambourine. The bass moves to E♭2 and the low B♭1. The last bar's F7 and a clarinet run turn back to B♭. |
| `C1` | 46–63 | 39.13–54.78 | 15.65 s | **Chorus tutti**, 2 × bb bars 1–9. The accordion plays the tune; the violin sings its long notes. The clarinet plays the alto line; the horns play the tenor on "Ah! libiam" and hold chord tones under the turns. Accordion left hand and guitar "pa-pa", tambourine in sixteenths, clinks with glockenspiel. |
| `brk` | 64–67 | 54.78–58.26 | 3.48 s | **Break**. The band stops on a chord, and a double clink answers ("cin cin!"). The clarinet hums the verse's turn, then the same turn sagging a semitone (B♭-minor colour), then hiccups (a grace leap up to A5). The tambourine shakes and a soft bass keep the pulse. Vamp and pickup back in. |
| `duet` | 68–87 | 58.26–75.65 | 17.39 s | **Duet** in B♭. The violin and the mandolin on top, the accordion a third or sixth below. Pizzicato and guitar "pa-pa", clarinet arpeggio answers, and a two-bar suspended-cymbal roll into the last chorus. |
| `C2` | 88–105 | 75.65–91.30 | 15.65 s | **Grand chorus**. The accordion plays the tune at pitch. The violin and the mandolin play it an octave up. Timpani, a cymbal crash on "Ah!", clinks. The last bar carries the accordion's pickup into V1. |

- **Total**: 105 bars, 91.30 s of music (target 85–100 s).
- **Loop**: `loopFrom: 1` (V1). In music time the loop runs from 3.478 to 91.304 s, a body of
  87.826 s (bars 5–105). The rendered buffer is 97.30 s: the renderer appends the first 6 s of
  the body after the loop end, and playback runs 0 → 97.304 s, then repeats 9.478 → 97.304 s of
  the buffer.
- **Verse phrasing** (20 bars): a "Libiamo… infiora" (bars 1–10), a' "e la fuggevol ora… voluttà"
  (bars 11–19), and a V7 turnaround (bar 20).
- **"Ah! godiamo"** (21 bars): "Ah!" (bars 1–2, the pickup "go-" on the last eighth of bar 2), then
  the same a / a' phrasing a fourth higher (bars 3–21).
- **Pickups**: the intro and C2 (the loop seam) hand the accordion its pickup F4 on the last
  eighth, and `brk` hands it to the violin and mandolin for the duet. The E♭ section and the
  choruses start with "Ah!" on the second eighth, so they need none.
- **Variety over a 15-minute session**: two keys and three melody colours (the accordion in B♭,
  the violin and mandolin in E♭, the duet in B♭), two tutti choruses, and a break. Section loudness
  moves between −23.9 (break), −17.7 to −16.8 (verses) and −15.4 to −14.8 LUFS (choruses).

## Harmony

- **Verse** (B♭). The reference accompaniment keeps the tonic under the first six bars, so bars
  1–6 and 9–14 are I.
  - The two turn bars (7–8) are on V7.
  - The high G ("fuggevol ora", bars 15–16) is harmonised with IV (E♭). The reference has a
    tonic pedal there, but the melody (G–F–E♭) outlines E♭.
  - The cadence is I6/4 – V7 – I (bars 17–19), and bar 20 is a V7 turnaround.
  - Two passing chords keep the tune's upbeat E♭5 from rubbing against the D of a tonic "pa": a
    V7 on the last eighth of bars 4 and 14, and a neighbour IV6/4 over a B♭ pedal in bar 6.
- **"Ah! godiamo"** (E♭): the verse's harmony a fourth up.
  - "Ah!" is on B♭7, the V7 of the new key. The verse's closing F7 is V7/V in E♭, so the music
    moves F7 → B♭7 → E♭ along a chain of dominants, with "Ah!" held over the B♭7.
  - V7 sits under the turns (bars 9–10), and there is a neighbour IV6/4 (A♭/E♭) in bar 8.
  - IV (A♭/C, then A♭) under the high C (bars 17–18) is reached through a passing E♭7/D♭ on the
    last eighth of bar 16.
  - The cadence is I6/4 – V7 – I (bars 19–21). An F7 on the last eighth (V7 of B♭) turns back
    home for "Ah! libiam".
  - The tune's G–F♯–G neighbour figure stays over the tonic.
  - The LOTRO accompaniment parts here are only a slow bass, and their V arrives a bar after the
    melody's turn. The harmony is therefore derived from the melody and from the verse's own
    reference harmony.
- **Chorus** (twice): I | I – V7/IV (bass A♭) – IV6 | I6/4 | **V7 | I** …
  - bb_libiamo's "Bass" voice is not a bass line. It is the alto an octave down, turn figures
    included, and its tenor is the soprano an octave down.
  - The real bass of the cadence comes from the reference performance. The LOTRO theorbo (X:3,
    bars 68–72, +5 into B♭) plays B♭ | A♭ D E♭ | F | F (low octave, the harp on C) | B♭: I6/4 –
    V – I in root position.
  - So "più caldi baci avrà" closes on a **root-position F7 (bass F2) → B♭ (bass B♭2)**, in
    chorus bars 4→5 and 8→9. The alto's E♭ is the chord seventh and resolves to D over the
    root.
  - The descending B♭–A♭–G of bar 2 (V7/IV → IV6, which the theorbo's A♭ D E♭ supports) leads
    into the cadential F.
- **Bass lines** are written out (`VERSE_BASS`, `G_BASS`, `CHORUS_BASS`): one "oom" per bar,
  alternating root and fifth. They use inversions (I6 in bar 5, IV6 in bar 16 of the verse, the
  cadential 6/4) and approach notes before the cadences: the leading tones A2 → B♭2 and D2 → E♭2,
  and the seventh D♭2 resolving to C2.
- **Clash check.** Every pair of notes on different pitched channels that overlap by at least
  60 ms was scanned, using each instrument's gate and release.
  - **Same-octave minor seconds: none.** The previous version had 5, including the C2 pizzicato
    E♭4 against the clarinet's D4 neighbour note. The C2 pizzicato is now voiced in D3–B♭3,
    below the clarinet's alto line.
  - **Held notes (6 steps or more) against a neighbour note: 8.** The previous version had 89,
    mostly the horns holding D4 and C4 under the melody's C♯5 and B4. The horns now hold B♭3
    under the cadential 6/4 and the leading tone A3 under V7, and neither rubs against a turn.
  - The 8 that remain are the reference alto's own E4 lower neighbour against the F2 "oom" of
    the 6/4, two octaves and a major seventh apart.
  - Short neighbour notes of the turns against short "pa" chord tones in other octaves are left
    as they are. They are the ornament against the harmony, as in Verdi's own accompaniment.

## Instruments

All ids are from the contract and render with recorded samples. The ranges below are the notes
the song actually exports (`export-song.mjs`), at sounding pitch.

| Channel | Id | Role | Range |
|---|---|---|---|
| `acc` | `accordion` | Alfredo: the melody in V1, C1 and C2 | F4–G5 |
| `accH` | `accordion` | Alfredo's second voice in the duet | D4–D5 |
| `accC` | `accChord` | the accordion's left hand: "pa-pa" chords and the stop chord | F3–E♭4 |
| `vln` | `violin` | Violetta: the long notes and the slides in G and the duet, the long notes in C1, and an octave up in C2 | F4–C6 (C2: B♭5–F6) |
| `mand` | `mandolin` | Violetta's articulating voice: every note of her line, tremolo on the long notes; an octave up in C2 | F4–C6 (C2: B♭5–F6) |
| `clar` | `clarinet` | answers (chalumeau arpeggios, runs into the choruses), the "Ah!" swell, the chorus alto line, the tipsy break | F3–A5 |
| `horn` | `horn` | a soft pad in G; in the choruses the tenor on "Ah! libiam", then B♭3 / A3 under the turns | G3–F4 |
| `gtr` | `guitar` | nylon guitar: "pa-pa" strums, broken into sixteenths in G; voiced below the accordion chords in the choruses | D3–E♭4 |
| `pizz` | `pizz` | pizzicato "pa-pa" dyads (C2: D3–B♭3, under the clarinet) | D3–E♭4 |
| `bass` | `uprightBass` | "oom" and the chorus bass | A♭1–D3 |
| `tri`, `glock` | `triangleInst`, `glock` | glass clinks: single, or double for two glasses; glockenspiel B♭6/D7 on "Ah!" | — |
| `tamb` | `tamb` | tambourine: hits and shakes (light, then medium), sixteenth shakes in the choruses | — |
| `timp`, `cym` | `timpani`, `cymbal` | C2 downbeats; the suspended-cymbal roll into C2 and a crash on its "Ah!" | F2, B♭2 |

The upright bass "oom" falls on the first eighth, and the "pa-pa" on the second and third (the
second "pa" at 86 % velocity).

**Violetta's line: violin and mandolin.** The recorded solo violin speaks slowly. In a probe
render it takes 195–300 ms to reach half of its peak level on D5–B♭5 (60 ms on D6), while the
mandolin takes 1 ms or less. A 97 ms triplet sixteenth or a 145 ms sixteenth therefore cannot
speak on it, and it only smears into the tail of the note before. Two instruments at the same
pitch and level also beat and can cancel each other: in one duet E♭5 the two partials summed
12–13 dB below either alone. So each note has one clear leader.

- `bowed()`: the violin plays only the notes of two steps or more. The long notes are at full
  voice, with gate 0.9. The eighths are a soft détaché shadow (velocity × 0.6, gate 0.75), so
  their tail has died before the turn that follows.
- The slide grace notes belong to that one violin part, so each sounds once. The previous
  version played each of them three times.
- `duo()`: the mandolin plays every note. The long notes are tremolo (velocity 0.45) under the
  violin; the eighths and the turns' quick notes, which only it plays, are at lead level
  (velocity 0.9).
- In C1 the violin sings only the long notes, and the accordion articulates the turns.
- In C2 the octave line is the same `duo()` at a lower lead level (0.72).

**Clarity, measured.** For each note of the tune, the energy at its own pitch (harmonics 1–3) is
compared with the energy at the previous note's pitch, over 35–95 % of the written note. The
table gives the share of notes whose own pitch wins by more than 3 dB, and the median margin.
The measurement is the same as the review's, on sample renders of the full mix (made when the
review fixes went in, on the bank of that time).

| Section (lead) | Turn notes (1–1.5 steps) | Eighths (2–3 steps) |
|---|---|---|
| V1 (accordion, the reference) | 90 % (+10.1 dB) | 93 % (+17.8 dB) |
| G (violin + mandolin) | **100 %** (+14.0 dB) | **96 %** (+15.4 dB) |
| C1 (accordion) | 100 % (+11.8 dB) | 100 % (+26.5 dB) |
| duet (violin + mandolin) | **90 %** (+12.2 dB) | **89 %** (+13.5 dB) |
| C2 (accordion at pitch) | 100 % (+11.0 dB) | 100 % (+22.2 dB) |
| C2 (octave line) | **100 %** (+14.0 dB) | **100 %** (+15.5 dB) |

- The previous version scored 25 % and 30 % (median +1.3 and −0.5 dB) for the violin-led turns
  in V2 and the duet, and 67 % and 70 % for their eighths. Its C2 octave-line turns scored 25 %.
  The earlier "73 % / 84 %" figures in this document overstated the violin's clarity.
- On the violin + mandolin stem alone, the duet reaches 95 % of turn notes and 100 % of eighths.
- In the mix, three of the duet's eighths fall under 3 dB because of the harmony, not smear:
  - in bars 4 and 14, the accordion's second voice holds C5, the previous melody note, a sixth
    under the E♭5;
  - in bar 3, the "pa" chord holds the previous pitch's harmonics.
- **Melody against the band** (K-weighted energy of the mono mix per bar, median; current render,
  the loop as it repeats):
  - V1 (the accordion): +5.7 dB;
  - G: +4.9 dB (turn bars +4.0);
  - duet: +3.6 dB, counting the second voice as band.
- **The slides**: the grace pitch's partial against the target's, 50–200 ms after the target's
  onset, is −7.6 to −10.6 dB on the violin alone and −4.6 to −14.6 dB in the mix. The previous
  version's tripled slide into the climax G5 read +1.7 dB.

**Tuning.** The long notes were measured on the renders. The accordion D5 has its two reeds 15
cents apart, a mean of −0.4 cents; that is the instrument's natural shimmer. The violin D5 has a
±16-cent vibrato around +3 cents. So the accordion and violin unison does not beat audibly.

**The cymbal.** The roll (variant 1) is the bank's rebuilt suspended-cymbal roll: bright (SSO's
crescendo roll, spectral centroid about 4 kHz on its peak), growing evenly over its whole length
into its peak on C2's downbeat. It spans the last two bars of the duet, where the melody rests in
the final bar, and the "Ah!" of C2 is a hit on the loud layer (velocity 1.08 against the channel's
−6.6 dB, the hit's level of the previous balance). See "Polish" at the end for the measurements.

## Levels (recorded samples)

```bash
node scripts/music/render-song.mjs trattoria /tmp/trattoria.wav
```

| | |
|---|---|
| Bank | instruments: recorded samples (54 sets) |
| Duration | 97.30 s file (91.30 s of music plus the 6 s loop pad), 2580 events |
| Loop | playback 0 → 97.304 s, then repeats 9.478 → 97.304 s of the buffer (music time 3.478 → 91.304 s), body 87.826 s = bars 5–105 from V1; **seam mismatch −150.5 dBFS** |
| Loop body | **−16.4 LUFS** integrated (−16.44; whole file −16.6), short-term max −14.5 LUFS, RMS −19.5 dBFS |
| Peak | **sample peak −2.70 dBFS**; soft clipper 27 samples (0.000 %, the knee at −4.2 dBFS); DC 0 |
| Spectral balance | <250 Hz −6.9 dB, 250 Hz–4 kHz −1.1 dB, >4 kHz −16.2 dB |
| Warnings | none |

Octave bands over the loop body (share of energy, dB): 63 Hz −11.7, 125 −8.8, 250 −10.8,
**500 −3.9**, 1k −7.6, 2k −11.5, 4k −13.2, 8k −19.1. The tune's fundamentals lead, and the 2–4 kHz
region stays open for the game's sound effects.

| Channel | Solo LUFS | vs mix | Loudest 3 s | Peak dBFS |
|---|---|---|---|---|
| acc | −18.2 | −1.8 | −17.5 | −8.9 |
| vln | −20.6 | −4.1 | −17.0 | −7.0 |
| accH | −26.6 | −10.2 | −25.9 | −17.1 |
| clar | −27.3 | −10.8 | −25.7 | −15.9 |
| accC | −31.5 | −15.1 | −31.0 | −12.9 |
| gtr | −29.6 | −13.1 | −27.8 | −11.5 |
| pizz | −34.8 | −18.3 | −34.1 | −16.7 |
| bass | −25.3 | −8.9 | −23.5 | −10.1 |
| horn | −32.3 | −15.9 | −30.5 | −20.8 |
| mand | −23.4 | −7.0 | −21.0 | −8.5 |
| tri | −34.7 | −18.2 | −33.5 | −15.8 |
| glock | −37.5 | −21.1 | −42.2 | −22.8 |
| tamb | −33.9 | −17.5 | −31.0 | −11.5 |
| timp | −32.4 | −15.9 | −33.8 | −15.3 |
| cym | −30.3 | −13.8 | −30.7 | −13.9 |

The whole-loop "vs mix" figures understate the channels that play in only part of the loop, so
here they are per section. The section's mix loudness comes first. Each channel's solo loudness
(gated, so it counts only where the channel plays) is then given relative to it, in LU, from solo
renders.

| Section | Mix LUFS | Lead | Lead vs mix | Bass | Tambourine |
|---|---|---|---|---|---|
| intro | −20.7 | clarinet / guitar | −3.5 / −6.0 | −4.8 | −20.3 |
| V1 | −17.7 | accordion | **−0.8** | −8.5 | −21.8 |
| G | −17.1 | violin + mandolin (violin −2.1, mandolin −6.2) | **−1.0** | −8.9 | −19.1 |
| C1 | −15.4 | accordion (violin long notes −7.3) | **−2.5** | −8.8 | −16.1 |
| brk | −23.9 | clarinet | **−2.5** | −4.6 | −16.0 |
| duet | −16.8 | violin + mandolin (accordion second voice −9.8) | **−1.3** | −9.0 | −17.7 |
| C2 | −14.8 | accordion (octave line −6.1; together −1.5) | −3.3 | −9.8 | −17.5 |

- **Build**: the verses sit at −17.7 to −16.8 LUFS and the choruses at −15.4 to −14.8, around a
  −23.9 break. That is enough contrast for a 15-minute stage loop without pumping.
- **Melody on top**: the tune is within about 2.5 LU of the mix in every section. In C2 the
  accordion and its octave doubling carry it together.
- **Bass and percussion** are present but not dominant. In the verses and choruses the bass is
  8.5–9.8 LU under the mix, the tambourine 16–22 and the clinks 18–19 (sparse accents). The break
  features them: bass −4.6, tambourine −16.0, and the "cin cin!" double clink −8.0.
- The bank issues known when this track was arranged (plucked samples starting 10–47 ms late,
  several instruments' calibration 2.5–5.7 dB off) are fixed: the plucks sound on their beat, and
  each channel's gain was offset for the recalibrated levels (commit bf24871), so the balance is
  the one arranged here. The levels above are measured on the current bank.

**In Chromium.** `audiotest.html` → `__at.samplerTrack('trattoria')` decodes the 54 MP3 sets with
Chromium's decoder, with no bank warnings and no page errors. The game's music worker then renders
the track in 1.1 s. The result matches the Node render sample for sample within −90 dB, one 16-bit
step (RMS difference −111 dB): same length (4 670 609 samples), same loop points, the same
−2.70 dBFS peak.

## Changes from the previous version

The previous `trattoria` was an original E-minor 12/8 serenade. It is replaced completely. The id,
the export name `trattoria` and the `SongDef` shape are unchanged. The song no longer imports
`TAMB` from `title.ts`: its tambourine map is local, so it does not depend on another track's file.

**Review fixes** (after the first arrangement, commit aeb18e2):

1. **Slides played three times.** The violin used to be split into three parts by note length,
   and each part kept every grace note. Now one violin part carries the graces.
2. **Violin-led turns did not articulate.** The violin now bows only the notes of two steps and
   more. The mandolin plucks every note, the quick ones at lead level. In C1 the violin sings only
   the long notes, and in C2 the octave line uses the same pair. See the clarity table.
3. **The chorus cadence was V4/2 → I6 over a pseudo-bass.** It is now a root-position V7 → I
   from the reference performance's real bass.
4. **There was no contrasting section or key.** The second B♭ verse (V2) is replaced by "Ah!
   godiamo" in E♭ (bb_libiamo bars 10–30, PASS 100 %). It has its own accompaniment: the guitar
   in sixteenths, a horn pad, and the bass on E♭2 and B♭1. The old V3 duet is renamed `duet`.
5. **The cymbal was inaudible.** The roll is two bars long, the crash uses the bright layer, and
   the channel is 10 dB louder.
6. **Inner-voice rubs in the chorus.** The C2 pizzicato is voiced below the clarinet, and the
   horns hold chord tones that no turn rubs against.
7. **This document.** The loop line, the cadence description, the ranges and the clarity figures
   are corrected.

## Polish: the bright cymbal roll, and the flute doubling dropped

**Cymbal.** The bank's suspended-cymbal roll was rebuilt bright (SSO's crescendo roll, spectral
centroid about 4 kHz on its peak instead of 0.6 kHz). The channel's +10 dB boost for the old,
dark roll made the new one dominate the duet's last bar: there the cymbal alone was 3 LU under the
mix and raised it by 3 LU. It was re-balanced: `cym` gain −2.2 → −8.7 dB; the "Ah!" hit velocity
0.8 → 1.25, which kept the hit within 0.3 dB of its previous level.

A second review found that the roll did not reach the grand chorus: the cymbal was gated at 90 % of
the written length, so the release began 0.17 s before C2's downbeat (the roll was 0.8 dB down
there), and the roll's crescendo was 0.76 s long, so the 1.74 s roll grew for 0.76 s and then held
flat. Both are fixed in the sampler (see `docs/credits/music-samples.md`): the cymbal plays its
written length, and the roll grows evenly over its whole length (by about 16 dB) into its peak on
the downbeat. The held roll also plays at the stereo loudness of the old VCSL roll now, 1.5 dB under
the bright roll's first build: `cym` −8.7 → −6.6 dB puts the roll's crest about where it was
(−30.7 dB before, −30.9 dB now: the cymbal's own K-weighted level over the 150 ms up to it), now on
the downbeat, and the hit's velocity 1.25 → 1.08 keeps the hit's level (within 0.1 dB).

Measure (scratch scripts on the full render, same method as the review): the largest third-octave
rise of the mix over the mix without `cym` (63 Hz–12.5 kHz, bands within 40 dB of the window's
loudest), for the roll in its last 150 ms (before: of its gate; now: before the downbeat), for the
hit in its first 100 ms (in brackets: the first 300 ms); "cover" = how much the cymbal raises the
momentary (400 ms, K-weighted) loudness there.

| Cymbal | Before | First re-balance | Now | Cover before → first → now | Cymbal vs mix before → first → now |
|---|---|---|---|---|---|
| roll into C2 (duet bars 19–20, 73.91 s, 1.74 s; the melody rests) | +24.6 dB at 3.2 kHz | +18.2 dB at 3.2 kHz | **+23.3 dB** at 5 kHz | 3.01 → 0.88 → **0.80 LU** | −3.0 → −7.4 → **−7.8 LU** |
| hit on "Ah!" (C2, 75.94 s) | +7.1 dB at 400 Hz (+8.8) | +5.8 dB at 400 Hz (+7.8) | **+4.5 dB** at 400 Hz (+7.0) | 0.65 → 0.45 → 0.51 LU | −9.3 → −11.6 → −10.5 LU |

The roll leads clearly into the grand chorus as a crest, now on its downbeat, rather than the
loudest thing in the bar. (The hit's figures include the roll's release, which now starts on the
downbeat, 0.29 s before the hit, instead of 0.46 s before it.)

**Flute.** The flute doubled the C2 tune an octave up, in unison with the violin and the
mandolin, at −15.6 dB. A review found it inaudible: its notes raised their own third-octave band by
a median 0.6 dB (5 of 56 notes reached 3 dB). Raising it does not make it heard without taking the
violin's place: at +12 dB, 64 % of its notes reach 3 dB (median 5.4 dB) but the violin's notes in C2
that reach 3 dB fall from 83 % to 58 %; at +14 dB, 75 % against the violin's 42 %. Three
instruments in unison cannot each stand out, so the flute part and its channel are gone; the octave
line is the violin and the mandolin, as in the duet. Its compare.py proof is dropped from the list
above; the other proofs give the same results.

Render after these changes: "Levels" above.
