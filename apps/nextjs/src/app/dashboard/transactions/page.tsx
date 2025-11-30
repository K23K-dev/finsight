import { ArrowRightLeft } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>
    </div>
  );
}
