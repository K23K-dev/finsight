import { and, eq } from "@finsight/db";
import { FinancialAccount } from "@finsight/db/schema";

export function visibleAccountFilter(userId: string) {
  return and(
    eq(FinancialAccount.userId, userId),
    eq(FinancialAccount.hidden, false),
  );
}

export function parseNumeric(value: string | null | undefined): number {
  return parseFloat(value ?? "0");
}
