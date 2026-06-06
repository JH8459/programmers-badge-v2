import { describe, expect, it, vi } from "vitest";

import type { BadgeSyncPayload } from "@programmers-badge/shared-types";

import { BadgeProfileRepository } from "./badge-profile.repository";
import { DatabaseService } from "./database.service";

const createPayload = (overrides: Partial<BadgeSyncPayload> = {}): BadgeSyncPayload => ({
  programmerHandle: "repository-user",
  displayName: "Repository User",
  solvedCount: 10,
  solvedTotal: 20,
  skillLevel: 1,
  rankingScore: 100,
  rankingRank: 5,
  badgeTier: "starter",
  syncedAt: "2026-04-07T01:02:03.000Z",
  ...overrides,
});

describe("BadgeProfileRepository", () => {
  it("fails fast when an upserted row cannot be read back", () => {
    const databaseService = new DatabaseService(":memory:");
    const repository = new BadgeProfileRepository(databaseService);

    vi.spyOn(repository, "findByProgrammerHandle").mockReturnValueOnce(null);

    try {
      expect(() => repository.upsert(createPayload())).toThrow("Badge profile was not persisted.");
    } finally {
      databaseService.onModuleDestroy();
    }
  });
});
