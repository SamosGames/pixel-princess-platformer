# Part 2 story: The Unfinished Waltz

Status: design only. This section proposes a six-level sequel campaign that fits the
existing six playable levels plus one non-playable finale. It does not change Part 1
canon or require a second movement system.

## Premise and continuity

Part 1 ends with Anna crossing the ballroom threshold. She has travelled through the
Enchanted Forest, Coral Depths, Eastern Rooftops, Snowy Peaks, Twilight Garden and the
Royal Castle; defeated the Custode di Pietra; taken the ballroom key; and opened the
doors. The finale calls her the Perfect Princess and says that every step made her more
herself. Part 2 starts on that exact beat: the doors are open, the celebration is
real, and the six original worlds remain memories rather than being reset.

The first note of the ballroom waltz never sounds. The Custode di Pietra explains that
the missing music has been folded into six new "echo worlds" around the castle. A new
figure, the Dama dell'Eco, took the music because she was once an unheard guest and
believes silence is safer than being forgotten. Anna follows the missing measures to
bring the dance back, but the emotional objective is listening and inviting, not
proving that she deserves the crown.

The final resolution is therefore kind without removing the platforming stakes: Anna
must beat the Dama's encounter, then choose to give her a place in the dance. The
message for Anna remains personal and affirmative. It should never imply that she
needs to become someone else to be loved or welcomed.

Part 2 is a separate Yandex Games release: its own game page, static archive, fresh
save, and native leaderboard. There is no save migration from Part 1. It reuses or
forks the engine's six-playable-level envelope: Part 2 levels are numbered 1–6,
`MAX_LEVEL = 7`, and level 7 is the non-playable finale. Part 1 is canon backstory
only, not a prerequisite for unlocking this campaign.

**Market check:** The fresh six-level campaign creates a clean acquisition and
onboarding funnel; compare the market research before adding any cross-title reward
or account link, which is explicitly out of scope for this sequel.

## Characters

### Returning

- **Anna** — the canonical recipient and protagonist of the gift. She is the default
  selection and the name used by the personalized finale, even when the player chooses
  an alternate avatar.
- **Sognatrice, the Dreamer** — reads the emotional meaning of the echo worlds and
  notices when a memory has been distorted. Her role is gentle interpretation, not a
  separate quest line.
- **Avventuriera, the Adventurer** — maps the safe route and calls out practical
  solutions: wait for the mover, use the semisolid, or take the long way around.
- **Custode di Pietra** — no longer a gatekeeper. After Part 1 he is a quiet stone
  steward of the ballroom and the first person to admit that guarding a door is not the
  same as welcoming a guest. His appearances can be short reward-card or cutscene
  beats; he does not need a new gameplay entity.

Sognatrice and Avventuriera remain selectable heroines, not NPCs that must follow the
player. If their avatar is selected, story copy can address the player as the heroine;
the Italian must still use feminine forms such as `sei arrivata`, `bentornata` and
`sei stata invitata`. The `Per Anna` gift framing must remain intact.

### New

- **Luce, la Campanara** — a young bell-keeper who can hear which measure is missing.
  She appears at safe checkpoints and in the opening/interlude beats, then stays out of
  the collision path. Her bell marks a readable route; it is a story signal, not a new
  required mechanic.
- **La Dama dell'Eco** — the elegant, lonely antagonist and Part 2 boss. She copies
  familiar images from Part 1 because she wants proof that somebody remembers her. Her
  defeat breaks the echo, but the finale reveals that an invitation—not humiliation—was
  what she needed. She has **4 HP** in the Level 6 encounter.
- **La Guardiana dell'Eco** — a two-heart echo guardian left behind by the Dama in the
  Archivio Sospeso. She is a **2 HP mid-boss** at the end of Level 3, a warning and
  tutorial for the Dama's later fight rather than a second final villain. Once freed,
  she returns the archive's missing page and points Anna toward the forge.

