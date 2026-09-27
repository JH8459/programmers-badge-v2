import { Injectable } from "@nestjs/common";
import { createSign } from "node:crypto";
import { z } from "zod";

import {
  solutionLanguageSchema,
  type GitHubRepository,
  type SolutionRecordMetadata,
} from "@programmers-badge/shared-types";

import { readApiRuntimeConfig, type GitHubAppConfig } from "../../common/runtime-config";
import type { StoredSolutionRecord } from "./github.repository";

const installationSchema = z
  .object({
    id: z.number().int().positive(),
    app_id: z.number().int().positive(),
    account: z.object({ id: z.number().int().positive(), login: z.string().min(1) }).passthrough(),
  })
  .passthrough();
const installationTokenSchema = z
  .object({ token: z.string().min(1), expires_at: z.string().datetime({ offset: true }) })
  .passthrough();
const installationRepositoriesSchema = z
  .object({ repositories: z.array(z.unknown()) })
  .passthrough();
const repositorySchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    full_name: z.string().min(3),
    private: z.boolean(),
    default_branch: z.string().min(1),
    owner: z.object({ login: z.string().min(1) }).passthrough(),
  })
  .passthrough();
const repositoryContentFileSchema = z
  .object({
    type: z.literal("file"),
    sha: z.string().min(1),
    content: z.string(),
    encoding: z.literal("base64"),
  })
  .passthrough();
const repositoryContentListSchema = z
  .array(z.object({ name: z.string(), type: z.enum(["file", "dir", "submodule", "symlink"]) }).passthrough());
const referenceSchema = z.object({ object: z.object({ sha: z.string().min(1) }).passthrough() }).passthrough();
const commitSchema = z.object({ tree: z.object({ sha: z.string().min(1) }).passthrough() }).passthrough();
const shaSchema = z.object({ sha: z.string().min(1) }).passthrough();

const SOLUTION_LANGUAGE_EXTENSIONS: Record<z.infer<typeof solutionLanguageSchema>, string> = {
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  go: "go",
  java: "java",
  javascript: "js",
  kotlin: "kt",
  mysql: "sql",
  oracle: "sql",
  php: "php",
  python2: "py",
  python3: "py",
  ruby: "rb",
  rust: "rs",
  scala: "scala",
  swift: "swift",
};

export interface GitHubInstallationAccount {
  githubAccountId: string;
  accountLogin: string;
}

export interface GitHubCommitResult {
  commitSha: string;
  commitUrl: string;
  skipped: boolean;
}

type GitHubInstallationPermissions = Record<string, "read" | "write">;

class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

const toRepository = (input: unknown): GitHubRepository => {
  const repository = repositorySchema.parse(input);
  return {
    id: repository.id,
    owner: repository.owner.login,
    name: repository.name,
    fullName: repository.full_name,
    isPrivate: repository.private,
    defaultBranch: repository.default_branch,
  };
};

const pathSegments = (path: string): string =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const normalizeProblemSlug = (value: string): string =>
  value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");

const getDifficultyDirectory = (difficulty: string): string => {
  const match = difficulty.match(/\d+/);
  return match?.[0] ?? "unknown";
};

const joinRepositoryPath = (...parts: string[]): string =>
  parts
    .flatMap((part) => part.split("/"))
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join("/");

export const normalizeGitHubBasePath = (basePath: string): string => {
  const normalizedPath = basePath.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedPath) {
    return "";
  }

  const segments = normalizedPath.split("/");
  if (
    segments.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        segment.toLowerCase() === ".git" ||
        segment.toLowerCase() === ".github" ||
        segment.includes("\\") ||
        [...segment].some((character) => {
          const codePoint = character.charCodeAt(0);
          return codePoint <= 0x1f || codePoint === 0x7f;
        })
    )
  ) {
    throw new Error("기록 경로에 .git, .github, 상대 경로 또는 제어 문자를 사용할 수 없습니다.");
  }

  return segments.join("/");
};

