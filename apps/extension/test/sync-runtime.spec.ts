import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/background/api-client", () => ({
  syncBadgePayload: vi.fn(),
}));

import { syncBadgePayload } from "../src/background/api-client";
import {
  createAutoSyncDeduper,
  performSyncForActiveTab,
  performSyncForTab,
} from "../src/background/sync-runtime";

const mockedSyncBadgePayload = vi.mocked(syncBadgePayload);

describe("createAutoSyncDeduper", () => {
  it("dedupes the same tab within the cooldown window", () => {
    let now = 10_000;
    const deduper = createAutoSyncDeduper({ cooldownMs: 5_000, now: () => now });

    expect(deduper.shouldProcess({ tabId: 7 })).toBe(true);
    expect(deduper.shouldProcess({ tabId: 7 })).toBe(false);

    now += 5_001;

    expect(deduper.shouldProcess({ tabId: 7 })).toBe(true);
  });

  it("uses fingerprint keys when provided", () => {
    const deduper = createAutoSyncDeduper({ cooldownMs: 5_000, now: () => 20_000 });

    expect(deduper.shouldProcess({ tabId: 3, fingerprint: "solve-success:123" })).toBe(true);
    expect(deduper.shouldProcess({ tabId: 99, fingerprint: "solve-success:123" })).toBe(false);
    expect(deduper.shouldProcess({ tabId: 99, fingerprint: "solve-success:456" })).toBe(true);
  });
});

describe("sync runtime", () => {
  beforeEach(() => {
    mockedSyncBadgePayload.mockReset();
    mockedSyncBadgePayload.mockResolvedValue({
      slug: "abc123def456",
      badgeUrl: "http://localhost:3000/badge/abc123def456.svg",
      markdownSnippet: "![Programmers Badge](http://localhost:3000/badge/abc123def456.svg)",
      programmerHandle: "programmers-user",
      displayName: "Programmers User",
      solvedCount: 123,
      solvedTotal: 456,
      skillLevel: 3,
      rankingScore: 9876,
      rankingRank: 12,
      badgeTier: "intermediate",
      syncedAt: "2026-04-19T10:00:00.000Z",
    });

    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        tabs: {
          get: vi.fn(async (tabId: number) => ({
            id: tabId,
            url: "https://school.programmers.co.kr/learn/challenges/30",
          })),
          query: vi.fn(async () => [
            {
              id: 41,
              url: "https://school.programmers.co.kr/learn/challenges/41",
            },
          ]),
        },
        scripting: {
          executeScript: vi.fn(async ({ target }: { target: { tabId: number } }) => [
            {
              result: {
                ok: true,
                record: {
                  name: `Programmers User ${target.tabId}`,
                  skillCheck: { level: 3 },
                  ranking: { score: 9876, rank: 12 },
                  codingTest: { solved: 123, total: 456 },
                },
              },
            },
          ]),
        },
      },
    });
  });

  it("syncs a provided tab id without relying on the active tab query", async () => {
    const nextState = await performSyncForTab(77);

    expect(globalThis.chrome.tabs.get).toHaveBeenCalledWith(77);
    expect(globalThis.chrome.tabs.query).not.toHaveBeenCalled();
    expect(globalThis.chrome.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 77 },
      })
    );
    expect(nextState.status).toBe("success");
    expect(nextState.message).toContain("localhost:3000");
  });

  it("keeps the manual sync path working through the active tab query", async () => {
    const nextState = await performSyncForActiveTab();

    expect(globalThis.chrome.tabs.query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
    expect(globalThis.chrome.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 41 },
      })
    );
    expect(nextState.status).toBe("success");
    expect(nextState.lastSync?.displayName).toBe("Programmers User");
  });
});
