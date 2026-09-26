import type {
  AutoSyncTriggerMessage,
  ExtensionMessage,
  ExtensionSettings,
  ExtensionSyncState,
} from "../shared/sync-state.js";
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

const handleMessage = async ({
  message,
  sender,
}: HandleMessageInput): Promise<ExtensionSyncState | ExtensionSettings> => {
  if (message.type === "get-sync-state") {
    return getStoredSyncState();
  }

  if (message.type === "get-extension-settings") {
    return getExtensionSettings();
  }

  if (message.type === "set-auto-sync-enabled") {
    return setAutoSyncEnabled({ enabled: message.enabled });
  }

  if (message.type === "start-sync") {
    return runSync((legacyProgrammerHandle) =>
      performSyncForActiveTab({ legacyProgrammerHandle })
    );
  }

  const settings = await getExtensionSettings();

  if (!settings.autoSyncEnabled) {
    const previousState = await getStoredSyncState();
    return {
      status: "idle",
      message: "자동 동기화가 꺼져 있습니다.",
      lastSync: previousState.lastSync,
    };
  }

  const tabId = getAutoSyncTabId({ message, sender });

  if (!tabId) {
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

  return runSync((legacyProgrammerHandle) =>
    performSyncForTab({ tabId, legacyProgrammerHandle })
  );
};

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  void handleMessage({ message, sender: _sender })
    .then(sendResponse)
    .catch((error) => {
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
