# Part 2 — Art direction

Design doc and mockups only. No game code, generator module or `assets/` file changed. Goal from the
brief: Part 2 must look **noticeably better** than Part 1 while keeping the invariants in
`CLAUDE.md`: generated assets only, the mobile render path, culling and greedy-meshed colliders.

Deliverables in `docs/part2/art/`:

| File | What it is |
| --- | --- |
| `current-desktop-{menu,level1..5,boss,finale}.png` | Real screenshots of Part 1, 1280×720, Chrome headless |
| `current-iphone-{menu,level1,level3,boss,finale}.png` | Same, iPhone-landscape emulation (932×430 @3x, touch, iOS UA; profile from `tools/test/mobile.mjs`) |
| `current-desktop-heroine-zoom.png` | 6× nearest-neighbour crop of Anna in Level 1 |
| `mockup-level1.png` | Target look: Level 1, Soglia degli Echi, gameplay frame |
| `mockup-boss.png` | Target look: Level 6 arena, La Dama dell'Eco, debris telegraph |
| `mockup-menu.png` | Target look: menu and world select |
| `mockup-heroine-palettes.png` | Part 1 vs Part 2 heroine resolution, 6 poses, 6 world palettes, frame budget |
| `compare-level1.png` | Part 1 Level 1 next to the Part 2 Level 1 mockup |
| `mockups.mjs` | The script that paints every mockup (`node docs/part2/art/mockups.mjs`) |

The mockups are **painted in code** on `tools/gen/px.mjs`: the same RGBA buffers, deterministic
`rng`, Bayer dither, `outline` and integer `upscale` the real generator uses. That is the point.
Every effect in them (dithered glows, hue-shifted ramps, echo after-images, autotile edge caps,
9-slice panels) can be baked by a deterministic build. They are not in-engine captures: nothing
in them was measured for frame rate. The 5×7 bitmap font is a mockup stand-in (see §3.8).

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
| Backgrounds | 3 layers (sky fixed, mid ×0.5, near ×0.8), one flat tone per silhouette layer | `backgrounds.mjs`, `game.js:798` |
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
   collectibles all share one spin. Movement reads as a sprite sliding between poses.
3. **Tint-multiplied tiles make every world the same shape and a muddy colour.** A multiply
   tint can only darken, and it can't shift hue along the ramp. Level 3 is maroon ground on a
   maroon sky, and the heroine and banners sink into it (`current-desktop-level3.png`). Level 6
   is flat grey gravel (`current-desktop-boss.png`). All six worlds use the same 12 tile shapes.
4. **Weak edge/autotile vocabulary.** There are only L/R caps and 2 top variants: no inner
   corners, no underside, no terrace-to-floor transition. A ravine is a rectangle cut out of
   speckle (`current-desktop-level1.png`, right side).
5. **Flat parallax.** Mid and near layers are single-tone silhouettes. There is no aerial
   perspective, no foreground layer, and the upper 60% of the forest screen is empty sky with
   dots. Depth comes only from scroll speed.
6. **Mixed rendering styles.** Chunky ×4 pixel art sits next to anti-aliased vector
   primitives: the rounded-rect boss with a thick vector outline, circle bubbles and motes, and
   flat CSS-looking pillars in the finale (`current-desktop-finale.png`). This mismatch, more
   than resolution, makes Part 1 look like a prototype.
7. **No lighting.** Lanterns, the moon and the portal emit nothing. Nothing in the palette
   says "light source here".
8. **Hazard readability.** Level 1 brambles and Level 2 urchins are dark lumps with no bright
   warning colour, and they read as decor. Collectibles in Level 6 are low-contrast discs.
9. **HUD is plain stacked text in two fonts.** It uses the pixel font for the name and system
   sans-serif for numbers, plus emoji icons (🍎 💎 🏆) drawn by the OS font, so the HUD looks
   different on every device. There is no panel. Tutorial text is drawn over the heroine and
   enemies (`current-desktop-level1.png`), and the chapter title is printed over the moon and
   over the boss (`current-desktop-boss.png`).
10. **Russian — the primary market — never sees the pixel font.** `uiFont()` switches any
    Cyrillic string to `sans-serif` (`src/i18n/index.js:103`) because the vendored
    `PixelifySans.woff2` (7.5 KB) covers Latin-1 only. The RU build therefore has a generic
    system-font UI over pixel art.
11. **Menu and finale lack structure.** The menu is controls floating over a backdrop. The
    finale is flat lilac with rectangle pillars and a large letter card covering the scene.
12. **Mobile framing.** In emulation the letterbox bars are light blue against dark worlds, the
    touch buttons cover the ground strip, and the iOS "add to home screen" banner covers the
    middle of the play field (`current-iphone-level1.png`, `current-iphone-boss.png`). The
    banner is outside Yandex-specific scope, but the art should not put key reads in the bottom
    fifth of the screen on touch devices.

