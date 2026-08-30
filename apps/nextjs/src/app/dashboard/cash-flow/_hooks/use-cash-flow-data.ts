import { useQuery } from "@tanstack/react-query";
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns";

import { getSpendingCategoryLabel } from "@finsight/validators";

import { useTRPC } from "~/trpc/react";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type PresetKey = "thisMonth" | "lastMonth" | "thisYear" | "lastYear";

export const presets: Record<
  PresetKey,
  { label: string; getRange: () => DateRange }
> = {
  thisMonth: {
    label: "This Month",
    getRange: () => ({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    }),
  },
  lastMonth: {
    label: "Last Month",
    getRange: () => ({
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  thisYear: {
    label: "This Year",
    getRange: () => ({
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date()),
    }),
  },
  lastYear: {
    label: "Last Year",
    getRange: () => ({
      startDate: startOfYear(subYears(new Date(), 1)),
      endDate: endOfYear(subYears(new Date(), 1)),
    }),
  },
};

export function useCashFlowData(selectedPreset: PresetKey) {
  const trpc = useTRPC();
  const dateRange = presets[selectedPreset].getRange();

  const summaryQuery = useQuery(
    trpc.cashflow.getSummary.queryOptions({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  );

  const categoryQuery = useQuery(
    trpc.cashflow.getByCategory.queryOptions({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }),
  );

  const granularity =
    selectedPreset === "thisMonth" || selectedPreset === "lastMonth"
      ? "week"
      : "month";

  const timeSeriesQuery = useQuery(
    trpc.cashflow.getOverTime.queryOptions({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      granularity,
    }),
  );

  return {
    summary: summaryQuery.data ?? { income: 0, expenses: 0, net: 0 },
    categories: (categoryQuery.data ?? []).map((category) => ({
      ...category,
      category:
        getSpendingCategoryLabel(category.category) ?? category.category,
    })),
    timeSeries: timeSeriesQuery.data ?? [],
    isLoading:
      summaryQuery.isLoading ||
      categoryQuery.isLoading ||
      timeSeriesQuery.isLoading,
  };
}
