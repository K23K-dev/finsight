import { Activity, DollarSign, LayoutDashboard, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">Total Net Worth</h3>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-3xl font-bold">$124,592.00</div>
          <div className="mt-1 text-xs text-green-500">
            +2.5% from last month
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">
              Monthly Spending
            </h3>
            <Activity className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-3xl font-bold">$3,240.50</div>
          <div className="mt-1 text-xs text-zinc-500">Target: $4,000.00</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">AI Insight</h3>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            "You've spent 15% less on dining out this month compared to average.
            Great job!"
          </p>
        </div>
      </div>
    </div>
  );
}
