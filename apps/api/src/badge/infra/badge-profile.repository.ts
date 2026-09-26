import { Inject, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { badgeTierSchema, type BadgeSyncPayload } from "@programmers-badge/shared-types";

import { DatabaseService } from "./database.service";

export interface BadgeProfileRecord {
  programmerId: string;
  displayName: string;
  publicSlug: string;
  solvedCount: number;
  solvedTotal: number;
  skillLevel: number;
  rankingScore: number;
  rankingRank: number;
  badgeTier: BadgeSyncPayload["badgeTier"];
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

const publicSlugRowSchema = z
  .object({
    public_slug: z.string(),
  })
  .passthrough();

const badgeProfileRowSchema = z
  .object({
    programmer_handle: z.string(),
    programmer_id: z.string(),
    identity_source: z.enum(["legacy", "stable"]),
    display_name: z.string(),
    public_slug: z.string(),
    solved_count: z.number(),
    solved_total: z.number(),
    skill_level: z.number(),
    ranking_score: z.number(),
    ranking_rank: z.number(),
    badge_tier: badgeTierSchema,
    source_synced_at: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

type BadgeProfileRow = z.infer<typeof badgeProfileRowSchema>;

interface FindByProgrammerIdInput {
  programmerId: string;
}

interface FindByPublicSlugInput {
  publicSlug: string;
}

interface FindLegacyByDisplayNameInput {
  displayName: string;
}

interface FindLegacyByHandleInput {
  legacyProgrammerHandle: string;
}

interface UpdateExistingProfileInput {
  existingRecord: BadgeProfileRow;
  payload: BadgeSyncPayload;
  updatedAt: string;
}

@Injectable()
export class BadgeProfileRepository {
  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  private mapRow(row: BadgeProfileRow): BadgeProfileRecord {
    return {
      programmerId: row.programmer_id,
      displayName: row.display_name,
      publicSlug: row.public_slug,
      solvedCount: row.solved_count,
      solvedTotal: row.solved_total,
      skillLevel: row.skill_level,
      rankingScore: row.ranking_score,
      rankingRank: row.ranking_rank,
      badgeTier: row.badge_tier,
      syncedAt: row.source_synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private generatePublicSlug(): string {
    return randomBytes(6).toString("hex");
  }

  private getUniquePublicSlug(): string {
    const database = this.databaseService.getConnection();

    while (true) {
      const candidateSlug = this.generatePublicSlug();
      const existing = publicSlugRowSchema
        .optional()
        .parse(
          database
            .prepare("SELECT public_slug FROM badge_profiles WHERE public_slug = ?")
            .get(candidateSlug)
        );

      if (!existing) {
        return candidateSlug;
      }
    }
  }

  private getUniqueInternalHandle(): string {
    const database = this.databaseService.getConnection();

    while (true) {
      const candidateHandle = `stable:${randomBytes(12).toString("hex")}`;
      const existing = database
        .prepare("SELECT programmer_handle FROM badge_profiles WHERE programmer_handle = ?")
        .get(candidateHandle);

      if (!existing) {
        return candidateHandle;
      }
    }
  }

  private getRowByProgrammerId({ programmerId }: FindByProgrammerIdInput):
    | BadgeProfileRow
    | undefined {
    return badgeProfileRowSchema
      .optional()
      .parse(
        this.databaseService
          .getConnection()
          .prepare(
            [
              "SELECT programmer_handle, programmer_id, identity_source, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
              "FROM badge_profiles",
              "WHERE programmer_id = ?",
            ].join(" ")
          )
          .get(programmerId)
      );
  }

  private getUniqueLegacyRowByDisplayName({ displayName }: FindLegacyByDisplayNameInput):
    | BadgeProfileRow
    | undefined {
    const rows = z
      .array(badgeProfileRowSchema)
      .parse(
        this.databaseService
          .getConnection()
          .prepare(
            [
              "SELECT programmer_handle, programmer_id, identity_source, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
              "FROM badge_profiles",
              "WHERE identity_source = 'legacy' AND display_name = ?",
            ].join(" ")
          )
          .all(displayName)
      );

    return rows.length === 1 ? rows[0] : undefined;
  }

  private getLegacyRowByHandle({ legacyProgrammerHandle }: FindLegacyByHandleInput):
    | BadgeProfileRow
    | undefined {
    return badgeProfileRowSchema
      .optional()
      .parse(
        this.databaseService
          .getConnection()
          .prepare(
            [
              "SELECT programmer_handle, programmer_id, identity_source, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
              "FROM badge_profiles",
              "WHERE programmer_handle = ? AND identity_source = 'legacy'",
            ].join(" ")
          )
          .get(legacyProgrammerHandle)
      );
  }

  private isOlderSnapshot({ existingRecord, payload }: UpdateExistingProfileInput): boolean {
    const storedTimestamp = Date.parse(existingRecord.source_synced_at);
    const incomingTimestamp = Date.parse(payload.syncedAt);

    return Number.isFinite(storedTimestamp) && incomingTimestamp < storedTimestamp;
  }

  private updateExistingProfile({
    existingRecord,
    payload,
    updatedAt,
  }: UpdateExistingProfileInput): void {
    this.databaseService
      .getConnection()
      .prepare(
        [
          "UPDATE badge_profiles SET",
          "  programmer_id = ?,",
          "  identity_source = 'stable',",
          "  display_name = ?,",
          "  solved_count = ?,",
          "  solved_total = ?,",
          "  skill_level = ?,",
          "  ranking_score = ?,",
          "  ranking_rank = ?,",
          "  badge_tier = ?,",
          "  source_synced_at = ?,",
          "  updated_at = ?",
          "WHERE programmer_handle = ?",
        ].join(" ")
      )
      .run(
        payload.programmerId,
        payload.displayName,
        payload.solvedCount,
        payload.solvedTotal,
        payload.skillLevel,
        payload.rankingScore,
        payload.rankingRank,
        payload.badgeTier,
        payload.syncedAt,
        updatedAt,
        existingRecord.programmer_handle
      );
  }

  private adoptLegacyIdentity({
    existingRecord,
    programmerId,
    updatedAt,
  }: {
    existingRecord: BadgeProfileRow;
    programmerId: string;
    updatedAt: string;
  }): void {
    this.databaseService
      .getConnection()
      .prepare(
        [
          "UPDATE badge_profiles SET",
          "  programmer_id = ?,",
          "  identity_source = 'stable',",
          "  updated_at = ?",
          "WHERE programmer_handle = ?",
        ].join(" ")
      )
      .run(programmerId, updatedAt, existingRecord.programmer_handle);
  }

  upsert(payload: BadgeSyncPayload): BadgeProfileRecord {
    const database = this.databaseService.getConnection();
    const stableRecord = this.getRowByProgrammerId({ programmerId: payload.programmerId });
    const legacyRecord = stableRecord
      ? undefined
      : payload.legacyProgrammerHandle
        ? this.getLegacyRowByHandle({ legacyProgrammerHandle: payload.legacyProgrammerHandle })
        : this.getUniqueLegacyRowByDisplayName({ displayName: payload.displayName });
    const existingRecord = stableRecord ?? legacyRecord;
    const now = new Date().toISOString();

    if (existingRecord && this.isOlderSnapshot({ existingRecord, payload, updatedAt: now })) {
      if (existingRecord.identity_source === "legacy") {
        this.adoptLegacyIdentity({
          existingRecord,
          programmerId: payload.programmerId,
          updatedAt: now,
        });
        const adoptedRecord = this.getRowByProgrammerId({ programmerId: payload.programmerId });

        if (!adoptedRecord) {
          throw new Error("Legacy badge profile identity was not migrated.");
        }

        return this.mapRow(adoptedRecord);
      }

      return this.mapRow(existingRecord);
    }

    if (existingRecord) {
      this.updateExistingProfile({ existingRecord, payload, updatedAt: now });
    } else {
      const internalHandle = this.getUniqueInternalHandle();
      const publicSlug = this.getUniquePublicSlug();

      database
        .prepare(
          [
            "INSERT INTO badge_profiles(",
            "  programmer_handle, programmer_id, identity_source, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
            ") VALUES (?, ?, 'stable', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "ON CONFLICT(programmer_id) DO UPDATE SET",
            "  display_name = excluded.display_name,",
            "  solved_count = excluded.solved_count,",
            "  solved_total = excluded.solved_total,",
            "  skill_level = excluded.skill_level,",
            "  ranking_score = excluded.ranking_score,",
            "  ranking_rank = excluded.ranking_rank,",
            "  badge_tier = excluded.badge_tier,",
            "  source_synced_at = excluded.source_synced_at,",
            "  updated_at = excluded.updated_at",
            "WHERE excluded.source_synced_at > badge_profiles.source_synced_at",
          ].join(" ")
        )
        .run(
          internalHandle,
          payload.programmerId,
          payload.displayName,
          publicSlug,
          payload.solvedCount,
          payload.solvedTotal,
          payload.skillLevel,
          payload.rankingScore,
          payload.rankingRank,
          payload.badgeTier,
          payload.syncedAt,
          now,
          now
        );
    }

    const savedRecord = this.getRowByProgrammerId({ programmerId: payload.programmerId });

    if (!savedRecord) {
      throw new Error("Badge profile was not persisted.");
    }

    return this.mapRow(savedRecord);
  }

  findByProgrammerId({ programmerId }: FindByProgrammerIdInput): BadgeProfileRecord | null {
    const row = this.getRowByProgrammerId({ programmerId });

    return row ? this.mapRow(row) : null;
  }

  findByPublicSlug({ publicSlug }: FindByPublicSlugInput): BadgeProfileRecord | null {
    const row = badgeProfileRowSchema
      .optional()
      .parse(
        this.databaseService
          .getConnection()
          .prepare(
            [
              "SELECT programmer_handle, programmer_id, identity_source, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
              "FROM badge_profiles",
              "WHERE public_slug = ?",
            ].join(" ")
          )
          .get(publicSlug)
      );

    return row ? this.mapRow(row) : null;
  }
}
