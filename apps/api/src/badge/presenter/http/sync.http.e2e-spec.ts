import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ApiE2eApp } from "../../../../test/e2e/api-e2e.helper";
import {
  createApiE2eApp,
  createBadgeSyncPayload,
  parseBadgeSyncResponse,
  postBadgeSync,
} from "../../../../test/e2e/api-e2e.helper";

describe("SyncHttpController e2e", () => {
  let api: ApiE2eApp;

  beforeAll(async () => {
    api = await createApiE2eApp();
  });

  afterAll(async () => {
    await api.close();
  });

  it("creates a public badge response and pre-renders full and mini assets", async () => {
    // Given: extension이 Programmers에서 수집한 payload에 trim이 필요한 문자열이 포함되어 있다.
    const payload = createBadgeSyncPayload({
      programmerHandle: "  e2e-sync-user  ",
      displayName: "  E2E Sync User  ",
    });

    // When: sync endpoint로 badge snapshot을 저장한다.
    const response = await postBadgeSync({ api, payload });

    // Then: response는 shared contract를 만족하고 public URL/snippet을 함께 반환한다.
    expect(response.status).toBe(201);
    const body = await parseBadgeSyncResponse(response);
    expect(body.slug).toHaveLength(12);
    expect(body.programmerHandle).toBe("e2e-sync-user");
    expect(body.displayName).toBe("E2E Sync User");
    expect(body.badgeUrl).toBe(`${api.baseUrl}/badge/${body.slug}.svg`);
    expect(body.miniBadgeUrl).toBe(`${api.baseUrl}/badge/${body.slug}-mini.svg`);
    expect(body.markdownSnippet).toBe(`![Programmers Badge](${body.badgeUrl})`);
    expect(body.miniMarkdownSnippet).toBe(`![Programmers Mini Badge](${body.miniBadgeUrl})`);

    // Then: sync 직후 정적 full/mini SVG asset도 바로 제공된다.
    const fullAssetResponse = await fetch(body.badgeUrl);
    const miniAssetResponse = await fetch(body.miniBadgeUrl);
    expect(fullAssetResponse.status).toBe(200);
    expect(fullAssetResponse.headers.get("content-type")).toContain("image/svg+xml");
    await expect(fullAssetResponse.text()).resolves.toContain("E2E Sync User");
    expect(miniAssetResponse.status).toBe(200);
    expect(miniAssetResponse.headers.get("content-type")).toContain("image/svg+xml");
    await expect(miniAssetResponse.text()).resolves.toContain("programmers");
  });

  it("keeps the public slug stable when the same programmer syncs again", async () => {
    // Given: 같은 programmerHandle로 첫 badge snapshot이 저장되어 있다.
    const firstResponse = await postBadgeSync({
      api,
      payload: createBadgeSyncPayload({
        programmerHandle: "stable-user",
        displayName: "Stable User Before",
        solvedCount: 10,
        rankingScore: 100,
      }),
    });
    const firstBody = await parseBadgeSyncResponse(firstResponse);

    // When: 동일 programmerHandle이 변경된 점수와 표시 이름으로 다시 sync한다.
    const secondResponse = await postBadgeSync({
      api,
      payload: createBadgeSyncPayload({
        programmerHandle: "stable-user",
        displayName: "Stable User After",
        solvedCount: 75,
        rankingScore: 9_900,
      }),
    });
    const secondBody = await parseBadgeSyncResponse(secondResponse);

    // Then: public slug는 유지되고 response data는 최신 snapshot으로 갱신된다.
    expect(secondResponse.status).toBe(201);
    expect(secondBody.slug).toBe(firstBody.slug);
    expect(secondBody.displayName).toBe("Stable User After");
    expect(secondBody.solvedCount).toBe(75);
    expect(secondBody.rankingScore).toBe(9_900);

    // Then: 같은 public badge URL의 SVG asset도 최신 표시 이름으로 갱신된다.
    const updatedBadgeResponse = await fetch(secondBody.badgeUrl);
    const updatedBadgeSvg = await updatedBadgeResponse.text();
    expect(updatedBadgeResponse.status).toBe(200);
    expect(updatedBadgeSvg).toContain("Stable User After");
    expect(updatedBadgeSvg).not.toContain("Stable User Before");
  });

  it.each([
    {
      name: "blank programmer handle",
      payload: createBadgeSyncPayload({ programmerHandle: "   " }),
      expectedMessage: "programmerHandle",
    },
    {
      name: "blank display name",
      payload: createBadgeSyncPayload({ displayName: "   " }),
      expectedMessage: "displayName",
    },
    {
      name: "zero ranking rank",
      payload: createBadgeSyncPayload({ rankingRank: 0 }),
      expectedMessage: "rankingRank",
    },
    {
      name: "invalid badge tier",
      payload: { ...createBadgeSyncPayload(), badgeTier: "expert" },
      expectedMessage: "badgeTier",
    },
    {
      name: "invalid syncedAt datetime",
      payload: createBadgeSyncPayload({ syncedAt: "2026-04-07" }),
      expectedMessage: "syncedAt",
    },
    {
      name: "unknown extra field",
      payload: { ...createBadgeSyncPayload(), rawCredential: "secret" },
      expectedMessage: "rawCredential",
    },
  ])("rejects invalid sync payload: $name", async ({ payload, expectedMessage }) => {
    // Given: shared sync contract를 위반하는 payload가 준비되어 있다.
    // When: sync endpoint로 잘못된 payload를 전송한다.
    const response = await postBadgeSync({ api, payload });

    // Then: persistence나 asset 생성으로 넘어가지 않고 400 validation error를 반환한다.
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining(expectedMessage),
    });
  });

  it("rejects malformed JSON bodies before the sync use case is executed", async () => {
    // Given: content-type은 JSON이지만 body가 JSON 문법을 만족하지 않는다.
    const malformedJsonBody = "{";

    // When: malformed request body를 sync endpoint로 보낸다.
    const response = await fetch(`${api.baseUrl}/api/sync`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: malformedJsonBody,
    });

    // Then: controller boundary 전에 400으로 거절된다.
    expect(response.status).toBe(400);
  });
});
