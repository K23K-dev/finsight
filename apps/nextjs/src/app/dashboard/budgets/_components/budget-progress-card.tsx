import { cn } from "@finsight/ui";

import { formatCurrency } from "~/utils/format";
import { deriveBudgetProgress } from "../_lib/budget-progress";

interface BudgetProgressCardProps {
  totalSpent: number;
  budgetAmount: number | null;
}

export function BudgetProgressCard({
  totalSpent,
  budgetAmount,
}: BudgetProgressCardProps) {
  const { progress, actualProgress, isOverBudget, remaining, isNearLimit } =
    deriveBudgetProgress(totalSpent, budgetAmount);

  return (
    <section
      aria-labelledby="budget-position"
      className="border-border/60 bg-card/35 border-y"
    >
      <h2 id="budget-position" className="sr-only">
        Budget position
      </h2>
      <div className="divide-border/60 grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="px-4 py-5 sm:px-5">
          <p className="text-muted-foreground text-sm font-medium">
            Spending limit
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {budgetAmount ? formatCurrency(budgetAmount) : "Open"}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {budgetAmount !== null
              ? "Target set for this plan"
              : "No limit set"}
          </p>
        </div>

        <div className="px-4 py-5 sm:px-5">
          <p className="text-muted-foreground text-sm font-medium">
            Assigned spending
          </p>
          <p
            className={cn(
              "mt-3 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl",
              isOverBudget && "text-destructive",
            )}
          >
            {formatCurrency(totalSpent)}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Total from attached transactions
          </p>
        </div>

        <div className="px-4 py-5 sm:px-5">
          <p className="text-muted-foreground text-sm font-medium">
            {isOverBudget ? "Over by" : "Remaining"}
          </p>
          <p
            className={cn(
              "mt-3 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl",
              isOverBudget
                ? "text-destructive"
                : remaining !== null && "text-positive",
            )}
          >
            {remaining !== null
              ? formatCurrency(Math.abs(remaining))
              : "Tracking"}
          </p>
          {progress !== null ? (
            <div className="bg-muted mt-4 h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full",
                  isOverBudget
                    ? "bg-destructive"
                    : isNearLimit
                      ? "bg-review"
                      : "bg-positive",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
          <p className="text-muted-foreground mt-2 text-xs">
            {budgetAmount !== null && actualProgress !== null
              ? isOverBudget
                ? `${(actualProgress - 100).toFixed(0)}% beyond the plan limit`
                : `${actualProgress.toFixed(0)}% of the plan limit used`
              : "Add a limit whenever you want a target"}
          </p>
        </div>
      </div>
    </section>
  );
}
