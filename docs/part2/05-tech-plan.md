# Part 2 technical plan

## Decision summary

Part 2 should ship as a second content pack inside the existing static Kaplay
application. Keep one engine context, one `game` scene, one generic
`buildLevel(def)` path, and one generated-asset pipeline. Add a part selector to
the existing canvas-native menu/world journey rather than creating a second
build, page, or runtime.

> **Market check:** A visible Part 2 entry point can support a return loop and
> sequel discovery without another install, but the research should validate
> whether it should be locked behind Part 1 completion or shown as a preview.

The sequel's stable identity is `part2`; level numbers are scoped to that part.
This avoids collisions between Part 1 level `1` and Part 2 level `1` in saves,
analytics, and records. Part 1 keeps its existing native leaderboard name and
save behavior through a compatibility migration.

## Part selection and level architecture

The current menu already paints a six-world journey from `getCurrentLevel()`
and `getLevelStars()`, while `src/levels/index.js` maps level numbers to pure
data and `src/scenes/game.js` asks `buildLevel()` to turn that data into
objects. Extend those seams; do not fork `game.js` or make a Part 2 copy of
`build.js`.

Recommended flow:

1. Add a small part registry (content metadata, level registry, finale key
   group, and leaderboard id). It may live beside the level registry; it is not
   a second engine or a new build target.
2. Make the existing `menu` scene show Part 1 and Part 2 cards/tabs above the
   journey dots. The selected card controls which registry the existing map,
   resume button, stars, and next-world label read.
3. `Resume` enters the saved part's current run. `New game` resets only the
   selected part's run and starts its first level. Selecting another part does
   not erase either part's completion stars or best times.

   > **Market check:** Preserving a separate Part 2 progression track is a
   > meta-progression/retention choice; reconcile the resume friction and
   > replay incentive with the market findings.
4. Resolve a level by `(partId, levelId)`, then pass the resulting definition
   unchanged to `buildLevel(def)`. Part 2 data belongs under a scoped path such
   as `src/levels/part2/level1.js`; its definitions still use
   `composeMap()`, `terraces`, `movers`, `semisolids`, `decor`, and the existing
   legend.
5. Reuse the registered `finale` scene with a part-specific content record,
   or a thin part-specific finale registration that calls the same renderer.
   The current Part 1 `CLASSIFICA → SCONTRINO` gate remains intact. A Part 2
   completion must select the Part 2 board before the receipt is chained.

Do not use the current global `MAX_LEVEL` as the Part 2 boundary. Replace its
meaning with per-part `lastPlayableLevel`/`finale` metadata at the registry
boundary; keep `config.js` as the source of truth for tunables and the asset
manifest, not scattered scene constants.

No new HTML entry point, bundler, server route, or database is needed. The
Yandex upload remains the same static archive, and local fallback behavior must
remain playable when no SDK exists.

### Non-negotiable content guardrails

- On the direct critical path, every jump gap is at most two cells. There is no
  double jump. A wider visual crossing is allowed only when the data gives her
  a guaranteed ride/current route and does not ask a jump to clear it.
- A spring's landing target is always a `#` semisolid, never a solid `=` slab;
  the existing full-height bounce must have clear space above it.
- A Part 2 boss follows the existing softlock-proof contract: tag the body as
  `boss`, not `enemy`; make only telegraphed spawned attacks `hazard`; keep a
  deterministic recurring vulnerable window; and leave a reachable key/goal
  route with no physical wall that can wedge the heroine.
- All Italian player-facing copy stays feminine and the finale/reward remains
  personal to Anna. These are content acceptance criteria, not optional polish.

## Save data and cloud-save migration

### Shape

The current save is split among `pj.*` localStorage keys and a Yandex object
with `version: 1`. `state.js` is the synchronous local source of truth;
`yandex.js` should continue to be transport-only. Introduce a versioned
canonical document (`schemaVersion: 2`) with shared profile/settings and
part-scoped progress:

