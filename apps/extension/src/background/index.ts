import type {
  AutoSyncTriggerMessage,
  ExtensionMessage,
  ExtensionSyncState,
} from "../shared/sync-state.js";
import {
  disconnectGitHub,
  getFailedGitHubSolutions,
  getGitHubConnection,
  getGitHubRepositories,
  retryGitHubSolution,
  saveGitHubSettings,
  submitGitHubSolution,
} from "./github-client.js";
import { captureProgrammersSolution } from "./solution-capture.js";
import { createSolutionRecordPayload } from "../shared/programmers-solution.js";
import {
  createAutoSyncDeduper,
  createIdleSyncState,
  performSyncForActiveTab,
  performSyncForTab,
} from "./sync-runtime.js";
import {
  getExtensionSettings,
  getStoredSyncState,
  setAutoSyncEnabled,
  setStoredSyncState,
} from "./storage.js";

const autoSyncDeduper = createAutoSyncDeduper();
const API_BASE_URL = chrome.runtime
  .getManifest()
  .host_permissions?.find((permission) => /^https?:\/\/[^*]+\/\*$/.test(permission))
  ?.replace(/\/\*$/, "");

const isProgrammersProblemPageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "school.programmers.co.kr" &&
      /^\/learn\/courses\/\d+\/lessons\/\d+(?:\/|$)/.test(parsedUrl.pathname)
    );
  } catch {
    return false;
  }
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("PROGRAMMERS-BADGE-V2 extension installed");
});

const createSyncingState = (): ExtensionSyncState => ({
  ...createIdleSyncState(),
  status: "syncing",
  message: "Programmers 데이터를 수집하고 있습니다.",
});

const runSync = async (
  operation: (legacyProgrammerHandle?: string) => Promise<ExtensionSyncState>
): Promise<ExtensionSyncState> => {
  const previousState = await getStoredSyncState();
  const lastSync = previousState.lastSync;
  const legacyProgrammerHandle = previousState.legacyProgrammerHandle;
  const syncingState = { ...createSyncingState(), lastSync, legacyProgrammerHandle };
  await setStoredSyncState(syncingState);

  const operationState = await operation(legacyProgrammerHandle);
  const nextState = {
    ...operationState,
    lastSync: operationState.lastSync ?? lastSync,
    ...(operationState.status === "success" ? {} : { legacyProgrammerHandle }),
  };
  await setStoredSyncState(nextState);
  return nextState;
};

interface AutoSyncTabIdInput {
  message: AutoSyncTriggerMessage;
  sender: chrome.runtime.MessageSender;
}

interface HandleMessageInput {
  message: ExtensionMessage;
  sender: chrome.runtime.MessageSender;
}

const getAutoSyncTabId = ({ message, sender }: AutoSyncTabIdInput): number | null =>
  message.tabId ?? sender.tab?.id ?? null;

const isExtensionUiSender = (sender: chrome.runtime.MessageSender): boolean =>
  sender.id === chrome.runtime.id && sender.tab === undefined;

const runSolvedSubmission = async ({
  message,
  tabId,
}: {
  message: AutoSyncTriggerMessage;
  tabId: number;
}): Promise<ExtensionSyncState> => {
  const previousState = await getStoredSyncState();
  const settings = await getExtensionSettings();
  let badgeState: ExtensionSyncState;
  if (settings.autoSyncEnabled) {
    try {
      badgeState = await runSync((legacyProgrammerHandle) =>
        performSyncForTab({ tabId, legacyProgrammerHandle })
      );
    } catch (error) {
      badgeState = {
        status: "error",
        message:
          error instanceof Error ? error.message : "배지 동기화를 실행하지 못했습니다.",
        lastSync: previousState.lastSync,
      };
    }
  } else {
    badgeState = {
        status: "idle" as const,
        message: "배지 자동 동기화가 꺼져 있습니다.",
        lastSync: previousState.lastSync,
      };
  }

  let solutionRecord: ExtensionSyncState["solutionRecord"];
  try {
    const connection = await getGitHubConnection();
    if (!connection.connected) {
      return badgeState;
    }
    if (!connection.settings) {
      solutionRecord = {
        submissionId: crypto.randomUUID(),
        status: "skipped",
        message: "GitHub 저장소를 연결하고 기록 경로를 설정해 주세요.",
        commitUrl: null,
      };
    } else {
      const capture = await captureProgrammersSolution({
        tabId,
        resultSummary: message.resultSummary,
      });
      const payload = createSolutionRecordPayload({
        capture,
        submissionId: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
      });
      solutionRecord = await submitGitHubSolution({ payload });
    }
  } catch (error) {
    solutionRecord = {
      submissionId: crypto.randomUUID(),
      status: "failed",
      message: error instanceof Error ? error.message : "GitHub 풀이 기록을 처리하지 못했습니다.",
      commitUrl: null,
    };
  }

  const nextState = {
    ...badgeState,
    solutionRecord,
  };
  await setStoredSyncState(nextState);
  return nextState;
};

