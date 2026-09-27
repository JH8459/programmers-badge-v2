import type { GitHubConnectionResponse } from "@programmers-badge/shared-types";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_EXTENSION_SETTINGS, createIdleSyncState } from "../src/shared/sync-state";
import { loadPopupInitialData } from "../src/popup/initialize";

const connection: GitHubConnectionResponse = {
  connected: true,
  accountLogin: "octocat",
  installationId: 17,
  settings: null,
};

describe("loadPopupInitialData", () => {
  it("preserves badge state and settings when only GitHub status lookup fails", async () => {
    const syncState = { ...createIdleSyncState(), status: "success" as const, message: "마지막 동기화 완료" };
    const settings = { autoSyncEnabled: false };

    await expect(
      loadPopupInitialData({
        initialSyncState: createIdleSyncState(),
        initialSettings: DEFAULT_EXTENSION_SETTINGS,
        initialGitHubConnection: { connected: false, accountLogin: null, installationId: null, settings: null },
        getSyncState: vi.fn().mockResolvedValue(syncState),
        getSettings: vi.fn().mockResolvedValue(settings),
        getGitHubConnection: vi.fn().mockRejectedValue(new Error("API offline")),
      })
    ).resolves.toEqual({
      syncState,
      settings,
      githubConnection: { connected: false, accountLogin: null, installationId: null, settings: null },
      githubStatusMessage: "API offline",
    });
  });

  it("loads successful popup data even if another independent lookup fails", async () => {
    const initialSyncState = createIdleSyncState();

    await expect(
      loadPopupInitialData({
        initialSyncState,
        initialSettings: DEFAULT_EXTENSION_SETTINGS,
        initialGitHubConnection: { connected: false, accountLogin: null, installationId: null, settings: null },
        getSyncState: vi.fn().mockRejectedValue(new Error("Storage unavailable")),
        getSettings: vi.fn().mockResolvedValue({ autoSyncEnabled: false }),
        getGitHubConnection: vi.fn().mockResolvedValue(connection),
      })
    ).resolves.toEqual({
      syncState: initialSyncState,
      settings: { autoSyncEnabled: false },
      githubConnection: connection,
      githubStatusMessage: "",
    });
  });
});
