import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";

import { sumAccountBalances } from "~/utils/account-balances";
import { formatCurrency } from "~/utils/format";
import { Logo } from "./logo";

type Account = RouterOutputs["account"]["getAll"][number];

interface AccountsSummaryProps {
  accounts: readonly Account[];
  isLoading?: boolean;
}

export function AccountsSummary({
  accounts: allAccounts,
  isLoading = false,
}: AccountsSummaryProps) {
  const accounts = allAccounts.slice(0, 4);

  const totalAssets = sumAccountBalances(
    allAccounts.filter((account) => Number(account.balance) >= 0),
  );
  const totalLiabilities = Math.abs(
    sumAccountBalances(
      allAccounts.filter((account) => Number(account.balance) < 0),
    ),
  );

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Accounts</h2>
        <Link
          href="/dashboard/accounts"
          className="text-foreground/75 hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          Manage accounts
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="border-border/60 divide-border/60 divide-y border-y">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-center justify-between py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted/70 h-9 w-9 rounded-lg" />
                <div>
                  <div className="bg-muted h-4 w-32 rounded" />
                  <div className="bg-muted mt-1 h-3 w-20 rounded" />
                </div>
              </div>
              <div className="bg-muted h-5 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="border-border/60 flex h-48 flex-col items-center justify-center border-y py-8">
          <Building2 className="text-muted-foreground mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No accounts linked</p>
          <Link
            href="/dashboard/accounts"
            className="text-foreground mt-1 text-xs hover:underline"
          >
            Link your accounts
          </Link>
        </div>
      ) : (
        <div>
          <div className="border-border/60 text-muted-foreground hidden grid-cols-[minmax(0,1fr)_100px_120px] gap-4 border-y px-3 py-2.5 text-xs font-medium sm:grid">
            <span>Account</span>
            <span>Type</span>
            <span className="text-right">Balance</span>
          </div>
          <div className="border-border/60 divide-border/60 divide-y border-b">
            {accounts.map((account) => {
              const balance = parseFloat(account.balance);
              const isNegative = balance < 0;
              return (
                <div
                  key={account.id}
                  className="hover:bg-muted/30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_100px_120px]"
                >
                  <div className="bg-background/55 ring-border/50 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1">
                    <Logo
                      domain={account.institution}
                      size={36}
                      fallback={
                        <Building2 className="text-muted-foreground h-4 w-4" />
                      }
                      className="rounded-lg"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {account.customName ?? account.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs sm:hidden">
                      {account.accountType ?? account.institution ?? "Account"}
                    </p>
                  </div>
                  <p className="text-muted-foreground hidden truncate text-sm capitalize sm:block">
                    {account.accountType ?? "—"}
                  </p>
                  <p
                    className={cn(
                      "text-right text-sm font-semibold tabular-nums",
                      isNegative ? "text-foreground/75" : "",
                    )}
                  >
                    {formatCurrency(balance, { decimals: true })}
                  </p>
                </div>
              );
            })}
          </div>

          <dl className="border-border/60 divide-border/60 mt-4 grid grid-cols-3 divide-x border-t pt-4 text-xs">
            <div className="min-w-0 px-3 first:pl-0">
              <dt className="text-muted-foreground block truncate">Assets</dt>
              <dd className="mt-1 block truncate font-semibold tabular-nums">
                {formatCurrency(totalAssets)}
              </dd>
            </div>
            <div className="min-w-0 px-3">
              <dt className="text-muted-foreground block truncate">
                Liabilities
              </dt>
              <dd className="mt-1 block truncate font-semibold tabular-nums">
                {formatCurrency(totalLiabilities)}
              </dd>
            </div>
            <div className="min-w-0 px-3 text-right last:pr-0">
              <dt className="text-muted-foreground block truncate">Net</dt>
              <dd className="mt-1 block truncate font-semibold tabular-nums">
                {formatCurrency(totalAssets - totalLiabilities)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
