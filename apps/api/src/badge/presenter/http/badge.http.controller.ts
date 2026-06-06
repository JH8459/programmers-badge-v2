import { Controller, Get, Header, Inject, Param } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";

import { ErrorResponseDto } from "../../../common/http/error-response.dto";
import { GetPublicBadgeUseCase } from "../../application/use-case/http/get-public-badge.use-case";

const svgResponseContent = {
  "image/svg+xml": {
    schema: {
      type: "string",
      example: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    },
  },
};

@ApiTags("Badge")
@Controller("badge")
export class BadgeHttpController {
  constructor(
    @Inject(GetPublicBadgeUseCase) private readonly getPublicBadgeUseCase: GetPublicBadgeUseCase
  ) {}

  @Get(":slug.svg")
  @Header("Content-Type", "image/svg+xml")
  @ApiOperation({ summary: "Get a public full badge SVG." })
  @ApiParam({
    name: "slug",
    example: "a1b2c3d4e5f6",
    description: "Stable public badge slug.",
  })
  @ApiProduces("image/svg+xml")
  @ApiOkResponse({
    description: "Full badge SVG.",
    content: svgResponseContent,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: "No badge snapshot exists for the slug.",
  })
  getBadgeSvg(@Param("slug") slug: string): Promise<string> {
    return this.getPublicBadgeUseCase.execute({ slug });
  }

  @Get(":slug/mini.svg")
  @Header("Content-Type", "image/svg+xml")
  @ApiOperation({ summary: "Get a public mini badge SVG." })
  @ApiParam({
    name: "slug",
    example: "a1b2c3d4e5f6",
    description: "Stable public badge slug.",
  })
  @ApiProduces("image/svg+xml")
  @ApiOkResponse({
    description: "Mini badge SVG.",
    content: svgResponseContent,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: "No badge snapshot exists for the slug.",
  })
  getMiniBadgeSvg(@Param("slug") slug: string): Promise<string> {
    return this.getPublicBadgeUseCase.execute({ slug, variant: "mini" });
  }
}
