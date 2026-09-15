# Part 2 — levels

Part 2 is a separate Yandex Games title with its own static archive, fresh save namespace,
native leaderboard, and six-level campaign. Part 1 is canon backstory only: Anna has already
opened the ballroom doors, but the first note of the new waltz is missing. Reuse the Kaplay
engine and the data-driven level pipeline; do not extend Part 1's level IDs or save state.

The campaign is six playable levels (`1..6`) followed by the non-playable finale (`7`). Keep
`MAX_LEVEL = 7`, as in the current engine. The level files remain pure data and continue to
use `composeMap()`, `laneFor()`, `airFor()`, `arcCollectibles()`, `movers`, and `buildLevel()`.

All names, objectives, checkpoint lines, boss hints and reward copy are i18n keys. For this
title, level keys use `p2.level.N.*`; no level data carries narrative prose. Italian remains
feminine and warm because this is still a gift for Anna.

## Level list and difficulty curve

The proposed maps use height 14: the normal lane is `y=11`, generated ground is `y=12–13`,
and a heart at `y=10` is one cell above the lane. Every listed critical-path ravine is two
cells wide or less. Boss levels use the shared arena layout from `04-boss.md`.

| Level | World and title key | Narrative goal | Length | Critical ravines (`x,w`) | Required/new-mechanic beats | Checkpoints (`F`) | Heart (`H`) | Difficulty |
| --- | --- | --- | ---: | --- | --- | --- | --- | ---: |
| 1 | Soglia degli Echi — `p2.level.1.name` | Cross the mirrored antechamber and recover the first missing measure. | 116 cells | `(18,2), (42,2), (72,2)` | Introduce optional `L` magnet after three visible `o` collectibles; introduce one deterministic `V` vent on clear ground; reuse `M` → `#`. | `x=46`, `x=88` | none | 2/5 |
| 2 | Chiome delle Campanelle — `p2.level.2.name` | Follow Luce's answering bells into the suspended canopy. | 122 cells | `(20,2), (50,2), (80,2), (104,2)` | Introduce `R` beside an optional `~` phase bridge; reuse a mover, `w`/`B`, and a spring-to-`#` bonus route. | `x=48`, `x=92` | `x=72,y=10`, on a safe flat after the first bridge lesson | 3/5 |
| 3 | Archivio Sospeso — `p2.level.3.name` | Retrieve Anna's blank page and defeat the archive's 2-HP mid-boss guardian. | 126 cells | `(18,2), (38,2), (62,2), (88,2)` | Introduce `C` after a long flat teaching strip; combine `!`, `g`, `S`, and a feather bonus route; finish in the shared mid-boss arena. | `x=52` and shared boss `x=100` | none | 3.5/5 |
| 4 | Fucina dell'Alba — `p2.level.4.name` | Carry the forged clasp through the dawn forge. | 132 cells | `(20,2), (58,2), (88,2), (112,2)` | Reuse `R`/`~` as two optional short bridges, plus `r`, `s`, `P`, and one mover; checkpoint between bridge sets. | `x=52`, `x=96` | `x=76,y=10`, after the first forge timing beat | 4/5 |
| 5 | Mare delle Stelle — `p2.level.5.name` | Reconnect Luce's final bell line across the roof's star sea. | 128 cells | `(18,2), (50,2), (82,2), (108,2)` | Reuse `B`/`w` assisted crossings, two offset `V` vents, `C` pressure, an `L` bonus, and an off-phase mover. | `x=52`, `x=96` | none | 4.5/5 |
| 6 | Tetto del Primo Ballo — `p2.level.6.name` | Defeat La Dama dell'Eco, collect the final note/key, and reopen the ballroom dance. | 126 cells | `(18,2), (54,2), (82,2), (96,2)` | Reuse `C`, `V`, `R`/`~` and `S` only before the arena; finish in the shared 4-HP final-boss arena. | `x=56` and shared boss `x=100` | `x=108,y=10`, after the boss checkpoint and before the staircase | 5/5 |

### Curve and retry rules

- Level 1 starts below Part 1's castle difficulty. It teaches the sequel's visual language and
  the new tokens without adding a new movement rule.
- Levels 2–5 add one new decision at a time, then combine it with an existing enemy or set
  piece. A checkpoint is on flat, safe ground, never on a hazard, ravine lip, active vent,
  forced spring bounce, or charger notice strip.
- Level 3's second checkpoint is the boss checkpoint required by the shared arena: it sits at
  x100 before the one-cell, two-cell, three-cell staircase. The mid-boss is 2 HP and must be
  a short teaching encounter, not a second finale.
