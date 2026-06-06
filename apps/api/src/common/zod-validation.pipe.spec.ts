import { BadRequestException } from "@nestjs/common";
import { badgeSyncPayloadSchema } from "@programmers-badge/shared-types";
import { describe, expect, it } from "vitest";

import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("normalizes sync payload input through the shared schema", () => {
    const pipe = new ZodValidationPipe(badgeSyncPayloadSchema);

    expect(
      pipe.transform({
        programmerHandle: "  sync-user  ",
        displayName: "  Sync User  ",
        solvedCount: 10,
        solvedTotal: 20,
        skillLevel: 1,
        rankingScore: 120,
        rankingRank: 4,
        badgeTier: "starter",
        syncedAt: "2026-04-07T01:02:03.000Z",
      })
    ).toMatchObject({
      programmerHandle: "sync-user",
      displayName: "Sync User",
    });
  });

  it("throws a bad request exception for invalid payloads", () => {
    const pipe = new ZodValidationPipe(badgeSyncPayloadSchema);

    expect(() =>
      pipe.transform({
        programmerHandle: "sync-user",
        displayName: "Sync User",
        solvedCount: 10,
        solvedTotal: 20,
        skillLevel: 1,
        rankingScore: 120,
        rankingRank: 0,
        badgeTier: "starter",
        syncedAt: "2026-04-07T01:02:03.000Z",
      })
    ).toThrow(BadRequestException);
  });
});
