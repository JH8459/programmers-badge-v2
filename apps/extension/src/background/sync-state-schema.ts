import { badgeSyncResponseSchema } from "@programmers-badge/shared-types";
import { z } from "zod";

import type { ExtensionSyncState } from "../shared/sync-state.js";

const legacyBadgeSyncResponseSchema = z
  .object({
    ...badgeSyncResponseSchema.shape,
    programmerHandle: z.string().optional(),
  })
  .passthrough();

export const extensionSyncStateSchema = z
  .object({
    status: z.enum([
      "idle",
      "syncing",
      "success",
      "needs-programmers-page",
      "not-logged-in",
      "error",
    ]),
    message: z.string(),
    lastSync: legacyBadgeSyncResponseSchema.nullable(),
    legacyProgrammerHandle: z.string().optional(),
  })
  .passthrough()
  .transform(({ status, message, lastSync, legacyProgrammerHandle }) => {
    const { programmerHandle, ...response } = lastSync ?? {};
    const normalizedLastSync = lastSync ? badgeSyncResponseSchema.parse(response) : null;
    const migratedHandle = legacyProgrammerHandle ?? programmerHandle;

    return {
      status,
      message,
      lastSync: normalizedLastSync,
      ...(migratedHandle ? { legacyProgrammerHandle: migratedHandle } : {}),
    };
  });

export const parseExtensionSyncState = (input: unknown): ExtensionSyncState =>
  extensionSyncStateSchema.parse(input);
