import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readApiRuntimeConfig } from "../src/common/runtime-config";

describe("readApiRuntimeConfig", () => {
  it("applies runtime defaults when env is absent", () => {
    expect(readApiRuntimeConfig({})).toEqual({
      port: 3000,
      publicBaseUrl: "http://localhost:3000",
      publicBadgePathPrefix: "/badge",
      databasePath: resolve(process.cwd(), "data", "programmers-badge.sqlite"),
      badgeOutputDirectory: resolve(process.cwd(), "data/badges"),
      allowedWebOrigins: [],
      allowLocalhostOrigins: false,
    });
  });

  it("treats unset optional env values as absent", () => {
    expect(
      readApiRuntimeConfig({
        ALLOWED_WEB_ORIGINS: undefined,
        ALLOW_LOCALHOST_ORIGINS: undefined,
      })
    ).toMatchObject({
      allowedWebOrigins: [],
      allowLocalhostOrigins: false,
    });
  });

  it("normalizes configured env values before use", () => {
    expect(
      readApiRuntimeConfig({
        PORT: " 4100 ",
        PUBLIC_BASE_URL: " https://api.programmers-badge.jh8459.com/ ",
        PUBLIC_BADGE_PATH_PREFIX: " public-badge/ ",
        DATABASE_PATH: " /tmp/programmers-badge.sqlite ",
        BADGE_OUTPUT_DIR: " /tmp/programmers-badge-assets ",
        ALLOWED_WEB_ORIGINS:
          " https://programmers-badge.jh8459.com/ , http://localhost:5020/ ",
        ALLOW_LOCALHOST_ORIGINS: "true",
      })
    ).toEqual({
      port: 4100,
      publicBaseUrl: "https://api.programmers-badge.jh8459.com",
      publicBadgePathPrefix: "/public-badge",
      databasePath: "/tmp/programmers-badge.sqlite",
      badgeOutputDirectory: "/tmp/programmers-badge-assets",
      allowedWebOrigins: ["https://programmers-badge.jh8459.com", "http://localhost:5020"],
      allowLocalhostOrigins: true,
    });
  });

  it("fails fast when env is invalid", () => {
    expect(() =>
      readApiRuntimeConfig({
        PORT: "abc",
        PUBLIC_BADGE_PATH_PREFIX: "/",
        ALLOWED_WEB_ORIGINS: "not-a-url",
        ALLOW_LOCALHOST_ORIGINS: "maybe",
      })
    ).toThrowError(/API runtime environment is invalid/);
  });
});
