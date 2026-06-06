import { ApiProperty } from "@nestjs/swagger";
import {
  BADGE_TIERS,
  type BadgeSyncPayload,
  type BadgeSyncResponse,
  type BadgeTier,
} from "@programmers-badge/shared-types";

export class BadgeSyncRequestDto implements BadgeSyncPayload {
  @ApiProperty({
    type: String,
    example: "jh8459",
    description: "Programmers profile handle.",
  })
  readonly programmerHandle!: string;

  @ApiProperty({
    type: String,
    example: "JH",
    description: "Public display name shown on the badge.",
  })
  readonly displayName!: string;

  @ApiProperty({
    type: Number,
    example: 128,
    minimum: 0,
    description: "Number of solved Programmers problems.",
  })
  readonly solvedCount!: number;

  @ApiProperty({
    type: Number,
    example: 250,
    minimum: 0,
    description: "Total comparable problem count for the profile snapshot.",
  })
  readonly solvedTotal!: number;

  @ApiProperty({
    type: Number,
    example: 4,
    minimum: 0,
    description: "Programmers skill level.",
  })
  readonly skillLevel!: number;

  @ApiProperty({
    type: Number,
    example: 12000,
    minimum: 0,
    description: "Programmers ranking score.",
  })
  readonly rankingScore!: number;

  @ApiProperty({
    type: Number,
    example: 55,
    minimum: 1,
    description: "Programmers ranking position.",
  })
  readonly rankingRank!: number;

  @ApiProperty({
    type: String,
    enum: BADGE_TIERS,
    enumName: "BadgeTier",
    example: "advanced",
    description: "Badge tier derived from the shared contract enum.",
  })
  readonly badgeTier!: BadgeTier;

  @ApiProperty({
    type: String,
    example: "2026-04-07T01:02:03.000Z",
    format: "date-time",
    description: "ISO datetime when the extension captured the profile snapshot.",
  })
  readonly syncedAt!: string;
}

export class BadgeSyncResponseDto extends BadgeSyncRequestDto implements BadgeSyncResponse {
  @ApiProperty({
    type: String,
    example: "a1b2c3d4e5f6",
    description: "Stable public badge slug for the programmer handle.",
  })
  readonly slug!: string;

  @ApiProperty({
    type: String,
    example: "https://api.programmers-badge.jh8459.com/badge/a1b2c3d4e5f6.svg",
    description: "Public full badge SVG URL.",
  })
  readonly badgeUrl!: string;

  @ApiProperty({
    type: String,
    example: "https://api.programmers-badge.jh8459.com/badge/a1b2c3d4e5f6-mini.svg",
    description: "Public mini badge SVG URL.",
  })
  readonly miniBadgeUrl!: string;

  @ApiProperty({
    type: String,
    example:
      "![Programmers Badge](https://api.programmers-badge.jh8459.com/badge/a1b2c3d4e5f6.svg)",
    description: "Markdown snippet for the full badge.",
  })
  readonly markdownSnippet!: string;

  @ApiProperty({
    type: String,
    example:
      "![Programmers Mini Badge](https://api.programmers-badge.jh8459.com/badge/a1b2c3d4e5f6-mini.svg)",
    description: "Markdown snippet for the mini badge.",
  })
  readonly miniMarkdownSnippet!: string;
}
