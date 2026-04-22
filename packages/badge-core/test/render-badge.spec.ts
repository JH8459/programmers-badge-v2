import { describe, expect, it } from "vitest";

import { createProgrammersBadgeRenderModel, renderBadgeSvg } from "../src/index";

describe("renderBadgeSvg", () => {
  it("returns a deterministic svg string", () => {
    const svg = renderBadgeSvg({
      label: "Programmers",
      value: "starter",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("Programmers");
    expect(svg).toContain("starter");
  });

  it("escapes text content", () => {
    const svg = renderBadgeSvg({
      label: "A&B",
      value: "<tier>",
    });

    expect(svg).toContain("A&amp;B");
    expect(svg).toContain("&lt;tier&gt;");
  });

  it("builds a programmers badge model with tier color", () => {
    expect(
      createProgrammersBadgeRenderModel({
        badgeTier: "advanced",
        solvedCount: 42,
      })
    ).toEqual({
      label: "Programmers Badge",
      value: "Advanced · 42 solved",
      accentColor: "#ea580c",
    });
  });
});
