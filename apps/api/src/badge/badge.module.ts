import { Module } from "@nestjs/common";

import { PersistenceModule } from "../persistence/persistence.module";

import { BadgeAssetService } from "./badge-asset.service";
import { BadgeController } from "./badge.controller";
import { BadgeService } from "./badge.service";

@Module({
  imports: [PersistenceModule],
  controllers: [BadgeController],
  providers: [BadgeAssetService, BadgeService],
  exports: [BadgeAssetService],
})
export class BadgeModule {}
