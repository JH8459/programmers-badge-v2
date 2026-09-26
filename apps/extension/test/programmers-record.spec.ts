import { describe, expect, it } from "vitest";

import { getBadgeTierFromSkillLevel } from "@programmers-badge/shared-types";
import { parseProgrammersRecord, toBadgeSyncPayload } from "../src/shared/programmers-record";

describe("programmers record normalization", () => {
  it("maps v1-style record data into the sync payload", () => {
    expect(
      toBadgeSyncPayload({
        input: {
          id: 83164003,
          name: "  programmers-user  ",
          skillCheck: { level: 4 },
          ranking: { score: 15320, rank: 87 },
          codingTest: { solved: 212, total: 530 },
        },
        syncedAt: "2026-04-19T10:00:00.000Z",
        legacyProgrammerHandle: "old-programmers-name",
      })
    ).toEqual({
      programmerId: "83164003",
      legacyProgrammerHandle: "old-programmers-name",
      displayName: "programmers-user",
      solvedCount: 212,
      solvedTotal: 530,
      skillLevel: 4,
      rankingScore: 15320,
      rankingRank: 87,
      badgeTier: "advanced",
      syncedAt: "2026-04-19T10:00:00.000Z",
    });
  });

  it("maps skill levels to the current badge tiers", () => {
    expect(getBadgeTierFromSkillLevel(0)).toBe("starter");
    expect(getBadgeTierFromSkillLevel(2)).toBe("intermediate");
    expect(getBadgeTierFromSkillLevel(4)).toBe("advanced");
  });

  it("rejects invalid external record payloads", () => {
    expect(() => parseProgrammersRecord("not-an-object")).toThrow();
  });

  it("rejects partial upstream records instead of treating missing statistics as zero", () => {
    expect(() =>
      parseProgrammersRecord({
        id: 83164003,
        name: "Programmers User",
        skillCheck: { level: 3 },
        ranking: { score: 9876 },
        codingTest: { solved: 123 },
      })
    ).toThrow();
  });

  it("rejects upstream records without a stable user identifier", () => {
    expect(() =>
      parseProgrammersRecord({
        name: "Programmers User",
        skillCheck: { level: 3 },
        ranking: { score: 9876, rank: 12 },
        codingTest: { solved: 123, total: 456 },
      })
    ).toThrow();
  });
});
