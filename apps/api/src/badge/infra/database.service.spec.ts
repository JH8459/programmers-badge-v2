import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import { DatabaseService } from "./database.service";

const createTempDatabasePath = (): string =>
  join(tmpdir(), `programmers-badge-db-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`);

describe("DatabaseService", () => {
  it("adds missing columns to an existing legacy badge profile table", () => {
    const databasePath = createTempDatabasePath();
    const legacyDatabase = new DatabaseSync(databasePath);

    legacyDatabase.exec(
      [
        "CREATE TABLE badge_profiles (",
        "  programmer_handle TEXT PRIMARY KEY,",
        "  public_slug TEXT NOT NULL UNIQUE,",
        "  solved_count INTEGER NOT NULL,",
        "  badge_tier TEXT NOT NULL,",
        "  source_synced_at TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
      ].join("\n")
    );
    legacyDatabase.close();

    const databaseService = new DatabaseService(databasePath);

    try {
      const columns = databaseService
        .getConnection()
        .prepare("PRAGMA table_info(badge_profiles)")
        .all()
        .map((column) => (column as { name: string }).name);

      expect(columns).toEqual(
        expect.arrayContaining([
          "display_name",
          "solved_total",
          "skill_level",
          "ranking_score",
          "ranking_rank",
        ])
      );
    } finally {
      databaseService.onModuleDestroy();
      rmSync(databasePath, { force: true });
    }
  });

  it("uses runtime config database path when an explicit path is not injected", () => {
    const databaseDirectory = mkdtempSync(join(tmpdir(), "programmers-badge-runtime-db-"));
    const databasePath = join(databaseDirectory, "runtime.sqlite");
    const originalDatabasePath = process.env.DATABASE_PATH;

    process.env.DATABASE_PATH = databasePath;

    const databaseService = new DatabaseService();

    try {
      expect(databaseService.isReady()).toBe(true);
    } finally {
      databaseService.onModuleDestroy();
      if (originalDatabasePath === undefined) {
        delete process.env.DATABASE_PATH;
      } else {
        process.env.DATABASE_PATH = originalDatabasePath;
      }
      rmSync(databaseDirectory, { recursive: true, force: true });
    }
  });
});
