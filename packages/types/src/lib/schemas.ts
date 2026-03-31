import { z } from "zod";

import {
  AnomalySeverity,
  AnomalyType,
  ExpenseEntryMode,
  ExpenseExtensionType,
  ExpenseReportStatus,
  InvoiceAttachmentStatus,
  RoleCode,
  TimeBasis,
  UploadMethod
} from "./enums";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
    realName: z.string().min(1, "Real name is required"),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email address").optional().or(z.literal(""))
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const expenseCategorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  enabled: z.boolean().default(true),
  limitEnabled: z.boolean().default(false),
  invoiceRequired: z.boolean().default(false),
  extensionType: z.nativeEnum(ExpenseExtensionType),
  sortOrder: z.number().int().default(0)
});

export const purchaseCategorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const ruleSchema = z.object({
  name: z.string().min(1),
  expenseCategoryId: z.string().uuid(),
  enabled: z.boolean().default(true),
  limitAmount: z.number().positive(),
  effectiveAt: z.string().datetime(),
  description: z.string().optional().or(z.literal(""))
});

export const attachmentReferenceSchema = z.object({
  id: z.string().uuid(),
  isInvoiceFile: z.boolean()
});

const expenseBaseSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(1),
  amountTotal: z.number().positive(),
  expenseDate: z.string().date(),
  uploadMethod: z.nativeEnum(UploadMethod),
  hasInvoice: z.boolean(),
  remark: z.string().optional().or(z.literal("")),
  attachments: z.array(attachmentReferenceSchema).default([])
});

const normalDetailSchema = z.object({
  extensionType: z.literal(ExpenseExtensionType.NONE),
  entryMode: z.nativeEnum(ExpenseEntryMode).default(ExpenseEntryMode.TOTAL),
  usageScene: z.string().optional().or(z.literal("")),
  travelNote: z.string().optional().or(z.literal("")),
  relatedPeople: z.string().optional().or(z.literal("")),
  unitPrice: z.number().positive().optional(),
  quantity: z.number().positive().optional()
});

const travelDetailSchema = z.object({
  extensionType: z.literal(ExpenseExtensionType.TRAVEL),
  tripStartDate: z.string().date(),
  tripEndDate: z.string().date(),
  claimDays: z.number().positive(),
  destination: z.string().min(1),
  tripReason: z.string().optional().or(z.literal("")),
  travelerName: z.string().min(1),
  companions: z.string().optional().or(z.literal("")),
  travelStandard: z.string().optional().or(z.literal(""))
});

const purchaseDetailSchema = z.object({
  extensionType: z.literal(ExpenseExtensionType.PURCHASE),
  productName: z.string().min(1),
  purchaseCategoryId: z.string().uuid(),
  purchaserName: z.string().min(1),
  userName: z.string().optional().or(z.literal("")),
  unitPrice: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  shippingFee: z.number().min(0).optional(),
  platform: z.string().optional().or(z.literal("")),
  vendorName: z.string().optional().or(z.literal("")),
  productNote: z.string().optional().or(z.literal(""))
});

export const createExpenseSchema = expenseBaseSchema
  .and(z.union([normalDetailSchema, travelDetailSchema, purchaseDetailSchema]))
  .superRefine((value, ctx) => {
    if (value.extensionType === ExpenseExtensionType.NONE && value.entryMode === ExpenseEntryMode.UNIT_PRICE) {
      if (!value.unitPrice) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unit price is required", path: ["unitPrice"] });
      }
      if (!value.quantity) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantity is required", path: ["quantity"] });
      }
    }
  });

export const expenseListQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  applicantId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(ExpenseReportStatus).optional(),
  isOverLimit: z.union([z.boolean(), z.enum(["true", "false"])]).transform((value) => (typeof value === "string" ? value === "true" : value)).optional(),
  hasInvoice: z.union([z.boolean(), z.enum(["true", "false"])]).transform((value) => (typeof value === "string" ? value === "true" : value)).optional(),
  invoiceAttachmentStatus: z.nativeEnum(InvoiceAttachmentStatus).optional(),
  isPurchase: z.union([z.boolean(), z.enum(["true", "false"])]).transform((value) => (typeof value === "string" ? value === "true" : value)).optional(),
  timeBasis: z.nativeEnum(TimeBasis).default(TimeBasis.SUBMITTED_AT)
});

export const anomalyListQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.nativeEnum(AnomalyType).optional(),
  categoryId: z.string().uuid().optional(),
  applicantId: z.string().uuid().optional(),
  invoiceAttachmentStatus: z.nativeEnum(InvoiceAttachmentStatus).optional(),
  isPurchase: z.union([z.boolean(), z.enum(["true", "false"])]).transform((value) => (typeof value === "string" ? value === "true" : value)).optional()
});

export const statsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/)
});

export const exportRequestSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().uuid().optional(),
  applicantId: z.string().uuid().optional(),
  isOverLimit: z.boolean().optional(),
  invoiceAttachmentStatus: z.nativeEnum(InvoiceAttachmentStatus).optional(),
  isPurchase: z.boolean().optional()
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    realName: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    roles: z.array(z.nativeEnum(RoleCode))
  })
});

export const anomalySchema = z.object({
  id: z.string().uuid(),
  anomalyType: z.nativeEnum(AnomalyType),
  anomalyMessage: z.string(),
  severity: z.nativeEnum(AnomalySeverity),
  resolved: z.boolean()
});

export const expenseSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  applicantName: z.string(),
  categoryName: z.string(),
  extensionType: z.nativeEnum(ExpenseExtensionType),
  amountTotal: z.number(),
  expenseDate: z.string(),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  status: z.nativeEnum(ExpenseReportStatus),
  hasInvoice: z.boolean(),
  invoiceRequiredSnapshot: z.boolean(),
  invoiceAttachmentStatus: z.nativeEnum(InvoiceAttachmentStatus),
  attachmentCount: z.number(),
  isOverLimit: z.boolean(),
  overLimitAmount: z.number(),
  anomalies: z.array(anomalySchema)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type PurchaseCategoryInput = z.infer<typeof purchaseCategorySchema>;
export type RuleInput = z.infer<typeof ruleSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ExpenseListQuery = z.infer<typeof expenseListQuerySchema>;
export type AnomalyListQuery = z.infer<typeof anomalyListQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ExpenseSummary = z.infer<typeof expenseSummarySchema>;

