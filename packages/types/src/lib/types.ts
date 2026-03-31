import {
  AnomalyType,
  ExpenseExtensionType,
  ExpenseReportStatus,
  ExportJobStatus,
  InvoiceAttachmentStatus,
  RoleCode,
  TimeBasis
} from "./enums";

export interface CurrentUser {
  id: string;
  username: string;
  realName: string;
  roles: RoleCode[];
}

export interface DashboardOverview {
  totalAmount: number;
  totalCount: number;
  overLimitCount: number;
  invoiceMissingCount: number;
  purchaseAmountShare: number;
  pendingAnomalyCount: number;
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  totalCount: number;
  totalAmount: number;
  overLimitCount: number;
  overLimitAmount: number;
}

export interface EmployeeStat {
  userId: string;
  userName: string;
  totalCount: number;
  totalAmount: number;
  overLimitCount: number;
  overLimitAmount: number;
}

export interface PurchaseCategoryStat {
  purchaseCategoryId: string;
  purchaseCategoryName: string;
  itemCount: number;
  totalAmount: number;
}

export interface ExportJobResult {
  id: string;
  status: ExportJobStatus;
  month: string;
  downloadUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ExpenseFilterState {
  month: string;
  timeBasis: TimeBasis;
  categoryId?: string;
  applicantId?: string;
  status?: ExpenseReportStatus;
  isOverLimit?: boolean;
  hasInvoice?: boolean;
  invoiceAttachmentStatus?: InvoiceAttachmentStatus;
  isPurchase?: boolean;
}

export interface AnomalyViewItem {
  reportId: string;
  reportTitle: string;
  applicantName: string;
  categoryName: string;
  amountTotal: number;
  invoiceAttachmentStatus: InvoiceAttachmentStatus;
  anomalies: Array<{
    type: AnomalyType;
    message: string;
  }>;
}

export interface ExpenseDetail {
  id: string;
  title: string;
  applicantName: string;
  categoryName: string;
  extensionType: ExpenseExtensionType;
  amountTotal: number;
  expenseDate: string;
  status: ExpenseReportStatus;
  remark: string | null;
  createdAt: string;
  submittedAt: string | null;
  hasInvoice: boolean;
  invoiceRequiredSnapshot: boolean;
  invoiceAttachmentStatus: InvoiceAttachmentStatus;
  isOverLimit: boolean;
  overLimitAmount: number;
  attachmentCount: number;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    isInvoiceFile: boolean;
    previewUrl: string;
  }>;
  anomalies: Array<{
    type: AnomalyType;
    message: string;
  }>;
  detail: Record<string, unknown> | null;
}


