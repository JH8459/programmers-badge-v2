import { describe, expect, it, vi } from "vitest";

import {
  ConnectGitHubInstallationCommand,
  ConnectGitHubInstallationCommandHandler,
  ConsumeGitHubAuthFlowCommand,
  ConsumeGitHubAuthFlowCommandHandler,
  CreateGitHubAuthFlowCommand,
  CreateGitHubAuthFlowCommandHandler,
  CreateGitHubSessionCommand,
  CreateGitHubSessionCommandHandler,
  DisconnectGitHubCommand,
  DisconnectGitHubCommandHandler,
  InsertGitHubSolutionCommand,
  InsertGitHubSolutionCommandHandler,
  SaveGitHubRepositorySettingsCommand,
  SaveGitHubRepositorySettingsCommandHandler,
  UpdateGitHubSolutionStatusCommand,
  UpdateGitHubSolutionStatusCommandHandler,
} from "./github.command";

const createRepository = () => ({
  createAuthFlow: vi.fn().mockReturnValue({ state: "flow", expiresAt: "expires" }),
  consumeAuthFlow: vi.fn().mockReturnValue(true),
  connectInstallation: vi.fn(),
  createSession: vi.fn().mockReturnValue({ token: "session", expiresAt: "expires" }),
  saveRepositorySettings: vi.fn(),
  disconnect: vi.fn(),
  insertSolution: vi.fn().mockReturnValue({ submissionId: "submission" }),
  updateSolutionStatus: vi.fn(),
});

describe("GitHub command handlers", () => {
  it("creates an auth flow", async () => {
    const repository = createRepository();
    await expect(
      new CreateGitHubAuthFlowCommandHandler(repository as never).execute(
        new CreateGitHubAuthFlowCommand("now")
      )
    ).resolves.toEqual({ state: "flow", expiresAt: "expires" });
    expect(repository.createAuthFlow).toHaveBeenCalledWith({ now: "now" });
  });

  it("consumes an auth flow", async () => {
    const repository = createRepository();
    await expect(
      new ConsumeGitHubAuthFlowCommandHandler(repository as never).execute(
        new ConsumeGitHubAuthFlowCommand("state", "now")
      )
    ).resolves.toBe(true);
    expect(repository.consumeAuthFlow).toHaveBeenCalledWith({ state: "state", now: "now" });
  });

  it("connects an installation", async () => {
    const repository = createRepository();
    const command = new ConnectGitHubInstallationCommand("account", "login", 12, "now");
    await new ConnectGitHubInstallationCommandHandler(repository as never).execute(command);
    expect(repository.connectInstallation).toHaveBeenCalledWith(command);
  });

  it("creates a session", async () => {
    const repository = createRepository();
    await expect(
      new CreateGitHubSessionCommandHandler(repository as never).execute(
        new CreateGitHubSessionCommand("account", "now")
      )
    ).resolves.toEqual({ token: "session", expiresAt: "expires" });
    expect(repository.createSession).toHaveBeenCalledWith({ githubAccountId: "account", now: "now" });
  });

  it("saves repository settings with its update timestamp", async () => {
    const repository = createRepository();
    const model = {
      id: 3,
      owner: "owner",
      name: "repo",
      fullName: "owner/repo",
      isPrivate: false,
      defaultBranch: "main",
    };
    const command = new SaveGitHubRepositorySettingsCommand("account", model, "main", "base", "now");
    await new SaveGitHubRepositorySettingsCommandHandler(repository as never).execute(command);
    expect(repository.saveRepositorySettings).toHaveBeenCalledWith({
      githubAccountId: "account",
      repository: model,
      branch: "main",
      basePath: "base",
      updatedAt: "now",
    });
  });

  it("disconnects an installation", async () => {
    const repository = createRepository();
    await new DisconnectGitHubCommandHandler(repository as never).execute(
      new DisconnectGitHubCommand("account")
    );
    expect(repository.disconnect).toHaveBeenCalledWith({ githubAccountId: "account" });
  });

  it("inserts a solution", async () => {
    const repository = createRepository();
    const connection = { githubAccountId: "account" };
    const payload = { submissionId: "submission" };
    const command = new InsertGitHubSolutionCommand("account", connection as never, payload as never, "now");
    await expect(new InsertGitHubSolutionCommandHandler(repository as never).execute(command)).resolves.toEqual({
      submissionId: "submission",
    });
    expect(repository.insertSolution).toHaveBeenCalledWith(command);
  });

  it("updates a solution status and attempt counter", async () => {
    const repository = createRepository();
    const command = new UpdateGitHubSolutionStatusCommand(
      "submission",
      "failed",
      "error",
      null,
      "now",
      true
    );
    await new UpdateGitHubSolutionStatusCommandHandler(repository as never).execute(command);
    expect(repository.updateSolutionStatus).toHaveBeenCalledWith({
      submissionId: "submission",
      status: "failed",
      errorMessage: "error",
      commitSha: null,
      updatedAt: "now",
      incrementAttempt: true,
    });
  });
});
