# `victory` — the Aida trumpets (Triumphal March)

The victory screen after a won stage: a timpani roll and a suspended-cymbal swell, then Verdi's
famous Aida trumpet theme played once, complete, by unison trumpets over a cartoon
orchestra-meets-street band (tuba and pizzicato "oom", string after-beats, snare, horns, violins in
octaves, bass drum and piatti). The tutti lands on a big A♭ chord with a crash, and a cheeky band
tag follows: the accordion mocks the trumpets' triplet with the castanets, and a V7–I "button"
with a glockenspiel "ti-ting" closes it. Then the band relaxes into a soft bed that loops under the
results screen, where the accordion keeps humming the theme's opening phrase.

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
| tail quote (`--channel accR --section tail` vs ref. bars 2–4) | the 13 phrase notes all match; 92.9 % (13/14) with the pickup | 92.9 % | none | restatement, see below |

- One statement of the theme, no liberties: every note, the triplet pickups (written `4/3` steps at
  4 steps per beat) and the dotted-16th figures are as in the reference. The theme's last note (the
  A♭ on bar 13's downbeat) is the first note of the `fin` section: it is the tutti final chord.
  REFERENCES.md compares bars 1–12, so this note is outside the scored passage. Bar 13 of the
  reference continues with the middle phrase's pickup (G–D–G), which the track does not play.
- Key: **A♭ major**, a semitone above the reference (compare.py: "candidate = reference +1").
  A♭ is Verdi's key for the first trumpet statement in the opera (the reprise moves up to B, the
  "lift" that the reference writes as G → B♭). It is also a natural key for B♭ trumpets, which
  play the tune in their bright middle register, E♭4–D♭5.
- **Restatement (tail, loop):** the accordion plays the a phrase again, softly, as the loop. All 13
  notes of reference bars 2–4 match in pitch and rhythm. The one extra note that compare.py lists
  (`extra: cand D4 (1q)` on beat 4 of the tail's bar 3, where the reference has a rest) is the
  theme's own pickup: E♭ (D in the reference's G), which stands at bar 1 beat 4 in the reference.
  In the loop it comes back before each A♭, so every pass sounds as "E♭ | A♭ — B♭-E♭-B♭ |
  C C C C-D♭-A♭ | C. B♭ A♭", which is reference bars 1–4. compare.py cannot score a phrase that
  wraps around the loop seam, so this restatement is stated here rather than run as a PASS check
  (the brief requires a PASS only for the first statement).
- The tag's accordion triplet (B♭–E♭–B♭, an octave above the trumpets) quotes the triplet figure as
  a joke. It is not a restatement.

## Key, tempo and length

4/4, **♩ = 154**, 4 steps per beat (16ths; triplet eighths are `4/3` steps). The oom-pah moves in
half notes, so it feels like an alla-breve march at 77 half notes a minute: brisk and bandistic, the
"banda" playing Verdi slightly too fast, while timpani, crashes and accents keep it pompous.

The tempo and the loop length follow from the length target (**15–25 s total**, track brief) and
two hard constraints:

- the whole theme must be played (melody fidelity): reference bars 1–12, the pickup bar included,
  plus the final chord/tag bar, so **13 bars before the loop**;
- the renderer pads the loop with `LOOP_PAD` = 4 s of the loop body (`src/audio/render.ts`), so a
  **loop body shorter than 4 s cannot loop seamlessly**. At this tempo that means 3 bars (4.675 s).

16 bars in at most 25 s needs ♩ ≥ 153.6. At ♩ = 154 the music is **24.94 s** (fanfare 20.26 s +
loop body 4.675 s). The rendered buffer is 28.94 s, because it adds the 4 s seam pad.

**Why the loop is 3 bars, and why that is now Verdi's period.** A 4-bar loop would need 17 bars:
26.5 s at ♩ = 154 (over the 25 s cap), or ♩ ≥ 163.2 to stay under it (too rushed for this march).
So the loop stays at 3 bars, and it now carries the theme's a phrase, which is itself 3 bars long
in Verdi's tune (a = bars 2–4 with the pickup in bar 1, b = bars 5–7). Each pass is one complete
phrase with its own pickup, so the 4.7 s period is the tune's phrase length rather than an
arbitrary one. If the lead decides that the 25 s cap need not include the loop body, a 6-bar tail
(a + b, 9.35 s, 29.6 s in total) would be the next step up. It is not implemented here because it
breaks the stated cap.

