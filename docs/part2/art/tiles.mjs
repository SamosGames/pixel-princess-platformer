// tiles.mjs — procedural Part 2 tile kits (hybrid direction: tiles stay procedural) in each world's
// LOCKED palette, with 4-bit exposure-mask autotiling and terrace contact shadows (06-art.md §3.5).
// Review prototype, not the generator: run `node docs/part2/art/tiles.mjs` to write the atlases
// to docs/part2/art/proc/tiles-*.png. The painter only ever writes palette colours.
//
// Native tile 32×32 (drawn ×2 = 64 runtime). Mask bits: 1 = N open, 2 = E open, 4 = S open,
// 8 = W open. "open" = the neighbour cell is air.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodePNG, upscale } from "../../../tools/gen/px.mjs";

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
export const T = 32;
export const N = 1, E = 2, S = 4, Wd = 8;

export const TILE_PAL = {
  w1: { // marble with a gold cornice — Soglia degli Echi
    outline: hex("#241c46"), deep: hex("#3a2f66"), lo2: hex("#4d4585"), lo: hex("#6564a0"), mid: hex("#8e8cc6"),
    base: hex("#bdb2d8"), hi: hex("#ddd4ee"), top: hex("#f4eefb"), trim: hex("#e0a93f"), trimLo: hex("#a36d25"),
  },
  w6: { // verdigris copper shingles with a gold ridge — Tetto del Primo Ballo
    outline: hex("#140f2b"), deep: hex("#1f4648"), lo2: hex("#28575a"), lo: hex("#3f8078"), mid: hex("#5fae9c"),
    base: hex("#5fae9c"), hi: hex("#8fd6c2"), top: hex("#ffe08a"), trim: hex("#e8b84a"), trimLo: hex("#a5761f"),
  },
};

const img = (w, h) => ({ w, h, buf: new Uint8Array(w * h * 4) });
function put(t, x, y, c, a = 255) {
  if (x < 0 || y < 0 || x >= t.w || y >= t.h) return;
  const i = (y * t.w + x) * 4;
  t.buf[i] = c[0]; t.buf[i + 1] = c[1]; t.buf[i + 2] = c[2]; t.buf[i + 3] = a;
}
const rect = (t, x, y, w, h, c) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(t, xx, yy, c); };
const hash = (a, b) => (((a * 73856093) ^ (b * 19349663)) >>> 0) % 997;

function bodyW1(t, p, depth, seed) {
  // brick courses 16 px tall, offset every other course; light from the upper left
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const course = Math.floor(y / 16);
    const bx = (x + (course % 2 ? 16 : 0)) % 16;
    const by = y % 16;
    let c = depth ? p.mid : p.base;
    if (by === 0 || bx === 0) c = depth ? p.lo2 : p.lo;
    else if (by === 1 || bx === 1) c = depth ? p.base : p.hi;
    else if (by === 15 || bx === 15) c = depth ? p.lo : p.mid;
    put(t, x, y, c);
  }
  // veins (variant by seed)
  for (let k = 0; k < 3; k++) {
    const vx = 3 + ((seed * (k + 3)) % 24), vy = 4 + ((seed * (k + 7)) % 22);
    put(t, vx, vy, depth ? p.hi : p.top); put(t, vx + 1, vy + 1, depth ? p.hi : p.top);
  }
}
function bodyW6(t, p, depth, seed) {
  // overlapping scallop shingles, 8 px rows, half offset
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const row = Math.floor(y / 8), ly = y % 8;
    const sx = (x + (row % 2 ? 4 : 0)) % 8;
    const dx = sx - 3.5, arc = Math.sqrt(Math.max(0, 16 - dx * dx));
    let c = depth ? p.lo2 : p.lo;
    if (ly > 8 - arc) c = depth ? p.lo : p.mid;
    if (ly === 7 || (ly >= 6 && Math.abs(dx) > 3)) c = depth ? p.deep : p.lo2;
    if (ly === 1 && Math.abs(dx) < 2) c = depth ? p.mid : p.hi;
    put(t, x, y, c);
  }
  if (seed % 5 === 0) { put(t, 12, 12, p.hi); put(t, 13, 12, p.hi); }
}