No new character should require a permanent companion AI. Kaplay scenes can show Luce,
the Custode and the Dama as short-lived cutscene objects, while level data carries only
the map and stable `*Key` references.

## World and chapter arc

The arc has three compact acts:

1. **Arrival — levels 1–2:** the open ballroom leads into its echoing perimeter;
   Anna learns that the celebration is incomplete.
2. **Listening — levels 3–4:** the echoes become archives and machines. Anna and Luce
   recover the missing measures without treating every strange thing as an enemy.
3. **Sharing — levels 5–6:** the recovered music reaches the roof, the Dama makes one
   last stand, and the restored ballroom becomes a shared invitation.

The six worlds should feel new through generated palettes, backgrounds, props and
collectibles, while the route language stays familiar. Use `buildLevel(def)`,
`composeMap()` and the existing `mapkit.js` vocabulary rather than a bespoke renderer.
The current legend already supports the needed story beats: `#` semisolids, `M`
springs, `!` crumble platforms, `F` checkpoints, `g`/`S` swoopers, `r` rollers,
`w` updrafts, `B` breezes, `P` pendulums and `G` the boss.

Part 2 reserves five additional map tokens from the mechanics brief: `L` for the
optional Coccoline magnet, `V` for the steam vent, `R` for the resonance rune, `~`
for its phase bridge, and `C` for the charger. These are new explicit `build.js`
dispatch cases; they must not repurpose any existing token, and an unknown token must
not silently become a required gameplay element.

**Market check:** Six short chapters, optional high routes and collectible completion
give the sequel a lightweight repeat-run loop. Validate their expected session length,
checkpoint cadence and replay value against the retention research before adding any
larger meta layer.

## Level-by-level narrative hooks

These are hooks for level titles, checkpoint lines and reward cards. Any copy shown to
the player must be an i18n key; the English text here is design copy, not a literal for
level data.

### 1. Soglia degli Echi — Threshold of Echoes

Anna steps through the ballroom doors into a mirrored antechamber. Each reflection
briefly shows one of Part 1's six worlds, then loses a note from its soundtrack. The
Custode's first message is: "The door opened. Now let the welcome be heard."

Gameplay hook: a friendly reintroduction using short ravines, a terrace, crumbles and
one optional spring route. Introduce `L` after a visible low row of three `o`
collectibles: it pulls only nearby ordinary collectibles and is never required for
completion. Introduce `V` on clear floor after the first thorn; its warning cycle lets
Anna watch, wait or jump. Put every spring beneath a `#` landing surface, with a clear
ceiling and no hazard on the full bounce arc. The main route remains completable with
running, jumping and waiting; no bonus reflection or magnet is required.

### 2. Chiome delle Campanelle — Bellflower Canopy

The path climbs above the ballroom through flowers that ring when the wind passes.
Luce appears at the first checkpoint and teaches Anna to distinguish a warning bell
from a welcoming bell. At the exit, one clear bell answers from far above, pointing to
the suspended archive.

Gameplay hook: combine moving platforms with updraft or breeze cells, plus an optional
spring-to-semisolid canopy. The new bell-rune trigger `R` sits beside a safe ledge;
touching it makes the nearby `~` phase bridge appear for a short window. The bridge
exposes a visible upper bell route while the lane remains open underneath, so missing
the lesson costs only optional rewards. A required ravine is never wider than two
cells; a mover must reach a readable edge so waiting is a valid solution. The high
bell route cannot be the only way forward.

### 3. Archivio Sospeso — Floating Archive

The archive stores the memories of every princess who entered the castle. A page with
Anna's name is blank—not because she is missing, but because her story is still being
written. The Dama dell'Eco steals the page's final line while Anna is crossing the
shelves, making the antagonist's presence personal without making her cruel.

Gameplay hook: moving shelves, crumble ledges and swoopers create a readable
"keep moving, then wait" chapter. Introduce the `C` charger after a long flat shelf
with no nearby ravine or thorn: its flash telegraphs a bounded lunge that Anna can jump
or wait out. A feather may expose an optional high shelf, but the critical path must
work without it and without a double jump. A checkpoint before the most dangerous shelf
run makes a retry fair.

