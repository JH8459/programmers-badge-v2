import type {
  GitHubConnectionResponse,
  SolutionRecordPayload,
  SolutionRecordResult,
} from "@programmers-badge/shared-types";

import type { ProgrammersSolutionCapture } from "../shared/programmers-solution.js";
import type {
  AutoSyncTriggerMessage,
  ExtensionSettings,
  ExtensionSyncState,
} from "../shared/sync-state.js";

interface PerformSyncForTabInput {
  tabId: number;
  legacyProgrammerHandle?: string;
}

interface CaptureProgrammersSolutionInput {
  tabId: number;
  resultSummary: string;
}

interface CreateSolutionRecordPayloadInput {
  capture: ProgrammersSolutionCapture;
  submissionId: string;
  submittedAt: string;
}

export interface SolvedSubmissionFlowDependencies {
  getStoredSyncState(): Promise<ExtensionSyncState>;
  getExtensionSettings(): Promise<ExtensionSettings>;
  setStoredSyncState(state: ExtensionSyncState): Promise<void>;
  runSync(
    operation: (legacyProgrammerHandle?: string) => Promise<ExtensionSyncState>
  ): Promise<ExtensionSyncState>;
  performSyncForTab(input: PerformSyncForTabInput): Promise<ExtensionSyncState>;
  getGitHubConnection(): Promise<GitHubConnectionResponse>;
  captureProgrammersSolution(input: CaptureProgrammersSolutionInput): Promise<ProgrammersSolutionCapture>;
  createSolutionRecordPayload(input: CreateSolutionRecordPayloadInput): SolutionRecordPayload;
  submitGitHubSolution(input: { payload: SolutionRecordPayload }): Promise<SolutionRecordResult>;
  createSubmissionId(): string;
  now(): string;
}

interface ProcessSolvedSubmissionInput {
  message: AutoSyncTriggerMessage;
  tabId: number;
  dependencies: SolvedSubmissionFlowDependencies;
}

const createFailedSolutionRecord = (
  submissionId: string,
  error: unknown
): SolutionRecordResult => ({
  submissionId,
  status: "failed",
  message: error instanceof Error ? error.message : "GitHub 풀이 기록을 처리하지 못했습니다.",
  commitUrl: null,
});

export const processSolvedSubmission = async ({
  message,
  tabId,
  dependencies,
}: ProcessSolvedSubmissionInput): Promise<ExtensionSyncState> => {
  const previousState = await dependencies.getStoredSyncState();
  const settings = await dependencies.getExtensionSettings();
  let badgeState: ExtensionSyncState;
  if (settings.autoSyncEnabled) {
    try {
      badgeState = await dependencies.runSync((legacyProgrammerHandle) =>
        dependencies.performSyncForTab({ tabId, legacyProgrammerHandle })
      );
    } catch (error) {
      badgeState = {
        status: "error",
        message: error instanceof Error ? error.message : "배지 동기화를 실행하지 못했습니다.",
        lastSync: previousState.lastSync,
      };
    }
  } else {
    badgeState = {
      status: "idle",
      message: "배지 자동 동기화가 꺼져 있습니다.",
      lastSync: previousState.lastSync,
    };
  }

  let solutionRecord: ExtensionSyncState["solutionRecord"];
  try {
    const connection = await dependencies.getGitHubConnection();
    if (!connection.connected) {
      return badgeState;
    }
    if (!connection.settings) {
      solutionRecord = {
        submissionId: dependencies.createSubmissionId(),
        status: "skipped",
        message: "GitHub 저장소를 연결하고 기록 경로를 설정해 주세요.",
        commitUrl: null,
      };
    } else {
      const capture = await dependencies.captureProgrammersSolution({
        tabId,
        resultSummary: message.resultSummary,
      });
      const payload = dependencies.createSolutionRecordPayload({
        capture,
        submissionId: dependencies.createSubmissionId(),
        submittedAt: dependencies.now(),
      });
      solutionRecord = await dependencies.submitGitHubSolution({ payload });
    }
  } catch (error) {
    solutionRecord = createFailedSolutionRecord(dependencies.createSubmissionId(), error);
  }

  const nextState = {
    ...badgeState,
    solutionRecord,
  };
  await dependencies.setStoredSyncState(nextState);
  return nextState;
};
