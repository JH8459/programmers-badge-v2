import type {
  GitHubConnectionResponse,
  SolutionRecordPayload,
} from "@programmers-badge/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProgrammersSolutionCapture } from "../src/shared/programmers-solution";
import type { AutoSyncTriggerMessage, ExtensionSyncState } from "../src/shared/sync-state";
import {
  processSolvedSubmission,
  type SolvedSubmissionFlowDependencies,
} from "../src/background/solution-flow";

const savedState: ExtensionSyncState = {
  status: "success",
  message: "배지 동기화 완료",
  lastSync: null,
};
const message: AutoSyncTriggerMessage = {
  type: "trigger-solved-submission",
  fingerprint: "accepted:42840",
  resultSummary: "정답",
};
const capture: ProgrammersSolutionCapture = {
  problemId: "42840",
  problemName: "모의고사",
  difficulty: "Lv. 1",
  problemUrl: "https://school.programmers.co.kr/learn/courses/30/lessons/42840",
  language: "javascript",
  sourceCode: "function solution() {}",
  resultSummary: "정답",
  performanceSummary: null,
  description: "문제 설명",
  constraints: "제한 사항",
  examplesMarkdown: "예시",
};
const connection: GitHubConnectionResponse = {
  connected: true,
  accountLogin: "octocat",
  installationId: 17,
  settings: {
    repositoryId: 77,
    branch: "main",
    basePath: "solutions",
    repository: {
      id: 77,
      owner: "octocat",
      name: "algorithms",
      fullName: "octocat/algorithms",
      isPrivate: false,
      defaultBranch: "main",
    },
  },
};
const payload: SolutionRecordPayload = {
  ...capture,
  submissionId: "00000000-0000-4000-8000-000000000001",
  submittedAt: "2026-09-27T00:00:00.000Z",
};

const createDependencies = (): SolvedSubmissionFlowDependencies => ({
  getStoredSyncState: vi.fn().mockResolvedValue({ status: "idle", message: "이전 상태", lastSync: null }),
  getExtensionSettings: vi.fn().mockResolvedValue({ autoSyncEnabled: true }),
  setStoredSyncState: vi.fn().mockResolvedValue(undefined),
  runSync: vi.fn(async (operation: (legacyProgrammerHandle?: string) => Promise<ExtensionSyncState>) =>
    operation("legacy-handle")
  ),
  performSyncForTab: vi.fn().mockResolvedValue(savedState),
  getGitHubConnection: vi.fn().mockResolvedValue(connection),
  captureProgrammersSolution: vi.fn().mockResolvedValue(capture),
  createSolutionRecordPayload: vi.fn().mockReturnValue(payload),
  submitGitHubSolution: vi.fn().mockResolvedValue({
    submissionId: payload.submissionId,
    status: "saved",
    message: "GitHub에 저장했습니다.",
    commitUrl: "https://github.com/octocat/algorithms/commit/abc123",
  }),
  createSubmissionId: vi.fn().mockReturnValue(payload.submissionId),
  now: vi.fn().mockReturnValue(payload.submittedAt),
});

describe("processSolvedSubmission", () => {
  let dependencies: SolvedSubmissionFlowDependencies;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  it("does not capture or write a solution when GitHub is disconnected", async () => {
    vi.mocked(dependencies.getGitHubConnection).mockResolvedValue({
      connected: false,
      accountLogin: null,
      installationId: null,
      settings: null,
    });

    await expect(processSolvedSubmission({ message, tabId: 41, dependencies })).resolves.toEqual(savedState);

    expect(dependencies.captureProgrammersSolution).not.toHaveBeenCalled();
    expect(dependencies.submitGitHubSolution).not.toHaveBeenCalled();
    expect(dependencies.setStoredSyncState).not.toHaveBeenCalled();
  });

  it("reports a skipped solution when a connected account has no repository settings", async () => {
    vi.mocked(dependencies.getGitHubConnection).mockResolvedValue({ ...connection, settings: null });

    const nextState = await processSolvedSubmission({ message, tabId: 41, dependencies });

    expect(nextState).toMatchObject({
      status: "success",
      solutionRecord: { status: "skipped", message: "GitHub 저장소를 연결하고 기록 경로를 설정해 주세요." },
    });
    expect(dependencies.captureProgrammersSolution).not.toHaveBeenCalled();
    expect(dependencies.submitGitHubSolution).not.toHaveBeenCalled();
    expect(dependencies.setStoredSyncState).toHaveBeenCalledWith(nextState);
  });

  it("captures and submits the accepted solution when a repository is configured", async () => {
    const nextState = await processSolvedSubmission({ message, tabId: 41, dependencies });

    expect(dependencies.captureProgrammersSolution).toHaveBeenCalledWith({
      tabId: 41,
      resultSummary: "정답",
    });
    expect(dependencies.createSolutionRecordPayload).toHaveBeenCalledWith({
      capture,
      submissionId: payload.submissionId,
      submittedAt: payload.submittedAt,
    });
    expect(dependencies.submitGitHubSolution).toHaveBeenCalledWith({ payload });
    expect(nextState).toMatchObject({ status: "success", solutionRecord: { status: "saved" } });
    expect(dependencies.setStoredSyncState).toHaveBeenCalledWith(nextState);
  });

  it("keeps badge sync successful when GitHub recording fails", async () => {
    vi.mocked(dependencies.submitGitHubSolution).mockRejectedValue(new Error("GitHub unavailable"));

    const nextState = await processSolvedSubmission({ message, tabId: 41, dependencies });

    expect(nextState).toMatchObject({
      status: "success",
      message: "배지 동기화 완료",
      solutionRecord: { status: "failed", message: "GitHub unavailable" },
    });
    expect(dependencies.setStoredSyncState).toHaveBeenCalledWith(nextState);
  });

  it("keeps badge sync successful when source capture fails", async () => {
    vi.mocked(dependencies.captureProgrammersSolution).mockRejectedValue(new Error("편집기 코드를 읽지 못했습니다."));

    const nextState = await processSolvedSubmission({ message, tabId: 41, dependencies });

    expect(dependencies.submitGitHubSolution).not.toHaveBeenCalled();
    expect(nextState).toMatchObject({
      status: "success",
      solutionRecord: { status: "failed", message: "편집기 코드를 읽지 못했습니다." },
    });
    expect(dependencies.setStoredSyncState).toHaveBeenCalledWith(nextState);
  });

  it("still records the solution when badge synchronization fails", async () => {
    vi.mocked(dependencies.runSync).mockRejectedValue(new Error("배지 서버 오류"));

    const nextState = await processSolvedSubmission({ message, tabId: 41, dependencies });

    expect(dependencies.captureProgrammersSolution).toHaveBeenCalled();
    expect(dependencies.submitGitHubSolution).toHaveBeenCalledWith({ payload });
    expect(nextState).toMatchObject({ status: "error", solutionRecord: { status: "saved" } });
    expect(dependencies.setStoredSyncState).toHaveBeenCalledWith(nextState);
  });
});
