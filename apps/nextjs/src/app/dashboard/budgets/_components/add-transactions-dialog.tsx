import { useState } from "react";
import { Check, Search } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";
import { Button } from "@finsight/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@finsight/ui/dialog";
import { Input } from "@finsight/ui/input";
import { getSpendingCategoryLabel } from "@finsight/validators";

import { formatCurrency, formatDate } from "~/utils/format";

type Transaction = RouterOutputs["transaction"]["getPage"]["items"][number];

interface AddTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
  transactions: Transaction[];
  assignedIds: Set<string>;
  isLoading?: boolean;
  errorMessage?: string;
  loadMoreErrorMessage?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  isAdding?: boolean;
  onAdd: (transactionIds: string[]) => void;
}

export function AddTransactionsDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  transactions,
  assignedIds,
  isLoading = false,
  errorMessage,
  loadMoreErrorMessage,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
  isAdding = false,
  onAdd,
}: AddTransactionsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const availableTransactions = transactions.filter(
    (transaction) => !assignedIds.has(transaction.id),
  );

  const toggleSelection = (txId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (selectedIds.size === 0) return;
    onAdd(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setSelectedIds(new Set());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add transactions</DialogTitle>
          <DialogDescription>
            Choose spending transactions that are not already assigned to this
            plan.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            aria-label="Search available transactions"
            placeholder="Search descriptions or merchants…"
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value);
              setSelectedIds(new Set());
            }}
            className="pl-9"
          />
        </div>

        <div className="border-border/60 bg-muted/15 max-h-80 overflow-y-auto rounded-lg border">
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="text-muted-foreground py-8 text-center text-sm"
            >
              Loading transactions…
            </div>
          ) : errorMessage && transactions.length === 0 ? (
            <div role="alert" className="space-y-3 px-4 py-8 text-center">
              <p className="text-destructive text-sm">
                Transactions could not be loaded: {errorMessage}
              </p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : availableTransactions.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="text-muted-foreground px-4 py-8 text-center text-sm"
            >
              {hasMore
                ? search
                  ? "No unassigned matches loaded yet. Load more to keep looking."
                  : "The loaded transactions are already assigned. Load more to keep looking."
                : search
                  ? "No matching transactions found."
                  : "No available transactions to add."}
            </div>
          ) : (
            <div className="divide-border/60 divide-y">
              {availableTransactions.map((t) => {
                const isSelected = selectedIds.has(t.id);
                const categoryLabel = getSpendingCategoryLabel(
                  t.spendingCategory,
                );
                return (
                  <Button
                    variant="ghost"
                    key={t.id}
                    onClick={() => toggleSelection(t.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex h-auto w-full items-center gap-3 rounded-none px-3 py-3 text-left",
                      isSelected ? "bg-positive/10" : "hover:bg-muted/40",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border",
                        isSelected
                          ? "border-positive bg-positive text-positive-foreground"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {t.customDescription ?? t.description}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(t.postedDate)}
                        {categoryLabel ? ` · ${categoryLabel}` : null}
                      </p>
                    </div>

                    <div className="text-sm tabular-nums">
                      {formatCurrency(Math.abs(Number(t.amount)))}
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
          {!isLoading && loadMoreErrorMessage ? (
            <div
              role="alert"
              className="border-border/60 space-y-2 border-t p-3 text-center"
            >
              <p className="text-destructive text-sm">
                More transactions could not be loaded: {loadMoreErrorMessage}
              </p>
              <Button variant="outline" size="sm" onClick={onLoadMore}>
                Retry
              </Button>
            </div>
          ) : !isLoading && hasMore ? (
            <div className="border-border/60 flex justify-center border-t p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {selectedIds.size} selected
          </p>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isAdding}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleAdd}
              disabled={isAdding || selectedIds.size === 0}
            >
              {isAdding
                ? "Adding…"
                : `Add ${selectedIds.size > 0 ? selectedIds.size : ""} Transaction${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
