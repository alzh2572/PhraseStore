import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800",
        className
      )}
      {...props}
    />
  );
}
