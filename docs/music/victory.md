# `victory` — the Aida trumpets (Triumphal March)

The victory screen after a won stage: a timpani and cymbal roll, then Verdi's famous Aida trumpet
theme played once, complete, by unison trumpets over a cartoon orchestra-meets-street band
(tuba and pizzicato "oom", string after-beats, snare, horns, violins in octaves, bass drum and
piatti). The tutti lands on a big A♭ chord with a crash, and a cheeky band tag follows: the accordion
mocks the trumpets' triplet, the castanets rattle, and a V7–I "button" closes it. Then the band
relaxes into a soft 3-bar bed that loops under the results screen.

Song file: [`src/audio/songs/victory.ts`](../../src/audio/songs/victory.ts).

## The piece

| | |
|---|---|
| Piece | "Marcia trionfale" (the Triumphal March of the Act II finale, "Gloria all'Egitto"): the theme of the Egyptian ("Aida") trumpets |
| Composer | Giuseppe Verdi (1813–1901) |
| Work | *Aida*, premiered 24 December 1871 at the Khedivial Opera House, Cairo (Italian premiere: La Scala, 8 February 1872); published by Ricordi |
| Status | Public domain: the composer died in 1901 and the work was published in the 1870s. The ABC transcription is reference only and is not committed; the melody was written into the DSL from it and verified with `compare.py`. |

## How the game plays it

`src/main.ts` `finishRun(true)` calls `audio.playMusic('victory', { fade: 0.3, restart: true })`
when the results screen opens ("Vittoria!"). The screen stays until the player clicks
"Ancora" or "Menu", so the track is **loopable**: the fanfare plays once and the soft tail loops
(`loopFrom` = the `tail` section) for as long as the results stay up. `startRun` preloads
`victory` at the start of every run. The first sound (the timpani roll) is at 0.002 s.

## Reference and melody proof

