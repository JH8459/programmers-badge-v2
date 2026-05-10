import { readApiRuntimeConfig } from "../common/runtime-config";

export const getPublicBaseUrl = (): string => {
  return readApiRuntimeConfig().publicBaseUrl;
};

export const getPublicBadgePathPrefix = (): string => {
  return readApiRuntimeConfig().publicBadgePathPrefix;
};

export const getBadgeOutputDirectory = (): string => {
  return readApiRuntimeConfig().badgeOutputDirectory;
};
