import { Controller, Get, Header, Param } from "@nestjs/common";

import { GetPublicBadgeUseCase } from "../../application/use-case/http/get-public-badge.use-case";

@Controller("badge")
export class BadgeHttpController {
  constructor(private readonly getPublicBadgeUseCase: GetPublicBadgeUseCase) {}

  @Get(":slug.svg")
  @Header("Content-Type", "image/svg+xml")
  getBadgeSvg(@Param("slug") slug: string): Promise<string> {
    return this.getPublicBadgeUseCase.execute({ slug });
  }

  @Get(":slug/mini.svg")
  @Header("Content-Type", "image/svg+xml")
  getMiniBadgeSvg(@Param("slug") slug: string): Promise<string> {
    return this.getPublicBadgeUseCase.execute({ slug, variant: "mini" });
  }
}
