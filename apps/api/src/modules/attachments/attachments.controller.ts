import { Body, Controller, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";

import { AttachmentsService } from "./attachments.service";

@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post("attachments/upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query("isInvoiceFile") isInvoiceFile: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.attachmentsService.upload(file, isInvoiceFile === "true", user);
  }

  @Post("expenses/:id/attachments")
  attachToExpense(@Param("id") id: string, @Body() body: { attachmentIds: string[] }, @CurrentUser() user: AuthenticatedUser) {
    return this.attachmentsService.linkToExpense(id, body.attachmentIds || [], user);
  }

  @Get("expenses/:id/attachments")
  listByExpense(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attachmentsService.listByReport(id, user);
  }

  @Get("attachments/files/:id")
  async file(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Res() response: Response) {
    const file = await this.attachmentsService.getFile(id, user);
    response.setHeader("Content-Type", file.fileType);
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    response.send(file.buffer);
  }

  @Public()
  @Get("attachments/public/:id")
  async publicFile(@Param("id") id: string, @Query("token") token: string, @Res() response: Response) {
    const file = await this.attachmentsService.getFileByAccessToken(id, token || "");
    response.setHeader("Content-Type", file.fileType);
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    response.send(file.buffer);
  }
}
