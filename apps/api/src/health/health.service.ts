import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from "../badge/infra/database.service";

@Injectable()
export class HealthService {
  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  getHealth() {
    return {
      status: "ok",
      service: "api",
      database: this.databaseService.isReady() ? "ok" : "error",
    };
  }
}
