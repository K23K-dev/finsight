import type { LucideIcon } from "lucide-react";

import { cn } from "@finsight/ui";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
  secondaryDescription?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  secondaryDescription,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className,
      )}
    >
      {Icon && <Icon className="text-muted-foreground mb-4 h-12 w-12" />}
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <p className="text-muted-foreground text-sm">{description}</p>
      {secondaryDescription && (
        <p className="text-muted-foreground mt-1 text-sm">
          {secondaryDescription}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
