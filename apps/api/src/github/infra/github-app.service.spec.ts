import { generateKeyPairSync } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GitHubRepository } from "@programmers-badge/shared-types";

import type { StoredSolutionRecord } from "./github.repository";
import { GitHubAppService, normalizeGitHubBasePath } from "./github-app.service";

const appId = "12345";
const extensionOrigin = "chrome-extension://nfaknmfniiemabicmcbdkajapapdglaf";
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const appEnvKeys = [
  "GITHUB_APP_ID",
  "GITHUB_APP_SLUG",
  "GITHUB_APP_PRIVATE_KEY",
  "ALLOWED_EXTENSION_ORIGINS",
  "ALLOWED_WEB_ORIGINS",
] as const;
const originalEnv = Object.fromEntries(appEnvKeys.map((key) => [key, process.env[key]]));

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const emptyResponse = (status: number): Response => new Response(null, { status });
const repository: GitHubRepository = {
  id: 77,
  owner: "octocat",
  name: "algorithms",
  fullName: "octocat/algorithms",
  isPrivate: true,
  defaultBranch: "main",
};
const record = (overrides: Partial<StoredSolutionRecord> = {}): StoredSolutionRecord => ({
  submissionId: "00000000-0000-4000-8000-000000000001",
  githubAccountId: "42",
  installationId: 17,
  repositoryId: repository.id,
  repositoryOwner: repository.owner,
  repositoryName: repository.name,
  branch: "feature/solution",
  basePath: "solutions",
  metadata: {
    submissionId: "00000000-0000-4000-8000-000000000001",
    problemId: "1234",
    problemName: "Test Problem",
    difficulty: "Lv.2",
    problemUrl: "https://school.programmers.co.kr/learn/courses/30/lessons/1234",
    language: "python3",
    submittedAt: "2026-09-27T00:00:00.000Z",
    resultSummary: "정답",
    performanceSummary: "1ms, 10MB",
    description: "설명",
    constraints: "제한 사항",
    examplesMarkdown: "| 입력 | 출력 |",
  },
  sourceCode: "print('answer')",
  status: "pending",
  errorMessage: null,
  attemptCount: 0,
  commitSha: null,
  updatedAt: "2026-09-27T00:00:00.000Z",
  ...overrides,
});
const installationTokenResponse = () =>
  jsonResponse({ token: "installation-token", expires_at: "2026-09-27T01:00:00.000Z" });
const makeRepositoryEntry = (id: number): Record<string, unknown> => ({
  id,
  name: `repo-${id}`,
  full_name: `octocat/repo-${id}`,
  private: true,
  default_branch: "main",
  owner: { login: "octocat" },
});

describe("normalizeGitHubBasePath", () => {
  it("trims outer slashes, keeps safe segments, and permits an empty path", () => {
    expect(normalizeGitHubBasePath(" /solutions/practice/ ")).toBe("solutions/practice");
    expect(normalizeGitHubBasePath("///")).toBe("");
  });

  it.each([".", "..", ".git", ".GITHUB", "a\\b", "a\u0001b", "a\u007fb"])(
    "rejects unsafe path segment %j",
    (segment) => {
      expect(() => normalizeGitHubBasePath(`safe/${segment}`)).toThrow();
    }
  );
});

