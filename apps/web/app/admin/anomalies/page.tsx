"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { RoleCode } from "@financial-system/types";
import { Badge, Card, CardContent, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/format";

export default function AdminAnomaliesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const query = useQuery({ queryKey: ["admin-anomalies", month], queryFn: () => apiFetch<any[]>(`/admin/anomalies?month=${month}`) });

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">异常记录</h1>
            <p className="mt-2 text-sm text-slate-500">集中查看超额和票据异常。</p>
          </div>
          <label className="grid gap-2 text-sm"><span>月份</span><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
        </div>
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead><TableRow><TableHeader>标题</TableHeader><TableHeader>申请人</TableHeader><TableHeader>类别</TableHeader><TableHeader>金额</TableHeader><TableHeader>异常说明</TableHeader></TableRow></TableHead>
              <TableBody>
                {query.data?.map((item) => (
                  <TableRow key={item.reportId}>
                    <TableCell><Link className="font-medium text-blue-700" href={`/admin/expenses/${item.reportId}`}>{item.reportTitle}</Link></TableCell>
                    <TableCell>{item.applicantName}</TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{currency(item.amountTotal)}</TableCell>
                    <TableCell className="flex flex-wrap gap-2">{item.anomalies.map((anomaly: any) => <Badge key={anomaly.id} variant="warning">{anomaly.message}</Badge>)}</TableCell>
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

