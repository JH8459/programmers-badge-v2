import { Module } from "@nestjs/common";

import { readApiRuntimeConfig } from "../common/runtime-config";
import { BadgeProfileRepository } from "./badge-profile.repository";
import { DatabaseService, DATABASE_PATH_TOKEN } from "./database.service";

@Module({
  providers: [
    {
      provide: DATABASE_PATH_TOKEN,
      useFactory: () => readApiRuntimeConfig().databasePath,
    },
    DatabaseService,
    BadgeProfileRepository,
  ],
  exports: [DatabaseService, BadgeProfileRepository],
})
export class PersistenceModule {}
