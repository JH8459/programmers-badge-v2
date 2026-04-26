import { Injectable } from "@nestjs/common";

import type { BadgeSyncResponse } from "@programmers-badge/shared-types";

import { BadgeAssetService } from "../badge/badge-asset.service";
import { buildBadgeSyncResponse } from "../badge/public-badge-response";
import { BadgeProfileRepository } from "../persistence/badge-profile.repository";
import { SyncBadgeDto } from "./dto/sync-badge.dto";

@Injectable()
export class SyncService {
  constructor(
    private readonly badgeProfileRepository: BadgeProfileRepository,
    private readonly badgeAssetService: BadgeAssetService
  ) {}

  syncBadge(payload: SyncBadgeDto): BadgeSyncResponse {
    const normalizedPayload: SyncBadgeDto = {
      ...payload,
      programmerHandle: payload.programmerHandle.trim(),
      displayName: payload.displayName.trim(),
    };

    const record = this.badgeProfileRepository.upsert(normalizedPayload);
    this.badgeAssetService.writePublicBadge(record);

    return buildBadgeSyncResponse(record);
  }
}
