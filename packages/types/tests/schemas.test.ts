import { describe, expect, it } from "vitest";

import { ExpenseEntryMode, ExpenseExtensionType, UploadMethod } from "../src/lib/enums";
import { createExpenseSchema } from "../src/lib/schemas";

describe("createExpenseSchema", () => {
  it("requires unit price and quantity in unit price mode", () => {
    const result = createExpenseSchema.safeParse({
      categoryId: "7d5e6507-a1d4-4d8b-a3d6-0bf04a0c9aa7",
      title: "鍔犵彮椁愯垂",
      amountTotal: 35,
      expenseDate: "2026-03-30",
      uploadMethod: UploadMethod.MANUAL,
      hasInvoice: true,
      attachments: [],
      extensionType: ExpenseExtensionType.NONE,
      entryMode: ExpenseEntryMode.UNIT_PRICE
    });

    expect(result.success).toBe(false);
  });

  it("accepts travel expenses with claim days", () => {
    const result = createExpenseSchema.safeParse({
      categoryId: "7d5e6507-a1d4-4d8b-a3d6-0bf04a0c9aa7",
      title: "涓婃捣宸梾",
      amountTotal: 560,
      expenseDate: "2026-03-30",
      uploadMethod: UploadMethod.PDF,
      hasInvoice: true,
      attachments: [],
      extensionType: ExpenseExtensionType.TRAVEL,
      tripStartDate: "2026-03-28",
      tripEndDate: "2026-03-29",
      claimDays: 2,
      destination: "涓婃捣",
      travelerName: "寮犱笁"
    });

    expect(result.success).toBe(true);
  });
});

