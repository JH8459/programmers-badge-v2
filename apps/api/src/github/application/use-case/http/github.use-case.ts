import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  githubRepositorySettingsSchema,
  type FailedSolutionRecord,
  type GitHubConnectionResponse,
  type GitHubRepository,
  type GitHubRepositorySettings,
  type SolutionRecordPayload,
  type SolutionRecordResult,
} from "@programmers-badge/shared-types";

import { GitHubAppService, normalizeGitHubBasePath } from "../../../infra/github-app.service";
import type { GitHubConnectionRecord, StoredSolutionRecord } from "../../../infra/github.repository";
import {
  ConnectGitHubInstallationCommand,
  ConsumeGitHubAuthFlowCommand,
  CreateGitHubAuthFlowCommand,
  CreateGitHubSessionCommand,
  DisconnectGitHubCommand,
  InsertGitHubSolutionCommand,
  SaveGitHubRepositorySettingsCommand,
  UpdateGitHubSolutionStatusCommand,
} from "../../command/github.command";
import {
  FindGitHubConnectionBySessionQuery,
  FindGitHubSolutionQuery,
  ListFailedGitHubSolutionsQuery,
} from "../../query/github.query";

interface CompleteGitHubConnectionInput {
  state: string;
  installationId: number;
  now: string;
}

interface SaveGitHubSettingsInput {
  connection: GitHubConnectionRecord;
  settings: GitHubRepositorySettings;
  now: string;
}

interface CreateSolutionRecordInput {
  connection: GitHubConnectionRecord;
  payload: SolutionRecordPayload;
  now: string;
}

@Injectable()
export class GitHubUseCase {
  constructor(
    @Inject(CommandBus) private readonly commandBus: CommandBus,
    @Inject(QueryBus) private readonly queryBus: QueryBus,
    @Inject(GitHubAppService) private readonly githubAppService: GitHubAppService
  ) {}

  async startConnection({ now }: { now: string }): Promise<{ url: string; state: string }> {
    const { state } = await this.commandBus.execute<
      CreateGitHubAuthFlowCommand,
      { state: string; expiresAt: string }
    >(new CreateGitHubAuthFlowCommand(now));
    return { url: this.githubAppService.buildInstallationUrl({ state }), state };
  }

  async completeConnection({
    state,
    installationId,
    now,
  }: CompleteGitHubConnectionInput): Promise<{ token: string; expiresAt: string }> {
    const authFlowConsumed = await this.commandBus.execute<ConsumeGitHubAuthFlowCommand, boolean>(
      new ConsumeGitHubAuthFlowCommand(state, now)
    );
    if (!authFlowConsumed) {
      throw new UnauthorizedException("GitHub 연결 요청이 만료되었거나 이미 사용됐습니다.");
    }

    const account = await this.githubAppService.verifyInstallation({ installationId });
    await this.commandBus.execute(
      new ConnectGitHubInstallationCommand(
        account.githubAccountId,
        account.accountLogin,
        installationId,
        now
      )
    );
    return this.commandBus.execute<CreateGitHubSessionCommand, { token: string; expiresAt: string }>(
      new CreateGitHubSessionCommand(account.githubAccountId, now)
    );
  }

  getPublicWebOrigin(): string {
    return this.githubAppService.getPublicWebOrigin();
  }

  async getConnection({ sessionToken, now }: { sessionToken: string | undefined; now: string }): Promise<GitHubConnectionRecord | null> {
    if (!sessionToken) {
      return null;
    }
    return this.queryBus.execute<FindGitHubConnectionBySessionQuery, GitHubConnectionRecord | null>(
      new FindGitHubConnectionBySessionQuery(sessionToken, now)
    );
  }

  toConnectionResponse({ connection }: { connection: GitHubConnectionRecord }): GitHubConnectionResponse {
    return {
      connected: true,
      accountLogin: connection.accountLogin,
      installationId: connection.installationId,
      settings: connection.settings,
    };
  }

  async listRepositories({ connection }: { connection: GitHubConnectionRecord }): Promise<GitHubRepository[]> {
    return this.githubAppService.listInstallationRepositories({
      installationId: connection.installationId,
    });
  }

  async saveSettings({
    connection,
    settings,
    now,
  }: SaveGitHubSettingsInput): Promise<GitHubConnectionResponse> {
    const parsedSettings = githubRepositorySettingsSchema.parse(settings);
    const repositories = await this.listRepositories({ connection });
    const selectedRepository = repositories.find(({ id }) => id === parsedSettings.repositoryId);
    if (!selectedRepository) {
      throw new ConflictException("선택한 저장소가 현재 GitHub App 설치 권한에 없습니다.");
    }

    let basePath: string;
    try {
      basePath = normalizeGitHubBasePath(parsedSettings.basePath);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "기록 경로를 사용할 수 없습니다."
      );
    }
    try {
      await this.githubAppService.validateRepositoryBranch({
        installationId: connection.installationId,
        repository: selectedRepository,
        branch: parsedSettings.branch,
      });
    } catch (error) {
      throw new ConflictException(this.githubAppService.getFailureMessage(error));
    }
    await this.commandBus.execute(
      new SaveGitHubRepositorySettingsCommand(
        connection.githubAccountId,
        selectedRepository,
        parsedSettings.branch,
        basePath,
        now
      )
    );