const handleMessage = async ({
  message,
  sender,
}: HandleMessageInput): Promise<unknown> => {
  if (message.type === "get-sync-state") {
    return getStoredSyncState();
  }

  if (message.type === "get-extension-settings") {
    return getExtensionSettings();
  }

  if (message.type === "set-auto-sync-enabled") {
    return setAutoSyncEnabled({ enabled: message.enabled });
  }

  if (message.type === "connect-github") {
    if (!isExtensionUiSender(sender) || !API_BASE_URL) {
      throw new Error("확장 프로그램 popup에서 GitHub 연결을 시작해 주세요.");
    }
    await chrome.tabs.create({ url: `${API_BASE_URL.replace(/\/$/, "")}/api/github/connect` });
    return getStoredSyncState();
  }

  if (message.type === "get-github-connection") {
    if (!isExtensionUiSender(sender)) {
      throw new Error("GitHub 연결 설정은 확장 프로그램 popup에서만 확인할 수 있습니다.");
    }
    return getGitHubConnection();
  }

  if (message.type === "get-github-repositories") {
    if (!isExtensionUiSender(sender)) {
      throw new Error("저장소 목록은 확장 프로그램 popup에서만 확인할 수 있습니다.");
    }
    return getGitHubRepositories();
  }

  if (message.type === "save-github-settings") {
    if (!isExtensionUiSender(sender)) {
      throw new Error("GitHub 설정은 확장 프로그램 popup에서만 변경할 수 있습니다.");
    }
    return saveGitHubSettings({ settings: message.settings });
  }

  if (message.type === "disconnect-github") {
    if (!isExtensionUiSender(sender)) {
      throw new Error("GitHub 연결은 확장 프로그램 popup에서만 해제할 수 있습니다.");
    }
    await disconnectGitHub();
    return getGitHubConnection();
  }

  if (message.type === "get-failed-github-solutions") {
    if (!isExtensionUiSender(sender)) {
      throw new Error("실패한 풀이 목록은 확장 프로그램 popup에서만 확인할 수 있습니다.");
    }
    return getFailedGitHubSolutions();
  }

  if (message.type === "retry-github-solution") {
    if (!isExtensionUiSender(sender)) {
      throw new Error("풀이 기록 재시도는 확장 프로그램 popup에서만 실행할 수 있습니다.");
    }
    return retryGitHubSolution({ submissionId: message.submissionId });
  }

  if (message.type === "start-sync") {
    if (!isExtensionUiSender(sender)) {
      throw new Error("수동 동기화는 확장 프로그램 popup에서만 시작할 수 있습니다.");
    }
    return runSync((legacyProgrammerHandle) =>
      performSyncForActiveTab({ legacyProgrammerHandle })
    );
  }

  const tabId = getAutoSyncTabId({ message, sender });
  const senderTab = sender.tab;

  if (
    !tabId ||
    !senderTab ||
    senderTab.id !== tabId ||
    !senderTab.url ||
    !isProgrammersProblemPageUrl(senderTab.url)
  ) {
    const previousState = await getStoredSyncState();
    const nextState: ExtensionSyncState = {
      status: "needs-programmers-page",
      message: "자동 동기화를 실행할 Programmers 탭을 확인하지 못했습니다.",
      lastSync: previousState.lastSync,
      legacyProgrammerHandle: previousState.legacyProgrammerHandle,
    };

    await setStoredSyncState(nextState);
    return nextState;
  }

  if (!autoSyncDeduper.shouldProcess({ tabId, fingerprint: message.fingerprint })) {
    return createIdleSyncState();
  }

  return runSolvedSubmission({ message, tabId });
};

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  void handleMessage({ message, sender: _sender })
    .then(sendResponse)
    .catch((error) => {
      if (isExtensionUiSender(_sender)) {
        sendResponse({
          error:
            error instanceof Error
              ? error.message
              : "확장 프로그램 요청을 처리하지 못했습니다.",
        });
        return;
      }
      const fallbackState: ExtensionSyncState = {
        status: "error",
        message:
          error instanceof Error ? error.message : "Extension sync 처리 중 오류가 발생했습니다.",
        lastSync: null,
      };

      void getStoredSyncState().then((previousState) => {
        const state = {
          ...fallbackState,
          lastSync: previousState.lastSync,
          legacyProgrammerHandle: previousState.legacyProgrammerHandle,
        };
        return setStoredSyncState(state).then(() => sendResponse(state));
      });
    });

  return true;
});
