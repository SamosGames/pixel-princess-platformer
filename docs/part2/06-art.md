# Part 2 — Art direction

**Status: pending human approval.** Nothing here is final until the human signs off on the
review page (§9). No game code, generator module or `assets/` file changed.

Goal from the brief: Part 2 must look **noticeably better** than Part 1 while keeping the
invariants in `CLAUDE.md`: generated assets only, the mobile render path, culling and
greedy-meshed colliders.

Direction changes folded in:

- **Asset source is ChatGPT image generation** (decided by the human), made usable by a
  deterministic `tools/gen` processing step (§4).
- **Backgrounds are the priority**: long, multi-segment parallax layers (§3.4, §4.4).
- **Scope addition after market research**: wardrobe meta, opt-in rewarded boosts, trick
  moments, weekly time trial, cosmetic IAP (§3.9, §3.10).

> **Blocked, not tested:** no ChatGPT image exists in this branch yet. This worker has no
> control of the human's logged-in Chrome: the claude-in-chrome MCP is not configured in the
> session, and the Kapture MCP has no connected extension. `review.html` is built with three
> columns per scene (Part 1 / procedural code mockup / ChatGPT composite). The ChatGPT column
> is an explicit "blocked" placeholder until `docs/part2/art/gen/`, `pipeline-demo.png` and the
> ChatGPT composites exist (§9). The code mockups are a real, reviewable alternative
> pipeline (§4.0), not throwaway sketches.

Deliverables in `docs/part2/art/` today:

| File | What it is |
| --- | --- |
| `current-desktop-{menu,level1..5,boss,finale}.png` | Real screenshots of Part 1, 1280×720, Chrome headless |
| `current-iphone-{menu,level1,level3,boss,finale}.png` | Same, iPhone-landscape emulation (932×430 @3x, touch, iOS UA; profile from `tools/test/mobile.mjs`) |
| `current-desktop-heroine-zoom.png` | 6× nearest-neighbour crop of Anna in Level 1 |
| `mockup-level1.png` | Target look: Level 1, Soglia degli Echi, gameplay frame |
| `mockup-boss.png` | Target look: Level 6 arena, La Dama dell'Eco, debris telegraph |
| `mockup-menu.png` | Target look: menu and world select |
| `mockup-wardrobe.png` | Wardrobe/shop: slots, look states and prices, layered preview, opt-in try-on |
| `mockup-tricks.png` | Four trick-moment telegraphs + the two rewarded-offer surfaces |
| `mockup-heroine-palettes.png` | Part 1 vs Part 2 heroine resolution, 6 poses, 6 world palettes, frame budget |
| `compare-level1.png` | Part 1 Level 1 next to the Part 2 Level 1 mockup |
| `mockup-level1-iphone.png` | The Level 1 mockup as an iPhone-landscape view: 764×430 letterbox, nearest ×1.194 sampling, DOM pause/audio/touch overlays |
| `review.html` | Human review page (`ao preview docs/part2/art/review.html`) |
| `mockups.mjs` | The script that paints every mockup (`node docs/part2/art/mockups.mjs`) |

The mockups run on `tools/gen/px.mjs` (RGBA buffers, deterministic `rng`, Bayer dither,
`outline`, integer `upscale`), so the palette, layout, telegraph and layering rules they show
are ones the build can enforce. The 5×7 bitmap font is a mockup stand-in (§3.8).

---

## 1. Audit of the current visuals

Method: `python3 tools/serve.py 8137`, a Playwright capture script driving `window.__pj` (menu,
each level with the heroine running or teleported mid-level, the Level 6 boss with her placed
at the arena, the finale), on desktop and on the iPhone-landscape profile. Numbers come from the
code (`tools/gen/*`, `src/config.js`, `src/animspec.js`) and from a draw-call sample
(`k.debug.drawCalls()` averaged over 1 s of running, each level).

### 1.1 What Part 1 is today

| Area | Current state | Source |
| --- | --- | --- |
| Art density | Native 320×180 art, ×4 upscale to 1280×720 | `px.mjs` `SCALE = 4` |
| Heroine | 16×24 native (64×96 cell), 8×3 sheet, 19 used cells | `characters.mjs`, `animspec.js` |
| Heroine frames | idle 4, run 6, jump 1, fall 1, land 1, hurt 1, skid 1, celebrate 4 | `ANIMS` |
| Tiles | One 12-frame 16px atlas in **neutral grey**, multiplied by `theme.solid` at runtime | `world.mjs`, `build.js` |
| Collectibles, enemies | 12×12 collectibles and 16×10 crab, 6-frame strips; heart and hopper are 1 frame | `WORLD_SHEETS` |
| Boss | Kaplay primitives: rounded `rect`, two triangle horns, circle eyes | `makeBoss`, `build.js:514` |
| Backgrounds | 3 layers (sky fixed, mid ×0.5, near ×0.8), one flat tone per silhouette layer, 1920 px wrap | `backgrounds.mjs`, `game.js:798` |
| Particles | `k.circle` motes, bubbles and snow; `k.rect` confetti and dust; each an object with its own `onUpdate` | `game.js`, `juice.js` |
| Juice | squash/stretch (`player.js`), hit-stop, `k.shake`, dust puffs, confetti, CSS fade between scenes | `juice.js`, `ui/transition.js` |
| Measured cost | 20–26 draw calls, 550–616 objects, 157–220 visible after culling (desktop and iPhone profile, L1–L6) | draw-call sample |
| Decoded image memory | 66.7 MB RGBA if every image is loaded; backgrounds alone 58 MB, from 260 KB of PNG | PIL over `assets/` |

### 1.2 Concrete weaknesses (evidence in the screenshots)

1. **Low sprite detail.** 16×24 gives Anna two eye pixels and a 6-pixel torso
   (`current-desktop-heroine-zoom.png`). At the iPhone-landscape scale (canvas 0.597×, since
   430/720) she is ~38×57 CSS px, so the face is a few blocks. On the menu she is scaled ×1.9 on
   top of ×4 and turns into large blocks (`current-desktop-menu.png`).
2. **Too few animation frames.** Jump, fall, land and hurt are single frames, and the six
   collectibles all share one spin.
3. **Tint-multiplied tiles make every world the same shape and a muddy colour.** A multiply
   tint can only darken, and it can't shift hue along the ramp. Level 3 is maroon ground on a
   maroon sky, and the heroine and banners sink into it (`current-desktop-level3.png`). Level 6
   is flat grey gravel (`current-desktop-boss.png`).
