import type { BadgeSyncPayload, BadgeTier } from "@programmers-badge/shared-types";

export interface ProgrammersRecord {
  name?: string;
  skillCheck?: {
    level?: number;
  };
  ranking?: {
    score?: number;
    rank?: number;
  };
  codingTest?: {
    solved?: number;
    total?: number;
  };
}

const toNonNegativeInteger = (value: number | undefined, fallback = 0): number => {
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

export const toBadgeSyncPayload = (
  record: ProgrammersRecord,
  syncedAt = new Date().toISOString()
): BadgeSyncPayload => {
  const displayName = record.name?.trim();

  if (!displayName) {
    throw new Error("Programmers 프로필 이름을 확인하지 못했습니다.");
  }

  const solvedCount = toNonNegativeInteger(record.codingTest?.solved);
  const solvedTotal = toNonNegativeInteger(record.codingTest?.total, solvedCount);
  const skillLevel = toNonNegativeInteger(record.skillCheck?.level);
  const rankingScore = toNonNegativeInteger(record.ranking?.score);
  const rankingRank = Math.max(1, toNonNegativeInteger(record.ranking?.rank, 1));

  return {
    programmerHandle: displayName,
    displayName,
    solvedCount,
    solvedTotal,
    skillLevel,
    rankingScore,
    rankingRank,
    badgeTier: getBadgeTierFromSkillLevel(skillLevel),
    syncedAt,
  };
};
