import { useId, useMemo } from "react";
import { format, isValid, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TimeRange } from "@finsight/validators";
import { ChartTooltip } from "@finsight/ui/chart-tooltip";

import { formatCurrency, formatSignedCurrency } from "~/utils/format";

type Trend = "positive" | "negative" | "neutral";

interface NetWorthPoint {
  date: string;
  netWorth: number;
}

interface PreparedPoint extends NetWorthPoint {
  timestamp: number;
}

interface AreaChartCardProps {
  data: NetWorthPoint[];
  range: TimeRange;
  trend: Trend;
}

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatAxisDate(timestamp: number, range: TimeRange) {
  const date = new Date(timestamp);

  if (range === "1W") return format(date, "EEE");
  if (range === "1M" || range === "3M") return format(date, "MMM d");
  if (range === "6M" || range === "1Y") return format(date, "MMM");
  return format(date, "yyyy");
}

function NetWorthTooltip({
  active,
  payload,
  baseline,
}: {
  active?: boolean;
  payload?: { payload?: PreparedPoint }[];
  baseline: number;
}) {
  const point = payload?.[0]?.payload;
  if (!point) return null;

  const change = point.netWorth - baseline;

  return (
    <ChartTooltip active={active} payload={payload}>
      <p className="text-muted-foreground text-xs">
        {format(parseISO(point.date), "MMM d, yyyy")}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {formatCurrency(point.netWorth, { decimals: true })}
      </p>
      <p
        className={
          change > 0
            ? "text-positive mt-1 text-xs tabular-nums"
            : change < 0
              ? "text-destructive mt-1 text-xs tabular-nums"
              : "text-muted-foreground mt-1 text-xs"
        }
      >
        {change === 0 ? "No change" : formatSignedCurrency(change)}
      </p>
    </ChartTooltip>
  );
}

export function AreaChartCard({ data, range, trend }: AreaChartCardProps) {
  const gradientId = `net-worth-${useId().replaceAll(":", "")}`;
  const stroke =
    trend === "positive"
      ? "var(--positive)"
      : trend === "negative"
        ? "var(--destructive)"
        : "var(--muted-foreground)";
  const preparedData = useMemo(
    () =>
      data
        .flatMap((point): PreparedPoint[] => {
          const date = parseISO(point.date);
          return Number.isFinite(point.netWorth) && isValid(date)
            ? [{ ...point, timestamp: date.getTime() }]
            : [];
        })
        .sort((a, b) => a.timestamp - b.timestamp),
    [data],
  );
  const baseline = preparedData[0]?.netWorth ?? 0;
  const latest = preparedData.at(-1)?.netWorth ?? 0;

  return (
    <div
      role="img"
      aria-label={`Net worth history from ${formatCurrency(baseline)} to ${formatCurrency(latest)}.`}
      className="h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          accessibilityLayer
          data={preparedData}
          margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.14} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(value: number) => formatAxisDate(value, range)}
            minTickGap={44}
          />
          <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(value: number) => compactCurrency.format(value)}
            width={54}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={<NetWorthTooltip baseline={baseline} />}
            cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.6 }}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: stroke, stroke: "var(--card)" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
