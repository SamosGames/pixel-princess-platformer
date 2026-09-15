# Part 2 technical plan

This is an implementation plan for Part 2, **The Unfinished Waltz**. It is a
design document only: this section does not change game code, generated
assets, or tests.

## Locked release boundary

Part 2 is a separate Yandex Games title with its own page, not an extension of
the Part 1 release. It has:

- a new Yandex app ID and its own game page;
- its own static archive produced through `package:yandex`;
- a fresh local/cloud save namespace, with no Part 1 save migration or
  carry-over;
- its own native Yandex leaderboard; and
- a separate Part 2 entry point and release configuration.

The implementation lives in the private `SamosGames/pixel-princess-2`
repository, copied from this repository's `main` with full history and
registered as a separate AO project. The repository boundary is part of the
release contract, not merely a packaging convention.

The engine may be reused, but Part 2 must not import Part 1 level data, save
keys, leaderboard IDs, or progression state. Part 1 remains canon backstory
only.

`MAX_LEVEL=7` has one precise meaning in the Part 2 app: levels 1–6 are
playable and level 7 is the non-playable finale scene/sentinel. The runtime
must never try to build a map for level 7. No implementation or test may
extend the playable range beyond level 6 or renumber the finale sentinel.

The registered world order and user-facing names are:

| Number | World | Runtime role |
| ---: | --- | --- |
| 1 | Soglia degli Echi | Playable level |
| 2 | Chiome delle Campanelle | Playable level |
| 3 | Archivio Sospeso | Playable level; mid-boss at the end |
| 4 | Fucina dell'Alba | Playable level |
| 5 | Mare delle Stelle | Playable level |
| 6 | Tetto del Primo Ballo | Playable level; final boss |
| 7 | Finale | Non-playable scene only |

The two encounters are distinct instances of the existing `G` / `makeBoss`
contract:

| Boss ID | Location | HP | Required result |
| --- | --- | ---: | --- |
| `p2.mid` | End of level 3 | 2 | Defeat opens the level goal/key route |
| `p2.final` | Level 6 | 4 | Defeat completes the playable campaign and enters level 7 |

Both boss bodies remain tagged `boss`, not `enemy`; only deterministic,
telegraphed attack objects are hazards. The arena, stomp window, bounce,
reachable key, and logical goal must preserve the softlock-proof rules in
`docs/part2/04-boss.md`.

> **Market check:** A separate title and fresh start make the sequel easier to
> understand for a new Yandex player, but remove Part 1 carry-over as a
> retention hook. Compare this clean onboarding against the research before
> adding any cross-title promotion or unlock promise; cross-title progression
> is not a technical requirement and is forbidden by this release boundary.

## Repository strategy and engine synchronization

### Decision: separate private repository, copied with full history

The sequel lives in the new private repository
`SamosGames/pixel-princess-2`, created as a copy of this repository's `main`
with full Git history. It is registered as a separate AO project. The copy is
the Part 2 release boundary: it has one Part 2 entry, one `package:yandex`
target, one app ID, one save namespace, and one native leaderboard. It is not
a second entry hidden inside the Part 1 repository.

The copy should converge on a simple Part 2-only working tree:

```text
src/
  engine/                 # reusable Kaplay/player/platform primitives
  levels/                 # Part 2 level1.js ... level6.js, build.js, mapkit.js
  scenes/                 # Part 2 menu, game, and level-7 finale
  i18n/                   # Part 2 IT/EN/RU dictionaries
  config.js               # Part 2 source of truth; MAX_LEVEL=7
tools/gen/               # shared generator code plus Part 2 inputs
assets/                  # Part 2 generated output only
```

Keep the full history; do not rewrite it to erase Part 1 commits. The
following Part 1 material is stripped from the **new repository's working
tree** after the copy:

- Part 1 level maps, world names, level-specific map fixtures, and Part 1-only
  scene copy. Keep generic `build.js`/`mapkit.js` logic only where it is still
  used by Part 2.
- Part 1 generated backgrounds, sprites, audio, manifests, and asset references.
  Preserve generator primitives and replace their inputs with the six Part 2
  worlds, mechanics, and two bosses.
- Part 1 i18n content and keys. Keep a shared key/formatting utility only if
  useful, then replace the dictionaries with the Part 2 IT/EN/RU set.
- The legacy `api/leaderboard.js` Vercel serverless leaderboard, which is not
  part of the native Yandex-board architecture.
- Vercel deployment material: `.vercel/`, Vercel project/config files, and
  `tools/deploy.mjs` or package scripts that publish the old endpoint. The
  Part 2 release is a static Yandex archive and has no server deploy.

Deletion from the new working tree does not delete those files from its full
Git history. Do not copy old Part 1 save prefixes, global leaderboard IDs, or
Part 1-only tests back into the Part 2 runtime while doing this cleanup.

### Recommended sync policy: upstream remote plus selective cherry-picks

Use the remotes below in the Part 2 AO project:

```text
origin   -> git@github.com:SamosGames/pixel-princess-2.git
upstream -> git@github.com:SamosGames/pixel-princess-platformer.git
```

Keep `upstream/main` as the Part 1 engine reference and keep the sequel's
`origin/main` as the Part 2 release branch. Do not merge all of upstream: that
would reintroduce Part 1 levels, assets, dictionaries, Vercel files, and the
legacy API. Instead:

1. Land an engine/platform fix in the Part 1 repository as a small, focused
   commit with an `engine:`, `platform:`, `mobile:`, or `build:` prefix. Keep
   content and title-specific changes in separate commits.
2. From the sequel repo, run `git fetch upstream`, inspect the diff, and
   cherry-pick only the approved engine commit(s) onto a short-lived
   `engine-sync/<date>` branch. Resolve path conflicts against Part 2 config
   and content, then run the Part 2 suite and package check.
3. Merge the sync branch into the sequel's main/release branch through the
   separate AO workflow. Record the upstream SHA in the sync commit message
   and changelog so the two repos can be audited.