At the archive exit, the Dama's abandoned **Guardiana dell'Eco** rises from the blank
page as the 2 HP mid-boss. She uses the same `G`/`makeBoss` contract as the final fight:
harmless body, telegraphed hazards, deterministic recurring vulnerable windows and a
reachable reward on a flat arena. After the second stomp, a short non-playable beat
shows the echo guardian becoming still rather than vanishing; she gives back the page
and says the Dama is hiding in the forge.

**Market check:** The optional feather route is a low-cost replay incentive. Confirm
whether research supports expanding optional routes or instead prioritises persistent
collection/progression; this story does not require either expansion.

### 4. Fucina dell'Alba — Dawn Forge

Beneath the castle, the recovered notes are being forged into a new clasp for the
ballroom's music box. The forge is warm, noisy and a little comic: rollers insist on
rolling away with the notes, while falling ice-like sparks from the ceiling announce
the safe timing. The Custode admits that he has guarded the box for too long.

Gameplay hook: reuse rollers, stalactite-style timed drops and pendulum timing in a
new generated forge theme. Treat the falling objects as telegraphed hazards, not
surprise damage. A required crossing may use a mover, but both waiting platforms must
be safe and the transfer must not exceed the existing two-cell jump contract.

### 5. Mare delle Stelle — Sea of Stars

The castle's roof reflects the night sky as a shallow, star-filled sea. Luce rings the
last recovered bells from floating islands; each answer brings a silent guest closer to
the ballroom. The Dama appears in the water's reflection and asks why Anna is still
trying to make room for somebody who took the music.

Gameplay hook: a long but assisted breeze or updraft crossing, off-phase movers and an
armored swooper guard. Reuse `V` vents and one bounded `C` charger after a checkpoint
as a readable wait-versus-jump combination; their warning windows must leave a safe
choice rather than demand frame-perfect timing. The current should carry the heroine
visibly forward while leaving a safe route through it. Collectibles can form a single
readable glide line; do not scatter required pickups across impossible heights.

### 6. Tetto del Primo Ballo — Roof of the First Dance

The final measure is above the ballroom, where the old roof meets a small observatory.
The Dama turns the six recovered memories into hostile echoes and takes the flat roof
as her stage. The Custode holds the door below; Luce keeps the bell ringing. Anna must
reach the Dama, survive the silence-shock and reclaim the final note.

Gameplay hook: use `G` for the climax and keep the existing boss contract. The Dama's
visuals and attack names may change, but the implementation must remain softlock-proof:

- the boss body is harmless; only clearly telegraphed spawned hazards hurt;
- the phase loop is deterministic and always returns to a vulnerable window;
- the vulnerable window has a fixed generous duration and does not shrink with damage;
- the **4 HP** boss can be stomped with the existing single-jump movement, with no
  double jump;
- the defeat drops a reachable note/key on a flat arena;
- the goal is a logical gate that opens after the defeat and pickup, never a physical
  wall that can trap the heroine.

Both the Level 3 mid-boss and this Level 6 final boss reuse the `G`/`makeBoss` contract.
`BOSS` or a Part 2 boss variant in `config.js` remains the single source of truth for
timing and tuning. If either identity gets new attacks, those attacks still need the
same telegraph, safe lane and fixed-window guarantees.

## Tone and presentation

The tone is cozy fairy-tale arcade: moonlit colour, small jokes, readable danger and a
warm payoff. Difficulty may rise through timing and combinations already understood
from Part 1, not through surprise deaths or mandatory precision tricks. The antagonist
gets a genuine reconciliation beat after the boss; the story does not call her evil
for wanting to be heard.

Part 2 should preserve the existing presentation rules:

- cutscenes are short non-playable Kaplay scenes or reward-card beats, with no gravity,
  movement bindings or collision logic;
