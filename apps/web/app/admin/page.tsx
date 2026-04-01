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
      <div className="doodle-page">
        <section className="doodle-hero doodle-hero--split">
          <div>
            <p className="doodle-hero__eyebrow">ADMIN CONTROL</p>
            <h1 className="doodle-hero__title">管理首页</h1>
            <p className="doodle-hero__desc">总览本月报销、异常和导出入口，优先定位高频问题和待处理记录。</p>
          </div>
          <label className="doodle-filter-field">
            <span>查看月份</span>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
        </section>

        <section className="doodle-stats-grid doodle-stats-grid--admin">
          <StatCard label="总金额" value={currency(overview.data?.totalAmount || 0)} hint="Monthly total" />
          <StatCard label="总笔数" value={String(overview.data?.totalCount || 0)} hint="All submissions" />
          <StatCard label="超额笔数" value={String(overview.data?.overLimitCount || 0)} hint="Over limit" />
          <StatCard label="缺发票附件" value={String(overview.data?.invoiceMissingCount || 0)} hint="Missing attachments" />
          <StatCard label="采购占比" value={`${Math.round((overview.data?.purchaseAmountShare || 0) * 100)}%`} hint="Purchase share" />
          <StatCard label="待处理异常" value={String(overview.data?.pendingAnomalyCount || 0)} hint="Pending alerts" />
        </section>

        <Card className="doodle-surface">
          <CardHeader className="doodle-card-header">
            <CardTitle>待处理异常</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>标题</TableHeader>
                  <TableHeader>申请人</TableHeader>
                  <TableHeader>类别</TableHeader>
                  <TableHeader>金额</TableHeader>
                  <TableHeader>异常</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {anomalies.data?.slice(0, 8).map((item) => (
                  <TableRow key={item.reportId}>
                    <TableCell><Link className="doodle-link" href={`/admin/expenses/${item.reportId}`}>{item.reportTitle}</Link></TableCell>
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