4. If a fix originates in Part 2 but is useful to Part 1, first extract it to
   a content-free commit and apply it upstream; do not make the Part 1 repo
   depend on the sequel repo.

Use this selective cherry-pick policy rather than a shared package or
automatic subtree merge: the engine is small, the titles need independent
release control, and explicit review prevents content leakage. Sync before a
Part 2 release and on a regular review cadence; never force-push either
repository's shared branch.

> **Market check:** Independent release ownership protects the sequel's
> onboarding and page experiments from Part 1 release timing. Keep engine
> fixes synchronized for quality, but do not couple the titles' content or
> live-ops cadence while the market results are still being measured.

## Part 2 runtime and level registration

The Part 2 entry should register exactly six map builders and one finale
scene:

```text
level 1 -> Soglia degli Echi       -> buildLevel1()
level 2 -> Chiome delle Campanelle -> buildLevel2()
level 3 -> Archivio Sospeso        -> buildLevel3() + p2.mid
level 4 -> Fucina dell'Alba        -> buildLevel4()
level 5 -> Mare delle Stelle       -> buildLevel5()
level 6 -> Tetto del Primo Ballo   -> buildLevel6() + p2.final
level 7 -> finale scene            -> no map builder
```

`src/part2/config.js` is the single source of truth for `MAX_LEVEL`, tile and
viewport values, player physics, boss timing, mechanic tuning, and release
feature flags. `build.js` and `mapkit.js` remain data-driven: map characters
dispatch to builders and level files describe placement. Avoid scene-specific
magic numbers and avoid a second copy of a tuning constant in a level file.

Part 2 preserves the existing geometry invariants:

- every direct critical-path gap is at most two cells;
- there is no double jump or hidden second air impulse;
- a spring's landing target is a `#` semisolid, never a `=` visual-only
  surface;
- `=` remains a visual/greedy-mesh concern, not one physics body per cell;
- culling may hide drawing but must not remove a gameplay body, goal, key, or
  boss dependency; and
- both boss goals remain reachable after every defeat/retry path.

### New map tokens

The builder legend is case-sensitive. The following uppercase/new symbols are
reserved for Part 2 and do not collide with the existing legend
`= # M ! F g S G r w B P ^ o * + H c f h s @ >`:

| Token | Meaning | First required use | Builder contract |
| --- | --- | ---: | --- |
| `L` | Coccoline magnet pickup | Level 1 | Optional pickup; attracts ordinary collectibles only |
| `V` | Steam vent hazard | Level 1 | Deterministic dormant/warning/active cycle |
| `R` | Resonance rune trigger | Level 2 | Activates the level's bounded `~` bridge set |
| `~` | Phase bridge segment | Level 2 | One-way semisolid while its rune is active |
| `C` | Charger enemy | Level 3 | Reuses the generic enemy update/telegraph path |
| `T` | Optional trick-moment trigger | Levels 1–6 | Data-driven, telegraphed, and never a critical-path cheap death |

The dispatcher must reject unknown map characters in development/test builds.
It must not silently reinterpret a new uppercase token as a Part 1 token.

Required introduction order and baseline tuning from the mechanics section:

- **Level 1 — `L` and `V`:** Place `L` after a low row of three ordinary
  collectibles, off the critical route. Place the first `V` after the first
  thorn with room to read its warning. The magnet uses radius 192, duration 8
  seconds, pull speed 480, and at most four targets; it never attracts `H`,
  `*`, `+`, keys, or bosses and does not change the player's velocity. A vent
  uses a 3.2-second period, 0.7-second warning, 0.9-second active window,
  112-pixel height, and 48-pixel width. It has no per-frame particle system
  or always-on body; only the active phase collides.
- **Level 2 — `R` and `~`:** Use one rune and one bridge set on an optional
  upper route. A set contains at most eight segments, is active for five
  seconds, and is a one-way semisolid. Its timer pauses while Anna stands on
  the bridge. Do not add a general scripting system for this interaction.
- **Level 3 — `C`:** Introduce the charger on a clear flat strip before using
  it beside the mid-boss approach. Baseline values are notice distance 320,
  telegraph 0.55 seconds, speed 430, travel 256, recovery 0.8 seconds, and
  at most three chargers in a level.
- **Levels 1–6 — `T`:** Use `T` for an optional trick trigger whose data
  carries a stable `trickId`, presentation, telegraph, and route. Examples
  are a floor blooming into flowers, a cheeky fake crown, or a moving exit.
  Every trigger is on an optional route or clearly telegraphed, uses a warm
  non-rage consequence, and is deterministic. It must not remove a life or
  block the direct goal without a readable escape. `T` is a new token and is
  intentionally outside the existing legend as well as the required L/V/R/~/C
  mechanics.

New token art and behavior must be generated/registered together. A map test
must prove the tokens appear in their required levels and that `~` is not
treated as a permanent solid.

> **Market check:** The trick hook is valuable only when it creates surprise
> and a shareable reaction without making Anna feel punished. A/B the
> presentation and warmth of `T` moments, not whether the critical path is
> allowed to kill the player cheaply; that invariant is closed.

> **Market check:** The magnet, optional phase route, and charger create
> collection and mastery hooks without adding a meta-progression layer. Keep
> them optional or readable at introduction; validate any later decision to
> make collection mandatory against retention and difficulty findings.

## Save data and Yandex cloud-save merge

### Fresh identity, no migration

Part 2 starts at level 1 for every new Part 2 player. Use a distinct local key,
for example `pixel-princess-part2.save.v1`, and a distinct Yandex app/cloud
identity configured for the new app ID. The Part 2 adapter must not read the
Part 1 local prefix, probe Part 1 keys “just in case,” or request/transform a
Part 1 cloud document. There is no Part 1 → Part 2 migration.

The payload can use a small, versioned Part 2 shape:

```js
{
  app: "pixel-princess-part2",
  schemaVersion: 1,
  revision: 0,
  updatedAt: 0,
  progress: {
    highestUnlockedLevel: 1,
    completedLevels: [],
    bestTimeMs: {}
  },
  settings: {
    language: "it",
    sound: true,
    music: true
  }
}
```