- Level 6's second checkpoint is also x100. The final arena has no ravine, spike, enemy,
  pendulum, mover, spring, or solid overhead in columns 112–125. La Dama dell'Eco is 4 HP;
  the arena and retry stay identical to the mid-boss contract apart from the configured HP and
  deterministic attack order.
- Critical-path gaps remain `w <= 2`; there is no double jump. Any `M` used by a route launches
  onto a semisolid `#`, never onto a solid `=` slab. `+`, `L`, `R`/`~` bonus routes, and all
  high shelves remain optional unless a safe fallback is explicitly shown.
- Place no heart in a death loop. Part 2 grants three hearts total, on Levels 2, 4 and 6,
  one per level at most. `heartsTaken` must remember each pickup through a checkpoint retry,
  preserving the existing no-infinite-lives rule.

Market check: checkpoint spacing, the 2/5 → 5/5 curve, three fixed hearts, and a second boss
all affect short-session retention and repeat completion. Compare this cadence with the market
research before changing retry distance, heart frequency, or mid-boss scope.

## Existing and new tile vocabulary

The sketches use the current `build.js` legend. A blank cell is air; the two bottom rows are
normally generated by `composeMap()` and show as `=` here. Tokens are case-sensitive: existing
lowercase `r` is a roller, while new uppercase `R` is a resonance rune.

| Token | Meaning |
| --- | --- |
| `=` | Solid ground or terrace |
| `#` | One-way semisolid platform |
| `^` | Static hazard |
| `o` | Themed collectible |
| `H` | Arcade heart, `+1` life |
| `F` | Checkpoint |
| `M` | Spring |
| `!` | Crumble platform |
| `c`, `h` | Crab, hopper |
| `f`, `g`, `S` | Flyer, swooper, armored swooper |
| `r`, `s` | Roller, falling stalactite |
| `w`, `B`, `P` | Updraft, breeze, pendulum |
| `+`, `*` | Feather, star power-up |
| `@`, `>` | Spawn, goal portal |
| `G` | Existing data-driven boss anchor |

These are the five Part 2 tokens from `03-mechanics.md`; add explicit `build.js` dispatch cases
before using them in a map. They must not be interpreted as unknown air cells.

| New token | Meaning and level placement | Collision/route rule |
| --- | --- | --- |
| `L` | Coccoline magnet pickup; introduced in Level 1 after a low visible row of three `o` pickups, then reused as an optional bonus in Level 5. | Attracts only nearby ordinary `collectible` objects for the configured duration; never attracts `H`, `*`, `+`, the boss reward, or a key. It never changes player velocity. |
| `V` | Steam vent hazard; introduced in Level 1 after the first ordinary thorn, reused as two offset vents in Level 5 and before (not inside) the Level 6 arena. | `hazard` area exists only during the deterministic active phase; warning is visual, active height stays below the normal jump apex, and it never occupies a spring cap, mover, or required `#` landing. |
| `R` | Resonance rune trigger; introduced in Level 2 and reused in Level 4 and Level 6's approach. | An `area` with no body activates its level's small `~` set. It is optional and never the only route across a critical gap. |
| `~` | Phase bridge segment; introduced directly ahead of the first Level 2 `R`, then reused in short optional sets. | Dedicated toggled one-way semisolid body, not `=` and not part of the greedy solid mesh. Its timer pauses while Anna stands on it and allows her to step off before deactivation. |
| `C` | Charger enemy; introduced in Level 3 after a long flat strip and reused in Levels 5–6 before their boss arenas. | Existing `enemy` collision/stomp rules, bounded flat patrol, deterministic telegraph, no ravine crossing, and no charger on a checkpoint respawn or boss arena. |

Moving platforms remain `movers` entries with cell coordinates, travel amplitude, period and
optional phase; they are not ASCII tokens. New object counts and timers stay bounded for the
mobile path, while generated sprites and effects go through `npm run gen` and stable `ASSETS`
keys.

## Key-beat layout sketches

Every sketch uses `y=11` for the normal lane and `y=12–13` for generated ground. A blank in
the ground rows is a ravine. The sketches are beat sketches, not complete maps and not to scale;
the coordinates in the table are authoritative when the data files are authored.

### Level 1 — Soglia degli Echi: magnet and vent introduction

The magnet follows a visible low `o` line and is optional. The vent sits on clear flat ground
with enough stopping room; it is not under the required spring landing. The `M` launches onto
the `#` strip directly above it, never onto solid ground.

