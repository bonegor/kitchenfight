# `title`: "Funiculì, Funiculà" (main theme)

| | |
|---|---|
| Piece | "Funiculì, Funiculà", Neapolitan song |
| Composer | Luigi Denza (music), Peppino Turco (words) |
| Year | 1880 (written for the opening of the Vesuvius funicular) |
| Public domain | Yes: Denza died in 1922, Turco in 1903; the 1880 publication is out of copyright everywhere. The arrangement is new; only the melody, its printed harmony and bass are taken from the sources below. |
| Track | `src/audio/songs/title.ts`, export `title`, id `title`: title screen and attract mode, looping |
| Key / meter / tempo | F major, 6/8, dotted quarter = 124 (`bpm: 124`, `stepsPerBeat: 3`, `barSteps: 6`, one step = an eighth) |
| Length | 68.7 s of music (71 bars); intro 2.9 s, loop body 65.8 s (bars 4–71); rendered buffer 74.7 s including the 6 s seam pad |

## Reference

**Melody:** `/home/user/kitchenfight-refs/abc/bb_funiculi.abc` voice 1 ("34. A Merry Life", E♭
songbook print, grade A in [`REFERENCES.md`](REFERENCES.md)). In the refrain the melody is the top
note of the printed thirds. Transcribed **+2 semitones (E♭ → F)**, note for note, with
`abc2notes.py --voice 1 --bars … --dsl 0.5` as the starting point.

| Reference bars | Material (Neapolitan words) | In the song |
|---|---|---|
| 1 | pickup "Aie-" | last bar of `intro` (and of `refrain2`, for the loop) |
| 2–18 | verse "Aieressera, oje Nanninè… tu saie addò? Tu saie addò?" (×2) | `verse` bars 1–17 (bar 18 = fill: the tied last note, then a band fill) |
| 19 | tied end of the verse, pickup "Ad-" | last bar of `refrain` (pickup on the mandolin) |
| 20–37 | middle section "Addò lu fuoco coce…" (A minor) / "E nun te corre appriesso…" (C major) | `middle` bars 1–18 |
| 38–53 | refrain "Jammo, jammo, 'ncoppa jammo jà… funiculì, funiculà!" | `refrain` bars 1–16, again ornamented in `refrain2` |

**Cross-check:** `jc_funiculi_201229790.abc` X:129 (The Everyday Song Book, 1927), an independent
grade-A print. Its verse and refrain are under `|: :|`; **compare without `--expand-repeats`**,
otherwise the bar range selects both passes (verse 0–8, middle 10–28, refrain 29–44).

**Harmony:** chord symbols of `wf_funiculi.abc` (F-major lead sheet; its header's `K:C` and the
extra empty bar 50 are ignored, as REFERENCES.md says) and of the session book
`jc_tarantellanap_201233923.abc` X:5 (in G, the same functions), plus the printed bass voice
`bb_funiculi.abc` V:2 for the refrain.

