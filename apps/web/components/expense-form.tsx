"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  CreateExpenseInput,
  ExpenseEntryMode,
  ExpenseExtensionType,
  UploadMethod,
  createExpenseSchema,
  type ExpenseCategoryInput
} from "@financial-system/types";
import { Badge, Button, Card, CardContent, Input, Select, Textarea } from "@financial-system/ui";

import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/format";

interface UploadItem {
  file: File;
  isInvoiceFile: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  amountTotal: "\u91d1\u989d\u603b\u8ba1",
  categoryId: "\u62a5\u9500\u7c7b\u522b",
  title: "\u6807\u9898",
  expenseDate: "\u8d39\u7528\u53d1\u751f\u65e5\u671f",
  uploadMethod: "\u4e0a\u4f20\u65b9\u5f0f",
  hasInvoice: "\u662f\u5426\u6709\u53d1\u7968"
};

function formatExpenseError(message: string) {
  try {
    const parsed = JSON.parse(message) as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };

    if (parsed.fieldErrors) {
      const firstKey = Object.keys(parsed.fieldErrors)[0];
      if (firstKey) {
        const firstMessage = parsed.fieldErrors[firstKey]?.[0] || "";
        if (firstMessage.includes("Number must be greater than 0")) {
          return `${FIELD_LABELS[firstKey] || firstKey}\u9700\u8981\u5927\u4e8e 0`;
        }
        if (firstMessage.includes("Required")) {
          return `${FIELD_LABELS[firstKey] || firstKey}\u4e3a\u5fc5\u586b\u9879`;
        }
        return `${FIELD_LABELS[firstKey] || firstKey}\uff1a${firstMessage}`;
      }
    }

    if ((parsed as { message?: string }).message) {
      const normalizedMessage = (parsed as { message?: string }).message || "";
      if (normalizedMessage.includes("报销类别与表单类型不匹配")) {
        return "当前报销类别和表单类型未同步，请重新选择类别后再提交。";
      }
      if (normalizedMessage.includes("报销类别不存在或已停用")) {
        return "报销类别已失效，请刷新页面后重试。";
      }
      if (normalizedMessage.includes("存在不可用的附件")) {
        return "有附件未上传成功或已失效，请重新上传后再提交。";
      }
      return normalizedMessage;
    }

    if (parsed.formErrors?.[0]) {
      return parsed.formErrors[0];
    }
  } catch {
    // Fall back to the original message when the payload is not JSON.
  }

  return message === "Failed to fetch"
    ? "\u5f53\u524d\u65e0\u6cd5\u8fde\u63a5\u540e\u7aef\u670d\u52a1\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"
    : message;
}