Reference (grade B in [`REFERENCES.md`](REFERENCES.md), single source): `wf_aida_march.abc`, a lead
sheet in G with chord symbols, 4/4. Bars 1–12 hold the famous trumpet theme: the pickup D in bar 1,
then a (2–4), b (5–7, half cadence), a (8–10) and b′ (11–12, full cadence onto bar 13's G).

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/wf_aida_march.abc --text                     # bar numbers + chords
$PY scripts/music/abc2notes.py $REFS/wf_aida_march.abc --bars 1-13 --dsl 0.25     # 16th-note DSL string
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 1-12 --song victory --channel tpt --section march
```

| Comparison (default thresholds, no `--allow-bars`, no `--resync`) | Pitch | Rhythm | Broken bars | Result |
|---|---|---|---|---|
| **trumpet theme, ref. bars 1–12** (the REFERENCES.md command above) | 100 % (60/60) | 100 % (60/60) | none | **PASS** (exit 0) |
| same, without `--ref-bars` (locate) | 100 % | 100 % | none | PASS, located at bars 1..12 |
| trumpet + brass section together (`--channel tpt,tptS`), bars 1–12 | 100 % | 100 % | none | PASS |
| violins' octave doubling of a′ b′ (`--channel str,vlnM --bars 8-12` vs ref. bars 8–12) | 100 % (27/27) | 100 % | none | PASS (+13 semitones: A♭ and an octave up) |
| second a phrase (`--bars 8-10` vs ref. bars 2–4) | 100 % (13/13) | 100 % | none | PASS |

- One statement of the theme, no liberties: every note, the triplet pickups (written `4/3` steps at
  4 steps per beat) and the dotted-16th figures are as in the reference. The theme's last note (the
  A♭ on bar 13's downbeat) is the first note of the `fin` section: it is the tutti final chord.
  REFERENCES.md compares bars 1–12, so this note is outside the scored passage. Bar 13 of the
  reference continues with the middle phrase's pickup (G–D–G), which the track does not play.
- Key: **A♭ major**, a semitone above the reference (compare.py: "candidate = reference +1").
  A♭ is Verdi's key for the first trumpet statement in the opera (the reprise moves up to B, the
  "lift" that the reference writes as G → B♭). It is also a natural key for B♭ trumpets, which
  play the tune in their bright middle register, E♭4–D♭5.
- Restatements: none. The track plays the theme once. In the tag, the accordion quotes the
  triplet figure (B♭–E♭–B♭, an octave above the trumpets) as a joke, not as a restatement.

## Key, tempo and length

4/4, **♩ = 154**, 4 steps per beat (16ths; triplet eighths are `4/3` steps). The oom-pah moves in
half notes, so it feels like an alla-breve march at 77 half notes a minute: brisk and bandistic, the
"banda" playing Verdi slightly too fast, while timpani, crashes and accents keep it pompous.

The tempo follows from the length target (15–25 s) and two hard constraints:

- the whole theme must be played (melody fidelity): reference bars 1–12, the pickup bar included,
  plus the final chord/tag bar, so **13 bars before the loop**;
- the renderer pads the loop with `LOOP_PAD` = 4 s of the loop body (`src/audio/render.ts`), so a
  **loop body shorter than 4 s cannot loop seamlessly**. At this tempo that means 3 bars (4.675 s).

16 bars in at most 25 s needs ♩ ≥ 153.6. At ♩ = 154 the music is **24.94 s** (fanfare 20.26 s +
loop body 4.675 s). The rendered buffer is 28.94 s, because it adds the 4 s seam pad.

## Form

`node scripts/music/export-song.mjs victory --form` (no sequencer warnings):

| Section | Song bars | Time | Ref. bars | Content |
|---|---|---|---|---|
| `march` | 1 | 0.00–1.56 s | 1 | Timpani roll on E♭2 (23 strokes, ≈15/s, crescendo), suspended-cymbal swell, trumpets' pickup E♭4 (accented) at 1.17 s |
| | 2–4 | 1.56–6.23 s | 2–4 (a) | Downbeat crash + bass drum + timpani A♭2. Trumpets (+ brass section in unison) over tuba/pizz "oom" on 1 and 3, string after-beats on 2 and 4, snare after-beats doubling the triplet pickups. Castanets answer in the trumpets' rest (bar 4, beat 4). |
| | 5–7 | 6.23–10.91 s | 5–7 (b) | Trumpets a shade lighter; horn section enters (three legato voices); chord per beat in bar 6 (A♭ E♭ Cm Fm: tuba walks A♭–G–C–F); bar 7 B♭7 → E♭7sus4 → E♭ half cadence with a timpani roll and cymbal swell |
| | 8–10 | 10.91–15.58 s | 8–10 (a) | Tutti: big crash, violins double the tune an octave up (sustain + marcato layers), bass drum on 1 and 3 with soft piatti, timpani on 1 and 3. Castanets answer again in bar 10. |
| | 11–12 | 15.58–18.70 s | 11–12 (b′) | Full cadence; bar 12 beats 3–4: timpani roll, cymbal swell and a 16th snare build |
| `fin` | 13 | 18.70–20.26 s | 13 (beat 1) | Tutti A♭ chord (trumpets end on A♭4; crash, bass drum, timpani, glockenspiel sparkle). The tag: castanet "trrr" (19.19 s), the accordion's triplet B♭5–E♭5–B♭5 with castanets (19.48 s), then the button D♭5+G5 → C5+A♭5 (19.87 / 20.07 s) with string stabs, pizzicato, timpani and castanets |
| `tail` (loop) | 14–16 | 20.26–24.94 s | — | The band at rest: accordion right hand on the guide tones C5 (E♭5) – D♭5 B♭4 – C5 D♭5 (→ C5 across the seam), upright bass "oom" + accordion chord buttons "pah", strings pad, horn line A♭3 – F3 G3 – A♭3 G3, castanets on the off-beats with a 16th pickup back into the loop |

Playback: 0 → 28.935 s, then the window 24.260 → 28.935 s repeats (the loop body, 4.675 s,
bars 14–16).

### Harmony

The march uses the reference's chord symbols, transposed G → A♭:

| Bar | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Chords | (A♭) | A♭ · · E♭7 | A♭ | E♭7 · A♭ · | E♭7 · A♭ E♭ | A♭ E♭ Cm Fm | B♭7 · E♭7sus4 E♭ | A♭ · · E♭7 | A♭ | E♭7 · A♭ · | E♭7 · A♭ E♭ | A♭ E♭ Cm E♭7 | A♭ |
| Bass | roll E♭ | A♭ E♭ | A♭ C | E♭ A♭ | E♭ A♭ E♭ | A♭ G C F | B♭ E♭ | A♭ E♭ | A♭ C | E♭ A♭ | E♭ A♭ E♭ | A♭ G C E♭ | A♭ |

- Bars 6–7 and 12 are the circle of fifths of the original (vi–ii–V/V–V and vi–V7–I). The bass
  walks one note per beat there, and the after-beats become one chord per beat. Elsewhere the
  "oom" is root–fifth on beats 1 and 3, except that it walks A♭–C–E♭ from bar 3 (and 9) into the
  E♭7 bar, and takes the reference's beat-4 E♭ in bars 5 and 11.
- The trumpets hold C (the 13th) over E♭7 in bars 4, 5, 10 and 11, and C resolves to B♭. The
  after-beats and the horns leave the 7th (D♭) out under that C, so there is no minor 9th between
  the parts. The 7th appears where it resolves: E♭7 on beat 4 of bars 2, 8 and 12, with D♭ → C into
  the next A♭.
- Bar 7: the horns move B♭7 (F A♭ D) → E♭7sus4 (E♭ A♭ D♭) → E♭ (E♭ G B♭), so the sus4 A♭ falls to
  G under the trumpets' F → G.
- Tail: A♭ | D♭ E♭7 | A♭ E♭7 (I | IV V7 | I V7). The loop ends on V7 and restarts on I.
- **Sonority scan** (`export-song` events, every onset, all pitched channels): of 86 vertical
  slices, two hold a semitone pair, and both are non-chord tones of the tune itself: the D♭ passing
  note of the "C–D♭–A♭" triplet over A♭ (bar 9), and the C neighbour note of the final "B♭–C–B♭"
  triplet against the horns' resolving D♭ (bar 12).

## Instrumentation

| Channel | Instrument id | Role | Range used |
|---|---|---|---|
| `tpt` | `trumpet` | the Aida trumpet theme (lead), phrase dynamics per bar, accented pickup | E♭4–D♭5 |
| `tptS` | `brass` | the trumpet section in unison (≈7 LU under the lead); the final chord A♭4 C5 E♭5 | E♭4–E♭5 |
| `hrn` | `brassSoft` | horn section from bar 5: three legato voices with an E♭3 inner pedal | E♭3–D4 |
| `str` | `strings` | violins an octave above the tune in a′ b′ (sustain layer); final chord | A♭3–D♭6 |
| `vlnM` | `strStab` | the same octave doubling, marcato layer (the sustain samples reach 70 % only after ≈0.7 s, so the marcato layer articulates the triplets and dotted figures) | E♭5–D♭6 |
| `stab` | `strStab` | after-beats ("pah"), chord per beat in bars 6 and 12; button stabs in the tag | G3–F4 |
| `tuba` | `tuba` | "oom" on 1 and 3, walking bass in bars 6 and 12 | F1–E♭2 |
| `pizz` | `pizz` | doubles the tuba an octave up (definition); tag button | E♭2–E♭3 |
| `timp` | `timpani` | rolls (intro, bar 7, bar 12), downbeats, 1 and 3 in the tutti, final chord | E♭2, A♭2 |
| `snare` | `snare` | after-beats, triplet pickups doubled, 16th build into the final chord | — |
| `bd` | `bassDrum` | downbeats of bars 2, 5, 8, 12; 1 and 3 in the tutti; final chord and button | — |
| `crash` | `crash` | clash cymbals: bars 2 and 8, soft piatti on bars 9–11, final chord | — |
| `cym` | `cymbal` | suspended-cymbal roll swells (variant 1) into the crashes | — |
| `glock` | `glock` | sparkle on the final chord | E♭6–A♭6 |
| `acc` | `accordion` | the tag: triplet echo + V7–I button | C5–B♭5 |
| `cast` | `castanets` | the wink in the trumpets' rests (bars 4, 10), the tag's rattle, the tail's off-beats | — |
| `accR` | `accordion` | tail: right-hand guide tones | B♭4–E♭5 |
| `accC` | `accChord` | tail: chord buttons on 2 and 4 | C4–A♭4 |
| `ubass` | `uprightBass` | tail: bass on 1 and 3 | A♭1–E♭2 |
| `strT` | `strings` | tail: soft sustained chords | C4–A♭4 |
| `hrnT` | `brassSoft` | tail: a low horn line under the bed | F3–A♭3 |

Every id is a contract id with recorded samples (render-song: "recorded samples (53 sets)", no
skipped channels); `timpani` and `uprightBass` are the long aliases of `timp` and `ubass`. All
parts stay within the natural ranges of the brief.

## Levels (sample render)

`node scripts/music/render-song.mjs victory out.wav` (recorded samples, 53 sets):

```text
victory: 28.94 s @ 48000 Hz, 635 events
  loop: plays 0 → 28.935 s, then repeats 24.260 → 28.935 s (body 4.675 s = bars 14-16 from section "tail"; seam mismatch -123.4 dBFS)
  form: march@0.00s fin@18.70s tail@20.26s
  loop body: integrated -16.4 LUFS (whole file -15.2), short-term max -16.2 LUFS, RMS -19.2 dBFS, sample peak -3.27 dBFS
  soft clipper: 20 samples (0.001 %), DC -0.00000, first sound at 0.002 s
  spectral balance: <250 Hz -7.9 dB, 250 Hz-4 kHz -0.8 dB, >4 kHz -21.9 dB (share of total energy)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  cast         castanets          22     -9      -44.2   -27.7       -45.7      -16.6
  accR         accordion           6   -1.9      -20.9    -4.5       -20.9      -12.5
  accC         accChord           18   -6.2      -27.0   -10.6       -28.4      -11.3
  ubass        uprightBass         6   -2.2      -26.5   -10.0       -26.5      -10.9
  strT         strings            11   -4.7      -20.9    -4.4       -20.5      -10.4
  hrnT         brassSoft           5   -4.7      -25.5    -9.1       -25.2      -16.4
```

render-song measures the channel table over the loop window only. The 15 march and tag channels
play before the loop, so they read −inf there, and each gets a "loudest 3 s … check it is audible"
warning. These 15 warnings are the only ones, and they follow from the design. The fanfare was
measured with a scratch wrapper that makes `march` + `fin` the loop body (`{ ...victory, form:
['march', 'fin'], loopFrom: 0 }`, rendered with `render-song --file`):

```text
  loop body: integrated -14.8 LUFS, short-term max -13.7 LUFS, RMS -18.5 dBFS, sample peak -3.27 dBFS
  soft clipper: 20 samples (0.001 %)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  tpt          trumpet            61   -0.9      -16.8    -1.9       -16.1       -7.0
  tptS         brass              63   -9.5      -23.9    -9.1       -23.3       -9.9
  hrn          brassSoft          44    -11      -27.8   -13.0       -27.1      -15.7
  str          strings            31   -7.5      -27.4   -12.6       -26.4      -13.2
  stab         strStab            90   -5.5      -29.0   -14.2       -28.7      -12.0
  vlnM         strStab            27     -4      -30.7   -15.9       -30.2      -18.6
  tuba         tuba               29   -5.5      -25.6   -10.7       -24.2      -12.1
  pizz         pizz               31     -6      -32.8   -17.9       -31.7      -17.6
  timp         timpani            62   -6.5      -27.2   -12.4       -25.0       -9.7
  snare        snare              39     -7      -35.3   -20.5       -34.1      -13.5
  bd           bassDrum           12     -8      -35.0   -20.2       -34.9      -14.8
  crash        crash               6    -13      -34.5   -19.7       -36.2      -16.2
  cym          cymbal             15   -6.5      -35.8   -20.9       -35.6      -21.0
  glock        glock               2    -16      -36.1   -21.3       -42.4      -21.4
  acc          accordion           7     -6      -19.6    -4.8       -23.6       -6.7
  cast         castanets          14     -9      -36.7   -21.9       -38.9       -8.9
```

- **Loop body −16.4 LUFS** (target −16.4 ± 0.5) with `gainDb` −0.6. ffmpeg `ebur128` agrees:
  −16.4 LUFS over 24.26–28.935 s and over the first pass of the tail (20.26–24.94 s).
- **The fanfare is −14.8 LUFS**, 1.6 LU above the bed: the celebration stands out, and the bed is
  softer in texture too (no brass attacks or cymbals, little energy above 4 kHz). The bed could
  not be made much softer than the fanfare: at −16.4 LUFS for the bed, a fanfare 3 LU louder
  peaks into the soft clipper (which starts at −4.15 dBFS). Per bar, bars 2–13 run −13.7 to −16.3
  LUFS: b is the quietest (−16.3 in bar 5), and bars 8 and 12 (the tutti entry and the cadence)
  are the loudest (−13.9 / −13.7). The intro roll bar is −18.8.
- **Melody on top:** the trumpet's solo loudness is 1.9 LU under the fanfare mix (with the brass
  section in unison, the tune carries more still). The accordion leads the tag. In the bed the
  accordion's right hand (−4.5 LU) and the strings pad (−4.4 LU) are on top, with nothing above them.
- **Peaks:** sample peak −3.27 dBFS (bar 11). The soft clipper touches 20 samples (0.001 %).
  The final chord was voiced lighter (trumpet 0.92, the brass section on 3 notes, a softer
  downbeat stab and tuba) to keep it under the clipper.
- Bass and percussion: tuba −10.7 LU, timpani −12.4 LU and the bass drum (−20.2 LU, a few accents)
  sit under the tune. The snare (−20.5 LU) plays after-beats only. The castanets (−21.9 LU in the
  fanfare, −27.7 LU in the bed) are short clicks with peaks at −9 to −17 dBFS, clearly audible
  as transients even though their integrated loudness is low.

## Other checks

- **Chromium (the game's real worker):** `audiotest.html` → `__at.samplerTrack('victory')`
  decodes the 53 MP3 sprites with Chromium's decoder (0.6–1.0 s), installs them in the render
  worker and renders the track there (0.5–0.7 s). The output has the same length (1 388 884
  samples) and loop window (24.260–28.935 s), the same peak (−3.27 dBFS), and equals the Node
  render to −91 dB. There are no console errors, and the bank report is OK with no warnings.
- **Pitch** (autocorrelation on the trumpet stem): the long notes A♭4 and C5 are within −0.9 to
  +3.8 cents.
- **Rolls:** measured in 100 ms RMS windows on the solo stems, the timpani rolls rise 11–14 dB and
  the suspended-cymbal swells 25–30 dB, with no dip deeper than 2 dB. The cymbal roll velocities
  stay below 0.7, because at 0.7 and above the sampler selects the cymbal's hit layer instead of
  the roll.
- **Clicks:** a second-difference scan of the mix finds spikes only at percussion onsets
  (the 20 largest are all within 36 ms of a note onset: castanets, cymbal and bass-drum attacks).
- **Seam:** mismatch −123.4 dBFS. At the wrap point (28.935 → 24.260 s) the sample jump is 0.0017,
  against a typical sample-to-sample step of 0.0086. Nothing from the fanfare rings past the
  4 s seam pad (render.ts warns if it does; it does not).
- `node scripts/music/selftest/formcheck.mjs`: "ok victory 587 events, 3 form entries, loop from
  "tail" bars 14-16". render-song counts 635 events: the same 587 plus the 48 tail events of the
  first 4 s of the loop, which the renderer copies after the loop end (the seam pad).
- `npx tsc --noEmit` is clean for the song file.

## Changes from the previous `victory`

The old track was an original 3/4 "Brindisi" fanfare in D (one-shot, 14.9 s). It is replaced
completely. The export name, the id and the `SongDef` shape are unchanged. The new track loops
(`loopFrom` 2), so the results screen is no longer silent after the fanfare.
