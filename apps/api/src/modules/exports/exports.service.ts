import { Injectable, NotFoundException } from "@nestjs/common";
import ExcelJS from "exceljs";

import { ExportJobStatus, type ExportRequest } from "@financial-system/types";

import { StorageService } from "@/common/storage/storage.service";
import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";
import { getMonthRange } from "@/common/utils/date-range";
import { decimalToNumber } from "@/common/utils/number";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ExportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService
  ) {}

  async createJob(input: ExportRequest, user: AuthenticatedUser) {
    const job = await this.prisma.exportJob.create({
      data: {
        requestedById: user.id,
        month: input.month,
        status: ExportJobStatus.PENDING
      }
    });

    void this.processJob(job.id, input);

    return this.getJob(job.id);
  }

  async getJob(id: string) {
    const job = await this.prisma.exportJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException("导出任务不存在");
    }

    return {
      id: job.id,
      status: job.status,
      month: job.month,
      downloadUrl: job.storageKey ? `/admin/exports/${job.id}/download` : null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null
    };
  }

  async download(id: string) {
    const job = await this.prisma.exportJob.findUnique({ where: { id } });
    if (!job || !job.storageKey) {
      throw new NotFoundException("导出文件不存在");
    }

    return this.storageService.readObject(job.storageKey);
  }

  private async processJob(id: string, input: ExportRequest) {
    try {
      await this.prisma.exportJob.update({ where: { id }, data: { status: ExportJobStatus.PROCESSING } });
      const reports = await this.loadReports(input);
      const workbook = new ExcelJS.Workbook();
      this.buildDetailSheet(workbook, reports);
      this.buildCategorySheet(workbook, reports);
      this.buildEmployeeSheet(workbook, reports);
      this.buildPurchaseSheet(workbook, reports);
      this.buildAnomalySheet(workbook, reports);
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const storageKey = `exports/${id}.xlsx`;
      await this.storageService.uploadBuffer(storageKey, buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      await this.prisma.exportJob.update({
        where: { id },
        data: {
          status: ExportJobStatus.COMPLETED,
          storageKey,
          completedAt: new Date(),
          errorMessage: null
        }
      });
    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id },
        data: {
          status: ExportJobStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "导出失败",
          completedAt: new Date()
        }
      });
    }
  }

  private async loadReports(input: ExportRequest) {
    const range = getMonthRange(input.month);
    return this.prisma.expenseReport.findMany({
      where: {
        submittedAt: {
          gte: range.start,
          lt: range.end
        },
        categoryId: input.categoryId,
        userId: input.applicantId,
        isOverLimit: input.isOverLimit,
        invoiceAttachmentStatus: input.invoiceAttachmentStatus,
        ...(typeof input.isPurchase === "boolean"
          ? {
              category: {
                extensionType: input.isPurchase ? "PURCHASE" : { not: "PURCHASE" }
              }
            }
          : {})
      },
      include: {
        user: true,
        category: true,
        anomalies: true,
        purchaseDetail: {
          include: {
            purchaseCategory: true
          }
        }
      },
      orderBy: {
        submittedAt: "asc"
      }
    });
  }

  private buildDetailSheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("报销明细");
    sheet.addRow(["序号", "报销标题", "申请人", "报销类别", "金额", "日期", "是否有发票", "是否超额", "超额金额", "状态", "备注", "创建时间"]);
    reports.forEach((report, index) => {
      sheet.addRow([
        index + 1,
        report.title,
        report.user.realName,
        report.category.name,
        decimalToNumber(report.amountTotal),
        report.expenseDate.toISOString().slice(0, 10),
        report.hasInvoice ? "有" : "无",
        report.isOverLimit ? "是" : "否",
        decimalToNumber(report.overLimitAmount),
        report.status,
        report.remark || "",
        report.createdAt.toISOString()
      ]);
    });
  }

  private buildCategorySheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("分类汇总");
    sheet.addRow(["报销类别", "报销笔数", "总金额", "超额笔数", "超额金额"]);
    const map = new Map<string, { count: number; amount: number; overCount: number; overAmount: number; name: string }>();
    for (const report of reports) {
      const current = map.get(report.categoryId) ?? { count: 0, amount: 0, overCount: 0, overAmount: 0, name: report.category.name };
      current.count += 1;
      current.amount += decimalToNumber(report.amountTotal);
      if (report.isOverLimit) {
        current.overCount += 1;
        current.overAmount += decimalToNumber(report.overLimitAmount);
      }
      map.set(report.categoryId, current);
    }
    Array.from(map.values()).forEach((item) => sheet.addRow([item.name, item.count, item.amount, item.overCount, item.overAmount]));
  }

  private buildEmployeeSheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("员工汇总");
    sheet.addRow(["员工姓名", "报销笔数", "总金额", "超额笔数", "超额金额"]);
    const map = new Map<string, { count: number; amount: number; overCount: number; overAmount: number; name: string }>();
    for (const report of reports) {
      const current = map.get(report.userId) ?? { count: 0, amount: 0, overCount: 0, overAmount: 0, name: report.user.realName };
      current.count += 1;
      current.amount += decimalToNumber(report.amountTotal);
      if (report.isOverLimit) {
        current.overCount += 1;
        current.overAmount += decimalToNumber(report.overLimitAmount);
      }
      map.set(report.userId, current);
    }
    Array.from(map.values()).forEach((item) => sheet.addRow([item.name, item.count, item.amount, item.overCount, item.overAmount]));
  }

  private buildPurchaseSheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("采购明细");
    sheet.addRow(["序号", "商品名称", "采购分类", "采购人", "使用人", "单价", "数量", "邮费", "总价", "采购平台", "发票", "备注"]);
    reports.filter((report) => report.purchaseDetail).forEach((report, index) => {
      const detail = report.purchaseDetail!;
      sheet.addRow([
        index + 1,
        detail.productName,
        detail.purchaseCategory?.name || "",
        detail.purchaserName,
        detail.userName || "",
        decimalToNumber(detail.unitPrice),
        decimalToNumber(detail.quantity),
        decimalToNumber(detail.shippingFee),
        decimalToNumber(report.amountTotal),
        detail.platform || "",
        report.hasInvoice ? "有" : "无",
        report.remark || detail.productNote || ""
      ]);
    });
  }

  private buildAnomalySheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("异常记录");
    sheet.addRow(["序号", "报销标题", "申请人", "报销类别", "金额", "异常类型", "异常说明", "是否超额", "超额金额"]);
    let rowIndex = 1;
    reports.forEach((report) => {
      report.anomalies.forEach((anomaly) => {
        sheet.addRow([
          rowIndex,
          report.title,
          report.user.realName,
          report.category.name,
          decimalToNumber(report.amountTotal),
          anomaly.anomalyType,
          anomaly.anomalyMessage,
          report.isOverLimit ? "是" : "否",
          decimalToNumber(report.overLimitAmount)
        ]);
        rowIndex += 1;
      });
    });
  }
}

