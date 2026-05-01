import type { BadgeSyncPayload, BadgeSyncResponse } from "@programmers-badge/shared-types";

export const EXTENSION_API_BASE_URL = "https://programmers-badge.jh8459.com";
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

  return (await response.json()) as BadgeSyncResponse;
};
