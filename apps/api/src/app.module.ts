import { Module } from "@nestjs/common";

import { BadgeModule } from "./badge/badge.module";
import { HealthModule } from "./health/health.module";
import { LegalModule } from "./legal/legal.module";
import { SyncModule } from "./sync/sync.module";

@Module({
  imports: [HealthModule, BadgeModule, SyncModule, LegalModule],
})
export class AppModule {}
