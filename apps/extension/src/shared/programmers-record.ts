import {
  getBadgeTierFromSkillLevel,
  parseBadgeSyncPayload,
  type BadgeSyncPayload,
} from "@programmers-badge/shared-types";
import { z } from "zod";

const programmerIdSchema = z.union([
  z.string().trim().min(1),
  z.number().int().nonnegative().transform(String),
]);

const optionalProgrammerIdSchema = z.preprocess((value) => {
  const result = programmerIdSchema.safeParse(value);
  return result.success ? result.data : undefined;
}, z.string().optional());

const optionalProgrammerUserSchema = z.preprocess(
  (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value) ? value : undefined,
  z.looseObject({ id: optionalProgrammerIdSchema }).optional()
);

// upstream 필드는 늘 수 있지만, badge snapshot에 필요한 값은 전부 필수로 검증한다.
export const programmersRecordSchema = z
  .looseObject({
    id: optionalProgrammerIdSchema,
    userId: optionalProgrammerIdSchema,
    user_id: optionalProgrammerIdSchema,
    programmerId: optionalProgrammerIdSchema,
    programmer_id: optionalProgrammerIdSchema,
    user: optionalProgrammerUserSchema,
    name: z.string().trim().min(1),
    skillCheck: z.looseObject({
      level: z.number().int().nonnegative(),
    }),
    ranking: z.looseObject({
      score: z.number().int().nonnegative(),
      rank: z.number().int().positive(),
    }),
    codingTest: z.looseObject({
      solved: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
  })
  .refine(({ codingTest }) => codingTest.solved <= codingTest.total, {
    path: ["codingTest", "total"],
    message: "Solved problem count cannot exceed the total problem count.",
  });

export type ProgrammersRecord = z.infer<typeof programmersRecordSchema>;

export const parseProgrammersRecord = (input: unknown): ProgrammersRecord =>
  programmersRecordSchema.parse(input);

interface BadgeSyncPayloadInput {
  input: unknown;
  syncedAt?: string;
  legacyProgrammerHandle?: string;
}

export const toBadgeSyncPayload = ({
  input,
  syncedAt = new Date().toISOString(),
  legacyProgrammerHandle,
}: BadgeSyncPayloadInput): BadgeSyncPayload => {
  const record = parseProgrammersRecord(input);
  // upstream ID가 없을 때는 이전 extension이 programmerHandle로 쓰던 name을 식별자로 사용한다.
  const programmerId =
    record.userId ??
    record.user_id ??
    record.programmerId ??
    record.programmer_id ??
    record.user?.id ??
    record.id ??
    record.name;

  const skillLevel = record.skillCheck.level;

  return parseBadgeSyncPayload({
    programmerId,
    ...(legacyProgrammerHandle ? { legacyProgrammerHandle } : {}),
    displayName: record.name,
    solvedCount: record.codingTest.solved,
    solvedTotal: record.codingTest.total,
    skillLevel,
    rankingScore: record.ranking.score,
    rankingRank: record.ranking.rank,
    badgeTier: getBadgeTierFromSkillLevel(skillLevel),
    syncedAt,
  });
};
