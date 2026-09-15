# Part 2 boss fights

This proposal adds two separate encounters: a short mid-game boss that teaches the
language of a boss fight, and a longer finale that recombines the same readable rules
with a stricter attack pattern. They are separate levels, never two bosses in one
scene. That keeps the Part 1 contract intact: `buildLevel()` creates one `G` anchor,
`game.js` owns one `boss` collision handler, and the goal gate remains a small logical
check instead of a physical wall.

The working names below are placeholders until the Part 2 story and world names are
locked. The design is intentionally a variant of the existing Custode di Pietra, not a
new combat system: the player still wins with run, jump, wait, and a stomp.

Market check: two encounters add a second return point and a second completion payoff,
but also add content before the finale. Reconcile the mid-boss against the research on
early-session retention before treating it as mandatory scope.

## Shared arena layout

Use the existing 14-row maps and `TILE = 64`. Both boss levels end with this data-driven
shape, adjusted only for the surrounding world's theme and approach:

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
jump. The 14-cell top is a flat arena: no ravine, spike, enemy, pendulum, mover, solid overhead, or spring inside
columns 112–125. Any bonus spring in the surrounding level must launch onto a `#`
semisolid and must remain off the critical path. All other critical-path gaps stay at
two cells or less.

`G` is an anchor, not a literal world-space height. As in Part 1, `build.js` scans down
for the first solid cell and derives `floorY`, `attackY`, and `windowY` from that floor.
This keeps the fight correct if the arena is moved or its theme changes. The goal is
still drawn at the far right, but it is not blocked by a collider: while the boss or
its reward is missing, the existing goal handler shows the appropriate translated hint
and returns.

## Boss definitions

Add the numbers to the existing boss section of `config.js` (or a small `BOSS` variant
table there); level data should carry only a `bossId` plus the `G` anchor. Do not put
timings, speeds, HP, or attack constants in a level file. The two suggested loadouts
are:

| Encounter | Working identity | HP | Attack order per cycle | Purpose |
| --- | --- | ---: | --- | --- |
| Mid-boss | `boss.mid` — a local guardian of the new world | 2 | shockwave, debris | Teaches jump versus move while keeping the retry short. |
| Finale | `boss.final` — the guardian of Anna's final route | 4 | debris, shockwave, debris, shockwave | Tests both reads without adding an untelegraphed attack. |

Both use the Part 1 phase loop, in this exact order:

`hover → telegraph → recover → descend → window → ascend → hover`

Suggested baseline timings are the current `BOSS` values: hover 1.7 s, telegraph 0.55
s, recover 0.7 s, descend 0.42 s, vulnerable window 2.6 s, and ascend 0.42 s. The
finale may shorten only hover/recover through the existing enrage factor. The
vulnerable window and telegraph durations are fixed; neither may shrink with HP. A
cycle is timer-driven and does not inspect the heroine's position to choose its next
phase, so waiting at either side cannot suppress the next chance to stomp. The attack
index advances only when an attack fires, making the order repeatable after every
retry.

The final boss can have a higher HP count, but should not get a faster-than-readable
simulation. Its shockwave speed remains below `PHYSICS.RUN_SPEED` and has a hard cap,
as in Part 1. If four hits make the finale too long, reduce HP before reducing the
window or telegraph.

Market check: the proposed 2-HP/4-HP split and roughly 12–25 seconds of active boss
time affect repeat-run completion and abandonment. Validate the target session length
and whether a shorter retry or an optional mid-boss performs better.

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
  slots. Pick the safe-lane centre from a fixed sequence such as `[1, 3, 5]` by cycle
  index, not from player position. The marker sequence, drop delay, and safe lane are
  therefore deterministic and testable. Rocks despawn on impact or at a bounded
  lifetime.
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
   one reachable reward at the boss x-coordinate. Reuse the Part 1 `key` contract and
   `spawnKey()` behavior unless the story requires a different generated reward asset;
   the player must be able to pick it up on the arena floor.
5. The goal opens only after the reward is collected. The existing `boss` and `key`
   tags keep this separate from ordinary enemies, so a star can protect Anna from
   attack hazards without silently changing the number of stomps required.

The reward and all boss feedback need `boss.*` i18n keys in `it.js`, `en.js`, and
`ru.js`. Italian copy stays feminine and addressed to Anna (`Sei pronta`, `Bentornata`,
and similar forms); no canvas-rendered string is written in a level or scene. A new
portrait or boss sprite belongs in the deterministic generator and `ASSETS`, never as
a hand-edited file under `assets/`. Primitive markers and the current stone guardian
can be reused if new art is not worth the download cost.

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
  collect the reward, and enter the next scene; Yandex analytics and save/leaderboard
  calls remain additive around the existing gameplay stop and level-complete flow.

Market check: keep ads, leaderboard prompts, and any Part 2 meta reward outside the
critical boss state machine. Compare the research before adding a rewarded revive,
event modifier, or post-boss collection layer.

## Regression coverage

Extend `tools/test/boss.mjs` rather than creating a second ad-hoc browser harness. Keep
the current Part 1 checks, then run the same matrix for each Part 2 boss level:

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
| Locale/platform path | Run the boss flow under the existing `PAGE_LOCALE` and the i18n test's IT/EN/RU passes; verify no missing `boss.*` keys or bracketed canvas text. Run the no-SDK browser path so Yandex absence cannot block the reward or transition. |

The test may set a fresh boss to `hp = 1` only after one real stomp when keeping the
browser run short, as the current harness does. The first damage, retreat, key drop,
and gated-goal assertions must remain real interactions. Tests should observe state
through `window.__pj`; screenshots are useful for review but are not correctness
evidence in this project.

## Open questions

- Are both encounters required, or should Part 2 ship only the finale first? If scope
  is reduced, keep the finale contract and remove the mid-boss loadout without changing
  the collision or gate rules.
- What are the final world names and boss identities? Replace the working names and
  add their feminine Italian copy after the story section settles them.
- Is four HP the right finale length for Anna's intended short repeatable run? Tune the
  config after a real touch-control playtest; do not make the telegraphs or vulnerable
  window tighter to compensate.
- Should a boss defeat persist through a death, or should Part 2 match Part 1 and reset
  the fight from the checkpoint? The default here is reset-on-retry because it requires
  no new persistent state and keeps a failed attempt understandable.
