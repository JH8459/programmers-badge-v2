import type {
  AutoSyncTriggerMessage,
  ExtensionMessage,
  ExtensionSyncState,
} from "../shared/sync-state.js";
import {
  createAutoSyncDeduper,
  createIdleSyncState,
  performSyncForActiveTab,
  performSyncForTab,
} from "./sync-runtime.js";
import { getStoredSyncState, setStoredSyncState } from "./storage.js";

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
  operation: () => Promise<ExtensionSyncState>
): Promise<ExtensionSyncState> => {
  const syncingState = createSyncingState();
  await setStoredSyncState(syncingState);

  const nextState = await operation();
  await setStoredSyncState(nextState);
  return nextState;
};

const getAutoSyncTabId = (
  message: AutoSyncTriggerMessage,
  sender: chrome.runtime.MessageSender
): number | null => message.tabId ?? sender.tab?.id ?? null;

const handleMessage = async (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<ExtensionSyncState> => {
  if (message.type === "get-sync-state") {
    return getStoredSyncState();
  }

  if (message.type === "start-sync") {
    return runSync(() => performSyncForActiveTab());
  }

  const tabId = getAutoSyncTabId(message, sender);

  if (!tabId) {
    const nextState: ExtensionSyncState = {
      status: "needs-programmers-page",
      message: "자동 동기화를 실행할 Programmers 탭을 확인하지 못했습니다.",
      lastSync: null,
    };

    await setStoredSyncState(nextState);
    return nextState;
  }

  if (!autoSyncDeduper.shouldProcess({ tabId, fingerprint: message.fingerprint })) {
    return createIdleSyncState();
  }

  return runSync(() => performSyncForTab(tabId));
};

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  void handleMessage(message, _sender)
    .then(sendResponse)
    .catch((error) => {
      const fallbackState: ExtensionSyncState = {
        status: "error",
        message:
          error instanceof Error ? error.message : "Extension sync 처리 중 오류가 발생했습니다.",
        lastSync: null,
      };

      void setStoredSyncState(fallbackState).then(() => sendResponse(fallbackState));
    });

  return true;
});
