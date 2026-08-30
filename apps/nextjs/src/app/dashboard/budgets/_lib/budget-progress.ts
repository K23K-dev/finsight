const NEAR_LIMIT_PERCENT = 85;

export function deriveBudgetProgress(
  totalSpent: number,
  budgetAmount: number | null,
) {
  const actualProgress =
    budgetAmount === null ? null : (totalSpent / budgetAmount) * 100;
  const progress =
    actualProgress === null ? null : Math.min(Math.max(actualProgress, 0), 100);
  const remaining = budgetAmount === null ? null : budgetAmount - totalSpent;
  const isOverBudget = remaining !== null && remaining < 0;
  const isNearLimit =
    actualProgress !== null && actualProgress >= NEAR_LIMIT_PERCENT;
  const statusLabel =
    actualProgress === null
      ? "Tracking"
      : isOverBudget
        ? "Over limit"
        : isNearLimit
          ? "Near limit"
          : "On track";

  return {
    actualProgress,
    progress,
    remaining,
    isOverBudget,
    isNearLimit,
    statusLabel,
  };
}
