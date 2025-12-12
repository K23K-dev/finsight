"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@finsight/ui/card";

import { useTRPC } from "~/trpc/react";

export default function TransactionsPage() {
  const trpc = useTRPC();

  const {
    data: txData,
    isFetching,
    isError,
    error,
  } = useQuery(trpc.simplefin.getTransactionsFromDb.queryOptions());

  const { data: accountsData } = useQuery(
    trpc.simplefin.getAccountsFromDb.queryOptions(),
  );

  // Map accountId -> name for display; fallback to accountId if missing.
  const accountNameById =
    accountsData?.reduce<Record<string, string>>((acc, a) => {
      acc[a.id] = a.name;
      return acc;
    }, {}) ?? {};

  const transactions = txData ?? [];

  // Group transactions by date string (e.g., "Aug 12, 2025")
  const grouped = transactions.reduce<Record<string, typeof transactions>>(
    (acc, t) => {
      const dateKey = new Date(t.postedDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      acc[dateKey] = acc[dateKey] ? [...acc[dateKey], t] : [t];
      return acc;
    },
    {},
  );
  const dateBuckets = Object.entries(grouped).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="text-primary h-8 w-8" />
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>

      {isError && (
        <div className="text-destructive border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm">
          Failed to load transactions: {error.message}
        </div>
      )}

      {isFetching && transactions.length === 0 && (
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
          Loading transactions…
        </div>
      )}

      {!isFetching && transactions.length === 0 && !isError && (
        <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
          No transactions found. Sync your accounts to see activity.
        </div>
      )}

      {dateBuckets.length > 0 && (
        <div className="flex flex-col gap-6">
          {dateBuckets.map(([date, rows]) => {
            const dayTotal = rows.reduce((sum, t) => sum + Number(t.amount), 0);
            const dayTotalDisplay = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(dayTotal);

            return (
              <Card key={date}>
                <CardHeader className="flex items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">
                    {date}
                  </CardTitle>
                  <div className="text-muted-foreground text-sm font-medium">
                    {dayTotalDisplay}
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="py-2 pr-4 text-left font-medium">
                          Description
                        </th>
                        <th className="py-2 pr-4 text-left font-medium">
                          Category
                        </th>
                        <th className="py-2 pr-4 text-left font-medium">
                          Account
                        </th>
                        <th className="py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((t) => (
                        <tr key={t.id} className="border-t">
                          <td className="py-2 pr-4">{t.description}</td>
                          <td className="text-muted-foreground py-2 pr-4">
                            {t.category ?? "Uncategorized"}
                          </td>
                          <td className="text-muted-foreground py-2 pr-4">
                            {accountNameById[t.accountId] ?? t.accountId}
                          </td>
                          <td
                            className={`py-2 text-right font-medium ${
                              Number(t.amount) < 0
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(Number(t.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