const makeProblemDirectory = ({
  record,
  basePath,
}: {
  record: StoredSolutionRecord;
  basePath: string;
}): string => {
  const slug = normalizeProblemSlug(record.metadata.problemName);
  const name = slug ? `${record.metadata.problemId}-${slug}` : record.metadata.problemId;
  return joinRepositoryPath(
    normalizeGitHubBasePath(basePath),
    "프로그래머스",
    getDifficultyDirectory(record.metadata.difficulty),
    name,
  );
};

const renderSolutionReadme = ({
  metadata,
  languageFiles,
  language,
}: {
  metadata: SolutionRecordMetadata;
  languageFiles: Array<{ language: string; fileName: string }>;
  language: string;
}): string => {
  const sortedFiles = [...languageFiles].sort((left, right) => left.language.localeCompare(right.language));
  const solutionLinks = sortedFiles.map(({ language: fileLanguage, fileName }) => `- [${fileLanguage}](${encodeURIComponent(fileName)})`).join("\n");
  const sections = [
    `# ${metadata.problemId}. ${metadata.problemName}`,
    "",
    `- 문제: [${metadata.problemName}](${metadata.problemUrl})`,
    `- 난이도: ${metadata.difficulty}`,
    `- 제출 언어: ${language}`,
    `- 제출 일자: ${metadata.submittedAt.slice(0, 10)}`,
    `- 채점 결과: ${metadata.resultSummary}`,
    ...(metadata.performanceSummary ? [`- 실행 결과: ${metadata.performanceSummary}`] : []),
    "",
    "## 문제 설명",
    "",
    metadata.description || "문제 설명을 페이지에서 읽지 못했습니다.",
    "",
    "## 제한사항",
    "",
    metadata.constraints || "제한사항을 페이지에서 읽지 못했습니다.",
    "",
    "## 입출력 예시",
    "",
    metadata.examplesMarkdown || "입출력 예시를 페이지에서 읽지 못했습니다.",
    "",
    "## 풀이 파일",
    "",
    solutionLinks || `- [${language}](${encodeURIComponent(`${language}.${SOLUTION_LANGUAGE_EXTENSIONS[metadata.language]}`)})`,
    "",
  ];

  return sections.join("\n");
};

const getGitHubErrorMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 401:
      return "GitHub 연결 권한이 만료됐습니다. 다시 연결해 주세요.";
    case 403:
      return "GitHub App의 저장소 권한이 부족하거나 요청 한도에 도달했습니다.";
    case 404:
      return "선택한 저장소나 브랜치를 찾지 못했습니다. GitHub 설정을 확인해 주세요.";
    case 409:
      return "브랜치가 동시에 변경됐습니다. 재시도하면 최신 브랜치에 기록합니다.";
    case 422:
      return "GitHub가 풀이 파일을 거부했습니다. 경로와 브랜치 설정을 확인해 주세요.";
    default:
      return "GitHub 기록에 실패했습니다. 연결과 저장소 권한을 확인한 뒤 재시도해 주세요.";
  }
};

@Injectable()
export class GitHubAppService {
  private getAppConfig(): GitHubAppConfig {
    const config = readApiRuntimeConfig().githubApp;
    if (!config) {
      throw new Error("GitHub App 연동 설정이 아직 완료되지 않았습니다.");
    }
    return config;
  }

  buildInstallationUrl({ state }: { state: string }): string {
    const config = this.getAppConfig();
    const url = new URL(`https://github.com/apps/${encodeURIComponent(config.slug)}/installations/new`);
    url.searchParams.set("state", state);
    return url.toString();
  }

  getPublicWebOrigin(): string {
    return readApiRuntimeConfig().allowedWebOrigins[0] ?? "http://localhost:5020";
  }

  async verifyInstallation({ installationId }: { installationId: number }): Promise<GitHubInstallationAccount> {
    const config = this.getAppConfig();
    const installation = installationSchema.parse(
      await this.fetchGitHub({
        path: `/app/installations/${installationId}`,
        jwt: this.createAppJwt(config),
      })
    );
    if (installation.id !== installationId || installation.app_id !== config.appId) {
      throw new Error("승인된 설치가 현재 GitHub App에 속하지 않습니다.");
    }
    return {
      githubAccountId: String(installation.account.id),
      accountLogin: installation.account.login,
    };
  }

