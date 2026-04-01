"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { apiFetch } from "@/lib/api";
import { currency } from "@/lib/format";

function QuickStartIllustration() {
  return (
    <div className="doodle-callout doodle-callout--illustrated">
      <div className="doodle-callout__bubble">
        <span className="doodle-callout__eyebrow">Quick start</span>
        <strong>先把这张单顺着流程走一遍。</strong>
        <p>建议顺序：新建报销 → 上传附件 → 查看异常提示 → 返回记录页核对状态。</p>
      </div>
      <div className="doodle-callout__figureWrap" aria-hidden="true">
        <img
          className="doodle-callout__figure doodle-float"
          src="https://www.opendoodles.com/reading-side.svg"
          alt=""
          loading="lazy"
        />
      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats = useQuery({
    queryKey: ["my-expenses-summary", currentMonth],
    queryFn: () =>
      apiFetch<Array<{ amountTotal: number; isOverLimit: boolean }>>(`/expenses/my?month=${currentMonth}`)
  });

  const totalAmount = (stats.data || []).reduce((sum, item) => sum + item.amountTotal, 0);
  const overLimitCount = (stats.data || []).filter((item) => item.isOverLimit).length;

  return (
    <AppShell>
      <div className="doodle-page">
        <section className="doodle-hero doodle-hero--split">
          <div>
            <p className="doodle-hero__eyebrow">EMPLOYEE OVERVIEW</p>
            <h1 className="doodle-hero__title">我的首页</h1>
            <p className="doodle-hero__desc">
              查看本月报销概览，快速进入新建流程，并及时查看异常标记与附件状态。
            </p>
          </div>
          <QuickStartIllustration />
        </section>

        <section className="doodle-stats-grid">
          <StatCard label="我的报销总额" value={currency(totalAmount)} hint={`${currentMonth} submitted`} />
          <StatCard label="报销笔数" value={String(stats.data?.length || 0)} hint="Current month" />
          <StatCard label="超额笔数" value={String(overLimitCount)} hint="Current month" />
        </section>

        <section className="doodle-guide-grid">
          <article className="doodle-guide-card">
            <span className="doodle-guide-card__step">01</span>
            <h3>先建报销</h3>
            <p>普通、差旅、采购三类报销都从新建入口开始，先把基础信息填完整。</p>
          </article>
          <article className="doodle-guide-card">
            <span className="doodle-guide-card__step">02</span>
            <h3>再补附件</h3>
            <p>有发票的单据尽量同步上传，管理端查看会更顺畅，也能减少缺票标记。</p>
          </article>
          <article className="doodle-guide-card">
            <span className="doodle-guide-card__step">03</span>
            <h3>看提示</h3>
            <p>系统不会拦截异常，但会标出超额、附件缺失等风险，提交后记得回看。</p>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
