import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { readApiRuntimeConfig } from "../../../common/runtime-config";
import type { GitHubConnectionRecord } from "../../infra/github.repository";
import { GitHubUseCase } from "../../application/use-case/http/github.use-case";

export interface GitHubAuthenticatedRequest extends Request {
  githubConnection: GitHubConnectionRecord;
}

const SESSION_COOKIE_NAME = "programmers_badge_github_session";

export const getGitHubSessionToken = (cookieHeader: string | undefined): string | undefined => {
  const cookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  const token = cookie?.slice(SESSION_COOKIE_NAME.length + 1);
  return token && /^[A-Za-z0-9_-]{40,80}$/.test(token) ? token : undefined;
};

@Injectable()
export class GitHubSessionGuard implements CanActivate {
  constructor(@Inject(GitHubUseCase) private readonly githubUseCase: GitHubUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GitHubAuthenticatedRequest>();
    const origin = request.headers.origin;
    if (!origin || !readApiRuntimeConfig().allowedExtensionOrigins.includes(origin)) {
      throw new ForbiddenException("GitHub API 요청은 허용된 확장 프로그램에서만 실행할 수 있습니다.");
    }

    const connection = await this.githubUseCase.getConnection({
      sessionToken: getGitHubSessionToken(request.headers.cookie),
      now: new Date().toISOString(),
    });
    if (!connection) {
      throw new UnauthorizedException("GitHub 연결 세션이 없거나 만료됐습니다. 다시 연결해 주세요.");
    }
    request.githubConnection = connection;
    return true;
  }
}

export { SESSION_COOKIE_NAME };
