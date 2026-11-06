# `kitchen`: the Anvil Chorus (stage 1, *La Cucina*)

Gameplay music for the first stage, a busy restaurant kitchen in daylight. File:
[`src/audio/songs/kitchen.ts`](../../src/audio/songs/kitchen.ts).

| | |
|---|---|
| Piece | "Coro di zingari", the **Anvil Chorus**: "Vedi! le fosche notturne spoglie … Chi del gitano i giorni abbella?" from *Il Trovatore*, Act II, scene 1 |
| Composer | Giuseppe Verdi (1813–1901) |
| Year | 1853 (premiere, Rome, Teatro Apollo) |
| Status | Public domain (the composer died in 1901) |
| Key, meter, tempo | C major, the opera's key (the "Vedi" tune in the dominant, G major); 4/4; ♩ = 128 (Allegro; the song book marks ♩ = 110, the brief asks for 120–132) |
| Length | 49 bars = 91.9 s of music: intro 7.5 s, then a 45-bar loop body of 84.4 s |
| The gag | Verdi's anvils are the kitchen's pots and pans. The anvil and the frying pan (`panClang`) hammer where the smiths hammer; the woodblock and the slapstick answer in the rests |

## References

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/col_101best.abc --tune 9 --text      # the reference, bar by bar
```

- **Melody: `col_101best.abc` X:9** (grade A in [REFERENCES.md](REFERENCES.md)), "Anvil Chorus (from
  Il Trovatore)" in *The One Hundred and One Best Songs* (The Cable Company, Chicago, 1919), under
  English hymn words. It is a tone below Verdi, in B♭, written with K:F and accidentals. Bars 2–10 hold
  the opening tune ("Vedi! le fosche", in F, the dominant), bar 11 is a rest bar, bars 12–19 the anvil
  theme ("Chi del gitano i giorni abbella?" twice), bars 20–26 the close.
- **Cross-check: `jc_anvil_201241357.abc`**, Kerr's *Merry Melodies* #329 (in D): theme bars 1–8,
  close 9–15. It agrees note for note with the song book except its instrumental last two bars
  (see the results below). The other `jc_anvil_*` files are other *Trovatore* numbers and were not used.
- **Harmony and keys: Antoni Kątski, *Grande fantaisie sur l'opéra de Verdi Le Trouvère* op. 157,
  "Allegro maestoso"** (19th century; public domain). Digital score from *Polish Music Heritage in
  Open Access*, © 2019–2022 The Fryderyk Chopin Institute (https://nifc.pl), CC BY 4.0,
  https://github.com/pl-wnifc/humdrum-polish-scores, file
  `pl-wnifc/kern/pl-wnifc--6817-n--001-001_katski-antoni--grande-fantaisie-sur-l-opera-de-verdi-le-trovatore-op-157-allegro-maestoso.krn`.
  Used as a reference only; nothing from it is in the repository. A contour search
  (music21, all transpositions) finds "Vedi" in **G major** at bar 21 and the anvil theme in
  **C major** (bars 37–44, again from bar 52): the keys of the opera, a whole tone above the song
  book. The fantasia gives the harmonisations used here:
  - bars 37–44: the theme over a **tonic pedal**, bass C on beats 1 and 3, chords C | C | G7 | C on 2 and 4;
  - bars 45–47: the close's first two bars down the **circle of fifths** (Am Dm | G C F B° | E);
  - bars 60–63: the theme over a **chromatic bass** C C♯ D … G: C C♯°7 | Dm D7 | G7 | C (the tuba
    here takes the D7 in first inversion, F♯, for a smoother rise to G);
  - bars 25–29: "Vedi" over I, V, V7, ii, V7–I and a half cadence on V;
  - bars 35–36: repeated E octaves with a grace note on every beat just before the theme, the
    piano's hammering and the model for the flammed hammer bar.

  To fetch it again: `git clone --depth 1 --filter=blob:none --no-checkout
  https://github.com/pl-wnifc/humdrum-polish-scores.git` and `git show HEAD:<file above>`.

### Where the anvils fall

Verdi's stage direction has the gypsies take up their tools after "All'opra! all'opra! Dàgli,
martella!" and sing "Chi del gitano" "al misurato tempestar dei martelli cadenti sulle incudini"
(to the measured pounding of the hammers on the anvils). The anvils are therefore silent in "Vedi!
le fosche", come in with the hammer call and strike in strict beats through the theme. No orchestral
score of the *incudini* part is among the local references, so the strokes are placed by that
direction and by the layout of the scene, not measured against a score:

- "Vedi" (V bars 1–9): no anvils;
- the hammer call (V bar 10 = the song book's rest bar 11): flammed anvil strokes on every beat
  (Kątski's grace-note hammering), the pan on the off-beats, a timpani roll on G;
- the theme and the close (T1, C1): the anvil on beats 1 and 3;
- the tutti (T2, C2): the anvil on 1 and 3 and the frying pan on 2 and 4, two smiths alternating;
- the break: the theme's own rhythm (bars 12–15) hammered on the pots and pans, high notes on the
  anvil, low notes on the pan.

## Melody proofs (compare.py, default thresholds)

All commands run against the game track (`--song kitchen`). The song is a tone above the
reference; compare.py finds the transposition (+2 semitones against the song book, −2 against Kerr).

| Passage (first statement) | Command | Result |
|---|---|---|
| "Vedi! le fosche" (V, clarinet then accordion) | `$PY scripts/music/compare.py --abc $REFS/col_101best.abc --tune 9 --ref-bars 2-10 --song kitchen --channel clar,acc --section V` | **PASS** 100.0 % / 100.0 % (42/42) |
| Anvil theme (T1, accordion + clarinet) | `… --ref-bars 12-19 --song kitchen --channel acc,clar --section T1` | **PASS** 100.0 % / 100.0 % (27/27) |
| Anvil theme, lead channel alone | `… --ref-bars 12-19 --song kitchen --channel acc --section T1` | **PASS** 100.0 % / 100.0 % |
| Close (C1, mandolin + clarinet) | `… --ref-bars 20-26 --song kitchen --channel mand,clar --section C1` | **PASS** 100.0 % / 100.0 % (23/23) |
| Close, lead channel alone | `… --ref-bars 20-26 --song kitchen --channel mand --section C1` | **PASS** 100.0 % / 100.0 % |

No `--allow-bars`, no `--resync`, no tolerated liberties. Restatements, the same notes:

| Passage | Command | Result |
|---|---|---|
| Theme, tutti (T2, trumpet) | `… --ref-bars 12-19 --song kitchen --channel tpt --section T2` | PASS 100.0 % / 100.0 % |
| Close, tutti (C2, trumpet; bar 8 is the turnaround) | `… --ref-bars 20-26 --song kitchen --channel tpt --section C2 --bars 1-7` | PASS 100.0 % / 100.0 % |
| Theme against Kerr | `$PY scripts/music/compare.py --abc $REFS/jc_anvil_201241357.abc --ref-bars 1-8 --song kitchen --channel acc --section T1` | PASS 100.0 % / 100.0 % |
| Close against Kerr | `$PY scripts/music/compare.py --abc $REFS/jc_anvil_201241357.abc --ref-bars 9-15 --song kitchen --channel mand --section C1` | FAIL 91.3 % / 100.0 %: only Kerr's instrumental ending differs (bars 14–15: 5–7–1, G B C; the song book and this track sing 5–4–3, G F E), as REFERENCES.md notes |

The second voices are not on top anywhere: the T2 horns play the theme an octave below the trumpet,
and in bars 2 and 6 they sound the resolution D at once, so the trumpet's appoggiatura E (over Dm, as
in Kątski) does not rub against the brass stab's F a semitone away. The xylophone in C2 doubles only
the three rising pickups of the close, an octave up.

## Form

| Bars | Section | Time (s) | Reference | Content |
|---|---|---|---|---|
| 1–4 | `intro` | 0.00–7.50 | — | The smiths alone: anvil on 1 and 3, the pan joins on 2 and 4, woodblock, an 8th-note anvil/pan build and a slapstick whack |
| 5–14 | `V` (loop start) | 7.50–26.25 | bars 2–11 (G) | "Vedi! le fosche": phrase 1 clarinet, phrase 2 accordion; upright-bass oom (rising line F♯ G A B), guitar strums on 2 and 4, light tambourine. Bar 14 = the hammer bar ("Dàgli, martella!"): flammed anvil, pans, timpani roll on G |
| 15–22 | `T1` | 26.25–41.25 | bars 12–19 (C) | The anvil theme: accordion lead + clarinet; tuba C–G over Kątski's tonic pedal, accordion chords on 2 and 4; anvil on 1 and 3; slapstick in the rest at each cadence |
| 23–29 | `C1` | 41.25–54.38 | bars 20–26 | The close: mandolin (tremolo on the long notes) + clarinet, tuba walking down the circle of fifths, pizzicato chords, the woodblock answering in the rests |
| 30–33 | `brk` | 54.38–61.88 | rhythm of bars 12–15 | Break: the theme's rhythm on the pots and pans alone (anvil high, pan low), a second soft anvil keeping 8ths, woodblock, tambourine, bass drum, castanets, the timpani as the big kettles, a cymbal roll into the tutti |
| 34–41 | `T2` | 61.88–76.88 | bars 12–19 | Tutti: trumpet lead, accordion, horns an octave below; Kątski's chromatic bass C C♯ D F♯ G; brass stabs; anvil 1+3 and pan 2+4; crash, bass drum, timpani |
| 42–49 | `C2` | 76.88–91.88 | bars 20–26 + 1 | Tutti close with mandolin tremolo and xylophone pickups, I6/4–V7 timpani roll and crash on the final C; bar 49 = turnaround C – G/B – Am – D7 (horns, tuba C B A D) back to "Vedi" in G |

Loop: `loopFrom: 1`, bars 5–49 (84.375 s). The loop restarts on the quiet verse, so each pass
runs quiet → theme → close → break → tutti. Nothing rings across the seam (render-song's seam check
reads −156.5 dB; the renderer reports no event from the intro ringing into the loop).

**Harmony** (concert pitch): "Vedi" G | D G | D7 G | Am D7/F♯ G | D G | … | D D7 | G7 (hammer bar);
T1 C | C | G7/C | C (×2); C1/C2 Am Dm | G C F B° | E7 | Am | C | C/G G7 | C; T2 C C♯°7 | Dm D7/F♯ |
G7 | C (×2). Two accompaniment chords are left out on purpose: beat 4 of the close's bar 3 (the
melody's passing A over E7, which the song book harmonises with a passing F♯ below, not with
G♯), and beat 2 of T2 bars 2 and 6, where the stab waits for the "and" (the resolution D). A scan
of all simultaneous pitched notes finds no semitone rubs.

