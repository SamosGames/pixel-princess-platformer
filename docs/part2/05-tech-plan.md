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

New token art and behavior must be generated/registered together. A map test
must prove the tokens appear in their required levels and that `~` is not
treated as a permanent solid.

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

## Asset generation and packaging

The Part 2 asset pipeline should reuse the existing deterministic generator
utilities (`tools/gen/index.mjs` and its world/character/background/audio
helpers) in `SamosGames/pixel-princess-2`, while writing a Part 2
manifest/output directory. Generated files, not hand-edited images, are the
source of truth.

Pipeline additions:

1. Add a Part 2 manifest selecting the six world backgrounds, the two boss
   variants, the L/V/R/C sprites, `~` bridge visuals, vent warning/active
   frames, and the finale art/audio.
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
| Legend/maps | `L` and `V` occur in level 1, `R` and `~` in level 2, `C` in level 3; `~` is not permanent solid; unknown tokens fail loudly. |
| Geometry | Critical-path gaps are ≤2 cells, no double-jump path is required, and every spring landing is on `#`, not `=`. |
| Mechanics | Magnet caps targets/range and excludes keys/bosses; vent collision follows its deterministic cycle; bridge timer and one-way collision work; charger telegraph/recovery and count cap hold. |
| Bosses | `p2.mid` has 2 HP at the end of level 3; `p2.final` / La Dama dell'Eco has 4 HP in level 6; both use `G`/`makeBoss`, stomp/bounce correctly, attacks are telegraphed hazards, defeat cancels future spawns, and key/goal remain reachable. |
| Save isolation | A fixture containing Part 1 local keys or a Part 1-shaped cloud object is ignored and unchanged. A missing Part 2 save starts at level 1. No cross-title migration call occurs. |
| Part 2 cloud merge | Same-app local/cloud union is deterministic, idempotent, monotonic for completion/best times, rejects malformed data, and tolerates offline/API failure. |
| Leaderboard/finale | Only the Part 2 board ID is submitted; submission failure does not block the level 7 finale; leaderboard opens before the receipt. |
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
does not get to borrow Part 1's archive quota at runtime. Set these release
budgets:

- **Target:** ≤15 MiB uncompressed for the Part 2 staged archive, including
  generated media and JavaScript.
- **Warning:** 12 MiB, which triggers asset review before content freeze.
- **Backstop:** keep the existing packager's 100 MB rejection ceiling, but do
  not treat it as a design target.
- **Runtime:** 1280×720 baseline, one active Kaplay loop, no per-cell physics
  bodies for visual `=`, and no unbounded update/listener registration on
  scene restart.

Bound dynamic work explicitly: magnet scans at most four targets within its
bounded radius; each phase bridge set has at most eight segments; a level has
at most three chargers; vents use one deterministic timer/area each; and only
the current level's boss and attacks exist. Reuse the existing culling/greedy-
mesh behavior without culling gameplay dependencies.

The package job records uncompressed bytes, compressed bytes, file count, and
largest files. A performance smoke pass should verify stable frame time in a
full collectible scene, an active bridge/vent scene, and each boss arena on a
representative low-end mobile profile.

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
| M7 — release verification | Run `npm test`, mobile checks, package isolation/size/audio checks, low-end performance smoke, engine-sync audit, and Yandex staging smoke with the new app ID. | L (3–5 days) | M1–M6 |

The critical path is M0 → M1 → M3 → M4 → M6 → M7. M2 and M5 can run in
parallel once the copied repo boundary is stable, but M7 must not start until
the app ID, native board, archive target, fresh-save behavior, and upstream
engine-sync policy are confirmed.

## Open questions

These do not reopen locked canon:

- What numeric Yandex app ID and exact console leaderboard ID will be assigned
  to Part 2? The code should use release-config placeholders until console
  provisioning is complete.
- What is the mid-boss's final display name and portrait treatment? Its
  contract remains `p2.mid`, 2 HP, end of level 3, and `G`/`makeBoss`.
- Which Part 2-generated assets can share source primitives while staying in
  the archive budget? Decide from generated byte measurements, not by adding
  runtime cross-title dependencies.
- Does Yandex cloud-save availability differ across target regions/devices?
  Confirm the adapter's error/consent behavior before adding any first-session
  prompt.
- What rewarded-ad or optional share cadence, if any, is appropriate for the
  standalone gift? No ad or monetization behavior is part of the locked
  engine contract; reconcile it with the market research before implementation.

Closed decisions: standalone Yandex title, new app/archive/leaderboard,
fresh save with no Part 1 migration, six playable levels plus non-playable
level 7, `MAX_LEVEL=7`, two bosses at 2/4 HP, and the L/V/R/~/C token
introductions are not open questions.
