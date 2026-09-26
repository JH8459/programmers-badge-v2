import { runInNewContext } from "node:vm";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/background/api-client", () => ({
  EXTENSION_API_HOST: "api.programmers-badge.jh8459.com",
  syncBadgePayload: vi.fn(),
}));

import { syncBadgePayload } from "../src/background/api-client";
import {
  createAutoSyncDeduper,
  performSyncForActiveTab,
  performSyncForTab,
} from "../src/background/sync-runtime";

const mockedSyncBadgePayload = vi.mocked(syncBadgePayload);
const mockedFetch = vi.fn();

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
    mockedFetch.mockReset();
    mockedSyncBadgePayload.mockResolvedValue({
      slug: "abc123def456",
      badgeUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456.svg",
      miniBadgeUrl: "https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg",
      markdownSnippet:
        "![Programmers Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456.svg)",
      miniMarkdownSnippet:
        "![Programmers Mini Badge](https://api.programmers-badge.jh8459.com/badge/abc123def456-mini.svg)",
      displayName: "Programmers User",
      solvedCount: 123,
      solvedTotal: 456,
      skillLevel: 3,
      rankingScore: 9876,
      rankingRank: 12,
      badgeTier: "intermediate",
      syncedAt: "2026-04-19T10:00:00.000Z",
    });
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 83164003,
        name: "Programmers User",
        skillCheck: { level: 3 },
        ranking: { score: 9876, rank: 12 },
        codingTest: { solved: 123, total: 456 },
      }),
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
          executeScript: vi.fn(
            async ({
              target,
              func,
              args,
            }: {
              target: { tabId: number };
              func: (recordUrl: string) => Promise<unknown>;
              args: [string];
            }) => {
              const isolatedFunc = runInNewContext(`(${func.toString()})`, {
                Error,
                fetch: mockedFetch,
              });

              if (typeof isolatedFunc !== "function") {
                throw new TypeError("Injected function could not be evaluated.");
              }

              return [
                {
                  result: await isolatedFunc(...args),
                  target,
                },
              ];
            }
          ),
        },
      },
    });
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: mockedFetch,
      writable: true,
    });
  });

  it("syncs a provided tab id without relying on the active tab query", async () => {
    const nextState = await performSyncForTab({ tabId: 77 });

    expect(globalThis.chrome.tabs.get).toHaveBeenCalledWith(77);
    expect(globalThis.chrome.tabs.query).not.toHaveBeenCalled();
    expect(globalThis.chrome.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 77 },
      })
    );
    expect(mockedFetch).toHaveBeenCalledWith("https://programmers.co.kr/api/v1/users/record", {
      credentials: "include",
      headers: {
        accept: "application/json",
      },
    });
    expect(nextState.status).toBe("success");
    expect(nextState.message).toContain("api.programmers-badge.jh8459.com");
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

  it("sends a legacy handle during the one-time public slug migration", async () => {
    const nextState = await performSyncForTab({
      tabId: 77,
      legacyProgrammerHandle: "old-programmers-name",
    });

    expect(nextState.status).toBe("success");
    expect(mockedSyncBadgePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        programmerId: "83164003",
        legacyProgrammerHandle: "old-programmers-name",
      })
    );
  });

  it("retries transient upstream failures before syncing refreshed data", async () => {
    mockedFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 83164003,
          name: "Programmers User",
          skillCheck: { level: 3 },
          ranking: { score: 9876, rank: 12 },
          codingTest: { solved: 123, total: 456 },
        }),
      });

    const nextState = await performSyncForTab({ tabId: 77 });

    expect(nextState.status).toBe("success");
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(globalThis.chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
    expect(mockedSyncBadgePayload).toHaveBeenCalledTimes(1);
  });

  it("treats an invalid external record as a sync error after the page-context fetch returns", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 83164003,
        name: "Programmers User",
        skillCheck: { level: "bad" },
      }),
    });

    const nextState = await performSyncForTab({ tabId: 77 });

    expect(nextState.status).toBe("error");
    expect(nextState.message).toContain("필수 항목(skillCheck.level)");
    expect(mockedSyncBadgePayload).not.toHaveBeenCalled();
  });

  it("does not retry or sync a malformed JSON upstream response", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });

    const nextState = await performSyncForTab({ tabId: 77 });

    expect(nextState.status).toBe("error");
    expect(nextState.message).toBe("Programmers 기록 응답이 올바른 JSON 형식이 아닙니다.");
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedSyncBadgePayload).not.toHaveBeenCalled();
  });
});
