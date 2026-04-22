import { Module } from "@nestjs/common";

import { PersistenceModule } from "../persistence/persistence.module";

import { BadgeController } from "./badge.controller";
import { BadgeService } from "./badge.service";

@Module({
  imports: [PersistenceModule],
  controllers: [BadgeController],
  providers: [BadgeService],
})
export class BadgeModule {}
