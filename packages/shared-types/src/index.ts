import { z } from "zod";

export const SUPPORTED_BADGE_FORMATS = ["svg", "markdown"] as const;
export const BADGE_TIERS = ["starter", "intermediate", "advanced"] as const;

export const badgeFormatSchema = z.enum(SUPPORTED_BADGE_FORMATS);
export const badgeTierSchema = z.enum(BADGE_TIERS);

// API와 extension이 같은 런타임 계약을 쓰도록 zod schema를 단일 기준으로 둔다.
export const badgeSyncPayloadSchema = z.strictObject({
  programmerHandle: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  solvedCount: z.number().int().min(0),
  solvedTotal: z.number().int().min(0),
  skillLevel: z.number().int().min(0),
  rankingScore: z.number().int().min(0),
  rankingRank: z.number().int().min(1),
  badgeTier: badgeTierSchema,
  syncedAt: z.string().datetime({ offset: true }),
});

export const publicBadgeResponseSchema = z.strictObject({
  slug: z.string().trim().min(1),
  badgeUrl: z.string().url(),
  miniBadgeUrl: z.string().url(),
  markdownSnippet: z.string().trim().min(1),
  miniMarkdownSnippet: z.string().trim().min(1),
});

export const badgeSyncResponseSchema = z.strictObject({
  ...publicBadgeResponseSchema.shape,
  ...badgeSyncPayloadSchema.shape,
});

export type BadgeFormat = z.infer<typeof badgeFormatSchema>;
export type BadgeTier = z.infer<typeof badgeTierSchema>;
export type BadgeSyncPayload = z.infer<typeof badgeSyncPayloadSchema>;
export type PublicBadgeResponse = z.infer<typeof publicBadgeResponseSchema>;
export type BadgeSyncResponse = z.infer<typeof badgeSyncResponseSchema>;

export const parseBadgeSyncPayload = (input: unknown): BadgeSyncPayload =>
  badgeSyncPayloadSchema.parse(input);

export const parsePublicBadgeResponse = (input: unknown): PublicBadgeResponse =>
  publicBadgeResponseSchema.parse(input);

export const parseBadgeSyncResponse = (input: unknown): BadgeSyncResponse =>
  badgeSyncResponseSchema.parse(input);
