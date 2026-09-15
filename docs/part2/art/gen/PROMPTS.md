# AI image prompt list — World 1 backgrounds + Anna (generation order)

**Tested on 2026-09-15 with `google/gemini-3.1-flash-image` via the OpenRouter API** (no
browser login; the ChatGPT browser route was not available). The generated files and their exact
prompts live next to this file. Every `<name>.prompt.txt` ends with the model, date, returned
size, cost and terms URL. Twelve generations cost $0.814 in total: B00–B02, B04–B05, B09–B10,
A01–A03, plus the outpaint continuation below. Design: `docs/part2/06-art.md` §4.

## Rules for every generation

- Send **only** these art prompts. Never paste repo code, secrets, file contents or paths.
  The only attachments allowed are images produced earlier in this list.
- **One API request per image**, stateless: the prompt text is always the fully expanded blocks,
  never "same as before". Attachments are passed inline. Regenerate only when the acceptance check
  fails, and record why in the prompt file.
- **Save the returned PNG** as `docs/part2/art/gen/<file>` and the **exact** text sent as
  `<file without .png>.prompt.txt`. The footer records model, provider, date, returned size, cost,
  attempt number and terms URLs.
- **Requested size**: ask for the wide landscape format for backgrounds and the square format for
  character sheets. In this run Gemini 3.1 Flash Image returned 1376×768 (16:9), 1584×672 (21:9) and 1024×1024 (1:1). Always record
  the real size; the processing reads it from the file.
- **Background colour for every cut-out**: flat solid magenta `#FF00FF`, with no gradient, floor
  shadow or texture. Only the sky is opaque.
- If a download is WebP or JPEG, convert it to PNG once (lossless) and commit the PNG.

## Common acceptance checklist (applies to every image)

- [ ] No text, letters, numbers, logos, UI, watermark or signature anywhere.
- [ ] Cut-outs: all four corners and the empty areas read as pure `#FF00FF` (±8 per channel),
      with no pink glow or soft shadow on the background.
- [ ] Nothing touches the image edge unless the prompt says "full bleed".
- [ ] Light comes from the upper left; shadows fall to the lower right.
- [ ] Colours stay in the listed palette family: no neon green, no pure black, no photo realism.
- [ ] No trademarked or recognisable franchise characters or logos.
- [ ] Still reads as a cozy fairy-tale pixel look when viewed at 25% zoom.

---

## Blocks reused verbatim

### STYLE — style sheet (all art)

```text
Cozy fairy-tale 16-bit pixel art look for a 2D side-scrolling platformer. Clean readable shapes,
soft hue-shifted shading (shadows lean violet-blue, highlights lean warm), light from the upper
left. Orthographic side view, no perspective tilt, no camera blur, no depth of field. No text,
no letters, no numbers, no logos, no user interface, no watermark, no signature.
```

### W1 — world block: Soglia degli Echi

```text
World: "Threshold of Echoes", the moonlit mirrored antechamber of a fairy-tale palace at night.
Palette, use only these colour families: deep indigo #140f2a, violet #3a2f66, periwinkle #6564a0,
lilac marble #bdb2d8, moon white #f4eefb, warm gold #e0a93f, echo cyan #8ff0e6, soft rose #ff8fa3.
The moon shines through tall arched windows from the upper left. Keep the horizon (the floor line
of the distant architecture) at 62% of the image height, measured from the top.
```

### CUT — cut-out instruction (all non-sky layers and characters)

```text
Draw everything on a completely flat, solid #FF00FF magenta background: one uniform colour, no
gradient, no texture, no floor, no cast shadow on the background, no glow bleeding into it.
```

---

## World 1 backgrounds

Processing targets: native ×1 strips, drawn at ×2 in game. Parallax factors: sky fixed, far 0.2,
mid 0.5, near 0.8, foreground sprites. Lengths come from §3.4 (level ≤140 cells × 64 px).

