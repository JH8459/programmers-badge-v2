import {
  failedSolutionRecordSchema,
  githubConnectionResponseSchema,
  githubRepositorySchema,
  githubRepositorySettingsSchema,
  solutionRecordPayloadSchema,
  solutionRecordResultSchema,
  type FailedSolutionRecord,
  type GitHubConnectionResponse,
  type GitHubRepository,
  type GitHubRepositorySettings,
  type SolutionRecordPayload,
  type SolutionRecordResult,
} from "@programmers-badge/shared-types";
import { z } from "zod";

import { EXTENSION_API_BASE_URL } from "./api-client.js";

const errorBodySchema = z.object({ message: z.union([z.string(), z.array(z.string())]).optional() }).passthrough();

const requestGitHubApi = async <Response>({
  path,
  method = "GET",
  body,
  parse,
}: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  parse: (input: unknown) => Response;
}): Promise<Response> => {
  let httpResponse: globalThis.Response;
  try {
    httpResponse = await fetch(`${EXTENSION_API_BASE_URL}/api/github/${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error("GitHub 설정 서버에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.");
  }

  if (!httpResponse.ok) {
    const errorText = await httpResponse.text();
    let errorBody: unknown;
    try {
      errorBody = errorText ? JSON.parse(errorText) as unknown : undefined;
    } catch {
      errorBody = undefined;
    }
    const parsedError = errorBodySchema.safeParse(errorBody);
    const message = parsedError.success ? parsedError.data.message : undefined;
    const errorMessage = Array.isArray(message) ? message.join("; ") : message;
    if (httpResponse.status === 401) {
      throw new Error("GitHub 연결 세션이 만료됐습니다. 다시 연결해 주세요.");
    }
    throw new Error(errorMessage ?? `GitHub 요청이 실패했습니다 (${httpResponse.status}).`);
  }

  if (httpResponse.status === 204) {
    return parse(undefined);
  }
  return parse(await httpResponse.json());
};

export const getGitHubConnection = (): Promise<GitHubConnectionResponse> =>
  requestGitHubApi({
    path: "connection",
    parse: (input) => githubConnectionResponseSchema.parse(input),
  });

export const getGitHubRepositories = (): Promise<GitHubRepository[]> =>
  requestGitHubApi({
    path: "repositories",
    parse: (input) => z.array(githubRepositorySchema).parse(input),
  });

export const saveGitHubSettings = ({
  settings,
}: {
  settings: GitHubRepositorySettings;
}): Promise<GitHubConnectionResponse> =>
  requestGitHubApi({
    path: "settings",
    method: "PUT",
    body: githubRepositorySettingsSchema.parse(settings),
    parse: (input) => githubConnectionResponseSchema.parse(input),
  });

export const disconnectGitHub = async (): Promise<void> =>
  requestGitHubApi({ path: "connection", method: "DELETE", parse: () => undefined });

export const submitGitHubSolution = ({
  payload,
}: {
  payload: SolutionRecordPayload;
}): Promise<SolutionRecordResult> =>
  requestGitHubApi({
    path: "solutions",
    method: "POST",
    body: solutionRecordPayloadSchema.parse(payload),
    parse: (input) => solutionRecordResultSchema.parse(input),
  });

export const getFailedGitHubSolutions = (): Promise<FailedSolutionRecord[]> =>
  requestGitHubApi({
    path: "failed-solutions",
    parse: (input) => z.array(failedSolutionRecordSchema).parse(input),
  });

export const retryGitHubSolution = ({
  submissionId,
}: {
  submissionId: string;
}): Promise<SolutionRecordResult> =>
  requestGitHubApi({
    path: `solutions/${encodeURIComponent(submissionId)}/retry`,
    method: "POST",
    parse: (input) => solutionRecordResultSchema.parse(input),
  });
