import { Module } from "@nestjs/common";

import { BadgeModule } from "../badge/badge.module";
import { PersistenceModule } from "../persistence/persistence.module";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";

@Module({
  imports: [BadgeModule, PersistenceModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
