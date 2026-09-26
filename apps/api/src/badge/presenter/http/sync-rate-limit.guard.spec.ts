import { HttpException, type ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { createSyncRateLimiter, SyncRateLimitGuard } from "./sync-rate-limit.guard";

describe("createSyncRateLimiter", () => {
  it("limits each client independently and returns a bounded retry delay", () => {
    const limiter = createSyncRateLimiter({ maxRequests: 2, windowMs: 1_000 });

    expect(limiter.consume({ clientKey: "client-a", currentTime: 1_000 })).toBeNull();
    expect(limiter.consume({ clientKey: "client-a", currentTime: 1_100 })).toBeNull();
    expect(limiter.consume({ clientKey: "client-a", currentTime: 1_200 })).toBe(1);
    expect(limiter.consume({ clientKey: "client-b", currentTime: 1_200 })).toBeNull();
    expect(limiter.consume({ clientKey: "client-a", currentTime: 2_000 })).toBeNull();
  });

  it("keeps the client table bounded", () => {
    const limiter = createSyncRateLimiter({ maxRequests: 2, maxEntries: 1, windowMs: 1_000 });

    expect(limiter.consume({ clientKey: "client-a", currentTime: 1_000 })).toBeNull();
    expect(limiter.consume({ clientKey: "client-b", currentTime: 1_001 })).toBeNull();
    expect(limiter.consume({ clientKey: "client-a", currentTime: 1_002 })).toBeNull();
  });

  it("evicts empty client keys without leaving the table over its limit", () => {
    const limiter = createSyncRateLimiter({ maxRequests: 2, maxEntries: 1, windowMs: 1_000 });

    expect(limiter.consume({ clientKey: "", currentTime: 1_000 })).toBeNull();
    expect(limiter.consume({ clientKey: "client-b", currentTime: 1_001 })).toBeNull();
    expect(limiter.consume({ clientKey: "client-c", currentTime: 1_002 })).toBeNull();
  });

  it("returns HTTP 429 with Retry-After when the client exceeds the limit", () => {
    const guard = new SyncRateLimitGuard();
    const response = { setHeader: vi.fn() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: "client-a", socket: { remoteAddress: "127.0.0.1" } }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    for (let request = 0; request < 30; request += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    try {
      guard.canActivate(context);
      throw new Error("Expected the rate limit guard to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }

    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  it("falls back from Express IP to the socket address and then to unknown", () => {
    const response = { setHeader: vi.fn() };
    const guard = new SyncRateLimitGuard();
    const createContext = (request: { ip?: string; socket: { remoteAddress?: string } }) =>
      ({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => response,
        }),
      }) as unknown as ExecutionContext;

    expect(
      guard.canActivate(createContext({ ip: "", socket: { remoteAddress: "127.0.0.1" } }))
    ).toBe(true);
    expect(guard.canActivate(createContext({ ip: "", socket: {} }))).toBe(true);
  });
});
