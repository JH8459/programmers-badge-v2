import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type {
  GitHubRepository,
  GitHubRepositorySettings,
  SolutionRecordPayload,
} from "@programmers-badge/shared-types";

import type { GitHubConnectionRecord, StoredSolutionRecord } from "../../../infra/github.repository";
import { GitHubUseCase } from "./github.use-case";

const normalizeGitHubBasePathMock = vi.hoisted(() => vi.fn<(basePath: string) => string>());

vi.mock("../../../infra/github-app.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../infra/github-app.service")>();
  normalizeGitHubBasePathMock.mockImplementation(actual.normalizeGitHubBasePath);
  return { ...actual, normalizeGitHubBasePath: normalizeGitHubBasePathMock };
});

const now = "2026-09-27T00:00:00.000Z";
const repository: GitHubRepository = {
  id: 77,
  owner: "octocat",
  name: "algorithms",
  fullName: "octocat/algorithms",
  isPrivate: true,
  defaultBranch: "main",
};
const settings: GitHubRepositorySettings = { repositoryId: 77, branch: "main", basePath: "solutions" };
const connection: GitHubConnectionRecord = {
  githubAccountId: "42",
  accountLogin: "octocat",
  installationId: 17,
  settings: { ...settings, repository },
  connectedAt: now,
};
const payload: SolutionRecordPayload = {
  submissionId: "00000000-0000-4000-8000-000000000001",
  problemId: "42840",
  problemName: "모의고사",
  difficulty: "Lv.1",
  problemUrl: "https://school.programmers.co.kr/learn/courses/30/lessons/42840",
  language: "javascript",
  sourceCode: "answer();",
  submittedAt: now,
  resultSummary: "정답",
  performanceSummary: null,
  description: "설명",
  constraints: "제한",
  examplesMarkdown: "예시",
};
const storedRecord = (overrides: Partial<StoredSolutionRecord> = {}): StoredSolutionRecord => ({
  submissionId: payload.submissionId,
  githubAccountId: connection.githubAccountId,
  installationId: connection.installationId,
  repositoryId: repository.id,
  repositoryOwner: repository.owner,
  repositoryName: repository.name,
  branch: "main",
  basePath: "solutions",
  metadata: {
    submissionId: payload.submissionId,
    problemId: payload.problemId,
    problemName: payload.problemName,
    difficulty: payload.difficulty,
    problemUrl: payload.problemUrl,
    language: payload.language,
    submittedAt: payload.submittedAt,
    resultSummary: payload.resultSummary,
    performanceSummary: null,
    description: payload.description,
    constraints: payload.constraints,
    examplesMarkdown: payload.examplesMarkdown,
  },
  sourceCode: payload.sourceCode,
  status: "pending",
  errorMessage: null,
  attemptCount: 0,
  commitSha: null,
  updatedAt: now,
  ...overrides,
});

const createHarness = () => {
  const commandBus = { execute: vi.fn() };
  const queryBus = { execute: vi.fn() };
  const githubAppService = {
    buildInstallationUrl: vi.fn().mockReturnValue("https://github.com/apps/app/installations/new?state=flow"),
    getPublicWebOrigin: vi.fn().mockReturnValue("https://web.example"),
    verifyInstallation: vi.fn().mockResolvedValue({ githubAccountId: "42", accountLogin: "octocat" }),
    listInstallationRepositories: vi.fn().mockResolvedValue([repository]),
    validateRepositoryBranch: vi.fn().mockResolvedValue(undefined),
    writeSolution: vi.fn().mockResolvedValue({ commitSha: "sha", commitUrl: "https://github.com/commit/sha", skipped: false }),
    getFailureMessage: vi.fn().mockImplementation((error: unknown) =>
      error instanceof Error ? error.message : "GitHub 풀이 기록에 실패했습니다."
    ),
  };
  return {
    commandBus,
    queryBus,
    githubAppService,
    useCase: new GitHubUseCase(commandBus as never, queryBus as never, githubAppService as never),
  };
};

