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

export const solutionLanguageSchema = z.enum([
  "c",
  "cpp",
  "csharp",
  "go",
  "java",
  "javascript",
  "kotlin",
  "mysql",
  "oracle",
  "php",
  "python2",
  "python3",
  "ruby",
  "rust",
  "scala",
  "swift",
]);

export const solutionRecordPayloadSchema = z.strictObject({
  submissionId: z.string().uuid(),
  problemId: z.string().regex(/^\d+$/).max(32),
  problemName: z.string().trim().min(1).max(200),
  difficulty: z.string().trim().min(1).max(40),
  problemUrl: z.string().url().refine((value) => {
    const hostname = new URL(value).hostname;
    return new URL(value).protocol === "https:" && hostname === "school.programmers.co.kr";
  }, "Problem URL must point to Programmers School."),
  language: solutionLanguageSchema,
  sourceCode: z.string().min(1).max(1_000_000).refine((value) => value.trim().length > 0),
  submittedAt: z.string().datetime({ offset: true }).transform((value) => new Date(value).toISOString()),
  resultSummary: z.string().trim().min(1).max(200),
  performanceSummary: z.string().trim().max(500).nullable(),
  description: z.string().trim().max(20_000),
  constraints: z.string().trim().max(20_000),
  examplesMarkdown: z.string().trim().max(20_000),
});
export const solutionRecordMetadataSchema = solutionRecordPayloadSchema.omit({ sourceCode: true });

export const githubRepositorySchema = z.strictObject({
  id: z.number().int().positive(),
  owner: z.string().trim().min(1),
  name: z.string().trim().min(1),
  fullName: z.string().trim().min(3),
  isPrivate: z.boolean(),
  defaultBranch: z.string().trim().min(1),
});

export const githubRepositorySettingsSchema = z.strictObject({
  repositoryId: z.number().int().positive(),
  branch: z.string().trim().min(1).max(255),
  basePath: z.string().trim().max(500),
});

export const githubConnectionResponseSchema = z.strictObject({
  connected: z.boolean(),
  accountLogin: z.string().nullable(),
  installationId: z.number().int().positive().nullable(),
  settings: githubRepositorySettingsSchema.extend({
    repository: githubRepositorySchema,
  }).nullable(),
});

export const solutionRecordStatusSchema = z.enum(["saved", "failed", "skipped"]);

export const solutionRecordResultSchema = z.strictObject({
  submissionId: z.string().uuid(),
  status: solutionRecordStatusSchema,
  message: z.string().trim().min(1),
  commitUrl: z.url().nullable(),
});

export const failedSolutionRecordSchema = z.strictObject({
  submissionId: z.string().uuid(),
  problemId: z.string().regex(/^\d+$/),
  problemName: z.string().trim().min(1),
  language: solutionLanguageSchema,
  status: z.literal("failed"),
  errorMessage: z.string().trim().min(1),
  attemptCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime({ offset: true }),
});

export type BadgeFormat = z.infer<typeof badgeFormatSchema>;
export type BadgeTier = z.infer<typeof badgeTierSchema>;
export type BadgeSyncPayload = z.infer<typeof badgeSyncPayloadSchema>;
export type PublicBadgeResponse = z.infer<typeof publicBadgeResponseSchema>;
export type BadgeSyncResponse = z.infer<typeof badgeSyncResponseSchema>;
export type SolutionLanguage = z.infer<typeof solutionLanguageSchema>;
export type SolutionRecordPayload = z.infer<typeof solutionRecordPayloadSchema>;
export type SolutionRecordMetadata = z.infer<typeof solutionRecordMetadataSchema>;
export type GitHubRepository = z.infer<typeof githubRepositorySchema>;
export type GitHubRepositorySettings = z.infer<typeof githubRepositorySettingsSchema>;
export type GitHubConnectionResponse = z.infer<typeof githubConnectionResponseSchema>;
export type SolutionRecordResult = z.infer<typeof solutionRecordResultSchema>;
export type FailedSolutionRecord = z.infer<typeof failedSolutionRecordSchema>;

export const parseBadgeSyncPayload = (input: unknown): BadgeSyncPayload =>
  badgeSyncPayloadSchema.parse(input);

export const parsePublicBadgeResponse = (input: unknown): PublicBadgeResponse =>
  publicBadgeResponseSchema.parse(input);

export const parseBadgeSyncResponse = (input: unknown): BadgeSyncResponse =>
  badgeSyncResponseSchema.parse(input);
