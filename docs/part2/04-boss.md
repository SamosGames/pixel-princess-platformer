# Part 2 boss fights

This proposal defines two required encounters: the story's echo guardian at the end of
Level 3, **Archivio Sospeso**, and **La Dama dell'Eco** at the end of Level 6, **Tetto
del Primo Ballo**. They are separate levels, never two bosses in one scene. That keeps
the reused/forked engine contract intact: `buildLevel()` creates one `G` anchor,
`game.js` owns one `boss` collision handler, and the goal gate remains a small logical
check instead of a physical wall.

Part 2 is a separate Yandex Games product: its own game page, static upload archive,
fresh save namespace, and native leaderboard. It does not migrate Part 1 local or cloud
save data. The campaign is exactly Levels 1–6 followed by the non-playable finale at
Level 7, with `MAX_LEVEL = 7`; it is not appended as Levels 7–12.

The design is intentionally a variant of the existing Custode di Pietra, not a new
combat system: the player still wins with run, jump, wait, and a stomp.

Market check: both fights are mandatory canon. Use the research to tune onboarding,
retry distance, and telegraph clarity, not to remove the Level 3 encounter.

## Shared arena layout

Use the existing 14-row maps and `TILE = 64`. The boss endings in Level 3 and Level 6
use this data-driven shape, adjusted only for the surrounding world's theme and
approach:

```text
columns       100       104          108             112                  125
               F      step +1      step +2       arena: flat +3 cells       >
surface       base       row 11       row 10              row 9
boss anchor                                                     G (x119, y4)
```

In `composeMap()` terms:

```js
terraces: [
  { x: 104, w: 4, h: 1 },
  { x: 108, w: 4, h: 2 },
  { x: 112, w: 14, h: 3 },
],
items: [
  { x: 100, y: LANE, ch: "F" },
  { x: 119, y: 4, ch: "G" },
  { x: 124, y: 8, ch: ">" },
]
```

The `F` is before the staircase, with a clean run-up. The three runs are 1, 2, and 3
cells above the base; each transition rises by only one cell, so none asks for a double
jump. The 14-cell top is a flat arena: no ravine, spike, enemy, pendulum, mover, solid
overhead, or spring inside columns 112–125. Any bonus spring in the surrounding level
must launch onto a `#` semisolid and must remain off the critical path. All other
critical-path gaps stay at two cells or less.

The new Part 2 tokens stay in their teaching levels and do not alter this arena
contract: `L` and `V` are introduced in Level 1, `R`/`~` in Level 2, and `C` in Level
3. They are distinct from the existing `G`, `boss`, `hazard`, and `boss-attack`
contracts; no new token is needed for a dynamic boss attack.

`G` is an anchor, not a literal world-space height. As in Part 1, `build.js` scans down
for the first solid cell and derives `floorY`, `attackY`, and `windowY` from that floor.
This keeps the fight correct if the arena is moved or its theme changes. The goal is
still drawn at the far right, but it is not blocked by a collider: while the boss or
its reward is missing, the existing goal handler shows the appropriate translated hint
and returns.

## Boss definitions

Add the numbers to the existing boss section of `config.js` (or a small `BOSS` variant
table there); level data should carry only a `bossId` plus the `G` anchor. Do not put
timings, speeds, HP, or attack constants in a level file. The locked loadouts are:

| Encounter | Boss identity | HP | Attack order per cycle | Purpose |
| --- | --- | ---: | --- | --- |
| Level 3, Archivio Sospeso | the story's echo guardian; `p2.boss.mid.*` | 2 | shockwave, debris | Teaches jump versus move while keeping the retry short. |
| Level 6, Tetto del Primo Ballo | La Dama dell'Eco; `p2.boss.final.*` | 4 | debris, shockwave, debris, shockwave | Tests both reads without adding an untelegraphed attack. |

Both use the Part 1 phase loop, in this exact order:

`hover → telegraph → recover → descend → window → ascend → hover`

Baseline timings are the current `BOSS` values: hover 1.7 s, telegraph 0.55 s, recover
0.7 s, descend 0.42 s, vulnerable window 2.6 s, and ascend 0.42 s. The final boss may
shorten only hover/recover through the existing enrage factor. The vulnerable window
and telegraph durations are fixed; neither may shrink with HP. A cycle is timer-driven
and does not inspect the heroine's position to choose its next phase, so waiting at
either side cannot suppress the next chance to stomp. The attack index advances only
when an attack fires, making the order repeatable after every retry.