What already works and should stay: crisp nearest-neighbour rendering, the 1px dark outline on
sprites, dithered sky bands, the cozy palette intent, squash/stretch and hit-stop, and ambient
motion in every world.

---

## 2. Reference bar

Only looks that a small team with a deterministic generator can reach. "Why it looks good" is
the part we copy, not the art.

| Game | Platform | What makes it look good | What we take |
| --- | --- | --- | --- |
| **Celeste** | PC/console, 320×180 native | Same native resolution as Part 1, so resolution is not what separates us. It wins on animation (hair colour as state, many frames), dust and particle juice, strong silhouette contrast between lane and backdrop, and per-chapter palettes. | Frame budgets, landing/dash dust, lane-vs-backdrop value contrast, one signature colour per world. |
| **Shovel Knight** | PC/console, 400×240 | Restricted palette per stage with deliberate hue shifts, thick readable silhouettes, 4–5 parallax layers with a foreground. | Hand-picked per-world ramps instead of a tint, a foreground parallax layer, silhouette-first sprites. |
| **Alwa's Legacy** | PC/console | Cute 16-bit proportions, saturated but soft palettes, large readable heroine face at small size. | Chibi proportions for a 32×48 heroine; big eyes; warm and cool contrast. |
| **Kingdom Two Crowns** | PC/mobile | Mood made almost entirely of lighting: dithered light pools, reflections, time-of-day gradients over simple pixel geometry. | Baked light pools and reflections as the main mood tool (cheap on mobile). |
| **Dead Cells** | PC/console/mobile | Pixel sprites produced by a **build step** from source assets (3D models rendered to pixel sheets), so animation volume is high and consistent. | Proof that "authored source + deterministic build to pixel sheets" scales; it is the model for §4. |
| **Level Devil** | Poki (web), 4.08M votes per `00-market.md` | Almost no art: flat shapes, one accent colour, instantly readable hazards. | Readability beats detail: danger has one colour, used for nothing else. |
| **Путь Пикселя** | Yandex Games, 16,196 votes, quality 69/61 per `00-market.md` | Market evidence only (its art was not audited here): a pixel-art platformer can hold a good Yandex quality score. | Confidence that pixel art is not a handicap on the target platform. |

**Market check:** the reference set assumes pixel art stays the Part 2 style. `00-market.md` shows
one successful pixel platformer on Yandex and a girls' category driven by dress-up art. If the
store team wants a painted/vector look for the cover and icon, keep it to store assets; the
in-game look stays pixel.

---

## 3. Target art direction

### 3.1 The one structural decision: double the art density, keep every runtime size

Part 2 authors art at **640×360 native, integer ×2** instead of 320×180 ×4. Every runtime
dimension stays as it is: `GAME_W/H` 1280×720, `TILE` 64, the 64×96 heroine cell, colliders,
level data, camera, physics. Only the number of art pixels per object doubles in each axis
(4× the pixels). Nothing in `build.js` geometry, `composeMap()` or the mobile invariants changes
because of it. `mockup-heroine-palettes.png` shows the two heroines at the same on-screen size.

Resolution per sprite type (native → runtime):

| Type | Part 1 native | Part 2 native | Runtime (unchanged unless noted) |
| --- | --- | --- | --- |
| Heroine and each wardrobe layer | 16×24 | **32×48** | 64×96 cell |
| Tiles | 16×16 | **32×32** | 64×64 |
| Collectibles, magnet `L`, heart | 12×12 | **24×24** | 48×48 |
| Small enemies (crab, hopper, flyer, swooper) | 16×10 / 12×8 | **32×20 / 24×16** | 64×40 / 48×32 |
| Charger `C` | — | **32×24** | 64×48 |
| Steam vent `V` plume | — | **24×56** | 48×112 = `VENT_WIDTH` × `VENT_HEIGHT` |
| Phase bridge `~`, rune `R` | — | **32×16**, **24×32** | 64×32, 48×64 |
| Guardiana dell'Eco (L3) | primitive | **48×56** | 96×112 art; hitbox stays `BOSS.W/H` config |
| La Dama dell'Eco (L6) | primitive | **56×76** | 112×152 art; hitbox stays config |
| Props / decor | 8–24 | **16–64** | ×2 |
| Sky | 320×180 | **640×360** | 1280×720 |
| Parallax strips | 480 wide | **960 wide** | 1920 (same wrap span as `drawParallax`) |
| UI panels and icons | CSS / emoji | **9-slice pixel sheets, 12–16px icons** | ×2 |

