import { useState } from "react";

import type { RouterOutputs } from "@finsight/api";
import { Button } from "@finsight/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@finsight/ui/dialog";
import { Input } from "@finsight/ui/input";
import { Label } from "@finsight/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@finsight/ui/select";

import { ACCOUNT_TYPES, INSTITUTIONS } from "../_lib/constants";

type FinancialAccount = RouterOutputs["account"]["getAll"][number];

interface EditAccountDialogProps {
  account: FinancialAccount | null;
  onClose: () => void;
  onSave: (data: {
    accountId: string;
    customName: string | null;
    accountType: string | null;
    institution: string | null;
  }) => void;
  isSaving: boolean;
}

export function EditAccountDialog({
  account,
  onClose,
  onSave,
  isSaving,
}: EditAccountDialogProps) {
  return (
    <Dialog open={account !== null} onOpenChange={(open) => !open && onClose()}>
      {account && (
        <EditAccountDialogContent
          key={account.id}
          account={account}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}
    </Dialog>
  );
}

function EditAccountDialogContent({
  account,
  onSave,
  isSaving,
}: {
  account: FinancialAccount;
  onSave: EditAccountDialogProps["onSave"];
  isSaving: boolean;
}) {
  const [editName, setEditName] = useState(account.customName ?? account.name);
  const [editType, setEditType] = useState<string | null>(account.accountType);
  const [editInstitution, setEditInstitution] = useState<string | null>(
    account.institution,
  );

  const handleSave = () => {
    const trimmedName = editName.trim();
    const customName =
      trimmedName === account.name ? null : trimmedName || null;

    onSave({
      accountId: account.id,
      customName,
      accountType: editType,
      institution: editInstitution,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Account</DialogTitle>
        <DialogDescription>Customize this account</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="accountName">Account Name</Label>
          <Input
            id="accountName"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter custom name..."
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountType">Account Type</Label>
          <Select
            value={editType ?? ""}
            onValueChange={(value) => setEditType(value || null)}
            disabled={isSaving}
          >
            <SelectTrigger id="accountType">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountInstitution">Institution</Label>
          <Select
            value={editInstitution ?? ""}
            onValueChange={(value) => setEditInstitution(value || null)}
            disabled={isSaving}
          >
            <SelectTrigger id="accountInstitution">
              <SelectValue placeholder="Select institution..." />
            </SelectTrigger>
            <SelectContent>
              {INSTITUTIONS.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={isSaving || !editName.trim()}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
