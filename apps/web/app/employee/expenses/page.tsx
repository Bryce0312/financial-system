"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";
import { currency, shortDate } from "@/lib/format";

export default function EmployeeExpensesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const deferredMonth = useDeferredValue(month);
  const query = useQuery({
    queryKey: ["my-expenses", deferredMonth],
    queryFn: () => apiFetch<Array<{ id: string; title: string; categoryName: string; amountTotal: number; expenseDate: string; status: string; isOverLimit: boolean; invoiceAttachmentStatus: string }>>(`/expenses/my?month=${deferredMonth}`)
  });

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">我的报销</h1>
            <p className="mt-2 text-sm text-slate-500">按月份查看已提交报销，进入详情查看异常标签和附件。</p>
          </div>
          <Link href="/employee/expenses/new" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white">新建报销</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>筛选</CardTitle>
          </CardHeader>
          <CardContent className="max-w-sm">
            <label className="grid gap-2 text-sm"><span>月份</span><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>标题</TableHeader>
                  <TableHeader>类别</TableHeader>
                  <TableHeader>金额</TableHeader>
                  <TableHeader>日期</TableHeader>
                  <TableHeader>状态</TableHeader>
                  <TableHeader>异常</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {query.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Link className="font-medium text-blue-700" href={`/employee/expenses/${item.id}`}>{item.title}</Link></TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{currency(item.amountTotal)}</TableCell>
                    <TableCell>{shortDate(item.expenseDate)}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      {item.isOverLimit ? <Badge variant="warning">超额</Badge> : <Badge variant="success">正常</Badge>}
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

