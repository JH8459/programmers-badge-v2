import { Inject, Injectable, OnModuleDestroy, Optional } from "@nestjs/common";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";

import { readApiRuntimeConfig } from "../../common/runtime-config";

export const DATABASE_PATH_TOKEN = Symbol("DATABASE_PATH_TOKEN");

const tableColumnSchema = z
  .object({
    name: z.string(),
  })
  .passthrough();

const tableColumnListSchema = z.array(tableColumnSchema);

const readyRowSchema = z
  .object({
    ready: z.number(),
  })
  .passthrough();

interface EnsureColumnInput {
  columnName: string;
  definition: string;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly databasePath: string;

  private readonly database: DatabaseSync;

  constructor(@Optional() @Inject(DATABASE_PATH_TOKEN) databasePath?: string) {
    this.databasePath = databasePath ?? readApiRuntimeConfig().databasePath;
    mkdirSync(dirname(this.databasePath), { recursive: true });
    this.database = new DatabaseSync(this.databasePath);
    this.configure();
    this.ensureSchema();
  }

  private configure(): void {
    this.database.exec(
      [
        "PRAGMA journal_mode = WAL;",
        "PRAGMA foreign_keys = ON;",
        "PRAGMA busy_timeout = 5000;",
      ].join("\n")
    );
  }

  private ensureSchema(): void {
    this.database.exec(
      [
        "CREATE TABLE IF NOT EXISTS badge_profiles (",
        "  programmer_handle TEXT PRIMARY KEY,",
        "  display_name TEXT NOT NULL,",
        "  public_slug TEXT NOT NULL UNIQUE,",
        "  solved_count INTEGER NOT NULL,",
        "  solved_total INTEGER NOT NULL,",
        "  skill_level INTEGER NOT NULL,",
        "  ranking_score INTEGER NOT NULL,",
        "  ranking_rank INTEGER NOT NULL,",
        "  badge_tier TEXT NOT NULL,",
        "  source_synced_at TEXT NOT NULL,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_badge_profiles_public_slug ON badge_profiles(public_slug);",
      ].join("\n")
    );

    this.ensureColumn({ columnName: "display_name", definition: "TEXT NOT NULL DEFAULT ''" });
    this.ensureColumn({ columnName: "solved_total", definition: "INTEGER NOT NULL DEFAULT 0" });
    this.ensureColumn({ columnName: "skill_level", definition: "INTEGER NOT NULL DEFAULT 0" });
    this.ensureColumn({ columnName: "ranking_score", definition: "INTEGER NOT NULL DEFAULT 0" });
    this.ensureColumn({ columnName: "ranking_rank", definition: "INTEGER NOT NULL DEFAULT 1" });
  }

  private ensureColumn({ columnName, definition }: EnsureColumnInput): void {
    // 현재는 additive migration만 허용하므로 누락 컬럼만 뒤늦게 보강한다.
    const existingColumns = tableColumnListSchema.parse(
      this.database.prepare("PRAGMA table_info(badge_profiles)").all()
    );

    if (existingColumns.some((column) => column.name === columnName)) {
      return;
    }

    this.database.exec(`ALTER TABLE badge_profiles ADD COLUMN ${columnName} ${definition};`);
  }

  getConnection(): DatabaseSync {
    return this.database;
  }

  isReady(): boolean {
    const parseResult = readyRowSchema.safeParse(
      this.database.prepare("SELECT 1 as ready").get()
    );

    return parseResult.success && parseResult.data.ready === 1;
  }

  onModuleDestroy(): void {
    this.database.close();
  }
}