4. **Weak edge/autotile vocabulary.** There are only L/R caps and 2 top variants: no inner
   corners, no underside, no terrace-to-floor transition.
5. **Flat, short parallax.** Mid and near layers are single-tone silhouettes repeating every
   1920 px. There is no aerial perspective and no foreground, and the upper 60% of the forest
   screen is empty sky with dots.
6. **Mixed rendering styles.** Chunky ×4 pixel art sits next to anti-aliased vector
   primitives: the rounded-rect boss, circle bubbles and motes, and flat pillars in the finale
   (`current-desktop-finale.png`).
7. **No lighting.** Lanterns, the moon and the portal emit nothing.
8. **Hazard readability.** Level 1 brambles and Level 2 urchins are dark lumps with no warning
   colour, and they read as decor.
9. **HUD is plain stacked text in two fonts** plus OS-drawn emoji icons, with no panel.
   Tutorial text is drawn over the heroine, and the chapter title over the moon and the boss.
10. **Russian — the primary market — never sees the pixel font.** `uiFont()` switches any
    Cyrillic string to `sans-serif` (`src/i18n/index.js:103`), because the vendored
    `PixelifySans.woff2` (7.5 KB) covers Latin-1 only.
11. **Menu and finale lack structure**: floating controls; a flat lilac finale.
12. **Mobile framing.** Light-blue letterbox bars on dark worlds, touch buttons over the ground
    strip, and an iOS "add to home screen" banner over the play field in emulation
    (`current-iphone-level1.png`).

What already works and should stay: crisp nearest-neighbour rendering, the 1px dark outline, the
cozy palette intent, squash/stretch and hit-stop, and ambient motion in every world.

---

## 2. Reference bar

Looks a small team can reach, and the specific thing to copy from each.

| Game | Platform | What makes it look good | What we take |
| --- | --- | --- | --- |
| **Celeste** | PC/console, 320×180 native | Same native resolution as Part 1, so resolution isn't the gap. It wins on animation, dust and juice, lane-vs-backdrop contrast, and per-chapter palettes. | Frame budgets, landing dust, value contrast, one signature colour per world. |
| **Shovel Knight** | PC/console, 400×240 | Restricted per-stage palettes with hue shifts, thick silhouettes, 4–5 parallax layers with a foreground. | Locked per-world palettes instead of a tint; a foreground layer. |
| **Alwa's Legacy** | PC/console | Cute 16-bit proportions, soft saturated palettes, readable faces at small size. | Chibi proportions for a 32×48 heroine. |
| **Kingdom Two Crowns** | PC/mobile | Mood made of lighting: light pools, reflections, gradients over simple geometry. | Softer-shaded, light-led backgrounds behind a crisp lane (§3.4). |
| **Dead Cells** | PC/console/mobile | Pixel sprites produced by a **build step** from source assets (3D renders → pixel sheets). | Proof that "non-pixel source + deterministic reduction to pixel sheets" works (§4). |
| **Level Devil** | Poki (web), 4.08M votes per `00-market.md` | Almost no art; hazards and tricks instantly readable. | Tricks need a telegraph language (§3.10). |
| **Путь Пикселя** | Yandex Games, 16,196 votes, quality 69/61 per `00-market.md` | Market evidence only (art not audited here): a pixel platformer can hold a good Yandex score. | Pixel art isn't a handicap on the platform. |

**Market check:** store cover, icon and screenshots must be Part 2-only and read as a new game in
the catalogue (Yandex requirement 3.6 in `00-market.md`). The ChatGPT background pipeline makes
store-quality key art cheap: lead with World 2 (bright) and the Level 6 boss.

---

## 3. Target art direction

### 3.1 Double the art density, keep every runtime size

Part 2 targets **640×360 native art, integer ×2** instead of 320×180 ×4. Every runtime
dimension stays: `GAME_W/H` 1280×720, `TILE` 64, the 64×96 heroine cell, colliders, level data,
camera, physics. `mockup-heroine-palettes.png` shows the two heroines at the same on-screen size.

| Type | Part 1 native | Part 2 native | Runtime |
| --- | --- | --- | --- |
| Heroine and each look layer | 16×24 | **32×48** | 64×96 cell |
| Tiles | 16×16 | **32×32** | 64×64 |
| Collectibles, magnet `L`, heart | 12×12 | **24×24** | 48×48 |
| Small enemies | 16×10 / 12×8 | **32×20 / 24×16** | 64×40 / 48×32 |
| Charger `C` | — | **32×24** | 64×48 |
| Steam vent `V` plume | — | **24×56** | 48×112 = `VENT_WIDTH` × `VENT_HEIGHT` |
| Phase bridge `~`, rune `R` | — | **32×16**, **24×32** | 64×32, 48×64 |
| Guardiana dell'Eco (L3) | primitive | **48×56** | 96×112 art; hitbox stays config |
| La Dama dell'Eco (L6) | primitive | **56×76** | 112×152 art; hitbox stays config |
| Backgrounds | 320×180 / 480-wide strips | **softer "painterly pixel", 640×360 and long strips (§3.4)** | ×2 |
| UI panels and icons | CSS / emoji | **9-slice pixel sheets, 12–16px icons** | ×2 |

**Risk, and a Phase 0 gate: pixel wobble on iPhone.** The canvas is `crisp` (`image-rendering:
pixelated`) with `pixelDensity: 1` on touch. In iPhone landscape the backbuffer is ~764×430, so
one Part 2 art pixel lands on ~1.19 backbuffer pixels. Nearest sampling will draw some columns
1 px and some 2 px wide, which shimmers while scrolling. Emulation can't settle this. Phase 0
tests on a real iPhone:

- (a) density 1, judged by eye;
- (b) raise density on touch until the backbuffer is ≥1280 px wide (≈1.68, ~2.8× the fill),
  and measure frame time;
- (c) fallback: ×4 for tiles and backgrounds, ×2 only for the heroine, bosses and UI.

Don't weaken culling, greedy meshing or the frame cap to pay for (b).

### 3.2 Palettes per world (locked hex — the quantizer's target)

Rules:

- One locked 8–12 colour set per world for the lane (tiles, props, sprites). Backgrounds may use
  a **32-colour extension** of the same hues for softer shading (§4.3).
- Ramps hue-shift: shadows toward blue/violet, highlights warm. No runtime multiply tint.
- Three reserved roles, identical in every world:
  - **Danger** `#ff5f7e`: lethal hazards, boss telegraphs, hurt flashes.
  - **Echo** `#7ff3ff`/`#8ff0e6`: Part 2 magic **and all trick telegraphs** (§3.10).
  - **Outline** `#24172e`.
