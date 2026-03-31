"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch, getApiUrl } from "@/lib/api";
import { currency, shortDate } from "@/lib/format";

export default function EmployeeExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useQuery({ queryKey: ["expense-detail", id], queryFn: () => apiFetch<any>(`/expenses/${id}`), enabled: Boolean(id) });
  const data = query.data;

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">报销详情</h1>
          <p className="mt-2 text-sm text-slate-500">查看基础信息、异常说明和附件。</p>
        </div>
        {data ? (
          <>
            <Card>
              <CardHeader><CardTitle>{data.title}</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <p>类别：{data.categoryName}</p>
                <p>金额：{currency(data.amountTotal)}</p>
                <p>日期：{shortDate(data.expenseDate)}</p>
                <p>状态：{data.status}</p>
                <p>发票状态：{data.invoiceAttachmentStatus}</p>
                <p>超额金额：{currency(data.overLimitAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>异常标签</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-3">{data.anomalies.length ? data.anomalies.map((item: any) => <Badge key={item.id} variant="warning">{item.anomalyMessage}</Badge>) : <Badge variant="success">无异常</Badge>}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>扩展信息</CardTitle></CardHeader>
              <CardContent className="grid gap-2 text-sm text-slate-700">{Object.entries(data.detail || {}).map(([key, value]) => <p key={key}>{key}：{String(value ?? "-")}</p>)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>附件</CardTitle></CardHeader>
              <CardContent className="grid gap-3">{data.attachments.map((item: any) => <a key={item.id} href={`${getApiUrl()}${item.previewUrl}`} target="_blank" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-blue-700">{item.fileName}</a>)}</CardContent>
            </Card>
          </>
        ) : <p className="text-sm text-slate-500">加载中...</p>}
      </div>
    </AppShell>
  );
}