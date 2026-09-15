// mockups.mjs — Part 2 art-direction mockups, painted in code (not shipped, not the generator).
//
// Run: node docs/part2/art/mockups.mjs   → docs/part2/art/mockup-*.png
//
// Deliberately built on the same toolkit the real generator uses (tools/gen/px.mjs: RGBA buffers,
// deterministic rng, Bayer dither, integer upscale, PNG encoder) so every effect shown here is one
// the Part 2 generator can actually bake. Native canvas 640×360, integer ×2 → 1280×720 (GAME_W/H):
// the proposed Part 2 art density (Part 1 is 320×180 ×4).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodePNG, upscale, rng, bayer, outline } from "../../../tools/gen/px.mjs";

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const W = 640;
const H = 360;

// --- tiny compositing toolkit (px.mjs overwrites; mockups need alpha blending) ---------------

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const canvas = (w = W, h = H) => ({ w, h, buf: new Uint8Array(w * h * 4) });

function put(img, x, y, c, a = 1) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= img.w || y >= img.h || a <= 0) return;
  const i = (y * img.w + x) * 4;
  const b = img.buf;
  if (a >= 1 || b[i + 3] === 0) {
    b[i] = c[0]; b[i + 1] = c[1]; b[i + 2] = c[2];
    b[i + 3] = a >= 1 || b[i + 3] === 0 ? Math.round(Math.min(1, a) * 255) : b[i + 3];
    if (a >= 1) b[i + 3] = 255;
    return;
  }
  for (let k = 0; k < 3; k++) b[i + k] = Math.round(b[i + k] * (1 - a) + c[k] * a);
  b[i + 3] = Math.max(b[i + 3], Math.round(a * 255));
}
const get = (img, x, y) => {
  const i = (y * img.w + x) * 4;
  return [img.buf[i], img.buf[i + 1], img.buf[i + 2], img.buf[i + 3]];
};
function rect(img, x, y, w, h, c, a = 1) {
  for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++)
    for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++) put(img, xx, yy, c, a);
}
function ellipse(img, cx, cy, rx, ry, c, a = 1, clip = null) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) put(img, x, y, c, a);
    }
}
// Dithered fill: `level` 0..1 of pixels set (2×2 Bayer → 5 steps), the 16-bit way to fake alpha.
function dith(img, x, y, w, h, c, level, a = 1) {
  for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++)
    for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++)
      if ((bayer(((xx % 2) + 2) % 2, ((yy % 2) + 2) % 2) + 0.5) / 4 < level) put(img, xx, yy, c, a);
}
// Vertical gradient through colour stops, quantized into bands with dithered band edges.
function vgrad(img, x, y, w, h, stops, bands = 14) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const t = Math.max(0, Math.min(0.9999, (yy / h) * bands + (bayer(xx % 2, yy % 2) / 4 - 0.4) * 0.9)) / bands;
      const q = Math.floor(t * bands) / (bands - 1);
      const s = Math.min(stops.length - 2, Math.floor(q * (stops.length - 1)));
      const f = q * (stops.length - 1) - s;
      put(img, x + xx, y + yy, mixc(stops[s], stops[s + 1], Math.min(1, f)));
    }
  }
}
// Soft light pool: alpha falls off with distance, quantized into 4 dithered rings (no smooth
// gradients anywhere — that is what keeps glows reading as pixel art).
function glow(img, cx, cy, r, c, strength = 0.5) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x - cx, y - cy) / r;
      if (d >= 1) continue;
      const raw = (1 - d) * (1 - d);
      const q = Math.floor(raw * 4 + (bayer(((x % 2) + 2) % 2, ((y % 2) + 2) % 2) / 4)) / 4;
      if (q > 0) put(img, x, y, c, q * strength);
    }
}
function ring(img, cx, cy, r, th, c, a = 1, dashed = false) {
  for (let y = Math.floor(cy - r - th); y <= cy + r + th; y++)
    for (let x = Math.floor(cx - r - th); x <= cx + r + th; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (Math.abs(d - r) <= th / 2 && (!dashed || (Math.floor(Math.atan2(y - cy, x - cx) * 6) & 1))) put(img, x, y, c, a);
    }
}
function line(img, x0, y0, x1, y1, c, a = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(img, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c, a);
}
function trap(img, yTop, yBot, cx, halfTop, halfBot, c, a = 1) {
  for (let y = Math.round(yTop); y < Math.round(yBot); y++) {
    const f = (y - yTop) / Math.max(1, yBot - yTop);
    const half = halfTop + (halfBot - halfTop) * f;
    rect(img, Math.round(cx - half), y, Math.round(half * 2), 1, c, a);
  }
}
function blit(dst, src, dx, dy, { flipX = false, alpha = 1, tint = null, scale = 1 } = {}) {
  for (let y = 0; y < src.h * scale; y++)
    for (let x = 0; x < src.w * scale; x++) {
      const sx = Math.floor((flipX ? src.w * scale - 1 - x : x) / scale);
      const p = get(src, sx, Math.floor(y / scale));
      if (p[3] === 0) continue;
      put(dst, dx + x, dy + y, tint || p, (p[3] / 255) * alpha);
    }
}
function vignette(img, strength = 0.5, col = hex("#0a0614")) {
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      const dx = (x - img.w / 2) / (img.w / 2);
      const dy = (y - img.h / 2) / (img.h / 2);
      const d = Math.sqrt(dx * dx * 0.8 + dy * dy);
      const t = Math.max(0, (d - 0.72) / 0.5);
      const q = Math.floor(Math.min(1, t) * 4 + bayer(x % 2, y % 2) / 4) / 4;
      if (q > 0) put(img, x, y, col, q * strength);
    }
}

// --- 5×7 bitmap font (uppercase only) ---------------------------------------------------------

const G7 = (s) => s.split(" ").join("");
const GLYPHS = {
  A: G7(".###. #...# #...# ##### #...# #...# #...#"), B: G7("####. #...# #...# ####. #...# #...# ####."),
  C: G7(".###. #...# #.... #.... #.... #...# .###."), D: G7("####. #...# #...# #...# #...# #...# ####."),
  E: G7("##### #.... #.... ####. #.... #.... #####"), F: G7("##### #.... #.... ####. #.... #.... #...."),
  G: G7(".###. #...# #.... #.### #...# #...# .####"), H: G7("#...# #...# #...# ##### #...# #...# #...#"),
  I: G7(".###. ..#.. ..#.. ..#.. ..#.. ..#.. .###."), J: G7("..### ...#. ...#. ...#. #..#. #..#. .##.."),
  K: G7("#...# #..#. #.#.. ##... #.#.. #..#. #...#"), L: G7("#.... #.... #.... #.... #.... #.... #####"),
  M: G7("#...# ##.## #.#.# #.#.# #...# #...# #...#"), N: G7("#...# ##..# #.#.# #..## #...# #...# #...#"),
  O: G7(".###. #...# #...# #...# #...# #...# .###."), P: G7("####. #...# #...# ####. #.... #.... #...."),
  Q: G7(".###. #...# #...# #...# #.#.# #..#. .##.#"), R: G7("####. #...# #...# ####. #.#.. #..#. #...#"),
  S: G7(".#### #.... #.... .###. ....# ....# ####."), T: G7("##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#.."),
  U: G7("#...# #...# #...# #...# #...# #...# .###."), V: G7("#...# #...# #...# #...# #...# .#.#. ..#.."),
  W: G7("#...# #...# #...# #.#.# #.#.# #.#.# .#.#."), X: G7("#...# #...# .#.#. ..#.. .#.#. #...# #...#"),
  Y: G7("#...# #...# .#.#. ..#.. ..#.. ..#.. ..#.."), Z: G7("##### ....# ...#. ..#.. .#... #.... #####"),
  0: G7(".###. #...# #..## #.#.# ##..# #...# .###."), 1: G7("..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###."),
  2: G7(".###. #...# ....# ...#. ..#.. .#... #####"), 3: G7("####. ....# ....# .###. ....# ....# ####."),
  4: G7("...#. ..##. .#.#. #..#. ##### ...#. ...#."), 5: G7("##### #.... ####. ....# ....# #...# .###."),
  6: G7(".###. #.... #.... ####. #...# #...# .###."), 7: G7("##### ....# ...#. ..#.. .#... .#... .#..."),
  8: G7(".###. #...# #...# .###. #...# #...# .###."), 9: G7(".###. #...# #...# .#### ....# ....# .###."),
  ":": G7("..... ..#.. ..#.. ..... ..#.. ..#.. ....."), "/": G7("....# ....# ...#. ..#.. .#... #.... #...."),
  "-": G7("..... ..... ..... .###. ..... ..... ....."), "'": G7("..#.. ..#.. .#... ..... ..... ..... ....."),
  ".": G7("..... ..... ..... ..... ..... ..#.. ..#.."), "·": G7("..... ..... ..... ..#.. ..... ..... ....."),
  " ": G7("..... ..... ..... ..... ..... ..... ....."),
};
for (const [ch, g] of Object.entries(GLYPHS)) if (g.length !== 35) throw new Error(`glyph ${ch} has ${g.length} cells`);
function text(img, str, x, y, c, { scale = 1, shadow = null, outlineCol = null, grad = null } = {}) {
  const draw = (ox, oy, col, isFill) => {
    let cx = ox;
    for (const ch of str) {
      const g = GLYPHS[ch] || GLYPHS[" "];
      for (let r = 0; r < 7; r++)
        for (let q = 0; q < 5; q++)
          if (g[r * 5 + q] === "#") {
            const fc = isFill && grad ? mixc(grad[0], grad[1], r / 6) : col;
            rect(img, cx + q * scale, oy + r * scale, scale, scale, fc);
          }
      cx += 6 * scale;
    }
  };
  if (outlineCol) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) draw(x + dx, y + dy, outlineCol, false);
  if (shadow) draw(x + scale, y + scale, shadow, false);
  draw(x, y, c, true);
  return str.length * 6 * scale;
}
const textW = (str, scale = 1) => str.length * 6 * scale - scale;