- The lane beats the backdrop on value: lane mid tone ≥25% OKLCH L away from the backdrop behind
  it. The build asserts it on composites (§4.5).

| World | Mood | Core colours (dark → light) | Accents |
| --- | --- | --- | --- |
| 1 Soglia degli Echi | Moonlit mirror antechamber | `#140f2a` `#3a2f66` `#6564a0` `#bdb2d8` `#f4eefb` | gold `#e0a93f`, echo `#8ff0e6`, rose `#ff8fa3` |
| 2 Chiome delle Campanelle | Morning bellflower canopy | `#1f4a4f` `#3f8f6b` `#6cc08a` `#7ec8e3` `#d8f1e4` | bark `#7a4e3a`, bell lilac `#b9a4f0`, gold `#f2c14e` |
| 3 Archivio Sospeso | Lamplit shelves in a dusk void | `#1e1b2e` `#3b2f4f` `#5a3829` `#8a5a3c` `#b67a4d` | paper `#f1e3c2`, lamp `#ffcf6b`, echo-ink `#9fb7ff` |
| 4 Fucina dell'Alba | Iron forge at sunrise | `#2a1f3d` `#2e2a38` `#4a4458` `#6e6680` `#f0e6dc` | brass `#d49a3a`, ember `#ff6a3d`, spark `#ffc24b` |
| 5 Mare delle Stelle | Star-filled shallow sea | `#0b1030` `#1c3c78` `#2e5fa8` `#6a7fb0` `#fff3c4` | moss `#5ec4b0`, glow `#8ef6ff`, pink `#f58fc0` |
| 6 Tetto del Primo Ballo | Night roof, verdigris copper | `#140f2b` `#3a2a5e` `#28575a` `#5fae9c` `#8fd6c2` | gold `#e8b84a`, window `#ffc76e`, echo `#7ff3ff` |

Letterbox bars and `#fade` take the world's darkest colour through a CSS variable.

### 3.3 Animation frame budgets

Heroine sheet grows from 8×3 to **8×4 (32 cells)**, still 64×96 cells. `SHEET`/`ANIMS` stay the
contract, and every look uses the same grid. Where each frame comes from is decided in §4.6.

| Heroine anim | Part 1 | Part 2 |
| --- | ---: | ---: |
| idle | 4 | 6 |
| run | 6 | 8 |
| jump | 1 | 2 |
| apex→fall | 1 | 2 |
| land | 1 | 2 |
| hurt | 1 | 3 |
| skid | 1 | 2 |
| celebrate | 4 | 4 |

| Other sprite | Frames |
| --- | --- |
| Collectible (per-world echo note) | 8-frame spin |
| Restyled enemies | 6 per loop + generated 1-frame white flash |
| Charger `C` | idle 4, telegraph 2, charge 4, recover 2 |
| Steam vent `V` | dormant 1, warning 3, active 4 |
| Rune `R` / bridge `~` | rune idle 4, lit 4; bridge fade-in 4 (`PHASE_BRIDGE_FADE` 0.18 s), shimmer 4, fade-out 4 |
| Magnet `L` | spin 6, aura 4 |
| Checkpoint bell `F` | idle 1, ring 6 |
| Trick props (§3.10) | telegraph 4, reveal 4 |
| Guardiana dell'Eco | hover 4, telegraph 3, attack 3, window 4, hurt 2, freed 4 = **20** |
| La Dama dell'Eco | hover 6, telegraph 4, cast 4, window 4, hurt 2, reconcile 4 = **24** |

Boss sheets drive the existing timer phases; art never adds a phase or changes a duration
(`04-boss.md`).

### 3.4 Backgrounds: long, layered, looping (priority)

Five layers maximum, each one texture strip set. Backgrounds keep softer shading than sprites,
but are quantized to the world palette extension and pushed back by aerial perspective (blend
toward the sky colour: far 60%, mid 35%, near 10%). Aerial perspective also keeps them from
stealing readability from the lane.

**Length.** Levels are 116–132 cells in `02-levels.md` (up to ~140 with slack) × 64 px = up to
**8,960 runtime px** of camera travel. A layer scrolling at factor `f` must show `f × 8960 + 1280`
px without an obvious repeat:

| Layer | Factor | Span needed (runtime px) | Authored length | Repeat |
| --- | --- | ---: | --- | --- |
| Sky | fixed | 1280 | 1 image | none |
| Far | 0.2 | ~3,070 | 2 segments, looped | ≥1 loop per level, acceptable at that distance |
| Mid | 0.5 | ~5,760 | 4 segments | none within one level |
| Near | 0.8 | ~8,450 | 4 segments, looped | ~2 loops per level, broken up by 2 variant segments |
| Foreground | 1.15 | sparse sprites | props, not a strip | only in the top ~120 px or below the ground line |

One ChatGPT landscape image becomes roughly one 1920-runtime-px segment after processing (§4.4).
Strips ship at native ×1 and are drawn at `k.scale(2)`; each 960-native-wide piece stays under
Kaplay's 2048 atlas page.

| World | Far | Mid | Near | Foreground |
| --- | --- | --- | --- | --- |
| 1 Soglia | colonnade with arched night windows, moon | gilded echo mirrors showing Part 1 worlds, fluted pillars, light shafts | pillar bases, balustrades | drapes, chandelier |
| 2 Chiome | misty canopy domes | bellflower trunks with hanging bells | leaf clusters | overhanging vines |
| 3 Archivio | dim shelf stacks | floating shelves with lamp pools | ladder silhouettes | page flurry (particles) |
| 4 Fucina | dawn sky through chimneys | furnaces with ember glow, gears | chains, anvils | hanging chains |
| 5 Mare | star sky + horizon | floating islands, reflections | reef rocks | none |
| 6 Tetto | spires with warm windows | ballroom roof, rose window, dormers | chimneys | none in the arena |

`mockup-boss.png` shows why the arena has no foreground: telegraphs must be the brightest things
near the floor.

### 3.5 Tile sets and autotiling

Per world, one **tile kit** at 32×32 native (base block, top lip, edge, corner, underside, 2–3
decals). The ChatGPT kit sheet (§4) is reduced to that kit, then the generator expands it
procedurally:

