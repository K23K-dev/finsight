"use client";

import { useDeferredValue, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { BrainCircuit, Eye, EyeOff, RefreshCcw, Search } from "lucide-react";

import { cn } from "@finsight/ui";
import { Button } from "@finsight/ui/button";
import { Input } from "@finsight/ui/input";

import { useTRPC } from "~/trpc/react";
import { EmptyState } from "../_components/empty-state";
import { PageHeader } from "../_components/page-header";
import { useSimpleFinSync } from "../_hooks/use-simplefin-sync";
import { TransactionsList } from "./_components/transactions-list";
import { useTransactionGroups } from "./_hooks/use-transaction-groups";
import { useTransactionMutations } from "./_hooks/use-transaction-mutations";

export default function TransactionsPage() {
  const trpc = useTRPC();
  const syncTransactions = useSimpleFinSync();
  const [searchQuery, setSearchQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery.trim());

  const transactionsQuery = useInfiniteQuery(
    trpc.transaction.getPage.infiniteQueryOptions(
      {
        limit: 50,
        includeHidden: showHidden,
        search: deferredSearch || undefined,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );
  const transactionStatsQuery = useQuery(
    trpc.transaction.getStats.queryOptions({ includeHidden: showHidden }),
  );
  const transactionStats = transactionStatsQuery.data;
  const accountsQuery = useQuery(trpc.account.getAll.queryOptions());
  const { data: simpleFinStatus } = useQuery(
    trpc.simplefin.status.queryOptions(),
  );

  const transactions =
    transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const {
    categorizeMutation,
    handleCategoryChange,
    handleCategorize,
    handleDescriptionChange,
    handleToggleHidden,
  } = useTransactionMutations();

  const {
    pendingTransactions,
    dateGroups,
    getAccountName,
    getAccountInstitution,
  } = useTransactionGroups(transactions, accountsQuery.data);

  const hasTransactions = (transactionStats?.total ?? transactions.length) > 0;
  const hasSearchResults =
    pendingTransactions.length > 0 || dateGroups.length > 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Transactions">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleCategorize}
          disabled={
            categorizeMutation.isPending || (transactionStats?.total ?? 0) === 0
          }
        >
          <BrainCircuit className="mr-2 h-4 w-4" aria-hidden="true" />
          {categorizeMutation.isPending
            ? "Categorizing"
            : "Categorize transactions"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => syncTransactions.mutate()}
          disabled={
            syncTransactions.isPending || simpleFinStatus?.isConnected !== true
          }
        >
          <RefreshCcw
            className={cn(
              "mr-2 h-4 w-4",
              syncTransactions.isPending && "animate-spin",
            )}
            aria-hidden="true"
          />
          {syncTransactions.isPending ? "Syncing" : "Sync transactions"}
        </Button>
      </PageHeader>

      <div className="flex-1 p-4 sm:p-6 lg:p-7">
        <div className="mx-auto w-full max-w-[1440px]">
          <section
            aria-label="Transaction activity"
            className="bg-card/48 border-border/70 overflow-hidden rounded-lg border"
          >
            <div className="flex flex-col justify-between gap-4 px-5 py-4 sm:px-6 md:flex-row md:items-center">
              <div
                aria-live="polite"
                className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm"
              >
                {transactionStatsQuery.isPending ? (
                  <span>Loading counts…</span>
                ) : transactionStatsQuery.isError ? (
                  <span
                    className="text-destructive"
                    title={transactionStatsQuery.error.message}
                  >
                    Counts unavailable
                  </span>
                ) : (
                  <>
                    <span>{transactionStats?.total ?? 0} total</span>
                    <span>{transactionStats?.pending ?? 0} pending</span>
                    <span
                      className={
                        (transactionStats?.needsReview ?? 0) > 0
                          ? "text-review font-medium"
                          : ""
                      }
                    >
                      {transactionStats?.needsReview ?? 0} need review
                    </span>
                  </>
                )}
              </div>

              <div className="flex w-full gap-2 md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={() => {
                    setShowHidden((current) => !current);
                  }}
                  aria-pressed={showHidden}
                >
                  {showHidden ? (
                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {showHidden ? "Hide hidden" : "Show hidden"}
                </Button>
                <div className="relative min-w-0 flex-1 md:w-80">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Input
                    aria-label="Search transactions"
                    placeholder="Search payees and descriptions"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-9 pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="border-border/60 border-t">
              {accountsQuery.isError && (
                <div
                  role="alert"
                  className="text-destructive bg-destructive/8 border-destructive/25 m-5 rounded-md border p-4 text-sm"
                >
                  Account names could not be loaded:{" "}
                  {accountsQuery.error.message}
                </div>
              )}

              {transactionsQuery.isError && (
                <div
                  role="alert"
                  className="text-destructive bg-destructive/8 border-destructive/25 m-5 rounded-md border p-4 text-sm"
                >
                  Transactions could not be loaded:{" "}
                  {transactionsQuery.error.message}
                </div>
              )}

              {transactionsQuery.isPending && (
                <div
                  role="status"
                  aria-live="polite"
                  className="text-muted-foreground py-16 text-center text-sm"
                >
                  {deferredSearch
                    ? "Searching transactions…"
                    : "Loading transactions…"}
                </div>
              )}

              {!transactionsQuery.isPending &&
                !transactionStatsQuery.isPending &&
                !deferredSearch &&
                !hasTransactions &&
                !transactionsQuery.isError && (
                  <EmptyState
                    description="No transactions found."
                    secondaryDescription="Sync your accounts to start tracking activity."
                    className="py-16"
                  />
                )}

              {deferredSearch &&
                !transactionsQuery.isPending &&
                !transactionsQuery.isError &&
                !hasSearchResults && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="text-muted-foreground py-16 text-center text-sm"
                  >
                    No transactions matching “{searchQuery}”
                  </div>
                )}

              {hasSearchResults && (
                <>
                  <TransactionsList
                    pendingTransactions={pendingTransactions}
                    dateGroups={dateGroups}
                    getAccountName={getAccountName}
                    getAccountInstitution={getAccountInstitution}
                    onCategoryChange={handleCategoryChange}
                    onDescriptionChange={handleDescriptionChange}
                    onToggleHidden={handleToggleHidden}
                  />
                  {transactionsQuery.hasNextPage ? (
                    <div className="border-border/60 flex justify-center border-t px-5 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => transactionsQuery.fetchNextPage()}
                        disabled={transactionsQuery.isFetchingNextPage}
                      >
                        {transactionsQuery.isFetchingNextPage
                          ? "Loading…"
                          : "Load more"}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
