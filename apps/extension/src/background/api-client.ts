import {
  parseBadgeSyncResponse,
  type BadgeSyncPayload,
  type BadgeSyncResponse,
} from "@programmers-badge/shared-types";

const DEFAULT_EXTENSION_API_BASE_URL = "https://api.programmers-badge.jh8459.com";

const isOriginHostPermission = (value: string): boolean => /^https?:\/\/[^*]+\/\*$/.test(value);

const resolveExtensionApiBaseUrl = (): string => {
  // manifest 권한에서 API origin을 읽어야 런타임 URL과 permission 설정이 어긋나지 않는다.
  const hostPermissions = globalThis.chrome?.runtime?.getManifest?.().host_permissions;
  const apiHostPermission = hostPermissions?.find(isOriginHostPermission);

  if (!apiHostPermission) {
    return DEFAULT_EXTENSION_API_BASE_URL;
  }

  return apiHostPermission.replace(/\/\*$/, "").replace(/\/$/, "");
};

export const EXTENSION_API_BASE_URL = resolveExtensionApiBaseUrl();
export const EXTENSION_API_HOST = new URL(EXTENSION_API_BASE_URL).host;

const MAX_SYNC_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 429]);

const delay = async ({ delayMs }: { delayMs: number }): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const getRetryAfterDelay = (response: Response): number | null => {
  const retryAfter = response.headers.get("retry-after");

  if (retryAfter === null) {
    return null;
  }

  const retryAfterSeconds = Number(retryAfter);

  if (Number.isFinite(retryAfterSeconds)) {
    return Math.min(Math.max(0, retryAfterSeconds * 1000), 2_000);
  }

  const retryAt = Date.parse(retryAfter);

  return Number.isFinite(retryAt) ? Math.min(Math.max(0, retryAt - Date.now()), 2_000) : null;
};

const isRetryableStatus = (status: number): boolean =>
  RETRYABLE_STATUS_CODES.has(status) || status >= 500;

export const syncBadgePayload = async (payload: BadgeSyncPayload): Promise<BadgeSyncResponse> => {
  for (let attempt = 0; attempt < MAX_SYNC_ATTEMPTS; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(`${EXTENSION_API_BASE_URL}/api/sync`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      if (attempt === MAX_SYNC_ATTEMPTS - 1) {
        throw new Error("배지 서버에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.");
      }

      await delay({ delayMs: 250 * 2 ** attempt });
      continue;
    }

    if (response.ok) {
      return parseBadgeSyncResponse(await response.json());
    }

    const errorText = await response.text();

    if (!isRetryableStatus(response.status) || attempt === MAX_SYNC_ATTEMPTS - 1) {
      if (response.status === 429) {
        throw new Error("동기화 요청이 많습니다. 잠시 후 다시 시도해주세요.");
      }

      if (response.status >= 500 || response.status === 408) {
        throw new Error("배지 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.");
      }

      throw new Error(errorText || `Hosted sync failed with ${response.status}.`);
    }

    await delay({ delayMs: getRetryAfterDelay(response) ?? 250 * 2 ** attempt });
  }

  throw new Error("배지 서버에 동기화하지 못했습니다. 잠시 후 다시 시도해주세요.");
};
