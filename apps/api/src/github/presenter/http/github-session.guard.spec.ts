import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GitHubSessionGuard, getGitHubSessionToken } from "./github-session.guard";

const allowedOrigin = "chrome-extension://nfaknmfniiemabicmcbdkajapapdglaf";
const sessionToken = "s".repeat(43);

const createContext = (request: { headers: { origin?: string; cookie?: string }; secure: boolean }) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe("GitHubSessionGuard", () => {
  const originalExtensionOrigins = process.env.ALLOWED_EXTENSION_ORIGINS;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalExtensionOrigins === undefined) {
      delete process.env.ALLOWED_EXTENSION_ORIGINS;
    } else {
      process.env.ALLOWED_EXTENSION_ORIGINS = originalExtensionOrigins;
    }
  });

  it("extracts only a well-formed session cookie", () => {
    expect(getGitHubSessionToken(undefined)).toBeUndefined();
    expect(getGitHubSessionToken("other=value")).toBeUndefined();
    expect(getGitHubSessionToken("programmers_badge_github_session=short")).toBeUndefined();
    expect(
      getGitHubSessionToken(`other=value; programmers_badge_github_session=${sessionToken}`)
    ).toBe(sessionToken);
  });

  it("rejects requests with no origin or an origin outside the extension allowlist", async () => {
    process.env.ALLOWED_EXTENSION_ORIGINS = allowedOrigin;
    const useCase = { getConnection: vi.fn() };
    const guard = new GitHubSessionGuard(useCase as never);

    await expect(
      guard.canActivate(createContext({ headers: {}, secure: false }))
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guard.canActivate(createContext({ headers: { origin: "https://example.com" }, secure: false }))
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(useCase.getConnection).not.toHaveBeenCalled();
  });

  it("rejects a missing or expired GitHub session", async () => {
    process.env.ALLOWED_EXTENSION_ORIGINS = allowedOrigin;
    const useCase = { getConnection: vi.fn().mockResolvedValue(null) };
    const guard = new GitHubSessionGuard(useCase as never);

    await expect(
      guard.canActivate(
        createContext({
          headers: { origin: allowedOrigin, cookie: `programmers_badge_github_session=${sessionToken}` },
          secure: false,
        })
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(useCase.getConnection).toHaveBeenCalledWith({
      sessionToken,
      now: expect.any(String),
    });
  });

  it("adds the authenticated connection to an allowed request", async () => {
    process.env.ALLOWED_EXTENSION_ORIGINS = allowedOrigin;
    const connection = { githubAccountId: "42", installationId: 12 };
    const useCase = { getConnection: vi.fn().mockResolvedValue(connection) };
    const guard = new GitHubSessionGuard(useCase as never);
    const request = {
      headers: { origin: allowedOrigin, cookie: `programmers_badge_github_session=${sessionToken}` },
      secure: true,
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toHaveProperty("githubConnection", connection);
  });
});