- long prose uses the finale's readable sans-serif path, while short labels can use the
  pixel font;
- new art is generated through `npm run gen`, then registered through `config.js` and
  `ASSETS`; no hand-edited generated assets or runtime-only asset paths;
- the Yandex build remains static and belongs to Part 2's own game page. The story must
  not depend on a server or cloud save being available, and Part 2 uses its own native
  leaderboard; no Part 1 save or leaderboard record is migrated.
- the sequel's title, cover/icon and first 60 seconds show the new worlds, `L` magnet
  and `V` steam vent. Do not lead moderation with Part 1 art or a door-only opening;
  the separate-game setting/mechanics rework must be immediately visible.

**Market check:** Wardrobe collection and weekly return play are approved Part 2 scope;
the remaining market-sensitive choice is catalog density and pacing. Do not add a new
currency or ad beat to the story by assumption.

## Wardrobe, boosts and replay hooks

Part 2's fresh save opens with a small wardrobe rather than six fixed `afterLevel`
skins. Each level completion grants one free look; additional looks are collected per
slot, bought with Coccoline or earned through star ratings, and freely combined. The
selected outfit is visible on level select and itemized on the receipt. In-world, the
recovered measures restore the Dama's Atelier, turning each reward into a celebration
of Anna's style rather than a power upgrade.

Rewarded video remains opt-in and button-only at logical pauses: x2 level Coccoline, +1
heart at a pre-boss checkpoint outside the boss state machine, start a level with the
magnet, or try one locked look for that level. Keep the existing Game Over continue.
Nothing rewarded changes jump physics or the recorded time. No ad appears before Level
2; fullscreen ads may follow completed Levels 3 and 6 only, never an arena.

Luce also stages warm, non-rage trick moments in Levels 1–6: a fake crown, a floor that
turns into flowers, or an exit that takes one cheeky step. Every trick is optional or
clearly telegraphed, never a cheap critical-path death, and is authored as data through
`build.js` rather than hidden scene logic.

Once a week, Luce rings a **Bell of the Week** for one selected level. It has its own
native leaderboard and awards an exclusive look. The existing share pill carries the
level and target time for a "beat my time" challenge; the link needs no new backend.
The Dama's Atelier also sells transparent-priced cosmetic look bundles through Yandex
Payments. Purchases are server-saved per Yandex requirements, never pay-to-win, and the
no-SDK fallback remains fully playable.

**Market check:** These are the approved wardrobe, rewarded-boost, weekly-event and
cosmetic-IAP bets from the market brief. Keep the value cosmetic or convenience-only;
do not turn a story beat, boss attempt or recorded-time run into a monetization gate.

## Cutscene and finale beats

1. **Opening, after the Part 1 ballroom:** the existing celebration settles; the first
   waltz chord fails. The Custode explains the missing measures, and Luce rings an
   answering bell. The title card is the Part 2 title.
2. **After level 2:** the first recovered measures play for a few seconds. Luce joins
   the route as a visual guide, not a follower.
3. **After level 3:** the blank archive page reveals the Dama's name and motive. The
   line should make clear that she is lonely, not secretly controlling Part 1. The
   2 HP Guardiana dell'Eco then appears as the Dama's abandoned echo guardian; after
   Anna's second stomp, the short beat frees her and returns the page.
4. **After level 4:** the Custode returns one forged clasp and says the ballroom was
   built for guests, not for guards.
5. **After level 5:** the roof lights connect to the ballroom. The Dama's silhouette
   appears at the final arena; no forced dialogue interrupts active play.
6. **Boss defeat:** after four reliable stomps, the Dama is stunned, the final note/key
   falls onto the safe flat arena, and the logical goal opens only after Anna collects
   it.
7. **Part 2 finale:** Anna enters the ballroom with the Custode, Luce and the Dama as
   invited guests. The Dama plays the missing measure; Anna takes the first dance. The
   closing letter addresses Anna directly and says the welcome was always hers to
   share, not a test she could fail.
