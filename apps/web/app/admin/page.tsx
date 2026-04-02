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

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="doodle-page">
        <section className="doodle-hero doodle-hero--split">
          <div>
            <p className="doodle-hero__eyebrow">ADMIN CONTROL</p>
            <h1 className="doodle-hero__title">{"\u7ba1\u7406\u9996\u9875"}</h1>
            <p className="doodle-hero__desc">
              {"\u603b\u89c8\u672c\u6708\u62a5\u9500\u3001\u5f02\u5e38\u548c\u5bfc\u51fa\u5165\u53e3\uff0c\u4f18\u5148\u5b9a\u4f4d\u9ad8\u9891\u95ee\u9898\u548c\u5f85\u5904\u7406\u8bb0\u5f55\u3002"}
            </p>
          </div>
          <label className="doodle-filter-field">
            <span>{"\u67e5\u770b\u6708\u4efd"}</span>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
        </section>

        <section className="doodle-stats-grid doodle-stats-grid--admin">
          <StatCard label={"\u603b\u91d1\u989d"} value={currency(overview.data?.totalAmount || 0)} hint="Monthly total" />
          <StatCard label={"\u603b\u7b14\u6570"} value={String(overview.data?.totalCount || 0)} hint="All submissions" />
          <StatCard label={"\u8d85\u989d\u7b14\u6570"} value={String(overview.data?.overLimitCount || 0)} hint="Over limit" />
          <StatCard label={"\u7f3a\u53d1\u7968\u9644\u4ef6"} value={String(overview.data?.invoiceMissingCount || 0)} hint="Missing attachments" />
          <StatCard label={"\u91c7\u8d2d\u5360\u6bd4"} value={`${Math.round((overview.data?.purchaseCountShare || 0) * 100)}%`} hint="Purchase share by count" />
          <StatCard label={"\u5f85\u5904\u7406\u5f02\u5e38"} value={String(overview.data?.pendingAnomalyCount || 0)} hint="Pending alerts" />
        </section>

        <Card className="doodle-surface">
          <CardHeader className="doodle-card-header">
            <CardTitle>{"\u5f85\u5904\u7406\u5f02\u5e38"}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>{"\u6807\u9898"}</TableHeader>
                  <TableHeader>{"\u7533\u8bf7\u4eba"}</TableHeader>
                  <TableHeader>{"\u7c7b\u522b"}</TableHeader>
                  <TableHeader>{"\u91d1\u989d"}</TableHeader>
                  <TableHeader>{"\u5f02\u5e38"}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {anomalies.data?.slice(0, 8).map((item) => (
                  <TableRow key={item.reportId}>
                    <TableCell>
                      <Link className="doodle-link" href={`/admin/expenses/${item.reportId}`}>
                        {item.reportTitle}
                      </Link>
                    </TableCell>
                    <TableCell>{item.applicantName}</TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{currency(item.amountTotal)}</TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      {item.anomalies.map((anomaly, index) => (
                        <Badge key={`${item.reportId}-${anomaly.type}-${index}`} variant="warning">
                          {anomaly.type}
                        </Badge>
                      ))}
                    </TableCell>
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