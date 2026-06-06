import { afterEach, describe, expect, it, vi } from "vitest";

describe("main bootstrap", () => {
  afterEach(() => {
    vi.doUnmock("@nestjs/core");
    vi.doUnmock("./api-http.setup");
    vi.doUnmock("./common/runtime-config");
    vi.resetModules();
  });

  it("creates the Nest app, configures HTTP wiring, and listens on the configured port", async () => {
    const runtimeConfig = {
      port: 4123,
      publicBaseUrl: "http://localhost:4123",
      publicBadgePathPrefix: "/badge",
      databasePath: ":memory:",
      badgeOutputDirectory: "/tmp/badges",
      allowedWebOrigins: [],
      allowLocalhostOrigins: false,
      swaggerEnabled: false,
      swaggerAuth: null,
    };
    const app = {
      listen: vi.fn().mockResolvedValue(undefined),
    };
    const create = vi.fn().mockResolvedValue(app);
    const setupApiHttpApplication = vi.fn();
    const readApiRuntimeConfig = vi.fn().mockReturnValue(runtimeConfig);

    vi.doMock("@nestjs/core", () => ({
      NestFactory: {
        create,
      },
    }));
    vi.doMock("./api-http.setup", () => ({
      setupApiHttpApplication,
    }));
    vi.doMock("./common/runtime-config", () => ({
      readApiRuntimeConfig,
    }));

    await import("./main.js");

    await vi.waitFor(() => {
      expect(app.listen).toHaveBeenCalledWith(4123);
    });
    expect(readApiRuntimeConfig).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
    expect(setupApiHttpApplication).toHaveBeenCalledWith({ app, runtimeConfig });
  });
});
