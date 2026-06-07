import { createSign } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const chromeWebStoreScope = "https://www.googleapis.com/auth/chromewebstore";
const tokenUrl = "https://oauth2.googleapis.com/token";
const apiBaseUrl = "https://chromewebstore.googleapis.com";
const defaultPublishType = "DEFAULT_PUBLISH";
const defaultUploadStatusAttempts = 18;
const defaultUploadStatusIntervalMs = 10000;
const currentDir = dirname(fileURLToPath(import.meta.url));
const extensionRoot = resolve(currentDir, "..");
const repoRoot = resolve(extensionRoot, "../..");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    archive: undefined,
    dryRun: false,
    manifest: "apps/extension/manifest.json",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--archive") {
      options.archive = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--archive=")) {
      options.archive = arg.slice("--archive=".length);
      continue;
    }

    if (arg === "--manifest") {
      options.manifest = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--manifest=")) {
      options.manifest = arg.slice("--manifest=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const getEnv = (name) => {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : undefined;
};

const requireEnv = (name) => {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const parseBooleanEnv = (name, defaultValue) => {
  const value = getEnv(name);

  if (!value) {
    return defaultValue;
  }

  if (["1", "true", "yes"].includes(value.toLowerCase())) {
    return true;
  }

  if (["0", "false", "no"].includes(value.toLowerCase())) {
    return false;
  }

  throw new Error(`${name} must be one of true, false, 1, 0, yes, no.`);
};

const parseIntegerEnv = (name, defaultValue) => {
  const value = getEnv(name);

  if (!value) {
    return defaultValue;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a nonnegative integer.`);
  }

  return Number(value);
};

const parseDeployPercentage = () => {
  const value = getEnv("CWS_DEPLOY_PERCENTAGE");

  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("CWS_DEPLOY_PERCENTAGE must be an integer between 0 and 100.");
  }

  const percentage = Number(value);

  if (percentage < 0 || percentage > 100) {
    throw new Error("CWS_DEPLOY_PERCENTAGE must be an integer between 0 and 100.");
  }

  return percentage;
};

const readJsonFile = async (path) => JSON.parse(await readFile(path, "utf8"));

const runAndCapture = (command, args) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdoutChunks = [];
    const stderrChunks = [];

    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderrChunks.push(chunk);
    });

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");

      if (code === 0) {
        resolvePromise(stdout);
        return;
      }

      rejectPromise(
        new Error(
          `${command} ${args.join(" ")} exited with code ${code ?? "unknown"}${stderr ? `: ${stderr.trim()}` : ""}`
        )
      );
    });
  });

const readManifest = async (manifestPath) => {
  const manifest = await readJsonFile(manifestPath);

  if (typeof manifest.version !== "string" || manifest.version.trim().length === 0) {
    throw new Error(`Manifest version is missing in ${manifestPath}.`);
  }

  return manifest;
};

const parseChromeVersion = (version) => {
  const parts = version.split(".");

  if (parts.length < 1 || parts.length > 4) {
    throw new Error(`Invalid Chrome extension version: ${version}`);
  }

  return parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      throw new Error(`Invalid Chrome extension version: ${version}`);
    }

    const value = Number(part);

    if (value < 0 || value > 65535) {
      throw new Error(`Chrome extension version segment is out of range: ${version}`);
    }

    return value;
  });
};

const compareChromeVersions = (left, right) => {
  const leftParts = parseChromeVersion(left);
  const rightParts = parseChromeVersion(right);
  const partCount = Math.max(leftParts.length, rightParts.length, 4);

  for (let index = 0; index < partCount; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) {
      return 1;
    }

    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
};

const getHighestVersion = (versions) => {
  let highestVersion;

  for (const version of versions) {
    if (!highestVersion || compareChromeVersions(version, highestVersion) > 0) {
      highestVersion = version;
    }
  }

  return highestVersion;
};

const base64UrlEncode = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

const requestJson = async (url, options) => {
  const response = await globalThis.fetch(url, options);
  const responseText = await response.text();
  const responseBody = responseText.length > 0 ? JSON.parse(responseText) : {};

  if (!response.ok) {
    throw new Error(
      `Chrome Web Store request failed (${response.status} ${response.statusText}): ${JSON.stringify(responseBody)}`
    );
  }

  return responseBody;
};

const getOAuthRefreshTokenAccessToken = async () => {
  const clientId = requireEnv("CWS_CLIENT_ID");
  const clientSecret = requireEnv("CWS_CLIENT_SECRET");
  const refreshToken = requireEnv("CWS_REFRESH_TOKEN");
  const body = new globalThis.URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await requestJson(tokenUrl, {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (typeof response.access_token !== "string") {
    throw new Error("OAuth refresh token response did not contain access_token.");
  }

  return response.access_token;
};

const parseServiceAccountJson = (rawValue) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    return JSON.parse(Buffer.from(rawValue, "base64").toString("utf8"));
  }
};

const createServiceAccountAssertion = (serviceAccount) => {
  if (typeof serviceAccount.client_email !== "string") {
    throw new Error("CWS_SERVICE_ACCOUNT_JSON is missing client_email.");
  }

  if (typeof serviceAccount.private_key !== "string") {
    throw new Error("CWS_SERVICE_ACCOUNT_JSON is missing private_key.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    })
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      aud: tokenUrl,
      exp: now + 3600,
      iat: now,
      iss: serviceAccount.client_email,
      scope: chromeWebStoreScope,
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsignedToken).sign(serviceAccount.private_key);

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
};

const getServiceAccountAccessToken = async () => {
  const serviceAccount = parseServiceAccountJson(requireEnv("CWS_SERVICE_ACCOUNT_JSON"));
  const assertion = createServiceAccountAssertion(serviceAccount);
  const body = new globalThis.URLSearchParams({
    assertion,
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
  });

  const response = await requestJson(tokenUrl, {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (typeof response.access_token !== "string") {
    throw new Error("Service account token response did not contain access_token.");
  }

  return response.access_token;
};

const getAccessToken = async () => {
  const accessToken = getEnv("CWS_ACCESS_TOKEN");

  if (accessToken) {
    return accessToken;
  }

  if (getEnv("CWS_SERVICE_ACCOUNT_JSON")) {
    return getServiceAccountAccessToken();
  }

  if (getEnv("CWS_CLIENT_ID") || getEnv("CWS_CLIENT_SECRET") || getEnv("CWS_REFRESH_TOKEN")) {
    return getOAuthRefreshTokenAccessToken();
  }

  throw new Error(
    "Missing Chrome Web Store auth. Set CWS_SERVICE_ACCOUNT_JSON, CWS_ACCESS_TOKEN, or CWS_CLIENT_ID/CWS_CLIENT_SECRET/CWS_REFRESH_TOKEN."
  );
};

const createAuthorizedHeaders = (accessToken, additionalHeaders = {}) => ({
  Authorization: `Bearer ${accessToken}`,
  ...additionalHeaders,
});

const createItemName = () => {
  const publisherId = requireEnv("CWS_PUBLISHER_ID");
  const itemId = requireEnv("CWS_EXTENSION_ID");

  return `publishers/${publisherId}/items/${itemId}`;
};

const fetchStatus = async (accessToken, itemName) =>
  requestJson(`${apiBaseUrl}/v2/${itemName}:fetchStatus`, {
    headers: createAuthorizedHeaders(accessToken),
    method: "GET",
  });

const uploadPackage = async ({ accessToken, archivePath, itemName }) => {
  const archiveBuffer = await readFile(archivePath);

  return requestJson(`${apiBaseUrl}/upload/v2/${itemName}:upload`, {
    body: archiveBuffer,
    headers: createAuthorizedHeaders(accessToken, {
      "Content-Length": String(archiveBuffer.length),
      "Content-Type": "application/zip",
    }),
    method: "POST",
  });
};

const publishItem = async ({
  accessToken,
  blockOnWarnings,
  deployPercentage,
  itemName,
  publishType,
  skipReview,
}) => {
  const body = {
    blockOnWarnings,
    publishType,
  };

  if (deployPercentage !== undefined) {
    body.deployInfos = [
      {
        deployPercentage,
      },
    ];
  }

  if (skipReview) {
    body.skipReview = true;
  }

  return requestJson(`${apiBaseUrl}/v2/${itemName}:publish`, {
    body: JSON.stringify(body),
    headers: createAuthorizedHeaders(accessToken, {
      "Content-Type": "application/json",
    }),
    method: "POST",
  });
};

const getDistributionChannelVersions = (revisionStatus) => {
  const channels = revisionStatus?.distributionChannels;

  if (!Array.isArray(channels)) {
    return [];
  }

  return channels
    .map((channel) => channel?.crxVersion)
    .filter((version) => typeof version === "string" && version.length > 0);
};

const getStoreVersions = (status) => [
  ...getDistributionChannelVersions(status.publishedItemRevisionStatus),
  ...getDistributionChannelVersions(status.submittedItemRevisionStatus),
];

const assertManifestVersionIsNewer = ({ manifestVersion, status }) => {
  const highestStoreVersion = getHighestVersion(getStoreVersions(status));

  if (!highestStoreVersion) {
    console.log("No published or submitted Chrome Web Store version was found.");
    return;
  }

  if (compareChromeVersions(manifestVersion, highestStoreVersion) <= 0) {
    throw new Error(
      `Manifest version ${manifestVersion} must be greater than Chrome Web Store version ${highestStoreVersion}.`
    );
  }

  console.log(
    `Manifest version ${manifestVersion} is greater than Chrome Web Store version ${highestStoreVersion}.`
  );
};

const sleep = (milliseconds) =>
  new Promise((resolvePromise) => {
    setTimeout(resolvePromise, milliseconds);
  });

const waitForUploadProcessing = async ({
  accessToken,
  attempts,
  intervalMs,
  itemName,
  uploadResponse,
}) => {
  let state = uploadResponse.uploadState;

  if (state === "SUCCEEDED") {
    return uploadResponse;
  }

  if (state === "FAILED") {
    throw new Error(`Chrome Web Store package upload failed: ${JSON.stringify(uploadResponse)}`);
  }

  if (state !== "IN_PROGRESS" && state !== "UPLOAD_IN_PROGRESS") {
    throw new Error(`Unexpected Chrome Web Store upload state: ${state ?? "undefined"}`);
  }

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    console.log(`Upload is still processing. Polling status ${attempt}/${attempts}...`);
    await sleep(intervalMs);

    const status = await fetchStatus(accessToken, itemName);
    state = status.lastAsyncUploadState;

    if (state === "SUCCEEDED") {
      return status;
    }

    if (state === "FAILED") {
      throw new Error(`Chrome Web Store package upload failed: ${JSON.stringify(status)}`);
    }
  }

  throw new Error(
    `Chrome Web Store package upload did not finish after ${attempts} polling attempts.`
  );
};

const resolveRepoPath = (path) => (isAbsolute(path) ? path : resolve(repoRoot, path));

const resolveArchivePath = (archive, manifestVersion) =>
  resolveRepoPath(archive ?? `programmers-badge-extension-v${manifestVersion}.zip`);

const assertArchiveExists = async (archivePath) => {
  const archiveStat = await stat(archivePath);

  if (!archiveStat.isFile()) {
    throw new Error(`Extension archive is not a file: ${archivePath}`);
  }
};

const readArchiveManifest = async (archivePath) => {
  const manifestSource = await runAndCapture("unzip", ["-p", archivePath, "manifest.json"]);
  const manifest = JSON.parse(manifestSource);

  if (typeof manifest.version !== "string" || manifest.version.trim().length === 0) {
    throw new Error(`Archive manifest version is missing in ${archivePath}.`);
  }

  return manifest;
};

const assertArchiveManifestVersion = async ({ archivePath, manifestVersion }) => {
  const archiveManifest = await readArchiveManifest(archivePath);

  if (archiveManifest.version !== manifestVersion) {
    throw new Error(
      `Archive manifest version mismatch. Expected ${manifestVersion}, received ${archiveManifest.version}.`
    );
  }
};

const publishChromeWebStore = async () => {
  const options = parseArgs();
  const manifestPath = resolveRepoPath(options.manifest);
  const manifest = await readManifest(manifestPath);
  const archivePath = resolveArchivePath(options.archive, manifest.version);
  const itemName = createItemName();
  const blockOnWarnings = parseBooleanEnv("CWS_BLOCK_ON_WARNINGS", true);
  const deployPercentage = parseDeployPercentage();
  const publishType = getEnv("CWS_PUBLISH_TYPE") ?? defaultPublishType;
  const skipReview = parseBooleanEnv("CWS_SKIP_REVIEW", false);
  const uploadStatusAttempts = parseIntegerEnv(
    "CWS_UPLOAD_STATUS_ATTEMPTS",
    defaultUploadStatusAttempts
  );
  const uploadStatusIntervalMs = parseIntegerEnv(
    "CWS_UPLOAD_STATUS_INTERVAL_MS",
    defaultUploadStatusIntervalMs
  );

  parseChromeVersion(manifest.version);
  await assertArchiveExists(archivePath);
  await assertArchiveManifestVersion({
    archivePath,
    manifestVersion: manifest.version,
  });

  console.log(`Chrome Web Store item: ${itemName}`);
  console.log(`Manifest version: ${manifest.version}`);
  console.log(`Extension archive: ${archivePath}`);
  console.log(`Publish type: ${publishType}`);
  console.log(`Block on warnings: ${blockOnWarnings}`);

  if (deployPercentage !== undefined) {
    console.log(`Deploy percentage: ${deployPercentage}`);
  }

  if (options.dryRun) {
    console.log("Dry run completed. No Chrome Web Store API calls were made.");
    return;
  }

  const accessToken = await getAccessToken();
  const status = await fetchStatus(accessToken, itemName);

  assertManifestVersionIsNewer({
    manifestVersion: manifest.version,
    status,
  });

  const uploadResponse = await uploadPackage({
    accessToken,
    archivePath,
    itemName,
  });

  console.log(`Upload response: ${JSON.stringify(uploadResponse)}`);

  if (uploadResponse.crxVersion && uploadResponse.crxVersion !== manifest.version) {
    throw new Error(
      `Uploaded package version mismatch. Expected ${manifest.version}, received ${uploadResponse.crxVersion}.`
    );
  }

  await waitForUploadProcessing({
    accessToken,
    attempts: uploadStatusAttempts,
    intervalMs: uploadStatusIntervalMs,
    itemName,
    uploadResponse,
  });

  const publishResponse = await publishItem({
    accessToken,
    blockOnWarnings,
    deployPercentage,
    itemName,
    publishType,
    skipReview,
  });

  console.log(`Publish response: ${JSON.stringify(publishResponse)}`);
  console.log("Chrome Web Store publish request submitted.");
};

await publishChromeWebStore();
