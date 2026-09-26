import { mkdirSync, mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createProgrammersBadgeRenderModel, renderBadgeSvg } from "@programmers-badge/badge-core";
import { describe, expect, it } from "vitest";

import type { BadgeProfileRecord } from "./badge-profile.repository";
import { BadgeAssetService } from "./badge-asset.service";

const restoreEnvValue = (key: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

describe("BadgeAssetService", () => {
  it("rethrows non-missing-file errors while reading cached badges", () => {
    const badgeOutputDirectory = mkdtempSync(join(tmpdir(), "programmers-badge-assets-"));
    const originalBadgeOutputDirectory = process.env.BADGE_OUTPUT_DIR;
    const service = new BadgeAssetService();

    process.env.BADGE_OUTPUT_DIR = badgeOutputDirectory;
    mkdirSync(join(badgeOutputDirectory, "blocked.svg"));

    try {
      expect(() => service.readPublicBadge({ slug: "blocked" })).toThrow();
    } finally {
      restoreEnvValue("BADGE_OUTPUT_DIR", originalBadgeOutputDirectory);
      rmSync(badgeOutputDirectory, { recursive: true, force: true });
    }
  });

  it("does not rewrite an SVG file when the rendered badge is unchanged", () => {
    const badgeOutputDirectory = mkdtempSync(join(tmpdir(), "programmers-badge-assets-"));
    const originalBadgeOutputDirectory = process.env.BADGE_OUTPUT_DIR;
    const service = new BadgeAssetService();
    const record: BadgeProfileRecord = {
      programmerId: "stable-user-id",
      displayName: "Badge User",
      publicSlug: "aabbccddeeff",
      solvedCount: 20,
      solvedTotal: 50,
      skillLevel: 1,
      rankingScore: 500,
      rankingRank: 10,
      badgeTier: "starter",
      syncedAt: "2026-04-07T01:02:03.000Z",
      createdAt: "2026-04-07T01:02:03.000Z",
      updatedAt: "2026-04-07T01:02:03.000Z",
    };
    const expectedSvg = renderBadgeSvg(
      createProgrammersBadgeRenderModel({
        displayName: record.displayName,
        solvedCount: record.solvedCount,
        solvedTotal: record.solvedTotal,
        skillLevel: record.skillLevel,
        rankingScore: record.rankingScore,
        rankingRank: record.rankingRank,
      })
    );
    const badgeFilePath = join(badgeOutputDirectory, `${record.publicSlug}.svg`);
    const oldModifiedTime = new Date("2000-01-01T00:00:00.000Z");

    process.env.BADGE_OUTPUT_DIR = badgeOutputDirectory;

    try {
      writeFileSync(badgeFilePath, expectedSvg, "utf8");
      utimesSync(badgeFilePath, oldModifiedTime, oldModifiedTime);

      expect(service.writePublicBadge({ record })).toBe(expectedSvg);
      expect(statSync(badgeFilePath).mtimeMs).toBe(oldModifiedTime.getTime());
    } finally {
      restoreEnvValue("BADGE_OUTPUT_DIR", originalBadgeOutputDirectory);
      rmSync(badgeOutputDirectory, { recursive: true, force: true });
    }
  });
});
