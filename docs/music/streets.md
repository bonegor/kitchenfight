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
  line down to F) where the piano holds an A pedal, and the E7 bars end with a G♯ approach note.
- **Tarantella Napoletana**: `jc_tarantellanap_201233905.abc --tune 16` (grade A), A minor with
  chord symbols (Am Dm | Am E7). Strain B ("c B c d c B…", bars 9–17, pickup in bar 9) is used,
  **moved down a fifth to D minor** (chords Dm Gm | Dm A7) for the darker night colour and the
  clarinet's low register.

## Form

♩. = 144 (bpm 144, 3 steps per beat, 6 steps per bar), one bar = 0.833 s. Bar numbers are the
song's global bars (`export-song.mjs streets --form`).

| Section | Song bars | Time (s) | Material (reference bars) | Key | Lead / texture |
|---------|-----------|----------|---------------------------|-----|----------------|
| intro | 1–4 | 0.00–3.33 | vamp Am Am Am E7; brass + timpani + crash hit on the downbeat, castanets alone, then bass, guitar, accordion chords, E7 brass stab and tambourine roll | A minor | percussion build |
| A | 5–20 | 3.33–16.67 | verse "Già la luna è in mezzo al mare…" (La Danza 49–64) | A minor | mandolin (tremolo on long notes); accordion joins in unison for the second half; light oom-pa-pa |
| B | 21–36 | 16.67–30.00 | "salterà", the repeated-note continuation (La Danza 73–88) | C major → G7 | accordion; clarinet an octave below in the G–Gm–Dm–G7 phrases; mandolin off-beat chops; brass stabs |
| B2 | 37–44 | 30.00–36.67 | Neapolitan bridge, B♭ (♭II) → E7 (La Danza 89–96) | A minor | accordion + clarinet in unison; brass on every beat, timpani, bass drum, cymbal roll into C |
| C | 45–60 | 36.67–50.00 | A-major refrain (La Danza 110–125) | A major | mandolin + accordion in unison, clarinet thirds/sixths; brass + crash; stop-time "button" on the last bar |
| N | 61–76 | 50.00–63.33 | night: Tarantella Napoletana strain B twice (TN 9–17, 9–17) | D minor | low clarinet + cello an octave below, guitar arpeggios, pizzicato bass, soft castanets and tambourine shakes; 2nd time mandolin an octave up, strings swell |
| A2 | 77–92 | 63.33–76.67 | verse again (49–64); bar 77 also carries the night tune's last note D4 | A minor | tutti: accordion, mandolin in unison, clarinet thirds/sixths, brass, full percussion; cymbal + timpani roll into C2 |
| C2 | 93–108 | 76.67–90.00 | refrain again (110–125) | A major | tutti: accordion, mandolin an octave up, clarinet harmony, xylophone on the "A" calls, tuba; tambourine roll into the loop |

