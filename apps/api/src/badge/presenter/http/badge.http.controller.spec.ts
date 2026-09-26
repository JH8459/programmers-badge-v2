import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { BadgeHttpController } from "./badge.http.controller";

const SVG = "<svg>badge</svg>";
const ENTITY_TAG = `"${createHash("sha256").update(SVG).digest("hex")}"`;

const sendBadgeWithIfNoneMatch = async (header: string | string[] | undefined) => {
  const response = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    end: vi.fn(),
    send: vi.fn(),
  };
  const useCase = { execute: vi.fn().mockResolvedValue(SVG) };
  const controller = new BadgeHttpController(useCase as never);

  await controller.getBadgeSvg(
    "abc123def456",
    { headers: { "if-none-match": header } },
    response as never
  );

  return response;
};

describe("BadgeHttpController", () => {
  it("matches a weak validator from an If-None-Match list", async () => {
    const response = await sendBadgeWithIfNoneMatch([`"stale", W/${ENTITY_TAG}`]);

    expect(response.status).toHaveBeenCalledWith(304);
    expect(response.end).toHaveBeenCalled();
    expect(response.send).not.toHaveBeenCalled();
  });

  it("matches the wildcard validator", async () => {
    const response = await sendBadgeWithIfNoneMatch("*");

    expect(response.status).toHaveBeenCalledWith(304);
    expect(response.end).toHaveBeenCalled();
  });

  it("matches a strong validator", async () => {
    const response = await sendBadgeWithIfNoneMatch(ENTITY_TAG);

    expect(response.status).toHaveBeenCalledWith(304);
    expect(response.end).toHaveBeenCalled();
  });

  it("sends the SVG when no If-None-Match validator matches", async () => {
    const response = await sendBadgeWithIfNoneMatch('"stale"');

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith(SVG);
    expect(response.end).not.toHaveBeenCalled();
  });

  it("sends the SVG when the If-None-Match header is missing", async () => {
    const response = await sendBadgeWithIfNoneMatch(undefined);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith(SVG);
    expect(response.end).not.toHaveBeenCalled();
  });
});
