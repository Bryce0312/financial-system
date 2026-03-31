import { Injectable } from "@nestjs/common";

import { AnomalyListQuery, ExpenseExtensionType } from "@financial-system/types";

import { getMonthRange } from "@/common/utils/date-range";
import { decimalToNumber } from "@/common/utils/number";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AnomaliesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Partial<AnomalyListQuery>) {
    const where: any = {
      anomalies: {
        some: {}
      }
    };

    if (query.month) {
      const range = getMonthRange(query.month);
      where.submittedAt = { gte: range.start, lt: range.end };
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.applicantId) {
      where.userId = query.applicantId;
    }
    if (query.invoiceAttachmentStatus) {
      where.invoiceAttachmentStatus = query.invoiceAttachmentStatus;
    }
    if (typeof query.isPurchase === "boolean") {
      where.category = { extensionType: query.isPurchase ? ExpenseExtensionType.PURCHASE : { not: ExpenseExtensionType.PURCHASE } };
    }

    const reports = await this.prisma.expenseReport.findMany({
      where,
      include: {
        user: true,
        category: true,
        anomalies: query.type ? { where: { anomalyType: query.type } } : true
      },
      orderBy: { createdAt: "desc" }
    });

    return reports.filter((report: any) => report.anomalies.length > 0).map((report: any) => ({
      reportId: report.id,
      reportTitle: report.title,
      applicantName: report.user.realName,
      categoryName: report.category.name,
      amountTotal: decimalToNumber(report.amountTotal),
      invoiceAttachmentStatus: report.invoiceAttachmentStatus,
      createdAt: report.createdAt.toISOString(),
      anomalies: report.anomalies.map((anomaly: any) => ({
        id: anomaly.id,
        type: anomaly.anomalyType,
        message: anomaly.anomalyMessage,
        severity: anomaly.severity,
        resolved: anomaly.resolved
      }))
    }));
  }
}

