import { Body, Controller, Get, Param, Patch, Post, UsePipes } from "@nestjs/common";

import { purchaseCategorySchema, RoleCode } from "@financial-system/types";

import { Roles } from "@/common/decorators/roles.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { PurchaseCategoriesService } from "./purchase-categories.service";

@Controller("purchase-categories")
export class PurchaseCategoriesController {
  constructor(private readonly purchaseCategoriesService: PurchaseCategoriesService) {}

  @Get()
  list() {
    return this.purchaseCategoriesService.list();
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @UsePipes(new ZodValidationPipe(purchaseCategorySchema))
  create(@Body() body: unknown) {
    return this.purchaseCategoriesService.create(body as never);
  }

  @Patch(":id")
  @Roles(RoleCode.ADMIN)
  @UsePipes(new ZodValidationPipe(purchaseCategorySchema.partial()))
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.purchaseCategoriesService.update(id, body as never);
  }
}

