import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseDto {
  @ApiProperty({
    type: Number,
    example: 400,
    description: "HTTP status code.",
  })
  readonly statusCode!: number;

  @ApiProperty({
    type: String,
    example: "programmerHandle: Too small: expected string to have >=1 characters",
    description: "Error message returned by Nest exception filters.",
  })
  readonly message!: string;

  @ApiProperty({
    type: String,
    required: false,
    example: "Bad Request",
    description: "HTTP error label when Nest includes one.",
  })
  readonly error?: string;
}
