import { describe, expect, it } from "vitest";

import { BADGE_TIERS, SUPPORTED_BADGE_FORMATS } from "../src/index";

describe("shared types contracts", () => {
  it("supports svg and markdown formats", () => {
    expect(SUPPORTED_BADGE_FORMATS).toEqual(["svg", "markdown"]);
  });

  it("supports the current badge tiers", () => {
    expect(BADGE_TIERS).toEqual(["starter", "intermediate", "advanced"]);
  });
});
