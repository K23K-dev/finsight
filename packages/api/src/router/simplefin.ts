import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { eq } from "@finsight/db";
import { Connection } from "@finsight/db/schema";

import { enqueueCategorization } from "../categorization-queue";
import { linkSimpleFinAccount, syncSimpleFinUser } from "../simplefin-sync";
import { protectedProcedure } from "../trpc";

export const simplefinRouter = {
  status: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const connection = await ctx.db.query.Connection.findFirst({
      columns: { id: true },
      where: eq(Connection.userId, userId),
    });

    return {
      isConnected: connection !== undefined,
    };
  }),

  // Both mutations hand categorization to the AWS pipeline once the new
  // transactions are saved.
  linkAccount: protectedProcedure
    .input(z.object({ setupToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const result = await linkSimpleFinAccount(
        ctx.db,
        userId,
        input.setupToken,
      );
      await enqueueCategorization(userId);
      return result;
    }),

  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const result = await syncSimpleFinUser(ctx.db, userId);
    await enqueueCategorization(userId);
    return result;
  }),
} satisfies TRPCRouterRecord;
