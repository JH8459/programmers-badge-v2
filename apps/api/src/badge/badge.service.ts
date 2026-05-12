import { Injectable, NotFoundException } from "@nestjs/common";

import { BadgeProfileRepository } from "../persistence/badge-profile.repository";
import { BadgeAssetService } from "./badge-asset.service";

@Injectable()
export class BadgeService {
  constructor(
    private readonly badgeProfileRepository: BadgeProfileRepository,
    private readonly badgeAssetService: BadgeAssetService
  ) {}

  renderPublicBadge(slug: string): string {
    const cachedBadgeSvg = this.badgeAssetService.readPublicBadge({ slug });

    if (cachedBadgeSvg) {
      return cachedBadgeSvg;
    }

    const badgeProfile = this.badgeProfileRepository.findByPublicSlug({ publicSlug: slug });

    if (!badgeProfile) {
      throw new NotFoundException(`Public badge '${slug}' was not found.`);
    }

    return this.badgeAssetService.writePublicBadge({ record: badgeProfile });
  }

  renderPublicMiniBadge(slug: string): string {
    const cachedBadgeSvg = this.badgeAssetService.readPublicBadge({ slug, variant: "mini" });

    if (cachedBadgeSvg) {
      return cachedBadgeSvg;
    }

    const badgeProfile = this.badgeProfileRepository.findByPublicSlug({ publicSlug: slug });

    if (!badgeProfile) {
      throw new NotFoundException(`Public mini badge '${slug}' was not found.`);
    }

    return this.badgeAssetService.writePublicBadge({ record: badgeProfile, variant: "mini" });
  }
}
