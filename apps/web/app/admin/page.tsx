"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { type AnomalyViewItem, type DashboardOverview, RoleCode } from "@financial-system/types";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/format";

export default function AdminDashboardPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const overview = useQuery({
    queryKey: ["admin-overview", month],
    queryFn: () => apiFetch<DashboardOverview>(`/admin/stats/overview?month=${month}`)
  });
  const anomalies = useQuery({
    queryKey: ["admin-overview-anomalies", month],
    queryFn: () => apiFetch<AnomalyViewItem[]>(`/admin/anomalies?month=${month}`)
  });

  const anomalyItems = anomalies.data?.slice(0, 8) ?? [];

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="doodle-page admin-overview-page admin-overview-page--inset">
        <section className="doodle-hero doodle-hero--split admin-overview-hero">
          <div className="admin-overview-hero__copy">
            <p className="doodle-hero__eyebrow">ADMIN CONTROL</p>
            <h1 className="doodle-hero__title">管理首页</h1>
            <p className="doodle-hero__desc">总览本月报销、异常和导出入口，优先定位高频问题和待处理记录。</p>
          </div>
          <Card className="admin-filter-panel admin-filter-panel--single admin-overview-filterCard admin-overview-filterCard--inset">
            <CardHeader className="doodle-card-header admin-filter-panel__header admin-overview-filterCard__header">
              <div>
                <p className="admin-export-create__eyebrow">Overview month</p>
                <CardTitle className="text-[26px]">查看月份</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="admin-filter-panel__content admin-overview-filterCard__content">
              <label className="doodle-filter-field">
                <span>统计月份</span>
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>
            </CardContent>
          </Card>
        </section>

        <section className="doodle-stats-grid doodle-stats-grid--admin admin-overview-stats admin-overview-stats--inset">
          <StatCard label="总金额" value={currency(overview.data?.totalAmount || 0)} />
          <StatCard label="总笔数" value={String(overview.data?.totalCount || 0)} />
          <StatCard label="超额笔数" value={String(overview.data?.overLimitCount || 0)} hint="Over limit" />
          <StatCard label="缺发票附件" value={String(overview.data?.invoiceMissingCount || 0)} hint="Missing attachments" />
          <StatCard label="采购占比" value={`${Math.round((overview.data?.purchaseCountShare || 0) * 100)}%`} />
          <StatCard label="待处理异常" value={String(overview.data?.pendingAnomalyCount || 0)} />
        </section>

        <Card className="doodle-surface admin-overview-tableCard admin-overview-tableCard--inset">
          <CardHeader className="doodle-card-header admin-overview-tableCard__header">
            <div>
              <p className="doodle-hero__eyebrow admin-overview-tableCard__eyebrow">Exception queue</p>
              <CardTitle>待处理异常</CardTitle>
              <p className="admin-table-panel__desc">优先处理超额、缺发票和采购字段缺失等高频异常，点击标题进入详情。</p>
            </div>
            <Badge variant="warning">{anomalyItems.length} 条待检查</Badge>
          </CardHeader>
          <CardContent className="admin-table-panel__content admin-overview-tableCard__content">
            <div className="admin-table-scroll">
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
                  {anomalyItems.length ? (
                    anomalyItems.map((item) => (
                      <TableRow key={item.reportId}>
                        <TableCell>
                          <Link className="doodle-link" href={`/admin/expenses/${item.reportId}`}>
                            {item.reportTitle}
                          </Link>
                        </TableCell>
                        <TableCell>{item.applicantName}</TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell>{currency(item.amountTotal)}</TableCell>
                        <TableCell>
                          <div className="admin-badge-cluster">
                            {item.anomalies.map((anomaly, index) => (
                              <Badge key={`${item.reportId}-${anomaly.type}-${index}`} variant="warning">
                                {anomaly.type}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="admin-empty-row">
                        当前月份还没有待处理异常。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