Both bosses keep a readable simulation. Their shockwave speed remains below
`PHYSICS.RUN_SPEED` and has a hard cap, as in Part 1; the final boss's locked 4 HP is
not a reason to tighten the window or telegraph.

Market check: the locked 2-HP/4-HP split and roughly 12–25 seconds of active boss time
affect repeat-run completion and abandonment. Validate pacing and retry length against
the research without changing the two required placements.

## Attacks and telegraphs

Every attack has a visible, non-lethal warning before its lethal collider exists.
Telegraph objects should have a `boss-telegraph` tag, while the resulting colliders
keep both `hazard` and `boss-attack` tags. A telegraph is never itself a hazard.

- Shockwave: the boss's eyes pulse and it dips during the telegraph; two ground bands
  then leave a small gap under its centre and travel in opposite directions. The bands
  use the current 36×30-ish hitbox, speed cap, and short lifetime. Jumping is the
  answer; touching the harmless boss body is not a death condition.
- Debris: seven fixed floor slots show pulsing markers for `DEBRIS_TELEGRAPH`. The
  volley leaves a contiguous three-slot safe lane and drops rocks only into the other
  slots. The safe-lane centre is the fixed sequence `[1, 3, 5]` by cycle index, not a
  player-position choice. This explicitly replaces the current random
  `k.rand(0, slots)` safe lane at `src/levels/build.js:641`; thread the cycle index
  through `makeBoss`/`spawnDebris` in the shared path. That is a required code change,
  not a level-data tweak. The marker sequence, drop delay, and safe lane are therefore
  deterministic and testable. Rocks despawn on impact or at a bounded lifetime.
- Vulnerable tell: the boss descends to the configured `WINDOW_ABOVE_FLOOR` height,
  pulses its eyes, and keeps that pose for the full window. This is the only attack
  cue that asks for a stomp; no button combination or power-up is required.

Do not add target-seeking projectiles to the baseline fight. They make a headless
regression test timing-dependent and can turn a correctly positioned player into a
random death. A later projectile variant needs its own safe lane, lifetime, and test
contract before it is admitted.

## Stomp, damage, and reward rules

Use the existing dedicated `onCollideUpdate("boss", ...)` path, not the generic
`onCollide("enemy", ...)` path:

1. A stomp means the heroine is overlapping from above, `player.vel.y > 60`, and
   `player.pos.y < boss.pos.y`.
2. Every qualifying overlap bounces her with `PHYSICS.STOMP_BOUNCE`, even when the boss
   is currently invulnerable. Side contact, upward contact, and contact from below do
   not damage the boss and do not kill the heroine.
3. Damage is accepted only when `boss.invulnerable === false`. Subtract exactly one HP,
   flash, score, and immediately set the boss to `ascend` with `invulnerable = true`.
   The retreat prevents repeated `onCollideUpdate` frames from spending multiple HP in
   one window.
4. At zero HP, destroy the boss, cancel any pending telegraph/drop callback, and spawn
   one reachable reward at the boss x-coordinate. The Level 3 reward is its recovered
   measure; the Level 6 reward is the Dama's final note/key. Reuse the Part 1 `key`
   tag and `spawnKey()` reachability behavior even if the generated visual differs, so
   the player can pick it up on the arena floor and the logical gate stays simple.
5. The goal opens only after the reward is collected. The existing `boss` and `key`
   tags keep this separate from ordinary enemies, so a star can protect Anna from
   attack hazards without silently changing the number of stomps required.

The reward and all boss feedback use `p2.boss.mid.*` or `p2.boss.final.*` keys in
`it.js`, `en.js`, and `ru.js`. Italian copy stays feminine and addressed to Anna
(`Sei pronta`, `Bentornata`, and similar forms); no canvas-rendered string is written in
a level or scene. A new portrait or boss sprite belongs in the deterministic generator
and `ASSETS`, never as a hand-edited file under `assets/`. Primitive markers and the
current stone guardian can be reused if new art is not worth the download cost.

## Why the fight cannot softlock

- The player enters through a checkpoint before the staircase, never on a spring, edge,
  spike, or active attack. A death spends the normal life/Coccoline cost and rebuilds
  the level from that checkpoint; the boss restarts in its safe `hover` state.
- Market check: the checkpoint preserves the arcade retry loop, while the life/Coccoline
  cost adds monetizable friction. Any rewarded-ad continuation must remain optional and
  must not remove the guaranteed checkpoint retry or make the boss deliberately tedious.
- The arena is a wide, flat, fully collidable floor. The boss's `floorY` is derived from
  real geometry, and the three-step approach obeys the existing no-double-jump rule.
