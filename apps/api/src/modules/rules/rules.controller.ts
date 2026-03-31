import { Body, Controller, Get, Param, Patch, Post, UsePipes } from "@nestjs/common";

import { RoleCode, ruleSchema } from "@financial-system/types";

import { Roles } from "@/common/decorators/roles.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { RulesService } from "./rules.service";

@Controller("rules")
@Roles(RoleCode.ADMIN)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  list() {
    return this.rulesService.list();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ruleSchema))
  create(@Body() body: unknown) {
    return this.rulesService.create(body as never);
  }

  @Patch(":id")
  @UsePipes(new ZodValidationPipe(ruleSchema.partial()))
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.rulesService.update(id, body as never);
  }
}

