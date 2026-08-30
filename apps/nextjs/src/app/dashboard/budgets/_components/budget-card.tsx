import Link from "next/link";
import { ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";
import { Button } from "@finsight/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@finsight/ui/dropdown-menu";

import { formatCurrency } from "~/utils/format";
import { deriveBudgetProgress } from "../_lib/budget-progress";

type Budget = RouterOutputs["budget"]["list"][number];

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const handleMenuAction = (
    e: React.MouseEvent,
    action: (budget: Budget) => void,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    action(budget);
  };

  const {
    actualProgress,
    progress,
    remaining,
    isOverBudget,
    isNearLimit,
    statusLabel,
  } = deriveBudgetProgress(budget.totalSpent, budget.budgetAmount);

  return (
    <article className="hover:bg-muted/25 grid gap-4 px-5 py-5 transition-colors sm:grid-cols-[minmax(0,1.4fr)_8rem_8rem_7rem_auto] sm:items-center sm:px-6">
      <div className="min-w-0">
        <Link
          href={`/dashboard/budgets/${budget.id}`}
          className="focus-visible:ring-ring group/link inline-flex max-w-full items-center gap-2 font-semibold outline-none focus-visible:ring-2"
        >
          <span className="truncate">{budget.name}</span>
          <ArrowUpRight className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </Link>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {budget.description ?? "No description"}
        </p>
        {progress !== null ? (
          <div className="bg-muted mt-3 h-1.5 max-w-sm overflow-hidden rounded-full sm:hidden">
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
      </div>

      <div className="grid grid-cols-3 gap-4 sm:contents">
        <div>
          <p className="text-muted-foreground text-xs font-medium sm:sr-only">
            Spent
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums sm:mt-0">
            {formatCurrency(budget.totalSpent)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium sm:sr-only">
            Limit
          </p>
          <p className="text-muted-foreground mt-1 text-sm tabular-nums sm:mt-0">
            {budget.budgetAmount ? formatCurrency(budget.budgetAmount) : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium sm:sr-only">
            Remaining
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-medium tabular-nums sm:mt-0",
              isOverBudget && "text-destructive",
            )}
          >
            {remaining === null ? "Open" : formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-start">
        <span
          className={cn(
            "inline-flex items-center gap-2 text-xs font-semibold",
            isOverBudget
              ? "text-destructive"
              : isNearLimit
                ? "text-review"
                : actualProgress === null
                  ? "text-muted-foreground"
                  : "text-positive",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isOverBudget
                ? "bg-destructive"
                : isNearLimit
                  ? "bg-review"
                  : actualProgress === null
                    ? "bg-muted-foreground/50"
                    : "bg-positive",
            )}
          />
          {statusLabel}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${budget.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(event) => handleMenuAction(event, onEdit)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(event) => handleMenuAction(event, onDelete)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
