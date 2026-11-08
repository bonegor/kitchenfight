# 🍝 KITCHEN FIGHT — *Difendi la Tradizione!*

An Italian chef defends traditional cuisine against hordes of **culinary crimes** —
pineapple pizza, cream in the carbonara, ketchup on pasta, snapped spaghetti,
scissors, cappuccino after 11 a.m.… A top-down **survivors-like** arena game
(you steer; your kitchen arsenal fires on its own) that runs in any modern browser,
on desktop and mobile.

Every enemy is a real Italian food pet peeve, researched from Italian chefs,
institutions and social-media controversies — see **[docs/RESEARCH.md](docs/RESEARCH.md)**
(54 documented "crimes" with sources, e.g. Italians rank *ketchup on pasta* as their
#1 food crime in a 2022 YouGov survey).

<p align="center">
  <img src="docs/screenshots/title.jpg" width="49%" alt="Title screen" />
  <img src="docs/screenshots/kitchen.jpg" width="49%" alt="La Cucina — the kitchen stage" />
  <img src="docs/screenshots/trattoria.jpg" width="49%" alt="La Trattoria at night" />
  <img src="docs/screenshots/streets.jpg" width="49%" alt="I Vicoli di Napoli with the Cappuccino Clock Tower boss" />
  <img src="docs/screenshots/foodcourt.jpg" width="49%" alt="La Food Court with the Cursed Microwave" />
  <img src="docs/screenshots/levelup.jpg" width="49%" alt="Level-up cards" />
  <img src="docs/screenshots/chefs.jpg" width="49%" alt="Seven playable chefs" />
  <img src="docs/screenshots/ricettario.jpg" width="49%" alt="Il Ricettario — the encyclopedia of food crimes" />
</p>

## ▶ Play

| How | Steps |
|-----|-------|
| **Instant (no install)** | Download [`play/kitchenfight.html`](play/kitchenfight.html) and double-click it. One self-contained file, works offline. |
| **Locally from source** | `npm install` then `npm run dev`, open the printed URL. |
| **GitHub Pages** | One-time: *Settings → Pages → Source: GitHub Actions*, then *Actions → Deploy to GitHub Pages → Run workflow*. (Set the repository variable `PAGES_ENABLED=true` to redeploy automatically on every push to `main`.) |

### Controls
- **Move:** WASD / arrow keys · gamepad stick or d-pad · on touch screens drag anywhere (floating joystick)
- Weapons fire automatically.
- **Pause:** Esc / P / gamepad Start (or the ❚❚ button on touch)
- **Level-up:** arrows + Enter (or click/tap) · **R** reroll · **X** skip · **B** banish

## 🍅 The game

- **4 stages** (15 minutes each, mini-bosses at 5:00 and 10:00, a final boss at 15:00):
  *La Cucina* (the kitchen) → *La Trattoria* (dining room by candlelight) →
  *I Vicoli di Napoli* (Naples alleys, sunset turning to night) → *La Food Court* (the lair where crimes are born).
- **7 chefs** with their own starting weapon and bonus — Chef Enzo, Nonna Pina (and her legendary flying slipper),
  Peppe il Pizzaiolo, Sofia la Romana, Fra' Tommaso the cheesemaking monk, Zia Concetta from Calabria, and Micio the trattoria cat.
- **14 weapons**, each evolving with a matching ingredient into **14 evolutions** (e.g. *Olive* + *Olio Extra Vergine* → *Olive d'Oro*;
  *Forma di Parmigiano* + *Salvadanaio* → *Forma d'Oro* — Parmigiano really is accepted as bank collateral in Emilia).
- **14 passive ingredients** (San Marzano tomatoes, Espresso, Nonna's apron, the lucky Cornicello…).
- **30 crimes + 10 bosses**, each with its own behaviour: the *Cold Pot* slows you down (Italians' #2 crime: starting pasta in cold water),
  *La Pentola Unica* (the infamous one-pot carbonara video) eats other enemies to grow, *Spaghetti Fantasma* (spaghetti bolognese
  "doesn't exist", says Bologna's former mayor) phases in and out, and the *Latecomer Cappuccino* only appears after 11:00.
- **La Dispensa** — spend coins on permanent power-ups. **Il Ricettario** — an illustrated encyclopedia of every crime with
  *why Italians object* and real quotes. Unlockable chefs and stages, records, settings (volume, shake, flashes, quality…).

## 🎨 How it's made

- **No image files.** Every sprite is painted in code with vector shapes (`src/gfx/art/*`, toolkit in
  `src/gfx/painter.ts`) and cached to high-resolution bitmaps at load time.
- **Soundtrack:** ten public-domain Italian classics (Verdi, Rossini, Denza, di Capua, De Curtis, Leoncavallo)
  arranged in a small music DSL (`src/audio/songs/*`) and rendered in a Web Worker on recorded instrument samples
  (`src/audio/assets/inst`). Every melody is checked note by note against published transcriptions with
  `scripts/music/compare.py`; see [docs/MUSIC.md](docs/MUSIC.md) and `docs/music/<track>.md`.
- **Sound effects** are recorded MP3 variants (a few layered with a synthesized sound; the kamikaze's fuse is
  still synthesized); every recorded instrument and sound has a synthesized fallback (`src/audio/*`).
- TypeScript + Vite, no game framework. Custom engine: spatial hashing, pooled entities, y-sorted renderer with
  dynamic lighting, particles, decals, screen shake and hit-stop (`src/game/*`).
- DOM/CSS user interface styled like a trattoria menu card (`src/ui/*`, `src/styles/main.css`).

```
src/
  core/      input (keyboard, gamepad, touch), math, saves, spatial hash
  gfx/       painter toolkit, sprite cache, art modules (chefs, crimes, bosses, items, stages)
  audio/     engine, recorded sample bank + synth fallbacks, sequencer, songs, sound effects
             (assets/inst, assets/sfx)
  game/      run simulation, weapons, passives, enemies, AI, bosses, waves, renderer, effects
  ui/        menus, HUD, level-up, chests, shop, encyclopedia
docs/        DESIGN.md (game design), RESEARCH.md (the food crimes), ART_GUIDE.md, MUSIC.md (music tools),
             music/ (one file per track: sources, proofs, form), credits/ (sample and SFX sources)
```

### Scripts
| Command | What it does |
|---------|--------------|
| `npm run dev` | dev server with hot reload |
| `npm run build` | production build → `dist/` (static, any host) |
| `npm run build:single` | one self-contained HTML file → `dist-single/index.html` |
| `npm run build:play` | rebuilds the downloadable `play/kitchenfight.html` |
| `npm run typecheck` | TypeScript check |
| `/gallery.html` (dev) | sprite gallery & stage previews for art QA (`?prefix=enemy.&zoom=2`, `?stage=kitchen`) |

Dev helpers in `scripts/`: `shot.mjs` (screenshots), `play.mjs` (automated playtest), `sim.mjs` (headless 15-minute
balance simulation with a bot), `screens.mjs` (screenshots of every menu).

## Credits
Design, code, art, arrangements and research by Claude (Anthropic) for this repository.
Fonts: Lobster, Lilita One, Playfair Display — SIL Open Font License.

**Music**: Italian classics, public domain except where noted, arranged for this game:
- Title: Funiculì, Funiculà, Luigi Denza (1880)
- Menus: 'O sole mio, Eduardo di Capua and Alfredo Mazzucchi (1898). Mazzucchi (d. 1972) was recognised as
  co-composer in Italy, so the music may still be protected in the EU until 2042: a placeholder (see below).
- La Cucina: Anvil Chorus (Il trovatore), Giuseppe Verdi (1853)
- La Trattoria: Brindisi “Libiamo ne' lieti calici” (La traviata), Giuseppe Verdi (1853)
- I Vicoli di Napoli: La Danza, with the traditional Tarantella Napoletana, Gioachino Rossini (1835)
- La Food Court: Torna a Surriento, Ernesto De Curtis (1902)
- Bosses: Galop from the William Tell Overture, Gioachino Rossini (1829)
- Final boss: Dies irae (Messa da Requiem), Giuseppe Verdi (1874)
- Victory: Triumphal March (Aida), Giuseppe Verdi (1871)
- Game over: “Vesti la giubba” (Pagliacci), Ruggero Leoncavallo (1892)

**Recorded instruments** (edited: trimmed, pitched, looped, level-matched, re-encoded as MP3; details in
[docs/credits/music-samples.md](docs/credits/music-samples.md)):
- Accordion: "Button Accordion HN", FreePats project (Hohner accordion recorded by Jeff Stauffer; bank by michael02022), CC0 1.0.
- Mandolin: "Terkelsen's Mandolin" by Lars Terkelsen, SFZ conversion by S. Christian Collins (license not stated; credited).
- Piano, nylon and steel guitar: "Meta Open Sound" by Meta (Creative Audio team), CC0 1.0.
- Orchestra (strings, brass, woodwinds, chorus, organ, harp, mallets, timpani, tam-tam, suspended-cymbal roll):
  "Sonatina Symphonic Orchestra" by Mattias Westlund and Peter Eastman, CC Sampling Plus 1.0; horn section sustains by
  Mattias Westlund, CC BY-SA 3.0; pipe organ "St. Stephen's Anglican" by Nicholas Appleton, CC Sampling Plus 1.0; celesta
  by stamperadam (freesound.org), CC0 1.0; the cymbal roll is from SSO, whose README lists "davidjwoll cymbal rolls"
  (freesound.org) among its sources, CC Sampling Plus 1.0.
- Harpsichord and percussion (tambourine, snare, clash cymbals, suspended-cymbal strokes, bass drums, triangle, shaker,
  brake drum, anvil, slapstick, woodblock, vibraslap, flexatone, claves, ratchet, toy whistle): "Versilian Community
  Sample Library" by Versilian Studios, CC0 1.0.
- Castanets: "World Percussion", FreePats project, CC0 1.0.
- Orchestra hit: "Musyng Kite" soundfont via midi-js-soundfonts (Benjamin Gleitzman), CC BY-SA 3.0.
- The edited files under CC BY-SA 3.0 (`src/audio/assets/inst/horns`, `src/audio/assets/inst/orchhit`) are shared under the same license.

**Sound effects** are recordings (and a few synthesized layers) from these collections, edited and mixed for
this game; details per sound in [docs/credits/sfx.md](docs/credits/sfx.md):
- "Oculus Audio Pack 01" by Oculus VR, LLC (https://developers.meta.com/vr/downloads/package/oculus-audio-pack-1/), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Files renamed to the UCS naming convention; OGG previews transcoded from the original WAVs. Modified: trimmed, re-pitched, filtered, layered and re-encoded as MP3.
- Sonatina Symphonic Orchestra by Mattias Westlund (https://github.com/peastman/sso), licensed under CC Sampling Plus 1.0 (https://creativecommons.org/licenses/sampling+/1.0/). Modified: trimmed, re-pitched, filtered, layered and re-encoded as MP3.
- Terkelsen's Mandolin: samples by Lars Terkelsen, SFZ conversion by S. Christian Collins (https://github.com/sfzinstruments/terkelsen.mandolin). Modified: trimmed, re-pitched, filtered, layered and re-encoded as MP3.
- VCSL (Versilian Community Sample Library) by Versilian Studios (https://github.com/sgossner/VCSL), CC0 1.0.
- FreePats World Percussion by Xavimart, Gonzalo and Roberto (http://freepats.zenvoid.org/), CC0 1.0.
- SFX Kit by Wyzowl (https://huggingface.co/datasets/wyzowl/sfx-kit), CC0 1.0.

**Before any release** (this build is a prototype; its audio is meant to be replaced):
- *'O sole mio* (menu music) may still be under copyright in the EU (see above).
- The mandolin recordings (Terkelsen's Mandolin) carry no stated license.
- The Sonatina Symphonic Orchestra files (CC Sampling Plus 1.0, 27 of the 54 instrument sets: strings, winds,
  brass, chorus, organ, harp, mallets, timpani, tam-tam, and the suspended-cymbal roll in `cymbal.mp3`, variant 1;
  that set's strokes are VCSL's) may be used in the game, commercially too, but the sample files themselves may
  only be redistributed as they are noncommercially, and they may not be used to advertise anything other than
  the game.
- Files under CC BY-SA 3.0 (horn section, orchestra hit) must stay under that license when shared.
- Some harmonisations (La Danza, the game-over intro) follow modern published arrangements rather than the
  composers' own scores; check them against a public-domain edition.

No pineapples were harmed. Several were deeply offended.
