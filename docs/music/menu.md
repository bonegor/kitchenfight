# `menu` — "'O sole mio" (sunset serenade)

The music of the menus: a warm, unhurried Neapolitan serenade. A harp opens on the dominant, the
mandolin sings the verse "Che bella cosa" in tremolo over a fingerpicked nylon guitar and an upright
bass, a harp glissando opens the famous refrain, and the refrain comes round a second time on the
violin, with the mandolin as second voice, harp arpeggios and soft accordion after-beats, ending on
the song's high coda cadence before the verse starts again. Looping, 73.5 s of music
(loop body 72 s).

Song file: [`src/audio/songs/menu.ts`](../../src/audio/songs/menu.ts).

## The piece

| | |
|---|---|
| Piece | "'O sole mio", canzone napoletana (verse "Che bella cosa 'na jurnata 'e sole", refrain "Ma n'atu sole… 'O sole mio sta 'nfronte a te") |
| Composer | Eduardo di Capua (1865–1917), music; words by Giovanni Capurro (1859–1920), not used |
| Year | 1898 (Naples) |
| Status | Published in 1898, so public domain in the US; di Capua and Capurro died in 1917 and 1920, so their life + 70 terms ended long ago. **Caveat for the owner:** an Italian court reportedly recognised Alfredo Mazzucchi (1878–1972) as co-composer of the music in the early 2000s (the song's Wikipedia article recounts this; it cannot be checked from this offline environment). Where that applies, the music would stay protected in life + 70 countries (Italy, EU) until the end of 2042. The brief lists the piece as public domain. Only the melody is used. The ABC transcriptions are reference only and not committed. |

## How the game plays it

`src/ui/ui.ts` calls `audio.playMusic('menu')` on the chef select, the shop and the collection
("Il Ricettario"). The stage select does not change the music, so the track keeps playing there, and
moving between these screens never restarts it (`playMusic` with the current id continues).
`src/main.ts` preloads it with `title` at boot. Players can sit in these screens for minutes, so
the loop is gentle, without percussion, and has three different textures in 72 s.

## Reference and melody proof

Reference (grade B in [`REFERENCES.md`](REFERENCES.md)): `jc_solemio_201318418.abc --tune 1`
(John Chambers), G major, 4/4, L:1/4, chord symbols. **Verse bars 1–16**, **refrain bars 17–32**
(both under `|: :|`), coda 33–36. The song file transcribes these bars note for note (one DSL step
= the reference's quarter note):

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/jc_solemio_201318418.abc --tune 1 --text      # bars, chords
$PY scripts/music/abc2notes.py $REFS/jc_solemio_201318418.abc --tune 1 --bars 17-32 --dsl 1
```

**First statements** (mandolin), the exact commands of REFERENCES.md, default thresholds:

| Theme | Command | Result |
|---|---|---|
| Verse "Che bella cosa" | `$PY scripts/music/compare.py --abc $REFS/jc_solemio_201318418.abc --tune 1 --ref-bars 1-16 --song menu --channel mand --section verse` | **PASS** 100.0 % pitch (45/45), 100.0 % rhythm, no broken bar |
| Refrain "'O sole mio" | `$PY scripts/music/compare.py --abc $REFS/jc_solemio_201318418.abc --tune 1 --ref-bars 17-32 --song menu --channel mand --section chorus` | **PASS** 100.0 % pitch (35/35), 100.0 % rhythm, no broken bar |

compare.py finds "1 candidate beat = 2 reference quarters" (the song counts in half notes, see
Tempo). No `--allow-bars` or `--resync`.

**Cross-checks** (same transcriber family, as the brief asks). The mandolin differs from these
editions exactly where they differ from X:1:

| Against | Result | Differences |
|---|---|---|
| X:2 (A major) verse 1–16 | 100 % / 95.6 %, bar 16 "broken" | X:2 ends the verse A (♩) G (𝅗𝅥.) where X:1 has A (𝅗𝅥) G (𝅗𝅥). With `--allow-bars 16`: PASS 100 / 100 |
| X:2 refrain 17–32 | 94.1 % / 94.1 % | bar 18: X:2 has a grace F♯ into a held D (`{g}e2 e2`), X:1 F♯–D–D; bar 27: X:2's tie `=f4- \| fd` drops the natural (a transcription defect). With `--allow-bars 18,27`: PASS 100 / 96.4 |
| `jc_solemio_201318427.abc` verse / refrain | as X:2 | same two edition differences; its bar 27 tie `_e4- \| ec` drops the flat (E♮). With `--allow-bars 16` / `18,27`: PASS 100 / 100 and 100 / 96.4 |

**Varied restatement** (violin, section `chorus2`, stated liberties): bar 18 follows X:2 and the
1999 edition (grace into a held D), and the coda's high cadence (reference bars 35–36, top notes of
its thirds) replaces bars 31–32.

```bash
$PY scripts/music/compare.py --abc $REFS/jc_solemio_201318418.abc --tune 1 --ref-bars 17-30,35-36 --allow-bars 18 \
    --song menu --channel vln --section chorus2          # PASS 100.0 % / 96.9 %
$PY scripts/music/compare.py --abc $REFS/jc_solemio_201318418.abc --tune 2 --ref-bars 17-30 \
    --song menu --channel vln --section chorus2 --bars 1-14   # PASS 96.7 % / 93.3 % (X:2's bar 26–27 tie defect)
```

Other liberties: the fermatas on "Ma n'a-tu" (bar 17) and the "rit." of bar 15 are not held, so
the loop keeps a steady pulse (compare.py ignores these marks); a few phrasing velocities (`@`) on
the mandolin.

## Tempo, meter and key

- **Tempo.** The brief asks for "Andante (~72–84 bpm)", verse + refrain with a varied second pass,
  and 60–75 s. Counting the reference's quarter note at 72–84 turns the song into a dirge (a bar =
  2.9–3.3 s) and verse + refrain alone would take 91–107 s, with no room for a second pass. The
  song moves in two: each reference bar is two half-note beats (the same as a 2/4 bar of
  eighth-note syllables). At **𝅗𝅥 = 80** (`bpm: 80`, `stepsPerBeat: 2`, `barSteps: 4`; one step = the
  reference's ♩, so ♩ = 160) a bar lasts 1.5 s, the melody flows at a singing pace, and verse +
  refrain + varied refrain fit in 72 s.
- **Tremolo rate.** The engine re-plucks tremolo notes `round(13.5 × step)` times per step. With a
  quarter-note step (0.375 s) that is 5 strokes per step = 13.3 Hz, a relaxed serenade tremolo. An
  eighth-note grid would have given 16 Hz, which is agitated.
- **Key: G major**, the reference's key. It is idiomatic for mandolin (G–D–A–E tuning) and guitar.
  The verse lies D4–D5 and the refrain F♯4–G5 (with E♭5 in the minor bars), the mandolin's singing
  middle register; the violin restatement G4–B5 (coda) lies mostly on the A and E strings.

## Form

1 bar = 1.5 s. Song bars are counted from the start of the form; the reference bars are in brackets.

| Section | Song bars | Time | Ref. bars | Lead | Texture |
|---|---|---|---|---|---|
| `intro` | 1 | 0.0–1.5 s | — | harp | rolled D7 harp arpeggio D3→C5, bass D–F♯ (plays once) |
| `verse` | 2–17 | 1.5–25.5 s | 1–16 | mandolin (tremolo on 𝅗𝅥 and longer) | nylon guitar arpeggios in eighths between the bass notes, upright bass in two; soft sustained accordion chords from song bar 10 (ref 9) to 16 (ref 15); harp glissando D3→D5 on the last two beats into the refrain |
| `chorus` | 18–33 | 25.5–49.5 s | 17–32 | mandolin | guitar (now with its low note on the downbeat), bass, light strings pad (A3–G4, below the tune, common tones tied); harp lands the glissando with a rolled G chord, a G7 roll fills the rest at ref bar 25, and a G3→G5 glissando leads into the second refrain |
| `chorus2` | 34–49 | 49.5–73.5 s | 17–30, coda 35–36 | violin | mandolin second voice (tremolo, sixths then thirds, 7ths resolving), harp arpeggios (a sweep up and back per bar, ringing), accordion after-beats on 2 and 4, bass with approach notes, strings pad very soft; ends on the coda's high G |

Loop: `loopFrom: 1`. The track plays the intro once, then repeats song bars 2–49 (1.5 → 73.5 s,
72.0 s). The last bar's bass walks B–A back to the verse's G, and the verse restarts like a new
strophe. The rendered buffer is 77.5 s (the renderer's 4 s seam pad).

## Harmony and bass

Chords are the reference's symbols: verse G G G Am Am D7 D7 G | G G G Am Am G D7 G, refrain
G G G Am Am Am D7 G | G (G7) Cm Cm G G D7 D7 G. A symbol the reference leaves implicit continues the
previous chord. One enrichment: the second half of ref bar 25 is G7, with B in the bass, the
secondary dominant into the C-minor bars (its F resolves to E♭); it is still the reference's G chord.

The upright bass is written out, in two, with inversions (G/B in ref bars 3, 11, 14, 19, 25 and 29, Am/C,
D7/F♯ in bars 7, 15 and 30, Cm/E♭ in bar 27, G/D in bar 28) and approach notes (D–F♯→G into ref bar 9
and into ref bar 25 of the second refrain, G–A→B into bar 29, B–A→G at the loop seam). Cadences avoid
outer-voice parallel octaves (bar 7 uses A, not F♯, under the passing G; bar 31 uses A–D, not F♯).

**Voice-leading check.** A scratch script listed every semitone overlap (m2, M7, m9) between the lead
and the accompaniment, and these were fixed: the strings' D7 voicing put C5 above the tune's
A4–B4 (range now A3–G4), the accordion's D7 after-beats did the same above the violin (range now
F♯3–E4), and the harp glissandi rubbed F♯ against the held final G (pedals now set to G pentatonic,
G A B D E, as harpists set them). What remains are the tune's own non-chord tones against the
reference harmony: the F♯5 appoggiatura over G in ref bars 17–19, the passing C5 over G (bars 1, 9),
the passing B4 over Am/D7 (bars 13, 15, 23, 31), the passing G4 over D7 (bar 7), and the coda's B5,
the 13th over D7.

## Instrumentation

| Channel | Instrument id | Role | Range | Gain dB |
|---|---|---|---|---|
| `mand` | `mandolin` | lead in verse and refrain; tremolo on notes ≥ 𝅗𝅥 (13.3 Hz), single strokes on ♩; grace notes as written | D4–G5 | 0 (hum 0.6) |
| `vln` | `violin` | lead of the second refrain | G4–B5 | −4 |
| `mandH` | `mandolin` | second voice under the violin, tremolo | E♭4–E♭5 | −6 |
| `gtr` | `guitar` (nylon) | fingerpicked arpeggios, notes ring until the chord changes | B2–D4 | −8 |
| `harp` | `harp` | intro arpeggio, glissandi, rolled chords, arpeggios in the second refrain | A2–G5 | −8 |
| `bass` | `uprightBass` | bass in two | D2–E♭3 | −4.5 |
| `acc` | `accordionDry` | soft sustained chords, second half of the verse | C3–B3 | −15 |
| `accC` | `accChord` | after-beats (staccato) in the second refrain | F♯3–F4 | −10 |
| `str` | `strings` | light pad in the refrains | A3–G4 | −15 |

All ids are contract instruments and render with recorded samples. Reverb: rt60 1.9 s, wet 1.6 (a
warm evening room).

## Measurements (sample render)

`node scripts/music/render-song.mjs menu out.wav --target -17.4` (recorded bank, 53 sets):

```
menu: 77.50 s @ 48000 Hz
  loop: plays 0 → 77.500 s, then repeats 5.500 → 77.500 s (body 72.000 s = bars 2-49 from section "verse"; seam mismatch -132.3 dBFS)
  loop body: integrated -17.4 LUFS (whole file -17.5), short-term max -16.0 LUFS, RMS -20.7 dBFS, sample peak -5.12 dBFS
  soft clipper: 0 samples (0.000 %)
  spectral balance: <250 Hz -6.6 dB, 250 Hz-4 kHz -1.3 dB, >4 kHz -14.5 dB (share of total energy)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  mand         mandolin           80      0      -18.9    -1.5       -17.1       -6.5
  vln          violin             34     -4      -18.2    -0.8       -17.2       -8.7
  mandH        mandolin           30     -6      -29.6   -12.2       -28.9      -16.5
  gtr          guitar            208     -8      -27.1    -9.7       -26.3      -13.1
  harp         harp              166     -8      -26.9    -9.5       -25.4      -11.6
  bass         uprightBass       102   -4.5      -27.1    -9.7       -26.1      -10.7
  acc          accordionDry       11    -15      -31.6   -14.2       -31.3      -20.2
  accC         accChord           96    -10      -33.0   -15.6       -33.6      -15.4
  str          strings            38    -15      -33.2   -15.8       -31.2      -19.2
  warnings: none
```

- **Loudness**: −17.4 LUFS over the loop body, the menu target (−17.4 ± 0.5); `gainDb: 1.2`.
- **Peak** −5.1 dBFS, below the soft clipper's knee (0.62 = −4.2 dBFS), so the clipper never acts.
  An earlier version touched it with one mandolin stroke, when humanize velocity jitter, the left
  pan and that stroke's attack added up. The mandolin's humanize scale is 0.6 (a steadier player).
- **Lead on top**: the mandolin is −1.5 LU and the violin −0.8 LU against the whole mix. Per section
  (K-weighted, gated), the lead is −1.3 / −1.1 / −1.3 LU below the section mix.
- **Arc** (section loudness): intro −22.8, verse −18.2, refrain −17.1, varied refrain −17.0 LUFS. It
  builds gently and drops by about 2 LU when the verse returns, like a new strophe.
- **Seam**: −132.3 dBFS mismatch. No event before the loop rings past the seam.
- **Chromium**: `audiotest.html` `__at.samplerTrack('menu')` (MP3s decoded by Chromium, real render
  worker) renders in 0.93 s with no errors. Its output is the same as the Node render: the difference
  is −111.5 dBFS RMS, at zero lag, with the same length and loop window.
- `npx tsc --noEmit` clean; `node scripts/music/selftest/formcheck.mjs`: `ok menu`.
