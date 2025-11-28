export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400">Total Net Worth</h3>
          <div className="mt-2 text-3xl font-bold">$124,592.00</div>
          <div className="mt-1 text-xs text-green-500">
            +2.5% from last month
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400">
            Monthly Spending
          </h3>
          <div className="mt-2 text-3xl font-bold">$3,240.50</div>
          <div className="mt-1 text-xs text-zinc-500">Target: $4,000.00</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400">AI Insight</h3>
          <p className="mt-2 text-sm text-zinc-300">
            "You've spent 15% less on dining out this month compared to average.
            Great job!"
          </p>
        </div>
      </div>
    </div>
  );
}
