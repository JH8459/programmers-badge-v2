import { describe, expect, it } from "vitest";

import {
  BADGE_TIERS,
  SUPPORTED_BADGE_FORMATS,
  parseBadgeSyncPayload,
  parseBadgeSyncResponse,
} from "../src/index";

describe("shared types contracts", () => {
  it("supports svg and markdown formats", () => {
    expect(SUPPORTED_BADGE_FORMATS).toEqual(["svg", "markdown"]);
  });

  it("supports the current badge tiers", () => {
    expect(BADGE_TIERS).toEqual(["starter", "intermediate", "advanced"]);
  });

  it("normalizes and validates the sync payload contract", () => {
    expect(
      parseBadgeSyncPayload({
        programmerHandle: "  sync-user  ",
        displayName: "  Sync User  ",
        solvedCount: 10,
        solvedTotal: 20,
        skillLevel: 1,
        rankingScore: 120,
        rankingRank: 4,
        badgeTier: "starter",
        syncedAt: "2026-04-07T01:02:03.000Z",
      })
    ).toEqual({
      programmerHandle: "sync-user",
      displayName: "Sync User",
      solvedCount: 10,
      solvedTotal: 20,
      skillLevel: 1,
      rankingScore: 120,
      rankingRank: 4,
      badgeTier: "starter",
      syncedAt: "2026-04-07T01:02:03.000Z",
    });
  });

  it("rejects invalid sync payload fields", () => {
    expect(() =>
      parseBadgeSyncPayload({
        programmerHandle: "sync-user",
        displayName: "Sync User",
        solvedCount: 10,
        solvedTotal: 20,
        skillLevel: 1,
        rankingScore: 120,
        rankingRank: 0,
        badgeTier: "starter",
        syncedAt: "2026-04-07T01:02:03.000Z",
      })
    ).toThrow();
  });

  it("validates the API sync response contract", () => {
    expect(
      parseBadgeSyncResponse({
        slug: "abc123def456",
        badgeUrl: "https://programmers-badge.jh8459.com/badge/abc123def456.svg",
        markdownSnippet:
          "![Programmers Badge](https://programmers-badge.jh8459.com/badge/abc123def456.svg)",
        programmerHandle: "sync-user",
        displayName: "Sync User",
        solvedCount: 10,
        solvedTotal: 20,
        skillLevel: 1,
        rankingScore: 120,
        rankingRank: 4,
        badgeTier: "starter",
        syncedAt: "2026-04-07T01:02:03.000Z",
      }).slug
    ).toBe("abc123def456");
  });
});
