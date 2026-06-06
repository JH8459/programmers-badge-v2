import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { HealthResponseDto } from "./health-response.dto";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Get API readiness state." })
  @ApiOkResponse({
    type: HealthResponseDto,
    description: "API service and SQLite readiness state.",
  })
  getHealth(): HealthResponseDto {
    return this.healthService.getHealth();
  }
}
