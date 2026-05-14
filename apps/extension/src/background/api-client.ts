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

export const syncBadgePayload = async (payload: BadgeSyncPayload): Promise<BadgeSyncResponse> => {
  const response = await fetch(`${EXTENSION_API_BASE_URL}/api/sync`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Hosted sync failed with ${response.status}.`);
  }

  return parseBadgeSyncResponse(await response.json());
};
