// promo.mjs — deterministic Yandex Games promo pack, composed from the game's own pixel art.
// Run: `npm run promo`. PNGs are written outside the runtime bundle in /promo for console upload.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "promo");
const TMP = mkdtempSync(join(tmpdir(), "pixel-princess-promo-"));
const ASSETS = join(ROOT, "assets");
const TITLE = "Принцесса: Путь к короне";
const colors = {
  night: "#17233d",
  blue: "#26325c",
  cream: "#fff8e6",
  gold: "#f0c84b",
  rose: "#e99ab0",
  wine: "#762d4c",
};

mkdirSync(OUT, { recursive: true });

const dataUri = (file) => `data:image/png;base64,${readFileSync(file).toString("base64")}`;
const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const png = (name) => dataUri(join(ASSETS, name));

const forest = png("backgrounds/forest_sky.png");
const castle = png("backgrounds/castle_sky.png");
const garden = png("backgrounds/garden_mid.png");
const icon = png("icons/icon-512.png");
const logo = png("sprites/logo.png");
const annaFile = join(TMP, "anna-idle.png");
execFileSync("magick", [join(ASSETS, "sprites/anna.png"), "-crop", "64x96+0+0", "+repage", annaFile]);
const anna = dataUri(annaFile);

function render(name, width, height, body, rgb = false) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${colors.night}" stop-opacity=".96"/>
      <stop offset=".62" stop-color="${colors.night}" stop-opacity=".28"/>
      <stop offset="1" stop-color="${colors.night}" stop-opacity=".06"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${colors.night}" stop-opacity="0"/>
      <stop offset="1" stop-color="${colors.night}" stop-opacity=".9"/>
    </linearGradient>
  </defs>
  ${body}
</svg>`;
  const source = join(TMP, `${name}.svg`);
  const raw = join(TMP, `${name}-raw.png`);
  const output = join(OUT, `${name}.png`);
  writeFileSync(source, svg);
  execFileSync("rsvg-convert", ["-w", String(width), "-h", String(height), "-o", raw, source]);
  if (rgb) execFileSync("magick", [raw, "-alpha", "remove", "-alpha", "off", output]);
  else copyFileSync(raw, output);
  console.log(`${name}.png -> ${width}x${height}`);
}

const hero = (x, y, w, h) => `
  <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 64 96" preserveAspectRatio="none">
    <image href="${anna}" x="0" y="0" width="64" height="96" preserveAspectRatio="none" style="image-rendering:pixelated"/>
  </svg>`;
const star = (x, y, r = 4) => `<rect x="${x}" y="${y}" width="${r}" height="${r}" fill="${colors.cream}" opacity=".82"/>`;
const title = (x, y, size, anchor = "start") => `
  <text x="${x}" y="${y}" fill="${colors.cream}" font-family="Arial, sans-serif" font-size="${size}px" font-weight="700" text-anchor="${anchor}">${esc(TITLE)}</text>`;
const titleTwoLines = (x, y, size) => `
  <text x="${x}" y="${y}" fill="${colors.cream}" font-family="Arial, sans-serif" font-size="${size}px" font-weight="700">
    <tspan x="${x}" dy="0">Принцесса:</tspan>
    <tspan x="${x}" dy="${Math.round(size * 1.15)}">Путь к короне</tspan>
  </text>`;

render("avatar-512", 512, 512, `
  <rect width="512" height="512" fill="${colors.blue}"/>
  <circle cx="80" cy="86" r="9" fill="${colors.cream}" opacity=".7"/>
  <circle cx="430" cy="120" r="6" fill="${colors.gold}" opacity=".8"/>
  <circle cx="405" cy="410" r="8" fill="${colors.rose}" opacity=".75"/>
  <image href="${icon}" x="0" y="0" width="512" height="512" preserveAspectRatio="none" style="image-rendering:pixelated"/>