// 9-slice-style pixel panel: 1px dark outline, 1px light bevel, rounded corners.
function panel(img, x, y, w, h, { fill, border, hi, alpha = 1 }) {
  rect(img, x + 1, y + 1, w - 2, h - 2, fill, alpha);
  rect(img, x + 2, y, w - 4, 1, border); rect(img, x + 2, y + h - 1, w - 4, 1, border);
  rect(img, x, y + 2, 1, h - 4, border); rect(img, x + w - 1, y + 2, 1, h - 4, border);
  put(img, x + 1, y + 1, border); put(img, x + w - 2, y + 1, border); put(img, x + 1, y + h - 2, border); put(img, x + w - 2, y + h - 2, border);
  if (hi) { rect(img, x + 2, y + 1, w - 4, 1, hi); rect(img, x + 1, y + 2, 1, h - 5, hi); }
}

const save = (name, img) => {
  writeFileSync(join(OUT_DIR, name), encodePNG(upscale(img, 2)));
  console.log("wrote", name);
};

// --- shared sprites ----------------------------------------------------------------------------

const OUT = hex("#24172e");

// Anna at 32×48 native (Part 1: 16×24). Pose record like tools/gen/characters.mjs.
function paintAnna(p = {}) {
  const P = { bob: 0, lean: 0, legLx: 0, legRx: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, hairLift: 0, tuck: 0, blink: false, ...p };
  const legs = canvas(32, 48);
  const img = canvas(32, 48); // upper body; composited over the legs with the lean offset below
  const HAIR = { hi: hex("#a86d43"), base: hex("#7c4b31"), lo: hex("#57331f"), lo2: hex("#3e2417") };
  const SKIN = hex("#f7d4ba"); const SKIN_LO = hex("#e3ad93");
  const JK = { hi: hex("#dcebfb"), base: hex("#abcbec"), lo: hex("#82a2cf"), lo2: hex("#6280b2") };
  const JE = { hi: hex("#50609e"), base: hex("#35437b"), lo: hex("#262f5e") };
  const SH = { base: hex("#f3f5f9"), lo: hex("#bac2d2"), sole: hex("#8c7fa0") };
  const b = P.bob;

  // back hair
  ellipse(img, 16, 14 + b, 10, 10, HAIR.lo);
  rect(img, 6, 14 + b - P.hairLift, 20, 16 - P.hairLift, HAIR.lo);
  for (let x = 6; x < 26; x++) put(img, x, 30 + b - P.hairLift + ((x * 7) % 3) - 1, HAIR.lo);
  rect(img, 9, 20 + b, 14, 10, HAIR.lo2);

  // legs + shoes
  const foot = (x0, lx, lift, side) => {
    const top = 35;
    const bot = 44 - lift - P.tuck;
    rect(legs, x0 + lx, top, 5, bot - top, JE.base);
    rect(legs, x0 + lx + (side ? 3 : 0), top, 2, bot - top, JE.lo);
    rect(legs, x0 + lx + (side ? 0 : 4), top + 1, 1, bot - top - 2, JE.hi);
    rect(legs, x0 + lx - 1, bot, 7, 3, SH.base);
    rect(legs, x0 + lx - 1, bot + 2, 7, 1, SH.sole);
    rect(legs, x0 + lx + 4, bot, 2, 2, SH.lo);
  };
  foot(17, P.legRx, P.liftR, true);
  foot(10, P.legLx, P.liftL, false);

  // jacket (puffer, "carta da zucchero")
  rect(img, 9, 22 + b, 14, 14 - b, JK.base);
  rect(img, 20, 23 + b, 3, 13 - b, JK.lo);
  rect(img, 9, 23 + b, 2, 12 - b, JK.hi);
  for (const sy of [27, 31]) { rect(img, 10, sy + b, 12, 1, JK.lo2); put(img, 10, sy + b + 1, JK.lo); }
  rect(img, 11, 22 + b, 10, 1, JK.hi);
  for (let y = 24 + b; y < 35; y += 2) put(img, 16, y, JK.hi);
  rect(img, 9, 35, 14, 1, JK.lo2);

  // arms (sleeves + hands), swinging
  const arm = (sx, dir, swing) => {
    const hx = sx + dir * 1 + swing;
    const hy = 32 + b - Math.abs(swing) / 2;
    for (let t = 0; t <= 1; t += 0.1) {
      const x = sx + (hx - sx) * t;
      const y = 23 + b + (hy - 23 - b) * t;
      rect(img, x - 1, y, 3, 2, t > 0.7 ? JK.lo : JK.base);
    }
    rect(img, hx - 1, hy + 1, 3, 2, SKIN);
    put(img, hx + 1, hy + 2, SKIN_LO);
  };
  arm(7, -1, P.armL);
  arm(25, 1, P.armR);

  // head
  ellipse(img, 16, 15 + b, 8.5, 8, SKIN);
  rect(img, 14, 22 + b, 4, 1, SKIN_LO);
  // eyes (2×3 with a shine) + lashes
  for (const ex of [11, 19]) {
    if (P.blink) rect(img, ex, 17 + b, 3, 1, OUT);
    else {
      rect(img, ex, 15 + b, 2, 3, hex("#2b2238"));
      put(img, ex, 15 + b, [255, 255, 255]);
      rect(img, ex - (ex < 16 ? 1 : 0), 14 + b, 3, 1, hex("#2b2238"));
    }
  }
  rect(img, 9, 19 + b, 2, 1, hex("#f09aa6"));
  rect(img, 21, 19 + b, 2, 1, hex("#f09aa6"));
  rect(img, 15, 20 + b, 2, 1, hex("#b85a66"));

  // front hair: cap, bangs, side locks, sheen
  ellipse(img, 16, 12 + b, 9.5, 7, HAIR.base, 1, (x, y) => y <= 12 + b);
  const bang = [2, 3, 4, 2, 3, 5, 3, 2, 2, 4, 3, 2, 3, 5, 4, 2, 3, 2];
  for (let i = 0; i < bang.length; i++) rect(img, 7 + i, 12 + b, 1, bang[i], HAIR.base);
  rect(img, 6, 12 + b, 3, 13, HAIR.base);
  rect(img, 23, 12 + b, 3, 13, HAIR.base);
  rect(img, 24, 13 + b, 2, 12, HAIR.lo);
  for (const [x, y] of [[10, 7], [11, 6], [12, 6], [13, 6], [14, 7], [9, 8], [8, 10]]) put(img, x, y + b, HAIR.hi);
  put(img, 16, 5 + b, HAIR.lo);
  put(img, 16, 6 + b, HAIR.lo);
  // a tiny gold bell hairpin — the Part 2 motif
  rect(img, 22, 8 + b, 3, 3, hex("#f2c14e"));
  put(img, 23, 11 + b, hex("#b9852a"));

  blit(legs, img, P.lean, 0);
  outline(legs, OUT);
  return legs;
}

// Part 1 heroine reference, reconstructed from tools/gen/characters.mjs at its real 16×24 size.
function paintPart1Anna() {
  const img = canvas(16, 24);
  const HAIR = [116, 70, 44]; const TOP = [167, 199, 231]; const LEG = [44, 52, 90];
  rect(img, 3, 6, 2, 16, HAIR); rect(img, 11, 6, 2, 16, HAIR);
  rect(img, 5, 10, 6, 6, TOP); rect(img, 5, 11, 6, 1, [130, 155, 180]); rect(img, 5, 13, 6, 1, [130, 155, 180]);
  rect(img, 5, 16, 2, 5, LEG); rect(img, 9, 16, 2, 5, LEG);
  rect(img, 4, 21, 3, 2, [240, 240, 244]); rect(img, 9, 21, 3, 2, [240, 240, 244]);
  rect(img, 5, 3, 6, 7, [243, 207, 178]); rect(img, 4, 1, 8, 3, HAIR);
  put(img, 6, 6, [44, 36, 50]); put(img, 9, 6, [44, 36, 50]);
  put(img, 5, 7, [233, 150, 160]); put(img, 10, 7, [233, 150, 160]); rect(img, 7, 8, 2, 1, [176, 88, 92]);
  outline(img, [38, 30, 42]);
  return img;
}

