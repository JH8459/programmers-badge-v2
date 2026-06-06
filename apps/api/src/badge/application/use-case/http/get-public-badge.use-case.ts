import { Injectable, NotFoundException } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";

import { GetPublicBadgeQuery } from "../../query/get-public-badge.query";
import { BadgeAssetService, type BadgeAssetVariant } from "../../../infra/badge-asset.service";
import type { BadgeProfileRecord } from "../../../infra/badge-profile.repository";

@Injectable()
export class GetPublicBadgeUseCase {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly badgeAssetService: BadgeAssetService
  ) {}

  async execute({ slug, variant = "full" }: GetPublicBadgeUseCaseProps): Promise<string> {
    const cachedBadgeSvg = this.badgeAssetService.readPublicBadge({ slug, variant });

    if (cachedBadgeSvg) {
      return cachedBadgeSvg;
    }

    const badgeProfile = await this.queryBus.execute<GetPublicBadgeQuery, BadgeProfileRecord | null>(
      new GetPublicBadgeQuery({ slug })
    );

    if (!badgeProfile) {
      const badgeName = variant === "mini" ? "Public mini badge" : "Public badge";

      throw new NotFoundException(`${badgeName} '${slug}' was not found.`);
    }

    return this.badgeAssetService.writePublicBadge({ record: badgeProfile, variant });
  }
}

interface GetPublicBadgeUseCaseProps {
  readonly slug: string;
  readonly variant?: BadgeAssetVariant;
}
