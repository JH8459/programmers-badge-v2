import { Body, Controller, Post } from "@nestjs/common";

import {
  badgeSyncPayloadSchema,
  type BadgeSyncPayload,
  type BadgeSyncResponse,
} from "@programmers-badge/shared-types";

import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SyncService } from "./sync.service";

@Controller("sync")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  syncBadge(
    @Body(new ZodValidationPipe(badgeSyncPayloadSchema)) payload: BadgeSyncPayload
  ): BadgeSyncResponse {
    return this.syncService.syncBadge(payload);
  }
}