```js
{
  schemaVersion: 2,
  activePart: "part1",
  heroine: "anna",
  settings: { music, sfx, musicVol, sfxVol, language },
  coccolineLifetime: 0,
  parts: {
    part1: {
      unlockedLevel: 7,
      levelStars: { "1": 3 },
      bestTimes: { "1": 42000 },
      completed: true,
      run: {
        runId: "…",
        currentLevel: 6,
        score: 0,
        lives: 3,
        runTime: 0,
        checkpoint: null,
        heartsTaken: [],
        coccolineRun: 0,
        updatedAt: 0
      }
    },
    part2: {
      unlockedLevel: 1,
      levelStars: {},
      bestTimes: {},
      completed: false,
      run: null
    }
  }
}
```

The exact field names can follow the existing `state.js` vocabulary, but the
part namespace and `runId` are required. `levelStars` and `bestTimes` remain
maps because that is the existing representation and keeps the document small.
`coccolineLifetime` is shared across parts; `coccolineRun` belongs to the active
run so the gift's receipt still charges one journey. Nickname remains a local
UI preference unless Yandex's public profile is being used.

### Migration and merge rules

- On boot, normalize the v2 local document first. If it is absent, read the
  existing `pj.character`, `pj.currentLevel`, `pj.score`, `pj.lives`,
  `pj.checkpoint`, `pj.heartsTaken`, `pj.runTime`, `pj.levelStars`, and
  `pj.bestTimes` keys into `parts.part1.run`/Part 1 progress. The migration is
  idempotent and writes the canonical document without removing legacy data;
  retaining old keys for one release makes rollback and interrupted migration
  safe.
- Normalize an old cloud object at the same boundary. `version: 1` maps to
  `part1`; a missing version is treated as an untrusted legacy object and only
  known, validated fields are accepted. Unknown fields are ignored.
- Merge durable progress monotonically per part: maximum unlocked level,
  maximum stars per level, and minimum positive best time. Scores use maximum
  per part. Clamp level, stars, lives, score, and times exactly as the current
  state code does; reject NaN, negative, and malformed checkpoint values.
- Merge an active run only when its `runId` matches. For matching runs, keep
  the most recently updated valid checkpoint/run snapshot. For different run
  ids, do not union `heartsTaken`, add scores, or take the maximum lives: that
  would resurrect a heart or combine two unfinished attempts. Keep the local
  active run unless the cloud snapshot is explicitly newer and valid.
- Merge settings by preference, not by numeric max: a locally chosen setting
  wins; a cloud setting fills an unset local value. `activePart` follows the
  local selection unless the local document has no selected part.
- After the merged document is installed in memory and localStorage, schedule
  one canonical v2 cloud write. `hydrateCloudProgress()` must finish before
  the first menu is built, as it does today, so the map never flashes stale
  Part 1 progress.
- Keep cloud saves conservative and bounded. No per-frame cloud writes;
  retain the current debounce and local immediate writes. A localStorage or SDK
  failure must leave the in-memory run playable.

> **Market check:** Cross-device continuity can improve return sessions, while
> a conservative offline-first merge deliberately avoids account friction. Check
> the research before adding sign-in prompts, social saves, or a heavier meta
> layer.

The migration needs fixtures for: a clean v1 local save, a v1 cloud save that
is farther than local, two different active runs, malformed cloud fields, and a
v2 document with both parts already progressed. This is the highest-risk part
of the sequel because a bad merge can silently lose Anna's progress.

## Leaderboards per part

The existing adapter submits `timeMs` as the native Yandex score (fastest first)
and the journey score as `extraData`; `src/ui/leaderboard.js` already owns the
DOM form, native-profile behavior, offline fallback, and the idempotent finale
gate. Preserve all of that and add `partId` to the calls.

Use separate stable native boards:

| Part | Native board id | Compatibility |
| --- | --- | --- |
| Part 1 | `pixel_princess_time` | Keep the shipped id unchanged. |
| Part 2 | `pixel_princess_part2_time` | Create/configure in the Yandex console before release. |

The platform adapter should select the id from a single part-to-board map and
never accept an arbitrary board name from level data. `fetchLeaderboard()` and
`submitLeaderboard()` receive `partId`; `openLeaderboard()` passes the same
part id when it loads, submits, highlights the player's row, or reopens the
board. A Part 2 finish must never post to the Part 1 board, and a menu board
opened while Part 2 is selected must show Part 2 standings.

