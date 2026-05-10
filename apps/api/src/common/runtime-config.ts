import { resolve } from "node:path";

import { z } from "zod";

const DEFAULT_PORT = 3000;
const DEFAULT_PUBLIC_BADGE_PATH_PREFIX = "/badge";
const DEFAULT_DATABASE_PATH = resolve(process.cwd(), "data", "programmers-badge.sqlite");
const DEFAULT_BADGE_OUTPUT_DIR = resolve(process.cwd(), "data/badges");

interface ApiRuntimeEnvInput {
  PORT?: string;
  PUBLIC_BASE_URL?: string;
  PUBLIC_BADGE_PATH_PREFIX?: string;
  DATABASE_PATH?: string;
  BADGE_OUTPUT_DIR?: string;
}

interface ApiRuntimeConfigShape {
  port: number;
  publicBaseUrl: string;
  publicBadgePathPrefix: string;
  databasePath: string;
  badgeOutputDirectory: string;
}

const normalizeOptionalEnvString = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const normalizePublicBaseUrl = (configuredBaseUrl: string | undefined, port: number): string => {
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return `http://localhost:${port}`;
};

const normalizePublicBadgePathPrefix = (configuredPathPrefix: string | undefined): string => {
  const rawPathPrefix = configuredPathPrefix ?? DEFAULT_PUBLIC_BADGE_PATH_PREFIX;
  const pathPrefixWithLeadingSlash = rawPathPrefix.startsWith("/")
    ? rawPathPrefix
    : `/${rawPathPrefix}`;

  return pathPrefixWithLeadingSlash.replace(/\/+$/, "");
};

export const apiRuntimeConfigSchema = z
  .object({
    PORT: z.preprocess(normalizeOptionalEnvString, z.coerce.number().int().min(1).max(65_535))
      .optional(),
    PUBLIC_BASE_URL: z.preprocess(normalizeOptionalEnvString, z.string().url()).optional(),
    PUBLIC_BADGE_PATH_PREFIX: z.preprocess(normalizeOptionalEnvString, z.string()).optional(),
    DATABASE_PATH: z.preprocess(normalizeOptionalEnvString, z.string()).optional(),
    BADGE_OUTPUT_DIR: z.preprocess(normalizeOptionalEnvString, z.string()).optional(),
  })
  .transform((env): ApiRuntimeConfigShape => {
    const port = env.PORT ?? DEFAULT_PORT;
    const publicBadgePathPrefix = normalizePublicBadgePathPrefix(env.PUBLIC_BADGE_PATH_PREFIX);

    return {
      port,
      publicBaseUrl: normalizePublicBaseUrl(env.PUBLIC_BASE_URL, port),
      publicBadgePathPrefix,
      databasePath: env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH,
      badgeOutputDirectory: env.BADGE_OUTPUT_DIR ?? DEFAULT_BADGE_OUTPUT_DIR,
    };
  })
  .refine(
    (config: ApiRuntimeConfigShape) => config.publicBadgePathPrefix.length > 0,
    "PUBLIC_BADGE_PATH_PREFIX must not resolve to the root path."
  );

export type ApiRuntimeConfig = z.infer<typeof apiRuntimeConfigSchema>;

export const readApiRuntimeConfig = (env: NodeJS.ProcessEnv = process.env): ApiRuntimeConfig => {
  const input: ApiRuntimeEnvInput = {
    PORT: env.PORT,
    PUBLIC_BASE_URL: env.PUBLIC_BASE_URL,
    PUBLIC_BADGE_PATH_PREFIX: env.PUBLIC_BADGE_PATH_PREFIX,
    DATABASE_PATH: env.DATABASE_PATH,
    BADGE_OUTPUT_DIR: env.BADGE_OUTPUT_DIR,
  };
  const parseResult = apiRuntimeConfigSchema.safeParse(input);

  if (parseResult.success) {
    return parseResult.data;
  }

  // 앱이 뜬 뒤에야 잘못된 환경설정을 알지 않도록 bootstrap 전에 바로 중단한다.
  throw new Error(
    `API runtime environment is invalid: ${parseResult.error.issues
      .map((issue: { path: PropertyKey[]; message: string }) => {
        const issuePath = issue.path.join(".") || "root";
        return `${issuePath}: ${issue.message}`;
      })
      .join("; ")}`
  );
};
