import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

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
  create(@Body(new ZodValidationPipe(purchaseCategorySchema)) body: unknown) {
    return this.purchaseCategoriesService.create(body as never);
  }

  @Patch(":id")
  @Roles(RoleCode.ADMIN)
  update(@Param("id") id: string, @Body(new ZodValidationPipe(purchaseCategorySchema.partial())) body: unknown) {
    return this.purchaseCategoriesService.update(id, body as never);
  }
}
