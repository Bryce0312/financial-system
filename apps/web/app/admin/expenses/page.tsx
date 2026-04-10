"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { RoleCode } from "@financial-system/types";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";
import { currency, shortDate } from "@/lib/format";

const timeBasisLabelMap = {
  SUBMITTED_AT: "按提交时间",
  EXPENSE_DATE: "按费用发生时间"
} as const;

export default function AdminExpensesPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [timeBasis, setTimeBasis] = useState<keyof typeof timeBasisLabelMap>("SUBMITTED_AT");
  const deferredMonth = useDeferredValue(month);
  const deferredTimeBasis = useDeferredValue(timeBasis);

  const query = useQuery({
    queryKey: ["admin-expenses", deferredMonth, deferredTimeBasis],
    queryFn: () => apiFetch<any[]>(`/admin/expenses?month=${deferredMonth}&timeBasis=${deferredTimeBasis}`)
  });

  const records = query.data || [];
  const summary = useMemo(() => {
    const overLimitCount = records.filter((item) => item.isOverLimit).length;
    const invoiceProblemCount = records.filter((item) => item.invoiceAttachmentStatus !== "COMPLETE").length;
    return [
      { label: "记录数", value: String(records.length) },
      { label: "时间口径", value: timeBasisLabelMap[timeBasis] },
      { label: "超额提醒", value: `${overLimitCount} 条` },
      { label: "待核发票", value: `${invoiceProblemCount} 条` }
    ];
  }, [records, timeBasis]);

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="admin-list-page admin-records-page admin-records-page--inset workspace-page">
        <section className="workspace-hero workspace-hero--stacked admin-records-hero admin-records-hero--inset">
          <div className="workspace-hero__main admin-records-hero__main">
            <p className="doodle-hero__eyebrow">CLAIM RECORDS</p>
            <h1 className="doodle-hero__title">报销记录</h1>
            <p className="doodle-hero__desc">支持按提交时间或费用发生时间切换口径，重点查看发票状态、超额标签和异常记录。</p>
          </div>
          <Card className="admin-filter-panel admin-records-filterPanel admin-records-filterPanel--inset workspace-filterPanel workspace-filterPanel--compact">
            <CardHeader className="doodle-card-header admin-filter-panel__header admin-records-filterPanel__header">
              <div>
                <p className="admin-export-create__eyebrow">Filter</p>
                <CardTitle className="text-[26px]">筛选</CardTitle>
              </div>
              <p className="admin-table-panel__desc">先收月份，再切换统计口径。筛选完成后，下面的摘要卡和清单会同步变化。</p>
            </CardHeader>
            <CardContent className="admin-filter-panel__content admin-records-filterPanel__content workspace-filterPanel__content">
              <label className="doodle-filter-field">
                <span>月份</span>
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>
              <label className="doodle-filter-field">
                <span>时间口径</span>
                <Select value={timeBasis} onChange={(event) => setTimeBasis(event.target.value as keyof typeof timeBasisLabelMap)}>
                  <option value="SUBMITTED_AT">按提交时间</option>
                  <option value="EXPENSE_DATE">按费用发生时间</option>
                </Select>
              </label>
            </CardContent>
          </Card>
        </section>

        <section className="admin-records-summaryGrid admin-records-summaryGrid--inset workspace-summaryGrid workspace-summaryGrid--records">
          {summary.map((item) => (
            <div key={item.label} className="admin-records-summaryChip workspace-summaryChip">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        <Card className="doodle-surface admin-table-panel admin-records-tablePanel admin-records-tablePanel--inset workspace-tablePanel workspace-tablePanel--records">
          <CardHeader className="doodle-card-header admin-table-panel__header admin-records-tablePanel__header workspace-tablePanel__header">
            <div>
              <p className="admin-export-create__eyebrow">Monthly list</p>
              <CardTitle>本月报销清单</CardTitle>
              <p className="admin-table-panel__desc">点击标题进入详情；在这里集中核对申请人、费用日期、发票状态和异常标签。</p>
            </div>
            <div className="workspace-tablePanel__meta">
              <Badge variant="default">{timeBasisLabelMap[timeBasis]}</Badge>
              <span className="workspace-tablePanel__metaText">共 {records.length} 条</span>
            </div>
          </CardHeader>
          <CardContent className="admin-table-panel__content admin-records-tablePanel__content">
            <div className="admin-table-scroll admin-records-tableScroll">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>标题</TableHeader>
                    <TableHeader>申请人</TableHeader>
                    <TableHeader>类别</TableHeader>
                    <TableHeader>金额</TableHeader>
                    <TableHeader>费用日期</TableHeader>
                    <TableHeader>发票状态</TableHeader>
                    <TableHeader>异常</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length ? (
                    records.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Link className="doodle-link admin-records-link" href={`/admin/expenses/${item.id}`}>
                            {item.title}
                          </Link>
                        </TableCell>
                        <TableCell>{item.applicantName}</TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell>{currency(item.amountTotal)}</TableCell>
                        <TableCell>{shortDate(item.expenseDate)}</TableCell>
                        <TableCell>
                          <Badge variant={item.invoiceAttachmentStatus === "COMPLETE" ? "success" : "warning"}>{item.invoiceAttachmentStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="admin-badge-cluster">
                            {item.isOverLimit ? <Badge variant="warning">超额</Badge> : <Badge variant="success">正常</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="admin-empty-row">
                        当前筛选条件下没有报销记录。
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
