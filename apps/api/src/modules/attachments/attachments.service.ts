import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
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

  async getFileByAccessToken(attachmentId: string, token: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      throw new NotFoundException("附件不存在");
    }

    if (!this.verifyAccessToken(attachmentId, token)) {
      throw new ForbiddenException("附件访问链接无效或已过期");
    }

    const file = await this.storageService.readObject(attachment.storageKey);

    return {
      fileName: attachment.fileName,
      fileType: attachment.fileType || file.contentType,
      buffer: file.buffer
    };
  }

  buildPreviewAccessUrl(attachmentId: string) {
    const apiUrl = this.configService.get<string>("API_URL", "http://localhost:3001");
    const token = this.createAccessToken(attachmentId);
    return `${apiUrl}/attachments/public/${attachmentId}?token=${encodeURIComponent(token)}`;
  }

  private createAccessToken(attachmentId: string) {
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 365;
    const payload = `${attachmentId}.${expiresAt}`;
    const signature = this.sign(payload);
    return `${expiresAt}.${signature}`;
  }

  private verifyAccessToken(attachmentId: string, token: string) {
    const [expiresAtRaw, signature] = token.split(".");
    const expiresAt = Number(expiresAtRaw);

    if (!Number.isFinite(expiresAt) || !signature || Date.now() > expiresAt) {
      return false;
    }

    const expected = this.sign(`${attachmentId}.${expiresAt}`);
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private sign(value: string) {
    const secret = this.configService.get<string>("ATTACHMENT_LINK_SECRET") || this.configService.get<string>("JWT_SECRET", "dev-secret");
    return createHmac("sha256", secret).update(value).digest("hex");
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
