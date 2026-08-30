import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { TRPCReactProvider } from "~/trpc/react";
import { DashboardShell } from "../_components/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getSession())) {
    redirect("/auth");
  }

  return (
    <TRPCReactProvider>
      <DashboardShell>{children}</DashboardShell>
    </TRPCReactProvider>
  );
}
