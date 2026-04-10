"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@financial-system/ui";

import { AppShell } from "@/components/app-shell";
import { apiFetch, downloadApiFile, openApiFile } from "@/lib/api";
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
  return "文件";
}

function formatFileSize(fileSize?: number) {
  if (!fileSize || Number.isNaN(fileSize)) return "大小未知";
  if (fileSize < 1024) return `${fileSize} B`;
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

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

  async function handlePreview(item: any) {
    try {
      setBusyAttachmentId(item.id);
      if (item.publicPreviewUrl) {
        window.open(item.publicPreviewUrl, "_blank", "noopener,noreferrer");
        return;
      }
      await openApiFile(item.previewUrl);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "附件打开失败，请稍后重试");
    } finally {
      setBusyAttachmentId(null);
    }
  }

  async function handleDownload(item: any) {
    try {
      setBusyAttachmentId(item.id);
      await downloadApiFile(item.previewUrl, item.fileName);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "附件下载失败，请稍后重试");
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
  const attachments = data.attachments || [];

  return (
    <AppShell>
      <div className="workspace-detailPage workspace-detailPage--employee workspace-detailPage--scrollShell single-expense-detailPage">
        <section className="workspace-detailHero single-expense-detailPage__hero">
          <div>
            <p className="doodle-hero__eyebrow">CLAIM DETAIL</p>
            <h1 className="doodle-hero__title">报销详情</h1>
          </div>
        </section>

        <Card className="doodle-surface workspace-detailCard single-expense-detailPage__panel">
          <CardHeader className="doodle-card-header workspace-detailCard__header">
            <div className="single-expense-detailPage__titleRow">
              <CardTitle>{data.title}</CardTitle>
              <div className="single-expense-detailPage__badgeRow">
                <Badge variant="default">{data.status}</Badge>
                <Badge variant={data.anomalies.length ? "warning" : "success"}>
                  {data.anomalies.length ? `${data.anomalies.length} 个异常` : "无异常"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="single-expense-detailPage__content">
            <dl className="single-expense-detailPage__metaList">
              <div><dt>类别</dt><dd>{data.categoryName || "-"}</dd></div>
              <div><dt>金额</dt><dd>{currency(data.amountTotal)}</dd></div>
              <div><dt>日期</dt><dd>{shortDate(data.expenseDate)}</dd></div>
              <div><dt>状态</dt><dd>{data.status || "-"}</dd></div>
              <div><dt>发票状态</dt><dd>{data.invoiceAttachmentStatus || "-"}</dd></div>
              <div><dt>超额金额</dt><dd>{currency(data.overLimitAmount)}</dd></div>
            </dl>

            <div className="single-expense-detailPage__inlineBlock">
              <strong>异常标签</strong>
              <div className="single-expense-detailPage__badgeRow">
                {data.anomalies.length ? (
                  data.anomalies.map((item: any) => (
                    <Badge key={item.id} variant="warning">{item.anomalyMessage}</Badge>
                  ))
                ) : (
                  <Badge variant="success">无异常</Badge>
                )}
              </div>
            </div>

            <div className="single-expense-detailPage__inlineBlock">
              <strong>扩展信息</strong>
              {detailEntries.length ? (
                <dl className="single-expense-detailPage__fieldList">
                  {detailEntries.map(([key, value]) => (
                    <div key={key}><dt>{key}</dt><dd>{String(value ?? "-")}</dd></div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">暂无扩展信息。</p>
              )}
            </div>

            <div className="single-expense-detailPage__inlineBlock">
              <div className="single-expense-detailPage__sectionHead">
                <strong>附件</strong>
                <span>{attachments.length} 个</span>
              </div>
              {attachments.length ? (
                <ul className="single-expense-detailPage__attachmentList">
                  {attachments.map((item: any) => {
                    const previewable = isPreviewableImage(item.fileType, item.fileName) || isPdf(item.fileType, item.fileName);
                    const busy = busyAttachmentId === item.id;
                    return (
                      <li key={item.id} className="single-expense-detailPage__attachmentItem">
                        <div className="single-expense-detailPage__attachmentInfo">
                          <div className="single-expense-detailPage__attachmentNameRow">
                            <span>{item.fileName}</span>
                            <div className="single-expense-detailPage__badgeRow">
                              {item.isInvoiceFile ? <Badge variant="warning">发票</Badge> : null}
                              <Badge variant="default">{getAttachmentKindLabel(item.fileType, item.fileName)}</Badge>
                            </div>
                          </div>
                          <p>{item.fileType || "未知类型"} · {formatFileSize(item.fileSize)}</p>
                        </div>
                        <div className="single-expense-detailPage__attachmentActions">
                          {previewable ? <Button variant="outline" disabled={busy} onClick={() => handlePreview(item)}>{busy ? "打开中..." : "预览"}</Button> : null}
                          <Button variant="primary" disabled={busy} onClick={() => handleDownload(item)}>{busy ? "处理中..." : "下载"}</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">当前没有附件。</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
