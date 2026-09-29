import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GitHubRepository as GitHubRepositoryModel, SolutionRecordPayload } from "@programmers-badge/shared-types";

import { DatabaseService } from "../../badge/infra/database.service";
import { GitHubRepository, hashGitHubSecret } from "./github.repository";

const now = "2026-09-27T00:00:00.000Z";
const repositoryModel = (isPrivate = true): GitHubRepositoryModel => ({
  id: 77,
  owner: "octocat",
  name: "algorithms",
  fullName: "octocat/algorithms",
  isPrivate,
  defaultBranch: "main",
});
const createPayload = (submissionId: string): SolutionRecordPayload => ({
  submissionId,
  problemId: "42840",
  problemName: "모의고사",
  difficulty: "Lv.1",
  problemUrl: "https://school.programmers.co.kr/learn/courses/30/lessons/42840",
  language: "javascript",
  sourceCode: "console.log('answer');",
  submittedAt: now,
  resultSummary: "정답",
  performanceSummary: null,
  description: "문제 설명",
  constraints: "제한 사항",
  examplesMarkdown: "예시",
});

describe("GitHubRepository", () => {
  let database: DatabaseService;
  let repository: GitHubRepository;

  beforeEach(() => {
    database = new DatabaseService(":memory:");
    repository = new GitHubRepository(database);
  });

  afterEach(() => {
    database.onModuleDestroy();
  });

  const connect = (githubAccountId = "account", installationId = 12): void => {
    repository.connectInstallation({
      githubAccountId,
      accountLogin: "octocat",
      installationId,
      now,
    });
  };

  const saveSettings = (githubAccountId = "account", isPrivate = true): void => {
    repository.saveRepositorySettings({
      githubAccountId,
      repository: repositoryModel(isPrivate),
      branch: "legacy-branch",
      basePath: "solutions",
      updatedAt: now,
    });
  };

  const createConnection = (githubAccountId = "account", isPrivate = true) => {
    connect(githubAccountId);
    saveSettings(githubAccountId, isPrivate);
    return {
      githubAccountId,
      accountLogin: "octocat",
      installationId: 12,
      settings: {
        repository: repositoryModel(isPrivate),
        repositoryId: 77,
        branch: "main",
        basePath: "solutions",
      },
      connectedAt: now,
    };
  };

  const insert = (submissionId: string, connection = createConnection()) =>
    repository.insertSolution({
      githubAccountId: connection.githubAccountId,
      connection,
      payload: createPayload(submissionId),
      now,
    });

  it("creates one-time auth flows and expires them after ten minutes", () => {
    const flow = repository.createAuthFlow({ now });
    expect(flow.state).toMatch(/^[A-Za-z0-9_-]{40,50}$/);
    expect(flow.expiresAt).toBe("2026-09-27T00:10:00.000Z");
    expect(repository.consumeAuthFlow({ state: "wrong", now })).toBe(false);
    expect(repository.consumeAuthFlow({ state: flow.state, now })).toBe(true);
    expect(repository.consumeAuthFlow({ state: flow.state, now })).toBe(false);

    const expired = repository.createAuthFlow({ now });
    expect(
      repository.consumeAuthFlow({ state: expired.state, now: "2026-09-27T00:10:00.000Z" })
    ).toBe(false);
    expect(hashGitHubSecret("secret")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashGitHubSecret("secret")).not.toBe("secret");
  });

  it("creates and expires hashed sessions and maps connections with or without settings", () => {
    connect();
    const session = repository.createSession({ githubAccountId: "account", now });
    expect(session.expiresAt).toBe("2026-10-27T00:00:00.000Z");
    expect(session.token).toMatch(/^[A-Za-z0-9_-]{40,50}$/);
    expect(
      database
        .getConnection()
        .prepare("SELECT session_hash FROM github_sessions")
        .get()
    ).toEqual({ session_hash: hashGitHubSecret(session.token) });
    expect(repository.findConnectionBySession({ token: session.token, now })).toEqual({
      githubAccountId: "account",
      accountLogin: "octocat",
      installationId: 12,
      settings: null,
      connectedAt: now,
    });
    expect(repository.findConnectionBySession({ token: "missing", now })).toBeNull();

    saveSettings("account", false);
    expect(repository.findConnectionBySession({ token: session.token, now })?.settings).toEqual({
      repository: { ...repositoryModel(false), isPrivate: false },
      repositoryId: 77,
      branch: "main",
      basePath: "solutions",
    });

    saveSettings("account", true);
    expect(repository.findConnectionBySession({ token: session.token, now })?.settings?.repository.isPrivate).toBe(true);

    expect(
      repository.findConnectionBySession({
        token: session.token,
        now: "2026-10-27T00:00:00.000Z",
      })
    ).toBeNull();
    expect(
      database.getConnection().prepare("SELECT session_hash FROM github_sessions").all()
    ).toEqual([]);
  });

  it("preserves settings for the same installation and clears them when installation changes", () => {
    createConnection();
    const session = repository.createSession({ githubAccountId: "account", now });
    repository.connectInstallation({
      githubAccountId: "account",
      accountLogin: "octocat-renamed",
      installationId: 12,
      now: "2026-09-27T01:00:00.000Z",
    });
    expect(repository.findConnectionBySession({ token: session.token, now })?.settings).not.toBeNull();

    repository.connectInstallation({
      githubAccountId: "account",
      accountLogin: "octocat-renamed",
      installationId: 13,
      now: "2026-09-27T02:00:00.000Z",
    });
    expect(repository.findConnectionBySession({ token: session.token, now })?.settings).toBeNull();
    expect(repository.findConnectionBySession({ token: session.token, now })?.installationId).toBe(13);
  });

  it("stores, scopes, updates, lists, and disconnects solution records", () => {
    const connection = createConnection();
    expect(() => repository.insertSolution({
      githubAccountId: "account",
      connection: { ...connection, settings: null },
      payload: createPayload("00000000-0000-4000-8000-000000000001"),
      now,
    })).toThrow("GitHub repository settings are not configured.");

    const saved = insert("00000000-0000-4000-8000-000000000001", connection);
    expect(saved).toMatchObject({
      submissionId: "00000000-0000-4000-8000-000000000001",
      githubAccountId: "account",
      installationId: 12,
      repositoryId: 77,
      repositoryOwner: "octocat",
      repositoryName: "algorithms",
      branch: "main",
      basePath: "solutions",
      sourceCode: "console.log('answer');",
      status: "pending",
      attemptCount: 0,
      metadata: { problemId: "42840", language: "javascript" },
    });
    expect(repository.findSolution({ submissionId: saved.submissionId, githubAccountId: "someone-else" })).toBeNull();
    expect(repository.findSolution({ submissionId: "missing", githubAccountId: "account" })).toBeNull();
    expect(repository.findSolution({ submissionId: saved.submissionId, githubAccountId: "account" })).toEqual(saved);

    connect("other-account", 13);
    const otherConnection = {
      githubAccountId: "other-account",
      accountLogin: "other",
      installationId: 13,
      settings: {
        repository: repositoryModel(),
        repositoryId: 77,
        branch: "main",
        basePath: "solutions",
      },
      connectedAt: now,
    };
    expect(() => repository.insertSolution({
      githubAccountId: "other-account",
      connection: otherConnection,
      payload: createPayload(saved.submissionId),
      now,
    })).toThrow("Could not load the saved solution record.");

    repository.updateSolutionStatus({
      submissionId: saved.submissionId,
      status: "failed",
      errorMessage: "temporary failure",
      commitSha: null,
      updatedAt: "2026-09-27T01:00:00.000Z",
      incrementAttempt: true,
    });
    expect(repository.listFailedSolutions({ githubAccountId: "account", limit: 25 })).toMatchObject([
      { submissionId: saved.submissionId, status: "failed", errorMessage: "temporary failure", attemptCount: 1 },
    ]);
    expect(repository.listFailedSolutions({ githubAccountId: "other-account", limit: 25 })).toEqual([]);

    repository.updateSolutionStatus({
      submissionId: saved.submissionId,
      status: "saved",
      errorMessage: null,
      commitSha: "commit-sha",
      updatedAt: "2026-09-27T02:00:00.000Z",
    });
    expect(repository.findSolution({ submissionId: saved.submissionId, githubAccountId: "account" })).toMatchObject({
      sourceCode: null,
      status: "saved",
      commitSha: "commit-sha",
      attemptCount: 1,
    });

    const second = insert("00000000-0000-4000-8000-000000000002", connection);
    repository.updateSolutionStatus({
      submissionId: second.submissionId,
      status: "skipped",
      errorMessage: null,
      commitSha: null,
      updatedAt: now,
      incrementAttempt: false,
    });
    expect(repository.findSolution({ submissionId: second.submissionId, githubAccountId: "account" })).toMatchObject({
      sourceCode: null,
      status: "skipped",
      attemptCount: 0,
    });

    const session = repository.createSession({ githubAccountId: "account", now });
    repository.disconnect({ githubAccountId: "account" });
    expect(repository.findConnectionBySession({ token: session.token, now })).toBeNull();
    expect(repository.findSolution({ submissionId: saved.submissionId, githubAccountId: "account" })).toBeNull();
  });

  it("fails fast if an inserted solution row cannot be read back", () => {
    const connection = createConnection();
    vi.spyOn(
      repository as unknown as {
        getSolutionRow(input: { submissionId: string }): undefined;
      },
      "getSolutionRow"
    ).mockReturnValue(undefined);

    expect(() =>
      repository.insertSolution({
        githubAccountId: connection.githubAccountId,
        connection,
        payload: createPayload("00000000-0000-4000-8000-000000000003"),
        now,
      })
    ).toThrow("Could not load the saved solution record.");
  });
});
