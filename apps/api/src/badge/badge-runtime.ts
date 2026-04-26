import { resolve } from "node:path";

const DEFAULT_PORT = "3000";
const DEFAULT_PUBLIC_BADGE_PATH_PREFIX = "/badge";
const DEFAULT_BADGE_OUTPUT_DIR = resolve(process.cwd(), "data/badges");

export const getPublicBaseUrl = (): string => {
  const configuredBaseUrl = process.env.PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const port = process.env.PORT?.trim() || DEFAULT_PORT;
  return `http://localhost:${port}`;
};

export const getPublicBadgePathPrefix = (): string => {
  const configuredPathPrefix = process.env.PUBLIC_BADGE_PATH_PREFIX?.trim();

  if (!configuredPathPrefix) {
    return DEFAULT_PUBLIC_BADGE_PATH_PREFIX;
  }

  const normalizedPathPrefix = configuredPathPrefix.startsWith("/")
    ? configuredPathPrefix
    : `/${configuredPathPrefix}`;

  return normalizedPathPrefix.replace(/\/$/, "");
};

export const getBadgeOutputDirectory = (): string => {
  const configuredOutputDirectory = process.env.BADGE_OUTPUT_DIR?.trim();

  if (configuredOutputDirectory) {
    return configuredOutputDirectory;
  }

  return DEFAULT_BADGE_OUTPUT_DIR;
};
