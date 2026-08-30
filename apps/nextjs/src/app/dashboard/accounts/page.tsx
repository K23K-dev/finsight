"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, RefreshCcw } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";
import { Button } from "@finsight/ui/button";
import { Skeleton } from "@finsight/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import { EmptyState } from "../_components/empty-state";
import { PageHeader } from "../_components/page-header";
import { AccountsOverview } from "./_components/account-card";
import { EditAccountDialog } from "./_components/edit-account-dialog";
import { LinkAccountDialog } from "./_components/link-account-dialog";
import { useAccountMutations } from "./_hooks/use-account-mutations";

type FinancialAccount = RouterOutputs["account"]["getAll"][number];

export default function AccountsPage() {
  const trpc = useTRPC();
  const [showHidden, setShowHidden] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(
    null,
  );

  const {
    linkAccount,
    updateAccountDetails,
    toggleAccountHidden,
    syncAccounts,
  } = useAccountMutations();

  const accountsQuery = useQuery(
    trpc.account.getAll.queryOptions({
      includeHidden: showHidden,
    }),
  );
  const simpleFinStatusQuery = useQuery(trpc.simplefin.status.queryOptions());

  const handleToggleHidden = (account: FinancialAccount) => {
    toggleAccountHidden.mutate({
      accountId: account.id,
      hidden: !account.hidden,
    });
  };

  const handleSaveAccount = (data: {
    accountId: string;
    customName: string | null;
    accountType: string | null;
    institution: string | null;
  }) => {
    updateAccountDetails.mutate(data, {
      onSuccess: () => setEditingAccount(null),
    });
  };

  const isSaving = updateAccountDetails.isPending;

  const accountsData = accountsQuery.data;
  const simpleFinStatus = simpleFinStatusQuery.data;
  const accounts = accountsData ?? [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Accounts">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setShowHidden(!showHidden)}
        >
          {showHidden ? (
            <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {showHidden ? "Hide hidden" : "Show hidden"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => syncAccounts.mutate()}
          disabled={
            syncAccounts.isPending ||
            linkAccount.isPending ||
            simpleFinStatus?.isConnected !== true
          }
        >
          <RefreshCcw
            className={cn(
              "mr-2 h-4 w-4",
              syncAccounts.isPending && "animate-spin",
            )}
            aria-hidden="true"
          />
          {syncAccounts.isPending ? "Syncing" : "Sync now"}
        </Button>

        <LinkAccountDialog
          onLink={(setupToken) => linkAccount.mutate({ setupToken })}
          isPending={linkAccount.isPending}
        />
      </PageHeader>

      <div className="flex-1 p-4 sm:p-6 lg:p-7">
        <div className="mx-auto w-full max-w-7xl space-y-5">
          {accountsQuery.isError && (
            <div
              role="alert"
              className="text-destructive bg-destructive/8 border-destructive/25 rounded-lg border p-4 text-sm"
            >
              Accounts could not be loaded: {accountsQuery.error.message}
            </div>
          )}

          {syncAccounts.isError && (
            <div
              role="alert"
              className="text-destructive bg-destructive/8 border-destructive/25 rounded-lg border p-4 text-sm"
            >
              Account sync failed: {syncAccounts.error.message}
            </div>
          )}

          {accountsQuery.isFetching && accounts.length === 0 && (
            <div className="bg-card/48 border-border/70 overflow-hidden rounded-lg border">
              <div className="divide-border/60 divide-y">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-2 h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-28" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {accounts.length === 0 &&
            !accountsQuery.isFetching &&
            !accountsQuery.isError && (
              <div className="bg-card/48 border-border/70 rounded-lg border px-5 py-20 sm:px-8">
                <EmptyState
                  title="No accounts"
                  description="Link your SimpleFin account to see all of your balances in one place."
                />
              </div>
            )}

          {accounts.length > 0 && (
            <AccountsOverview
              accounts={accounts}
              onEdit={setEditingAccount}
              onToggleHidden={handleToggleHidden}
            />
          )}
        </div>
      </div>

      <EditAccountDialog
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        onSave={handleSaveAccount}
        isSaving={isSaving}
      />
    </div>
  );
}
