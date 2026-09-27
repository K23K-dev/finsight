import { useMemo } from "react";

import type { RouterOutputs } from "@finsight/api";

type Transaction = RouterOutputs["transaction"]["getPage"]["items"][number];

/** Splits server-ordered transactions into pending rows and posted days. */
export function useTransactionGroups(
  transactions: Transaction[],
  accounts: RouterOutputs["account"]["getAll"] | undefined,
) {
  const accountById = useMemo(
    () => new Map(accounts?.map((account) => [account.id, account])),
    [accounts],
  );

  const { pendingTransactions, dateGroups } = useMemo(() => {
    const pending: Transaction[] = [];
    const groups = new Map<string, Transaction[]>();

    // Rows arrive newest first, so insertion order already sorts the days.
    for (const transaction of transactions) {
      if (transaction.pending) {
        pending.push(transaction);
        continue;
      }

      const date = new Date(transaction.postedDate).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      );
      const group = groups.get(date);
      if (group) group.push(transaction);
      else groups.set(date, [transaction]);
    }

    return { pendingTransactions: pending, dateGroups: [...groups] };
  }, [transactions]);

  const getAccountName = (accountId: string) => {
    const account = accountById.get(accountId);
    return account?.customName ?? account?.name ?? "Account unavailable";
  };

  const getAccountInstitution = (accountId: string) =>
    accountById.get(accountId)?.institution ?? null;

  return {
    pendingTransactions,
    dateGroups,
    getAccountName,
    getAccountInstitution,
  };
}
