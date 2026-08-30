import { useMemo } from "react";

import type { RouterOutputs } from "@finsight/api";

type Transaction = RouterOutputs["transaction"]["getPage"]["items"][number];

interface AccountInfo {
  name: string;
  customName: string | null;
  institution: string | null;
}

export function useTransactionFilters(
  transactions: Transaction[],
  accounts: RouterOutputs["account"]["getAll"] | undefined,
) {
  const accountById = useMemo(() => {
    return (
      accounts?.reduce<Record<string, AccountInfo>>((acc, a) => {
        acc[a.id] = {
          name: a.name,
          customName: a.customName,
          institution: a.institution,
        };
        return acc;
      }, {}) ?? {}
    );
  }, [accounts]);

  const { pendingTransactions, postedTransactions } = useMemo(() => {
    return {
      pendingTransactions: transactions.filter((t) => t.pending),
      postedTransactions: transactions.filter((t) => !t.pending),
    };
  }, [transactions]);

  const dateBuckets = useMemo(() => {
    const grouped = postedTransactions.reduce<Record<string, Transaction[]>>(
      (acc, t) => {
        const dateKey = new Date(t.postedDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        acc[dateKey] = acc[dateKey] ? [...acc[dateKey], t] : [t];
        return acc;
      },
      {},
    );

    return Object.entries(grouped).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [postedTransactions]);

  const getAccountName = (accountId: string): string => {
    const account = accountById[accountId];
    return account?.customName ?? account?.name ?? "Account unavailable";
  };

  const getAccountInstitution = (accountId: string): string | null => {
    return accountById[accountId]?.institution ?? null;
  };

  return {
    filteredPendingTransactions: pendingTransactions,
    filteredDateBuckets: dateBuckets,
    getAccountName,
    getAccountInstitution,
  };
}