describe("GitHubAppService", () => {
  let service: GitHubAppService;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    process.env.GITHUB_APP_ID = appId;
    process.env.GITHUB_APP_SLUG = "programmers badge";
    process.env.GITHUB_APP_PRIVATE_KEY = privateKeyPem;
    process.env.ALLOWED_EXTENSION_ORIGINS = extensionOrigin;
    process.env.ALLOWED_WEB_ORIGINS = "https://web.example,https://web-two.example";
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    service = new GitHubAppService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const key of appEnvKeys) {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("builds an encoded installation URL and returns the configured web origin", () => {
    expect(service.buildInstallationUrl({ state: "one-time-state" })).toBe(
      "https://github.com/apps/programmers%20badge/installations/new?state=one-time-state"
    );
    expect(service.getPublicWebOrigin()).toBe("https://web.example");

    delete process.env.ALLOWED_WEB_ORIGINS;
    expect(service.getPublicWebOrigin()).toBe("http://localhost:5020");
  });

  it("requires GitHub App runtime configuration before building App requests", async () => {
    delete process.env.GITHUB_APP_ID;
    delete process.env.GITHUB_APP_SLUG;
    delete process.env.GITHUB_APP_PRIVATE_KEY;

    expect(() => service.buildInstallationUrl({ state: "state" })).toThrow(/설정이 아직 완료되지 않았습니다/);
    await expect(service.verifyInstallation({ installationId: 17 })).rejects.toThrow(
      /설정이 아직 완료되지 않았습니다/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies an installation and rejects installations owned by another app", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 17, app_id: Number(appId), account: { id: 42, login: "octocat", type: "User" } })
    );
    await expect(service.verifyInstallation({ installationId: 17 })).resolves.toEqual({
      githubAccountId: "42",
      accountLogin: "octocat",
    });
    const authHeader = new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("authorization");
    expect(authHeader).toMatch(/^Bearer [^.]+\.[^.]+\.[^.]+$/);

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 18, app_id: Number(appId), account: { id: 42, login: "octocat" } })
    );
    await expect(service.verifyInstallation({ installationId: 17 })).rejects.toThrow(
      "승인된 설치가 현재 GitHub App에 속하지 않습니다."
    );

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 17, app_id: 999, account: { id: 42, login: "octocat" } })
    );
    await expect(service.verifyInstallation({ installationId: 17 })).rejects.toThrow(
      "승인된 설치가 현재 GitHub App에 속하지 않습니다."
    );
  });

  it("validates GitHub installation responses before trusting them", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "17", app_id: Number(appId), account: null }));

    await expect(service.verifyInstallation({ installationId: 17 })).rejects.toThrow();
  });

  it("lists repositories and stops after a short page", async () => {
    fetchMock
      .mockResolvedValueOnce(installationTokenResponse())
      .mockResolvedValueOnce(
        jsonResponse({
          repositories: [
            { ...makeRepositoryEntry(77), name: "algorithms", full_name: "octocat/algorithms" },
          ],
        })
      );

    await expect(service.listInstallationRepositories({ installationId: 17 })).resolves.toEqual([
      repository,
    ]);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "https://api.github.com/app/installations/17/access_tokens",
      "https://api.github.com/installation/repositories?per_page=100&page=1",
    ]);
  });

  it("follows full pages up to the maximum repository page count", async () => {
    fetchMock.mockResolvedValueOnce(installationTokenResponse());
    for (let page = 0; page < 5; page += 1) {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ repositories: Array.from({ length: 100 }, (_, index) => makeRepositoryEntry(page * 100 + index + 1)) })
      );
    }

    const repositories = await service.listInstallationRepositories({ installationId: 17 });

    expect(repositories).toHaveLength(500);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(String(fetchMock.mock.calls[5]?.[0])).toContain("page=5");
  });

  it("rejects malformed repository responses", async () => {
    fetchMock
      .mockResolvedValueOnce(installationTokenResponse())
      .mockResolvedValueOnce(jsonResponse({ repositories: [{ id: "bad" }] }));

    await expect(service.listInstallationRepositories({ installationId: 17 })).rejects.toThrow();
  });

  it("rejects malformed installation token responses", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ token: "", expires_at: "tomorrow" }));

    await expect(service.listInstallationRepositories({ installationId: 17 })).rejects.toThrow();
  });

  it("validates branches using an installation token scoped to the repository", async () => {
    fetchMock.mockResolvedValueOnce(installationTokenResponse()).mockResolvedValueOnce(emptyResponse(204));

    await expect(
      service.validateRepositoryBranch({
        installationId: 17,
        repository: { ...repository, owner: "octo cat" },
        branch: "feature/solution branch",
      })
    ).resolves.toBeUndefined();
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://api.github.com/repos/octo%20cat/algorithms/branches/feature/solution%20branch"
    );
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("authorization")).toMatch(/^Bearer /);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      permissions: { contents: "read", metadata: "read" },
      repository_ids: [77],
    });
  });

  it("skips creating a commit when the same language file already has the same source", async () => {
    fetchMock
      .mockResolvedValueOnce(installationTokenResponse())
      .mockResolvedValueOnce(
        jsonResponse({
          type: "file",
          sha: "existing-sha",
          content: Buffer.from("print('answer')").toString("base64") + "\n",
          encoding: "base64",
        })
      );

    await expect(service.writeSolution({ record: record() })).resolves.toEqual({
      commitSha: "",
      commitUrl: "",
      skipped: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("solutions/");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("python3.py?ref=feature%2Fsolution");
  });

  it("writes a normalized solution path and a README in one commit", async () => {
    const apiCalls: Array<{ url: string; init?: RequestInit }> = [];
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      apiCalls.push({ url, init });
      const path = new URL(url).pathname;
      if (path.endsWith("/access_tokens")) {
        return installationTokenResponse();
      }
      if (path.includes("/contents/")) {
        if (path.endsWith("/python3.py")) {
          return jsonResponse({
            type: "file",
            sha: "old-source-sha",
            content: Buffer.from("print('old answer')").toString("base64"),
            encoding: "base64",
          });
        }
        return jsonResponse([
          { name: "README.md", type: "file" },
          { name: "Java.java", type: "file" },
          { name: "python3.py", type: "file" },
          { name: "bad.", type: "file" },
          { name: "folder", type: "dir" },
          { name: ".hidden", type: "file" },
        ]);
      }
      if (path.endsWith("/git/ref/heads/feature/solution")) {
        return jsonResponse({ object: { sha: "parent" } });
      }
      if (path.endsWith("/git/commits/parent")) {
        return jsonResponse({ tree: { sha: "parent-tree" } });
      }
      if (path.endsWith("/git/blobs")) {
        return jsonResponse({ sha: `blob-${apiCalls.filter((call) => call.url.endsWith("/git/blobs")).length}` });
      }
      if (path.endsWith("/git/trees")) {
        return jsonResponse({ sha: "tree-sha" });
      }
      if (path.endsWith("/git/commits")) {
        return jsonResponse({ sha: "commit-sha" });
      }
      if (path.endsWith("/git/refs/heads/feature/solution")) {
        return emptyResponse(204);
      }
      return emptyResponse(404);
    });

    const result = await service.writeSolution({
      record: record({
        basePath: "/solutions/",
        metadata: {
          ...record().metadata,
          problemName: "  Fizz / Buzz!\n  ",
        },
      }),
    });

    expect(result).toEqual({
      commitSha: "commit-sha",
      commitUrl: "https://github.com/octocat/algorithms/commit/commit-sha",
      skipped: false,
    });
    const blobBodies = apiCalls
      .filter(({ url }) => url.endsWith("/git/blobs"))
      .map(({ init }) => JSON.parse(String(init?.body)) as { content: string });
    expect(blobBodies[0]?.content).toBe("print('answer')");
    expect(blobBodies[1]?.content).toContain("# 1234.   Fizz / Buzz!\n  ");
    expect(blobBodies[1]?.content).toContain("[Java](Java.java)");
    expect(blobBodies[1]?.content).toContain("[bad](bad.)");
    expect(blobBodies[1]?.content).toContain("[python3](python3.py)");
    expect(blobBodies[1]?.content).toContain("- 실행 결과: 1ms, 10MB");
    const commitBody = JSON.parse(String(apiCalls.find(({ url }) => url.endsWith("/git/commits"))?.init?.body)) as {
      message: string;
    };
    expect(commitBody.message).toBe("solved(Programmers): #1234 Fizz / Buzz!");
    expect(apiCalls.some(({ url }) => url.includes("%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8%EC%8A%A4/2/1234-fizz-buzz"))).toBe(true);
    const treeBody = JSON.parse(String(apiCalls.find(({ url }) => url.endsWith("/git/trees"))?.init?.body)) as {
      tree: Array<{ path: string }>;
    };
    expect(treeBody.tree.map(({ path }) => path)).toEqual([
      "solutions/프로그래머스/2/1234-fizz-buzz/python3.py",
      "solutions/프로그래머스/2/1234-fizz-buzz/README.md",
    ]);
    const patchRequest = apiCalls.find(({ init }) => init?.method === "PATCH");
    expect(JSON.parse(String(patchRequest?.init?.body))).toEqual({ sha: "commit-sha", force: false });
  });

  it("uses README fallbacks for absent metadata and a punctuation-only problem name", async () => {
    fetchMock.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/access_tokens")) return installationTokenResponse();
      if (path.includes("/contents/") && path.endsWith("/c.c")) return emptyResponse(404);
      if (path.includes("/contents/")) return emptyResponse(404);
      if (path.endsWith("/git/ref/heads/feature/solution")) return jsonResponse({ object: { sha: "parent" } });
      if (path.endsWith("/git/commits/parent")) return jsonResponse({ tree: { sha: "parent-tree" } });
      if (path.endsWith("/git/blobs")) {
        return jsonResponse({ sha: `blob-${fetchMock.mock.calls.length}` });
      }
      if (path.endsWith("/git/trees")) return jsonResponse({ sha: "tree-sha" });
      if (path.endsWith("/git/commits")) return jsonResponse({ sha: "commit-sha" });
      if (path.endsWith("/git/refs/heads/feature/solution")) return emptyResponse(204);
      return emptyResponse(404);
    });

    await service.writeSolution({
      record: record({
        basePath: "",
        metadata: {
          ...record().metadata,
          problemName: "!!!",
          difficulty: "hard",
          language: "c",
          performanceSummary: null,
          description: "",
          constraints: "",
          examplesMarkdown: "",
        },
      }),
    });

    const readmeBody = JSON.parse(String(fetchMock.mock.calls.find(([url, init]) =>
      String(url).endsWith("/git/blobs") && JSON.parse(String(init?.body)).content !== "print('answer')"
    )?.[1]?.body)) as { content: string };
    expect(readmeBody.content).toContain("# 1234. !!!");
    const treeBody = JSON.parse(String(fetchMock.mock.calls.find(([url]) => String(url).endsWith("/git/trees"))?.[1]?.body)) as {
      tree: Array<{ path: string }>;
    };
    expect(treeBody.tree.map(({ path }) => path)).toContain("프로그래머스/unknown/1234/c.c");
    expect(readmeBody.content).toContain("문제 설명을 페이지에서 읽지 못했습니다.");
    expect(readmeBody.content).toContain("제한사항을 페이지에서 읽지 못했습니다.");
    expect(readmeBody.content).toContain("입출력 예시를 페이지에서 읽지 못했습니다.");
    expect(readmeBody.content).not.toContain("실행 결과");
  });

  it("retries a branch update conflict and succeeds on the next attempt", async () => {
    let patchCount = 0;
    fetchMock.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/access_tokens")) return installationTokenResponse();
      if (path.includes("/contents/") && path.endsWith("/python3.py")) return emptyResponse(404);
      if (path.includes("/contents/")) return jsonResponse([]);
      if (path.endsWith("/git/ref/heads/feature/solution")) return jsonResponse({ object: { sha: `parent-${patchCount}` } });
      if (path.startsWith("/repos/octocat/algorithms/git/commits/parent-")) {
        return jsonResponse({ tree: { sha: "parent-tree" } });
      }
      if (path.endsWith("/git/blobs")) return jsonResponse({ sha: "blob-sha" });
      if (path.endsWith("/git/trees")) return jsonResponse({ sha: "tree-sha" });
      if (path.endsWith("/git/commits")) return jsonResponse({ sha: "commit-sha" });
      if (path.endsWith("/git/refs/heads/feature/solution")) {
        patchCount += 1;
        return patchCount === 1 ? emptyResponse(409) : emptyResponse(204);
      }
      return emptyResponse(404);
    });

    await expect(service.writeSolution({ record: record() })).resolves.toMatchObject({ skipped: false });
    expect(patchCount).toBe(2);
  });

  it.each([
    [409, 3],
    [422, 3],
    [500, 1],
  ])("stops retrying branch updates with status %i after %i attempt(s)", async (status, attempts) => {
    fetchMock.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/access_tokens")) return installationTokenResponse();
      if (path.includes("/contents/") && path.endsWith("/python3.py")) return emptyResponse(404);
      if (path.includes("/contents/")) return jsonResponse([]);
      if (path.endsWith("/git/ref/heads/feature/solution")) return jsonResponse({ object: { sha: "parent" } });
      if (path.includes("/git/commits/parent")) return jsonResponse({ tree: { sha: "parent-tree" } });
      if (path.endsWith("/git/blobs")) return jsonResponse({ sha: "blob-sha" });
      if (path.endsWith("/git/trees")) return jsonResponse({ sha: "tree-sha" });
      if (path.endsWith("/git/commits")) return jsonResponse({ sha: "commit-sha" });
      if (path.endsWith("/git/refs/heads/feature/solution")) return emptyResponse(status);
      return emptyResponse(404);
    });

    await expect(service.writeSolution({ record: record() })).rejects.toThrow("GitHub API request failed.");
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(attempts);
  });

  it("propagates non-conflict branch update failures without retrying", async () => {
    fetchMock.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("/access_tokens")) return installationTokenResponse();
      if (path.includes("/contents/") && path.endsWith("/python3.py")) return emptyResponse(404);
      if (path.includes("/contents/")) return jsonResponse([]);
      if (path.endsWith("/git/ref/heads/feature/solution")) return jsonResponse({ object: { sha: "parent" } });
      if (path.includes("/git/commits/parent")) return jsonResponse({ tree: { sha: "parent-tree" } });
      if (path.endsWith("/git/blobs")) return jsonResponse({ sha: "blob-sha" });
      if (path.endsWith("/git/trees")) return jsonResponse({ sha: "tree-sha" });
      if (path.endsWith("/git/commits")) return jsonResponse({ sha: "commit-sha" });
      if (path.endsWith("/git/refs/heads/feature/solution")) throw new Error("network failure");
      return emptyResponse(404);
    });

    await expect(service.writeSolution({ record: record() })).rejects.toThrow("network failure");
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
  });

  it("rejects a write with no stored source code", async () => {
    await expect(service.writeSolution({ record: record({ sourceCode: null }) })).rejects.toThrow(
      "재시도할 풀이 코드가 없습니다."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps GitHub API status codes and unknown failures to user-facing messages", async () => {
    const messages = new Map([
      [401, "GitHub 연결 권한이 만료됐습니다. 다시 연결해 주세요."],
      [403, "GitHub App의 저장소 권한이 부족하거나 요청 한도에 도달했습니다."],
      [404, "선택한 저장소나 브랜치를 찾지 못했습니다. GitHub 설정을 확인해 주세요."],
      [409, "브랜치가 동시에 변경됐습니다. 재시도하면 최신 브랜치에 기록합니다."],
      [422, "GitHub가 풀이 파일을 거부했습니다. 경로와 브랜치 설정을 확인해 주세요."],
      [500, "GitHub 기록에 실패했습니다. 연결과 저장소 권한을 확인한 뒤 재시도해 주세요."],
    ]);

    for (const [status, message] of messages) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(installationTokenResponse()).mockResolvedValueOnce(emptyResponse(status));
      const error = await service
        .validateRepositoryBranch({ installationId: 17, repository, branch: "main" })
        .catch((caught: unknown) => caught);
      expect(service.getFailureMessage(error)).toBe(message);
    }

    expect(service.getFailureMessage(new Error("local failure"))).toBe("local failure");
    expect(service.getFailureMessage("unknown")).toBe("GitHub 풀이 기록에 실패했습니다.");
  });

  it("allows an unauthenticated direct GET to use the default method without an authorization header", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const fetchGitHub = (
      service as unknown as { fetchGitHub(input: { path: string }): Promise<unknown> }
    ).fetchGitHub.bind(service);

    await expect(fetchGitHub({ path: "/meta" })).resolves.toEqual({ ok: true });
    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.method).toBe("GET");
    expect(new Headers(request?.headers).get("authorization")).toBeNull();
  });

  it("handles file and directory lookup fallbacks, and rethrows other lookup failures", async () => {
    fetchMock
      .mockResolvedValueOnce(installationTokenResponse())
      .mockResolvedValueOnce(emptyResponse(404))
      .mockResolvedValueOnce(emptyResponse(404))
      .mockResolvedValueOnce(jsonResponse({ object: { sha: "parent" } }))
      .mockResolvedValueOnce(jsonResponse({ tree: { sha: "tree" } }))
      .mockResolvedValueOnce(jsonResponse({ sha: "source" }))
      .mockResolvedValueOnce(jsonResponse({ sha: "readme" }))
      .mockResolvedValueOnce(jsonResponse({ sha: "new-tree" }))
      .mockResolvedValueOnce(jsonResponse({ sha: "new-commit" }))
      .mockResolvedValueOnce(emptyResponse(204));
    await expect(service.writeSolution({ record: record() })).resolves.toMatchObject({
      commitSha: "new-commit",
    });

    fetchMock.mockResolvedValueOnce(installationTokenResponse()).mockResolvedValueOnce(emptyResponse(500));
    await expect(service.writeSolution({ record: record() })).rejects.toThrow("GitHub API request failed.");

    fetchMock
      .mockResolvedValueOnce(installationTokenResponse())
      .mockResolvedValueOnce(emptyResponse(404))
      .mockResolvedValueOnce(emptyResponse(500));
    await expect(service.writeSolution({ record: record() })).rejects.toThrow("GitHub API request failed.");
  });

  it("uses the five-page maximum even when every page is full", async () => {
    fetchMock.mockResolvedValueOnce(installationTokenResponse());
    for (let page = 0; page < 5; page += 1) {
      fetchMock.mockResolvedValueOnce(jsonResponse({ repositories: Array.from({ length: 100 }, (_, index) => makeRepositoryEntry(page * 100 + index + 1)) }));
    }
    await service.listInstallationRepositories({ installationId: 17 });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