## Form

`node scripts/music/export-song.mjs victory --form` (no sequencer warnings):

| Section | Song bars | Time | Ref. bars | Content |
|---|---|---|---|---|
| `march` | 1 | 0.00–1.56 s | 1 | Timpani roll on E♭2 (23 strokes, ≈15/s, crescendo) with a suspended-cymbal swell (one roll note, 0.19–1.56 s); trumpets' pickup E♭4 (accented) at 1.17 s |
| | 2–4 | 1.56–6.23 s | 2–4 (a) | Downbeat crash + bass drum + timpani A♭2. Trumpets (+ brass section in unison) over tuba/pizz "oom" on 1 and 3, string after-beats on 2 and 4, snare after-beats doubling the triplet pickups. Castanets answer in the trumpets' rest (bar 4, beat 4). |
| | 5–7 | 6.23–10.91 s | 5–7 (b) | Trumpets a shade lighter; horn section enters (three legato voices, E♭3 inner pedal); chord per beat in bar 6 (A♭ E♭ Cm Fm: tuba walks A♭–G–C–F); bar 7 B♭7 → E♭7sus4 → E♭ half cadence with a timpani roll and a cymbal swell (beats 3–4, 10.13–10.91 s) |
| | 8–10 | 10.91–15.58 s | 8–10 (a) | Tutti: big crash, violins double the tune an octave up (sustain + marcato layers) while the brass section steps back 3.5 dB, bass drum on 1 and 3 with soft piatti, timpani on 1 and 3; the horns' pedal is re-tongued at bars 8 and 10. Castanets answer again in bar 10. |
| | 11–12 | 15.58–18.70 s | 11–12 (b′) | Full cadence (horn pedal re-tongued at bars 11 and 12); bar 12: cymbal swell from beat 2 (17.53–18.70 s), timpani roll and a 16th snare build on beats 3–4 |
| `fin` | 13 | 18.70–20.26 s | 13 (beat 1) | Tutti A♭ chord (trumpets end on A♭4; crash, bass drum, timpani). The tag: castanet "trrr" (19.19 s), the accordion's triplet B♭5–E♭5–B♭5 with castanets (19.48 s), then the button D♭5+G5 → C5+A♭5 (19.87 / 20.07 s) with the glockenspiel an octave up (G6 → A♭6), string stabs, pizzicato, timpani and castanets |
| `tail` (loop) | 14–16 | 20.26–24.94 s | 2–4 with the bar-1 pickup | The band at rest: the accordion hums the a phrase (A♭4 — B♭-E♭-B♭ / C C C C-D♭-A♭ / C. B♭ A♭, and the pickup E♭4 on the last beat at 24.55 s), upright bass "oom" + accordion chord buttons "pah" (the march's after-beat voicings of the same bars), a low horn line E♭3–D♭3 / C3 / E♭3–C3, a soft 2-voice string halo above the tune (E♭5 held, A♭5–G5), castanets on the off-beats with a 16th pickup back into the loop |

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
- Tail: the reference's chords of the a phrase, A♭ · · E♭7 | A♭ | E♭7 · A♭ · (bass A♭ E♭ | A♭ C |
  E♭ A♭). The chord buttons use the march's after-beat voicings of bars 2–4, so the E♭7 under the
  tune's C again leaves out D♭. The horn line moves 5th → 7th → 3rd (E♭3 → D♭3 → C3), then
  E♭3 → C3 in the last bar; the strings hold E♭5 with A♭5 → G5 → A♭5 above. The loop ends on A♭
  with the pickup E♭ and restarts on A♭.
