import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import { Response } from "express";

import { RoleCode, exportRequestSchema } from "@financial-system/types";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";

import { ExportsService } from "./exports.service";

@Controller("admin/exports")
@Roles(RoleCode.ADMIN)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post("monthly")
  create(@Body(new ZodValidationPipe(exportRequestSchema)) body: unknown, @CurrentUser() user: AuthenticatedUser) {
    return this.exportsService.createJob(body as never, user);
  }

  @Get(":id")
  getJob(@Param("id") id: string) {
    return this.exportsService.getJob(id);
  }

  @Get(":id/download")
  async download(@Param("id") id: string, @Res() response: Response) {
    const file = await this.exportsService.download(id);
    response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", `attachment; filename="financial-export-${id}.xlsx"`);
    response.send(file.buffer);
  }
}