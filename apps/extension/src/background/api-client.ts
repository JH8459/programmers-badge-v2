import type { BadgeSyncPayload, BadgeSyncResponse } from "@programmers-badge/shared-types";

const LOCAL_API_BASE_URL = "http://localhost:3000";

export const syncBadgePayload = async (payload: BadgeSyncPayload): Promise<BadgeSyncResponse> => {
  const response = await fetch(`${LOCAL_API_BASE_URL}/api/sync`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Local sync failed with ${response.status}.`);
  }

  return (await response.json()) as BadgeSyncResponse;
};
