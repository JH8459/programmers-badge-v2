import { Body, Controller, Post } from "@nestjs/common";

import {
  badgeSyncPayloadSchema,
  type BadgeSyncPayload,
  type BadgeSyncResponse,
} from "@programmers-badge/shared-types";

import { ZodValidationPipe } from "../../../common/zod-validation.pipe";
import { SyncBadgeUseCase } from "../../application/use-case/http/sync-badge.use-case";

@Controller("sync")
export class SyncHttpController {
  constructor(private readonly syncBadgeUseCase: SyncBadgeUseCase) {}

  @Post()
  syncBadge(
    @Body(new ZodValidationPipe(badgeSyncPayloadSchema)) payload: BadgeSyncPayload
  ): Promise<BadgeSyncResponse> {
    return this.syncBadgeUseCase.execute({ payload });
  }
}
