import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ApiE2eApp } from "../../test/e2e/api-e2e.helper";
import { createApiE2eApp } from "../../test/e2e/api-e2e.helper";

describe("HealthController e2e", () => {
  let api: ApiE2eApp;

  beforeAll(async () => {
    api = await createApiE2eApp();
  });

  afterAll(async () => {
    await api.close();
  });

  it("returns readiness state through the API global prefix", async () => {
    // Given: API app이 임시 SQLite DB로 정상 부팅되어 있다.
    const healthUrl = `${api.baseUrl}/api/health`;

    // When: public health endpoint를 호출한다.
    const response = await fetch(healthUrl);

    // Then: 서비스와 DB readiness가 모두 ok로 노출된다.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "api",
      database: "ok",
    });
  });

  it("does not expose health without the API global prefix", async () => {
    // Given: production runtime과 동일하게 global prefix는 /api다.
    const nonPrefixedHealthUrl = `${api.baseUrl}/health`;

    // When: prefix 없이 health endpoint를 호출한다.
    const response = await fetch(nonPrefixedHealthUrl);

    // Then: prefix 누락 경로는 public route로 열리지 않는다.
    expect(response.status).toBe(404);
  });
});
