import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readApiRuntimeConfig } from "./runtime-config";

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
      swaggerEnabled: false,
      swaggerAuth: null,
    });
  });

  it("treats unset optional env values as absent", () => {
    expect(
      readApiRuntimeConfig({
        ALLOWED_WEB_ORIGINS: " ",
        ALLOW_LOCALHOST_ORIGINS: " ",
        ENABLE_SWAGGER: " ",
      })
    ).toEqual({
      port: 3000,
      publicBaseUrl: "http://localhost:3000",
      publicBadgePathPrefix: "/badge",
      databasePath: resolve(process.cwd(), "data", "programmers-badge.sqlite"),
      badgeOutputDirectory: resolve(process.cwd(), "data/badges"),
      allowedWebOrigins: [],
      allowLocalhostOrigins: false,
      swaggerEnabled: false,
      swaggerAuth: null,
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
        ENABLE_SWAGGER: "1",
        SWAGGER_USERNAME: " docs-user ",
        SWAGGER_PASSWORD: " docs-password ",
      })
    ).toEqual({
      port: 4100,
      publicBaseUrl: "https://api.programmers-badge.jh8459.com",
      publicBadgePathPrefix: "/public-badge",
      databasePath: "/tmp/programmers-badge.sqlite",
      badgeOutputDirectory: "/tmp/programmers-badge-assets",
      allowedWebOrigins: ["https://programmers-badge.jh8459.com", "http://localhost:5020"],
      allowLocalhostOrigins: true,
      swaggerEnabled: true,
      swaggerAuth: {
        username: "docs-user",
        password: "docs-password",
      },
    });
  });

  it.each(["true", "1"])("enables Swagger when ENABLE_SWAGGER is %s", (enableSwagger) => {
    expect(
      readApiRuntimeConfig({
        ENABLE_SWAGGER: enableSwagger,
        SWAGGER_USERNAME: "docs-user",
        SWAGGER_PASSWORD: "docs-password",
      })
    ).toMatchObject({
      swaggerEnabled: true,
      swaggerAuth: {
        username: "docs-user",
        password: "docs-password",
      },
    });
  });

  it("requires Swagger credentials when Swagger is enabled", () => {
    expect(() =>
      readApiRuntimeConfig({
        ENABLE_SWAGGER: "true",
      })
    ).toThrowError(/SWAGGER_USERNAME is required when ENABLE_SWAGGER is true/);

    expect(() =>
      readApiRuntimeConfig({
        ENABLE_SWAGGER: "true",
        SWAGGER_USERNAME: "docs-user",
      })
    ).toThrowError(/SWAGGER_PASSWORD is required when ENABLE_SWAGGER is true/);
  });

  it("fails fast when env is invalid", () => {
    expect(() =>
      readApiRuntimeConfig({
        PORT: "abc",
        PUBLIC_BADGE_PATH_PREFIX: "/",
        ALLOWED_WEB_ORIGINS: "not-a-url",
        ALLOW_LOCALHOST_ORIGINS: "maybe",
        ENABLE_SWAGGER: "yes",
      })
    ).toThrowError(/API runtime environment is invalid/);
  });

  it("includes root-level config errors in the failure message", () => {
    expect(() =>
      readApiRuntimeConfig({
        PUBLIC_BADGE_PATH_PREFIX: "/",
      })
    ).toThrowError(/root: PUBLIC_BADGE_PATH_PREFIX must not resolve to the root path/);
  });
});
