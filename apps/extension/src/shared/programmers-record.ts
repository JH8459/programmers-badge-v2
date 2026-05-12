import {
  parseBadgeSyncPayload,
  type BadgeSyncPayload,
  type BadgeTier,
} from "@programmers-badge/shared-types";
import { z } from "zod";

// 외부 API 응답은 필드가 더 붙을 수 있으므로 필요한 값만 느슨하게 검증한다.
export const programmersRecordSchema = z.looseObject({
  name: z.string().optional(),
  skillCheck: z
    .looseObject({
      level: z.number().finite().optional(),
    })
    .optional(),
  ranking: z
    .looseObject({
      score: z.number().finite().optional(),
      rank: z.number().finite().optional(),
    })
    .optional(),
  codingTest: z
    .looseObject({
      solved: z.number().finite().optional(),
      total: z.number().finite().optional(),
    })
    .optional(),
});

export type ProgrammersRecord = z.infer<typeof programmersRecordSchema>;

export const parseProgrammersRecord = (input: unknown): ProgrammersRecord =>
  programmersRecordSchema.parse(input);

interface NonNegativeIntegerInput {
  value: number | undefined;
  fallback?: number;
}

interface BadgeSyncPayloadInput {
  input: ProgrammersRecord;
  syncedAt?: string;
}

const toNonNegativeInteger = ({ value, fallback = 0 }: NonNegativeIntegerInput): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(value ?? fallback));
};

export const getBadgeTierFromSkillLevel = (skillLevel: number): BadgeTier => {
  if (skillLevel >= 4) {
    return "advanced";
  }

  if (skillLevel >= 2) {
    return "intermediate";
  }

  return "starter";
};

export const toBadgeSyncPayload = ({
  input,
  syncedAt = new Date().toISOString(),
}: BadgeSyncPayloadInput): BadgeSyncPayload => {
  const record = parseProgrammersRecord(input);
  const displayName = record.name?.trim();

  if (!displayName) {
    throw new Error("Programmers 프로필 이름을 확인하지 못했습니다.");
  }

  const solvedCount = toNonNegativeInteger({ value: record.codingTest?.solved });
  const solvedTotal = toNonNegativeInteger({
    value: record.codingTest?.total,
    fallback: solvedCount,
  });
  const skillLevel = toNonNegativeInteger({ value: record.skillCheck?.level });
  const rankingScore = toNonNegativeInteger({ value: record.ranking?.score });
  const rankingRank = Math.max(
    1,
    toNonNegativeInteger({ value: record.ranking?.rank, fallback: 1 })
  );

  return parseBadgeSyncPayload({
    programmerHandle: displayName,
    displayName,
    solvedCount,
    solvedTotal,
    skillLevel,
    rankingScore,
    rankingRank,
    badgeTier: getBadgeTierFromSkillLevel(skillLevel),
    syncedAt,
  });
};
