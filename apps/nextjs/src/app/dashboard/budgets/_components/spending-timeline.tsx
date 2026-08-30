import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@finsight/ui/chart-tooltip";

import { formatCurrency } from "~/utils/format";

interface TimelineDataPoint {
  date: string;
  amount: number;
  transactions: string[];
  count: number;
}

function SpendingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload: TimelineDataPoint }[];
}) {
  const point = payload?.[0]?.payload;
  if (!point) return null;
  return (
    <ChartTooltip active={active} payload={payload as unknown as unknown[]}>
      <p className="text-xs font-medium">{point.date}</p>
      <p className="text-sm font-semibold">{formatCurrency(point.amount)}</p>
      <p className="text-muted-foreground text-xs">
        {point.count === 1
          ? point.transactions[0]
          : `${point.count} transactions`}
      </p>
    </ChartTooltip>
  );
}

interface SpendingTimelineChartProps {
  data: TimelineDataPoint[];
  budgetAmount: number | null;
  isOverBudget: boolean;
}

export function SpendingTimelineChart({
  data,
  budgetAmount,
  isOverBudget,
}: SpendingTimelineChartProps) {
  if (data.length === 0) {
    return (
      <section
        className="border-border/60 bg-card/45 rounded-lg border p-5 sm:p-6"
        aria-labelledby="spending-over-time"
      >
        <h2 id="spending-over-time" className="text-lg font-semibold">
          Assigned spending over time
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Track the pace of this plan as transactions are added.
        </p>
        <div className="border-border/60 mt-5 flex h-56 items-center justify-center border-y text-center">
          <div>
            <p className="font-medium">No spending data yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add a transaction to plot this plan&apos;s pace.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const chartColor = isOverBudget ? "var(--destructive)" : "var(--positive)";

  return (
    <section
      className="border-border/60 bg-card/45 min-w-0 rounded-lg border p-5 sm:p-6"
      aria-labelledby="spending-over-time"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 id="spending-over-time" className="text-lg font-semibold">
            Assigned spending over time
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Cumulative spending from assigned transactions
          </p>
        </div>
        {budgetAmount ? (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div
                className={
                  isOverBudget
                    ? "bg-destructive h-0.5 w-4"
                    : "bg-positive h-0.5 w-4"
                }
              />
              <span className="text-muted-foreground">Spending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="border-destructive h-0.5 w-4 border-b border-dashed" />
              <span className="text-muted-foreground">Limit</span>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-5 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(value: number) =>
                value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
              }
              width={45}
            />
            <Tooltip content={SpendingTooltip} />
            {budgetAmount ? (
              <ReferenceLine
                y={budgetAmount}
                stroke="var(--destructive)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="amount"
              stroke={chartColor}
              strokeWidth={2}
              fill={chartColor}
              fillOpacity={0.07}
              dot={false}
              activeDot={{
                r: 4,
                fill: chartColor,
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function buildSpendingTimeline(
  transactions: {
    postedDate: Date;
    amount: number;
    description: string;
  }[],
): TimelineDataPoint[] {
  if (!transactions.length) return [];

  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(a.postedDate).getTime() - new Date(b.postedDate).getTime(),
  );

  const dateMap = new Map<string, { total: number; transactions: string[] }>();

  for (const t of sorted) {
    const dateKey = new Date(t.postedDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.total += Math.abs(t.amount);
      existing.transactions.push(t.description);
    } else {
      dateMap.set(dateKey, {
        total: Math.abs(t.amount),
        transactions: [t.description],
      });
    }
  }

  let cumulative = 0;
  return Array.from(dateMap.entries()).map(([date, data]) => {
    cumulative += data.total;
    return {
      date,
      amount: cumulative,
      transactions: data.transactions,
      count: data.transactions.length,
    };
  });
}
