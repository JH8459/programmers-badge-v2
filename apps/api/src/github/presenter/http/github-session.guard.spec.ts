import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GitHubSessionGuard,
  getGitHubSessionToken,
  type GitHubHttpRequest,
} from "./github-session.guard";

vi.mock("../../application/use-case/http/github.use-case", () => ({
  GitHubUseCase: class GitHubUseCase {},
}));

const allowedOrigin = "chrome-extension://nfaknmfniiemabicmcbdkajapapdglaf";
const sessionToken = "s".repeat(43);

const createContext = (request: GitHubHttpRequest) =>
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

  it("rejects requests with an invalid Chrome extension origin", async () => {
    process.env.ALLOWED_EXTENSION_ORIGINS = allowedOrigin;
    const useCase = { getConnection: vi.fn() };
    const guard = new GitHubSessionGuard(useCase as never);

    await expect(
      guard.canActivate(createContext({ headers: { origin: "https://example.com" }, secure: false }))
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guard.canActivate(
        createContext({
          headers: { origin: `chrome-extension://${"q".repeat(32)}` },
          secure: false,
        })
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(useCase.getConnection).not.toHaveBeenCalled();
  });

  it("allows an originless GET from the observed extension fetch context", async () => {
    process.env.ALLOWED_EXTENSION_ORIGINS = allowedOrigin;
    const connection = { githubAccountId: "42", installationId: 12 };
    const useCase = { getConnection: vi.fn().mockResolvedValue(connection) };
    const guard = new GitHubSessionGuard(useCase as never);
    const request: GitHubHttpRequest = {
      method: "GET",
      headers: {
        cookie: `programmers_badge_github_session=${sessionToken}`,
        "sec-fetch-site": "none",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
      },
      secure: true,
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toHaveProperty("githubConnection", connection);
  });

  it("rejects originless non-GET requests even with the observed extension fetch context", async () => {
    process.env.ALLOWED_EXTENSION_ORIGINS = allowedOrigin;
    const useCase = { getConnection: vi.fn() };
    const guard = new GitHubSessionGuard(useCase as never);

    await expect(
      guard.canActivate(
        createContext({
          method: "POST",
          headers: {
            "sec-fetch-site": "none",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
          },
          secure: false,
        })
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(useCase.getConnection).not.toHaveBeenCalled();
  });

  it.each([
    { "sec-fetch-site": "same-origin", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty" },
    { "sec-fetch-site": "none", "sec-fetch-mode": "no-cors", "sec-fetch-dest": "empty" },
    { "sec-fetch-site": "none", "sec-fetch-mode": "cors", "sec-fetch-dest": "document" },
  ])("rejects an originless GET when fetch metadata does not match", async (fetchMetadata) => {
    process.env.ALLOWED_EXTENSION_ORIGINS = allowedOrigin;
    const useCase = { getConnection: vi.fn() };
    const guard = new GitHubSessionGuard(useCase as never);

    await expect(
      guard.canActivate(
        createContext({
          method: "GET",
          headers: fetchMetadata,
          secure: false,
        })
      )
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

  it("adds the authenticated connection to any valid Chrome extension request", async () => {
    delete process.env.ALLOWED_EXTENSION_ORIGINS;
    const connection = { githubAccountId: "42", installationId: 12 };
    const useCase = { getConnection: vi.fn().mockResolvedValue(connection) };
    const guard = new GitHubSessionGuard(useCase as never);
    const unlistedExtensionOrigin = `chrome-extension://${"a".repeat(32)}`;
    const request = {
      headers: {
        origin: unlistedExtensionOrigin,
        cookie: `programmers_badge_github_session=${sessionToken}`,
      },
      secure: true,
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toHaveProperty("githubConnection", connection);
  });
});
