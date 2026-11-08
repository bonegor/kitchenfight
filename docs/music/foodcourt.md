# `foodcourt` — "Torna a Surriento" as shopping-mall muzak (stage 4, La Food Court)

Gameplay music for the plastic, neon lair where the culinary crimes are born. De Curtis's
Neapolitan classic is played as soulless shopping-mall **muzak**: a PA chime, then a cheesy
D-major lounge jazz waltz (vibes, FM e-piano, bossa synth bass, ride and shaker) on the song's
major strains. When the tune turns to D minor the mall rots: a detuned warble lead, a
minor/chromatic reharmonisation, a creeping staccato bassoon, orchestra hits, a dark pad and
ratchet / toy-whistle glitches. Then the **real orchestra pushes through the synthetic band**
(cellos, then violins and brass on the refrain) while robot arps heckle it, until a PA chime
snaps everything back to fake-cheerful muzak. The second round escalates to a full Neapolitan
street-band tutti. Looping, 88.9 s of music.

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
addio!'…", two phrases: 17–20 and 21–24), **strain D 25–32**, the refrain ("Ma nun me lassà, nun
darme stu turmiento! Torna a Surriento, famme campà!"). REFERENCES.md calls 17–32 "strain C"; this
document splits it into C (17–24) and the refrain D (25–32), as the file's own part labels do.

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
| strain C | 17–24 | `--channel vib,warb --section C`: phrase 1 (ref 17–20) an octave up — vibes in bars 1–3, its last note (the D of ref bar 20) on the warble, same octave; phrase 2 (ref 21–24) on the warble at pitch | 100 % (31/31) | 100 % | **PASS** — compare.py: "Octave displacements: 15 note(s) in ref bars 21, 22, 23, 24", i.e. the whole second phrase, changed at the phrase boundary |
| strain A | 1–8 | `--channel warb --section A` | 100 % (31/31) | 100 % | **PASS** |
| refrain D | 25–32 | `--channel vln --section D` | 100 % (22/22) | 100 % | **PASS** |

Restatements (all unaltered, octave transpositions only):

