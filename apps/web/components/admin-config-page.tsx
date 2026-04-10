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
      <div className="admin-config-layout__head flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="admin-config-layout__copy space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin config</p>
          <div className="space-y-2 xl:max-w-[34rem]">
            <h1 className="text-[36px] font-black tracking-[-0.06em] text-slate-950 xl:text-[40px]">{title}</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
          </div>
        </div>
        {actions ? <div className="admin-config-layout__actions flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function ConfigPageGrid({ children }: { children: ReactNode }) {
  return <div className="admin-config-grid grid gap-5 xl:grid-cols-[minmax(0,1fr)_408px]">{children}</div>;
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
    <Card className="admin-config-card admin-config-tableCard overflow-hidden rounded-[30px] border-2 border-[rgba(214,208,227,0.88)] bg-white/95 shadow-[0_18px_42px_rgba(91,83,111,0.08)]">
      <CardHeader className="admin-config-cardHeader gap-5 border-b border-slate-100/90 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))] !px-8 !pt-8 !pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="space-y-2 xl:max-w-[34rem]">
          <CardTitle className="text-[30px] leading-[1.02]">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {stats?.length ? (
          <div className="admin-config-stats grid grid-cols-3 gap-3 xl:min-w-[336px]">
            {stats.map((item) => (
              <div
                key={item.label}
                className="admin-config-statChip flex min-h-[116px] flex-col justify-between rounded-[24px] border-2 border-[#ece5f4] bg-white/95 px-5 py-4 shadow-[3px_3px_0_rgba(236,229,244,0.65)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="admin-config-tableContent overflow-x-auto !px-8 !pt-6 !pb-7">
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
    <Card className="admin-config-card admin-config-editorCard sticky top-5 h-fit self-start overflow-hidden rounded-[30px] border-2 border-[#e5deef] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(255,255,255,0.98))] shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
      <CardHeader className="admin-config-cardHeader gap-3 border-b border-[#eee7f5] bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_36%),linear-gradient(180deg,rgba(253,250,244,0.95),rgba(255,255,255,0.92))] !px-8 !pt-8 !pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b91b5]">{eyebrow}</p>
        <CardTitle className="text-[30px] leading-[1.02]">{title}</CardTitle>
        <CardDescription className="max-w-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="admin-config-editorContent space-y-5 !px-8 !pt-6 !pb-7">{children}</CardContent>
    </Card>
  );
}

export function ConfigField({ label, hint, children }: FieldProps) {
  return (
    <label className="admin-config-field block space-y-2">
      <div className="admin-config-field__meta grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-x-3">
        <span className="admin-config-field__label text-sm font-semibold leading-6 text-slate-700">{label}</span>
        {hint ? <span className="admin-config-field__hint text-xs leading-5 text-slate-400 sm:pt-0.5">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function ConfigPageActionButton({
  children,
  onClick
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className="admin-config-rowButton min-w-[120px] px-6 text-[15px] font-semibold">
      {children}
    </Button>
  );
}

export function ConfigRowEditButton({
  children,
  onClick
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className="admin-config-rowButton min-w-[96px] px-5 text-[15px] font-semibold">
      {children}
    </Button>
  );
}

export function ConfigStatusCard({ title, description, activeLabel, inactiveLabel, enabled, onToggle }: StatusCardProps) {
  return (
    <div className="admin-config-statusCard rounded-[26px] border-2 border-[#ece5f4] bg-white/90 p-4 shadow-[4px_4px_0_rgba(236,229,244,0.55)]">
      <div className="admin-config-statusCard__head">
        <div className="admin-config-statusCard__copy">
          <p className="admin-config-statusCard__title">{title}</p>
          <p className="admin-config-statusCard__description">{description}</p>
        </div>
        <Badge variant={enabled ? "success" : "warning"}>{enabled ? activeLabel : inactiveLabel}</Badge>
      </div>
      <div className="admin-config-statusCard__toggleRow">
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
        <span className="admin-config-statusCard__stateText">{enabled ? "当前对新数据生效" : "当前仅保留历史引用"}</span>
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
    <div className="admin-config-actionBar grid gap-3 sm:grid-cols-2">
      <Button type="submit" className="admin-config-actionButton admin-config-actionButton--primary sm:flex-1" disabled={isSubmitting}>
        <span className="admin-config-actionLabel">{isSubmitting ? "处理中..." : submitLabel}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="admin-config-actionButton admin-config-actionButton--secondary sm:flex-1"
      >
        <span className="admin-config-actionLabel">{cancelLabel}</span>
      </Button>
    </div>
  );
}

export { Badge, Button, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea };
