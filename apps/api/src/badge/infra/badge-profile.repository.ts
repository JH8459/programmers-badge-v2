import { Inject, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { badgeTierSchema, type BadgeSyncPayload } from "@programmers-badge/shared-types";

import { DatabaseService } from "./database.service";

export interface BadgeProfileRecord {
  programmerHandle: string;
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

interface FindByProgrammerHandleInput {
  programmerHandle: string;
}

interface FindByPublicSlugInput {
  publicSlug: string;
}

@Injectable()
export class BadgeProfileRepository {
  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  private mapRow(row: BadgeProfileRow): BadgeProfileRecord {
    return {
      programmerHandle: row.programmer_handle,
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

  upsert(payload: BadgeSyncPayload): BadgeProfileRecord {
    const database = this.databaseService.getConnection();
    const existingRecord = this.getByProgrammerHandle({
      programmerHandle: payload.programmerHandle,
    });

    const now = new Date().toISOString();
    const publicSlug = existingRecord?.public_slug ?? this.getUniquePublicSlug();
    const createdAt = existingRecord?.created_at ?? now;

    database
      .prepare(
        [
          "INSERT INTO badge_profiles(",
          "  programmer_handle, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
          ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(programmer_handle) DO UPDATE SET",
          "  display_name = excluded.display_name,",
          "  solved_count = excluded.solved_count,",
          "  solved_total = excluded.solved_total,",
          "  skill_level = excluded.skill_level,",
          "  ranking_score = excluded.ranking_score,",
          "  ranking_rank = excluded.ranking_rank,",
          "  badge_tier = excluded.badge_tier,",
          "  source_synced_at = excluded.source_synced_at,",
          "  updated_at = excluded.updated_at",
        ].join(" ")
      )
      .run(
        payload.programmerHandle,
        payload.displayName,
        publicSlug,
        payload.solvedCount,
        payload.solvedTotal,
        payload.skillLevel,
        payload.rankingScore,
        payload.rankingRank,
        payload.badgeTier,
        payload.syncedAt,
        createdAt,
        now
      );

    const savedRecord = this.findByProgrammerHandle({
      programmerHandle: payload.programmerHandle,
    });

    if (!savedRecord) {
      throw new Error("Badge profile was not persisted.");
    }

    return savedRecord;
  }

  private getByProgrammerHandle({
    programmerHandle,
  }: FindByProgrammerHandleInput): BadgeProfileRow | undefined {
    return badgeProfileRowSchema
      .optional()
      .parse(
        this.databaseService
          .getConnection()
          .prepare(
            [
              "SELECT programmer_handle, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
              "FROM badge_profiles",
              "WHERE programmer_handle = ?",
            ].join(" ")
          )
          .get(programmerHandle)
      );
  }

  findByProgrammerHandle(input: FindByProgrammerHandleInput): BadgeProfileRecord | null {
    const row = this.getByProgrammerHandle(input);

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
              "SELECT programmer_handle, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
              "FROM badge_profiles",
              "WHERE public_slug = ?",
            ].join(" ")
          )
          .get(publicSlug)
      );

    return row ? this.mapRow(row) : null;
  }
}