  async listInstallationRepositories({ installationId }: { installationId: number }): Promise<GitHubRepository[]> {
    const repositories: GitHubRepository[] = [];
    const token = await this.createInstallationToken({
      installationId,
      permissions: { metadata: "read" },
    });
    for (let page = 1; page <= 5; page += 1) {
      const response = installationRepositoriesSchema.parse(
        await this.fetchGitHub({
          path: `/installation/repositories?per_page=100&page=${page}`,
          token,
        })
      );
      repositories.push(...response.repositories.map(toRepository));
      if (response.repositories.length < 100) {
        break;
      }
    }
    return repositories;
  }

  async validateRepositoryBranch({
    installationId,
    repository,
    branch,
  }: {
    installationId: number;
    repository: GitHubRepository;
    branch: string;
  }): Promise<void> {
    const token = await this.createInstallationToken({
      installationId,
      repositoryId: repository.id,
      permissions: { contents: "read", metadata: "read" },
    });
    await this.fetchGitHub({
      path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/branches/${pathSegments(branch)}`,
      token,
    });
  }

  async writeSolution({ record }: { record: StoredSolutionRecord }): Promise<GitHubCommitResult> {
    const sourceCode = record.sourceCode;
    if (sourceCode === null) {
      throw new Error("재시도할 풀이 코드가 없습니다.");
    }

    const repository = {
      id: record.repositoryId,
      owner: record.repositoryOwner,
      name: record.repositoryName,
      fullName: `${record.repositoryOwner}/${record.repositoryName}`,
      isPrivate: true,
      defaultBranch: record.branch,
    } satisfies GitHubRepository;
    const installationId = record.installationId;
    const problemDirectory = makeProblemDirectory({ record, basePath: record.basePath });
    const extension = SOLUTION_LANGUAGE_EXTENSIONS[record.metadata.language];
    const solutionFileName = `${record.metadata.language}.${extension}`;
    const solutionPath = joinRepositoryPath(problemDirectory, solutionFileName);
    const readmePath = joinRepositoryPath(problemDirectory, "README.md");
    const token = await this.createInstallationToken({
      installationId,
      repositoryId: repository.id,
      permissions: { contents: "write", metadata: "read" },
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existingSource = await this.getRepositoryFile({
        repository,
        path: solutionPath,
        branch: record.branch,
        token,
      });
      if (existingSource?.content === sourceCode) {
        return { commitSha: "", commitUrl: "", skipped: true };
      }

      const directoryEntries = await this.listRepositoryDirectory({
        repository,
        path: problemDirectory,
        branch: record.branch,
        token,
      });
      const languageFiles = directoryEntries
        .filter((entry) => entry.type === "file" && entry.name !== "README.md")
        .map((entry) => {
          const dotIndex = entry.name.lastIndexOf(".");
          return dotIndex < 1 ? null : { language: entry.name.slice(0, dotIndex), fileName: entry.name };
        })
        .filter((entry): entry is { language: string; fileName: string } => entry !== null);
      if (!languageFiles.some(({ fileName }) => fileName === solutionFileName)) {
        languageFiles.push({ language: record.metadata.language, fileName: solutionFileName });
      }
      const readme = renderSolutionReadme({
        metadata: record.metadata,
        languageFiles,
        language: record.metadata.language,
      });

      const reference = referenceSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/ref/heads/${pathSegments(record.branch)}`,
          token,
        })
      );
      const parentSha = reference.object.sha;
      const parentCommit = commitSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/commits/${parentSha}`,
          token,
        })
      );
      const sourceBlob = shaSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/blobs`,
          method: "POST",
          token,
          body: { content: sourceCode, encoding: "utf-8" },
        })
      );
      const readmeBlob = shaSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/blobs`,
          method: "POST",
          token,
          body: { content: readme, encoding: "utf-8" },
        })
      );
      const tree = shaSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/trees`,
          method: "POST",
          token,
          body: {
            base_tree: parentCommit.tree.sha,
            tree: [
              { path: solutionPath, mode: "100644", type: "blob", sha: sourceBlob.sha },
              { path: readmePath, mode: "100644", type: "blob", sha: readmeBlob.sha },
            ],
          },
        })
      );
      const commit = shaSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/commits`,
          method: "POST",
          token,
          body: {
            message: this.createCommitMessage(record.metadata),
            tree: tree.sha,
            parents: [parentSha],
          },
        })
      );

      try {
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/git/refs/heads/${pathSegments(record.branch)}`,
          method: "PATCH",
          token,
          body: { sha: commit.sha, force: false },
        });
        return {
          commitSha: commit.sha,
          commitUrl: `https://github.com/${repository.fullName}/commit/${commit.sha}`,
          skipped: false,
        };
      } catch (error) {
        if (!(error instanceof GitHubApiError) || ![409, 422].includes(error.statusCode) || attempt === 2) {
          throw error;
        }
      }
    }

    throw new Error("GitHub branch update could not be completed.");
  }

  getFailureMessage(error: unknown): string {
    if (error instanceof GitHubApiError) {
      return getGitHubErrorMessage(error.statusCode);
    }
    return error instanceof Error ? error.message : "GitHub 풀이 기록에 실패했습니다.";
  }

  private async getRepositoryFile({
    repository,
    path,
    branch,
    token,
  }: {
    repository: GitHubRepository;
    path: string;
    branch: string;
    token: string;
  }): Promise<{ content: string; sha: string } | null> {
    try {
      const response = repositoryContentFileSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/contents/${pathSegments(path)}?ref=${encodeURIComponent(branch)}`,
          token,
        })
      );
      return { content: Buffer.from(response.content.replace(/\n/g, ""), "base64").toString("utf8"), sha: response.sha };
    } catch (error) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  private async listRepositoryDirectory({
    repository,
    path,
    branch,
    token,
  }: {
    repository: GitHubRepository;
    path: string;
    branch: string;
    token: string;
  }): Promise<Array<{ name: string; type: string }>> {
    try {
      return repositoryContentListSchema.parse(
        await this.fetchGitHub({
          path: `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/contents/${pathSegments(path)}?ref=${encodeURIComponent(branch)}`,
          token,
        })
      );
    } catch (error) {
      if (error instanceof GitHubApiError && error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  private createCommitMessage(metadata: SolutionRecordMetadata): string {
    const problemName = metadata.problemName.replace(/[\r\n]+/g, " ").trim();
    return `solved(Programmers): #${metadata.problemId} ${problemName}`.slice(0, 120);
  }

  private async createInstallationToken({
    installationId,
    repositoryId,
    permissions,
  }: {
    installationId: number;
    repositoryId?: number;
    permissions: GitHubInstallationPermissions;
  }): Promise<string> {
    const config = this.getAppConfig();
    const response = installationTokenSchema.parse(
      await this.fetchGitHub({
        path: `/app/installations/${installationId}/access_tokens`,
        method: "POST",
        jwt: this.createAppJwt(config),
        body: {
          permissions,
          ...(repositoryId === undefined ? {} : { repository_ids: [repositoryId] }),
        },
      })
    );
    return response.token;
  }

  private createAppJwt(config: GitHubAppConfig): string {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ iat: nowSeconds - 60, exp: nowSeconds + 8 * 60, iss: config.appId })
    ).toString("base64url");
    const unsignedToken = `${header}.${payload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsignedToken);
    signer.end();
    return `${unsignedToken}.${signer.sign(config.privateKey).toString("base64url")}`;
  }

  private async fetchGitHub({
    path,
    token,
    jwt,
    method = "GET",
    body,
  }: {
    path: string;
    token?: string;
    jwt?: string;
    method?: "GET" | "POST" | "PATCH";
    body?: Record<string, unknown>;
  }): Promise<unknown> {
    const headers = new Headers({
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "programmers-badge-v2",
    });
    if (token ?? jwt) {
      headers.set("authorization", `Bearer ${token ?? jwt}`);
    }
    if (body) {
      headers.set("content-type", "application/json");
    }
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw new GitHubApiError("GitHub API request failed.", response.status);
    }
    if (response.status === 204) {
      return {};
    }
    return response.json();
  }
}
