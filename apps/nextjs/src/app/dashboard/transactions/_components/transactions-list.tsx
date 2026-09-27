import type { ReactNode } from "react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";

import { TransactionRow } from "./transaction-row";

type Transaction = RouterOutputs["transaction"]["getPage"]["items"][number];

interface TransactionsListProps {
  pendingTransactions: readonly Transaction[];
  dateGroups: readonly (readonly [string, readonly Transaction[]])[];
  getAccountName: (accountId: string) => string;
  getAccountInstitution: (accountId: string) => string | null;
  onCategoryChange: (transactionId: string, category: string | null) => void;
  onDescriptionChange: (
    transactionId: string,
    customDescription: string | null,
  ) => void;
  onToggleHidden: (transactionId: string, hidden: boolean) => void;
}

export function TransactionsList({
  pendingTransactions,
  dateGroups,
  getAccountName,
  getAccountInstitution,
  onCategoryChange,
  onDescriptionChange,
  onToggleHidden,
}: TransactionsListProps) {
  return (
    <div>
      <div className="text-muted-foreground bg-background border-border/60 sticky top-16 z-10 hidden grid-cols-[40px_minmax(150px,1.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_120px_80px] items-center gap-3 border-b px-6 py-3 text-xs font-medium md:grid">
        <span className="col-span-2">Payee</span>
        <span>Category</span>
        <span>Account</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Actions</span>
      </div>

      {pendingTransactions.length > 0 && (
        <TransactionGroup label="Pending" review>
          {pendingTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              accountName={getAccountName(transaction.accountId)}
              accountInstitution={getAccountInstitution(transaction.accountId)}
              onCategoryChange={onCategoryChange}
              onDescriptionChange={onDescriptionChange}
              onToggleHidden={onToggleHidden}
            />
          ))}
        </TransactionGroup>
      )}

      {dateGroups.map(([date, rows]) => (
        <TransactionGroup key={date} label={date}>
          {rows.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              accountName={getAccountName(transaction.accountId)}
              accountInstitution={getAccountInstitution(transaction.accountId)}
              onCategoryChange={onCategoryChange}
              onDescriptionChange={onDescriptionChange}
              onToggleHidden={onToggleHidden}
            />
          ))}
        </TransactionGroup>
      ))}
    </div>
  );
}

interface TransactionGroupProps {
  label: string;
  review?: boolean;
  children: ReactNode;
}

function TransactionGroup({
  label,
  review = false,
  children,
}: TransactionGroupProps) {
  return (
    <section>
      <div
        className={cn(
          "bg-background/24 border-border/55 border-b px-5 py-3 sm:px-6",
          review && "bg-review-muted/65",
        )}
      >
        <h2 className={cn("text-sm font-semibold", review && "text-review")}>
          {label}
        </h2>
      </div>
      <div className="divide-border/50 divide-y">{children}</div>
    </section>
  );
}
