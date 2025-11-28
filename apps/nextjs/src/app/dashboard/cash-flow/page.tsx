import { Banknote } from "lucide-react";

export default function CashFlowPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Banknote className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Cash Flow</h1>
      </div>
      <div className="h-96 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
        Sankey Diagram (Coming Soon)
      </div>
    </div>
  );
}
