import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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
});