The loop runs from A (bar 5, 3.333 s) to the end (90.0 s): loop body 104 bars = 86.67 s, total
music 90.0 s. Transitions: E7 → A (intro, B2 → C, A2 → C2); the refrain's final A becomes the
dominant of D minor (C → N, bar 61 is A7 with the strain's pickup); the night strain ends on D
over the Dm of A2's first half-bar (Dm | E7 → Am); C2's final A major chord goes back to the A-minor
verse at the seam (as in Rossini's piece, where the verse returns in A minor after the refrain).

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
C2 mandolin 100/100 (an octave up), A bars 9–16 accordion against 57–64 100/100. No `--allow-bars`
and no `--resync` are needed anywhere.

## Instrumentation and ranges

Channels (instrument ids of the contract; all render with recorded samples): `mand` mandolin
(verse E4–F5 in A and A2, refrain A4–A5 in C and A5–A6 an octave up in C2, night D5–B♭5,
"salterà" off-beat chops E4–B4), `acc` accordion (E4–G5), `clar` clarinet (harmony
A3–D♯5; the "salterà" an octave below G3–G4; bridge unison G♯4–F5), `clarN` clarinet (night lead
C♯4–B♭4), `cello` (C♯3–B♭3), `accC` accordion chords (G3–G4, three voices, short "pa-pa"),
`gtr` nylon guitar (strums E3–E4, night arpeggios D3–D4), `bass` uprightBass (G1–D3, oom-pa with
the reference's bass line), `tuba` (E1–C♯2, C2 only), `brass` stabs (F3–E5), `xylo` xylophone
(A5/A6 calls, C2 only), `str` strings pad (A3–F4, night 2nd half), `tamb` tambourine (accent / hit /
shake / roll variants), `cast` castanets, `kick` orchestral bass drum, `crash` clash cymbals,
`cym` suspended cymbal roll, `timp` timpani (D2–A2). Every part stays inside the brief's natural
ranges. The clarinet parts leave breaths (rests every four bars in the harmony, four-bar phrases in
the "salterà"); the mandolin uses tremolo on notes of a dotted quarter or longer (a quarter or longer in the
night section).

Key and tempo: ♩. = 144, the reference keys (A minor verse, C major "salterà", A major refrain);
the Tarantella moved from A minor to D minor: a darker key and register for the night, and the
refrain's closing A major chord becomes its dominant.

## Render (recorded samples)

`node scripts/music/render-song.mjs streets out.wav` (48 kHz, sample bank: 53 sets):

- duration 94.00 s buffer = 90.0 s of music + the renderer's 4 s loop pad; loop 3.333 → 90.0 s
  (buffer window 7.333 → 94.000 s), body 86.667 s = bars 5–108 from section A;
  **seam mismatch −145.7 dBFS**, no event rings past the seam
- **loop body −16.4 LUFS** (whole file −16.6), short-term max −14.9 LUFS, RMS −19.5 dBFS,
  **sample peak −3.96 dBFS**, soft clipper 3 samples (0.000 %), DC 0
- spectral balance: < 250 Hz −8.5 dB, 250 Hz–4 kHz −0.8 dB, > 4 kHz −14.8 dB
- `gainDb` −2.3, no warnings

| Channel | Instrument | Notes | Gain dB | Solo LUFS | vs mix (LU) | Peak dBFS |
|---------|------------|------:|--------:|----------:|------------:|----------:|
| mand | mandolin | 421 | 0.5 | −22.0 | −5.7 | −7.3 |
| acc | accordion | 312 | −1 | −18.4 | **−2.0** | −7.9 |
| clar | clarinet | 241 | −7 | −30.8 | −14.5 | −19.4 |
| clarN | clarinet | 84 | −0.5 | −21.2 | −4.8 | −12.5 |
| cello | cello | 42 | −8 | −30.2 | −13.9 | −20.2 |
| accC | accChord | 876 | −9.5 | −35.8 | −19.4 | −20.0 |
| gtr | guitar | 652 | −9 | −27.8 | −11.5 | −10.1 |
| bass | uprightBass | 215 | −5 | −27.9 | −11.6 | −14.4 |
| tuba | tuba | 32 | −10 | −33.9 | −17.5 | −20.7 |
| brass | brass | 164 | −16 | −27.5 | −11.2 | −11.0 |
| xylo | xylophone | 16 | −10 | −33.1 | −16.8 | −19.3 |
| str | strings | 33 | −17 | −41.0 | −24.6 | −29.9 |
| tamb | tamb | 516 | −3.5 | −35.4 | −19.0 | −16.8 |
| cast | castanets | 519 | −6 | −34.5 | −18.2 | −6.9 |
| kick | kick | 105 | −16 | −33.7 | −17.4 | −18.0 |
| crash | crash | 4 | −17 | −40.9 | −24.5 | −24.0 |
| cym | cymbal | 2 | −16 | −41.0 | −24.7 | −27.8 |
| timp | timpani | 33 | −8 | −29.0 | −12.7 | −12.1 |

Per section (integrated loudness of the section, and the solo loudness of its lead relative to the
section mix; measured with a scratch script that renders each channel solo through the same
renderer and sample bank):

| Section | Mix LUFS | Lead (solo vs section mix) | Bass | Tambourine | Castanets |
|---------|---------:|----------------------------|-----:|-----------:|----------:|
| intro | −22.9 | (build-up: guitar −4.3, brass hits −4.6) | −5.5 | −14.3 | −8.9 |
| A | −17.4 | mandolin −2.2 (accordion −4.1, 2nd half) | −11.1 | −19.7 | −22.9 |
| B | −15.8 | accordion −1.5 | −12.6 | −19.8 | −16.5 |
| B2 | −16.1 | accordion −1.5 | −11.6 | −18.8 | −17.7 |
| C | −16.0 | mandolin −4.4 + accordion −3.9 in unison | −11.7 | −18.5 | −17.7 |
| N | −18.6 | clarinet −2.5 (mandolin −3.6, 2nd half) | −9.8 | −21.8 | −21.1 |
| A2 | −15.4 | accordion −2.2 | −12.2 | −19.5 | −19.3 |
| C2 | −15.9 | accordion −2.5 (mandolin octave −7.4) | −11.2 | −18.0 | −17.0 |

The night section sits about 2.7 LU under the tutti sections on purpose; the first verse is the
light statement, A2/C2 the loudest.

**Chromium, real engine**: `audiotest.html` → `__at.samplerTrack('streets')` (browser MP3 decoding,
fresh music worker, dev server `scripts/vite.agent.config.ts`): decode 1.1 s, worker render 1.76 s,
longest main-thread frame gap 45 ms, no page errors; the result equals the Node render (same
length and loop points, same −3.96 dBFS peak, difference 90.8 dB below the signal, zero lag).
