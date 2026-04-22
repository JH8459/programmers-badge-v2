import { Body, Controller, Post } from "@nestjs/common";

import type { BadgeSyncResponse } from "@programmers-badge/shared-types";

import { SyncBadgeDto } from "./dto/sync-badge.dto";
import { SyncService } from "./sync.service";

@Controller("sync")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  syncBadge(@Body() payload: SyncBadgeDto): BadgeSyncResponse {
    return this.syncService.syncBadge(payload);
  }
}
