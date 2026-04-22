import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";

import type { BadgeSyncPayload } from "@programmers-badge/shared-types";

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

interface BadgeProfileRow {
  programmer_handle: string;
  display_name: string;
  public_slug: string;
  solved_count: number;
  solved_total: number;
  skill_level: number;
  ranking_score: number;
  ranking_rank: number;
  badge_tier: BadgeSyncPayload["badgeTier"];
  source_synced_at: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class BadgeProfileRepository {
  constructor(private readonly databaseService: DatabaseService) {}

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
      const existing = database
        .prepare("SELECT public_slug FROM badge_profiles WHERE public_slug = ?")
        .get(candidateSlug) as { public_slug: string } | undefined;

      if (!existing) {
        return candidateSlug;
      }
    }
  }

  upsert(payload: BadgeSyncPayload): BadgeProfileRecord {
    const database = this.databaseService.getConnection();
    const existingRecord = database
      .prepare(
        [
          "SELECT programmer_handle, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
          "FROM badge_profiles",
          "WHERE programmer_handle = ?",
        ].join(" ")
      )
      .get(payload.programmerHandle) as BadgeProfileRow | undefined;

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

    return this.findByProgrammerHandle(payload.programmerHandle)!;
  }

  findByProgrammerHandle(programmerHandle: string): BadgeProfileRecord | null {
    const row = this.databaseService
      .getConnection()
      .prepare(
        [
          "SELECT programmer_handle, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
          "FROM badge_profiles",
          "WHERE programmer_handle = ?",
        ].join(" ")
      )
      .get(programmerHandle) as BadgeProfileRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  findByPublicSlug(publicSlug: string): BadgeProfileRecord | null {
    const row = this.databaseService
      .getConnection()
      .prepare(
        [
          "SELECT programmer_handle, display_name, public_slug, solved_count, solved_total, skill_level, ranking_score, ranking_rank, badge_tier, source_synced_at, created_at, updated_at",
          "FROM badge_profiles",
          "WHERE public_slug = ?",
        ].join(" ")
      )
      .get(publicSlug) as BadgeProfileRow | undefined;

    return row ? this.mapRow(row) : null;
  }
}
