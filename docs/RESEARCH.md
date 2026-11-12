# KITCHEN FIGHT — Research Dossier: Italian "Food Crimes"

> What Italians actually object to, turned into enemies, bosses, items, barks and maps.
> Compiled 5 November 2026 for design, art, writing and the in-game **Ricettario** (bestiary).
>
> **Levels are dishes now.** For the per-dish research behind *Il Menù* (the proper recipe of each dish,
> its intruders with popularity and sources including Italian influencer chefs, what Italians accept,
> and the verification limits), see **[RECIPES.md](RECIPES.md)**. This file stays the general catalogue of crimes.

## Contents
0. [How to use this file](#0-how-to-use-this-file)
1. [The Crimes](#1-the-crimes): 54 enemies, starting with a [quick index](#quick-index)
2. [Boss candidates](#2-boss-candidates): 10 set pieces + a stage mapping
3. [Heroes of tradition](#3-heroes-of-tradition): 45 weapons, passives and pickups
4. [Italian exclamations](#4-italian-exclamations): 43 barks + 6 gestures
5. [Settings](#5-settings): 13 maps
6. [Research notes & surprises](#6-research-notes--surprises)
7. [Sources](#7-sources)

---

## 0. How to use this file

- **Severity (1–5)** measures how hard Italians react. 1 = eye-roll, 2 = grumble, 3 = loud complaint, 4 = outrage that makes the news, 5 = national scandal ("è un crimine!").
- **YouGov** is the net acceptability score among Italians in YouGov's 2022 survey of 17 countries (−100 means everyone calls it unacceptable). It appears only where YouGov measured that exact habit.
- **Receipts:** text in quotation marks is a quote *as reported by the linked outlet*. "Paraphrase" marks a summary. Italian quotes come with a translation. Most pages were read through search-engine extracts, because direct page fetching was blocked in the research sandbox. **Re-check the wording on the linked page before printing any quote verbatim** in-game or in marketing.
- **Names:** enemy names are grammatical Italian and contain no brands. Controversies that involved companies are described generically ("a big ketchup brand"). Real people are cited as sources only and should **never appear in-game**; use archetypes instead (e.g. "the Influencer").
- **Behaviours** are spread across archetypes (chaser, swarm, dasher, kiter, lobber, splitter, tank, area-denial, summoner, flyer, mimic, stealth, tether, healer, buffer, turret, phaser…). Each entry carries an archetype tag in **[brackets]**.
- Items marked ★ in §3 already exist in `DESIGN.md`. Their cultural lines can go straight into the Ricettario.

---

## 1. The Crimes

### Quick index

| # | Enemy (Italian) | Crime | Category | Sev. | Archetype |
|---|---|---|---|---|---|
| 1 | Panna Invasora | Cream in carbonara | sauce | 5 | area-denial |
| 2 | Bacon Abusivo | Bacon/ham instead of guanciale | meat | 3 | circling charger |
| 3 | Frittata Accidentale | Scrambled-egg "carbonara" | technique | 3 | lobber / wall-builder |
| 4 | Cipolla Clandestina | Onion in carbonara & gricia | sauce | 4 | layered tank |
| 5 | Pomodoro Intruso | Tomato in carbonara | viral social-media recipe | 4 | smoke artillery |
| 6 | La Pentola Unica | One-pot "carbonara" | viral social-media recipe | 4 | devourer |
| 7 | Scatoletta Maledetta | Canned carbonara | pasta | 4 | kamikaze |
| 8 | Aglio in Camicia | Garlic in amatriciana | sauce | 4 | pickup repeller |
| 9 | Burro Furbetto | Butter/cream in cacio e pepe | sauce | 4 | stealth backstabber |
| 10 | Pollo in Provetta | Lab-grown-chicken carbonara | meat | 3 | replicator |
| 11 | Lo Spezzaspaghetti | Breaking spaghetti | technique | 4 | shrapnel splitter |
| 12 | Forbici Furiose | Cutting spaghetti (scissors/knife) | utensil | 4 | dasher |
| 13 | Lo Sciacquapasta | Rinsing cooked pasta | technique | 3 | turret / dispeller |
| 14 | Chiazza d'Olio | Oil in the pasta water | technique | 2 | merger |
| 15 | Pentola Fredda | Starting pasta in cold water | technique | 4 | slow aura |
| 16 | Pasta Scotta | Overcooked, mushy pasta | technique | 4 | slime splitter |
| 17 | Frullatore Rovente | Pesto abuse (heated, burnt basil) | sauce | 3 | vortex puller |
| 18 | Spaghetti Fantasma | Spaghetti bolognese | pasta | 3 | phaser |
| 19 | Polpetta Rotolante | Spaghetti & meatballs | meat | 2 | snowball roller |
| 20 | Alfredo il Colloso | Creamy chicken "Alfredo" | sauce | 3 | tether |
| 21 | Pollo Infiltrato | Chicken in pasta | meat | 4 | ambusher |
| 22 | Cotoletta Travestita | Chicken parmesan | meat | 2 | berserker |
| 23 | Spruzzatore Rosso | Ketchup on pasta | sauce | 5 | ranged kiter |
| 24 | Pane all'Aglio Imbucato | Garlic bread with pasta | etiquette | 1 | gatecrasher filler |
| 25 | Condimento Inesistente | Bottled "Italian dressing" | sauce | 2 | confuser |
| 26 | Piattino dell'Intingolo | Oil-and-balsamic bread dip | etiquette | 2 | buffer |
| 27 | Ananas Corazzato | Pineapple on pizza | pizza | 4 | tank splitter |
| 28 | Peperone Equivoco | "Pepperoni" mix-up | meat | 1 | swapper |
| 29 | Margherita Macchiata | Ketchup on pizza | pizza | 5 | radial burster |
| 30 | Teglia Profonda | Chicago deep dish | pizza | 3 | frontal armour |
| 31 | Banana Speziata | Banana-curry pizza | pizza | 4 | boomerang thrower |
| 32 | Mattarello Traditore | Rolling pin on Neapolitan dough | utensil | 2 | lane sweeper |
| 33 | Pizza Gommosa | Candy-topped pizza | viral social-media recipe | 4 | leech |
| 34 | Pizza Inzuppata | Water-soaked reheated pizza | viral social-media recipe | 3 | sponge absorber |
| 35 | Pizza all'Inglese | English-breakfast pizza | viral social-media recipe | 3 | summoner |
| 36 | Vongola Formaggiosa | Cheese on seafood pasta | cheese | 3 | reflector |
| 37 | Spargipolvere | Powdered "parmesan" shaker | cheese | 4 | flyer / clogger |
| 38 | Il Tarocco | "Italian Sounding" knock-offs | cheese | 4 | mimic |
| 39 | Cappuccino Ritardatario | Cappuccino after 11 / with meals | coffee & drinks | 3 | time-gated |
| 40 | Bicchiere di Latte | Ordering a "latte" | coffee & drinks | 1 | healer |
| 41 | Expresso Sbagliato | "Expresso" | coffee & drinks | 2 | express charger |
| 42 | Scorza Sospetta | Lemon peel with espresso | coffee & drinks | 2 | constrictor orbiter |
| 43 | Moka Insaponata | Washing the moka with soap | utensil | 3 | pressure bomb |
| 44 | Bollicine alla Spina | "Prosecco" on tap | coffee & drinks | 3 | bubble trapper |
| 45 | Cubetto Guastafeste | Ice in red wine | coffee & drinks | 3 | ricochet |
| 46 | Cucchiaio Impiccione | Twirling spaghetti with a spoon | etiquette | 2 | shield-bearer |
| 47 | Contorno Sbagliato | Pasta as a side dish | etiquette | 4 | linked pair |
| 48 | Panino Moltiplicato | "A panini" | etiquette | 1 | multiplier |
| 49 | Bruschetta Storpiata | "Brushetta" pronunciation | etiquette | 1 | silencer |
| 50 | Spaghetti da Bancone | Countertop spaghetti | viral social-media recipe | 5 | creep spreader |
| 51 | Teglia Annegata | Oven-"boiled" raw spaghetti | viral social-media recipe | 4 | artillery turret |
| 52 | Patatine di Pasta | Pasta chips | viral social-media recipe | 2 | swarm |
| 53 | Feta Vulcanica | Baked feta pasta | viral social-media recipe | 2 | eruption turret |
| 54 | Spaghetti Hawaiani | "Hawaiian" spaghetti | viral social-media recipe | 4 | shockwave dancer |

### A. Carbonara and the Roman classics

#### 1. Cream in carbonara: **Panna Invasora** ("Invading Cream")
- **Category:** sauce · **Severity:** 5 · **YouGov:** −45
- **Why Italians object:** Roman carbonara is pasta, guanciale, egg (mostly yolk), Pecorino Romano and black pepper. Its creaminess comes from emulsifying egg and cheese with starchy pasta water and pork fat, so cream reads as a lazy shortcut that mutes the pecorino and pepper.
- **Receipts:** "Basta con la panna nella carbonara" ("Enough with cream in carbonara"), a sign held by self-styled *attivisti della pastasciutta* (pasta activists) at the Trevi Fountain in June 2023 ([Blitz Quotidiano, citing ANSA](https://archivio.blitzquotidiano.it/cronaca-italia/spaghetti-e-cappuccino-basta-a-fontana-di-trevi-attivisti-della-pasta-3543489)). "We don't use cream.": The Pasta Queen, answering a TikTok viewer ([Mashed](https://mashed.com/1088903/the-pasta-queen-is-in-shambles-over-gordon-ramsays-carbonara)).
- **Monster:** A wobbling dollop of whipped cream wearing a milk carton as a helmet. **[Area-denial]** A slow chaser that leaves slippery puddles. The player skids on them, and nearby puddles merge into one big slick unless they are burned off with fire damage (Peperoncino).

#### 2. Bacon or ham instead of guanciale: **Bacon Abusivo** ("Unlicensed Bacon")
- **Category:** meat · **Severity:** 3 (bacon/ham; pancetta is a domestic debate)
- **Why Italians object:** Guanciale (cured pork cheek) melts into sweet, clean fat. Smoky bacon changes the flavour, and ham makes it a different dish altogether.
- **Receipts:** A *This Morning* co-host said his pasta would be "close to a British carbonara" if it had ham. Gino D'Acampo shot back: "Well if my grandmother had wheels, she would have been a bike!" (ITV, 18 May 2010; [The Takeout](https://thetakeout.com/1836872143)). A twist: 2025 Carbonara Day data reported that *pancetta* beats guanciale in Italian kitchens ([Scatti di Gusto](https://www.scattidigusto.it/carbonara-day-2025-pancetta-vince-sul-guanciale-dati-alla-mano)).
- **Monster:** A strip of streaky bacon in a fake-moustache "guanciale" disguise, pedalling a tiny bicycle (the grandmother-with-wheels joke). **[Circling charger]** It orbits at mid-range, rings its bell as a warning, then sprints in a wide arc, flicking sizzling grease sideways.

#### 3. Scrambled-egg carbonara / "yellow soup": **Frittata Accidentale** ("Accidental Omelette")
- **Category:** technique · **Severity:** 3
- **Why Italians object:** The egg-and-cheese sauce must be tossed *off the heat* so it thickens without curdling. Too hot gives you scrambled eggs, and too loose gives you soup.
- **Receipts:** Frying the eggs is the "ultimate" mistake: "At that point, we can't call it carbonara. ... That'll be like a frittata." (The Pasta Queen, [Tasting Table](https://tastingtable.com/1205594/the-biggest-mistake-people-make-with-carbonara-according-to-nadia-munno-exclusive)). In 2020 Italians mocked a British celebrity chef's runny carbonara as "yellow soup", a "caricature" and a "disgusting mess" ([Wanted in Rome](https://www.wantedinrome.com/news/italians-revolted-by-gordon-ramsays-nightmare-carbonara.html)).
- **Monster:** A hopping frying pan of curdled yellow egg. **[Lobber / wall-builder]** It hops toward the player and splats down. Each splat hardens into a low egg wall for 6 s, reshaping the corridors.

#### 4. Onion in carbonara (and gricia): **Cipolla Clandestina** ("Stowaway Onion")
- **Category:** sauce · **Severity:** 4
- **Why Italians object:** Rome's pork-and-pecorino pastas (carbonara, gricia, amatriciana) are built on guanciale fat, with no *soffritto* and no onion. The onions in a viral French "carbonara" (2016) were among its most mocked ingredients.
- **Receipts:** Paraphrase: Gambero Rosso's coverage of "Carbonaragate" singled out the onion in the French video ([Gambero Rosso](https://www.gamberorosso.it/notizie/attualita/video-carbonara-sbagliata-francese-cipolla/)). Weeks after his amatriciana gaffe (#8), chef Carlo Cracco drew fresh criticism for suggesting onion in gricia ([Blitz Quotidiano](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-cipolla-nella-gricia-nuova-gaffe-dopo-amatriciana-2103438)).
- **Monster:** An onion in a trench coat and sunglasses. **[Layered tank]** It has three armour layers that peel off one by one. Each peel releases a tear-gas puff that blurs the screen edges for a second (from the design brief).

#### 5. Tomato in carbonara: **Pomodoro Intruso** ("Intruder Tomato")
- **Category:** viral social-media recipe · **Severity:** 4
- **Why Italians object:** Tomato turns it into a different dish (that's amatriciana's territory). In 2021 a big US newspaper's cooking site published a "smoky tomato carbonara" made with bacon and parmesan.
- **Receipts:** Coldiretti called it the "tip of the iceberg" in the "falsification" of Italian dishes, with carbonara among the most "betrayed" recipes abroad. One Italian simply posted "Stop this madness" ([The Guardian via PressReader](https://www.pressreader.com/usa/the-guardian-usa/20210226/281925955738464)). For 95% of Italians polled, "se c'è il pomodoro non si può chiamare Carbonara" ("if there's tomato, you can't call it carbonara") ([LaPresse](https://www.lapresse.it/cultura/2021/04/06/oggi-il-carbonaraday-9-italiani-su-10-bocciano-la-ricetta-del-nyt-con-il-pomodoro/)).
- **Monster:** A smouldering cherry tomato wearing a folded-newspaper hat. **[Smoke artillery]** It keeps its distance and lobs smoky tomato bombs that leave vision-blocking clouds for 4 s.

#### 6. One-pot "carbonara": **La Pentola Unica** ("The Single Pot")
- **Category:** viral social-media recipe / technique · **Severity:** 4
- **Why Italians object:** A 2016 French viral video boiled pasta in a single pot with onion, bacon and cream. Italians boil pasta in plenty of salted water and build the sauce separately, so "everything in one pot" skips every step that matters.
- **Receipts:** Even the pasta maker whose product appeared in the clip distanced itself: "We're open to all kinds of variations on the carbonara, but this goes too far…désolé" ([Tasting Table](https://tastingtable.com/691768/carbonara-wars-barilla-demotivateur-france-italy-media); see also [Quartz](https://qz.com/661055/when-the-french-try-to-beat-the-italians-at-italian-food-things-get-ugly)).
- **Monster:** A dented stockpot with pasta, onion and cream slopping over the rim. **[Devourer]** It waddles toward the nearest *other* enemy and swallows it, growing bigger and stronger with each meal. Kill it before it eats a crowd.

#### 7. Canned carbonara: **Scatoletta Maledetta** ("Cursed Little Can")
- **Category:** pasta · **Severity:** 4
- **Why Italians object:** Carbonara is an emulsion made to order. A shelf-stable tin is its opposite: a big ketchup brand launched one in the UK in August 2024, made with pancetta.
- **Receipts:** Michelin-starred Roman chef Alessandro Pipero likened it to "cat food" ([The Local](https://www.thelocal.it/20240830/they-should-be-ashamed-outrage-in-italy-as-heinz-launches-canned-pasta-carbonara)). Gianfranco Vissani: "This is how you destroy Italian culture" ([Il Sole 24 Ore](https://en.ilsole24ore.com/art/and-controversy-the-can-carbonara-proposed-by-heinz-vissani-destroys-italian-culture-AFtCnSbD)). Tourism minister Daniela Santanchè borrowed a line from the 1954 film *Un americano a Roma* to suggest feeding it to the rats (paraphrase, [Wanted in Rome](https://www.wantedinrome.com/news/italy-tourism-minister-heinz-carbonara.html)).
- **Monster:** A tin can with a pull-tab grin. **[Kamikaze]** It waddles close, stops, pops its lid (a 1 s warning), then bursts in a ring of gloopy pasta.

#### 8. Garlic in amatriciana: **Aglio in Camicia** ("Garlic in Its Shirt")
- **Category:** sauce · **Severity:** 4
- **Why Italians object:** Amatrice's recipe has been EU-protected as "Amatriciana Tradizionale" STG since 2020 (Reg. 2020/395). It uses guanciale, tomato, pecorino, a splash of white wine and pepper or chilli, with no garlic and no onion.
- **Receipts:** In February 2015 Carlo Cracco said on prime-time TV that his secret was *aglio in camicia* (garlic cooked in its skin). The town of Amatrice replied by listing the only true ingredients: guanciale, pecorino, white wine, San Marzano tomatoes, pepper and chilli (paraphrase). Cracco then apologised: "era solo una battuta" ("it was only a joke") ([Dissapore](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/), [Blitz Quotidiano](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-chiede-scusa-per-amatriciana-con-aglio-era-solo-una-battuta-2097854), [EU regulation](https://www.arsial.it/app/uploads/Reg_2020_395_STG-AmatricianaTradizionale.pdf)).
- **Monster:** A garlic clove in a crisp shirt and tie (*camicia* means shirt). **[Pickup repeller]** Its stink aura pushes XP ingredients and coins away from the player. Its first hit rips off the shirt and shrinks the aura.

#### 9. Butter or cream in cacio e pepe: **Burro Furbetto** ("Sneaky Butter")
- **Category:** sauce · **Severity:** 4
- **Why Italians object:** Cacio e pepe has three ingredients: Pecorino Romano, black pepper and pasta, plus its starchy water. The whole skill is the emulsion, so butter or cream counts as cheating.
- **Receipts:** In August 2025 a UK food site's cacio e pepe with butter was called out by Claudio Pica of Rome's Fiepet-Confesercenti association. The BBC then fixed its own recipe back to three ingredients, but still advised anyone struggling to "try adding a slick of double cream to the mix" ([ANSA](https://www.ansa.it/english/news/lifestyle/food_wine/2025/08/06/bbc-fixes-cacio-e-pepe-recipe-after-italian-outcry_b0b531d1-2aaa-42dd-89e9-6ad73f62657a.html), [Wanted in Rome](https://www.wantedinrome.com/news/italy-controversy-butter-uk-recipe-cacio-e-pepe.html)).
- **Monster:** A stick of butter in a trench coat and fedora. **[Stealth backstabber]** It melts nearly invisible, slides behind the player and strikes. Heat (the Forno aura, Peperoncino) reveals it.

#### 10. Lab-grown chicken carbonara: **Pollo in Provetta** ("Test-Tube Chicken")
- **Category:** meat · **Severity:** 3
- **Why Italians object:** Chicken in carbonara is already a crime. Lab-grown chicken (approved in Singapore) doubles it, and Italy's farm lobby campaigns hard against "synthetic food".
- **Receipts:** "La carbonara di pollo sintetico servita in un ristorante a Singapore è l'ultimo sfregio fatto nel mondo alla vera cucina italiana" ("synthetic-chicken carbonara served in a Singapore restaurant is the latest insult to real Italian cuisine"), Coldiretti, July 2023 ([AGI](https://www.agi.it/cronaca/news/2023-07-18/carbonara-di-pollo-sintetico-made-in-italy-ricette-22282277/)).
- **Monster:** A chicken nugget bobbing in a bubbling test tube. **[Replicator]** It buds a copy of itself every 6 s, so if left alone it fills the screen.

### B. Pasta technique crimes

#### 11. Breaking spaghetti: **Lo Spezzaspaghetti** ("The Spaghetti-Snapper")
- **Category:** technique · **Severity:** 4
- **Why Italians object:** Long pasta is meant to be twirled. Snapping it to fit the pot leaves short, uneven pieces. A few soups (e.g. pasta e fagioli) are the traditional exception.
- **Receipts:** Lidia Bastianich stopped a TV host who was about to snap bucatini ("Don't break the pasta!!") and called it a "criminal offense" ([Mashed](https://mashed.com/707672/lidia-bastianich-says-doing-this-to-pasta-is-a-criminal-offense)).
- **Monster:** A bundle of dry spaghetti with angry eyebrows. **[Shrapnel splitter]** When it dies it snaps into 8 short shards that fly outward and hurt the player, so finish it from range.

#### 12. Cutting spaghetti with scissors or a knife: **Forbici Furiose** ("Furious Scissors")
- **Category:** utensil · **Severity:** 4 · **YouGov:** −46 (cutting pasta)
- **Why Italians object:** Adults eat long pasta by twirling it on a fork alone, with no knife and certainly no scissors. Cutting it up is for toddlers.
- **Receipts:** "The only people who are allowed to cut spaghetti are two-year olds!", a chef quoted by [Tasting Table](https://www.tastingtable.com/1391772/etiquette-faux-pas-cut-spaghetti-italian-restaurant). A 2020 video of a man snipping his spaghetti with scissors went viral ([TODAY](https://www.today.com/food/man-uses-scissors-eat-spaghetti-t174910)). In 2023 a TikTok prankster filmed Italian waiters' horror as he did the same ([Il Fatto Quotidiano](https://www.ilfattoquotidiano.it/2023/08/02/ketchup-sulla-pizza-spaghetti-tagliati-con-le-forbici-e-ghiaccio-nel-vino-rosso-il-tiktoker-americano-uccide-la-cucina-italiana/7249975/)).
- **Monster:** A pair of kitchen scissors with snapping blades. **[Dasher]** It warns with a "snip-snip", then makes 3 quick straight-line dashes, re-aiming between each (from the design brief).

#### 13. Rinsing cooked pasta: **Lo Sciacquapasta** ("The Pasta-Rinser", a twist on *scolapasta*)
- **Category:** technique · **Severity:** 3
- **Why Italians object:** The starch on freshly drained pasta is what makes the sauce cling and emulsify. Rinsing washes it off and chills the pasta, so only pasta salad gets rinsed.
- **Receipts:** Paraphrase: Italian cooks finish pasta in the pan with its sauce and a splash of cooking water (*mantecatura*). Chef Peppe Guida explains the technique in [Gambero Rosso](https://www.gamberorosso.it/notizie/attualita/mantecare-la-pasta-tecnica-peppe-guida/).
- **Monster:** A dripping kitchen tap on stubby legs. **[Turret / dispeller]** It plants itself and sprays cold jets. A hit washes off the player's temporary buffs, such as the Gelato freeze or an espresso rush.

#### 14. Oil in the pasta water: **Chiazza d'Olio** ("Oil Slick")
- **Category:** technique · **Severity:** 2
- **Why Italians object:** Oil floats in patches and barely touches the pasta, so it doesn't stop sticking (stirring does). What little does coat the pasta can stop the sauce from clinging.
- **Receipts:** Paraphrase: Italian science site Geopop explains that oil is non-polar, so it stays in surface patches and rarely touches the pasta, and pasta makers advise against it ([Geopop](https://www.geopop.it/il-trucco-dellolio-nellacqua-di-cottura-serve-a-non-far-attaccare-la-pasta-spoiler-no/)). Italian creator Vincenzo's Plate explains why Italians never do it ([Vincenzo's Plate](https://www.vincenzosplate.com/oil-in-pasta-water-why-italians-never-do-it/)).
- **Monster:** A glossy oil droplet with a smug face. **[Merger]** Droplets drift toward each other and fuse into a bigger, tougher slick, up to 3 merges. Pop them before they meet.

#### 15. Starting pasta in cold water: **Pentola Fredda** ("Cold Pot")
- **Category:** technique · **Severity:** 4 · **YouGov:** −71 (Italians' #2 crime overall!)
- **Why Italians object:** Pasta goes into salted water at a rolling boil. Starting it cold leaves it gluey and wrecks the texture.
- **Receipts:** "Non calare la pasta in acqua bollente svilisce sia la natura che la struttura della materia prima" ("not dropping pasta into boiling water debases both the nature and the structure of the ingredient"), from [Gambero Rosso](https://www.gamberorosso.it/notizie/delitti-in-cucina-i-misfatti-nei-confronti-del-cibo-italiano-la-pasta/) on the YouGov list.
- **Monster:** A frost-covered pot with icicle eyebrows. **[Slow aura]** Its cold aura slows the player and their projectiles. It is harmless on its own but makes every other enemy deadlier.

#### 16. Overcooked pasta: **Pasta Scotta** ("Mushy Pasta")
- **Category:** technique · **Severity:** 4
- **Why Italians object:** Pasta should be *al dente* ("to the tooth"). Mushy pasta is the classic complaint Italians bring home from trips abroad.
- **Receipts:** Paraphrase: Gambero Rosso writes that ordering pasta abroad often means getting a soggy, completely overcooked mass, while noting that al dente is a fairly recent standard ([Gambero Rosso](https://www.gamberorosso.it/notizie/attualita/pasta-scotta-storia/)). It also happens in reverse: an Italian cook in France was reportedly let go because his carbonara was too al dente ([Dissapore](https://www.dissapore.com/notizie/carbonara-troppo-al-dente-cuoco-italiano-licenziato-in-francia/)).
- **Monster:** A limp, sagging tangle of noodles. **[Slime splitter]** It splits into 2 smaller blobs on death, then into 4. The smallest ones are fast (from the design brief).

#### 17. Pesto abuse (cooked, blender-burnt, odd greens): **Frullatore Rovente** ("Red-Hot Blender")
- **Category:** sauce · **Severity:** 3
- **Why Italians object:** Genoese pesto has 7 ingredients: Genovese DOP basil, Ligurian extra-virgin olive oil, Parmigiano, pecorino, pine nuts, garlic and coarse salt. It is pounded cold in a marble mortar, and heat (hot blender blades, or cooking it in the pan) turns the basil black.
- **Receipts:** Paraphrase: the Pesto Genovese consortium's recipe lists only seven ingredients ([Il Fatto Alimentare](https://ilfattoalimentare.it/pesto-genovese-ricetta-tradizione-industria.html)). Italian guides warn that overheated blender blades oxidise the basil ([Dissapore](https://www.dissapore.com/ricette/pesto-alla-genovese-5-errori-da-non-fare/)).
- **Monster:** A red-hot blender with whirling blades. **[Vortex puller]** It drags the player toward its blades while its spinning core belches black basil smoke.

### C. Italian-American and "Italian-ish" dishes

#### 18. Spaghetti bolognese: **Spaghetti Fantasma** ("Ghost Spaghetti")
- **Category:** pasta · **Severity:** 3 (sky-high in Bologna, surprisingly low in YouGov)
- **Why Italians object:** Bologna's ragù goes on fresh egg tagliatelle or into lasagne, not on dried spaghetti. The Accademia Italiana della Cucina lodged the official ragù recipe with Bologna's Chamber of Commerce in 1982 and updated it in April 2023 ([LaPresse](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/)).
- **Receipts:** "Spaghetti bolognese doesn't actually exist, yet it's famous the world over", Bologna mayor Virginio Merola on RAI radio in 2019. He also asked people on Twitter to send photos of "fake news" spaghetti bolognese from around the world ([CBC](https://www.cbc.ca/lite/story/1.5041024), [Euronews](https://www.euronews.com/2019/03/11/mayor-of-bologna-claims-spaghetti-bolognese-is-fake-news)). In 2025 agriculture minister Lollobrigida called a supermarket bolognese sauce a "tourist trap speciality which has no real tradition in Italy" ([Brussels Times](https://brusselstimes.com/eu-affairs/1846923/italian-minister-fumes-at-delhaizes-ready-made-carbonara-sauce/)).
- **Monster:** A ghostly plate of spaghetti draped in a "FAKE NEWS" front page like a bedsheet. **[Phaser]** It flickers and is intangible half the time, becoming solid only while winding up an attack. It stays solid for good while the player carries the Golden Tagliatella (§3).

#### 19. Spaghetti and meatballs: **Polpetta Rotolante** ("Rolling Meatball")
- **Category:** meat · **Severity:** 2
- **Why Italians object:** The dish was invented by Italian-Americans around 1880–1920. In Italy *polpette* are usually a main course on their own. Only a few regional pastas use tiny meatballs, such as Abruzzo's *chitarra con le pallottine*.
- **Receipts:** "You'll never find spaghetti and meatballs in Italy, at least outside of the most obvious tourist traps" ([Tasting Table](https://www.tastingtable.com/1190751/why-you-shouldnt-expect-to-find-spaghetti-and-meatballs-in-italy)).
- **Monster:** A giant glossy meatball. **[Snowball roller]** It rolls in long straight runs and bounces off walls, picking up spaghetti strands that make it bigger and faster.

#### 20. Creamy chicken "Alfredo": **Alfredo il Colloso** ("Alfredo the Gluey")
- **Category:** sauce · **Severity:** 3
- **Why Italians object:** The original was created by Roman restaurateur Alfredo di Lelio in the early 1900s and is just fettuccine, butter and Parmigiano. In Italy that's plain *fettuccine al burro*, home comfort food. Jarred cream-and-chicken "Alfredo sauce" is American.
- **Receipts:** Paraphrase: the dish was virtually unknown outside Italy until a 1927 US article and is not known by that name in Italy ([Wikipedia](https://en.wikipedia.org/wiki/Fettuccine_Alfredo)). Chef Barbara Pollastrini lists chicken fettuccine Alfredo among the dishes to avoid at "Italian" restaurants ([Insider via Yahoo](https://news.yahoo.com/italian-chef-shares-8-dishes-122700213.html)).
- **Monster:** A gloopy white-sauce blob with chicken-cube eyes. **[Tether]** It fires a sticky noodle strand that tethers the player and slows them until the strand is cut or stretched to breaking point.

#### 21. Chicken in pasta: **Pollo Infiltrato** ("Undercover Chicken")
- **Category:** meat · **Severity:** 4
- **Why Italians object:** In an Italian meal, pasta is the *primo* (first course) and chicken is a *secondo* (main course). Chicken-based pasta sauces are rare in Italian cooking.
- **Receipts:** "Mettere il pollo sulla pasta è un crimine in Italia" ("Putting chicken on pasta is a crime in Italy"), a pasta-activist sign at the Trevi Fountain in 2023 ([Blitz Quotidiano](https://archivio.blitzquotidiano.it/cronaca-italia/spaghetti-e-cappuccino-basta-a-fontana-di-trevi-attivisti-della-pasta-3543489)). A US recipe channel's creamy chicken pasta "fa infuriare gli italiani" ("makes Italians furious") ([Blitz Quotidiano](https://archivio.blitzquotidiano.it/blitztv/pasta-al-pollo-cremoso-la-ricetta-di-tasty-fa-infuriare-gli-italiani-video-2627595)).
- **Monster:** A drumstick in a spy's hat and false nose. **[Ambusher]** It hides inside innocent-looking pasta heaps on the map and bursts out when the player walks past.

#### 22. Chicken parmesan: **Cotoletta Travestita** ("Cutlet in Disguise")
- **Category:** meat · **Severity:** 2
- **Why Italians object:** In Italy *parmigiana* means layered fried aubergine (*melanzane alla parmigiana*). A breaded chicken cutlet smothered in sauce and cheese is an Italian-American invention.
- **Receipts:** Paraphrase: the dish is Italian-American, probably a cross between aubergine parmigiana and the breaded cutlet, and "Chicken Parmesan" has no direct Italian translation or equivalent ([Wikipedia](https://en.wikipedia.org/wiki/Chicken_parmesan)).
- **Monster:** A breaded cutlet wearing an aubergine costume. **[Berserker]** It shuffles along harmlessly until the first hit knocks its costume off. Then it enrages, doubling its speed and damage.

#### 23. Ketchup on pasta: **Spruzzatore Rosso** ("Red Squirter")
- **Category:** sauce · **Severity:** 5 · **YouGov:** −82 (Italians' #1 crime)
- **Why Italians object:** Ketchup is sweet, vinegary and processed, the opposite of a slow-cooked tomato sauce.
- **Receipts:** "The most distressing abuse of Italian food is having ketchup with pasta" (YouGov). Italians scored it −82, while people in 11 of the 17 places surveyed called it fine ([YouGov](https://yougov.co.uk/international/articles/40810-italian-food-crimes)).
- **Monster:** A squeeze bottle with an angry nozzle. **[Ranged kiter]** It keeps its distance, squirts arcing ketchup lines and backs away when approached (from the design brief).

#### 24. Garlic bread with pasta: **Pane all'Aglio Imbucato** ("Gatecrashing Garlic Bread")
- **Category:** etiquette · **Severity:** 1 · **YouGov:** −14 (mildest of the 11 crimes)
- **Why Italians object:** Bread on an Italian table is plain and there to mop up sauce (*fare la scarpetta*), not a buttery garlic side dish.
- **Receipts:** Paraphrase: garlic bread with pasta was the least unacceptable of YouGov's 11 crimes, and young Italians were noticeably more relaxed about it than older ones ([YouGov](https://yougov.co.uk/international/articles/40810-italian-food-crimes)).
- **Monster:** A slice of garlic bread in a party hat. **[Gatecrasher filler]** It is weak and tags along at the back of any passing wave. Its breath cone briefly shrinks the player's weapon range.

#### 25. Bottled "Italian dressing": **Condimento Inesistente** ("The Dressing That Doesn't Exist")
- **Category:** sauce · **Severity:** 2
- **Why Italians object:** Italians dress salad at the table with olive oil, vinegar or lemon, and salt. Pre-mixed bottled "Italian dressing" is a US product.
- **Receipts:** Paraphrase: "Italian dressing" is not used in Italy, where salad is dressed with olive oil, vinegar or lemon juice and salt ([Wikipedia](https://en.wikipedia.org/wiki/Italian_dressing)).
- **Monster:** A shaking dressing bottle with herb flecks for eyes. **[Confuser]** It shakes as a warning, then sprays a cone that inverts the player's controls for 2 s.

#### 26. Oil-and-balsamic bread dip: **Piattino dell'Intingolo** ("Little Dipping Dish")
- **Category:** etiquette · **Severity:** 2
- **Why Italians object:** Bread in Italian restaurants usually arrives plain. The dipping bowl of oil and balsamic is an American restaurant custom, and real *Aceto Balsamico Tradizionale* is aged for years and used a drop at a time.
- **Receipts:** Paraphrase: the dip mostly appears in restaurants catering to foreigners, although drizzling oil on bread (bruschetta) and mopping up sauce with bread *are* Italian ([The Takeout](https://www.thetakeout.com/1995053/why-dipping-oil-not-italian/)).
- **Monster:** A saucer of oil swirled with balsamic. **[Buffer]** It stays put and gives speed and armour to any enemy that walks through it. Kill the saucer first.

### D. Pizza crimes

#### 27. Pineapple on pizza: **Ananas Corazzato** ("Armoured Pineapple")
- **Category:** pizza · **Severity:** 4 · **YouGov:** −63
- **Why Italians object:** Sweet tinned fruit (usually with ham) wrecks the savoury balance of tomato and mozzarella. The "Hawaiian" was invented in Canada in 1962.
- **Receipts:** "Pineapple, a fruit, on a pizza?" (Gino D'Acampo on ITV's *This Morning*, 2018, [LADbible](https://www.ladbible.com/entertainment/film-and-tv-food-gino-dacampo-has-a-go-at-kids-for-liking-pineapple-on-pizza-20180213)). A twist: in December 2023 the Naples pizzaiolo Gino Sorbillo put a caramelised-pineapple pizza on his menu to fight "food prejudice", and Italy split down the middle ([The Local](https://www.thelocal.it/20240104/have-italians-finally-digested-the-idea-of-pineapple-on-pizza), [ANSA](https://www.ansa.it/english/news/2023/12/30/famed-naples-pizza-maker-adds-pineapple-spurring-row_af8865f7-4406-48dc-9cdf-70c5d0e59ba3.html)).
- **Monster:** A pineapple in spiky armour. **[Tank splitter]** It is slow and very tough, and on death bursts into 4 chunks that scatter and give chase (from the design brief).

#### 28. "Pepperoni": **Peperone Equivoco** ("The Misunderstood Pepper")
- **Category:** meat · **Severity:** 1
- **Why Italians object:** In Italian, *peperoni* are bell peppers. The spicy US sausage is Italian-American; in Italy the nearest thing is *salame piccante*, the topping on a pizza *diavola*.
- **Receipts:** Paraphrase: order *peperoni* on a pizza in Rome and you'll get bell peppers ([Tasting Table](https://tastingtable.com/1015040/why-you-might-be-confused-buying-pepperoni-in-italy)).
- **Monster:** A bell pepper painted to look like a salami slice. **[Swapper]** When hit, it teleports by trading places with another enemy, like a wrong order being delivered.

#### 29. Ketchup on pizza: **Margherita Macchiata** ("Stained Margherita")
- **Category:** pizza · **Severity:** 5
- **Why Italians object:** A Margherita is tomato, mozzarella, basil and oil. Ketchup on top is the pizza version of Italians' #1 crime.
- **Receipts:** Il Fatto Quotidiano's 2023 headline about a TikTok prankster squirting ketchup on pizza in Italy said he "uccide" ("kills") Italian cuisine. One restaurant manager reportedly grabbed the bottle and threw it ([Il Fatto Quotidiano](https://www.ilfattoquotidiano.it/2023/08/02/ketchup-sulla-pizza-spaghetti-tagliati-con-le-forbici-e-ghiaccio-nel-vino-rosso-il-tiktoker-americano-uccide-la-cucina-italiana/7249975/), [Asiae](https://www.asiae.co.kr/en/article/2023080408454629870)). Gino Sorbillo later took up a challenge with a homemade-tomato "ketchup" pizza: "someone wrote, 'Now see if you can do a ketchup one,' so I did it… And another row started." ([The Local](https://www.thelocal.it/20240104/have-italians-finally-digested-the-idea-of-pineapple-on-pizza)).
- **Monster:** A ketchup-splattered pizza spinning like a flying saucer. **[Radial burster]** Every 3 s it fires an 8-way ring of ketchup drops, and the ring rotates with each volley.

#### 30. Chicago deep dish: **Teglia Profonda** ("Deep Pan")
- **Category:** pizza · **Severity:** 3
- **Why Italians object:** Italian pizza is thin and blisters in minutes. Deep dish (Chicago, 1943) is a tall crust filled with cheese and topped with sauce, closer to a pie or casserole.
- **Receipts:** Chicago chef Graham Elliot called it "absolutely an abomination" and "a lasagna with a crust" ([Chicagoist](https://chicagoist.com/2014/03/24/chicago_chefs_claim_chicago-style_p.php)). Paraphrase: a VICE Italy writer tried it in Milan and decided a Margherita at half the price tastes better ([VICE](https://vice.com/en/article/italian-tries-chicago-deep-dish-pizza)).
- **Monster:** A walking cast-iron pan of pizza with castle-high crust walls. **[Frontal armour]** The crust blocks projectiles from the front, so flank it or use lobbed weapons (Moka, Pizza Volante). It is a mini version of a §2 boss.

#### 31. Banana-curry pizza: **Banana Speziata** ("Spiced Banana")
- **Category:** pizza · **Severity:** 4
- **Why Italians object:** Sweden's banana-and-curry pizza (often with ham or pineapple too) puts fruit *and* curry powder on a pizza, a double crime.
- **Receipts:** Paraphrase: Sweden's official "Curators of Sweden" account once called pineapple-banana-curry the "most Swedish pizza there is" ([Smithsonian](https://www.smithsonianmag.com/travel/bananas-and-curry-on-pizza-thats-how-the-swedish-do-it-180984961/)). Italian reaction is mostly online horror; no formal statements were found.
- **Monster:** A curry-dusted banana with a grin. **[Boomerang thrower]** It throws its own peel in a curving arc that comes back, so the player has to dodge it twice.

#### 32. Rolling pin on Neapolitan pizza dough: **Mattarello Traditore** ("Traitor Rolling Pin")
- **Category:** utensil · **Severity:** 2
- **Why Italians object:** Under the EU-protected *Pizza Napoletana* STG rules, the dough disc is stretched by hand only. The airy rim (*cornicione*) is pushed outward with the fingers, never flattened.
- **Receipts:** STG rules (art. 3) forbid "l'utilizzo di matterello e/o di macchina a disco tipo pressa meccanica" ("the use of a rolling pin and/or a mechanical disc press") ([Dissapore](https://www.dissapore.com/alimentazione/pizza-napoletana-stg-cambia-il-disciplinare-e-si-conferma-unassurdita/)).
- **Monster:** A corrupted twin of Chef Enzo's own Mattarello, with mean red eyes. **[Lane sweeper]** It dusts a wide lane with flour as a warning, then rolls across the whole arena, flattening everything in its path, enemies included.

#### 33. Candy-topped pizza: **Pizza Gommosa** ("Gummy Pizza")
- **Category:** viral social-media recipe · **Severity:** 4
- **Why Italians object:** Sour gummy sweets on pizza. In 2021 TikTok's biggest Italian creator replied with a proper hand-made Margherita.
- **Receipts:** Khaby Lame answered an American TikToker's gummy-candy pizza by kneading a classic Margherita, in a video titled "Please Don't Do that with Pizza!" ([Scatti di Gusto](https://www.scattidigusto.it/2021/06/06/khaby-lame-re-di-tiktok-spopola-americani-giu-le-mani-dalla-pizza/)).
- **Monster:** A pizza studded with neon sour gummies. **[Leech]** It flings gummies that stick to the player. Each stuck gummy slows them by 10% until they shake it off with a dash.

#### 34. Water-soaked reheated pizza: **Pizza Inzuppata** ("Soggy Pizza")
- **Category:** viral social-media recipe · **Severity:** 3
- **Why Italians object:** A 2025 "hack" told viewers to soak yesterday's pizza in water before air-frying it. Italians reheat leftover pizza in a pan or oven, or happily eat it cold.
- **Receipts:** Paraphrase: a food creator's suggestion to dunk leftover pizza in a bowl of water sparked a heated debate ([Il Fatto Quotidiano, Feb 2025](https://www.ilfattoquotidiano.it/2025/02/22/pizza-acqua-food-creator-dibattito/7887908/)).
- **Monster:** A dripping, sagging slice. **[Sponge absorber]** It soaks up projectiles at reduced damage and grows heavier and slower. After 10 soaked hits it bursts in a splash that damages *other* enemies.

#### 35. English-breakfast pizza: **Pizza all'Inglese** ("English-Style Pizza")
- **Category:** viral social-media recipe · **Severity:** 3
- **Why Italians object:** Beans, sausages, bacon and fried eggs on a pizza base: a full fry-up used as a topping.
- **Receipts:** "In Italia non mi inviteranno più: missione riuscita" ("They won't invite me to Italy any more: mission accomplished"), the TikToker behind it, quoted in the headline of [Il Fatto Quotidiano, July 2025](https://www.ilfattoquotidiano.it/2025/07/19/disgusto-per-la-pizza-con-gli-ingredienti-della-colazione-inglese-del-tiktoker-shef-phoenix-in-italia-non-mi-inviteranno-piu-missione-riuscita/8066855/).
- **Monster:** A greasy pizza scuttling on sausage legs. **[Summoner]** Every few seconds it tips over a tin and releases a swarm of tiny baked-bean minions.

### E. Cheese crimes and counterfeits

#### 36. Cheese on seafood pasta: **Vongola Formaggiosa** ("Cheesy Clam")
- **Category:** cheese · **Severity:** 3 · **YouGov:** −39
- **Why Italians object:** By unwritten rule, aged cheese drowns delicate seafood; spaghetti alle vongole is just garlic, oil and parsley. There are real exceptions, and the Parmigiano consortium itself lists some.
- **Receipts:** In 2019 an Italian restaurant in London refused a diner Parmigiano on his crab ravioli. The owner said they serve real Italian food and won't bend too far to local tastes (paraphrase, [Open](https://www.open.online/2019/05/01/il-ristoratore-che-ha-blastato-il-cliente-inglese-per-il-parmigiano-sul-pesce-educhiamo-gli-ospiti-lintervista/)). The Parmigiano Reggiano consortium replied with dishes where fish and cheese do work, such as stuffed squid ([Dissapore](https://www.dissapore.com/notizie/formaggio-sul-pesce-il-consorzio-del-parmigiano-reggiano-risponde-allo-chef-di-londra/)).
- **Monster:** A clam whose tongue is a cheese grater. **[Reflector]** While closed, its shell bounces projectiles back. It opens to spit grated cheese, so time your shots for the open window.

#### 37. Powdered "parmesan" shaker: **Spargipolvere** ("Dust-Sprinkler")
- **Category:** cheese · **Severity:** 4
- **Why Italians object:** Parmigiano Reggiano is a PDO cheese aged at least 12 months in a defined area. Shelf-stable pre-grated "parmesan" is often a different cheese and can contain cellulose filler.
- **Receipts:** In 2016, lab tests commissioned by Bloomberg found 7.8–8.8% cellulose in some US "100% grated parmesan" products. The FDA found that one supplier's "100% parmesan" contained no parmesan at all ([Boston Globe](https://www.bostonglobe.com/business/2016/02/17/are-you-eating-wood-instead-cheese/2z2ut4lWurS525ypJ46vbN/story.html)). In the EU, the Court of Justice ruled in 2008 that "Parmesan" evokes the Parmigiano Reggiano PDO (paraphrase, [CJEU press release](https://curia.europa.eu/en/actu/communiques/cp08/aff/cp080011en.pdf)).
- **Monster:** A flying shaker can trailing a dust cloud. **[Flyer / clogger]** It flies over walls and dusts the player. Each dusting clogs the player's weapons, cutting their fire rate for 3 s.

#### 38. "Italian Sounding" knock-offs: **Il Tarocco** ("The Fake")
- **Category:** cheese / counterfeit products · **Severity:** 4
- **Why Italians object:** These products borrow Italian-sounding names, flags or landscapes without being Italian: "Parmesao"- and "Reggianito"-style cheeses, imitation mozzarella, "Prosecco" on tap, jarred "carbonara" sauce. Mozzarella and Parmigiano/Grana are the most imitated.
- **Receipts:** Coldiretti, the farm lobby, puts the fake "Made in Italy" food trade at more than €120 billion worldwide (late 2025), about €42 billion of it in the US (June 2026). These are a lobby's own estimates ([Dissapore](https://www.dissapore.com/notizie/agroalimentare-il-valore-del-falso-made-in-italy-e-salito-a-120-miliardi/), [La Voce di New York](https://lavocedinewyork.com/vetrina-italiana/fancy-food/2026/06/29/italian-sounding-il-falso-made-in-italy-da-42-miliardi-lallarme-di-coldiretti-dal-fancy-food-26/)). In November 2025 the agriculture minister got a Belgian-made "carbonara" sauce pulled from the European Parliament's shop, calling such products the worst of Italian Sounding (paraphrase, [Brussels Times](https://brusselstimes.com/eu-affairs/1846923/italian-minister-fumes-at-delhaizes-ready-made-carbonara-sauce/)).
- **Monster:** A shifty box wrapped in a crooked, wrongly ordered tricolore. **[Mimic]** It disguises itself as a Parmigiano-chunk XP pickup or a Cannolo heal and bites when the player walks onto it. A sharp eye spots the misspelled label.

### F. Coffee and drinks

#### 39. Cappuccino after 11 or with a meal: **Cappuccino Ritardatario** ("Latecomer Cappuccino")
- **Category:** coffee & drinks · **Severity:** 3
- **Why Italians object:** Milky coffee is for breakfast. After lunch or dinner Italians drink an espresso, or at most a macchiato, and folk wisdom says milk after a meal hurts digestion. Italians do argue about how strict the rule really is.
- **Receipts:** "No al cappuccino con la pasta" ("No cappuccino with pasta"), a Trevi pasta-activist sign in 2023 ([Blitz Quotidiano](https://archivio.blitzquotidiano.it/cronaca-italia/spaghetti-e-cappuccino-basta-a-fontana-di-trevi-attivisti-della-pasta-3543489)). In May 2023 a viral sign in central Rome begged tourists "Please no cappuccino after 12 pm", and Gambero Rosso fired back with "cappuccino all day long" ([Gambero Rosso](https://www.gamberorosso.it/notizie/attualita/please-no-cappuccino-after-12-pm-lappello-diventa-virale-eccezioni-gambero-rosso/)).
- **Monster:** A cup with a clock face drawn in the foam. **[Time-gated]** It never spawns before 11:00 on the run timer. After that it speeds up each minute and leaves a foam trail that hides pickups (from the design brief).

#### 40. Ordering a "latte": **Bicchiere di Latte** ("Glass of Milk")
- **Category:** coffee & drinks · **Severity:** 1
- **Why Italians object:** *Latte* just means milk. Order a *caffè latte* or a *latte macchiato* instead.
- **Receipts:** "At least until recently, ordering a 'latte' in Italy got you a puzzled look and a hot glass of milk." (coffee writer Kenneth Davids, via [Wikipedia: Latte](https://en.wikipedia.org/wiki/Latte)).
- **Monster:** An innocent-looking glass of milk. **[Healer]** It keeps away from the player. When jostled, it spills milk that heals nearby enemies, which makes it a priority target.

#### 41. "Expresso": **Expresso Sbagliato** ("Wrong Expresso")
- **Category:** coffee & drinks · **Severity:** 2
- **Why Italians object:** The Italian word is *espresso*, with no x (French spells it *expresso*). To Italians, the x instantly gives away a non-Italian.
- **Receipts:** Paraphrase: Merriam-Webster records "expresso" as a less common variant spelling of espresso ([Merriam-Webster](https://merriam-webster.com/grammar/espresso-vs-expresso-usage-history)).
- **Monster:** A tiny espresso cup riding rails, with a steam whistle on top. **[Express charger]** It whistles and lays a straight rail across the map, then crosses the whole arena at extreme speed. Step off the rails.

#### 42. Lemon peel with espresso: **Scorza Sospetta** ("Suspicious Peel")
- **Category:** coffee & drinks · **Severity:** 2
- **Why Italians object:** Espresso with a lemon twist (sold abroad as "espresso Romano") is an Italian-American or international habit, not an Italian one.
- **Receipts:** Paraphrase: Marcella Hazan told the New York Times in 1991 that her restaurant served espresso without lemon and customers never asked for it ([CooksInfo](https://www.cooksinfo.com/espresso/)).
- **Monster:** A curly lemon-peel spiral. **[Constrictor orbiter]** It circles the player at a distance and slowly tightens the ring. Break out through the gap.

#### 43. Washing the moka pot with soap (or in the dishwasher): **Moka Insaponata** ("Soapy Moka")
- **Category:** utensil · **Severity:** 3
- **Why Italians object:** The house rule is to rinse an aluminium moka with hot water only. Detergent leaves flavours that spoil the next coffees and strips the pot's protective coating.
- **Receipts:** Paraphrase: Italian science site Geopop on cleaning the moka "the right way" names soap and the dishwasher as the classic don'ts, while admitting the hard evidence is thin ([Geopop](https://www.geopop.it/come-pulire-la-moka-nel-modo-giusto-cosa-dicono-gli-esperti-su-sapone-lavastoviglie-e-residui-di-caffe/)).
- **Monster:** A moka pot frothing with soap suds. **[Pressure bomb]** It plants itself and gurgles while a pressure gauge fills (3 s), then erupts in a big soapy-coffee geyser. It cools down and repeats.

#### 44. "Prosecco" on tap: **Bollicine alla Spina** ("Bubbles on Tap")
- **Category:** coffee & drinks · **Severity:** 3
- **Why Italians object:** Prosecco DOC is a protected wine. Fizzy wine poured from a keg cannot legally be called Prosecco.
- **Receipts:** "Prosecco on draught doesn't exist", Prosecco DOC consortium director Luca Giavi, defending the 2024 "This is not Prosecco" poster campaign on the London Underground ([The Local](https://www.thelocal.it/20240130/italian-winemakers-warn-british-drinkers-against-prosecco-on-tap), [consortium release](https://www.prosecco.wine/wp-content/uploads/2024/01/CS_26.01.2024_THIS-IS-NOT-PROSECCO_ENG.pdf)).
- **Monster:** A bar tap handle blowing fizzy bubbles. **[Bubble trapper]** It releases slow-rising bubbles. Touching one traps the player inside for 1.5 s (mash to pop out).

#### 45. Ice cubes in red wine: **Cubetto Guastafeste** ("Party-Pooper Ice Cube")
- **Category:** coffee & drinks · **Severity:** 3
- **Why Italians object:** Red wine is served at cellar or room temperature, and ice waters it down. It was one of the taboos a 2023 TikTok prankster broke on camera in Italy.
- **Receipts:** Paraphrase: Dissapore's report on the prankster lists ketchup on pizza, scissor-cut spaghetti and ice in red wine among his provocations ([Dissapore](https://www.dissapore.com/notizie/tiktoker-infrange-i-tabu-della-cucina-italiana-ketchup-nella-pizza-e-pasta-tagliata-con-le-forbici)).
- **Monster:** A grinning ice cube. **[Ricochet]** It slides like a hockey puck, ricocheting off walls and chilling (slowing) anything it hits, enemies included. For a younger rating, swap the wine for a soda (#44 as well).

### G. Table etiquette and language

#### 46. Twirling spaghetti with a spoon: **Cucchiaio Impiccione** ("Meddling Spoon")
- **Category:** etiquette · **Severity:** 2
- **Why Italians object:** Italian adults twirl long pasta with the fork alone against the plate. The spoon is for small children or brothy dishes.
- **Receipts:** Paraphrase: the vast majority of etiquette experts today say no to the spoon ([InsideHook](https://www.insidehook.com/article/food-and-drink/have-you-been-eating-spaghetti-wrong)).
- **Monster:** A nosy soup spoon. **[Shield-bearer]** It orbits other enemies and swats the player's projectiles away from them. Defeat it to expose the group.

#### 47. Pasta as a side dish: **Contorno Sbagliato** ("Wrong Side Dish")
- **Category:** etiquette · **Severity:** 4 · **YouGov:** −55
- **Why Italians object:** Pasta is the *primo*, a course of its own. A *contorno* is vegetables served alongside the meat course, never pasta piled next to a steak.
- **Receipts:** Paraphrase: YouGov singles it out as the habit Italians hate most that people in every other surveyed country find fine ([YouGov](https://yougov.co.uk/international/articles/40810-italian-food-crimes)). A 2026 BBC guide to eating in Italy, as reported in the Italian press, notes that side dishes come on separate plates and that asking for everything at once is unusual ([Sky TG24](https://tg24.sky.it/lifestyle/2026/07/31/errori-da-non-fare-ristorante-italiano-bbc)).
- **Monster:** A heap of noodles chained to a sulky steak. **[Linked pair]** The two spawn together and share one health bar. Kill both within 3 s of each other, or the survivor revives its partner.

#### 48. "A panini": **Panino Moltiplicato** ("Multiplied Sandwich")
- **Category:** etiquette (language) · **Severity:** 1
- **Why Italians object:** A *panino* is one sandwich and *panini* are several, so "a panini" and "paninis" make Italians wince.
- **Receipts:** "If you just want one, make sure you say 'un panino'" ([The Local](https://www.thelocal.it/20190601/ten-common-language-mistakes-italian)). The Italian plural began to be used as an English singular in the late 20th century ([Wikipedia](https://en.wikipedia.org/wiki/Panini_%28sandwich%29)).
- **Monster:** A pressed sandwich with grill marks. **[Multiplier]** Single-target hits split it into 2 smaller *panini*, up to 8 in all, while area damage kills it cleanly. It teaches players the value of AoE.

#### 49. "Brushetta": **Bruschetta Storpiata** ("Mangled Bruschetta")
- **Category:** etiquette (language) · **Severity:** 1
- **Why Italians object:** In Italian, *sch* is a hard sound: it's bru-SKET-ta, not bru-SHET-ta.
- **Receipts:** Paraphrase: the standard Italian pronunciation is [bruˈsketta], and the "sh" version is an English-speakers' form ([Wikipedia](https://en.wikipedia.org/wiki/Bruschetta)).
- **Monster:** A slice of toast with a tomato mouth that hisses "SHHH". **[Silencer]** Its "sh" sound cone silences the player's weapons for 1 s. Approach it from the side.

### H. Viral social-media recipes

#### 50. Countertop spaghetti: **Spaghetti da Bancone** ("Countertop Spaghetti")
- **Category:** viral social-media recipe · **Severity:** 5
- **Why Italians object:** A 2021 Facebook video poured jarred sauce, meatballs, grated cheese and cooked spaghetti straight onto a kitchen counter and mixed it all by hand. It was presented as the Italian way, and was probably a staged "hack" video.
- **Receipts:** "I'm Italian and real Italians - this is how you make spaghetti", the creator's claim as reported by [IBTimes](https://ibtimes.com/heres-easiest-hack-make-pasta-sorry-if-it-makes-you-cringe-3198138). Many Italians left angry comments ([Refinery29](https://www.refinery29.com/en-gb/2021/05/10469771/prego-pasta-kitchen-counter-viral-video)).
- **Monster:** A living countertop slab smeared with sauce. **[Creep spreader]** It spreads a growing carpet of sticky sauce that slows the player, and meatball minions pop out of the mess.

#### 51. Oven-"boiled" raw spaghetti: **Teglia Annegata** ("Drowned Baking Dish")
- **Category:** viral social-media recipe · **Severity:** 4
- **Why Italians object:** In this TikTok recipe, raw spaghetti is drowned in sauce and water in a baking dish, topped with cheese cubes, served with pickles and presented as Italian.
- **Receipts:** Bruno Barbieri, the Michelin-starred chef and TV judge, posted his horrified TikTok reaction. Greenme called the dish "un incommentabile oltraggio alla buona cucina italiana" ("an unspeakable outrage to good Italian cooking") ([Greenme](https://www.greenme.it/lifestyle/costume-e-societa/lo-chef-barbieri-inorridisce-di-fronte-alla-ricetta-degli-spaghetti-cotti-al-forno-di-tik-tok/)).
- **Monster:** A casserole dish brimming with soggy noodles. **[Artillery turret]** It stays put and lobs cheese cubes at warning circles, plus pickle slices that bounce.

#### 52. Pasta chips: **Patatine di Pasta** ("Pasta Crisps")
- **Category:** viral social-media recipe · **Severity:** 2
- **Why Italians object:** Boiled pasta is air-fried crisp and eaten with dips (2021). By Italian standards it's a minor crime, since fried pasta already exists in Italian home cooking.
- **Receipts:** Belgian broadcaster RTBF called it "le nouvel affront à la gastronomie italienne" ("the latest affront to Italian gastronomy") ([RTBF](https://www.rtbf.be/article/transformer-les-pates-en-chips-le-nouvel-affront-a-la-gastronomie-italienne-sur-tiktok-10799619)). Pasta Grammar points to Italy's real fried-pasta traditions ([Pasta Grammar](https://www.pastagrammar.com/post/fried-pasta-recipe-the-real-italian-pasta-chips)).
- **Monster:** A crunchy bow-tie crisp. **[Swarm]** They come in flocks of 20 or more, fragile and fast, wheeling in bird-like formations.

#### 53. Baked feta pasta: **Feta Vulcanica** ("Volcanic Feta")
- **Category:** viral social-media recipe · **Severity:** 2
- **Why Italians object:** A block of feta baked with cherry tomatoes and stirred into pasta (2021). It isn't Italian, but Italians mostly rolled their eyes rather than raging.
- **Receipts:** "Pasta feta: che male abbiamo fatto per meritarci la ricetta virale su TikTok" ("Feta pasta: what did we do to deserve this viral TikTok recipe?"), a [Scatti di Gusto](https://www.scattidigusto.it/2021/03/01/pasta-feta-che-male-abbiamo-fatto-per-meritarci-la-ricetta-virale-su-tiktok) headline, March 2021.
- **Monster:** A smoking feta block in a baking dish. **[Eruption turret]** Every 6 s it erupts a ring of cherry-tomato bombs that burst where they land.

#### 54. "Hawaiian" spaghetti: **Spaghetti Hawaiani**
- **Category:** viral social-media recipe · **Severity:** 4
- **Why Italians object:** A 2022 recipe on a British public broadcaster's food site combined spaghetti with tinned pineapple (juice and all), tinned ham and cream cheese.
- **Receipts:** Paraphrase: London-based Italian chef Francesco Mazzei reacted with horror, though he admitted pineapple can work in experiments ([Newsweek](https://newsweek.com/italian-chef-reacts-horror-hawaiian-spaghetti-recipe-1749814)). Wanted in Rome asked whether Italy was ready for it ([Wanted in Rome](https://www.wantedinrome.com/news/is-italy-ready-for-bbcs-hawaiian-spaghetti-recipe.html)).
- **Monster:** A nest of spaghetti in a grass skirt, crowned with a pineapple ring. **[Shockwave dancer]** Its hula dance sends out expanding ring waves. Dash through the gaps.

---

## 2. Boss candidates

#### B1. **Il Re Ananas** ("The Pineapple King")
- **Crime:** pineapple on pizza (#27, YouGov −63), plus the Neapolitan "traitors" who put it on the menu.
- **Look:** A giant pineapple on a throne of ham cubes, with a spiky leaf crown and a cape made from a pizza box.
- **Attack pattern:**
  1. *Corona Boomerang*: hurls leaf crowns that arc out and back.
  2. *Pioggia di Anelli*: tinned pineapple rings rain down. Each marks a doughnut-shaped AoE, and the hole in the middle is the safe spot.
  3. *Guardia di Prosciutto*: summons ham-cube guards that orbit him.
  4. *Caramellato*, below 50% HP: he caramelises (a nod to Sorbillo's caramelised pineapple). The floor turns sticky and his attacks speed up.
  5. Death: he bursts into a dozen Ananas Corazzato chunks for a mini-wave finale.

#### B2. **Il Colosso di Panna** ("The Cream Colossus")
- **Crime:** cream in carbonara (#1, YouGov −45) and "a slick of double cream" in cacio e pepe (#9).
- **Look:** A towering whipped-cream golem with a piping-bag arm and an aerosol-can head.
- **Attack pattern:** (1) *Muri di Panna*: pipes cream walls that carve the arena into lanes. (2) *Onda Scivolosa*: a ground wave that leaves Panna Invasora puddles behind. (3) *Doppia Panna*: below 50% it splits into two half-size colossi. (4) *Impazzisce* (the cream "breaks"): hitting it with Pecorino, Macinapepe (pepper) or pasta-water effects curdles it and opens a 5 s damage window.
- **Arena:** A giant carbonara bowl. Beating it turns the cream-white bowl back to a proper golden yellow.

#### B3. **Il Pizzone Abissale** ("The Abyssal Deep-Dish")
- **Crime:** Chicago deep dish (#30), "a lasagna with a crust".
- **Look:** A walking cast-iron pan with fortress-high crust walls and sauce bubbling on top like lava.
- **Attack pattern:** (1) *Salsa in Cima*: sections of the arena flood with sauce-lava, because in deep dish the sauce goes on top. (2) *Muraglia di Crosta*: crust walls rise to cage the player. (3) *Filo Infinito*: endless mozzarella strings tether and reel the player in. (4) *Forchetta e Coltello*: a giant knife and fork slam down lanes, since you need cutlery to eat this "pizza". (5) Finale: the pan tips over and spills Teglia Profonda minis.

#### B4. **L'Influencer della Padella Unica** ("The One-Pan Influencer")
- **Crime:** viral fake-Italian recipe videos (#6, #50, #51, #52, #53).
- **Look:** A smartphone on a selfie stick with a ring-light halo and an apron reading "100% AUTHENTIC".
- **Attack pattern:**
  1. *Flash*: a blinding ring-light cone. Face away from it or the screen whites out.
  2. *In Diretta* (going live): each phase streams a new "trend" and spawns that recipe's enemies, from Spaghetti da Bancone to Patatine di Pasta to Feta Vulcanica.
  3. *Pioggia di Like*: homing heart projectiles.
  4. *Algoritmo*: every enemy speeds up while a view counter climbs. Smash the counter drones to stop it.
  5. *Commenti*: bubbles from Italian viewers ("MA CHE FAI?!", "VERGOGNA!") rain down and **damage the boss**. Stand near them to boost them.
- **Inspiration:** Italian creators who take fake recipes apart (§6) and the @ItalianComments "italians mad at food" phenomenon. Keep it an archetype and never a real person.

#### B5. **Il Microonde Maledetto** ("The Cursed Microwave")
- **Crime:** ready-meal and reheating crimes: canned carbonara (#7), jarred "carbonara" sauce (#38), the soaked-pizza hack (#34).
- **Look:** A haunted microwave with a glowing turntable and a door that chomps.
- **Attack pattern:** (1) *Piatto Girevole*: the arena floor rotates. (2) *DING!*: a radial pulse at the end of each "cooking cycle". (3) *Riscaldato*: revives defeated enemies as soggier, faster versions. (4) *Pioggia di Scatolette*: drops Scatoletta Maledetta cans. (5) *Sportello Aperto*: after each DING the door opens and exposes its glowing core for 4 s.

#### B6. **Il Barone del Ketchup** ("The Ketchup Baron")
- **Crime:** ketchup on pasta (#23, Italians' #1 crime at −82) and on pizza (#29).
- **Look:** A squeeze bottle in a top hat and monocle, seated on a throne of fries.
- **Attack pattern:** (1) *Spirale*: bullet-hell spiral sprays. (2) *Marea Rossa*: floods half the arena, with the side telegraphed in advance. (3) *Tappo*: his nozzle clogs and he shakes violently, which leaves him vulnerable but splattering. (4) *Rinforzi*: summons Spruzzatori Rossi and Margherite Macchiate.

#### B7. **Il Re del Tarocco** ("The Counterfeit King")
- **Crime:** Italian Sounding fakes (#38), "Parmesan" (#37) and "Prosecco" on tap (#44).
- **Look:** A tricolore sash in the wrong colour order and a crown of misspelled labels ("Parmezan", "Mozarela", "Prosseco").
- **Attack pattern:** (1) *Copia*: copies the player's current weapon, badly, and fires it back. (2) *Etichette*: swaps labels so enemies trade behaviours. (3) *Finto Bottino*: turns some pickups into Tarocco mimics. (4) *Scudo Legale*: he stays invulnerable until "certified" by three hits from DOP/IGP-themed weapons (Forma di Parmigiano, San Marzano, Basilico).

#### B8. **L'Idra alla Bolognese** ("The Bolognese Hydra")
- **Crime:** spaghetti bolognese (#18), "doesn't actually exist".
- **Look:** A many-headed tangle of spaghetti, each head wrapped in a "FAKE NEWS" front page.
- **Attack pattern:** (1) *Teste*: cut heads regrow unless finished by the Spaghetti lash or the Golden Tagliatella relic. (2) *Cartoline*: homing "Greetings from Bologna!" postcards. (3) *Flash dei Turisti*: tourist camera flashes that stun. (4) *Redenzione*: at 0 HP it transforms into proper *tagliatelle al ragù* and drops a legendary item.

#### B9. **Il Campanile del Cappuccino** ("The Cappuccino Clock Tower")
- **Crime:** cappuccino after 11 or with pasta (#39).
- **Look:** A towering cup with a clock face in the foam and a cocoa-dust bell.
- **Attack pattern:** It wakes only when the run timer passes 11:00. (1) *Rintocco*: each chime adds a ring of milk bubbles. (2) *Schiuma*: rising foam hides projectiles and pickups. (3) *Cacao*: a cocoa-dust storm. (4) *Dopo Pranzo* ("after lunch"): it enrages for the last minutes of the run. **Weakness:** the Espresso passive and espresso pickups deal triple damage to it.

#### B10. **Il Golem di Polvere** ("The Powder Golem")
- **Crime:** pre-grated "parmesan" with fillers (#37).
- **Look:** A towering figure of dust and cellulose flakes with a shaker-can head.
- **Attack pattern:** (1) *Tempesta*: a sandstorm that cuts visibility. (2) *Ricomposizione*: it reforms from dust unless hit by the Grattugia or the Forma di Parmigiano. (3) *Mattoni di Cellulosa*: filler bricks that turn into obstacles. (4) Summons Spargipolvere flyers. The real Parmigiano wheel deals triple damage.

**Suggested stage mapping** (mini-bosses at 5:00 and 10:00, final boss at 15:00, per `DESIGN.md`).
This was the original proposal; the boss line-up of each dish in the game is in
[DESIGN.md](DESIGN.md#il-menù-the-levels).

| Stage | 5:00 | 10:00 | 15:00 final |
|---|---|---|---|
| La Cucina | Teglia Profonda (elite) | Il Golem di Polvere | Il Colosso di Panna |
| La Trattoria | Il Campanile del Cappuccino | L'Idra alla Bolognese | Il Barone del Ketchup |
| I Vicoli di Napoli | Il Pizzone Abissale | Il Microonde Maledetto | Il Re Ananas |
| La Food Court | Il Re del Tarocco | (any two from above, empowered) | L'Influencer della Padella Unica |

---

## 3. Heroes of tradition

★ = already in `DESIGN.md`. The cultural line can go straight into the Ricettario.

| Item | Suggested use | Cultural meaning |
|---|---|---|
| ★ **Mattarello** (rolling pin) | weapon | Emilia's *sfogline* roll egg pasta paper-thin with a long, slim pin, yet it is banned on Neapolitan pizza dough (#32). |
| ★ **Ciabatta della Nonna** (slipper) | weapon | The flying slipper is a beloved comic meme of Italian childhood: nonna's aim never misses. |
| ★ **Forchetta** (fork) | weapon | Italians eat spaghetti with the fork alone, twirled against the plate, with no spoon (#46). |
| ★ **Coltelli** (chef's knives) | weapon | The *battuto* of onion, carrot and celery, chopped fine, is the base of countless sauces. |
| ★ **Olive** | weapon | Olive groves run from Liguria to Puglia, which grows a huge share of Italy's olive oil. |
| ★ **Pizza Volante** | weapon | Neapolitan dough is stretched and spun by hand, never rolled. The art of the *pizzaiuolo* has been UNESCO heritage since 2017. |
| ★ **Rotella** (wheel cutter) | weapon | The fluted wheel cuts ravioli, pappardelle and pizza slices. |
| ★ **Peperoncino** | weapon / burn | Calabria's chilli, strung in red bunches on balconies. The town of Diamante holds a Peperoncino Festival. |
| ★ **Moka** | weapon | The stovetop coffee pot invented in 1933 in Piedmont. Nearly every Italian kitchen has one, and it's rinsed with water only (#43). |
| ★ **Spaghetti** | weapon | By law, Italian dried pasta is made from durum-wheat semolina and water. |
| ★ **Vesuvio** | weapon | The volcano over Naples. Its slopes grow the *pomodorino del piennolo* DOP, cherry tomatoes hung in bunches to keep through winter. |
| ★ **Forma di Parmigiano Reggiano** | weapon | ~40 kg wheels aged at least 12 months. It is a PDO cheese from five provinces of Emilia-Romagna and Lombardy. |
| ★ **Basilico** | weapon | Ligurian *Basilico Genovese* DOP is the soul of pesto. |
| ★ **Forno a legna** (wood oven) | weapon / aura | A Neapolitan pizza bakes in a dome oven at roughly 430–485 °C in about a minute. |
| ★ **Olio Extra Vergine** | passive | Italian cooking's fat. A raw drizzle (*a crudo*) finishes soups, beans and bread. |
| ★ **Espresso** | passive | Sipped fast, standing at the bar counter (*al banco*). It's the after-lunch coffee (#39). |
| ★ **Grembiule della Nonna** (apron) | passive | Nonna's apron is the uniform of the home kitchen and comes off only at the table. |
| ★ **Pomodoro San Marzano** | passive / ammo | Long plum tomatoes from the Agro Sarnese-Nocerino near Naples (DOP), the benchmark for Neapolitan sauce. |
| ★ **Minestrone** | passive | The vegetable soup every family makes differently, built on whatever the season brings. |
| ★ **Grattugia** (grater) | passive | Cheese is grated fresh at the table, never shaken from a can (#37). |
| ★ **Semola di Grano Duro** | passive | Durum-wheat semolina gives dried pasta its bite and keeps it *al dente*. |
| ★ **Macinapepe** (pepper mill) | passive | Freshly cracked black pepper is half the name of *cacio e pepe* and essential in carbonara. |
| ★ **Cornicello** | passive | The red Neapolitan horn against the evil eye. Tradition says it only works if someone gives it to you. |
| ★ **Ricettario della Nonna** | passive | The handwritten family recipe notebook, with "q.b." (*quanto basta*, "as much as needed") everywhere. |
| ★ **Profumo di Ragù** | passive | Sunday ragù simmers for hours; in Naples it must *pippiare*, barely bubbling. |
| ★ **Sale Grosso** | passive | Coarse salt goes into the pasta water once it boils, never earlier. |
| ★ **Cannolo** | pickup | Sicily's crisp shell filled with sweet ricotta. |
| ★ **Lasagna** | pickup | In Emilia, layers of green spinach pasta, ragù and béchamel make the Sunday dish. |
| ★ **Gelato** | pickup | Denser and less airy than ice cream, served with a flat spatula, not a scoop. |
| ★ **Campanella della Nonna** + "A TAVOLA!" | pickup | The call to dinner. When nonna calls, everyone comes running, immediately. |
| **Mezzaluna** (half-moon chopper) | new weapon | A two-handled crescent blade rocked over herbs and the *battuto*. |
| **Pala** (pizza peel) | new weapon | The pizzaiuolo's long paddle for sliding pizzas in and out of the oven. It could deflect projectiles. |
| **Mortaio e pestello** (marble mortar) | new weapon | Pesto is crushed in Carrara marble with a wooden pestle, and Genoa holds a pesto-in-mortar world championship. |
| **Chitarra** | new weapon | Abruzzo's wire-strung frame that cuts *spaghetti alla chitarra*. It could become a "string wall" that slices enemies. |
| **Ferretto** | new weapon | The thin rod used across the South to roll *fusilli* or *maccheroni al ferretto* by hand. |
| **Cucchiaio di legno** (wooden spoon) | new weapon | Nonna's stirring spoon for the ragù, and a legendary threat to naughty grandchildren. |
| **Martelletto del battitore** | new weapon | Fewer than thirty expert *battitori* tap every Parmigiano wheel with a hammer to hear hidden flaws. |
| **Pecorino Romano** | new passive | The sheep's cheese of carbonara, amatriciana and cacio e pepe, and ~95–97% of it is made in Sardinia. |
| **Guanciale** | new passive | Cured pork cheek, the non-negotiable meat of the Roman classics (#1–#4). |
| **Acqua di cottura** (pasta water) | new passive | Starchy cooking water binds sauces (*mantecatura*); Italian cooks save a ladle before draining. |
| **Pane per la scarpetta** | new pickup | *Fare la scarpetta*, wiping the plate clean with bread, is the highest compliment to the cook. It could vacuum up XP. |
| **Tagliatella d'Oro** | relic | In 1972 Bologna lodged the official tagliatella: 8 mm wide cooked (≈7 mm raw), 1/12,270 of the Asinelli tower. A golden sample is on display. |
| **Aceto Balsamico Tradizionale di Modena** DOP | rare elixir | Aged at least 12 years through a series of barrels made of different woods, and used a drop at a time. |
| **Mozzarella di Bufala Campana** DOP | big heal | Water-buffalo mozzarella from Campania, best eaten the day it's made. |
| **Limone della Costiera** | pickup | Amalfi's huge *sfusato* lemons, grown on terraced pergolas above the sea. |

---

## 4. Italian exclamations

All are family-friendly. Avoid religious exclamations (they can tip into *bestemmia*, blasphemy) and swear words.

| Italian | Meaning | Mood → suggested use |
|---|---|---|
| Mamma mia! | "My mother!": oh my goodness! | shock → crime spotted, huge combo |
| Che schifo! | How disgusting! / Gross! | outrage → crime enemy spawns |
| Non si fa! | That's not done! / You don't do that! | outrage → new crime type appears |
| Ma che fai?! | What are you doing?! | outrage → player takes a hit |
| Ma che roba è?! | What on earth is this stuff?! | outrage → first sight of an enemy |
| Vergogna! | Shame! | outrage → boss intro |
| È un crimine! | It's a crime! | outrage → elite enemy |
| Che orrore! | How horrible! | outrage → viral-recipe wave |
| Che disastro! | What a disaster! | dismay → run lost |
| Mannaggia! | Darn it! (mild, southern) | frustration → damage taken |
| Accidenti! | Blast! / Darn! | frustration → missed chest |
| Uffa! | Ugh! (annoyed) | annoyance → low HP |
| Porca paletta! | Holy moly! (childish euphemism) | surprise → rare drop |
| Ma dai! | Come on! / No way! | disbelief → enemy revives |
| Ma va'! | Get out of here! (disbelief) | disbelief → lucky crit |
| Stai scherzando?! | Are you kidding me?! | disbelief → boss phase 2 |
| Sei matto?! | Are you crazy?! | outrage → pineapple/ketchup spawn |
| Non ci posso credere! | I can't believe it! | disbelief → legendary drop |
| Che figura! | How embarrassing! (lit. "what a figure") | embarrassment → death |
| Aiuto! | Help! | panic → surrounded |
| Basta! | Enough! | anger → ultimate / screen clear |
| Fermi tutti! | Everybody freeze! | command → Gelato pickup |
| Forza! | Come on! / Go! | encouragement → level up |
| Dai, dai, dai! | Come on, come on, come on! | hype → final minute |
| Andiamo! | Let's go! | start of run |
| Avanti! | Onward! | new wave |
| Ecco fatto! | There, done! | wave cleared |
| Perfetto! | Perfect! | perfect dodge |
| Bravo! / Brava! / Bravissimo! | Well done! | praise → evolution unlocked |
| Evviva! | Hooray! | boss defeated |
| Buonissimo! | Delicious! | joy → heal pickup |
| Che buono! | How tasty! | joy → food pickup |
| Che bontà! | What goodness! / Yum! | joy → chest opened |
| Squisito! | Exquisite! | joy → rare item |
| Una delizia! | A delight! | joy → perfect run |
| Da leccarsi i baffi! | Lick-your-moustache good! | joy → big reward |
| Al dente! | Just right ("to the tooth") | approval → perfect timing |
| Proprio come la faceva la nonna! | Just like Nonna made it! | nostalgia → legendary item |
| A tavola! | To the table! / Dinner's ready! | call → Campanella pickup |
| Mangia! | Eat! | nonna's order → heal pickup |
| Buon appetito! | Enjoy your meal! | friendly → stage start |
| Salute! | Bless you! / Cheers! | friendly → Spumante pickup, pepper sneeze |
| Facciamo la scarpetta! | Let's mop up the sauce! | joy → XP vacuum |

**Gestures** (great for idle animations and emotes):

| Gesture | Meaning | Use |
|---|---|---|
| Fingertips pinched together, hand shaken up and down (*mano a borsa*, the 🤌 emoji) | "Ma che vuoi?!" ("What do you want?! / What are you saying?!") | chef reacts to a crime spawn |
| Index finger pressed into the cheek and twisted | "Buono!" ("Delicious!") | heal/food pickup |
| Palms pressed together, shaken | "Ti prego!" / "Ma per favore!" ("I beg you! / Oh, come on!") | boss intro, plea |
| Hand flapped loosely from the wrist | "Mamma mia…": wow, that's a lot / you're in trouble | combo counter, big wave |
| Palm slapped to the forehead | "Che sbadato!" ("Silly me!") | death animation |
| Kissing the fingertips ("chef's kiss") | "Perfetto!" | Use sparingly: more international cliché than everyday Italian gesture |

---

## 5. Settings

The first three match `DESIGN.md` stages. Later entries are candidates for future stages.
(The four built environments now host the dishes of [Il Menù](DESIGN.md#il-menù-the-levels).)

#### S1. **La Cucina**: the trattoria kitchen (Stage 1)
- Flour-dusted marble worktop, a wooden *spianatoia* and a long mattarello.
- Copper pans on wall hooks, a moka on the stove, and the Sunday ragù simmering in a big pot.
- Garlic braids and strings of dried red peperoncini, a bay-leaf branch, crates of tomatoes.
- Rows of homemade *passata* bottles from the August tomato-sauce day (*fare la salsa*).
- Majolica wall tiles and a checkered tea towel.
- **Crime spotlight:** Panna Invasora, Spezzaspaghetti, Pasta Scotta, Chiazza d'Olio, Pentola Fredda.

#### S2. **La Trattoria**: a Roman dining room at night (Stage 2)
- Red-and-white checked tablecloths, paper placemats, a chalkboard menu ("cacio e pepe · carbonara · amatriciana · gricia").
- Straw-wrapped bottles used as candle holders, framed photos of the regulars, and a kitchen hatch where orders are shouted.
- An ivy-covered façade with hanging lanterns outside.
- **Crime spotlight:** the Roman four (#1–#9), Cappuccino Ritardatario, Contorno Sbagliato.

#### S3. **I Vicoli di Napoli**: the Naples alleys (Stage 3)
- Narrow sloping alleys of the Quartieri Spagnoli, with laundry strung balcony to balcony.
- The *panaro*: a basket lowered on a rope from a balcony to collect shopping.
- *Bassi* (ground-floor homes opening onto the street), scooters weaving through, pizza-fritta stands.
- Stalls of red cornicelli, a "caffè sospeso" sign at the bar, and Vesuvius on the skyline.
- **Crime spotlight:** the pizza crimes (#27–#35).

#### S4. **La Food Court**: the crimes' lair (Stage 4)
- The enemy's turf: a fake-Italian chain-restaurant look with plastic grapevines and a neon "AUTENTICO ITALIANO" sign with a dead letter.
- Laminated photo menus, bottomless breadstick baskets, ketchup and "parmesan" shaker stations, and a pre-mixed "Italian dressing" fountain.
- **Crime spotlight:** Il Tarocco, Spargipolvere, Alfredo il Colloso, the viral-recipe enemies (#50–#54).

#### S5. **La Piazza Romana**: a Roman piazza
- Black basalt *sampietrini* cobbles and *nasoni*, the cast-iron drinking fountains.
- Ochre and burnt-orange façades with green shutters, plus umbrella pines.
- "SPQR" stamped on the manhole covers, a Baroque fountain, scooters.
- Café tables outside a bar with a hand-written "No cappuccino after 12" sign.
- **Crime spotlight:** coffee crimes. **Boss:** Il Campanile del Cappuccino.

#### S6. **Sotto i Portici di Bologna**: the Bologna porticoes
- Endless red-brick porticoes with vaulted ceilings (UNESCO World Heritage since 2021).
- The Two Towers: the tall Asinelli and the leaning Garisenda.
- The Quadrilatero market lanes, with mortadella and prosciutto hanging over cheese wheels.
- Fresh-pasta shops where *sfogline* roll dough in the window, trays of tortellini, and the golden tagliatella in a glass case.
- **Crime spotlight:** Spaghetti Fantasma. **Boss:** L'Idra alla Bolognese.

#### S7. **Il Mercato di Palermo**: a Sicilian street market (Ballarò / Vucciria)
- Striped awnings and bare lightbulbs strung over the stalls, with ambient audio of the vendors' sing-song *abbanniate*.
- Swordfish heads displayed upright, mounds of blood oranges, lemons, capers and artichokes.
- *Arancine*, *panelle* and *sfincione* stalls, and painted Sicilian carts showing knights and paladins.
- **Crime spotlight:** Banana Speziata, Vongola Formaggiosa. **Boss:** Il Re del Tarocco, set up as a counterfeit stall.

#### S8. **Il Porto Ligure**: a Ligurian harbour (Camogli / Genoa)
- Tall pastel houses with *trompe-l'œil* painted windows and slate roofs.
- *Gozzi* (wooden fishing boats) and nets drying on the quay.
- Narrow *carruggi* alleys climbing uphill, trays of oily focaccia in bakery windows, basil pots on the sills.
- **Crime spotlight:** Frullatore Rovente, Vongola Formaggiosa, Cucchiaio Impiccione.

#### S9. **La Vigna del Chianti**: a Tuscan vineyard
- Rolling hills, rows of vines and silver olive trees, cypress-lined drives.
- A stone farmhouse (*casale*) with a terracotta roof, an outdoor grill for *bistecca alla fiorentina*, harvest crates and summer sunflowers.
- **Crime spotlight:** Bollicine alla Spina, Cubetto Guastafeste. **Boss:** Il Golem di Polvere as a dust storm on the white gravel roads.

#### S10. **Il Bar dell'Espresso**: a Milan espresso bar
- A long marble-and-zinc counter (*bancone*), with *tazzine* stacked on top of the machine to keep warm.
- You pay at the *cassa* first and hand your receipt (*scontrino*) to the barista. Customers stand to drink, beside a glass case of cornetti.
- **Crime spotlight:** #39–#44. **Boss:** Il Campanile del Cappuccino (alternate).

#### S11. **Il Magazzino del Parmigiano**: a cheese-ageing warehouse in Emilia
- Cathedral-like aisles of wooden racks stacked to the ceiling with 40 kg wheels.
- Rinds dotted with the "Parmigiano Reggiano" pin-dot lettering, wheel-turning robots, and a *battitore* tapping wheels with his little hammer.
- **Crime spotlight:** Spargipolvere, Il Tarocco. **Boss:** Il Golem di Polvere.

#### S12. **Bari Vecchia**: the "orecchiette street" in Puglia
- White limestone alleys and arches, where women sit at tables outside their doors shaping orecchiette with a knife and thumb.
- Orecchiette drying on wooden screens, sellers of fried *sgagliozze*, and dazzling Adriatic light.
- **Crime spotlight:** Pasta Scotta, Lo Sciacquapasta, Pentola Fredda.

#### S13. **La Costiera dei Limoni**: the Amalfi Coast lemon terraces
- Terraced lemon groves under chestnut-wood pergolas, with lemons the size of a fist.
- Majolica-tiled benches, staircases cut into the cliffs, pastel villages tumbling into the sea, fishing boats.
- **Crime spotlight:** Scorza Sospetta. **Boss:** L'Influencer della Padella Unica, filming on the terrace for likes.

---

## 6. Research notes & surprises

- **Italians' own ranking (YouGov, Feb 2022, 19,911 adults in 17 markets):** ketchup on pasta −82; pasta started in cold water −71 (#2, *worse than pineapple*); pineapple pizza −63; pasta as a side dish −55; cutting long pasta −46; cream in carbonara −45; cheese with seafood pasta −39; garlic bread with pasta −14 (mildest). **Bolognese sauce on spaghetti is acceptable to Italians (+81)**, the Bologna mayor's crusade notwithstanding ([YouGov](https://yougov.co.uk/international/articles/40810-italian-food-crimes), [YouGov on X](https://twitter.com/YouGov/status/1489534358218326017)).
- **Carbonara's "pure" recipe is a modern consensus.** The first Italian recipe in print (*La Cucina Italiana*, 1954) used pancetta, Gruyère and garlic ([Il Sole 24 Ore](https://en.ilsole24ore.com/art/carbonara-day-ricetta-compie-70-anni-e-aglio-e-gruviera-fa-inorridire-puristi-AFSGQIKD)). A 1939 mention of a "carbonara" challenges the 1944 US-army-rations origin story ([Il Post, 2026](https://www.ilpost.it/2026/02/16/carbonara-attestazione-americani/)). Food historian Alberto Grandi's 2023 Financial Times claims that carbonara is basically American and Wisconsin parmesan is closest to the original were called a "surreal attack" by Coldiretti ([Sky TG24](https://tg24.sky.it/mondo/2023/03/27/financial-times-carbonara-parmigiano-coldiretti)).
- **Even top Italian pizzaioli "betray" the cause.** Franco Pepe served a pineapple pizza, *AnaNascosta*, in 2019 ([Gambero Rosso](https://www.gamberorosso.it/notizie/pizza-ananas-seu-pepe-lombardi/)). Gino Sorbillo followed with pineapple (Dec 2023) and a homemade "ketchup" pizza.
- **The no-cheese-on-fish rule has exceptions** that the Parmigiano consortium itself points out (#36). And **Pecorino Romano is ~95–97% made in Sardinia**, not Lazio ([Dissapore](https://www.dissapore.com/notizie/la-guerra-del-pecorino-romano/)).
- **Italians argue among themselves:** Gambero Rosso defended "cappuccino all day long", and an Italian cook in France was reportedly fired for pasta that was too al dente.
- **Ministers weigh in.** The tourism minister attacked canned carbonara (2024), and the agriculture minister got a Belgian carbonara sauce pulled from the European Parliament shop (2025).
- **UNESCO:** "Italian cooking: between sustainability and biocultural diversity" was inscribed as intangible heritage on 10 Dec 2025. It was the first national cuisine recognised as a whole ([Al Jazeera](https://www.aljazeera.com/news/2025/12/11/a-gesture-of-love-italys-cuisine-joins-unescos-cultural-heritage-list)).
- **Fettuccine Alfredo is a real Roman dish**, just not the cream-and-chicken version. **Pasta chips have an Italian ancestor** in fried pasta.
- **Who polices the crimes online** (inspiration for barks and the Influencer boss's comment storm; use archetypes, not likenesses): Vincenzo's Plate ([Euronews reaction video](https://www.euronews.com/culture/2022/02/18/angry-chef-reacts-to-the-11-worst-crimes-committed-against-italian-food)), Italia Squisita, Pasta Grammar, Casa Surace (parody of a big US recipe channel, [Dissapore](https://www.dissapore.com/cucina/come-si-preparano-gli-spaghetti-casa-surace-vs-tasty/)), Khaby Lame, The Pasta Queen, Bruno Barbieri's TikTok reactions, and the @ItalianComments "italians mad at food" account, run by an American ([HuffPost](https://huffingtonpost.co.uk/entry/italians-mad-at-food-twitter_n_5af08391e4b041fd2d2942d8)).
- **Gaps and caveats:**
  - Instant-ramen carbonara and "spaghetti hot dogs" went viral, but I found no documented *Italian* reaction to either.
  - No verifiable on-record quotes from Massimo Bottura, Antonino Cannavacciuolo or Gennaro Contaldo on these specific crimes turned up; Cannavacciuolo appears only in MasterChef carbonara gags.
  - Coldiretti's euro figures are a lobby's estimates.
- **Naming flag for the team:** "Vespa" (passive name in `DESIGN.md`) is a registered trademark. Consider *Motorino* or *Scooter* to honour the no-brands rule. Likewise, write "Chianti bottles" as "straw-wrapped bottles" (*fiaschi*), since Chianti is a protected wine name.

---

## 7. Sources

**Surveys, institutions and official texts**
- YouGov (2022), "You're doing Italian food all wrong, say Italians": https://yougov.co.uk/international/articles/40810-italian-food-crimes
- Accademia Italiana della Cucina, 2023 ragù update (LaPresse): https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/
- Bologna's official tagliatella, 1972 (Bologna Cultura PDF): https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf
- EU Reg. 2020/395, "Amatriciana Tradizionale" STG: https://www.arsial.it/app/uploads/Reg_2020_395_STG-AmatricianaTradizionale.pdf
- EU Court of Justice, Parmesan judgment (2008): https://curia.europa.eu/en/actu/communiques/cp08/aff/cp080011en.pdf
- Prosecco DOC consortium, "This is not Prosecco" (2024): https://www.prosecco.wine/wp-content/uploads/2024/01/CS_26.01.2024_THIS-IS-NOT-PROSECCO_ENG.pdf
- Coldiretti estimates via Dissapore and La Voce di New York (links in #38)
- UNESCO inscription of Italian cooking (Al Jazeera): https://www.aljazeera.com/news/2025/12/11/a-gesture-of-love-italys-cuisine-joins-unescos-cultural-heritage-list

**Controversies (news)**
- NYT "smoky tomato carbonara" and Coldiretti (The Guardian): https://www.pressreader.com/usa/the-guardian-usa/20210226/281925955738464
- French one-pot carbonara, 2016: https://tastingtable.com/691768/carbonara-wars-barilla-demotivateur-france-italy-media
- Canned carbonara, 2024: https://www.thelocal.it/20240830/they-should-be-ashamed-outrage-in-italy-as-heinz-launches-canned-pasta-carbonara
- Belgian carbonara sauce in the EU Parliament, 2025: https://brusselstimes.com/eu-affairs/1846923/italian-minister-fumes-at-delhaizes-ready-made-carbonara-sauce/
- Cracco and garlic in amatriciana, 2015: https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/
- Cacio e pepe and butter, 2025 (ANSA): https://www.ansa.it/english/news/lifestyle/food_wine/2025/08/06/bbc-fixes-cacio-e-pepe-recipe-after-italian-outcry_b0b531d1-2aaa-42dd-89e9-6ad73f62657a.html
- Bologna mayor on spaghetti bolognese, 2019 (CBC): https://www.cbc.ca/lite/story/1.5041024
- Sorbillo's pineapple pizza, 2023 (ANSA): https://www.ansa.it/english/news/2023/12/30/famed-naples-pizza-maker-adds-pineapple-spurring-row_af8865f7-4406-48dc-9cdf-70c5d0e59ba3.html
- Trevi Fountain "pasta activists", 2023: https://archivio.blitzquotidiano.it/cronaca-italia/spaghetti-e-cappuccino-basta-a-fontana-di-trevi-attivisti-della-pasta-3543489
- "Please no cappuccino after 12 pm", 2023 (Gambero Rosso): https://www.gamberorosso.it/notizie/attualita/please-no-cappuccino-after-12-pm-lappello-diventa-virale-eccezioni-gambero-rosso/
- TikTok prankster: ketchup pizza, scissors, ice in wine (Il Fatto Quotidiano, 2023): https://www.ilfattoquotidiano.it/2023/08/02/ketchup-sulla-pizza-spaghetti-tagliati-con-le-forbici-e-ghiaccio-nel-vino-rosso-il-tiktoker-americano-uccide-la-cucina-italiana/7249975/
- Lab-grown chicken carbonara, 2023 (AGI): https://www.agi.it/cronaca/news/2023-07-18/carbonara-di-pollo-sintetico-made-in-italy-ricette-22282277/
- Celebrity chef's "yellow soup" carbonara, 2020: https://www.wantedinrome.com/news/italians-revolted-by-gordon-ramsays-nightmare-carbonara.html
- Parmesan cellulose tests, 2016 (Boston Globe): https://www.bostonglobe.com/business/2016/02/17/are-you-eating-wood-instead-cheese/2z2ut4lWurS525ypJ46vbN/story.html
- Cheese on fish in London, 2019, and the consortium's reply: https://www.dissapore.com/notizie/formaggio-sul-pesce-il-consorzio-del-parmigiano-reggiano-risponde-allo-chef-di-londra/
- Pasta-crime explainer (Gambero Rosso, "Delitti in cucina"): https://www.gamberorosso.it/notizie/delitti-in-cucina-i-misfatti-nei-confronti-del-cibo-italiano-la-pasta/

**Chefs and creators**
- Gino D'Acampo on pineapple (LADbible): https://www.ladbible.com/entertainment/film-and-tv-food-gino-dacampo-has-a-go-at-kids-for-liking-pineapple-on-pizza-20180213
- Gino D'Acampo, "If my grandmother had wheels" (The Takeout): https://thetakeout.com/1836872143
- Lidia Bastianich on breaking pasta (Mashed): https://mashed.com/707672/lidia-bastianich-says-doing-this-to-pasta-is-a-criminal-offense
- The Pasta Queen on carbonara (Tasting Table): https://tastingtable.com/1205594/the-biggest-mistake-people-make-with-carbonara-according-to-nadia-munno-exclusive
- Bruno Barbieri's TikTok reaction (Greenme): https://www.greenme.it/lifestyle/costume-e-societa/lo-chef-barbieri-inorridisce-di-fronte-alla-ricetta-degli-spaghetti-cotti-al-forno-di-tik-tok/
- Khaby Lame's pizza video (Scatti di Gusto): https://www.scattidigusto.it/2021/06/06/khaby-lame-re-di-tiktok-spopola-americani-giu-le-mani-dalla-pizza/
- "Italians mad at food" account (HuffPost): https://huffingtonpost.co.uk/entry/italians-mad-at-food-twitter_n_5af08391e4b041fd2d2942d8

*Every crime entry in §1 carries its own direct source links.*
