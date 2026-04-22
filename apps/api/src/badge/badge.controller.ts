import { Controller, Get, Header, Param } from "@nestjs/common";

import { BadgeService } from "./badge.service";

@Controller("badge")
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get(":slug.svg")
  @Header("Content-Type", "image/svg+xml")
  getBadgeSvg(@Param("slug") slug: string): string {
    return this.badgeService.renderPublicBadge(slug);
  }
}
