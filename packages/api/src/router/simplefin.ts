// packages/api/src/router/simplefin.ts
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { eq } from "@finsight/db";
import { Connection } from "@finsight/db/schema";

import { protectedProcedure } from "../trpc";

async function fetchWithAuth(accessUrl: string) {
  const parsedUrl = new URL(accessUrl);
  const username = parsedUrl.username;
  const password = parsedUrl.password;

  // Remove credentials from URL (fetch doesn't support user:pass@host)
  parsedUrl.username = "";
  parsedUrl.password = "";

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  return fetch(parsedUrl.toString(), {
    headers: { Authorization: authHeader },
  });
}

export const simplefinRouter = {
  linkAccount: protectedProcedure
    .input(z.object({ setupToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let claimUrl: string;
      try {
        claimUrl = Buffer.from(input.setupToken, "base64").toString("utf-8");
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid setup token format (must be base64).",
        });
      }

      // Call the Claim URL via POST to get the Access URL
      const response = await fetch(claimUrl, {
        method: "POST",
        headers: { "Content-Length": "0" }, // Required by SimpleFin docs/example
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SimpleFin Claim Error:", errorText);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to exchange token: ${errorText}`,
        });
      }

      const accessUrl = await response.text();

      await ctx.db
        .insert(Connection)
        .values({
          userId: ctx.session.user.id,
          accessUrl: accessUrl,
        })
        .onConflictDoUpdate({
          target: Connection.userId,
          set: {
            accessUrl: accessUrl,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const connection = await ctx.db.query.Connection.findFirst({
      where: eq(Connection.userId, ctx.session.user.id),
    });

    if (!connection) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "No SimpleFin connection found. Please link your account first.",
      });
    }

    const accountsRes = await fetchWithAuth(`${connection.accessUrl}/accounts`);

    if (!accountsRes.ok) {
      if (accountsRes.status === 403) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Please reconnect your account.",
        });
      }
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Fetch accounts failed: ${accountsRes.statusText}`,
      });
    }

    const json = await accountsRes.json();
    return json as Record<string, unknown>;
  }),
} satisfies TRPCRouterRecord;
