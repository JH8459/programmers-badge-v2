import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ApiE2eApp } from "../../../../test/e2e/api-e2e.helper";
import {
  createApiE2eApp,
  createBadgeSyncPayload,
  parseBadgeSyncResponse,
  postBadgeSync,
} from "../../../../test/e2e/api-e2e.helper";

describe("BadgeHttpController e2e", () => {
  let api: ApiE2eApp;

  beforeAll(async () => {
    api = await createApiE2eApp();
  });

  afterAll(async () => {
    await api.close();
  });

  it("serves full and mini SVG badges through API controller routes", async () => {
    // Given: sync endpoint가 full/mini badge asset을 생성한 public slug가 있다.
    const syncResponse = await postBadgeSync({
      api,
      payload: createBadgeSyncPayload({ programmerHandle: "controller-user" }),
    });
    const syncBody = await parseBadgeSyncResponse(syncResponse);

    // When: controller route로 full/mini SVG를 조회한다.
    const fullBadgeResponse = await fetch(`${api.baseUrl}/api/badge/${syncBody.slug}.svg`);
    const miniBadgeResponse = await fetch(`${api.baseUrl}/api/badge/${syncBody.slug}/mini.svg`);

    // Then: 두 route 모두 SVG content-type과 badge 본문을 반환한다.
    expect(fullBadgeResponse.status).toBe(200);
    expect(fullBadgeResponse.headers.get("content-type")).toContain("image/svg+xml");
    await expect(fullBadgeResponse.text()).resolves.toContain("E2E User");

    expect(miniBadgeResponse.status).toBe(200);
    expect(miniBadgeResponse.headers.get("content-type")).toContain("image/svg+xml");
    await expect(miniBadgeResponse.text()).resolves.toContain("programmers");
  });

  it("regenerates full and mini SVG assets on cache miss using persisted badge data", async () => {
    // Given: badge snapshot은 DB에 남아 있지만 pre-rendered SVG 파일이 삭제된 상태다.
    const syncResponse = await postBadgeSync({
      api,
      payload: createBadgeSyncPayload({
        programmerHandle: "cache-miss-user",
        displayName: "Cache Miss User",
      }),
    });
    const syncBody = await parseBadgeSyncResponse(syncResponse);
    const fullBadgeFilePath = join(api.badgeOutputDirectory, `${syncBody.slug}.svg`);
    const miniBadgeFilePath = join(api.badgeOutputDirectory, `${syncBody.slug}-mini.svg`);
    rmSync(fullBadgeFilePath, { force: true });
    rmSync(miniBadgeFilePath, { force: true });

    // When: cache miss 상태에서 controller route로 full/mini badge를 다시 요청한다.
    const fullBadgeResponse = await fetch(`${api.baseUrl}/api/badge/${syncBody.slug}.svg`);
    const miniBadgeResponse = await fetch(`${api.baseUrl}/api/badge/${syncBody.slug}/mini.svg`);

    // Then: DB snapshot 기준으로 SVG를 재생성하고 파일 cache도 복구한다.
    expect(fullBadgeResponse.status).toBe(200);
    await expect(fullBadgeResponse.text()).resolves.toContain("Cache Miss User");
    expect(miniBadgeResponse.status).toBe(200);
    await expect(miniBadgeResponse.text()).resolves.toContain("programmers");
    expect(existsSync(fullBadgeFilePath)).toBe(true);
    expect(existsSync(miniBadgeFilePath)).toBe(true);
  });

  it("serves pre-rendered SVG files through the public static badge paths", async () => {
    // Given: sync response가 public static full/mini badge URL을 제공한다.
    const syncResponse = await postBadgeSync({
      api,
      payload: createBadgeSyncPayload({ programmerHandle: "static-user" }),
    });
    const syncBody = await parseBadgeSyncResponse(syncResponse);

    // When: response에 포함된 static URL을 그대로 호출한다.
    const fullStaticResponse = await fetch(syncBody.badgeUrl);
    const miniStaticResponse = await fetch(syncBody.miniBadgeUrl);

    // Then: static middleware가 SVG와 cache revalidation header를 반환한다.
    expect(fullStaticResponse.status).toBe(200);
    expect(fullStaticResponse.headers.get("content-type")).toContain("image/svg+xml");
    expect(fullStaticResponse.headers.get("cache-control")).toBe(
      "public, no-cache, must-revalidate"
    );
    await expect(fullStaticResponse.text()).resolves.toContain("E2E User");

    expect(miniStaticResponse.status).toBe(200);
    expect(miniStaticResponse.headers.get("content-type")).toContain("image/svg+xml");
    expect(miniStaticResponse.headers.get("cache-control")).toBe(
      "public, no-cache, must-revalidate"
    );
    await expect(miniStaticResponse.text()).resolves.toContain("programmers");
  });

  it.each([
    {
      name: "full badge",
      path: "/api/badge/missing.svg",
      expectedMessage: "Public badge 'missing' was not found.",
    },
    {
      name: "mini badge",
      path: "/api/badge/missing/mini.svg",
      expectedMessage: "Public mini badge 'missing' was not found.",
    },
  ])("returns not found for missing $name", async ({ path, expectedMessage }) => {
    // Given: 요청 slug와 일치하는 persisted badge snapshot이 없다.
    const missingBadgeUrl = `${api.baseUrl}${path}`;

    // When: missing slug로 badge controller route를 호출한다.
    const response = await fetch(missingBadgeUrl);

    // Then: asset fallback 생성 없이 404 응답을 반환한다.
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      statusCode: 404,
      message: expectedMessage,
    });
  });

  it("returns not found when a static public badge file does not exist", async () => {
    // Given: static badge directory에 missing.svg 파일이 존재하지 않는다.
    const missingStaticBadgeUrl = `${api.baseUrl}/badge/missing.svg`;

    // When: static middleware public path로 존재하지 않는 파일을 요청한다.
    const response = await fetch(missingStaticBadgeUrl);

    // Then: controller fallback 없이 static 404를 반환한다.
    expect(response.status).toBe(404);
  });
});
