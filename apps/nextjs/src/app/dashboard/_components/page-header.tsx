import { cn } from "@finsight/ui";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "bg-background border-border/60 sticky top-0 z-20 flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8",
        className,
      )}
    >
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {children && (
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      )}
    </header>
  );
}
