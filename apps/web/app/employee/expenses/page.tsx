"use client";

import { useDeferredValue, useMemo, useState } from "react";
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
    queryFn: () =>
      apiFetch<
        Array<{
          id: string;
          title: string;
          categoryName: string;
          amountTotal: number;
          expenseDate: string;
          status: string;
          isOverLimit: boolean;
          invoiceAttachmentStatus: string;
        }>
      >(`/expenses/my?month=${deferredMonth}`)
  });

  const items = query.data || [];
  const summary = useMemo(() => {
    const overLimitCount = items.filter((item) => item.isOverLimit).length;
    const invoiceProblemCount = items.filter((item) => item.invoiceAttachmentStatus !== "COMPLETE").length;

    return [
      { label: "本月记录", value: String(items.length) },
      { label: "超额提醒", value: `${overLimitCount} 条` },
      { label: "待核发票", value: `${invoiceProblemCount} 条` }
    ];
  }, [items]);

  return (
    <AppShell>
      <div className="workspace-page workspace-page--employee">
        <section className="workspace-hero workspace-hero--employee">
          <div className="workspace-hero__main">
            <p className="doodle-hero__eyebrow">MY CLAIMS</p>
            <h1 className="doodle-hero__title">我的报销</h1>
            <p className="doodle-hero__desc">按月份查看已提交报销，进入详情页查看异常标签、发票状态和附件信息。</p>
          </div>
          <Link href="/employee/expenses/new" className="doodle-primary-action workspace-hero__action workspace-hero__action--employee">
            新建报销
          </Link>
        </section>

        <section className="workspace-toolbar workspace-toolbar--employee">
          <Card className="workspace-filterPanel workspace-filterPanel--single">
            <CardHeader className="doodle-card-header workspace-filterPanel__header">
              <div>
                <p className="admin-export-create__eyebrow">Filter</p>
                <CardTitle className="text-[24px]">筛选</CardTitle>
              </div>
              <p className="admin-table-panel__desc">先按月份收口，再进入下方清单查看状态、附件与异常标记。</p>
            </CardHeader>
            <CardContent className="workspace-filterPanel__content">
              <label className="doodle-filter-field">
                <span>月份</span>
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>
            </CardContent>
          </Card>

          <div className="workspace-summaryGrid workspace-summaryGrid--employee">
            {summary.map((item) => (
              <div key={item.label} className="workspace-summaryChip workspace-summaryChip--employee">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <Card className="doodle-surface workspace-tablePanel workspace-tablePanel--employee">
          <CardHeader className="doodle-card-header workspace-tablePanel__header">
            <div>
              <p className="admin-export-create__eyebrow">Claim List</p>
              <CardTitle>报销清单</CardTitle>
              <p className="admin-table-panel__desc">查看提交状态、发票状态和异常标签，点击标题进入详情。</p>
            </div>
            <div className="workspace-tablePanel__meta">
              <Badge variant="default">{month.replace("-", "年")}月</Badge>
              <span className="workspace-tablePanel__metaText">共 {items.length} 条</span>
            </div>
          </CardHeader>
          <CardContent className="admin-table-panel__content">
            <div className="admin-table-scroll">
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
                  {items.length ? (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Link className="doodle-link" href={`/employee/expenses/${item.id}`}>
                            {item.title}
                          </Link>
                        </TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell>{currency(item.amountTotal)}</TableCell>
                        <TableCell>{shortDate(item.expenseDate)}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>
                          {item.isOverLimit ? <Badge variant="warning">超额</Badge> : <Badge variant="success">正常</Badge>}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="admin-empty-row">
                        当前月份还没有报销记录。
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