| Frames | Count |
| --- | ---: |
| 4-bit exposure mask | 16 |
| Inner corners | 4 |
| Top / fill variants | 3 / 3 |
| Semisolid L / M / R | 3 |
| Hazards | 2 |
| Surface decals | 4 |
| **Total** | **35** |

At runtime size that is an 8×5 atlas, 512×320 per world.

- **Mask pick in `build.js` at build time.** `=` cells stay collider-free `"scenery"`, and
  `buildSolidColliders` greedy-meshes as today.
- The runtime `k.color(theme.solid)` tint is removed; colours are baked per world.

### 3.6 Lighting and particles

| Effect | Approach | Mobile cost | Verdict |
| --- | --- | --- | --- |
| Light pools, moon, windows | Baked into background layers (ChatGPT renders them; the quantizer keeps them) | 0 | **Yes** |
| Aerial perspective | Baked per layer in processing | 0 | **Yes** |
| Additive glow | Not available: Kaplay 3001.0.19 blends premultiplied `ONE, ONE_MINUS_SRC_ALPHA` and exposes no blend mode | — | Dithered alpha glow sprites |
| Per-object `shader()` (flash, palette swap) | Breaks batching per object | +1 draw call each | **No.** `_flash` frames are generated |
| `usePostEffect` | Extra full-resolution pass | full-screen fill | Desktop-only option, off by default |
| Vignette | One fixed dithered sprite per world | 1 quad | Yes; measure on device |
| Echo after-images | 2 extra sprites of the same frame, 0.08–0.25 opacity | 2 quads, same batch | Yes, the Part 2 signature |
| Ambient motes / pages / embers | Kaplay `particles()` emitters instead of one object per mote | cheaper than today | **Yes** |
| Reflections (World 5, World 1) | Flipped sprite copy at 0.2 opacity | 1 quad | Yes |

Particle caps: **≤60 live quads on touch, ≤150 on desktop**.

### 3.7 Juice

Kept: squash/stretch, `hitStop`, `screenShake`, `dustPuff`, `confettiBurst`, `fadeToScene`.

| Beat | Treatment |
| --- | --- |
| Run / land | dust sprite every 2nd contact frame; 5-frame dust ring on land |
| Stomp | hit-stop 70 ms, shake 2 px, enemy flash frame |
| Boss hit | hit-stop 90 ms, shake ≤4 px, `_flash` frame, echo copies scatter |
| Pickup | 8-frame spin, 6-quad sparkle, HUD counter pop |
| Checkpoint | bell ring strip + pixel ring |
| Telegraphs | danger pulse (lethal) or echo shimmer (trick) at fixed rates |
| Transition | DOM `#fade` with a dithered diamond mask, 350 ms, in the world's dark colour |
| Chapter title | ribbon at top centre, never over the lane or boss |

`prefers-reduced-motion` disables shake and the echo trail.

### 3.8 UI and HUD restyle

- **One visual system**: 9-slice pixel panels (Kaplay `slice9`), plum outline, lilac bevel. The
  same PNG is used as CSS `border-image` in DOM overlays (pause, leaderboard, receipt, settings,
  shop).
- **Generated pixel icons replace emoji** in the HUD: note, heart, star, clock, Coccoline, and a
  video icon marking every rewarded button.
- **HUD** stays in the left column (the top-right belongs to the DOM audio button). One panel:
  collectible count, heart pips (5, then `×N` to `LIVES.MAX` 9), stars, timer. The boss bar goes
  top centre.
- **Fonts**: ship a pixel font subset that **covers Cyrillic** so RU stops falling back to
  `sans-serif`. Pixelify Sans' upstream family lists Cyrillic; verify glyphs and the OFL licence
  before subsetting. Long prose stays `sans-serif`.
- **Minimum sizes**: HUD/button cap height ≥20 runtime px (≈12 CSS px on iPhone landscape), touch
  targets ≥44 pt.
- **Menu** (`mockup-menu.png`): logo, world cards, "Guardaroba" button, heroine on a pedestal at
  integer ×2.
- **Finale**: the restored ballroom as a layered scene; the `CLASSIFICA → SCONTRINO` flow is
  unchanged. The receipt shows Anna in her current look (§3.9).

**Market check:** "Il Valzer Incompiuto" in the mockups is a placeholder. The `p2.brand.*` title
must be unique in the catalogue (req. 5.12) and read well in RU first.

### 3.9 Wardrobe production (scope: wardrobe meta)

**Slots and counts.** 6 slots, aligned with the `02-levels.md` keys, and **5 looks per slot at
launch = 30 looks**:

| Slot (IT label) | Level-free look (`afterLevel`) | Paint layer |
| --- | --- | --- |
| Testa (hairpin / tiara / veil) | `p2_hairpin` (L5) | over hair |
| Corpetto (top / sleeves) | `p2_sleeves` (L4) | over torso and arms |
| Abito (skirt / gown) | `p2_ballgown` (L6) | over legs |
| Scarpe | `p2_boots` (L3) | over feet |
| Gioiello (brooch / necklace) | `p2_brooch` (L2) | chest |
| Mantello / velo (back) | `p2_veil` (L1) | **behind** body |

| Acquisition path per slot | Looks | Total |
| --- | ---: | ---: |
| Default (starting outfit: Anna's puffer jacket, jeans, sneakers; empty accessory slots) | 1 | 6 |
| Level-free (one per completed level) | 1 | 6 |
| Coccoline | 1 | 6 |
| Stars | 1 | 6 |
| IAP bundles (2 themed bundles × 3 looks) | 1 | 6 |
| **Launch total** | **5** | **30** |
| Weekly time-trial exclusives | produced in batches of 4 | +4 / month |

Launch is 30 looks. That is 24 new overlays, since the 6 defaults are the base body.

**Market check:** the path mix (free / Coccoline / stars / IAP) and the IAP share (6 of 30) are
product choices; `00-market.md` rates wardrobe as a Must and IAP as a Should. Adjust counts per
column, not the pipeline.

**Consistency across looks.** Alignment is solved in the build, not by hoping the model draws
the same body twice:

1. **One approved Anna reference sheet** (front, side, back, colour swatches with hex) and **one
   approved base pose grid** (the 32-cell sheet, processed). Both are committed source.
2. **Every look is generated as an edit of the base pose grid image**: "dress this exact character
   in <look>, keep poses, proportions, framing and the magenta background". It is never drawn
   from scratch.
3. **The build extracts the look as a layer**: process the look grid exactly like the base (§4.2),
   register each cell to the base cell by the feet anchor and head bounding box, then take the
   pixels that differ from the processed base **inside the slot's region mask** (e.g. Scarpe =
   rows 43–47, Testa = head box). The result is a transparent overlay on the shared 32×48 grid.