// Echo note collectible (12×14): a faceted crystal quaver.
function paintNote(col = hex("#8ff0e6")) {
  const img = canvas(12, 14);
  const lo = mixc(col, [30, 40, 90], 0.45); const hi = mixc(col, [255, 255, 255], 0.6);
  ellipse(img, 4.5, 10.5, 3.5, 2.6, col);
  rect(img, 7, 2, 2, 9, col);
  rect(img, 8, 2, 3, 2, col); rect(img, 9, 4, 2, 2, col);
  put(img, 3, 9, hi); put(img, 4, 9, hi); put(img, 7, 3, hi);
  rect(img, 5, 11, 2, 1, lo); put(img, 8, 9, lo);
  outline(img, OUT);
  return img;
}
function sparkle(img, x, y, c, s = 2) {
  put(img, x, y, [255, 255, 255]);
  for (let i = 1; i <= s; i++) { put(img, x + i, y, c, 1 - i / (s + 1)); put(img, x - i, y, c, 1 - i / (s + 1)); put(img, x, y + i, c, 1 - i / (s + 1)); put(img, x, y - i, c, 1 - i / (s + 1)); }
}
function heartIcon(img, x, y, full = true) {
  const m = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
  const c = full ? hex("#ff6f91") : hex("#4a3a5e");
  m.forEach((row, r) => [...row].forEach((ch, q) => ch === "#" && put(img, x + q, y + r, c)));
  if (full) { put(img, x + 1, y + 1, hex("#ffd1dc")); put(img, x + 2, y + 1, hex("#ffd1dc")); }
}
function starIcon(img, x, y, c = hex("#ffd35a")) {
  const m = ["...#...", "...#...", "#######", ".#####.", "..###..", ".##.##.", ".#...#."];
  m.forEach((row, r) => [...row].forEach((ch, q) => ch === "#" && put(img, x + q, y + r, c)));
}
function hudPanel(img, x, y, notes, total, lives, stars, time, noteCol) {
  // pause button (the DOM ⏸ stays; restyled to the same pixel frame)
  panel(img, 8, 8, 26, 26, { fill: hex("#2a2046"), border: OUT, hi: hex("#4b3f78"), alpha: 0.92 });
  rect(img, 17, 15, 3, 12, hex("#efe6ff")); rect(img, 23, 15, 3, 12, hex("#efe6ff"));
  panel(img, x, y, 118, 44, { fill: hex("#2a2046"), border: OUT, hi: hex("#4b3f78"), alpha: 0.88 });
  blit(img, paintNote(noteCol), x + 6, y + 5);
  text(img, `${notes}/${total}`, x + 22, y + 8, hex("#fff3d6"), { shadow: OUT });
  for (let i = 0; i < 3; i++) heartIcon(img, x + 66 + i * 9, y + 8, i < lives);
  starIcon(img, x + 6, y + 27);
  text(img, `${stars}`, x + 16, y + 27, hex("#fff3d6"), { shadow: OUT });
  text(img, time, x + 76, y + 27, hex("#c9bde8"), { shadow: OUT });
}

