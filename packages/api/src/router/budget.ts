import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { db as DB } from "@finsight/db/client";
import { and, desc, eq, inArray, lt, sql } from "@finsight/db";
import {
  Budget,
  BudgetTransaction,
  FinancialAccount,
  Transaction,
} from "@finsight/db/schema";
import { budgetCreateSchema, budgetUpdateSchema } from "@finsight/validators";

import { protectedProcedure, requireFound } from "../trpc";
import { parseNumeric } from "../utils";

async function getOwnedBudgetOrThrow(
  ctx: { db: typeof DB; session: { user: { id: string } } },
  budgetId: string,
) {
  const budget = await ctx.db.query.Budget.findFirst({
    where: and(eq(Budget.id, budgetId), eq(Budget.userId, ctx.session.user.id)),
  });

  return requireFound(budget, "Budget not found.");
}

export const budgetRouter = {
  // Spending totals exclude hidden transactions and accounts.
  list: protectedProcedure.query(async ({ ctx }) => {
    const budgets = await ctx.db
      .select({
        id: Budget.id,
        name: Budget.name,
        description: Budget.description,
        budgetAmount: Budget.budgetAmount,
        createdAt: Budget.createdAt,
        updatedAt: Budget.updatedAt,
        totalSpent: sql<string>`COALESCE(SUM(CASE WHEN ${FinancialAccount.hidden} = false AND ${Transaction.hidden} = false AND ${Transaction.amount}::numeric < 0 THEN ABS(${Transaction.amount}::numeric) ELSE 0 END), 0)`,
      })
      .from(Budget)
      .leftJoin(BudgetTransaction, eq(Budget.id, BudgetTransaction.budgetId))
      .leftJoin(
        Transaction,
        eq(BudgetTransaction.transactionId, Transaction.id),
      )
      .leftJoin(
        FinancialAccount,
        eq(Transaction.accountId, FinancialAccount.id),
      )
      .where(eq(Budget.userId, ctx.session.user.id))
      .groupBy(Budget.id)
      .orderBy(Budget.createdAt);

    return budgets.map((b) => ({
      ...b,
      budgetAmount: b.budgetAmount ? parseNumeric(b.budgetAmount) : null,
      totalSpent: parseNumeric(b.totalSpent),
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const budget = await getOwnedBudgetOrThrow(ctx, input.id);

      const budgetTransactions = await ctx.db
        .select({
          id: Transaction.id,
          amount: Transaction.amount,
          description: sql<string>`COALESCE(${Transaction.customDescription}, ${Transaction.description})`,
          postedDate: Transaction.postedDate,
          spendingCategory: Transaction.spendingCategory,
          accountId: Transaction.accountId,
        })
        .from(BudgetTransaction)
        .innerJoin(
          Transaction,
          eq(BudgetTransaction.transactionId, Transaction.id),
        )
        .innerJoin(
          FinancialAccount,
          eq(Transaction.accountId, FinancialAccount.id),
        )
        .where(
          and(
            eq(BudgetTransaction.budgetId, input.id),
            eq(Transaction.hidden, false),
            eq(FinancialAccount.hidden, false),
            lt(Transaction.amount, "0"),
          ),
        )
        .orderBy(desc(Transaction.postedDate));

      const totalSpent = budgetTransactions.reduce(
        (sum, t) => sum + Math.abs(parseNumeric(t.amount)),
        0,
      );

      return {
        ...budget,
        budgetAmount: budget.budgetAmount
          ? parseNumeric(budget.budgetAmount)
          : null,
        totalSpent,
        transactions: budgetTransactions.map((t) => ({
          ...t,
          amount: parseNumeric(t.amount),
        })),
      };
    }),

  create: protectedProcedure
    .input(budgetCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [budget] = await ctx.db
        .insert(Budget)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description ?? null,
          budgetAmount: input.budgetAmount?.toFixed(2) ?? null,
        })
        .returning();

      return budget;
    }),

  update: protectedProcedure
    .input(budgetUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const updateData: Partial<{
        name: string;
        description: string | null;
        budgetAmount: string | null;
      }> = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.budgetAmount !== undefined) {
        updateData.budgetAmount = input.budgetAmount?.toFixed(2) ?? null;
      }

      const [updated] = await ctx.db
        .update(Budget)
        .set(updateData)
        .where(
          and(eq(Budget.id, input.id), eq(Budget.userId, ctx.session.user.id)),
        )
        .returning();

      return requireFound(updated, "Budget not found.");
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(Budget)
        .where(
          and(eq(Budget.id, input.id), eq(Budget.userId, ctx.session.user.id)),
        )
        .returning({ id: Budget.id });

      requireFound(deleted, "Budget not found.");

      return { success: true };
    }),

  addTransactions: protectedProcedure
    .input(
      z.object({
        budgetId: z.string().uuid(),
        transactionIds: z.array(z.string().min(1).max(128)).min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedBudgetOrThrow(ctx, input.budgetId);
      const transactionIds = [...new Set(input.transactionIds)];

      const transactions = await ctx.db
        .select({ id: Transaction.id })
        .from(Transaction)
        .innerJoin(
          FinancialAccount,
          eq(Transaction.accountId, FinancialAccount.id),
        )
        .where(
          and(
            eq(Transaction.userId, ctx.session.user.id),
            eq(Transaction.hidden, false),
            eq(FinancialAccount.userId, ctx.session.user.id),
            eq(FinancialAccount.hidden, false),
            lt(Transaction.amount, "0"),
            inArray(Transaction.id, transactionIds),
          ),
        );

      if (transactions.length !== transactionIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some transactions are unavailable or are not expenses.",
        });
      }

      const added = await ctx.db
        .insert(BudgetTransaction)
        .values(
          transactionIds.map((transactionId) => ({
            budgetId: input.budgetId,
            transactionId,
          })),
        )
        .onConflictDoNothing()
        .returning({ transactionId: BudgetTransaction.transactionId });

      return { success: true, added: added.length };
    }),

  removeTransaction: protectedProcedure
    .input(
      z.object({
        budgetId: z.string().uuid(),
        transactionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedBudgetOrThrow(ctx, input.budgetId);

      await ctx.db
        .delete(BudgetTransaction)
        .where(
          and(
            eq(BudgetTransaction.budgetId, input.budgetId),
            eq(BudgetTransaction.transactionId, input.transactionId),
          ),
        );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
