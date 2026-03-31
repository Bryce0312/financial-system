import { Controller, Get, Query, UsePipes } from "@nestjs/common";

import { RoleCode, statsQuerySchema } from "@financial-system/types";

import { Roles } from "@/common/decorators/roles.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { StatsService } from "./stats.service";

@Controller("admin/stats")
@Roles(RoleCode.ADMIN)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("overview")
  @UsePipes(new ZodValidationPipe(statsQuerySchema))
  overview(@Query() query: unknown) {
    const payload = query as { month: string };
    return this.statsService.overview(payload.month);
  }

  @Get("by-category")
  @UsePipes(new ZodValidationPipe(statsQuerySchema))
  byCategory(@Query() query: unknown) {
    const payload = query as { month: string };
    return this.statsService.byCategory(payload.month);
  }

  @Get("by-employee")
  @UsePipes(new ZodValidationPipe(statsQuerySchema))
  byEmployee(@Query() query: unknown) {
    const payload = query as { month: string };
    return this.statsService.byEmployee(payload.month);
  }

  @Get("by-purchase-category")
  @UsePipes(new ZodValidationPipe(statsQuerySchema))
  byPurchaseCategory(@Query() query: unknown) {
    const payload = query as { month: string };
    return this.statsService.byPurchaseCategory(payload.month);
  }
}

