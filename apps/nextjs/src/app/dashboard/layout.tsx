import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightLeft,
  Banknote,
  Bot,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@finsight/ui/button";
import { Separator } from "@finsight/ui/separator";

import { getSession } from "~/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-card w-full border-b md:w-64 md:border-r md:border-b-0">
        <div className="flex h-14 items-center gap-2 px-4 text-xl font-bold tracking-tighter">
          <Wallet className="text-primary h-6 w-6" />
          FinSight
        </div>
        <Separator />
        <nav className="flex flex-col gap-1 p-4">
          <DashboardLink
            href="/dashboard"
            label="Overview"
            icon={<LayoutDashboard className="h-4 w-4" />}
          />
          <DashboardLink
            href="/dashboard/transactions"
            label="Transactions"
            icon={<ArrowRightLeft className="h-4 w-4" />}
          />
          <DashboardLink
            href="/dashboard/cash-flow"
            label="Cash Flow"
            icon={<Banknote className="h-4 w-4" />}
          />
          <DashboardLink
            href="/dashboard/investments"
            label="Investments"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <DashboardLink
            href="/dashboard/ai"
            label="AI Advisor"
            icon={<Bot className="h-4 w-4" />}
          />
          <DashboardLink
            href="/dashboard/settings"
            label="Settings"
            icon={<Settings className="h-4 w-4" />}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function DashboardLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full justify-start gap-3"
      >
        {icon}
        {label}
      </Button>
    </Link>
  );
}
