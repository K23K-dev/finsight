import { z } from "zod/v4";

export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const timeRangeSchema = z.enum(["1W", "1M", "3M", "6M", "1Y", "ALL"]);
export type TimeRange = z.infer<typeof timeRangeSchema>;

export const CLASSIFICATION_SOURCES = [
  "rule",
  "verified_alias",
  "model",
  "user",
] as const;

export const SPENDING_CATEGORIES = [
  { id: "food_and_dining", label: "Food & Dining", color: "#ef4444" },
  { id: "groceries", label: "Groceries", color: "#f97316" },
  { id: "shopping", label: "Shopping", color: "#f59e0b" },
  { id: "transportation", label: "Transportation", color: "#3b82f6" },
  { id: "entertainment", label: "Entertainment", color: "#8b5cf6" },
  { id: "housing", label: "Housing", color: "#78716c" },
  { id: "utilities", label: "Utilities", color: "#64748b" },
  { id: "healthcare", label: "Healthcare", color: "#10b981" },
  { id: "insurance", label: "Insurance", color: "#14b8a6" },
  { id: "travel", label: "Travel", color: "#06b6d4" },
  { id: "education", label: "Education", color: "#0ea5e9" },
  { id: "personal_care", label: "Personal Care", color: "#ec4899" },
  {
    id: "gifts_and_donations",
    label: "Gifts & Donations",
    color: "#d946ef",
  },
  { id: "other", label: "Other", color: "#71717a" },
] as const;

export type SpendingCategory = (typeof SPENDING_CATEGORIES)[number]["id"];

export interface SpendingCategoryDefinition {
  readonly id: SpendingCategory;
  readonly label: string;
  readonly color: string;
}

export const SPENDING_CATEGORY_NAMES = [
  SPENDING_CATEGORIES[0].id,
  ...SPENDING_CATEGORIES.slice(1).map(({ id }) => id),
] as const;

export const spendingCategorySchema = z.enum(SPENDING_CATEGORY_NAMES);

export function getSpendingCategoryLabel(
  category: string | null | undefined,
): string | null {
  const parsed = spendingCategorySchema.safeParse(category);
  if (!parsed.success) return null;

  return (
    SPENDING_CATEGORIES.find((definition) => definition.id === parsed.data)
      ?.label ?? null
  );
}

export function transactionNeedsReview(transaction: {
  amount: string | number;
  spendingCategory: SpendingCategory | null;
}): boolean {
  return (
    Number(transaction.amount) < 0 && transaction.spendingCategory === null
  );
}

export const budgetCreateSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().max(1000).optional(),
  budgetAmount: z.number().positive().optional(),
});

export const budgetUpdateSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1).max(256).optional(),
    description: z.string().max(1000).nullable().optional(),
    budgetAmount: z.number().positive().nullable().optional(),
  })
  .refine(
    ({ name, description, budgetAmount }) =>
      name !== undefined ||
      description !== undefined ||
      budgetAmount !== undefined,
    { message: "At least one budget field must be provided." },
  );
