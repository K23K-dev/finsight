import { Bot } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Bot className="text-primary h-8 w-8" />
        <h1 className="text-3xl font-bold">AI Financial Advisor</h1>
      </div>
    </div>
  );
}
