import { describe, expect, it } from "vitest";

import { BadgeProfileRepository } from "../../infra/badge-profile.repository";
import { DatabaseService } from "../../infra/database.service";

import { GetPublicBadgeQuery, GetPublicBadgeQueryHandler } from "./get-public-badge.query";

describe("GetPublicBadgeQueryHandler", () => {
  it("returns a persisted badge profile by public slug", async () => {
    const databaseService = new DatabaseService(":memory:");
    const repository = new BadgeProfileRepository(databaseService);
    const handler = new GetPublicBadgeQueryHandler(repository);

    try {
      const record = repository.upsert({
        programmerHandle: "query-user",
        displayName: "Query User",
        solvedCount: 40,
        solvedTotal: 100,
        skillLevel: 3,
        rankingScore: 3_400,
        rankingRank: 12,
        badgeTier: "intermediate",
        syncedAt: "2026-04-07T01:02:03.000Z",
      });

      await expect(
        handler.execute(new GetPublicBadgeQuery({ slug: record.publicSlug }))
      ).resolves.toEqual(record);
    } finally {
      databaseService.onModuleDestroy();
    }
  });

  it("returns null when the public slug does not exist", async () => {
    const databaseService = new DatabaseService(":memory:");
    const repository = new BadgeProfileRepository(databaseService);
    const handler = new GetPublicBadgeQueryHandler(repository);

    try {
      await expect(
        handler.execute(new GetPublicBadgeQuery({ slug: "missing-slug" }))
      ).resolves.toBeNull();
    } finally {
      databaseService.onModuleDestroy();
    }
  });
});
