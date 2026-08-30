import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@finsight/ui/toast";

import { useTRPC } from "~/trpc/react";
import {
  countLabel,
  useInvalidateFinancialData,
  useSimpleFinSync,
} from "../../_hooks/use-simplefin-sync";

export function useAccountMutations() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const syncAccounts = useSimpleFinSync();
  const invalidateFinancialData = useInvalidateFinancialData();

  const linkAccount = useMutation(
    trpc.simplefin.linkAccount.mutationOptions({
      onSuccess: async (data) => {
        const summary = `Linked ${countLabel(data.accountsSynced, "account")} and imported ${countLabel(data.transactionsSynced, "transaction")}`;
        toast.success(summary);

        await invalidateFinancialData();
      },
      onError: (error) => {
        toast.error(`Connection failed: ${error.message}`);
      },
    }),
  );

  const updateAccountDetails = useMutation(
    trpc.account.updateDetails.mutationOptions({
      onSuccess: async () => {
        toast.success("Account updated");
        await queryClient.invalidateQueries(trpc.account.getAll.pathFilter());
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    }),
  );

  const toggleAccountHidden = useMutation(
    trpc.account.toggleHidden.mutationOptions({
      onSuccess: async (data) => {
        toast.success(data.hidden ? "Account hidden" : "Account visible");
        await invalidateFinancialData();
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    }),
  );

  return {
    linkAccount,
    updateAccountDetails,
    toggleAccountHidden,
    syncAccounts,
  };
}
