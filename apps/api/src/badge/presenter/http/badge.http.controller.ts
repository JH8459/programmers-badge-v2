import { createHash } from "node:crypto";

import { Controller, Get, Inject, Param, Req, Res } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
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

interface SendSvgResponseInput {
  request: BadgeHttpRequest;
  response: BadgeHttpResponse;
  svg: string;
}

interface BadgeHttpRequest {
  readonly headers: {
    readonly [header: string]: string | string[] | undefined;
  };
}

interface BadgeHttpResponse {
  setHeader(name: string, value: string): unknown;
  status(statusCode: number): BadgeHttpResponse;
  end(): unknown;
  send(body: string): unknown;
}

const matchesEntityTag = (header: string | string[] | undefined, entityTag: string): boolean =>
  (Array.isArray(header) ? header : [header])
    .filter((value): value is string => value !== undefined)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .some((value) => value === "*" || value === entityTag || value === `W/${entityTag}`);

@ApiTags("Badge")
@Controller("badge")
export class BadgeHttpController {
  constructor(
    @Inject(GetPublicBadgeUseCase) private readonly getPublicBadgeUseCase: GetPublicBadgeUseCase
  ) {}

  private sendSvg({ request, response, svg }: SendSvgResponseInput): void {
    const entityTag = `"${createHash("sha256").update(svg).digest("hex")}"`;

    response.setHeader("Content-Type", "image/svg+xml");
    response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    response.setHeader("ETag", entityTag);

    if (matchesEntityTag(request.headers["if-none-match"], entityTag)) {
      response.status(304).end();
      return;
    }

    response.status(200).send(svg);
  }

  @Get(":slug.svg")
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
  @ApiResponse({ status: 304, description: "Badge SVG has not changed." })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: "The slug is malformed or no badge snapshot exists.",
  })
  async getBadgeSvg(
    @Param("slug") slug: string,
    @Req() request: BadgeHttpRequest,
    @Res() response: BadgeHttpResponse
  ): Promise<void> {
    const svg = await this.getPublicBadgeUseCase.execute({ slug });
    this.sendSvg({ request, response, svg });
  }

  @Get(":slug/mini.svg")
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
  @ApiResponse({ status: 304, description: "Badge SVG has not changed." })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: "The slug is malformed or no badge snapshot exists.",
  })
  async getMiniBadgeSvg(
    @Param("slug") slug: string,
    @Req() request: BadgeHttpRequest,
    @Res() response: BadgeHttpResponse
  ): Promise<void> {
    const svg = await this.getPublicBadgeUseCase.execute({ slug, variant: "mini" });
    this.sendSvg({ request, response, svg });
  }
}
