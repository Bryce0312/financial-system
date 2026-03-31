import { Body, Controller, Get, Post, UsePipes } from "@nestjs/common";

import { loginSchema, registerSchema } from "@financial-system/types";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @UsePipes(new ZodValidationPipe(registerSchema))
  register(@Body() body: unknown) {
    return this.authService.register(body as never);
  }

  @Public()
  @Post("login")
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() body: unknown) {
    return this.authService.login(body as never);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }
}

