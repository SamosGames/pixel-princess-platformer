"""ru-overlay.py — rasterise the RU wardrobe mockup labels with the real Cyrillic pixel font.

mockups.mjs emits a native 640×360 base without text plus label records for lang "ru"; this
script draws every label with Tiny5 WITHOUT anti-aliasing (fontmode "1") and upscales ×2
nearest-neighbour like every other mockup. The image shows how the actual font reads, not the
5×7 stand-in.

Tiny5 is drawn on an 8 px em (1 font pixel = 128/1024 units; caps 5 px, x-height 4 px), so only
multiples of 8 px render crisp. Native sizes used here: dense captions 8 px (1 font px = 1 art
px), normal labels 16 px, the title 24 px.

Usage (from the repo root, after `node docs/part2/art/mockups.mjs`):
  uv run --with pillow python docs/part2/art/ru-overlay.py <path/to/Tiny5-Regular.ttf>
Font source: https://github.com/google/fonts/tree/main/ofl/tiny5 (SIL OFL 1.1).
"""
import json
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
TMP = Path(tempfile.gettempdir())
FONT = sys.argv[1]
EM = 8  # Tiny5 design em in pixels


def size_for(label):
    if label.get("small"):
        return EM
    return EM * (3 if (label.get("scale") or 1) >= 2 else 2)


base = Image.open(TMP / ".wardrobe-ru-native.png").convert("RGBA")
labels = json.loads((TMP / ".wardrobe-ru-labels.json").read_text())
draw = ImageDraw.Draw(base)
draw.fontmode = "1"
fonts = {}
for lab in labels:
    size = size_for(lab)
    font = fonts.setdefault(size, ImageFont.truetype(FONT, size))
    cap_top = font.getbbox("Н")[1]
    cap_h = font.getbbox("Н")[3] - cap_top
    tw = draw.textlength(lab["text"], font=font)
    icon = 13 if lab.get("video") else 0
    x = lab["x"] if lab.get("center") is None else round(lab["center"] - (tw + icon) / 2)
    # keep the stand-in's vertical centre: stand-in caps are 7 px tall starting at lab["y"]
    y = round(lab["y"] + 3.5 - cap_h / 2) - cap_top
    if icon:
        iy = round(lab["y"])
        draw.rectangle([x, iy, x + 8, iy + 6], fill=(42, 26, 68))
        draw.polygon([(x + 3, iy + 1), (x + 3, iy + 5), (x + 6, iy + 3)], fill=(255, 255, 255))
        x += icon
    if lab.get("shadow"):
        draw.text((x + 1, y + 1), lab["text"], font=font, fill=tuple(lab["shadow"]))
    draw.text((x, y), lab["text"], font=font, fill=tuple(lab["color"]))

out = HERE / "mockup-wardrobe-ru.png"
base.resize((base.width * 2, base.height * 2), Image.NEAREST).save(out)
print(f"wrote {out.name} ({len(labels)} labels, Tiny5 sizes {sorted(fonts)})")