The exact field set may follow the existing state shape, but volatile run data
(current position, active boss phase, temporary magnet timer, and live HP)
must not be treated as durable progress. A malformed or wrong-app payload is
discarded as a new Part 2 save, with no attempt to salvage fields from it.

### Merge within Part 2 only

“Cloud-save merge” means resolving a Part 2 local save and a Part 2 cloud save
after Yandex login; it does not mean migrating Part 1. The deterministic
policy is:

1. No cloud document: validate and upload the local Part 2 save.
2. No local save: validate and adopt the Part 2 cloud save.
3. Both present: union `completedLevels`, take the greatest valid
   `highestUnlockedLevel`, and take the fastest positive `bestTimeMs` per
   level. Settings use the most recently written valid record. Clamp all
   levels to 1–6 and reject a claimed level 7 completion unless the finale
   receipt flag is present.
4. Write the merged record with an incremented Part 2 revision after the
   player reaches a safe checkpoint or completes a level. A cloud failure
   must not block offline play; retry with bounded backoff.

The merge must be idempotent and must never lower local progress because a
stale cloud response arrived later. A future Part 2 schema change may add an
explicit decoder for `schemaVersion: 1`; it must remain inside the Part 2
namespace and must not become a general Part 1 compatibility path.

> **Market check:** Cross-device continuity is useful, but a fresh sequel save
> means the first-session activation path must be short and reliable. Measure
> login/cloud failure behavior before adding prompts that delay the first
> playable level.

## Wardrobe meta and cosmetic data

Replace the six fixed after-level skins with a collectible wardrobe. Keep the
existing layered-sprite contract, but make each layer a slot with several
items. The launch data should have at least a default item plus two alternate
looks in each slot; exact art count remains data-driven.

The initial slot IDs preserve the current layer order and avoid a renderer
rewrite:

```js
wardrobe.slots = ["skirt", "bodice", "necklace", "crown", "gloves", "cape"];
wardrobe.items = {
  "skirt.default":   { slot: "skirt",   unlock: "default" },
  "skirt.echo":      { slot: "skirt",   unlock: { afterLevel: 1 } },
  "skirt.starlit":   { slot: "skirt",   unlock: { stars: 5 } },
  "bodice.default":  { slot: "bodice",  unlock: "default" },
  // ...more data rows, including Coccoline, weekly, and IAP looks
};
wardrobe.equipped = {
  skirt: "skirt.default",
  bodice: "bodice.default",
  necklace: "necklace.default",
  crown: "crown.default",
  gloves: "gloves.default",
  cape: "cape.default"
};
```

Each item has a stable ID, slot, asset key, i18n name key, and exactly one
source of ownership: default, level completion, stars, Coccoline purchase,
weekly-trial reward, or Yandex product entitlement. Prices are data, not
scene literals. A look bundle may contain several item IDs, but it never
contains hearts, time advantages, jump tuning, or Coccoline.

Level completion still grants one free look per level. The six completion
rewards should fill six different slots in the first campaign, and the reward
card must name and preview the newly owned item. Star thresholds and Coccoline
items provide alternate routes to complete a slot. Anna can freely equip any
owned item in every slot; the level-select preview and the level-7 receipt
render the complete selected combination, not a hard-coded progression set.

The durable Part 2 save adds:

```js
{
  wardrobe: {
    owned: ["skirt.default", "skirt.echo"],
    equipped: { skirt: "skirt.echo", bodice: "bodice.default" },
    trial: null
  },
  wallet: {
    coccolineEarned: {},
    coccolineSpent: {}
  },
  iap: {
    entitlements: {}
  }
}
```

The real payload may compact `equipped` by filling missing slots with
defaults. Validate that every owned/equipped item exists in the Part 2 item
catalog and that its slot matches. A rewarded locked-look preview is a
temporary `{ itemId, level, runId }` lease: it may be used for that level only,
never enters `owned`, and expires on completion, retry reset, or run reset.

### Wardrobe/cloud merge rules

Merge wardrobe data inside the Part 2 namespace only:

1. Union validated `owned` item IDs and entitlement IDs; never union unknown
   IDs or trust a local-only IAP claim.
2. Take the maximum valid stars per level and union completed levels. Keep an
   equipped item only if it is owned after the union; otherwise use that slot's
   default.
3. Merge Coccoline through idempotent earn/spend event IDs, not by adding two
   balances. A level reward, x2 reward, purchase, and refund/reversal each has
   a stable event ID. Union unseen events, compute the balance once, and
   compact only after the merged record is cloud-saved. This prevents a stale
   device from duplicating currency or undoing a purchase.
4. Merge an active trial lease only when `runId` and level match; otherwise
   discard it. A trial lease can never be promoted to permanent ownership by
   merge.
5. Preserve the existing monotonic merge behavior for best times and
   progression. Settings remain last-valid-write-wins; wardrobe ownership and
   paid entitlements are union-only.

No wardrobe look, star, Coccoline balance, or entitlement may alter jump
physics, level geometry, boss HP, or the recorded completion time.

> **Market check:** Wardrobe collection connects the action loop to the strong
> dress-up demand observed in the research. Keep the free level reward visible
> and the Coccoline/IAP offers understandable; the player should always be
> able to enjoy a complete look without paying.

## Leaderboards and finale handoff

Part 2 gets a separate native Yandex leaderboard. Use a stable code constant
such as `pixel_princess_part2_time`, with the final console board ID confirmed
before release. Do not post Part 2 results to `pixel_princess_time`, and do
not create a combined Part 1/Part 2 board.

The result adapter should preserve the existing semantics: submit a validated
final completion time (and any small display-safe `extraData` such as the
Part 2 journey score) only after the final boss is defeated and level 7 is
entered. Offline/local fallback may show a local result, but it is not a
second server leaderboard. Auth or submission failure must still allow the
receipt to render.

The Part 2 finale order is fixed:

```text
final boss defeated -> enter non-playable level 7 -> open Part 2 native board
                     -> render receipt/share actions
```

