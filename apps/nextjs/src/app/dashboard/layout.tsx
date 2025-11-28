import Link from "next/link";
import { redirect } from "next/navigation";

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
    <div className="flex min-h-screen flex-col bg-black text-zinc-100 md:flex-row">
      {/* Sidebar */}
      <aside className="w-full border-b border-zinc-800 bg-zinc-950/50 md:w-64 md:border-r md:border-b-0">
        <div className="flex h-14 items-center px-4 text-xl font-bold tracking-tighter">
          FinSight
        </div>
        <Separator className="opacity-50" />
        <nav className="flex flex-col gap-1 p-4">
          <DashboardLink href="/dashboard" label="Overview" icon="🏠" />
          <DashboardLink
            href="/dashboard/transactions"
            label="Transactions"
            icon="💳"
          />
          <DashboardLink
            href="/dashboard/cash-flow"
            label="Cash Flow"
            icon="🌊"
          />
          <DashboardLink
            href="/dashboard/investments"
            label="Investments"
            icon="📈"
          />
          <DashboardLink href="/dashboard/ai" label="AI Advisor" icon="🤖" />
          <DashboardLink
            href="/dashboard/settings"
            label="Settings"
            icon="⚙️"
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
  icon: string;
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      >
        <span>{icon}</span>
        {label}
      </Button>
    </Link>
  );
}

