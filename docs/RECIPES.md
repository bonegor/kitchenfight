# KITCHEN FIGHT — Il Menù: the recipes behind the levels

> Every level is an Italian dish. The enemies are the ingredients that do **not** belong in it,
> and the real ingredients are on the map, waiting to be collected.
> This file is the research behind that menu: the proper recipe of each dish, who says so,
> which intruders Italians complain about (and how loudly), and what Italians happily accept.

Written for players who want to know *why* the cream carton is attacking them, and for
future editors of `src/game/recipes.ts`. The food crimes in general (technique, coffee, table
manners…) are in [RESEARCH.md](RESEARCH.md); the game rules are in [DESIGN.md](DESIGN.md).

Research compiled 11 November 2026. Read [How this was researched](#how-this-was-researched-and-its-limits)
before quoting anything from this file: no source page could be opened during the research.

## Contents

0. [How to read this file](#how-to-read-this-file)
1. [The menu at a glance](#the-menu-at-a-glance)
2. The dishes
   - Le Basi: [1. Spaghetti al Pomodoro](#1-spaghetti-al-pomodoro)
   - Primi Romani: [2. Carbonara](#2-spaghetti-alla-carbonara) · [3. Fettuccine Alfredo](#3-fettuccine-alfredo) ·
     [4. Amatriciana](#4-bucatini-allamatriciana) · [5. Cacio e Pepe](#5-tonnarelli-cacio-e-pepe)
   - Le Pizze: [6. Margherita](#6-pizza-margherita) · [7. Marinara](#7-pizza-marinara)
   - Dal Nord: [8. Tagliatelle al Ragù](#8-tagliatelle-al-ragù) · [9. Pesto Genovese](#9-trofie-al-pesto-genovese)
   - Dal Sud e dal Mare: [10. Spaghetti alle Vongole](#10-spaghetti-alle-vongole)
   - Il Gran Finale: [11. Il Menù degli Orrori](#11-il-menù-degli-orrori-the-finale)
3. [Friend or foe: one ingredient, two verdicts](#friend-or-foe-one-ingredient-two-verdicts)
4. [Accepted in Italy: never an enemy](#accepted-in-italy-never-an-enemy)
5. [The most-cited complaints (top 20)](#the-most-cited-complaints-top-20)
6. [Italian influencer chefs and creators consulted](#italian-influencer-chefs-and-creators-consulted)
7. [Researched but not on the menu](#researched-but-not-on-the-menu)
8. [Editorial calls in the game data](#editorial-calls-in-the-game-data)
9. [How this was researched, and its limits](#how-this-was-researched-and-its-limits)
10. [Rules for editors](#rules-for-editors)

---

## How to read this file

- **Popularity** (●●●●● 5 … ●○○○○ 1) is how often and how loudly Italians complain about an intruder:
  5 = national scandal, 1 = eye-roll. It is an **editorial estimate**, not a measured count (see the
  [limits](#how-this-was-researched-and-its-limits)). The only survey numbers are YouGov's 2022 net scores.
- **C** = contested: Italians genuinely disagree, or the item has real historical roots. Contested
  intruders carry a note with the other side, in the game and here.
- **✓** = a quote whose exact wording was matched against a **search-engine snippet** (not the live page).
  Everything else is a paraphrase, marked as such.
- **sweep only** = evidence found by the influencer-chef or popular-posts sweep and never reviewed by the
  two checker lenses (see [method](#how-this-was-researched-and-its-limits)).
- **In the game** tables list the intruders exactly as `src/game/recipes.ts` has them, in its order, which
  the waves follow: earlier intruders come more often (garlic, a support enemy, is exempt and stays a seasoning).
  The **enemy** column is the game's enemy id and name.
- Real people are named here as **sources only**. The in-game texts (`why`, `line`, `note`, `blurb`,
  `method`) use archetypes ("a TV chef", "a famous Naples pizzaiolo"), following the rule in RESEARCH.md.

## The menu at a glance

| # | Dish (game id) | Course | Real ingredients to collect | Intruders in the game (wave order) | Coverage |
|---|----------------|--------|-----------------------------|------------------------------------|----------|
| 1 | Spaghetti al Pomodoro (`pomodoro`) | Le Basi | spaghetti, tomato, olive oil, garlic (or onion), basil | ketchup, meatballs, chicken | full ¹ |
| 2 | Spaghetti alla Carbonara (`carbonara`) | Primi Romani | guanciale, egg yolks, pecorino, black pepper, spaghetti | cream, onion, smoked bacon, garlic **C**, Parmesan instead of Pecorino **C**, chicken, peas, mushrooms, cooked ham, butter | full ¹ |
| 3 | Fettuccine Alfredo (`alfredo`) | Primi Romani | egg fettuccine, butter, Parmigiano Reggiano, pasta water | cream, chicken, creamy chicken "Alfredo", broccoli, shrimp, garlic, imitation "Parmesan" | full ¹ |
| 4 | Bucatini all'Amatriciana (`amatriciana`) | Primi Romani | guanciale, tomato, pecorino, dry white wine, chili | garlic, onion **C**, pancetta or bacon **C**, Parmesan **C** | full ¹ |
| 5 | Tonnarelli Cacio e Pepe (`cacioepepe`) | Primi Romani | tonnarelli, pecorino, black pepper, pasta water | butter, cream, Parmesan **C**, olive oil **C** | full ¹ |
| 6 | Pizza Margherita (`margherita`) | Le Pizze | Neapolitan dough, tomato, mozzarella, basil, olive oil | pineapple **C**, "Hawaiian" **C**, ketchup, chicken, BBQ sauce, cheddar, "pepperoni" **C** | lenses ² |
| 7 | Pizza Marinara (`marinara`) | Le Pizze | Neapolitan dough, tomato, garlic, oregano, olive oil | any cheese, prawns, clams, grated cheese, cheddar | lenses ² |
| 8 | Tagliatelle al Ragù (`ragu`) | Dal Nord | beef, fresh pancetta, soffritto, passata, wine, egg tagliatelle | spaghetti **C**, garlic, cream **C**, smoked pancetta | lenses + posts ³ |
| 9 | Trofie al Pesto Genovese (`pesto`) | Dal Nord | basil, pine nuts, garlic, olive oil, Parmigiano, pecorino | cream, cashews, seed oil, butter **C**, generic cheese **C** | lenses + posts ³ |
| 10 | Spaghetti alle Vongole (`vongole`) | Dal Sud e dal Mare | spaghetti, clams, garlic, olive oil, parsley, chili | cheese on clams **C**, grated Parmesan **C**, butter **C**, cream | full ¹ |
| 11 | Il Menù degli Orrori (`foodcourt`) | Il Gran Finale | guanciale, Parmigiano, basil, clams, tomato, olive oil ("Nonna's pantry") | the best-known crimes of the menu, plus method crimes and drinks | — |

¹ researcher + sources lens + culinary lens + influencer-chef sweep + popular-posts sweep.
² researcher + sources lens + culinary lens (no chef or posts sweep for these two pizzas; their chicken,
BBQ and "pepperoni" entries come from the lens-reviewed Neapolitan-toppings and Diavola entries).
³ researcher + sources lens + culinary lens + popular-posts sweep.

Collecting an ingredient gives a small buff for the rest of the run; collecting all of them is
**RICETTA COMPLETA** (rules in [DESIGN.md](DESIGN.md#the-recipe-mechanic)).

---

## 1. Spaghetti al Pomodoro

*Spaghetti with tomato sauce* · **Le Basi** · Origin: Southern Italy (Naples and Campania), now eaten
everywhere in Italy · Pasta: spaghetti (any shape works)

> *In-game blurb:* Italy's everyday classic: good tomatoes, olive oil, garlic or onion, and basil. So simple that every shortcut shows.

**The proper recipe**

- **Spaghetti** (any shape works).
- **Pomodori**: ripe fresh tomatoes, peeled San Marzano or passata. Quality matters most: Dissapore says
  to taste them first and use bland or mealy tomatoes for something else.
- **Olio extravergine d'oliva**.
- **Aglio o cipolla**: a free choice. Garlic, onion, spring onion or chili are all accepted bases.
- **Basilico**, fresh, added at the end off the heat.
- Salt; chili optional; **Parmigiano or pecorino at the table, optional and fully accepted**.

*Method.* Soften garlic or onion (or chili) in olive oil, add the tomatoes and cook them down briefly,
then salt. Finish the al dente spaghetti in the pan with the sauce and a little pasta water
(mantecatura). Add fresh basil off the heat.

**Collect in the game:** Spaghetti · Pomodoro · Olio extravergine · Aglio ("or onion, spring onion or
chili: a free choice") · Basilico.

**Authority sources**

- [Sughi di pomodoro sciuè sciuè: 5 errori che facciamo spesso (Dissapore)](https://www.dissapore.com/grande-notizia/sughi-al-pomodoro-veloci-5-errori/) —
  ✓ "fate appassire nell'olio quel che preferite fra cipolla, cipollotto, aglio, peperoncino"
  (soften in the oil whichever you prefer: onion, spring onion, garlic or chili). *This is the dish's in-game quote.*
- [La ricetta perfetta dello chef: spaghetti alla Don Alfonso (Scatti di Gusto, 2014)](https://www.scattidigusto.it/la-ricetta-perfetta-dello-chef-spaghetti-alla-don-alfonso) —
  the starred Sorrento-coast restaurant's tomato spaghetti, finished with julienned basil.
- [Spaghetti al pomodoro (Giallo Zafferano blog, Amici in cucina)](https://blog.giallozafferano.it/amicincucina/spaghetti-al-pomodoro/) —
  garlic in oil as the base (shallot as an alternative), finished in the pan with a little pasta water.
  The search excerpt did not confirm which of two blog posts it was.

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources |
|---|---|---|---|---|---|
| `ketchup` Spruzzatore Rosso | Ketchup | ●●●●● 5 | | A sweetened, vinegared industrial sauce, not a tomato sauce. In YouGov's 17-country survey Italians rated ketchup on pasta the worst crime against Italian food (net −82), worse than starting pasta in cold water. | [YouGov 2022](https://business.yougov.com/content/40810-italian-food-crimes); [Dissapore 2022](https://www.dissapore.com/notizie/pasta-con-il-ketchup-per-gli-italiani-e-il-crimine-alimentare-piu-grave); [Fine Dining Lovers 2022](https://www.finedininglovers.com/explore/articles/survey-finds-most-offensive-crimes-against-italian-food) |
| `polpetta` Polpetta Rotolante | Meatballs piled on the spaghetti | ●●○○○ 2 | C | Spaghetti and meatballs is Italian-American. In Italy polpette are a second course; their sauce may dress the pasta, but big meatballs are not served on top. | [Tasting Table](https://www.tastingtable.com/1190751/why-you-shouldnt-expect-to-find-spaghetti-and-meatballs-in-italy) (added by the culinary lens) |
| `pollo` Pollo Infiltrato | Chicken *(sweep only)* | ●●○○○ 2 | | Pasta is the first course, chicken the second. A sign at a 2023 Trevi Fountain protest against "food crimes" said chicken on pasta is a crime in Italy. | [Italianismo 2023](https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/) |

*Contested notes.* Meatballs: Italy does have pasta with tiny meatballs (Abruzzo's chitarra con le
pallottine); the complaint is the big American-style meatball on a plate of spaghetti. Chicken: the
protest sign targets chicken on pasta in general, not this dish specifically.

**Also researched, not in the game**

- **Zucchero (sugar)** ●●●●○ 4 **C**. Many Italian chefs say good tomatoes need no sugar. On MasterChef
  Italia (2022) judge Antonino Cannavacciuolo called a contestant's sugared sauce "improponibile"
  ([Il Fatto Quotidiano](https://www.ilfattoquotidiano.it/2022/01/14/masterchef-2021-lo-zucchero-nella-salsa-di-pomodoro-per-cannavacciuolo-e-improponibile-e-reagisce-cosi-video/6455970/), ✓ headline "Per Cannavacciuolo è improponibile"),
  and TV cook Irina Steccanella called sugar in tomato sauce ✓ "l'Anticristo"
  ([Trend Online](https://www.trend-online.com/food/salsa-di-pomodoro-acida-zucchero/)). But a pinch of sugar is a
  widespread home habit: Senate President Ignazio La Russa called it the secret of his pasta alla Norma in 2026
  ([La Sicilia](https://www.lasicilia.it/video/la-sicilia-tv/3076004/la-pasta-alla-norma-al-senato-il-presidente-la-russa-svela-il-segreto-della-sua-ricetta.html); not re-checked).
  No enemy fits it, so the game leaves it out.

**Accepted in Italy:** garlic *or* onion (or spring onion, or chili); Parmigiano or pecorino on top
(unlike on seafood pasta); a potato or grated carrot against acidic tomatoes. **Cream is not an enemy
here**: penne panna e pomodoro is a known Italian home dish.

**Method crimes in the waves (≤ 20 %):** snapped spaghetti, scissors, overcooked pasta, the pasta-rinser,
the cold pot.

**Fun facts**

- In the same YouGov survey, 11 of the 17 markets found ketchup on pasta fine, led by Hong Kong (+79) and
  Indonesia (+76). Americans reject it too (−48; popular-posts sweep).
- Japan's "Spaghetti Napolitan" is ketchup spaghetti, created by chef Shigetada Irie in Yokohama,
  reportedly inspired by food served to American troops.
- Other YouGov "crimes" are about serving, not ingredients: pasta as a side dish (−55), not salting the
  water (−17), garlic bread with pasta (−14) (popular-posts sweep).

---

## 2. Spaghetti alla Carbonara

*Spaghetti carbonara* · **Primi Romani** · Origin: Rome, Lazio; the first recipes were printed in the
1950s and where the dish began is still argued over · Pasta: spaghetti or spaghettoni; rigatoni and mezze
maniche are common and accepted in Roman trattorie

> *In-game blurb:* Rome's most argued-over pasta: guanciale, egg yolk, Pecorino Romano and black pepper. Its silky sauce comes from technique, not cream.

**The proper recipe**

- **Guanciale** (cured pork cheek). Pancetta is a historical but contested alternative (see below).
- **Tuorli d'uovo**: yolks only, or yolks plus some whole eggs. Both are accepted; Luciano Monosilio uses yolks only.
- **Pecorino Romano DOP**. Many cooks blend in some Parmigiano Reggiano or Grana Padano; purists object
  only when Pecorino is replaced entirely.
- **Pepe nero**, freshly ground, plenty of it.
- **Spaghetti** (or another accepted shape).
- **Starchy pasta water**, to loosen the egg and cheese cream; salt for the water only.

*Method.* Render the guanciale slowly until crisp. Beat the yolks with grated Pecorino and black pepper.
Toss the drained pasta with the guanciale and its fat, then take the pan off the heat and stir in the egg
mixture with a little pasta water until it is a glossy cream that does not scramble. The creaminess comes
only from egg, cheese, fat and starch.

**Collect in the game:** Guanciale · Tuorli d'uovo · Pecorino · Pepe nero · Spaghetti.

**Authority sources**

- [La carbonara del 1954 (Gambero Rosso, 2024)](https://www.gamberorosso.it/notizie/la-carbonara-del-1954-la-prima-ricetta-del-piatto-icona-di-roma-che-viene-da-milano-ed-e-fatta-con-laglio) —
  the August 1954 *La Cucina Italiana* recipe used spaghetti, pancetta, Gruyère, garlic, eggs, salt and pepper.
- [Carbonara, la ricetta perfetta di Luciano Monosilio (Scatti di Gusto)](https://www.scattidigusto.it/carbonara-ricetta-perfetta-luciano-monosilio) —
  the Roman chef known as the "king of carbonara": spaghetti, yolks, guanciale, cheese and pepper.
- [Carbonara Day, la ricetta perfetta (AGI, 2023)](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/) —
  Monosilio's carbonara uses egg, Pecorino Romano, Grana Padano and guanciale, and only long pasta.
- [Italy marks Carbonara Day (ANSA English, 2017)](https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html) —
  paraphrase (wording not re-checked): never replace pecorino with parmigiano, and cream is an even worse sin.
- [Pasta alla carbonara: 5 errori da non fare (Dissapore)](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/) —
  paraphrase (wording not confirmed by the editor's search): carbonara needs neither the sharpness of
  garlic nor the sweetness of onion, and cream makes it greasier and flattens its flavour.
- [Carbonara, la vera ricetta originale (Sky TG24)](https://tg24.sky.it/salute-e-benessere/approfondimenti/carbonara-ricetta-originale) —
  lists an ingredient set it attributes to the Accademia Italiana della Cucina (with garlic). No registered
  Accademia carbonara could be verified, so the game claims neither a ban nor a prescription from it.
- [History of Carbonara (Vincenzo's Plate)](https://www.vincenzosplate.com/history-of-carbonara/) — no cream;
  the creaminess comes from emulsifying raw egg, Pecorino and pasta water.
- Chef sources: Monosilio in [Il Fatto Quotidiano (2016)](https://www.ilfattoquotidiano.it/2016/03/31/luciano-monosilio-la-cucina-e-lavoro-la-parte-spettacolare-ce-ma-non-e-tutto/2597245/),
  [Italia Squisita](https://italiasquisita.net/it/video-ricette/pasta-alla-carbonara-di-luciano-monosilio),
  [SCMP](https://www.scmp.com/magazines/post-magazine/article/1862632/king-carbonara-luciano-monosilio-reveals-secrets-behind-his)
  and the pasta makers' [Carbonara Day guide](https://welovepasta.it/wp-content/uploads/2021/03/Focus-segreti-MyCarbonara.doc);
  [Vincenzo's Plate recipe](https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/);
  [Max Mariola's video recipe (Gambero Rosso)](https://www.gamberorosso.it/notizie/videoricette-la-carbonara-di-max-mariola/).

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `panna` Panna Invasora | Cream (and crème fraîche) | ●●●●● 5 | | The creaminess comes from yolks, Pecorino, guanciale fat and pasta water; chefs say cream makes it greasier and flattens it. The most common complaint about carbonara abroad. | [Vincenzo's Plate 2025](https://www.vincenzosplate.com/spaghetti-alla-carbonara-recipe/comment-page-5/) (Vincenzo Prosperi) ✓ "NO CREAM IN CARBONARA!"; [ANSA 2017](https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html); [Scatti di Gusto 2021](https://www.scattidigusto.it/2021/02/04/carbonara-la-cremosa-ricetta-romana-per-dimenticare-martha-stewart/); [Il Fatto Quotidiano 2024](https://www.ilfattoquotidiano.it/2024/11/19/viva-la-carbonara-oppure-no-le-ricette-un-tanto-al-click-fanno-inorridire-i-puristi-e-non-solo-ma-forse-un-trucco-per-salvare-la-ricetta-ce/7773500/) |
| `cipolla` Cipolla Clandestina | Onion | ●●●●○ 4 | | Not part of the Roman dish. A 2016 French one-pot video that boiled onion with the pasta caused an outcry in Italy. | [Dissapore](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/); [Gambero Rosso 2016](https://www.gamberorosso.it/notizie/attualita/video-carbonara-sbagliata-francese-cipolla/); [The Local 2016](https://www.thelocal.it/20160407/italians-pour-scorn-french-attempt-to-reinvent-carbonara) |
| `bacon` Bacon Abusivo | Smoked bacon | ●●●●○ 4 | | Guanciale is cured pork cheek, never smoked. Bacon is the swap Italians spot most often abroad; Coldiretti lists it among typical "fake carbonara" errors. | [AGI 2024](https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/); [Il Sole 24 Ore 2021](https://en.ilsole24ore.com/art/carbonara-pomodoro-e-bacon-ricetta-new-york-times-fa-infuriare-coldiretti-ADdj51LB) |
| `aglio` Aglio in Camicia | Garlic | ●●●○○ 3 | C | Purists say its sharpness competes with guanciale and pepper, and Roman rules lists ban it. | [Dissapore](https://www.dissapore.com/ricette/carbonara-5-errori-da-non-fare/); [Gambero Rosso 2024](https://www.gamberorosso.it/notizie/la-carbonara-del-1954-la-prima-ricetta-del-piatto-icona-di-roma-che-viene-da-milano-ed-e-fatta-con-laglio); [Il Sole 24 Ore 2024](https://en.ilsole24ore.com/art/carbonara-day-ricetta-compie-70-anni-e-aglio-e-gruviera-fa-inorridire-puristi-AFSGQIKD) |
| `parmesan` Spargipolvere | Parmesan instead of Pecorino | ●●●○○ 3 | C | The cheese of Roman carbonara is sharp, salty Pecorino Romano; using only Parmigiano is a listed purist sin. | [ANSA 2017](https://www.ansa.it/amp/english/news/lifestyle/food_wine/2017/04/06/italy-marks-carbonara-day_86fa411f-4b1c-49e8-b788-ed80d2f1d089.html); [AGI 2023](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/) (Luciano Monosilio) |
| `pollo` Pollo Infiltrato | Chicken | ●●●○○ 3 | | The only meat is guanciale. Italian coverage of American pasta lists chicken among typical US additions. | [Il Post 2021](https://www.ilpost.it/2021/02/28/pasta-stati-uniti/); [AGI 2023](https://www.agi.it/cronaca/news/2023-07-18/carbonara-di-pollo-sintetico-made-in-italy-ricette-22282277/); [Italianismo 2023](https://italianismo.com.br/en/grupo-protesta-na-fontana-di-trevi-contra-crimes-alimentares/) |
| `piselli` Piselli Ribelli | Peas | ●●○○○ 2 | | Not part of carbonara. Coldiretti lists frozen peas among the distortions found abroad. | [Il Nordest 2024](https://www.ilnordest.it/economia/la-carbonara-con-panna-piselli-burro-e-basilico-tz2dlxce) ✓ headline "La Carbonara? Con panna, piselli, burro e basilico"; [MeteoWeb 2024](https://www.meteoweb.eu/2024/04/carbonara-day-ricette-tarocche-in-6-ristoranti-stranieri-su-10/1001399577/) |
| `funghi` Funghi Abusivi | Mushrooms *(sweep only)* | ●●○○○ 2 | | A frequent foreign addition. Italian social media mocked a celebrity chef's 2020 carbonara with mushrooms, peas and crème fraîche. | [Scatti di Gusto 2020](https://www.scattidigusto.it/2020/02/21/la-carbonara-di-gordon-ramsay-e-rivolta-a-roma-e-dintorni/); [Wanted in Rome 2020](https://wantedinrome.com/news/italians-revolted-by-gordon-ramsays-nightmare-carbonara.html) |
| `prosciutto` Prosciutto Impostore | Cooked ham *(sweep only)* | ●●○○○ 2 | | A British-style shortcut for guanciale; Italian food media list ham carbonara among recipe "horrors", and an Italian TV chef rejected it on live British TV. | [Food52](https://vercel.food52.com/story/20529-we-can-t-stop-laughing-at-this-old-british-tv-clip) (Gino D'Acampo); [ITV](https://itv.com/thismorning/food/classic-italian-carbonara-gino-dacampo-recipe) (Gino D'Acampo); [Scatti di Gusto 2016](https://www.scattidigusto.it/ricette-italiane-orrori-ingredienti) |
| `burro` Burro Furbetto | Butter | ●●○○○ 2 | | The fat comes from rendered guanciale. Coldiretti names butter among the add-ons of fake carbonara abroad. | [AGI 2024](https://www.agi.it/economia/news/2024-04-06/carbonara-day-coldiretti-tarocc-ristoranti-stranieri-25934192/); [Il Nordest 2024](https://www.ilnordest.it/economia/la-carbonara-con-panna-piselli-burro-e-basilico-tz2dlxce); [Reporter Gourmet](https://reportergourmet.com/en/news/8374-carbonara-according-to-bruno-barbieri-the-top-chef-s-recipe-with-only-egg-yolks-and-butter) (Bruno Barbieri) |

**Contested and caveat notes** (designer-facing; names stay out of the game)

- *Cream.* Nobody seriously defends it today, but it did appear in Italian cookbooks: Unione Sarda reports
  that Gualtiero Marchesi's 1989 recipe used a quarter litre of cream for 400 g of spaghetti (search
  snippet only), and Dissapore reportedly cites older cookbooks with cream. A habit Italy has abandoned,
  not a living regional variant.
- *Onion.* Chef twists and old cookbooks (reportedly a Max Mariola variant, and Ada Boni's onion-and-wine
  version per Dissapore), not the Roman classic. Kept uncontested.
- *Garlic.* The first printed Italian recipe (1954) used a clove, and a cookbook by Anna Gosetti della Salda
  reportedly kept it. When the 1954 recipe was recreated for its 70th anniversary in 2024, its garlic and
  Gruyère horrified purists.
- *Parmesan.* A blend is widely accepted: AGI reports that Monosilio uses Pecorino Romano together with Grana Padano.
  Only a full swap draws complaints.
- *Butter.* Some top chefs accept it: Bruno Barbieri's published carbonara browns the guanciale in butter
  (Reporter Gourmet). Purists say the guanciale fat is enough.
- *Cooked ham.* The TV chef was Gino D'Acampo on ITV's This Morning (2010). The Roman lenses tie the same
  clip to *milk* rather than ham, so accounts differ.
- *Peas* are fine in other Italian pastas (pasta panna, prosciutto e piselli): the complaint is only about carbonara.

**Also researched, not in the game:** tomato ●●●○○ 3 (the 2021 "smoky tomato carbonara" condemned by
Coldiretti; no tomato enemy fits a carbonara level); **pancetta** ●●●○○ 3 **C** (the 1954 recipe used it
and Italian sites still offer it as a fallback, so the game's `bacon` enemy is *smoked* bacon, not
pancetta); milk ●○○○○ 1; white wine ●○○○○ 1 *(sweep only; accepted in amatriciana)*; parsley ●○○○○ 1
*(sweep only, one unopened .doc guide)*.

**Accepted in Italy:** yolks only or yolks plus some whole eggs; some Parmigiano or Grana Padano blended
into the Pecorino; rigatoni or mezze maniche; pancetta when guanciale is unavailable (contested, not a crime).

**Method crimes in the waves:** the cursed little can (canned carbonara) and the single pot (one-pot "carbonara").

**Fun facts**

- The first carbonara printed in Italy (*La Cucina Italiana*, August 1954) used pancetta, Gruyère and garlic.
  A 1952 Chicago restaurant guide is often cited as an even earlier printed version.
- Carbonara Day (6 April) was created by Italian pasta makers (Unione Italiana Food with the International
  Pasta Organisation) after the 2016 French video row (popular-posts sweep).
- In 2024 Heinz launched canned carbonara in the UK; chef Gianfranco Vissani called it shameful.
- A 2026 AstraRicerche survey for Unione Italiana Food reportedly found cream the most-cited carbonara mistake
  (about 35 %), ahead of cooking the egg on the heat (about 34 %) and garlic or onion (31 %). One search
  snippet, not re-confirmed.
- Where the name comes from is unproven: Apennine charcoal makers (*carbonari*) or American soldiers in Rome
  in 1944 with bacon-and-egg rations are the popular theories (general knowledge, no URL).

---

## 3. Fettuccine Alfredo

*Fettuccine Alfredo (fettuccine al burro)* · **Primi Romani** · Origin: Rome, created by restaurateur
Alfredo di Lelio in the early 1900s (sources date it between about 1907 and 1914) · Pasta: fresh egg
fettuccine, rolled very thin

> *In-game blurb:* Born in a Roman restaurant in the early 1900s: fresh fettuccine, lots of butter and Parmigiano, emulsified with pasta water. Not a drop of cream.

**The proper recipe**

- **Fettuccine fresche all'uovo**, very thin so they cook quickly.
- **Burro**: generous, softened, good quality (the family calls the dish "al triplo burro"; culinary lens, not URL-checked).
- **Parmigiano Reggiano**, aged and finely grated. *Correct here, unlike in carbonara.*
- **Starchy pasta water**, which emulsifies butter and cheese into a cream. Salt; black pepper optional and harmless.

*Method.* Cook the fettuccine briefly. Toss them hard with softened butter, finely grated Parmigiano and a
little pasta water until butter and cheese melt into a silky coating. No cream; the restaurants
traditionally finish it at the table.

**Collect in the game:** Fettuccine all'uovo · Burro · Parmigiano Reggiano · Acqua di cottura.

**Authority sources**

- [La storia delle fettuccine Alfredo (Gambero Rosso)](https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo) —
  cream is foreign to di Lelio's recipe; the dish was almost unknown in Italy but famous in the US after
  Douglas Fairbanks and Mary Pickford tasted it.
- [Vi racconto la storia di mio nonno Alfredo di Lelio (Gambero Rosso)](https://www.gamberorosso.it/rubriche/storie/vi-racconto-la-storia-di-mio-nonno-alfredo-di-lelio-inventore-delle-note-fettuccine-allalfredo/) —
  the inventor's granddaughter Ines Di Lelio: butter and Parmigiano as a restorative for his wife after childbirth.
- [Our history (Il Vero Alfredo, Rome)](https://ilveroalfredo.it/en/?p=770);
  [Fettuccine Alfredo (Turismo Roma)](https://www.turismoroma.it/it/page/fettuccine-alfredo);
  [The Real Alfredo (Saveur)](https://www.saveur.com/article/Kitchen/The-Real-Alfredo/) — reconstructs the dish from
  fettuccine, butter and Parmigiano-Reggiano;
  [Fettuccine Alfredo (Wikipedia)](https://en.wikipedia.org/wiki/Fettuccine_Alfredo) — in Italy usually
  "fettuccine al burro"; cream, chicken and broccoli are American additions.

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `panna` Panna Invasora | Cream | ●●●●● 5 | | The original is egg fettuccine, butter and Parmigiano emulsified with pasta water. Heavy cream is the American addition that defines "Alfredo sauce" abroad. | [The Daily Meal](https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen) (The Pasta Queen, Nadia Caterina Munno); [Gambero Rosso](https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo); [Saveur](https://www.saveur.com/article/Kitchen/The-Real-Alfredo/); [Dissapore](https://www.dissapore.com/ricette/fettuccine-alfredo/) |
| `pollo` Pollo Infiltrato | Chicken | ●●●●● 5 | | In Italy chicken is normally a main course, rarely a pasta topping, and "chicken Alfredo" is unknown. It is the US chain-restaurant version Italian creators mock most. | [Nordot](https://nordot.app/1169279368201650965) (The Pasta Queen) ✓ "Chicken alfredo really rubs me the wrong way"; [Mashed](https://mashed.com/990011/the-tiktok-recipe-the-pasta-queen-wants-to-call-the-pasta-police-on) (The Pasta Queen); [Wikipedia](https://en.wikipedia.org/wiki/Fettuccine_Alfredo) |
| `alfredo` Alfredo il Colloso | Creamy chicken "Alfredo" | ●●●●● 5 | | Cream *and* chicken: the version served abroad. In Italy it is simply fettuccine al burro. | [The Daily Meal](https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen) (The Pasta Queen) |
| `broccoli` Broccolo Americano | Broccoli | ●●○○○ 2 | | A common American add-on, unknown in the Roman dish. | [Il Post 2021](https://www.ilpost.it/2021/02/28/pasta-stati-uniti/); [Wikipedia](https://en.wikipedia.org/wiki/Fettuccine_Alfredo) |
| `gamberi` Gambero Saltatore | Shrimp | ●●○○○ 2 | | The original has no protein at all; seafood is a US restaurant add-on. | [Il Post 2021](https://www.ilpost.it/2021/02/28/pasta-stati-uniti/); [Eroica Fenice](https://www.eroicafenice.com/salotto-culturale/fettuccine-alfredo-storia-di-un-piatto-iconico/) |
| `aglio` Aglio in Camicia | Garlic | ●●○○○ 2 | | The Roman original is butter and Parmigiano on egg pasta; garlic came with the American cream version. | [Dissapore](https://www.dissapore.com/ricette/fettuccine-alfredo/); [Eroica Fenice](https://www.eroicafenice.com/salotto-culturale/fettuccine-alfredo-storia-di-un-piatto-iconico/) |
| `parmesan` Spargipolvere | Imitation "Parmesan" in a shaker | ●○○○○ 1 | | Real Parmigiano Reggiano is the hero of this dish; Coldiretti calls US-made "Parmesan" a fake of Parmigiano and Grana. *Adapted from the pizza research* (see [editorial calls](#editorial-calls-in-the-game-data)). | [MeteoWeb 2023](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) |

*Note.* Broccoli with pasta is normal in Italy in other dishes (pasta e broccoli): the complaint is only about Alfredo.

**Accepted in Italy:** Parmigiano (correct here), lots of butter, pasta water, a little black pepper.

**Method crimes in the waves:** overcooked pasta and the pasta-rinser.

**Fun facts**

- Di Lelio created the dish for his wife Ines, weak after giving birth; the family dates it to about 1907–1908.
- Douglas Fairbanks and Mary Pickford tasted it on their 1920 honeymoon in Rome and made it famous in
  America; a gold fork and spoon said to be their gift are dated 1927.
- Two Roman restaurants claim the original: Il Vero Alfredo (run by di Lelio's descendants) and Alfredo
  alla Scrofa, which now sells a jarred Alfredo sauce of butter and Parmigiano, with no cream.
- In Italy it is the plain "pasta in bianco" comfort food for anyone feeling unwell; few Italians call it Alfredo.

---

## 4. Bucatini all'Amatriciana

*Pasta all'amatriciana (Amatriciana Tradizionale STG)* · **Primi Romani** · Origin: Amatrice (province of
Rieti, Lazio), popularised in Rome · Pasta: spaghetti in Amatrice's own municipal (De.C.O.) recipe;
bucatini is the Roman favourite; rigatoni and mezze maniche are common in Roman trattorie

> *In-game blurb:* Amatrice's pride and an EU-protected speciality since 2020: guanciale, tomato, pecorino and chili. No garlic, no onion, no pancetta.

**The proper recipe**

- **Guanciale (tipo Amatriciano)**. The STG names guanciale and excludes pancetta; a search snippet of
  the specification gives guanciale at 10–30 % of the finished sauce.
- **Pomodoro**: San Marzano, peeled tinned or fresh.
- **Pecorino**: Amatrice's own pecorino (named by the De.C.O.) or Pecorino Romano DOP.
- **Vino bianco secco**, optional, to deglaze; allowed by both the 2015 De.C.O. and the STG.
- **Olio extravergine**: a spoonful in the De.C.O. recipe (some purists say even that is optional).
- **Peperoncino e/o pepe nero**: the STG explicitly allows either or both. Salt; spaghetti or bucatini.

*Method.* Render guanciale strips until golden, optionally deglaze with dry white wine, add the tomatoes
and chili (or pepper) and cook briefly. Many cooks lift the guanciale out while the tomato cooks and
return it at the end so it stays crisp. Toss with the pasta and finish with plenty of grated pecorino.

**Collect in the game:** Guanciale · Pomodoro · Pecorino · Vino · Peperoncino ("chili and/or black pepper: the STG allows both").

**Authority sources**

- [MIPAAF provvedimento 13 marzo 2020: Amatriciana Tradizionale STG, disciplinare](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) —
  ✓ "La "Amatriciana Tradizionale" a differenza di altre salse analoghe non prevede l'impiego di
  ingredienti quali aglio cipolla o pancetta." (Unlike other similar sauces, it does not use garlic,
  onion or pancetta.) *Verified by the editor's own search; the dish's in-game quote.*
- [Disciplinare Amatriciana Tradizionale STG (Regione Veneto copy)](https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345) —
  paraphrase: chili (dried or fresh) and/or pepper as needed.
- [Commission Implementing Regulation (EU) 2020/395 (ARSIAL copy)](https://www.arsial.it/app/uploads/Reg_2020_395_STG-AmatricianaTradizionale.pdf) —
  EU Official Journal L 77, 13 March 2020; found in search results, could not be fetched.
- [L'Amatriciana Tradizionale è STG (Gambero Rosso, 2020)](https://www.gamberorosso.it/notizie/lamatriciana-tradizionale-e-stg-leuropa-tutela-la-salsa-dei-pastori-di-amatrice);
  [Giornata internazionale dell'Amatriciana (Sky TG24, 2026)](https://tg24.sky.it/lifestyle/2026/03/06/giornata-amatriciana-storia-ricetta-originale) —
  paraphrase: the Amatrice recipe calls for spaghetti, not bucatini;
  [the Amatrice De.C.O., delibera 27/2015 (Gazzetta del Gusto)](https://gazzettadelgusto.it/ricette/salse-sughi/storia-e-ricetta-originale-dellamatriciana/?print=pdf) —
  Amatrice formalised Amatriciana Rossa and Bianca.

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `aglio` Aglio in Camicia | Garlic | ●●●●● 5 | | The STG explicitly excludes it. When a celebrity chef said on Italian TV in 2015 that he adds a clove, Amatrice's town council answered with a formal statement and the chef apologised. | [STG disciplinare](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) ✓; [Blitz Quotidiano 2015](https://archivio.blitzquotidiano.it/cucina/carlo-cracco-chiede-scusa-per-amatriciana-con-aglio-era-solo-una-battuta-2097854) (Carlo Cracco); [Dissapore 2015](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/) (Carlo Cracco); [The Local 2015](https://www.thelocal.com/20150210/top-italy-chef-apologizes-for-garlic-gaffe) |
| `cipolla` Cipolla Clandestina | Onion | ●●●●● 5 | C | The STG and the Amatrice recipe exclude it; its sweetness softens the balance of guanciale, tomato and pecorino. In 2020 an onion amatriciana on a national TV cooking show set off a public row. | [Gambero Rosso](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/); [Scatti di Gusto 2020](https://www.scattidigusto.it/2020/06/03/amatriciana-con-aceto-e-cipolla-alla-prova-del-cuoco-e-scandalo); [STG disciplinare](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) ✓ |
| `bacon` Bacon Abusivo | Pancetta (or bacon) | ●●●●○ 4 | C | Amatriciana is made with guanciale, and the STG names pancetta among the excluded ingredients. Smoked bacon is even further away. | [STG disciplinare](https://unionalimentari.com/wp-content/uploads/2024/09/MIPAAF-provv-13.3.2020-Amatriciana-Tradizionale-STGCOMPL.pdf) ✓; [Dissapore](https://www.dissapore.com/cucina/amatriciana-5-errori-da-evitare-accuratamente/) |
| `parmesan` Spargipolvere | Parmesan | ●●○○○ 2 | C | Finished with pecorino (Amatrice's or Romano), the cheeses the specification allows. Parmigiano is milder and from another region. | [STG (Regione Veneto copy)](https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345); [Gambero Rosso](https://www.gamberorosso.it/notizie/storie/amatriciana-con-cipolla-o-senza-diatriba/) |

In the waves, garlic is a *support* enemy (it speeds up the crimes around it), so it stays a seasoning
whatever its rank here.

**Contested and caveat notes**

- *Garlic* is not a live debate: the 2015 chef, Carlo Cracco, called his "aglio in camicia" a joke and
  apologised (the press then found a garlic amatriciana in his own cookbook). No authoritative source supports garlic.
- *Onion* is the real debate. Gambero Rosso compared historical recipes and found onion a constant until
  the mid-1960s (the influencer sweep reports onion in 23 of 30 recipes, after a popular Roman chef's
  onion-amatriciana video); older Roman versions and many trattorie still use it. Amatrice (2015) and the STG (2020) exclude it.
- *Pancetta* replaced guanciale in some recipes up to the mid-1960s and is a common home fallback.
- *Parmesan*: some recipes before the mid-1960s used Parmigiano instead of pecorino.

**Also researched, not in the game:** vinegar ●●○○○ 2 (the only deglazing liquid is white wine; the
same 2020 TV amatriciana used vinegar); shallot ●○○○○ 1.

**Accepted in Italy:** a splash of dry white wine; a spoonful of olive oil; black pepper instead of or with
chili; spaghetti, bucatini, and rigatoni or mezze maniche in Roman trattorie.

**Method crimes in the waves:** snapped spaghetti (bucatini included), overcooked pasta, the pasta-rinser.

**Fun facts**

- Amatriciana has been an EU Traditional Speciality Guaranteed since 13 March 2020.
- Amatrice's 2015 De.C.O. covers Amatriciana Rossa (with tomato) and Bianca (without tomato, close to gricia).
- Dissapore says the worst mistake is ordering a "gricia rossa": gricia with tomato is simply amatriciana.
- After the August 2016 earthquake, restaurants everywhere served "amatriciana solidale" to help the town.

---

## 5. Tonnarelli Cacio e Pepe

*Cacio e pepe* · **Primi Romani** · Origin: Rome and the Lazio countryside (shepherds' cooking) · Pasta:
tonnarelli (fresh square-cut egg spaghetti) or dried spaghetti; short shapes are also seen in Rome

> *In-game blurb:* Three ingredients and nowhere to hide: Pecorino Romano, black pepper and starchy pasta water whipped into a cream. A Roman shepherds' dish.

**The proper recipe**

- **Pecorino Romano DOP**, finely grated: the only cheese in the strict version ("cacio" is the old
  central-Italian word for cheese).
- **Pepe nero**, freshly cracked and usually toasted in the pan.
- **Tonnarelli o spaghetti**.
- **Starchy pasta water**: the emulsifier that turns cheese into a cream. Salt lightly.

*Method.* Toast cracked pepper and loosen it with pasta water. Separately, mix the Pecorino with warm (not
boiling) pasta water into a smooth cream, because too much heat makes it clump. Finish the pasta in the
pepper water, then off the heat toss in the cheese cream, adding water until it coats.

**Collect in the game:** Tonnarelli · Pecorino · Pepe nero · Acqua di cottura.

**Authority sources**

- [Caso cacio e pepe BBC (Gambero Rosso, 2025)](https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/) —
  paraphrase: the corrected recipe has only three ingredients, as tradition demands.
- [La ricetta vera della cacio e pepe (Gambero Rosso)](https://www.gamberorosso.it/attualita/ricetta-vera-cacio-pepe/) — pasta, Pecorino, pepper, no cream sauce.
- [Cacio e pepe: 5 errori da non fare (Dissapore)](https://www.dissapore.com/ricette/cacio-e-pepe-5-errori-da-non-fare/) — adding oil is a common mistake.
- [Max cucina l'Italia: Cacio e pepe (Sky TG24)](https://tg24.sky.it/lifestyle/ricette/cacio-e-pepe-ricetta) and
  [Gambero Rosso video](https://www.gamberorosso.it/notizie/videoricette-spaghetti-cacio-e-pepe-di-max-mariola/) — Roman chef and YouTuber Max Mariola.
- [Traditional or gourmet? (Italia Squisita via Life in Italy)](https://lifeinitaly.com/?p=55289) — Claudio Gargioli
  (Armando al Pantheon) against Cristina Bowerman.

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `burro` Burro Furbetto | Butter | ●●●●● 5 | | Only Pecorino, pepper and pasta water; the cream is the cheese emulsion. In 2025 Rome's restaurateurs protested a British food website's recipe with butter and Parmesan until it was rewritten. | [Gambero Rosso 2025](https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/); [Open 2025](https://www.open.online/2025/08/06/pasta-cacio-pepe-ricetta-burro-parmigiano-bbc/); [Euronews 2025](https://www.euronews.com/culture/2025/08/11/explained-how-a-pasta-recipe-has-triggered-a-diplomatic-row-between-uk-and-italy) |
| `panna` Panna Invasora | Cream | ●●●●○ 4 | | A shortcut that hides a failed emulsion; even the corrected British recipe was criticised for a double-cream rescue tip. | [Gambero Rosso](https://www.gamberorosso.it/attualita/ricetta-vera-cacio-pepe/); [Euronews 2025](https://www.euronews.com/culture/2025/08/11/explained-how-a-pasta-recipe-has-triggered-a-diplomatic-row-between-uk-and-italy); [StartupItalia 2025](https://startupitalia.eu/lifestyle/cacio-e-pepe-ricetta-sbagliata-bbc/) |
| `parmesan` Spargipolvere | Parmesan | ●●●●○ 4 | C | "Cacio" here means Pecorino Romano; Parmigiano in its place was half of the 2025 scandal. | [Gambero Rosso 2025](https://www.gamberorosso.it/notizie/attualita/caso-cacio-pepe-bbc/); [Wanted in Rome 2025](https://wantedinrome.com/news/italy-controversy-butter-uk-recipe-cacio-e-pepe.html); [Centro Meteo Italiano](https://www.centrometeoitaliano.it/attualita/alessandro-borghese-la-ricetta-e-i-segreti-per-cucinare-al-meglio-la-sua-famosa-cacio-e-pepe-172107/) (Alessandro Borghese) |
| `olio` Olio Sbagliato | Olive oil | ●●●○○ 3 | C | The fat comes from the cheese, so oil is unnecessary and can split the sauce. Dissapore ran a headline calling oil in cacio e pepe an "atrocity". | [Dissapore](https://www.dissapore.com/cucina/atrocita-onta-ripulsa-lolio-nella-cacio-e-pepe-non-va/); [Dissapore](https://www.dissapore.com/cucina/battaglie-culturali-via-lolio-dalla-cacio-e-pepe/); [Scatti di Gusto](https://www.scattidigusto.it/la-ricetta-migliore-come-fare-la-cacio-e-pepe-mantecata-e-senza-olio) |

**Contested and caveat notes**

- *Parmesan.* A published Alessandro Borghese cacio e pepe reportedly blends Parmigiano with Pecorino
  (single secondary source), and Dissapore argued Parmigiano is still better than the gel stabiliser many
  restaurants use. Replacing Pecorino entirely is what draws outrage.
- *Olive oil.* Dissapore reports that the cook at Felice a Testaccio, a famous Roman trattoria, uses oil,
  so even Rome is split. It comes last in the wave order.

**Also researched, not in the game:** cornstarch ●●○○○ 2 **C** (the 2025 Ig Nobel physicists use a pinch,
and Linkiesta reports Monosilio does too, so many accept it); sodium citrate ●○○○○ 1 **C** (kept by the
culinary lens only; the cited page speaks of a "gel stabiliser" in general).

**Accepted in Italy:** some Parmigiano blended in (chef versions); a pinch of starch; spaghetti or short shapes.

**Method crimes in the waves:** overcooked pasta, the pasta-rinser, the cold pot.

**Fun facts**

- In 2025 Italian physicists working with the Max Planck Institute in Dresden won the Ig Nobel Prize for
  Physics with the paper "Phase behavior of Cacio and Pepe sauce".
- The 2025 BBC Good Food row reached the British embassy in Rome; the recipe was rewritten with three ingredients.
- Add guanciale to cacio e pepe and Romans will tell you it has become gricia: cacio e pepe, gricia,
  amatriciana and carbonara are one family.

---

## 6. Pizza Margherita

*Margherita pizza* · **Le Pizze** · Origin: Naples, Campania. Tradition dates it to 1889 and a royal visit;
treat that as legend, as tomato-mozzarella-basil pizzas existed earlier · Base: Neapolitan dough of wheat
flour, water, salt and brewer's yeast (the AVPN also allows a natural starter), stretched by hand, never
with a rolling pin or press, into a disc no wider than 35 cm with a raised rim, baked 60–90 s in a
wood-fired oven at about 485 °C (EU STG figures)

> *In-game blurb:* Naples' red, white and green icon, protected as an EU STG: raw tomato, mozzarella or fior di latte, basil and olive oil on hand-stretched dough.

**The proper recipe**

- **Pomodori pelati** crushed raw (or fresh cherry tomatoes): the tomato cooks in the oven, not before.
- **Mozzarella STG or fior di latte** (the STG names Mozzarella STG; the AVPN says "mozzarella or fior di
  latte"); **Mozzarella di Bufala Campana DOP** is a listed alternative (often called a "bufalina").
- **Basilico fresco**; **olio extravergine** (the STG requires extra virgin); salt.
- **Grated hard cheese** (Parmigiano or pecorino): optional and accepted, listed by the AVPN rules (not in the STG list).

**Collect in the game:** Impasto napoletano · Pomodoro · Mozzarella · Basilico · Olio extravergine.

**Authority sources**

- [AVPN International Regulations 2024 (English)](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) —
  summary: Marinara = tomato, oil, oregano, garlic; Margherita = tomato, oil, mozzarella or fior di latte,
  grated cheese, basil. [AVPN Disciplinare 2022 (Italian)](https://www.pizzanapoletana.org/public/pdf/Disciplinare_AVPN_2022.pdf).
- [Commission Regulation (EU) No 97/2010, Pizza Napoletana STG](https://eur-lex.europa.eu/eli/reg/2010/97/oj) —
  summary: base ingredients and the permitted toppings (garlic, oregano, buffalo mozzarella, basil,
  Mozzarella STG); it covers the Marinara and the Margherita.
  [STG text (Horecanews copy)](https://horecanews.it/wp-content/uploads/2022/11/pizza-napoletana-stg.pdf).
- [Dissapore on Reg. (EU) 2022/2313](https://www.dissapore.com/notizie/pizza-napoletana-lue-elimina-dai-menu-quella-che-non-rispetta-il-disciplinare-di-produzione/)
  and [on hand stretching only](https://www.dissapore.com/alimentazione/pizza-napoletana-stg-cambia-il-disciplinare-e-si-conferma-unassurdita/);
  [Scatti di Gusto: mozzarella vs fiordilatte (2012)](https://www.scattidigusto.it/2012/07/05/bufala-vieni-a-vedere-se-sulla-pizza-ci-va-mozzarella-o-fiordilatte/).

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `ananas` Ananas Corazzato (+ `ananas_pezzo` chunks) | Pineapple | ●●●●● 5 | C | In neither the STG nor the AVPN rules; its sweetness clashes with the tomato. A famous Naples pizzaiolo's "Margherita with pineapple" (end of 2023) caused a national row. | [ANSA 2023](https://ansa.it/amp/english/news/lifestyle/food_wine/2023/12/30/famed-naples-pizza-maker-adds-pineapple-spurring-row_1717aa08-bf5e-4cc7-8a36-faf3e42e72fd.html); [CBC 2024](https://www.cbc.ca/lite/story/1.7107921); [Open 2023](https://www.open.online/2023/12/31/sorbillo-pizza-ananas-reazione-utenti-video/) (Gino Sorbillo); [YouGov 2022](https://yougov.co.uk/international/articles/40810-italian-food-crimes) |
| `hawaiana` Fetta Hawaiana | Ham & pineapple "Hawaiian" | ●●●●● 5 | C | The "Hawaiian" was invented in Canada in 1962. Italians rated pineapple on pizza −63 in YouGov's survey. | [YouGov 2022](https://yougov.co.uk/international/articles/40810-italian-food-crimes); [Euronews 2022](https://www.euronews.com/culture/2022/02/18/angry-chef-reacts-to-the-11-worst-crimes-committed-against-italian-food) (Vincenzo's Plate); [Gambero Rosso 2024](https://www.gamberorosso.it/attualita/pizza-ananas-cannavacciuolo-masterchef/) (Antonino Cannavacciuolo) |
| `macchiata` Margherita Macchiata | Ketchup on pizza | ●●●○○ 3 | | The Margherita's tomato is plain, raw and crushed; ketchup is cooked, sweet and vinegary. Coldiretti lists ketchup pizza among foreign "horrors". | [MeteoWeb 2023](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/); [Il Fatto Quotidiano 2023](https://www.ilfattoquotidiano.it/2023/08/02/ketchup-sulla-pizza-spaghetti-tagliati-con-le-forbici-e-ghiaccio-nel-vino-rosso-il-tiktoker-americano-uccide-la-cucina-italiana/7249975/) |
| `pollo` Pollo Infiltrato | Chicken on pizza | ●●●○○ 3 | | Everywhere on pizza abroad, almost nowhere in Italian pizzerias; on Coldiretti's list of horrors. | [Il Post 2022](https://www.ilpost.it/2022/02/18/pizze-straniere-ingredienti/); [Sky TG24 2023](https://tg24.sky.it/lifestyle/2023/12/07/pizza-zebra-yogurt-dati); [Dissapore](https://www.dissapore.com/notizie/meta-pollo-meta-pizza-kfc-presenta-la-chizza/) |
| `bbq` Salsa Barbecue | BBQ sauce | ●●○○○ 2 | | A foreign topping Italian pizzerias do not use. In early 2022 the only chain offering BBQ chicken pizza in Italy was American, and it left Italy that August. | [Il Post 2022](https://www.ilpost.it/2022/02/18/pizze-straniere-ingredienti/); [Il Post 2022](https://www.ilpost.it/2022/08/10/chiusura-dominos-pizza-italia-fallimento-franchising/) |
| `cheddar` Cheddar Arancione | Cheddar | ●○○○○ 1 | | Mozzarella or fior di latte only; Coldiretti singles out "Anglo-Saxon cheddar" on pizza abroad. | [MeteoWeb 2023](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) |
| `pepperoni` Peperone Equivoco | "Pepperoni" (the American salami, and the word) | ●●○○○ 2 | C | "Peperoni" means bell peppers in Italian; Italians order a diavola with salame piccante and find "pepperoni pizza" funny. | [Ooni](https://uk.ooni.com/blogs/ooni-insights/why-italians-dont-eat-pepperoni); [Explore](https://explore.com/1549092/popular-type-pizza-pepperoni-never-find-italy-unless-tourist-trap); [La Voce di New York 2026](https://lavocedinewyork.com/food/2026/11/02/pepperoni-pizza-la-regina-americana-che-confonde-gli-italiani/) (not re-checked) |

**Contested and caveat notes**

- *Pineapple.* Since about 2017 a few star pizzaioli have broken the taboo: Gino Sorbillo (a 2017 tasting
  night, then the 2023 menu item), Franco Pepe's "AnaNascosta" (pineapple wrapped in ham, since 2019),
  Simone Lombardi; YouTube chef Vincenzo's Plate even published a pineapple pizza. It is still the
  number-one pizza crime for most Italians, so it stays the level's final boss.
- *Hawaiian.* Cooked ham is a classic Italian pizza topping; the complaint is the pineapple.
- *Ketchup.* Sorbillo's 2023 datterini-tomato "ketchup" Margherita was a provocation, not a variant.
- *"Pepperoni".* American pepperoni is a close cousin of southern Italian spicy salami; Italians joke about
  the word and dislike the industrial product, not spicy salami on pizza.

**Also researched, not in the game:** imitation "Parmesan" ●○○○○ 1 (only the fake: real grated cheese is
allowed); banana ●●○○○ 2, exotic meats and insects ●○○○○ 1 and kiwi ●○○○○ 1 (Neapolitan toppings pool).

**Accepted in Italy, so NOT enemies on any pizza:** a sprinkle of real grated Parmigiano or pecorino;
fior di latte or buffalo mozzarella; cherry tomatoes; **panna** and **mais** (common in Italian pizzerias,
often with cooked ham; purists sneer, but they are not foreign crimes); **würstel e patatine** (the kids'
"pizza americana"); tonno e cipolla; cooked ham, mushrooms, artichokes, olives, anchovies; sausage and
friarielli; spicy salami and 'nduja; chocolate-hazelnut spread on a *dessert* pizza.

**Fun facts**

- The Margherita and the Marinara are the only pizzas codified by the EU "Pizza Napoletana" STG, and since
  Regulation (EU) 2022/2313 the name "Pizza Napoletana" itself is reserved for pizza made to that specification.
- UNESCO added the art of the Neapolitan pizzaiuolo to its Intangible Cultural Heritage list on 7 December 2017.
- Italian food media have mocked people who condemn pineapple pizza while happily eating würstel-and-fries pizza
  ([Scatti di Gusto 2023](https://www.scattidigusto.it/2023/12/30/pizza-allananas-condanni-sorbillo-e-mangi-la-wurstel-e-patatine/)).

---

## 7. Pizza Marinara

*Marinara pizza* · **Le Pizze** · Origin: Naples, Campania; considered the oldest classic Neapolitan pizza
· Base: the same hand-stretched Neapolitan dough and wood-fired bake as the Margherita

> *In-game blurb:* The oldest classic Neapolitan pizza: tomato, garlic, oregano and olive oil. No cheese, and no seafood, whatever the name suggests.

**The proper recipe:** peeled tomatoes crushed raw; peeled, sliced **garlic**; dried **oregano**;
**extra virgin olive oil**; salt. A basil leaf is optional (not in the STG or AVPN definition, but nobody
mocks it). No cheese of any kind: the AVPN defines it as tomato, oil, oregano and garlic.

**Collect in the game:** Impasto napoletano · Pomodoro · Aglio · Origano · Olio extravergine.

**Authority sources:** [AVPN International Regulations 2024](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf)
(summary: tomato, oil, oregano and garlic); [Reg. (EU) No 97/2010](https://eur-lex.europa.eu/eli/reg/2010/97/oj)
(garlic and oregano are permitted, for the Marinara); [Wikipedia: Pizza marinara](https://en.wikipedia.org/wiki/Pizza_marinara)
(the name comes from *marinaro*, of sailors); [Napolike](https://www.napolike.it/storia-della-pizza-napoletana-unesco)
(paraphrase: the typical meal of sailors); [Scatti di Gusto: the best marinaras in Naples](https://www.scattidigusto.it/pizzerie/migliori-pizze-marinara-napoli).

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources |
|---|---|---|---|---|---|
| `filante` La Filante Abusiva | Mozzarella (any cheese) | ●●○○○ 2 | | Defined with no cheese at all; its long-lasting ingredients are why it is linked to Naples' sailors. Mozzarella makes it a different pizza. | [AVPN 2024](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf); [Wikipedia](https://en.wikipedia.org/wiki/Pizza_marinara) |
| `gamberi` Gambero Saltatore | Prawns (seafood) | ●●○○○ 2 | | Despite the name, no fish or seafood: "marinara" refers to sailors (*marinai*), not to food from the sea. | [Wikipedia](https://en.wikipedia.org/wiki/Pizza_marinara); [Napolike](https://www.napolike.it/storia-della-pizza-napoletana-unesco) |
| `vongola` Vongola Formaggiosa | Clams (seafood) | ●●○○○ 2 | | As above: the sailors' pizza, not a seafood pizza. | [Napolike](https://www.napolike.it/storia-della-pizza-napoletana-unesco); [Wikipedia](https://en.wikipedia.org/wiki/Pizza_marinara) |
| `parmesan` Spargipolvere | Grated cheese | ●○○○○ 1 | | The AVPN gives grated cheese to the Margherita, not to the cheese-free Marinara. | [AVPN 2024](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) |
| `cheddar` Cheddar Arancione | Cheddar | ●●○○○ 2 | | No cheese of any kind, least of all the "Anglo-Saxon cheddar" Coldiretti calls out abroad. *Adapted from the pizza research* (see [editorial calls](#editorial-calls-in-the-game-data)). | [MeteoWeb 2023](https://www.meteoweb.eu/2023/12/dallananas-ai-grilli-ecco-la-pizzeria-degli-orrori/1001335834/) |

**Accepted in Italy:** a basil leaf; anchovies. Everything in the Margherita's "accepted" list still holds
for Italian pizza in general, but not on a Marinara, which has no cheese.

**Extra in the waves:** tinned pineapple chunks.

**Fun facts**

- The Marinara is considered older than the Margherita.
- Abroad, "marinara" can mean a cooked tomato sauce or even a seafood pizza; in Naples it means tomato,
  garlic, oregano and oil. Confusingly, in Rome a pizza called "napoletana" means tomato, mozzarella and anchovies.
- In 2022 Scatti di Gusto questioned a restaurant chef's "pizza marinara in bustina" (in a packet).

---

## 8. Tagliatelle al Ragù

*Tagliatelle with Bolognese meat ragù* · **Dal Nord** · Origin: Bologna, Emilia-Romagna; the recipe was
registered by the Accademia Italiana della Cucina in 1982 and updated in 2023 · Pasta: fresh egg
tagliatelle. The same ragù goes into lasagne verdi, and Bolognese custom allows it on dry pasta such as
rigatoni or maccheroni. Spaghetti is the classic complaint.

> *In-game blurb:* Bologna's slow-cooked meat sauce, registered by the Accademia Italiana della Cucina (1982, updated 2023) and served on fresh egg tagliatelle.

**The proper recipe** (the Accademia's text of 20 April 2023, as reported)

- **Coarsely ground beef** (about 400 g), replacing the 1982 recipe's "cartella", a fatty cut.
- **Fresh pork pancetta** (about 150 g); cured flat or rolled pancetta is an admitted variant, smoked is not.
- **Onion, carrot and celery**, finely chopped: apart from an optional hint of nutmeg, the only aromatics.
- **Passata** plus a spoonful of double concentrate: a meat sauce, not a tomato sauce.
- **A glass of dry wine**, red or white; **whole milk** (optional); a **light broth** (even from a stock
  cube); **extra virgin olive oil**; salt and pepper.
- Admitted variants: mixed beef (about 60 %) and pork loin or neck (about 40 %); knife-chopped meat.
  Optional enrichments suggested with the update (press reports): chicken livers, hearts and gizzards;
  crumbled sausage; peas; soaked dried porcini.
- Fresh egg **tagliatelle**; **Parmigiano** at the table by custom (not part of the registered sauce).

*Method.* Soften the soffritto in oil with the pancetta, brown the beef, deglaze with wine, add passata
and concentrate, then simmer covered on a very low heat for 2–3 hours, adding broth and, if you like,
milk. Toss with tagliatelle.

**Collect in the game:** Manzo macinato · Pancetta ("Fresh pork pancetta, never smoked") · Soffritto · Passata di pomodoro · Vino · Tagliatelle all'uovo.

**Authority sources**

- [Accademia Italiana della Cucina: Ragù alla bolognese, ricetta aggiornata 20 aprile 2023 (PDF)](https://accademiaitalianadellacucina.it/sites/default/files/Ragù%20alla%20bolognese%20-%20ricetta%20aggiornata%2020%20aprile%202023.pdf) —
  ✓ "VARIANTI AMMESSE 1) Carni miste: manzo (circa il 60%) e maiale (circa il 40%) (lombo o capocollo);
  2) Carni tritate al coltello; 3) Pancetta stesa o arrotolata di maiale al posto della pancetta fresca;
  4) Un profumo di noce moscata;". [English version (PDF)](https://www.accademiaitalianadellacucina.it/sites/default/files/Ragù%20alla%20bolognese%20-%20updated%20recipe_20%20April%202023.pdf).
- [Accademia announcement](https://accademiaitalianadellacucina.it/en/node/62013) — ✓ "from 20 April 2023 the
  reference text will differ from that deposited in the Bologna Chamber of Commerce on 17 October 1982."
- [Camera di Commercio di Bologna press release (2023, PDF)](https://www.bo.camcom.gov.it/sites/default/files/comunicazione/comunicati/2023/comunicato%20stampa%20deposito%20rinnovata%20ricetta%20vero%20Ragù%20alla%20bolognese%2020%20aprile%202023.pdf).
- [LaPresse (2023)](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) —
  ✓ "Non sono ammesse, invece, la polpa di vitello e la pancetta affumicata, così come solo la carne di
  maiale, aglio, rosmarino, prezzemolo o altri aromi. Vietati brandy e farina." (Not allowed: veal, smoked
  pancetta, pork alone, garlic, rosemary, parsley or other aromatics. Brandy and flour are forbidden.)
- [Bologna city heritage sheet: Tagliatella al ragù (2022, PDF)](https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf) —
  ✓ "Quando il ragù è pronto, secondo l'uso bolognese, si usa aggiungere la panna se si tratta di condire
  paste secche. Per le tagliatelle il suo uso è da escludere." (By Bolognese custom cream is added when the
  ragù dresses dry pasta; for tagliatelle it is ruled out.) *The dish's in-game quote.*
- [Dissapore (2023)](https://www.dissapore.com/notizie/ragu-alla-bolognese-aggiornata-la-ricetta-ufficiale-pancetta-e-manzo-al-posto-della-cartella/);
  [Sky TG24 (2023)](https://tg24.sky.it/lifestyle/2023/04/20/ragu-alla-bolognese-ricetta-originale).

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `fantasma` Spaghetti Fantasma | Spaghetti bolognese | ●●●●● 5 | C | In Bologna ragù goes on egg tagliatelle, whose wide, porous surface holds the sauce. In 2019 Bologna's mayor asked for photos of "spaghetti bolognese" from around the world, calling it a dish that does not exist. | [CBC 2019](https://www.cbc.ca/lite/story/1.5041024) ✓ "Spaghetti Bolognese doesn't actually exist; yet, it's famous the world over"; [Italy Segreta](https://italysegreta.com/it/gli-spaghetti-alla-bolognese-non-esistono/); [Vincenzo's Plate](https://www.vincenzosplate.com/the-secret-to-authentic-bolognese-sauce/) (Vincenzo Prosperi) |
| `aglio` Aglio in Camicia | Garlic | ●●●●○ 4 | | The registered recipe names garlic among the ingredients not allowed; the aromatic base is onion, carrot and celery only. | [LaPresse 2023](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) ✓; [Il Resto del Carlino 2023](https://www.ilrestodelcarlino.it/bologna/cultura/ragu-bolognese-ricetta-camera-di-commercio-p04w1fsk) ✓ "Aglio, rosmarino, prezzemolo, altri aromi o spezie"; [AGI 2023](https://www.agi.it/cronaca/news/2023-04-20/vero_ragu_bolognese_ricetta_aggiornata_ingredienti-21053153/) |
| `panna` Panna Invasora | Cream | ●●●○○ 3 | C | Bologna's heritage text rules cream out for tagliatelle al ragù; the registered softener is whole milk. A major US newspaper's creamy "white Bolognese" (2016) drew Italian protests. | [Bologna heritage sheet 2022](https://assets.culturabologna.it/ddbb8840-5178-4a44-b17b-de32ecf6f74e-2022-tagliatella-al-ragu.pdf) ✓; [The Local 2016](https://cms.thelocal.com/?p=384656); [Travel Emilia-Romagna 2016](https://www.travelemiliaromagna.it/en/?p=44632) (Bruno Barbieri) |
| `bacon` Bacon Abusivo | Smoked pancetta (or bacon) | ●●○○○ 2 | | The recipe uses fresh, unsmoked pancetta; smoked pancetta is explicitly not allowed, and foreign recipes often use bacon. | [LaPresse 2023](https://www.lapresse.it/cronaca/2023/04/20/cambia-la-ricetta-del-ragu-bolognese-eccola/) ✓ |

**Contested and caveat notes**

- *Spaghetti.* The mayor was Virginio Merola. Bolognese custom does put ragù on dry pasta, Il Fatto
  Quotidiano and Gambero Rosso have argued spaghetti alla bolognese has a real history, most Italians in
  YouGov's 2022 survey rated ragù on spaghetti acceptable (net **+81**), and Roman creator Max Mariola has a
  "Spaghetti alla bolognese" video. A loud Bologna-led complaint, not a national consensus.
- *Garlic* is common in home meat sauces elsewhere in Italy; the exclusion is specific to the Bolognese recipe.
- *Cream.* The 2016 chef was Bruno Barbieri. The rule is "no cream with tagliatelle", not "no cream ever";
  some food historians say Artusi's 1891 Bolognese sauce was finished with cream (not re-checked).

**Also researched, not in the game:** basil ●●○○○ 2; oregano, chili and other spices ●●○○○ 2; rosemary
●○○○○ 1 **C** (some Emilian families have always used it); parsley ●○○○○ 1; veal ●○○○○ 1 **C** (common in
home ragù outside Bologna); brandy ●○○○○ 1. *Not merged:* eggs (a 2026 Spanish starred chef's ragù with
three eggs; headline only, unclear which ragù).

**Accepted in Italy:** whole milk, olive oil, a light broth even from a stock cube, nutmeg; mixed beef and
pork, knife-chopped meat, red or white wine; chicken livers, sausage, **peas** (mocked in carbonara, fine
here), dried porcini; cream when the ragù dresses *dry* pasta.

**Extras in the waves:** frozen lasagna and the rolling meatball.

**Fun facts**

- Thickening with flour is forbidden, and so is brandy.
- A golden tagliatella deposited at the Bologna Chamber of Commerce in 1972 fixes its cooked width at
  about 8 mm, said to be 1/12,270 of the height of the Asinelli tower. (1972 is the tagliatella's year;
  the ragù was registered in 1982.)

---

## 9. Trofie al Pesto Genovese

*Trofie with Genoese basil pesto* · **Dal Nord** · Origin: Genoa, Liguria · Pasta: trofie, trenette (often
"avvantaggiate" with potatoes and green beans), mandilli de sea, testaroli, gnocchi

> *In-game blurb:* Genoa's raw green sauce: Genoese basil, olive oil, pine nuts, garlic, salt, Parmigiano and Sardinian pecorino, pounded in a marble mortar.

**The proper recipe** (the Consorzio's seven-ingredient rule, as described by Gambero Rosso)

- **Basilico Genovese DOP**, young small leaves (the basil, not the sauce, is the DOP product).
- **Extra virgin olive oil**, preferably Ligurian.
- **Parmigiano Reggiano** (Grana Padano accepted) and **Sardinian pecorino** (Fiore Sardo, Pecorino Sardo
  or Romano: sources differ, all accepted).
- **Pinoli** (one source says walnuts are allowed in the same quantity; not verified against the text).
- **Aglio**, ideally from Vessalico; how much is debated, so it is never an intruder either way.
- Coarse salt, as an abrasive in the mortar. Potatoes and green beans boiled with the pasta: optional and traditional.

*Method.* Crush garlic with coarse salt in a marble mortar, grind in the basil with a rotating pestle,
work in pine nuts and the cheeses, then loosen with olive oil. Never cook it: toss off the heat with the pasta.

**Collect in the game:** Basilico · Pinoli · Aglio · Olio extravergine · Parmigiano Reggiano · Pecorino (the seventh ingredient, salt, is not a pickup).

**Authority sources**

- [Gambero Rosso: 10 pesti genovesi (the seven-ingredient rule)](https://www.gamberorosso.it/notizie/rubriche/classifiche/10-pesti-genovesi-classifica-gambero-rosso/);
  [Visit Italy](https://www.visititaly.eu/it/cibo-e-sapori/pesto-genovese-ricetta);
  [Italia.it](https://www.italia.it/it/liguria/cosa-fare/pesto-alla-genovese).
- [Dissapore](https://www.dissapore.com/notizie/il-pesto-e-una-delle-salse-italiane-piu-vendute-al-mondo-ma-non-ha-ancora-un-disciplinare/) —
  ✓ headline "Il pesto è una delle salse italiane più vendute al mondo, ma non ha ancora un disciplinare"
  (pesto still has no official production rules).
- [Pesto al mortaio, la ricetta di Roberto Panizza (Scatti di Gusto, 2019)](https://www.scattidigusto.it/pesto-al-mortaio-la-ricetta-di-roberto-panizza-da-fare-a-casa/) —
  the Genoese restaurateur behind the World Pesto Championship.
- [Gambero Rosso 2026: an 85-year-old Genoese woman wins the World Pesto al Mortaio Championship](https://www.gamberorosso.it/notizie/attualita/donna-genovese-85-anni-vincitrice-campionato-mondiale-pesto-mortaio-2026/);
  [Associazione Palatifini](https://www.pestochampionship.it/who-we-are/?lang=en).

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `panna` Panna Invasora | Cream | ●●●●○ 4 | | Not among the seven raw ingredients, and it dulls the basil; a long-running argument in Italian food writing. | [Gambero Rosso](https://www.gamberorosso.it/notizie/rubriche/classifiche/10-pesti-genovesi-classifica-gambero-rosso/); [Gazzetta del Gusto](https://gazzettadelgusto.it/cibo/10-curiosita-sul-pesto-genovese-tra-storia-e-rituali/) |
| `anacardo` Anacardo Abusivo | Cashews | ●●●○○ 3 | | Cheap industrial jars replace pine nuts with cashews: the mark of an imitation "alla genovese". | [Dissapore](https://www.dissapore.com/spesa/il-migliore-pesto-genovese-in-barattolo/) ✓ "Il pesto migliore: oli vegetali, addensanti e anacardi che vi risparmiate"; [L'Indipendente 2025](https://www.lindipendente.online/2025/09/01/pesto-genovese-o-alla-genovese-il-tranello-dellindustria-alimentare/) |
| `olio` Olio Sbagliato | Seed oil (sunflower) | ●●●○○ 3 | | The recipe wants extra virgin olive oil, ideally Ligurian; many commercial pestos swap in seed oils. | [Dissapore](https://www.dissapore.com/spesa/il-migliore-pesto-genovese-in-barattolo/); [Il Fatto Alimentare](https://ilfattoalimentare.it/confronto-prodotti-pesto-alla-genovese-tabella-ingredienti-prezzi.html) |
| `burro` Burro Furbetto | Butter | ●●●○○ 3 | C | Not among today's seven ingredients. A waitress at a Genoa pesto restaurant called it a crime, like cream in carbonara; when a Milan-area star chef defended butter in 2015, Genoa called it "stuff for the Milanese". | [Internazionale 2023](https://www.internazionale.it/essenziale/notizie/tom-landolfi/2023/01/04/caccia-pesto-perfetto) ✓ "Il burro no, è reato, non scherziamo. Sarebbe come mettere la panna nella carbonara"; [Dissapore 2015](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-burro/) (Davide Oldani) ✓ "Davide Oldani insiste con il burro ma a Genova dicono che è roba per milanesi" |
| `parmesan` Spargipolvere | Generic or non-Italian cheese | ●○○○○ 1 | C | The cheeses are Parmigiano (or Grana) and Sardinian pecorino; purists reject Gouda versions, and Coldiretti complains about generic cheese in pesto abroad. | [Scatti di Gusto 2016](https://www.scattidigusto.it/ricetta-pesto-ingredienti-alternativi) (Roberto Panizza); [MeteoWeb 2016](https://www.meteoweb.eu/2016/04/il-made-in-italy-taroccato-non-e-solo-carbonara-gate-dalla-falsa-caprese-alla-pizza-ecco-le-peggiori-imitazioni/666794/) |

The butter quote is the dish's in-game quote ("a waitress at a Genoa pesto restaurant, to Internazionale").

**Contested and caveat notes**

- *Cream* was a common restaurant and home shortcut, so some Italians eat it, but no Genoese authority accepts it.
- *Butter.* The 2015 chef was Davide Oldani; the restaurant was Roberto Panizza's Il Genovese. The first
  printed Genoese pesto (G.B. Ratto, *La Cuciniera Genovese*, 1863), as usually quoted, used "poco burro",
  and Ada Boni gives butter variants. Today's tradition excludes it.
- *Cheese.* Ratto's 1863 recipe, as usually quoted, mixed a Dutch cheese with Parmigiano (not re-checked).

**Also researched, not in the game:** walnuts ●●○○○ 2 **C** (Liguria has its own walnut sauce for pansoti);
parsley ●○○○○ 1 **C** and mint ●○○○○ 1 (a Massimo Bottura parsley-and-mint "pesto" video ✓ "ha scatenato
l'ira dei genovesi", [Blitz Quotidiano](https://archivio.blitzquotidiano.it/video/massimo-bottura-pesto-genovese-video-2844499));
rocket ●○○○○ 1 **C** (pesto di rucola is a fine recipe of its own).

**Accepted in Italy:** potatoes and green beans with the pasta; Grana Padano; Pecorino Romano, Sardo or
Fiore Sardo; garlic in any amount; rocket pesto and walnut sauce *as their own recipes*.

**Extra in the waves:** the viral phone (viral pesto videos).

**Fun facts**

- Roberto Panizza describes pesto as essentially a garlic sauce flavoured with basil: garlic is essential
  here, though banned from carbonara and amatriciana.
- Pesto is not a DOP sauce and has only a voluntary Consorzio recipe, so jars may say "alla genovese" with swapped ingredients.
- A 2025 video of a Milan restaurant putting pesto on pansoti (which Ligurians dress with walnut sauce)
  went viral and drew sarcastic replies from Genoa.

---

## 10. Spaghetti alle Vongole

*Spaghetti with clams* · **Dal Sud e dal Mare** · Origin: Naples, Campania · Pasta: spaghetti (also vermicelli or linguine)

> *In-game blurb:* Naples on a plate: clams, olive oil, garlic, parsley and the sea's own juices clinging to spaghetti. No cheese, no cream, no butter.

**The proper recipe**

- **Spaghetti**; **vongole veraci**, purged of sand first (discard any that are open before cooking; some
  Neapolitan cooks also use the smaller lupini).
- **Extra virgin olive oil**: the only fat. **Garlic**, a clove or two, often removed. **Parsley**, off the heat.
- **Chili**, optional; **dry white wine**, optional; a few **cherry tomatoes** are a widely accepted "red"
  variant, but the classic Neapolitan version is *in bianco*.

*Method.* Warm garlic (and chili) in oil, add the clams (with a splash of wine if used) and cover until
they open. Keep and filter the liquid. Finish very al dente spaghetti in the pan with that juice until it
turns creamy from starch alone; add parsley off the heat.

**Collect in the game:** Spaghetti · Vongole veraci · Aglio · Olio extravergine · Prezzemolo · Peperoncino.

**Authority sources**

- [In cucina: spaghetto a vongole (Italy Segreta)](https://italysegreta.com/it/in-cucina-spaghetto-a-vongole/) — in Naples it is cooked strictly in bianco.
- [Spaghetti alle vongole (Wikipedia)](https://en.wikipedia.org/wiki/Spaghetti_alle_vongole) — ✓ "in its area
  of origin this would be considered most unorthodox" (said of cream in some Italian-American recipes).
- [I 7 errori più frequenti (Centro Meteo Italiano)](https://www.centrometeoitaliano.it/attualita/i-7-errori-piu-frequenti-che-non-vanno-commessi-quando-si-preparano-gli-spaghetti-alle-vongole-175750/);
  [4 errori da evitare (Dissapore)](https://www.dissapore.com/cucina/spaghetti-alle-vongole-4-errori-da-evitare-se-volete-un-piatto-perfetto/) (search result only).

**Intruders in the game**

| Enemy | Intruder | Popularity | C | Why Italians object | Sources (chefs in brackets) |
|---|---|---|---|---|---|
| `vongola` Vongola Formaggiosa | Cheese on clams | ●●●●● 5 | C | An unwritten rule: no grated aged cheese on fish and shellfish pasta, because it covers the clams. YouGov 2022: cheese on seafood pasta −39. The classic tourist mistake. | [Vincenzo's Plate](https://www.vincenzosplate.com/italian-food-mistakes-americans-make/) (Vincenzo Prosperi) ✓ "If you order spaghetti alle vongole in Italy and ask for cheese on top, your waiter will look at you with an expression you will not forget."; [YouGov 2022](https://business.yougov.com/content/40810-italian-food-crimes) |
| `parmesan` Spargipolvere | Grated Parmesan | ●●●●● 5 | C | Same rule, same survey: asking for grated Parmigiano on clams is the classic tourist mistake. | [Gambero Rosso](https://www.gamberorosso.it/notizie/attualita/new-york-times-cacio-pepe-tonno/) ✓ "quella di non condire con del formaggio, soprattutto stagionato come Pecorino o Parmigiano, un piatto che contenga del pesce"; [Foodie](https://www.foodie.com/1593411/mistakes-make-ordering-italian-food) ✓ "Any seafood pastas with a cheese or cream-based sauce will be indicative of a non-authentic Italian restaurant." |
| `burro` Burro Furbetto | Butter | ●●●●○ 4 | C | The Neapolitan recipe uses only olive oil. In December 2023 a famous TV chef posted vongole finished with butter and Italian social media erupted. | [Dissapore](https://www.dissapore.com/notizie/bruno-barbieri-mette-il-burro-negli-spaghetti-con-le-vongole-e-scatena-il-panico/) (Bruno Barbieri); [Il Fatto Quotidiano 2023](https://www.ilfattoquotidiano.it/2023/12/24/bruno-barbieri-cucina-gli-spaghetti-alle-vongole-con-il-burro-e-scoppia-il-putiferio-li-rimanderei-indietro-lui-non-me-ne-frega-niente/7393250/) (Bruno Barbieri); [Scatti di Gusto 2024](https://www.scattidigusto.it/2024/01/01/spaghetti-con-vongole-e-burro-cosa-non-va-nella-ricetta-di-barbieri/) |
| `panna` Panna Invasora | Cream | ●●●○○ 3 | | The creaminess comes only from clam juice, oil and pasta starch; dairy cream is a foreign addition that smothers the sea. | [Wikipedia](https://en.wikipedia.org/wiki/Spaghetti_alle_vongole) ✓; [Foodie](https://www.foodie.com/1593411/mistakes-make-ordering-italian-food) ✓ |

The Vincenzo's Plate line is the dish's in-game quote. (The culinary lens thought it close to a paraphrase;
the sources lens matched it verbatim in a search excerpt, so it is marked verified at excerpt level.)

**Contested and caveat notes**

- *Cheese* is a custom, not a law. Pellegrino Artusi's 19th-century recipe for spaghetti with telline (small
  clams) used butter and Parmigiano, but Artusi wrote from Florence. Il Fatto Alimentare argues ✓ "non esiste
  quindi un tabù o tanto meno un divieto tradizionale italiano di associare il pesce al formaggio"
  ([source](https://ilfattoalimentare.it/formaggio-pere-pesce-funghi.html)); starred chef Luca Marchini defends
  fish with cheese, and the Parmigiano Reggiano consortium listed fish dishes where it works (2019). For
  Neapolitan spaghetti alle vongole the no-cheese rule is still close to universal.
- *Butter.* The chef was Bruno Barbieri; Gambero Rosso then argued his recipe "is not wrong", pointing to Artusi.
  The debate is genuine, but butter is not part of the Neapolitan classic.

**Also researched, not in the game:** a heavy tomato sauce or passata ●●○○○ 2 **C** (white versus red is a
real debate; Antonino Cannavacciuolo told the purists to add a little tomato if they like it).
**Cherry tomatoes are never an enemy.**

**Accepted in Italy:** a few cherry tomatoes; white wine; chili; lupini clams; garlic and parsley belong
here. Chef twists (Cannavacciuolo's creamy version with milk) are not mocked.

**Fun facts**

- Naples has "spaghetti con le vongole fujute" ("with the escaped clams"): cherry tomatoes, garlic, chili and
  oil, and no clams at all ([Gambero Rosso](https://www.gamberorosso.it/notizie/ricette/napoli-spaghetti-vongole-fuggite/)).
- Italians' −39 for cheese on seafood pasta is much milder than their −82 for ketchup on pasta: a strong rule, not a national scandal.

---

## 11. Il Menù degli Orrori (the finale)

*The Menu of Horrors* · **Il Gran Finale** · Not a dish: the food court, where every crime is born.

> *In-game blurb:* Not a dish: the lair of every crime on the menu. Gather Nonna's pantry, one sacred ingredient from each corner of Italy, and close the food court for good.

**Collect in the game (Nonna's pantry):** Guanciale (from Rome) · Parmigiano Reggiano (from Emilia) ·
Basilico (from Genoa) · Vongole veraci (from Naples' sea) · Pomodoro (from the Campania sun) · Olio
extravergine (from every corner of Italy).

**Intruders:** the best-known crimes of the menu, each shown with the dish it comes from ("Panna nella
Carbonara? NO!"): cream, smoked bacon, onion, Parmesan instead of Pecorino, peas and mushrooms (from the
Carbonara); ketchup (Pomodoro); pineapple (Margherita); butter (Cacio e Pepe); garlic (Amatriciana);
spaghetti bolognese (Ragù); chicken (Alfredo); cheese on clams (Vongole). The rest of the menu's crimes
can join them, since the finale is exempt from the 80 % rule: the method crimes (snapped spaghetti,
scissors, the cold pot, the single pot, the cursed can, frozen lasagna), the drinks (the cappuccino, which
turns up after the 11:00 event, and the frappé), the viral phone, balsamic glaze, pasta crisps, the
Alfredo blob, the stained Margherita, the Hawaiian slice, "pepperoni", the rolling meatball and the other
dishes' intruders.

> *Fun fact (in-game):* In a 2022 YouGov survey, Italians rated ketchup on pasta at −82, pineapple on pizza
> at −63 and cream in carbonara at −45. They were far kinder to ragù on spaghetti: +81.

---

## Friend or foe: one ingredient, two verdicts

The same ingredient can be sacred in one dish and a crime in the next. The game says so with a one-off
toast, when you collect it where it belongs or meet it where it does not (`FRIEND_OR_FOE` in `recipes.ts`).

| Ingredient | Belongs in | Intruder in | Game enemy |
|---|---|---|---|
| Burro (butter) | Fettuccine Alfredo | Cacio e Pepe, Vongole, Pesto, Carbonara | `burro` |
| Aglio (garlic) | Pomodoro, Marinara, Pesto, Vongole | Amatriciana, Carbonara, Ragù, Alfredo | `aglio` |
| Pancetta | Ragù (fresh) | Amatriciana | `bacon` |
| Parmigiano | Alfredo, Pesto | Carbonara, Amatriciana, Cacio e Pepe (as a replacement for Pecorino), Vongole (on clams) | `parmesan` |
| Mozzarella | Margherita | Marinara | `filante` |
| Onion (soffritto) | Ragù | Carbonara, Amatriciana | `cipolla` |

More cross-dish reminders from the research: peas are mocked in carbonara but accepted in ragù; cream is
mocked in carbonara, Alfredo, cacio e pepe and pesto but common on Italian pizza; Parmigiano is correct
in Alfredo, ragù (at the table) and lasagne.

## Accepted in Italy: never an enemy

The game must never mock these. Each dish section lists its own; the cross-menu essentials:

| Where | Accepted | Source |
|---|---|---|
| Any pizza | Cream, sweetcorn, würstel and fries, tuna and onion, cooked ham, mushrooms, artichokes, olives, anchovies, spicy salami | [Scatti di Gusto 2024](https://www.scattidigusto.it/2024/03/14/identita-di-pizza-2024-la-disobbedienza-e-a-tutta-panna-e-fiordilatte/); [Scatti di Gusto 2023](https://www.scattidigusto.it/2023/12/30/pizza-allananas-condanni-sorbillo-e-mangi-la-wurstel-e-patatine/); [Scatti di Gusto 2023](https://www.scattidigusto.it/2023/05/31/pizza-tonno-e-cipolla-palazzo-petrucci-napoli/) |
| Margherita | Real grated Parmigiano or pecorino; buffalo mozzarella; cherry tomatoes | [AVPN 2024](https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf) |
| Pomodoro | Garlic or onion; cheese on top | [Dissapore](https://www.dissapore.com/grande-notizia/sughi-al-pomodoro-veloci-5-errori/) |
| Carbonara | Yolks only or with whole eggs; some Parmigiano or Grana blended in; rigatoni | [AGI 2023](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/) |
| Amatriciana | White wine; a spoonful of olive oil; black pepper | [Regione Veneto STG copy](https://elezioni2020.regione.veneto.it/documents/10701/3259398/disciplinare_amatriciana_tradizionale_stg.pdf/63e210c6-6444-4ed9-8629-4fc20cab7345) |
| Alfredo | Parmigiano, lots of butter, black pepper | [Gambero Rosso](https://www.gamberorosso.it/notizie/la-storia-delle-fettuccine-alfredo) |
| Ragù | Milk, olive oil, light broth, nutmeg, mixed meats, peas, cream on *dry* pasta | [Accademia](https://accademiaitalianadellacucina.it/en/node/62013) |
| Pesto | Garlic in any amount; potatoes and green beans; Grana Padano | [Scatti di Gusto](https://www.scattidigusto.it/pesto-al-mortaio-la-ricetta-di-roberto-panizza-da-fare-a-casa/) |
| Vongole | Garlic, parsley, a few cherry tomatoes, white wine | [Dissapore](https://www.dissapore.com/grande-notizia/antonino-cannavacciuolo-spaghetti-alle-vongole-con-o-senza-pomodoro/) |

## The most-cited complaints (top 20)

The popular-posts sweep's ranking, adjusted by the editor to the merged popularity scores.

| # | Dish | Intruder | Why it ranks |
|---|---|---|---|
| 1 | Carbonara | Cream | YouGov −45; the 2016 French video, the 2017 celebrity-chef row, Coldiretti reports |
| 2 | Pomodoro | Ketchup | The worst crime in YouGov's survey (−82) |
| 3 | Pizza | Pineapple **C** | YouGov −63; a famous Naples pizzaiolo's 2023–24 pineapple pizza |
| 4 | Carbonara | Smoked bacon | The standard foreign swap; Coldiretti 2024; the 2021 US newspaper row |
| 5 | Carbonara | Onion | The 2016 French one-pot video that led to Carbonara Day |
| 6 | Cacio e pepe | Butter | The 2025 British recipe row that reached the embassy |
| 7 | Amatriciana | Garlic | Excluded by the STG; the 2015 TV-chef row |
| 8 | Carbonara | Tomato | The 2021 "smoky tomato carbonara" |
| 9 | Carbonara | Parmesan instead of Pecorino **C** | Coldiretti complaints; a blend is accepted |
| 10 | Ragù | Spaghetti **C** | Bologna's mayor (2019), though Italians nationally accept it |
| 11 | Alfredo | Chicken | The US version Italian creators mock most |
| 12 | Vongole | Grated cheese **C** | YouGov −39; the classic tourist mistake |
| 13 | Carbonara | Garlic **C** | Chefs' mistakes lists, but the 1954 recipe used it |
| 14 | Carbonara | Pancetta **C** | Canned (2024) and jarred (2025) foreign carbonaras; a home fallback |
| 15 | Alfredo | Cream | Defines US "Alfredo sauce"; few dedicated Italian outrage articles |
| 16 | Amatriciana | Onion **C** | Excluded by the STG; the 2020 TV row |
| 17 | Pizza | Ketchup | The 2023 TikTok ketchup Margherita and a pizzaiolo's provocation |
| 18 | Carbonara | Peas | Coldiretti 2024; the 2020 celebrity-chef video |
| 19 | Carbonara | Mushrooms | The 2020 "revolt in Rome" (sweep only) |
| 20 | Pesto | Butter **C** | Genoa's "stuff for the Milanese" (2015) |

Runners-up: pesto + cream; cacio e pepe + Parmesan or cream; carbonara + white wine, cooked ham, parsley.

## Italian influencer chefs and creators consulted

The brief suggested Italian influencer chefs as a source. None of them is named in the game; the game
uses archetypes ("the Purist Chef", "the TV Judge", "the Pizzaiolo Provocateur"). Several appear on both
sides of a debate, which is why they are useful.

| Who | Where | What the research uses them for |
|---|---|---|
| **Luciano Monosilio** | Roman restaurants, press, Italia Squisita | The "king of carbonara": yolks, Pecorino with Grana Padano, long pasta; anchors the pasta makers' carbonara mistakes guide. [AGI](https://www.agi.it/cronaca/news/2023-04-06/carbonara_day_ricetta_perfetta-20835887/), [Scatti di Gusto](https://www.scattidigusto.it/carbonara-ricetta-perfetta-luciano-monosilio) |
| **Max Mariola** | YouTube, TikTok, Instagram; Gambero Rosso Channel | Roman chef and one of Italy's biggest food creators. **Not a purist**: onion carbonara, onion amatriciana and "spaghetti alla bolognese" videos, so cited as a counter-voice too. [Sky TG24](https://tg24.sky.it/lifestyle/ricette/cacio-e-pepe-ricetta) |
| **Vincenzo's Plate** (Vincenzo Prosperi) | YouTube, own site | Italian-born, Australia-based; "Italian Chef Reacts" videos; ✓ "NO CREAM IN CARBONARA!"; the no-cheese-on-clams quote. Also publishes a pineapple pizza. [vincenzosplate.com](https://www.vincenzosplate.com/history-of-carbonara/) |
| **The Pasta Queen** (Nadia Caterina Munno) | TikTok, Instagram, books | Against chicken Alfredo and cream in Alfredo; ✓ "Chicken alfredo really rubs me the wrong way". [The Daily Meal](https://www.thedailymeal.com/1761698/biggest-misconception-alfredo-pasta-queen) |
| **Italia Squisita** | YouTube (food media brand) | Roman chefs react to carbonara videos; traditional vs gourmet cacio e pepe. [italiasquisita.net](https://italiasquisita.net/it/video/carbonara-gli-chef-reagiscono-ai-video-piu-visti-al-mondo) |
| **Lionfield** (Matteo Salvatori, Emiliano Santoro) | YouTube, TikTok | Italian "pasta police" ("Not approved!"). [Tubefilter](https://www.tubefilter.com/2021/12/18/creators-on-the-rise-lionfield/amp/) |
| **Gino D'Acampo** | ITV This Morning, books | The 2010 live-TV carbonara rebuttal (milk or ham: accounts differ); pineapple pizza. [Food52](https://vercel.food52.com/story/20529-we-can-t-stop-laughing-at-this-old-british-tv-clip) |
| **Bruno Barbieri** | MasterChef Italia, Instagram | Defended traditional ragù (2016), but his butter vongole (2023) caused a row: both sides. [Il Fatto Quotidiano](https://www.ilfattoquotidiano.it/2023/12/24/bruno-barbieri-cucina-gli-spaghetti-alle-vongole-con-il-burro-e-scoppia-il-putiferio-li-rimanderei-indietro-lui-non-me-ne-frega-niente/7393250/) |
| **Antonino Cannavacciuolo** | MasterChef Italia | Sugar in tomato sauce "improponibile"; a little tomato in vongole is fine; sceptical of pineapple pizza. [Dissapore](https://www.dissapore.com/grande-notizia/antonino-cannavacciuolo-spaghetti-alle-vongole-con-o-senza-pomodoro/) |
| **Carlo Cracco** | TV, restaurants | The 2015 garlic-in-amatriciana and onion-in-gricia rows: a source of controversy, not of rules. [Dissapore](https://www.dissapore.com/grande-notizia/carlo-cracco-aglio-in-camicia-nellamatriciana/) |
| **Alessandro Borghese** | Sky TV | His cacio e pepe reportedly blends Parmigiano with Pecorino (single secondary source). [Centro Meteo Italiano](https://www.centrometeoitaliano.it/attualita/alessandro-borghese-la-ricetta-e-i-segreti-per-cucinare-al-meglio-la-sua-famosa-cacio-e-pepe-172107/) |
| **Gino Sorbillo** | Naples pizzerias, social media | Pineapple, ketchup and banana pizzas as provocations: why pineapple is "contested". [Open](https://www.open.online/2023/12/31/sorbillo-pizza-ananas-reazione-utenti-video/) |
| **Franco Pepe** | Pepe in Grani, Caiazzo | "AnaNascosta" (pineapple wrapped in prosciutto) since 2019. [Gambero Rosso](https://www.gamberorosso.it/ristoranti/ananas-pizza-franco-pepe/) |
| **Roberto Panizza** | Il Genovese; World Pesto Championship | The go-to purist voice on pesto ingredients. [Scatti di Gusto](https://www.scattidigusto.it/ricetta-pesto-ingredienti-alternativi) |
| **Davide Oldani** | D'O restaurant | His 2015 butter pesto, dismissed by Genoa. [Dissapore](https://www.dissapore.com/grande-notizia/pesto-alla-genovese-davide-oldani-ci-mette-il-burro/) |
| **Massimo Bottura** | Osteria Francescana | A parsley-and-mint "pesto" video that angered the Genoese. [Blitz Quotidiano](https://archivio.blitzquotidiano.it/video/massimo-bottura-pesto-genovese-video-2844499) |
| **Irina Steccanella** | Italian TV | Sugar in tomato sauce is ✓ "l'Anticristo". [Trend Online](https://www.trend-online.com/food/salsa-di-pomodoro-acida-zucchero/) |
| **Luca Marchini** | Starred restaurant | Defends fish with cheese: the counter-voice to the vongole rule. [First Online](https://www.firstonline.info/en/parmigiano-sul-pesce-e-chi-ha-detto-che-non-si-puo/) |
| **Gianfranco Vissani** (with Cristina Bowerman, Alessandro Pipero) | Restaurants, press | Against the 2024 canned carbonara ("shameful" is in a headline; the other remarks are unverified). [Il Sole 24 Ore](https://en.ilsole24ore.com/art/and-controversy-the-can-carbonara-proposed-by-heinz-vissani-destroys-italian-culture-AFtCnSbD) |

Also consulted for tone, not facts: the outrage accounts @italians_mad_at_food and @ItalianComments.
Not reached for these dishes: Benedetta Rossi, Giorgio Locatelli, Gabriele Bonci, Enzo Coccia, Davide Civitiello.

## Researched but not on the menu

The research covered nine more dishes and a pizza-toppings pool. They are not levels, but their findings
are kept for future levels (popularity of the top intruders in brackets):

- **Pasta alla gricia** (Lazio): onion (3, C), pancetta or bacon (3), tomato (2: a "gricia rossa" is amatriciana).
- **Lasagne verdi alla bolognese**: ricotta (3, C), mozzarella (2, C), garlic in the meat sauce (2). Ricotta,
  little meatballs and hard-boiled eggs are authentic in Neapolitan Carnival lasagna.
- **Tortellini in brodo** (Bologna): cream (4, C: tortellini alla panna is on many Bolognese menus), chicken
  instead of pork (4, C), stock cube or vegetable broth (2).
- **Spaghetti aglio, olio e peperoncino** (Naples): grated cheese (3, C), chicken (2), black pepper (2, C).
- **Spaghetti alla puttanesca** (Campania): grated cheese (2, C), canned pre-pitted olives (1).
- **Pasta alla Norma** (Catania): mozzarella (3), fresh ricotta (3), Parmesan (2, C).
- **Pizza Diavola**: "pepperoni" (2, C), bell peppers (1). **Capricciosa / Quattro Stagioni**: würstel (2, C), pineapple (2, C).
- **Neapolitan toppings pool**: pineapple (5, C), ketchup (3), chicken (3), BBQ sauce (2), cheddar (2), banana (2),
  imitation "Parmesan" (1), exotic meats and insects (1), kiwi (1).
- **Tiramisù**: whipped cream instead of mascarpone (2). THIN: one sweep, one source, no checker review.
  Do not ship as a level without more research.

Candidates never merged (unsourced or unreviewed): gummy-sweet and baked-bean pizzas, eggs in ragù,
pre-cooked sugared pizza sauce, onion or canned clams in vongole, dried "Italian seasoning" in pomodoro.

## Editorial calls in the game data

Where the game data goes beyond a one-to-one copy of the research, `src/game/recipes.ts` says so in its
header. The calls are:

- **No sugar enemy in the Pomodoro.** The research supports sugar (4, contested), but no enemy fits it.
- **Alfredo's imitation "Parmesan" and the Marinara's cheddar** are required by the level design, but the
  research has no dish-specific evidence for them. Their texts are adapted from the pizza research
  (Coldiretti on imitation "Parmesan" and "Anglo-Saxon cheddar") and cite that pizza source.
- **One enemy, several crimes.** An enemy stands for whatever its ingredient means *in that dish*:
  `bacon` is smoked bacon in the Carbonara, pancetta-or-bacon in the Amatriciana and smoked pancetta in the
  Ragù; `parmesan` is "Parmesan instead of Pecorino" in the Roman pastas, grated cheese on clams in the
  Vongole, generic cheese in the Pesto and imitation "Parmesan" in the Alfredo; `olio` (the Wrong Oil) is
  olive oil in the Cacio e Pepe but seed oil in the Pesto; `vongola` (the Cheesy Clam) is cheese on clams in
  the Vongole and clams on the Marinara; `pollo` is chicken on pasta or on pizza. The general crime of each
  enemy is in the Crimes tab; the per-dish reason is in the Ricette tab and in the first-sighting toast.
- **The Carbonara's `bacon` is smoked bacon, not pancetta**: pancetta there is a contested fallback, so it is
  not a foe (friend-or-foe toasts call pancetta a foe only in the Amatriciana).
- **Method crimes** (snapping spaghetti, rinsing, cold-water starts, canned and one-pot carbonara…) are not
  ingredients. They join the dishes where they fit as "extras", capped at 20 % of the wave weight.
- **Sweep-only intruders in the game:** the Carbonara's mushrooms and cooked ham, and the Pomodoro's
  chicken. They are kept at the lowest weights and are the first to revisit.

## How this was researched, and its limits

**Process.** Each dish group (Roman pastas, Northern dishes, Southern dishes, pizza) went through three passes:

1. a **researcher** pass (recipe, intruders, sources, quotes);
2. a **sources lens**, which checked URLs, titles, dates and quotes and removed unsupported claims;
3. an **Italian-culinary lens**, which checked the recipe and whether each intruder is really rejected in Italy.

Two sweeps added evidence: **Italian influencer chefs** (8 dishes) and **popular posts** (11 dishes, plus the
top-20 ranking). An editor merged everything: one entry per dish; the culinary lens's recipe minus details
the sources lens showed to be unsupported; intruders kept when the culinary lens kept them; popularity = the
**lower** of the two lens scores; sweep-only intruders added at popularity 1–2 and flagged.

**Verification limits.** Please read these before quoting the research.

- **Only web search results were used.** Page fetching was blocked in the research environment (DNS and
  policy failures on every host tried, including gamberorosso.it, dissapore.com, eur-lex.europa.eu,
  pizzanapoletana.org and accademiaitalianadellacucina.it), and the shared search budget ran out
  mid-research. **No source page was opened by anyone.** All evidence comes from search-result titles, URLs
  and snippets, plus the checkers' desk review.
- **Every URL here appeared in a real search result.** None was invented. Some may have moved or changed
  since the search.
- **Quotes.** ✓ means a checker, or in three cases the editor's own search on 11 November 2026, matched the
  exact wording against a search snippet, **not against the live page**. The editor's own checks confirmed the
  Amatriciana STG sentence, Vincenzo's Plate's "NO CREAM IN CARBONARA!" and The Pasta Queen's "Chicken alfredo
  really rubs me the wrong way" (found on a Nordot syndication; the original interview was not identified).
  Every other quote became a paraphrase, with the reported Italian wording kept for later checking. The
  editor's searches did **not** confirm the Dissapore carbonara garlic and onion line, a Monosilio line on cream
  as a "consuetudine del passato", the wording of Cracco's apology, or the Il Post chicken-pizza line.
  **No pizza quote is verified.**
- **In-game quotes.** `recipes.ts` carries a `quote` only where the wording was verified: Pomodoro
  (Dissapore), Carbonara (Vincenzo's Plate), Alfredo (The Pasta Queen), Amatriciana (the STG), Ragù (the
  Bologna heritage sheet), Pesto (Internazionale) and Vongole (Vincenzo's Plate). Cacio e Pepe, the two
  pizzas and the finale have none.
- **Popularity is an editorial estimate** (1–5, the lower of the two lens scores), not a measured count.
  The only survey numbers are YouGov's 2022 net scores among Italians (ketchup on pasta −82, pineapple on
  pizza −63, cream in carbonara −45, cheese on seafood pasta −39, Bolognese sauce on spaghetti +81), and they
  come from write-ups of the survey.
- **Very recent items could not be re-checked:** Franco Pepe to AGI (5 Nov 2026), the Brisbane chef firing
  (8 Nov 2026), La Voce di New York on "pepperoni" (2 Nov 2026), the 2026 Spanish chef's ragù, the Carbonara
  Day 2026 survey percentages and the 2026 Senate pasta alla Norma.
- **Coverage.** The Margherita and Marinara were not part of the chef or popular-posts sweeps; the Ragù and
  Pesto were not part of the chef sweep. Sweep-only items were never reviewed by a lens.
- **The working files** (the research dataset `recipes_dataset.json` and the full dossier, with every
  evidence entry and the "+N more" sources) were produced during the research and are not in the repository.
  This file is the edited record; `src/game/recipes.ts` holds the in-game subset.

**To finish verification:** allow the source hosts in the network settings (or raise the search budget),
open each cited page, and check every quote against the live page before printing it verbatim in-game or in
marketing. Start with the sweep-only intruders and the 2026 items.

## Rules for editors

When you change `src/game/recipes.ts`:

1. **Facts come from research.** Every `why`, `line`, `note`, `blurb`, `method` and source needs evidence;
   add it here first.
2. **Real people are sources, never characters.** Name them only in `chef` credits and `quote.by`; in-game
   texts use archetypes. Companies are generic ("a major US newspaper", "a British food website").
3. **`quote` only when verified verbatim**, and say against what (a search snippet is not the live page).
4. **Contested means a note.** `contested: true` always comes with a `note` giving the other side, and the
   friend-or-foe toast must not be more absolute than the note (see `foeLines`).
5. **Never mock what Italians accept** ([list above](#accepted-in-italy-never-an-enemy)).
6. **Intruders must be enemies.** `enemy` is an `ENEMIES` id; the waves in `stages.ts` must keep ≥ 80 % of
   each minute's weight on the dish's intruders, follow the intruder order and spawn every intruder.
   `stageRuleProblems()` checks all three, and `scripts/validate.mjs` prints any problem.