The UI must label the board and receipt as Part 2 where a player could confuse
them with the first game. Part 1's board and finale behavior remain outside
this app bundle.

> **Market check:** A new board gives sequel players a fair competitive reset,
> while a shared board could make returning Part 1 players feel recognized.
> Keep the native boards separate per canon and use research to decide only
> the presentation, cadence, and optional share prompt.

Do not add a server leaderboard or a new backend for this plan. Reuse the
existing Yandex adapter boundary and native API path.

## Rewarded boosts and fullscreen placement

Keep the current Game Over rewarded continue and add only opt-in buttons at
logical breaks. The adapter already has a single timeout-safe ad boundary;
extend that boundary rather than calling the Yandex SDK from level builders.
Every ad request must pause gameplay/audio, stop the gameplay timer, and
resume only after `onClose`/`onError`. A reward is granted once, only from
`onRewarded`, and never on an SDK error or a dismissed video.

| Offer | Button location and timing | Grant and limits |
| --- | --- | --- |
| x2 level Coccoline | Level-complete reward card after levels 2–6 | Doubles that level's settled Coccoline payout; one claim per completion; it does not change time or physics |
| +1 heart | The pre-boss checkpoint in levels 3 and 6, before entering the arena | Adds one capped heart once at that checkpoint; the offer is outside the boss state machine and never appears in the arena |
| Start with magnet | Level-select/start panel for levels 2–6, before the level clock starts | Grants one level-scoped magnet start; it does not alter movement or jump values |
| Try a locked look | Level-select/start panel for levels 2–6, before the level clock starts | Creates the temporary wardrobe trial lease described above; it never grants permanent ownership |
| Game Over continue | Existing Game Over overlay after the last heart | Preserves the current checkpoint continuation; do not remove or replace it with a shop |

No ad is requested before Level 2: no menu ad, level-1 ad, level-1 completion
ad, or automatic first-session prompt. All rewarded offers require a visible
button and a deliberate click/tap. Declining or failing an offer leaves the
game playable and does not re-open the same offer in a loop.

Fullscreen ads are allowed only after a completed level and only at the
post-reward transition. The launch schedule is after levels 3 and 6, with at
most one attempt per completion and no ad in either boss arena, during a
checkpoint, after Game Over, on level start, or inside any `T` trick moment.
Level 6's fullscreen opportunity is after La Dama dell'Eco is defeated and
the reward card is complete; the level-7 finale/leaderboard order remains
leaderboard first, receipt second. If the SDK or ad method is unavailable,
skip silently.

For fairness, weekly trial runs do not show the four optional boost offers or
fullscreen prompts; the normal Game Over continue remains a separate product
decision and must not change the submitted trial time. No reward may change
jump physics or the recorded time in any mode.

Track requests, successful rewards, dismissals, errors, and placement IDs via
the existing optional analytics hook, without making analytics a gameplay
dependency. Use Yandex requirements 4.4, 4.5, and 4.7 as the release test
oracle: logical pause, opt-in button, and paused sound/gameplay.

> **Market check:** Rewarded value is a retention/monetization experiment, not
> a difficulty tax. Keep the first minute ad-free, make every offer optional,
> and use the funnel to compare offer acceptance without adding rage or
> interrupting the new mechanic introductions.

## Weekly time trial and challenge sharing

The weekly trial uses one of the six existing levels and has a separate native
Yandex leaderboard. No runtime backend creates boards or stores challenge
links. Provision the fixed board names in the Yandex console ahead of time,
for example:

```text
pixel_princess_part2_trial_2026_W38
pixel_princess_part2_trial_2026_W39
...
pixel_princess_part2_trial_2026_W53
```

At the beginning of each ISO week in UTC, compute `weekKey = YYYY-Www` and
select `pixel_princess_part2_trial_${weekKey}`. The trial level is deterministic
and rotates across the six campaign levels:

```text
weekIndex = floor((utcMonday(weekKey) - TRIAL_EPOCH_UTC) / 604800000)
trialLevel = 1 + ((weekIndex % 6) + 6) % 6
```

`TRIAL_EPOCH_UTC` is a checked-in Part 2 config constant set at launch. The
client's UTC clock is the no-backend schedule source; show the week key and
level on the card so a clock mismatch is visible. Pre-provision the 53 ISO
week boards for every calendar year before rotation into that year. If the
selected board is not available, show the local trial result and do not submit
to another board or the campaign board.

Submit `timeMs` as the native score and include a small audit-safe extra-data
value such as `trial=2026-W38;level=3`. The trial completion grants one
exclusive wardrobe item, saved as a normal earned entitlement in the Part 2
cloud save. It is not an IAP item and never grants a gameplay advantage.

The existing share pill gains a trial context. It creates a self-contained
Yandex page URL with no backend lookup:

```text
https://<part-2-game-page>/?challenge=trial&week=2026-W38&level=3&timeMs=42123
```

Build it with `URLSearchParams`, clamp `level` to 1–6, require an ISO week
shape, and require a positive bounded `timeMs`. The receiving level-select
card shows “beat my time” with the target level/time; it does not auto-start,
grant the sender's reward, or trust query data as a leaderboard score. Use the
existing `navigator.share`/clipboard fallback and translate the share text in
IT/EN/RU.

> **Market check:** A weekly reset supplies a light LiveOps reason to return
> without a server or a permanent meta treadmill. Measure participation and
> completion before increasing the rotation frequency or adding more boards.

## Cosmetic IAP and Yandex payment boundary

Sell only transparent look bundles. Product IDs are stable Part 2 IDs such as
`p2_look_bundle_echoes` and `p2_look_bundle_starlight`; each product maps to a
fixed list of wardrobe item IDs in the catalog. It cannot contain Coccoline,
hearts, magnet duration, jump tuning, a time multiplier, ad removal, or any
other pay-to-win effect. Do not use gacha or random bundles.

The Part 2 platform adapter owns the payment flow:

