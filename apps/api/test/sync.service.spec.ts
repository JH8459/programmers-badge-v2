import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { BadgeAssetService } from "../src/badge/badge-asset.service";
import { describe, expect, it } from "vitest";

import { BadgeProfileRepository } from "../src/persistence/badge-profile.repository";
import { DatabaseService } from "../src/persistence/database.service";
import { SyncService } from "../src/sync/sync.service";

import {
  createTempBadgeOutputDirectory,
  createTempDatabasePath,
  removeTempDatabase,
  removeTempDirectory,
} from "./test-helpers";

describe("SyncService", () => {
  it("upserts badge data and returns a public badge response", () => {
    const databasePath = createTempDatabasePath();
    const badgeOutputDirectory = createTempBadgeOutputDirectory();
    const originalBadgeOutputDirectory = process.env.BADGE_OUTPUT_DIR;
    const databaseService = new DatabaseService(databasePath);
    const repository = new BadgeProfileRepository(databaseService);
    const badgeAssetService = new BadgeAssetService();
    const service = new SyncService(repository, badgeAssetService);

    process.env.BADGE_OUTPUT_DIR = badgeOutputDirectory;

    try {
      const response = service.syncBadge({
        programmerHandle: "  sync-user  ",
        displayName: "  Sync User  ",
        solvedCount: 32,
        solvedTotal: 120,
        skillLevel: 3,
        rankingScore: 5820,
        rankingRank: 17,
        badgeTier: "intermediate",
        syncedAt: "2026-04-07T01:02:03.000Z",
      });

      expect(response.slug).toHaveLength(12);
      expect(response.badgeUrl).toContain(`/badge/${response.slug}.svg`);
      expect(response.markdownSnippet).toContain(response.badgeUrl);
      expect(response.displayName).toBe("Sync User");
      expect(response.rankingScore).toBe(5820);

      const savedRecord = repository.findByProgrammerHandle("sync-user");
      expect(savedRecord).not.toBeNull();
      expect(savedRecord?.displayName).toBe("Sync User");
      expect(savedRecord?.badgeTier).toBe("intermediate");
      expect(savedRecord?.solvedCount).toBe(32);
      expect(savedRecord?.solvedTotal).toBe(120);
      expect(savedRecord?.skillLevel).toBe(3);
      expect(savedRecord?.rankingScore).toBe(5820);
      expect(savedRecord?.rankingRank).toBe(17);

      const badgeFilePath = join(badgeOutputDirectory, `${response.slug}.svg`);
      expect(existsSync(badgeFilePath)).toBe(true);
      expect(readFileSync(badgeFilePath, "utf8")).toContain("Sync User");
    } finally {
      process.env.BADGE_OUTPUT_DIR = originalBadgeOutputDirectory;
      databaseService.onModuleDestroy();
      removeTempDatabase(databasePath);
      removeTempDirectory(badgeOutputDirectory);
    }
  });
});
