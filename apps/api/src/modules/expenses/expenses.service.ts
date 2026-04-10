import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import {
  AnomalySeverity,
  AnomalyType,
  CreateExpenseInput,
  ExpenseExtensionType,
  ExpenseListQuery,
  ExpenseReportStatus,
  InvoiceAttachmentStatus,
  RoleCode,
  TimeBasis
} from "@financial-system/types";

import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";
import { getMonthRange } from "@/common/utils/date-range";
import { decimalToNumber, optionalDecimalToNumber } from "@/common/utils/number";
import { PrismaService } from "@/prisma/prisma.service";

import { AttachmentsService } from "../attachments/attachments.service";
import { RulesService } from "../rules/rules.service";

const expenseInclude = {
  user: true,
  category: true,
  normalDetail: true,
  travelDetail: true,
  purchaseDetail: {
    include: {
      purchaseCategory: true
    }
  },
  attachments: true,
  anomalies: true
};

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesService: RulesService,
    private readonly attachmentsService: AttachmentsService
  ) {}

  async create(input: CreateExpenseInput, user: AuthenticatedUser) {
    const category = await this.prisma.expenseCategory.findUnique({ where: { id: input.categoryId } });
    if (!category || !category.enabled) {
      throw new BadRequestException("报销类别不存在或已停用");
    }

    if (category.extensionType !== input.extensionType) {
      throw new BadRequestException("报销类别与表单类型不匹配");
    }

    const attachmentRows = input.attachments.length
      ? await this.prisma.attachment.findMany({
          where: {
            id: {
              in: input.attachments.map((item) => item.id)
            },
            uploadedById: user.id
          }
        })
      : [];

    if (attachmentRows.length !== input.attachments.length) {
      throw new BadRequestException("存在不可用的附件");
    }

    const invoiceAttachmentStatus = this.resolveInvoiceAttachmentStatus(category.invoiceRequired, input.hasInvoice, input.attachments);
    const rule = category.limitEnabled ? await this.rulesService.findActiveRule(category.id, new Date(`${input.expenseDate}T00:00:00.000Z`)) : null;
    const limitAmount = rule ? decimalToNumber(rule.limitAmount) : null;
    const amountTotal = Number(input.amountTotal);
    const overLimitAmount = limitAmount !== null && amountTotal > limitAmount ? amountTotal - limitAmount : 0;
    const isOverLimit = overLimitAmount > 0;

    const anomalies = this.buildAnomalies({
      amountTotal,
      category,
      input,
      invoiceAttachmentStatus,
      isOverLimit,
      overLimitAmount,
      limitAmount
    });

    const report = await this.prisma.$transaction(async (tx: any) => {
      const created = await tx.expenseReport.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          title: input.title,
          amountTotal,
          expenseDate: new Date(`${input.expenseDate}T00:00:00.000Z`),
          submittedAt: new Date(),
          uploadMethod: input.uploadMethod,
          hasInvoice: input.hasInvoice,
          invoiceRequiredSnapshot: category.invoiceRequired,
          invoiceAttachmentStatus,
          isOverLimit,
          overLimitAmount,
          status: ExpenseReportStatus.SUBMITTED,
          remark: input.remark || null
        }
      });

      if (input.extensionType === ExpenseExtensionType.NONE) {
        await tx.expenseNormalDetail.create({
          data: {
            reportId: created.id,
            entryMode: input.entryMode,
            usageScene: input.usageScene || null,
            travelNote: input.travelNote || null,
            relatedPeople: input.relatedPeople || null,
            unitPrice: input.unitPrice,
            quantity: input.quantity
          }
        });
      }

      if (input.extensionType === ExpenseExtensionType.TRAVEL) {
        await tx.expenseTravelDetail.create({
          data: {
            reportId: created.id,
            tripStartDate: new Date(`${input.tripStartDate}T00:00:00.000Z`),
            tripEndDate: new Date(`${input.tripEndDate}T00:00:00.000Z`),
            claimDays: input.claimDays,
            destination: input.destination,
            tripReason: input.tripReason || null,
            travelerName: input.travelerName,
            companions: input.companions || null,
            travelStandard: input.travelStandard || null
          }
        });
      }

      if (input.extensionType === ExpenseExtensionType.PURCHASE) {
        await tx.expensePurchaseDetail.create({
          data: {
            reportId: created.id,
            productName: input.productName,
            purchaseCategoryId: input.purchaseCategoryId,
            purchaserName: input.purchaserName,
            userName: input.userName || null,
            unitPrice: input.unitPrice,
            quantity: input.quantity,
            shippingFee: input.shippingFee,
            platform: input.platform || null,
            vendorName: input.vendorName || null,
            productNote: input.productNote || null
          }
        });
      }

      if (input.attachments.length) {
        const attachmentMap = new Map(input.attachments.map((item) => [item.id, item.isInvoiceFile]));
        for (const attachment of attachmentRows) {
          await tx.attachment.update({
            where: { id: attachment.id },
            data: {
              reportId: created.id,
              isInvoiceFile: attachmentMap.get(attachment.id) ?? false
            }
          });
        }
      }

      for (const anomaly of anomalies) {
        await tx.expenseAnomaly.create({
          data: {
            reportId: created.id,
            anomalyType: anomaly.anomalyType,
            anomalyMessage: anomaly.anomalyMessage,
            severity: anomaly.severity
          }
        });
      }

      return tx.expenseReport.findUniqueOrThrow({ where: { id: created.id }, include: expenseInclude });
    });

    return this.serializeDetail(report);
  }

  async listMine(user: AuthenticatedUser, query: ExpenseListQuery) {
    const reports = await this.prisma.expenseReport.findMany({
      where: this.buildWhere(query, { userId: user.id }),
      include: expenseInclude,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }]
    });
    return reports.map((report: any) => this.serializeSummary(report));
  }

  async listAdmin(query: ExpenseListQuery) {
    const reports = await this.prisma.expenseReport.findMany({
      where: this.buildWhere(query),
      include: expenseInclude,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }]
    });
    return reports.map((report: any) => this.serializeSummary(report));
  }

  async getDetail(id: string, user: AuthenticatedUser) {
    const report = await this.prisma.expenseReport.findUnique({ where: { id }, include: expenseInclude });
    if (!report) {
      throw new NotFoundException("报销不存在");
    }
    if (!user.roles.includes(RoleCode.ADMIN) && report.userId !== user.id) {
      throw new ForbiddenException("无权查看该报销");
    }
    return this.serializeDetail(report);
  }

  private resolveInvoiceAttachmentStatus(invoiceRequired: boolean, hasInvoice: boolean, attachments: Array<{ isInvoiceFile?: boolean }>) {
    const hasInvoiceAttachment = attachments.some((attachment) => attachment.isInvoiceFile);
    if (invoiceRequired && !hasInvoiceAttachment) {
      return InvoiceAttachmentStatus.MISSING_REQUIRED;
    }
    if (hasInvoice && !hasInvoiceAttachment) {
      return InvoiceAttachmentStatus.DECLARED_BUT_NOT_UPLOADED;
    }
    if (hasInvoiceAttachment) {
      return InvoiceAttachmentStatus.PRESENT;
    }
    return InvoiceAttachmentStatus.NOT_REQUIRED;
  }

  private buildAnomalies(args: any) {
    const anomalies: Array<{ anomalyType: AnomalyType; anomalyMessage: string; severity: AnomalySeverity }> = [];

    if (args.isOverLimit) {
      anomalies.push({
        anomalyType: AnomalyType.OVER_LIMIT,
        anomalyMessage: `当前金额超过${args.category.name}限额 ${args.overLimitAmount.toFixed(2)} 元，已标记但不影响提交。`, 
        severity: AnomalySeverity.MEDIUM
      });
    }

    if (args.invoiceAttachmentStatus === InvoiceAttachmentStatus.MISSING_REQUIRED) {
      anomalies.push({
        anomalyType: AnomalyType.INVOICE_MISSING_REQUIRED,
        anomalyMessage: "该类别要求上传发票附件，但当前未检测到发票附件。",
        severity: AnomalySeverity.HIGH
      });
    }

    if (args.invoiceAttachmentStatus === InvoiceAttachmentStatus.DECLARED_BUT_NOT_UPLOADED) {
      anomalies.push({
        anomalyType: AnomalyType.INVOICE_DECLARED_BUT_NOT_UPLOADED,
        anomalyMessage: "用户声明有发票，但当前未上传发票附件。",
        severity: AnomalySeverity.HIGH
      });
    }

    if (args.input.extensionType === ExpenseExtensionType.PURCHASE) {
      const requiredMissing = [args.input.productName, args.input.purchaseCategoryId, args.input.purchaserName].some((value) => !value);
      if (requiredMissing) {
        anomalies.push({
          anomalyType: AnomalyType.PURCHASE_REQUIRED_FIELD_MISSING,
          anomalyMessage: "采购报销存在关键字段缺失。",
          severity: AnomalySeverity.HIGH
        });
      }

      const computed = (args.input.unitPrice || 0) * (args.input.quantity || 0) + (args.input.shippingFee || 0);
      if (computed > 0 && Math.abs(computed - args.amountTotal) > 0.009) {
        anomalies.push({
          anomalyType: AnomalyType.PURCHASE_AMOUNT_MISMATCH,
          anomalyMessage: `采购明细计算值为 ${computed.toFixed(2)} 元，与总金额 ${args.amountTotal.toFixed(2)} 元不一致。`, 
          severity: AnomalySeverity.MEDIUM
        });
      }
    }

    return anomalies;
  }

  private buildWhere(query: Partial<ExpenseListQuery>, extra?: any) {
    const where: any = { ...(extra || {}) };

    if (query.month) {
      const range = getMonthRange(query.month);
      const field = query.timeBasis === TimeBasis.EXPENSE_DATE ? "expenseDate" : "submittedAt";
      where[field] = { gte: range.start, lt: range.end };
    }
    if (query.applicantId) {
      where.userId = query.applicantId;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (typeof query.isOverLimit === "boolean") {
      where.isOverLimit = query.isOverLimit;
    }
    if (typeof query.hasInvoice === "boolean") {
      where.hasInvoice = query.hasInvoice;
    }
    if (query.invoiceAttachmentStatus) {
      where.invoiceAttachmentStatus = query.invoiceAttachmentStatus;
    }
    if (typeof query.isPurchase === "boolean") {
      where.category = {
        extensionType: query.isPurchase ? ExpenseExtensionType.PURCHASE : { not: ExpenseExtensionType.PURCHASE }
      };
    }

    return where;
  }

  private serializeSummary(report: any) {
    return {
      id: report.id,
      title: report.title,
      applicantName: report.user.realName,
      categoryName: report.category.name,
      extensionType: report.category.extensionType,
      amountTotal: decimalToNumber(report.amountTotal),
      expenseDate: report.expenseDate.toISOString(),
      submittedAt: report.submittedAt?.toISOString() ?? null,
      createdAt: report.createdAt.toISOString(),
      status: report.status,
      hasInvoice: report.hasInvoice,
      invoiceRequiredSnapshot: report.invoiceRequiredSnapshot,
      invoiceAttachmentStatus: report.invoiceAttachmentStatus,
      attachmentCount: report.attachments.length,
      isOverLimit: report.isOverLimit,
      overLimitAmount: decimalToNumber(report.overLimitAmount),
      anomalies: report.anomalies.map((anomaly: any) => ({
        id: anomaly.id,
        anomalyType: anomaly.anomalyType,
        anomalyMessage: anomaly.anomalyMessage,
        severity: anomaly.severity,
        resolved: anomaly.resolved
      }))
    };
  }

  private serializeDetail(report: any) {
    let detail: Record<string, unknown> | null = null;

    if (report.normalDetail) {
      detail = {
        entryMode: report.normalDetail.entryMode,
        usageScene: report.normalDetail.usageScene,
        travelNote: report.normalDetail.travelNote,
        relatedPeople: report.normalDetail.relatedPeople,
        unitPrice: optionalDecimalToNumber(report.normalDetail.unitPrice),
        quantity: optionalDecimalToNumber(report.normalDetail.quantity)
      };
    }

    if (report.travelDetail) {
      detail = {
        tripStartDate: report.travelDetail.tripStartDate.toISOString(),
        tripEndDate: report.travelDetail.tripEndDate.toISOString(),
        claimDays: decimalToNumber(report.travelDetail.claimDays),
        destination: report.travelDetail.destination,
        tripReason: report.travelDetail.tripReason,
        travelerName: report.travelDetail.travelerName,
        companions: report.travelDetail.companions,
        travelStandard: report.travelDetail.travelStandard
      };
    }

    if (report.purchaseDetail) {
      detail = {
        productName: report.purchaseDetail.productName,
        purchaseCategoryId: report.purchaseDetail.purchaseCategory.id,
        purchaseCategoryName: report.purchaseDetail.purchaseCategory.name,
        purchaserName: report.purchaseDetail.purchaserName,
        userName: report.purchaseDetail.userName,
        unitPrice: optionalDecimalToNumber(report.purchaseDetail.unitPrice),
        quantity: optionalDecimalToNumber(report.purchaseDetail.quantity),
        shippingFee: optionalDecimalToNumber(report.purchaseDetail.shippingFee),
        platform: report.purchaseDetail.platform,
        vendorName: report.purchaseDetail.vendorName,
        productNote: report.purchaseDetail.productNote
      };
    }

    return {
      ...this.serializeSummary(report),
      remark: report.remark,
      attachments: report.attachments.map((attachment: any) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        isInvoiceFile: attachment.isInvoiceFile,
        previewUrl: `/attachments/files/${attachment.id}`,
        publicPreviewUrl: this.attachmentsService.buildPreviewAccessUrl(attachment.id)
      })),
      detail
    };
  }
}