1. On Yandex boot, check whether the payments feature is available and fetch
   the catalog. Display the price returned by Yandex, currency and included
   looks before the purchase button; never invent a local price.
2. From the wardrobe/menu button only, call the Yandex purchase method for a
   selected product. The payment UI is a logical pause; no purchase prompt
   opens in a level, trick moment, checkpoint, or boss arena.
3. After success, refresh the Yandex-owned purchase inventory/receipt and
   grant only the catalog entitlements confirmed by the platform. Store an
   idempotent product/transaction record in the Part 2 cloud save as an
   entitlement snapshot, while Yandex's server-side purchase inventory remains
   authoritative. Never unlock a paid look solely because localStorage says
   it was bought.
4. On every later boot/auth, restore purchases before showing paid looks as
   owned. Replaying the same purchase callback must be a no-op. A revoked or
   refunded entitlement is removed only when the platform explicitly reports
   that state.

This satisfies Yandex requirements 1.13.3 and 1.13.4: the purchase state is
server-backed by Yandex payment history plus the Part 2 cloud entitlement
snapshot, and prices are the transparent catalog prices. It does so without
restoring the stripped Vercel/API backend. If the SDK, payments feature, catalog, or restore call is
unavailable, hide purchase buttons and keep all earned/default looks,
levels, wardrobe preview, leaderboard, and receipt playable. A cached owned
entitlement may remain visible offline, but a new purchase is not granted
until Yandex confirms it.

> **Market check:** Cosmetic IAP is the revenue test with the smallest risk to
> the gift and the platformer. Show a real price and a clear bundle contents
> panel, keep free level/star/Coccoline paths prominent, and treat a missing
> payments SDK as a normal playable state rather than a conversion error.

## Moderation and store-proof checklist

Yandex requirement 3.6 is a release gate: a sequel is accepted as a separate
game only when the setting and/or mechanics are fully reworked. Before the
human contacts Yandex support, prepare a moderation packet that points to the
new six echo worlds, La Dama dell'Eco, both bosses, L/V/R/~/C mechanics,
wardrobe, and data-driven trick moments.

The store title, icon, cover, screenshots, and first 60 seconds must show Part
2 only: Soglia degli Echi, Anna's new visual treatment, the new antagonist,
and the L/V steam-vent introduction. Do not use Part 1 world screenshots,
Part 1 title copy, or old assets in the page or opening. The first playable
minute must reach the new mechanics after `LoadingAPI.ready()`, while keeping
the first ad-free rule. The human owns the support conversation; the
implementation milestone only assembles evidence and checks the static
archive for Part 1 leakage.

## Asset generation and packaging

The Part 2 asset pipeline should reuse the existing deterministic generator
utilities (`tools/gen/index.mjs` and its world/character/background/audio
helpers) in `SamosGames/pixel-princess-2`, while writing a Part 2
manifest/output directory. Generated files, not hand-edited images, are the
source of truth.

Pipeline additions:

1. Add a Part 2 manifest selecting the six world backgrounds, the two boss
   variants, the L/V/R/C sprites, `~` bridge visuals, `T` trick indicators,
   vent warning/active frames, and the finale art/audio.
2. Add generator inputs for any new sprite strips or animation frames. Keep
   frame dimensions and animation metadata aligned with `src/animspec.js`;
   fail generation on missing frames rather than rendering a blank fallback.
3. Keep shared primitive art reusable in source, but stage only the files
   referenced by the Part 2 manifest into the Part 2 archive. Do not make the
   Part 2 page depend on the Part 1 page or an external asset URL.
4. Make generation deterministic and review the manifest diff. The generated
   output is disposable; the manifest and generator input are committed.
5. Keep `tools/package-yandex.mjs` as the Part 2 repo's single release target.
   `npm run package:yandex` must produce a Part 2-only archive with its own
   `index.html`, entry, asset manifest, app metadata, and leaderboard
   configuration. There is no Part 1 package target in this repository.

The new Yandex app ID belongs in release configuration/console metadata, not
in a shared Part 1 constant. The package check must fail if the Part 2 stage
contains a Part 1 entry, Part 1 save prefix, or Part 1 leaderboard ID.

### Approved hybrid background pipeline

World backgrounds use the human-approved hybrid approach. OpenRouter calls
the selected `google/gemini` image model in a browser for source images; the
build never calls OpenRouter and never depends on a remote image URL. Each
accepted source is processed deterministically into four per-world parallax
layer strips (far, mid, near, and foreground/variant), with loop seams,
palette quantization, aerial perspective, and fixed dimensions applied by the
Part 2 generator. The runtime consumes only those processed strips.

Store the source and provenance files at:

```text
docs/part2/art/gen/openrouter/
  generation-manifest.json       # model, prompt, cost, date, checksum, status
  worlds/<world>/raw/*.png       # accepted raw OpenRouter outputs
  worlds/<world>/rejected/*.json # optional metadata only; no rejected PNGs
```

Commit the accepted raw PNGs through Git LFS, with their prompt/model/cost
records and checksums committed as normal text. Do not commit rejected
generations or a 500–650-image scratch dump. Cap a committed raw source at 8
MiB and the complete accepted-source LFS set at 256 MiB; rejected outputs may
remain in the private generation cache until art sign-off. Raw sources are
authoring evidence, not Yandex runtime files, and must never enter the static
archive.

The generation budget is 500–650 OpenRouter generations at approximately
$0.07 each: $35.00 expected at 500, $45.50 at 650, and a $55 hard spend cap
including a small retry/variant allowance. The manifest counter must stop the
generation helper before the cap and record the actual spend. A source is not
accepted merely because it is generated: it must pass the palette, seam,
resolution, and lane-contrast checks below.

Tiles, UI, mechanic icons, and ordinary sprites remain procedural or are
derived from a small set of AI key poses. AI pose references are reduced to
the same locked per-world palette and animation cell contract by the
generator; no raw AI sprite or anti-aliased UI enters the archive. This keeps
the hybrid choice visibly new while preserving deterministic, reviewable
runtime assets.

### Background memory, archive, and loading budgets

