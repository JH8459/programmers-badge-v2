import { access, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const currentDir = dirname(fileURLToPath(import.meta.url));
const extensionRoot = resolve(currentDir, "..");
const repoRoot = resolve(extensionRoot, "../..");
const distDir = resolve(extensionRoot, "dist");
const manifestPath = resolve(extensionRoot, "manifest.json");
const distManifestPath = resolve(distDir, "manifest.json");

const requiredIcons = [
  ["icon-16.png", 16, 16],
  ["icon-32.png", 32, 32],
  ["icon-48.png", 48, 48],
  ["icon-128.png", 128, 128],
];

const requiredStoreAssets = [
  ["promo-small-440x280.png", 440, 280],
  ["promo-marquee-1400x560.png", 1400, 560],
  ["screenshot-background-1280x800.png", 1280, 800],
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    output: undefined,
    skipBuild: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--skip-build") {
      options.skipBuild = true;
      continue;
    }

    if (arg === "--output") {
      options.output = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const run = (command, args, options = {}) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      ...options,
    });

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const assertFileExists = async (path) => {
  try {
    await access(path);
  } catch {
    throw new Error(`Required file is missing: ${path}`);
  }
};

const getPngSize = async (path) => {
  const buffer = await readFile(path);
  const pngSignature = "89504e470d0a1a0a";

  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`File is not a valid PNG: ${path}`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

const assertPngSize = async (path, expectedWidth, expectedHeight) => {
  const { width, height } = await getPngSize(path);

  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(
      `Unexpected PNG size for ${path}. Expected ${expectedWidth}x${expectedHeight}, received ${width}x${height}.`
    );
  }
};

const assertExtensionIcons = async () => {
  for (const [fileName, width, height] of requiredIcons) {
    await assertPngSize(resolve(distDir, "assets", "icons", fileName), width, height);
  }
};

const assertStoreAssets = async () => {
  for (const [fileName, width, height] of requiredStoreAssets) {
    await assertPngSize(resolve(extensionRoot, "store-assets", fileName), width, height);
  }
};

const assertManifest = async () => {
  const sourceManifest = await readJson(manifestPath);
  const distManifest = await readJson(distManifestPath);

  if (distManifest.version !== sourceManifest.version) {
    throw new Error(
      `Dist manifest version mismatch. Expected ${sourceManifest.version}, received ${distManifest.version}.`
    );
  }

  for (const [fileName] of requiredIcons) {
    const iconPath = `assets/icons/${fileName}`;
    const iconSize = fileName.match(/icon-(\d+)\.png/)?.[1];

    if (!iconSize) {
      throw new Error(`Cannot infer icon size from ${fileName}.`);
    }

    if (distManifest.icons?.[iconSize] !== iconPath) {
      throw new Error(`Manifest icons.${iconSize} must point to ${iconPath}.`);
    }

    if (distManifest.action?.default_icon?.[iconSize] !== iconPath) {
      throw new Error(`Manifest action.default_icon.${iconSize} must point to ${iconPath}.`);
    }
  }

  return sourceManifest;
};

const resolveArchivePath = (manifestVersion, output) => {
  if (output) {
    return resolve(repoRoot, output);
  }

  return resolve(repoRoot, `programmers-badge-extension-v${manifestVersion}.zip`);
};

const packageExtension = async () => {
  const options = parseArgs();

  if (!options.skipBuild) {
    await run("pnpm", ["--filter", "@programmers-badge/extension", "build"]);
  }

  await assertFileExists(distManifestPath);
  await assertExtensionIcons();
  await assertStoreAssets();

  const manifest = await assertManifest();
  const archivePath = resolveArchivePath(manifest.version, options.output);

  await mkdir(dirname(archivePath), { recursive: true });
  await rm(archivePath, { force: true });
  await run("zip", ["-r", archivePath, ".", "-x", "*.d.ts", "*.d.ts.map", "*.js.map"], {
    cwd: distDir,
  });

  console.log(`Extension package created: ${archivePath}`);
  console.log("Chrome Web Store listing assets:");

  for (const [fileName] of requiredStoreAssets) {
    console.log(`- ${resolve(extensionRoot, "store-assets", fileName)}`);
  }
};

await packageExtension();
