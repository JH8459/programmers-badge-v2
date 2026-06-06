import { Inject, Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";

import type { BadgeSyncPayload, BadgeSyncResponse } from "@programmers-badge/shared-types";

import { SyncBadgeCommand } from "../../command/sync-badge.command";
import { buildBadgeSyncResponse } from "../../response/public-badge-response";
import { BadgeAssetService } from "../../../infra/badge-asset.service";
import type { BadgeProfileRecord } from "../../../infra/badge-profile.repository";

@Injectable()
export class SyncBadgeUseCase {
  constructor(
    @Inject(CommandBus)
    private readonly commandBus: CommandBus,
    @Inject(BadgeAssetService)
    private readonly badgeAssetService: BadgeAssetService
  ) {}

  async execute({ payload }: SyncBadgeUseCaseProps): Promise<BadgeSyncResponse> {
    const record = await this.commandBus.execute<SyncBadgeCommand, BadgeProfileRecord>(
      new SyncBadgeCommand({ payload })
    );

    this.badgeAssetService.writePublicBadge({ record });
    this.badgeAssetService.writePublicBadge({ record, variant: "mini" });

    return buildBadgeSyncResponse(record);
  }
}

interface SyncBadgeUseCaseProps {
  readonly payload: BadgeSyncPayload;
}
