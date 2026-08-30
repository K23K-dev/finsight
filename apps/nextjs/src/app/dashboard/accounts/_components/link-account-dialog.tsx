import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@finsight/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@finsight/ui/dialog";
import { Input } from "@finsight/ui/input";
import { Label } from "@finsight/ui/label";

interface LinkAccountDialogProps {
  onLink: (setupToken: string) => void;
  isPending: boolean;
}

export function LinkAccountDialog({
  onLink,
  isPending,
}: LinkAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [setupToken, setSetupToken] = useState("");

  const handleLink = () => {
    if (!setupToken) return;
    onLink(setupToken);
    setSetupToken("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="mr-2 h-4 w-4" />
          Link Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link SimpleFin Account</DialogTitle>
          <DialogDescription>
            Enter your SimpleFin setup token to connect your accounts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="simplefin-setup-token">Setup token</Label>
            <Input
              id="simplefin-setup-token"
              placeholder="Paste Setup Token here..."
              value={setupToken}
              onChange={(e) => setSetupToken(e.target.value)}
              disabled={isPending}
            />
            <p className="text-muted-foreground text-xs">
              You can generate this token from your SimpleFin dashboard.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleLink} disabled={isPending || !setupToken}>
            {isPending ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