The six worlds each have four base layer strips. A strip is capped at
960×360 native pixels (RGBA decode ≈1.32 MiB), matching the long-strip layout
in `06-art.md`. At most two small variant strips per world are allowed at
launch; variants are not a second complete four-layer set.

| Budget | Limit | Gate |
| --- | ---: | --- |
| Base background archive | 24 strips × 256 KiB = 6.0 MiB | Generator/package failure if exceeded |
| World variant archive | 12 strips × 200 KiB = 2.4 MiB | Generator/package failure if exceeded |
| All processed background files | ≤8.5 MiB, including manifests | Package report and release gate |
| One world's resident background textures | ≤14 MiB normal; ≤28 MiB while crossfading old/new worlds | Mobile memory smoke test |
| All decoded game images | ≤32 MiB target; ≤48 MiB hard cap | Mobile profile and browser heap sample |

Load only the current world's sky metadata and four layer strips when entering
that level. Prefetch at most the next layer segment after the first playable
frame, release the old world's textures after a transition, and never preload
all six worlds: the 24 base plus up to 12 variant strips would decode to
roughly 48 MiB before sprites/UI, so that is explicitly forbidden on mobile. A
missing or slow background must fall back to a generated
palette gradient/strip without delaying `LoadingAPI.ready()` or level input.
The asset manifest is small and available at boot; image payloads are
world-scoped.

### Lane-contrast build gate

Every generated world composite must pass a deterministic lane-contrast gate.
At the lane pixels sampled across the full level, including trick routes and
both boss arenas, the lane mid-tone must differ from the backdrop behind it by
at least **0.25 OKLCH L** (25 percentage points). Sample start/middle/end
camera positions and the mobile downscaled composite, not just the source
strips. Also assert that danger and echo telegraphs remain distinguishable
from the lane at their worst sampled background.

Implement this as a generator/package check (for example,
`tools/test/art-contrast.mjs`) over the processed PNGs and level data. It must
fail the build with world/layer/camera coordinates when the threshold is
missed; a human screenshot review is supplementary, not the only gate. The
check must use the same palette quantizer and composite order shipped by the
runtime, so a background that passes in isolation cannot fail after parallax
layers are drawn.

### Audio sources, generation, and budget

Music is AI-generated in the browser with Suno/ElevenLabs. The downloaded
files are the source masters: keep them in a documented Part 2 source-audio
directory with provider, generation date, prompt/track ID, and usage-rights
metadata. Do not make the Yandex archive fetch music from Suno, ElevenLabs, or
any other external URL. Export loopable archive tracks from those downloaded
masters and keep the masters out of the archive.

SFX remain deterministic and code-generated through
`tools/gen/audio.mjs` (currently WAV, 22050 Hz, mono). Add the Part 2 vent,
bridge, charger, magnet, boss, and finale cues to that synthesis path rather
than hand-editing individual effects. A generator test must catch a missing
cue or a changed sample format.

Use these release audio limits:

- **Music format:** stereo MP3 at 96 kbps CBR, with loop points documented in
  the manifest. This is the compatibility-oriented archive format; downloaded
  AI masters may remain WAV/MP3 at their original quality outside the archive.
- **SFX format:** PCM WAV, 22050 Hz, 16-bit, mono, matching
  `tools/gen/audio.mjs`; short cues are preferable to compressed decode work
  during a jump or stomp.
- **Archive budget:** all Part 2 audio in the staged Yandex archive is ≤4 MiB
  target and ≤5 MiB hard cap: music ≤3 MiB and generated SFX ≤1 MiB, with the
  remaining 1 MiB allowance covering metadata or a rare exception. The
  package check reports music bytes, SFX bytes, and total audio bytes
  separately.
- **Loading:** load the menu track at menu entry, load a level track when that
  level starts, release the previous level track, and load finale music only
  when entering level 7. Do not preload all six world tracks, menu music,
  finale music, and boss cues at boot.

> **Market check:** AI music can make the sequel feel distinctive, while large
> tracks increase first-session cost. Preserve a recognizable theme and let
> the archive/load measurements—not a larger soundtrack by default—decide
> whether additional tracks are worth shipping.

> **Market check:** Reusing generator primitives lowers download cost and
> preserves the gift's visual language; new world and boss art still carry
> acquisition value. Prioritize art that supports the sequel's store/page
> presentation only after the research identifies the useful surface.

## i18n workflow

Part 2 owns IT/EN/RU dictionaries under its app boundary, while the key
validation utility can be shared. Every user-facing string—including world
names, mechanic help, boss warnings, cloud-save errors, leaderboard labels,
receipt text, and settings—must be a key, not a literal in a scene or level
data file.

Recommended workflow:

1. Add the Italian key first, then add the same key to English and Russian in
   the same change.
2. Run a key-set equality check and placeholder check for all three files.
3. Have an Italian review pass for feminine agreement and natural tone. Anna
   is the recipient of the gift, and the copy should address her consistently
   as the princess/player; avoid masculine fallback strings.
4. Keep dynamic values as named placeholders and test long translations in
   the 1280x720 layout and mobile viewport. Do not concatenate translated
   fragments in code.
5. Include the exact six world names and the finale/boss names in the i18n
   fixtures so a later rename cannot silently desync the map registry and UI.
6. Add keys for wardrobe slots/items, prices and bundle contents, each reward
   button/status, the weekly week/level/time card, share challenge copy,
   payment restore/errors, and moderation-safe ad disclosures in IT/EN/RU.

The Part 2 package needs only its own dictionary bundle plus shared i18n
formatting code. It must not silently fall back to Part 1's dictionary for a
missing gameplay key.

> **Market check:** Localization affects Yandex reach and comprehension, but
> adding language-specific copy can expand QA cost. Keep the IT/EN/RU launch
> set required by the engine and use research/analytics to prioritize later
> copy experiments, not to remove a required locale.

## Test plan

