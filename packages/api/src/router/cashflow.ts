import type { TRPCRouterRecord } from "@trpc/server";
import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { z } from "zod";

import type { TimeRange } from "@finsight/validators";
import { and, eq, gte, lte, sql } from "@finsight/db";
import {
  BalanceSnapshot,
  CAPTURED_BALANCE_SOURCE,
  FinancialAccount,
  Transaction,
} from "@finsight/db/schema";
import { dateRangeSchema, timeRangeSchema } from "@finsight/validators";

import { protectedProcedure } from "../trpc";
import { parseNumeric } from "../utils";

function resolveStartDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "1W":
      return subDays(now, 7);
    case "1M":
      return subMonths(now, 1);
    case "3M":
      return subMonths(now, 3);
    case "6M":
      return subMonths(now, 6);
    case "1Y":
      return subYears(now, 1);
    case "ALL":
      return new Date(2000, 0, 1);
  }
}

function toUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Longer ranges are represented by their latest captured balance instead of
 * every sync-time observation. Short ranges retain each observed day.
 */
function collapseNetWorthHistory(
  points: { date: string; netWorth: number }[],
  range: TimeRange,
) {
  if (range !== "6M" && range !== "1Y" && range !== "ALL") return points;

  const closingPoints = new Map<string, (typeof points)[number]>();

  for (const point of points) {
    const bucket =
      range === "6M"
        ? format(
            startOfWeek(parseISO(point.date), { weekStartsOn: 1 }),
            "yyyy-MM-dd",
          )
        : point.date.slice(0, 7);

    closingPoints.set(bucket, point);
  }

  return Array.from(closingPoints.values());
}

function visibleTransactionJoinFilter(
  userId: string,
  startDate: Date,
  endDate: Date,
) {
  return and(
    eq(Transaction.userId, userId),
    eq(Transaction.hidden, false),
    eq(FinancialAccount.hidden, false),
    gte(Transaction.postedDate, startDate),
    lte(Transaction.postedDate, endDate),
  );
}

