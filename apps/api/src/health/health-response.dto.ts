import { ApiProperty } from "@nestjs/swagger";

export class HealthResponseDto {
  @ApiProperty({
    type: String,
    example: "ok",
    description: "API readiness status.",
  })
  readonly status!: string;

  @ApiProperty({
    type: String,
    example: "api",
    description: "Service identifier.",
  })
  readonly service!: string;

  @ApiProperty({
    type: String,
    enum: ["ok", "error"],
    enumName: "DatabaseHealthStatus",
    example: "ok",
    description: "SQLite readiness status.",
  })
  readonly database!: string;
}
