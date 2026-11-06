# `title`: "Funiculì, Funiculà" (main theme)

| | |
|---|---|
| Piece | "Funiculì, Funiculà", Neapolitan song |
| Composer | Luigi Denza (music), Peppino Turco (words) |
| Year | 1880 (written for the opening of the Vesuvius funicular) |
| Public domain | Yes: Denza died in 1922, Turco in 1903; the 1880 publication is out of copyright everywhere. The arrangement is new; only the melody, its printed harmony and bass are taken from the sources below. |
| Track | `src/audio/songs/title.ts`, export `title`, id `title`: title screen and attract mode, looping |
| Key / meter / tempo | F major, 6/8, dotted quarter = 124 (`bpm: 124`, `stepsPerBeat: 3`, `barSteps: 6`, one step = an eighth) |
| Length | 68.7 s of music (71 bars); intro 2.9 s, loop body 65.8 s (bars 4–71); rendered buffer 72.7 s including the 4 s seam pad |

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
```

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
| `verse` | 4–21 | 2.90–20.32 | 2–18 + fill | Accordion lead; upright-bass oom-pah, nylon-guitar oom-pa-pa, light mandolin off-beat chops, tambourine. 2nd phrase: accordion chords, clarinet in thirds/sixths, mandolin tremolo shimmer an octave up on the long notes. Bar 18: snare and timpani rolls, cymbal swell, castanet roll, bass walk E–D–D♭ into C |
| `refrain` | 22–37 | 20.32–35.81 | 38–53 (+19 pickup) | Full band. Stop-time "JAM-mo!" hits (bass, chords, trombones, bass drum) with a clarinet echo and castanets in the gaps; accordion in the printed thirds plus an octave-lower accordion, mandolin tremolo on the long notes; "funiculì, funiculà" over the chromatic bass F–E–D–C♯–D with trombone punches and trumpet accents on "lì / là", a rising clarinet inner line; glockenspiel on the long notes; crash on the downbeat and on the climax "là!"; button, then the mandolin pickup alone |
| `middle` | 38–55 | 35.81–53.23 | 20–37 | Contrast: A minor, mandolin tremolo lead, guitar arpeggios, pizzicato off-beats, castanets, staccato bassoon answers. C-major half: accordion thirds under the mandolin, accordion chords, string-pad crescendo, clarinet answers. Bar 18: snare/timpani rolls, cymbal swell, trombone C7 swell, xylophone run up |
| `refrain2` | 56–71 | 53.23–68.71 | 38–53 ornamented | As `refrain`, bigger: trumpet doubles the "Jammo, jammo" call, tuba joins the bass, string pad, louder bass drum, a third crash on the final button; the last bar carries the verse pickup |

`loopFrom: 1` (the verse). The loop window is 2.903 → 68.710 s. The verse pickup is in the last
bar of both the intro and `refrain2`, so the melody runs straight across the seam.

## Harmony and bass

- **Verse** (wf / session book: F, with C7 under "and so do"): `F | F C7 | F B♭ | F | F C7 | F | F C7 | F | F C7`.
  Two passing chords are added where the melody holds a dotted quarter that is not in the F
  chord: C7 under "E5 E5" (ref bars 3/12, beat 2) and B♭ under "D5 D5" (ref bars 4/13, beat 2).
  The pickup bars turn around on C7. In the bars where the melody anticipates the next tonic on
  the last eighth (ref bars 6, 8, 15, 17), the off-beat chord on that eighth is left out, so the
  anticipated F does not rub against the E of C7.
- **Middle** (wf: Am / E7, C / G7): with E7/G♯, Am/G and G7/B bass inversions.
- **Refrain** (wf chords + bb V:2 bass): C7 pedal for "Jammo, jammo". In ref bars 40/44 it is
  B♭/C (IV over the dominant pedal, as the printed thirds and the session book's "(C)" show), with
  C7 under the passing E5. Then `F | A7/E | Dm | A7/C♯ | Dm`, the printed chromatic bass, then
  `C7/B♭ → B♭` (ref 50, V4/2 → IV as printed), `F/C → C7` (cadential 6/4, ref 51–52), `F`.
- The `pad`/`comp` voicings are close-position left-hand voicings (e.g. C7 = E3–B♭3–C4). A scratch
  clash scan over all pitched channels found no semitone or minor-ninth clash of 0.12 s or more.

## Instrumentation

| Channel | Instrument id | Role | Range used |
|---|---|---|---|
| `acc` | `accordion` | lead (verse, refrains; printed thirds in the refrain), intro flourish | C4–G5 (+A5 trill) |
| `accLo` | `accordionDry` | refrain melody an octave lower (the accordion's 16′ "bassoon" reed: the right hand stays at F4–G5); thirds under the mandolin in the middle | F3–G4, B3–B4 |
| `accC` | `accChord` | left-hand chord stabs (oom-pa-pa, stop-time hits) | E3–E4 |
| `mand` | `mandolin` | tremolo doubling in the refrains, lead in the middle, shimmer in the verse | E4–F6 |
| `mandC` | `mandolin` | light off-beat chops in the first verse phrase | C4–A4 |
| `gtr` | `guitar` | strummed oom-pa-pa, arpeggios in the middle | A2–F4 |
| `clar` | `clarinet` | verse thirds, refrain echoes, run and chromatic inner line, middle answers | A3–G5 |
| `bsn` | `bassoon` | staccato comic answers (A-minor half of the middle) | A3–E4 |
| `tpt` | `trumpet` | intro stab, accents on "lì / là", refrain2 call doubling | F4–G5 |
| `tbn` | `trombone` | intro stab, stop-time hits, punches, swell into refrain2 | C3–D4 |
| `bass` | `uprightBass` | oom-pah bass, printed refrain bass | G1–A2 |
| `tuba` | `tuba` | refrain2 bass doubling | B♭1–F2 |
| `pizz` | `pizz` | off-beats in the middle | E3–C4 |
| `str` | `strings` | pad: middle crescendo, refrain2 | G3–F4 |
| `glock` | `glock` | sparkle on the refrain's long notes | E6–F6 |
| `xylo` | `xylophone` | cartoon run into refrain2 | C5–G6 |
| `tamb`, `cast` | `tamb`, `castanets` | tambourine (hits, shakes, rolls) and castanet patterns, rolls into downbeats | — |
| `kick`, `snare`, `crash`, `cym`, `timp` | `kick`, `snare`, `crash`, `cymbal`, `timpani` | orchestral bass drum, snare rolls, clash cymbals on downbeats, suspended-cymbal swells (variant 1 = roll), timpani rolls on C | timpani C2, F2 |

**Why F major:** the reference is in E♭. One tone up puts the melody at E4–G5, the accordion's
best register: the top note G5 is a recorded zone, so it needs no pitch shift. F is also
friendlier to mandolin and guitar, brighter than E♭, and lets the octave-lower accordion stay
inside the sample range. G major would push the octave doubling and the mandolin shimmer too high.

## Render measurements (recorded sample bank)

`node scripts/music/render-song.mjs title out.wav` (header: `instruments: recorded samples (53 sets …)`):

| Measure | Value | Target |
|---|---|---|
| Loop body integrated loudness | **−16.4 LUFS** (whole file −16.5) | −16.4 ± 0.5 |
| Short-term max | −13.9 LUFS | |
| Sample peak | **−2.93 dBFS** | < −1 dBFS |
| Soft clipper | 30 samples (0.000 %) | ~0 % |
| Loop seam mismatch | **−138.5 dBFS** (no jump) | seamless |
| Spectral balance | < 250 Hz −7.4 dB, 250 Hz–4 kHz −1.0 dB, > 4 kHz −15.7 dB | in line with the other tracks |
| Warnings | none (no skipped channels, no sequencer warnings) | |
| `gainDb` | −1.5 | |

The lead channel against the mix over the loop body is `acc` −1.2 LU. Per section (scratch
analysis: section LUFS of the mix, and the lead's solo loudness against it):

| Section | Mix LUFS | Lead vs mix |
|---|---|---|
| intro | −18.1 | `acc` −1.1 LU |
| verse | −17.8 | `acc` −1.3 LU |
| refrain | −15.7 | `acc` −2.0 LU (`mand` −8.9, `accLo` −12.5) |
| middle | −18.5 | `mand` −1.3 LU |
| refrain2 | −14.4 | `acc` −1.8 LU |

**In the browser:** `window.__at.samplerTrack('title')` on `audiotest.html` (Chromium, Vite dev
server) decodes the MP3 sprites with the browser's decoder, installs them in the music worker and
renders the track there. The result has the same length as the Node render and nulls against it
to −90 dBFS peak (−111 dBFS RMS). Peak −2.93 dBFS and −16.5 LUFS whole-file (ffmpeg `ebur128`)
in both; the bank loads 53 sets with no failures.

Bass and percussion against the section mix: upright bass −8 to −14 LU, tambourine −16 to −22,
castanets −17 to −24, bass drum about −16. Sparse accents (glockenspiel, xylophone run, crash,
cymbal swells) measure −10 to −30 LU while they play. Every channel is audible: render-song
flags none as inaudible.

## Notes

- `TAMB` (the tambourine hit map, variants 0/1 hit, 2/3 shake, 4/5 accent, 6/7 roll) stays
  exported with the same semantics: earlier versions of other tracks imported it, and keeping it
  costs nothing. The old title theme's exports (`THEME_1`, `THEME_2`, `CHORDS_A`) were removed;
  no song imports anything but `title` from this file any more.
- `node scripts/music/selftest/formcheck.mjs` passes for this track (2872 events, 5 form entries,
  loop from "verse", bars 4–71).
