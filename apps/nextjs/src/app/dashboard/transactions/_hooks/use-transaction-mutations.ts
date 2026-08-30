import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@finsight/ui/toast";
import { spendingCategorySchema } from "@finsight/validators";

import { useTRPC } from "~/trpc/react";

export function useTransactionMutations() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidateTransactionConsumers = () =>
    Promise.all([
      queryClient.invalidateQueries(trpc.transaction.pathFilter()),
      queryClient.invalidateQueries(trpc.cashflow.pathFilter()),
      queryClient.invalidateQueries(trpc.budget.pathFilter()),
    ]);
  const showMutationError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const updateSpendingCategoryMutation = useMutation(
    trpc.transaction.updateSpendingCategory.mutationOptions({
      onError: showMutationError,
      onSettled: invalidateTransactionConsumers,
    }),
  );

  const categorizeMutation = useMutation(
    trpc.transaction.categorizeUncategorized.mutationOptions({
      onSuccess: (summary) => {
        if (summary.examined === 0) {
          toast.success("No uncategorized transactions need review.");
          return;
        }

        toast.success(
          `${summary.categorized} categorized, ${summary.abstained} left for review.`,
        );
      },
      onError: showMutationError,
      onSettled: invalidateTransactionConsumers,
    }),
  );

  const updateDescriptionMutation = useMutation(
    trpc.transaction.updateDescription.mutationOptions({
      onError: showMutationError,
      onSettled: invalidateTransactionConsumers,
    }),
  );

  const toggleHiddenMutation = useMutation(
    trpc.transaction.toggleHidden.mutationOptions({
      onError: showMutationError,
      onSettled: invalidateTransactionConsumers,
    }),
  );

  const handleCategoryChange = (
    transactionId: string,
    category: string | null,
  ) => {
    updateSpendingCategoryMutation.mutate({
      transactionId,
      spendingCategory:
        category === null ? null : spendingCategorySchema.parse(category),
    });
  };

  const handleDescriptionChange = (
    transactionId: string,
    customDescription: string | null,
  ) => {
    updateDescriptionMutation.mutate({ transactionId, customDescription });
  };

  const handleToggleHidden = (transactionId: string, hidden: boolean) => {
    toggleHiddenMutation.mutate({ transactionId, hidden });
  };

  const handleCategorize = () => {
    categorizeMutation.mutate({ limit: 20 });
  };

  return {
    categorizeMutation,
    handleCategoryChange,
    handleCategorize,
    handleDescriptionChange,
    handleToggleHidden,
  };
}
