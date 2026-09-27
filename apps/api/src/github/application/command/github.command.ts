import { Inject } from "@nestjs/common";
import { Command, CommandHandler, type ICommandHandler } from "@nestjs/cqrs";

import type { GitHubRepository, SolutionRecordPayload } from "@programmers-badge/shared-types";

import {
  GitHubRepository as GitHubRepositoryStore,
  type GitHubConnectionRecord,
  type StoredSolutionRecord,
} from "../../infra/github.repository";

export class CreateGitHubAuthFlowCommand extends Command<{ state: string; expiresAt: string }> {
  constructor(public readonly now: string) { super(); }
}

@CommandHandler(CreateGitHubAuthFlowCommand)
export class CreateGitHubAuthFlowCommandHandler
  implements ICommandHandler<CreateGitHubAuthFlowCommand>
{
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  async execute(command: CreateGitHubAuthFlowCommand) {
    return this.repository.createAuthFlow({ now: command.now });
  }
}

export class ConsumeGitHubAuthFlowCommand extends Command<boolean> {
  constructor(public readonly state: string, public readonly now: string) { super(); }
}

@CommandHandler(ConsumeGitHubAuthFlowCommand)
export class ConsumeGitHubAuthFlowCommandHandler
  implements ICommandHandler<ConsumeGitHubAuthFlowCommand>
{
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  async execute(command: ConsumeGitHubAuthFlowCommand) {
    return this.repository.consumeAuthFlow({ state: command.state, now: command.now });
  }
}

export class ConnectGitHubInstallationCommand extends Command<void> {
  constructor(
    public readonly githubAccountId: string,
    public readonly accountLogin: string,
    public readonly installationId: number,
    public readonly now: string
  ) { super(); }
}

@CommandHandler(ConnectGitHubInstallationCommand)
export class ConnectGitHubInstallationCommandHandler
  implements ICommandHandler<ConnectGitHubInstallationCommand>
{
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  async execute(command: ConnectGitHubInstallationCommand) {
    return this.repository.connectInstallation(command);
  }
}

export class CreateGitHubSessionCommand extends Command<{ token: string; expiresAt: string }> {
  constructor(public readonly githubAccountId: string, public readonly now: string) { super(); }
}

@CommandHandler(CreateGitHubSessionCommand)
export class CreateGitHubSessionCommandHandler implements ICommandHandler<CreateGitHubSessionCommand> {
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  async execute(command: CreateGitHubSessionCommand) {
    return this.repository.createSession({ githubAccountId: command.githubAccountId, now: command.now });
  }
}

export class SaveGitHubRepositorySettingsCommand extends Command<void> {
  constructor(
    public readonly githubAccountId: string,
    public readonly repository: GitHubRepository,
    public readonly branch: string,
    public readonly basePath: string,
    public readonly now: string
  ) { super(); }
}

@CommandHandler(SaveGitHubRepositorySettingsCommand)
export class SaveGitHubRepositorySettingsCommandHandler
  implements ICommandHandler<SaveGitHubRepositorySettingsCommand>
{
  constructor(@Inject(GitHubRepositoryStore) private readonly repositoryStore: GitHubRepositoryStore) {}
  async execute(command: SaveGitHubRepositorySettingsCommand) {
    return this.repositoryStore.saveRepositorySettings({
      githubAccountId: command.githubAccountId,
      repository: command.repository,
      branch: command.branch,
      basePath: command.basePath,
      updatedAt: command.now,
    });
  }
}

export class DisconnectGitHubCommand extends Command<void> {
  constructor(public readonly githubAccountId: string) { super(); }
}

@CommandHandler(DisconnectGitHubCommand)
export class DisconnectGitHubCommandHandler implements ICommandHandler<DisconnectGitHubCommand> {
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  async execute(command: DisconnectGitHubCommand) {
    return this.repository.disconnect({ githubAccountId: command.githubAccountId });
  }
}

export class InsertGitHubSolutionCommand extends Command<StoredSolutionRecord> {
  constructor(
    public readonly githubAccountId: string,
    public readonly connection: GitHubConnectionRecord,
    public readonly payload: SolutionRecordPayload,
    public readonly now: string
  ) { super(); }
}

@CommandHandler(InsertGitHubSolutionCommand)
export class InsertGitHubSolutionCommandHandler implements ICommandHandler<InsertGitHubSolutionCommand> {
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  async execute(command: InsertGitHubSolutionCommand) {
    return this.repository.insertSolution(command);
  }
}

export class UpdateGitHubSolutionStatusCommand extends Command<void> {
  constructor(
    public readonly submissionId: string,
    public readonly status: StoredSolutionRecord["status"],
    public readonly errorMessage: string | null,
    public readonly commitSha: string | null,
    public readonly now: string,
    public readonly incrementAttempt = false
  ) { super(); }
}

@CommandHandler(UpdateGitHubSolutionStatusCommand)
export class UpdateGitHubSolutionStatusCommandHandler
  implements ICommandHandler<UpdateGitHubSolutionStatusCommand>
{
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  async execute(command: UpdateGitHubSolutionStatusCommand) {
    return this.repository.updateSolutionStatus({
      submissionId: command.submissionId,
      status: command.status,
      errorMessage: command.errorMessage,
      commitSha: command.commitSha,
      updatedAt: command.now,
      incrementAttempt: command.incrementAttempt,
    });
  }
}