Keep test execution explicit about the app under test. In the separate
`SamosGames/pixel-princess-2` repository, `npm test` runs the Part 2 suite only;
the copied Part 1 tests are either removed with their content fixtures or
rewritten for the Part 2 registry. Engine-sync branches may run a focused
upstream regression suite before cherry-pick, but the sequel's release gate is
always its own suite.

Add focused Part 2 fixtures/checks to the existing platform, browser, feature,
level, boss, and i18n test patterns:

| Area | Part 2 assertions |
| --- | --- |
| App/package identity | Part 2 entry boots with the new app ID/config; the staged archive has its own index and contains no Part 1 entry, save key, board ID, legacy API, or Vercel deploy material. |
| Level registry | Exactly levels 1–6 build; names and order match the locked table; level 7 routes to finale and never to `buildLevel`. |
| Legend/maps | `L` and `V` occur in level 1, `R` and `~` in level 2, `C` in level 3, and `T` tricks occur in levels 1–6; `~` is not permanent solid; unknown tokens fail loudly. |
| Geometry | Critical-path gaps are ≤2 cells, no double-jump path is required, and every spring landing is on `#`, not `=`. |
| Mechanics | Magnet caps targets/range and excludes keys/bosses; vent collision follows its deterministic cycle; bridge timer and one-way collision work; charger telegraph/recovery and count cap hold. |
| Bosses | `p2.mid` has 2 HP at the end of level 3; `p2.final` / La Dama dell'Eco has 4 HP in level 6; both use `G`/`makeBoss`, stomp/bounce correctly, attacks are telegraphed hazards, defeat cancels future spawns, and key/goal remain reachable. |
| Save isolation | A fixture containing Part 1 local keys or a Part 1-shaped cloud object is ignored and unchanged. A missing Part 2 save starts at level 1. No cross-title migration call occurs. |
| Part 2 cloud merge | Same-app local/cloud union is deterministic, idempotent, monotonic for completion/best times, rejects malformed data, and tolerates offline/API failure. |
| Wardrobe | Every slot has a default and several catalog items; completion grants one free look per level; stars/Coccoline unlocks, free combination, level-select preview, receipt preview, temporary-look expiry, and invalid-item rejection work. |
| Wardrobe merge | Owned item IDs and paid entitlements union only after catalog validation; stars/completed levels merge monotonically; idempotent currency events cannot duplicate Coccoline or undo a purchase; equipped invalid/locked items fall back to defaults. |
| Leaderboard/finale | Only the Part 2 board ID is submitted; submission failure does not block the level 7 finale; leaderboard opens before the receipt. |
| Ads/boosts | No ad request occurs before level 2; every rewarded path is button-only and grants exactly its stated x2 currency, pre-boss heart, start magnet, look trial, or Game Over continue; gameplay/audio/timer pause during ads; no boost appears in an arena. |
| Fullscreen/tricks | Fullscreen occurs only after completed levels 3/6 and never in an arena/start/Game Over/trick; `T` triggers are data-driven, deterministic, optional or telegraphed, and absent from the critical-path cheap-death route. |
| Weekly trial | UTC ISO week calculation selects one level and `pixel_princess_part2_trial_YYYY_Www`; the 53-board provisioning/fallback path works, native score is time, exclusive look reward is saved, and no backend or campaign-board submission is attempted. |
| Share challenge | The existing share pill emits/clips `challenge=trial`, validated week, level, and positive `timeMs`; receivers see a target card without auto-start or trusted query-based rewards, with native-share and clipboard fallbacks. |
| Payments/IAP | Catalog price/content is displayed; confirmed purchases restore idempotently into Yandex-backed/cloud-saved entitlements; refunds/revocations follow SDK state; unknown/local-only claims do not unlock looks; no paid gameplay advantage is present. |
| No-SDK fallback | Without Yandex ads/payments/leaderboards/cloud, earned/free wardrobe, normal levels, trial-local result, receipt, and controls remain playable; purchase/reward buttons hide or degrade without errors. |
| i18n | IT/EN/RU key sets and placeholders match; exact world/boss strings exist; Italian copy passes feminine-agreement review; long strings fit mobile layouts. |
| Package/perf | `npm run package:yandex` succeeds, reports archive size/file count/audio bytes, and excludes Part 1-only files. |
| Audio | Downloaded AI music masters have provenance metadata; archive music is MP3/96 kbps, SFX are generated PCM WAV/22050 Hz mono, audio stays within the 4 MiB target/5 MiB cap, and only the current music track is loaded. |
| Mobile | Part 2 menu/start/resume/new-save flow, language/settings, pause/retry, touch controls, viewport/rotation, level transitions, and both boss arenas smoke-test at narrow and wide mobile sizes. |

The top-level scripts should be shaped like this (names are a plan, not a
code change in this section):

```text
npm test            -> platform + smoke + features + levels + boss + i18n
npm run test:mobile -> Part 2 mobile checks only
npm run package:yandex -> Part 2-only static archive
```

Add a Part 2 browser fixture for the two boss loadouts rather than relying on
one generic “boss exists” assertion. Add a package fixture that scans the
archive for forbidden Part 1 identifiers and Vercel/API files. Add an audio
fixture that validates format, bitrate, total archive bytes, and lazy-load
manifest behavior. Keep deterministic map, contract, and audio tests runnable
without a browser so they remain useful in CI.

## Performance and archive budget

The current Part 1 package observed in this checkout is about 9.3 MB
uncompressed (142 files; roughly 9.0 MB assets). Part 2 has its own budget; it
does not get to borrow Part 1's archive quota at runtime. The hybrid world
backgrounds and wardrobe assets make the previous 15 MiB target too tight, so
set these Part 2 release budgets:

- **Target:** ≤20 MiB uncompressed for the Part 2 staged archive, including
  generated media and JavaScript; the background sub-budget above remains
  ≤8.5 MiB and the audio sub-budget remains ≤4 MiB target / ≤5 MiB hard cap.
- **Warning:** 18 MiB, which triggers asset review before content freeze.
- **Hard content cap:** 24 MiB, excluding the packager's independent 100 MB
  rejection ceiling. Do not treat that platform ceiling as a design target.
