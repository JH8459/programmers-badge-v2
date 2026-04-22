import { toBadgeSyncPayload, type ProgrammersRecord } from "../shared/programmers-record.js";
import { createIdleSyncState, type ExtensionSyncState } from "../shared/sync-state.js";
import { syncBadgePayload } from "./api-client.js";

const PROGRAMMERS_HOST = "programmers.co.kr";
const PROGRAMMERS_RECORD_URL = `https://${PROGRAMMERS_HOST}/api/v1/users/record`;
const DEFAULT_AUTO_SYNC_COOLDOWN_MS = 15_000;
const DEFAULT_AUTO_SYNC_MAX_ENTRIES = 128;

type CollectionResult =
  | {
      ok: true;
      record: ProgrammersRecord;
    }
  | {
      ok: false;
      reason: "not-logged-in" | "request-failed";
      message: string;
    };

export interface AutoSyncTrigger {
  tabId: number;
  fingerprint?: string;
}

interface AutoSyncDeduperOptions {
  cooldownMs?: number;
  maxEntries?: number;
  now?: () => number;
}

export interface AutoSyncDeduper {
  shouldProcess(trigger: AutoSyncTrigger): boolean;
}

const createNeedsProgrammersPageState = (): ExtensionSyncState => ({
  status: "needs-programmers-page",
  message: "Programmers 문제 페이지 또는 프로필 페이지를 연 뒤 다시 시도해주세요.",
  lastSync: null,
});

const getAutoSyncDeduplicationKey = (trigger: AutoSyncTrigger): string => {
  const fingerprint = trigger.fingerprint?.trim();

  if (fingerprint) {
    return `fingerprint:${fingerprint}`;
  }

  return `tab:${trigger.tabId}`;
};

export const createAutoSyncDeduper = (options: AutoSyncDeduperOptions = {}): AutoSyncDeduper => {
  const cooldownMs = options.cooldownMs ?? DEFAULT_AUTO_SYNC_COOLDOWN_MS;
  const maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_AUTO_SYNC_MAX_ENTRIES);
  const now = options.now ?? (() => Date.now());
  const lastTriggeredAtByKey = new Map<string, number>();

  const prune = (currentTime: number): void => {
    for (const [key, lastTriggeredAt] of lastTriggeredAtByKey) {
      if (currentTime - lastTriggeredAt >= cooldownMs) {
        lastTriggeredAtByKey.delete(key);
      }
    }

    while (lastTriggeredAtByKey.size > maxEntries) {
      const oldestKey = lastTriggeredAtByKey.keys().next().value;

      if (!oldestKey) {
        break;
      }

      lastTriggeredAtByKey.delete(oldestKey);
    }
  };

  return {
    shouldProcess(trigger) {
      const currentTime = now();
      const key = getAutoSyncDeduplicationKey(trigger);
      const lastTriggeredAt = lastTriggeredAtByKey.get(key);

      prune(currentTime);

      if (typeof lastTriggeredAt === "number" && currentTime - lastTriggeredAt < cooldownMs) {
        return false;
      }

      lastTriggeredAtByKey.set(key, currentTime);
      prune(currentTime);
      return true;
    },
  };
};

const isProgrammersUrl = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === PROGRAMMERS_HOST || parsedUrl.hostname.endsWith(`.${PROGRAMMERS_HOST}`)
    );
  } catch {
    return false;
  }
};

const collectRecordFromTab = async (tabId: number): Promise<CollectionResult> => {
  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [PROGRAMMERS_RECORD_URL],
    func: async (recordUrl: string): Promise<CollectionResult> => {
      try {
        const response = await fetch(recordUrl, {
          credentials: "include",
          headers: {
            accept: "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          return {
            ok: false,
            reason: "not-logged-in",
            message: "Programmers 로그인 상태를 확인해주세요.",
          };
        }

        if (!response.ok) {
          return {
            ok: false,
            reason: "request-failed",
            message: `Programmers 기록 조회가 실패했습니다 (${response.status}).`,
          };
        }

        return {
          ok: true,
          record: (await response.json()) as ProgrammersRecord,
        };
      } catch (error) {
        return {
          ok: false,
          reason: "request-failed",
          message:
            error instanceof Error ? error.message : "Programmers 기록을 불러오지 못했습니다.",
        };
      }
    },
  });

  return (
    (injectionResults[0]?.result as CollectionResult | undefined) ?? {
      ok: false,
      reason: "request-failed",
      message: "Programmers 기록 수집 결과를 확인하지 못했습니다.",
    }
  );
};

const performSyncForResolvedTab = async (
  tabId: number,
  tabUrl: string | undefined
): Promise<ExtensionSyncState> => {
  if (!isProgrammersUrl(tabUrl)) {
    return createNeedsProgrammersPageState();
  }

  const collected = await collectRecordFromTab(tabId);

  if (!collected.ok) {
    return {
      status: collected.reason === "not-logged-in" ? "not-logged-in" : "error",
      message: collected.message,
      lastSync: null,
    };
  }

  try {
    const payload = toBadgeSyncPayload(collected.record);
    const syncResponse = await syncBadgePayload(payload);

    return {
      status: "success",
      message: `${syncResponse.displayName} 데이터가 localhost:3000으로 동기화되었습니다.`,
      lastSync: syncResponse,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "localhost API로 동기화하지 못했습니다.",
      lastSync: null,
    };
  }
};

export const performSyncForTab = async (tabId: number): Promise<ExtensionSyncState> => {
  const tab = await chrome.tabs.get(tabId);

  if (!tab.id) {
    return createNeedsProgrammersPageState();
  }

  return performSyncForResolvedTab(tab.id, tab.url);
};

export const performSyncForActiveTab = async (): Promise<ExtensionSyncState> => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab?.id) {
    return createNeedsProgrammersPageState();
  }

  return performSyncForResolvedTab(activeTab.id, activeTab.url);
};

export { createIdleSyncState };
