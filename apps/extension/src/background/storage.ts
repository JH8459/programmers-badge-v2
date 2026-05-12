import { createIdleSyncState, type ExtensionSyncState } from "../shared/sync-state.js";
import { extensionSyncStateSchema } from "./sync-state-schema.js";

const STORAGE_KEY = "programmers-badge:last-sync-state";

export const getStoredSyncState = async (): Promise<ExtensionSyncState> => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const parseResult = extensionSyncStateSchema.safeParse(stored[STORAGE_KEY]);

  return parseResult.success ? parseResult.data : createIdleSyncState();
};

export const setStoredSyncState = async (state: ExtensionSyncState): Promise<void> => {
  await chrome.storage.local.set({
    [STORAGE_KEY]: state,
  });
};
