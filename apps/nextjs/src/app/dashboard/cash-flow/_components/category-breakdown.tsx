import { useMemo } from "react";

import { cn } from "@finsight/ui";
import { Skeleton } from "@finsight/ui/skeleton";

import { formatCurrency } from "~/utils/format";

interface CategoryData {
  category: string;
  income: number;
  expenses: number;
}

interface CategoryBreakdownProps {
  categories: CategoryData[];
  isLoading?: boolean;
}

export function CategoryBreakdown({
  categories,
  isLoading,
}: CategoryBreakdownProps) {
  const { totalSpending, sortedCategories, displayedCategories } =
    useMemo(() => {
      const spending = categories.filter((cat) => cat.expenses > 0);
      const total = spending.reduce((sum, cat) => sum + cat.expenses, 0);
      const sorted = [...spending].sort((a, b) => b.expenses - a.expenses);
      const leading = sorted.slice(0, 5);
      const remaining = sorted.slice(5);
      const displayed =
        remaining.length > 1
          ? [
              ...leading,
              {
                category: "Other categories",
                income: remaining.reduce((sum, cat) => sum + cat.income, 0),
                expenses: remaining.reduce((sum, cat) => sum + cat.expenses, 0),
              },
            ]
          : sorted;

      return {
        totalSpending: total,
        sortedCategories: sorted,
        displayedCategories: displayed,
      };
    }, [categories]);

  if (isLoading) {
    return (
      <section className="border-border/60 bg-card/45 rounded-lg border p-5 sm:p-6">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="mt-7 space-y-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item}>
              <div className="flex justify-between gap-4">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <section className="border-border/60 bg-card/45 rounded-lg border p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Spending by category</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Where your money went in this period
        </p>
        <div className="border-border/60 mt-5 flex min-h-[280px] items-center justify-center border-y">
          <div className="max-w-[16rem] text-center">
            <p className="font-medium">No categorized spending</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Categorized outflows for this period will be ranked here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-border/60 bg-card/45 rounded-lg border p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Spending by category</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Where your money went in this period
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {formatCurrency(totalSpending)}
        </p>
      </div>

      <ol className="divide-border/70 mt-5 divide-y">
        {displayedCategories.map((category, index) => {
          const percent =
            totalSpending > 0 ? (category.expenses / totalSpending) * 100 : 0;
          return (
            <li
              key={`${index}-${category.category}`}
              className="py-2.5 first:pt-0"
            >
              <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-2 text-sm">
                <span className="text-muted-foreground text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate font-medium">
                    {category.category}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {percent.toFixed(1)}%
                  </span>
                </div>
                <span className="font-medium tabular-nums">
                  {formatCurrency(category.expenses)}
                </span>
              </div>
              <div className="bg-muted mt-1.5 ml-8 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "bg-primary h-full rounded-full",
                    index > 2 && "opacity-65",
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
