import { describe, expect, it } from "vitest";

import { AnomalyType, ExpenseEntryMode, ExpenseExtensionType, InvoiceAttachmentStatus, UploadMethod } from "@financial-system/types";

import { ExpensesService } from "./expenses.service";

describe("ExpensesService anomaly logic", () => {
  const service = new ExpensesService({} as never, { findActiveRule: async () => null } as never);

  it("marks invoice required missing anomaly", () => {
    const result = (service as any).buildAnomalies({
      amountTotal: 45,
      category: { name: "加班餐费" },
      input: {
        categoryId: "x",
        title: "x",
        amountTotal: 45,
        expenseDate: "2026-03-30",
        uploadMethod: UploadMethod.MANUAL,
        hasInvoice: false,
        remark: "",
        attachments: [],
        extensionType: ExpenseExtensionType.NONE,
        entryMode: ExpenseEntryMode.TOTAL
      },
      invoiceAttachmentStatus: InvoiceAttachmentStatus.MISSING_REQUIRED,
      isOverLimit: false,
      overLimitAmount: 0,
      limitAmount: null
    });

    expect(result[0].anomalyType).toBe(AnomalyType.INVOICE_MISSING_REQUIRED);
  });

  it("marks purchase amount mismatch anomaly", () => {
    const result = (service as any).buildAnomalies({
      amountTotal: 100,
      category: { name: "采购报销" },
      input: {
        categoryId: "x",
        title: "x",
        amountTotal: 100,
        expenseDate: "2026-03-30",
        uploadMethod: UploadMethod.MANUAL,
        hasInvoice: true,
        remark: "",
        attachments: [],
        extensionType: ExpenseExtensionType.PURCHASE,
        productName: "键盘",
        purchaseCategoryId: "y",
        purchaserName: "张三",
        unitPrice: 30,
        quantity: 2,
        shippingFee: 5
      },
      invoiceAttachmentStatus: InvoiceAttachmentStatus.PRESENT,
      isOverLimit: false,
      overLimitAmount: 0,
      limitAmount: null
    });

    expect(result.some((item: { anomalyType: AnomalyType }) => item.anomalyType === AnomalyType.PURCHASE_AMOUNT_MISMATCH)).toBe(true);
  });
});

