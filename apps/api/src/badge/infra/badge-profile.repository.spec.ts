import { describe, expect, it, vi } from "vitest";

import type { BadgeSyncPayload } from "@programmers-badge/shared-types";

import { BadgeProfileRepository } from "./badge-profile.repository";
import { DatabaseService } from "./database.service";

const createPayload = (overrides: Partial<BadgeSyncPayload> = {}): BadgeSyncPayload => ({
  programmerId: "repository-user",
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

    vi.spyOn(
      repository as unknown as {
        getRowByProgrammerId: (input: { programmerId: string }) => undefined;
      },
      "getRowByProgrammerId"
    ).mockReturnValue(undefined);

    try {
      expect(() => repository.upsert(createPayload())).toThrow("Badge profile was not persisted.");
    } finally {
      databaseService.onModuleDestroy();
    }
  });

  it("keeps public slugs stable across display name changes and ignores stale snapshots", () => {
    const databaseService = new DatabaseService(":memory:");
    const repository = new BadgeProfileRepository(databaseService);

    try {
      const firstRecord = repository.upsert(
        createPayload({
          programmerId: "stable-programmer-id",
          displayName: "Old Display Name",
          syncedAt: "2026-04-07T01:02:03.000Z",
        })
      );
      const renamedRecord = repository.upsert(
        createPayload({
          programmerId: "stable-programmer-id",
          displayName: "New Display Name",
          solvedCount: 15,
          syncedAt: "2026-04-07T01:02:04.000Z",
        })
      );
      const staleRecord = repository.upsert(
        createPayload({
          programmerId: "stable-programmer-id",
          displayName: "Stale Display Name",
          solvedCount: 2,
          syncedAt: "2026-04-07T01:02:02.000Z",
        })
      );

      expect(renamedRecord.publicSlug).toBe(firstRecord.publicSlug);
      expect(renamedRecord.displayName).toBe("New Display Name");
      expect(staleRecord.publicSlug).toBe(firstRecord.publicSlug);
      expect(staleRecord.displayName).toBe("New Display Name");
      expect(staleRecord.solvedCount).toBe(15);
    } finally {
      databaseService.onModuleDestroy();
    }
  });

  it("adopts an old username-keyed row after the account display name has changed", () => {
    const databaseService = new DatabaseService(":memory:");
    const repository = new BadgeProfileRepository(databaseService);

    try {
      databaseService
        .getConnection()
        .prepare(
          [
            "INSERT INTO badge_profiles (",
            "  programmer_handle, programmer_id, identity_source, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
            ") VALUES (?, ?, 'legacy', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" ")
        )
        .run(
          "old-programmers-name",
          "old-programmers-name",
          "Old Programmers Name",
          "001122aabbcc",
          10,
          20,
          1,
          100,
          5,
          "starter",
          "2026-04-07T01:02:03.000Z",
          "2026-04-07T01:02:03.000Z",
          "2026-04-07T01:02:03.000Z"
        );

      const migratedRecord = repository.upsert(
        createPayload({
          programmerId: "stable-programmer-id",
          legacyProgrammerHandle: "old-programmers-name",
          displayName: "New Programmers Name",
          syncedAt: "2026-04-07T01:02:02.000Z",
        })
      );

      expect(migratedRecord.publicSlug).toBe("001122aabbcc");
      expect(migratedRecord.programmerId).toBe("stable-programmer-id");
      expect(migratedRecord.displayName).toBe("Old Programmers Name");

      const renamedRecord = repository.upsert(
        createPayload({
          programmerId: "stable-programmer-id",
          displayName: "New Programmers Name",
          syncedAt: "2026-04-07T01:02:04.000Z",
        })
      );

      expect(renamedRecord.publicSlug).toBe("001122aabbcc");
      expect(renamedRecord.displayName).toBe("New Programmers Name");
    } finally {
      databaseService.onModuleDestroy();
    }
  });
});
