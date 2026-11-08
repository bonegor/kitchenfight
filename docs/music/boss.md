# boss — "Galoppo finale" (mini-boss fights)

Fight music for the mini-bosses at 5:00 and 10:00: the galop from the finale of Rossini's
*William Tell* Overture as a cartoon cavalry chase. A symphony orchestra (trumpets, horns, staccato
strings, timpani, cymbals, orchestra hits) has an Italian street band inside it (accordion,
clarinet, guitar, tuba oom-pah, tambourine), with a woodblock "hooves" and slapstick "whip" break.
It opens with a drum roll that grows through the game's fade-in into a brass call.
Song file: `src/audio/songs/boss.ts`.

## Piece

| Piece | Composer | Year | Public domain | Used for |
|-------|----------|------|---------------|----------|
| *Guillaume Tell* (William Tell), Overture: finale, Allegro vivace (the galop, the "cavalry charge") | Gioachino Rossini (1792–1868) | 1829 | Yes: the composer died in 1868; the work is out of copyright everywhere | galop theme, second strain, third part (theme + scale runs), coda arpeggio (also the intro's brass call) |

The reference transcription is reference only and is not committed; the melody was written into
the DSL from it and proven with `scripts/music/compare.py`.

## Reference and how it was read

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
$PY scripts/music/abc2notes.py $REFS/jc_williamtell_201226581.abc --text                 # bar by bar
$PY scripts/music/abc2notes.py $REFS/jc_williamtell_201226581.abc --bars 0-8 --dsl 0.25  # one step = a sixteenth
```

- **`jc_williamtell_201226581.abc`** (grade A in [REFERENCES.md](REFERENCES.md)): "WILLIAM TELL —
  Rondo", *Köhler's Violin Repository* vol. 1 (1885) p. 34 no. 1, arranged by W. B. Laybourn, in
  **E major (Rossini's key)**, 2/4, L:1/16. Theme bars 0–8 (pickup in bar 0, under a repeat), second
  strain 9–17 (pickup in bar 9, `|: … :|`), third part 18–34 (theme + scale runs; its header says it
  has an opening repeat but no closing one, so it is played once), coda 35–41.
- **Reference defects.** Bar 14 is a sixteenth short (`g2g g2gg` where bar 10 has `g2gg g2gg`); the
  song plays bar 10's rhythm there and the comparison declares the bar (`--allow-bars 14 --resync`).
  Bars 28 and 29 are two half bars (`(ag).a.g | (ag).a.g |`) that together make one 2/4 bar, the same
  notes as bar 33; this only affects the bar numbering, not the timing.
- **Harmony.** Köhler has no chord symbols. The harmony was derived from the melody (chord tones on
  the strong sixteenths) and cross-checked against the chord symbols of Barwell's contra-dance version
  (`jc_williamtell_201352798.abc`, in C: theme C C C G7 | C C G7 C, second strain Am … Am D7 | G),
  which agree:
  - theme: E | E | E | B | E | E | B7 | E (I I I V | I I V7 I);
  - second strain (C♯ minor, vi): C♯m | C♯m | C♯m G♯7 | C♯m | C♯m | C♯m | C♯m F♯7 | B. The G♯7
    under the melody's G♯–F♯ (bar 12) is the dominant of C♯m where Barwell holds Am; F♯7 → B is V/V → V,
    with the melody's B over F♯7 as an appoggiatura (a 4–3) to A♯;
  - third part: the theme's harmony, bar 25 = B7 (falling B7 arpeggio), then the runs
    E | B | B7 | B7 | E | B | B7 | B7 → E (strong sixteenths E–G♯, B–D♯, A–A, A–D♯–A: I–V–V7–V7);
  - coda: E; the intro's roll is on the dominant (B) before the call's E.

## Form

♩ = 152 (bpm 152, 4 steps per beat, 8 steps per 2/4 bar), one bar = 0.789 s. Bar numbers are the
song's global bars (`node scripts/music/export-song.mjs boss --form`); every pickup sits in the
last eighth of the section before.

| Section | Song bars | Time (s) | Material (reference bars) | Harmony | Lead / texture |
|---------|-----------|----------|---------------------------|---------|----------------|
| intro | 1–3 | 0.00–2.37 | bar 1: crescendo roll; bars 2–3: brass call on the coda's arpeggio figure (35–36); trumpet pickup (0) | B, then E | bar 1: timpani roll on B (16th triplets), snare roll (32nds), suspended-cymbal roll, pp → f; bars 2–3: brass section + horns 8vb in the galop rhythm, crash + bass drum on the call's downbeat, timpani E/B doubling the rhythm, tuba, snare galop then a crescendo roll |
| A | 4–11 | 2.37–8.68 | galop theme (1–8); the accordion plays the pickup to A2 (0, the repeat) | I I I V I I V7 I | **trumpet**; staccato strings galloping on the chord ("DUM da-da"), tuba oom on both beats, timpani E2/B2, snare galop, crash + bass drum |
| A2 | 12–19 | 8.68–15.00 | theme again (1–8); strings' pickup to B (9) | same | street band: **accordion** + clarinet 8vb, guitar off-beat strums, tuba, tambourine, snare, timpani |
| B | 20–27 | 15.00–21.32 | second strain (10–17) + its repeat pickup (9) | C♯m … F♯7 B | **staccato strings** (violins, spiccato); horns (three hand-voiced parts), pizzicato off-beats, tuba, light snare, triangle |
| B2 | 28–35 | 21.32–27.63 | second strain again (10–17) | same | strings + **xylophone** in unison, accordion 8vb, brass off-beats, horns, tambourine, snare galop |
| brk | 36–43 | 27.63–33.95 | arranger's break on the dominant; the answer quotes the runs figure (33–34); pickup to C (18) | B7 | Rossini crescendo: whip crack + orchestra hit, woodblock hooves, soft horn chord, **horn call** (B7 arpeggio in the galop rhythm), **xylophone + pizzicato answer**, **trumpets' call** an octave up, tutti galop stabs, snare / timpani / cymbal rolls |
| C | 44–58 | 33.95–45.79 | third part (19–34): theme, then the scale runs | theme, then E B B7 B7 E B B7 B7 | tutti: **trumpet + accordion** (horns 8vb) for the theme, galloping strings; runs in **accordion + staccato strings + xylophone 8va**, brass off-beats, horns, bass drum on every bar, crashes, cymbal roll |
| coda | 59–62 | 45.79–48.95 | coda arpeggio (35–38); the trumpet's pickup into A replaces the last two sixteenths of 38 | E | tutti in octaves (accordion, brass, strings, horns 8vb), timpani galop, crash + orchestra hit, cymbal roll into the loop |

The loop runs from A (bar 4, 2.368 s) to the end (48.947 s): **loop body 59 bars = 46.58 s, total
48.95 s** (brief: 45–60 s). Loop seam: the coda's rising E-major arpeggio ends on B5 and the
trumpet's B4–B4 pickup (Köhler's bar 0) leads back into the theme. The second strain ends on
B (V of E) and leads into the break on B7; the break's last bar is the pickup of the third part; the
runs end on F♯ (bar 34) and resolve into the coda's E.

**Why the intro has a roll bar.** The game starts this track with a 0.6 s fade-in
(`src/main.ts`, boss spawn: `audio.playMusic(final ? 'finalboss' : 'boss', { fade: 0.6 })`; the engine ramps the gain
linearly from 0 to 1 while the source starts 10 ms in, so song time *t* is heard at gain
(*t* + 0.01) / 0.6). In the earlier two-bar intro the brass call started on the very first sample:
its full-band downbeat played at 2 % gain and the call reached full level only in its second bar.
Now bar 1 is a crescendo roll that grows through the fade (the fade only deepens it), and the brass
call (still two bars, the brief's "1–2 bar fanfare intro") starts on bar 2 at 0.79 s, when the fade
is complete. The intro plays once; the loop still starts at A (`loopFrom: 1`). Measured on the
sample render with that gain ramp applied (100 ms windows; the "now" column on the current render):

| | before (2-bar intro) | now (3-bar intro) |
|--|----------------------|-------------------|
| the call's first (tutti) downbeat | t = 0, heard at 2 % gain; the call's next notes at 34 %, 51 % and 68 % | t = 0.79 s, with crash, bass drum and the cymbal roll's crest (−5.8 dBFS; the intro's highest peak, −5.7 dBFS, follows in the call at 1.22 s), at full gain |
| first 0.1 s | that downbeat: peak −7.9 dBFS in the file, heard at −24.1 dBFS | the roll's first pp strokes: −26.7 dBFS, heard at −43.6 |
| level heard (400 ms momentary) | −33.7 → −17.7 LUFS over 0–0.8 s, the call already under way | −59.6 → −18.3 LUFS over 0–0.8 s (the roll), −15.8 LUFS at 0.9 s with the call |

Left out on purpose: Köhler's final bars 39–41 (stop chords E5 / E6 and the fermata E4: an ending,
which a loop does not need). Everything else of the rondo is played once, in Köhler's order (theme
twice, strain twice, third part, coda), with the break inserted before the third part.

## Melody proofs (compare.py, default thresholds: pitch ≥ 95 %, rhythm ≥ 90 %, no broken bar)

```bash
PY=/home/user/.venv-audio/bin/python; REFS=/home/user/kitchenfight-refs/abc
WT="--abc $REFS/jc_williamtell_201226581.abc"
$PY scripts/music/compare.py $WT --ref-bars 35-36 --allow-bars 36 --song boss --channel brs --bars 2-3       # intro call = coda figure, 1st statement
$PY scripts/music/compare.py $WT --ref-bars 0-8 --song boss --channel tpt --bars 3-11                       # theme, 1st statement
$PY scripts/music/compare.py $WT --ref-bars 9-17,9 --allow-bars 14 --resync --song boss --channel melS --bars 19-27   # 2nd strain, 1st statement
$PY scripts/music/compare.py $WT --ref-bars 18-34 --song boss --channel acc --bars 43-58                     # third part (theme + runs)
$PY scripts/music/compare.py $WT --ref-bars 35-38 --allow-bars 38 --song boss --channel acc --bars 59-62     # coda arpeggio
$PY scripts/music/compare.py $WT --ref-bars 0-8,0-8,9-17,9 --allow-bars 14 --resync --song boss --channel tpt,acc,melS --bars 3-27   # A + A2 + B in one go
$PY scripts/music/compare.py $WT --ref-bars 0-17,9 --allow-bars 14 --resync --song boss --channel acc,melS --bars 11-27   # REFERENCES.md's theme + strain range (A2 + B)
```

| Passage | Reference bars | Song (channel, global bars) | Pitch | Rhythm | Result | Liberties |
|---------|----------------|-----------------------------|-------|--------|--------|-----------|
| intro brass call (coda figure, 1st statement) | 35–36 | `brs`, 2–3 | 100 % | 100 % | PASS | bar 36: the last two sixteenths (G♯4 G♯4) are replaced by a rest, which leaves the last eighth to the trumpet's B4 B4 pickup into the theme (`--allow-bars 36`; without it 83.3 % / 83.3 %, the two G♯4 missing) |
| galop theme, 1st statement | 0–8 (42 notes) | `tpt`, 3–11 (pickup in intro bar 3) | 100 % | 100 % | PASS | none |
| second strain, 1st statement | 9–17 + 9 (39 notes) | `melS`, 19–27 (pickup in A2's last bar) | 100 % | 100 % | PASS | bar 14 = reference defect (`--allow-bars 14 --resync`, one timing shift re-anchored) |
| third part | 18–34 (106 notes) | `acc`, 43–58 (pickup in the break's last bar) | 100 % | 100 % | PASS | none |
| coda | 35–38 | `acc`, 59–62 | 100 % | 100 % | PASS | bar 38: the last two sixteenths (G♯5 G♯5) are replaced by the trumpet's B4 B4 pickup into the loop (`--allow-bars 38`) |
| theme ×2 + strain | 0–8, 0–8, 9–17, 9 | `tpt,acc,melS`, 3–27 | 100 % | 100 % | PASS | bar 14 as above |
| theme (2nd statement) + strain | 0–17, 9 (76 notes) | `acc,melS`, 11–27 | 100 % | 100 % | PASS | bar 14 as above |

Notes on the commands: the song side uses global bars (no `--section`) so that each statement
includes its pickup, which sits in the previous section. `--ref-bars 9-17,9` adds the reference's own
repeat pickup (`|: gg`), which the strings play at the end of B into B2; without it those two
sixteenths count as extra notes (94 %). Bars 36 (intro) and 38 (coda) are the same deliberate change:
Köhler's arpeggio continues upwards, but here it hands over to the theme's pickup, so the brass and
the coda's instruments stop on the B and the trumpet alone plays B4 B4: a clean hand-over into the
theme instead of the arpeggio's G♯ thickening the pickup a third below. There are no octave
displacements, no tolerated ornaments and no excused notes in any comparison. The restatements (A2
accordion, B2 strings + xylophone, C trumpet, the coda's bars 35–36) are the same notes; the only
varied restatements are the instrumental doublings an octave below (horns in the intro, clarinet in
A2, accordion in B2, horns in C) and above (xylophone in C's runs).

## Instrumentation

| Channel | Instrument id | Role | Range used |
|---------|---------------|------|------------|
| `tpt` | trumpet | theme in A and C, the pickups into A (intro, coda) and C (break) | F♯4–B5 |
| `acc` | accordion | theme in A2 and C, the runs in C, coda; 8vb doubling in B2 | B3–B5 |
| `clar` | clarinet | theme 8vb in A2 (street band) | B3–B4 |
| `gtr` | guitar | off-beat strums in A2 (10 ms down-strum) | D♯3–B3 |
| `melS` | strStab | second strain (B, B2), the runs in C, coda | B3–C♯6 |
| `str` | strStab | galloping chords (A, C) and off-beat chords (C), tutti stabs (break) | F♯3–E4 |
| `pizz` | pizz | off-beats in B; the break's answer (with the xylophone) | F♯3–A4 |
| `xylo` | xylophone | unison with the strings in B2, the break's answer, C's runs 8va | F♯4–A6 |
| `hn` | horn | intro call and coda 8vb, the break's call, theme 8vb in C | B2–B4 |
| `hns` | brassSoft | horn chords: three hand-voiced parts in B and B2, pad in the break and C's runs | F♯3–F♯4 |
| `brs` | brass | intro call, off-beats in B2 and C, the break's trumpet call and tutti stabs, coda | F♯3–B5 |
| `tuba` | tuba | "oom" on both beats (root / fifth), pedal in the break | F♯1–F♯2 |
| `timp` | timpani | intro roll on B2, tonic / dominant drums E2–B2 (G♯2, C♯3, F♯2 in the C♯-minor strain), galop rhythm at cadences, rolls | E2–C♯3 |
| `sn` | snare | intro roll, galop rhythm ("x.oox.oo"), lighter in B, crescendo rolls (32nds) | — |
| `bd` | bassDrum | the intro call's downbeat, phrase downbeats, every bar in C's runs | — |
| `crash` | crash | the intro call's downbeat, section downbeats (piatti) | — |
| `cym` | cymbal | suspended-cymbal rolls: intro bar 1, into C, A and the break's last beat | — |
| `hit` | orchHit | stabs: break (B3), C's and the coda's downbeats (E4) | — |
| `tamb` | tamb | off-beats + accents in A2 and B2 | — |
| `tri` | triangleInst | bar 1, 3, 5, 7 of B | — |
| `wood` | woodblock | hooves in the galop rhythm, break bars 1–6 | — |
| `whip` | slapstick | whip cracks on the break's first and last stab | — |

All ranges are inside the brief's natural ranges (accordion B3–G6, trumpet F♯3–D6, horn B1–F5,
clarinet D3–C7, xylophone F4–C8, tuba D1–F4, guitar E2–B5, violins from G3; the strStab / pizz
notes below G3 use the celli samples). The accordion's B5 lies four semitones above its highest
recorded zone (G5), inside the sampler's pitch-shift limit.

## Arranging notes

- **Key and tempo.** E major, Rossini's and Köhler's key, which sits well for every instrument
  (trumpet and accordion B4–B5, strings G♯5–C♯6). ♩ = 152 in 2/4, the brief's 150–160 galop tempo;
  one step = a sixteenth.
- **Intro.** A roll on the dominant (timpani on B in 16th triplets against the snare's 32nds, both
  pp → f, and a suspended-cymbal roll) resolves into the brass call on E with crash and bass drum,
  the cartoon "drum roll, fanfare" that also covers the game's fade-in (see Form). The timpani's two
  recorded variants alternate stroke by stroke like the two sticks.
- **Accompaniment idioms.** Tuba "oom" on both beats with the "pah" on the off-beats (strings in C,
  guitar in A2, pizzicato in B, brass in B2); galloping strings "DUM da-da" on the chord under the
  theme (A, C); timpani tuned to tonic and dominant doubling the galop rhythm at cadences; snare in the
  galop rhythm with ghost notes; tambourine on the off-beats in the street-band sections.
- **Voice-leading checks.** All chord voicings were listed with
  `export-song.mjs boss --text --channel … --section …`. They lie between D♯3 and A4, under the tune:
  the guitar's strums D♯3–B3 (D♯3–F♯3–B3, E3–G♯3–B3, D♯3–A3–B3), whose top note B3 meets the
  clarinet's line in unison on the theme's repeated B3s (the clarinet's lowest note); strings,
  pizzicato, horns and the brass off-beats F♯3–F♯4 (F♯7 = F♯3–A♯3–E4, G♯7 = G♯3–B♯3–F♯4); the
  break's brass stabs B3–D♯4–A4 (B7 with its seventh on top, under the trumpets' call). The second
  strain has no off-beat chord under the passing D♯ of bar 4 (E–D♯–C♯), which would clash with C♯m
  in close position against the accordion's 8vb line.
- **Horns under the second strain.** In B and B2 the three horns (`hns`) are written out
  (`HORNS_B`) instead of a `pad()`, for the two bars where the tune has non-chord tones:
  - bar 4 (song bars 23 / 31), E5–D♯5–C♯5 over C♯m: G♯3 is tied over from the G♯7, B♯3 resolves
    to C♯4 on the downbeat, and the top horn rests on beat 1 and enters with E4 on beat 2. Nothing
    sits on E4 under the passing D♯5, and in B2 the accordion's 8vb D♯4 meets only the horns' C♯4
    (a passing second) instead of a C♯4–D♯4–E4 cluster;
  - bar 7 (song bars 26 / 34), B5 → A♯5 over F♯7: the horns have their own 4–3, F♯7sus4
    (F♯3–B3–E4) under the B5 appoggiatura and F♯7 (F♯3–A♯3–E4) with the A♯5, then B major
    (F♯3–B3–D♯4) in bar 8. Before, the pad's A♯3 sounded against the B5 (and the accordion's B4 in
    B2), a minor ninth, for an eighth.

  Common tones are tied across the chord changes; the horns breathe and re-articulate at the
  half-strain (bar 5). Listing every sixteenth of the melody against the horns now finds no minor
  second or major seventh in B and B2 except the tune's own lower neighbour A♯5 against the B
  chord's root in bar 8 (Köhler's B–A♯–B over B major). The break and C's runs keep `pad()`.
- **Articulation.** Brass and horn lines are tongued and detached (gate 0.8; the sustain samples
  default to 0.92), the reeds slightly detached (0.85); the staccato strings are spiccato, the tuba
  0.7. The trumpet rests through A2–B2 (the clarinet and strings take over), so no line plays longer
  than eight bars without a breath.
- **Timing of the slow attacks (no song-side compensation).** An earlier version advanced the
  slow-speaking channels per pitch (`SPEAK` / `tight()`: tuba, accordion, horn, clarinet, brass,
  trumpet, staccato strings, 8–66 ms earlier than the grid), measured on an older sample bank. On
  the bank that followed it already over-compensated (the accordion, clarinet, horn, tuba and
  staccato strings sounded 14–29 ms ahead of the snare and timpani, the horn section 15 ms behind:
  first column below). The bank now aligns sustained attacks itself (see
  `docs/credits/music-samples.md`, "Timing"): every bowed / blown / sung / accordion zone has its beat
  on the perceptual onset of what it plays — the 5 ms RMS reaching −10 dB of the note's peak, or for
  a note that dwells on a plateau below that, its attack — notes keep their sounding length, a note
  shorter than its attack goes on its own onset, and two takes played together on the onset of their
  sum. So the table is gone, and nothing in the song is shifted any more.

  **In-song check** (each channel rendered solo, dry, through the game renderer with the recorded
  bank; a note's onset is the 5 ms RMS reaching −10 dB of its peak after the valley before it,
  measured on the articulated notes (15 dB or more above what precedes them); the reference is the
  cleanest percussion attack on the same grid step — timpani, bass drum, crash, tambourine, snare;
  median offset in ms, negative = ahead of the percussion; notes measured in brackets):

  | Channel | With `SPEAK`, previous bank | Now |
  |---------|-----------------------------|-----|
  | accordion | −16.1 (7) | +1.5 (5) |
  | staccato strings, tune / chords | −28.5 / −29.3 (19 / 5) | −0.4 / +0.7 (21 / 5) |
  | clarinet | −17.8 (1) | +1.4 (1) |
  | horn | −13.7 (5) | +1.2 (5) |
  | horn section | +14.6 (2) | +10.0 (2) |
  | brass section | +1.8 (8) | +1.1 (22) |
  | tuba | −21.0 (65) | +5.1 (65) |

  (The trumpet's notes all join the line legato, with no articulated note on a percussion step.)
  80–100 % of each channel's articulated notes are now within 10 ms of the percussion (the horn
  section: one of its two), against 0–75 % before. The tuba's oom speaks with the snare and timpani on
  both beats (p10–p90 +2.2…+8.7 ms, before −34…−4), and the accordion's sixteenth lines no longer
  drift by pitch. The channel gains are those the song was balanced with: on the aligned bank a note
  keeps its sounding length and loudness, only its placement moved.
- **Accordion left hand.** The accordion's chord voice (`accChord`) is not used: on the bank the song
  was arranged with, its low zones' beats sat early in a ~100 ms build-up, too slow for off-beat stabs
  at this tempo, so the street band's off-beats went to the guitar. (On the aligned bank the build-up
  sounds before the beat and the chord voice reaches −6 dB of its sustain within 8 ms of it; the
  off-beats stay with the guitar's plucked attack.)

## Levels (recorded samples)

`node scripts/music/render-song.mjs boss out.wav` (recorded sample bank, 54 sets):

| Measure | Value |
|---------|-------|
| duration | 48.95 s of music; rendered buffer 54.95 s (with the 6 s loop pad) |
| loop window | music 2.368 → 48.947 s (buffer 8.368 → 54.947 s), body 46.58 s = bars 4–62 from section A; seam mismatch −150.5 dBFS |
| loudness | loop body **−16.35 LUFS** integrated (target −16.4 ± 0.5; whole file −16.43), short-term max −14.7 LUFS |
| peak / RMS | sample peak **−2.80 dBFS**, RMS −19.6 dBFS |
| soft clipper | 25 samples (0.000 %) |
| spectral balance | < 250 Hz −8.4 dB, 250 Hz–4 kHz −0.8 dB, > 4 kHz −18.5 dB of the energy |
| warnings | none (no skipped instrument, no note ringing past the seam) |
| master | `gainDb: -0.3`; reverb rt60 1.5 s, size 1.15, wet 1.25 (a hall, kept short for the fast tempo) |

Per-channel solo levels over the loop body (from the same report): trumpet −2.6 LU against the mix,
accordion −2.9, staccato strings (tune) −3.3, brass −8.9, horn −10.7, timpani −11.1, clarinet −11.2,
xylophone −11.8, guitar −12.9, tuba −13.0, galloping strings −13.7, horn section −14.4, snare −14.8,
suspended cymbal −16.1, tambourine −16.6, orchestra hit −17.0, pizzicato −17.7, crash −17.8,
bass drum −18.0, woodblock −20.2, whip −20.8, triangle −20.8; no channel's loudest 3 s is more than
30 LU below the mix (render-song's audibility check passes).

Per section (solo stems rendered with the renderer's `solo` option, BS.1770 integrated loudness per
section window, the loop sections as they repeat; the lead is the combined unison line where
several instruments share the tune; "percussion" = snare, bass drum, crash, suspended cymbal,
tambourine, triangle, woodblock, whip, orchestra hit):

| Section | intro roll (bar 1) | intro call (2–3) | A | A2 | B | B2 | brk | C theme | C runs | coda |
|---------|-------|------|---|----|---|----|-----|---------|--------|------|
| mix (LUFS) | −22.7 | −16.0 | −17.1 | −15.9 | −18.1 | −15.6 | −19.8 | −15.0 | −15.3 | −15.6 |
| lead vs mix (LU) | — (timpani + snare + cymbal roll only) | brass −2.7, brass + horns −1.6 | trumpet −1.1 | accordion −1.4 | strings −1.0 | strings + xylophone −1.7 (with the accordion 8vb −0.9) | brass (trumpet call, stabs) −2.7, horn call −3.8 | trumpet + accordion −0.9 | accordion + strings + xylophone −1.5 | accordion + strings + brass −1.5 |
| tuba + timpani + bass drum (LU) | −3.0 | −7.3 | −9.0 | −10.2 | −11.3 | −12.2 | −6.7 | −10.3 | −9.2 | −7.8 |
| percussion (LU) | −3.3 | −9.7 | −13.7 | −13.2 | −13.7 | −13.6 | −9.2 | −15.5 | −14.1 | −13.1 |

The melody is on top in every section of the loop (within 0.9–2.7 LU of the mix; in the break the
calls alternate between horns and trumpets), bass and percussion sit 7–15.5 LU below the mix. The
intro's roll is the only all-percussion moment: a pp → f crescendo (−22.7 LUFS over its bar without
the game's fade) into the call. The horn chords sit 12.3 (B) and 14.8 (B2) LU under the mix. The
dynamic arc is A → A2 a little fuller → B lighter (−1.0 LU below A) → B2 → the break (quietest
moment: short-term −22.7 LUFS over its first 3 s, building to the tutti stabs) → C and the coda as
the climax (+1.5 to +2.1 LU over A). Over the loop the short-term (3 s) loudness stays between
−18.2 and −15.1 LUFS 80 % of the time (median −16.1).

The synth fallback (`--synth`) plays every channel (no skipped instrument) and measures −16.5 LUFS
over the loop body (whole file −16.7, peak −3.98 dBFS, no warnings): within 0.2 LU of the recorded
bank, whose instruments the sampler calibrates against their synth versions
(`scripts/audio/calibrate_instruments.mjs`).

## Polish: the cymbal rolls on the bright roll

The bank's suspended-cymbal roll (variant 1) is bright (SSO's crescendo roll, spectral centroid
about 4 kHz on its peak instead of the old VCSL roll's 0.6 kHz). A review had found the four rolls
inaudible with the old, dark roll, and the channel was re-balanced for the bright one (`cym`
−9.7 → −5.2 dB, the break's short roll 0.7 → 0.84, the roll into the coda 0.6 → 0.66).

A second review found that the rolls did not reach their downbeats: the cymbal was gated at 90 % of
the written length, so the release began up to 0.16 s before the downbeat (the rolls into and out
of the coda were 1.7 dB down when it arrived), and the roll's crescendo was 0.76 s long, so the
1.58 s rolls grew for 0.76 s and then held flat. Both are fixed in the sampler (see
`docs/credits/music-samples.md`): the cymbal plays its written length, and every roll note grows
evenly over its whole length into its peak on the downbeat. Its crest is now set by its velocity
alone (before, a roll shorter than the crescendo ended below the peak), and the held roll plays at
the stereo loudness of the old VCSL roll, 1.5 dB under the bright roll's first build. Re-balanced so
every roll crests where it crested before, now on its downbeat: `cym` gain −5.2 → −4.2 dB, the
intro roll 0.45 → 0.4, the break's 0.84 → 0.7, the roll into the coda 0.66 → 0.75, the coda's
0.55 → 0.62.

Measure (scratch scripts on the full render, recorded bank, the review's method): "crest" and "on
the downbeat" = the cymbal's own level (`cym` solo, K-weighted, over the 150 ms up to that point) at
the end of its gate and at the written downbeat; "rise" = the largest third-octave rise of the mix
over the mix without `cym` (63 Hz–12.5 kHz, bands within 40 dB of the window's loudest) in the last
150 ms before the downbeat; "cover" = how much the roll raises the momentary (400 ms, K-weighted)
loudness there; "cymbal" / "lead" = their own momentary loudness against the mix (lead = trumpet,
accordion, strings, brass and horns, whichever plays).

| Roll | Crest, before → now | On the downbeat, before → now | Rise | Cover | Cymbal vs mix | Lead vs mix |
|---|---|---|---|---|---|---|
| intro, bar 1 (0.00 s, 0.79 s) | −34.5 → −34.7 dB | −34.4 → **−34.7 dB** | **+7.5 dB** at 6.3 kHz | 0.07 LU | −17.6 LU | (timpani, snare and cymbal only) |
| break, last beat (33.35 s, 0.59 s) | −27.0 → −26.9 dB | −26.2 → **−26.9 dB** | **+11.0 dB** at 6.3 kHz | 0.27 LU | −12.7 LU | −2.8 LU |
| into the coda (44.21 s, 1.58 s) | −26.1 → −26.0 dB | −27.8 → **−26.0 dB** | **+9.9 dB** at 10 kHz | 0.25 LU | −12.5 LU | −1.3 LU |
| coda, into A (47.37 s, 1.58 s) | −28.7 → −28.7 dB | −30.4 → **−28.7 dB** | **+18.8 dB** at 6.3 kHz | 0.22 LU | −13.1 LU | −1.3 LU |

The 1.58 s rolls now grow by about 15 dB over their whole length; before, they gained 3 dB after
their first 0.75 s and lost 1.7 dB again before the downbeat.
Every roll rises 7.5–18.8 dB in its band in the last 150 ms before its downbeat, is at its loudest
there, and stays 9.9–11.8 LU under the tune, adding at most 0.27 LU to the mix. Melody channels are
untouched; the seven compare.py proofs above give the same results. Render after the change: the
"Levels" table above.
