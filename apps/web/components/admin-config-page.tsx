import { ReactNode } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from "@financial-system/ui";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

type StatChipProps = {
  label: string;
  value: string | number;
};

type StatusCardProps = {
  title: string;
  description: string;
  activeLabel: string;
  inactiveLabel: string;
  enabled: boolean;
  onToggle: () => void;
};

export function ConfigPageLayout({
  title,
  description,
  actions,
  children
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin-config-layout space-y-6">
      <div className="admin-config-layout__head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="admin-config-layout__copy space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin config</p>
          <h1 className="text-[40px] font-black tracking-[-0.06em] text-slate-950">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
        </div>
        {actions ? <div className="admin-config-layout__actions flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function ConfigPageGrid({ children }: { children: ReactNode }) {
  return <div className="admin-config-grid grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">{children}</div>;
}

export function ConfigTableCard({
  title,
  description,
  stats,
  children
}: {
  title: string;
  description: string;
  stats?: StatChipProps[];
  children: ReactNode;
}) {
  return (
    <Card className="admin-config-card admin-config-tableCard overflow-hidden">
      <CardHeader className="admin-config-cardHeader gap-4 border-b border-slate-100/90 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))]">
        <div className="space-y-2">
          <CardTitle className="text-[30px]">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {stats?.length ? (
          <div className="admin-config-stats flex flex-wrap gap-3">
            {stats.map((item) => (
              <div key={item.label} className="admin-config-statChip rounded-[22px] border-2 border-[#ece5f4] bg-white/90 px-4 py-3 shadow-[3px_3px_0_rgba(236,229,244,0.65)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="admin-config-tableContent overflow-x-auto pt-6">
        <div className="admin-config-tableScroll">{children}</div>
      </CardContent>
    </Card>
  );
}

export function ConfigEditorCard({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="admin-config-card admin-config-editorCard sticky top-6 overflow-hidden border-[#e5deef] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(255,255,255,0.98))] shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <CardHeader className="admin-config-cardHeader gap-3 border-b border-[#eee7f5] bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_36%),linear-gradient(180deg,rgba(253,250,244,0.95),rgba(255,255,255,0.92))]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b91b5]">{eyebrow}</p>
        <CardTitle className="text-[30px]">{title}</CardTitle>
        <CardDescription className="max-w-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="admin-config-editorContent space-y-5 py-6">{children}</CardContent>
    </Card>
  );
}

export function ConfigField({ label, hint, children }: FieldProps) {
  return (
    <label className="admin-config-field block space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function ConfigStatusCard({ title, description, activeLabel, inactiveLabel, enabled, onToggle }: StatusCardProps) {
  return (
    <div className="admin-config-statusCard rounded-[26px] border-2 border-[#ece5f4] bg-white/90 p-4 shadow-[4px_4px_0_rgba(236,229,244,0.55)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs leading-6 text-slate-500">{description}</p>
        </div>
        <Badge variant={enabled ? "success" : "warning"}>{enabled ? activeLabel : inactiveLabel}</Badge>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={enabled}
          className={`admin-config-toggle relative h-8 w-[68px] rounded-full border-2 transition ${
            enabled
              ? "border-slate-900 bg-slate-900 shadow-[3px_3px_0_rgba(15,23,42,0.18)]"
              : "border-[#d8d3e2] bg-[#f6f2fb] shadow-[3px_3px_0_rgba(216,211,226,0.5)]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${enabled ? "left-[38px]" : "left-1"}`}
          />
        </button>
        <span className="text-sm font-medium text-slate-600">{enabled ? "当前对新数据生效" : "当前仅保留历史引用"}</span>
      </div>
    </div>
  );
}

export function ConfigActionBar({
  onCancel,
  cancelLabel = "取消",
  submitLabel,
  isSubmitting
}: {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel: string;
  isSubmitting?: boolean;
}) {
  return (
    <div className="admin-config-actionBar flex flex-col gap-3 sm:flex-row">
      <Button type="submit" className="admin-config-actionButton sm:flex-1" disabled={isSubmitting}>
        {isSubmitting ? "处理中..." : submitLabel}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} className="admin-config-actionButton sm:flex-1">
        {cancelLabel}
      </Button>
    </div>
  );
}

export { Badge, Button, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea };
