import type {
  BadgeSyncResponse,
  GitHubRepositorySettings,
  SolutionRecordResult,
} from "@programmers-badge/shared-types";

export type ExtensionSyncStatus =
  | "idle"
  | "syncing"
  | "success"
  | "needs-programmers-page"
  | "not-logged-in"
  | "error";

export interface ExtensionSyncState {
  status: ExtensionSyncStatus;
  message: string;
  lastSync: BadgeSyncResponse | null;
  solutionRecord?: SolutionRecordResult | null;
  legacyProgrammerHandle?: string;
}

export interface ExtensionSettings {
  autoSyncEnabled: boolean;
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  autoSyncEnabled: true,
};

export interface AutoSyncTriggerMessage {
  type: "trigger-solved-submission";
  tabId?: number;
  fingerprint: string;
  resultSummary: string;
}

export type ExtensionMessage =
  | { type: "get-sync-state" }
  | { type: "get-extension-settings" }
  | { type: "set-auto-sync-enabled"; enabled: boolean }
  | { type: "start-sync" }
  | { type: "connect-github" }
  | { type: "get-github-connection" }
  | { type: "get-github-repositories" }
  | { type: "save-github-settings"; settings: GitHubRepositorySettings }
  | { type: "disconnect-github" }
  | { type: "get-failed-github-solutions" }
  | { type: "retry-github-solution"; submissionId: string }
  | AutoSyncTriggerMessage;

export const createIdleSyncState = (): ExtensionSyncState => ({
  status: "idle",
  message: "Programmers 탭에서 동기화를 시작할 수 있습니다.",
  lastSync: null,
});
