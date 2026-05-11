import { Injectable } from "@nestjs/common";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  createProgrammersBadgeRenderModel,
  renderBadgeSvg,
  renderMiniBadgeSvg,
} from "@programmers-badge/badge-core";

import type { BadgeProfileRecord } from "../persistence/badge-profile.repository";
import { getBadgeOutputDirectory } from "./badge-runtime";

type BadgeAssetVariant = "full" | "mini";

@Injectable()
export class BadgeAssetService {
  private getBadgeFilePath(slug: string, variant: BadgeAssetVariant): string {
    const fileName = variant === "mini" ? `${slug}-mini.svg` : `${slug}.svg`;

    return join(getBadgeOutputDirectory(), fileName);
  }

  readPublicBadge(slug: string, variant: BadgeAssetVariant = "full"): string | null {
    try {
      return readFileSync(this.getBadgeFilePath(slug, variant), "utf8");
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

  writePublicBadge(record: BadgeProfileRecord, variant: BadgeAssetVariant = "full"): string {
    const renderModel = createProgrammersBadgeRenderModel({
      displayName: record.displayName,
      solvedCount: record.solvedCount,
      solvedTotal: record.solvedTotal,
      skillLevel: record.skillLevel,
      rankingScore: record.rankingScore,
      rankingRank: record.rankingRank,
    });
    const badgeSvg = variant === "mini" ? renderMiniBadgeSvg(renderModel) : renderBadgeSvg(renderModel);
    const badgeFilePath = this.getBadgeFilePath(record.publicSlug, variant);

    mkdirSync(dirname(badgeFilePath), { recursive: true });

    // 부분적으로 써진 SVG가 노출되지 않도록 임시 파일에 쓴 뒤 교체한다.
    const temporaryFilePath = `${badgeFilePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    writeFileSync(temporaryFilePath, badgeSvg, "utf8");
    renameSync(temporaryFilePath, badgeFilePath);

    return badgeSvg;
  }
}
