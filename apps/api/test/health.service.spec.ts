import { describe, expect, it } from "vitest";

import { HealthService } from "../src/health/health.service";
import { DatabaseService } from "../src/persistence/database.service";

import { createTempDatabasePath, removeTempDatabase } from "./test-helpers";

describe("HealthService", () => {
  it("returns database-aware health payload", () => {
    const databasePath = createTempDatabasePath();
    const databaseService = new DatabaseService(databasePath);
    const service = new HealthService(databaseService);

    try {
      expect(service.getHealth()).toEqual({
        status: "ok",
        service: "api",
        database: "ok",
      });
    } finally {
      databaseService.onModuleDestroy();
      removeTempDatabase(databasePath);
    }
  });
});
