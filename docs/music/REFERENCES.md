# Reference transcriptions: triage

Which ABC file to check each arrangement against, which bars hold the famous theme, and what is
wrong with the other candidates. Every file in `/home/user/kitchenfight-refs/abc/` was parsed with
`scripts/music/abc2notes.py --list`. Candidates for the same piece were cross-compared with
`scripts/music/compare.py --abc A --cand-abc B` (transposition and time-scale invariant). The
percentages below are those comparisons, re-measured with the current scoring (merged repeated
notes, displaced notes and left-out short notes count against a candidate; see
[`../MUSIC.md`](../MUSIC.md)). "100 % / 97 %" means pitch / rhythm.

```bash
PY=/home/user/.venv-audio/bin/python
REFS=/home/user/kitchenfight-refs/abc
# every command below continues with the song side, e.g.
#   --song title --channel acc --section A        (or --song-file scratch.ts --export name)
```

**Bar numbers** are the ones printed by `$PY scripts/music/abc2notes.py FILE --text`. A pickup bar
is bar 0, otherwise the first bar is bar 1, and every bar line counts, including the two halves
of a bar split by a repeat sign. Ranges such as `1-8,1-6,9` are played in the order given.

**Trust grades**

| Grade | Meaning |
|-------|---------|
| **A** | Clean notation, confirmed by at least one independent source (≥ 95 % pitch agreement on the theme). |
| **B** | Clean notation and plausible, but a single source or one transcriber's family. |
| **C** | Usable with care: MIDI-derived timing, an arrangement or an unsourced excerpt. Check pitches and treat rhythm as a hint. |
| **X** | Do not use: mislabelled, a different piece, or not the original composer's music. |

**Reading compare results.** When an unrelated tune is "located" inside a long reference it
still reaches about 25–55 % pitch, and its rhythm can score high when the meter matches. That is
the noise floor. Real matches of the right tune score above 90 % pitch. Two editions of the same
tune often FAIL the default thresholds on rhythm (ties against re-struck notes, evened dotted
figures). That is information about the editions, not a tool error.

## Summary

| Piece | Best reference (grade) | Famous theme | Problem |
|-------|------------------------|--------------|---------|
| Funiculì Funiculà | `bb_funiculi.abc` V:1 (A) | refrain bars 38–53 | none |
| 'O sole mio | `jc_solemio_201318418.abc` X:1 (B) | refrain 17–32 | single transcriber |
| Anvil Chorus | `col_101best.abc` X:9 (A) | theme 12–19 | English hymn words; key signature F for a B♭ tune |
| Brindisi (Libiamo) | `lotro_brindisi.abc` X:24 (C) and `bb_libiamo.abc` S (B) | verse 2–17 (LOTRO), refrain 1–9 (bb) | verse only in a MIDI-derived file |
| La Danza | `bb_ladanza1.abc` V:1 (C) | verse 49–64, refrain 110–124 | single arranged source |
| Tarantella Napoletana | `jc_tarantellanap_201233905.abc` X:16 (A) | strain B 9–17 | none |
| Dance of the Hours | **none trustworthy**: `wf_dance_of_hours.abc` 6–13 only (C) | theme 6–13 | Manning's 1962 song; no Ponchielli source |
| La gazza ladra | **none for the overture**; `jc_gazza_201234966.abc` (B, probably a different number) | — | overture only as a messy MIDI dump |
| William Tell galop | `jc_williamtell_201226581.abc` (A) | theme 0–8 | bar 14 one 16th short (displaces bars 15 on) |
| Dies Irae (Verdi) | `lotro_diesirae.abc` part 2 (C) | opening pseudo-bars 1–9 | Verdi confirmed, but unquantised, no bar lines |
| Triumphal March (Aida) | `wf_aida_march.abc` (B) | theme 1–12 | single source |
| Vesti la giubba | `bb_pagliacci1.abc` (A) | "Ridi, Pagliaccio" 26–33 | none |

---

## Funiculì Funiculà (Luigi Denza, 1880). Grade A

**Use:** `bb_funiculi.abc` voice 1. "34. A Merry Life", a songbook print in E♭ with a clean melody
line. In the refrain the melody is the top note of printed thirds. It is complete with no repeats
and no bar problems:
verse 1–18 (pickup inside bar 1), middle section in the relative minor 19–37, and the refrain
("Jammo, jammo… Funiculì, funiculà", English "Hark-en! Hark-en!… Tra la la") 38–53.

