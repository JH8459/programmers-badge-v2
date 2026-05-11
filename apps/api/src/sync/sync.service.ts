import { Injectable } from "@nestjs/common";

import {
  parseBadgeSyncPayload,
  type BadgeSyncPayload,
  type BadgeSyncResponse,
} from "@programmers-badge/shared-types";

import { BadgeAssetService } from "../badge/badge-asset.service";
import { buildBadgeSyncResponse } from "../badge/public-badge-response";
import { BadgeProfileRepository } from "../persistence/badge-profile.repository";

@Injectable()
export class SyncService {
  constructor(
    private readonly badgeProfileRepository: BadgeProfileRepository,
    private readonly badgeAssetService: BadgeAssetService
  ) {}

  syncBadge(payload: BadgeSyncPayload): BadgeSyncResponse {
    const normalizedPayload = parseBadgeSyncPayload(payload);

    const record = this.badgeProfileRepository.upsert(normalizedPayload);
    this.badgeAssetService.writePublicBadge(record);
    this.badgeAssetService.writePublicBadge(record, "mini");

    return buildBadgeSyncResponse(record);
  }
}
