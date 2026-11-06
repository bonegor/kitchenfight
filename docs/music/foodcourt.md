# `foodcourt` — "Torna a Surriento" as shopping-mall muzak (stage 4, La Food Court)

Gameplay music for the plastic, neon lair where the culinary crimes are born. De Curtis's
Neapolitan classic is played as soulless shopping-mall **muzak**: a PA chime, then a cheesy
D-major lounge jazz waltz (vibes, FM e-piano, synth pad, bossa synth bass, ride and shaker) on the
song's major strains. When the tune turns to D minor the mall rots: a detuned warble lead, a
minor/chromatic reharmonisation, a creeping staccato bassoon, orchestra hits, a dark pad and
ratchet / toy-whistle glitches. Then the **real orchestra pushes through the synthetic band**
(cellos, then violins and brass on the refrain), until a PA chime snaps everything back to
fake-cheerful muzak. The second round escalates to a full Neapolitan street-band tutti. Looping,
88.9 s of music.

Song file: [`src/audio/songs/foodcourt.ts`](../../src/audio/songs/foodcourt.ts).

## The piece

| | |
|---|---|
| Piece | "Torna a Surriento" (Come Back to Sorrento), Neapolitan song |
| Composer | Ernesto De Curtis (1875–1937), music; words by his brother Giambattista De Curtis (1860–1926), not used |
| Year | 1902 |
| Status | Public domain: the composer died in 1937 (more than 80 years ago) and the song was published in the first years of the 20th century. The ABC transcriptions are reference only and are not committed; the melody was written into the DSL from them and proven with `scripts/music/compare.py`. |

The concept comes from the song's own structure: strain A is in D minor, strains B and C in D
major (C slides back to D minor at its fifth bar), and the refrain starts in D major and ends in
D minor. The muzak owns the major music; the minor music is where it falls apart.

## How the game plays it

`src/game/stages.ts`: stage 4 "La Food Court" has `music: 'foodcourt'`. A run lasts up to 15
minutes (bosses at 5, 10 and 15 min), so the track loops about ten times under heavy SFX. It loops
from bar 5 (section B) to the end; the 4-bar intro (PA chime + vamp) plays once.

## Reference and melody proof

