import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@finsight/ui/toast";

import { useTRPC } from "~/trpc/react";

export function countLabel(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function useInvalidateFinancialData() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries(trpc.simplefin.status.pathFilter()),
        queryClient.invalidateQueries(trpc.account.getAll.pathFilter()),
        queryClient.invalidateQueries(trpc.transaction.pathFilter()),
        queryClient.invalidateQueries(trpc.cashflow.pathFilter()),
        queryClient.invalidateQueries(trpc.budget.pathFilter()),
      ]),
    [queryClient, trpc],
  );
}

export function useSimpleFinSync() {
  const trpc = useTRPC();
  const invalidateFinancialData = useInvalidateFinancialData();

  return useMutation(
    trpc.simplefin.sync.mutationOptions({
      onSuccess: async (data) => {
        const summary = `Synced ${countLabel(data.transactionsSynced, "transaction")} across ${countLabel(data.accountsSynced, "account")}`;
        const providerIssueCount = data.providerErrors.length;

        if (providerIssueCount > 0) {
          toast.warning(
            `${summary}, with ${countLabel(providerIssueCount, "provider issue")}`,
          );
        } else {
          toast.success(summary);
        }

        await invalidateFinancialData();
      },
      onError: (error) => {
        toast.error(`Sync failed: ${error.message}`);
      },
    }),
  );
}
