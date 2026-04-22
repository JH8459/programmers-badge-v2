import type { BadgeSyncResponse, PublicBadgeResponse } from "@programmers-badge/shared-types";

import type { BadgeProfileRecord } from "../persistence/badge-profile.repository";

const DEFAULT_PORT = "3000";

const getPublicBaseUrl = (): string => {
  const configuredBaseUrl = process.env.PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const port = process.env.PORT?.trim() || DEFAULT_PORT;
  return `http://localhost:${port}`;
};

export const buildPublicBadgeResponse = (slug: string): PublicBadgeResponse => {
  const badgeUrl = `${getPublicBaseUrl()}/api/badge/${slug}.svg`;

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