Reference (grade A in [`REFERENCES.md`](REFERENCES.md), "Spares"): `av_surriento.abc` (John
Chambers), 3/4, K:Dm with an inline `K:D`, chord symbols. Bars: **strain A 1–8** (D minor, under a
repeat sign; "Vide 'o mare quant'è bello…"), **strain B 9–16** (D major; "Guarda, gua', chistu
ciardino…"), **strain C 17–24** (D major turning to D minor in bar 20; "E tu dice: 'I' parto,
addio!'…"), **strain D 25–32**, the refrain ("Ma nun me lassà, nun darme stu turmiento! Torna a
Surriento, famme campà!"). REFERENCES.md calls 17–32 "strain C"; this document splits it into C
(17–24) and the refrain D (25–32), as the file's own part labels do.

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/av_surriento.abc --text
$PY scripts/music/abc2notes.py $REFS/av_surriento.abc --bars 1-8 --dsl 0.5     # also 9-16, 17-24, 25-32
# first statements
$PY scripts/music/compare.py --abc $REFS/av_surriento.abc --ref-bars 9-16  --song foodcourt --channel vib      --section B
$PY scripts/music/compare.py --abc $REFS/av_surriento.abc --ref-bars 17-24 --song foodcourt --channel vib,warb --section C
$PY scripts/music/compare.py --abc $REFS/av_surriento.abc --ref-bars 1-8   --song foodcourt --channel warb     --section A
$PY scripts/music/compare.py --abc $REFS/av_surriento.abc --ref-bars 25-32 --song foodcourt --channel vln      --section D
```

All comparisons at the default thresholds (pitch ≥ 95 %, rhythm ≥ 90 %, no broken bar); no
`--allow-bars`, no `--resync`, no tolerated ornaments anywhere. The song is in the reference key
(no transposition) and in the same note values (1 song beat = 1 reference quarter).

| Theme (first statement) | Reference bars | Song side | Pitch | Rhythm | Result |
|---|---|---|---|---|---|
| strain B | 9–16 | `--channel vib --section B` (vibes an octave up) | 100 % (31/31) | 100 % | **PASS** |
| strain C | 17–24 | `--channel vib,warb --section C` (vibes an octave up in bars 1–3, then the warble at pitch) | 100 % (31/31) | 100 % | **PASS** (the octave change is a phrase-level displacement, accepted) |
| strain A | 1–8 | `--channel warb --section A` | 100 % (31/31) | 100 % | **PASS** |
| refrain D | 25–32 | `--channel vln --section D` | 100 % (22/22) | 100 % | **PASS** |

Restatements (all unaltered, octave transpositions only):

| Section | Reference bars | Song side | Pitch / rhythm |
|---|---|---|---|
| A1 (cellos) | 1–8 | `--channel vc --section A1` | 100 % / 100 % PASS |
| B2 (steel guitar, an octave up) | 9–16 | `--channel sgtr --section B2` | 100 % / 100 % PASS |
| C2 (e-piano an octave up, then warble) | 17–24 | `--channel epL,warb --section C2` | 100 % / 100 % PASS |
| A2 (violins an octave up + trumpet) | 1–8 | `--channel vln,tpt --section A2` | 100 % / 100 % PASS |
| D2 (violins + mandolin an octave up + trumpet) | 25–32 | `--channel vln,mand,tpt --section D2` | 100 % / 100 % PASS |

Cross-check of the four first statements against the two independent editions (same `--ref-bars`
and song options as above): `jc_surriento_201345762.abc` (A minor / A major, transposition −7 or
+5 semitones) and `wf_surriento.abc` (lead sheet in A minor with English words, +5 / +17
semitones): **all eight PASS at 100 % / 100 %**.

## Form

♩ = 162 (`bpm` 162, 2 steps per beat, 6 steps per bar) = 54 bars per minute; one bar = 1.111 s.
Bar numbers are the song's global bars (`node scripts/music/export-song.mjs foodcourt --form`).

| Section | Song bars | Time (s) | Strain (ref bars) | Key / harmony | Lead and texture |
|---|---|---|---|---|---|
| intro | 1–4 | 0.00–4.44 | — | D6 vamp, Em7 A9 | PA chime (vibes + celesta, falling A–F♯–D–A in dotted quarters), then the muzak vamp; vibes pickup A–B–C♯ into B. Not looped. |
| **B** | 5–12 | 4.44–13.33 | B (9–16) | D major, lounge colours | MUZAK: vibes an octave up; e-piano comping on 2–3, synth pad, bossa synth bass, jazz-waltz ride (hatC), shaker, feathered bass drum, cross-stick claves |
| **C** | 13–20 | 13.33–22.22 | C (17–24) | D major → B♭maj7 → D minor | muzak for 3 bars; on the B♭ chord a ratchet "crank", the melody drops an octave into the detuned warble, the dark pad creeps in, the ride turns into a ticking clock, robot arps; toy whistle "fall" into A |
| **A** | 21–28 | 22.22–31.11 | A (1–8) | D minor, lament bass, German sixth | SINISTER: warble lead, creeping staccato bassoon in quarters, dark pad, orchestra hits on bars 1/3/5/7, timpani, low strings swelling, toy-whistle pip, ratchet into A1 |
| **A1** | 29–36 | 31.11–40.00 | A (1–8) | as A | THE ORCHESTRA PUSHES IN: the cellos sing strain A high; bassoon "oom" + pizzicato "pa-pa"; robot-arp bursts answer on the held notes; strings swell, timpani + snare roll into D |
| **D** | 37–44 | 40.00–48.89 | refrain (25–32) | D … Gm Dm/A A7 Dm | the violins carry the refrain over the muzak band (bars 1–4); at "Torna a Surriento" the orchestra takes over: trumpet doubles, tuba oom-pa-pa, string stabs, tamburello, horn pedal, trombone B♭–A–G–F, orchestra hits, cymbal, timpani; ratchet at the end |
| chime | 45–46 | 48.89–51.11 | — | D6, A9 | the falling PA chime snaps back to the muzak |
| **B2** | 47–54 | 51.11–60.00 | B (9–16) | D major, vi–ii–V in the 2nd phrase | MUZAK RELAPSE (fake cheer): steel guitar an octave up, celesta sparkle on the long notes, vibes comping, bossa claves, open-hat lifts, a toy train whistle "toot-toot" |
| **C2** | 55–62 | 60.00–68.89 | C (17–24) | as C | e-piano lead an octave up; on the B♭ an orchestra hit and the warble + staccato bassoon (an octave below) take over; robot arps; timpani + snare roll announce the orchestra |
| **A2** | 63–70 | 68.89–77.78 | A (1–8) | the reference harmony | THE ORCHESTRA WINS: Neapolitan street-band waltz — violins an octave up + trumpet, horn counter-line, tuba oom, string stabs pa-pa, tamburello, timpani, cymbal; the robots glitch in bars 3–4 and 7 |
| **D2** | 71–78 | 77.78–86.67 | refrain (25–32) | as D | TUTTI: violins and mandolin tremolo an octave up, trumpet, horns, trombone, tuba, stabs, tamburello, the muzak drummer's ride and the synth bass join; orchestra hits, cymbals; ratchet + toy-whistle "fall" yank the tape |
| chime2 | 79–80 | 86.67–88.89 | — | D6, A9 | the rising PA chime (A–D–F♯–A) closes the loop |

The loop runs from B (bar 5, 4.444 s) to the end (88.889 s): loop body 76 bars = 84.44 s, total
music 88.9 s (target 85–100 s). The seam is chime2 → B: the chime's A9 and the synth bass pickup
A–A–C♯ lead into B's D6, exactly like the intro's vamp.

## Harmony

The reference chord symbols are the basis; the muzak dresses them in lounge extensions, the
corrupted sections reharmonise them, the orchestra plays them straight.

- **B** (ref D | Em | A7 | D | D | Em | A7 | D): D6 | Em7 | A9 | D6 | D6 | Em7 | A9 | Dmaj7 A9.
  D6 rather than Dmaj7 wherever the tune sits on D (no C♯ under a melody D); B2 replaces the 5th
  bar with Bm7 (vi–ii–V–I).
- **C** (ref D | Em | A7 | B♭ | Gm | Dm | A7 | Dm): D6 | Em7 | A9 | B♭maj7 | Gm6 | DmM7 | A7♭9 |
  Dm A7♭9. The B♭ is where the tape warps; Gm6 carries the tune's E natural, DmM7 is the spy-film
  minor-major seventh. The synth bass plays root and third under A7♭9 (the tune's F is the ♭13).
- **A, A1** (ref Dm | Dm | Gm | Dm | B♭ | Dm | A7 | Dm): Dm | DmM7/C♯ | Gm6/B♭ | Dm/A | B♭7 | Dm/A |
  A7♭9 | Dm A7 — a lament bass D–C♯–B♭–A, and B♭7 used as a **German sixth** (B♭–D–F–G♯) resolving
  to the cadential Dm/A and A7.
- **A2** plays the reference harmony: Dm | Dm | Gm | Dm | B♭ Gm | Dm/A | A7 | Dm A7 (B♭ → Gm in the
  fifth bar as in `wf_surriento.abc`).
- **Refrain** (ref D | Em | A7 | D | Gm | Dm | A7 | Dm): D | Em7 | A7 | D | Gm | Dm/A | A7 | Dm; the
  tuba and the trombone's B♭–A–G–F make the cadence G–A–A–D in the bass with the 7th and 3rd (G, C♯)
  resolving to F and D.

Voicings were checked with a scratch script over the exported events (every lead note against
every other pitched note sounding with it): the comping, pads and stabs stay below the tune (only
the A1 string swell's G4, the seventh of A7♭9, sits over the cellos' F–E for two beats), and the
only semitone / minor-ninth contacts left are the tune's own passing tones, the refrain's long C♯
appoggiatura over D (a major seventh above the root), its D anticipation over A7, and the ♭9 of
A7♭9 a major seventh below the tune's A. The robot arps' short bursts cross the tune's register on
purpose (the synthetic band heckling the orchestra), 25 LU below the lead.

## Instrumentation and ranges

All ids are from the brief's instrument contract and render with recorded samples (or are the
contract's synthetic ids). Sounding ranges as written:

- **muzak band**: `vib` vibes lead (D5–E6), `vibC` vibes comping (E3–E4), `chm` vibes PA chime
  (A4–A5), `cel` celesta (A5–B6), `sgtr` steelGuitar lead (D5–D6), `ep` epiano comping (E3–D4,
  rootless 3-note voicings), `epL` epiano lead (A5–E6), `spad` synthPad (B3–A4), `sb` synthBass
  (A1–B2), `robo` roboArp (D4–F6, short bursts), `hat` hatC (ride / clock), `hatO` hatO (lifts),
  `shk` shaker, `clv` claves, `kick` (orchestral bass drum, feathered on 1).
- **corruption**: `warb` warble lead (D4–F5), `dpad` darkPad (E3–E4), `bsn` bassoon (D2–F4,
  staccato), `hit` orchHit (G3–D4), `ratch` ratchet (crank / slow / fast), `whis` toyWhistle
  (pip / fall / double).
- **orchestra / street band**: `vln` violin (G4–F6), `vc` cello (D4–F5), `tpt` trumpet (D4–F5),
  `mand` mandolin (G5–F6, tremolo on quarters and longer), `hrn` horn (A3–A4), `tbn` trombone
  (F3–B♭3), `tuba` (G1–E2), `pizz` pizzicato strings (F3–E4), `stab` strStab (E3–D4), `str`
  strings (D3–G4), `timp` timpani (A1–G2), `cym` suspended cymbal, `snare` (rolls), `tamb`
  tambourine (accent / hit / shake / roll).

Every part is inside the brief's natural ranges. The bassoon's staccato quarters leave it room to
breathe; the cellos and the violins' long notes are phrase-length.

Key and tempo: D minor / D major, the reference key (vibes, warble, cellos and violins all sit
well there). ♩ = 162 (54 bars/min, inside the 50–60 asked for), `swing` 0.08 (a light jazz-waltz
lilt on the off-beat eighths).

## Render (recorded samples)

`node scripts/music/render-song.mjs foodcourt out.wav` (48 kHz, sample bank: 53 sets):

- duration 92.89 s buffer = 88.89 s of music + the renderer's 4 s loop pad; loop 4.444 → 88.889 s
  (buffer window 8.444 → 92.889 s), body 84.444 s = bars 5–80 from section B;
  **seam mismatch −124.7 dBFS**, no event rings past the seam
- **loop body −16.4 LUFS** (whole file −16.6), short-term max −14.2 LUFS, RMS −19.6 dBFS,
  **sample peak −3.59 dBFS**, soft clipper 2 samples (0.000 %), DC 0
- spectral balance: < 250 Hz −10.2 dB, 250 Hz–4 kHz −0.5 dB, > 4 kHz −19.7 dB (darker than the
  street-band tracks, as muzak should be; the previous foodcourt track measured −23.2 dB with the
  same bank)
- `gainDb` −1.1, **no warnings**

| Channel | Instrument | Notes | Gain dB | Solo LUFS | vs mix (LU) | Peak dBFS |
|---|---|--:|--:|--:|--:|--:|
| vib | vibes | 48 | −1.5 | −17.3 | **−0.9** | −8.8 |
| vibC | vibes | 36 | −3 | −26.1 | −9.7 | −11.6 |
| chm | vibes | 12 | −3 | −22.2 | −5.8 | −13.3 |
| cel | celesta | 16 | −10 | −35.8 | −19.4 | −20.3 |
| sgtr | steelGuitar | 31 | −3 | −18.3 | **−1.9** | −6.5 |
| ep | epiano | 108 | −9 | −32.4 | −15.9 | −17.5 |
| epL | epiano | 14 | −4 | −18.3 | **−1.8** | −10.9 |
| spad | synthPad | 66 | −17 | −38.5 | −22.1 | −26.7 |
| sb | synthBass | 95 | −5 | −24.8 | −8.3 | −14.6 |
| robo | roboArp | 168 | −15 | −42.9 | −26.5 | −32.5 |
| hat | hatC | 234 | −5 | −38.9 | −22.5 | −19.1 |
| hatO | hatO | 8 | −10 | −39.8 | −23.4 | −27.1 |
| shk | shaker | 144 | −8 | −40.2 | −23.8 | −18.9 |
| clv | claves | 16 | −10 | −42.9 | −26.4 | −24.6 |
| kick | kick | 74 | −10 | −31.3 | −14.8 | −15.0 |
| warb | warble | 65 | −3 | −18.1 | **−1.6** | −7.7 |
| dpad | darkPad | 69 | −15 | −35.0 | −18.5 | −22.8 |
| bsn | bassoon | 50 | −5 | −28.2 | −11.8 | −13.5 |
| hit | orchHit | 12 | −11 | −31.3 | −14.8 | −16.5 |
| ratch | ratchet | 5 | −15 | −38.3 | −21.9 | −18.0 |
| whis | toyWhistle | 5 | −13 | −39.1 | −22.6 | −24.5 |
| vln | violin | 75 | −1 | −17.4 | **−0.9** | −6.7 |
| vc | cello | 31 | −3 | −17.2 | **−0.7** | −7.2 |
| tpt | trumpet | 63 | −5 | −24.1 | −7.7 | −13.5 |
| mand | mandolin | 22 | −6 | −28.2 | −11.8 | −16.7 |
| hrn | horn | 31 | −9 | −30.2 | −13.7 | −18.9 |
| tbn | trombone | 8 | −9 | −28.6 | −12.2 | −15.2 |
| tuba | tuba | 26 | −5 | −26.5 | −10.1 | −11.8 |
| pizz | pizz | 48 | −9 | −31.4 | −15.0 | −17.6 |
| stab | strStab | 120 | −10.5 | −31.1 | −14.7 | −16.0 |
| str | strings | 26 | −16 | −35.1 | −18.6 | −20.9 |
| timp | timpani | 32 | −9 | −32.7 | −16.3 | −16.3 |
| cym | cymbal | 4 | −16 | −36.8 | −20.4 | −23.7 |
| snare | snare | 24 | −17 | −40.1 | −23.6 | −25.6 |
| tamb | tamb | 80 | −2 | −35.3 | −18.8 | −15.0 |

Every lead channel (bold) is within 2 LU of the loop mix. Per section (integrated loudness of the
section mix, and each lead's solo loudness relative to it; a scratch script renders each channel
solo through the same renderer and sample bank):

| Section | Mix LUFS | Mix peak dBFS | Lead (solo vs section mix) |
|---|--:|--:|---|
| intro | −21.3 | −9.5 | chime −0.5 |
| B | −16.4 | −6.0 | vibes −1.1 |
| C | −16.6 | −5.6 | vibes −0.1 (bars 1–3), warble −2.1 (bars 4–8) |
| A | −16.7 | −6.4 | warble −0.7 |
| A1 | −16.6 | −6.6 | cello −0.5 |
| D | −15.7 | −4.7 | violin −1.6 |
| chime | −20.8 | −12.0 | chime −0.6 |
| B2 | −16.7 | −3.6 | steel guitar −1.5 |
| C2 | −16.7 | −5.7 | e-piano −1.3 (bars 1–3), warble −2.0 (bars 4–8) |
| A2 | −16.0 | −5.2 | violin −1.9 |
| D2 | −15.0 | −4.7 | violin −1.6 |
| chime2 | −20.7 | −11.5 | chime −0.7 |

The groove sections sit within 1.7 LU of each other (muzak and sinister −16.4…−16.7, orchestra
−16.0/−15.7, the tutti −15.0), so the loop does not pump under gameplay; the two chimes are the
2-bar breathers.

A chroma check (scratch script: per-bar FFT chroma of the render against the pitch classes of the
written notes) gives a median correlation of 0.85; every bar's strongest pitch classes are its
chord and melody tones — no tuning or octave accident in the sample render.

**Chromium, real engine**: `audiotest.html` → `__at.samplerTrack('foodcourt')` (browser MP3
decoding, fresh music worker, a private dev server with `scripts/vite.agent.config.ts`): 53 sets,
no warnings, no page errors; decode 0.84 s, worker render 1.65 s, longest main-thread frame gap
56 ms; the result equals the Node render (same length 4 458 667 samples and loop points, same
−3.59 dBFS peak, difference 92.6 dB below the signal, zero lag).
