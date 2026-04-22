import type { BadgeSyncResponse } from "@programmers-badge/shared-types";

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
}

export interface AutoSyncTriggerMessage {
  type: "trigger-auto-sync";
  tabId?: number;
  fingerprint?: string;
}

export type ExtensionMessage =
  | { type: "get-sync-state" }
  | { type: "start-sync" }
  | AutoSyncTriggerMessage;

export const createIdleSyncState = (): ExtensionSyncState => ({
  status: "idle",
  message: "Programmers 탭에서 동기화를 시작할 수 있습니다.",
  lastSync: null,
});