4. **Validator**: overlay pixels outside the slot mask (plus a 2 px margin) fail the build; so
   does any accent outside the look's ≤3 allowed extra colours, and any use of the danger colour.
   The region mask also makes slots combine freely: a gown can't overwrite the torso layer.
5. **Draw order** is fixed: back → body → Abito → Corpetto → Scarpe → Gioiello → Testa. Runtime
   still mirrors the parent frame (`layer.frame = player.frame`), so frame sync holds by
   construction.

`mockup-wardrobe.png` builds its preview with exactly this model: `dressed()` stacks per-slot
overlays on one pose grid.

**Wardrobe/shop UI** (`mockup-wardrobe.png`):

- **Top bar**: Coccoline and star totals. **Left**: slot tabs. **Centre**: Anna in the current
  combination at integer ×3 and the set progress. **Right**: look grid.
- **Every card shows its state and exact acquisition path**: owned, equipped, `LIVELLO N` lock,
  star count, Coccoline price, IAP price, weekly exclusive.
- **IAP prices** are rendered from the Yandex catalog's price string (the mockup's "99 YAN" is a
  placeholder), never a hard-coded literal (req. 1.13.4). Purchases are server-saved (req. 1.13.3);
  the no-SDK path hides IAP cards.
- **Actions**: `INDOSSA` (equip), `COMPRA` (Coccoline), and `PROVA 1 LIVELLO` with the video icon.
  The try-on is an opt-in rewarded ad and only a button (req. 4.5).
- **Also shown**: the level select and the receipt render Anna in her equipped look.

### 3.10 Trick moments and rewarded-offer visuals (scope: boosts + tricks)

**The colour rule that keeps tricks fair:** a trick telegraph uses **echo cyan, pink and
lilac** (playful) and never the danger red. A trick never kills. Danger red stays reserved for
lethal hazards, so a player can tell "surprise" from "death" at a glance, even on the first
visit.

| Trick (`mockup-tricks.png`) | Telegraph (≥0.8 s, before anything happens) | Reveal | Placement |
| --- | --- | --- | --- |
| Fiori a sorpresa | buds sprout on the tiles, cyan sparkles, wobble lines | tiles bloom into a pink bounce cushion | optional ledge only |
| Uscita timida | goal door peeks with eyes, cyan footprints mark the next cell, dashed ring | door hops 1 cell right twice, then stays | bonus exit or telegraphed critical exit; never onto a hazard or over a gap |
| Corona finta | crown is lilac, not gold, blinks and wobbles | confetti, "OPS!" card, +50 Coccoline consolation | optional perch |
| Pavimento eco | cracks, dust drips, 2 px jitter with a cyan ghost for 0.8 s | tiles drop her one cell onto a visible cushion | optional route; the cushion is always on screen before the drop |

Each trick is one generated prop strip (telegraph 4 + reveal 4) plus data in `build.js`. The
visuals add no collision rules beyond what `03-mechanics.md` allows.

**Rewarded offers** (bottom strip of `mockup-tricks.png`) share one card component:

- a video icon on the accept button, and an equal-size decline button ("No grazie" / "Continua");
- they appear only at logical breaks: the pre-boss checkpoint (+1 heart, before the arena), the
  reward screen (×2 Coccoline), level start (start with magnet), and the shop try-on;
- never inside an arena, never automatic.

**Market check:** exact offer copy and whether the decline button is equal in size affect
opt-in rate. Keep equal size for Yandex rules and player trust; test copy, not dark patterns.

---

## 4. Pipeline: ChatGPT images as source, deterministic `tools/gen` as the build

Decided by the human: art is generated with ChatGPT image generation in the browser and
downloaded. **Not tested yet** (see the Status block): the design below is complete, and
Phase 0 proves it on one background layer and Anna idle/run.

### 4.0 Procedural vs ChatGPT vs hybrid — for the human to choose in `review.html`

| | Procedural (code-painted on `px.mjs`, as in the mockups) | ChatGPT-sourced (processed by §4.2) | **Hybrid: ChatGPT backgrounds + procedural sprites/tiles/UI** |
| --- | --- | --- | --- |
| Look | Clean, crisp, readable. Mockups are already a clear upgrade (lighting, palettes, HUD, telegraphs). Background richness is capped by how much painting code we write. | Richest painterly backgrounds and light; sprites risk going mushy after reduction to 32×48. | Rich long backgrounds behind a crisp, readable lane. |
| Consistency | Perfect by construction: shared pose records, palette constants. | Needs reference sheets, normalization, validator; residual drift costs retries. | Drift is confined to backgrounds, where the seam/horizon/palette steps fix it. |
| Animation volume | Full frame budget; 30 looks are overlays on one pose painter. Appeal ceiling of code-drawn characters. | Key poses only; in-betweens procedural (§4.6). | Full procedural frame budget for everything that moves. |
| Determinism | Full, generator only. | Build deterministic; generation isn't (source committed). | Same as ChatGPT, backgrounds only. |
| Effort (1 dev) | ~11–13 weeks | ~13–16 weeks incl. ~500–650 generations | ~12–14 weeks incl. ~250–350 generations (backgrounds + store key art) |
| Risk | Backgrounds less "stunning" than the human wants. | Seams, palette mush, licensing/copyright (§4.7), rate limits, browser access (**blocked today**). | Style mismatch between painterly layers and crisp sprites; mitigated by palette lock, aerial perspective and the lane-contrast gate (§4.5). |
| Evidence today | 6 mockups rendered and reviewed by eye | none (blocked) | procedural half proven; background half none |

**Recommendation: hybrid.** Keep the procedural pipeline for sprites, tiles, UI, telegraphs and
FX: the mockups prove it, it gives the full animation volume, and it stays deterministic. Use
ChatGPT for the long parallax backgrounds and store key art, where the human asked for
"stunning", where frame-to-frame consistency matters least, and where §4.4 can repair the
variance. Generate the ChatGPT Anna reference sheet anyway, as the design reference the
procedural painter follows. Switch characters to ChatGPT-sourced only if the Phase 0 side-by-side
in `review.html` shows processed ChatGPT sprites clearly beating the code painter. The choice
is the human's.

### 4.1 Root causes of the variance, and the fix for each

Re-rolling prompts treats symptoms. Each kind of variance has a structural cause and a
deterministic answer:

| Variance | Cause | Deterministic fix |
| --- | --- | --- |
| Not on a pixel grid; anti-aliasing | The model paints continuous images; "pixel art" is a style, not a grid | Never nearest-sample the raw image. **Area-average** into the target cells, then **palette-quantize** (§4.2) |
| Palette drift between calls | No colour constraint in generation | Quantize to the **locked world hex palette** in OKLab; the palette file is source |
| Proportion / identity drift | Each call re-imagines the character | One approved reference sheet attached to every call; pose grids generated **as edits**; the build normalizes scale by head height and rejects outliers |
| Background seams, horizon and light drift between segments | Outpainting re-renders the overlap | Registration on the overlap band, horizon row lock, minimum-error seam cut (§4.4) |
| Cut-out halos | Soft edges blending into the background | Flat **magenta `#ff00ff`** background, OKLab key + despill, binary alpha for sprites |
| Framing drift | Model centres and scales freely | Pose grids with a drawn baseline; the build finds blobs and anchors on the feet line |

### 4.2 Processing steps (pure functions of source bytes + config)

For every source PNG in `art/src/<world|character>/<name>.png` with `<name>.prompt.txt` and
`<name>.json` (cell size, palette id, layer role):

1. **Decode**: `png-read.mjs` on `node:zlib`, keeping the no-dependency rule of `px.mjs`.
   Downloads must be PNG; a WebP download is converted once at import and the PNG is committed.
2. **Key out** magenta (OKLab distance ≤ threshold) and despill the edge ring toward the
   neighbour colour. Sprites get binary alpha (≥50%); near/foreground layers get binary alpha;
   far and mid layers are opaque.
3. **Crop** to content (sprites: per detected blob, sorted by grid position).
4. **Normalize** (characters): scale so the head height matches the reference ratio; anchor the
   feet on the cell baseline; reject if the silhouette width deviates >12% from the reference
   pose.
5. **Downsample by area average** to the target size: 32×48 per heroine cell, 32×32 tile kit
   cells, native-×1 background strips (height 240/180/120 by layer).
6. **Quantize** in OKLab to the locked palette:
   - sprites/tiles: nearest colour, no dither, then a 3×3 majority clean-up of isolated pixels;
   - backgrounds: 2×2 Bayer ordered dither against the 32-colour extension (keeps soft
     shading; ordered, never error diffusion, so the output is stable).
7. **Finish**: 1 px `#24172e` outline on sprites; aerial-perspective blend on layers; `_flash`
   silhouette frames; look-layer extraction (§3.9).
8. **Stitch and loop** backgrounds (§4.4), then slice into ≤960-native-wide pieces.
9. **Pack and write** `assets/` and a manifest recording every source file's SHA-256 and the
   config hash.
10. **Validate** (§4.5); fail the build on violation.

Run twice, diff zero bytes: a CI check. `assets/` stays 100% generated, and the
"never hand-edit `assets/`" rule stays honest. Raw ChatGPT PNGs plus their prompts are the
source; nobody edits the outputs. A human pixel fix, when unavoidable, is committed as a
`<name>.fix.png` overlay in `art/src/` and applied by the build, so it's reproducible.

### 4.3 Prompts: a fixed style sheet, not free text

Every prompt is `STYLE_SHEET + WORLD_BLOCK + SUBJECT_BLOCK`. Each block is committed text, and
only the subject block varies.

- **STYLE_SHEET** (all art): "cozy fairy-tale 16-bit pixel art look, clean shapes, soft hue-shifted
  shading, light from the upper left, no text, no logos, no UI, no watermark, no signature."
- **WORLD_BLOCK**: the world's hex palette listed as named colours, time of day, light direction,
  horizon at 62% of image height, "orthographic side view for a 2D platformer background".
- **Layer rules**: sky/far on its own ("no foreground objects"); mid and near "isolated
  silhouettes on a flat solid #FF00FF magenta background, nothing touching the image edges
  top/bottom, bottom edge flat".
- **Characters**: "full body, side-by-side grid of N poses, feet on a thin horizontal black
  baseline, equal spacing, flat #FF00FF background, same character as the attached reference
  sheet".
- **Sending rules**: only art prompts go to ChatGPT; never repo code, secrets or private files.
  Attachments are only our own previously generated or processed art.

Each download is saved as `docs/part2/art/gen/<name>.png` with the exact prompt in
`<name>.prompt.txt` while exploring. Approved files move to `art/src/` for production.

### 4.4 Long backgrounds: segments, seams, loops

1. **Segment 1**: STYLE + WORLD + layer prompt, landscape output.
2. **Segment n+1**: upload segment n and ask "extend this scene to the right as a direct
   continuation; keep the horizon height, light direction and palette; the left edge must continue
   the right edge of the attached image". Keep the horizon, light and palette text identical.
3. **Registration**: downsample both segments to working size and search the horizontal offset
   (and ±4 px vertical) that minimizes OKLab difference between segment n's right 25% and
   segment n+1's left side.
4. **Horizon lock**: detect the horizon row per segment (strongest luminance edge across the
   width) and shift into agreement; >2 native px disagreement after shifting fails the segment.
5. **Seam**: cut along a **minimum-error vertical path** through the overlap (image quilting),
   not a straight cross-fade, so there are no ghosted double structures. For opaque layers, apply
   a 4-step dithered transition of ≤8 native px around the path.
6. **Loop**: the last segment is generated as an extension of segment N and cut to segment 1
   with the same seam search; if it fails, one "bridge" segment is generated from both ends.
   Near layers loop by design; mid layers carry enough segments not to repeat within a level.
7. **Lane protection**: in the processed near layer, pixels in the lane band (ground line ±3
   tiles) are pushed −15% OKLCH L and −30% chroma, so the lane keeps its contrast (§4.5).

### 4.5 Validation and readability gate

The build refuses output that:

- has colours outside the locked palette (or the 32-colour extension for far/mid layers);
- has a sprite cell whose size isn't the declared cell, or frame counts that disagree with
  `src/animspec.js`;
- has a look overlay outside its slot mask, or the danger colour outside hazard/telegraph sheets;
- has a horizon mismatch between segments;
- **composite check**: renders each world's mid+near layers under the processed tile kit and Anna
  at 1280×720 and at the iPhone-landscape crop (the 764×430 CSS canvas area), then measures lane
  contrast (tiles' and Anna's OKLCH L vs the background pixels behind them) — it fails below the
  §3.2 threshold.

The composite images double as review artefacts (§9).

