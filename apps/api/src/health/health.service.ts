import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../persistence/database.service";

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  getHealth() {
    return {
      status: "ok",
      service: "api",
      database: this.databaseService.isReady() ? "ok" : "error",
    };
  }
}