const TEXT = {
  pageTitle: "\u65b0\u5efa\u62a5\u9500",
  pageDesc:
    "\u628a\u666e\u901a\u3001\u5dee\u65c5\u3001\u91c7\u8d2d\u62a5\u9500\u6536\u8fdb\u540c\u4e00\u5f20\u8349\u7a3f\u91cc\u3002\u9875\u9762\u4f1a\u6839\u636e\u4f60\u9009\u62e9\u7684\u7c7b\u522b\u5207\u6362\u5b57\u6bb5\uff0c\u5e76\u5728\u63d0\u4ea4\u524d\u628a\u9644\u4ef6\u548c\u5f02\u5e38\u63d0\u793a\u4e00\u8d77\u6574\u7406\u597d\u3002",
  step1: "\u5148\u586b\u57fa\u7840\u4fe1\u606f",
  step2: "\u518d\u8865\u6269\u5c55\u8bf4\u660e",
  step3: "\u6700\u540e\u4e0a\u4f20\u7968\u636e",
  reminderTitle: "\u8fd9\u5f20\u5355\u4f1a\u81ea\u5df1\u5e2e\u4f60\u5bf9\u9f50\u89c4\u5219\u3002",
  reminder1: "\u6309\u7c7b\u522b\u81ea\u52a8\u5207\u6362\u8868\u5355\u7ed3\u6784",
  reminder2: "\u4e0a\u4f20\u7968\u636e\u540e\u518d\u4e00\u8d77\u63d0\u4ea4\uff0c\u4e0d\u4f1a\u6f0f\u9644\u4ef6",
  reminder3: "\u8d85\u989d\u6216\u7f3a\u7968\u53ea\u505a\u6807\u8bb0\uff0c\u4e0d\u4f1a\u963b\u65ad\u63d0\u4ea4",
  basicTitle: "\u57fa\u7840\u4fe1\u606f",
  basicDesc: "\u5148\u586b\u6807\u9898\u3001\u91d1\u989d\u3001\u53d1\u751f\u65e5\u671f\u548c\u7968\u636e\u72b6\u6001\u3002",
  detailTitle: "\u6269\u5c55\u4fe1\u606f",
  detailDesc: "\u6309\u62a5\u9500\u7c7b\u522b\u81ea\u52a8\u5c55\u5f00\u4e0d\u540c\u7684\u5b57\u6bb5\u533a\u3002",
  attachmentTitle: "\u9644\u4ef6\u4e0a\u4f20",
  attachmentDesc: "\u7968\u636e\u3001\u622a\u56fe\u6216 PDF \u90fd\u5728\u8fd9\u91cc\u4e00\u6b21\u6574\u7406\u3002",
  category: "\u62a5\u9500\u7c7b\u522b",
  title: "\u6807\u9898",
  amountTotal: "\u91d1\u989d\u603b\u8ba1",
  expenseDate: "\u8d39\u7528\u53d1\u751f\u65e5\u671f",
  uploadMethod: "\u4e0a\u4f20\u65b9\u5f0f",
  hasInvoice: "\u662f\u5426\u6709\u53d1\u7968",
  remark: "\u5907\u6ce8",
  titlePlaceholder: "\u4f8b\u5982\uff1a\u6253\u8f66\u8d39 / \u4f4f\u5bbf\u8d39 / \u91c7\u8d2d\u8017\u6750",
  remarkPlaceholder: "\u8865\u5145\u4e1a\u52a1\u80cc\u666f\u3001\u540c\u884c\u4eba\u5458\u3001\u4ed8\u6b3e\u8bf4\u660e\u7b49\u7ec6\u8282\u3002",
  loadingCategories: "\u6b63\u5728\u52a0\u8f7d\u7c7b\u522b...",
  categoryLoadFailed: "\u7c7b\u522b\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55",
  selectCategory: "\u8bf7\u9009\u62e9\u7c7b\u522b",
  withInvoice: "\u6709",
  withoutInvoice: "\u65e0",
  manual: "\u624b\u52a8",
  image: "\u56fe\u7247",
  camera: "\u62cd\u7167",
  invoiceRequired: "\u5f53\u524d\u7c7b\u522b\u8981\u6c42\u81f3\u5c11\u4e0a\u4f20 1 \u4e2a\u53d1\u7968\u9644\u4ef6",
  currentAmount: "\u5f53\u524d\u586b\u5199\u91d1\u989d\uff1a",
  categoryRefresh: "\u7c7b\u522b\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u91cd\u8bd5",
  normalExpense: "\u666e\u901a\u62a5\u9500",
  travelExpense: "\u5dee\u65c5\u62a5\u9500",
  purchaseExpense: "\u91c7\u8d2d\u62a5\u9500",
  entryMode: "\u91d1\u989d\u5f55\u5165\u6a21\u5f0f",
  totalMode: "\u603b\u91d1\u989d\u6a21\u5f0f",
  unitPriceMode: "\u5355\u4ef7\u6a21\u5f0f",
  unitPrice: "\u5355\u4ef7",
  quantity: "\u6570\u91cf",
  suggestedAmount: "\u7cfb\u7edf\u5efa\u8bae\u91d1\u989d\uff1a",
  usageScene: "\u4f7f\u7528\u573a\u666f\u8bf4\u660e",
  travelNote: "\u51fa\u884c\u8bf4\u660e",
  relatedPeople: "\u5173\u8054\u4eba\u5458",
  usageScenePlaceholder: "\u4f8b\u5982\uff1a\u5ba2\u6237\u62dc\u8bbf / \u56e2\u961f\u6d3b\u52a8",
  travelNotePlaceholder: "\u4f8b\u5982\uff1a\u6ef4\u6ef4\u5f80\u8fd4\u56ed\u533a",
  relatedPeoplePlaceholder: "\u4f8b\u5982\uff1a\u5f20\u4e09\u3001\u674e\u56db",
  tripStartDate: "\u51fa\u5dee\u5f00\u59cb\u65e5\u671f",
  tripEndDate: "\u51fa\u5dee\u7ed3\u675f\u65e5\u671f",
  claimDays: "\u62a5\u9500\u5929\u6570",
  destination: "\u51fa\u5dee\u5730\u70b9",
  travelerName: "\u51fa\u5dee\u4eba",
  companions: "\u540c\u884c\u4eba\u5458",
  tripReason: "\u51fa\u5dee\u4e8b\u7531",
  travelStandard: "\u5dee\u65c5\u6807\u51c6",
  productName: "\u5546\u54c1\u540d\u79f0",
  purchaseCategory: "\u91c7\u8d2d\u5206\u7c7b",
  selectPurchaseCategory: "\u8bf7\u9009\u62e9\u91c7\u8d2d\u5206\u7c7b",
  purchaserName: "\u91c7\u8d2d\u4eba",
  userName: "\u4f7f\u7528\u4eba",
  shippingFee: "\u90ae\u8d39",
  platform: "\u91c7\u8d2d\u5e73\u53f0",
  vendorName: "\u5546\u5bb6 / \u4f9b\u5e94\u5546",
  productNote: "\u5546\u54c1\u8bf4\u660e",
  productNotePlaceholder: "\u5199\u6e05\u695a\u7528\u9014\u3001\u89c4\u683c\u6216\u91c7\u8d2d\u539f\u56e0\u3002",
  purchaseSuggestedAmount: "\u91c7\u8d2d\u660e\u7ec6\u5efa\u8bae\u91d1\u989d\uff1a",
  selectedFiles: "\u5df2\u9009\u62e9",
  fileUnit: "\u4e2a\u6587\u4ef6",
  uploadZoneTitle: "\u70b9\u51fb\u9009\u62e9\u6587\u4ef6\uff0c\u6216\u628a\u7968\u636e\u62d6\u5230\u8fd9\u91cc",
  uploadZoneDesc: "\u652f\u6301 JPG / PNG / PDF\uff0c\u5efa\u8bae\u4f18\u5148\u4e0a\u4f20\u6e05\u6670\u7684\u7968\u636e\u539f\u4ef6\u3002",
  invoiceAttachment: "\u4f5c\u4e3a\u53d1\u7968\u9644\u4ef6",
  uploading: "\u4e0a\u4f20\u4e2d...",
  uploadAndSubmit: "\u4e0a\u4f20\u9644\u4ef6\u5e76\u63d0\u4ea4\u62a5\u9500",
  submit: "\u63d0\u4ea4\u62a5\u9500",
  clearUploads: "\u6e05\u7a7a\u5df2\u9009\u9644\u4ef6",
  submitHint:
    "\u63d0\u4ea4\u540e\u4f1a\u56de\u5230\u62a5\u9500\u5217\u8868\uff0c\u4f60\u53ef\u4ee5\u5728\u8be6\u60c5\u9875\u7ee7\u7eed\u67e5\u770b\u5f02\u5e38\u6807\u8bb0\u548c\u9644\u4ef6\u72b6\u6001\u3002"
} as const;

