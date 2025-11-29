"use client";

import { Plus } from "lucide-react";

import { Button } from "@finsight/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@finsight/ui/card";

// Mock data until we connect to DB
const accounts = [
  {
    id: "1",
    name: "Chase Total Checking",
    type: "depository",
    balance: 2450.5,
    institution: "Chase",
  },
  {
    id: "2",
    name: "Amex Gold",
    type: "credit",
    balance: -1240.2,
    institution: "American Express",
  },
  {
    id: "3",
    name: "Vanguard Brokerage",
    type: "investment",
    balance: 45200.0,
    institution: "Vanguard",
  },
  {
    id: "4",
    name: "Chase Freedom Unlimited",
    type: "credit",
    balance: -450.0,
    institution: "Chase",
  },
];

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your connected bank accounts and investments.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Link Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {account.name}
              </CardTitle>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {account.institution}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(account.balance)}
              </div>
              <p className="text-xs text-zinc-500 capitalize dark:text-zinc-400">
                {account.type}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Add New Account</CardTitle>
            <CardDescription>Connect a new bank or card</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <Button variant="outline" className="h-16 w-full">
              <Plus className="mr-2 h-4 w-4" />
              Link Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
