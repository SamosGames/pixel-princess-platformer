# Part 2: mechanics, power-ups, enemies and hazards

This is a deliberately small sequel set. Part 1 already has springs, semisolids, moving platforms,
updrafts, breeze, crumble platforms, pendulums, stars, feathers, crabs, flyers, hoppers, swoopers,
rollers, stalactites and the Keeper boss. Part 2 should add new decisions without adding a second
movement system.

Part 2 is a standalone Yandex Games title: its own game page, static archive, fresh save and native
leaderboard. It does not migrate Part 1 saves. Part 1 is backstory only. The campaign is six
playable levels numbered 1–6, followed by the non-playable finale as level 7; the reused/forked
engine therefore keeps `MAX_LEVEL = 7`.

## Engine constraints

- Keep the critical path completable with run, jump and waiting: no double jump, and no critical-path
  gap wider than two cells. Power-ups and high routes remain optional unless a later design explicitly
  proves a safe fallback.
- Any Part 2 spring keeps Part 1's rule: it launches onto a semisolid `#`, never a solid slab. The
  full spring bounce disarms jump-cut, so every proposed landing needs room above the platform.
- Add level tokens/definition data and dispatch them through `src/levels/build.js`; do not put
  coordinates or tuning literals in a scene. `src/config.js` remains the only home for tunables.
- `=` cells stay visual `scenery`; their static collision continues to come from greedy-meshed
  `solid` rectangles. A new moving or toggled platform gets its own small body and must not be
  folded into that mesh.
- Reuse the existing tags and scene handlers where possible: `enemy` for stomp/side-contact rules,
  `hazard` for the death/invincibility rule, and `collectible` for normal pickup accounting. The
  final boss pattern remains separate: `boss`, deterministic phases, telegraphed hazards, and a
  logical goal gate, never a generic enemy body.
- Culling hides drawing only. AI, timers, areas and bodies still run off-screen, so every new
  object needs a bounded count and cheap off-screen behavior. New art must go through the generated
  asset pipeline; primitives are acceptable for simple glows and indicators.
- Keep the Yandex release static and playable without the SDK: no mechanic may require a server,
  network round-trip or non-Yandex runtime. Existing cloud-save, ads and leaderboard integration
  remain behind the platform adapter; local fallback must still allow a complete run.
  Market check: this section adds no new ad gate or paid power; reconcile any rewarded-ad/meta
  recommendation with the existing continuation flow instead of making a mechanic mandatory.
- The only new map tokens in this section are `L`, `V`, `R`, `~` and `C`; none collides with the
  current `build.js` legend (`= # M ! F g S G r w B P ^ o * + H c f h s @ >`). Add explicit
  builder cases before using them; unknown characters currently become empty air.
- Every player-facing label, hint and tutorial beat gets IT/EN/RU dictionary keys. Italian copy is
  feminine and warm: this is still a gift for Anna. The finale keeps its existing
  `CLASSIFICA → SCONTRINO` closing order; these mechanics do not belong in `finale.js`.

## Locked placement summary

| Level | World | New mechanic placement |
| --- | --- | --- |
| 1 | Soglia degli Echi | `V` steam vent first, then `L` Coccoline magnet |
| 2 | Chiome delle Campanelle | `R` rune and `~` phase bridge |
| 3 | Archivio Sospeso | `C` charger; mid-boss at the level end has 2 HP |
| 4 | Fucina dell'Alba | Reuse and combine understood mechanics; no new token |
| 5 | Mare delle Stelle | Reuse the set with optional patterns; no new token |
| 6 | Tetto del Primo Ballo | Final La Dama dell'Eco boss has 4 HP; no new token |

Both bosses reuse the `G`/`makeBoss` contract from `04-boss.md`; this section does not turn either
boss into a generic `enemy`.

## 1. Resonance rune and phase bridge — traversal mechanic

**Behaviour.** A `R` rune activates the level's small `~` bridge set for a short window. The bridge
is a one-way semisolid: it fades in, can be jumped through from below, and lets Anna take an
optional upper route over a scenic gap or collect a bonus line. A second touch refreshes the timer.
The first implementation should support one bridge set per level, not a general scripting system.
The timer must pause while Anna is standing on a bridge and let her step off before it disappears.

**Config.js tunables.** Add these to the existing `MECHANICS` section in `src/config.js`:

- `PHASE_BRIDGE_DURATION = 5.0` seconds;
- `PHASE_BRIDGE_REFRESH = 0.8` seconds of trigger debounce;
- `PHASE_BRIDGE_MAX_SEGMENTS = 8` per set;
- `PHASE_BRIDGE_FADE = 0.18` seconds for the visual transition.

