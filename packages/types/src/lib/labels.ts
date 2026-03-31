import {
  AnomalyType,
  ExpenseExtensionType,
  ExpenseReportStatus,
  InvoiceAttachmentStatus,
  RoleCode,
  TimeBasis
} from "./enums";

export const roleLabels: Record<RoleCode, string> = {
  [RoleCode.EMPLOYEE]: "Employee",
  [RoleCode.ADMIN]: "Admin"
};

export const extensionTypeLabels: Record<ExpenseExtensionType, string> = {
  [ExpenseExtensionType.NONE]: "Normal",
  [ExpenseExtensionType.TRAVEL]: "Travel",
  [ExpenseExtensionType.PURCHASE]: "Purchase"
};

export const reportStatusLabels: Record<ExpenseReportStatus, string> = {
  [ExpenseReportStatus.DRAFT]: "Draft",
  [ExpenseReportStatus.SUBMITTED]: "Submitted",
  [ExpenseReportStatus.ARCHIVED]: "Archived"
};

export const invoiceStatusLabels: Record<InvoiceAttachmentStatus, string> = {
  [InvoiceAttachmentStatus.PRESENT]: "Invoice Uploaded",
  [InvoiceAttachmentStatus.MISSING_REQUIRED]: "Required Invoice Missing",
  [InvoiceAttachmentStatus.DECLARED_BUT_NOT_UPLOADED]: "Invoice Declared But Not Uploaded",
  [InvoiceAttachmentStatus.NOT_REQUIRED]: "Not Required"
};

export const anomalyTypeLabels: Record<AnomalyType, string> = {
  [AnomalyType.OVER_LIMIT]: "Over Limit",
  [AnomalyType.INVOICE_MISSING_REQUIRED]: "Required Invoice Missing",
  [AnomalyType.INVOICE_DECLARED_BUT_NOT_UPLOADED]: "Invoice Declared But Missing",
  [AnomalyType.PURCHASE_REQUIRED_FIELD_MISSING]: "Purchase Fields Missing",
  [AnomalyType.PURCHASE_AMOUNT_MISMATCH]: "Purchase Amount Mismatch"
};

export const timeBasisLabels: Record<TimeBasis, string> = {
  [TimeBasis.SUBMITTED_AT]: "Submitted Time",
  [TimeBasis.EXPENSE_DATE]: "Expense Date"
};