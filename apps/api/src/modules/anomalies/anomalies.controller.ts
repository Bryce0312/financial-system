import { Controller, Get, Query, UsePipes } from "@nestjs/common";

import { anomalyListQuerySchema, RoleCode } from "@financial-system/types";

import { Roles } from "@/common/decorators/roles.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { AnomaliesService } from "./anomalies.service";

@Controller("admin/anomalies")
@Roles(RoleCode.ADMIN)
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(anomalyListQuerySchema.partial()))
  list(@Query() query: unknown) {
    return this.anomaliesService.list(query as never);
  }
}

