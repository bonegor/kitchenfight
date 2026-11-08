# streets — "La Danza" (stage 3, I Vicoli di Napoli)

Gameplay music for the Naples alleys at sunset turning to night: a frantic tarantella chase for a
street band (mandolin, accordion, clarinet, guitar, upright bass, tambourine, castanets) with
cartoon-orchestra punctuation (brass stabs, timpani, cymbals, a xylophone in the last refrain).
Song file: `src/audio/songs/streets.ts`.

## Pieces

| Piece | Composer | Year | Public domain | Used for |
|-------|----------|------|---------------|----------|
| "La Danza", Tarantella napoletana (*Les Soirées musicales* No. 8, words by Carlo Pepoli) | Gioachino Rossini (1792–1868) | 1835 | Yes: the composer died in 1868, the work is out of copyright everywhere | verse, "salterà" continuation, Neapolitan bridge, A-major refrain |
| "Tarantella Napoletana" (also "Wedding Tarantella", "Cicerenella") | traditional, Naples | 19th c. folk dance | Yes: traditional | the minor night section (strain B) |

The reference transcriptions are reference only and are not committed; the melodies were written
into the DSL from them and proven with `scripts/music/compare.py`.

## References and how they were read

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/bb_ladanza1.abc --voice 1 --text --bars 49-125
$PY scripts/music/abc2notes.py $REFS/bb_ladanza1.abc --voice 1 --bars 49-64 --dsl 0.5    # also 73-96, 110-125
$PY scripts/music/abc2notes.py $REFS/jc_tarantellanap_201233905.abc --tune 16 --bars 9-17 --dsl 0.5
```

- **La Danza**: `bb_ladanza1.abc` voice 1 (grade C, see [REFERENCES.md](REFERENCES.md)), the
  ocarina line of Sam Rahbari's piano-and-ocarina arrangement. It is written against an E-major
  key signature with enharmonic spellings (C𝄪 = D, B♯ = C, F𝄪 = G, E♯ = F); the song uses the
  sounding pitches. The reference writes staccato as shortened notes plus rests; the song keeps the
  onsets and marks those notes staccato (`'`), which is the bounce of the tune ("C D C' B C B'").
  The grace E5 before the refrain's second and fourth "A" calls is written in the reference as an
  on-beat 32nd note; the song writes it the same way (`E5:1/4 A5':7/4`), so it scores 100 % rhythm.
- **Harmony of La Danza**: the reference's piano part (voices 2 and 3) was read half-bar by half-bar
  (all chord notes, a scratch music21 script) and confirmed against the raw ABC. The song keeps
  its harmony and bass line: verse Am | Am E7 | Am A7 | F F/A | C E7/B | Am Em/G | Dm7/F Dm6 | E7
  (a bass line A–G–F–A–C–B–A–G–F–D–E), the "salterà" (Am) C | C | Am7 | D7 | G | Gm | Dm | G7
  (the G-minor colour is Rossini's), the Neapolitan bridge C B♭/D | B♭ | B♭ | E7 E7/G♯ | Am B♭/D | … | E7,
  and the refrain A | A | E7/A | A | A | F♯7 A7/G | C♯m/G♯ G♯7 | C♯m E7 | … | E E7 | A. Two
  arranger's choices in the bass: the A7 of verse bars 3/11 is played over G (A7/G, leading the
  line down to F) where the piano's left hand holds an A pedal (the open fifth `[A,,E,]`, A at
  the bottom, in voice 3 bars 50–51 and 58–59; `abc2notes.py --text` shows E there only because
  it keeps the top note of chords), and the E7 bars end with a G♯ approach note.