    return {
      connected: true,
      accountLogin: connection.accountLogin,
      installationId: connection.installationId,
      settings: {
        repository: selectedRepository,
        repositoryId: selectedRepository.id,
        branch: parsedSettings.branch,
        basePath,
      },
    };
  }

  async recordSolution({
    connection,
    payload,
    now,
  }: CreateSolutionRecordInput): Promise<SolutionRecordResult> {
    if (!connection.settings) {
      return {
        submissionId: payload.submissionId,
        status: "skipped",
        message: "GitHub 저장소를 먼저 연결하고 기록 경로를 설정해 주세요.",
        commitUrl: null,
      };
    }

    const record = await this.commandBus.execute<InsertGitHubSolutionCommand, StoredSolutionRecord>(
      new InsertGitHubSolutionCommand(connection.githubAccountId, connection, payload, now)
    );
    if (record.status === "saved") {
      return {
        submissionId: record.submissionId,
        status: "saved",
        message: "풀이 기록이 GitHub에 저장되어 있습니다.",
        commitUrl: this.getCommitUrl(record),
      };
    }
    if (record.status === "skipped") {
      return {
        submissionId: record.submissionId,
        status: "skipped",
        message: "변경된 풀이가 없어 새 커밋을 만들지 않았습니다.",
        commitUrl: null,
      };
    }
    if (record.status === "failed") {
      return {
        submissionId: record.submissionId,
        status: "failed" as const,
        message: record.errorMessage ?? "GitHub 풀이 기록에 실패했습니다.",
        commitUrl: null,
      };
    }

    return this.writeSolutionRecord({ record, now });
  }

  async listFailedSolutions({ connection }: { connection: GitHubConnectionRecord }): Promise<FailedSolutionRecord[]> {
    const records = await this.queryBus.execute<ListFailedGitHubSolutionsQuery, StoredSolutionRecord[]>(
      new ListFailedGitHubSolutionsQuery(connection.githubAccountId, 25)
    );
    return records
      .map((record) => ({
        submissionId: record.submissionId,
        problemId: record.metadata.problemId,
        problemName: record.metadata.problemName,
        language: record.metadata.language,
        status: "failed",
        errorMessage: record.errorMessage ?? "GitHub 풀이 기록에 실패했습니다.",
        attemptCount: record.attemptCount,
        updatedAt: record.updatedAt,
      }));
  }

  async retrySolution({
    connection,
    submissionId,
    now,
  }: {
    connection: GitHubConnectionRecord;
    submissionId: string;
    now: string;
  }): Promise<SolutionRecordResult> {
    const record = await this.queryBus.execute<FindGitHubSolutionQuery, StoredSolutionRecord | null>(
      new FindGitHubSolutionQuery(submissionId, connection.githubAccountId)
    );
    if (!record) {
      throw new NotFoundException("재시도할 풀이 기록을 찾지 못했습니다.");
    }
    if (record.status !== "failed") {
      throw new ConflictException("실패 상태인 풀이 기록만 재시도할 수 있습니다.");
    }
    return this.writeSolutionRecord({ record, now });
  }

  disconnect({ connection }: { connection: GitHubConnectionRecord }): Promise<void> {
    return this.commandBus.execute(
      new DisconnectGitHubCommand(connection.githubAccountId)
    );
  }

  private async writeSolutionRecord({
    record,
    now,
  }: {
    record: StoredSolutionRecord;
    now: string;
  }): Promise<SolutionRecordResult> {
    await this.commandBus.execute(
      new UpdateGitHubSolutionStatusCommand(record.submissionId, "pending", null, null, now, true)
    );

    try {
      const commit = await this.githubAppService.writeSolution({
        record: { ...record, attemptCount: record.attemptCount + 1 },
      });
      const status = commit.skipped ? "skipped" : "saved";
      await this.commandBus.execute(
        new UpdateGitHubSolutionStatusCommand(
          record.submissionId,
          status,
          null,
          commit.commitSha || null,
          new Date().toISOString()
        )
      );
      return {
        submissionId: record.submissionId,
        status,
        message: commit.skipped ? "같은 언어의 풀이 내용이 같아 커밋을 건너뛰었습니다." : "문제 README와 풀이 코드를 한 커밋으로 저장했습니다.",
        commitUrl: commit.commitUrl || null,
      };
    } catch (error) {
      const message = this.githubAppService.getFailureMessage(error);
      await this.commandBus.execute(
        new UpdateGitHubSolutionStatusCommand(
          record.submissionId,
          "failed",
          message,
          null,
          new Date().toISOString()
        )
      );
      return {
        submissionId: record.submissionId,
        status: "failed",
        message,
        commitUrl: null,
      };
    }
  }

  private getCommitUrl(record: StoredSolutionRecord): string | null {
    return record.commitSha
      ? `https://github.com/${record.repositoryOwner}/${record.repositoryName}/commit/${record.commitSha}`
      : null;
  }
}
