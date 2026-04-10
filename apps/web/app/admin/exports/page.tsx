"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { RoleCode } from "@financial-system/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch, downloadApiFile } from "@/lib/api";

export default function ExportsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const monthLabel = useMemo(() => month.replace("-", "年") + "月", [month]);

  const jobQuery = useQuery({
    queryKey: ["export-job", lastJobId],
    queryFn: () => apiFetch<any>(`/admin/exports/${lastJobId}`),
    enabled: Boolean(lastJobId),
    refetchInterval: (query) => (query.state.data?.status === "COMPLETED" || query.state.data?.status === "FAILED" ? false : 2000)
  });

  const mutation = useMutation({
    mutationFn: () => apiFetch<any>("/admin/exports/monthly", { method: "POST", body: JSON.stringify({ month }) }),
    onSuccess: (job) => setLastJobId(job.id)
  });

  async function handleDownload() {
    if (!jobQuery.data?.id) {
      return;
    }

    try {
      setDownloading(true);
      await downloadApiFile(`/admin/exports/${jobQuery.data.id}/download`, `financial-export-${jobQuery.data.month}.xlsx`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="admin-list-page admin-export-page">
        <section className="admin-list-hero admin-list-hero--compact admin-export-hero">
          <div className="admin-list-hero__copy admin-export-hero__copy">
            <p className="doodle-hero__eyebrow">EXPORT CENTER</p>
            <h1 className="doodle-hero__title">导出中心</h1>
            <p className="doodle-hero__desc">按月份创建标准 Excel 导出，完成后直接下载，继续在 WPS 或 Excel 中核对发票预览。</p>
          </div>
        </section>

        <section className="admin-export-layout">
          <div className="admin-export-workspace">
            <Card className="admin-side-panel admin-export-create admin-export-card admin-export-card--primary">
              <CardHeader className="doodle-card-header admin-side-panel__header admin-export-create__header">
                <div>
                  <p className="admin-export-create__eyebrow">Create export</p>
                  <CardTitle>创建月度导出</CardTitle>
                </div>
                <p className="admin-table-panel__desc">先选导出月份，再发起任务。左侧负责创建与下载，右侧只保留导出内容说明，避免信息互相挤压。</p>
              </CardHeader>
              <CardContent className="admin-side-panel__content admin-export-create__content">
                <label className="doodle-filter-field admin-export-field">
                  <span>月份</span>
                  <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
                </label>

                <div className="admin-export-actions">
                  <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="admin-side-panel__primary admin-side-panel__primary--dark admin-export-actions__primary">
                    <span className="admin-side-panel__primaryLabel">{mutation.isPending ? "创建中..." : `创建 ${monthLabel} 导出`}</span>
                  </Button>
                  <p className="admin-export-actions__hint">导出任务会异步执行，创建后页面会自动轮询到完成状态。</p>
                  {jobQuery.data?.downloadUrl ? (
                    <Button variant="outline" className="admin-side-panel__secondary admin-export-actions__secondary" onClick={handleDownload} disabled={downloading}>
                      <span>{downloading ? "下载中..." : "下载 Excel"}</span>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {jobQuery.data ? (
              <Card className="admin-export-card admin-export-card--status">
                <CardHeader className="doodle-card-header admin-export-statusCard__header">
                  <div>
                    <p className="admin-export-create__eyebrow">Latest job</p>
                    <CardTitle>任务状态</CardTitle>
                  </div>
                  <p className="admin-table-panel__desc">最近一次导出任务会显示在这里，便于快速确认状态、月份和下载入口。</p>
                </CardHeader>
                <CardContent className="admin-export-statusCard__content">
                  <div className="admin-status-board admin-export-statusBoard">
                    <div className="admin-status-board__row">
                      <span>任务状态</span>
                      <Badge variant={jobQuery.data.status === "COMPLETED" ? "success" : jobQuery.data.status === "FAILED" ? "warning" : "default"}>
                        {jobQuery.data.status}
                      </Badge>
                    </div>
                    <div className="admin-status-board__row">
                      <span>导出月份</span>
                      <strong>{jobQuery.data.month}</strong>
                    </div>
                    <div className="admin-status-board__row">
                      <span>任务编号</span>
                      <strong>{jobQuery.data.id.slice(0, 8)}</strong>
                    </div>
                  </div>
                  {jobQuery.data.errorMessage ? <p className="text-sm text-rose-600">{jobQuery.data.errorMessage}</p> : null}
                </CardContent>
              </Card>
            ) : (
              <Card className="admin-export-card admin-export-card--status admin-export-card--placeholder">
                <CardContent className="admin-export-placeholder">
                  <strong>还没有导出任务</strong>
                  <p>先创建一次月度导出，这里会自动显示最新任务状态、月份和下载入口。</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="doodle-surface admin-table-panel admin-export-notes admin-export-card admin-export-card--notes">
            <CardHeader className="doodle-card-header admin-table-panel__header admin-export-notes__header">
              <div>
                <p className="admin-export-create__eyebrow">What you get</p>
                <CardTitle>导出说明</CardTitle>
                <p className="admin-table-panel__desc">右侧只保留导出内容和使用方式，避免跟创建动作和任务状态混在同一张卡片里。</p>
              </div>
            </CardHeader>
            <CardContent className="admin-table-panel__content admin-copy-block admin-export-notes__content">
              <div className="admin-export-noteList">
                <div>
                  <strong>报销明细</strong>
                  <p>包含基础字段和发票预览列，方便直接核对附件与票据状态。</p>
                </div>
                <div>
                  <strong>管理汇总</strong>
                  <p>分类汇总、员工汇总、采购明细和异常记录会一并保留，适合月度复盘。</p>
                </div>
                <div>
                  <strong>完成后下载</strong>
                  <p>任务完成后可直接下载 Excel；处理中时不需要手动刷新页面。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
