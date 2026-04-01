import * as React from "react";

import { cn } from "../lib/cn";

const baseClasses =
  "h-12 w-full rounded-[22px] border-2 border-slate-200 bg-[#fffdf8] px-4 text-[15px] text-slate-900 shadow-[inset_0_-2px_0_rgba(255,255,255,0.7),3px_3px_0_rgba(226,232,240,0.6)] outline-none transition-all duration-200 placeholder:text-slate-400 hover:-translate-y-0.5 hover:border-[#c9bfdc] hover:bg-white hover:shadow-[0_0_0_4px_rgba(233,227,245,0.45),3px_3px_0_rgba(226,232,240,0.6)] focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(125,211,252,0.18),3px_3px_0_rgba(226,232,240,0.6)]";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(baseClasses, className)} {...props} />;
  }
);