/** Paint one tile. contactE/contactW: a solid wall rises right/left of an open top (terrace step). */
export function paintTile(world, mask, { depth = false, seed = 0, contactE = false, contactW = false } = {}) {
  const p = TILE_PAL[world];
  const t = img(T, T);
  (world === "w1" ? bodyW1 : bodyW6)(t, p, depth, seed);
  if (mask & N) {
    if (world === "w1") {
      rect(t, 0, 0, T, 2, p.top); rect(t, 0, 2, T, 4, p.hi); rect(t, 0, 6, T, 1, p.trim); rect(t, 0, 7, T, 1, p.trimLo);
      rect(t, 0, 8, T, 1, p.lo); rect(t, 0, 9, T, 1, p.lo2);
    } else {
      rect(t, 0, 0, T, 1, p.top); rect(t, 0, 1, T, 3, p.trim); rect(t, 0, 4, T, 1, p.trimLo); rect(t, 0, 5, T, 1, p.outline);
      for (let x = 2; x < T; x += 8) { put(t, x, 0, p.trimLo); }
    }
    if (contactE) for (let y = 0; y < 10; y++) for (let x = T - 4; x < T; x++) put(t, x, y, y < 2 ? p.mid : p.lo2);
    if (contactW) for (let y = 0; y < 10; y++) for (let x = 0; x < 3; x++) put(t, x, y, y < 2 ? p.hi : p.lo);
  }
  if (mask & Wd) { rect(t, 0, 0, 1, T, p.outline); rect(t, 1, mask & N ? 2 : 0, 1, T, p.hi); }
  if (mask & E) { rect(t, T - 1, 0, 1, T, p.outline); rect(t, T - 2, mask & N ? 2 : 0, 1, T, p.lo2); }
  if (mask & S) { rect(t, 0, T - 1, T, 1, p.outline); rect(t, 0, T - 3, T, 2, p.deep); }
  // rounded outer corners
  if ((mask & N) && (mask & Wd)) { put(t, 0, 0, [0, 0, 0], 0); put(t, 1, 0, p.outline); put(t, 0, 1, p.outline); }
  if ((mask & N) && (mask & E)) { put(t, T - 1, 0, [0, 0, 0], 0); put(t, T - 2, 0, p.outline); put(t, T - 1, 1, p.outline); }
  if ((mask & S) && (mask & Wd)) { put(t, 0, T - 1, [0, 0, 0], 0); }
  if ((mask & S) && (mask & E)) { put(t, T - 1, T - 1, [0, 0, 0], 0); }
  return t;
}

/** Autotile a boolean grid (grid[r][c] = solid). Off-map columns count as solid (no caps at the
 *  screen border); below the map counts as solid. Returns painted tiles with positions. */
export function autotile(world, grid) {
  const R = grid.length, C = grid[0].length;
  const solid = (r, c) => (c < 0 || c >= C || r >= R ? true : r < 0 ? false : grid[r][c]);
  const out = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (!grid[r][c]) continue;
    const mask = (solid(r - 1, c) ? 0 : N) | (solid(r, c + 1) ? 0 : E) | (solid(r + 1, c) ? 0 : S) | (solid(r, c - 1) ? 0 : Wd);
    const depth = solid(r - 1, c) && solid(r - 2, c);
    const contactE = !!(mask & N) && solid(r, c + 1) && solid(r - 1, c + 1);
    const contactW = !!(mask & N) && solid(r, c - 1) && solid(r - 1, c - 1);
    out.push({ r, c, tile: paintTile(world, mask, { depth, seed: hash(r, c), contactE, contactW }) });
  }
  return out;
}

/** Atlas of all 16 masks (row 1) + depth fill and contact variants (row 2), for review. */
export function atlas(world) {
  const a = img(16 * T, 2 * T);
  const blit = (t, dx, dy) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const s = (y * T + x) * 4; if (t.buf[s + 3]) put(a, dx + x, dy + y, [t.buf[s], t.buf[s + 1], t.buf[s + 2]]); } };
  for (let m = 0; m < 16; m++) blit(paintTile(world, m, { seed: m * 7 }), m * T, 0);
  const extras = [{ depth: true }, { depth: true, seed: 5 }, { contactE: true }, { contactW: true }];
  extras.forEach((o, i) => blit(paintTile(world, i < 2 ? 0 : N, o), i * T, T));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = join(dirname(fileURLToPath(import.meta.url)), "proc");
  mkdirSync(out, { recursive: true });
  for (const w of ["w1", "w6"]) {
    writeFileSync(join(out, `tiles-${w}-atlas-x4.png`), encodePNG(upscale(atlas(w), 4)));
    console.log(`wrote proc/tiles-${w}-atlas-x4.png`);
  }
}
