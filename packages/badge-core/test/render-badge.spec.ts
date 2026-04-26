import { describe, expect, it } from "vitest";

import { createProgrammersBadgeRenderModel, renderBadgeSvg, renderMiniBadgeSvg } from "../src/index";

describe("renderBadgeSvg", () => {
  it("returns a deterministic svg string", () => {
    const svg = renderBadgeSvg(
      createProgrammersBadgeRenderModel({
        displayName: "Programmers User",
        solvedCount: 32,
        solvedTotal: 120,
        skillLevel: 3,
        rankingScore: 5820,
        rankingRank: 17,
      })
    );

    expect(svg).toContain("<svg");
    expect(svg).toContain('width="350px"');
    expect(svg).toContain("shape-rendering:geometricPrecision");
    expect(svg).toContain("data:image/png;base64,");
    expect(svg).toContain("Programmers User");
    expect(svg).toContain(">3</text>");
    expect(svg).toContain("5,820");
    expect(svg).toContain("32");
    expect(svg).toContain("17");
    expect(svg).toContain("Score");
    expect(svg).toContain("Solved");
    expect(svg).toContain("Rank");
  });

  it("returns the v1 mini badge shape", () => {
    const svg = renderMiniBadgeSvg(
      createProgrammersBadgeRenderModel({
        displayName: "Programmers User",
        solvedCount: 32,
        solvedTotal: 120,
        skillLevel: 3,
        rankingScore: 5820,
        rankingRank: 17,
      })
    );

    expect(svg).toContain('width="110"');
    expect(svg).toContain(">programmers</text>");
    expect(svg).toContain(">Lv.3</text>");
  });

  it("builds a programmers badge model with the v1-shaped data contract", () => {
    expect(
      createProgrammersBadgeRenderModel({
        displayName: "Badge Owner",
        solvedCount: 42,
        solvedTotal: 100,
        skillLevel: 4,
        rankingScore: 12000,
        rankingRank: 55,
      })
    ).toEqual({
      name: "Badge Owner",
      skillCheck: {
        level: 4,
      },
      ranking: {
        score: 12000,
        rank: 55,
      },
      codingTest: {
        solved: 42,
        total: 100,
      },
    });
  });
});
