import { describe, expect, it } from "vitest";

import { getBadgeTierFromSkillLevel, toBadgeSyncPayload } from "../src/shared/programmers-record";

describe("programmers record normalization", () => {
  it("maps v1-style record data into the sync payload", () => {
    expect(
      toBadgeSyncPayload(
        {
          name: "  programmers-user  ",
          skillCheck: { level: 4 },
          ranking: { score: 15320, rank: 87 },
          codingTest: { solved: 212, total: 530 },
        },
        "2026-04-19T10:00:00.000Z"
      )
    ).toEqual({
      programmerHandle: "programmers-user",
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
});
