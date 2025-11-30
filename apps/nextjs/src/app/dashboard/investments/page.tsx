import { TrendingUp } from "lucide-react";

export default function InvestmentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Investments</h1>
      </div>
    </div>
  );
}