// ================================================================================================
// MOCKUP 1 — Level 1, Soglia degli Echi (gameplay frame)
// ================================================================================================
function mockLevel1() {
  const img = canvas();
  const C = {
    sky: [hex("#140f2a"), hex("#241c46"), hex("#3a2f66"), hex("#56478a")],
    far: hex("#2e2757"), farHi: hex("#3d3570"),
    pil: { hi: hex("#8e8cc6"), base: hex("#6564a0"), lo: hex("#46447b"), lo2: hex("#302d5a") },
    glass: hex("#1f3f5c"), echo: hex("#8ff0e6"),
    gold: { hi: hex("#ffe08a"), base: hex("#e0a93f"), lo: hex("#a36d25") },
    marble: { top: hex("#f4eefb"), hi: hex("#ddd4ee"), base: hex("#bdb2d8"), lo: hex("#9589bb"), lo2: hex("#6a5f96"), grout: hex("#4f467c"), vein: hex("#cfc5e6") },
    warm: hex("#ffd9a0"), rose: hex("#ff8fa3"),
  };

  // --- layer 0: sky through the far windows
  vgrad(img, 0, 0, W, H, C.sky);
  const r = rng(7);
  for (let i = 0; i < 90; i++) put(img, Math.floor(r() * W), Math.floor(r() * 200), [236, 232, 255], 0.4 + r() * 0.6);

  // --- layer 1 (far, ×0.3): colonnade wall with tall arched windows + moon
  rect(img, 0, 36, W, 250, C.far);
  for (let wx = -20; wx < W; wx += 116) {
    const ww = 58;
    ellipse(img, wx + ww / 2, 88, ww / 2, 30, C.sky[0], 1, (x, y) => y <= 88);
    rect(img, wx, 88, ww, 150, C.sky[0]);
    vgrad(img, wx + 2, 92, ww - 4, 144, [hex("#1a1538"), hex("#2c2458"), hex("#473a7c")], 8);
    for (let i = 0; i < 8; i++) put(img, wx + 4 + Math.floor(r() * (ww - 8)), 64 + Math.floor(r() * 90), [240, 236, 255]);
    rect(img, wx + ww / 2 - 1, 62, 2, 176, C.farHi);
    rect(img, wx, 150, ww, 2, C.farHi);
    rect(img, wx - 4, 236, ww + 8, 6, C.farHi);
  }
  ellipse(img, 262, 120, 16, 16, hex("#fff4dc"));
  ellipse(img, 267, 116, 4, 3, hex("#efe0c4")); ellipse(img, 256, 126, 3, 2, hex("#efe0c4"));
  glow(img, 262, 120, 60, hex("#cfd8ff"), 0.35);

  // light shafts from the windows (dithered, low alpha)
  for (const sx of [38, 154, 270, 386, 502]) {
    for (let y = 100; y < 290; y++) {
      const x0 = sx + (y - 100) * 0.45;
      dith(img, x0, y, 26, 1, hex("#b9c6ff"), 0.25, 0.35);
    }
  }

  // --- layer 2 (mid, ×0.6): fluted pillars + echo mirrors showing Part 1's worlds
  const mirrors = [
    { x: 92, scene: "forest" }, { x: 312, scene: "rooftops" }, { x: 532, scene: "castle" },
  ];
  for (const m of mirrors) {
    const mw = 52, mh = 96, my = 132;
    rect(img, m.x - 3, my - 3, mw + 6, mh + 6, C.gold.lo);
    ellipse(img, m.x + mw / 2, my, mw / 2 + 3, 16, C.gold.lo, 1, (x, y) => y <= my);
    rect(img, m.x - 2, my - 2, mw + 4, mh + 4, C.gold.base);
    ellipse(img, m.x + mw / 2, my, mw / 2 + 2, 15, C.gold.base, 1, (x, y) => y <= my);
    rect(img, m.x - 2, my - 2, 1, mh + 4, C.gold.hi);
    // the echo inside: a teal-washed memory of a Part 1 world
    vgrad(img, m.x, my - 8, mw, mh + 8, [hex("#173a4f"), hex("#2a6a78"), hex("#5fb8b4")], 7);
    ellipse(img, m.x + mw / 2, my, mw / 2, 13, hex("#173a4f"), 1, (x, y) => y <= my - 8);
    const sil = hex("#123040");
    if (m.scene === "forest") for (const [px, ph] of [[6, 40], [20, 56], [36, 44], [46, 30]]) trap(img, my + mh - ph, my + mh, m.x + px, 0.5, 9, sil);
    if (m.scene === "rooftops") { for (const [px, ph] of [[10, 34], [30, 52]]) { rect(img, m.x + px - 6, my + mh - ph, 12, ph, sil); trap(img, my + mh - ph - 10, my + mh - ph, m.x + px, 1, 12, sil); } }
    if (m.scene === "castle") { rect(img, m.x + 8, my + 40, 36, 56, sil); for (const tx of [8, 20, 32, 44]) rect(img, m.x + tx - 3, my + 34, 6, 6, sil); trap(img, my + 14, my + 40, m.x + 26, 0.5, 8, sil); }
    for (let i = 0; i < mh; i += 1) { put(img, m.x + 8 + i * 0.5, my + i, [220, 255, 250], 0.25); put(img, m.x + 12 + i * 0.5, my + i, [220, 255, 250], 0.12); }
    glow(img, m.x + mw / 2, my + mh / 2, 50, C.echo, 0.12);
  }
  for (const px of [30, 202, 422, 612]) {
    const pw = 26;
    rect(img, px, 70, pw, 220, C.pil.base);
    rect(img, px, 70, 3, 220, C.pil.hi);
    rect(img, px + pw - 6, 70, 6, 220, C.pil.lo);
    for (let fx = px + 7; fx < px + pw - 6; fx += 5) rect(img, fx, 76, 1, 208, C.pil.lo);
    rect(img, px - 5, 60, pw + 10, 10, C.pil.hi); rect(img, px - 5, 68, pw + 10, 2, C.pil.lo2);
    rect(img, px - 6, 278, pw + 12, 10, C.pil.lo); rect(img, px - 6, 278, pw + 12, 2, C.pil.hi);
  }

  // hanging drapes + chandelier (near foreground, ×1.2 parallax, darker)
  for (let x = 0; x < W; x++) {
    const hang = 20 + Math.abs(Math.sin(x / 38)) * 16;
    rect(img, x, 0, 1, hang, hex("#3b1f4a"));
    put(img, x, Math.floor(hang), hex("#24132f"));
    if (x % 38 < 3) rect(img, x, 0, 1, hang - 2, hex("#5a3270"));
  }
  rect(img, 0, 0, W, 4, C.gold.lo); rect(img, 0, 4, W, 1, C.gold.base);
  line(img, 450, 5, 450, 40, C.gold.lo);
  trap(img, 40, 50, 450, 4, 22, C.gold.base); rect(img, 426, 50, 48, 2, C.gold.lo);
  for (const cx of [430, 444, 456, 470]) { rect(img, cx, 44, 2, 6, hex("#fff6e8")); put(img, cx, 42, hex("#ffcf6b")); glow(img, cx, 42, 14, C.warm, 0.35); }
  glow(img, 450, 50, 90, C.warm, 0.12);

  // --- gameplay layer ------------------------------------------------------------------------
  const GROUND = 288;
  const T = 32;
  // Marble terrain with autotile edges: top lip, cornice, brick courses, carved caps at ravines.
  const drawTerrain = (x0, x1, top) => {
    const M = C.marble;
    rect(img, x0, top, x1 - x0, H - top, M.lo);
    rect(img, x0, top, x1 - x0, 2, M.top);
    rect(img, x0, top + 2, x1 - x0, 7, M.hi);
    rect(img, x0, top + 9, x1 - x0, 2, M.lo2);
    rect(img, x0, top + 11, x1 - x0, 1, OUT);
    for (let y = top + 12; y < H; y++) {
      const course = Math.floor((y - top - 12) / 12);
      for (let x = x0; x < x1; x++) {
        const off = course % 2 ? 16 : 0;
        const inBrick = ((x - x0 + off) % T);
        const ly = (y - top - 12) % 12;
        let c = M.base;
        if (ly === 0) c = M.grout;
        else if (inBrick === 0) c = M.grout;
        else if (ly === 1 || inBrick === 1) c = M.hi;
        else if (ly === 11 || inBrick === T - 1) c = M.lo;
        const depth = (y - top) / (H - top);
        if (depth > 0.35) c = mixc(c, M.lo2, Math.min(0.6, (depth - 0.35) * 1.3));
        put(img, x, y, c);
      }
    }
    const vr = rng(x0 + top);
    for (let i = 0; i < (x1 - x0) / 10; i++) {
      const vx = x0 + Math.floor(vr() * (x1 - x0)); const vy = top + 3 + Math.floor(vr() * 5);
      put(img, vx, vy, M.vein); put(img, vx + 1, vy + 1, M.vein);
    }
    // carved end caps (edge tiles)
    for (const [ex, dir] of [[x0, 1], [x1 - 1, -1]]) {
      if (ex <= 0 || ex >= W - 1) continue;
      rect(img, ex, top, 1, H - top, OUT);
      rect(img, ex + dir, top + 2, 1, H - top - 2, dir > 0 ? M.top : M.lo2);
      put(img, ex, top, [0, 0, 0], 0); put(img, ex + dir, top, OUT);
    }
    rect(img, x0, top - 1, x1 - x0, 1, OUT, 0.55);
  };
  // ravine depth: fog into the void
  vgrad(img, 352, GROUND + 10, 64, H - GROUND - 10, [hex("#2a2150"), hex("#120c24")], 6);
  dith(img, 352, 330, 64, 30, hex("#8ff0e6"), 0.25, 0.25);
  drawTerrain(0, 352, GROUND);
  drawTerrain(416, 640, GROUND);
  drawTerrain(512, 640, 256);
  // contact shadow under the terrace lip onto the lower floor
  dith(img, 500, GROUND - 1, 12, 1, OUT, 0.5, 0.6);

  // gilded balcony (# semisolid) above a spring (M lands on #, never on a solid)
  const BY = 196;
  rect(img, 160, BY, 96, 4, C.gold.base); rect(img, 160, BY, 96, 1, C.gold.hi); rect(img, 160, BY + 4, 96, 2, C.gold.lo);
  for (let bx = 164; bx < 256; bx += 8) { rect(img, bx, BY + 6, 3, 10, C.gold.lo); put(img, bx, BY + 6, C.gold.base); rect(img, bx - 1, BY + 10, 5, 2, C.gold.base); }
  rect(img, 160, BY + 16, 96, 2, C.gold.lo);
  // spring
  const sx = 198;
  rect(img, sx, GROUND - 5, 20, 5, hex("#6b5a8e")); rect(img, sx, GROUND - 5, 20, 1, hex("#9d8fc0"));
  for (let i = 0; i < 3; i++) { rect(img, sx + 3, GROUND - 8 - i * 3, 14, 2, C.gold.base); put(img, sx + 3, GROUND - 8 - i * 3, C.gold.hi); }
  rect(img, sx - 1, GROUND - 16, 22, 4, hex("#d1466b")); rect(img, sx, GROUND - 16, 20, 1, hex("#ff8fae"));
  rect(img, sx - 1, GROUND - 12, 22, 1, OUT);

  // three low echo notes (the magnet lesson) + the magnet on the balcony
  const noteImg = paintNote();
  for (const [nx, ny] of [[64, 262], [90, 258], [116, 262]]) { glow(img, nx + 6, ny + 7, 12, C.echo, 0.35); blit(img, noteImg, nx, ny); }
  // magnet L: horseshoe with rose body, silver tips, pulse ring
  const mx = 222, my = 168;
  glow(img, mx, my, 22, hex("#ff8fae"), 0.4);
  ring(img, mx, my, 15, 1, hex("#ffd1dc"), 0.5, true);
  const mag = canvas(16, 16);
  ellipse(mag, 8, 7, 7, 7, hex("#d1466b"));
  ellipse(mag, 8, 7, 3, 3, [0, 0, 0], 0);
  for (let y = 0; y < 16; y++) for (let x = 5; x < 11; x++) if (y >= 7) mag.buf[(y * 16 + x) * 4 + 3] = 0;
  for (let y = 7; y < 16; y++) for (let x = 0; x < 16; x++) if (x < 1 || x > 14) mag.buf[(y * 16 + x) * 4 + 3] = 0;
  for (let y = 0; y < 16; y++) for (let x = 5; x < 11; x++) { const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 7); if (d < 3.2) mag.buf[(y * 16 + x) * 4 + 3] = 0; }
  rect(mag, 1, 7, 4, 4, hex("#d1466b")); rect(mag, 11, 7, 4, 4, hex("#d1466b"));
  rect(mag, 1, 11, 4, 3, hex("#e8ecf5")); rect(mag, 11, 11, 4, 3, hex("#e8ecf5"));
  rect(mag, 2, 3, 2, 3, hex("#ff9fbc"));
  outline(mag, OUT);
  blit(img, mag, mx - 8, my - 7);
  rect(img, mx - 7, my + 4, 4, 4, hex("#e8ecf5")); rect(img, mx + 3, my + 4, 4, 4, hex("#e8ecf5"));
  rect(img, mx - 7, my - 6, 2, 4, hex("#ff8fae"));
  sparkle(img, mx + 11, my - 10, hex("#ffd1dc"));

  // arc of notes over the ravine
  for (const [nx, ny] of [[356, 236], [378, 222], [400, 236]]) { glow(img, nx + 6, ny + 7, 12, C.echo, 0.35); blit(img, noteImg, nx, ny); }
  sparkle(img, 392, 216, C.echo, 3);

  // steam vent V (warning phase): grate + hissing plume, rose warning glint
  const vx = 452;
  rect(img, vx, GROUND + 1, 32, 5, hex("#3a3456")); for (let gx = vx + 2; gx < vx + 32; gx += 4) rect(img, gx, GROUND + 2, 2, 3, hex("#15101f"));
  rect(img, vx - 2, GROUND, 36, 1, hex("#8b86ad"));
  glow(img, vx + 16, GROUND, 26, C.rose, 0.35);
  const pr = rng(3);
  for (let i = 0; i < 26; i++) {
    const t = i / 26;
    const py = GROUND - 4 - t * 70;
    const pxx = vx + 16 + Math.sin(i * 1.7) * (4 + t * 8);
    const rad = 3 + t * 6;
    ellipse(img, pxx, py, rad, rad * 0.8, hex("#eef4ff"), (1 - t) * 0.55 * (0.7 + pr() * 0.3));
  }
  for (const [ax, ay] of [[vx + 2, GROUND - 14], [vx + 30, GROUND - 22]]) { put(img, ax, ay, C.rose); put(img, ax, ay - 1, C.rose); }

  // checkpoint bell F on the terrace
  const fx = 574, fy = 256;
  rect(img, fx, fy - 40, 3, 40, C.gold.lo); rect(img, fx, fy - 40, 1, 40, C.gold.base);
  rect(img, fx - 10, fy - 42, 22, 3, C.gold.base);
  trap(img, fy - 38, fy - 24, fx + 1, 3, 8, C.gold.base); rect(img, fx - 7, fy - 24, 17, 2, C.gold.lo);
  put(img, fx - 3, fy - 34, C.gold.hi); put(img, fx - 4, fy - 30, C.gold.hi);
  rect(img, fx, fy - 22, 3, 3, C.gold.lo);
  rect(img, fx + 3, fy - 40, 10, 5, hex("#8ff0e6")); rect(img, fx + 11, fy - 35, 3, 6, hex("#5fc9c0"));
  glow(img, fx + 1, fy - 30, 30, C.warm, 0.3);

  // echo moth (flyer) — pale wings, teal eyes
  const moth = canvas(20, 14);
  ellipse(moth, 5, 6, 5, 5, hex("#e7dcff")); ellipse(moth, 15, 6, 5, 5, hex("#e7dcff"));
  ellipse(moth, 5, 7, 2.5, 2.5, hex("#b8a6ee")); ellipse(moth, 15, 7, 2.5, 2.5, hex("#b8a6ee"));
  rect(moth, 9, 3, 2, 9, hex("#5b4a8a")); put(moth, 9, 4, hex("#8ff0e6")); put(moth, 10, 4, hex("#8ff0e6"));
  outline(moth, OUT);
  glow(img, 320, 150, 18, C.echo, 0.25);
  blit(img, moth, 310, 143);

  // ambient echo motes
  const mr = rng(19);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(mr() * W); const y = 60 + Math.floor(mr() * 220);
    if (i % 3 === 0) sparkle(img, x, y, C.echo, 1); else put(img, x, y, i % 2 ? C.echo : C.warm, 0.7);
  }

  // Anna, mid-stride, with two echo after-images and landing dust (juice)
  const ax = 276, ay = GROUND - 48;
  const run = paintAnna({ bob: 1, lean: 1, legLx: 4, legRx: -4, liftR: 3, armL: 4, armR: -4 });
  blit(img, run, ax - 22, ay, { tint: C.echo, alpha: 0.08 });
  blit(img, run, ax - 11, ay, { tint: C.echo, alpha: 0.18 });
  glow(img, ax + 16, ay + 30, 34, C.warm, 0.12);
  blit(img, run, ax, ay);
  for (const [dx, dy, rr] of [[-2, -2, 3], [-8, -4, 2], [-13, -2, 2], [-5, -6, 1]]) ellipse(img, ax + 8 + dx, GROUND + dy, rr, rr, hex("#f4eefb"), 0.85);
  // soft contact shadow
  dith(img, ax + 5, GROUND, 22, 1, OUT, 0.5, 0.5);

  vignette(img, 0.55);

  // --- UI (drawn after the vignette: UI is never darkened)
  hudPanel(img, 40, 8, 5, 24, 3, 1, "0:42", C.echo);
  // chapter ribbon (slides in on level start, fades after 2.5 s)
  const title = "1 · SOGLIA DEGLI ECHI";
  const tw = textW(title, 1) + 28;
  const tx = W / 2 - tw / 2;
  panel(img, tx, 12, tw, 17, { fill: hex("#3b2a66"), border: OUT, hi: hex("#6a58a8") });
  trap(img, 14, 27, tx - 6, 0.5, 6, hex("#2a1f4c")); trap(img, 14, 27, tx + tw + 6, 0.5, 6, hex("#2a1f4c"));
  text(img, title, tx + 14, 17, hex("#fff3d6"), { shadow: OUT });
  starIcon(img, tx + 3, 17, C.gold.base);
  starIcon(img, tx + tw - 10, 17, C.gold.base);
  // audio button slot (DOM, top-right) — kept free
  panel(img, W - 34, 8, 26, 26, { fill: hex("#2a2046"), border: OUT, hi: hex("#4b3f78"), alpha: 0.92 });
  rect(img, W - 26, 17, 4, 8, hex("#efe6ff")); trap(img, 13, 29, W - 20, 1, 6, hex("#efe6ff"));
  ring(img, W - 19, 21, 7, 1, hex("#efe6ff"), 0.8, true);

  save("mockup-level1.png", img);
}

