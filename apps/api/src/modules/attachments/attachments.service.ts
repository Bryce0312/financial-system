import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import path from "node:path";

import { RoleCode } from "@financial-system/types";

import { StorageService } from "@/common/storage/storage.service";
import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService
  ) {}

  async upload(file: Express.Multer.File, isInvoiceFile: boolean, user: AuthenticatedUser) {
    const extension = path.extname(file.originalname) || ".bin";
    const storageKey = `attachments/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;

    await this.storageService.uploadBuffer(storageKey, file.buffer, file.mimetype || "application/octet-stream");

    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileType: file.mimetype || "application/octet-stream",
        fileSize: file.size,
        storageKey,
        isInvoiceFile,
        uploadedById: user.id
      }
    });

    return this.serializeAttachment(attachment);
  }

  async linkToExpense(reportId: string, attachmentIds: string[], user: AuthenticatedUser) {
    const report = await this.prisma.expenseReport.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException("报销不存在");
    }

    if (!user.roles.includes(RoleCode.ADMIN) && report.userId !== user.id) {
      throw new ForbiddenException("无权关联该报销附件");
    }

    await this.prisma.attachment.updateMany({
      where: {
        id: {
          in: attachmentIds
        },
        uploadedById: user.id,
        reportId: null
      },
      data: {
        reportId
      }
    });

    return this.listByReport(reportId, user);
  }

  async listByReport(reportId: string, user: AuthenticatedUser) {
    const report = await this.prisma.expenseReport.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException("报销不存在");
    }

    if (!user.roles.includes(RoleCode.ADMIN) && report.userId !== user.id) {
      throw new ForbiddenException("无权查看该报销附件");
    }

    const attachments = await this.prisma.attachment.findMany({
      where: { reportId },
      orderBy: { createdAt: "asc" }
    });

    return attachments.map((attachment) => this.serializeAttachment(attachment));
  }

  async getFile(attachmentId: string, user: AuthenticatedUser) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        report: true
      }
    });

    if (!attachment) {
      throw new NotFoundException("附件不存在");
    }

    if (attachment.report && !user.roles.includes(RoleCode.ADMIN) && attachment.report.userId !== user.id) {
      throw new ForbiddenException("无权访问该附件");
    }

    const file = await this.storageService.readObject(attachment.storageKey);

    return {
      fileName: attachment.fileName,
      fileType: attachment.fileType || file.contentType,
      buffer: file.buffer
    };
  }

  private serializeAttachment(attachment: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    isInvoiceFile: boolean;
  }) {
    const apiUrl = this.configService.get<string>("API_URL", "http://localhost:3001");

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      isInvoiceFile: attachment.isInvoiceFile,
      previewUrl: `${apiUrl}/attachments/files/${attachment.id}`
    };
  }
}