describe("GitHubUseCase", () => {
  it("starts a connection using a one-time state", async () => {
    const harness = createHarness();
    harness.commandBus.execute.mockResolvedValue({ state: "flow", expiresAt: "later" });

    await expect(harness.useCase.startConnection({ now })).resolves.toEqual({
      url: "https://github.com/apps/app/installations/new?state=flow",
      state: "flow",
    });
    expect(harness.githubAppService.buildInstallationUrl).toHaveBeenCalledWith({ state: "flow" });
  });

  it("rejects an expired or already consumed authorization state", async () => {
    const harness = createHarness();
    harness.commandBus.execute.mockResolvedValue(false);

    await expect(harness.useCase.completeConnection({ state: "expired", installationId: 17, now })).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    expect(harness.githubAppService.verifyInstallation).not.toHaveBeenCalled();
  });

  it("verifies the installation, persists it, and issues a session", async () => {
    const harness = createHarness();
    harness.commandBus.execute
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ token: "session", expiresAt: "later" });

    await expect(harness.useCase.completeConnection({ state: "state", installationId: 17, now })).resolves.toEqual({
      token: "session",
      expiresAt: "later",
    });
    expect(harness.githubAppService.verifyInstallation).toHaveBeenCalledWith({ installationId: 17 });
    expect(harness.commandBus.execute).toHaveBeenCalledTimes(3);
  });

  it("provides the web origin and connection response", () => {
    const harness = createHarness();
    expect(harness.useCase.getPublicWebOrigin()).toBe("https://web.example");
    expect(harness.useCase.toConnectionResponse({ connection })).toEqual({
      connected: true,
      accountLogin: "octocat",
      installationId: 17,
      settings: connection.settings,
    });
  });

  it("avoids querying a connection without a session and queries one when a token exists", async () => {
    const harness = createHarness();
    harness.queryBus.execute.mockResolvedValue(connection);

    await expect(harness.useCase.getConnection({ sessionToken: undefined, now })).resolves.toBeNull();
    await expect(harness.useCase.getConnection({ sessionToken: "token", now })).resolves.toBe(connection);
    expect(harness.queryBus.execute).toHaveBeenCalledTimes(1);
  });

  it("lists repositories for the connected installation", async () => {
    const harness = createHarness();
    await expect(harness.useCase.listRepositories({ connection })).resolves.toEqual([repository]);
    expect(harness.githubAppService.listInstallationRepositories).toHaveBeenCalledWith({ installationId: 17 });
  });

  it("rejects malformed settings, uninstalled repositories, invalid paths, and missing branches", async () => {
    const harness = createHarness();

    await expect(
      harness.useCase.saveSettings({ connection, settings: { ...settings, repositoryId: 0 }, now })
    ).rejects.toThrow();

    await expect(
      harness.useCase.saveSettings({ connection, settings: { ...settings, repositoryId: 999 }, now })
    ).rejects.toBeInstanceOf(ConflictException);

    await expect(
      harness.useCase.saveSettings({ connection, settings: { ...settings, basePath: "../private" }, now })
    ).rejects.toBeInstanceOf(BadRequestException);

    harness.githubAppService.validateRepositoryBranch.mockRejectedValue(new Error("branch missing"));
    await expect(harness.useCase.saveSettings({ connection, settings, now })).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(harness.githubAppService.getFailureMessage).toHaveBeenCalledWith(expect.any(Error));
  });

  it("uses a fallback message when path normalization throws a non-Error value", async () => {
    const harness = createHarness();
    const thrownValue: unknown = { reason: "unexpected failure" };
    normalizeGitHubBasePathMock.mockImplementationOnce(() => {
      throw thrownValue;
    });

    await expect(harness.useCase.saveSettings({ connection, settings, now })).rejects.toThrow(
      "기록 경로를 사용할 수 없습니다."
    );
  });

  it("normalizes and persists valid repository settings", async () => {
    const harness = createHarness();
    harness.commandBus.execute.mockResolvedValue(undefined);
    const result = await harness.useCase.saveSettings({
      connection,
      settings: { ...settings, basePath: "/solutions/" },
      now,
    });

    expect(result).toEqual({
      connected: true,
      accountLogin: "octocat",
      installationId: 17,
      settings: { repository, repositoryId: 77, branch: "main", basePath: "solutions" },
    });
    expect(harness.githubAppService.validateRepositoryBranch).toHaveBeenCalledWith({
      installationId: 17,
      repository,
      branch: "main",
    });
  });

  it("skips recording when no repository settings are configured", async () => {
    const harness = createHarness();
    await expect(
      harness.useCase.recordSolution({ connection: { ...connection, settings: null }, payload, now })
    ).resolves.toMatchObject({ status: "skipped", commitUrl: null });
    expect(harness.commandBus.execute).not.toHaveBeenCalled();
  });

  it.each([
    ["saved", { status: "saved", commitSha: "sha" }, "https://github.com/octocat/algorithms/commit/sha"],
    ["saved without sha", { status: "saved", commitSha: null }, null],
    ["skipped", { status: "skipped" }, null],
    ["failed", { status: "failed", errorMessage: "denied" }, null],
    ["failed without a message", { status: "failed", errorMessage: null }, null],
  ] as const)("returns an existing %s record", async (_name, overrides, commitUrl) => {
    const harness = createHarness();
    harness.commandBus.execute.mockResolvedValue(storedRecord(overrides));

    const result = await harness.useCase.recordSolution({ connection, payload, now });

    expect(result.status).toBe(overrides.status);
    expect(result.commitUrl).toBe(commitUrl);
    expect(harness.githubAppService.writeSolution).not.toHaveBeenCalled();
  });

  it("writes pending records and persists the resulting saved status", async () => {
    const harness = createHarness();
    harness.commandBus.execute.mockResolvedValue(storedRecord());

    await expect(harness.useCase.recordSolution({ connection, payload, now })).resolves.toMatchObject({
      status: "saved",
      commitUrl: "https://github.com/commit/sha",
    });
    expect(harness.commandBus.execute).toHaveBeenCalledTimes(3);
    expect(harness.githubAppService.writeSolution).toHaveBeenCalledWith({
      record: { ...storedRecord(), attemptCount: 1 },
    });
  });

  it("persists skipped writes and clears absent commit details", async () => {
    const harness = createHarness();
    harness.commandBus.execute.mockResolvedValue(storedRecord());
    harness.githubAppService.writeSolution.mockResolvedValue({ commitSha: "", commitUrl: "", skipped: true });

    await expect(harness.useCase.recordSolution({ connection, payload, now })).resolves.toMatchObject({
      status: "skipped",
      commitUrl: null,
    });
  });

  it("records failed writes and returns the mapped error message", async () => {
    const harness = createHarness();
    harness.commandBus.execute.mockResolvedValue(storedRecord());
    harness.githubAppService.writeSolution.mockRejectedValue(new Error("permission denied"));

    await expect(harness.useCase.recordSolution({ connection, payload, now })).resolves.toMatchObject({
      status: "failed",
      message: "permission denied",
      commitUrl: null,
    });
    expect(harness.commandBus.execute).toHaveBeenCalledTimes(3);
  });

  it("maps failed records with and without stored error messages", async () => {
    const harness = createHarness();
    harness.queryBus.execute.mockResolvedValue([
      storedRecord({ status: "failed", errorMessage: "denied" }),
      storedRecord({ submissionId: "00000000-0000-4000-8000-000000000002", status: "failed", errorMessage: null }),
    ]);

    await expect(harness.useCase.listFailedSolutions({ connection })).resolves.toEqual([
      expect.objectContaining({ submissionId: payload.submissionId, errorMessage: "denied", status: "failed" }),
      expect.objectContaining({
        submissionId: "00000000-0000-4000-8000-000000000002",
        errorMessage: "GitHub 풀이 기록에 실패했습니다.",
        status: "failed",
      }),
    ]);
  });

  it("rejects retry when the record is missing or is not failed", async () => {
    const harness = createHarness();
    harness.queryBus.execute.mockResolvedValueOnce(null).mockResolvedValueOnce(storedRecord({ status: "saved" }));

    await expect(
      harness.useCase.retrySolution({ connection, submissionId: payload.submissionId, now })
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      harness.useCase.retrySolution({ connection, submissionId: payload.submissionId, now })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("retries a failed record and forwards disconnect", async () => {
    const harness = createHarness();
    harness.queryBus.execute.mockResolvedValue(storedRecord({ status: "failed", errorMessage: "denied" }));
    harness.commandBus.execute.mockResolvedValue(undefined);

    await expect(
      harness.useCase.retrySolution({ connection, submissionId: payload.submissionId, now })
    ).resolves.toMatchObject({ status: "saved" });
    await expect(harness.useCase.disconnect({ connection })).resolves.toBeUndefined();
    expect(harness.commandBus.execute).toHaveBeenCalled();
  });
});
