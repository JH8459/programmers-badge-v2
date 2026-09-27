import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { BadgePersistenceModule } from "../badge/infra/badge-persistence.module";
import {
  ConnectGitHubInstallationCommandHandler,
  ConsumeGitHubAuthFlowCommandHandler,
  CreateGitHubAuthFlowCommandHandler,
  CreateGitHubSessionCommandHandler,
  DisconnectGitHubCommandHandler,
  InsertGitHubSolutionCommandHandler,
  SaveGitHubRepositorySettingsCommandHandler,
  UpdateGitHubSolutionStatusCommandHandler,
} from "./application/command/github.command";
import {
  FindGitHubConnectionBySessionQueryHandler,
  FindGitHubSolutionQueryHandler,
  ListFailedGitHubSolutionsQueryHandler,
} from "./application/query/github.query";
import { GitHubUseCase } from "./application/use-case/http/github.use-case";
import { GitHubAppService } from "./infra/github-app.service";
import { GitHubRepository } from "./infra/github.repository";
import { GitHubHttpController } from "./presenter/http/github.http.controller";
import { GitHubSessionGuard } from "./presenter/http/github-session.guard";

@Module({
  imports: [CqrsModule, BadgePersistenceModule],
  controllers: [GitHubHttpController],
  providers: [
    GitHubUseCase,
    GitHubAppService,
    GitHubRepository,
    GitHubSessionGuard,
    CreateGitHubAuthFlowCommandHandler,
    ConsumeGitHubAuthFlowCommandHandler,
    ConnectGitHubInstallationCommandHandler,
    CreateGitHubSessionCommandHandler,
    SaveGitHubRepositorySettingsCommandHandler,
    DisconnectGitHubCommandHandler,
    InsertGitHubSolutionCommandHandler,
    UpdateGitHubSolutionStatusCommandHandler,
    FindGitHubConnectionBySessionQueryHandler,
    FindGitHubSolutionQueryHandler,
    ListFailedGitHubSolutionsQueryHandler,
  ],
})
export class GitHubModule {}
