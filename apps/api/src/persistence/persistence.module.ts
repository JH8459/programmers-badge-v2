import { Module } from "@nestjs/common";

import { BadgeProfileRepository } from "./badge-profile.repository";
import { DatabaseService, DATABASE_PATH_TOKEN } from "./database.service";

@Module({
  providers: [
    {
      provide: DATABASE_PATH_TOKEN,
      useFactory: () => process.env.DATABASE_PATH,
    },
    DatabaseService,
    BadgeProfileRepository,
  ],
  exports: [DatabaseService, BadgeProfileRepository],
})
export class PersistenceModule {}