The bridge's cell positions and optional-route status stay in the level definition; the numbers
above are global feel/safety limits.

**Introduction and teaching beat.** Introduce in Level 2 — **Chiome delle Campanelle** — as `R`
beside one safe, single-cell-high ledge and `~` directly ahead. The rune lights when touched, the
bridge appears, and the first bonus pickup is visible on it. The critical lane continues
underneath, so missing the lesson costs only the bonus. Level 4 — **Fucina dell'Alba** — may reuse
it with two short bridges and a checkpoint between them, but must not turn the mechanic into a
mandatory timed gate without a reachable reactivation point.

**Physics, culling and colliders.** The rune is an `area` trigger with no `body`. Each `~` is a
dedicated `solid`/`semisolid` object using the same one-way resolution as `makeSemisolid`; toggle
its body and visual state like the existing crumble platform. Do not represent it as `=` or mutate
the greedy solid mesh. If the player overlaps it when the timer expires, defer deactivation until
she leaves. Bridges may be hidden by the existing `solid` culling, but their body state must remain
correct; the bridge set is tiny and its off-screen timer is just a scalar update.

**Mobile cost and justification.** At most eight extra static bodies, one trigger, and no spawned
particles. This is the only new geometry/state mechanic: it creates route planning while preserving
the existing jump arc and semisolid rules.

**Market check:** The optional mastery route and short activation window are retention-sensitive;
compare the research's event/meta cadence before adding daily variants or extending the timer.

## 2. Coccoline magnet — optional power-up

**Behaviour.** An `L` pickup attracts nearby ordinary level collectibles for a short time. Items ease
toward Anna with a capped speed and still finish through the normal `collectible` collision handler,
so score, confetti and three-star counting stay unchanged. It does not attract hearts, stars,
feathers, keys or boss rewards, and it never changes Anna's velocity. Place it off the critical path
or after a safe run-up; it is an exploration aid, not a second invincibility button.

**Final placement choice.** Keep the magnet's introduction in Level 1 — **Soglia degli Echi** —
alongside the vent. They are taught as two separate, low-complexity beats: vent first on clear
ground, then magnet after the danger has ended beside a safe row of collectibles. This keeps the
reintroduction level gentle while giving the levels worker one unambiguous placement.

**Config.js tunables.** Add these to the existing `POWERUP` section in `src/config.js`:

- `MAGNET_DURATION = 8` seconds;
- `MAGNET_RADIUS = 192` px;
- `MAGNET_PULL = 480` px/s;
- `MAGNET_MAX_TARGETS = 4` simultaneous collectibles.

**Introduction and teaching beat.** In Level 1 — **Soglia degli Echi** — place the `V` teaching
beat first, then place `L` after a low, visible row of three collectibles and a clean run-up. The
first two are close enough to pull immediately; the third is just outside the radius, teaching that
the power-up is temporary and positional. A later level can put it beside a bonus perch, never
behind a required spring landing.

**Physics, culling and colliders.** Pickups are already collider-only `collectible` objects with
bobbing child art, not solid bodies. While the magnet is active, move only the selected pickup
position; do not use a physics body or alter `=`/`#` collision. Keep the existing bob as a small
visual offset, and destroy/score the item only through the normal collision callback. The target scan
must use nearby `collectible` objects rather than a whole-world search every frame; do not filter by
`hidden`, because culling is draw-only.

**Mobile cost and justification.** One aura plus a bounded squared-distance scan of at most four
items per frame. No particles, raycasts or new bodies. It gives the sequel a collectible decision
that is useful to Anna without changing the proven physics or making completion easier by force.

**Market check:** This is intentionally a collection-completion/replay reward, not a monetized
advantage; reconcile its placement with the research's rewarded-ad and meta-progression findings.

## 3. Charger — readable ground enemy

**Behaviour.** A `C` enemy waits on a flat patrol strip. When Anna enters its notice range it flashes
for a telegraph, commits to a horizontal charge toward her last position, stops after a bounded
travel distance, then has a recovery pause. It cannot reverse during the charge, cross a ravine, or
chase indefinitely. A downward stomp uses the existing bounce and score rule; side or underside
contact uses the existing death flow. The charge should be dodgeable by a normal jump or by waiting
out the telegraph.

**Config.js tunables.** Add these to the existing `ENEMIES` section in `src/config.js`:

- `CHARGER_NOTICE = 320` px;
- `CHARGER_TELEGRAPH = 0.55` seconds;
- `CHARGER_SPEED = 430` px/s;
- `CHARGER_TRAVEL = 256` px;
- `CHARGER_RECOVER = 0.8` seconds;
- `CHARGER_MAX_PER_LEVEL = 3` as a content/performance cap.