- The boss root is tagged `boss`, not `enemy`; its body is harmless. Only transient
  `hazard` children can kill Anna, and those children have bounded lifetime. On defeat,
  no delayed `k.wait()` may create a new attack over the reward.
- The phase loop continues forever until the player lands a stomp. No player-position
  branch can skip the vulnerable window. The window is below the single-jump apex,
  while the attack pose is above it. Shockwaves stay jumpable, and debris always leaves
  a three-slot lane.
- The goal remains a logical gate. There is no physical door or wall to wedge behind:
  boss alive means “defeat the guardian”, boss gone plus reward missing means “collect
  the reward”, and both complete means the normal level transition.
- Completion has no Yandex SDK dependency. The local/no-SDK path can defeat the boss,
  collect the reward, and enter the next scene; the standalone Part 2 archive has its
  own Yandex page, native leaderboard, and fresh save namespace. Yandex analytics and
  save/leaderboard calls remain additive around the existing gameplay stop and
  level-complete flow.

Market check: keep ads, leaderboard prompts, and any Part 2 meta reward outside the
critical boss state machine. Compare the research before adding a rewarded revive,
event modifier, or post-boss collection layer.

## Regression coverage

Fork/adapt `tools/test/boss.mjs` rather than creating a second ad-hoc browser harness.
Keep the current Part 1 checks in the Part 1 suite, then run this matrix for Level 3
and Level 6 in the standalone Part 2 build:

| Contract | Browser assertion |
| --- | --- |
| Spawn and geometry | Exactly one `boss`, expected configured HP, initial `hover` + invulnerable state, one goal, and a numeric `floorY` beneath the arena. A non-boss Part 2 level has zero bosses. |
| Deterministic loop | Park Anna far from the arena and observe at least one complete ordered sequence. See `hover`, `telegraph`, `recover`, `descend`, `window`, and `ascend`; verify the next cycle starts with the next configured attack rather than depending on her x-position. |
| Height contract | During `window`, the boss is lower than its attack pose by the configured meaningful distance; the window lasts long enough to sample more than one frame. |
| Telegraph safety | Markers exist before their matching `boss-attack` hazard, are not tagged `hazard`, and remain visible for the configured delay. Debris samples include a contiguous three-slot clear lane. |
| Attack bounds | Shockwave speed never exceeds the configured cap; attacks disappear after their lifetime; no attack appears after the boss is destroyed. |
| Stomp semantics | An upward/side overlap leaves HP unchanged; one downward overlap during `window` changes HP by exactly one and makes the boss retreat. Holding overlap cannot remove a second HP. Invulnerable contact still bounces Anna without damage. |
| Defeat and gate | Perform the configured number of real stomps, observe boss removal and exactly one `key`, collect it from the floor, and verify the goal remains closed before collection and advances the level afterward. |
| Retry safety | Trigger a boss-hazard death, confirm the checkpoint restart has a fresh boss and no stale `boss-attack`/telegraph objects at the spawn. Confirm a paused/reloaded level also starts the loop safely. |
| Locale/platform path | Run the boss flow under the existing `PAGE_LOCALE` and the i18n test's IT/EN/RU passes; verify no missing `p2.boss.mid.*` / `p2.boss.final.*` keys or bracketed canvas text. Run the no-SDK browser path so Yandex absence cannot block the reward or transition. |
| Standalone campaign boundary | Start with a fresh Part 2 save, confirm Level 1 is the first playable level, Level 6 advances to finale Level 7, and no Part 1 save or leaderboard namespace is read. |

The test may set a fresh boss to `hp = 1` only after one real stomp when keeping the
browser run short, as the current harness does. The first damage, retreat, key drop,
and gated-goal assertions must remain real interactions. Tests should observe state
through `window.__pj`; screenshots are useful for review but are not correctness
evidence in this project.

## Locked decisions

- Both encounters are required: the echo guardian closes Level 3, Archivio Sospeso;
  La Dama dell'Eco closes Level 6, Tetto del Primo Ballo.
- Both encounters reset on retry, matching Part 1. A death rebuilds the current scene
  from its checkpoint with a fresh boss; HP, phase, attack index, and reward are not
  persisted in the save.
- Part 2 is standalone with fresh progress, its own static Yandex archive/page/native
  leaderboard, Levels 1–6, and finale Level 7 (`MAX_LEVEL = 7`); there is no Part 1
  save migration.
- The debris safe-lane sequence is exactly `[1, 3, 5]`. Replacing the random
  `k.rand(0, slots)` in the shared `makeBoss` path is part of implementation, and must
  be covered by the boss regression test.