> **Market check:** Separate boards give Part 2 a fresh competitive reset but
> split social proof and player traffic. Compare that trade-off with the
> research before deciding whether an overall board should remain deferred.

Keep `extraData` as the numeric run score for compatibility with existing Part
1 rows. Do not add a server-side leaderboard or revive `api/leaderboard.js` for
Yandex: native Yandex leaderboards plus the local `null` fallback cover this
product. An overall cross-part board is intentionally deferred because its
ranking rule (time across different content lengths) is not defined.

> **Market check:** The no-backend choice lowers operational risk and package
> size, but it also defers richer events, UGC, and cross-part social features;
> reconcile that intentionally narrow launch scope with the market research.

## Generated asset pipeline additions

`tools/gen/index.mjs` is the deterministic orchestrator. New art should be
authored in `tools/gen/*.mjs`, emitted into `assets/`, and registered by stable
keys in `src/config.js` so `src/assets.js` remains the only loader. Never hand
edit generated files.

Additions:

- Add only Part 2 theme names, sprites, tile frames, or sounds that are not
  reusable from Part 1. Reuse the existing neutral tile atlas, portal,
  collectibles, UI font, and primitives wherever they fit; a new level theme
  can still tint shared frames through `theme.solid`, `theme.solidTop`,
  `theme.goal`, and related fields.
- For a new pixel-art collectible/enemy/decor prop, add a painter or strip
  builder in the appropriate generator module, add its animation contract to
  `src/animspec.js` when needed, then add the asset key/path to `ASSETS` and
  the level theme. Keep native dimensions and nearest-neighbour integer
  upscaling consistent with `world.mjs`/`px.mjs`.
- Add Part 2 background layers to `BG_THEMES` and emit the same sky/mid/near
  trio. Add a BGM only when an existing track cannot carry the theme; one
  shared Part 2 track is preferable to six level tracks.
- Add a generated-output check: every manifest path exists, every generated
  sprite has the expected dimensions/strip frame count, and running `npm run
  gen` twice leaves no content diff. The check belongs with the test/package
  workflow, not in the game runtime.
- Keep generated promo material out of the Yandex runtime unless the archive
  explicitly needs it. The existing package script includes only runtime
  `index.html`, legal files, CSS, `src`, `assets`, and `vendor`.

The first implementation should prefer existing Kaplay primitives for generic
effects. Add generated art only where it materially improves the Part 2 visual
identity; this limits archive growth and avoids a new asset type for a single
object.

> **Market check:** Reusing tracks and primitives protects load time and budget
> but may reduce the perceived novelty of a paid/returning sequel. Use the
> research to set the minimum Part 2 theme/asset freshness before commissioning
> more media.

## i18n workflow

`src/i18n/it.js` remains the source dictionary; `en.js` and `ru.js` must mirror
every key. New keys are namespaced so the two parts cannot accidentally reuse a
different line, for example `part2.menu.title`, `part2.level.1.name`,
`part2.finale.message`, and `part2.boss.hint`.

Rules for each content change:

1. Add the Italian key first, then the English and Russian values in the same
   commit. Level/config data carries `nameKey`/`taglineKey`/`descKey`, never
   visible prose.
2. Keep Italian feminine when addressing Anna (`Bentornata`, `Sei sicura`,
   `Sii la prima`) and have a native Italian review the Part 2 finale and all
   reward/death copy. The game remains a gift for Anna, not a generic neutral
   product.
3. Keep all `k.text()` strings free of square brackets. Do not put emoji in
   pixel-font strings; use the existing per-object `font: "sans-serif"`
   escape hatch for emoji and long prose. DOM HTML strings remain dictionary
   values and must not contain user input.
4. Remember that canvas text is baked when a Kaplay scene is built. The part
   selector and world map should be rebuilt on a menu language switch; DOM
   overlays continue to use `data-i18n*` and `applyDomStrings()`.
5. Extend `tools/test/i18n.mjs` to assert key parity, placeholder parity, no
   square brackets in canvas-bound content, detection/switching for IT/EN/RU,
   and the Part 2 finale/leaderboard strings. Keep state-dependent labels out
   of `data-i18n` when their close/skip state is dynamic.

