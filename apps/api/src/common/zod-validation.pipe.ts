import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";

interface ValidationIssue {
  path: PropertyKey[];
  message: string;
}

interface ValidationFailure {
  issues: ValidationIssue[];
}

type SafeParseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ValidationFailure;
    };

interface SafeParseSchema<T> {
  safeParse(input: unknown): SafeParseResult<T>;
}

// Nest는 예외를 던지는 흐름이 자연스러워서 zod 이슈를 한 줄 메시지로 평탄화한다.
const formatValidationIssue = (issue: ValidationIssue): string => {
  const path = issue.path.length ? issue.path.join(".") : "body";
  return `${path}: ${issue.message}`;
};

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: SafeParseSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new BadRequestException(result.error.issues.map(formatValidationIssue).join("; "));
  }
}
