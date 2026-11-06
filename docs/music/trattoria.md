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

The arrangement follows the opera's dramaturgy. Alfredo (the **accordion**) sings the verse, and
Violetta (the **violin**) answers with the same verse. They sing it together as a duet, and the
whole table answers with the chorus "Ah! libiam, amor fra' calici".

## Key, meter, tempo, grid

- **B♭ major**, Verdi's key. The verse reference (LOTRO) is in F, so the tune is written a fourth
  higher (+5 semitones). The chorus reference is already in B♭. The tune lies in F4–G5: the
  accordion's and the violin's singing register.
- **3/8 at ♩. = 69** (`bpm: 69`, `stepsPerBeat: 9`, `barSteps: 9`): a one-in-a-bar fast waltz,
  0.870 s per bar.
- **1 step = a triplet sixteenth** (1/6 of a quarter).
  - The verse's turns sit exactly on that grid as the reference performance plays them, in step
    values 2+1+1+1+2+1: main note, turn as triplet sixteenths, then a short upper note.
  - The chorus turns are straight sixteenths (1.5 steps), as in the choral score.
  - The sequencer's tremolo is locked to the grid at one stroke per step. That gives 10.4 Hz on
    the mandolin's long notes, a natural tremolo rate. With 18 steps per bar it would buzz at
    20.7 Hz.

## References and melody proofs

| Theme | Reference (grade) | Contents |
|---|---|---|
| Verse "Libiamo, libiamo ne' lieti calici… s'inebrii a voluttà" | `lotro_brindisi.abc --tune 24`, bars 2–17 (C: MIDI-derived, F major) | Bar 2 holds the pickup "Li-". Bars 3–17 are the tune. Bars 18–21 are the performance's rubato cadenza. |
| Chorus "Ah! libiam, amor fra' calici più caldi baci avrà" | `bb_libiamo.abc --voice 1`, bars 1–9 (B: SATB, B♭) | Voices 2–4 give the harmony. Voice 2 (alto) is played literally by the clarinet. |

