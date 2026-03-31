import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";

import { RoleCode, createExpenseSchema, expenseListQuerySchema } from "@financial-system/types";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { ExpensesService } from "./expenses.service";

@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post("expenses")
  create(@Body(new ZodValidationPipe(createExpenseSchema)) body: unknown, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.create(body as never, user);
  }

  @Get("expenses/my")
  myExpenses(@Query(new ZodValidationPipe(expenseListQuerySchema.partial())) query: unknown, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.listMine(user, query as never);
  }

  @Get("expenses/:id")
  detail(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expensesService.getDetail(id, user);
  }

  @Get("admin/expenses")
  @Roles(RoleCode.ADMIN)
  adminExpenses(@Query(new ZodValidationPipe(expenseListQuerySchema.partial())) query: unknown) {
    return this.expensesService.listAdmin(query as never);
  }
}