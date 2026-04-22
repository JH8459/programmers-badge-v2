import { describe, expect, it } from "vitest";

import { isAllowedCorsOrigin } from "../src/cors";

describe("isAllowedCorsOrigin", () => {
  it("allows extension and localhost origins", () => {
    expect(isAllowedCorsOrigin(undefined)).toBe(true);
    expect(isAllowedCorsOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedCorsOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isAllowedCorsOrigin("chrome-extension://abcdefghijklmnop")).toBe(true);
  });

  it("rejects unrelated web origins", () => {
    expect(isAllowedCorsOrigin("https://example.com")).toBe(false);
    expect(isAllowedCorsOrigin("http://localhost:4000")).toBe(false);
  });
});
