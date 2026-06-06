import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { QueryBus } from "@nestjs/cqrs";
import { describe, expect, it, vi } from "vitest";

import {
  GetPublicBadgeQuery,
  GetPublicBadgeQueryHandler,
} from "../../query/get-public-badge.query";
import { BadgeAssetService } from "../../../infra/badge-asset.service";
import { BadgeProfileRepository } from "../../../infra/badge-profile.repository";
import { DatabaseService } from "../../../infra/database.service";

import { GetPublicBadgeUseCase } from "./get-public-badge.use-case";

const createTempBadgeOutputDirectory = (): string =>
  mkdtempSync(join(tmpdir(), "programmers-badge-assets-"));

const removeTempDirectory = (directoryPath: string): void => {
  rmSync(directoryPath, { recursive: true, force: true });
};

describe("GetPublicBadgeUseCase", () => {
  it("treats an empty cached SVG string as a cache hit", async () => {
    const queryBus = {
      execute: vi.fn(),
    } as unknown as QueryBus;
    const badgeAssetService = {
      readPublicBadge: vi.fn().mockReturnValue(""),
      writePublicBadge: vi.fn(),
    } as unknown as BadgeAssetService;
    const useCase = new GetPublicBadgeUseCase(queryBus, badgeAssetService);

    // Given: asset cache가 string | null contract 중 빈 문자열을 반환한다.
    // When: public badge를 조회한다.
    const svg = await useCase.execute({ slug: "empty-cache" });

    // Then: falsy 문자열도 명시적인 cache hit로 처리하고 DB lookup으로 넘어가지 않는다.
    expect(svg).toBe("");
    expect(badgeAssetService.readPublicBadge).toHaveBeenCalledWith({
      slug: "empty-cache",
      variant: "full",
    });
    expect(queryBus.execute).not.toHaveBeenCalled();
    expect(badgeAssetService.writePublicBadge).not.toHaveBeenCalled();
  });

  it("renders a persisted public badge svg", async () => {
    const badgeOutputDirectory = createTempBadgeOutputDirectory();
    const originalBadgeOutputDirectory = process.env.BADGE_OUTPUT_DIR;
    const databaseService = new DatabaseService(":memory:");
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
      removeTempDirectory(badgeOutputDirectory);
    }
  });
});