// ================================================================================================
// MOCKUP 2 — Level 6 boss arena, La Dama dell'Eco (Tetto del Primo Ballo)
// ================================================================================================
function paintDama() {
  const img = canvas(56, 76);
  const V = { hi: hex("#a58ae6"), base: hex("#7658c4"), lo: hex("#523c96"), lo2: hex("#3a2a70") };
  const SKIN = hex("#eee3f8"); const SKIN_LO = hex("#cdbde6");
  const HAIR = { hi: hex("#f1ebff"), base: hex("#cfc3ea"), lo: hex("#9b8fc6") };
  const GOLD = hex("#e8b84a"); const ECHO = hex("#7ff3ff");
  // gown
  trap(img, 34, 70, 28, 8, 25, V.base);
  trap(img, 34, 70, 22, 4, 16, V.hi, 0.0);
  for (let y = 36; y < 70; y++) { const half = 8 + (17 * (y - 34)) / 36; rect(img, 28 - half, y, 3, 1, V.hi); rect(img, 28 + half - 6, y, 6, 1, V.lo); }
  for (const fx of [20, 28, 36]) for (let y = 42; y < 68; y++) put(img, fx + (y - 42) * (fx - 28) / 40, y, V.lo2);
  // dissolving hem: echo ripples
  for (let x = 3; x < 53; x++) for (let y = 66; y < 76; y++) if (((x * 3 + y * 5) % 7) < 3 && y - 66 < 10 - Math.abs(x - 28) / 4) put(img, x, y, y > 70 ? ECHO : V.lo);
  // bodice + sash
  rect(img, 22, 24, 12, 12, V.base); rect(img, 22, 24, 2, 12, V.hi); rect(img, 31, 24, 3, 12, V.lo);
  rect(img, 21, 34, 14, 2, GOLD);
  // sleeves: long translucent drapes
  for (const dir of [-1, 1]) for (let t = 0; t < 24; t++) rect(img, 28 + dir * (7 + t * 0.55) - (dir < 0 ? 3 : 0), 26 + t, 4, 1, hex("#c5b3ff"), 0.75);
  // neck + head
  rect(img, 26, 20, 4, 5, SKIN_LO);
  ellipse(img, 28, 14, 6.5, 7.5, SKIN);
  // hair up-do + side curls
  ellipse(img, 28, 6, 8, 6, HAIR.base); ellipse(img, 28, 3, 5, 4, HAIR.hi);
  rect(img, 20, 8, 3, 12, HAIR.base); rect(img, 33, 8, 3, 12, HAIR.lo);
  ellipse(img, 21, 20, 2, 2, HAIR.base); ellipse(img, 35, 20, 2, 2, HAIR.lo);
  // crescent tiara
  rect(img, 24, 1, 9, 1, GOLD); put(img, 28, 0, hex("#fff1c4"));
  // gold echo-mask with glowing eyes (the telegraph tell)
  rect(img, 22, 12, 13, 3, GOLD); rect(img, 22, 14, 13, 1, hex("#a9791f"));
  rect(img, 24, 12, 3, 2, ECHO); rect(img, 30, 12, 3, 2, ECHO);
  rect(img, 27, 18, 2, 1, hex("#9c4f7a"));
  outline(img, OUT);
  return img;
}

