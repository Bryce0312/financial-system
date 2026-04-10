"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch, openApiFile } from "@/lib/api";
import { currency, shortDate } from "@/lib/format";

export default function EmployeeExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["expense-detail", id],
    queryFn: () => apiFetch<any>(`/expenses/${id}`),
    enabled: Boolean(id)
  });
  const data = query.data;

  async function handleOpenAttachment(path: string, attachmentId: string, publicPath?: string) {
    try {
      setBusyAttachmentId(attachmentId);
      if (publicPath) {
        window.open(publicPath, "_blank", "noopener,noreferrer");
        return;
      }

      await openApiFile(path);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "附件打开失败，请稍后重试");
    } finally {
      setBusyAttachmentId(null);
    }
  }

  if (!data) {
    return (
      <AppShell>
        <div className="workspace-detailPage workspace-detailPage--employee">
          <p className="text-sm text-slate-500">页面加载中...</p>
        </div>
      </AppShell>
    );
  }

  const detailEntries = Object.entries(data.detail || {});

  return (
    <AppShell>
      <div className="workspace-detailPage workspace-detailPage--employee workspace-detailPage--scrollShell">
        <section className="workspace-detailHero">
          <div>
            <p className="doodle-hero__eyebrow">CLAIM DETAIL</p>
            <h1 className="doodle-hero__title">报销详情</h1>
            <p className="doodle-hero__desc">查看基础信息、异常说明、扩展字段和附件，确认整张单据是否完整。</p>
          </div>
          <div className="doodle-callout workspace-detailCallout">
            <strong>查看顺序</strong>
            <p>先看基础状态，再看异常标签，最后核对附件和扩展信息。</p>
          </div>
        </section>

        <Card className="doodle-surface workspace-detailCard">
          <CardHeader className="doodle-card-header workspace-detailCard__header">
            <CardTitle>{data.title}</CardTitle>
          </CardHeader>
          <CardContent className="workspace-detailMetaGrid">
            <p>类别：{data.categoryName}</p>
            <p>金额：{currency(data.amountTotal)}</p>
            <p>日期：{shortDate(data.expenseDate)}</p>
            <p>状态：{data.status}</p>
            <p>发票状态：{data.invoiceAttachmentStatus}</p>
            <p>超额金额：{currency(data.overLimitAmount)}</p>
          </CardContent>
        </Card>

        <Card className="doodle-surface workspace-detailCard workspace-detailCard--compact">
          <CardHeader className="doodle-card-header workspace-detailCard__header">
            <CardTitle>异常标签</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {data.anomalies.length ? (
              data.anomalies.map((item: any) => (
                <Badge key={item.id} variant="warning">
                  {item.anomalyMessage}
                </Badge>
              ))
            ) : (
              <Badge variant="success">无异常</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="doodle-surface workspace-detailCard">
          <CardHeader className="doodle-card-header workspace-detailCard__header">
            <CardTitle>扩展信息</CardTitle>
          </CardHeader>
          <CardContent className="workspace-detailFields">
            {detailEntries.length ? (
              detailEntries.map(([key, value]) => (
                <p key={key}>
                  <strong>{key}</strong>
                  <span>{String(value ?? "-")}</span>
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">暂无扩展信息。</p>
            )}
          </CardContent>
        </Card>

        <Card className="doodle-surface workspace-detailCard">
          <CardHeader className="doodle-card-header workspace-detailCard__header">
            <CardTitle>附件</CardTitle>
          </CardHeader>
          <CardContent className="workspace-detailAttachmentList">
            {data.attachments.length ? (
              data.attachments.map((item: any) => (
                <div key={item.id} className="workspace-detailAttachmentItem">
                  <span>{item.fileName}</span>
                  <Button
                    variant="primary"
                    disabled={busyAttachmentId === item.id}
                    onClick={() => handleOpenAttachment(item.previewUrl, item.id, item.publicPreviewUrl)}
                  >
                    {busyAttachmentId === item.id ? "打开中..." : "打开附件"}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">当前没有附件。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}



