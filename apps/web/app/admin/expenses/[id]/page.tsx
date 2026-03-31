"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { RoleCode } from "@financial-system/types";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch, getApiUrl } from "@/lib/api";
import { currency, shortDate } from "@/lib/format";

export default function AdminExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useQuery({ queryKey: ["admin-expense-detail", id], queryFn: () => apiFetch<any>(`/expenses/${id}`), enabled: Boolean(id) });
  const data = query.data;

  if (!data) {
    return <AppShell requireRole={RoleCode.ADMIN}><p className="text-sm text-slate-500">加载中...</p></AppShell>;
  }

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">报销详情</h1>
          <p className="mt-2 text-sm text-slate-500">管理端可查看异常说明、发票附件和扩展字段。</p>
        </div>
        <Card>
          <CardHeader><CardTitle>{data.title}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <p>申请人：{data.applicantName}</p>
            <p>类别：{data.categoryName}</p>
            <p>金额：{currency(data.amountTotal)}</p>
            <p>费用日期：{shortDate(data.expenseDate)}</p>
            <p>状态：{data.status}</p>
            <p>发票状态：{data.invoiceAttachmentStatus}</p>
            <p>是否有发票：{data.hasInvoice ? "有" : "无"}</p>
            <p>必传发票：{data.invoiceRequiredSnapshot ? "是" : "否"}</p>
            <p>超额金额：{currency(data.overLimitAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>异常与规则提示</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">{data.anomalies.length ? data.anomalies.map((item: any) => <Badge key={item.id} variant="warning">{item.anomalyMessage}</Badge>) : <Badge variant="success">无异常</Badge>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>扩展信息</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-700">{Object.entries(data.detail || {}).map(([key, value]) => <p key={key}>{key}：{String(value ?? "-")}</p>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>附件与发票</CardTitle></CardHeader>
          <CardContent className="grid gap-3">{data.attachments.map((item: any) => <a key={item.id} href={`${getApiUrl()}${item.previewUrl}`} target="_blank" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-blue-700">{item.fileName} {item.isInvoiceFile ? "(发票)" : ""}</a>)}</CardContent>
        </Card>
      </div>
    </AppShell>
  );
}