8. **Existing platform payoff remains unchanged:** show the Part 2 run time, offer
   Part 2's own native leaderboard first, then chain the Coccoline receipt. The
   submitted time is Part 2 only; it is not a Part 1 record. Keep the current
   `leaderboard -> receipt -> menu` order and the unskippable invitation gate.

**Market check:** The leaderboard invitation is the sequel's social/replay hook, while
the receipt is the gift's personal payoff. Check leaderboard conversion, share behavior
and rewarded-ad expectations in the market research before changing this order or
adding monetization to the finale.

## New i18n namespaces

`it.js` remains the source dictionary; every key below must have matching IT, EN and RU
entries. The Italian copy must stay feminine and bracket-free. Any emoji-bearing label
must use the existing sans-serif escape hatch rather than the pixel font.

- `p2.brand.*` — sequel title and short subtitle.
- `p2.menu.*` — campaign label, resume text, next-world text and the Part 2/finale
  destination labels.
- `p2.level.1.*` through `p2.level.6.*` — level names, chapter subtitles and any
  checkpoint/reward hook that is actually rendered.
- `p2.character.luce.*` and `p2.character.damaEco.*` — names, titles, descriptions and
  short dialogue.
- `p2.character.guardianaEco.*` — the mid-boss name, title and freed-guardian lines.
- `p2.custode.*` — returning guardian lines used in opening and interludes.
- `p2.mechanic.magnet.*`, `p2.mechanic.vent.*`, `p2.mechanic.phaseBridge.*` and
  `p2.enemy.charger.*` — tutorial labels and warnings for `L`, `V`, `R`/`~` and `C`.
- `p2.wardrobe.*` — slot names, look names, free level rewards, Coccoline/star unlocks,
  equip state, level-select summary and receipt lines.
- `p2.boost.*` — button labels and confirmations for x2 Coccoline, the checkpoint
  heart, start-with-magnet and one-level locked-look trials.
- `p2.trial.*` — Bell of the Week title, level/time target, exclusive-look reward,
  native leaderboard state and share-pill copy.
- `p2.shop.*` — Atelier bundle names, transparent prices, purchase/restore states and
  no-SDK/unavailable messaging.
- `p2.trick.*` — warm telegraphs and reactions for optional, data-driven trick moments.
- `p2.objective.*`, `p2.boss.mid.*` and `p2.boss.final.*` — missing-measure objective,
  mid-boss/final-boss names and warnings, note/key prompt and goal-open messages.
- `p2.reward.*` — the six recovered measures and any new music-themed reward labels.
- `p2.cutscene.opening.*`, `p2.cutscene.interlude.*`, `p2.cutscene.midBoss.*` and
  `p2.cutscene.finalBoss.*` — short scene captions and transition lines, including the
  end-of-Level-3 release beat.
- `p2.finale.*` — heroine title, finale title, personalized letter, final time label
  and any guest-specific closing caption. Reuse the existing leaderboard and receipt
  namespaces unless their copy genuinely changes.

Level and config data should carry only fields such as `nameKey`, `objectiveKey` and
`bossNameKey`; no narrative literal belongs in `level*.js`, `build.js` or `config.js`.
The new background, collectible and boss asset keys should likewise be stable manifest
keys, with generated files supplied by the existing asset pipeline.

## Open questions

- **Wardrobe catalog:** Which look slots, Coccoline prices, star thresholds and bundle
  groupings make the collection readable without overloading level select or the
  receipt? The wardrobe itself, free per-level look and cosmetic-only rule are fixed.
- **Avatar canon:** Should Sognatrice and Avventuriera receive distinct cutscene
  portraits, or should the selected avatar stand in for Anna while dialogue stays
  protagonist-neutral? Default is the existing selected-avatar behavior and one
  personalized Anna letter.
- **Boss art budget:** Should the Dama use generated sprites and a new config entry, or
  should the existing primitive boss art be recoloured and relabelled? The behavior
  contract above applies either way.
