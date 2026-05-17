import { Module } from "@nestjs/common";

import { BadgeModule } from "./badge/badge.module";
import { HealthModule } from "./health/health.module";
import { SyncModule } from "./sync/sync.module";

@Module({
  imports: [HealthModule, BadgeModule, SyncModule],
})
export class AppModule {}
