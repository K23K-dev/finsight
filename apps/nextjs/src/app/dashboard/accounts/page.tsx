"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@finsight/ui/button";
import { Input } from "@finsight/ui/input";

import { useTRPC } from "~/trpc/react";

export default function AccountsPage() {
  const trpc = useTRPC();
  const [setupToken, setSetupToken] = useState("");

  const linkAccount = useMutation(
    trpc.simplefin.linkAccount.mutationOptions({
      onSuccess: () => {
        alert("Account Linked Successfully!");
        setSetupToken("");
      },
      onError: (error) => {
        console.error("Link Error:", error.message);
        alert(`Error: ${error.message}`);
      },
    }),
  );

  const getAccounts = useQuery(
    trpc.simplefin.getAccounts.queryOptions(undefined, {
      enabled: false,
    }),
  );

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Link SimpleFin Account</h2>
      <div className="flex max-w-md gap-2">
        <Input
          placeholder="Paste Setup Token here..."
          value={setupToken}
          onChange={(e) => setSetupToken(e.target.value)}
        />
        <Button
          onClick={() => linkAccount.mutate({ setupToken })}
          disabled={linkAccount.isPending || !setupToken}
        >
          {linkAccount.isPending ? "Linking..." : "Link Account"}
        </Button>
      </div>

      <div className="mt-8">
        <Button onClick={() => void getAccounts.refetch()}>Get Accounts</Button>
        <pre className="mt-4">{JSON.stringify(getAccounts.data, null, 2)}</pre>
      </div>
    </div>
  );
}
