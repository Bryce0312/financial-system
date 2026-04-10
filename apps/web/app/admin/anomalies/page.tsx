"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { RoleCode } from "@financial-system/types";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/format";

export default function AdminAnomaliesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const query = useQuery({ queryKey: ["admin-anomalies", month], queryFn: () => apiFetch<any[]>(`/admin/anomalies?month=${month}`) });
  const items = query.data || [];

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="admin-list-page workspace-page">
        <section className="workspace-hero workspace-hero--stacked">
          <div className="workspace-hero__main">
            <p className="doodle-hero__eyebrow">ANOMALY ALERTS</p>
            <h1 className="doodle-hero__title">异常记录</h1>
            <p className="doodle-hero__desc">集中查看超额、缺发票和采购字段异常，优先从高频问题入手处理。</p>
          </div>
          <Card className="admin-filter-panel workspace-filterPanel workspace-filterPanel--single">
            <CardHeader className="doodle-card-header admin-filter-panel__header">
              <CardTitle className="text-[26px]">筛选月份</CardTitle>
            </CardHeader>
            <CardContent className="admin-filter-panel__content workspace-filterPanel__content">
              <label className="doodle-filter-field">
                <span>月份</span>
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>
            </CardContent>
          </Card>
        </section>

        <Card className="doodle-surface admin-table-panel workspace-tablePanel">
          <CardHeader className="doodle-card-header admin-table-panel__header workspace-tablePanel__header">
            <div>
              <p className="admin-export-create__eyebrow">Anomaly list</p>
              <CardTitle>异常列表</CardTitle>
              <p className="admin-table-panel__desc">异常说明会保留原始标记结果，点击标题可进入报销详情进一步核对附件和字段。</p>
            </div>
            <div className="workspace-tablePanel__meta">
              <Badge variant="warning">{items.length} 条异常</Badge>
            </div>
          </CardHeader>
          <CardContent className="admin-table-panel__content">
            <div className="admin-table-scroll">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>标题</TableHeader>
                    <TableHeader>申请人</TableHeader>
                    <TableHeader>类别</TableHeader>
                    <TableHeader>金额</TableHeader>
                    <TableHeader>异常说明</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? (
                    items.map((item) => (
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
                            {item.anomalies.map((anomaly: any) => (
                              <Badge key={anomaly.id} variant="warning">
                                {anomaly.message}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="admin-empty-row">
                        当前月份没有异常记录。
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