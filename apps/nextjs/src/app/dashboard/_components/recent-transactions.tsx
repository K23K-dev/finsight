import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Receipt } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";
import { getSpendingCategoryLabel } from "@finsight/validators";

import { useTRPC } from "~/trpc/react";
import { formatCurrency } from "~/utils/format";
import { Logo } from "./logo";

export function RecentTransactions() {
  const trpc = useTRPC();
  const transactionsQuery = useQuery(
    trpc.transaction.getPage.queryOptions({ limit: 5 }),
  );
  const accountsQuery = useQuery(trpc.account.getAll.queryOptions());

  return (
    <RecentTransactionsList
      transactions={transactionsQuery.data?.items ?? []}
      accounts={accountsQuery.data ?? []}
      isLoading={transactionsQuery.isLoading}
    />
  );
}

type RecentTransaction =
  RouterOutputs["transaction"]["getPage"]["items"][number];
type RecentAccount = RouterOutputs["account"]["getAll"][number];

interface RecentTransactionsListProps {
  transactions: readonly RecentTransaction[];
  accounts: readonly RecentAccount[];
  isLoading?: boolean;
}

function RecentTransactionsList({
  transactions,
  accounts,
  isLoading = false,
}: RecentTransactionsListProps) {
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Recent transactions
        </h2>
        <Link
          href="/dashboard/transactions"
          className="text-foreground/75 hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="border-border/60 divide-border/60 divide-y border-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="bg-muted/70 h-9 w-9 animate-pulse rounded-lg" />
              <div className="flex-1">
                <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                <div className="bg-muted mt-1 h-3 w-24 animate-pulse rounded" />
              </div>
              <div className="bg-muted h-5 w-16 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="border-border/60 flex h-48 flex-col items-center justify-center border-y py-8">
          <Receipt className="text-muted-foreground mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No transactions yet</p>
        </div>
      ) : (
        <div>
          <div className="border-border/60 text-muted-foreground hidden grid-cols-[minmax(0,1fr)_100px_120px] gap-4 border-y px-3 py-2.5 text-xs font-medium sm:grid">
            <span>Transaction</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="border-border/60 divide-border/60 divide-y border-b">
            {transactions.map((tx) => {
              const amount = Number(tx.amount);
              const isIncome = amount > 0;
              const account = accountMap.get(tx.accountId);
              const accountName = account?.customName ?? account?.name ?? "";
              const categoryLabel = getSpendingCategoryLabel(
                tx.spendingCategory,
              );

              return (
                <div
                  key={tx.id}
                  className="hover:bg-muted/30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_100px_120px]"
                >
                  <div className="bg-background/55 ring-border/50 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1">
                    <Logo
                      domain={tx.merchantDomain}
                      size={36}
                      className="rounded-lg"
                      fallback={
                        <span className="text-muted-foreground text-sm font-semibold">
                          {(tx.customDescription ?? tx.description)
                            .charAt(0)
                            .toUpperCase() || "?"}
                        </span>
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {tx.customDescription ?? tx.description}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {accountName || "Unknown account"}
                      {categoryLabel ? (
                        <span className="opacity-60"> · {categoryLabel}</span>
                      ) : null}
                    </p>
                  </div>

                  <p className="text-muted-foreground hidden text-sm tabular-nums sm:block">
                    {format(new Date(tx.postedDate), "MMM d")}
                  </p>

                  <p
                    className={cn(
                      "shrink-0 text-right text-sm font-semibold tabular-nums",
                      isIncome ? "text-positive" : "",
                    )}
                  >
                    {isIncome ? "+" : ""}
                    {formatCurrency(amount, { decimals: true })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