| Section | Reference bars | Song side | Pitch / rhythm |
|---|---|---|---|
| A1 (cellos) | 1–8 | `--channel vc --section A1` | 100 % / 100 % PASS |
| B2 (steel guitar, at pitch) | 9–16 | `--channel sgtr --section B2` | 100 % / 100 % PASS |
| C2 (e-piano an octave up, the phrase's last D on the warble an octave up, then the warble at pitch) | 17–24 | `--channel epL,warb --section C2` | 100 % / 100 % PASS (octave change at ref bar 21, as in C) |
| A2 (violins an octave up + trumpet) | 1–8 | `--channel vln,tpt --section A2` | 100 % / 100 % PASS |
| D2 (violins + mandolin an octave up + trumpet) | 25–32 | `--channel vln,mand,tpt --section D2` | 100 % / 100 % PASS |

Cross-check against the two independent editions (same `--ref-bars` and song options as above):
`jc_surriento_201345762.abc` (A minor / A major, transposition −7 or +5 semitones) and
`wf_surriento.abc` (lead sheet in A minor with English words, +5 / +17 semitones): the four first
statements plus B2 and C2, **all twelve PASS at 100 % / 100 %**.

## Form

♩ = 162 (`bpm` 162, 2 steps per beat, 6 steps per bar) = 54 bars per minute; one bar = 1.111 s.
Bar numbers are the song's global bars (`node scripts/music/export-song.mjs foodcourt --form`).

| Section | Song bars | Time (s) | Strain (ref bars) | Key / harmony | Lead and texture |
|---|---|---|---|---|---|
| intro | 1–4 | 0.00–4.44 | — | D6 vamp, Em7 A9 | PA chime (vibes + celesta, falling A–F♯–D–A in dotted quarters), then the muzak vamp; vibes pickup A–B–C♯ into B. Not looped. |
| **B** | 5–12 | 4.44–13.33 | B (9–16) | D major, lounge colours; last bar Dmaj7 → A9 on 2& | MUZAK: vibes an octave up; e-piano comping on 2–3 with a 2& push, bossa synth bass, jazz-waltz ride (hatC), shaker, feathered bass drum, cross-stick claves |
| **C** | 13–20 | 13.33–22.22 | C (17–24) | D major → B♭maj7 → D minor | muzak for 3 bars (vibes an octave up); on the B♭maj7 (bar 4) a ratchet "crank" and the phrase's last note, the held D, warps into the detuned warble in the same octave; the second phrase drops an octave into D minor, the dark pad creeps in and the ride turns into a ticking clock; toy whistle "fall" into A |
| **A** | 21–28 | 22.22–31.11 | A (1–8) | D minor, lament bass, German sixth | SINISTER: warble lead, creeping staccato bassoon in quarters, dark pad, orchestra hits on bars 1/3/5/7, timpani, low strings swelling, toy-whistle pip, ratchet into A1 |
| **A1** | 29–36 | 31.11–40.00 | A (1–8) | as A | THE ORCHESTRA PUSHES IN: the cellos sing strain A high; bassoon "oom" + pizzicato "pa-pa"; robot-arp bursts heckle in the held notes (bars 2, 4, 6, from 2&); strings swell; timpani (A2 eighths) + snare roll into D |
| **D** | 37–44 | 40.00–48.89 | refrain (25–32) | D … Gm Dm/A A7 Dm | the violins carry the refrain over the muzak band (bars 1–4); at "Torna a Surriento" the orchestra takes over: trumpet doubles, tuba oom-pa-pa, string stabs, tamburello, horn pedal, trombone B♭–A–G–F, orchestra hits, clash cymbals, timpani; ratchet at the end |
| chime | 45–46 | 48.89–51.11 | — | D6, A9 (on 2&) | the falling PA chime snaps back to the muzak |
| **B2** | 47–54 | 51.11–60.00 | B (9–16) | D major, vi–ii–V in the 2nd phrase; last bar as B | MUZAK RELAPSE (fake cheer): steel guitar at pitch (D4–D5), celesta sparkle two octaves up on the long notes, low vibes comping (with the 2& push in the last bar), bossa claves, open-hat lifts, a toy train whistle "toot-toot" |
| **C2** | 55–62 | 60.00–68.89 | C (17–24) | as C | e-piano lead an octave up; on the B♭maj7 an orchestra hit (on D) and the phrase's last D warps into the warble; the minor phrase follows an octave lower with staccato bassoon two octaves below it; timpani (A2) + snare roll announce the orchestra |
| **A2** | 63–70 | 68.89–77.78 | A (1–8) | the reference harmony | THE ORCHESTRA WINS: Neapolitan street-band waltz — violins an octave up + trumpet, horn counter-line, tuba oom, string stabs pa-pa, tamburello, timpani, clash cymbals; the robots' last heckles in the held notes of bars 4 (from 2&) and 6 (beat 3); snare roll into D2 |
| **D2** | 71–78 | 77.78–86.67 | refrain (25–32) | as D | TUTTI: violins and mandolin tremolo an octave up, trumpet, horns, trombone, tuba, stabs, tamburello, the muzak drummer's ride and the synth bass join; orchestra hits, clash cymbals; ratchet + toy-whistle "fall" yank the tape |
| chime2 | 79–80 | 86.67–88.89 | — | D6, A9 (on 2&) | the rising PA chime (A–D–F♯–A) closes the loop |

The loop runs from B (bar 5, 4.444 s) to the end (88.889 s): loop body 76 bars = 84.44 s, total
music 88.9 s (target 85–100 s). The seam is chime2 → B: the chime's A9 and the synth bass pickup
A–A–C♯ lead into B's D6, exactly like the intro's vamp.

## Harmony

The reference chord symbols are the basis; the muzak dresses them in lounge extensions, the
corrupted sections reharmonise them, the orchestra plays them straight.

**Voicing.** Comping, pads and arps use 3-note voicings from the sequencer's voicer, which drops a
chord's fifth first and then its root. So the 4-note chords keep their root (D6 = D F♯ B, Em7 =
E G D, Bm7 = B D A, Gm6/B♭ = G B♭ E) and only the 9th chords lose it (A9 = C♯ G B, A7♭9 = C♯ G B♭).
A maj7 or mM7 symbol would therefore put the root a semitone above the seventh (Dmaj7 → F♯ C♯ D,
B♭maj7 → A B♭ D, DmM7 → F C♯ D). Those chords are spelled as their upper structures over the bass
note that the synth bass or the bassoon already plays:

| Chord (sounding) | Written | Upper voices | Bass |
|---|---|---|---|
| Dmaj7 | `F#m/D` | F♯ A C♯ (3-5-7) | synth bass D |
| B♭maj7 | `Dm/Bb` | D F A (3-5-7) | synth bass B♭ |
| DmM7 | `Faug/D` | F A C♯ (3-5-7) | synth bass D |
| DmM7/C♯ (lament) | `Dm/C#` | D F A | bassoon C♯ |

- **B** (ref D | Em | A7 | D | D | Em | A7 | D): D6 | Em7 | A9 | D6 | D6 | Em7 | A9 | Dmaj7 → A9.
  D6 rather than Dmaj7 wherever the tune sits on D (no C♯ under a melody D); B2 replaces the 5th
  bar with Bm7 (vi–ii–V–I). The last bar is the turnaround: Dmaj7 under the tune's F♯, then **A9
  from 2&**, where the e-piano's (B) or the vibes' (B2) 2& push and the bossa bass's second note
  (A1, then C♯2 on 3&) change together. The tune rests on beat 3, so the A9 is heard bare: C♯ G B
  over A; the F♯'s ring is its 13th.
- **C** (ref D | Em | A7 | B♭ | Gm | Dm | A7 | Dm): D6 | Em7 | A9 | B♭maj7 | Gm | DmM7 | A7♭9 |
  Dm A7♭9. The B♭maj7 is where the tape warps, under the tune's held D (its 3rd). Gm is the
  reference chord: the tune's on-beat notes D–F–D are its 5th and 7th, the off-beat E a
  neighbour note. DmM7 is the spy-film minor-major seventh. The synth bass plays root and third
  under A7♭9 (the tune's F is the ♭13).
- **A, A1** (ref Dm | Dm | Gm | Dm | B♭ | Dm | A7 | Dm): Dm | Dm/C♯ | Gm6/B♭ | Dm/A | B♭7 | Dm/A |
  A7♭9 | Dm A7 — a lament bass D–C♯–B♭–A under a held D minor (the C♯ only in the bass), and B♭7
  used as a **German sixth** (B♭–D–F–G♯) resolving to the cadential Dm/A and A7.
- **A2** plays the reference harmony: Dm | Dm | Gm | Dm | B♭ Gm | Dm/A | A7 | Dm A7 (B♭ → Gm in the
  fifth bar as in `wf_surriento.abc`).
- **Refrain** (ref D | Em | A7 | D | Gm | Dm | A7 | Dm): D | Em7 | A7 | D | Gm | Dm/A | A7 | Dm; the
  tuba and the trombone's B♭–A–G–F make the cadence G–A–A–D in the bass with the 7th and 3rd (G, C♯)
  resolving to F and D.
- **Chimes**: D6 | D6 → A9 on 2&, with the chime's last note (A4 falling, A5 rising).

The orchestra-hit sample is an octave-stacked unison (a hit "on C4" sounds C2…C6), so a hit on a
chord root sounds that root in every octave. Where the pads hold a seventh or ninth a semitone
away, the hit takes another chord tone: C2's tape-warp hit is on **D** (the tune's note, not the
B♭ root, against the pad's A3), and A's bar-7 hit is on the leading tone **C♯** (not the root A,
against the pads' ♭9 B♭3).

**Vertical check** (scratch script over the exported events: every pair of pitched notes
sounding together, at every sixteenth, where the upper note is a semitone above the lower modulo
the octave, i.e. m2 / m9, reported where the contact starts): 105 contacts before the review
fixes, **44 now**, all of them deliberate:

- 15 × the refrain's D anticipation over A7 (D, D2 bar 7, 3&);
- 13 × the ♭9 of A7♭9 against its own root, at least a minor ninth apart (synth bass A1, bassoon
  A2, timpani A2 under the pads' B♭3; C/C2 bars 7–8, A/A1 bar 7);
- 12 × the tune's own passing and neighbour tones (B bar 5, C/C2 bar 3, D/D2 bar 3), one eighth each;
- 2 × the synth bass's chromatic approach C♯2 (B bar 4, one eighth);
- 2 × the lament: the bassoon's staccato C♯3 under the held D4 of Dm/C♯ (A, A1 bar 2).

No accompaniment voice sits above the tune (checked at every sixteenth) except the A1 string swell
in its last two bars (its G4, the seventh of A7♭9, over the cellos' F–E for two beats, and the
D-minor F4 over their final D), the celesta sparkle (B2: two octaves above the steel guitar,
doubling its long notes) and the robots' heckles, which play only in the gaps of the tune.

## Instrumentation and ranges

All ids are from the brief's instrument contract and render with recorded samples (or are the
contract's synthetic ids). Sounding ranges as written:

- **muzak band**: `vib` vibes lead (D5–E6), `vibC` vibes comping (C♯3–D4 in B2, under the steel
  guitar; E3–D4 in C2), `chm` vibes PA chime (A4–A5), `cel` celesta (A5–B6), `sgtr` steelGuitar
  lead (D4–D5), `ep` epiano comping (E3–D4), `epL` epiano lead (A5–E6), `sb` synthBass (A1–B2),
  `robo` roboArp (F5–F6, five short bursts per loop in A1 and A2 only), `hat` hatC (ride / clock), `hatO` hatO (lifts), `shk`
  shaker, `clv` claves, `kick` (orchestral bass drum, feathered on 1).
- **corruption**: `warb` warble lead (D4–D6), `dpad` darkPad (E3–E4), `bsn` bassoon (D2–A3,
  staccato), `hit` orchHit (G3–D4), `ratch` ratchet (crank / slow / fast), `whis` toyWhistle
  (pip / fall / double).
- **orchestra / street band**: `vln` violin (G4–F6), `vc` cello (D4–F5), `tpt` trumpet (D4–F5),
  `mand` mandolin (G5–F6, tremolo on quarters and longer), `hrn` horn (A3–A4), `tbn` trombone
  (F3–B♭3), `tuba` (G1–E2), `pizz` pizzicato strings (F3–E4), `stab` strStab (E3–D4), `str`
  strings (D3–G4: the low swell of A, the A1 swell, a soft pad under the violins in D bars 1–4),
  `timp` timpani (D2, G2, A2, B♭2: a D–A pair plus G and B♭), `crash` clash cymbals (the
  orchestra's arrivals in D, A2 and D2), `snare` (rolls), `tamb` tambourine (accent / hit / shake /
  roll).

Every part is inside the brief's natural ranges (guitar E2–B5, bassoon, the strings, brass and
mandolin as listed in the brief; timpani D2–B♭2, the standard drums' compass). The vibes comping
reaches C♯3, inside the recorded vibraphone set (a 4-octave instrument, lowest zone C3). The
bassoon's staccato notes leave it room to breathe; the cellos and the violins' long notes are
phrase-length.

Key and tempo: D minor / D major, the reference key (vibes, warble, cellos, violins and the steel
guitar all sit well there). ♩ = 162 (54 bars/min, inside the 50–60 asked for), `swing` 0.08 (a
light jazz-waltz lilt on the off-beat eighths).

## Render (recorded samples)

`node scripts/music/render-song.mjs foodcourt out.wav` (48 kHz, sample bank: 54 sets):

- duration 94.89 s buffer = 88.89 s of music + the renderer's 6 s loop pad; loop 4.444 → 88.889 s
  (buffer window 10.444 → 94.889 s), body 84.444 s = bars 5–80 from section B;
  **seam mismatch −150.5 dBFS**, no event rings past the seam
- **loop body −16.3 LUFS** (−16.28; whole file −16.4), short-term max −14.6 LUFS, RMS −19.4 dBFS,
  **sample peak −1.99 dBFS**, soft clipper 11 samples (0.000 %), DC 0
- spectral balance: < 250 Hz −10.0 dB, 250 Hz–4 kHz −0.5 dB, > 4 kHz −19.4 dB (darker than the
  street-band tracks, as muzak should be)
- `gainDb` −1.1, **no warnings**

| Channel | Instrument | Notes | Gain dB | Solo LUFS | vs mix (LU) | Peak dBFS |
|---|---|--:|--:|--:|--:|--:|
| vib | vibes | 48 | 0 | −17.9 | **−1.6** | −9.7 |
| vibC | vibes | 39 | −0.9 | −25.9 | −9.6 | −11.5 |
| chm | vibes | 12 | −0.9 | −22.1 | −5.8 | −13.6 |
| cel | celesta | 16 | −10 | −35.8 | −19.5 | −20.4 |
| sgtr | steelGuitar | 31 | −3 | −18.0 | **−1.7** | −5.4 |
| ep | epiano | 108 | −9 | −32.3 | −16.0 | −17.2 |
| epL | epiano | 14 | −4 | −18.3 | **−1.9** | −10.9 |
| sb | synthBass | 95 | −5 | −24.8 | −8.5 | −14.6 |
| robo | roboArp | 28 | −5 | −28.8 | −12.4 | −18.1 |
| hat | hatC | 234 | −5 | −39.0 | −22.6 | −19.1 |
| hatO | hatO | 8 | −10 | −39.8 | −23.5 | −27.1 |
| shk | shaker | 144 | −6.7 | −40.3 | −23.9 | −19.0 |
| clv | claves | 16 | −10 | −42.7 | −26.4 | −24.5 |
| kick | kick | 74 | −10 | −31.2 | −14.9 | −14.9 |
| warb | warble | 65 | −3 | −18.0 | **−1.7** | −7.7 |
| dpad | darkPad | 67 | −15 | −34.9 | −18.6 | −23.0 |
| bsn | bassoon | 50 | −5 | −28.0 | −11.7 | −13.7 |
| hit | orchHit | 12 | −10.6 | −31.2 | −14.9 | −16.6 |
| ratch | ratchet | 5 | −15 | −38.3 | −22.0 | −17.9 |
| whis | toyWhistle | 5 | −13 | −39.1 | −22.7 | −24.5 |
| vln | violin | 75 | −4 | −17.3 | **−1.0** | −6.3 |
| vc | cello | 31 | −3 | −16.8 | **−0.5** | −6.4 |
| tpt | trumpet | 63 | −5 | −24.0 | −7.6 | −13.3 |
| mand | mandolin | 22 | −8.2 | −28.1 | −11.8 | −15.7 |
| hrn | horn | 31 | −9 | −30.4 | −14.1 | −19.6 |
| tbn | trombone | 8 | −8.4 | −28.6 | −12.3 | −16.0 |
| tuba | tuba | 26 | −7.1 | −26.5 | −10.2 | −12.3 |
| pizz | pizz | 48 | −9.9 | −31.5 | −15.2 | −17.9 |
| stab | strStab | 120 | −12.5 | −31.2 | −14.9 | −16.0 |
| str | strings | 26 | −9.3 | −25.3 | −9.1 | −12.5 |
| timp | timpani | 32 | −8 | −32.5 | −16.2 | −15.6 |
| crash | crash | 4 | −7 | −30.1 | −13.7 | −14.7 |
| snare | snare | 24 | −5 | −25.3 | −9.0 | −8.5 |
| tamb | tamb | 80 | −3.2 | −35.1 | −18.8 | −13.1 |

Every lead channel (bold) is within 2 LU of the loop mix. Per section (gated integrated loudness
and sample peak of the section in the render, the loop sections as they repeat; each lead's solo
loudness relative to the mix over the same bars, from solo stems that a scratch script renders
through the same renderer and bank):

| Section | Mix LUFS | Mix peak dBFS | Lead (solo vs mix, same bars) |
|---|--:|--:|---|
| intro | −21.3 | −9.5 | chime −0.2 (bars 1–2) |
| B | −16.9 | −6.2 | vibes −1.1 |
| C | −16.7 | −6.6 | vibes −1.0 (bars 1–3), warble on the held D6 −1.4 (bar 4), warble −1.1 (bars 5–8) |
| A | −16.6 | −5.8 | warble −0.7 |
| A1 | −16.1 | −5.8 | cello −0.7 |
| D | −15.7 | −4.1 | violin −2.0 |
| chime | −20.6 | −11.8 | chime −0.7 |
| B2 | −16.4 | −3.5 | steel guitar −1.5 |
| C2 | −16.6 | −5.3 | e-piano −1.4 (bars 1–3), warble on the held D6 −2.0 (bar 4), warble −1.6 (bars 5–8) |
| A2 | −15.0 | −4.1 | violin −1.5 |
| D2 | −15.3 | −2.0 | violin −2.0 |
| chime2 | −20.6 | −12.3 | chime −0.6 |

The groove sections sit within 1.9 LU of each other (muzak and sinister −16.1…−16.9, orchestra
−15.7 in D and −15.0 in A2, the tutti −15.3), so the loop does not pump under gameplay; the two
chimes are the 2-bar breathers.

**Audibility of the small parts** (scratch script, measured when the review fixes went in: the
channel's solo against the mix without it, in third-octave bands, 85 ms frames, over each burst;
"unmasked" = frames in which the channel is louder than the rest of the mix in at least one band;
momentary loudness = 400 ms window). For scale, the trombone counter-line, which is audible but
not prominent, reads 83 % unmasked with a best band of −3 dB on the same scale.

| Part | Bursts | Best band (dB) | Unmasked frames | Burst vs mix, momentary |
|---|---|--:|--:|--:|
| robot heckles, A1 bars 2 / 4 / 6 | 6 sixteenths from 2& | +0.7 / +10.6 / +4.3 | 87 % each | −12.2 / −11.5 / −10.9 LU |
| robot heckles, A2 bars 4 / 6 | 6 from 2& / 4 from beat 3 | +3.2 / −1.4 | 81 % / 64 % | −13.7 / −11.8 LU |
| snare rolls, A1 / C2 / A2 bar 8 | 8 sixteenths, crescendo | +2.0 / +0.3 / +1.2 | 91 % / 68 % / 82 % | −7.2 / −4.6 / −8.5 LU |

Re-checked on the current render, with the louder low strings of the polish below (the loop as it
repeats; frames as above, each burst's middle 400 ms against the mix): the robot heckles are
unmasked in 83 / 100 / 100 % of their frames in A1 bars 2 / 4 / 6 and in 100 / 100 % in A2 bars
4 / 6, at −11.4 / −10.7 / −10.2 and −11.4 / −10.6 LU; the snare rolls (A1 / C2 / A2 bar 8) in 90 %
each, at −6.8 / −4.0 / −6.5 LU; the trombone counter-line in 81 %. None of them lost ground to the
strings.

A chroma check (scratch script: per-bar FFT chroma of the render against the pitch classes of the
written notes) gives a median correlation of 0.85; every bar's strongest pitch classes are its
chord and melody tones — no tuning or octave accident in the sample render. On beat 3 of the
turnaround bars (12 and 54) the strongest bins are now the A9's (bar 54: B3 0 dB, G3 −4, C♯3 −5,
C♯4 −6, A3 −8), where the review measured D4 0 dB, F♯3 −3, C♯4 −3.

**Chromium, real engine**: `audiotest.html` → `__at.samplerTrack('foodcourt')` (browser MP3
decoding, fresh music worker, a private dev server with `scripts/vite.agent.config.ts`): 54 sets,
no warnings, no page errors; decode 0.51 s, worker render 1.45 s, longest main-thread frame gap
21 ms. The result has the Node render's length (4 554 667 samples), loop points and −1.99 dBFS
peak, and equals it within one 16-bit step everywhere except at the shaker's accented stroke on
the downbeat of every other bar of the muzak sections (93 of its 10 ms blocks), where the two differ
by up to 174 steps (−45.5 dBFS; −97.2 dBFS RMS over the whole render). The cause is in the bank:
Chromium's decoder and ffmpeg disagree on the first take of the `shaker` sprite (zone r0) by
−44.8 dB of its level, while its other three takes agree to −113 dB. That is the sampler's to
fix; the song does not work around it.

## Review fixes

An independent review found six problems; all are fixed in the song and above.

1. **Strain B's cadence bar** (B and B2, last bar; bars 12 and 54): the e-piano's 2& push (B) and
   the vibes' beat-2 chord (B2) read Dmaj7 and held it over the A9 on beat 3, voiced F♯3 C♯4 D4
   (root a semitone above the seventh), so the half cadence sounded like Dmaj7/A. Now the chord
   changes on 2& (`F#m/D:3 A9:3`) together with the push, the pad and the bass (A1 on 2&, the
   bossa bass's own second note); B2's vibes play a 2& push in that bar. Dmaj7 is voiced F♯–A–C♯,
   B♭maj7 D–F–A, DmM7 F–A–C♯ and the lament's DmM7/C♯ D–F–A (see Harmony); the "rootless" claim
   is corrected.
2. **Steel guitar above its range** (B2): the octave-up line reached C♯6/D6 (22nd fret, beyond the
   recorded zones). It now plays at pitch, D4–D5; the vibes comping (C♯3–D4) and the pad (D3–D4)
   moved below it, and no comping note sounds above it.
3. **Inaudible robot arps and snare rolls**: the robots only play where they heckle — in the
   tune's gaps in A1 (bars 2, 4, 6) and A2 (bars 4, 6), 10 dB louder (gain −15 → −5) — and were
   removed from C, D and C2, where the band masked them anyway; the snare rolls are 12 dB louder
   (gain −17 → −5) with a wider crescendo (velocity 0.36 → 0.85, A2 0.40 → 0.89, reaching the
   sample set's loud layers). Unmasked frames: robots 9 % → 82 %, snare rolls 18 % → 80 % (same
   method as the table above).
4. **Remaining m2/m9 contacts with the tune**: C bar 5 is plain Gm (the dark pad no longer holds E4
   under the tune's on-beat F), C2's bassoon doubles the minor phrase two octaves down (D2–F3,
   below the dark pad, instead of rubbing A3 against its B♭3 and F4 against E4), and the chime's
   chord changes on 2& with its last note. The vertical check above lists every contact that
   remains.
5. **Timpani below range**: the A1/B♭1 notes (21 of 32) are now A2/B♭2 (a D2–A2 pair plus G2 and
   B♭2), inside the standard drums and the recorded set.
6. **Strain C split inside its first phrase**: the D of reference bar 20 (the end of "E tu dice:
   'I' parto, addio!") stays in the phrase's octave (D6, on the warble: the tape warps on the held
   note), and the octave drop comes with the second phrase (reference bar 21). compare.py now
   reports the displacement as ref bars 21–24 instead of 17–19.

## Polish: clash cymbals on the arrivals, the low strings heard, the synth pad dropped

A review found three described parts inaudible. Measure for all of them (scratch script on the
full render, recorded bank, the review's method): for each note, the largest third-octave rise of
the mix over the mix without that channel (63 Hz–12.5 kHz, bands within 40 dB of the window's
loudest); a part is heard when its notes rise 3 dB or more in their own band. Windows: hits over
their first 100 ms, sustained notes over the note.

**Cymbal hits → clash cymbals.** The four suspended-cymbal hits (D bar 5, A2 bar 1, D2 bars 1
and 5) rose +0.8 to +1.5 dB, all at 500–630 Hz and nothing at 4–12 kHz: the VCSL mallet strokes
have their attack energy at 250 Hz–1 kHz (spectral centroid 0.6–0.7 kHz over the first 100 ms),
and the orchestra hits and the tutti landing on the same beats cover that. Even 10 dB louder they
rose only +2.9 to +5.2 dB, still at 500–630 Hz. They are now clash cymbals (`crash`, the bank's
VCSL piatti, gain −7 dB, velocity 0.8 / 0.8 / 0.85 / 0.85), the orchestra's own accent:

| Hit | Before (suspended cymbal) | After (clash cymbals) | Cover | Cymbal vs mix |
|---|---|---|---|---|
| D bar 5, "Torna a Surriento" (44.44 s) | +1.5 dB at 500 Hz | **+11.1 dB** at 12.6 kHz | 0.18 LU | −13.9 LU |
| A2 bar 1, the orchestra wins (68.89 s) | +1.0 dB at 630 Hz | **+8.3 dB** at 12.6 kHz | 0.17 LU | −14.3 LU |
| D2 bar 1, the tutti (77.78 s) | +1.1 dB at 500 Hz | **+5.4 dB** at 2 kHz | 0.20 LU | −13.0 LU |
| D2 bar 5 (82.22 s) | +0.8 dB at 630 Hz | **+5.9 dB** at 12.6 kHz | 0.19 LU | −14.0 LU |

("Cover": how much the crash raises the momentary loudness; "cymbal vs mix": its own momentary
loudness against the mix. The tune stays on top: it is 1.8–6.2 LU under the mix there, the crash
13–14 LU.)

**Low strings.** Channel −15.3 → −9.3 dB, and A's swell (bars 5–8) now rises from velocity × 0.45
to × 1.3 (was 0.3 → 1), so it starts audible and crests into A1, where the tune rests.

| Strings | Before: rise per note (dB) | After |
|---|---|---|
| A, the low swell (bars 5–8, 5 chords) | 1.4, 2.3, 0.7, 0.7, 5.7 | **7.1, 10.3, 4.3, 3.4, 12.4** |
| A1, the swell (bars 7–8) | 1.4, 3.5, 2.0 | **4.1, 7.4, 4.7** |
| D bars 1–4, the soft pad under the violins | 1.1, 1.5, 0.5, 0.7 | 2.5, 4.0, 1.5, 2.2 → **4.7, 8.7, 3.6, 5.1** (velocity 0.45 → 0.66, below) |

The A swell stays 7.5–10.5 LU under the mix while the warble sings (cover ≤ 0.43 LU) and crests
in its last two beats, where the tune rests (the strings 4.5 LU under the mix there, cover 1.9
LU).

**The D pad, heard.** A second review found that the pad under the violins in D bars 1–4 was still
under the 3 dB rule (3 of its 4 chords; per note, L and R third-octave bands over each note: 2.3,
1.9, 3.7, 2.5, 1.3, 2.3, 1.4 dB), so it was neither heard nor dropped; it shares its register with
the e-piano's waltz comping (E3–D4). Its velocity goes 0.45 → 0.66 (the channel gain, which sets
A's and A1's swells, stays −9.3 dB): every chord rises 3.6–8.7 dB in its band, every note
3.5–8.3 dB (per note: 4.4, 4.3, 8.3, 6.2, 3.8, 5.6, 3.5 dB), and the pad stays 5.0–7.1 LU under the
violins (it adds 0.6–0.9 LU to the mix there). The violins keep the bars: all 13 of their notes in
D bars 1–4 still rise 7.9 dB or more in their band (median 17.8 dB, 20.3 before). Per section, the
strings sit 11–12.5 LU under the mix (7.5 in D, under the violins), the lead 0.7–2.0 LU.

**Synth pad dropped.** The muzak's synth pad (`spad`, −17 dB) rose 0.1–2.4 dB in its band: none
of its 30 notes reached 3 dB, masked by the e-piano and vibes comping in the same register. 6 dB
louder, 4 of 30 notes reach 3 dB; 10 dB louder, 16 of 30, but in B2 only 1 of 9 (under the
vibes comping) while it covers the intro by 1.5 LU. So the part and its channel are gone, and the
muzak band is described without it (vibes, e-piano, synth bass, ride, shaker, claves). The
removal changes the mix by less than 0.1 LU.

Melody channels are untouched; the four compare.py proofs above give the same results. Render
after these changes: "Render" above.