- **Runtime:** 1280×720 baseline, one active Kaplay loop, no per-cell physics
  bodies for visual `=`, and no unbounded update/listener registration on
  scene restart.

Bound dynamic work explicitly: magnet scans at most four targets within its
bounded radius; each phase bridge set has at most eight segments; a level has
at most three chargers; vents use one deterministic timer/area each; and only
the current level's boss and attacks exist. Reuse the existing culling/greedy-
mesh behavior without culling gameplay dependencies.

The package job records uncompressed bytes, compressed bytes, file count, and
largest files, background bytes, decoded image estimates, and audio bytes by
music/SFX. A performance smoke pass should verify stable frame time in a full
collectible scene, an active bridge/vent scene, and each boss arena on a
representative low-end mobile profile. It must capture normal and transition
texture memory and fail if the 32 MiB target / 48 MiB hard image budget is
exceeded.

## Milestones and task sizes

Sizes assume one developer familiar with the current Kaplay project; they are
implementation estimates, not promises.

| Phase | Deliverable | Size | Depends on |
| --- | --- | ---: | --- |
| M0 — repo boundary/contracts | Register the new private AO project, copy `main` with full history, strip Part 1 working-tree content/legacy API/Vercel deploy, and confirm the Part 2 entry/config/state interfaces, `MAX_LEVEL=7`, archive isolation, and locked level/boss/token matrix. | M (2–4 days) | — |
| M1 — engine sync/package | Configure `origin`/`upstream`, establish the focused cherry-pick policy, make `package:yandex` Part 2-only, and boot the copied repo with its own menu/scene wiring. | M (2–3 days) | M0 |
| M2 — fresh save/cloud | Implement Part 2-only local/cloud namespace, validation, same-app merge, retry behavior, and isolation fixtures; explicitly omit Part 1 migration. | M (2–3 days) | M0, M1 |
| M3 — engine contracts | Add builder dispatch for `L`, `V`, `R`, `~`, `C`, config-driven tuning, lazy audio loading, and both `makeBoss` loadouts with softlock tests. | L (4–6 days) | M0, M1 |
| M4 — six level data | Port/author levels 1–6 under the locked world names, place mechanics in their required introduction levels, and prove geometry/goal routes. | L (5–8 days; each level M) | M3 |
| M5 — generated presentation/audio | Add Part 2 backgrounds, mechanic/boss/finale art, AI-music source metadata, SFX synthesis inputs, animation metadata, audio/manifest inputs, and deterministic generation checks. | M (3–5 days) | M1, M4 |
| M6 — i18n/leaderboard/finale | Add IT/EN/RU Part 2 keys, feminine Italian review, own native board wiring, level 7 finale order, receipt, and offline fallback. | M (2–3 days) | M2, M4, M5 |
| M7 — wardrobe meta | Replace fixed skins with slot/item catalog, completion/star/Coccoline rewards, free combination UI, level-select/receipt previews, temporary look trials, and wardrobe/currency/cloud merge. | M (5–8 days) | M2, M4, M5, M6 |
| M8 — boosts and tricks | Add button-only rewarded offers, exact pre-boss/checkpoint placement, level-3/6 fullscreen schedule, Game Over regression, `T` trick data/build path, and ad/trick telemetry. | M (4–6 days) | M3, M4, M6, M7 |
| M9 — weekly trial/share | Add UTC week/level rotation, pre-provisioned native board naming, exclusive-look reward, trial fairness rules, and share-pill query links/fallback. | M (4–6 days) | M4, M6, M7 |
| M10 — cosmetic payments | Add catalog/prices, look-bundle purchase/restore, Yandex-backed/cloud entitlement records, idempotent refunds/revocations, and no-SDK playable fallback. | M (4–6 days) | M2, M6, M7 |
| M11 — moderation/store proof | Produce new title/icon/cover/screenshots, first-60-second L/V capture, Part 1 leakage scan, and the support packet for Yandex requirement 3.6. | S (1–2 days) | M4, M5, M7, M8 |
| M12 — release verification | Run `npm test`, mobile checks, package isolation/size/audio checks, wardrobe/ad/trial/payment tests, low-end performance smoke, engine-sync audit, and Yandex staging smoke with the new app ID. | L (4–6 days) | M8–M11 |

The critical path is M0 → M1 → M3 → M4 → M6 → M7 → M8/M9/M10 → M11 → M12.
M2 and M5 can run in parallel once the copied repo boundary is stable, but
M12 must not start until the app ID, campaign/trial boards, archive target,
fresh-save behavior, payment catalog, and upstream engine-sync policy are
confirmed.

## Open questions

These do not reopen locked canon:

- What numeric Yandex app ID and exact console leaderboard ID will be assigned
  to Part 2, and which 53 weekly-trial boards will be provisioned for the
  first launch year? The code should use release-config placeholders until
  console provisioning is complete.
- What is the mid-boss's final display name and portrait treatment? Its
  contract remains `p2.mid`, 2 HP, end of level 3, and `G`/`makeBoss`.
- Which Part 2-generated assets can share source primitives while staying in
  the archive budget? Decide from generated byte measurements, not by adding
  runtime cross-title dependencies.
- Does Yandex cloud-save availability differ across target regions/devices?
  Confirm the adapter's error/consent behavior before adding any first-session
  prompt.
- Which payment product IDs and catalog prices will Yandex approve for the
  initial look bundles, and what purchase-inventory/restore API shape is
  available in the target SDK revision?
- Which downloaded Suno/ElevenLabs masters are cleared for the gift, and which
  Part 2 source-audio metadata format will be used for the release audit?

Closed decisions: standalone Yandex title, new app/archive/leaderboard,
fresh save with no Part 1 migration, six playable levels plus non-playable
level 7, `MAX_LEVEL=7`, two bosses at 2/4 HP, and the L/V/R/~/C token
introductions, wardrobe meta, opt-in boost/fullscreen placement, warm
data-driven trick moments, weekly trial, cosmetic IAP, and the requirement 3.6
moderation/store-proof gate are not open questions.
