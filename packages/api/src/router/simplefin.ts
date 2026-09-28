import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { eq } from "@finsight/db";
import { Connection } from "@finsight/db/schema";

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

  linkAccount: protectedProcedure
    .input(z.object({ setupToken: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      linkSimpleFinAccount(ctx.db, ctx.session.user.id, input.setupToken),
    ),

  sync: protectedProcedure.mutation(({ ctx }) =>
    syncSimpleFinUser(ctx.db, ctx.session.user.id),
  ),
} satisfies TRPCRouterRecord;
