import * as React from "react";

import { cn } from "../lib/cn";

type BadgeVariant = "default" | "warning" | "danger" | "success" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-slate-900 bg-slate-900 text-white",
  warning: "border-amber-300 bg-amber-100 text-amber-900",
  danger: "border-rose-300 bg-rose-100 text-rose-700",
  success: "border-emerald-300 bg-emerald-100 text-emerald-700",
  muted: "border-slate-200 bg-slate-100 text-slate-600"
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-3 py-1.5 text-xs font-semibold tracking-[0.01em] shadow-[2px_2px_0_rgba(226,232,240,0.6)]",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
