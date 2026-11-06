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
| The gag | Verdi's anvils are the kitchen's pots and pans. The anvil and the frying pan (`panClang`) hammer where the smiths hammer; the woodblock and the slapstick answer in the rests, and the band stops at the tutti's cadences to leave them the beat |

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

- "Vedi" (V bars 1–8): no anvils;
- the hammer call (V bars 9–10; bar 10 = the song book's rest bar 11): in bar 9, after the half
  cadence, the timpani's D and two anvil strokes on beats 3 and 4 ("All'opra! all'opra!"); in bar 10
  ("Dàgli, martella!") flammed anvil strokes on every beat (Kątski's grace-note hammering) and the
  pan on the off-beats, both getting louder, over a timpani roll on G, with a G7 brass stab on beat 4;
- the theme and the close (T1, C1): the anvil on beats 1 and 3;
- the tutti (T2, C2): the anvil on 1 and 3 and the frying pan on 2 and 4, two smiths alternating;
- the break: the theme's own rhythm (bars 12–15) hammered on the pots and pans, high notes on the
  anvil, low notes on the pan.

The smiths of the intro and of the hammer call play on their own channels (`anvS`, `pansS`): the
same anvil and pan samples, 2 dB nearer than the band's `anv` and `pans`.

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

**Nothing accompanies above the tune.** A scan of every overlap between a melody note and a note
of the accompaniment (`gtr`, `pizz`, `accC`, `brs`, the turnaround horns) finds no accompaniment note
above the sounding tune note anywhere, and no chord that doubles the tune's top note together with a
note a second below it. The voicings that make this so:

- under "Vedi" the guitar and pizzicato "pah" stop at D4, the tune's lowest note in those bars, and at
  B3 in bars 1 and 5, where the pickup G D B falls to B3 (D3 G3 B3 there, the guitar's open-string
  shape);
- in bar 3 of the close (C1 and C2), where the tune drops to E4 over E7, the pizzicato (C1) and the
  brass (C2) stab on beat 2 is the rootless G♯3 B3 D4 under the E4 (the root is in the tuba and the
  tune); beat 4, the melody's passing A, is left alone;
- in T1 bars 3 and 7 (G7 over the tonic pedal, the tune on G4) the accordion chords are B3 D4 F4,
  under the G4 instead of doubling it with the F a tone below;
- the T2 horns play the theme an octave below the trumpet, and in bars 2 and 6 they sound the
  resolution D at once, so the trumpet's appoggiatura E (over Dm, as in Kątski) does not rub against
  the brass stab's F a semitone away;
- the xylophone in C2 doubles only the three rising pickups of the close, an octave up (on purpose).

The only contacts left are unisons of a chord's top note with a low melody note, with no second
below it: the pickup's B3 and the D4s of V bars 2 and 6 (guitar/pizzicato) and B4 in C1 bar 2
(pizzicato, B° under the tune's B). The semitone scan (simultaneous pitched notes overlapping by a
dotted sixteenth or more) finds none.

## Form

| Bars | Section | Time (s) | Reference | Content |
|---|---|---|---|---|
| 1–4 | `intro` | 0.00–7.50 | — | The smiths alone (`anvS`, `pansS`): anvil on 1 and 3, the pan joins on 2 and 4, woodblock off-beats, an 8th-note anvil/pan build and a slapstick whack |
| 5–14 | `V` (loop start) | 7.50–26.25 | bars 2–11 (G) | "Vedi! le fosche": phrase 1 clarinet, phrase 2 accordion; upright-bass oom (rising line F♯ G A B), guitar and pizzicato "pah" on 2 and 4, a soft bass drum on 1, tambourine (accents on 2 and 4 in phrase 2). Bars 13–14 = the hammer call: bar 13 (the half cadence) timpani D and two anvil strokes, bar 14 ("Dàgli, martella!") flammed anvil and pans getting louder, bass G, timpani roll on G, bass drum, G7 brass stab on beat 4 |
| 15–22 | `T1` | 26.25–41.25 | bars 12–19 (C) | The anvil theme: accordion lead + clarinet; tuba C–G over Kątski's tonic pedal, accordion chords on 2 and 4; anvil on 1 and 3; slapstick in the rest at each cadence |
| 23–29 | `C1` | 41.25–54.38 | bars 20–26 | The close: mandolin (tremolo on the long notes) + clarinet, tuba walking down the circle of fifths, pizzicato chords, the woodblock answering in the rests |
| 30–33 | `brk` | 54.38–61.88 | rhythm of bars 12–15 | Break: the tune stops; the theme's rhythm on the pots and pans (anvil high, pan low) over the tuba's oom and the guitar's pah (bars 30–32), a second soft anvil keeping 8ths, woodblock, tambourine, bass drum, castanets, the timpani as the big kettles, a cymbal roll into the tutti |
| 34–41 | `T2` | 61.88–76.88 | bars 12–19 | Tutti: trumpet lead, accordion, horns an octave below; Kątski's chromatic bass C C♯ D F♯ G; brass stabs; anvil 1+3 and pan 2+4; crash, bass drum, timpani. At the cadences (bars 37 and 41) the band stops on beat 4 and the slapstick has the beat to itself |
| 42–49 | `C2` | 76.88–91.88 | bars 20–26 + 1 | Tutti close with mandolin tremolo and xylophone pickups, I6/4–V7 timpani roll and crash on the final C; bar 49 = turnaround C – G/B – Am (horns, brass, accordion chords), the tuba walking C B A D back to "Vedi" in G, beat 4 left to the tuba's D and the slapstick |

Loop: `loopFrom: 1`, bars 5–49 (84.375 s). Each pass runs verse → theme → close → break → tutti.
The renderer's buffer loops 11.5 → 95.875 s (its 4 s pad repeats the start of `V`); render-song's
seam check reads −150.5 dB, so nothing rings or clicks across the seam.

**Harmony** (concert pitch): "Vedi" G | D G | D7 G | Am D7/F♯ G | D G | … | D D7 | G7 (hammer bar);
T1 C | C | G7/C | C (×2); C1/C2 Am Dm | G C F B° | E7 | Am | C | C/G G7 | C; T2 C C♯°7 | Dm D7/F♯ |
G7 | C (×2); turnaround C G/B Am D7. Accompaniment chords left out on purpose: beat 4 of the
close's bar 3 (the melody's passing A over E7, which the song book harmonises with a passing F♯
below, not with G♯); beat 2 of T2 bars 2 and 6, where the stab waits for the "and" (the
resolution D); beat 4 of T2 bars 4 and 8 and of the turnaround (the slapstick's beat; the D7 of the
turnaround is the tuba's D alone). A scan of all simultaneous pitched notes finds no semitone rubs.

## Instrumentation

| Role | Channels (instrument) | Range used |
|---|---|---|
| Tune | `clar` (clarinet) V, T1, C1 · `acc` (accordion) V phrase 2, T1 lead, T2/C2 under the trumpet · `mand` (mandolin) C1 lead, C2 · `tpt` (trumpet) T2, C2 | clarinet B3–G5, accordion B3–G5, mandolin E4–G5, trumpet E4–G5 |
| Brass | `hn` (horn) melody an octave below in T2/C2, turnaround chords · `brs` (brass, marcato) stabs on 2 and 4, the hammer bar's G7, turnaround chords | horn E3–G4, brass G3–F♯4 |
| Colour | `xylo` (xylophone) pickups in C2 | G♯5–F6 |
| Bass | `tuba` T1–C2 and the break · `ubass` (uprightBass) V | tuba F1–G2, upright bass G1–B2 |
| Chords | `gtr` (guitar) "pah" in V and the break · `pizz` "pah" in V, chords in C1 · `accC` (accChord) T1 and the turnaround | guitar D3–C4, pizz D3–C5, accordion B3–A4 |
| Pots and pans | `anv`, `anv2` (anvil) · `pans` (panClang) · `anvS`, `pansS` (the same, intro and hammer call) · `wood` (woodblock) · `slap` (slapstick) · `cast` (castanets) | — |
| Band percussion | `tamb` (tambourine: accents, hits, shakes, a roll) · `bd` (bassDrum, hit variant) · `timp` (timpani C2 D2 E2 G2 A2) · `crash` · `cym` (suspended cymbal roll) | timpani within the recorded B1–C3 |

The strings carry no tune: the recorded `violin` and `strings` samples take about 350 ms to reach half
their level (measured), too slow for this melody's dotted eighths, so the brief's alternative
(accordion + clarinet for the tune) is used, with brass for the big statements. Winds breathe at
every phrase end (rests at the theme's cadences and in the close). The mandolin plays tremolo on
the notes of a dotted quarter or longer and single picks otherwise.

## Measurements (sample render)

`node scripts/music/render-song.mjs kitchen out.wav` with the recorded sample bank (53 sets):

| | |
|---|---|
| Duration | 95.88 s rendered buffer (91.875 s of music + the renderer's 4 s loop pad), 1647 events, rendered in about 1.2 s |
| Loop | plays 0 → 95.875 s, then repeats 11.5 → 95.875 s (body 84.375 s = bars 5–49 from `V`); seam mismatch −150.5 dBFS |
| Loudness | loop body **−16.4 LUFS** (target −16.4 ± 0.5), whole file −16.7 LUFS, short-term max −13.3 LUFS |
| Loudness range | loop body **5.2 LU** (ffmpeg `ebur128`; the stage peers: trattoria 4.9, streets 3.4, foodcourt 2.5) |
| Peak / clipping | sample peak **−3.24 dBFS**; soft clipper 7 samples (0.000 %); RMS −19.8 dBFS; DC 0 |
| Spectral balance | < 250 Hz −9.7 dB, 250 Hz–4 kHz −0.6 dB, > 4 kHz −16.0 dB |
| Warnings | none (`gainDb` −0.6) |

Per-section loudness and balance (each channel's solo loudness against the section's mix, LU; solo
renders through the same renderer; integrated loudness per section, checked with ffmpeg `ebur128`;
the lead is in bold):

| Section | Mix LUFS | Peak dBFS | Lead | Others |
|---|---|---|---|---|
| intro | −22.7 | −3.5 | anvil −0.7 | pan −2.1, slapstick −7.7, woodblock −11.2 |
| V | −17.9 | −3.2 | **accordion −0.3** (phrase 2), **clarinet −1.3** | hammer-bar timpani −4.6 and brass stab −5.3, upright bass −7.2, hammer-call anvil −7.8, guitar −9.8, pans −10.1, pizz −16.2, tambourine −21.7, bass drum −22.4 |
| T1 | −16.7 | −5.6 | **accordion −1.8** | clarinet −6.6, tuba −9.2, accordion chords −11.9, anvil −15.7, timpani −15.8, slapstick −19.3, tambourine −23.6 |
| C1 | −17.7 | −6.2 | **mandolin −2.2** | clarinet −6.2, tuba −7.1, timpani −10.1, pizz −14.7, slapstick −16.7, anvil −19.5, woodblock −20.4 |
| brk | −22.0 | −3.8 | pan −3.9, anvil −4.7 | tuba −2.8, guitar −5.9, slapstick −11.6, timpani −12.6, bass drum −13.1, tambourine −15.3, cymbal −15.3, second anvil −16.3, woodblock −16.8, castanets −19.7 |
| T2 | −14.6 | −4.7 | **trumpet −1.9** | accordion −8.5, tuba −11.6, brass −12.0, horns −12.5, anvil −14.4, pan −14.9, timpani −17.6, slapstick −20.1 |
| C2 | −14.7 | −4.1 | **trumpet −1.8** | accordion −8.8, turnaround accordion chords −9.4, tuba −9.9, mandolin −10.3, brass −11.2, horns −11.9, timpani −12.3, anvil −14.9, pan −15.3, xylophone −19.2, slapstick −19.6 |

The loop's dynamics follow the peers: the verse sits 3.3 LU under the tutti (trattoria 3.5,
streets 3.2), the theme and the close between them, the break and the intro lower (the break is
the pots' feature: its hits peak at −3.8 dBFS, as high as the tutti's).

### Review fixes: levels across the loop

An independent review found the verse 7.5 LU under the tutti, so the loop collapsed at every seam;
the intro barely audible; the T2 slapstick masked; and the accompaniment at or above the tune where
the close drops to E4 (fixed above, with the V pickups and the T1 G7 chords). Before → after, same
renderer and sample bank:

| | Before | After |
|---|---|---|
| Sections (LUFS): intro / V / T1 / C1 / brk / T2 / C2 | −28.3 / −21.5 / −17.3 / −18.3 / −25.4 / −14.0 / −14.2 | −22.7 / −17.9 / −16.7 / −17.7 / −22.0 / −14.6 / −14.7 |
| Loudness range of the loop body | 9.0 LU | 5.2 LU |
| Hammer bar (V bar 10), momentary median / max | −25.3 / −21.0 LUFS (quieter than the bar before) | −18.8 / −15.4 LUFS (a build into T1, −16.5) |
| Short-term (3 s) after the seam, C2 → "Vedi" | −12.6 → −22.0, then −20.1 … −22.4 through the verse and −24.9 at the hammer bar | −13.3 → −18.8, then −16.9 … −19.0 through the verse and −19.6 at the half cadence |
| Slapstick at the cadences: largest third-octave rise (mix with against mix without it, 43 ms from the onset), T1 ×2 / C1 / T2 ×2 / C2 | +9.3, +16.3 / +13.3 / **+1.5, +1.2** / +20.1 dB | +7.7, +15.2 / +12.4 / **+15.7, +19.3** / +23.3 dB |

What changed: the verse's tune up about 3 dB (clarinet and accordion velocity 0.72 → 0.92 / 0.9),
its groove filled out (upright bass up 3.3 dB, guitar +3 dB channel gain, a pizzicato "pah" doubling
the guitar, a soft bass drum on 1, the tambourine 2 dB up everywhere and about 7 dB in the verse);
the hammer call built as a crescendo (bars 9–10, above); the tutti's band 1 dB down (`dyn(0.93, …)`, the trumpet 0.3 dB); the break given the tuba's
oom and the guitar's pah under the pots; the intro's smiths 5–6 dB up (own channels 2 dB nearer,
fuller strokes, the pan in bar 2 at full stroke); the turnaround filled with brass and accordion
chords; `gainDb` −0.5 → −0.6. The T2 slapstick now gets beat 4 of bars 37 and 41 to itself (the pan,
the stab and the tambourine stop there), and the turnaround's beat 4 likewise.

**Browser check.** `window.__at.samplerTrack('kitchen')` on `audiotest.html` in headless Chromium
(Playwright, private dev server) decodes the MP3 sprites with the browser's decoder (0.93 s), installs
all 53 sets without warnings and renders the track in the music worker in 1.22 s, with no page errors.
That render matches the Node render: loop body −16.4 LUFS, loudness range 5.2 LU and peak −3.24 dBFS
in both, difference signal −91 dB below the music, zero lag.