### 4.6 Animation: what comes from ChatGPT vs procedural

ChatGPT can't hold frame-to-frame registration across 8 run frames. It generates **key poses**;
the build and runtime make the motion.

| Animation | From ChatGPT (key poses, one grid image each) | Procedural (build or runtime) |
| --- | --- | --- |
| idle 6 | 2 keys (neutral, breath-in) | 1 px upper-body bob, blink by eye-row swap, hair sway by shifting hair-palette pixels |
| run 8 | 4 keys (contact L, pass L, contact R, pass R) | bob between keys; runtime lean via existing squash/stretch |
| jump 2 / fall 2 | 1 rise, 1 fall | apex frame = rise with hair-lift shift; runtime stretch |
| land 2, skid 2, hurt 3 | 1 each | squash, recoil offset, flash frame |
| celebrate 4 | 2 keys | hop offsets |
| Enemies | 2 keys each | bob, flash, squash |
| Bosses | 4–6 keys | echo copies, telegraph rings, flash, bob |
| Vent plume, bridge fade, glows, dust, sparkles | — | fully procedural (already proven in `mockups.mjs`) |
| Looks | edits of the base pose grid | layer extraction (§3.9) |

### 4.7 Licensing and ownership (not legal advice; re-check at production time)

- OpenAI's Terms of Use, as last reviewed for this doc, assign to the user OpenAI's rights in
  generated output, and state that similar output may be produced for other users. The exact
  current wording must be re-read before production.
- In several jurisdictions (e.g. US Copyright Office guidance) purely AI-generated imagery may not
  be copyrightable. Don't assume exclusivity. The human-authored parts — selection, palettes,
  processing, level composition, and any pixel fixes — strengthen authorship.
- Never prompt with protected characters, franchises or a named living artist's style. This
  matches the existing "original concept, not Disney" rule in `config.js`.
- Keep prompts, dates and account type in `*.prompt.txt` as provenance.

**Market check:** confirm whether Yandex Games moderation expects disclosure of AI-generated
assets. The human is already contacting Yandex support about requirement 3.6; ask in the same
ticket.

### 4.8 Throughput and generation estimate

ChatGPT image limits depend on the plan, aren't fixed publicly, and change over time, so the
rates below are **assumptions to measure in Phase 0**, not facts. Plan on bursts followed by
cooldowns, with human review of every image.

