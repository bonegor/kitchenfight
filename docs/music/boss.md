# boss — "Galoppo finale" (mini-boss fights)

Fight music for the mini-bosses at 5:00 and 10:00: the galop from the finale of Rossini's
*William Tell* Overture as a cartoon cavalry chase. A symphony orchestra (trumpets, horns, staccato
strings, timpani, cymbals, orchestra hits) has an Italian street band inside it (accordion,
clarinet, guitar, tuba oom-pah, tambourine), with a woodblock "hooves" and slapstick "whip" break.
Song file: `src/audio/songs/boss.ts`.

## Piece

| Piece | Composer | Year | Public domain | Used for |
|-------|----------|------|---------------|----------|
| *Guillaume Tell* (William Tell), Overture: finale, Allegro vivace (the galop, the "cavalry charge") | Gioachino Rossini (1792–1868) | 1829 | Yes: the composer died in 1868; the work is out of copyright everywhere | galop theme, second strain, third part (theme + scale runs), coda arpeggio |

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
    with the melody's B over F♯7 as an appoggiatura to A♯;
  - third part: the theme's harmony, bar 25 = B7 (falling B7 arpeggio), then the runs
    E | B | B7 | B7 | E | B | B7 | B7 → E (strong sixteenths E–G♯, B–D♯, A–A, A–D♯–A: I–V–V7–V7);
  - coda: E.

## Form

♩ = 152 (bpm 152, 4 steps per beat, 8 steps per 2/4 bar), one bar = 0.789 s. Bar numbers are the
song's global bars (`node scripts/music/export-song.mjs boss --form`); every pickup sits in the
last eighth of the section before.

| Section | Song bars | Time (s) | Material (reference bars) | Harmony | Lead / texture |
|---------|-----------|----------|---------------------------|---------|----------------|
| intro | 1–2 | 0.00–1.58 | brass call on the coda's arpeggio figure (35–36); trumpet pickup (0) | E | brass section + horns 8vb in the galop rhythm, timpani E/B doubling the rhythm, tuba, snare galop then a crescendo roll |
| A | 3–10 | 1.58–7.89 | galop theme (1–8); the accordion plays the pickup to A2 (0, the repeat) | I I I V I I V7 I | **trumpet**; staccato strings galloping on the chord ("DUM da-da"), tuba oom on both beats, timpani E2/B2, snare galop, crash + bass drum |
| A2 | 11–18 | 7.89–14.21 | theme again (1–8); strings' pickup to B (9) | same | street band: **accordion** + clarinet 8vb, guitar off-beat strums, tuba, tambourine, snare, timpani |
| B | 19–26 | 14.21–20.53 | second strain (10–17) + its repeat pickup (9) | C♯m … F♯7 B | **staccato strings** (violins, spiccato); horns sustained, pizzicato off-beats, tuba, light snare, triangle |
| B2 | 27–34 | 20.53–26.84 | second strain again (10–17) | same | strings + **xylophone** in unison, accordion 8vb, brass off-beats, horns, tambourine, snare galop |
| brk | 35–42 | 26.84–33.16 | arranger's break on the dominant; the answer quotes the runs figure (33–34); pickup to C (18) | B7 | Rossini crescendo: whip crack + orchestra hit, woodblock hooves, soft horn chord, **horn call** (B7 arpeggio in the galop rhythm), **xylophone + pizzicato answer**, **trumpets' call** an octave up, tutti galop stabs, snare / timpani / cymbal rolls |
| C | 43–57 | 33.16–45.00 | third part (19–34): theme, then the scale runs | theme, then E B B7 B7 E B B7 B7 | tutti: **trumpet + accordion** (horns 8vb) for the theme, galloping strings; runs in **accordion + staccato strings + xylophone 8va**, brass off-beats, horns, bass drum on every bar, crashes, cymbal roll |
| coda | 58–61 | 45.00–48.16 | coda arpeggio (35–38); the trumpet's pickup into A replaces the last two sixteenths of 38 | E | tutti in octaves (accordion, brass, strings, horns 8vb), timpani galop, crash + orchestra hit, cymbal roll into the loop |

The loop runs from A (bar 3, 1.579 s) to the end (48.158 s): **loop body 59 bars = 46.58 s, total
48.16 s**. Loop seam: the coda's rising E-major arpeggio ends on B5 and the trumpet's B4–B4 pickup (Köhler's
bar 0) leads back into the theme. The second strain ends on
B (V of E) and leads into the break on B7; the break's last bar is the pickup of the third part; the
runs end on F♯ (bar 34) and resolve into the coda's E.

Left out on purpose: Köhler's final bars 39–41 (stop chords E5 / E6 and the fermata E4: an ending,
which a loop does not need). Everything else of the rondo is played once, in Köhler's order (theme
twice, strain twice, third part, coda), with the break inserted before the third part.

## Melody proofs (compare.py, default thresholds: pitch ≥ 95 %, rhythm ≥ 90 %, no broken bar)