```bash
$PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 38-53 …   # refrain
$PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 1-18 …    # verse
$PY scripts/music/compare.py --abc $REFS/bb_funiculi.abc --voice 1 --ref-bars 19-37 …   # middle
```

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `bb_funiculi.abc` V:1 | A | As above. The refrain is identical to the Everyday Song Book (100 % / 100 %), and so is the verse once the song book's short bar 9 is allowed for (100 % / 97 % with `--resync`). The piffero part and the session book match the refrain at 100 % / 98 %. V:2 is the bass line, refrain only. |
| `jc_funiculi_201229790.abc` X:129 | A | "A Merry Heart", The Everyday Song Book (1927), E♭. Same notes, with the verse and refrain under `\|: :\|`, so use `--expand-repeats`. The refrain is bars 29–44. Bar 9, before the repeat, is an eighth short, so the repeated verse (the `:\|` has no start sign, so the repeat includes the pickup) comes an eighth early: compare across it with `--resync`. |
| `jc_funiculi_201273539.abc` #132 (X:129) | A | The whole Everyday Song Book (224 tunes). This tune is a duplicate of the file above (`--title funiculi`). |
| `wf_funiculi.abc` | B | F-major lead sheet with chord symbols, but the header says **K:C**: the key signature is mislabelled and the B♭s are written as accidentals. Refrain bars 38–54. Deviations: the bar 37 lead-in run A–B♮–C–D appears in no other source, and its B♮ should probably be B♭. Bar 8 has "A G F" in even eighths where bar 17 and all other sources have "A G2 F". There is an extra empty bar 50, so everything after it is a bar late: compare 38–49 (100 % / 97 % against bb) or use `--resync` (98 % / 94 %). |
| `jc_tarantellanap_201233923.abc` X:5 (G); `…201233979.abc` X:6 (A) | B | Session-book version with chords. Strains A/B/C are complete (refrain 29–44). The held note on "far" is shortened. |
| `jc_funiculi_201278317.abc` | C | Piffero part in G (refrain 30–45). Bars 12–13 have `^c2=c` (C♮) where every other source has C♯. |

## 'O sole mio (Eduardo di Capua, 1898). Grade B

