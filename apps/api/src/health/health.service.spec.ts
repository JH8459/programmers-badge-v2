import { describe, expect, it } from "vitest";

import { DatabaseService } from "../badge/infra/database.service";

import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("returns database-aware health payload", () => {
    const databaseService = new DatabaseService(":memory:");
    const service = new HealthService(databaseService);

    try {
      expect(service.getHealth()).toEqual({
        status: "ok",
        service: "api",
        database: "ok",
      });
    } finally {
      databaseService.onModuleDestroy();
    }
  });

  it("marks database health as error when readiness check fails", () => {
    const databaseService = {
      isReady: () => false,
    } as DatabaseService;
    const service = new HealthService(databaseService);

    expect(service.getHealth()).toEqual({
      status: "ok",
      service: "api",
      database: "error",
    });
  });
});
