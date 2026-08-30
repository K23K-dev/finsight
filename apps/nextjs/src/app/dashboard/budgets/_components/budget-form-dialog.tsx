import type { FormEvent } from "react";
import { useState } from "react";

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

interface BudgetFormValues {
  name: string;
  description: string;
  amount: string;
}

interface BudgetFormDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: BudgetFormValues;
  isLoading?: boolean;
  onSubmit: (values: BudgetFormValues) => void;
}

export function BudgetFormDialog({
  mode,
  open,
  onOpenChange,
  initialValues,
  isLoading = false,
  onSubmit,
}: BudgetFormDialogProps) {
  const formKey = [
    mode,
    open ? "open" : "closed",
    initialValues?.name ?? "",
    initialValues?.description ?? "",
    initialValues?.amount ?? "",
  ].join(":");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BudgetFormContent
        key={formKey}
        mode={mode}
        initialValues={initialValues}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

interface BudgetFormContentProps {
  mode: "create" | "edit";
  initialValues?: BudgetFormValues;
  isLoading: boolean;
  onSubmit: (values: BudgetFormValues) => void;
}

function BudgetFormContent({
  mode,
  initialValues,
  isLoading,
  onSubmit,
}: BudgetFormContentProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const isCreate = mode === "create";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      amount,
    });
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Create budget" : "Edit budget"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Create a spending plan, then assign transactions for it to track."
              : "Update this spending plan's name, context, or limit."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-5">
          <div className="space-y-2">
            <Label htmlFor="budget-name">Name</Label>
            <Input
              id="budget-name"
              placeholder={isCreate ? "Summer trip" : undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-description">Description (optional)</Label>
            <Input
              id="budget-description"
              placeholder={isCreate ? "Flights, lodging, and meals" : undefined}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Spending limit (optional)</Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                $
              </span>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder={isCreate ? "5000" : undefined}
                className="pl-7 tabular-nums"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isLoading}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Leave this empty to track spending without a target.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading || !name.trim()}>
            {isLoading
              ? isCreate
                ? "Creating…"
                : "Saving…"
              : isCreate
                ? "Create budget"
                : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
