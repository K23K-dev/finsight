"use client";

import type { ReactNode } from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly unknown[];
  children: ReactNode;
}

export function ChartTooltip({ active, payload, children }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-popover text-popover-foreground rounded-lg border px-3 py-2 shadow-md">
      {children}
    </div>
  );
}