function mockBoss() {
  const img = canvas();
  const ECHO = hex("#7ff3ff"); const DANGER = hex("#ff5f7e"); const GOLD = { hi: hex("#ffe08a"), base: hex("#e8b84a"), lo: hex("#a5761f") };
  vgrad(img, 0, 0, W, H, [hex("#0d0a22"), hex("#1c1540"), hex("#33275e"), hex("#5a3f7a")]);
  const r = rng(42);
  for (let i = 0; i < 160; i++) {
    const x = Math.floor(r() * W); const y = Math.floor(r() * 230);
    if (i % 17 === 0) sparkle(img, x, y, hex("#fff3c4"), 2); else put(img, x, y, [240, 236, 255], 0.3 + r() * 0.7);
  }
  // moon with halo
  glow(img, 488, 96, 110, hex("#b9b3ff"), 0.28);
  ellipse(img, 488, 96, 44, 44, hex("#fff1d6"));
  ellipse(img, 488, 96, 44, 44, hex("#f0dcbc"), 1, (x, y) => x > 488 + 18 - (y - 96) * 0.2);
  for (const [cx, cy, cr] of [[474, 80, 7], [502, 110, 5], [470, 112, 4], [505, 78, 3]]) ellipse(img, cx, cy, cr, cr, hex("#ead5b3"));

  // far: castle spires silhouettes
  const far = hex("#241b48");
  for (const [sx, sw, sh] of [[20, 26, 150], [70, 18, 110], [120, 30, 180], [200, 20, 120], [590, 30, 170], [560, 18, 120]]) {
    rect(img, sx, H - sh, sw, sh, far);
    trap(img, H - sh - 36, H - sh, sx + sw / 2, 0.5, sw / 2 + 4, far);
    for (let wy = H - sh + 14; wy < H - 40; wy += 26) { rect(img, sx + sw / 2 - 2, wy, 3, 6, hex("#ffc76e")); glow(img, sx + sw / 2, wy + 3, 9, hex("#ffc76e"), 0.25); }
  }
  // mid: ballroom roof with rose window glow
  const mid = hex("#322663");
  trap(img, 180, 270, 250, 30, 200, mid);
  rect(img, 50, 250, 400, 40, mid);
  // roof courses + dormer windows so the mid layer isn't one flat shape
  for (let y = 190; y < 270; y += 8) {
    const half = 30 + ((y - 180) / 90) * 170;
    rect(img, 250 - half, y, half * 2, 1, hex("#3f3278"));
  }
  rect(img, 90, 250, 320, 2, hex("#4a3b86"));
  // dormers sit well above the arena floor: warm lights never share a row with danger markers
  for (const wx of [170, 200, 300, 330]) {
    rect(img, wx - 5, 226, 10, 12, hex("#241b48")); rect(img, wx - 3, 228, 6, 8, hex("#e0a060"));
    rect(img, wx - 1, 228, 1, 8, hex("#8a4a2a"));
  }
  ellipse(img, 250, 222, 20, 20, hex("#ffc76e"));
  for (let a = 0; a < 8; a++) line(img, 250, 222, 250 + Math.cos(a * 0.785) * 19, 222 + Math.sin(a * 0.785) * 19, hex("#b0622e"));
  glow(img, 250, 222, 60, hex("#ffb45e"), 0.3);

  // observatory dome (goal, right)
  const DOME = { hi: hex("#78c7b7"), base: hex("#4b9a8f"), lo: hex("#2f6a67") };
  ellipse(img, 596, 214, 42, 36, DOME.base, 1, (x, y) => y <= 214);
  ellipse(img, 596, 214, 42, 36, DOME.lo, 1, (x, y) => y <= 214 && x > 612);
  rect(img, 588, 178, 10, 36, hex("#140f2b"));
  for (let i = 0; i < 6; i++) put(img, 590 + (i * 3) % 7, 182 + i * 5, [255, 244, 210]);
  rect(img, 554, 214, 86, 60, hex("#5c4a8f")); rect(img, 554, 214, 86, 3, GOLD.base);
  rect(img, 582, 236, 26, 40, hex("#1d1538")); ellipse(img, 595, 236, 13, 10, hex("#1d1538"), 1, (x, y) => y <= 236);
  ring(img, 595, 252, 7, 1, ECHO, 0.9, true); glow(img, 595, 252, 22, ECHO, 0.3);

  // arena floor: verdigris copper shingles with a gold ridge
  const FLOOR = 276;
  const SHG = { hi: hex("#8fd6c2"), base: hex("#5fae9c"), lo: hex("#3f8078"), lo2: hex("#28575a") };
  rect(img, 0, FLOOR, W, H - FLOOR, SHG.lo2);
  for (let row = 0; row * 9 < H - FLOOR; row++) {
    for (let sx = -8 + (row % 2) * 8; sx < W; sx += 16) {
      const y0 = FLOOR + 6 + row * 9;
      const depth = row / 8;
      const base = mixc(SHG.base, SHG.lo2, Math.min(0.75, depth));
      ellipse(img, sx + 8, y0 + 4, 8, 7, mixc(SHG.lo, SHG.lo2, depth), 1, (x, y) => y >= y0);
      ellipse(img, sx + 8, y0 + 3, 7, 6, base, 1, (x, y) => y >= y0);
      rect(img, sx + 3, y0 + 1, 3, 1, mixc(SHG.hi, SHG.lo2, depth));
    }
  }
  rect(img, 0, FLOOR, W, 5, GOLD.base); rect(img, 0, FLOOR, W, 1, GOLD.hi); rect(img, 0, FLOOR + 5, W, 2, GOLD.lo); rect(img, 0, FLOOR + 7, W, 1, OUT);
  for (let fx = 16; fx < W; fx += 64) { ellipse(img, fx, FLOOR - 3, 3, 3, GOLD.base); put(img, fx - 1, FLOOR - 5, GOLD.hi); }

  // debris telegraph: 7 fixed slots, 3-slot safe lane (slots 2–4) stays clear
  const SLOT_W = 64; const SLOT0 = 96;
  for (let s = 0; s < 7; s++) {
    const cx = SLOT0 + s * SLOT_W + SLOT_W / 2;
    if (s >= 2 && s <= 4) continue;
    glow(img, cx, FLOOR, 26, DANGER, 0.45);
    ellipse(img, cx, FLOOR + 1, 16, 3, DANGER, 0.55);
    ring(img, cx, FLOOR - 16, 7, 1.2, DANGER, 0.9);
    rect(img, cx - 1, FLOOR - 20, 2, 5, DANGER); put(img, cx - 1, FLOOR - 13, DANGER); put(img, cx, FLOOR - 13, DANGER);
  }
  // falling star shards (lethal, after the telegraph) with trails
  for (const [s, fy] of [[0, 150], [6, 110], [1, 60]]) {
    const cx = SLOT0 + s * SLOT_W + SLOT_W / 2;
    for (let t = 0; t < 30; t++) put(img, cx + (t % 2), fy - t * 2, hex("#fff3c4"), (1 - t / 30) * 0.6);
    glow(img, cx, fy, 16, hex("#ffe08a"), 0.5);
    trap(img, fy - 6, fy + 1, cx, 0.5, 5, hex("#fff3c4")); trap(img, fy + 1, fy + 7, cx, 5, 0.5, hex("#ffd35a"));
    put(img, cx - 2, fy - 1, OUT); put(img, cx + 3, fy + 5, OUT);
  }

  // La Dama: silence-shock rings (telegraph) + two echo after-images
  const dama = paintDama();
  const dx = 300, dy = 76;
  glow(img, dx + 28, dy + 38, 80, hex("#8a6fd1"), 0.3);
  for (const [rr, a] of [[46, 0.8], [58, 0.5], [70, 0.25]]) ring(img, dx + 28, dy + 38, rr, 2, ECHO, a, rr > 50);
  blit(img, dama, dx - 22, dy + 4, { tint: ECHO, alpha: 0.14 });
  blit(img, dama, dx + 22, dy + 4, { tint: hex("#c5b3ff"), alpha: 0.14 });
  blit(img, dama, dx, dy);
  glow(img, dx + 25, dy + 13, 10, ECHO, 0.7); glow(img, dx + 31, dy + 13, 10, ECHO, 0.7);

  // Anna jumping in the safe lane (stretch frame), dust ring where she took off
  const ax = SLOT0 + 3 * SLOT_W + 16, ay = FLOOR - 92;
  const jump = paintAnna({ tuck: 3, legLx: -1, legRx: 1, armL: -3, armR: 3, hairLift: 2 });
  blit(img, jump, ax, ay);
  dith(img, ax + 8, FLOOR - 6, 18, 1, hex("#e9f7f2"), 0.5, 0.7);
  for (const [ddx, rr] of [[-2, 2], [30, 2], [4, 1], [24, 1]]) ellipse(img, ax + ddx, FLOOR - 3, rr + 1, rr, hex("#e9f7f2"), 0.8);
  dith(img, ax + 8, FLOOR - 1, 16, 1, OUT, 0.5, 0.45);

  vignette(img, 0.55);

  // UI: HUD + boss bar
  hudPanel(img, 40, 8, 16, 16, 2, 3, "3:18", hex("#ffd35a"));
  const name = "LA DAMA DELL'ECO";
  const bw = 190; const bx = W / 2 - bw / 2;
  panel(img, bx, 10, bw, 32, { fill: hex("#2a1d4c"), border: OUT, hi: hex("#5b47a0"), alpha: 0.94 });
  text(img, name, W / 2 - textW(name) / 2, 15, hex("#efe6ff"), { shadow: OUT });
  for (let i = 0; i < 4; i++) {
    const px = W / 2 - 2 * 38 + i * 38 + 4;
    panel(img, px, 27, 30, 9, { fill: i < 3 ? hex("#7ff3ff") : hex("#1a1233"), border: OUT, hi: i < 3 ? hex("#d6fdff") : null });
  }
  panel(img, W - 34, 8, 26, 26, { fill: hex("#2a2046"), border: OUT, hi: hex("#4b3f78"), alpha: 0.92 });
  rect(img, W - 26, 17, 4, 8, hex("#efe6ff")); trap(img, 13, 29, W - 20, 1, 6, hex("#efe6ff"));

  save("mockup-boss.png", img);
}

