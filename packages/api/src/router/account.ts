import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import type { db as DB } from "@finsight/db/client";
import { and, eq } from "@finsight/db";
import { FinancialAccount } from "@finsight/db/schema";

import { protectedProcedure, requireFound } from "../trpc";
import { visibleAccountFilter } from "../utils";

type OwnedAccountUpdate = Partial<
  Pick<
    typeof FinancialAccount.$inferInsert,
    "accountType" | "customName" | "hidden" | "institution"
  >
>;

async function updateOwnedAccount(
  ctx: { db: typeof DB; session: { user: { id: string } } },
  accountId: string,
  data: OwnedAccountUpdate,
) {
  const [updated] = await ctx.db
    .update(FinancialAccount)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(FinancialAccount.id, accountId),
        eq(FinancialAccount.userId, ctx.session.user.id),
      ),
    )
    .returning({ id: FinancialAccount.id });

  requireFound(updated, "Account not found.");
}

export const accountRouter = {
  getAll: protectedProcedure
    .input(
      z
        .object({
          includeHidden: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const includeHidden = input?.includeHidden ?? false;

      return ctx.db.query.FinancialAccount.findMany({
        columns: {
          providerConnectionId: false,
          providerAccountId: false,
        },
        where: includeHidden
          ? eq(FinancialAccount.userId, ctx.session.user.id)
          : visibleAccountFilter(ctx.session.user.id),
        orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
      });
    }),

  updateDetails: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        customName: z.string().nullable(),
        accountType: z.string().nullable(),
        institution: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateOwnedAccount(ctx, input.accountId, {
        customName: input.customName,
        accountType: input.accountType,
        institution: input.institution,
      });
      return { success: true };
    }),

  toggleHidden: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        hidden: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateOwnedAccount(ctx, input.accountId, {
        hidden: input.hidden,
      });
      return { success: true, hidden: input.hidden };
    }),
} satisfies TRPCRouterRecord;
