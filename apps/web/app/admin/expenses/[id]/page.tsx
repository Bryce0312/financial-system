"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { RoleCode } from "@financial-system/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch, getApiUrl } from "@/lib/api";
import { readSession } from "@/lib/auth";
import { currency, shortDate } from "@/lib/format";

function isPreviewableImage(fileType?: string, fileName?: string) {
  const type = (fileType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  return type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(name);
}

function isPdf(fileType?: string, fileName?: string) {
  const type = (fileType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  return type.includes("pdf") || name.endsWith(".pdf");
}

function getAttachmentKindLabel(fileType?: string, fileName?: string) {
  if (isPreviewableImage(fileType, fileName)) return "图片";
  if (isPdf(fileType, fileName)) return "PDF";
  return "其他文件";
}

function formatFileSize(fileSize?: number) {
  if (!fileSize || Number.isNaN(fileSize)) return "大小未知";
  if (fileSize < 1024) return `${fileSize} B`;
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

async function getProtectedAttachmentBlob(path: string) {
  const session = readSession();
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: "GET",
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("附件读取失败，请重新登录后重试");
  }

  return response.blob();
}

async function openProtectedAttachment(path: string, fileName: string, inline = true) {
  const blob = await getProtectedAttachmentBlob(path);
  const objectUrl = window.URL.createObjectURL(blob);

  if (inline) {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    return;
  }

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

type AttachmentItem = {
  id: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  isInvoiceFile?: boolean;
  previewUrl: string;
};

function AttachmentActionRow({
  item,
  busy,
  onPreview,
  onDownload
}: {
  item: AttachmentItem;
  busy: boolean;
  onPreview: (item: AttachmentItem) => void;
  onDownload: (item: AttachmentItem) => void;
}) {
  const previewable = isPreviewableImage(item.fileType, item.fileName) || isPdf(item.fileType, item.fileName);

  return (
    <div className={`doodle-attachment-item${item.isInvoiceFile ? " doodle-attachment-item--invoice" : ""}`}>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-950">{item.fileName}</p>
          {item.isInvoiceFile ? <Badge variant="warning">发票</Badge> : null}
          <Badge variant="default">{getAttachmentKindLabel(item.fileType, item.fileName)}</Badge>
          {previewable ? <Badge variant="success">支持预览</Badge> : null}
        </div>
        <p className="doodle-attachment-item__meta">
          {item.fileType || "未知类型"} · {formatFileSize(item.fileSize)}
        </p>
        <p className="doodle-attachment-item__hint">
          {previewable
            ? item.isInvoiceFile
              ? "建议先预览核对票面，再下载归档。"
              : "可直接预览附件内容，也可以下载留存。"
            : "当前文件类型建议直接下载后查看。"}
        </p>
      </div>
      <div className="doodle-attachment-actions">
        {previewable ? (
          <Button variant="outline" className="min-w-[112px]" disabled={busy} onClick={() => onPreview(item)}>
            {busy ? "处理中..." : isPdf(item.fileType, item.fileName) ? "预览 PDF" : "预览图片"}
          </Button>
        ) : null}
        <Button variant="primary" className="min-w-[112px]" disabled={busy} onClick={() => onDownload(item)}>
          {busy ? "处理中..." : item.isInvoiceFile ? "下载发票" : "下载附件"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["admin-expense-detail", id],
    queryFn: () => apiFetch<any>(`/expenses/${id}`),
    enabled: Boolean(id)
  });
  const data = query.data;

  const detailEntries = useMemo(() => Object.entries(data?.detail || {}), [data?.detail]);
  const attachments: AttachmentItem[] = data?.attachments || [];
  const invoiceAttachments = attachments.filter((item) => item.isInvoiceFile);
  const otherAttachments = attachments.filter((item) => !item.isInvoiceFile);

  async function handleAttachmentAction(item: AttachmentItem, inline: boolean) {
    try {
      setBusyAttachmentId(item.id);
      await openProtectedAttachment(item.previewUrl, item.fileName, inline);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "附件处理失败，请稍后重试");
    } finally {
      setBusyAttachmentId(null);
    }
  }

  if (!data) {
    return (
      <AppShell requireRole={RoleCode.ADMIN}>
        <p className="text-sm text-slate-500">页面加载中...</p>
      </AppShell>
    );
  }

  return (
    <AppShell requireRole={RoleCode.ADMIN}>
      <div className="doodle-detail-page">
        <section className="doodle-detail-hero">
          <div>
            <p className="doodle-hero__eyebrow">EXPENSE DETAIL</p>
            <h1 className="doodle-hero__title">报销详情</h1>
            <p className="doodle-hero__desc">管理端可以快速查看异常说明、发票附件和扩展字段，附件会按“发票优先”进行区分。</p>
          </div>
          <div className="doodle-callout">
            <strong>查看建议</strong>
            <p>先核对发票，再预览其它附件，最后确认异常标签与扩展信息是否一致。</p>
          </div>
        </section>

        <Card className="doodle-surface">
          <CardHeader className="doodle-card-header">
            <CardTitle>{data.title}</CardTitle>
          </CardHeader>
          <CardContent className="doodle-detail-metaGrid">
            <p>申请人：{data.applicantName}</p>
            <p>类别：{data.categoryName}</p>
            <p>金额：{currency(data.amountTotal)}</p>
            <p>费用日期：{shortDate(data.expenseDate)}</p>
            <p>状态：{data.status}</p>
            <p>发票状态：{data.invoiceAttachmentStatus}</p>
            <p>是否有发票：{data.hasInvoice ? "有" : "无"}</p>
            <p>必传发票：{data.invoiceRequiredSnapshot ? "是" : "否"}</p>
            <p>超额金额：{currency(data.overLimitAmount)}</p>
          </CardContent>
        </Card>

        <Card className="doodle-surface">
          <CardHeader className="doodle-card-header">
            <CardTitle>异常与规则提示</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {data.anomalies?.length ? (
              data.anomalies.map((item: any, index: number) => (
                <Badge key={item.id || `${item.type}-${index}`} variant="warning">
                  {item.anomalyMessage || item.message}
                </Badge>
              ))
            ) : (
              <Badge variant="success">无异常</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="doodle-surface">
          <CardHeader className="doodle-card-header">
            <CardTitle>扩展信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-700">
            {detailEntries.length ? detailEntries.map(([key, value]) => <p key={key}>{key}：{String(value ?? "-")}</p>) : <p>无扩展信息</p>}
          </CardContent>
        </Card>

        <Card className="doodle-surface">
          <CardHeader className="doodle-card-header">
            <CardTitle>附件与发票</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <section className="doodle-attachment-section">
              <div className="doodle-attachment-section__header">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">发票附件</Badge>
                  <Badge variant="default">{invoiceAttachments.length} 份</Badge>
                </div>
                <p className="text-sm text-slate-500">优先核对票面信息，图片与 PDF 支持预览，其他文件可直接下载。</p>
              </div>
              {invoiceAttachments.length ? (
                <div className="doodle-attachment-list">
                  {invoiceAttachments.map((item) => (
                    <AttachmentActionRow
                      key={item.id}
                      item={item}
                      busy={busyAttachmentId === item.id}
                      onPreview={(selected) => handleAttachmentAction(selected, true)}
                      onDownload={(selected) => handleAttachmentAction(selected, false)}
                    />
                  ))}
                </div>
              ) : (
                <div className="doodle-attachment-empty">
                  <p className="text-sm font-semibold text-slate-900">当前没有单独标记为发票的附件</p>
                  <p className="text-sm text-slate-500">如果这笔报销声明了有发票，但这里仍为空，需要回到记录核对上传绑定情况。</p>
                </div>
              )}
            </section>

            <section className="doodle-attachment-section">
              <div className="doodle-attachment-section__header">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">其他附件</Badge>
                  <Badge variant="default">{otherAttachments.length} 份</Badge>
                </div>
                <p className="text-sm text-slate-500">行程单、说明图或补充材料会出现在这里，支持按类型预览或下载。</p>
              </div>
              {otherAttachments.length ? (
                <div className="doodle-attachment-list">
                  {otherAttachments.map((item) => (
                    <AttachmentActionRow
                      key={item.id}
                      item={item}
                      busy={busyAttachmentId === item.id}
                      onPreview={(selected) => handleAttachmentAction(selected, true)}
                      onDownload={(selected) => handleAttachmentAction(selected, false)}
                    />
                  ))}
                </div>
              ) : (
                <div className="doodle-attachment-empty">
                  <p className="text-sm font-semibold text-slate-900">当前没有其它附件</p>
                  <p className="text-sm text-slate-500">这笔报销目前只提交了发票，暂无额外补充材料。</p>
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