**Risk, and a Phase 0 gate: pixel wobble on iPhone.** The canvas uses `crisp` (`image-rendering:
pixelated`) and `pixelDensity: 1` on touch. In iPhone landscape the backbuffer is ~764×430, so
one Part 2 art pixel (2 runtime px) lands on ~1.19 backbuffer pixels. Nearest sampling will
render some art columns 1 px wide and some 2 px wide, which shimmers while scrolling. Part 1 (~2.4
px per art pixel) mostly hides this. Emulation cannot settle it (see `CLAUDE.md`: emulation ≠
device). Phase 0 prototypes one ×2 level and tests on a real iPhone:

- (a) density 1 as today, accept or reject the wobble by eye;
- (b) raise density on touch only until the backbuffer is ≥1280 px wide (≈1.68 on a 932-pt phone,
  ~2.8× the fill of density 1), and measure frame time;
- (c) fallback if both fail: keep 320×180 ×4 for tiles and backgrounds, and use ×2 only for
  the heroine, bosses and UI, where detail matters most.

Don't weaken culling, greedy meshing or the per-state frame cap to pay for (b).

### 3.2 Palettes per world

Rules: one hand-picked 8–12 colour set per world. Ramps **hue-shift**: shadows move toward blue
or violet, highlights toward warm. No runtime multiply tint for world art (it caused weakness 3).
Three reserved roles are identical in every world:

- **Danger** `#ff5f7e` (rose-red) is used only on hazards, telegraphs and hurt flashes.
- **Echo** `#7ff3ff`/`#8ff0e6` (cyan) marks Part 2's interactive magic: runes, bridges, notes,
  the Dama's tells.
- **Outline** `#24172e` (plum, not black) is shared by every sprite, so layered wardrobe art reads
  as one figure.

The gameplay lane must beat the backdrop on value: lane tiles' mid tone at least 25% lighter or
darker (OKLCH L) than the backdrop behind them. The generator can assert this.

| World | Mood | Core colours (dark → light) | Accents |
| --- | --- | --- | --- |
| 1 Soglia degli Echi | Moonlit mirror antechamber | `#140f2a` `#3a2f66` `#6564a0` `#bdb2d8` `#f4eefb` | gold `#e0a93f`, echo `#8ff0e6`, rose `#ff8fa3` |
| 2 Chiome delle Campanelle | Morning bellflower canopy | `#1f4a4f` `#3f8f6b` `#6cc08a` `#7ec8e3` `#d8f1e4` | bark `#7a4e3a`, bell lilac `#b9a4f0`, gold `#f2c14e` |
| 3 Archivio Sospeso | Lamplit shelves in a dusk void | `#1e1b2e` `#3b2f4f` `#5a3829` `#8a5a3c` `#b67a4d` | paper `#f1e3c2`, lamp `#ffcf6b`, echo-ink `#9fb7ff` |
| 4 Fucina dell'Alba | Iron forge at sunrise | `#2a1f3d` `#2e2a38` `#4a4458` `#6e6680` `#f0e6dc` | brass `#d49a3a`, ember `#ff6a3d`, spark `#ffc24b` |
| 5 Mare delle Stelle | Star-filled shallow sea | `#0b1030` `#1c3c78` `#2e5fa8` `#6a7fb0` `#fff3c4` | moss `#5ec4b0`, glow `#8ef6ff`, pink `#f58fc0` |
| 6 Tetto del Primo Ballo | Night roof, verdigris copper | `#140f2b` `#3a2a5e` `#28575a` `#5fae9c` `#8fd6c2` | gold `#e8b84a`, window `#ffc76e`, echo `#7ff3ff` |

Letterbox bars and the `#fade` overlay take the active world's darkest colour through a CSS
variable, instead of today's light blue (weakness 12).

**Market check:** Yandex catalogue thumbnails are small and busy. Worlds 1, 5 and 6 are all night
scenes. Store screenshots and the cover should lead with World 2 (bright) and World 6 (boss),
and must not reuse Part 1 art (requirement 3.6 in `00-market.md`).

### 3.3 Animation frame budgets

Heroine sheet grows from 8×3 to **8×4 (32 cells)**, still 64×96 cells. `SHEET`/`ANIMS` in
`src/animspec.js` stay the single contract, and wardrobe layers keep the same grid and pose
records so overlay sync still holds by construction.

| Heroine anim | Part 1 | Part 2 | Notes |
| --- | ---: | ---: | --- |
| idle | 4 | 6 | breath, blink, hair settle |
| run | 6 | 8 | contact / down / pass / up ×2, with lean |
| jump | 1 | 2 | take-off stretch, rise |
| apex→fall | 1 | 2 | apex float, fall with hair and skirt lift |
| land | 1 | 2 | squash, recover |
| hurt | 1 | 3 | hit flash, recoil, "ops" face |
| skid | 1 | 2 | |
| celebrate | 4 | 4 | reused by reward, finale |
| wardrobe layers | per frame | per frame | same 32 cells each |

