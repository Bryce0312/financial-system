import { Body, Controller, Get, Param, Patch, Post, UsePipes } from "@nestjs/common";

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
  @UsePipes(new ZodValidationPipe(expenseCategorySchema))
  create(@Body() body: unknown) {
    return this.expenseCategoriesService.create(body as never);
  }

  @Patch(":id")
  @Roles(RoleCode.ADMIN)
  @UsePipes(new ZodValidationPipe(expenseCategorySchema.partial()))
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.expenseCategoriesService.update(id, body as never);
  }
}

