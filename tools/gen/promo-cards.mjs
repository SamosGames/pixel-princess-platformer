// Build bold Yandex/social promo cards from the game's own pixel art.
// Run: `node tools/gen/promo-cards.mjs`.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ASSETS = join(ROOT, "assets");
const OUT = join(ROOT, "promo", "cards");
const TMP = mkdtempSync(join(tmpdir(), "pixel-princess-cards-"));

mkdirSync(join(OUT, "vertical"), { recursive: true });

const colors = {
  ink: "#21172f",
  panel: "#4f214d",
  panelDark: "#281a3f",
  cream: "#fff9ed",
  gold: "#ffd34e",
  pink: "#ff7d9c",
  cyan: "#72dfff",
};

const uri = (file) => `data:image/png;base64,${readFileSync(file).toString("base64")}`;
const asset = (name) => uri(join(ASSETS, name));
const crop = (name, source, geometry) => {
  const file = join(TMP, name);
  execFileSync("magick", [source, "-crop", geometry, "+repage", file]);
  return uri(file);
};

let regalSheet = join(TMP, "anna-regal-0.png");
execFileSync("magick", [join(ASSETS, "sprites/anna.png"), regalSheet]);
for (const [index, layer] of ["skirt", "bodice", "necklace", "crown", "gloves", "cape"].entries()) {
  const next = join(TMP, `anna-regal-${index + 1}.png`);
  execFileSync("magick", [regalSheet, join(ASSETS, `sprites/${layer}.png`), "-compose", "over", "-composite", next]);
  regalSheet = next;
}
const anna = crop("anna.png", regalSheet, "64x96+0+0");
const crown = crop("crown.png", join(ASSETS, "sprites/crown.png"), "64x48+0+0");
const apple = crop("apple.png", join(ASSETS, "sprites/apple.png"), "48x48+0+0");
const pearl = crop("pearl.png", join(ASSETS, "sprites/pearl.png"), "48x48+0+0");
const crystal = crop("crystal.png", join(ASSETS, "sprites/crystal.png"), "48x48+0+0");
const goblet = crop("goblet.png", join(ASSETS, "sprites/goblet.png"), "48x48+0+0");
const logo = asset("sprites/logo.png");

const images = {
  forest: asset("backgrounds/forest_sky.png"),
  forestMid: asset("backgrounds/forest_mid.png"),
  forestNear: asset("backgrounds/forest_near.png"),
  coral: asset("backgrounds/coral_sky.png"),
  coralMid: asset("backgrounds/coral_mid.png"),
  coralNear: asset("backgrounds/coral_near.png"),
  snow: asset("backgrounds/snow_sky.png"),
  snowMid: asset("backgrounds/snow_mid.png"),
  snowNear: asset("backgrounds/snow_near.png"),
  castle: asset("backgrounds/castle_sky.png"),
  castleMid: asset("backgrounds/castle_mid.png"),
  castleNear: asset("backgrounds/castle_near.png"),
};

const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const img = (href, x, y, width, height, extra = "") =>
  `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" ${extra}/>`;
const pixelImg = (href, x, y, width, height) =>
  img(href, x, y, width, height, `style="image-rendering:pixelated"`);

function defs() {
  return `<defs>
  <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#09152a" stop-opacity=".58"/>
    <stop offset=".55" stop-color="#09152a" stop-opacity=".08"/>
    <stop offset="1" stop-color="#09152a" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colors.panel}"/>
    <stop offset="1" stop-color="${colors.panelDark}"/>
  </linearGradient>
  <linearGradient id="heroGlow" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colors.pink}" stop-opacity=".45"/>
    <stop offset="1" stop-color="${colors.gold}" stop-opacity=".06"/>
  </linearGradient>
  </defs>`;
}

function scene(bg, mid, near, width, height) {
  return `${img(bg, 0, 0, width, height)}
  ${img(mid, 0, height - 350, width, 350)}
  ${img(near, 0, height - 290, width, 290)}
  <rect width="${width}" height="${height}" fill="url(#topShade)"/>`;
}

function badge(text, x = 42, y = 42, size = 19) {
  const width = Math.max(260, text.length * size * 0.8 + 60);
  return `<rect x="${x}" y="${y}" width="${width}" height="42" rx="21" fill="${colors.gold}"/>
  <text x="${x + width / 2}" y="${y + 28}" text-anchor="middle" fill="${colors.ink}" font-family="Montserrat, Avenir Next, Arial, sans-serif" font-size="${size}px" font-weight="900" letter-spacing=".4">${esc(text)}</text>`;
}

