import * as React from "react";

import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[#111827] bg-[#111827] text-white shadow-[0_10px_24px_rgba(17,24,39,0.16)] hover:-translate-y-0.5 hover:bg-[#0b1220] hover:shadow-[0_14px_28px_rgba(17,24,39,0.22)] active:translate-y-0",
  secondary:
    "border-[#d8d3e2] bg-[#efeaf6] text-[#2b2438] shadow-[4px_4px_0_rgba(217,211,231,0.55)] hover:-translate-y-0.5 hover:bg-[#e7e1f1] active:translate-y-0",
  outline:
    "border-[#dbd6e5] bg-white/95 text-[#2b2438] shadow-[3px_3px_0_rgba(219,214,229,0.5)] hover:-translate-y-0.5 hover:border-[#cfc8dc] hover:bg-[#faf9fd] active:translate-y-0",
  ghost: "border-transparent bg-transparent text-[#5d566a] shadow-none hover:bg-[#f4f1f8] active:bg-[#ece7f3]",
  danger:
    "border-[#d9738d] bg-[#d9738d] text-white shadow-[4px_4px_0_rgba(217,115,141,0.18)] hover:-translate-y-0.5 hover:bg-[#cf6581] active:translate-y-0"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full border-2 px-5 text-sm font-semibold tracking-[0.01em] transition duration-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
