import { z } from "zod";

export const definedValueSchema = z.unknown().refine(
  (value) => value !== undefined && value !== null,
  { message: "Required value must be defined." }
);

export const createNonEmptyArraySchema = <ElementSchema extends z.ZodType>(
  elementSchema: ElementSchema
) => z.array(elementSchema).nonempty();

export const badgeFormatSchema = z.enum(["svg", "markdown"]);
export const badgeTierSchema = z.enum(["starter", "intermediate", "advanced"]);
export const publicBadgeSlugSchema = z.string().regex(/^[a-f0-9]{12}$/);

export const SUPPORTED_BADGE_FORMATS = badgeFormatSchema.options;
export const BADGE_TIERS = badgeTierSchema.options;

export const getBadgeTierFromSkillLevel = (skillLevel: number): BadgeTier => {
  if (skillLevel >= 4) {
    return "advanced";
  }

  if (skillLevel >= 2) {
    return "intermediate";
  }

  return "starter";
};

// API와 extension이 같은 런타임 계약을 쓰도록 zod schema를 단일 기준으로 둔다.
export const badgeSyncPayloadSchema = z.strictObject({
  programmerId: z.string().trim().min(1).max(128),
  legacyProgrammerHandle: z.string().trim().min(1).max(128).optional(),
  displayName: z.string().trim().min(1),
  solvedCount: z.number().int().min(0),
  solvedTotal: z.number().int().min(0),
  skillLevel: z.number().int().min(0),
  rankingScore: z.number().int().min(0),
  rankingRank: z.number().int().min(1),
  badgeTier: badgeTierSchema,
  syncedAt: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value).toISOString()),
}).refine(({ solvedCount, solvedTotal }) => solvedCount <= solvedTotal, {
  path: ["solvedTotal"],
  message: "Solved problem count cannot exceed the total problem count.",
}).refine(({ badgeTier, skillLevel }) => badgeTier === getBadgeTierFromSkillLevel(skillLevel), {
  path: ["badgeTier"],
  message: "Badge tier must match the skill level.",
});

export const publicBadgeResponseSchema = z.strictObject({
  slug: publicBadgeSlugSchema,
  badgeUrl: z.string().url(),
  miniBadgeUrl: z.string().url(),
  markdownSnippet: z.string().trim().min(1),
  miniMarkdownSnippet: z.string().trim().min(1),
});

export const badgeSyncResponseSchema = z.strictObject({
  ...publicBadgeResponseSchema.shape,
  displayName: badgeSyncPayloadSchema.shape.displayName,
  solvedCount: badgeSyncPayloadSchema.shape.solvedCount,
  solvedTotal: badgeSyncPayloadSchema.shape.solvedTotal,
  skillLevel: badgeSyncPayloadSchema.shape.skillLevel,
  rankingScore: badgeSyncPayloadSchema.shape.rankingScore,
  rankingRank: badgeSyncPayloadSchema.shape.rankingRank,
  badgeTier: badgeSyncPayloadSchema.shape.badgeTier,
  syncedAt: badgeSyncPayloadSchema.shape.syncedAt,
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
