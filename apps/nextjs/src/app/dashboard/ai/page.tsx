export default function AIAssistantPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">AI Financial Advisor</h1>
      <div className="flex h-[600px] flex-col rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex-1 p-4 text-zinc-500">
          Ask me anything about your finances...
        </div>
        <div className="border-t border-zinc-800 p-4">
          <div className="h-10 rounded-md bg-zinc-800"></div>
        </div>
      </div>
    </div>
  );
}

