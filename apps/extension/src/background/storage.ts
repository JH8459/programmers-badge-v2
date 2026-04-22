import { createIdleSyncState, type ExtensionSyncState } from "../shared/sync-state.js";

const STORAGE_KEY = "programmers-badge:last-sync-state";

export const getStoredSyncState = async (): Promise<ExtensionSyncState> => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return (stored[STORAGE_KEY] as ExtensionSyncState | undefined) ?? createIdleSyncState();
};

export const setStoredSyncState = async (state: ExtensionSyncState): Promise<void> => {
  await chrome.storage.local.set({
    [STORAGE_KEY]: state,
  });
};
