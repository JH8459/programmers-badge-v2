import { BADGE_TIERS } from "@programmers-badge/shared-types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ApiE2eApp } from "../test/e2e/api-e2e.helper";
import { createApiE2eApp } from "../test/e2e/api-e2e.helper";

interface SwaggerDocument {
  readonly paths: Record<string, unknown>;
  readonly components?: {
    readonly schemas?: Record<string, unknown>;
  };
}

const readSwaggerDocument = async (response: Response): Promise<SwaggerDocument> =>
  (await response.json()) as SwaggerDocument;

const createBasicAuthHeader = ({
  username,
  password,
}: {
  readonly username: string;
  readonly password: string;
}): string => `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

const fetchSwaggerRoute = ({
  api,
  path,
  authorization,
}: {
  readonly api: ApiE2eApp;
  readonly path: string;
  readonly authorization?: string;
}): Promise<Response> =>
  fetch(`${api.baseUrl}${path}`, {
    headers:
      authorization === undefined
        ? undefined
        : {
            authorization,
          },
  });

describe("Swagger documentation e2e", () => {
  describe("when Swagger is disabled", () => {
    let api: ApiE2eApp;

    beforeAll(async () => {
      api = await createApiE2eApp();
    });

    afterAll(async () => {
      await api?.close();
    });

    it("does not expose the Swagger UI or JSON document by default", async () => {
      // Given: 테스트에서 ENABLE_SWAGGER를 명시적으로 false로 둔 API app이 떠 있다.
      // When: Swagger UI와 OpenAPI JSON route를 직접 호출한다.
      const docsResponse = await fetchSwaggerRoute({ api, path: "/api/docs" });
      const docsJsonResponse = await fetchSwaggerRoute({ api, path: "/api/docs-json" });

      // Then: 문서 route는 public surface로 노출되지 않는다.
      expect(docsResponse.status).toBe(404);
      expect(docsJsonResponse.status).toBe(404);
    });
  });

  describe("when Swagger is enabled", () => {
    let api: ApiE2eApp;

    beforeAll(async () => {
      api = await createApiE2eApp({ enableSwagger: true });
    });

    afterAll(async () => {
      await api?.close();
    });

    it("rejects Swagger UI requests without Basic Auth", async () => {
      // Given: ENABLE_SWAGGER가 true지만 Swagger credential을 보내지 않은 요청이다.
      // When: global prefix가 포함된 Swagger UI route를 호출한다.
      const response = await fetchSwaggerRoute({ api, path: "/api/docs" });

      // Then: 인증 challenge와 함께 Swagger UI 접근을 거부한다.
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toContain("Basic");
    });

    it("rejects Swagger JSON requests with malformed Basic Auth credentials", async () => {
      // Given: Basic Auth scheme은 있지만 username/password separator가 없는 credential이다.
      // When: OpenAPI JSON route를 호출한다.
      const response = await fetchSwaggerRoute({
        api,
        path: "/api/docs-json",
        authorization: `Basic ${Buffer.from("missing-separator").toString("base64")}`,
      });

      // Then: credential을 파싱할 수 없으므로 문서 접근을 거부한다.
      expect(response.status).toBe(401);
    });

    it("rejects Swagger JSON requests with invalid Basic Auth credentials", async () => {
      // Given: Swagger가 활성화되어 있지만 잘못된 username/password를 보낸다.
      // When: OpenAPI JSON route를 호출한다.
      const response = await fetchSwaggerRoute({
        api,
        path: "/api/docs-json",
        authorization: createBasicAuthHeader({
          username: "wrong-user",
          password: "wrong-password",
        }),
      });

      // Then: 문서 JSON도 UI와 동일하게 Basic Auth를 요구한다.
      expect(response.status).toBe(401);
    });

    it("exposes Swagger UI under the API global prefix for valid Basic Auth", async () => {
      // Given: ENABLE_SWAGGER가 true인 API app이 떠 있다.
      // When: global prefix가 포함된 Swagger UI route를 호출한다.
      const response = await fetchSwaggerRoute({
        api,
        path: "/api/docs",
        authorization: createBasicAuthHeader({
          username: api.swaggerUsername,
          password: api.swaggerPassword,
        }),
      });

      // Then: Swagger UI HTML이 /api/docs에서 제공된다.
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
      await expect(response.text()).resolves.toContain("PROGRAMMERS-BADGE-V2 API Docs");
    });

    it("documents public API paths and shared enum values", async () => {
      // Given: ENABLE_SWAGGER가 true인 API app이 떠 있다.
      // When: OpenAPI JSON document를 조회한다.
      const response = await fetchSwaggerRoute({
        api,
        path: "/api/docs-json",
        authorization: createBasicAuthHeader({
          username: api.swaggerUsername,
          password: api.swaggerPassword,
        }),
      });
      const document = await readSwaggerDocument(response);

      // Then: 실제 public API global prefix가 포함된 endpoint들이 문서화된다.
      expect(response.status).toBe(200);
      expect(document.paths).toHaveProperty("/api/sync");
      expect(document.paths).toHaveProperty("/api/badge/{slug}.svg");
      expect(document.paths).toHaveProperty("/api/badge/{slug}/mini.svg");
      expect(document.paths).toHaveProperty("/api/health");

      // Then: sync request DTO는 shared-types의 BadgeTier enum 값을 중복 정의 없이 노출한다.
      const badgeSyncRequestSchema = document.components?.schemas?.BadgeSyncRequestDto;
      const serializedSchema = JSON.stringify(badgeSyncRequestSchema);

      for (const badgeTier of BADGE_TIERS) {
        expect(serializedSchema).toContain(badgeTier);
      }
    });

    it("does not expose Swagger YAML", async () => {
      // Given: Swagger credential이 정상이고 JSON 문서는 활성화되어 있다.
      // When: SwaggerModule의 raw YAML route convention을 직접 호출한다.
      const response = await fetchSwaggerRoute({
        api,
        path: "/api/docs-yaml",
        authorization: createBasicAuthHeader({
          username: api.swaggerUsername,
          password: api.swaggerPassword,
        }),
      });

      // Then: API docs raw surface는 JSON route만 남긴다.
      expect(response.status).toBe(404);
    });
  });
});
