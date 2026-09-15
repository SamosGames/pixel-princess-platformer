// Build the static archive uploaded to Yandex Games.
// The archive intentionally contains only runtime files: no API functions, tests, or dev config.

import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "dist");
const archive = join(outputDir, "pixel-princess-yandex.zip");
const runtimeFiles = ["index.html", "privacy.html", "LEGAL.md", "LICENSE", "style.css", "manifest.webmanifest", "sw.js", "src", "assets", "vendor"];
const maxBytes = 100 * 1024 * 1024;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

mkdirSync(outputDir, { recursive: true });
const staging = mkdtempSync(join(tmpdir(), "pixel-princess-yandex-"));

try {
  for (const name of runtimeFiles) {
    const source = join(root, name);
    if (!existsSync(source)) throw new Error(`Missing runtime file: ${name}`);
    cpSync(source, join(staging, name), { recursive: true });
  }

  const files = walk(staging);
  const badName = files.find((file) => /[\s\u0080-\uFFFF]/.test(relative(staging, file)));
  if (badName) throw new Error(`Yandex archive path contains spaces or non-ASCII characters: ${relative(staging, badName)}`);
  const bytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
  if (bytes > maxBytes) throw new Error(`Uncompressed archive is ${(bytes / 1024 / 1024).toFixed(1)} MB; Yandex allows 100 MB.`);

  rmSync(archive, { force: true });
  const zip = spawnSync("zip", ["-r", "-X", "-D", archive, ...runtimeFiles], { cwd: staging, stdio: "inherit" });
  if (zip.status !== 0) throw new Error("zip command failed");

  const listing = spawnSync("unzip", ["-Z1", archive], { encoding: "utf8" });
  if (listing.status !== 0 || !listing.stdout.split("\n").includes("index.html")) {
    throw new Error("Archive must contain index.html at its root");
  }
  console.log(`Yandex archive: ${archive}`);
  console.log(`Files: ${files.length}; uncompressed: ${(bytes / 1024 / 1024).toFixed(1)} MB`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