| Other sprite | Frames |
| --- | --- |
| Collectible (echo note, per-world variant) | 8-frame spin |
| Crab / hopper / flyer / swooper / roller (restyled) | 6 per loop + generated 1-frame white flash |
| Charger `C` | idle 4, notice/telegraph 2, charge 4, recover 2 |
| Steam vent `V` | dormant 1, warning 3, active 4 (loop) |
| Rune `R` / phase bridge `~` | rune idle 4, lit 4; bridge fade-in 4 (fits `PHASE_BRIDGE_FADE` 0.18 s), shimmer 4, fade-out 4 |
| Magnet `L` | spin 6; aura ring 4 while active |
| Checkpoint bell `F` | idle 1, ring 6 |
| Guardiana dell'Eco | hover 4, telegraph 3, attack 3, window 4, hurt 2, freed 4 = **20** |
| La Dama dell'Eco | hover 6, telegraph 4, cast 4, window 4, hurt 2, reconcile 4 = **24** |
| Dust / sparkle / landing ring | 4–5 frame strips |

The boss sheets drive the existing timer phases (`hover → telegraph → recover → descend → window
→ ascend`). Art never adds a phase or changes a duration (`04-boss.md`).

### 3.4 Parallax layers per world

Five layers maximum. Each is one texture, so each costs about one draw call. The generator bakes
**aerial perspective**: every layer is blended toward the sky colour by depth (far 60%, mid 35%,
near 10%). That single rule gives the mockups most of their depth.

| Layer | Factor | Rule |
| --- | --- | --- |
| Sky | fixed | 640×360 dithered gradient + world light (moon, sun, lamps) |
| Far | 0.2 | silhouettes, strongest haze |
| Mid | 0.5 | detailed set dressing with baked light pools |
| Near | 0.8 | dark framing shapes near the lane |
| Foreground | 1.15 | **sparse**, only in the top ~120 runtime px or below the ground line; never over the lane |

| World | Far | Mid | Near | Foreground |
| --- | --- | --- | --- | --- |
| 1 Soglia | colonnade with arched night windows | gilded echo mirrors showing Part 1 worlds, fluted pillars, light shafts | pillar bases, balustrades | drapes, chandelier |
| 2 Chiome | misty canopy domes | bellflower trunks with hanging bells | leaf clusters | overhanging vines |
| 3 Archivio | endless dim shelf stacks | floating shelves with lamp pools, drifting pages | ladder silhouettes | page flurry (particles, not a layer) |
| 4 Fucina | dawn sky through chimneys | furnaces with ember glow, gears | chains, anvils | hanging chains |
| 5 Mare | star sky + horizon | floating islands, reflections in the water band | reef rocks | none (keep the glide line clear) |
| 6 Tetto | castle spires with warm windows | ballroom roof, rose window, dormers | chimneys | none in the arena (boss reads need the sky) |

`mockup-boss.png` shows why the arena gets no foreground layer: telegraph markers and falling
shards must be the brightest things near the floor. The dormer windows were moved up in the
mockup for that reason.

### 3.5 Tile sets and autotiling

Per world, one **authored tile kit** at 32×32 native (base block, top lip, edge column, corner,
underside, 2–3 surface decals). The generator expands it into the full atlas, so authoring stays
small and the variants stay consistent:

| Frames | Count |
| --- | ---: |
| 4-bit exposure mask (top/right/bottom/left open) | 16 |
| Inner-corner overlays | 4 |
| Top variants / fill variants | 3 / 3 |
| Semisolid left / mid / right, plus world rail style | 3 |
| Hazards (static spike, ceiling) | 2 |
| Surface decals (grass, snow, gilding, moss…) | 4 |
| **Total** | **35** |

At 64 px runtime that is an 8×5 atlas, 512×320 per world (0.62 MB RGBA).

- **Selection stays in `build.js` at build time.** `buildLevel()` already walks the map. It
  computes each `=` cell's neighbour mask once and picks the frame. The cells stay collider-free
  `"scenery"`, and `buildSolidColliders` greedy-meshes exactly as today. Autotiling touches
  visuals only (see the invariant "never re-add `area()`/`body()` to `=` tiles").
- The runtime `k.color(theme.solid)` tint on tiles is removed. Per-world colours come baked into
  each world's atlas, so `theme.solid`/`solidTop` become generator inputs, not runtime tints.
- `mockup-level1.png` shows the kit in marble: top lip, cornice shadow, brick courses, carved end
  caps at the ravine, a darker contact band where the terrace meets the floor.

### 3.6 Lighting and particles

