import { useEffect, useRef, useState } from "react";
import { Building2, Check, Eye, EyeOff, Pencil, X } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";
import { Input } from "@finsight/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@finsight/ui/select";
import {
  SPENDING_CATEGORIES,
  transactionNeedsReview,
} from "@finsight/validators";

import { formatCurrency } from "~/utils/format";
import { Logo } from "../../_components/logo";

type Transaction = RouterOutputs["transaction"]["getPage"]["items"][number];

interface TransactionRowProps {
  transaction: Transaction;
  accountName: string;
  accountInstitution?: string | null;
  onCategoryChange: (transactionId: string, category: string | null) => void;
  onDescriptionChange: (
    transactionId: string,
    description: string | null,
  ) => void;
  onToggleHidden: (transactionId: string, hidden: boolean) => void;
}

export function TransactionRow({
  transaction,
  accountName,
  accountInstitution,
  onCategoryChange,
  onDescriptionChange,
  onToggleHidden,
}: TransactionRowProps) {
  const amount = Number(transaction.amount);
  const isIncome = amount > 0;
  const [isEditing, setIsEditing] = useState(false);
  const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();
  const currentDescription =
    transaction.customDescription ?? transaction.description;
  const [editValue, setEditValue] = useState(
    normalizeSpaces(currentDescription),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();

    if (!trimmed || trimmed === currentDescription) {
      setEditValue(currentDescription);
      setIsEditing(false);
      return;
    }

    onDescriptionChange(
      transaction.id,
      trimmed === transaction.description ? null : trimmed,
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(normalizeSpaces(currentDescription));
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      handleCancel();
    }
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const nextFocus = event.relatedTarget;
    const editControls = event.currentTarget.parentElement;

    if (!(nextFocus instanceof Node) || !editControls?.contains(nextFocus)) {
      handleSave();
    }
  };

  const categoryData = SPENDING_CATEGORIES.find(
    (category) => category.id === transaction.spendingCategory,
  );
  const categoryLabel =
    categoryData?.label ?? (amount < 0 ? "Needs category" : "No category");
  const needsCategoryReview = transactionNeedsReview(transaction);
  const formattedAmount = formatCurrency(amount, { decimals: true });

  return (
    <div
      className={cn(
        "hover:bg-muted/25 grid grid-cols-[36px_minmax(0,1fr)_auto_36px] items-center gap-3 px-5 py-3.5 transition-colors sm:px-6 md:grid-cols-[40px_minmax(150px,1.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_120px_80px]",
        transaction.hidden && "opacity-55",
      )}
    >
      <div className="bg-background/50 ring-border/50 text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ring-1">
        {currentDescription.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              className="h-8 text-sm"
              aria-label="Transaction description"
            />
            <button
              type="button"
              onClick={handleSave}
              className="text-muted-foreground hover:bg-muted/45 hover:text-foreground focus-visible:ring-ring rounded-md p-1.5 focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Save description"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-muted-foreground hover:bg-muted/45 hover:text-foreground focus-visible:ring-ring rounded-md p-1.5 focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-medium">{currentDescription}</p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground hover:bg-muted/45 hover:text-foreground focus-visible:ring-ring shrink-0 rounded-md p-1 focus-visible:ring-2 focus-visible:outline-none"
              aria-label={`Edit ${currentDescription}`}
              title="Edit description"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 text-xs md:hidden">
          <select
            aria-label={`Category for ${currentDescription}`}
            value={transaction.spendingCategory ?? ""}
            onChange={(event) =>
              onCategoryChange(transaction.id, event.target.value || null)
            }
            className={cn(
              "focus-visible:ring-ring max-w-32 truncate bg-transparent font-medium outline-none focus-visible:ring-2",
              needsCategoryReview && "text-review",
            )}
          >
            <option value="">{categoryLabel}</option>
            {SPENDING_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true"> · </span>
          <span className="truncate">{accountName}</span>
        </div>
      </div>

      <div className="hidden min-w-0 md:block">
        <Select
          value={transaction.spendingCategory ?? ""}
          onValueChange={(value) => {
            onCategoryChange(transaction.id, value || null);
          }}
        >
          <SelectTrigger
            aria-label={`Category for ${currentDescription}`}
            className={cn(
              "h-8 max-w-full justify-start border-transparent bg-transparent px-2 text-sm shadow-none",
              needsCategoryReview &&
                "border-review/25 bg-review-muted text-review hover:bg-review-muted",
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              {categoryData && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryData.color }}
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{categoryLabel}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {SPENDING_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <div className="bg-background/50 ring-border/50 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1">
          <Logo
            domain={accountInstitution}
            size={28}
            className="rounded-md"
            fallback={<Building2 className="text-muted-foreground h-4 w-4" />}
          />
        </div>
        <span className="truncate text-sm">{accountName}</span>
      </div>

      <p
        className={cn(
          "text-right text-sm font-semibold tabular-nums",
          isIncome && "text-positive",
        )}
      >
        {isIncome ? "+" : ""}
        {formattedAmount}
      </p>

      <button
        type="button"
        onClick={() => onToggleHidden(transaction.id, !transaction.hidden)}
        className="text-muted-foreground hover:bg-muted/45 hover:text-foreground focus-visible:ring-ring inline-flex h-8 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`${transaction.hidden ? "Show" : "Hide"} ${currentDescription}`}
        title={transaction.hidden ? "Show transaction" : "Hide transaction"}
      >
        <span className="hidden md:inline">
          {transaction.hidden ? "Show" : "Hide"}
        </span>
        {transaction.hidden ? (
          <Eye className="h-4 w-4" aria-hidden="true" />
        ) : (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
