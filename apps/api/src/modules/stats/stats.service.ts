import { Injectable } from "@nestjs/common";

import { ExpenseExtensionType, type CategoryStat, type DashboardOverview, type EmployeeStat, type PurchaseCategoryStat } from "@financial-system/types";

import { getMonthRange } from "@/common/utils/date-range";
import { decimalToNumber } from "@/common/utils/number";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(month: string): Promise<DashboardOverview> {
    const reports = await this.findReportsForMonth(month);
    const totalAmount = reports.reduce((sum, report) => sum + decimalToNumber(report.amountTotal), 0);
    const purchaseAmount = reports
      .filter((report) => report.category.extensionType === ExpenseExtensionType.PURCHASE)
      .reduce((sum, report) => sum + decimalToNumber(report.amountTotal), 0);

    return {
      totalAmount,
      totalCount: reports.length,
      overLimitCount: reports.filter((report) => report.isOverLimit).length,
      invoiceMissingCount: reports.filter((report) => report.invoiceAttachmentStatus !== "PRESENT" && report.invoiceRequiredSnapshot).length,
      purchaseAmountShare: totalAmount > 0 ? purchaseAmount / totalAmount : 0,
      pendingAnomalyCount: reports.reduce((sum, report) => sum + report.anomalies.filter((item) => !item.resolved).length, 0)
    };
  }

  async byCategory(month: string): Promise<CategoryStat[]> {
    const reports = await this.findReportsForMonth(month);
    const map = new Map<string, CategoryStat>();

    for (const report of reports) {
      const key = report.categoryId;
      const current = map.get(key) ?? {
        categoryId: report.categoryId,
        categoryName: report.category.name,
        totalCount: 0,
        totalAmount: 0,
        overLimitCount: 0,
        overLimitAmount: 0
      };

      current.totalCount += 1;
      current.totalAmount += decimalToNumber(report.amountTotal);
      if (report.isOverLimit) {
        current.overLimitCount += 1;
        current.overLimitAmount += decimalToNumber(report.overLimitAmount);
      }
      map.set(key, current);
    }

    return Array.from(map.values());
  }

  async byEmployee(month: string): Promise<EmployeeStat[]> {
    const reports = await this.findReportsForMonth(month);
    const map = new Map<string, EmployeeStat>();

    for (const report of reports) {
      const key = report.userId;
      const current = map.get(key) ?? {
        userId: report.userId,
        userName: report.user.realName,
        totalCount: 0,
        totalAmount: 0,
        overLimitCount: 0,
        overLimitAmount: 0
      };

      current.totalCount += 1;
      current.totalAmount += decimalToNumber(report.amountTotal);
      if (report.isOverLimit) {
        current.overLimitCount += 1;
        current.overLimitAmount += decimalToNumber(report.overLimitAmount);
      }
      map.set(key, current);
    }

    return Array.from(map.values());
  }

  async byPurchaseCategory(month: string): Promise<PurchaseCategoryStat[]> {
    const reports = await this.findReportsForMonth(month);
    const map = new Map<string, PurchaseCategoryStat>();

    for (const report of reports) {
      if (!report.purchaseDetail?.purchaseCategory) {
        continue;
      }

      const key = report.purchaseDetail.purchaseCategory.id;
      const current = map.get(key) ?? {
        purchaseCategoryId: key,
        purchaseCategoryName: report.purchaseDetail.purchaseCategory.name,
        itemCount: 0,
        totalAmount: 0
      };

      current.itemCount += 1;
      current.totalAmount += decimalToNumber(report.amountTotal);
      map.set(key, current);
    }

    return Array.from(map.values());
  }

  async findReportsForMonth(month: string) {
    const range = getMonthRange(month);
    return this.prisma.expenseReport.findMany({
      where: {
        submittedAt: {
          gte: range.start,
          lt: range.end
        }
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
        submittedAt: "desc"
      }
    });
  }
}

