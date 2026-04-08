import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

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
  create(@Body(new ZodValidationPipe(ruleSchema)) body: unknown) {
    return this.rulesService.create(body as never);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(ruleSchema.partial())) body: unknown) {
    return this.rulesService.update(id, body as never);
  }
}
