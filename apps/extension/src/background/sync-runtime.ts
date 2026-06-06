import { z } from "zod";

import { createNonEmptyArraySchema, definedValueSchema } from "@programmers-badge/shared-types";

import { parseProgrammersRecord, toBadgeSyncPayload, type ProgrammersRecord } from "../shared/programmers-record.js";
import { createIdleSyncState, type ExtensionSyncState } from "../shared/sync-state.js";
import { EXTENSION_API_HOST, syncBadgePayload } from "./api-client.js";

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

type InjectedCollectionResult =
  | {
      ok: true;
      record: unknown;
    }
  | Extract<CollectionResult, { ok: false }>;

const injectedCollectionResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      record: definedValueSchema,
    })
    .passthrough(),
  z
    .object({
      ok: z.literal(false),
      reason: z.enum(["not-logged-in", "request-failed"]),
      message: z.string().min(1),
    })
    .passthrough(),
]);

const injectedCollectionResultListSchema = createNonEmptyArraySchema(
  z
    .object({
      result: injectedCollectionResultSchema.optional(),
    })
    .passthrough()
);

export interface AutoSyncTrigger {
  tabId: number;
  fingerprint?: string;
}

interface AutoSyncDeduperOptions {
  cooldownMs?: number;
  maxEntries?: number;
  now?: () => number;
}

interface PruneAutoSyncEntriesInput {
  currentTime: number;
}

interface CollectRecordFromTabInput {
  tabId: number;
}

interface PerformSyncForResolvedTabInput {
  tabId: number;
  tabUrl: string | undefined;
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

  const prune = ({ currentTime }: PruneAutoSyncEntriesInput): void => {
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

      prune({ currentTime });

      if (typeof lastTriggeredAt === "number" && currentTime - lastTriggeredAt < cooldownMs) {
        return false;
      }

      lastTriggeredAtByKey.set(key, currentTime);
      prune({ currentTime });
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

const parseInjectedCollectionResult = (input: unknown): InjectedCollectionResult => {
  const parseResult = injectedCollectionResultListSchema.safeParse(input);

  const firstResult = parseResult.success ? parseResult.data.at(0)?.result : undefined;

  if (firstResult) {
    return firstResult;
  }

  return {
    ok: false,
    reason: "request-failed",
    message: "Programmers 기록 수집 결과를 확인하지 못했습니다.",
  };
};

const collectRecordFromTab = async ({
  tabId,
}: CollectRecordFromTabInput): Promise<CollectionResult> => {
  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    args: [PROGRAMMERS_RECORD_URL],
    // 로그인된 Programmers 세션을 재사용하려면 페이지 컨텍스트에서 직접 fetch해야 한다.
    func: async (recordUrl: string): Promise<InjectedCollectionResult> => {
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
          record: await response.json(),
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

  const injectedResult = parseInjectedCollectionResult(injectionResults);

  if (!injectedResult.ok) {
    return injectedResult;
  }

  try {
    // executeScript에 넘긴 함수는 외부 import를 캡처할 수 없어서 raw JSON만 돌려받고 여기서 검증한다.
    return {
      ok: true,
      record: parseProgrammersRecord(injectedResult.record),
    };
  } catch {
    return {
      ok: false,
      reason: "request-failed",
      message: "Programmers 기록 형식을 확인하지 못했습니다.",
    };
  }
};

const performSyncForResolvedTab = async ({
  tabId,
  tabUrl,
}: PerformSyncForResolvedTabInput): Promise<ExtensionSyncState> => {
  if (!isProgrammersUrl(tabUrl)) {
    return createNeedsProgrammersPageState();
  }

  const collected = await collectRecordFromTab({ tabId });

  if (!collected.ok) {
    return {
      status: collected.reason === "not-logged-in" ? "not-logged-in" : "error",
      message: collected.message,
      lastSync: null,
    };
  }

  try {
    const payload = toBadgeSyncPayload({ input: collected.record });
    const syncResponse = await syncBadgePayload(payload);

    return {
      status: "success",
      message: `${syncResponse.displayName} 데이터가 ${EXTENSION_API_HOST}으로 동기화되었습니다.`,
      lastSync: syncResponse,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : `${EXTENSION_API_HOST} API로 동기화하지 못했습니다.`,
      lastSync: null,
    };
  }
};

export const performSyncForTab = async (tabId: number): Promise<ExtensionSyncState> => {
  const tab = await chrome.tabs.get(tabId);

  if (!tab.id) {
    return createNeedsProgrammersPageState();
  }

  return performSyncForResolvedTab({ tabId: tab.id, tabUrl: tab.url });
};

export const performSyncForActiveTab = async (): Promise<ExtensionSyncState> => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab?.id) {
    return createNeedsProgrammersPageState();
  }

  return performSyncForResolvedTab({ tabId: activeTab.id, tabUrl: activeTab.url });
};

export { createIdleSyncState };