function headline(lines, x, y, size, lineHeight = Math.round(size * 0.9)) {
  return `<text x="${x}" y="${y}" fill="${colors.cream}" stroke="${colors.ink}" stroke-width="${Math.max(8, Math.round(size * 0.12))}" stroke-linejoin="round" paint-order="stroke fill" font-family="Montserrat, Avenir Next, Arial, sans-serif" font-size="${size}px" font-weight="900" letter-spacing="-1.5">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${esc(line)}</tspan>`).join("")}</text>`;
}

function subtitle(text, x, y, size = 23) {
  return `<text x="${x}" y="${y}" fill="${colors.gold}" font-family="Montserrat, Avenir Next, Arial, sans-serif" font-size="${size}px" font-weight="800" letter-spacing=".2">${esc(text)}</text>`;
}

function princess(x, y, scale) {
  const width = 64 * scale;
  const height = 96 * scale;
  return `<ellipse cx="${x + width / 2}" cy="${y + height * .58}" rx="${width * .72}" ry="${height * .62}" fill="url(#heroGlow)"/>
  ${pixelImg(anna, x, y, width, height)}`;
}

function collectible(href, x, y, scale = 2.3) {
  return pixelImg(href, x, y, 48 * scale, 48 * scale);
}

function cardBody(config, width, height, vertical = false) {
  const panelY = vertical ? 760 : 415;
  const panelHeight = height - panelY;
  const titleX = vertical ? 42 : 52;
  const titleY = vertical ? 895 : 515;
  const titleSize = vertical ? 64 : 68;
  const lineHeight = vertical ? 66 : 70;
  const heroX = vertical ? 412 : 1000;
  const heroY = vertical ? 350 : 200;
  const heroScale = vertical ? 4.8 : 4.3;
  const topLogo = vertical ? 44 : 42;
  const sceneMarkup = scene(config.bg, config.mid, config.near, width, height);
  const panel = `<path d="M0 ${panelY + 22} L${width} ${panelY - 18} L${width} ${height} L0 ${height} Z" fill="url(#panel)" opacity=".98"/>
    <path d="M0 ${panelY + 22} L${width} ${panelY - 18}" stroke="${colors.gold}" stroke-width="6" opacity=".92"/>`;
  const title = headline(vertical && config.verticalLines ? config.verticalLines : config.lines, titleX, titleY, titleSize, lineHeight);
  const sub = subtitle(config.sub, titleX + 4, vertical ? height - 82 : height - 70, vertical ? 21 : 23);
  const brand = `<text x="${vertical ? 42 : 52}" y="${vertical ? 128 : 122}" fill="${colors.cream}" font-family="Montserrat, Avenir Next, Arial, sans-serif" font-size="${vertical ? 27 : 26}px" font-weight="800" letter-spacing=".5">ПРИНЦЕССА: ПУТЬ К КОРОНЕ</text>`;
  const mark = pixelImg(logo, width - (vertical ? 110 : 132), topLogo, vertical ? 58 : 70, vertical ? 87 : 105);
  return `${sceneMarkup}${badge(config.badge, vertical ? 42 : 52, vertical ? 52 : 48, vertical ? 16 : 18)}${brand}${mark}${panel}
    ${title}${sub}${princess(heroX, heroY, heroScale)}
    ${collectible(config.collectible, vertical ? 48 : 70, vertical ? 700 : 365, vertical ? 2.2 : 2.3)}
    ${collectible(config.collectible, vertical ? 132 : 170, vertical ? 650 : 315, vertical ? 1.5 : 1.7)}
    <circle cx="${vertical ? 620 : 930}" cy="${vertical ? 590 : 322}" r="${vertical ? 42 : 34}" fill="${colors.gold}" opacity=".24"/>
    ${pixelImg(crown, vertical ? 584 : 900, vertical ? 548 : 286, vertical ? 72 : 60, vertical ? 54 : 45)}`;
}

function render(name, width, height, config, vertical = false) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${defs()}
    ${cardBody(config, width, height, vertical)}
  </svg>`;
  const source = join(TMP, `${name}.svg`);
  const raw = join(TMP, `${name}.png`);
  const output = join(OUT, vertical ? "vertical" : "", `${name}.png`);
  writeFileSync(source, svg);
  execFileSync("rsvg-convert", ["-w", String(width), "-h", String(height), "-o", raw, source]);
  execFileSync("magick", [raw, "-alpha", "remove", "-alpha", "off", output]);
  console.log(`${output} -> ${width}x${height}`);
}

const cards = [
  { name: "card-01-apples", badge: "ЗАКОЛДОВАННЫЙ ЛЕС", lines: ["СОБЕРИ", "ВСЕ ЯБЛОКИ"], sub: "ПРЫГАЙ • ИЗБЕГАЙ ЛОВУШЕК • БЕГИ К КОРОНЕ", bg: images.forest, mid: images.forestMid, near: images.forestNear, collectible: apple },
  { name: "card-02-worlds", badge: "ПРИКЛЮЧЕНИЕ В 6 МИРАХ", lines: ["ПРОЙДИ", "6 МИРОВ"], sub: "КОРАЛЛЫ • СНЕГ • САД • КОРОЛЕВСКИЙ ЗАМОК", bg: images.coral, mid: images.coralMid, near: images.coralNear, collectible: pearl },
  { name: "card-03-keeper", badge: "ФИНАЛЬНАЯ БИТВА", lines: ["ПОБЕДИ", "ХРАНИТЕЛЯ"], sub: "ДОБЕРИСЬ ДО БАЛЬНОГО ЗАЛА", bg: images.castle, mid: images.castleMid, near: images.castleNear, collectible: goblet },
  { name: "card-04-record", badge: "ЗАБЕГ ЗА РЕКОРДОМ", lines: ["ПОПАДИ В", "ТАБЛИЦУ ЛИДЕРОВ"], verticalLines: ["ПОПАДИ В", "ТАБЛИЦУ", "ЛИДЕРОВ"], sub: "ОДИН ЗАБЕГ • ТВОЁ ЛУЧШЕЕ ВРЕМЯ", bg: images.snow, mid: images.snowMid, near: images.snowNear, collectible: crystal },
];

for (const config of cards) {
  render(config.name, 1280, 720, config);
  render(config.name, 720, 1280, config, true);
}

rmSync(TMP, { recursive: true, force: true });