// ================================================================================================
// MOCKUP 3 — Menu / world select
// ================================================================================================
const WORLDS = [
  { n: 1, name: "SOGLIA", sky: ["#241c46", "#56478a"], far: "#3d3570", near: "#6564a0", ground: "#ddd4ee", accent: "#8ff0e6", stars: 3, shape: "arch" },
  { n: 2, name: "CHIOME", sky: ["#7ec8e3", "#d8f1e4"], far: "#6cc08a", near: "#3f8f6b", ground: "#7a4e3a", accent: "#b9a4f0", stars: 2, shape: "tree" },
  { n: 3, name: "ARCHIVIO", sky: ["#1e1b2e", "#4b3a63"], far: "#5a3829", near: "#8a5a3c", ground: "#b67a4d", accent: "#ffcf6b", stars: 0, shape: "shelf" },
  { n: 4, name: "FUCINA", sky: ["#2a1f3d", "#ff8a5b"], far: "#4a4458", near: "#2e2a38", ground: "#6e6680", accent: "#ffc24b", stars: -1, shape: "forge" },
  { n: 5, name: "MARE", sky: ["#0b1030", "#2e5fa8"], far: "#1c3c78", near: "#6a7fb0", ground: "#5ec4b0", accent: "#fff3c4", stars: -1, shape: "island" },
  { n: 6, name: "TETTO", sky: ["#140f2b", "#3a2a5e"], far: "#241b48", near: "#3f8c84", ground: "#e8b84a", accent: "#fff1d6", stars: -1, shape: "roof" },
];
function worldThumb(img, x, y, w, h, wd) {
  vgrad(img, x, y, w, h, [hex(wd.sky[0]), hex(wd.sky[1])], 6);
  const far = hex(wd.far); const near = hex(wd.near);
  if (wd.shape === "arch") for (let i = 0; i < 3; i++) { rect(img, x + 4 + i * 20, y + 8, 12, h - 12, far); ellipse(img, x + 10 + i * 20, y + 8, 6, 5, far, 1, (xx, yy) => yy <= y + 8); rect(img, x + 7 + i * 20, y + 10, 6, h - 16, hex(wd.sky[0])); }
  if (wd.shape === "tree") for (const [tx, tr] of [[12, 11], [34, 14], [56, 10]]) { rect(img, x + tx - 1, y + h - 14, 3, 10, hex("#7a4e3a")); ellipse(img, x + tx, y + h - 18, tr, tr * 0.8, near); for (const bx of [-4, 3]) { ellipse(img, x + tx + bx, y + h - 12, 2, 2, hex(wd.accent)); } }
  if (wd.shape === "shelf") for (let i = 0; i < 3; i++) { rect(img, x + 6 + i * 20, y + 10 + (i % 2) * 6, 16, 14, near); for (let b = 0; b < 4; b++) rect(img, x + 8 + i * 20 + b * 3, y + 12 + (i % 2) * 6, 2, 10, [hex("#c9533f"), hex("#f1e3c2"), hex("#5a7bd0"), hex("#e0a93f")][b]); glow(img, x + 14 + i * 20, y + 8, 8, hex(wd.accent), 0.5); }
  if (wd.shape === "forge") { rect(img, x + 8, y + 12, 22, h - 16, far); rect(img, x + 36, y + 6, 12, h - 10, near); ellipse(img, x + 19, y + h - 10, 6, 4, hex("#ff6a3d")); glow(img, x + 19, y + h - 10, 16, hex(wd.accent), 0.6); }
  if (wd.shape === "island") { for (const [ix, iy] of [[16, 26], [44, 18]]) { ellipse(img, x + ix, y + iy, 11, 4, near); ellipse(img, x + ix, y + iy - 3, 9, 3, hex(wd.ground)); } for (let i = 0; i < 10; i++) put(img, x + (i * 13) % w, y + 3 + (i * 7) % 14, hex(wd.accent)); rect(img, x, y + h - 8, w, 8, far); for (let i = 0; i < w; i += 5) put(img, x + i, y + h - 6, hex(wd.accent), 0.6); }
  if (wd.shape === "roof") { trap(img, y + 14, y + h - 4, x + w / 2, 3, w / 2, near); ellipse(img, x + w - 12, y + 10, 6, 6, hex(wd.accent)); rect(img, x, y + h - 5, w, 2, hex(wd.ground)); }
  rect(img, x, y + h - 4, w, 4, hex(wd.ground));
}

