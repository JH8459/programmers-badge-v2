import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { SyncBadgeCommandHandler } from "./application/command/sync-badge.command";
import { GetPublicBadgeQueryHandler } from "./application/query/get-public-badge.query";
import { GetPublicBadgeUseCase } from "./application/use-case/http/get-public-badge.use-case";
import { SyncBadgeUseCase } from "./application/use-case/http/sync-badge.use-case";
import { BadgeAssetService } from "./infra/badge-asset.service";
import { BadgePersistenceModule } from "./infra/badge-persistence.module";
import { BadgeHttpController } from "./presenter/http/badge.http.controller";
import { SyncHttpController } from "./presenter/http/sync.http.controller";

@Module({
  imports: [CqrsModule, BadgePersistenceModule],
  controllers: [BadgeHttpController, SyncHttpController],
  providers: [
    /** Use Cases */
    GetPublicBadgeUseCase,
    SyncBadgeUseCase,

    /** Query Handlers */
    GetPublicBadgeQueryHandler,

    /** Command Handlers */
    SyncBadgeCommandHandler,

    /** Infra */
    BadgeAssetService,
  ],
  exports: [BadgePersistenceModule],
})
export class BadgeModule {}
