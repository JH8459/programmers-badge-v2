import { describe, expect, it, vi } from "vitest";

import {
  FindGitHubConnectionBySessionQuery,
  FindGitHubConnectionBySessionQueryHandler,
  FindGitHubSolutionQuery,
  FindGitHubSolutionQueryHandler,
  ListFailedGitHubSolutionsQuery,
  ListFailedGitHubSolutionsQueryHandler,
} from "./github.query";

describe("GitHub query handlers", () => {
  it("finds a connection by session", async () => {
    const repository = { findConnectionBySession: vi.fn().mockReturnValue(null) };
    await expect(
      new FindGitHubConnectionBySessionQueryHandler(repository as never).execute(
        new FindGitHubConnectionBySessionQuery("token", "now")
      )
    ).resolves.toBeNull();
    expect(repository.findConnectionBySession).toHaveBeenCalledWith({ token: "token", now: "now" });
  });

  it("finds a solution for an account", async () => {
    const record = { submissionId: "submission" };
    const repository = { findSolution: vi.fn().mockReturnValue(record) };
    await expect(
      new FindGitHubSolutionQueryHandler(repository as never).execute(
        new FindGitHubSolutionQuery("submission", "account")
      )
    ).resolves.toBe(record);
    expect(repository.findSolution).toHaveBeenCalledWith({
      submissionId: "submission",
      githubAccountId: "account",
    });
  });

  it("lists failed solutions with the requested limit", async () => {
    const records = [{ submissionId: "submission" }];
    const repository = { listFailedSolutions: vi.fn().mockReturnValue(records) };
    await expect(
      new ListFailedGitHubSolutionsQueryHandler(repository as never).execute(
        new ListFailedGitHubSolutionsQuery("account", 25)
      )
    ).resolves.toBe(records);
    expect(repository.listFailedSolutions).toHaveBeenCalledWith({ githubAccountId: "account", limit: 25 });
  });
});
