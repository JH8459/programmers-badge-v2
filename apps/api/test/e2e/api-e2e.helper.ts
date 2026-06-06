import "reflect-metadata";

import { mkdirSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import {
  badgeSyncResponseSchema,
  type BadgeSyncPayload,
  type BadgeSyncResponse,
} from "@programmers-badge/shared-types";

import { setupApiHttpApplication } from "../../src/api-http.setup";
import { AppModule } from "../../src/app.module";
import { readApiRuntimeConfig } from "../../src/common/runtime-config";

const e2eEnvKeys = [
  "PORT",
  "DATABASE_PATH",
  "BADGE_OUTPUT_DIR",
  "PUBLIC_BASE_URL",
  "PUBLIC_BADGE_PATH_PREFIX",
  "ALLOWED_WEB_ORIGINS",
  "ALLOW_LOCALHOST_ORIGINS",
  "ENABLE_SWAGGER",
  "SWAGGER_USERNAME",
  "SWAGGER_PASSWORD",
] as const;

type E2eEnvKey = (typeof e2eEnvKeys)[number];
type E2eEnvSnapshot = Record<E2eEnvKey, string | undefined>;

const E2E_SWAGGER_USERNAME = "e2e-swagger";
const E2E_SWAGGER_PASSWORD = "e2e-swagger-password";

export const createBadgeSyncPayload = (
  overrides: Partial<BadgeSyncPayload> = {}
): BadgeSyncPayload => ({
  programmerHandle: "  e2e-user  ",
  displayName: "  E2E User  ",
  solvedCount: 48,
  solvedTotal: 100,
  skillLevel: 3,
  rankingScore: 12_300,
  rankingRank: 42,
  badgeTier: "intermediate",
  syncedAt: "2026-04-07T01:02:03.000Z",
  ...overrides,
});

export interface ApiE2eApp {
  readonly app: NestExpressApplication;
  readonly baseUrl: string;
  readonly databasePath: string;
  readonly badgeOutputDirectory: string;
  readonly swaggerUsername: string;
  readonly swaggerPassword: string;
  readonly close: () => Promise<void>;
}

const snapshotEnv = (): E2eEnvSnapshot =>
  e2eEnvKeys.reduce<E2eEnvSnapshot>(
    (snapshot, key) => ({
      ...snapshot,
      [key]: process.env[key],
    }),
    {
      PORT: undefined,
      DATABASE_PATH: undefined,
      BADGE_OUTPUT_DIR: undefined,
      PUBLIC_BASE_URL: undefined,
      PUBLIC_BADGE_PATH_PREFIX: undefined,
      ALLOWED_WEB_ORIGINS: undefined,
      ALLOW_LOCALHOST_ORIGINS: undefined,
      ENABLE_SWAGGER: undefined,
      SWAGGER_USERNAME: undefined,
      SWAGGER_PASSWORD: undefined,
    }
  );

const createTempDatabasePath = (): string =>
  join(tmpdir(), `programmers-badge-e2e-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);

const createTempBadgeOutputDirectory = (): string => {
  const directoryPath = join(
    tmpdir(),
    `programmers-badge-e2e-assets-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );

  mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
};

const removeTempDatabase = (databasePath: string): void => {
  rmSync(databasePath, { force: true });
  rmSync(`${databasePath}-shm`, { force: true });
  rmSync(`${databasePath}-wal`, { force: true });
};

const removeTempDirectory = (directoryPath: string): void => {
  rmSync(directoryPath, { recursive: true, force: true });
};

const restoreEnv = (snapshot: E2eEnvSnapshot): void => {
  for (const key of e2eEnvKeys) {
    const value = snapshot[key];

    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
};

const getAppBaseUrl = (app: NestExpressApplication): string => {
  const address = app.getHttpServer().address() as AddressInfo | string | null;

  if (!address || typeof address === "string") {
    throw new Error("API e2e server address was not resolved.");
  }

  return `http://127.0.0.1:${address.port}`;
};

export const postBadgeSync = ({
  api,
  payload = createBadgeSyncPayload(),
}: PostBadgeSyncProps): Promise<Response> =>
  fetch(`${api.baseUrl}/api/sync`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const parseBadgeSyncResponse = async (response: Response): Promise<BadgeSyncResponse> =>
  badgeSyncResponseSchema.parse(await response.json());

export const createApiE2eApp = async ({
  enableSwagger = false,
}: CreateApiE2eAppOptions = {}): Promise<ApiE2eApp> => {
  const originalEnv = snapshotEnv();
  const databasePath = createTempDatabasePath();
  const badgeOutputDirectory = createTempBadgeOutputDirectory();
  let app: NestExpressApplication | undefined;

  delete process.env.PORT;
  process.env.DATABASE_PATH = databasePath;
  process.env.BADGE_OUTPUT_DIR = badgeOutputDirectory;
  process.env.PUBLIC_BASE_URL = "http://127.0.0.1";
  process.env.PUBLIC_BADGE_PATH_PREFIX = "/badge";
  process.env.ALLOWED_WEB_ORIGINS = "";
  process.env.ALLOW_LOCALHOST_ORIGINS = "true";
  process.env.ENABLE_SWAGGER = enableSwagger ? "true" : "false";
  process.env.SWAGGER_USERNAME = E2E_SWAGGER_USERNAME;
  process.env.SWAGGER_PASSWORD = E2E_SWAGGER_PASSWORD;

  try {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ["error"],
    });
    setupApiHttpApplication({ app, runtimeConfig: readApiRuntimeConfig() });
    await app.listen(0, "127.0.0.1");

    const baseUrl = getAppBaseUrl(app);
    process.env.PUBLIC_BASE_URL = baseUrl;

    return {
      app,
      baseUrl,
      databasePath,
      badgeOutputDirectory,
      swaggerUsername: E2E_SWAGGER_USERNAME,
      swaggerPassword: E2E_SWAGGER_PASSWORD,
      close: async () => {
        await app?.close();
        restoreEnv(originalEnv);
        removeTempDatabase(databasePath);
        removeTempDirectory(badgeOutputDirectory);
      },
    };
  } catch (error) {
    await app?.close();
    restoreEnv(originalEnv);
    removeTempDatabase(databasePath);
    removeTempDirectory(badgeOutputDirectory);
    throw error;
  }
};

interface PostBadgeSyncProps {
  readonly api: ApiE2eApp;
  readonly payload?: BadgeSyncPayload | Record<string, unknown>;
}

interface CreateApiE2eAppOptions {
  readonly enableSwagger?: boolean;
}