export const cashflowRouter = {
  getSummary: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const result = await ctx.db
        .select({
          income: sql<string>`COALESCE(SUM(CASE WHEN ${Transaction.amount}::numeric > 0 THEN ${Transaction.amount}::numeric ELSE 0 END), 0)`,
          expenses: sql<string>`COALESCE(SUM(CASE WHEN ${Transaction.amount}::numeric < 0 THEN ABS(${Transaction.amount}::numeric) ELSE 0 END), 0)`,
        })
        .from(Transaction)
        .innerJoin(
          FinancialAccount,
          eq(Transaction.accountId, FinancialAccount.id),
        )
        .where(
          visibleTransactionJoinFilter(ctx.session.user.id, startDate, endDate),
        );

      const income = parseNumeric(result[0]?.income);
      const expenses = parseNumeric(result[0]?.expenses);

      return { income, expenses, net: income - expenses };
    }),

  getByCategory: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const result = await ctx.db
        .select({
          category: sql<string>`COALESCE(${Transaction.spendingCategory}::text, 'Uncategorized')`,
          income: sql<string>`COALESCE(SUM(CASE WHEN ${Transaction.amount}::numeric > 0 THEN ${Transaction.amount}::numeric ELSE 0 END), 0)`,
          expenses: sql<string>`COALESCE(SUM(CASE WHEN ${Transaction.amount}::numeric < 0 THEN ABS(${Transaction.amount}::numeric) ELSE 0 END), 0)`,
        })
        .from(Transaction)
        .innerJoin(
          FinancialAccount,
          eq(Transaction.accountId, FinancialAccount.id),
        )
        .where(
          visibleTransactionJoinFilter(ctx.session.user.id, startDate, endDate),
        )
        .groupBy(
          sql`COALESCE(${Transaction.spendingCategory}::text, 'Uncategorized')`,
        )
        .orderBy(
          sql`COALESCE(SUM(CASE WHEN ${Transaction.amount}::numeric < 0 THEN ABS(${Transaction.amount}::numeric) ELSE 0 END), 0) DESC`,
        );

      return result.map((row) => ({
        category: row.category,
        income: parseNumeric(row.income),
        expenses: parseNumeric(row.expenses),
      }));
    }),

  getOverTime: protectedProcedure
    .input(
      dateRangeSchema.extend({
        granularity: z.enum(["week", "month"]).default("month"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, granularity } = input;

      const intervals =
        granularity === "month"
          ? eachMonthOfInterval({ start: startDate, end: endDate })
          : eachWeekOfInterval({ start: startDate, end: endDate });

      const periodStart =
        granularity === "month"
          ? sql<string>`TO_CHAR(DATE_TRUNC('month', ${Transaction.postedDate}), 'YYYY-MM-DD')`
          : sql<string>`TO_CHAR(DATE_TRUNC('week', ${Transaction.postedDate} + INTERVAL '1 day') - INTERVAL '1 day', 'YYYY-MM-DD')`;

      const totals = await ctx.db
        .select({
          periodStart,
          income: sql<string>`COALESCE(SUM(CASE WHEN ${Transaction.amount}::numeric > 0 THEN ${Transaction.amount}::numeric ELSE 0 END), 0)`,
          expenses: sql<string>`COALESCE(SUM(CASE WHEN ${Transaction.amount}::numeric < 0 THEN ABS(${Transaction.amount}::numeric) ELSE 0 END), 0)`,
        })
        .from(Transaction)
        .innerJoin(
          FinancialAccount,
          eq(Transaction.accountId, FinancialAccount.id),
        )
        .where(
          visibleTransactionJoinFilter(ctx.session.user.id, startDate, endDate),
        )
        .groupBy(periodStart)
        .orderBy(periodStart);

      // Weekly keys must use the week-numbering year (YYYY, not yyyy) so dates
      // on either side of Jan 1 in the same week share one bucket key.
      const formatKey = granularity === "month" ? "yyyy-MM" : "YYYY-'W'ww";
      const formatOptions = { useAdditionalWeekYearTokens: true };

      const buckets = new Map<
        string,
        { income: number; expenses: number; period: string; label: string }
      >();

      for (const intervalStart of intervals) {
        const bucketKey = format(intervalStart, "yyyy-MM-dd");
        const key = format(intervalStart, formatKey, formatOptions);
        const weekEnd = endOfWeek(intervalStart, { weekStartsOn: 0 });
        const label =
          granularity === "month"
            ? format(intervalStart, "MMM yyyy")
            : `${format(intervalStart, "MMM d")}-${format(weekEnd, "d")}`;
        buckets.set(bucketKey, {
          income: 0,
          expenses: 0,
          period: key,
          label,
        });
      }

      for (const total of totals) {
        const bucket = buckets.get(total.periodStart);
        if (bucket) {
          bucket.income = parseNumeric(total.income);
          bucket.expenses = parseNumeric(total.expenses);
        }
      }

      return Array.from(buckets.values()).sort((a, b) =>
        a.period.localeCompare(b.period),
      );
    }),

  getNetWorthHistory: protectedProcedure
    .input(
      z.object({
        range: timeRangeSchema.default("1M"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = resolveStartDate(input.range);

      const snapshots = await ctx.db
        .select({
          date: BalanceSnapshot.date,
          netWorth: sql<string>`SUM(${BalanceSnapshot.balance}::numeric)`,
        })
        .from(BalanceSnapshot)
        .innerJoin(
          FinancialAccount,
          eq(BalanceSnapshot.accountId, FinancialAccount.id),
        )
        .where(
          and(
            eq(BalanceSnapshot.userId, ctx.session.user.id),
            eq(BalanceSnapshot.source, CAPTURED_BALANCE_SOURCE),
            eq(FinancialAccount.hidden, false),
            gte(BalanceSnapshot.date, toUtcDateKey(startDate)),
          ),
        )
        .groupBy(BalanceSnapshot.date)
        .orderBy(BalanceSnapshot.date);

      const points = snapshots.map((s) => ({
        date: s.date,
        netWorth: parseNumeric(s.netWorth),
      }));

      return collapseNetWorthHistory(points, input.range);
    }),
} satisfies TRPCRouterRecord;
