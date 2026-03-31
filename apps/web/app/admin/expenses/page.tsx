"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { RoleCode } from "@financial-system/types";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";
import { currency, shortDate } from "@/lib/format";

export default function AdminExpensesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [timeBasis, setTimeBasis] = useState("SUBMITTED_AT");
  const deferredMonth = useDeferredValue(month);
  const deferredTimeBasis = useDeferredValue(timeBasis);
  const query = useQuery({ queryKey: ["admin-expenses", deferredMonth, deferredTimeBasis], queryFn: () => apiFetch<any[]>(`/admin/expenses?month=${deferredMonth}&timeBasis=${deferredTimeBasis}`) });

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">报销记录</h1>
          <p className="mt-2 text-sm text-slate-500">支持按提交时间或费用发生时间切换查看。</p>
        </div>
        <Card>
          <CardHeader><CardTitle>筛选</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm"><span>月份</span><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
            <label className="grid gap-2 text-sm"><span>时间口径</span><Select value={timeBasis} onChange={(event) => setTimeBasis(event.target.value)}><option value="SUBMITTED_AT">按提交时间</option><option value="EXPENSE_DATE">按费用发生时间</option></Select></label>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead><TableRow><TableHeader>标题</TableHeader><TableHeader>申请人</TableHeader><TableHeader>类别</TableHeader><TableHeader>金额</TableHeader><TableHeader>费用日期</TableHeader><TableHeader>发票状态</TableHeader><TableHeader>异常</TableHeader></TableRow></TableHead>
              <TableBody>
                {query.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Link className="font-medium text-blue-700" href={`/admin/expenses/${item.id}`}>{item.title}</Link></TableCell>
                    <TableCell>{item.applicantName}</TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{currency(item.amountTotal)}</TableCell>
                    <TableCell>{shortDate(item.expenseDate)}</TableCell>
                    <TableCell>{item.invoiceAttachmentStatus}</TableCell>
                    <TableCell>{item.isOverLimit ? <Badge variant="warning">超额</Badge> : <Badge variant="success">正常</Badge>}</TableCell>
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

