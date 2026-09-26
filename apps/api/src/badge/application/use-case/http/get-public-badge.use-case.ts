import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { publicBadgeSlugSchema } from "@programmers-badge/shared-types";

import { GetPublicBadgeQuery } from "../../query/get-public-badge.query";
import { BadgeAssetService, type BadgeAssetVariant } from "../../../infra/badge-asset.service";
import type { BadgeProfileRecord } from "../../../infra/badge-profile.repository";

@Injectable()
export class GetPublicBadgeUseCase {
  constructor(
    @Inject(QueryBus)
    private readonly queryBus: QueryBus,
    @Inject(BadgeAssetService)
    private readonly badgeAssetService: BadgeAssetService
  ) {}

  async execute({ slug, variant = "full" }: GetPublicBadgeUseCaseProps): Promise<string> {
    if (!publicBadgeSlugSchema.safeParse(slug).success) {
      throw new NotFoundException("Public badge was not found.");
    }

    const cachedBadgeSvg = this.badgeAssetService.readPublicBadge({ slug, variant });

    if (cachedBadgeSvg !== null) {
      return cachedBadgeSvg;
    }

    const badgeProfile = await this.queryBus.execute<GetPublicBadgeQuery, BadgeProfileRecord | null>(
      new GetPublicBadgeQuery({ slug })
    );

    if (!badgeProfile) {
      throw new NotFoundException("Public badge was not found.");
    }

    return this.badgeAssetService.writePublicBadge({ record: badgeProfile, variant });
  }
}

interface GetPublicBadgeUseCaseProps {
  readonly slug: string;
  readonly variant?: BadgeAssetVariant;
}
