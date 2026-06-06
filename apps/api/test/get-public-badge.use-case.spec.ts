import { existsSync } from "node:fs";
import { join } from "node:path";

import type { QueryBus } from "@nestjs/cqrs";
import { describe, expect, it } from "vitest";

import {
  GetPublicBadgeQuery,
  GetPublicBadgeQueryHandler,
} from "../src/badge/application/query/get-public-badge.query";
import { GetPublicBadgeUseCase } from "../src/badge/application/use-case/http/get-public-badge.use-case";
import { BadgeAssetService } from "../src/badge/infra/badge-asset.service";
import { BadgeProfileRepository } from "../src/badge/infra/badge-profile.repository";
import { DatabaseService } from "../src/badge/infra/database.service";

import {
  createTempBadgeOutputDirectory,
  createTempDatabasePath,
  removeTempDatabase,
  removeTempDirectory,
} from "./test-helpers";

describe("GetPublicBadgeUseCase", () => {
  it("renders a persisted public badge svg", async () => {
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
      const queryHandler = new GetPublicBadgeQueryHandler(repository);
      const queryBus = {
        execute: (query: GetPublicBadgeQuery) => queryHandler.execute(query),
      } as unknown as QueryBus;
      const useCase = new GetPublicBadgeUseCase(queryBus, badgeAssetService);
      const svg = await useCase.execute({ slug: record.publicSlug });
      const miniSvg = await useCase.execute({ slug: record.publicSlug, variant: "mini" });

      expect(svg).toContain("<svg");
      expect(svg).toContain('width="350px"');
      expect(svg).toContain("data:image/png;base64,");
      expect(svg).toContain("Coder 01");
      expect(svg).toContain(">4</text>");
      expect(svg).toContain("12,000");
      expect(svg).toContain("128");
      expect(svg).toContain("55");
      expect(miniSvg).toContain("<svg");
      expect(miniSvg).toContain('width="110"');
      expect(miniSvg).toContain(">programmers</text>");
      expect(miniSvg).toContain(">Lv.4</text>");
      expect(existsSync(join(badgeOutputDirectory, `${record.publicSlug}.svg`))).toBe(true);
      expect(existsSync(join(badgeOutputDirectory, `${record.publicSlug}-mini.svg`))).toBe(true);
    } finally {
      process.env.BADGE_OUTPUT_DIR = originalBadgeOutputDirectory;
      databaseService.onModuleDestroy();
      removeTempDatabase(databasePath);
      removeTempDirectory(badgeOutputDirectory);
    }
  });
});
