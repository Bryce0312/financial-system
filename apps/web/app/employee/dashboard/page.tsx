"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/format";

export default function EmployeeDashboardPage() {
  const stats = useQuery({
    queryKey: ["my-expenses-summary"],
    queryFn: () => apiFetch<Array<{ amountTotal: number; isOverLimit: boolean }>>("/expenses/my")
  });

  const totalAmount = (stats.data || []).reduce((sum, item) => sum + item.amountTotal, 0);
  const overLimitCount = (stats.data || []).filter((item) => item.isOverLimit).length;

  return (
    <AppShell>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">我的首页</h1>
          <p className="mt-2 text-sm text-slate-500">查看当期报销概览并快速进入新建流程。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="我的报销总额" value={currency(totalAmount)} />
          <StatCard label="报销笔数" value={String(stats.data?.length || 0)} />
          <StatCard label="超额笔数" value={String(overLimitCount)} />
        </div>
      </div>
    </AppShell>
  );
}

