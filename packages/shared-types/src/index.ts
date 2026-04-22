export const SUPPORTED_BADGE_FORMATS = ["svg", "markdown"] as const;
export const BADGE_TIERS = ["starter", "intermediate", "advanced"] as const;

export type BadgeFormat = (typeof SUPPORTED_BADGE_FORMATS)[number];
export type BadgeTier = (typeof BADGE_TIERS)[number];

export interface BadgeSyncPayload {
  programmerHandle: string;
  displayName: string;
  solvedCount: number;
  solvedTotal: number;
  skillLevel: number;
  rankingScore: number;
  rankingRank: number;
  badgeTier: BadgeTier;
  syncedAt: string;
}

export interface PublicBadgeResponse {
  slug: string;
  badgeUrl: string;
  markdownSnippet: string;
}

export interface BadgeSyncResponse extends PublicBadgeResponse, BadgeSyncPayload {}
