import {
  parseBadgeSyncResponse,
  parsePublicBadgeResponse,
  type BadgeSyncResponse,
  type PublicBadgeResponse,
} from "@programmers-badge/shared-types";

import type { BadgeProfileRecord } from "../persistence/badge-profile.repository";
import { getPublicBadgePathPrefix, getPublicBaseUrl } from "./badge-runtime";

export const buildPublicBadgeResponse = (slug: string): PublicBadgeResponse => {
  const badgeUrl = `${getPublicBaseUrl()}${getPublicBadgePathPrefix()}/${slug}.svg`;
  const miniBadgeUrl = `${getPublicBaseUrl()}${getPublicBadgePathPrefix()}/${slug}-mini.svg`;

  return parsePublicBadgeResponse({
    slug,
    badgeUrl,
    miniBadgeUrl,
    markdownSnippet: `![Programmers Badge](${badgeUrl})`,
    miniMarkdownSnippet: `![Programmers Mini Badge](${miniBadgeUrl})`,
  });
};

export const buildBadgeSyncResponse = (record: BadgeProfileRecord): BadgeSyncResponse =>
  parseBadgeSyncResponse({
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