## Instrumentation

| Role | Channels (instrument) | Range used |
|---|---|---|
| Tune | `clar` (clarinet) V, T1, C1 · `acc` (accordion) V phrase 2, T1 lead, T2/C2 under the trumpet · `mand` (mandolin) C1 lead, C2 · `tpt` (trumpet) T2, C2 | clarinet B3–G5, accordion B3–G5, mandolin E4–G5, trumpet E4–G5 |
| Brass | `hn` (horn) melody an octave below in T2/C2, turnaround chords · `brs` (brass, marcato) stabs on 2 and 4 | horn E3–G4, brass G3–G4 |
| Colour | `xylo` (xylophone) pickups in C2 | G♯5–F6 |
| Bass | `tuba` T1–C2 · `ubass` (uprightBass) V | tuba F1–G2, upright bass A1–B2 |
| Chords | `gtr` (guitar) strums in V · `accC` (accChord) T1 · `pizz` C1 | guitar D3–E4, accordion B3–G4, pizz C4–C5 |
| Pots and pans | `anv`, `anv2` (anvil) · `pans` (panClang) · `wood` (woodblock) · `slap` (slapstick) · `cast` (castanets) | — |
| Band percussion | `tamb` (tambourine: accents, hits, shakes, a roll) · `bd` (bassDrum, hit variant) · `timp` (timpani C2 E2 G2 A2) · `crash` · `cym` (suspended cymbal roll) | timpani within the recorded B1–C3 |

