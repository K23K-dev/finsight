import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@finsight/ui";
import { ChartTooltip } from "@finsight/ui/chart-tooltip";
import { Skeleton } from "@finsight/ui/skeleton";

import { formatCurrency } from "~/utils/format";

interface ChartDataPoint {
  label: string;
  income: number;
  expenses: number;
}

interface CashFlowChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

function CashFlowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  const hasNonZeroValue = payload?.some((entry) => entry.value !== 0);
  if (!hasNonZeroValue) return null;

  return (
    <ChartTooltip active={active} payload={payload}>
      <p className="text-foreground mb-2 font-semibold">{label}</p>
      <div className="space-y-1">
        {payload?.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  entry.name === "Money in"
                    ? "bg-positive"
                    : "bg-muted-foreground/45",
                )}
              />
              <span className="text-muted-foreground text-sm">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </ChartTooltip>
  );
}

export function CashFlowChart({ data, isLoading }: CashFlowChartProps) {
  if (isLoading) {
    return (
      <section
        className="border-border/60 bg-card/45 rounded-lg border p-5 sm:p-6"
        aria-label="Loading trend"
      >
        <Skeleton className="h-5 w-40 rounded-lg" />
        <div className="mt-8 flex h-[280px] flex-col justify-end gap-3">
          <div className="flex items-end gap-2">
            {[120, 80, 150, 100, 180, 60, 140, 90].map((height, index) => (
              <Skeleton
                key={index}
                className="flex-1 rounded-t-md"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <Skeleton className="h-px w-full" />
        </div>
      </section>
    );
  }

  if (data.length === 0) {
    return (
      <section className="border-border/60 bg-card/45 rounded-lg border p-5 sm:p-6">
        <h2 className="font-semibold">Movement over time</h2>
        <div className="border-border/60 mt-5 flex h-[280px] items-center justify-center border-y">
          <div className="max-w-xs text-center">
            <p className="font-medium">No movement recorded</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Transactions for the selected period will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-border/60 bg-card/45 min-w-0 rounded-lg border p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold">Money in versus out</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Daily movement for the selected period
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="bg-positive h-2 w-2 rounded-full" />
            <span className="text-muted-foreground">Money in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted-foreground/45 h-2 w-2 rounded-full" />
            <span className="text-muted-foreground">Money out</span>
          </div>
        </div>
      </div>
      <div className="mt-7 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="20%">
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="2 5"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(value: number) => {
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                return `$${value}`;
              }}
              width={48}
            />
            <Tooltip content={<CashFlowTooltip />} cursor={false} />
            <Bar
              dataKey="income"
              name="Money in"
              fill="var(--positive)"
              radius={[5, 5, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Money out"
              fill="var(--muted-foreground)"
              fillOpacity={0.45}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
