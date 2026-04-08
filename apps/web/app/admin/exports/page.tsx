"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { RoleCode } from "@financial-system/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch, downloadApiFile } from "@/lib/api";

export default function ExportsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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
      <div className="admin-list-page">
        <section className="admin-list-hero admin-list-hero--compact">
          <div className="admin-list-hero__copy">
            <p className="doodle-hero__eyebrow">EXPORT CENTER</p>
            <h1 className="doodle-hero__title">导出中心</h1>
            <p className="doodle-hero__desc">按月份创建标准 Excel 导出，完成后可直接下载并继续在 WPS 或 Excel 中核对附件预览。</p>
          </div>
        </section>

        <div className="admin-panel-grid">
          <Card className="admin-side-panel">
            <CardHeader className="doodle-card-header admin-side-panel__header">
              <CardTitle>创建月度导出</CardTitle>
            </CardHeader>
            <CardContent className="admin-side-panel__content">
              <label className="doodle-filter-field">
                <span>月份</span>
                <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
              </label>

              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="admin-side-panel__primary">
                {mutation.isPending ? "创建中..." : "创建导出任务"}
              </Button>

              {jobQuery.data ? (
                <div className="admin-status-board">
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
                  {jobQuery.data.downloadUrl ? (
                    <Button className="admin-side-panel__primary" onClick={handleDownload} disabled={downloading}>
                      {downloading ? "下载中..." : "下载 Excel"}
                    </Button>
                  ) : null}
                  {jobQuery.data.errorMessage ? <p className="text-sm text-rose-600">{jobQuery.data.errorMessage}</p> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="doodle-surface admin-table-panel">
            <CardHeader className="doodle-card-header admin-table-panel__header">
              <div>
                <CardTitle>导出说明</CardTitle>
                <p className="admin-table-panel__desc">导出任务采用异步处理，统计与默认导出都按提交时间汇总。</p>
              </div>
            </CardHeader>
            <CardContent className="admin-side-panel__content admin-copy-block">
              <p>报销明细 sheet 会包含基础字段，以及你新增的发票预览列。</p>
              <p>分类汇总、员工汇总、采购明细和异常记录会继续保留，便于做管理复盘。</p>
              <p>导出完成后可直接下载；如果任务仍在处理中，页面会自动轮询状态直到完成。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
