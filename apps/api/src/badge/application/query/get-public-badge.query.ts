import { Query, QueryHandler, type IQueryHandler } from "@nestjs/cqrs";

import {
  BadgeProfileRepository,
  type BadgeProfileRecord,
} from "../../infra/badge-profile.repository";

export class GetPublicBadgeQuery extends Query<BadgeProfileRecord | null> {
  constructor(public readonly props: GetPublicBadgeQueryProps) {
    super();
  }
}

@QueryHandler(GetPublicBadgeQuery)
export class GetPublicBadgeQueryHandler implements IQueryHandler<GetPublicBadgeQuery> {
  constructor(private readonly badgeProfileRepository: BadgeProfileRepository) {}

  async execute(query: GetPublicBadgeQuery): Promise<BadgeProfileRecord | null> {
    return this.badgeProfileRepository.findByPublicSlug({
      publicSlug: query.props.slug,
    });
  }
}

interface GetPublicBadgeQueryProps {
  readonly slug: string;
}
