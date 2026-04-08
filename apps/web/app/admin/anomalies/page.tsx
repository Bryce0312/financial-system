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

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="admin-list-page">
        <section className="admin-list-hero admin-list-hero--compact">
          <div className="admin-list-hero__copy">
            <p className="doodle-hero__eyebrow">ANOMALY ALERTS</p>
            <h1 className="doodle-hero__title">异常记录</h1>
            <p className="doodle-hero__desc">集中查看超额、缺发票和采购字段异常，优先从高频问题入手处理。</p>
          </div>
          <Card className="admin-filter-panel admin-filter-panel--single">
            <CardContent className="admin-filter-panel__content">
              <label className="doodle-filter-field">
                <span>月份</span>
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>
            </CardContent>
          </Card>
        </section>

        <Card className="doodle-surface admin-table-panel">
          <CardHeader className="doodle-card-header admin-table-panel__header">
            <div>
              <CardTitle>异常列表</CardTitle>
              <p className="admin-table-panel__desc">异常说明会保留原始标记结果，点击标题可进入报销详情进一步核对附件和字段。</p>
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
                  {query.data?.map((item) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