## Melody proofs (compare.py at default thresholds)

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
# verse, first statement: ref bars 1-18 = song bars 3-20 (pickup in the intro's last bar)
$PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 1-18 --song title --channel acc --bars 3-20
# refrain, first statement
$PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 38-53 --song title --channel acc --section refrain
# middle section, first statement: ref bars 19-37 = song bars 37-55 (the pickup sits in the refrain's last bar)
$PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 19-37 --song title --channel mand --bars 37-55
# refrain2 (ornamented restatement)
$PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 38-53 --song title --channel acc --section refrain2
# cross-checks: the Everyday Song Book (no --expand-repeats, see above) and the wf lead sheet
JC=$REFS/jc_funiculi_201229790.abc
$PY scripts/music/compare.py --abc $JC --tune 129 --ref-bars 0-8 --song title --channel acc --bars 3-11
$PY scripts/music/compare.py --abc $JC --tune 129 --ref-bars 0-8 --song title --channel acc --bars 12-20
$PY scripts/music/compare.py --abc $JC --tune 129 --ref-bars 29-44 --song title --channel acc --section refrain
$PY scripts/music/compare.py --abc $JC --tune 129 --ref-bars 10-28 --song title --channel mand --bars 37-55
$PY scripts/music/compare.py --abc $REFS/wf_funiculi.abc --ref-bars 38-49 --song title --channel acc --section refrain --bars 1-12
```

All nine commands were re-run after the review fixes below (they change only harmony, bass and
accompaniment voicings, not the melody channels) and give the same results:

| Passage | Reference | Song side | Pitch | Rhythm | Result |
|---|---|---|---|---|---|
| Verse | bb 1–18 (38 notes) | `acc`, bars 3–20 | 100.0 % | 100.0 % | PASS |
| Refrain | bb 38–53 (48 notes) | `acc`, section `refrain` | 100.0 % | 97.9 % | PASS |
| Middle section | bb 19–37 (39 notes) | `mand`, bars 37–55 | 100.0 % | 100.0 % | PASS |
| Refrain2 (restatement) | bb 38–53 | `acc`, section `refrain2` | 98.0 % | 98.0 % | PASS |
| Cross-check verse, 1st phrase | jc X:129 0–8 | `acc`, bars 3–11 | 100.0 % | 100.0 % | PASS |
| Cross-check verse, 2nd phrase | jc X:129 0–8 | `acc`, bars 12–20 | 100.0 % | 100.0 % | PASS |
| Cross-check refrain | jc X:129 29–44 | `acc`, section `refrain` | 100.0 % | 97.9 % | PASS |
| Cross-check middle | jc X:129 10–28 | `mand`, bars 37–55 | 97.4 % | 97.4 % | PASS |
| Cross-check refrain (lead sheet) | wf 38–49 | `acc`, `refrain` bars 1–12 | 100.0 % | 100.0 % | PASS |

No `--allow-bars` and no `--resync` are used. The remaining differences:

- **Refrain, ref bar 41** ("'ncoppa jammo **jà**"): the print has a tie between two chords,
  `[Bd]3- [Bd]2`. abc2notes does not merge ties between chords, so the reference reads two D5
  onsets; the song holds the note as printed and compare.py counts the second onset as merged
  (1 of 48). In `refrain2` the accordion re-strikes it with an accent, as a variation.
- **Refrain2**: the one extra note is the verse pickup in its last bar (the loop goes back to the
  verse). Its ornaments (grace notes before "Jam-", "là", "'ncop-") are ignored by compare.py.
- **jc middle**: the extra note is the refrain's last note (F4), which in the jc file lies in the
  short bar 9, outside its bar range.
- The verse's second phrase has an accordion grace note and a mordent (ignored by compare.py).

## Form

| Section | Song bars | Time (s) | Reference | Texture |
|---|---|---|---|---|
| `intro` | 1–3 | 0.00–2.90 | bar 1 (pickup) | Accordion bellows shake on C7 over tambourine and timpani rolls and a suspended-cymbal swell; arpeggio run up to a trilled G5 with castanets; tutti F stab (crash, bass drum, brass) and the oom-pah starts under the pickup |
| `verse` | 4–21 | 2.90–20.32 | 2–18 + fill | Accordion lead; upright-bass oom-pah, nylon-guitar oom-pa-pa, light mandolin off-beat chops, tambourine. 2nd phrase: accordion chords, clarinet in thirds/sixths, mandolin tremolo shimmer an octave up on the long notes. Bar 18 (fill): snare roll and a timpani roll on C2 through the bar, cymbal swell, castanet roll; the bass falls down the C7 chord (C3–B♭2–G2) into the refrain's C |
| `refrain` | 22–37 | 20.32–35.81 | 38–53 (+19 pickup) | Full band. Stop-time "JAM-mo!" hits (bass, chords, trombones, bass drum) with a clarinet echo and castanets in the gaps; accordion in the printed thirds plus an octave-lower accordion, mandolin tremolo on the long notes; "funiculì, funiculà" over the chromatic bass F–E–D–C♯–D with trombone punches and trumpet accents on "lì / là", a rising clarinet inner line; glockenspiel on the long notes; crash on the downbeat and on the climax "là!"; button, then the mandolin pickup alone |
| `middle` | 38–55 | 35.81–53.23 | 20–37 | Contrast: A minor, mandolin tremolo lead, guitar arpeggios, pizzicato off-beats, castanets, staccato bassoon answers. C-major half: accordion thirds under the mandolin, accordion chords, string-pad crescendo, clarinet answers. Bar 18: snare/timpani rolls, cymbal swell, trombone C7 swell, xylophone run up |
| `refrain2` | 56–71 | 53.23–68.71 | 38–53 ornamented | As `refrain`, bigger: trumpet doubles the "Jammo, jammo" call, tuba joins the bass, string pad, louder bass drum, a third crash on the final button; the last bar carries the verse pickup |

`loopFrom: 1` (the verse). The loop window is 2.903 → 68.710 s of music; in the rendered buffer
playback runs 0 → 74.710 s, then repeats 8.903 → 74.710 s (render-song). The verse pickup is in the
last bar of both the intro and `refrain2`, so the melody runs straight across the seam.

## Harmony and bass

- **Verse** (wf / session book: F, with C7 under "and so do"): `F | F C7 | F B♭ | F | F C7 | F | F C7 | F | F C7`.
  Two passing chords are added where the melody holds a dotted quarter that is not in the F
  chord: C7 under "E5 E5" (ref bars 3/12, beat 2) and B♭ under "D5 D5" (ref bars 4/13, beat 2).
  The pickup bars turn around on C7. In the bars where the melody anticipates the next tonic on
  the last eighth (ref bars 6, 8, 15, 17), the off-beat chord on that eighth is left out, so the
  anticipated F does not rub against the E of C7. In the fill bar (verse bar 18, `F C7`) the
  timpani rolls on C2 through the bar, and on the C7 half the bass falls down the chord,
  C3–B♭2–G2, into the refrain's C2: an octave, a seventh and a fifth above the roll. (A chromatic
  walk E2–D2–D♭2 there rubbed against the roll: D♭2 against C2 is a semitone at 65–69 Hz.)
- **Middle** (wf: Am / E7, C / G7): with E7/G♯, Am/G and G7/B bass inversions.
- **Refrain** (wf chords + bb V:2 bass): C7 pedal for "Jammo, jammo". In ref bars 40/44 it is
  B♭/C (IV over the dominant pedal, as the printed thirds and the session book's "(C)" show), with
  C7 under the passing E5. Then `F | A7/E | Dm | A7/C♯ | Dm`, the printed chromatic bass, then
  `C7/B♭ → B♭` (ref 50, V4/2 → IV as printed), then the cadential 6/4 exactly as printed over the
  dominant pedal (B♭ in the E♭ print, C here): ref 51 `F/C:5 C7:1` (print `[GB] z [EG] [EG]2 [FA]`),
  ref 52 `F/C:2 C7:1 F/C:2 C7:1` (print `[GB]2 [FA] [EG]2 [DF]`: I6/4 on each quarter, V7 on the
  eighth after it), then `F`. The accordion's A4+C5 and F4+A4 sound over F/C, its G4+B♭4 and
  E4+G4 over C7, so no B♭ is held under the A.
- **Voicings.** `pad`/`comp` use close-position voicings (C7 = E3–B♭3–C4 in the accordion's left
  hand and the trombones). The guitar uses the open-position shapes of the top three strings, in an
  A3–F4 window in the intro, verse and refrains: F = A3–C4–F4, C7 = B♭3–C4–E4, B♭ = B♭3–D4–F4,
  Dm = A3–D4–F4, A7 = A3–C♯4–G4 (the standard x02223 shape), so it moves by step and never rises
  above the tune. The verse mandolin's off-beat double stops are A3+F4, B♭3+E4 and B♭3+D4, at or
  below the tune's lowest note there (F4).
- **Clash scan** (scratch script over the export-song events: all pitched channels including the
  timpani, nominal note lengths, overlaps of 0.10 s or more). It finds none of these: a minor
  second, major seventh or minor ninth (in any octave) between the lead (both notes of the
  accordion's thirds; the mandolin in the middle) and an accompaniment part; a minor second or
  minor ninth (in any octave) between two accompaniment parts; two notes below D3 less than a
  major third apart; a comping note (guitar, accordion chords, mandolin chops, trombones,
  pizzicato, strings) above the lead's top note. Counting the natural ring of the timpani (3.2 s),
  glockenspiel (2.2 s) and xylophone (about 1 s) instead of the written lengths adds only decaying tails,
  measured on solo renders against the mix in the same window: the xylophone run's last notes at
  the `refrain2` downbeat (23 dB below the mix), the intro's last timpani stroke (F2) in verse
  bar 2 (59 dB below), the glockenspiel's F6 in refrain bar 13 (61 dB below).

## Instrumentation

| Channel | Instrument id | Role | Range used |
|---|---|---|---|
| `acc` | `accordion` | lead (verse, refrains; printed thirds in the refrain), intro flourish | C4–G5 (+A5 trill) |
| `accLo` | `accordionDry` | refrain melody an octave lower (the accordion's 16′ "bassoon" reed: the right hand stays at F4–G5); thirds under the mandolin in the middle | F3–G4, B3–B4 |
| `accC` | `accChord` | left-hand chord stabs (oom-pa-pa, stop-time hits) | E3–D4 |
| `mand` | `mandolin` | tremolo doubling in the refrains, lead in the middle, shimmer in the verse | E4–F6 |
| `mandC` | `mandolin` | light off-beat double stops in the first verse phrase, at or below the tune | A3–F4 |
| `gtr` | `guitar` | strummed oom-pa-pa (open-position top-string shapes), arpeggios in the middle | A3–G4 (oom-pa-pa), E3–F4 (middle) |
| `clar` | `clarinet` | verse thirds, refrain echoes, run and chromatic inner line, middle answers | A3–G5 |
| `bsn` | `bassoon` | staccato comic answers (A-minor half of the middle) | A3–E4 |
| `tpt` | `trumpet` | intro stab, accents on "lì / là", refrain2 call doubling | F4–G5 |
| `tbn` | `trombone` | intro stab, stop-time hits, punches, swell into refrain2 | C3–D4 |
| `bass` | `uprightBass` | oom-pah bass, printed refrain bass, the C7 fill into the refrain | G1–C3 |
| `tuba` | `tuba` | refrain2 bass doubling | B♭1–F2 |
| `pizz` | `pizz` | off-beats in the middle | E3–D4 |
| `str` | `strings` | pad: middle crescendo, refrain2 | G3–G4 |
| `glock` | `glock` | sparkle on the refrain's long notes | E6–F6 |
| `xylo` | `xylophone` | cartoon run into refrain2 | C5–G6 |
| `tamb`, `cast` | `tamb`, `castanets` | tambourine (hits, shakes, rolls) and castanet patterns, rolls into downbeats | — |
| `kick`, `snare`, `crash`, `cym`, `timp` | `kick`, `snare`, `crash`, `cymbal`, `timpani` | orchestral bass drum, snare rolls, clash cymbals on downbeats, suspended-cymbal swells (variant 1 = roll), timpani rolls on C | timpani C2, F2 |

**Why F major:** the reference is in E♭. One tone up puts the melody at E4–G5, the accordion's
best register: the top note G5 is a recorded zone, so it needs no pitch shift. F is also
friendlier to mandolin and guitar, brighter than E♭, and lets the octave-lower accordion stay
inside the sample range. G major would push the octave doubling and the mandolin shimmer too high.

## Render measurements (recorded sample bank)

`node scripts/music/render-song.mjs title out.wav` (header: `instruments: recorded samples (54 sets …)`):

| Measure | Value | Target |
|---|---|---|
| Loop body integrated loudness | **−16.4 LUFS** (−16.36; whole file −16.5) | −16.4 ± 0.5 |
| Short-term max | −13.4 LUFS | |
| Sample peak | **−2.50 dBFS** | < −1 dBFS |
| Soft clipper | 95 samples (0.001 %) | ~0 % |
| Loop seam mismatch | **−150.5 dBFS** (no jump) | seamless |
| Spectral balance | < 250 Hz −7.1 dB, 250 Hz–4 kHz −1.1 dB, > 4 kHz −15.9 dB | in line with the other tracks |
| Warnings | none (no skipped channels, no sequencer warnings) | |
| `gainDb` | −1.5 | |

The lead channel against the mix over the loop body is `acc` −1.2 LU. Per section (scratch
analysis on the same render: gated section LUFS of the mix, the loop sections as they repeat, and
the lead's solo loudness against it):

| Section | Mix LUFS | Lead vs mix |
|---|---|---|
| intro | −17.2 | `acc` −0.8 LU |
| verse | −17.8 | `acc` −1.5 LU |
| refrain | −15.6 | `acc` −1.9 LU (`mand` −9.0, `accLo` −13.0) |
| middle | −18.3 | `mand` −1.3 LU |
| refrain2 | −14.4 | `acc` −1.8 LU |

**In the browser:** `window.__at.samplerTrack('title')` on `audiotest.html` (Chromium, Vite dev
server) decodes the MP3 sprites with the browser's decoder, installs them in the music worker and
renders the track there. The result has the same length (3 586 065 samples) and loop window as the
Node render and nulls against it to −90.3 dBFS peak, one 16-bit step (−110.5 dBFS RMS). Peak
−2.50 dBFS and −16.5 LUFS whole-file in both; the bank loads 54 sets with no failures.

Bass and percussion against the section mix: upright bass −8 to −14 LU, tambourine −17 to −21,
castanets −18 to −23, bass drum −11 under the intro stab and about −16 in the refrains, timpani
−12 to −13 where it rolls (intro, verse and middle fills). Sparse accents (glockenspiel, xylophone
run, crash, cymbal swells) measure −10 to −26 LU in the sections where they play. Every channel is
audible: render-song flags none as inaudible.

## Review fixes

An independent review found four voicing/harmony faults; all are fixed and re-measured (the
numbers above are after the fixes; melody channels unchanged, every compare.py proof re-run):

| Finding | Fix | Proof |
|---|---|---|
| Refrain cadence (ref 52, song bars 36 and 70): C7 under the whole first beat, so the accordion's A4 rubbed against B♭3 in trombones, chords, guitar and the string pad | Bar 15 of `REFRAIN_BODY_CH` is `F/C:2 C7:1 F/C:2 C7:1`, as printed | Clash scan: no lead-vs-accompaniment minor second / major seventh / minor ninth left (was 7 rubs of 0.16–0.32 s) |
| Verse fill (song bar 21): bass walk E2–D2–D♭2 against the C2 timpani roll | Bass falls C3–B♭2–G2 down the C7 chord into C2; the roll stays on C2 for the crescendo into the refrain | Clash scan: no low-register or semitone pairs. Solo bass + timpani over the walk: fundamentals now at 98, 117 and 131 Hz (G2, B♭2, C3; C3 coincides with the timpani's 2nd partial) instead of 69–82 Hz next to the timpani's C2. Ending the roll before the walk would also have been quiet enough (a scratch variant left a ring of −46 dBFS RMS under it, 23 dB below the bass), but the roll would then stop half a bar before the downbeat |
| Refrain guitar window G3–E4 too narrow for a close F triad, so F was stacked at F4–A4–C5 above the tune | Window A3–F4 (as in the verse); same for the intro stab | Rendered guitar range A3–G4; no comping note above the lead |
| Verse mandolin chops F4+A4 above the held F4 (bars 6 and 8) | Window A3–F4, `n: 2` (A3+F4, B♭3+E4, B♭3+D4) | Rendered range A3–F4; no comping note above the lead |

## Polish: the cymbal swells on the bright roll

The bank's suspended-cymbal roll (variant 1) is bright (SSO's crescendo roll, spectral centroid
about 4 kHz on its peak instead of the old VCSL roll's 0.6 kHz). A review had found the three
swells inaudible with the old, dark roll, and the channel was re-balanced for the bright one
(`cym` −7.2 → −4.2 dB, the intro swell's velocity 0.5 → 0.55, the middle-section fill's 0.55 → 0.6;
the verse fill stays at 0.5: it is the most exposed).

A second review found that the swells did not reach their downbeats. The cymbal was gated at 90 %
of the written length, so the release began 0.1–0.2 s before the downbeat (the intro swell was
2.2 dB down when the verse arrived), and the roll's crescendo was 0.76 s long, so the 1.94 s intro
swell grew for 0.76 s and then held flat for 0.85 s. Both are fixed in the sampler (see
`docs/credits/music-samples.md`): the cymbal plays its written length, and a roll note grows evenly
over its whole length into its peak on the downbeat (by about 17 dB in the intro swell, 10 dB in
the 0.97 s fills). The held roll also plays at the stereo loudness of the old VCSL roll now,
1.5 dB under the bright roll's first build, so the channel is `cym` −4.2 → −2.5 dB and the intro
swell 0.55 → 0.6: every swell crests where it crested before, now on its downbeat.

Two later sampler changes weigh on the intro swell. The accordion's two takes now start together,
so its held G5 under the crest is about 4 dB stronger at its 4th harmonic (3.2 kHz) in the mono
mix; and a roll longer than the recorded crescendo (1.53 s) ends in the crescendo's own last 0.2 s,
as every shorter roll does, which carry less at 3.2 kHz and more at 500 Hz than the held peak it
ended on before. The intro swell's velocity is 0.6 → 0.63 (+0.7 dB; the roll is one recording at
every velocity): it crests 0.7 dB above where it crested before, and its largest rise is now at
500 Hz.

Measure (scratch scripts on the full render, recorded bank, the review's method): "crest" and "on
the downbeat" = the cymbal's own level (`cym` solo, K-weighted, over the 150 ms up to that point) at
the end of its gate and at the written downbeat; "rise" = the largest third-octave rise of the mix
over the mix without `cym` (bands 63 Hz–12.5 kHz within 40 dB of the window's loudest) in the last
150 ms before the downbeat; "cover" = how much the cymbal raises the momentary (400 ms, K-weighted)
loudness there; "cymbal" / "lead" = their own momentary loudness against the mix.

| Swell | Crest, before → now | On the downbeat, before → now | Rise | Cover | Cymbal vs mix | Lead vs mix |
|---|---|---|---|---|---|---|
| intro, bars 1–2 (0.00 s, 1.94 s) | −27.3 → −26.6 dB | −29.5 → **−26.6 dB** | **+9.8 dB** at 500 Hz | 0.36 LU | −11.1 LU | `acc` −0.8 LU |
| verse fill, bar 21 (19.36 s, 0.97 s) | −29.8 → −29.8 dB | −29.7 → **−29.8 dB** | **+13.4 dB** at 4 kHz | 0.21 LU | −13.5 LU | −20.8 LU (the tune rests) |
| middle fill, bar 55 (52.26 s, 0.97 s) | −27.3 → −27.3 dB | −27.2 → **−27.3 dB** | **+9.6 dB** at 4 kHz | 0.39 LU | −10.5 LU | −10.2 LU (the refrain's pickup) |

The intro swell now grows steadily, about 10 dB/s, from −44.1 dB 0.15 s in to −26.6 dB on the
downbeat; before, it grew from −36 to −28 dB over its first 0.9 s and then held. Every swell rises
9.6–13.4 dB in its band in the last 150 ms before its downbeat, is at its loudest there, crests
under the tune (in the intro the accordion stays 10.3 LU above it) and adds at most 0.39 LU to the
mix. Melody channels are untouched; the nine compare.py proofs above give the same results. Render
after the change: the measurement table above.

## Notes

- `TAMB` (the tambourine hit map, variants 0/1 hit, 2/3 shake, 4/5 accent, 6/7 roll) stays
  exported with the same semantics: earlier versions of other tracks imported it, and keeping it
  costs nothing. The old title theme's exports (`THEME_1`, `THEME_2`, `CHORDS_A`) were removed;
  no song imports anything but `title` from this file any more.
- `node scripts/music/selftest/formcheck.mjs` passes for this track (2876 events, 5 form entries,
  loop from "verse", bars 4–71).
