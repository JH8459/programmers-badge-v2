import { describe, expect, it } from "vitest";

import { isAllowedCorsOrigin } from "../src/cors";

describe("isAllowedCorsOrigin", () => {
  it("allows configured web origins and extension origins", () => {
    const runtimeConfig = {
      allowedWebOrigins: ["https://programmers-badge.jh8459.com"],
      allowLocalhostOrigins: false,
    };

    expect(isAllowedCorsOrigin({ origin: undefined, runtimeConfig })).toBe(true);
    expect(
      isAllowedCorsOrigin({
        origin: "https://programmers-badge.jh8459.com",
        runtimeConfig,
      })
    ).toBe(true);
    expect(
      isAllowedCorsOrigin({
        origin: "chrome-extension://abcdefghijklmnop",
        runtimeConfig,
      })
    ).toBe(true);
  });

  it("allows localhost origins only when explicitly enabled", () => {
    const runtimeConfig = {
      allowedWebOrigins: [],
      allowLocalhostOrigins: true,
    };

    expect(isAllowedCorsOrigin({ origin: "http://localhost:5020", runtimeConfig })).toBe(true);
    expect(isAllowedCorsOrigin({ origin: "http://127.0.0.1:5588", runtimeConfig })).toBe(true);
    expect(isAllowedCorsOrigin({ origin: "https://localhost:5588", runtimeConfig })).toBe(false);
    expect(isAllowedCorsOrigin({ origin: "http://192.168.0.2:5588", runtimeConfig })).toBe(false);
  });

  it("rejects unrelated web origins", () => {
    const runtimeConfig = {
      allowedWebOrigins: ["https://programmers-badge.jh8459.com"],
      allowLocalhostOrigins: false,
    };

    expect(isAllowedCorsOrigin({ origin: "https://example.com", runtimeConfig })).toBe(false);
    expect(isAllowedCorsOrigin({ origin: "http://localhost:5020", runtimeConfig })).toBe(false);
  });
});
