import { Injectable } from "@nestjs/common";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { createProgrammersBadgeRenderModel, renderBadgeSvg } from "@programmers-badge/badge-core";

import type { BadgeProfileRecord } from "../persistence/badge-profile.repository";
import { getBadgeOutputDirectory } from "./badge-runtime";

@Injectable()
export class BadgeAssetService {
  private getBadgeFilePath(slug: string): string {
    return join(getBadgeOutputDirectory(), `${slug}.svg`);
  }

  readPublicBadge(slug: string): string | null {
    try {
      return readFileSync(this.getBadgeFilePath(slug), "utf8");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }

      throw error;
    }
  }

  writePublicBadge(record: BadgeProfileRecord): string {
    const badgeSvg = renderBadgeSvg(
      createProgrammersBadgeRenderModel({
        displayName: record.displayName,
        solvedCount: record.solvedCount,
        solvedTotal: record.solvedTotal,
        skillLevel: record.skillLevel,
        rankingScore: record.rankingScore,
        rankingRank: record.rankingRank,
      })
    );
    const badgeFilePath = this.getBadgeFilePath(record.publicSlug);

    mkdirSync(dirname(badgeFilePath), { recursive: true });

    const temporaryFilePath = `${badgeFilePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    writeFileSync(temporaryFilePath, badgeSvg, "utf8");
    renameSync(temporaryFilePath, badgeFilePath);

    return badgeSvg;
  }
}
