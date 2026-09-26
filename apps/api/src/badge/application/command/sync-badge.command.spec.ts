import { describe, expect, it } from "vitest";

import { BadgeProfileRepository } from "../../infra/badge-profile.repository";
import { DatabaseService } from "../../infra/database.service";

import { SyncBadgeCommand, SyncBadgeCommandHandler } from "./sync-badge.command";

describe("SyncBadgeCommandHandler", () => {
  it("normalizes and persists a valid badge sync payload", async () => {
    const databaseService = new DatabaseService(":memory:");
    const repository = new BadgeProfileRepository(databaseService);
    const handler = new SyncBadgeCommandHandler(repository);

    try {
      const record = await handler.execute(
        new SyncBadgeCommand({
          payload: {
            programmerId: "  command-user  ",
            displayName: "  Command User  ",
            solvedCount: 20,
            solvedTotal: 100,
            skillLevel: 2,
            rankingScore: 1_200,
            rankingRank: 15,
            badgeTier: "intermediate",
            syncedAt: "2026-04-07T01:02:03.000Z",
          },
        })
      );

      expect(record.publicSlug).toHaveLength(12);
      expect(record.programmerId).toBe("command-user");
      expect(record.displayName).toBe("Command User");
      expect(repository.findByProgrammerId({ programmerId: "command-user" })).toEqual(
        record
      );
    } finally {
      databaseService.onModuleDestroy();
    }
  });

  it("rejects invalid payloads before persistence", async () => {
    const databaseService = new DatabaseService(":memory:");
    const repository = new BadgeProfileRepository(databaseService);
    const handler = new SyncBadgeCommandHandler(repository);

    try {
      await expect(
        handler.execute(
          new SyncBadgeCommand({
            payload: {
              programmerId: "invalid-command-user",
              displayName: "Invalid Command User",
              solvedCount: 20,
              solvedTotal: 100,
              skillLevel: 2,
              rankingScore: 1_200,
              rankingRank: 0,
              badgeTier: "starter",
              syncedAt: "2026-04-07T01:02:03.000Z",
            } as any,
          })
        )
      ).rejects.toThrow();
      expect(
        repository.findByProgrammerId({ programmerId: "invalid-command-user" })
      ).toBeNull();
    } finally {
      databaseService.onModuleDestroy();
    }
  });
});
