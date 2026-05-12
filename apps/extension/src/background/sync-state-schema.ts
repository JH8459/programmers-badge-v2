import { badgeSyncResponseSchema } from "@programmers-badge/shared-types";
import { z } from "zod";

import type { ExtensionSyncState } from "../shared/sync-state.js";

export const extensionSyncStateSchema = z.strictObject({
  status: z.enum(["idle", "syncing", "success", "needs-programmers-page", "not-logged-in", "error"]),
  message: z.string(),
  lastSync: badgeSyncResponseSchema.nullable(),
});

export const parseExtensionSyncState = (input: unknown): ExtensionSyncState =>
  extensionSyncStateSchema.parse(input);
