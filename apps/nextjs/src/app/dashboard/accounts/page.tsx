"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCcw } from "lucide-react";

import { Button } from "@finsight/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@finsight/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@finsight/ui/dialog";
import { Input } from "@finsight/ui/input";
import { toast } from "@finsight/ui/toast";

import { useTRPC } from "~/trpc/react";

interface SimpleFinAccount {
  id: string;
  name: string;
  balance: string;
  currency: string;
  org?: { name: string };
}

export default function AccountsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [setupToken, setSetupToken] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const linkAccount = useMutation(
    trpc.simplefin.linkAccount.mutationOptions({
      onSuccess: async () => {
        toast.success("Account Linked Successfully!");
        setSetupToken("");
        setIsDialogOpen(false);
        await queryClient.invalidateQueries(
          trpc.simplefin.getAccounts.pathFilter(),
        );
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    }),
  );

  const getAccounts = useQuery(
    trpc.simplefin.getAccounts.queryOptions(undefined, {
      enabled: false,
    }),
  );

  const handleLink = () => {
    if (!setupToken) return;
    linkAccount.mutate({ setupToken });
  };

  // Safe access with type casting or checking
  const accountsData = getAccounts.data as
    | { accounts: SimpleFinAccount[] }
    | undefined;
  const accounts = accountsData?.accounts ?? [];

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your connected financial accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void getAccounts.refetch()}
            disabled={getAccounts.isFetching}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${
                getAccounts.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Link Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link SimpleFin Account</DialogTitle>
                <DialogDescription>
                  Enter your SimpleFin setup token to connect your accounts.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Paste Setup Token here..."
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    disabled={linkAccount.isPending}
                  />
                  <p className="text-muted-foreground text-xs">
                    You can generate this token from your SimpleFin dashboard.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleLink}
                  disabled={linkAccount.isPending || !setupToken}
                >
                  {linkAccount.isPending ? "Connecting..." : "Connect"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {getAccounts.isError && (
        <div className="bg-destructive/10 text-destructive mb-6 rounded-lg p-4">
          Error loading accounts: {getAccounts.error.message}
        </div>
      )}

      {/* Empty State */}
      {!getAccounts.data && !getAccounts.isFetching && !getAccounts.isError && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No accounts loaded</h3>
          <p className="text-muted-foreground mt-1">
            Click &quot;Refresh&quot; to load your accounts.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void getAccounts.refetch()}
          >
            Load Accounts
          </Button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                {account.name}
              </CardTitle>
              <CardDescription className="capitalize">
                {account.org?.name ?? account.currency}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: account.currency || "USD",
                }).format(parseFloat(account.balance))}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Last synced: {new Date().toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
