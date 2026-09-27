import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  githubRepositorySettingsSchema,
  solutionRecordPayloadSchema,
  type GitHubRepositorySettings,
  type SolutionRecordPayload,
} from "@programmers-badge/shared-types";
import { z } from "zod";

import { ZodValidationPipe } from "../../../common/zod-validation.pipe";
import { GitHubUseCase } from "../../application/use-case/http/github.use-case";
import { getGitHubSessionToken, GitHubSessionGuard, SESSION_COOKIE_NAME, type GitHubAuthenticatedRequest } from "./github-session.guard";

const callbackQuerySchema = z.object({
  state: z.string().min(1).optional(),
  installation_id: z.coerce.number().int().positive().optional(),
  setup_action: z.enum(["install", "update"]).optional(),
  error: z.string().optional(),
});

const sessionLifetimeMs = 30 * 24 * 60 * 60_000;

@Controller("github")
export class GitHubHttpController {
  constructor(@Inject(GitHubUseCase) private readonly githubUseCase: GitHubUseCase) {}

  @Get("connect")
  async connect(@Res() response: Response): Promise<void> {
    const connection = await this.githubUseCase.startConnection({ now: new Date().toISOString() });
    response.redirect(302, connection.url);
  }

  @Get("callback")
  async callback(
    @Query() input: unknown,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<void> {
    const destination = new URL("/github/connected", this.githubUseCase.getPublicWebOrigin());
    const parsedQuery = callbackQuerySchema.safeParse(input);
    if (!parsedQuery.success) {
      destination.searchParams.set("status", "failed");
      response.redirect(302, destination.toString());
      return;
    }
    const query = parsedQuery.data;

    if (
      query.error ||
      !query.state ||
      query.installation_id === undefined ||
      query.setup_action === undefined
    ) {
      destination.searchParams.set("status", "failed");
      response.redirect(302, destination.toString());
      return;
    }

    try {
      const session = await this.githubUseCase.completeConnection({
        state: query.state,
        installationId: query.installation_id,
        now: new Date().toISOString(),
      });
      response.cookie(SESSION_COOKIE_NAME, session.token, {
        httpOnly: true,
        secure: request.secure,
        sameSite: "strict",
        path: "/",
        maxAge: sessionLifetimeMs,
      });
      destination.searchParams.set("status", "connected");
    } catch {
      destination.searchParams.set("status", "failed");
    }

    response.redirect(302, destination.toString());
  }

  @Get("connection")
  async getConnection(@Req() request: Request) {
    const connection = await this.githubUseCase.getConnection({
      sessionToken: getGitHubSessionToken(request.headers.cookie),
      now: new Date().toISOString(),
    });
    if (!connection) {
      return {
        connected: false,
        accountLogin: null,
        installationId: null,
        settings: null,
      };
    }
    return this.githubUseCase.toConnectionResponse({ connection });
  }

  @Get("repositories")
  @UseGuards(GitHubSessionGuard)
  repositories(@Req() request: GitHubAuthenticatedRequest) {
    return this.githubUseCase.listRepositories({ connection: request.githubConnection });
  }

  @Put("settings")
  @UseGuards(GitHubSessionGuard)
  saveSettings(
    @Req() request: GitHubAuthenticatedRequest,
    @Body(new ZodValidationPipe(githubRepositorySettingsSchema)) settings: GitHubRepositorySettings
  ) {
    return this.githubUseCase.saveSettings({
      connection: request.githubConnection,
      settings,
      now: new Date().toISOString(),
    });
  }

  @Delete("connection")
  @UseGuards(GitHubSessionGuard)
  async disconnect(
    @Req() request: GitHubAuthenticatedRequest,
    @Res() response: Response
  ): Promise<void> {
    await this.githubUseCase.disconnect({ connection: request.githubConnection });
    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: request.secure,
      sameSite: "strict",
      path: "/",
    });
    response.status(204).send();
  }

  @Get("failed-solutions")
  @UseGuards(GitHubSessionGuard)
  failedSolutions(@Req() request: GitHubAuthenticatedRequest) {
    return this.githubUseCase.listFailedSolutions({ connection: request.githubConnection });
  }

  @Post("solutions")
  @UseGuards(GitHubSessionGuard)
  recordSolution(
    @Req() request: GitHubAuthenticatedRequest,
    @Body(new ZodValidationPipe(solutionRecordPayloadSchema)) payload: SolutionRecordPayload
  ) {
    return this.githubUseCase.recordSolution({
      connection: request.githubConnection,
      payload,
      now: new Date().toISOString(),
    });
  }

  @Post("solutions/:submissionId/retry")
  @UseGuards(GitHubSessionGuard)
  retrySolution(
    @Req() request: GitHubAuthenticatedRequest,
    @Param("submissionId") submissionId: string
  ) {
    if (!z.string().uuid().safeParse(submissionId).success) {
      throw new BadRequestException("풀이 기록 식별자 형식이 올바르지 않습니다.");
    }
    return this.githubUseCase.retrySolution({
      connection: request.githubConnection,
      submissionId,
      now: new Date().toISOString(),
    });
  }
}
