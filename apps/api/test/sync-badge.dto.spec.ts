import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { describe, expect, it } from "vitest";

import { SyncBadgeDto } from "../src/sync/dto/sync-badge.dto";

describe("SyncBadgeDto", () => {
  it("rejects whitespace-only programmer handles after trimming", () => {
    const dto = plainToInstance(SyncBadgeDto, {
      programmerHandle: "   ",
      displayName: "Sync User",
      solvedCount: 10,
      solvedTotal: 20,
      skillLevel: 1,
      rankingScore: 120,
      rankingRank: 4,
      badgeTier: "starter",
      syncedAt: "2026-04-07T01:02:03.000Z",
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe("programmerHandle");
  });

  it("rejects non-positive ranking ranks", () => {
    const dto = plainToInstance(SyncBadgeDto, {
      programmerHandle: "sync-user",
      displayName: "Sync User",
      solvedCount: 10,
      solvedTotal: 20,
      skillLevel: 1,
      rankingScore: 120,
      rankingRank: 0,
      badgeTier: "starter",
      syncedAt: "2026-04-07T01:02:03.000Z",
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.property).toBe("rankingRank");
  });
});
