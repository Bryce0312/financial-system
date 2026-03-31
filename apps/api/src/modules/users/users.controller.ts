import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { resetPasswordSchema, RoleCode } from "@financial-system/types";

import { Roles } from "@/common/decorators/roles.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { UsersService } from "./users.service";

@Controller("admin/users")
@Roles(RoleCode.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers() {
    return this.usersService.listUsers();
  }

  @Post(":id/reset-password")
  resetPassword(@Param("id") id: string, @Body(new ZodValidationPipe(resetPasswordSchema)) body: unknown) {
    const payload = body as { password: string };
    return this.usersService.resetPassword(id, payload.password);
  }
}