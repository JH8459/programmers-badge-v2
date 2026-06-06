import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { CommandBus } from "@nestjs/cqrs";
import { describe, expect, it } from "vitest";

import {
  SyncBadgeCommand,
  SyncBadgeCommandHandler,
} from "../src/badge/application/command/sync-badge.command";
import { SyncBadgeUseCase } from "../src/badge/application/use-case/http/sync-badge.use-case";
import { BadgeAssetService } from "../src/badge/infra/badge-asset.service";
import { BadgeProfileRepository } from "../src/badge/infra/badge-profile.repository";
import { DatabaseService } from "../src/badge/infra/database.service";

import {
  createTempBadgeOutputDirectory,
  createTempDatabasePath,
  removeTempDatabase,
  removeTempDirectory,
} from "./test-helpers";

describe("SyncBadgeUseCase", () => {
  it("upserts badge data and returns a public badge response", async () => {
    const databasePath = createTempDatabasePath();
    const badgeOutputDirectory = createTempBadgeOutputDirectory();
    const originalBadgeOutputDirectory = process.env.BADGE_OUTPUT_DIR;
    const originalPublicBaseUrl = process.env.PUBLIC_BASE_URL;
    const databaseService = new DatabaseService(databasePath);
    const repository = new BadgeProfileRepository(databaseService);
    const badgeAssetService = new BadgeAssetService();
    const commandHandler = new SyncBadgeCommandHandler(repository);
    const commandBus = {
      execute: (command: SyncBadgeCommand) => commandHandler.execute(command),
    } as unknown as CommandBus;
    const useCase = new SyncBadgeUseCase(commandBus, badgeAssetService);

    process.env.BADGE_OUTPUT_DIR = badgeOutputDirectory;
    process.env.PUBLIC_BASE_URL = "https://api.programmers-badge.jh8459.com";

    try {
      const response = await useCase.execute({
        payload: {
          programmerHandle: "  sync-user  ",
          displayName: "  Sync User  ",
          solvedCount: 32,
          solvedTotal: 120,
          skillLevel: 3,
          rankingScore: 5820,
          rankingRank: 17,
          badgeTier: "intermediate",
          syncedAt: "2026-04-07T01:02:03.000Z",
        },
      });

      expect(response.slug).toHaveLength(12);
      expect(response.badgeUrl).toBe(
        `https://api.programmers-badge.jh8459.com/badge/${response.slug}.svg`
      );
      expect(response.miniBadgeUrl).toBe(
        `https://api.programmers-badge.jh8459.com/badge/${response.slug}-mini.svg`
      );
      expect(response.markdownSnippet).toContain(response.badgeUrl);
      expect(response.miniMarkdownSnippet).toContain(response.miniBadgeUrl);
      expect(response.displayName).toBe("Sync User");
      expect(response.rankingScore).toBe(5820);

      const savedRecord = repository.findByProgrammerHandle({ programmerHandle: "sync-user" });
      expect(savedRecord).not.toBeNull();
      expect(savedRecord?.displayName).toBe("Sync User");
      expect(savedRecord?.badgeTier).toBe("intermediate");
      expect(savedRecord?.solvedCount).toBe(32);
      expect(savedRecord?.solvedTotal).toBe(120);
      expect(savedRecord?.skillLevel).toBe(3);
      expect(savedRecord?.rankingScore).toBe(5820);
      expect(savedRecord?.rankingRank).toBe(17);

      const badgeFilePath = join(badgeOutputDirectory, `${response.slug}.svg`);
      const miniBadgeFilePath = join(badgeOutputDirectory, `${response.slug}-mini.svg`);
      expect(existsSync(badgeFilePath)).toBe(true);
      expect(existsSync(miniBadgeFilePath)).toBe(true);
      expect(readFileSync(badgeFilePath, "utf8")).toContain("Sync User");
      expect(readFileSync(miniBadgeFilePath, "utf8")).toContain("programmers");
    } finally {
      process.env.BADGE_OUTPUT_DIR = originalBadgeOutputDirectory;
      process.env.PUBLIC_BASE_URL = originalPublicBaseUrl;
      databaseService.onModuleDestroy();
      removeTempDatabase(databasePath);
      removeTempDirectory(badgeOutputDirectory);
    }
  });
});
