import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { GitHubConnectionRecord } from "../../infra/github.repository";
import { GitHubHttpController } from "./github.http.controller";
import { SESSION_COOKIE_NAME } from "./github-session.guard";

const connection: GitHubConnectionRecord = {
  githubAccountId: "42",
  accountLogin: "octocat",
  installationId: 17,
  settings: null,
  connectedAt: "2026-09-27T00:00:00.000Z",
};
const response = () => ({
  redirect: vi.fn(),
  cookie: vi.fn(),
  clearCookie: vi.fn(),
  status: vi.fn().mockReturnValue({ send: vi.fn() }),
});

describe("GitHubHttpController", () => {
  it("starts the installation flow and redirects to GitHub", async () => {
    const githubUseCase = { startConnection: vi.fn().mockResolvedValue({ url: "https://github.com/install" }) };
    const controller = new GitHubHttpController(githubUseCase as never);
    const result = response();

    await controller.connect(result);

    expect(githubUseCase.startConnection).toHaveBeenCalledWith({ now: expect.any(String) });
    expect(result.redirect).toHaveBeenCalledWith(302, "https://github.com/install");
  });

  it("redirects malformed callback queries as failed", async () => {
    const githubUseCase = { getPublicWebOrigin: vi.fn().mockReturnValue("https://web.example") };
    const controller = new GitHubHttpController(githubUseCase as never);
    const result = response();

    await controller.callback({ installation_id: "0" }, { secure: true, headers: {} }, result);

    expect(result.cookie).not.toHaveBeenCalled();
    expect(result.redirect).toHaveBeenCalledWith(302, "https://web.example/github/connected?status=failed");
  });

  it("redirects callback errors or incomplete setup actions as failed", async () => {
    const githubUseCase = { getPublicWebOrigin: vi.fn().mockReturnValue("https://web.example") };
    const controller = new GitHubHttpController(githubUseCase as never);
    const errorResponse = response();
    const incompleteResponse = response();

    await controller.callback(
      { state: "state", installation_id: "17", setup_action: "install", error: "denied" },
      { secure: false, headers: {} },
      errorResponse
    );
    await controller.callback(
      { state: "state", installation_id: "17" },
      { secure: false, headers: {} },
      incompleteResponse
    );

    expect(errorResponse.redirect).toHaveBeenCalledWith(302, "https://web.example/github/connected?status=failed");
    expect(incompleteResponse.redirect).toHaveBeenCalledWith(302, "https://web.example/github/connected?status=failed");
  });

  it("sets an HTTP-only session cookie after a successful installation callback", async () => {
    const githubUseCase = {
      getPublicWebOrigin: vi.fn().mockReturnValue("https://web.example"),
      completeConnection: vi.fn().mockResolvedValue({ token: "session-token", expiresAt: "later" }),
    };
    const controller = new GitHubHttpController(githubUseCase as never);
    const result = response();

    await controller.callback(
      { state: "state", installation_id: "17", setup_action: "install" },
      { secure: true, headers: {} },
      result
    );

    expect(githubUseCase.completeConnection).toHaveBeenCalledWith({
      state: "state",
      installationId: 17,
      now: expect.any(String),
    });
    expect(result.cookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, "session-token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60_000,
    });
    expect(result.redirect).toHaveBeenCalledWith(302, "https://web.example/github/connected?status=connected");
  });

  it("redirects failed installation completion without setting a cookie", async () => {
    const githubUseCase = {
      getPublicWebOrigin: vi.fn().mockReturnValue("https://web.example"),
      completeConnection: vi.fn().mockRejectedValue(new Error("invalid installation")),
    };
    const controller = new GitHubHttpController(githubUseCase as never);
    const result = response();

    await controller.callback(
      { state: "state", installation_id: "17", setup_action: "update" },
      { secure: false, headers: {} },
      result
    );

    expect(result.cookie).not.toHaveBeenCalled();
    expect(result.redirect).toHaveBeenCalledWith(302, "https://web.example/github/connected?status=failed");
  });

  it("returns the disconnected response or the connected account response", async () => {
    const connectedResponse = { connected: true, accountLogin: "octocat", installationId: 17, settings: null };
    const githubUseCase = {
      getConnection: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(connection),
      toConnectionResponse: vi.fn().mockReturnValue(connectedResponse),
    };
    const controller = new GitHubHttpController(githubUseCase as never);

    await expect(controller.getConnection({ secure: false, headers: {} })).resolves.toEqual({
      connected: false,
      accountLogin: null,
      installationId: null,
      settings: null,
    });
    await expect(
      controller.getConnection({
        secure: false,
        headers: { cookie: `other=x; ${SESSION_COOKIE_NAME}=valid` },
      })
    ).resolves.toEqual(connectedResponse);
    expect(githubUseCase.toConnectionResponse).toHaveBeenCalledWith({ connection });
  });

  it("forwards authenticated repository and solution operations", async () => {
    const settings = { repositoryId: 77, branch: "main", basePath: "solutions" };
    const payload = {
      submissionId: "00000000-0000-4000-8000-000000000001",
      problemId: "42840",
      problemName: "모의고사",
      difficulty: "Lv.1",
      problemUrl: "https://school.programmers.co.kr/learn/courses/30/lessons/42840",
      language: "javascript",
      sourceCode: "answer();",
      submittedAt: "2026-09-27T00:00:00.000Z",
      resultSummary: "정답",
      performanceSummary: null,
      description: "문제 설명",
      constraints: "제한 사항",
      examplesMarkdown: "예시",
    } as const;
    const githubUseCase = {
      listRepositories: vi.fn().mockResolvedValue([]),
      saveSettings: vi.fn().mockResolvedValue({ connected: true }),
      disconnect: vi.fn().mockResolvedValue(undefined),
      listFailedSolutions: vi.fn().mockResolvedValue([]),
      recordSolution: vi.fn().mockResolvedValue({ submissionId: payload.submissionId, status: "saved" }),
      retrySolution: vi.fn().mockResolvedValue({ submissionId: payload.submissionId, status: "saved" }),
    };
    const controller = new GitHubHttpController(githubUseCase as never);
    const authenticatedRequest = { ...connection, githubConnection: connection, secure: true, headers: {} };

    await expect(controller.repositories(authenticatedRequest)).resolves.toEqual([]);
    await expect(controller.saveSettings(authenticatedRequest, settings)).resolves.toEqual({ connected: true });
    await expect(controller.failedSolutions(authenticatedRequest)).resolves.toEqual([]);
    await expect(controller.recordSolution(authenticatedRequest, payload)).resolves.toMatchObject({ status: "saved" });
    await expect(controller.retrySolution(authenticatedRequest, payload.submissionId)).resolves.toMatchObject({
      status: "saved",
    });
    expect(githubUseCase.listRepositories).toHaveBeenCalledWith({ connection });
    expect(githubUseCase.saveSettings).toHaveBeenCalledWith({
      connection,
      settings,
      now: expect.any(String),
    });
    expect(githubUseCase.recordSolution).toHaveBeenCalledWith({ connection, payload, now: expect.any(String) });
    expect(githubUseCase.retrySolution).toHaveBeenCalledWith({
      connection,
      submissionId: payload.submissionId,
      now: expect.any(String),
    });
  });

  it("rejects an invalid retry identifier", () => {
    const controller = new GitHubHttpController({ retrySolution: vi.fn() } as never);

    expect(() => controller.retrySolution({ githubConnection: connection } as never, "bad-id")).toThrow(
      BadRequestException
    );
  });

  it("disconnects and clears the session cookie", async () => {
    const githubUseCase = { disconnect: vi.fn().mockResolvedValue(undefined) };
    const controller = new GitHubHttpController(githubUseCase as never);
    const result = response();

    await controller.disconnect(
      { githubConnection: connection, secure: false, headers: {} },
      result
    );

    expect(githubUseCase.disconnect).toHaveBeenCalledWith({ connection });
    expect(result.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
    });
    expect(result.status).toHaveBeenCalledWith(204);
  });
});
