import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { isChromeExtensionOrigin } from "../../../cors";
import type { GitHubConnectionRecord } from "../../infra/github.repository";
import { GitHubUseCase } from "../../application/use-case/http/github.use-case";

export interface GitHubHttpRequest {
  method?: string;
  headers: {
    origin?: string;
    cookie?: string;
    "sec-fetch-site"?: string;
    "sec-fetch-mode"?: string;
    "sec-fetch-dest"?: string;
  };
  secure: boolean;
}

export interface GitHubAuthenticatedRequest extends GitHubHttpRequest {
  githubConnection: GitHubConnectionRecord;
}

const SESSION_COOKIE_NAME = "programmers_badge_github_session";

const isAllowedGitHubRequestContext = ({
  request,
}: {
  request: GitHubHttpRequest;
}): boolean => {
  if (request.headers.origin !== undefined) {
    return isChromeExtensionOrigin(request.headers.origin);
  }

  if (request.method !== "GET") {
    return false;
  }

  // Origin이 생략된 읽기 요청은 관측된 Chrome extension fetch 맥락만 허용한다.
  return (
    request.headers["sec-fetch-site"] === "none" &&
    request.headers["sec-fetch-mode"] === "cors" &&
    request.headers["sec-fetch-dest"] === "empty"
  );
};

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
    if (!isAllowedGitHubRequestContext({ request })) {
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
