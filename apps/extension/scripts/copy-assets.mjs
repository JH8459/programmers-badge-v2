import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "..");
const distDir = resolve(rootDir, "dist");

await mkdir(resolve(distDir, "popup"), { recursive: true });
await cp(resolve(rootDir, "manifest.json"), resolve(distDir, "manifest.json"));
await cp(resolve(rootDir, "assets", "popup.html"), resolve(distDir, "popup.html"));
await cp(resolve(rootDir, "src", "popup", "styles.css"), resolve(distDir, "popup", "styles.css"));

try {
  await rm(resolve(distDir, "assets"), { recursive: true, force: true });
} catch {
  // no-op
}
