import { Injectable, NotFoundException } from "@nestjs/common";
import { createProgrammersBadgeRenderModel, renderBadgeSvg } from "@programmers-badge/badge-core";

import { BadgeProfileRepository } from "../persistence/badge-profile.repository";

@Injectable()
export class BadgeService {
  constructor(private readonly badgeProfileRepository: BadgeProfileRepository) {}

  renderPublicBadge(slug: string): string {
    const badgeProfile = this.badgeProfileRepository.findByPublicSlug(slug);

    if (!badgeProfile) {
      throw new NotFoundException(`Public badge '${slug}' was not found.`);
    }

    return renderBadgeSvg(
      createProgrammersBadgeRenderModel({
        badgeTier: badgeProfile.badgeTier,
        solvedCount: badgeProfile.solvedCount,
      })
    );
  }
}