## Test plan

The existing `npm test` chain is the acceptance spine:
`platform → smoke → features → levels → boss → i18n`. Add the smallest
Part 2 checks to those existing tests where possible, plus focused scripts for
state and registry contracts:

| Check | Addition | Failure it catches |
| --- | --- | --- |
| Platform | Mock v1/v2 cloud objects; assert v2 save payload and both leaderboard ids, score as `extraData`, and native auth path. | Cross-part posting or cloud schema regressions. |
| Parts/menu | Select Part 1 and Part 2, resume each, start a new run in one, and assert the other part's stars/run are unchanged. | Global `MAX_LEVEL`/`currentLevel` leakage. |
| Levels | Iterate the part registry; boot every Part 2 definition, assert goal + collectible build, theme asset keys, and no console/page errors. | Missing registration or asset path. |
| Map contract | Validate authored critical-path segments: every direct critical-path gap is at most 2 cells; any assisted crossing has an explicit guaranteed mover/current contract. Assert no double-jump requirement. | Unbeatable level data. |
| Mechanics/boss | Reuse `build.js` and extend `boss.mjs` for every Part 2 boss: `boss` is not `enemy`, attacks spawn as `hazard`, vulnerable phase recurs, stomps reduce HP, and the goal/key route remains reachable. | Boss softlocks and accidental contact damage. |
| Save migration | Add `tools/test/save.mjs` (or a focused section in `features.mjs`) for local v1 → v2, cloud v1 → v2, max/min/union rules, malformed values, matching/different `runId`, and idempotence. | Silent progress loss or duplicate hearts. |
| i18n | Extend `i18n.mjs` for namespaced Part 2 keys, all three dictionaries, feminine Italian, placeholders, and the Part 2 board/finale gate. | Missing/fallback prose and wrong board labels. |
| Package/assets | Run `npm run gen` determinism check and `npm run package:yandex`; inspect archive root, no tests/API/dev files, all manifest paths, and size budget. | Upload rejection or missing runtime media. |

Keep the current known flaky frame-boundary cases treated as flaky, not as a
reason to weaken the gameplay assertions. Browser tests continue to inspect
`window.__pj` only on localhost and never rely on pixels; add screenshots for
Part 2 level review, but keep the pass/fail assertions structural.

### `test:mobile` additions

Using the existing iPhone-landscape emulation, add assertions that:

- the Part selector/world map fits at the 932×430 viewport, has no horizontal
  overflow, and leaves the safe-area controls clickable;
- switching Part 1 ↔ Part 2 does not expose gameplay touch controls over the
  menu and entering either part restores `body.playing` and the existing D-pad;
- a delayed cloud response still reaches the menu with the canonical merged
  progress and does not block audio/control initialization;
- pause, background/foreground, rotation, and resume from a Part 2 level keep
  the tree/audio behavior and net run clock invariants already covered for Part
  1;
- the Part 2 finale opens its leaderboard first, uses the Part 2 board, and
  chains to the receipt on submit or `Salta` without a duplicate invitation.

The test remains an emulation-level mechanism check; real iOS WebKit audio,
notch insets, and Screen-Time behavior still require a physical phone.

> **Market check:** Keep the existing rewarded continuation and scheduled
> fullscreen-ad seams in `yandex.js`, but do not add new interruptions in this
> architecture pass. Validate rewarded value and acceptable ad frequency against
> the research before changing those placements.

## Performance and package budgets

Observed Part 1 baseline in this checkout is approximately 9.0 MB of `assets`,
460 KB of `src`, and 188 KB of vendored Kaplay. The important mobile wins are
already load-bearing: touch uses `pixelDensity: 1`, active play uses the
refresh-aware `maxFPS`, idle/frozen states use 30/10 FPS, `=` tiles are visual
scenery with greedy-meshed static colliders, and off-screen drawing is culled
without stopping collision or AI.

Part 2 budget:

- Keep the 1280×720 virtual resolution and the same active/idle/frozen frame
  policy. Do not throttle active physics to hide an expensive level.
- Keep a Part 2 map no larger than 140 columns × 14 rows unless a measured
  exception is approved. Aim for no more than 25% over the largest Part 1
  level's scenery, collider, enemy, and transient-particle counts.