```text
y=7                         ###  ###
y=10             o  o  o       L       V
y=11  @  h  ^  c       F       M          >
y=12  ==========  ==  ========================
y=13  ==========  ==  ========================
```

### Level 2 — Chiome delle Campanelle: resonance bridge

Touching `R` lights the optional `~` bridge ahead. The lower lane remains continuous around
the bridge lesson; the mover handles the separate two-cell critical ravine by waiting at its edge.

```text
y=7                                  ~~~~~~
y=8                                      o
y=10                         R
y=11  @  ^  c       F       r       ~       F       >
y=12  ==========  ==  ===================  ==  =====
y=13  ==========  ==  ===================  ==  =====
```

`~` is shown at its active position; it is absent until the rune is touched. Its cells are
one-way semisolids, so the player can jump through from below and land from above.

### Level 3 — Archivio Sospeso: charger teaching strip and mid-boss

The first `C` follows a long flat, obstacle-free teaching strip. The mid-boss uses the shared
arena shape below; `G` is the single boss anchor and is configured as `boss.mid` with 2 HP.

```text
y=8                              !  !  !
y=10                    o              +
y=11  @  c       C       F       g       F       >
y=12  ==========  ==  ================================
y=13  ==========  ==  ================================
```

Shared Level 3 arena ending:

```text
columns       100       104          108             112                  125
               F      step +1      step +2       arena: flat +3 cells       >
surface       base       row 11       row 10              row 9
boss anchor                                                     G (x119, y4)
```

The `F` is at x100 before the staircase. The top arena is flat and clear from x112 through
x125. `G` is not a generic enemy: only its telegraphed `hazard` children hurt Anna, and the
goal is a logical boss/reward gate.

### Level 4 — Fucina dell'Alba: two optional bridge sets

The first `R`/`~` set is visible from the lane. A checkpoint comes before the second set, and
the lower route remains valid if either bridge expires. Falling objects and pendulum timing are
telegraphed; no new bridge is required to reach the goal.

```text
y=6                 s                 s
y=8                              P
y=9                         ~~~~
y=10                 R              H
y=11  @  ^  r    F       P    s      R       F       >
y=12  ==========  ==  =================  ==  ========
y=13  ==========  ==  =================  ==  ========
```

### Level 5 — Mare delle Stelle: assisted crossing and vents

The `B`/`w` crossing carries Anna visibly forward but leaves a safe lower solution. The two
`V` vents are phase-offset and separated by room to wait or jump. `C` guards a flat stretch,
never a required glide landing; `L` is an optional collection-completion aid.

```text
y=8                         B B B B B
y=9                              L     o  o  o
y=10                V                    V
y=11  @  ^       F       C       w       F       >
y=12  ==========  ==  =================  ==  =====
y=13  ==========  ==  =================  ==  =====
```

### Level 6 — Tetto del Primo Ballo: final approach and La Dama dell'Eco

The approach may reuse `C`, `V`, and `R`/`~`, but all such objects stop before the shared
arena. `G` is configured as `boss.final` with 4 HP. After the final stomp, one reachable
note/key drops on the flat floor; `>` opens only after pickup.

```text
y=7                              ~~~~~
y=8                         R          S
y=10                                      H
y=11  @  ^       C       F       V       F       >
y=12  ==========  ==  ================================
y=13  ==========  ==  ================================
```

Shared Level 6 arena ending:

```text
columns       100       104          108             112                  125
               F      step +1      step +2       arena: flat +3 cells       >
surface       base       row 11       row 10              row 9
boss anchor                                                     G (x119, y4)
```

The arena has no ravine, spike, enemy, pendulum, mover, spring, solid overhead, or active new
mechanic in columns 112–125. The final boss body is harmless and the goal has no physical wall.

## Boss and invariant contract

Both encounters reuse the `G`/`makeBoss()` contract in `04-boss.md`; their differences belong
in a config-side boss variant, not in level literals:

| Encounter | Level | Config identity | HP | Attack order | Purpose |
| --- | ---: | --- | ---: | --- | --- |
| Mid-boss | 3 | `boss.mid` | 2 | shockwave, debris | Teach the deterministic boss language and keep the retry short. |
| Final boss | 6 | `boss.final` / La Dama dell'Eco | 4 | debris, shockwave, debris, shockwave | Recombine both reads as the final test without adding a new combat system. |

Required behavior for both:

- The root is tagged `boss`, not `enemy`; only bounded, telegraphed `hazard` children can hurt
  Anna. Side contact with the boss body cannot softlock or kill her.