| Effect | Approach | Mobile cost | Verdict |
| --- | --- | --- | --- |
| Light pools (lamps, windows, moon, portal) | **Baked** into mid layers; for live objects a pre-rendered dithered-alpha glow sprite as a child | 0 extra draw calls in layers; 1 quad per lit object | **Yes** |
| Aerial perspective, fog bands | Baked per layer | 0 | **Yes** |
| Additive glow | Not available: Kaplay 3001.0.19 blends premultiplied `ONE, ONE_MINUS_SRC_ALPHA` globally and exposes no blend-mode option. Dithered alpha glows read well (mockups). | — | Use baked alpha |
| Per-object `shader()` (hit flash, palette swap) | Breaks sprite batching for each object | +1 draw call per shaded object | **No.** The generator emits 1-frame white-silhouette `_flash` frames instead |
| Full-screen `usePostEffect` (bloom, CRT, colour grade) | Extra framebuffer pass at full resolution | Full-screen fill every frame | **Desktop-only option, off by default**; nothing in the look depends on it |
| Vignette | One fixed 640×360 dithered sprite (baked per world) | 1 full-screen alpha quad | Yes; measure on device, drop on touch if it costs frames |
| Echo after-images (heroine trail, boss copies) | 2 extra sprites of the same frame at 0.08–0.25 opacity, cyan tint | 2 quads, same texture, same batch | Yes, and it's the Part 2 signature |
| Ambient motes, pages, embers, stars | Kaplay `particles()` component: one object per emitter with pooled quads, instead of one `k.circle` object with its own `onUpdate` per mote | Fewer objects and updates than today's `drawMotes`/`drawSnowflakes` | **Yes.** Also removes weakness 6, since particles become pixel sprites |
| Reflections (World 5 water, World 1 marble) | Flipped copy of the heroine sprite at 0.2 opacity, clipped to a band | 1 quad | Yes, World 5 first |

Particle caps: **≤60 live quads on touch, ≤150 on desktop**, across all emitters (today's
`coarsePointer` halving pattern continues).

### 3.7 Juice

Existing and kept: squash/stretch (`player.js`), `hitStop`, `screenShake`, `dustPuff`,
`confettiBurst`, the CSS `fadeToScene`. Part 2 changes:

| Beat | Treatment | Budget |
| --- | --- | --- |
| Run | dust sprite every 2nd contact frame | 1 short strip |
| Take-off / land | stretch 0.85×1.2 / squash 1.15×0.85 (current values fit), 5-frame dust ring on land | — |
| Stomp | hit-stop 70 ms, shake 2 px, enemy flash frame, 4-quad burst | existing helpers |
| Boss hit | hit-stop 90 ms, shake 4 px, boss `_flash` frame, echo copies scatter | shake ≤4 px on touch |
| Pickup | 8-frame note spin, 6-quad sparkle burst, HUD counter pops 1.3× for 0.12 s | replaces rect confetti |
| Checkpoint | bell ring strip + one expanding pixel ring | 1 sprite |
| Telegraphs | danger-colour pulse at a fixed rate (vent warning, charger notice, debris markers, Dama rings) | same timing as config telegraphs |
| Scene transition | keep the DOM `#fade`, but use a **dithered diamond wipe**: a CSS mask stepping through a 4-step Bayer pattern over the same 350 ms, in the world's dark colour | DOM only, off Kaplay's tree |
| Chapter title | ribbon banner at top centre (`mockup-level1.png`), slides in and fades; never over the lane or boss | replaces full-width title text |

`prefers-reduced-motion` disables screen shake and the echo trail, and shortens the wipe.

### 3.8 UI and HUD restyle

- **One visual system**: 9-slice pixel panels (Kaplay `loadSprite` supports `slice9`), plum
  outline, lilac bevel, generated from one panel sheet per state (normal, selected, disabled).
  The same PNG is used as CSS `border-image` in DOM overlays (pause, leaderboard, receipt,
  settings), so canvas and DOM finally match.
- **Generated pixel icons replace emoji** in the HUD (note, heart, star, clock, per-world
  collectible). This also removes the "pixel font has no emoji" trap for HUD code, though the
  `font: "sans-serif"` rule stays for any remaining emoji text.
- **HUD** stays in the left column (invariant: top-right belongs to the DOM audio button). It is
  one panel: collectible count, heart pips (up to 5 pips, then `×N` up to `LIVES.MAX` 9), stars,
  timer. The boss bar goes top centre with name and HP pips (`mockup-boss.png`).
- **Fonts**: ship a pixel font subset that **covers Cyrillic** (and Latin-1 for IT) so the RU
  build stops falling back to `sans-serif` (weakness 10). Pixelify Sans' upstream family lists
  Cyrillic support; check the glyph set and OFL licence before subsetting. `uiFont()` keeps its
  fallback for any missing glyph. Long prose (finale letter, character descriptions) stays
  `sans-serif` per the invariant. The 5×7 bitmap font in the mockups is only there because the
  mockup script can't rasterise woff2; don't ship it.
