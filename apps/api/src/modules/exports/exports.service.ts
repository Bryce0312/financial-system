import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import ExcelJS from "exceljs";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { homedir, tmpdir } from "node:os";

import { ExportJobStatus, type ExportRequest } from "@financial-system/types";

import { StorageService } from "@/common/storage/storage.service";
import { AuthenticatedUser } from "@/common/interfaces/authenticated-user.interface";
import { getMonthRange } from "@/common/utils/date-range";
import { decimalToNumber } from "@/common/utils/number";
import { PrismaService } from "@/prisma/prisma.service";
import { AttachmentsService } from "@/modules/attachments/attachments.service";

type ReportItem = Awaited<ReturnType<ExportsService["loadReports"]>>[number];

type PreviewAsset = {
  link: string;
  buffer?: Buffer;
  extension?: "png" | "jpeg";
  label?: string;
};

const PREVIEW_COLUMN_WIDTH = 34;
const PREVIEW_IMAGE_WIDTH = 220;
const PREVIEW_IMAGE_HEIGHT = 140;
const PREVIEW_ROW_HEIGHT = 112;

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly attachmentsService: AttachmentsService
  ) {}

  async createJob(input: ExportRequest, user: AuthenticatedUser) {
    const job = await this.prisma.exportJob.create({
      data: {
        requestedById: user.id,
        month: input.month,
        status: ExportJobStatus.PENDING
      }
    });

    void this.processJob(job.id, input);

    return this.getJob(job.id);
  }

  async getJob(id: string) {
    const job = await this.prisma.exportJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException("�������񲻴���");
    }

    return {
      id: job.id,
      status: job.status,
      month: job.month,
      downloadUrl: job.storageKey ? `/admin/exports/${job.id}/download` : null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null
    };
  }

  async download(id: string) {
    const job = await this.prisma.exportJob.findUnique({ where: { id } });
    if (!job || !job.storageKey) {
      throw new NotFoundException("�����ļ�������");
    }

    return this.storageService.readObject(job.storageKey);
  }

  private async processJob(id: string, input: ExportRequest) {
    try {
      await this.prisma.exportJob.update({ where: { id }, data: { status: ExportJobStatus.PROCESSING } });
      const reports = await this.loadReports(input);
      const workbook = new ExcelJS.Workbook();
      await this.buildDetailSheet(workbook, reports);
      this.buildCategorySheet(workbook, reports);
      this.buildEmployeeSheet(workbook, reports);
      this.buildPurchaseSheet(workbook, reports);
      this.buildAnomalySheet(workbook, reports);
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const storageKey = `exports/${id}.xlsx`;
      await this.storageService.uploadBuffer(storageKey, buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      await this.prisma.exportJob.update({
        where: { id },
        data: {
          status: ExportJobStatus.COMPLETED,
          storageKey,
          completedAt: new Date(),
          errorMessage: null
        }
      });
    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id },
        data: {
          status: ExportJobStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "����ʧ��",
          completedAt: new Date()
        }
      });
    }
  }

  private async loadReports(input: ExportRequest) {
    const range = getMonthRange(input.month);
    return this.prisma.expenseReport.findMany({
      where: {
        submittedAt: {
          gte: range.start,
          lt: range.end
        },
        categoryId: input.categoryId,
        userId: input.applicantId,
        isOverLimit: input.isOverLimit,
        invoiceAttachmentStatus: input.invoiceAttachmentStatus,
        ...(typeof input.isPurchase === "boolean"
          ? {
              category: {
                extensionType: input.isPurchase ? "PURCHASE" : { not: "PURCHASE" }
              }
            }
          : {})
      },
      include: {
        user: true,
        category: true,
        anomalies: true,
        attachments: {
          where: { isInvoiceFile: true },
          orderBy: { createdAt: "asc" }
        },
        purchaseDetail: {
          include: {
            purchaseCategory: true
          }
        }
      },
      orderBy: {
        submittedAt: "asc"
      }
    });
  }

  private async buildDetailSheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("������ϸ");
    const header = ["���", "��������", "������", "�������", "���", "����", "�Ƿ��з�Ʊ", "�Ƿ񳬶�", "������", "״̬", "��ע", "����ʱ��", "��ƱԤ��"];
    sheet.addRow(header);
    sheet.getRow(1).font = { bold: true };

    const previewColumn = 13;
    sheet.columns = [
      { width: 8 },
      { width: 20 },
      { width: 16 },
      { width: 16 },
      { width: 12 },
      { width: 13 },
      { width: 12 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 24 },
      { width: PREVIEW_COLUMN_WIDTH }
    ];

    let rowIndex = 2;

    for (let index = 0; index < reports.length; index += 1) {
      const report = reports[index];
      const previews = await this.resolvePreviewAssets(report);
      const rowSpan = Math.max(previews.length, 1);

      for (let offset = 0; offset < rowSpan; offset += 1) {
        const row = sheet.getRow(rowIndex + offset);

        if (offset === 0) {
          row.values = [
            index + 1,
            report.title,
            report.user.realName,
            report.category.name,
            decimalToNumber(report.amountTotal),
            report.expenseDate.toISOString().slice(0, 10),
            report.hasInvoice ? "��" : "��",
            report.isOverLimit ? "��" : "��",
            decimalToNumber(report.overLimitAmount),
            report.status,
            report.remark || "",
            report.createdAt.toISOString(),
            ""
          ];
        }

        const preview = previews[offset];
        if (preview?.buffer && preview.extension) {
          const imageId = workbook.addImage({ base64: preview.buffer.toString("base64"), extension: preview.extension });

          sheet.addImage(imageId, {
            tl: { col: previewColumn - 1 + 0.16, row: rowIndex + offset - 1 + 0.12 },
            ext: { width: PREVIEW_IMAGE_WIDTH, height: PREVIEW_IMAGE_HEIGHT },
            editAs: "oneCell",
            hyperlinks: {
              hyperlink: preview.link,
              tooltip: "��ԭʼ����"
            }
          });
          row.height = PREVIEW_ROW_HEIGHT;
        } else if (preview?.link) {
          const cell = sheet.getCell(rowIndex + offset, previewColumn);
          cell.value = { text: preview.label || "�鿴��Ʊ", hyperlink: preview.link };
          cell.font = { color: { argb: "FF1D4ED8" }, underline: true, bold: true };
          cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        }
      }

      rowIndex += rowSpan;
    }
  }

  private async resolvePreviewAssets(report: ReportItem): Promise<PreviewAsset[]> {
    const assets: PreviewAsset[] = [];

    for (const attachment of report.attachments) {
      const link = this.attachmentsService.buildPreviewAccessUrl(attachment.id);
      const file = await this.storageService.readObject(attachment.storageKey);

      if (this.isImageFile(attachment.fileType, attachment.fileName)) {
        assets.push({
          link,
          buffer: file.buffer,
          extension: this.detectImageExtension(attachment.fileType, attachment.fileName)
        });
        continue;
      }

      if (this.isPdfFile(attachment.fileType, attachment.fileName)) {
        try {
          const pages = await this.convertPdfToPngPages(file.buffer, attachment.id);
          if (pages.length > 0) {
            pages.forEach((page) =>
              assets.push({
                link,
                buffer: page,
                extension: "png"
              })
            );
            continue;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(`PDF תͼƬʧ�� attachment=${attachment.id}: ${message}`);
        }

        assets.push({ link, label: "�鿴 PDF ��Ʊ" });
        continue;
      }

      assets.push({ link, label: "�鿴����" });
    }

    return assets;
  }

  private async convertPdfToPngPages(pdfBuffer: Buffer, attachmentId: string): Promise<Buffer[]> {
    const tempRoot = await mkdtemp(join(tmpdir(), `financial-export-${attachmentId}-`));
    const pdfPath = join(tempRoot, "invoice.pdf");
    const outputDir = join(tempRoot, "pages");

    try {
      await writeFile(pdfPath, pdfBuffer);
      const scriptPath = this.resolvePdfScriptPath();

      await this.runPythonScript(scriptPath, [pdfPath, outputDir]);

      const files = (await readdir(outputDir))
        .filter((name) => name.toLowerCase().endsWith(".png"))
        .sort((a, b) => a.localeCompare(b));

      const pages = await Promise.all(files.map((fileName) => readFile(join(outputDir, fileName))));
      return pages.map((page) => Buffer.from(page));
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }

  private resolvePdfScriptPath() {
    const candidates = [
      resolve(process.cwd(), "scripts", "pdf_to_png.py"),
      resolve(process.cwd(), "apps", "api", "scripts", "pdf_to_png.py"),
      resolve(__dirname, "..", "..", "..", "scripts", "pdf_to_png.py")
    ];

    const scriptPath = candidates.find((candidate) => existsSync(candidate));
    if (!scriptPath) {
      throw new Error("δ�ҵ� PDF תͼ�ű� scripts/pdf_to_png.py");
    }

    return scriptPath;
  }

  private async runPythonScript(scriptPath: string, args: string[]) {
    const condaPython = resolve(homedir(), ".conda", "envs", "financial-system", "python.exe");
    const commands: Array<{ command: string; args: string[] }> = [
      ...(existsSync(condaPython) ? [{ command: condaPython, args: [scriptPath, ...args] }] : []),
      { command: "python", args: [scriptPath, ...args] },
      { command: "py", args: ["-3", scriptPath, ...args] }
    ];

    let lastError: Error | null = null;

    for (const item of commands) {
      try {
        await new Promise<void>((resolvePromise, reject) => {
          const proc = spawn(item.command, item.args, { stdio: ["ignore", "pipe", "pipe"] });
          let stderr = "";

          proc.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
          });

          proc.on("error", (error) => reject(error));
          proc.on("exit", (code) => {
            if (code === 0) {
              resolvePromise();
            } else {
              reject(new Error(stderr || `${item.command} exited with code ${code}`));
            }
          });
        });

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error("�޷�ִ�� PDF תͼ�ű�");
  }

  private detectImageExtension(fileType: string, fileName: string): "png" | "jpeg" {
    const lowerType = (fileType || "").toLowerCase();
    const lowerName = (fileName || "").toLowerCase();
    if (lowerType.includes("png") || lowerName.endsWith(".png")) {
      return "png";
    }
    return "jpeg";
  }

  private isImageFile(fileType: string, fileName: string) {
    const lowerType = (fileType || "").toLowerCase();
    const lowerName = (fileName || "").toLowerCase();
    return lowerType.startsWith("image/") || /\.(png|jpg|jpeg|webp|bmp)$/i.test(lowerName);
  }

  private isPdfFile(fileType: string, fileName: string) {
    const lowerType = (fileType || "").toLowerCase();
    const lowerName = (fileName || "").toLowerCase();
    return lowerType.includes("pdf") || lowerName.endsWith(".pdf");
  }

  private buildCategorySheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("�������");
    sheet.addRow(["�������", "��������", "�ܽ��", "�������", "������"]);
    const map = new Map<string, { count: number; amount: number; overCount: number; overAmount: number; name: string }>();
    for (const report of reports) {
      const current = map.get(report.categoryId) ?? { count: 0, amount: 0, overCount: 0, overAmount: 0, name: report.category.name };
      current.count += 1;
      current.amount += decimalToNumber(report.amountTotal);
      if (report.isOverLimit) {
        current.overCount += 1;
        current.overAmount += decimalToNumber(report.overLimitAmount);
      }
      map.set(report.categoryId, current);
    }
    Array.from(map.values()).forEach((item) => sheet.addRow([item.name, item.count, item.amount, item.overCount, item.overAmount]));
  }

  private buildEmployeeSheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("Ա������");
    sheet.addRow(["Ա������", "��������", "�ܽ��", "�������", "������"]);
    const map = new Map<string, { count: number; amount: number; overCount: number; overAmount: number; name: string }>();
    for (const report of reports) {
      const current = map.get(report.userId) ?? { count: 0, amount: 0, overCount: 0, overAmount: 0, name: report.user.realName };
      current.count += 1;
      current.amount += decimalToNumber(report.amountTotal);
      if (report.isOverLimit) {
        current.overCount += 1;
        current.overAmount += decimalToNumber(report.overLimitAmount);
      }
      map.set(report.userId, current);
    }
    Array.from(map.values()).forEach((item) => sheet.addRow([item.name, item.count, item.amount, item.overCount, item.overAmount]));
  }

  private buildPurchaseSheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("�ɹ���ϸ");
    sheet.addRow(["���", "��Ʒ����", "�ɹ�����", "�ɹ���", "ʹ����", "����", "����", "�ʷ�", "�ܼ�", "�ɹ�ƽ̨", "��Ʊ", "��ע"]);
    reports
      .filter((report) => report.purchaseDetail)
      .forEach((report, index) => {
        const detail = report.purchaseDetail!;
        sheet.addRow([
          index + 1,
          detail.productName,
          detail.purchaseCategory?.name || "",
          detail.purchaserName,
          detail.userName || "",
          decimalToNumber(detail.unitPrice),
          decimalToNumber(detail.quantity),
          decimalToNumber(detail.shippingFee),
          decimalToNumber(report.amountTotal),
          detail.platform || "",
          report.hasInvoice ? "��" : "��",
          report.remark || detail.productNote || ""
        ]);
      });
  }

  private buildAnomalySheet(workbook: ExcelJS.Workbook, reports: Awaited<ReturnType<ExportsService["loadReports"]>>) {
    const sheet = workbook.addWorksheet("�쳣��¼");
    sheet.addRow(["���", "��������", "������", "�������", "���", "�쳣����", "�쳣˵��", "�Ƿ񳬶�", "������"]);
    let rowIndex = 1;
    reports.forEach((report) => {
      report.anomalies.forEach((anomaly) => {
        sheet.addRow([
          rowIndex,
          report.title,
          report.user.realName,
          report.category.name,
          decimalToNumber(report.amountTotal),
          anomaly.anomalyType,
          anomaly.anomalyMessage,
          report.isOverLimit ? "��" : "��",
          decimalToNumber(report.overLimitAmount)
        ]);
        rowIndex += 1;
      });
    });
  }
}







