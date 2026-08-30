import { cn } from "@finsight/ui";
import { Skeleton } from "@finsight/ui/skeleton";

import { formatCurrency } from "~/utils/format";

interface CashFlowSummaryProps {
  income: number;
  expenses: number;
  net: number;
  isLoading?: boolean;
}

export function CashFlowSummary({
  income,
  expenses,
  net,
  isLoading,
}: CashFlowSummaryProps) {
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  if (isLoading) {
    return (
      <section
        aria-label="Loading cash flow summary"
        className="border-border/60 bg-card/35 border-y"
      >
        <div className="divide-border/60 grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {["income", "expenses", "net"].map((item) => (
            <div key={item} className="px-4 py-5 sm:px-5">
              <Skeleton className="h-3 w-20 rounded-sm" />
              <Skeleton className="mt-4 h-9 w-36 rounded-sm" />
              <Skeleton className="mt-3 h-3 w-44 rounded-sm" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="cash-flow-summary"
      className="border-border/60 bg-card/35 border-y"
    >
      <h2 id="cash-flow-summary" className="sr-only">
        Cash flow summary
      </h2>
      <div className="divide-border/60 grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="px-4 py-5 sm:px-5">
          <p className="text-muted-foreground text-sm font-medium">Money in</p>
          <p className="text-positive mt-3 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {formatCurrency(income)}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            Income recorded in this period
          </p>
        </div>

        <div className="px-4 py-5 sm:px-5">
          <p className="text-muted-foreground text-sm font-medium">Money out</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {formatCurrency(expenses)}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            Outflows recorded in this period
          </p>
        </div>

        <div className="px-4 py-5 sm:px-5">
          <p className="text-muted-foreground text-sm font-medium">
            {net >= 0 ? "Cash kept" : "Shortfall"}
          </p>
          <p
            className={cn(
              "mt-3 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl",
              net >= 0 ? "text-positive" : "text-negative",
            )}
          >
            {formatCurrency(net)}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            {income > 0 ? (
              <>
                {net >= 0 ? "Retained" : "Exceeded income by"}{" "}
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    net >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {Math.abs(savingsRate).toFixed(1)}%
                </span>{" "}
                of income
              </>
            ) : (
              "No income recorded for this period"
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
