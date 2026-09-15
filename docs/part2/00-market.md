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
   Coccoline, opt-in rewarded boosts, an optional "trick levels" world, and a weekly time-trial.
   **Skip** meme "+1 speed" clones, 3D/online obby, a UGC editor, and gacha.

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
| **Must** | **"Enchanted/trick" optional world**: 4–6 short levels where the level surprises you (a floor that turns into flowers, a moving exit, a cheeky fake crown). It's data-driven hazards in `build.js`, off the critical path. | *Level Devil* +117,977 votes/30 d on Poki; the same family on CG; the trick hook is visual and streamable ([source](https://game-analytics.ru/poki/games/level-devil)) | H (Western portals), M (YG) | M |
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
