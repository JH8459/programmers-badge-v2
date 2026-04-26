import type { BadgeSyncResponse, PublicBadgeResponse } from "@programmers-badge/shared-types";

import type { BadgeProfileRecord } from "../persistence/badge-profile.repository";
import { getPublicBadgePathPrefix, getPublicBaseUrl } from "./badge-runtime";

export const buildPublicBadgeResponse = (slug: string): PublicBadgeResponse => {
  const badgeUrl = `${getPublicBaseUrl()}${getPublicBadgePathPrefix()}/${slug}.svg`;

  return {
    slug,
    badgeUrl,
    markdownSnippet: `![Programmers Badge](${badgeUrl})`,
  };
};

export const buildBadgeSyncResponse = (record: BadgeProfileRecord): BadgeSyncResponse => ({
  ...buildPublicBadgeResponse(record.publicSlug),
  programmerHandle: record.programmerHandle,
  displayName: record.displayName,
  solvedCount: record.solvedCount,
  solvedTotal: record.solvedTotal,
  skillLevel: record.skillLevel,
  rankingScore: record.rankingScore,
  rankingRank: record.rankingRank,
  badgeTier: record.badgeTier,
  syncedAt: record.syncedAt,
});