Keep these separate from `CRAB_SPEED` and the other existing enemy values; changing the new enemy
must not retune Part 1.

**Introduction and teaching beat.** Introduce in Level 3 — **Archivio Sospeso** — after a long flat
stretch with no thorn or ravine in the same jump window. One charger faces Anna, flashes, and stops
well before the next obstacle. The following encounter places one charger near a collectible,
teaching “wait for the lunge, then jump” without requiring a stomp. The 2-HP mid-boss belongs at
the end of this level, after the charger lesson, not inside its first teaching beat.

**Physics, culling and colliders.** Use the existing `enemy` tag and invisible `area`; like crabs,
flyers and hoppers, the charger needs no `body` and must use a data-defined flat lane plus a clamp
to its patrol band. Reuse the generic enemy collision handler so invincibility and stomps remain
consistent. Its AI may still update while hidden, so it should remain idle unless Anna is inside
`CHARGER_NOTICE`; only then should it run its charge state machine.

**Mobile cost and justification.** One scalar state machine, one area and one generated sprite per
instance; at most three active instances. It adds anticipation and a new enemy silhouette without
introducing pathfinding, terrain queries or another gravity model.

**Market check:** Deterministic telegraphs favor low-frustration mobile retention; compare the
research before increasing failure pressure or tying retries to monetization.

## 4. Steam vent — telegraphed floor hazard

**Behaviour.** A `V` vent cycles through dormant, warning and active states. The warning is a short
flash/hiss; the active plume is a narrow, low vertical hazard that Anna can jump over or wait for.
Its phase is deterministic per level data, so a retry teaches timing rather than changing the
answer. Do not chain vents into an unbroken wall, and keep the active height below the normal jump
apex (about 148 px with the current `JUMP_FORCE`/`GRAVITY`).

**Config.js tunables.** Add these to the existing `HAZARDS` section in `src/config.js`:

- `VENT_PERIOD = 3.2` seconds;
- `VENT_WARNING = 0.7` seconds;
- `VENT_ACTIVE = 0.9` seconds;
- `VENT_HEIGHT = 112` px;
- `VENT_WIDTH = 48` px.

Per-vent phase offsets and positions belong in the level data; no random phase in the critical path.

**Introduction and teaching beat.** Introduce in Level 1 — **Soglia degli Echi** — after the first
ordinary thorn, with one vent on clear ground and enough room to stop. Show the warning while Anna
is still outside the hitbox, then let her watch one full cycle. Level 5 — **Mare delle Stelle** —
can combine two offset vents with a charger, but the warning windows must overlap into a clear
wait/jump solution rather than demand perfect frame timing.

**Physics, culling and colliders.** The vent is a floor-level `hazard` area with no `body`; enable
the area only during the active state so the existing `player.onCollide("hazard")` rule handles
death and star protection. It never edits the solid mesh, never blocks movement, and must not be
placed on a spring cap, a moving platform, or directly beneath a required semisolid landing.
Because culling hides visuals only, its timer continues off-screen; on re-entry the same deterministic
phase is acceptable and avoids spawning effect objects.

**Mobile cost and justification.** One area, one update timer and one generated plume sprite per
vent; no per-frame particles. It adds a readable wait-versus-jump hazard and reuses the safest
existing death path.

**Market check:** A fixed cycle supports fair short sessions; if research favors return-visit
variation, seed only optional vent patterns and keep the critical path deterministic.

## Required tutorial i18n keys

Add every key below to the source Italian dictionary and matching English/Russian dictionaries;
the English glosses describe the intended beat, not a literal outside i18n. Italian wording must
address Anna in the feminine form where grammar requires it.

| Key | Tutorial use |
| --- | --- |
| `p2.hint.vent` | Warning flash: watch the vent, then jump or wait. |
| `p2.hint.magnet` | The magnet pulls nearby treasures toward Anna. |
| `p2.hint.rune` | Touch the rune to call the echo bridge. |
| `p2.hint.bridge` | The phase bridge is fading; step off safely. |
| `p2.hint.charger` | Wait for the flash, then jump the charge. |

## Open questions

1. Should the magnet respect line of sight through `=`/`#` geometry? The low-cost proposal does
   not raycast; if wall-through attraction feels wrong, limit its level placements first and only
   add a bounded ray test after a device measurement.
2. Should the phase bridge ever be required for a three-star route, or remain strictly optional?
   The proposal keeps completion independent until the sequel's level review proves a safe,
   checkpointed mandatory use.
