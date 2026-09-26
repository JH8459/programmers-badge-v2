import { describe, expect, it } from "vitest";

import { parseExtensionSyncState } from "../src/background/sync-state-schema";

describe("extension sync state migration", () => {
  it("keeps the last successful response and extracts the old handle for one-time migration", () => {
    const state = parseExtensionSyncState({
      status: "success",
      message: "Synced",
      lastSync: {
        slug: "abc123def456",
        badgeUrl: "https://api.programmers-badge.example.com/badge/abc123def456.svg",
        miniBadgeUrl: "https://api.programmers-badge.example.com/badge/abc123def456-mini.svg",
        markdownSnippet: "![Badge](https://api.programmers-badge.example.com/badge/abc123def456.svg)",
        miniMarkdownSnippet:
          "![Mini](https://api.programmers-badge.example.com/badge/abc123def456-mini.svg)",
        programmerHandle: "old-programmers-name",
        displayName: "New Programmers Name",
        solvedCount: 10,
        solvedTotal: 20,
        skillLevel: 1,
        rankingScore: 120,
        rankingRank: 4,
        badgeTier: "starter",
        syncedAt: "2026-04-07T01:02:03.000Z",
      },
    });

    expect(state.lastSync?.displayName).toBe("New Programmers Name");
    expect(state.lastSync).not.toHaveProperty("programmerHandle");
    expect(state.legacyProgrammerHandle).toBe("old-programmers-name");
  });
});
