import Link from "next/link";

import { Button } from "@finsight/ui/button";

export function DashboardLink({
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