| # | File | Size asked | Background | Attach | Processed target |
| --- | --- | --- | --- | --- | --- |
| B00 | `w1-keyart.png` | landscape | full bleed | — | reference only (not shipped) |
| B01 | `w1-sky.png` | landscape | full bleed (opaque) | B00 | 640×360 |
| B02 | `w1-far-seg1.png` | landscape | `#FF00FF` | B00 | 960×240 |
| B03 | `w1-far-seg2.png` | landscape | `#FF00FF` | B02 | 960×240, loops to B02 |
| B04 | `w1-mid-seg1.png` | landscape | `#FF00FF` | B00 | 960×240 |
| B05 | `w1-mid-seg2.png` | landscape | `#FF00FF` | B04 | 960×240 |
| B06 | `w1-mid-seg3.png` | landscape | `#FF00FF` | B05 | 960×240 |
| B07 | `w1-mid-seg4.png` | landscape | `#FF00FF` | B06 | 960×240 |
| B08 | `w1-mid-loop.png` | landscape | `#FF00FF` | B07 + B04 | bridge seg4 → seg1 |
| B09 | `w1-near-seg1.png` | landscape | `#FF00FF` | B00 | 960×180 |
| B10 | `w1-near-seg2.png` | landscape | `#FF00FF` | B09 | 960×180 |
| B11 | `w1-near-seg3.png` | landscape | `#FF00FF` | B10 | 960×180 |
| B12 | `w1-near-seg4.png` | landscape | `#FF00FF` | B11 | 960×180 |
| B13 | `w1-near-loop.png` | landscape | `#FF00FF` | B12 + B09 | bridge seg4 → seg1 |
| B14 | `w1-fg-props.png` | landscape | `#FF00FF` | B00 | sprite sheet (drapes, chandelier) |

### B00 `w1-keyart.png` — world reference (not shipped)

```text
[STYLE]
[W1]
A single full wide establishing view of the whole antechamber as a 2D platformer background
reference: starry night sky and a large moon seen through a colonnade of tall arched windows in
the distance; in the middle distance tall gilded mirrors between fluted lilac marble pillars, the
mirrors showing faint cyan reflections of other places (a pine forest, eastern rooftops, a
castle); nearer, dark pillar bases and a low balustrade; soft light shafts from the windows.
Full bleed image. Leave the bottom 20% as a calm, simple marble floor band with no objects.
```

Accept if: [ ] common checklist · [ ] horizon at ~62% · [ ] mirrors, pillars and windows are
clearly distinct depth planes · [ ] the palette matches W1 · [ ] you'd be happy for every later
layer to look like this.

### B01 `w1-sky.png` — sky (opaque)

```text
[STYLE]
[W1]
Sky layer only for the same scene as the attached image: deep indigo night sky fading to violet
near the bottom, sparse small stars, a large soft moon in the upper left third with a gentle halo.
No architecture, no windows, no pillars, no ground. Full bleed.
```

Accept if: [ ] common checklist · [ ] no buildings or objects at all · [ ] the moon sits in the
upper-left third · [ ] the gradient has no banding stripes wider than ~5% of the height.

### B02 `w1-far-seg1.png` — far layer, segment 1

```text
[STYLE]
[W1]
[CUT]
Far background layer only, matching the attached reference: a long distant colonnade wall with
tall arched night windows showing stars, violet-indigo stone, very low contrast (distant, hazy).
Keep all artwork inside a horizontal band from 35% to 70% of the image height. The band's bottom
edge is a straight horizontal line at 62%, exactly on the horizon. The artwork must run edge to
edge horizontally (touching the left and right image edges) so it can continue sideways. Nothing
above 35% or below 70% except magenta.
```

Accept if: [ ] common checklist · [ ] band limits respected (nothing outside 35–70%) · [ ] the
straight bottom edge is at ~62% · [ ] it reaches both side edges · [ ] low contrast, clearly
"far".

### B03 `w1-far-seg2.png` — far layer, extend right

```text
Extend the attached image to the right as a direct continuation of the same colonnade. Keep
exactly the same horizon height (62%), band limits (35% to 70%), window size and spacing, stone
colours, light direction and flat #FF00FF magenta background. The new image's left edge must
continue seamlessly from the attached image's right edge. Vary the details a little (one window
with a curtain, one broken arch), no new objects outside the band. [STYLE]
```

Accept if: [ ] common checklist · [ ] placed side by side with B02, the windows keep the same size,
spacing and height · [ ] horizon within ±2% of B02 · [ ] no obvious colour jump at the join.

### B04 `w1-mid-seg1.png` — mid layer, segment 1

```text
[STYLE]
[W1]
[CUT]
Middle layer only, matching the attached reference: tall gilded mirror frames standing between
fluted lilac marble pillars. The mirror glass shows faint cyan reflections of a pine forest and a
castle silhouette, with a thin diagonal glint. Moonlight from the upper left gives the pillars a
bright left edge. Keep all artwork inside a horizontal band from 25% to 75% of the image height;
pillar bases sit on a straight line at 75%. Artwork runs edge to edge horizontally. Medium
contrast.
```

Accept if: [ ] common checklist · [ ] band limits and straight base line at ~75% · [ ] reaches
both side edges · [ ] the mirrors read as mirrors (glass + frame) at 25% zoom · [ ] no mirror
shows a person or a face.

### Continuation method: outpaint canvas (preferred), measured on World 1

Observed with `google/gemini-3.1-flash-image`: a plain "extend the attached image to the right"
edit returns a **re-imagined** image, not a continuation. Mid-layer overlap cost was 860
(unusable), near 145 (rejected), and far only matched after the key-out fix. The root cause is
that the model never sees which pixels must continue.

