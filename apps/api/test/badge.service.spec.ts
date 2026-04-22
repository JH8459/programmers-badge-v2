import { describe, expect, it } from "vitest";

import { BadgeService } from "../src/badge/badge.service";
import { BadgeProfileRepository } from "../src/persistence/badge-profile.repository";
import { DatabaseService } from "../src/persistence/database.service";

import { createTempDatabasePath, removeTempDatabase } from "./test-helpers";

describe("BadgeService", () => {
  it("renders a persisted public badge svg", () => {
    const databasePath = createTempDatabasePath();
    const databaseService = new DatabaseService(databasePath);
    const repository = new BadgeProfileRepository(databaseService);

    const record = repository.upsert({
      programmerHandle: "coder-01",
      displayName: "Coder 01",
      solvedCount: 128,
      solvedTotal: 250,
      skillLevel: 4,
      rankingScore: 12000,
      rankingRank: 55,
      badgeTier: "advanced",
      syncedAt: "2026-04-07T00:00:00.000Z",
    });

    const service = new BadgeService(repository);
    const svg = service.renderPublicBadge(record.publicSlug);

    try {
      expect(svg).toContain("<svg");
      expect(svg).toContain("Programmers Badge");
      expect(svg).toContain("Advanced · 128 solved");
    } finally {
      databaseService.onModuleDestroy();
      removeTempDatabase(databasePath);
    }
  });
});