**Use:** `jc_solemio_201318418.abc --tune 1`, in G with the Neapolitan lyrics: verse 1–16 ("Che
bella cosa…"), refrain 17–32 ("Ma n'atu sole… 'O sole mio sta 'nfronte a te"), coda 33–36.
Verse and refrain sit under `|: :|`.

```bash
$PY scripts/music/compare.py --abc $REFS/jc_solemio_201318418.abc --tune 1 --ref-bars 17-32 …  # refrain
$PY scripts/music/compare.py --abc $REFS/jc_solemio_201318418.abc --tune 1 --ref-bars 1-16 …   # verse
```

All candidates come from one transcriber (John Chambers), so they are not independent. They agree
with each other at 98–100 % pitch and match the well-known tune; the rhythms differ in ties and
fermatas, as listed.

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `jc_solemio_201318418.abc` X:1 (G) / X:2 (A) | B | As above. X:2 is the same tune a tone higher (100 % / 92 %): it ties notes X:1 re-strikes, and bars 16 and 18 differ in rhythm. |
| `jc_solemio_201318427.abc` (G) | B | Same tune with ties instead of rests (100 % / 92 %). No lyrics. |
| `jc_solemio_201318604.abc` (G) | B− | 2022 "modified for sessions": the refrain fermatas are evened out (`z2g2 \| g2f2`), which is not original (99 % / 51 %). |
| `jc_solemio_201318421.abc` (D) | B− | Rhythm variant in bar 3 (`zD/E/ F>D`): 98 % / 79 % against X:1. |
| `jc_tarantellanap_201233905.abc` X:14 (C), `…201233979.abc` X:16 (D) | B | Session books, 100 % / 99–100 %. They include the coda. |

## Anvil Chorus (Verdi, *Il Trovatore*). Grade A

**Use:** `col_101best.abc --tune 9`, from "The One Hundred and One Best Songs" (1919). It is in B♭,
written with K:F plus accidentals, under English hymn words ("God of the nations"). Bars 2–10 hold
the opening tune of "Vedi! le fosche notturne spoglie", bars 12–19 the famous anvil theme ("Chi
del gitano i giorni abbella?", twice), and bars 20–26 the close.

```bash
$PY scripts/music/compare.py --abc $REFS/col_101best.abc --tune 9 --ref-bars 12-19 …   # anvil theme
$PY scripts/music/compare.py --abc $REFS/col_101best.abc --tune 9 --ref-bars 2-10 …    # opening
```

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `col_101best.abc` X:9 | A | As above. A 1919 songbook arrangement whose theme agrees note for note with Kerr's independent version (bars 12–19 against Kerr 1–8: 100 % / 100 %). Only the last two bars of the close differ (12–26 against all of Kerr: 96 % / 100 %): Kerr's instrumental close goes leading tone to tonic (C♯–D in D) where the song book sings the 4th falling to the 3rd. |
| `jc_anvil_201241357.abc` "ANVIL CHORUS" | A | Kerr's *Merry Melodies* #329, in D. Theme in bars 1–8 (= col 12–19), close in 9–15. |
| `jc_anvil_201226320.abc` | — | Byte-identical copy of `col_101best.abc`, the whole book. Only X:9 is Verdi. |
| `jc_anvil_201241373.abc` | **X** | Mislabelled. "YONDER PILE BLAZING" is **"Stride la vampa"** (Azucena), not the Anvil Chorus. |
| `jc_anvil_201241355.abc` | **X** | "LET ME SUFFER": another *Trovatore* number, not the Anvil Chorus. |
| `jc_anvil_201241367.abc` | **X** | "SOLDIERS' CHORUS" ("Squilli, echeggi la tromba"), not the Anvil Chorus. |
| `jc_anvil_201241376.abc` | **X** | "AH! I HAVE SIGHED", the Miserere ("Ah! che la morte ognora"), not the Anvil Chorus. |
| `jc_anvil_201241382.abc` | **X** | "HOME TO OUR MOUNTAINS" ("Ai nostri monti"), not the Anvil Chorus. |

## Brindisi "Libiamo ne' lieti calici" (Verdi, *La Traviata*). Grade C (verse) / B (refrain)

No clean notated source has the main verse.

**Verse ("Libiamo, libiamo ne' lieti calici… s'inebrii a voluttà"):** `lotro_brindisi.abc --tune
24`. This is LOTRO part #5, "Flute"; part X:16 "Horn" is identical in the first 20 bars. The file
is in F major (the original is B♭) and 3/8. The verse runs over bars 2–20, with the rising sixth
C→A on "Li-bia-mo". It is a Maestro export of a MIDI performance. Staccato eighths are written as
⅓ note + ⅙ rest, but onsets stay on the eighth grid. Bars 18–21 are rubato (the "a voluttà"
cadenza and the pause). There is no `L:` field, and abc2notes reads it as 1/8.

```bash
$PY scripts/music/compare.py --abc $REFS/lotro_brindisi.abc --tune 24 --ref-bars 2-17 --tol 0.1 …  # verse
```

**Refrain / chorus:** `bb_libiamo.abc --voice 1` (soprano). This is a clean SATB choral
arrangement ("ASF Brindisi") in the original B♭ that contains **only the chorus sections**:

- bars 1–9: "Ah! libiam, amor fra' calici più caldi baci avrà" (the second half of the verse tune).
  Against LOTRO X:24 bars 68–76 it scores 85 % / 73 % with `--tol 0.1`: the LOTRO performance
  plays each turn as triplet sixteenths with an extra upper note (B♭ A G♯ A against A G♯ A B♭);
- bars 10–30: "Ah! godiamo, la tazza e il cantico…" (78 % / 80 % against LOTRO bars 121–141, which
  adds turn figures the soprano part does not have);
- bars 31–65: coda. Here the soprano repeats F (accompaniment), so it is not a tune.

```bash
$PY scripts/music/compare.py --abc $REFS/bb_libiamo.abc --voice 1 --ref-bars 1-9 …
```

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `lotro_brindisi.abc` X:24 (#5) | C | The only source for the verse. 14 LOTRO parts in total; most others are accompaniment or doublings. |
| `bb_libiamo.abc` V:1 | B | Chorus parts only, as described above. V:3 (tenor, treble-8) is read an octave down. |

## La Danza (Rossini, *Soirées musicales*: "Già la luna è in mezzo al mare"). Grade C

**Use:** `bb_ladanza1.abc --voice 1`, the ocarina line of an arrangement for piano and ocarina by
Sam Rahbari. It is the only source.

- Bars 1–48: piano introduction (the ocarina rests).
- Bars 49–64: verse in A minor. It is repeated at 133–148.
- Bars 67–100: continuation, including the repeated-note "mamma mia, si salterà".
- Bars 110–124: the A-major refrain.

The file is written against an **E-major key signature with enharmonic spellings** (C𝄪 for D, B♯
for C, F𝄪 for G, E♯ for F), but the sounding pitches are right. abc2notes carries double sharps
through the bar. Staccato is written as shortened notes plus rests; the onsets are fine.

```bash
$PY scripts/music/compare.py --abc $REFS/bb_ladanza1.abc --voice 1 --ref-bars 49-64 …    # verse
$PY scripts/music/compare.py --abc $REFS/bb_ladanza1.abc --voice 1 --ref-bars 110-124 …  # refrain
```

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `bb_ladanza1.abc` V:1 | C | Single, arranged source with no cross-check. The melody is the familiar one. |
| `bb_ladanza2.abc` | **X** | "La Sonata Danza — a sonata-allegro *based on* Rossini's La Danza" by Dekkadeci. It is a new composition, not Rossini. |
| `jc_tarantellanap_*` "La Tua Danza Sì Leggiera" (X:7–X:10) | **X** for La Danza | This is the Tyrolienne chorus from Rossini's *William Tell* ("The Green Hills of Tyrol"), a different piece (21 % pitch against La Danza: noise). |

## Tarantella Napoletana (traditional). Grade A

**Use:** `jc_tarantellanap_201233905.abc --tune 16`, "Tarantella Napoletana [Am] / Wedding
Tarantella / Cicerenella". It is in A minor with chords. Strain A is bars 0–8, **strain B, the famous
"cBc dcB…", is bars 9–17** (pickup in bar 9, closing A in bar 17), strain C (C major) 18–26, and
strain D 27–35.

```bash
$PY scripts/music/compare.py --abc $REFS/jc_tarantellanap_201233905.abc --tune 16 --ref-bars 9-17 …
```

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `jc_tarantellanap_201233905.abc` X:16 | A | Identical to `…201233923.abc` X:16 (100 %) and to `…201233924.abc` `--tune '#17'` (every tune in that book is X:1, so select by position). `…201233979.abc` X:18 is in B minor (99 %). |
| `wf_tarantella.abc` | A | G minor / B♭ piano version with chords. The famous strain runs from the pickup in bar 33 to the downbeat of bar 41; those two bars also hold the end of the previous strain and the next pickup (bars 33–41 against X:16 bars 9–17: 95.5 % / 95.5 %, the difference being exactly those extra notes). It also has a G-minor strain (1–16), a B♭ strain (17–32) and a close (49–57). |
| `jc_tarantellanap_201293005.abc` X:116 | B | "48 bar Jigs 3" medley: "The Valiant", then "Tarantella Napoletana" in E minor. The famous strain is bars 37–45 (100 % / 100 %). |

## Dance of the Hours (Ponchielli, *La Gioconda*). No trustworthy reference

The only file, `wf_dance_of_hours.abc`, is **Dick Manning's 1962 pop song "(She'll never love you)
Like I Do"**. Its titles also cite "Hello Muddah, Hello Fadduh". It is in F, 4/4, in AABA song form
with lyrics. The collection has no score of Ponchielli's ballet, so nothing in it can be verified
against the original.

- **Ponchielli's material is only the 8-bar theme in bars 6–13** (repeated as 14–21 and 34–41).
  This is the familiar Dance of the Hours tune. Its rhythm is Manning's song setting: two-eighth
  pickups and held half notes on the lyrics. The cadence bars also differ between the repeats:
  bar 12 is "A G G F A G G F" where bars 20 and 40 have "A G G F F E E G".
- **Manning's own material, not to be used:** the intro vamp in bars 1–5 (octave leaps C–c, E–e,
  G–g), the bridge in bars 21–28 ("She may sigh, you may fall…"), the "take it slow" arpeggio tag
  in bars 29–33, and the ending in bar 42.

```bash
$PY scripts/music/compare.py --abc $REFS/wf_dance_of_hours.abc --ref-bars 6-13 …   # theme only; rhythm = Manning's
```

If the game uses this piece, keep to the 8-bar theme and get its rhythm confirmed from a score
of the original.

## La gazza ladra (Rossini). No trustworthy reference for the overture

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `lotro_magpie.abc` | C− | The **complete overture** ("Thieving Magpie", 8:17) as five LOTRO parts: flute, clarinet, bassoon, fiddle and drum, with the snare-roll opening in the drum part. It is a Maestro export of a MIDI rendering: several orchestral voices are **interleaved inside one part**, which a top-note reduction cannot undo; it uses a triplet grid; and 39 bars have odd lengths. Use it by ear and for single pitches only. |
| `jc_gazza_201234966.abc` = `bb_gazza2.abc` | B | Identical notes (100 %). "Solemn March from the opera La gazza ladra", from W. Hamilton's *Universal Tune-Book* (1846), in E♭. It is clean, genuine Rossini, but **probably not from the overture**: its first strain is not found in any LOTRO overture part (24–37 % pitch = noise; weak evidence, since those parts interleave voices). Use it if a Gazza-ladra march is wanted: `--abc $REFS/jc_gazza_201234966.abc --ref-bars 0-24`. |
| `bb_gazza1.abc` | C | CC0 orchestral part: **Trombone 1**, overture mm. 115–138, in E, bass clef. It is an accompaniment line, not the tune. |

## William Tell Overture: finale galop (Rossini). Grade A

**Use:** `jc_williamtell_201226581.abc`, "WILLIAM TELL — Rondo" from Köhler's *Violin
Repository* (1885), arranged by W. B. Laybourn. It is in **E major (the original key)** and 2/4.
The galop theme is bars 0–8 (pickup in bar 0), the second strain ("G♯–C♯") bars 9–17, the theme
plus scale runs bars 18–34, and the coda bars 35–41. **Bar 14 is a sixteenth short**: it reads
`g2g` where bar 10 has `g2gg`. A correct transcription is therefore a sixteenth "late" from bar 15
on (65 % rhythm, bars 15–17 broken). Compare anything that crosses bar 14 with
`--allow-bars 14 --resync`: a correct second strain then scores 100 % / 100 %.

```bash
$PY scripts/music/compare.py --abc $REFS/jc_williamtell_201226581.abc --ref-bars 0-8 …    # theme
$PY scripts/music/compare.py --abc $REFS/jc_williamtell_201226581.abc --ref-bars 0-17 --allow-bars 14 --resync …   # theme + 2nd strain
```

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `jc_williamtell_201226581.abc` | A | As above. Also included in `jc_galop_201297714.abc` (the whole Köhler book) as #76, X:0341. |
| `jc_williamtell_201352798.abc` / `jc_galop_201359603.abc` X:24 | B | Hugh Barwell's 4/4 contra-dance version in C with doubled note values. Theme 100 % / 93 % (time scale ½): it merges some of the galop's repeated sixteenths into eighths. Its later figures and coda are a dance arrangement, not checked against Rossini. |
| `jc_williamtell_201229023.abc` | C | Ditson (1910), in D, a **quadrille** arrangement with dance calls and simplified rhythms: theme 88 % / 88 %, second strain 95 % pitch; its third figure is not the galop theme and is unverified. |
| `jc_williamtell_201229118.abc` | **X** | A "William Tell" country dance from **1826, three years before the opera**. It is an unrelated tune (48 % pitch on the theme: noise). |

## Dies Irae (Verdi, *Messa da Requiem*). Grade C: it is Verdi, but unquantised

`lotro_diesirae.abc` is the only candidate. It has six LOTRO parts (clarinet, flute, horn,
bagpipes, pibgorn, drums) and runs 10:01. It was made by BruTE, a **MIDI-to-ABC dump without bar
lines** and with performance timing; durations look like `2079/4924` of a quarter at Q:125.

**It is Verdi's**, not the Gregorian chant and not Mozart's. Part 1 and part 2 open with G-minor
tutti chords separated by rests (the hammer blows), then rushing descending G-minor scales and a
descending diminished-seventh arpeggio, then the swirling G–F♯ semiquaver figure. That is the
G-minor opening of Verdi's Dies irae. Mozart's setting is in D minor and starts directly with the
chorus. The chant is a single unaccompanied line (F E F D E C D D) with none of these features.

abc2notes cuts each part into pseudo-bars of 4 file-quarters. In part 2 (flute), the hammer
chords are in pseudo-bars 1–2 and return at 9, the descending runs in 2–4, the G–F♯ swirl in 4–7,
and the low descending scale in 8. Use this file for **pitches only**:

```bash
$PY scripts/music/compare.py --abc $REFS/lotro_diesirae.abc --tune 2 --locate --tol 0.15 --rhythm-min 0 …
```

There is no clean notated reference of Verdi's Dies irae in the collection. Write the rhythms from
the score, not from this file.

## Triumphal March (Verdi, *Aida*). Grade B

**Use:** `wf_aida_march.abc`, the only source. It is a lead sheet in G with chords, 4/4.

- Bars 1–12: the famous trumpet theme (pickup D in bar 1, triplet pickups).
- Bars 13–17: middle phrase.
- Bars 18–23: the theme again.
- Bars 24–34: the theme **a minor third higher** in B♭, as in the opera's A♭ → B lift.
- Bars 35–39: middle phrase.
- Bars 40–45: theme and close.

It is unsourced; its "All Rights Reserved" header refers to the transcription. It looks plausible,
but there is nothing to cross-check it against.

```bash
$PY scripts/music/compare.py --abc $REFS/wf_aida_march.abc --ref-bars 1-12 …
```

## Vesti la giubba / "Ridi, Pagliaccio" (Leoncavallo, *Pagliacci*). Grade A

**Use:** `bb_pagliacci1.abc`, the voice line with lyrics in 2/4, written in E minor / G. The arioso
runs over bars 1–33: "Vesti la giubba" 1–8, …, "Ah!" 23–25, **"Ridi, Pagliaccio, sul tuo amore
infranto! Ridi del duol che t'avvelena il cor!" 26–33**. It keeps Leoncavallo's dotted rhythms.

```bash
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci1.abc --ref-bars 26-33 …   # Ridi, Pagliaccio
$PY scripts/music/compare.py --abc $REFS/bb_pagliacci1.abc --ref-bars 1-33 …    # whole arioso
```

| Candidate | Grade | Notes |
|-----------|-------|-------|
| `bb_pagliacci1.abc` | A | As above. |
| `bb_vesti.abc` V:1 | A | Piano transcription. V:1 is the same melody (bars 1–33: 96.7 % / 97.8 %; bars 19 and 33 differ); V:2–4 are accompaniment. |
| `bb_pagliacci2.abc` V:1 | B | Flute and 2 B♭ clarinets in F, 4/4 with doubled values. Flute 95.7 % / 93.5 %: it evens out the dotted figure of bar 5, plays bar 15's low D's as F♯ and ends on B. The clarinet parts are transposing (`transpose=-2`, read at concert pitch). |
| `jc_vesti_201349226.abc` | B− | *Italian Favorites for Accordion* (1997), A minor. It also has the **recitative** "Recitar! Mentre preso dal delirio" (bars 1–22), plus the arioso in 23–55 (98.9 % pitch against bb). It flattens the dotted rhythms into even eighths (74 % rhythm), so use it for the recitative only. |

---

## Spares

| Piece | Use | Grade | Notes |
|-------|-----|-------|-------|
| Santa Lucia (Cottrau) | `jc_santalucia_201333973.abc --expand-repeats` | A | C, 3/4, 32 bars once expanded. Identical to `jc_tarantellanap_201233905.abc` X:15 (100 %) and the Everyday Song Book `jc_santalucia_201230980.abc` (written in 3/8, 99 %). `jc_santalucia_201333997.abc` (accordion book) adds a 4-bar ending; its 32 bars of the tune match 100 % (`--locate-cand`). `jc_santalucia_201239833.abc` "Over the Moonlight Sea Waltz" (Kerr) **is Santa Lucia** under an English title (first strain 100 % pitch, 83 % rhythm: a dotted waltz variant in bars 5 and 7). |
| Torna a Surriento (De Curtis) | `av_surriento.abc` | A | Strain A in D minor, 1–8 (repeated); strain B in D major, 9–16; strain C, the refrain ending "Torna a Surriento, famme campà", 17–32. Identical to `jc_surriento_201345762.abc` (Am/A), `wf_surriento.abc` (C) and `jc_surriento_201263629.abc` (all 100 % pitch). |
| Mattinata (Leoncavallo) | `av_mattinata.abc --expand-repeats` | B | D, 6/8. Identical to `jc_mattinata_201308042.abc` #2 (D) and #1 (C), all by one transcriber. |
| Marechiare (Tosti) | `av_marechiare.abc` | B | D minor with a D-major refrain (inline `[K:D]`). Same notes as `jc_marechiare_201307118.abc`. |
| Ciribiribin (Pestalozza) | `av_ciribiribin.abc --expand-repeats` | B | G, 3/4. Identical to `jc_ciribiribin_201262421.abc` X:2 (G) / X:1 (F) and the session books. |
| Carnival of Venice | `jc_carnivalvenice_201260287.abc --ref-bars 0-8` | B | The theme as commonly played (G, 6/8, D \| E D C B \| D C A B…). `jc_carnivalvenice_201233756.abc` (*Edinburgh Repository*, 1840s, A) is an older, simpler variant (76 % pitch on the theme) plus a variation strain. |
| Largo al factotum (Rossini) | `sb_factotum.abc` | C | A short, unsourced "vocal line" excerpt in C, 6/8, 26 bars, likely simplified. It cannot be verified. **`jc_factotum_201225819.abc` is mislabelled:** it is "Bill Paine's Polka" by Bob McQuillen (1993), not Rossini (X). |
| Va, pensiero (Verdi, *Nabucco*) | `bb_va_pensiero.abc --voice 1 --ref-bars 12-28` | A | SATB in F♯ (the original key). The orchestral introduction is rests, and the melody starts at the bar-12 pickup: "Va, pensiero, sull'ali dorate" 12–28, "Arpa d'or" from 28. `wf_va_pensiero.abc` (F) bars 1–18 = bb 12–28 at 100 % pitch and 90 % rhythm (the lead sheet evens out the triplet run of bb bar 27). |
| Spring (Vivaldi, RV 269) | `sb_spring.abc` | C | Only the opening ritornello, transposed to C (the original is E), 10 bars, unsourced. **`jc_vivaldi_201349488.abc` "Vivaldi in Paradise" is not Spring:** it is V. Kaynor's contra-dance tune after a *different* Vivaldi Allegro (X). |

## Other files in the folder

- *La donna è mobile* (Verdi, *Rigoletto*), not requested: `jc_donnamobile_201241449.abc` (Kerr),
  `sb_donna_mobile.abc` (short excerpt), and the Everyday Song Book's "Over the Summer Sea"
  (`jc_funiculi_201273539.abc --title "summer sea"`), which is the same tune: opening phrase 100 % pitch;
  the song book evens out Kerr's dotted sixteenths and repeats the first phrase before going on.
- Rossini numbers not requested: `jc_rossini_201227330.abc` "Zitti, zitti" (*Barber*),
  `jc_rossini_201228286.abc` March from *Tancredi*, and `jc_rossini_201228733.abc` /
  `…201228734.abc` "Non più mesta" (*Cenerentola*), which have the same notes.
  `jc_rossini_201339645.abc` "Spanish Waltz" (Colin Hume's site, from Howe's *Drawing Room Dances*,
  1859) is **half Rossini**, as its own notes say: strains 3–4 (bars 18–35) are the Tyrolienne "La
  tua danza sì leggiera" from *William Tell* (strain 3, bars 18–26, matches the session book's X:7
  bars 0–8 at 100 % / 100 %; strain 4 is a dance variant), and strains 1–2 are of unknown origin.
  It is neither La Danza nor the galop.
- `jc_galop_201359603.abc` (Nottingham Music Database dances) and `jc_galop_201297714.abc` (Köhler,
  138 tunes): apart from the William Tell entries above, their "galops" are unrelated dance tunes.
- The session books `jc_tarantellanap_2012339xx.abc` also hold "O Maria, Mari" (di Capua), "Vieni
  sul mar", "Tu scendi dalle stelle", "Arrivederci Roma" (1955, **not** public domain), "Ciao ciao
  bambina" (1959, **not** public domain) and others.