**Outpaint canvas** instead: build `seg(n+1)` input deterministically as the **right 40%** of
`seg(n)` placed at the left of a canvas of the same size, filled with `#FF00FF`. The build step
records the canvas recipe, so it's reproducible. Then send:

```text
[STYLE]
[W1 without the horizon sentence]
The attached image is the <layer> of a 2D platformer background: <layer description> on a flat
solid #FF00FF magenta background. Its LEFT 40% is finished artwork; the RIGHT 60% is empty
magenta. Complete the image by continuing the same <elements> into the empty area: same sizes and
spacing, same top line and base line, same colours and light. Do not change the finished left
part at all; keep it pixel-identical. <what is new in this segment>. Everything that is not
<elements> stays flat solid #FF00FF magenta.
```

Result for `w1-mid-seg2-outpaint.png`: registration found overlap 635 px (canvas 633 px) at cost
34, with a matching pillar rhythm. Accept a continuation only if the processing reports overlap
within ±12 px of the canvas split, cost ≤120 and base line within ±8 px.

### B05–B07 `w1-mid-seg2.png` … `w1-mid-seg4.png` — mid layer, extend right (same prompt each time; superseded by the outpaint canvas above)

```text
Extend the attached image to the right as a direct continuation of the same hall. Keep exactly
the same base line (75%), band limits (25% to 75%), pillar width and spacing, mirror size, gold
frame colour, light direction and flat #FF00FF magenta background. The new image's left edge must
continue seamlessly from the attached image's right edge. Change which memory each new mirror
shows: seg2 an underwater coral garden, seg3 snowy mountain peaks, seg4 a rose garden at
twilight. [STYLE]
```

(For each of seg2/seg3/seg4 keep only the matching memory in the last sentence.)

Accept if: [ ] common checklist · [ ] side by side with the previous segment: same pillar width,
spacing, base line (±2%) and mirror size · [ ] new memory visible · [ ] no duplicated mirror
exactly copying the previous one.

### B08 `w1-mid-loop.png` — mid loop bridge (attach seg4 first, then seg1)

```text
The first attached image is the end of a long hall, the second is its beginning. Draw the missing
piece that continues the first image to the right and ends so that its right edge continues
seamlessly into the left edge of the second image. Same base line (75%), band limits (25% to
75%), pillar and mirror sizes, colours, light and flat #FF00FF magenta background. [STYLE]
```

Accept if: [ ] common checklist · [ ] left edge matches seg4's right edge and right edge matches
seg1's left edge (check both side by side) · [ ] base line within ±2%.

### B09 `w1-near-seg1.png` — near layer, segment 1

```text
[STYLE]
[W1]
[CUT]
Near foreground-framing layer only, matching the attached reference: dark violet silhouettes of
thick pillar bases, a low carved balustrade and a few hanging lanterns with small warm glows, very
dark and simple so a character in front of it stays readable. Keep all artwork inside a
horizontal band from 55% to 85% of the image height; the balustrade stands on a straight line at
85%. Artwork runs edge to edge horizontally. Low detail, strong silhouette.
```

Accept if: [ ] common checklist · [ ] band limits and straight line at ~85% · [ ] darker and
simpler than the mid layer · [ ] lantern glows are small, with no big bright areas.

### B10–B12 `w1-near-seg2.png` … `w1-near-seg4.png` — near layer, extend right

```text
Extend the attached image to the right as a direct continuation of the same balustrade and pillar
bases. Keep exactly the same base line (85%), band limits (55% to 85%), silhouette darkness,
lantern size, light direction and flat #FF00FF magenta background. The new image's left edge must
continue seamlessly from the attached image's right edge. Add small variety: a potted fern, a
broken baluster, a sleeping cat silhouette. [STYLE]
```

Accept if: [ ] common checklist · [ ] same base line (±2%), same darkness · [ ] no bright object
larger than a lantern.

### B13 `w1-near-loop.png` — near loop bridge (attach seg4, then seg1)

Same text as B08, with "base line (85%), band limits (55% to 85%)".

Accept if: same as B08.

### B14 `w1-fg-props.png` — foreground props sheet

```text
[STYLE]
[W1]
[CUT]
A sprite sheet of separate foreground decorations, each isolated with generous magenta space
around it, arranged in a loose grid: 1) a long heavy velvet drape valance with gold trim hanging
from the top, 2) a small gold chandelier with five candles, 3) a single hanging curtain tie, 4) a
potted fern. Plain side view, no overlaps between items.
```

Accept if: [ ] common checklist · [ ] 4 separate items with magenta gaps ≥ 5% of the image
between them · [ ] no item touches the edge.

---

## Anna (reference sheet first, then poses)

