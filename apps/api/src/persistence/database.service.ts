import { Inject, Injectable, OnModuleDestroy, Optional } from "@nestjs/common";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_DATABASE_PATH = resolve(process.cwd(), "data", "programmers-badge.sqlite");
export const DATABASE_PATH_TOKEN = Symbol("DATABASE_PATH_TOKEN");

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly databasePath: string;

  private readonly database: DatabaseSync;

  constructor(@Optional() @Inject(DATABASE_PATH_TOKEN) databasePath?: string) {
    this.databasePath = databasePath ?? process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH;
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

    this.ensureColumn("display_name", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("solved_total", "INTEGER NOT NULL DEFAULT 0");
    this.ensureColumn("skill_level", "INTEGER NOT NULL DEFAULT 0");
    this.ensureColumn("ranking_score", "INTEGER NOT NULL DEFAULT 0");
    this.ensureColumn("ranking_rank", "INTEGER NOT NULL DEFAULT 1");
  }

  private ensureColumn(columnName: string, definition: string): void {
    const existingColumns = this.database
      .prepare("PRAGMA table_info(badge_profiles)")
      .all() as Array<{ name: string }>;

    if (existingColumns.some((column) => column.name === columnName)) {
      return;
    }

    this.database.exec(`ALTER TABLE badge_profiles ADD COLUMN ${columnName} ${definition};`);
  }

  getConnection(): DatabaseSync {
    return this.database;
  }

  isReady(): boolean {
    const row = this.database.prepare("SELECT 1 as ready").get() as { ready: number } | undefined;
    return row?.ready === 1;
  }

  onModuleDestroy(): void {
    this.database.close();
  }
}
