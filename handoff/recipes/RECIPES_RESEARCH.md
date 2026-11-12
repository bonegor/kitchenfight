# KITCHEN FIGHT — Recipe Research Dossier

*Editor's merge of the Roman, Northern, Southern and pizza research passes, two checker lenses each, plus the Italian influencer-chef sweep and the popular-posts sweep. Compiled 11 November 2026. Companion data file: `recipes_dataset.json` (same folder).*

## How this dossier was made

Each dish group went through three passes: a **researcher** pass, a **sources lens** (checks URLs, titles, dates, quotes and removes unsupported claims) and an **Italian-culinary lens** (checks the recipe and whether each "intruder" is really rejected in Italy). Two extra sweeps added evidence: **Italian influencer chefs** (8 dishes) and **popular posts** (11 dishes, with a top-20 ranking).

Merge rules applied by the editor:

- **One entry per dish.** The canonical recipe is the culinary lens's version, minus details the sources lens showed to be unsupported.
- **Authority sources** are the ones the sources lens kept. Other recipe pages found by the sweeps are listed as *more references*.
- **Intruders** are kept when the culinary lens kept them. Popularity is the **lower** of the two lens scores. Contested flags and notes are carried over. Influencer-chef and popular-posts evidence for the same dish and ingredient is merged in (chef name, link, quote).
- A small number of **sweep-only intruders** (never reviewed by a lens) are added at popularity 1-2 and flagged `sweep only`.
- **Quotes** are marked `verified_verbatim: true` only where a checker (or the editor's own search) matched the exact wording against a search snippet. Every other quote was moved into the paraphrase field.
- Real people are named only in notes, evidence and controversies. The in-game texts (`why`, `game_line`, `game_blurb`, `game_method`) use archetypes, following the project rule in `docs/RESEARCH.md` ("real people are cited as sources only and should never appear in-game").

Legend: popularity ●●●●● = national scandal … ●○○○○ = eye-roll. **C** = contested (Italians genuinely disagree, or the item has real historical roots). ✓ = quote verified verbatim against a search snippet.

## Verification limits (read before shipping)

No source page was opened by any agent. Page fetching was blocked in this environment (DNS/policy failures on every host tried, including gamberorosso.it, dissapore.com, eur-lex.europa.eu, pizzanapoletana.org and accademiaitalianadellacucina.it), and the shared web-search budget ran out mid-research. All evidence comes from search-result titles, URLs and snippets seen by the researchers, plus the checkers' desk review. Every URL in this file appeared in a real search result; none was invented by the editor. QUOTES: verified_verbatim=true means a checker (or, in three cases, the editor's own WebSearch on 11 Nov 2026) matched the exact wording against a search snippet, NOT against the live page. Northern quotes were matched by the culinary checker against the researchers' search transcripts; Southern quotes by the sources checker against the researcher's search excerpts; the only Roman quote kept by a checker is the Il Nordest headline. Editor-verified via WebSearch snippets: the Amatriciana STG 'non prevede l'impiego...' sentence, Vincenzo's Plate 'NO CREAM IN CARBONARA!', and The Pasta Queen's 'Chicken alfredo really rubs me the wrong way' (found on a Nordot syndication, so a new evidence entry was added). Editor searches did NOT confirm the Dissapore carbonara garlic/onion line, the Monosilio 'consuetudine del passato' cream line, the Cracco apology wording or the Il Post chicken-pizza line, so those stay as paraphrases. All other quotes were moved into 'translation' as 'Paraphrase (exact wording not verified)', keeping the reported original wording in brackets for later checking. No pizza quote is verified. POPULARITY is a 1-5 editorial estimate of how often and how loudly Italians complain, taken as the lower of the two checker lenses; it is not a measured count. Only the YouGov 2022 net scores (ketchup on pasta -82, pineapple on pizza -63, cream in carbonara -45, cheese on seafood pasta -39, Bolognese on spaghetti +81) are survey numbers, and they come from write-ups of the survey. Very recent items (2026: Franco Pepe/AGI 5 Nov, Brisbane chef firing 8 Nov, La Voce di New York 2 Nov, the Jubany ragù, the Carbonara Day 2026 survey percentages, the La Russa Senate Norma) could not be re-checked. Sweep-only intruders and the tiramisù dish were never reviewed by a checker lens and are flagged in review_status/coverage. Influencer chefs not reached for these dishes: Benedetta Rossi, Giorgio Locatelli, Gabriele Bonci, Enzo Coccia, Davide Civitiello. Real people's names appear only in contested_note, evidence, controversies and the chef list; 'why', 'game_line', 'game_blurb' and 'game_method' use archetypes, per the project rule in docs/RESEARCH.md. contested_note and viral_controversies texts still name people and companies and must be generalised before any in-game use. To finish verification, allow those hosts in the session's network settings (or raise the search budget) and re-open each cited page before printing a quote verbatim.

## At a glance

| Dish | Origin | Intruders | Top intruders (popularity) | Coverage |
|---|---|---|---|---|
| Spaghetti alla carbonara | Rome, Lazio | 15 | Cream (and crème fraîche) 5, Onion 4, Smoked bacon 4 | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Spaghetti / Bucatini all'amatriciana (Amatriciana Tradizionale STG) | Amatrice | 6 | Garlic 5, Onion 5 C, Pancetta (or bacon) 4 C | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Tonnarelli cacio e pepe | Rome and the Lazio countryside | 6 | Butter 5, Cream 4, Parmesan 4 C | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Pasta alla gricia | Lazio | 5 | Onion 3 C, Pancetta (or bacon) 3, Tomato 2 | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Fettuccine all'Alfredo (fettuccine al burro) | Rome | 5 | Cream 5, Chicken 5, Broccoli 2 | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Tagliatelle al ragù alla bolognese | Bologna, Emilia-Romagna | 10 | Spaghetti 5 C, Garlic 4, Cream 3 C | researcher + sources lens + culinary lens + popular-posts sweep |
| Lasagne verdi alla bolognese | Bologna, Emilia-Romagna | 5 | Ricotta 3 C, Mozzarella 2 C, Garlic (in the meat sauce) 2 | researcher + sources lens + culinary lens |
| Trofie o trenette al pesto genovese | Genoa, Liguria | 9 | Cream 4, Cashews 3, Seed oil (sunflower oil) 3 | researcher + sources lens + culinary lens + popular-posts sweep |
| Tortellini in brodo | Bologna, Emilia-Romagna | 6 | Cream 4 C, Chicken (instead of pork) 4 C, Stock cube or vegetable broth 2 | researcher + sources lens + culinary lens |
| Spaghetti alle vongole | Naples, Campania | 4 | Parmesan or other grated cheese 5 C, Butter 4 C, Cream 3 | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Spaghetti aglio, olio e peperoncino | Naples, Campania | 5 | Parmesan or other grated cheese 3 C, Chicken 2, Black pepper 2 C | researcher + sources lens + culinary lens |
| Spaghetti alla puttanesca | Campania | 2 | Parmesan or other grated cheese 2 C, Canned pre-pitted black olives 1 | researcher + sources lens + culinary lens |
| Pasta alla Norma | Catania, Sicily | 5 | Mozzarella 3, Fresh ricotta 3, Parmesan 2 C | researcher + sources lens + culinary lens |
| Spaghetti al pomodoro | Southern Italy | 4 | Ketchup 5, Sugar 4 C, Meatballs (piled on the spaghetti) 2 C | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Pizza Margherita | Naples, Campania | 4 | Pineapple 5 C, Ketchup 3, Cheddar 1 | researcher + sources lens + culinary lens |
| Pizza Marinara | Naples, Campania | 3 | Mozzarella (any cheese) 2, Seafood (prawns, mussels, clams) 2, Grated cheese 1 | researcher + sources lens + culinary lens |
| Pizza Diavola | No documented birthplace; a standard on pizzeria menus all over Italy | 2 | Pepperoni (the American kind, and the word) 2 C, Bell peppers (the 'pepperoni' mix-up) 1 | researcher + sources lens + culinary lens |
| Pizza Capricciosa (e Quattro Stagioni) | Rome, Lazio | 2 | Frankfurter / hot-dog sausage 2 C, Pineapple 2 C | researcher + sources lens + culinary lens |
| Pizza napoletana: condimenti proibiti e condimenti tollerati | Naples | 9 | Pineapple 5 C, Ketchup 3, Chicken 3 | researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep |
| Tiramisù | Veneto | 1 | Whipped cream instead of mascarpone 2 | THIN: popular-posts sweep only (no checker review, one source). Do not ship as a level without more research. |

---

## Spaghetti alla carbonara — *Spaghetti carbonara*

**Origin:** Rome, Lazio (the first recipes were printed in the 1950s, and where the dish began is still argued over)  
**Pasta / base:** Spaghetti or spaghettoni. Rigatoni and mezze maniche are common and accepted in Roman trattorie.  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** Rome's most argued-over pasta: guanciale, egg yolk, Pecorino Romano and black pepper. Its silky sauce comes from technique, not cream.  
> **In-game method:** Render guanciale until crisp. Whisk yolks with grated Pecorino and plenty of black pepper. Toss hot spaghetti with the guanciale and its fat, then, off the heat, stir in the egg mix with a splash of pasta water until glossy, not scrambled.

### The proper recipe

- **Guanciale** (Guanciale (cured pork cheek)) — The standard meat. Pancetta is a historical alternative but a contested one (see intruders).
- **Tuorli d'uovo (o tuorli e uova intere)** (Egg yolks (or yolks plus some whole eggs)) — Some chefs, Luciano Monosilio among them, use yolks only; others use yolks plus some whole eggs. Both are accepted.
- **Pecorino Romano DOP** (Pecorino Romano cheese) — Many cooks blend in some Parmigiano Reggiano or Grana Padano. Purists object only when Pecorino is replaced entirely.
- **Pepe nero** (Black pepper) — Freshly ground, and plenty of it
- **Spaghetti** (Spaghetti) — Or another accepted shape (see pasta_shapes)
- **Acqua di cottura della pasta** (Starchy pasta cooking water) — Used to loosen the egg and cheese cream
- **Sale** (Salt) — For the pasta water only, because guanciale and Pecorino are already salty

**Method.** Cut the guanciale into strips or cubes and render it slowly until crisp. Beat the yolks with grated Pecorino Romano and black pepper. Toss the drained pasta with the guanciale and its fat, then take the pan off the heat and stir in the egg and cheese mixture with a little starchy pasta water until it forms a glossy cream that does not scramble. The creaminess comes only from egg, cheese, fat and starch.

**Authority sources** (kept by the sources lens):

