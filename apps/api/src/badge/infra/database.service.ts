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
        "  programmer_id TEXT,",
        "  identity_source TEXT NOT NULL DEFAULT 'legacy',",
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
    this.ensureColumn({ columnName: "programmer_id", definition: "TEXT" });
    this.ensureColumn({
      columnName: "identity_source",
      definition: "TEXT NOT NULL DEFAULT 'legacy'",
    });
    this.database.exec(
      [
        "UPDATE badge_profiles",
        "SET programmer_id = programmer_handle",
        "WHERE programmer_id IS NULL;",
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_badge_profiles_programmer_id ON badge_profiles(programmer_id);",
      ].join(" ")
    );
    this.database.exec(
      [
        "CREATE TABLE IF NOT EXISTS github_connections (",
        "  github_account_id TEXT PRIMARY KEY,",
        "  github_login TEXT NOT NULL,",
        "  installation_id INTEGER NOT NULL UNIQUE,",
        "  repository_id INTEGER,",
        "  repository_owner TEXT,",
        "  repository_name TEXT,",
        "  repository_private INTEGER,",
        "  repository_default_branch TEXT,",
        "  target_branch TEXT,",
        "  base_path TEXT,",
        "  connected_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
        "CREATE TABLE IF NOT EXISTS github_sessions (",
        "  session_hash TEXT PRIMARY KEY,",
        "  github_account_id TEXT NOT NULL REFERENCES github_connections(github_account_id) ON DELETE CASCADE,",
        "  expires_at TEXT NOT NULL,",
        "  created_at TEXT NOT NULL",
        ");",
        "CREATE INDEX IF NOT EXISTS idx_github_sessions_expires_at ON github_sessions(expires_at);",
        "CREATE TABLE IF NOT EXISTS github_auth_flows (",
        "  state_hash TEXT PRIMARY KEY,",
        "  expires_at TEXT NOT NULL,",
        "  created_at TEXT NOT NULL",
        ");",
        "CREATE INDEX IF NOT EXISTS idx_github_auth_flows_expires_at ON github_auth_flows(expires_at);",
        "CREATE TABLE IF NOT EXISTS solution_records (",
        "  submission_id TEXT PRIMARY KEY,",
        "  github_account_id TEXT NOT NULL REFERENCES github_connections(github_account_id) ON DELETE CASCADE,",
        "  installation_id INTEGER NOT NULL,",
        "  repository_id INTEGER NOT NULL,",
        "  repository_owner TEXT NOT NULL,",
        "  repository_name TEXT NOT NULL,",
        "  target_branch TEXT NOT NULL,",
        "  base_path TEXT NOT NULL,",
        "  problem_id TEXT NOT NULL,",
        "  problem_name TEXT NOT NULL,",
        "  language TEXT NOT NULL,",
        "  metadata_json TEXT NOT NULL,",
        "  source_code TEXT,",
        "  status TEXT NOT NULL,",
        "  error_message TEXT,",
        "  attempt_count INTEGER NOT NULL DEFAULT 0,",
        "  commit_sha TEXT,",
        "  created_at TEXT NOT NULL,",
        "  updated_at TEXT NOT NULL",
        ");",
        "CREATE INDEX IF NOT EXISTS idx_solution_records_user_status ON solution_records(github_account_id, status, updated_at DESC);",
      ].join("\n")
    );
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
