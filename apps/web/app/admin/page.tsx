"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { RoleCode } from "@financial-system/types";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/format";

export default function AdminDashboardPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const overview = useQuery({ queryKey: ["admin-overview", month], queryFn: () => apiFetch<any>(`/admin/stats/overview?month=${month}`) });
  const anomalies = useQuery({ queryKey: ["admin-overview-anomalies", month], queryFn: () => apiFetch<any[]>(`/admin/anomalies?month=${month}`) });

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">管理控制台</h1>
            <p className="mt-2 text-sm text-slate-500">总览本月报销、异常和高频入口。</p>
          </div>
          <label className="grid gap-2 text-sm"><span>月份</span><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="总金额" value={currency(overview.data?.totalAmount || 0)} />
          <StatCard label="总笔数" value={String(overview.data?.totalCount || 0)} />
          <StatCard label="超额笔数" value={String(overview.data?.overLimitCount || 0)} />
          <StatCard label="缺发票附件" value={String(overview.data?.invoiceMissingCount || 0)} />
          <StatCard label="采购占比" value={`${Math.round((overview.data?.purchaseAmountShare || 0) * 100)}%`} />
          <StatCard label="待处理异常" value={String(overview.data?.pendingAnomalyCount || 0)} />
        </div>
        <Card>
          <CardHeader><CardTitle>待处理异常</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead><TableRow><TableHeader>标题</TableHeader><TableHeader>申请人</TableHeader><TableHeader>类别</TableHeader><TableHeader>金额</TableHeader><TableHeader>异常</TableHeader></TableRow></TableHead>
              <TableBody>
                {anomalies.data?.slice(0, 8).map((item) => (
                  <TableRow key={item.reportId}>
                    <TableCell><Link className="font-medium text-blue-700" href={`/admin/expenses/${item.reportId}`}>{item.reportTitle}</Link></TableCell>
                    <TableCell>{item.applicantName}</TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{currency(item.amountTotal)}</TableCell>
                    <TableCell className="flex flex-wrap gap-2">{item.anomalies.map((anomaly: any) => <Badge key={anomaly.id} variant="warning">{anomaly.type}</Badge>)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

