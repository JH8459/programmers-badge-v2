import { z } from "zod";

import {
  createIdleSyncState,
  DEFAULT_EXTENSION_SETTINGS,
  type ExtensionSettings,
  type ExtensionSyncState,
} from "../shared/sync-state.js";
import { extensionSyncStateSchema } from "./sync-state-schema.js";

const STORAGE_KEY = "programmers-badge:last-sync-state";
const SETTINGS_STORAGE_KEY = "programmers-badge:settings";

const extensionSettingsSchema = z.strictObject({
  autoSyncEnabled: z.boolean(),
});

export const getStoredSyncState = async (): Promise<ExtensionSyncState> => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const parseResult = extensionSyncStateSchema.safeParse(stored[STORAGE_KEY]);

  return parseResult.success ? parseResult.data : createIdleSyncState();
};

export const setStoredSyncState = async (state: ExtensionSyncState): Promise<void> => {
  const { legacyProgrammerHandle, ...stateWithoutLegacyHandle } = state;
  const storedState = legacyProgrammerHandle
    ? { ...stateWithoutLegacyHandle, legacyProgrammerHandle }
    : stateWithoutLegacyHandle;

  await chrome.storage.local.set({
    [STORAGE_KEY]: storedState,
  });
};

export const getExtensionSettings = async (): Promise<ExtensionSettings> => {
  const stored = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  const parseResult = extensionSettingsSchema.safeParse(stored[SETTINGS_STORAGE_KEY]);

  return parseResult.success ? parseResult.data : DEFAULT_EXTENSION_SETTINGS;
};

export const setAutoSyncEnabled = async ({
  enabled,
}: {
  enabled: boolean;
}): Promise<ExtensionSettings> => {
  const settings = { autoSyncEnabled: enabled };

  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: settings,
  });

  return settings;
};
