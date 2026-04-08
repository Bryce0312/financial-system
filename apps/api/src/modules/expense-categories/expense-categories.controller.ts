import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { expenseCategorySchema, RoleCode } from "@financial-system/types";

import { Roles } from "@/common/decorators/roles.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { ExpenseCategoriesService } from "./expense-categories.service";

@Controller("expense-categories")
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Get()
  list() {
    return this.expenseCategoriesService.list();
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  create(@Body(new ZodValidationPipe(expenseCategorySchema)) body: unknown) {
    return this.expenseCategoriesService.create(body as never);
  }

  @Patch(":id")
  @Roles(RoleCode.ADMIN)
  update(@Param("id") id: string, @Body(new ZodValidationPipe(expenseCategorySchema.partial())) body: unknown) {
    return this.expenseCategoriesService.update(id, body as never);
  }
}
