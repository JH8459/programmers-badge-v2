import { Inject, Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import {
  solutionRecordMetadataSchema,
  type GitHubRepositorySettings,
  type GitHubRepository as GitHubRepositoryModel,
  type SolutionRecordMetadata,
  type SolutionRecordPayload,
} from "@programmers-badge/shared-types";

import { DatabaseService } from "../../badge/infra/database.service";

const connectionRowSchema = z
  .object({
    github_account_id: z.string(),
    github_login: z.string(),
    installation_id: z.number(),
    repository_id: z.number().nullable(),
    repository_owner: z.string().nullable(),
    repository_name: z.string().nullable(),
    repository_private: z.number().nullable(),
    repository_default_branch: z.string().nullable(),
    target_branch: z.string().nullable(),
    base_path: z.string().nullable(),
    connected_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

const solutionRowSchema = z
  .object({
    submission_id: z.string(),
    github_account_id: z.string(),
    installation_id: z.number(),
    repository_id: z.number(),
    repository_owner: z.string(),
    repository_name: z.string(),
    target_branch: z.string(),
    base_path: z.string(),
    problem_id: z.string(),
    problem_name: z.string(),
    language: z.string(),
    metadata_json: z.string(),
    source_code: z.string().nullable(),
    status: z.enum(["pending", "failed", "saved", "skipped"]),
    error_message: z.string().nullable(),
    attempt_count: z.number(),
    commit_sha: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

export interface GitHubConnectionRecord {
  githubAccountId: string;
  accountLogin: string;
  installationId: number;
  settings: GitHubRepositorySettings & { repository: GitHubRepositoryModel } | null;
  connectedAt: string;
}

export interface StoredSolutionRecord {
  submissionId: string;
  githubAccountId: string;
  installationId: number;
  repositoryId: number;
  repositoryOwner: string;
  repositoryName: string;
  branch: string;
  basePath: string;
  metadata: SolutionRecordMetadata;
  sourceCode: string | null;
  status: "pending" | "failed" | "saved" | "skipped";
  errorMessage: string | null;
  attemptCount: number;
  commitSha: string | null;
  updatedAt: string;
}

interface ConnectInstallationInput {
  githubAccountId: string;
  accountLogin: string;
  installationId: number;
  now: string;
}

interface SaveRepositorySettingsInput {
  githubAccountId: string;
  repository: GitHubRepositoryModel;
  branch: string;
  basePath: string;
  updatedAt: string;
}

interface InsertSolutionInput {
  githubAccountId: string;
  connection: GitHubConnectionRecord;
  payload: SolutionRecordPayload;
  now: string;
}

interface UpdateSolutionStatusInput {
  submissionId: string;
  status: StoredSolutionRecord["status"];
  errorMessage: string | null;
  commitSha: string | null;
  updatedAt: string;
  incrementAttempt?: boolean;
}

const hashSecret = (value: string): string => createHash("sha256").update(value).digest("hex");

@Injectable()
export class GitHubRepository {
  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  createAuthFlow({ now }: { now: string }): { state: string; expiresAt: string } {
    const state = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.parse(now) + 10 * 60_000).toISOString();
    const database = this.databaseService.getConnection();
    database
      .prepare("DELETE FROM github_auth_flows WHERE expires_at <= ?")
      .run(now);
    database
      .prepare("INSERT INTO github_auth_flows (state_hash, expires_at, created_at) VALUES (?, ?, ?)")
      .run(hashSecret(state), expiresAt, now);
    return { state, expiresAt };
  }

  consumeAuthFlow({ state, now }: { state: string; now: string }): boolean {
    const database = this.databaseService.getConnection();
    const result = database
      .prepare("DELETE FROM github_auth_flows WHERE state_hash = ? AND expires_at > ?")
      .run(hashSecret(state), now);
    return result.changes === 1;
  }

  connectInstallation({
    githubAccountId,
    accountLogin,
    installationId,
    now,
  }: ConnectInstallationInput): void {
    const database = this.databaseService.getConnection();
    database
      .prepare(
        [
          "INSERT INTO github_connections (github_account_id, github_login, installation_id, connected_at, updated_at)",
          "VALUES (?, ?, ?, ?, ?)",
          "ON CONFLICT(github_account_id) DO UPDATE SET",
          "  github_login = excluded.github_login,",
          "  installation_id = excluded.installation_id,",
          "  repository_id = CASE WHEN github_connections.installation_id = excluded.installation_id THEN github_connections.repository_id ELSE NULL END,",
          "  repository_owner = CASE WHEN github_connections.installation_id = excluded.installation_id THEN github_connections.repository_owner ELSE NULL END,",
          "  repository_name = CASE WHEN github_connections.installation_id = excluded.installation_id THEN github_connections.repository_name ELSE NULL END,",
          "  repository_private = CASE WHEN github_connections.installation_id = excluded.installation_id THEN github_connections.repository_private ELSE NULL END,",
          "  repository_default_branch = CASE WHEN github_connections.installation_id = excluded.installation_id THEN github_connections.repository_default_branch ELSE NULL END,",
          "  target_branch = CASE WHEN github_connections.installation_id = excluded.installation_id THEN github_connections.target_branch ELSE NULL END,",
          "  base_path = CASE WHEN github_connections.installation_id = excluded.installation_id THEN github_connections.base_path ELSE NULL END,",
          "  updated_at = excluded.updated_at",
        ].join(" ")
      )
      .run(githubAccountId, accountLogin, installationId, now, now);
  }

  createSession({ githubAccountId, now }: { githubAccountId: string; now: string }): {
    token: string;
    expiresAt: string;
  } {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.parse(now) + 30 * 24 * 60 * 60_000).toISOString();
    this.databaseService
      .getConnection()
      .prepare("INSERT INTO github_sessions (session_hash, github_account_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .run(hashSecret(token), githubAccountId, expiresAt, now);
    return { token, expiresAt };
  }

  findConnectionBySession({ token, now }: { token: string; now: string }): GitHubConnectionRecord | null {
    const database = this.databaseService.getConnection();
    const row = connectionRowSchema
      .nullable()
      .parse(
        database
          .prepare(
            [
              "SELECT c.github_account_id, c.github_login, c.installation_id, c.repository_id,",
              "c.repository_owner, c.repository_name, c.repository_private, c.repository_default_branch,",
              "c.target_branch, c.base_path, c.connected_at, c.updated_at",
              "FROM github_sessions s JOIN github_connections c ON c.github_account_id = s.github_account_id",
              "WHERE s.session_hash = ? AND s.expires_at > ?",
            ].join(" ")
          )
          .get(hashSecret(token), now) ?? null
      );

    if (!row) {
      database.prepare("DELETE FROM github_sessions WHERE session_hash = ?").run(hashSecret(token));
      return null;
    }

    const settings =
      row.repository_id !== null &&
      row.repository_owner !== null &&
      row.repository_name !== null &&
      row.repository_private !== null &&
      row.repository_default_branch !== null &&
      row.target_branch !== null &&
      row.base_path !== null
        ? {
            repository: {
              id: row.repository_id,
              owner: row.repository_owner,
              name: row.repository_name,
              fullName: `${row.repository_owner}/${row.repository_name}`,
              isPrivate: row.repository_private === 1,
              defaultBranch: row.repository_default_branch,
            },
            repositoryId: row.repository_id,
            branch: row.repository_default_branch,
            basePath: row.base_path,
          } satisfies GitHubRepositorySettings & { repository: GitHubRepositoryModel }
        : null;

    return {
      githubAccountId: row.github_account_id,
      accountLogin: row.github_login,
      installationId: row.installation_id,
      settings,
      connectedAt: row.connected_at,
    };
  }

  saveRepositorySettings({
    githubAccountId,
    repository,
    branch,
    basePath,
    updatedAt,
  }: SaveRepositorySettingsInput): void {
    this.databaseService
      .getConnection()
      .prepare(
        [
          "UPDATE github_connections SET repository_id = ?, repository_owner = ?, repository_name = ?,",
          "repository_private = ?, repository_default_branch = ?, target_branch = ?, base_path = ?, updated_at = ? WHERE github_account_id = ?",
        ].join(" ")
      )
      .run(
        repository.id,
        repository.owner,
        repository.name,
        repository.isPrivate ? 1 : 0,
        repository.defaultBranch,
        branch,
        basePath,
        updatedAt,
        githubAccountId
      );
  }

  disconnect({ githubAccountId }: { githubAccountId: string }): void {
    this.databaseService
      .getConnection()
      .prepare("DELETE FROM github_connections WHERE github_account_id = ?")
      .run(githubAccountId);
  }

  insertSolution({
    githubAccountId,
    connection,
    payload,
    now,
  }: InsertSolutionInput): StoredSolutionRecord {
    if (!connection.settings) {
      throw new Error("GitHub repository settings are not configured.");
    }

    const { sourceCode, ...metadata } = payload;
    const settings = connection.settings;
    const database = this.databaseService.getConnection();
    database
      .prepare(
        [
          "INSERT OR IGNORE INTO solution_records (submission_id, github_account_id, installation_id, repository_id, repository_owner, repository_name, target_branch, base_path, problem_id, problem_name, language, metadata_json, source_code, status, created_at, updated_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)",
        ].join(" ")
      )
      .run(
        payload.submissionId,
        githubAccountId,
        connection.installationId,
        settings.repository.id,
        settings.repository.owner,
        settings.repository.name,
        settings.repository.defaultBranch,
        settings.basePath,
        payload.problemId,
        payload.problemName,
        payload.language,
        JSON.stringify(metadata),
        sourceCode,
        now,
        now
      );

    const row = this.getSolutionRow({ submissionId: payload.submissionId });
    if (!row || row.github_account_id !== githubAccountId) {
      throw new Error("Could not load the saved solution record.");
    }
    return this.mapSolutionRow(row);
  }

  findSolution({ submissionId, githubAccountId }: { submissionId: string; githubAccountId: string }):
    | StoredSolutionRecord
    | null {
    const row = this.getSolutionRow({ submissionId });
    return !row || row.github_account_id !== githubAccountId ? null : this.mapSolutionRow(row);
  }

  listFailedSolutions({ githubAccountId, limit }: { githubAccountId: string; limit: number }): StoredSolutionRecord[] {
    const rows = z
      .array(solutionRowSchema)
      .parse(
        this.databaseService
          .getConnection()
          .prepare(
            "SELECT * FROM solution_records WHERE github_account_id = ? AND status = 'failed' ORDER BY updated_at DESC LIMIT ?"
          )
          .all(githubAccountId, limit)
      );
    return rows.map((row) => this.mapSolutionRow(row));
  }

  updateSolutionStatus({
    submissionId,
    status,
    errorMessage,
    commitSha,
    updatedAt,
    incrementAttempt = false,
  }: UpdateSolutionStatusInput): void {
    this.databaseService
      .getConnection()
      .prepare(
        [
          "UPDATE solution_records SET status = ?, error_message = ?, commit_sha = ?,",
          "source_code = CASE WHEN ? IN ('saved', 'skipped') THEN NULL ELSE source_code END,",
          "attempt_count = attempt_count + ?, updated_at = ? WHERE submission_id = ?",
        ].join(" ")
      )
      .run(status, errorMessage, commitSha, status, incrementAttempt ? 1 : 0, updatedAt, submissionId);
  }

  private getSolutionRow({ submissionId }: { submissionId: string }) {
    return solutionRowSchema
      .nullable()
      .parse(
        this.databaseService
          .getConnection()
          .prepare("SELECT * FROM solution_records WHERE submission_id = ?")
        .get(submissionId) ?? null
      );
  }

  private mapSolutionRow(row: z.infer<typeof solutionRowSchema>): StoredSolutionRecord {
    return {
      submissionId: row.submission_id,
      githubAccountId: row.github_account_id,
      installationId: row.installation_id,
      repositoryId: row.repository_id,
      repositoryOwner: row.repository_owner,
      repositoryName: row.repository_name,
      branch: row.target_branch,
      basePath: row.base_path,
      metadata: solutionRecordMetadataSchema.parse(JSON.parse(row.metadata_json)),
      sourceCode: row.source_code,
      status: row.status,
      errorMessage: row.error_message,
      attemptCount: row.attempt_count,
      commitSha: row.commit_sha,
      updatedAt: row.updated_at,
    };
  }
}

export const hashGitHubSecret = hashSecret;
