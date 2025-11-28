export default function InvestmentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Investments</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
          Portfolio Performance Chart
        </div>
        <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
          Asset Allocation Pie Chart
        </div>
      </div>
    </div>
  );
}