- **Minimum sizes**: HUD and button text cap height ≥20 runtime px (≈12 CSS px at the iPhone
  0.597 scale), touch targets ≥44 CSS pt. Tutorial hints go in a panel above the HUD line or near
  the object, never over the heroine.
- **Menu** (`mockup-menu.png`): logo with gold ramp and outline; a "Il tuo viaggio" panel with
  six world cards (thumbnail, number, stars, lock); primary/secondary 9-slice buttons; the
  heroine on a lit pedestal at integer ×2 of her gameplay sprite (no 1.9× scaling). The share
  pill and audio button keep their DOM slots and behaviour.
- **Finale**: the restored ballroom as a real 5-layer scene with the four guests, the letter in
  a 9-slice parchment panel that leaves the dance visible; the `CLASSIFICA → SCONTRINO` flow
  stays untouched.

**Market check:** the mockup logo "Il Valzer Incompiuto" is a placeholder from the story title.
The real `p2.brand.*` name must be unique in the catalogue (req. 5.12) and read well in RU first.

**Market check:** `00-market.md` rates a wardrobe meta as a Must. The menu mockup shows a
"Guardaroba" button, and the 32×48 layered heroine is what makes looks worth collecting. Slot
count and look count per slot are product decisions; the art pipeline in §4 is sized for ~6
slots × 3 looks.

**Market check:** Anna's Part 2 default look keeps the "carta da zucchero" puffer jacket for
continuity with the gift. The audience is 58% women, 80% over 25; if research prefers a more
elegant default for store art, swap the store pose, not the in-game identity.

---

## 4. Pipeline decision

### Options

| | A. Upgrade procedural `npm run gen` only | B. AI / hand-authored sheets committed as the shipped assets | **C. Hybrid: authored source + deterministic build (recommended)** |
| --- | --- | --- | --- |
| How | Keep painting everything in JS with pose records | Commit finished PNGs into `assets/` | Commit small **source** PNGs (native-res, indexed to the world palette) in `art/src/`; `npm run gen` validates, expands and packs them into `assets/` |
| Characters at 32×48 × 32 frames × 3 heroines + wardrobe | Thousands of lines of coordinates; appeal ceiling is roughly today's look | Good | Good |
| Tiles, skies, parallax, glows, icons, panels | Strong (already works) | Hand work per world | Procedural, as today |
| Determinism | Full | None (breaks the "never hand-edit `assets/`" rule) | Full: same source → same bytes |
| Consistency (palette, grid, outline, frame counts) | By construction | Manual, drifts | Enforced by the build validator |
| Risk | Characters and bosses stay "programmer art" | Mixels, off-palette pixels, AI licensing ambiguity | Needs a PNG decoder and validator (small) |

### Recommendation: C

Split by what each method is good at:

- **Procedural (stays in `tools/gen`)**: skies, parallax layers with aerial perspective and baked
  light, tile atlas expansion from each world's kit (16-mask + corners + variants), glows,
  vignette, particle sprites, `_flash` silhouettes, 9-slice panels, icons, app icons, audio.
- **Authored source (new `art/src/`)**: heroine bodies and wardrobe layers, enemies, the two
  bosses, key props and the per-world tile kit. Editable in Aseprite, LibreSprite or Piskel.
  AI image tools may produce **reference drafts only**. What gets committed is a pixel-clean
  source that passes the validator. An AI output pasted straight in will fail on palette and
  grid, and that failure is intended.

Keeping the rule honest:

1. `assets/` remains 100% generated. Nobody edits it; `npm run gen` rebuilds it from
   `tools/gen` + `art/src`.
2. `art/src/` is *meant* to be hand-edited. It sits outside `assets/`, and each world's
   `palette.json` sits next to its sprites.
3. The build fails when a source PNG has a colour outside its palette, a size that isn't an exact
   multiple of the declared cell, a frame count that disagrees with `src/animspec.js`, a
   wardrobe layer whose opaque pixels fall outside the body's silhouette mask plus margin, or
   pixels in the reserved danger colour outside hazard sheets.
4. Same input → same bytes, checked by running `npm run gen` twice and diffing (a CI check).

### What changes in `tools/gen`