function ExpenseSketch() {
  return (
    <svg viewBox="0 0 320 220" className="expense-art-illustration doodle-float" aria-hidden="true">
      <path d="M44 42c8-12 22-18 42-18h88c20 0 32 5 40 16 8 11 11 26 11 46v79c0 16-4 28-13 37-9 9-22 14-39 14H88c-18 0-31-6-40-17-9-11-13-25-13-43V85c0-17 3-31 9-43Z" fill="#fffafc" stroke="#c9c1d5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M98 72h93" stroke="#2d2d2d" strokeWidth="4" strokeLinecap="round" />
      <path d="M98 102h72" stroke="#7c748d" strokeWidth="4" strokeLinecap="round" />
      <path d="M98 132h108" stroke="#7c748d" strokeWidth="4" strokeLinecap="round" />
      <path d="M98 162h86" stroke="#7c748d" strokeWidth="4" strokeLinecap="round" />
      <rect x="57" y="65" width="24" height="24" rx="8" fill="#efeaf6" stroke="#8f86a3" strokeWidth="4" />
      <rect x="57" y="124" width="24" height="24" rx="8" fill="#ffd7de" stroke="#c57b8d" strokeWidth="4" />
      <path d="M232 41c12 1 23 7 31 18" stroke="#8f86a3" strokeWidth="4" strokeLinecap="round" />
      <path d="M255 63c10 2 18 7 24 15" stroke="#8f86a3" strokeWidth="4" strokeLinecap="round" />
      <path d="M242 152c17 2 29 11 35 26" stroke="#c57b8d" strokeWidth="4" strokeLinecap="round" />
      <circle cx="267" cy="100" r="17" fill="#fff" stroke="#c9c1d5" strokeWidth="4" />
      <path d="M267 90v20" stroke="#1a1a2e" strokeWidth="4" strokeLinecap="round" />
      <path d="M257 100h20" stroke="#1a1a2e" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function AttachmentSketch() {
  return (
    <svg viewBox="0 0 120 120" className="expense-art-corner doodle-drift" aria-hidden="true">
      <path d="M37 38c0-13 10-23 23-23s23 10 23 23v28c0 18-12 31-29 31S26 84 26 66V36" fill="none" stroke="#8f86a3" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 33c0-15 12-27 28-27s28 12 28 27" fill="none" stroke="#ddd7e8" strokeWidth="5" strokeLinecap="round" />
      <path d="M64 73 47 90" fill="none" stroke="#d9738d" strokeWidth="5" strokeLinecap="round" />
      <path d="m47 73 17 17" fill="none" stroke="#d9738d" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="expense-art-sectionHead">
      <span className="expense-art-sectionTag">{eyebrow}</span>
      <h3 className="expense-art-sectionTitle">{title}</h3>
      <p className="expense-art-sectionDesc">{desc}</p>
    </div>
  );
}

export function ExpenseForm() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Array<{ file: File; isInvoiceFile: boolean }>>([]);
  const [clientError, setClientError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => apiFetch<Array<ExpenseCategoryInput & { id: string }>>("/expense-categories")
  });

  const purchaseCategoriesQuery = useQuery({
    queryKey: ["purchase-categories"],
    queryFn: () => apiFetch<Array<{ id: string; name: string }>>("/purchase-categories")
  });

  const categories = categoriesQuery.data || [];
  const purchaseCategories = purchaseCategoriesQuery.data || [];

  const form = useForm<any>({
    resolver: zodResolver(createExpenseSchema as any),
    defaultValues: {
      categoryId: "",
      title: "",
      amountTotal: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      uploadMethod: UploadMethod.MANUAL,
      hasInvoice: true,
      remark: "",
      attachments: [],
      extensionType: ExpenseExtensionType.NONE,
      entryMode: ExpenseEntryMode.TOTAL,
      usageScene: "",
      travelNote: "",
      relatedPeople: "",
      unitPrice: undefined,
      quantity: undefined,
      shippingFee: undefined
    }
  });

  const watchedCategoryId = form.watch("categoryId");
  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === watchedCategoryId),
    [categories, watchedCategoryId]
  );

  const extensionType = selectedCategory?.extensionType || ExpenseExtensionType.NONE;
  const entryMode = form.watch("entryMode");
  const hasInvoice = form.watch("hasInvoice");
  const unitPrice = Number(form.watch("unitPrice") || 0);
  const quantity = Number(form.watch("quantity") || 0);
  const shippingFee = Number((form.watch() as Record<string, unknown>).shippingFee || 0);
  const amountTotal = Number(form.watch("amountTotal") || 0);
  const suggestedAmount = extensionType === ExpenseExtensionType.PURCHASE ? unitPrice * quantity + shippingFee : unitPrice * quantity;

  const mutation = useMutation({
    mutationFn: async (payload: CreateExpenseInput) => {
      const attachmentRefs: Array<{ id: string; isInvoiceFile: boolean }> = [];

      for (const upload of uploads) {
        const formData = new FormData();
        formData.append("file", upload.file);
        const uploaded = await apiFetch<{ id: string }>(`/attachments/upload?isInvoiceFile=${String(upload.isInvoiceFile)}`, {
          method: "POST",
          body: formData
        });
        attachmentRefs.push({ id: uploaded.id, isInvoiceFile: upload.isInvoiceFile });
      }

      return apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          attachments: attachmentRefs
        })
      });
    },
    onSuccess: () => {
      router.push("/employee/expenses");
    }
  });

  const submitExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const categoryId = String(formData.get("categoryId") || "");
    const selectedSubmitCategory = categories.find((item) => item.id === categoryId);
    const submitExtensionType = selectedSubmitCategory?.extensionType || ExpenseExtensionType.NONE;
    if (!categoryId) {
      setClientError("请选择有效的报销类别后再提交。");
      return;
    }

    if (!selectedSubmitCategory) {
      setClientError("类别数据已失效，请刷新页面后重试。");
      return;
    }

    if (submitExtensionType === ExpenseExtensionType.PURCHASE) {
      const productName = String(formData.get("productName") || "").trim();
      const purchaseCategoryId = String(formData.get("purchaseCategoryId") || "").trim();
      const purchaserName = String(formData.get("purchaserName") || "").trim();

      if (!productName || !purchaseCategoryId || !purchaserName) {
        setClientError("采购报销请补全商品名称、采购分类和采购人后再提交。");
        return;
      }
    }

    setClientError(null);

    const payload: Record<string, unknown> = {
      categoryId,
      title: String(formData.get("title") || ""),
      amountTotal: Number(formData.get("amountTotal") || 0),
      expenseDate: String(formData.get("expenseDate") || ""),
      uploadMethod: String(formData.get("uploadMethod") || UploadMethod.MANUAL),
      hasInvoice: typeof hasInvoice === "boolean" ? hasInvoice : String(formData.get("hasInvoice") || "true") === "true",
      remark: String(formData.get("remark") || ""),
      extensionType: submitExtensionType,
      attachments: []
    };

    if (submitExtensionType === ExpenseExtensionType.NONE) {
      payload.entryMode = String(formData.get("entryMode") || ExpenseEntryMode.TOTAL);
      payload.usageScene = String(formData.get("usageScene") || "");
      payload.travelNote = String(formData.get("travelNote") || "");
      payload.relatedPeople = String(formData.get("relatedPeople") || "");
      if (formData.get("unitPrice")) {
        payload.unitPrice = Number(formData.get("unitPrice"));
      }
      if (formData.get("quantity")) {
        payload.quantity = Number(formData.get("quantity"));
      }
    }

    if (submitExtensionType === ExpenseExtensionType.TRAVEL) {
      payload.tripStartDate = String(formData.get("tripStartDate") || "");
      payload.tripEndDate = String(formData.get("tripEndDate") || "");
      payload.claimDays = Number(formData.get("claimDays") || 0);
      payload.destination = String(formData.get("destination") || "");
      payload.tripReason = String(formData.get("tripReason") || "");
      payload.travelerName = String(formData.get("travelerName") || "");
      payload.companions = String(formData.get("companions") || "");
      payload.travelStandard = String(formData.get("travelStandard") || "");
    }

    if (submitExtensionType === ExpenseExtensionType.PURCHASE) {
      payload.productName = String(formData.get("productName") || "");
      payload.purchaseCategoryId = String(formData.get("purchaseCategoryId") || "");
      payload.purchaserName = String(formData.get("purchaserName") || "");
      payload.userName = String(formData.get("userName") || "");
      payload.unitPrice = formData.get("unitPrice") ? Number(formData.get("unitPrice")) : undefined;
      payload.quantity = formData.get("quantity") ? Number(formData.get("quantity")) : undefined;
      payload.shippingFee = formData.get("shippingFee") ? Number(formData.get("shippingFee")) : undefined;
      payload.platform = String(formData.get("platform") || "");
      payload.vendorName = String(formData.get("vendorName") || "");
      payload.productNote = String(formData.get("productNote") || "");
    }

    mutation.mutate(payload as any);
  };

  return (
    <form className="expense-art-page" onSubmit={submitExpense}>
      <section className="expense-art-hero">
        <div className="expense-art-hero__copy">
          <span className="expense-art-eyebrow">SMART CLAIM DRAFT</span>
          <h1>{TEXT.pageTitle}</h1>
          <p>{TEXT.pageDesc}</p>
          <div className="expense-art-guideRow">
            <div className="expense-art-guidePill"><strong>01</strong><span>{TEXT.step1}</span></div>
            <div className="expense-art-guidePill"><strong>02</strong><span>{TEXT.step2}</span></div>
            <div className="expense-art-guidePill"><strong>03</strong><span>{TEXT.step3}</span></div>
          </div>
        </div>
        <aside className="expense-art-heroCard">
          <div>
            <span className="expense-art-heroCard__eyebrow">Friendly reminders</span>
            <h2>{TEXT.reminderTitle}</h2>
            <ul>
              <li>{TEXT.reminder1}</li>
              <li>{TEXT.reminder2}</li>
              <li>{TEXT.reminder3}</li>
            </ul>
          </div>
          <ExpenseSketch />
        </aside>
      </section>

      <Card className="expense-art-formShell">
        <div className="expense-art-formShell__scroll">
          <div className="expense-art-formShell__inner">
            <section className="expense-art-sectionBlock" tabIndex={0}>
              <SectionTitle eyebrow="Basic Info" title={TEXT.basicTitle} desc={TEXT.basicDesc} />
              <div className="expense-art-grid expense-art-grid--two">
                <label className="expense-art-field">
                  <span>{TEXT.category}</span>
                  <Select
                    {...form.register("categoryId")}
                    disabled={categoriesQuery.isLoading || !!categoriesQuery.error}
                    onChange={(event) => {
                      const category = categories.find((item) => item.id === event.target.value);
                      form.setValue("categoryId", event.target.value);
                      form.setValue("extensionType", (category?.extensionType || ExpenseExtensionType.NONE) as never);
                    }}
                  >
                    <option value="">
                      {categoriesQuery.isLoading ? TEXT.loadingCategories : categoriesQuery.error ? TEXT.categoryLoadFailed : TEXT.selectCategory}
                    </option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </label>
                <label className="expense-art-field">
                  <span>{TEXT.title}</span>
                  <Input {...form.register("title")} name="title" placeholder={TEXT.titlePlaceholder} />
                </label>
                <label className="expense-art-field">
                  <span>{TEXT.amountTotal}</span>
                  <Input type="number" step="0.01" {...form.register("amountTotal", { valueAsNumber: true })} name="amountTotal" />
                </label>
                <label className="expense-art-field">
                  <span>{TEXT.expenseDate}</span>
                  <Input type="date" {...form.register("expenseDate")} name="expenseDate" />
                </label>
                <label className="expense-art-field">
                  <span>{TEXT.uploadMethod}</span>
                  <Select {...form.register("uploadMethod")} name="uploadMethod">
                    <option value={UploadMethod.MANUAL}>{TEXT.manual}</option>
                    <option value={UploadMethod.IMAGE}>{TEXT.image}</option>
                    <option value={UploadMethod.PDF}>PDF</option>
                    <option value={UploadMethod.CAMERA}>{TEXT.camera}</option>
                  </Select>
                </label>
                <label className="expense-art-field">
                  <span>{TEXT.hasInvoice}</span>
                  <Select name="hasInvoice" value={String(form.watch("hasInvoice"))} onChange={(event) => form.setValue("hasInvoice", event.target.value === "true")}>
                    <option value="true">{TEXT.withInvoice}</option>
                    <option value="false">{TEXT.withoutInvoice}</option>
                  </Select>
                </label>
              </div>
              <label className="expense-art-field">
                <span>{TEXT.remark}</span>
                <Textarea {...form.register("remark")} name="remark" placeholder={TEXT.remarkPlaceholder} />
              </label>
              <div className="expense-art-inlineNoteRow">
                {selectedCategory?.invoiceRequired ? <Badge variant="warning">{TEXT.invoiceRequired}</Badge> : null}
                {amountTotal > 0 ? <Badge variant="muted">{TEXT.currentAmount}{currency(amountTotal)}</Badge> : null}
                {categoriesQuery.error ? <Badge variant="danger">{TEXT.categoryRefresh}</Badge> : null}
              </div>
            </section>

            <section className="expense-art-sectionBlock">
              <SectionTitle eyebrow="Extended Detail" title={TEXT.detailTitle} desc={TEXT.detailDesc} />
              <div className="expense-art-inlineNoteRow expense-art-inlineNoteRow--top">
                <Badge variant="default">
                  {extensionType === ExpenseExtensionType.NONE ? TEXT.normalExpense : extensionType === ExpenseExtensionType.TRAVEL ? TEXT.travelExpense : TEXT.purchaseExpense}
                </Badge>
              </div>

              {extensionType === ExpenseExtensionType.NONE ? (
                <>
                  <div className="expense-art-grid expense-art-grid--three">
                    <label className="expense-art-field">
                      <span>{TEXT.entryMode}</span>
                      <Select name="entryMode" value={entryMode} onChange={(event) => form.setValue("entryMode", event.target.value as ExpenseEntryMode)}>
                        <option value={ExpenseEntryMode.TOTAL}>{TEXT.totalMode}</option>
                        <option value={ExpenseEntryMode.UNIT_PRICE}>{TEXT.unitPriceMode}</option>
                      </Select>
                    </label>
                    {entryMode === ExpenseEntryMode.UNIT_PRICE ? (
                      <>
                        <label className="expense-art-field"><span>{TEXT.unitPrice}</span><Input type="number" step="0.01" {...form.register("unitPrice", { valueAsNumber: true })} name="unitPrice" /></label>
                        <label className="expense-art-field"><span>{TEXT.quantity}</span><Input type="number" step="0.01" {...form.register("quantity", { valueAsNumber: true })} name="quantity" /></label>
                      </>
                    ) : null}
                  </div>
                  {entryMode === ExpenseEntryMode.UNIT_PRICE ? <Badge variant="warning">{TEXT.suggestedAmount}{currency(unitPrice * quantity)}</Badge> : null}
                  <div className="expense-art-grid expense-art-grid--three">
                    <label className="expense-art-field"><span>{TEXT.usageScene}</span><Input {...form.register("usageScene")} name="usageScene" placeholder={TEXT.usageScenePlaceholder} /></label>
                    <label className="expense-art-field"><span>{TEXT.travelNote}</span><Input {...form.register("travelNote")} name="travelNote" placeholder={TEXT.travelNotePlaceholder} /></label>
                    <label className="expense-art-field"><span>{TEXT.relatedPeople}</span><Input {...form.register("relatedPeople")} name="relatedPeople" placeholder={TEXT.relatedPeoplePlaceholder} /></label>
                  </div>
                </>
              ) : null}

              {extensionType === ExpenseExtensionType.TRAVEL ? (
                <div className="expense-art-grid expense-art-grid--three">
                  <label className="expense-art-field"><span>{TEXT.tripStartDate}</span><Input type="date" {...form.register("tripStartDate")} name="tripStartDate" /></label>
                  <label className="expense-art-field"><span>{TEXT.tripEndDate}</span><Input type="date" {...form.register("tripEndDate")} name="tripEndDate" /></label>
                  <label className="expense-art-field"><span>{TEXT.claimDays}</span><Input type="number" step="0.1" {...form.register("claimDays", { valueAsNumber: true })} name="claimDays" /></label>
                  <label className="expense-art-field"><span>{TEXT.destination}</span><Input {...form.register("destination")} name="destination" /></label>
                  <label className="expense-art-field"><span>{TEXT.travelerName}</span><Input {...form.register("travelerName")} name="travelerName" /></label>
                  <label className="expense-art-field"><span>{TEXT.companions}</span><Input {...form.register("companions")} name="companions" /></label>
                  <label className="expense-art-field expense-art-field--wide"><span>{TEXT.tripReason}</span><Input {...form.register("tripReason")} name="tripReason" /></label>
                  <label className="expense-art-field"><span>{TEXT.travelStandard}</span><Input {...form.register("travelStandard")} name="travelStandard" /></label>
                </div>
              ) : null}

              {extensionType === ExpenseExtensionType.PURCHASE ? (
                <>
                  <div className="expense-art-grid expense-art-grid--three">
                    <label className="expense-art-field"><span>{TEXT.productName}</span><Input {...form.register("productName")} name="productName" /></label>
                    <label className="expense-art-field">
                      <span>{TEXT.purchaseCategory}</span>
                      <Select {...form.register("purchaseCategoryId")} name="purchaseCategoryId">
                        <option value="">{TEXT.selectPurchaseCategory}</option>
                        {purchaseCategories.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </Select>
                    </label>
                    <label className="expense-art-field"><span>{TEXT.purchaserName}</span><Input {...form.register("purchaserName")} name="purchaserName" /></label>
                    <label className="expense-art-field"><span>{TEXT.userName}</span><Input {...form.register("userName")} name="userName" /></label>
                    <label className="expense-art-field"><span>{TEXT.unitPrice}</span><Input type="number" step="0.01" {...form.register("unitPrice", { valueAsNumber: true })} name="unitPrice" /></label>
                    <label className="expense-art-field"><span>{TEXT.quantity}</span><Input type="number" step="0.01" {...form.register("quantity", { valueAsNumber: true })} name="quantity" /></label>
                    <label className="expense-art-field"><span>{TEXT.shippingFee}</span><Input type="number" step="0.01" {...form.register("shippingFee", { valueAsNumber: true })} name="shippingFee" /></label>
                    <label className="expense-art-field"><span>{TEXT.platform}</span><Input {...form.register("platform")} name="platform" /></label>
                    <label className="expense-art-field"><span>{TEXT.vendorName}</span><Input {...form.register("vendorName")} name="vendorName" /></label>
                  </div>
                  <label className="expense-art-field"><span>{TEXT.productNote}</span><Textarea {...form.register("productNote")} name="productNote" placeholder={TEXT.productNotePlaceholder} /></label>
                  <Badge variant={Math.abs(amountTotal - suggestedAmount) > 0.009 ? "warning" : "success"}>{TEXT.purchaseSuggestedAmount}{currency(suggestedAmount)}</Badge>
                </>
              ) : null}
            </section>

            <section className="expense-art-sectionBlock expense-art-sectionBlock--attachment" tabIndex={0}>
              <AttachmentSketch />
              <SectionTitle eyebrow="Attachments" title={TEXT.attachmentTitle} desc={TEXT.attachmentDesc} />
              <div className="expense-art-inlineNoteRow expense-art-inlineNoteRow--top">
                {uploads.length > 0 ? <Badge variant="success">{TEXT.selectedFiles} {uploads.length} {TEXT.fileUnit}</Badge> : null}
              </div>
              <label className="expense-art-uploadZone">
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const next = Array.from(event.target.files || []).map((file) => ({ file, isInvoiceFile: true }));
                    setUploads(next);
                  }}
                />
                <span className="expense-art-uploadZone__title">{TEXT.uploadZoneTitle}</span>
                <span className="expense-art-uploadZone__desc">{TEXT.uploadZoneDesc}</span>
              </label>
              <div className="grid gap-3">
                {uploads.map((upload, index) => (
                  <div key={`${upload.file.name}-${index}`} className="expense-art-uploadItem">
                    <div>
                      <p className="expense-art-uploadItem__name">{upload.file.name}</p>
                      <p className="expense-art-uploadItem__meta">{Math.round(upload.file.size / 1024)} KB</p>
                    </div>
                    <label className="expense-art-checkbox">
                      <input
                        type="checkbox"
                        checked={upload.isInvoiceFile}
                        onChange={(event) => {
                          setUploads((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index ? { ...item, isInvoiceFile: event.target.checked } : item
                            )
                          );
                        }}
                      />
                      <span>{TEXT.invoiceAttachment}</span>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </Card>

      <div className="expense-art-actionBar">
        <div className="expense-art-actionBar__main">
          <Button
            variant="outline"
            type="button"
            onClick={() => setUploads([])}
            disabled={mutation.isPending || uploads.length === 0}
            className="min-w-[160px] expense-art-actionBar__clear"
          >
            {TEXT.clearUploads}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !!categoriesQuery.error}
            className="min-w-[220px] expense-art-actionBar__submit"
            style={{ backgroundColor: "#111827", borderColor: "#111827", color: "#ffffff", boxShadow: "4px 4px 0 rgba(17, 24, 39, 0.18)" }}
          >
            {mutation.isPending ? TEXT.uploading : uploads.length > 0 ? TEXT.uploadAndSubmit : TEXT.submit}
          </Button>
        </div>
        <p className="expense-art-actionBar__hint">{TEXT.submitHint}</p>
        {clientError ? <div className="expense-art-errorBox" role="alert" aria-live="polite">{clientError}</div> : null}
        {!clientError && mutation.error ? <div className="expense-art-errorBox" role="alert" aria-live="polite">{formatExpenseError(mutation.error.message)}</div> : null}
      </div>
    </form>
  );
}




