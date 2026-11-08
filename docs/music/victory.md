# `victory` — the Aida trumpets (Triumphal March)

The victory screen after a won stage: a timpani roll and a suspended-cymbal swell, then Verdi's
famous Aida trumpet theme played once, complete, by unison trumpets over a cartoon
orchestra-meets-street band (tuba and pizzicato "oom", string after-beats, snare, horns, violins in
octaves, bass drum and piatti). The tutti lands on a big A♭ chord with a crash, and a cheeky band
tag follows: the accordion mocks the trumpets' triplet with the castanets, and a V7–I "button"
with a glockenspiel "ti-ting" closes it. Then the band takes a **victory lap** under the results
screen: one bar of oom-pah (played once) and the accordion's pickup, then the loop: the theme
again, softly, traded between the accordion and the mandolin (a, b, a′, b′) over upright bass,
guitar after-beats and a tambourine brush, with a clarinet counter-melody and a mandolin second
voice on the second pass, and a turnaround bar in which the clarinet's fill and the castanets' call
lead into the accordion's pickup and straight back into a.

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
and then opens the results screen ("Vittoria!"). The screen stays until the player clicks
"Ancora" or "Menu"; players read stats, unlocks and medals there for 10–60 s or more. So the track
is **loopable**: the fanfare plays once (20.26 s), then the one-bar vamp (1.56 s, also once), and
the victory lap loops (`loopFrom` = 3, the `tail` section: 12 bars = 18.70 s). A minute on the
results screen is the fanfare, the vamp and two passes of the lap. `startRun` preloads `victory` at
the start of every run. The first sound (the timpani roll) is at 0.002 s.

| | |
|---|---|
| Music | 26 bars = **40.52 s**: fanfare 13 bars (20.26 s) + vamp 1 bar (1.56 s) + loop 12 bars (**18.70 s**); the cap for this revision is 45 s |
| Rendered buffer | 44.52 s: the renderer appends `LOOP_PAD` = 4 s of the loop body for the seam (`src/audio/render.ts`) |
| Playback | 0 → 44.52 s, then the window 25.82 → 44.52 s repeats |

### Music cache (for the lead)

