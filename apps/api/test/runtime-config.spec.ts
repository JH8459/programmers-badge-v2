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
    });
  });

  it("normalizes configured env values before use", () => {
    expect(
      readApiRuntimeConfig({
        PORT: " 4100 ",
        PUBLIC_BASE_URL: " https://programmers-badge.jh8459.com/ ",
        PUBLIC_BADGE_PATH_PREFIX: " public-badge/ ",
        DATABASE_PATH: " /tmp/programmers-badge.sqlite ",
        BADGE_OUTPUT_DIR: " /tmp/programmers-badge-assets ",
      })
    ).toEqual({
      port: 4100,
      publicBaseUrl: "https://programmers-badge.jh8459.com",
      publicBadgePathPrefix: "/public-badge",
      databasePath: "/tmp/programmers-badge.sqlite",
      badgeOutputDirectory: "/tmp/programmers-badge-assets",
    });
  });

  it("fails fast when env is invalid", () => {
    expect(() =>
      readApiRuntimeConfig({
        PORT: "abc",
        PUBLIC_BADGE_PATH_PREFIX: "/",
      })
    ).toThrowError(/API runtime environment is invalid/);
  });
});