- [La carbonara del 1954: the first printed Italian recipe, from La Cucina Italiana (Gambero Rosso)](https://www.gamberorosso.it/notizie/la-carbonara-del-1954-la-prima-ricetta-del-piatto-icona-di-roma-che-viene-da-milano-ed-e-fatta-con-laglio) (2024) — Reports that the August 1954 La Cucina Italiana recipe used spaghetti, pancetta, gruviera (Gruyère), garlic, eggs, salt and pepper. The headline says the recipe came from Milan, where the magazine was based, and was made with garlic.
- [Carbonara, la ricetta perfetta di Luciano Monosilio (Scatti di Gusto)](https://www.scattidigusto.it/carbonara-ricetta-perfetta-luciano-monosilio) — A recipe by Luciano Monosilio, the Roman chef known as the 'king of carbonara': spaghetti, egg yolks, guanciale, cheese and pepper.
- [Carbonara Day, la ricetta perfetta (AGI)](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/) (2023) — Reports that Monosilio's carbonara uses egg, Pecorino Romano, Grana Padano and guanciale, and only long pasta.
- [Italy marks Carbonara Day (ANSA English)](https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html) (2017) — Paraphrase (exact wording not re-checked): cooks should never replace pecorino with parmigiano, and adding cream is an even worse sin because, purists say, it makes the sauce too oily and too bland.
- [Pasta alla carbonara: 5 errori da non fare (Dissapore)](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/) — Paraphrase (exact wording not re-checked): carbonara is already a strong dish and needs neither the sharpness of garlic nor the sweetness of onion. The article also says cream makes it greasier and flattens its flavor.
- [Carbonara, la vera ricetta originale (Sky TG24)](https://tg24.sky.it/salute-e-benessere/approfondimenti/carbonara-ricetta-originale) — Lists the ingredients it attributes to the Accademia Italiana della Cucina: guanciale, pecorino, eggs, salt, black pepper, and garlic for the soffritto. No registered Accademia recipe could be verified directly.
- [History of Carbonara (Vincenzo's Plate)](https://www.vincenzosplate.com/history-of-carbonara/) — Vincenzo Prosperi, an Italian YouTube cook, says authentic carbonara has no cream; the creaminess comes from emulsifying raw egg, Pecorino and pasta water.

<details><summary>More references found by the sweeps (not checked by a lens)</summary>

- [Carbonara, errori da evitare (Gustoblog, 2025)](https://www.gustoblog.it/2025/07/27/carbonara-rovinarla-e-un-attimo-sono-questi-gli-errori-comunissimi-da-evitare-assolutamente)
- [Luciano Monosilio interview with his carbonara recipe (Il Fatto Quotidiano, 2016)](https://www.ilfattoquotidiano.it/2016/03/31/luciano-monosilio-la-cucina-e-lavoro-la-parte-spettacolare-ce-ma-non-e-tutto/2597245/) — chef: Luciano Monosilio
- [Pasta alla Carbonara di Luciano Monosilio (Italia Squisita video recipe)](https://italiasquisita.net/it/video-ricette/pasta-alla-carbonara-di-luciano-monosilio) — chef: Luciano Monosilio; Italia Squisita
- [Carbonara, la ricetta perfetta di Luciano Monosilio (Scatti di Gusto)](https://www.scattidigusto.it/2018/04/05/carbonara-ricetta-perfetta-luciano-monosilio/) — chef: Luciano Monosilio
- [King of carbonara Luciano Monosilio reveals secrets behind his dish (SCMP)](https://www.scmp.com/magazines/post-magazine/article/1862632/king-carbonara-luciano-monosilio-reveals-secrets-behind-his) — chef: Luciano Monosilio
- [Focus segreti MyCarbonara (Unione Italiana Food pasta makers' Carbonara Day material with chef Luciano Monosilio's '5 errori da non fare')](https://welovepasta.it/wp-content/uploads/2021/03/Focus-segreti-MyCarbonara.doc) — chef: Luciano Monosilio
- [Carbonara (Gambero Rosso recipe)](https://www.gamberorosso.it/ricette/primi/carbonara/)
- [Spaghetti alla Carbonara recipe (Vincenzo's Plate, Italian YouTube cook who campaigns for 'no cream in carbonara')](https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/) — chef: Vincenzo's Plate (Vincenzo Prosperi)
- [Ask an Italian: What are the unbreakable rules for making real pasta carbonara?](https://www.thelocal.com/20210408/the-ten-unbreakable-rules-for-making-real-italian-pasta-alla-carbonara)
- [Pasta carbonara (Alessandro and Pierluigi Roscioli, Rome)](https://reportergourmet.com/en/recipes/831-pasta-carbonara-alessandro-and-pierluigi-roscioli)
- [Videoricette: la carbonara di Max Mariola (Gambero Rosso)](https://www.gamberorosso.it/notizie/videoricette-la-carbonara-di-max-mariola/) — chef: Max Mariola

</details>

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Panna** (Cream (and crème fraîche)) | ●●●●● 5 | no | In carbonara the creaminess comes from egg yolks, Pecorino, guanciale fat and starchy pasta water. Italian chefs say added cream makes the dish greasier and flattens its flavor. It is the most common complaint about carbonara made outside Italy. | [scattidigusto.it](https://www.scattidigusto.it/2021/02/04/carbonara-la-cremosa-ricetta-romana-per-dimenticare-martha-stewart/) 2021; [ansa.it](https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html) 2017; [dissapore.com](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/); [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2024/11/19/viva-la-carbonara-oppure-no-le-ricette-un-tanto-al-click-fanno-inorridire-i-puristi-e-non-solo-ma-forse-un-trucco-per-salvare-la-ricetta-ce/7773500/) 2024; [unionesarda.it](https://www.unionesarda.it/en/today-is-carbonara-day-curiosity-about-one-of-the-most-loved-recipes-by-italians-and-beyond-eby6kl8z); [vincenzosplate.com](https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/comment-page-5/) 2025 (chef: Vincenzo's Plate (Vincenzo Prosperi)) ✓"NO CREAM IN CARBONARA!"; +13 more in JSON |
| **Cipolla** (Onion) | ●●●●○ 4 | no | Roman carbonara is guanciale, egg, Pecorino and pepper, and onion is not part of it. In 2016 a French one-pot video that boiled onion with the pasta caused an outcry in Italy. | [dissapore.com](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/); [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/video-carbonara-sbagliata-francese-cipolla/) 2016; [thelocal.it](https://www.thelocal.it/20160407/italians-pour-scorn-french-attempt-to-reinvent-carbonara) 2016; [thelocal.com](https://www.thelocal.com/20210408/the-ten-unbreakable-rules-for-making-real-italian-pasta-alla-carbonara) 2021; [gamberorossointernational.com](https://www.gamberorossointernational.com/recipes/recipe/spaghetti-carbonara-onions-and-parmesan-cheese/); [tastingtable.com](https://tastingtable.com/691768/carbonara-wars-barilla-demotivateur-france-italy-media) 2016; +2 more in JSON |
| **Bacon (affumicato)** (Smoked bacon) | ●●●●○ 4 | no | Carbonara uses guanciale, cured pork cheek, which is not smoked. Bacon in place of guanciale is the swap Italians spot most often in foreign carbonara, and Coldiretti, the Italian farmers' association, names it among the typical 'fake carbonara' errors abroad. | [agi.it](https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/) 2024; [uk.finance.yahoo.com](https://uk.finance.yahoo.com/news/stop-madness-nyt-angers-italians-121938305.html) 2021; [lavocedinewyork.com](https://lavocedinewyork.com/food/cucina-italiana/2021/02/28/la-carbonara-del-new-york-times-con-pomodoro-e-bacon-la-critica-dei-ristoratori) 2021; [en.ilsole24ore.com](https://en.ilsole24ore.com/art/carbonara-pomodoro-e-bacon-ricetta-new-york-times-fa-infuriare-coldiretti-ADdj51LB) 2021 |
| **Aglio** (Garlic) | ●●●○○ 3 | yes | Purists say garlic's sharpness has no place in carbonara, and Roman rules lists ban it outright. Its flavor competes with the guanciale and pepper. | [gamberorosso.it](https://www.gamberorosso.it/notizie/la-carbonara-del-1954-la-prima-ricetta-del-piatto-icona-di-roma-che-viene-da-milano-ed-e-fatta-con-laglio) 2024; [en.ilsole24ore.com](https://en.ilsole24ore.com/art/carbonara-day-ricetta-compie-70-anni-e-aglio-e-gruviera-fa-inorridire-puristi-AFSGQIKD) 2024; [dissapore.com](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/); [tg24.sky.it](https://tg24.sky.it/salute-e-benessere/approfondimenti/carbonara-ricetta-originale); [gustoblog.it](https://www.gustoblog.it/2025/07/27/carbonara-rovinarla-e-un-attimo-sono-questi-gli-errori-comunissimi-da-evitare-assolutamente) 2025; [en.ilsole24ore.com](https://en.ilsole24ore.com/art/and-controversy-the-can-carbonara-proposed-by-heinz-vissani-destroys-italian-culture-AFtCnSbD) 2024 (chef: Gianfranco Vissani); +3 more in JSON |
| **Pomodoro** (Tomato) | ●●●○○ 3 | no | Carbonara is a white sauce of egg and cheese and has no tomato. A major US newspaper's 'smoky tomato carbonara' in 2021 drew condemnation from Coldiretti and Italian restaurateurs. | [pressreader.com](https://www.pressreader.com/usa/the-guardian-usa/20210226/281925955738464) 2021; [en.ilsole24ore.com](https://en.ilsole24ore.com/art/carbonara-pomodoro-e-bacon-ricetta-new-york-times-fa-infuriare-coldiretti-ADdj51LB) 2021; [dissapore.com](https://www.dissapore.com/notizie/carbonara-al-pomodoro-vi-sentite-offesi-come-coldiretti) 2021; [telex.hu](https://telex.hu/kult/2021/02/25/carbonara-balhe-paradicsom-recept) 2021; [uk.finance.yahoo.com](https://uk.finance.yahoo.com/news/stop-madness-nyt-angers-italians-121938305.html) 2021; [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2021/02/22/ecco-la-carbonara-affumicata-al-pomodoro-la-ricetta-del-new-york-times-e-raccapricciante/6109889/) 2021 |
| **Pancetta** (Pancetta) | ●●●○○ 3 | yes | Guanciale, from the pork cheek, is the standard because its fat melts into the sauce and its flavor is stronger. Pancetta, from the belly, is the usual shortcut. | [gamberorosso.it](https://www.gamberorosso.it/notizie/la-carbonara-del-1954-la-prima-ricetta-del-piatto-icona-di-roma-che-viene-da-milano-ed-e-fatta-con-laglio) 2024; [dissapore.com](https://www.dissapore.com/ricette/ricetta-spaghetti-alla-carbonara-con-pancetta/); [nbcpalmsprings.com](https://www.nbcpalmsprings.com/2025/11/20/outrage-in-italy-after-belgianmade-carbonara-sauce-appears-in-eu-parliament-store) 2025; [scattidigusto.it](https://www.scattidigusto.it/2019/01/17/video-carbonara-sbagliata-masterchef) 2019 (chef: The Jackal (comedy collective)); [scattidigusto.it](https://www.scattidigusto.it/2021/02/04/carbonara-la-cremosa-ricetta-romana-per-dimenticare-martha-stewart/) 2021; [brusselstimes.com](https://brusselstimes.com/eu-affairs/1846923/italian-minister-fumes-at-delhaizes-ready-made-carbonara-sauce/) 2025; +2 more in JSON |
| **Parmigiano (al posto del pecorino)** (Parmesan instead of Pecorino) | ●●●○○ 3 | yes | The cheese of Roman carbonara is Pecorino Romano, which is sharp and salty. Using only Parmigiano is a listed purist sin. | [ansa.it](https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html) 2017; [agi.it](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/) 2023 (chef: Luciano Monosilio); [scattidigusto.it](https://www.scattidigusto.it/2019/01/17/video-carbonara-sbagliata-masterchef) 2019 (chef: The Jackal (comedy collective)); [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2016/03/31/luciano-monosilio-la-cucina-e-lavoro-la-parte-spettacolare-ce-ma-non-e-tutto/2597245/) 2016 (chef: Luciano Monosilio); [ciaobella.libsyn.com](https://ciaobella.libsyn.com/carbonara-luciano-monosilio-king-of-carbonara-of-romes-restaurant-scene) (chef: Luciano Monosilio); [en.ilsole24ore.com](https://en.ilsole24ore.com/art/carbonara-pomodoro-e-bacon-ricetta-new-york-times-fa-infuriare-coldiretti-ADdj51LB) 2021; +1 more in JSON |
| **Pollo** (Chicken) | ●●●○○ 3 | no | Carbonara has no meat other than guanciale. Chicken carbonara is a foreign variation: Italian coverage of American pasta lists chicken among the typical US additions, and a 2023 Trevi Fountain protest sign called chicken on pasta a crime in Italy. | [dissapore.com](https://www.dissapore.com/notizie/un-ristorante-a-singapore-serve-la-carbonara-con-pollo-coltivato-coldiretti-in-corto-circuito/); [ilpost.it](https://www.ilpost.it/2021/02/28/pasta-stati-uniti/) 2021; [thefoodellers.com](https://thefoodellers.com/tips/eating-in-italy-rules/); [italianismo.com.br](https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/) 2023; [agi.it](https://www.agi.it/cronaca/news/2023-07-18/carbonara-di-pollo-sintetico-made-in-italy-ricette-22282277/) 2023 |
| **Piselli** (Peas) | ●●○○○ 2 | no | Peas are not part of carbonara. Coldiretti lists frozen peas among the distortions found in restaurants abroad. | [ilnordest.it](https://www.ilnordest.it/economia/la-carbonara-con-panna-piselli-burro-e-basilico-tz2dlxce) 2024 ✓"La Carbonara? Con panna, piselli, burro e basilico"; [meteoweb.eu](https://www.meteoweb.eu/2024/04/carbonara-day-ricette-tarocche-in-6-ristoranti-stranieri-su-10/1001399577/) 2024; [wantedinrome.com](https://wantedinrome.com/news/italians-revolted-by-gordon-ramsays-nightmare-carbonara.html) 2020 |
| **Burro** (Butter) | ●●○○○ 2 | no | The fat in carbonara comes from the rendered guanciale. Coldiretti names butter among the additions found in fake carbonaras abroad. | [ilnordest.it](https://www.ilnordest.it/economia/la-carbonara-con-panna-piselli-burro-e-basilico-tz2dlxce) 2024; [agi.it](https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/) 2024; [reportergourmet.com](https://reportergourmet.com/en/news/8374-carbonara-according-to-bruno-barbieri-the-top-chef-s-recipe-with-only-egg-yolks-and-butter) (chef: Bruno Barbieri) |
| **Funghi** (Mushrooms)*(sweep only (not reviewed by the checker lenses))* | ●●○○○ 2 | no | Mushrooms are a frequent foreign addition with no place in the Roman dish. Italian social media mocked a celebrity chef's 2020 carbonara video with mushrooms, peas and crème fraîche. | [scattidigusto.it](https://www.scattidigusto.it/2020/02/21/la-carbonara-di-gordon-ramsay-e-rivolta-a-roma-e-dintorni/) 2020; [wantedinrome.com](https://wantedinrome.com/news/italians-revolted-by-gordon-ramsays-nightmare-carbonara.html) 2020 |
| **Prosciutto cotto** (Cooked ham)*(sweep only (not reviewed by the checker lenses))* | ●●○○○ 2 | no | Cooked ham in place of guanciale is a British-style shortcut. Italian food media list ham carbonara among the common recipe 'horrors', and an Italian TV chef rejected it on live British TV. | [vercel.food52.com](https://vercel.food52.com/story/20529-we-can-t-stop-laughing-at-this-old-british-tv-clip) 2010 (chef: Gino D'Acampo); [itv.com](https://itv.com/thismorning/food/classic-italian-carbonara-gino-dacampo-recipe) (chef: Gino D'Acampo); [scattidigusto.it](https://www.scattidigusto.it/ricette-italiane-orrori-ingredienti) 2016 |
| **Latte** (Milk) | ●○○○○ 1 | no | Milk does the same job as cream and is rejected for the same reason: the creaminess must come from egg and cheese. An Italian TV chef objected on live British TV when a guest said she adds milk to carbonara. | [hertfordshiremercury.co.uk](https://www.hertfordshiremercury.co.uk/news/uk-world-news/love-islands-davide-scolded-morning-7549287) (chef: Gino D'Acampo); [itv.com](https://itv.com/thismorning/food/classic-italian-carbonara-gino-dacampo-recipe) (chef: Gino D'Acampo) |
| **Vino bianco** (White wine)*(sweep only (not reviewed by the checker lenses))* | ●○○○○ 1 | no | Carbonara has no wine. A 2017 celebrity-chef carbonara with white wine and double cream drew a wave of angry Italian comments. | [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cucina/carbonara-con-vino-e-panna-ricetta-di-nigella-lawson-fa-infuriare-il-web-2719805) 2017; [pressreader.com](https://www.pressreader.com/uk/the-daily-telegraph/20170706/281522226115548) 2017 |
| **Prezzemolo** (Parsley)*(sweep only (not reviewed by the checker lenses))* | ●○○○○ 1 | no | The only toppings on carbonara are Pecorino and black pepper. A Roman chef's mistakes list for the Italian pasta makers' Carbonara Day guide names a parsley garnish as an error. | [welovepasta.it](https://welovepasta.it/wp-content/uploads/2021/03/Focus-segreti-MyCarbonara.doc) 2021 (chef: Luciano Monosilio) |

**Game lines** (shown when the intruder appears in this dish):

- *Cream (and crème fraîche)*: "Carbonara gets its cream from egg yolk, Pecorino and pasta water — never from a carton."
- *Onion*: "Roman carbonara is guanciale, egg, Pecorino and pepper. Onion was the star of a 2016 French video scandal."
- *Smoked bacon*: "Guanciale is cured pork cheek, never smoked. Coldiretti names bacon a classic fake-carbonara swap."
- *Garlic*: "Purists ban garlic from carbonara, though the first recipe printed in Italy, in 1954, used a clove."
- *Tomato*: "Egg, Pecorino, guanciale: carbonara is a white sauce. Add tomato and you are halfway to amatriciana."
- *Pancetta*: "Guanciale, from the cheek, is the Roman standard. Pancetta is the old fallback purists still frown at."
- *Parmesan instead of Pecorino*: "Carbonara's cheese is Pecorino Romano. A little Parmigiano mixed in is fine; a full swap is not."
- *Chicken*: "The only meat in carbonara is guanciale. Chicken carbonara is a foreign invention."
- *Peas*: "Coldiretti lists frozen peas among the fake carbonaras served abroad. Peas belong in other pastas."
- *Butter*: "Carbonara's fat is rendered guanciale. Coldiretti lists butter among the add-ons of fake carbonara."
- *Mushrooms*: "Mushrooms helped spark a Roman revolt against a 2020 celebrity-chef carbonara video."
- *Cooked ham*: "Cooked ham is not guanciale. Italian food media list ham carbonara among recipe 'horrors'."
- *Milk*: "Milk is just thin cream. Carbonara's silkiness comes from egg and cheese alone."
- *White wine*: "Wine belongs in amatriciana, not carbonara. A 2017 wine-and-cream carbonara enraged Italians online."
- *Parsley*: "Carbonara is finished with Pecorino and pepper. Roman chefs list a parsley garnish as a mistake."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Cream (and crème fraîche)*: Nobody seriously defends it today, but cream appeared in Italian cookbook carbonaras in past decades: Unione Sarda reports that Gualtiero Marchesi's 1989 recipe used a quarter litre of cream for 400 g of spaghetti (editor search snippet). Dissapore reportedly cites older cookbooks (Carnacina, Guarnaschelli Gotti) with cream (influencer sweep). It is a habit Italy has abandoned, not a living regional variant.
- *Onion*: Not part of the traditional recipe. Gambero Rosso International lists a recipe called 'spaghetti carbonara, onions and parmesan cheese', reportedly a variant by Roman YouTube chef Max Mariola; Dissapore reports that Ada Boni's classic cookbook used onion and wine. Chef twists and old cookbook versions, not the Roman classic.
- *Garlic*: The first printed Italian recipe (La Cucina Italiana, August 1954) used a clove of garlic, and Dissapore cites Anna Gosetti della Salda's cookbook with garlic. Sky TG24 attributes to the Accademia Italiana della Cucina an ingredient list that includes garlic, but no registered Accademia carbonara recipe could be verified, so the game must not claim the Accademia either bans or prescribes garlic. When the 1954 recipe was recreated for its 70th anniversary in 2024, its garlic and Gruyère horrified purists.
- *Pancetta*: A legitimate historical variant. The first carbonara printed in Italy (1954) used pancetta, guanciale became the standard later, and many Italian recipe sites still offer pancetta as an alternative. In 2025 a Belgian supermarket 'carbonara' sauce sold in the European Parliament shop was criticised partly because it contained pancetta and cream. Pancetta in place of guanciale is the first wrong ingredient in The Jackal's 2019 MasterChef carbonara parody (Scatti di Gusto).
- *Parmesan instead of Pecorino*: A blend is widely accepted. AGI reports that Luciano Monosilio, called the 'king of carbonara', uses Pecorino Romano together with Grana Padano. Only full replacement draws complaints.
- *Peas*: Peas are fine in other Italian pastas (for example pasta panna, prosciutto e piselli); the complaint is only about carbonara.
- *Butter*: Some top chefs accept it: Bruno Barbieri's published carbonara browns the guanciale in butter (Reporter Gourmet, influencer sweep). Purists say the guanciale fat is enough.
- *Mushrooms*: Sweep-only evidence (popular-posts sweep), not reviewed by the two checker lenses. The 2020 video was Gordon Ramsay's.
- *Cooked ham*: Sweep-only evidence (influencer and popular-posts sweeps), not reviewed by the two checker lenses. The TV chef was Gino D'Acampo on This Morning (2010); the Roman lenses link the same clip to milk, so accounts differ.
- *Milk*: The chef was Gino D'Acampo on ITV's This Morning (single regional UK source, year not given). The influencer sweep links the same clip's famous line ('if my grandmother had wheels...') to cooked ham instead, so accounts of which ingredient prompted it differ.
- *White wine*: Sweep-only evidence (popular-posts sweep), not reviewed by the checker lenses. The 2017 recipe was Nigella Lawson's. White wine is accepted in amatriciana, so the game should say this is a carbonara-only rule.
- *Parsley*: Sweep-only evidence (popular-posts sweep, one unopened .doc file), not reviewed by the checker lenses; the culinary lens had earlier left parsley out for lack of evidence. The chef is Luciano Monosilio (Unione Italiana Food guide).

**Fun facts and accepted details**

- The first carbonara recipe printed in Italy (La Cucina Italiana, August 1954) used pancetta, Gruyère and garlic. A 1952 Chicago restaurant guide is often cited as an even earlier printed version.
- Guanciale and Pecorino became the standard only after the first printed recipes.
- Cream appeared in Italian carbonara recipes for decades. Unione Sarda reports that Gualtiero Marchesi's 1989 recipe used a quarter litre of cream for 400 g of spaghetti (figure seen in an editor search snippet; page not opened).
- Carbonara Day is celebrated on 6 April.
- In 2024 Heinz launched canned carbonara in the UK. Chef Gianfranco Vissani called it shameful.
- Monosilio is known for finishing his egg mixture gently over a bain-marie (a technique point, not an ingredient one).
- ACCEPTED in Italy, so do not mock: egg yolks only or yolks plus whole eggs; mixing Pecorino with some Parmigiano or Grana Padano; rigatoni or mezze maniche instead of spaghetti.
- Where the name comes from is unproven: popular theories point to Apennine charcoal makers (carbonari) or to American soldiers in Rome in 1944 with their bacon-and-egg rations (general knowledge, no URL).
- Carbonara Day (6 April) was created by Italian pasta makers (Unione Italiana Food with the International Pasta Organisation) after the 2016 French video row (popular-posts sweep).
- A 2026 AstraRicerche survey for Unione Italiana Food reportedly found cream to be the most-cited carbonara mistake (about 35%), ahead of adding the egg on the heat (about 34%) and garlic or onion (31%). These figures come from one search snippet (popular-posts sweep) and were not re-confirmed.
- Technique gripes such as scrambling the egg on the heat are not ingredients, so they are out of scope as intruders.

---

## Spaghetti / Bucatini all'amatriciana (Amatriciana Tradizionale STG) — *Pasta all'amatriciana*

**Origin:** Amatrice (province of Rieti, Lazio); popularised in Rome  
**Pasta / base:** Spaghetti in Amatrice's own municipal (De.C.O.) recipe; bucatini is the Roman favourite; rigatoni and mezze maniche are common in Roman trattorie.  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** Amatrice's pride and an EU-protected speciality since 2020: guanciale, tomato, pecorino and chili. No garlic, no onion, no pancetta.  
> **In-game method:** Render guanciale strips, splash in dry white wine, then add tomatoes and chili and cook briefly. Many cooks lift the guanciale out and return it at the end so it stays crisp. Toss with spaghetti or bucatini and finish with grated pecorino.

### The proper recipe

- **Guanciale (tipo Amatriciano)** (Guanciale (cured pork cheek, Amatrice type)) — The defining meat. The STG names guanciale specifically and excludes pancetta; a search snippet of the specification gives guanciale at 10-30% of the finished sauce.
- **Pomodoro (San Marzano, pelati o fresco)** (Tomato (San Marzano, peeled tinned or fresh))
- **Pecorino (di Amatrice o Pecorino Romano DOP)** (Pecorino cheese (Amatrice pecorino or Pecorino Romano)) — The Amatrice De.C.O. specifies the local pecorino
- **Vino bianco secco** (Dry white wine) — Optional, to deglaze the guanciale. Allowed by both the 2015 Amatrice De.C.O. and the STG.
- **Olio extravergine d'oliva** (Extra virgin olive oil) — A spoonful appears in the Amatrice De.C.O. recipe. Some purists say even that is optional.
- **Peperoncino e/o pepe nero** (Chili and/or black pepper) — The STG explicitly allows either or both
- **Sale** (Salt)
- **Spaghetti o bucatini** (Spaghetti or bucatini)

**Method.** Render strips of guanciale in a pan until golden and optionally deglaze with dry white wine. Add the tomatoes and chili (or pepper) and cook them briefly into a sauce with the guanciale; many cooks take the guanciale out while the tomato cooks and return it at the end so it stays crisp. Toss with spaghetti or bucatini and finish with plenty of grated pecorino.

**Authority sources** (kept by the sources lens):

- [MIPAAF provvedimento 13 marzo 2020: Amatriciana Tradizionale STG, disciplinare (Italian publication of the specification)](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) (2020) — ✓ "La "Amatriciana Tradizionale" a differenza di altre salse analoghe non prevede l'impiego di ingredienti quali aglio cipolla o pancetta." (Unlike other similar sauces, 'Amatriciana Tradizionale' does not use ingredients such as garlic, onion or pancetta.)
- [Disciplinare Amatriciana Tradizionale STG (copy hosted by Regione Veneto)](https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345) (2020) — Paraphrase (exact wording not re-checked): chili (dried or fresh) and/or pepper may be used, as needed.
- [Commission Implementing Regulation (EU) 2020/395 registering 'Amatriciana Tradizionale' as a TSG (copy at ARSIAL)](https://www.arsial.it/app/uploads/Reg_2020_395_STG-AmatricianaTradizionale.pdf) (2020) — Published in the EU Official Journal L 77 of 13 March 2020. The page was found in search results but could not be fetched.
- [L'Amatriciana Tradizionale è STG: l'Europa tutela la salsa dei pastori di Amatrice (Gambero Rosso)](https://www.gamberorosso.it/notizie/lamatriciana-tradizionale-e-stg-leuropa-tutela-la-salsa-dei-pastori-di-amatrice) (2020)
- [Giornata internazionale dell'Amatriciana: storia e ricetta originale (Sky TG24)](https://tg24.sky.it/lifestyle/2026/03/06/giornata-amatriciana-storia-ricetta-originale) (2026) — Paraphrase (exact wording not re-checked): the Amatrice recipe calls for spaghetti, not bucatini.
- [Storia e ricetta originale dell'amatriciana: the Amatrice De.C.O., delibera n. 27/2015 (Gazzetta del Gusto)](https://gazzettadelgusto.it/ricette/salse-sughi/storia-e-ricetta-originale-dellamatriciana/?print=pdf) — Reports that the Comune di Amatrice formalised Amatriciana Rossa and Amatriciana Bianca in a 2015 De.C.O. specification.

<details><summary>More references found by the sweeps (not checked by a lens)</summary>

- [Blitz Quotidiano: Amatrice contro Carlo Cracco, niente aglio nell'amatriciana (town council statement with the authentic ingredient list)](https://archivio.blitzquotidiano.it/foto-notizie/amatrice-contro-carlo-cracco-niente-aglio-nellamatriciana-foto-2096529) — chef: Carlo Cracco
- [ARSIAL: Amatriciana STG, produttori e trasformatori a confronto](https://www.arsial.it/app/uploads/post/14.-Amatriciana_STG_produttori_e_trasformatori_a_confronto.pdf)
- [Dissapore: Pasta all'amatriciana, i 7 errori da non fare](https://www.dissapore.com/notizie/amatriciana-5-errori-da-evitare-accuratamente)
- [Carlo Cracco a parte: la verità, vi prego, sull'aglio nell'amatriciana](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-amatriciana-la-verita/) — chef: Carlo Cracco

</details>

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Aglio** (Garlic) | ●●●●● 5 | no | The official STG specification explicitly excludes garlic. When a celebrity chef said on Italian TV in 2015 that he adds a garlic clove, Amatrice's town council answered with a formal statement and the chef apologised. | [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-chiede-scusa-per-amatriciana-con-aglio-era-solo-una-battuta-2097854) 2015 (chef: Carlo Cracco); [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatrice-contro-carlo-cracco-niente-aglio-nellamatriciana-foto-2096529) 2015 (chef: Carlo Cracco); [thelocal.com](https://www.thelocal.com/20150210/top-italy-chef-apologizes-for-garlic-gaffe) 2015; [unionalimentari.com](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) 2020 ✓"La "Amatriciana Tradizionale" a differenza di altre salse analoghe non prevede l'impiego di ingredienti quali aglio cipolla o pancetta."; [dissapore.com](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/) 2015 (chef: Carlo Cracco); [theworld.org](https://theworld.org/stories/2015/02/11/garlic-or-no-garlic-culinary-squabble-over-how-make-delicious-amatriciana-pasta) 2015; +2 more in JSON |
| **Cipolla** (Onion) | ●●●●● 5 | yes | The STG specification and the Amatrice recipe exclude onion. Its sweetness softens the sharp balance of guanciale, tomato and pecorino. In 2020 an amatriciana with onion on a national TV cooking show set off a public row. | [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/); [scattidigusto.it](https://www.scattidigusto.it/2020/06/03/amatriciana-con-aceto-e-cipolla-alla-prova-del-cuoco-e-scandalo) 2020; [scattidigusto.it](https://www.scattidigusto.it/scoprire-che-la-migliore-ricetta-della-matriciana-e-senza-cipolla); [unionalimentari.com](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) 2020 ✓"La "Amatriciana Tradizionale" a differenza di altre salse analoghe non prevede l'impiego di ingredienti quali aglio cipolla o pancetta."; [blitzquotidiano.it](https://blitzquotidiano.it/societa/amatriciana-ce-sempre-qualcuno-stavolta-il-washington-post-che-aggiunge-aglio-e-cipolla-3662334); [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatrice-contro-carlo-cracco-niente-aglio-nellamatriciana-foto-2096529) 2015 (chef: Carlo Cracco) |
| **Pancetta** (Pancetta (or bacon)) | ●●●●○ 4 | yes | Amatriciana is made with guanciale, cured pork cheek, and the STG specification names pancetta among the excluded ingredients. Bacon, which is smoked, is even further from the recipe. | [unionalimentari.com](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) 2020 ✓"La "Amatriciana Tradizionale" a differenza di altre salse analoghe non prevede l'impiego di ingredienti quali aglio cipolla o pancetta."; [dissapore.com](https://www.dissapore.com/cucina/amatriciana-5-errori-da-evitare-accuratamente/); [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/); [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatrice-contro-carlo-cracco-niente-aglio-nellamatriciana-foto-2096529) 2015 (chef: Carlo Cracco) |
| **Aceto** (Vinegar) | ●●○○○ 2 | no | The only deglazing liquid in the traditional recipe is dry white wine. In 2020 an amatriciana deglazed with vinegar on a national TV cooking show caused a scandal online. | [scattidigusto.it](https://www.scattidigusto.it/amatriciana-con-aceto-e-cipolla-alla-prova-del-cuoco-e-scandalo) 2020; [scattidigusto.it](https://www.scattidigusto.it/2020/06/03/amatriciana-con-aceto-e-cipolla-alla-prova-del-cuoco-e-scandalo) 2020; [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatriciana-a-la-prova-del-cuoco-amatrice-ingredienti-sbagliati-2147843) |
| **Parmigiano** (Parmesan) | ●●○○○ 2 | yes | Amatriciana is finished with pecorino: Amatrice pecorino or Pecorino Romano, the cheeses the specification allows. Parmigiano is milder and comes from another region. | [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/); [elezioni2020.regione.veneto.it](https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345) 2020 |
| **Scalogno** (Shallot) | ●○○○○ 1 | no | Like garlic and onion, shallot is not provided for in the official specification. | [dissapore.com](https://www.dissapore.com/notizie/amatriciana-5-errori-da-evitare-accuratamente) |

**Game lines** (shown when the intruder appears in this dish):

- *Garlic*: "The EU's Amatriciana STG rules out garlic. Amatrice protested when a TV chef added a clove in 2015."
- *Onion*: "The 2020 EU STG excludes onion, though many old Roman recipes used it. The row still simmers."
- *Pancetta (or bacon)*: "Guanciale or nothing: the Amatriciana STG names pancetta among its excluded ingredients."
- *Vinegar*: "Amatriciana is deglazed with dry white wine. A 2020 TV amatriciana with vinegar caused a scandal."
- *Parmesan*: "Amatriciana is finished with pecorino, Amatrice's own or Romano. Parmigiano is milder and from up north."
- *Shallot*: "Garlic, onion or shallot: the official amatriciana specification provides for none of them."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Garlic*: Not a live debate. The 2015 chef was Carlo Cracco, who called his 'aglio in camicia' remark a joke and apologised; the press then found a garlic amatriciana in his own cookbook. Davide Oldani defended it as an elegant touch (popular-posts sweep, not verified). No authoritative source supports garlic.
- *Onion*: This is the biggest real debate in this dish. Gambero Rosso compared historical recipes (after a popular Roman chef's onion amatriciana video, per the influencer sweep: onion in 23 of 30) and found onion was a constant ingredient until the mid-1960s; older Roman versions and many trattorie still use it. The 2015 Amatrice De.C.O. and the 2020 STG exclude it.
- *Pancetta (or bacon)*: Gambero Rosso's historical survey found pancetta used instead of guanciale in some recipes up to the mid-1960s, and pancetta is a common Italian home fallback when guanciale is missing. The STG excludes it today.
- *Parmesan*: Gambero Rosso's survey found that some recipes before the mid-1960s used Parmigiano instead of pecorino.

**Fun facts and accepted details**

- Amatriciana is an EU 'Traditional Speciality Guaranteed' (STG/TSG) under Commission Implementing Regulation (EU) 2020/395, published 13 March 2020. The STG text treats it as a sauce, contrasting it with 'other similar sauces' that use garlic, onion or pancetta.
- In 2015 Amatrice adopted a municipal De.C.O. recipe covering both Amatriciana Rossa (with tomato) and Amatriciana Bianca (without tomato, close to gricia).
- Amatrice's own recipe uses spaghetti; Rome made bucatini famous.
- The STG allows black pepper, chili or both.
- Dissapore says the worst mistake is ordering a 'gricia rossa': gricia with tomato is simply amatriciana.
- ACCEPTED in Italy, so do not mock: a splash of dry white wine, a little extra virgin olive oil, chili or black pepper, and bucatini or spaghetti (rigatoni is tolerated).
- After the August 2016 earthquake that devastated Amatrice, restaurants across Italy and abroad served 'amatriciana solidale', donating part of each plate's price to the town (general knowledge).
- Amatriciana is carbonara's tomato cousin: guanciale and pecorino in both, tomato in amatriciana, egg in carbonara.

---

## Tonnarelli cacio e pepe — *Cacio e pepe (pasta with Pecorino and black pepper)*

**Origin:** Rome and the Lazio countryside (shepherds' cooking)  
**Pasta / base:** Tonnarelli (fresh square-cut egg spaghetti, the Roman classic) or dried spaghetti; short shapes such as mezze maniche are also seen in Rome.  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** Three ingredients and nowhere to hide: Pecorino Romano, black pepper and starchy pasta water whipped into a cream. A Roman shepherds' dish.  
> **In-game method:** Toast cracked pepper and loosen it with pasta water. Whisk grated Pecorino with lukewarm (not boiling) pasta water into a paste. Finish tonnarelli in the pepper water, then off the heat toss in the cheese cream, adding water until it coats.

### The proper recipe

- **Pecorino Romano DOP** (Pecorino Romano cheese) — Finely grated. The only cheese in the strict version.
- **Pepe nero** (Black pepper) — Freshly cracked and usually toasted in the pan
- **Tonnarelli o spaghetti** (Tonnarelli or spaghetti)
- **Acqua di cottura della pasta** (Starchy pasta cooking water) — The emulsifier that turns cheese into a cream
- **Sale** (Salt) — Lightly, because Pecorino is salty

**Method.** Toast cracked black pepper in a pan and loosen it with some starchy pasta water. Separately, mix finely grated Pecorino Romano with a little warm (not boiling) pasta water into a smooth cream, because too much heat makes it clump. Finish the pasta in the pepper water, then off the heat toss in the Pecorino cream, adding cooking water until it coats the pasta. These three ingredients plus the water are the whole dish.

**Authority sources** (kept by the sources lens):

- [Caso cacio e pepe BBC: ricette scorrette (Gambero Rosso)](https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/) (2025) — Paraphrase (exact wording not re-checked): the corrected recipe has only three ingredients, as tradition demands.
- [La ricetta vera della cacio e pepe (Gambero Rosso)](https://www.gamberorosso.it/attualita/ricetta-vera-cacio-pepe/) — Traditional Roman version: pasta, Pecorino, pepper, with no heavy cream sauce.
- [Cacio e pepe: 5 errori da non fare (Dissapore)](https://www.dissapore.com/ricette/cacio-e-pepe-5-errori-da-non-fare/) — Adding oil is among the most common mistakes, because the cheese already provides the fat.
- [Max cucina l'Italia: Cacio e pepe (Sky TG24, Max Mariola)](https://tg24.sky.it/lifestyle/ricette/cacio-e-pepe-ricetta) — Video recipe by the Roman chef and YouTuber Max Mariola: spaghetti, Pecorino Romano and black pepper.
- [Cacio e pepe: traditional or gourmet? Italia Squisita video with Claudio Gargioli (Armando al Pantheon) and Cristina Bowerman (Life in Italy)](https://lifeinitaly.com/?p=55289)

<details><summary>More references found by the sweeps (not checked by a lens)</summary>

- [Gambero Rosso: Videoricette, spaghetti cacio e pepe di Max Mariola](https://www.gamberorosso.it/notizie/videoricette-spaghetti-cacio-e-pepe-di-max-mariola/) — chef: Max Mariola
- [Explained: How a pasta recipe has triggered a diplomatic row between the UK and Italy](https://www.euronews.com/culture/2025/08/11/explained-how-a-pasta-recipe-has-triggered-a-diplomatic-row-between-uk-and-italy)

</details>

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Burro** (Butter) | ●●●●● 5 | no | Cacio e pepe is only Pecorino, pepper and pasta water, and the creaminess comes from the cheese emulsion. In 2025 Rome's restaurateurs protested a British food website's recipe with butter and Parmesan until it was rewritten. | [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/) 2025; [open.online](https://www.open.online/2025/08/06/pasta-cacio-pepe-ricetta-burro-parmigiano-bbc/) 2025; [euronews.com](https://www.euronews.com/culture/2025/08/11/explained-how-a-pasta-recipe-has-triggered-a-diplomatic-row-between-uk-and-italy) 2025; [blog.giallozafferano.it](https://blog.giallozafferano.it/allacciateilgrembiule/pasta-cacio-e-pepe/); [scattidigusto.it](https://www.scattidigusto.it/2015/01/15/cacio-e-pepe-ricetta-ramen/) 2015; [liberoquotidiano.it](https://www.liberoquotidiano.it/news/scienze-tech/alimentazione-e-benessere/43662291/cacio-pepe-rissa-roma-londra/) 2025; +3 more in JSON |
| **Panna** (Cream) | ●●●●○ 4 | no | Cream is a shortcut that hides a failed emulsion. In 2025 even the corrected British recipe was criticised for suggesting double cream to rescue a split sauce. | [freepressjournal.in](https://www.freepressjournal.in/lifestyle/whats-the-big-pasta-controversy-why-are-italians-so-upset-with-cream-in-cacio-e-pepe) 2025; [euronews.com](https://www.euronews.com/culture/2025/08/11/explained-how-a-pasta-recipe-has-triggered-a-diplomatic-row-between-uk-and-italy) 2025; [gamberorosso.it](https://www.gamberorosso.it/attualita/ricetta-vera-cacio-pepe/); [aman-alliance.org](https://www.aman-alliance.org/Home/ContentDetail/93364) 2025; [startupitalia.eu](https://startupitalia.eu/lifestyle/cacio-e-pepe-ricetta-sbagliata-bbc/) 2025 |
| **Parmigiano** (Parmesan) | ●●●●○ 4 | yes | 'Cacio' here means Pecorino Romano. Parmigiano in place of Pecorino was half of the 2025 British recipe scandal. | [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/) 2025; [wantedinrome.com](https://wantedinrome.com/news/italy-controversy-butter-uk-recipe-cacio-e-pepe.html) 2025; [centrometeoitaliano.it](https://www.centrometeoitaliano.it/attualita/alessandro-borghese-la-ricetta-e-i-segreti-per-cucinare-al-meglio-la-sua-famosa-cacio-e-pepe-172107/) (chef: Alessandro Borghese); [dissapore.com](https://www.dissapore.com/notizie/il-parmigiano-nella-cacio-e-pepe-della-bbc-e-sempre-meglio-dello-stabilizzante-in-gel-che-si-usa-in-molti-ristoranti/) 2025; [open.online](https://www.open.online/2025/08/10/bbc-retromarcia-bufera-ricetta-cacio-pepe/) 2025; [dissapore.com](https://www.dissapore.com/ricette/cacio-e-pepe-5-errori-da-non-fare/); +2 more in JSON |
| **Olio d'oliva** (Olive oil) | ●●●○○ 3 | yes | The fat in cacio e pepe comes from the cheese, so oil is unnecessary and can split the sauce. Dissapore ran a headline calling oil in cacio e pepe an 'atrocity'. | [dissapore.com](https://www.dissapore.com/cucina/atrocita-onta-ripulsa-lolio-nella-cacio-e-pepe-non-va/); [dissapore.com](https://www.dissapore.com/cucina/battaglie-culturali-via-lolio-dalla-cacio-e-pepe/); [scattidigusto.it](https://www.scattidigusto.it/la-ricetta-migliore-come-fare-la-cacio-e-pepe-mantecata-e-senza-olio); [dissapore.com](https://www.dissapore.com/ricette/cacio-e-pepe-5-errori-da-non-fare/) |
| **Amido di mais** (Cornstarch) | ●●○○○ 2 | yes | The traditional thickener is the starch already in the pasta water. Added cornstarch is seen as a laboratory shortcut. | [dissapore.com](https://www.dissapore.com/notizie/la-formula-della-cacio-e-pepe-senza-grumi-vince-il-premio-ignobel-2025/) 2025; [linkiesta.it](https://www.linkiesta.it/2025/02/cacio-e-pepe-perfetta-esiste-scienza-ricercatori-max-planck-institute/) 2025; [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/finto-nobel-cacio-pepe-scientifica/) 2025 |
| **Citrato di sodio** (Sodium citrate)*(kept by culinary lens only (sources lens removed it))* | ●○○○○ 1 | yes | An emulsifying salt that some restaurants use to make a foolproof cheese sauce. Critics see it as a cheat in a three-ingredient dish. | [dissapore.com](https://www.dissapore.com/notizie/il-parmigiano-nella-cacio-e-pepe-della-bbc-e-sempre-meglio-dello-stabilizzante-in-gel-che-si-usa-in-molti-ristoranti/) 2025 |

**Game lines** (shown when the intruder appears in this dish):

- *Butter*: "Cacio e pepe is Pecorino, pepper and pasta water. A 2025 butter recipe drew a protest to an embassy."
- *Cream*: "Cacio e pepe's cream is Pecorino whipped with starchy water. Dairy cream only hides a broken sauce."
- *Parmesan*: "'Cacio' here means Pecorino Romano. Swapping in Parmigiano was half of the 2025 recipe row."
- *Olive oil*: "The fat comes from the cheese. Even Rome is split, but purists call oil in cacio e pepe a misstep."
- *Cornstarch*: "Pasta water already brings the starch. Added cornstarch is a lab trick, even if a 2025 Ig Nobel backs it."
- *Sodium citrate*: "Restaurant stabilisers make a foolproof sauce. Purists say three ingredients need no chemistry set."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Parmesan*: Some well-known Italian chefs blend cheeses: a published Alessandro Borghese cacio e pepe reportedly uses Parmigiano Reggiano and Pecorino Romano together. Dissapore argued that Parmigiano is still better than the gel stabiliser many restaurants use. Replacing Pecorino entirely is what draws outrage.
- *Olive oil*: Dissapore reports that the cook at Felice a Testaccio, a famous Roman trattoria, uses oil in its cacio e pepe, so even Rome is split.
- *Cornstarch*: Italian physicists won the 2025 Ig Nobel Prize for showing that a little added starch prevents clumping, and Linkiesta reports that Roman chef Luciano Monosilio also uses cornstarch, so many accept it.
- *Sodium citrate*: Weak and disputed. The sources lens removed this intruder: the only cited Dissapore URL speaks of a 'stabilizzante in gel' (gel stabiliser), not sodium citrate by name. The culinary lens kept it as a restaurant shortcut that rarely draws public outrage. Kept at the lowest popularity; treat as 'restaurant stabilisers' in general.

**Fun facts and accepted details**

- In 2025 Italian physicists working with the Max Planck Institute in Dresden won the Ig Nobel Prize for Physics with the paper 'Phase behavior of Cacio and Pepe sauce'.
- The 2025 BBC Good Food row went as far as a formal complaint to the British embassy in Rome. The recipe was rewritten as a three-ingredient version.
- A New York Times cacio e pepe video, with a Pecorino 'crema' made in advance and pasta cooked past al dente, sparked arguments among readers.
- Italia Squisita, an Italian food video channel, pitted traditional (Claudio Gargioli, Armando al Pantheon) against gourmet (Cristina Bowerman) cacio e pepe.
- Techniques like toasting the pepper or making the cheese cream separately with lukewarm water are argued over constantly, but they are not ingredients.
- ACCEPTED or tolerated in Italy: a blend with some Parmigiano (reportedly Borghese), a pinch of starch (Monosilio and the Ig Nobel physicists), spaghetti instead of tonnarelli.
- Cacio e pepe, gricia, amatriciana and carbonara are a family: add guanciale to cacio e pepe and Romans will tell you it has become gricia.
- 'Cacio' is the old central-Italian word for cheese; here it means Pecorino Romano.

---

## Pasta alla gricia — *Pasta alla gricia (guanciale, Pecorino and black pepper)*

**Origin:** Lazio. The name is traditionally linked to Grisciano, a hamlet of Accumoli (Rieti) near Amatrice; Rome made the dish famous.  
**Pasta / base:** Rigatoni, mezze maniche, spaghetti, bucatini, tonnarelli. A Scatti di Gusto test found smooth pasta works better than ridged.  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** The oldest of Rome's big four: guanciale, Pecorino Romano and black pepper. Amatriciana without tomato, or cacio e pepe with guanciale.  
> **In-game method:** Render guanciale slowly until crisp and its fat has melted. Drain the pasta into the pan with a ladle of cooking water. Off the heat, stir in grated Pecorino and black pepper until a creamy coating forms.

### The proper recipe

- **Guanciale** (Guanciale (cured pork cheek)) — Rendered until golden and crisp
- **Pecorino Romano DOP** (Pecorino Romano cheese)
- **Pepe nero** (Black pepper) — Freshly ground
- **Pasta (rigatoni, mezze maniche, spaghetti)** (Pasta (rigatoni, mezze maniche, spaghetti))
- **Acqua di cottura** (Starchy pasta cooking water) — Binds the guanciale fat and Pecorino into a sauce
- **Vino bianco** (White wine) — Optional, minority practice: a few cooks deglaze the guanciale with it

**Method.** Render guanciale strips slowly until crisp and the fat has melted. Drain the pasta al dente into the pan with the fat and a ladle of cooking water. Off the heat, stir in grated Pecorino Romano and black pepper until a creamy coating forms. It is often described as amatriciana without tomato, or cacio e pepe with guanciale.

**Authority sources** (kept by the sources lens):

- [Gricia o Griscia: Lazio traditional food product sheet (ARSIAL, Regione Lazio agency)](https://www.arsial.it/wp-content/uploads/2025/06/GRICIA-O-GRISCIA.pdf) (2025) — A regional agency document on the dish. It was found in search results but could not be opened, so its content (including the Grisciano origin) was not checked.
- [Il sapore della tradizione: la Gricia (Turismo Roma, City of Rome)](https://turismoroma.it/it/pagina/il-sapore-della-tradizione-la-gricia) — Guanciale, grated Pecorino Romano, salt and pepper; gives the possible origins of the name.
- [Pasta alla gricia: i 7 errori da non fare (Dissapore)](https://www.dissapore.com/cucina/pasta-alla-gricia-tutti-gli-errori-da-evitare/)
- [Lezioni di pasta: la gricia (Scatti di Gusto)](https://www.scattidigusto.it/2019/06/02/lezioni-di-pasta-gricia) (2019)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Cipolla** (Onion) | ●●●○○ 3 | yes | Gricia is guanciale, Pecorino and pepper, and onion is not traditional. When a celebrity chef suggested on a TV cooking contest in 2015 that a gricia needed onion, it was reported as a 'new gaffe' days after his garlic-in-amatriciana row. | [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-cipolla-nella-gricia-nuova-gaffe-dopo-amatriciana-2103438) 2015 (chef: Carlo Cracco); [dissapore.com](https://www.dissapore.com/grande-notizia/ricette-romane-gricia-senza-cipolla/) 2015; [scattidigusto.it](https://www.scattidigusto.it/2015/02/19/gricia-ricetta-perfetta-cipolla) 2015 |
| **Pancetta** (Pancetta (or bacon)) | ●●●○○ 3 | no | Guanciale is the defining ingredient. Italian guides list pancetta as one of the most common gricia mistakes: the dish may still taste good, but it is not gricia. | [dissapore.com](https://www.dissapore.com/cucina/pasta-alla-gricia-tutti-gli-errori-da-evitare/) |
| **Pomodoro** (Tomato) | ●●○○○ 2 | no | Add tomato to gricia and it becomes amatriciana. Dissapore calls ordering a 'gricia rossa' (red gricia) the worst mistake, because the two are distinct dishes. | [dissapore.com](https://www.dissapore.com/cucina/amatriciana-5-errori-da-evitare-accuratamente/) |
| **Aglio** (Garlic) | ●●○○○ 2 | no | The tradition has no garlic. The dish relies only on guanciale fat, sharp Pecorino and pepper. | [dissapore.com](https://www.dissapore.com/cucina/pasta-alla-gricia-tutti-gli-errori-da-evitare/); [dissapore.com](https://www.dissapore.com/ricette/pasta-alla-gricia/) |
| **Peperoncino** (Chili) | ●○○○○ 1 | no | Gricia's heat comes from black pepper. Italian food writers say adding chili is frowned upon. | [dissapore.com](https://www.dissapore.com/cucina/pasta-alla-gricia-tutti-gli-errori-da-evitare/) |

**Game lines** (shown when the intruder appears in this dish):

- *Onion*: "Gricia is guanciale, Pecorino and pepper. A TV chef's onion gricia was called a 'new gaffe' in 2015."
- *Pancetta (or bacon)*: "No guanciale, no gricia. Italian guides list pancetta among the most common gricia mistakes."
- *Tomato*: "Add tomato to a gricia and you have made an amatriciana. Order the dish you actually want."
- *Garlic*: "Gricia has no garlic: guanciale fat, sharp Pecorino and black pepper carry the whole dish."
- *Chili*: "Gricia's heat comes from black pepper. Chili belongs to its cousin, amatriciana."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Onion*: The 2015 chef was Carlo Cracco on MasterChef Italia. During that row Scatti di Gusto published a gricia with onion and defended 'a touch of onion'; Dissapore answered with a 'gricia without onion' piece. Most Roman sources reject it.
- *Chili*: Chili is allowed in amatriciana, which is why some cooks carry it over. It is not part of gricia.

**Fun facts and accepted details**

- Gricia is often called the ancestor of amatriciana. One theory says it is simply cacio e pepe with guanciale added, and amatriciana came after it.
- The name is linked to Grisciano (Accumoli, Rieti). Turismo Roma also mentions other proposed origins of the word.
- Amatrice's own 2015 De.C.O. includes an 'Amatriciana Bianca', which is essentially gricia.
- A Scatti di Gusto test found smooth pasta holds the gricia sauce better than ridged (a technique point).
- ACCEPTED: rigatoni, mezze maniche, spaghetti or tonnarelli are all fine. A few cooks deglaze the guanciale with white wine, a minority practice.

---

## Fettuccine all'Alfredo (fettuccine al burro) — *Fettuccine Alfredo*

**Origin:** Rome. Created by restaurateur Alfredo di Lelio, c. 1907-1914 (sources differ).  
**Pasta / base:** Fresh egg fettuccine, rolled very thin  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** Born in a Roman restaurant in the early 1900s: fresh fettuccine, lots of butter and Parmigiano, emulsified with pasta water. Not a drop of cream.  
> **In-game method:** Cook thin fresh egg fettuccine briefly. Toss them hard with soft butter, finely grated Parmigiano Reggiano and a little pasta water until butter and cheese melt into a silky coating. Restaurants traditionally finish it at the table.

### The proper recipe

- **Fettuccine fresche all'uovo** (Fresh egg fettuccine) — Very thin, so they cook quickly
- **Burro** (Butter) — Generous, softened, good quality
- **Parmigiano Reggiano** (Parmigiano Reggiano) — Aged and finely grated. Unlike carbonara, Parmigiano is the correct cheese here.
- **Acqua di cottura** (Starchy pasta cooking water) — Emulsifies the butter and cheese into a cream
- **Sale** (Salt)
- **Pepe nero** (Black pepper) — Optional. Not part of the restaurants' classic version, but harmless and not mocked.

**Method.** Cook very thin fresh egg fettuccine briefly. Toss them vigorously with plenty of softened butter, finely grated Parmigiano Reggiano and a little starchy cooking water until the butter and cheese emulsify into a silky, creamy coating. There is no cream, and the restaurants traditionally mix it at the table.

**Authority sources** (kept by the sources lens):

- [La storia delle fettuccine Alfredo (Gambero Rosso)](https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo) — States that cream is foreign to Alfredo di Lelio's original recipe, and that the dish was almost unknown in Italy but famous in the US after Douglas Fairbanks and Mary Pickford tasted it.
- [Vi racconto la storia di mio nonno Alfredo di Lelio (Gambero Rosso, Ines Di Lelio)](https://www.gamberorosso.it/rubriche/storie/vi-racconto-la-storia-di-mio-nonno-alfredo-di-lelio-inventore-delle-note-fettuccine-allalfredo/) — The inventor's granddaughter describes butter and Parmigiano as a restorative for his wife Ines after childbirth.
- [Our history (Il Vero Alfredo, Rome)](https://ilveroalfredo.it/en/?p=770)
- [Fettuccine Alfredo (Turismo Roma, City of Rome)](https://www.turismoroma.it/it/page/fettuccine-alfredo)
- [The Real Alfredo (Saveur)](https://www.saveur.com/article/Kitchen/The-Real-Alfredo/) — Reconstructs the dish from its three ingredients: fettuccine, butter and Parmigiano-Reggiano.
- [Fettuccine Alfredo (Wikipedia)](https://en.wikipedia.org/wiki/Fettuccine_Alfredo) — In Italy it is usually called fettuccine al burro or pasta burro e parmigiano; cream, chicken and broccoli are American additions.

<details><summary>More references found by the sweeps (not checked by a lens)</summary>

- [Scatti di Gusto: Fettuccine Alfredo, il mito della ricetta burro e parmigiano](https://www.scattidigusto.it/2021/04/19/fettuccine-alfredo-il-mito-della-ricetta-burro-e-parmigiano-che-arriva-a-casa)

</details>

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Panna** (Cream) | ●●●●● 5 | no | The original is only egg fettuccine, butter and Parmigiano, and its creaminess comes from emulsifying them with pasta water. Heavy cream is the American addition that defines 'Alfredo sauce' abroad and is foreign to di Lelio's recipe. | [gamberorosso.it](https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo); [thedailymeal.com](https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen) (chef: The Pasta Queen (Nadia Caterina Munno)); [saveur.com](https://www.saveur.com/article/Kitchen/The-Real-Alfredo/); [eroicafenice.com](https://www.eroicafenice.com/salotto-culturale/fettuccine-alfredo-storia-di-un-piatto-iconico/); [dissapore.com](https://www.dissapore.com/ricette/fettuccine-alfredo/) |
| **Pollo** (Chicken) | ●●●●● 5 | no | In Italy chicken is normally a main course, rarely a pasta topping, and 'chicken Alfredo' is unknown there. It is the US chain-restaurant version Italian creators mock most. | [thedailymeal.com](https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen) (chef: The Pasta Queen (Nadia Caterina Munno)); [mashed.com](https://mashed.com/990011/the-tiktok-recipe-the-pasta-queen-wants-to-call-the-pasta-police-on) (chef: The Pasta Queen (Nadia Caterina Munno)); [en.wikipedia.org](https://en.wikipedia.org/wiki/Fettuccine_Alfredo); [eroicafenice.com](https://www.eroicafenice.com/salotto-culturale/fettuccine-alfredo-storia-di-un-piatto-iconico/); [italianismo.com.br](https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/) 2023; [upworthy.com](https://www.upworthy.com/man-tries-ordering-chicken-parmesan-italian-olive-garden-ex1/); +1 more in JSON |
| **Broccoli** (Broccoli) | ●●○○○ 2 | no | Broccoli is a common American add-on to 'Alfredo' and is unknown in the Roman dish. | [en.wikipedia.org](https://en.wikipedia.org/wiki/Fettuccine_Alfredo); [ilpost.it](https://www.ilpost.it/2021/02/28/pasta-stati-uniti/) 2021 |
| **Aglio** (Garlic) | ●●○○○ 2 | no | The Roman original is just butter and Parmigiano on egg pasta. Garlic belongs to the American cream-sauce version. | [eroicafenice.com](https://www.eroicafenice.com/salotto-culturale/fettuccine-alfredo-storia-di-un-piatto-iconico/); [dissapore.com](https://www.dissapore.com/ricette/fettuccine-alfredo/) |
| **Gamberi** (Shrimp) | ●●○○○ 2 | no | Seafood is a US add-on. The original has no protein and is a plain butter-and-cheese pasta. | [eroicafenice.com](https://www.eroicafenice.com/salotto-culturale/fettuccine-alfredo-storia-di-un-piatto-iconico/); [ilpost.it](https://www.ilpost.it/2021/02/28/pasta-stati-uniti/) 2021 |

**Game lines** (shown when the intruder appears in this dish):

- *Cream*: "Real Alfredo is fettuccine, butter and Parmigiano. The cream sauce is a later American addition."
- *Chicken*: "In Italy chicken is a main course, not a pasta topping. 'Chicken Alfredo' is unknown in Rome."
- *Broccoli*: "Italians love pasta with broccoli, just not in Alfredo, which is only butter and Parmigiano."
- *Garlic*: "The Roman original is butter and Parmigiano on egg pasta. Garlic came with the US cream version."
- *Shrimp*: "Fettuccine Alfredo has no protein at all. Shrimp is a US restaurant add-on."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Broccoli*: Broccoli with pasta is normal in Italy in other dishes (for example pasta e broccoli); the complaint is only about Alfredo.

**Fun facts and accepted details**

- Alfredo di Lelio created the dish for his wife Ines, who was weak after giving birth; the family dates it to about 1907-1908.
- Hollywood stars Douglas Fairbanks and Mary Pickford tasted it on their 1920 honeymoon in Rome and made it famous in America; a gold fork and spoon said to be their gift are dated 1927.
- Two Roman restaurants claim the original: Il Vero Alfredo (Piazza Augusto Imperatore, run by di Lelio's descendants) and Alfredo alla Scrofa.
- In Italy the dish is usually just 'fettuccine al burro' or 'pasta burro e parmigiano', the plain 'pasta in bianco' comfort food for people who feel unwell; few Italians call it Alfredo.
- Alfredo alla Scrofa now sells a jarred Alfredo sauce made with butter and Parmigiano, and no cream.
- The US celebrates National Fettuccine Alfredo Day on 7 February.
- ACCEPTED, so do not mock: Parmigiano (correct here, unlike in carbonara), lots of butter, pasta water, a little black pepper.
- The di Lelio family story calls the dish fettuccine 'al triplo burro' for its generous butter (culinary lens, not URL-checked).

---

## Tagliatelle al ragù alla bolognese — *Tagliatelle with Bolognese meat ragù*

**Origin:** Bologna, Emilia-Romagna  
**Pasta / base:** Fresh egg tagliatelle (the Bologna pairing). The same ragù also goes into lasagne verdi, and Bolognese custom allows it on dry pasta such as rigatoni or maccheroni. Spaghetti is the classic complaint.  
**Data coverage:** researcher + sources lens + culinary lens + popular-posts sweep

> **In-game blurb:** Bologna's slow-cooked meat sauce, registered by the Accademia Italiana della Cucina (1982, updated 2023) and served on fresh egg tagliatelle.  
> **In-game method:** Soften onion, carrot and celery in oil with fresh pancetta. Brown coarse ground beef, add wine, then passata and a little concentrate. Simmer 2-3 hours, adding light broth and, if you like, milk. Toss with egg tagliatelle; Parmigiano at the table.

### The proper recipe

- **Polpa di manzo macinata grossa** (Coarsely ground beef) — About 400 g in the 2023 Accademia text (per the HoReCa News copy of the PDF and press reports). It replaced the 1982 recipe's 'cartella', a fatty beef cut.
- **Pancetta di maiale fresca** (Fresh (unsmoked) pork belly / pancetta) — About 150 g. Cured flat (stesa) or rolled (arrotolata) pancetta is an admitted variant; smoked pancetta is not.
- **Cipolla, carota, sedano** (Onion, carrot, celery) — Finely chopped soffritto. Apart from an optional hint of nutmeg, these are the only aromatics.
- **Passata di pomodoro e concentrato doppio** (Tomato passata plus a spoonful of double tomato concentrate) — Tomato is kept to a small amount. This is a meat sauce, not a tomato sauce.
- **Vino rosso o bianco secco** (Dry red or white wine) — About a glass. The 2023 text, as reported by Il Resto del Carlino, allows red or white.
- **Latte intero** (Whole milk) — Optional: listed as 'latte intero (facoltativo)' in the 2023 text.
- **Brodo di carne o vegetale leggero** (Light meat or vegetable broth) — Must be light. The 2023 text says it may even be made from a stock cube ('anche di dado').
- **Olio extravergine d'oliva** (Extra-virgin olive oil) — 3 tablespoons in the 2023 text.
- **Sale e pepe** (Salt and pepper)
- **Noce moscata** (Nutmeg) — Optional admitted variant: 'un profumo'
- **Lombo o capocollo di maiale** (Pork loin or neck) — Optional admitted variant: mixed meat, about 60% beef and 40% pork. Knife-chopped meat is also admitted. Pork on its own is not.
- **Fegatini, cuori e durelli di pollo; salsiccia; piselli; funghi porcini secchi** (Chicken livers, hearts and gizzards; skinned crumbled pork sausage; peas; soaked dried porcini) — Optional enrichments the Accademia suggests with the 2023 update, as reported by the Corriere della Sera and other press. Accepted: do not mock them.
- **Tagliatelle all'uovo** (Fresh egg tagliatelle) — The pasta
- **Parmigiano Reggiano** (Parmigiano Reggiano) — Grated over at the table by custom. It is not part of the registered sauce.

**Method.** Gently fry finely chopped onion, carrot and celery in olive oil with diced fresh pancetta. Add the coarsely ground beef and brown it, then deglaze with wine and stir in the tomato passata and concentrate. Simmer covered on a very low heat for 2-3 hours, adding light broth as needed and, optionally, whole milk; season with salt and pepper. Toss with fresh egg tagliatelle and serve with Parmigiano Reggiano.

**Authority sources** (kept by the sources lens):

- [Accademia Italiana della Cucina: Ragù alla bolognese, ricetta aggiornata 20 aprile 2023 (PDF)](https://accademiaitalianadellacucina.it/sites/default/files/Ragù%20alla%20bolognese%20-%20ricetta%20aggiornata%2020%20aprile%202023.pdf) (2023) — ✓ "VARIANTI AMMESSE 1) Carni miste: manzo (circa il 60%) e maiale (circa il 40%) (lombo o capocollo); 2) Carni tritate al coltello; 3) Pancetta stesa o arrotolata di maiale al posto della pancetta fresca; 4) Un profumo di noce moscata;" (ADMITTED VARIANTS 1) Mixed meats: beef (about 60%) and pork (about 40%) (loin or neck); 2) Knife-chopped meat; 3) Flat or rolled pork pancetta instead of fresh pancetta; 4) A hint of nutmeg;)
- [Accademia Italiana della Cucina: Ragù alla bolognese, updated recipe 20 April 2023 (PDF, English)](https://www.accademiaitalianadellacucina.it/sites/default/files/Ragù%20alla%20bolognese%20-%20updated%20recipe_20%20April%202023.pdf) (2023)
- [Accademia Italiana della Cucina: announcement of the updated ragù recipe](https://accademiaitalianadellacucina.it/en/node/62013) (2023) — ✓ "The Italian Academy of Cuisine has updated the recipe for true ragù alla bolognese: from 20 April 2023 the reference text will differ from that deposited in the Bologna Chamber of Commerce on 17 October 1982."
- [Camera di Commercio di Bologna: press release on depositing the renewed ragù recipe (20 April 2023, PDF)](https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/2023/comunicato%20stampa%20deposito%20rinnovata%20ricetta%20vero%20Ragù%20alla%20bolognese%2020%20aprile%202023.pdf) (2023)
- [LaPresse: Cambia la ricetta del ragù bolognese: eccola](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) (2023) — ✓ "Non sono ammesse, invece, la polpa di vitello e la pancetta affumicata, così come solo la carne di maiale, aglio, rosmarino, prezzemolo o altri aromi. Vietati brandy e farina." (Not allowed, however, are veal and smoked pancetta, nor pork alone, garlic, rosemary, parsley or other aromatics. Brandy and flour are forbidden.)
- [Bologna city heritage sheet: Tagliatella al ragù (PDF)](https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf) (2022) — ✓ "Quando il ragù è pronto, secondo l'uso bolognese, si usa aggiungere la panna se si tratta di condire paste secche. Per le tagliatelle il suo uso è da escludere." (When the ragù is ready, by Bolognese custom, cream is added if it is to dress dry pasta. For tagliatelle its use is to be ruled out.)
- [Dissapore: Ragù alla bolognese, aggiornata la ricetta ufficiale: pancetta e manzo al posto della 'cartella'](https://www.dissapore.com/notizie/ragu-alla-bolognese-aggiornata-la-ricetta-ufficiale-pancetta-e-manzo-al-posto-della-cartella/) (2023)
- [Sky TG24: Ragù alla bolognese, la nuova ricetta depositata ha qualche piccola variazione](https://tg24.sky.it/lifestyle/2023/04/20/ragu-alla-bolognese-ricetta-originale) (2023)

<details><summary>More references found by the sweeps (not checked by a lens)</summary>

- [Vero ragù bolognese: ricetta aggiornata, ingredienti (AGI)](https://www.agi.it/cronaca/news/2023-04-20/vero_ragu_bolognese_ricetta_aggiornata_ingredienti-21053153/)
- [Ragù alla bolognese (Bologna Welcome, city tourism office)](https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/ragu-alla-bolognese)
- [Tagliatelle al ragù (Bologna Welcome)](https://www.bolognawelcome.com/home/vivi/food-drink/tradizione-culinaria/le-ricette-tradizionali/tagliatelle-al-ragu)

</details>

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Spaghetti** (Spaghetti) | ●●●●● 5 | yes | In Bologna, ragù goes on fresh egg tagliatelle, whose wide, porous surface holds the meat sauce. In 2019 Bologna's mayor asked people to send him photos of 'spaghetti bolognese' from around the world, calling it a dish that does not exist. | [cbc.ca](https://www.cbc.ca/lite/story/1.5041024) 2019 ✓"Spaghetti Bolognese doesn't actually exist; yet, it's famous the world over"; [italysegreta.com](https://italysegreta.com/it/gli-spaghetti-alla-bolognese-non-esistono/); [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2019/03/25/gli-spaghetti-alla-bolognese-esistono-davvero/5018402/) 2019; [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/spaghetti-alla-bolognese-la-vera-storia/); [vincenzosplate.com](https://www.vincenzosplate.com/the-secret-to-authentic-bolognese-sauce/) (chef: Vincenzo's Plate (Vincenzo Prosperi)); [yougov.co.uk](https://yougov.co.uk/international/articles/40810-italian-food-crimes) 2022; +4 more in JSON |
| **Aglio** (Garlic) | ●●●●○ 4 | no | The Accademia Italiana della Cucina's registered recipe names garlic among the ingredients that are not allowed. The aromatic base of Bolognese ragù is only onion, carrot and celery. | [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) 2023 ✓"Non sono ammesse, invece, la polpa di vitello e la pancetta affumicata, così come solo la carne di maiale, aglio, rosmarino, prezzemolo o altri aromi."; [ilrestodelcarlino.it](https://www.ilrestodelcarlino.it/bologna/cultura/ragu-bolognese-ricetta-camera-di-commercio-p04w1fsk) 2023 ✓"Aglio, rosmarino, prezzemolo, altri aromi o spezie"; [agi.it](https://www.agi.it/cronaca/news/2023-04-20/vero_ragu_bolognese_ricetta_aggiornata_ingredienti-21053153/) 2023 |
| **Panna** (Cream) | ●●●○○ 3 | yes | Bologna's own heritage text says cream is ruled out for tagliatelle al ragù, and the optional softener in the registered recipe is whole milk. When a major US newspaper shared a creamy 'white Bolognese' on Facebook in 2016, Italian readers protested, and a TV chef from the Bologna area answered with his own traditional ragù. | [assets.culturabologna.it](https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf) 2022 ✓"Per le tagliatelle il suo uso è da escludere."; [cms.thelocal.com](https://cms.thelocal.com/?p=384656) 2016; [travelemiliaromagna.it](https://www.travelemiliaromagna.it/en/?p=44632) 2016 (chef: Bruno Barbieri); [international.agi.it](https://international.agi.it/international/hands_off_from_the_traditional_bolognese_ragu-1021976/news/2016-08-22/) 2016 |
| **Pancetta affumicata (bacon)** (Smoked pancetta / bacon) | ●●○○○ 2 | no | The registered recipe uses fresh, unsmoked pork belly. Cured flat or rolled pancetta is allowed, but smoked pancetta is explicitly not, and foreign recipes often use bacon. | [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) 2023 ✓"Non sono ammesse, invece, la polpa di vitello e la pancetta affumicata" |
| **Basilico** (Basil) | ●●○○○ 2 | no | Bolognese ragù uses no fresh herbs. The registered recipe rules out garlic, rosemary, parsley and 'other aromatics', which covers basil. | [ilrestodelcarlino.it](https://www.ilrestodelcarlino.it/bologna/cultura/ragu-bolognese-ricetta-camera-di-commercio-p04w1fsk) 2023 ✓"Aglio, rosmarino, prezzemolo, altri aromi o spezie"; [gamberorosso.it](https://www.gamberorosso.it/notizie/ricette/la-mappa-sbagliata-dei-ragu-italiani-la-gaffe-di-tasteatlas/) |
| **Origano, peperoncino e altre spezie** (Oregano, chili and other spices) | ●●○○○ 2 | no | Besides salt, pepper and an optional hint of nutmeg, the registered recipe rules out 'other aromatics or spices', so oregano, chili flakes and dried herb mixes do not belong. | [ilrestodelcarlino.it](https://www.ilrestodelcarlino.it/bologna/cultura/ragu-bolognese-ricetta-camera-di-commercio-p04w1fsk) 2023 ✓"Aglio, rosmarino, prezzemolo, altri aromi o spezie" |
| **Rosmarino** (Rosemary) | ●○○○○ 1 | yes | Rosemary is named among the herbs that are not allowed in the registered Bolognese recipe. | [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) 2023; [tavolartegusto.it](https://www.tavolartegusto.it/?p=23700); [my-personaltrainer.it](https://www.my-personaltrainer.it/alimentazione/ragu.html) |
| **Prezzemolo** (Parsley) | ●○○○○ 1 | no | Parsley is explicitly excluded from the registered Bolognese recipe. | [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) 2023 |
| **Polpa di vitello** (Veal) | ●○○○○ 1 | yes | The registered recipe specifically excludes veal. It calls for beef, optionally mixed with some pork. | [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) 2023 ✓"Non sono ammesse, invece, la polpa di vitello e la pancetta affumicata" |
| **Brandy** (Brandy) | ●○○○○ 1 | no | The recipe calls for a glass of dry wine, and brandy is explicitly forbidden. | [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) 2023 ✓"Vietati brandy e farina." |

**Game lines** (shown when the intruder appears in this dish):

- *Spaghetti*: "In Bologna, ragù goes on fresh egg tagliatelle. Spaghetti bolognese is the dish Bologna never serves."
- *Garlic*: "Bologna's registered ragù lists garlic as not allowed: the base is onion, carrot and celery only."
- *Cream*: "Bologna's rule: no cream on tagliatelle al ragù. Whole milk is the optional softener."
- *Smoked pancetta / bacon*: "The registered ragù uses fresh pancetta. Smoked pancetta, let alone bacon, is explicitly not allowed."
- *Basil*: "Bolognese ragù uses no fresh herbs: the registered recipe rules out 'other aromatics'."
- *Oregano, chili and other spices*: "Salt, pepper and a hint of nutmeg. The registered ragù rules out every other spice."
- *Rosemary*: "Rosemary is on the registered ragù's not-allowed list, whatever some Emilian families say."
- *Parsley*: "Parsley is explicitly excluded from the registered Bolognese ragù."
- *Veal*: "The registered Bolognese wants beef, optionally with some pork. Veal is specifically excluded."
- *Brandy*: "A glass of dry wine, yes. The registered Bolognese recipe forbids brandy outright."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Spaghetti*: The mayor was Virginio Merola. Bolognese custom does put ragù on dry pasta such as maccheroni, and Il Fatto Quotidiano and Gambero Rosso have argued that spaghetti alla bolognese has a real history. In YouGov's 2022 survey most Italians called Bolognese sauce on spaghetti acceptable (net +81), and Roman influencer chef Max Mariola has a video titled 'Spaghetti alla bolognese'. A loud Bologna-led complaint, not a national consensus.
- *Garlic*: Garlic is common in home meat sauces elsewhere in Italy. The exclusion is specific to the Bolognese recipe.
- *Cream*: The 2016 chef was Bruno Barbieri. Bolognese custom allows stirring cream into finished ragù when it dresses dry pasta, but never tagliatelle, and some food historians say Pellegrino Artusi's 1891 Bolognese sauce was finished with cream (culinary lens, not re-checked). The rule is 'no cream with tagliatelle', not 'no cream ever'.
- *Rosemary*: Some Emilian families (a Ferrara reader on Tavolartegusto, for example) say rosemary has always gone into their home ragù, and Italian sites list it as a common but non-traditional addition.
- *Veal*: Mixed beef, pork and veal mince is common in Italian home ragù outside Bologna, and Pellegrino Artusi's 19th-century Bolognese sauce is commonly said to use lean veal (culinary lens, not re-checked). Veal is excluded only from the registered Bolognese version.

**Fun facts and accepted details**

- Milk is ACCEPTED: whole milk is an optional ingredient in the 2023 registered recipe, so the game should not mock it.
- Olive oil, a light broth (even from a stock cube), nutmeg, mixed beef and pork, and hand-chopped meat are all officially ACCEPTED in the 2023 text.
- Press coverage of the 2023 update lists accepted enrichments: chicken livers, hearts and gizzards; skinned, crumbled pork sausage; peas added at the end; soaked dried mushrooms. Do not mock these in the ragù level.
- The 1982 recipe was built around the 'cartella', a fatty beef cut. The 2023 update replaced it with ground beef. At least one press clipping gives the original date as 1972 instead of 1982.
- Thickening with flour is explicitly forbidden, and so is brandy.
- Bolognese custom allows cream when the ragù dresses dry pasta, but never on tagliatelle.
- A golden 'tagliatella' sample deposited at the Bologna Chamber of Commerce in 1972 fixes its cooked width at about 8 mm, said to be 1/12,270 of the height of the Asinelli tower.
- Technique note (out of scope): the ragù simmers very slowly, for 2 hours or more.
- Italians are less strict than Bologna about spaghetti: in YouGov's 2022 survey Italians rated Bolognese sauce on spaghetti acceptable (net +81), while ketchup on pasta was the worst crime of all (-82).
- The date mix-up has an explanation: 1972 is the year the tagliatella was registered, while the ragù was first registered in 1982 (culinary lens).

---

## Lasagne verdi alla bolognese — *Green lasagne, Bolognese style*

**Origin:** Bologna, Emilia-Romagna  
**Pasta / base:** Green egg-pasta sheets coloured with spinach (sfoglia verde), rolled thin by hand  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** Bologna's registered green lasagne: spinach egg pasta layered with ragù, béchamel and Parmigiano Reggiano, baked until crisp at the edges.  
> **In-game method:** Roll thin spinach egg pasta and blanch the sheets. Layer pasta, ragù, béchamel and grated Parmigiano five or six times in a buttered dish. Top with ragù, béchamel, Parmigiano and flakes of butter, then bake until golden and crisp at the edges.

### The proper recipe

- **Sfoglia verde all'uovo (farina 00, uova, spinaci)** (Green egg-pasta sheets (00 flour, eggs, spinach)) — The registered recipe specifies green pasta coloured with spinach; Bologna Welcome's transcription gives 700 g of 00 flour and 3 eggs per 1 kg of dough. Plain yellow egg sheets are common at home and not a crime.
- **Ragù alla bolognese** (Bolognese ragù) — About 1 kg for 8 people, per the Bologna Welcome transcription. The same ragù rules apply: no garlic, herbs or smoked pancetta.
- **Besciamella (burro, farina 00, latte intero, sale, noce moscata)** (Béchamel (butter, 00 flour, whole milk, salt, nutmeg)) — Canonical in Bologna; do not mock it. Bologna Welcome lists 100 g of 00 flour and 1 litre of fresh whole milk, plus butter, salt and nutmeg.
- **Parmigiano Reggiano** (Parmigiano Reggiano) — Generous: Bologna Welcome's transcription gives 400 g, freshly grated, for 8 people.
- **Burro** (Butter) — For the dish and dotted on top

**Method.** Roll thin green sheets of egg pasta made with spinach and blanch them briefly. In a buttered baking dish, build about five or six layers of pasta, ragù, béchamel and grated Parmigiano Reggiano. Finish with ragù, béchamel, Parmigiano and a few flakes of butter, then bake until the top is browned and slightly crisp at the edges.

**Authority sources** (kept by the sources lens):

- [Bologna Welcome (official tourism site): Lasagne verdi alla bolognese, registered recipe](https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese) (2003)
- [Bologna Welcome: Lasagne verdi alla bolognese (English)](https://www.bolognawelcome.com/en/other/other/lasagne-verdi-alla-bolognese-2) (2003)
- [Do Eat Better: dove mangiare lasagne alla bolognese a Bologna](https://doeatbetterexperience.com/it/blog/dove-mangiare-lasagne-alla-bolognese-bologna/)
- [Scatti di Gusto: Lasagne alla bolognese, ricetta originale con ragù cremoso e sfoglia verde](https://www.scattidigusto.it/lasagne-alla-bolognese-ricetta-originale-con-ragu-cremoso-e-sfoglia-verde)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Ricotta** (Ricotta) | ●●●○○ 3 | yes | The registered Bolognese lasagne is layered only with ragù, béchamel and Parmigiano Reggiano. Ricotta layers belong to Italian-American lasagna and to Neapolitan Carnival lasagna, not to Bologna's. | [bolognawelcome.com](https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese) 2003 |
| **Mozzarella** (Mozzarella) | ●●○○○ 2 | yes | Mozzarella is not in the registered recipe. In Bologna, béchamel supplies the creaminess and Parmigiano supplies the flavour and the crust. | [bolognawelcome.com](https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese) 2003 |
| **Aglio (nel ragù)** (Garlic (in the meat sauce)) | ●●○○○ 2 | no | The lasagne uses Bolognese ragù, and the registered ragù recipe explicitly excludes garlic. | [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) 2023 |
| **Polpettine** (Little meatballs) | ●○○○○ 1 | yes | The Bolognese version uses smooth ragù between the layers, not meatballs. | [bolognawelcome.com](https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese) 2003 |
| **Uova sode** (Hard-boiled eggs) | ●○○○○ 1 | yes | Sliced hard-boiled eggs are not part of the Bolognese lasagne. | [bolognawelcome.com](https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese) 2003 |

**Game lines** (shown when the intruder appears in this dish):

- *Ricotta*: "Bologna's lasagne is ragù, béchamel and Parmigiano. Ricotta layers belong to Naples and America."
- *Mozzarella*: "In Bologna, béchamel brings the creaminess and Parmigiano the crust. Mozzarella is not registered."
- *Garlic (in the meat sauce)*: "The lasagne's ragù follows Bologna's rules, and the registered ragù forbids garlic."
- *Little meatballs*: "Tiny meatballs make Naples' Carnival lasagna. Bologna layers smooth ragù instead."
- *Hard-boiled eggs*: "Hard-boiled eggs are a Neapolitan lasagna tradition, not part of Bologna's green lasagne."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Ricotta*: Ricotta is legitimate in Neapolitan Carnival lasagna (lasagna napoletana), a different Italian dish. It is an intruder only in the Bolognese version.
- *Mozzarella*: Many Italian home cooks add mozzarella to baked lasagne, and Neapolitan lasagna uses fior di latte or provola. In Bolognese lasagne it is a deviation, not a crime, for many Italians.
- *Little meatballs*: Tiny meatballs are a defining feature of Neapolitan lasagna di Carnevale, so they are authentic Italian, just not Bolognese.
- *Hard-boiled eggs*: They are traditional in Neapolitan Carnival lasagna and some southern baked pastas.

**Fun facts and accepted details**

- The Accademia Italiana della Cucina's Bologna delegation registered the recipe in 2003. Sources disagree on the exact date: Bologna Welcome reportedly gives a decree ceremony on 28 May 2003 and a notarial deposit on 4 July 2003 at Palazzo della Mercanzia, while another site says 8 May 2003.
- The pasta is green: spinach goes into the egg dough. Yellow egg sheets are a common, accepted home variation.
- Béchamel is ACCEPTED and canonical in Bologna. Do not treat it as an intruder.
- Neapolitan lasagna di Carnevale (ricotta, meatballs, sausage, hard-boiled eggs, fior di latte) is a real Italian tradition. Those ingredients are intruders only in the Bologna level.
- The ragù was registered in 1982 and updated in 2023. The lasagne recipe predates the update.

---

## Trofie o trenette al pesto genovese — *Trofie or trenette with Genoese basil pesto*

**Origin:** Genoa, Liguria  
**Pasta / base:** Trofie, trenette (often 'avvantaggiate' with potatoes and green beans), and also mandilli de sea (thin silk-handkerchief sheets), testaroli and gnocchi  
**Data coverage:** researcher + sources lens + culinary lens + popular-posts sweep

> **In-game blurb:** Genoa's raw green sauce: Genoese basil, olive oil, pine nuts, garlic, salt, Parmigiano and Sardinian pecorino, pounded in a marble mortar.  
> **In-game method:** Crush garlic with coarse salt in a marble mortar, then grind in basil leaves with a rotating pestle. Work in pine nuts and grated cheeses, then loosen with olive oil. Never cook it: toss off the heat with trofie or trenette, often boiled with potato and green beans.

### The proper recipe

- **Basilico Genovese DOP** (Genoese basil (PDO)) — Young, small leaves. The basil, not the sauce, is the DOP product. One description of the Consorzio rules sets basil at no less than 25% of the sauce.
- **Olio extravergine d'oliva (possibilmente Riviera Ligure DOP)** (Extra-virgin olive oil, preferably Ligurian)
- **Parmigiano Reggiano** (Parmigiano Reggiano) — Well aged. Descriptions of the Consorzio list also accept Grana Padano DOP.
- **Pecorino (Fiore Sardo DOP / pecorino sardo)** (Sardinian sheep's cheese (Fiore Sardo)) — Sources differ between Fiore Sardo, Pecorino Sardo and Pecorino Romano. All are accepted.
- **Pinoli** (Pine nuts) — Mediterranean pine nuts. One source says the Consorzio text allows walnuts in the same quantity instead (not verified against the text).
- **Aglio** (Garlic) — In the seven-ingredient Consorzio recipe; garlic from Vessalico is prized. How much to use is debated, and garlic-light or garlic-free pesto is a known request, so it is not an intruder either way.
- **Sale grosso** (Coarse salt) — A little, used as an abrasive in the mortar
- **Patate e fagiolini** (Potatoes and green beans) — Optional but traditional: boiled with trenette or trofie ('avvantaggiate'). ACCEPTED.

**Method.** In a marble mortar with a wooden pestle, crush garlic with a little coarse salt. Add the basil leaves and grind with a rotating motion, then work in the pine nuts and the grated Parmigiano and pecorino. Finally loosen the paste with olive oil added a little at a time. Pesto is never cooked: toss it off the heat with trofie or trenette (often boiled with diced potato and green beans) and a splash of pasta water.

**Authority sources** (kept by the sources lens):

- [Gambero Rosso: classifica dei 10 pesti genovesi (describes the Consorzio's 7-ingredient rule)](https://www.gamberorosso.it/notizie/rubriche/classifiche/10-pesti-genovesi-classifica-gambero-rosso/)
- [Visit Italy: Pesto genovese, ricetta](https://www.visititaly.eu/it/cibo-e-sapori/pesto-genovese-ricetta)
- [Italia.it (official tourism portal): Pesto alla genovese](https://www.italia.it/it/liguria/cosa-fare/pesto-alla-genovese)
- [Dissapore: Il pesto è una delle salse italiane più vendute al mondo, ma non ha ancora un disciplinare](https://www.dissapore.com/notizie/il-pesto-e-una-delle-salse-italiane-piu-vendute-al-mondo-ma-non-ha-ancora-un-disciplinare/) — ✓ "Il pesto è una delle salse italiane più vendute al mondo, ma non ha ancora un disciplinare" (Pesto is one of the best-selling Italian sauces in the world, but it still has no official production rules (headline))
- [Scatti di Gusto: Pesto al mortaio, la ricetta di Roberto Panizza (Genoese restaurateur behind the World Pesto Championship)](https://www.scattidigusto.it/pesto-al-mortaio-la-ricetta-di-roberto-panizza-da-fare-a-casa/) (2019)
- [Gambero Rosso: 85-year-old Genoese woman wins the 2026 World Pesto al Mortaio Championship](https://www.gamberorosso.it/notizie/attualita/donna-genovese-85-anni-vincitrice-campionato-mondiale-pesto-mortaio-2026/) (2026)
- [Associazione Palatifini: World Pesto Championship, who we are](https://www.pestochampionship.it/who-we-are/?lang=en)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Panna** (Cream) | ●●●●○ 4 | no | Genoese pesto is a raw sauce of basil, olive oil, cheese, pine nuts, garlic and salt. Cream is not among those seven ingredients, and it dulls the basil. Cream against tradition is a long-running pesto argument in Italian food writing. | [gazzettadelgusto.it](https://gazzettadelgusto.it/cibo/10-curiosita-sul-pesto-genovese-tra-storia-e-rituali/); [gamberorosso.it](https://www.gamberorosso.it/notizie/rubriche/classifiche/10-pesti-genovesi-classifica-gambero-rosso/) |
| **Anacardi** (Cashews) | ●●●○○ 3 | no | Cheap industrial jars often replace pine nuts with cashews. Italian food media treat this as the mark of an imitation 'alla genovese' pesto. | [dissapore.com](https://www.dissapore.com/spesa/il-migliore-pesto-genovese-in-barattolo/) ✓"Il pesto migliore: oli vegetali, addensanti e anacardi che vi risparmiate"; [lindipendente.online](https://www.lindipendente.online/2025/09/01/pesto-genovese-o-alla-genovese-il-tranello-dellindustria-alimentare/) 2025; [dissapore.com](https://www.dissapore.com/ricette/pesto-5-errori-da-non-fare/) |
| **Olio di semi (girasole)** (Seed oil (sunflower oil)) | ●●●○○ 3 | no | The recipe calls for extra-virgin olive oil, ideally Ligurian. Many commercial pestos swap in sunflower or other seed oils, which Italian food media call out. | [dissapore.com](https://www.dissapore.com/spesa/il-migliore-pesto-genovese-in-barattolo/); [ilfattoalimentare.it](https://ilfattoalimentare.it/confronto-prodotti-pesto-alla-genovese-tabella-ingredienti-prezzi.html) |
| **Burro** (Butter) | ●●●○○ 3 | yes | Butter is not among the seven ingredients of today's Genoese pesto. A waitress at a Genoa pesto restaurant told Internazionale that butter in pesto is 'a crime', like cream in carbonara, and when a Milan-area star chef defended butter in 2015, Genoa dismissed it as 'stuff for the Milanese'. | [dissapore.com](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-burro/) 2015 (chef: Davide Oldani) ✓"Davide Oldani insiste con il burro ma a Genova dicono che è roba per milanesi"; [gustoblog.it](https://www.gustoblog.it/2015/02/12/il-pesto-alla-ligure-di-oldani-lo-chef-aggiunge-il-burro-alla-ricetta-tradizionale) 2015 (chef: Davide Oldani); [internazionale.it](https://www.internazionale.it/essenziale/notizie/tom-landolfi/2023/01/04/caccia-pesto-perfetto) 2023 ✓"Il burro no, è reato, non scherziamo. Sarebbe come mettere la panna nella carbonara"; [dissapore.com](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-ci-mette-il-burro/) 2015 (chef: Davide Oldani) |
| **Noci** (Walnuts) | ●●○○○ 2 | yes | Pine nuts are the canonical nut. Walnuts are a common cost-saving substitute that Italian food writers find unconvincing because of their strong flavour. | [dissapore.com](https://www.dissapore.com/ricette/pesto-5-errori-da-non-fare/); [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/storia-varianti-e-ricette-del-pesto-in-italia-da-quello-genovese-alla-salsa-di-noci) |
| **Prezzemolo** (Parsley) | ●○○○○ 1 | yes | Basil is the herb of pesto genovese. A star chef's parsley-and-mint 'pesto' video drew angry comments from the Genoese. | [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/video/massimo-bottura-pesto-genovese-video-2844499) (chef: Massimo Bottura) ✓"ha scatenato l'ira dei genovesi" |
| **Menta** (Mint) | ●○○○○ 1 | no | Mint is not part of Genoese pesto. A star chef's parsley-and-mint version provoked the Genoese. | [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/video/massimo-bottura-pesto-genovese-video-2844499) (chef: Massimo Bottura) ✓"ha scatenato l'ira dei genovesi" |
| **Rucola** (Rocket (arugula)) | ●○○○○ 1 | yes | Rocket pestos are popular abroad, but pesto genovese is a basil sauce. A leading Genoese pesto champion lists rocket among the alternative ingredients he would not recommend and insists on Ligurian basil. | [scattidigusto.it](https://www.scattidigusto.it/ricetta-pesto-ingredienti-alternativi) 2016 (chef: Roberto Panizza) |
| **Gouda e formaggi non italiani** (Gouda and other non-Italian cheeses) | ●○○○○ 1 | yes | The cheeses are Parmigiano Reggiano (or Grana Padano) and Sardinian pecorino. Genoese pesto purists insist both be authentic and reject Gouda-based versions, and Coldiretti's lists of dishes distorted abroad complain about generic cheese in pesto. | [scattidigusto.it](https://www.scattidigusto.it/ricetta-pesto-ingredienti-alternativi) 2016 (chef: Roberto Panizza); [meteoweb.eu](https://www.meteoweb.eu/2016/04/il-made-in-italy-taroccato-non-e-solo-carbonara-gate-dalla-falsa-caprese-alla-pizza-ecco-le-peggiori-imitazioni/666794/) 2016 |

**Game lines** (shown when the intruder appears in this dish):

- *Cream*: "Genoese pesto is seven raw ingredients, and cream is not one of them. It drowns the basil."
- *Cashews*: "Pine nuts, not cashews. Italian food media call cashews the mark of an imitation pesto jar."
- *Seed oil (sunflower oil)*: "Pesto genovese wants extra-virgin olive oil, ideally Ligurian, not cheap seed oil."
- *Butter*: "Today's Genoese pesto uses olive oil only. Genoa called butter pesto 'stuff for the Milanese'."
- *Walnuts*: "Pine nuts are canonical. Walnuts belong in Liguria's other sauce, salsa di noci."
- *Parsley*: "Basil is the herb of pesto genovese. A parsley 'pesto' video made the Genoese furious."
- *Mint*: "Mint is not in pesto genovese. A mint-and-parsley 'pesto' video drew Genoese fury."
- *Rocket (arugula)*: "Rocket pesto is a fine recipe of its own, but it is not pesto genovese. Only basil makes that."
- *Gouda and other non-Italian cheeses*: "Pesto's cheeses are Parmigiano and Sardinian pecorino. Coldiretti decries generic cheese swaps."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Cream*: Cream-enriched pesto was a common Italian restaurant and home shortcut, so some Italians do eat it, but no Genoese authority accepts it.
- *Butter*: The 2015 chef was Davide Oldani, who argued butter is traditional; the restaurant was Roberto Panizza's Il Genovese. The first printed Genoese pesto (G.B. Ratto, La Cuciniera Genovese, 1863), as usually quoted, pounds the ingredients with 'poco burro', Ada Boni gives butter variants, and Internazionale calls butter the old 'cream' of pesto. Today's Genoese tradition and the seven-ingredient rule exclude it.
- *Walnuts*: Liguria has its own walnut sauce (salsa di noci, for pansoti), and some descriptions of the Consorzio's ingredient list reportedly allow walnuts in place of pine nuts (not verified against the text). Pine nuts remain the standard.
- *Parsley*: The chef was Massimo Bottura. The first printed Genoese pesto recipe (G.B. Ratto, La Cuciniera Genovese, 1863) allowed marjoram and parsley when basil was not available.
- *Mint*: The chef was Massimo Bottura (Blitz Quotidiano video).
- *Rocket (arugula)*: The pesto champion is Roberto Panizza (Scatti di Gusto). Rocket pesto (pesto di rucola) is a common Italian home recipe in its own right: it is wrong only when passed off as pesto genovese.
- *Gouda and other non-Italian cheeses*: The purist quoted is Roberto Panizza (Scatti di Gusto). The first printed Genoese recipe (G.B. Ratto, 1863), as usually quoted, mixed 'formaggio olandese' (Dutch cheese) with Parmigiano (not re-checked). Modern Genoese pesto uses only Italian cheeses.

**Fun facts and accepted details**

- Potatoes and green beans cooked with the pasta are ACCEPTED and traditional ('trenette avvantaggiate'). Do not mock them.
- Roberto Panizza describes pesto as essentially a garlic sauce flavoured with basil (Scatti di Gusto), so garlic is essential, ideally from Vessalico.
- The protected product is Basilico Genovese DOP. Pesto itself is not a DOP sauce and has only a voluntary Consorzio recipe, so commercial jars may say 'alla genovese' even when ingredients are swapped.
- The first printed Genoese pesto (G.B. Ratto, 1863) allowed marjoram and parsley when basil was not available. As usually quoted, it also used Dutch cheese and a little butter, both of which modern purists reject.
- Pansoti are dressed with salsa di noci (walnut sauce), not pesto. That is why the 2025 Milan video caused uproar in Genoa.
- Genoa hosts the World Pesto al Mortaio Championship. Gambero Rosso reports that an 85-year-old Genoese woman won the 2026 edition.
- Technique notes (out of scope): pesto is never heated, and Italian food media call the mortar-versus-blender debate an 'eternal war'.
- Grana Padano in place of Parmigiano, and Pecorino Romano or Pecorino Sardo in place of Fiore Sardo, are ACCEPTED in descriptions of the Consorzio recipe.
- Garlic is essential in pesto even though it is banned from carbonara and amatriciana: the same ingredient can be friend or foe.

---

## Tortellini in brodo — *Tortellini in broth*

**Origin:** Bologna, Emilia-Romagna (Modena and Castelfranco Emilia also claim it)  
**Pasta / base:** Tiny ring-shaped stuffed egg pasta, folded by hand from small squares of thin yellow sfoglia (10 eggs per 1 kg of flour, about 1,000 tortellini)  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** Bologna's tiny navel-shaped pasta, filled with pork loin, prosciutto, mortadella and Parmigiano, registered in 1974 and served in rich meat broth.  
> **In-game method:** Brown pork loin in butter, mince with prosciutto crudo and mortadella, then mix in Parmigiano, egg and nutmeg. Cut thin egg pasta into small squares, fill, fold and wrap each round a finger. Cook a few minutes in beef-and-hen broth and serve in it.

### The proper recipe

- **Lombo di maiale rosolato al burro** (Pork loin, browned in butter) — 300 g in the 1974 registered recipe
- **Prosciutto crudo** (Prosciutto crudo (cured raw ham)) — 300 g
- **Mortadella di Bologna** (Mortadella di Bologna) — 300 g. 'Vera mortadella di Bologna' in the registered text.
- **Parmigiano Reggiano** (Parmigiano Reggiano) — Grated into the filling. The commonly quoted 1974 text gives 450 g, with 3 eggs and 1 whole nutmeg (quantities not re-checked in this session).
- **Uova** (Eggs) — In the filling and the pasta
- **Noce moscata** (Nutmeg)
- **Sfoglia all'uovo (farina e uova)** (Egg pasta (flour and eggs)) — Rolled thin with a rolling pin
- **Brodo di manzo e gallina ruspante** (Broth of beef and free-range hen) — Beef and free-range hen broth (one search summary says 'only' these two; not confirmed). Capon broth is a common festive choice in Bologna.

**Method.** Brown the pork loin in butter, then mince it finely with the prosciutto crudo and mortadella. Mix in grated Parmigiano Reggiano, egg and nutmeg, and let the filling rest. Roll a thin yellow egg sfoglia, cut it into small squares, add a pinch of filling, fold into triangles and wrap around a finger into rings. Cook the tortellini for just a few minutes in a rich beef-and-hen broth and serve them in the broth.

**Authority sources** (kept by the sources lens):

- [Camera di Commercio di Bologna: document on the tortellino recipe (8 Feb 2023, PDF)](https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/2023/CameradiCommercioBologna08022023%20(1).pdf) (2023) — ✓ "Lombo di maiale, gr.300. Prosciutto crudo, gr. 300. Vera mortadella di Bologna, gr. 300." (Pork loin, 300 g. Prosciutto crudo, 300 g. Genuine mortadella di Bologna, 300 g.)
- [Visit Italy: Come preparare i tortellini, ricetta (registered 1974 recipe of the Dotta Confraternita del Tortellino)](https://www.visititaly.eu/it/cibo-e-sapori/come-preparare-i-tortellini-ricetta)
- [Linkiesta: I tortellini in brodo: la nascita, la leggenda, la ricetta](https://www.linkiesta.it/2020/12/i-tortellini-in-brodo-la-nascita-la-leggenda-la-ricetta/) (2020)
- [Bologna city heritage sheet: Tortellino bolognese (PDF)](https://assets.culturabologna.it/ab561e4b-e4a3-4787-acf7-b342c5431bba-2021-tortellino-bolognese.pdf) (2021)
- [Dissapore: Tortellini in brodo, la ricetta perfetta](https://www.dissapore.com/ricette/tortellini-in-brodo-la-ricetta-perfetta/)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Panna** (Cream) | ●●●●○ 4 | yes | The registered dish is tortellini cooked and served in meat broth. 'Tortellini alla panna', often with ham and peas, became a restaurant fashion in the late 20th century, and purists say the cream smothers the delicate pork, prosciutto and mortadella filling. | [visititaly.eu](https://www.visititaly.eu/it/cibo-e-sapori/come-preparare-i-tortellini-ricetta); [dissapore.com](https://www.dissapore.com/ricette/tortellini-in-brodo-la-ricetta-perfetta/) |
| **Pollo (al posto del maiale)** (Chicken (instead of pork)) | ●●●●○ 4 | yes | The registered filling is pork loin, prosciutto crudo and mortadella. In 2019 a pork-free chicken 'tortellino dell'accoglienza' (welcome tortellino) proposed for Bologna's San Petronio festival set off a national row over tradition. | [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/tortellino-di-pollo-la-storia-ricetta-originaria/) 2019; [scattidigusto.it](https://www.scattidigusto.it/tortellino-con-il-pollo-o-dellaccoglienza-la-ricetta-dellartusi) 2019 |
| **Dado o brodo vegetale** (Stock cube or vegetable broth) | ●●○○○ 2 | no | The traditional dish is served in a broth of beef and free-range hen. Stock cubes and vegetable broth are not part of it, even though the 2023 ragù recipe does allow a stock-cube broth. | [visititaly.eu](https://www.visititaly.eu/it/cibo-e-sapori/come-preparare-i-tortellini-ricetta); [linkiesta.it](https://www.linkiesta.it/2020/12/i-tortellini-in-brodo-la-nascita-la-leggenda-la-ricetta/) 2020 |
| **Ricotta e spinaci** (Ricotta and spinach filling) | ●●○○○ 2 | no | Tortellini have a meat filling. Ricotta and spinach is the filling of tortelloni, a larger and different Bolognese pasta usually served with butter and sage, and of many supermarket 'tortellini'. | [bo.camcom.gov.it](https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/2023/CameradiCommercioBologna08022023%20(1).pdf) 2023 |
| **Prosciutto cotto** (Cooked ham) | ●○○○○ 1 | yes | The registered filling uses raw prosciutto crudo. Cooked ham is the hallmark of the 'panna e prosciutto' cream sauce, not of the tortellino. | [bo.camcom.gov.it](https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/2023/CameradiCommercioBologna08022023%20(1).pdf) 2023 |
| **Salsa di pomodoro** (Tomato sauce) | ●○○○○ 1 | no | Tortellini are served in clear meat broth, and a plain tomato sauce hides the filling. | [linkiesta.it](https://www.linkiesta.it/2020/12/i-tortellini-in-brodo-la-nascita-la-leggenda-la-ricetta/) 2020 |

**Game lines** (shown when the intruder appears in this dish):

- *Cream*: "Bologna's registered tortellini swim in meat broth. Purists say cream smothers the filling."
- *Chicken (instead of pork)*: "The registered filling is pork loin, prosciutto and mortadella. A 2019 chicken version caused a row."
- *Stock cube or vegetable broth*: "Tortellini in brodo means a real broth of beef and hen, not a stock cube."
- *Ricotta and spinach filling*: "Ricotta and spinach fill tortelloni, a bigger, different pasta. Tortellini are filled with meat."
- *Cooked ham*: "The filling uses raw prosciutto crudo. Cooked ham belongs to the cream-sauce version."
- *Tomato sauce*: "Tortellini go in broth, or with meat ragù. A plain tomato sauce just hides the filling."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Cream*: This is Bologna's great 'in brodo o alla panna?' debate. Tortellini alla panna are still on many Bolognese menus and plenty of locals enjoy them, while purists and the confraternity tradition hold that tortellini belong in broth. The sources here show the broth rule, not a specific outrage episode.
- *Chicken (instead of pork)*: Defenders pointed to older recipes with poultry in stuffed pasta, including one linked to Pellegrino Artusi (Romagna cappelletti with capon breast, per the culinary lens; not re-checked), and Scatti di Gusto and Gambero Rosso traced a chicken tortellino to earlier sources. The modern registered tortellino has no chicken.
- *Cooked ham*: Cooked ham belongs to the 'panna e prosciutto' sauce, which is part of the same accepted-but-disputed cream tradition.
- *Tomato sauce*: A meat ragù is a genuine Emilian alternative to broth for 'dry' tortellini, but a plain tomato sauce is not.

**Fun facts and accepted details**

- The Dotta Confraternita del Tortellino, together with the Accademia Italiana della Cucina's Bologna delegation, deposited the recipe at the Bologna Chamber of Commerce on 7 December 1974.
- The registered dough of 10 eggs and 1 kg of flour makes about 1,000 tortellini.
- Legend says an innkeeper invented the tortellino's shape after peeking at Venus's navel.
- Bologna and Modena (Castelfranco Emilia) both claim the tortellino.
- Tortellini in broth cook in just a few minutes.
- Tortellini dressed with meat ragù ('asciutti') are an ACCEPTED Emilian option; tortellini alla panna are tolerated by many Bolognese but disputed by purists.
- Castelfranco Emilia, the town of the Venus's-navel legend, is in the province of Modena today but belonged to the province of Bologna until 1929 (culinary lens, general knowledge).

---

## Spaghetti alle vongole — *Spaghetti with clams*

**Origin:** Naples, Campania  
**Pasta / base:** Spaghetti (also vermicelli or linguine)  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** Naples on a plate: clams, olive oil, garlic, parsley and the sea's own juices clinging to spaghetti. No cheese, no cream, no butter.  
> **In-game method:** Warm garlic (and chili) in olive oil, add the clams with a splash of white wine and cover until they open. Keep and filter the liquid. Finish very al dente spaghetti in the pan with that juice until creamy from starch alone; add parsley off the heat.

### The proper recipe

- **Spaghetti** (Spaghetti) — Vermicelli or linguine are also used
- **Vongole veraci** (Fresh live clams (carpet-shell clams)) — Purged of sand in salted water first. Discard any that are open or broken before cooking. Some Neapolitan cooks also use the smaller lupini clams
- **Olio extravergine d'oliva** (Extra-virgin olive oil) — The only fat in the Neapolitan recipe
- **Aglio** (Garlic) — A clove or two, often removed after flavouring the oil
- **Prezzemolo** (Flat-leaf parsley) — Chopped finely and added at the end, off the heat
- **Peperoncino** (Chili pepper) — Optional
- **Vino bianco secco** (Dry white wine) — Optional. Many cooks use it to open the clams, others rely only on the clams' own liquid
- **Pomodorini** (Cherry tomatoes) — Optional 'red' variant. A few fresh cherry tomatoes are widely accepted, but the classic Neapolitan version is 'in bianco' (no tomato)

**Method.** Garlic (and chili) is warmed in olive oil, the clams go in (with a splash of white wine if used) and are covered until they open. The clams' liquid is kept, filtered if sandy. The spaghetti is drained very al dente and finished in the pan with the clam liquid and a little oil, tossed until it turns creamy from the starch alone. Parsley goes in at the end, off the heat.

**Authority sources** (kept by the sources lens):

- [In cucina: spaghetto a vongole (Italy Segreta)](https://italysegreta.com/it/in-cucina-spaghetto-a-vongole/) — Says that in Naples the dish, called 'spaghetto a vongole', is cooked strictly in bianco (without tomato).
- [Spaghetti alle vongole (Wikipedia)](https://en.wikipedia.org/wiki/Spaghetti_alle_vongole) — ✓ "in its area of origin this would be considered most unorthodox" (Said of the cream that some Italian-American recipes add. Quote checked against a search-engine excerpt only, not the live page.)
- [I 7 errori più frequenti che non vanno commessi quando si preparano gli spaghetti alle vongole (Centro Meteo Italiano / Il Messaggero network)](https://www.centrometeoitaliano.it/attualita/i-7-errori-piu-frequenti-che-non-vanno-commessi-quando-si-preparano-gli-spaghetti-alle-vongole-175750/) — Lists common mistakes: keeping clams that were open before cooking, overcooking them until rubbery, misusing the wine, throwing away the clam liquid, and cooking the parsley.
- [Spaghetti alle vongole, 4 errori da evitare se volete un piatto perfetto (Dissapore)](https://www.dissapore.com/cucina/spaghetti-alle-vongole-4-errori-da-evitare-se-volete-un-piatto-perfetto/) — Italian how-to guide on the classic method. Seen in search results only.

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Parmigiano / formaggio grattugiato** (Parmesan or other grated cheese) | ●●●●● 5 | yes | Italians widely follow an unwritten rule: no grated aged cheese such as Parmigiano or Pecorino on fish and shellfish pasta, because it covers the delicate taste of the clams. In a 2022 YouGov survey, Italians gave cheese on seafood pasta a net score of -39. Asking for cheese on spaghetti alle vongole is the classic tourist mistake in Italian restaurants. | [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/new-york-times-cacio-pepe-tonno/) ✓"quella di non condire con del formaggio, soprattutto stagionato come Pecorino o Parmigiano, un piatto che contenga del pesce"; [vincenzosplate.com](https://www.vincenzosplate.com/italian-food-mistakes-americans-make/) (chef: Vincenzo's Plate (Vincenzo Prosperi)) ✓"If you order spaghetti alle vongole in Italy and ask for cheese on top, your waiter will look at you with an expression you will not forget."; [foodie.com](https://www.foodie.com/1593411/mistakes-make-ordering-italian-food) ✓"Any seafood pastas with a cheese or cream-based sauce will be indicative of a non-authentic Italian restaurant."; [business.yougov.com](https://business.yougov.com/content/40810-italian-food-crimes) 2022; [ilfattoalimentare.it](https://ilfattoalimentare.it/formaggio-pere-pesce-funghi.html) ✓"non esiste quindi un tabù o tanto meno un divieto tradizionale italiano di associare il pesce al formaggio"; [scattidigusto.it](https://www.scattidigusto.it/2020/01/29/spaghetti-a-vongole-e-parmigiano-la-ricetta-della-tradizione-orrore) 2020; +6 more in JSON |
| **Burro** (Butter) | ●●●●○ 4 | yes | The Neapolitan recipe uses only extra-virgin olive oil. In December 2023 a famous TV chef and cooking-show judge posted spaghetti alle vongole finished with a knob of butter, and Italian social media erupted. Users said they would send the dish back. | [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2023/12/24/bruno-barbieri-cucina-gli-spaghetti-alle-vongole-con-il-burro-e-scoppia-il-putiferio-li-rimanderei-indietro-lui-non-me-ne-frega-niente/7393250/) 2023 (chef: Bruno Barbieri); [dissapore.com](https://www.dissapore.com/notizie/bruno-barbieri-mette-il-burro-negli-spaghetti-con-le-vongole-e-scatena-il-panico/) (chef: Bruno Barbieri); [scattidigusto.it](https://www.scattidigusto.it/2024/01/01/spaghetti-con-vongole-e-burro-cosa-non-va-nella-ricetta-di-barbieri/) 2024 (chef: Bruno Barbieri); [gamberorosso.it](https://www.gamberorosso.it/notizie/ecco-perche-la-ricetta-degli-spaghetti-con-le-vongole-al-burro-di-chef-barbieri-non-e-sbagliata/) (chef: Bruno Barbieri); [gamberorosso.it](https://www.gamberorosso.it/notizie/burro-vongole-barbieri-artusi/) (chef: Bruno Barbieri); [liberoquotidiano.it](https://www.liberoquotidiano.it/news/spettacoli/37947388/bruno-barbieri-mastechef-spaghetti-vongole-insulti/) (chef: Bruno Barbieri); +1 more in JSON |
| **Panna** (Cream) | ●●●○○ 3 | no | The creamy sauce in spaghetti alle vongole comes only from clam juice, olive oil and pasta starch tossed together in the pan. Dairy cream is an Italian-American or foreign addition that smothers the taste of the sea. | [en.wikipedia.org](https://en.wikipedia.org/wiki/Spaghetti_alle_vongole) ✓"in its area of origin this would be considered most unorthodox"; [foodie.com](https://www.foodie.com/1593411/mistakes-make-ordering-italian-food) ✓"Any seafood pastas with a cheese or cream-based sauce will be indicative of a non-authentic Italian restaurant."; [my-personaltrainer.it](https://www.my-personaltrainer.it/alimentazione/spaghetti-alle-vongole-cremosi-leggeri-e-sicuri-che-quasi-nessuno-prepara-nel-modo-giusto.html) |
| **Salsa di pomodoro / passata** (Tomato sauce or passata) | ●●○○○ 2 | yes | In Naples the classic is cooked 'in bianco', with no tomato. Italian how-to guides call a heavy tomato-sauce base a mistake: it is too acidic and hides the taste of the sea. | [italysegreta.com](https://italysegreta.com/it/in-cucina-spaghetto-a-vongole/); [blog.giallozafferano.it](https://blog.giallozafferano.it/alimentazionesalute/ricetta-spaghetti-alle-vongole-perfetti-gli-errori-piu-comuni-da-non-fare/); [dissapore.com](https://www.dissapore.com/cucina/vongole-7-errori-da-non-fare/); [dissapore.com](https://www.dissapore.com/grande-notizia/antonino-cannavacciuolo-spaghetti-alle-vongole-con-o-senza-pomodoro/) (chef: Antonino Cannavacciuolo) |

**Game lines** (shown when the intruder appears in this dish):

- *Parmesan or other grated cheese*: "No cheese on clams: in a YouGov poll Italians rated cheese on seafood pasta -39."
- *Butter*: "Neapolitan vongole use only olive oil. A TV chef's butter version in 2023 set Italy arguing."
- *Cream*: "The creaminess comes from clam juice, olive oil and pasta starch. Cream smothers the sea."
- *Tomato sauce or passata*: "Naples cooks vongole 'in bianco'. A few cherry tomatoes are fine; a heavy passata is not."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Parmesan or other grated cheese*: This is a custom, not a law. According to Scatti di Gusto and Gambero Rosso, Pellegrino Artusi's 19th-century recipe for spaghetti with telline (small clams) used butter and Parmigiano, but Artusi wrote from Florence, not Naples. Il Fatto Alimentare argues that Italy has no traditional ban on fish with cheese, only local habits, citing dishes such as Piedmont's razza al formaggio; the Parmigiano Reggiano consortium listed fish dishes where cheese works (2019). Even Vincenzo's Plate calls it a strong pattern rather than a strict law. For Neapolitan spaghetti alle vongole, though, the no-cheese rule is close to universal.
- *Butter*: Barbieri said in the video that purists would protest and he did not care. Gambero Rosso then ran 'Ecco perché la ricetta... al burro di chef Barbieri non è sbagliata' ('why it is not wrong'), pointing to Artusi's historical recipe with butter. Scatti di Gusto took the purist line. The debate is genuine, but butter is not part of the Neapolitan classic.
- *Tomato sauce or passata*: White versus red is a genuine Italian debate, not a consensus. A few fresh cherry tomatoes are a common, accepted variant, and Antonino Cannavacciuolo (two Michelin stars, MasterChef Italia judge) told the purists on Radio Deejay to add a little tomato if they like it. Only a heavy passata-style sauce draws complaints. In-game, do not treat cherry tomatoes as an enemy.

**Fun facts and accepted details**

- Naples has 'spaghetti con le vongole fujute' ('with the escaped clams'), a poor-man's version made with cherry tomatoes, garlic, chili and olive oil and no clams at all: the joke is that the clams ran away (Gambero Rosso: https://www.gamberorosso.it/notizie/ricette/napoli-spaghetti-vongole-fuggite/). A popular blog credits Eduardo De Filippo with inventing it, but that story is folklore.
- In Naples the dish is often called 'spaghetto a vongole' and is cooked strictly in bianco.
- Accepted surprise: Antonino Cannavacciuolo makes a creamy version with a sweet garlic sauce whose secret is milk. That is a chef's twist, not the classic (https://www.centrometeoitaliano.it/attualita/spaghetti-alle-vongole-di-antonino-cannavacciuolo-il-segreto-per-farli-cremosi-la-ricetta-173794/).
- Pellegrino Artusi's 1891 cookbook, written in Florence rather than Naples, has spaghetti with telline (small clams) made with a soffritto of garlic, onion, celery and parsley, dried mushrooms, then butter and Parmigiano: very far from today's Neapolitan dish (per Scatti di Gusto, 2020, and Gambero Rosso; soffritto detail checked against a search excerpt by the sources lens).
- Technique sins (out of scope as enemies): keeping clams that were already open before cooking, overcooking them until rubbery, throwing away the clam liquid, cooking the parsley.
- Italians' YouGov score for cheese on seafood pasta (-39) is much milder than for ketchup on pasta (-82): a strong rule, not a national scandal.

---

## Spaghetti aglio, olio e peperoncino — *Spaghetti with garlic, oil and chili*

**Origin:** Naples, Campania ('aglio e uoglie'); also claimed by Rome/Lazio and other regions  
**Pasta / base:** Spaghetti (also vermicelli)  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** The midnight spaghetti of every Italian home: garlic, olive oil and chili, emulsified with pasta water. Simple, fast and easy to ruin.  
> **In-game method:** Warm sliced garlic and chili slowly in plenty of olive oil until the garlic is just golden, never burnt. Finish al dente spaghetti in the pan with a ladle of pasta water, tossing until oil and starch turn glossy. Parsley at the end if you like.

### The proper recipe

- **Spaghetti** (Spaghetti) — Or vermicelli
- **Aglio** (Garlic) — Sliced or crushed, gently golden, never burnt. Some cooks remove it
- **Olio extravergine d'oliva** (Extra-virgin olive oil) — Italians argue over which oil. Many prefer a mild one that does not dominate
- **Peperoncino** (Chili pepper (dried or fresh)) — The only 'spice'
- **Sale** (Salt) — Mostly in the pasta water
- **Prezzemolo** (Flat-leaf parsley) — Optional and debated. Many recipes add it at the end, some purists leave it out
- **Acqua di cottura** (Starchy pasta cooking water) — Emulsifies with the oil into a light, glossy coating

**Method.** Garlic and chili are warmed slowly in plenty of extra-virgin olive oil until the garlic is just golden. The spaghetti is drained al dente and finished in the pan with a ladle of pasta water, tossed until oil and starch form a light emulsion (Max Mariola stresses a long final toss). Chopped parsley, if used, goes in at the end.

**Authority sources** (kept by the sources lens):

- [La ricetta della pasta aglio olio e peperoncino secondo Max Mariola (Gambero Rosso)](https://www.gamberorosso.it/notizie/ricette/la-ricetta-della-pasta-aglio-olio-e-peperoncino-secondo-max-mariola/) (2019) — Roman chef and social-media star Max Mariola's version: pasta half-cooked then finished in the pan with oil, garlic (removed once golden), parsley and chili, with a long final toss. No cheese or breadcrumbs mentioned.
- [Spaghetti aglio olio e peperoncino (Ricette dal Mondo)](https://www.ricettedalmondo.it/spaghetti-aglio-olio-e-peperoncino.html) — Says several regions claim the dish but the most reliable sources trace it to Naples ('aglio e uoglie').
- [Spaghetti aglio olio e peperoncino: la ricetta perfetta (Dissapore)](https://www.dissapore.com/ricette/spaghetti-aglio-olio-e-peperoncino-la-ricetta-perfetta/) — Italian reference recipe. Seen in search results only.
- [Spaghetti aglio, olio e peperoncino (Turismo Roma, City of Rome tourism site)](https://www.turismoroma.it/de/page/spaghetti-aglio-olio-e-peperoncino-0) — Rome's official tourism site has a page on the dish (German edition). Seen in search results only.

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Parmigiano / formaggio grattugiato** (Parmesan or other grated cheese) | ●●●○○ 3 | yes | The traditional recipe has no cheese at all: garlic, oil and chili are the whole sauce. When a major American newspaper published a 'midnight pasta' version topped with Parmigiano and black pepper in January 2024, Italian food media covered it as a scandal. | [gamberorosso.it](https://www.gamberorosso.it/notizie/omaggio-del-new-york-times-aglio-olio-e-peperoncino-formaggio/) 2024; [affaritaliani.it](https://www.affaritaliani.it/food/il-new-york-times-omaggia-la-pasta-aglio-olio-peperoncino-ma-rovina-tutto-894015.html) 2024; [gamberorosso.it](https://www.gamberorosso.it/notizie/aglio-olio-peperoncino-new-york-times/) 2024; [scattidigusto.it](https://www.scattidigusto.it/spaghetti-aglio-olio-peperoncino-marco-meschini) |
| **Pollo** (Chicken)*(added by culinary lens)* | ●●○○○ 2 | no | In an Italian meal pasta is the first course and chicken a main course, so chicken on pasta is one of the best-known Italian complaints about foreign 'Italian' food. 'Chicken aglio e olio', common in foreign meal kits and restaurants, turns a dish of garlic, oil and chili into something else. | [hellofresh.com](https://www.hellofresh.com/recipes/creamy-aglio-e-olio-chicken-pasta-62c47eafc5b702e7c00cd6fc); [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cronaca-italia/spaghetti-e-cappuccino-basta-a-fontana-di-trevi-attivisti-della-pasta-3543489) 2023; [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/blitztv/pasta-al-pollo-cremoso-la-ricetta-di-tasty-fa-infuriare-gli-italiani-video-2627595) |
| **Pepe nero** (Black pepper) | ●●○○○ 2 | yes | The heat in this dish comes from chili (peperoncino), not black pepper. Italian food media listed black pepper among the departures in an American newspaper's version of the dish. | [gamberorosso.it](https://www.gamberorosso.it/notizie/omaggio-del-new-york-times-aglio-olio-e-peperoncino-formaggio/) 2024; [affaritaliani.it](https://www.affaritaliani.it/food/il-new-york-times-omaggia-la-pasta-aglio-olio-peperoncino-ma-rovina-tutto-894015.html) 2024; [blogsicilia.it](https://www.blogsicilia.it/palermo/aglio-e-olio-spaghettata-chef-sapore-delle-vongole-fuggite/571947/) |
| **Burro** (Butter) | ●○○○○ 1 | yes | Aglio e olio means garlic and OIL: olive oil, emulsified with pasta water, is the whole sauce. A famous TV chef's 'unconventional' version with butter and lardo drew comments that it was too heavy. | [gamberorosso.it](https://www.gamberorosso.it/attualita/spaghetto-aglio-olio-peperoncino-bruno-barbieri/) 2025 (chef: Bruno Barbieri); [liberoquotidiano.it](https://www.liberoquotidiano.it/news/spettacoli/37963399/bruno-barbieri-rissa-burro-spago-vongole-chef-ride/) (chef: Bruno Barbieri) |
| **Panna** (Cream)*(kept by culinary lens only (sources lens removed it))* | ●○○○○ 1 | no | The dish's only 'creaminess' is olive oil emulsified with starchy pasta water. Foreign 'creamy aglio e olio' recipes that add cream turn it into a different sauce. | [hellofresh.com](https://www.hellofresh.com/recipes/creamy-aglio-e-olio-chicken-pasta-62c47eafc5b702e7c00cd6fc); [kvalifood.com](https://kvalifood.com/posts/aglio-e-olio/) |

**Game lines** (shown when the intruder appears in this dish):

- *Parmesan or other grated cheese*: "Garlic, oil and chili are the whole sauce. A cheese-topped US version in 2024 was covered as a scandal."
- *Chicken*: "In Italy pasta is the first course and chicken the second. 'Chicken aglio e olio' is not Italian."
- *Black pepper*: "The heat in aglio, olio e peperoncino comes from chili, not black pepper."
- *Butter*: "Aglio e olio means garlic and OIL. Butter turns it into a chef's experiment."
- *Cream*: "Its only 'cream' is olive oil emulsified with pasta water. Real cream makes a different dish."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Parmesan or other grated cheese*: Gambero Rosso itself argued the NYT dish was fine and the real problem was the name. Some Roman variants (e.g. 'alla carrettiera') accept cheese, usually Pecorino, and a chef interviewed by Scatti di Gusto defends a Pecorino version. Parmigiano on the classic Neapolitan version is still widely rejected.
- *Black pepper*: A minor complaint. Some Italian home recipes do list 'sale e pepe' (salt and pepper).
- *Butter*: Barbieri presents it openly as a chef's reinterpretation, not a traditional recipe.
- *Cream*: Thin evidence. The sources lens removed this intruder because its only evidence was a meal-kit product page and an English-language blog, with no Italian complaint. Kept per the culinary lens as a plausible foreign habit, at the lowest popularity.

**Fun facts and accepted details**

- In Italy it is the classic 'spaghettata di mezzanotte' (midnight spaghetti) cooked after a night out, which is where the NYT got its name.
- Dissapore lists it among the 'things humans fight about': which oil to use, how hot, and whether garlic, oil and chili should first marinate raw for a day without any cooking (https://www.dissapore.com/grande-notizia/cose-per-cui-litigano-gli-umani-spaghetti-aglio-olio-e-peperoncino/).
- Accepted variants, not intruders: anchovies (spaghetti aglio, olio e alici) and toasted breadcrumbs are classic southern additions, and Pecorino appears in some Naples and Rome versions.
- Antonino Cannavacciuolo's trick is a garlic 'pomata' (paste) (https://www.blogsicilia.it/food-drink/aglio-e-olio-alla-cannavacciuolo-il-segreto-della-spaghettata-e-nella-pomata-allaglio/692736/).
- Technique sin (out of scope): burnt garlic, which turns the oil bitter.

---

## Spaghetti alla puttanesca — *Spaghetti puttanesca*

**Origin:** Campania (Naples / Ischia); a Roman/Lazio version adds anchovies  
**Pasta / base:** Spaghetti or vermicelli (also linguine)  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** A bold Campanian pantry pasta: tomato, Gaeta olives, capers, garlic and chili, with anchovies in many versions. Salty enough to skip the cheese.  
> **In-game method:** Warm garlic and chili in olive oil, melting in anchovies if used. Add tomatoes and cook briefly, then Gaeta olives and rinsed capers. Taste before salting. Toss spaghetti in the sauce with a little pasta water and finish with chopped parsley.

### The proper recipe

- **Spaghetti / vermicelli** (Spaghetti or vermicelli)
- **Pomodori pelati o pomodorini** (Peeled tomatoes or cherry tomatoes)
- **Olive nere di Gaeta** (Gaeta black olives) — The original choice (Gaeta is in southern Lazio, historically part of the Kingdom of Naples). Taggiasca or other cured black olives are accepted substitutes
- **Capperi sotto sale** (Salt-packed capers) — Rinsed well before use
- **Aglio** (Garlic)
- **Olio extravergine d'oliva** (Extra-virgin olive oil)
- **Peperoncino** (Chili pepper)
- **Prezzemolo (o origano)** (Parsley (or oregano)) — Parsley is the most common finish; oregano also appears in Italian recipes
- **Acciughe / alici sotto sale** (Salted anchovies) — Optional and debated. Some recipe sites say the Neapolitan original uses only olives and capers and the Roman version adds anchovies, but that split rests on recipe blogs. An 1844 Neapolitan recipe already pairs vermicelli with olives, capers and salted anchovies, and many Neapolitan versions use them.

**Method.** Garlic and chili (and anchovies, if used, melted in) are warmed in olive oil. The tomatoes cook briefly, then Gaeta olives and rinsed capers go in. Taste before salting, because olives, capers and anchovies are already salty. The spaghetti is tossed in the sauce with a little cooking water so it stays glossy and soft, and is finished with chopped parsley.

**Authority sources** (kept by the sources lens):

- [The history of Spaghetti alla Puttanesca and where to eat it in Naples (Gambero Rosso International)](https://www.gamberorossointernational.com/news/the-history-of-spaghetti-alla-puttanesca-and-where-to-eat-it-in-naples) — Traces the popular origin to Sandro Petti (Roman-born, Ischian by adoption, died in 2022 aged 95) on Ischia in the 1950s.
- [Spaghetti alla Puttanesca (Ricette dal Mondo)](https://www.ricettedalmondo.it/spaghetti-alla-puttanesca.html) — ✓ "la ricetta originale napoletana prevede solo l'utilizzo di olive e capperi, quella romana aggiunge le alici" (the original Neapolitan recipe uses only olives and capers; the Roman one adds anchovies. A recipe site's claim with no historical source given. Quote checked against a search-engine excerpt only.)
- [Spaghetti alla puttanesca (Tavolartegusto)](https://www.tavolartegusto.it/ricetta/spaghetti-alla-puttanesca-pasta-alla-puttanesca) — Builds the classic on garlic, oil, tomato, Gaeta olives, salted capers and chili.
- [Ricetta Spaghetti alla puttanesca, Cucinare alla napoletana (Napolike)](https://www.napolike.it/ricetta-spaghetti-alla-puttanesca) — Neapolitan recipe site. Seen in search results only; its content was not confirmed.
- [Spaghetti alla puttanesca (Wikipedia)](https://wikipedia.com/wiki/Puttanesca) — Lists tomatoes, olive oil, olives, anchovies, chili, capers and garlic. Links a recipe on the Accademia Italiana della Cucina site, which was not checked directly.

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Parmigiano / formaggio grattugiato** (Parmesan or other grated cheese) | ●●○○○ 2 | yes | Puttanesca is already very salty and savoury from olives, capers and often anchovies, so it is traditionally served without grated cheese. The anchovies also put it under the Italian habit of no cheese on fish. | [the-pasta-project.com](https://www.the-pasta-project.com/spaghetti-alla-puttanesca/); [recipetineats.com](https://www.recipetineats.com/spaghetti-alla-puttanesca/); [scattidigusto.it](https://www.scattidigusto.it/spaghettoni-alla-puttanesca-la-ricetta-di-rose-salo) |
| **Olive nere snocciolate in scatola** (Canned pre-pitted black olives)*(kept by culinary lens only (sources lens removed it))* | ●○○○○ 1 | no | The sauce is built on cured Gaeta black olives. Neapolitan cooks warn against pre-pitted jarred or canned olives, which have lost their flavour. | [napolike.it](https://www.napolike.it/ricetta-spaghetti-alla-puttanesca) |

**Game lines** (shown when the intruder appears in this dish):

- *Parmesan or other grated cheese*: "Olives, capers and often anchovies bring the salt. Puttanesca is traditionally served without cheese."
- *Canned pre-pitted black olives*: "Puttanesca is built on cured Gaeta olives. Tasteless pre-pitted canned ones do not cut it."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Parmesan or other grated cheese*: A softer rule than for clam pasta. Some Italian recipes list grated cheese as optional, and a chef's version on Scatti di Gusto tops it with grated ricotta, calling it a 'bastard' but tasty variant. Versions without anchovies have no fish at all.
- *Canned pre-pitted black olives*: Weak. The sources lens removed this item: the excerpt behind it could not be tied to the cited Napolike page, and it is a quality complaint rather than a foreign ingredient. Kept per the culinary lens at the lowest popularity; use as filler only.

**Fun facts and accepted details**

- One Neapolitan-style recipe blog nicknames the sauce 'aulive e chiapparielle' (olives and capers).
- The Touring Club Italiano's 1931 gastronomic guide lists a similar Campanian dish as 'maccheroni alla marinara'. In Campania 'marinara' could include fish, often anchovies.
- A source cited in search results quotes an 1844 recipe for 'vermicelli all'oglio con olive capperi ed alici salse' (with olives, capers and salted anchovies), commonly attributed to the Neapolitan cook Ippolito Cavalcanti. If so, anchovies were in the dish's ancestor long before the name 'puttanesca' (source page not identified).
- Accepted, not intruders: anchovies (Roman and many Neapolitan versions), oregano instead of parsley, and Taggiasca or Kalamata olives when Gaeta olives are unavailable. A tuna version is a known home variant.
- Technique tip: never salt before tasting, because olives, capers and anchovies already bring the salt.

---

## Pasta alla Norma — *Pasta alla Norma (with fried eggplant and ricotta salata)*

**Origin:** Catania, Sicily  
**Pasta / base:** Short pasta (maccheroni, rigatoni, penne) or spaghetti  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** Catania's tribute to Bellini's opera: tomato sauce, fried eggplant, basil and a snowfall of grated ricotta salata. Light, bright, never baked.  
> **In-game method:** Cut eggplant and fry it in plenty of oil until golden. Make a quick tomato sauce, often with a garlic clove and basil. Dress the pasta, top with the fried eggplant and fresh basil, then grate over plenty of ricotta salata. Do not bake it.

### The proper recipe

- **Maccheroni / rigatoni / spaghetti** (Short pasta or spaghetti) — Short shapes hold the sauce and ricotta. Spaghetti are also traditional in Catania
- **Pomodoro fresco (costoluto) o passata** (Fresh tomatoes (e.g. Catania's ribbed costoluto) or passata) — A simple tomato sauce
- **Melanzane (violetta), fritte** (Eggplant (purple 'violetta' type), fried) — Fried in plenty of oil, not grilled. Italian guides argue over the cut; Dissapore insists on slices
- **Ricotta salata** (Ricotta salata (salted, aged ricotta)) — Grated. Aged at least about two months. Usually sheep's milk or mixed
- **Basilico** (Fresh basil)
- **Olio extravergine d'oliva** (Extra-virgin olive oil) — Also for frying the eggplant
- **Aglio** (Garlic) — Optional. A whole clove in the sauce is common; some use none

**Method.** Eggplant is cut and fried in plenty of oil until golden. A quick tomato sauce is made, often with a garlic clove and basil. The pasta is dressed with the sauce, topped with the fried eggplant and fresh basil, and finished with plenty of grated ricotta salata, often with extra ricotta and a grater at the table. It is not baked.

**Authority sources** (kept by the sources lens):

- [Pasta alla Norma, la ricetta originale catanese con violette e pomodoro costoluto (Dissapore)](https://www.dissapore.com/ricette/pasta-alla-norma-ricetta-originale/) — Original Catania recipe with Costoluto tomatoes and Violetta eggplant.
- [Pasta alla Norma: 5 errori da non fare (Dissapore)](https://www.dissapore.com/ricette/pasta-alla-norma-5-errori-da-non-fare/) — Mistakes: generic ricotta instead of aged ricotta salata, eggplant cut in cubes or rounds instead of slices, grilled instead of fried eggplant.
- [Pasta alla Norma: non avrete altra ricetta all'infuori dell'originale (Scatti di Gusto)](https://www.scattidigusto.it/2020/07/31/pasta-alla-norma-non-avrete-altra-ricetta-allinfuori-delloriginale) (2020) — Thou shalt have no other recipe but the original.
- [Pasta alla Norma (Wikipedia)](https://en.wikipedia.org/wiki/Pasta_alla_Norma) — Pasta with tomato sauce, fried eggplant and grated ricotta salata, linked to Catania and Bellini's opera Norma.
- [Ricetta della pasta alla Norma (Palermomania)](https://palermomania.it/news/ricette-culinarie/ricetta-della-pasta-alla-norma-94636.html) — The original uses only ricotta salata and is not baked.

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Mozzarella** (Mozzarella) | ●●●○○ 3 | no | Norma is a light, unbaked pasta finished with grated ricotta salata. Melted mozzarella belongs to a different Sicilian dish, the baked 'pasta alla siciliana' gratin. Catanese purists say any cheese substitute betrays the dish. | [foodinfo.it](https://foodinfo.it/?p=2902) ✓"Tutte le alternative, come ricotta infornata, mozzarella, parmigiano, prendono le distanze e fanno rabbrividire i puristi di questo piatto."; [dissapore.com](https://www.dissapore.com/ricette/pasta-siciliana-al-forno/); [ricettedisicilia.net](https://www.ricettedisicilia.net/recipes-in-english/pasta-alla-norma-with-aubergines-and-tomato/) |
| **Ricotta fresca** (Fresh ricotta) | ●●●○○ 3 | no | Norma needs ricotta salata: salted, pressed and aged until it can be grated. Soft fresh ricotta is a different cheese, and Italian 'mistakes' guides list it as an error. | [dissapore.com](https://www.dissapore.com/ricette/pasta-alla-norma-5-errori-da-non-fare/) |
| **Parmigiano** (Parmesan) | ●●○○○ 2 | yes | The cheese of pasta alla Norma is grated ricotta salata. Swapping in Parmigiano makes a good dish but, Italian recipe writers note, no longer the traditional Norma. | [foodinfo.it](https://foodinfo.it/?p=2902) ✓"Tutte le alternative, come ricotta infornata, mozzarella, parmigiano, prendono le distanze e fanno rabbrividire i puristi di questo piatto."; [blog.giallozafferano.it](https://blog.giallozafferano.it/renatabriano/ricetta-pasta-alla-norma-la-ricetta-originale-siciliana-con-melanzane-fritte/) |
| **Cipolla** (Onion) | ●○○○○ 1 | yes | Many Sicilian recipes say the original Norma sauce has no onion, only tomato with garlic and basil. | [blog.giallozafferano.it](https://blog.giallozafferano.it/dulcisinforno/pasta-alla-norma-ricetta-originale-siciliana/) ✓"La versione originale non prevede la cipolla"; [scattidigusto.it](https://www.scattidigusto.it/pasta-alla-norma-non-avrete-altra-ricetta-allinfuori-delloriginale) 2020 |
| **Ricotta infornata** (Baked ricotta) | ●○○○○ 1 | yes | Catania's Norma uses salted, aged ricotta. Baked ricotta, which is sweeter, is one of the alternatives Catanese purists reject. | [foodinfo.it](https://foodinfo.it/?p=2902) ✓"Tutte le alternative, come ricotta infornata, mozzarella, parmigiano, prendono le distanze e fanno rabbrividire i puristi di questo piatto."; [scattidigusto.it](https://www.scattidigusto.it/pasta-alla-norma/) |

**Game lines** (shown when the intruder appears in this dish):

- *Mozzarella*: "Norma is unbaked and finished with grated ricotta salata. Melted mozzarella is another Sicilian dish."
- *Fresh ricotta*: "Norma needs ricotta salata, aged and grated. Soft fresh ricotta is a different cheese."
- *Parmesan*: "Norma's cheese is ricotta salata. Parmigiano is a fallback, not the Catania classic."
- *Onion*: "Many Sicilian recipes say the original Norma sauce has no onion: just tomato, garlic and basil."
- *Baked ricotta*: "Catania grates salted ricotta. Baked ricotta is Messina's own Norma: a rival, not a crime."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Parmesan*: Parmigiano or Pecorino is widely accepted as a fallback when ricotta salata cannot be found, especially outside Sicily. Purists still reject it.
- *Onion*: Home cooks genuinely split: some use garlic, some onion, some only tomato. Even the Giallo Zafferano blogger who says the original has no onion uses it in her own version.
- *Baked ricotta*: A legitimate regional variant: in the Messina area Norma is traditionally made with ricotta infornata. Do not mock it as a crime in-game.

**Fun facts and accepted details**

- Legend says playwright Nino Martoglio tasted the dish and exclaimed 'Signura Saridda, chista è 'na vera Norma!' ('this is a true Norma'), comparing it to Catania-born Vincenzo Bellini's opera. Wikipedia notes the name is not attested until decades after Bellini's death, and a scholarly paper notes that 'pari 'na Norma' was a local expression of enthusiasm.
- Italy has a national Pasta alla Norma Day on 23 September, the anniversary of Bellini's death. La Sicilia says the Ministry of Agriculture established it 'five years ago' in a 2026 report, so around 2021.
- Technique sins (out of scope as enemies): grilling the eggplant instead of frying it (Dissapore explicitly rejects the 'healthy' grilled version), cutting it into cubes or rounds, and baking the pasta.
- Accepted: Pecorino as a fallback cheese, short pasta or spaghetti, a garlic clove in the sauce, and ricotta infornata in the Messina area.

---

## Spaghetti al pomodoro — *Spaghetti with tomato sauce*

**Origin:** Southern Italy (Naples / Campania), now eaten everywhere in Italy  
**Pasta / base:** Spaghetti (any shape works)  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** Italy's everyday classic: good tomatoes, olive oil, garlic or onion, and basil. So simple that every shortcut shows.  
> **In-game method:** Soften garlic or onion (or chili) in olive oil, add the tomatoes and cook them down briefly, then salt. Finish al dente spaghetti in the pan with the sauce and a little pasta water. Add fresh basil off the heat; grated cheese at the table is optional.

### The proper recipe

- **Spaghetti** (Spaghetti)
- **Pomodori (freschi, pelati San Marzano o passata)** (Tomatoes (ripe fresh, peeled San Marzano, or passata)) — Quality matters most. Dissapore says taste them first, and use bland or mealy tomatoes for something else
- **Olio extravergine d'oliva** (Extra-virgin olive oil)
- **Aglio o cipolla** (Garlic or onion) — Free choice. Garlic, onion, spring onion or chili are all accepted bases
- **Basilico** (Fresh basil) — Added at the end, off the heat
- **Sale** (Salt)
- **Peperoncino** (Chili) — Optional
- **Parmigiano Reggiano o pecorino** (Parmesan or pecorino) — Optional and fully accepted. Some prefer it plain to taste the tomato

**Method.** Garlic or onion (or chili) is softened in olive oil, the tomatoes go in and cook down briefly into a sauce, and the sauce is salted. The spaghetti is drained al dente and finished in the pan with the sauce and a little pasta water (mantecatura). Fresh basil goes in off the heat. Grated cheese at the table is optional.

**Authority sources** (kept by the sources lens):

- [Sughi di pomodoro sciuè sciuè: 5 errori che facciamo spesso (Dissapore)](https://www.dissapore.com/grande-notizia/sughi-al-pomodoro-veloci-5-errori/) — ✓ "fate appassire nell'olio quel che preferite fra cipolla, cipollotto, aglio, peperoncino" (soften in the oil whichever you prefer among onion, spring onion, garlic, chili. Quote checked against a search-engine excerpt only.)
- [La ricetta perfetta dello chef: spaghetti alla Don Alfonso (Scatti di Gusto)](https://www.scattidigusto.it/la-ricetta-perfetta-dello-chef-spaghetti-alla-don-alfonso) (2014) — Starred Sorrento-coast restaurant Don Alfonso's tomato spaghetti, finished with julienned basil.
- [Spaghetti al pomodoro (Giallo Zafferano blog, Amici in cucina)](https://blog.giallozafferano.it/amicincucina/spaghetti-al-pomodoro/) — Garlic in oil as the base (shallot as an alternative), finished in the pan with sauce and a little pasta water. The search excerpt credited this to 'a Giallo Zafferano recipe' and did not confirm which of two blog posts.

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Ketchup** (Ketchup) | ●●●●● 5 | no | Ketchup is a sweetened, vinegared industrial sauce, not a tomato sauce. In a 17-country YouGov survey, Italians rated ketchup on pasta the single worst crime against Italian food (net score -82), worse even than starting pasta in cold water. | [business.yougov.com](https://business.yougov.com/content/40810-italian-food-crimes) 2022; [yougov.com](https://yougov.com/en-us/articles/40810-italian-food-crimes) 2022; [dissapore.com](https://www.dissapore.com/notizie/pasta-con-il-ketchup-per-gli-italiani-e-il-crimine-alimentare-piu-grave) 2022; [finedininglovers.com](https://www.finedininglovers.com/explore/articles/survey-finds-most-offensive-crimes-against-italian-food) 2022; [yougov.co.uk](https://yougov.co.uk/international/articles/40810-italian-food-crimes) 2022; [finedininglovers.com](https://www.finedininglovers.com/index%2Ephp/explore/articles/survey-finds-most-offensive-crimes-against-italian-food) 2022; +1 more in JSON |
| **Zucchero** (Sugar) | ●●●●○ 4 | yes | Many Italian chefs say a good tomato sauce needs no sugar. On Italy's best-known TV cooking contest, two star chef-judges reacted with mock horror when a contestant wanted sugar in her tomato sauce; one called it 'improponibile' (unacceptable). Chemists also point out that sugar only masks acidity and does not change the pH. | [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2022/01/14/masterchef-2021-lo-zucchero-nella-salsa-di-pomodoro-per-cannavacciuolo-e-improponibile-e-reagisce-cosi-video/6455970/) 2022 (chef: Antonino Cannavacciuolo) ✓"Per Cannavacciuolo è improponibile"; [trend-online.com](https://www.trend-online.com/food/salsa-di-pomodoro-acida-zucchero/) ✓"l'Anticristo"; [fanpage.it](https://www.fanpage.it/napoli/zucchero-ragu-napoletano-cannavacciuolo-masterchef/) (chef: Antonino Cannavacciuolo); [greenme.it](https://www.greenme.it/salute-e-alimentazione/ricette/zucchero-salsa-pomodoro-va-o-no/); [lasicilia.it](https://www.lasicilia.it/video/la-sicilia-tv/3076004/la-pasta-alla-norma-al-senato-il-presidente-la-russa-svela-il-segreto-della-sua-ricetta.html) 2026 |
| **Polpette** (Meatballs (piled on the spaghetti))*(added by culinary lens)* | ●●○○○ 2 | yes | Spaghetti and meatballs is an Italian-American dish. In Italy meatballs (polpette) are a second course eaten on their own; the tomato sauce they cook in may dress the pasta, but big meatballs are not served on top of the spaghetti. | [tastingtable.com](https://www.tastingtable.com/1190751/why-you-shouldnt-expect-to-find-spaghetti-and-meatballs-in-italy) |
| **Pollo** (Chicken)*(sweep only (not reviewed by the checker lenses))* | ●●○○○ 2 | no | In an Italian meal pasta is the first course and chicken the second. A sign at a 2023 Trevi Fountain protest against foreign 'food crimes' said putting chicken on pasta is a crime in Italy. | [italianismo.com.br](https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/) 2023 |

**Game lines** (shown when the intruder appears in this dish):

- *Ketchup*: "Italians in a YouGov poll rated ketchup on pasta the worst food crime of all: -82."
- *Sugar*: "Good tomatoes need no sugar, say Italian chefs. A TV judge called a sweetened sauce 'improponibile'."
- *Meatballs (piled on the spaghetti)*: "In Italy meatballs are a second course. Spaghetti and meatballs is Italian-American."
- *Chicken*: "A 2023 Trevi Fountain protest sign said it plainly: chicken on pasta is a crime in Italy."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Sugar*: A real Italian debate. A pinch of sugar against acidic tomatoes is a widespread home habit: Senate President Ignazio La Russa called it the secret of his pasta alla Norma in 2026. TV cook Irina Steccanella called sugar in tomato sauce 'l'Anticristo' (the Antichrist). Baking soda is the other disputed fix.
- *Meatballs (piled on the spaghetti)*: Italy does have pasta with tiny meatballs, such as Abruzzo's chitarra con le pallottine. The complaint is about the big American-style meatballs on a plate of spaghetti, which Italians call a tourist-trap dish.
- *Chicken*: Sweep-only evidence (popular-posts sweep), not reviewed by the checker lenses. The protest targets chicken on pasta in general, not this dish specifically.

**Fun facts and accepted details**

- In the same YouGov survey, people in 11 of the 17 markets said ketchup on pasta was fine, led by Hong Kong (+79) and Indonesia (+76).
- Japan's 'Spaghetti Napolitan' is ketchup spaghetti, created by chef Shigetada Irie in Yokohama, reportedly inspired by food served to American troops.
- Garlic versus onion is a free choice in Italy, not a crime: Dissapore lists onion, spring onion, garlic or chili as equally valid bases.
- Parmigiano on spaghetti al pomodoro is perfectly accepted in Italy, unlike on seafood pasta.
- Accepted fixes for acidic tomatoes that Italians suggest instead of sugar: a tiny pinch of baking soda (itself debated), a grated carrot, a potato cooked in the sauce, or simply better tomatoes.
- Other YouGov 'crimes' are about technique or serving, not ingredients: pasta as a side dish (-55), not salting the water (-17) and garlic bread with pasta (-14) (popular-posts sweep).
- Americans also reject ketchup on pasta (-48), one of the few items on YouGov's list they agree with Italians about (popular-posts sweep).

---

## Pizza Margherita — *Margherita pizza*

**Origin:** Naples, Campania. Tradition dates it to June 1889 and Queen Margherita of Savoy, with toppings in the colours of the Italian flag. Treat that date as legend: tomato-mozzarella-basil pizzas existed earlier.  
**Pasta / base:** Neapolitan dough of wheat flour, water, salt and brewer's yeast (the AVPN also allows a natural starter). It is stretched by hand, never with a rolling pin or press, into a soft disc no wider than 35 cm with a raised rim (cornicione), then baked 60-90 s in a wood-fired oven at about 485 °C (EU STG figures).  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** Naples' red, white and green icon, protected as an EU STG: raw tomato, mozzarella or fior di latte, basil and olive oil on hand-stretched dough.  
> **In-game method:** Stretch the dough by hand into a disc no wider than 35 cm with a puffy rim. Spread raw crushed tomatoes, add torn fior di latte or buffalo mozzarella, a few basil leaves and olive oil. Bake 60-90 seconds in a wood-fired oven at about 485 °C.

### The proper recipe

- **Pomodori pelati (o pomodorini freschi)** (Peeled tomatoes, crushed raw (or fresh cherry tomatoes)) — The EU STG lists peeled tomatoes and/or fresh cherry tomatoes. The tomato goes on raw and cooks in the oven; it is not a pre-cooked sauce.
- **Mozzarella STG / Fior di latte** (Cow's-milk mozzarella (Mozzarella STG or fior di latte)) — The EU STG names Mozzarella STG; the AVPN rules say 'mozzarella or fior di latte'. Torn or cut into strips. Many Neapolitan pizzaioli prefer fior di latte because it is drier.
- **Mozzarella di Bufala Campana DOP** (Buffalo mozzarella (DOP)) — Optional alternative, listed in the EU STG. With buffalo mozzarella the pizza is often called a 'bufalina'.
- **Basilico fresco** (Fresh basil leaves) — Fresh, not dried.
- **Olio extravergine d'oliva** (Extra virgin olive oil) — The STG requires extra virgin.
- **Sale** (Salt)
- **Formaggio grattugiato (Parmigiano / pecorino)** (Grated hard cheese) — OPTIONAL and ACCEPTED: the AVPN rules list 'grated cheese' on the Margherita. It is not in the EU STG ingredient list. Do not mock it.

**Method.** Leavened dough of flour, water, salt and yeast is stretched by hand into a thin disc with a puffy rim. Raw crushed peeled tomatoes go in the centre, then pieces of fior di latte or buffalo mozzarella, a few fresh basil leaves and a drizzle of extra virgin olive oil; the AVPN rules also allow a sprinkle of grated hard cheese. It bakes for about 60-90 seconds in a very hot wood-fired oven and comes out soft enough to fold.

**Authority sources** (kept by the sources lens):

- [AVPN (Associazione Verace Pizza Napoletana) International Regulations 2024 (English)](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) (2024) — Summary: the AVPN rules define the Marinara as tomato, oil, oregano and garlic, and the Margherita as tomato, oil, mozzarella or fior di latte, grated cheese and basil.
- [AVPN Disciplinare 2022 (Italian)](https://www.pizzanapoletana.org/public/pdf/Disciplinare_AVPN_2022.pdf) (2022)
- [Commission Regulation (EU) No 97/2010 entering 'Pizza Napoletana' in the register of Traditional Specialities Guaranteed (STG/TSG)](https://eur-lex.europa.eu/eli/reg/2010/97/oj) (2010) — Summary: base ingredients are wheat flour, brewer's yeast, water, peeled tomatoes and/or fresh cherry tomatoes, salt and extra virgin olive oil; other permitted ingredients are garlic, oregano, Mozzarella di Bufala Campana DOP, fresh basil and Mozzarella STG. The specification covers the Marinara and the Margherita.
- [Pizza Napoletana STG: disciplinare (copy of the Gazzetta Ufficiale text), Horecanews](https://horecanews.it/wp-content/uploads/2022/11/pizza-napoletana-stg.pdf) (2010)
- [Dissapore: Pizza Napoletana, the EU removes from menus pizza that does not follow the disciplinare (Reg. 2022/2313)](https://www.dissapore.com/notizie/pizza-napoletana-lue-elimina-dai-menu-quella-che-non-rispetta-il-disciplinare-di-produzione/) (2022)
- [Dissapore: Pizza napoletana STG, the disciplinare changes (hand stretching only: no rolling pin, no mechanical press)](https://www.dissapore.com/alimentazione/pizza-napoletana-stg-cambia-il-disciplinare-e-si-conferma-unassurdita/) — Paraphrase: the STG rules forbid the rolling pin and mechanical disc presses.
- [Scatti di Gusto: Mozzarella vs fiordilatte on pizza](https://www.scattidigusto.it/2012/07/05/bufala-vieni-a-vedere-se-sulla-pizza-ci-va-mozzarella-o-fiordilatte/) (2012)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Ananas** (Pineapple) | ●●●●● 5 | yes | Pineapple appears in neither the EU STG nor the AVPN rules for a Margherita. Many Italians say its sweetness clashes with the acidic tomato. When a famous Naples pizzaiolo put a 'Margherita with pineapple' on his menu at the end of 2023, it caused a national row. | [cbc.ca](https://www.cbc.ca/lite/story/1.7107921) 2024; [ansa.it](https://ansa.it/amp/english/news/lifestyle/food_wine/2023/12/30/famed-naples-pizza-maker-adds-pineapple-spurring-row_1717aa08-bf5e-4cc7-8a36-faf3e42e72fd.html) 2023; [abc17news.com](https://abc17news.com/entertainment/cnn-style/2024/01/03/italy-divided-over-new-pineapple-pizza/) 2024; [open.online](https://www.open.online/2023/12/31/sorbillo-pizza-ananas-reazione-utenti-video/) 2023 (chef: Gino Sorbillo); [yougov.co.uk](https://yougov.co.uk/international/articles/40810-italian-food-crimes) 2022 |
| **Ketchup** (Ketchup) | ●●●○○ 3 | no | The Margherita's tomato is plain peeled tomato crushed raw. Ketchup is a cooked, sweetened, vinegary sauce. Coldiretti, the Italian farmers' association, lists using ketchup instead of tomato sauce among foreign pizza 'horrors'. | [meteoweb.eu](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) 2023; [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2023/08/02/ketchup-sulla-pizza-spaghetti-tagliati-con-le-forbici-e-ghiaccio-nel-vino-rosso-il-tiktoker-americano-uccide-la-cucina-italiana/7249975/) 2023; [scattidigusto.it](https://www.scattidigusto.it/2023/12/31/pizza-all-ananas-con-il-ketchup-gino-sorbillo-rilancia-senza-timori) 2023 (chef: Gino Sorbillo); [gamberorosso.it](https://www.gamberorosso.it/notizie/gino-sorbillo-pizza-ananas-pizza-ketchup-intervista/) 2024 (chef: Gino Sorbillo) |
| **Cheddar** (Cheddar) | ●○○○○ 1 | no | A Margherita's cheese is mozzarella or fior di latte, optionally with a little grated hard cheese. Coldiretti singles out 'Anglo-Saxon cheddar' among the wrong cheeses used on pizza abroad. | [meteoweb.eu](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) 2023 |
| **Parmesan finto (formaggi 'italian sounding')** (Imitation 'Parmesan' and fake Italian-style cheeses) | ●○○○○ 1 | no | Coldiretti campaigns against 'Parmesan', the imitation of real Parmigiano Reggiano and Grana Padano, which is common on pizza abroad. The objection is to the fake cheese, not to grated cheese itself. | [meteoweb.eu](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) 2023 |

**Game lines** (shown when the intruder appears in this dish):

- *Pineapple*: "Neither the EU STG nor the AVPN rules allow pineapple on a Margherita. Most Italians agree."
- *Ketchup*: "A Margherita's tomato is raw crushed tomato. Coldiretti lists ketchup among foreign pizza horrors."
- *Cheddar*: "Mozzarella or fior di latte only. Coldiretti singles out 'Anglo-Saxon cheddar' on pizza abroad."
- *Imitation 'Parmesan' and fake Italian-style cheeses*: "Real grated Parmigiano is allowed on a Margherita. Imitation 'Parmesan' is not."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Pineapple*: A few star pizzaioli now defend it. Sorbillo sold it to 'combat food prejudice', Franco Pepe has served a pineapple creation since 2019, and YouTube chef Vincenzo's Plate published a 'pineapple pizza like an Italian' recipe. It is still the number-one symbol of a pizza crime for most Italians.
- *Ketchup*: Not a real variant. A famous Naples pizzaiolo (Gino Sorbillo) made a joke 'ketchup' Margherita with homemade datterini-tomato ketchup at the end of 2023, as a provocation after his pineapple pizza.
- *Imitation 'Parmesan' and fake Italian-style cheeses*: Only the imitation is the intruder: a sprinkle of REAL grated hard cheese (Parmigiano or pecorino) is allowed on the Margherita by the AVPN rules.

**Fun facts and accepted details**

- The Margherita and the Marinara are the only pizzas codified by the EU 'Pizza Napoletana' STG and the AVPN rules.
- Since Regulation (EU) 2022/2313 the name 'Pizza Napoletana' itself is reserved in the EU: it may only be used for pizza made to the official STG specification.
- The disc is capped at 35 cm, and the STG bake is about 60-90 seconds at around 485 °C in a wood-fired oven.
- Grated hard cheese on a Margherita is allowed by the AVPN rules, and Neapolitan pizzaioli argue over fior di latte versus buffalo mozzarella.
- UNESCO added the art of the Neapolitan pizzaiuolo to its Intangible Cultural Heritage list on 7 December 2017.
- The 1889 Queen Margherita story is a tradition, not a documented fact; earlier tomato-mozzarella-basil pizzas existed.

---

## Pizza Marinara — *Marinara pizza*

**Origin:** Naples, Campania. It is considered the oldest of the classic Neapolitan pizzas.  
**Pasta / base:** The same Neapolitan dough and wood-fired bake as the Margherita (hand-stretched, max 35 cm, raised rim).  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** The oldest classic Neapolitan pizza: tomato, garlic, oregano and olive oil. No cheese, and no seafood, whatever the name suggests.  
> **In-game method:** Stretch the Neapolitan dough by hand. Top with raw crushed tomatoes, slices of peeled garlic, a generous pinch of dried oregano and a drizzle of olive oil. Bake for about a minute in a wood-fired oven. No cheese of any kind.

### The proper recipe

- **Pomodori pelati** (Peeled tomatoes, crushed raw)
- **Aglio** (Garlic) — Peeled and sliced.
- **Origano** (Dried oregano)
- **Olio extravergine d'oliva** (Extra virgin olive oil)
- **Sale** (Salt)
- **Basilico** (Basil) — OPTIONAL: many pizzerias add a leaf or two. It is not in the STG or AVPN definition, but it is not something Italians mock.

**Method.** The Neapolitan dough is stretched by hand, topped with raw crushed peeled tomatoes, slices of garlic, a generous pinch of dried oregano and a drizzle of extra virgin olive oil, then baked for about a minute in a wood-fired oven. There is no cheese of any kind: the AVPN defines it as tomato, oil, oregano and garlic.

**Authority sources** (kept by the sources lens):

- [AVPN International Regulations 2024 (English)](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) (2024) — Summary: the Marinara is tomato, oil, oregano and garlic.
- [Commission Regulation (EU) No 97/2010, Pizza Napoletana STG](https://eur-lex.europa.eu/eli/reg/2010/97/oj) (2010) — Summary: garlic and oregano are among the permitted ingredients, for the Marinara.
- [Wikipedia: Pizza marinara](https://en.wikipedia.org/wiki/Pizza_marinara) — Summary: the name comes from 'marinaro' (pertaining to sailors), and it is supposedly the oldest tomato-topped pizza.
- [Napolike: History of Neapolitan pizza, from food of the poor to UNESCO heritage](https://www.napolike.it/storia-della-pizza-napoletana-unesco) — Paraphrase: the marinara was the typical meal of sailors.
- [Scatti di Gusto: The best marinara pizzas in Naples](https://www.scattidigusto.it/pizzerie/migliori-pizze-marinara-napoli)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Mozzarella / fior di latte** (Mozzarella (any cheese)) | ●●○○○ 2 | no | The marinara is defined with no cheese at all: tomato, garlic, oregano and olive oil. Its ingredients are the kind that keep well, which is why the pizza is linked to Naples' sailors. Adding mozzarella makes it a different pizza. | [pizzanapoletana.org](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) 2024; [en.wikipedia.org](https://en.wikipedia.org/wiki/Pizza_marinara) |
| **Frutti di mare** (Seafood (prawns, mussels, clams)) | ●●○○○ 2 | no | Despite the name, there is no fish or seafood on a pizza marinara. 'Marinara' refers to sailors ('marinai'), who could carry its long-lasting ingredients on board, not to food from the sea. | [en.wikipedia.org](https://en.wikipedia.org/wiki/Pizza_marinara); [napolike.it](https://www.napolike.it/storia-della-pizza-napoletana-unesco) |
| **Formaggio grattugiato (Parmigiano / pecorino)** (Grated cheese) | ●○○○○ 1 | no | The AVPN rules give grated cheese to the Margherita, not to the Marinara, which has no cheese. | [pizzanapoletana.org](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) 2024 |

**Game lines** (shown when the intruder appears in this dish):

- *Mozzarella (any cheese)*: "The marinara has no cheese at all: tomato, garlic, oregano and olive oil."
- *Seafood (prawns, mussels, clams)*: "'Marinara' means the sailors' pizza, not seafood. There is no fish on it."
- *Grated cheese*: "The AVPN rules give grated cheese to the Margherita, not to the cheese-free Marinara."

**Fun facts and accepted details**

- The Marinara is considered older than the Margherita; Margherita-style toppings came later.
- Abroad, 'marinara' can mean a cooked tomato sauce or even a seafood pizza; in Naples it means tomato, garlic, oregano and oil.
- Confusingly, in Rome a pizza called 'napoletana' means tomato, mozzarella and anchovies.
- In 2022 an Italian food site questioned a restaurant chef's 'pizza marinara in a packet' (in bustina).
- Anchovies or a basil leaf on a marinara are accepted pizzeria variations, not crimes.

---

## Pizza Diavola — *Diavola (spicy salami) pizza*

**Origin:** No documented birthplace; a standard on pizzeria menus all over Italy. Its spicy salami recalls the cured-meat traditions of Calabria and Naples.  
**Pasta / base:** Standard Italian pizzeria dough (Neapolitan-style or thinner regional styles), baked in a hot oven.  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** Italy's spicy salami pizza, the 'she-devil': tomato, mozzarella and slices of salame piccante that curl and drip red, peppery fat.  
> **In-game method:** Spread crushed tomatoes on the stretched dough and add mozzarella or fior di latte. Lay on thin slices of spicy Italian salami and bake until they curl and release their red fat. Finish with chilli oil or chilli flakes for more heat.

### The proper recipe

- **Pomodoro** (Tomato) — Crushed peeled tomatoes.
- **Mozzarella / fior di latte** (Mozzarella / fior di latte)
- **Salame piccante (salamino piccante, spianata calabra, salame napoletano)** (Spicy salami) — The defining ingredient.
- **Olio extravergine d'oliva** (Extra virgin olive oil)
- **Peperoncino / olio piccante** (Chilli flakes or chilli oil) — Optional, for extra heat.
- **Basilico** (Basil) — Optional.

**Method.** A Margherita-style base (tomato and mozzarella) is topped with thin slices of spicy Italian salami and baked until the salami curls and releases its red, peppery fat. Chilli oil or chilli flakes are sometimes added at the end. 'Diavola' (she-devil) refers to the heat.

**Authority sources** (kept by the sources lens):

- [Ooni: Why Italians don't eat pepperoni on their pizza (or at all)](https://uk.ooni.com/blogs/ooni-insights/why-italians-dont-eat-pepperoni)
- [Tasting Table: Why you shouldn't expect pepperoni pizza on menus in Italy](https://www.tastingtable.com/2041004/why-no-pepperoni-pizza-italy/)
- [Mashed: The difference between pepperoni in Italy and the US](https://www.mashed.com/438182/the-difference-between-pepperoni-in-italy-and-the-us) — Summary: American pepperoni is a cured pork-and-beef sausage seasoned with paprika or chilli; the Italian equivalent is salamino piccante.
- [Gambero Rosso International: how the classic pizzas most loved by Italians were born](https://www.gamberorossointernational.com/?p=398165)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **"Pepperoni" (salame americano)** (Pepperoni (the American kind, and the word)) | ●●○○○ 2 | yes | There is no 'pepperoni' in Italy: the word sounds like 'peperoni', which means bell peppers. Italians order a diavola with salame piccante (spicy salami), and they find it funny that abroad the diavola is sold as 'pepperoni pizza'. | [uk.ooni.com](https://uk.ooni.com/blogs/ooni-insights/why-italians-dont-eat-pepperoni); [explore.com](https://explore.com/1549092/popular-type-pizza-pepperoni-never-find-italy-unless-tourist-trap); [lavocedinewyork.com](https://lavocedinewyork.com/food/2026/11/02/pepperoni-pizza-la-regina-americana-che-confonde-gli-italiani/) 2026 |
| **Peperoni** (Bell peppers (the 'pepperoni' mix-up)) | ●○○○○ 1 | no | Tourists who ask for 'pepperoni' in Italy can get a pizza with sweet bell peppers. A diavola gets its heat from spicy salami and chilli, not from peppers. | [tastingtable.com](https://tastingtable.com/1015040/why-you-might-be-confused-buying-pepperoni-in-italy); [mashed.com](https://www.mashed.com/438182/the-difference-between-pepperoni-in-italy-and-the-us) |

**Game lines** (shown when the intruder appears in this dish):

- *Pepperoni (the American kind, and the word)*: "Ask for 'pepperoni' in Italy and you may get bell peppers. A diavola uses salame piccante."
- *Bell peppers (the 'pepperoni' mix-up)*: "Peperoni are bell peppers. A diavola gets its heat from spicy salami and chilli."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Pepperoni (the American kind, and the word)*: American pepperoni is a close cousin of southern Italian spicy salami, and the diavola is Italy's equivalent of a pepperoni pizza. Italians mostly joke about the name and dislike the industrial product; they do not object to spicy salami on pizza.
- *Bell peppers (the 'pepperoni' mix-up)*: There is no Italian debate here, but bell peppers are a normal, accepted topping on other Italian pizzas. They just are not what makes a diavola.

**Fun facts and accepted details**

- To get something like American pepperoni pizza in Italy, ask for 'pizza diavola' or 'pizza con salame piccante'. Saying 'pepperoni' can get you bell peppers.
- 'Diavola' means 'she-devil', for the spicy heat.
- Spicy Calabrian 'nduja and chilli oil are common, accepted ways to make an Italian pizza hot (general knowledge, not from a source checked here).

---

## Pizza Capricciosa (e Quattro Stagioni) — *Capricciosa pizza (and Four Seasons pizza)*

**Origin:** Rome, Lazio. Reportedly created in 1937 at the restaurant La Capricciosa (single-source claim). It is popular all over Italy, including Naples.  
**Pasta / base:** Standard Italian pizzeria dough (Neapolitan or Roman style).  
**Data coverage:** researcher + sources lens + culinary lens

> **In-game blurb:** The 'whimsical' pizza: tomato and mozzarella topped with cooked ham, mushrooms, artichoke hearts and olives, all scattered together.  
> **In-game method:** Spread tomato and mozzarella on the dough. Scatter cooked ham, mushrooms, artichoke hearts in oil and olives over the whole pizza, then bake. Give each topping its own quarter instead and it becomes a Quattro Stagioni.

### The proper recipe

- **Pomodoro** (Tomato)
- **Mozzarella / fior di latte** (Mozzarella / fior di latte)
- **Prosciutto cotto** (Cooked ham)
- **Funghi (champignon)** (Mushrooms)
- **Carciofini sott'olio** (Artichoke hearts in oil)
- **Olive** (Olives (black or green))
- **Acciughe** (Anchovies) — Optional: a known variant includes anchovies.

**Method.** A tomato and mozzarella base is topped with cooked ham, mushrooms, artichoke hearts in oil and olives, then baked. In a capricciosa the toppings are scattered over the whole pizza. A Quattro Stagioni ('four seasons') uses essentially the same toppings, but each one gets its own quarter of the pizza.

**Authority sources** (kept by the sources lens):

- [Wikipedia: Pizza capricciosa](https://en.wikipedia.org/wiki/Pizza_capricciosa)
- [Wikipedia: Pizza quattro stagioni](https://en.wikipedia.org/wiki/Pizza_quattro_stagioni)
- [Giallo Zafferano blog: Pizza quattro stagioni (tomato, mozzarella, artichokes in oil, mushrooms, cooked ham, olives; mixed together it becomes a capricciosa)](https://blog.giallozafferano.it/rilassarsicucinando/pizza-quattro-stagioni-lievito-madre/)
- [Ooni: Attilio Bachetti's Pizza Capricciosa](https://nz.ooni.com/blogs/recipes/attilio-bachettis-pizza-capricciosa-capricious-pizza)
- [AGI: The pizzas that never go out of fashion](https://www.agi.it/cronaca/news/2022-08-27/pizze-amate-italiani-17870976/) (2022)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Würstel** (Frankfurter / hot-dog sausage) | ●●○○○ 2 | yes | Würstel (frankfurters) are not part of the classic capricciosa of ham, mushrooms, artichokes and olives. When a Naples pizzaiolo with a big social-media following said in a video that Salerno's capricciosa traditionally includes würstel, it set off an online row. | [scattidigusto.it](https://www.scattidigusto.it/errico-porzio-salerno-capricciosa-wurstel-pizze-1-euro) (chef: Errico Porzio) |
| **Ananas** (Pineapple) | ●●○○○ 2 | yes | The capricciosa already carries ham, and ham plus canned pineapple is the 'Hawaiian' pizza, which was invented in Canada, not Italy. For most Italians pineapple has no place among the capricciosa's savoury toppings. | [falstaff.com](https://www.falstaff.com/en/news/naples-serves-pineapple-on-pizza-no-go-or-long-overdue) 2024; [scattidigusto.it](https://www.scattidigusto.it/2019/06/10/pizza-ananas-retroscena/) 2019 |

**Game lines** (shown when the intruder appears in this dish):

- *Frankfurter / hot-dog sausage*: "The classic capricciosa is ham, mushrooms, artichokes and olives. Würstel on it sparked an online row."
- *Pineapple*: "Ham plus pineapple is the Canadian 'Hawaiian'. It has no place on a capricciosa."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Frankfurter / hot-dog sausage*: The pizzaiolo was Errico Porzio. Würstel themselves are an accepted pizza topping in Italy (pizza würstel e patatine), and some local pizzerias reportedly put them on a capricciosa, but they are not in the classic recipe. He later sold capricciosas for 1 euro to settle the row (an apology could not be confirmed).
- *Pineapple*: There is no complaint specific to the capricciosa: this is the general Italian dislike of the ham-and-pineapple 'Hawaiian'. A few top Italian pizzaioli now serve pineapple pizzas, but not as a capricciosa.

**Fun facts and accepted details**

- Capricciosa and Quattro Stagioni have practically the same toppings. The difference is that the capricciosa mixes them, while the Quattro Stagioni gives each topping its own quarter.
- 'Capricciosa' means 'whimsical' or 'capricious'. It is sometimes described as a 'clean-out-the-fridge' pizza.
- Variants exist: some add anchovies, and some local versions reportedly add an egg or würstel. These are regional quirks, not the classic recipe.

---

## Pizza napoletana: condimenti proibiti e condimenti tollerati — *Neapolitan pizza: rejected toppings vs. surprisingly accepted ones*

**Origin:** Naples (rules); applies to Italian pizzerias generally  
**Pasta / base:** Neapolitan dough (flour, water, salt, yeast); wood-fired  
**Data coverage:** researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep

> **In-game blurb:** Neapolitan rules codify only the Margherita and the Marinara. Italians happily eat many other toppings, but some foreign ones make them furious.  
> **In-game method:** Stretch the dough by hand and bake it for about a minute in a very hot wood-fired oven. Italian pizzerias top it with tomato, mozzarella and dozens of classics, from spicy salami to würstel and fries, but not pineapple, ketchup or BBQ chicken.

### The proper recipe

- **Pomodoro, mozzarella/fior di latte, basilico, olio EVO, aglio, origano** (Tomato, mozzarella or fior di latte, basil, extra virgin olive oil, garlic, oregano) — The only toppings in the EU STG and AVPN Margherita and Marinara (plus salt, and grated cheese on the AVPN Margherita).
- **Würstel e patatine fritte** (Frankfurters and French fries) — ACCEPTED in Italy: a kids' favourite on almost every pizzeria menu, often called 'pizza americana'. Italian food media have debated taking it off menus, but it stayed. Do not mock it.
- **Tonno e cipolla** (Tuna and onion) — ACCEPTED: a staple on Italian pizzeria menus; even top Naples pizzerias make a version.
- **Mais** (Sweetcorn) — COMMON in Italian pizzerias, often with cooked ham and/or cream. Purists sneer at it, but it is a menu staple, so do not treat it as a foreign crime.
- **Panna** (Cream) — COMMON on pizza in many Italian pizzerias (white pizzas with cream, ham, corn), unlike in carbonara. Neapolitan purists frown on it, and food media present cream pizzas by top pizzaioli as deliberate 'disobedience', so treat it as tolerated, not classic.
- **Salame piccante, prosciutto cotto, funghi, carciofini, olive, acciughe** (Spicy salami, cooked ham, mushrooms, artichokes, olives, anchovies) — ACCEPTED classic toppings (diavola, capricciosa, quattro stagioni).
- **Salsiccia e friarielli** (Sausage and friarielli (broccoli rabe)) — ACCEPTED: a Neapolitan classic (general knowledge).
- **Crema di nocciole e cacao** (Chocolate-hazelnut spread) — ACCEPTED as a DESSERT pizza or calzone in many Italian pizzerias, but not mixed with savoury toppings.

**Method.** Neapolitan pizza is a hand-stretched disc baked for about a minute in a wood-fired oven. Only the Margherita and Marinara are codified, but Italian pizzerias offer dozens of other toppings. Italians reject toppings seen as foreign, sweet or industrial, such as pineapple, ketchup, chicken, BBQ sauce and cheddar, while happily eating some that foreigners find odd, such as würstel and fries or tuna and onion. Sweetcorn and cream are common too, though purists sneer at them.

**Authority sources** (kept by the sources lens):

- [AVPN International Regulations 2024](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) (2024)
- [Commission Regulation (EU) No 97/2010, Pizza Napoletana STG](https://eur-lex.europa.eu/eli/reg/2010/97/oj) (2010)
- [Sky TG24: Pizza, horror toppings around the world from zebra meat to yogurt (Coldiretti-Ipsos)](https://tg24.sky.it/lifestyle/2023/12/07/pizza-zebra-yogurt-dati) (2023)
- [Il Post: Le pizze degli altri (other countries' pizzas)](https://www.ilpost.it/2022/02/18/pizze-straniere-ingredienti/) (2022)
- [Scatti di Gusto: Pizza all'ananas, condanni Sorbillo e mangi la würstel e patatine](https://www.scattidigusto.it/2023/12/30/pizza-allananas-condanni-sorbillo-e-mangi-la-wurstel-e-patatine/) (2023) — You condemn Sorbillo's pineapple pizza, yet you eat the würstel-and-fries pizza (headline).
- [Scatti di Gusto: Togliere la pizza würstel e patatine dai menu delle pizzerie?](https://www.scattidigusto.it/migliore-pizza-wurstel-patatine) (2015) — Should the würstel-and-fries pizza be taken off pizzeria menus? (headline)
- [Scatti di Gusto: The 6 best würstel-and-fries pizzas in Campania](https://www.scattidigusto.it/migliori-pizze-wurstel-e-patatine-campania)
- [Pizzeria menu 2025 listing an 'American pizza' with fries and würstel (commercial menu, not an authority)](https://cdn.website.dish.co/media/c9/06/5634955/Menu-2025.pdf) (2025)
- [Dissapore: Pizza tonno e cipolla recipe](https://www.dissapore.com/ricette/pizza-tonno-e-cipolla-ricetta/)
- [Scatti di Gusto: Tonno e cipolla, the perfect pizza by Davide Ruotolo in Naples](https://www.scattidigusto.it/2023/05/31/pizza-tonno-e-cipolla-palazzo-petrucci-napoli/) (2023)
- [Scatti di Gusto: Identità di Pizza 2024, disobedience is all cream and fiordilatte](https://www.scattidigusto.it/2024/03/14/identita-di-pizza-2024-la-disobbedienza-e-a-tutta-panna-e-fiordilatte/) (2024)
- [Glovo: Pizza & Sfizi, Battipaglia (pizza with mozzarella, cooked ham, corn and cream; commercial listing, not an authority)](https://glovoapp.com/ca/it/battipaglia/stores/pizza-sfizi-btp)

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Ananas** (Pineapple) | ●●●●● 5 | yes | Pineapple is the most famous 'crime' against pizza in Italian eyes: a sweet fruit on a savoury pizza. The 'Hawaiian' pizza was invented in Canada in 1962. Italian TV chefs, pizzaioli and social media have mocked it for years. | [yougov.co.uk](https://yougov.co.uk/international/articles/40810-italian-food-crimes) 2022; [ladbible.com](https://www.ladbible.com/entertainment/film-and-tv-food-gino-dacampo-has-a-go-at-kids-for-liking-pineapple-on-pizza-20180213) 2018 (chef: Gino D'Acampo); [hellomagazine.com](https://www.hellomagazine.com/cuisine/20230119156005/gino-dacampo-reveals-restaurant-launch-gordon-ramsay-shock-family-life/) 2023 (chef: Gino D'Acampo); [euronews.com](https://www.euronews.com/culture/2022/02/18/angry-chef-reacts-to-the-11-worst-crimes-committed-against-italian-food) 2022 (chef: Vincenzo's Plate (Vincenzo Prosperi)); [vincenzosplate.com](https://www.vincenzosplate.com/pineapple-pizza-recipe/) (chef: Vincenzo's Plate (Vincenzo Prosperi)); [gamberorosso.it](https://www.gamberorosso.it/attualita/pizza-ananas-cannavacciuolo-masterchef/) 2024 (chef: Antonino Cannavacciuolo); +15 more in JSON |
| **Ketchup** (Ketchup) | ●●●○○ 3 | no | Italian pizza uses plain tomato, not a sweet, vinegary bottled sauce. Coldiretti lists using ketchup instead of tomato sauce among the foreign pizza 'horrors' it presented in Naples. | [meteoweb.eu](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) 2023; [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2023/08/02/ketchup-sulla-pizza-spaghetti-tagliati-con-le-forbici-e-ghiaccio-nel-vino-rosso-il-tiktoker-americano-uccide-la-cucina-italiana/7249975/) 2023; [gamberorosso.it](https://www.gamberorosso.it/notizie/gino-sorbillo-pizza-ananas-pizza-ketchup-intervista/) 2024 (chef: Gino Sorbillo); [dissapore.com](https://www.dissapore.com/notizie/tiktoker-infrange-i-tabu-della-cucina-italiana-ketchup-nella-pizza-e-pasta-tagliata-con-le-forbici) 2023; [asiae.co.kr](https://www.asiae.co.kr/en/article/2023080408454629870) 2023; [scattidigusto.it](https://www.scattidigusto.it/pizza-all-ananas-con-il-ketchup-gino-sorbillo-rilancia-senza-timori) 2024 (chef: Gino Sorbillo) |
| **Pollo** (Chicken) | ●●●○○ 3 | no | Chicken is popular on pizza in many countries but almost never seen in Italian pizzerias. Coldiretti lists chicken pizzas abroad, such as chicken in yogurt or chicken with imitation 'Parmesan', among its pizza horrors, and a fast-food chain's 'Chizza', with a fried-chicken base, was reported in Italy as a pizza that makes Italians angry. | [ilpost.it](https://www.ilpost.it/2022/02/18/pizze-straniere-ingredienti/) 2022; [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cucina/chizza-la-pizza-fatta-con-la-cotoletta-di-pollo-che-fa-arrabiare-gli-italiani-2656871); [dissapore.com](https://www.dissapore.com/notizie/meta-pollo-meta-pizza-kfc-presenta-la-chizza/); [tg24.sky.it](https://tg24.sky.it/lifestyle/2023/12/07/pizza-zebra-yogurt-dati) 2023 |
| **Salsa barbecue** (BBQ sauce) | ●●○○○ 2 | no | Barbecue sauce, usually with chicken, is a foreign topping that Italian pizzerias simply do not use. In early 2022 Il Post noted that the only pizzeria chain in Italy offering barbecue chicken pizza was an American one, which left Italy that August. | [ilpost.it](https://www.ilpost.it/2022/02/18/pizze-straniere-ingredienti/) 2022; [ilpost.it](https://www.ilpost.it/2022/08/10/chiusura-dominos-pizza-italia-fallimento-franchising/) 2022 |
| **Cheddar** (Cheddar) | ●●○○○ 2 | no | Italian pizza uses mozzarella or fior di latte. Coldiretti singles out 'Anglo-Saxon cheddar', together with fake Italian cheeses, as wrong cheeses used on pizza abroad. | [meteoweb.eu](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) 2023 |
| **Banana** (Banana) | ●●○○○ 2 | no | Banana pizza, best known from Sweden's banana-and-curry pizza, is on Coldiretti's list of foreign pizza horrors. Italian food media treated a famous Naples pizzaiolo's banana pizza as yet another provocation. | [tg24.sky.it](https://tg24.sky.it/lifestyle/2023/12/07/pizza-zebra-yogurt-dati) 2023; [dissapore.com](https://www.dissapore.com/notizie/la-pizza-alla-banana-di-gino-sorbillo-non-e-un-pesce-daprile/) (chef: Gino Sorbillo); [smithsonianmag.com](https://www.smithsonianmag.com/travel/bananas-and-curry-on-pizza-thats-how-the-swedish-do-it-180984961/) |
| **Parmesan (finto Parmigiano)** (Imitation 'Parmesan') | ●○○○○ 1 | no | Coldiretti calls US 'Parmesan' a fake of real Parmigiano and Grana, often paired with chicken on pizza. | [meteoweb.eu](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) 2023 |
| **Carni esotiche e insetti (canguro, zebra, serpente, grilli)** (Exotic meats and insects (kangaroo, zebra, snake, crickets)) | ●○○○○ 1 | no | Coldiretti's 2023 'Pizzeria degli Orrori' in Naples showed foreign pizzas topped with kangaroo, zebra, snake and crickets. | [meteoweb.eu](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) 2023; [uk.news.yahoo.com](https://uk.news.yahoo.com/pizza-shop-horrors-leaves-italians-144531443.html) 2023 |
| **Kiwi** (Kiwi fruit) | ●○○○○ 1 | no | Fruit on savoury pizza is a classic Italian complaint. Scatti di Gusto ran a piece saying the only thing worse than pineapple pizza is kiwi pizza. | [scattidigusto.it](https://www.scattidigusto.it/2020/01/17/peggio-della-pizza-allananas-ce-solo-la-pizza-al-kiwi) 2020 |

**Game lines** (shown when the intruder appears in this dish):

- *Pineapple*: "The 'Hawaiian' was invented in Canada in 1962. Italians rated pineapple on pizza -63 in a YouGov poll."
- *Ketchup*: "Italian pizza uses plain tomato. Coldiretti displayed ketchup pizza among its foreign 'horrors'."
- *Chicken*: "Chicken is everywhere on pizza abroad and almost nowhere in Italian pizzerias."
- *BBQ sauce*: "In 2022 the only pizza chain offering BBQ chicken in Italy was American. It left that summer."
- *Cheddar*: "Italian pizza uses mozzarella or fior di latte. Coldiretti calls out 'Anglo-Saxon cheddar'."
- *Banana*: "Banana pizza is a Swedish favourite and sits on Coldiretti's list of foreign pizza horrors."
- *Imitation 'Parmesan'*: "Coldiretti calls US 'Parmesan' a fake of Parmigiano and Grana. Real grated cheese is fine."
- *Exotic meats and insects (kangaroo, zebra, snake, crickets)*: "Kangaroo, zebra, snake, crickets: Coldiretti's 2023 'Pizzeria of Horrors' showed them all."
- *Kiwi fruit*: "One Italian food site's verdict: the only thing worse than pineapple pizza is kiwi pizza."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Pineapple*: Since about 2017-2019 some top Italian pizzaioli have broken the taboo: Gino Sorbillo (a 2017 tasting night, then a 2023 menu item), Franco Pepe's 'AnaNascosta' (fried pizza with pineapple wrapped in ham) and Simone Lombardi. Food sites like Dissapore have published pro-pineapple pieces. Most Italians still reject it.
- *Ketchup*: Gino Sorbillo made a joke ketchup Margherita with datterini-tomato ketchup in 2023, but as a provocation, not a real variant.
- *Imitation 'Parmesan'*: Only the imitation is the target: real grated Parmigiano or pecorino is fine, and the AVPN even lists grated cheese on the Margherita.

**Fun facts and accepted details**

- The 'Hawaiian' pizza was invented in 1962 at a restaurant in Chatham, Ontario, Canada, by a Greek-Canadian restaurant owner: not in Hawaii, not in Italy.
- In Italy a 'pizza americana' usually means a pizza topped with würstel and French fries, which kids love.
- A 2023 Coldiretti/Ipsos survey reported that many Italians who ate pizza abroad were disappointed. Odd ingredient combinations and wrong baking were the top complaints.
- A big American pizza chain opened in Italy in 2015 and closed all its Italian stores in 2022. Its Italian franchisee blamed competition from delivery apps; many commentators blamed Italians' dislike of American-style pizza.
- Cream (panna), sweetcorn (mais) and tuna-and-onion (tonno e cipolla) are normal pizzeria toppings in Italy, so the game should not mock them.
- Surprisingly accepted: Italian food media have mocked people who condemn pineapple pizza while happily eating würstel-and-fries pizza (Scatti di Gusto, via the popular-posts sweep).
- 'Peperoni' in Italian means bell peppers, not the sausage: an American-style pepperoni pizza is a 'diavola' in Italy.

---

## Tiramisù — *Tiramisu*

**Origin:** Veneto (Treviso). Friuli Venezia Giulia also claims it.  
**Pasta / base:** n/a (dessert: savoiardi ladyfingers)  
**Data coverage:** THIN: popular-posts sweep only (no checker review, one source). Do not ship as a level without more research.

> **In-game blurb:** The Veneto's coffee dessert, also claimed by Friuli: espresso-dipped savoiardi layered with mascarpone cream and dusted with bitter cocoa.  
> **In-game method:** Beat egg yolks with sugar and fold in mascarpone (and whipped whites in many versions). Dip savoiardi briefly in cooled espresso and layer them with the cream. Finish with bitter cocoa and chill for several hours.

### The proper recipe

- **Savoiardi** (Ladyfinger biscuits)
- **Caffè espresso** (Espresso coffee)
- **Mascarpone** (Mascarpone)
- **Uova** (Eggs)
- **Zucchero** (Sugar)
- **Cacao amaro** (Unsweetened cocoa)

**Method.** Beat egg yolks with sugar, fold in mascarpone (and whipped egg whites in many versions), and layer the cream with savoiardi briefly dipped in cooled espresso. Finish with bitter cocoa and chill.

### Intruders

| Ingredient | Popularity | Contested | Why | Sources (incl. chefs) |
|---|---|---|---|---|
| **Panna (al posto del mascarpone)** (Whipped cream instead of mascarpone)*(sweep only (not reviewed by the checker lenses))* | ●●○○○ 2 | no | Italian lists of foreign 'horrors' name tiramisù made with whipped cream in place of mascarpone. Mascarpone, egg and sugar make the cream. | [scattidigusto.it](https://www.scattidigusto.it/ricette-italiane-orrori-ingredienti) 2016 |

**Game lines** (shown when the intruder appears in this dish):

- *Whipped cream instead of mascarpone*: "Tiramisù's cream is mascarpone, egg and sugar. Whipped cream instead makes Italian 'horror' lists."

**Contested and caveat notes** (designer-facing; names here must not go in-game):

- *Whipped cream instead of mascarpone*: Sweep-only evidence (one Scatti di Gusto list), not reviewed by the checker lenses.

**Fun facts and accepted details**

- Veneto and Friuli Venezia Giulia have argued for years over which region invented tiramisù.

---

## Viral controversies

Source records, not in-game text: they name people and companies.

### Spaghetti alla carbonara

- **2016** The French site Demotivateur posted a one-pot 'carbonara' video that boiled farfalle with onion and bacon and finished it with crème fraîche. Italians mocked it and Italian media covered it widely. ([thelocal.it](https://www.thelocal.it/20160407/italians-pour-scorn-french-attempt-to-reinvent-carbonara), [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/video-carbonara-sbagliata-francese-cipolla/), [vice.com](https://www.vice.com/en/article/this-french-carbonara-recipe-pissed-off-all-of-italy), [huffingtonpost.com](https://www.huffingtonpost.com/entry/french-carbonara-video-recipe-sparks-outrage_us_57055e0ae4b0b90ac2710a5b), [startupitalia.eu](https://startupitalia.eu/53740-20160412-carbonara-gate-video-ricetta-chef-la-mantia))
- **2021** NYT Cooking published a 'Smoky Tomato Carbonara' with bacon and tomato, and Coldiretti and Italian restaurateurs condemned it. ([uk.finance.yahoo.com](https://uk.finance.yahoo.com/news/stop-madness-nyt-angers-italians-121938305.html), [en.ilsole24ore.com](https://en.ilsole24ore.com/art/carbonara-pomodoro-e-bacon-ricetta-new-york-times-fa-infuriare-coldiretti-ADdj51LB), [efanews.eu](https://www.efanews.eu/item/17291-the-fake-carbonara-launched-by-the-new-york-times.html), [tastecooking.com](https://tastecooking.com/who-called-the-carbonara-police/))
- **2024** For the 70th anniversary of the first Italian printed carbonara, a recreation of the 1954 recipe with garlic, pancetta and Gruyère horrified purists. ([en.ilsole24ore.com](https://en.ilsole24ore.com/art/carbonara-day-ricetta-compie-70-anni-e-aglio-e-gruviera-fa-inorridire-puristi-AFSGQIKD))
- **2024** Heinz launched canned carbonara in the UK. Italian chefs and tourism minister Daniela Santanchè reacted publicly. ([ilsussidiario.net](https://www.ilsussidiario.net/news/carbonara-in-lattina-esplode-la-rivolta-degli-chef-vissani-vergognoso-si-distrugge-la-nostra-cultura/2745803/), [wantedinrome.com](https://www.wantedinrome.com/news/italy-tourism-minister-heinz-carbonara.html), [en.ilsole24ore.com](https://en.ilsole24ore.com/art/and-controversy-the-can-carbonara-proposed-by-heinz-vissani-destroys-italian-culture-AFtCnSbD), [wantedinrome.com](https://www.wantedinrome.com/news/italy-reacts-spaghetti-carbonara-tin.html), [dissapore.com](https://www.dissapore.com/notizie/la-carbonara-in-lattina-scandalizza-heinz-non-ha-inventato-nulla-e-anche-le-aziende-italiane-la-fanno/), [cbc.ca](https://www.cbc.ca/lite/story/1.7308656))
- **2024** Coldiretti's Carbonara Day survey reported distorted carbonara in about 6 of 10 foreign restaurants, with bacon, cream, peas, butter or basil. ([agi.it](https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/), [meteoweb.eu](https://www.meteoweb.eu/2024/04/carbonara-day-ricette-tarocche-in-6-ristoranti-stranieri-su-10/1001399577/))
- **2025** A Belgian Delhaize 'carbonara' sauce containing cream and pancetta, on sale in the European Parliament shop, angered an Italian minister. ([brusselstimes.com](https://brusselstimes.com/eu-affairs/1846923/italian-minister-fumes-at-delhaizes-ready-made-carbonara-sauce/), [quotidiano.net](https://www.quotidiano.net/itinerari/gusto/bruxelles-carbonara-belga-x4u3ov09), [ctvnews.ca](https://www.ctvnews.ca/lifestyle/article/fake-carbonara-sauce-causes-outrage-in-italy/))
- **n.d.** Italia Squisita reaction video: Roman chefs Flavio De Maio, Marco Martini and Luciano Monosilio review the most-watched carbonara videos online and then cook their own (influencer sweep). ([youtube.com](https://www.youtube.com/watch?v=bnZ_70XyVAk), [italiasquisita.net](https://italiasquisita.net/it/video/carbonara-gli-chef-reagiscono-ai-video-piu-visti-al-mondo))
- **n.d.** Vincenzo's Plate posted reaction videos to Gordon Ramsay's and Jamie Oliver's carbonara; he reportedly called Ramsay's one of the worst carbonara recipes he had seen (influencer sweep; wording not verified). ([facebook.com](https://www.facebook.com/vincenzosplate/videos/i-reacted-to-gordon-ramsay-carbonara-video/374147440253415/), [pinterest.com](https://www.pinterest.com/pin/592786369700597743/))
- **2017** Nigella Lawson posted a carbonara with double cream and white wine. Italian commenters called it an outrage; she reportedly replied that it was not entirely authentic but entirely delicious (popular-posts sweep). ([dissapore.com](https://www.dissapore.com/chef/nigella-lawson-carbonara-bocciata/), [huffingtonpost.co.uk](https://www.huffingtonpost.co.uk/entry/nigella-lawson-carbonara_n_595e2e9ce4b02e9bdb0a9223))
- **2020** Gordon Ramsay's quick carbonara video (pancetta, crème fraîche, peas, mushrooms, chilli) was mocked by Italian social media users as a 'yellow soup' (popular-posts sweep). ([wantedinrome.com](https://wantedinrome.com/news/italians-revolted-by-gordon-ramsays-nightmare-carbonara.html), [parismatch.be](https://www.parismatch.be/lifestyle/food/2020/02/26/les-pates-a-la-carbonara-de-gordon-ramsay-deviennent-la-risee-des-italiens-et-du-web-video-3343I2QBURAQXBCIJB7FCV44EI/), [gordonramsay.com](https://gordonramsay.com/gr/recipes/gordons-carbonara-in-under-10-minutes/amp))
- **2023** Young protesters at the Trevi Fountain held signs against tourists' 'food crimes', including 'no more cream in carbonara' and 'adding chicken to pasta is a crime in Italy' (popular-posts sweep; sign wording as reported). ([archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cronaca-italia/spaghetti-e-cappuccino-basta-a-fontana-di-trevi-attivisti-della-pasta-3543489), [italianismo.com.br](https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/))
- **2023** The Financial Times published food historian Alberto Grandi's argument that carbonara and other 'traditional' dishes are recent or American-influenced; Coldiretti called it a surreal attack (popular-posts sweep). ([tg24.sky.it](https://tg24.sky.it/mondo/2023/03/27/financial-times-carbonara-parmigiano-coldiretti), [falstaff.com](https://www.falstaff.com/en/news/carbonara-controversy-was-carbonara-not-invented-in-italy))
- **2026** The Italian YouTube 'pasta police' duo Lionfield ('Not approved!') answered a viral clip of a 'carbonara' made with bologna sausage, eggs and yogurt over raw penne (popular-posts sweep, via a syndicated Washington Post piece). ([iol.co.za](https://iol.co.za/ios/world/2026-01-06-bologna-in-the-carbonara-call-italys-pasta-police/))

### Spaghetti / Bucatini all'amatriciana (Amatriciana Tradizionale STG)

- **2015** Carlo Cracco, a MasterChef Italia judge, revealed 'aglio in camicia' (whole unpeeled garlic) as his secret ingredient on the TV show C'è posta per te. Amatrice's council answered with a statement listing the protected ingredients, and Cracco apologised. ([dissapore.com](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/), [theworld.org](https://theworld.org/stories/2015/02/11/garlic-or-no-garlic-culinary-squabble-over-how-make-delicious-amatriciana-pasta), [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatriciana-con-aglio-carlo-cracco-non-scherza-ce-anche-ricetta-nel-suo-libro-2098524), [dissapore.com](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-amatriciana-la-verita/))
- **2015** An amatriciana on RAI's La Prova del Cuoco prompted Amatrice to complain of 'wrong ingredients'. ([archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatriciana-a-la-prova-del-cuoco-amatrice-ingredienti-sbagliati-2147843))
- **2020** An amatriciana made with onion and deglazed with vinegar on La Prova del Cuoco caused an online scandal, months after the STG registration. ([scattidigusto.it](https://www.scattidigusto.it/2020/06/03/amatriciana-con-aceto-e-cipolla-alla-prova-del-cuoco-e-scandalo))
- **2020** The EU registered 'Amatriciana Tradizionale' as an STG, fixing the recipe as guanciale, tomato and pecorino, without onion, garlic or pancetta. ([eunews.it](https://www.eunews.it/2020/03/13/amatriciana-specialita-europea-garantita/), [scattidigusto.it](https://www.scattidigusto.it/2020/03/13/amatriciana-ora-e-specialita-tradizionale-garantita/))

### Tonnarelli cacio e pepe

- **2025** The BBC-branded Good Food website published a cacio e pepe with butter and Parmesan. Claudio Pica of Fiepet-Confesercenti Roma demanded a correction, a complaint reached the British embassy, and the recipe was rewritten with three ingredients, though a double-cream tip remained. ([gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/), [open.online](https://www.open.online/2025/08/10/bbc-retromarcia-bufera-ricetta-cacio-pepe/), [iol.co.za](https://iol.co.za/lifestyle/food-drink/2025-08-08-no-butter-no-joke-italians-demand-british-embassy-step-in-after-pasta-recipe-backlash/), [euronews.com](https://www.euronews.com/culture/2025/08/11/explained-how-a-pasta-recipe-has-triggered-a-diplomatic-row-between-uk-and-italy))
- **2023** A NYT Cooking cacio e pepe recipe (cheese 'crema' made in advance, pasta cooked past al dente) set off a reader backlash. ([gamberorosso.it](https://www.gamberorosso.it/attualita/cacio-e-pepe-new-york-times-reazioni/), [gamberorosso.it](https://www.gamberorosso.it/notizie/la-cacio-e-pepe-si-fa-scotta-il-nyt-celebra-la-pasta-romana-ma-la-ricetta-fa-discutere/))
- **2025** Physicists won the Ig Nobel Prize for a 'scientific' cacio e pepe that adds cornstarch, which reopened the purist debate. ([dissapore.com](https://www.dissapore.com/notizie/la-formula-della-cacio-e-pepe-senza-grumi-vince-il-premio-ignobel-2025/))
- **n.d.** Spanish chef Dani García presented a cacio e pepe 'made with butter', reported as a reinvention. ([reportergourmet.com](https://reportergourmet.com/en/news/10277-cacio-e-pepe-its-made-with-butter-chef-dani-garcia-reinvents-italian-pasta-heres-how))

### Pasta alla gricia

- **2015** On MasterChef Italia, judge Carlo Cracco said a contestant's traditional gricia needed onion. Coming days after his garlic-in-amatriciana scandal, it was covered as a 'new gaffe' and set off duelling 'gricia with onion' and 'gricia without onion' articles. ([archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-cipolla-nella-gricia-nuova-gaffe-dopo-amatriciana-2103438), [dissapore.com](https://www.dissapore.com/grande-notizia/ricette-romane-gricia-senza-cipolla/))

### Fettuccine all'Alfredo (fettuccine al burro)

- **n.d.** The Pasta Queen (Nadia Caterina Munno), an Italian TikTok cook, criticised chicken Alfredo and said traditional Alfredo has no heavy cream; US food media widely covered it. ([thedailymeal.com](https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen))
- **n.d.** Italian media debate whether the dish is Roman or American. Dissapore mocked plans for an 'Alfredo academy' to market it, and Rolling Stone Italia called Alfredo pasta a cultural short circuit. ([dissapore.com](https://www.dissapore.com/notizie/le-fettuccine-alfredo-erano-una-barzelletta-ora-ci-facciamo-unaccademia-per-venderle-meglio/), [rollingstone.it](https://www.rollingstone.it/?p=1014949))
- **n.d.** The Roman restaurant Alfredo alla Scrofa launched a jarred Alfredo sauce for home use (butter and Parmigiano, no cream). ([gamberorosso.it](https://www.gamberorosso.it/notizie/la-salsa-alfredo-arriva-a-casa-in-barattolo-idea-del-mitico-ristorante-romano-delle-fettuccine))

### Tagliatelle al ragù alla bolognese

- **2019** Bologna mayor Virginio Merola campaigned against 'spaghetti bolognese'. He asked people to send photos of the dish from around the world, calling it a dish that does not exist, and promoted tagliatelle al ragù instead. ([cbc.ca](https://www.cbc.ca/lite/story/1.5041024), [italysegreta.com](https://italysegreta.com/it/gli-spaghetti-alla-bolognese-non-esistono/))
- **2016** The New York Times shared its 'Rigatoni with White Bolognese' recipe (with cream and no tomato) on Facebook, and a wave of Italian comments called it a sacrilege. Bruno Barbieri, a TV chef from the province of Bologna, replied with his own traditional ragù. ([cms.thelocal.com](https://cms.thelocal.com/?p=384656), [scattidigusto.it](https://www.scattidigusto.it/ricetta-rigatoni-bolognese-facebook-nyt), [dissapore.com](https://www.dissapore.com/notizie/spaghetti-alla-bolognese-non-esistono-new-york-times/), [international.agi.it](https://international.agi.it/international/hands_off_from_the_traditional_bolognese_ragu-1021976/news/2016-08-22/), [vice.com](https://vice.com/en/article/italians-still-outraged-over-new-york-times-14-year-old-bolognese-recipe))
- **2023** On 20 April 2023 the Accademia Italiana della Cucina updated its 1982 registered ragù recipe. The new text replaces the 'cartella' cut with coarsely ground beef, specifies fresh pancetta and olive oil, makes milk optional and allows a light broth, even from a stock cube. The change made national news. ([dissapore.com](https://www.dissapore.com/notizie/ragu-alla-bolognese-aggiornata-la-ricetta-ufficiale-pancetta-e-manzo-al-posto-della-cartella/), [accademiaitalianadellacucina.it](https://accademiaitalianadellacucina.it/en/node/62013), [derstandard.at](https://www.derstandard.at/story/3000000167452/offiziellbolognese-rezept-geaendert), [lapresse.it](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/))
- **n.d.** Gambero Rosso called a TasteAtlas map of Italian ragùs a gaffe. ([gamberorosso.it](https://www.gamberorosso.it/notizie/ricette/la-mappa-sbagliata-dei-ragu-italiani-la-gaffe-di-tasteatlas/))
- **n.d.** Italians reacted online to New York Times recipes for a vegan Bolognese and a polenta lasagna. ([wantedinrome.com](https://www.wantedinrome.com/news/vegan-bolognese-and-polenta-lasagna-italians-react-to-new-york-times-recipes.html))
- **2026** A Michelin-starred Spanish chef published a 'revisited' ragù with three eggs; the headline reports furious reactions ('Ma cosa è, una frittata?'). LEAD ONLY: seen as a search result, never opened, and which ragù it means is not confirmed, so eggs are NOT listed as a ragù intruder (popular-posts sweep; culinary lens declined it). ([ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2026/08/03/ma-cosa-e-una-frittata-lo-chef-spagnolo-stellato-nandu-jubany-ha-rivisitato-il-sacro-ragu-con-tre-uova-polemiche-furiose-per-la-provocazione-in-cucina/8467552/2/))

### Lasagne verdi alla bolognese

- **n.d.** A New York Times polenta lasagna recipe, published alongside a vegan Bolognese, drew Italian reactions online. ([wantedinrome.com](https://www.wantedinrome.com/news/vegan-bolognese-and-polenta-lasagna-italians-react-to-new-york-times-recipes.html))

### Trofie o trenette al pesto genovese

- **2015** Davide Oldani, a Michelin-starred chef from the Milan area, defended putting butter in pesto as traditional. Genoa called it 'stuff for the Milanese'. ([dissapore.com](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-ci-mette-il-burro/), [dissapore.com](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-burro/))
- **n.d.** Massimo Bottura's 'pesto' with parsley and mint, served on fusilli instead of trofie, angered Genoese commenters. ([archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/video/massimo-bottura-pesto-genovese-video-2844499))
- **2025** A Milan restaurant's video showed pansoti, which Ligurians dress with walnut sauce, topped with pesto. It went viral, drew sarcastic replies from Genoa, and the restaurant answered with a self-mocking follow-up. ([mentelocale.it](https://www.mentelocale.it/genova/86110-pansoti-col-pesto-l-errore-in-cucina-del-ristorante-milanese-diventa-virale-sui-social.htm))
- **2024** Italian food writers have mocked Jamie Oliver's 'Italian' recipes, including pasta with pesto, and a 2024 Linkiesta column ('E lo chiamano pesto') returned to the subject. The often-repeated kale/walnut pesto outrage was NOT confirmed: no Italian backlash article about those jars was found (popular-posts sweep). ([dissapore.com](https://www.dissapore.com/grande-notizia/jamie-oliver-difendiamo-la-cucina-italiana-dal-cuocastro/), [linkiesta.it](https://www.linkiesta.it/2024/02/e-lo-chiamano-pesto/))

### Tortellini in brodo

- **2019** A pork-free chicken 'tortellino dell'accoglienza' was proposed for Bologna's San Petronio celebrations so that Muslim guests could share the dish. It sparked a national political and culinary row about tradition. ([gamberorosso.it](https://www.gamberorosso.it/notizie/storie/tortellino-di-pollo-la-storia-ricetta-originaria/), [scattidigusto.it](https://www.scattidigusto.it/tortellino-con-il-pollo-o-dellaccoglienza-la-ricetta-dellartusi))

### Spaghetti alle vongole

- **2023** Bruno Barbieri (MasterChef Italia judge) posted spaghetti alle vongole finished with butter around 23 December 2023. Italian social media erupted, users said they would send it back, and he replied that he did not care. Gambero Rosso defended him by citing Artusi. ([ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2023/12/24/bruno-barbieri-cucina-gli-spaghetti-alle-vongole-con-il-burro-e-scoppia-il-putiferio-li-rimanderei-indietro-lui-non-me-ne-frega-niente/7393250/), [dissapore.com](https://www.dissapore.com/notizie/bruno-barbieri-mette-il-burro-negli-spaghetti-con-le-vongole-e-scatena-il-panico/), [liberoquotidiano.it](https://www.liberoquotidiano.it/news/spettacoli/37963399/bruno-barbieri-rissa-burro-spago-vongole-chef-ride/))
- **n.d.** On Radio Deejay, Antonino Cannavacciuolo mocked the 'snobs' of spaghetti alle vongole and said tomato is fine if you like it, reopening the white-versus-red debate. ([dissapore.com](https://www.dissapore.com/grande-notizia/antonino-cannavacciuolo-spaghetti-alle-vongole-con-o-senza-pomodoro/))
- **2019** An Italian restaurant in London refused a customer's request for Parmigiano on a fish dish (crab ravioli). Starred chef Luca Marchini answered that fish and cheese do meet in Italian classics, and the Parmigiano Reggiano consortium listed dishes where they work. ([firstonline.info](https://www.firstonline.info/en/parmigiano-sul-pesce-e-chi-ha-detto-che-non-si-puo/), [open.online](https://www.open.online/2019/05/01/il-ristoratore-che-ha-blastato-il-cliente-inglese-per-il-parmigiano-sul-pesce-educhiamo-gli-ospiti-lintervista/), [dissapore.com](https://www.dissapore.com/notizie/formaggio-sul-pesce-il-consorzio-del-parmigiano-reggiano-risponde-allo-chef-di-londra/))

### Spaghetti aglio, olio e peperoncino

- **2024** The New York Times published 'midnight pasta', an aglio olio e peperoncino with roasted garlic, black pepper, parsley and grated Parmigiano. Gambero Rosso and Affaritaliani covered it as a scandal, though one Gambero Rosso piece concluded that only the name was wrong. ([gamberorosso.it](https://www.gamberorosso.it/notizie/aglio-olio-peperoncino-new-york-times/), [gamberorosso.it](https://www.gamberorosso.it/notizie/omaggio-del-new-york-times-aglio-olio-e-peperoncino-formaggio/), [affaritaliani.it](https://www.affaritaliani.it/food/il-new-york-times-omaggia-la-pasta-aglio-olio-peperoncino-ma-rovina-tutto-894015.html))
- **2025** Bruno Barbieri shared an 'unconventional' aglio olio e peperoncino with butter and lardo after the film FolleMente made the dish trendy. ([gamberorosso.it](https://www.gamberorosso.it/attualita/spaghetto-aglio-olio-peperoncino-bruno-barbieri/))

### Spaghetti alla puttanesca

- **n.d.** The origin story is disputed. Sandro Petti of Ischia's Rancio Fellone said he improvised 'una puttanata qualsiasi' (any old rubbish) for late-night friends from four tomatoes, olives and capers (Il Golfo, 2005). Others place it in Naples' Quartieri Spagnoli, and the name appears in print as early as Raffaele La Capria's 1961 novel 'Ferito a morte'. ([gamberorossointernational.com](https://www.gamberorossointernational.com/news/the-history-of-spaghetti-alla-puttanesca-and-where-to-eat-it-in-naples), [blogsicilia.it](https://www.blogsicilia.it/food-drink/puttanesca-spaghetti-sandro-petti-cucina-mediterranea/798491/), [vice.com](https://www.vice.com/it/article/origini-nome-pasta-alla-puttanesca/), [dobianchi.com](https://dobianchi.com/2010/07/14/rewind-the-origins-of-sugo-alla-puttanesca/))

### Pasta alla Norma

- **2026** For the Giornata nazionale della Pasta alla Norma (23 September), the dish was celebrated in the Italian Senate. Senate President Ignazio La Russa revealed his 'secret': a pinch of sugar to balance the tomato's acidity, a nod to the sugar-in-tomato debate. ([lasicilia.it](https://www.lasicilia.it/video/la-sicilia-tv/3076004/la-pasta-alla-norma-al-senato-il-presidente-la-russa-svela-il-segreto-della-sua-ricetta.html), [lasicilia.it](https://www.lasicilia.it/news/gusto/3075792/il-d-day-della-pasta-alla-norma-il-capolavoro-della-cucina-siciliana-sbarca-al-senato.html))

### Spaghetti al pomodoro

- **2022** YouGov's 'Italian food crimes' survey ranked ketchup on pasta as the worst offence for Italians (-82). It was picked up worldwide, including in a Euronews reaction video by an Italian-born YouTube cook. ([business.yougov.com](https://business.yougov.com/content/40810-italian-food-crimes), [euronews.com](https://www.euronews.com/2022/02/18/angry-chef-reacts-to-the-11-worst-crimes-committed-against-italian-food))
- **2022** MasterChef Italia: a contestant tempted to add sugar to her tomato sauce drew 'improponibile' from Cannavacciuolo and 'Satana!' from Barbieri. ([ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2022/01/14/masterchef-2021-lo-zucchero-nella-salsa-di-pomodoro-per-cannavacciuolo-e-improponibile-e-reagisce-cosi-video/6455970/))
- **2023** US TikToker Ben Reid filmed himself 'p-ssing off Italians' in Italian restaurants, putting ketchup on a pizza Margherita and cutting spaghetti with scissors. Staff reacted with horror. This was ketchup on pizza, not on pasta. ([ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2023/08/02/ketchup-sulla-pizza-spaghetti-tagliati-con-le-forbici-e-ghiaccio-nel-vino-rosso-il-tiktoker-americano-uccide-la-cucina-italiana/7249975/), [dissapore.com](https://www.dissapore.com/notizie/tiktoker-infrange-i-tabu-della-cucina-italiana-ketchup-nella-pizza-e-pasta-tagliata-con-le-forbici))

### Pizza Margherita

- **2023-2024** Gino Sorbillo puts a 'Margherita con Ananas' (with cooked pineapple) on the menu of one of his Naples pizzerias. Italian TV and newspapers debate it, and Flavio Briatore, owner of the rival chain Crazy Pizza, criticises it. ([ansa.it](https://ansa.it/amp/english/news/lifestyle/food_wine/2023/12/30/famed-naples-pizza-maker-adds-pineapple-spurring-row_1717aa08-bf5e-4cc7-8a36-faf3e42e72fd.html), [thelocal.it](https://www.thelocal.it/20240104/have-italians-finally-digested-the-idea-of-pineapple-on-pizza), [scattidigusto.it](https://www.scattidigusto.it/briatore-apre-crazy-pizza-napoli-e-critica-pizza-e-ananas-di-sorbillo))
- **2023** Sorbillo follows up with a joke Margherita topped with ketchup made from datterini tomatoes, saying online critics had dared him to make one. ([scattidigusto.it](https://www.scattidigusto.it/2023/12/31/pizza-all-ananas-con-il-ketchup-gino-sorbillo-rilancia-senza-timori), [thelocal.it](https://www.thelocal.it/20240104/have-italians-finally-digested-the-idea-of-pineapple-on-pizza))
- **2022** The EU reserves the name 'Pizza Napoletana' (STG), and Coldiretti presents it as taking fake Neapolitan pizzas off menus. Some Italian food writers criticise the rule. ([agi.it](https://www.agi.it/cronaca/news/2022-11-30/ue-coldiretti-fuorilegge-falsa-pizza-napoletana-via-menu-19009549/), [scattidigusto.it](https://www.scattidigusto.it/2022/12/01/pizza-napoletana-stg-nome-registrato/))
- **2018** In 2018 Carlo Cracco launched a pricey Margherita with a multigrain dough at his Milan restaurant; Italians mocked it online, showing that even the dough can be 'wrong' (influencer sweep). ([bangordailynews.com](https://bangordailynews.com/2018/03/13/living/food/a-michelin-starred-italian-chef-made-a-whole-grain-pizza-outrage-ensued/), [bighospitality.co.uk](https://www.bighospitality.co.uk/Article/2018/03/15/The-lowdown-crimes-against-Italian-cuisine))

### Pizza Marinara

- **2022** Food site Scatti di Gusto questions chef Valerio Braschi's 'pizza marinara in bustina' (a marinara in a packet) served at his restaurant. ([scattidigusto.it](https://www.scattidigusto.it/2022/02/12/valerio-braschi-pizza-marinara-in-bustina-ristorante-perche/))

### Pizza Capricciosa (e Quattro Stagioni)

- **2025 (inferred)** Pizzaiolo-influencer Errico Porzio says on video that the capricciosa in Salerno traditionally has würstel. An online row follows, and he sells capricciosas for 1 euro on 2 September to end it. ([scattidigusto.it](https://www.scattidigusto.it/errico-porzio-salerno-capricciosa-wurstel-pizze-1-euro))

### Pizza napoletana: condimenti proibiti e condimenti tollerati

- **2017** Scatti di Gusto reports pineapple pizza 'jumping the queue' for one evening at Gino Sorbillo's Naples pizzeria, and Dissapore reports that Sorbillo 'gives in' to pineapple pizza. ([scattidigusto.it](https://www.scattidigusto.it/2017/06/10/flash-gino-sorbillo-pizza-ananas), [dissapore.com](https://www.dissapore.com/notizie/gino-sorbillo-cede-alla-pizza-con-lananas/))
- **2023-2024** Sorbillo's 'Margherita con Ananas' causes a national uproar on social media and in the press; Dissapore accuses him of mocking tradition for likes. ([open.online](https://www.open.online/2023/12/31/sorbillo-pizza-ananas-reazione-utenti-video/), [cbc.ca](https://www.cbc.ca/lite/story/1.7107921), [dissapore.com](https://www.dissapore.com/cucina/gino-sorbillo-ha-finalmente-capito-che-sfottere-la-tradizione-fa-ottenere-like/))
- **2023** In December 2023, around the anniversary of the UNESCO listing of the art of the Neapolitan pizzaiuolo, Coldiretti opens a 'Pizzeria degli Orrori' (Pizzeria of Horrors) in Naples. It shows foreign pizzas with toppings such as pineapple, banana, zebra, kangaroo, snake, crickets, chicken in yogurt and ketchup. Dissapore calls it a sign of how intolerant Italians can be about food. ([tg24.sky.it](https://tg24.sky.it/lifestyle/2023/12/07/pizza-zebra-yogurt-dati), [dissapore.com](https://www.dissapore.com/notizie/la-pizzeria-degli-orrori-di-coldiretti-e-il-sintomo-di-quanto-riusciamo-a-essere-intolleranti/))
- **2024** On MasterChef Italia, a contestant serves a pineapple pizza in a pizza challenge, and judge Antonino Cannavacciuolo reacts sceptically. ([gamberorosso.it](https://www.gamberorosso.it/attualita/pizza-ananas-cannavacciuolo-masterchef/))
- **2026** Franco Pepe tells AGI that pineapple pizzas are unfairly demonised and that customers keep asking for his 'AnaNascosta', served since 2019. ([agi.it](https://www.agi.it/cronaca/news/2026-11-05/ananas-pizza-tradizione-39893064/amp/))
- **2026** Italian chef Davide Tamburella is reportedly fired by a Brisbane restaurant after refusing to make ham-and-pineapple pizza for a private function. The case reportedly goes to Australia's Fair Work Commission. ([ewn.co.za](https://www.ewn.co.za/2026/11/08/italian-chef-fired-for-refusing-to-put-pineapple-on-pizza), [dexerto.com](https://www.dexerto.com/food/italian-chef-fired-after-refusing-to-put-pineapple-on-pizza-3425033/))
- **2022** Domino's leaves Italy after seven years and at most 29 stores. Its Italian franchisee, ePizza, seeks protection from creditors and blames delivery apps, while media frame it as Italians rejecting American pizza. ([ilpost.it](https://www.ilpost.it/2022/08/10/chiusura-dominos-pizza-italia-fallimento-franchising/), [ktvz.com](https://ktvz.com/news/2022/08/10/dominos-tried-to-sell-pizza-to-italians-it-failed/))
- **2019** Franco Pepe (Pepe in Grani, Caiazzo) created 'AnaNascosta', a fried cone with pineapple wrapped in prosciutto, and defended it against critics (popular-posts sweep). ([gamberorosso.it](https://www.gamberorosso.it/ristoranti/ananas-pizza-franco-pepe/), [italysegreta.com](https://italysegreta.com/it/the-italian-pizzaioli-defying-an-unforgivable-taboo/))
- **2024** After the pineapple row, Del Monte used Sorbillo's pineapple pizza in advertising (influencer and popular-posts sweeps). ([scattidigusto.it](https://www.scattidigusto.it/2024/01/06/pizza-all-ananas-sorbillo-pubblicita-del-monte), [lavocedinewyork.com](https://lavocedinewyork.com/food/2024/01/07/lananas-contamina-napoli-anche-da-sorbillo-arriva-la-pinapple-pizza))
- **2024** Lionfield, the Italian 'pasta police' creators, reacted to a Kuala Lumpur 'apam balik' (sweet peanut pancake) pizza topped with pepperoni; the video reportedly passed 2 million views (popular-posts sweep). ([nst.com.my](https://nst.com.my/amp/news/nst-viral/2024/12/1146633/nstviral-apam-balik-pizza-leaves-italian-content-creators-disbelief))

## Accepted in Italy — the game must NOT mock these

| Dish | Ingredient / practice | Note | Source |
|---|---|---|---|
| carbonara | Egg yolks only, or yolks plus some whole eggs | Both are normal; Monosilio uses yolks only. | [scattidigusto.it](https://www.scattidigusto.it/carbonara-ricetta-perfetta-luciano-monosilio) |
| carbonara | Some Parmigiano Reggiano or Grana Padano blended into the Pecorino | Only a full swap is mocked; Monosilio blends Grana Padano with Pecorino (AGI). | [agi.it](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/) |
| carbonara | Rigatoni or mezze maniche instead of spaghetti | Common in Roman trattorie. | culinary lens; popular-posts sweep (general knowledge) |
| carbonara | Pancetta when guanciale is unavailable | CONTESTED, not a crime: the 1954 recipe used it and Italian sites still offer it. Treat as a mini-boss, not a villain. | [dissapore.com](https://www.dissapore.com/ricette/ricetta-spaghetti-alla-carbonara-con-pancetta/) |
| amatriciana | A splash of dry white wine | Allowed by the STG and in Amatrice's own list. | [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatrice-contro-carlo-cracco-niente-aglio-nellamatriciana-foto-2096529) |
| amatriciana | A spoonful of extra virgin olive oil | In the 2015 Amatrice De.C.O. recipe. | [gazzettadelgusto.it](https://gazzettadelgusto.it/ricette/salse-sughi/storia-e-ricetta-originale-dellamatriciana/?print=pdf) |
| amatriciana | Black pepper instead of, or with, chili | The STG explicitly allows chili and/or pepper. | [elezioni2020.regione.veneto.it](https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345) |
| amatriciana | Spaghetti (Amatrice) or bucatini (Rome); rigatoni and mezze maniche in Roman trattorie | All accepted shapes. | [tg24.sky.it](https://tg24.sky.it/lifestyle/2026/03/06/giornata-amatriciana-storia-ricetta-originale) |
| amatriciana | Onion in Roman home versions | CONTESTED: excluded by the STG, but constant in recipes until the mid-1960s (Gambero Rosso). Mini-boss material, not a villain. | [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/) |
| cacioepepe | A pinch of starch | The 2025 Ig Nobel physics paper and some Roman chefs use it. | [dissapore.com](https://www.dissapore.com/notizie/la-formula-della-cacio-e-pepe-senza-grumi-vince-il-premio-ignobel-2025/) |
| cacioepepe | Some Parmigiano blended with the Pecorino | Tolerated in chef versions (reportedly Borghese); full replacement is not. | [centrometeoitaliano.it](https://www.centrometeoitaliano.it/attualita/alessandro-borghese-la-ricetta-e-i-segreti-per-cucinare-al-meglio-la-sua-famosa-cacio-e-pepe-172107/) |
| cacioepepe | Dried spaghetti or short shapes instead of tonnarelli | Seen all over Rome. | culinary lens |
| gricia | Any common shape (rigatoni, mezze maniche, spaghetti, bucatini, tonnarelli); a splash of white wine | Shape is free; wine is a minority practice, not a crime. | culinary lens |
| alfredo | Parmigiano Reggiano, lots of butter, pasta water, black pepper | Parmigiano is CORRECT here (unlike carbonara). Do not mock it. | [gamberorosso.it](https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo) |
| ragu | Whole milk, olive oil, light broth even from a stock cube, nutmeg | All in the Accademia's 2023 registered text. | [accademiaitalianadellacucina.it](https://accademiaitalianadellacucina.it/en/node/62013) |
| ragu | Mixed beef and pork; knife-chopped meat; red or white wine | Admitted variants in the 2023 text. | [bo.camcom.gov.it](https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/Rassegna/Carlino21042023.pdf) |
| ragu | Chicken livers, sausage, peas, dried porcini | Optional enrichments suggested with the 2023 update. Peas are fine here even though they are mocked in carbonara. | [bo.camcom.gov.it](https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/Rassegna/Corriere1.pdf) |
| ragu | Cream when the ragù dresses DRY pasta | Bolognese custom; never with tagliatelle. | [assets.culturabologna.it](https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf) |
| ragu | Ragù on spaghetti (outside Bologna) | CONTESTED: Bologna objects loudly, but Italians nationally rated it acceptable (YouGov 2022, net +81). | [cbc.ca](https://www.cbc.ca/lite/story/1.5041024) |
| lasagne | Béchamel; yellow egg sheets | Béchamel is canonical in Bologna; yellow sheets are a common home variation. | [bolognawelcome.com](https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese) |
| lasagne | Ricotta, little meatballs, hard-boiled eggs, fior di latte | Authentic in Neapolitan Carnival lasagna. Intruders ONLY in the Bologna level; the game should say so. | culinary lens |
| pesto | Potatoes and green beans boiled with trenette or trofie | Traditional ("avvantaggiate"). | culinary lens |
| pesto | Grana Padano; Pecorino Romano, Sardo or Fiore Sardo | Accepted in descriptions of the Consorzio recipe. | culinary lens |
| pesto | Garlic (even a lot, or very little) | Garlic is canonical in pesto although banned from carbonara and amatriciana; garlic-light pesto is a known request. | [scattidigusto.it](https://www.scattidigusto.it/pesto-al-mortaio-la-ricetta-di-roberto-panizza-da-fare-a-casa/) |
| pesto | Rocket pesto or walnut sauce as their own recipes | Wrong only when passed off as pesto genovese. | culinary lens |
| tortellini | Meat ragù on "dry" tortellini; capon broth | Genuine Emilian options. | culinary lens |
| tortellini | Tortellini alla panna | CONTESTED: on many Bolognese menus; purists object. Mini-boss, not villain. | [assets.culturabologna.it](https://assets.culturabologna.it/ab561e4b-e4a3-4787-acf7-b342c5431bba-2021-tortellino-bolognese.pdf) |
| vongole | A few fresh cherry tomatoes; white wine; chili; lupini clams | The "in rosso" variant is accepted; only a heavy passata draws complaints. | [dissapore.com](https://www.dissapore.com/grande-notizia/antonino-cannavacciuolo-spaghetti-alle-vongole-con-o-senza-pomodoro/) |
| vongole | Milk in a chef's creamy garlic sauce; Artusi's historical butter-and-Parmigiano telline | Chef twist and historical recipe, not the Neapolitan classic; do not mock chefs' creative versions. | [centrometeoitaliano.it](https://www.centrometeoitaliano.it/attualita/spaghetti-alle-vongole-di-antonino-cannavacciuolo-il-segreto-per-farli-cremosi-la-ricetta-173794/) |
| aglioolio | Parsley; anchovies (aglio, olio e alici); toasted breadcrumbs; Pecorino in some Naples and Rome versions | Classic southern variants. | [gamberorosso.it](https://www.gamberorosso.it/notizie/omaggio-del-new-york-times-aglio-olio-e-peperoncino-formaggio/) |
| puttanesca | Anchovies; oregano; Taggiasca or Kalamata olives; tuna (home variant) | All accepted. | culinary lens; sources lens |
| norma | Pecorino as a fallback cheese; spaghetti; a garlic clove; ricotta infornata in Messina | Regional and household variants. | [foodinfo.it](https://foodinfo.it/?p=2902) |
| pomodoro | Garlic OR onion (or spring onion, or chili); Parmigiano or Pecorino on top | Free choice; cheese on tomato pasta is fine (unlike seafood pasta). | [dissapore.com](https://www.dissapore.com/grande-notizia/sughi-al-pomodoro-veloci-5-errori/) |
| pomodoro | A pinch of sugar; a potato or carrot against acidity | Sugar is CONTESTED (a real home habit, mocked by chefs); potato and carrot are accepted fixes. | [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2022/01/14/masterchef-2021-lo-zucchero-nella-salsa-di-pomodoro-per-cannavacciuolo-e-improponibile-e-reagisce-cosi-video/6455970/) |
| margherita | A sprinkle of real grated Parmigiano or pecorino; fior di latte or buffalo mozzarella; cherry tomatoes | AVPN rules list grated cheese; the STG lists cherry tomatoes and buffalo mozzarella. | [pizzanapoletana.org](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) |
| marinara | A basil leaf; anchovies | Normal pizzeria variations. | culinary lens |
| diavola | Spicy salami, 'nduja, chilli oil | The Italian way to make pizza hot. | culinary lens (general knowledge) |
| capricciosa | Anchovies; the Quattro Stagioni quarter layout | Known variants. | culinary lens |
| pizza_toppings | Würstel e patatine (frankfurters and fries) | A kids' favourite on Italian pizzeria menus. Do not mock it. | [scattidigusto.it](https://www.scattidigusto.it/2023/12/30/pizza-allananas-condanni-sorbillo-e-mangi-la-wurstel-e-patatine/) |
| pizza_toppings | Tonno e cipolla (tuna and onion) | A pizzeria staple; even top Naples pizzerias make one. | [scattidigusto.it](https://www.scattidigusto.it/2023/05/31/pizza-tonno-e-cipolla-palazzo-petrucci-napoli/) |
| pizza_toppings | Cream (panna) and sweetcorn (mais) | COMMON in Italian pizzerias; purists sneer but they are not foreign crimes. | [scattidigusto.it](https://www.scattidigusto.it/2024/03/14/identita-di-pizza-2024-la-disobbedienza-e-a-tutta-panna-e-fiordilatte/) |
| pizza_toppings | Sausage and friarielli; cooked ham, mushrooms, artichokes, olives, anchovies; bell peppers | Classic Italian toppings. | culinary lens |
| pizza_toppings | Chocolate-hazelnut spread on a dessert pizza | Accepted as dessert, never mixed with savoury toppings. | culinary lens (general knowledge) |
| pizza_toppings | Pineapple from top Italian pizzaioli | CONTESTED: a few star pizzaioli serve it; most Italians still reject it. Keep it as the boss, but acknowledge the defectors. | [gamberorosso.it](https://www.gamberorosso.it/notizie/pizza-ananas-seu-pepe-lombardi/) |

Cross-dish reminders: garlic is canonical in pesto, vongole and aglio olio but an intruder in carbonara, amatriciana, gricia and Bolognese ragù; onion is an intruder in carbonara and gricia but part of the ragù soffritto; peas are mocked in carbonara but accepted in ragù; cream is mocked in carbonara, Alfredo, cacio e pepe and pesto but common on Italian pizza; Parmigiano is wrong in cacio e pepe and amatriciana but correct in Alfredo, ragù and lasagne.

## Most-cited dish + intruder combinations (top 20)

Editor ranking: the popular-posts sweep's top-20 order, adjusted to the merged popularity scores (see "Disagreements resolved").

| # | Dish | Intruder | Why it ranks | Best source |
|---|---|---|---|---|
| 1 | Spaghetti alla carbonara | Panna | The most-cited carbonara complaint: YouGov net -45 among Italians, the 2016 French video, the 2017 celebrity-chef row and Coldiretti reports. | [yougov.com](https://yougov.com/en-us/articles/40810-italian-food-crimes) |
| 2 | Spaghetti al pomodoro | Ketchup | Ketchup on pasta is the single worst "food crime" for Italians in YouGov's 17-market survey (net -82). | [dissapore.com](https://www.dissapore.com/notizie/pasta-con-il-ketchup-per-gli-italiani-e-il-crimine-alimentare-piu-grave) |
| 3 | Pizza napoletana: condimenti proibiti e condimenti tollerati | Ananas | YouGov net -63 among Italians (third worst); a famous Naples pizzaiolo's pineapple pizza caused a national uproar in 2023-24. Contested. | [ksl.com](https://www.ksl.com/article/50833479/national-uproar-in-italy-after-chef-puts-pineapple-on-pizza) |
| 4 | Spaghetti alla carbonara | Bacon (affumicato) | The standard foreign swap for guanciale; Coldiretti's 2024 Carbonara Day report and the 2021 US newspaper row. | [agi.it](https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/) |
| 5 | Spaghetti alla carbonara | Cipolla | The 2016 French one-pot video ("Carbonaragate") that led to Carbonara Day. | [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/video-carbonara-sbagliata-francese-cipolla/) |
| 6 | Tonnarelli cacio e pepe | Burro | The 2025 British recipe row that reached the British ambassador in Rome. | [euronews.com](https://www.euronews.com/culture/2025/08/11/explained-how-a-pasta-recipe-has-triggered-a-diplomatic-row-between-uk-and-italy) |
| 7 | Spaghetti / Bucatini all'amatriciana (Amatriciana Tradizionale STG) | Aglio | Excluded by the EU STG; the 2015 TV-chef row with Amatrice's town council. | [dissapore.com](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/) |
| 8 | Spaghetti alla carbonara | Pomodoro | The 2021 "smoky tomato carbonara" condemned by Coldiretti. | [uk.finance.yahoo.com](https://uk.finance.yahoo.com/news/stop-madness-nyt-angers-italians-121938305.html) |
| 9 | Spaghetti alla carbonara | Parmigiano (al posto del pecorino) | A regular item in Coldiretti complaints and the 2021 US recipe; a blend is accepted. Contested. | [en.ilsole24ore.com](https://en.ilsole24ore.com/art/carbonara-pomodoro-e-bacon-ricetta-new-york-times-fa-infuriare-coldiretti-ADdj51LB) |
| 10 | Tagliatelle al ragù alla bolognese | Spaghetti | Bologna's loudest complaint (the mayor's 2019 photo campaign), though Italians nationally accept it. Contested. | [cbc.ca](https://www.cbc.ca/lite/story/1.5041024) |
| 11 | Fettuccine all'Alfredo (fettuccine al burro) | Pollo | "Chicken Alfredo" is the US version Italian creators mock most; the 2023 Trevi Fountain sign said chicken on pasta is a crime. | [italianismo.com.br](https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/) |
| 12 | Spaghetti alle vongole | Parmigiano / formaggio grattugiato | Cheese on seafood pasta: YouGov net -39 among Italians; the classic tourist mistake. Contested as a custom, not a law. | [wantedinrome.com](https://www.wantedinrome.com/news/italy-11-food-crimes-italian-cuisine.html) |
| 13 | Spaghetti alla carbonara | Aglio | Named in chefs' carbonara mistakes lists, but the 1954 recipe used garlic. Contested. | [dissapore.com](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/) |
| 14 | Spaghetti alla carbonara | Pancetta | In the 2024 canned and 2025 jarred foreign carbonaras; a tolerated home fallback. Contested. | [brusselstimes.com](https://brusselstimes.com/eu-affairs/1846923/italian-minister-fumes-at-delhaizes-ready-made-carbonara-sauce/) |
| 15 | Fettuccine all'Alfredo (fettuccine al burro) | Panna | The defining ingredient of US "Alfredo sauce"; absent from the Roman original. Few dedicated Italian outrage articles. | [gamberorosso.it](https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo) |
| 16 | Spaghetti / Bucatini all'amatriciana (Amatriciana Tradizionale STG) | Cipolla | Excluded by the STG and Amatrice; the 2020 TV row. Contested by history. | [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/) |
| 17 | Pizza napoletana: condimenti proibiti e condimenti tollerati | Ketchup | The 2023 TikTok ketchup-on-Margherita videos and a pizzaiolo's provocation. | [dissapore.com](https://www.dissapore.com/notizie/tiktoker-infrange-i-tabu-della-cucina-italiana-ketchup-nella-pizza-e-pasta-tagliata-con-le-forbici) |
| 18 | Spaghetti alla carbonara | Piselli | Named in Coldiretti's 2024 report and the 2020 celebrity-chef video. | [ilnordest.it](https://www.ilnordest.it/economia/la-carbonara-con-panna-piselli-burro-e-basilico-tz2dlxce) |
| 19 | Spaghetti alla carbonara | Funghi | The 2020 celebrity-chef carbonara that sparked a "revolt in Rome" (sweep-only). | [scattidigusto.it](https://www.scattidigusto.it/2020/02/21/la-carbonara-di-gordon-ramsay-e-rivolta-a-roma-e-dintorni/) |
| 20 | Trofie o trenette al pesto genovese | Burro | The 2015 star-chef butter pesto that Genoa called "stuff for the Milanese". Contested by history. | [dissapore.com](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-ci-mette-il-burro/) |

Runners-up: pesto + cream, tortellini + cream (both 4, contested for tortellini), cacio e pepe + Parmesan or cream (2025 row), gricia + onion (2015), tiramisù + whipped cream, carbonara + white wine (2017), carbonara + cooked ham, carbonara + parsley.

## Italian influencer chefs and creators consulted

None of these people should be named in-game; use archetypes ("the Purist Chef", "the TV Judge", "the Pizzaiolo Provocateur").

- **Luciano Monosilio** — Roman restaurants; press interviews; Italia Squisita videos. Roman chef, formerly Michelin-starred at Pipero, widely called the 'king of carbonara'; his advice anchors the Italian pasta makers' (Unione Italiana Food) carbonara mistakes guide. Sources: [scattidigusto.it](https://www.scattidigusto.it/carbonara-ricetta-perfetta-luciano-monosilio), [agi.it](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/), [welovepasta.it](https://welovepasta.it/wp-content/uploads/2021/03/Focus-segreti-MyCarbonara.doc), [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2016/03/31/luciano-monosilio-la-cucina-e-lavoro-la-parte-spettacolare-ce-ma-non-e-tutto/2597245/), [scmp.com](https://www.scmp.com/magazines/post-magazine/article/1862632/king-carbonara-luciano-monosilio-reveals-secrets-behind-his), [ciaobella.libsyn.com](https://ciaobella.libsyn.com/carbonara-luciano-monosilio-king-of-carbonara-of-romes-restaurant-scene)
- **Max Mariola** — YouTube, TikTok, Instagram, Facebook; Gambero Rosso Channel. Roman professional chef and one of Italy's biggest food creators (about 9M followers across platforms per Il Fatto Quotidiano 2024 and Open 2023, via the influencer sweep). NOT a purist: he has published onion carbonara, onion amatriciana and "spaghetti alla bolognese" videos, so cite him as a counter-voice too. Sources: [tg24.sky.it](https://tg24.sky.it/lifestyle/ricette/cacio-e-pepe-ricetta), [gamberorosso.it](https://www.gamberorosso.it/notizie/videoricette-spaghetti-cacio-e-pepe-di-max-mariola/), [gamberorosso.it](https://www.gamberorosso.it/notizie/ricette/la-ricetta-della-pasta-aglio-olio-e-peperoncino-secondo-max-mariola/), [gamberorosso.it](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/), [021.rs](https://www.021.rs/zivot/recepti/364824/video-ovo-je-tajna-najboljeg-bolonjez-sosa)
- **Vincenzo's Plate (Vincenzo Prosperi)** — YouTube (about 1.66M subscribers per the influencer sweep), own website. Italian-born, Australia-based cook whose "Italian Chef Reacts" videos target foreign versions; his motto is "NO CREAM IN CARBONARA!" (verified in a search snippet). Euronews used him as the "angry chef" for the YouGov food-crimes survey. Also publishes a pineapple pizza recipe, so not a pure absolutist. Sources: [vincenzosplate.com](https://www.vincenzosplate.com/history-of-carbonara/), [vincenzosplate.com](https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/), [euronews.com](https://www.euronews.com/culture/2022/02/18/angry-chef-reacts-to-the-11-worst-crimes-committed-against-italian-food), [vincenzosplate.com](https://www.vincenzosplate.com/italian-food-mistakes-americans-make/), [vincenzosplate.com](https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/comment-page-5/), [vincenzosplate.com](https://www.vincenzosplate.com/spaghetti-carbonara-recipe/)
- **Italia Squisita** — YouTube, Facebook (Italian food media brand). Produces chef videos with Roman professionals: a carbonara reaction video (De Maio, Martini, Monosilio) and a traditional-vs-gourmet cacio e pepe (Gargioli vs Bowerman). Audience size not verified. Sources: [youtube.com](https://www.youtube.com/watch?v=bnZ_70XyVAk), [italiasquisita.net](https://italiasquisita.net/it/video/carbonara-gli-chef-reagiscono-ai-video-piu-visti-al-mondo), [italiasquisita.net](https://italiasquisita.net/it/video-ricette/pasta-alla-carbonara-di-luciano-monosilio)
- **The Pasta Queen (Nadia Caterina Munno)** — TikTok, Instagram, books. Italian-born creator and cookbook author with a large US following; criticises chicken Alfredo and cream in Alfredo. "Chicken alfredo really rubs me the wrong way" verified in a search snippet (Nordot syndication). Sources: [thedailymeal.com](https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen), [nordot.app](https://nordot.app/1169279368201650965), [mashed.com](https://mashed.com/990011/the-tiktok-recipe-the-pasta-queen-wants-to-call-the-pasta-police-on)
- **Lionfield (Matteo Salvatori and Emiliano Santoro)** — YouTube, TikTok. Italian 'pasta police' creators ('Not approved!'), profiled by Tubefilter (2021) and the Washington Post (2026, syndicated); collaborated with The Pasta Queen. Sources: [iol.co.za](https://iol.co.za/ios/world/2026-01-06-bologna-in-the-carbonara-call-italys-pasta-police/), [tubefilter.com](https://www.tubefilter.com/2021/12/18/creators-on-the-rise-lionfield/amp/), [nst.com.my](https://nst.com.my/amp/news/nst-viral/2024/12/1146633/nstviral-apam-balik-pizza-leaves-italian-content-creators-disbelief)
- **Gino D'Acampo** — UK television (ITV This Morning), books. Italian TV chef in the UK; his 2010 live-TV rebuttal ('if my grandmother had wheels...') of a viewer's carbonara is widely shared. Sources disagree on whether the trigger was milk or ham. Keep out of in-game text (project rule). Sources: [vercel.food52.com](https://vercel.food52.com/story/20529-we-can-t-stop-laughing-at-this-old-british-tv-clip), [itv.com](https://itv.com/thismorning/food/classic-italian-carbonara-gino-dacampo-recipe), [ladbible.com](https://www.ladbible.com/entertainment/film-and-tv-food-gino-dacampo-has-a-go-at-kids-for-liking-pineapple-on-pizza-20180213), [hertfordshiremercury.co.uk](https://www.hertfordshiremercury.co.uk/news/uk-world-news/love-islands-davide-scolded-morning-7549287), [hellomagazine.com](https://www.hellomagazine.com/cuisine/20230119156005/gino-dacampo-reveals-restaurant-launch-gordon-ramsay-shock-family-life/)
- **Bruno Barbieri** — TV (MasterChef Italia judge), Instagram. Michelin-starred chef from the Bologna area. Defended traditional ragù against the 2016 US "white Bolognese"; but his butter-finished vongole (2023) and butter-and-lardo aglio olio (2025) caused rows, so he appears on both sides. Sources: [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2023/12/24/bruno-barbieri-cucina-gli-spaghetti-alle-vongole-con-il-burro-e-scoppia-il-putiferio-li-rimanderei-indietro-lui-non-me-ne-frega-niente/7393250/), [scattidigusto.it](https://www.scattidigusto.it/2019/01/17/video-carbonara-sbagliata-masterchef), [reportergourmet.com](https://reportergourmet.com/en/news/8374-carbonara-according-to-bruno-barbieri-the-top-chef-s-recipe-with-only-egg-yolks-and-butter), [travelemiliaromagna.it](https://www.travelemiliaromagna.it/en/?p=44632), [dissapore.com](https://www.dissapore.com/notizie/bruno-barbieri-mette-il-burro-negli-spaghetti-con-le-vongole-e-scatena-il-panico/), [scattidigusto.it](https://www.scattidigusto.it/2024/01/01/spaghetti-con-vongole-e-burro-cosa-non-va-nella-ricetta-di-barbieri/)
- **Antonino Cannavacciuolo** — TV (MasterChef Italia judge), social media. Two Michelin stars (Villa Crespi). Called sugar in tomato sauce 'improponibile'; says a little tomato in vongole is fine; uses milk in a creamy vongole (chef twist); sceptical of pineapple pizza. Sources: [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2022/01/14/masterchef-2021-lo-zucchero-nella-salsa-di-pomodoro-per-cannavacciuolo-e-improponibile-e-reagisce-cosi-video/6455970/), [dissapore.com](https://www.dissapore.com/grande-notizia/antonino-cannavacciuolo-spaghetti-alle-vongole-con-o-senza-pomodoro/), [gamberorosso.it](https://www.gamberorosso.it/attualita/pizza-ananas-cannavacciuolo-masterchef/), [scattidigusto.it](https://www.scattidigusto.it/2019/01/17/video-carbonara-sbagliata-masterchef), [fanpage.it](https://www.fanpage.it/napoli/zucchero-ragu-napoletano-cannavacciuolo-masterchef/)
- **Carlo Cracco** — TV (former MasterChef Italia judge), restaurants. Michelin chef whose 2015 garlic-in-amatriciana and onion-in-gricia remarks triggered the best-documented Roman pasta rows. A source of controversy, not of purist rules. Sources: [dissapore.com](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/), [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-chiede-scusa-per-amatriciana-con-aglio-era-solo-una-battuta-2097854), [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-cipolla-nella-gricia-nuova-gaffe-dopo-amatriciana-2103438), [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/foto-notizie/amatrice-contro-carlo-cracco-niente-aglio-nellamatriciana-foto-2096529), [dissapore.com](https://www.dissapore.com/chef/carlo-cracco-fa-sessantanni-tutte-le-polemiche-che-hanno-accompagnato-la-sua-carriera-fino-ad-ora/)
- **Alessandro Borghese** — TV (Sky), social media. TV chef; his published cacio e pepe reportedly blends Parmigiano with Pecorino (single secondary source), which is why Parmigiano in cacio e pepe is marked contested. Sources: [centrometeoitaliano.it](https://www.centrometeoitaliano.it/attualita/alessandro-borghese-la-ricetta-e-i-segreti-per-cucinare-al-meglio-la-sua-famosa-cacio-e-pepe-172107/)
- **Gino Sorbillo** — Naples pizzerias; Instagram and TikTok provocations. Perhaps Naples' best-known pizzaiolo. His 2023-24 pineapple Margherita, ketchup and banana pizzas were deliberate provocations that made pineapple 'contested'. Sources: [open.online](https://www.open.online/2023/12/31/sorbillo-pizza-ananas-reazione-utenti-video/), [dissapore.com](https://www.dissapore.com/notizie/gino-sorbillo-cede-alla-pizza-con-lananas/), [scattidigusto.it](https://www.scattidigusto.it/2023/12/31/pizza-all-ananas-con-il-ketchup-gino-sorbillo-rilancia-senza-timori), [gamberorosso.it](https://www.gamberorosso.it/notizie/gino-sorbillo-pizza-ananas-pizza-ketchup-intervista/), [lapresse.it](https://www.lapresse.it/cronaca/2023/12/29/gino-sorbillo-lancia-la-pizza-allananas-bufera-social/), [fanpage.it](https://www.fanpage.it/napoli/gino-sorbillo-pizza-ananas-mossa-marketing/)
- **Franco Pepe** — Pepe in Grani (Caiazzo). World-famous pizzaiolo whose 'AnaNascosta' (pineapple wrapped in prosciutto) has broken the pineapple taboo since 2019. Sources: [gamberorosso.it](https://www.gamberorosso.it/ristoranti/ananas-pizza-franco-pepe/), [agi.it](https://www.agi.it/cronaca/news/2026-11-05/ananas-pizza-tradizione-39893064/amp/)
- **Errico Porzio** — Naples pizzerias; social media. Pizzaiolo-influencer whose capricciosa-with-würstel video set off the only documented capricciosa row (2025, inferred). Sources: [scattidigusto.it](https://www.scattidigusto.it/errico-porzio-salerno-capricciosa-wurstel-pizze-1-euro)
- **Massimo Bottura** — Osteria Francescana; video. Three-Michelin-star chef whose parsley-and-mint "pesto" video angered the Genoese. Sources: [archivio.blitzquotidiano.it](https://archivio.blitzquotidiano.it/video/massimo-bottura-pesto-genovese-video-2844499)
- **Davide Oldani** — D'O restaurant; press. Michelin-starred Milan-area chef whose 2015 butter pesto ("as tradition requires") Genoa dismissed. Sources: [dissapore.com](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-ci-mette-il-burro/), [dissapore.com](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-burro/), [gustoblog.it](https://www.gustoblog.it/2015/02/12/il-pesto-alla-ligure-di-oldani-lo-chef-aggiunge-il-burro-alla-ricetta-tradizionale)
- **Roberto Panizza** — Il Genovese restaurant; World Pesto al Mortaio Championship. Genoese restaurateur and pesto championship organiser; the go-to purist voice on pesto ingredients. Sources: [scattidigusto.it](https://www.scattidigusto.it/pesto-al-mortaio-la-ricetta-di-roberto-panizza-da-fare-a-casa/), [scattidigusto.it](https://www.scattidigusto.it/ricetta-pesto-ingredienti-alternativi)
- **Irina Steccanella** — Italian TV cooking. TV cook who called sugar in tomato sauce 'l'Anticristo' (verified in a search excerpt by the sources lens). Sources: [trend-online.com](https://www.trend-online.com/food/salsa-di-pomodoro-acida-zucchero/)
- **Luca Marchini** — Restaurant (Michelin-starred). Defends fish with cheese in Italian classics, a useful counter-voice to the no-cheese-on-fish rule. Sources: [firstonline.info](https://www.firstonline.info/en/parmigiano-sul-pesce-e-chi-ha-detto-che-non-si-puo/)
- **Gianfranco Vissani, Cristina Bowerman, Alessandro Pipero** — Restaurants; press. Leading Italian chefs quoted against the 2024 canned carbonara (Vissani "shameful" is in a headline; the other remarks are unverified). Sources: [ilsussidiario.net](https://www.ilsussidiario.net/news/carbonara-in-lattina-esplode-la-rivolta-degli-chef-vissani-vergognoso-si-distrugge-la-nostra-cultura/2745803/), [en.ilsole24ore.com](https://en.ilsole24ore.com/art/and-controversy-the-can-carbonara-proposed-by-heinz-vissani-destroys-italian-culture-AFtCnSbD)
- **Khaby Lame** — TikTok (not a chef). Italy-raised TikTok star; his 2021 reply to an American 'pizza' with gummy sweets is the source for a candidate intruder (not merged). Sources: [scattidigusto.it](https://www.scattidigusto.it/2021/06/06/khaby-lame-re-di-tiktok-spopola-americani-giu-le-mani-dalla-pizza/)
- **@italians_mad_at_food and @ItalianComments** — Instagram, Facebook, X (outrage accounts, not chefs). Crowd-sourced Italian outrage at foreign recipes; good for tone, not for facts. Sources: [gamberorosso.it](https://www.gamberorosso.it/notizie/attualita/crimini-contro-la-cucina-italiana-i-peggiori-nei-confronti-dellolio-doliva/), [huffingtonpost.co.uk](https://huffingtonpost.co.uk/entry/italians-mad-at-food-twitter_n_5af08391e4b041fd2d2942d8)

## Disagreements resolved

- Popularity: every lens-reviewed intruder takes the LOWER score of the two lenses (e.g. carbonara garlic 4->3, peas 3->2, milk 2->1; gricia onion 4->3; Alfredo garlic 4->2 and broccoli 3->2; ragù cream 4->3; pesto cashews 4->3; vongole tomato 3->2; aglio olio Parmigiano 4->3 and butter 2->1; Norma Parmigiano 3->2; Margherita ketchup 4->3; capricciosa würstel 3->2; pizza-pool ketchup 4->3, BBQ 3->2, exotic meats 2->1).
- Contested flags follow the culinary lens where the lenses split: pesto rocket = contested (pesto di rucola is its own Italian recipe); tortellini cooked ham = contested; tortellini plain tomato sauce = NOT contested (meat ragù is the accepted alternative, plain tomato is not); diavola bell peppers = NOT contested.
- Cacio e pepe 'sodium citrate': the sources lens removed it (its only Dissapore URL says 'gel stabiliser'); the culinary lens kept it. Kept per the merge rule at popularity 1, with the note that it stands for restaurant stabilisers in general.
- Aglio olio 'cream' and puttanesca 'canned pre-pitted olives': removed by the sources lens for thin or misattributed evidence, kept by the culinary lens. Kept at popularity 1 and flagged in review_status.
- Amatriciana 'lard' (strutto): removed by both lenses (lard was a normal Roman cooking fat). Dropped.
- Pizza-pool 'gummy sweets' and 'baked beans': added by the sources lens from the project dossier but never reviewed by the culinary lens. Not merged as intruders; listed under candidates_not_merged.
- Ragù 'eggs' (2026 Spanish chef): the popular-posts sweep listed it (popularity 2) but the culinary lens had explicitly declined the lead (page never opened, unclear which ragù). Kept only as a flagged viral controversy, not an intruder.
- Sweep-only carbonara intruders (mushrooms, cooked ham, white wine, parsley) and spaghetti al pomodoro 'chicken' were added with popularity 1-2 and review_status 'sweep only'. The culinary lens had left parsley and mushrooms out for lack of evidence; the sweeps then found sources (an unopened .doc guide and a 2020 Scatti di Gusto headline).
- The influencer sweep marked carbonara onion as contested (old cookbooks, a chef's variant) and cacio e pepe Parmigiano as NOT contested; the culinary lens is canonical, so carbonara onion stays uncontested (variants noted) and cacio e pepe Parmigiano stays contested.
- Gino D'Acampo's 2010 This Morning clip: the Roman lenses tie it to milk in carbonara, the influencer sweep to cooked ham. Both items are kept at popularity 1-2 with the conflict stated.
- Texts: where the lenses' 'why', contested_note, fun facts or controversy texts differ, the editor kept the sources lens's removals (e.g. Barilla 'took the video down', Pipero's 'cat food', Carnacina and guanciale, the Alfredo jar's '24-month' Parmigiano, Gangetti, Barbieri's '30-minute' complaint, the Giovanni Rana seizure, Coldiretti/Ipsos percentages, Sorbillo's '7 euro' and Maurizio de Giovanni) and the culinary lens's corrections (e.g. 'chicken is normally a main course' rather than 'Italians never put chicken on pasta', the Accademia caveat on carbonara garlic, Artusi writing from Florence).
- Canonical recipes follow the culinary lens, except details the sources lens showed to be unsupported: '1954 recipe used whole eggs' (carbonara), 'diaphragm' cut (ragù), 'only' beef and hen broth (tortellini, softened), the jarred Alfredo's '24-month' Parmigiano, the Neapolitan/Roman anchovy split (puttanesca, rests on blogs), and the brand name of the hazelnut spread.
- Restored by the editor's own WebSearch: the Amatriciana STG exclusion quote (verified), the STG's 10-30% guanciale share (snippet), and Unione Sarda's report that Marchesi's 1989 carbonara used a quarter litre of cream for 400 g of pasta (snippet). Both lenses had removed the last two as unverified.
- Vongole: the culinary lens flagged Vincenzo's Plate's 'waiter will look at you' quote as close to a paraphrase, while the sources lens confirmed it verbatim in a search excerpt; it is marked verified (excerpt-level).
- Vongole Artusi fun fact: the culinary lens dropped onion and dried mushrooms as unverified; the sources lens had checked them against the search excerpt, so the sources-lens version is used with the culinary lens's Florence/1891 context.
- Pomodoro YouGov detail (Hong Kong +79, Indonesia +76): dropped by the culinary lens, but checked against an excerpt by the sources lens; kept.
- Ranked combos: the popular-posts sweep's top-20 order was adjusted to merged popularity: carbonara garlic (sweep #6) moved down to #13 because both lenses rate it 3 and contested; amatriciana garlic moved up; Alfredo cream added at #15; carbonara white wine (sweep #19, popularity 1) dropped from the top 20.
- Real names were removed from 'why' texts (project rule: real people are sources only, never in-game) and companies were made generic in 'why' and game texts (a major US newspaper, a British food website, a national TV cooking show, an American pizza chain). Names stay in contested_note, evidence and controversies for traceability.
- Tiramisù appears only in the popular-posts sweep (one intruder, one source). It is included for completeness with coverage 'THIN' and should not ship as a level without more research.

## Candidates not merged

- **pizza_toppings — Caramelle gommose (gummy sweets).** Khaby Lame's 2021 TikTok reply to an American gummy-sweet pizza (Scatti di Gusto). Source: [scattidigusto.it](https://www.scattidigusto.it/2021/06/06/khaby-lame-re-di-tiktok-spopola-americani-giu-le-mani-dalla-pizza/). *Added by the sources lens from the project dossier; not reviewed by the culinary lens.*
- **pizza_toppings — Fagioli in salsa (baked beans).** A 2025 English-breakfast pizza mocked in Italy (Il Fatto Quotidiano); sausage, bacon and egg are accepted toppings. Source: project dossier (docs/RESEARCH.md), via the sources lens. *Added by the sources lens; not reviewed by the culinary lens.*
- **ragu — Uova (eggs in the sauce).** A 2026 Spanish starred chef's ragù with three eggs; headline reports furious reactions. Source: [ilfattoquotidiano.it](https://www.ilfattoquotidiano.it/2026/08/03/ma-cosa-e-una-frittata-lo-chef-spagnolo-stellato-nandu-jubany-ha-rivisitato-il-sacro-ragu-con-tre-uova-polemiche-furiose-per-la-provocazione-in-cucina/8467552/2/). *Popular-posts sweep only; the culinary lens declined the lead (unopened, unclear which ragù).*
- **(any pasta) — Ketchup as a generic pasta enemy.** YouGov net -82, the worst crime; the culinary lens suggested a generic enemy for every pasta level rather than a Bolognese-specific one. Source: [yougov.com](https://yougov.com/en-us/articles/40810-italian-food-crimes). *Design suggestion, not a dish-specific intruder.*
- **margherita — Pre-cooked sugared "pizza sauce"; pre-shredded low-moisture mozzarella.** The STG requires raw crushed tomato; plausible but no Italian complaint source found. Source: culinary lens (gap note). *Unsourced; search later.*
- **vongole / puttanesca / Norma / pomodoro — Onion or canned clams in vongole; onion, tuna or chicken in puttanesca; minced meat in Norma; dried "Italian seasoning" in pomodoro.** Plausible foreign habits with no source found. Source: researcher and checker gap notes. *Unsourced; do not use without evidence. Do NOT make cream an enemy of spaghetti al pomodoro (penne panna e pomodoro is a known Italian home dish).*