| Change | Size |
| --- | --- |
| `png-read.mjs`: minimal PNG decoder on `node:zlib` (8-bit RGBA/indexed, no interlace), keeping the no-dependency rule of `px.mjs` | S |
| `source.mjs`: load `art/src/**`, validate (palette, grid, frame count, layer mask), emit sheets + `_flash` frames + outline pass | S |
| `px.mjs`: add alpha `blend`, dithered `glow`, `ring`, `vgrad` with stops, `vignette` (all prototyped in `mockups.mjs`); `SCALE` becomes per-output (2 for Part 2) | S |
| `world.mjs` → `tiles.mjs`: expand a 32px kit into the 35-frame atlas per world | M |
| `backgrounds.mjs`: 5 layers, aerial perspective, baked light pools, per-world vignette; optionally emit native-res (×1) PNGs for runtime scaling (§6) | M |
| `ui.mjs`: 9-slice panel sheets, HUD icons, CSS `border-image` export | S |
| `animspec.js`: 8×4 heroine sheet, new `WORLD_SHEETS` entries (charger, vent, rune, bridge, magnet, bell, bosses) | S |
| Runtime follow-ups outside `tools/gen` (for the implementation PRs): mask-based tile pick and tint removal in `build.js`, `particles()` emitters in `game.js`, sprite bosses in `makeBoss`, HUD panel, font subset | M |

Effort (one developer, sizes per `00-market.md`: S ≤1 week, M ≤3 weeks, L >3 weeks). C totals
~11–13 weeks with the art itself (§7). A alone would be ~9–10 weeks and cap characters and
bosses at roughly today's appeal. B looks fast but fails the determinism rule and costs rework
the first time a palette changes.

---

## 5. Mockups

| Mockup | Shows |
| --- | --- |
| `mockup-level1.png` | World 1 palette; marble autotile kit with carved ravine caps; 5-layer depth (window colonnade, echo mirrors with Part 1 worlds, pillars, drapes/chandelier foreground); baked moon and candle light; Anna at 32×48 mid-run with echo after-images and dust; `V` vent in warning phase with danger glint; `L` magnet on the gilded `#` balcony above the `M` spring; the three-note magnet lesson; echo moth; bell checkpoint; HUD panel with pixel icons; chapter ribbon; DOM button slots |
| `mockup-boss.png` | World 6 arena on verdigris shingles with gold ridge; La Dama dell'Eco at 56×76 with gold echo-mask, cyan telegraph rings and two echo copies; the 7-slot debris telegraph with the contiguous 3-slot safe lane clear; falling star shards; observatory goal door; boss bar with 4 HP pips; no foreground layer over the fight |
| `mockup-menu.png` | Logo treatment, world-select cards (thumbnail, stars, locks, selected state), 9-slice buttons including "Guardaroba", heroine on a lit pedestal at integer ×2, balcony foreground |
| `mockup-heroine-palettes.png` | Part 1 16×24 vs Part 2 32×48 at identical on-screen size; idle/run/run/jump/fall/land poses from one pose-record painter; all six world palettes with thumbnails; frame budget |
| `compare-level1.png` | Current Level 1 screenshot beside the Level 1 mockup |

Iteration log (each pass viewed at full size): pass 1 had a broken `A` glyph, menu buttons
overlapping the world panel, a flat single-tone ballroom roof and overflowing text. Pass 2 fixed
those and added lean to the run pose. Pass 3 moved the arena dormer lights away from the danger
markers, which competed for attention with the telegraph.

Known mockup limits: the jump/fall poses still read close to idle (the real sheet needs a
side-leaning run and a clearer tuck); mockups are static, so the frame budgets are not
demonstrated in motion.

---

## 6. Performance and package budget

### Measured baseline (Part 1)

- Draw calls **20–26** per frame in play; objects 550–616, of which **157–220 visible** after
  culling (Chrome headless, desktop and iPhone-landscape emulation, levels 1–6). Emulation, not
  device; the real iPhone frame time is unmeasured here.
- Images: **329 KB** of PNG on disk, **66.7 MB decoded RGBA** if all are uploaded. Backgrounds:
  18 files, 260 KB on disk, **58 MB decoded**, all loaded at boot by `src/assets.js`.
- Audio: **8.4 MB** of WAV, 96% of the asset bytes.
- Yandex archive cap enforced by `tools/package-yandex.mjs`: 100 MB uncompressed.

### Part 2 budget

| Metric | Part 1 measured | Part 2 budget | How it holds |
| --- | ---: | ---: | --- |
| Draw calls in play | 20–26 | **≤40** | 5 bg layers ≈5; one tile atlas per world; sprites packed in Kaplay's atlas pages; no per-object shaders; particles batched by emitter |
| Visible objects | 157–220 | **≤300** | same culling; autotiling adds 0 objects (one sprite per `=` cell as today); decals only on exposed tops |
| Live particle quads | ad hoc (8–40 mote objects) | **≤60 touch / ≤150 desktop** | `particles()` emitters with caps |
| Decoded texture memory, whole game | 66.7 MB | **≤40 MB** | see below |
| Decoded texture memory, loaded at once | 66.7 MB | **≤16 MB** | load only the current world's backgrounds and atlas |
| Image bytes on disk | 0.33 MB | **≤3 MB** | pixel art compresses well; indexed PNG where possible |
| Archive total | ~9.3 MB | **≤25 MB** | art stays small; audio is the real lever (out of art scope) |

