import { Module } from "@nestjs/common";

import { BadgePersistenceModule } from "../badge/infra/badge-persistence.module";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  imports: [BadgePersistenceModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
