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

// upstream 필드는 늘 수 있지만, badge snapshot에 필요한 값은 전부 필수로 검증한다.
export const programmersRecordSchema = z
  .looseObject({
    id: programmerIdSchema.optional(),
    userId: programmerIdSchema.optional(),
    user_id: programmerIdSchema.optional(),
    programmerId: programmerIdSchema.optional(),
    programmer_id: programmerIdSchema.optional(),
    user: z.looseObject({ id: programmerIdSchema }).optional(),
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
  .refine(
    ({ id, userId, user_id, programmerId, programmer_id, user }) =>
      id !== undefined ||
      userId !== undefined ||
      user_id !== undefined ||
      programmerId !== undefined ||
      programmer_id !== undefined ||
      user?.id !== undefined,
    {
      path: ["id"],
      message: "Programmers user identifier is required.",
    }
  )
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
  const programmerId =
    record.userId ??
    record.user_id ??
    record.programmerId ??
    record.programmer_id ??
    record.user?.id ??
    record.id;

  if (!programmerId) {
    throw new Error("Programmers 사용자 식별 정보를 확인하지 못했습니다.");
  }

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
