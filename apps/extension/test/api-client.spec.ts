import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalChrome = globalThis.chrome;
const originalFetch = globalThis.fetch;

describe("api client runtime config and response validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();

    if (originalChrome) {
      Object.defineProperty(globalThis, "chrome", {
        configurable: true,
        value: originalChrome,
      });
    } else {
      // @ts-expect-error 테스트용 shim 제거
      delete globalThis.chrome;
    }

    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  it("derives the hosted API base URL from manifest host permissions", async () => {
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        runtime: {
          getManifest: () => ({
            host_permissions: ["https://programmers-badge.example.com/*"],
          }),
        },
      },
    });

    const { EXTENSION_API_BASE_URL, EXTENSION_API_HOST } = await import("../src/background/api-client");

    expect(EXTENSION_API_BASE_URL).toBe("https://programmers-badge.example.com");
    expect(EXTENSION_API_HOST).toBe("programmers-badge.example.com");
  });

  it("falls back to the production API host when manifest permissions are unavailable", async () => {
    const { EXTENSION_API_BASE_URL, EXTENSION_API_HOST } = await import("../src/background/api-client");

    expect(EXTENSION_API_BASE_URL).toBe("https://api.programmers-badge.jh8459.com");
    expect(EXTENSION_API_HOST).toBe("api.programmers-badge.jh8459.com");
  });

  it("rejects invalid API response payloads", async () => {
    const { syncBadgePayload } = await import("../src/background/api-client");

    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ invalid: true }), { status: 200 }));

    await expect(
      syncBadgePayload({
        programmerId: "sync-user",
        displayName: "Sync User",
        solvedCount: 10,
        solvedTotal: 20,
        skillLevel: 1,
        rankingScore: 120,
        rankingRank: 4,
        badgeTier: "starter",
        syncedAt: "2026-04-07T01:02:03.000Z",
      })
    ).rejects.toThrow();
  });

  it("retries transient server failures a bounded number of times", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("busy", { status: 503 }));
    globalThis.fetch = fetchMock;
    const { syncBadgePayload } = await import("../src/background/api-client");
    const payload = {
      programmerId: "sync-user",
      displayName: "Sync User",
      solvedCount: 10,
      solvedTotal: 20,
      skillLevel: 1,
      rankingScore: 120,
      rankingRank: 4,
      badgeTier: "starter" as const,
      syncedAt: "2026-04-07T01:02:03.000Z",
    };
    const result = expect(syncBadgePayload(payload)).rejects.toThrow(
      "배지 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요."
    );

    await vi.runAllTimersAsync();
    await result;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