```bash
PY=/home/user/.venv-audio/bin/python; REFS=/home/user/kitchenfight-refs/abc
WT="--abc $REFS/jc_williamtell_201226581.abc"
$PY scripts/music/compare.py $WT --ref-bars 0-8 --song boss --channel tpt --bars 2-10                        # theme, 1st statement
$PY scripts/music/compare.py $WT --ref-bars 9-17,9 --allow-bars 14 --resync --song boss --channel melS --bars 18-26   # 2nd strain, 1st statement
$PY scripts/music/compare.py $WT --ref-bars 18-34 --song boss --channel acc --bars 42-57                      # third part (theme + runs)
$PY scripts/music/compare.py $WT --ref-bars 35-38 --allow-bars 38 --song boss --channel acc --bars 58-61      # coda arpeggio
$PY scripts/music/compare.py $WT --ref-bars 0-8,0-8,9-17,9 --allow-bars 14 --resync --song boss --channel tpt,acc,melS --bars 2-26   # A + A2 + B in one go
$PY scripts/music/compare.py $WT --ref-bars 0-17,9 --allow-bars 14 --resync --song boss --channel acc,melS --bars 10-26   # REFERENCES.md's theme + strain range (A2 + B)
```

| Passage | Reference bars | Song (channel, global bars) | Pitch | Rhythm | Result | Liberties |
|---------|----------------|-----------------------------|-------|--------|--------|-----------|
| galop theme, 1st statement | 0–8 (42 notes) | `tpt`, 2–10 (pickup in intro bar 2) | 100 % | 100 % | PASS | none |
| second strain, 1st statement | 9–17 + 9 (39 notes) | `melS`, 18–26 (pickup in A2's last bar) | 100 % | 100 % | PASS | bar 14 = reference defect (`--allow-bars 14 --resync`, one timing shift re-anchored) |
| third part | 18–34 (106 notes) | `acc`, 42–57 (pickup in the break's last bar) | 100 % | 100 % | PASS | none |
| coda | 35–38 | `acc`, 58–61 | 100 % | 100 % | PASS | bar 38: the last two sixteenths (G♯5 G♯5) are replaced by the trumpet's B4 B4 pickup into the loop (`--allow-bars 38`) |
| theme ×2 + strain | 0–8, 0–8, 9–17, 9 | `tpt,acc,melS`, 2–26 | 100 % | 100 % | PASS | bar 14 as above |
| theme (2nd statement) + strain | 0–17, 9 (76 notes) | `acc,melS`, 10–26 | 100 % | 100 % | PASS | bar 14 as above |

Notes on the commands: the song side uses global bars (no `--section`) so that each statement
includes its pickup, which sits in the previous section. `--ref-bars 9-17,9` adds the reference's own
repeat pickup (`|: gg`), which the strings play at the end of B into B2; without it those two
sixteenths count as extra notes (94 %). There are no octave displacements, no tolerated ornaments
and no excused notes in any comparison. The restatements (A2 accordion, B2 strings + xylophone,
C trumpet) are the same notes; the only varied restatements are the instrumental doublings an
octave below (clarinet in A2, accordion in B2, horns in C) and above (xylophone in C's runs).

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
| `hn` | horn | intro and coda 8vb, the break's call, theme 8vb in C | B2–B4 |
| `hns` | brassSoft | sustained chords (B, B2, break, C's runs) | F♯3–F♯4 |
| `brs` | brass | intro call, off-beats in B2 and C, the break's trumpet call and tutti stabs, coda | F♯3–B5 |
| `tuba` | tuba | "oom" on both beats (root / fifth), pedal in the break | F♯1–F♯2 |
| `timp` | timpani | tonic / dominant drums E2–B2 (G♯2, C♯3, F♯2 in the C♯-minor strain), galop rhythm at cadences, rolls | E2–C♯3 |
| `sn` | snare | galop rhythm ("x.oox.oo"), lighter in B, crescendo rolls (32nds) | — |
| `bd` | bassDrum | phrase downbeats, every bar in C's runs | — |
| `crash` | crash | section downbeats (piatti) | — |
| `cym` | cymbal | suspended-cymbal rolls into C, A and the break's last beat | — |
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
- **Accompaniment idioms.** Tuba "oom" on both beats with the "pah" on the off-beats (strings in C,
  guitar in A2, pizzicato in B, brass in B2); galloping strings "DUM da-da" on the chord under the
  theme (A, C); timpani tuned to tonic and dominant doubling the galop rhythm at cadences; snare in the
  galop rhythm with ghost notes; tambourine on the off-beats in the street-band sections.
- **Voice-leading checks.** All chord voicings were listed with
  `export-song.mjs boss --text --channel … --section …` and kept between F♯3 and F♯4 (F♯7 = F♯3–A♯3–E4,
  G♯7 = G♯3–B♯3–F♯4), under the tune. The second strain has no off-beat chord under the passing D♯ of
  bar 4 (E–D♯–C♯), which would otherwise clash with C♯m in close position against the accordion's
  8vb line. The guitar strums sit below the clarinet (D♯3–B3).
- **Articulation.** Brass and horn lines are tongued and detached (gate 0.8; the sustain samples
  default to 0.92), the reeds slightly detached (0.85); the staccato strings are spiccato, the tuba
  0.7. The trumpet rests through A2–B2 (the clarinet and strings take over), so no line plays longer
  than eight bars without a breath.
- **Speaking-delay compensation.** The sampler puts each sample's physical onset (−30 dB) on the
  beat, but the recorded attacks reach −9 dB of their peak at very different times. Measured on
  isolated notes rendered through the game renderer (scratch song, this song's registers and
  velocities): snare 1.7 ms, timpani 1.3, xylophone 0.5, guitar 1–18 (mostly under 8), woodblock 10;
  trumpet 10, brass section 12, horn 22, clarinet 27, tuba 29–34, pizzicato 38, staccato strings 33–44,
  accordion 43 at B4 (16–102 ms depending on the zone), accordion chord voice 104 ms at G♯3. At
  ♩ = 152 a sixteenth is 99 ms, so the strings and tuba would drag behind the snare. Like players of
  slow-speaking instruments, those channels start about 0.7 × their delay earlier (`SPEAK` in the
  song: trumpet 8 ms, brass 8, guitar 6, horn 15, clarinet 18, tuba 22, pizzicato 20, accordion 25,
  staccato strings 25–30) through the event `offSec`; the song's very first downbeat (intro, step 0)
  is left unshifted so no attack is cut at t = 0. The accordion's left-hand chord voice (`accChord`)
  was dropped for the same reason: its low zones take ~100 ms to speak, too slow for off-beat stabs at
  this tempo, so the street band's off-beats went to the guitar.

## Levels (recorded samples)

`node scripts/music/render-song.mjs boss out.wav` (recorded sample bank, 53 sets):

| Measure | Value |
|---------|-------|
| duration | 48.16 s of music; rendered buffer 52.16 s (with the 4 s loop pad) |
| loop window | 1.579 → 48.158 s, body 46.58 s = bars 3–61 from section A; seam mismatch −127.0 dBFS |
| loudness | loop body **−16.4 LUFS** integrated (whole file −16.5), short-term max −14.7 LUFS |
| peak / RMS | sample peak **−4.02 dBFS**, RMS −19.7 dBFS |
| soft clipper | 6 samples (0.000 %) |
| spectral balance | < 250 Hz −9.0 dB, 250 Hz–4 kHz −0.6 dB, > 4 kHz −19.0 dB of the energy |
| warnings | none |
| master | `gainDb: -0.3`; reverb rt60 1.5 s, size 1.15, wet 1.25 (a hall, kept short for the fast tempo) |

Per-channel solo levels over the loop body (from the same report): trumpet −2.1 LU against the mix,
accordion −2.9, staccato strings (tune) −3.6, brass −9.0, horn −10.5, timpani −10.9, clarinet −11.2,
xylophone −11.8, guitar −12.9, tuba −13.0, galloping strings −13.3, horn section −14.5, snare −15.0,
tambourine −16.7, orchestra hit −16.9, pizzicato −17.6, bass drum −17.9, crash −17.9, triangle
−21.0, woodblock −20.4, whip −20.9, suspended cymbal −21.3; no channel's loudest 3 s is more than
30 LU below the mix (render-song's audibility check passes).

Per section (solo stems rendered with the renderer's `solo` option, BS.1770 integrated loudness per
section window; the lead is the combined unison line where several instruments share the tune):

| Section | intro | A | A2 | B | B2 | brk | C theme | C runs | coda |
|---------|-------|---|----|---|----|-----|---------|--------|------|
| mix (LUFS) | −16.6 | −16.8 | −16.0 | −18.2 | −15.6 | −19.9 | −14.9 | −15.8 | −15.7 |
| lead vs mix (LU) | brass −2.3 | trumpet −1.0 | accordion −1.4 | strings −1.0 | strings + xylophone −1.8 | brass (trumpet call, stabs) −2.5, horn call −3.5 | trumpet + accordion −0.8 | accordion + strings + xylophone −1.6 | accordion + strings + brass −1.6 |
| tuba + timpani + bass drum (LU) | −8.1 | −9.3 | −10.2 | −11.2 | −12.3 | −6.7 | −10.4 | −8.8 | −7.7 |
| all percussion (LU) | −10.2 | −14.0 | −13.3 | −13.9 | −13.8 | −9.6 | −16.2 | −13.9 | −13.9 |

The melody is on top in every section (within 0.8–2.5 LU of the mix; in the break the calls
alternate between horns and trumpets), bass and percussion sit 6–16 LU below the mix. The dynamic arc is A → A2 a little fuller → B lighter (−1.4 LU below A) → B2 → the
break (quietest moment: short-term −22.5 LUFS at its start, building to the tutti stabs) → C and the
coda as the climax (+1 to +2 LU over A). Over the loop the short-term (3 s) loudness stays between
−18.4 and −15.3 LUFS 80 % of the time.

The synth fallback (`--synth`) plays every channel (no skipped instrument) and measures −14.2 LUFS,
2.2 LU louder, as expected for the synth set (see [`../MUSIC.md`](../MUSIC.md)).
