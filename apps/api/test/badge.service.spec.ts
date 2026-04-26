import { existsSync } from "node:fs";
import { join } from "node:path";

import { BadgeAssetService } from "../src/badge/badge-asset.service";
import { describe, expect, it } from "vitest";

import { BadgeService } from "../src/badge/badge.service";
import { BadgeProfileRepository } from "../src/persistence/badge-profile.repository";
import { DatabaseService } from "../src/persistence/database.service";

import {
  createTempBadgeOutputDirectory,
  createTempDatabasePath,
  removeTempDatabase,
  removeTempDirectory,
} from "./test-helpers";

describe("BadgeService", () => {
  it("renders a persisted public badge svg", () => {
    const databasePath = createTempDatabasePath();
    const badgeOutputDirectory = createTempBadgeOutputDirectory();
    const originalBadgeOutputDirectory = process.env.BADGE_OUTPUT_DIR;
    const databaseService = new DatabaseService(databasePath);
    const repository = new BadgeProfileRepository(databaseService);
    const badgeAssetService = new BadgeAssetService();

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

    process.env.BADGE_OUTPUT_DIR = badgeOutputDirectory;

    try {
      const service = new BadgeService(repository, badgeAssetService);
      const svg = service.renderPublicBadge(record.publicSlug);

      expect(svg).toContain("<svg");
      expect(svg).toContain('width="350px"');
      expect(svg).toContain("data:image/png;base64,");
      expect(svg).toContain("Coder 01");
      expect(svg).toContain(">4</text>");
      expect(svg).toContain("12,000");
      expect(svg).toContain("128");
      expect(svg).toContain("55");
      expect(existsSync(join(badgeOutputDirectory, `${record.publicSlug}.svg`))).toBe(true);
    } finally {
      process.env.BADGE_OUTPUT_DIR = originalBadgeOutputDirectory;
      databaseService.onModuleDestroy();
      removeTempDatabase(databasePath);
      removeTempDirectory(badgeOutputDirectory);
    }
  });
});