**The cadence** ("s'inebrii a voluttà"). The LOTRO bars 18–21 are rubato, and that flute part
stops before the last note. The cadence is written in strict time as the chorus has it: the turn
on D, then the turn on C, then the tonic B♭ (song bars V1:16–19).

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
# Chorus, first statement (C1 bars 1-9), and its repeat (C1 bars 10-18)
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel acc --section C1 --bars 1-9
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel acc --section C1 --bars 10-18
# Chorus alto line (clarinet) against the SATB alto
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 2 --ref-bars 1-9 --song trattoria --channel clar --section C1 --bars 1-9
# Restatements: violin verse V2 (pickup in V1 bar 20), duet V3 (pickup in brk bar 4), grand chorus C2
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 2-17 --tol 0.1 --song trattoria --channel vln --bars 24-39
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 2-17 --tol 0.1 --song trattoria --channel vln --bars 66-81
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel acc --section C2 --bars 1-9
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 --song trattoria --channel vln --section C2 --bars 1-9
```

| Passage | Channel | Result |
|---|---|---|
| Verse, LOTRO 2–17 (first statement) | `acc` | **PASS 100.0 % / 100.0 %** (43/43 notes, +5 semitones, 1 beat = 3/2 q). Also passes at the default `--tol 0.02`. |
| Verse, LOTRO 2–21 with `--allow-bars 18-21` | `acc` | **PASS 97.7 % / 97.7 %**. The one unmatched note is the final tonic, which the LOTRO flute part leaves out. |
| Chorus, bb 1–9 (first statement) | `acc` | **PASS 100.0 % / 100.0 %** (28/28, same pitch) |
| Chorus repeat, bb 1–9 | `acc` (C1 10–18) | PASS 100.0 % / 100.0 % |
| Chorus alto line, bb V:2 1–9 | `clar` | PASS 100.0 % / 100.0 % |
| Violin verse V2 (with slides) | `vln` | PASS 100.0 % / 100.0 % (the slides are grace notes, which the tool ignores) |
| Duet top voice V3 | `vln` | PASS 100.0 % / 100.0 % |
| Grand chorus C2 | `acc`; `vln` an octave up | PASS 100.0 % / 100.0 % each |

No bar is allowed in the first statements and no `--resync` is used.

## Form

| Section | Bars | Time (s) | Length | Content |
|---|---|---|---|---|
| `intro` | 1–4 | 0.00–3.48 | 3.48 s | Oom-pa-pa vamp I–I–V7–V7 (new material). A double glass clink, a clarinet arpeggio, and the accordion pickup. |
| `V1` | 5–24 | 3.48–20.87 | 17.39 s | **Alfredo**: the verse on the accordion. Upright bass "oom", guitar "pa-pa", light tambourine, clinks. |
| `V2` | 25–44 | 20.87–38.26 | 17.39 s | **Violetta**: the verse on the violin, with a mandolin in unison and clarinet answers in the chalumeau. Pizzicato "pa-pa", guitar on the downbeats. |
| `C1` | 45–62 | 38.26–53.91 | 15.65 s | **Chorus tutti**, 2 × bb bars 1–9. Accordion and violin play the tune, the clarinet the alto line, the horn the tenor. The SATB bass line, accordion left hand and guitar "pa-pa", tambourine in sixteenths, clinks with glockenspiel. |
| `brk` | 63–66 | 53.91–57.39 | 3.48 s | **Break**. The band stops on a chord, and a double clink answers ("cin cin!"). The clarinet hums the verse's turn, then the same turn sagging a semitone (B♭-minor colour), then hiccups (a grace leap up to A5). The tambourine shakes and a soft bass keep the pulse. Vamp and pickup back in. |
| `V3` | 67–86 | 57.39–74.78 | 17.39 s | **Duet**. The violin (with the mandolin) on top, and the accordion a third or sixth below. Full oom-pa-pa, clarinet arpeggio answers, and a suspended-cymbal roll into the last chorus. |
| `C2` | 87–104 | 74.78–90.43 | 15.65 s | **Grand chorus**. The accordion plays the tune at pitch. The violin, a tremolo mandolin and the flute play it an octave up. Timpani, cymbal, clinks. The last bar carries the accordion's pickup into V1. |

- **Total**: 104 bars, 90.43 s of music (target 85–100 s).
- **Loop**: `loopFrom: 1` (V1). The loop window is 3.478 → 90.435 s, a body of 86.96 s (bars 5–104).
  The rendered buffer is 94.43 s: the renderer appends the first 4 s of the body after the loop
  end.
- **Verse phrasing** (20 bars): a "Libiamo… infiora" (bars 1–10), a' "e la fuggevol ora… voluttà"
  (bars 11–19), and a V7 turnaround that holds the next section's pickup (bar 20).
- **Pickups**: every section's last bar carries the next melody instrument's pickup F4 on the third
  eighth. The intro and C2 (the loop seam) hand it to the accordion, V1 to the violin and mandolin,
  and `brk` to the violin and mandolin.

## Harmony

- **Verse**. The reference accompaniment keeps the tonic under the first six bars, so bars 1–6 and
  9–14 are I.
  - The two turn bars (7–8) are on V7.
  - The high G ("fuggevol ora", bars 15–16) is harmonised with IV (E♭). The reference has a
    tonic pedal there, but the melody (G–F–E♭) outlines E♭.
  - The cadence is I6/4 – V7 – I (bars 17–19), and bar 20 is a V7 turnaround.
  - Two passing chords keep the tune's upbeat E♭5 from rubbing against the D of a tonic "pa": a
    V7 on the last eighth of bars 4 and 14, and a neighbour IV6/4 over a B♭ pedal in bar 6.
- **Chorus**: the SATB arrangement's harmony, I | I – V7/IV – IV6 | I6/4 | V4/2 | I6 …, with its
  descending bass B♭–A♭–G–F–E♭–D. The V7/IV → IV of bar 2 agrees with the LOTRO theorbo part.
- **Bass lines** are written out (`VERSE_BASS`, `CHORUS_BASS`): root and fifth alternate. They
  use inversions (I6 in bar 5, IV6 in bar 16, the cadential 6/4) and leading-tone approaches
  (A2 → B♭2) before the cadences.
- **Clash check**. Every pair of notes on different pitched channels, both at least an eighth long
  and overlapping by at least an eighth, was checked for minor seconds and major sevenths: there
  are none. The only shorter ones are the duet's parallel-third passing tones in the turn of bars
  4 and 14 (193 ms).

## Instruments

All ids are from the contract and render with recorded samples. The first statements are at
concert pitch; the octave-up voices are listed separately.

| Channel | Id | Role | Range |
|---|---|---|---|
| `acc` | `accordion` | Alfredo; the melody in V1, C1 and C2 | F4–G5 |
| `accH` | `accordion` | Alfredo's second voice in the duet | D4–D5 |
| `accC` | `accChord` | the accordion's left hand: "pa-pa" chords and the stop chord | F3–F4 |
| `vln` | `violin` | Violetta; the melody in V2 and V3, doubling in C1, an octave up in C2 | F4–G5 (C2: B♭5–F6) |
| `mand` | `mandolin` | unison shadow of the violin, tremolo on long notes; an octave up in C2 | F4–G5 (C2: B♭5–F6) |
| `clar` | `clarinet` | answers (chalumeau arpeggios, runs into the chorus), the chorus alto line, the tipsy break | F3–A5 |
| `horn` | `horn` | the chorus tenor (the tune's long notes an octave down, a breath every 4 bars) | B♭3–F4 |
| `flute` | `flute` | octave doubling in C2 | B♭5–F6 |
| `gtr` | `guitar` | nylon guitar "pa-pa" strums; downbeat strums in V2; voiced below the accordion chords in the choruses | C3–F4 |
| `pizz` | `pizz` | pizzicato "pa-pa" dyads | F3–D4 |
| `bass` | `uprightBass` | "oom" and the walking chorus bass | D2–E♭3 |
| `tri`, `glock` | `triangleInst`, `glock` | glass clinks: single, or double for two glasses; glockenspiel B♭6/D7 on "Ah!" | — |
| `tamb` | `tamb` | tambourine: hits and shakes (light, then medium), sixteenth shakes in the choruses | — |
| `timp`, `cym` | `timpani`, `cymbal` | C2 downbeats; suspended-cymbal roll into C2 and a hit on its "Ah!" | F2, B♭2 |

The upright bass "oom" falls on the first eighth, and the "pa-pa" on the second and third (the
second "pa" at 86 % velocity).

**The violin sample.** The recorded solo violin speaks slowly: half level after 89 ms, 90 % after
156 ms (probe render). So a 97 ms triplet-sixteenth of a turn drowns in the tail of the note
before it. In a measured note-clarity check (harmonic salience in the middle of each written
note), only 73 % of the violin's short verse notes read as written, against 98 % on the
accordion. Where the violin leads, three things fix this:

- `violinLine()` gives eighths a shorter gate (0.72), and sixteenths a firmer bow (velocity × 1.4)
  with gate 0.85.
- A mandolin doubles the line in unison, at 15–16 LU under the mix. Its pluck marks every note of
  the turn: 84 % of all verse notes then read as written, and the rest are near-ties in which the
  new note has the fresh attack. This violin and mandolin pairing is the classic Neapolitan sound.
- In C2 the mandolin also takes the octave doubling, so the top octave's turns stay crisp.

**Tuning.** The long notes were measured on the renders. The accordion D5 has its two reeds 15
cents apart, a mean of −0.4 cents; that is the instrument's natural shimmer. The violin D5 has a
±16-cent vibrato around +3 cents. So the C1 unison does not beat audibly.

## Levels (recorded samples)

```bash
node scripts/music/render-song.mjs trattoria /tmp/trattoria.wav
```

| | |
|---|---|
| Bank | instruments: recorded samples (53 sets) |
| Duration | 94.43 s file (90.43 s of music plus the 4 s loop pad), 2758 events |
| Loop | 3.478 → 94.435 s playback, body 86.957 s = bars 5–104 from V1; **seam mismatch −150.5 dBFS** |
| Loop body | **−16.4 LUFS** integrated (whole file −16.5), short-term max −14.1 LUFS, RMS −19.4 dBFS |
| Peak | **sample peak −3.65 dBFS**; soft clipper 4 samples (0.000 %); DC 0 |
| Spectral balance | <250 Hz −7.1 dB, 250 Hz–4 kHz −1.0 dB, >4 kHz −17.9 dB |
| Warnings | none |

Octave bands (share of energy, dB): 63 Hz −11.3, 125 −9.3, 250 −11.3, **500 −3.7**, 1k −7.1,
2k −12.0, 4k −14.4, 8k −20.7. The tune's fundamentals lead, and the 2–4 kHz region stays open for
the game's sound effects.

| Channel | Solo LUFS | vs mix | Loudest 3 s | Peak dBFS |
|---|---|---|---|---|
| acc | −18.1 | −1.7 | −17.3 | −8.7 |
| vln | −19.8 | −3.4 | −17.5 | −7.7 |
| accH | −25.7 | −9.3 | −25.1 | −14.3 |
| clar | −27.3 | −10.9 | −26.3 | −16.4 |
| accC | −31.7 | −15.3 | −31.0 | −13.1 |
| gtr | −29.6 | −13.2 | −27.9 | −11.3 |
| pizz | −34.6 | −18.2 | −33.5 | −17.1 |
| bass | −25.2 | −8.9 | −23.5 | −9.6 |
| horn | −31.2 | −14.8 | −30.2 | −20.7 |
| flute | −35.8 | −19.4 | −35.1 | −27.2 |
| mand | −32.6 | −16.2 | −30.9 | −19.5 |
| tri | −34.6 | −18.2 | −34.5 | −15.4 |
| glock | −37.6 | −21.2 | −42.2 | −23.0 |
| tamb | −34.3 | −17.9 | −31.3 | −12.8 |
| timp | −32.4 | −16.0 | −33.9 | −15.9 |
| cym | −40.3 | −23.9 | −41.6 | −26.1 |

The whole-loop "vs mix" figures understate the channels that play in only part of the loop, so
here they are per section. The section's mix loudness comes first; each channel's solo loudness is
then given relative to it (LU), from the solo renders.

| Section | Mix LUFS | Lead | Lead vs mix | Bass | Tambourine |
|---|---|---|---|---|---|
| intro | −20.9 | clarinet / guitar | −3.2 / −5.9 | −4.6 | −18.3 |
| V1 | −17.6 | accordion | **−0.8** | −8.6 | −19.9 |
| V2 | −18.0 | violin (+ mandolin −15.1) | **−1.1** | −8.2 | −19.1 |
| C1 | −14.8 | accordion + violin in unison | −2.9 / −6.7 (together ≈ −1.5) | −9.2 | −16.9 |
| brk | −23.9 | clarinet | **−1.8** | −4.7 | −13.8 |
| V3 | −17.2 | violin (accordion second voice −8.5) | **−1.8** | −8.7 | −18.2 |
| C2 | −14.5 | accordion + violin an octave up | −3.5 / −5.7 (together ≈ −1.5) | −10.1 | −17.9 |

- **Build**: the verses sit at −17.2 to −18.0 LUFS and the choruses at −14.5 to −14.8, a range of
  about 3.5 LU. That is enough contrast for a 15-minute stage loop without pumping.
- **Melody on top**: the tune is within about 2 LU of the mix in every section.
- **Bass and percussion** are present but not dominant: the bass is 8–10 LU under the mix, the
  tambourine 14–20, the clinks 18–21 (sparse accents).

**In Chromium.** `audiotest.html` → `__at.samplerTrack('trattoria')` decodes the 53 MP3 sets with
Chromium's decoder, with no bank warnings and no page errors. The game's music worker then renders
the track in 0.9 s. The result matches the Node render sample for sample within −91 dB: same
length, same loop points, the same −3.65 dBFS peak.

## Changes from the previous version

The previous `trattoria` was an original E-minor 12/8 serenade. It is replaced completely. The id,
the export name `trattoria` and the `SongDef` shape are unchanged. The song no longer imports
`TAMB` from `title.ts`: its tambourine map is local, so it does not depend on another track's file.