How the texture budget is met despite 4× detail:

1. **Backgrounds ship at native resolution and scale at runtime.** Today a 1920×480 near layer
   is a 1920×480 texture of 4×4 blocks. Part 2 keeps 960×240 native files and draws them with
   `k.scale(2)` under `crisp`. `drawParallax` already rounds to whole pixels. Five layers per
   world at native size ≈0.75 MP ≈ **3 MB RGBA** per world, versus 9.7 MB per world today. No
   colliders involved, so this is safe.
2. **Per-world lazy loading** of backgrounds and tile atlases on scene entry (only the menu set
   and the current world live in memory), instead of loading all 18 layers at boot.
3. **Sprites stay emitted at runtime size** (64×96 cells etc.), because player/enemy sizes and
   scales derive from them. The heroine's 3 bodies + wardrobe sheets at 512×384 are ~0.8 MB each
   decoded; all characters, enemies, bosses and props fit in ~16 MB.

Frame budget on mobile: the upgrade adds texture detail, not per-frame work. Draw calls rise by
roughly the extra parallax layers; object counts stay flat (autotiling picks frames, it doesn't
add objects); particles get cheaper (emitters instead of per-mote objects). The costs that could
break mobile are listed and gated: the pixel-density question in §3.1, the vignette quad, and the
optional post-effect (desktop only). The frame cap, culling and greedy meshing stay exactly as
the invariants describe.

---

## 7. Phased task list

Sizes: S ≤1 week, M ≤3 weeks, L >3 weeks.

| # | Phase | Tasks | Size | Exit check |
| --- | --- | --- | --- | --- |
| 0 | **Density prototype + pipeline** | PNG decoder, source validator, `px.mjs` blend/glow helpers; one Level 1 slice at ×2 (tile kit, heroine idle/run, 5 layers); native-res backgrounds with runtime scale; lazy world loading | M | Real iPhone: wobble acceptable under option (a) or (b) from §3.1; frame time equal to Part 1 L1; `npm run gen` twice → identical bytes |
| 1 | Art bible | Final 6 palettes with lane-contrast check, outline/danger/echo roles, pose sheet template, 9-slice template | S | `mockup-heroine-palettes.png` replaced by generated sheets |
| 2 | Heroines + wardrobe | 3 heroines × 32 cells; wardrobe layers on the same grid (count per market decision) | M | overlay sync test in `features.mjs` passes; flash frames generated |
| 3 | Tile kits + autotiling | 6 kits, 35-frame atlases, mask pick in `build.js`, tint removal | M | `levels.mjs` + `boss.mjs` green; collider counts unchanged per level |
| 4 | Backgrounds | 5 layers × 6 worlds with aerial perspective and baked light; letterbox colour var | M | draw calls ≤40 in each level sample |
| 5 | Objects + enemies | `L`, `V`, `R`, `~`, `C`, bell, restyled reused enemies, per-world collectible | M | telegraph frames match config timings |
| 6 | Bosses | Guardiana (20 frames), Dama (24), telegraph rings, debris markers, shards, reward note/key | M | `boss.mjs` matrix from `04-boss.md` green; screenshots reviewed by eye |
| 7 | Juice + particles | `particles()` emitters replacing mote objects, dust/land/pickup strips, shake/hit-stop tuning, dithered wipe, reduced-motion | S | particle caps respected; `mobile.mjs` green |
| 8 | UI | HUD panel + icons, boss bar, Cyrillic pixel font subset, menu world cards, DOM `border-image` panels, finale scene | M | `i18n.mjs` IT/EN/RU passes with the pixel font on RU strings |
| 9 | Device + store pass | Real iPhone and Android run of all levels; archive size check; cover, icon, screenshots from Part 2 worlds only | S | archive ≤25 MB; no Part 1 art in store assets |

Total: **~11–13 weeks** for one developer. Phases 2, 3, 4 and 5 can run in parallel once Phase 0
passes; Phase 0 is the only hard gate, because its outcome decides between full ×2 and the
fallback (c).

## Open questions

- Pixel density on iPhone (§3.1). It needs a physical device, not emulation.
- Does the upstream Pixelify Sans Cyrillic set match the vendored subset's metrics, or is a
  different OFL pixel font needed for RU?
- Wardrobe scope (slots × looks) sets the size of Phase 2; it's a market/product decision.
- Should the Guardiana dell'Eco share the Dama's silhouette language (a lesser echo), or look
  distinct? The mockups assume shared mask and gown motifs.
