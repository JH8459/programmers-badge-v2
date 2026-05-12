import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const currentDir = dirname(fileURLToPath(import.meta.url));
const extensionRoot = resolve(currentDir, "..");
const distDir = resolve(extensionRoot, "dist");

await rm(distDir, { recursive: true, force: true });

await build({
  entryPoints: [
    resolve(extensionRoot, "src", "background", "index.ts"),
    resolve(extensionRoot, "src", "content", "index.ts"),
    resolve(extensionRoot, "src", "popup", "index.ts"),
  ],
  outbase: resolve(extensionRoot, "src"),
  outdir: distDir,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  sourcemap: false,
  logLevel: "info",
});