`);

render("cover-800x470", 800, 470, `
  <image href="${forest}" x="0" y="0" width="800" height="470" preserveAspectRatio="xMidYMid slice"/>
  <rect width="800" height="470" fill="url(#shade)"/>
  <rect y="300" width="800" height="170" fill="url(#bottom)"/>
  ${star(54, 54, 5)}${star(342, 42, 4)}${star(478, 82, 3)}${star(718, 56, 5)}
  <image href="${logo}" x="56" y="50" width="66" height="99" preserveAspectRatio="none" style="image-rendering:pixelated"/>
  ${titleTwoLines(52, 186, 40)}
  <text x="56" y="318" fill="${colors.gold}" font-family="Arial, sans-serif" font-size="20px" font-weight="700">6 МИРОВ • БОСС • ЗАБЕГ ЗА РЕКОРДОМ</text>
  <text x="56" y="355" fill="${colors.cream}" opacity=".9" font-family="Arial, sans-serif" font-size="18px">Собирай наряды. Побеждай хранителя. Спеши к короне.</text>
  ${hero(610, 92, 150, 225)}
  <circle cx="708" cy="82" r="43" fill="${colors.gold}" opacity=".24"/>
  <image href="${icon}" x="666" y="40" width="84" height="84" preserveAspectRatio="none" style="image-rendering:pixelated"/>
`);

render("showcase-1560x520", 1560, 520, `
  <image href="${castle}" x="0" y="0" width="1560" height="520" preserveAspectRatio="xMidYMid slice"/>
  <image href="${garden}" x="0" y="170" width="1560" height="350" preserveAspectRatio="xMidYMid slice" opacity=".42"/>
  <rect width="1560" height="520" fill="url(#shade)"/>
  <rect y="320" width="1560" height="200" fill="url(#bottom)"/>
  ${star(110, 70, 5)}${star(420, 112, 4)}${star(760, 46, 5)}${star(1190, 84, 4)}${star(1450, 52, 5)}
  <image href="${logo}" x="106" y="72" width="72" height="108" preserveAspectRatio="none" style="image-rendering:pixelated"/>
  ${titleTwoLines(104, 214, 52)}
  <text x="108" y="376" fill="${colors.gold}" font-family="Arial, sans-serif" font-size="24px" font-weight="700">ШЕСТЬ МИРОВ. ОДНА КОРОНА.</text>
  <text x="108" y="414" fill="${colors.cream}" opacity=".9" font-family="Arial, sans-serif" font-size="20px">Пиксельное приключение с таблицей лидеров.</text>
  ${hero(1110, 72, 240, 360)}
  <image href="${icon}" x="1340" y="62" width="150" height="150" preserveAspectRatio="none" style="image-rendering:pixelated"/>
`);

render("poster-1080x1350", 1080, 1350, `
  <image href="${castle}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1080" height="1350" fill="${colors.night}" opacity=".35"/>
  <rect width="1080" height="640" fill="url(#shade)"/>
  ${star(86, 92, 7)}${star(916, 160, 5)}${star(760, 280, 4)}
  <image href="${logo}" x="84" y="82" width="96" height="144" preserveAspectRatio="none" style="image-rendering:pixelated"/>
  ${titleTwoLines(82, 312, 62)}
  <text x="88" y="515" fill="${colors.gold}" font-family="Arial, sans-serif" font-size="28px" font-weight="700">ПРОЙДИ ПУТЬ К КОРОНЕ</text>
  ${hero(322, 590, 436, 654)}
  <text x="540" y="1286" fill="${colors.cream}" font-family="Arial, sans-serif" font-size="26px" text-anchor="middle">6 миров • наряды • босс • рекорд времени</text>
`);

render("poster-1920x1080", 1920, 1080, `
  <image href="${forest}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1920" height="1080" fill="url(#shade)"/>
  <rect y="620" width="1920" height="460" fill="url(#bottom)"/>
  ${star(130, 100, 7)}${star(600, 150, 5)}${star(1000, 76, 6)}${star(1730, 110, 7)}
  <image href="${logo}" x="130" y="116" width="92" height="138" preserveAspectRatio="none" style="image-rendering:pixelated"/>
  ${titleTwoLines(128, 344, 76)}
  <text x="132" y="552" fill="${colors.gold}" font-family="Arial, sans-serif" font-size="34px" font-weight="700">ШЕСТЬ МИРОВ • ОДИН ЗАБЕГ • ТВОЙ РЕКОРД</text>
  ${hero(1390, 250, 310, 465)}
  <image href="${icon}" x="1640" y="148" width="210" height="210" preserveAspectRatio="none" style="image-rendering:pixelated"/>
`);

rmSync(TMP, { recursive: true, force: true });
