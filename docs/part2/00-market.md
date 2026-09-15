# Part 2 — Market research

Research-only input for the sequel. No game code was changed. Observation date for every
game-analytics.ru figure: **2026-09-15**. Raw sample: [`market-sample.csv`](market-sample.csv).

## TL;DR

1. **There is no successful princess *platformer* on Yandex Games.** The "принцесс" titles are
   2019–2020 dress-ups with Yandex quality scores of 31–47 and ≤7 new votes in 30 days. The only
   princess action title found, *Забег Принцесс* (2024 runner), has 709 votes and quality 46/34. The live
   demand in the girls' category is **new dress-up / "collect all looks" games**: *Блогер: Одевалка*
   got 4,211 votes in under a month at 4.6★. Our sequel can sit in a gap between those two groups.
2. **Classic 2D platformers are weak as a *label* on Yandex, strong as a *mechanic* elsewhere.**
   The best YG title literally called "платформер" has 4,178 votes. Obby/parkur towers built on the
   same jump loop reach 73,188. On Poki, the troll platformer *Level Devil* has 4.08M votes and
   +117,977 in 30 days.
3. **Yandex now rewards retention and IAP, and removes games that fail.** 50M MAU (+10%), IAP
   developer revenue +75%, 29k games removed in 2025, homepage redesigned around events/LiveOps.
4. **Must-haves for Part 2:** first-minute onboarding, a cosmetic wardrobe meta paid in
   Coccoline, opt-in rewarded boosts, optional "trick" moments inside levels 1–6, and a weekly
   time-trial.
   **Skip** meme "+1 speed" clones, 3D/online obby, a UGC editor, and gacha.
