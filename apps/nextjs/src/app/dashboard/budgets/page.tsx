"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PiggyBank, Plus } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { Button } from "@finsight/ui/button";
import { Skeleton } from "@finsight/ui/skeleton";
import { toast } from "@finsight/ui/toast";

import { useTRPC } from "~/trpc/react";
import { ConfirmDialog } from "../_components/confirm-dialog";
import { EmptyState } from "../_components/empty-state";
import { PageHeader } from "../_components/page-header";
import { BudgetCard } from "./_components/budget-card";
import { BudgetFormDialog } from "./_components/budget-form-dialog";

type Budget = RouterOutputs["budget"]["list"][number];

export default function BudgetsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  const budgetsQuery = useQuery(trpc.budget.list.queryOptions());

  const budgets = budgetsQuery.data ?? [];

  const createBudget = useMutation(
    trpc.budget.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Budget created");
        setCreateOpen(false);
        await queryClient.invalidateQueries(trpc.budget.list.pathFilter());
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateBudget = useMutation(
    trpc.budget.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Budget updated");
        setEditingBudget(null);
        await queryClient.invalidateQueries(trpc.budget.list.pathFilter());
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
        setDeletingBudget(null);
        await queryClient.invalidateQueries(trpc.budget.list.pathFilter());
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
  };

  const handleDelete = (budget: Budget) => {
    setDeletingBudget(budget);
  };

  const handleCreate = (values: {
    name: string;
    description: string;
    amount: string;
  }) => {
    createBudget.mutate({
      name: values.name,
      description: values.description || undefined,
      budgetAmount: values.amount ? parseFloat(values.amount) : undefined,
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Budgets">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Create budget
        </Button>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {budgetsQuery.isLoading && (
          <div className="border-border/60 bg-card/45 overflow-hidden rounded-lg border">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="border-border/60 grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-4 border-b px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_7rem_6rem] sm:px-6"
              >
                <div>
                  <Skeleton className="h-4 w-36 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-52 rounded-full" />
                </div>
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="hidden h-4 w-16 rounded-full sm:block" />
                <Skeleton className="hidden h-4 w-16 rounded-full sm:block" />
                <Skeleton className="hidden h-6 w-14 rounded-full sm:block" />
              </div>
            ))}
          </div>
        )}

        {budgetsQuery.isError && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm"
          >
            Budgets could not be loaded. {budgetsQuery.error.message}
          </div>
        )}

        {!budgetsQuery.isLoading &&
          !budgetsQuery.isError &&
          budgets.length === 0 && (
            <div className="border-border/60 bg-card/45 rounded-lg border py-10">
              <EmptyState
                icon={PiggyBank}
                title="No spending plans yet"
                description="Create a budget, then assign the transactions you want it to track."
                action={
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create budget
                  </Button>
                }
              />
            </div>
          )}

        {budgets.length > 0 && (
          <section
            aria-labelledby="spending-plans"
            className="border-border/60 bg-card/45 overflow-hidden rounded-lg border"
          >
            <div className="text-muted-foreground bg-muted/20 border-border/60 hidden grid-cols-[minmax(0,1.4fr)_8rem_8rem_7rem_7.5rem] gap-4 border-b px-6 py-3 text-xs font-medium sm:grid">
              <h2 id="spending-plans">Spending plan</h2>
              <span>Spent</span>
              <span>Limit</span>
              <span>Remaining</span>
              <span>Status</span>
            </div>
            <div className="divide-border/60 divide-y">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        <BudgetFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          isLoading={createBudget.isPending}
          onSubmit={handleCreate}
        />

        <BudgetFormDialog
          mode="edit"
          open={editingBudget !== null}
          onOpenChange={(open) => {
            if (!open) setEditingBudget(null);
          }}
          initialValues={
            editingBudget
              ? {
                  name: editingBudget.name,
                  description: editingBudget.description ?? "",
                  amount: editingBudget.budgetAmount?.toString() ?? "",
                }
              : undefined
          }
          isLoading={updateBudget.isPending}
          onSubmit={(values) => {
            if (!editingBudget) return;
            updateBudget.mutate({
              id: editingBudget.id,
              name: values.name,
              description: values.description || null,
              budgetAmount: values.amount ? parseFloat(values.amount) : null,
            });
          }}
        />

        <ConfirmDialog
          open={deletingBudget !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingBudget(null);
          }}
          title="Delete budget"
          description={`Are you sure you want to delete "${deletingBudget?.name}"? This action cannot be undone.`}
          isLoading={deleteBudget.isPending}
          loadingText="Deleting…"
          onConfirm={() => {
            if (!deletingBudget) return;
            deleteBudget.mutate({ id: deletingBudget.id });
          }}
        />
      </div>
    </div>
  );
}
