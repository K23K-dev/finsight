"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@finsight/ui/select";

import type { PresetKey } from "./_hooks/use-cash-flow-data";
import { PageHeader } from "../_components/page-header";
import { CashFlowChart } from "./_components/cash-flow-chart";
import { CashFlowSummary } from "./_components/cash-flow-summary";
import { CategoryBreakdown } from "./_components/category-breakdown";
import { presets, useCashFlowData } from "./_hooks/use-cash-flow-data";

export default function CashFlowPage() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("thisMonth");
  const { summary, categories, timeSeries, isLoading } =
    useCashFlowData(selectedPreset);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Cash Flow">
        <Select
          value={selectedPreset}
          onValueChange={(value) => setSelectedPreset(value as PresetKey)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(presets).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CashFlowSummary
          income={summary.income}
          expenses={summary.expenses}
          net={summary.net}
          isLoading={isLoading}
        />

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <CashFlowChart data={timeSeries} isLoading={isLoading} />
          <CategoryBreakdown categories={categories} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
