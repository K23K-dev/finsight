import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import type { db as DB } from "@finsight/db/client";
import { and, eq, gt, inArray, lt, or, sql } from "@finsight/db";
import { FinancialAccount, Transaction } from "@finsight/db/schema";
import { spendingCategorySchema } from "@finsight/validators";

import { protectedProcedure, requireFound } from "../trpc";
import { visibleAccountFilter } from "../utils";

const transactionPageSchema = z.object({
  flow: z.enum(["income", "expense"]).optional(),
  includeHidden: z.boolean().default(false),
  cursor: z.object({ postedDate: z.coerce.date(), id: z.string() }).nullish(),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().trim().min(1).max(256).optional(),
});

interface TransactionFilters {
  includeHidden?: boolean;
  flow?: "income" | "expense";
  search?: string;
}

function escapeLikeSearch(value: string) {
  return value.replace(/[!%_]/g, "!$&");
}

function selectVisibleAccountIds(db: typeof DB, userId: string) {
  return db
    .select({ id: FinancialAccount.id })
    .from(FinancialAccount)
    .where(visibleAccountFilter(userId));
}

function buildTransactionConditions(
  userId: string,
  visibleAccountIds: ReturnType<typeof selectVisibleAccountIds>,
  filters: TransactionFilters = {},
) {
  const conditions = [
    eq(Transaction.userId, userId),
    inArray(Transaction.accountId, visibleAccountIds),
  ];

  if (!filters.includeHidden) {
    conditions.push(eq(Transaction.hidden, false));
  }
  if (filters.flow === "income") {
    conditions.push(gt(Transaction.amount, "0"));
  } else if (filters.flow === "expense") {
    conditions.push(lt(Transaction.amount, "0"));
  }
  if (filters.search) {
    const escapedSearch = escapeLikeSearch(filters.search);
    const pattern = `%${escapedSearch}%`;
    const categoryPattern = `%${escapeLikeSearch(
      filters.search.replace(/\s+/g, "_"),
    )}%`;
    const searchCondition = or(
      sql`${Transaction.customDescription} ILIKE ${pattern} ESCAPE '!'`,
      sql`${Transaction.description} ILIKE ${pattern} ESCAPE '!'`,
      sql`${Transaction.payee} ILIKE ${pattern} ESCAPE '!'`,
      sql`${Transaction.spendingCategory}::text ILIKE ${categoryPattern} ESCAPE '!'`,
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  return conditions;
}

type OwnedTransactionUpdate = Partial<
  Pick<
    typeof Transaction.$inferInsert,
    | "customDescription"
    | "hidden"
    | "spendingCategory"
    | "spendingCategorySource"
  >
>;

async function updateOwnedTransaction(
  ctx: { db: typeof DB; session: { user: { id: string } } },
  transactionId: string,
  data: OwnedTransactionUpdate,
) {
  const [updated] = await ctx.db
    .update(Transaction)
    .set(data)
    .where(
      and(
        eq(Transaction.id, transactionId),
        eq(Transaction.userId, ctx.session.user.id),
      ),
    )
    .returning({ id: Transaction.id });

  requireFound(updated, "Transaction not found.");
}

export const transactionRouter = {
  getPage: protectedProcedure
    .input(transactionPageSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const visibleAccountIds = selectVisibleAccountIds(ctx.db, userId);
      const conditions = buildTransactionConditions(
        userId,
        visibleAccountIds,
        input,
      );

      if (input.cursor) {
        const cursorCondition = or(
          lt(Transaction.postedDate, input.cursor.postedDate),
          and(
            eq(Transaction.postedDate, input.cursor.postedDate),
            lt(Transaction.id, input.cursor.id),
          ),
        );
        if (cursorCondition) conditions.push(cursorCondition);
      }

      const items = await ctx.db.query.Transaction.findMany({
        columns: { providerTransactionId: false },
        where: and(...conditions),
        orderBy: (fields, { desc: descOrder }) => [
          descOrder(fields.postedDate),
          descOrder(fields.id),
        ],
        limit: input.limit + 1,
      });

      if (items.length <= input.limit) {
        return { items, nextCursor: undefined };
      }

      items.pop();
      const lastItem = items.at(-1);
      return {
        items,
        nextCursor: lastItem
          ? { postedDate: lastItem.postedDate, id: lastItem.id }
          : undefined,
      };
    }),

  getStats: protectedProcedure
    .input(z.object({ includeHidden: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const visibleAccountIds = selectVisibleAccountIds(ctx.db, userId);
      const [stats] = await ctx.db
        .select({
          total: sql<number>`COUNT(*)::int`,
          pending: sql<number>`COUNT(*) FILTER (WHERE ${Transaction.pending} = true)::int`,
          needsReview: sql<number>`COUNT(*) FILTER (WHERE ${Transaction.amount}::numeric < 0 AND ${Transaction.spendingCategory} IS NULL)::int`,
        })
        .from(Transaction)
        .where(
          and(...buildTransactionConditions(userId, visibleAccountIds, input)),
        );

      return {
        total: Number(stats?.total ?? 0),
        pending: Number(stats?.pending ?? 0),
        needsReview: Number(stats?.needsReview ?? 0),
      };
    }),

  updateSpendingCategory: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        spendingCategory: spendingCategorySchema.nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateOwnedTransaction(ctx, input.transactionId, {
        spendingCategory: input.spendingCategory,
        spendingCategorySource: input.spendingCategory === null ? null : "user",
      });
      return { success: true };
    }),

  updateDescription: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        customDescription: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateOwnedTransaction(ctx, input.transactionId, {
        customDescription: input.customDescription,
      });
      return { success: true };
    }),

  toggleHidden: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        hidden: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateOwnedTransaction(ctx, input.transactionId, {
        hidden: input.hidden,
      });
      return { success: true, hidden: input.hidden };
    }),
} satisfies TRPCRouterRecord;