The strings carry no tune: the recorded `violin` and `strings` samples take about 350 ms to reach half
their level (measured), too slow for this melody's dotted eighths, so the brief's alternative
(accordion + clarinet for the tune) is used, with brass for the big statements. Winds breathe at
every phrase end (rests at the theme's cadences and in the close). The mandolin plays tremolo on
the notes of a dotted quarter or longer and single picks otherwise.

## Measurements (sample render)

`node scripts/music/render-song.mjs kitchen out.wav` with the recorded sample bank (53 sets):

| | |
|---|---|
| Duration | 95.88 s rendered buffer (91.875 s of music + the renderer's 4 s loop pad), 1525 events, rendered in about 1 s |
| Loop | plays 0 → 95.875 s, then repeats 11.5 → 95.875 s (body 84.375 s = bars 5–49 from `V`); seam mismatch −156.5 dBFS |
| Loudness | loop body **−16.4 LUFS** (target −16.4 ± 0.5), whole file −16.7 LUFS, short-term max −12.6 LUFS |
| Peak / clipping | sample peak **−3.40 dBFS**; soft clipper 11 samples (0.000 %); RMS −20.2 dBFS; DC 0 |
| Spectral balance | < 250 Hz −11.1 dB, 250 Hz–4 kHz −0.5 dB, > 4 kHz −15.6 dB |
| Warnings | none (`gainDb` −0.5) |

Per-section balance (each channel's solo loudness against the section's mix, LU; measured on the same
renderer with solo renders; the lead is in bold):

| Section | Mix LUFS | Peak dBFS | Lead | Others |
|---|---|---|---|---|
| intro | −28.3 | −9.2 | anvil −0.2 | pan −3.4, slapstick −6.7, woodblock −13.4 |
| V | −21.5 | −9.0 | **clarinet −1.1**, **accordion +0.3** (phrase 2) | upright bass −6.8, guitar −10.8, hammer-bar anvil −6.9, timpani roll −6.7 |
| T1 | −17.3 | −5.7 | **accordion −1.6** | clarinet −6.8, tuba −9.3, accordion chords −12.4, anvil −15.0, slapstick −18.5 |
| C1 | −18.3 | −6.7 | **mandolin −2.0** | clarinet −6.7, tuba −7.2, pizz −15.2, anvil −18.8, woodblock −19.7 |
| brk | −25.4 | −4.2 | pan −0.5, anvil −1.4 | slapstick −8.1, timpani −9.4, bass drum −9.6, tambourine −11.7, second anvil −12.8, woodblock −13.4, castanets −16.2 |
| T2 | −14.0 | −3.4 | **trumpet −2.1** | accordion −8.0, tuba −11.1, brass −11.4, horns −12.1, anvil −14.0, pan −14.4 |
| C2 | −14.2 | −3.4 | **trumpet −1.8** | accordion −8.2, tuba −9.4, mandolin −10.2, timpani −11.5, anvil −14.5, pan −14.6 |

The break measures low in LUFS because it is sparse, but its hits peak at −4.2 dBFS, as high as the
tutti's.

**Browser check.** `window.__at.samplerTrack('kitchen')` on `audiotest.html` in headless Chromium
(Playwright, private dev server) decodes the MP3 sprites with the browser's decoder (0.64 s), installs
all 53 sets without warnings and renders the track in the music worker in 0.98 s, with no page errors.
That render matches the Node render: loop body −16.44 LUFS and peak −3.40 dBFS in both, difference
signal −91 dB below the music, zero lag.
