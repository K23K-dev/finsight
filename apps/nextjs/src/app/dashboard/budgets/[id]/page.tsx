"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@finsight/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@finsight/ui/dropdown-menu";
import { Skeleton } from "@finsight/ui/skeleton";
import { toast } from "@finsight/ui/toast";

import { useTRPC } from "~/trpc/react";
import { AddTransactionsDialog } from "../_components/add-transactions-dialog";
import { BudgetFormDialog } from "../_components/budget-form-dialog";
import { BudgetProgressCard } from "../_components/budget-progress-card";
import { BudgetTransactionsList } from "../_components/budget-transactions-list";
import {
  buildSpendingTimeline,
  SpendingTimelineChart,
} from "../_components/spending-timeline";
import { useBudgetTransactionMutations } from "../_hooks/use-budget-transaction-mutations";
import { deriveBudgetProgress } from "../_lib/budget-progress";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { PageHeader } from "../../_components/page-header";

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const budgetId = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState("");
  const deferredTransactionSearch = useDeferredValue(transactionSearch.trim());

  const budgetQueryOptions = trpc.budget.getById.queryOptions({ id: budgetId });
  const budgetQuery = useQuery(budgetQueryOptions);
  const budget = budgetQuery.data;

  const allTransactionsQuery = useInfiniteQuery(
    trpc.transaction.getPage.infiniteQueryOptions(
      {
        flow: "expense",
        limit: 50,
        search: deferredTransactionSearch || undefined,
      },
      {
        enabled: isAddTxOpen,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );
  const candidateTransactions =
    allTransactionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const { addTransactions, removeTransaction } =
    useBudgetTransactionMutations(budgetId);

  const updateBudget = useMutation(
    trpc.budget.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Budget updated");
        setIsEditOpen(false);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: budgetQueryOptions.queryKey,
          }),
          queryClient.invalidateQueries(trpc.budget.list.pathFilter()),
        ]);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteBudget = useMutation(
    trpc.budget.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Budget deleted");
        await queryClient.invalidateQueries(trpc.budget.list.pathFilter());
        router.push("/dashboard/budgets");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const spendingTimeline = budget?.transactions
    ? buildSpendingTimeline(budget.transactions)
    : [];

  const isOverBudget = budget
    ? deriveBudgetProgress(budget.totalSpent, budget.budgetAmount).isOverBudget
    : false;

  if (budgetQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="">
          <Skeleton className="h-5 w-32" />
        </PageHeader>
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (budgetQuery.isError) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="Budget unavailable" />
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm"
          >
            This budget could not be loaded. {budgetQuery.error.message}
          </div>
          <Link
            href="/dashboard/budgets"
            className="text-muted-foreground hover:text-foreground mt-4 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to budgets
          </Link>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader title="Budget not found" />
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
          <p className="font-medium">Budget not found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            It may have been deleted or you may not have access to it.
          </p>
          <Link
            href="/dashboard/budgets"
            className="text-muted-foreground hover:text-foreground mt-4 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to budgets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={budget.name}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Budget actions"
              title="Budget actions"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit budget
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete budget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/dashboard/budgets"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-fit items-center gap-1.5 text-sm outline-none focus-visible:ring-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to budgets
        </Link>

        {budget.description ? (
          <p className="text-muted-foreground mt-6 mb-7 max-w-2xl text-sm leading-6">
            {budget.description}
          </p>
        ) : null}

        <div className={budget.description ? undefined : "mt-6"}>
          <BudgetProgressCard
            totalSpent={budget.totalSpent}
            budgetAmount={budget.budgetAmount}
          />
        </div>

        <div className="mt-6">
          <SpendingTimelineChart
            data={spendingTimeline}
            budgetAmount={budget.budgetAmount}
            isOverBudget={isOverBudget}
          />
        </div>

        <div className="mt-6">
          <BudgetTransactionsList
            transactions={budget.transactions}
            onRemove={(txId) =>
              removeTransaction.mutate({ budgetId, transactionId: txId })
            }
            onAddClick={() => setIsAddTxOpen(true)}
            isRemoving={removeTransaction.isPending}
          />
        </div>
      </div>

      <BudgetFormDialog
        mode="edit"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        initialValues={{
          name: budget.name,
          description: budget.description ?? "",
          amount: budget.budgetAmount?.toString() ?? "",
        }}
        isLoading={updateBudget.isPending}
        onSubmit={(values) => {
          updateBudget.mutate({
            id: budgetId,
            name: values.name,
            description: values.description || null,
            budgetAmount: values.amount ? parseFloat(values.amount) : null,
          });
        }}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete budget"
        description={`Are you sure you want to delete "${budget.name}"? This action cannot be undone.`}
        isLoading={deleteBudget.isPending}
        loadingText="Deleting…"
        onConfirm={() => {
          deleteBudget.mutate({ id: budgetId });
        }}
      />

      <AddTransactionsDialog
        open={isAddTxOpen}
        onOpenChange={(open) => {
          setIsAddTxOpen(open);
          if (!open) setTransactionSearch("");
        }}
        search={transactionSearch}
        onSearchChange={setTransactionSearch}
        transactions={candidateTransactions}
        assignedIds={new Set(budget.transactions.map((t) => t.id))}
        isLoading={allTransactionsQuery.isLoading}
        errorMessage={allTransactionsQuery.error?.message}
        loadMoreErrorMessage={
          allTransactionsQuery.isFetchNextPageError
            ? allTransactionsQuery.error.message
            : undefined
        }
        hasMore={allTransactionsQuery.hasNextPage}
        isLoadingMore={allTransactionsQuery.isFetchingNextPage}
        onLoadMore={() => allTransactionsQuery.fetchNextPage()}
        onRetry={() => allTransactionsQuery.refetch()}
        isAdding={addTransactions.isPending}
        onAdd={(txIds) => {
          setIsAddTxOpen(false);
          setTransactionSearch("");
          addTransactions.mutate({ budgetId, transactionIds: txIds });
        }}
      />
    </div>
  );
}
