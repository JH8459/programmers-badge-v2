import { Module } from "@nestjs/common";

import { BadgeModule } from "./badge/badge.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [HealthModule, BadgeModule],
})
export class AppModule {}
