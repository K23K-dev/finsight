import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-lg font-medium">Connected Accounts</h3>
        <p className="text-sm text-zinc-400">
          Manage your bank connections here.
        </p>
      </div>
    </div>
  );
}
