import { Plus, Receipt, Trash2 } from "lucide-react";

import { Button } from "@finsight/ui/button";
import { getSpendingCategoryLabel } from "@finsight/validators";

import { formatCurrency, formatDate } from "~/utils/format";

interface Transaction {
  id: string;
  description: string;
  postedDate: Date;
  amount: number;
  spendingCategory: string | null;
}

interface BudgetTransactionsListProps {
  transactions: Transaction[];
  onRemove: (transactionId: string) => void;
  onAddClick: () => void;
  isRemoving?: boolean;
}

export function BudgetTransactionsList({
  transactions,
  onRemove,
  onAddClick,
  isRemoving = false,
}: BudgetTransactionsListProps) {
  return (
    <section
      className="border-border/60 bg-card/45 overflow-hidden rounded-lg border"
      aria-labelledby="budget-transactions"
    >
      <div className="flex items-end justify-between gap-4 px-5 py-5 sm:px-6">
        <div>
          <h2 id="budget-transactions" className="text-lg font-semibold">
            Transactions in this plan
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {transactions.length} assigned transaction
            {transactions.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onAddClick}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add transactions
        </Button>
      </div>
      {transactions.length === 0 ? (
        <div className="border-border/60 bg-muted/20 flex min-h-44 flex-col items-center justify-center border-t px-4 text-center">
          <Receipt className="text-muted-foreground h-6 w-6" />
          <p className="mt-3 font-medium">No transactions assigned</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Add spending transactions to start tracking this plan.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={onAddClick}
            className="mt-1"
          >
            Add the first transaction
          </Button>
        </div>
      ) : (
        <div className="border-border/60 max-h-104 overflow-y-auto border-t">
          <table className="w-full min-w-[560px]">
            <thead className="bg-card sticky top-0 z-1">
              <tr className="text-muted-foreground border-border/60 bg-muted/20 border-b text-xs font-medium">
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="w-12 px-2 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="max-w-88 px-3 py-3">
                    <p className="truncate text-sm font-medium">
                      {transaction.description}
                    </p>
                  </td>
                  <td className="text-muted-foreground px-3 py-3 text-xs tabular-nums">
                    {formatDate(transaction.postedDate)}
                  </td>
                  <td className="text-muted-foreground px-3 py-3 text-xs">
                    {getSpendingCategoryLabel(transaction.spendingCategory) ??
                      "Uncategorized"}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-medium tabular-nums">
                    {formatCurrency(Math.abs(transaction.amount))}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(transaction.id)}
                      disabled={isRemoving}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Remove ${transaction.description} from budget`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
