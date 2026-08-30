import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@finsight/ui/toast";

import { useTRPC } from "~/trpc/react";

export function useBudgetTransactionMutations(budgetId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const budgetQueryKey = trpc.budget.getById.queryKey({ id: budgetId });

  const refreshBudgets = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: budgetQueryKey }),
      queryClient.invalidateQueries(trpc.budget.list.pathFilter()),
    ]);

  const removeTransaction = useMutation(
    trpc.budget.removeTransaction.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSettled: refreshBudgets,
    }),
  );

  const addTransactions = useMutation(
    trpc.budget.addTransactions.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSettled: refreshBudgets,
    }),
  );

  return { addTransactions, removeTransaction };
}
