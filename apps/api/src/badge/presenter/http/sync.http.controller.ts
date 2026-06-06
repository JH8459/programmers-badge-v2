import { Body, Controller, Inject, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import {
  badgeSyncPayloadSchema,
  type BadgeSyncPayload,
  type BadgeSyncResponse,
} from "@programmers-badge/shared-types";

import { ErrorResponseDto } from "../../../common/http/error-response.dto";
import { ZodValidationPipe } from "../../../common/zod-validation.pipe";
import { SyncBadgeUseCase } from "../../application/use-case/http/sync-badge.use-case";

import { BadgeSyncRequestDto, BadgeSyncResponseDto } from "./badge-sync.dto";

@ApiTags("Badge")
@Controller("sync")
export class SyncHttpController {
  constructor(@Inject(SyncBadgeUseCase) private readonly syncBadgeUseCase: SyncBadgeUseCase) {}

  @Post()
  @ApiOperation({ summary: "Sync a Programmers badge profile snapshot." })
  @ApiBody({ type: BadgeSyncRequestDto })
  @ApiCreatedResponse({
    type: BadgeSyncResponseDto,
    description: "Badge snapshot is saved and public badge URLs are returned.",
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: "Request body does not satisfy the shared sync contract.",
  })
  syncBadge(
    @Body(new ZodValidationPipe(badgeSyncPayloadSchema)) payload: BadgeSyncPayload
  ): Promise<BadgeSyncResponse> {
    return this.syncBadgeUseCase.execute({ payload });
  }
}
