import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

describe("GitHub API client", () => {
  it("loads the connection using credentialed no-store requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ connected: false, accountLogin: null, installationId: null, settings: null }),
        { status: 200 }
      )
    );
    globalThis.fetch = fetchMock;
    const { getGitHubConnection } = await import("../src/background/github-client");

    await expect(getGitHubConnection()).resolves.toEqual({
      connected: false,
      accountLogin: null,
      installationId: null,
      settings: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.programmers-badge.jh8459.com/api/github/connection",
      { method: "GET", credentials: "include", cache: "no-store", headers: {} }
    );
  });

  it("posts a validated solution payload and parses the saved result", async () => {
    const response = {
      submissionId: "00000000-0000-4000-8000-000000000001",
      status: "saved",
      message: "GitHub에 저장했습니다.",
      commitUrl: "https://github.com/octocat/algorithms/commit/abc123",
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    globalThis.fetch = fetchMock;
    const { submitGitHubSolution } = await import("../src/background/github-client");
    const payload = {
      submissionId: response.submissionId,
      problemId: "42840",
      problemName: "모의고사",
      difficulty: "Lv. 1",
      problemUrl: "https://school.programmers.co.kr/learn/courses/30/lessons/42840",
      language: "javascript" as const,
      sourceCode: "function solution() {}",
      submittedAt: "2026-09-27T00:00:00.000Z",
      resultSummary: "정답",
      performanceSummary: null,
      description: "문제 설명",
      constraints: "제한 사항",
      examplesMarkdown: "예시",
    };

    await expect(submitGitHubSolution({ payload })).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.programmers-badge.jh8459.com/api/github/solutions",
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  });

  it("returns a reconnect message when the session has expired", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    const { getGitHubConnection } = await import("../src/background/github-client");

    await expect(getGitHubConnection()).rejects.toThrow("GitHub 연결 세션이 만료됐습니다. 다시 연결해 주세요.");
  });
});
