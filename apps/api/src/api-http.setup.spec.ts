import type { NestExpressApplication } from "@nestjs/platform-express";
import { describe, expect, it, vi } from "vitest";

import type { ApiRuntimeConfig } from "./common/runtime-config";

import { setupApiHttpApplication } from "./api-http.setup";

const createRuntimeConfig = (
  overrides: Partial<ApiRuntimeConfig> = {}
): ApiRuntimeConfig => ({
  port: 3000,
  publicBaseUrl: "http://localhost:3000",
  publicBadgePathPrefix: "/badge",
  databasePath: ":memory:",
  badgeOutputDirectory: "/tmp/badges",
  allowedWebOrigins: ["https://programmers-badge.jh8459.com"],
  allowLocalhostOrigins: false,
  swaggerEnabled: false,
  swaggerAuth: null,
  ...overrides,
});

const createApp = (): NestExpressApplication =>
  ({
    useStaticAssets: vi.fn(),
    setGlobalPrefix: vi.fn(),
    enableCors: vi.fn(),
  }) as unknown as NestExpressApplication;

describe("setupApiHttpApplication", () => {
  it("configures static assets, global prefix, and CORS callbacks", () => {
    const app = createApp();
    const runtimeConfig = createRuntimeConfig();

    setupApiHttpApplication({ app, runtimeConfig });

    expect(app.useStaticAssets).toHaveBeenCalledWith(
      runtimeConfig.badgeOutputDirectory,
      expect.objectContaining({
        prefix: "/badge/",
        etag: true,
        lastModified: true,
        maxAge: "5m",
      })
    );
    expect(app.setGlobalPrefix).toHaveBeenCalledWith("api");

    const staticAssetOptions = vi.mocked(app.useStaticAssets).mock.calls[0]?.[1] as {
      setHeaders(response: { setHeader: ReturnType<typeof vi.fn> }, filePath: string): void;
    };
    const response = {
      setHeader: vi.fn(),
    };

    staticAssetOptions.setHeaders(response, "/tmp/badges/badge.svg");
    staticAssetOptions.setHeaders(response, "/tmp/badges/readme.txt");

    expect(response.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(response.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "public, no-cache, must-revalidate"
    );

    const corsOptions = vi.mocked(app.enableCors).mock.calls[0]?.[0] as {
      origin(
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void
      ): void;
    };
    const allowedCallback = vi.fn();
    const sameOriginCallback = vi.fn();
    const rejectedCallback = vi.fn();

    corsOptions.origin(undefined, sameOriginCallback);
    corsOptions.origin("https://programmers-badge.jh8459.com", allowedCallback);
    corsOptions.origin("https://example.com", rejectedCallback);

    expect(sameOriginCallback).toHaveBeenCalledWith(null, true);
    expect(allowedCallback).toHaveBeenCalledWith(null, true);
    expect(rejectedCallback).toHaveBeenCalledWith(expect.any(Error), false);
  });
});