- **Tarantella Napoletana**: `jc_tarantellanap_201233905.abc --tune 16` (grade A), A minor with
  chord symbols (Am Dm | Am E7). Strain B ("c B c d c B…", bars 9–17, pickup in bar 9) is used,
  **moved down a fifth to D minor** (chords Dm Gm | Dm A7) for the darker night colour and the
  clarinet's low register. In the reference the pickup follows strain A's cadence on the tonic
  (bar 8 "A r" over Am, then the pickup "A B"); the song does the same in D minor: the night's first
  bar is A7 (the refrain's A major turning into the dominant) for its first half and Dm under the
  pickup D4 E4 (bass A1 → D2).

## Form

♩. = 144 (bpm 144, 3 steps per beat, 6 steps per bar), one bar = 0.833 s. Bar numbers are the
song's global bars (`export-song.mjs streets --form`).

| Section | Song bars | Time (s) | Material (reference bars) | Key | Lead / texture |
|---------|-----------|----------|---------------------------|-----|----------------|
| intro | 1–4 | 0.00–3.33 | vamp Am Am Am E7; brass + timpani + crash hit on the downbeat, castanets alone, then bass, guitar, accordion chords, E7 brass stab and tambourine roll | A minor | percussion build |
| A | 5–20 | 3.33–16.67 | verse "Già la luna è in mezzo al mare…" (La Danza 49–64) | A minor | mandolin (tremolo on long notes); accordion joins in unison for the second half; light oom-pa-pa |
| B | 21–36 | 16.67–30.00 | "salterà", the repeated-note continuation (La Danza 73–88) | C major → G7 | accordion; clarinet an octave below in the G–Gm–Dm–G7 phrases; mandolin off-beat double stops under the tune (B3–B4); brass stabs |
| B2 | 37–44 | 30.00–36.67 | Neapolitan bridge, B♭ (♭II) → E7 (La Danza 89–96) | A minor | accordion + clarinet in unison; brass on every beat, voiced under the tune (top G4/F4/E4); timpani, bass drum, suspended-cymbal roll into C |
| C | 45–60 | 36.67–50.00 | A-major refrain (La Danza 110–125) | A major | mandolin + accordion in unison, clarinet thirds/sixths; brass + crash; stop-time "button" on the last bar |
| N | 61–76 | 50.00–63.33 | night: Tarantella Napoletana strain B twice (TN 9–17, 9–17) | D minor | low clarinet + cello an octave below, guitar arpeggios under the clarinet (C♯3–D4), pizzicato bass, soft castanets and tambourine shakes; 2nd time mandolin an octave up and low strings (F3–D4) swelling into A2 |
| A2 | 77–92 | 63.33–76.67 | verse again (49–64); bar 77 also carries the night tune's last note D4 | A minor | tutti: accordion, mandolin in unison, clarinet thirds/sixths, brass stabs at or under the tune, full percussion; suspended-cymbal and timpani roll into C2 |
| C2 | 93–108 | 76.67–90.00 | refrain again (110–125) | A major | tutti: accordion, mandolin an octave up, clarinet harmony, xylophone doubling the "A" calls (after the grace E in bars 97 and 105), tuba; tambourine roll into the loop |

The loop runs from A (bar 5, 3.333 s) to the end (90.0 s): loop body 104 bars = 86.67 s, total
music 90.0 s. Transitions: E7 → A (intro, B2 → C, A2 → C2); the refrain's final A becomes the
dominant of D minor (C → N: bar 61 is A7 for its first half and Dm under the strain's pickup); the
night strain ends on D over the Dm of A2's first half-bar (Dm | E7 → Am); C2's final A major chord
goes back to the A-minor verse at the seam (as in Rossini's piece, where the verse returns in A
minor after the refrain).

What is left out of La Danza on purpose: the piano introduction, bars 65–72 (the verse's resolution
lands on the first beat of the "salterà" instead, which starts with that A) and bars 97–109 (the
A-pedal passage; the Neapolitan bridge resolves straight into the refrain). The excerpts used are
complete and unaltered.

## Melody proofs (compare.py, default thresholds: pitch ≥ 95 %, rhythm ≥ 90 %, no broken bar)

```bash
PY=/home/user/.venv-audio/bin/python; REFS=/home/user/kitchenfight-refs/abc
LD="--abc $REFS/bb_ladanza1.abc --voice 1"
TN="--abc $REFS/jc_tarantellanap_201233905.abc --tune 16"
$PY scripts/music/compare.py $LD --ref-bars 49-64   --song streets --channel mand --section A
$PY scripts/music/compare.py $LD --ref-bars 73-88   --song streets --channel acc --section B
$PY scripts/music/compare.py $LD --ref-bars 89-96   --song streets --channel acc --section B2
$PY scripts/music/compare.py $LD --ref-bars 110-125 --song streets --channel mand,acc --section C
$PY scripts/music/compare.py $TN --ref-bars 9-17,9  --song streets --channel clarN --section N --bars 1-9
```

First statements (all PASS, no transposition except the night section, no octave displacements,
no tolerated ornaments):

| Theme | Reference bars | Song side | Pitch | Rhythm |
|-------|----------------|-----------|-------|--------|
| verse | La Danza 49–64 | `--channel mand --section A` | 100 % (77/77) | 100 % |
| verse, both lead channels | 49–64 | `--channel mand,acc --section A` | 100 % (77/77) | 100 % |
| "salterà" | 73–88 | `--channel acc --section B` | 100 % (64/64) | 100 % |
| Neapolitan bridge | 89–96 | `--channel acc --section B2` | 100 % (34/34) | 100 % |
| continuation in one piece | 73–96 | `--channel acc --bars 21-44` | 100 % (98/98) | 100 % |
| refrain, REFERENCES.md range | 110–124 | `--channel mand,acc --section C --bars 1-15` | 100 % (48/48) | 100 % |
| refrain with its final A | 110–125 | `--channel mand,acc --section C` | 100 % (49/49) | 100 % |
| Tarantella strain B + the repeat's pickup | TN 9–17,9 | `--channel clarN --section N --bars 1-9` | 100 % (44/44) | 100 % (−7 semitones) |
| same, REFERENCES.md range | TN 9–17 | same | 97.7 % (42/43) | 97.7 % — the only "extra" notes are the repeat's pickup D4 E4 at the end of song bar 9 |
| both statements of the strain | TN 9–17 `--expand-repeats` | `--channel clarN --bars 61-77` | 100 % (84/84) | 100 % |

Restatements (also unaltered): A2 accordion 100/100, A2 mandolin 100/100, C2 accordion 100/100,
C2 mandolin 100/100 (an octave up), A bars 9–16 accordion against 57–64 100/100, and C2 with the
xylophone merged into the line (`--channel mand,acc,xylo --section C2`) 100/100. No `--allow-bars`
and no `--resync` are needed anywhere.

## Instrumentation and ranges

Channels (instrument ids of the contract; all render with recorded samples). The ranges are the
notes actually played (`node scripts/music/export-song.mjs streets --per-section`):

- `mand` mandolin: verse E4–F5 (A, A2), refrain G♯4–A5 (C) and G♯5–A6 an octave up (C2), night
  C♯5–B♭5 (N, 2nd half). In B it plays off-beat double stops ("pa-pa", B3–B4), written out so they
  stay under the accordion's G4–G5: C4E4 | E4G4 (Am | C), E4G4 (C, Am7), F♯4A4 (D7), G4B4 (G),
  G4B♭4 (Gm), F4A4 (Dm), B3F4 (G7, resolving to C4E4), at vel 0.45 so every chop stays on the
  mandolin's soft sample layer (threshold 0.5, ±5 % velocity jitter).
- `acc` accordion: E4–A5.
- `clar` clarinet: harmony A3–C5 (A2) and C4–D♯5 (C, C2), the "salterà" an octave below
  (G3–G4), bridge unison G♯4–F5. `clarN` clarinet: night lead C♯4–B♭4 (plus the D4 that ends it
  on A2's downbeat). `cello`: C♯3–B♭3 (night, first statement).
- `accC` accordion chords: G3–G4, three voices, short "pa-pa".
- `gtr` nylon guitar: strums E3–E4; night arpeggios C♯3–D4 (figure 1-3-5-8-5-3 over Dm D3F3A3,
  Gm D3G3B♭3, A7 C♯3G3A3, so its octave note D4/C♯4 is at or under the clarinet).
- `bass` uprightBass G1–D3 (oom-pa with the reference's bass line), `tuba` E1–C♯2 (C2 only).
- `brass` stabs C3–E5. Intro, C and C2 voice A3–E5 under the refrain's A5 (C's final bar is the
  tutti button on the tune's last A4). B voices F3–D5 under the tune. B2 is written out under the
  tune (C G3C4E4G4, B♭ F3B♭3D4F4, E7 G♯3B3D4E4, Am E3A3C4E4; top G4/F4/E4 where the tune's low
  notes are G♯4–B♭4). A2 is written out at or under the tune's downbeat note (Dm D3F3A3D4 on the
  night tune's D4, C C3G3C4E4 on E4, Am A3C4E4A4 on A4).
- `xylo` xylophone A5–A6 (C2 only).
- `str` strings pad F3–D4 (N, 2nd half: Dm F3A3D4, Gm G3B♭3D4, A7 G3A3C♯4), under the clarinet,
  a gentle swell into A2 (velocity ×0.75 → ×1.15; measured −33.7 → −30.1 LUFS from bars 69–70 to
  75–76).
- `tamb` tambourine (accent / hit / shake / roll variants), `cast` castanets, `kick` orchestral
  bass drum.
- `crash` clash cymbals on the section arrivals (intro, C, A2, C2).
- `cym` suspended cymbal: the rolls into C and C2 (variant 1, the bank's roll at any velocity: SSO's
  crescendo roll, bright, growing evenly into its end); the roll into C2 is louder (velocity 0.9
  against 0.68), because the tutti's tambourine and castanets fill its band.
- `timp` timpani D2–A2.

Every part stays inside the brief's natural ranges. The clarinet parts leave breaths (rests every
four bars in the harmony, four-bar phrases in the "salterà"); the mandolin uses tremolo on notes
of a dotted quarter or longer (a quarter or longer in the night section).

Key and tempo: ♩. = 144, the reference keys (A minor verse, C major "salterà", A major refrain);
the Tarantella moved from A minor to D minor: a darker key and register for the night, and the
refrain's closing A major chord becomes its dominant.

## Render (recorded samples)

`node scripts/music/render-song.mjs streets out.wav` (48 kHz, sample bank: 54 sets):

- duration 96.00 s buffer = 90.0 s of music + the renderer's 6 s loop pad; loop 3.333 → 90.0 s
  (buffer window 9.333 → 96.000 s), body 86.667 s = bars 5–108 from section A;
  **seam mismatch −150.5 dBFS**, no event rings past the seam
- **loop body −16.3 LUFS** (−16.30; whole file −16.5), short-term max −14.8 LUFS, RMS −19.4 dBFS,
  **sample peak −2.96 dBFS**, soft clipper 31 samples (0.000 %), DC 0
- spectral balance: < 250 Hz −7.9 dB, 250 Hz–4 kHz −0.9 dB, > 4 kHz −14.9 dB
- `gainDb` −2.3, no warnings

| Channel | Instrument | Notes | Gain dB | Solo LUFS | vs mix (LU) | Peak dBFS |
|---------|------------|------:|--------:|----------:|------------:|----------:|
| mand | mandolin | 421 | −1.7 | −22.1 | −5.8 | −7.4 |
| acc | accordion | 312 | −2.4 | −18.2 | **−1.9** | −8.0 |
| clar | clarinet | 241 | −7.7 | −30.8 | −14.5 | −18.2 |
| clarN | clarinet | 84 | −1.6 | −21.0 | −4.7 | −12.2 |
| cello | cello | 42 | −9.6 | −30.2 | −13.9 | −17.8 |
| accC | accChord | 876 | −12.7 | −35.8 | −19.5 | −20.7 |
| gtr | guitar | 652 | −9 | −27.7 | −11.4 | −10.0 |
| bass | uprightBass | 215 | −5 | −27.9 | −11.6 | −14.4 |
| tuba | tuba | 32 | −12.1 | −33.8 | −17.5 | −20.8 |
| brass | brass | 164 | −13.2 | −27.3 | −11.0 | −10.2 |
| xylo | xylophone | 16 | −7 | −29.8 | −13.5 | −17.8 |
| str | strings | 25 | −7.7 | −31.6 | −15.3 | −20.1 |
| tamb | tamb | 516 | −5.3 | −35.2 | −18.9 | −15.9 |
| cast | castanets | 519 | −6 | −34.4 | −18.1 | −6.8 |
| kick | kick | 105 | −16 | −33.7 | −17.4 | −18.5 |
| crash | crash | 4 | −6.5 | −31.6 | −15.3 | −14.0 |
| cym | cymbal | 2 | −1.2 | −27.9 | −11.6 | −15.2 |
| timp | timpani | 33 | −6.8 | −28.9 | −12.6 | −11.9 |

Per section (integrated loudness of the section, and the solo loudness of its lead relative to the
section mix; measured with a scratch script that renders each channel solo through the same
renderer and sample bank; this table and the browser check below predate the current bank):

| Section | Mix LUFS | Lead (solo vs section mix) | Bass | Tambourine | Castanets |
|---------|---------:|----------------------------|-----:|-----------:|----------:|
| intro | −22.9 | (build-up: guitar −4.3, brass hits −4.6) | −5.5 | −14.3 | −9.0 |
| A | −17.4 | mandolin −2.2 (accordion −4.9 against the mix of bars 13–20, where it joins) | −11.1 | −19.7 | −22.9 |
| B | −15.9 | accordion −1.4 (mandolin double stops −11.5) | −12.5 | −19.7 | −16.4 |
| B2 | −16.1 | accordion −1.5 (brass −10.5) | −11.6 | −18.8 | −17.7 |
| C | −16.0 | mandolin −4.4 + accordion −3.9 in unison | −11.7 | −18.5 | −17.7 |
| N | −18.6 | clarinet −2.6 (mandolin −4.6 against the mix of bars 69–76; strings −13.0) | −9.9 | −21.9 | −21.2 |
| A2 | −15.4 | accordion −2.2 | −12.2 | −19.5 | −19.3 |
| C2 | −15.8 | accordion −2.6 (mandolin octave −7.4) | −11.3 | −18.1 | −17.1 |

The night section sits about 2.7 LU under the tutti sections on purpose; the first verse is the
light statement, A2/C2 the loudest.

**Chromium, real engine**: `audiotest.html` → `__at.samplerTrack('streets')` (browser MP3 decoding,
fresh music worker, dev server `scripts/vite.agent.config.ts`): decode 1.2 s, worker render 1.62 s,
longest main-thread frame gap 108 ms (measured while other renders loaded the machine), no page
errors. The result equals the Node render: same length and loop points (4 512 000 samples, loop
352 000 → 4 512 000), same −3.72 dBFS peak, difference 90.8 dB below the signal, zero lag.

## Review fixes (sample renders, before → after)

Band levels are a channel's solo render against the full mix over the same bars. The first three
figures are 1–2.5 / 2.5–6 / 6–16 kHz.

- **B, mandolin above the tune.** The old `comp(… lo E4, hi B4, n 2)` range could not hold most of
  the dyads, so the voicer stacked them up from E4 (C5A4, E5C5, G5C5, F5D5, B4F4 over the tune's
  G4). Its velocity, 0.5, also sat on the layer threshold. The double stops are now written out
  (B3–B4, above). Bars 22–23: the mandolin went from −4.2/−3.7/−2.4 dB to −5.9/−6.5/−8.0 dB, while
  the accordion tune is −2.9/−1.4/−10.4. Over all of B, the tune is now 6–7 dB above the chops at
  1–6 kHz.
- **N, first bar.** It was A7 for the whole bar with bass A1–C♯2, so C♯2 sounded under the pickup
  D. It is now A7 | Dm with bass A1–D2 (see above). The guitar arpeggio (C♯3–C♯4 voicing, octave
  note ≤ D4) no longer goes above the clarinet: before, it played G4/F4 above the clarinet's D4/C♯4
  and C♯4 against the held D4.
- **B2 / A2 brass above the tune.** Before, the B♭ chord's top B♭4 sat over the tune's A4, and
  A2's C chord went up to C5 over the tune's E4. Both are now written out under the tune. Setting
  `hi 'G4'` alone would not have worked: four voices with a doubled root need an octave plus the
  distance from `lo`, so the voicer falls back to B♭3–B♭4 again. B2 brass level: −10.9 → −10.5 LU.
- **N, strings.** Before, the voicer could not fit Gm into A3–F4 and fell back to G4B♭4D5, and the
  pad measured −23.1 LU against the mix of bars 69–76. It is now voiced F3–D4, gain −17 → −8 dB:
  −13.8 LU against the same mix, 8–12 dB under the clarinet at 160 Hz–2.5 kHz.
- **Crash and cymbal.** Crash gain −17 → −8 dB: solo peak −24.0 → −15.0 dBFS, and in the bar after
  each crash it went from −18.9/−25.7/−18.7 dB to −10.3/−16.8/−10.3 dB against the mix at
  2.5–6 kHz (C, A2, C2). In B2 the cymbal was at v 0.7, which plays the forte hit (a flat −41 dBFS
  wash). At v 0.68 it plays the roll, which rises from −53.5 to −35 dBFS over the bar. Cymbal gain
  −16 → −9 dB.
- **C2, xylophone.** In bars 97 and 105 its A6 sounded 34.7 ms before the mandolin's A6 (a flam on
  the grace). compare.py with the xylophone merged into the line read two wrong notes there (95.9 %).
  It now waits for the grace (`r:1/4 A5':7/4 …`): 100 %. Gain −10 → −7 dB: −11.2 to −12.6 LU in
  the call bars (was −14.1 to −15.3), still 4–5 LU under the mandolin it doubles.

## Polish: the cymbal rolls on the bright roll

The bank's suspended-cymbal roll (variant 1) was rebuilt bright (SSO's crescendo roll, spectral
centroid about 3.7 kHz instead of 0.6 kHz; it grows evenly into its end). A review had found both
rolls inaudible with the old, dark roll. Re-balanced for the new one: `cym` gain −5.2 → −1.2 dB,
and the roll into C2 velocity 0.65 → 0.9 (the A2 tutti's tambourine and castanets fill 6–12 kHz).

Measure (scratch script on the full render, same method as the review): the largest third-octave
rise of the mix over the mix without `cym` (63 Hz–12.5 kHz, bands within 40 dB of the window's
loudest), in the last 150 ms of the roll; "cover" = how much the roll raises the momentary
(400 ms, K-weighted) loudness there; "cymbal" / "lead" (mandolin + accordion) = their own
momentary loudness against the mix.

| Roll | Before (bright roll, old balance) | After | Cover | Cymbal vs mix | Lead vs mix |
|---|---|---|---|---|---|
| B2 → C, bar 44 (35.83 s, 0.75 s) | +4.0 dB at 6.3 kHz | **+6.7 dB** at 6.3 kHz | 0.15 LU | −13.0 LU | −1.9 LU |
| A2 → C2, bar 92 (75.83 s, 0.75 s) | +1.5 dB at 6.3 kHz | **+6.3 dB** at 6.3 kHz | 0.52 LU | −9.2 LU | −2.1 LU |

Both rolls rise more than 6 dB in their band at their end (+8.3 and +10.4 dB over the 200 ms
around it) and crest 7 LU or more under the tune. Melody channels are untouched; the five
compare.py proofs above give the same results. Render after the change: "Render" above.