- Never add `area()`/`body()` to `=` scenery. New hazards/enemies need one
  generic builder path, must be included in culling where appropriate, and
  must not create a per-cell update loop. Particle spawning must use the same
  near-camera gate as `makeBreeze()`/`makeUpdraft()`.
- On the reference coarse-pointer run, target 55+ FPS during active play with
  no sustained frame over 33 ms in the `?fps=1` overlay after warm-up. A
  lower result is a content-budget failure to investigate, not a reason to
  lower the gameplay cap.
- Target total uncompressed Yandex runtime size under 15 MB after Part 2. The
  existing `tools/package-yandex.mjs` hard-fails at 100 MB uncompressed; keep
  that as the platform ceiling and add a project budget check at 15 MB. With
  the observed ~9.0 MB asset baseline, this leaves roughly 6 MB for new art
  and audio. Measure both staging bytes and the final zip in release QA.
- Do not add a backend, database, or runtime dependency to meet these limits;
  the native SDK and static archive are the intended deployment model.

## Milestones and task sizes

Sizes assume one developer familiar with the current code; they include focused
verification but not art/translation queue time unless listed.

| Phase | Deliverable | Size | Depends on |
| --- | --- | --- | --- |
| M0 — contracts | Part registry shape, v2 save schema, stable board ids, map/asset budget fixtures, and migration test cases. | S (1 day) | — |
| M1 — state/cloud | Normalize v1 local/cloud saves, per-part run/progress state, conservative merge, debounced canonical v2 write, and rollback-safe migration. | L (3–5 days) | M0 |
| M2 — selection | Existing menu/world-map Part selector, per-part resume/new-run flow, scene/finale routing, and no touch/pause overlay regressions. | M (2–3 days) | M0, M1 |
| M3 — Part 2 content | Register all scoped Part 2 level data files (estimate: six); extend `build.js` only for genuinely new reusable legend mechanics; validate all direct gaps and boss routes. | L (5–8 days; each level M) | M0, M2 |
| M4 — media/i18n | Deterministic generators, manifest/animspec additions, shared/new music, IT source copy, EN/RU mirrors, and native Italian review. | M (3–5 days) | M3 |
| M5 — leaderboards | Per-part adapter map, UI `partId` plumbing, Yandex console board setup, offline fallback, and finale gate coverage. | M (2–3 days) | M1, M2 |
| M6 — QA/package | `npm test` additions, `test:mobile` additions, asset determinism, package whitelist/size checks, level screenshots, and performance pass. | L (3–5 days) | M3–M5 |
| M7 — release soak | Yandex-hosted smoke, cloud merge on two accounts/devices, native board submit, and physical iPhone rotation/audio check. | M (2–3 days) | M6 |

Release gate: M6 must be green locally and the archive must remain below the
15 MB project budget; M7 must confirm the Yandex board ids and cloud migration
against the production SDK before publishing.

## Open questions

- Is Part 2 unlocked only after completing Part 1, or should the menu expose a
  playable Part 2 demo/first level immediately? The registry can support either;
  the save gate and copy differ.
- Should switching to a part resume its interrupted run, or always ask between
  `Resume` and `New game` when a run exists? The plan assumes resume is explicit
  and never silently resets a run.
- What is the final Part 2 level count and does it have a boss/finale? The
  architecture supports six or another count, but the release registry and
  boss test must not rely on the Part 1 number six.
- Are `pixel_princess_part2_time` and its public/native visibility approved in
  the Yandex console? Board creation is a release dependency, not a runtime
  fallback.
- Should lifetime Coccoline sync across devices, as proposed, or remain
  local-only as in the current implementation? Decide before v2 migration so
  receipts cannot diverge between devices.
- Does Part 2 need a genuinely new collision mechanic? If yes, can it be
  expressed as a reusable `build.js` legend/data extension while preserving
  the no-double-jump and spring-to-semisolid contracts? A bespoke scene is the
  escalation path, not the default.
- Which Part 2 themes can reuse existing generated music/background primitives
  while still feeling distinct for Anna? Resolve this before adding megabytes
  of media.
