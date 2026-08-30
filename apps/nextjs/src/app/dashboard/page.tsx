"use client";

import { useState } from "react";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

import type { TimeRange } from "@finsight/validators";
import { cn } from "@finsight/ui";

import { useTRPC } from "~/trpc/react";
import { sumAccountBalances } from "~/utils/account-balances";
import { formatCurrency } from "~/utils/format";
import { AccountsSummary } from "./_components/accounts-summary";
import { AreaChartCard } from "./_components/area-chart-card";
import { EmptyState } from "./_components/empty-state";
import { PageHeader } from "./_components/page-header";
import { RecentTransactions } from "./_components/recent-transactions";
import { TimeRangeSelector } from "./_components/time-range-selector";

export default function DashboardPage() {
  const trpc = useTRPC();
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M");

  const historyQuery = useQuery(
    trpc.cashflow.getNetWorthHistory.queryOptions({
      range: selectedRange,
    }),
  );

  const accountsQuery = useQuery(trpc.account.getAll.queryOptions());

  const cashflowQuery = useQuery(
    trpc.cashflow.getSummary.queryOptions({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    }),
  );

  const history = historyQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const currentNetWorth = sumAccountBalances(accounts);
  const cashflow = cashflowQuery.data ?? { income: 0, expenses: 0, net: 0 };

  const baselinePoint = history[0];
  const displayChange = baselinePoint
    ? currentNetWorth - baselinePoint.netWorth
    : null;
  const displayChangePercent =
    baselinePoint && baselinePoint.netWorth !== 0 && displayChange != null
      ? (displayChange / baselinePoint.netWorth) * 100
      : null;
  const comparisonLabel = baselinePoint
    ? `since ${format(parseISO(baselinePoint.date), "MMM d, yyyy")}`
    : null;
  const latestHistoryPoint = history.at(-1);
  const chartChange =
    baselinePoint && latestHistoryPoint
      ? latestHistoryPoint.netWorth - baselinePoint.netWorth
      : null;
  const chartTrend =
    chartChange == null || chartChange === 0
      ? "neutral"
      : chartChange > 0
        ? "positive"
        : "negative";
  const isLoading = historyQuery.isLoading || accountsQuery.isLoading;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Overview" />

      <div className="flex-1 p-4 sm:p-6 lg:p-7">
        <div className="mx-auto w-full max-w-[1440px] space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.75fr)]">
            <section
              aria-labelledby="net-position-heading"
              className="bg-card/78 border-border/70 overflow-hidden rounded-lg border shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
            >
              <div className="px-5 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Total net worth
                    </p>
                    <h2
                      id="net-position-heading"
                      className="mt-2 text-4xl font-semibold tracking-[-0.035em] tabular-nums sm:text-5xl"
                    >
                      {isLoading ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <NumberFlow
                          value={currentNetWorth}
                          locales="en-US"
                          format={{
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                          willChange
                        />
                      )}
                    </h2>
                  </div>

                  <TimeRangeSelector
                    value={selectedRange}
                    onChange={setSelectedRange}
                  />
                </div>

                <div className="mt-3 flex min-h-6 items-center gap-2">
                  {!isLoading &&
                    (displayChange == null ? (
                      <span className="text-muted-foreground text-sm">
                        Comparison unavailable for this range
                      </span>
                    ) : displayChange === 0 ? (
                      <span className="text-muted-foreground text-sm">
                        No change {comparisonLabel}
                      </span>
                    ) : (
                      <>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
                            displayChange > 0
                              ? "text-positive"
                              : "text-destructive",
                          )}
                        >
                          {displayChange > 0 ? (
                            <TrendingUp
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <TrendingDown
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                          {displayChange > 0 ? "+" : ""}
                          {formatCurrency(displayChange, { decimals: true })}
                        </span>
                        <span className="text-muted-foreground text-sm tabular-nums">
                          {displayChangePercent != null && (
                            <>
                              ({displayChangePercent > 0 ? "+" : ""}
                              {displayChangePercent.toFixed(1)}%){" "}
                            </>
                          )}
                          {comparisonLabel}
                        </span>
                      </>
                    ))}
                </div>
              </div>

              <div className="px-3 pt-1 pb-4 sm:px-6">
                <div className="h-[230px] sm:h-[280px]">
                  {isLoading ? (
                    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                      Loading balance history…
                    </div>
                  ) : history.length === 0 ? (
                    <EmptyState
                      description="No balance history available"
                      secondaryDescription="Choose a longer range or sync your accounts to refresh the history."
                      className="h-full"
                    />
                  ) : (
                    <AreaChartCard
                      data={history}
                      range={selectedRange}
                      trend={chartTrend}
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="bg-card/48 border-border/70 rounded-lg border p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">This month</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Cash flow summary
                  </p>
                </div>
                <Link
                  href="/dashboard/cash-flow"
                  className="text-foreground/80 hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                >
                  View cash flow
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <dl className="border-border/60 divide-border/60 mt-5 grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
                <MonthlyFigure
                  label="Income"
                  value={cashflow.income}
                  isLoading={cashflowQuery.isLoading}
                />
                <MonthlyFigure
                  label="Outflows"
                  value={cashflow.expenses}
                  isLoading={cashflowQuery.isLoading}
                />
                <MonthlyFigure
                  label="Net cash flow"
                  value={cashflow.net}
                  isLoading={cashflowQuery.isLoading}
                  emphasized
                />
              </dl>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="bg-card/48 border-border/70 rounded-lg border p-5 sm:p-6">
              <AccountsSummary
                accounts={accounts}
                isLoading={accountsQuery.isLoading}
              />
            </section>
            <section className="bg-card/48 border-border/70 rounded-lg border p-5 sm:p-6">
              <RecentTransactions />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MonthlyFigureProps {
  label: string;
  value: number;
  isLoading: boolean;
  emphasized?: boolean;
}

function MonthlyFigure({
  label,
  value,
  isLoading,
  emphasized = false,
}: MonthlyFigureProps) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-muted-foreground truncate text-xs font-medium">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate text-base font-semibold tabular-nums",
          emphasized && (value >= 0 ? "text-positive" : "text-review"),
        )}
      >
        {isLoading ? "—" : formatCurrency(value, { decimals: true })}
      </dd>
    </div>
  );
}