function mockMenu() {
  const img = canvas();
  const GOLD = { hi: hex("#ffe08a"), base: hex("#e0a93f"), lo: hex("#a36d25") };
  vgrad(img, 0, 0, W, H, [hex("#120c28"), hex("#261c4e"), hex("#473773"), hex("#7a5b8e")]);
  const r = rng(11);
  for (let i = 0; i < 120; i++) put(img, Math.floor(r() * W), Math.floor(r() * 220), [240, 236, 255], 0.3 + r() * 0.7);
  glow(img, 520, 70, 90, hex("#c4c0ff"), 0.3);
  ellipse(img, 520, 70, 26, 26, hex("#fff1d6"));
  ellipse(img, 511, 62, 5, 4, hex("#efdcbc")); ellipse(img, 530, 80, 4, 3, hex("#efdcbc"));
  // far castle roofs
  const far = hex("#2b2052");
  for (let x = 0; x < W; x += 1) { const hgt = 70 + Math.floor(Math.abs(Math.sin(x / 50)) * 30) + (x % 90 < 14 ? 50 : 0); rect(img, x, H - hgt - 40, 1, hgt + 40, far); }
  for (let i = 0; i < 14; i++) { const wx = (i * 47 + 20) % W; rect(img, wx, 250 + (i % 3) * 8, 3, 5, hex("#ffc76e")); glow(img, wx + 1, 252 + (i % 3) * 8, 8, hex("#ffc76e"), 0.3); }

  // balcony floor + balustrade (foreground)
  rect(img, 0, 312, W, 48, hex("#6b5a8e")); rect(img, 0, 312, W, 2, hex("#b3a6d6")); rect(img, 0, 314, W, 4, hex("#8b7bb2"));
  for (let bx = 0; bx < W; bx += 14) { rect(img, bx + 3, 286, 6, 26, hex("#9d8fc0")); rect(img, bx + 2, 294, 8, 6, hex("#b3a6d6")); rect(img, bx + 7, 286, 2, 26, hex("#6f5f9a")); }
  rect(img, 0, 280, W, 7, hex("#c3b6e3")); rect(img, 0, 280, W, 1, hex("#efe6ff")); rect(img, 0, 287, W, 1, OUT);
  // hanging lanterns
  for (const lx of [40, 600]) { line(img, lx, 0, lx, 40, GOLD.lo); rect(img, lx - 5, 40, 10, 14, GOLD.base); rect(img, lx - 3, 43, 6, 8, hex("#fff1c4")); glow(img, lx, 47, 40, hex("#ffd9a0"), 0.35); }

  // logo (placeholder title — the p2.brand.* copy is the story section's call)
  const l1 = "IL VALZER";
  const l2 = "INCOMPIUTO";
  glow(img, W / 2, 56, 150, hex("#8a6fd1"), 0.25);
  text(img, l1, W / 2 - textW(l1, 4) / 2, 22, GOLD.base, { scale: 4, shadow: hex("#2a1a44"), outlineCol: OUT, grad: [GOLD.hi, GOLD.lo] });
  text(img, l2, W / 2 - textW(l2, 3) / 2, 58, hex("#efe6ff"), { scale: 3, shadow: hex("#2a1a44"), outlineCol: OUT, grad: [hex("#ffffff"), hex("#b8a6ee")] });
  const sub = "PRINCIPESSA · PARTE 2";
  panel(img, W / 2 - textW(sub) / 2 - 10, 86, textW(sub) + 20, 15, { fill: hex("#3b2a66"), border: OUT, hi: hex("#6a58a8") });
  text(img, sub, W / 2 - textW(sub) / 2, 90, hex("#8ff0e6"), { shadow: OUT });
  sparkle(img, W / 2 - 132, 30, GOLD.hi, 3); sparkle(img, W / 2 + 134, 50, hex("#8ff0e6"), 3);

  // world select: 6 cards
  panel(img, 18, 112, 244, 162, { fill: hex("#1f1740"), border: OUT, hi: hex("#4b3f78"), alpha: 0.9 });
  text(img, "IL TUO VIAGGIO", 30, 120, GOLD.hi, { shadow: OUT });
  WORLDS.forEach((wd, i) => {
    const cx = 28 + (i % 3) * 78;
    const cy = 136 + Math.floor(i / 3) * 68;
    const sel = i === 1;
    const locked = wd.stars < 0;
    panel(img, cx - 2, cy - 2, 72, 62, { fill: sel ? GOLD.base : hex("#2d2356"), border: OUT, hi: sel ? GOLD.hi : hex("#4b3f78") });
    worldThumb(img, cx + 2, cy + 2, 64, 40, wd);
    rect(img, cx + 2, cy + 2, 64, 1, [255, 255, 255], 0.25);
    if (locked) {
      dith(img, cx + 2, cy + 2, 64, 40, hex("#0e0a1e"), 0.75);
      rect(img, cx + 29, cy + 18, 10, 9, hex("#9d8fc0")); ring(img, cx + 34, cy + 17, 4, 1.4, hex("#9d8fc0")); rect(img, cx + 33, cy + 21, 2, 3, OUT);
    }
    panel(img, cx, cy, 13, 12, { fill: sel ? hex("#fff3d6") : hex("#3b2a66"), border: OUT });
    text(img, String(wd.n), cx + 4, cy + 3, sel ? OUT : hex("#efe6ff"));
    for (let s = 0; s < 3; s++) starIcon(img, cx + 6 + s * 10, cy + 46, wd.stars > s ? hex("#ffd35a") : hex(sel ? "#a36d25" : "#4a3a5e"));
    if (sel) { trap(img, cy - 9, cy - 3, cx + 34, 4, 0.5, GOLD.hi); rect(img, cx + 32, cy - 12, 4, 3, GOLD.hi); }
  });

  // hero on a pedestal in a spotlight (integer ×2 of the gameplay sprite)
  glow(img, 520, 230, 70, hex("#ffd9a0"), 0.4);
  ellipse(img, 520, 280, 40, 7, hex("#2a1d4c"));
  ellipse(img, 520, 277, 38, 6, hex("#9d8fc0")); ellipse(img, 520, 276, 34, 4, hex("#c3b6e3"));
  blit(img, paintAnna({ bob: 0 }), 488, 180, { scale: 2 });
  sparkle(img, 470, 190, hex("#fff3c4"), 2); sparkle(img, 572, 214, hex("#8ff0e6"), 2);

  // buttons (9-slice pixel bevel)
  const button = (label, y, primary) => {
    const bw = primary ? 150 : 120; const bh = primary ? 30 : 22;
    const bx = 364 - bw / 2;
    rect(img, bx + 2, y + 3, bw, bh, OUT, 0.5);
    panel(img, bx, y, bw, bh, { fill: primary ? GOLD.base : hex("#efe6ff"), border: OUT, hi: primary ? GOLD.hi : hex("#ffffff") });
    rect(img, bx + 2, y + bh - 4, bw - 4, 2, primary ? GOLD.lo : hex("#b8a6ee"));
    const sc = primary ? 2 : 1;
    text(img, label, bx + bw / 2 - textW(label, sc) / 2, y + (bh - 7 * sc) / 2 - 1, primary ? hex("#2a1a44") : hex("#3b2a66"));
  };
  button("GIOCA", 150, true);
  button("CLASSIFICA", 196, false);
  button("GUARDAROBA", 226, false);
  button("OPZIONI", 256, false);
  text(img, "MONDO 2 · CHIOME DELLE CAMPANELLE", 186, 330, hex("#fff3d6"), { shadow: OUT });

  vignette(img, 0.35);
  // DOM chrome slots: share pill top-left, audio top-right
  panel(img, 8, 8, 104, 22, { fill: hex("#2a2046"), border: OUT, hi: hex("#4b3f78"), alpha: 0.92 });
  text(img, "SFIDA UN'AMICA", 16, 16, hex("#efe6ff"));
  panel(img, W - 34, 8, 26, 26, { fill: hex("#2a2046"), border: OUT, hi: hex("#4b3f78"), alpha: 0.92 });
  rect(img, W - 26, 17, 4, 8, hex("#efe6ff")); trap(img, 13, 29, W - 20, 1, 6, hex("#efe6ff"));

  save("mockup-menu.png", img);
}

// ================================================================================================
// Sheet — heroine resolution + frame budget, and the six world palettes
// ================================================================================================
function mockSheet() {
  const img = canvas(640, 360);
  rect(img, 0, 0, 640, 360, hex("#1b1433"));
  text(img, "PART 1 · 16X24 NATIVE", 16, 12, hex("#c9bde8"));
  text(img, "PART 2 · 32X48 NATIVE (SAME 64X96 CELL)", 176, 12, hex("#8ff0e6"));
  // both drawn at the same on-screen size: P1 ×4, P2 ×2
  panel(img, 12, 26, 144, 124, { fill: hex("#2a2046"), border: OUT });
  blit(img, paintPart1Anna(), 36, 34, { scale: 4 });
  const poses = [
    ["IDLE", { bob: 0 }], ["RUN", { bob: 1, legLx: 3, legRx: -3, liftR: 2, armL: 3, armR: -3 }],
    ["RUN", { bob: 0, legLx: -3, legRx: 3, liftL: 2, armL: -3, armR: 3 }], ["JUMP", { tuck: 3, legLx: -1, legRx: 1, armL: -3, armR: 3, hairLift: 2 }],
    ["FALL", { liftR: 1, armL: -4, armR: 4, hairLift: 3 }], ["LAND", { bob: 2, tuck: 2, armL: 1, armR: -1 }],
  ];
  poses.forEach(([label, p], i) => {
    const x = 172 + i * 76;
    panel(img, x - 4, 26, 72, 124, { fill: hex("#2a2046"), border: OUT });
    blit(img, paintAnna(p), x, 34, { scale: 2 });
    text(img, label, x + 32 - textW(label) / 2, 136, hex("#efe6ff"));
  });
  text(img, "WORLD PALETTES", 16, 166, hex("#ffd35a"));
  const PAL = [
    ["1 SOGLIA DEGLI ECHI", ["#140f2a", "#3a2f66", "#6564a0", "#bdb2d8", "#f4eefb", "#e0a93f", "#8ff0e6", "#ff8fa3"]],
    ["2 CHIOME CAMPANELLE", ["#1f4a4f", "#3f8f6b", "#6cc08a", "#7ec8e3", "#d8f1e4", "#7a4e3a", "#b9a4f0", "#f2c14e"]],
    ["3 ARCHIVIO SOSPESO", ["#1e1b2e", "#3b2f4f", "#5a3829", "#8a5a3c", "#b67a4d", "#f1e3c2", "#ffcf6b", "#9fb7ff"]],
    ["4 FUCINA DELL'ALBA", ["#2a1f3d", "#2e2a38", "#4a4458", "#6e6680", "#d49a3a", "#ff6a3d", "#ffc24b", "#f0e6dc"]],
    ["5 MARE DELLE STELLE", ["#0b1030", "#1c3c78", "#2e5fa8", "#6a7fb0", "#5ec4b0", "#8ef6ff", "#fff3c4", "#f58fc0"]],
    ["6 TETTO PRIMO BALLO", ["#140f2b", "#3a2a5e", "#28575a", "#5fae9c", "#8fd6c2", "#e8b84a", "#ffc76e", "#7ff3ff"]],
  ];
  PAL.forEach(([name, cols], i) => {
    const y = 180 + i * 29;
    text(img, name, 16, y + 8, hex("#efe6ff"));
    cols.forEach((c, j) => panel(img, 150 + j * 30, y, 28, 24, { fill: hex(c), border: OUT }));
    worldThumb(img, 400, y, 64, 24, { ...WORLDS[i], sky: WORLDS[i].sky });
  });
  text(img, "FRAME BUDGET", 486, 182, hex("#ffd35a"));
  ["IDLE 6 · RUN 8", "JUMP 2 · FALL 2", "LAND 2 · HURT 3", "SKID 2 · WIN 4", "ENEMY 4-6 PER LOOP", "BOSS 24 TOTAL"].forEach((l, i) =>
    text(img, l, 486, 198 + i * 13, hex("#c9bde8")));
  save("mockup-heroine-palettes.png", img);
}

mockLevel1();
mockBoss();
mockMenu();
mockSheet();
