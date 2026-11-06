# `menu` — "'O sole mio" (sunset serenade)

The music of the menus: a warm, unhurried Neapolitan serenade. A harp opens on the dominant, the
mandolin sings the verse "Che bella cosa" in tremolo over a fingerpicked nylon guitar and an upright
bass, a harp glissando opens the famous refrain, and the refrain comes round a second time on the
violin, with the mandolin as second voice, harp arpeggios and soft accordion after-beats. It rises
to the song's high coda cadence while the bass walks down to the dominant, and the harp's D7 bar
that opened the track turns it round into the next verse. The whole form loops: 73.5 s.

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
the loop is gentle, without percussion, has three different textures, and never stops on a final
cadence: every pass runs through the D7 turnaround into the next verse.

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

**Articulation of the repeated half notes.** The refrain's repeated half notes carry two
syllables: "mi-o" in ref bars 22 and 28, "so-le" in bar 26. In tremolo, two half notes on the
same pitch would otherwise run together as one 1.5 s note, because the strokes simply continue
across the bar's middle. A mandolinist lifts and re-strikes, so the first note is written
`C5~:1.75 r:0.25` (a sixteenth's lift; `~` keeps the shortened note in tremolo). compare.py counts
this as articulation: the scores above are unchanged.

Measured on the mandolin solo render, the last 50 ms before the second note sit below the first
note's median level by:

| Bar | Before the lift | With the lift |
|---|---|---|
| 22 | 0.1 dB | 7.7 dB |
| 26 | 3.2 dB | 8.8 dB |
| 28 | 0.7 dB | 6.4 dB |
| A tied whole note (control) | −0.3 dB | −0.3 dB |

The 10 ms envelope falls 15–17 dB across the lift, then the new note attacks. The quarter →
half repeats (verse bars 6 and 8, refrain bar 18) were already re-articulated: there a single
stroke decays before the tremolo starts.

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

Other liberties:

- The fermatas on "Ma n'a-tu" (bar 17) and the "rit." of bar 15 are not held, so the loop keeps a
  steady pulse (compare.py ignores these marks).
- A few phrasing velocities (`@`) on the mandolin.

## Tempo, meter and key

- **Tempo.** The brief asks for "Andante (~72–84 bpm)", verse + refrain with a varied second pass,
  and 60–75 s. Counting the reference's quarter note at 72–84 turns the song into a dirge (a bar =
  2.9–3.3 s) and verse + refrain alone would take 91–107 s, with no room for a second pass. The
  song moves in two: each reference bar is two half-note beats (the same as a 2/4 bar of
  eighth-note syllables). At **𝅗𝅥 = 80** (`bpm: 80`, `stepsPerBeat: 2`, `barSteps: 4`; one step = the
  reference's ♩, so ♩ = 160) a bar lasts 1.5 s, the melody flows at a singing pace, and intro +
  verse + refrain + varied refrain fit in 73.5 s.
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
| `intro` | 1 | 0.0–1.5 s | — | harp | rolled D7 harp arpeggio D3→C5, bass D–F♯. It opens the track, and on every later pass it is the turnaround from the refrain's final G into the verse |
| `verse` | 2–17 | 1.5–25.5 s | 1–16 | mandolin (tremolo on 𝅗𝅥 and longer) | nylon guitar arpeggios in eighths between the bass notes, upright bass in two; soft sustained accordion chords from song bar 10 (ref 9) to 16 (ref 15); harp glissando D3→D5 on the last two beats into the refrain |
| `chorus` | 18–33 | 25.5–49.5 s | 17–32 | mandolin (lifts before the repeated half notes of bars 22, 26 and 28) | guitar (now with its own low note on the downbeat, voiced from D3 up), bass, light strings pad (A3–G4, below the tune, common tones tied); harp lands the glissando with a rolled G chord, a G7 roll fills the rest of ref bar 25, and a G3→G5 glissando leads into the second refrain |
| `chorus2` | 34–49 | 49.5–73.5 s | 17–30, coda 35–36 | violin | mandolin second voice (tremolo, sixths then thirds, 7ths resolving), harp arpeggios (a sweep up and back per bar, ringing), accordion after-beats on 2 and 4, bass with approach notes, strings pad very soft. It rises to the coda's high G while the bass walks G–F♯–E down to the turnaround's D |

**Loop.** `loopFrom: 0`: the whole form loops, 49 bars = 73.5 s. Playback runs 0 → 77.5 s, then
repeats 4.0 → 77.5 s (the renderer's 4 s seam pad). Each pass rises to the coda's high V–I
cadence, the song's own ending. The D7 bar then turns that tonic into a dominant at once, and the
bass walk (G–F♯–E → D) leads there. So the seam reads as a turnaround into the next verse, not as
the piece ending and starting over. The old loop (`loopFrom: 1`, 72 s) went from that final
cadence straight into the verse.

Loudness bar by bar across the seam (K-weighted, the audio as it plays):

| Bar | Loudness |
|---|---|
| Last bar (coda G) | −14.8 LUFS |
| D7 turnaround | −21.7 LUFS |
| First verse bar | −18.8 LUFS |

The loudest bar of the loop is −14.1 LUFS. The turnaround is a breath between strophes, where the
old loop dropped straight from the cadence into the verse.

Seam mismatch: −134.8 dBFS. No event outlasts the loop end.

## Harmony and bass

Chords are the reference's symbols: verse G G G Am Am D7 D7 G | G G G Am Am G D7 G, refrain
G G G Am Am Am D7 G | G (G7) Cm Cm G G D7 D7 G. A symbol the reference leaves implicit continues the
previous chord. One enrichment: the second half of ref bar 25 is G7, with B in the bass, the
secondary dominant into the C-minor bars (its F resolves to E♭); it is still the reference's G chord.

The upright bass is written out, in two, with:

- **inversions:** G/B in ref bars 3, 11, 14, 19, 25 and 29; Am/C; D7/F♯ in bars 7, 15 and 30;
  Cm/E♭ in bar 27;
- **approach notes:** D–F♯→G into ref bar 9, and into ref bar 25 of the second refrain;
  G–F♯–E→D at the loop seam.

On "mi-o" (ref 28) the C-minor bars resolve to a **root-position G** (G2, then D3): the minor
plagal iv–I. The bass leaves the E♭3 of bar 27 by a leap down to G2 while the tune steps
E♭5–D5. This replaces an E♭3–D3 (G/D) step that moved in parallel octaves with the tune in both
refrains.

**Outer voices.** A scripted check of the melody against the bass, on every onset of either
voice, finds no parallel octaves or fifths and no direct octave or fifth reached by a leap in the
tune. The one remaining perfect interval in a row is a *contrary* octave at ref bar 30, in both
refrains: the bass G2→D2 under the tune's G4→D5, the arrival on the dominant. Bar 7 uses A, not
F♯, under the passing G, and bar 31 uses A–D, not F♯.

**Voice-leading check** (a scratch script over the exported events; overlaps by written length, a
staccato note by its sounding length).

*Below the bass.* No accompaniment note sounds below the bass at any moment. That includes a
ringing note under a later bass note. Three things make this so:

- **Guitar (refrain).** It is voiced from D3 up: G = D3 G3 B3 (D4), Am = E3 A3 C4 (E4),
  D7 = D3 F♯3 C4 (D4) (the 5th-fret grip), Cm = E♭3 G3 C4 (E♭4). The old range from B2 put a
  C3 under the bass's D3 in ref bar 23, played the D7 with a C3–D3 second, and put a B2 under the
  D3 of ref bar 28.
- **Harp (second refrain).** It plays fixed hand shapes. D7 = D3 F♯3 A3 C4 is root position with
  its fifth, where the old C3 D3 F♯3 rang a whole bar under the bass's D3 and rubbed C3 against
  D3. The other shapes are unchanged: G = B2 D3 G3, Am = A2 C3 E3, Cm = C3 E♭3 G3,
  G7 = B2 F3 G3.
- **Damping.** A ringing low string is damped where the bass moves above it. This happens in ref
  bars 22, 27 and 28, where the bass rises to C3, E♭3 and D3 within the same chord.

*Seconds.* No second in the bass register: no m2 or M2 with its lower note below E♭3, the usual
low-interval limit. Two exceptions, both deliberate:

- The harp glissandi wash adjacent pentatonic strings. These are whole tones by design.
- In ref bar 25 the harp's G7 descent leaves F3 under the ringing G3 for 0.19 s, the chord's 7th
  and root in the tenor. F3 then resolves to E♭3. The accordion's G3 there is staccato and has
  stopped before the F3.

The accordion pad of the verse now voices D7 as D3 F♯3 C4: range D3–C4. Its old C3 D3 F♯3 had
the same low second as the guitar.

*Earlier fixes.* Semitone overlaps (m2, M7, m9) between the lead and the accompaniment were
listed and fixed:

- The strings' D7 voicing put C5 above the tune's A4–B4; the strings now stay in A3–G4.
- The accordion's D7 after-beats did the same above the violin; they now stay in F♯3–E4.
- The harp glissandi rubbed F♯ against the held final G. The pedals are now set to G pentatonic
  (G A B D E), as harpists set them.

What remains are the tune's own non-chord tones against the reference harmony:

- the F♯5 appoggiatura over G in ref bars 17–19;
- the passing C5 over G (bars 1 and 9);
- the passing B4 over Am/D7 (bars 13, 15, 23 and 31);
- the passing G4 over D7 (bar 7);
- the coda's B5, the 13th over D7;
- the seam walk's passing F♯2 under the violin's final G5.

## Instrumentation

| Channel | Instrument id | Role | Range | Gain dB |
|---|---|---|---|---|
| `mand` | `mandolin` | lead in verse and refrain; tremolo on notes ≥ 𝅗𝅥 (13.3 Hz), single strokes on ♩; grace notes as written; lifts before re-struck repeated notes | D4–G5 | 0 (hum 0.6) |
| `vln` | `violin` | lead of the second refrain | G4–B5 | −4 |
| `mandH` | `mandolin` | second voice under the violin, tremolo | E♭4–E♭5 | −6 |
| `gtr` | `guitar` (nylon) | fingerpicked arpeggios; notes ring until the chord changes (2 steps at most) | D3–F4 | −8 |
| `harp` | `harp` | intro arpeggio, glissandi, rolled chords, arpeggios on fixed shapes in the second refrain (strings ring to the bar end unless the bass moves above them) | A2–G5 | −8 |
| `bass` | `uprightBass` | bass in two | D2–E♭3 | −4.5 |
| `acc` | `accordionDry` | soft sustained chords, second half of the verse | D3–C4 | −15 |
| `accC` | `accChord` | after-beats (staccato) in the second refrain | F♯3–F4 | −10 |
| `str` | `strings` | light pad in the refrains | A3–G4 | −15 |

All ids are contract instruments and render with recorded samples. Reverb: rt60 1.9 s, wet 1.6 (a
warm evening room).

## Measurements (sample render)

`node scripts/music/render-song.mjs menu out.wav --target -17.4` (recorded bank, 53 sets):

```
menu: 77.50 s @ 48000 Hz, 1230 events
  loop: plays 0 → 77.500 s, then repeats 4.000 → 77.500 s (body 73.500 s = bars 1-49 from section "intro"; seam mismatch -134.8 dBFS)
  loop body: integrated -17.4 LUFS (whole file -17.5), short-term max -15.9 LUFS, RMS -20.7 dBFS, sample peak -4.99 dBFS
  soft clipper: 0 samples (0.000 %)
  spectral balance: <250 Hz -6.7 dB, 250 Hz-4 kHz -1.2 dB, >4 kHz -14.5 dB (share of total energy)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  mand         mandolin           80      0      -18.8    -1.4       -17.1       -6.2
  vln          violin             34     -4      -18.1    -0.8       -17.1       -8.6
  mandH        mandolin           30     -6      -29.5   -12.1       -28.8      -16.4
  gtr          guitar            208     -8      -27.0    -9.7       -26.4      -13.9
  harp         harp              166     -8      -26.6    -9.2       -25.0      -11.6
  bass         uprightBass       101   -4.5      -27.0    -9.7       -26.2      -10.6
  acc          accordionDry       11    -15      -31.5   -14.1       -31.2      -20.6
  accC         accChord           96    -10      -32.9   -15.5       -33.5      -15.3
  str          strings            38    -15      -33.1   -15.7       -31.1      -19.1
  warnings: none
```

- **Loudness**: −17.4 LUFS over the loop body (−17.48 at `gainDb` 1.2, so 1.3), the menu target
  (−17.4 ± 0.5).
- **Peak** −5.0 dBFS, below the soft clipper's knee (0.62 = −4.2 dBFS), so the clipper never acts.
  An earlier version touched it with one mandolin stroke, when humanize velocity jitter, the left
  pan and that stroke's attack added up. The mandolin's humanize scale is 0.6 (a steadier player).
- **Lead on top**: the mandolin is −1.4 LU and the violin −0.8 LU against the whole mix. Per
  section (K-weighted, gated), the lead is −1.3 / −1.1 / −1.3 LU below the section mix.
- **Arc** (section loudness):

  | Section | Loudness |
  |---|---|
  | D7 intro / turnaround | −22.7 LUFS |
  | verse | −18.1 LUFS |
  | refrain | −17.1 LUFS |
  | varied refrain | −16.9 LUFS |

  It builds gently, and the turnaround is a breath before the next strophe.
- **Chromium**: `audiotest.html` `__at.samplerTrack('menu')` (MP3s decoded by Chromium, real
  render worker) renders in 1.10 s with no errors. Its output is the same as the Node render, with
  the same length and the same loop window (192000 → 3720000 samples). The difference is
  −111.5 dBFS RMS, at most one 16-bit step.
- `npx tsc --noEmit` clean; `node scripts/music/selftest/formcheck.mjs`: `ok menu`.

**Recorded-bank issue, not handled in the song.** Some mandolin zones attack late after their
marked onset. On single plucks pinned to their own zone:

| Note | Late by |
|---|---|
| C5 | +32 ms |
| C♯4 | +27 ms |
| D5 | +18 ms |
| B4 | +8 ms |
| G4, A4, F♯5, G5 | about +1 ms |
| E5 | +4 ms |

The choke ends the previous stroke on time, so tremolo on C5, D5, E♭5 and D4 has short holes,
about 30 ms long, every 150 ms. The sampler owns the bank and is re-detecting these onsets; the
song does not work around them. After the bank fix, re-measure the mandolin's onsets and
tremolo, and the lifts above, whose last 50 ms then lose the extra late-onset gap.
