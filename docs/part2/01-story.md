# Part 2 story: The Unfinished Waltz

Status: design only. This section proposes a six-level sequel campaign that fits the
existing six playable levels plus one non-playable finale. It does not change Part 1
canon or require a new gameplay model.

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

Default packaging assumption: Part 2 is a standalone sequel build with six new level
definitions and the same numeric campaign envelope (`MAX_LEVEL = 7`, six playable
levels followed by a finale). If the project instead combines both campaigns in one
save, the level IDs, unlock progression and Yandex leaderboard semantics need a
separate decision; see Open questions.

**Market check:** A fresh six-level campaign is the clearest sequel onboarding, while
carryover progress may be stronger for returning-player retention. Reconcile this
choice with the market worker's findings before locking save continuity.

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
  what she needed.

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
one optional spring route. Put every spring beneath a `#` landing surface, with a
clear ceiling and no hazard on the full bounce arc. The main route remains completable
with running, jumping and waiting; no bonus reflection is required.

### 2. Chiome delle Campanelle — Bellflower Canopy

The path climbs above the ballroom through flowers that ring when the wind passes.
Luce appears at the first checkpoint and teaches Anna to distinguish a warning bell
from a welcoming bell. At the exit, one clear bell answers from far above, pointing to
the suspended archive.

Gameplay hook: combine moving platforms with updraft or breeze cells, plus an optional
spring-to-semisolid canopy. A required ravine is never wider than two cells; a mover
must reach a readable edge so waiting is a valid solution. The high bell route is a
bonus route and cannot be the only way forward.

### 3. Archivio Sospeso — Floating Archive

The archive stores the memories of every princess who entered the castle. A page with
Anna's name is blank—not because she is missing, but because her story is still being
written. The Dama dell'Eco steals the page's final line while Anna is crossing the
shelves, making the antagonist's presence personal without making her cruel.

Gameplay hook: moving shelves, crumble ledges and swoopers create a readable
"keep moving, then wait" chapter. A feather may expose an optional high shelf, but the
critical path must work without it and without a double jump. A checkpoint before the
most dangerous shelf run makes a retry fair.

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
armored swooper guard. The current should carry the heroine visibly forward while
leaving a safe route through it. Collectibles can form a single readable glide line;
do not scatter required pickups across impossible heights.

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
- the boss can be stomped with the existing single-jump movement, with no double jump;
- the defeat drops a reachable note/key on a flat arena;
- the goal is a logical gate that opens after the defeat and pickup, never a physical
  wall that can trap the heroine.

If the boss borrows the existing stone guardian behavior, `BOSS` remains the single
source of truth for timing and tuning. If it gets new attacks, those attacks still
need the same telegraph, safe lane and fixed-window guarantees.

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
- the Yandex build remains static. The story must not depend on a server, a cloud save
  being available, or a new leaderboard endpoint.

**Market check:** New accessory layers, collection completion and event-like return
visits are retention-sensitive. Keep them as open product choices until the market
research compares cosmetic meta progression and live-event expectations; do not add a
new currency or ad beat to the story by assumption.

## Cutscene and finale beats

1. **Opening, after the Part 1 ballroom:** the existing celebration settles; the first
   waltz chord fails. The Custode explains the missing measures, and Luce rings an
   answering bell. The title card is the Part 2 title.
2. **After level 2:** the first recovered measures play for a few seconds. Luce joins
   the route as a visual guide, not a follower.
3. **After level 3:** the blank archive page reveals the Dama's name and motive. The
   line should make clear that she is lonely, not secretly controlling Part 1.
4. **After level 4:** the Custode returns one forged clasp and says the ballroom was
   built for guests, not for guards.
5. **After level 5:** the roof lights connect to the ballroom. The Dama's silhouette
   appears at the final arena; no forced dialogue interrupts active play.
6. **Boss defeat:** the Dama is stunned, the final note/key falls onto the safe flat
   arena, and the logical goal opens only after Anna collects it.
7. **Part 2 finale:** Anna enters the ballroom with the Custode, Luce and the Dama as
   invited guests. The Dama plays the missing measure; Anna takes the first dance. The
   closing letter addresses Anna directly and says the welcome was always hers to
   share, not a test she could fail.
8. **Existing platform payoff remains unchanged:** show the final time, offer the
   leaderboard first, then chain the Coccoline receipt. Keep the current
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
- `p2.custode.*` — returning guardian lines used in opening and interludes.
- `p2.objective.*` and `p2.boss.*` — missing-measure objective, boss warning, final
  note/key prompt and goal-open message.
- `p2.reward.*` — the six recovered measures and any new music-themed reward labels.
- `p2.cutscene.opening.*`, `p2.cutscene.interlude.*`, `p2.cutscene.boss.*` — short
  scene captions and transition lines.
- `p2.finale.*` — heroine title, finale title, personalized letter, final time label
  and any guest-specific closing caption. Reuse the existing leaderboard and receipt
  namespaces unless their copy genuinely changes.

Level and config data should carry only fields such as `nameKey`, `objectiveKey` and
`bossNameKey`; no narrative literal belongs in `level*.js`, `build.js` or `config.js`.
The new background, collectible and boss asset keys should likewise be stable manifest
keys, with generated files supplied by the existing asset pipeline.

## Open questions

- **Campaign shape:** Is Part 2 a standalone sequel with a fresh six-level save, or a
  combined twelve-level campaign? Default above is standalone so the current registry,
  finale flow and `MAX_LEVEL = 7` remain coherent.
- **Progression:** Should the six Part 2 measures unlock six new generated accessory
  layers, or should Anna begin Part 2 wearing Part 1's complete outfit and receive only
  narrative rewards? Do not overwrite the six existing `SKINS` if saves are shared.
- **Avatar canon:** Should Sognatrice and Avventuriera receive distinct cutscene
  portraits, or should the selected avatar stand in for Anna while dialogue stays
  protagonist-neutral? Default is the existing selected-avatar behavior and one
  personalized Anna letter.
- **Boss art budget:** Should the Dama use generated sprites and a new config entry, or
  should the existing primitive boss art be recoloured and relabelled? The behavior
  contract above applies either way.
- **Yandex records:** If the campaigns share a leaderboard, should the submitted time
  include Part 1 plus Part 2, or only the current campaign? Decide before adding any
  new score or save keys; the static archive must remain compatible with the SDK
  fallback path.
