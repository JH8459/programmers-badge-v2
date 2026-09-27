import { Module } from "@nestjs/common";

import { BadgeModule } from "./badge/badge.module";
import { HealthModule } from "./health/health.module";
import { GitHubModule } from "./github/github.module";

@Module({
  imports: [HealthModule, BadgeModule, GitHubModule],
})
export class AppModule {}
