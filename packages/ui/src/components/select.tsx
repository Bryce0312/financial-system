import * as React from "react";

import { cn } from "../lib/cn";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-slate-950",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);