5. **The locked canon holds, with one hard gate.** Yandex requirement 3.6 accepts a sequel as a
   separate game "только при полной переработке сеттинга и/или механик", i.e. only if the setting
   and/or mechanics are fully reworked. Part 2's six new worlds, new antagonist, L/V/R~/C mechanics
   and two bosses must be shown to moderation as exactly that. The new page starts with zero votes,
   so cross-promotion from Part 1 through the SDK Games API (8.4.1) is the main discovery lever.
   Both bosses fit a ~60-minute YG session. The magnet/bridge/wardrobe layer is the right,
   non-pay-to-win place for opt-in rewarded boosts. See [§4](#4-locked-canon-evaluation).

## Method and source limits

- **game-analytics.ru (WebGameAnalytics)** needs no login and is server-rendered, so tables were
  read by HTTP fetch and HTML parsing. A real browser wasn't needed, and `claude-in-chrome` wasn't
  available in this session. Pages used: `/yg/filters` (name search `searchByName`, `category`,
  sort by votes / 30-day growth), `/poki/search`, `/crazy-games/search`, and per-game pages for
  categories, player rating and age rating.
- **What the site shows:** for Yandex Games, the platform quality rating (RU and EN, 0–100),
  player rating (x/5), total votes, daily vote increase, 30-day vote increase, publish date and
  categories. For Poki, rating /5; for CrazyGames, rating /10; both with votes and 30-day growth.
  **It shows no player counts, revenue, retention or chart positions.** Votes are the only volume
  proxy, and they are not comparable across portals: Poki counts in millions, YG in thousands.
- Yandex Games has **no "platformer" category**, so the sample was built by title keywords
  (`платформер`, `паркур`, `прыг`, `пиксел`, `принцесс`, `раннер`, `тролль`, `Геометри`) plus the
  top of the «Для девочек» and «Аркады» categories sorted by 30-day growth.
- Poki/CrazyGames ignore `q=` on `/filters` (it returns the global top). Only `/search` works.
- Core loops in the CSV are **inferred from title and category** where marked. Per-game
  monetization is **not observable** from any source used, and the CSV says so rather than guessing.
- **Our own game** ("Принцесса: Путь к короне", developer SamosGames) returned no match in
  game-analytics.ru search on 2026-09-15, so it can't be benchmarked there yet.

## 1. Sample (30 games)

Full table with URLs and notes: `market-sample.csv`. Condensed (YG q = Yandex quality RU/EN):

| # | Game | Portal | Cluster | Rating | YG q RU/EN | Votes | +30 d |
|---|------|--------|---------|--------|-----------|-------|-------|
| 1 | Путь Пикселя | YG | 2D pixel platformer | 4.3/5 | 69/61 | 16,196 | 569 |
| 2 | Геометри Даш Волна: Оригинал | YG | one-button runner | 4.4/5 | 59/63 | 18,863 | 619 |
| 3 | Платформер-Редактор | YG | platformer + editor | 3.7/5 | 65/69 | 4,178 | 77 |
| 4 | Геометрический Платформер: Челлендж | YG | new 2D platformer | — | 45/52 | 24 | 24 |
| 5 | Фнаф 5 ночей с Луной: Платформер 2D | YG | meme 2D platformer | — | 37/25 | 145 | 7 |
| 6 | Обби Паркур: Башня Ада | YG | 3D obby | 4.0/5 | 70/74 | 73,188 | 613 |
| 7 | Паркур Онлайн | YG | online parkour | 4.1/5 | 82/81 | 16,702 | 1,269 |
| 8 | Залазь и Прыгай - Обби Башня | YG | obby tower | 4.2/5 | 72/79 | 14,594 | 662 |
| 9 | Клавишный побег: +1 к скорости | YG | "+1 speed" meme | 4.0/5 | 80/90 | 8,461 | 8,461 |
| 10 | Онлайн Обби: +1 Скорость… | YG | "+1 speed" meme | — | 75/86 | 16,214 | 1,854 |
| 11 | Обби: Тролль Башня Шлепков Онлайн | YG | troll obby | — | 75/71 | 7,893 | 691 |
| 12 | Рыцари и Принцессы | YG | princess economic sim | 4.3/5 | 80/65 | 6,463 | 160 |
| 13 | Красотка или Монстр? Собери Принцессу! | YG | princess dress-up | 4.3/5 | 59/66 | 10,501 | 124 |
| 14 | Волшебная свадьба принцесс | YG | legacy princess dress-up | — | 34/36 | 9,365 | 2 |
| 15 | Fashion Queen: Dress Run | YG | dress-up runner | 4.0/5 | 60/62 | 6,726 | 465 |
| 16 | Выбор нарядов: раннер | YG | dress-up runner | 4.2/5 | 52/59 | 867 | 18 |
| 17 | Блогер: Одевалка | YG | dress-up (new) | 4.6/5 | 74/76 | 4,211 | 4,211 |
| 18 | K-Pop Звезда: Одевалка | YG | dress-up (new) | — | 62/65 | 1,149 | 1,128 |
| 19 | Гача Лайф Мерж: открой все образы! | YG | merge + looks | — | 69/69 | 2,605 | 2,605 |
| 20 | Сквиши Мерж: Дамплинги и Масло | YG | merge (girls #1 growth) | — | 75/83 | 22,105 | 21,995 |
| 21 | Level Devil | Poki | troll 2D platformer | 4.41/5 | — | 4,079,481 | 117,977 |
| 22 | Stickman Hook | Poki | swing platformer | 4.4/5 | — | 7,870,499 | 40,868 |
| 23 | Subway Surfers | Poki | endless runner | 4.4/5 | — | 21,319,499 | 148,312 |
| 24 | Run 3 | Poki | tunnel platformer | 4.51/5 | — | 538,231 | 1,015 |
| 25 | Rainbow Obby | Poki | obby | 4.13/5 | — | 1,533,468 | 46,936 |
| 26 | Princess Lovely Fashion | Poki | princess dress-up | 4.52/5 | — | 209,528 | 1,255 |
| 27 | Vortella's Dress Up | Poki | dress-up | 4.32/5 | — | 1,218,183 | 47,046 |
| 28 | Royal Glow Princess Makeover | CrazyGames | princess makeover | 8.7/10 | — | 15,558 | 2,996 |
| 29 | Vex 8 | CrazyGames | precision platformer | 8.7/10 | — | 8,107 | — |
| 30 | Level EATEN! | CrazyGames | trick platformer | 9.0/10 | — | 6,034 | 223 |

Sources: per-row game-analytics.ru URLs in the CSV. List pages used:
[YG filters](https://game-analytics.ru/yg/filters),
[Poki search](https://game-analytics.ru/poki/search),
[CrazyGames search](https://game-analytics.ru/crazy-games/search).

### What the sample says

- **Name-labelled 2D platformers underperform on YG.** Of the 8 results for `платформер`, only
  one passes 300 votes (#3, 4,178). Rows #4–#5 show the typical outcome: quality 25–52, double-digit
  votes. The pixel-art *Путь Пикселя* (#1, 16,196 votes, quality 69) shows the look itself isn't
  the problem. [source](https://game-analytics.ru/yg/games/put-pikselia-473102)
- **The jump loop sells as "obby/parkour tower"** on YG (#6–#8: 14.6k–73.2k votes, quality 70–82)
  and on Poki (#25, 1.53M votes). The online layer scores highest on quality (#7: 82/81).
- **Meme waves move fast and flood the field.** On 2026-09-15, the top 15 «Аркады» by 30-day growth
  included 6 "+1 …" obbies published June–August 2026. Four are "+1 к скорости / побег из
  клавиатуры" clones (#9, #10); the rest are "+1 лазер" and "+1 кирка". [source](https://game-analytics.ru/yg/filters?category=3&sortField=rating_votes_30days_increase&sortOrder=desc)
- **Princess on YG = old and low quality; girls' growth = new dress-up/merge.** Top `принцесс`
  results are 2019–2020 Gamerina/Dmitriy dress-ups with quality 31–47 (#14). The one princess action
  game, *Забег Принцесс* (2024 runner), stalled at 709 votes with no 30-day growth
  ([source](https://game-analytics.ru/yg/filters?searchByName=%D0%BF%D1%80%D0%B8%D0%BD%D1%86%D0%B5%D1%81%D1%81&sortField=user_rating_count&sortOrder=desc)). The «Для девочек»
  30-day leaders are merge and dress-up titles from June–August 2026 (#17–#20), plus
  dress-up runners (#15, 465 votes/30 d).
  [source](https://game-analytics.ru/yg/filters?category=9&sortField=rating_votes_30days_increase&sortOrder=desc)
- **On Western portals the proven 2D-platformer hook is "the level tricks you".** *Level Devil*
  (#21) gains 117,977 votes/30 d, 2+ years after release. CrazyGames has its own family of it
  (#29 Vex, #30 Level EATEN!). Its virality comes from streamer reactions to traps
  ([MGT, 2025-04-08](https://moviesgamesandtech.com/2025/04/08/level-devil-not-a-troll-game/)).
- **Princess theme is niche on Western portals.** *Princess Lovely Fashion* has 209,528 votes and
  generic *Vortella's Dress Up* has 1.22M (Poki). On CrazyGames, only one princess title passes
  10k votes (#28). The EN audience buys the dress-up mechanic, not the princess label.

## 2. Trends 2025–2026

### Yandex Games (primary platform)

| Fact | Figure | Source |
|------|--------|--------|
| Monthly active players | 50M, +10% vs 2024 | [App2top, 2026-01-27](https://app2top.ru/2025-in-video-games/summarno-opublikovali-24-ty-syach-igr-a-snyali-29-ty-syach-nikita-bokarev-iz-yandeks-igry-ob-itogah-2025-goda-237710.html), [WN Hub](https://wnhub.io/news/other/item-49945) |
| Developer IAP revenue | +75% vs 2024 | same |
| Games published / removed in 2025 | 24,000 / 29,000; ~10,000 removed by new evaluation algorithm; catalogue 19,000 | same |
| Average play time | approaching 60 minutes | [WN Hub](https://wnhub.io/news/other/item-49945) |
| Genre shift | midcore entered top-5 genres; mobile ports (strategy, RPG, sims) | same |
| Product changes | reworked recommendations, AI discovery assistant, homepage redesigned around **events and LiveOps** | same |
| 2026 forecast | hybrid ads + IAP becomes the standard; more genres; WebGPU | same |
| Audience (May 2025) | 45M MAU; **58% women; 80% over 25**; 50% mobile browser, 40% desktop; 40% international; >2,000 games with IAP | [WN Hub, CII Minsk 2025-05-19](https://wnhub.io/news/monetization/item-47819) |
| Ads still dominate | "the primary share of monetization… is advertising"; IAP grows every quarter | same |
| 2025 survival | ~23,000 YG games published, ~7,600 still live at year end; retention decides visibility; early weeks of a trend decide traffic | [WN Hub / WebGameAnalytics, 2025-12-23](https://wnhub.io/news/other/item-49660) |
| Removal threshold | "rating ≤30 for more than three weeks → removed" | Reported in a search-engine summary of the App2top article above. **Not found verbatim on the fetched page — treat as unverified.** |

Platform rules that constrain any ad design
([Yandex requirements](https://yandex.com/dev/games/doc/en/concepts/requirements)):
ads only in logical pauses (4.4); rewarded video must be opt-in, e.g. a button (4.5); sound and
gameplay paused during fullscreen/rewarded (4.7); `LoadingAPI.ready()` when playable (1.19.2);
auto language detection (2.14); IAP progress must be server-saved (1.13.3).

### Web portals generally

- WebGameAnalytics tracked >25,000 games (YG >18,000, CrazyGames >4,500, Poki >2,200). In 2025,
  Poki released ~300 and CrazyGames ~900 games, against ~23,000 on YG. Western portals filter at
  entry; Yandex admits more and purges later. Average rating: CrazyGames 89%, Poki 81%, YG ~80%.
  Cross-platform builds are becoming standard.
  [WN Hub, 2025-12-23](https://wnhub.io/news/other/item-49660)
- Meme games break into the top lists: Merge Rot and Brainrot Craft on Poki; *Steal Brainrot Online*
  on CrazyGames, >900,000 votes. [same](https://wnhub.io/news/other/item-49660)
- Developer revenue share: Poki 50% (100% on direct traffic); CrazyGames 60% ads / 70% purchases
  (2026 jam terms); GameDistribution 33%. A well-performing casual portal game earns roughly
  "$200 to $2,000 a month". Rewarded eCPM: US $15–28, EU $8–15, tier-3 $1–3 (Playgama 2026).
  [Cinevva, updated 2026-09-06](https://app.cinevva.com/guides/web-game-monetization).
  These are secondary aggregations.
- Yandex advises no portal exclusivity: launch everywhere
  ([WN Hub, 2025-05-19](https://wnhub.io/news/monetization/item-47819)).

### Casual / hybrid-casual design patterns

- Industry blogs quote hybrid-casual D7 retention of 15–22% vs 8–12% for hyper-casual, IAP
  revenue +37% in 2026, and an IAP/ads split of 59/41 for lifestyle/puzzle.
  [Playio, 2026-08-21](https://blog.playio.co/hybrid-casual-games-monetization). **The article
  gives no primary source for these numbers.** Use them for direction, not as benchmarks.
- The consistent pattern across those write-ups: casual core loop + meta layer (collection,
  upgrades, season goals) + recurring events. Rewarded ads work best as optional value at natural
  breaks; interstitials go only at breaks.

### Saturated vs underserved (for our niche)

| Saturated on YG | Underserved / open |
|-----------------|--------------------|
| "+1 …" obby memes (6 of top-15 arcade growers, 4 of them speed/keyboard-escape) | **Story-driven 2D princess platformer** — no competitor in sample |
| Brainrot/meme skins, IP-bait names (Geometry Dash, FNAF, Roblox) | Platformer where **outfit progress is visible and collectible** (dress-up demand + action loop; only runner hybrids #15–16 exist) |
| Legacy princess dress-up (dozens, quality 34–47) | Charming, **non-rage trick levels** (Level Devil hook without the rage tone) on YG, where `тролль` titles are 3D obbies |
| Case/skins simulators, merge clones | Speedrun-style short levels with a native leaderboard and weekly reset |

## 3. Conclusions for Part 2

### Fit filter

Our constraints: no-build Kaplay, small team, generated deterministic assets, levels as data
(`src/levels/*`), skins already layered per level (`SKINS` in `src/config.js`), Coccoline
currency, arcade lives, rewarded "continue" on Game Over (`src/ui/gameOver.js`), fullscreen ad
after levels 2/4/6 (`src/scenes/game.js`), native time leaderboard and cloud saves
(`src/platform/yandex.js`), gift-for-Anna tone (feminine Italian, warm, never cruel).

The Yandex audience (58% women, 80% over 25) matches the gift tone, so we don't need to aim at kids.

### Recommendations

Impact: H/M/L on Yandex rating, retention and revenue. Effort: S ≤ 1 week, M ≤ 3 weeks, L > 3 weeks
for our team.

| Priority | Recommendation | Why (evidence) | Impact | Effort |
|----------|---------------|----------------|--------|--------|
| **Must** | **First-minute onboarding and quality guard**: playable in seconds after `ready()`, the first level teaches jump/stomp in under 60 s, no ad before level 2 | YG visibility and removal hinge on quality/retention; ~2/3 of 2025 YG releases didn't survive the year ([WGA](https://wnhub.io/news/other/item-49660), [App2top](https://app2top.ru/2025-in-video-games/summarno-opublikovali-24-ty-syach-igr-a-snyali-29-ty-syach-nikita-bokarev-iz-yandeks-igry-ob-itogah-2025-goda-237710.html)) | H | S |
| **Must** | **Wardrobe meta**: turn the 6 fixed level skins into a collectible wardrobe (several looks per slot, bought with Coccoline or star ratings, freely combined, shown on the level-select and receipt) | «Для девочек» growth is dress-up/"open all looks" (#17–#20); dress-up runners exist (#15); our layered-sprite pipeline already supports it | H | M |
| **Must** | **Opt-in rewarded boosts** at existing breaks: double the level's Coccoline, +1 heart before the boss, try a locked look for one level. Keep Game Over continue. No new interstitials. | Ads remain YG's main revenue; rules 4.4/4.5/4.7 allow exactly this ([req](https://yandex.com/dev/games/doc/en/concepts/requirements)) | M–H | S |
| **Must** | **"Enchanted/trick" moments** inside the canon levels 1–6 (the canon fixes six levels, so no extra world at launch): a floor that turns into flowers, a moving exit, a cheeky fake crown, always on optional routes or telegraphed. A separate trick world is a post-launch update candidate. Data-driven hazards in `build.js`. | *Level Devil* +117,977 votes/30 d on Poki; the same family on CG; the trick hook is visual and streamable ([source](https://game-analytics.ru/poki/games/level-devil)) | H (Western portals), M (YG) | M |
| **Should** | **Weekly time trial**: one existing or new level per week, native leaderboard, reward = an exclusive look | Leaderboard and time submission already exist; YG homepage now features events/LiveOps ([WN Hub](https://wnhub.io/news/other/item-49945)) | M | M |
| **Should** | **Seasonal event pack** (e.g. winter ball): 1 level + 1 look, generated assets, date-gated | Same LiveOps push; cheap with the data-driven levels and gen pipeline | M | M |
| **Should** | **"Beat my time" share link**: the existing share pill carries level + time; the receiver sees the target on the level card | Social challenge on top of existing `shareButton.js`; no backend needed | M | S |
| **Should** | **Small cosmetic IAP** (look bundles, no pay-to-win, no ads removal needed) | YG developer IAP revenue +75% ([App2top](https://app2top.ru/2025-in-video-games/summarno-opublikovali-24-ty-syach-igr-a-snyali-29-ty-syach-nikita-bokarev-iz-yandeks-igry-ob-itogah-2025-goda-237710.html)); cloud saves satisfy 1.13.3 | M | M |
| **Should** | **Second portal (CrazyGames, then Poki)** via another adapter beside `src/platform/yandex.js`, EN-first store text built around the trick/wardrobe hooks | Yandex itself advises no exclusivity; CG 60/70% share ([Cinevva](https://app.cinevva.com/guides/web-game-monetization)) | M | M |
| **Skip** | "+1 speed", brainrot, IP-bait naming | Saturated (6 of top-15 arcade growers), short-lived, off-tone, trademark risk | — | — |
| **Skip** | 3D/online obby, multiplayer, midcore depth | Engine/team mismatch; midcore growth comes from mobile-port studios | — | — |
| **Skip (for now)** | UGC level editor | Best YG example 4,178 votes, 77 in 30 d (#3); moderation cost; revisit as share codes later | L | L |
| **Skip** | Roguelite/procedural runs | Breaks hand-authored critical-path rules (gaps ≤2 cells, spring landings) | L | L |
| **Skip** | Gacha/loot boxes | Tone and age rating; transparent prices are required anyway (1.13.4) | — | — |

### Risks

- **Sequel rejected as a duplicate (req. 3.6).** If moderation reads Part 2 as "Part 1 with new
  levels", it can require updating Part 1 instead of publishing a separate game. That would break
  canon #1. Mitigations are in §4.1.
- **Rating-driven delisting.** A dip in Yandex quality score after launch (ad complaints, hard trick
  levels) directly reduces traffic, and removal is possible. Keep trick levels optional and ads opt-in.
- **Tone drift.** Monetization and troll mechanics can hurt the gift identity. Trick levels must
  stay playful (no cheap deaths on the critical path); IAP stays cosmetic.
- **Weak evidence base.** Votes aren't players or revenue; hybrid-casual retention figures are
  unsourced blog aggregations; the removal threshold is unverified. Validate with our own
  `trackEvent` funnel (ad_requested / ad_rewarded already exist) before scaling any bet.
- **Our game is invisible in WGA today.** No baseline exists for Part 1. Record Part 1 votes and
  quality score as soon as the listing appears, so Part 2 has a comparison.
- **Trend timing.** WGA notes traffic goes to early adopters of a trend. Meme waves are over before
  a small team can ship, so they're another reason to skip trend-chasing and build evergreen hooks.

## 4. Locked canon evaluation

The orchestrator locked the Part 2 canon: a separate Yandex game with a fresh save and its own
leaderboard; levels 1–6 plus a finale (`MAX_LEVEL = 7`); a mid-boss (2 HP) at the end of level 3
and La Dama dell'Eco (4 HP) at level 6; worlds from `01-story.md`; new mechanics L/V (level 1),
R/~ (level 2) and C (level 3) from `03-mechanics.md`. This section checks that canon against the
market evidence and the platform rules.

### 4.1 Separate sequel page

**Moderation gate — verified verbatim** in the
[Yandex requirements](https://yandex.ru/dev/games/doc/ru/concepts/requirements), fetched 2026-09-15:

> Пункт 3.6. Игра не является полной или частичной копией другой игры из каталога, а также не
> дублирует другую игру данного разработчика. Если публикуемая игра является продолжением или
> другой частью одной из игр, то она принимается как отдельная только при полной переработке
> сеттинга и/или механик игры. В других случаях необходимо обновлять предыдущую игру с
> добавлением нового контента.

In short: a sequel is accepted as a separate game only if its setting and/or mechanics are fully
reworked; otherwise the developer must update the original game.

Assessment: the canon gives moderation both arguments. The **setting** is new: six echo worlds, a
new antagonist, a new story arc. The **mechanics** are new too: magnet, steam vent, phase bridge,
charger, and two bosses with a new attack order. The shared engine, controls and heroine are the
risky part. Mitigations, cheapest first:

1. Put the rework in the draft description and in the moderation comment: list new worlds,
   mechanics and bosses explicitly.
2. Make the store assets unmistakably different: new cover, icon and screenshots from Part 2
   worlds only, no Part 1 art.
3. Give it a unique title in all draft languages (req. 5.12, "Название игры уникально в рамках
   каталога").
4. Show a new mechanic in the first 60 seconds (L and V in level 1 already do this). A moderator
   playing briefly then sees "new game", not "new levels".
5. Ask Yandex developer support before production whether this scope qualifies. That costs one
   message and avoids a rejected build.

**Discovery.** A new page starts from zero votes and an unproven quality score. A new 2D challenge
platformer in the sample had 24 votes about three weeks after release (#4). The 2025 purge shows
what happens to titles that don't retain ([§2](#yandex-games-primary-platform)). The upside:
Part 1's page and rating aren't put at risk, and the developer gets a second catalogue entry.

**Cross-promotion is allowed only through the SDK** (req. 8.4.1: "Встроены через SDK и ведут на ваши
игры в каталоге Яндекс Игр. Переход на другие игры не прерывает игровой процесс"). External
links are banned (8.4.2). The mechanism is `ysdk.features.GamesAPI.getGameByID(appID)`, which
returns `isAvailable` plus the game's `url`, `coverURL` and `iconURL`; `getAllGames()` also
returns `developerURL` ([SDK docs](https://yandex.com/dev/games/doc/en/sdk/sdk-other-games)).
Recommended placement:

| Where | What | Rule check |
|-------|------|------------|
| Part 1 menu | "Part 2 — new story" card, shown only when `isAvailable` | menu = not gameplay (8.4.1) |
| Part 1 finale, after the receipt | "Continue the story" card | after the `CLASSIFICA → SCONTRINO` gate, so the leaderboard order stays intact |
| Part 2 menu | "Play Part 1" card for new players | same |

Order: publish Part 2 first, then ship a small Part 1 update that adds the card (hidden when the
API or the game isn't available, so the no-SDK fallback still works). Since most Part 2 players will
never have played Part 1, the opening cutscene should give a short recap. **No save migration**
means no veteran reward can be detected across the two apps; the canon forbids it anyway, and
nothing in the market data calls for it.

**How the catalogue treats sequels:** see [§4.4](#44-sequel-evidence-from-the-catalogue).

### 4.2 Two-boss pacing

- **Session fit.** Yandex reports average play time approaching 60 minutes
  ([WN Hub](https://wnhub.io/news/other/item-49945)). Six short levels plus two short fights fit one
  sitting, and the mid-boss at level 3 lands a payoff in the middle of it instead of only at the end.
- **Fight length (derived, not measured).** One boss cycle with the baseline timings from
  `04-boss.md` is hover 1.7 + telegraph 0.55 + recover 0.7 + descend 0.42 + window 2.6 + ascend
  0.42 ≈ **6.4 s**. A flawless fight therefore takes about 13 s for the 2-HP mid-boss and about 26 s
  for the 4-HP Dama, longer with misses, and slightly shorter once the finale's enrage trims
  hover/recover. Both are short retries. That's good for quality score, which punishes early
  abandonment.
- **Risk.** Level 3 is within the first session's early minutes, so a mid-boss wall there would
  be the most expensive place to lose players. The canon's safeguards are the right ones: a
  checkpoint before the arena, a fixed window, and 2 HP. Keep them.
- **Ads.** Place fullscreen ads only after the boss levels are completed (levels 3 and 6 are
  logical pauses, req. 4.4), never inside the arena. An opt-in "+1 heart before the fight" rewarded
  offer can go at the pre-arena checkpoint (req. 4.5) without touching the boss state machine.
- **Measure:** use the existing `trackEvent` funnel, deaths per boss and quits after a boss death,
  before tuning HP. Following `04-boss.md`, reduce HP before shrinking the window.

**Verdict: keep both bosses.** No portal data argues against a mid-boss, and the short 2-HP fight is
a cheap retention beat.

### 4.3 Optional power-up and meta layer

| Element (source doc) | Market fit | Recommendation |
|----------------------|-----------|----------------|
| L Coccoline magnet (`03-mechanics.md`) | Collection aid, not pay-to-win. The native leaderboard ranks **time**, and the magnet doesn't change movement, so the ranking stays fair. | Best candidate for an **opt-in rewarded start boost** ("start level with magnet"). Keep free pickups in levels too. |
| R/~ phase bridge | Optional mastery route; route choice gives speedrunners a reason to replay for time | Keep optional. Check that no bridge route becomes the only competitive time line that a casual player can't learn. |
| C charger, V steam vent | Telegraphed, deterministic, low frustration | Matches the quality-score risk; no change. |
| Wardrobe / accessory unlocks (`02-levels.md` proposed six fixed skins) | The girls' category grows on "collect all looks" (#17–#20); a linear six-unlock is the weakest version | Make the six Part 2 unlocks the **seed of a wardrobe**: several looks per slot, bought with Coccoline or earned by stars, freely combined (Must in §3). |
| Hearts: three fixed `H` | Scarcity supports an opt-in rewarded continue that already exists (Game Over) | Keep the scarcity; don't add hearts on the critical path for ads. |

Guardrails: no power-up is ever required on the critical path; nothing sold or rewarded changes jump
physics or the recorded time; no IAP for power-ups (cosmetic IAP only, §3).

### 4.4 Sequel evidence from the catalogue

game-analytics.ru started returning HTTP 429 (rate limit) during this follow-up, so the evidence is
limited to two same-developer franchise pairs scraped earlier on 2026-09-15. That is too small a
sample to generalise from; read it as an illustration, not a benchmark. The pairing is inferred
from the shared developer and title stem.

| Developer | Earlier title | Later title | Result |
|-----------|--------------|-------------|--------|
| NKLP studio | [Геометрия Куб: Бой с Мемами!](https://game-analytics.ru/yg/games/geometriia-kub-boi-s-memami-313801) — pub. 2024-04-15, quality 51/58, 9,164 votes, +59/30 d | [Геометрия Волна: Бой с Мемами 2!](https://game-analytics.ru/yg/games/geometriia-volna-boi-s-memami-2-359504) — pub. 2024-08-13, quality 64/65, 38,543 votes, +496/30 d | The numbered sequel overtook the original (4.2× votes) with higher quality scores |
| M8X Studio | [Обби: Тролль Башня Шлепков Онлайн](https://game-analytics.ru/yg/games/obbi-troll-basnia-slepkov-onlain-448845) — pub. 2025-09-10, quality 75/71, 7,893 votes | [Обби: Тролль Лава Онлайн](https://game-analytics.ru/yg/games/obbi-troll-lava-onlain-515355) — pub. 2026-05-01, quality 65/62, 1,521 votes | The follow-up is younger (4.5 vs 12 months) and scores lower on quality; no inherited traction visible |

What this suggests, with the sample-size caveat:

- **The catalogue gives a sequel no automatic lift.** Each page is ranked on its own quality
  score. The sequel that won (NKLP) also raised the quality score; the one that lagged (M8X) had a
  lower one.
- For us, that means the Part 2 page lives or dies on first-session retention (§3 Must rows) plus
  the SDK cross-link from Part 1 (§4.1), not on the "2" in the title.
- **Follow-up measurement:** once the rate limit clears, re-check the developer pages of these
  studios and record Part 1's own votes and quality on its listing. Then compare Part 2's first
  30 days against it.
