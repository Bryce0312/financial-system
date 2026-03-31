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
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea } from "@financial-system/ui";

import { apiFetch, getApiUrl } from "@/lib/api";
import { currency } from "@/lib/format";

interface UploadItem {
  file: File;
  isInvoiceFile: boolean;
}

export function ExpenseForm() {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadItem[]>([]);

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

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === form.watch("categoryId")),
    [categories, form]
  );

  const extensionType = selectedCategory?.extensionType || ExpenseExtensionType.NONE;
  const entryMode = form.watch("entryMode");
  const hasInvoice = form.watch("hasInvoice");
  const unitPrice = Number(form.watch("unitPrice") || 0);
  const quantity = Number(form.watch("quantity") || 0);
  const shippingFee = Number((form.watch() as Record<string, unknown>).shippingFee || 0);
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
          extensionType,
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
    const payload: Record<string, unknown> = {
      categoryId: String(formData.get("categoryId") || ""),
      title: String(formData.get("title") || ""),
      amountTotal: Number(formData.get("amountTotal") || 0),
      expenseDate: String(formData.get("expenseDate") || ""),
      uploadMethod: String(formData.get("uploadMethod") || UploadMethod.MANUAL),
      hasInvoice: typeof hasInvoice === "boolean" ? hasInvoice : String(formData.get("hasInvoice") || "true") === "true",
      remark: String(formData.get("remark") || ""),
      extensionType,
      attachments: []
    };

    if (extensionType === ExpenseExtensionType.NONE) {
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

    if (extensionType === ExpenseExtensionType.TRAVEL) {
      payload.tripStartDate = String(formData.get("tripStartDate") || "");
      payload.tripEndDate = String(formData.get("tripEndDate") || "");
      payload.claimDays = Number(formData.get("claimDays") || 0);
      payload.destination = String(formData.get("destination") || "");
      payload.tripReason = String(formData.get("tripReason") || "");
      payload.travelerName = String(formData.get("travelerName") || "");
      payload.companions = String(formData.get("companions") || "");
      payload.travelStandard = String(formData.get("travelStandard") || "");
    }

    if (extensionType === ExpenseExtensionType.PURCHASE) {
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
    <form className="grid gap-6" onSubmit={submitExpense}>
      <Card>
        <CardHeader>
          <CardTitle>{"\u65b0\u5efa\u62a5\u9500"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>{"\u62a5\u9500\u7c7b\u522b"}</span>
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
                  {categoriesQuery.isLoading
                    ? "\u6b63\u5728\u52a0\u8f7d\u7c7b\u522b..."
                    : categoriesQuery.error
                      ? "\u7c7b\u522b\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55"
                      : "\u8bf7\u9009\u62e9\u7c7b\u522b"}
                </option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u6807\u9898"}</span>
              <Input {...form.register("title")} name="title" placeholder={"\u4f8b\u5982\uff1a\u6253\u8f66\u8d39"} />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u91d1\u989d\u603b\u8ba1"}</span>
              <Input type="number" step="0.01" {...form.register("amountTotal", { valueAsNumber: true })} name="amountTotal" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u8d39\u7528\u53d1\u751f\u65e5\u671f"}</span>
              <Input type="date" {...form.register("expenseDate")} name="expenseDate" />
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u4e0a\u4f20\u65b9\u5f0f"}</span>
              <Select {...form.register("uploadMethod")} name="uploadMethod">
                <option value={UploadMethod.MANUAL}>{"\u624b\u52a8"}</option>
                <option value={UploadMethod.IMAGE}>{"\u56fe\u7247"}</option>
                <option value={UploadMethod.PDF}>PDF</option>
                <option value={UploadMethod.CAMERA}>{"\u62cd\u7167"}</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>{"\u662f\u5426\u6709\u53d1\u7968"}</span>
              <Select
                name="hasInvoice"
                value={String(form.watch("hasInvoice"))}
                onChange={(event) => form.setValue("hasInvoice", event.target.value === "true")}
              >
                <option value="true">{"\u6709"}</option>
                <option value="false">{"\u65e0"}</option>
              </Select>
            </label>
          </div>
          <label className="grid gap-2 text-sm">
            <span>{"\u5907\u6ce8"}</span>
            <Textarea {...form.register("remark")} name="remark" placeholder={"\u8865\u5145\u8bf4\u660e"} />
          </label>
          {categoriesQuery.error ? <p className="text-sm text-rose-600">{"\u7c7b\u522b\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u540e\u91cd\u8bd5\u3002"}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{"\u6269\u5c55\u4fe1\u606f"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          {extensionType === ExpenseExtensionType.NONE ? (
            <>
              <div className="grid gap-5 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span>{"\u91d1\u989d\u5f55\u5165\u6a21\u5f0f"}</span>
                  <Select name="entryMode" value={entryMode} onChange={(event) => form.setValue("entryMode", event.target.value as ExpenseEntryMode)}>
                    <option value={ExpenseEntryMode.TOTAL}>{"\u603b\u91d1\u989d\u6a21\u5f0f"}</option>
                    <option value={ExpenseEntryMode.UNIT_PRICE}>{"\u5355\u4ef7\u6a21\u5f0f"}</option>
                  </Select>
                </label>
                {entryMode === ExpenseEntryMode.UNIT_PRICE ? (
                  <>
                    <label className="grid gap-2 text-sm">
                      <span>{"\u5355\u4ef7"}</span>
                      <Input type="number" step="0.01" {...form.register("unitPrice", { valueAsNumber: true })} name="unitPrice" />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span>{"\u6570\u91cf"}</span>
                      <Input type="number" step="0.01" {...form.register("quantity", { valueAsNumber: true })} name="quantity" />
                    </label>
                  </>
                ) : null}
              </div>
              {entryMode === ExpenseEntryMode.UNIT_PRICE ? <Badge variant="warning">{"\u7cfb\u7edf\u5efa\u8bae\u91d1\u989d\uff1a"}{currency(unitPrice * quantity)}</Badge> : null}
              <div className="grid gap-5 md:grid-cols-3">
                <label className="grid gap-2 text-sm"><span>{"\u4f7f\u7528\u573a\u666f\u8bf4\u660e"}</span><Input {...form.register("usageScene")} name="usageScene" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u51fa\u884c\u8bf4\u660e"}</span><Input {...form.register("travelNote")} name="travelNote" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u5173\u8054\u4eba\u5458"}</span><Input {...form.register("relatedPeople")} name="relatedPeople" /></label>
              </div>
            </>
          ) : null}

          {extensionType === ExpenseExtensionType.TRAVEL ? (
            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2 text-sm"><span>{"\u51fa\u5dee\u5f00\u59cb\u65e5\u671f"}</span><Input type="date" {...form.register("tripStartDate")} name="tripStartDate" /></label>
              <label className="grid gap-2 text-sm"><span>{"\u51fa\u5dee\u7ed3\u675f\u65e5\u671f"}</span><Input type="date" {...form.register("tripEndDate")} name="tripEndDate" /></label>
              <label className="grid gap-2 text-sm"><span>{"\u62a5\u9500\u5929\u6570"}</span><Input type="number" step="0.1" {...form.register("claimDays", { valueAsNumber: true })} name="claimDays" /></label>
              <label className="grid gap-2 text-sm"><span>{"\u51fa\u5dee\u5730\u70b9"}</span><Input {...form.register("destination")} name="destination" /></label>
              <label className="grid gap-2 text-sm"><span>{"\u51fa\u5dee\u4eba"}</span><Input {...form.register("travelerName")} name="travelerName" /></label>
              <label className="grid gap-2 text-sm"><span>{"\u540c\u884c\u4eba\u5458"}</span><Input {...form.register("companions")} name="companions" /></label>
              <label className="grid gap-2 text-sm md:col-span-2"><span>{"\u51fa\u5dee\u4e8b\u7531"}</span><Input {...form.register("tripReason")} name="tripReason" /></label>
              <label className="grid gap-2 text-sm"><span>{"\u5dee\u65c5\u6807\u51c6"}</span><Input {...form.register("travelStandard")} name="travelStandard" /></label>
            </div>
          ) : null}

          {extensionType === ExpenseExtensionType.PURCHASE ? (
            <>
              <div className="grid gap-5 md:grid-cols-3">
                <label className="grid gap-2 text-sm"><span>{"\u5546\u54c1\u540d\u79f0"}</span><Input {...form.register("productName")} name="productName" /></label>
                <label className="grid gap-2 text-sm">
                  <span>{"\u91c7\u8d2d\u5206\u7c7b"}</span>
                  <Select {...form.register("purchaseCategoryId")} name="purchaseCategoryId">
                    <option value="">{"\u8bf7\u9009\u62e9\u91c7\u8d2d\u5206\u7c7b"}</option>
                    {purchaseCategories.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-2 text-sm"><span>{"\u91c7\u8d2d\u4eba"}</span><Input {...form.register("purchaserName")} name="purchaserName" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u4f7f\u7528\u4eba"}</span><Input {...form.register("userName")} name="userName" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u5355\u4ef7"}</span><Input type="number" step="0.01" {...form.register("unitPrice", { valueAsNumber: true })} name="unitPrice" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u6570\u91cf"}</span><Input type="number" step="0.01" {...form.register("quantity", { valueAsNumber: true })} name="quantity" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u90ae\u8d39"}</span><Input type="number" step="0.01" {...form.register("shippingFee", { valueAsNumber: true })} name="shippingFee" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u91c7\u8d2d\u5e73\u53f0"}</span><Input {...form.register("platform")} name="platform" /></label>
                <label className="grid gap-2 text-sm"><span>{"\u5546\u5bb6 / \u4f9b\u5e94\u5546"}</span><Input {...form.register("vendorName")} name="vendorName" /></label>
              </div>
              <label className="grid gap-2 text-sm"><span>{"\u5546\u54c1\u8bf4\u660e"}</span><Textarea {...form.register("productNote")} name="productNote" /></label>
              <Badge variant={Math.abs((form.watch("amountTotal") || 0) - suggestedAmount) > 0.009 ? "warning" : "success"}>
                {"\u91c7\u8d2d\u660e\u7ec6\u5efa\u8bae\u91d1\u989d\uff1a"}{currency(suggestedAmount)}
              </Badge>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{"\u9644\u4ef6\u4e0a\u4f20"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(event) => {
              const next = Array.from(event.target.files || []).map((file) => ({ file, isInvoiceFile: true }));
              setUploads(next);
            }}
          />
          <p className="text-sm text-slate-500">{"\u9009\u62e9\u6587\u4ef6\u540e\uff0c\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae\u4f1a\u5148\u4e0a\u4f20\u9644\u4ef6\uff0c\u518d\u521b\u5efa\u62a5\u9500\u5355\u3002"}</p>
          <div className="grid gap-3">
            {uploads.map((upload, index) => (
              <div key={`${upload.file.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{upload.file.name}</p>
                  <p className="text-xs text-slate-500">{Math.round(upload.file.size / 1024)} KB</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
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
                  {"\u4f5c\u4e3a\u53d1\u7968\u9644\u4ef6"}
                </label>
              </div>
            ))}
          </div>
          {selectedCategory?.invoiceRequired ? <Badge variant="warning">{"\u5f53\u524d\u7c7b\u522b\u8981\u6c42\u81f3\u5c11\u4e0a\u4f20 1 \u4e2a\u53d1\u7968\u9644\u4ef6\u3002"}</Badge> : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
        <Button
          type="submit"
          disabled={mutation.isPending || !!categoriesQuery.error}
          className="min-w-[220px] shadow-sm"
          style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "44px" }}
        >
          {mutation.isPending
            ? "\u4e0a\u4f20\u4e2d..."
            : uploads.length > 0
              ? "\u4e0a\u4f20\u9644\u4ef6\u5e76\u63d0\u4ea4\u62a5\u9500"
              : "\u63d0\u4ea4\u62a5\u9500"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setUploads([])}
          disabled={mutation.isPending || uploads.length === 0}
          className="min-w-[160px]"
        >
          {"\u6e05\u7a7a\u5df2\u9009\u9644\u4ef6"}
        </Button>
        {mutation.error ? <p className="text-sm text-rose-600">{mutation.error.message}</p> : null}
        <p className="text-sm text-slate-500">{"\u4e0a\u4f20\u63a5\u53e3\uff1a"}{getApiUrl()}</p>
      </div>
    </form>
  );
}