- Use the existing `onCollideUpdate` stomp path. A qualifying downward overlap bounces Anna and
  removes exactly one HP only during the fixed vulnerable window; holding overlap cannot spend a
  second HP in the same window.
- The deterministic loop always returns to `hover → telegraph → recover → descend → window →
  ascend → hover`. The vulnerable window and telegraph do not shrink with HP. Shockwaves remain
  below `PHYSICS.RUN_SPEED`, and debris always leaves a readable safe lane.
- On defeat, cancel pending attack callbacks and drop exactly one reachable note/key at the boss
  x-coordinate on the flat arena. The goal stays a logical gate until the reward is collected;
  no physical wall can trap Anna.
- A death rebuilds the level from the pre-stair checkpoint with a fresh boss and no stale attack
  objects. Yandex SDK absence cannot block the fight, reward, or level transition.

Market check: the 2-HP/4-HP split, roughly 12–25 seconds of active boss time, fixed checkpoints,
and optional rewarded continuation all affect abandonment and repeat completion. Validate the
target session length against the market research, but do not make telegraphs tighter or the
checkpoint less reliable to manufacture monetizable failure.

## Registration and fresh progression

Part 2 is a fork/reuse of the engine, not an extension of the Part 1 campaign:

1. Add `src/levels/level1.js` through `src/levels/level6.js` for the Part 2 definitions. They
   export `LEVEL_1` … `LEVEL_6`, use the story `nameKey` values `p2.level.1.name` …
   `p2.level.6.name`, and carry only data such as `bossId`, `objectiveKey`, `theme`, `movers`,
   and `composeMap()` output.
2. Register exactly those six definitions in `src/levels/index.js` under numeric IDs `1..6`.
   Do not add a seventh playable definition and do not add a new scene for each level; `game.js`
   still resolves the current definition and calls `buildLevel()`.
3. Keep `MAX_LEVEL = 7`. Levels 1–6 are playable; level 7 is the non-playable Part 2 finale.
   The existing last-level condition `level >= MAX_LEVEL - 1` therefore applies to Level 6,
   and `hasLevel(7)` remains false so the reward transition enters the finale.
4. Start with a fresh Part 2 save namespace and no migration from Part 1. The current-level,
   score, lives, checkpoint, hearts, stars and best-time records are new records for this game;
   do not interpret Part 1's `pj.*` values as unlocked Part 2 content. The native Yandex
   leaderboard is also Part 2-owned and submits only this campaign's final time.
5. Use six fresh Part 2 wardrobe layers with `afterLevel: 1..6`, rather than inheriting Part 1's
   completed outfit. Proposed generated keys are `p2_veil`, `p2_brooch`, `p2_boots`,
   `p2_sleeves`, `p2_hairpin`, and `p2_ballgown`; their labels use `p2.reward.*` keys in IT/EN/RU.
   This keeps `unlockedSkinKeys()` and `skinUnlockedBy()` data-driven while making the fresh
   sequel reward loop legible.
6. Add `p2.level.1.*` through `p2.level.6.*`, `p2.objective.*`, `p2.boss.*`, and any Luce,
   Custode, Dama, checkpoint, reward, cutscene and finale keys to all three dictionaries. No
   user-facing literal belongs in level files, `build.js`, `config.js`, or a scene.
7. Add generated backgrounds, theme props, collectibles, new-token sprites and boss art under
   stable Part 2 `config.js`/`ASSETS` keys. `npm run gen` remains the asset source; the Yandex
   archive is static and the no-SDK fallback remains playable.

Market check: a fresh save, six predictable wardrobe layers, the Part 2 leaderboard, and the
three-heart cadence define the sequel's retention/meta baseline. Compare this deliberately small
meta loop with the market worker's findings before adding events, UGC, a second currency, or a
new ad gate.

## Open questions

- What is the final visual identity of the Level 3 local guardian? The `boss.mid` contract and
  2 HP are fixed; its generated art and feminine Italian-facing name can be chosen without
  changing the arena or collision rules.
- Should the six fresh wardrobe layers use entirely new generated silhouettes or recolour the
  existing layer shapes? Either choice must keep six `afterLevel: 1..6` rewards and must not
  imply Part 1 save inheritance.
- Should the optional `R`/`~` route count toward three-star completion? The baseline keeps it
  optional and counts only ordinary `o` collectibles, pending the level review.
- Do the longer 126–132-cell maps and new bounded token objects hold the mobile/Yandex frame
  budget? Verify with the mobile suite and a real-device pass after implementation; shorten an
  optional route before weakening culling, greedy collision meshing, or deterministic hazards.
