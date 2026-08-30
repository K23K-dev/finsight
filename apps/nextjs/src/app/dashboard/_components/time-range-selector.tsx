import type { TimeRange } from "@finsight/validators";
import { cn } from "@finsight/ui";

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "All" },
];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

export function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Net worth time range"
      className={cn(
        "bg-muted/35 border-border/70 inline-grid grid-cols-6 items-center rounded-md border p-1",
        className,
      )}
    >
      {timeRanges.map((range) => (
        <button
          key={range.value}
          type="button"
          aria-pressed={value === range.value}
          className={cn(
            "focus-visible:ring-ring rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
            value === range.value
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
          )}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
