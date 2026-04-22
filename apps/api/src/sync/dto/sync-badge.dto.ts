import { Transform } from "class-transformer";
import { IsIn, IsInt, IsISO8601, IsNotEmpty, IsString, Min } from "class-validator";

import { BADGE_TIERS, type BadgeSyncPayload } from "@programmers-badge/shared-types";

export class SyncBadgeDto implements BadgeSyncPayload {
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  programmerHandle!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  displayName!: string;

  @IsInt()
  @Min(0)
  solvedCount!: number;

  @IsInt()
  @Min(0)
  solvedTotal!: number;

  @IsInt()
  @Min(0)
  skillLevel!: number;

  @IsInt()
  @Min(0)
  rankingScore!: number;

  @IsInt()
  @Min(1)
  rankingRank!: number;

  @IsIn(BADGE_TIERS)
  badgeTier!: BadgeSyncPayload["badgeTier"];

  @IsISO8601()
  syncedAt!: string;
}
