import { Inject } from "@nestjs/common";
import { Query, QueryHandler, type IQueryHandler } from "@nestjs/cqrs";

import {
  GitHubRepository as GitHubRepositoryStore,
  type GitHubConnectionRecord,
  type StoredSolutionRecord,
} from "../../infra/github.repository";

export class FindGitHubConnectionBySessionQuery extends Query<GitHubConnectionRecord | null> {
  constructor(public readonly token: string, public readonly now: string) { super(); }
}

@QueryHandler(FindGitHubConnectionBySessionQuery)
export class FindGitHubConnectionBySessionQueryHandler
  implements IQueryHandler<FindGitHubConnectionBySessionQuery>
{
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  execute(query: FindGitHubConnectionBySessionQuery) {
    return this.repository.findConnectionBySession({ token: query.token, now: query.now });
  }
}

export class FindGitHubSolutionQuery extends Query<StoredSolutionRecord | null> {
  constructor(public readonly submissionId: string, public readonly githubAccountId: string) { super(); }
}

@QueryHandler(FindGitHubSolutionQuery)
export class FindGitHubSolutionQueryHandler implements IQueryHandler<FindGitHubSolutionQuery> {
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  execute(query: FindGitHubSolutionQuery) {
    return this.repository.findSolution({
      submissionId: query.submissionId,
      githubAccountId: query.githubAccountId,
    });
  }
}

export class ListFailedGitHubSolutionsQuery extends Query<StoredSolutionRecord[]> {
  constructor(public readonly githubAccountId: string, public readonly limit: number) { super(); }
}

@QueryHandler(ListFailedGitHubSolutionsQuery)
export class ListFailedGitHubSolutionsQueryHandler
  implements IQueryHandler<ListFailedGitHubSolutionsQuery>
{
  constructor(@Inject(GitHubRepositoryStore) private readonly repository: GitHubRepositoryStore) {}
  execute(query: ListFailedGitHubSolutionsQuery) {
    return this.repository.listFailedSolutions({
      githubAccountId: query.githubAccountId,
      limit: query.limit,
    });
  }
}