The engine keeps rendered tracks up to `MUSIC_CACHE_SECONDS` = 280 s (`src/audio/engine.ts`; it
counts each track's buffer length) and, when a new render pushes the total over, evicts the least
recently used track that is neither playing nor wanted. `startRun` plays the stage track and
preloads `gameover`, `victory`, `boss` and `finalboss` (in that order), so during a run the cache
has to hold the stage track plus those four. Buffer lengths of the worktree's tracks (from
`export-song --form`: loop end + the 4 s pad, or a one-shot's end + its `tail`):

| Track | Buffer | | Stage track | Buffer | Stage + per-run set | Headroom |
|---|---|---|---|---|---|---|
| `gameover` | 13.79 s | | `kitchen` | 95.88 s | 276.85 s | **3.15 s** |
| `victory` | 44.52 s (old 3-bar tail: 28.94 s) | | `trattoria` | 95.30 s | 276.28 s | 3.72 s |
| `boss` | 52.95 s | | `streets` | 94.00 s | 274.97 s | 5.03 s |
| `finalboss` | 69.71 s | | `foodcourt` | 92.89 s | 273.86 s | 6.14 s |
| **per-run set** | **180.97 s** (old: 165.39 s) | | | | | |

It fits today, with 3.15–6.14 s to spare (18.7–21.7 s with the old 3-bar tail). A stage track
whose buffer exceeds **99.03 s** (about 95 s of music) would make `evict()` drop the oldest
preload, `gameover`, which would then be rendered again when the run ends. The stage briefs allow
up to 100 s of music (a 104 s buffer), which would leave 39.55 s for `victory`: less than its
44.52 s, and less than the 42.96 s it would have without the vamp. The fix belongs to the lead:
keep the stage buffers ≤ 99 s, or raise `MUSIC_CACHE_SECONDS` in the engine (not an arrangement
file; each extra 10 s costs 3.8 MB of Float32 stereo at 48 kHz). Playing the vamp once outside the
loop does **not** shorten the victory buffer: `render.ts` allocates the whole song up to the loop
end plus the pad
(`length = loopEnd + LOOP_PAD`), so the buffer is 44.52 s with the previous 13-bar loop and with
the vamp + 12-bar loop alike. Only cutting the vamp bar from the song would save its 1.56 s (limit
99.03 → 100.59 s), at the cost of the lap starting on the downbeat after the tag's button with no
breath and no pickup; that would not change the conclusion above, so the vamp stays.

## Reference and melody proof

Reference (grade B in [`REFERENCES.md`](REFERENCES.md), single source): `wf_aida_march.abc`, a lead
sheet in G with chord symbols, 4/4. Bars 1–12 hold the famous trumpet theme: the pickup D in bar 1,
then a (2–4), b (5–7, half cadence), a (8–10) and b′ (11–12, full cadence onto bar 13's G).

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/wf_aida_march.abc --text                     # bar numbers + chords
$PY scripts/music/abc2notes.py $REFS/wf_aida_march.abc --bars 1-13 --dsl 0.25     # 16th-note DSL string
# the fanfare: the trumpets, reference bars 1-12 (the REFERENCES.md command)
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 1-12 --song victory --channel tpt --section march
# the victory lap, first pass: the vamp's pickup + tail bars 1-11 = song bars 14-25 (form order)
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 1-12 --song victory --channel accR,mand --bars 14-25
# every later pass: the turnaround's pickup (tail bar 12) + tail bars 1-11, in the order the loop plays them
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 1-12 --song victory --channel accR,mand --section tail --bars 12,1-11
# the loop's tune without the pickup
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 2-12 --song victory --channel accR,mand --section tail --bars 1-11
# each statement of the lap on its own
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 1-4   --song victory --channel accR --bars 14-17
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 2-4   --song victory --channel accR --section tail --bars 1-3
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 5-7   --song victory --channel mand --section tail --bars 4-6
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 8-10  --song victory --channel mand --section tail --bars 7-9
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 11-12 --song victory --channel accR --section tail --bars 10-11
```

Every comparison runs at the default thresholds (pitch ≥ 95 %, rhythm ≥ 90 %, no broken bar),
with no `--allow-bars` and no `--resync` (song bars without `--section` count along the form:
14 = the vamp, 15–26 = tail bars 1–12):

| Statement | Song bars | Channel(s) | Ref. bars | Pitch | Rhythm | Broken bars | Result |
|---|---|---|---|---|---|---|---|
| **Fanfare: the whole theme** | `march` 1–12 | `tpt` | 1–12 | 100 % (60/60) | 100 % (60/60) | none | **PASS** (exit 0) |
| same, without `--ref-bars` | `march` | `tpt` | located at 1..12 | 100 % | 100 % | none | PASS |
| trumpet + brass section together | `march` 1–12 | `tpt,tptS` | 1–12 | 100 % | 100 % | none | PASS |
| violins' octave doubling of a′ b′ | `march` 8–12 | `str,vlnM` | 8–12 | 100 % (27/27) | 100 % | none | PASS (+13 semitones: A♭ and an octave up) |
| the fanfare's second a | `march` 8–10 | `tpt` | 2–4 | 100 % (13/13) | 100 % | none | PASS |
| **Lap, first pass** (vamp's pickup, a, b, a′, b′) | song 14–25 | `accR,mand` | 1–12 | 100 % (60/60) | 100 % (60/60) | none | **PASS** (exit 0) |
| same, without `--ref-bars` | song 14–25 | `accR,mand` | located at 1..12 | 100 % | 100 % | none | PASS |
| **Lap, every later pass** (turnaround's pickup, a, b, a′, b′) | `tail` 12, 1–11 | `accR,mand` | 1–12 | 98.4 % (60/61) | 98.4 % (60/61) | none | **PASS** (exit 0): all 60 reference notes matched; 1 extra note, see below |
| the loop's tune without the pickup | `tail` 1–11 | `accR,mand` | 2–12 | 100 % (59/59) | 100 % (59/59) | none | **PASS** (exit 0) |
| pickup + a (accordion) | song 14–17 | `accR` | 1–4 | 100 % (14/14) | 100 % (14/14) | none | **PASS** (exit 0) |
| a (accordion) | `tail` 1–3 | `accR` | 2–4 | 100 % (13/13) | 100 % (13/13) | none | **PASS** (exit 0) |
| b (mandolin) | `tail` 4–6 | `mand` | 5–7 | 100 % (19/19) | 100 % (19/19) | none | **PASS** (exit 0) |
| a′ (mandolin, tremolo) | `tail` 7–9 | `mand` | 8–10 | 100 % (13/13) | 100 % (13/13) | none | **PASS** (exit 0; also vs. ref. 2–4: 100 % / 100 %) |
| b′ (accordion) | `tail` 10–11 | `accR` | 11–12 | 100 % (14/14) | 100 % (14/14) | none | **PASS** (exit 0) |

- Two statements of the theme, no liberties: the fanfare's trumpets, and the lap's accordion and
  mandolin. Every note, the triplet pickups (written `4/3` steps at 4 steps per beat) and the
  dotted-16th figures are as in the reference. compare.py reads the mandolin's tremolo on the long
  notes of a′ (the A♭ of tail bar 7, the C of tail bar 9) as one note, as it is meant to.
- The vamp is reference bar 1 exactly: three beats without the tune (the band vamps) and the
  pickup E♭ (D in the reference) on beat 4. Tail bars 1–11 are reference bars 2–12. From the
  second pass on, the pickup comes from the turnaround (tail bar 12, beat 4), so the lap is
  checked against the same reference bars as the fanfare, pickup included, both ways in.
- `--bars 12,1-11` puts tail bar 12 before bars 1–11, as the loop plays them. Bar 12 also holds,
  on its beat 1, the landing A♭ of the pass before (the theme's last note, reference bar 13's G,
  which bars 1–12 do not include). compare.py lists it as one extra note before the aligned span,
  so the score is 60/61; every reference note is matched, and nothing else differs.
- In b′ the mandolin plays a second voice under the accordion (see Harmony). compare.py takes the
  highest note per onset over `accR,mand`, which is the accordion's tune; the second voice is a
  harmony line, not a statement of the theme.
- The theme's last note (the A♭ on bar 13's downbeat) is the first note of the `fin` section in
  the fanfare (the tutti final chord) and the first note of the lap's turnaround bar (the
  landing). Both REFERENCES.md and these commands compare bars 1–12, so in the fanfare and in the
  first pass this note is outside the scored passage. Bar 13 of the reference continues with the
  middle phrase's pickup (G–D–G), which the track does not play: the fanfare goes into its tag,
  the lap into its turnaround.
- Key: **A♭ major**, a semitone above the reference (compare.py: "candidate = reference +1").
  A♭ is Verdi's key for the first trumpet statement in the opera (the reprise moves up to B, the
  "lift" that the reference writes as G → B♭). It is also a natural key for B♭ trumpets, which
  play the tune in their bright middle register, E♭4–D♭5, and it lies well for the accordion and
  the mandolin in the same octave.
- The tag's accordion triplet (B♭–E♭–B♭, an octave above the trumpets) quotes the triplet figure as
  a joke. It is not a restatement.

## Key, tempo and length

4/4, **♩ = 154**, 4 steps per beat (16ths; triplet eighths are `4/3` steps). The oom-pah moves in
half notes, so it feels like an alla-breve march at 77 half notes a minute: brisk and bandistic, the
"banda" playing Verdi slightly too fast, while timpani, crashes and accents keep it pompous. The
lap keeps the tempo (one tempo per song): at ♩ = 154 the oom-pah of the victory lap is a relaxed
strut.

Length (this revision: the whole track at most 45 s, a 12–16-bar loop of about 19–25 s):

- the fanfare stays as it was: the pickup bar + the 12-bar theme + the final chord/tag bar,
  13 bars = 20.26 s (its render is bit-identical to the previous versions, see "Other checks");
- the vamp, played once: reference bar 1 (three beats of oom-pah and the accordion's pickup),
  1 bar = 1.56 s;
- the loop is the theme once more, 12 bars = **18.70 s**: reference bars 2–12 plus the landing /
  turnaround bar, which also carries the next pass's pickup. The whole track is 26 bars =
  **40.52 s**.

Why the vamp plays once and the loop has 12 bars. The previous revision looped 13 bars that
started with the vamp. At every restart the tune stopped after the landing (its tail bar 13,
beat 1) and came back only with the vamp's pickup: 6 beats (2.34 s, 11.5 % of every pass) without the tune,
and the vamp was the thinnest bar of the track (−20.5 LUFS against −14.3 for b′'s last bar; see
"Review fixes, second round"). Now the pickup sits on the turnaround's beat 4, which is where
Verdi has it (the beat before a), so in the loop the tune rests for 2 beats only (0.78 s, 4.2 %),
the turnaround's beats 2–3, which the clarinet's fill and the castanets' rattle fill. The vamp
keeps its job on the way in: after the tag's V7–I button the band settles into one bar of oom-pah
and the accordion picks up, the way the fanfare starts (with the theme's own pickup bar). Both
ways into a, from the vamp and from the turnaround, end the same way: the castanets' rattle on
beat 3, then the pickup E♭ with their "tak" on beat 4.

The loop's 18.70 s sit at the bottom of the brief's range: 12 bars is its lowest bar count, and
0.3 s short of "roughly 19 s". A longer loop would need bars that are not Verdi's (the theme is
11 bars plus its landing): a 13th bar would be a vamp again, the hole this revision removes.
15 or 16 bars would also make the track 45.19 s or longer with the vamp, over the cap.

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
| `vamp` (once) | 14 | 20.26–21.82 s | 1 | **Vamp:** upright bass A♭1 / E♭2 on 1 and 3, guitar + accordion chord buttons on 2 and 4, a tambourine tap on 2; the castanets' call: a rattle on beat 3 (21.04 s) and their "tak" with the accordion's pickup E♭4 on beat 4 (21.43 s) |
| **`tail` (loop)** | 15–17 (tail 1–3) | 21.82–26.49 s | 2–4 (a) | **a, accordion:** A♭4 — B♭-E♭-B♭ / C C C C-D♭-A♭ / C. B♭ A♭ over the oom-pah (bass on 1 and 3, strummed guitar after-beats, tambourine taps on 2 and 4); in the tune's rest (tail bar 3, beat 4) the castanets wink as in the march |
| | 18–20 (tail 4–6) | 26.49–31.17 s | 5–7 (b) | **b, mandolin**, picked; the accordion's bellows hold two soft voices underneath (E♭4 over B♭3/C4, tied common tones); half cadence on E♭ |
| | 21–23 (tail 7–9) | 31.17–35.84 s | 8–10 (a′) | **a′, mandolin** with tremolo on the long notes (A♭4, tail bar 7; C5, tail bar 9), the **clarinet's counter-melody** below (E♭–F–E♭–D♭ / C – E♭ / G – C), string pizzicato doubles the bass an octave up from here on; the clarinet's run E♭–F–G–A♭ fills the tune's rest and hands over to the accordion |
| | 24–25 (tail 10–11) | 35.84–38.96 s | 11–12 (b′) | **b′, accordion**, with the **mandolin's second voice** below (sixths, a fifth where the chord is a plain E♭; D♭ → C into the landing); full cadence |
| | 26 (tail 12) | 38.96–40.52 s | 13 (beat 1) + 1 (beat 4) | **Landing + turnaround:** the accordion lands on A♭4 (mandolin C4); then A♭ – F7 – B♭m7 – E♭7, one guitar strum per beat, the bass walks A♭–F–B♭–E♭, the clarinet fills A3–C4 / D♭4–F4 on beats 2–3, the castanets rattle on beat 3, and on beat 4 the accordion's pickup E♭4 with the castanets' "tak" leads back into a (the loop end, 40.52 s) |

The loop (tail) in short: a (accordion) → b (mandolin) → a′ (mandolin + clarinet) → b′ (accordion
+ mandolin's second voice) → landing + turnaround with the pickup → a. The first pass is one line at
a time over the oom-pah; the second pass adds the counter-melody, the second voice and the
pizzicato; the turnaround relaxes it for two beats and the castanets' call starts the next pass.
The vamp is heard once, between the tag and the first pass.

### Harmony

The march uses the reference's chord symbols, transposed G → A♭. The lap uses the same chord
track: the vamp is reference bar 1, tail bars 1–11 are reference bars 2–12, and tail bar 12 (at
the place of reference bar 13) adds the turnaround. The table counts **reference bars**:

| Ref. bar | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tail bar | (vamp) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| Chords | (A♭) | A♭ · · E♭7 | A♭ | E♭7 · A♭ · | E♭7 · A♭ E♭ | A♭ E♭ Cm Fm | B♭7 · E♭7sus4 E♭ | A♭ · · E♭7 | A♭ | E♭7 · A♭ · | E♭7 · A♭ E♭ | A♭ E♭ Cm E♭7 | `fin`: A♭ · · (E♭7 A♭ in 8ths on beat 4) / tail: A♭ F7 B♭m7 E♭7 |
| Bass | march: roll E♭ / vamp: A♭ E♭ | A♭ E♭ | A♭ C | E♭ A♭ | E♭ A♭ E♭ | A♭ G C F | B♭ E♭ | A♭ E♭ | A♭ C | E♭ A♭ | E♭ A♭ E♭ | A♭ G C E♭ | `fin`: A♭ / tail: A♭ F B♭ E♭ |

- Reference bars 6–7 and 12 are the circle of fifths of the original (vi–ii–V/V–V and vi–V7–I).
  The bass walks one note per beat there, and the after-beats become one chord per beat.
  Elsewhere the "oom" is root–fifth on beats 1 and 3, except that it walks A♭–C–E♭ from bar 3
  (and 9) into the E♭7 bar, and takes the reference's beat-4 E♭ in bars 5 and 11. The lap's
  upright bass plays the same line as the march's tuba (A♭1–E♭2), with pizzicato an octave up in
  the second pass (tail bars 7–12).
- The tune holds C (the 13th) over E♭7 in reference bars 4, 5, 10 and 11, and C resolves to B♭.
  The after-beats (march: strings; lap: guitar, same voicings) and the horns leave the 7th (D♭) out
  under that C, so there is no minor 9th between the parts. The 7th appears where it resolves:
  E♭7 on beat 4 of reference bars 2, 8 and 12, with D♭ → C into the next A♭.
- Reference bar 7: the horns (march) and the accordion's two voices (lap) move B♭7 → E♭7sus4 →
  E♭, so the sus4 A♭ falls to G under the tune's F → G. The accordion's voices in tail bars 4–6:
  E♭4 over B♭3 – C4 – B♭3 | E♭4 over C4 – B♭3 – C4, F4 over C4 | D4 over A♭3, E♭4 over A♭3 – G3.
- **Lap, clarinet counter-melody (a′, tail bars 7–9):** E♭4 F4 E♭4 D♭4 | C4 — E♭4 — | G3 — C4
  (E♭4 F4 G4 A♭4). It moves while the tune holds A♭ (5th – 6th – 5th of A♭, then D♭, the 7th of
  E♭7, resolving to C), slows to half notes under the repeated C's, takes G3, the 3rd of E♭7,
  under the tune's C – B♭, and runs up to A♭ in the tune's rest, a step under the accordion's B♭
  that follows.
- **Lap, mandolin second voice (b′, tail bars 10–11 and the landing):** under the tune, always on
  a tone of the chord track's chord: a sixth (D♭/E♭ under B♭/C over E♭7, C under A♭ over A♭, E♭
  under C over A♭, Cm and E♭), but a fifth, E♭ under B♭, on the two beats whose chord is a plain E♭
  triad (tail bar 10 beat 4 over E♭2, tail bar 11 beat 2 over G1), where a D♭ would add a 7th the
  band does not play, a tone under the guitar's E♭4. Under the final B♭–C–B♭ triplet (E♭7) it
  plays D♭–E♭–D♭, and that D♭ resolves to C under the landing A♭. Checked onset by onset against
  the chord track (`export-song` events): 15 of 15 notes are chord tones (the previous revision
  played D♭ on those two E♭-triad beats: 2 of 15 off the chord).
- **Lap, turnaround (tail bar 12):** A♭ – F7 – B♭m7 – E♭7 (I – V7/ii – ii7 – V7), back to a's A♭.
  The guitar strums every beat with stepwise, partly chromatic voice leading: A♭3 – A3 – A♭3 –
  G3 – (A♭3), C4 – C4 – D♭4 – D♭4 – (C4), E♭4 – E♭4 – F4 – E♭4 – (E♭4); the A♮ of F7 is the
  turnaround's sly chromatic note. The clarinet's fill uses the chord tones (A3 C4 | D♭4 F4) and
  stops after beat 3; the accordion's pickup E♭4 on beat 4, the root of E♭7, continues its line a
  step down and leads to a's A♭4.
- **Sonority scan of the lap** (`export-song` events, every onset, all pitched tail channels): of
  76 vertical slices, three hold a semitone pair, and all three are non-chord tones of the tune
  itself, the same three as in the march: the D♭ passing note of the "C–D♭–A♭" triplet over the
  guitar's A♭ after-beat (tail bars 2 and 8, beat 4), and the C neighbour note of the final
  "B♭–C–B♭" triplet against the guitar's D♭ (tail bar 11, beat 4). The vamp has none.

## Instrumentation

Fanfare (`march`, `fin`):

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
| `cym` | `cymbal` | suspended-cymbal swells into the crashes: **one** roll note each (variant 1, the roll at any velocity), the recorded roll does the crescendo; velocity 0.42 / 0.66 / 0.60 | — |
| `glock` | `glock` | "ti-ting" on the tag's button, doubling the accordion's top line an octave up | G6–A♭6 |
| `acc` | `accordion` | the tag: triplet echo + V7–I button | C5–B♭5 |
| `cast` | `castanets` | the wink in the trumpets' rests (bars 4, 10), the tag's rattle and triplet; in the lap: the call into a (a rattle on beat 3, 0.5 → 0.68, and the "tak" with the pickup on beat 4, 0.8) in the vamp and in the turnaround, and the wink in tail bar 3 (0.52–0.76) | — |

Victory lap only (`vamp` + `tail`; the tail channels' gains were trimmed by −0.15 dB in this
revision to keep the loop at −16.4 LUFS):

| Channel | Instrument id | Gain | Role | Range used |
|---|---|---|---|---|
| `accR` | `accordion` | +1.75 dB | the tune: the vamp's pickup and a (tail bars 1–3) at velocity 0.65, b′ + landing (tail bars 10–12) at 0.64, and the pickup into the next pass (tail bar 12, beat 4) at 0.65 | E♭4–D♭5 |
| `mand` | `mandolin` | +3.85 dB | the tune: b (tail bars 4–6, picked, 0.74) and a′ (tail bars 7–9, 0.77, 16th-note tremolo on notes of a dotted quarter and longer); the second voice under b′ (0.47: the softer of the mandolin's two velocity layers) | C4–D♭5 |
| `clar` | `clarinet` | −3.65 dB | counter-melody under a′ (chalumeau, 0.72), the turnaround fill on beats 2–3 (0.95) | G3–A♭4 |
| `accC` | `accChord` | −3.65 dB | the accordion's left hand: chord buttons on 2 and 4 in the vamp (0.55); two soft sustained voices under the mandolin's b (0.45) | G3–F4 |
| `gtr` | `guitar` | −5.15 dB | the "pah": three-note after-beats on 2 and 4 (the march's voicings), strummed low → high 12 ms apart; one strum per beat in the turnaround (0.55) | G3–F4 |
| `ubass` | `uprightBass` | −2.65 dB | the "oom" on 1 and 3 (the march's bass line), walking in tail bars 5, 11 and 12 (0.78) | F1–E♭2 |
| `pizzT` | `pizz` | +1.85 dB | second pass (tail bars 7–12): doubles the bass an octave up (0.55) | F2–E♭3 |
| `tamb` | `tamb` | +5.35 dB | the brush: light taps on 2 and 4 (the set's hit articulations, variants 0/1, velocity 0.5); beat 4 is left to the castanets in the vamp and in tail bars 3 and 12 | — |

Every id is a contract id with recorded samples (render-song: "recorded samples (53 sets)", no
skipped channels); `timpani` and `uprightBass` are the long aliases of `timp` and `ubass`. All
parts stay within the natural ranges of the brief (accordion B3–G6, mandolin G3–A6, clarinet
D3–C7, guitar E2–B5, upright bass E1–G3). The tambourine's shake articulations (variants 2/3) peak
160 and 80 ms after their onset (its hits at 60 and 40 ms; measured on a scratch render of each
variant), so on the after-beats of a ♩ = 154 march they would drag; the lap uses the hits.

## Levels (sample render)

`node scripts/music/render-song.mjs victory out.wav` (recorded samples, 54 sets; the march and tag
channels, which play before the loop window, are left out of the channel table below):

```text
victory: 46.52 s @ 48000 Hz, 903 events
  loop: plays 0 → 46.519 s, then repeats 27.818 → 46.519 s (body 18.701 s = bars 15-26 from section "tail"; seam mismatch -150.5 dBFS)
  form: march@0.00s fin@18.70s vamp@20.26s tail@21.82s
  loop body: integrated -16.5 LUFS (whole file -15.9), short-term max -15.5 LUFS, RMS -19.4 dBFS, sample peak -2.43 dBFS
  soft clipper: 35 samples (0.001 %), DC -0.00000, first sound at 0.001 s
  spectral balance: <250 Hz -6.7 dB, 250 Hz-4 kHz -1.2 dB, >4 kHz -16.2 dB (share of total energy)
  channel      instrument      notes  gain   solo LUFS  vs mix  loudest 3s  peak dBFS
  cast         castanets          27   -9.3      -37.2   -20.7       -42.3      -12.0
  accR         accordion          30      1      -17.8    -1.3       -17.1       -8.8
  mand         mandolin           47    1.5      -19.7    -3.2       -17.7       -6.3
  clar         clarinet           16   -4.4      -22.8    -6.3       -22.1      -12.1
  accC         accChord           19   -5.2      -26.4    -9.9       -26.1      -17.3
  gtr          guitar             99  -5.15      -26.9   -10.4       -25.5      -10.8
  ubass        uprightBass        34  -2.65      -26.2    -9.7       -24.7      -11.8
  pizzT        pizz               17    0.7      -28.5   -12.0       -27.1      -13.9
  tamb         tamb               23    4.8      -34.9   -18.4       -36.3      -17.9
  warnings: none
```

(Integrated loop-body loudness −16.51 LUFS before rounding.) render-song measures the channel
table over the loop window; the 15 march and tag channels play before it, so render-song judges
their audibility over the whole file instead, and none is flagged. The vamp also plays before the
loop window, so the `accC` row is the voices under b only. The channel table counts the mandolin's
tremolo picks as notes.

- **Loop body −16.5 LUFS** (target −16.4 ± 0.5) with `gainDb` −1.2: the lap is balanced with its
  own channel gains, so the fanfare keeps its level.
- **The fanfare is −15.0 LUFS** (−14.96 over 0–20.26 s of this render, short-term max −13.6 LUFS):
  1.5 LU above the lap's integrated level, and above every phrase of it. The lap is softer in
  texture too (no brass attacks or cymbals, little energy above 4 kHz).
- **Peaks:** sample peak −2.43 dBFS, in the fanfare (the downbeat of bar 13, 18.71 s). The loop
  window peaks at −3.34 dBFS (38.60 s). Of the 35 soft-clipper samples (0.001 %, counted per
  channel), 21 are in the fanfare and 14 in the loop.

**Balance per phrase** of the loop (scratch measurement on the steady-state loop: three copies of
the playback window, the middle one measured, so every bar has the loop itself before it;
K-weighted, ungated, each solo stem against the mix in the same window):

| Segment | Tail bars | Mix (LUFS) | Tune vs mix | Other parts vs mix (LU) |
|---|---|---|---|---|
| a | 1–3 | −16.9 | accordion **−0.7** | guitar −11.9, bass −11.0, tambourine −20.5, castanets −29.4 |
| b | 4–6 | −16.7 | mandolin **−1.9** | accordion voices −8.5, guitar −10.3, bass −9.3, tambourine −19.9 |
| a′ | 7–9 | −16.1 | mandolin **−2.0** | clarinet −6.7, guitar −12.6, bass −11.7, pizzicato −14.4, tambourine −20.3 |
| b′ | 10–11 | −15.7 | accordion **−2.2** | mandolin second voice −8.8, guitar −11.1, bass −9.7, pizzicato −12.5, tambourine −20.8 |
| turnaround | 12 | −16.5 | (accordion landing + pickup −4.0, clarinet fill −7.3) | guitar −9.2, bass −8.4, pizzicato −10.9, tambourine −22.8, castanets −22.9 |

Per bar (tail bars 1–12, ungated): −16.5 −16.6 −17.6 | −16.8 −16.4 −16.8 | −15.8 −15.8 −16.8 |
−16.1 −15.4 | −16.5 LUFS, a range of 2.2 LU. The loop's loudness range (short-term 3 s windows,
p95 − p10) is 1.4 LU, short-term −17.2 to −15.5 LUFS.

- **Melody on top:** in every phrase the tune's carrier is within about 2 LU of the mix (b′:
  2.2 LU, with the second voice and the pizzicato under it) and at least 4.7 LU above the next part
  (the clarinet's counter-melody in a′). Over the whole loop window the accordion reads −1.4 LU and
  the mandolin −3.0 LU (each carries the tune for about half of it).
- **A gentle arc over a steady pulse:** pass 1 (a, b) has one line at a time over the oom-pah;
  pass 2 (a′, b′) adds the counter-melody, the second voice and the pizzicato (a′ is 0.8 LU above
  a, b′ 1.0 LU above b; the whole rise from a to b′ is 1.2 LU); the turnaround relaxes it for two
  beats, and the castanets' call starts the next pass. The bass, the after-beats and the
  tambourine never stop.
- **The restart** (momentary loudness, 400 ms, steady state): b′ −14.5 to −15.9 LUFS → the landing
  −15.6 → the turnaround's beats 2½–3½ (clarinet fill, castanet rattle) −17.0 to −18.5 → the
  pickup with the "tak" −16.9 → −15.8 → a −15.7 to −16.2. The quietest 400 ms of the loop are no
  longer at the restart but in Verdi's own rests (the tune's beat-4 rest in tail bars 3 and 9:
  −22.9 / −21.3 LUFS, where the castanets wink and the clarinet runs). Time below −19 LUFS: 4.0 %
  of the loop (previous revision 9.4 %).
- **Every secondary part is audible where it plays** (lift = how much the part raises the mix:
  mix against mix minus that stem, same window): the mandolin's tune +3.2 to +11.3 dB across
  250 Hz–8 kHz (b: +5.6 / +7.1 / +9.0, a′: +3.2 / +8.6 / +11.3 at 250 Hz–1 kHz / 1–4 kHz /
  >4 kHz); the clarinet's counter-melody +2.1 dB at 250 Hz–1 kHz over a′ (per note median +1.7 dB,
  its run up to +8.0 dB) and its turnaround fill +2.7 to +9.3 dB per note (150 ms); the mandolin's
  second voice +0.5 to +1.2 dB per note at 250 Hz–1 kHz and median +1.3 dB at 1–4 kHz over b′; the
  accordion's voices under b +0.6 / +0.9 dB (250 Hz–1 kHz / 1–4 kHz); the guitar median +0.9 dB per
  strum (250 Hz–1 kHz, 120 ms); the bass +3.0 to +5.8 dB below 250 Hz per phrase (median +5.3 dB
  per note); the pizzicato median +0.9 dB per note below 250 Hz (up to +2.9); the tambourine median
  +2.3 dB per tap above 4 kHz (150 ms; up to +21.5 dB where the texture is open); the castanets
  above 4 kHz (60 ms): the call +6.3 / +14.2 / +17.2 / +14.9 dB for the rattle and +13.1 dB for the
  "tak" on the pickup, the wink in tail bar 3 +1.9 / +7.8 / +16.4 dB.
- Bass and percussion sit under the tune: upright bass −9.8 LU, pizzicato −12.4 LU, tambourine
  −18.4 LU, castanets −20.6 LU over the loop.
- **The way into the loop** (first pass, once): momentary loudness falls from −15.9 LUFS (the tag's
  button, 20.2 s) to −22.0 to −24.7 LUFS over the vamp's first three beats (the band settles; the
  vamp bar is −20.0 LUFS ungated), the castanets' call and the pickup bring it back (−21.6 → −16.6),
  and a comes in at −15.5 to −16.1 LUFS (21.8 s on).

## Review fixes (measured on 16-bit stems of sample renders)

Before = the snapshot in commit aeb18e2, after = the review revision (commit c3167cb). Both were
rendered with the same scratch stem tool (`renderSong` with `solo` per channel, recorded bank) and
analysed the same way. "Lifts" = how much the channel raises the mix (mix against mix minus that
stem) in the given window and band. The fanfare rows still describe the current track; the tail
row is history (the 3-bar tail it describes was replaced by the victory lap, see "Changes").

| Finding | Before | After |
|---|---|---|
| Cymbal swells inaudible and pulsing (one roll sample re-triggered every 2 steps) | 15 roll segments; the bar-7 / bar-12 swells lift the mix +0.02 / +0.04 dB (mean), +0.05 / +0.10 dB in their last 250 ms; stem envelope autocorrelation 0.57 at 190 ms (0.76 at 200 ms in the intro) | **one roll note per swell**, channel gain −6.5 → +3 dB; the bar-7 / bar-12 swells lift the mix +0.87 / +0.65 dB (mean) and **+1.6 / +1.2 dB in their last 250 ms (250 Hz–1 kHz +5.2 / +3.8 dB)**; the intro swell +2.7 dB mean; envelope autocorrelation **0.02** (no 190 ms pulse; the remaining 2.4 dB ripple is the recorded roll's own stroke modulation) |
| Snare without snap | after-beats at velocity 0.42 (softest layer); stem 16.4 dB under the mix (median, 120 ms windows on beat 2); lifts >4 kHz +0.03 dB and 150–600 Hz +0.40 dB (30 ms); solo −20.5 LU; build notes 11–22 dB under the mix | after-beats and triplets at 0.65–0.77 (layer 2), build 0.6 → 0.88; stem **10.2 dB** under the mix (median); lifts **>4 kHz +1.44 dB** (median, up to +3.8) and 150–600 Hz +3.75 dB; solo **−15.8 LU**; build notes 10–12 dB under the mix. The two downbeat accents under the crashes (bars 2 and 8) were dropped: they were masked and only added peak level. 1–4 kHz is still not lifted (+0.07 dB): the trumpets own that band and the recorded snare has little energy there (see the sampler notes) |
| (history) Tail: no lead, no Aida, strings masking the chord buttons | accR guide tones −4.5 LU; strT −4.4 LU, in the same octave as accC (C4–A♭4); accC lifts the mix +0.73 dB over its notes (200 ms) | the accordion played the a phrase as a 3-bar loop (−2.3 LU) under a thinner string halo. Superseded by the victory lap |
| Glock on the final chord inaudible | E♭6+A♭6 on the tutti downbeat: 21.6–28.5 dB under the rest at its fundamentals, lifts >4 kHz +2.6 dB; loudest 3 s −42.4 LUFS | moved to the tag's button (G6 → A♭6, where the tutti has cleared), gain −16 → −9 dB: **2.3–3.9 dB** under the rest at its fundamentals, lifts >4 kHz **+9.2 / +7.7 dB**; loudest 3 s −36.1 LUFS. It stays off the castanets' triplet, whose clicks still lift >4 kHz by 7.9–11.6 dB |
| Violins' octave doubling masked | str −13.5 LU, vlnM −16.3 LU in bars 8–12; they lift the mix +0.27 dB overall and +0.94 dB at 2–5 kHz | velocities 0.62 / 0.60 → 0.86 / 0.84 (+4.6 / +4.7 dB) and the brass section 3.5 dB lower in a′ b′: str **−9.5 LU**, vlnM **−12.0 LU**; they lift the mix +0.65 dB overall and **+2.5 dB at 2–5 kHz**; trumpet −2.6 LU, trumpet + violins −1.5 LU |
| Horn pedal E♭3 held 8.6 s | one `Eb3:88` (bar 7 beat 3 → end of bar 12) | re-tongued at bar 7 beat 3 and at bars 8, 10, 11 and 12; longest breath 3.1 s (bars 8–9); the bar-5 E♭3 lasts 2.7 s |

### Notes for the sampler owner (not worked around in the song)

- **The `cymbal` roll zone (variant 1) was very dark in the sprite** (of its energy, >4 kHz
  −30.9 dB, >8 kHz −77 dB), so the swells read as a mid-range "whoosh" and needed a high channel
  gain. The zone has since been rebuilt from SSO's bright crescendo roll and `cym` re-balanced
  (+7.2 → +1.2 dB): see "Polish" at the end.
- **The `snare` is dark at the source:** the VCSL rope-tension snare's soft layers are almost all
  drum body. Measured on the first 250 ms, the source `RopeSnare_hi_sn_Main_vl1_rr1.wav` has
  1–4 kHz at −29.8 dB and >4 kHz at −43.8 dB of its energy, and `vl4_rr1` −16.5 / −25.2 dB; the
  sprite zones match the sources within 1 dB. A crisper snare would need another source.
- **The `tamb` shake articulations (variants 2/3) peak late:** 160 / 80 ms after the onset (hits,
  variants 0/1: 60 / 40 ms; accents, variants 4/5: 10 ms). On a beat they sound late; the victory
  lap uses the hits.
- The plucked samples' late start (mandolin, guitar, pizzicato; being fixed in the bank) also
  applies to the lap's oom-pah and mandolin; nothing in the song compensates for it.

## Review fixes, second round (the victory lap)

Before = the 13-bar victory lap of the previous revision, after = this revision. Both measured the
same way: float stems of sample renders (`renderSong` with `solo` per channel), the steady-state
loop (copies of the playback window, so every bar has the loop itself before it), K-weighted,
ungated per bar / per phrase, momentary = 400 ms.

| Finding | Before | After |
|---|---|---|
| **The tune missing for 6 beats at every restart; the vamp a level hole** | loop = vamp + a b a′ b′ + landing/turnaround, 13 bars (20.26 s); the tune silent for 6 beats per pass (2.34 s, 11.5 %): the turnaround's beats 2–4 and the vamp's beats 1–3. Per bar: vamp **−20.5**, a −17.2 / −17.1 / −17.9, b −16.7 / −16.4 / −16.3, a′ −15.5 / −15.6 / −16.7, b′ −15.0 / **−14.3**, turnaround −16.5 (range 6.2 LU); phrases a −17.4 → b′ −14.6 (+2.8 LU), b′ louder than the fanfare (−15.14); momentary at the restart: b′ −13.5 to −14.6, landing −14.3, turnaround −17.0 to −18.6, vamp **−22.3 to −24.9**; time below −19 LUFS 9.4 %; LRA 3.2 LU | the vamp plays **once**, before the loop (`form` march, fin, vamp, tail; `loopFrom` 3); the loop = a b a′ b′ + landing/turnaround, **12 bars (18.70 s)**, and the turnaround carries the pickup E♭4 on beat 4 (accordion), with the castanets' rattle on beat 3 and their "tak" on the pickup (the same call ends the vamp); the tune is silent for **2 beats** per pass (0.78 s, 4.2 %), where the clarinet's fill and the rattle play. b′ softer and a stronger: accordion 0.68 → **0.64** in b′, 0.62 → 0.65 in a; the mandolin's second voice 0.53 → 0.47 (its softer layer); the clarinet's fill 0.85 → 0.95; all lap channels −0.15 dB. Per bar: −16.5 / −16.6 / −17.6, −16.8 / −16.4 / −16.8, −15.8 / −15.8 / −16.8, −16.1 / −15.4, −16.5 (**range 2.2 LU**); phrases a −16.9 → b′ −15.7 (**+1.2 LU**), all below the fanfare; momentary at the restart: b′ −14.5 to −15.9, landing −15.6, turnaround −17.0 to −18.5, pickup −16.9 → −15.8, a −15.7 to −16.2; time below −19 LUFS 4.0 %; **LRA 1.4 LU**; tune vs mix −0.7 / −1.9 / −2.0 / −2.2 LU per phrase; loop −16.38 LUFS |
| The doc's "always on chord tones" for the mandolin's second voice in b′ was wrong on two beats | D♭4 under the tune's B♭4 on old tail bar 11 beat 4 (over E♭2) and bar 12 beat 2 (over G1, a tritone), where the chord track and the guitar (G3 B♭3 E♭4) have a plain E♭ triad: an E♭7 the band does not play, and the D♭ then moved up to E♭ over Cm. Onset scan: 2 of 15 notes off the chord | the second voice takes **E♭4** (a fifth under B♭4) on those two beats (now tail bar 10 beat 4 and bar 11 beat 2); onset scan **0 of 15** off the chord; the Harmony text says exactly what the line does. The tune is untouched (compare.py 100 %) |
| The longer track leaves 3–6 s of the 280 s music cache during a run | — | verified (buffer 44.52 s; per-run set 180.97 s; headroom 3.15 s with `kitchen` to 6.14 s with `foodcourt`), written up for the lead in "Music cache"; the buffer cannot shrink by moving the vamp out of the loop (it stays in the song), and the fix (stage buffers ≤ 99 s or a larger `MUSIC_CACHE_SECONDS`) is outside the arrangement files |
| (found while fixing) The turnaround's castanet rattle masked by the new pickup | in a first draft of this revision the rattle stayed on beat 4, under the accordion's pickup: strokes 2–4 lifted the mix above 4 kHz by only +0.7 / +0.4 / +0.5 dB (60 ms) | the rattle moved to beat 3 (where only the clarinet plays) and the "tak" onto the pickup: **+6.3 / +14.2 / +17.2 / +14.9 dB**, tak +13.1 dB |

## Other checks

- **The fanfare is unchanged:** float renders of this version and of commit c3167cb (the 3-bar
  tail) are bit-identical from 0 to 20.25 s; the first differing sample is at 20.2507 s, where the
  old tail's first notes start a few ms early through humanize, strum and the samples' pre-roll.
  Against the previous (13-bar) revision the render is bit-identical up to 20.2591 s, 0.7 ms before
  the vamp, whose humanize stream (seeded per section name) now differs. The fanfare's humanize
  streams are seeded per section too, so nothing after it can shift it, and `gainDb` is unchanged.
  The fanfare's measurements (−15.1 LUFS, the peaks, the review fixes) therefore stand.
- **compare.py:** every statement PASSes at the default thresholds, all at 100 % / 100 % except
  the later-pass check through the turnaround (98.4 %: the listed landing note, see above).
- **Chromium (the game's real worker):** `audiotest.html` → `__at.samplerTrack('victory')`
  decodes the 53 MP3 sprites with Chromium's decoder (0.73 s), installs them in the render worker
  and renders the track there (0.76 s). The output has the same length (2 136 935 samples =
  44.52 s) and loop window (samples 1 239 273 → 2 136 935 = 25.82 → 44.52 s), the same peak
  (−2.44 dBFS), and equals the Node render to −88 dBFS (the page's WAV is 16-bit). There are no
  console errors, and the bank report is OK with no warnings.
- **Seam:** mismatch −133.3 dBFS. No note of the loop is held across its end: every part is written
  inside its bar (no sequencer warnings), and the turnaround's last notes (the accordion's pickup
  E♭4, a quarter on beat 4; the guitar's E♭7 strum; the bass's E♭2; the castanets' "tak") are gated
  before the bar line, so only their natural releases ring into the next pass, where the 4 s pad
  renders them. Nothing from the fanfare or the vamp rings past the 4 s seam pad (render.ts warns
  if it does; it does not).
- **Clicks:** a second-difference scan of the loop window finds its 20 largest spikes at note
  attacks: 17 within 0–7.4 ms after a listed onset (mandolin, accordion chord buttons, guitar,
  clarinet, pizzicato), 3 on the mandolin's tremolo re-picks in tail bar 7 (the picks are
  generated by the sequencer, not listed).
- `node scripts/music/selftest/formcheck.mjs`: "ok victory 821 events, 4 form entries, loop from
  "tail" bars 15-26". render-song counts 876 events: the same 821 plus the 55 tail events of the
  first 4 s of the loop, which the renderer copies after the loop end (the seam pad).
- `npx tsc --noEmit` is clean.

## Changes from the previous `victory`

The old track was an original 3/4 "Brindisi" fanfare in D (one-shot, 14.9 s). It is replaced
completely. The export name, the id and the `SongDef` shape are unchanged. The new track loops, so
the results screen is no longer silent after the fanfare.

Review revision (after the snapshot in aeb18e2): single-note cymbal swells, a snare in its brighter
layers, the accordion's a phrase as the loop, a thinner string bed, the glockenspiel on the tag's
button, a louder violin doubling with the brass section stepping back in a′ b′, and a re-tongued
horn pedal (details and measurements in "Review fixes").

Victory-lap revision: the 3-bar loop (the accordion's a phrase, 4.7 s, repeating every few seconds
under a results screen that players read for up to a minute) was replaced by a 13-bar loop of
20.26 s: a vamp bar, the whole theme again (a, b, a′, b′) traded between the accordion and the
mandolin over upright bass, guitar after-beats and a tambourine brush, a clarinet counter-melody
and a mandolin second voice on the second pass, pizzicato under the second pass, and a landing /
turnaround bar (A♭ F7 B♭m7 E♭7) with a castanet rattle back into the vamp. The march and the tag
were untouched (bit-identical render); `gainDb` unchanged; the old tail channels `strT` and `hrnT`
went, and `mand`, `clar`, `gtr`, `pizzT` and `tamb` came in. The track grew from 24.94 s to
40.52 s of music (render buffer 28.94 → 44.52 s).

Second review round (this version; details in "Review fixes, second round"): the vamp is its own
section, played once between the tag and the loop (`form` march, fin, vamp, tail; `loopFrom` 3),
and the loop is 12 bars (18.70 s) whose turnaround carries the pickup into a, so the tune rests for
2 beats per pass instead of 6 and the vamp's level hole is gone from the loop; the castanets' call
(rattle on beat 3, "tak" with the pickup) ends both the vamp and the turnaround; the a → b′ rise is
flatter (accordion 0.62 → 0.65 in a, 0.68 → 0.64 in b′, the second voice in the mandolin's softer
layer); the mandolin's second voice plays E♭ instead of D♭ on the two beats over a plain E♭ chord;
the lap's channel gains are 0.15 dB lower (loop −16.38 LUFS). The total stays 26 bars = 40.52 s
(buffer 44.52 s); the music-cache arithmetic is written up for the lead in "Music cache".

## Polish: the swells on the bright cymbal roll

The bank's suspended-cymbal roll was rebuilt bright (SSO's crescendo roll, spectral centroid
about 3.7 kHz instead of 0.6 kHz; it grows evenly into its end). With the channel still boosted for
the old dark roll (+7.2 dB), the swells came through far too strong: the cymbal alone was only 5–8
LU under the mix at their crests and raised it by up to 1.5 LU, nearly as loud as the trumpets.
Re-balanced: `cym` gain +7.2 → +1.2 dB (velocities and lengths unchanged).

Measure (scratch script on the full render, same method as the review): the largest third-octave
rise of the mix over the mix without `cym` (63 Hz–12.5 kHz, bands within 40 dB of the window's
loudest) in the last 150 ms of the swell; "cover" = how much the swell raises the momentary
(400 ms, K-weighted) loudness there; "cymbal" / "trumpets" (`tpt` + `tptS`) = their own momentary
loudness against the mix.

| Swell | Rise before → after | Cover before → after | Cymbal vs mix before → after | Trumpets vs mix |
|---|---|---|---|---|
| intro (0.20 s, 1.23 s) | +27.6 → **+21.6 dB** (10 kHz) | 0.82 → **0.22 LU** | −7.7 → **−13.1 LU** | −0.6 LU |
| bar 7 (10.13 s, 0.70 s) | +26.7 → **+20.7 dB** (7.9 kHz) | 1.53 → **0.44 LU** | −5.3 → **−10.2 LU** | −2.1 LU |
| bar 12 (17.53 s, 1.05 s) | +15.2 → **+9.6 dB** (6.3 kHz) | 1.34 → **0.39 LU** | −5.9 → **−11.0 LU** | −3.3 LU |

Every swell still rises 9.6–21.6 dB in its band at its end, now 7.7–12.5 LU under the trumpets.
Melody channels are untouched; the nine compare.py proofs above give the same results. Render
after the change: "Levels" above.
