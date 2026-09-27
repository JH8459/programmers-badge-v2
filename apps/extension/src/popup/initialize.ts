import type { GitHubConnectionResponse } from "@programmers-badge/shared-types";

import type {
  ExtensionSettings,
  ExtensionSyncState,
} from "../shared/sync-state.js";

interface LoadPopupInitialDataInput {
  initialSyncState: ExtensionSyncState;
  initialSettings: ExtensionSettings;
  initialGitHubConnection: GitHubConnectionResponse;
  getSyncState(): Promise<ExtensionSyncState>;
  getSettings(): Promise<ExtensionSettings>;
  getGitHubConnection(): Promise<GitHubConnectionResponse>;
}

export interface PopupInitialData {
  syncState: ExtensionSyncState;
  settings: ExtensionSettings;
  githubConnection: GitHubConnectionResponse;
  githubStatusMessage: string;
}

export const loadPopupInitialData = async ({
  initialSyncState,
  initialSettings,
  initialGitHubConnection,
  getSyncState,
  getSettings,
  getGitHubConnection,
}: LoadPopupInitialDataInput): Promise<PopupInitialData> => {
  const [syncStateResult, settingsResult, connectionResult] = await Promise.allSettled([
    getSyncState(),
    getSettings(),
    getGitHubConnection(),
  ]);

  let githubStatusMessage = "";
  if (connectionResult.status === "rejected") {
    githubStatusMessage =
      connectionResult.reason instanceof Error
        ? connectionResult.reason.message
        : "GitHub 연결 상태를 읽지 못했습니다.";
  }

  return {
    syncState: syncStateResult.status === "fulfilled" ? syncStateResult.value : initialSyncState,
    settings: settingsResult.status === "fulfilled" ? settingsResult.value : initialSettings,
    githubConnection:
      connectionResult.status === "fulfilled" ? connectionResult.value : initialGitHubConnection,
    githubStatusMessage,
  };
};
