import * as React from "react";

import { cn } from "../lib/cn";

type BadgeVariant = "default" | "warning" | "danger" | "success" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-900 text-white",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
  success: "bg-emerald-100 text-emerald-700",
  muted: "bg-slate-100 text-slate-600"
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}


