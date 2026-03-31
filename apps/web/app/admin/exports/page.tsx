"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { RoleCode } from "@financial-system/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@financial-system/ui";

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
    refetchInterval: (query) =>
      query.state.data?.status === "COMPLETED" || query.state.data?.status === "FAILED" ? false : 2000
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
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>创建月度导出</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span>月份</span>
              <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "44px" }}
            >
              {mutation.isPending ? "创建中..." : "确认创建导出任务"}
            </Button>
            {jobQuery.data ? (
              <div className="rounded-2xl border border-slate-200 p-4 text-sm">
                <p>任务状态：{jobQuery.data.status}</p>
                <p className="mt-2">月份：{jobQuery.data.month}</p>
                {jobQuery.data.downloadUrl ? (
                  <Button
                    className="mt-3"
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{ backgroundColor: "#0f3d66", color: "#ffffff", minHeight: "40px" }}
                  >
                    {downloading ? "下载中..." : "下载 Excel"}
                  </Button>
                ) : null}
                {jobQuery.data.errorMessage ? <p className="mt-3 text-rose-600">{jobQuery.data.errorMessage}</p> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>导出说明</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-600">
            <p>导出结果默认包含报销明细、分类汇总、员工汇总、采购明细、异常记录五个 Sheet。</p>
            <p>统计与导出口径固定为按提交时间。</p>
            <p>导出采用异步任务模型，创建后会自动轮询状态直到完成。</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}