| Item | Generations incl. ~2× retries |
| --- | ---: |
| Per world: sky 1, far 2, mid 4, near 4 + 2 variants + loop bridge 1 per layer | ~30–40 |
| Per world: tile kit sheet + decals | ~6–10 |
| Per world: props, collectible, 2–3 enemies, trick props | ~20–30 |
| **Per world total** | **~60–80** |
| Anna reference sheet + 32-cell key-pose grids (4–6 grids) | ~20–30 |
| Sognatrice + Avventuriera (edits of Anna's grids) | ~20–30 |
| 24 look overlays (edits) | ~50–70 |
| Bosses (2) | ~20–30 |
| Store cover / icon / screenshots key art | ~15–25 |
| **Whole game** | **~500–650** |

At an assumed 40–60 accepted generations per working day, that's **~3–4 calendar weeks** of
generation, spread across phases. Backgrounds for Worlds 1 and 2 go first (~150).

### 4.9 What changes in `tools/gen`

| Change | Size |
| --- | --- |
| `png-read.mjs`: minimal PNG decoder on `node:zlib` | S |
| `source.mjs`: key-out, crop, normalize, area-average, OKLab quantize, outline, `_flash` | M |
| `stitch.mjs`: segment registration, horizon lock, min-error seam, loop, lane protection, slicing | M |
| `looks.mjs`: register look grids to the base grid, slot-mask extraction, validation | S |
| `tiles.mjs`: expand the reduced kit into the 35-frame atlas | M |
| `validate.mjs` + composite readability check (1280×720 and iPhone crop) | S |
| `px.mjs`: alpha blend, dithered glow/ring/vignette (prototyped in `mockups.mjs`); per-output scale | S |
| `animspec.js`: 8×4 heroine sheet; new `WORLD_SHEETS` entries | S |
| Runtime follow-ups (implementation PRs): mask tile pick + tint removal in `build.js`, `particles()` emitters, sprite bosses, native-res background strips with lazy per-world loading, HUD/shop panels, font subset | M |

`npm run gen` stays offline and deterministic: it never calls ChatGPT. Generation is a separate,
human-in-the-loop step whose output is committed source.

---

## 5. Mockups

| Mockup | Shows |
| --- | --- |
| `mockup-level1.png` | World 1 palette; marble autotile kit with carved ravine caps; layered depth; baked light; Anna 32×48 with echo trail and dust; `V` warning; `L` on the `#` balcony above `M`; notes; bell checkpoint; HUD panel; chapter ribbon |
| `mockup-boss.png` | Verdigris arena; La Dama 56×76 with cyan telegraph rings and echo copies; 7-slot debris telegraph with the 3-slot safe lane; boss bar with 4 HP pips; no foreground over the fight |
| `mockup-menu.png` | Logo, world cards, 9-slice buttons incl. "Guardaroba", heroine on a pedestal |
| `mockup-wardrobe.png` | 6 slot tabs; layered preview; 8 look cards covering every acquisition state; equip / buy / opt-in try-on |
| `mockup-tricks.png` | Four trick telegraphs in the non-lethal colour language; +1 heart and ×2 Coccoline offer cards with equal decline buttons |
| `mockup-heroine-palettes.png` | Part 1 vs Part 2 heroine size; 6 poses; 6 world palettes; frame budget |
| `compare-level1.png` | Current Level 1 beside the Level 1 mockup |
| `mockup-level1-iphone.png` | Same frame at the real iPhone-landscape scale with DOM overlays: HUD, chapter ribbon and lane reads stay clear of the pause/audio buttons and touch pads |

Iteration log (every pass viewed at full size): pass 1 broke the `A` glyph, overlapped the menu
buttons, left the ballroom roof flat and overflowed text; pass 2 fixed those; pass 3 moved arena
window lights away from danger markers. The wardrobe and trick mockups were added for the
scope change. Orchestrator review fixes: the boss mockup's Anna stood ~130 px above the roof in
an idle-like pose, so she now runs on the ridge in the safe lane with a contact shadow; the
chapter ribbon moved from y 12 to y 44 native, below the HUD row and the DOM buttons on the
iPhone view.

Known limits: code-painted mockups show layout, palettes and rules, not the final background
richness the ChatGPT pipeline targets. Jump/fall poses read close to idle. Nothing is animated.

---

## 6. Performance and package budget

### Measured baseline (Part 1)

- Draw calls **20–26** per frame in play; objects 550–616, **157–220 visible** (Chrome headless,
  desktop and iPhone emulation, L1–L6). No real-device frame times.
- Images: **329 KB** of PNG, **66.7 MB decoded RGBA** if all loaded; backgrounds **58 MB**, all
  loaded at boot by `src/assets.js`.
- Audio: **8.4 MB** WAV.
- Yandex archive cap enforced by `tools/package-yandex.mjs`: 100 MB uncompressed.

### Part 2 budget

| Metric | Part 1 | Part 2 budget | How |
| --- | ---: | ---: | --- |
| Draw calls in play | 20–26 | **≤40** | ≤5 background textures on screen; one tile atlas per world; no per-object shaders; batched particles |
| Visible objects | 157–220 | **≤300** | same culling; autotiling adds 0 objects |
| Live particle quads | ad hoc | **≤60 touch / ≤150 desktop** | `particles()` caps |
| Decoded textures loaded at once | 66.7 MB | **≤20 MB** | per-world lazy loading |
| Decoded textures, whole game | 66.7 MB | **≤60 MB** | native-res strips |
| Image bytes on disk | 0.33 MB | **≤8 MB** | softer backgrounds compress worse than flat silhouettes; indexed PNG where the palette allows |
| Archive total | ~9.3 MB | **≤30 MB** | art stays small; audio is the bigger lever |

Long backgrounds per world at native ×1: sky 640×360 + far 2×960×240 + mid 4×960×240 + near
6×960×180 ≈ 0.23 + 0.46 + 0.92 + 1.04 MP ≈ **2.65 MP ≈ 10.6 MB RGBA**. Only the current world
(plus the menu set) is loaded, so ≤20 MB loaded holds. Strips are drawn at `k.scale(2)`; there
are no colliders on them, so runtime scaling is safe. Sprites stay emitted at runtime size (their
sizes feed player and enemy scales).

On-screen cost stays flat: at any camera x only one or two pieces per layer are visible, so draw
calls rise only by the extra layers. The gated mobile risks are pixel density (§3.1), the
vignette quad and the desktop-only post-effect. The frame cap, culling and greedy meshing stay as
the invariants describe.

---

## 7. Phased task list

Sizes: S ≤1 week, M ≤3 weeks, L >3 weeks (as in `00-market.md`).

| # | Phase | Tasks | Size | Exit check |
| --- | --- | --- | --- | --- |
| 0 | **Browser access + pipeline proof** | Get claude-in-chrome or Kapture access; generate World 1 near layer (2 segments) + Anna reference sheet + idle/run grid; `png-read`, `source`, `stitch` prototypes; `pipeline-demo.png`; composites; `review.html`; real-iPhone density test | M | **Human approves `review.html`**; seam invisible at 1:1; lane contrast passes; `npm run gen` twice → identical bytes |
| 1 | Art bible | Locked palettes + extensions, committed style sheet and world blocks, reference sheets | S | prompts and palettes committed as source |
| 2 | Backgrounds W1, W2 | 5 layers, long segments, loops | M | composite gate green; draw calls ≤40 |
| 3 | Heroines + base grid | 3 heroines × 32 cells from key poses + procedural in-betweens | M | overlay sync test in `features.mjs` green |
| 4 | Wardrobe | 24 look overlays, slot masks, shop UI, receipt/level-select rendering | M | validator green; 30 looks combine without overlap |
| 5 | Tile kits + autotiling | 6 kits, 35-frame atlases, `build.js` mask pick, tint removal | M | `levels.mjs` + `boss.mjs` green; collider counts unchanged |
| 6 | Backgrounds W3–W6 | as Phase 2 | M | as Phase 2 |
| 7 | Objects, enemies, tricks | `L`, `V`, `R`, `~`, `C`, bell, restyled enemies, 4 trick prop strips | M | telegraph frames match config timings; tricks use no danger colour |
| 8 | Bosses | Guardiana (20 frames), Dama (24), telegraph FX | M | `boss.mjs` matrix from `04-boss.md` green |
| 9 | Juice + UI | particles, wipe, HUD, offer cards, menu, Cyrillic pixel font, finale | M | `mobile.mjs` + `i18n.mjs` green |
| 10 | Device + store | Real iPhone/Android pass; archive size; Part 2-only cover, icon, screenshots | S | archive ≤30 MB; store art has no Part 1 assets |

Total: **~13–16 weeks** for one developer including ~3–4 weeks of generation calendar time.
Phase 0 is the hard gate: it decides full ×2 vs fallback (c) and whether the ChatGPT pipeline
meets the bar.

---

## 8. Open questions

- Browser access for ChatGPT generation (blocking Phase 0).
- Pixel density on a physical iPhone (§3.1).
- Cyrillic coverage of the pixel font.
- Wardrobe path mix and IAP share (§3.9, market check).
- Does Yandex moderation require AI-asset disclosure (§4.7)?
- Should the Guardiana share the Dama's silhouette language?

---

## 9. Human review page

`docs/part2/art/review.html`: a static page with no build step and relative image paths, opened
with `ao preview docs/part2/art/review.html`. The ChatGPT column and the ChatGPT-only sections
show labelled "blocked" placeholders until generations exist. Sections:

1. **Three columns per scene**: Part 1 current / procedural code mockup / ChatGPT-sourced
   composite, for Level 1 desktop, Level 1 iPhone landscape, the boss arena and the menu.
2. **Backgrounds**: each raw ChatGPT segment, each processed layer, and the stitched long strip
   per layer in a horizontal-scroll container at 1:1, plus a parallax preview (CSS transforms
   bound to a scroll slider).
3. **Anna**: reference sheet raw vs processed; idle/run/jump grids raw vs processed 32×48 cells
   at ×4; the run cycle animated with CSS `steps()`.
4. **Wardrobe**: base grid, one look raw, extracted overlay, combined preview.
5. **Pipeline demo**: `pipeline-demo.png` (raw → keyed → area-averaged → quantized → outlined).
6. **Prompts**: every `<name>.prompt.txt` shown next to its image.
7. **Mockups**: the code-painted mockups in this doc, labelled as layout targets.
8. **Decision box**: what the human is asked to approve (style direction, palette per world,
   density option, pipeline).

Until the human approves that page, this document stays **pending human approval**.