Processing target: 32×48 native per cell (64×96 in game), feet on the cell's bottom row.
Every pose prompt attaches **A01** (and, for grids after A02, also the previous accepted grid).

| # | File | Size asked | Background | Attach | Poses (left → right) |
| --- | --- | --- | --- | --- | --- |
| A01 | `anna-ref.png` | square | `#FF00FF` | — | front, side (facing right), back + swatches |
| A02 | `anna-idle.png` | landscape | `#FF00FF` | A01 | idle neutral, idle breath-in |
| A03 | `anna-run.png` | landscape | `#FF00FF` | A01, A02 | contact L, pass L, contact R, pass R |
| A04 | `anna-jump.png` | landscape | `#FF00FF` | A01, A02 | jump rise, fall |
| A05 | `anna-land-skid-hurt.png` | landscape | `#FF00FF` | A01, A02 | land squat, skid, hurt |
| A06 | `anna-celebrate.png` | landscape | `#FF00FF` | A01, A02 | arms up, hop |

### CHAR — Anna description (reused verbatim)

```text
Anna: an original cute chibi heroine (not based on any existing character), about 3 heads tall,
big friendly eyes, rosy cheeks, long straight brown hair past the shoulders with a small gold
bell hairpin on the right side, a light "sugar-paper" blue quilted puffer jacket with horizontal
quilting lines, dark blue jeans, white sneakers. Dark plum 1-pixel outline around the figure.
```

### A01 `anna-ref.png` — character reference sheet

```text
[STYLE]
[CHAR]
[CUT]
A character reference sheet of Anna: three full-body views side by side at exactly the same
height and scale: front view, side view facing right, back view. All feet stand on one thin
straight black horizontal baseline. Below the figures, a row of flat colour swatches for hair,
skin, jacket, jacket shadow, jeans, sneakers, hairpin gold. No labels, no text.
```

Accept if: [ ] common checklist · [ ] exactly 3 views, same height (±3%) · [ ] all features in
CHAR present (bell hairpin, quilting lines, jeans, white sneakers) · [ ] ~3 heads tall · [ ] one
straight baseline · [ ] **human approves this sheet before any pose is generated**.

### POSEGRID — pose grid wrapper (reused verbatim; `<N>` and `<POSES>` filled per file)

```text
[STYLE]
[CHAR]
[CUT]
Same character as the attached reference sheet, identical proportions, colours, outline and
hairpin. Draw <N> full-body poses side by side in one row, all at exactly the same scale as the
reference, evenly spaced with wide magenta gaps between figures, all feet (or the lowest point
of the pose) aligned to one thin straight black horizontal baseline, facing right. Poses from
left to right: <POSES>. No motion lines, no dust, no shadows, no text.
```

| File | `<N>` | `<POSES>` |
| --- | --- | --- |
| A02 `anna-idle.png` | 2 | 1) standing relaxed, arms down; 2) same pose breathing in, shoulders 2% higher, hair slightly lifted |
| A03 `anna-run.png` | 4 | 1) running, left foot forward touching the ground, right arm forward; 2) passing pose, left leg under the body, right knee raised; 3) running, right foot forward touching the ground, left arm forward; 4) passing pose, right leg under the body, left knee raised |
| A04 `anna-jump.png` | 2 | 1) jumping upward, knees tucked, arms up and out, hair down; 2) falling, legs reaching down, arms up, hair and jacket lifted by the air (these two float above the baseline by the same small gap) |
| A05 `anna-land-skid-hurt.png` | 3 | 1) landing squat, knees bent, arms forward for balance; 2) skidding to a stop, leaning back, one foot braced forward; 3) surprised "oops" pose, eyes closed, arms flung up |
| A06 `anna-celebrate.png` | 2 | 1) both arms raised in joy, big smile; 2) small happy hop, feet just above the baseline |

Accept if (every pose grid): [ ] common checklist · [ ] exact number of figures, in the listed
order · [ ] each figure's head height within ±5% of A01's side view · [ ] same hair length,
hairpin side, jacket quilting and sneaker colour as A01 · [ ] facing right · [ ] feet on the
baseline (except A04 and A06 hop, which float by an equal gap) · [ ] figures don't overlap or
touch the image edge · [ ] no extra limbs or merged figures.

---

## After download (worker checklist)

1. Save `<file>.png` + `<file>.prompt.txt` in `docs/part2/art/gen/`.
2. Run the prototype processing: key-out, band crop, registration and seam for segments,
   area-average downsample, OKLab quantize to the W1 palette, loop, slice.
3. Look at raw vs processed side by side at 1:1 and ×4. If processing exposes a problem the
   checklist missed, add that line to the checklist, then regenerate.
4. Add the images and prompts to `review.html` (AI column, backgrounds, Anna, prompts).