- **Sonority scan** (`export-song` events, every onset, all pitched channels): of 91 vertical
  slices, three hold a semitone pair, and all three are non-chord tones of the tune itself: the D♭
  passing note of the "C–D♭–A♭" triplet over A♭ (bar 9, and the same passing note in the tail
  quote, bar 15, over the horn's C3), and the C neighbour note of the final "B♭–C–B♭" triplet
  against the horns' resolving D♭ (bar 12).

## Instrumentation

| Channel | Instrument id | Role | Range used |
|---|---|---|---|
| `tpt` | `trumpet` | the Aida trumpet theme (lead), phrase dynamics per bar, accented pickup | E♭4–D♭5 |
| `tptS` | `brass` | the trumpet section in unison (bars 1–7 at 0.8 × the lead's velocity, a′ b′ at 0.62 ×, where the violins take over the doubling); the final chord A♭4 C5 E♭5 | E♭4–E♭5 |
| `hrn` | `brassSoft` | horn section from bar 5: three legato voices; the E♭3 inner pedal is re-tongued at bar 7 beat 3 and at bars 8, 10, 11 and 12 (longest breath 3.1 s, bars 8–9) | E♭3–D4 |
| `str` | `strings` | violins an octave above the tune in a′ b′ (sustain layer, velocity 0.86); final chord | A♭3–D♭6 |
| `vlnM` | `strStab` | the same octave doubling, marcato layer (velocity 0.84; the sustain samples reach 70 % only after ≈0.7 s, so the marcato layer articulates the triplets and dotted figures) | E♭5–D♭6 |
| `stab` | `strStab` | after-beats ("pah"), chord per beat in bars 6 and 12; button stabs in the tag | G3–F4 |
| `tuba` | `tuba` | "oom" on 1 and 3, walking bass in bars 6 and 12 | F1–E♭2 |
| `pizz` | `pizz` | doubles the tuba an octave up (definition); tag button | E♭2–E♭3 |
| `timp` | `timpani` | rolls (intro, bar 7, bar 12), downbeats, 1 and 3 in the tutti, final chord | E♭2, A♭2 |
| `snare` | `snare` | after-beats and triplet pickups at 0.65–0.77 (the set's layer 2, which has the snares' crack), 16th build 0.6 → 0.88 (layers 1 → 3) into the final chord | — |
| `bd` | `bassDrum` | downbeats of bars 2, 5, 8, 12; 1 and 3 in the tutti; final chord and button | — |
| `crash` | `crash` | clash cymbals: bars 2 and 8, soft piatti on bars 9–11, final chord | — |
| `cym` | `cymbal` | suspended-cymbal swells into the crashes: **one** roll note each (variant 1), the recorded roll does the crescendo; velocity 0.42 / 0.66 / 0.60 (< 0.7 keeps the roll layer) | — |
| `glock` | `glock` | "ti-ting" on the tag's button, doubling the accordion's top line an octave up | G6–A♭6 |
| `acc` | `accordion` | the tag: triplet echo + V7–I button | C5–B♭5 |
| `cast` | `castanets` | the wink in the trumpets' rests (bars 4, 10), the tag's rattle and triplet, the tail's off-beats | — |
| `accR` | `accordion` | tail: the theme's a phrase (soft lead) | E♭4–D♭5 |
| `accC` | `accChord` | tail: chord buttons on 2 and 4 | G3–E♭4 |
| `ubass` | `uprightBass` | tail: bass on 1 and 3 | A♭1–E♭2 |
| `strT` | `strings` | tail: soft 2-voice halo above the tune, clear of the chord buttons | E♭5–A♭5 |
| `hrnT` | `brassSoft` | tail: a low horn line under the bed | C3–E♭3 |

Every id is a contract id with recorded samples (render-song: "recorded samples (53 sets)", no
skipped channels); `timpani` and `uprightBass` are the long aliases of `timp` and `ubass`. All
parts stay within the natural ranges of the brief.

## Levels (sample render)

`node scripts/music/render-song.mjs victory out.wav` (recorded samples, 53 sets):

```text
victory: 28.94 s @ 48000 Hz, 630 events
  loop: plays 0 → 28.935 s, then repeats 24.260 → 28.935 s (body 4.675 s = bars 14-16 from section "tail"; seam mismatch -127.6 dBFS)
  form: march@0.00s fin@18.70s tail@20.26s
  loop body: integrated -16.4 LUFS (whole file -15.5), short-term max -16.3 LUFS, RMS -19.3 dBFS, sample peak -2.44 dBFS
  soft clipper: 73 samples (0.003 %), DC -0.00000, first sound at 0.002 s
  spectral balance: <250 Hz -6.7 dB, 250 Hz-4 kHz -1.1 dB, >4 kHz -19.5 dB (share of total energy)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  cast         castanets          22     -9      -41.4   -25.0       -42.9      -14.0
  accR         accordion          14    0.9      -18.7    -2.3       -18.5       -9.0
  accC         accChord           18   -3.5      -25.3    -8.9       -26.8       -8.5
  ubass        uprightBass         6   -0.7      -25.8    -9.4       -25.8      -10.4
  strT         strings             6   -8.5      -26.7   -10.2       -26.4      -17.0
  hrnT         brassSoft           5   -3.2      -26.3    -9.9       -26.0      -16.1
```

render-song measures the channel table over the loop window only. The 15 march and tag channels
play before the loop, so they read −inf there, and each gets a "loudest 3 s … check it is audible"
warning. These 15 warnings are the only ones, and they follow from the design. The fanfare was
measured with a scratch wrapper that makes `march` + `fin` the loop body (`{ ...victory, form:
['march', 'fin'], loopFrom: 0 }`, rendered with `render-song --file`):

```text
  loop body: integrated -15.1 LUFS, short-term max -13.6 LUFS, RMS -18.8 dBFS, sample peak -2.44 dBFS
  soft clipper: 75 samples (0.003 %)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  tpt          trumpet            61   -0.9      -17.4    -2.2       -16.7       -7.6
  tptS         brass              63   -9.5      -25.7   -10.5       -24.1      -10.5
  hrn          brassSoft          48    -11      -28.6   -13.4       -28.1      -16.3
  str          strings            31   -7.5      -24.1    -9.0       -23.3      -12.5
  stab         strStab            90   -5.5      -29.6   -14.5       -29.2      -12.6
  vlnM         strStab            27     -4      -26.7   -11.5       -26.1      -14.7
  tuba         tuba               29   -5.5      -26.2   -11.0       -24.9      -12.6
  pizz         pizz               31     -6      -33.4   -18.2       -32.3      -18.2
  timp         timpani            62   -6.5      -27.8   -12.7       -25.7       -9.8
  snare        snare              37     -7      -30.9   -15.8       -29.4      -10.2
  bd           bassDrum           12     -8      -35.6   -20.5       -35.5      -15.4
  crash        crash               6    -13      -35.1   -19.9       -36.8      -16.8
  cym          cymbal              3      3      -24.8    -9.6       -24.6       -8.6
  glock        glock               2     -9      -31.4   -16.2       -36.1      -17.0
  acc          accordion           7     -6      -20.7    -5.5       -24.6       -8.3
  cast         castanets          14     -9      -37.3   -22.1       -39.5       -9.5
```

- **Loop body −16.4 LUFS** (target −16.4 ± 0.5) with `gainDb` −1.2.
- **The fanfare is −15.1 LUFS**, 1.3 LU above the bed: the celebration stands out, and the bed is
  softer in texture too (no brass attacks or cymbals, little energy above 4 kHz). Per bar
  (ungated), bars 2–13 run −13.5 to −16.9 LUFS: b is the quietest (bar 5), and bars 8 and 12 (the
  tutti entry and the cadence) are the loudest (−14.0 / −13.5). The intro bar is −20.8.
- **Melody on top:** over the fanfare the trumpet's solo loudness is 2.2 LU under the mix (1.8 LU
  in bars 2–7). In a′ b′ (bars 8–12) the violins double the tune an octave up: the trumpet alone
  reads −2.6 LU there, and the tune's carriers together (trumpet + violins) −1.5 LU. The accordion
  leads the tag. In the bed the accordion's a phrase is −2.3 LU, and every other part is at
  −8.9 LU or lower.
- **Peaks:** sample peak −2.44 dBFS. The soft clipper (which starts at −4.15 dBFS) touches 73
  samples (0.003 %), in about ten short groups. The largest are in the cadence (bar 12 beats 3–4:
  the top of the cymbal swell plus the trumpets' last triplet and the snare build); the others are
  single trumpet peaks. The bar-12 swell (velocity 0.60 over 12 steps) is the compromise between
  audibility and clipping: at 0.66 over 12 steps the clipper touched 124 samples.
- Bass and percussion: tuba −11.0 LU, timpani −12.7 LU and the bass drum (−20.5 LU, a few accents)
  sit under the tune. The snare (−15.8 LU) plays after-beats, triplets and the build. The cymbal
  reads −9.6 LU because its three swells are long notes whose energy sits at 250 Hz–1 kHz.

## Review fixes (measured on 16-bit stems of sample renders)

Before = the snapshot in commit aeb18e2, after = this version. Both were rendered with the same
scratch stem tool (`renderSong` with `solo` per channel, recorded bank) and analysed the same way.
"Lifts" = how much the channel raises the mix (mix against mix minus that stem) in the given window
and band.

| Finding | Before | After |
|---|---|---|
| Cymbal swells inaudible and pulsing (one roll sample re-triggered every 2 steps) | 15 roll segments; the bar-7 / bar-12 swells lift the mix +0.02 / +0.04 dB (mean), +0.05 / +0.10 dB in their last 250 ms; stem envelope autocorrelation 0.57 at 190 ms (0.76 at 200 ms in the intro) | **one roll note per swell**, channel gain −6.5 → +3 dB; the bar-7 / bar-12 swells lift the mix +0.87 / +0.65 dB (mean) and **+1.6 / +1.2 dB in their last 250 ms (250 Hz–1 kHz +5.2 / +3.8 dB)**; the intro swell +2.7 dB mean; envelope autocorrelation **0.02** (no 190 ms pulse; the remaining 2.4 dB ripple is the recorded roll's own stroke modulation) |
| Snare without snap | after-beats at velocity 0.42 (softest layer); stem 16.4 dB under the mix (median, 120 ms windows on beat 2); lifts >4 kHz +0.03 dB and 150–600 Hz +0.40 dB (30 ms); solo −20.5 LU; build notes 11–22 dB under the mix | after-beats and triplets at 0.65–0.77 (layer 2), build 0.6 → 0.88; stem **10.2 dB** under the mix (median); lifts **>4 kHz +1.44 dB** (median, up to +3.8) and 150–600 Hz +3.75 dB; solo **−15.8 LU**; build notes 10–12 dB under the mix. The two downbeat accents under the crashes (bars 2 and 8) were dropped: they were masked and only added peak level. 1–4 kHz is still not lifted (+0.07 dB): the trumpets own that band and the recorded snare has little energy there (see the sampler notes) |
| Tail: no lead, no Aida, strings masking the chord buttons | accR guide tones −4.5 LU; strT −4.4 LU, in the same octave as accC (C4–A♭4); accC lifts the mix +0.73 dB over its notes (200 ms) | **accR plays the a phrase** (−2.3 LU); strT thinned to 2 voices above the tune (E♭5–A♭5) and 3.8 dB lower: **−10.2 LU**; accC on the march's after-beat voicings (G3–E♭4): **+1.74 dB** over its notes (+1.2 to +2.8); tail castanets lift >4 kHz +3.45 dB per click (was +1.85). The 3-bar period is now the phrase's own length (see "Key, tempo and length") |
| Glock on the final chord inaudible | E♭6+A♭6 on the tutti downbeat: 21.6–28.5 dB under the rest at its fundamentals, lifts >4 kHz +2.6 dB; loudest 3 s −42.4 LUFS | moved to the tag's button (G6 → A♭6, where the tutti has cleared), gain −16 → −9 dB: **2.3–3.9 dB** under the rest at its fundamentals, lifts >4 kHz **+9.2 / +7.7 dB**; loudest 3 s −36.1 LUFS. It stays off the castanets' triplet, whose clicks still lift >4 kHz by 7.9–11.6 dB |
| Violins' octave doubling masked | str −13.5 LU, vlnM −16.3 LU in bars 8–12; they lift the mix +0.27 dB overall and +0.94 dB at 2–5 kHz | velocities 0.62 / 0.60 → 0.86 / 0.84 (+4.6 / +4.7 dB) and the brass section 3.5 dB lower in a′ b′: str **−9.5 LU**, vlnM **−12.0 LU**; they lift the mix +0.65 dB overall and **+2.5 dB at 2–5 kHz**; trumpet −2.6 LU, trumpet + violins −1.5 LU |
| Horn pedal E♭3 held 8.6 s | one `Eb3:88` (bar 7 beat 3 → end of bar 12) | re-tongued at bar 7 beat 3 and at bars 8, 10, 11 and 12; longest breath 3.1 s (bars 8–9); the bar-5 E♭3 lasts 2.7 s |

### Notes for the sampler owner (not worked around in the song)

- **The `cymbal` roll zone (variant 1) is very dark in the sprite:** of its energy, 1–4 kHz is
  −14.4 dB, >4 kHz −30.9 dB and >8 kHz −77 dB (250 Hz–1 kHz holds almost all of it). The reviewer
  measured the source `susCymb1_roll_f1_nloop.wav` at about −13 dB above 4 kHz and −42 dB above
  8 kHz, so the build loses the shimmer. That is why the swells read as a mid-range "whoosh" and
  need +3 dB of channel gain. VCSL also has real crescendo rolls (`susCymb1_cresc_1.5s/2s/4s.wav`).
  When the zone is rebuilt, re-balance `cym` (it will need less gain).
- **The `snare` is dark at the source:** the VCSL rope-tension snare's soft layers are almost all
  drum body. Measured on the first 250 ms, the source `RopeSnare_hi_sn_Main_vl1_rr1.wav` has
  1–4 kHz at −29.8 dB and >4 kHz at −43.8 dB of its energy, and `vl4_rr1` −16.5 / −25.2 dB; the
  sprite zones match the sources within 1 dB. A crisper snare would need another source.

## Other checks

- **Chromium (the game's real worker):** `audiotest.html` → `__at.samplerTrack('victory')`
  decodes the 53 MP3 sprites with Chromium's decoder (1.2 s), installs them in the render worker
  and renders the track there (0.9 s). The output has the same length (1 388 884 samples) and loop
  window (24.260–28.935 s), the same peak (−2.44 dBFS), and equals the Node render to −90 dB.
  There are no console errors, and the bank report is OK with no warnings.
- **Pitch** (autocorrelation on the trumpet stem; the trumpet part is unchanged): the long notes
  A♭4 and C5 are within −0.9 to +3.8 cents.
- **Rolls and swells:** the timpani rolls rise 11–14 dB (100 ms RMS windows on the solo stem).
  Each cymbal swell is one recorded roll note: over its length the stem rises 8.8 dB (intro),
  7.6 dB (bar 7) and 10.9 dB (bar 12) from its first to its last 200 ms, with no periodic dip
  (autocorrelation of the detrended 10 ms envelope ≤ 0.02 between 150 and 260 ms). The cymbal
  velocities stay below 0.7, because at 0.7 and above the sampler selects the cymbal's hit layer
  instead of the roll.
- **Clicks:** a second-difference scan of the mix finds spikes only at note attacks: the 20
  largest are all within 36 ms of an onset (castanets, bass drum, and the tag's
  accordion/glockenspiel/castanet onsets).
- **Seam:** mismatch −127.6 dBFS. Nothing from the fanfare rings past the 4 s seam pad (render.ts
  warns if it does; it does not). The glockenspiel's last note (20.07 s, at most 2.2 s of ring)
  ends before the playback window starts (24.26 s).
- `node scripts/music/selftest/formcheck.mjs`: "ok victory 580 events, 3 form entries, loop from
  "tail" bars 14-16". render-song counts 630 events: the same 580 plus the 50 tail events of the
  first 4 s of the loop, which the renderer copies after the loop end (the seam pad).
- `npx tsc --noEmit` is clean for the song file.

## Changes from the previous `victory`

The old track was an original 3/4 "Brindisi" fanfare in D (one-shot, 14.9 s). It is replaced
completely. The export name, the id and the `SongDef` shape are unchanged. The new track loops
(`loopFrom` 2), so the results screen is no longer silent after the fanfare.

Review revision (after the snapshot in aeb18e2): single-note cymbal swells, a snare in its brighter
layers, the accordion's a phrase as the loop, a thinner string bed, the glockenspiel on the tag's
button, a louder violin doubling with the brass section stepping back in a′ b′, and a re-tongued
horn pedal (details and measurements in "Review fixes").
