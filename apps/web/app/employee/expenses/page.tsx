"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

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
      <div className="doodle-page">
        <section className="doodle-hero doodle-hero--split">
          <div>
            <p className="doodle-hero__eyebrow">MY CLAIMS</p>
            <h1 className="doodle-hero__title">我的报销</h1>
            <p className="doodle-hero__desc">按月份查看已提交报销，进入详情页查看异常标签、发票状态和附件信息。</p>
          </div>
          <Link href="/employee/expenses/new" className="doodle-primary-action">新建报销</Link>
        </section>

        <Card className="doodle-surface doodle-surface--compact">
          <CardHeader className="doodle-card-header"><CardTitle>筛选</CardTitle></CardHeader>
          <CardContent className="max-w-sm pt-3">
            <label className="doodle-filter-field">
              <span>月份</span>
              <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
          </CardContent>
        </Card>

        <Card className="doodle-surface">
          <CardContent className="overflow-x-auto pt-4">
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
                    <TableCell><Link className="doodle-link" href={`/employee/expenses/${item.id}`}>{item.title}</Link></TableCell>
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